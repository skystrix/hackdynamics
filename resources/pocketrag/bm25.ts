/* PocketRAG, layer 2: the inverted index and BM25.  Chapter 33.
 *
 * The twin of bm25.py. Same analyzer, same stemmer, same scores. Node 22+,
 * no dependencies.
 *
 *   node --experimental-strip-types bm25.ts <db> --index
 *   node --experimental-strip-types bm25.ts <db> "musical instruments cello"
 *   node --experimental-strip-types bm25.ts <db> --phrase "travel credit"
 */
import { DatabaseSync } from "node:sqlite";
import { pathToFileURL } from "node:url";

const K1 = 1.2, B = 0.75;              // Lucene's defaults, as in chapter 9
const STOPWORDS = new Set(
  ("a an and are as at be but by for if in into is it no not of on or such " +
   "that the their then there these they this to was will with").split(" "));

/* --------------------------------------------------------------- stemmer */
// Porter's 1980 algorithm, written out. It strips suffixes in five steps so
// that "connection", "connections" and "connected" collapse to "connect".
const VOWELS = "aeiou";

function cons(w: string, i: number): boolean {
  if (VOWELS.includes(w[i])) return false;
  return !(w[i] === "y" && i > 0 && !cons(w, i - 1));
}

function m(w: string): number {          // vowel-consonant sequences: 'measure'
  let n = 0, prevV = false;
  for (let i = 0; i < w.length; i++) {
    const v = !cons(w, i);
    if (prevV && !v) n++;
    prevV = v;
  }
  return n;
}

function hasVowel(w: string): boolean {
  for (let i = 0; i < w.length; i++) if (!cons(w, i)) return true;
  return false;
}

function isDouble(w: string): boolean {
  return w.length > 1 && w[w.length - 1] === w[w.length - 2] && cons(w, w.length - 1);
}

function isCvc(w: string): boolean {
  if (w.length < 3 || !cons(w, w.length - 1) || cons(w, w.length - 2) ||
      !cons(w, w.length - 3)) return false;
  return !"wxy".includes(w[w.length - 1]);
}

const STEP2: [string, string][] = [["ational","ate"],["tional","tion"],["enci","ence"],
  ["anci","ance"],["izer","ize"],["abli","able"],["alli","al"],["entli","ent"],
  ["eli","e"],["ousli","ous"],["ization","ize"],["ation","ate"],["ator","ate"],
  ["alism","al"],["iveness","ive"],["fulness","ful"],["ousness","ous"],
  ["aliti","al"],["iviti","ive"],["biliti","ble"]];
const STEP3: [string, string][] = [["icate","ic"],["ative",""],["alize","al"],
  ["iciti","ic"],["ical","ic"],["ful",""],["ness",""]];
const STEP4 = ["al","ance","ence","er","ic","able","ible","ant","ement","ment",
  "ent","ion","ou","ism","ate","iti","ous","ive","ize"];

