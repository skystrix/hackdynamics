"""Minimal HNSW, faithful to Malkov & Yashunin 2018, to MEASURE recall vs ef and M."""
import numpy as np, heapq, math, time
rng = np.random.default_rng(7)

class HNSW:
    def __init__(self, dim, M=16, ef_construction=64, seed=7):
        self.M, self.Mmax0, self.efc = M, 2*M, ef_construction
        self.mL = 1.0/math.log(M)              # level normalisation, paper's suggestion
        self.rng = np.random.default_rng(seed)
        self.data, self.layers, self.ep, self.maxlevel = [], [], None, -1
        self.dist_calls = 0
    def _d(self, i, q):
        self.dist_calls += 1
        return float(np.dot(self.data[i], q))   # unit vectors: higher = closer
    def _search_layer(self, q, entry, ef, lc):
        visited = set(entry)
        cand = [(-self._d(e, q), e) for e in entry]          # max-heap by similarity
        heapq.heapify(cand)
        best = [(self._d(e, q), e) for e in entry]           # min-heap: worst at top
        heapq.heapify(best)
        while cand:
            negsim, c = heapq.heappop(cand)
            if -negsim < best[0][0] and len(best) >= ef: break
            for nb in self.layers[lc].get(c, ()):
                if nb in visited: continue
                visited.add(nb)
                d = self._d(nb, q)
                if len(best) < ef or d > best[0][0]:
                    heapq.heappush(cand, (-d, nb)); heapq.heappush(best, (d, nb))
                    if len(best) > ef: heapq.heappop(best)
        return best
    def _select(self, q, cands, M):
        """Paper's heuristic: keep c only if it is closer to q than to any kept element."""
        kept = []
        for d, c in sorted(cands, key=lambda x: -x[0]):
            if len(kept) >= M: break
            if all(np.dot(self.data[c], self.data[k]) < d for _, k in kept): kept.append((d, c))
        for d, c in sorted(cands, key=lambda x: -x[0]):     # top up if heuristic was strict
            if len(kept) >= M: break
            if (d, c) not in kept: kept.append((d, c))
        return [c for _, c in kept[:M]]
    def add(self, v):
        idx = len(self.data); self.data.append(v)
        level = int(-math.log(self.rng.random()) * self.mL)
        while len(self.layers) <= level: self.layers.append({})
        if self.ep is None:
            for lc in range(level+1): self.layers[lc][idx] = []
            self.ep, self.maxlevel = idx, level; return
        ep = [self.ep]
        for lc in range(self.maxlevel, level, -1):
            ep = [max(self._search_layer(v, ep, 1, lc))[1]]
        for lc in range(min(level, self.maxlevel), -1, -1):
            W = self._search_layer(v, ep, self.efc, lc)
            nbrs = self._select(v, W, self.M)
            self.layers[lc][idx] = list(nbrs)
            Mmax = self.Mmax0 if lc == 0 else self.M
            for nb in nbrs:
                self.layers[lc].setdefault(nb, []).append(idx)
                if len(self.layers[lc][nb]) > Mmax:
                    cs = [(float(np.dot(self.data[x], self.data[nb])), x) for x in self.layers[lc][nb]]
                    self.layers[lc][nb] = self._select(self.data[nb], cs, Mmax)
            ep = [x for _, x in W]
        if level > self.maxlevel: self.ep, self.maxlevel = idx, level
    def search(self, q, k=10, ef=40):
        self.dist_calls = 0
        ep = [self.ep]
        for lc in range(self.maxlevel, 0, -1):
            ep = [max(self._search_layer(q, ep, 1, lc))[1]]
        W = self._search_layer(q, ep, max(ef, k), 0)
        return [i for _, i in sorted(W, reverse=True)[:k]], self.dist_calls

N, dim, NQ = 5000, 64, 100
X = rng.standard_normal((N, dim)).astype(np.float32); X /= np.linalg.norm(X,axis=1,keepdims=True)
Q = rng.standard_normal((NQ, dim)).astype(np.float32); Q /= np.linalg.norm(Q,axis=1,keepdims=True)
truth = [set(np.argsort(-(X @ q))[:10].tolist()) for q in Q]
print(f"N={N} dim={dim} queries={NQ}, ground truth by exact scan\n")
for M in (4, 8, 16, 32):
    t0=time.perf_counter(); idx = HNSW(dim, M=M, ef_construction=64)
    for v in X: idx.add(v)
    build = time.perf_counter()-t0
    edges = sum(len(v) for L in idx.layers for v in L.values())
    row=[]
    for ef in (10, 20, 40, 80, 160):
        rec, calls = 0, 0
        for q, t in zip(Q, truth):
            got, c = idx.search(q, 10, ef); rec += len(set(got)&t)/10; calls += c
        row.append((ef, rec/NQ, calls/NQ))
    print(f"M={M:2d} build={build:5.1f}s levels={len(idx.layers)} edges={edges} ({edges/N:.1f}/node)")
    for ef, r, c in row: print(f"     ef={ef:4d}  recall@10={r:.3f}  dist_calls={c:7.0f}  ({c/N*100:4.1f}% of a scan)")
