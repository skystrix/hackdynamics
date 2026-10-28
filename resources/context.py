"""context.py — Chapter 17, "Assembling the Context Window".

Measures the arithmetic of the last step before generation:

  1. what a real chunk costs, measured by chunking 50 pages of an actual
     technical book at a 300-token target, and how many such chunks fit in a
     budget once the fixed costs are paid;
  2. redundancy in a packed window, measured two ways (shared 5-grams and
     mean pairwise cosine), because they disagree and the disagreement is
     the point;
  3. extractive compression, RECOMP-style: keep the sentences the query
     needs, measure the rate and whether the answer sentence survived;
  4. the prompt-cache prefix: what is static across requests, what putting
     the retrieved chunks in the wrong place costs, and why a short
     instruction block does not cache at all.

Token counts use tiktoken's cl100k_base. Every model tokenizes differently,
so treat these as the right order of magnitude and get exact numbers from
your provider's token-counting endpoint.

    PYTHONPATH=<scratch>/pylib HF_HOME=<scratch>/hf python3 context.py
"""

import itertools
import os
import re
import statistics

import tiktoken

from querygap import CORPUS, BM25, ranking, HYDE
from hybrid import rrf_scores, order_of

ENC = tiktoken.get_encoding("cl100k_base")
n_tok = lambda s: len(ENC.encode(s))

BOOK = os.path.join(os.path.dirname(os.path.abspath(__file__)), "RAG_In_Depth",
                    "essential-graphrag.pdf")

SYSTEM = (
    "You are Larkspur Airlines' support assistant. Answer only from the "
    "passages provided below. Every claim in your answer must be followed by "
    "a citation marker of the form [n] naming the passage it came from. If "
    "the passages do not contain the answer, say that you do not know and "
    "suggest contacting support; do not use general knowledge about airlines. "
    "Quote fare classes, amounts and time limits exactly as written. Keep the "
    "answer under 120 words and write in plain language, not policy language."
)
Q2 = "I couldn't take my flight, how do I get my money back?"
ANSWER_RESERVE = 300
CITE_OVERHEAD = 12   # "[3] policy/refunds.md, section 2" and a blank line


def sentences(text):
    return [s.strip() for s in re.split(r"(?<=[.!?]) +", text) if s.strip()]


def real_chunks(target=300):
    """Chunk 50 pages of a real book, so 'a chunk' is a measured quantity."""
    import pypdf

    r = pypdf.PdfReader(BOOK)
    text = re.sub(r"\s+", " ", " ".join(
        (r.pages[i].extract_text() or "") for i in range(20, 70)))
    out, cur = [], ""
    for s in re.split(r"(?<=[.!?]) ", text):
        if cur and n_tok(cur + " " + s) > target:
            out.append(cur)
            cur = s
        else:
            cur = (cur + " " + s).strip()
    if cur:
        out.append(cur)
    return text, out


