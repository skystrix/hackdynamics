# DSA By Patterns — Phase 6 Deliverable: Outcome → Assessment Map

**Status:** Phase 6 complete, awaiting owner approval.
**Date:** 2026-09-24. Phases 0–3 approved; Phase 4 complete (49 chapters, capstone removed, rows
audit of Chapters 1–49 done). Phase 5 (machines) and Phase 8 (integration) not started.

Scope: every active Charter outcome checked against every quiz question and exercise in the 49
chapters, plus the §8 assessment standard and the §11.3 definition of done.

---

## 1. What was measured

All 49 chapters load from `supabase/functions/course-content/_data/bookData-dsa-part1.js`. Every
`quiz` entry and every exercise was extracted mechanically and read in full against the Charter's
outcome list.

| | Count (after this pass) |
|---|---|
| Chapters | 49 (Chapters 37–45 optional) |
| Quiz questions | 492 (346 `mc`, 98 `blank`, 48 `order`); 90 of them in optional chapters |
| Exercises | 338 (Trace / Investigate / Build); 334 before §4 added four; 70 in optional chapters |
| Key terms | 763 |
| Charter outcomes | 47 listed (E1–E21, A1–A9, O1–O8, B1–B9); 43 active after the capstone retirements |

The Charter said "48 outcomes, 44 active". The list has always held 47; corrected in the Charter.

---

## 2. The map

`Qn` is the nth quiz question of the chapter, `Exn` the nth exercise. **Bold** marks the primary
assessment, the one to keep if only one could be kept. *Italic* chapter numbers are optional
chapters (37–45).

### Explain

