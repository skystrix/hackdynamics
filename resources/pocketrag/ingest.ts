/* PocketRAG, layer 1: the ingest pipeline.  Chapter 32.
 *
 * The twin of ingest.py, same decisions, same schema, same output. Node 22+,
 * no dependencies: node:sqlite is built in and types are stripped at runtime.
 *
 *   node --experimental-strip-types ingest.ts <db> <file>...
 *   node --experimental-strip-types ingest.ts <db> --prune <file>...
 */
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { inflateSync } from "node:zlib";
import { DatabaseSync } from "node:sqlite";
import { pathToFileURL } from "node:url";

const TARGET = 512, OVERLAP = 64;      // tokens per chunk, tokens repeated (ch 5)
const PIECE = /[A-Za-z0-9]+|[^\sA-Za-z0-9]/g;
const FUDGE = 1.05;                    // measured against cl100k; see the chapter

export type Element = { element: string; heading: string; text: string };
export type Chunk = Element & { nTokens: number };

export function ntokens(text: string): number {
  return Math.ceil((text.match(PIECE)?.length ?? 0) * FUDGE);
}

/* ---------------------------------------------------------------- loaders */
export function loadMarkdown(src: string): Element[] {
  const out: Element[] = [];
  let heading = "", buf: string[] = [], fence = false;
  const flush = (kind = "para") => {
    if (buf.length) out.push({ element: kind, heading, text: buf.join("\n").trim() });
    buf = [];
  };
  for (const line of src.split("\n")) {
    if (line.startsWith("```")) { flush(fence ? "code" : "para"); fence = !fence; continue; }
    if (fence) buf.push(line);
    else if (line.startsWith("#")) {
      flush();
      heading = line.replace(/^#+/, "").trim();
      out.push({ element: "heading", heading, text: heading });
    } else if (/^\s*([-*+]|\d+\.)\s/.test(line)) buf.push(line.trim());
    else if (!line.trim()) flush();
    else buf.push(line.trim());
  }
  flush();
  return out;
}

const BLOCK = /<(h[1-6]|p|li|pre|td)[^>]*>([\s\S]*?)<\/\1>/gi;
const ENT: Record<string, string> = {
  "&amp;": "&", "&lt;": "<", "&gt;": ">", "&quot;": '"', "&#39;": "'", "&nbsp;": " ",
};

export function loadHtml(src: string): Element[] {
  src = src.replace(/<(script|style)[^>]*>[\s\S]*?<\/\1>/gi, " ");
  const kinds: Record<string, string> = { p: "para", li: "list", pre: "code", td: "table" };
  const out: Element[] = [];
  let heading = "";
  for (const m of src.matchAll(BLOCK)) {
    const tag = m[1].toLowerCase();
    let inner = m[2].replace(/<[^>]+>/g, " ");
    for (const [k, v] of Object.entries(ENT)) inner = inner.split(k).join(v);
    const text = inner.replace(/\s+/g, " ").trim();
    if (!text) continue;
    if (tag.startsWith("h")) { heading = text; out.push({ element: "heading", heading, text }); }
    else out.push({ element: kinds[tag], heading, text });
  }
  return out;
}

export function loadPdf(raw: Buffer): Element[] {
  const parts: string[] = [];
  const latin = raw.toString("latin1");
  const re = /stream\r?\n([\s\S]*?)\r?\nendstream/g;
  for (const m of latin.matchAll(re)) {
    let content: string;
    try { content = inflateSync(Buffer.from(m[1], "latin1")).toString("latin1"); }
    catch { continue; }
    if (!content.includes("BT")) continue;      // not a text-showing stream
    const shown = (content.match(/\((?:\\.|[^()\\])*\)/g) ?? []).map((s) =>
      s.slice(1, -1).replace(/\\n/g, "\n").replace(/\\r/g, "")
        .replace(/\\t/g, " ").replace(/\\([()\\])/g, "$1"));
    const text = shown.join("");
    if (!text) continue;
    let printable = 0;
    for (const c of text) if ((c >= " " && c < "\x7f") || c === "\n" || c === "\t") printable++;
    if (printable / text.length < 0.9) continue;  // an image that happened to match
    parts.push(text);
  }
  if (!parts.length) throw new Error(
    "no extractable text: this PDF draws glyphs as paths or is a scan. Run OCR first (ch 31).");
  return parts.join("\n").replace(/[ \t]+/g, " ").split("\n")
    .map((p) => p.trim()).filter(Boolean)
    .map((text) => ({ element: "para", heading: "", text }));
}

export function load(path: string): Element[] {
  const raw = readFileSync(path);
  if (path.endsWith(".pdf")) return loadPdf(raw);
  const src = raw.toString("utf8");
  return /\.html?$/.test(path) ? loadHtml(src) : loadMarkdown(src);
}

/* ---------------------------------------------------------------- chunker */
export function chunk(elements: Element[]): Chunk[] {
  const chunks: Chunk[] = [];
  let buf: Element[] = [], ntok = 0;
  const emit = () => {
    if (!buf.length) return;
    const text = buf.map((e) => e.text).join("\n\n");
    chunks.push({ element: buf[0].element, heading: buf[0].heading, text, nTokens: ntokens(text) });
  };
  for (const el of elements) {
    const size = ntokens(el.text);
    if (size > TARGET) {                        // one element too big: split it
      emit(); buf = []; ntok = 0;
      const words = el.text.split(" ");
      const step = Math.max(1, Math.floor(words.length * (TARGET - OVERLAP) / size));
      const span = Math.max(1, Math.floor(words.length * TARGET / size));
      for (let i = 0; i < words.length; i += step) {
        const text = words.slice(i, i + span).join(" ");
        chunks.push({ element: el.element, heading: el.heading, text, nTokens: ntokens(text) });
        if (i + span >= words.length) break;
      }
      continue;
    }
    if (ntok + size > TARGET) {
      emit();
      const tail: Element[] = []; let back = 0;  // carry OVERLAP tokens forward
      for (let i = buf.length - 1; i >= 0; i--) {
        const psize = ntokens(buf[i].text);
        if (psize > OVERLAP * 2) break;          // never carry a big element:
        back += psize;                           // it would blow the next chunk
        tail.unshift(buf[i]);
        if (back >= OVERLAP) break;
      }
      buf = tail; ntok = back;
    }
    buf.push(el); ntok += size;
  }
  emit();
  return chunks;
}

/* ---------------------------------------------------------------- storage */
const SCHEMA = `
CREATE TABLE IF NOT EXISTS documents (
  doc_id       TEXT PRIMARY KEY,
  content_hash TEXT NOT NULL,
  n_chunks     INTEGER NOT NULL,
  ingested_at  TEXT NOT NULL,
  deleted      INTEGER NOT NULL DEFAULT 0);
CREATE TABLE IF NOT EXISTS chunks (
  chunk_id  TEXT PRIMARY KEY,
  doc_id    TEXT NOT NULL,
  ord       INTEGER NOT NULL,
  element   TEXT NOT NULL,
  heading   TEXT NOT NULL,
  text      TEXT NOT NULL,
  n_tokens  INTEGER NOT NULL);
CREATE INDEX IF NOT EXISTS chunks_by_doc ON chunks(doc_id);`;

export function connect(path: string): DatabaseSync {
  const db = new DatabaseSync(path);
  db.exec("PRAGMA foreign_keys=ON");
  db.exec(SCHEMA);
  return db;
}

export function ingest(db: DatabaseSync, path: string): string {
  const raw = readFileSync(path);
  const digest = createHash("sha256").update(raw).digest("hex");
  const row = db.prepare("SELECT content_hash FROM documents WHERE doc_id=?")
    .get(path) as { content_hash: string } | undefined;
  if (row && row.content_hash === digest) {
    db.prepare("UPDATE documents SET deleted=0 WHERE doc_id=?").run(path);
    return "unchanged";
  }
  const pieces = chunk(load(path));
  db.exec("BEGIN");                              // one transaction: all or none
  try {
    db.prepare("DELETE FROM chunks WHERE doc_id=?").run(path);
    db.prepare(
      "INSERT INTO documents(doc_id,content_hash,n_chunks,ingested_at,deleted)" +
      " VALUES(?,?,?,?,0) ON CONFLICT(doc_id) DO UPDATE SET" +
      " content_hash=excluded.content_hash, n_chunks=excluded.n_chunks," +
      " ingested_at=excluded.ingested_at, deleted=0"
    ).run(path, digest, pieces.length, new Date().toISOString());
    const ins = db.prepare(
      "INSERT INTO chunks(chunk_id,doc_id,ord,element,heading,text,n_tokens)" +
      " VALUES(?,?,?,?,?,?,?)");
    pieces.forEach((c, i) =>
      ins.run(`${digest.slice(0, 12)}:${i}`, path, i, c.element, c.heading, c.text, c.nTokens));
    db.exec("COMMIT");
  } catch (e) { db.exec("ROLLBACK"); throw e; }
  return row ? "replaced" : "inserted";
}

export function prune(db: DatabaseSync, seen: Set<string>): number {
  const gone = (db.prepare("SELECT doc_id FROM documents WHERE deleted=0")
    .all() as { doc_id: string }[]).map((r) => r.doc_id).filter((d) => !seen.has(d));
  db.exec("BEGIN");
  for (const doc of gone) {
    db.prepare("UPDATE documents SET deleted=1, n_chunks=0 WHERE doc_id=?").run(doc);
    db.prepare("DELETE FROM chunks WHERE doc_id=?").run(doc);
  }
  db.exec("COMMIT");
  return gone.length;
}

function main(argv: string[]): void {
  const [dbpath, ...args] = argv.slice(2);
  const doPrune = args.includes("--prune");
  const files = args.filter((a) => a !== "--prune");
  const db = connect(dbpath);
  for (const f of files) console.log(`${ingest(db, f).padStart(9)}  ${f}`);
  if (doPrune) console.log(`${String(prune(db, new Set(files))).padStart(9)}  tombstoned`);
  const s = db.prepare(
    "SELECT (SELECT COUNT(*) FROM documents WHERE deleted=0) AS d," +
    " (SELECT COUNT(*) FROM chunks) AS c," +
    " (SELECT COALESCE(SUM(n_tokens),0) FROM chunks) AS t").get() as
    { d: number; c: number; t: number };
  console.log(`\n  ${s.d} documents, ${s.c} chunks, ${s.t} tokens`);
}

// run main only when this file IS the entry point, not when it is imported
if (import.meta.url === pathToFileURL(process.argv[1]).href) main(process.argv);
