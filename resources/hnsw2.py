import numpy as np, time
exec(open('hnsw.py').read().split('N, dim, NQ =')[0])   # reuse the HNSW class
N, dim, NQ = 5000, 64, 100
rng2 = np.random.default_rng(11)
# clustered data: 25 topic clusters, like real embeddings (Chapter 10's exception)
centers = rng2.standard_normal((25, dim)).astype(np.float32)
X = np.repeat(centers, N//25, axis=0) + 0.35*rng2.standard_normal((N, dim)).astype(np.float32)
X /= np.linalg.norm(X, axis=1, keepdims=True)
qi = rng2.choice(N, NQ, replace=False)
Q = X[qi] + 0.15*rng2.standard_normal((NQ, dim)).astype(np.float32)
Q /= np.linalg.norm(Q, axis=1, keepdims=True)
truth = [set(np.argsort(-(X @ q))[:10].tolist()) for q in Q]
t0=time.perf_counter(); idx = HNSW(dim, M=16, ef_construction=64)
for v in X: idx.add(v)
print(f"CLUSTERED (25 clusters, dim={dim}, N={N}), M=16 ef_construction=64, build {time.perf_counter()-t0:.1f}s")
for ef in (10, 20, 40, 80, 160):
    rec, calls = 0, 0
    for q, t in zip(Q, truth):
        got, c = idx.search(q, 10, ef); rec += len(set(got)&t)/10; calls += c
    print(f"  ef={ef:4d}  recall@10={rec/NQ:.3f}  dist_calls={calls/NQ:7.0f}  ({calls/NQ/N*100:4.1f}% of a scan)")
