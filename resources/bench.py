import numpy as np, time, platform
rng = np.random.default_rng(0)
print("machine:", platform.machine(), "| numpy", np.__version__)
def bench(N, d, nq=20, reps=3):
    X = rng.standard_normal((N, d), dtype=np.float32)
    X /= np.linalg.norm(X, axis=1, keepdims=True)
    Q = rng.standard_normal((nq, d), dtype=np.float32)
    Q /= np.linalg.norm(Q, axis=1, keepdims=True)
    best = 1e9
    for _ in range(reps):
        t0 = time.perf_counter()
        for q in Q:
            s = X @ q                 # N dot products
            np.argpartition(s, -10)[-10:]
        best = min(best, (time.perf_counter() - t0) / nq)
    mb = N * d * 4 / 1e6
    return best * 1000, mb, (N * d) / best / 1e9    # ms/query, MB, GFLOP-ish (mul-add pairs/s)
print(f"{'N':>9} {'d':>6} {'ms/query':>10} {'qps':>9} {'index MB':>10} {'Gpair/s':>9}")
for N, d in [(10_000,384),(100_000,384),(1_000_000,384),(10_000,1536),(100_000,1536),(500_000,1536)]:
    ms, mb, gp = bench(N, d)
    print(f"{N:>9,} {d:>6} {ms:>10.2f} {1000/ms:>9.0f} {mb:>10.0f} {gp:>9.1f}")
