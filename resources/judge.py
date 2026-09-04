"""judge.py — Chapter 26, "Measuring Answers".

Chapter 25 scored the ranked list. This scores the sentence at the end of the
pipeline, which is harder, because there is no gold string to compare against
and the thing doing the comparing is itself a model.

Everything here executes with local models. The faithfulness judge is
cross-encoder/nli-distilroberta-base, the relevance scorers are the Chapter 16
cross-encoder and the Chapter 7 embedding model. Vectara's purpose-built HHEM
would be the better judge and it does not load under the transformers version
installed here, so the chapter cites its published numbers rather than
reproducing them.

Measured:

  1. why string metrics fail: exact match, token F1 and ROUGE-L on answers
     that are correct and worded differently;
  2. the RAG triad on six answers, including the verbose one;
  3. the verbosity attack: pad a good answer with true but irrelevant
     sentences and watch which metrics reward it;
  4. answer correctness as TP / FP / FN over decomposed claims;
  5. threshold calibration: where supported and unsupported claims overlap,
     and what a threshold costs on each side.

    PYTHONPATH=<scratch>/pylib HF_HOME=<scratch>/hf python3 judge.py
"""

import difflib
import re
import statistics
from collections import Counter

from querygap import CORPUS

NLI = "cross-encoder/nli-distilroberta-base"
LABELS = ["contradiction", "entailment", "neutral"]

QUESTION = "I couldn't take my flight, how do I get my money back?"
CONTEXT_DOCS = [7, 8, 14, 22, 13]

# The reference answer a human would write, for the string metrics only.
REFERENCE = ("Tickets in fare classes L, K and T are non-refundable. If you "
             "cancel more than 24 hours after purchase the fare becomes a "
             "travel credit valid for twelve months, and taxes and airport "
             "charges can be refunded to your original payment method.")

ANSWERS = {
    "good": (
        "Tickets in fare classes L, K and T are non-refundable. "
        "If you cancelled more than 24 hours after purchase, the fare is "
        "issued as a travel credit valid for twelve months. "
        "Government taxes and airport charges can be returned to your "
        "original form of payment on request."
    ),
    "paraphrase": (
        "You will not get cash back on an L, K or T ticket. "
        "What you get instead is a credit for the fare, good for a year from "
        "issue, provided the cancellation came more than a day after booking. "
        "The tax and airport portions can go back on your card if you ask."
    ),
    "unfaithful": (
        "Tickets in fare classes L, K and T are non-refundable. "
        "The fare is returned to your original form of payment within seven "
        "working days. "
        "Government taxes and airport charges can be returned on request."
    ),
    "irrelevant": (
        "Larkspur operates 22 Airbus A320neo and 6 A321neo aircraft with an "
        "average age of 4.2 years. "
        "Wi-Fi is available on the A320neo fleet. "
        "The support line is open 06:00 to 23:00 CET."
    ),
    "verbose": (
        "Tickets in fare classes L, K and T are non-refundable. "
        "If you cancelled more than 24 hours after purchase, the fare is "
        "issued as a travel credit valid for twelve months. "
        "Government taxes and airport charges can be returned to your "
        "original form of payment on request. "
        "Larkspur sells fare classes Y, B, M, H, Q, L, K and T in descending "
        "order of flexibility. "
        "A travel credit is held against the booking reference. "
        "Flexible fares in classes Y and B may be cancelled at any time before "
        "departure. "
        "Paid extras such as priority boarding and lounge access are "
        "refundable only where the flight itself did not operate. "
        "Air passenger duty and airport charges are collected on behalf of "
        "the authorities."
    ),
    "refusal": (
        "The passages provided do not say what happens to a booking cancelled "
        "within 24 hours of purchase, so I cannot answer that from the policy. "
        "Contact support with your booking reference."
    ),
}

# The claims a correct answer must contain, for answer correctness.
GROUND_TRUTH_CLAIMS = [
    "Tickets in fare classes L, K and T are non-refundable.",
    "The fare is issued as a travel credit valid for twelve months.",
    "Taxes and airport charges can be returned to the original form of payment.",
]


