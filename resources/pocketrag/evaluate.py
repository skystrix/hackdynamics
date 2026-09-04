"""PocketRAG, layer 5b: the evaluation harness.  Chapter 36.

Scores the four retrievers PocketRAG can assemble against the gold set, then
scores the answers the whole pipeline produces. Chapter 25 defined the
retrieval metrics and Chapter 26 the answer metrics; this runs them on our own
output, which is the first time in the capstone that a number can say the
system got worse.

  recall@k   did the relevant passage reach the list at all
  MRR@10     how far down was the first relevant one
  nDCG@10    graded, position-discounted, the only metric that uses the 1s

Answer-level, over the whole pipeline:

  refusal    of the 15 unanswerable queries, how many were refused
  false      of the 105 answerable ones, how many were refused anyway
  cited      of the answers produced, how many carry citations that resolve
  faithful   NLI entailment of each answer sentence by the passage it cites
             (cross-encoder/nli-distilroberta-base, the Chapter 26 judge)

    python3 evaluate.py <db>                  retrieval + answers, all systems
    python3 evaluate.py <db> --baseline out.json    write a regression baseline
    python3 evaluate.py <db> --against out.json     compare against one
"""
import array, json, math, sqlite3, sys, time

import gold
from answer import (rrf, rewrite, allowed, rerank, pack, extractive_answer,
                    verify, build_prompt, K_CANDIDATES, K_RERANK, REFUSE_BELOW)

KS = (1, 3, 5, 10)


# ------------------------------------------------------------------ metrics
def recall_at(ranked: list[str], judged: dict[str, int], k: int) -> float:
    """Fraction of the judged-relevant passages that appear in the top k.
    Graded judgments collapse to binary here, which is the point of having
    nDCG as well: recall cannot tell a 2 from a 1."""
    rel = {c for c, g in judged.items() if g > 0}
    if not rel:
        return float("nan")
    return len(rel & set(ranked[:k])) / len(rel)


def rr(ranked: list[str], judged: dict[str, int], k: int = 10) -> float:
    """Reciprocal rank of the first relevant passage, 0 if none in the top k."""
    for pos, cid in enumerate(ranked[:k], 1):
        if judged.get(cid, 0) > 0:
            return 1.0 / pos
    return 0.0


def ndcg_at(ranked: list[str], judged: dict[str, int], k: int = 10) -> float:
    """Graded gain, discounted by log position, over the best achievable order.
    This is the metric that notices a 1 ranked above a 2."""
    if not judged:
        return float("nan")
    dcg = sum(judged.get(cid, 0) / math.log2(pos + 1)
              for pos, cid in enumerate(ranked[:k], 1))
    ideal = sorted(judged.values(), reverse=True)[:k]
    idcg = sum(g / math.log2(pos + 1) for pos, g in enumerate(ideal, 1))
    return dcg / idcg if idcg else float("nan")


def mean(xs):
    xs = [x for x in xs if x == x]          # drop the NaNs from unjudged queries
    return sum(xs) / len(xs) if xs else float("nan")


# ------------------------------------------------------------------ systems
def rankings(db, query: str, model, graph, keep: set[str]) -> dict[str, list[str]]:
    """The four retrievers, sharing one query encode. Returns full ranked lists
    so every k can be scored from one run."""
    from bm25 import search as bm25_search
    lex_lists, dense_lists = [], []
    for shape in rewrite(query):
        lex_lists.append([c for c, _ in bm25_search(db, shape, k=None) if c in keep])
        qv = array.array("f", model.encode([shape], normalize_embeddings=True)[0].tolist())
        dense_lists.append([c for c, _ in graph.search(qv, k=len(keep), ef=128) if c in keep])
    return {"bm25": lex_lists[0],
            "vector": dense_lists[0],
            "rrf": [c for c, _ in rrf(lex_lists + dense_lists)]}


def run_retrieval(db, model, ce, graph, gold_set, keep, candidates=K_CANDIDATES):
    """Every system's ranked list for every query, plus the rerank of the RRF
    candidates. One pass, so the cross-encoder is paid for once."""
    out = []
    for query, judged, klass in gold_set:
        lists = rankings(db, query, model, graph, keep)
        cands = lists["rrf"][:candidates]
        ranked = rerank(db, query, cands, ce, k=len(cands))
        lists["rerank"] = [c for c, _ in ranked]
        out.append({"query": query, "klass": klass, "judged": judged,
                    "lists": lists, "top_score": ranked[0][1] if ranked else float("-inf"),
                    "reranked": ranked[:K_RERANK]})
    return out


