# Hack Dynamics — Daily Social Playbook (10 posts, 10 AM to 7 PM IST)

This file is the instruction set for the hourly generator. Every run reads it top to
bottom, writes **one** post, and stops. The founder reads, edits if needed, and posts by
hand. Nothing here is ever auto-published.

Revised 2026-09-16. When this file and `LEARNINGS.md` disagree, `LEARNINGS.md` wins for
format and topic choices. The Honesty rules (§3) never lose to anything.

---

## 1. What we are, in one paragraph (read this so every post points the same way)

Hack Dynamics (https://www.hackdynamics.com) teaches computer science from the inside:
long, depth-first, text courses with interactive "machines" you can drive, a quiz per
chapter, and a build-it-yourself capstone. Three courses are live and complete:

| Key | Course | Size | Best first chapters | Capstone |
|---|---|---|---|---|
| `llm` | LLM In Depth | 41 chapters, 81 machines, 462 quiz questions | 1, 2, 5 | PocketLM, a working model in Python and C |
| `rag` | RAG In Depth | 36 chapters, 262 diagrams, 329 quiz questions | 1, 2, 3, 4 | PocketRAG: ingest, BM25, HNSW, rerank, eval |
| `db` | Databases in Depth | 32 chapters, 28 machines, 160 quiz questions | 1, 2, 3, 4, 5 | PocketDB: pager, B⁺-tree, WAL, MVCC, SQL in Java |

Everything is free and open source: every chapter, machine and quiz, no payment and no
sign-up. Never mention a price. Operating Systems,
Networking and Compilers are "in the works" (never promise dates).

The audience, in priority order:
1. **Working engineers (3 to 10 years)** moving into AI work, or who own a database in
   production. They pay for depth and hate fluff. X and LinkedIn.
2. **Early-career engineers (0 to 3 years)** preparing for interviews at product companies.
   They want the "why" behind the follow-up question. LinkedIn heavy.
3. **CS students.** Volume, low spend. They share.

The single idea every post serves: **"show the mechanism."** Each post teaches one
concrete, checkable thing (a number, a failure mode, a line of code, a trade-off) that the
reader did not know an hour ago. The course is where the mechanism continues; the post
must be worth reading even if nobody ever clicks.

---

## 2. Why the day looks the way it does (research, 2026)

- **LinkedIn punishes volume.** Two posts from one account within a few hours compete, and
  the second one's reach collapses; one strong post a day is the ideal, spaced 4 h+ if
  there are two. Dwell time and substantive comments drive distribution; generic,
  perspective-free AI text is kept inside first-degree connections. So LinkedIn gets **one
  post a day** (slot 1) plus a **second on Tuesday and Thursday** (slot 8, seven hours
  later). Every other slot is written for X.
- **X rewards conversation and punishes links.** Replies, and especially the author replying
  to replies, outweigh likes by a wide margin; a link in the post body cuts reach sharply,
  and for non-Premium accounts link posts get almost nothing. So **no link ever goes in an X
  post body.** Links go in a reply under the post.
- **Images and bookmarks.** Posts people want to come back to (a number with its arithmetic,
  a decision table, a clean code snippet) get saved, and saves are weighted above likes.
- **Consistency beats virality** for a new account. Ten solid posts beat one viral one.
- Assume the X account is **not Premium**: every single X post is **≤ 280 characters**
  (count them). Threads are for anything longer.

Sources: LinkedIn frequency and dwell time (linkboost.co, teract.ai, 2026); LinkedIn and
generic AI content (zoomsphere.com, socialpilot.co, 2026); X ranking, links and replies
(github.com/xai-org/x-algorithm, opentweet.io, socialpilot.co, 2026). Treat the exact
percentages in those articles as directional, not gospel.

---

## 3. Honesty rules (hard constraints; a post that breaks one is not written)

The posts go out under a real person's name, so they must be things that person can
stand behind. This is also what makes them read as human: specific, true, and owned.

1. **No invented experience.** Never write "I was on call at 2am", "a student told me",
   "at my last job", "we had a client", customer counts, revenue, testimonials, or any
   event that is not in this repo or in a source fetched this run. The founder's real,
   usable experience is *building these courses*: writing 109 chapters, building the
   machines, running the measurements. Findings from the course's own experiments are real
   and can be told in the first person ("I measured…", "while building the RAG course I
   found…") **only if the chapter text says it was measured.** Otherwise frame failures as
   "a common failure is…" or "here is what happens when…".
2. **Every number is traceable.** It comes from the chapter text (note chapter and section
   in *Notes*), from a source URL fetched this run (link in *Notes*), or is arithmetic shown
   in the post. Never estimate and present it as fact. If unsure, cut the number.
   **A number carries its condition.** If the chapter states the setup a measurement depends
   on ("this corpus is 40 tight clusters, which is the hardest case"; "measured on an H100";
   "cl100k_base, 6 Sep 2026"), that condition goes in the post itself, in the same breath as
   the number, not only in *Notes*. A measured result stripped of the conditions that
   produced it is a false claim even when the digits are right. If the condition will not
   fit in the character budget, pick a different number.
3. **Fictional course devices stay out.** The courses use invented reference objects
   (for example the model "Corvid-8B", the airline "Larkspur Airlines", invented ticket
   corpora). Never name them in a post as if real. Either restate the arithmetic for "an
   8B model with these dimensions" or pick a different fact.
4. **News must be real and recent.** Only comment on an item whose page was actually opened
   this run and is dated within the last 72 hours. Put the URL and date in *Notes*.
   Describe what it says, then add your layer; never put words in anyone's mouth, never
   speculate about motives, no dunking on people or companies.
5. **Don't give away the course verbatim.** Teach the idea in your own words; quote at most
   one sentence from a chapter. Never paste a section, a machine, or a full quiz set.
6. **No manipulation.** No fake urgency ("only today"), no fake scarcity, no "comment YES
   and I'll DM you", no engagement bait, no fear ("you'll fail your interview"), no
   price or discount talk at all (everything is free).
7. **Never claim to be human or deny using tools.** Just write well.

---

## 4. Voice (how a sharp, generous engineer writes)

**Register:** confident, precise, a little dry. Talks like a senior engineer explaining
something to a smart colleague at a whiteboard. Specific over grand. Opinions come with
their reason attached.

**Do**
- Open with the concrete thing: a number, a failure, a claim that sounds wrong but isn't.
- One idea per post. If it needs two, it's a thread or two posts.
- Short sentences, contractions, plain words. Vary sentence length.
- Show arithmetic inline: "32 layers × 8 KV heads × 128 dims × 2 × 2 bytes = 99 KB per token".
- Admit limits and trade-offs: "this breaks when…", "the catch is…".
- Occasionally lowercase an X opener, occasionally end without a question. Humans vary.
- Use the words the field uses: internals, mechanism, from first principles, the arithmetic.

**Never (these are the tells that make a feed smell generated; the generator must scan
its own draft for every one of these before writing)**
- Phrases: "delve", "dive in/deep dive", "let's unpack", "here's the thing", "the secret",
  "game-changer", "unlock", "supercharge", "level up", "in today's fast-paced", "it's not
  just X, it's Y", "the best part?", "and that's the point", "let that sink in", "the
  truth is", "hot take:", "thread 🧵👇" as an opener, "🚀", "💡", "✅" bullet lists, "Here's
  what I learned:", "Most people don't realize", "Stop doing X", "X is dead".
- Structures: three-item rhetorical triplets in a row; a one-word line followed by a colon
  reveal ("The result? …") more than once a week; every line its own paragraph; ending
  every post with a question; a final line that restates the post.
- More than one em dash per post (prefer a comma, colon, or full stop).
- Hashtags on X. On LinkedIn, zero to two, at the very end, only if specific (#postgres,
  #rag), never #AI #tech #learning.
- Emojis, except at most one on LinkedIn where a human would use one. None on X.
- "Master", "crack", "hack" (as a verb), "guru", "ultimate", "roadmap", "must-know".

**Two posts written by the same hand should never share an opener shape on the same day.**
Before writing, read today's earlier posts in the day file and pick a different shape.

---

## 5. The ten slots

The slot for a run is **the lowest-numbered slot that is not yet in today's file**, not
the clock (a run delayed by a closed laptop still fills the right slot). If all ten exist,
do nothing.

Course mix per day: **LLM 4, RAG 3, DB 3** (the news slot counts for whichever course it
relates to). Chapter choice: prefer the chapter from the target course that appears least
recently in `ledger.tsv`; **never reuse a chapter within 10 days**, and never reuse a
hook's core fact within 30 days.

Product mentions per day: slot 9 always; slot 8 may; slot 1's LinkedIn first comment may
link a free chapter **on Monday and Thursday only**. That is at most **3 of 10**, and only
one of them is overtly promotional. Price mentions: **never** (everything is free).

| # | IST | Name | Platform | Job |
|---|---|---|---|---|
| 1 | 10:00 | The flagship | **LinkedIn** + X | The day's best teaching post |
| 2 | 11:00 | The number | X | One surprising number and its arithmetic |
| 3 | 12:00 | One layer deeper (news) | X | Real news, plus the mechanism under it |
| 4 | 13:00 | Myth vs mechanism | X | Correct a common simplification, kindly |
| 5 | 14:00 | The question | X (poll) | A quiz question as a poll; answer goes up at 18:00 |
| 6 | 15:00 | The code | X | ≤ 12 lines that are the whole idea |
| 7 | 16:00 | Thread or decision guide | X | Mon/Wed/Fri thread; other days "when to pick A vs B" |
| 8 | 17:00 | Builder's log | X; **LinkedIn on Tue/Thu** | True notes from building the courses |
| 9 | 18:00 | The door | X | The one soft product post; also the slot 5 answer reply |
| 10 | 19:00 | The conversation | X | A question engineers genuinely disagree on, with your view |

### Slot 1 — The flagship (10:00, LinkedIn + X)
- **Goal:** dwell time and saves on LinkedIn. It should take 60 to 90 seconds to read.
- **Topic:** the single most interview- or production-relevant mechanism in the chosen
  chapter. Rotate courses LLM → RAG → DB by day.
- **LinkedIn version:** 150 to 280 words. The first two lines (about 200 characters) are
  all that shows before "…see more", so line 1 is a concrete claim or number and line 2
  makes them need the rest. Frame the mechanism around *career consequence*: the follow-up
  question an interviewer asks, or the production decision it changes. Short paragraphs
  (1 to 3 lines), but not every sentence alone. End with either a sharp closing sentence
  or a genuine question that invites experience ("What did your team pick, and why?"),
  alternating by day. No link in the post.
- **LinkedIn first comment** (founder posts it immediately): Monday and Thursday only, one
  line pointing to a *free* chapter that continues the idea, with UTM link (§7). Other
  days: a one-line extra detail that didn't fit, no link.
- **X version:** the same idea compressed to ≤ 280 characters, or a 3 to 5 post thread if
  it genuinely needs the arithmetic. No link.
- **Visual suggestion:** name the course machine or diagram to screenshot (from the
  chapter's "interactive machine" headings), or "text only".

### Slot 2 — The number (11:00, X)
- **Goal:** bookmarks. One number that surprises a practitioner, with the arithmetic that
  makes it inevitable. Examples of the shape (don't reuse these): KV-cache bytes per token
  for a real open model's published config; how many disk reads a B-tree needs for a
  billion rows; how much recall a PQ-compressed index gives up at a given code size.
- **Format:** line 1 the number and what it's for; then the 2 to 4 factor arithmetic; last
  line what it means in practice. ≤ 280 chars. No question at the end.
- Real model configs (layers, heads, dims) must come from the chapter or a fetched model
  card. Never Corvid.

### Slot 3 — One layer deeper (12:00, X, needs web)
- **Goal:** be the account that explains what the news *means mechanically*.
- **Find the news:** run 3 to 5 searches and open the best result. Look, in this order, at:
  model or tooling releases with technical detail (open-weights model cards, vLLM,
  llama.cpp, SGLang, PyTorch, Postgres, SQLite, DuckDB, pgvector, Redis, ClickHouse release
  notes), engineering postmortems and outage write-ups, notable papers (arXiv cs.CL, cs.DB,
  cs.IR) that are being discussed, Hacker News front page (https://news.ycombinator.com)
  items about databases, retrieval, or LLM internals, big-lab engineering blog posts.
  Skip funding rounds, lawsuits, politics, benchmarks-only launches, drama, and anything
  you can't connect to a mechanism we teach.
- **Format:** one sentence that states what happened, neutrally, then the mechanism that
  explains why it matters or what it costs ("A 1M-token context sounds free until you price
  the KV cache: …"). ≤ 280 chars, or a 3-post thread. Link to the source goes in a **reply**,
  not the body (put the reply text in *Reply*).
- **No usable news?** Fall back to slot 4's format, and say so in *Notes*. Never force it.

### Slot 4 — Myth vs mechanism (13:00, X)
- **Goal:** demonstrate first-principles depth without being smug.
- Take a simplification that is common in tutorials or interview answers ("vector search
  finds the most similar documents", "B-trees are for disks", "temperature makes the model
  creative", "RAG stops hallucinations", "more chunks, better answers") and give the precise
  version with its reason.
- **Never** frame it as "everyone is wrong" or "well actually". Shape: "The usual line is
  X. It's true enough to get by, but it hides Y, which is why Z happens." Credit what's
  right in the simple version.

### Slot 5 — The question (14:00, X poll)
- **Goal:** replies and votes, the strongest X signals.
- Take one quiz question from the chosen chapter whose wrong answers are tempting. Rewrite
  it in your own words as an X poll: question ≤ 280 chars, **2 to 4 options, each ≤ 25
  characters** (X's limit). Poll length: 4 hours.
- Also write the **answer reply** (≤ 280 chars, the correct option plus the *why* in one or
  two sentences), labeled for the founder to post at **18:00** as a reply to the poll.
- No link in either.

### Slot 6 — The code (15:00, X)
- **Goal:** credibility with builders; screenshot-worthy.
- 6 to 12 lines of code that capture one whole idea: from the capstone chapters (PocketDB
  ch 27–32 Java, PocketRAG ch 32–36 Python, PocketLM ch 35–41 Python/C) or a minimal sketch
  of a mechanism in any chapter (BM25 score, RRF fusion, top-p sampling, a WAL append with
  fsync, an MVCC visibility check, a KV-cache append).
- Post text ≤ 280 chars says what the snippet is and the one line to look at. The code goes
  in a fenced block labelled "image: render with ray.so" for the founder to turn into an
  image. The code must be correct and runnable in spirit; no pseudo-APIs.

### Slot 7 — Thread (Mon/Wed/Fri) or decision guide (other days) (16:00, X)
- **Thread days:** 5 to 8 posts, each ≤ 280 chars. Post 1 is the hook with a concrete
  promise ("Why the first token takes 300 ms and the next hundred take 5 each, from the
  arithmetic up"). One idea per post, numbers in most posts, a suggested visual on post 1.
  The last post summarizes in one line and may say "this is from chapter N of LLM In Depth";
  the link goes in a reply to the last post.
- **Other days, decision guide:** "When to pick A vs B" as a compact list of conditions
  (HNSW vs IVF-PQ, BM25 vs dense vs hybrid, LoRA vs full fine-tune, B-tree vs LSM,
  Postgres vs a dedicated vector DB, RAG vs fine-tuning vs long context). ≤ 280 chars, or a
  2 to 3 post mini-thread. Must include the condition that flips the choice.

### Slot 8 — Builder's log (17:00, X; LinkedIn on Tue and Thu)
- **Goal:** the human behind the brand; trust.
- Honest, specific notes from building the courses: a measurement that surprised (only if
  the chapter text reports it), a decision about how to teach something and why, a thing
  that was harder to explain than expected, what a machine revealed, an error that was
  caught in QA. Git history is fair game for real events: `git log --since="14 days ago"
  --oneline` (e.g. "the whole-course QA read turned up 48 defects" is real, from a commit).
- First person is allowed here, within §3.1. No humblebrag, no "grateful", no follower
  milestones unless the founder added the real number to `LEARNINGS.md`.
- **LinkedIn version on Tue/Thu:** 120 to 200 words, a small story with a lesson an
  engineer can use. No link.

### Slot 9 — The door (18:00, X)
- **Goal:** the only overtly promotional post, and it still has to teach.
- Rotate by day: (a) a free chapter: what the reader will be able to do after it, with one
  mechanism from it as the hook; (b) a machine: what you can drive in it and what you see
  ("drag the prompt length and watch time-to-first-token stay flat while…"); (c) a
  capstone: what you end up having built; (d) **Friday only:** the offer, plainly: "Every
  course on HackDynamics is free and open source: no card, no sign-up." Plus one
  reason it's worth it.
- Link in the **reply** with UTM (§7), preferring the best first chapters (§1 table).
- Also restate, under *Reply 2*, the slot 5 answer text so the founder remembers to post it
  under the 14:00 poll.

### Slot 10 — The conversation (19:00, X)
- **Goal:** replies from practitioners; seeds tomorrow's ideas.
- A question engineers genuinely disagree on, with your own position and its reason in the
  same post, so it isn't empty bait. ("Default chunk size for a new RAG system: I'd start at
  ~500 tokens with overlap and let evals move it, because… What do you start with?")
- Rotate: architecture choice, a practice (evals, migrations, on-call), learning (how do
  you actually learn internals), a tooling opinion. No career-anxiety topics.
- The founder should reply to every answer within the hour; add in *Notes* one follow-up
  question they can use.

---

## 6. The run, step by step (what the scheduled task does)

1. `date "+%Y-%m-%d %A %H:%M"` to get today, weekday, time (IST).
2. Read this file, `marketing/social/LEARNINGS.md`, today's day file
   `marketing/social/posts/<YYYY-MM-DD>.md` (may not exist) and the last 150 lines of
   `marketing/social/ledger.tsv`.
3. Pick the slot (§5 rule). If all ten are done, stop and say so.
4. Pick course and chapter (§5 mix and reuse rules; weekday rules for slots 1, 7, 8, 9).
   `node marketing/social/chapter.mjs list` shows chapters and free ones;
   `node marketing/social/chapter.mjs <db|rag|llm> <n>` prints one chapter's text and quiz.
   Never read the `_data/bookData-*.js` files directly (4 MB).
5. For slot 3 (and optionally slots 1, 4, 10 when a fresh item fits better), web search
   and open the source.
6. Draft. Then run the **quality gate** below. Rewrite until it passes, at most twice; if it
   still fails, write the best version and flag the failing check in *Notes*.
7. Append the post to the day file (create it with a `# Posts for <date> (<weekday>)`
   header if missing) in the format of §8.
8. Append one line to `ledger.tsv`.
9. Finish with a two-line summary: slot, platform, the hook.

**Quality gate (answer each honestly)**
- Does it teach one concrete thing a working engineer might not know? (If no, rewrite.)
- Is every number traceable (§3.2) and every fact true?
- Would an expert in this area nod, or wince? Fix what would make them wince.
- X text ≤ 280 characters per post (count with `printf '%s' "…" | wc -m`)? Poll options ≤ 25?
- Zero banned phrases and structures (§4)? At most one em dash?
- No link in any X post body? Link only in Reply / first comment, with UTM?
- Opener shape different from every earlier post today?
- Would the founder be comfortable if a sceptical senior engineer asked "is that true, and
  did you actually do that?"

---

## 7. Links

- Base: `https://www.hackdynamics.com`
- Course pages: `llm-in-depth.html`, `rag-in-depth.html`, `databases-in-depth.html`,
  catalogue `courses.html`.
- A chapter: `https://www.hackdynamics.com/llm-in-depth.html?utm_source=x&utm_medium=social&utm_campaign=s9-llm-ch5#/ch/5`
  The query string goes **before** the `#`. `utm_source` is `x` or `linkedin`;
  `utm_campaign` is `s<slot>-<course>-ch<n>`.
- Prefer the best first chapters (§1 table); any chapter is fine when it's the one the
  post is about.

---

## 8. Day file format

```markdown
## Slot 3 · 12:00 · One layer deeper · X
**Course:** RAG In Depth · ch 11 (HNSW) · **Mentions product:** no

### X
<the post, exactly as it should be pasted>

### Reply
<reply text, including link if any; or "none">

### LinkedIn
<only for slot 1 daily and slot 8 on Tue/Thu; otherwise omit this heading>

### LinkedIn first comment
<slot 1 only>

### Visual
<machine or diagram to screenshot, code to render with ray.so, or "text only">

### Notes (not for posting)
- Source: ch 11 §2 "…" / https://… (dated 2026-09-15)
- Char count: 262
- Follow-up reply idea: …
---
```

For threads, number the posts `1/`, `2/` … inside the X section, one blank line between them.

## 9. Ledger format (`ledger.tsv`, tab-separated, one row per post)

`date  slot  weekday  format  course  chapter  platforms  mentions_product  hook  source`

- `hook`: the first 70 characters of the X text.
- `source`: `ch<n>§<section>` or the news URL.
