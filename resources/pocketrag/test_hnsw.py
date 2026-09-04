"""The test Chapter 34 ends with.

Three claims: recall@10 against brute force clears 0.95 at ef=64, recall rises
monotonically with ef, and a fuzzer inserting random points never drops recall
below 0.9. numpy is used only to compute the ground truth quickly; the graph
itself is standard library.

    python3 test_hnsw.py <db> [n_queries]
"""
import array, random, sqlite3, sys, time
from hnsw import HNSW, load_vectors, build


def check(label, ok, detail=""):
    print(f"  {'PASS' if ok else 'FAIL'}  {label}{detail}")
    assert ok, label


def ground_truth(vectors, queries, k=10):
    """Exact top-k by full scan. numpy here is a test convenience, not part of
    PocketRAG: the same thing in pure Python is 40 lines and 100x slower."""
    import numpy as np
    labels = list(vectors)
    V = np.array([vectors[l] for l in labels], dtype=np.float32)
    Q = np.array([vectors[l] for l in queries], dtype=np.float32)
    S = Q @ V.T
    idx = np.argpartition(-S, k, axis=1)[:, :k]
    return [{labels[j] for j in row} for row in idx]


def main(dbpath, n_queries=200):
    db = sqlite3.connect(dbpath)
    vectors = load_vectors(db)
    n = len(vectors)
    print(f"  {n} vectors of dim {len(next(iter(vectors.values())))}\n")

    h = HNSW.load(db, vectors)
    rng = random.Random(7)
    queries = rng.sample(list(vectors), min(n_queries, n))
    truth = ground_truth(vectors, queries)

    # 1. the headline: recall at the default ef
    t0 = time.perf_counter()
    hits = tot = 0
    for q, want in zip(queries, truth):
        got = {l for l, _ in h.search(vectors[q], k=10, ef=64)}
        hits += len(got & want); tot += len(want)
    r64 = hits / tot
    ms = (time.perf_counter() - t0) / len(queries) * 1000
    check("recall@10 at ef=64 clears 0.95", r64 >= 0.95, f" ({r64:.4f}, {ms:.1f} ms/query)")

    # 2. the curve: more beam, more recall, and where it stops paying
    print("\n    ef    recall@10   ms/query   speedup vs brute force")
    t0 = time.perf_counter()
    for q in queries[:50]:
        h.brute_force(vectors[q], k=10)
    brute_ms = (time.perf_counter() - t0) / 50 * 1000
    curve = []
    for ef in (10, 16, 32, 64, 128, 256):
        t0 = time.perf_counter()
        hits = tot = 0
        for q, want in zip(queries, truth):
            got = {l for l, _ in h.search(vectors[q], k=10, ef=ef)}
            hits += len(got & want); tot += len(want)
        ms = (time.perf_counter() - t0) / len(queries) * 1000
        curve.append(hits / tot)
        print(f"   {ef:>4}    {hits/tot:.4f}     {ms:7.2f}    {brute_ms/ms:6.1f}x")
    check("recall rises with ef", all(b >= a - 1e-9 for a, b in zip(curve, curve[1:])))

    # 3. the fuzzer: random points into a fresh graph, recall must hold
    print()
    frng = random.Random(11)
    dim = len(next(iter(vectors.values())))
    fz = HNSW(seed=3)
    pts = {}
    worst = 1.0
    for i in range(1500):
        v = array.array("f", [frng.gauss(0, 1) for _ in range(dim)])
        norm = sum(x * x for x in v) ** 0.5
        v = array.array("f", [x / norm for x in v])
        pts[f"f{i}"] = v
        fz.insert(f"f{i}", v)
        if i and i % 500 == 0:
            qs = frng.sample(list(pts), 40)
            gt = ground_truth(pts, qs)
            hh = tt = 0
            for q, want in zip(qs, gt):
                got = {l for l, _ in fz.search(pts[q], k=10, ef=64)}
                hh += len(got & want); tt += len(want)
            worst = min(worst, hh / tt)
            print(f"    fuzzer at {i:>4} points: recall@10 {hh/tt:.4f}")
    check("fuzzer recall never drops below 0.9", worst >= 0.9, f" (worst {worst:.4f})")


if __name__ == "__main__":
    print("PocketRAG HNSW, chapter 34")
    main(sys.argv[1] if len(sys.argv) > 1 else "big.db",
         int(sys.argv[2]) if len(sys.argv) > 2 else 200)
    print("\n  all checks passed")
