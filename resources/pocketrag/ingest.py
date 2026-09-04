"""PocketRAG, layer 1: the ingest pipeline.  Chapter 32.

Loads Markdown, HTML and PDF into an element stream, chunks it, and upserts
into SQLite idempotently. Python 3.12+, standard library only.

    python3 ingest.py <db> <file>...      ingest or re-ingest
    python3 ingest.py <db> --prune <file>...   also tombstone what is missing
"""
import hashlib, math, re, sqlite3, sys, zlib
from datetime import datetime, timezone

TARGET, OVERLAP = 512, 64          # tokens per chunk, tokens repeated (ch 5)
PIECE = re.compile(r"[A-Za-z0-9]+|[^\sA-Za-z0-9]")
FUDGE = 1.05                       # measured against cl100k; see the chapter


def ntokens(text: str) -> int:
    """Approximate the model's tokenizer. Within a few percent; see ch 32."""
    return math.ceil(len(PIECE.findall(text)) * FUDGE)


# ---------------------------------------------------------------- loaders
# Every loader returns the same thing: [(element, heading, text)], where
# element is one of heading / para / list / code / table.

def load_markdown(src: str) -> list[tuple[str, str, str]]:
    out, heading, buf, fence = [], "", [], False
    def flush(kind="para"):
        if buf:
            out.append((kind, heading, "\n".join(buf).strip()))
            buf.clear()
    for line in src.splitlines():
        if line.startswith("```"):
            flush("code" if fence else "para")
            fence = not fence
            continue
        if fence:
            buf.append(line)
        elif line.startswith("#"):
            flush()
            heading = line.lstrip("#").strip()
            out.append(("heading", heading, heading))
        elif re.match(r"\s*([-*+]|\d+\.)\s", line):
            buf.append(line.strip())
        elif not line.strip():
            flush()
        else:
            buf.append(line.strip())
    flush()
    return out


BLOCK = re.compile(r"<(h[1-6]|p|li|pre|td)[^>]*>(.*?)</\1>", re.S | re.I)
TAG = re.compile(r"<[^>]+>")
ENT = {"&amp;": "&", "&lt;": "<", "&gt;": ">", "&quot;": '"', "&#39;": "'", "&nbsp;": " "}


def load_html(src: str) -> list[tuple[str, str, str]]:
    src = re.sub(r"<(script|style)[^>]*>.*?</\1>", " ", src, flags=re.S | re.I)
    kinds = {"p": "para", "li": "list", "pre": "code", "td": "table"}
    out, heading = [], ""
    for m in BLOCK.finditer(src):
        tag, inner = m.group(1).lower(), TAG.sub(" ", m.group(2))
        for k, v in ENT.items():
            inner = inner.replace(k, v)
        text = re.sub(r"\s+", " ", inner).strip()
        if not text:
            continue
        if tag.startswith("h"):
            heading = text
            out.append(("heading", heading, text))
        else:
            out.append((kinds[tag], heading, text))
    return out


SHOW = re.compile(rb"\((?:\\.|[^()\\])*\)")
UNESC = {b"\\n": b"\n", b"\\r": b"", b"\\t": b" ", b"\\(": b"(", b"\\)": b")", b"\\\\": b"\\"}


def load_pdf(raw: bytes) -> list[tuple[str, str, str]]:
    """Minimal extractor: inflate each stream, keep the ones that are text
    content, and collect the strings the text operators show. Deliberately
    small; see the chapter for exactly what it cannot do."""
    parts = []
    for blob in re.findall(rb"stream\r?\n(.*?)\r?\nendstream", raw, re.S):
        try:
            content = zlib.decompress(blob)
        except zlib.error:
            continue
        if b"BT" not in content:          # not a text-showing content stream
            continue
        shown = []
        for s in SHOW.findall(content):
            body = s[1:-1]
            for k, v in UNESC.items():
                body = body.replace(k, v)
            shown.append(body.decode("latin-1", "replace"))
        text = "".join(shown)
        if not text:
            continue
        printable = sum(1 for c in text if 32 <= ord(c) < 127 or c in "\n\t")
        if printable / len(text) < 0.9:   # an image that happened to match
            continue
        parts.append(text)
    if not parts:
        raise ValueError("no extractable text: this PDF draws glyphs as paths "
                         "or is a scan. Run OCR first (ch 31).")
    text = re.sub(r"[ \t]+", " ", "\n".join(parts))
    return [("para", "", p.strip()) for p in text.split("\n") if p.strip()]


def load(path: str) -> list[tuple[str, str, str]]:
    raw = open(path, "rb").read()
    if path.endswith(".pdf"):
        return load_pdf(raw)
    src = raw.decode("utf-8", "replace")
    return load_html(src) if path.endswith((".html", ".htm")) else load_markdown(src)


