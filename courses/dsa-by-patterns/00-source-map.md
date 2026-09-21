# DSA By Patterns — Phase 0 Deliverable: Source Map

**Status:** Phase 0 complete, awaiting owner gate.
**Date:** 2026-09-20.
**Guide version applied:** COURSE_CREATION_GUIDE.md v1.1 (2026-09-03), including §3.6 (thin/absent books) and §3.7 (tool choice).

---

## 0. Owner note: this course has no provided books, by instruction

The owner supplied no PDFs or EPUBs. §3.6 governs: **the books that do not exist define no
minimum, so the minimum is set by the rest of the hierarchy.** Every source below is tier 2
(primary literature), tier 3 (official documentation and reference implementations), tier 4
(published university course material), tier 5 (reference works and engineering writing) or
tier 6 (interview banks, used per §3.1 only to find gaps, never as a source of facts).

Three consequences the owner should weigh at this gate:

1. **The whole course rests on primary literature and open reference works.** There is no
   book spine to fall back on. §3.6 requires the Charter and Blueprint to say so; they will.
   In practice this is less risky here than it was for RAG In Depth, because algorithms is
   the best-documented subject in computing: every mechanism this course teaches has a
   named paper, a textbook treatment, and at least one reference implementation in a
   language standard library.

2. **Tier 6 carries unusual weight in this course, and must not carry facts.** The owner's
   brief — "search the top questions from every DSA pattern and compile it" — makes the
   interview banks a *structural* input, not just a gap-finder. The Source Map therefore
   treats them as a **taxonomy corpus**: they decide what a "pattern" is and which problems
   exemplify it, and nothing else. Every complexity bound, invariant, origin and number in
   the course text comes from tiers 2–4. §3 below reconciles the taxonomies against each
   other; §5 lists what all of them omit.

3. **The pattern taxonomies disagree with the textbooks about what the subject *is*.**
   The banks organize by *recognition cue* (what the problem looks like). The textbooks
   organize by *design paradigm* (divide and conquer, greedy, dynamic programming) and by
   *structure* (trees, graphs, flows). Neither ordering alone produces the course the owner
   asked for. §2's merged universe is keyed on the textbook/paper topic, with the pattern
   name recorded as an attribute — so Phase 2's Gap Matrix can prove no topic is orphaned
   even when no bank has a name for it. This is the single most important structural
   decision in this deliverable and the owner should approve or reject it explicitly.

**Inherited decisions from the pre-Phase-0 brief** (owner-answered 2026-09-20, carried into
every downstream phase until changed):

| Decision | Value |
|---|---|
| Capstone (§9) | Build the structures library: the real implementations the course taught, each layer fuzzed against the language's own stdlib as reference |
| Capstone languages | **Python + Java** |
| Chapter budget | Deviate above §2's 24–36 range; target ~45–55, justified in the Blueprint |
| Track position | Opens a **third track, CS Fundamentals**, as course 01; `COURSE_PLAN.md` to be amended at Phase 1 |

---

## 1. Per-source tables (§3.2 granularity)

Fourteen sources, read at the granularity noted. "Read" for a reference catalogue such as
CP-Algorithms or CSES means the complete index was enumerated and every entry classified;
the per-article prose is read in Phase 4 for the chapters that need it, per §4 Phase 4.

| # | Source | Kind | Tier | Completeness of this reading |
|---|---|---|---|---|
| S1 | **CP-Algorithms** (cp-algorithms.com), the maintained English successor to e-maxx.ru | Open algorithm catalogue + implementations | 3 | Complete index enumerated, 2026-09-20 |
| S2 | **CSES Problem Set** (cses.fi/problemset), Antti Laaksonen | Curated problem corpus with canonical categories | 4 | Complete: 19 categories, ~430 problems, all names enumerated |
| S3 | **Competitive Programmer's Handbook**, Antti Laaksonen (draft 2018-07-03) | Open textbook | 5 | Complete TOC: 3 parts, 30 chapters, all section titles + page numbers extracted from the PDF |
| S4 | **Algorithms**, Jeff Erickson (2019, free) | Open textbook | 5 | Complete TOC: chapters 0–12 |
| S5 | **Introduction to Algorithms** (CLRS), 4th ed. 2022 | Textbook | 5 | Structure verified for chapters 25–29 and for the full 3rd-edition part/chapter scheme; 4e numbering of chapters 1–24 and 30–35 **not yet verified** (see §6 open item O1) |
| S6 | **The Algorithm Design Manual**, Skiena, 3rd ed. 2020 | Textbook | 5 | Two-part structure and the 75-problem catalogue confirmed; per-chapter TOC **not yet verified** (open item O2) |
| S7 | **MIT 6.006 Introduction to Algorithms**, Spring 2020 (OCW) | University syllabus | 4 | Complete: 21 lectures enumerated |
| S8 | **Princeton COS 226**, Spring 2024 | University syllabus | 4 | Complete: 24 lectures enumerated |
| S9 | **Stanford CS 161** | University syllabus | 4 | Topic list only (the archive pages publish topics, not a lecture-by-lecture schedule) |
| S10 | **CMU 15-451/651 Algorithm Design and Analysis** | University syllabus | 4 | Topic list only; the Fall 2026 calendar is behind CMU auth |
| S11 | **Grokking the Coding Interview Patterns** (designgurus / grokkingthecodinginterview.com) | Interview bank taxonomy | 6 | Complete published pattern list enumerated |
| S12 | **NeetCode 150 / NeetCode roadmap** | Interview bank taxonomy | 6 | 18 categories enumerated; problem lists partially enumerated from two mirrors |
| S13 | **Tech Interview Handbook** (Yangshun Tay) | Interview bank taxonomy + curated 75 | 6 | Complete: 4-week topic grouping + all 75 problems by week |
| S14 | **Sean Prashad's LeetCode Patterns** | Interview bank *recognition heuristics* | 6 | Complete: 5 categories, ~22 cue→technique rules |
| S15 | **Striver's A2Z DSA Sheet** (takeuforward.org) | Interview bank taxonomy | 6 | Module list enumerated; sources disagree on counts (see below) |

---

### S1 — CP-Algorithms: the algorithm universe

This is the single most valuable source in the map. It is the closest thing the field has to
a complete, maintained, open catalogue of *implementable* algorithms, and it is the spine
against which §5's gap list is computed. Its eight top-level sections and their contents:

| Section | Subsection | Entries |
|---|---|---|
| **Algebra** | Fundamentals | Binary Exponentiation; Euclidean algorithm for GCD; Extended Euclidean; Linear Diophantine Equations; Fibonacci Numbers |
| | Prime numbers | Sieve of Eratosthenes; Linear Sieve; Primality tests; Integer factorization |
| | Number-theoretic functions | Euler's totient; Number/sum of divisors |
| | Modular arithmetic | Modular Inverse; Linear Congruence; Chinese Remainder Theorem; Garner's Algorithm; Factorial modulo p; Discrete Log; Primitive Root; Discrete Root; Montgomery Multiplication |
| | Number systems | Balanced Ternary; Gray code |
| | Miscellaneous | Bit manipulation; Enumerating submasks; Arbitrary-Precision Arithmetic; Fast Fourier transform; Operations on polynomials and series; Continued fractions; Factoring Exponentiation |
| **Data Structures** | Fundamentals | Minimum Stack / Minimum Queue; Sparse Table |
| | Trees | Disjoint Set Union; Fenwick Tree; Sqrt Decomposition; Segment Tree; Treap; Sqrt Tree; Randomized Heap |
| | Advanced | Deleting from a data structure in O(T(n) log n) |
| **Dynamic Programming** | — | Introduction to DP; Knapsack Problem; Longest increasing subsequence; Divide and Conquer DP; Knuth's Optimization; DP on Broken Profile ("Parquet"); Finding the largest zero submatrix |
| **String Processing** | Fundamentals | String Hashing; Rabin-Karp; Prefix function (Knuth-Morris-Pratt); Z-function; Suffix Array; Aho-Corasick |
| | Advanced | Suffix Tree; Suffix Automaton; Lyndon factorization |
| | Tasks | Expression parsing; Manacher's Algorithm; Finding repetitions |
| **Linear Algebra** | Matrices | Gauss & System of Linear Equations; Gauss & Determinant; Kraut & Determinant; Rank of a matrix |
| **Combinatorics** | Fundamentals | Finding Power of Factorial Divisor; Binomial Coefficients; Catalan Numbers |
| | Techniques | Inclusion-Exclusion; Burnside's lemma / Pólya enumeration; Stars and bars; Generating all K-combinations |
| | Tasks | Placing Bishops on a Chessboard; Balanced bracket sequences; Counting labeled graphs |
| **Numerical Methods** | Search | Binary Search; Ternary Search; Newton's method; Simulated Annealing |
| | Integration | Simpson's formula |
| **Geometry** | Elementary | Basic Geometry; Line equation for a segment; Intersection Point of Lines; Check if two segments intersect; Intersection of Segments; Circle-Line Intersection; Circle-Circle Intersection; Common tangents to two circles; Length of the union of segments |
| | Polygons | Oriented area of a triangle; Area of simple polygon; Point in convex polygon in O(log N); Minkowski sum; Pick's Theorem; Lattice points of non-lattice polygon |
| | Convex hull | Convex hull construction; Convex hull trick and Li Chao tree |
| | Sweep-line | Search for a pair of intersecting segments |
| | Planar graphs | Finding faces of a planar graph; Point location in O(log N) |
| | Miscellaneous | Nearest pair of points; Delaunay triangulation and Voronoi diagram; Vertical decomposition; Half-plane intersection (S&I, O(N log N)); Manhattan Distance; Minimum Enclosing Circle |
| **Graphs** | Traversal | Breadth First Search; Depth First Search |
| | Components/bridges/articulation | Connected Components; Bridges in O(N+M); Bridges Online; Articulation Points in O(N+M); Strongly Connected Components and Condensation Graph; Strong Orientation |
| | Single-source shortest paths | Dijkstra; Dijkstra on sparse graphs; Bellman-Ford; 0-1 BFS; D'Esopo-Pape |
| | All-pairs shortest paths | Floyd-Warshall; Number of paths of fixed length / Shortest paths of fixed length |
| | Spanning trees | Prim; Kruskal; Kruskal with DSU; Second best MST (Kruskal + LCA); Kirchhoff Theorem; Prüfer code |
| | Cycles | Acyclicity check and cycle finding in O(M); Negative Cycle; Eulerian Path |
| | Lowest common ancestor | LCA; LCA - Binary Lifting; LCA - Farach-Colton and Bender; Solve RMQ by finding LCA; LCA - Tarjan's off-line |
| | Flows | Ford-Fulkerson and Edmonds-Karp; Push-relabel; Push-relabel improved; Dinic; MPM; Flows with demands; Minimum-cost flow; Assignment problem; Minimum cut - Stoer-Wagner |
| | Matchings | Bipartite Graph Check; Kuhn's Algorithm; Hungarian Algorithm |
| | Miscellaneous | Topological Sorting; Edge/Vertex connectivity; Tree painting; **2-SAT**; **Heavy-light decomposition**; **Centroid decomposition** |
| **Miscellaneous** | Sequences | RMQ; Maximum/minimum sum subsegment; K-th order statistic in O(N); MEX |
| | Game Theory | Games on arbitrary graphs; Sprague-Grundy theorem / Nim |
| | Schedules | Scheduling jobs on one machine; on two machines; Optimal schedule given deadlines and durations |
| | Miscellaneous | Tortoise and Hare (cycle detection); Josephus problem; 15 Puzzle solvability; Stern-Brocot Tree and Farey Sequences |

