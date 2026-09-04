"""PocketRAG, layer 5e: the entity graph.  Chapter 36.

Chapter 23 stored the link between two passages as an edge instead of
rediscovering it at query time; Chapter 24 asked the question no single passage
answers and needed communities to do it. This builds both over the Larkspur
corpus, into SQLite tables beside the chunks, and answers Q4 a second way.

  entities    what the corpus talks about, extracted deterministically
  mentions    entity to chunk, which is the edge that beats chunking
  edges       entity to entity, weighted by how often they co-occur
  communities Leiden at two resolutions, so there is a hierarchy to search
  reports     one summary per community, which is what global search reads

Extraction is patterns plus a lexicon, not a model. Real GraphRAG asks a model
for entities and relationships and gets richer, messier output; this is
reproducible, costs nothing, and is honest about being the floor rather than
the ceiling. Community reports are extractive for the same reason: no model API
is reachable from this machine, so a report is the community's entities plus
its highest-degree passage, and their token counts are real because the strings
are real.

    python3 graph.py <db> --build          extract, cluster, report
    python3 graph.py <db> --global "..."   map-reduce over community reports
    python3 graph.py <db> --local "..."    one hop from the matched entity
"""
import re, sqlite3, sys
from collections import Counter, defaultdict

SCHEMA = """
CREATE TABLE IF NOT EXISTS entities (
  entity_id INTEGER PRIMARY KEY,
  kind      TEXT NOT NULL,
  name      TEXT NOT NULL,
  UNIQUE (kind, name));
CREATE TABLE IF NOT EXISTS mentions (
  entity_id INTEGER NOT NULL REFERENCES entities(entity_id),
  chunk_id  TEXT NOT NULL,
  PRIMARY KEY (entity_id, chunk_id)) WITHOUT ROWID;
CREATE TABLE IF NOT EXISTS edges (
  a INTEGER NOT NULL, b INTEGER NOT NULL, weight INTEGER NOT NULL,
  PRIMARY KEY (a, b)) WITHOUT ROWID;
CREATE TABLE IF NOT EXISTS communities (
  level INTEGER NOT NULL, community INTEGER NOT NULL, entity_id INTEGER NOT NULL,
  PRIMARY KEY (level, entity_id)) WITHOUT ROWID;
CREATE TABLE IF NOT EXISTS reports (
  level INTEGER NOT NULL, community INTEGER NOT NULL,
  title TEXT NOT NULL, summary TEXT NOT NULL,
  n_entities INTEGER NOT NULL, n_chunks INTEGER NOT NULL,
  PRIMARY KEY (level, community)) WITHOUT ROWID;
"""

# Chapter 24's extractor, unchanged in shape: regex for the things with a form,
# a lexicon for the things without one.
PATTERNS = [
    ("Incident", r"INC-\d+"),
    ("Ticket", r"[Ss]upport ticket (\d+)"),
    ("Money", r"(\d+(?:\.\d+)?) EUR"),
    ("Airport", r"\b(Lisbon|Porto|Bordeaux|Palermo)\b"),
    ("Aircraft", r"\b(A320neo|A321neo)\b"),
    ("Regulation", r"\b(EU Regulation \d+/\d+)\b"),
]

TOPICS = [
    "refund", "cancellation", "travel credit", "baggage", "checked bag",
    "cabin bag", "seat selection", "check-in", "no-show", "compensation",
    "chargeback", "taxes", "name change", "special assistance", "pets",
    "musical instrument", "delay", "schedule change", "fare rules",
    "group booking", "unaccompanied minor", "dangerous goods", "wi-fi",
    "boarding", "codeshare", "downgrade", "voucher", "infant", "fare class",
    "data protection", "meals", "sports equipment", "payment", "club",
]


def extract(text: str) -> set[tuple[str, str]]:
    """(kind, name) for one passage. Names are lowercased so that 'Refund' and
    'refund' are one entity, which is the cheapest third of chapter 23's
    entity resolution and the chapter says what the other two thirds were."""
    found = set()
    for kind, pat in PATTERNS:
        for m in re.finditer(pat, text):
            found.add((kind, (m.group(1) if m.groups() else m.group(0)).lower()))
    low = text.lower()
    for topic in TOPICS:
        if topic in low:
            found.add(("Topic", topic))
    return found