# ---------------------------------------------------------------- chunker
def chunk(elements: list[tuple[str, str, str]]) -> list[dict]:
    """Pack elements up to TARGET tokens, never splitting an element unless it
    alone exceeds the target, and repeat OVERLAP tokens across the seam."""
    chunks, buf, ntok = [], [], 0

    def emit():
        if not buf:
            return
        text = "\n\n".join(t for _, _, t in buf)
        chunks.append({"element": buf[0][0], "heading": buf[0][1],
                       "text": text, "n_tokens": ntokens(text)})

    for el in elements:
        kind, heading, text = el
        size = ntokens(text)
        if size > TARGET:                       # one element too big: split it
            emit(); buf, ntok = [], 0
            words = text.split(" ")
            step = max(1, int(len(words) * (TARGET - OVERLAP) / size))
            span = max(1, int(len(words) * TARGET / size))
            for i in range(0, len(words), step):
                piece = " ".join(words[i:i + span])
                chunks.append({"element": kind, "heading": heading,
                               "text": piece, "n_tokens": ntokens(piece)})
                if i + span >= len(words):
                    break
            continue
        if ntok + size > TARGET:
            emit()
            tail, back = [], 0                  # carry OVERLAP tokens forward
            for prev in reversed(buf):
                psize = ntokens(prev[2])
                if psize > OVERLAP * 2:         # never carry a big element:
                    break                       # it would blow the next chunk
                back += psize
                tail.insert(0, prev)
                if back >= OVERLAP:
                    break
            buf, ntok = tail, back
        buf.append(el); ntok += size
    emit()
    return chunks


# ---------------------------------------------------------------- storage
SCHEMA = """
CREATE TABLE IF NOT EXISTS documents (
  doc_id       TEXT PRIMARY KEY,
  content_hash TEXT NOT NULL,
  n_chunks     INTEGER NOT NULL,
  ingested_at  TEXT NOT NULL,
  deleted      INTEGER NOT NULL DEFAULT 0);
CREATE TABLE IF NOT EXISTS chunks (
  chunk_id  TEXT PRIMARY KEY,
  doc_id    TEXT NOT NULL,
  ord       INTEGER NOT NULL,
  element   TEXT NOT NULL,
  heading   TEXT NOT NULL,
  text      TEXT NOT NULL,
  n_tokens  INTEGER NOT NULL);
CREATE INDEX IF NOT EXISTS chunks_by_doc ON chunks(doc_id);
"""


def connect(path: str) -> sqlite3.Connection:
    db = sqlite3.connect(path)
    db.execute("PRAGMA foreign_keys=ON")
    db.executescript(SCHEMA)
    return db


def ingest(db: sqlite3.Connection, path: str) -> str:
    """Returns 'unchanged', 'inserted' or 'replaced'. Idempotent by content."""
    raw = open(path, "rb").read()
    digest = hashlib.sha256(raw).hexdigest()
    row = db.execute("SELECT content_hash FROM documents WHERE doc_id=?",
                     (path,)).fetchone()
    if row and row[0] == digest:
        db.execute("UPDATE documents SET deleted=0 WHERE doc_id=?", (path,))
        db.commit()
        return "unchanged"
    pieces = chunk(load(path))
    with db:                                    # one transaction: all or none
        db.execute("DELETE FROM chunks WHERE doc_id=?", (path,))
        db.execute(
            "INSERT INTO documents(doc_id,content_hash,n_chunks,ingested_at,deleted)"
            " VALUES(?,?,?,?,0) ON CONFLICT(doc_id) DO UPDATE SET"
            " content_hash=excluded.content_hash, n_chunks=excluded.n_chunks,"
            " ingested_at=excluded.ingested_at, deleted=0",
            (path, digest, len(pieces), datetime.now(timezone.utc).isoformat()))
        db.executemany(
            "INSERT INTO chunks(chunk_id,doc_id,ord,element,heading,text,n_tokens)"
            " VALUES(?,?,?,?,?,?,?)",
            [(f"{digest[:12]}:{i}", path, i, c["element"], c["heading"],
              c["text"], c["n_tokens"]) for i, c in enumerate(pieces)])
    return "replaced" if row else "inserted"


def prune(db: sqlite3.Connection, seen: set[str]) -> int:
    """Tombstone documents that were not in this run and drop their chunks."""
    gone = [r[0] for r in db.execute("SELECT doc_id FROM documents WHERE deleted=0")
            if r[0] not in seen]
    with db:
        for doc in gone:
            db.execute("UPDATE documents SET deleted=1, n_chunks=0 WHERE doc_id=?", (doc,))
            db.execute("DELETE FROM chunks WHERE doc_id=?", (doc,))
    return len(gone)


def main(argv: list[str]) -> None:
    dbpath, args = argv[1], argv[2:]
    do_prune = "--prune" in args
    files = [a for a in args if a != "--prune"]
    db = connect(dbpath)
    for f in files:
        print(f"{ingest(db, f):>9}  {f}")
    if do_prune:
        print(f"{prune(db, set(files)):>9}  tombstoned")
    docs, chunks_, toks = db.execute(
        "SELECT (SELECT COUNT(*) FROM documents WHERE deleted=0),"
        " (SELECT COUNT(*) FROM chunks), (SELECT COALESCE(SUM(n_tokens),0) FROM chunks)"
    ).fetchone()
    print(f"\n  {docs} documents, {chunks_} chunks, {toks} tokens")


if __name__ == "__main__":
    main(sys.argv)
