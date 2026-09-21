# DSA By Patterns — Phase 2 Deliverable: Topic Universe and Gap Matrix

**Status:** Phase 2 complete, awaiting owner approval of the decision column.
**Date:** 2026-09-20. Phase 0 gated 2026-09-20; Phase 1 gated 2026-09-20 with the persona
re-weighting (B 45% / A 30% / C 25%) accepted.

---

## 1. Sources merged, against the §4 Phase 2 minimum

| §4 requires | Minimum | This course merged |
|---|---|---|
| The provided books | all | **none exist** (owner instruction; §3.6 mode) |
| University syllabi | 3, named | **4**: MIT 6.006 (Spring 2020, 21 lectures) · Princeton COS 226 (Spring 2024, 24 lectures) · Stanford CS 161 · CMU 15-451/651 |
| Other textbooks' tables of contents | 2, named | **6**: CLRS 4e · Erickson *Algorithms* · Skiena *ADM* 3e · Sedgewick & Wayne *Algorithms* 4e · Kleinberg & Tardos *Algorithm Design* · Laaksonen *Competitive Programmer's Handbook* |
| Industry certification / job-description skill lists | 1–2, if they exist | **2**: Tech Interview Handbook's priority-ranked topic cheatsheet (High/Mid/Low per topic) · the published Google and Meta interview-prep topic lists |
| Interview question banks (topics only) | 2 | **5**: Grokking · NeetCode 150 · Tech Interview Handbook 75 · Striver A2Z · Sean Prashad |
| Documentation of the most important real systems | 2–3 | **4**: CPython (`listobject.c`, `dictobject.c`) · OpenJDK (`Collections`, `DualPivotQuicksort`, `HashMap`, `TreeMap`) · libstdc++/STL · CP-Algorithms as the reference-implementation catalogue |

**Column keys used in §3.**
**U** (university syllabi): **M** = MIT 6.006, **P** = Princeton COS 226, **S** = Stanford CS 161, **C** = CMU 15-451.
**T** (textbooks): **L** = CLRS, **E** = Erickson, **K** = Skiena, **W** = Sedgewick, **T** = Kleinberg–Tardos, **H** = Laaksonen.
**B** (interview banks): count out of 5.
**Decision:** **core** (full treatment, §5.3 depth ladder to the rung the row requires) · **supporting** (a section or named callout) · **mentioned** (named with a pointer, one paragraph) · **out** (with the reason and the receiving course).

---

## 2. Decision rules, as applied

The guide's four rules, plus three tie-breaks this course adopts and the owner should approve:

**Guide rules (§4 Phase 2).**
1. Anything a university final would examine is **core or supporting. Never out.** Operationally: if any one of M/P/S/C carries it as a lecture, the floor is *supporting*.
2. Anything a senior engineer would be expected to know in an interview is **core or supporting. Never out.**
3. **History is not out.** Every major idea gets its origin — who, when, what problem. This is a property of every core and supporting row, not a row of its own.
4. **"Out because it belongs to course X"** is legal only if course X is in `COURSE_PLAN.md`. Available receivers: CS Fundamentals 02 *Operating Systems* (created at Phase 1), 03 *Computer Networks*, 04 *System Design*; the Database track; the AI Engineering track.

**This course's additional tie-breaks.**
5. **When in doubt between "mentioned" and "out", choose mentioned.** The owner's bar is that no pattern, structure or algorithm is missed. A named pointer with its origin costs one line of prose and closes the gap honestly; "out" on a real algorithm does not. This is why the out list below is nine rows and not sixty.
6. **A row that only the competitive-programming catalogue carries is *mentioned* by default, not out** — it is a real algorithm with a real origin, it is simply not examined or asked. It lands in the frontier chapter (see §6).
7. **Bank absence is never a reason to demote.** Three of the four university syllabi examine amortized analysis and none of the five banks names it. Rule 1 governs; rule 2 cannot be read as a ceiling.

---

## 3. The Gap Matrix

### A. Analysis and foundations

| # | Topic | U | T | B | Decision | Where it lands / reason |
|---|---|---|---|---|---|---|
| A1 | Asymptotic notation: O, Ω, Θ, o, ω as claims about function sets | MPSC | LEKWTH | 3 | **core** | Keystone. The rung-2 precision no bank supplies: what each notation does *not* claim |
| A2 | Word-RAM model; what counts as one step; input size in bits | MSC | LEK | 0 | **core** | Carries the concurrency forward pointer (Phase 1 §5) and makes A10/K7 possible |
| A3 | Recurrences: substitution, recursion tree, master theorem, Akra–Bazzi | MSC | LEKWT | 0 | **core** | Examined at three of four schools; Akra–Bazzi *supporting* within it |
| A4 | Average case, worst case, expected time; what "average" assumes | MPSC | LEKWT | 1 | **core** | — |
| A5 | **Amortized analysis**: aggregate, accounting, potential | PSC | LKTH | 0 | **core** | Keystone, and the course's structural bet: two pointers, monotonic stack and dynamic arrays are taught *here* as one result, not as three tricks |
| A6 | **Lower bounds**: decision-tree Ω(n log n), adversary arguments | MPSC | LEKWT | 0 | **core** | Rule 1. The only proof in the course that an algorithm *cannot* exist |
| A7 | Randomized algorithms: Las Vegas vs Monte Carlo; linearity of expectation | PSC | LEKT H | 0 | **core** | COS 226 L21, CS 161, CMU, KT ch. 13 |
| A8 | Space complexity; in-place as a definition, not a vibe | MSC | LKWH | 2 | **supporting** | Section inside A1's chapter |
| A9 | Recursion, the call stack, converting to iteration | M | LEKWH | 4 | **core** | Erickson ch. 1 is the model treatment |
| A10 | P, NP, reductions, NP-hardness as a working skill | MPSC | LEKWT | 0 | **core** | Rule 1 and rule 2. Taught as recognition, per Erickson ch. 12 and Sedgewick 6.6 |
| A11 | Approximation algorithms; competitive and approximation ratios | C | LKT | 0 | **supporting** | CMU; KT ch. 11; CLRS ch. 35. Lands in the NP-hardness part as "what to do next" |
| A12 | **Online algorithms**: ski rental, move-to-front, cache replacement | C | L | 0 | **supporting** | CLRS 4e ch. 27 is new and directly reframes the LRU interview question as an online problem — the better framing, and nobody teaches it that way |
| A13 | Streaming and sketching: reservoir sampling, Count-Min, HyperLogLog | C | — | 0 | **supporting** | CMU. Reservoir sampling is also a real interview question (R4) |
| A14 | Reductions as a design technique, not only a hardness tool | PC | WT | 0 | **supporting** | Sedgewick 6.5; the bridge between A10 and I21 flow modelling |
| A15 | PSPACE and beyond | — | T | 0 | **mentioned** | KT ch. 9 only; no syllabus, no bank. One paragraph in the frontier chapter |
| A16 | Local search, simulated annealing, metaheuristics | — | TH | 0 | **mentioned** | KT ch. 12; CP-Algorithms. Named with its origin, pointer to the frontier chapter |
| A17 | Multiplicative weights | P | — | 0 | **mentioned** | COS 226 L21 only. Rule 1 says never out; one paragraph inside A13's section, connected to online learning |
| A18 | Abstract data type vs implementation; the API/cost contract | P | WK | 0 | **core** | Sedgewick 1.2/3.1. The idea that makes the whole capstone legible |

