# Hack Dynamics — Course Creation Guide & Strategy

**Purpose.** This document is the complete operating manual for producing a Hack Dynamics
course. It is written to be handed to an AI system (or a human author) together with a set
of source books, and to produce, phase by phase, a finished course that drops into the
existing platform unchanged. It was derived from the first course, *Databases in Depth*
(32 chapters, 28 interactive machines, ~160 quiz questions, a build-your-own-database
capstone), and encodes everything that made that course work plus everything we would do
better next time.

**Who reads it.** The author (AI or human) reads all of it before writing a word. The
course owner (Santanu) uses §4 to run the process and §11 to accept deliverables.

**Status.** Living document. Version 1.1, 2026-09-03 (added §3.6–3.7). Update it whenever a course teaches us
something new about how to make courses.

---

## 0. How to use this document as an AI author

1. Read this whole guide first. Then read the source books end to end (§3). Do not start
   writing the syllabus from the table of contents of one book.
2. Work strictly in the phase order of §4. Each phase ends in one named deliverable. Stop
   after each deliverable and wait for approval before starting the next phase. Do not
   write chapters before the syllabus is approved, and do not write chapter N+1 before
   chapter N is accepted.
3. Every deliverable is judged against §11. Self-check against it before submitting.
4. When the sources disagree, or a fact cannot be verified, say so in the text (a
   "sources differ" note) rather than picking silently.
5. Never paste source text. Every sentence is original (§3.4). Diagrams are redrawn, not
   reproduced. Code is written fresh, not copied.
6. Output chapters in the exact data format of §10, one chapter per response, so each
   response is a file that can be saved and loaded without editing.

---

## 1. The mission and the bar

We are building the best text-based, interactive computer-science courses for engineers
that exist anywhere. The standard for every course is:

> **A learner who finishes this course needs no other course, book, or tutorial on the
> subject.** Not for work, not for interviews, not for the next course in the track.

Concretely, "no other material required" means all of the following are true:

| The learner can… | Because the course contains… |
|---|---|
| Explain every core mechanism of the subject from first principles | Mechanism-first chapters (§5.2) with the *why* behind each design |
| Recognize the subject's vocabulary in any paper, doc, or codebase | Complete key-terms glossary per chapter; every standard term introduced where it is first needed |
| Reason about trade-offs, not just recite them | Every design decision presented as a choice with costs, with the alternatives named |
| Answer any interview question on the subject, including the tricky ones | Coverage audit against interview banks (§4.2); quizzes with a *why* per answer |
| Operate, debug, and tune the real systems in the field | "Engineering reality" and "practitioner handbook" chapters (§6.3) naming real systems, real flags, real failure modes |
| Build a working version of the thing | A build-it capstone (§9) |
| Read the primary literature afterwards | Papers and RFCs named inline where a concept originates; a reading map at the end |
| Pass a university final in the subject | Coverage audit against at least three university syllabi (§4.2) |

The bar is high on purpose. If a topic feels "too deep for most readers," it goes in with a
clear on-ramp, it does not get cut. If a topic feels "too basic," it goes in short, it does
not get skipped. Completeness is a feature we sell.

What we are not: a video course, a reference manual, a book summary, or a certification
mill. We are a guided descent into a machine, with the machine running next to the text.

---

## 2. Anatomy of a Hack Dynamics course

Learned from *Databases in Depth*. The next course should land in these ranges unless the
subject clearly demands otherwise (then say why in the syllabus deliverable).

| Element | Databases in Depth | Target range for new courses |
|---|---|---|
| Parts | 5 | 4–6 |
| Chapters | 32 | 24–36 |
| Sections per chapter | 4–8 | 4–8 |
| Words per chapter (body, excluding quiz/terms) | 850–4,900, median ~2,100 | 1,800–3,500 for mechanism chapters; up to 5,000 for keystone chapters |
| Interactive machines | 28 (one per ~1.1 chapters) | ≥ 1 per chapter on average; keystone chapters get 2–3 |
| Static SVG figures | 47 | ≥ 1 per chapter, 2–4 in mechanism chapters |
| Key terms per chapter | 10–18 | 10–20 |
| Quiz questions per chapter | 8 | 8–12 |
| Exercises | inline in capstone chapters only | every chapter (§8.3) |
| Free (ungated) chapters | first 3 | first 3, chosen to show the machines |
| Capstone build | 6 chapters (PocketDB, Java + Go) | 5–8 chapters, two languages |

The five chapter archetypes every course must contain (details in §6.3):

1. **Orientation** — the map of the machine, the three questions that explain everything.
2. **Mechanism** — one component or algorithm, taught from first principles with a machine.
3. **Engineering reality** — how real systems actually do it, and where they deviate from
   the textbook and why. Includes a *field guide* chapter surveying the real systems.
4. **Practitioner handbook** — what a working engineer must do differently after
   understanding the mechanism (configuration, debugging, performance, on-call).
5. **Build it** — the capstone: the learner constructs a working implementation.

---

## 3. Inputs and sourcing rules

### 3.1 Source hierarchy

Sources are used in this priority order. A claim supported only by a lower tier must be
marked as such in the author's notes and, if it appears in the text, hedged.

1. **Provided books** (PDF/EPUB supplied by the course owner). These are the spine of the
   course and define the minimum coverage. Read them completely, including exercises,
   appendices, and footnotes; the footnotes are where the papers hide.
2. **Primary literature**: the original papers, RFCs, standards, and specifications the
   books cite. Read the paper for every named algorithm, not the book's summary of it.
3. **Official documentation and source code** of the real systems the course discusses
   (Postgres docs, Linux kernel docs, Redis source, RFC editor, etc.). This is where the
   "engineering reality" chapters get their facts.
4. **University course materials** that are freely published (MIT OCW, CMU 15-445/15-721,
   Berkeley CS186/CS162/CS168, Stanford CS144/CS143, etc.). Used for the coverage audit and
   for pedagogical ordering, never copied.
