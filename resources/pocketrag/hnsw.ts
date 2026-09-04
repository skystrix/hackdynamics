/* PocketRAG, layer 3b: the HNSW graph.  Chapter 34.
 *
 * The twin of hnsw.py: Malkov and Yashunin's hierarchical navigable small
 * world graph, built from the 2018 paper. Reads the vectors embed.py wrote,
 * persists the graph back to SQLite. Node 22+, no dependencies.
 *
 *   node --experimental-strip-types hnsw.ts <db> --build [--M 16] [--ef 200]
 *   node --experimental-strip-types hnsw.ts <db> --recall 200
 */
import { DatabaseSync } from "node:sqlite";
import { pathToFileURL } from "node:url";

export const M_DEFAULT = 16, EF_CONSTRUCTION = 200, EF_SEARCH = 64;

const SCHEMA = `
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
  PRIMARY KEY (id, level)) WITHOUT ROWID;`;

export function dot(a: Float32Array, b: Float32Array): number {
  let s = 0;
  for (let i = 0; i < a.length; i++) s += a[i] * b[i];
  return s;
}

/* A binary heap keyed on a number. The paper's algorithms need one min-heap
 * of candidates and one max-heap of results, so it takes a sign. */
class Heap {
  items: [number, number][] = [];
  sign: number;
  // strip-only TypeScript has no parameter properties, so the field is explicit
  constructor(sign: number) { this.sign = sign; }
  get size() { return this.items.length; }
  peek() { return this.items[0]; }
  push(d: number, v: number) {
    const a = this.items; a.push([d * this.sign, v]);
    let i = a.length - 1;
    while (i > 0) {
      const p = (i - 1) >> 1;
      if (a[p][0] <= a[i][0]) break;
      [a[p], a[i]] = [a[i], a[p]]; i = p;
    }
  }
  pop(): [number, number] {
    const a = this.items, top = a[0], last = a.pop()!;
    if (a.length) {
      a[0] = last;
      let i = 0;
      for (;;) {
        const l = 2 * i + 1, r = l + 1; let m = i;
        if (l < a.length && a[l][0] < a[m][0]) m = l;
        if (r < a.length && a[r][0] < a[m][0]) m = r;
        if (m === i) break;
        [a[m], a[i]] = [a[i], a[m]]; i = m;
      }
    }
    return [top[0] * this.sign, top[1]];
  }
}

export class HNSW {
  M: number; Mmax0: number; efConstruction: number; mL: number;
  vectors: Float32Array[] = [];
  labels: string[] = [];
  levels: number[] = [];
  edges: number[][][] = [];
  entry: number | null = null;
  maxLevel = -1;
  private seed: number;

  constructor(M = M_DEFAULT, efConstruction = EF_CONSTRUCTION, seed = 42) {
    this.M = M; this.Mmax0 = M * 2;
    this.efConstruction = efConstruction;
    this.mL = 1 / Math.log(M);
    this.seed = seed >>> 0;
  }

  /* mulberry32: a named, portable generator, so the level sequence is
   * reproducible and does not depend on the runtime's Math.random. */
  private random(): number {
    this.seed = (this.seed + 0x6d2b79f5) >>> 0;
    let t = this.seed;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }

  distance(a: number, q: Float32Array): number { return 1 - dot(this.vectors[a], q); }
  private randomLevel(): number { return Math.floor(-Math.log(this.random()) * this.mL); }

  /* --------------------------------------------- paper's algorithm 2 */
  searchLayer(q: Float32Array, entries: number[], ef: number, level: number): [number, number][] {
    const visited = new Set(entries);
    const cand = new Heap(1), found = new Heap(-1);
    for (const e of entries) { const d = this.distance(e, q); cand.push(d, e); found.push(d, e); }
    while (cand.size) {
      const [d, c] = cand.pop();
      if (d > found.peek()![0] * -1 && found.size >= ef) break;
      for (const peer of this.edges[c][level]) {
        if (visited.has(peer)) continue;
        visited.add(peer);
        const dp = this.distance(peer, q);
        if (found.size < ef || dp < found.peek()![0] * -1) {
          cand.push(dp, peer); found.push(dp, peer);
          if (found.size > ef) found.pop();
        }
      }
    }
    const out: [number, number][] = [];
    while (found.size) out.push(found.pop());
    return out.sort((x, y) => x[0] - y[0]);
  }