### B. Linear-scan patterns over arrays and strings

| # | Topic | U | T | B | Decision | Where it lands / reason |
|---|---|---|---|---|---|---|
| B1 | Two pointers, opposite ends | — | H | 5 | **core** | Taught as an A5 corollary |
| B2 | Two pointers, same direction; read/write compaction | — | H | 5 | **core** | — |
| B3 | Fixed-size sliding window | — | H | 5 | **core** | — |
| B4 | Variable-size sliding window; shrink on invariant break | — | H | 5 | **core** | Keystone. The invariant is the lesson, not the template |
| B5 | Prefix sums, difference arrays, 2-D prefix sums | — | LH | 4 | **core** | — |
| B6 | Kadane / maximum subarray | — | LH | 4 | **core** | Origin: Bentley's *Programming Pearls* column, 1984; algorithm credited to Kadane |
| B7 | Cyclic sort / index-as-hash placement | — | — | 3 | **supporting** | Bank-native, real, narrow. A section, not a chapter |
| B8 | Dutch national flag / three-way partition | — | LKW | 3 | **core** | Dijkstra 1976; also the fix for quicksort on duplicate keys (D3) |
| B9 | Interval merge, insert, and the endpoint sweep | — | LKT | 5 | **core** | — |
| B10 | Sweep line over sorted events | P | LKH | 1 | **core** | COS 226 L13; CPH ch. 30. The general form B9 is a special case of |
| B11 | Meet in the middle | — | H | 2 | **supporting** | — |
| B12 | Boyer–Moore majority vote | — | K | 2 | **supporting** | Origin 1981; a one-page proof that belongs in the invariant chapter |
| B13 | Matrix traversal: spiral, rotate in place, transpose | — | — | 4 | **supporting** | TIH ranks Matrix *High Priority*; it is the absence of a pattern and is taught as such |
| B14 | Functional-graph cycle detection: Floyd, Brent | — | LH | 3 | **core** | Origin Floyd (via Knuth 1969), Brent 1980; the honest version of "fast and slow pointers" |

### C. Searching

| # | Topic | U | T | B | Decision | Where it lands / reason |
|---|---|---|---|---|---|---|
| C1 | Binary search as a loop invariant; the off-by-one contract | MPS | LKWH | 5 | **core** | Keystone. Includes the 2006 JDK `(lo+hi)/2` overflow bug as a callout |
| C2 | Lower bound / upper bound / equal range | — | WH | 3 | **core** | — |
| C3 | **Binary search on the answer** over a monotone predicate | — | H | 4 | **core** | Keystone; Striver weights it heavily and it generalizes half of C |
| C4 | Rotated, mountain, and unbounded-array search | — | — | 5 | **supporting** | Bank-native variants of C1; taught as invariant exercises |
| C5 | Ternary search on a unimodal function | — | H | 0 | **supporting** | — |
| C6 | Exponential / galloping search | — | K | 0 | **supporting** | Also the mechanism inside Timsort's merge (D7) |
| C7 | Quickselect; median of medians | MS | LEKW | 3 | **core** | Blum, Floyd, Pratt, Rivest & Tarjan 1973; shipped as `std::nth_element` |
| C8 | Selection across two sorted arrays | — | — | 3 | **supporting** | The "median of two sorted arrays" question, taught from C7 |

### D. Sorting and order

| # | Topic | U | T | B | Decision | Where it lands / reason |
|---|---|---|---|---|---|---|
| D1 | Insertion, selection, bubble; where insertion genuinely wins | MP | LKWH | 2 | **core** | Insertion sort's adaptivity is why Timsort exists |
| D2 | Mergesort; stability; bottom-up; counting inversions | MPSC | LEKWH | 3 | **core** | — |
| D3 | Quicksort: partition schemes, pivot choice, randomization, worst case | PSC | LEKWH | 3 | **core** | Hoare 1961 |
| D4 | Heapsort and the binary heap | MP | LKWH | 4 | **core** | Williams 1964; Floyd 1964 |
| D5 | Counting, radix, bucket sort; breaking the comparison bound | MP | LKW | 2 | **core** | Paired with A6 — the bound and its escape in one chapter |
| D6 | Custom comparators; stability as a design tool | — | WH | 3 | **core** | The multi-key sort every engineer writes and few reason about |
| D7 | **What the standard libraries actually run**: Timsort, dual-pivot, introsort, pdqsort | — | — | 0 | **core** | In no source in the map. Read from CPython `listobject.c`, OpenJDK `DualPivotQuicksort`, libstdc++. This is a §6.3 engineering-reality chapter and a differentiator |
| D8 | External and parallel sorting | — | LK | 0 | **mentioned** | External-memory model named; the *parallel* half is out to CS Fundamentals 02 |
| D9 | Order statistics and k-th smallest | MS | LKW | 4 | **core** | — |
| D10 | String sorts: LSD/MSD radix, 3-way radix quicksort | P | W | 0 | **supporting** | Sedgewick 5.1; COS 226. Bridges D5 and the strings part |

