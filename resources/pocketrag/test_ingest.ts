/* The test Chapter 32 ends with, in TypeScript. Same checks as test_ingest.py.
 *
 *   node --experimental-strip-types test_ingest.ts
 */
import { mkdtempSync, writeFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { connect, ingest, prune } from "./ingest.ts";

const DOCS: Record<string, string> = {
  "a.md": "# Refunds\n\nTickets in class L are non-refundable.\n",
  "b.md": "# Baggage\n\nThe first checked bag is 25 EUR online.\n",
};

function check(label: string, got: unknown, want: unknown): void {
  const ok = JSON.stringify(got) === JSON.stringify(want);
  console.log(`  ${ok ? "PASS" : "FAIL"}  ${label}: ${JSON.stringify(got)}` +
    (ok ? "" : ` != ${JSON.stringify(want)}`));
  if (!ok) throw new Error(label);
}

function main(): void {
  const d = mkdtempSync(join(tmpdir(), "pocketrag-"));
  const paths: Record<string, string> = {};
  for (const [name, text] of Object.entries(DOCS)) {
    paths[name] = join(d, name);
    writeFileSync(paths[name], text);
  }
  const db = connect(join(d, "t.db"));
  const chunkIds = (p: string) => (db.prepare(
    "SELECT chunk_id FROM chunks WHERE doc_id=? ORDER BY ord").all(p) as
    { chunk_id: string }[]).map((r) => r.chunk_id);
  const docCount = () => (db.prepare(
    "SELECT COUNT(*) AS n FROM documents WHERE deleted=0").get() as { n: number }).n;

  // 1. first ingest inserts
  for (const p of Object.values(paths)) ingest(db, p);
  check("first ingest inserts", docCount(), 2);

  // 2. running it again changes nothing at all
  check("second ingest is a no-op",
    Object.values(paths).map((p) => ingest(db, p)), ["unchanged", "unchanged"]);
  check("row counts unchanged", docCount(), 2);

  // 3. editing one document replaces exactly that document's chunks
  const kept = chunkIds(paths["b.md"]);
  writeFileSync(paths["a.md"],
    "# Refunds\n\nTickets in class L are non-refundable.\n\n" +
    "## Travel credit\n\nA credit is valid for twelve months.\n");
  check("edited doc reports replaced", ingest(db, paths["a.md"]), "replaced");
  check("untouched doc keeps its chunk ids", chunkIds(paths["b.md"]), kept);

  // 4. a document that disappears is tombstoned, its chunks removed
  rmSync(paths["b.md"]);
  prune(db, new Set([paths["a.md"]]));
  check("pruned doc leaves no chunks", chunkIds(paths["b.md"]).length, 0);
  check("pruned doc keeps a tombstone", (db.prepare(
    "SELECT deleted FROM documents WHERE doc_id=?").get(paths["b.md"]) as
    { deleted: number }).deleted, 1);
  rmSync(d, { recursive: true, force: true });
}

console.log("PocketRAG ingest, chapter 32");
main();
console.log("\n  all checks passed");