def score(runs, system: str) -> dict:
    scored = [r for r in runs if r["judged"]]
    m = {f"recall@{k}": mean([recall_at(r["lists"][system], r["judged"], k) for r in scored])
         for k in KS}
    m["mrr@10"] = mean([rr(r["lists"][system], r["judged"]) for r in scored])
    m["ndcg@10"] = mean([ndcg_at(r["lists"][system], r["judged"]) for r in scored])
    return m


def by_class(runs, system: str) -> dict:
    classes = sorted({r["klass"] for r in runs if r["judged"]})
    return {k: mean([ndcg_at(r["lists"][system], r["judged"])
                     for r in runs if r["judged"] and r["klass"] == k])
            for k in classes}


# ------------------------------------------------------------------ answers
def judge_faithfulness(nli, claim: str, passage: str) -> float:
    """Entailment probability of the claim by the passage it cites. Chapter 26
    used this model; a purpose-built hallucination judge would be better and
    the chapter says so."""
    import numpy as np
    logits = nli.predict([(passage, claim)])[0]
    e = np.exp(logits - np.max(logits))
    return float((e / e.sum())[nli.config.label2id.get("entailment", 1)])


def run_answers(db, runs, nli=None):
    """The whole pipeline's behaviour per query: refuse or answer, and if it
    answers, whether the citations resolve and whether the passage entails."""
    out = []
    for r in runs:
        answerable = bool(r["judged"])
        refused = r["top_score"] < REFUSE_BELOW
        rec = {"query": r["query"], "klass": r["klass"], "answerable": answerable,
               "refused": refused, "top_score": r["top_score"],
               "citations": 0, "resolved": 0, "entail": None, "hit": None}
        if not refused:
            packed = pack(db, r["reranked"])
            res = {"packed": packed, "text": extractive_answer(packed, r["reranked"])}
            checks = verify(res)
            rec["citations"] = len(checks)
            rec["resolved"] = sum(1 for _, ok, _ in checks if ok)
            # did the answer quote a passage the labels call relevant
            quoted = {cid for n, cid, _ in packed
                      if f"[{n}]" in res["text"]}
            rec["hit"] = any(r["judged"].get(c, 0) == 2 for c in quoted) if answerable else None
            if nli is not None and packed:
                by_n = {n: t for n, _, t in packed}
                scores = [judge_faithfulness(nli, claim, by_n[n])
                          for n, ok, claim in checks if ok and n in by_n]
                rec["entail"] = mean(scores) if scores else None
        out.append(rec)
    return out


def answer_summary(answers) -> dict:
    unans = [a for a in answers if not a["answerable"]]
    ans = [a for a in answers if a["answerable"]]
    produced = [a for a in answers if not a["refused"]]
    cited = sum(a["citations"] for a in produced)
    resolved = sum(a["resolved"] for a in produced)
    ents = [a["entail"] for a in produced if a["entail"] is not None]
    return {
        "refused_correctly": sum(1 for a in unans if a["refused"]),
        "unanswerable": len(unans),
        "false_refusals": sum(1 for a in ans if a["refused"]),
        "answerable": len(ans),
        "answers_quoting_a_relevant_passage": sum(1 for a in ans
                                                  if not a["refused"] and a["hit"]),
        "answers_produced": len(produced),
        "citations": cited,
        "citations_resolved": resolved,
        "faithfulness": mean(ents) if ents else float("nan"),
    }


# ------------------------------------------------------------------- sweep
def sweep(runs):
    """What the refusal threshold can and cannot buy. Reported as balanced
    accuracy because the set is 105 answerable against 15 unanswerable, and
    plain accuracy on that split rewards a system that never refuses.

    Also the AUC of the score as an answerability signal, which is the
    question the threshold is really asking: over every (answerable,
    unanswerable) pair, how often is the answerable one scored higher."""
    ans = [r["top_score"] for r in runs if r["judged"]]
    un = [r["top_score"] for r in runs if not r["judged"]]
    rows = []
    for i in range(-240, 170):
        t = i / 10
        tpr = sum(1 for s in ans if s >= t) / len(ans)
        tnr = sum(1 for s in un if s < t) / len(un)
        rows.append((t, (tpr + tnr) / 2, tpr, tnr))
    pairs = [(a, u) for a in ans for u in un]
    auc = (sum(1 for a, u in pairs if a > u)
           + 0.5 * sum(1 for a, u in pairs if a == u)) / len(pairs)
    overlap = (min(ans), max(un))
    return {"rows": rows, "auc": auc, "overlap": overlap,
            "best": max(rows, key=lambda r: r[1]),
            "in_overlap": (sum(1 for s in ans if s <= overlap[1]),
                           sum(1 for s in un if s >= overlap[0]))}


