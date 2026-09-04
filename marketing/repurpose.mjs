#!/usr/bin/env node
// Turn one course chapter into a dozen social post drafts.
//   node marketing/repurpose.mjs 8          -> marketing/drafts/ch08.md
//   node marketing/repurpose.mjs 8 --dry    -> print the extracted chapter text, no API call
// Needs ANTHROPIC_API_KEY in the environment.
import { createRequire } from "node:module";
import { writeFileSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import Anthropic from "@anthropic-ai/sdk";

const here = dirname(fileURLToPath(import.meta.url));
const dataDir = join(here, "../supabase/functions/course-content/_data");
const num = Number(process.argv[2]);
const dry = process.argv.includes("--dry");
if (!num) { console.error("usage: node marketing/repurpose.mjs <chapter-number> [--dry]"); process.exit(1); }

// The bookData files are browser scripts that push onto window.CHAPTERS.
globalThis.window = globalThis;
const require = createRequire(import.meta.url);
for (const f of ["part1", "additions1", "part2", "additions2", "additions3", "part5"])
  require(join(dataDir, `bookData-${f}.js`));

const ch = globalThis.CHAPTERS.find((c) => c.num === num);
if (!ch) { console.error(`no chapter ${num}`); process.exit(1); }

const text = (html) => html
  .replace(/<svg[\s\S]*?<\/svg>/g, "[diagram]")
  .replace(/<\/(p|li|h\d|div)>/g, "\n")
  .replace(/<[^>]+>/g, "")
  .replace(/&nbsp;/g, " ").replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">")
  .replace(/\n{3,}/g, "\n\n").trim();

const body = ch.sections.map((s) =>
  `### ${s.title}${s.viz ? ` (interactive: ${s.vizTitle || s.viz})` : ""}\n${text(s.html || "")}`).join("\n\n");
const quiz = (ch.quiz || []).map((q, i) =>
  `${i + 1}. [${q.type || "mc"}] ${q.q}\n   options: ${(q.opts || q.items || []).join(" | ")}\n   answer: ${q.type === "order" ? "the listed order" : q.opts ? q.opts[q.a] : q.a}\n   why: ${q.why || ""}`).join("\n");

const chapterDoc = `# Chapter ${ch.num}: ${ch.title}\n${ch.blurb || ""}\n\n${body}\n\n## Quiz\n${quiz}`;
if (dry) { console.log(chapterDoc); process.exit(0); }

const brief = readFileSync(join(here, "PLAN.md"), "utf8");
const voice = brief.slice(brief.indexOf("**Brand voice**"), brief.indexOf("## 2. Target Audience"));

const system = `You draft social content for Hack Dynamics (hackdynamics.com), an interactive computer-science course platform. Live course: Databases in Depth — 32 chapters, 28 interactive simulations, 160 quiz questions, a build-your-own-database capstone (PocketDB). Chapters 1, 5 and 8 are free. Pricing: ₹1999 lifetime or ₹299/month.

${voice}

Rules: every post contains one concrete mechanism (a number, a step, a log line) from the chapter text you are given — never generic advice. Never invent facts not in the chapter. Never say "master", "crack", "ultimate", "guru". Hooks are the first line and must work standalone. Links only in the last tweet of a thread or in a LinkedIn comment. Mention the interactive simulation by name when the section has one. Output GitHub-flavored Markdown with the exact section headings requested.`;

const ask = `Chapter source:\n\n${chapterDoc}\n\nDraft the following, each under its own "## " heading, in this order:
1. X thread (8–11 tweets, numbered, each ≤ 270 chars; mark where a diagram/sim clip goes as [IMG: description]; final tweet has the CTA to the chapter)
2. Three standalone X posts (≤ 280 chars, no links, each a different mechanism; note an [IMG] for each)
3. One X poll built from a quiz question (question ≤ 200 chars, 4 options ≤ 25 chars each, plus the answer reply to post 4 hours later)
4. Two LinkedIn posts (150–250 words, short lines, career-consequence framing, first 2 lines are the hook, end with one question; put the link line separately as "Comment link:")
5. Instagram carousel outline (8–10 slides; per slide: headline ≤ 12 words, sub-line ≤ 20 words, visual)
6. Instagram reel script (25–35s; table with time, visual, overlay/VO; the visual should use the chapter's simulation where one exists)
7. Two Instagram story quiz stickers (question ≤ 80 chars, 4 options ≤ 25 chars, mark the correct one)
8. Newsletter snippet (120–180 words: one mechanism, one "try it" link to the chapter, one quiz question with the answer hidden below a "---")
9. Hook bank: 10 alternative first lines for the thread, ranked`;

const client = new Anthropic();
const stream = client.beta.messages.stream({
  model: "claude-opus-5",
  max_tokens: 32000,
  betas: ["server-side-fallback-2026-07-01"],
  fallbacks: "default",
  system,
  messages: [{ role: "user", content: ask }],
});
stream.on("text", (t) => process.stderr.write("."));
const msg = await stream.finalMessage();
if (msg.stop_reason === "refusal") { console.error("model declined:", msg.stop_details?.explanation); process.exit(2); }

const out = msg.content.filter((b) => b.type === "text").map((b) => b.text).join("\n");
const file = join(here, "drafts", `ch${String(num).padStart(2, "0")}.md`);
writeFileSync(file, `<!-- generated ${new Date().toISOString().slice(0, 10)} from chapter ${num}; edit before posting -->\n# Drafts — Chapter ${num}: ${ch.title}\n\n${out}\n`);
console.error(`\nwrote ${file} (${msg.usage.input_tokens} in / ${msg.usage.output_tokens} out)`);