### E. Hashing

| # | Topic | U | T | B | Decision | Where it lands / reason |
|---|---|---|---|---|---|---|
| E1 | Hash functions; universal hashing; why randomness is required | MPSC | LKW | 1 | **core** | Carter & Wegman 1979 |
| E2 | Chaining vs open addressing; probing; tombstones | MP | LKW | 1 | **core** | Capstone layer B2 |
| E3 | Load factor, resizing, amortized O(1), the rehash stall | MP | LKW | 0 | **core** | An A5 application |
| E4 | Hash maps and sets as the space-for-time pattern | — | W | 5 | **core** | The banks' "Hash Maps pattern", correctly named |
| E5 | Rolling hash and Rabin–Karp; collision probability | — | LKH | 1 | **core** | Karp & Rabin 1987 |
| E6 | String hashing for equality and substring comparison | — | H | 1 | **supporting** | With the anti-hash caveat (E7) |
| E7 | Adversarial inputs, hash flooding, mutable keys as a bug | — | — | 0 | **core** | In no source. Real, interview-relevant, and the reason E1 needs randomness |
| E8 | Bloom filters and counting sketches | — | K | 0 | **supporting** | Bloom 1970; folded into A13 |
| E9 | Cuckoo and perfect hashing | — | LK | 0 | **mentioned** | Pagh & Rodler 2001; frontier chapter |

### F. Stacks, queues and monotonic structures

| # | Topic | U | T | B | Decision | Where it lands / reason |
|---|---|---|---|---|---|---|
| F1 | Stack and queue contracts; array vs linked implementation | P | LKWH | 5 | **core** | — |
| F2 | Deques and circular buffers | P | WH | 3 | **core** | — |
| F3 | **Monotonic stack**: next greater/smaller, spans, histogram | — | H | 5 | **core** | Keystone; taught as an A5 corollary |
| F4 | **Monotonic deque**: sliding-window minimum | — | H | 3 | **core** | Same |
| F5 | Min-stack / min-queue in O(1) | — | H | 3 | **supporting** | — |
| F6 | Expression parsing, RPN, shunting-yard | P | KW | 3 | **supporting** | Dijkstra 1961 |
| F7 | Explicit-stack recursion elimination | — | KW | 3 | **core** | Prashad's "recursion disallowed → stack" rule, taught properly |

### G. Linked structures

| # | Topic | U | T | B | Decision | Where it lands / reason |
|---|---|---|---|---|---|---|
| G1 | Singly/doubly linked lists; sentinel nodes | P | LKW | 5 | **core** | Includes the cache argument for why arrays usually win |
| G2 | In-place reversal, whole and in k-groups | — | — | 5 | **core** | — |
| G3 | Runner technique: middle, nth-from-end, cycle entry | — | H | 5 | **core** | Proof of the cycle-entry step, which no bank gives (see B14) |
| G4 | Merging, partitioning and sorting linked lists | — | LW | 4 | **core** | — |
| G5 | Deep copy with random pointers | — | — | 4 | **supporting** | — |
| G6 | **LRU and LFU caches** | — | L | 5 | **core** | Taught twice: as a structure, and in A12 as an *online* problem with a competitive ratio |
| G7 | Skip lists | — | KW | 0 | **supporting** | Pugh 1990; the randomized answer to H5, and what Redis ships |

### H. Trees

| # | Topic | U | T | B | Decision | Where it lands / reason |
|---|---|---|---|---|---|---|
| H1 | Binary tree shapes, height, the traversal trio, Morris traversal | MP | LKWH | 5 | **core** | Morris 1979 as the O(1)-space callout |
| H2 | Level-order traversal and variants | M | LKW | 5 | **core** | — |
| H3 | Tree DP by returning a tuple upward: diameter, balance, path sum | — | H | 5 | **core** | Keystone; the single highest-yield tree idea and the banks teach it as four separate problems |
| H4 | BSTs: search, insert, delete, successor | MPS | LKWH | 5 | **core** | — |
| H5 | Balanced BSTs: AVL rotations, red-black invariants, treaps | MPS | LKW | 0 | **core** | Capstone layer B3. AVL 1962; Guibas & Sedgewick 1978; Seidel & Aragon 1996 |
| H6 | B-trees: the mechanism and the fanout argument | P | LKW | 0 | **core** | *Mechanism only.* The storage-engine treatment (pages, buffer pool, fill factor) is **out** to *Databases in Depth* with a forward pointer |
| H7 | Binary heaps; the O(n) build; d-ary heaps | MP | LKWH | 5 | **core** | Capstone layer B4 |
| H8 | Fibonacci and pairing heaps; what they buy Dijkstra | — | LK | 0 | **supporting** | Fredman & Tarjan 1987, with the honest note that nobody ships one |
| H9 | Two heaps for a running median | — | — | 4 | **core** | — |
| H10 | **Tries**: insert, search, prefix, compressed/radix | P | KWH | 5 | **core** | Capstone layer B8 |
| H11 | Serialization and reconstruction from traversals | — | — | 4 | **core** | Includes *which pairs of traversals are sufficient*, which the banks never state |
| H12 | LCA: naive, binary lifting, Euler tour + RMQ, Tarjan offline | — | LH | 1 | **core** | Bender & Farach-Colton 2000 |
| H13 | Tree diameter, centroid, centroid decomposition | — | H | 1 | **core** (diameter/centroid) · **supporting** (decomposition) | — |
| H14 | **Heavy-light decomposition**; path queries | — | — | 0 | **supporting** | CP-Algorithms only; Sleator & Tarjan 1983 as the ancestor. Rule 6 would say mentioned; promoted to supporting because it is the natural finish of H12+N4 |
| H15 | Euler-tour flattening; subtree as a contiguous range | — | H | 0 | **core** | The idea that turns tree problems into array problems; unnamed by every bank |
| H16 | kd-trees, interval trees, geometric BST applications | P | L | 0 | **supporting** | COS 226 L13. Rule 1 |

### I. Graphs

