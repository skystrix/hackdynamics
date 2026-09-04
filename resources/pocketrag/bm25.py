"""PocketRAG, layer 2: the inverted index and BM25.  Chapter 33.

Reads the chunks table ingest.py wrote and nothing else. Adds an analyzer
(stopwords + the Porter stemmer, written out), a dictionary and a postings
list in SQLite, BM25 top-k with a heap, and phrase search over positions.
Python 3.12+, standard library only.

    python3 bm25.py <db> --index
    python3 bm25.py <db> "can I take my cello on board"
    python3 bm25.py <db> --phrase "travel credit"
"""
import heapq, json, math, re, sqlite3, sys

K1, B = 1.2, 0.75                  # Lucene's defaults, as in chapter 9
STOPWORDS = set(
    "a an and are as at be but by for if in into is it no not of on or such "
    "that the their then there these they this to was will with".split())

# --------------------------------------------------------------- the stemmer
# Porter's 1980 algorithm, written out. It strips suffixes in five steps so
# that "connection", "connections" and "connected" collapse to "connect".
VOWELS = "aeiou"


def _cons(w: str, i: int) -> bool:
    if w[i] in VOWELS:
        return False
    return not (w[i] == "y" and i > 0 and not _cons(w, i - 1))


def _m(w: str) -> int:
    """Count vowel-consonant sequences: the 'measure' of a stem."""
    n, i, prev_v = 0, 0, False
    while i < len(w):
        v = not _cons(w, i)
        if prev_v and not v:
            n += 1
        prev_v = v
        i += 1
    return n


def _vowel(w: str) -> bool:
    return any(not _cons(w, i) for i in range(len(w)))


def _double(w: str) -> bool:
    return len(w) > 1 and w[-1] == w[-2] and _cons(w, len(w) - 1)


def _cvc(w: str) -> bool:
    if len(w) < 3 or not _cons(w, len(w) - 1) or _cons(w, len(w) - 2) or not _cons(w, len(w) - 3):
        return False
    return w[-1] not in "wxy"


STEP2 = [("ational", "ate"), ("tional", "tion"), ("enci", "ence"), ("anci", "ance"),
         ("izer", "ize"), ("abli", "able"), ("alli", "al"), ("entli", "ent"),
         ("eli", "e"), ("ousli", "ous"), ("ization", "ize"), ("ation", "ate"),
         ("ator", "ate"), ("alism", "al"), ("iveness", "ive"), ("fulness", "ful"),
         ("ousness", "ous"), ("aliti", "al"), ("iviti", "ive"), ("biliti", "ble")]
STEP3 = [("icate", "ic"), ("ative", ""), ("alize", "al"), ("iciti", "ic"),
         ("ical", "ic"), ("ful", ""), ("ness", "")]
STEP4 = ["al", "ance", "ence", "er", "ic", "able", "ible", "ant", "ement",
         "ment", "ent", "ion", "ou", "ism", "ate", "iti", "ous", "ive", "ize"]


def stem(w: str) -> str:
    if len(w) <= 2:
        return w
    # step 1a: plurals
    if w.endswith("sses"):
        w = w[:-2]
    elif w.endswith("ies"):
        w = w[:-2]
    elif w.endswith("ss"):
        pass
    elif w.endswith("s"):
        w = w[:-1]
    # step 1b: past tense and progressive
    if w.endswith("eed"):
        if _m(w[:-3]) > 0:
            w = w[:-1]
    else:
        base = None
        if w.endswith("ed") and _vowel(w[:-2]):
            base = w[:-2]
        elif w.endswith("ing") and _vowel(w[:-3]):
            base = w[:-3]
        if base is not None:
            w = base
            if w.endswith(("at", "bl", "iz")):
                w += "e"
            elif _double(w) and w[-1] not in "lsz":
                w = w[:-1]
            elif _m(w) == 1 and _cvc(w):
                w += "e"
    # step 1c: y to i
    if w.endswith("y") and _vowel(w[:-1]):
        w = w[:-1] + "i"
    for suf, rep in STEP2:                       # step 2
        if w.endswith(suf) and _m(w[:-len(suf)]) > 0:
            w = w[:-len(suf)] + rep
            break
    for suf, rep in STEP3:                       # step 3
        if w.endswith(suf) and _m(w[:-len(suf)]) > 0:
            w = w[:-len(suf)] + rep
            break
    for suf in STEP4:                            # step 4
        if w.endswith(suf):
            base = w[:-len(suf)]
            if _m(base) > 1 and (suf != "ion" or (base and base[-1] in "st")):
                w = base
            break
    if w.endswith("e"):                          # step 5a
        if _m(w[:-1]) > 1 or (_m(w[:-1]) == 1 and not _cvc(w[:-1])):
            w = w[:-1]
    if w.endswith("ll") and _m(w) > 1:           # step 5b
        w = w[:-1]
    return w


WORD = re.compile(r"[a-z0-9]+")


def analyze(text: str) -> list[tuple[str, int]]:
    """Lowercase, split, drop stopwords, stem. Returns (term, position)."""
    out = []
    for pos, raw in enumerate(WORD.findall(text.lower())):
        if raw in STOPWORDS:
            continue
        out.append((stem(raw), pos))
    return out


