"""The test Chapter 32 ends with. Run it; it should print PASS four times.

    python3 test_ingest.py
"""
import os, sqlite3, tempfile
from ingest import connect, ingest, prune

DOCS = {
    "a.md": "# Refunds\n\nTickets in class L are non-refundable.\n",
    "b.md": "# Baggage\n\nThe first checked bag is 25 EUR online.\n",
}


def counts(db):
    return db.execute(
        "SELECT (SELECT COUNT(*) FROM documents WHERE deleted=0),"
        " (SELECT COUNT(*) FROM chunks)").fetchone()


def check(label, got, want):
    ok = got == want
    print(f"  {'PASS' if ok else 'FAIL'}  {label}: {got}" + ("" if ok else f" != {want}"))
    assert ok, label


def main():
    with tempfile.TemporaryDirectory() as d:
        paths = {}
        for name, text in DOCS.items():
            paths[name] = os.path.join(d, name)
            open(paths[name], "w").write(text)
        db = connect(os.path.join(d, "t.db"))

        # 1. first ingest inserts
        for p in paths.values():
            ingest(db, p)
        first = counts(db)
        check("first ingest inserts", first[0], 2)

        # 2. running it again changes nothing at all
        results = [ingest(db, p) for p in paths.values()]
        check("second ingest is a no-op", results, ["unchanged", "unchanged"])
        check("row counts unchanged", counts(db), first)

        # 3. editing one document replaces exactly that document's chunks
        kept = [r[0] for r in db.execute(
            "SELECT chunk_id FROM chunks WHERE doc_id=? ORDER BY ord", (paths["b.md"],))]
        open(paths["a.md"], "w").write(
            "# Refunds\n\nTickets in class L are non-refundable.\n\n"
            "## Travel credit\n\nA credit is valid for twelve months.\n")
        check("edited doc reports replaced", ingest(db, paths["a.md"]), "replaced")
        still = [r[0] for r in db.execute(
            "SELECT chunk_id FROM chunks WHERE doc_id=? ORDER BY ord", (paths["b.md"],))]
        check("untouched doc keeps its chunk ids", still, kept)

        # 4. a document that disappears is tombstoned, its chunks removed
        os.remove(paths["b.md"])
        prune(db, {paths["a.md"]})
        check("pruned doc leaves no chunks", db.execute(
            "SELECT COUNT(*) FROM chunks WHERE doc_id=?", (paths["b.md"],)).fetchone()[0], 0)
        check("pruned doc keeps a tombstone", db.execute(
            "SELECT deleted FROM documents WHERE doc_id=?", (paths["b.md"],)).fetchone()[0], 1)


if __name__ == "__main__":
    print("PocketRAG ingest, chapter 32")
    main()
    print("\n  all checks passed")