**What S1 gives the course:** the completeness check. Any algorithm in S1 that does not appear
in the Gap Matrix with a decision is a hole. **What S1 does not give:** pedagogy, motivation,
failure modes, or interview framing. Its articles are terse reference, and several assume the
reader already knows why the structure exists. Nothing from S1 is a teaching model.

**S1 entries that no interview bank names at all** (candidate "out" or "mentioned" rows for
Phase 2, listed here so the decision is deliberate): Montgomery Multiplication, Garner's
Algorithm, Discrete Root, Balanced Ternary, Sqrt Tree, Randomized Heap, D'Esopo-Pape, MPM
flow, Stoer-Wagner, Kirchhoff, Prüfer code, Tree painting, Delaunay/Voronoi, Half-plane
intersection, Vertical decomposition, Simulated Annealing, Simpson integration, Kraut
determinant, Stern-Brocot, 15 Puzzle.

---

### S2 — CSES Problem Set: the problem universe with canonical categories

CSES is the cleanest available mapping from *category* to *problem*, written by the author of
S3, and it is the model for how this course should structure its own practice sets. Nineteen
categories; counts as published on the index page.

| Category | Count | Representative problems (verbatim) |
|---|---|---|
| Introductory Problems | 27 | Weird Algorithm; Missing Number; Repetitions; Increasing Array; Permutations; Number Spiral; Two Knights; Two Sets; Bit Strings; Trailing Zeros; Coin Piles; Palindrome Reorder; Gray Code; Tower of Hanoi; Creating Strings; Apple Division; Chessboard and Queens; Digit Queries; Grid Paths |
| Sorting and Searching | 42 | Distinct Numbers; Apartments; Ferris Wheel; Concert Tickets; Restaurant Customers; Movie Festival; Sum of Two Values; Maximum Subarray Sum; Stick Lengths; Missing Coin Sum; Collecting Numbers I/II; Playlist; Towers; Traffic Lights; Josephus Problem I/II; Nested Ranges Check/Count; Room Allocation; Factory Machines; Tasks and Deadlines; Reading Books; Sum of Three Values; Sum of Four Values; Nearest Smaller Values; Subarray Sums I/II; Subarray Divisibility; Array Division; Movie Festival II; Maximum Subarray Sum II |
| Dynamic Programming | 26 | Dice Combinations; Minimizing Coins; Coin Combinations I/II; Removing Digits; Grid Paths I; Book Shop; Array Description; Counting Towers; Edit Distance; Longest Common Subsequence; Rectangle Cutting; Money Sums; Removal Game; Two Sets II; Increasing Subsequence; Projects; Elevator Rides; Counting Tilings; Counting Numbers |
| Graph Algorithms | 48 | Counting Rooms; Labyrinth; Building Roads; Message Route; Building Teams; Round Trip; Monsters; Shortest Routes I/II; High Score; Flight Discount; Cycle Finding; Flight Routes; Round Trip II; Course Schedule; Longest Flight Route; Game Routes; Investigation; Planets Queries I/II; Planets Cycles; Road Reparation; Road Construction; Flight Routes Check; Planets and Kingdoms; Giant Pizza; Coin Collector; Mail Delivery; De Bruijn Sequence; Teleporters Path; Hamiltonian Flights; Knight's Tour; Download Speed; Police Chase; School Dance; Distinct Routes |
| Range Queries | 27 | Static Range Sum/Minimum Queries; Dynamic Range Sum/Minimum Queries; Range Xor Queries; Range Update Queries; Forest Queries I/II; Hotel Queries; List Removals; Salary Queries; Prefix Sum Queries; Pizzeria Queries; Visible Buildings Queries; Subarray Sum Queries I/II; Distinct Values Queries I/II; Increasing Array Queries; Movie Festival Queries; Range Updates and Sums; Polynomial Queries; Range Queries and Copies |
| Tree Algorithms | 16 | Subordinates; Tree Matching; Tree Diameter; Tree Distances I/II; Company Queries I/II; Distance Queries; Counting Paths; Subtree Queries; Path Queries I/II; Distinct Colors; Finding a Centroid; Fixed-Length Paths I/II |
| Mathematics | 32 | Josephus Queries; Exponentiation I/II; Counting Divisors; Common Divisors; Sum of Divisors; Divisor Analysis; Prime Multiples; Counting Coprime Pairs; Next Prime; Binomial Coefficients; Distributing Apples; Christmas Party; Permutation Order/Rounds; Bracket Sequences I/II; Counting Necklaces; Counting Grids; Fibonacci Numbers; Throwing Dice; Graph Paths I/II; System of Linear Equations; Dice Probability; Candy Lottery; Inversion Probability; Stick Game; Nim Game I/II; Stair Game; Grundy's Game |
| String Algorithms | 21 | Word Combinations; String Matching; Finding Borders; Finding Periods; Minimal Rotation; Longest Palindrome; All Palindromes; Required Substring; Palindrome Queries; Finding/Counting Patterns; Pattern Positions; Distinct Substrings; Distinct Subsequences; Repeating Substring; String Functions; Inverse Suffix Array; Substring Order I/II; Substring Distribution |
| Geometry | 16 | Point Location Test; Line Segment Intersection; Polygon Area; Point in Polygon; Polygon Lattice Points; Minimum Euclidean Distance; Convex Hull; Maximum/All Manhattan Distances; Intersection Points; Lines and Queries I/II; Area of Rectangles; Robot Path |
| Advanced Techniques | 28 | **Meet in the Middle**; Hamming Distance; Reachable Nodes; Reachability Queries; Cut and Paste; Substring Reversals; Reversals and Sums; Necessary Roads; Necessary Cities; Eulerian Subgraphs; Monster Game I/II; Subarray Squares; Houses and Schools; **Knuth Division**; Apples and Bananas; One Bit Positions; Signal Processing; New Roads Queries; **Dynamic Connectivity**; Parcel Delivery; Task Assignment |
| Sliding Window Problems | 11 | Sliding Window Sum/Minimum/Xor/Or/Distinct Values/Mode/Mex/Median/Cost/Inversions/Advertisement |
| Interactive Problems | 6 | Hidden Integer; Hidden Permutation; K-th Highest Score; Permuted Binary Strings; Colored Chairs; Inversion Sorting |
| Bitwise Operations | 11 | Counting Bits; Maximum Xor Subarray; Maximum Xor Subset; Number of Subset Xors; K Subset Xors; All Subarray Xors; Xor Pyramid Peak/Diagonal/Row; **SOS Bit Problem**; And Subset Count |
| Construction Problems | 8 | Inverse Inversions; Monotone Subsequences; Third Permutation; Permutation Prime Sums; Chess Tournament; Distinct Sums Grid; Filling Trominos; Grid Path Construction |
| Advanced Graph Problems | 28 | Nearest Shops; Prüfer Code; Tree Traversals; Course Schedule II; Acyclic Graph Edges; Strongly Connected Edges; Graph Girth; Fixed Length Walk Queries; MST Edge Check/Set Check/Cost; Network Breakdown; Tree Isomorphism I/II; Critical Cities; Graph Coloring; Split into Two Paths; Network Renovation; Forbidden Cities; New Flight Routes |
| Counting Problems | 18 | Filled/All Letter/Border Subgrid Count I & II; Empty String; Permutation Inversions; Counting Bishops; Counting Sequences; Grid Paths II; Counting Permutations; Grid Completion; Counting Reorders; Tournament Graph Distribution; Functional Graph Distribution |
| Additional Problems I | 28 | (mixed; used only as a difficulty reservoir) |
| Additional Problems II | 30 | (mixed) |
| General | 2 | (site meta, not problems) |

**What S2 gives the course:** proof that a category taxonomy can be exhaustive, plus a
difficulty-graded exercise reservoir for the "Trace" and "Build" exercises of §8.3.
**Caution:** CSES problems are ICPC/IOI-shaped (stdin/stdout, tight limits), not
interview-shaped. Exercises drawn from here must be re-framed, and per §3.4 the problem
statements are never reproduced — only referenced by name.

---

### S3 — Competitive Programmer's Handbook (Laaksonen, draft 2018-07-03)

Extracted directly from the PDF at cses.fi/book/book.pdf. Three parts, 30 chapters. Page
numbers are the draft's own and are recorded because they show relative weight.

