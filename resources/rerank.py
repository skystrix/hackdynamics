"""rerank.py — Chapter 16, "Reranking".

Runs a real cross-encoder over the candidates that Chapter 15's hybrid
pipeline produced, on the same 56-passage Larkspur corpus and the same
16-query gold set, and measures what the second stage is actually worth:

  1. the cascade: nDCG@10 and MRR after reranking the top k1 candidates,
     for k1 in {10, 20, 50}, against the first-stage baseline;
  2. what it costs: wall-clock per query-passage pair on this machine,
     batched and unbatched, and the implied budget for a cascade;
  3. two rerankers of different sizes, so the accuracy/latency trade is a
     measurement rather than an assertion;
  4. MaxSim, ColBERT's late-interaction operator, computed token by token
     (on an untrained bi-encoder's token vectors, so it illustrates the
     operator, not ColBERT's trained behaviour);
  5. MMR, to show what diversity re-ordering does to a corpus that contains
     twelve near-duplicate support tickets.

    PYTHONPATH=<scratch>/pylib HF_HOME=<scratch>/hf python3 rerank.py
"""

import math
import time

from querygap import CORPUS, BM25, ranking
from hybrid import QUERIES, rrf_scores, order_of, mrr, rank_of

CE_SMALL = "cross-encoder/ms-marco-MiniLM-L-6-v2"
CE_LARGE = "cross-encoder/ms-marco-MiniLM-L-12-v2"


def ndcg_at(order, gold, k=10):
    """Single relevant document, so DCG is 1/log2(rank+1) and ideal DCG is 1."""
    if gold not in order[:k]:
        return 0.0
    return 1.0 / math.log2(order.index(gold) + 2)


