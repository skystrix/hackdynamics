# DSA By Patterns — Phase 1 Deliverable: Course Charter

**Status:** Phase 1 complete, awaiting owner approval of audience, outcomes, prerequisites, persona re-weighting, and the CS Fundamentals track.
**Date:** 2026-09-20. Source Map (Phase 0) delivered and gated 2026-09-20.

**Gate decisions inherited from Phase 0, binding on every later phase:**

1. Capstone is the **structures library**, each layer fuzzed against the language's own standard library.
2. Capstone and body languages: **Python + Java**.
3. Chapter budget deviates above §2's 24–36; target ~45–55, justified in the Blueprint.
4. Course opens a third track, **CS Fundamentals**, as course 01.
5. Topic universe keyed on **textbook topic with pattern name as an attribute** (Phase 0 §0.3, open item O5) — **approved**.
6. **Concurrency is out**, forwarded to a future Operating Systems course — **approved**. §5 creates that course in `COURSE_PLAN.md`, which §2 of the guide requires before an "out because it belongs to course X" decision is legal, and §5 states where this course's mandatory one-paragraph orientation and forward pointer live.

---

## 1. Title and one-line promise

**Title:** *DSA By Patterns*

**Promise (house voice):** Learn the twenty-odd ideas that every data-structures problem is
built from, and learn them as mechanisms rather than as recipes: why two pointers is a proof
that each element is touched once, why a hash table goes quadratic on inputs an adversary
picked, why `build-heap` is linear when it obviously looks logarithmic, why the same
relaxation step is Dijkstra when you order it one way and Bellman-Ford when you order it
another, and why the knapsack algorithm everyone calls polynomial is not. Then build the
structures yourself — the hash map, the balanced tree, the heap, union-find, the segment
tree, the flow engine — in Python and Java, and fuzz each one against the standard library
until it stops disagreeing.

**Positioning sentence for the landing card:** Every practice sheet gives you the list of
patterns. None of them tells you why a pattern works, when it silently doesn't, or what to
do when the problem in front of you matches none of them. This one starts there.

---

## 2. Who it is for

The three Hack Dynamics personas from `marketing/PLAN.md`, re-cut for this subject.

**Proposed re-weighting, and it differs from every prior course.** `marketing/PLAN.md` sets
C 45% / B 35% / A 20% on lifetime value, and that is right for Databases, RAG and LLM. It is
wrong here. DSA is the one subject on the roster where the buying urgency sits with the
person who has an interview scheduled, and where the student is not a low-intent reader but
the core reader — placement season *is* the use case. **Proposed: B 45% / A 30% / C 25%.**
This is an owner decision, flagged rather than assumed; it changes content emphasis (interview
lens frequency, time-boxed recognition drills, the weight of the "under pressure" material)
and it changes the marketing plan, not just this Charter.

### Persona B — "Priya", recent grad / job seeker (0–2 YOE) — 45%
- **Knows now:** Has ground three hundred LeetCode problems and can write two pointers from
  muscle memory. Cannot say why the window shrinks when it does. Solves a problem she has
  seen, freezes on the same problem in different clothes, and cannot tell the difference
  between the two situations in advance. Reads editorial solutions and feels the click of
  recognition without the transfer.
- **Goal:** Stop pattern-*matching* and start pattern-*reasoning*, so that an unseen problem
  is a procedure rather than a coin flip. Survive the follow-up question, which is always
  "why does that work?" or "what if the input were sorted / streamed / enormous?"
- **JTBD:** *When the interviewer gives me a problem I have never seen, help me get from the
  statement to a candidate approach out loud and in order, so I stop going silent for four
  minutes.*

### Persona A — "Aarav", CS student (3rd/4th year) — 30%
- **Knows now:** One data-structures course that proved things at the blackboard and one
  algorithms course that examined recurrences, both disconnected from the code he writes.
  Can state the master theorem and cannot use it. Has never implemented a hash table.
- **Goal:** Pass the university final *and* the placement test with one body of
  understanding rather than two, and finish with a repository he can point at.
- **JTBD:** *When placement season is six months out and my syllabus and my interview prep
  look like different subjects, help me see that they are one subject, so I only learn it once.*