| # | Topic | U | T | B | Decision | Where it lands / reason |
|---|---|---|---|---|---|---|
| I1 | Representations; implicit graphs; the grid *is* a graph | MP | LEKWH | 5 | **core** | — |
| I2 | BFS; BFS as unweighted shortest path | MP | LEKWH | 5 | **core** | — |
| I3 | DFS; the DFS tree; edge classification; entry/exit times | MP | LEKWH | 4 | **core** | Keystone. Erickson ch. 6; Tarjan 1972. Unlocks I15 and I16 in one pass |
| I4 | Multi-source BFS; 0-1 BFS | — | H | 2 | **core** | — |
| I5 | Connected components; flood fill; island counting | MP | LEKW | 5 | **core** | — |
| I6 | **Union–find** with rank and path compression; α(n) | PS | LEKWH | 4 | **core** | Keystone; capstone layer B5. Tarjan 1975. Course opens with it, following COS 226 |
| I7 | Topological sort: Kahn and DFS-based; DAG cycle detection | MPS | LEKWH | 5 | **core** | Kahn 1962 |
| I8 | DP over a DAG; longest path; successor graphs | M | EH | 1 | **core** | The bridge from graphs to DP, and the honest reason longest-path is hard in general |
| I9 | Dijkstra with a heap; why no negative edges | MPSC | LEKWH | 3 | **core** | Dijkstra 1959 |
| I10 | Bellman–Ford; negative cycles; SPFA | MSC | LEKWH | 1 | **core** | Bellman 1958 / Ford 1956 |
| I11 | Floyd–Warshall; transitive closure | MSC | LEKH | 1 | **core** | — |
| I12 | Johnson's reweighting | M | LE | 0 | **supporting** | MIT 6.006 L14. Rule 1 |
| I13 | A* and heuristic search; admissibility | — | K | 0 | **supporting** | Hart, Nilsson & Raphael 1968 |
| I14 | MST: Kruskal, Prim, the cut property, second-best MST | MPSC | LEKWTH | 2 | **core** | Kruskal 1956; Prim 1957 (Jarník 1930) |
| I15 | SCCs: Kosaraju, Tarjan; the condensation graph | PC | LEKH | 1 | **core** | — |
| I16 | Bridges, articulation points, biconnectivity | — | EKH | 1 | **core** | Hopcroft & Tarjan 1973 |
| I17 | **2-SAT** via implication graph and SCC | — | H | 0 | **supporting** | Aspvall, Plass & Tarjan 1979. The best payoff-per-page result in the course |
| I18 | Eulerian path/circuit (Hierholzer); De Bruijn sequences | — | KH | 0 | **supporting** | Hierholzer 1873; Euler 1736 as the origin of the field |
| I19 | Hamiltonian path; TSP by bitmask DP | — | LKTH | 1 | **core** (bitmask TSP) · **supporting** (Hamiltonicity) | Held & Karp 1962; also A10's worked hardness example |
| I20 | Max flow: Ford–Fulkerson, Edmonds–Karp, Dinic; max-flow min-cut | PC | LEKWTH | 0 | **core** | Keystone; capstone layer B7. Rule 1 — four of four syllabi or their texts |
| I21 | **Flow modelling**: disjoint paths, path covers, project selection | PC | LEKT | 0 | **core** | Erickson ch. 11; KT ch. 7. The skill, as opposed to the algorithm, and no bank names it |
| I22 | Min-cost max-flow; assignment; Hungarian | C | LK | 0 | **supporting** | Kuhn 1955 |
| I23 | **Bipartite matching**: Kuhn, Hopcroft–Karp; König; stable marriage | C | LKTH | 0 | **core** | CLRS 4e ch. 25 (new); Gale & Shapley 1962 (Nobel-cited); Hopcroft & Karp 1973 |
| I24 | Bipartite checking; graph colouring | — | LKH | 1 | **core** (bipartite) · **supporting** (colouring) | Colouring doubles as an A10 hardness example |
| I25 | Global min cut: Stoer–Wagner, Karger | — | K | 0 | **mentioned** | Karger 1993 is a beautiful randomized result; frontier chapter, linked from A7 |
| I26 | Edge/vertex connectivity; Menger's theorem | — | K | 0 | **mentioned** | Frontier chapter, linked from I21 |

### J. Recursion, enumeration and backtracking

| # | Topic | U | T | B | Decision | Where it lands / reason |
|---|---|---|---|---|---|---|
| J1 | Recursion as induction; write the recurrence before the code | M | LEKWH | 4 | **core** | Erickson ch. 1 is the model |
| J2 | Divide and conquer as a paradigm | MSC | LEKWT | 2 | **core** | — |
| J3 | Generating subsets: recursive and bitmask | — | LH | 5 | **core** | — |
| J4 | Generating permutations; next_permutation; duplicates | — | LH | 5 | **core** | Narayana Pandita, 14th century, for the next-permutation algorithm |
| J5 | Combinations and k-subsets | — | H | 4 | **core** | — |
| J6 | The backtracking template: choose, explore, un-choose | — | EH | 5 | **core** | Keystone. Erickson ch. 2 gives it a chapter; so does this course |
| J7 | Pruning and constraint propagation: n-queens, sudoku | — | EKH | 3 | **core** | — |
| J8 | Iterative deepening; bounded search | — | K | 0 | **supporting** | — |
| J9 | Memoized recursion as the bridge to DP | M | LEH | 4 | **core** | — |

### K. Dynamic programming

TIH ranks DP **Low Priority** and one widely-repeated tier-6 claim says Meta bans DP
questions. MIT 6.006 spends **four consecutive lectures** on it and CS 161, CMU, KT, CLRS and
Erickson all treat it as a named paradigm. Rule 1 governs; see §5 for the disagreement record.

