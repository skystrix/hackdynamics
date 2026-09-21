# DSA By Patterns — Phase 3 Deliverable: Course Blueprint

**Status:** Phase 3 complete, awaiting owner approval. **Approval freezes chapter numbers** —
the platform keys progress and links on them (§4 Phase 3).
**Date:** 2026-09-20. Phases 0, 1 and 2 gated 2026-09-20.

**Shape:** 7 parts · **57 chapters** (49 content + 8 capstone) · **142 machines** · 3 free chapters ·
Python + Java throughout. Orphan list **empty**, verified mechanically (§6).

---

## 0. Declared deviations from the guide

| Guide says | This course | Why |
|---|---|---|
| §2: 24–36 chapters | **57** | Approved at Phase 0. 155 core rows (Phase 2 §4). At 3–4 core rows per chapter this is the floor, not an indulgence; the alternative is demoting rows a university final examines |
| §2: 4–6 parts | **7** | One over. A 57-chapter course in 6 parts gives ~10 chapters per part with no coherent spine for the last third |
| §2: ≥1 machine per chapter | **142 machines over 57 chapters** | Every chapter has at least one; the median is 2 and keystones carry 3–4. **This is 1.75× the 81 machines of *LLM In Depth* and is the single largest risk in this Blueprint — see §7** |
| §9: 5–8 capstone chapters | **8** | In range, at the top of it |
| §2: median 2,100 words | **~2,600 median, ~168,000 total body words** | Mechanism-chapter floor of 1,800 per §2; keystones to 5,000 |

**Part 1 merges foundations with the linear scans, and that is the course's structural bet
made visible in the table of contents.** Two pointers, sliding windows and the monotonic stack
are taught as corollaries of Chapter 4's amortized analysis, in the same part, rather than as
array tricks in a later one. Phase 2 §7 records the disagreement with every interview bank;
this is where the decision becomes architecture. If the owner rejects it, Part 1 splits in two
and the course becomes 8 parts.

---

## 1. The parts

```
window.PARTS = [ ... ]
```

**Part 1 — Foundations: The Machine and the Measure** (Chapters 1–12)
> Before you can say an algorithm is fast you have to say what a step is, and before you can
> say a scan is linear you have to prove that each element is touched once. This part builds
> the measuring instruments, then turns them immediately on the patterns everyone else calls
> tricks.

**Part 2 — Order and Lookup** (Chapters 13–17)
> Sorting and searching are the two things computers spend most of their time doing, and both
> are settled questions with unsettling answers: a bound that says no comparison sort can do
> better, and a standard library that quietly ignores everything you were taught.

**Part 3 — The Paradigms** (Chapters 18–23)
> Three ways to be systematic about a search: try everything and prune, remember what you
> already computed, or commit to the locally best move and prove you can get away with it.
> Every hard problem in the rest of the course is one of these three wearing a costume.

**Part 4 — Hierarchies and Ranges** (Chapters 24–31)
> A tree is what you build when a list is too slow and a hash is too forgetful. This part goes
> from the traversal every interview opens with to the segment tree that answers a range
> question about a million elements in twenty comparisons.

**Part 5 — Graphs** (Chapters 32–39)
> Almost every problem that looks like it is about something else is about a graph. One
> traversal, one relaxation step and one residual network account for this entire part; the
> difficulty is never the algorithm, it is seeing the graph.

**Part 6 — The Edges and the Engineer** (Chapters 40–49)
> Strings, numbers and shapes, the three domains with their own algorithms; the boundary where
> problems stop being solvable; and then the part of the subject no textbook covers — what to
> do in the room, what your language actually costs you, and where the field goes next.

**Part 7 — Build It: The Structures Library** (Chapters 50–57)
> Eight layers, two languages, one rule: each structure is fuzzed against the one your
> standard library ships until they stop disagreeing. At the end you benchmark yours against
> theirs and explain every gap with a mechanism from this course.

---

## 2. Reading conventions used below

- **Archetype** per §6.3: *orientation* · *mechanism* · *engineering reality* · *practitioner handbook* · *build-it*.
- **Machines** are specified per §7.5: `vizKey` — kind — state — controls — **discovery** — initial note. All keys are prefixed `dsa` for site-wide uniqueness (§10.3).
- **Rows:** the Phase 2 Topic Universe rows this chapter covers. Verified mechanically in §6; the orphan list there is computed, not asserted.
- **Outcomes:** Charter §4 identifiers.
- **Words:** estimated body word count, excluding terms, quiz and exercises.
- Every chapter carries 10–20 terms, 8–12 quiz questions and 3–6 exercises per §8; only departures from that are noted.

---

# PART 1 — Foundations: The Machine and the Measure

## Chapter 1 — The Shape of the Subject
**Archetype:** orientation · **FREE** · **Words:** 3,200 · **Prereq:** none

**Blurb.** Every practice sheet hands you a list of patterns and tells you to recognize them.
This chapter asks the question the sheets skip: what is a pattern, why do some of them
transfer to problems you have never seen and others do not, and what are you actually
learning when you learn one? You will meet the three questions that organize the whole
subject, take one problem through four different solutions to watch a technique earn its
keep, and get the map of the machine you are about to descend into.

**Sections**
1. *One problem, four answers* — maximum subarray solved brute-force, divide-and-conquer, prefix-sum and Kadane; the same answer at four costs, timed in front of you.
2. *The three questions* — is the input ordered? is the structure static or changing? do you need the value or the thing itself? Nearly every choice in this course is one of these.
3. *What a pattern is, and what it is not* — the recognition-without-transfer critique stated at full strength, and this course's answer: every pattern arrives with its proof and its failure case.
4. *The map* — the seven parts as a descent, and which structures are built in Part 7.
5. *How to use this course* — machines, quizzes, exercises, the two language tabs, the capstone.

**Machines**
- `dsaFourSolutions` — **comparator** — state: array of 24 values, chosen algorithm, step index, operation counter. Controls: pick algorithm (4 buttons), input shape (random / all-negative / one-big-positive), step / run / reset. **Discovery:** set the input to all-negative and find the two solutions that return 0 instead of the right answer. Note: "Four algorithms, one problem. Run each on the same array and watch the operation counter."
- `dsaCourseMap` — **inspector** — state: hovered part. Controls: hover or tab to each of the seven parts and the capstone. **Discovery:** find the three chapters that are free. Note: "Hover a part to see what it teaches and which structures it builds."

**Figures**
- The three questions as a decision trident, with example problems on each branch.
- The operation-count curve of the four solutions from n=10 to n=10,000, log-log.

**Rows:** A18, S7, S8, B6 · **Outcomes:** E21 · **Terms:** 12

---

## Chapter 2 — What a Running Time Is
**Archetype:** mechanism · **FREE** · **Words:** 3,400 · **Prereq:** 1

**Blurb.** You have written O(n) a thousand times. This chapter asks what the O means, what
the n counts, and what a "step" is on a machine that has caches, branch predictors and a 64-bit
word. You will find out why input size is measured in bits rather than elements, which is the
single distinction that later makes the knapsack algorithm everyone calls polynomial not
polynomial, and you will meet the model this whole course computes in — along with the
honest admission that it is a choice, and that other choices give other answers.

**Sections**
1. *Counting what?* — the word-RAM model: constant-time operations on words of w bits, w ≥ log n, and what that assumption buys and hides.
2. *Asymptotic notation as a claim about sets* — O, Ω, Θ, o, ω defined precisely; why every linear algorithm is also O(n²) and why saying so is useless rather than wrong.
3. *Input size in bits* — n numbers versus a number n; the forward reference to Chapter 20's pseudopolynomial result.
4. *Worst, average, expected, amortized* — four different claims, four different meanings of "average", and which one a benchmark measures.
5. *In place, and other words people use loosely* — a definition of in-place that survives contact with recursion's stack frames.
6. *The model is a choice* — external-memory, cache-oblivious, and **parallel** models named; one paragraph on the concurrent model and a forward pointer to *Operating Systems in Depth*, which owns it.

**Machines**
- `dsaGrowthRaces` — **tuner** — state: n slider (1…10⁶, log), selected growth functions. Controls: n slider; toggle each of log n, √n, n, n log n, n², 2ⁿ, n!; toggle "operations" vs "wall time at 10⁹ ops/sec". **Discovery:** find the n at which n² stops finishing within one second, then find it for 2ⁿ. Note: "Drag n and watch which curves leave the chart. The y-axis is operations; switch it to seconds."
- `dsaBigOQuiz` — **playground** — state: a claim like "3n² + 5n ∈ O(n²)", learner's verdict. Controls: true/false, next claim, show witness. **Discovery:** find the claim that is true but useless. Note: "Each claim is either true or false. Decide, then reveal the constants c and n₀ that settle it."

**Figures**
- The word-RAM: a tape of w-bit words with the constant-time operation set listed beside it.
- The Θ sandwich: f(n) between c₁g(n) and c₂g(n) past n₀, drawn on real axes.
- The same array, sized "n elements" and "N bits", with the two numbers written out.

**Rows:** A1, A2, A4, A8 (+ R5 forward pointer) · **Outcomes:** E1, E2, A2 · **Terms:** 16

---

## Chapter 3 — Recurrences and Divide and Conquer
**Archetype:** mechanism · **Words:** 3,000 · **Prereq:** 2

**Blurb.** A recursive algorithm's cost is a recurrence, and a recurrence is a puzzle with
three standard solutions and one famous shortcut that does not always apply. You will solve
the same recurrence by unrolling it, by drawing its tree, and by the master theorem, then find
the recurrences that defeat the master theorem and what to do about them. Then you will use
all of it on the paradigm that generates recurrences in the first place.

**Sections**
1. *Where recurrences come from* — mergesort's T(n) = 2T(n/2) + Θ(n), written from the code.
2. *Substitution* — guess and verify by induction, including the trap where the induction "works" for a wrong guess.
3. *The recursion tree* — per-level cost, level count, and reading the answer off the shape; three trees whose answers are root-dominated, leaf-dominated and balanced.
4. *The master theorem* — the three cases as a competition between n^log_b a and f(n), stated with its regularity condition.
5. *When the master theorem does not apply* — T(n) = T(n/3) + T(2n/3) + n; Akra–Bazzi named as the general tool.
6. *Divide and conquer as a paradigm* — the shape, and closest-pair-of-points as the example where the combine step is the whole difficulty.

**Machines**
- `dsaRecursionTree` — **builder** — state: a, b, f(n) chosen; expanded depth. Controls: sliders for a (1–8) and b (2–8), picker for f(n) ∈ {1, log n, n, n², n³}; expand/collapse a level. **Discovery:** set a=2, b=2, f=n and find the level where the per-level cost stops changing; then set a=4, b=2, f=n and find which level dominates. Note: "Each level's total cost is printed on the right. Expand levels until you can see which one dominates."
- `dsaMasterTheorem` — **comparator** — state: a, b, f. Controls: same three inputs; "which case?" reveal. **Discovery:** find a setting the master theorem cannot decide. Note: "Set a, b and f, then predict the case before revealing it."
- `dsaClosestPair` — **stepper** — state: 30 points, the divide line, the strip, best pair so far. Controls: step / back / reset / re-randomize. **Discovery:** count how many points in the strip are ever compared to one another, and find the constant. Note: "Step through the divide, the two recursive answers, and the strip. Watch the strip comparison count."

**Figures**
- Three recursion trees side by side: root-dominated, balanced, leaf-dominated.
- The closest-pair strip, with the 7-point bounding argument drawn.

**Rows:** A3, J2, Q5 · **Outcomes:** E3 · **Terms:** 14

---

## Chapter 4 — Amortized Analysis: Paying in Advance
**Archetype:** mechanism · **KEYSTONE** · **Words:** 4,600 · **Prereq:** 2, 3

**Blurb.** A dynamic array doubles when it fills, which costs O(n), and yet appending is
O(1). A stack-based scan pushes and pops in a loop that looks nested, and yet it is linear.
These are the same result, and this chapter proves it three ways. This is the most important
chapter in Part 1, because the three patterns every interview sheet lists as separate
tricks — two pointers, the monotonic stack, the sliding-window minimum — are all corollaries
of what you learn here, and the next three chapters collect them.

**Sections**
1. *The problem: a worst case that never repeats* — the doubling array, counted naively and counted honestly.
2. *Aggregate analysis* — total cost over n operations, divided by n; the geometric series that makes doubling work and growth-by-a-constant fail.
3. *The accounting method* — charging each cheap operation extra and banking the credit; the invariant that the bank never goes negative.
4. *The potential method* — Φ as a function of the data structure's state, the telescoping sum, and why this is the version that generalizes.
5. *Three patterns, one theorem* — each element enters once and leaves once: the two-pointer scan, the monotonic stack, the sliding-window deque, each given its potential function here and its chapter next.
6. *What amortized does not mean* — not average-case, not expected, and no guarantee about any single operation. The real-time systems caveat.
7. *In the real world* — CPython's `list` over-allocation pattern and Java's `ArrayList` 1.5× growth, read from the source, with the different constants and the same asymptotics.

**Machines**
- `dsaAmortizedArray` — **builder** — state: array of capacity c, size n, total copy count, growth policy. Controls: append ×1, append ×10, reset; growth policy picker (×2, ×1.5, +1, +16). **Discovery:** set growth to "+1" and watch the total copy count go quadratic; find the policy where the amortized cost stops being constant. Note: "Append elements and watch capacity jump. The counter at the right is total elements ever copied."
- `dsaPotential` — **stepper** — state: operation sequence, actual cost, Φ, amortized cost, running totals. Controls: step / back / reset; choose the sequence (worst case, alternating, random). **Discovery:** find the operation where actual cost spikes and confirm the amortized cost did not. Note: "Three columns: what it cost, what changed in the bank, what you were charged. Step and watch them stay in balance."
- `dsaEnterLeaveOnce` — **stepper** — state: an array, a monotonic stack, a pointer; push/pop event log. Controls: step / back / reset; input shape picker. **Discovery:** count total pushes and total pops over the whole run and confirm each is at most n, despite the nested-looking loop. Note: "The inner loop looks nested. Count the pushes and pops and see what it really is."

**Figures**
- Cost per append against operation index, with the doubling spikes, and the flat amortized line drawn through it.
- The bank-balance diagram: credits deposited by cheap ops, withdrawn by the expensive one.
- The "enter once, leave once" timeline for a two-pointer scan.

**Rows:** A5, A4 · **Outcomes:** E4, A2 · **Terms:** 15

---

## Chapter 5 — Lower Bounds and the Role of Randomness
**Archetype:** mechanism · **Words:** 2,900 · **Prereq:** 3, 4

**Blurb.** Everything else in this course proves that some algorithm is fast enough. This
chapter proves that no algorithm can be, which is a different and rarer kind of argument, and
the only one that tells you when to stop looking. Then it introduces the tool that gets around
several lower bounds by refusing to be predictable: randomness, and the two quite different
promises a randomized algorithm can make.

**Sections**
1. *The decision tree* — any comparison sort is a binary tree whose leaves are permutations; n! leaves force depth Ω(n log n).
2. *What the bound assumes* — comparisons only. Name the assumption, because Chapter 15 breaks it.
3. *Adversary arguments* — proving a bound by playing the input; finding the maximum takes n−1 comparisons and here is why.
4. *Las Vegas and Monte Carlo* — always right and probably fast, versus always fast and probably right; which one quicksort is and which one Karger's min-cut is.
5. *Linearity of expectation* — the one probability tool this course leans on, proved and then used on randomized quicksort's expected depth.
6. *Randomness as a defence* — the forward pointer to Chapter 17: hash tables need randomness not for speed but for safety against an adversary.

**Machines**
- `dsaDecisionTree` — **inspector** — state: n ∈ {3,4,5}, expanded tree. Controls: n picker; click a node to see its comparison and the permutations still possible. **Discovery:** for n=4, count the leaves and find the shallowest possible tree depth, then compare it to ⌈log₂ 24⌉. Note: "Each node is one comparison. Click to see which orderings are still alive below it."
- `dsaLasVegasMonteCarlo` — **simulator** — state: 200 trials of each kind, outcome histogram. Controls: run 1 / run 100 / reset; algorithm picker (randomized quicksort vs Karger). **Discovery:** find the run where Monte Carlo returned a wrong answer, and confirm Las Vegas never did. Note: "Run both many times. One varies in time, the other in correctness. Watch which."

**Figures**
- The comparison decision tree for n=3, complete, with all six leaves.
- Two histograms side by side: runtime spread (Las Vegas) and correctness rate (Monte Carlo).

**Rows:** A6, A7, P9 · **Outcomes:** E5 · **Terms:** 14

---

## Chapter 6 — Recursion, the Call Stack and Induction
**Archetype:** mechanism · **Words:** 3,100 · **Prereq:** 3

**Blurb.** Recursion is not a trick for tree problems, it is the way you write an algorithm
whose correctness is an induction. This chapter teaches you to write the recurrence before the
code, to see the call stack as the data structure it actually is, and to convert any recursion
into an explicit stack when the language runs out of frames — which Python does at a
depth you will hit sooner than you think.

**Sections**
1. *Recursion is induction* — base case, inductive step, and the recursive leap of faith stated as a proof obligation rather than a vibe.
2. *The call stack is a data structure* — frames, locals, return addresses; drawing the stack for a recursive traversal.
3. *Writing the recurrence first* — three worked examples where the recurrence tells you the algorithm is too slow before you write it.
4. *Tail calls and what your language does with them* — Python does not eliminate them; the JVM does not either; what that means for you.
5. *Converting recursion to iteration* — the mechanical transformation with an explicit stack, and the one case (tree traversal) where the result is genuinely nicer.
6. *Recursion depth as a failure mode* — Python's default limit, JVM stack size, and the linked-list problem that blows both.

**Machines**
- `dsaCallStack` — **stepper** — state: recursive function, argument, live stack of frames, return values flowing back. Controls: step in / step out / reset; function picker (factorial, fib, tree height, Hanoi). **Discovery:** run fib(6) and count how many times fib(2) is computed — the number that motivates Chapter 19. Note: "Step into each call. The stack grows to the right; return values flow back up."
- `dsaRecursionToStack` — **comparator** — state: same traversal, recursive and explicit-stack side by side, step-synchronized. Controls: step / reset / traversal order picker. **Discovery:** find the step at which the explicit stack holds exactly what the call stack holds. Note: "Same traversal, two implementations. Step both and compare what each is holding."

**Figures**
- A call stack mid-recursion, frames labelled with locals and return address.
- The fib(6) call tree with repeated subtrees shaded — the picture Chapter 19 repairs.

**Rows:** A9, J1, F7, S3(partial) · **Outcomes:** E1, O7 · **Terms:** 13

---

## Chapter 7 — Union–Find: The Whole Method on One Structure
**Archetype:** mechanism · **FREE** · **Words:** 3,800 · **Prereq:** 2, 4

**Blurb.** Princeton opens its entire algorithms course with this structure, and so does this
one, because union–find is the smallest thing that teaches the whole method: start with an
obvious implementation, find the workload that kills it, fix it, measure, and repeat until the
answer is a function so slow-growing that it is under 5 for every input you will ever have.
By the end you will have built four versions of the same structure and know exactly what each
change bought.

**Sections**
1. *The problem* — dynamic connectivity: are these two things connected, given a stream of connections? The naive answers and their costs.
2. *Quick-find* — find is O(1), union is O(n), and here is the workload that makes it quadratic.
3. *Quick-union* — union is fast until the tree becomes a path; the same quadratic, moved.
4. *Union by size or rank* — one line of code, and the tree depth becomes O(log n). The proof.
5. *Path compression* — flatten as you go; what it costs and why it composes with the previous fix.
6. *The α(n) result* — Tarjan 1975; what the inverse Ackermann function is, why it is under 5 for any n you can store, and why "effectively constant" is not the same as constant.
7. *What it is for* — Kruskal's algorithm (Chapter 36), connected components, and the grouping pattern every bank calls "Union Find".