### Persona C — "Rahul", working engineer (3–8 YOE, backend / platform) — 25%
- **Knows now:** Ships production code daily and reaches for the standard library without
  asking what it costs. Has shipped an accidental O(n²) into a hot path. Interviews
  candidates and cannot always say what a good answer would have been. Considers DSA a tax
  paid at hiring time rather than a working skill.
- **Goal:** Make the asymptotics of his own code visible to himself, know what his standard
  library actually runs, and interview others from mechanism rather than from a rubric.
- **JTBD:** *When a request that was fast at a thousand rows takes ninety seconds at a
  million, help me find the accidental quadratic from the shape of the code, so I fix the
  algorithm instead of adding a cache.*

---

## 3. Prerequisites (honest and minimal)

This is the shortest prerequisite list of any Hack Dynamics course, and that is deliberate —
it is the entry point of the track and of the roster.

| You need | Because | Where to get it if missing |
|---|---|---|
| Comfortable programming in **one** of Python or Java | Every example is given in both; you read one and can ignore the other tab | The official Python tutorial, or any first programming course |
| Loops, arrays, functions, and how to define a class or a struct | The structures are built from these and nothing more | Any intro course |
| Willingness to read the other language's tab occasionally | Two places in the course — the standard-library chapters and the capstone benchmark — the *difference* between Python and Java is the lesson, not an implementation detail | The course teaches the ~20 Java constructs and the ~15 Python constructs it uses, where it uses them |
| High-school algebra: exponents, logarithms, summing a series | Complexity is logarithms and series, and nothing harder | Khan Academy algebra II; the course's own appendix chapter re-derives every identity it uses |
| **Not required:** a discrete mathematics course | Induction, invariants and the small amount of counting and probability the course needs are taught in place, at the depth this subject needs | An appendix chapter covers induction and proof by invariant from scratch |
| **Not required:** a prior data-structures or algorithms course | The course starts at "what is a running time" and does not assume you have met a linked list | — |
| **Not required:** competitive programming experience | Contest problems appear only as an exercise reservoir, always re-framed, never assumed | — |
| **Not required:** any other course on this site | This is track 3, course 01, and the earliest entry point on the roster | — |
| **Hardware:** any laptop | Nothing in this course needs a GPU, a cloud account, a database, or more than a few hundred megabytes of memory. Every benchmark in the capstone is sized to run in under a minute on a five-year-old machine | — |

---

## 4. Outcomes ("after this course you can…"), each testable

Each maps to at least one chapter in the Blueprint and at least one quiz question or exercise
in Phase 6.

### Explain (mechanism from first principles)