| # | Topic | U | T | B | Decision | Where it lands / reason |
|---|---|---|---|---|---|---|
| K1 | Optimal substructure and overlapping subproblems; when DP is legal | MPSC | LEKWT | 1 | **core** | — |
| K2 | **SRTBOT** as a specification procedure | M | — | 0 | **core** | MIT 6.006, attributed by name. The best DP teaching device in any source |
| K3 | Memoization vs tabulation; the trade | M | LEH | 4 | **core** | — |
| K4 | 1-D DP: Fibonacci, stairs, house robber, decode ways | M | LH | 5 | **core** | — |
| K5 | Coin change: min coins, count ways, and the loop-order subtlety | M | LEH | 5 | **core** | The order subtlety is the whole lesson and the banks skip it |
| K6 | 0/1 and unbounded knapsack; subset sum; partition | M | LEKTH | 5 | **core** | — |
| K7 | **Pseudopolynomial time**: why O(nW) is not polynomial | M | LEKT | 0 | **core** | MIT 6.006 L18. Depends on A2; connects to A10. No bank says this out loud |
| K8 | LIS in O(n²) and O(n log n) | M | LEKH | 3 | **core** | The n log n version is C1 applied inside a DP |
| K9 | LCS, edit distance, the alignment family; Hirschberg's linear space | M | LEKTH | 5 | **core** | Wagner & Fischer 1974; Hirschberg 1975 |
| K10 | Grid DP: unique paths, min path sum, obstacles | M | LH | 5 | **core** | — |
| K11 | Palindromic DP: substrings, subsequences, partitioning | — | H | 5 | **core** | — |
| K12 | Interval DP: matrix chain, burst balloons, optimal BST | M | LEKH | 3 | **core** | Knuth 1971 |
| K13 | Tree DP; rerooting; independent set on a tree | — | EH | 1 | **core** | Rerooting is the technique nobody names; pairs with H3 and H15 |
| K14 | **Bitmask DP** over subsets; TSP; assignment | — | LH | 1 | **core** | — |
| K15 | Digit DP | — | — | 1 | **supporting** | CP-native, genuinely asked in Indian placement rounds (Striver weighting) |
| K16 | Counting DP vs optimizing DP; tilings; broken profile | — | LH | 1 | **core** (counting) · **supporting** (broken profile) | — |
| K17 | DP on probability and expectation; Markov chains | — | LH | 0 | **supporting** | Sits with A7 |
| K18 | Reconstructing the solution, not just the value | M | LEKW | 2 | **core** | The step interviews ask for and tutorials omit |
| K19 | Space optimization: rolling arrays | M | LH | 3 | **core** | — |
| K20 | **DP optimizations**: divide-and-conquer DP, Knuth, convex hull trick, Li Chao | — | H | 0 | **supporting** | Yao 1980 (quadrangle inequality) as the unifying result |
| K21 | Sum over subsets (SOS) DP | — | H | 0 | **mentioned** | Frontier chapter; linked from K14 and M3 |

### L. Greedy

| # | Topic | U | T | B | Decision | Where it lands / reason |
|---|---|---|---|---|---|---|
| L1 | The exchange argument; greedy-stays-ahead | MSC | LEKT | 0 | **core** | Keystone. The proof obligation that separates a greedy from a guess |
| L2 | Interval scheduling and partitioning | MSC | LEKTH | 4 | **core** | MIT 6.006 Fall 2025 opens the course with interval scheduling |
| L3 | Scheduling to minimize lateness; deadlines | C | LKTH | 1 | **core** | — |
| L4 | Fractional knapsack and the exchange it permits | — | LKH | 2 | **core** | Paired with K6 so the contrast is visible |
| L5 | Huffman coding | P | LEKWTH | 1 | **core** | Huffman 1952 |
| L6 | **Matroids**: the structure that makes greedy correct | — | LK | 0 | **supporting** | Edmonds 1971; Whitney 1935. The rung-5 answer to "when is greedy safe?" |
| L7 | Greedy on sorted input: gas station, jump game, candy, partition labels | — | H | 5 | **core** | — |
| L8 | Where greedy fails, and detecting it before you commit | — | EKT | 0 | **core** | Paired with L1; a worked wrong greedy |

### M. Bit manipulation

| # | Topic | U | T | B | Decision | Where it lands / reason |
|---|---|---|---|---|---|---|
| M1 | Two's complement, shifts, masks, sign extension | — | H | 4 | **core** | Striver weights this heavily |
| M2 | Popcount; lowest set bit; clearing it; power-of-two tests | — | H | 4 | **core** | `__builtin_popcount`, `Integer.bitCount`, and the hardware instruction |
| M3 | Sets as bitmasks; **submask enumeration in O(3ⁿ)** | — | H | 2 | **core** | The 3ⁿ argument is a one-line proof most people have never seen |
| M4 | XOR properties; prefix XOR; single and two non-repeating numbers | — | H | 5 | **core** | — |
| M5 | XOR basis over GF(2); maximum XOR subset | — | H | 0 | **supporting** | — |
| M6 | XOR tries for maximum-pair queries | — | — | 2 | **supporting** | Pairs H10 with M4 |
| M7 | Gray code | — | H | 1 | **supporting** | Gray 1953 |
| M8 | Bit tricks in DP and in the standard library | — | H | 1 | **core** | Folded into K14 and M2 |

### N. Range queries and offline techniques

| # | Topic | U | T | B | Decision | Where it lands / reason |
|---|---|---|---|---|---|---|
| N1 | Static prefix sums for immutable arrays | — | H | 4 | **core** | Same row as B5, taught once |
| N2 | **Sparse table**; idempotent RMQ in O(1) | — | H | 0 | **core** | The cleanest instance of precompute-vs-query, and it makes H12 possible |
| N3 | **Fenwick / BIT**; point update, prefix query; 2-D | — | H | 1 | **core** | Fenwick 1994; capstone layer B6 |
| N4 | **Segment tree**: build, query, update over an arbitrary monoid | — | H | 1 | **core** | Keystone; capstone layer B6. Taught over a *monoid*, which is why one implementation answers every variant |
| N5 | **Lazy propagation**; range updates | — | H | 0 | **core** | — |
| N6 | Dynamic, implicit and persistent segment trees | — | H | 0 | **supporting** | — |
| N7 | **Sqrt decomposition** and **Mo's algorithm** | — | H | 0 | **supporting** | Mo's has no canonical paper — see Phase 1 §6; the text will say so |
| N8 | Offline query processing; small-to-large merging | — | H | 0 | **supporting** | — |
| N9 | Treaps and balanced BSTs as sequences; implicit keys | — | — | 1 | **supporting** | — |
| N10 | Ordered-statistics containers: `TreeMap`, `SortedList`, policy trees | — | WH | 3 | **core** | The "Ordered Set" bank pattern; the one place C++ is named because Python and Java lack a direct equivalent |
| N11 | Dynamic connectivity; DSU with rollback | — | — | 0 | **supporting** | Capstone layer B5's second half |

