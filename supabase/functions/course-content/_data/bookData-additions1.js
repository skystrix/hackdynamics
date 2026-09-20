/* ==========================================================================
   bookData-additions1.js — expansion chapters for Parts I & II
   Chapter 2  — Data Models: How Databases Think About Data
   Chapter 11  — Indexing Beyond B-Trees
   Chapter 12 — Query Processing and Optimization
   Chapter 13 — Columnar Engines and Analytics
   Original explanatory writing; same schema as the other bookData files.
   ========================================================================== */

/* ======================= CHAPTER 2 ======================= */
CHAPTERS.push({
  num: 2, part: 1, free: true, title: "Data Models: How Databases Think About Data",
  blurb: "Every database forces your data into a particular shape, and that choice quietly decides which questions are easy to answer and which are painful. This chapter walks through the main options, such as tables, documents, simple key-value pairs, graphs, time series, and the newer vector databases used for AI, and explains what each is good and bad at. The goal is to help you pick the right shape for the job instead of forcing everything into the one you happen to already know.",
  sections: [
    { title: "The Relational Model & SQL",
      html: "<p>The relational model's core move is radical simplicity: <em>everything is a table</em> (a relation) — an unordered set of rows, each row a tuple of typed values, with a <strong>key</strong> that identifies it. Relationships between entities aren't stored as pointers; they're expressed by <em>values</em> (a foreign key in one table matching a primary key in another) and reconstructed at query time by <strong>joins</strong>.</p>" +
      "<p>On top sits SQL, a <strong>declarative</strong> language: you state <em>what</em> you want, and the optimizer (Chapter 12) decides <em>how</em> to get it. That separation — logical model independent of physical layout — is the model's superpower: you can add indexes, repartition, or swap storage engines without rewriting queries. It's why the relational model has outlived every \"successor\" announced since the 1970s.</p>" +
      "<div class='callout'>Physical data independence is the whole game: the schema describes truth, the engine chooses machinery. Every model that abandons it trades long-term flexibility for short-term convenience — sometimes a great trade, but always a trade.</div>" },

    { title: "Schema Design & Normalization",
      html: "<p><strong>Normalization</strong> is the discipline of storing each fact exactly once. The intuition behind the classic normal forms:</p>" +
      "<ul><li><strong>1NF</strong> — values are atomic: no lists-in-a-cell, no repeating column groups.</li>" +
      "<li><strong>2NF/3NF</strong> — every non-key attribute depends on the key, the whole key, and nothing but the key. If a customer's city is stored on every order row, an address change becomes a scavenger hunt — that's the <em>update anomaly</em> normalization exists to kill.</li>" +
      "<li><strong>BCNF</strong> — the strict version: <em>every</em> determining attribute must be a key.</li></ul>" +
      "<p>That's the intuition; Chapter 3 is the full theory — ER modeling, functional dependencies, and the complete ladder of normal forms with an interactive decomposition.</p>" +
      "<p><strong>Denormalization</strong> — deliberately duplicating data to avoid joins — is the mirror discipline. It's a legitimate optimization <em>after</em> you know the read patterns, with eyes open about the update anomalies you're re-inviting (usually tamed by making duplicated data immutable or by rebuilding it from a normalized source of truth).</p>" +
      "<p>Two schema philosophies flow from this: <strong>schema-on-write</strong> (the database validates shape at insert time — relational) versus <strong>schema-on-read</strong> (store anything; interpretation happens at query time — document stores, data lakes). Schema-on-read feels faster to start and costs you later, when five years of subtly different document shapes must all be handled by every reader.</p>" },

    { title: "The NoSQL Models", viz: "datamodels", vizTitle: "One dataset, four shapes",
      html: "<p>The \"NoSQL\" wave (better read as <em>not-only-SQL</em>) wasn't one idea but several, each optimizing a different access pattern:</p>" +
      "<ul><li><strong>Key–value</strong> — the minimal contract: <code>get(k)</code>, <code>put(k, v)</code>, the value is opaque. Nothing is faster or easier to shard, and nothing answers fewer questions. (Redis, DynamoDB at its core, RocksDB.)</li>" +
      "<li><strong>Document</strong> — values become structured (JSON-like), queryable, and indexable. The unit of locality is the <em>aggregate</em>: an order with its line items nested inside is one read, no joins — brilliant until you need to query line items <em>across</em> orders. (MongoDB, Couchbase.)</li>" +
      "<li><strong>Wide-column</strong> — a two-level map: partition key → sorted rows → columns. You design tables <em>per query</em>, denormalizing aggressively; in exchange you get linear scale-out. (Cassandra, HBase, Bigtable.)</li>" +
      "<li><strong>Graph</strong> — nodes and edges as first-class citizens, where relationship traversal (\"friends of friends who bought X\") is O(edges followed), not O(join of everything). Wins precisely when relationships, not entities, are the data. (Neo4j, Neptune.)</li></ul>" +
      "<p>The honest framing: every model <em>pre-computes a bias</em>. Relational biases toward unanticipated questions; documents toward aggregate reads; wide-column toward scale; graphs toward traversal. Choose by the questions you'll ask, not the data you have.</p>" },

    { title: "Specialized Models: Time Series, Search, Vectors",
      html: "<h3>Time-Series Databases</h3>" +
      "<p>Metrics and events have a peculiar shape: append-heavy in timestamp order, queried in time ranges, aggregated (rollups), and aged out. TSDBs exploit every peculiarity: time-partitioned storage (drop a whole partition to expire data), delta-of-delta timestamp compression and value compression (Gorilla-style XOR encoding gets a metric down to ~1.4 bytes/point), and automatic downsampling. (InfluxDB, TimescaleDB, Prometheus.)</p>" +
      "<h3>Search Engines</h3>" +
      "<p>Full-text search inverts the storage question: instead of \"what does document 42 contain?\", the index answers \"which documents contain <em>this word</em>?\" — the inverted index of Chapter 11, plus relevance ranking, tokenization, and typo tolerance. Search engines (Elasticsearch/Lucene) are databases whose entire architecture serves that one query shape.</p>" +
      "<h3>Vector Databases</h3>" +
      "<p>The newest citizen: embeddings — high-dimensional vectors produced by ML models where <em>semantic similarity ≈ geometric closeness</em>. The query is \"nearest neighbors of this vector,\" which no B-Tree can answer; it needs approximate-nearest-neighbor indexes (HNSW graphs, IVF partitions — see Chapter 11). Every serious database is now growing a vector index, because retrieval-augmented AI made this query shape ubiquitous.</p>" +
      "<div class='callout'>Pattern to notice: \"specialized database\" usually means \"general storage engine + one specialized index + a query language shaped around it.\" The internals rhyme; this whole site is about the rhymes.</div>" },

    { title: "Polyglot Persistence & the Convergence Counter-Trend",
      html: "<p>Two forces pull architectures in opposite directions. <strong>Polyglot persistence</strong>: use the best-shaped store for each job — relational for orders, Redis for sessions, a search engine for discovery, a TSDB for metrics. Each component excels; the price is operational surface area, N backup strategies, and keeping the copies consistent (usually via change data capture — Chapter 21).</p>" +
      "<p>The counter-trend is <strong>convergence</strong>: general-purpose databases absorbing the specialists. PostgreSQL alone now speaks JSON (document), full-text search, geospatial (PostGIS), time-series (extensions), and vectors (pgvector). The pragmatic modern default: start converged on one boring, excellent database; extract a specialist only when a workload <em>measurably</em> outgrows it. Distributed-systems complexity (Part III) is a cost you should be dragged into, not stroll into.</p>" }
  ],
  terms: [
    { t: "relation", d: "A table: an unordered set of typed tuples, identified by keys — the relational model's only structure." },
    { t: "declarative query", d: "You specify the result, not the procedure; the optimizer picks the physical plan." },
    { t: "normalization", d: "Storing each fact once so updates can't create contradictions — the anomaly killer." },
    { t: "denormalization", d: "Deliberate duplication to avoid join cost, adopted after read patterns are known." },
    { t: "schema-on-read vs on-write", d: "Validate shape when storing (relational) or when reading (documents, lakes)." },
    { t: "aggregate (document model)", d: "The nested unit — e.g., an order with its items — that a document store reads and writes atomically." },
    { t: "wide-column model", d: "Partition key → sorted rows → columns; tables designed per query for linear scale-out." },
    { t: "embedding / vector", d: "A high-dimensional representation where semantic similarity becomes geometric distance." },
    { t: "polyglot persistence", d: "Multiple specialized stores in one architecture — power at the price of operational surface." }
  ],
  quiz: [
    { type: "mc", q: "What does 'physical data independence' buy a relational system?",
      opts: ["Faster disk writes, since the physical layout is chosen without reference to the queries above it", "Indexes, partitioning, and storage engines can change without rewriting queries", "Schema changes never require a migration to be written", "Joins become free once the physical layer is hidden"], a: 1,
      why: "Queries address the logical model; the optimizer maps them to whatever physical machinery currently exists. The logical/physical split is the model's core asset." },
    { type: "mc", q: "A customer's shipping city is copied onto all 40,000 of their order rows. What has the designer re-invited?",
      opts: ["A phantom read, since a scan may now see the city twice over in the one scan", "An update anomaly — changing the city now requires finding every copy", "A deadlock between the writers touching those rows at the same moment", "Write amplification in the write-ahead log on every copy"], a: 1,
      why: "Duplicated mutable facts drift out of sync; that's precisely what normalization prevents and denormalization risks." },
    { type: "mc", q: "Which query pattern most strongly favors a graph database over relational joins?",
      opts: ["Summing one column over a billion rows of history in one pass", "Fetching a single order by its primary key straight from the table", "Variable-depth traversals like 'friends of friends of friends'", "Storing large binary blobs alongside the rows in the same store"], a: 2,
      why: "Each hop in a graph store follows direct edge references; in SQL, every additional depth level is another self-join over big intermediate results." },
    { type: "mc", q: "Why can't a B-Tree serve a vector-similarity query?",
      opts: ["Vectors are too large to store inside a page without spilling into overflow", "Nearest-neighbor in high dimensions doesn't reduce to a one-dimensional sort order", "B-Trees can only index integer-valued keys", "Similarity queries need write access to the index"], a: 1,
      why: "B-Trees index a total order; 'closest in 1536-dimensional space' has no such order. ANN structures (HNSW, IVF) exist for exactly this." },
    { type: "order", q: "Order these models from fewest supported query shapes to most:",
      items: ["Key–value store", "Document store", "Relational database"],
      why: "Opaque values answer only get-by-key; documents add field queries within aggregates; relations support arbitrary joins over anything." }
  ]
});