def tok(s):
    return re.findall(r"[a-z0-9]+", s.lower())


def exact_match(a, b):
    return 1.0 if tok(a) == tok(b) else 0.0


def token_f1(a, b):
    ta, tb = Counter(tok(a)), Counter(tok(b))
    common = sum((ta & tb).values())
    if not common:
        return 0.0
    p, r = common / sum(ta.values()), common / sum(tb.values())
    return 2 * p * r / (p + r)


def rouge_l(a, b):
    """Longest common subsequence F-measure, which is what ROUGE-L is."""
    ta, tb = tok(a), tok(b)
    sm = difflib.SequenceMatcher(None, ta, tb)
    lcs = sum(bl.size for bl in sm.get_matching_blocks())
    if not lcs:
        return 0.0
    p, r = lcs / len(ta), lcs / len(tb)
    return 2 * p * r / (p + r)


def claims(answer):
    """Rule-based decomposition: one sentence, one claim."""
    parts = re.split(r"(?<=[.!?])\s+", answer.strip())
    return [re.sub(r"\s*\[\d+\]", "", p).strip() for p in parts if len(p.strip()) > 12]


def main():
    from sentence_transformers import SentenceTransformer, CrossEncoder

    print("loading models...")
    nli = CrossEncoder(NLI)
    ce = CrossEncoder("cross-encoder/ms-marco-MiniLM-L-6-v2")
    st = SentenceTransformer("sentence-transformers/all-MiniLM-L6-v2")
    nli.predict([("warm", "up")])
    ce.predict([("warm", "up")])
    context = [CORPUS[i] for i in CONTEXT_DOCS]

    # ---------------------------------------------------------------- 1
    print()
    print("=" * 78)
    print("1. WHY THE STRING METRICS FAIL")
    print("=" * 78)
    print(f"\n  reference answer, written by a human:")
    print(f"    {REFERENCE[:72]}...")
    print(f"\n  {'answer':<12}{'exact match':>13}{'token F1':>11}{'ROUGE-L':>10}   is it correct?")
    for name in ("good", "paraphrase", "unfaithful", "irrelevant", "refusal"):
        a = ANSWERS[name]
        correct = {"good": "yes", "paraphrase": "YES", "unfaithful": "no",
                   "irrelevant": "no", "refusal": "n/a"}[name]
        print(f"  {name:<12}{exact_match(a, REFERENCE):>13.2f}{token_f1(a, REFERENCE):>11.3f}"
              f"{rouge_l(a, REFERENCE):>10.3f}   {correct}")
    print("\n  The paraphrase says exactly the same thing in different words and")
    print("  scores far below the good answer on every string metric. Exact match")
    print("  is 0.00 for every answer including the correct ones, which is what")
    print("  happens when you score free-form text by comparing characters.")

    # ---------------------------------------------------------------- 2
    print()
    print("=" * 78)
    print("2. THE RAG TRIAD")
    print("=" * 78)
    ctx_scores = ce.predict([(QUESTION, p) for p in context])
    ctx_rel = sum(1 for s in ctx_scores if s > 0) / len(ctx_scores)
    print(f"\n  CONTEXT RELEVANCE: how much of the window is on topic")
    for d, s in zip(CONTEXT_DOCS, ctx_scores):
        print(f"    doc {d:>2}  {s:+7.2f}  {'relevant' if s > 0 else 'not relevant':<13} "
              f"{CORPUS[d][:44]}...")
    print(f"    context relevance at threshold 0 = {ctx_rel:.2f}  "
          f"({sum(1 for s in ctx_scores if s>0)}/{len(ctx_scores)} passages)")
    print("\n    Every passage scored negative, so the judge says NONE of this")
    print("    context is relevant. Doc 7 is the passage that answers the question.")
    print("    This is Chapter 14's query gap reappearing inside the METRIC: a")
    print("    question-shaped query scores badly against a policy-shaped passage,")
    print("    and a threshold of 0 inherited from the reranker's training data is")
    print("    meaningless here. Calibrate the judge on your own pairs, or score")
    print("    relatively:")
    ranked = sorted(zip(CONTEXT_DOCS, ctx_scores), key=lambda x: -x[1])
    print(f"      ranked: " + ", ".join(f"doc {d} ({v:+.2f})" for d, v in ranked))
    gold_rank = [d for d, _ in ranked].index(7) + 1
    print(f"      the answer-bearing passage, doc 7, ranks {gold_rank} of "
          f"{len(ranked)} even relatively.")
    print("      So the ranking does not rescue it either: the judge puts the")
    print("      taxes page above the fare-rules page that actually answers the")
    print("      question. An uncalibrated relevance judge is not a weak signal,")
    print("      it is the wrong signal, and reporting its decimal would be worse")
    print("      than reporting nothing.")
    print("    Context relevance is a property of RETRIEVAL, not of the answer. It")
    print("    does not change when the answer changes, which is why it is in the triad.")

    def faithfulness(answer):
        """Each claim entailed by at least one passage, judged per passage."""
        cs = claims(answer)
        if not cs:
            return 0.0, []
        per = []
        for c in cs:
            best = -99.0
            for p in context:
                sc = nli.predict([(p, c)])[0]
                e = float(sc[LABELS.index("entailment")])
                best = max(best, e)
            per.append(best)
        return sum(1 for e in per if e > 0) / len(per), per

    def answer_relevance(answer):
        qv = st.encode([QUESTION], normalize_embeddings=True)[0]
        av = st.encode([answer], normalize_embeddings=True)[0]
        return float(qv @ av)

    print(f"\n  {'answer':<12}{'claims':>8}{'faithfulness':>14}{'answer relevance':>18}")
    faith, rel = {}, {}
    for name, a in ANSWERS.items():
        f, per = faithfulness(a)
        r = answer_relevance(a)
        faith[name], rel[name] = f, r
        print(f"  {name:<12}{len(claims(a)):>8}{f:>14.2f}{r:>18.3f}")

    print("\n  The row that should worry you is 'unfaithful', which scores 1.00.")
    print("  Its middle claim, that the fare is returned to your card within seven")
    print("  working days, is not in any of these five passages. The NLI judge")
    print("  entailed it anyway. A faithfulness metric returning a perfect score")
    print("  on a fabricated claim is the failure this whole chapter is about.")
    print("\n  Read the verbose row against the good row.")
    print(f"    good     faithfulness {faith['good']:.2f}   relevance {rel['good']:.3f}")
    print(f"    verbose  faithfulness {faith['verbose']:.2f}   relevance {rel['verbose']:.3f}")
    print("    The verbose answer contains every true statement the good answer")
    print("    contains, plus five more that are also true and answer nothing.")

    # ---------------------------------------------------------------- 3
    print()
    print("=" * 78)
    print("3. THE VERBOSITY ATTACK, ONE SENTENCE AT A TIME")
    print("=" * 78)
    padding = claims(ANSWERS["verbose"])[3:]
    base = claims(ANSWERS["good"])
    print(f"\n  {'padding sentences':<20}{'faithfulness':>14}{'answer relevance':>18}{'length':>9}")
    for n in range(len(padding) + 1):
        a = " ".join(base + padding[:n])
        f, _ = faithfulness(a)
        print(f"  {n:<20}{f:>14.2f}{answer_relevance(a):>18.3f}{len(tok(a)):>9}")
    print("\n  This is NOT the result the literature would lead you to expect, and")
    print("  the difference is the point. Padding LOWERED both scores here:")
    print("  faithfulness fell because each added sentence is one more claim that")
    print("  must be entailed, and embedding relevance fell because the answer")
    print("  vector drifted away from the question. These cheap deterministic")
    print("  metrics are not fooled by length.")
    print("\n  LLM judges are. MT-Bench measured a 'repetitive list' attack that")
    print("  GPT-3.5 and Claude-v1 fell for in 91.3% of cases. So verbosity bias")
    print("  is a property of the JUDGE, not of the quality being judged, and the")
    print("  two families of scorer fail in different directions. That is the")
    print("  argument for running both rather than picking one.")

    # ---------------------------------------------------------------- 4
    print()
    print("=" * 78)
    print("4. ANSWER CORRECTNESS: TP, FP, FN OVER CLAIMS")
    print("=" * 78)
    print("\n  Against the three claims a correct answer must make.")
    print(f"\n  {'answer':<12}{'TP':>5}{'FP':>5}{'FN':>5}{'precision':>11}{'recall':>9}{'F1':>8}")
    for name in ("good", "paraphrase", "unfaithful", "verbose", "irrelevant", "refusal"):
        cs = claims(ANSWERS[name])
        tp = 0
        matched = set()
        for gi, g in enumerate(GROUND_TRUTH_CLAIMS):
            for c in cs:
                e = float(nli.predict([(c, g)])[0][LABELS.index("entailment")])
                if e > 0:
                    tp += 1
                    matched.add(gi)
                    break
        tp = len(matched)
        fn = len(GROUND_TRUTH_CLAIMS) - tp
        fp = 0
        for c in cs:
            supported_by_gt = any(
                float(nli.predict([(g, c)])[0][LABELS.index("entailment")]) > 0
                or float(nli.predict([(c, g)])[0][LABELS.index("entailment")]) > 0
                for g in GROUND_TRUTH_CLAIMS)
            if not supported_by_gt:
                fp += 1
        p = tp / (tp + fp) if tp + fp else 0.0
        r = tp / (tp + fn) if tp + fn else 0.0
        f1 = 2 * p * r / (p + r) if p + r else 0.0
        print(f"  {name:<12}{tp:>5}{fp:>5}{fn:>5}{p:>11.2f}{r:>9.2f}{f1:>8.2f}")
    print("\n  Correctness needs ground truth and faithfulness does not, which is")
    print("  why the two disagree. The verbose answer is faithful AND has the")
    print("  worst precision, because most of what it says was never asked for.")

    # ---------------------------------------------------------------- 5
    print()
    print("=" * 78)
    print("5. CALIBRATING THE THRESHOLD")
    print("=" * 78)
    supported, unsupported = [], []
    for name in ("good", "paraphrase", "verbose"):
        _, per = faithfulness(ANSWERS[name])
        supported += per
    for name in ("unfaithful", "irrelevant"):
        _, per = faithfulness(ANSWERS[name])
        unsupported += per
    print(f"\n  entailment score of a claim against its best supporting passage")
    print(f"    claims from grounded answers   n={len(supported):<3} "
          f"min {min(supported):+7.2f}  median {statistics.median(supported):+7.2f}  max {max(supported):+7.2f}")
    print(f"    claims from ungrounded answers n={len(unsupported):<3} "
          f"min {min(unsupported):+7.2f}  median {statistics.median(unsupported):+7.2f}  max {max(unsupported):+7.2f}")
    overlap_lo = max(min(supported), min(unsupported))
    overlap_hi = min(max(supported), max(unsupported))
    print(f"\n    the two distributions overlap between {overlap_lo:+.2f} and {overlap_hi:+.2f}")
    print(f"\n  {'threshold':>10}{'grounded claims kept':>22}{'ungrounded claims caught':>26}")
    for t in (-2.0, -1.0, 0.0, 1.0, 2.0, 3.0):
        keep = sum(1 for e in supported if e > t) / len(supported)
        catch = sum(1 for e in unsupported if e <= t) / len(unsupported)
        print(f"  {t:>10.1f}{keep:>22.2f}{catch:>26.2f}")
    print("\n  There is no threshold that keeps every grounded claim and catches")
    print("  every ungrounded one, because the distributions overlap. Pick the")
    print("  side you would rather be wrong on and say so in the runbook.")


if __name__ == "__main__":
    main()