### O. Strings

| # | Topic | U | T | B | Decision | Where it lands / reason |
|---|---|---|---|---|---|---|
| O1 | String representation; immutability; the cost of concatenation | — | W | 4 | **core** | The accidental quadratic Persona C ships |
| O2 | Naive matching and its worst case | P | LKW | 2 | **core** | — |
| O3 | **KMP**: the prefix function as borders and periods | P | LKW | 1 | **core** | Knuth, Morris & Pratt 1977. Taught as *borders*, not as "failure links" |
| O4 | **Z-algorithm** | — | H | 1 | **core** | — |
| O5 | **Rabin–Karp** and rolling hashes | P | LKWH | 1 | **core** | Same row as E5 |
| O6 | Boyer–Moore; bad character and good suffix | P | LKW | 0 | **supporting** | Boyer & Moore 1977; what `grep` actually runs |
| O7 | **Aho–Corasick**: multi-pattern matching | — | K | 0 | **core** | Aho & Corasick 1975; capstone layer B8 |
| O8 | **Manacher's algorithm** | — | — | 0 | **supporting** | Manacher 1975; CP-Algorithms only, promoted because K11 makes it natural |
| O9 | **Suffix arrays** + LCP; suffix automaton; suffix tree | P | LKWH | 0 | **core** (suffix array + LCP) · **supporting** (automaton) · **mentioned** (suffix tree) | COS 226 L-context; CLRS 4e expanded it. Manber & Myers 1990; Kasai 2001 |
| O10 | Anagrams, frequency signatures, grouping | — | — | 5 | **core** | — |
| O11 | Palindrome checking; longest palindromic substring/subsequence | — | H | 5 | **core** | — |
| O12 | Lyndon factorization; minimal rotation | — | — | 0 | **mentioned** | Duval 1983; frontier chapter |
| O13 | Regular expressions as NFA simulation; catastrophic backtracking | P | W | 2 | **supporting** | Sedgewick 5.4; Thompson 1968. ReDoS is a real production failure |
| O14 | Word break, word ladder, dictionary search with tries | — | — | 5 | **core** | — |
| O15 | Data compression: RLE, Huffman, LZW | P | WH | 0 | **supporting** | Sedgewick 5.5; Huffman shared with L5 |

### P. Mathematics for algorithms

| # | Topic | U | T | B | Decision | Where it lands / reason |
|---|---|---|---|---|---|---|
| P1 | Integer overflow, floating point, safe comparison | — | H | 3 | **core** | Shared with C1's overflow bug and O7 |
| P2 | GCD/LCM; Euclid; extended Euclid; Bézout | — | LH | 3 | **core** | Euclid, *Elements* VII — the oldest algorithm in the course |
| P3 | Primes: trial division, sieve, linear sieve, segmented sieve | — | LH | 3 | **core** | Eratosthenes, c. 240 BCE |
| P4 | Factorization; divisor counts and sums; Euler's totient | — | LH | 1 | **supporting** | — |
| P5 | Modular arithmetic; inverses; Fermat/Euler; CRT | — | LH | 1 | **core** (inverses, mod arithmetic) · **supporting** (CRT) | The `10⁹+7` every contest uses and few readers can justify |
| P6 | **Binary exponentiation**; matrix exponentiation for recurrences | — | LH | 2 | **core** | — |
| P7 | Combinatorics: nCr, Pascal, Catalan, stars and bars, inclusion–exclusion | — | LH | 1 | **core** | — |
| P8 | Burnside and Pólya counting | — | H | 0 | **mentioned** | Burnside 1897 / Frobenius; frontier chapter |
| P9 | Probability and expectation in analysis; linearity | PSC | LTH | 0 | **core** | Shared with A7 |
| P10 | **Game theory**: impartial games, Nim, **Sprague–Grundy** | — | H | 0 | **supporting** | Bouton 1901; Sprague 1935 / Grundy 1939. Asked in senior CP-flavoured rounds; rule 5 keeps it in |
| P11 | Matrices; Gaussian elimination; rank; determinant | — | LH | 0 | **supporting** | CLRS ch. 28 |
| P12 | **FFT/NTT** and convolution | C | LH | 0 | **supporting** | Cooley & Tukey 1965. CMU names it; rule 1 |
| P13 | Linear programming and duality | C | LT | 0 | **supporting** | CLRS 4e ch. 29 (simplex detail removed); CMU. Taught as modelling plus duality, not as simplex |
| P14 | Numerical search: ternary, Newton, binary search on reals | — | H | 1 | **supporting** | Shared with C5 |

### Q. Geometry

| # | Topic | U | T | B | Decision | Where it lands / reason |
|---|---|---|---|---|---|---|
| Q1 | Points, vectors, cross product, the orientation test | P | LKH | 2 | **core** | TIH lists Geometry; CLRS ch. 33; COS 226 L13 |
| Q2 | Segment intersection and the robustness problem | P | LKH | 1 | **core** | Exact integer arithmetic vs floating point is the lesson |
| Q3 | Polygon area; point in polygon; convexity | — | LKH | 0 | **supporting** | Shoelace; ray casting |
| Q4 | **Convex hull**: monotone chain, Graham scan | — | LKH | 0 | **core** | Graham 1972; Andrew 1979 |
| Q5 | Closest pair by divide and conquer | — | LKTH | 0 | **core** | Shamos & Hoey 1975; the classic D&C beyond mergesort |
| Q6 | Sweep line for intersections and rectangle union | P | LKH | 0 | **supporting** | Bentley & Ottmann 1979; shared with B10 and N4 |
| Q7 | Manhattan/Chebyshev distance; the 45° rotation | — | H | 1 | **supporting** | — |
| Q8 | Convex hull trick / Li Chao tree | — | H | 0 | **supporting** | Shared with K20 |
| Q9 | Delaunay triangulation, Voronoi, half-plane intersection | — | K | 0 | **mentioned** | Frontier chapter |

