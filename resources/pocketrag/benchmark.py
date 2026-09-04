"""PocketRAG, layer 5c: the honest benchmark.  Chapter 36.

PocketRAG's HNSW against libraries people actually deploy, on the same vectors,
the same queries and the same machine, with the conditions printed next to the
numbers because a benchmark without its conditions is a marketing claim.

  pocketrag   the Chapter 34 graph: pure Python, float32 in a list of arrays
  hnswlib     the reference implementation of the same algorithm, in C++
  faiss-flat  exact search, the correctness floor and the latency ceiling
  faiss-ivfpq Chapter 12's machinery: coarse cells plus product quantization

Recall is measured against exact search over the same vectors, so it is recall
of the index and not of the embedding model. Latency is single query, single
thread, no batching, warm process, which is the shape a RAG request has and
the shape ANN leaderboards do not use: they report batched throughput, which
is a different and larger number.

    python3 benchmark.py <db> [--n 20000] [--queries 200]
"""
import array, resource, sqlite3, statistics, sys, time

from hnsw import HNSW, load_vectors

K = 10
EFS = (16, 32, 64, 128)


def rss_mb() -> float:
    """Peak resident set, which on macOS is bytes and on Linux kilobytes."""
    peak = resource.getrusage(resource.RUSAGE_SELF).ru_maxrss
    return peak / (1024 ** 2) if sys.platform == "darwin" else peak / 1024


def timed(fn, queries, repeat: int = 1):
    """p50 and p95 over per-query wall time, in milliseconds. Percentiles, not
    a mean, because Chapter 29's point is that the tail is the user experience."""
    times, results = [], []
    for q in queries * repeat:
        t0 = time.perf_counter()
        results.append(fn(q))
        times.append((time.perf_counter() - t0) * 1000)
    times.sort()
    return {"p50": statistics.median(times),
            "p95": times[int(len(times) * 0.95)],
            "results": results[:len(queries)]}


def recall(got: list[list[str]], truth: list[list[str]]) -> float:
    return statistics.mean(len(set(g) & set(t)) / len(t) for g, t in zip(got, truth))


def main(argv):
    n = int(argv[argv.index("--n") + 1]) if "--n" in argv else None
    nq = int(argv[argv.index("--queries") + 1]) if "--queries" in argv else 200
    db = sqlite3.connect(argv[1])
    vecs = load_vectors(db)
    labels = list(vecs)[:n] if n else list(vecs)
    dim = len(vecs[labels[0]])
    # Queries are held-out corpus vectors: a real query vector lives in the
    # same space, and using one guarantees a non-empty neighbourhood.
    qlabels, dlabels = labels[:nq], labels[nq:]
    queries = [vecs[l] for l in qlabels]
    print(f"  {len(dlabels)} vectors, {dim} dimensions, {len(queries)} queries, k={K}")
    print(f"  single query, single thread, no batching, Python "
          f"{sys.version.split()[0]} on {sys.platform}")

    import numpy as np
    mat = np.array([vecs[l] for l in dlabels], dtype="float32")
    qmat = np.array(queries, dtype="float32")

    # ------------------------------------------------- ground truth (exact)
    t0 = time.perf_counter()
    sims = qmat @ mat.T
    truth = [[dlabels[i] for i in np.argsort(-row)[:K]] for row in sims]
    print(f"  exact ground truth for {len(queries)} queries in "
          f"{time.perf_counter() - t0:.2f}s")

    rows = []

    # --------------------------------------------------------- pocketrag
    h = HNSW(M=16, ef_construction=200)
    t0 = time.perf_counter()
    for lab in dlabels:
        h.insert(lab, vecs[lab])
    build_s = time.perf_counter() - t0
    for ef in EFS:
        r = timed(lambda q, ef=ef: [lab for lab, _ in h.search(q, k=K, ef=ef)], queries)
        rows.append((f"pocketrag ef={ef}", recall(r["results"], truth),
                     r["p50"], r["p95"], build_s,
                     len(dlabels) * dim * 4 / 1e6))

    # ----------------------------------------------------------- hnswlib
    try:
        import hnswlib
        idx = hnswlib.Index(space="ip", dim=dim)
        idx.init_index(max_elements=len(dlabels), M=16, ef_construction=200)
        t0 = time.perf_counter()
        idx.add_items(mat, list(range(len(dlabels))))
        hb = time.perf_counter() - t0
        for ef in EFS:
            idx.set_ef(max(ef, K))
            r = timed(lambda q, i=idx: [dlabels[j] for j in
                                        i.knn_query(np.array(q, dtype="float32"), k=K)[0][0]],
                      queries)
            rows.append((f"hnswlib ef={ef}", recall(r["results"], truth),
                         r["p50"], r["p95"], hb, len(dlabels) * dim * 4 / 1e6))
    except ImportError:
        print("  hnswlib not installed, skipped")

    # ------------------------------------------------------------- faiss
    try:
        import faiss
        flat = faiss.IndexFlatIP(dim)
        t0 = time.perf_counter(); flat.add(mat); fb = time.perf_counter() - t0
        r = timed(lambda q, i=flat: [dlabels[j] for j in
                                     i.search(np.array([q], dtype="float32"), K)[1][0]], queries)
        rows.append(("faiss-flat", recall(r["results"], truth), r["p50"], r["p95"],
                     fb, len(dlabels) * dim * 4 / 1e6))

        # IVF-PQ: 96 bytes per vector instead of 1536, which is chapter 12.
        nlist, m, nbits = 128, 48, 8
        quant = faiss.IndexFlatIP(dim)
        ivf = faiss.IndexIVFPQ(quant, dim, nlist, m, nbits)
        t0 = time.perf_counter(); ivf.train(mat); ivf.add(mat)
        ib = time.perf_counter() - t0
        for nprobe in (1, 8, 32):
            ivf.nprobe = nprobe
            r = timed(lambda q, i=ivf: [dlabels[j] for j in
                                        i.search(np.array([q], dtype="float32"), K)[1][0]
                                        if j >= 0], queries)
            rows.append((f"faiss-ivfpq np={nprobe}", recall(r["results"], truth),
                         r["p50"], r["p95"], ib, len(dlabels) * m / 1e6))
    except ImportError:
        print("  faiss not installed, skipped")

    print(f"\n  {'system':22s} {'recall@10':>9s} {'p50 ms':>8s} {'p95 ms':>8s} "
          f"{'build s':>8s} {'vectors MB':>10s}")
    for name, rec, p50, p95, b, mb in rows:
        print(f"  {name:22s} {rec:9.3f} {p50:8.2f} {p95:8.2f} {b:8.1f} {mb:10.1f}")
    print(f"\n  peak RSS for the whole process: {rss_mb():.0f} MB")
    print("  'vectors MB' is the payload only: graph edges and library overhead are extra.")
    return rows


if __name__ == "__main__":
    main(sys.argv)