  /* --------------------------------------------- paper's algorithm 4 */
  selectNeighbours(q: Float32Array, candidates: [number, number][], m: number): number[] {
    const kept: number[] = [];
    const sorted = [...candidates].sort((a, b) => a[0] - b[0]);
    for (const [d, c] of sorted) {
      if (kept.length >= m) break;
      if (kept.every((k) => 1 - dot(this.vectors[c], this.vectors[k]) > d)) kept.push(c);
    }
    for (const [, c] of sorted) {                 // top up if too strict
      if (kept.length >= m) break;
      if (!kept.includes(c)) kept.push(c);
    }
    return kept;
  }

  /* --------------------------------------------- paper's algorithm 1 */
  insert(label: string, vec: Float32Array): number {
    const node = this.vectors.length;
    const level = this.randomLevel();
    this.vectors.push(vec); this.labels.push(label); this.levels.push(level);
    this.edges.push(Array.from({ length: level + 1 }, () => [] as number[]));
    if (this.entry === null) { this.entry = node; this.maxLevel = level; return node; }
    let ep = [this.entry];
    for (let lc = this.maxLevel; lc > level; lc--) ep = [this.searchLayer(vec, ep, 1, lc)[0][1]];
    for (let lc = Math.min(level, this.maxLevel); lc >= 0; lc--) {
      const found = this.searchLayer(vec, ep, this.efConstruction, lc);
      const mmax = lc === 0 ? this.Mmax0 : this.M;
      const peers = this.selectNeighbours(vec, found, this.M);
      this.edges[node][lc] = [...peers];
      for (const p of peers) {                    // links are bidirectional
        this.edges[p][lc].push(node);
        if (this.edges[p][lc].length > mmax) {    // and must be pruned
          const cand: [number, number][] = this.edges[p][lc].map(
            (x) => [1 - dot(this.vectors[p], this.vectors[x]), x]);
          this.edges[p][lc] = this.selectNeighbours(this.vectors[p], cand, mmax);
        }
      }
      ep = found.map(([, i]) => i);
    }
    if (level > this.maxLevel) { this.entry = node; this.maxLevel = level; }
    return node;
  }

  /* --------------------------------------------- paper's algorithm 5 */
  search(q: Float32Array, k = 10, ef = EF_SEARCH): [string, number][] {
    if (this.entry === null) return [];
    let ep = [this.entry];
    for (let lc = this.maxLevel; lc > 0; lc--) ep = [this.searchLayer(q, ep, 1, lc)[0][1]];
    return this.searchLayer(q, ep, Math.max(ef, k), 0)
      .slice(0, k).map(([d, i]) => [this.labels[i], 1 - d] as [string, number]);
  }

  bruteForce(q: Float32Array, k = 10): [string, number][] {
    return this.vectors.map((v, i) => [this.labels[i], dot(v, q)] as [string, number])
      .sort((a, b) => b[1] - a[1]).slice(0, k);
  }

  /* -------------------------------------------------------- storage */
  save(db: DatabaseSync): void {
    db.exec(SCHEMA); db.exec("BEGIN");
    db.exec("DELETE FROM hnsw_nodes"); db.exec("DELETE FROM hnsw_edges");
    const meta = db.prepare(
      "INSERT INTO hnsw_meta VALUES (?,?) ON CONFLICT(k) DO UPDATE SET v=excluded.v");
    meta.run("M", String(this.M)); meta.run("ef_construction", String(this.efConstruction));
    meta.run("entry", String(this.entry)); meta.run("max_level", String(this.maxLevel));
    const insN = db.prepare("INSERT INTO hnsw_nodes VALUES (?,?,?)");
    for (let i = 0; i < this.labels.length; i++) insN.run(i, this.labels[i], this.levels[i]);
    const insE = db.prepare("INSERT INTO hnsw_edges VALUES (?,?,?)");
    for (let i = 0; i < this.edges.length; i++)
      for (let lc = 0; lc < this.edges[i].length; lc++) {
        // an empty list is written as no row: node:sqlite binds a zero-length
        // Buffer as NULL, which the NOT NULL column rejects
        if (!this.edges[i][lc].length) continue;
        insE.run(i, lc, Buffer.from(new Int32Array(this.edges[i][lc]).buffer));
      }
    db.exec("COMMIT");
  }