/* ======================= CHAPTER 9 ======================= */
CHAPTERS.push({
  num: 11, part: 1, title: "Indexing Beyond B-Trees",
  blurb: "An index is a helper structure that lets the database find rows without scanning the whole table, and the B-Tree is only the most common one. This chapter covers the others and when to reach for them: hash indexes for exact-match lookups, indexes for full-text search, for 'what's near me' map queries, for filtering on columns that have only a few possible values, and for finding similar items in AI applications. The theme is matching the kind of index to the kind of question you're asking.",
  sections: [
    { title: "Hash Indexes & B-Tree Craft",
      html: "<h3>Hash Indexes</h3>" +
      "<p>Hash a key, land in a bucket, done: O(1) point lookups that beat any tree — and <em>zero</em> support for ranges, prefixes, or ordering, because hashing destroys order by design. On-disk hash indexes must also handle growth gracefully (extendible/linear hashing split buckets incrementally instead of rehashing the world). Rule of thumb: equality-only access at extreme rates → hash; anything else → tree.</p>" +
      "<h3>Composite, Covering, and Partial Indexes</h3>" +
      "<p>Most real-world indexing skill is B-Tree craft:</p>" +
      "<ul><li><strong>Composite indexes</strong> — index on (a, b, c) sorts by a, then b, then c: it serves predicates on a, on (a,b), on (a,b,c) — but <em>not</em> on b alone. Column order is the design decision.</li>" +
      "<li><strong>Covering indexes</strong> — if the index itself contains every column a query needs, the engine answers from the index alone (an <em>index-only scan</em>), never touching the table. Often the single biggest cheap win in query tuning.</li>" +
      "<li><strong>Partial indexes</strong> — index only the rows matching a predicate (<code>WHERE status = 'active'</code>): a tenth of the size, perfectly aimed.</li>" +
      "<li><strong>Expression indexes</strong> — index <code>lower(email)</code>, not email, when that's what queries filter on.</li></ul>" +
      "<p>And the eternal tax: every index accelerates some reads and slows <em>every</em> write, because each insert must update them all. Unused indexes are pure liability.</p>" },

    { title: "Inverted Indexes & Full-Text Search", viz: "invindex", vizTitle: "Build an inverted index, run a search",
      html: "<p>To find documents containing a word, don't scan documents — invert the mapping. An <strong>inverted index</strong> keeps, for every term, a <strong>postings list</strong> of the documents containing it (with positions, for phrase queries). A multi-word query intersects postings lists; an OR unions them. Postings are kept sorted so intersection is a merge, and compressed with delta encoding since document IDs cluster.</p>" +
      "<p>Before indexing, text passes an <strong>analysis pipeline</strong>: tokenization (split into words), lowercasing, stemming (\"running\" → \"run\"), stop-word handling. Query text must pass the <em>same</em> pipeline — most \"search doesn't find it\" bugs are analyzer mismatches.</p>" +
      "<p>Matching isn't ranking. Relevance scores like <strong>BM25</strong> weigh how often the term hits in a document against how rare it is across the corpus (a match on \"the\" says nothing; on \"idempotency,\" everything), normalized by document length. That inverted-index + ranking pair <em>is</em> Lucene, and thus Elasticsearch and most search you've ever used.</p>" },

    { title: "Spatial & Multidimensional Indexes",
      html: "<p>\"Everything within 5 km\" is a two-dimensional question, and one-dimensional B-Trees answer it badly (a lat-range scan finds a thin slab of the planet, then filters). Two families fix it:</p>" +
      "<ul><li><strong>R-Trees</strong> — a B-Tree-shaped hierarchy of <em>bounding rectangles</em>: each node covers the boxes of its children; a spatial query descends only into rectangles it intersects. Handles points, lines, polygons; the craft is in split heuristics that minimize overlap (R*-tree). PostGIS and most GIS engines live here.</li>" +
      "<li><strong>Space-filling curves</strong> — flatten 2-D into 1-D while approximately preserving locality: Z-order (interleave the bits of x and y) or Hilbert curves, plus <strong>geohashes</strong> (the string-encoded cousin, where a shared prefix ≈ nearby). The payoff: any ordinary B-Tree can now index space — nearby points share key prefixes, and a region query becomes a handful of range scans.</li></ul>" +
      "<p>The same tricks generalize to any multidimensional data — which is why they resurface in analytics engines for multi-column clustering and slicing.</p>" +
      "<div class='fig'><svg viewBox='0 0 760 260' xmlns='http://www.w3.org/2000/svg' font-family='Menlo,monospace'>" +
      "<text x='185' y='24' text-anchor='middle' fill='#2de2ff' font-size='13'>R-Tree: nested bounding boxes</text>" +
      "<rect x='60' y='40' width='260' height='185' rx='6' fill='none' stroke='#4f7cff' stroke-width='2'/>" +
      "<text x='72' y='58' fill='#4f7cff' font-size='10'>R1 (root)</text>" +
      "<rect x='80' y='70' width='120' height='90' rx='5' fill='rgba(45,226,255,.06)' stroke='#2de2ff' stroke-width='2'/>" +
      "<text x='90' y='86' fill='#2de2ff' font-size='10'>R2</text>" +
      "<circle cx='115' cy='110' r='4' fill='#c9d6ea'/><circle cx='155' cy='95' r='4' fill='#c9d6ea'/><circle cx='175' cy='135' r='4' fill='#c9d6ea'/>" +
      "<rect x='185' y='140' width='115' height='70' rx='5' fill='rgba(255,209,102,.05)' stroke='#ffd166' stroke-width='2'/>" +
      "<text x='195' y='156' fill='#ffd166' font-size='10'>R3</text>" +
      "<circle cx='230' cy='180' r='4' fill='#c9d6ea'/><circle cx='270' cy='170' r='4' fill='#c9d6ea'/><circle cx='255' cy='195' r='4' fill='#c9d6ea'/>" +
      "<circle cx='140' cy='120' r='30' fill='rgba(61,220,151,.1)' stroke='#3ddc97' stroke-width='2' stroke-dasharray='5 4'/>" +
      "<text x='140' y='247' text-anchor='middle' fill='#7d8fb0' font-size='10.5'>query circle intersects R2 only → R3's subtree never read</text>" +
      "<text x='570' y='24' text-anchor='middle' fill='#ffd166' font-size='13'>Z-order: 2-D → 1-D with locality</text>" +
      "<rect x='460' y='40' width='220' height='185' rx='6' fill='none' stroke='#1c2a45' stroke-width='2'/>" +
      "<line x1='515' y1='40' x2='515' y2='225' stroke='#1c2a45'/><line x1='570' y1='40' x2='570' y2='225' stroke='#1c2a45'/><line x1='625' y1='40' x2='625' y2='225' stroke='#1c2a45'/>" +
      "<line x1='460' y1='86' x2='680' y2='86' stroke='#1c2a45'/><line x1='460' y1='132' x2='680' y2='132' stroke='#1c2a45'/><line x1='460' y1='178' x2='680' y2='178' stroke='#1c2a45'/>" +
      "<polyline points='487,63 542,63 487,109 542,109 597,63 652,63 597,109 652,109 487,155 542,155 487,201 542,201 597,155 652,155 597,201 652,201' fill='none' stroke='#ffd166' stroke-width='2.5'/>" +
      "<circle cx='487' cy='63' r='4' fill='#ffd166'/><circle cx='652' cy='201' r='4' fill='#ffd166'/>" +
      "<text x='570' y='247' text-anchor='middle' fill='#7d8fb0' font-size='10.5'>interleave x/y bits: nearby cells stay near on the curve</text>" +
      "</svg><div class='fig-cap'>Two answers to the same problem. The R-Tree keeps geometry as geometry — a search descends only into rectangles the query touches, pruning whole subtrees. The Z-curve flattens the plane into a single zig-zag ordering so a plain B-Tree can index it: one region query becomes a few key-range scans along the curve.</div></div>" },

    { title: "Tries, Radix Trees & Bitmap Indexes",
      html: "<h3>Tries and Radix Trees</h3>" +
      "<p>A <strong>trie</strong> indexes strings by their structure: each level consumes one character, so a lookup costs O(key length) regardless of how many keys exist, and every prefix query (\"autocomplete <code>data…</code>\") is just a subtree. <strong>Radix trees</strong> compress single-child chains into one edge; the <strong>Adaptive Radix Tree (ART)</strong> — the modern in-memory favorite (HyPer, DuckDB) — additionally adapts node layouts (4/16/48/256 slots) to their actual fanout, staying cache-compact at every density.</p>" +
      "<h3>Bitmap Indexes</h3>" +
      "<p>For low-cardinality columns (status, country, boolean flags), keep one <strong>bitmap</strong> per distinct value: bit i set ⇔ row i has that value. Then <code>status='shipped' AND country='DE'</code> is a bitwise AND — thousands of rows evaluated per CPU instruction — and compressed bitmaps (roaring bitmaps) keep them tiny. A staple of analytics engines; poor for high-churn OLTP, since every update touches bitmaps.</p>" },

    { title: "Vector Indexes & Learned Indexes",
      html: "<h3>Approximate Nearest Neighbor (ANN)</h3>" +
      "<p>Exact nearest-neighbor in high dimensions degenerates to scanning everything (the curse of dimensionality), so vector indexes go <em>approximate</em>, trading a sliver of recall for orders-of-magnitude speed:</p>" +
      "<ul><li><strong>HNSW</strong> (hierarchical navigable small world) — a multi-layer graph of vectors: sparse express layers for coarse navigation, dense bottom layer for precision. Search greedily hops toward the target through each layer — think skiplist, but over geometry. Superb recall/latency; costs RAM and slow index builds.</li>" +
      "<li><strong>IVF</strong> (inverted file) — cluster vectors into cells (k-means); search only the few cells nearest the query. Often combined with <strong>product quantization</strong>, which compresses vectors ~10–50× so more of the index fits in memory.</li></ul>" +
      "<div class='fig'><svg viewBox='0 0 760 250' xmlns='http://www.w3.org/2000/svg' font-family='Menlo,monospace'>" +
      "<rect x='100' y='30' width='560' height='50' rx='8' fill='#0c1220' stroke='#1c2a45' stroke-width='1.5'/>" +
      "<text x='90' y='60' text-anchor='end' fill='#7d8fb0' font-size='10.5'>layer 2 · sparse</text>" +
      "<circle cx='160' cy='55' r='7' fill='#111a2e' stroke='#ffd166' stroke-width='2.5'/><text x='160' y='20' text-anchor='middle' fill='#ffd166' font-size='10'>entry</text>" +
      "<circle cx='420' cy='55' r='6' fill='#111a2e' stroke='#4f7cff' stroke-width='2'/>" +
      "<circle cx='610' cy='55' r='6' fill='#111a2e' stroke='#4f7cff' stroke-width='2'/>" +
      "<line x1='167' y1='55' x2='413' y2='55' stroke='#ffd166' stroke-width='2.5'/><polygon points='418,55 407,50 407,60' fill='#ffd166'/>" +
      "<line x1='426' y1='55' x2='604' y2='55' stroke='#1c2a45' stroke-width='1.5'/>" +
      "<rect x='100' y='95' width='560' height='50' rx='8' fill='#0c1220' stroke='#1c2a45' stroke-width='1.5'/>" +
      "<text x='90' y='125' text-anchor='end' fill='#7d8fb0' font-size='10.5'>layer 1</text>" +
      "<circle cx='160' cy='120' r='5' fill='#111a2e' stroke='#4f7cff' stroke-width='2'/><circle cx='300' cy='120' r='5' fill='#111a2e' stroke='#4f7cff' stroke-width='2'/><circle cx='420' cy='120' r='6' fill='#111a2e' stroke='#ffd166' stroke-width='2.5'/><circle cx='530' cy='120' r='5' fill='#111a2e' stroke='#4f7cff' stroke-width='2'/><circle cx='640' cy='120' r='5' fill='#111a2e' stroke='#4f7cff' stroke-width='2'/>" +
      "<line x1='420' y1='61' x2='420' y2='113' stroke='#ffd166' stroke-width='2.5'/><polygon points='420,118 414,107 426,107' fill='#ffd166'/>" +
      "<line x1='426' y1='120' x2='524' y2='120' stroke='#ffd166' stroke-width='2.5'/><polygon points='529,120 518,115 518,125' fill='#ffd166'/>" +
      "<rect x='100' y='160' width='560' height='60' rx='8' fill='#0c1220' stroke='#1c2a45' stroke-width='1.5'/>" +
      "<text x='90' y='195' text-anchor='end' fill='#7d8fb0' font-size='10.5'>layer 0 · all vectors</text>" +
      "<circle cx='140' cy='190' r='4' fill='#4f7cff'/><circle cx='195' cy='200' r='4' fill='#4f7cff'/><circle cx='250' cy='182' r='4' fill='#4f7cff'/><circle cx='305' cy='198' r='4' fill='#4f7cff'/><circle cx='360' cy='185' r='4' fill='#4f7cff'/><circle cx='415' cy='200' r='4' fill='#4f7cff'/><circle cx='470' cy='185' r='4' fill='#4f7cff'/><circle cx='530' cy='192' r='5' fill='#111a2e' stroke='#ffd166' stroke-width='2.5'/><circle cx='575' cy='185' r='6' fill='#3ddc97'/><circle cx='635' cy='200' r='4' fill='#4f7cff'/>" +
      "<line x1='530' y1='126' x2='530' y2='185' stroke='#ffd166' stroke-width='2.5'/><polygon points='530,187 524,176 536,176' fill='#ffd166'/>" +
      "<line x1='536' y1='190' x2='567' y2='186' stroke='#ffd166' stroke-width='2.5'/><polygon points='572,185 561,181 562,191' fill='#ffd166'/>" +
      "<text x='575' y='170' text-anchor='middle' fill='#3ddc97' font-size='10.5'>nearest neighbor ✓</text>" +
      "<text x='380' y='242' text-anchor='middle' fill='#7d8fb0' font-size='11'>greedy rule per layer: hop to whichever neighbor is closest to the query; stuck? drop down a layer</text>" +
      "</svg><div class='fig-cap'>A skiplist over geometry. Sparse top layers cross the vector space in a few long hops; each layer down refines the neighborhood until layer 0's dense graph walks to the true(ish) nearest neighbor — ~logarithmic hops instead of comparing against millions of vectors.</div></div>" +
      "<h3>Learned Indexes</h3>" +
      "<p>A provocation worth knowing: a B-Tree is just a function from key → position — so why not <em>learn</em> that function? A small model (or spline) predicting positions, plus a bounded local search around the prediction, can beat a B-Tree on size and speed for read-mostly, well-behaved key distributions. Updates and adversarial distributions remain the hard part; today the ideas leak into practice as smarter page layouts and interpolation search rather than wholesale replacements.</p>" +
      "<div class='callout'>One lens for the whole chapter: an index is a precomputed answer shape. Ranges → B-Tree. Equality → hash. Containment of words → inverted. Proximity in space → R-Tree/curves. Prefixes → trie. Predicates over crowds → bitmap. Similarity → ANN graph. Name the question, and the structure names itself.</div>" },

    { title: "Clustered Indexes: When the Table IS the Index",
      html: "<p>So far we've pictured an index as a separate structure pointing at rows that live somewhere else. But there's a second arrangement, and which one your database uses quietly shapes every indexing decision you'll make. In a <strong>heap table</strong> (Postgres, Oracle by default), rows sit wherever there was room, and every index — primary key included — is a separate structure holding pointers to physical row locations. In a <strong>clustered</strong> (index-organized) table, there is no separate pile of rows: the table itself is a B-Tree sorted by the primary key, with the full row stored right in the leaf. InnoDB (MySQL), SQL Server (by default), and SQLite's <code>WITHOUT ROWID</code> tables all work this way.</p>" +
      "<p>Each choice pays a different bill. Clustered wins primary-key lookups and PK-range scans — <code>WHERE id BETWEEN a AND b</code> reads consecutive leaf pages and is done, no second hop. But secondary indexes now have a problem: they can't point at a physical location, because rows in a B-Tree <em>move</em> when pages split. So InnoDB's secondary indexes store the <em>primary key</em> as the row pointer, which means:</p>" +
      "<ul><li>Every secondary-index lookup is really <strong>two</strong> B-Tree descents — one down the secondary index to find the PK, one down the clustered tree to find the row.</li>" +
      "<li>Your primary key is silently copied into <em>every</em> secondary index. A fat composite PK or a 36-byte UUID string multiplies across all of them; a 4-byte int stays cheap everywhere. In InnoDB, choosing a primary key is choosing the size of all your indexes.</li></ul>" +
      "<p>And a consequence worth learning before it learns you: because the clustered tree is sorted by PK, <em>where inserts land</em> is the PK's decision. An auto-increment key appends every new row to the same rightmost leaf — hot in the buffer pool, pages fill densely, life is good. A random UUIDv4 scatters every insert to a random leaf: cold pages dragged in from disk, splits everywhere, a half-empty tree. This is why time-ordered IDs (<strong>UUIDv7</strong>, ULID, Snowflake IDs) exist — random enough to generate anywhere, sequential enough to insert kindly. Heap tables shrug at all this (Postgres users pick UUIDs freely — though the same scatter shows up in the PK's own index), which is why 'what should my primary key be' has different answers in different engines.</p>" +
      "<div class='fig'><svg viewBox='0 0 760 250' xmlns='http://www.w3.org/2000/svg' font-family='Menlo,monospace'>" +
      "<text x='190' y='24' text-anchor='middle' fill='#2de2ff' font-size='12.5'>heap table (Postgres)</text>" +
      "<rect x='60' y='40' width='120' height='60' rx='7' fill='#111a2e' stroke='#2de2ff' stroke-width='2'/><text x='120' y='65' text-anchor='middle' fill='#2de2ff' font-size='10.5'>PK index</text><text x='120' y='82' text-anchor='middle' fill='#7d8fb0' font-size='9'>key → (page,slot)</text>" +
      "<rect x='200' y='40' width='120' height='60' rx='7' fill='#111a2e' stroke='#4f7cff' stroke-width='2'/><text x='260' y='65' text-anchor='middle' fill='#4f7cff' font-size='10.5'>email index</text><text x='260' y='82' text-anchor='middle' fill='#7d8fb0' font-size='9'>key → (page,slot)</text>" +
      "<rect x='60' y='150' width='260' height='60' rx='7' fill='#111a2e' stroke='#7d8fb0' stroke-width='2'/><text x='190' y='175' text-anchor='middle' fill='#c9d6ea' font-size='10.5'>heap: rows in arrival order</text><text x='190' y='192' text-anchor='middle' fill='#7d8fb0' font-size='9'>both indexes point straight at rows</text>" +
      "<line x1='120' y1='100' x2='160' y2='146' stroke='#2de2ff' stroke-width='2'/><line x1='260' y1='100' x2='230' y2='146' stroke='#4f7cff' stroke-width='2'/>" +
      "<text x='570' y='24' text-anchor='middle' fill='#ffd166' font-size='12.5'>clustered table (InnoDB)</text>" +
      "<rect x='440' y='40' width='130' height='60' rx='7' fill='#111a2e' stroke='#4f7cff' stroke-width='2'/><text x='505' y='65' text-anchor='middle' fill='#4f7cff' font-size='10.5'>email index</text><text x='505' y='82' text-anchor='middle' fill='#ffd166' font-size='9'>key → PRIMARY KEY</text>" +
      "<rect x='440' y='150' width='260' height='60' rx='7' fill='#111a2e' stroke='#ffd166' stroke-width='2.5'/><text x='570' y='175' text-anchor='middle' fill='#ffd166' font-size='10.5'>clustered B-Tree on PK</text><text x='570' y='192' text-anchor='middle' fill='#7d8fb0' font-size='9'>full rows live in the leaves — this IS the table</text>" +
      "<line x1='505' y1='100' x2='530' y2='146' stroke='#4f7cff' stroke-width='2'/><polygon points='532,150 522,143 530,138' fill='#4f7cff'/>" +
      "<text x='620' y='128' fill='#7d8fb0' font-size='9.5'>2nd descent</text>" +
      "<text x='380' y='240' text-anchor='middle' fill='#7d8fb0' font-size='10.5'>heap: every index pays one hop · clustered: PK reads are free, every secondary read pays two descents</text>" +
      "</svg><div class='fig-cap'>The same two indexes, two philosophies. In a heap, all indexes are equal citizens pointing at row addresses. In a clustered table the PK tree holds the rows themselves, so secondary indexes navigate via the primary key — cheap PK reads, double-hop secondary reads, and a PK whose size and insert order echo through everything.</div></div>" },

    { title: "The Index Menu Across Databases: A Field Guide",
      html: "<p>Every database advertises its index types like they're inventions, but you've now met the underlying structures — what differs is which ones each engine offers and what it calls them. A tour of the menus you'll actually order from:</p>" +
      "<h3>PostgreSQL: the deepest menu</h3>" +
      "<p>Beyond the default B-Tree (which supports <code>INCLUDE</code> columns for covering, partial <code>WHERE</code> clauses, and expression indexes), Postgres ships pluggable access methods: <strong>GIN</strong> — a generalized inverted index, the right answer whenever one row contains many indexable things: array elements, JSONB keys, full-text lexemes. <strong>GiST</strong> — a generalized search tree that hosts R-Tree-style geometry (PostGIS), range types, and nearest-neighbor ordering. <strong>BRIN</strong> — the minimalist masterpiece: just min/max per block range, kilobytes to 'index' a terabyte of naturally-ordered data (append-only logs, timestamps) by telling scans which block ranges to skip — a zone map wearing an index costume. <strong>pg_trgm</strong> — trigram GIN indexes that accelerate <code>LIKE '%substring%'</code> and fuzzy matching, the queries B-Trees famously can't touch: split every string into 3-character shingles and suddenly substring search is postings-list intersection. Plus <strong>pgvector</strong> adding HNSW/IVFFlat from the last section.</p>" +
      "<h3>MySQL / InnoDB: everything orbits the clustered PK</h3>" +
      "<p>The menu is shorter — B-Tree, FULLTEXT, spatial — but the craft is different because of the previous section: secondary indexes carry the PK, so keep primary keys small and sequential. Two distinctive tools: <strong>prefix indexes</strong> (<code>INDEX (url(20))</code>) index only the first N characters of long strings, and <strong>invisible indexes</strong> let you hide an index from the optimizer <em>before</em> dropping it — if nothing slows down for a week, it was truly unused. Functional indexes arrived in 8.0.</p>" +
      "<h3>SQL Server: the enterprise pair</h3>" +
      "<p>Clustered vs nonclustered is a per-table choice you make explicitly, nonclustered indexes take <code>INCLUDE</code> columns, <strong>filtered indexes</strong> are partial indexes by another name, and <strong>columnstore indexes</strong> bolt a Chapter-13 columnar engine onto a row table — the same OLTP/OLAP split, resolved inside one engine.</p>" +
      "<h3>MongoDB: indexes over flexible shapes</h3>" +
      "<p>Documents nest and hold arrays, so: <strong>multikey indexes</strong> automatically unroll arrays (one entry per element), <strong>wildcard indexes</strong> cover 'index whatever fields show up', <strong>TTL indexes</strong> delete expired documents as a side effect of indexing a date field, plus text, 2dsphere (geo), and partial/sparse variants. The composite-index craft transfers directly — Mongo's <strong>ESR rule</strong> (Equality fields first, then Sort fields, then Range fields) is exactly the column-ordering logic you learned above.</p>" +
      "<h3>Cassandra &amp; DynamoDB: the index is the table design</h3>" +
      "<p>Here the mental model flips. There's no optimizer choosing indexes at query time — the <strong>partition key</strong> decides which node holds the data and <strong>clustering columns</strong> decide sort order within it, so you design tables <em>from your queries backward</em>, often duplicating data into one table per query shape. Secondary indexes exist but are local to each node (a query without the partition key fans out to the whole cluster — usually a trap). DynamoDB formalizes the duplication: a <strong>GSI</strong> (global secondary index) is honestly a second, eventually-consistent copy of your table with a different key, billed accordingly.</p>" +
      "<h3>And the specialists</h3>" +
      "<p><strong>Elasticsearch</strong> inverts every field by default (it's Lucene all the way down) and pairs the inverted index with <strong>doc values</strong> — a columnar layout, because aggregations want columns even in a search engine; autocomplete is edge n-grams, fuzzy search is the trigram idea again. <strong>Redis</strong> offers no indexes at all: a sorted set <em>is</em> a hand-built index you maintain yourself, which is the honest version of what every database does for you. <strong>SQLite</strong> quietly supports partial and expression indexes and clustered tables (<code>WITHOUT ROWID</code>) — the whole toolkit in the world's smallest engine.</p>" +
      "<div class='callout'>The field-guide skill isn't memorizing menus — it's recognizing the same six structures under forty brand names. 'BRIN' is a zone map. 'GIN' is an inverted index. 'Multikey' is array unrolling. 'GSI' is a materialized copy. Ask 'which structure from this chapter is this, and what bill does it pay?' and no database's documentation can surprise you again.</div>" },

    { title: "Making the Optimizer Actually Use Your Index",
      html: "<p>The most common indexing frustration isn't building the wrong structure — it's building the right one and watching the database ignore it. That decision isn't spite; it's arithmetic, and once you can do the arithmetic yourself, the optimizer becomes a colleague instead of a mystery.</p>" +
      "<h3>Selectivity: the only number that matters</h3>" +
      "<p>An index lookup reads index pages, then hops to table pages for each match — and those hops are <em>random</em> I/O. A sequential scan reads everything, but sequentially, which is far cheaper per page. So there's a crossover: if a predicate matches a small fraction of rows (high <strong>selectivity</strong>), index wins; past a threshold — often just a few percent of the table — the scan honestly wins, and the optimizer picking it is correct behavior, not a bug. <code>WHERE status = 'active'</code> on a table that's 90% active should never use an index, and no amount of index-building will change that; only a partial index over the <em>inactive</em> minority, or a different question, will.</p>" +
      "<h3>The six classic ways an index gets ignored</h3>" +
      "<ul><li><strong>A function on the column.</strong> <code>WHERE lower(email) = …</code> can't use an index on <code>email</code> — the index stores raw values, not lowercase ones. Fix: an expression index on <code>lower(email)</code>, exactly as built earlier this chapter.</li>" +
      "<li><strong>A type mismatch.</strong> Comparing a string column to a number (or mismatched collations across a join) forces a cast on every row — a function on the column in disguise.</li>" +
      "<li><strong>A leading wildcard.</strong> <code>LIKE '%gmail.com'</code> has no prefix to descend the B-Tree with. Fix: trigram index, or a reversed-string expression index for suffix matches.</li>" +
      "<li><strong>Low selectivity</strong> — the arithmetic above. The index works; it just loses.</li>" +
      "<li><strong>Stale statistics.</strong> The optimizer estimates selectivity from sampled statistics; after a bulk load, its estimates can be fiction. <code>ANALYZE</code> (Postgres) / <code>ANALYZE TABLE</code> (MySQL) refreshes them — the first thing to try when a good plan went bad overnight.</li>" +
      "<li><strong>Wrong column order</strong> in a composite index — the leftmost-prefix rule from earlier, still the #1 self-inflicted miss.</li></ul>" +
      "<h3>The tuning loop</h3>" +
      "<p><code>EXPLAIN</code> shows the chosen plan; <code>EXPLAIN ANALYZE</code> runs it and shows the truth. The one habit that separates people who tune from people who guess: <strong>compare estimated rows to actual rows</strong> at each plan node. Close together → the optimizer understands your data, and the plan is as good as your indexes allow. Wildly apart → fix the statistics before touching indexes, because the optimizer is planning for a table that doesn't exist. Then check: is the index that should apply present, usable (none of the six sins), and cheap enough (would a covering index end the table hops)? One more free win hides in <code>ORDER BY … LIMIT n</code>: an index whose order matches the query's lets the engine read n rows and stop — no sort, no scan — often the difference between a paginated endpoint that flies and one that dies.</p>" +
      "<h3>Index hygiene: the write side of the ledger</h3>" +
      "<p>Every index is a standing tax: each INSERT updates all of them, each UPDATE touches every index whose columns changed (Postgres heap tables soften this with <strong>HOT updates</strong> — change only unindexed columns and indexes may not be touched at all). So audit like an accountant: the engine counts index usage for you (<code>pg_stat_user_indexes</code>, MySQL's <code>sys.schema_unused_indexes</code>) — an index with zero reads and millions of writes is pure liability, and MySQL's invisible-index trick from the field guide is the safe way to confirm before dropping. Watch for <strong>redundant prefixes</strong> — an index on (a) is almost always dead weight next to one on (a, b). Long-lived B-Trees also <strong>bloat</strong> as churn leaves half-empty pages; <code>REINDEX</code> rebuilds them compact. And when you add an index to a table serving live traffic, use the online path — <code>CREATE INDEX CONCURRENTLY</code> (Postgres) or MySQL's in-place DDL — which builds without blocking writes in exchange for taking longer. The alternative is a table lock whose duration scales with table size, discovered in production, once.</p>" +
      "<div class='callout'>The complete craft in one breath: know what fraction of the table your query touches, keep statistics honest, commit none of the six sins, read EXPLAIN's estimates against reality, make hot queries covered, and drop what nothing reads. That's 90% of professional index tuning — the structures were the other 10%.</div>" }
  ],
  terms: [
    { t: "covering index / index-only scan", d: "An index containing every column a query needs, so the table is never touched." },
    { t: "composite index", d: "Multi-column index sorted lexicographically — leftmost columns determine what it can serve." },
    { t: "partial index", d: "An index over only the rows matching a predicate — smaller, faster, precisely aimed." },
    { t: "inverted index", d: "term → postings list of containing documents; the heart of full-text search." },
    { t: "postings list", d: "Sorted, delta-compressed document IDs for one term; queries merge these lists." },
    { t: "BM25", d: "The standard relevance score: term frequency × rarity, normalized by document length." },
    { t: "R-Tree", d: "Hierarchy of bounding rectangles for spatial queries; descend only into intersecting boxes." },
    { t: "Z-order / geohash", d: "Bit-interleaving that flattens 2-D into 1-D with locality — space in a plain B-Tree." },
    { t: "adaptive radix tree", d: "A path-compressed trie with node sizes that adapt to fanout — the in-memory index of choice." },
    { t: "HNSW", d: "Layered navigable graph for approximate nearest-neighbor search over embeddings." },
    { t: "roaring bitmap", d: "Compressed bitmap format making predicate ANDs/ORs a few CPU instructions per thousands of rows." },
    { t: "clustered table", d: "The table stored as a B-Tree on the primary key, rows in the leaves — PK reads are free, secondary reads pay a second descent." },
    { t: "heap table", d: "Rows in arrival order with every index (PK included) a separate structure pointing at row locations." },
    { t: "selectivity", d: "The fraction of rows a predicate matches — the number that decides index scan vs sequential scan." },
    { t: "BRIN", d: "Postgres's block-range index: min/max per range of pages — kilobytes to skip-scan terabytes of naturally-ordered data." },
    { t: "GIN", d: "Postgres's generalized inverted index — for columns holding many things: arrays, JSONB, full-text lexemes." },
    { t: "trigram index", d: "Index of 3-character shingles making LIKE '%substring%' and fuzzy match answerable by postings intersection." },
    { t: "invisible index", d: "An index hidden from the optimizer but still maintained — the safe rehearsal before dropping it." },
    { t: "multikey index", d: "MongoDB's array-aware index: one entry per array element, automatically." },
    { t: "GSI", d: "DynamoDB's global secondary index — really a second, eventually-consistent copy of the table under a different key." },
    { t: "HOT update", d: "Postgres optimization: change only unindexed columns and the write may skip every index." }
  ],
  quiz: [
    { type: "mc", q: "An index on (tenant_id, created_at) exists. Which query CAN'T use it effectively?",
      opts: ["WHERE tenant_id = 7", "WHERE tenant_id = 7 AND created_at > '2026-01-01'", "WHERE created_at > '2026-01-01' (no tenant filter)", "ORDER BY created_at within one tenant"], a: 2,
      why: "A composite index sorts by the leftmost column first; without pinning tenant_id, matching created_at values are scattered through the whole index." },
    { type: "mc", q: "Why are hash indexes useless for range queries?",
      opts: ["The buckets are too small to hold a range of keys between two bounds", "Hashing deliberately destroys key order, scattering adjacent keys", "They can only store integer keys", "Collisions corrupt the ranges"], a: 1,
      why: "Uniform scattering is what makes O(1) lookups work — and it's exactly what makes 'all keys between a and b' unanswerable." },
    { type: "mc", q: "A two-word search query hits an inverted index. What's the core operation?",
      opts: ["Scan every document looking for both of the words", "Intersect the two terms' sorted postings lists", "Hash the two words together into one key and probe with that", "Walk the B-Tree twice and union the results"], a: 1,
      why: "Each term maps to a sorted doc-ID list; the AND is a linear merge-intersection of the two lists." },
    { type: "mc", q: "What makes HNSW search fast despite millions of vectors?",
      opts: ["It compresses every vector down to a single byte before any of the comparisons are made, which shrinks the working set", "Sparse upper layers let search greedily hop close to the target before descending into dense layers", "It sorts the vectors by their magnitude, so the search can binary-search that order to find the neighbours", "It caches the results of every query it has already answered before, so repeats cost nothing at all"], a: 1,
      why: "Like a skiplist over geometry: coarse express lanes first, precision at the bottom — logarithmic-ish hops instead of a scan." },
    { type: "blank", q: "An index that contains all columns a query needs, letting the engine skip the table entirely, enables an index-________ scan.",
      a: ["only"], why: "Index-only scans are frequently the cheapest available plan — and a covering index is how you unlock them." },
    { type: "mc", q: "An InnoDB table uses a random UUIDv4 primary key and insert throughput is poor. Why?",
      opts: ["UUIDs hash poorly, so the index buckets fill unevenly, so the index buckets fill unevenly and the longest chains dominate", "InnoDB tables are clustered on the PK, so random keys scatter every insert to a random leaf page — cold reads and page splits everywhere", "UUIDs are too long to be indexed efficiently", "MySQL cannot index string-valued columns"], a: 1,
      why: "The clustered tree's insert location is the PK's choice. Sequential keys append to one hot page; random keys turn every insert into a random-I/O page fetch. Time-ordered IDs (UUIDv7/ULID) fix it." },
    { type: "mc", q: "A 5 TB append-only log table in Postgres is queried by time range. The cheapest effective index is:",
      opts: ["A B-Tree on the timestamp column, which is what the query planner will reach for anyway for a predicate of this shape", "A hash index on the timestamp, which makes each lookup a constant-time probe", "A BRIN index — min/max per block range, a few MB total, since the data is naturally time-ordered", "A GIN index built over the whole row"], a: 2,
      why: "When physical order already matches key order, you don't need per-row pointers — just per-block-range min/max telling scans which ranges to skip. That's BRIN." },
    { type: "mc", q: "`WHERE lower(email) = 'a@b.com'` ignores your index on email. What's happening?",
      opts: ["The optimizer is broken and ignores the index it has been given for a predicate of this shape against a transformed column", "The index stores raw values — a function on the column makes it unusable; you need an expression index on lower(email)", "String columns cannot make use of an index here", "The table is too small for the index to pay"], a: 1,
      why: "The B-Tree is sorted by email, not lower(email) — the transformed value has no place to descend from. Index the expression the query actually filters on." },
    { type: "mc", q: "EXPLAIN ANALYZE shows the optimizer estimated 100 rows but 2 million came back, and it chose a terrible plan. First move?",
      opts: ["Add more indexes, so the planner has better paths to choose between on this table and in this database", "Refresh statistics (ANALYZE) — the optimizer is planning for a table that doesn't exist", "Rewrite the query with optimizer hints attached", "Increase the memory available to the planner"], a: 1,
      why: "Plans are only as good as the statistics behind the estimates. When estimated vs actual diverge wildly, fix the optimizer's picture of the data before touching anything else." },
    { type: "blank", q: "In Cassandra and DynamoDB you design tables from your queries backward, because the ________ key decides which node holds the data and what can be queried efficiently.",
      a: ["partition"], why: "No optimizer rescues a bad key choice at query time — the partition key IS the index, chosen at design time." }
  ]
});

