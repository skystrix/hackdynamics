"""The selectivity cliff, measured: post-filter over-fetch depth vs pre-filter exact scan."""
import numpy as np
exec(open('hnsw.py').read().split('N, dim, NQ =')[0])
rng = np.random.default_rng(21)
N, dim, NQ, K = 5000, 64, 100, 10
centers = rng.standard_normal((25, dim)).astype(np.float32)
X = np.repeat(centers, N//25, axis=0) + 0.35*rng.standard_normal((N, dim)).astype(np.float32)
X /= np.linalg.norm(X, axis=1, keepdims=True)
qi = rng.choice(N, NQ, replace=False)
Q = X[qi] + 0.15*rng.standard_normal((NQ, dim)).astype(np.float32)
Q /= np.linalg.norm(Q, axis=1, keepdims=True)
idx = HNSW(dim, M=16, ef_construction=64)
for v in X: idx.add(v)
print(f"HNSW N={N} d={dim} (25 clusters), M=16, ef_construction=64, {NQ} queries, want K={K}")
print("the filter attribute is random, so it is independent of position in the space\n")
DEPTHS=(10, 40, 200, 1000)
print(f"{'selectivity':>11}{'matching':>9} |" + "".join(f"  L={L:<5}recall/ret/dist" for L in DEPTHS) + " |  PRE: dist")
for sel in (1.0, 0.5, 0.2, 0.05, 0.01):
    mask = rng.random(N) < sel
    allowed = np.where(mask)[0]; aset=set(allowed.tolist()); Xa = X[allowed]
    truths = [set(allowed[np.argsort(-(Xa @ q))[:K]].tolist()) for q in Q]
    line = f"{sel*100:10.1f}%{len(allowed):9d} |"
    for L in DEPTHS:
        rec, ret, dc = 0.0, 0.0, 0.0
        for q, truth in zip(Q, truths):
            got, calls = idx.search(q, L, L)      # fetch L unfiltered, then filter (post-filter)
            kept = [g for g in got if g in aset][:K]
            rec += len(set(kept)&truth)/K; ret += len(kept); dc += calls
        line += f"   {rec/NQ:5.3f} {ret/NQ:4.1f} {dc/NQ:5.0f}"
    print(line + f" | {len(allowed):9d}")