5. **Well-regarded engineering blogs and conference talks** (e.g., company engineering
   blogs, Papers We Love, Strange Loop, VLDB/SIGMOD/NSDI/OSDI industry talks). Used for
   war stories and numbers, always attributed inline by system name and year.
6. **Interview question banks and community Q&A** (used only to find gaps in coverage,
   never as a source of facts).

### 3.2 What to extract from each source

For every source, produce notes with:

- The topic list it covers, at section granularity.
- Every algorithm, data structure, protocol, theorem, or named idea, with its origin
  (paper, year, authors) if given.
- Every concrete number (latencies, sizes, limits, defaults, benchmark results) with
  its date and conditions. Numbers rot; note when they were measured.
- Every worked example and every exercise (we will write our own, but we need to know
  what a complete author thought was worth exercising).
- Every diagram, described in one line (we redraw everything).
- Every "this is subtle / commonly misunderstood" remark. These become callouts.

### 3.3 Freely available resources: how far to go

The author is expected to go well beyond the books. Rules:

- For each chapter, consult at least one primary paper or specification and at least one
  real system's documentation or source.
- Prefer sources that can be named in the text ("the 1992 ARIES paper", "RFC 9293",
  "Postgres's `heapam.c`") over anonymous ones. The learner should be able to find it.
- If a fact appears only on a blog or forum, verify it against documentation or source
  before using it. If it cannot be verified, do not use it.
- Prefer the current version of any system. State the version when behavior changed
  recently ("since Redis 7", "Linux 6.x").
- Never rely on memory alone for a number, a flag name, or a default. Verify or omit.

### 3.4 Originality and copyright (non-negotiable)

- All explanatory text is original writing. No sentence is copied or lightly paraphrased
  from a source. Read, understand, close the book, write.
- Figures are original. Redraw the concept, do not trace the source's figure.
- Code is original. The capstone implementation is designed for the course, not adapted
  from a book's code.
- Quotations: at most one short attributed quotation per chapter, under 15 words, only
  when the original phrasing is itself the point (a famous definition or a paper title).
- Attribution is by name in the running text ("Lamport's 1978 paper", "the Dynamo paper")
  and, at the end of the course, in a reading map. No footnote apparatus.

### 3.5 Handling disagreement and uncertainty

- When two credible sources disagree on a fact, present both and say why they differ
  (version, workload, definition), or pick one and say which and why.
- When the field has no consensus (e.g., mmap for databases, the Redlock debate), teach
  the debate itself: the positions, the strongest argument on each side, and what the
  learner should do in practice.
- Never invent a number, a benchmark, or a quote to make a point land.

### 3.6 When the provided books are thin (added 2026-09-03, from RAG In Depth)

The provided books define the *minimum* coverage, not the maximum. When the Source Map
shows that the books do not reach mechanism depth on topics a university final or a
senior interview would examine, the author must fill the gap, not narrow the course:

- Pull in primary papers, specifications, and official documentation (tiers 2–3) as
  full sources, and list them in the Source Map's reading list as if they were books.
- The author may use their own expert knowledge for structure, intuition, and worked
  examples, but every fact, number, flag, and default is still verified against a
  named tier 1–3 source before it appears in the text (§3.3). "From memory" is never a
  citation.
- Say in the Charter and Blueprint which parts of the course rest on primary literature
  rather than on the provided books, so the owner can judge the risk.

### 3.7 Choosing tools, libraries, and systems to teach with

Teach mechanisms vendor-neutrally; name specific tools only where the learner must run
something. When a specific tool, library, or system is used in text, code, or the
capstone, it must be **popular, widely used, and the best fit for the mechanism being
taught**, in that order of priority. Prefer: the open-source standard of the field over
a vendor product; the system the learner most likely already has (e.g., Postgres +
pgvector for vector search) over a new install; a library with a stable API over a
fast-churning framework. A book's tool choice (e.g., Neo4j in a Neo4j-authored book) is
not binding; state the decision and the reason in the Blueprint. Field-guide chapters
survey the alternatives on the dimensions the course taught.

---

## 4. The production pipeline

Nine phases. Each ends in one deliverable and a review gate. Phase 4 repeats per chapter.

| Phase | Name | Deliverable | Gate |
|---|---|---|---|
| 0 | Intake | Source Map | Owner confirms sources are fully read |
| 1 | Audience & outcomes | Course Charter | Owner approves audience, outcomes, prerequisites |
| 2 | Coverage audit | Topic Universe + Gap Matrix | Owner approves what is in and what is deliberately out |
| 3 | Syllabus | Course Blueprint (parts, chapters, sections, machines, capstone) | Owner approves; this locks numbering |
| 4 | Chapter production | One chapter file per chapter, in §10 format | Each chapter passes §11.1 |
| 5 | Interactive machines | One `VIZ.<name>` function per machine | Each passes §11.2 |
| 6 | Assessment | Terms, quizzes, exercises (part of each chapter) | Passes §11.3 |
| 7 | Whole-course QA | QA Report | All items in §11.4 closed |
| 8 | Integration & release | Files in place, free chapters set, landing copy | Site loads, machines mount, gate works |

### Phase 0 — Intake: the Source Map

Read every provided book end to end. Then produce the **Source Map**:

- One table per source: chapter → topics → named ideas → numbers → exercises → figures
  (§3.2).
- A merged topic list across all sources, deduplicated, with a column showing which
  source covers each topic and how deeply (survey / thorough / definitive).
- A list of every paper, RFC, and system the sources cite, with a one-line note on why it
  matters. This becomes the reading list to consult in Phase 4.
- A list of topics the sources mention but do not explain (these are candidate gaps).

Gate: the owner checks that nothing in the books is missing from the map.

### Phase 1 — Audience & outcomes: the Course Charter

A two-page document:

- **Who it is for.** Two or three personas with their current knowledge and their goal
  (for Databases: the backend engineer who uses Postgres daily but has never seen a page
  layout; the student preparing for a systems interview; the engineer moving into
  infrastructure). Reuse the personas in `marketing/PLAN.md` where they fit.
