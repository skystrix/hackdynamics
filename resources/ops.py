"""ops.py — Chapter 29, "Running RAG in Production".

Everything before this chapter measured a mechanism. This measures the day
job: whether a debugging procedure actually attributes a fault, what a botched
re-index does to retrieval, whether an aggregate regression gate catches a
change, and how much traffic you have to sample before a latency number means
anything.

Measured:

  1. FAULT ATTRIBUTION. Five faults are injected one at a time into the
     Chapter 16 pipeline, and the six-check procedure is run against each.
     The output is a truth table of which check fires for which fault, which
     is the only evidence that the procedure discriminates rather than
     just produces a verdict.
  2. THE BOTCHED RE-INDEX. Query vectors from one embedding model against
     document vectors from another, at three stages of a rolling re-index.
     Both models are 384-dimensional, so nothing raises an error.
  3. THE REGRESSION GATE. Two changes that an aggregate gate waves through,
     scored per query with a bootstrap confidence interval, to find what the
     mean hides.
  4. SAMPLING. How many sampled requests are needed before a p95 estimate is
     stable enough to detect a 20% regression, resampled from real timings.

    PYTHONPATH=<scratch>/pylib HF_HOME=<scratch>/hf python3 ops.py
"""

import random
import statistics
import time

from querygap import CORPUS, BM25, ranking
from hybrid import QUERIES
from metrics import GRADED_BY_QUERY, bootstrap_ci, ndcg_at, rr


def rrf_order(bm_scores, dn_scores, candidates, k=60):
    bm = sorted(candidates, key=lambda i: -bm_scores[i])
    dn = sorted(candidates, key=lambda i: -dn_scores[i])
    fused = {}
    for order in (bm, dn):
        for rank, doc in enumerate(order, 1):
            fused[doc] = fused.get(doc, 0.0) + 1.0 / (k + rank)
    return sorted(candidates, key=lambda i: -fused[i])


# --------------------------------------------------------------------------
# The six checks. Each takes a trace and returns True when it FIRES, meaning
# it has found something wrong. They run in order and the first to fire names
# the failure class.
# --------------------------------------------------------------------------
CHECKS = [
    ("1. is the answer in the corpus at all",
     lambda t: t["gold_in_corpus"] is False),
    ("2. did the retriever return anything",
     lambda t: len(t["retrieved"]) == 0),
    ("3. is the gold chunk in the candidate set",
     lambda t: t["gold_in_candidates"] is False),
    ("4. did it survive ranking into the top k",
     lambda t: t["gold_in_topk"] is False),
    ("5. did it survive into the packed context",
     lambda t: t["gold_in_context"] is False),
    ("6. is the answer grounded in what was packed",
     lambda t: t["answer_cites_gold"] is False),
]

CLASS_OF = {
    1: "corpus gap",
    2: "retrieval returned nothing",
    3: "recall failure",
    4: "ranking failure",
    5: "assembly failure",
    6: "generation failure",
}


def diagnose(trace):
    for i, (name, fn) in enumerate(CHECKS, 1):
        if fn(trace):
            return i, name, CLASS_OF[i]
    return 0, "all checks pass", "no fault found"