| Part | Ch | Title (p.) | Sections |
|---|---|---|---|
| **I Basic techniques** | 1 | Introduction (3) | Programming languages; Input and output; Working with numbers; Shortening code; Mathematics; Contests and resources |
| | 2 | Time complexity (17) | Calculation rules; Complexity classes; Estimating efficiency; Maximum subarray sum |
| | 3 | Sorting (25) | Sorting theory; Sorting in C++; **Binary search** |
| | 4 | Data structures (35) | Dynamic arrays; Set structures; Map structures; Iterators and ranges; Other structures; Comparison to sorting |
| | 5 | Complete search (47) | Generating subsets; Generating permutations; Backtracking; Pruning the search; **Meet in the middle** |
| | 6 | Greedy algorithms (57) | Coin problem; Scheduling; Tasks and deadlines; Minimizing sums; Data compression |
| | 7 | Dynamic programming (65) | Coin problem; Longest increasing subsequence; Paths in a grid; Knapsack problems; Edit distance; Counting tilings |
| | 8 | Amortized analysis (77) | **Two pointers method**; **Nearest smaller elements**; **Sliding window minimum** |
| | 9 | Range queries (83) | Static array queries; Binary indexed tree; Segment tree; Additional techniques |
| | 10 | Bit manipulation (95) | Bit representation; Bit operations; Representing sets; Bit optimizations; Dynamic programming |
| **II Graph algorithms** | 11 | Basics of graphs (109) | Graph terminology; Graph representation |
| | 12 | Graph traversal (117) | Depth-first search; Breadth-first search; Applications |
| | 13 | Shortest paths (123) | Bellman–Ford; Dijkstra; Floyd–Warshall |
| | 14 | Tree algorithms (133) | Tree traversal; Diameter; All longest paths; Binary trees |
| | 15 | Spanning trees (141) | Kruskal; Union-find structure; Prim |
| | 16 | Directed graphs (149) | Topological sorting; Dynamic programming; Successor paths; Cycle detection |
| | 17 | Strong connectivity (157) | Kosaraju; 2SAT problem |
| | 18 | Tree queries (163) | Finding ancestors; Subtrees and paths; Lowest common ancestor; Offline algorithms |
| | 19 | Paths and circuits (173) | Eulerian paths; Hamiltonian paths; De Bruijn sequences; Knight's tours |
| | 20 | Flows and cuts (181) | Ford–Fulkerson; Disjoint paths; Maximum matchings; Path covers |
| **III Advanced topics** | 21 | Number theory (197) | Primes and factors; Modular arithmetic; Solving equations; Other results |
| | 22 | Combinatorics (207) | Binomial coefficients; Catalan numbers; Inclusion-exclusion; Burnside's lemma; Cayley's formula |
| | 23 | Matrices (217) | Operations; Linear recurrences; Graphs and matrices |
| | 24 | Probability (225) | Calculation; Events; Random variables; Markov chains; Randomized algorithms |
| | 25 | Game theory (235) | Game states; Nim game; Sprague–Grundy theorem |
| | 26 | String algorithms (243) | String terminology; Trie structure; String hashing; Z-algorithm |
| | 27 | Square root algorithms (251) | Combining algorithms; Integer partitions; **Mo's algorithm** |
| | 28 | Segment trees revisited (257) | **Lazy propagation**; Dynamic trees; Data structures; Two-dimensionality |
| | 29 | Geometry (265) | Complex numbers; Points and lines; Polygon area; Distance functions |
| | 30 | Sweep line algorithms (275) | Intersection points; Closest pair problem; Convex hull problem |

**Structural lesson taken from S3 and worth copying:** it files *two pointers*, *nearest
smaller elements* and *sliding window minimum* under **amortized analysis**, not under
"array tricks". That is the correct home — these patterns are not tricks, they are a proof
that each element enters and leaves a structure once. The interview banks lose this, and
recovering it is one of the things that will make this course better than the banks.

**Caution:** S3 is a 2018 draft, C++-centric, and its code is contest code (no error
handling, `int` overflow assumptions). Per §3.4 no code is taken; per §3.3 any number from
it is re-verified.

---

### S4 — Algorithms, Jeff Erickson (2019)

| Ch | Title |
|---|---|
| 0 | Introduction |
| 1 | Recursion |
| 2 | Backtracking |
| 3 | Dynamic Programming |
| 4 | Greedy Algorithms |
| 5 | Basic Graph Algorithms |
| 6 | Depth-First Search |
| 7 | Minimum Spanning Trees |
| 8 | Shortest Paths |
| 9 | All-Pairs Shortest Paths |
| 10 | Maximum Flows & Minimum Cuts |
| 11 | Applications of Flows and Cuts |
| 12 | NP-Hardness |

472 pages. No appendices in the book proper; the companion lecture notes carry appendices on
proof by induction and on solving recurrences.

**What S4 gives the course:** the best free treatment of *why recursion is the base paradigm*
and of backtracking as a first-class topic with its own chapter rather than a subsection of
DP. Erickson's ordering — recursion → backtracking → DP → greedy — is the ordering this
course should follow for Part "Recursion and its descendants", and the Blueprint will say so.
He also treats NP-hardness as a working skill (reduce to it, recognize it) rather than theory,
which is exactly the §6.3 "practitioner handbook" angle for that topic.

---

### S5 — CLRS 4th edition (2022)

Verified for this map:

- **Chapter 25, Matchings in Bipartite Graphs** — new in 4e. Maximum-cardinality matching;
  the stable-marriage problem; maximum-weight matching (the assignment problem).
- **Chapter 26, Parallel Algorithms** — retitled and modernized from 3e's "Multithreaded
  Algorithms". Fork-join parallelism basics; parallel matrix multiplication; parallel merge sort.
- **Chapter 27, Online Algorithms** — new in 4e. Input arrives over time. Examples given:
  the elevator-vs-stairs waiting problem, move-to-front on a linked list, cache replacement
  policies.
- **Chapter 28, Matrix Operations** — solving systems of linear equations; inverting matrices;
  symmetric positive-definite matrices and least-squares.
- **Chapter 29, Linear Programming** — formulations and algorithms; formulating problems as
  LPs; duality. The detailed simplex presentation was **removed** in 4e as math-heavy without
  conveying algorithmic ideas.
- 4e also adds a chapter on **machine learning algorithms**, adds 140 exercises and 22
  problems, and adds colour. Hash-table, recurrence-solving, potential-function and
  **suffix-array** material was expanded.

The 3rd-edition part/chapter scheme, verified and recorded because most syllabi and study
guides still cite it:

> **I Foundations** 1 Role of Algorithms · 2 Getting Started · 3 Growth of Functions ·
> 4 Divide-and-Conquer · 5 Probabilistic Analysis and Randomized Algorithms
> **II Sorting and Order Statistics** 6 Heapsort · 7 Quicksort · 8 Sorting in Linear Time ·
> 9 Medians and Order Statistics
> **III Data Structures** 10 Elementary Data Structures · 11 Hash Tables · 12 Binary Search
> Trees · 13 Red-Black Trees · 14 Augmenting Data Structures
> **IV Advanced Design and Analysis** 15 Dynamic Programming · 16 Greedy Algorithms ·
> 17 Amortized Analysis
> **V Advanced Data Structures** 18 B-Trees · 19 Fibonacci Heaps · 20 van Emde Boas Trees ·
> 21 Data Structures for Disjoint Sets
> **VI Graph Algorithms** 22 Elementary Graph Algorithms · 23 Minimum Spanning Trees ·
> 24 Single-Source Shortest Paths · 25 All-Pairs Shortest Paths · 26 Maximum Flow
> **VII Selected Topics** 27 Multithreaded · 28 Matrix Operations · 29 Linear Programming ·
> 30 Polynomials and the FFT · 31 Number-Theoretic Algorithms · 32 String Matching ·
> 33 Computational Geometry · 34 NP-Completeness · 35 Approximation Algorithms

**Sources differ / not yet verified (open item O1):** the 4e numbering for chapters 1–24 and
30–35. The evidence is that 4e merged and renumbered the early chapters (growth of functions
folded into the "Characterizing Running Times" treatment, recurrences promoted into the
divide-and-conquer chapter) so that DP lands at 14 rather than 15 and graph algorithms start
around 20. **This map does not assert that**, and Phase 2 must confirm it against the book
before any chapter cites a CLRS chapter number. Until then the course cites CLRS by *topic*,
never by number.

---

### S6 — The Algorithm Design Manual, Skiena, 3rd ed. (2020)

Structure confirmed: two parts. Part I, **Practical Algorithm Design** — instruction in
designing and analyzing algorithms, each chapter closing with a **War Story**, Skiena's
account of the chapter's technique meeting a real problem. Part II, the **Hitchhiker's Guide
to Algorithms** — a browsable catalogue of **75 algorithmic problems**, each with
"input/output/discussion/implementations/notes", plus an extensive bibliography.

War stories confirmed by name: "Mystery of the Pyramids" (ch. 2); "Give Me a Ticket on an
Airplane" and "Skiena For the Defense" (ch. 4, Sorting); "I was a Victim of Moore's Law" and
"Getting the Graph" (ch. 5, Graph Traversal); "Nothing but Nets" and "Dialing for Documents"
(ch. 6, Weighted Graph Algorithms); also "Stripping Triangulations", "String 'em Up",
"Finding the Bug in the Bug", "Going Nowhere Fast".

**What S6 gives the course, and it is the most important pedagogical debt in this map:** the
war story is the model for §6.4's "Interview lens" and for the §5.2 step 6 "in the real
world". Skiena's Part II catalogue is also the model for the course's own **field guide**
chapter (§6.3 requires at least two): a problem-indexed rather than technique-indexed view,
so a learner who has a problem can find the technique. No other source in this map has that
direction of lookup, and the course needs it.

**Open item O2:** the per-chapter TOC of the 3rd edition is not yet verified; the publisher's
page is behind an auth redirect. Phase 2 confirms it.

---

### S7 — MIT 6.006, Spring 2020 (OCW): 21 lectures

1 Algorithms and Computation · 2 Data Structures and Dynamic Arrays · 3 Sets and Sorting ·
4 Hashing · 5 Linear Sorting · 6 Binary Trees Part 1 · 7 Binary Trees Part 2: AVL ·
8 Binary Heaps · 9 Breadth-First Search · 10 Depth-First Search · 11 Weighted Shortest Paths ·
12 Bellman-Ford · 13 Dijkstra · 14 APSP and Johnson · 15 DP Part 1: **SRTBOT**, Fib, DAGs,
Bowling · 16 DP Part 2: LCS, LIS, Coins · 17 DP Part 3: APSP, Parens, Piano · 18 DP Part 4:
Rods, Subset Sum, Pseudopolynomial · 19 Complexity · 20 Course Review · 21 Algorithms—Next Steps.

**Two things this course should steal from 6.006:**

1. **SRTBOT** — MIT's checklist for specifying a dynamic program: **S**ubproblems,
   **R**elate, **T**opological order, **B**ase cases, **O**riginal problem, **T**ime. This is
   the single best teaching device for DP in any of the fourteen sources, and it turns DP
   from intuition into a procedure a learner can execute under interview pressure. The DP
   chapters should be built on it, with attribution by name to 6.006.
2. **"Pseudopolynomial" gets its own lecture slot.** Almost every interview bank teaches
   knapsack without ever saying that O(nW) is not polynomial in the input size. That is
   precisely the §5.3 rung-5/rung-6 gap that separates this course from the banks.

---

### S8 — Princeton COS 226, Spring 2024: 24 lectures

