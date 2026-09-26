# Course Plan

Three tracks: **Databases**, **AI Engineering**, and **CS Fundamentals**.
Each is self-contained; the CS Fundamentals track is the earliest entry point on the roster
and feeds the other two.

---

# The Database Track

Course 01, **Databases in Depth**, teaches the theory: storage engines, B-Trees, LSM,
transactions, recovery, query processing, distributed systems, consensus — ending with a
survey field guide of real databases. The next five courses each take one area that
course only *surveys* and go to absolute depth. Together they form a complete database
track: theory → the two most important engines → building one yourself → making them
fast → the analytics world.

> Note: the Database track's courses 02–06 are additions to the landing page, not
> replacements. The `index.html` placeholder cards for OS and Networking are claimed by the
> CS Fundamentals track (see the roster note at the end of this document).

---

## 02 · PostgreSQL Internals in Depth

The most in-demand database on earth, opened up. Where course 01 gives Postgres two
pages, this gives it a full course.

- Process model & shared memory: postmaster, backends, buffer pool
- Heap storage: pages, tuples, TOAST, fillfactor
- MVCC the Postgres way: xmin/xmax, snapshots, visibility, why VACUUM exists
- VACUUM, autovacuum, freezing, and transaction-ID wraparound
- WAL: format, checkpoints, full-page writes, crash recovery
- The planner: statistics, cost model, reading EXPLAIN like an engineer
- Index types in practice: B-Tree, GIN, GiST, BRIN, hash — when each wins
- Replication: streaming, logical, replication slots, failover
- Locking: lock modes, deadlocks, advisory locks
- Extensions & the ecosystem: how PostGIS/pgvector/TimescaleDB hook in

**Interactive viz ideas:** MVCC tuple-visibility stepper, VACUUM sweep animation,
EXPLAIN plan-tree explorer, WAL/checkpoint timeline.

## 03 · Redis Internals in Depth

The counterpoint to Postgres: single-threaded, in-memory, data-structure-first. Small
enough that a course can cover essentially *all* of it — which is the appeal.

- The event loop: why single-threaded is fast, I/O threads in Redis 6+
- Inside the data types: SDS strings, listpacks, skiplists, hash tables & incremental rehashing
- Memory: allocator, encodings, eviction policies (LRU/LFU approximation)
- Persistence: RDB snapshots via fork + copy-on-write, AOF, hybrid
- Replication and Sentinel failover
- Redis Cluster: hash slots, resharding, the myth of multi-key ops
- Streams & consumer groups; pub/sub
- Lua scripting and atomicity
- Patterns and their failure modes: caching, distributed locks (Redlock debate), rate limiting

**Interactive viz ideas:** skiplist insert animation, incremental-rehash stepper,
fork/copy-on-write memory diagram, hash-slot cluster resharding.

## 04 · Build Your Own Database

The capstone-style course: everything from courses 01–03, applied. Build a working
key-value storage engine from an empty file, in Go or Rust, one chapter per layer.
This is also the "writing high-performance database code" course — performance taught
where it's earned, not as trivia.

- A file format: pages, headers, checksums
- The buffer pool: pinning, eviction, why not just mmap (the classic debate)
- A B+Tree: search, insert, split, delete, on real pages
- Durability: write-ahead log, fsync semantics, torn-page defense
- Crash recovery: replay, idempotence
- Concurrency: latches vs locks, a simple transaction layer
- The performance chapters: cache lines & memory layout, branch prediction,
  batching, io_uring / direct I/O, measuring with flamegraphs
- An LSM alternative: memtable + SSTables + compaction, and benchmarking it against your B+Tree

**Interactive viz ideas:** hex-level page inspector, WAL-replay crash simulator,
B+Tree-vs-LSM live benchmark race.

## 05 · SQL Performance in Depth

The practitioner course. Course 01 teaches how optimizers work; this teaches how to win
against one. Highest immediate payoff for working engineers.

- Reading execution plans fluently (Postgres & MySQL)
- Indexing strategy: composite key order, covering indexes, partial & expression indexes
- Why the planner betrays you: stale stats, skew, parameter sniffing
- Join algorithms in practice: forcing the right one, join-order explosions
- Pagination done right: keyset vs OFFSET
- N+1, SELECT *, and other ORM crimes — and fixing them without leaving the ORM
- Locking & contention: hot rows, SKIP LOCKED, queue tables
- Partitioning: when it helps, when it's cargo cult
- Benchmarking honestly: pgbench, cold vs warm cache, p99 vs mean

**Interactive viz ideas:** query-plan diff viewer (before/after index), index-selection
playground, lock-contention simulator.

## 06 · Analytical Databases in Depth

The OLAP world course 01 covers in one columnar chapter: ClickHouse, DuckDB, and the
lakehouse stack — the fastest-growing corner of the field.

- Row vs column, revisited properly: late materialization, vectorized execution
- Compression as a query accelerator: RLE, dictionary, delta, bit-packing
- ClickHouse internals: MergeTree, sparse primary indexes, parts & merges
- DuckDB internals: in-process analytics, morsel-driven parallelism, out-of-core execution
- Parquet & Arrow: the file and memory formats everything now speaks
- The lakehouse: Iceberg/Delta table formats, snapshots, time travel
- Distributed query execution: shuffles, partial aggregation
- Real-time analytics: streaming ingest, materialized views
- OLTP vs OLAP vs HTAP: drawing the line in a real architecture