export function stem(w: string): string {
  if (w.length <= 2) return w;
  if (w.endsWith("sses")) w = w.slice(0, -2);            // step 1a: plurals
  else if (w.endsWith("ies")) w = w.slice(0, -2);
  else if (w.endsWith("ss")) { /* keep */ }
  else if (w.endsWith("s")) w = w.slice(0, -1);
  if (w.endsWith("eed")) {                               // step 1b: -ed, -ing
    if (m(w.slice(0, -3)) > 0) w = w.slice(0, -1);
  } else {
    let base: string | null = null;
    if (w.endsWith("ed") && hasVowel(w.slice(0, -2))) base = w.slice(0, -2);
    else if (w.endsWith("ing") && hasVowel(w.slice(0, -3))) base = w.slice(0, -3);
    if (base !== null) {
      w = base;
      if (w.endsWith("at") || w.endsWith("bl") || w.endsWith("iz")) w += "e";
      else if (isDouble(w) && !"lsz".includes(w[w.length - 1])) w = w.slice(0, -1);
      else if (m(w) === 1 && isCvc(w)) w += "e";
    }
  }
  if (w.endsWith("y") && hasVowel(w.slice(0, -1))) w = w.slice(0, -1) + "i";  // 1c
  for (const [suf, rep] of STEP2) {                      // step 2
    if (w.endsWith(suf) && m(w.slice(0, -suf.length)) > 0) {
      w = w.slice(0, -suf.length) + rep; break;
    }
  }
  for (const [suf, rep] of STEP3) {                      // step 3
    if (w.endsWith(suf) && m(w.slice(0, -suf.length)) > 0) {
      w = w.slice(0, -suf.length) + rep; break;
    }
  }
  for (const suf of STEP4) {                             // step 4
    if (w.endsWith(suf)) {
      const base = w.slice(0, -suf.length);
      if (m(base) > 1 && (suf !== "ion" || (base && "st".includes(base[base.length - 1]))))
        w = base;
      break;
    }
  }
  if (w.endsWith("e")) {                                 // step 5a
    const b = w.slice(0, -1);
    if (m(b) > 1 || (m(b) === 1 && !isCvc(b))) w = b;
  }
  if (w.endsWith("ll") && m(w) > 1) w = w.slice(0, -1);  // step 5b
  return w;
}

const WORD = /[a-z0-9]+/g;

export function analyze(text: string): [string, number][] {
  const out: [string, number][] = [];
  let pos = 0;
  for (const raw of text.toLowerCase().match(WORD) ?? []) {
    if (!STOPWORDS.has(raw)) out.push([stem(raw), pos]);
    pos++;
  }
  return out;
}

/* ----------------------------------------------------------------- index */
const SCHEMA = `
CREATE TABLE IF NOT EXISTS terms (
  term TEXT PRIMARY KEY,
  df   INTEGER NOT NULL);
CREATE TABLE IF NOT EXISTS postings (
  term      TEXT NOT NULL,
  chunk_id  TEXT NOT NULL,
  tf        INTEGER NOT NULL,
  positions TEXT NOT NULL,
  PRIMARY KEY (term, chunk_id)) WITHOUT ROWID;
CREATE TABLE IF NOT EXISTS lengths (
  chunk_id TEXT PRIMARY KEY,
  n_terms  INTEGER NOT NULL);`;

export function build(db: DatabaseSync): [number, number] {
  db.exec(SCHEMA);
  db.exec("BEGIN");
  db.exec("DELETE FROM terms"); db.exec("DELETE FROM postings"); db.exec("DELETE FROM lengths");
  const df = new Map<string, number>();
  const insL = db.prepare("INSERT INTO lengths VALUES (?,?)");
  const insP = db.prepare("INSERT INTO postings VALUES (?,?,?,?)");
  for (const row of db.prepare("SELECT chunk_id, text FROM chunks").all() as
       { chunk_id: string; text: string }[]) {
    const posting = new Map<string, number[]>();
    for (const [term, pos] of analyze(row.text)) {
      if (!posting.has(term)) posting.set(term, []);
      posting.get(term)!.push(pos);
    }
    let n = 0;
    for (const p of posting.values()) n += p.length;
    insL.run(row.chunk_id, n);
    for (const [t, p] of posting) {
      insP.run(t, row.chunk_id, p.length, JSON.stringify(p));
      df.set(t, (df.get(t) ?? 0) + 1);
    }
  }
  const insT = db.prepare("INSERT INTO terms VALUES (?,?)");
  for (const [t, n] of df) insT.run(t, n);
  db.exec("COMMIT");
  const docs = (db.prepare("SELECT COUNT(*) AS n FROM lengths").get() as { n: number }).n;
  return [docs, df.size];
}

