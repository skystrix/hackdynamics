"""metrics.py — Chapter 25, "Measuring Retrieval".

Every retriever this course built claimed an improvement. This script scores
them properly, and most of what it finds is that the scoring is harder than
the retrieving.

Everything executes. Five real systems are run over the Chapter 15 gold set:
BM25, two different embedding models, their fusion, and a cross-encoder
rerank. Every metric is computed from the actual ranked lists.

Measured:

  1. the swap: a smaller embedding model, and what each metric says about it;
  2. the five metrics side by side, and where they disagree about which
     system is best;
  3. the lie of the mean: bootstrap confidence intervals at n=16, which is
     the size of a real team's first eval set;
  4. per-query regression, which is the report the mean hides;
  5. pooling bias: build the labels from two systems, then measure a third.

No model API is needed. Both embedding models and the cross-encoder are
local.

    PYTHONPATH=<scratch>/pylib HF_HOME=<scratch>/hf python3 metrics.py
"""

import math
import random
import statistics

from querygap import CORPUS, BM25, ranking
from hybrid import QUERIES, rrf_scores, order_of

# Graded relevance. The gold document is grade 3; documents that partly answer
# the question are 2 or 1. Written by hand, once, which is what a labelling
# session actually produces.
GRADED = {
    7: {7: 3, 8: 2, 14: 2, 18: 1, 22: 1},     # money back after not flying
    4: {4: 3, 35: 1},                          # suitcase did not arrive
    11: {11: 3},                               # dog on board
    9: {9: 3, 23: 2, 6: 1, 48: 1},             # airline cancelled the flight
    43: {43: 3},                               # wifi and cost
    6: {6: 3, 47: 2, 9: 1},                    # bumped off an overbooked flight
    38: {38: 3, 16: 1},                        # child flying alone
    2: {2: 3, 0: 2, 42: 1},                    # checked bag cost
    17: {17: 3, 7: 1},                         # INC-2042
    47: {47: 3, 6: 2},                         # EU Regulation 261/2004
    3: {3: 3},                                 # SEPA direct debit
    45: {45: 3},                               # Larkspur Club points
    54: {54: 3},                               # A321neo fleet average age
    49: {49: 3},                               # codeshare operating carrier
    39: {39: 3},                               # lithium batteries 100 Wh
}
# doc 4 is gold for two queries; key the grades by gold id, which is unique here
# except for the property-irregularity query, handled explicitly.
GRADED_BY_QUERY = {}
for q, gold, kind in QUERIES:
    GRADED_BY_QUERY[q] = dict(GRADED.get(gold, {gold: 3}))
GRADED_BY_QUERY["property irregularity report"] = {4: 3, 35: 1}


# --------------------------------------------------------------------------
# The metrics. Written out rather than imported, because the chapter needs the
# formulas and the formulas are four lines each.
# --------------------------------------------------------------------------
def precision_at(order, rel, k):
    return sum(1 for d in order[:k] if rel.get(d, 0) > 0) / k


def recall_at(order, rel, k):
    total = sum(1 for g in rel.values() if g > 0)
    if not total:
        return 0.0
    return sum(1 for d in order[:k] if rel.get(d, 0) > 0) / total


def hit_at(order, rel, k):
    return 1.0 if any(rel.get(d, 0) > 0 for d in order[:k]) else 0.0


def rr(order, rel):
    for i, d in enumerate(order, 1):
        if rel.get(d, 0) > 0:
            return 1.0 / i
    return 0.0


def ap(order, rel, k=None):
    """Average precision: precision at each relevant hit, averaged."""
    total = sum(1 for g in rel.values() if g > 0)
    if not total:
        return 0.0
    hits, s = 0, 0.0
    for i, d in enumerate(order if k is None else order[:k], 1):
        if rel.get(d, 0) > 0:
            hits += 1
            s += hits / i
    return s / total


def dcg(gains):
    return sum(g / math.log2(i + 1) for i, g in enumerate(gains, 1))


