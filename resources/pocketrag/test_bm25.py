"""The test Chapter 33 ends with. Conformance against a reference BM25.

Needs rank_bm25 for the conformance check:  pip install rank_bm25
Everything else is standard library.

    python3 test_bm25.py <db>
"""
import sqlite3, sys
from bm25 import analyze, build, search, phrase, stem

QUERIES = [
    "cello", "checked bag", "refund", "travel credit", "pet in cabin",
    "wifi", "lithium batteries", "unaccompanied minor", "seat selection fee",
    "denied boarding compensation", "chargeback", "gift voucher", "fleet age",
    "codeshare", "special assistance", "group booking", "name change",
    "no show policy", "taxes and charges", "schedule change", "weather",
    "data protection", "sports equipment", "meals allergies", "infants",
    "boarding priority", "travel documents", "airport transfers", "route network",
    "involuntary downgrade", "payment methods", "check-in deadline", "fare classes",
    "delayed baggage", "property irregularity report", "flexible fares",
    "cancellation by larkspur", "ancillary refund", "larkspur club points",
    "contact channels", "incident post-mortem", "partner airport contract",
    "dangerous goods", "musical instruments", "cabin baggage allowance",
    "money back after missing connection", "how long does a refund take",
    "can I take my dog on board", "what am I owed for a cancelled flight",
    "purchased an extra seat for an instrument",
]


def check(label, ok, detail=""):
    print(f"  {'PASS' if ok else 'FAIL'}  {label}{detail}")
    assert ok, label


def main(dbpath):
    db = sqlite3.connect(dbpath)
    n_docs, n_terms = build(db)
    print(f"  indexed {n_docs} chunks, {n_terms} distinct terms\n")

    # 1. the stemmer collapses the forms it is supposed to collapse
    groups = [("connect", ["connect", "connected", "connecting", "connection", "connections"]),
              ("cello", ["cello", "cellos"]),
              ("refund", ["refund", "refunds", "refunded", "refunding"]),
              ("baggag", ["baggage"]), ("fli", ["flies"])]
    bad = [(root, w, stem(w)) for root, ws in groups for w in ws if stem(w) != root]
    check("stemmer collapses inflections", not bad, f" ({len(groups)} groups)" if not bad else f" {bad}")

    # 2. a keyword query puts the right passage first
    top = search(db, "musical instruments cello", k=1)
    text = db.execute("SELECT text FROM chunks WHERE chunk_id=?", (top[0][0],)).fetchone()[0]
    check("cello query ranks the instruments page first", text.startswith("Musical instruments"))

    # 3. phrase search respects adjacency
    hits = set(phrase(db, "travel credit"))
    loose = {c for c, _ in search(db, "travel credit", k=None)}
    check("phrase search is stricter than bag of words",
          hits and hits < loose, f" ({len(hits)} of {len(loose)})")
    check("phrase 'credit travel' finds nothing", phrase(db, "credit travel") == [])

    # 4. conformance: our Okapi variant against rank_bm25, to 1e-6
    try:
        from rank_bm25 import BM25Okapi
    except ImportError:
        print("\n  SKIP  rank_bm25 not installed; conformance check not run")
        return
    rows = db.execute("SELECT chunk_id, text FROM chunks ORDER BY chunk_id").fetchall()
    ids = [r[0] for r in rows]
    ref = BM25Okapi([[t for t, _ in analyze(r[1])] for r in rows], k1=1.2, b=0.75)
    worst, worst_q = 0.0, ""
    for q in QUERIES:
        mine = dict(search(db, q, k=None, variant="okapi"))
        theirs = ref.get_scores([t for t, _ in analyze(q)])
        for i, cid in enumerate(ids):
            d = abs(mine.get(cid, 0.0) - theirs[i])
            if d > worst:
                worst, worst_q = d, q
    check(f"scores match rank_bm25 over {len(QUERIES)} queries",
          worst < 1e-6, f" (max delta {worst:.2e} on {worst_q!r})")


if __name__ == "__main__":
    print("PocketRAG lexical index, chapter 33")
    main(sys.argv[1] if len(sys.argv) > 1 else "lex.db")
    print("\n  all checks passed")
