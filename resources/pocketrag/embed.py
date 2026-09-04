"""PocketRAG, layer 3a: embeddings.  Chapter 34.

Turns every chunk into a vector and stores it beside the chunk. This is the
one part of PocketRAG that is Python only: the model runs once at ingest and
both languages read the vectors it wrote.

    python3 embed.py <db>            embed every chunk that has no vector
    python3 embed.py <db> --tokens   report the chapter-32 approximation error

Needs sentence-transformers. Everything downstream needs only the blobs.
"""
import array, sqlite3, sys, time

MODEL = "sentence-transformers/all-MiniLM-L6-v2"
BATCH = 64

SCHEMA = """
CREATE TABLE IF NOT EXISTS vectors (
  chunk_id TEXT PRIMARY KEY,
  dim      INTEGER NOT NULL,
  vec      BLOB NOT NULL);
"""


def pack(v) -> bytes:
    """float32, little endian, dim floats. The only format both halves know."""
    a = array.array("f", (float(x) for x in v))
    if sys.byteorder != "little":
        a.byteswap()
    return a.tobytes()


def unpack(blob: bytes) -> array.array:
    a = array.array("f")
    a.frombytes(blob)
    if sys.byteorder != "little":
        a.byteswap()
    return a


def embed_all(db: sqlite3.Connection, model=None) -> int:
    """Embed only chunks with no vector yet. Chapter 32's stable chunk ids are
    what make this incremental: an unchanged document costs nothing."""
    db.executescript(SCHEMA)
    todo = db.execute(
        "SELECT c.chunk_id, c.text FROM chunks c"
        " LEFT JOIN vectors v ON v.chunk_id = c.chunk_id"
        " WHERE v.chunk_id IS NULL").fetchall()
    if not todo:
        return 0
    if model is None:
        from sentence_transformers import SentenceTransformer
        model = SentenceTransformer(MODEL)
    # The model truncates silently at max_seq_length. Chapter 32 sized chunks
    # with an approximate tokenizer, so "512 tokens" there is not 512 here.
    # Count the damage before doing any work, and say so out loud.
    limit = model.max_seq_length
    tok = model.tokenizer
    over = [(cid, len(tok.encode(t, add_special_tokens=True)))
            for cid, t in todo]
    lost = [(cid, n) for cid, n in over if n > limit]
    if lost:
        print(f"  WARNING  {len(lost)} of {len(todo)} chunks exceed the model's "
              f"{limit}-token limit and will be TRUNCATED")
        print(f"           {sum(n - limit for _, n in lost)} tokens will be "
              f"discarded; longest chunk is {max(n for _, n in lost)} tokens")
        print(f"           lower TARGET in ingest.py and re-ingest; see chapter 34")
    t0 = time.perf_counter()
    for i in range(0, len(todo), BATCH):
        batch = todo[i:i + BATCH]
        vecs = model.encode([t for _, t in batch], normalize_embeddings=True,
                            show_progress_bar=False)
        with db:
            db.executemany("INSERT INTO vectors VALUES (?,?,?)",
                           [(cid, len(v), pack(v)) for (cid, _), v in zip(batch, vecs)])
        if i and i % (BATCH * 50) == 0:
            done, rate = i + len(batch), (i + len(batch)) / (time.perf_counter() - t0)
            print(f"    {done}/{len(todo)}  {rate:.0f} chunks/s", flush=True)
    return len(todo)


def token_report(db: sqlite3.Connection) -> None:
    """Chapter 32 approximated the tokenizer. The model brings the real one."""
    from transformers import AutoTokenizer
    import statistics
    tok = AutoTokenizer.from_pretrained(MODEL)
    sys.path.insert(0, ".")
    from ingest import ntokens
    rows = db.execute("SELECT text, n_tokens FROM chunks LIMIT 2000").fetchall()
    errs, over = [], 0
    for text, approx in rows:
        real = len(tok.encode(text, add_special_tokens=False))
        errs.append((approx - real) / real)
        if real > tok.model_max_length:
            over += 1
    errs.sort()
    print(f"  chunks compared          {len(rows)}")
    print(f"  approximation vs model   mean {statistics.mean(errs):+.1%}  "
          f"median {statistics.median(errs):+.1%}")
    print(f"  p05 {errs[len(errs)//20]:+.1%}   p95 {errs[-len(errs)//20]:+.1%}")
    print(f"  model max sequence       {tok.model_max_length} tokens")
    print(f"  chunks the model TRUNCATES: {over} of {len(rows)}")


def main(argv):
    db = sqlite3.connect(argv[1])
    if "--tokens" in argv:
        token_report(db)
        return
    t0 = time.perf_counter()
    n = embed_all(db)
    dim = db.execute("SELECT dim FROM vectors LIMIT 1").fetchone()
    total = db.execute("SELECT COUNT(*) FROM vectors").fetchone()[0]
    print(f"  embedded {n} new chunks in {time.perf_counter()-t0:.1f}s; "
          f"{total} vectors of dim {dim[0] if dim else '-'} in the database")


if __name__ == "__main__":
    main(sys.argv)
