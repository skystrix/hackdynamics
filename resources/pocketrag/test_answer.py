"""The test Chapter 35 ends with.

Four claims: the questions whose answers are in the corpus are answered with
citations that resolve; the two whose answers are not there are refused; the
permission filter never leaks; and the cascade actually narrows.

    python3 test_answer.py <db>
"""
import sqlite3, sys
from answer import (answer, verify, retrieve, rerank, allowed, USERS,
                    K_CANDIDATES, K_RERANK, REFUSE_BELOW)

QUESTIONS = [
    ("Q1", "Can I bring my cello in the cabin?", "answer"),
    ("Q2", "I couldn't take my flight, how do I get my money back?", "answer"),
    ("Q3", "How many refund tickets were opened in March?", "refuse"),
    ("Q4", "Which baggage policy changed after incident INC-2042?", "answer"),
    ("Q5", "Can I bring my emotional support peacock in the cabin?", "refuse"),
]


def check(label, ok, detail=""):
    print(f"  {'PASS' if ok else 'FAIL'}  {label}{detail}")
    assert ok, label


def main(dbpath):
    db = sqlite3.connect(dbpath)
    from sentence_transformers import SentenceTransformer, CrossEncoder
    from embed import MODEL
    st = SentenceTransformer(MODEL)
    ce = CrossEncoder("cross-encoder/ms-marco-MiniLM-L-6-v2")

    print(f"  refusal threshold {REFUSE_BELOW:+.1f}, cascade "
          f"{K_CANDIDATES} -> {K_RERANK}\n")
    results = {}
    for tag, q, want in QUESTIONS:
        r = answer(db, q, "staff", st, ce)
        results[tag] = r
        got = "refuse" if r["refused"] else "answer"
        print(f"    {tag}  {r['top_score']:+7.3f}  {got:<7} (want {want})")
    check("\n  every question lands on the intended side",
          all(("refuse" if results[t]["refused"] else "answer") == w
              for t, _, w in QUESTIONS))

    margin = (min(r["top_score"] for t, r in results.items() if not r["refused"])
              - max(r["top_score"] for t, r in results.items() if r["refused"]))
    check("the refusal threshold has margin", margin > 1.0, f" ({margin:.3f} logits)")

    broken = []
    for tag, r in results.items():
        if r["refused"]:
            continue
        for n, ok, claim in verify(r):
            if not ok:
                broken.append((tag, n, claim[:40]))
    check("every citation resolves to its passage", not broken,
          f" ({sum(len(r['citations']) for r in results.values())} citations)"
          if not broken else f" {broken}")

    # the leak test from chapter 28, now against the answering path
    leaks = 0
    for user in USERS:
        keep = allowed(db, user)
        for _, q, _ in QUESTIONS:
            r = answer(db, q, user, st, ce)
            leaks += sum(1 for _, cid, _ in r["packed"] if cid not in keep)
    check("no permitted-label violation in any answer", leaks == 0,
          f" ({len(USERS)} users x {len(QUESTIONS)} questions)")

    # the cascade must actually narrow, or it is not a cascade
    cands = retrieve(db, QUESTIONS[0][1], "staff", model=st)
    ranked = rerank(db, QUESTIONS[0][1], cands, ce)
    check("the cascade narrows", len(ranked) <= K_RERANK <= len(cands),
          f" ({len(cands)} candidates -> {len(ranked)} reranked)")


if __name__ == "__main__":
    print("PocketRAG answers, chapter 35")
    main(sys.argv[1] if len(sys.argv) > 1 else "lex.db")
    print("\n  all checks passed")