def main():
    from sentence_transformers import SentenceTransformer, CrossEncoder

    bm = BM25(CORPUS)
    bi = SentenceTransformer("sentence-transformers/all-MiniLM-L6-v2")
    E = bi.encode(CORPUS, normalize_embeddings=True)

    # First stage: the Chapter 15 hybrid, window 50.
    first = []
    for q, gold, cls in QUERIES:
        lex = bm.score(q)
        den = (E @ bi.encode([q], normalize_embeddings=True)[0]).tolist()
        fused = order_of(rrf_scores(ranking(lex), ranking(den), 60, 50))
        first.append((q, gold, cls, fused))

    base_ndcg = [ndcg_at(f, g) for _, g, _, f in first]
    base_mrr = mrr([rank_of(f, g) for _, g, _, f in first])
    print("first stage (hybrid RRF, window 50)")
    print("  nDCG@10 %.3f   MRR %.3f" % (sum(base_ndcg) / len(base_ndcg), base_mrr))

    for name in (CE_SMALL, CE_LARGE):
        ce = CrossEncoder(name)
        print("\n%s" % name)
        for k1 in (10, 20, 50):
            ndcgs, ranks, pairs, t0 = [], [], 0, time.perf_counter()
            for q, gold, cls, fused in first:
                cand = fused[:k1]
                scores = ce.predict([(q, CORPUS[d]) for d in cand])
                pairs += len(cand)
                order = [d for _, d in sorted(zip(scores, cand), key=lambda p: -p[0])]
                ndcgs.append(ndcg_at(order, gold))
                ranks.append(rank_of(order, gold))
            dt = time.perf_counter() - t0
            print(
                "  k1=%-3d nDCG@10 %.3f  MRR %.3f  %6.1f ms/query  %5.2f ms/pair"
                % (k1, sum(ndcgs) / len(ndcgs), mrr(ranks),
                   1000 * dt / len(first), 1000 * dt / pairs)
            )

    # Batched vs one pair at a time, at the size a cascade actually uses.
    ce = CrossEncoder(CE_SMALL)
    q, gold, _cls, fused = first[0]
    cand = fused[:50]
    pairs = [(q, CORPUS[d]) for d in cand]
    ce.predict(pairs[:8])          # warm-up: exclude first-call cost from both
    t0 = time.perf_counter()
    ce.predict(pairs)
    batched = time.perf_counter() - t0
    t0 = time.perf_counter()
    for p in pairs:
        ce.predict([p])
    single = time.perf_counter() - t0
    print("\n50 pairs: batched %.0f ms, one at a time %.0f ms (%.1fx)"
          % (1000 * batched, 1000 * single, single / batched))

    # ---------------------------------------------------------------- MaxSim
    print("\nMaxSim (late interaction), computed on untrained token vectors")
    import numpy as np

    tokzr, model = bi.tokenizer, bi[0].auto_model

    def token_vecs(text):
        enc = tokzr(text, return_tensors="pt", truncation=True, max_length=256)
        enc = {k: v.to(model.device) for k, v in enc.items()}
        out = model(**enc).last_hidden_state[0].detach().cpu().numpy()
        toks = tokzr.convert_ids_to_tokens(enc["input_ids"][0].cpu())
        out = out / (np.linalg.norm(out, axis=1, keepdims=True) + 1e-9)
        return toks, out

    q1 = "Can I bring my cello in the cabin?"
    qt, qv = token_vecs(q1)
    for doc, label in ((1, "gold: musical instruments"), (0, "wrong: cabin baggage"), (11, "wrong: pets in the cabin")):
        dt_, dv = token_vecs(CORPUS[doc])
        sim = qv @ dv.T
        best = sim.max(axis=1)
        print("  doc %d (%s)  MaxSim total %.2f" % (doc, label, best.sum()))
        for i, t in enumerate(qt):
            if t in ("cello", "cabin", "bring", "my"):
                j = int(sim[i].argmax())
                print("    query token %-8s -> %-14s %.3f" % (t, dt_[j], best[i]))

    # ------------------------------------------------------------------- MMR
    print("\nMMR on Q2 (the corpus holds 12 near-duplicate support tickets)")
    q2 = "I couldn't take my flight, how do I get my money back?"
    qv2 = bi.encode([q2], normalize_embeddings=True)[0]
    rel = (E @ qv2).tolist()
    cand = ranking(rel)[:20]

    def mmr(cand, lam):
        chosen = []
        pool = list(cand)
        while pool and len(chosen) < 5:
            best, best_v = None, -9
            for d in pool:
                red = max([float(E[d] @ E[c]) for c in chosen], default=0.0)
                v = lam * rel[d] - (1 - lam) * red
                if v > best_v:
                    best, best_v = d, v
            chosen.append(best)
            pool.remove(best)
        return chosen

    tickets = set(range(24, 38))
    for lam in (1.0, 0.8, 0.7, 0.5, 0.3):
        top = mmr(cand, lam)
        print("  lambda %.1f  top5 %s  tickets %d/5  gold(7) present %s"
              % (lam, top, sum(1 for d in top if d in tickets), 7 in top))

    # Production order: rerank first, then diversify the survivors.
    ce_q2 = CrossEncoder(CE_SMALL)
    cand50 = order_of(rrf_scores(ranking(bm.score(q2)), ranking(rel), 60, 50))[:50]
    sc = ce_q2.predict([(q2, CORPUS[d]) for d in cand50])
    reranked = [d for _, d in sorted(zip(sc, cand50), key=lambda p: -p[0])]
    print("  after cross-encoder: top5 %s  gold(7) at rank %d"
          % (reranked[:5], reranked.index(7) + 1))
    # MMR mixes a relevance term with a similarity term, so they must live on
    # the same scale. Cross-encoder outputs are unbounded logits; the bge
    # reranker card prescribes a sigmoid to map them into [0, 1].
    ce_raw = [float(x) for x in sc]
    print("  cross-encoder logits range %.2f to %.2f (unbounded, not a probability)"
          % (min(ce_raw), max(ce_raw)))
    ce_rel = dict(zip(cand50, [1 / (1 + math.exp(-x)) for x in ce_raw]))

    def mmr_over(order, lam, n=5):
        chosen, pool = [], list(order[:20])
        while pool and len(chosen) < n:
            b, bv = None, -1e9
            for d in pool:
                red = max([float(E[d] @ E[c]) for c in chosen], default=0.0)
                v = lam * ce_rel[d] - (1 - lam) * red
                if v > bv:
                    b, bv = d, v
            chosen.append(b)
            pool.remove(b)
        return chosen

    for lam in (1.0, 0.7, 0.5):
        top = mmr_over(reranked, lam)
        print("  rerank+MMR lambda %.1f  top5 %s  tickets %d/5"
              % (lam, top, sum(1 for d in top if d in tickets)))

    # The check: reranking must not lose ground against the first stage.
    ce6 = CrossEncoder(CE_SMALL)
    got = []
    for q, gold, _cls, fused in first:
        cand = fused[:50]
        sc = ce6.predict([(q, CORPUS[d]) for d in cand])
        got.append(ndcg_at([d for _, d in sorted(zip(sc, cand), key=lambda p: -p[0])], gold))
    assert sum(got) / len(got) >= sum(base_ndcg) / len(base_ndcg), "rerank lost nDCG"
    print("\nok")


if __name__ == "__main__":
    main()