**Machines**
- `dsaUnionFind` — **builder** — state: n=16 elements as a forest, chosen variant, operation counter, tree depths. Controls: union(a,b) by clicking two nodes, find(a), reset, variant picker (quick-find / quick-union / by-rank / by-rank + compression), "adversarial sequence" button. **Discovery:** run the adversarial sequence on quick-union and watch the tree become a path; switch on union-by-rank and watch the same sequence stay shallow. Note: "Click two nodes to union them. Switch variants and run the adversarial sequence on each."
- `dsaAckermann` — **tuner** — state: n slider up to 2^65536 (symbolic). Controls: n slider; toggle log* and α(n). **Discovery:** find an n for which α(n) is 5. Note: "α(n) grows so slowly it is hard to believe. Drag n as far as it goes and watch."

**Figures**
- The four variants' forests after the same operation sequence, side by side.
- Path compression before and after, one find shown flattening a chain of six.

**Rows:** I6 · **Outcomes:** E11, B5 · **Terms:** 14

---

## Chapter 8 — Two Pointers and Sliding Windows
**Archetype:** mechanism · **KEYSTONE** · **Words:** 4,400 · **Prereq:** 4

**Blurb.** Two pointers and the sliding window are the first patterns every sheet teaches and
the first ones people apply wrongly, because the templates hide the only thing that matters:
the invariant that justifies never moving a pointer backwards. This chapter derives both from
Chapter 4's amortized argument, gives each its invariant in writing, and then shows you the
problems where the window cannot shrink monotonically and the pattern silently breaks.

**Sections**
1. *Opposite ends* — the sorted-pair scan, with the invariant "no pair involving a discarded element can be the answer" and its proof.
2. *Same direction* — the read/write compaction scan; in-place duplicate removal and partitioning. **Cyclic placement** as the extreme case: when the values are a permutation of the indices, swap each one home and the scan sorts in O(n) with no comparisons, which is what "cyclic sort" means and why it only works on that one input shape.
3. *Dutch national flag* — three-way partition in one pass, Dijkstra 1976, with the loop invariant drawn as four regions.
4. *The fixed window* — sum, average and the rolling update; the off-by-one that everyone writes once.
5. *The variable window* — grow on the right, shrink on the left while the invariant is violated; why the total work is 2n and not n².
6. *When the window does not shrink monotonically* — the problems where "shrink while invalid" is wrong, and what to do instead. The pattern's failure case, which no bank prints.
7. *The costs* — every variant's time and space, and the one that needs a hash map underneath.

**Machines**
- `dsaTwoPointers` — **stepper** — state: array, left/right pointers, region shading, comparison count. Controls: step / back / reset; problem picker (pair sum, squares of sorted array, container with most water, Dutch flag). **Discovery:** on container-with-most-water, find the step where moving the taller pointer would have been wrong, and read the invariant that forbids it. Note: "Two pointers, one pass. The shaded regions are what each invariant has already ruled out."
- `dsaSlidingWindow` — **stepper** — state: array, window bounds, window contents, validity flag, work counter. Controls: step / back / reset; problem picker (longest without repeat, min size subarray sum, max consecutive ones III, longest repeating char replacement). **Discovery:** on "longest repeating character replacement", find why the window is never shrunk below its best size and what that costs in correctness. Note: "Grow right, shrink left. The counter at the bottom is total pointer movement — watch it stay under 2n."
- `dsaWindowFails` — **comparator** — state: a problem where monotone shrinking fails, two solutions. Controls: run correct / run naive / reset. **Discovery:** find the input where the naive window returns a wrong answer. Note: "The template works on the left and fails on the right. Find the input that separates them."

**Figures**
- The two-pointer invariant: array with discarded regions shaded and the surviving band labelled.
- Window growth/shrink timeline against index, with total movement counted.

**Rows:** B1, B2, B3, B4, B7, B8 · **Outcomes:** E4, O2, A8 · **Terms:** 15

---

## Chapter 9 — Prefix Sums and Difference Arrays
**Archetype:** mechanism · **Words:** 2,400 · **Prereq:** 8

**Blurb.** Precompute once, answer forever: the prefix sum is the simplest trade of space for
time in the subject, and the difference array is the same trick run backwards for updates
instead of queries. This chapter also settles Kadane's algorithm, which is a one-line dynamic
program four chapters before you meet dynamic programming, and shows you the 2-D version that
turns a rectangle-sum question into four array lookups.

**Sections**
1. *The problem* — repeated range-sum queries on an unchanging array.
2. *The prefix array* — build in O(n), answer in O(1), with the inclusive/exclusive convention stated once and kept.
3. *Two dimensions* — the inclusion–exclusion rectangle, four lookups, drawn.
4. *The difference array* — range update in O(1), read out in O(n); the dual of the prefix sum.
5. *Prefix sums with a hash map* — subarray-sum-equals-k, and why the map holds counts rather than indices.
6. *Kadane* — maximum subarray as a running decision, Bentley's 1984 column, and the all-negative edge case that breaks the careless version.
7. *What comes next* — forward pointer to Chapter 30, where the array is allowed to change.

**Machines**
- `dsaPrefixSum` — **builder** — state: array, prefix array, selected range. Controls: edit array values, drag range endpoints, toggle 1-D/2-D. **Discovery:** in 2-D, find the query rectangle where three of the four lookups are zero and explain why. Note: "Drag the range. The answer is one subtraction — watch which two cells it reads."
- `dsaKadane` — **stepper** — state: array, running sum, best so far, restart points. Controls: step / back / reset; input picker including all-negative. **Discovery:** run the all-negative input and find where the careless version returns 0. Note: "At each element: extend, or start over? Watch the running sum decide."

**Figures**
- 2-D prefix sum with the four-corner inclusion–exclusion drawn on a grid.
- Kadane's running sum with restart points marked against the input.

**Rows:** B5, B6, N1 · **Outcomes:** A2, O2 · **Terms:** 11

---

## Chapter 10 — Stacks, Queues and the Monotonic Trick
**Archetype:** mechanism · **KEYSTONE** · **Words:** 4,200 · **Prereq:** 4, 6

**Blurb.** A stack answers "what was the most recent thing", and that turns out to be the
question hiding inside next-greater-element, largest-rectangle-in-histogram, and every
expression parser ever written. This chapter builds stacks and queues honestly, then derives
the monotonic stack and the monotonic deque from Chapter 4's argument, which is why their
nested-looking loops are linear.

**Sections**
1. *The contracts* — stack, queue, deque as abstract types; array-backed and node-backed implementations with their different costs.
2. *The circular buffer* — a queue in a fixed array, and the one ambiguity (full or empty?) with its two standard fixes.
3. *Monotonic stack* — keep the stack sorted by discarding anything the new element dominates; next greater element derived, not memorized.
4. *Largest rectangle in a histogram* — the hardest classic in this pattern, worked fully, with each pop interpreted as "this bar's rectangle just ended".
5. *Monotonic deque* — sliding-window maximum in O(n); why a heap gives O(n log n) and what the deque knows that the heap does not.
6. *Min-stack and min-queue in O(1)* — carrying the minimum alongside; the queue version via two stacks.
7. *Expression parsing* — RPN evaluation and Dijkstra's 1961 shunting-yard, as the reason stacks were invented.

**Machines**
- `dsaMonoStack` — **stepper** — state: array, stack contents, result array, push/pop counters. Controls: step / back / reset; problem picker (next greater, daily temperatures, largest rectangle, trapping rain water). **Discovery:** on largest rectangle, find the pop that computes the winning rectangle and read off which bar was its left boundary. Note: "Each pop finishes one element's answer. Watch what the popped element learns on its way out."
- `dsaMonoDeque` — **stepper** — state: array, window, deque contents, emitted maxima. Controls: step / back / reset; window size slider. **Discovery:** find an element that is pushed and popped without ever being the window maximum, and say why that is still O(n). Note: "The deque holds only the candidates. Watch how few survive."
- `dsaShuntingYard` — **stepper** — state: infix input, operator stack, output queue. Controls: step / back / reset; expression picker or free text. **Discovery:** enter an expression with mixed precedence and find the step where an operator is forced out of the stack. Note: "Type an expression. Watch operators wait on the stack until precedence evicts them."

**Figures**
- The monotonic stack over a histogram, with each bar's span drawn as it pops.
- Circular buffer with head/tail and the full-versus-empty ambiguity marked.

**Rows:** F1, F2, F3, F4, F5, F6 · **Outcomes:** E4, O2 · **Terms:** 16

---

## Chapter 11 — Linked Lists and the Runner
**Archetype:** mechanism · **Words:** 2,800 · **Prereq:** 6

**Blurb.** Linked lists survive in interviews long after they stopped being the right answer
in production, and both halves of that sentence are worth understanding. You will build them
with sentinels so the edge cases disappear, reverse them in place and in groups, and meet the
runner technique — which is really cycle detection on a functional graph, with a proof most
people have never seen for why the two pointers meet where they do.

**Sections**
1. *Nodes and the cache* — why a linked list loses to an array at equal asymptotics; the measurement, not the assertion.
2. *Sentinels* — the dummy head that deletes every null check in your code.
3. *In-place reversal* — three pointers, and the k-group variant that interviews actually ask.
4. *The runner* — fast and slow pointers for the middle, the nth-from-end, and the cycle.
5. *Where they meet, and why* — Floyd's cycle detection with the modular-arithmetic proof of the cycle-entry step; Brent's variant and what it improves.
6. *Merging, partitioning and sorting* — mergesort on a list, which is the one place a list beats an array.
7. *Deep copy with random pointers* — the interleaving trick and the hash-map alternative, with both costs.
8. *The LRU cache* — the one place a doubly linked list is the right answer in production: a hash map for O(1) lookup and a list for O(1) recency reordering, with the eviction step drawn. LFU named as the harder variant, and a forward pointer to Chapter 48, where the same structure is re-read as an *online* problem with a competitive ratio.

**Machines**
- `dsaLruCache` — **simulator** — state: capacity-4 cache as a hash map plus a doubly linked list, access stream, hit/miss counters. Controls: access a key, change capacity, reset, policy toggle (LRU vs LFU vs FIFO). **Discovery:** find an access pattern where LRU evicts the key it is about to need, and confirm FIFO would have kept it. Note: "Access keys and watch the list reorder. The tail is what dies next."
- `dsaListReverse` — **stepper** — state: list nodes, prev/cur/next pointers, k for grouping. Controls: step / back / reset; mode (whole, k-group) and k slider. **Discovery:** set k=3 on a 7-node list and find what happens to the remaining 1 node. Note: "Three pointers do all the work. Step and watch which link is being rewritten."
- `dsaFloydCycle` — **stepper** — state: rho-shaped list, slow and fast positions, meeting point, phase-2 pointers. Controls: step / back / reset; tail length and cycle length sliders. **Discovery:** set tail and cycle lengths independently and confirm that restarting one pointer at the head always meets the other at the cycle entry. Note: "Slow moves one, fast moves two. After they meet, restart one at the head and watch where they meet next."

**Figures**
- The rho shape with tail length μ and cycle length λ labelled, and the meeting-point arithmetic.
- Array versus linked list traversal, cache lines drawn.

**Rows:** G1, G2, G3, G4, G5, G6, B14 · **Outcomes:** E4, O3, A3 · **Terms:** 14

---

## Chapter 12 — Intervals and the Sweep Line
**Archetype:** mechanism · **Words:** 3,000 · **Prereq:** 8, 9

**Blurb.** Interval problems look like a family of unrelated puzzles — merge these, insert
that, how many rooms do I need — until you see that all of them are one algorithm: sort the
endpoints, sweep left to right, and maintain something. This chapter teaches the sweep first
and the interval problems as its instances, which is the reverse of how every sheet does it
and the reason the technique transfers.

**Sections**
1. *The sweep* — events sorted by coordinate, a running state, and the invariant that the state is correct for everything left of the sweep line.
2. *Merging and inserting* — sort by start, extend or emit; the insert variant without re-sorting.
3. *Counting overlaps* — meeting rooms as +1/−1 events, which is a difference array in disguise.
4. *Meet in the middle* — when the sweep is over subsets rather than coordinates; 2^(n/2) instead of 2^n.
5. *The majority vote* — Boyer–Moore 1981, a one-pass scan with a beautiful invariant and a necessary second pass.
6. *Simulation problems* — spiral matrix, rotate in place, and an honest section on the pattern that is the absence of a pattern.

**Machines**
- `dsaSweepLine` — **stepper** — state: intervals, sweep position, active set, output. Controls: step / back / reset; problem picker (merge, insert, meeting rooms, union length). **Discovery:** on meeting rooms, find the sweep position where the active count peaks and confirm it equals the answer. Note: "The line sweeps right. The number below it is how many intervals are currently open."
- `dsaBoyerMoore` — **stepper** — state: array, candidate, counter. Controls: step / back / reset; input with and without a true majority. **Discovery:** run an input with no majority element and find what the algorithm returns, then explain why pass two is mandatory. Note: "One candidate, one counter. Watch the counter hit zero and the candidate change."

**Figures**
- Intervals as a timeline with the sweep line and the active-set count plotted beneath.
- Meet in the middle: two halves, two sorted lists of subset sums, and the two-pointer join.

**Rows:** B9, B10, B11, B12, B13 · **Outcomes:** A8, O1 · **Terms:** 13

---

# PART 2 — Order and Lookup

## Chapter 13 — Binary Search as an Invariant
**Archetype:** mechanism · **KEYSTONE** · **Words:** 4,000 · **Prereq:** 2

**Blurb.** Everyone can write binary search and almost nobody can write it correctly the first
time, because it is taught as a formula instead of as an invariant. This chapter gives you the
invariant, derives every variant from it — first occurrence, last occurrence, insertion
point — and walks through the overflow bug that sat undetected in a published, proved-correct
binary search for nine years, in a language you probably use.

**Sections**
1. *The invariant* — "if the answer exists it is in [lo, hi)"; every line of the loop justified by preserving it.
2. *Half-open intervals* — why [lo, hi) removes an entire class of off-by-one, with both conventions written out and one chosen.
3. *Lower bound, upper bound, equal range* — three functions, one invariant, and what each returns when the target is absent.
4. *Termination* — the measure that decreases, and the two ways to write a loop that never terminates.
5. *The overflow bug* — `(lo + hi) / 2` in Java, the 2006 disclosure, `lo + (hi − lo) / 2`, and why Python does not have this bug but has others.
6. *Rotated and mountain arrays* — searching when sortedness is only local; the invariant restated for each.
7. *Unbounded search* — exponential probing to find the range, then binary search inside it.

**Machines**
- `dsaBinarySearch` — **stepper** — state: array, lo/hi/mid, invariant band, comparison count. Controls: step / back / reset; target picker; variant (find / lower bound / upper bound); convention toggle (half-open vs closed). **Discovery:** search for a value not in the array with each variant and find the three different answers they return. Note: "The shaded band is where the answer must be. Every step must shrink it."
- `dsaSearchOverflow` — **playground** — state: lo, hi as 32-bit ints. Controls: sliders for lo and hi up to 2³¹−1; toggle the two midpoint formulas. **Discovery:** find values of lo and hi where the naive midpoint goes negative. Note: "Two formulas for the midpoint. Drag lo and hi up and watch one of them break."
- `dsaRotatedSearch` — **stepper** — state: rotated array, pivot, lo/hi/mid, decision at each step. Controls: rotation slider, target picker, step/back/reset. **Discovery:** find the rotation where the "which half is sorted" test is ambiguous because of duplicates. Note: "One half is always sorted. Step and watch the algorithm decide which."

**Figures**
- The half-open interval shrinking over five steps, with the invariant band shaded.
- The 32-bit overflow drawn on a number line, wrapping to negative.

**Rows:** C1, C2, C4, P1 · **Outcomes:** E8, O2, O7 · **Terms:** 14

---

## Chapter 14 — Binary Search on the Answer
**Archetype:** mechanism · **Words:** 3,200 · **Prereq:** 13

**Blurb.** The most powerful idea in Part 2 is that binary search does not need a sorted
array — it needs a monotone predicate. Once you see that, a whole class of optimization
problems collapses into "guess the answer, ask a yes/no question, halve the range", and
problems that look like they need cleverness need only a feasibility check you can write in
four lines.

**Sections**
1. *The generalization* — searching a monotone boolean sequence FFFFTTTT; the array was never the point.
2. *Constructing the predicate* — "can I finish in h hours if I eat k bananas an hour?"; the three worked conversions from optimization to decision.
3. *Minimize the maximum, maximize the minimum* — the two phrasings that signal this pattern, and how to tell them apart.
4. *Searching the reals* — fixed iteration count instead of equality, and the precision question that replaces termination.
5. *Ternary search* — unimodal rather than monotone; where the derivative is unavailable but the shape is known.
6. *Exponential and galloping search* — finding the bracket first; the same probe that lives inside Timsort's merge (Chapter 16).

**Machines**
- `dsaBinarySearchAnswer` — **tuner** — state: problem instance, candidate answer, predicate result, search range. Controls: problem picker (Koko bananas, ship packages in D days, split array largest sum, minimum time to make bouquets); drag the candidate; step the search. **Discovery:** drag the candidate one below the answer and confirm the predicate flips exactly once across the whole range. Note: "Drag the candidate answer. The predicate below is either yes or no — find where it flips."
- `dsaTernarySearch` — **stepper** — state: unimodal function, two probes, bracket. Controls: step / back / reset; function picker. **Discovery:** find why the algorithm discards a third of the range rather than half, and what that costs. Note: "Two probes per step, not one. Watch how much of the range survives."

**Figures**
- The FFFFTTTT predicate strip with the boundary marked, above the original problem.
- Ternary search bracket shrinking on a unimodal curve.

**Rows:** C3, C5, C6, P14 · **Outcomes:** E8, A1, A8 · **Terms:** 12

---

## Chapter 15 — Sorting: The Comparison Bound and How to Break It
**Archetype:** mechanism · **KEYSTONE** · **Words:** 4,800 · **Prereq:** 3, 5

**Blurb.** Sorting is the most-studied problem in computing and the one where the textbook
answer and the shipped answer differ most. This chapter builds the classical sorts, proves the
bound from Chapter 5 that none of them can beat, and then breaks that bound by changing the
rules — counting, radix and bucket sort do not compare, and that is the whole trick. Along
the way you get selection in linear time, which is the algorithm that makes quicksort's worst
case disappear.

**Sections**
1. *The elementary three* — insertion, selection, bubble; and the one fact that matters: insertion sort is adaptive and is genuinely the fastest thing on nearly-sorted or tiny inputs.
2. *Mergesort* — the recurrence from Chapter 3, stability, bottom-up variant, and counting inversions as a free by-product.
3. *Quicksort* — Hoare 1961; Lomuto and Hoare partition schemes compared; the worst case, and randomization or median-of-three as the fix.
4. *Duplicates* — why quicksort degrades on many equal keys and why the Dutch national flag partition from Chapter 8 repairs it.
5. *Quickselect and median of medians* — expected linear selection, then guaranteed linear (Blum, Floyd, Pratt, Rivest & Tarjan 1973) and why the guaranteed one is slower in practice.
6. *Breaking the bound* — counting sort, radix sort (LSD and MSD), bucket sort; exactly which assumption of Chapter 5 each one violates.
7. *Stability as a design tool* — multi-key sorting by sorting repeatedly, least significant key first, and the bug you get when you use an unstable sort for it.
8. *Selection across two sorted arrays* — the median-of-two-sorted-arrays problem, solved as a partition search rather than a merge.

**Machines**
- `dsaSortRace` — **comparator** — state: same array under six algorithms, per-algorithm comparison and swap counters, input shape. Controls: input shape (random, sorted, reversed, nearly sorted, many duplicates, all equal); run / step / reset. **Discovery:** set the input to "nearly sorted" and find which algorithm wins; then set it to "all equal" and find which one collapses. Note: "Six sorts, one array. Change the input shape and watch the winner change."
- `dsaPartition` — **stepper** — state: array, pivot, pointer positions, region shading. Controls: scheme picker (Lomuto, Hoare, three-way), pivot choice (first, random, median-of-three), step/back/reset. **Discovery:** pick "first element" as pivot on a sorted input and watch the recursion depth become n. Note: "Watch the array split. The shaded regions are what each scheme has already decided."
- `dsaRadixSort` — **builder** — state: array of fixed-width keys, current digit pass, buckets. Controls: step by pass, digit width picker (1, 2, 4, 8 bits), reset. **Discovery:** increase the digit width and find where the bucket count becomes the dominant cost. Note: "One pass per digit. Widen the digit and watch passes fall while buckets multiply."