  static load(db: DatabaseSync, vectors: Map<string, Float32Array>): HNSW {
    const meta = new Map((db.prepare("SELECT k, v FROM hnsw_meta").all() as
      { k: string; v: string }[]).map((r) => [r.k, r.v]));
    const h = new HNSW(Number(meta.get("M")), Number(meta.get("ef_construction")));
    for (const r of db.prepare("SELECT id, label, level FROM hnsw_nodes ORDER BY id")
         .all() as { id: number; label: string; level: number }[]) {
      h.labels.push(r.label); h.levels.push(r.level);
      h.vectors.push(vectors.get(r.label)!);
      h.edges.push(Array.from({ length: r.level + 1 }, () => [] as number[]));
    }
    for (const r of db.prepare("SELECT id, level, peers FROM hnsw_edges").all() as
         { id: number; level: number; peers: Uint8Array }[])
      h.edges[r.id][r.level] = [...new Int32Array(
        r.peers.buffer, r.peers.byteOffset, r.peers.byteLength / 4)];
    h.entry = Number(meta.get("entry")); h.maxLevel = Number(meta.get("max_level"));
    return h;
  }
}

export function loadVectors(db: DatabaseSync): Map<string, Float32Array> {
  const out = new Map<string, Float32Array>();
  for (const r of db.prepare("SELECT chunk_id, vec FROM vectors").all() as
       { chunk_id: string; vec: Uint8Array }[])
    out.set(r.chunk_id, new Float32Array(
      r.vec.buffer.slice(r.vec.byteOffset, r.vec.byteOffset + r.vec.byteLength)));
  return out;
}

function main(argv: string[]): void {
  const db = new DatabaseSync(argv[2]);
  const vecs = loadVectors(db);
  if (argv.includes("--build")) {
    const M = argv.includes("--M") ? Number(argv[argv.indexOf("--M") + 1]) : M_DEFAULT;
    const ef = argv.includes("--ef") ? Number(argv[argv.indexOf("--ef") + 1]) : EF_CONSTRUCTION;
    const h = new HNSW(M, ef);
    const t0 = Date.now();
    for (const [label, v] of vecs) h.insert(label, v);
    h.save(db);
    const levels = new Map<number, number>();
    for (const lv of h.levels) levels.set(lv, (levels.get(lv) ?? 0) + 1);
    console.log(`  built ${h.labels.length} nodes in ${((Date.now()-t0)/1000).toFixed(1)}s  ` +
      `M=${M} ef_construction=${ef}`);
    console.log("  levels: " + [...levels].sort((a,b)=>a[0]-b[0])
      .map(([k, v]) => `L${k}:${v}`).join("  "));
    return;
  }
  const h = HNSW.load(db, vecs);
  const n = argv.includes("--recall") ? Number(argv[argv.indexOf("--recall") + 1]) : 200;
  const labels = [...vecs.keys()].filter((_, i) => i % Math.floor(vecs.size / n) === 0).slice(0, n);
  for (const ef of [10, 16, 32, 64, 128, 256]) {
    let hits = 0, total = 0;
    for (const lab of labels) {
      const q = vecs.get(lab)!;
      const a = new Set(h.search(q, 10, ef).map(([l]) => l));
      for (const [l] of h.bruteForce(q, 10)) { total++; if (a.has(l)) hits++; }
    }
    console.log(`  ef=${String(ef).padStart(3)}   recall@10 ${(hits/total).toFixed(4)}`);
  }
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) main(process.argv);
