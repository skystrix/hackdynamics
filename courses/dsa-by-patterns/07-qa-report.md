# DSA By Patterns — Phase 7 Deliverable: Whole-Course QA Report

**Status:** Phase 7 complete. **Not release-clean:** machines (§2.3, §2.6) and integration (§2.7,
§2.8) stay open, and one of them needs the owner (§4).
**Date:** 2026-09-25 (read begun 2026-09-24). Phase 6 map: `06-outcome-assessment-map.md`.

Scope: guide §4 Phase 7. The whole course was read in order as a learner. Every numeric claim was
re-run, and every code block was compiled and fuzzed in both languages. Every quiz was answered
in a browser. Each §11.4 item is checked with evidence below, and every fix made is listed in §3.

---

## 1. What was done

- **Read front to back.** All 49 chapters: 178,232 words of section text, including exercises
  (figures and code were stripped for reading and checked separately). Also 492 quiz questions,
  338 exercises and 763 glossary terms.
  - Every number stated in prose, a figure, a quiz or an exercise answer was recomputed, by
    hand or by running code.
  - Every dated fact about a language or system was checked against its source or release notes.
  - Every `Chapter N` pointer was checked against the chapter it names.
- **Code.** All 203 code blocks exist in both Python and Java (406 panes).
  - First pass: every Java block was compiled, with fragments grouped by chapter so shared
    helpers resolve. Every Python block was executed.
  - Second pass: each chapter's routines were fuzzed against brute-force oracles as the read
    reached them, typically 300–3,000 random cases each, in both languages.
  - Two Java tabs called methods they never defined, and one Python/Java pair was pseudocode
    (§3.4).
- **Mechanical passes.**
  - `tools/figcheck.js`: 111 figures, 0 problems.
  - `tools/chapcheck.js` on every chapter: `<p>` balance, banned words, missing terms and the
    700-word section cap. All clean.
  - A scan for raw `<` that would break `innerHTML`.
  - A scan for doubled words and garbled edits.
  - A scan of every author-and-year citation against the reading map (§2.5).
  - A scan of core chapters' references into the optional Chapters 37–45 (§3.6).
- **Browser.** The real `js/app.js` and `js/quiz.js` ran over the edited data file through the
  local preview page (`_preview_app_dsa.html`).
  - For each of the 49 chapters, every question was answered with its own key: 49 of 49
    quizzes scored full marks, 492 of 492 questions.
  - Every section heading, all 111 figures and all 406 code panes rendered, with no console
    errors.
  - At 375 px, no chapter scrolls horizontally.

---

## 2. §11.4 course definition of done, with evidence

### 2.1 Gap Matrix: every core and supporting row lands in a chapter — **Pass**

- Blueprint §6's computed orphan list is empty.
- The rows audit (Blueprint §6) matched all row assignments against the written text. It found
  nine rows that were assigned but unwritten, and all nine are now written.
- The final tally is 155 core / 53 supporting / 15 mentioned / 1 out.
- All 15 "mentioned" rows are named in Chapter 49's frontier. This read confirmed each one. It
  also corrected the chapter's own count, which still said twelve from before the N8/N9/H16
  downgrade.
- Outcome coverage: the Phase 6 map shows 43 of 43 active outcomes assessed.

### 2.2 Reads front to back as one story; recurring examples consistent; numbering consistent — **Pass after fixes**

The arc holds across six parts:

1. The machine and the measure.
2. Order and lookup.
3. The paradigms.
4. Hierarchies and ranges.
5. Graphs.
6. The edges and the engineer, ending in the recognition procedure (Ch 47), the handbook (Ch 48)
   and the field guide (Ch 49).

The recurring threads stay consistent:

- Chapter 1's maximum subarray as the model of optimisation.
- The coins 1, 3, 4 counterexample.
- The fewest-semesters problem.
- The measured Python and Java loop budgets.
- The "the confirming test" habit.

The read found **57 defects**, all fixed and listed in §3:

| Category | Count |
|---|---|
| Wrong numbers, wrong exercise answers, internal contradictions | 28 |
| False claims, where prose disagreed with its own code or with a simulation | 15 |
| Duplicated or garbled text left by earlier edits | 6 |
| Code tabs that did not compile or were pseudocode | 3 |
| Cross-references to the wrong chapter or to content no chapter contains | 3 |
| Facts that have changed since writing (Rust, Go, Linux) | 2 |