1 Introduction + **Union–Find** · 2 Analysis of Algorithms · 3 Stacks and Queues ·
4 Advanced Java · 5 Elementary Sorts · 6 Mergesort · 7 Quicksort · 8 Priority Queues ·
9 Elementary Symbol Tables + BSTs · 10 Balanced Search Trees · 11 Midterm · 12 Guest ·
13 **Geometric Applications of BSTs** · 14 Hash Tables · 15 Graphs and Digraphs I ·
16 Graphs and Digraphs II · 17 Minimum Spanning Trees · 18 Shortest Paths ·
19 Dynamic Programming · 20 **Maxflows and Mincuts** · 21 Randomness ·
22 Multiplicative Weights · 23 Intractability · 24 Algorithm Design.

**Note the ordering decision:** COS 226 opens the entire course with union–find, before
sorting, before analysis is even complete — because it is the smallest structure whose
performance story (quick-find → quick-union → weighting → path compression, and the
near-constant α(n) result) teaches the whole method of algorithm analysis on one page. This
course should consider the same opening; it is a strictly better orientation chapter than
"here is Big-O".

Also note lecture 13: **geometric applications of BSTs** (interval search trees, kd-trees,
line-segment intersection by sweep) — a topic no interview bank in this map covers, and which
is core for a university final. Phase 2 must not mark it out.

---

### S9 — Stanford CS 161

Published topic list: worst-case and average-case analysis; recurrences and asymptotics;
efficient sorting, searching and selection; binary search trees, heaps, hash tables;
divide-and-conquer, dynamic programming, greedy, **amortized analysis**, **randomization**;
minimum-cost spanning tree, connected components, topological sort, shortest paths; possible
additional topics **network flow** and **string searching**. CLRS is the set text.

CS 161 is the reference point for "what a university final examines" in §1's bar table, and
its list is notable for making **randomization** and **amortized analysis** first-class rather
than optional — both are absent as named topics from every tier-6 source in this map.

---

### S10 — CMU 15-451/651

Published description: fundamental algorithmic modeling techniques (dynamic programming,
graphs, **network flows**, **linear programming**); advanced paradigms (**approximation
algorithms**, **online algorithms**, **streaming algorithms**); methods for analyzing
algorithms and problems (**lower bounds**, amortized analysis, probabilistic analysis of
randomized algorithms). FFT is named explicitly alongside flows and LP.

The Fall 2026 lecture calendar is behind CMU authentication and was not read (open item O3).
The topic list alone is enough for the Phase 2 audit.

**15-451 contributes the three topics that are hardest to justify to an interview-focused
reader and hardest to leave out of a complete course:** lower bounds (why comparison sorting
cannot beat n log n — an actual proof, not an assertion), streaming/approximate structures,
and online algorithms with competitive ratios. All three appear in senior interviews at
companies that ask systems-flavoured algorithm questions, and all three are missing from
every tier-6 source here.

---

### S11 — Grokking the Coding Interview Patterns (tier 6, taxonomy only)

The published list, verbatim, grouped as the source groups it.

**Common patterns.** *Arrays and strings:* Two Pointers · Fast & Slow Pointers · Sliding
Window · Merge Intervals · Cyclic Sort · Prefix Sum · Hash Maps. *Stacks and queues:*
Stacks · Monotonic Stack · Monotonic Queue. *Linked lists:* In-place Reversal of a Linked
List. *Trees and graphs:* Tree BFS · Tree DFS · Level Order Traversal · Graphs · Island
(Matrix Traversal) · Topological Sort · Union Find · Trie. *Search and selection:* Modified
Binary Search · Top 'K' Elements · K-way Merge · Two Heaps · Ordered Set · Bitwise XOR.
*Recursion and DP:* Subsets · Backtracking · Greedy Algorithms · 0/1 Knapsack · Longest
Common Subsequence · Fibonacci Numbers · Palindromic Subsequence.

**Advanced patterns.** Counting · Simulation · Linear Sorting · Meet in the Middle ·
Serialize & Deserialize · Clone · Articulation Points & Bridges · Segment Tree · Binary
Indexed Tree · MO's Algorithm · Multi-threaded.

Example problems the source attaches: Pair with Target Sum, 3Sum, Squares of a Sorted Array,
Dutch National Flag (Two Pointers); LinkedList Cycle, Middle of the LinkedList, Happy Number,
Palindrome LinkedList (Fast & Slow); Longest Substring Without Repeating Characters, Minimum
Size Subarray Sum, Max Consecutive Ones III (Sliding Window); Merge Intervals, Insert
Interval, Meeting Rooms II (Merge Intervals); Find the Missing Number, Find All Duplicates,
Find the Corrupt Pair (Cyclic Sort); Daily Temperatures, Next Greater Element, Largest
Rectangle in Histogram (Monotonic Stack); Level Order Traversal, Zigzag Traversal, Right View
(Tree BFS); Path Sum, Diameter of Binary Tree, Validate BST, Lowest Common Ancestor (Tree
DFS); Number of Islands, Rotting Oranges (Island); Clone Graph, Course Schedule, Word Ladder
(Topological Sort); Order-agnostic Binary Search, Search in Rotated Array, Koko Eating
Bananas, Capacity to Ship Packages in D Days (Modified Binary Search); Kth Largest Element,
Top K Frequent Elements, K Closest Points to Origin (Top 'K'); Find the Median of a Number
Stream, Sliding Window Median (Two Heaps); Subsets, Permutations, Letter Combinations of a
Phone Number, Palindromic Partitioning (Backtracking).

**Three defects in S11 that the course must not inherit:**

1. **The count does not add up.** The page heads the first group "Common Patterns (31)" and
   then lists 32 numbered entries, and the article title claims 42 total against 43 listed.
   Recorded per §3.5; it is a symptom of the taxonomy being marketing copy rather than a
   classification.
2. **The categories are not disjoint and not at one level of abstraction.** "Graphs" is a
   pattern alongside "Island (Matrix Traversal)", which is a graph traversal; "Subsets" is a
   pattern alongside "Backtracking", which generates subsets; "Hash Maps" is a data
   structure, not a pattern. A learner cannot use this list to *decide* anything.
3. **"Topological Sort" is exemplified by Clone Graph and Word Ladder**, neither of which is
   a topological sort. This is a factual error in the source and is the clearest possible
   evidence for §3.1's rule that tier 6 supplies no facts.

S11 is nevertheless the most complete *named* pattern vocabulary in circulation, and a
learner arriving from it must find every one of these names in this course's index. That is
a hard requirement on Phase 2.

---

### S12 — NeetCode 150 / roadmap (tier 6, taxonomy only)

Eighteen categories, in roadmap order: Arrays & Hashing · Two Pointers · Sliding Window ·
Stack · Binary Search · Linked List · Trees · Tries · Backtracking · Heap/Priority Queue ·
Graphs · Advanced Graphs · 1-D DP · 2-D DP · Greedy · Intervals · Math & Geometry · Bit
Manipulation.

Problems enumerated from mirrors (partial; complete enumeration deferred to Phase 2 where it
feeds the Gap Matrix rather than this map):

- *Arrays & Hashing:* Contains Duplicate; Valid Anagram; Two Sum; Group Anagrams; Top K
  Frequent Elements; Encode and Decode Strings; Product of Array Except Self; Valid Sudoku;
  Longest Consecutive Sequence.
- *Two Pointers:* Valid Palindrome; Two Sum II; 3Sum; Container With Most Water; Trapping Rain Water.
- *Stack:* Valid Parentheses; Min Stack; Evaluate Reverse Polish Notation; Generate
  Parentheses; Daily Temperatures; Car Fleet; Largest Rectangle In Histogram.
- *Binary Search:* Binary Search; Search a 2D Matrix; Koko Eating Bananas; Find Minimum In
  Rotated Sorted Array; Search In Rotated Sorted Array; Time Based Key Value Store; Median of
  Two Sorted Arrays.
- *Sliding Window:* Best Time to Buy And Sell Stock; Longest Substring Without Repeating
  Characters; Longest Repeating Character Replacement; Permutation In String; Minimum Window
  Substring; Sliding Window Maximum.
- *Linked List:* Reverse Linked List; Merge Two Sorted Lists; Reorder List; Remove Nth Node
  From End; Copy List With Random Pointer; Add Two Numbers; Linked List Cycle; Find The
  Duplicate Number; **LRU Cache**; Merge K Sorted Lists; Reverse Nodes In K Group.
- *Trees:* Invert Binary Tree; Maximum Depth; Diameter; Balanced Binary Tree; Same Tree;
  Subtree of Another Tree; LCA of a BST; LCA of a Binary Tree; Level Order Traversal; Right
  Side View; Count Good Nodes; Validate BST; Kth Smallest Element in a BST; Construct Binary
  Tree From Preorder And Inorder.

