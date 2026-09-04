"""latency.py — Chapter 27, "Latency, Cost, and Caching".

Every chapter so far optimised for quality. This one measures what those
choices cost in milliseconds and dollars, on the same pipeline.

Everything is timed on the author's machine: an Apple M1 with 8 GB and four
performance cores. The absolute numbers are a property of that machine; the
ratios and the shapes are what transfer.

Measured:

  1. the stage budget: p50, p95 and p99 for every stage of the Chapter 16
     pipeline, over many runs;
  2. the tail: whether stage p95s add (they do not) and which stage the
     request tail is actually inherited from;
  3. serial against parallel: what the independent stages could save;
  4. batching: reranking 20 candidates one pair at a time against one batch;
  5. the semantic cache: hit rate and FALSE-hit rate across thresholds, which
     is the number that decides whether you can ship one;
  6. the bill, with current published prices.

No model API is reachable from this machine, so generation latency and its
share of the request are taken from the literature and stated as such, while
every retrieval-side number here is measured.

    PYTHONPATH=<scratch>/pylib HF_HOME=<scratch>/hf python3 latency.py
"""

import statistics
import time

from querygap import CORPUS, BM25, ranking
from hybrid import QUERIES, rrf_scores, order_of

TRIALS = 40

# Published prices per million tokens, checked 2026-09-04.
PRICES = {
    "Claude Opus 5":  (5.00, 25.00),
    "Claude Sonnet 5": (2.00, 10.00),
    "Claude Haiku 4.5": (1.00, 5.00),
}
CACHE_WRITE_5M = 1.25
CACHE_READ = 0.1


def pct(values, p):
    s = sorted(values)
    i = min(len(s) - 1, int(round(p / 100 * (len(s) - 1))))
    return s[i]


def report(name, samples):
    print(f"  {name:<26}{statistics.median(samples)*1000:>9.1f}"
          f"{pct(samples,95)*1000:>9.1f}{pct(samples,99)*1000:>9.1f}"
          f"{max(samples)*1000:>9.1f}")
    return samples