- **Prerequisites**, stated honestly and minimally, with a pointer to where a reader can
  get each one. A Hack Dynamics course assumes an engineer who can program and has taken
  or can follow an undergraduate CS curriculum. It does not assume the previous course
  in the track unless the syllabus says so.
- **Outcomes**: 15–30 "after this course you can…" statements, each testable. Each will
  map to at least one chapter and at least one quiz or exercise. Group them into
  *explain*, *analyze*, *operate*, *build*.
- **Track position**: what this course assumes from earlier courses and what later courses
  will assume from it. Reference `COURSE_PLAN.md`.
- **Title and one-line promise** in the house voice (§5.1).

### Phase 2 — Coverage audit: the Topic Universe and Gap Matrix

This phase is what makes "no other material needed" true. Build the **Topic Universe**
by merging topic lists from at least:

- The provided books (from the Source Map).
- Three university syllabi for the subject (name them).
- Two other well-known textbooks' tables of contents (name them).
- One or two industry certification or job-description skill lists, if they exist.
- Two interview question banks for the subject (topics only).
- The documentation table of contents of the two or three most important real systems.

Then produce the **Gap Matrix**: rows are topics, columns are sources, cells mark
coverage. Add a final column with the decision: **core** (full treatment), **supporting**
(a section or a callout), **mentioned** (named with a pointer, one paragraph), or **out**
(with the reason: outside the subject, obsolete, or belongs to another course in the
track, naming which).

Rules:

- Anything a university final would examine is core or supporting. Never out.
- Anything a senior engineer would be expected to know in an interview is core or
  supporting. Never out.
- History is not out. Every major idea gets its origin (who, when, what problem), because
  origin explains design.
- "Out because it belongs to course X" is allowed only if course X exists in
  `COURSE_PLAN.md`. Then this course still gives a one-paragraph orientation and a
  forward pointer.

Gate: the owner approves the decision column.

### Phase 3 — Syllabus: the Course Blueprint

The Blueprint is the contract for the whole course. It contains:

1. **Parts**: 4–6, each with a title and a two-sentence description in the voice of the
   existing `PARTS` entries (§10.1). Parts follow a descent or ascent with a story: for
   Databases it was single node → query layer → many nodes → real world → build it.
2. **Chapters**: numbered continuously across parts. For each chapter:
   - Title (§5.5 naming rules), archetype (§6.3), one-paragraph blurb in plain second
     person (see the existing blurbs: what you will learn, why it matters, in words a
     newcomer understands).
   - The section list (4–8 sections), each with a title and one line on its content.
   - The machine(s) it will carry: name, one-line spec, and what the learner does with it.
   - The static figures it needs (one line each).
   - Which outcomes from the Charter it delivers.
   - Which Topic Universe rows it covers (so nothing core is orphaned).
   - Prerequisite chapters, so the reading order is explicit.
   - Estimated body word count.
3. **The capstone plan** (§9): what is built, in which two languages, one chapter per
   layer, the test that proves each layer, the honest benchmark at the end, and the
   "confession table" of what was simplified.
4. **The free chapters**: exactly which three, chosen so a visitor sees at least two
   machines and the house voice before the paywall.
5. **The reading map**: the papers, RFCs, and docs the course will name, grouped by part.
6. **Coverage check**: every core row of the Topic Universe appears in some chapter's
   list. Every supporting row appears in a section or a named callout. Print the
   orphan list; it must be empty.

Gate: the owner approves. After approval, chapter numbers are frozen (the platform keys
progress and links on them).

### Phase 4 — Chapter production

One chapter per response, in the §10 format, complete: sections, figures, machine
placeholders (`viz` names that Phase 5 will implement), terms, quiz, exercises. Write in
syllabus order so cross-references only point backwards or to an explicitly forward
pointer. The chapter blueprint of §6 governs shape; the writing standard of §5 governs
prose; the checklist of §11.1 is the acceptance test.

Before writing each chapter, re-read: the Blueprint entry for it, the Source Map rows it
covers, and at least one primary source and one real-system source for it (§3.3). Log
which ones were used in a one-line author note at the top of the file (as a JS comment).

### Phase 5 — Interactive machines

Each `viz` name referenced by a chapter becomes one function per §7. Machines are built
after the chapter text so that the text can say exactly what to do with the machine, and
the machine can be shaped to the text. Deliver as additions to a `viz<N>.js` file.

### Phase 6 — Assessment

Terms, quizzes, and exercises are written with the chapter (Phase 4) but reviewed as a
separate pass across the whole course for coverage against the Charter outcomes: every
outcome must be tested by at least one quiz question or exercise somewhere. Produce the
outcome → assessment map.

### Phase 7 — Whole-course QA

A read-through of the entire course in order, as a learner, producing the QA Report:
every §11.4 item with evidence, plus a list of fixes made. Includes running every machine
in a browser, every quiz to completion, and every capstone test.

### Phase 8 — Integration & release

Place the chapter files under the course's content function, register machines in the
viz files, set `free: true` on the chosen chapters, write the landing-page card, run the
site locally (`python3 -m http.server`), and verify the gate serves preview vs full
correctly. Update `COURSE_PLAN.md` and `README.md`.

---

## 5. Writing standard

### 5.1 Voice

The house voice is **confident, precise, slightly irreverent, and specific**. It talks to
one engineer, in second person, as a senior colleague who has opened the machine and is
now showing you. Reference points: the existing chapter blurbs and the marketing plan's
brand voice section.

- Specific over grand. Never "master transactions." Always "understand why a commit
  fsyncs the log and not the pages."
- Show the mechanism. Every paragraph that makes a claim contains a mechanism, a
  number, a name, or an example. No paragraph is pure opinion.
- Plain words first, the term second: explain the thing, then name it in bold. The
  learner should never meet a term before the idea.
- Short sentences carry the hard ideas. Long sentences are for connecting ideas that are
  already understood.