/* ======================= CHAPTER 10 ======================= */
CHAPTERS.push({
  num: 12, part: 2, title: "Query Processing and Optimization",
  blurb: "When you send a SQL query you say what you want, not how to get it, and the database has to work out an efficient way on its own. This chapter follows a query through that process: how it's read and cleaned up, the different algorithms available for joining tables, and how the optimizer guesses which plan will be fastest using statistics about your data. Understanding this is what lets you read a query plan and figure out why a query is slow.",
  sections: [
    { title: "The Life of a Query",
      html: "<p>Every query walks the same pipeline:</p>" +
      "<ol><li><strong>Parse</strong> — text → abstract syntax tree; names resolved against the catalog, types checked, permissions verified.</li>" +
      "<li><strong>Rewrite</strong> — mechanical improvements that are always safe: expand views, fold constants, flatten subqueries into joins where possible, and <em>push predicates down</em> so filters run as close to the data as they can.</li>" +
      "<li><strong>Plan/optimize</strong> — the interesting part: choose among the many <em>physical</em> plans that compute the same logical answer.</li>" +
      "<li><strong>Execute</strong> — run the chosen operator tree against the storage engine.</li></ol>" +
      "<p>The gap between step 3's choices is not academic: the same query can run in 3 ms or 3 hours depending on join order and access paths. The optimizer is the most leverage-dense code in the database.</p>" +
      "<div class='fig'><svg viewBox='0 0 760 205' xmlns='http://www.w3.org/2000/svg' font-family='Menlo,monospace'>" +
      "<rect x='40' y='45' width='120' height='60' rx='8' fill='#111a2e' stroke='#7d8fb0' stroke-width='2'/>" +
      "<text x='100' y='71' text-anchor='middle' fill='#c9d6ea' font-size='11'>SQL text</text><text x='100' y='89' text-anchor='middle' fill='#7d8fb0' font-size='9.5'>SELECT … JOIN …</text>" +
      "<line x1='160' y1='75' x2='194' y2='75' stroke='#2de2ff' stroke-width='2'/><polygon points='200,75 188,69 188,81' fill='#2de2ff'/>" +
      "<rect x='200' y='45' width='120' height='60' rx='8' fill='#111a2e' stroke='#2de2ff' stroke-width='2'/>" +
      "<text x='260' y='66' text-anchor='middle' fill='#2de2ff' font-size='11'>parser</text><text x='260' y='83' text-anchor='middle' fill='#7d8fb0' font-size='9.5'>AST · names resolved</text><text x='260' y='96' text-anchor='middle' fill='#7d8fb0' font-size='9.5'>types · permissions</text>" +
      "<line x1='320' y1='75' x2='354' y2='75' stroke='#2de2ff' stroke-width='2'/><polygon points='360,75 348,69 348,81' fill='#2de2ff'/>" +
      "<rect x='360' y='45' width='120' height='60' rx='8' fill='#111a2e' stroke='#2de2ff' stroke-width='2'/>" +
      "<text x='420' y='66' text-anchor='middle' fill='#2de2ff' font-size='11'>rewriter</text><text x='420' y='83' text-anchor='middle' fill='#7d8fb0' font-size='9.5'>views inlined,</text><text x='420' y='96' text-anchor='middle' fill='#7d8fb0' font-size='9.5'>predicates pushed</text>" +
      "<line x1='480' y1='75' x2='514' y2='75' stroke='#2de2ff' stroke-width='2'/><polygon points='520,75 508,69 508,81' fill='#2de2ff'/>" +
      "<rect x='520' y='45' width='120' height='60' rx='8' fill='#111a2e' stroke='#ffd166' stroke-width='2.5'/>" +
      "<text x='580' y='66' text-anchor='middle' fill='#ffd166' font-size='11'>optimizer</text><text x='580' y='83' text-anchor='middle' fill='#7d8fb0' font-size='9.5'>join order · algorithms</text><text x='580' y='96' text-anchor='middle' fill='#7d8fb0' font-size='9.5'>access paths</text>" +
      "<line x1='640' y1='75' x2='674' y2='75' stroke='#2de2ff' stroke-width='2'/><polygon points='680,75 668,69 668,81' fill='#2de2ff'/>" +
      "<rect x='680' y='45' width='55' height='60' rx='8' fill='#111a2e' stroke='#3ddc97' stroke-width='2'/>" +
      "<text x='707' y='72' text-anchor='middle' fill='#3ddc97' font-size='10.5'>exec</text><text x='707' y='89' text-anchor='middle' fill='#7d8fb0' font-size='9.5'>rows</text>" +
      "<rect x='500' y='145' width='160' height='40' rx='8' fill='#0c1220' stroke='#4f7cff' stroke-width='1.5'/>" +
      "<text x='580' y='162' text-anchor='middle' fill='#4f7cff' font-size='10'>statistics catalog</text><text x='580' y='177' text-anchor='middle' fill='#7d8fb0' font-size='9.5'>histograms · row counts · NDV</text>" +
      "<line x1='580' y1='145' x2='580' y2='111' stroke='#4f7cff' stroke-width='2' stroke-dasharray='5 4'/><polygon points='580,107 574,118 586,118' fill='#4f7cff'/>" +
      "<text x='240' y='165' fill='#7d8fb0' font-size='10.5'>same answer at every stage —</text>" +
      "<text x='240' y='180' fill='#7d8fb0' font-size='10.5'>only the cost keeps dropping</text>" +
      "</svg><div class='fig-cap'>The pipeline every query walks. The first two stages are deterministic and always-safe; the optimizer (gold) is the gambler — its choices are only as good as the statistics feeding it from below, which is why stale stats are the root cause of so many legendary slow queries.</div></div>" },

    { title: "Logical vs Physical Plans",
      html: "<p>A <strong>logical plan</strong> says <em>what</em> in relational-algebra terms: scan orders, join with customers, filter, aggregate, sort. A <strong>physical plan</strong> commits to <em>how</em>: which index or scan for each table, which of several join <em>algorithms</em> for each join, sort vs hash for the aggregate.</p>" +
      "<p>One logical join has at least three physical faces (next section); one logical scan might be a sequential scan, an index scan, an index-only scan, or a bitmap scan combining several indexes. Multiply choices across a five-table query and the plan space runs to millions — the optimizer's real job is searching it without drowning.</p>" +
      "<p>Equivalence rules power the search: joins commute and associate (reorder freely), filters commute with joins when they only touch one side (push them down), projections can drop columns early. Every rule preserves the answer while changing the cost.</p>" },

    { title: "Join Algorithms", viz: "hashjoin", vizTitle: "Hash join: build, then probe",
      html: "<p>The three ways every database on earth joins two tables:</p>" +
      "<ul><li><strong>Nested-loop join</strong> — for each outer row, find matches in the inner table. Naively O(n×m); with an index on the inner join key, each outer row costs one index probe — unbeatable when the outer side is <em>small</em> (the classic OLTP \"join 3 rows to their details\").</li>" +
      "<li><strong>Hash join</strong> — <em>build</em> a hash table on the smaller input's join key, then <em>probe</em> it while streaming the larger input; each probe is O(1). The workhorse for large unsorted inputs. When the build side outgrows memory, both inputs are partitioned by hash to disk and joined partition by partition (grace hash join).</li>" +
      "<li><strong>Sort-merge join</strong> — sort both inputs on the join key (or exploit already-sorted indexes), then zipper through them in one pass. Wins when inputs arrive pre-sorted, and its output is sorted too — a gift to any ORDER BY above it.</li></ul>" +
      "<div class='callout'>Cheat sheet: tiny outer + indexed inner → nested loop. Big × big, unsorted → hash. Pre-sorted inputs or sorted output needed → merge. Watch the animation above: the build phase pays once, then probes fly.</div>" },

    { title: "Cost-Based Optimization: Betting on Statistics",
      html: "<p>To choose among plans, the optimizer assigns each a <strong>cost</strong> — a model of I/O and CPU — computed from <strong>statistics</strong> the database maintains per table and column: row counts, distinct-value counts, min/max, histograms of the value distribution, most-common values.</p>" +
      "<p>The keystone is <strong>cardinality estimation</strong>: how many rows will each operator emit? Selectivity of <code>status='active'</code> comes from histograms; multi-predicate selectivity usually <em>assumes independence</em> — and that assumption is the optimizer's Achilles' heel. City='Zürich' and country='CH' aren't independent; multiplying their selectivities under-estimates wildly, and errors <em>compound multiplicatively</em> up the plan tree. Most legendary slow queries trace back to one bad estimate flipping a join order or choosing nested-loops over hash.</p>" +
      "<p><strong>Join ordering</strong> is the combinatorial heart: n tables have (roughly) n! orders and the problem is NP-hard in general. Classic optimizers (System R lineage) use dynamic programming over subsets for small n and fall back to heuristics/genetic search beyond a dozen tables.</p>" +
      "<p>Practical craft for the reader of <code>EXPLAIN ANALYZE</code>: compare <em>estimated vs actual</em> rows at each node — a 1000× mismatch is your culprit; fresh statistics, extended (multi-column) statistics, or a rewritten predicate is usually the fix.</p>" },

    { title: "Execution Models: Volcano, Vectorized, Compiled",
      html: "<p>How does the plan actually pump rows?</p>" +
      "<ul><li><strong>Volcano / iterator model</strong> — every operator exposes <code>next()</code>; the root pulls a row, which pulls from its child, down to the scan. Beautifully composable, and dominant in OLTP engines (PostgreSQL) — but one virtual call chain <em>per row</em> is brutal on modern CPUs when rows number in billions.</li>" +
      "<li><strong>Vectorized execution</strong> — operators exchange <em>batches</em> of ~1,000+ column values instead of single rows: interpretation overhead amortizes across the batch, tight loops over arrays let the CPU prefetch and apply SIMD. The analytics standard (DuckDB, ClickHouse, and every warehouse — more in Chapter 13).</li>" +
      "<li><strong>Compiled / code-generated execution</strong> — generate machine code for <em>this specific query</em>, fusing operators into tight loops with data held in registers. Peak speed, at the price of compilation latency and heroic engineering.</li></ul>" +
      "<p>Also in the executor's bag: <strong>parallel execution</strong> (partition the scan across cores, joins learn to share), <strong>spilling</strong> (hash tables and sorts gracefully overflow to disk), and <strong>prepared statements</strong> (parse and plan once, execute many — with the subtle risk that one cached plan fits some parameter values badly).</p>" +
      "<div class='fig'><svg viewBox='0 0 760 250' xmlns='http://www.w3.org/2000/svg' font-family='Menlo,monospace'>" +
      "<text x='190' y='24' text-anchor='middle' fill='#ff5d73' font-size='13'>Volcano: one row per call</text>" +
      "<rect x='115' y='40' width='150' height='36' rx='7' fill='#111a2e' stroke='#4f7cff' stroke-width='2'/><text x='190' y='63' text-anchor='middle' fill='#c9d6ea' font-size='11'>AGGREGATE</text>" +
      "<rect x='115' y='110' width='150' height='36' rx='7' fill='#111a2e' stroke='#4f7cff' stroke-width='2'/><text x='190' y='133' text-anchor='middle' fill='#c9d6ea' font-size='11'>FILTER</text>" +
      "<rect x='115' y='180' width='150' height='36' rx='7' fill='#111a2e' stroke='#4f7cff' stroke-width='2'/><text x='190' y='203' text-anchor='middle' fill='#c9d6ea' font-size='11'>SCAN</text>" +
      "<line x1='165' y1='110' x2='165' y2='82' stroke='#ff5d73' stroke-width='1.5'/><polygon points='165,78 160,88 170,88' fill='#ff5d73'/>" +
      "<line x1='190' y1='110' x2='190' y2='82' stroke='#ff5d73' stroke-width='1.5'/><polygon points='190,78 185,88 195,88' fill='#ff5d73'/>" +
      "<line x1='215' y1='110' x2='215' y2='82' stroke='#ff5d73' stroke-width='1.5'/><polygon points='215,78 210,88 220,88' fill='#ff5d73'/>" +
      "<line x1='165' y1='180' x2='165' y2='152' stroke='#ff5d73' stroke-width='1.5'/><polygon points='165,148 160,158 170,158' fill='#ff5d73'/>" +
      "<line x1='190' y1='180' x2='190' y2='152' stroke='#ff5d73' stroke-width='1.5'/><polygon points='190,148 185,158 195,158' fill='#ff5d73'/>" +
      "<line x1='215' y1='180' x2='215' y2='152' stroke='#ff5d73' stroke-width='1.5'/><polygon points='215,148 210,158 220,158' fill='#ff5d73'/>" +
      "<text x='285' y='98' fill='#7d8fb0' font-size='10'>next() ×1,000,000,000</text>" +
      "<text x='285' y='168' fill='#7d8fb0' font-size='10'>virtual call per row —</text>" +
      "<text x='285' y='182' fill='#7d8fb0' font-size='10'>CPU pipeline starves</text>" +
      "<text x='190' y='240' text-anchor='middle' fill='#7d8fb0' font-size='10.5'>flexible, composable — OLTP's choice</text>" +
      "<text x='570' y='24' text-anchor='middle' fill='#3ddc97' font-size='13'>vectorized: one batch per call</text>" +
      "<rect x='495' y='40' width='150' height='36' rx='7' fill='#111a2e' stroke='#4f7cff' stroke-width='2'/><text x='570' y='63' text-anchor='middle' fill='#c9d6ea' font-size='11'>AGGREGATE</text>" +
      "<rect x='495' y='110' width='150' height='36' rx='7' fill='#111a2e' stroke='#4f7cff' stroke-width='2'/><text x='570' y='133' text-anchor='middle' fill='#c9d6ea' font-size='11'>FILTER (SIMD)</text>" +
      "<rect x='495' y='180' width='150' height='36' rx='7' fill='#111a2e' stroke='#4f7cff' stroke-width='2'/><text x='570' y='203' text-anchor='middle' fill='#c9d6ea' font-size='11'>SCAN (columnar)</text>" +
      "<rect x='552' y='84' width='36' height='22' rx='4' fill='rgba(61,220,151,.15)' stroke='#3ddc97' stroke-width='2'/>" +
      "<line x1='570' y1='110' x2='570' y2='108' stroke='#3ddc97'/><polygon points='570,80 564,90 576,90' fill='#3ddc97'/>" +
      "<rect x='552' y='154' width='36' height='22' rx='4' fill='rgba(61,220,151,.15)' stroke='#3ddc97' stroke-width='2'/>" +
      "<polygon points='570,150 564,160 576,160' fill='#3ddc97'/>" +
      "<text x='660' y='98' fill='#7d8fb0' font-size='10'>next() ×1,000,000</text>" +
      "<text x='660' y='168' fill='#7d8fb0' font-size='10'>1,024 values/batch:</text>" +
      "<text x='660' y='182' fill='#7d8fb0' font-size='10'>overhead ÷1,000</text>" +
      "<text x='570' y='240' text-anchor='middle' fill='#7d8fb0' font-size='10.5'>tight loops over arrays — analytics' choice</text>" +
      "</svg><div class='fig-cap'>Same operator tree, different currency. Volcano moves single rows through virtual calls — perfect for 'fetch 3 rows by key', ruinous over a billion. Vectorized execution amortizes each call across a ~1K-value column batch and lets SIMD chew the arrays; the interpretation overhead per value approaches zero.</div></div>" }
  ],
  terms: [
    { t: "predicate pushdown", d: "Moving filters as close to the data as possible so later operators see fewer rows." },
    { t: "logical vs physical plan", d: "What to compute (algebra) vs exactly how (algorithms, indexes, order)." },
    { t: "nested-loop join", d: "Probe the inner table once per outer row — king when the outer side is tiny and the inner is indexed." },
    { t: "hash join", d: "Build a hash table on the smaller input, probe with the larger — the big-data workhorse." },
    { t: "sort-merge join", d: "Sort (or exploit sortedness), then zipper both inputs in one pass; emits sorted output." },
    { t: "cardinality estimation", d: "Predicting operator output sizes from statistics — the estimate everything else leans on." },
    { t: "selectivity", d: "Fraction of rows a predicate passes; derived from histograms and common-value lists." },
    { t: "histogram (stats)", d: "Bucketed value distribution per column, powering selectivity estimates." },
    { t: "Volcano model", d: "Pull-based next()-per-row execution — composable, row-at-a-time, virtual-call heavy." },
    { t: "vectorized execution", d: "Operators process column batches, amortizing overhead and unlocking SIMD." },
    { t: "EXPLAIN ANALYZE", d: "Run the plan and report estimated vs actual rows per node — the tuner's primary instrument." }
  ],
  quiz: [
    { type: "mc", q: "A query joins a 12-row result against a 100M-row table with an index on the join key. Best join?",
      opts: ["Hash join, building on the big table", "Sort-merge join", "Nested-loop join probing the index 12 times", "Cross join with a filter"], a: 2,
      why: "Twelve index probes cost almost nothing; hashing or sorting 100M rows to serve 12 lookups is pure waste. Small outer + indexed inner = nested loop." },
    { type: "mc", q: "The optimizer estimated 40 rows; the operator actually produced 2.1 million, and everything above it chose badly. What most likely went wrong?",
      opts: ["The write-ahead log filled up and stalled the operator part way through and stalled the operator part way through its scan", "Correlated predicates were multiplied as if independent (or stats were stale)", "The buffer pool was cold, so the operator read from disk throughout and paid a fault on every page", "The query went through a view rather than the base table"], a: 1,
      why: "Cardinality misestimates — the independence assumption and stale statistics chief among causes — compound up the tree and flip join orders and algorithms." },
    { type: "mc", q: "In a hash join, which input should build the hash table?",
      opts: ["The larger one, for better coverage of the join key space on both sides", "The smaller one, so the table fits in memory and probes stay O(1)", "Whichever of the two inputs arrives at the operator first at run time", "The one that already has an index on the join column already built"], a: 1,
      why: "Build cost and memory scale with the build side; you build on the smaller input and stream the giant through as probes." },
    { type: "mc", q: "Why does vectorized execution crush row-at-a-time Volcano on analytical scans?",
      opts: ["It skips the WHERE clause on most of the batches it reads it reads through", "Batch processing amortizes per-row call overhead and enables SIMD over contiguous arrays", "It uses more disk, which the scan can stream from", "It avoids re-parsing the plan for each row"], a: 1,
      why: "A virtual next() per row starves modern CPUs; tight loops over 1,000-value batches keep pipelines and vector units fed." },
    { type: "order", q: "Order the stages a SQL string passes through:",
      items: ["Parse into an AST and resolve names", "Rewrite (views expanded, predicates pushed down)", "Cost-based plan selection", "Execution against the storage engine"],
      why: "Text → tree → better tree → chosen physical plan → rows." }
  ]
});

