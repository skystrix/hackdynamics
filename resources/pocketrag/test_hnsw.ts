/* The test Chapter 34 ends with, in TypeScript. Same three claims as
 * test_hnsw.py: recall at ef=64, a monotone recall-vs-ef curve, and a fuzzer.
 * Ground truth is a full scan, which needs no dependency here because
 * Float32Array arithmetic is fast enough.
 *
 *   node --experimental-strip-types test_hnsw.ts <db> [n_queries]
 */
import { DatabaseSync } from "node:sqlite";
import { HNSW, loadVectors, dot } from "./hnsw.ts";

function check(label: string, ok: boolean, detail = ""): void {
  console.log(`  ${ok ? "PASS" : "FAIL"}  ${label}${detail}`);
  if (!ok) throw new Error(label);
}

/* mulberry32 again, so the sampled queries are reproducible across runs. */
function rng(seed: number) {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function groundTruth(vectors: Map<string, Float32Array>, queries: string[], k = 10): Set<string>[] {
  const labels = [...vectors.keys()];
  return queries.map((q) => {
    const qv = vectors.get(q)!;
    const scored = labels.map((l) => [dot(vectors.get(l)!, qv), l] as [number, string]);
    scored.sort((a, b) => b[0] - a[0]);
    return new Set(scored.slice(0, k).map(([, l]) => l));
  });
}

const db = new DatabaseSync(process.argv[2] ?? "big.db");
const vectors = loadVectors(db);
console.log("PocketRAG HNSW, chapter 34");
console.log(`  ${vectors.size} vectors of dim ${[...vectors.values()][0].length}\n`);

const h = HNSW.load(db, vectors);
const nQ = Number(process.argv[3] ?? 200);
const rand = rng(7);
const all = [...vectors.keys()];
const queries: string[] = [];
while (queries.length < Math.min(nQ, all.length)) {
  const pick = all[Math.floor(rand() * all.length)];
  if (!queries.includes(pick)) queries.push(pick);
}
const truth = groundTruth(vectors, queries);

let t0 = Date.now(), hits = 0, tot = 0;
queries.forEach((q, i) => {
  const got = new Set(h.search(vectors.get(q)!, 10, 64).map(([l]) => l));
  for (const l of truth[i]) { tot++; if (got.has(l)) hits++; }
});
const r64 = hits / tot;
check("recall@10 at ef=64 clears 0.95", r64 >= 0.95,
  ` (${r64.toFixed(4)}, ${((Date.now()-t0)/queries.length).toFixed(1)} ms/query)`);

console.log("\n    ef    recall@10   ms/query");
const curve: number[] = [];
for (const ef of [10, 16, 32, 64, 128, 256]) {
  t0 = Date.now(); hits = 0; tot = 0;
  queries.forEach((q, i) => {
    const got = new Set(h.search(vectors.get(q)!, 10, ef).map(([l]) => l));
    for (const l of truth[i]) { tot++; if (got.has(l)) hits++; }
  });
  curve.push(hits / tot);
  console.log(`   ${String(ef).padStart(4)}    ${(hits/tot).toFixed(4)}     ` +
    `${((Date.now()-t0)/queries.length).toFixed(2).padStart(7)}`);
}
check("recall rises with ef", curve.every((v, i) => i === 0 || v >= curve[i-1] - 1e-9));

console.log();
const frand = rng(11);
const dim = [...vectors.values()][0].length;
const fz = new HNSW(16, 200, 3);
const pts = new Map<string, Float32Array>();
let worst = 1;
for (let i = 0; i < 1500; i++) {
  const v = new Float32Array(dim);
  for (let d = 0; d < dim; d++) {          // Box-Muller, so the cloud is gaussian
    const u = Math.max(frand(), 1e-12);
    v[d] = Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * frand());
  }
  let norm = 0; for (const x of v) norm += x * x;
  norm = Math.sqrt(norm);
  for (let d = 0; d < dim; d++) v[d] /= norm;
  pts.set(`f${i}`, v); fz.insert(`f${i}`, v);
  if (i && i % 500 === 0) {
    const keys = [...pts.keys()];
    const qs: string[] = [];
    while (qs.length < 40) {
      const p = keys[Math.floor(frand() * keys.length)];
      if (!qs.includes(p)) qs.push(p);
    }
    const gt = groundTruth(pts, qs);
    let hh = 0, tt = 0;
    qs.forEach((q, j) => {
      const got = new Set(fz.search(pts.get(q)!, 10, 64).map(([l]) => l));
      for (const l of gt[j]) { tt++; if (got.has(l)) hh++; }
    });
    worst = Math.min(worst, hh / tt);
    console.log(`    fuzzer at ${String(i).padStart(4)} points: recall@10 ${(hh/tt).toFixed(4)}`);
  }
}
check("fuzzer recall never drops below 0.9", worst >= 0.9, ` (worst ${worst.toFixed(4)})`);
console.log("\n  all checks passed");
