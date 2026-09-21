#!/usr/bin/env node
// Course source for the hourly post generator. The bookData files are 4 MB, so
// never read them directly; ask this for one chapter at a time.
//   node marketing/social/chapter.mjs list            -> every course's chapters, free ones marked
//   node marketing/social/chapter.mjs llm 26          -> chapter 26 of LLM In Depth as plain text + quiz
// Courses: db, rag, llm.
import { createRequire } from "node:module";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const dataDir = join(dirname(fileURLToPath(import.meta.url)), "../../supabase/functions/course-content/_data");
const require = createRequire(import.meta.url);
const COURSES = {
  db: { name: "Databases in Depth", page: "databases-in-depth.html", files: ["part1", "part2", "additions1", "additions2", "additions3", "part5"] },
  rag: { name: "RAG In Depth", page: "rag-in-depth.html", files: ["rag-part1", "rag-part2", "rag-part3", "rag-part4"] },
  llm: { name: "LLM In Depth", page: "llm-in-depth.html", files: ["llm-part1"] },
};

function load(key) {
  globalThis.window = globalThis;
  globalThis.CHAPTERS = undefined;
  globalThis.PARTS = undefined;
  for (const f of COURSES[key].files) {
    const p = join(dataDir, `bookData-${f}.js`);
    delete require.cache[p];
    require(p);
  }
  return [...globalThis.CHAPTERS].sort((a, b) => a.num - b.num);
}

const text = (html) => html
  .replace(/<svg[\s\S]*?<\/svg>/g, "[diagram]")
  .replace(/<\/(p|li|h\d|div|tr)>/g, "\n")
  .replace(/<[^>]+>/g, "")
  .replace(/&nbsp;/g, " ").replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&#(\d+);/g, (_, d) => String.fromCodePoint(d)).replace(/&rsquo;/g, "'").replace(/&[lr]dquo;/g, '"').replace(/&mdash;/g, "—").replace(/&times;/g, "×")
  .replace(/\n{3,}/g, "\n\n").trim();

const [key, n] = process.argv.slice(2);
if (key === "list") {
  for (const k of Object.keys(COURSES)) {
    console.log(`\n## ${k} — ${COURSES[k].name} — https://www.hackdynamics.com/${COURSES[k].page}`);
    for (const c of load(k)) console.log(`${c.num}${c.free ? " [FREE]" : ""}. ${c.title}`);
  }
} else if (COURSES[key] && Number(n)) {
  const ch = load(key).find((c) => c.num === Number(n));
  if (!ch) { console.error(`no chapter ${n} in ${key}`); process.exit(1); }
  console.log(`# ${COURSES[key].name} — Chapter ${ch.num}: ${ch.title}${ch.free ? " [FREE]" : ""}`);
  console.log(`URL: https://www.hackdynamics.com/${COURSES[key].page}#/ch/${ch.num}\n${ch.blurb || ""}\n`);
  for (const s of ch.sections || []) console.log(`### ${s.title}${s.viz ? ` (interactive machine: ${s.vizTitle || s.viz})` : ""}\n${text(s.html || "")}\n`);
  console.log("## Quiz");
  (ch.quiz || []).forEach((q, i) => console.log(`${i + 1}. ${q.q}\n   options: ${(q.opts || q.items || []).join(" | ")}\n   answer: ${q.opts ? q.opts[q.a] : q.a}\n   why: ${q.why || ""}`));
} else {
  console.error("usage: chapter.mjs list | chapter.mjs <db|rag|llm> <num>");
  process.exit(1);
}