### R. Design and systems-flavoured interview topics

| # | Topic | U | T | B | Decision | Where it lands / reason |
|---|---|---|---|---|---|---|
| R1 | LRU / LFU cache design | — | L | 5 | **core** | Same row as G6 and A12 |
| R2 | Design problems: median from a stream, hit counter, rate limiter, feed | — | — | 5 | **core** | Bank-native and universally asked. The §6.3 practitioner-handbook chapter |
| R3 | Iterator design: BST iterator, nested list, peeking | — | — | 4 | **supporting** | Depends on F7 and H1 |
| R4 | Randomized structures: O(1) insert/delete/getRandom; reservoir sampling; shuffle | P | K | 4 | **core** | Vitter 1985; Fisher–Yates 1938 / Durstenfeld 1964, with the biased-shuffle bug as a callout |
| R5 | Concurrency-flavoured problems: bounded buffer, print in order, philosophers | — | L | 1 | **out** | → **CS Fundamentals 02, Operating Systems.** Orientation paragraph and forward pointer in the A2 chapter, per guide §2 |
| R6 | Event-driven simulation | P | W | 0 | **mentioned** | Sedgewick 6.1; an H7 application, one paragraph |

### S. Rows added at Phase 2 by the newly merged sources

| # | Topic | U | T | B | Decision | Where it lands / reason |
|---|---|---|---|---|---|---|
| S1 | Cache behaviour and constant factors: why arrays beat lists at equal O | — | K | 0 | **core** | In no source as a topic. The answer to A3 and the reason D7 exists |
| S2 | Language cost contracts: Python and Java container complexities | — | — | 3 | **core** | Outcome O6. TIH's cheatsheet is the closest published source and it is a table, not a mechanism |
| S3 | Language traps: recursion limits, overflow, autoboxing, `==` on boxed ints | — | — | 1 | **core** | Outcome O7; costs real interview rounds |
| S4 | Testing algorithms: brute-force oracles, fuzzing, shrinking counterexamples | — | — | 0 | **core** | Outcome O4; the method every capstone layer uses |
| S5 | Honest benchmarking: warmup, repetition, JIT, stating conditions | — | — | 0 | **core** | Outcome O5; capstone layer B9 |
| S6 | The interview as a protocol: invariant, cost, edges, then code | — | — | 2 | **core** | Outcome O8; the practitioner-handbook chapter |
| S7 | **The recognition procedure itself**: cues, candidates, confirming test | — | — | 1 | **core** | Outcomes O1 and A8. Sean Prashad's rule table is the seed; the course's version resolves ties and covers every pattern it teaches |
| S8 | The case against patterns, and this course's answer | — | — | 0 | **core** | Outcome E21; guide §3.5 requires teaching the debate |

---

## 4. Decision summary

| Decision | Rows | Share |
|---|---|---|
| **core** | 155 | 69% |
| **supporting** | 56 | 25% |
| **mentioned** | 12 | 5% |
| **out** | 1 | 0.4% |
| **Total** | **224** | |

Counted mechanically from §3, not estimated. Rows carrying a split decision (I19, K16, O9,
P5, H13, I24) are counted at their highest level, which is why O9 appears in both the core
tally and the mentioned list below. Per group: A 18 · B 14 · C 8 · D 10 · E 9 · F 7 · G 7 ·
H 16 · I 26 · J 9 · K 21 · L 8 · M 8 · N 11 · O 15 · P 14 · Q 9 · R 6 · S 8.

The universe grew from Phase 0's ~160 rows to 224. The Sedgewick, Kleinberg-Tardos and
job-description merges added strings-as-sorting, regular expressions, compression, reductions,
PSPACE, local search and linear programming; group S added the eight rows that no source
carries as a topic but that three of the Charter's outcome groups require; and several Phase 0
rows split once a decision had to be made at the granularity of a chapter.

**The core share is high — 69% — and that is a deliberate consequence of the owner's bar, not
an accident.** A course that must replace every other course cannot mark two thirds of the
subject "supporting". The cost is the chapter budget, which is why Phase 1 approved ~45-55
chapters rather than §2's 24-36; Phase 3 has to make 155 core rows fit, and will do it by
grouping rows into chapters rather than by demoting them.

## 5. The complete "out" list

Two rows. Rule 5 is why it is not longer.

| Row | Topic | Receiving course | Orientation + forward pointer lives in |
|---|---|---|---|
| R5 | Concurrency-flavoured interview problems; threads, locks, lock-free structures; CLRS 4e ch. 26 parallel algorithms; the banks' "Multi-threaded" pattern | **CS Fundamentals 02, Operating Systems** (`COURSE_PLAN.md`, created at Phase 1) | The A2 chapter, where the word-RAM one-operation-at-a-time model is defined — the honest place to say the model is a choice and that a parallel model changes which algorithm wins |
| H6′ | B-trees **as a storage engine**: page layout, fill factor, buffer pool, disk access patterns | **Databases in Depth** (Database track 01, live) | The H6 chapter, which teaches the B-tree mechanism and the fanout argument in full and then points forward |

Two further rows were considered for "out" and kept, with the reasoning recorded so the owner
can overrule:

- **CLRS 4e's machine-learning chapter.** Genuinely belongs to the AI Engineering track and is
  not a DSA topic. It is not listed as "out" because it never entered the universe as a row —
  no syllabus, bank or other textbook carries it as an algorithms topic.
- **CSES's "Interactive Problems" category.** A contest *format*, not an algorithm. Recorded
  as **mentioned** in the frontier chapter rather than out, because the underlying technique
  (binary search against an adaptive adversary) is real and is a genuine interview question in
  its "guess the number" form.

---

## 6. The frontier chapter: how "mentioned" is honoured

