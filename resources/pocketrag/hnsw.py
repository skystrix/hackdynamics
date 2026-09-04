"""PocketRAG, layer 3b: the HNSW graph.  Chapter 34.

Malkov and Yashunin's hierarchical navigable small world graph, built from
the 2018 paper: a stack of layers, each a proximity graph, with an
exponentially decaying number of nodes as you go up. Search descends greedily
through the sparse upper layers to land near the answer, then explores layer 0
with a beam of width ef.

Reads the vectors table embed.py wrote, persists the graph back to SQLite.
Python 3.12+, standard library only.

    python3 hnsw.py <db> --build [--M 16] [--ef 200]
    python3 hnsw.py <db> "a query, embedded on the fly"   (needs the model)
"""
import array, heapq, math, random, sqlite3, struct, sys

M_DEFAULT, EF_CONSTRUCTION, EF_SEARCH = 16, 200, 64

SCHEMA = """
CREATE TABLE IF NOT EXISTS hnsw_meta (
  k TEXT PRIMARY KEY, v TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS hnsw_nodes (
  id    INTEGER PRIMARY KEY,
  label TEXT NOT NULL UNIQUE,
  level INTEGER NOT NULL);
CREATE TABLE IF NOT EXISTS hnsw_edges (
  id    INTEGER NOT NULL,
  level INTEGER NOT NULL,
  peers BLOB NOT NULL,
  PRIMARY KEY (id, level)) WITHOUT ROWID;
"""


def dot(a, b) -> float:
    s = 0.0
    for i in range(len(a)):
        s += a[i] * b[i]
    return s


class HNSW:
    """Vectors are L2-normalised, so cosine distance is 1 - dot product."""

    def __init__(self, M: int = M_DEFAULT, ef_construction: int = EF_CONSTRUCTION,
                 seed: int = 42):
        self.M, self.Mmax0 = M, M * 2
        self.ef_construction = ef_construction
        self.mL = 1.0 / math.log(M)          # the paper's level normaliser
        self.rng = random.Random(seed)
        self.vectors: list[array.array] = []
        self.labels: list[str] = []
        self.levels: list[int] = []
        self.edges: list[list[list[int]]] = []   # edges[id][level] -> [ids]
        self.entry: int | None = None
        self.max_level = -1

    # ---------------------------------------------------------------- basics
    def distance(self, a: int, q) -> float:
        return 1.0 - dot(self.vectors[a], q)

    def _random_level(self) -> int:
        return int(-math.log(self.rng.random()) * self.mL)

    # ------------------------------------------------- paper's algorithm 2
    def _search_layer(self, q, entries: list[int], ef: int, level: int) -> list[tuple[float, int]]:
        """Greedy beam search in one layer. Returns [(distance, id)], nearest first."""
        visited = set(entries)
        candidates = [(self.distance(e, q), e) for e in entries]
        heapq.heapify(candidates)                     # min-heap: closest first
        found = [(-d, i) for d, i in candidates]
        heapq.heapify(found)                          # max-heap: worst at top
        while candidates:
            d, c = heapq.heappop(candidates)
            if d > -found[0][0] and len(found) >= ef:
                break                                 # nothing closer remains
            for peer in self.edges[c][level]:
                if peer in visited:
                    continue
                visited.add(peer)
                dp = self.distance(peer, q)
                if len(found) < ef or dp < -found[0][0]:
                    heapq.heappush(candidates, (dp, peer))
                    heapq.heappush(found, (-dp, peer))
                    if len(found) > ef:
                        heapq.heappop(found)
        return sorted((-d, i) for d, i in found)

    # ------------------------------------------------- paper's algorithm 4
    def _select_neighbours(self, q, candidates: list[tuple[float, int]],
                           m: int) -> list[int]:
        """Heuristic selection: keep a candidate only if it is closer to the
        query than to anything already kept. That is what stops every node
        connecting to the same dense cluster and keeps the graph navigable."""
        kept: list[int] = []
        for d, c in sorted(candidates):
            if len(kept) >= m:
                break
            if all(1.0 - dot(self.vectors[c], self.vectors[k]) > d for k in kept):
                kept.append(c)
        for d, c in sorted(candidates):               # top up if too strict
            if len(kept) >= m:
                break
            if c not in kept:
                kept.append(c)
        return kept

    # ------------------------------------------------- paper's algorithm 1
    def insert(self, label: str, vec) -> int:
        node = len(self.vectors)
        level = self._random_level()
        self.vectors.append(vec); self.labels.append(label)
        self.levels.append(level)
        self.edges.append([[] for _ in range(level + 1)])
        if self.entry is None:
            self.entry, self.max_level = node, level
            return node
        ep = [self.entry]
        for lc in range(self.max_level, level, -1):   # descend, greedily
            ep = [self._search_layer(vec, ep, 1, lc)[0][1]]
        for lc in range(min(level, self.max_level), -1, -1):
            found = self._search_layer(vec, ep, self.ef_construction, lc)
            mmax = self.Mmax0 if lc == 0 else self.M
            peers = self._select_neighbours(vec, found, self.M)
            self.edges[node][lc] = list(peers)
            for p in peers:                           # links are bidirectional
                self.edges[p][lc].append(node)
                if len(self.edges[p][lc]) > mmax:     # and must be pruned
                    cand = [(1.0 - dot(self.vectors[p], self.vectors[x]), x)
                            for x in self.edges[p][lc]]
                    self.edges[p][lc] = self._select_neighbours(
                        self.vectors[p], cand, mmax)
            ep = [i for _, i in found]
        if level > self.max_level:
            self.entry, self.max_level = node, level
        return node

    # ------------------------------------------------- paper's algorithm 5
    def search(self, q, k: int = 10, ef: int = EF_SEARCH) -> list[tuple[str, float]]:
        if self.entry is None:
            return []
        ep = [self.entry]
        for lc in range(self.max_level, 0, -1):
            ep = [self._search_layer(q, ep, 1, lc)[0][1]]
        found = self._search_layer(q, ep, max(ef, k), 0)
        return [(self.labels[i], 1.0 - d) for d, i in found[:k]]

    def brute_force(self, q, k: int = 10) -> list[tuple[str, float]]:
        """Ground truth. O(n) and exactly right, which is what makes it useful."""
        scored = [(dot(v, q), self.labels[i]) for i, v in enumerate(self.vectors)]
        return [(lab, s) for s, lab in heapq.nlargest(k, scored)]

    # -------------------------------------------------------------- storage
    def save(self, db: sqlite3.Connection) -> None:
        db.executescript(SCHEMA)
        with db:
            db.execute("DELETE FROM hnsw_nodes"); db.execute("DELETE FROM hnsw_edges")
            db.executemany("INSERT INTO hnsw_meta VALUES (?,?)"
                           " ON CONFLICT(k) DO UPDATE SET v=excluded.v",
                           [("M", str(self.M)), ("ef_construction", str(self.ef_construction)),
                            ("entry", str(self.entry)), ("max_level", str(self.max_level))])
            db.executemany("INSERT INTO hnsw_nodes VALUES (?,?,?)",
                           [(i, self.labels[i], self.levels[i])
                            for i in range(len(self.labels))])
            # an empty list is written as no row, so both languages agree:
            # node:sqlite binds a zero-length blob as NULL
            db.executemany("INSERT INTO hnsw_edges VALUES (?,?,?)",
                           [(i, lc, struct.pack(f"<{len(peers)}i", *peers))
                            for i, layers in enumerate(self.edges)
                            for lc, peers in enumerate(layers) if peers])

    @classmethod
    def load(cls, db: sqlite3.Connection, vectors: dict[str, array.array]) -> "HNSW":
        meta = dict(db.execute("SELECT k, v FROM hnsw_meta"))
        h = cls(M=int(meta["M"]), ef_construction=int(meta["ef_construction"]))
        rows = db.execute("SELECT id, label, level FROM hnsw_nodes ORDER BY id").fetchall()
        h.labels = [r[1] for r in rows]
        h.levels = [r[2] for r in rows]
        h.vectors = [vectors[lab] for lab in h.labels]
        h.edges = [[[] for _ in range(lv + 1)] for lv in h.levels]
        for i, lc, blob in db.execute("SELECT id, level, peers FROM hnsw_edges"):
            h.edges[i][lc] = list(struct.unpack(f"<{len(blob)//4}i", blob))
        h.entry, h.max_level = int(meta["entry"]), int(meta["max_level"])
        return h