/* ======================= CHAPTER 11 ======================= */
CHAPTERS.push({
  num: 13, part: 2, title: "Columnar Engines and Analytics",
  blurb: "Databases built for analytics and reporting are built very differently from the ones that handle everyday transactions, and this chapter explains why. The key idea is storing data column by column instead of row by row, which makes big 'add this up over millions of rows' queries dramatically faster and compresses extremely well. From there we build up to data warehouses, the modern cloud approach of separating storage from computing power, and the 'lakehouse' that tries to get the best of both worlds.",
  sections: [
    { title: "Why OLTP Engines Choke on Analytics",
      html: "<p>Chapter 1 introduced row vs column layout; here's the full consequence. An analytical query — <code>SELECT region, SUM(revenue) FROM sales WHERE year = 2025 GROUP BY region</code> over 10 billion rows — touches 3 columns of maybe 40. A row engine drags every byte of every row through the buffer pool for a 7% payload; its B-Trees, tuned for point lookups and updates, add nothing. Analytics wants the opposite trade everywhere: scan throughput over point latency, compression over update-in-place, batch over row.</p>" +
      "<p>Hence two ecosystems: <strong>OLTP</strong> (many tiny transactions, current state, milliseconds) and <strong>OLAP</strong> (few giant reads, history, seconds are fine — over trillions of rows). The dividing line runs exactly through the storage layout.</p>" },

    { title: "Columnar Compression: Storage That Computes", viz: "encodings", vizTitle: "Compression encodings playground",
      html: "<p>Columns compress absurdly well because same-typed, often-similar values sit adjacent. The standard encodings:</p>" +
      "<ul><li><strong>Run-length encoding (RLE)</strong> — <code>AAAABBB</code> → <code>A×4, B×3</code>. Devastating on sorted or low-cardinality columns.</li>" +
      "<li><strong>Dictionary encoding</strong> — replace each distinct string with a small integer ID; store the dictionary once. Country names become bytes.</li>" +
      "<li><strong>Delta / frame-of-reference</strong> — store differences from the previous value (or from a block minimum): timestamps and IDs shrink to bit-packed slivers.</li>" +
      "<li><strong>Bit-packing</strong> — a column whose values fit in 5 bits uses 5 bits, not 32.</li></ul>" +
      "<p>The deep point: these encodings aren't just smaller — they're <em>faster to compute on</em>. A filter can compare dictionary IDs without decompressing strings; an aggregate can multiply a run-length instead of iterating a run; SIMD chews bit-packed arrays whole. In columnar engines, compression <em>is</em> the execution strategy. Add per-block <strong>zone maps</strong> (min/max per chunk) and entire blocks are skipped without being read at all.</p>" },

    { title: "Warehouse Architecture & Modeling",
      html: "<p>A <strong>data warehouse</strong> is the analytical database fed from operational systems (by ETL/ELT pipelines or CDC — Chapter 21). Inside, data is classically modeled as a <strong>star schema</strong>: a huge <em>fact table</em> of events (sales, clicks) with foreign keys into small <em>dimension tables</em> (customer, product, date). Facts are append-mostly and columnar-compressed; dimensions are small enough to broadcast-join everywhere. Denormalization is respectable here — dimensions change slowly and reads outnumber writes a million to one.</p>" +
      "<div class='fig'><svg viewBox='0 0 760 260' xmlns='http://www.w3.org/2000/svg' font-family='Menlo,monospace'>" +
      "<rect x='290' y='85' width='180' height='95' rx='9' fill='#111a2e' stroke='#ffd166' stroke-width='2.5'/>" +
      "<text x='380' y='106' text-anchor='middle' fill='#ffd166' font-size='12'>fact_sales</text>" +
      "<text x='380' y='124' text-anchor='middle' fill='#7d8fb0' font-size='9.5'>date_id · cust_id · prod_id</text>" +
      "<text x='380' y='139' text-anchor='middle' fill='#7d8fb0' font-size='9.5'>store_id · revenue · qty</text>" +
      "<text x='380' y='160' text-anchor='middle' fill='#2de2ff' font-size='9.5'>10 billion rows, columnar,</text>" +
      "<text x='380' y='173' text-anchor='middle' fill='#2de2ff' font-size='9.5'>append-only</text>" +
      "<rect x='60' y='30' width='150' height='50' rx='8' fill='#111a2e' stroke='#4f7cff' stroke-width='2'/>" +
      "<text x='135' y='51' text-anchor='middle' fill='#c9d6ea' font-size='11'>dim_date</text><text x='135' y='68' text-anchor='middle' fill='#7d8fb0' font-size='9.5'>day · month · quarter</text>" +
      "<rect x='550' y='30' width='150' height='50' rx='8' fill='#111a2e' stroke='#4f7cff' stroke-width='2'/>" +
      "<text x='625' y='51' text-anchor='middle' fill='#c9d6ea' font-size='11'>dim_customer</text><text x='625' y='68' text-anchor='middle' fill='#7d8fb0' font-size='9.5'>name · segment · region</text>" +
      "<rect x='60' y='185' width='150' height='50' rx='8' fill='#111a2e' stroke='#4f7cff' stroke-width='2'/>" +
      "<text x='135' y='206' text-anchor='middle' fill='#c9d6ea' font-size='11'>dim_product</text><text x='135' y='223' text-anchor='middle' fill='#7d8fb0' font-size='9.5'>sku · category · brand</text>" +
      "<rect x='550' y='185' width='150' height='50' rx='8' fill='#111a2e' stroke='#4f7cff' stroke-width='2'/>" +
      "<text x='625' y='206' text-anchor='middle' fill='#c9d6ea' font-size='11'>dim_store</text><text x='625' y='223' text-anchor='middle' fill='#7d8fb0' font-size='9.5'>city · country · format</text>" +
      "<line x1='210' y1='68' x2='292' y2='100' stroke='#1c2a45' stroke-width='2'/>" +
      "<line x1='550' y1='68' x2='468' y2='100' stroke='#1c2a45' stroke-width='2'/>" +
      "<line x1='210' y1='197' x2='292' y2='165' stroke='#1c2a45' stroke-width='2'/>" +
      "<line x1='550' y1='197' x2='468' y2='165' stroke='#1c2a45' stroke-width='2'/>" +
      "<text x='380' y='222' text-anchor='middle' fill='#7d8fb0' font-size='10.5'>dimensions: small, descriptive, broadcast to every node</text>" +
      "<text x='380' y='250' text-anchor='middle' fill='#7d8fb0' font-size='10.5'>query shape: filter dims → join to fact → aggregate fact columns</text>" +
      "</svg><div class='fig-cap'>The star, drawn: one enormous fact table of events ringed by small dimension tables of context. 'Revenue by region by quarter' filters two tiny dims and aggregates one fact column — the entire warehouse world (and its columnar engines) is tuned for exactly this shape.</div></div>" +
      "<p><strong>Materialized views</strong> precompute expensive aggregations and joins, trading staleness and refresh cost for query speed — the analytical analogue of an index. Modern engines increasingly maintain them incrementally as base data changes.</p>" +
      "<p>The cloud warehouses (Snowflake, BigQuery, Redshift) added the architectural twist that defines the era: <strong>separation of storage and compute</strong> — data lives on object storage (S3-class), and stateless compute clusters spin up, scale, and vanish independently. Ten teams can query the same bytes with isolated compute; you pay for scans, not idle servers. (The systemic consequences continue in Chapter 23.)</p>" },

    { title: "Lakes, Open Formats & the Lakehouse",
      html: "<p>Parallel to warehouses grew the <strong>data lake</strong>: dump everything as files on object storage, decide schema later. Anarchy, until open <strong>columnar file formats</strong> standardized the bytes: <strong>Parquet</strong> (and ORC) store row-groups of column chunks with embedded statistics, dictionary encoding, and zone maps — a portable columnar engine's disk format that every tool can read.</p>" +
      "<p>Files alone lack transactions — two writers can corrupt a dataset, readers see half-written data. <strong>Table formats</strong> (Apache Iceberg, Delta Lake, Hudi) layer ACID onto the lake: a versioned metadata log lists exactly which files constitute the table at each snapshot, giving atomic commits, schema evolution, time travel, and concurrent writers — classic database internals (a commit log! MVCC snapshots!) reborn over object storage. The result is the <strong>lakehouse</strong>: warehouse semantics on lake economics, with no single engine owning the data.</p>" +
      "<div class='fig'><svg viewBox='0 0 760 250' xmlns='http://www.w3.org/2000/svg' font-family='Menlo,monospace'>" +
      "<rect x='110' y='195' width='540' height='42' rx='8' fill='#111a2e' stroke='#7d8fb0' stroke-width='2'/>" +
      "<text x='380' y='214' text-anchor='middle' fill='#c9d6ea' font-size='11.5'>object storage (S3-class)</text>" +
      "<text x='380' y='229' text-anchor='middle' fill='#7d8fb0' font-size='9.5'>cheap · durable · no transactions of its own</text>" +
      "<rect x='140' y='138' width='100' height='40' rx='6' fill='#111a2e' stroke='#4f7cff' stroke-width='2'/><text x='190' y='156' text-anchor='middle' fill='#4f7cff' font-size='9.5'>parquet</text><text x='190' y='170' text-anchor='middle' fill='#7d8fb0' font-size='9'>file-001</text>" +
      "<rect x='255' y='138' width='100' height='40' rx='6' fill='#111a2e' stroke='#4f7cff' stroke-width='2'/><text x='305' y='156' text-anchor='middle' fill='#4f7cff' font-size='9.5'>parquet</text><text x='305' y='170' text-anchor='middle' fill='#7d8fb0' font-size='9'>file-002</text>" +
      "<rect x='370' y='138' width='100' height='40' rx='6' fill='#111a2e' stroke='#4f7cff' stroke-width='2'/><text x='420' y='156' text-anchor='middle' fill='#4f7cff' font-size='9.5'>parquet</text><text x='420' y='170' text-anchor='middle' fill='#7d8fb0' font-size='9'>file-003</text>" +
      "<rect x='485' y='138' width='100' height='40' rx='6' fill='#111a2e' stroke='#1c2a45' stroke-width='2' stroke-dasharray='5 4'/><text x='535' y='156' text-anchor='middle' fill='#7d8fb0' font-size='9.5'>file-004</text><text x='535' y='170' text-anchor='middle' fill='#7d8fb0' font-size='9'>(orphaned)</text>" +
      "<rect x='190' y='78' width='380' height='44' rx='8' fill='#0c1220' stroke='#ffd166' stroke-width='2.5'/>" +
      "<text x='380' y='96' text-anchor='middle' fill='#ffd166' font-size='11'>table format metadata log (Iceberg / Delta)</text>" +
      "<text x='380' y='112' text-anchor='middle' fill='#7d8fb0' font-size='9.5'>snapshot v3 = {file-001, file-002, file-003} · v2 = {001, 002} · v1 = {001}</text>" +
      "<line x1='250' y1='122' x2='205' y2='134' stroke='#ffd166' stroke-width='1.5'/><line x1='340' y1='122' x2='315' y2='134' stroke='#ffd166' stroke-width='1.5'/><line x1='440' y1='122' x2='425' y2='134' stroke='#ffd166' stroke-width='1.5'/>" +
      "<rect x='120' y='20' width='120' height='36' rx='7' fill='#111a2e' stroke='#3ddc97' stroke-width='2'/><text x='180' y='43' text-anchor='middle' fill='#3ddc97' font-size='10.5'>Spark</text>" +
      "<rect x='260' y='20' width='120' height='36' rx='7' fill='#111a2e' stroke='#3ddc97' stroke-width='2'/><text x='320' y='43' text-anchor='middle' fill='#3ddc97' font-size='10.5'>Trino</text>" +
      "<rect x='400' y='20' width='120' height='36' rx='7' fill='#111a2e' stroke='#3ddc97' stroke-width='2'/><text x='460' y='43' text-anchor='middle' fill='#3ddc97' font-size='10.5'>DuckDB</text>" +
      "<rect x='540' y='20' width='120' height='36' rx='7' fill='#111a2e' stroke='#3ddc97' stroke-width='2'/><text x='600' y='43' text-anchor='middle' fill='#3ddc97' font-size='10.5'>Flink</text>" +
      "<line x1='240' y1='56' x2='300' y2='74' stroke='#1c2a45' stroke-width='1.5'/><line x1='340' y1='56' x2='360' y2='74' stroke='#1c2a45' stroke-width='1.5'/><line x1='440' y1='56' x2='420' y2='74' stroke='#1c2a45' stroke-width='1.5'/><line x1='560' y1='56' x2='480' y2='74' stroke='#1c2a45' stroke-width='1.5'/>" +
      "</svg><div class='fig-cap'>The lakehouse stack, bottom-up: dumb-cheap object storage, self-describing columnar files, and — the database part — a versioned metadata log declaring exactly which files ARE the table at each snapshot. A commit = writing new files, then atomically publishing a new snapshot; the dashed orphan is a failed write no reader will ever see. Any engine that speaks the format gets ACID over the same bytes.</div></div>" +
      "<h3>Real-Time Analytics</h3>" +
      "<p>A last branch: engines like ClickHouse, Druid, and Pinot serve <em>sub-second</em> aggregations over data that's seconds old — LSM-style ingestion (Chapter 10's machinery!) meeting columnar storage, pre-aggregation, and aggressive skipping indexes. The warehouse asks \"what happened last quarter\"; these ask \"what's happening right now.\"</p>" +
      "<div class='callout'>Follow the lineage: memtables and compaction from Part I, column layouts from Chapter 1, vectorized execution from Chapter 12 — the analytics stack is the same internals reassembled around scans instead of transactions.</div>" }
  ],
  terms: [
    { t: "OLAP", d: "Analytical workloads: few, huge, read-mostly queries over history — the opposite trade from OLTP." },
    { t: "run-length encoding", d: "Store value×count for repeated runs — devastating on sorted, low-cardinality columns." },
    { t: "dictionary encoding", d: "Replace distinct values with small integer IDs; compare IDs without decompressing." },
    { t: "zone map", d: "Per-block min/max stats letting scans skip entire blocks unread." },
    { t: "star schema", d: "A giant fact table of events joined to small dimension tables — the warehouse's classic shape." },
    { t: "materialized view", d: "A precomputed, stored query result — the analytical analogue of an index, refreshed as data changes." },
    { t: "separation of storage & compute", d: "Data on object storage, stateless elastic compute — the cloud-warehouse architecture." },
    { t: "Parquet", d: "The open columnar file format: row-groups of compressed column chunks with embedded statistics." },
    { t: "table format (Iceberg/Delta)", d: "A versioned metadata log adding ACID, snapshots, and schema evolution to files on a lake." },
    { t: "lakehouse", d: "Warehouse semantics (transactions, governance) on data-lake storage and open formats." }
  ],
  quiz: [
    { type: "mc", q: "A sorted 'country' column holds 10B values from 195 distinct countries. Which encoding pair crushes it?",
      opts: ["Gzip on the raw strings", "Dictionary encoding + run-length encoding", "Delta encoding + bit-packing", "No encoding — strings can't compress"], a: 1,
      why: "Dictionary turns strings into small ints; sorting creates massive runs for RLE. Together: billions of values in megabytes — and filters run on IDs and run-lengths directly." },
    { type: "mc", q: "How does a zone map accelerate `WHERE year = 2025`?",
      opts: ["It sorts the data by year at query time, so the scan can stop early and skip the rest of it", "Blocks whose min/max year range excludes 2025 are skipped without being read", "It caches the previous year's results for reuse", "It indexes every row of the table"], a: 1,
      why: "Per-block min/max statistics let the scan prove absence cheaply — I/O avoided is the fastest I/O." },
    { type: "mc", q: "What database problem do table formats like Iceberg solve for data lakes?",
      opts: ["Faster networking between the query engine and the object store holding the files", "Atomic commits, consistent snapshots, and schema evolution over plain files", "Cheaper object storage for the same volume of data kept in the lake once the format is adopted", "Standardisation of the SQL syntax across engines"], a: 1,
      why: "A versioned metadata log — a commit log with MVCC-style snapshots — brings transactional semantics to a pile of Parquet files." },
    { type: "mc", q: "Why does separating storage from compute change warehouse economics?",
      opts: ["Object storage is faster than local disk once the data is large enough to matter, so the same query finishes sooner against it", "Compute scales (and bills) independently of data size, and multiple isolated clusters share one copy of the data", "It removes the need to write any SQL against the warehouse at all, since the compute layer exposes its own interface", "Compression stops being necessary once storage is billed separately, because the object store charges by the byte anyway"], a: 1,
      why: "Idle compute costs nothing while data persists cheaply; ten teams get isolated clusters over the same bytes instead of one contended machine sized for peak." },
    { type: "blank", q: "The classic warehouse layout — a central fact table ringed by dimension tables — is called a ________ schema.",
      a: ["star"], why: "Facts hold the events; dimensions hold the descriptive context; the ER diagram draws itself as a star." }
  ]
});
