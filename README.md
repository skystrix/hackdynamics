# Inside the Database Machine — An Interactive Journey

A completely static, client-side learning site on how databases work under the hood:
storage engines, B-Trees, file formats, transactions and recovery, log-structured storage,
failure detection, leader election, replication, anti-entropy, distributed transactions,
and consensus. All explanatory text is original writing.

## Running it

No build step, no server, no dependencies. Either:

- **Open [`index.html`](index.html) directly** in any modern browser (`file://` works), or
- serve the folder: `python3 -m http.server 8000` → http://localhost:8000

Works fully offline. Progress (chapters visited, quiz scores) is stored in `localStorage` —
no login, no backend.

## What's inside

| Path | Purpose |
|---|---|
| `index.html` | App shell: top bar, TOC sidebar, particle background, script loading |
| `css/style.css` | Dark neon theme, responsive layout, animations |
| `js/bookData-part1.js` | Storage-engine chapters: sections, key terms, quizzes |
| `js/bookData-part2.js` | Distributed-systems chapters |
| `js/bookData-additions1.js` | Data models, indexing beyond B-Trees, query processing, columnar analytics |
| `js/bookData-additions2.js` | Part IV: scaling, operations & security, cloud-native, the great databases, choosing |
| `js/bookData-additions3.js` | The classic CS curriculum: ER modeling & normalization theory, relational algebra & SQL |
| `js/app.js` | Hash-routed SPA: journey map, chapter renderer, progress, scroll reveals, lazy viz mounting |
| `js/viz.js` | Interactive visualizations (B-Tree splits, slotted pages, CLOCK cache, ARIES, LSM, Bloom filters…) |
| `js/viz2.js` | Interactive visualizations (Two Generals, φ-accrual, bully election, quorums, gossip, Merkle, 2PC, Raft) |
| `js/viz3.js` | Interactive visualizations (data models, inverted index, hash join, compression encodings, hash ring, DB picker) |
| `js/viz4.js` | Interactive visualizations (normalization stepper, SQL logical pipeline, precedence graph) |
| `js/quiz.js` | Quiz engine: multiple choice, fill-in-the-blank, tap-in-order; instant feedback + confetti |

## The curriculum

Four parts, 25 chapters: **Foundations & Storage Engines** (data models, ER modeling &
normalization theory, relational algebra & SQL, B-Trees, file formats, transactions &
recovery — including serializability theory and locking, B-Tree variants, log-structured
storage, indexing beyond B-Trees) · **Query Engines & Analytics** (query processing &
optimization, columnar engines) · **Distributed Systems** (failure detection, leader
election, replication & consistency, anti-entropy, distributed transactions, consensus) ·
**Databases in the Real World** (scaling patterns, operations & security, modern hardware &
cloud-native, a field guide to PostgreSQL / MySQL / SQLite / MongoDB / Cassandra / DynamoDB /
Redis / RocksDB / Spanner / CockroachDB / ClickHouse / Snowflake / DuckDB, and how to choose).

## The 27 interactive visualizations

DBMS architecture explorer · row vs column layout · B-Tree insert/split · slotted page
(insert/delete/defragment) · binary search stepper · CLOCK page cache · WAL + ARIES recovery ·
copy-on-write B-Tree · LSM memtable/flush/compaction · Bloom filter · Two Generals ·
heartbeat/φ-accrual failure detector · bully leader election · tunable R/W quorums ·
gossip dissemination · Merkle anti-entropy · two-phase commit (with failure injection) ·
Raft election + log replication · data-model morphing · inverted index builder · hash join
animation · compression encodings playground · consistent-hashing ring · workload-based
database picker · normalization stepper (1NF→3NF) · SQL logical-pipeline stepper ·
precedence-graph serializability tester.

All visualizations are hand-rolled SVG/canvas (no libraries), mounted lazily when scrolled
into view and paused off-screen for performance.
