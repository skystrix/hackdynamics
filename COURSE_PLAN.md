# Course Plan — The Database Track

Course 01, **Databases in Depth**, teaches the theory: storage engines, B-Trees, LSM,
transactions, recovery, query processing, distributed systems, consensus — ending with a
survey field guide of real databases. The next five courses each take one area that
course only *surveys* and go to absolute depth. Together they form a complete database
track: theory → the two most important engines → building one yourself → making them
fast → the analytics world.

> Note: `index.html` currently shows placeholder cards for OS / Networking / Compilers.
> Those get replaced by courses 02–06 below.

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
