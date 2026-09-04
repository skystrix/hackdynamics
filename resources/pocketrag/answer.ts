/* PocketRAG, layer 4: hybrid retrieval, reranking, cited answers.  Ch 35.
 *
 * The twin of answer.py for everything that is retrieval logic rather than
 * model inference. Two functions in the Python half call models (embedding a
 * query, cross-encoding pairs); those are Python only, as in chapter 34.
 * Everything below runs here identically: rewriting, fusion, the permission
 * filter, ends-first packing, the prompt, and citation verification.
 *
 *   node --experimental-strip-types answer.ts <db> --demo
 */
import { DatabaseSync } from "node:sqlite";
import { pathToFileURL } from "node:url";
import { search as bm25Search } from "./bm25.ts";
import { HNSW, loadVectors } from "./hnsw.ts";

export const K_CANDIDATES = 50, K_RERANK = 8, K_CONTEXT = 5;
export const CONTEXT_TOKENS = 900, REFUSE_BELOW = 2.0, QUOTE_ABOVE = 2.0;

export const USERS: Record<string, Set<string>> = {
  passenger: new Set(["public"]),
  contractor: new Set(["public", "tickets"]),
  staff: new Set(["public", "tickets", "internal"]),
};

const PIECE = /[A-Za-z0-9]+|[^\sA-Za-z0-9]/g;
const ntokens = (t: string) => Math.ceil((t.match(PIECE)?.length ?? 0) * 1.05);

/* ------------------------------------------------------------- rewrite */
export function rewrite(query: string): string[] {
  const stripped = query.trim()
    .replace(/^(can|could|do|does|how|what|when|where|which|who|why|is|are)\b\s*/i, "")
    .replace(/\?+$/, "").trim();
  return !stripped || stripped.toLowerCase() === query.toLowerCase()
    ? [query] : [query, stripped];
}

/* ---------------------------------------------------------------- fuse */
export function rrf(rankings: string[][], k = 60): [string, number][] {
  const fused = new Map<string, number>();
  for (const ranking of rankings)
    ranking.forEach((cid, i) => fused.set(cid, (fused.get(cid) ?? 0) + 1 / (k + i + 1)));
  return [...fused.entries()].sort((a, b) => b[1] - a[1]);
}

/* ------------------------------------------------------------- filters */
export function allowed(db: DatabaseSync, user: string): Set<string> {
  const labels = USERS[user];
  const out = new Set<string>();
  for (const r of db.prepare("SELECT chunk_id, label FROM chunks").all() as
       { chunk_id: string; label: string }[])
    if (labels.has(r.label)) out.add(r.chunk_id);
  return out;
}

/* The query vector comes from the Python half; everything else is here. */
export function retrieve(db: DatabaseSync, query: string, user: string,
                         queryVec: Float32Array | null = null,
                         k = K_CANDIDATES): string[] {
  const keep = allowed(db, user);
  const rankings: string[][] = [];
  const graph = queryVec ? HNSW.load(db, loadVectors(db)) : null;
  for (const shape of rewrite(query)) {
    rankings.push(bm25Search(db, shape, null).map(([c]) => c)
      .filter((c) => keep.has(c)).slice(0, k));
    if (graph && queryVec)
      rankings.push(graph.search(queryVec, k * 2, 128).map(([c]) => c)
        .filter((c) => keep.has(c)).slice(0, k));
  }
  return rrf(rankings).map(([c]) => c).slice(0, k);
}

/* ---------------------------------------------------------------- pack */
export function pack(db: DatabaseSync, ranked: [string, number][],
                     budget = CONTEXT_TOKENS, k = K_CONTEXT): [number, string, string][] {
  const chosen: [string, string][] = [];
  let used = 0;
  for (const [cid] of ranked.slice(0, k)) {
    const text = (db.prepare("SELECT text FROM chunks WHERE chunk_id=?")
      .get(cid) as { text: string }).text;
    const n = ntokens(text);
    if (used + n > budget) break;
    chosen.push([cid, text]); used += n;
  }
  // ends-first: best at the start and the end, weakest buried (chapter 17)
  const front: [string, string][] = [], back: [string, string][] = [];
  chosen.forEach((item, i) => (i % 2 === 0 ? front : back).push(item));
  return [...front, ...back.reverse()].map(([cid, text], i) =>
    [i + 1, cid, text] as [number, string, string]);
}

const PROMPT =
  "Answer the question using only the numbered passages. Cite every sentence " +
  "with the passage number in square brackets. If the passages do not contain " +
  "the answer, reply exactly: NOT IN THE CORPUS.\n\n{passages}\n\n" +
  "Question: {question}\nAnswer:";

export function buildPrompt(packed: [number, string, string][], question: string): string {
  return PROMPT.replace("{passages}",
    packed.map(([n, , t]) => `[${n}] ${t}`).join("\n\n")).replace("{question}", question);
}

/* -------------------------------------------------------------- answer */
export function extractiveAnswer(packed: [number, string, string][],
                                 ranked: [string, number][]): string {
  const best = new Map(ranked);
  return packed.filter(([, cid]) => (best.get(cid) ?? 0) >= QUOTE_ABOVE)
    .sort((a, b) => (best.get(b[1]) ?? 0) - (best.get(a[1]) ?? 0))
    .slice(0, 2)
    .map(([n, , text]) => {
      const s = text.trim().split(/(?<=[.!?])\s+/);
      return `${(s.length > 2 ? s.slice(1, 3).join(" ") : s[s.length - 1]).trim()} [${n}]`;
    }).join(" ");
}

export type Result = {
  refused: boolean; topScore: number; text: string;
  packed: [number, string, string][]; citations: number[];
};

export function answer(db: DatabaseSync, question: string, ranked: [string, number][]): Result {
  const top = ranked.length ? ranked[0][1] : -Infinity;
  if (top < REFUSE_BELOW)
    return { refused: true, topScore: top, text: "NOT IN THE CORPUS.",
             packed: [], citations: [] };
  const packed = pack(db, ranked);
  return { refused: false, topScore: top, packed,
           text: extractiveAnswer(packed, ranked),
           citations: packed.map(([n]) => n) };
}

/* -------------------------------------------------------------- verify */
export function verify(r: Result): [number, boolean, string][] {
  const byN = new Map(r.packed.map(([n, , t]) => [n, t]));
  const out: [number, boolean, string][] = [];
  for (const sentence of r.text.split(/(?<=\])\s+/)) {
    const nums = [...sentence.matchAll(/\[(\d+)\]/g)].map((m) => Number(m[1]));
    const claim = sentence.replace(/\s*\[\d+\]/g, "").trim();
    if (!nums.length) { out.push([0, false, claim]); continue; }
    for (const n of nums)
      out.push([n, byN.has(n) && !!claim && byN.get(n)!.includes(claim), claim]);
  }
  return out;
}

function main(argv: string[]): void {
  const db = new DatabaseSync(argv[2]);
  // Without the model this half cannot score, so the demo feeds it a ranking
  // and exercises everything downstream: packing, citing, verifying.
  const ids = (db.prepare("SELECT chunk_id FROM chunks LIMIT 5").all() as
    { chunk_id: string }[]).map((r) => r.chunk_id);
  const ranked = ids.map((c, i) => [c, 8 - i] as [string, number]);
  const r = answer(db, "demo question", ranked);
  console.log(`  top ${r.topScore.toFixed(3)}  packed ${r.packed.length}  ` +
    `order ${r.packed.map(([n]) => n).join(",")}`);
  for (const [n, ok] of verify(r)) console.log(`  [${n}] ${ok ? "resolves" : "BROKEN"}`);
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) main(process.argv);