| # | Outcome | Quiz | Exercises | Verdict |
|---|---|---|---|---|
| E1 | Running time; word-RAM; bits vs elements; why knapsack is not polynomial | **2 Q2, Q9**, 2 Q4, Q5, 20 Q3, Q4, Q6 | **2 Ex2**, 20 Ex4 | Covered |
| E2 | O, Ω, Θ, o, ω as claims about sets of functions; what each does not claim | **2 Q1, Q10, Q11**, 2 Q6, 1 Q7 | **2 Ex1** | Covered |
| E3 | Recurrences three ways; where the master theorem cannot reach | **3 Q2, Q6**, 3 Q1, Q3, Q7, Q8, Q10 | **3 Ex2, Ex3**, 3 Ex1, Ex6 | Covered |
| E4 | Amortized analysis, three forms; array growth, two pointers, monotonic stack linear | **4 Q2, Q3, Q9**, 4 Q1, Q5, Q6, Q10, 8 Q5, 10 Q3 | **4 Ex1, Ex2**, 4 Ex4, Ex6, Ex7, 8 Ex3 | Covered |
| E5 | Decision-tree lower bound; what counting and radix sort break | **5 Q1, Q2, Q10**, 5 Q3, 15 Q4, Q5 | **5 Ex1**, 5 Ex2, 15 Ex2, Ex7 | Covered |
| E6 | Every classical sort by mechanism; what CPython, OpenJDK, libstdc++ run | **15 Q2, 16 Q2, Q3**, 15 Q1, Q6, Q9, Q10, 16 Q1, Q7, Q8 | **15 Ex3, 16 Ex2**, 15 Ex1, Ex6, 16 Ex1, Ex3 | Covered |
| E7 | Hash tables from the bottom, including the adversarial input | **17 Q2, Q4, Q7**, 17 Q1, Q3, Q5, Q6, Q8–Q10, 5 Q7 | **17 Ex1, Ex5**, 17 Ex2–Ex4, 5 Ex6 | Covered |
| E8 | Binary search as an invariant; bounds; search on the answer; the overflow bug | **13 Q1, Q4, 14 Q5**, 13 Q2, Q3, Q7, Q8, Q10, 14 Q1, Q2, Q8 | **13 Ex2, Ex5, 14 Ex2**, 13 Ex1, Ex3, Ex4, 14 Ex1, Ex5 | Covered |
| E9 | AVL, red-black, treap, B-tree as four answers; which system chose which | **26 Q2, Q4, Q6, Q7**, 26 Q1, Q3, Q5, Q8, Q10 | **26 Ex5**, 26 Ex3, Ex4, Ex6, Ex7 | Covered — see §4.5 |
| E10 | Heaps; linear build-heap; what a Fibonacci heap buys and why nobody ships it | **27 Q2, Q9**, 27 Q1, Q3, Q5 | **27 Ex3**, 27 Ex2, Ex4 | Covered |
| E11 | Union by rank and path compression separately; why α(n) | **7 Q3, Q4, Q5**, 7 Q7–Q10 | **7 Ex3, Ex4**, 7 Ex1, Ex2 | Covered |
| E12 | BFS/DFS as one traversal; edge classification; entry/exit → bridges, APs, SCCs | **33 Q2, Q6, Q7**, 33 Q1, Q8, *37 Q2–Q5* | **33 Ex1, Ex5**, 33 Ex6, *37 Ex1, Ex3* | Covered; the bridges/APs/SCCs half only in optional Ch 37 — see §3.2 |
| E13 | Every shortest path as one relaxation; the three-node counterexample | **35 Q1, Q2**, 35 Q3–Q9, 33 Q4 | **35 Ex1, Ex2**, 35 Ex3–Ex6, 33 Ex4 | Covered |
| E14 | Max-flow/min-cut; residual graph; the modelling step | *38 Q1, Q6, Q7, 39 Q1, Q6, Q7*, *38 Q3* | *38 Ex1, Ex5, 39 Ex5, Ex7* | Covered **only in optional chapters** — see §3.2 |
| E15 | Specify any DP by SRTBOT | **19 Q6, Q9**, 21 Q1, 22 Q2 | **19 Ex2**, 21 Ex1 | Covered |
| E16 | Why greedy is ever correct; exchange, stays ahead, matroids; a greedy that fails | **23 Q2, Q8, Q10**, 23 Q1, Q3–Q5, Q9, 36 Q2, Q7 | **23 Ex2, Ex8 (new)**, 23 Ex1, Ex7 | Covered — stays-ahead added, §4.2 |
| E17 | String matching: prefix function, KMP, Z, Rabin-Karp, Aho-Corasick | *41 Q3–Q8, 42 Q1–Q4* | *41 Ex3–Ex7, 42 Ex1–Ex3* | Covered **only in optional chapters** — see §3.2 |
| E18 | The range-query family as one trade-off curve | **30 Q1, Q10, 31 Q10**, 30 Q2–Q9, 31 Q1–Q9, 9 Q5, Q7 | **30 Ex1**, 30 Ex2, Ex4, 31 Ex1, Ex4, Ex7 | Covered |
| E19 | Integers as sets; submasks in O(3ⁿ); XOR basis; popcount | 18 Q2, 22 Q4, 49 Q5, *40 Q3, Q4, Q6* | **22 Ex7 (new)**, 49 Ex6, *40 Ex4, Ex5, Ex7* | Covered; XOR basis and popcount only in optional Ch 40 — see §3.2 |
| E20 | P, NP, reduction, NP-hardness as a working skill | **46 Q2, Q3, Q5**, 46 Q1, Q4, Q6–Q10, 20 Q5, Q6, Q10, 34 Q6 | **46 Ex3, Ex5**, 46 Ex1, Ex2, Ex4, Ex6–Ex8 | Covered |
| E21 | The argument against pattern learning, and this course's answer | **1 Q3, Q8, 47 Q1**, 47 Q8 | **47 Ex1**, 1 Ex5 | Covered |

### Analyze