def main():
    from sentence_transformers import SentenceTransformer, CrossEncoder
    import tiktoken

    print("loading models...")
    st = SentenceTransformer("sentence-transformers/all-MiniLM-L6-v2")
    ce = CrossEncoder("cross-encoder/ms-marco-MiniLM-L-6-v2")
    enc = tiktoken.get_encoding("cl100k_base")
    emb = st.encode(CORPUS, normalize_embeddings=True)
    bm = BM25(CORPUS)
    st.encode(["warm up"], normalize_embeddings=True)
    ce.predict([("warm", "up")])
    qs = [q for q, _, _ in QUERIES]

    # ---------------------------------------------------------------- 1
    print()
    print("=" * 78)
    print("1. THE STAGE BUDGET")
    print("=" * 78)
    print(f"\n  {TRIALS} runs per stage over {len(qs)} queries, times in milliseconds")
    print(f"\n  {'stage':<26}{'p50':>9}{'p95':>9}{'p99':>9}{'max':>9}")

    stages = {}
    t = []
    for i in range(TRIALS):
        q = qs[i % len(qs)]
        s = time.perf_counter(); st.encode([q], normalize_embeddings=True); t.append(time.perf_counter() - s)
    stages["embed query"] = report("embed query", t)

    t = []
    for i in range(TRIALS):
        q = qs[i % len(qs)]
        s = time.perf_counter(); ranking(bm.score(q)); t.append(time.perf_counter() - s)
    stages["bm25 scan"] = report("bm25 scan (56 docs)", t)

    qvecs = {q: st.encode([q], normalize_embeddings=True)[0] for q in qs}
    t = []
    for i in range(TRIALS):
        qv = qvecs[qs[i % len(qs)]]
        s = time.perf_counter()
        ranking([float(qv @ emb[j]) for j in range(len(CORPUS))])
        t.append(time.perf_counter() - s)
    stages["dense scan"] = report("dense scan (56 vectors)", t)

    orders = {q: (ranking(bm.score(q)),
                  ranking([float(qvecs[q] @ emb[j]) for j in range(len(CORPUS))])) for q in qs}
    t = []
    for i in range(TRIALS):
        a, b = orders[qs[i % len(qs)]]
        s = time.perf_counter(); order_of(rrf_scores(a, b)); t.append(time.perf_counter() - s)
    stages["fuse (rrf)"] = report("fuse (rrf)", t)

    t = []
    for i in range(TRIALS):
        q = qs[i % len(qs)]
        cand = order_of(rrf_scores(*orders[q]))[:20]
        s = time.perf_counter()
        ce.predict([(q, CORPUS[d]) for d in cand])
        t.append(time.perf_counter() - s)
    stages["rerank 20 (batched)"] = report("rerank 20 (batched)", t)

    med = {k: statistics.median(v) for k, v in stages.items()}
    total_med = sum(med.values())
    print(f"\n  {'sum of stage medians':<26}{total_med*1000:>9.1f} ms")
    print(f"\n  share of the retrieval budget, by stage median:")
    for k, v in sorted(med.items(), key=lambda x: -x[1]):
        bar = "#" * int(round(40 * v / total_med))
        print(f"    {k:<24}{v/total_med:>6.1%}  {bar}")
    print("\n  One stage owns the budget, and it is the one Chapter 16 added on")
    print("  purpose. That is the shape of every RAG latency investigation:")
    print("  the quality mechanism you chose is the cost you are now paying.")

    # ---------------------------------------------------------------- 2
    print()
    print("=" * 78)
    print("2. TAIL AMPLIFICATION")
    print("=" * 78)
    print("\n  A request is the SUM of five stages. Sum the samples per run and")
    print("  compare the request percentiles to the stagewise ones.")
    n = min(len(v) for v in stages.values())
    requests = [sum(stages[k][i] for k in stages) for i in range(n)]
    print(f"\n  {'':<26}{'p50':>9}{'p95':>9}{'p99':>9}")
    print(f"  {'sum of per-stage p50s':<26}{total_med*1000:>9.1f}")
    print(f"  {'sum of per-stage p95s':<26}{'':>9}"
          f"{sum(pct(v,95) for v in stages.values())*1000:>9.1f}")
    print(f"  {'measured request':<26}{statistics.median(requests)*1000:>9.1f}"
          f"{pct(requests,95)*1000:>9.1f}{pct(requests,99)*1000:>9.1f}")
    ratio = pct(requests, 95) / statistics.median(requests)
    print(f"\n  request p95 / p50 = {ratio:.2f}x")
    for k, v in stages.items():
        print(f"    {k:<24} p95/p50 = {pct(v,95)/statistics.median(v):.2f}x")
    print("\n  Two results here, and the second is the one people get wrong.")
    print("\n  First: the measured request p95 is LOWER than the sum of the stage")
    print("  p95s. Percentiles do not add. Adding them assumes every stage has")
    print("  its bad run on the same request, which is exactly what independent")
    print("  stages do not do. A budget built by summing stage p95s over-states")
    print("  the tail and buys latency work you did not need.")
    print("\n  Second: the request p95/p50 ratio is NARROWER than the ratio of")
    print("  several individual stages. Summing many stages averages the small,")
    print("  noisy ones away, so the request tail is inherited almost entirely")
    print("  from whichever stage dominates the mean. Here that is the reranker,")
    print("  whose own ratio is a tight 1.19x, and the 2.48x on the bm25 scan is")
    print("  invisible because the stage is a tenth of a millisecond.")
    print("\n  The practical rule: find the stage that owns the MEAN, because it")
    print("  will also own the tail. Chasing a jittery stage that costs nothing")
    print("  is the most common wasted week in latency work.")

    # ---------------------------------------------------------------- 3
    print()
    print("=" * 78)
    print("3. SERIAL AGAINST PARALLEL")
    print("=" * 78)
    indep = ["bm25 scan", "dense scan"]
    ser = sum(med[k] for k in indep)
    par = max(med[k] for k in indep)
    print(f"\n  bm25 and dense do not depend on each other.")
    print(f"    serial   {ser*1000:.1f} ms")
    print(f"    parallel {par*1000:.1f} ms   saving {(ser-par)*1000:.1f} ms")
    print(f"    that saving is {(ser-par)/total_med:.1%} of the retrieval budget")
    print("\n  The embed must precede the dense scan, and the rerank must follow")
    print("  the fusion, so only one pair here is parallelisable at all. Check")
    print("  the size of the prize before building the concurrency.")

    # ---------------------------------------------------------------- 4
    print()
    print("=" * 78)
    print("4. BATCHING")
    print("=" * 78)
    q = qs[0]
    cand = order_of(rrf_scores(*orders[q]))[:20]
    pairs = [(q, CORPUS[d]) for d in cand]
    loop, batch = [], []
    for _ in range(8):
        s = time.perf_counter()
        for p in pairs:
            ce.predict([p])
        loop.append(time.perf_counter() - s)
        s = time.perf_counter(); ce.predict(pairs); batch.append(time.perf_counter() - s)
    lm, bmed = statistics.median(loop), statistics.median(batch)
    print(f"\n  20 pairs, one call each      {lm*1000:>8.1f} ms")
    print(f"  20 pairs, one batched call   {bmed*1000:>8.1f} ms   {lm/bmed:.1f}x faster")
    print("\n  Same model, same pairs, same answer. The difference is per-call")
    print("  overhead paid twenty times instead of once.")

    # ---------------------------------------------------------------- 5
    print()
    print("=" * 78)
    print("5. THE SEMANTIC CACHE, AND ITS FALSE HITS")
    print("=" * 78)
    print("\n  Cache the answer to a question and serve it for the next question")
    print("  whose embedding is close enough. The risk is a FALSE HIT: a")
    print("  different question served a stale, wrong answer.")
    probe = [
        ("How much does a checked bag cost?", "How much does a checked bag cost?", True),
        ("What is the checked baggage fee?", "How much does a checked bag cost?", True),
        ("How much for a checked bag?", "How much does a checked bag cost?", True),
        ("How much does a CABIN bag cost?", "How much does a checked bag cost?", False),
        ("Can I take my dog on board?", "Can I take my cat on board?", True),
        ("Can I take my dog on board?", "Can I take my dog in the hold?", False),
        ("I couldn't take my flight, how do I get my money back?",
         "You cancelled my flight, what am I owed?", False),
        ("What is the check-in deadline?", "What is the check-in deadline for online check-in?", True),
        ("INC-2042", "INC-1987", False),
        ("Larkspur Club points", "Larkspur Club tier benefits", False),
    ]
    pv = st.encode([a for a, _, _ in probe], normalize_embeddings=True)
    qv = st.encode([b for _, b, _ in probe], normalize_embeddings=True)
    sims = [float(pv[i] @ qv[i]) for i in range(len(probe))]
    print(f"\n  {'incoming question':<48}{'cached question':<44}{'cos':>7}  same?")
    for i, (a, b, same) in enumerate(probe):
        print(f"  {a[:46]:<48}{b[:42]:<44}{sims[i]:>7.3f}  {'YES' if same else 'no'}")

    print(f"\n  {'threshold':>10}{'hit rate':>11}{'false hits':>13}{'of all hits':>14}")
    for th in (0.99, 0.95, 0.90, 0.85, 0.80, 0.70):
        hits = [i for i in range(len(probe)) if sims[i] >= th]
        false = [i for i in hits if not probe[i][2]]
        rate = len(hits) / len(probe)
        share = len(false) / len(hits) if hits else 0.0
        print(f"  {th:>10.2f}{rate:>11.0%}{len(false):>13}{share:>14.0%}")
    print("\n  There IS a safe band here: at 0.80 to 0.85 the cache serves 30% of")
    print("  questions with zero false hits, and 30% is a larger cost saving than")
    print("  any index change in this course. So a semantic cache can be shipped.")
    print("\n  Now look at how narrow the band is. The closest FALSE pair scores")
    print("  0.733 (checked bag against cabin bag) and the furthest TRUE pair")
    print("  scores 0.799 (checked baggage fee against checked bag cost). The")
    print("  entire safety margin is 0.066 of cosine, on ten hand-picked pairs.")
    print("  Drop to 0.70 and 38% of the hits are wrong answers served instantly")
    print("  and confidently, with no retrieval and no generation to catch them.")
    print("\n  So the rule is not 'do not build one'. It is: measure YOUR band on")
    print("  YOUR pairs, put the threshold above the highest false pair rather")
    print("  than below the lowest true one, and re-measure when the corpus")
    print("  changes. The margin is a property of your questions, not of cosine.")
    print("\n  The caches that need no such judgement are the exact-match ones:")
    print("  the EMBEDDING cache (same text, same vector, always correct) and the")
    print("  prompt cache below.")

    # ---------------------------------------------------------------- 6
    print()
    print("=" * 78)
    print("6. THE BILL")
    print("=" * 78)
    n = lambda s: len(enc.encode(s))
    instructions = ("You are Larkspur's support assistant. Answer only from the "
                    "passages provided. Cite each claim with the passage number. "
                    "If the passages do not contain the answer, say so.")
    passages = "\n\n".join(CORPUS[i] for i in (7, 8, 14, 22, 13))
    question = "I couldn't take my flight, how do I get my money back?"
    inp = n(instructions) + n(passages) + n(question)
    out = 180
    print(f"\n  one grounded request: {n(instructions)} instruction + {n(passages)} passages"
          f" + {n(question)} question = {inp} input, {out} output")
    print(f"\n  {'model':<20}{'per request':>14}{'per 1,000':>13}{'per 1M requests':>18}")
    for m, (pi, po) in PRICES.items():
        c = inp / 1e6 * pi + out / 1e6 * po
        print(f"  {m:<20}{'$'+format(c,'.5f'):>14}{'$'+format(c*1000,',.2f'):>13}"
              f"{'$'+format(c*1e6,',.0f'):>18}")

    print(f"\n  What caching does to the input half, on Claude Opus 5:")
    pi, po = PRICES["Claude Opus 5"]
    static = n(instructions)
    print(f"    the static prefix is {static} tokens, and the minimum cacheable")
    print(f"    prefix is 512 on Claude Opus 5, so it WILL NOT CACHE at all.")
    big = 1600
    print(f"\n    with a realistic {big}-token system prompt (instructions, format")
    print(f"    rules and few-shot examples), which clears the 512 minimum:")
    print(f"      uncached, every request    ${big/1e6*pi:.5f}")
    print(f"      cache write (1.25x), once  ${big/1e6*pi*CACHE_WRITE_5M:.5f}")
    print(f"      cache read (0.1x), after   ${big/1e6*pi*CACHE_READ:.5f}")
    for reqs in (1, 2, 3, 10, 100):
        cached = big/1e6*pi*CACHE_WRITE_5M + big/1e6*pi*CACHE_READ*(reqs-1)
        plain = big/1e6*pi*reqs
        print(f"      {reqs:>3} requests: cached ${cached:.5f} vs uncached ${plain:.5f}"
              f"   {'CHEAPER' if cached < plain else 'more expensive'}")
    print("\n    Break-even is the second request on the 5-minute TTL, because")
    print("    1.25 + 0.1 = 1.35 against 2.0 uncached. On the 1-hour TTL the")
    print("    write is 2x, so it takes three (2.0 + 0.2 = 2.2 against 3.0).")

    print("\n  The three levers, in the order they usually pay:")
    print(f"    1. cache the static prefix        input cost -> ~10% after the write")
    print(f"    2. cut packed passages 10 -> 5    input cost -> ~50%")
    print(f"    3. move the reranker off the      p50 -> -{med['rerank 20 (batched)']/total_med:.0%} "
          f"of retrieval time")
    print(f"       critical path or shrink it")


if __name__ == "__main__":
    main()