A structural defect was fixed separately: core Chapters 46–48 cited the optional Chapters 37–45
as if the reader had read them (§3.6).

None of these was visible to Phase 4's per-chapter checks or Phase 6's assessment read.
Twenty-eight of them are wrong numbers that only re-running the arithmetic exposed, which is
the case for this pass.

Shape notes that are not defects:

- **Chapters 37–45 are optional** (owner, 2026-09-24). Chapter 1 routes interview readers from
  Chapter 36 to Chapter 46.
- **Forward pointers into the optional chapters.** Sixteen pointers from core Chapters 1–36
  into 37–45 remain. Each is a signpost whose sentence stands without the target ("comes in
  Chapter 45", "Chapter 39 develops"), and none leaves a core idea unexplained.

### 2.3 Three free chapters show at least two machines and the voice — **Fail. Open.**

`free: true` is set on Chapters 1, 2 and 7, as Blueprint §4 specifies. The voice is there, and
each chapter references two machines:

- **Chapter 1:** `dsaFourSolutions`, `dsaCourseMap`
- **Chapter 2:** `dsaGrowthRaces`, `dsaBigOQuiz`
- **Chapter 7:** `dsaUnionFind`, `dsaAckermann`

None of the six exists. `js/app.js` hides a section's machine when `VIZ[sec.viz]` is undefined,
so the pages render cleanly. A visitor sees no machine before the paywall. See §4.

### 2.4 Capstone: every layer's test passes; benchmark reproduced; confession table complete — **Not applicable**

The capstone (Part 7, Chapters 50–57) was removed by the owner on 2026-09-24. The reason: a
fuzzed structures library does not help a reader pass an interview. The deviation is declared
in Blueprint §0 and §3. Outcomes B1, B2, B7 and B9 were retired with it.

### 2.5 Reading map complete: every paper, RFC and doc named in the text is listed — **Pass after fixes**

The check extracted every capitalised name in the sentence before each year in the delivered
text and compared it with Blueprint §5.

- About 85 sources were named in the chapters but missing from the map. Examples are Bachmann
  1894, Galler & Fischer 1964, Klink & Wälde 2011, Chazelle 2000, Ronn 1990, Nong, Zhang & Chan
  2009, Belady 1966 and Frigo et al. 1999.
- All of them are now listed under "Added in Phase 7", grouped by part.
- Limit of the method: a name cited without a year nearby would not be caught.

### 2.6 Every machine and quiz exercised in a browser, both themes, desktop and 375 px — **Partial. Open.**

- **Quizzes: pass.** All 492 questions (346 multiple choice, 98 blank, 48 order) were answered
  in the real quiz engine with their own keys, and every chapter scored full marks. This also
  proves that every `blank` key is accepted by the engine's normaliser and that every `order`
  item matches its rendered button.
- **Rendering and layout: pass.** All sections, figures and code panes render. There are no
  console errors, and no chapter overflows at 375 px.
- **Machines: fail.** The text references 88 distinct machines, and **0 are built**. The
  Blueprint planned 134. The prose says "the machine" 78 times across 31 chapters.
- **Dark theme: not checked.** The local preview pane renders static pages light regardless of
  the emulated scheme. It needs a check on the deployed page.

### 2.7 Gate verified: anonymous sees preview with locked stubs; premium sees full — **Open**

The course is not registered in `supabase/functions/course-content/index.ts`, so the gate cannot
be exercised yet. The locked view was only simulated locally (`?locked`), and it shows the stubs
with badges and the optional tags. This is Phase 8.

### 2.8 README, COURSE_PLAN, landing page and marketing updated — **Open**

This is Phase 8 work: a reader page (`dsa-by-patterns.html`), the `courses.html` card, the
`index.html` block, the `README.md` table and a `MANUAL_ACTIONS.md` redeploy note. Commit
`0955785` did the same for *LLM In Depth* and is the template.

### 2.9 Could a finisher sit the university final, the interview, and the on-call rotation? — **Yes, yes, and yes for this course's version of on-call**

The Charter's three personas map onto the guide's three bars:

- **Interview (Priya, 45%): yes.** The core route (Chapters 1–36 and 46–49) covers every row
  that two or more interview banks ask. Chapter 47 gives a recognition procedure tested on six
  unseen problems, and Chapter 48 gives a presentation protocol. The quizzes test choices, not
  recall.
- **University final (Aarav, 30%): yes, with the optional chapters.** Flows, strings, number
  theory and geometry are in Chapters 37–45, at the depth of the syllabi the Gap Matrix merged.
- **Working engineer (Rahul, 25%): yes.** Chapters 16, 17 and 48 cover what standard libraries
  actually run, with measured costs, traps, profiling and honest benchmarking.

**Caveat.** The text was written for machines. Until they exist, each "step through it above"
points at nothing, and that is a learning cost the prose does not fully cover.

---

## 3. Fixes applied in Phase 7

Commits: `53d2532` (Chapters 1–45), `88f36c8` (Chapters 46–49), `98ebfbc` (references to
optional chapters). Each fix was verified by running code or recomputing before it was applied.

### 3.1 Wrong numbers, wrong answers, contradictions (28)

- **Ch 1.** The speed-up was "16,000×" because it divided the n = 800 cubic time by the
  n = 3,200 Kadane time. The chapter's own table gives about 60,000× at n = 800.
- **Ch 1 exercises.**
  - Ex 1: `[3,-4,2,1,-5,4]` gives 4, not 3, and the sign-flipped run was replaced.
  - Ex 2: the cubic method does 10 additions on `[2,-1,2]`, not 12.
- **Ch 2.**
  - A cubic algorithm at n = 10⁶ takes about 31.7 years, not 31,700.
  - The growth-table rows step ×16, so time grows ×81 per row, not ×9.
  - In Ex 5, n² is lost at 31,622, about 2.5 orders of magnitude before 10⁷, not three.
- **Ch 4.**
  - n log₂ n at 10⁶ is about 20,000,000.
  - CPython's list shrink rule was restated as measured: it reallocates at the first pop below
    half, using the growth formula.
- **Ch 5.**
  - The best of ten Karger runs fails with probability 0.46¹⁰ = 0.04%, not 0.5%. The prose, a
    quiz option and a quiz explanation were all fixed.
  - The three-element decision tree has two depth-2 leaves.
- **Ch 7 Ex 1.** Union by rank on the balanced sequence reaches depth 3, the log₂ 8 bound, so
  the contrast moved to `union(i, i+1)`.
- **Ch 8 Ex 1.** Target 14 takes 2 iterations, so it was changed to target 10, which takes 5
  and discards from both ends.
- **Ch 9 §5 figure.** A running-sum label and a restart marker were corrected.
- **Ch 12 Ex 2.** Boyer–Moore on `[1,2,3,4]` returns 3.
- **Ch 15.**
  - First-pivot quicksort is not the fastest on random input, because the table has mergesort
    lower.
  - The "factor of 150" mixed two table rows. It is 29.
- **Ch 17 §6.** The chaining cost set a successful-search cost beside unsuccessful costs for
  probing. It now uses unsuccessful for both.
- **Ch 18.**
  - The Q6 stem was backwards.
  - The Ex 1 leaf order is 7,3,5,1,6,2,4,0, not numerical order.
- **Ch 19 §3 and Q4.** The 26/30 sub-amount counts belong to a short-circuit reachability
  memo. The wording was fixed after simulating all three readings.
- **Ch 20.**
  - W = 10¹⁸ takes about 1.5 million years, not "longer than the universe".
  - The meet-in-the-middle saving at n = 40 is about half a million.
- **Ch 22 Q1.** The centre of a 3×3 grid lies on 4 of the 6 paths.
- **Ch 24.** The perfect tree with 131k nodes has height 16, fixed in four places.
- **Ch 27.** The heapify level sum is n (computed as 0.99998n), not 2n. This was fixed in a
  figure, the prose, two quiz keys or explanations, and an exercise.
- **Ch 47 §2.** Python sorts a million *random* integers in 0.16 s. The old 0.016 s was the
  time for already-sorted input, and the conclusion drawn from it was reworded.
- **Ch 49.**
  - The course has fifteen "mentioned" topics, not twelve.
  - CSES has 400 problems in 18 categories, not about 430 in 19.

### 3.2 False claims (15)

- **Ch 1.**
  - §1 described the wrong code panels.
  - The Ex 6 witness recipe could not work.
  - "C++ is named in three places" was false: it is named in eight chapters.
- **Ch 2.** A capstone-era "fifty-five chapters" was left in the text.
- **Ch 3 Ex 4.** Points on a horizontal line do not raise the maximum; simulation gives 1.
- **Ch 8 §5.** The prose described a nested loop that the code does not have.
- **Ch 9 Ex 6.** An unfounded speed claim was replaced with operation counts.
- **Ch 11 §2 and Q2.** The no-sentinel `remove()` is correct, tested on every list up to
  length 8.
- **Ch 13.** The silent binary-search spellings fail on present, unique targets, not only at
  boundaries.
- **Ch 19 §5.** "Longest ending at i" does not remove the O(n) transition.
- **Ch 25 §6.** It is *all* independent sets of P_n that follow Fibonacci, not the maximum ones.
- **Ch 46.**
  - Garey and Johnson named six basic problems; they did not organise a catalogue around six
    families.
  - Steiner-tree hardness is not "because" a matroid is missing.
  - "One side versus two" was relabelled "singles versus couples".
  - Vertex cover has no known constant ratio below 2 (the old wording was "nothing better than
    2").

### 3.3 Dated facts (2)

- **Ch 16.** Rust 1.81 (2024-09-05) replaced Timsort and pdqsort with driftsort and ipnsort.
  Go's `sort` package moved to pdqsort in 1.19.
- **Ch 26.** Linux VMAs moved from the red-black tree to the maple tree in 6.1. The scheduler
  still uses an rbtree.

### 3.4 Code (3)

- **Ch 28.** The Java `Trie` called `walk()` without defining it. It is now defined, and both
  languages were fuzzed on 3,000 word-break cases.
- **Ch 39.** The Java path-cover block called `maxMatching`, which was never shown. A driver
  was added and fuzzed on 3,000 graphs.
- **Ch 25 §7.** The Python rerooting tab was pseudocode, and the Java tab was only comments.
  Both are real implementations now, fuzzed against BFS on 2,000 trees.

### 3.5 Duplicated, garbled and misdirected text (9)

- **Duplicated paragraphs:**
  - Two in Ch 8.
  - The Bender & Farach-Colton result stated twice in Ch 29.
  - The kd-tree described in both §5 and §6 of Ch 49.
- **Garbled text left by edits:**
  - Ch 30's "Two Fenwick treesFour Fenwick trees&apos;…", present since the chapter's first
    commit.
  - Ch 45's "On 500 random on 500 random sets".
- **Misdirected references:**
  - Ch 8 pointed to Ch 15 for the standard libraries, which are in Ch 16.
  - Ch 23 cited a weighted-interval DP in Ch 19 that no chapter contains. It now uses
    exhaustive subset search.
  - Ch 48 called Ch 17's flooding defence a random pivot. It is a per-process hash seed.

### 3.6 Core chapters leaning on optional ones (15 references)

Chapters 46–48 cited Chapters 37–45 as shared ground. Examples:

- "Chapter 39 is the model"
- "as Chapter 45 described"
- "Chapter 44's overflow hazard"
- "Chapters 40 and 44's subject"

Each point now stands on its own and names its chapter as optional. Chapters 46 and 47 gained
core-route examples of reduction: Chapter 34's DAG framing and Chapter 47's own fewest-semesters
problem. Chapter 49's catalogue now says once that entries pointing to 37–45 go to the optional
chapters.

### 3.7 Documents

- `03-course-blueprint.md` §5: about 85 reading-map entries added (§2.5).
- `07-qa-report.md`: this file.

---

## 4. Gate: what the owner decides

1. **Machines (blocks §2.3 and §2.6).** 88 machines are referenced and none is built. Blueprint
   §7 risk 1 set out three options, and they still stand:
   - build them all;
   - cut the second and third machine in non-keystone chapters, and remove those "step
     through it" sentences;
   - build the keystone machines first, starting with the six in the free chapters, and ship
     the rest later.

   Launching with none is possible, because hidden machines break nothing. But the free
   chapters would then fail §2.3, and 31 chapters would point at machines that are missing.
2. **Phase 8 integration (closes §2.7 and §2.8).** This is routine work that follows commit
   `0955785`:
   - register `dsa` in the content function;
   - add the reader page, catalogue card, homepage block, README row and redeploy note;
   - deploy `course-content`;
   - then verify the gate anonymously and as a premium user, and check the dark theme on the
     deployed page.
3. **Approve this report** as Phase 7's gate, with items 1 and 2 recorded as open.