# --------------------------------------------------------------- regression
def snapshot(runs, answers) -> dict:
    """What a regression runner stores: the aggregates, plus per-query nDCG so
    a mean that did not move can still be shown to hide two changes that
    cancelled (chapter 25)."""
    return {
        "systems": {s: score(runs, s) for s in ("bm25", "vector", "rrf", "rerank")},
        "answers": answer_summary(answers),
        "per_query": {r["query"]: round(ndcg_at(r["lists"]["rerank"], r["judged"]), 6)
                      for r in runs if r["judged"]},
    }


def compare(old: dict, new: dict, tol: float = 0.02):
    """A regression is a per-query drop, not a mean that moved."""
    print("\n  system means")
    for s, metrics in new["systems"].items():
        o = old["systems"].get(s, {})
        d = metrics["ndcg@10"] - o.get("ndcg@10", metrics["ndcg@10"])
        print(f"    {s:8s} nDCG@10 {metrics['ndcg@10']:.4f}  ({d:+.4f})")
    ups = downs = 0
    print("\n  per-query changes beyond +-%.2f" % tol)
    for q, v in new["per_query"].items():
        o = old["per_query"].get(q)
        if o is None or abs(v - o) <= tol:
            continue
        (ups := ups + 1) if v > o else (downs := downs + 1)
        print(f"    {v - o:+.3f}  {q[:64]}")
    print(f"\n  {ups} queries improved, {downs} regressed")
    return downs


def main(argv):
    db = sqlite3.connect(argv[1])
    gold_set = gold.load(db)
    from sentence_transformers import SentenceTransformer, CrossEncoder
    from hnsw import HNSW, load_vectors
    from embed import MODEL
    model = SentenceTransformer(MODEL)
    ce = CrossEncoder("cross-encoder/ms-marco-MiniLM-L-6-v2")
    graph = HNSW.load(db, load_vectors(db))
    keep = allowed(db, "staff")

    cand = int(argv[argv.index("--candidates") + 1]) if "--candidates" in argv else K_CANDIDATES
    t0 = time.perf_counter()
    runs = run_retrieval(db, model, ce, graph, gold_set, keep, cand)
    print(f"  {len(runs)} queries through 4 systems, {cand} candidates, in {time.perf_counter() - t0:.1f}s")

    print("\n  retrieval, over the 105 queries with judgments")
    head = "  {:8s}" + "".join(f"  R@{k:<4d}" for k in KS) + "  MRR@10  nDCG@10"
    print(head.format("system"))
    for s in ("bm25", "vector", "rrf", "rerank"):
        m = score(runs, s)
        row = "  {:8s}".format(s) + "".join(f"  {m[f'recall@{k}']:.3f} " for k in KS)
        print(row + f"  {m['mrr@10']:.4f}  {m['ndcg@10']:.4f}")

    print("\n  nDCG@10 by query class, best system")
    for k, v in sorted(by_class(runs, "rerank").items(), key=lambda kv: kv[1]):
        print(f"    {k:14s} {v:.4f}")

    sw = sweep(runs)
    lo, hi = sw["overlap"]
    print(f"\n  the refusal threshold, swept")
    print(f"    answerable scores bottom out at {lo:+.3f}, unanswerable reach {hi:+.3f}")
    print(f"    the ranges overlap over [{lo:+.3f}, {hi:+.3f}], holding "
          f"{sw['in_overlap'][0]} answerable and {sw['in_overlap'][1]} unanswerable")
    print(f"    AUC of the score as an answerability signal: {sw['auc']:.3f}")
    t, ba, tpr, tnr = sw["best"]
    print(f"    best balanced accuracy {ba:.3f} at {t:+.1f} "
          f"(answers {tpr * 100:.0f}% of answerable, refuses {tnr * 100:.0f}% of unanswerable)")
    cur = next(r for r in sw["rows"] if abs(r[0] - REFUSE_BELOW) < 0.05)
    print(f"    shipped threshold {REFUSE_BELOW:+.1f}: balanced accuracy {cur[1]:.3f}")

    nli = CrossEncoder("cross-encoder/nli-distilroberta-base")
    answers = run_answers(db, runs, nli)
    print("\n  answers, whole pipeline")
    for k, v in answer_summary(answers).items():
        print(f"    {k:38s} {v if isinstance(v, int) else round(v, 4)}")

    snap = snapshot(runs, answers)
    if "--baseline" in argv:
        path = argv[argv.index("--baseline") + 1]
        json.dump(snap, open(path, "w"), indent=1)
        print(f"\n  baseline written to {path}")
    if "--against" in argv:
        downs = compare(json.load(open(argv[argv.index("--against") + 1])), snap)
        print("  REGRESSION" if downs else "  no regression")
    return snap


if __name__ == "__main__":
    main(sys.argv)
