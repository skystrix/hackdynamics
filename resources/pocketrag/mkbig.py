"""Build the large chunk set Chapter 34's scale test needs: real sentences
from the books in resources/, one sentence per chunk, written straight into
the chunks table so embed.py and hnsw.py can treat them like any other."""
import hashlib, re, sqlite3, sys
from ingest import load_pdf, connect, ntokens

BOOKS = ["../RAG_In_Depth/essential-graphrag.pdf",
         "../../pdfs/networking-in-depth/computer-networking.pdf",
         "../../pdfs/networking-in-depth/tcp-ip-illustrated.pdf"]


def main(dbpath, want=20000):
    db = connect(dbpath)
    seen, rows = set(), []
    for book in BOOKS:
        try:
            els = load_pdf(open(book, "rb").read())
        except (OSError, ValueError) as e:
            print(f"  skip {book.split('/')[-1][:40]}: {e}"); continue
        for _, _, text in els:
            for s in re.split(r"(?<=[.!?])\s+", text):
                s = re.sub(r"\s+", " ", s).strip()
                if len(s.split()) < 6 or len(s) > 600:
                    continue
                h = hashlib.sha256(s.encode()).hexdigest()[:16]
                if h in seen:
                    continue
                seen.add(h)
                rows.append((h, book, len(rows), "para", "", s, ntokens(s)))
                if len(rows) >= want:
                    break
            if len(rows) >= want: break
        if len(rows) >= want: break
    with db:
        db.execute("DELETE FROM chunks"); db.execute("DELETE FROM documents")
        db.executemany(
            "INSERT INTO chunks(chunk_id,doc_id,ord,element,heading,text,n_tokens)"
            " VALUES (?,?,?,?,?,?,?)", rows)
    print(f"  {len(rows)} sentence chunks from {len(BOOKS)} books, "
          f"mean {sum(r[6] for r in rows)/len(rows):.0f} tokens")


if __name__ == "__main__":
    main(sys.argv[1], int(sys.argv[2]) if len(sys.argv) > 2 else 20000)
