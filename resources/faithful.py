"""faithful.py — Chapter 18, "Grounded Generation".

The generation half of this chapter cannot be measured on this machine: no
model API is reachable from it, so the answers below were written by hand, in
the shapes a generator actually produces (faithful, blended, embellished,
refusing). The *detector* half can be measured, and is:

  1. claim decomposition plus entailment, the RAGAS faithfulness recipe, run
     with a real NLI cross-encoder (cross-encoder/nli-distilroberta-base)
     against the packed context;
  2. citation verification: whether the passage a claim cites is the passage
     that actually entails it, which is a different question from whether the
     claim is supported at all;
  3. the refusal signal for Q5, whose answer is not in the corpus: the best
     entailment score any passage can give, which is what an abstention
     threshold reads;
  4. what the detector costs, per claim.

    PYTHONPATH=<scratch>/pylib HF_HOME=<scratch>/hf python3 faithful.py
"""

import re
import time

from querygap import CORPUS, BM25, ranking
from hybrid import rrf_scores, order_of

NLI = "cross-encoder/nli-distilroberta-base"
LABELS = ["contradiction", "entailment", "neutral"]

Q2 = "I couldn't take my flight, how do I get my money back?"
Q5 = "Can I bring my emotional support peacock in the cabin?"

# The context the generator is given: the passages Chapter 17 would pack for
# Q2 once Chapter 14's rewrite has put the policy in the window.
CONTEXT_DOCS = [7, 8, 14, 22, 13, 9]

# Four answers, written by hand in the shapes a generator produces.
ANSWERS = {
    "faithful": (
        "Tickets in fare classes L, K and T are non-refundable [1]. "
        "If you cancelled more than 24 hours after purchase, the fare is "
        "issued as a travel credit valid for twelve months [1]. "
        "Government taxes and airport charges can be returned to your "
        "original form of payment on request [1]."
    ),
    "blended": (
        "Tickets in fare classes L, K and T are non-refundable [1]. "
        "The fare is returned to your original form of payment within seven "
        "working days [2]. "
        "Government taxes and airport charges can be returned on request [1]."
    ),
    "embellished": (
        "Your fare is issued as a travel credit valid for twelve months [1]. "
        "You can request the credit through the manage-booking page and it "
        "usually arrives within 48 hours [1]. "
        "The credit can be transferred to another passenger [3]."
    ),
    "refusal": (
        "The passages provided do not say what happens to a booking cancelled "
        "within 24 hours of purchase, so I cannot answer that from the policy. "
        "Contact support with your booking reference."
    ),
}
# Which packed passage each [n] marker points at (1-indexed into CONTEXT_DOCS).
CITED = {
    "faithful": [1, 1, 1],
    "blended": [1, 2, 1],
    "embellished": [1, 1, 3],
    "refusal": [],
}


def claims(answer):
    """Decomposition, rule-based: one sentence is one claim, markers stripped."""
    out = []
    for s in re.split(r"(?<=[.!?]) +", answer.strip()):
        s = s.strip()
        if s:
            out.append(re.sub(r"\s*\[\d+\]", "", s).strip())
    return out


def verdicts(model, premise, hyp):
    s = model.predict([(premise, hyp)])[0]
    scores = {LABELS[i]: float(s[i]) for i in range(3)}
    return max(scores, key=scores.get), scores