def build(db: sqlite3.Connection) -> None:
    db.executescript(SCHEMA)
    with db:
        for t in ("entities", "mentions", "edges", "communities", "reports"):
            db.execute(f"DELETE FROM {t}")
        per_chunk = {}
        for cid, text in db.execute("SELECT chunk_id, text FROM chunks"):
            per_chunk[cid] = extract(text)
        ids: dict[tuple[str, str], int] = {}
        for ents in per_chunk.values():
            for e in ents:
                if e not in ids:
                    ids[e] = len(ids) + 1
        db.executemany("INSERT INTO entities VALUES (?,?,?)",
                       [(i, k, n) for (k, n), i in ids.items()])
        db.executemany("INSERT INTO mentions VALUES (?,?)",
                       [(ids[e], cid) for cid, ents in per_chunk.items() for e in ents])
        # Co-mention in a passage is the edge. Weight is how many passages.
        pair = Counter()
        for ents in per_chunk.values():
            ordered = sorted(ids[e] for e in ents)
            for i, a in enumerate(ordered):
                for b in ordered[i + 1:]:
                    pair[(a, b)] += 1
        db.executemany("INSERT INTO edges VALUES (?,?,?)",
                       [(a, b, w) for (a, b), w in pair.items()])


def cluster(db: sqlite3.Connection, resolutions=(0.4, 2.0)) -> None:
    """Leiden, at two resolutions, which is the cheap version of chapter 24's
    hierarchy: level 0 is a few broad communities, level 1 splits them."""
    import igraph, leidenalg
    ids = [r[0] for r in db.execute("SELECT entity_id FROM entities ORDER BY entity_id")]
    pos = {e: i for i, e in enumerate(ids)}
    edges = db.execute("SELECT a, b, weight FROM edges").fetchall()
    g = igraph.Graph(n=len(ids), edges=[(pos[a], pos[b]) for a, b, _ in edges])
    g.es["weight"] = [w for _, _, w in edges]
    with db:
        db.execute("DELETE FROM communities")
        for level, res in enumerate(resolutions):
            part = leidenalg.find_partition(
                g, leidenalg.RBConfigurationVertexPartition,
                weights="weight", resolution_parameter=res, seed=7)
            db.executemany("INSERT INTO communities VALUES (?,?,?)",
                           [(level, part.membership[pos[e]], e) for e in ids])


def report(db: sqlite3.Connection) -> None:
    """One summary per community. A model would write prose; this lists the
    community's entities in degree order and quotes its most connected
    passage, which is a real string with a real token count and a worse
    summary than a model would produce."""
    from ingest import ntokens
    with db:
        db.execute("DELETE FROM reports")
        rows = []
        for level, community in db.execute(
                "SELECT DISTINCT level, community FROM communities"):
            ents = db.execute(
                "SELECT e.entity_id, e.kind, e.name FROM entities e "
                "JOIN communities c ON c.entity_id = e.entity_id "
                "WHERE c.level=? AND c.community=?", (level, community)).fetchall()
            eids = [e[0] for e in ents]
            marks = "(%s)" % ",".join("?" * len(eids))
            chunks = Counter(
                cid for (cid,) in db.execute(
                    f"SELECT chunk_id FROM mentions WHERE entity_id IN {marks}", eids))
            if not chunks:
                continue
            names = [n for _, _, n in ents]
            top_chunk, _ = chunks.most_common(1)[0]
            text = db.execute("SELECT text FROM chunks WHERE chunk_id=?",
                              (top_chunk,)).fetchone()[0]
            title = ", ".join(names[:3])
            summary = (f"This community covers {len(names)} entities across "
                       f"{len(chunks)} passages: {', '.join(sorted(names))}. "
                       f"Its most connected passage says: {text}")
            rows.append((level, community, title, summary, len(names), len(chunks)))
        db.executemany("INSERT INTO reports VALUES (?,?,?,?,?,?)", rows)
        return sum(ntokens(r[3]) for r in rows)


