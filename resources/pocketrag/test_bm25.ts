/* The test Chapter 33 ends with, in TypeScript. The rank_bm25 conformance
 * check runs from the Python side; this one proves the analyzer, the ranking
 * and phrase search, and is the second implementation the Python is compared
 * against.
 *
 *   node --experimental-strip-types test_bm25.ts <db>
 */
import { DatabaseSync } from "node:sqlite";
import { build, search, phrase, stem } from "./bm25.ts";

function check(label: string, ok: boolean, detail = ""): void {
  console.log(`  ${ok ? "PASS" : "FAIL"}  ${label}${detail}`);
  if (!ok) throw new Error(label);
}

const db = new DatabaseSync(process.argv[2] ?? "lex-ts.db");
const [docs, terms] = build(db);
console.log(`PocketRAG lexical index, chapter 33`);
console.log(`  indexed ${docs} chunks, ${terms} distinct terms\n`);

const groups: [string, string[]][] = [
  ["connect", ["connect", "connected", "connecting", "connection", "connections"]],
  ["cello", ["cello", "cellos"]],
  ["refund", ["refund", "refunds", "refunded", "refunding"]],
  ["baggag", ["baggage"]], ["fli", ["flies"]],
];
const bad = groups.flatMap(([root, ws]) => ws.filter((w) => stem(w) !== root));
check("stemmer collapses inflections", bad.length === 0,
  bad.length ? ` ${JSON.stringify(bad)}` : ` (${groups.length} groups)`);

const top = search(db, "musical instruments cello", 1);
const text = (db.prepare("SELECT text FROM chunks WHERE chunk_id=?")
  .get(top[0][0]) as { text: string }).text;
check("cello query ranks the instruments page first", text.startsWith("Musical instruments"));

const hits = new Set(phrase(db, "travel credit"));
const loose = new Set(search(db, "travel credit", null).map(([c]) => c));
check("phrase search is stricter than bag of words",
  hits.size > 0 && hits.size < loose.size, ` (${hits.size} of ${loose.size})`);
check("phrase 'credit travel' finds nothing", phrase(db, "credit travel").length === 0);

console.log("\n  all checks passed");