| # | Outcome | Quiz | Exercises | Verdict |
|---|---|---|---|---|
| A1 | Constraints → admissible complexity class | **47 Q2** | **47 Ex2**, 2 Ex5 | Covered (one quiz; see §4.6) |
| A2 | Full cost including the amortized term, the stack, the copy, the library call | **2 Q7, 48 Q1**, 6 Q1, 8 Q7, 10 Q1 | **48 Ex5**, 10 Ex3 | Covered |
| A3 | Same asymptotics: predict the faster from cache, allocation, branches; the crossover | **16 Q4, Q6, 11 Q1**, 16 Q5, 9 Q7, 48 Q2, 49 Q2 | **16 Ex4, Ex5**, 16 Ex6, 11 Ex3, 15 Ex4 | Covered |
| A4 | Prove a greedy safe by exchange, or produce the counterexample | **23 Q4, Q10**, 23 Q1, 8 Q2 | **23 Ex4, Ex7, Ex8 (new)**, 23 Ex1, 8 Ex5 | Covered |
| A5 | DP subproblem count × transition; rolling array; a named optimisation | **19 Q6, Q7, 22 Q3**, 19 Q10, 20 Q2 | **19 Ex6**, 21 Ex5 | Covered |
| A6 | Choose the graph algorithm from the graph's properties | **49 Q3, 35 Q9**, 35 Q1, 33 Q10, 32 Q7, Q9, 36 Q6 | **32 Ex7**, 35 Ex5, 36 Ex4 | Covered |
| A7 | Choose a range structure for a workload; defend it against two rejected | **30 Q1, Q7**, 30 Q10, 31 Q10, 9 Q5, 1 Q4 | **30 Ex1** | Covered |
| A8 | The recognition trace out loud | **47 Q3, Q5, Q6**, 47 Q4, Q7, Q10 | **47 Ex5, Ex7**, 47 Ex8 | Covered |
| A9 | Decide NP-hard; what that changes next | **46 Q6, Q7, 47 Q7**, 46 Q5, Q9 | **46 Ex5, Ex6**, 46 Ex7 | Covered |

### Operate

| # | Outcome | Quiz | Exercises | Verdict |
|---|---|---|---|---|
| O1 | Run the recognition procedure time-boxed; what to do on no match | **47 Q9, Q10** | **47 Ex6, Ex8** | Covered |
| O2 | Binary search, two pointers, window, monotonic stack without off-by-ones | **13 Q1, Q2, 8 Q4**, 13 Q3, Q8, Q10, 8 Q1, Q8, 10 Q6 | **13 Ex2, Ex3**, 13 Ex5, 8 Ex1, Ex2 | Covered |
| O3 | Debug by category: invariant, empty case, overflow, depth, aliasing, mutation | **13 Q4, 11 Q2, 48 Q3**, 6 Q1, 12 Q2 | **48 Ex3 (extended)**, 48 Ex4, Ex6 | Covered — aliasing added, §4.3 |
| O4 | Fuzz against a brute force; shrink the failing case | — | **48 Ex6**, 1 Ex5, 7 Ex6, 47 Ex7, and most Build exercises | Covered (exercise-only; see §4.6) |
| O5 | Benchmark honestly; a case where the asymptotically worse one wins | **48 Q4, Q5**, 16 Q6 | **48 Ex5, 16 Ex5**, 48 Ex1, 15 Ex4 | Covered |
| O6 | Choose the standard-library structure knowing its cost, in both languages | **48 Q1, Q2**, 48 Q10, 10 Q1, 16 Q2, 17 Q7 | **48 Ex1, Ex2**, 10 Ex3 | Covered |
| O7 | The language traps that cost interview rounds | **48 Q3, 6 Q5**, 6 Q6, 13 Q4, 16 Q2, *40 Q1, 44 Q1* | **48 Ex3, Ex4**, 2 Ex4, *40 Ex2, 44 Ex1* | Covered; outcome text corrected — see §3.4 |
| O8 | Present a solution as invariant, cost, edge cases, then code | **48 Q9**, 1 Q8 | **47 Ex5** | Covered (thin; see §4.6) |

