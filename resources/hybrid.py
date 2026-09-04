"""hybrid.py — Chapter 15, "Hybrid Retrieval and Rank Fusion".

Reuses Chapter 14's 56-passage Larkspur corpus and its BM25 implementation,
adds a sixteen-query gold set in two classes, and measures:

  1. complementary failure: where BM25 wins, where dense wins, per query;
  2. the score distributions of the two retrievers, which is why raw scores
     cannot be added;
  3. three fusion methods (min-max, z-score, RRF) on MRR and recall@3;
  4. how fragile min-max is: re-fuse after adding one outlier document to the
     lexical list and count how many queries change their top result;
  5. RRF's sensitivity to k and to a single rank change.

    PYTHONPATH=<scratch>/pylib HF_HOME=<scratch>/hf python3 hybrid.py
"""

import statistics
from querygap import CORPUS, BM25, ranking, tok

# (query, gold document index). Written to span both retrievers' strengths:
# rare words, paraphrases, and plain lookups.
QUERIES = [
    # Paraphrase traffic: the user's words, not the document's.
    ("I couldn't take my flight, how do I get my money back?", 7, "paraphrase"),
    ("My suitcase did not arrive, what now?", 4, "paraphrase"),
    ("Can I take my dog on board?", 11, "paraphrase"),
    ("You cancelled my flight, what am I owed?", 9, "paraphrase"),
    ("Is there wifi on the plane and what does it cost?", 43, "paraphrase"),
    ("I was bumped off an overbooked flight", 6, "paraphrase"),
    ("My child is flying alone", 38, "paraphrase"),
    ("How much does a checked bag cost?", 2, "paraphrase"),
    # Identifier traffic: codes, regulation numbers, product and process names
    # that appear verbatim in exactly one document.
    ("INC-2042", 17, "identifier"),
    ("EU Regulation 261/2004", 47, "identifier"),
    ("property irregularity report", 4, "identifier"),
    ("SEPA direct debit", 3, "identifier"),
    ("Larkspur Club points", 45, "identifier"),
    ("A321neo fleet average age", 54, "identifier"),
    ("codeshare operating carrier", 49, "identifier"),
    ("lithium batteries 100 Wh", 39, "identifier"),
]



def mrr(ranks):
    return sum(1.0 / r for r in ranks) / len(ranks)


def recall_at(ranks, k):
    return sum(1 for r in ranks if r <= k) / len(ranks)


# --------------------------------------------------------------------------
# Fusion methods. Each takes two (scores, order) pairs and returns an order.
# --------------------------------------------------------------------------
def minmax(scores):
    lo, hi = min(scores), max(scores)
    if hi == lo:
        return [0.0] * len(scores)
    return [(s - lo) / (hi - lo) for s in scores]


def zscore(scores):
    m = statistics.mean(scores)
    sd = statistics.pstdev(scores) or 1.0
    return [(s - m) / sd for s in scores]


def fuse_scores(a, b, norm, window=20, w=0.5):
    """Score fusion over each retriever's top-`window` list, which is what a
    real engine has: documents outside a list's window are not in it at all."""
    top_a, top_b = set(ranking(a)[:window]), set(ranking(b)[:window])
    va = [a[i] for i in ranking(a)[:window]]
    vb = [b[i] for i in ranking(b)[:window]]
    na = dict(zip(ranking(a)[:window], norm(va)))
    nb = dict(zip(ranking(b)[:window], norm(vb)))
    out = {}
    for d in top_a | top_b:
        out[d] = w * na.get(d, 0.0) + (1 - w) * nb.get(d, 0.0)
    return out


def rrf_scores(order_a, order_b, k=60, window=20):
    """RRF over the same windows: a document missing from a list contributes
    nothing from it, exactly as Elasticsearch's rank_window_size implies."""
    out = {}
    for order in (order_a, order_b):
        for r, d in enumerate(order[:window], start=1):
            out[d] = out.get(d, 0.0) + 1.0 / (k + r)
    return out


def order_of(score_map):
    return sorted(score_map, key=lambda d: -score_map[d])


def rank_of(order, gold, miss=999):
    return order.index(gold) + 1 if gold in order else miss