- **E1.** Explain what a running time *is*: the word-RAM model, what counts as one step, why input size is measured in bits rather than elements, and why that single distinction makes the knapsack algorithm everyone calls polynomial **not** polynomial.
- **E2.** State asymptotic notation precisely — O, Ω, Θ, o, ω as claims about sets of functions — and say for each what it does *not* claim, including why "O(n²)" is true of every linear algorithm.
- **E3.** Solve a recurrence three ways (substitution, recursion tree, master theorem), and say exactly which recurrences the master theorem cannot touch and what to do instead.
- **E4.** Explain amortized analysis in all three forms (aggregate, accounting, potential), and use it to prove that dynamic-array growth, two pointers, and the monotonic stack are each linear — three results that look wrong until the accounting is done.
- **E5.** Prove the Ω(n log n) comparison-sort lower bound by the decision-tree argument, and identify precisely which assumption counting sort and radix sort break to get underneath it.
- **E6.** Explain every classical sort by mechanism, stability, memory and adaptivity — and explain what CPython, OpenJDK and libstdc++ actually run (Timsort, dual-pivot quicksort, introsort), what each chose and why.
- **E7.** Explain hash tables from the bottom: hash functions, why universal hashing needs randomness, chaining against open addressing, load factor and resizing, tombstones, and the adversarial input that makes a real hash table quadratic.
- **E8.** Explain binary search as a loop invariant rather than a formula, derive lower-bound and upper-bound variants from it, generalize it to search-on-the-answer over any monotone predicate, and explain the overflow bug that sat in a published binary search for nine years.
- **E9.** Explain the balanced-search-tree family — AVL, red-black, treap, B-tree — as four answers to one question, with the rotation or invariant that each maintains, and name which real system chose which and why.
- **E10.** Explain binary heaps: sift up and sift down, why `build-heap` is O(n) and not O(n log n), and what a Fibonacci heap buys Dijkstra in theory and why essentially nobody ships one.
- **E11.** Explain union-find: what union by rank and what path compression each contribute separately, and why the combined bound is the inverse Ackermann function rather than a constant.
- **E12.** Explain BFS and DFS as one traversal with two queues, explain the DFS tree and its edge classification, and show how entry and exit times alone yield bridges, articulation points and strongly connected components.
- **E13.** Explain every shortest-path algorithm as the same edge-relaxation step under a different ordering — BFS, 0-1 BFS, Dijkstra, Bellman-Ford, Floyd-Warshall, Johnson — and say precisely, with a three-node counterexample, why Dijkstra breaks on a negative edge.
- **E14.** Explain max-flow and min-cut: the residual graph, augmenting paths, why the theorem holds, and the **modelling** step that turns bipartite matching, project selection or disjoint paths into a flow network.
- **E15.** Specify any dynamic program by executing MIT 6.006's SRTBOT procedure — subproblems, relate, topological order, base cases, original problem, time — rather than by recognizing it.
- **E16.** Explain why a greedy algorithm is ever correct: the exchange argument, greedy-stays-ahead, and the matroid structure that makes greedy provably optimal — and demonstrate a greedy that looks correct and is not.
- **E17.** Explain string matching: why naive matching is quadratic, what the prefix function actually computes (borders and periods, not "the longest thing that matched"), and how KMP, Z, Rabin-Karp and Aho-Corasick each exploit that structure.
- **E18.** Explain the range-query family — prefix sums, sparse table, Fenwick tree, segment tree, lazy propagation, sqrt decomposition, Mo's algorithm — as points on one update-cost/query-cost trade-off curve rather than as seven unrelated structures.
- **E19.** Explain bitmask reasoning: integers as sets, submask enumeration in O(3ⁿ) and why the exponent is three, the XOR basis over GF(2), and why popcount is one instruction on your CPU.
- **E20.** Explain P, NP, reduction and NP-hardness as a working skill — recognize that a problem is hard so you stop searching for a polynomial algorithm and start choosing between exponential search, approximation and heuristics.
- **E21.** State the strongest argument *against* pattern-based learning — that recognition without derivation produces no transfer — and state this course's answer to it, which is the reason every pattern here is taught with its proof and its failure case.

### Analyze (reason about trade-offs and bounds on given inputs)

- **A1.** Given constraints (n ≤ 10⁵, a two-second limit, 256 MB), compute the admissible complexity class and rule out whole families of approaches before writing a line.
- **A2.** Derive the time and space complexity of a given solution including the contributions everyone forgets: the amortized term, the recursion stack, the copy inside the loop, and the hidden cost of the standard-library call.
- **A3.** Given two solutions with identical asymptotics, predict which is faster on real hardware from cache behaviour, allocation and branch cost — and state the input size below which the asymptotically worse algorithm wins.
- **A4.** Given a proposed greedy rule, either prove it safe with an exchange argument or produce the counterexample that kills it.
- **A5.** Given a dynamic program, state its subproblem count and per-transition cost, then reduce its space with a rolling array or its time with a named optimization (divide-and-conquer DP, Knuth, convex hull trick).
- **A6.** Given a graph problem, choose among BFS, 0-1 BFS, Dijkstra, Bellman-Ford, Floyd-Warshall, union-find, topological sort and max-flow **from the properties of the graph** — weights, signs, density, static or dynamic — rather than from resemblance to a problem you have seen.
- **A7.** Given a range-query workload — update-to-query ratio, the operation's algebra, online or offline — choose the structure and defend it against the two you rejected.
- **A8.** Given an unseen problem, produce the recognition trace out loud: the cues present, the candidate patterns each cue suggests, the test that confirms or rejects each candidate, and the reason the survivor survived.
- **A9.** Given a problem that resists every technique in the course, decide whether it is NP-hard, and say what that changes about what you should do next.

### Operate (recognize, write, debug and measure — in the interview room and in production)