### Build

| # | Outcome | Quiz | Exercises | Verdict |
|---|---|---|---|---|
| B1, B2, B7, B9 | *Retired with the capstone (Charter §4)* | — | — | Not mapped |
| B3 | Balanced BST with order statistics; measured height against the bound | **26 Q9**, 26 Q3 | **26 Ex8, Ex4**, 26 Ex6 | Covered |
| B4 | Binary heap with the linear build, demonstrated against the naive one | **27 Q2, Q3** | **27 Ex3**, 27 Ex2, Ex4 | Covered |
| B5 | Union-find with both optimisations and a rollback variant; the measured curve | **7 Q4, 31 Q9** | **7 Ex3, 31 Ex8**, 7 Ex4, Ex6 | Covered |
| B6 | Segment tree with lazy propagation over a monoid; Fenwick tree; fuzzed | **31 Q2, Q5** | **31 Ex1, Ex4, 30 Ex4** | Covered |
| B8 | Trie and Aho-Corasick, fuzzed against a naive scan | **28 Q1**, *42 Q2–Q4* | **28 Ex1**, *42 Ex1, Ex2* | Covered; Aho-Corasick only in optional Ch 42 — see §3.2 |

**No active outcome is unmapped.** Every one has at least one quiz question or exercise, and 41 of
43 have both (O4 is exercise-only by nature; the retired B rows are not counted).

---

## 3. Findings

### 3.1 The key was rarely in position D (fixed)

The multiple-choice key sat in positions A, B, C, D on 96, 96, 98 and 56 questions: D was right only
16% of the time. A reader who never picks D gains an edge without learning anything, which is the
§11.3 failure "answerable without the chapter". The key-length tell is already clean (key uniquely
longest on 94 of 346 = 27%, uniquely shortest on 81 = 23%, both near chance for four options).

**Fix:** 31 keys moved to D by swapping the key with option D, 10 from A, 10 from B, 11 from C,
spread evenly through the course. Positions are now 86 / 86 / 87 / 87. No option text changed, and
every question's key text was verified identical before and after.

**A trap caught on the way.** 37 explanations refer to options by number ("Option 4 claims…"). The
first pass moved three of them and broke their references; it was reverted exactly (option lines
and keys byte-identical to the commit) and redone drawing only from questions whose explanation has
no positional reference. Anyone reordering options in this course later must apply the same filter.

### 3.2 Five outcomes now live partly or wholly in optional chapters (owner decision)

Marking Chapters 37–45 optional (2026-09-24) moved assessment with them:

| Outcome | In optional chapters only |
|---|---|
| E14 max-flow, min-cut, modelling | **all of it** (Ch 38–39) |
| E17 string matching | **all of it** (Ch 41–43) |
| E12 | bridges, articulation points, SCCs (Ch 37) |
| E19 | XOR basis, popcount (Ch 40); submasks now also in Ch 22 |
| B8 | Aho-Corasick (Ch 42); the trie half is in Ch 28 |

A learner who follows Chapter 1's interview route (36 → 46) finishes without being assessed on E14
or E17. That is consistent with the decision, but the Charter still promises them to everyone.
**Recommendation:** tag E14 and E17 in the Charter as *advanced (optional chapters)*, and the named
halves of E12, E19 and B8 the same way, rather than moving assessment into core chapters. Not
changed here; it rewrites the Charter's promise, which is the owner's call.

### 3.3 The Charter miscounted its outcomes (fixed)

"48 outcomes, 44 active" → **47 outcomes, 43 active**, in both places the Charter states it.

### 3.4 O7 promised a trap that no longer exists, and Ch 16 said the same (fixed)

O7 listed "`Arrays.sort` on primitives being attackable". The OpenJDK 21 source
(`java.util.DualPivotQuicksort`) counts recursion depth and finishes any range past
`MAX_RECURSION_DEPTH` with `heapSort`, so the worst case on `int[]` is O(n log n) and the classic
quadratic-input attack does not work on the JDK this course measures with. Chapter 16's comparison
table also gave dual-pivot quicksort an n² worst case.