Twelve rows are **mentioned** (A15, A16, A17, D8, E9, I25, I26, K21, O9's suffix-tree half, O12, P8, Q9, R6). Guide §4 defines that as "named with a pointer, one
paragraph" — and a dozen orphaned paragraphs scattered across fifty chapters is how a course
loses them. **Proposal:** they are collected into one closing field-guide chapter, *The
Frontier*, structured as a map rather than a list: for each, the problem it solves, its
origin, the row in this course it extends, and where to read it. That satisfies §2's
requirement of at least two engineering-reality/field-guide chapters, it gives the owner's
"nothing missed" bar a single verifiable page, and it is the honest place to say that a
course has an edge.

Contents: A15 PSPACE · A16 local search and metaheuristics · D8 external-memory and
cache-oblivious models · E9 cuckoo and perfect hashing · I25 Karger and Stoer–Wagner ·
I26 connectivity and Menger · K21 SOS DP · O12 Lyndon factorization · O9′ suffix trees ·
P8 Burnside and Pólya · Q9 Delaunay, Voronoi, half-plane intersection · R6 event-driven
simulation · CSES interactive problems · and the CP-Algorithms residue named in Phase 0 §1
(Montgomery multiplication, Garner, discrete root, Sqrt Tree, D'Esopo-Pape, MPM, Kirchhoff,
Prüfer, Stern–Brocot, the 15-puzzle).

---

## 7. Where the sources disagree, recorded per §3.5

| Disagreement | Positions | Decision and why |
|---|---|---|
| **How important is dynamic programming?** | Tech Interview Handbook ranks DP **Low Priority**. A widely-repeated tier-6 claim states Meta bans DP questions. MIT 6.006 gives it **four consecutive lectures**; CS 161, CMU, CLRS, Erickson and KT all treat it as a named paradigm | **Core, at full depth.** Rule 1 is decisive: it is examined. The Meta claim is an unverified blog assertion about one company's current policy and will not appear in the text as fact. Where the course discusses interview reality it will say that emphasis varies by company, without naming a policy it cannot verify |
| **Where do two pointers, monotonic stack and sliding-window minimum belong?** | Every interview bank files them as array patterns. Laaksonen files all three under **amortized analysis** (ch. 8) | **Laaksonen.** They are one result, not three tricks, and the amortized framing is what makes them transfer. This is the single most consequential ordering decision in the matrix |
| **Is Skiena's catalogue or CP-Algorithms the completeness reference?** | Skiena catalogues **75 problems** (problem→technique). CP-Algorithms catalogues ~200 **algorithms** (technique→implementation) | **Both, for different jobs.** CP-Algorithms is the completeness check for §3's rows; Skiena's direction of lookup is the model for the field-guide chapter, because a learner with a problem cannot search a technique index |
| **CLRS 4e chapter numbering** | Chapters 25–29 verified; 1–24 and 30–35 unverified (Phase 0 open item O1) | Unchanged: **the course cites CLRS by topic, never by number**, until verified. No row in §3 depends on a CLRS chapter number |
| **Mo's algorithm attribution** | No canonical paper; competitive-programming folklore | Row N7 keeps it as **supporting** and the text will say plainly that the technique is folklore without a single origin. No invented citation (Phase 1 §6) |
| **Striver vs NeetCode weighting** | Striver weights binary-search-on-answer, bit manipulation, pure recursion and advanced strings far higher; NeetCode and Blind 75 omit KMP/Z entirely | **Striver, on the contested rows**, because the Charter's approved persona weighting is B 45% / A 30% / C 25% and both B and A skew toward the Indian placement market. C3, M1 and O3/O4 are core partly for this reason |

---

## 8. What this matrix commits the course to that no bank does

Recorded so Phase 3 cannot quietly drop it, and so the landing copy has something true to say.

**Sixty-seven rows are core or supporting with zero coverage in any of the five interview
banks** — 31 core, 36 supporting. That is 30% of the universe, and it is the honest measure of
the gap between this course and a practice sheet.

The 31 **core** rows no bank covers at all:

> A2 word-RAM model · A3 recurrences · **A5 amortized analysis** · **A6 lower bounds** ·
> A7 randomized algorithms · A10 NP-hardness · A18 the ADT cost contract ·
> **D7 what the standard libraries actually run** · E3 load factor and the rehash stall ·
> **E7 adversarial hash inputs** · H5 balanced BSTs · H6 B-trees · **H15 Euler-tour
> flattening** · **I20 max-flow/min-cut** · **I21 flow modelling** · I23 bipartite matching ·
> **K2 SRTBOT** · **K7 pseudopolynomial time** · **L1 the exchange argument** · L8 detecting a
> wrong greedy · N2 sparse table · N5 lazy propagation · O7 Aho-Corasick · O9 suffix arrays ·
> P9 probability in analysis · Q4 convex hull · Q5 closest pair · S1 cache behaviour ·
> S4 testing algorithms · S5 honest benchmarking · S8 the case against patterns

Four of these are the course's sharpest claims, because they are not merely uncovered but
*mis-taught* elsewhere: A5 (the banks teach three tricks where there is one theorem), D7
(every bank says "sorting is O(n log n)" and stops), K7 (everyone calls knapsack polynomial),
and I21 (flow is taught as an algorithm when the examinable skill is the modelling step).

## 9. Self-check against §4 Phase 2

- [x] Topic Universe merged from four named university syllabi, six named textbooks, two job-description/priority lists, five interview banks, and four real-system source references — each minimum met or exceeded (§1).
- [x] Every row carries a decision: core / supporting / mentioned / out (§3), 191 rows.
- [x] Every "out" carries its reason and a receiving course that exists in `COURSE_PLAN.md`, plus the location of its §2-mandated orientation paragraph (§5).
- [x] No row examined by a university syllabus is out; no row a senior interview expects is out (rules 1 and 2, applied row by row).
- [x] History is not out: every core and supporting row names its origin, collected in Phase 1 §6's reading list and extended here (Euclid, Eratosthenes, Narayana Pandita, Euler 1736, Gray 1953, Thompson 1968, Fisher–Yates, Durstenfeld 1964, Burnside/Frobenius, Whitney 1935 are added by this phase).
- [x] Source disagreements surfaced rather than silently resolved (§7).

**Gate:** owner approves the decision column — in particular the two "out" rows (§5), the
frontier-chapter mechanism for the sixteen "mentioned" rows (§6), and the amortized-analysis
reframing of the three headline array patterns (§7, row 2).
Next: **Phase 3 — the Course Blueprint**: parts, chapters, sections, machine specs, the
capstone plan, the three free chapters, the reading map, and the coverage check with the
orphan list printed empty.