- **O1.** Run the course's recognition procedure on a problem you have never seen, inside a time box, and say what to do when it terminates with no match — which is the case the practice sheets never cover.
- **O2.** Write binary search, two pointers, sliding window and the monotonic stack without off-by-one errors, by stating the invariant first and checking the code against it rather than by testing until it passes.
- **O3.** Debug a wrong solution by category rather than by inspection: broken invariant, unhandled empty or single-element case, integer overflow, recursion depth, aliasing a shared list, mutating while iterating.
- **O4.** Write a fuzzer that compares your solution against a brute force on random small inputs, shrink the first failing case to something you can read, and fix from the shrunk case.
- **O5.** Benchmark two implementations honestly on your own machine — warmed up, repeated, with the conditions stated — and exhibit a real case where the asymptotically worse one wins.
- **O6.** Choose the right standard-library structure in both Python and Java knowing what each actually costs, including the ones that surprise people: `list.insert(0, x)`, `dict` ordering guarantees, Java's `HashMap` treeification, `ArrayList.remove`, autoboxing in a `PriorityQueue<Integer>`.
- **O7.** Avoid the language traps that cost interview rounds: Python's recursion limit and floor division on negatives; Java's silent `int` overflow, `Arrays.sort` on primitives being attackable, and `==` on boxed integers.
- **O8.** Present a solution the way the mechanism was taught — invariant, cost, edge cases, then code — which is also the order an interviewer scores.

### Build (the capstone: the structures library, Python + Java)

- **B1.** Implement a dynamic array with amortized-O(1) growth, then *measure* the amortization and show the potential function in the data rather than asserting it.
- **B2.** Implement an open-addressing hash map with resizing and tombstones, fuzz it against `dict` and `HashMap` until they agree, then construct the adversarial key set that degrades it and measure the degradation.
- **B3.** Implement a balanced binary search tree with order-statistics queries, fuzzed against a sorted container, and report the measured height against the theoretical bound.
- **B4.** Implement a binary heap with the O(n) build, fuzzed against `heapq` and `PriorityQueue`, and demonstrate the linear build empirically against the naive one.
- **B5.** Implement union-find with union by rank and path compression, plus a rollback variant, and plot the measured near-constant cost curve.
- **B6.** Implement a segment tree with lazy propagation over a general monoid, and a Fenwick tree, both fuzzed against a naive array over a random operation stream.
- **B7.** Implement a graph engine — adjacency structures, Dijkstra on your own heap, Dinic's max-flow — with Dijkstra cross-checked against Bellman-Ford and the flow cross-checked against a brute-force min-cut.
- **B8.** Implement a trie and Aho-Corasick, fuzzed against a naive multi-pattern scan.
- **B9.** Benchmark the finished library against both standard libraries, explain every gap with a mechanism from the course rather than with a shrug, and write the confession table of everything simplified.

**48 outcomes.** §4 of the guide asks for 15–30. *RAG In Depth* shipped 39 and *LLM In Depth*
40 against the same §1 bar; this course carries ~50 chapters against that range's 24–36, and
48 is proportionate to the chapter budget the owner already approved. The alternative is not
consolidation, it is dropping testable claims. Flagged here for the gate rather than quietly
exceeded.

---

## 5. Track position, and the CS Fundamentals track

`COURSE_PLAN.md` currently describes two tracks: the **Database track** (Databases in Depth →
Postgres → Redis → Build Your Own DB → SQL Performance → Analytical DBs) and the **AI
Engineering track** (LLM In Depth → RAG In Depth). Neither has room for this course, and both
quietly assume it.

**This Charter opens a third track, CS Fundamentals, with DSA By Patterns as course 01.**

- **Assumes from earlier courses:** nothing. This is the earliest entry point on the entire
  roster — the only course whose prerequisites are a programming language and high-school
  algebra.
- **What later courses may assume from it:** Big-O and amortized reasoning; hash tables,
  balanced trees and B-trees as mechanisms; heaps; graph traversal and shortest paths; the
  DP vocabulary. *Databases in Depth* currently re-teaches B-trees and hashing from scratch;
  once this course is live, its chapters can point back rather than re-derive, and the
  Database track gains a natural feeder.

**The track, as proposed for `COURSE_PLAN.md`:**

| # | Course | Status | Owns |
|---|---|---|---|
| 01 | **DSA By Patterns** | In production | Complexity and amortized analysis; every core data structure and algorithm; the pattern recognition procedure; the structures-library capstone |
| 02 | **Operating Systems in Depth** | Planned | Processes and threads; **concurrency, synchronization and parallel algorithms**; scheduling; virtual memory; file systems; I/O |
| 03 | **Computer Networks in Depth** | Planned | The stack from the wire up; TCP; TLS; HTTP; routing |
| 04 | **System Design in Depth** | Planned | The design interview from mechanism: load balancing, caching, partitioning, queues, consistency — resting on tracks 1 and 2 |