**Interactive viz ideas:** vectorized-vs-tuple-at-a-time execution race, compression
encoding playground, MergeTree parts/merges timeline, Parquet file dissector.

---

## Why this order

1. **02 Postgres** — biggest audience, most searched, natural "what next" after theory.
2. **03 Redis** — contrast in every design decision; small enough to cover completely.
3. **04 Build Your Own** — needs the vocabulary from 01–03; the track's signature course.
4. **05 SQL Performance** — practitioner course; pairs with 02 and can be built quickly by reusing its viz work.
5. **06 Analytics** — rounds out the track; standalone enough to slot in last.

Each course reuses the existing engine: chapters in `bookData-*.js`, visualizations in
`viz*.js`, quizzes via `quiz.js` — no new infrastructure needed.

---

# The AI Engineering Track

A second track, opened by *RAG In Depth* and re-ordered by the *LLM In Depth* Charter
(`courses/llm-in-depth/01-course-charter.md` §5). Each course is live and self-contained;
the order is the recommended one, not a prerequisite chain.

| # | Course | Status | Shell | What it owns |
|---|---|---|---|---|
| 01 | **LLM In Depth** | Live | `llm-in-depth.html` | Tokenization, attention and the block, pretraining and scaling, decoding and tool use, fine-tuning and alignment, inference cost, quantization, evaluation, security. Capstone: PocketLM in Python and C. |
| 02 | **RAG In Depth** | Live | `rag-in-depth.html` | Chunking, sparse and dense retrieval, vector indexes, hybrid search and reranking, grounded generation, agentic retrieval, GraphRAG, RAG evaluation and operations. |

The two courses split shared topics by owner (tokens, embeddings training, judge bias and
prompt injection to LLM; indexes, fusion, retrieval metrics and injection carried in
retrieved documents to RAG). The full split is the table in the LLM Charter §5.

Candidate successors, not yet planned: *AI Agents In Depth*, *LLM Inference & Serving In
Depth* (if the serving chapters outgrow LLM In Depth), *Search & Ranking In Depth*.

---

# The CS Fundamentals Track

A third track, opened by *DSA By Patterns* (Charter,
`courses/dsa-by-patterns/01-course-charter.md` §5). This is the **earliest entry point on the
whole roster**: the only course whose prerequisites are one programming language and
high-school algebra. Both other tracks quietly assume its material — *Databases in Depth*
re-derives B-trees and hashing from scratch, and *LLM In Depth* lists undergraduate data
structures and Big-O as a prerequisite — so this track feeds them both.

| # | Course | Status | Shell | What it owns |
|---|---|---|---|---|
| 01 | **DSA By Patterns** | Live (Phases 4–8 done 2026-09-25: 49 chapters, 111 figures, 492 quiz questions; all 88 machines built 2026-09-26) | `dsa-by-patterns.html` | Complexity, the word-RAM model and amortized analysis; every core data structure and algorithm from arrays to max-flow and suffix structures; the pattern-recognition procedure; lower bounds and NP-hardness as a working skill. No capstone: an interview course, it ends at Chapter 49 with the field guide. |
| 02 | **Operating Systems in Depth** | Planned | — | Processes and threads; **concurrency, synchronization, lock-free structures and parallel algorithms**; scheduling; virtual memory and paging; file systems; I/O and the syscall boundary. |
| 03 | **Computer Networks in Depth** | Planned | — | The stack from the wire up: framing, IP and routing, TCP's state machine and congestion control, TLS, HTTP/1.1 through HTTP/3, DNS. |
| 04 | **System Design in Depth** | Planned | — | The design interview taught from mechanism rather than from diagrams: load balancing, caching, partitioning, replication, queues, consistency. Rests on tracks 1 and 2 and on *Databases in Depth*. |

**Course 02 exists in this plan because course 01 needs it to.** Guide §2 allows a course to
mark a topic "out because it belongs to course X" only when course X is listed here.
*DSA By Patterns* sends concurrency — threads, locks, the parallel algorithms of CLRS 4e
chapter 26, and the interview banks' "Multi-threaded" pattern — to course 02, and still
carries the one-paragraph orientation and forward pointer that §2 requires, in its
complexity-model chapter where the one-operation-at-a-time model is first defined.

**Track boundaries with the other two tracks.** Course 01 owns B-trees, hashing and heaps as
*mechanisms*; *Databases in Depth* owns them as *storage engines* (page layout, disk access
patterns, buffer pools) and may point back rather than re-derive once course 01 is live.
Course 01 owns graph algorithms; *System Design in Depth* owns their application to real
topologies. Course 01 owns complexity and Big-O; *LLM In Depth* keeps the attention-cost
arithmetic that depends on it.

---

## Roster note on `index.html` placeholders

The placeholder cards for OS / Networking / Compilers are now claimed: OS becomes CS
Fundamentals 02, Networking becomes CS Fundamentals 03. The Compilers placeholder is
**unclaimed** and remains a candidate for a future track. The Database track's courses 02–06
replace nothing on the landing page; they are additions.
