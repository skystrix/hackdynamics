"""PocketRAG, layer 4: hybrid retrieval, reranking, and cited answers.  Ch 35.

Reads the three indexes the earlier layers built and produces an answer whose
every sentence carries a citation that resolves, or a refusal. The pieces:

  rewrite   one extra query shape (chapter 14)
  fuse      reciprocal rank fusion of BM25 and HNSW (chapter 15)
  rerank    a cross-encoder cascade, 50 candidates down to 8 (chapter 16)
  pack      ends-first into a token budget (chapter 17)
  answer    numbered citations, refusal on low support (chapter 18)
  verify    every citation checked against the chunk it names

The two model calls (embedding the query, cross-encoding pairs) are Python
only, as in chapter 34. Everything else is retrieval logic and exists in both
languages.

    python3 answer.py <db> "a question" [--user passenger|contractor|staff]
"""
import re, sqlite3, sys

K_CANDIDATES, K_RERANK, K_CONTEXT = 50, 8, 5
CONTEXT_TOKENS = 900
REFUSE_BELOW = 2.0        # cross-encoder logit; calibrated in the chapter
QUOTE_ABOVE = 2.0         # only passages this relevant are quoted back

USERS = {"passenger": {"public"},
         "contractor": {"public", "tickets"},
         "staff": {"public", "tickets", "internal"}}


# ------------------------------------------------------------------ rewrite
def rewrite(query: str) -> list[str]:
    """Chapter 14 measured five strategies; PocketRAG ships one. A statement
    shaped like the corpus retrieves better than a question shaped like a
    user, so search for both and let fusion sort it out."""
    stripped = re.sub(r"^(can|could|do|does|how|what|when|where|which|who|why|is|are)\b\s*",
                      "", query.strip(), flags=re.I)
    stripped = re.sub(r"\?+$", "", stripped).strip()
    return [query] if not stripped or stripped.lower() == query.lower() else [query, stripped]


# --------------------------------------------------------------------- fuse
def rrf(rankings: list[list[str]], k: int = 60) -> list[tuple[str, float]]:
    """Reciprocal rank fusion: rank position only, never raw scores, because
    BM25 logits and cosines are not on a common scale (chapter 15)."""
    fused: dict[str, float] = {}
    for ranking in rankings:
        for pos, cid in enumerate(ranking, 1):
            fused[cid] = fused.get(cid, 0.0) + 1.0 / (k + pos)
    return sorted(fused.items(), key=lambda kv: -kv[1])


# ------------------------------------------------------------------ filters
def allowed(db: sqlite3.Connection, user: str) -> set[str]:
    labels = USERS[user]
    return {cid for cid, lab in db.execute("SELECT chunk_id, label FROM chunks")
            if lab in labels}


def retrieve(db, query: str, user: str = "staff", k: int = K_CANDIDATES,
             model=None) -> list[str]:
    """Both retrievers, both query shapes, fused. The permission filter is
    applied to the candidate set before ranking (chapter 28's pre-filter)."""
    from bm25 import search as bm25_search
    from hnsw import HNSW, load_vectors
    import array

    keep = allowed(db, user)
    rankings = []
    vecs = load_vectors(db)
    graph = HNSW.load(db, vecs)
    for shape in rewrite(query):
        lex = [cid for cid, _ in bm25_search(db, shape, k=None) if cid in keep]
        rankings.append(lex[:k])
        if model is not None:
            qv = array.array("f", model.encode([shape], normalize_embeddings=True)[0].tolist())
            dense = [cid for cid, _ in graph.search(qv, k=k * 2, ef=128) if cid in keep]
            rankings.append(dense[:k])
    return [cid for cid, _ in rrf(rankings)][:k]


# ------------------------------------------------------------------- rerank
def rerank(db, query: str, candidates: list[str], ce, k: int = K_RERANK):
    """The cascade: a cheap retriever proposes many, an expensive model orders
    a few. Returns [(chunk_id, score)] with the cross-encoder's raw logit,
    which is also the refusal signal."""
    if not candidates:
        return []
    texts = {cid: t for cid, t in db.execute(
        "SELECT chunk_id, text FROM chunks WHERE chunk_id IN (%s)"
        % ",".join("?" * len(candidates)), candidates)}
    scores = ce.predict([(query, texts[c]) for c in candidates])
    ranked = sorted(zip(candidates, (float(s) for s in scores)), key=lambda p: -p[1])
    return ranked[:k]


