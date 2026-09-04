"""IVF and Product Quantization from the papers, to MEASURE the recall/memory trade-offs."""
import numpy as np, time
rng = np.random.default_rng(3)

def kmeans(X, k, iters=20, seed=0):
    """Lloyd's algorithm, distances via ||x||^2 - 2x.c + ||c||^2 (no giant broadcast)."""
    r = np.random.default_rng(seed)
    C = X[r.choice(len(X), k, replace=False)].copy()
    xn = (X*X).sum(1)
    for _ in range(iters):
        a = np.argmin(xn[:,None] - 2*(X @ C.T) + (C*C).sum(1)[None,:], axis=1)
        for j in range(k):
            m = a == j
            if m.any(): C[j] = X[m].mean(0)
    a = np.argmin(xn[:,None] - 2*(X @ C.T) + (C*C).sum(1)[None,:], axis=1)
    return C, a

N, d, NQ, K = 20000, 128, 200, 10
centers = rng.standard_normal((40, d)).astype(np.float32)
X = np.repeat(centers, N//40, axis=0) + 0.40*rng.standard_normal((N, d)).astype(np.float32)
X /= np.linalg.norm(X, axis=1, keepdims=True)
qi = rng.choice(N, NQ, replace=False)
Q = (X[qi] + 0.18*rng.standard_normal((NQ, d)).astype(np.float32))
Q /= np.linalg.norm(Q, axis=1, keepdims=True)
truth = [set(np.argsort(-(X @ q))[:K].tolist()) for q in Q]
print(f"corpus N={N} d={d} (40 clusters), {NQ} queries, K={K}\n")

print("=== IVF: nlist x nprobe (exact distances inside probed cells) ===")
for nlist in (64, 256):
    t0=time.perf_counter(); C, assign = kmeans(X, nlist, seed=1); tb=time.perf_counter()-t0
    C = C/np.linalg.norm(C, axis=1, keepdims=True)
    cells = [np.where(assign==j)[0] for j in range(nlist)]
    sizes = [len(c) for c in cells]
    print(f"  nlist={nlist}: trained in {tb:.1f}s, cell sizes min {min(sizes)} median {int(np.median(sizes))} max {max(sizes)}")
    for nprobe in (1, 2, 4, 8, 16):
        rec, scanned = 0.0, 0
        for q, t in zip(Q, truth):
            order = np.argsort(-(C @ q))[:nprobe]
            cand = np.concatenate([cells[j] for j in order])
            scanned += len(cand)
            top = cand[np.argsort(-(X[cand] @ q))[:K]]
            rec += len(set(top.tolist()) & t)/K
        print(f"    nprobe={nprobe:3d}  recall@10={rec/NQ:.3f}  scanned={scanned/NQ:7.0f} ({scanned/NQ/N*100:5.1f}% of corpus)")
    print()

print("=== PQ: m sub-vectors x 256 centroids, exhaustive asymmetric distance ===")
def train_pq(X, m, ksub=256, seed=2):
    ds = X.shape[1]//m
    books = np.zeros((m, ksub, ds), np.float32); codes = np.zeros((len(X), m), np.uint8)
    for i in range(m):
        C, a = kmeans(np.ascontiguousarray(X[:, i*ds:(i+1)*ds]), ksub, iters=12, seed=seed+i)
        books[i], codes[:, i] = C, a.astype(np.uint8)
    return books, codes, ds
pq_cache = {}
for m in (4, 8, 16, 32):
    t0=time.perf_counter(); books, codes, ds = train_pq(X, m); tt=time.perf_counter()-t0
    pq_cache[m] = (books, codes, ds)
    rec = 0.0
    for q, t in zip(Q, truth):
        tab = np.stack([books[i] @ q[i*ds:(i+1)*ds] for i in range(m)])
        scores = tab[np.arange(m)[None,:], codes].sum(1)
        rec += len(set(np.argsort(-scores)[:K].tolist()) & t)/K
    print(f"  m={m:3d}  {m:3d} B/vector (from {d*4})  {d*4/m:5.1f}x smaller  recall@10={rec/NQ:.3f}  train {tt:4.1f}s")
print()
print("=== PQ (m=16, 16 B/vector) + exact rescoring of the top-R ===")
books, codes, ds = pq_cache[16]
for R in (10, 20, 50, 100, 200, 500):
    rec = 0.0
    for q, t in zip(Q, truth):
        tab = np.stack([books[i] @ q[i*ds:(i+1)*ds] for i in range(16)])
        scores = tab[np.arange(16)[None,:], codes].sum(1)
        cand = np.argpartition(-scores, R)[:R]
        top = cand[np.argsort(-(X[cand] @ q))[:K]]
        rec += len(set(top.tolist()) & t)/K
    print(f"  rescore top-{R:4d}  recall@10={rec/NQ:.3f}")