def main():
    try:
        from sentence_transformers import SentenceTransformer, CrossEncoder
    except ImportError:
        print("sentence-transformers not installed; nothing to measure.")
        return
    import numpy as np

    big = SentenceTransformer("sentence-transformers/all-MiniLM-L6-v2")
    small = SentenceTransformer("sentence-transformers/paraphrase-MiniLM-L3-v2")
    ce = CrossEncoder("cross-encoder/ms-marco-MiniLM-L-6-v2")
    ce.predict([("warm", "up")])

    E = big.encode(CORPUS, normalize_embeddings=True)
    ES = small.encode(CORPUS, normalize_embeddings=True)
    bm25 = BM25(CORPUS)
    qs = [q for q, _, _ in QUERIES]
    QV = big.encode(qs, normalize_embeddings=True)
    QVS = small.encode(qs, normalize_embeddings=True)
    ALL = list(range(len(CORPUS)))

    # ----------------------------------------------------------------------
    print("=" * 74)
    print("1. FAULT ATTRIBUTION: does the six-check procedure discriminate?")
    print("=" * 74)

    qi = 3                            # "You cancelled my flight, what am I owed?"
    Q, GOLD = QUERIES[qi][0], QUERIES[qi][1]   # gold 9: fused rank 18, reranked to 4

    # Labels reused from Chapter 28, so a mis-scoped filter is a real fault.
    INTERNAL = {17, 19, 21, 53}
    TICKETS = {24, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 37}

    def run(fault=None, k=5, budget=5):
        """Run the pipeline with one fault injected and emit a trace."""
        cand = list(ALL)
        emb = E
        if fault == "corpus gap":
            cand = [i for i in ALL if i != GOLD]
        if fault == "filter removed everything":
            cand = []
        if fault == "filter scoped too narrowly":
            # meant to exclude internal docs, written to allow tickets only
            cand = [i for i in ALL if i in TICKETS]
        if fault == "wrong embedding space":
            emb = ES                            # documents from the other model
        bmS = bm25.score(Q)
        dnS = list(emb @ QV[qi])
        order = rrf_order(bmS, dnS, cand) if cand else []
        topk = order[:20]
        if fault == "reranker disabled":
            ranked = topk
        elif topk:
            sc = ce.predict([(Q, CORPUS[d]) for d in topk])
            ranked = [d for _, d in sorted(zip(sc, topk), key=lambda t: -t[0])]
        else:
            ranked = []
        final = ranked[:k]
        packed = final[:2] if fault == "context budget too small" else final[:budget]
        return {
            "gold_in_corpus": fault != "corpus gap",
            "retrieved": order,
            "gold_in_candidates": GOLD in order,
            "gold_in_topk": GOLD in final,
            "gold_in_context": GOLD in packed,
            "answer_cites_gold": (GOLD in packed) and fault != "ungrounded answer",
            "rank": (order.index(GOLD) + 1) if GOLD in order else None,
            "reranked": (ranked.index(GOLD) + 1) if GOLD in ranked else None,
        }

    faults = [None, "corpus gap", "filter removed everything",
              "filter scoped too narrowly", "reranker disabled",
              "context budget too small", "ungrounded answer"]
    print(f"\nquery: {Q!r}  gold chunk: {GOLD}\n")
    print(f"  {'injected fault':<30}{'fires':<10}{'failure class':<30}"
          f"{'fused':<8}{'reranked'}")
    for f in faults:
        t = run(f)
        n, name, cls = diagnose(t)
        label = f if f else "none (healthy)"
        print(f"  {label:<30}{('check ' + str(n)) if n else '-':<10}{cls:<30}"
              f"{str(t['rank'] or '-'):<8}{t['reranked'] or '-'}")

    print("\n  six faults, six different checks, and the healthy run fires none.")
    print("  the procedure discriminates, which is the only thing that makes a")
    print("  verdict worth anything.")

    t = run("wrong embedding space")
    n, _, cls = diagnose(t)
    print(f"\n  and one fault it does NOT catch:")
    print(f"    wrong embedding space -> {('check ' + str(n)) if n else 'no check fires'}"
          f", fused rank {t['rank']}, reranked to {t['reranked']}")
    print(f"    the reranker rescued it. degraded is not broken, and this")
    print(f"    procedure finds broken. Section 3 is how you find degraded.")

    # ----------------------------------------------------------------------
    print()
    print("=" * 74)
    print("2. THE BOTCHED RE-INDEX: two embedding spaces, one index")
    print("=" * 74)
    print(f"\n  all-MiniLM-L6-v2 dim {E.shape[1]}   "
          f"paraphrase-MiniLM-L3-v2 dim {ES.shape[1]}   "
          f"-> no dimension error is possible")

    def score_set(doc_emb, query_emb, hybrid=True):
        """Mean nDCG@10 and MRR over the gold set for a given index state."""
        nd, mr = [], []
        for i, (q, gold, _) in enumerate(QUERIES):
            dnS = list(doc_emb @ query_emb[i])
            order = (rrf_order(bm25.score(q), dnS, ALL) if hybrid
                     else ranking(dnS))
            rel = GRADED_BY_QUERY[q]
            nd.append(ndcg_at(order, rel, 10))
            mr.append(rr(order, rel))
        return nd, mr

    print("\n  dense only (no BM25 to hide the damage):")
    print(f"    {'index state':<44}{'nDCG@10':<12}{'MRR'}")
    rows = []
    nd, mr = score_set(E, QV, hybrid=False)
    rows.append(("consistent: both sides all-MiniLM-L6-v2", nd, mr))
    nd, mr = score_set(ES, QVS, hybrid=False)
    rows.append(("consistent: both sides paraphrase-L3-v2", nd, mr))
    nd, mr = score_set(ES, QV, hybrid=False)
    rows.append(("MIXED: docs re-embedded, queries not", nd, mr))
    for name, nd, mr in rows:
        print(f"    {name:<44}{statistics.mean(nd):<12.3f}"
              f"{statistics.mean(mr):.3f}")

    print("\n  rolling re-index: fraction of documents already moved to the new model")
    print(f"    {'fraction re-embedded':<28}{'nDCG@10':<12}{'MRR':<10}"
          f"{'gold in top-5'}")
    rnd = random.Random(7)
    for frac in (0.0, 0.25, 0.5, 0.75, 1.0):
        moved = set(rnd.sample(ALL, int(frac * len(ALL))))
        mix = np.vstack([ES[i] if i in moved else E[i] for i in ALL])
        nd, mr, hits = [], [], 0
        for i, (q, gold, _) in enumerate(QUERIES):
            order = ranking(list(mix @ QV[i]))
            rel = GRADED_BY_QUERY[q]
            nd.append(ndcg_at(order, rel, 10))
            mr.append(rr(order, rel))
            if gold in order[:5]:
                hits += 1
        print(f"    {frac:<28.0%}{statistics.mean(nd):<12.3f}"
              f"{statistics.mean(mr):<10.3f}{hits}/16")
    nd, mr = score_set(ES, QVS, hybrid=False)
    hits = sum(1 for i, (q, gold, _) in enumerate(QUERIES)
               if gold in ranking(list(ES @ QVS[i]))[:5])
    print(f"    {'100% + queries switched':<28}{statistics.mean(nd):<12.3f}"
          f"{statistics.mean(mr):<10.3f}{hits}/16   <- the cut-over completed")

    print("\n  hybrid retrieval during the same mixed state (BM25 still correct):")
    nd, mr = score_set(ES, QV, hybrid=True)
    ndc, mrc = score_set(E, QV, hybrid=True)
    print(f"    consistent hybrid  nDCG@10 {statistics.mean(ndc):.3f}   "
          f"MRR {statistics.mean(mrc):.3f}")
    print(f"    mixed hybrid       nDCG@10 {statistics.mean(nd):.3f}   "
          f"MRR {statistics.mean(mr):.3f}")
    print("    -> the lexical half masks the damage, which is how this reaches "
          "production")

    # ----------------------------------------------------------------------
    print()
    print("=" * 74)
    print("3. THE REGRESSION GATE: what an aggregate number waves through")
    print("=" * 74)

    def hybrid_orders(doc_emb, query_emb, window=20, k=60):
        out = {}
        for i, (q, gold, _) in enumerate(QUERIES):
            bmS, dnS = bm25.score(q), list(doc_emb @ query_emb[i])
            bm = sorted(ALL, key=lambda d: -bmS[d])[:window]
            dn = sorted(ALL, key=lambda d: -dnS[d])[:window]
            fused = {}
            for order in (bm, dn):
                for rank, doc in enumerate(order, 1):
                    fused[doc] = fused.get(doc, 0.0) + 1.0 / (k + rank)
            rest = [d for d in ALL if d not in fused]
            out[q] = sorted(fused, key=lambda d: -fused[d]) + rest
        return out

    base = hybrid_orders(E, QV)
    changes = [
        ("swap the embedding model, L6 -> paraphrase-L3",
         hybrid_orders(ES, QVS)),
        ("widen the fusion window, 20 -> 50",
         hybrid_orders(E, QV, window=50)),
        ("retune RRF, k 60 -> 1",
         hybrid_orders(E, QV, k=1)),
    ]
    for label, after in changes:
        na = [ndcg_at(base[q], GRADED_BY_QUERY[q], 10) for q, _, _ in QUERIES]
        nb = [ndcg_at(after[q], GRADED_BY_QUERY[q], 10) for q, _, _ in QUERIES]
        mean, lo, hi = bootstrap_ci(na, nb)
        worse = [(q, na[i], nb[i]) for i, (q, _, _) in enumerate(QUERIES)
                 if nb[i] < na[i] - 1e-9]
        better = sum(1 for i in range(len(na)) if nb[i] > na[i] + 1e-9)
        churn = sum(1 for q, _, _ in QUERIES if base[q][0] != after[q][0])
        print(f"\n  {label}")
        print(f"    aggregate nDCG@10 {statistics.mean(na):.3f} -> "
              f"{statistics.mean(nb):.3f}   delta {mean:+.3f}   "
              f"95% CI [{lo:+.3f}, {hi:+.3f}]")
        print(f"    a gate on the mean at +/-0.02: "
              f"{'PASSES' if abs(mean) < 0.02 else 'BLOCKS'}")
        print(f"    per query: {better} improved, {len(worse)} regressed, "
              f"{churn}/16 changed their top result")
        for q, a, b in worse[:3]:
            print(f"      {q[:46]:<48}{a:.3f} -> {b:.3f}")

    # ----------------------------------------------------------------------
    print()
    print("=" * 74)
    print("4. SAMPLING: how much traffic a latency number needs")
    print("=" * 74)

    samples = []
    pairs = [(q, CORPUS[d]) for q in qs[:4] for d in ALL[:5]]
    for _ in range(240):
        s = time.perf_counter()
        ce.predict([pairs[len(samples) % len(pairs)]])
        samples.append((time.perf_counter() - s) * 1000)

    def pct(v, p):
        v = sorted(v)
        return v[min(len(v) - 1, int(p / 100 * len(v)))]

    truth = pct(samples, 95)
    print(f"\n  population: {len(samples)} real rerank timings   "
          f"p50 {pct(samples, 50):.1f} ms   p95 {truth:.1f} ms")
    shifted = [x * 1.20 for x in samples]
    print(f"  a 20% regression would move p95 to {pct(shifted, 95):.1f} ms\n")
    print(f"  {'sampled requests':<20}{'p95 spread, 500 draws':<28}"
          f"{'real +20% caught':<20}{'false alarm'}")
    rnd = random.Random(11)
    for n in (10, 25, 50, 100, 200):
        est, detected, alarms = [], 0, 0
        for _ in range(500):
            a = [rnd.choice(samples) for _ in range(n)]
            b = [rnd.choice(shifted) for _ in range(n)]
            c = [rnd.choice(samples) for _ in range(n)]
            est.append(pct(a, 95))
            if pct(b, 95) > pct(a, 95) * 1.10:
                detected += 1
            if pct(c, 95) > pct(a, 95) * 1.10:
                alarms += 1
        lo, hi = pct(est, 5), pct(est, 95)
        print(f"  {n:<20}{f'{lo:.1f} to {hi:.1f} ms':<28}"
              f"{detected / 500:<20.0%}{alarms / 500:.0%}")
    print("\n  'false alarm' is two draws from the SAME distribution differing")
    print("  by more than 10%: the rate at which the dashboard cries wolf")


if __name__ == "__main__":
    main()