**Figures**
- Comparison counts for six sorts across six input shapes, as a matrix figure.
- Lomuto versus Hoare partition on the same array, both mid-flight.
- Radix sort's three passes on eight 3-digit numbers, each pass's buckets drawn.

**Rows:** D1, D2, D3, D5, D6, D9, D10, C7, C8 · **Outcomes:** E5, E6, A3 · **Terms:** 18

---

## Chapter 16 — What Your Standard Library Actually Runs
**Archetype:** engineering reality · **Words:** 3,600 · **Prereq:** 15

**Blurb.** Every course tells you sorting is O(n log n) and stops. No standard library ships
the algorithm you were taught. This chapter reads the actual source of CPython, OpenJDK and
libstdc++ and tells you what runs when you call `sort` — and why three teams solving the same
problem shipped three different hybrids. This is also where you learn why a flat array beats a
linked list at identical asymptotics, which is the answer to half the performance questions
you will ever be asked.

**Sections**
1. *Timsort* — runs, minrun, galloping merge, the merge-invariant stack; why Python and Java-for-objects both ship it; the 2015 formal-verification result that found a real bug in it.
2. *Dual-pivot quicksort* — what OpenJDK runs for primitives, why primitives get a different algorithm from objects, and what that says about stability.
3. *Introsort* — libstdc++'s quicksort that gives up and becomes heapsort at depth 2 log n; the guarantee it buys.
4. *pdqsort* — Go's pattern-defeating quicksort since 1.19, and what patterns it defeats.
5. *Why they differ* — stability requirements, memory budgets, and the workload each team measured.
6. *The constant factors nobody teaches* — cache lines, sequential access, branch prediction; the measurement showing an O(n) linked-list scan losing to an O(n) array scan by an order of magnitude.
7. *When the asymptotically worse algorithm wins* — the crossover point, measured, for insertion sort inside mergesort and for linear scan against binary search.

**Machines**
- `dsaTimsort` — **stepper** — state: array, detected runs, merge stack, galloping flag. Controls: step / back / reset; input shape picker. **Discovery:** feed it a nearly-sorted input and find the point where it stops merging because there is nothing left to merge. Note: "Timsort looks for runs that are already sorted. Watch it find them before it does any work."
- `dsaCacheRace` — **comparator** — state: array traversal versus linked traversal, simulated cache lines, hit/miss counters. Controls: n slider, layout picker (array, list-sequential, list-shuffled), run. **Discovery:** shuffle the linked list's memory layout and watch the cache miss rate jump without a single change in asymptotics. Note: "Same O(n), same n. Only the memory layout differs — watch the miss counter."
- `dsaCrossover` — **tuner** — state: measured timings for two algorithms across n. Controls: n slider, algorithm pair picker (insertion vs merge, linear vs binary). **Discovery:** find the n below which insertion sort beats mergesort, then compare it to the minrun constant Timsort uses. Note: "Drag n and find where the lines cross. That crossover is why hybrids exist."

**Figures**
- Timsort's merge stack with the two invariants annotated.
- A cache line holding eight array elements versus eight scattered nodes.
- Measured crossover curves with conditions stated beneath.

**Rows:** D7, S1, S2(partial), D8 · **Outcomes:** E6, A3, O5, O6 · **Terms:** 16

---

## Chapter 17 — Hash Tables from the Bottom
**Archetype:** mechanism · **KEYSTONE** · **Words:** 4,600 · **Prereq:** 4, 5

**Blurb.** The hash table is the structure you reach for most and understand least. This
chapter builds one: what a hash function has to guarantee, why the guarantee requires
randomness, what happens when two keys collide and the two families of answer, why the load
factor is the only tuning knob that matters, and how an adversary who knows your hash function
turns your O(1) lookups into O(n) — an attack that has taken down real web frameworks.

**Sections**
1. *The problem* — a dictionary with O(1) expected operations, and why an array of every possible key does not work.
2. *Hash functions* — what "spreads the keys" means precisely; the division and multiplication methods; why a fixed function has a bad input.
3. *Universal hashing* — Carter & Wegman 1979; picking the function at random from a family, and the expectation argument that follows from Chapter 5's linearity.
4. *Chaining* — buckets of lists; expected chain length α; the treeification OpenJDK does at 8 entries and why.
5. *Open addressing* — linear and quadratic probing, double hashing; clustering; **tombstones** and the deletion bug you get without them.
6. *Load factor and resizing* — the amortized argument from Chapter 4 applied; the rehash stall, and why a latency-sensitive service cares.
7. *Hash flooding* — the adversarial key set, the real CVEs, and the two defences: randomized seeds and a stronger function.
8. *The patterns built on it* — frequency maps, grouping by signature, set membership, and two-sum, which is this chapter's whole content in one problem.

**Machines**
- `dsaHashTable` — **builder** — state: table of 16 slots, keys inserted, collision resolution strategy, probe counts, load factor. Controls: insert key (typed), delete key, resize, strategy picker (chaining, linear, quadratic, double), load-factor slider. **Discovery:** delete a key in the middle of a probe chain without a tombstone and find the key that becomes unreachable. Note: "Insert keys and watch collisions resolve. Try deleting one from the middle of a chain."
- `dsaHashFlood` — **simulator** — state: table, normal key stream versus adversarial key stream, operation timings. Controls: run normal / run adversarial / toggle randomized seed / reset. **Discovery:** turn the randomized seed off, run the adversarial stream, and watch every key land in one bucket. Note: "Two key streams, same table. One of them knows your hash function."
- `dsaLoadFactor` — **tuner** — state: load factor, measured average probe count for each strategy. Controls: load-factor slider 0.1–0.99, strategy toggle. **Discovery:** find the load factor where linear probing's average probe count passes 10, and compare it to chaining at the same load. Note: "Drag the load factor. The curves are average probes per lookup — watch where they turn vertical."

**Figures**
- Chaining versus open addressing on the same eight keys, side by side.
- Tombstones: a probe sequence before and after a naive deletion, with the unreachable key marked.
- Average probes against load factor, both strategies, with the asymptote drawn.

**Rows:** E1, E2, E3, E4, E5, E6, E7, O10 · **Outcomes:** E7, A7, O6 · **Terms:** 18

---

# PART 3 — The Paradigms

## Chapter 18 — Backtracking: Enumerate, Prune, Return
**Archetype:** mechanism · **KEYSTONE** · **Words:** 4,200 · **Prereq:** 6

**Blurb.** Backtracking is a paradigm, not a template, and Erickson gives it a whole chapter
for the same reason this course does: every exhaustive search is the same three lines —
choose, explore, un-choose — and every *fast* exhaustive search is those three lines plus a
pruning rule that kills subtrees before you walk them. You will generate subsets and
permutations, handle duplicates correctly, then watch pruning turn an intractable n-queens
into an instant one.

**Sections**
1. *The template and why it is a template* — choose, explore, un-choose, with the state-restoration obligation made explicit.
2. *Subsets* — recursive include/exclude, and the bitmask enumeration that is the same tree read as integers.
3. *Permutations* — swap-based and used-array generation; `next_permutation` and its 14th-century origin in Narayana Pandita's work.
4. *Duplicates* — the sort-then-skip rule for subsets and permutations, derived rather than stated, because getting it wrong is the classic interview failure.
5. *Combinations and k-subsets* — the start-index parameter that removes the duplicate work.
6. *Pruning* — n-queens with and without the diagonal check; the search tree size measured both ways.
7. *Constraint propagation* — sudoku, and choosing the most-constrained cell first; the difference between pruning and propagation.
8. *Iterative deepening* — when the depth is unknown and memory is not free.

**Machines**
- `dsaBacktrackTree` — **stepper** — state: the partial solution, the live search tree, nodes visited. Controls: step / back / run / reset; problem picker (subsets, permutations, combinations, letter combinations); duplicates toggle. **Discovery:** turn duplicates on without the skip rule and count the repeated leaves. Note: "The tree grows as you step. Each leaf is one complete answer."
- `dsaNQueens` — **simulator** — state: board, placed queens, attacked squares, nodes explored. Controls: n slider (4–10), pruning toggle, step / run / reset. **Discovery:** set n=8, run with pruning off and then on, and compare the node counts. Note: "Place queens column by column. Toggle pruning and watch the explored-node counter change."
- `dsaSudoku` — **simulator** — state: grid, candidate sets, chosen cell order. Controls: step / run / reset; heuristic picker (left-to-right vs most-constrained-first). **Discovery:** find a puzzle where left-to-right takes ten times the steps of most-constrained-first. Note: "Which empty cell should you fill next? Switch the heuristic and watch the step count."

**Figures**
- The choose/explore/un-choose tree for subsets of {1,2,3}, all eight leaves drawn.
- The n-queens search tree with pruned subtrees greyed out.

**Rows:** J3, J4, J5, J6, J7, J8, M3(partial) · **Outcomes:** E15(partial), A8, O1 · **Terms:** 15

---

## Chapter 19 — From Memoization to SRTBOT
**Archetype:** mechanism · **KEYSTONE** · **Words:** 4,800 · **Prereq:** 6, 18

**Blurb.** Dynamic programming is the topic people study most and understand least, because
it is taught as a gallery of solved problems instead of as a procedure. This chapter gives you
the procedure: MIT's SRTBOT — subproblems, relate, topological order, base cases, original
problem, time — which turns "spot the DP" into six questions you answer in order. You will
also learn the two things the galleries never mention: how to recover the solution rather than
its value, and why the loop order in a two-line difference between two coin problems changes
the answer completely.

**Sections**
1. *The problem* — Chapter 6's fib call tree, with its repeated subtrees, and the two ways to stop recomputing.
2. *Memoization* — top-down, a cache, and the recursion you already wrote; the smallest possible change to Chapter 6's code.
3. *Tabulation* — bottom-up, an explicit order, and the trade: no recursion depth, but you compute subproblems you might not need.
4. *When DP is legal* — optimal substructure and overlapping subproblems, both defined precisely, with a problem that has one and not the other.
5. *SRTBOT* — the six steps, attributed to MIT 6.006, executed on three problems of increasing difficulty in the same format every time.
6. *Reconstructing the answer* — parent pointers or recomputation; the step interviews ask for and tutorials omit.
7. *Space optimization* — the rolling array, and the rule for when it is safe.
8. *Loop order matters* — coin change counting combinations versus permutations, which differ only in which loop is outer.

**Machines**
- `dsaMemoTable` — **stepper** — state: recursion tree, memo table, hit/miss counters. Controls: step / run / reset; problem picker (fib, grid paths, coin change); memo toggle. **Discovery:** turn the memo off on fib(20) and watch the call count go from 20 to 13,529. Note: "Same recursion, one table. Toggle the memo and watch the call counter."
- `dsaSRTBOT` — **playground** — state: a problem statement and six answer slots. Controls: pick a problem; fill or reveal each of the six SRTBOT steps; check. **Discovery:** fill in "Time" before revealing it and find the problem where the subproblem count is right but the transition cost is not O(1). Note: "Six questions, in order. Answer each before revealing it."
- `dsaDPOrder` — **comparator** — state: coin-change table filled under both loop orders, with the counts diverging. Controls: step both / reset / coin set picker. **Discovery:** find the first cell where the two orders disagree and say which one counts permutations. Note: "Two loops, two orders, two different answers. Find the cell where they first diverge."

**Figures**
- The fib(6) call tree beside the memo table, repeated subtrees shaded to match table cells.
- SRTBOT as a six-row card, filled in for one problem.
- The coin-change table under both loop orders, divergent cells highlighted.

**Rows:** J9, K1, K2, K3, K4, K18, K19 · **Outcomes:** E15, A5, O1 · **Terms:** 17

---

## Chapter 20 — The Knapsack Family and Pseudopolynomial Time
**Archetype:** mechanism · **Words:** 3,600 · **Prereq:** 19

**Blurb.** The knapsack problem is the most reused shape in dynamic programming, and it is
also the place where almost everyone, including most tutorials, says something false. The
algorithm is O(nW). That is not polynomial, and this chapter explains exactly why — using the
bits-versus-elements distinction from Chapter 2 — which is the difference between an
interview answer that is correct and one that sounds correct.

**Sections**
1. *0/1 knapsack* — items, a capacity, SRTBOT executed on it, the table filled.
2. *The variants as one shape* — unbounded knapsack, subset sum, partition into equal halves, coin change; what changes in the recurrence each time.
3. *Why the loop order flips for unbounded* — the same lesson as Chapter 19 §8, now with a reason you can see in the table.
4. *Pseudopolynomial time* — input size in bits: W takes log W bits, so O(nW) is exponential in the input length. The worked example with a 60-bit capacity.
5. *Why this matters* — subset sum is NP-complete (forward pointer to Chapter 46), and knowing that stops you from claiming you solved an NP-complete problem in polynomial time.
6. *When it is fine anyway* — small capacities, and the honest engineering answer.
7. *Meet in the middle, revisited* — Chapter 12's technique as the alternative when W is huge but n is small.

**Machines**
- `dsaKnapsack` — **builder** — state: item list, DP table, chosen items traced back. Controls: add/remove item (value, weight), capacity slider, step-fill / run / reset, traceback toggle. **Discovery:** fill the table, then trace back and find the item the greedy-by-ratio choice would have taken and the optimum does not. Note: "Fill the table cell by cell. Then trace back to see which items the answer actually uses."
- `dsaPseudopoly` — **tuner** — state: n, W, table size, input size in bits. Controls: n slider, W slider up to 2⁴⁰ (log scale). **Discovery:** hold n at 20 and raise W until the table has more cells than there are atoms you can store, while the input stays under 200 bytes. Note: "Two numbers: the table's size, and the input's size in bits. Raise W and watch them separate."

**Figures**
- The knapsack table with the traceback path drawn through it.
- Input length in bits beside table size, for three values of W, with the exponential gap labelled.

**Rows:** K5, K6, K7 · **Outcomes:** E1, E15, A5 · **Terms:** 13

---

## Chapter 21 — Sequence DP: LIS, LCS and Edit Distance
**Archetype:** mechanism · **Words:** 3,800 · **Prereq:** 19

**Blurb.** Three problems about sequences that appear in every interview bank and every
bioinformatics pipeline, taught as one family. You will solve the longest increasing
subsequence twice — once the obvious quadratic way and once in n log n by putting a binary
search inside a dynamic program — and you will meet Hirschberg's trick for computing an
alignment in linear space, which is the answer to "what if the strings are a million
characters long".

**Sections**
1. *Longest increasing subsequence, O(n²)* — SRTBOT on it, and the reconstruction.
2. *LIS in O(n log n)* — the patience-sorting tails array, why the array is not the LIS itself, and Chapter 13's binary search doing the work.
3. *Longest common subsequence* — the two-dimensional table, the diagonal-versus-max recurrence, and the traceback.
4. *Edit distance* — Wagner & Fischer 1974; insert, delete, replace as three predecessors; the variant costs.
5. *One family* — the alignment view that makes LCS and edit distance the same algorithm with different weights.
6. *Hirschberg's linear space* — divide and conquer over the DP table; O(n) space with the same answer, at 2× time.
7. *Palindromic variants* — longest palindromic subsequence as LCS against the reverse; longest palindromic substring as its own two-dimensional DP, with the expand-around-centre alternative and its cost.

**Machines**
- `dsaLIS` — **comparator** — state: array, O(n²) DP array, O(n log n) tails array, both answers. Controls: step both / reset / input picker. **Discovery:** find an input where the tails array's final contents are *not* a valid increasing subsequence of the input, and confirm its length is still right. Note: "Two algorithms, same answer. Watch the tails array — it is not what you think it is."
- `dsaEditDistance` — **builder** — state: two strings, DP grid, traceback path, operation labels. Controls: edit either string, step-fill / run / reset, traceback toggle, cost sliders for insert/delete/replace. **Discovery:** set replace cost to 3 and watch the traceback stop using it. Note: "Fill the grid, then trace the path back. Each step of the path is one edit."
- `dsaHirschberg` — **stepper** — state: the table, the two linear-space rows, the recursive splits. Controls: step / back / reset. **Discovery:** count how much memory the full table would need against the two rows, for a 1,000-character pair. Note: "Only two rows are ever alive. Watch the recursion find the split point anyway."

**Figures**
- The LIS tails array evolving, with the actual LIS traced separately beneath it.
- The edit-distance grid with the traceback path and its three move types.

**Rows:** K8, K9, K11 · **Outcomes:** E15, A5 · **Terms:** 15

---

## Chapter 22 — Grid, Interval and Bitmask DP
**Archetype:** mechanism · **Words:** 4,000 · **Prereq:** 19, 20

**Blurb.** Three more shapes the subproblem can take: a position in a grid, a range of a
sequence, and a subset of a set. The third is the one that matters most and is taught least —
bitmask DP turns an n! permutation search into 2ⁿ·n, which is the difference between n=10 and
n=20, and it is how the travelling salesman problem is actually solved for small instances.

**Sections**
1. *Grid DP* — unique paths, minimum path sum, obstacles; why the recurrence is two predecessors and the base case is an edge.
2. *Interval DP* — subproblems over [i, j]; matrix chain multiplication worked fully; burst balloons as the version where you choose the *last* action rather than the first.
3. *Optimal binary search trees, and the optimizations* — Knuth 1971, and the quadrangle inequality (Yao 1980) that unifies this family. The three named speedups stated here with the condition each needs: **divide-and-conquer DP** when the optimal split point is monotone, **Knuth's optimization** when the quadrangle inequality holds, and the **convex hull trick** when the transition is a minimum over lines — the last one gets its geometric reading in Chapter 45 §8, and Li Chao trees are named there.
4. *Bitmask DP* — a subset as an integer, from Chapter 18's enumeration; the state (mask, position) and its size.
5. *Held–Karp* — the travelling salesman in O(2ⁿ·n²), 1962; the honest statement that this is still exponential and why it is still a win.
6. *Assignment by bitmask* — matching n people to n jobs, the small-n answer to a problem Chapter 39 solves properly.
7. *Counting DP* — counting rather than optimizing; tilings, and the broken-profile technique named.
8. *Digit DP* — counting numbers with a property below a bound, the technique the Indian placement rounds actually ask for.

**Machines**
- `dsaGridDP` — **builder** — state: grid with obstacles, DP values filled in. Controls: click cells to toggle obstacles, step-fill / run / reset, mode picker (count paths, min sum). **Discovery:** place one obstacle that reduces the path count to zero and explain where it must be. Note: "Click to add walls. Watch the counts fill in from the corner."
- `dsaIntervalDP` — **stepper** — state: matrix chain dimensions, table by interval length, chosen split points. Controls: edit dimensions, step by interval length, reset, parenthesization reveal. **Discovery:** find the dimension set where the two obvious parenthesizations differ by more than 10×. Note: "The table fills by interval length, shortest first. The number in each cell is the best split."
- `dsaBitmaskTSP` — **stepper** — state: n cities, (mask, city) state table, current best tour. Controls: n slider (4–10), step / run / reset, city drag. **Discovery:** raise n from 8 to 10 and watch the state count multiply by 4 rather than by 90 as n! would. Note: "Each state is a set of visited cities plus where you are. Watch the table grow with 2ⁿ, not n!."

**Figures**
- Interval DP table filled by diagonal, with the fill order numbered.
- A bitmask as an integer beside the subset it represents, with the transition drawn.

**Rows:** K10, K12, K14, K15, K16, K20, M3, I19(partial) · **Outcomes:** E15, E19, A5 · **Terms:** 16

---

## Chapter 23 — Greedy: The Exchange Argument, Huffman and Matroids
**Archetype:** mechanism · **KEYSTONE** · **Words:** 4,400 · **Prereq:** 19

**Blurb.** A greedy algorithm is the easiest thing to write and the hardest thing to justify,
and the gap between those two facts is where interviews are lost. This chapter is about the
justification: the exchange argument, which converts any optimal solution into the greedy one
without making it worse, and the matroid, which is the structure that explains *why* greedy
works whenever it does. You will also meet a greedy that looks obviously correct and is not.