**The NeetCode roadmap's one genuine contribution is the dependency edge**, not the
categories: it publishes a *prerequisite graph* between topics rather than a flat list, which
is exactly what §4 Phase 3 demands per chapter ("Prerequisite chapters, so the reading order
is explicit"). The Blueprint should publish its own version of that graph as a figure.

---

### S13 — Tech Interview Handbook (tier 6)

*Topic grouping:* Week 1 Array, String, Hash Table, Recursion · Week 2 Sorting and Searching,
Matrix, Linked List, Queue, Stack · Week 3 Tree, Graph, Heap, Trie · Week 4 Interval, Dynamic
Programming, Binary, Math, Geometry.

*Its curated 75, by week* (recorded in full because this is the most widely used single list
and Phase 2 audits against it): Two Sum; Valid Parentheses; Merge Two Sorted Lists; Best Time
to Buy and Sell Stock; Valid Palindrome; Invert Binary Tree; Valid Anagram; Binary Search;
Flood Fill; LCA of a BST; Balanced Binary Tree; Linked List Cycle; Implement Queue using
Stacks; First Bad Version; Ransom Note; Climbing Stairs; Longest Palindrome; Reverse Linked
List; Majority Element; Add Binary; Diameter of Binary Tree; Middle of the Linked List;
Maximum Depth of Binary Tree; Contains Duplicate; Min Stack; Maximum Subarray; Insert
Interval; 01 Matrix; K Closest Points to Origin; Longest Substring Without Repeating
Characters; 3Sum; Binary Tree Level Order Traversal; Clone Graph; Evaluate Reverse Polish
Notation; Course Schedule; Implement Trie; Coin Change; Product of Array Except Self;
Validate BST; Number of Islands; Rotting Oranges; Search in Rotated Sorted Array; Combination
Sum; Permutations; Merge Intervals; LCA of a Binary Tree; Time Based Key-Value Store;
Accounts Merge; Sort Colors; Word Break; Partition Equal Subset Sum; String to Integer
(atoi); Spiral Matrix; Subsets; Binary Tree Right Side View; Longest Palindromic Substring;
Unique Paths; Construct Binary Tree from Preorder and Inorder; Container With Most Water;
Letter Combinations of a Phone Number; Word Search; Find All Anagrams in a String; Minimum
Height Trees; Task Scheduler; LRU Cache; Kth Smallest Element in a BST; Minimum Window
Substring; Serialize and Deserialize Binary Tree; Trapping Rain Water; Find Median from Data
Stream; Word Ladder; Basic Calculator; Maximum Profit in Job Scheduling; Merge k Sorted
Lists; Largest Rectangle in Histogram.

---

### S14 — Sean Prashad's LeetCode Patterns (tier 6): the recognition rules

The only source in the map that publishes **cue → technique** rules rather than a topic list,
and therefore the most directly useful one for a course whose premise is pattern recognition.
Complete rule set:

| Cue in the problem | Technique it suggests |
|---|---|
| Sorted input | Binary search; two pointers |
| Need O(1) lookup | Hash table; hash set |
| Must solve in place | Swap values; encode two values in one slot |
| Common prefixes across strings | Map; trie |
| Counting bits, or XOR structure | Bit manipulation |
| Max/min subarray or subset | Dynamic programming; sliding window |
| Sliding-window max/min | Monotonic queue |
| Next greater / next smaller element | Monotonic stack |
| Range sum or range frequency queries | Prefix sum; binary indexed tree; segment tree |
| Tree given | DFS; BFS |
| Graph given | DFS; BFS; union–find |
| Matrix given | BFS; DFS; dynamic programming |
| Connectivity or grouping | Union–find; DFS |
| Ordering or scheduling constraints | Topological sort |
| Linked list | Two pointers |
| Recursion disallowed | Explicit stack |
| Top or least K items | Heap; quickselect; bucket sort |
| Merge sorted lists or intervals | Merge sort; heap |
| Overlapping intervals | Sorting; sweep line |
| Data stream | Heap; design |
| All permutations or subsets | Backtracking |
| Count, or divide optimally | Greedy; dynamic programming |

**This table is the seed of the course's own decision procedure, and it is not good enough as
it stands** — it is ambiguous (four cues point to more than one technique with no tiebreak),
it has no entry for the majority of the topic universe (no flows, no strings beyond tries, no
number theory, no game theory, no amortized reasoning), and it gives no way to *confirm* a
guess. §6.3 requires a field-guide chapter with "a decision procedure, not a feature list";
this course's version must resolve ties by a stated test and must cover every pattern it
teaches. Building that is a named Blueprint deliverable.

---

### S15 — Striver's A2Z DSA Sheet (tier 6)

Modules as published on takeuforward.org: Beginner Problems · Fundamentals of Programming ·
Concept Basics · Basic Maths · Basic Arrays · Basic Hashing · Basic Strings · Basic Recursion ·
Sorting · Arrays · Hashing · Binary Search · Recursion · Linked-List · Bit Manipulation ·
Greedy Algorithms · Sliding Window / 2 Pointer · Stack / Queues · Binary Trees · Binary Search
Trees · Heaps · Graphs · Dynamic Programming · Tries · Strings (Advanced Algo) · Maths.

**Sources differ** on the sheet's size: takeuforward's own course page states 19 modules /
442 topics / 16 contests / 131.3 hours, while the page simultaneously renders 26 module
titles and a "11 more sections" control, and third-party trackers describe "18 main sections"
and "450+ problems". Recorded per §3.5, not resolved; nothing in the course depends on the
number.

S15's contribution is the *Indian placement-interview* weighting, which differs from the US
FAANG weighting the other banks encode: far more emphasis on binary search on the answer, on
bit manipulation, on pure recursion drilling, and on a separate advanced-strings module
(KMP, Z, Rabin-Karp) that NeetCode and Blind 75 omit entirely. Given `marketing/PLAN.md`'s
personas, this weighting matters.

---

## 2. Merged topic universe (deduplicated, with coverage depth per source)

Depth key: **D** definitive (mechanism, proof and cost) · **T** thorough (mechanism and cost) ·
**S** survey (named and sketched) · **P** problems only (the source supplies exercises, not
teaching) · **—** absent.

The "Pattern name" column records what the interview banks call the row, so Phase 2 can prove
every bank name is reachable. A blank means **no bank has a name for it** — the rows most at
risk of being orphaned and the rows that most distinguish this course.

### A. Analysis and foundations

| # | Topic | Pattern name (banks) | S1 | S3 | S4 | S5 | S7 | S8 | S9 | S10 | banks |
|---|---|---|---|---|---|---|---|---|---|---|---|
| A1 | Asymptotic notation: O, Ω, Θ, o, ω | — | — | T | T | D | T | T | D | T | S |
| A2 | Model of computation: word RAM, what counts as a step | — | — | S | T | D | D | S | T | T | — |
| A3 | Recurrences: substitution, recursion tree, master theorem, Akra-Bazzi | — | — | S | T | D | T | T | D | T | — |
| A4 | Average case vs worst case vs expected | — | — | S | T | D | S | T | D | T | — |
| A5 | **Amortized analysis**: aggregate, accounting, potential | — | — | D(ch8) | S | D | S | T | D | D | — |
| A6 | **Lower bounds**: comparison-sort Ω(n log n), adversary arguments | — | — | S | T | D | T | T | T | D | — |
| A7 | Randomized algorithms: Las Vegas vs Monte Carlo, expectation | — | S | T(ch24) | T | D | S | D | D | D | — |
| A8 | Space complexity and in-place-ness | in-place (S14) | — | S | S | T | T | S | T | T | S |
| A9 | Recursion, the call stack, and converting to iteration | Recursion (S15) | — | T | **D(ch1)** | T | S | S | S | S | T |
| A10 | Complexity classes P/NP, reductions, NP-hardness in practice | Intractability (S8) | — | S | **D(ch12)** | D | T(L19) | T(L23) | S | T | — |
| A11 | Approximation algorithms and competitive ratios | — | — | — | S | D | — | — | S | D | — |
| A12 | **Online algorithms** (move-to-front, cache replacement, ski rental) | — | — | — | — | **D(ch27)** | — | — | — | D | — |
| A13 | Streaming and sketching (Count-Min, HyperLogLog, reservoir sampling) | — | — | — | — | — | — | — | — | T | — |

### B. Linear-scan patterns over arrays and strings

| # | Topic | Pattern name (banks) | S1 | S2 | S3 | Textbooks | banks |
|---|---|---|---|---|---|---|---|
| B1 | Two pointers, opposite ends | Two Pointers | — | P | **D(8.1)** | T | D |
| B2 | Two pointers, same direction (fast/slow read-write) | Fast & Slow Pointers | — | P | D | T | D |
| B3 | Fixed-size sliding window | Sliding Window | — | P(11) | D | S | D |
| B4 | Variable-size sliding window (shrink on invariant break) | Sliding Window | — | P | D | S | D |
| B5 | Prefix sums, difference arrays, 2-D prefix sums | Prefix Sum | T | P | D(9.1) | T | T |
| B6 | Kadane's algorithm / maximum subarray | — | T | P | D(2.4) | D | T |
| B7 | Cyclic sort / index-as-hash placement | Cyclic Sort | — | P | — | S | T |
| B8 | Dutch national flag / three-way partition | Two Pointers | — | P | S | D | T |
| B9 | Interval merging, insertion, and sweep over endpoints | Merge Intervals | T | P | T | T | D |
| B10 | Sweep line (events sorted by coordinate) | — | **D** | P | **D(ch30)** | T | S |
| B11 | Meet in the middle | Meet in the Middle | — | P | D(5.5) | S | S |
| B12 | Boyer–Moore majority vote | — | — | P | — | S | S |
| B13 | Matrix traversal: spiral, rotate, transpose in place | Simulation | — | P | — | — | T |
| B14 | Cycle detection in a functional graph (Floyd, Brent) | Fast & Slow Pointers | **T** | P | T | T | T |

### C. Searching

| # | Topic | Pattern name (banks) | S1 | S3 | Textbooks | banks |
|---|---|---|---|---|---|---|
| C1 | Binary search on a sorted array; the off-by-one contract | Modified Binary Search | **D** | D(3.3) | D | D |
| C2 | Lower bound / upper bound / equal range | Modified Binary Search | D | D | D | T |
| C3 | **Binary search on the answer** (monotone predicate) | Modified Binary Search | D | D | S | D |
| C4 | Search in rotated / mountain / unknown-length arrays | Modified Binary Search | — | — | — | D |
| C5 | Ternary search on a unimodal function | — | **D** | — | S | — |
| C6 | Exponential (galloping) search | — | S | — | T | — |
| C7 | Quickselect and median of medians | Top K | **T** | S | **D** | T |
| C8 | Selection in two sorted arrays (median of two sorted arrays) | — | — | — | S | D |

### D. Sorting and order

| # | Topic | Pattern name (banks) | S1 | S3 | Textbooks | banks |
|---|---|---|---|---|---|---|
| D1 | Insertion, selection, bubble; when insertion actually wins | Elementary Sorts | — | T | D | S |
| D2 | Mergesort; stability; bottom-up; counting inversions | K-way Merge | S | T | D | T |
| D3 | Quicksort: partition schemes, pivot choice, randomization, worst case | — | — | T | D | T |
| D4 | Heapsort and the binary heap | Heap | **T** | T | D | D |
| D5 | Counting, radix, bucket sort; the linear-time boundary | Linear Sorting | — | S | D | S |
| D6 | Sorting by custom comparator; sort stability as a design tool | — | — | D(3.2) | T | T |
| D7 | Introsort/Timsort: what real standard libraries actually run | — | — | S | S | — |
| D8 | External and parallel sorting | — | — | — | T | — |
| D9 | Order statistics and k-th smallest | Top K | T | S | D | D |

### E. Hashing

| # | Topic | Pattern name (banks) | S1 | Textbooks | banks |
|---|---|---|---|---|---|
| E1 | Hash functions, universal hashing, and why randomization is needed | Hash Maps | S | **D** | S |
| E2 | Chaining vs open addressing; linear/quadratic probing; tombstones | — | — | **D** | S |
| E3 | Load factor, resizing, amortized O(1), and the rehash stall | — | — | D | — |
| E4 | Hash sets and frequency maps as a pattern | Hash Maps | — | T | **D** |
| E5 | Rolling hash and Rabin–Karp; collision probability | — | **D** | D | S |
| E6 | String hashing for equality and substring comparison | — | **D** | S | S |
| E7 | Hashing pitfalls: adversarial inputs, anti-hash tests, mutable keys | — | S | T | — |
| E8 | Bloom filters and counting sketches | — | — | S | — |

### F. Stacks, queues and monotonic structures

| # | Topic | Pattern name (banks) | S1 | S3 | Textbooks | banks |
|---|---|---|---|---|---|---|
| F1 | Stack and queue contracts; array vs linked implementation | Stacks | — | T | D | D |
| F2 | Deques and circular buffers | — | — | T | T | T |
| F3 | **Monotonic stack**: next greater/smaller, spans, histogram | Monotonic Stack | — | **D(8.2)** | T | **D** |
| F4 | **Monotonic deque**: sliding window minimum/maximum | Monotonic Queue | — | **D(8.3)** | S | T |
| F5 | Min-stack / min-queue in O(1) | — | **D** | S | S | T |
| F6 | Expression parsing, RPN, and the shunting-yard algorithm | — | **D** | — | T | T |
| F7 | Stack-based recursion elimination; explicit iterative traversal | Recursion disallowed → Stack | — | S | T | T |

### G. Linked structures

| # | Topic | Pattern name (banks) | Textbooks | banks |
|---|---|---|---|---|
| G1 | Singly/doubly linked lists; sentinel nodes | — | D | D |
| G2 | In-place reversal, full and in k-groups | In-place Reversal | S | **D** |
| G3 | Runner technique: middle, nth-from-end, cycle entry | Fast & Slow Pointers | T | **D** |
| G4 | Merging, partitioning, and sorting linked lists | K-way Merge | T | D |
| G5 | Deep copy with random pointers | Clone | — | D |
| G6 | **LRU and LFU caches** (hash map + doubly linked list) | Design | S | **D** |
| G7 | Skip lists | — | T | — |

### H. Trees

| # | Topic | Pattern name (banks) | S1 | S3 | Textbooks | banks |
|---|---|---|---|---|---|---|
| H1 | Binary tree shapes, height, and the traversal trio + Morris traversal | Tree DFS | — | T | D | D |
| H2 | Level-order traversal and its variants | Tree BFS / Level Order | — | S | D | D |
| H3 | Recursive tree DP ("return a tuple up the tree"): diameter, balance, path sum | Tree DFS | T | **D(ch14)** | T | D |
| H4 | Binary search trees: search, insert, delete, successor | — | — | T | D | D |
| H5 | Balanced BSTs: AVL rotations; red-black invariants; treaps | — | **T** | — | D | — |
| H6 | B-trees and the disk/cache argument | — | — | — | D | — |
| H7 | Binary heaps: sift up/down, build-heap in O(n), d-ary heaps | Heap | T | T | D | D |
| H8 | Advanced heaps: Fibonacci, pairing, and what they buy Dijkstra | — | S | — | D | — |
| H9 | Two heaps for a running median | Two Heaps | — | — | S | **D** |
| H10 | **Tries**: insert, search, prefix, compressed/radix | Trie | S | D(26.2) | T | **D** |
| H11 | Serialization and reconstruction from traversals | Serialize & Deserialize | — | — | S | **D** |
| H12 | Lowest common ancestor: naive, binary lifting, Euler tour + RMQ, Tarjan offline | — | **D** | **D(18.3)** | T | S |
| H13 | Tree diameter, centroid, centroid decomposition | — | **D** | D | — | — |
| H14 | **Heavy-light decomposition** and path queries | — | **D** | S | — | — |
| H15 | Euler tour flattening; subtree as a contiguous range | — | D | **D(18.2)** | — | — |
| H16 | kd-trees, interval trees, and geometric BST applications | — | S | — | **D(S8 L13)** | — |

### I. Graphs

| # | Topic | Pattern name (banks) | S1 | S3 | Textbooks | banks |
|---|---|---|---|---|---|---|
| I1 | Representations: adjacency list/matrix, implicit graphs, grid-as-graph | Graphs / Island | T | D | D | D |
| I2 | BFS, and BFS as unweighted shortest path | Tree BFS / Island | D | D | D | D |
| I3 | DFS, the DFS tree, edge classification, and entry/exit times | — | D | D | **D(S4 ch6)** | T |
| I4 | Multi-source BFS and 0-1 BFS | Island | **D** | S | — | S |
| I5 | Connected components; flood fill; grid island counting | Island | D | D | D | **D** |
| I6 | **Union–Find** with union by rank/size and path compression; α(n) | Union Find | **D** | D(15.2) | **D** | D |
| I7 | Topological sort: Kahn's and DFS-based; cycle detection in a DAG | Topological Sort | D | D | D | **D** |
| I8 | DP over a DAG; longest path; successor/functional graphs | — | S | **D(16.2–16.3)** | T | S |
| I9 | Dijkstra with a binary heap; why no negative edges | — | D | D | D | D |
| I10 | Bellman–Ford, negative cycles, SPFA | — | D | D | D | S |
| I11 | Floyd–Warshall and transitive closure | — | D | D | D | S |
| I12 | Johnson's reweighting for sparse APSP | — | S | — | **D(S7 L14)** | — |
| I13 | A* and heuristic search; admissibility | — | — | — | S | — |
| I14 | MST: Kruskal, Prim, the cut property, second-best MST | — | D | D | D | S |
| I15 | Strongly connected components: Kosaraju, Tarjan; condensation | Advanced Graphs | **D** | D(17.1) | D | S |
| I16 | Bridges and articulation points; biconnectivity | Articulation Points & Bridges | **D** | — | T | S |
| I17 | **2-SAT** via implication graph and SCC | — | **D** | D(17.2) | — | — |
| I18 | Eulerian path/circuit (Hierholzer); De Bruijn sequences | — | **D** | D(ch19) | T | — |
| I19 | Hamiltonian path; TSP by bitmask DP | — | S | D | T | S |
| I20 | Max flow: Ford–Fulkerson, Edmonds–Karp, Dinic; max-flow min-cut | Advanced Graphs | **D** | D(ch20) | **D** | — |
| I21 | Flow modelling: disjoint paths, path covers, project selection | — | **D** | D | **D(S4 ch11)** | — |
| I22 | Min-cost max-flow; the assignment problem; Hungarian algorithm | — | **D** | S | D | — |
| I23 | **Bipartite matching**: Kuhn/Hopcroft–Karp; König; stable marriage | — | **D** | D(20.3) | **D(S5 ch25)** | — |
| I24 | Bipartite checking and graph colouring | — | D | S | T | S |
| I25 | Minimum cut (global): Stoer–Wagner, Karger | — | D | — | T | — |

### J. Recursion, enumeration and backtracking

| # | Topic | Pattern name (banks) | S1 | S3 | Textbooks | banks |
|---|---|---|---|---|---|---|
| J1 | Recursion as induction; writing the recurrence before the code | Recursion | — | T | **D(S4 ch1)** | T |
| J2 | Divide and conquer as a paradigm; merge/conquer cost accounting | — | — | T | D | S |
| J3 | Generating subsets: recursive and bitmask | Subsets | **D** | **D(5.1)** | T | **D** |
| J4 | Generating permutations; next_permutation; duplicate handling | — | **D** | D(5.2) | T | **D** |
| J5 | Combinations and k-subsets | Subsets | D | D | T | D |
| J6 | Backtracking template: choose, explore, un-choose | Backtracking | — | D(5.3) | **D(S4 ch2)** | **D** |
| J7 | Pruning and constraint propagation (n-queens, sudoku) | Backtracking | — | **D(5.4)** | D | T |
| J8 | Iterative deepening and bounded search | — | — | S | S | — |
| J9 | Memoized recursion as the bridge to DP | 0/1 Knapsack | T | D | D | D |

### K. Dynamic programming

| # | Topic | Pattern name (banks) | S1 | S3 | Textbooks | banks |
|---|---|---|---|---|---|---|
| K1 | Optimal substructure and overlapping subproblems; when DP is legal | — | T | T | **D** | S |
| K2 | **SRTBOT**: a procedure for specifying a DP | — | — | — | **D(S7)** | — |
| K3 | Top-down memoization vs bottom-up tabulation; the trade | — | **D** | D | D | D |
| K4 | 1-D DP: Fibonacci, climbing stairs, house robber, decode ways | Fibonacci Numbers / 1-D DP | T | D | D | **D** |
| K5 | Coin change: min coins, count ways, and the ordering subtlety | — | D | **D(7.1)** | D | **D** |
| K6 | 0/1 knapsack, unbounded knapsack, subset sum, partition | 0/1 Knapsack | **D** | D(7.4) | D | **D** |
| K7 | **Pseudopolynomial time**: why O(nW) is not polynomial | — | S | S | **D(S7 L18)** | — |
| K8 | LIS in O(n²) and O(n log n) (patience/binary search) | — | **D** | D(7.2) | D | T |
| K9 | LCS, edit distance, and the alignment family | Longest Common Subsequence | S | D(7.5) | D | **D** |
| K10 | Grid DP: unique paths, min path sum, obstacles | 2-D DP | — | D(7.3) | T | **D** |
| K11 | Palindromic DP: substrings, subsequences, partitioning | Palindromic Subsequence | — | S | S | **D** |
| K12 | Interval DP: matrix chain, burst balloons, optimal BST | — | **D** | S | D | T |
| K13 | Tree DP: rerooting, independent set on a tree, tree matching | — | **D** | D(14.3) | T | S |
| K14 | **Bitmask DP** over subsets; TSP; assignment | — | **D** | **D(10.5)** | T | S |
| K15 | Digit DP | Counting | S | S | — | — |
| K16 | Counting DP vs optimizing DP; counting tilings, broken profile | Counting | **D** | D(7.6) | S | — |
| K17 | DP on probability/expectation; Markov chains | — | — | D(24.4) | T | — |
| K18 | Reconstructing the solution, not just the value | — | S | T | D | T |
| K19 | Space optimization: rolling arrays, 1-D rollback | — | S | T | T | T |
| K20 | **DP optimizations**: divide-and-conquer DP, Knuth, convex hull trick, Li Chao | — | **D** | S | — | — |
| K21 | Sum over subsets (SOS) DP | — | S | S | — | — |

### L. Greedy

| # | Topic | Pattern name (banks) | S1 | S3 | Textbooks | banks |
|---|---|---|---|---|---|---|
| L1 | The exchange argument and the "greedy stays ahead" proof | — | — | S | **D(S4 ch4)** | — |
| L2 | Interval scheduling and interval partitioning | Merge Intervals | — | **D(6.2)** | D | D |
| L3 | Scheduling to minimize lateness; tasks and deadlines | — | **D** | D(6.3) | D | S |
| L4 | Fractional knapsack and the exchange it permits | Greedy | — | S | D | S |
| L5 | Huffman coding | — | — | **D(6.5)** | D | S |
| L6 | Matroids: the structure that makes greedy correct | — | — | — | **D** | — |
| L7 | Greedy on sorted input: gas station, jump game, candy, partition labels | Greedy | — | S | S | **D** |
| L8 | Where greedy fails, and how to detect it before the interview ends | — | — | T | T | — |

### M. Bit manipulation

| # | Topic | Pattern name (banks) | S1 | S3 | banks |
|---|---|---|---|---|---|
| M1 | Two's complement, shifts, masks, and the sign-extension traps | Bit manipulation | **D** | **D(10.1–10.2)** | D |
| M2 | Popcount, lowest set bit, clearing the lowest set bit, power-of-two tests | — | D | D | D |
| M3 | Sets as bitmasks; **enumerating submasks** in O(3ⁿ) | — | **D** | **D(10.3)** | S |
| M4 | XOR properties: self-inverse, prefix XOR, single/two non-repeating numbers | Bitwise XOR | D | D | **D** |
| M5 | XOR basis / linear basis over GF(2); maximum XOR subset | — | **D** | S | — |
| M6 | XOR tries for maximum-XOR-pair queries | — | S | — | T |
| M7 | Gray code | — | **D** | S | S |
| M8 | Bit tricks in DP and in the standard library (`__builtin_*`) | — | D | D(10.4) | S |

### N. Range queries and offline techniques

| # | Topic | Pattern name (banks) | S1 | S3 | banks |
|---|---|---|---|---|---|
| N1 | Static prefix sums; immutable-array queries | Prefix Sum | T | D(9.1) | T |
| N2 | **Sparse table** and idempotent RMQ in O(1) | — | **D** | D | — |
| N3 | **Fenwick / binary indexed tree**; point update, prefix query; 2-D BIT | Binary Indexed Tree | **D** | **D(9.2)** | S |
| N4 | **Segment tree**: build, query, point update; arbitrary merge monoid | Segment Tree | **D** | **D(9.3)** | S |
| N5 | **Lazy propagation** and range updates | Segment Tree | D | **D(28.1)** | — |
| N6 | Dynamic/implicit segment trees; persistent segment trees | — | **D** | D(28.2) | — |
| N7 | **Sqrt decomposition** and **Mo's algorithm** | MO's Algorithm | **D** | **D(27.3)** | S |
| N8 | Offline query processing; sorting queries; small-to-large merging | — | D | S | — |
| N9 | Treaps / balanced BSTs as sequence containers; implicit keys | Ordered Set | **D** | S | S |
| N10 | Ordered statistics containers (`SortedList`, `TreeMap`, policy trees) | Ordered Set | S | D(4.5) | T |
| N11 | Dynamic connectivity (offline, DSU rollback) | — | S | P | — |

### O. Strings

| # | Topic | Pattern name (banks) | S1 | S3 | Textbooks | banks |
|---|---|---|---|---|---|---|
| O1 | String representation, immutability, and the cost of concatenation | — | — | S | S | T |
| O2 | Naive matching and its worst case | — | — | S | D | S |
| O3 | **KMP**: the prefix function, borders, periods | — | **D** | S | **D** | S(S15) |
| O4 | **Z-algorithm** | — | **D** | **D(26.4)** | — | S |
| O5 | **Rabin–Karp** and rolling hashes | — | **D** | D(26.3) | D | S |
| O6 | Boyer–Moore and the bad-character/good-suffix heuristics | — | — | — | D | — |
| O7 | **Aho–Corasick**: multi-pattern matching on a trie with failure links | — | **D** | — | T | — |
| O8 | **Manacher's algorithm**: all palindromic substrings in O(n) | — | **D** | — | — | — |
| O9 | **Suffix arrays** + LCP (Kasai); suffix automaton; suffix tree | — | **D** | S | **D(S5 4e)** | — |
| O10 | Anagrams, frequency signatures, and grouping | Hash Maps | — | S | — | **D** |
| O11 | Palindrome checking, longest palindromic substring/subsequence | Palindromic Subsequence | S | S | S | **D** |
| O12 | Lyndon factorization and minimal rotation (Booth/Duval) | — | **D** | — | — | — |
| O13 | Regular-expression and wildcard matching as DP | — | — | — | S | **D** |
| O14 | Word break, word ladder, and dictionary search with tries | Trie | — | — | — | **D** |

### P. Mathematics for algorithms

| # | Topic | Pattern name (banks) | S1 | S3 | banks |
|---|---|---|---|---|---|
| P1 | Integer overflow, floating point, and safe comparison | — | S | **D(1.3)** | T |
| P2 | GCD/LCM, Euclid, extended Euclid, Bézout | Math | **D** | D(21.1) | T |
| P3 | Primes: trial division, sieve, linear sieve, segmented sieve | Math | **D** | D | T |
| P4 | Factorization; divisor counting and sums; Euler's totient | — | **D** | D | S |
| P5 | Modular arithmetic; inverses; Fermat/Euler; CRT | — | **D** | D(21.2) | S |
| P6 | **Binary exponentiation** and matrix exponentiation for recurrences | — | **D** | **D(23.2)** | S |
| P7 | Combinatorics: nCr, Pascal, Catalan, stars and bars, inclusion–exclusion | Counting | **D** | **D(ch22)** | S |
| P8 | Burnside/Pólya counting under symmetry | — | **D** | D(22.4) | — |
| P9 | Probability and expectation in algorithm analysis; linearity | — | S | **D(ch24)** | — |
| P10 | **Game theory**: impartial games, Nim, **Sprague–Grundy** | — | **D** | **D(ch25)** | — |
| P11 | Matrices, Gaussian elimination, rank, determinant | — | **D** | D(ch23) | — |
| P12 | **FFT/NTT** and convolution | — | **D** | S | — |
| P13 | Numerical search: ternary search, Newton, binary search on reals | — | **D** | S | S |

### Q. Geometry

| # | Topic | Pattern name (banks) | S1 | S3 | banks |
|---|---|---|---|---|---|
| Q1 | Points, vectors, cross product, orientation test | Math & Geometry | **D** | **D(29.2)** | S |
| Q2 | Segment intersection and the robustness problem | — | **D** | D | S |
| Q3 | Polygon area, point-in-polygon, convexity tests | — | **D** | D(29.3) | — |
| Q4 | **Convex hull** (Andrew's monotone chain, Graham scan) | — | **D** | **D(30.3)** | — |
| Q5 | Closest pair of points by divide and conquer | — | **D** | **D(30.2)** | — |
| Q6 | Sweep line for intersections and rectangle union area | — | **D** | D(ch30) | — |
| Q7 | Manhattan/Chebyshev distance and the 45° rotation trick | — | **D** | D(29.4) | S |
| Q8 | Convex hull trick / Li Chao tree (as DP optimization) | — | **D** | — | — |

### R. Design and "systems-flavoured" interview topics

| # | Topic | Pattern name (banks) | banks | Notes |
|---|---|---|---|---|
| R1 | LRU / LFU cache design | Design | **D** | Also CLRS 4e ch. 27 as an *online* problem — the better framing |
| R2 | Design: median from data stream, hit counter, rate limiter, Twitter feed | Design / Two Heaps | **D** | Bank-only; textbooks do not name these |
| R3 | Iterator design: BST iterator, nested list iterator, peeking iterator | — | **D** | Bank-only |
| R4 | Randomized structures: insert/delete/getRandom in O(1); reservoir sampling; shuffle | — | **D** | Reservoir sampling is tier-2 (Vitter 1985) |
| R5 | Concurrency-flavoured problems (bounded buffer, print in order, dining philosophers) | Multi-threaded | S | S11 lists it; decide in Phase 2 whether it belongs in this course or a future OS course |

---

## 3. Pattern-taxonomy reconciliation

Four taxonomies (S11, S12, S13, S15) and one rule set (S14) were merged. The result, which
Phase 3 turns into parts and chapters:

**Every bank name maps to exactly one universe row or is rejected with a reason.** Rejections
so far, all to be confirmed at the Phase 2 gate:

| Bank name | Disposition | Reason |
|---|---|---|
| "Hash Maps" (S11) | → E4 | It is a data structure, not a pattern; the *pattern* is "trade space for a lookup", taught at E4 |
| "Graphs" (S11) | dissolved into I1–I7 | Not a pattern at any usable granularity |
| "Subsets" (S11) | → J3 | Duplicate of Backtracking's first application |
| "Level Order Traversal" (S11) | → H2 | Duplicate of Tree BFS in the same list |
| "Fibonacci Numbers" (S11) | → K4 | A DP example, not a pattern |
| "Clone" (S11) | → G5 + I1 | Two unrelated problems (deep copy of list; clone graph) filed as one pattern |
| "Simulation" (S11) | → B13 | Real, but it is the absence of a pattern; taught as such |
| "Multi-threaded" (S11) | deferred | Open question O4: belongs to a future OS/concurrency course |
| "Advanced Java" (S8 lecture 4) | out | Language-specific, not algorithmic |

**Names the banks have no word for, which this course must name itself.** These are the rows
above with a blank pattern column, and there are far more of them than the banks admit —
amortized reasoning (A5), lower bounds (A6), online/competitive analysis (A12), the exchange
argument (L1), matroids (L6), SRTBOT (K2), pseudopolynomiality (K7), DP optimizations (K20),
Euler-tour flattening (H15), heavy-light decomposition (H14), 2-SAT (I17), flow *modelling*
as distinct from flow *algorithms* (I21), suffix structures (O9), Sprague–Grundy (P10),
convex hull trick (Q8). **This list is the course's actual claim to being better than the
banks**, and §1 of the Charter should say so in one sentence.

**Ordering conflict to resolve in Phase 3.** The banks order by difficulty of the *problems*
(arrays → two pointers → sliding window → … → DP → advanced graphs). The textbooks order by
dependency of the *ideas* (analysis → recursion → sorting → structures → graphs → paradigms).
S12 publishes a prerequisite graph and is the only bank that does. The Blueprint must pick
one spine and publish the dependency graph as a figure; the recommendation carried into
Phase 1 is **ideas-first with a pattern index**, because a course that can be read only in
one order but searched in any order serves both the learner and the interviewee.

---

## 4. Reading list: origins to consult in Phase 4 (§3.3 requires ≥1 primary + ≥1 real system per chapter)

Every named idea in §2 needs its origin stated (§11.1). The list below is what Phase 4 must
read, not what has been read. Grouped by the part it will serve.

**Analysis.** Knuth 1976 (the O/Ω/Θ notation note) · Hartmanis & Stearns 1965 (complexity
classes) · Cook 1971 and Karp 1972 (NP-completeness, the 21 problems) · Tarjan 1985
(amortized complexity, the potential method) · Sleator & Tarjan 1985 (amortized efficiency
of list update and paging — the origin of competitive analysis) · Akra & Bazzi 1998.

**Sorting and selection.** Williams 1964 (heapsort) · Floyd 1964 (build-heap) · Hoare 1961
(quicksort; quickselect) · Blum, Floyd, Pratt, Rivest & Tarjan 1973 (median of medians) ·
Musser 1997 (introsort) · Peters 2002 (Timsort, the CPython listsort note) · Bentley & McIlroy
1993 (engineering a sort function).

**Hashing.** Carter & Wegman 1979 (universal hashing) · Pagh & Rodler 2001 (cuckoo hashing) ·
Bloom 1970 · Flajolet et al. 2007 (HyperLogLog) · Cormode & Muthukrishnan 2005 (Count-Min) ·
Vitter 1985 (reservoir sampling).

**Trees.** Adelson-Velsky & Landis 1962 (AVL) · Bayer & McCreight 1972 (B-trees) · Guibas &
Sedgewick 1978 (red-black) · Seidel & Aragon 1996 (treaps) · Pugh 1990 (skip lists) · Morris
1979 (threaded traversal) · Fredman & Tarjan 1987 (Fibonacci heaps) · Bender & Farach-Colton
2000 (the LCA problem revisited) · Sleator & Tarjan 1983 (link/cut trees; HLD's ancestor).

**Graphs.** Dijkstra 1959 · Bellman 1958 / Ford 1956 · Floyd 1962 / Warshall 1962 · Johnson
1977 · Kruskal 1956 · Prim 1957 (and Jarník 1930) · Tarjan 1972 (DFS, SCC, bridges) · Kosaraju
(unpublished; Sharir 1981) · Hopcroft & Tarjan 1973 (biconnectivity) · Kahn 1962 (topological
sort) · Hierholzer 1873 (Eulerian circuits) · Ford & Fulkerson 1956 · Edmonds & Karp 1972 ·
Dinic 1970 · Goldberg & Tarjan 1988 (push-relabel) · Hopcroft & Karp 1973 · Kuhn 1955
(Hungarian) · Gale & Shapley 1962 (stable marriage) · Aspvall, Plass & Tarjan 1979 (2-SAT) ·
Hart, Nilsson & Raphael 1968 (A*) · Karger 1993 (min cut) · Stoer & Wagner 1997 · Tarjan 1975
(union–find and the inverse Ackermann bound).

**Dynamic programming.** Bellman 1952/1957 (the name and the principle of optimality) ·
Wagner & Fischer 1974 (edit distance) · Hirschberg 1975 (linear-space LCS) · Held & Karp 1962
(TSP by subsets) · Knuth 1971 (optimal BSTs, the Knuth optimization) · Yao 1980 (quadrangle
inequality) · Fredman 1975 / Schensted 1961 (LIS structure).

**Greedy and matroids.** Huffman 1952 · Edmonds 1971 (matroids and the greedy algorithm) ·
Rado 1957 / Whitney 1935 (matroid origins) · Graham 1966 (list scheduling).

**Strings.** Knuth, Morris & Pratt 1977 · Boyer & Moore 1977 · Karp & Rabin 1987 · Aho &
Corasick 1975 · Manacher 1975 · Weiner 1973 (suffix trees) · McCreight 1976 · Ukkonen 1995 ·
Manber & Myers 1990 (suffix arrays) · Kasai et al. 2001 (LCP) · Kärkkäinen & Sanders 2003
(DC3) · Blumer et al. 1985 (suffix automaton) · Duval 1983 (Lyndon).

**Math and geometry.** Eratosthenes (c. 240 BCE) · Euclid, *Elements* VII · Cooley & Tukey
1965 (FFT) · Sprague 1935 / Grundy 1939 · Bouton 1901 (Nim) · Graham 1972 (convex hull) ·
Andrew 1979 (monotone chain) · Shamos & Hoey 1975 (closest pair; sweep line) · Bentley &
Ottmann 1979 · Pick 1899.

**Real systems and reference implementations** (§3.3 requires one per chapter; these are the
ones the course will name): CPython `listobject.c` (Timsort) and `dictobject.c` (compact
dicts, open addressing with perturbation); OpenJDK `java.util.Arrays.sort` (dual-pivot
quicksort for primitives, Timsort for objects), `HashMap` (treeification at 8 entries),
`PriorityQueue`, `TreeMap` (red-black), `ArrayDeque`, `LinkedHashMap` (the real LRU);
C++ libstdc++ `std::sort` (introsort), `std::stable_sort`, `std::nth_element`,
`std::priority_queue`, `__builtin_popcount`; Go `sort.Sort` (pdqsort since 1.19) and
`container/heap`; Redis ziplist/listpack, skiplist for sorted sets; PostgreSQL GIN/B-tree;
Linux `lib/sort.c` (heapsort) and the rbtree in `lib/rbtree.c`; SQLite's B-tree; Lucene's
FST and skip lists.

---

## 5. Topics the sources mention but do not explain — candidate gaps for Phase 2

§4 Phase 0 requires this list. Items are gaps in *the sources as read*, and each must get a
core / supporting / mentioned / out decision in Phase 2.

**Gaps in the interview banks that the universities and papers fill.** Amortized analysis as
a proof technique; lower bounds; randomized analysis; online/competitive analysis; matroids;
pseudopolynomial time; the correctness argument for any greedy algorithm; why union–find's
bound involves the inverse Ackermann function; anything about flows, matchings, suffix
structures, game theory, FFT, or geometry beyond basic coordinate arithmetic.

**Gaps in all sources, which the course must source fresh from tier 3.** What the standard
libraries actually run and why (Timsort's galloping and minrun; dual-pivot's pivot choice;
the HashMap treeification threshold; pdqsort's pattern detection) — every bank says "sorting
is O(n log n)" and stops. Cache effects and constant factors (why a flat array beats a linked
list at equal asymptotics, why binary search loses to linear scan below ~64 elements, why a
B-tree exists at all). Numeric hazards in interview code (Python's arbitrary precision vs
Java's `int` overflow in `(lo+hi)/2`; the 2006 Java binary-search overflow bug is the
canonical example and is worth a callout of its own). Recursion depth limits and how each
language fails (Python's 1000-frame default; JVM stack sizes).

**Gaps that are genuinely contested and must be taught as a debate (§3.5).** Whether
"patterns" are a good way to learn algorithms at all — the strongest argument against is that
pattern matching produces recognition without transfer, and the course should state its own
answer rather than assume it. Whether interview algorithm questions predict engineering
performance. Whether to teach recursion or iteration first.

**Topics named by exactly one source and therefore at risk of being dropped silently.**
Geometric applications of BSTs (S8 only) · multiplicative weights (S8 only) · streaming
algorithms (S10 only) · linear programming and duality (S5, S10 only) · online algorithms
(S5, S10 only) · Burnside/Pólya (S1, S3 only) · Montgomery multiplication (S1 only) ·
Lyndon factorization (S1 only) · D'Esopo-Pape (S1 only) · Stern-Brocot (S1 only).

**Deliberately not sourced yet, pending the Phase 1 Charter.** Company-specific frequency
data (which problems are actually asked where). It is tier 6, it rots within months, and no
public source for it is verifiable. Recommendation: the course names *classic* problems and
never claims frequency.

---

## 6. Open items for the owner gate

| # | Item | Impact if unresolved |
|---|---|---|
| **O1** | CLRS 4th-edition chapter numbering for chapters 1–24 and 30–35 is unverified; only 25–29 and the 3e scheme are confirmed | Low. The course cites CLRS by topic, not number, until Phase 2 confirms. Flagged so no chapter silently asserts a wrong number |
| **O2** | Skiena 3e per-chapter TOC unverified (publisher page behind auth) | Low. Affects only the field-guide chapter's design, which Phase 3 specifies |
| **O3** | CMU 15-451 Fall 2026 lecture calendar is behind CMU authentication | Low. The published topic list is enough for the Phase 2 audit |
| **O4** | Does concurrency (S11's "Multi-threaded", CLRS 4e ch. 26 parallel algorithms) belong in this course or a future OS course? | Medium. Affects the Gap Matrix and the part structure. §2 of the guide allows "out because it belongs to course X" **only if course X exists in COURSE_PLAN.md** — and the CS Fundamentals track is being created by this course, so the owner can create the slot |
| **O5** | The §0.3 decision: universe keyed on textbook topic with pattern names as an attribute, rather than keyed on pattern | **High. This is the structural decision of the course.** Rejecting it means rebuilding §2 |
| **O6** | Are Python + Java also the languages of the *body* code blocks, or only the capstone? | Medium. The guide's §10.2 `code-tabs` device is two-language; the recommendation is to use Python + Java throughout, and to name C++ only where the STL is the thing being discussed (ordered sets, `nth_element`, `__builtin_popcount`) |
| **O7** | `marketing/PLAN.md` personas predate both AI-track courses and this one | Low for Phase 1, which will re-cut them, but the marketing plan itself needs an update pass eventually |

---

## 7. Self-check against §4 Phase 0

- [x] Per-source tables at section granularity, with topics, named ideas, and (where the source carries them) numbers, exercises and figures — §1. Numbers are sparse because these sources are catalogues and syllabi, not measurement-bearing books; the numbers this course needs will be measured in Phase 4 (§5 lists them).
- [x] Merged deduplicated topic list with coverage depth per source — §2, 18 groups, ~160 rows.
- [x] Every paper, system and origin the sources cite, with why it matters — §4.
- [x] Topics the sources mention but do not explain — §5.
- [ ] **Owner gate: "nothing in the books is missing from the map."** There are no books. The equivalent check the owner should run is: *pick any algorithm or pattern you would expect a complete DSA course to teach, and find it in §2.* If it is not there, Phase 0 is not done.