def load_vectors(db: sqlite3.Connection) -> dict[str, array.array]:
    from embed import unpack
    return {cid: unpack(blob)
            for cid, blob in db.execute("SELECT chunk_id, vec FROM vectors")}


def build(db: sqlite3.Connection, M: int = M_DEFAULT,
          ef: int = EF_CONSTRUCTION) -> HNSW:
    vecs = load_vectors(db)
    h = HNSW(M=M, ef_construction=ef)
    for label, v in vecs.items():
        h.insert(label, v)
    h.save(db)
    return h


def main(argv):
    db = sqlite3.connect(argv[1])
    if "--build" in argv:
        M = int(argv[argv.index("--M") + 1]) if "--M" in argv else M_DEFAULT
        ef = int(argv[argv.index("--ef") + 1]) if "--ef" in argv else EF_CONSTRUCTION
        import time
        t0 = time.perf_counter()
        h = build(db, M, ef)
        levels = {}
        for lv in h.levels:
            levels[lv] = levels.get(lv, 0) + 1
        print(f"  built {len(h.labels)} nodes in {time.perf_counter()-t0:.1f}s  "
              f"M={M} ef_construction={ef}")
        print(f"  levels: " + "  ".join(f"L{k}:{v}" for k, v in sorted(levels.items())))
        return
    from sentence_transformers import SentenceTransformer
    from embed import MODEL
    q = array.array("f", SentenceTransformer(MODEL).encode(
        [argv[2]], normalize_embeddings=True)[0].tolist())
    h = HNSW.load(db, load_vectors(db))
    for label, sim in h.search(q, k=5):
        text = db.execute("SELECT text FROM chunks WHERE chunk_id=?", (label,)).fetchone()
        print(f"  {sim:.3f}  {(text[0] if text else label)[:84]}")


if __name__ == "__main__":
    main(sys.argv)