- Humor is allowed when it is dry and brief. It never replaces an explanation.
- Vocabulary we use: internals, machine, mechanism, from first principles, from bytes up,
  descend, the why, honest, trade. Vocabulary we avoid: master, crack, hack, guru,
  ultimate, roadmap, simply, obviously, just, easy.
- No em-dash clutter in body prose; use commas, colons, or a new sentence. (The
  existing course uses some; new writing should use fewer.)

### 5.2 Pedagogy: how every idea is taught

The unit of teaching is **the mechanism**, and every mechanism is taught in this order.
Sections may compress steps, but never skip 1, 3, 4, or 6.

1. **The problem.** What goes wrong without this idea. A concrete failure a reader can
   picture (a lost write, a stale read, a 40 ms stall). If possible, a failure the reader
   has already seen in their own work.
2. **The naive attempt.** The obvious solution and exactly why it breaks. This is where
   intuition is built; do not skip it because the real solution is "known".
3. **The mechanism.** How it actually works, step by step, with a figure or a machine.
   Every state transition named. Every invariant stated.
4. **The why.** Why this design and not the alternatives. Name the alternatives. Give the
   trade-off as costs on both sides, with numbers where they exist.
5. **The worked example.** Concrete values walked through the mechanism. Small enough to
   follow by hand, real enough to matter. If a machine exists, the text tells the
   learner what to do with it and what they should observe ("set R+W ≤ N and hunt for a
   stale read").
6. **In the real world.** Which real systems use it, under what name, with what
   variation, and one place where it bites in production.
7. **The edge.** The subtle case, the common misconception, or the thing the interview
   question is really about. This is the callout.
8. **The connection.** How it links to what came before and what comes next in the
   course ("this is Chapter 8's steal/no-force decision, chosen the other way").

### 5.3 Depth ladder

Every mechanism chapter must reach the bottom of this ladder for its core topics. The
syllabus decides which topics are core.

1. Intuition (a picture and a sentence)
2. Precise definition (terms, invariants)
3. Algorithm or protocol (steps, states, messages)
4. Worked example with concrete values
5. Correctness argument (why it is right; the proof sketch when one exists)
6. Cost model (time, space, I/O, messages; big-O and constants)
7. Failure modes and edge cases
8. Real implementations and their deviations
9. Operational consequences (what to configure, measure, or debug)
10. Origin (paper, year, problem it solved) and where the field went next

A section that stops at rung 3 is a summary, not teaching. Keystone topics (the ones an
interviewer or a university final would examine) must reach rung 9.

### 5.4 Examples, numbers, and names

- Every abstract claim gets an example within two paragraphs.
- Use real, current systems by name (Postgres, Linux, Redis, Kafka, S3, Raft as used in
  etcd). Name the version when it matters.
- Use real numbers with their conditions: "a 7200 rpm disk seeks in ~8 ms; NVMe reads
  4 KiB in ~80 µs". Prefer orders of magnitude the reader can carry in their head.
- Latency and size tables are welcome whenever they change a decision.
- Give the learner something to run when possible: a one-line command that shows the
  mechanism on their own machine (`strace`, `EXPLAIN`, `tcpdump`, `/proc`), with what
  they will see.

### 5.5 Naming

- Chapter titles are noun phrases that name the mechanism, optionally with a colon and a
  hook: "Transaction Processing and Recovery", "PocketDB: The WAL — Surviving kill -9",
  "Using the Database: The Backend Engineer's Handbook".
- Section titles name what the section teaches, not a vague theme: "Steal and Force
  Policies", not "Some Policies".
- Machine titles (`vizTitle`) tell the learner what they will do: "Crash & recover:
  ARIES's three passes", "Test a schedule for conflict serializability".
- Term names are the standard term of the field, in the form a paper would use.

### 5.6 Cross-references

- Reference other chapters by number and topic in prose ("Chapter 8's steal/no-force
  decision"). Never by URL.
- Backward references are free. Forward references must say what to expect and when
  ("consensus, which Chapter 20 builds up from this election protocol").
- The course is one story. Recurring examples (the same table, the same key, the same
  cluster of three nodes) are reused across chapters on purpose.

### 5.7 What to leave out of the prose

- No "in this section we will…" throat-clearing; the section title does that.
- No "it is important to note". If it is important, say the thing.
- No unexplained acronyms. Expand on first use in every chapter.
- No hand-waving words ("handles", "manages", "deals with") in a mechanism sentence.
  Say what it does.
- No claims about performance without a condition attached.

---

## 6. Chapter blueprint

### 6.1 Shape of every chapter

1. **Blurb** (rendered as the chapter intro): 80–130 words, plain second person, written
   for someone who has not read the chapter. Says what you will learn and why it
   matters, with one concrete hook. Written last, after the chapter exists.
2. **Sections**, 4–8, each 250–700 words, each a self-contained lesson with a heading
   that names its content, `<h3>` subheadings inside when it has sub-parts. Each section
   contains at least one of: a figure, a machine, a code block, a table, or a worked
   example. No section is prose alone.
3. **Key terms**: 10–20, each with a one-sentence definition that would be correct if
   read in isolation.
4. **Knowledge check**: 8–12 quiz questions (§8.1).
5. **Exercises**: 3–6, in a final section titled "Exercises" or inline per section in
   capstone chapters (§8.3).
6. **Navigation** is automatic (previous/next).

### 6.2 Where machines and figures go

- The machine is placed in the section that teaches the mechanism it shows, and the text
  of that section refers to it directly ("Play with it above", "Step through it above").
  The machine renders after the section text, so the text says "above" only for
  interactions the reader has already been told about, and "below" when introducing it.
- A figure appears wherever a paragraph describes spatial structure (a layout, a
  timeline, a tree, a message diagram, a matrix). If you are writing "consists of" or
  "followed by" without a figure, stop and draw one.
- One idea per figure. Caption states what to notice, not what the figure is.

### 6.3 The five archetypes and their required contents

**Orientation chapter** (first chapter of the course, free):
- The layered map of the whole machine, with a machine that lets the learner hover each
  layer.
- The two or three questions that explain most of the subject (for databases: sorted or
  not, in place or append, single node or many).
- The course's story: what part does what, in order.
- A "how to use this course" note: machines, quizzes, exercises, capstone.

**Mechanism chapter** (most chapters):
- Follows §5.2 for each mechanism, reaching the §5.3 rung the syllabus requires.
- At least one machine. At least two figures.
- A "what real systems do" section or callout per major mechanism.
- Terms, quiz, exercises.

**Engineering reality / field guide chapter** (at least two per course):
- For each real system: its lineage, its core design choices mapped onto the course's
  mechanisms, its sweet spot, its known failure modes, its distinguishing feature, one
  operational fact an engineer must know.
- A comparison machine or table across systems on the dimensions the course taught.
- A "choosing" section: how to decide, with a decision procedure, not a feature list.

**Practitioner handbook chapter** (at least one per course):
- What changes in daily engineering once the mechanisms are understood: configuration,
  client behavior, timeouts and retries, observability, the classic mistakes.
- Every recommendation traced back to the mechanism that justifies it.
- Runnable commands and the output to expect.

**Build-it capstone chapters** (§9).

### 6.4 Recurring devices to use

- **Callout** (`<div class='callout'>`): one per section at most. Used for the edge, the
  misconception, the instruction to try something in the machine, or the cross-course
  connection.
- **Comparison table**: whenever three or more alternatives are discussed.
- **Timeline figure**: whenever a protocol or a crash sequence is discussed.
- **Ladder or matrix figure**: whenever guarantees or levels are compared (the isolation
  levels × anomalies matrix is the model).
- **"Try it on your machine"** block: a command and its expected output.
- **"Sources differ" note**: when the field disagrees (§3.5).
- **"Interview lens"** callout: how this mechanism appears as an interview question and
  what the questioner is really testing. Use sparingly, only for the classics.

---

## 7. Interactive machine standard

Machines are the product's signature. A machine exists to let the learner *do* something
the text can only describe: change an input and watch the mechanism respond.

### 7.1 When a machine is required

A section gets a machine when at least one holds:

- The mechanism has state that changes over steps (a tree split, a log replay, an
  election, a handshake, a scheduler decision).
- The mechanism has a tunable whose effect is non-obvious (quorum sizes, cache size,
  window size, timeout thresholds).
- The mechanism is a spatial layout the learner should inspect (a page, a packet, a
  frame, a memory region).
- The mechanism is a race or an interleaving (concurrency, message reordering).
- The mechanism is a comparison whose winner depends on inputs (encodings, join
  algorithms, congestion-control variants).

### 7.2 Kinds of machines (pick the right one)

| Kind | What the learner does | Examples from Databases in Depth |
|---|---|---|
| Stepper | Advances a mechanism one step at a time, sees each state | ARIES passes, normalization 1NF→3NF, SQL logical pipeline, Two Generals |
| Builder | Inserts or removes items and watches the structure react | B-Tree insert/split, slotted page, inverted index, LSM memtable/flush/compaction |
| Inspector | Hovers or clicks parts of a layout to read what each is | DBMS architecture, row vs column layout |
| Tuner | Moves sliders and watches an outcome (a curve, a hit rate, a stale read) | R/W quorums, φ-accrual detector, Bloom filter |
| Simulator | Runs a live system with failure injection | Raft election and replication, 2PC with failures, gossip, bully election |
| Playground | Types input and sees the result of the mechanism applied | Compression encodings, precedence-graph tester, hash ring |
| Comparator | Picks a workload and sees which alternative wins | Database picker, hash join, B+Tree vs LSM race (planned) |

Every machine has at least one **discovery**: something the text tells the learner to
find by using it, which they could not learn from a static picture ("set R+W ≤ N and
find a stale read", "kill the leader and confirm every committed entry survived").

### 7.3 UX rules

- Works with a mouse, touch, and keyboard (buttons are real `<button>`s; a stepper can be
  driven with the buttons alone).
- Self-explaining: a note line (`say`) states what the learner is looking at now and what
  to do next. The initial note is the instruction.
- Every control has a visible label. Every colored thing has a meaning stated in the note
  or a legend.
- Fits a 700–760 unit wide SVG `viewBox`, scales to any width, readable at 360 px.
- No continuous animation without a pause or a reset. Respect
  `prefers-reduced-motion` (skip transitions, keep function).
- Failure injection is explicit and reversible (a "kill node" button and a "revive").
- Reset always exists. State never becomes unrecoverable.
- No external libraries. Hand-rolled SVG for structure, canvas for particle-like sims.
- Renders correctly in both light and dark themes (use CSS variables through the shared
  color table, do not hard-code page backgrounds inside the machine).
- Never blocks the page: heavy work is stepped, not looped synchronously.

### 7.4 Code contract (matches the existing `viz*.js` files)

```js
// In js/vizN.js — one IIFE per file, one function per machine.
(function () {
  "use strict";
  window.VIZ = window.VIZ || {};
  // Shared helpers per file: S(tag, attrs, parent) creates an SVG element,
  // T(parent, x, y, text, opts) draws centered text, div(cls, html),
  // frame(el) builds .viz-body / .viz-controls / .viz-note inside .viz-mount and
  // returns { body, controls, note, btn(label, fn), say(msg) },
  // tipOn(node, title, bodyHtml) binds the shared hover tooltip (window.vizTip).
  // Colors: C = { cyan, blue, gold, red, green, dim, line, bg, text }.

  VIZ.myMachine = function (el) {      // `el` is the .viz frame; mount inside it
    var f = frame(el);
    var svg = S("svg", { viewBox: "0 0 700 330" }, f.body);
    var state = /* initial state */;
    function render() { svg.innerHTML = ""; /* draw state */ }
    f.btn("◂ back", function () { /* step back */ render(); });
    f.btn("step ▸", function () { /* step forward */ render(); });
    f.btn("reset", function () { /* reset */ render(); });
    render();
    f.say("What the learner is looking at and what to do first.");
  };
})();
```

Mounting: `app.js` observes every `.viz[data-viz]` and calls `VIZ[name](el)` once when it
scrolls within 200 px of the viewport. A machine must therefore be idempotent per element,
must not assume it is visible at construction, and must not touch the DOM outside `el`.
Exceptions thrown at mount are caught and shown as "visualization failed", so fail loudly
rather than rendering something wrong.

### 7.5 Machine spec (written in the Blueprint, before coding)

For each machine: name (camelCase, the `viz` key), kind, the state it holds, the
controls, what each control changes, the discovery the text will ask for, the initial
note text, and a sketch of the layout (which region shows what).

---

## 8. Assessment standard

### 8.1 Quiz questions

Types supported by the engine: `mc` (multiple choice), `blank` (fill in the blank, with
accepted alternatives), `order` (put steps in sequence). Rules:

- 8–12 questions per chapter. At least one `order` when the chapter has a sequence, at
  least one `blank` for a term worth remembering by name.
- Every question tests understanding, not recall of a sentence. The best questions
  describe a situation and ask what happens or why ("A database acknowledged a commit,
  then lost power before flushing dirty pages. Why is the data safe?").
- Distractors are plausible: each wrong option is what someone with a specific
  misconception would pick. No joke options.
- **`why` is mandatory** and is the most important text in the question: one or two
  sentences that teach the mechanism again from the angle of the question, so a wrong
  answer becomes a lesson.
- At least two questions per chapter should be at the difficulty of a senior interview.
- Correct answer position is distributed; never always index 1.
- Questions cover the chapter's Charter outcomes; map them in Phase 6.

### 8.2 Key terms

- 10–20 per chapter. Standard field terminology, including the aliases ("page cache /
  buffer pool").
- Definition is one sentence, correct in isolation, and says what the term *is for* or
  *what it distinguishes*, not just what it is.
- Terms match how they are bolded in the body. A term in the list must appear in the
  chapter.

### 8.3 Exercises

Every chapter ends with 3–6 exercises. Three grades, labelled:

- **Trace**: work the mechanism by hand on given inputs (draw the tree after these
  inserts; list the log records for this schedule; decode this header).
- **Investigate**: run something on a real system and report what you see (an `EXPLAIN`,
  a `tcpdump`, a `/proc` file, a config change and its effect).
- **Build**: write or extend code (a small implementation, a benchmark, a fuzzer). In
  capstone chapters these extend the capstone.

Each exercise states what the learner should have found or measured, so it is
self-checkable. The platform does not yet render solutions; write the expected result
into the exercise text itself in a "what you should see" sentence.

---

## 9. Capstone standard: build it

Every course ends by building a working version of the subject in 5–8 chapters, one
layer per chapter. PocketDB (Databases in Depth, Chapters 27–32) is the model.

- **Two languages**, presented as tabbed code blocks (`code-tabs`), chosen for the
  audience (Java and Go for databases; C and Rust or Go and Python for systems courses;
  decide in the Blueprint). The two versions are equivalent line for line in intent.
- **Each chapter adds one layer** and ends with a test the learner runs that proves it
  (a crash loop for the WAL, a fuzzer against a reference map for the tree, a conformance
  script for a protocol).
- **Design decisions are made out loud**, in the course's own vocabulary, and each one
  names the "real" option it did not take and which chapter explains it.
- **Honest benchmark chapter** near the end: measure the thing, explain the numbers with
  the mechanisms, and compare to a real system, naming the conditions.
- **Confession table**: a final section listing every simplification with the chapter
  that holds the real machinery. Ends with "this is early, not wrong".
- **Graduation**: three concrete projects that extend the capstone toward the real thing,
  each scoped to a weekend.
- Code is complete enough to compile as shown, short enough to read in full inside the
  chapter, and written fresh for the course. No hidden helper files.

---

## 10. Platform data format

Chapters are JavaScript files loaded by the `course-content` Supabase edge function
(`supabase/functions/course-content/_data/`) and, on the client, rendered by `js/app.js`.
The format is fixed; produce it exactly.

### 10.1 File skeleton

```js
/* ==========================================================================
   bookData-<course>-part<N>.js — Part <N> chapters (<range>)
   Original explanatory writing. Sources consulted: <one line>.
   Structure: window.PARTS + window.CHAPTERS.
   ========================================================================== */

// Only the FIRST file of a course defines PARTS and initializes CHAPTERS.
window.PARTS = [
  { num: 1, title: "Foundations & Storage Engines",
    desc: "Two sentences in the house voice describing the descent this part makes." },
  // ...
];
window.CHAPTERS = [];

/* ======================= CHAPTER 5 ======================= */
CHAPTERS.push({
  num: 5, part: 1, free: false, title: "B-Tree Basics",
  blurb: "80–130 words, plain second person, what you will learn and why it matters.",
  sections: [
    { title: "Section title that names the lesson",
      viz: "btree", vizTitle: "Insert keys and watch nodes split",   // optional pair
      html: "<p>…</p>" +
            "<h3>Subheading</h3>" +
            "<p>…</p>" +
            "<div class='callout'>…</div>" },
    // 4–8 sections
    { title: "Exercises",
      html: "<ol><li><strong>Trace.</strong> …</li><li><strong>Investigate.</strong> …</li><li><strong>Build.</strong> …</li></ol>" }
  ],
  terms: [
    { t: "term", d: "One-sentence definition that stands alone." }
  ],
  quiz: [
    { type: "mc", q: "Situation-based question?", opts: ["A", "B", "C", "D"], a: 1,
      why: "The mechanism, re-taught from this angle." },
    { type: "blank", q: "The structure that … is called a ____.", a: ["b-tree", "b tree"],
      why: "…" },
    { type: "order", q: "Order the passes:", items: ["first", "second", "third"], why: "…" }
  ]
});
```

Field rules:

- `num` is global across the course and never changes after Blueprint approval.
- `part` matches a `PARTS` entry.
- `free: true` only on the chosen free chapters; omit otherwise.
- `viz` is the machine key; `vizTitle` is the human title shown in the frame header.
- `html` is a single string; build it by concatenating double-quoted string literals,
  one per element, with `+` at line ends (the existing convention). Inside HTML use
  single-quoted attributes so the outer double quotes need no escaping. Escape `&` as
  `&amp;` in text, `<` as `&lt;` in code samples.
- Subsequent files of the same course must not redefine `PARTS` or `CHAPTERS`; they only
  `CHAPTERS.push(...)`. Files load in the order listed in the function's `index.ts`.

### 10.2 HTML vocabulary inside `html`

Only these elements and classes are styled; use nothing else.

| Purpose | Markup |
|---|---|
| Paragraph | `<p>…</p>` |
| Emphasis / term introduction | `<strong>term</strong>`, `<em>…</em>` |
| Subheading inside a section | `<h3>…</h3>` |
| Lists | `<ul><li>…</li></ul>`, `<ol>…</ol>` |
| Inline code | `<code>…</code>` |
| Code block (single language) | `<pre><code>…</code></pre>` (escape `<`, use `\n` for newlines) |
| Code block (two languages) | `<div class='code-tabs'><div class='code-tab-bar'><button class='code-tab active' data-lang='java'>Java</button><button class='code-tab' data-lang='go'>Go</button></div><pre data-lang='java'><code>…</code></pre><pre data-lang='go' hidden><code>…</code></pre></div>` |
| Callout | `<div class='callout'>…</div>` |
| Static figure with caption | `<div class='fig'><svg viewBox='0 0 760 H' xmlns='http://www.w3.org/2000/svg' font-family='Menlo,monospace'>…</svg><div class='fig-cap'>What to notice.</div></div>` |
| Table | Not styled by the site yet. Use a `<ul>` of `<strong>label</strong> — value` lines, or draw a table as an SVG figure (see the `table()` helper in `js/viz4.js`). Add `<table>` styling to `css/style.css` at integration if a course needs many tables. |

Figure SVG conventions (from the existing 47 figures): width 760, height as needed
(150–320 typical); font `Menlo,monospace`, sizes 9–13; boxes `rx='8'`, fill `#111a2e`,
strokes 2–2.5; color meanings: cyan `#2de2ff` labels/headings, blue `#4f7cff` neutral
structure, gold `#ffd166` the thing to notice, red `#ff5d73` failure or danger, green
`#3ddc97` success or committed, dim `#7d8fb0` secondary text, line `#1c2a45` separators,
text `#c9d6ea`. Arrows are `<line>` plus a `<polygon>` head. Keep text inside the viewBox
with margin; check by rendering.

### 10.3 Machines

One function per machine in a `js/viz<N>.js` file per §7.4. The file is included by the
course's HTML shell after `theme.js` and before `app.js`. Machine keys must be unique
across the whole site (all courses share `window.VIZ`).

### 10.4 Where things go

| Thing | Location |
|---|---|
| Chapter data | `supabase/functions/course-content/_data/bookData-<course>-*.js`, imported in that function's `index.ts` (one function per course, or one function keyed by course; decide at integration) |
| Machines | `js/viz<N>.js` |
| Course shell page | `<course-slug>.html` (copy of `databases-in-depth.html` with brand and script list changed) |
| Landing card | `index.html` course cards |
| Marketing copy | `marketing/` |
| Source books | `pdfs/<course-slug>/` |

---

## 11. Quality gates

### 11.1 Chapter definition of done

A chapter is accepted only when every line is true.

**Coverage**
- [ ] Every Topic Universe row assigned to this chapter is taught to its required depth (§5.3).
- [ ] Every Charter outcome mapped to this chapter is deliverable from this chapter alone.
- [ ] Every mechanism follows §5.2 (problem, naive attempt, mechanism, why, example, real world, edge, connection).
- [ ] Every named algorithm or idea has its origin stated (who, when, what problem).
- [ ] Real systems are named with version where behavior differs.

**Correctness**
- [ ] Every fact, number, flag, and default was verified against a primary source or documentation during writing; nothing from memory alone.
- [ ] Disagreements between sources are surfaced, not hidden.
- [ ] Code compiles as shown (both languages in capstone chapters) and was run.
- [ ] Every quiz answer index is right; every `blank` accepts the reasonable spellings.

**Shape**
- [ ] 4–8 sections, each with a figure, machine, code, table, or worked example.
- [ ] At least one machine and one figure (mechanism chapters: two figures).
- [ ] Blurb 80–130 words, plain, second person, hook included.
- [ ] 10–20 terms, all appearing in the body.
- [ ] 8–12 quiz questions with `why`, at least two at interview difficulty, answer positions distributed.
- [ ] 3–6 exercises across trace / investigate / build, each self-checkable.
- [ ] The text tells the learner what to do with each machine and what they will discover.

**Prose**
- [ ] Voice per §5.1; none of the avoided words.
- [ ] No acronym unexpanded on first use in the chapter.
- [ ] No hand-wave verbs in mechanism sentences.
- [ ] Cross-references point to the right chapter numbers.
- [ ] Every sentence is original (§3.4).

**Format**
- [ ] Valid per §10; the file loads in the browser without console errors and renders every section, figure, term, and quiz.

### 11.2 Machine definition of done

- [ ] Spec in the Blueprint matches what was built.
- [ ] Discovery from the text is achievable and the note guides toward it.
- [ ] Works with buttons alone; controls labelled; reset present; failure injection reversible.
- [ ] Readable at 360 px; both themes; reduced motion respected.
- [ ] Mounts lazily and idempotently; throws on bad state rather than rendering wrong state.
- [ ] Ran through every control in a browser; no console errors.

### 11.3 Assessment definition of done

- [ ] Outcome → assessment map has no unmapped outcome.
- [ ] No question is answerable by keyword matching the chapter text.
- [ ] Every `why` teaches.

### 11.4 Course definition of done

- [ ] Gap Matrix: every core and supporting row lands in a chapter (orphan list empty).
- [ ] Reads front to back as one story; recurring examples consistent; numbering consistent.
- [ ] Three free chapters show at least two machines and the voice.
- [ ] Capstone: every layer's test passes; benchmark reproduced; confession table complete.
- [ ] Reading map complete: every paper, RFC, and doc named in the text is listed.
- [ ] Every machine and quiz exercised in a browser in both themes, desktop and 375 px.
- [ ] Gate verified: anonymous sees preview with locked stubs; premium sees full.
- [ ] `README.md`, `COURSE_PLAN.md`, landing page, and marketing assets updated.
- [ ] An engineer who finished the course could sit the university final, the interview, and the on-call rotation for this subject. If any of the three is doubtful, the course is not done.

---

## 12. Prompt templates for an AI author

Feed these in order, one per phase, along with this guide and the source files.

**Phase 0**
> You are producing the Source Map for the course "<title>". Read every attached source
> completely, including footnotes, appendices, and exercises. Produce the Source Map as
> defined in §4 Phase 0 of the Course Creation Guide: per-source topic tables at section
> granularity, the merged deduplicated topic list with coverage depth per source, the list
> of every cited paper/RFC/system with a one-line reason it matters, and the list of
> topics mentioned but not explained. Do not write any course content.

**Phase 1**
> Produce the Course Charter per §4 Phase 1: personas, honest prerequisites with pointers,
> 15–30 testable outcomes grouped explain/analyze/operate/build, track position relative
> to COURSE_PLAN.md, and the title and one-line promise in the house voice (§5.1).

**Phase 2**
> Build the Topic Universe and Gap Matrix per §4 Phase 2. Merge topics from the Source
> Map, at least three named university syllabi, two other named textbooks, the docs of
> the two or three most important real systems, and two interview banks. For every row,
> decide core / supporting / mentioned / out with a reason. Anything examinable or
> interview-expected cannot be out.

**Phase 3**
> Produce the Course Blueprint per §4 Phase 3, using the chapter shape rules of §6, the
> archetype requirements of §6.3, the machine spec format of §7.5, and the capstone
> standard of §9. End with the coverage check: the orphan list must be empty. Propose the
> three free chapters and justify them.

**Phase 4 (repeat per chapter)**
> Write Chapter <N>, "<title>", exactly as specified in the approved Blueprint, in the
> §10 data format, as one complete JavaScript file fragment. Before writing, re-read the
> Blueprint entry, the Source Map rows it covers, and at least one primary source and one
> real-system source; name them in the header comment. Follow §5 for prose, §6 for shape,
> §8 for terms/quiz/exercises. Include static SVG figures inline. Reference machines by
> the `viz` keys from the Blueprint. Self-check against §11.1 and list any item you could
> not satisfy and why.

**Phase 5 (repeat per machine)**
> Implement the machine `<vizKey>` from the Blueprint spec, per the §7 standard and the
> §7.4 code contract, as a function to be added to js/viz<N>.js. It must deliver the
> discovery the chapter text asks for. Self-check against §11.2.

**Phase 6**
> Produce the outcome → assessment map across all chapters. List every Charter outcome
> not tested by any quiz question or exercise, and write the missing questions.

**Phase 7**
> Read the whole course in order as a learner. Produce the QA Report against §11.4 with
> evidence per item and a list of fixes applied.

---

## 13. Appendix A — Worked example: how Databases in Depth applied this

A short map so the author can see the standard in the finished product.

- **Orientation**: Chapter 1 gives the layered DBMS map with a hover machine
  (`dbmsArch`), the disk-vs-memory fork, and the row-vs-column fork, then names the
  three questions the rest of the course answers.
- **Mechanism chapters**: Chapter 8 (Transaction Processing and Recovery) is the model
  keystone chapter: ~4,100 words, three machines (`cache`, `wal`, `schedgraph`), an
  isolation-levels × anomalies matrix figure, callouts that connect two-phase locking to
  the precedence graph, 18 terms, 8 questions each with a `why` that re-teaches, and
  real-system references (InnoDB intention locks, Postgres MVCC).
- **Engineering reality**: Chapter 24 (The Great Databases: A Field Guide) covers thirteen
  systems on the dimensions the course taught, with a workload-based picker machine;
  Chapter 25 teaches choosing as a decision procedure.
- **Practitioner handbook**: Chapter 26 (Using the Database: The Backend Engineer's
  Handbook) covers connections, pools, the timeout ladder, idempotent retries,
  transactions in application code, N+1, pagination, batching, each justified by a
  mechanism from earlier chapters.
- **Capstone**: Chapters 27–32 build PocketDB in Java and Go: pager, slotted pages and
  B⁺-tree, WAL with a kill-loop test, MVCC, SQL parser/planner/executor, then a server, an
  honest benchmark, the confession table, and three graduation projects.
- **Where it fell short of this guide** (and what the next course fixes): exercises only
  in capstone chapters (now every chapter); some Part III chapters under 1,200 words (now
  a floor of 1,800 for mechanism chapters); no explicit outcome → assessment map; the
  reading map exists only implicitly in the prose.

## 14. Appendix B — Vocabulary of this guide

- **Machine**: an interactive visualization (`viz`). We say machine in copy, viz in code.
- **Keystone chapter**: a chapter covering a topic that a university final and a senior
  interview both examine; gets the deepest treatment and the most machines.
- **Discovery**: the thing a learner finds by using a machine that a picture could not show.
- **Confession table**: the capstone's list of simplifications with pointers to the real
  machinery.
- **Topic Universe / Gap Matrix**: the merged topic list and its coverage decisions (Phase 2).
- **Blueprint**: the approved syllabus with chapter numbers frozen (Phase 3).
- **Track**: the sequence of courses in `COURSE_PLAN.md`.