Courses 02–04 replace the placeholder OS / Networking / Compilers cards that `index.html`
still shows.

### The concurrency decision (guide §2's "out because it belongs to course X")

Concurrency is **out** of this course: threads, locks, lock-free structures, the parallel
algorithms of CLRS 4e chapter 26, and the "Multi-threaded" pattern that Grokking lists.
Guide §2 permits this only when course X exists in `COURSE_PLAN.md`; the amendment above
creates it, and `COURSE_PLAN.md` is updated in the same commit as this Charter rather than at
Phase 8, because Phase 2's Gap Matrix cannot legally mark the row "out" until it exists.

§2 also requires that this course still give a one-paragraph orientation and a forward
pointer. **Where it lives:** the complexity-model chapter, at the point where the word-RAM
model is defined as one operation at a time. That is the honest place to say that the model
is a choice, that a different model (concurrent, parallel, external-memory, cache-oblivious)
changes which algorithm wins, and that the parallel and concurrent models are course 02's
subject. The Blueprint will name the chapter and the section.

**One row remains genuinely ambiguous and Phase 2 must decide it explicitly:** the *design*
problems in Phase 0 §2 row R5 — bounded buffer, print-in-order, dining philosophers. They
appear in interview banks under "Multi-threaded", they are unambiguously OS material, and
they are also unambiguously asked of candidates who will never take an OS course. The
recommendation carried into Phase 2 is **out, with the forward pointer**, consistent with the
decision above.

---

## 6. Where the course rests on primary literature rather than on provided books (guide §3.6)

For the prior two courses this section listed the gaps a thin book left. Here the answer is
categorical and the owner should read it as the principal risk of the project:

> **There is no book spine. Every chapter of this course rests on primary literature, open
> reference works, published university course material, and the source code of real
> standard libraries.**

This is less dangerous than it sounds, for a reason specific to this subject: algorithms is
the best-documented topic in computing. Every mechanism in Phase 0 §2 has a named paper with
a year, a treatment in at least two of the four textbooks surveyed, a reference article on
CP-Algorithms, and a production implementation whose source can be read. Nothing in this
course has to be taken on anyone's word. The corresponding obligation, per §3.3 and §11.1, is
that **no complexity bound, invariant, constant or library behaviour enters the text from
memory** — each is verified against the paper, the textbook, or the source file, and the
chapter header names which.

Per-part spines, from the Phase 0 reading list:

| Part (provisional) | Primary spine | Real-system spine |
|---|---|---|
| Complexity and the model | Knuth 1976; Hartmanis & Stearns 1965; Tarjan 1985 (potential method); Sleator & Tarjan 1985 | CPython and OpenJDK growth factors for the dynamic-array amortization |
| Linear-scan patterns | Laaksonen ch. 8 (amortized framing); Kadane via Bentley 1984 | — |
| Searching and sorting | Hoare 1961; Williams 1964; Floyd 1964; Blum et al. 1973; Musser 1997 | CPython `listobject.c` (Timsort); OpenJDK `DualPivotQuicksort`; libstdc++ introsort; Go pdqsort |
| Hashing | Carter & Wegman 1979; Pagh & Rodler 2001; Bloom 1970 | CPython `dictobject.c`; OpenJDK `HashMap` treeification |
| Trees and heaps | Adelson-Velsky & Landis 1962; Bayer & McCreight 1972; Guibas & Sedgewick 1978; Seidel & Aragon 1996; Fredman & Tarjan 1987; Morris 1979 | OpenJDK `TreeMap`; Linux `lib/rbtree.c`; SQLite B-tree |
| Union-find | Tarjan 1975 (the α(n) bound) | — |
| Graphs | Dijkstra 1959; Bellman 1958; Floyd/Warshall 1962; Johnson 1977; Tarjan 1972; Kahn 1962; Hierholzer 1873 | — |
| Flows and matching | Ford & Fulkerson 1956; Edmonds & Karp 1972; Dinic 1970; Hopcroft & Karp 1973; Gale & Shapley 1962 | — |
| Dynamic programming | Bellman 1952/1957; Wagner & Fischer 1974; Hirschberg 1975; Held & Karp 1962; Knuth 1971; Yao 1980 | — |
| Greedy | Huffman 1952; Edmonds 1971 (matroids); Graham 1966 | — |
| Strings | Knuth, Morris & Pratt 1977; Karp & Rabin 1987; Aho & Corasick 1975; Manacher 1975; Manber & Myers 1990; Kasai et al. 2001 | Lucene FST; `grep`'s matcher |
| Range queries | Fenwick 1994; Bentley 1977 (segment trees); Mo's algorithm (folklore, attribution to be resolved in Phase 4) | — |
| Complexity theory | Cook 1971; Karp 1972 | — |