# --------------------------------------------------------------------- pack
def pack(db, ranked, budget: int = CONTEXT_TOKENS, k: int = K_CONTEXT):
    """Ends-first ordering: best at the start and the end, weakest buried in
    the middle, because chapter 17 measured that the middle is where a model
    stops looking. Returns [(n, chunk_id, text)] numbered for citation."""
    from ingest import ntokens
    chosen, used = [], 0
    for cid, _ in ranked[:k]:
        text = db.execute("SELECT text FROM chunks WHERE chunk_id=?", (cid,)).fetchone()[0]
        n = ntokens(text)
        if used + n > budget:
            break
        chosen.append((cid, text)); used += n
    front, back = [], []
    for i, item in enumerate(chosen):
        (front if i % 2 == 0 else back).append(item)
    ordered = front + back[::-1]
    return [(i + 1, cid, text) for i, (cid, text) in enumerate(ordered)]


PROMPT = (
    "Answer the question using only the numbered passages. Cite every sentence "
    "with the passage number in square brackets. If the passages do not contain "
    "the answer, reply exactly: NOT IN THE CORPUS.\n\n"
    "{passages}\n\nQuestion: {question}\nAnswer:")


def build_prompt(packed, question: str) -> str:
    body = "\n\n".join(f"[{n}] {text}" for n, _, text in packed)
    return PROMPT.format(passages=body, question=question)


# ------------------------------------------------------------------- answer
def extractive_answer(packed, ranked) -> str:
    """The generator PocketRAG ships: no model, no API, and every sentence is
    copied from a passage, so grounding is guaranteed by construction. A real
    deployment sends build_prompt() to a model; the chapter shows both."""
    best = {cid: s for cid, s in ranked}
    strong = [p for p in packed if best.get(p[1], 0.0) >= QUOTE_ABOVE]
    picked = sorted(strong, key=lambda p: -best.get(p[1], 0.0))[:2]
    out = []
    for n, _, text in picked:
        first = re.split(r"(?<=[.!?])\s+", text.strip())
        sentence = " ".join(first[1:3]) if len(first) > 2 else first[-1]
        out.append(f"{sentence.strip()} [{n}]")
    return " ".join(out)


def answer(db, question: str, user: str = "staff", model=None, ce=None) -> dict:
    cands = retrieve(db, question, user, model=model)
    ranked = rerank(db, question, cands, ce) if ce else [(c, 0.0) for c in cands[:K_RERANK]]
    top = ranked[0][1] if ranked else float("-inf")
    if top < REFUSE_BELOW:
        return {"refused": True, "top_score": top, "citations": [],
                "text": "NOT IN THE CORPUS.", "packed": []}
    packed = pack(db, ranked)
    return {"refused": False, "top_score": top, "packed": packed,
            "text": extractive_answer(packed, ranked),
            "prompt": build_prompt(packed, question),
            "citations": [n for n, _, _ in packed]}


# ------------------------------------------------------------------- verify
def verify(result: dict) -> list[tuple[int, bool, str]]:
    """Every bracketed number must name a packed passage, and the sentence it
    marks must actually appear in that passage. A citation nobody checks is
    decoration (chapter 18)."""
    by_n = {n: text for n, _, text in result["packed"]}
    out = []
    for sentence in re.split(r"(?<=\])\s+", result["text"]):
        nums = [int(x) for x in re.findall(r"\[(\d+)\]", sentence)]
        claim = re.sub(r"\s*\[\d+\]", "", sentence).strip()
        if not nums:
            out.append((0, False, claim)); continue
        for n in nums:
            out.append((n, n in by_n and claim and claim in by_n[n], claim))
    return out


def main(argv):
    db = sqlite3.connect(argv[1])
    user = argv[argv.index("--user") + 1] if "--user" in argv else "staff"
    from sentence_transformers import SentenceTransformer, CrossEncoder
    from embed import MODEL
    res = answer(db, argv[2], user, SentenceTransformer(MODEL),
                 CrossEncoder("cross-encoder/ms-marco-MiniLM-L-6-v2"))
    print(f"  user={user}  top rerank score {res['top_score']:+.3f}")
    if res["refused"]:
        print(f"  REFUSED: {res['text']}")
        return
    print(f"\n  {res['text']}\n")
    for n, ok, claim in verify(res):
        print(f"  [{n}] {'resolves' if ok else 'DOES NOT RESOLVE'}: {claim[:64]}...")


if __name__ == "__main__":
    main(sys.argv)
