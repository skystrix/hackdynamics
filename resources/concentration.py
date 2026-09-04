import numpy as np
rng = np.random.default_rng(1)
N = 10_000
print(f"{'d':>6} {'min':>7} {'max':>7} {'mean':>7} {'max/min':>8} {'contrast':>9}")
for d in (2, 4, 16, 64, 256, 1024):
    X = rng.standard_normal((N, d)).astype(np.float32)
    q = rng.standard_normal(d).astype(np.float32)
    dist = np.linalg.norm(X - q, axis=1)
    lo, hi, mu = dist.min(), dist.max(), dist.mean()
    print(f"{d:>6} {lo:>7.2f} {hi:>7.2f} {mu:>7.2f} {hi/lo:>8.2f} {(hi-lo)/lo:>9.3f}")
print()
# same for real-ish clustered data: 20 clusters in a 1024-d space (low intrinsic dim)
d = 1024
centers = rng.standard_normal((20, d)).astype(np.float32) * 3
X = np.repeat(centers, 500, axis=0) + rng.standard_normal((10_000, d)).astype(np.float32)
q = centers[0] + rng.standard_normal(d).astype(np.float32)
dist = np.linalg.norm(X - q, axis=1)
print(f"clustered d=1024: min {dist.min():.2f} max {dist.max():.2f} max/min {dist.max()/dist.min():.2f} contrast {(dist.max()-dist.min())/dist.min():.3f}")