**Sections**
1. *The problem with greedy* — two rules for interval scheduling, both plausible, one wrong, and no way to tell by inspection.
2. *The exchange argument* — the proof template, executed on earliest-finish-time scheduling, line by line.
3. *Greedy stays ahead* — the second proof template, and which problems suit which.
4. *Interval partitioning* — the minimum number of rooms, and the depth lower bound that proves the greedy optimal.
5. *Scheduling to minimize lateness* — earliest deadline first, with its exchange proof.
6. *Fractional versus 0/1 knapsack* — why the ratio greedy is optimal for one and arbitrarily bad for the other, side by side with Chapter 20.
7. *Huffman coding* — Huffman 1952; the two-smallest merge, the optimality proof, and the prefix-free property that makes decoding possible.
8. *Matroids* — Whitney 1935, Edmonds 1971; independence systems, the exchange property, and the theorem that greedy is optimal on exactly the matroids. Minimum spanning trees previewed as the canonical example.
9. *A greedy that fails* — coin change with a non-canonical coin system, worked, with the smallest counterexample.

**Machines**
- `dsaGreedyIntervals` — **comparator** — state: interval set, three greedy rules running side by side. Controls: rule picker (earliest start, shortest, earliest finish), add/drag intervals, run / reset. **Discovery:** construct a three-interval input where "shortest first" loses, which is the counterexample that kills the most popular wrong rule. Note: "Three plausible rules. Drag the intervals until two of them disagree."
- `dsaExchange` — **stepper** — state: an optimal solution and the greedy one, the differing position, the exchange. Controls: step the exchange / reset / instance picker. **Discovery:** confirm that each exchange leaves the solution's value unchanged, which is the whole proof. Note: "Take any optimal answer. Swap it one step toward greedy. Did it get worse?"
- `dsaHuffman` — **builder** — state: character frequencies, the merge forest, resulting codes, total bits. Controls: edit frequencies, step the merge / run / reset, compare against fixed-width encoding. **Discovery:** make one character's frequency dominant and watch its code length fall to 1 bit. Note: "Merge the two smallest, repeatedly. Watch the code lengths fall out of the tree shape."
- `dsaGreedyCoins` — **playground** — state: coin system, target, greedy answer, optimal answer. Controls: edit the coin set, target slider. **Discovery:** find the smallest coin system and target where greedy is wrong. Note: "Greedy takes the biggest coin that fits. Find a coin set where that is a mistake."

**Figures**
- The exchange argument as a sequence of three solutions, each one step closer to greedy.
- A Huffman tree with frequencies on the leaves and code lengths annotated.

**Rows:** L1, L2, L3, L4, L5, L6, L7, L8 · **Outcomes:** E16, A4 · **Terms:** 16

---

# PART 4 — Hierarchies and Ranges

## Chapter 24 — Binary Trees and Traversal
**Archetype:** mechanism · **Words:** 3,200 · **Prereq:** 6, 10

**Blurb.** Every tree question starts with a traversal, and there are exactly four of them
worth knowing plus one that uses no extra space at all. This chapter covers the shapes and
vocabulary, the three depth-first orders and the breadth-first one, the iterative versions
that Chapter 6 taught you to derive, Morris traversal in O(1) space, and the question
interviews love: which pairs of traversals are enough to rebuild the tree, and which are not.

**Sections**
1. *Shapes and vocabulary* — height, depth, complete, full, perfect, balanced; the array representation of a complete tree that Chapter 27 depends on.
2. *The three depth-first orders* — preorder, inorder, postorder, each derived from where you place the visit relative to the recursive calls.
3. *Iterative traversal* — the explicit stack from Chapter 6, and the postorder version that is genuinely awkward and why.
4. *Level order* — BFS on a tree; the queue, and the "process one level at a time" pattern that answers right-side-view and zigzag.
5. *Morris traversal* — threading the tree through its own null pointers for O(1) space, Morris 1979; what it temporarily breaks and restores.
6. *Serialization* — writing a tree to a string and back; why preorder with null markers works and inorder alone does not.
7. *Which traversals determine the tree* — preorder+inorder yes, preorder+postorder no (with the two-node counterexample), and the reason.

**Machines**
- `dsaTraversal` — **stepper** — state: tree, current node, visit order output, stack or queue contents. Controls: order picker (pre, in, post, level, Morris), step / back / reset, implementation toggle (recursive / iterative), tree shape picker. **Discovery:** run Morris traversal and find the moment a node's right pointer points back up the tree. Note: "Pick an order and step. The panel on the right is the stack or queue doing the work."
- `dsaRebuildTree` — **builder** — state: two traversal sequences, the reconstructed tree. Controls: pick which two orders are given, edit the sequences, rebuild. **Discovery:** give preorder and postorder for a two-node tree and find the two different trees that match. Note: "Two traversals in, one tree out — unless the pair is not enough."

**Figures**
- The same 7-node tree with all four traversal orders printed beneath it.
- Morris traversal mid-flight, with the temporary thread drawn as a dashed edge.

**Rows:** H1, H2, H11 · **Outcomes:** E9(partial), O2 · **Terms:** 15

---

## Chapter 25 — Tree DP: Returning a Tuple Upward
**Archetype:** mechanism · **KEYSTONE** · **Words:** 4,000 · **Prereq:** 19, 24

**Blurb.** The single highest-yield idea about trees, and the interview banks teach it as four
unrelated problems. Diameter, balance, maximum path sum and subtree aggregates are all one
technique: each node returns a small tuple to its parent, one component is the answer *through*
this node and the other is the answer *from* this node downward, and the global answer is
accumulated on the side. Once you see it you can derive all four in a minute, plus the ones
you have never seen.

**Sections**
1. *The shape* — post-order recursion returning a tuple; the distinction between "answer rooted here" and "answer passing through here".
2. *Height and balance* — the naive O(n²) balance check and the O(n) version that returns −1 as a sentinel.
3. *Diameter* — the longest path, which may not pass through the root, and how the side-accumulator finds it.
4. *Maximum path sum* — the same shape with negative values, and the clamp at zero that everyone forgets.
5. *Lowest common ancestor, the recursive version* — returning a node instead of a number, as a first look at Chapter 29's problem.
6. *Validate a BST* — the range-passing variant, where information flows *down* instead of up, and why the naive local check is wrong.
7. *Tree DP proper* — independent set on a tree, tree matching; the (take, skip) tuple.
8. *Rerooting* — computing the answer for every node as root in O(n) total; the technique nobody names, with the two-pass derivation.

**Machines**
- `dsaTreeDP` — **stepper** — state: tree, per-node returned tuple, global accumulator. Controls: problem picker (height, balance, diameter, max path sum, independent set), step / back / reset, tree editor. **Discovery:** on diameter, find a tree where the answer does not pass through the root and watch the accumulator catch it anyway. Note: "Each node returns a small tuple upward. The box at the top is the running global answer."
- `dsaRerooting` — **stepper** — state: tree, down-pass values, up-pass values, per-node answer. Controls: step pass 1 / step pass 2 / reset / tree editor. **Discovery:** confirm that the second pass computes n answers in the time the naive approach computes one. Note: "Two passes. The first goes down, the second carries the rest of the tree back up."
- `dsaValidateBST` — **comparator** — state: a tree that passes the local check and fails the global one. Controls: run local check / run range check / edit tree. **Discovery:** build the smallest tree where checking only parent-child order says valid and the tree is not. Note: "One check looks at neighbours. The other carries a range down. Find where they disagree."

**Figures**
- A tree annotated with each node's returned tuple and the global accumulator's path.
- The three-node counterexample where local BST validation fails.

**Rows:** H3, K13 · **Outcomes:** E15, A5, O1 · **Terms:** 14

---

## Chapter 26 — Binary Search Trees and Keeping Them Balanced
**Archetype:** mechanism · **KEYSTONE** · **Words:** 4,800 · **Prereq:** 13, 24

**Blurb.** A binary search tree is a sorted array that supports insertion, and it is fast right
up until the moment it becomes a linked list. This chapter builds the BST, breaks it with
sorted input, then repairs it four different ways — AVL's rotations, red-black's colour
invariants, the treap's randomization, and the B-tree's fanout — because four different
communities answered the same question differently and the reasons are instructive. Your
standard library ships one of these and this chapter tells you which.

**Sections**
1. *The BST property* — search, insert, and the three-case deletion with the successor swap.
2. *Degeneration* — insert sorted input and watch the tree become a path; the measured height against log n.
3. *Rotations* — the single primitive that rebalances without breaking the BST property, drawn left and right.
4. *AVL* — Adelson-Velsky & Landis 1962; the height-balance invariant, the four rotation cases, and the height bound.
5. *Red-black* — Guibas & Sedgewick 1978; the five invariants and what each one is for; why it rebalances less than AVL and searches slightly slower. What `TreeMap` and `lib/rbtree.c` ship.
6. *Treaps* — Seidel & Aragon 1996; a BST by key and a heap by random priority; expected O(log n) with no rebalancing logic at all, and why that makes it the one to implement by hand.
7. *Skip lists* — Pugh 1990; the same randomized idea in a list; what Redis ships for sorted sets.
8. *B-trees* — Bayer & McCreight 1972; fanout, the node-size argument, and why a structure designed for disk also wins on cache. **Mechanism only**; the storage-engine treatment belongs to *Databases in Depth* and is pointed to here.
9. *Ordered-statistics containers* — augmenting with subtree sizes to answer rank and select; what `TreeMap`, `SortedList` and C++ policy trees give you.

**Machines**
- `dsaBSTDegenerate` — **builder** — state: tree, insertion order, measured height, log n reference. Controls: insert typed key, insert random 15, insert sorted 15, reset. **Discovery:** insert sorted keys and watch height track n; then insert the same keys shuffled and watch it track log n. Note: "Insert keys and watch the height. Try sorted order, then shuffled."
- `dsaRotations` — **stepper** — state: an unbalanced subtree, the rotation in progress. Controls: rotate left / rotate right / reset; case picker (LL, LR, RL, RR). **Discovery:** find the case that needs two rotations and say why one is not enough. Note: "One rotation, three pointers move. Watch the BST property survive it."
- `dsaTreeFamily` — **comparator** — state: the same 31 keys inserted into AVL, red-black, treap and B-tree. Controls: insertion order picker, step-insert / run / reset, metric toggle (height, rotations performed, nodes touched). **Discovery:** find the insertion order where AVL performs more than twice the rotations red-black does, and confirm AVL's height is lower. Note: "Same keys, four trees. Switch the metric to see what each design bought."
- `dsaBTreeFanout` — **tuner** — state: n keys, node size in bytes, resulting height. Controls: fanout slider (2–512), n slider. **Discovery:** find the fanout at which a billion keys fit in a tree of height 4. Note: "Drag the fanout. The height is how many node reads a lookup costs."

**Figures**
- The four AVL rotation cases, before and after.
- The same key set as AVL, red-black and B-tree of order 5, heights compared.

**Rows:** H4, H5, H6, G7, N10, A18(applied) · **Outcomes:** E9, A7, O6, B3 · **Terms:** 19

---

## Chapter 27 — Heaps and Priority Queues
**Archetype:** mechanism · **Words:** 3,200 · **Prereq:** 24

**Blurb.** A heap is a tree that lives in an array with no pointers at all, which is the first
surprise, and building one takes linear rather than n log n time, which is the second and is
genuinely counterintuitive. This chapter proves the linear build, uses the heap for heapsort
and for the top-K pattern, and then answers the question every two-heaps problem is really
asking: how do you keep a running median.