def main():
    print("=" * 74)
    print("1. What a chunk costs, and what fits")
    text, chunks = real_chunks()
    ct = [n_tok(c) for c in chunks]
    print("  50 pages of a technical book: %d tokens, %d per page"
          % (n_tok(text), round(n_tok(text) / 50)))
    print("  chunked at a 300-token target: %d chunks, median %d, mean %d, max %d"
          % (len(ct), statistics.median(ct), statistics.mean(ct), max(ct)))
    larkspur = [n_tok(c) for c in CORPUS]
    print("  (the Larkspur policy passages are shorter: median %d)"
          % statistics.median(larkspur))

    sys_t, q_t = n_tok(SYSTEM), n_tok(Q2)
    chunk_cost = round(statistics.mean(ct)) + CITE_OVERHEAD
    print("\n  fixed costs: instructions %d + question %d + answer reserve %d = %d"
          % (sys_t, q_t, ANSWER_RESERVE, sys_t + q_t + ANSWER_RESERVE))
    print("  one packed chunk costs %d tokens (%d text + %d citation header)"
          % (chunk_cost, round(statistics.mean(ct)), CITE_OVERHEAD))
    print("\n  budget      free for passages   chunks that fit")
    for budget in (1000, 2000, 4000, 8000, 32000, 128000):
        free = budget - sys_t - q_t - ANSWER_RESERVE
        print("  %7d %14d %18d" % (budget, free, max(0, free // chunk_cost)))

    print("=" * 74)
    print("2. Redundancy in a packed window (Q2, top 8 after hybrid retrieval)")
    from sentence_transformers import SentenceTransformer

    bi = SentenceTransformer("sentence-transformers/all-MiniLM-L6-v2")
    E = bi.encode(CORPUS, normalize_embeddings=True)
    bm = BM25(CORPUS)
    lex = bm.score(Q2)
    den = (E @ bi.encode([Q2], normalize_embeddings=True)[0]).tolist()
    top = order_of(rrf_scores(ranking(lex), ranking(den), 60, 50))[:8]
    total = sum(n_tok(CORPUS[d]) for d in top)
    print("  packed docs %s, %d tokens" % (top, total))

    def shingles(t):
        w = re.findall(r"[a-z0-9]+", t.lower())
        return {tuple(w[i:i + 5]) for i in range(max(0, len(w) - 4))}

    seen, dup = set(), 0.0
    for d in top:
        sh = shingles(CORPUS[d])
        ov = len(sh & seen) / max(1, len(sh))
        dup += n_tok(CORPUS[d]) * ov
        seen |= sh
    pair_cos = [float(E[a] @ E[b]) for a, b in itertools.combinations(top, 2)]
    print("  lexical view : %.0f%% of tokens repeat a 5-gram already in the window"
          % (100 * dup / total))
    print("  semantic view: mean pairwise cosine %.3f (min %.3f, max %.3f)"
          % (statistics.mean(pair_cos), min(pair_cos), max(pair_cos)))
    print("  the two disagree: near-duplicate meaning is invisible to")
    print("  near-duplicate detection, which is why ingest-time dedup misses it.")

    print("=" * 74)
    print("3. Extractive compression, on a window that contains the answer")
    # Chapter 14's rewrite puts the gold policy first, so compression has
    # something worth preserving.
    den_h = (E @ bi.encode([HYDE], normalize_embeddings=True)[0]).tolist()
    top_h = order_of(rrf_scores(ranking(bm.score(HYDE)), ranking(den_h), 60, 50))[:8]
    gold, answer_bit = 7, "travel credit valid for twelve months"
    print("  packed docs %s (gold 7 present: %s)" % (top_h, gold in top_h))
    qv = bi.encode([Q2], normalize_embeddings=True)[0]
    for frac in (1.0, 0.6, 0.4, 0.25):
        before, kept = 0, []
        for d in top_h:
            sents = sentences(CORPUS[d])
            before += n_tok(CORPUS[d])
            sv = bi.encode(sents, normalize_embeddings=True)
            scored = sorted(zip((sv @ qv).tolist(), sents), key=lambda p: -p[0])
            keepset = {s for _, s in scored[:max(1, round(len(sents) * frac))]}
            kept.append(" ".join(s for s in sents if s in keepset))
        after_text = " ".join(kept)
        print("  keep %3.0f%% of sentences: %4d -> %4d tokens (%2.0f%%)   answer kept: %s"
              % (100 * frac, before, n_tok(after_text),
                 100 * n_tok(after_text) / before, answer_bit in after_text))

    print("\n  sentence scores inside the gold passage:")
    sents = sentences(CORPUS[gold])
    sv = bi.encode(sents, normalize_embeddings=True)
    for sc, s in sorted(zip((sv @ qv).tolist(), sents), key=lambda p: -p[0]):
        print("    %.3f  %s" % (sc, s[:86]))

    print("=" * 74)
    print("4. The prompt-cache prefix")
    packed = sum(n_tok(CORPUS[d]) + CITE_OVERHEAD for d in top)
    prompt = sys_t + packed + q_t
    print("  static every request (instructions): %d tokens" % sys_t)
    print("  new every request (passages + question): %d tokens" % (packed + q_t))
    print("  breakpoint after the instructions: caches %d of %d (%.0f%%)"
          % (sys_t, prompt, 100 * sys_t / prompt))
    print("  breakpoint after the passages: caches %d, reads back 0 next time,"
          % (sys_t + packed))
    print("    so every request pays the write premium on bytes never read again.")
    for m in (512, 1024, 4096):
        print("    minimum cacheable prefix %4d: %d-token instructions %s cache"
              % (m, sys_t, "would" if sys_t >= m else "do NOT"))
    big = sys_t + 8 * chunk_cost
    print("  a realistic prefix (instructions + 8 few-shot examples) is about %d"
          % big)
    print("    tokens, which clears the 512 and 1024 minimums and not the 4096 one.")

    # The check: the fixed costs must survive the budget arithmetic.
    free = 2000 - sys_t - q_t - ANSWER_RESERVE
    assert free == 2000 - (sys_t + q_t + ANSWER_RESERVE)
    assert free // chunk_cost < 2000 // chunk_cost, "fixed costs vanished"
    print("\nok")


if __name__ == "__main__":
    main()