# ------------------------------------------------------------ global search
def global_search(db, question: str, level: int = 0, top: int = 3):
    """Map-reduce over community reports. Map: score every report against the
    question and keep the ones that match. Reduce: gather what each kept report
    contributes. Chapter 24's point is that this reads a summary of everything
    instead of the top k of anything, which is why it can answer a question
    about the whole corpus."""
    from bm25 import analyze
    want = {t for t, _ in analyze(question)}
    scored = []
    for community, title, summary, n_e, n_c in db.execute(
            "SELECT community, title, summary, n_entities, n_chunks "
            "FROM reports WHERE level=?", (level,)):
        have = {t for t, _ in analyze(summary)}
        hits = len(want & have)
        if hits:
            scored.append((hits / len(want), community, title, n_e, n_c))
    # Ties on term overlap are the common case with short reports, so the
    # bigger community wins: it explains more of the corpus for the same match.
    scored.sort(key=lambda r: (r[0], r[4]), reverse=True)
    return scored[:top]


# ------------------------------------------------------------- local search
def local_search(db, question: str, hops: int = 1):
    """Q4 the graph way. Match an entity in the question, take the passages
    that mention it, then take the passages that mention what THOSE passages
    also mention. The second hop is an edge lookup, not a second retrieval."""
    low = question.lower()
    # Word-boundary match, not substring: the entity '20' is otherwise found
    # inside 'INC-2042' and seeds the hop with every passage that names a price.
    seeds = [(eid, kind, name) for eid, kind, name in
             db.execute("SELECT entity_id, kind, name FROM entities")
             if re.search(rf"(?<![\w-]){re.escape(name)}(?![\w-])", low)]
    if not seeds:
        return [], []
    eids = [s[0] for s in seeds]
    marks = "(%s)" % ",".join("?" * len(eids))
    first = [c for (c,) in db.execute(
        f"SELECT DISTINCT chunk_id FROM mentions WHERE entity_id IN {marks}", eids)]
    # what those passages talk about, minus what we already asked for
    neigh = [e for (e,) in db.execute(
        "SELECT DISTINCT entity_id FROM mentions WHERE chunk_id IN (%s)"
        % ",".join("?" * len(first)), first) if e not in eids]
    if not neigh:
        return seeds, first
    marks2 = "(%s)" % ",".join("?" * len(neigh))
    counts = Counter(cid for (cid,) in db.execute(
        f"SELECT chunk_id FROM mentions WHERE entity_id IN {marks2}", neigh)
        if cid not in first)
    return seeds, [c for c, _ in counts.most_common(5)]


def main(argv):
    db = sqlite3.connect(argv[1])
    if "--build" in argv:
        build(db)
        cluster(db)
        toks = report(db)
        ne = db.execute("SELECT COUNT(*) FROM entities").fetchone()[0]
        nm = db.execute("SELECT COUNT(*) FROM mentions").fetchone()[0]
        ned = db.execute("SELECT COUNT(*) FROM edges").fetchone()[0]
        print(f"  {ne} entities, {nm} mentions, {ned} edges")
        for level, in db.execute("SELECT DISTINCT level FROM communities"):
            n = db.execute("SELECT COUNT(DISTINCT community) FROM communities "
                           "WHERE level=?", (level,)).fetchone()[0]
            sizes = [r[0] for r in db.execute(
                "SELECT COUNT(*) FROM communities WHERE level=? GROUP BY community "
                "ORDER BY 1 DESC", (level,))]
            print(f"  level {level}: {n} communities, sizes {sizes}")
        print(f"  all community reports together: {toks} tokens")
        for kind, n in db.execute("SELECT kind, COUNT(*) FROM entities "
                                  "GROUP BY kind ORDER BY 2 DESC"):
            print(f"    {kind:12s} {n:3d}")
    if "--global" in argv:
        q = argv[argv.index("--global") + 1]
        print(f"\n  global: {q}")
        for frac, community, title, n_e, n_c in global_search(db, q):
            print(f"    community {community:2d}  match {frac:.2f}  "
                  f"{n_e:3d} entities  {n_c:2d} passages  {title[:52]}")
    if "--local" in argv:
        q = argv[argv.index("--local") + 1]
        seeds, chunks = local_search(db, q)
        print(f"\n  local: {q}")
        print(f"    matched entities: {[n for _, _, n in seeds]}")
        for cid in chunks:
            text = db.execute("SELECT text FROM chunks WHERE chunk_id=?",
                              (cid,)).fetchone()[0]
            print(f"    {cid[:8]}  {text.split('.')[0]}")


if __name__ == "__main__":
    main(sys.argv)