**One attribution is already known to be difficult and is flagged now:** Mo's algorithm has
no canonical paper and is competitive-programming folklore. Phase 4 either finds a primary
attribution or the text says plainly that the technique is folklore without a single origin.
Per §3.5 it will not be given an invented citation.

---

## 7. Tool and language decisions proposed for the Blueprint (guide §3.7)

| Role | Choice | Why |
|---|---|---|
| Body code blocks | **Python + Java**, as `code-tabs`, throughout — not only in the capstone | Python is what candidates actually type in interviews; Java is the most-asked enterprise interview language and the one whose collections have documented, readable costs. Per §3.7 both are popular, widely used, and fit the mechanism |
| Capstone | Same two, line-for-line equivalent in intent per §9 | The structures library is exactly the case §9 was written for |
| C++ | **Named, never required**, and only where the standard library is the subject | Three places: ordered-statistics containers (`std::set`, GNU policy trees) where Python and Java have no direct equivalent, `std::nth_element` as the shipped quickselect, and `__builtin_popcount`. Competitive programming's default language cannot be ignored in a field guide, but the course does not require reading it |
| Problem corpus | Problems referenced **by name only**, never reproduced | §3.4. LeetCode, CSES and Codeforces are named as where to find them; the course writes its own worked examples and its own exercises |
| Verification in the capstone | Standard library only: `random`, `assert`, `unittest` / plain `main` | Per §9 the code must be complete as shown with no hidden helper files, and a fuzzer that needs Hypothesis or JUnit is not readable inside a chapter. The field-guide chapter names the real tools for when the reader wants them |
| Benchmarking | `time.perf_counter` with warmup and repetition; `System.nanoTime` with a stated warmup | JMH is the correct tool for Java microbenchmarks and the course says so and explains JIT warmup as the reason it exists — but a benchmark the reader cannot run from the chapter text is not a benchmark they will run |
| Complexity measurement | Measured operation counts plotted against n, from the course's own counters | The honest alternative to asserting a bound: instrument the structure, fit the curve, show it |
| Hardware | Any laptop | Stated in §3 and enforced: every capstone benchmark is sized to finish in under a minute on a five-year-old machine |

**No deviation from §9 is requested.** Unlike *LLM In Depth*, the two-language,
line-for-line capstone is a natural fit here and is retained exactly as the guide specifies,
including the honest benchmark, the confession table and three graduation projects.

---

## 8. Charter self-check against §11

- 48 outcomes, grouped explain / analyze / operate / build, each an observable action; the overrun on the 15–30 guidance is declared in §4 with its reason and its proportion to the approved chapter budget.
- Prerequisites are minimal and honest, each with a pointer, and no prior course on this site is assumed — this is the roster's earliest entry point.
- Track position stated: a new CS Fundamentals track with this course as 01, and `COURSE_PLAN.md` amended in the same commit because §2's "out because it belongs to course X" rule depends on course 02 existing.
- The concurrency "out" decision is recorded with the location of its mandatory orientation paragraph and forward pointer, and the one ambiguous row is handed to Phase 2 rather than silently decided.
- §3.6 disclosure is categorical: the whole course rests on primary literature and real source code, with per-part spines named and one known-difficult attribution flagged in advance.
- §3.7 tool choices justified; no guide deviation requested beyond the chapter budget already approved at Phase 0.

**Gate:** owner approves audience **including the B 45% / A 30% / C 25% re-weighting**,
outcomes, prerequisites, and the CS Fundamentals track with its four courses.
Next: **Phase 2 — Topic Universe and Gap Matrix**, deciding core / supporting / mentioned /
out for every one of Phase 0 §2's ~160 rows, with the orphan list printed empty.