# ----------------------------------------------------------------- the index
SCHEMA = """
CREATE TABLE IF NOT EXISTS terms (
  term TEXT PRIMARY KEY,
  df   INTEGER NOT NULL);
CREATE TABLE IF NOT EXISTS postings (
  term      TEXT NOT NULL,
  chunk_id  TEXT NOT NULL,
  tf        INTEGER NOT NULL,
  positions TEXT NOT NULL,
  PRIMARY KEY (term, chunk_id)) WITHOUT ROWID;
CREATE TABLE IF NOT EXISTS lengths (
  chunk_id TEXT PRIMARY KEY,
  n_terms  INTEGER NOT NULL);
"""


def build(db: sqlite3.Connection) -> tuple[int, int]:
    """Rebuild the index from the chunks table. Returns (docs, terms)."""
    db.executescript(SCHEMA)
    with db:
        db.execute("DELETE FROM terms"); db.execute("DELETE FROM postings")
        db.execute("DELETE FROM lengths")
        df: dict[str, int] = {}
        for chunk_id, text in db.execute("SELECT chunk_id, text FROM chunks"):
            posting: dict[str, list[int]] = {}
            for term, pos in analyze(text):
                posting.setdefault(term, []).append(pos)
            db.execute("INSERT INTO lengths VALUES (?,?)",
                       (chunk_id, sum(len(p) for p in posting.values())))
            db.executemany("INSERT INTO postings VALUES (?,?,?,?)",
                           [(t, chunk_id, len(p), json.dumps(p))
                            for t, p in posting.items()])
            for t in posting:
                df[t] = df.get(t, 0) + 1
        db.executemany("INSERT INTO terms VALUES (?,?)", list(df.items()))
    return db.execute("SELECT COUNT(*) FROM lengths").fetchone()[0], len(df)


def idf(n_docs: int, df: int, variant: str = "lucene") -> float:
    """Two BM25 families. See the chapter: they are not interchangeable."""
    if variant == "okapi":                       # Robertson/Sparck Jones, raw
        return math.log(n_docs - df + 0.5) - math.log(df + 0.5)
    return math.log(1 + (n_docs - df + 0.5) / (df + 0.5))   # Lucene, always > 0


def okapi_floor(db: sqlite3.Connection, n_docs: int, eps: float = 0.25) -> float:
    """Okapi IDF goes negative for terms in over half the corpus. Reference
    implementations replace those with eps x the MEAN idf over the whole
    vocabulary, which couples one term's score to every other term."""
    vals = [idf(n_docs, df, "okapi") for (df,) in db.execute("SELECT df FROM terms")]
    return eps * (sum(vals) / len(vals)) if vals else 0.0


def search(db: sqlite3.Connection, query: str, k: int | None = 10,
           k1: float = K1, b: float = B, variant: str = "lucene") -> list[tuple[str, float]]:
    n_docs, total = db.execute(
        "SELECT COUNT(*), COALESCE(SUM(n_terms),0) FROM lengths").fetchone()
    if not n_docs:
        return []
    avgdl = total / n_docs
    scores: dict[str, float] = {}
    lens = dict(db.execute("SELECT chunk_id, n_terms FROM lengths"))
    floor = okapi_floor(db, n_docs) if variant == "okapi" else 0.0
    for term in {t for t, _ in analyze(query)}:
        row = db.execute("SELECT df FROM terms WHERE term=?", (term,)).fetchone()
        if not row:
            continue
        w = idf(n_docs, row[0], variant)
        if variant == "okapi" and w < 0:
            w = floor
        for chunk_id, tf in db.execute(
                "SELECT chunk_id, tf FROM postings WHERE term=?", (term,)):
            dl = lens[chunk_id]
            scores[chunk_id] = scores.get(chunk_id, 0.0) + w * (
                tf * (k1 + 1) / (tf + k1 * (1 - b + b * dl / avgdl)))
    # top-k with a heap: O(n log k), not a full sort of every scored document
    if k is None:                                # the conformance test wants all
        return sorted(scores.items(), key=lambda kv: -kv[1])
    return heapq.nlargest(k, scores.items(), key=lambda kv: kv[1])


def phrase(db: sqlite3.Connection, text: str) -> list[str]:
    """Documents containing the terms adjacent and in order, via positions."""
    terms = [t for t, _ in analyze(text)]
    if not terms:
        return []
    lists = []
    for t in terms:
        lists.append({cid: json.loads(p) for cid, p in db.execute(
            "SELECT chunk_id, positions FROM postings WHERE term=?", (t,))})
    hits = []
    for cid in set(lists[0]).intersection(*(set(l) for l in lists[1:])):
        for start in lists[0][cid]:
            if all(start + i in lists[i][cid] for i in range(1, len(terms))):
                hits.append(cid)
                break
    return sorted(hits)


def main(argv: list[str]) -> None:
    db = sqlite3.connect(argv[1])
    if "--index" in argv:
        docs, terms = build(db)
        print(f"  indexed {docs} chunks, {terms} distinct terms")
        return
    if "--phrase" in argv:
        for cid in phrase(db, argv[argv.index("--phrase") + 1]):
            print(f"  {cid}")
        return
    for cid, score in search(db, argv[2]):
        text = db.execute("SELECT text FROM chunks WHERE chunk_id=?", (cid,)).fetchone()[0]
        print(f"  {score:6.3f}  {text[:88]}")


if __name__ == "__main__":
    main(sys.argv)