**Sections**
1. *The array trick* — a complete tree with children at 2i+1 and 2i+2; no pointers, perfect cache behaviour.
2. *Sift up and sift down* — insert and extract, with the invariant restated at each step.
3. *Why build-heap is O(n)* — the summation over levels, with the series worked; the contrast against n successive inserts.
4. *Heapsort* — in-place, O(n log n) worst case, and why it still loses to quicksort in practice (Chapter 16's constant factors).
5. *Top-K* — a size-K heap of the opposite polarity; the cost comparison against sorting and against quickselect, with the rule for choosing.
6. *Two heaps for a running median* — a max-heap and a min-heap with a balance invariant; the rebalance step.
7. *d-ary heaps and the Dijkstra question* — what larger fanout buys; Fibonacci heaps (Fredman & Tarjan 1987) and the honest statement that their constants keep them out of production.

**Machines**
- `dsaHeap` — **builder** — state: array, tree view, sift path. Controls: insert typed value, extract-min, build-heap from array, reset; array/tree view toggle. **Discovery:** build a heap from 15 elements by repeated insertion and by build-heap, and compare the swap counts. Note: "The array and the tree are the same thing. Insert a value and watch it sift."
- `dsaBuildHeapCost` — **tuner** — state: n, measured swap counts for both build methods. Controls: n slider, method toggle, show the per-level summation. **Discovery:** find the level that contributes the most total work, and confirm it is not the bottom one. Note: "Most nodes are near the bottom and sift almost nowhere. Watch where the work actually is."
- `dsaTwoHeaps` — **stepper** — state: stream of values, max-heap, min-heap, current median. Controls: push next / reset / stream picker. **Discovery:** find the push that forces a rebalance and say which invariant it restored. Note: "Two heaps, back to back. The median is always at the boundary."

**Figures**
- The array-to-tree index mapping drawn explicitly.
- The build-heap summation: nodes per level times sift distance per level.

**Rows:** H7, H8, H9, D4 · **Outcomes:** E10, A7, B4 · **Terms:** 14

---

## Chapter 28 — Tries and Prefix Structures
**Archetype:** mechanism · **Words:** 2,900 · **Prereq:** 24

**Blurb.** When your keys are strings and they share prefixes, a hash map throws away the one
structure you could have exploited. A trie keeps it, which turns prefix search from a scan
into a walk, and it is the backbone of autocomplete, of the word-search puzzles interviews
love, and — with one change of alphabet — of the fastest way to find a maximum XOR pair.

**Sections**
1. *The structure* — edges labelled by character, terminal flags, and the space cost that makes people hesitate.
2. *Insert, search, starts-with* — all O(length), independent of how many words are stored.
3. *Compressed and radix tries* — collapsing single-child chains; what Lucene's FST and IP routing tables do with this.
4. *Word search on a grid* — the trie plus backtracking (Chapter 18) combination, and why searching all words at once beats searching each separately.
5. *Word break* — the DP from Chapter 19 with a trie underneath.
6. *The bitwise trie* — keys as 32-bit strings over {0,1}; maximum XOR pair in O(n·32) by walking greedily against each bit.
7. *When not to use one* — the memory comparison against a hash set, measured.

**Machines**
- `dsaTrie` — **builder** — state: trie, inserted words, current query path. Controls: insert typed word, search, starts-with, delete, reset; compression toggle. **Discovery:** insert ten words sharing a long prefix and toggle compression to watch the node count collapse. Note: "Type a word to insert it. The highlighted path is the walk your query makes."
- `dsaXorTrie` — **stepper** — state: bitwise trie of inserted numbers, the greedy walk for a query. Controls: insert number, query for max XOR, step the walk, reset. **Discovery:** at each bit, confirm the walk takes the opposite branch when it exists, and find the query where it cannot. Note: "Walk the bits from the top. At each one, go the opposite way if you can."

**Figures**
- A trie of six words with the shared prefixes visible, compressed and uncompressed.
- The bitwise trie walk for one query, opposite-branch choices marked.

**Rows:** H10, M6, O14 · **Outcomes:** E19, A7, B8 · **Terms:** 12

---

## Chapter 29 — Ancestors and Flattening: LCA and the Euler Tour
**Archetype:** mechanism · **Words:** 3,600 · **Prereq:** 25, 27

**Blurb.** Two ideas that unlock most hard tree problems. The first is the lowest common
ancestor, answered in O(log n) by binary lifting — a table of 2^k-th ancestors that is the
same doubling trick as the sparse table. The second is more general and has no name in any
interview bank: flatten the tree with an Euler tour so that every subtree becomes a
*contiguous range*, at which point every array technique you already own applies to trees.

**Sections**
1. *The problem* — lowest common ancestor, and the naive walk-up that is O(n).
2. *Binary lifting* — up[k][v] = the 2^k-th ancestor; build in O(n log n), query in O(log n); the same doubling that Chapter 30's sparse table uses.
3. *Distance and k-th ancestor* — what binary lifting gives you for free.
4. *The Euler tour* — entry and exit times from a DFS; the theorem that a subtree is exactly the range [tin, tout].
5. *Subtree queries become range queries* — sum, max, count over a subtree, handed to Chapter 30 and 31's structures.
6. *LCA as range minimum* — the Euler tour's depth array; Bender & Farach-Colton 2000, and the O(1) query it enables.
7. *Path queries and heavy-light decomposition* — splitting the tree into chains so that any root-to-node path touches O(log n) chains, each a contiguous range; Sleator & Tarjan 1983 as the ancestor idea.
8. *Diameter and centroid* — the two-BFS diameter proof, the centroid's defining property, and centroid decomposition named for divide and conquer on trees.

**Machines**
- `dsaBinaryLifting` — **builder** — state: tree, the up-table, a query's jump sequence. Controls: pick two nodes, step the query, show/hide the table, reset. **Discovery:** query two deep nodes and count the jumps; confirm it is the number of 1 bits in the depth difference. Note: "The table holds 2^k-th ancestors. Watch the query jump in powers of two."
- `dsaEulerTour` — **inspector** — state: tree with tin/tout on each node, the flattened array, a selected subtree. Controls: click a node to select its subtree; toggle between tree and array view. **Discovery:** click any node and confirm its subtree is one unbroken block in the array. Note: "Click a node. Watch its whole subtree light up as one contiguous range."
- `dsaHLD` — **inspector** — state: tree decomposed into heavy chains, a selected path. Controls: pick two nodes; show chains; show the ranges the path decomposes into. **Discovery:** pick the two deepest leaves and count how many chains the path between them crosses. Note: "Heavy edges make chains. Any path crosses only a few of them — count them."

**Figures**
- The up-table for an 8-node tree, with one query's jumps traced.
- A tree beside its Euler-tour array, with three subtrees shaded to match their ranges.

**Rows:** H12, H13, H14, H15 · **Outcomes:** E9, A6, A7 · **Terms:** 15

---

## Chapter 30 — Range Queries: Prefix, Sparse Table, Fenwick
**Archetype:** mechanism · **Words:** 3,400 · **Prereq:** 9, 29

**Blurb.** Chapter 9 answered range queries on an array that never changes. This chapter is
what happens when it changes. You will see the whole family as one trade-off curve — how much
do you pay to update, how much to query — with the prefix sum at one extreme, the sparse
table at the other, and the Fenwick tree as the compact structure that sits in the middle and
fits in one array with a loop you can write from memory once you see why it works.

**Sections**
1. *The trade-off curve* — update cost against query cost, with every structure in this chapter and the next plotted as a point on it.
2. *The sparse table* — precompute answers for every power-of-two length; O(1) idempotent queries, no updates. The doubling from Chapter 29, again.
3. *Idempotence* — why min and max work in O(1) and sum does not, stated precisely.
4. *The Fenwick tree* — Fenwick 1994; each index is responsible for a range determined by its lowest set bit; build, point update, prefix query.
5. *Why the bit trick works* — the ranges as a partition of any prefix into O(log n) blocks, drawn.
6. *Range update, point query* — the difference-array trick from Chapter 9 inside a Fenwick tree; and the two-BIT construction for range-update range-query.
7. *Two dimensions* — the nested Fenwick, and its cost.
8. *Choosing* — the decision procedure across the whole family, with the workload questions to ask.

**Machines**
- `dsaRangeTradeoff` — **comparator** — state: structures plotted on update-cost versus query-cost axes, a chosen workload. Controls: update:query ratio slider, operation type picker (sum, min, assign), n slider. **Discovery:** set a workload of 1 update per 1,000 queries and find the winner; then invert the ratio and find it change. Note: "Each dot is a structure. Change the workload and watch which one is cheapest."
- `dsaFenwick` — **builder** — state: array, BIT array, the ranges each index covers. Controls: point update, prefix query, toggle range-coverage overlay, reset. **Discovery:** run a prefix query for index 13 and confirm it reads exactly three cells, matching the bits of 13. Note: "Each cell owns a range set by its lowest bit. Query a prefix and watch which cells it reads."
- `dsaSparseTable` — **builder** — state: the log n × n table, a query's two overlapping blocks. Controls: build step by level, query by dragging the range, operation toggle (min vs sum). **Discovery:** switch the operation to sum and find the query where the two overlapping blocks double-count. Note: "Two blocks cover any range — but only if overlapping twice is harmless."

**Figures**
- The update/query trade-off curve with seven structures placed on it.
- Fenwick index responsibilities drawn as nested bars beneath the array.

**Rows:** N1(revisit), N2, N3, N10(partial) · **Outcomes:** E18, A7 · **Terms:** 14

---

## Chapter 31 — Segment Trees and Lazy Propagation
**Archetype:** mechanism · **KEYSTONE** · **Words:** 4,600 · **Prereq:** 30

**Blurb.** The segment tree is the structure that answers *any* associative range question,
and once you build it over a monoid rather than over "sum" you write the implementation once
and get every variant free. Then lazy propagation lets you update whole ranges without
touching every element, by leaving a note at a node saying "everyone below me still owes this"
— which is the single most elegant idea in this part of the course.

**Sections**
1. *The structure* — a binary tree over ranges; build, query and point update, each O(log n), with the query's range-decomposition argument.
2. *Over a monoid* — an associative operation with an identity; sum, min, max, gcd, matrix product, and the one implementation that serves all of them.
3. *Why the query touches O(log n) nodes* — the proof, by showing at most two nodes per level are ever partial.
4. *Lazy propagation* — the pending-update note, the push-down step, and the invariant "a node's value is correct, its children's are not yet".
5. *Composing lazy operations* — range-add then range-assign, and why the order of composition is the hard part.
6. *Iterative segment trees* — the bottom-up version, half the code and twice the speed, with the index arithmetic explained.
7. *Dynamic, implicit and persistent* — allocating nodes on demand for huge coordinate spaces; persistence by path copying, and the range-of-versions queries it enables.
8. *Sqrt decomposition and Mo's algorithm* — the simpler alternative at O(√n); Mo's offline reordering of queries, with the honest note that it is folklore and has no canonical paper.
9. *Beyond arrays* — the Euler tour from Chapter 29 plus this structure equals subtree and path queries on trees; dynamic connectivity via DSU with rollback.

**Machines**
- `dsaSegTree` — **builder** — state: array, segment tree, query decomposition. Controls: drag a query range, point update, operation picker (sum, min, max, gcd), step / reset. **Discovery:** drag a query range and confirm at most two nodes per level are ever partially covered. Note: "Drag a range. The highlighted nodes are the ones that answer it — count them per level."
- `dsaLazyProp` — **stepper** — state: tree with pending lazy values, a range update in flight, push-down events. Controls: range update (drag + value), query, step push-downs, reset, "show pending" toggle. **Discovery:** perform a range update and then a query that forces a push-down, and find the node where the note was cashed in. Note: "An update leaves notes instead of doing the work. Query into one and watch it get paid."
- `dsaMosAlgorithm` — **stepper** — state: queries as points, the block ordering, the two pointers moving. Controls: step / run / reset, block-size slider, sort-order toggle (naive vs Mo's). **Discovery:** compare total pointer movement under naive order and Mo's order, and find the block size that minimizes it. Note: "Same queries, different order. The counter is total pointer movement."

**Figures**
- A segment tree over 8 elements with one query's covering nodes highlighted, two per level marked.
- Lazy propagation: a node holding a pending value, before and after push-down.
- Mo's ordering drawn as a path through query points in (block, right-endpoint) space.

**Rows:** N4, N5, N6, N7, N8, N9, N11, H16 · **Outcomes:** E18, A7, B6 · **Terms:** 18

---

# PART 5 — Graphs

## Chapter 32 — Graphs, Grids and Representations
**Archetype:** mechanism · **Words:** 2,800 · **Prereq:** 10, 24

**Blurb.** The hardest part of most graph problems is noticing that they are graph problems.
This chapter builds the vocabulary and the two representations, then spends most of its length
on the skill that actually matters: recognizing the graph inside a problem that never uses the
word — a grid, a set of word transformations, a dependency list, a set of currency exchange
rates.

**Sections**
1. *Vocabulary* — directed and undirected, weighted, simple, degree, path, cycle, connected, DAG, tree as a special case.
2. *Adjacency list versus matrix* — space and time for each operation, and the density threshold where the matrix wins.
3. *The grid is a graph* — cells as vertices, the 4- and 8-neighbour edge sets, and the bounds check that replaces the adjacency list.
4. *Implicit graphs* — states as vertices, moves as edges; word ladder, the lock puzzle, the jug problem. The graph that is never built.
5. *Connected components and flood fill* — the counting pattern, with both DFS and BFS versions and the stack-depth caveat.
6. *Modelling practice* — six problem statements, none of which mention graphs, with the vertex set and edge set identified for each.

**Machines**
- `dsaGraphRep` — **comparator** — state: a graph shown as list and matrix, operation costs. Controls: add/remove edge by clicking, density slider, operation picker (is-adjacent, neighbours-of, add-edge). **Discovery:** raise the density and find the point where the matrix's memory stops being wasteful. Note: "The same graph, two ways. Pick an operation and compare what each representation costs."
- `dsaImplicitGraph` — **inspector** — state: a word-ladder state space being expanded lazily. Controls: expand a node, reset, dictionary picker. **Discovery:** expand three levels and count the vertices, then compare to the dictionary size. Note: "No graph was built. Click a word to generate its neighbours on demand."

**Figures**
- A grid with one cell's four neighbours drawn as graph edges.
- Adjacency list and matrix for the same 6-vertex graph, memory annotated.

**Rows:** I1, I5 · **Outcomes:** A6, O1 · **Terms:** 16

---

## Chapter 33 — BFS and DFS
**Archetype:** mechanism · **KEYSTONE** · **Words:** 4,400 · **Prereq:** 32

**Blurb.** One traversal, two data structures, and an enormous difference in what they tell
you. BFS gives you shortest paths in unweighted graphs and nothing else; DFS gives you a tree
whose entry and exit times encode the graph's entire structure — which is why Chapter 37 gets
strongly connected components, bridges and articulation points out of a single pass. This
chapter is the keystone of Part 5.

**Sections**
1. *One algorithm, two containers* — the frontier as a queue or a stack, and everything that follows from the choice.
2. *BFS and shortest paths* — the layer argument that proves BFS finds minimum edge counts, and the parent array that recovers the path.
3. *Multi-source BFS* — seeding the queue with every source; rotting oranges and nearest-exit problems, in one pass rather than n.
4. *0-1 BFS* — a deque instead of a queue when edges weigh 0 or 1; the front/back rule and why it preserves the layer invariant. Dijkstra without the heap.
5. *DFS and its tree* — tree, back, forward and cross edges, each defined by the entry/exit interval relationship.
6. *Entry and exit times* — the nesting property, and the three facts it gives you: ancestry in O(1), cycle detection, and the subtree ranges of Chapter 29.
7. *Cycle detection* — the white/grey/black colouring for directed graphs, and why the undirected version needs only a parent check.
8. *Recursion depth in practice* — a 10⁵-node path graph crashes a recursive DFS in Python; the iterative rewrite from Chapter 6.

**Machines**
- `dsaBfsDfs` — **comparator** — state: the same graph traversed both ways, frontier contents, visit order, layer/depth labels. Controls: traversal picker, step / run / reset, start-node picker, graph editor. **Discovery:** run both from the same start and find a vertex that BFS reaches in 2 steps and DFS reaches at depth 7. Note: "Same graph, same start. One uses a queue, one a stack — watch the frontier."
- `dsaDfsTimes` — **stepper** — state: graph, DFS tree, tin/tout per vertex, edge classification. Controls: step / back / reset; toggle edge-type colouring. **Discovery:** find a back edge and confirm its endpoints' time intervals nest, which is exactly what makes it a cycle. Note: "Every edge gets a type. The types come entirely from the entry and exit times."
- `dsaZeroOneBfs` — **stepper** — state: graph with 0/1 weights, deque contents, distance labels. Controls: step / back / reset, weight editor. **Discovery:** find the vertex whose distance is finalized out of insertion order, and say which end of the deque put it there. Note: "Zero-weight edges go to the front, one-weight to the back. Watch the deque stay sorted."

**Figures**
- BFS layers drawn as concentric bands around the source.
- The DFS tree with all four edge types coloured, and the interval-nesting diagram beneath.

**Rows:** I2, I3, I4 · **Outcomes:** E12, A6, O3 · **Terms:** 18

---

## Chapter 34 — Topological Order and DAG Dynamic Programming
**Archetype:** mechanism · **Words:** 3,000 · **Prereq:** 19, 33

**Blurb.** A directed acyclic graph is a dependency list, and a topological order is a
schedule that respects it. This chapter gives you both algorithms for producing one — Kahn's
in-degree peeling and the DFS exit-time reversal — and then the reason topological order
matters far beyond course scheduling: it is the "T" in SRTBOT. Every dynamic program is a DAG,
and the topological order is what makes the recurrence well defined.

**Sections**
1. *The problem* — ordering tasks under dependencies; the two failure modes (a cycle, and no unique answer).
2. *Kahn's algorithm* — 1962; peel vertices of in-degree zero, and detect the cycle by what is left over.
3. *DFS-based ordering* — reverse exit times, with the proof that it is correct.
4. *Counting orderings, and lexicographic order* — the heap variant that produces the smallest valid order.
5. *DP over a DAG* — longest path, path counting, and reachability; the shape SRTBOT's topological step always refers to.
6. *Why longest path is easy here and hard in general* — the forward pointer to Chapter 46.
7. *Functional graphs and successor paths* — each vertex with out-degree one; cycle-finding with binary lifting, and Chapter 11's tortoise and hare as the O(1)-space version.

**Machines**
- `dsaTopoSort` — **stepper** — state: DAG, in-degrees, the ready queue, emitted order. Controls: algorithm picker (Kahn, DFS), step / run / reset, graph editor, "add a cycle" button. **Discovery:** add an edge that creates a cycle and watch Kahn's algorithm stall with vertices remaining. Note: "Peel every vertex that has nothing waiting on it. If you get stuck, there is a cycle."
- `dsaDagDP` — **stepper** — state: DAG with edge weights, per-vertex DP value, the processing order. Controls: problem picker (longest path, count paths, reachability), step / reset. **Discovery:** process the vertices in a non-topological order and watch a value be computed from an unfinished predecessor. Note: "The order is the whole point. Try processing out of order and see what breaks."

**Figures**
- A DAG with in-degrees annotated, mid-peel.
- The same DAG as a DP dependency graph, with the topological order numbered.

**Rows:** I7, I8 · **Outcomes:** E12, E15, A6 · **Terms:** 13

---

## Chapter 35 — Shortest Paths as One Relaxation
**Archetype:** mechanism · **KEYSTONE** · **Words:** 4,800 · **Prereq:** 27, 33, 34

**Blurb.** There are five famous shortest-path algorithms and exactly one idea: relax an edge,
meaning check whether going through it improves the best known distance. Everything that
distinguishes Dijkstra from Bellman-Ford from Floyd-Warshall is the *order* in which
relaxations happen. Once you see that, you stop memorizing five algorithms and start choosing
an ordering based on the graph in front of you — which is exactly what an interviewer is
testing.

**Sections**
1. *Relaxation* — the single operation, its invariant, and the claim that all five algorithms are orderings of it.
2. *BFS as relaxation in layer order* — unweighted graphs, revisited from Chapter 33 in this vocabulary.
3. *Dijkstra* — 1959; relax in increasing distance order using a priority queue; the greedy proof that a popped vertex is final.
4. *Why negative edges break it* — a three-vertex counterexample drawn, with the exact step where the finality proof fails.
5. *Bellman-Ford* — relax every edge V−1 times; why V−1 rounds suffice, and the V-th round as a negative-cycle detector. SPFA as the queue-based optimization and its worst case.
6. *Floyd-Warshall* — all pairs by allowing intermediate vertices one at a time; a three-line triple loop that is really a DP over vertex subsets, with the SRTBOT reading.
7. *Johnson's algorithm* — reweighting with Bellman-Ford potentials so Dijkstra can run on a graph with negative edges; MIT 6.006 lecture 14.
8. *A\** — Dijkstra with a heuristic; admissibility and consistency, and what happens when the heuristic lies.
9. *Choosing* — the decision procedure: weights present? negative? dense? all-pairs? a target with a good heuristic?

**Machines**
- `dsaRelaxation` — **stepper** — state: graph, distance labels, the relaxation queue or order, per-algorithm. Controls: algorithm picker (BFS, Dijkstra, Bellman-Ford, SPFA), step / run / reset, weight editor, negative-edge toggle. **Discovery:** add a negative edge and run Dijkstra, then find the vertex whose distance is finalized too early. Note: "Every algorithm here relaxes edges. Only the order changes — watch the order panel."
- `dsaFloydWarshall` — **builder** — state: the distance matrix, the current intermediate vertex k. Controls: step k / step cell / run / reset, graph editor. **Discovery:** find the cell that improves only when k is a particular vertex, and say what path it just discovered. Note: "One vertex at a time is allowed in the middle. Watch which cells improve at each k."
- `dsaAStar` — **comparator** — state: grid, Dijkstra's explored set beside A*'s, the heuristic values. Controls: heuristic picker (zero, Manhattan, Euclidean, inadmissible), run both / reset, obstacle editor. **Discovery:** set the heuristic to "inadmissible" and find the shorter path A* misses. Note: "Two searches, one grid. Watch how many cells each one opens."

**Figures**
- The three-vertex negative-edge counterexample, with Dijkstra's wrong answer annotated.
- The five algorithms as one relaxation with five ordering rules, in a single comparison figure.

**Rows:** I9, I10, I11, I12, I13 · **Outcomes:** E13, A6 · **Terms:** 19

---

## Chapter 36 — Minimum Spanning Trees and the Cut Property
**Archetype:** mechanism · **Words:** 2,800 · **Prereq:** 7, 23, 35

**Blurb.** Two algorithms, one theorem. The cut property says that the lightest edge crossing
any partition of the vertices is in some minimum spanning tree, and both Kruskal's and Prim's
algorithms are just different ways of choosing which cut to look at. This is also the
canonical matroid from Chapter 23 — the place where "greedy is provably optimal" has a name
and a proof rather than a hope.

**Sections**
1. *The problem* — connect everything at minimum total cost; why the answer is always a tree.
2. *The cut property* — statement and proof by exchange (Chapter 23's argument, applied).
3. *Kruskal* — 1956; sort the edges, add if it does not create a cycle, with union-find from Chapter 7 doing the cycle check.
4. *Prim* — 1957, and Jarník 1930 before him; grow one tree, always taking the lightest edge leaving it, with the priority queue from Chapter 27.
5. *Which to use* — sparse versus dense, and the cost comparison.
6. *MSTs are matroids* — the independence system, the exchange property, and why this closes the loop on Chapter 23.
7. *Second-best MST, and MST edge classification* — which edges are in every MST, in some, or in none.

**Machines**
- `dsaMST` — **comparator** — state: graph, Kruskal's and Prim's partial trees, edge order. Controls: algorithm picker or both, step / run / reset, graph editor, weight editor. **Discovery:** build a graph with two equal-weight edges and find the case where the two algorithms return different trees of the same total weight. Note: "Two algorithms, same total weight. Watch them disagree about which edges."
- `dsaCutProperty` — **inspector** — state: graph, a draggable cut, the crossing edges, the lightest one. Controls: drag vertices between the two sides; highlight crossing edges; "is it in the MST?" reveal. **Discovery:** try to find a cut whose lightest crossing edge is not in the MST. Note: "Split the vertices any way you like. The lightest edge crossing your cut is always in some MST."

**Figures**
- A cut with its crossing edges, lightest one highlighted.
- Kruskal and Prim on the same graph, four snapshots each.

**Rows:** I14 · **Outcomes:** E16, A6, A4 · **Terms:** 13

---

## Chapter 37 — Structure from DFS: SCCs, Bridges and 2-SAT
**Archetype:** mechanism · **Words:** 3,800 · **Prereq:** 33

**Blurb.** Chapter 33 promised that the DFS entry and exit times encode the graph's structure.
This is where you collect. Strongly connected components, bridges and articulation points all
fall out of one pass over the DFS tree with one extra number per vertex — and then 2-SAT, a
problem about boolean formulas that has no visible connection to graphs at all, is solved in
linear time by building the right graph and running the SCC algorithm on it.

**Sections**
1. *Strong connectivity* — the definition, the condensation graph, and why the condensation is always a DAG.
2. *Kosaraju* — two passes and a reversed graph; the correctness argument via exit times.
3. *Tarjan* — one pass, the low-link value, and the stack; why it is the one to implement.
4. *Bridges* — an edge whose removal disconnects; the low-link condition, Hopcroft & Tarjan 1973.
5. *Articulation points* — the same low-link machinery with the root special case that everyone gets wrong once.
6. *2-SAT* — Aspvall, Plass & Tarjan 1979; each clause as two implications, the implication graph, and the theorem that a formula is satisfiable exactly when no variable shares an SCC with its negation. Reading the assignment off the condensation's topological order.
7. *Bipartite checking and colouring* — 2-colouring by BFS, the odd-cycle obstruction, and k-colouring named as NP-hard (Chapter 46).
8. *Eulerian paths* — Euler 1736 and the bridges of Königsberg as the origin of the entire field; Hierholzer's algorithm; the degree conditions; De Bruijn sequences as an application.

**Machines**
- `dsaTarjanSCC` — **stepper** — state: graph, DFS tree, per-vertex index and low-link, the stack, emitted components. Controls: step / back / run / reset, graph editor, algorithm toggle (Tarjan vs Kosaraju). **Discovery:** find the vertex where low-link equals index and confirm a component is emitted exactly then. Note: "Two numbers per vertex. When they become equal, a component closes."
- `dsaBridges` — **stepper** — state: graph, DFS tree, low-links, identified bridges and articulation points. Controls: step / back / reset, graph editor, "remove this edge" test. **Discovery:** remove an identified bridge and confirm the graph splits; remove a non-bridge and confirm it does not. Note: "Low-link says whether a subtree can reach above its parent. If it cannot, that edge is a bridge."
- `dsa2Sat` — **builder** — state: clauses, the implication graph, SCCs, the resulting assignment. Controls: add/edit clauses, build graph, run SCC, read assignment, reset. **Discovery:** add the clause that forces a variable and its negation into one component, and watch satisfiability fail. Note: "Each clause becomes two implications. Satisfiable unless a variable meets its own negation."

**Figures**
- A graph with its condensation drawn beside it, components boxed.
- Low-link values on a DFS tree with the bridge condition annotated on one edge.
- A 2-SAT implication graph with the contradiction component highlighted.

**Rows:** I15, I16, I17, I18, I24 · **Outcomes:** E12, A6 · **Terms:** 17

---

## Chapter 38 — Max-Flow and Min-Cut
**Archetype:** mechanism · **KEYSTONE** · **Words:** 4,400 · **Prereq:** 33, 35

**Blurb.** The maximum amount you can push through a network equals the cheapest set of pipes
you could cut to stop it entirely. That theorem is one of the most useful in the subject,
partly because it is true and partly because an astonishing number of problems that have
nothing to do with networks turn into it — which is Chapter 39's subject. Here you build the
machinery: residual graphs, augmenting paths, and the three algorithms that differ only in how
they choose the next path.

**Sections**
1. *The problem* — a source, a sink, capacities; what a flow is and what conservation means.
2. *The residual graph* — the key idea, and the backward edge that lets the algorithm undo its own decisions.
3. *Ford–Fulkerson* — 1956; augment along any path; the irrational-capacity example where it does not terminate.
4. *Edmonds–Karp* — 1972; choose the shortest augmenting path via BFS, giving O(VE²) independent of capacities.
5. *Dinic* — 1970; level graphs and blocking flows, O(V²E) generally and O(E√V) on unit capacities — the bound that matters for Chapter 39's matching.
6. *Max-flow min-cut* — the theorem, its proof from a saturated residual graph, and how to read the actual cut off the final residual graph.
7. *Min-cost max-flow* — adding costs; successive shortest paths with potentials; the assignment problem and Kuhn's 1955 Hungarian algorithm named.
8. *Global min cut* — Stoer–Wagner, and Karger's randomized contraction as a pointer to Chapter 49's frontier section.

**Machines**
- `dsaMaxFlow` — **simulator** — state: network, current flow, residual graph, augmenting path, total flow. Controls: algorithm picker (Ford–Fulkerson arbitrary, Edmonds–Karp, Dinic), step / augment / run / reset, capacity editor, "show residual" toggle. **Discovery:** run arbitrary-path Ford–Fulkerson on the classic 4-vertex unit-bottleneck graph and count the augmentations, then run Edmonds–Karp on the same graph. Note: "Each augmentation pushes flow along one path. Toggle the residual view to see the backward edges appear."
- `dsaMinCut` — **inspector** — state: a saturated network, the reachable set in the residual graph, the cut edges. Controls: run to saturation, reveal cut, drag vertices to propose your own cut and compare. **Discovery:** propose three cuts by hand and confirm none is cheaper than the flow value. Note: "The flow is maxed out. Now try to find a cheaper cut than the algorithm's."
- `dsaDinicLevels` — **stepper** — state: level graph per phase, blocking flow found. Controls: step phase / step path / reset. **Discovery:** count the phases and confirm the level of the sink strictly increases each time. Note: "Each phase builds a level graph and saturates it. Watch the sink get further away."

**Figures**
- A residual graph beside its flow network, backward edges drawn distinctly.
- The min cut drawn on a saturated network, with the reachable set shaded.

**Rows:** I20, I22, I25, I26 · **Outcomes:** E14, A6 · **Terms:** 18

---

## Chapter 39 — Flow Modelling and Bipartite Matching
**Archetype:** mechanism · **KEYSTONE** · **Words:** 4,200 · **Prereq:** 38

**Blurb.** This is the chapter that justifies the last one. Max-flow is an algorithm you will
almost never need to implement and frequently need to *recognize*, because the examinable
skill — the one universities test and interview banks do not mention at all — is turning a
problem that says nothing about networks into one. Bipartite matching, project selection,
disjoint paths, minimum path cover: same engine, four different wirings.

**Sections**
1. *Modelling as a skill* — the four questions to ask of any problem to decide whether it is a flow problem.
2. *Bipartite matching* — the unit-capacity construction; Dinic's O(E√V) on it, which is Hopcroft–Karp 1973 by another route.
3. *König's theorem* — maximum matching equals minimum vertex cover in bipartite graphs, and how to read the cover off the flow.
4. *Hall's theorem* — when a perfect matching exists, and the deficiency version.
5. *Disjoint paths* — Menger's theorem as a flow corollary; edge-disjoint and vertex-disjoint by node splitting.
6. *Project selection* — the maximum-closure construction, where profits and prerequisites become a min cut. The most surprising reduction in the course.
7. *Minimum path cover on a DAG* — matching in the split graph.
8. *Stable marriage* — Gale & Shapley 1962, which is *not* a flow problem and is the counterexample that keeps the pattern honest; proposer-optimality and the strategy question.

**Machines**
- `dsaBipartiteMatching` — **simulator** — state: bipartite graph, current matching, augmenting path, vertex cover. Controls: step augment / run / reset, edge editor, "show as flow network" toggle, "show König cover" toggle. **Discovery:** find the maximum matching, then reveal the minimum vertex cover and confirm the two numbers are equal. Note: "Match what you can, then find an augmenting path. Toggle the flow view to see it is the same problem."
- `dsaProjectSelection` — **builder** — state: projects with profits, prerequisite edges, the constructed network, the chosen set. Controls: edit profits and prerequisites, build network, run min-cut, reveal selection. **Discovery:** make one prerequisite expensive enough to kill a profitable project and watch the selection change. Note: "Profits become source edges, costs become sink edges, prerequisites become infinite. The min cut picks your projects."
- `dsaGaleShapley` — **stepper** — state: two preference lists, proposals, tentative engagements. Controls: step / run / reset, preference editor, side toggle (who proposes). **Discovery:** swap which side proposes and find a participant who does strictly better. Note: "One side proposes, the other holds the best offer so far. Watch who benefits from proposing."

**Figures**
- A bipartite graph as a flow network, unit capacities marked.
- The project-selection construction with source, sink, infinite edges labelled.

**Rows:** I21, I23 · **Outcomes:** E14, A6, A8 · **Terms:** 16

---

# PART 6 — The Edges and the Engineer

## Chapter 40 — Bit Manipulation
**Archetype:** mechanism · **Words:** 3,200 · **Prereq:** 2, 18

**Blurb.** Bits are how the machine actually stores everything, and a handful of operations on
them replace whole data structures: a set becomes an integer, a subset enumeration becomes a
loop, and counting the ones in a word is a single CPU instruction. This chapter also covers
the XOR properties that make three separate interview classics collapse into one identity.

**Sections**
1. *Two's complement* — why −1 is all ones, what right-shifting a negative number does in Java versus Python, and the sign-extension bug.
2. *The core operations* — and, or, xor, not, shifts, and the masks built from them.
3. *The standard tricks* — test a bit, set, clear, toggle; `n & (n−1)` clears the lowest set bit; `n & −n` isolates it; the power-of-two test.
4. *Popcount* — Brian Kernighan's loop, the parallel-bit-count trick, and the fact that `Integer.bitCount` and `__builtin_popcount` compile to one instruction.
5. *Sets as integers* — subset enumeration, and the O(3ⁿ) submask loop with the proof that the exponent is three and not four.
6. *XOR* — self-inverse, commutative, identity 0; single-number, two-numbers, and prefix-XOR as three faces of one property.
7. *The XOR basis* — linear algebra over GF(2); maximum XOR subset in O(n·32).
8. *Gray code* — Gray 1953; the one-bit-change sequence and its recursive construction.

**Machines**
- `dsaBits` — **playground** — state: a 32-bit value shown as bits, applied operation. Controls: type a number, click individual bits, apply operation picker (`n&(n-1)`, `n&-n`, `n|(n+1)`, shifts, negate), signed/unsigned toggle, 32/64-bit toggle. **Discovery:** negate a number and find where two's complement's "invert and add one" is visible bit by bit. Note: "Click bits to flip them. Apply an operation and watch what it does to the pattern."
- `dsaSubmask` — **stepper** — state: a mask, the enumerated submasks so far, the counter. Controls: edit the mask, step / run / reset, n slider. **Discovery:** total the submask counts over all masks of an n-bit universe and confirm it is 3ⁿ, not 4ⁿ. Note: "Enumerate every submask of the mask. The counter at the bottom totals across all masks."
- `dsaXorBasis` — **builder** — state: inserted numbers, the basis vectors, the maximum achievable XOR. Controls: insert a number, reset, show elimination steps. **Discovery:** insert a number that is already representable and watch the basis not grow. Note: "Each number either adds a new direction or is already reachable. Watch which."

**Figures**
- Two's complement on a 8-bit number line, wrapping.
- The submask enumeration tree for a 3-bit mask, all 8 submasks shown.

**Rows:** M1, M2, M4, M5, M7, M8 · **Outcomes:** E19, O7 · **Terms:** 16

---

## Chapter 41 — String Matching: KMP, Z and Rabin–Karp
**Archetype:** mechanism · **KEYSTONE** · **Words:** 4,400 · **Prereq:** 17, 40

**Blurb.** Finding a pattern in a text is the oldest string problem and the naive algorithm is
quadratic on exactly the inputs people test with. The fixes are three of the most elegant
algorithms in the subject, and KMP in particular is almost universally taught wrong — as
"failure links", a mechanism with no meaning. Taught correctly, its table computes the
*borders* of each prefix, and once you know that, the algorithm derives itself and three other
problems come free.

**Sections**
1. *Strings and their costs* — immutability in Python and Java, why building a string in a loop is quadratic, and what `StringBuilder` and `join` are for.
2. *Naive matching* — O(nm), and the input that achieves it.
3. *Borders and periods* — the definitions first: a border is a proper prefix that is also a suffix; the period follows. This is the chapter's central idea.
4. *The prefix function* — computing every prefix's longest border in O(n), with the amortized argument from Chapter 4.
5. *KMP* — Knuth, Morris & Pratt 1977; the search that never moves the text pointer backwards, derived from the border table rather than stated.
6. *What else the border table answers* — all periods, the smallest repeating unit, and string-rotation checks.
7. *The Z-function* — the longest common prefix with the whole string at each position; the Z-box, and the conversion between Z and prefix functions.
8. *Rabin–Karp* — Karp & Rabin 1987; the rolling hash from Chapter 17, the collision probability, and the anti-hash input that makes it quadratic.
9. *Boyer–Moore* — bad character and good suffix; why skipping backwards makes it sublinear in practice, and what `grep` actually uses.

**Machines**
- `dsaPrefixFunction` — **builder** — state: pattern, the prefix-function table being filled, the border it names. Controls: type a pattern, step / run / reset, "show the border" overlay. **Discovery:** type `aabaaab` and find the prefix whose border is longer than half of it. Note: "Each cell is the length of the longest border of that prefix. The overlay shows you the border itself."
- `dsaKMP` — **stepper** — state: text, pattern, alignment, comparison count, naive comparison count. Controls: step / run / reset, text and pattern editors, naive-comparison toggle. **Discovery:** find a text/pattern pair where naive does 10× the comparisons and confirm the text pointer never moves back in KMP. Note: "Two counters: naive comparisons and KMP's. Find an input where they separate."
- `dsaRollingHash` — **stepper** — state: text window, current hash, the roll arithmetic, collisions found. Controls: step / run / reset, base and modulus pickers including a deliberately bad one. **Discovery:** choose the small modulus and find a false positive. Note: "The hash updates in O(1) as the window slides. Pick a bad modulus and hunt for a collision."

**Figures**
- A string with all its borders drawn as nested brackets.
- KMP's alignment shift derived from the border table, three steps.

**Rows:** O1, O2, O3, O4, O5, O6 · **Outcomes:** E17, A2 · **Terms:** 17

---

## Chapter 42 — Automata and Palindromes: Aho–Corasick and Manacher
**Archetype:** mechanism · **Words:** 3,400 · **Prereq:** 28, 41

**Blurb.** Chapter 41 found one pattern. This one finds a thousand at once, in a single pass,
by building the trie from Chapter 28 and adding KMP's border idea to it — that is
Aho–Corasick, and it is what every spam filter and intrusion detector runs. Then Manacher's
algorithm, which finds every palindromic substring in linear time using the same
already-computed-information trick from a different angle.

**Sections**
1. *The problem* — many patterns, one text; why running KMP k times is the wrong shape.
2. *The trie of patterns* — Chapter 28's structure, now as an automaton's states.
3. *Failure links* — the border idea generalized to a trie; Aho & Corasick 1975; building them with a BFS.
4. *Output links* — reporting every pattern that ends here, including patterns that are suffixes of others.
5. *Matching* — one pass over the text with no backtracking; the total-output bound.
6. *Palindromes, the quadratic way* — expand around centre, 2n−1 centres, and why it is fine most of the time.
7. *Manacher's algorithm* — 1975; the mirror trick that reuses a previously computed radius; the sentinel insertion that removes the odd/even case split.
8. *Regular expressions* — Thompson 1968; regex as an NFA and why backtracking engines suffer catastrophic blowup (ReDoS), with the real-world outage this has caused.
9. *Compression* — run-length, Huffman from Chapter 23, and LZW named; why compression is a string-structure problem.

**Machines**
- `dsaAhoCorasick` — **builder** — state: trie of patterns, failure links, output links, text scan position, matches found. Controls: add pattern, build automaton, step the text scan, reset, "show failure links" toggle. **Discovery:** add two patterns where one is a suffix of the other and find the output link that reports both from one state. Note: "Add patterns, then scan the text once. Every match is found without ever backing up."
- `dsaManacher` — **stepper** — state: the sentinel-padded string, radius array, the current centre and right boundary. Controls: step / back / reset, string editor. **Discovery:** find a position whose radius is copied from its mirror rather than computed, and say what guarantees it. Note: "The radius array fills left to right. Watch how often a value is copied instead of computed."
- `dsaRedos` — **comparator** — state: a regex and an input, backtracking step count versus NFA simulation step count. Controls: regex picker (including `(a+)+b`), input length slider, run both. **Discovery:** raise the input length by one character at a time and watch the backtracking engine's step count double. Note: "Same regex, two engines. Add one character at a time to the input."

**Figures**
- An Aho–Corasick automaton for four patterns, failure links dashed.
- Manacher's mirror: the centre, the right boundary, and the copied radius.

**Rows:** O7, O8, O11, O13, O15 · **Outcomes:** E17, O3 · **Terms:** 16

---

## Chapter 43 — Suffix Arrays and What They Answer
**Archetype:** mechanism · **Words:** 3,400 · **Prereq:** 15, 41

**Blurb.** Sort every suffix of a string and you have a structure that answers questions no
other string structure can: how many distinct substrings are there, what is the longest
substring appearing twice, what is the longest common substring of two strings. This chapter
builds the suffix array by the doubling construction, adds the LCP array in linear time with
Kasai's surprisingly short algorithm, and shows what the pair answers.

**Sections**
1. *The idea* — all n suffixes, sorted; why storing indices rather than strings makes it O(n) space.
2. *Naive construction and why it is O(n² log n)* — the comparison cost nobody accounts for.
3. *The doubling construction* — sort by first 2^k characters using the previous rank array; O(n log² n) simply, O(n log n) with a radix sort. Manber & Myers 1990.
4. *The LCP array* — longest common prefix of adjacent suffixes; Kasai et al. 2001, in linear time, with the invariant that makes it work.
5. *What the pair answers* — distinct substring count, longest repeated substring, longest common substring of two strings via concatenation with a separator.
6. *Pattern search* — binary search over the suffix array, O(m log n), and the LCP-accelerated version.
7. *Suffix automaton* — named, with its size bound and what it answers that the array does not; suffix trees named with a pointer to the Frontier chapter.
8. *String sorts* — LSD and MSD radix sort on strings, 3-way radix quicksort; the connection back to Chapter 15.

**Machines**
- `dsaSuffixArray` — **builder** — state: string, suffixes, rank arrays at each doubling stage, final array. Controls: type a string, step by doubling stage, reset, "show suffixes" toggle. **Discovery:** type a string of all the same character and watch the doubling stages do the maximum work. Note: "Sort by the first character, then the first two, then four. Watch the ranks refine."
- `dsaLcpArray` — **stepper** — state: suffix array, LCP values being filled by Kasai's order, the h counter. Controls: step / back / reset. **Discovery:** confirm the h counter decreases by at most one per step, which is the whole reason Kasai is linear. Note: "Kasai fills LCP in the original string's order, not the array's. Watch h."
- `dsaSubstringCount` — **playground** — state: string, suffix array, LCP, computed distinct-substring count, brute-force count. Controls: type a string, compare both counts. **Discovery:** find a string where the distinct count is far below n(n+1)/2 and read the deficit off the LCP array. Note: "Total substrings minus repeated prefixes. The LCP array is the repeated part."

**Figures**
- All suffixes of a short string, unsorted and sorted, with the array of indices beside them.
- The LCP array drawn as a skyline under the sorted suffixes.

**Rows:** O9, O10, O12, D10(revisit) · **Outcomes:** E17, A7 · **Terms:** 15

---

## Chapter 44 — Numbers, Counting and Games
**Archetype:** mechanism · **Words:** 4,200 · **Prereq:** 3, 40

**Blurb.** The number-theory and combinatorics every algorithm course needs and few teach
together: why the sieve is O(n log log n), what a modular inverse is and why `10⁹+7` is in
every contest solution, how to count things without enumerating them, and then impartial game
theory — Nim and Sprague–Grundy — which is the one piece of mathematics that turns a whole
class of "who wins?" problems into a single XOR.

**Sections**
1. *Integer hazards* — overflow, floor division on negatives, float comparison; the differences between Python's arbitrary precision and Java's 64-bit wrap.
2. *GCD and Euclid* — *Elements* VII, the oldest algorithm in this course; the complexity proof via Fibonacci; extended Euclid and Bézout coefficients.
3. *Primes* — trial division to √n, the sieve of Eratosthenes with its O(n log log n) analysis, the linear sieve, and the segmented sieve for ranges.
4. *Factorization and divisor functions* — smallest-prime-factor tables, divisor count and sum, Euler's totient.
5. *Modular arithmetic* — why `10⁹+7`, modular inverse by Fermat and by extended Euclid, and the Chinese remainder theorem named.
6. *Binary exponentiation* — and its generalization to matrices, giving linear recurrences in O(log n).
7. *Counting* — binomial coefficients with Pascal and with factorials mod p, Catalan numbers and the three problems they all answer, stars and bars, inclusion–exclusion.
8. *Probability and expectation* — linearity from Chapter 5 applied to algorithm analysis; expected-value DP; Markov chains named.
9. *Impartial games* — game states as a graph, winning and losing positions, Nim and the XOR theorem (Bouton 1901), Sprague–Grundy (1935/1939) and how to decompose a game into independent piles.

**Machines**
- `dsaSieve` — **stepper** — state: n numbers, marks being struck, operation counter. Controls: n slider, step by prime / run / reset, variant toggle (naive, √n start, linear sieve). **Discovery:** count total marks for n=1000 and compare to n log log n rather than n log n. Note: "Strike every multiple of each prime. The counter shows why this is nearly linear."
- `dsaModularInverse` — **playground** — state: a, m, the inverse, the extended Euclid table. Controls: type a and m, compute, show the table. **Discovery:** choose an a sharing a factor with m and find why no inverse exists. Note: "Find x with a·x ≡ 1 (mod m). Try an a that shares a factor with m."
- `dsaNim` — **simulator** — state: piles, the XOR value, winning move highlighted. Controls: edit piles, make a move, let the machine move, reset. **Discovery:** reach a position with XOR zero and confirm that every move you make hands the win back. Note: "The XOR of the pile sizes is the whole game. Try to win from a position where it is zero."
- `dsaGrundy` — **builder** — state: a game graph, computed Grundy numbers by mex. Controls: edit moves, step the computation, reset, game picker. **Discovery:** find two sub-games whose Grundy numbers XOR to zero and confirm the combined position is losing. Note: "Each position's number is the smallest one its moves cannot reach. XOR them to combine games."

**Figures**
- The sieve mid-run with each prime's multiples in a distinct shade.
- A Nim position with pile sizes in binary, the XOR column highlighted.

**Rows:** P1, P2, P3, P4, P5, P6, P7, P9, P10, K17 · **Outcomes:** E19, A2 · **Terms:** 20

---

## Chapter 45 — Geometry
**Archetype:** mechanism · **Words:** 3,400 · **Prereq:** 12, 15

**Blurb.** Computational geometry is where floating point goes to die, and the first lesson of
this chapter is to avoid it: the orientation test, which is the primitive every other
algorithm here is built from, is an integer determinant when your inputs are integers. From
there you get convex hulls, polygon area, and sweep-line intersection — plus the 45-degree
rotation that turns Chebyshev distance into Manhattan and makes a hard problem easy.

**Sections**
1. *Points and vectors* — the cross product as a signed area, and the orientation test as its sign.
2. *Robustness* — why `<` on floats is a bug; exact integer arithmetic, epsilon comparison when you cannot avoid floats, and the overflow bound on the determinant.
3. *Segment intersection* — the four-orientation test plus the collinear special case that everyone omits.
4. *Polygon area and point-in-polygon* — the shoelace formula, ray casting, and the winding-number alternative.
5. *Convex hull* — Graham 1972 and Andrew's monotone chain 1979; the stack-based construction, which is a monotonic stack from Chapter 10 in disguise.
6. *Sweep line in the plane* — Bentley & Ottmann 1979 for segment intersections; rectangle union area with a segment tree from Chapter 31.
7. *Distance metrics* — Manhattan, Chebyshev, and the 45° rotation that converts between them.
8. *Convex hull trick* — the geometric view of Chapter 22's DP optimization; Li Chao trees named.
9. *Linear programming, briefly* — the geometric picture of feasible regions and duality; CLRS 4e's removal of the simplex detail and why that was the right call for a course like this.

**Machines**
- `dsaOrientation` — **playground** — state: three draggable points, the cross product value, the orientation verdict. Controls: drag any point; integer/float toggle; show the determinant arithmetic. **Discovery:** drag the three points nearly collinear with floats on, and find the position where the verdict flips wrongly. Note: "Drag the points. The number is a signed area; its sign is the answer."
- `dsaConvexHull` — **stepper** — state: point set, the hull stack, the current turn test. Controls: add/drag points, algorithm picker (Graham, monotone chain), step / run / reset. **Discovery:** find the point that is pushed onto the stack and later popped, and confirm it was a right turn that evicted it. Note: "Sort, then sweep, popping every clockwise turn. It is a monotonic stack over angles."
- `dsaRectUnion` — **stepper** — state: rectangles, sweep position, the active interval structure, accumulated area. Controls: add/drag rectangles, step / run / reset. **Discovery:** overlap three rectangles and confirm the area is counted once, not three times. Note: "Sweep left to right. The structure under the line tracks how much y is currently covered."

**Figures**
- The cross product as a signed parallelogram area, three orientations drawn.
- The 45° rotation mapping Chebyshev balls to Manhattan balls.

**Rows:** Q1, Q2, Q3, Q4, Q6, Q7, Q8, P11, P12, P13 · **Outcomes:** A3, O5 · **Terms:** 16

---

## Chapter 46 — Intractability: Recognizing What Cannot Be Done
**Archetype:** mechanism · **Words:** 3,600 · **Prereq:** 20, 23, 39

**Blurb.** Every technique in this course has been about finding a fast algorithm. This
chapter is about knowing when to stop, which is a skill with a precise theory behind it and
enormous practical value: the difference between an engineer who spends a week on a problem
that has no polynomial solution and one who spends an hour and then ships an approximation.

**Sections**
1. *P and NP* — decision problems, verifiers, and the honest statement of what NP means (and the three things it does not mean).
2. *Reduction* — the mechanical definition, the direction that trips everyone up, and why "reduces to" is the opposite of what it sounds like.
3. *NP-completeness* — Cook 1971 and Karp's 21 problems, 1972; SAT as the root, and the reduction tree from SAT to the problems you have already met.
4. *The ones you will actually meet* — subset sum (Chapter 20), TSP (Chapter 22), graph colouring (Chapter 37), vertex cover, clique, Hamiltonian path.
5. *Recognizing hardness in the room* — the practical checklist; how to say "this is NP-hard" in an interview and what to say next.
6. *What to do instead* — exact exponential algorithms with good constants, parameterized tractability, approximation with a proved ratio (vertex cover's 2-approximation worked), and heuristics with no guarantee.
7. *Reductions as a design tool* — using a reduction to *solve* rather than to prove hard; Sedgewick's framing, with the flow reductions from Chapter 39 as the model.
8. *Beyond NP* — PSPACE and the complexity zoo named, with a pointer to the Frontier chapter.

**Machines**
- `dsaReduction` — **stepper** — state: an instance of problem A, the transformation, the resulting instance of B, the answer mapped back. Controls: reduction picker (3-SAT→independent set, vertex cover↔independent set, subset sum→partition), step / reset. **Discovery:** flip one clause in the SAT instance and watch which gadget in the graph changes. Note: "Watch the instance transform. The answer to one problem reads off as the answer to the other."
- `dsaApproxVertexCover` — **comparator** — state: graph, the 2-approximation's cover, the optimal cover. Controls: run approximation / run exact (small graphs) / reset, graph editor. **Discovery:** find the graph where the approximation returns exactly twice the optimum, which is the bound being tight. Note: "The approximation takes both ends of any uncovered edge. Compare its size to the true minimum."

**Figures**
- Karp's reduction tree from SAT down to six problems the course has met.
- The 3-SAT to independent-set gadget, one clause drawn.

**Rows:** A10, A11, A14, A15, I19, I24(partial) · **Outcomes:** E20, A9 · **Terms:** 16

---

## Chapter 47 — The Recognition Procedure
**Archetype:** engineering reality / field guide · **Words:** 4,000 · **Prereq:** all of 1–46

**Blurb.** This is the chapter the whole course has been building toward, and the one no
practice sheet can write: a procedure for getting from an unseen problem statement to a
candidate technique, out loud, in order, under time. Not a lookup table of cues — those are
ambiguous and incomplete — but a decision procedure with tie-breaks, confirmation tests, and
an explicit answer for the case everyone pretends does not happen: no pattern matches.

**Sections**
1. *Why cue tables fail* — Sean Prashad's rule set, reproduced in structure and then stress-tested: four cues point to more than one technique with no tiebreak, and two thirds of this course has no entry at all.
2. *Step 1 — read the constraints first* — Chapter 2's arithmetic: n and the time limit give you the admissible complexity class before you have understood the problem.
3. *Step 2 — name the object* — sequence, set, tree, graph, grid, interval, string, number, game. The single most discriminating question.
4. *Step 3 — name the question* — existence, count, optimum, construction, ordering, or a stream of queries. This crosses with step 2 to give a small candidate set.
5. *Step 4 — the confirming test* — for each candidate, the property that must hold; monotonicity for binary search, optimal substructure for DP, an exchange argument for greedy, a matching invariant for two pointers.
6. *Step 5 — the rejection* — say out loud why the other candidates fail, which is what an interviewer is actually scoring.
7. *When nothing matches* — the five moves: solve the brute force and optimize it, solve a smaller version, solve a special case, look for the reduction (Chapter 46), and check whether it is hard.
8. *The procedure on six unseen problems* — worked end to end, including one where the first candidate is wrong and is abandoned, and one that terminates at "this is NP-hard".
9. *Practising the procedure* — how to drill recognition separately from implementation.

**Machines**
- `dsaRecognize` — **playground** — state: a problem statement, the learner's answers at each of the five steps, the candidate set narrowing. Controls: read statement, answer each step from a menu, reveal the expert trace, next problem (12 problems). **Discovery:** find the problem where your step-3 answer eliminates the technique you were sure it would be. Note: "Read the statement. Answer the five questions in order before revealing the trace."
- `dsaConstraintArithmetic` — **tuner** — state: n, time limit, operations per second, the admissible complexity classes. Controls: n slider, limit slider, language toggle (Python ~10⁷ ops/s, Java ~10⁸–10⁹). **Discovery:** set n = 10⁵ and find which complexity classes survive in Python but not the ones that survive in Java. Note: "Set n and the limit. The classes that fit are highlighted — note that the language changes the answer."
- `dsaCueConflicts` — **inspector** — state: the cue table with conflicting entries highlighted. Controls: click a cue to see every technique it suggests and the tie-break question. **Discovery:** find the cue that suggests four different techniques. Note: "Click a cue. The problem is not that the table is wrong, it is that it is ambiguous."

**Figures**
- The object × question matrix with candidate techniques in each cell.
- The five-step procedure as a flow, with the "nothing matches" branch drawn as a first-class path.

**Rows:** S7, A8(applied) · **Outcomes:** O1, A8, E21 · **Terms:** 12

---

## Chapter 48 — The Working Engineer's Handbook
**Archetype:** practitioner handbook · **Words:** 4,200 · **Prereq:** 16, 17, 47

**Blurb.** What changes in your daily work once you understand the mechanisms. This chapter is
about the code you actually write: which container to reach for in Python and in Java and what
it really costs, the traps that silently make your code quadratic, how to test an algorithm
you are not sure about, how to benchmark honestly, and how to present a solution in an
interview in the order that gets scored.

**Sections**
1. *The container cost tables* — Python's `list`, `dict`, `set`, `deque`, `heapq`, `bisect`; Java's `ArrayList`, `LinkedList`, `HashMap`, `TreeMap`, `ArrayDeque`, `PriorityQueue`. Every row justified by a mechanism from earlier chapters, not asserted.
2. *The traps* — `list.insert(0, x)`, `list.pop(0)`, string concatenation in a loop, `ArrayList.remove(i)`, autoboxing in `PriorityQueue<Integer>`, `==` on boxed Integers above 127, `HashMap` iteration order, mutating a key after insertion.
3. *Language limits* — Python's recursion limit and how to raise it safely or avoid it; JVM stack sizes; Java's silent `int` overflow versus Python's arbitrary precision; floor division on negatives, which differs between the two.
4. *Finding the accidental quadratic* — the profile-first discipline, the shapes that hide an O(n²) inside innocent code, and three real examples.
5. *Testing an algorithm* — the brute-force oracle, random small inputs, and shrinking a failing case to something you can read. The method used by every capstone chapter.
6. *Benchmarking honestly* — warmup and the JIT, repetition and variance, stating conditions, and why a single timing is not a measurement. Where JMH fits and when you need it.
7. *Design problems as online problems* — LRU and LFU revisited with Chapter 2's model and the competitive-ratio framing from the Frontier; rate limiters, hit counters, and the median stream.
8. *Randomized structures in practice* — O(1) insert/delete/getRandom; reservoir sampling (Vitter 1985); Fisher–Yates, and the off-by-one that produces a biased shuffle — with the bias measured rather than asserted.
9. *The interview protocol* — invariant, cost, edge cases, then code. Why this order, what to say when stuck, and how to disagree with an interviewer who is wrong.

**Machines**
- `dsaContainerCosts` — **comparator** — state: operation × container cost matrix for both languages, measured timings. Controls: language toggle, operation picker, n slider, "measured vs asymptotic" toggle. **Discovery:** find the operation where Python's `list` and Java's `ArrayList` differ, and the one where `LinkedList` finally wins. Note: "Pick an operation. The asymptotic cost is one row; the measured time is another."
- `dsaQuadraticHunt` — **playground** — state: five short code snippets, learner's verdict on each, measured curve. Controls: pick a snippet, guess its complexity, run the measurement. **Discovery:** find the snippet that looks linear and is quadratic because of one standard-library call. Note: "Read each snippet and guess its complexity. Then measure it."
- `dsaShuffleBias` — **simulator** — state: 3-element permutation counts over many trials, correct and buggy shuffle. Controls: run 100 / run 10,000 / reset, algorithm toggle. **Discovery:** run the buggy shuffle 10,000 times and find which permutations are over-represented. Note: "Two shuffles, one off-by-one apart. Count how often each permutation appears."

**Figures**
- The container cost matrix for both languages, as an SVG table.
- The biased-shuffle histogram beside the uniform one.

**Rows:** S2, S3, S4, S5, S6, G6(revisit), R1, R2, R3, R4, A12, A13, A17 · **Outcomes:** O3, O4, O5, O6, O7, O8 · **Terms:** 18

---

## Chapter 49 — The Field Guide and the Frontier
**Archetype:** engineering reality / field guide · **Words:** 3,800 · **Prereq:** all of 1–48

**Blurb.** Two indexes and a map. The first index runs the other way from the rest of the
course — from a problem you have, to the technique that solves it, in Skiena's direction
rather than a textbook's. The second is everything this course deliberately named without
teaching: the algorithms at the edge of what an interview or a university final will ask, each
with its origin and where to read it, so that "complete" means something you can check.

**Sections**
1. *How to use an index like this* — why problem-to-technique lookup is the direction you actually need, and why no textbook is organized that way.
2. *The catalogue* — ~60 problem shapes, each with: what it is, the technique, the chapter, the cost, and the trap. Modelled on Skiena's Part II.
3. *The structure chooser* — a decision procedure across every structure in the course, by workload rather than by feature list.
4. *The algorithm chooser* — the same for graph algorithms, DP shapes and string algorithms.
5. *The Frontier: analysis* — PSPACE and the complexity zoo; local search, simulated annealing and metaheuristics; external-memory and cache-oblivious models.
6. *The Frontier: structures* — cuckoo and perfect hashing; suffix trees; Sqrt trees; randomized heaps; link-cut trees.
7. *The Frontier: graphs* — Karger's randomized min cut; Stoer–Wagner; edge and vertex connectivity and Menger's theorem; Kirchhoff's matrix-tree theorem; Prüfer codes; D'Esopo-Pape.
8. *The Frontier: mathematics* — sum-over-subsets DP; Burnside and Pólya; Montgomery multiplication; Garner's algorithm; discrete roots; the Stern–Brocot tree.
9. *The Frontier: geometry* — Delaunay triangulation and Voronoi diagrams; half-plane intersection; vertical decomposition.
10. *Where to go next* — the three other courses in the CS Fundamentals track, the reading map, and a short honest note on what contest programming teaches that interviews do not.

**Machines**
- `dsaProblemIndex` — **playground** — state: searchable catalogue of ~60 problem shapes. Controls: free-text search, filter by object type and question type, click for the entry. **Discovery:** search for a problem you failed earlier in the course and find the chapter you needed. Note: "Describe your problem in a few words. The index answers with a technique and a chapter."
- `dsaStructureChooser` — **comparator** — state: a workload specification, the ranked structures. Controls: sliders for update:query ratio, ordered-access need, memory budget, online/offline toggle. **Discovery:** find the workload where the answer is a plain sorted array and nothing cleverer. Note: "Describe your workload. The ranking updates — note when the simplest answer wins."

**Figures**
- The structure chooser as a decision tree.
- The Frontier as a map: the course's territory, with each named-but-untaught algorithm placed at its border.

**Rows:** A16, D8(revisit), E8, E9, I25(revisit), I26(revisit), K21, O9(suffix tree), O12, P8, Q9, R6 · **Outcomes:** A6, A7, O1 · **Terms:** 14

---

# PART 7 — Build It: The Structures Library

**The capstone is `pocketds`**, a data-structures library written from scratch in **Python and
Java**, presented as `code-tabs` with the two versions equivalent line for line in intent.
Every chapter adds one structure and ends with a test the learner runs that proves it, and the
test is always the same shape: **a fuzzer that drives your structure and the standard
library's through the same random operation stream and asserts they agree at every step.**
That is the rule of this capstone. You do not check your red-black tree by reading it; you
check it by running a million random operations against `TreeMap` and finding the first
disagreement.

## Chapter 50 — pocketds: The Array That Grows
**Archetype:** build-it · **Words:** 3,000 · **Prereq:** 4

**Blurb.** The first layer, and the one that sets the method for all eight: a dynamic array
built on a fixed buffer, with a growth policy you choose and then *measure*. Chapter 4 proved
that doubling gives amortized O(1). Here you instrument the structure, count every element
copy, plot the potential function, and watch the theory come out of your own data.

**Sections**
1. *The interface* — what the structure promises, written before any code; the cost contract from Chapter 26 §1.
2. *The fixed buffer and the growth step* — `append`, `get`, `set`, `pop`, with the capacity check.
3. *The growth policy as a parameter* — ×2, ×1.5, +k; instrumenting the copy counter.
4. *Insert and delete at an index* — the O(n) operations, and why they are O(n).
5. **The test** — a fuzzer against Python's `list` and Java's `ArrayList` over 10⁶ random operations; then the amortization measurement, plotted, with the potential function overlaid.
6. *The confession* — what this array does not do: no shrink policy, no memory reuse, no iterator invalidation semantics. Pointers to where the real ones handle it.

**Rows:** covered in 4, 26 (implementation) · **Outcomes:** B1 · **Machine:** `dsaPocketArray` — **builder** — state: your implementation's internal buffer and the measured copy curve. Controls: run the fuzzer, change growth policy, plot. **Discovery:** set growth to +16 and watch your measured curve stop matching the amortized-constant line.

---

## Chapter 51 — The Hash Map, and the Keys That Break It
**Archetype:** build-it · **Words:** 3,600 · **Prereq:** 17, 50

**Blurb.** An open-addressing hash map with linear probing, resizing and tombstones — the
design CPython uses rather than the chaining design most tutorials build. Then the part nobody
asks you to do: construct the adversarial key set that makes your own table quadratic, measure
the degradation, and fix it with a randomized seed.

**Sections**
1. *The interface* — `put`, `get`, `remove`, `len`, iteration order.
2. *The hash function* — using the language's, and why; what `__hash__` and `hashCode` must guarantee.
3. *Linear probing and the probe sequence* — with the clustering visible in your own table.
4. *Tombstones* — the deletion bug from Chapter 17, reproduced in your code first, then fixed.
5. *Resizing* — the load-factor trigger and the rehash, with the amortized argument from Chapter 50 reused.
6. **The test** — fuzz against `dict` and `HashMap`, including deletes, over a million operations; then generate colliding keys for your own function and measure the lookup cost before and after adding a random seed.
7. *The confession* — no `__eq__` contract enforcement, no iteration-order guarantee, no concurrent-modification detection, no treeification.

**Rows:** covered in 17 (implementation) · **Outcomes:** B2, E7 · **Machine:** `dsaPocketHash` — **simulator** — state: your table under a normal and an adversarial key stream, with timings. Controls: run either stream, toggle the seed. **Discovery:** find the number of colliding keys at which your lookup becomes visibly linear.

---

## Chapter 52 — The Balanced Tree
**Archetype:** build-it · **Words:** 4,000 · **Prereq:** 26, 51

**Blurb.** A treap, not a red-black tree, and the choice is deliberate: the treap gets you
expected O(log n) with rotations you can hold in your head, which means you will finish it,
understand it, and be able to debug it — where a hand-written red-black tree is 400 lines of
case analysis that teaches you less. Then you augment it with subtree sizes and get
order-statistics queries, which is the thing `TreeMap` will not give you.

**Sections**
1. *The interface* — ordered map operations plus `select(k)` and `rank(key)`.
2. *BST insert and delete* — the three deletion cases from Chapter 26, implemented.
3. *The treap* — random priorities, the heap invariant, and rotations to restore it; why the expected height is O(log n).
4. *Split and merge* — the two operations that make a treap easy, and every other operation rewritten in terms of them.
5. *Augmenting with subtree size* — the invariant to maintain, and where it must be updated.
6. **The test** — fuzz against `TreeMap` / `SortedDict` on the map operations, and against a sorted list for `select` and `rank`; then measure the tree's height across 10⁵ insertions and compare it to the theoretical bound.
7. *The confession* — expected rather than worst-case bounds; no persistence; no bulk-load; recursion depth on adversarial random seeds.

**Rows:** covered in 26 (implementation) · **Outcomes:** B3 · **Machine:** `dsaPocketTreap` — **builder** — state: your treap with priorities shown, measured height curve. Controls: insert/delete, run the fuzzer, plot height vs log n. **Discovery:** find a random seed that produces a tree more than twice the expected height, and see how rare it is.

---

## Chapter 53 — The Heap, and the Linear Build
**Archetype:** build-it · **Words:** 3,000 · **Prereq:** 27, 50

**Blurb.** A binary heap in an array, with both construction methods implemented side by side
so you can measure the claim from Chapter 27 that `build-heap` is O(n) while n inserts is
O(n log n). This is the shortest capstone chapter and it carries the most satisfying
measurement in the course.

**Sections**
1. *The interface* — `push`, `pop`, `peek`, `heapify`, and the comparator parameter.
2. *Sift up and sift down* — implemented over the array indexing from Chapter 27.
3. *Two constructions* — repeated push, and bottom-up heapify; both instrumented.
4. *Decrease-key and the index map* — the operation Dijkstra wants and `heapq` does not have, and the lazy-deletion alternative everyone actually uses.
5. **The test** — fuzz against `heapq` and `PriorityQueue`; then the build-cost measurement across n from 10³ to 10⁷, plotted, showing the two curves separate.
6. *The confession* — no meld, no decrease-key without the index map, no stability on equal keys.

**Rows:** covered in 27 (implementation) · **Outcomes:** B4 · **Machine:** `dsaPocketHeap` — **comparator** — state: measured swap counts for both constructions across n. Controls: n slider, run. **Discovery:** find the n at which the two construction costs differ by more than 5×.

---

## Chapter 54 — Union–Find, Fenwick and the Segment Tree
**Archetype:** build-it · **Words:** 4,200 · **Prereq:** 7, 30, 31, 50

**Blurb.** Three structures in one chapter because they share a test harness: all three are
"maintain something over a changing collection and answer queries", and all three are fuzzed
against a naive array that recomputes from scratch. You will also implement the rollback
variant of union–find, which is the one that makes offline dynamic connectivity possible.

**Sections**
1. *Union–find* — both optimizations, and the measured α(n) curve across n up to 10⁷.
2. *Union–find with rollback* — an undo stack instead of path compression, and why the two are incompatible.
3. *The Fenwick tree* — the lowest-set-bit loops, point update and prefix query, in about fifteen lines.
4. *The segment tree over a monoid* — the operation and identity as parameters, so one implementation serves sum, min, max and gcd.
5. *Lazy propagation* — the pending value, the push-down, and the composition rule for two lazy operations.
6. **The test** — all three fuzzed against a naive array over random operation streams; the segment tree tested with four different monoids using the same harness; a rollback test that undoes to a checkpoint and compares against a saved snapshot.
7. *The confession* — no persistence, no dynamic node allocation, no 2-D, and a recursive segment tree rather than the faster iterative one, with the reason.

**Rows:** covered in 7, 30, 31 (implementation) · **Outcomes:** B5, B6 · **Machine:** `dsaPocketSegTree` — **builder** — state: your tree under a fuzz stream with the naive array beside it. Controls: run fuzzer, monoid picker, inject a deliberate bug. **Discovery:** enable the injected bug and find the first operation where the two disagree.

---

## Chapter 55 — The Trie and Aho–Corasick
**Archetype:** build-it · **Words:** 3,400 · **Prereq:** 28, 42, 51

**Blurb.** A trie, then the automaton built on top of it. The trie is straightforward; the
failure links are the first place in this capstone where a subtle bug produces *almost* correct
output, which is exactly why the fuzzer compares against a naive multi-pattern scan rather
than against your own reading of the code.

**Sections**
1. *The trie* — nodes as maps or arrays, the memory trade, `insert`, `search`, `starts_with`, `delete`.
2. *Building failure links* — the BFS from Chapter 42, implemented, with the root special case.
3. *Output links* — reporting nested patterns, and the bug you get without them.
4. *The scan* — one pass, no backtracking.
5. **The test** — fuzz against a naive "search every pattern separately" scan over random texts and pattern sets, including patterns that are suffixes of each other; assert the match sets are identical including positions.
6. *A measurement* — total time against the number of patterns, showing your automaton flat where the naive scan is linear in pattern count.
7. *The confession* — no compression, no dynamic pattern addition after building, byte alphabet only.

**Rows:** covered in 28, 42 (implementation) · **Outcomes:** B8 · **Machine:** `dsaPocketAho` — **comparator** — state: your automaton's timing against the naive scan, as pattern count rises. Controls: pattern-count slider, run. **Discovery:** find the pattern count at which the automaton is 20× faster.

---

## Chapter 56 — The Graph Engine: Dijkstra and Dinic
**Archetype:** build-it · **Words:** 4,400 · **Prereq:** 35, 38, 53, 54

**Blurb.** The last and largest layer: adjacency structures, Dijkstra running on the heap you
built in Chapter 53, and Dinic's max-flow. The tests here are the best in the capstone, because
graph algorithms can check each other — Dijkstra is verified against Bellman-Ford on the same
graph, and your max-flow is verified against a brute-force minimum cut by enumerating every
vertex subset on small instances.

**Sections**
1. *The graph structure* — compressed adjacency (CSR) rather than a list of lists, with the cache argument from Chapter 16 as the reason.
2. *BFS and DFS* — iterative only, because Chapter 33 showed what recursion does at 10⁵ vertices.
3. *Dijkstra* — on your own heap from Chapter 53, with lazy deletion.
4. *Bellman-Ford* — as the oracle, and as the negative-cycle detector.
5. *Dinic* — level graphs, blocking flow, the edge-list-with-paired-indices representation that makes residual updates trivial.
6. **The tests** — Dijkstra against Bellman-Ford on 10⁴ random weighted graphs; Dinic against brute-force min-cut (2^V enumeration) on every graph with V ≤ 12; a shortest-path test that asserts the recovered path's weight equals the reported distance.
7. *A measurement* — Dijkstra's cost against graph density, showing where the heap stops helping.
8. *The confession* — no min-cost flow, no parallel edges in the CSR builder, integer weights only, no dynamic edge insertion.

**Rows:** covered in 33, 35, 38 (implementation) · **Outcomes:** B7 · **Machine:** `dsaPocketFlow` — **simulator** — state: your Dinic's phases against the brute-force cut enumeration on a small graph. Controls: graph size slider, run both, reset. **Discovery:** find the smallest graph where brute force takes longer than Dinic.

---

## Chapter 57 — The Honest Benchmark, the Confession Table and Three Graduations
**Archetype:** build-it · **Words:** 4,000 · **Prereq:** 16, 48, 50–56

**Blurb.** You have eight structures. Now find out how they compare to the ones your language
ships, and — this is the part that matters — explain every single gap with a mechanism from
this course rather than with a shrug. Then the confession table: every simplification you
made, with the chapter that holds the real machinery. It ends with three projects that take
`pocketds` toward something real, each scoped to a weekend.

**Sections**
1. *How to benchmark this honestly* — warmup, repetition, variance, stating conditions; the JIT problem in Java and why the first thousand iterations are a lie.
2. *The results* — your eight structures against `list`/`ArrayList`, `dict`/`HashMap`, `TreeMap`, `heapq`/`PriorityQueue`, measured on the same machine with conditions printed.
3. *Explaining every gap* — each difference attributed to a named mechanism: your hash map is 3× slower than `dict` because of the compact-layout indirection CPython uses; your treap is slower than `TreeMap` because rotations touch more cache lines than colour flips; your heap is competitive because there was nowhere to hide.
4. *Where you are faster, and why that is suspicious* — the cases where your structure wins because it does less, not because it is better.
5. *The confession table* — every simplification across all eight chapters, with the chapter that holds the real machinery, ending on "this is early, not wrong".
6. *Graduation project 1 — persistence* — make the segment tree persistent by path copying, and answer queries about any past version.
7. *Graduation project 2 — a real hash map* — add treeification at a bucket threshold, and reproduce the OpenJDK behaviour you read about in Chapter 16.
8. *Graduation project 3 — an external-memory B-tree* — build the structure of Chapter 26 §8 against a file rather than memory, and measure the page reads. The bridge into *Databases in Depth*.

**Rows:** S5(applied), D7(revisit) · **Outcomes:** B9, O5 · **Machine:** `dsaBenchBoard` — **comparator** — state: the full benchmark matrix, yours against the standard library, with per-row mechanism attribution. Controls: structure picker, operation picker, n slider, "show attribution" toggle. **Discovery:** find the one operation where your structure beats the standard library, and read why.

---

## 3. The capstone plan (§9 checklist)

| §9 requires | This capstone |
|---|---|
| 5–8 chapters, one layer each | **8** (50–57), one structure per chapter except 54 which groups three that share a harness |
| Two languages, tabbed, equivalent line for line | **Python + Java**, `code-tabs` per §10.2 |
| Each chapter ends with a test the learner runs | Every chapter: a **differential fuzzer** against the language's own standard library, or against a brute-force oracle where no library equivalent exists |
| Design decisions made out loud, naming the road not taken | Each chapter's §1 states the interface and the alternative design, naming the chapter that explains it. The treap-over-red-black choice in Chapter 52 is the model |
| Honest benchmark near the end | Chapter 57 §§1–4, with conditions printed and every gap attributed to a mechanism |
| Confession table | Chapter 57 §5, collecting all eight chapters' confessions, ending "this is early, not wrong" |
| Graduation: three projects, a weekend each | Chapter 57 §§6–8: persistence, treeification, an external-memory B-tree |
| Code complete as shown, no hidden helpers | Every structure fits in its chapter; the fuzzers use only `random`, `assert` and the standard test runner (Charter §7) |

---

## 4. The three free chapters

§2 requires exactly three, chosen so a visitor sees at least two machines and the house voice.

| Ch | Title | Machines shown | Why this one |
|---|---|---|---|
| **1** | The Shape of the Subject | `dsaFourSolutions`, `dsaCourseMap` | The orientation chapter; the four-solutions race is the single best 60-second demonstration of what the course is, and it lands the "patterns with proofs" thesis before any paywall |
| **2** | What a Running Time Is | `dsaGrowthRaces`, `dsaBigOQuiz` | The highest-traffic topic in the subject, and the chapter that proves this course is not a sheet: the word-RAM model and bits-versus-elements in the first free chapter |
| **7** | Union–Find: The Whole Method on One Structure | `dsaUnionFind`, `dsaAckermann` | The strongest single chapter to give away. It is self-contained, it is a complete arc from naive to near-constant, it ends on the α(n) result which is genuinely delightful, and the machine is the most fun in Part 1 |

That is **six machines** visible before the paywall, against §2's "at least two". Chapters 1
and 2 are consecutive so a visitor gets a real reading experience; Chapter 7 sits deep enough
to show that the depth continues.

**Rejected alternatives, recorded:** Chapter 8 (two pointers) is the most-searched topic and
was the obvious commercial choice, but it depends on Chapter 4's amortized argument, so giving
it away either breaks the thesis or duplicates Chapter 4. Chapter 13 (binary search) has the
same problem in reverse: it is self-contained enough that giving it away shows the least about
what makes this course different.

---

## 5. The reading map

Every paper, book and source file the course names, grouped by the part that names it. Phase 4
must consult the relevant entries before writing each chapter and record which in the file
header comment (§4 Phase 4).

**Part 1 — Foundations.** Knuth 1976 (the O/Ω/Θ notation note) · Hartmanis & Stearns 1965 ·
Tarjan 1985 (amortized complexity, the potential method) · Sleator & Tarjan 1985 (amortized
efficiency of list update and paging) · Akra & Bazzi 1998 · Blum, Floyd, Pratt, Rivest &
Tarjan 1973 · Tarjan 1975 (union–find, the α(n) bound) · Dijkstra 1976 (Dutch national flag) ·
Dijkstra 1961 (shunting-yard) · Bentley 1984 (*Programming Pearls*, maximum subarray) ·
Floyd's cycle detection via Knuth 1969 · Brent 1980 · Boyer & Moore 1981 (majority vote) ·
Bentley & Ottmann 1979 (sweep line) · CPython `listobject.c` and OpenJDK `ArrayList` growth
factors.

**Part 2 — Order and Lookup.** Hoare 1961 (quicksort, quickselect) · Williams 1964 (heapsort) ·
Floyd 1964 (build-heap) · Musser 1997 (introsort) · Peters 2002 (Timsort, the CPython listsort
note) · de Gouw et al. 2015 (the formal verification that found the TimSort bug) ·
Bentley & McIlroy 1993 (engineering a sort function) · Carter & Wegman 1979 (universal
hashing) · Pagh & Rodler 2001 (cuckoo hashing) · Bloom 1970 · the 2006 Java binary-search
overflow disclosure · CPython `listobject.c` and `dictobject.c` · OpenJDK
`DualPivotQuicksort`, `Arrays.sort`, `HashMap` · libstdc++ `std::sort` · Go `sort` (pdqsort
since 1.19).

**Part 3 — The Paradigms.** Narayana Pandita, 14th century (next permutation) ·
Bellman 1952/1957 (the principle of optimality) · MIT 6.006 (SRTBOT, attributed by name) ·
Wagner & Fischer 1974 (edit distance) · Hirschberg 1975 (linear-space LCS) · Knuth 1971
(optimal BSTs) · Yao 1980 (quadrangle inequality) · Held & Karp 1962 (TSP by subsets) ·
Huffman 1952 · Whitney 1935 and Edmonds 1971 (matroids) · Graham 1966 (list scheduling).

**Part 4 — Hierarchies and Ranges.** Adelson-Velsky & Landis 1962 (AVL) · Bayer & McCreight
1972 (B-trees) · Guibas & Sedgewick 1978 (red-black) · Seidel & Aragon 1996 (treaps) ·
Pugh 1990 (skip lists) · Morris 1979 (threaded traversal) · Fredman & Tarjan 1987 (Fibonacci
heaps) · Bender & Farach-Colton 2000 (LCA revisited) · Sleator & Tarjan 1983 (link-cut trees,
HLD's ancestor) · Fenwick 1994 · Bentley 1977 (segment trees) · **Mo's algorithm: no canonical
paper; the text states it is folklore** (Phase 1 §6) · OpenJDK `TreeMap` · Linux `lib/rbtree.c` ·
Redis skiplist (sorted sets) · SQLite B-tree.

**Part 5 — Graphs.** Euler 1736 (Königsberg, the origin of graph theory) · Hierholzer 1873 ·
Jarník 1930 · Kruskal 1956 · Prim 1957 · Ford 1956 and Bellman 1958 · Dijkstra 1959 ·
Floyd 1962 and Warshall 1962 · Kahn 1962 · Johnson 1977 · Tarjan 1972 (DFS, SCC, bridges) ·
Hopcroft & Tarjan 1973 (biconnectivity) · Sharir 1981 (Kosaraju's algorithm, published) ·
Hart, Nilsson & Raphael 1968 (A*) · Ford & Fulkerson 1956 · Dinic 1970 · Edmonds & Karp 1972 ·
Goldberg & Tarjan 1988 (push-relabel) · Hopcroft & Karp 1973 · Kuhn 1955 (Hungarian) ·
Gale & Shapley 1962 (stable marriage) · Aspvall, Plass & Tarjan 1979 (2-SAT) · Karger 1993 ·
Stoer & Wagner 1997 · Menger 1927 · König 1931 · Hall 1935.

**Part 6 — The Edges and the Engineer.** Gray 1953 · Knuth, Morris & Pratt 1977 · Boyer &
Moore 1977 · Karp & Rabin 1987 · Aho & Corasick 1975 · Manacher 1975 · Thompson 1968 (regex as
an NFA) · Weiner 1973 (suffix trees) · McCreight 1976 · Ukkonen 1995 · Manber & Myers 1990
(suffix arrays) · Kasai et al. 2001 (LCP) · Kärkkäinen & Sanders 2003 (DC3) · Blumer et al.
1985 (suffix automaton) · Duval 1983 (Lyndon) · Euclid, *Elements* VII · Eratosthenes,
c. 240 BCE · Cooley & Tukey 1965 (FFT) · Bouton 1901 (Nim) · Sprague 1935 and Grundy 1939 ·
Burnside 1897 / Frobenius · Graham 1972 (convex hull) · Andrew 1979 (monotone chain) ·
Shamos & Hoey 1975 (closest pair) · Pick 1899 · Cook 1971 · Karp 1972 (the 21 problems) ·
Vitter 1985 (reservoir sampling) · Fisher & Yates 1938 and Durstenfeld 1964 (shuffle) ·
Flajolet et al. 2007 (HyperLogLog) · Cormode & Muthukrishnan 2005 (Count-Min) · Lucene's FST ·
`grep`'s matcher.

**Part 7 — Build It.** No new primary sources; the capstone's references are the standard
libraries it is fuzzed against (CPython `list`/`dict`, OpenJDK `ArrayList`/`HashMap`/`TreeMap`/
`PriorityQueue`) and the chapters that hold the mechanisms it simplifies.

---

## 6. Coverage check — computed, not asserted

Run over the two deliverables by script: every `**Rows:**` line in this Blueprint, parsed and
diffed against the 224 rows of the Phase 2 Gap Matrix.

```
universe rows: 224
rows placed in a chapter: 224
ORPHAN LIST: EMPTY
rows referenced that are not in the universe: none
```

**The orphan list is empty.** Three orphans were found on the first run and fixed rather than
argued away:

| Row | Decision | Was missing | Now lands in |
|---|---|---|---|
| **B7** cyclic sort / index-as-hash placement | supporting | had no chapter | Chapter 8 §2, as the extreme case of the same-direction scan — it only works when the values are a permutation of the indices, and saying so is the lesson |
| **G6** LRU and LFU caches | **core** | referenced in Chapter 48's prose but absent from any `Rows:` line | Chapter 11 §8 (new section + the `dsaLruCache` machine) as the structure, and Chapter 48 §7 as the *online* problem |
| **K20** DP optimizations | supporting | had no chapter | Chapter 22 §3, with the condition each of the three speedups requires, and the convex hull trick's geometric reading forwarded to Chapter 45 §8 |

**A note on how the check was run, because the first version of it was wrong.** The initial
script matched any `[A-Z]\d+` token inside a chapter block, which also matched Charter
*outcome* identifiers — and outcome ids collide with row ids (`B5`, `A8`, `O1` are both). That
masked **B7**, which appeared "placed" only because Chapter 56 delivers outcome B7. The
corrected script parses only the `Rows:` segment. Recorded because the same collision will
mislead the Phase 6 outcome→assessment map if it is not anticipated.

**The single `out` row checks out:** R5 (concurrency) is referenced in exactly one chapter —
Chapter 2, §6 — which is where Phase 1 §5 promised its §2-mandated orientation paragraph and
forward pointer to *Operating Systems in Depth* would live.

**Machines:** 142 unique `viz` keys, all distinct, all prefixed `dsa` for site-wide uniqueness
(§10.3). Every chapter has at least one; median 2; maximum 4. By kind: 51 stepper, 29 builder,
23 comparator, 11 playground, 11 simulator, 9 tuner, 8 inspector — a distribution weighted
toward steppers because this subject is mostly mechanisms with state that changes over steps
(§7.1's first trigger).

---

## 7. Risks in this Blueprint, stated before you approve it

1. **142 machines is the real cost of this course, and it is 1.75× *LLM In Depth*'s 81.**
   That is the largest single commitment here and it is front-loaded into Phase 5. Three
   honest options: build all 142; cut to roughly 90 by dropping the second and third machine
   in non-keystone chapters (the Blueprint marks which are load-bearing by naming the
   discovery); or build the keystone machines first and ship the rest as a second pass. **My
   recommendation is the third** — every chapter keeps its first machine, so no chapter ships
   machine-less, and the extra 50 land after Phase 7. The owner should decide now, because it
   changes Phase 4's text: a chapter that says "step through it above" must have the machine.
2. **~168,000 body words** is roughly 1.4× *LLM In Depth*. The chapter count is the cause and
   it was approved at Phase 0; this is the arithmetic consequence, recorded so it is not a
   surprise at Phase 4.
3. **Chapter 4 is load-bearing for Chapters 8, 10 and 11.** If the amortized-first ordering is
   ever reversed, three chapters need rewriting, not re-ordering.
4. **Chapter 47 cannot be written until 1–46 exist.** Its content is the procedure abstracted
   from every preceding chapter, and drafting it early would produce the generic cue table the
   chapter exists to criticize. Phase 4 must write it last despite its number.
5. **Two attributions remain open.** Mo's algorithm (no canonical paper — the text will say so)
   and Kosaraju's algorithm (unpublished by Kosaraju; conventionally cited to Sharir 1981).
   Both are flagged in §5 so Phase 4 does not invent a citation.

---

## 8. Self-check against §4 Phase 3 and §11

- [x] 7 parts, each with a title and a two-sentence description in the voice of the existing `PARTS` entries. Deviation from 4–6 declared in §0.
- [x] 57 chapters numbered continuously, each with title, archetype, blurb, 4–8 sections with a line of content each, machine specs per §7.5, figures, outcomes, Topic Universe rows, prerequisite chapters, and an estimated word count.
- [x] All five §6.3 archetypes present: orientation (1), mechanism (most), engineering reality / field guide (16, 47, 49 — three, against the required two), practitioner handbook (48), build-it (50–57).
- [x] Capstone plan complete against §9's eight requirements (§3), including the confession table and three weekend-scoped graduation projects.
- [x] Three free chapters named with justification and the rejected alternatives recorded (§4); six machines visible before the paywall against §2's required two.
- [x] Reading map complete and grouped by part (§5), with two open attributions flagged rather than invented.
- [x] **Coverage check run as a script; orphan list empty** (§6). Three real orphans found and placed; the faulty first version of the check is documented so the same collision does not mislead Phase 6.
- [x] Machine keys unique across the site (`dsa` prefix), every chapter carries at least one.

**Gate:** owner approves the parts, the chapter list and numbering (**approval freezes the
numbers**), the capstone plan, the three free chapters — and makes the §7.1 decision on the
machine count.
Next: **Phase 4 — chapter production**, one chapter per response in the §10 data format,
starting with Chapter 1 and writing in syllabus order, with Chapter 47 deferred to last.