def main():
    from sentence_transformers import CrossEncoder

    nli = CrossEncoder(NLI)
    ctx = [CORPUS[d] for d in CONTEXT_DOCS]
    joined = " ".join(ctx)

    print("context passages: %s" % CONTEXT_DOCS)
    print("=" * 76)
    print("1. Faithfulness: each claim against each passage, best verdict wins")
    print("   (RAGAS computes supported claims / total claims)")

    def best_over_passages(claim):
        best = (-99, None, None)
        for d in CONTEXT_DOCS:
            lab, sc = verdicts(nli, CORPUS[d], claim)
            if sc["entailment"] > best[0]:
                best = (sc["entailment"], d, lab)
        return best

    scores = {}
    for name, answer in ANSWERS.items():
        cl = claims(answer)
        supported = 0
        print("\n  %s (%d claims)" % (name, len(cl)))
        for c in cl:
            e, d, lab = best_over_passages(c)
            ok = lab == "entailment"
            supported += ok
            print("    [%s] best doc %-2d e=%6.2f (%-9s)  %s"
                  % ("y" if ok else "n", d, e, lab, c[:54]))
        scores[name] = supported / len(cl)
        print("    faithfulness = %d/%d = %.2f" % (supported, len(cl), scores[name]))

    print("\n  the same claims checked against the CONCATENATED context instead:")
    for name in ("faithful", "embellished"):
        cl = claims(ANSWERS[name])
        sup = sum(verdicts(nli, joined, c)[0] == "entailment" for c in cl)
        print("    %-12s %d/%d supported" % (name, sup, len(cl)))
    print("    every claim comes back neutral, including the true ones: a")
    print("    sentence-level NLI model dilutes over a long premise, so the")
    print("    check must run per passage, not against the packed context.")

    print("=" * 76)
    print("2. Citation verification: does the CITED passage entail the claim?")
    for name in ("faithful", "blended", "embellished"):
        cl, cites = claims(ANSWERS[name]), CITED[name]
        print("\n  %s" % name)
        for c, n in zip(cl, cites):
            cited_doc = CONTEXT_DOCS[n - 1]
            lab_cited, sc_cited = verdicts(nli, CORPUS[cited_doc], c)
            # the best passage in the whole context, for comparison
            best, best_e = None, -99
            for d in CONTEXT_DOCS:
                _, s = verdicts(nli, CORPUS[d], c)
                if s["entailment"] > best_e:
                    best, best_e = d, s["entailment"]
            flag = ("cited ok" if lab_cited == "entailment"
                    else ("MIS-CITED, doc %d entails it" % best if best_e > 0
                          else "UNSUPPORTED anywhere"))
            print("    [%d]->doc %-2d  e=%6.2f (%-9s)  best doc %-2d e=%6.2f  %s"
                  % (n, cited_doc, sc_cited["entailment"], lab_cited,
                     best, best_e, flag))

    print("=" * 76)
    print("3. The refusal signal (Q5: the peacock is not in the corpus)")
    bm = BM25(CORPUS)
    from sentence_transformers import SentenceTransformer
    bi = SentenceTransformer("sentence-transformers/all-MiniLM-L6-v2")
    E = bi.encode(CORPUS, normalize_embeddings=True)
    for q, claim in ((Q2, "The fare is issued as a travel credit valid for twelve months."),
                     (Q5, "Larkspur carries emotional support peacocks in the cabin.")):
        den = (E @ bi.encode([q], normalize_embeddings=True)[0]).tolist()
        retrieved = order_of(rrf_scores(ranking(bm.score(q)), ranking(den), 60, 50))[:6]
        best_e, best_d = -99, None
        for d in retrieved:
            _, sc = verdicts(nli, CORPUS[d], claim)
            if sc["entailment"] > best_e:
                best_e, best_d = sc["entailment"], d
        print("  %-56s best entailment %6.2f (doc %d)" % (q[:56], best_e, best_d))
    # Q2 again, with the passage Chapter 14's rewrite actually retrieves.
    _, sc = verdicts(nli, CORPUS[7],
                     "The fare is issued as a travel credit valid for twelve months.")
    print("  Q2 against doc 7, which the rewritten query retrieves: entailment %.2f"
          % sc["entailment"])
    # The passage that actually addresses the peacock, and what it says.
    lab, sc = verdicts(nli, CORPUS[11],
                       "Larkspur carries emotional support peacocks in the cabin.")
    print("  doc 11 (the pets policy) vs that claim: %s, contradiction %.2f"
          % (lab, sc["contradiction"]))

    print("=" * 76)
    print("4. What the detector costs")
    cl = claims(ANSWERS["blended"])
    pairs = [(joined, c) for c in cl]
    nli.predict(pairs)  # warm-up
    t0 = time.perf_counter()
    for _ in range(5):
        nli.predict(pairs)
    dt = (time.perf_counter() - t0) / 5
    print("  %d claims against the packed context: %.0f ms (%.0f ms per claim)"
          % (len(cl), 1000 * dt, 1000 * dt / len(cl)))
    print("  per-passage checking multiplies that by the passage count:")
    print("    %d claims x %d passages = %d pairs"
          % (len(cl), len(CONTEXT_DOCS), len(cl) * len(CONTEXT_DOCS)))

    # The check: a fabricated claim must not pass, and a real one must.
    lab_ok, _ = verdicts(nli, CORPUS[7], claims(ANSWERS["faithful"])[1])
    assert lab_ok == "entailment", "a supported claim failed the per-passage check"
    for d in CONTEXT_DOCS:
        lab, _ = verdicts(nli, CORPUS[d],
                          "You can request the credit through the manage-booking page.")
        assert lab != "entailment", "a fabricated claim passed the detector on doc %d" % d
    print("\nok")


if __name__ == "__main__":
    main()
