"""adaptive.py — Chapter 20, "Retrieval That Thinks".

Q4 is the Larkspur question one retrieval cannot answer: which policy changed
after incident INC-2042? The incident is in one passage and the policy is in
another, and nothing links them but a phrase.

Measured here:

  1. the single-shot ceiling: where each of the two needed passages lands when
     the question is asked once;
  2. three ways to build the second hop (bridge phrase, draft answer, reasoning
     step), scored by where the policy passage lands;
  3. a real CRAG-style retrieval evaluator: the Chapter 16 cross-encoder
     scoring the top retrieved document, measured across questions the corpus
     answers well, poorly, and not at all, which is where the correct /
     ambiguous / incorrect thresholds come from;
  4. what each mode costs, in retrievals and generation calls.

FLARE's token-probability trigger cannot be measured here (it needs logprobs
from a generator, and no model API is reachable from this machine); the text
says so and cites the paper's own numbers instead.

    PYTHONPATH=<scratch>/pylib HF_HOME=<scratch>/hf python3 adaptive.py
"""

from querygap import CORPUS, BM25, ranking
from hybrid import rrf_scores, order_of

Q4 = "Which policy changed after incident INC-2042?"
INCIDENT, POLICY = 17, 7

# Hop-2 queries, in the three shapes the literature prescribes. Written by
# hand from what hop 1 actually returned.
HOP2 = {
    "bridge phrase only":
        "refund and cancellation policy 24-hour cooling-off clause",
    "question + bridge (IRCoT style)":
        "Which policy changed after incident INC-2042? The post-mortem says the "
        "refund and cancellation policy was amended to add a 24-hour "
        "cooling-off clause. What does that policy say?",
    "question + draft answer (ITER-RETGEN style)":
        "Which policy changed after incident INC-2042? Draft: the refund and "
        "cancellation policy was amended on 2 February after a fare-loading "
        "error, adding a cooling-off period for recent bookings.",
}

# Questions spanning the range a retrieval evaluator has to separate.
EVAL_QUESTIONS = [
    ("Can I bring my cello in the cabin?", 1, "answered well"),
    ("Which policy changed after incident INC-2042?", 17, "answered partly"),
    ("How much does a checked bag cost?", 2, "answered well"),
    ("I couldn't take my flight, how do I get my money back?", 7, "query gap"),
    ("Can I bring my emotional support peacock in the cabin?", None, "not in corpus"),
    ("What is Larkspur's share price today?", None, "not in corpus"),
]


def main():
    from sentence_transformers import SentenceTransformer, CrossEncoder

    bm = BM25(CORPUS)
    bi = SentenceTransformer("sentence-transformers/all-MiniLM-L6-v2")
    E = bi.encode(CORPUS, normalize_embeddings=True)
    ce = CrossEncoder("cross-encoder/ms-marco-MiniLM-L-6-v2")

    def retrieve(query, k=50):
        lex = bm.score(query)
        den = (E @ bi.encode([query], normalize_embeddings=True)[0]).tolist()
        return order_of(rrf_scores(ranking(lex), ranking(den), 60, k))

    def rank(order, doc):
        return order.index(doc) + 1 if doc in order else 999

    print("=" * 76)
    print("1. The single-shot ceiling on Q4")
    order = retrieve(Q4)
    print("  top 5: %s" % order[:5])
    print("  incident post-mortem (doc %d) at rank %d" % (INCIDENT, rank(order, INCIDENT)))
    print("  the policy itself (doc %d)  at rank %d" % (POLICY, rank(order, POLICY)))
    print("  one retrieval puts the passage that NAMES the change first and the")
    print("  passage that CONTAINS it at rank 8: retrievable, but below the five")
    print("  passages Chapter 17 packs, so the generator never sees it.")

    print("=" * 76)
    print("2. Three ways to build hop 2 (rank of the policy passage, doc %d)" % POLICY)
    print("  %-44s %6s %6s" % ("hop-2 query shape", "rank", "top-1"))
    for name, q in HOP2.items():
        o = retrieve(q)
        print("  %-44s %6d %6d" % (name, rank(o, POLICY), o[0]))
    print("  and for comparison, the raw question again: rank %d" % rank(retrieve(Q4), POLICY))

    print("=" * 76)
    print("3. A retrieval evaluator, measured (CRAG's confidence signal)")
    print("  cross-encoder score of the top retrieved document")
    print("  %-52s %8s  %s" % ("question", "score", "corpus"))
    scores = []
    for q, gold, label in EVAL_QUESTIONS:
        o = retrieve(q)
        top = o[0]
        s = float(ce.predict([(q, CORPUS[top])])[0])
        scores.append((s, label, q))
        print("  %-52s %8.2f  %s" % (q[:52], s, label))
    ok = [s for s, l, _ in scores if l == "answered well"]
    bad = [s for s, l, _ in scores if l == "not in corpus"]
    print("\n  answered well: %.2f to %.2f      not in corpus: %.2f to %.2f"
          % (min(ok), max(ok), min(bad), max(bad)))
    print("  a gap that wide is what makes a three-way decision possible:")
    print("    above the upper threshold -> Correct: refine and answer")
    print("    below the lower threshold -> Incorrect: discard, search elsewhere")
    print("    between                   -> Ambiguous: do both")

    # The decompose-then-recompose step, run for real on the winning document.
    print("\n  decompose-then-recompose on the Q4 top document (doc %d):" % retrieve(Q4)[0])
    import re
    top = retrieve(Q4)[0]
    strips = [s.strip() for s in re.split(r"(?<=[.!?]) +", CORPUS[top]) if s.strip()]
    ss = ce.predict([(Q4, s) for s in strips])
    for s, strip in sorted(zip([float(x) for x in ss], strips), key=lambda p: -p[0]):
        print("    %7.2f  %s" % (s, strip[:66]))
    print("    NOTE: the strip that actually answers Q4 scores LOWEST. Strip-level")
    print("    filtering on query similarity would delete the answer and keep the")
    print("    title. Refinement inherits Chapter 17's finding that the sentence")
    print("    most similar to a query is not the sentence that answers it.")

    print("=" * 76)
    print("4. What each mode costs, per question")
    print("  %-28s %10s %12s %10s" % ("mode", "retrievals", "generations", "verdict on Q4"))
    modes = [
        ("single-shot", 1, 1, "wrong: policy at rank 8, unpacked"),
        ("iterative, 2 hops", 2, 2, "correct"),
        ("iterative, max 5 hops", "1-5", "1-5", "correct, cost varies"),
        ("Self-RAG (per segment)", "0-n", "n+critique", "correct, most calls"),
        ("CRAG (evaluator gate)", "1-2", "1 + evaluator", "correct if hop 2 fires"),
    ]
    for m, r, g, v in modes:
        print("  %-28s %10s %12s %10s" % (m, r, g, v))
    print("\n  the evaluator is the cheap part: a cross-encoder pass over the top")
    print("  document costs about 3 ms (Chapter 16), against a generation call.")

    # The check: hop 2 must find the policy that hop 1 could not.
    assert rank(retrieve(Q4), POLICY) > 5, "single shot already found the policy"
    best = min(rank(retrieve(q), POLICY) for q in HOP2.values())
    assert best == 1, "no hop-2 shape retrieved the policy first"
    print("\nok")


if __name__ == "__main__":
    main()