**Fixed:** the Ch 16 table cell now reads n log n; Ch 16 §2 gains a paragraph explaining the
heapsort fallback (and that the object sort, Timsort, never had a bad input); O7's clause now reads
"`Arrays.sort` on primitives being unstable", which the course teaches (Ch 15 §6, Ch 16 §2) and
assesses (16 Q2).

---

## 4. Thin spots, and what was done

### 4.1 The rows-audit topics had no assessment (fixed)

The nine topics added by the ch1–39 rows audit (§6 of the Blueprint) arrived with prose and code
but no exercises. Four exercises were added where the topics carry interview weight:

- **Ch 19 Ex7** — decode ways and house robber against brute force; the largest-first greedy fails on about one random row in six (measured 858 of 5,000).
- **Ch 21 Ex7** — minimum palindrome cuts against a recursive brute force.
- **Ch 22 Ex7** — the submask loop counted to exactly 3ⁿ for n = 1…16.
- **Ch 23 Ex8** — the four interview greedies against brute force, each justification named as exchange or stays-ahead, and three broken variants to refute.

Stock span (Ch 10), Newton (Ch 14), rolling hash and mutable keys (Ch 17), Tarjan's offline LCA
(Ch 29) and the Ch 49 frontier paragraph remain unassessed; each is a paragraph extending an
already-assessed outcome.

### 4.2 E16 — greedy-stays-ahead was taught but never asked (fixed)

No quiz question or exercise named the second proof template. Ch 23 Ex8 now requires naming, for
each of four greedies, which template its justification is.

### 4.3 O3 — aliasing was taught but not assessed in a core chapter (fixed)

Ch 48 teaches the aliased grid `[[0] * m] * n`; only optional Ch 41 assessed any aliasing. Ch 48
Ex3 ("Hit the traps") now includes reproducing and fixing it.

### 4.4 O7 — floor division on negatives (noted)

Taught and assessed in optional Ch 40 and Ch 44; core Ch 47 uses `floorMod` in a worked problem
and Ch 48 points to 40 and 44. Adequate for the interview route, but the most direct assessment is
optional. No change.

### 4.5 E9 — "which real system chose which" (noted)

Ch 26 names the systems in prose (OpenJDK `TreeMap` and the Linux kernel's red-black tree, among others);
assessment of that half is in Ch 48 and 49, not Ch 26. The mechanism half is well assessed. No change.

### 4.6 Single-item outcomes (noted, no change)

A1 (one quiz, two exercises), O8 (two quizzes, one exercise) and O4 (exercises only) are covered
thinly by count. Each sits in the practice-weighted Chapters 47–48, where the exercises are the
assessment by design, and O4's method runs through most Build exercises in the course.

---

## 5. §11.3 definition of done

| Check | Result |
|---|---|
| Outcome → assessment map has no unmapped outcome | **Pass.** 43 of 43 active outcomes mapped (§2) |
| No question answerable by keyword matching the chapter text | **Pass after fix.** Key uniquely longest 27%, uniquely shortest 23%, positions now 86/86/87/87 (§3.1). No two stems duplicate |
| Every `why` teaches | **Pass.** Shortest explanation 20+ words, median 59; each explains the mechanism and why the distractors fail |

Checks re-run after every edit: chapter data loads (49 chapters), `chapcheck` shows balanced tags
and no banned words in every edited chapter, `figcheck` passes (Ch 16's corrected table included).

---

## 6. Gate

**Decided 2026-09-24:** owner chose the recommendation for §3.2. E14, E17 and the named halves of
E12, E19 and B8 are tagged *advanced (optional chapters)* in the Charter.
Next: **Phase 7 (whole-course QA)**, then Phase 5 (machines).