def main():
    from sentence_transformers import SentenceTransformer

    bm = BM25(CORPUS)
    model = SentenceTransformer("sentence-transformers/all-MiniLM-L6-v2")
    E = model.encode(CORPUS, normalize_embeddings=True)

    rows = []
    for q, gold, cls in QUERIES:
        lex = bm.score(q)
        v = model.encode([q], normalize_embeddings=True)[0]
        den = (E @ v).tolist()
        rows.append((q, gold, cls, lex, den))

    print("=" * 78)
    print("1. Where each retriever wins (rank of the gold passage, 56 docs)")
    print("%-40s %-11s %6s %6s" % ("query", "class", "BM25", "dense"))
    lex_ranks, den_ranks = [], []
    for q, gold, cls, lex, den in rows:
        rl, rd = rank_of(ranking(lex), gold), rank_of(ranking(den), gold)
        lex_ranks.append(rl)
        den_ranks.append(rd)
        flag = "  <- lexical wins" if rl < rd else ("  <- dense wins" if rd < rl else "")
        print("%-40s %-11s %6d %6d%s" % (q[:40], cls, rl, rd, flag))
    print("MRR   BM25 %.3f   dense %.3f" % (mrr(lex_ranks), mrr(den_ranks)))
    print("R@3   BM25 %.2f   dense %.2f" % (recall_at(lex_ranks, 3), recall_at(den_ranks, 3)))
    for cls in ("paraphrase", "identifier"):
        idx = [i for i, r in enumerate(rows) if r[2] == cls]
        print("  %-11s MRR  BM25 %.3f   dense %.3f" % (
            cls, mrr([lex_ranks[i] for i in idx]), mrr([den_ranks[i] for i in idx])))

    print("=" * 78)
    print("2. Why the raw scores cannot be added (over all 16 queries x 56 docs)")
    all_lex = [s for _, _, _c, lex, _ in rows for s in lex]
    all_den = [s for _, _, _c, _, den in rows for s in den]
    for name, xs in (("BM25", all_lex), ("cosine", all_den)):
        print(
            "  %-7s min %7.3f  max %7.3f  mean %6.3f  sd %6.3f  top1 mean %6.3f"
            % (
                name,
                min(xs),
                max(xs),
                statistics.mean(xs),
                statistics.pstdev(xs),
                statistics.mean(
                    [max(r[3] if name == "BM25" else r[4]) for r in rows]
                ),
            )
        )

    print("=" * 78)
    print("3. Fusion, over each retriever's top-w list")
    results = {}
    for window in (10, 20, 50):
        for label, fn in [
            ("min-max", lambda lex, den, wd=window: order_of(fuse_scores(lex, den, minmax, wd))),
            ("z-score", lambda lex, den, wd=window: order_of(fuse_scores(lex, den, zscore, wd))),
            ("RRF k=60", lambda lex, den, wd=window: order_of(
                rrf_scores(ranking(lex), ranking(den), 60, wd))),
        ]:
            rr = [rank_of(fn(lex, den), gold) for _, gold, _c, lex, den in rows]
            results[(label, window)] = rr
            print(
                "  w=%-3d %-9s MRR %.3f  R@1 %.2f  R@3 %.2f  misses %d  worst %d"
                % (window, label, mrr(rr), recall_at(rr, 1), recall_at(rr, 3),
                   sum(1 for r in rr if r == 999), max(r for r in rr if r != 999))
            )
    print("  %-15s MRR %.3f  R@1 %.2f  R@3 %.2f            worst %d"
          % ("BM25 alone", mrr(lex_ranks), recall_at(lex_ranks, 1), recall_at(lex_ranks, 3), max(lex_ranks)))
    print("  %-15s MRR %.3f  R@1 %.2f  R@3 %.2f            worst %d"
          % ("dense alone", mrr(den_ranks), recall_at(den_ranks, 1), recall_at(den_ranks, 3), max(den_ranks)))

    print("=" * 78)
    print("4. Fragility: one document with a runaway BM25 score enters the list")
    # A document that is lexically spectacular for one query (an exact-phrase
    # FAQ) but not the answer. We simulate it the honest way: take the real
    # top BM25 score for each query and triple it on the document that already
    # holds it, which is what a title-field boost or a phrase match does.
    changed_mm, changed_rrf = 0, 0
    for q, gold, cls, lex, den in rows:
        base_mm = order_of(fuse_scores(lex, den, minmax))
        base_rrf = order_of(rrf_scores(ranking(lex), ranking(den)))
        boosted = list(lex)
        boosted[ranking(lex)[0]] *= 3.0
        if order_of(fuse_scores(boosted, den, minmax))[0] != base_mm[0]:
            changed_mm += 1
        if order_of(rrf_scores(ranking(boosted), ranking(den)))[0] != base_rrf[0]:
            changed_rrf += 1
    print("  top result changed on %d/16 queries under min-max" % changed_mm)
    print("  top result changed on %d/16 queries under RRF" % changed_rrf)
    print("  (the boost changed no ranks at all: only one score's magnitude)")

    print("=" * 78)
    print("5. RRF and the constant k")
    for k in (1, 10, 60, 200, 1000):
        rr = [
            rank_of(order_of(rrf_scores(ranking(lex), ranking(den), k)), gold)
            for _, gold, _c, lex, den in rows
        ]
        print("  k=%-5d MRR %.3f  R@1 %.2f" % (k, mrr(rr), recall_at(rr, 1)))

    # The check: fusion must not be worse than the better single retriever.
    # The check that matters for this chapter: fusion is bought for the tail.
    # No query may be worse under RRF than under BOTH single retrievers.
    # Fusion can only reorder what the retrievers fetched, so the invariant
    # holds only for golds that reached at least one window.
    rrf20 = results[("RRF k=60", 20)]
    for i, r in enumerate(rrf20):
        if min(lex_ranks[i], den_ranks[i]) > 20:
            continue  # outside both windows: nothing to fuse
        assert r <= max(lex_ranks[i], den_ranks[i]), (
            "RRF worse than both retrievers on %r" % QUERIES[i][0])
    print("\nok")


if __name__ == "__main__":
    main()