def ndcg_at(order, rel, k):
    got = [rel.get(d, 0) for d in order[:k]]
    ideal = sorted(rel.values(), reverse=True)[:k]
    idl = dcg(ideal)
    return dcg(got) / idl if idl else 0.0


METRICS = {
    "P@5": lambda o, r: precision_at(o, r, 5),
    "R@5": lambda o, r: recall_at(o, r, 5),
    "R@10": lambda o, r: recall_at(o, r, 10),
    "hit@5": lambda o, r: hit_at(o, r, 5),
    "MRR": lambda o, r: rr(o, r),
    "MAP": lambda o, r: ap(o, r),
    "nDCG@10": lambda o, r: ndcg_at(o, r, 10),
}


def evaluate(orders):
    """Per-query values for every metric, so aggregation stays visible."""
    out = {}
    for name, fn in METRICS.items():
        out[name] = [fn(orders[q], GRADED_BY_QUERY[q]) for q, _, _ in QUERIES]
    return out


def bootstrap_ci(a, b, n=10000, seed=0):
    """CI on the mean difference b - a, resampling queries with replacement."""
    rnd = random.Random(seed)
    diffs = [b[i] - a[i] for i in range(len(a))]
    means = []
    for _ in range(n):
        s = [diffs[rnd.randrange(len(diffs))] for _ in diffs]
        means.append(sum(s) / len(s))
    means.sort()
    return (statistics.mean(diffs), means[int(0.025 * n)], means[int(0.975 * n)])