export function idf(nDocs: number, df: number, variant = "lucene"): number {
  if (variant === "okapi")                  // Robertson/Sparck Jones, raw
    return Math.log(nDocs - df + 0.5) - Math.log(df + 0.5);
  return Math.log(1 + (nDocs - df + 0.5) / (df + 0.5));   // Lucene, always > 0
}

export function okapiFloor(db: DatabaseSync, nDocs: number, eps = 0.25): number {
  const rows = db.prepare("SELECT df FROM terms").all() as { df: number }[];
  if (!rows.length) return 0;
  let sum = 0;
  for (const r of rows) sum += idf(nDocs, r.df, "okapi");
  return eps * (sum / rows.length);
}

export function search(db: DatabaseSync, query: string, k: number | null = 10,
                       k1 = K1, b = B, variant = "lucene"): [string, number][] {
  const s = db.prepare(
    "SELECT COUNT(*) AS n, COALESCE(SUM(n_terms),0) AS t FROM lengths").get() as
    { n: number; t: number };
  if (!s.n) return [];
  const avgdl = s.t / s.n;
  const lens = new Map<string, number>();
  for (const r of db.prepare("SELECT chunk_id, n_terms FROM lengths").all() as
       { chunk_id: string; n_terms: number }[]) lens.set(r.chunk_id, r.n_terms);
  const floor = variant === "okapi" ? okapiFloor(db, s.n) : 0;
  const scores = new Map<string, number>();
  const seen = new Set(analyze(query).map(([t]) => t));
  for (const term of seen) {
    const row = db.prepare("SELECT df FROM terms WHERE term=?").get(term) as
      { df: number } | undefined;
    if (!row) continue;
    let w = idf(s.n, row.df, variant);
    if (variant === "okapi" && w < 0) w = floor;
    for (const p of db.prepare("SELECT chunk_id, tf FROM postings WHERE term=?")
         .all(term) as { chunk_id: string; tf: number }[]) {
      const dl = lens.get(p.chunk_id)!;
      scores.set(p.chunk_id, (scores.get(p.chunk_id) ?? 0) +
        w * (p.tf * (k1 + 1) / (p.tf + k1 * (1 - b + b * dl / avgdl))));
    }
  }
  const all = [...scores.entries()].sort((x, y) => y[1] - x[1]);
  return k === null ? all : all.slice(0, k);   // see the chapter on the heap
}

export function phrase(db: DatabaseSync, text: string): string[] {
  const terms = analyze(text).map(([t]) => t);
  if (!terms.length) return [];
  const lists = terms.map((t) => {
    const mp = new Map<string, number[]>();
    for (const r of db.prepare("SELECT chunk_id, positions FROM postings WHERE term=?")
         .all(t) as { chunk_id: string; positions: string }[])
      mp.set(r.chunk_id, JSON.parse(r.positions));
    return mp;
  });
  const hits: string[] = [];
  for (const cid of lists[0].keys()) {
    if (!lists.every((l) => l.has(cid))) continue;
    for (const start of lists[0].get(cid)!) {
      if (terms.every((_, i) => i === 0 || lists[i].get(cid)!.includes(start + i))) {
        hits.push(cid); break;
      }
    }
  }
  return hits.sort();
}

function main(argv: string[]): void {
  const db = new DatabaseSync(argv[2]);
  if (argv.includes("--index")) {
    const [docs, terms] = build(db);
    console.log(`  indexed ${docs} chunks, ${terms} distinct terms`);
    return;
  }
  if (argv.includes("--phrase")) {
    for (const cid of phrase(db, argv[argv.indexOf("--phrase") + 1])) console.log(`  ${cid}`);
    return;
  }
  for (const [cid, score] of search(db, argv[3])) {
    const t = (db.prepare("SELECT text FROM chunks WHERE chunk_id=?").get(cid) as
      { text: string }).text;
    console.log(`  ${score.toFixed(3).padStart(6)}  ${t.slice(0, 88)}`);
  }
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) main(process.argv);