def main():
    from sentence_transformers import SentenceTransformer, CrossEncoder

    print("loading models...")
    big = SentenceTransformer("sentence-transformers/all-MiniLM-L6-v2")
    small = SentenceTransformer("sentence-transformers/paraphrase-MiniLM-L3-v2")
    ce = CrossEncoder("cross-encoder/ms-marco-MiniLM-L-6-v2")
    ce.predict([("warm", "up")])
    bm = BM25(CORPUS)
    emb_big = big.encode(CORPUS, normalize_embeddings=True)
    emb_small = small.encode(CORPUS, normalize_embeddings=True)

    systems = {}
    for label, model, emb in (("dense-L6", big, emb_big), ("dense-L3", small, emb_small)):
        o = {}
        for q, _, _ in QUERIES:
            qv = model.encode([q], normalize_embeddings=True)[0]
            o[q] = ranking([float(qv @ emb[i]) for i in range(len(CORPUS))])
        systems[label] = o
    systems["bm25"] = {q: ranking(bm.score(q)) for q, _, _ in QUERIES}
    systems["rrf(bm25,L6)"] = {
        q: order_of(rrf_scores(systems["bm25"][q], systems["dense-L6"][q]))
        for q, _, _ in QUERIES}

    reranked = {}
    for q, _, _ in QUERIES:
        cand = systems["rrf(bm25,L6)"][q][:20]
        scores = ce.predict([(q, CORPUS[d]) for d in cand])
        reranked[q] = [d for _, d in sorted(zip(scores, cand), reverse=True)] \
            + systems["rrf(bm25,L6)"][q][20:]
    systems["rrf+rerank"] = reranked

    results = {name: evaluate(o) for name, o in systems.items()}

    # ---------------------------------------------------------------- 1+2
    print()
    print("=" * 78)
    print("1. FIVE SYSTEMS, SEVEN METRICS")
    print("=" * 78)
    names = ["bm25", "dense-L3", "dense-L6", "rrf(bm25,L6)", "rrf+rerank"]
    print(f"\n  {'system':<16}" + "".join(f"{m:>10}" for m in METRICS))
    for n in names:
        print(f"  {n:<16}" + "".join(f"{statistics.mean(results[n][m]):>10.3f}" for m in METRICS))

    print("\n  Which system wins, according to each metric:")
    for m in METRICS:
        best = max(names, key=lambda n: statistics.mean(results[n][m]))
        ordering = sorted(names, key=lambda n: -statistics.mean(results[n][m]))
        print(f"    {m:<9} winner {best:<14}  order: {' > '.join(ordering)}")

    # ---------------------------------------------------------------- 3
    print()
    print("=" * 78)
    print("2. THE SWAP: dense-L6 REPLACED BY dense-L3")
    print("=" * 78)
    print(f"\n  {'metric':<10}{'L6':>9}{'L3':>9}{'delta':>9}   95% CI on the difference   verdict")
    for m in METRICS:
        a, b = results["dense-L6"][m], results["dense-L3"][m]
        d, lo, hi = bootstrap_ci(a, b)
        sig = "REAL" if (lo > 0 or hi < 0) else "noise: CI spans 0"
        print(f"  {m:<10}{statistics.mean(a):>9.3f}{statistics.mean(b):>9.3f}"
              f"{d:>9.3f}   [{lo:+.3f}, {hi:+.3f}]   {sig}")

    print("\n  And the comparison a team would actually be arguing about:")
    for m in ("nDCG@10", "MRR", "R@10"):
        a, b = results["rrf(bm25,L6)"][m], results["rrf+rerank"][m]
        d, lo, hi = bootstrap_ci(a, b)
        sig = "REAL" if (lo > 0 or hi < 0) else "noise: CI spans 0"
        print(f"    rrf -> rrf+rerank  {m:<9} {statistics.mean(a):.3f} -> "
              f"{statistics.mean(b):.3f}  ({d:+.3f})  [{lo:+.3f}, {hi:+.3f}]  {sig}")
    print(f"\n  n = {len(QUERIES)} queries. This is the size of a first eval set,")
    print("  and at this size most of the differences teams ship are unmeasurable.")

    # ---------------------------------------------------------------- 4
    print()
    print("=" * 78)
    print("3. THE MEAN HIDES THE REGRESSION")
    print("=" * 78)
    a_name, b_name = "dense-L6", "rrf(bm25,L6)"
    print(f"\n  {b_name} against {a_name}, nDCG@10 per query:")
    worse, better, same = [], [], 0
    for i, (q, gold, kind) in enumerate(QUERIES):
        x = results[a_name]["nDCG@10"][i]
        y = results[b_name]["nDCG@10"][i]
        if abs(y - x) < 1e-9:
            same += 1
        elif y < x:
            worse.append((x - y, q, kind, x, y))
        else:
            better.append((y - x, q, kind, x, y))
    print(f"    better on {len(better)}, worse on {len(worse)}, unchanged on {same}")
    print(f"    mean moved {statistics.mean(results[b_name]['nDCG@10']) - statistics.mean(results[a_name]['nDCG@10']):+.3f}")
    if worse:
        print("\n    the regressions the mean absorbed:")
        for d, q, kind, x, y in sorted(worse, reverse=True):
            print(f"      -{d:.3f}  [{kind:<10}] {q[:50]:<50} {x:.3f} -> {y:.3f}")

    print("\n  Per class, which is the cut a mean cannot show you:")
    for kind in ("paraphrase", "identifier"):
        idx = [i for i, (_, _, k) in enumerate(QUERIES) if k == kind]
        for n in names:
            v = statistics.mean(results[n]["nDCG@10"][i] for i in idx)
            print(f"    {kind:<11} {n:<16} nDCG@10 {v:.3f}")
        print()

    # ---------------------------------------------------------------- 5
    print("=" * 78)
    print("4. POOLING BIAS: LABELS BUILT FROM THE SYSTEMS YOU ALREADY HAD")
    print("=" * 78)
    print("\n  Pool the top 10 of bm25 and dense-L6, judge only those, and treat")
    print("  everything unjudged as irrelevant. Then evaluate a third system.")
    pooled_ndcg, true_ndcg = {}, {}
    for n in names:
        pv, tv = [], []
        for i, (q, gold, kind) in enumerate(QUERIES):
            pool = set(systems["bm25"][q][:10]) | set(systems["dense-L6"][q][:10])
            full = GRADED_BY_QUERY[q]
            judged = {d: g for d, g in full.items() if d in pool}
            pv.append(ndcg_at(systems[n][q], judged, 10))
            tv.append(ndcg_at(systems[n][q], full, 10))
        pooled_ndcg[n] = statistics.mean(pv)
        true_ndcg[n] = statistics.mean(tv)
    print(f"\n  {'system':<16}{'nDCG@10 (pooled)':>19}{'nDCG@10 (full)':>17}{'understated by':>16}")
    for n in names:
        inpool = n in ("bm25", "dense-L6")
        mark = "   <- in the pool" if inpool else ""
        print(f"  {n:<16}{pooled_ndcg[n]:>19.3f}{true_ndcg[n]:>17.3f}"
              f"{true_ndcg[n]-pooled_ndcg[n]:>16.3f}{mark}")
    print("\n  The nDCG deltas are tiny and go the wrong way, because dropping an")
    print("  unjudged relevant document also shrinks the ideal DCG it is divided")
    print("  by. That cancellation is why pooling bias is hard to SEE in a score.")
    print("  Count the mechanism directly instead: relevant documents a system")
    print("  surfaces in its top 10 that the pool never judged.")
    print(f"\n  {'system':<16}{'relevant hits @10':>19}{'of those, unjudged':>21}")
    for n in names:
        hits = unjudged = 0
        for q, _, _ in QUERIES:
            pool = set(systems["bm25"][q][:10]) | set(systems["dense-L6"][q][:10])
            full = GRADED_BY_QUERY[q]
            for d in systems[n][q][:10]:
                if full.get(d, 0) > 0:
                    hits += 1
                    if d not in pool:
                        unjudged += 1
        mark = "   <- in the pool" if n in ("bm25", "dense-L6") else ""
        print(f"  {n:<16}{hits:>19}{unjudged:>21}{mark}")
    print("\n    Every unjudged hit is a correct result scored as a miss. The two")
    print("    systems that built the pool have none by construction; the systems")
    print("    that came later carry them. On a 56-passage corpus with generous")
    print("    labels the effect is small. On a real corpus, where a pool covers a")
    print("    vanishing fraction of documents, this is how a new retriever loses")
    print("    an evaluation it should have won.")

    # ---------------------------------------------------------------- 6
    print()
    print("=" * 78)
    print("5. WHAT THE DISCOUNT AND THE GRADES ACTUALLY DO")
    print("=" * 78)
    print("\n  the nDCG position discount, 1/log2(rank+1):")
    for r in (1, 2, 3, 5, 10, 20):
        print(f"    rank {r:>2}   {1/math.log2(r+1):.3f}"
              + "  " + "#" * int(40 / math.log2(r + 1)))
    print("\n  binary relevance against graded, same rankings:")
    print(f"    {'system':<16}{'nDCG@10 graded':>17}{'nDCG@10 binary':>17}{'delta':>9}")
    for n in names:
        g = statistics.mean(ndcg_at(systems[n][q], GRADED_BY_QUERY[q], 10)
                            for q, _, _ in QUERIES)
        b = statistics.mean(ndcg_at(systems[n][q],
                                    {d: 1 for d in GRADED_BY_QUERY[q]}, 10)
                            for q, _, _ in QUERIES)
        print(f"    {n:<16}{g:>17.3f}{b:>17.3f}{b-g:>9.3f}")

    print("\n  One query, one relevant document, moved down the ranking:")
    q = QUERIES[0][0]
    rel = {7: 3}
    others = [d for d in range(len(CORPUS)) if d != 7]
    print(f"    {'gold at rank':<14}{'MRR':>8}{'R@10':>8}{'P@5':>8}{'hit@5':>8}{'nDCG@10':>10}")
    for pos in (1, 2, 3, 5, 10, 11):
        o = others[:pos - 1] + [7] + others[pos - 1:]
        print(f"    {pos:<14}{rr(o, rel):>8.3f}{recall_at(o, rel, 10):>8.3f}"
              f"{precision_at(o, rel, 5):>8.3f}{hit_at(o, rel, 5):>8.3f}"
              f"{ndcg_at(o, rel, 10):>10.3f}")
    print("    MRR halves between rank 1 and 2. Recall@10 does not move until")
    print("    rank 11, where it falls off a cliff to zero. They answer")
    print("    different questions, and neither is wrong.")


if __name__ == "__main__":
    main()
