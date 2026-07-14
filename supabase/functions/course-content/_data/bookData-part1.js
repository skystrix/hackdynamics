/* ==========================================================================
   bookData-part1.js — Part I storage-engine chapters (1, 5–10)
   Original explanatory writing on database storage-engine fundamentals.
   Structure: window.PARTS + window.CHAPTERS.
   ========================================================================== */

window.PARTS = [
  { num: 1, title: "Foundations & Storage Engines",
    desc: "Descend into a single node: how data is modeled, how bytes are laid out on disk, how B-Trees, LSM-Trees, and every other index organize them, and how a database survives a crash mid-write." },
  { num: 2, title: "Query Engines & Analytics",
    desc: "Above the storage engine: how a declarative query becomes an efficient physical plan, and why analytical engines look nothing like transactional ones." },
  { num: 3, title: "Distributed Systems",
    desc: "Zoom out to many nodes: unreliable networks, failure detection, replication, and the algorithms that let independent machines agree on anything at all." },
  { num: 4, title: "Databases in the Real World",
    desc: "The operator's and architect's view: scaling patterns, reliability and security, cloud-native architectures, a field guide to the world's great databases — and how to choose one." }
];

window.CHAPTERS = [];

/* ======================= CHAPTER 1 ======================= */
CHAPTERS.push({
  num: 1, part: 1, title: "Introduction and Overview",
  blurb: "Start here. We'll look at what a database really is on the inside: not the SQL you type, but the layers your query passes through to get answered, from the part that talks to your app all the way down to the part that reads and writes the disk. Then you'll meet three simple questions to ask about any database, such as whether it keeps data sorted, that turn out to explain how almost every storage engine works.",
  sections: [
    { title: "DBMS Architecture", viz: "dbmsArch", vizTitle: "Anatomy of a DBMS",
      html: "<p>There is no single blueprint every database follows, but most fit a recognizable layered shape. A query enters through the <strong>transport</strong> layer, which manages client connections and, in distributed databases, node-to-node communication. It then hits the <strong>query processor</strong>: a <em>parser</em> validates syntax, resolves names, and checks permissions, and an <em>optimizer</em> rewrites the query and chooses the cheapest execution plan using internal statistics about the data.</p>" +
      "<p>The plan — a tree of operators — is carried out by the <strong>execution engine</strong>, which dispatches local operations down to the <strong>storage engine</strong>. The storage engine is where this whole journey lives. Its classic components:</p>" +
      "<ul><li><strong>Transaction manager</strong> — schedules transactions so the database can never end up in a logically inconsistent state.</li>" +
      "<li><strong>Lock manager</strong> — guards shared structures against conflicting concurrent modification.</li>" +
      "<li><strong>Access methods</strong> — the on-disk data structures themselves: heap files, B-Trees, LSM-Trees.</li>" +
      "<li><strong>Buffer manager</strong> — caches data pages in memory so we don't pay a disk read for every access.</li>" +
      "<li><strong>Recovery manager</strong> — maintains the operation log and restores a consistent state after a crash.</li></ul>" +
      "<div class='callout'>Storage engines are separable, pluggable components — MySQL can swap InnoDB for MyISAM or RocksDB; MongoDB moved to WiredTiger. That separation is why we can study storage engines as a subject of their own.</div>" },

    { title: "Memory- Versus Disk-Based DBMS",
      html: "<p>A first fork in the road: where does the <em>primary</em> copy of the data live? <strong>Disk-based</strong> databases keep most data on persistent storage and use RAM as a cache. <strong>In-memory</strong> databases treat RAM as the home of the data and use disk only for durability and backups.</p>" +
      "<p>The difference is much bigger than \"RAM is faster.\" Programming for main memory is simply <em>easier</em>: you can use pointers, allocate variable-size objects freely, and use data structures (like plain balanced trees) that would be clumsy on disk. Disk-based structures must think in fixed-size blocks, manage their own free space, and obsess over minimizing the number of block accesses.</p>" +
      "<div class='fig'><svg viewBox='0 0 760 235' xmlns='http://www.w3.org/2000/svg' font-family='Menlo,monospace'>" +
      "<text x='190' y='24' text-anchor='middle' fill='#2de2ff' font-size='13'>disk-based DBMS</text>" +
      "<rect x='90' y='40' width='200' height='52' rx='8' fill='#111a2e' stroke='#4f7cff' stroke-width='2'/>" +
      "<text x='190' y='62' text-anchor='middle' fill='#c9d6ea' font-size='12'>RAM: page cache</text><text x='190' y='79' text-anchor='middle' fill='#7d8fb0' font-size='11'>hot subset, disposable</text>" +
      "<line x1='170' y1='92' x2='170' y2='130' stroke='#4f7cff' stroke-width='2'/><polygon points='170,136 164,124 176,124' fill='#4f7cff'/>" +
      "<line x1='210' y1='136' x2='210' y2='98' stroke='#4f7cff' stroke-width='2'/><polygon points='210,92 204,104 216,104' fill='#4f7cff'/>" +
      "<text x='232' y='118' fill='#7d8fb0' font-size='10.5'>fetch / flush pages</text>" +
      "<rect x='90' y='140' width='200' height='58' rx='8' fill='#111a2e' stroke='#ffd166' stroke-width='2.5'/>" +
      "<text x='190' y='163' text-anchor='middle' fill='#ffd166' font-size='12'>DISK: primary copy</text><text x='190' y='181' text-anchor='middle' fill='#7d8fb0' font-size='11'>B-Trees, heap files — read-optimized</text>" +
      "<text x='570' y='24' text-anchor='middle' fill='#2de2ff' font-size='13'>in-memory DBMS</text>" +
      "<rect x='470' y='40' width='200' height='58' rx='8' fill='#111a2e' stroke='#ffd166' stroke-width='2.5'/>" +
      "<text x='570' y='63' text-anchor='middle' fill='#ffd166' font-size='12'>RAM: primary copy</text><text x='570' y='81' text-anchor='middle' fill='#7d8fb0' font-size='11'>pointer-rich structures, no page discipline</text>" +
      "<line x1='570' y1='98' x2='570' y2='134' stroke='#3ddc97' stroke-width='2'/><polygon points='570,140 564,128 576,128' fill='#3ddc97'/>" +
      "<text x='584' y='120' fill='#7d8fb0' font-size='10.5'>append-only, never read in steady state</text>" +
      "<rect x='470' y='144' width='200' height='54' rx='8' fill='#111a2e' stroke='#4f7cff' stroke-width='2'/>" +
      "<text x='570' y='166' text-anchor='middle' fill='#c9d6ea' font-size='12'>DISK: log + snapshots</text><text x='570' y='183' text-anchor='middle' fill='#7d8fb0' font-size='11'>exists purely for recovery</text>" +
      "<text x='190' y='222' text-anchor='middle' fill='#7d8fb0' font-size='11.5'>RAM serves the disk</text>" +
      "<text x='570' y='222' text-anchor='middle' fill='#7d8fb0' font-size='11.5'>disk serves the RAM</text>" +
      "</svg><div class='fig-cap'>The gold box marks where the primary copy lives — everything else is derived. Note the arrows: the disk-based system moves pages both ways on the hot path; the in-memory system's disk traffic is one-directional sequential appends that are only ever read again after a crash.</div></div>" +
      "<h3>Durability in Memory-Based Stores</h3>" +
      "<p>RAM contents vanish on power loss, so a serious in-memory store still writes to disk: every operation is appended to a sequential <strong>log</strong> before being acknowledged. To avoid replaying an ever-growing log at restart, the store periodically writes a <strong>snapshot/checkpoint</strong> of its state, so only the log tail after the snapshot must be replayed. Note the asymmetry: the disk structures exist purely for recovery, so they can be optimized for sequential writes without ever being read on the hot path.</p>" +
      "<div class='callout'>Falling RAM prices haven't erased disk-based systems — data volumes grow too, and RAM is still volatile and comparatively expensive per gigabyte. Emerging non-volatile memory may reshuffle this trade-off.</div>" },

    { title: "Column- Versus Row-Oriented DBMS", viz: "rowcol", vizTitle: "Row vs Column Storage Layout",
      html: "<p>Tables are two-dimensional; disks are one-dimensional. Something has to flatten rows and columns into a single byte sequence, and the choice defines two families of databases.</p>" +
      "<p><strong>Row-oriented</strong> storage keeps all fields of one record together — great for OLTP workloads that read or write whole records identified by a key (a user profile, an order). One seek fetches everything about the entity.</p>" +
      "<p><strong>Column-oriented</strong> storage keeps all values of one column together. Analytical queries that aggregate a few columns over millions of rows (<code>AVG(price)</code> across years of trades) touch only the columns they need, read them as long contiguous runs, and compress them extremely well, since same-type values with small deltas sit side by side. Values are matched back into rows implicitly by position (or explicitly by row IDs, sometimes called virtual IDs).</p>" +
      "<p>See it in bytes. Three stock quotes stored row-wise read as <code>1:GOOG,2025-07-01,182.5; 2:GOOG,2025-07-02,184.2; 3:GOOG,2025-07-03,183.1</code> — entity by entity. Column-wise the same data becomes three streams: <code>GOOG,GOOG,GOOG</code> | <code>2025-07-01,2025-07-02,2025-07-03</code> | <code>182.5,184.2,183.1</code>. Averaging prices now touches only the third stream — and look what each stream invites: a repeated symbol collapses to almost nothing, consecutive dates differ by 1, prices by small deltas. The layout isn't just skipping irrelevant bytes; it's <em>creating</em> the redundancy that compression and CPU-vectorized scans feast on (Chapter 13 cashes this in fully).</p>" +
      "<h3>Wide Column Stores</h3>" +
      "<p>Don't confuse columnar databases with <em>wide column stores</em> like BigTable or HBase. Those store data as a multidimensional sorted map (row key → column family → column → timestamped value); column <em>families</em> group related data, but within a family data is still stored row-wise. The similarity is in the name only.</p>" +
      "<div class='callout'>Picking between the two is a workload question: which values are accessed <em>together</em>? Records → rows. Aggregates over fields → columns.</div>" },

    { title: "Data Files and Index Files",
      html: "<p>A database stores tables in <strong>data files</strong> and builds <strong>index files</strong> so it can find records without scanning everything. Data files come in three classic flavors:</p>" +
      "<ul><li><strong>Heap files</strong> — records appended in write order; any meaningful lookup order needs an external index.</li>" +
      "<li><strong>Hash files</strong> — records grouped in buckets by hash of the key.</li>" +
      "<li><strong>Index-organized tables</strong> — the data lives <em>inside</em> the index structure itself (e.g., in B-Tree leaves), so reading the index in order reads the records in order, and a lookup ends at the data with no extra hop.</li></ul>" +
      "<p>An index over a data file maps keys to record locations. The <strong>primary index</strong> is built over the primary key; <strong>secondary indexes</strong> over anything else, and several of them can point at the same records. An index is <em>clustered</em> when record order follows key order (index-organized tables are clustered by construction), <em>non-clustered</em> otherwise.</p>" +
      "<h3>Primary Index as an Indirection</h3>" +
      "<p>Should a secondary index point directly at a record's file offset, or at its primary key? Direct offsets make reads faster (no second lookup) but every record move forces updates in <em>every</em> index. Pointing at the primary key makes updates cheap — only the primary index must know where the record physically is — at the cost of one extra hop per read. It's a classic read-cost vs. update-cost trade; e.g., InnoDB routes secondary indexes through the primary key, while an offset-based design pays the maintenance price for faster reads.</p>" +
      "<div class='fig'><svg viewBox='0 0 760 250' xmlns='http://www.w3.org/2000/svg' font-family='Menlo,monospace'>" +
      "<rect x='60' y='40' width='240' height='50' rx='8' fill='#111a2e' stroke='#4f7cff' stroke-width='2'/>" +
      "<text x='180' y='61' text-anchor='middle' fill='#c9d6ea' font-size='12.5'>secondary index on email</text>" +
      "<text x='180' y='79' text-anchor='middle' fill='#7d8fb0' font-size='11'>ada@x.io → ?</text>" +
      "<rect x='460' y='40' width='240' height='50' rx='8' fill='#111a2e' stroke='#2de2ff' stroke-width='2'/>" +
      "<text x='580' y='61' text-anchor='middle' fill='#c9d6ea' font-size='12.5'>primary index on id</text>" +
      "<text x='580' y='79' text-anchor='middle' fill='#7d8fb0' font-size='11'>id 42 → offset 0x3A00</text>" +
      "<rect x='60' y='170' width='640' height='46' rx='8' fill='#0c1220' stroke='#1c2a45' stroke-width='2'/>" +
      "<text x='96' y='190' fill='#7d8fb0' font-size='10.5'>data file</text>" +
      "<rect x='150' y='178' width='120' height='30' rx='5' fill='#111a2e' stroke='#1c2a45'/><text x='210' y='197' text-anchor='middle' fill='#7d8fb0' font-size='11'>id 17 · …</text>" +
      "<rect x='285' y='178' width='150' height='30' rx='5' fill='#111a2e' stroke='#3ddc97' stroke-width='2'/><text x='360' y='197' text-anchor='middle' fill='#3ddc97' font-size='11'>id 42 · ada@x.io · …</text>" +
      "<rect x='450' y='178' width='120' height='30' rx='5' fill='#111a2e' stroke='#1c2a45'/><text x='510' y='197' text-anchor='middle' fill='#7d8fb0' font-size='11'>id 96 · …</text>" +
      "<line x1='150' y1='90' x2='330' y2='172' stroke='#ff5d73' stroke-width='2' stroke-dasharray='6 5'/><polygon points='334,176 322,172 329,163' fill='#ff5d73'/>" +
      "<text x='150' y='128' fill='#ff5d73' font-size='11'>option A: raw offset</text>" +
      "<text x='150' y='143' fill='#7d8fb0' font-size='10.5'>1 hop — but breaks in EVERY</text>" +
      "<text x='150' y='157' fill='#7d8fb0' font-size='10.5'>index when the record moves</text>" +
      "<line x1='300' y1='62' x2='454' y2='62' stroke='#ffd166' stroke-width='2'/><polygon points='460,62 448,56 448,68' fill='#ffd166'/>" +
      "<text x='378' y='52' text-anchor='middle' fill='#ffd166' font-size='11'>option B: store id 42</text>" +
      "<line x1='580' y1='90' x2='400' y2='172' stroke='#ffd166' stroke-width='2'/><polygon points='395,175 405,167 410,178' fill='#ffd166'/>" +
      "<text x='560' y='128' fill='#ffd166' font-size='11'>primary resolves the offset</text>" +
      "<text x='560' y='143' fill='#7d8fb0' font-size='10.5'>2 hops — but a moved record</text>" +
      "<text x='560' y='157' fill='#7d8fb0' font-size='10.5'>updates ONE place only</text>" +
      "</svg><div class='fig-cap'>The indirection trade drawn out. Option A (dashed red) jumps straight to bytes — fastest read, but a page split or vacuum that relocates the record invalidates the pointer in every secondary index. Option B (gold, InnoDB's choice) routes through the primary key: one extra lookup per read, one single place to update per move.</div></div>" },

    { title: "Buffering, Immutability, and Ordering",
      html: "<p>Here is the lens for the whole of Part I. Nearly every storage structure is a point in a three-dimensional design space:</p>" +
      "<ul><li><strong>Buffering</strong> — does the structure collect updates in memory before writing them to disk? (Beyond the unavoidable page-sized I/O everyone does.) Buffering amortizes write cost but must be protected against crashes.</li>" +
      "<li><strong>Mutability</strong> — does it modify pages <em>in place</em>, or only ever append/write new files? In-place updates need space management and locking; immutable structures write sequentially and merge later, trading write simplicity for background reorganization.</li>" +
      "<li><strong>Ordering</strong> — are records stored in key order, enabling range scans, or in arrival order, enabling blind fast appends?</li></ul>" +
      "<p>B-Trees: in-place, ordered, lightly buffered. LSM-Trees: immutable, ordered, heavily buffered. Bitcask: immutable, unordered. Keep these three dials in mind and every exotic variant in later chapters will look like someone turning one of them.</p>" +
      "<div class='fig'><svg viewBox='0 0 760 215' xmlns='http://www.w3.org/2000/svg' font-family='Menlo,monospace'>" +
      "<text x='250' y='30' text-anchor='middle' fill='#7d8fb0' font-size='12'>buffering</text>" +
      "<text x='425' y='30' text-anchor='middle' fill='#7d8fb0' font-size='12'>mutability</text>" +
      "<text x='605' y='30' text-anchor='middle' fill='#7d8fb0' font-size='12'>ordering</text>" +
      "<text x='75' y='68' fill='#c9d6ea' font-size='13'>B-Tree</text>" +
      "<rect x='185' y='48' width='130' height='30' rx='15' fill='rgba(79,124,255,.12)' stroke='#4f7cff'/><text x='250' y='67' text-anchor='middle' fill='#4f7cff' font-size='12'>light</text>" +
      "<rect x='360' y='48' width='130' height='30' rx='15' fill='rgba(255,93,115,.1)' stroke='#ff5d73'/><text x='425' y='67' text-anchor='middle' fill='#ff5d73' font-size='12'>in-place</text>" +
      "<rect x='540' y='48' width='130' height='30' rx='15' fill='rgba(61,220,151,.1)' stroke='#3ddc97'/><text x='605' y='67' text-anchor='middle' fill='#3ddc97' font-size='12'>key order</text>" +
      "<text x='75' y='123' fill='#c9d6ea' font-size='13'>LSM-Tree</text>" +
      "<rect x='185' y='103' width='130' height='30' rx='15' fill='rgba(45,226,255,.12)' stroke='#2de2ff'/><text x='250' y='122' text-anchor='middle' fill='#2de2ff' font-size='12'>heavy (memtable)</text>" +
      "<rect x='360' y='103' width='130' height='30' rx='15' fill='rgba(255,209,102,.1)' stroke='#ffd166'/><text x='425' y='122' text-anchor='middle' fill='#ffd166' font-size='12'>immutable</text>" +
      "<rect x='540' y='103' width='130' height='30' rx='15' fill='rgba(61,220,151,.1)' stroke='#3ddc97'/><text x='605' y='122' text-anchor='middle' fill='#3ddc97' font-size='12'>key order</text>" +
      "<text x='75' y='178' fill='#c9d6ea' font-size='13'>Bitcask</text>" +
      "<rect x='185' y='158' width='130' height='30' rx='15' fill='rgba(125,143,176,.1)' stroke='#7d8fb0'/><text x='250' y='177' text-anchor='middle' fill='#7d8fb0' font-size='12'>none</text>" +
      "<rect x='360' y='158' width='130' height='30' rx='15' fill='rgba(255,209,102,.1)' stroke='#ffd166'/><text x='425' y='177' text-anchor='middle' fill='#ffd166' font-size='12'>immutable</text>" +
      "<rect x='540' y='158' width='130' height='30' rx='15' fill='rgba(255,93,115,.1)' stroke='#ff5d73'/><text x='605' y='177' text-anchor='middle' fill='#ff5d73' font-size='12'>arrival order</text>" +
      "</svg><div class='fig-cap'>Three storage engines as settings of the three dials. Read down a column and you see the trade each dial controls: buffering batches writes (at crash-safety cost), immutability trades in-place bookkeeping for background merging, ordering trades write speed for range scans. Every structure in Chapters 5–10 is one of these rows with a twist.</div></div>" }
  ],
  terms: [
    { t: "storage engine", d: "The DBMS component that owns how data is physically stored, retrieved, and kept durable on disk and in memory." },
    { t: "query optimizer", d: "Rewrites a parsed query and picks the cheapest execution plan using statistics about the stored data." },
    { t: "heap file", d: "A data file where records sit in write order with no key ordering; needs indexes for efficient lookup." },
    { t: "index-organized table", d: "A table stored inside its index structure, so data and primary index are one — lookups end at the data." },
    { t: "clustered index", d: "An index whose key order matches the physical order of the records it points to." },
    { t: "column-oriented storage", d: "Layout that stores each column's values contiguously — ideal for analytical scans and compression." },
    { t: "buffering / immutability / ordering", d: "The three design axes that classify virtually every storage structure." },
    { t: "checkpoint", d: "A periodic snapshot of database state that bounds how much log must be replayed during recovery." }
  ],
  quiz: [
    { type: "mc", q: "A query arrives at a database. Which component decides the cheapest way to execute it?",
      opts: ["The transport layer", "The optimizer in the query processor", "The buffer manager", "The lock manager"], a: 1,
      why: "The parser validates and resolves the query; the optimizer then picks the plan using statistics. Execution and storage layers only carry the plan out." },
    { type: "mc", q: "Why do in-memory databases still write to disk at all?",
      opts: ["To serve reads faster", "For durability: a log plus periodic snapshots let them recover after power loss", "Because the OS requires it", "To keep indexes sorted"], a: 1,
      why: "RAM is volatile. Operations are logged sequentially before acknowledgment, and snapshots bound the log replay needed at restart." },
    { type: "mc", q: "Your workload is `SELECT AVG(temperature) FROM readings` over billions of rows. Which layout reads the fewest bytes?",
      opts: ["Row-oriented", "Column-oriented", "A wide column store", "Heap file with a hash index"], a: 1,
      why: "Column storage puts every temperature value contiguously — the query touches one column's bytes instead of dragging whole rows through memory." },
    { type: "mc", q: "A secondary index stores primary keys instead of direct file offsets. What's the trade?",
      opts: ["Reads get faster, writes get slower", "Reads pay an extra lookup, but record moves only update the primary index", "It uses less memory but breaks range scans", "It prevents index clustering"], a: 1,
      why: "Indirection through the primary key means physical relocation of records doesn't ripple into every secondary index — at the price of one extra hop per read." },
    { type: "order", q: "Order the layers a read request passes through, from client to bytes:",
      items: ["Transport", "Query processor (parser + optimizer)", "Execution engine", "Storage engine access methods"],
      why: "Transport accepts the query, the processor plans it, the execution engine runs the plan, and access methods touch the actual data structures." }
  ]
});

/* ======================= CHAPTER 2 ======================= */
CHAPTERS.push({
  num: 5, part: 1, title: "B-Tree Basics",
  blurb: "The B-Tree is the structure most databases use to find a row fast, and here we build the idea up from scratch. We start with the simple search trees you may have seen before, see exactly why they get painfully slow once the data lives on a disk instead of in memory, and then watch how the B-Tree fixes that by packing hundreds of keys into each node and keeping itself balanced as new data is added.",
  sections: [
    { title: "Binary Search Trees — and Why Disks Reject Them",
      html: "<p>Start from the familiar: a <strong>binary search tree</strong> keeps each node's key greater than everything in its left subtree and less than everything in its right. Search walks one comparison per level — logarithmic, <em>if</em> the tree is balanced.</p>" +
      "<div class='fig'><svg viewBox='0 0 760 265' xmlns='http://www.w3.org/2000/svg' font-family='Menlo,monospace'>" +
      "<text x='190' y='24' text-anchor='middle' fill='#3ddc97' font-size='13'>random inserts → balanced: height 3</text>" +
      "<line x1='190' y1='73' x2='110' y2='115' stroke='#1c2a45' stroke-width='2'/><line x1='190' y1='73' x2='270' y2='115' stroke='#1c2a45' stroke-width='2'/>" +
      "<line x1='110' y1='133' x2='70' y2='180' stroke='#1c2a45' stroke-width='2'/><line x1='110' y1='133' x2='150' y2='180' stroke='#1c2a45' stroke-width='2'/>" +
      "<line x1='270' y1='133' x2='230' y2='180' stroke='#1c2a45' stroke-width='2'/><line x1='270' y1='133' x2='310' y2='180' stroke='#1c2a45' stroke-width='2'/>" +
      "<circle cx='190' cy='55' r='18' fill='#111a2e' stroke='#4f7cff' stroke-width='2'/><text x='190' y='60' text-anchor='middle' fill='#c9d6ea' font-size='13'>8</text>" +
      "<circle cx='110' cy='115' r='18' fill='#111a2e' stroke='#4f7cff' stroke-width='2'/><text x='110' y='120' text-anchor='middle' fill='#c9d6ea' font-size='13'>4</text>" +
      "<circle cx='270' cy='115' r='18' fill='#111a2e' stroke='#4f7cff' stroke-width='2'/><text x='270' y='120' text-anchor='middle' fill='#c9d6ea' font-size='13'>12</text>" +
      "<circle cx='70' cy='180' r='18' fill='#111a2e' stroke='#4f7cff' stroke-width='2'/><text x='70' y='185' text-anchor='middle' fill='#c9d6ea' font-size='13'>2</text>" +
      "<circle cx='150' cy='180' r='18' fill='#111a2e' stroke='#4f7cff' stroke-width='2'/><text x='150' y='185' text-anchor='middle' fill='#c9d6ea' font-size='13'>6</text>" +
      "<circle cx='230' cy='180' r='18' fill='#111a2e' stroke='#4f7cff' stroke-width='2'/><text x='230' y='185' text-anchor='middle' fill='#c9d6ea' font-size='13'>10</text>" +
      "<circle cx='310' cy='180' r='18' fill='#111a2e' stroke='#4f7cff' stroke-width='2'/><text x='310' y='185' text-anchor='middle' fill='#c9d6ea' font-size='13'>14</text>" +
      "<text x='190' y='232' text-anchor='middle' fill='#7d8fb0' font-size='12'>any lookup: ≤ 3 comparisons</text>" +
      "<text x='575' y='24' text-anchor='middle' fill='#ff5d73' font-size='13'>sorted inserts → a linked list: height 7</text>" +
      "<line x1='463' y1='52' x2='492' y2='72' stroke='#1c2a45' stroke-width='2'/><line x1='498' y1='82' x2='527' y2='102' stroke='#1c2a45' stroke-width='2'/>" +
      "<line x1='533' y1='112' x2='562' y2='132' stroke='#1c2a45' stroke-width='2'/><line x1='568' y1='142' x2='597' y2='162' stroke='#1c2a45' stroke-width='2'/>" +
      "<line x1='603' y1='172' x2='632' y2='192' stroke='#1c2a45' stroke-width='2'/><line x1='638' y1='202' x2='667' y2='222' stroke='#1c2a45' stroke-width='2'/>" +
      "<circle cx='450' cy='45' r='16' fill='#111a2e' stroke='#ff5d73' stroke-width='2'/><text x='450' y='50' text-anchor='middle' fill='#c9d6ea' font-size='12'>2</text>" +
      "<circle cx='485' cy='75' r='16' fill='#111a2e' stroke='#ff5d73' stroke-width='2'/><text x='485' y='80' text-anchor='middle' fill='#c9d6ea' font-size='12'>4</text>" +
      "<circle cx='520' cy='105' r='16' fill='#111a2e' stroke='#ff5d73' stroke-width='2'/><text x='520' y='110' text-anchor='middle' fill='#c9d6ea' font-size='12'>6</text>" +
      "<circle cx='555' cy='135' r='16' fill='#111a2e' stroke='#ff5d73' stroke-width='2'/><text x='555' y='140' text-anchor='middle' fill='#c9d6ea' font-size='12'>8</text>" +
      "<circle cx='590' cy='165' r='16' fill='#111a2e' stroke='#ff5d73' stroke-width='2'/><text x='590' y='170' text-anchor='middle' fill='#c9d6ea' font-size='12'>10</text>" +
      "<circle cx='625' cy='195' r='16' fill='#111a2e' stroke='#ff5d73' stroke-width='2'/><text x='625' y='200' text-anchor='middle' fill='#c9d6ea' font-size='12'>12</text>" +
      "<circle cx='660' cy='225' r='16' fill='#111a2e' stroke='#ff5d73' stroke-width='2'/><text x='660' y='230' text-anchor='middle' fill='#c9d6ea' font-size='12'>14</text>" +
      "<text x='555' y='258' text-anchor='middle' fill='#7d8fb0' font-size='12'>finding 14: 7 comparisons — O(n)</text>" +
      "</svg><div class='fig-cap'>The same seven keys, two insertion orders. A BST's O(log n) promise depends entirely on shape: sorted input (the common case in databases — think auto-increment IDs) degenerates every 'right child' into a 'next pointer', and search into a scan.</div></div>" +
      "<h3>Tree Balancing</h3>" +
      "<p>Insert sorted keys into a naive BST and it degenerates into a linked list: every lookup becomes a linear scan. Balanced variants (like AVL trees) fix this with <strong>rotations</strong> after inserts, keeping height differences bounded so search stays O(log₂ N).</p>" +
      "<div class='fig'><svg viewBox='0 0 760 215' xmlns='http://www.w3.org/2000/svg' font-family='Menlo,monospace'>" +
      "<text x='170' y='24' text-anchor='middle' fill='#ff5d73' font-size='13'>unbalanced after inserting 2, 4, 6</text>" +
      "<line x1='130' y1='68' x2='168' y2='108' stroke='#1c2a45' stroke-width='2'/><line x1='180' y1='125' x2='218' y2='158' stroke='#1c2a45' stroke-width='2'/>" +
      "<circle cx='120' cy='58' r='18' fill='#111a2e' stroke='#ff5d73' stroke-width='2'/><text x='120' y='63' text-anchor='middle' fill='#c9d6ea' font-size='13'>2</text>" +
      "<circle cx='175' cy='115' r='18' fill='#111a2e' stroke='#ffd166' stroke-width='2'/><text x='175' y='120' text-anchor='middle' fill='#c9d6ea' font-size='13'>4</text>" +
      "<circle cx='228' cy='168' r='18' fill='#111a2e' stroke='#ff5d73' stroke-width='2'/><text x='228' y='173' text-anchor='middle' fill='#c9d6ea' font-size='13'>6</text>" +
      "<text x='170' y='207' text-anchor='middle' fill='#7d8fb0' font-size='12'>height 3, all one branch</text>" +
      "<line x1='320' y1='115' x2='430' y2='115' stroke='#2de2ff' stroke-width='2'/><polygon points='438,115 424,109 424,121' fill='#2de2ff'/>" +
      "<text x='379' y='100' text-anchor='middle' fill='#2de2ff' font-size='12.5'>left rotation</text><text x='379' y='137' text-anchor='middle' fill='#7d8fb0' font-size='11.5'>4 becomes the root</text>" +
      "<text x='580' y='24' text-anchor='middle' fill='#3ddc97' font-size='13'>balanced after the rotation</text>" +
      "<line x1='580' y1='78' x2='515' y2='128' stroke='#1c2a45' stroke-width='2'/><line x1='580' y1='78' x2='645' y2='128' stroke='#1c2a45' stroke-width='2'/>" +
      "<circle cx='580' cy='65' r='18' fill='#111a2e' stroke='#ffd166' stroke-width='2'/><text x='580' y='70' text-anchor='middle' fill='#c9d6ea' font-size='13'>4</text>" +
      "<circle cx='510' cy='138' r='18' fill='#111a2e' stroke='#3ddc97' stroke-width='2'/><text x='510' y='143' text-anchor='middle' fill='#c9d6ea' font-size='13'>2</text>" +
      "<circle cx='650' cy='138' r='18' fill='#111a2e' stroke='#3ddc97' stroke-width='2'/><text x='650' y='143' text-anchor='middle' fill='#c9d6ea' font-size='13'>6</text>" +
      "<text x='580' y='207' text-anchor='middle' fill='#7d8fb0' font-size='12'>height 2, both subtrees equal</text>" +
      "</svg><div class='fig-cap'>The smallest rotation: the middle key (4) is pulled up to become the parent, its old parent (2) drops to the left. Pure pointer surgery — no keys move, order is preserved, height shrinks. AVL trees fire these after any insert that unbalances a subtree; the catch on disk is that one logical insert can now dirty several far-apart nodes.</div></div>" +
      "<h3>Trees for Disk-Based Storage</h3>" +
      "<p>Now put that structure on disk and watch it fail on two counts:</p>" +
      "<ul><li><strong>Fanout is too low.</strong> Two children per node means a tree over a billion keys is ~30 levels deep — and on disk, every level is potentially a separate random I/O. Worse, each tiny node (a key + two pointers) lives who-knows-where; <strong>locality</strong> is terrible since freshly inserted nodes land on random pages.</li>" +
      "<li><strong>Balancing writes too much.</strong> Rotations touch many nodes; on disk that's many page writes for one logical insert.</li></ul>" +
      "<p>The prescription: nodes should be <em>page-sized</em>, hold <em>many</em> keys (high fanout), and the structure should need as few disk-touching updates as possible. That prescription <em>is</em> the B-Tree.</p>" },

    { title: "Disk-Based Structures: Know Your Hardware",
      html: "<p>Data structures are shaped by the medium they run on.</p>" +
      "<h3>Hard Disk Drives</h3>" +
      "<p>On spinning disks, a random read pays <strong>seek time</strong> (moving the head) plus rotational latency — milliseconds — after which sequential bytes stream cheaply. So the golden rule: pay the seek once, then read/write big contiguous chunks. The smallest transfer unit is a sector (typically 512 B–4 KB).</p>" +
      "<h3>Solid State Drives</h3>" +
      "<p>SSDs have no moving parts, but they are far from \"just fast disks.\" Flash is organized into <em>pages</em> (2–16 KB) grouped into <em>blocks</em>; you can read and program (write) a page, but you cannot overwrite it in place — a page must be <strong>erased</strong> first, and erasure happens only at whole-block granularity. The <strong>Flash Translation Layer (FTL)</strong> inside the drive remaps logical addresses to physical pages, collects garbage blocks, and spreads writes for <strong>wear leveling</strong>, because each cell survives a limited number of program–erase cycles.</p>" +
      "<div class='fig'><svg viewBox='0 0 760 240' xmlns='http://www.w3.org/2000/svg' font-family='Menlo,monospace'>" +
      "<text x='170' y='24' text-anchor='middle' fill='#2de2ff' font-size='13'>HDD: mechanical latency</text>" +
      "<circle cx='150' cy='130' r='78' fill='#0c1220' stroke='#1c2a45' stroke-width='2'/>" +
      "<circle cx='150' cy='130' r='54' fill='none' stroke='#1c2a45' stroke-width='1.5'/>" +
      "<circle cx='150' cy='130' r='30' fill='none' stroke='#1c2a45' stroke-width='1.5'/>" +
      "<circle cx='150' cy='130' r='6' fill='#111a2e' stroke='#4f7cff' stroke-width='2'/>" +
      "<path d='M 150 76 A 54 54 0 0 1 197 103' fill='none' stroke='#3ddc97' stroke-width='4'/>" +
      "<line x1='268' y1='70' x2='172' y2='120' stroke='#ffd166' stroke-width='4'/><circle cx='172' cy='120' r='5' fill='#ffd166'/>" +
      "<text x='285' y='66' fill='#ffd166' font-size='11.5'>head: seek to track</text>" +
      "<text x='285' y='82' fill='#ff5d73' font-size='11.5'>+ rotate to sector ≈ ms</text>" +
      "<text x='285' y='110' fill='#3ddc97' font-size='11.5'>then stream sequentially</text>" +
      "<text x='285' y='126' fill='#3ddc97' font-size='11.5'>≈ free</text>" +
      "<text x='560' y='24' text-anchor='middle' fill='#2de2ff' font-size='13'>SSD: program/erase asymmetry</text>" +
      "<rect x='430' y='45' width='260' height='130' rx='8' fill='none' stroke='#4f7cff' stroke-width='2'/>" +
      "<text x='560' y='195' text-anchor='middle' fill='#7d8fb0' font-size='11.5'>erase unit: the whole block</text>" +
      "<rect x='445' y='60' width='55' height='30' rx='4' fill='#111a2e' stroke='#3ddc97'/><text x='472' y='79' text-anchor='middle' fill='#3ddc97' font-size='10'>live</text>" +
      "<rect x='508' y='60' width='55' height='30' rx='4' fill='#111a2e' stroke='#3ddc97'/><text x='535' y='79' text-anchor='middle' fill='#3ddc97' font-size='10'>live</text>" +
      "<rect x='571' y='60' width='55' height='30' rx='4' fill='#111a2e' stroke='#ff5d73'/><text x='598' y='79' text-anchor='middle' fill='#ff5d73' font-size='10'>stale</text>" +
      "<rect x='634' y='60' width='42' height='30' rx='4' fill='#111a2e' stroke='#1c2a45'/><text x='655' y='79' text-anchor='middle' fill='#7d8fb0' font-size='10'>free</text>" +
      "<rect x='445' y='100' width='55' height='30' rx='4' fill='#111a2e' stroke='#ff5d73'/><text x='472' y='119' text-anchor='middle' fill='#ff5d73' font-size='10'>stale</text>" +
      "<rect x='508' y='100' width='55' height='30' rx='4' fill='#111a2e' stroke='#3ddc97'/><text x='535' y='119' text-anchor='middle' fill='#3ddc97' font-size='10'>live</text>" +
      "<rect x='571' y='100' width='55' height='30' rx='4' fill='#111a2e' stroke='#1c2a45'/><text x='598' y='119' text-anchor='middle' fill='#7d8fb0' font-size='10'>free</text>" +
      "<rect x='634' y='100' width='42' height='30' rx='4' fill='#111a2e' stroke='#1c2a45'/><text x='655' y='119' text-anchor='middle' fill='#7d8fb0' font-size='10'>free</text>" +
      "<text x='560' y='155' text-anchor='middle' fill='#c9d6ea' font-size='11'>pages program once; rewriting means: write elsewhere,</text>" +
      "<text x='560' y='169' text-anchor='middle' fill='#c9d6ea' font-size='11'>mark stale, erase the block later (FTL bookkeeping)</text>" +
      "<text x='150' y='230' text-anchor='middle' fill='#7d8fb0' font-size='11.5'>reward: pay the seek once, then read big chunks</text>" +
      "<text x='560' y='230' text-anchor='middle' fill='#7d8fb0' font-size='11.5'>reward: big, append-like writes; no tiny overwrites</text>" +
      "</svg><div class='fig-cap'>Two different physics, one prescription. The HDD's cost is mechanical positioning before every random access; the SSD's is that a flash page can't be overwritten in place — the FTL redirects writes and erases whole blocks later. Both media therefore reward block-aligned, sequential, batched I/O — the exact shape of every structure in Part I.</div></div>" +
      "<h3>On-Disk Structures</h3>" +
      "<p>Both media reward the same behaviors: block-aligned access, sequential I/O over random, and fewer, larger writes. That's why on-disk structures think in fixed-size pages, why pointers become page offsets, and why \"how many pages does this operation touch?\" is <em>the</em> complexity metric — not how many CPU comparisons it makes.</p>" },

    { title: "Ubiquitous B-Trees", viz: "btree", vizTitle: "B-Tree: insert keys, watch it split",
      html: "<p>The B-Tree takes the BST's sorted-search idea and rebuilds it for pages. Each node fills a page and holds up to hundreds of keys, so <strong>fanout is enormous</strong> and height is tiny — millions of keys in 3–4 levels.</p>" +
      "<h3>B-Tree Hierarchy</h3>" +
      "<p>One <strong>root</strong>, layers of <strong>internal nodes</strong>, and <strong>leaves</strong> that hold the actual key–value pairs. B-Trees keep every leaf at the same depth and stay balanced not by rotations, but by how they grow (splits) and shrink (merges).</p>" +
      "<h3>B-Trees vs B⁺-Trees: What Databases Actually Build</h3>" +
      "<p>A precision worth having: the structure described here — and the one virtually every database implements — is technically a <strong>B⁺-Tree</strong>. The original B-Tree allows values to live at <em>any</em> level: root, internal nodes, or leaves. B⁺-Trees store values <strong>only in the leaves</strong>; internal nodes hold nothing but separator keys used to steer the search downward. The consequences are why B⁺ won:</p>" +
      "<ul><li><strong>Fatter internal nodes</strong> — with no values crowding them, internal nodes pack more separators per page, raising fanout and lowering the tree.</li>" +
      "<li><strong>Simpler operations</strong> — every insert, update, delete, and read terminates at the leaf level; higher levels change only when splits and merges propagate.</li>" +
      "<li><strong>Range scans for free</strong> — all records sit on one level, so a scan is 'find the start leaf, walk right' with no mid-tree detours.</li></ul>" +
      "<p>The industry absorbed the distinction so thoroughly that the names blurred: InnoDB's docs call its B⁺-Tree a \"B-tree,\" and most literature (this site included) uses <em>B-Tree</em> as the umbrella term. When you read \"B-Tree index\" anywhere in a database context, read \"B⁺-Tree.\"</p>" +
      "<h3>Fanout, Occupancy — and the Arithmetic That Makes It Work</h3>" +
      "<p>The relation between a node's capacity and how many keys it actually holds is its <strong>occupancy</strong>; splits and merges fire when nodes are full or nearly empty, and steady-state trees settle around ~70% occupancy. Run the numbers to feel the power: a 4&nbsp;KB page holding 16-byte key+pointer entries fits ~250 separators. At fanout 250:</p>" +
      "<ul><li>1 level (root only): 250 keys</li>" +
      "<li>2 levels: 250² ≈ 62,500 keys</li>" +
      "<li>3 levels: 250³ ≈ 15.6 million keys</li>" +
      "<li>4 levels: 250⁴ ≈ <strong>3.9 billion keys</strong></li></ul>" +
      "<p>Four page reads reach any of four billion records — and since the root and second level together are a few megabytes, they live permanently in the page cache: a real-world point lookup usually pays <strong>one or two</strong> actual disk reads. Compare the balanced binary tree's ~32 levels over the same data, each a potential seek. High fanout doesn't just shrink the height; it also amortizes rebalancing — a 250-key node absorbs hundreds of inserts between splits, where a binary tree rebalances constantly.</p>" +
      "<h3>Separator Keys</h3>" +
      "<p>Internal nodes hold <em>separator keys</em> that fence off child subtrees: everything left of separator K is less than K, everything right is greater or equal. Following child pointers narrows the key range level by level until a leaf either contains the key or proves its absence.</p>" +
      "<h3>Lookup Algorithm and Complexity</h3>" +
      "<p>A lookup does a <strong>binary search within each node</strong> (nodes are sorted) and follows one child pointer per level. Two ways to count the cost: the number of <em>pages fetched</em> is log_fanout(N) — the number that matters for I/O — while the number of <em>comparisons</em> is still ~log₂(N) overall. Lookups also serve range scans: find the start leaf, then walk leaves in order.</p>" +
      "<h3>Counting Keys</h3>" +
      "<p>Bookkeeping convention: a node with K separator keys has K+1 children. (Textbooks vary on whether \"order\" counts keys or children — what matters is occupancy limits, not naming.)</p>" +
      "<h3>Node Splits</h3>" +
      "<p>Insert into a full node and it <strong>splits</strong>: allocate a sibling, move half the entries there, and <em>promote</em> the middle key into the parent as a new separator. If the parent is also full, it splits too — splits propagate upward, and when the root itself splits, the tree grows a new root and gains a level. That's the only way a B-Tree gets taller, which is why all leaves stay level.</p>" +
      "<h3>Node Merges</h3>" +
      "<p>Deletes are the mirror image: when neighboring nodes get too empty, they <strong>merge</strong> — contents combine, and a separator is removed from (or demoted out of) the parent. Merges can also propagate up, shrinking the tree.</p>" +
      "<div class='callout'>Try it above: insert keys one at a time and watch a full node split and push a key to its parent — then keep going until the root itself splits and the tree grows taller.</div>" },

    { title: "The B-Tree Lookup Algorithm, Step by Step",
      html: "<p>The lookup deserves to be slowed down and watched, because <em>every</em> B-Tree operation begins with it — reads, inserts, and deletes all first locate the leaf that owns the key. The algorithm is a single loop:</p>" +
      "<ol><li>Load the <strong>root</strong> page.</li>" +
      "<li><strong>Binary-search</strong> the node's sorted keys for the target. In an internal node, the result picks a child pointer: follow the pointer between the two separators that bracket the target.</li>" +
      "<li>Load that child and repeat, until the node is a <strong>leaf</strong>.</li>" +
      "<li>Binary-search the leaf: either the key is there (return the record) or its absence is proven (the position where it <em>would</em> be is empty — which, for an insert, is exactly where the new key belongs).</li></ol>" +
      "<div class='fig'><svg viewBox='0 0 760 280' xmlns='http://www.w3.org/2000/svg' font-family='Menlo,monospace'>" +
      "<text x='378' y='20' text-anchor='middle' fill='#ffd166' font-size='13'>searching for key 41</text>" +
      "<rect x='290' y='32' width='180' height='36' rx='8' fill='#111a2e' stroke='#ffd166' stroke-width='2.5'/>" +
      "<text x='344' y='55' text-anchor='middle' fill='#c9d6ea' font-size='14'>31</text><text x='416' y='55' text-anchor='middle' fill='#c9d6ea' font-size='14'>68</text>" +
      "<line x1='380' y1='36' x2='380' y2='64' stroke='#1c2a45'/><line x1='308' y1='36' x2='308' y2='64' stroke='#1c2a45'/><line x1='452' y1='36' x2='452' y2='64' stroke='#1c2a45'/>" +
      "<text x='508' y='50' fill='#ffd166' font-size='12'>① 31 ≤ 41 &lt; 68</text><text x='508' y='66' fill='#7d8fb0' font-size='11.5'>→ middle child</text>" +
      "<line x1='300' y1='68' x2='145' y2='118' stroke='#1c2a45' stroke-width='2'/>" +
      "<line x1='380' y1='68' x2='380' y2='118' stroke='#ffd166' stroke-width='2.5'/><polygon points='380,124 374,112 386,112' fill='#ffd166'/>" +
      "<line x1='460' y1='68' x2='615' y2='118' stroke='#1c2a45' stroke-width='2'/>" +
      "<rect x='60' y='126' width='160' height='36' rx='8' fill='#111a2e' stroke='#4f7cff' stroke-width='2'/><text x='110' y='149' text-anchor='middle' fill='#7d8fb0' font-size='13'>11</text><text x='172' y='149' text-anchor='middle' fill='#7d8fb0' font-size='13'>20</text>" +
      "<rect x='300' y='126' width='160' height='36' rx='8' fill='#111a2e' stroke='#ffd166' stroke-width='2.5'/><text x='350' y='149' text-anchor='middle' fill='#c9d6ea' font-size='14'>40</text><text x='412' y='149' text-anchor='middle' fill='#c9d6ea' font-size='14'>55</text>" +
      "<rect x='540' y='126' width='160' height='36' rx='8' fill='#111a2e' stroke='#4f7cff' stroke-width='2'/><text x='590' y='149' text-anchor='middle' fill='#7d8fb0' font-size='13'>80</text><text x='652' y='149' text-anchor='middle' fill='#7d8fb0' font-size='13'>91</text>" +
      "<text x='508' y='183' fill='#ffd166' font-size='12'>② 40 ≤ 41 &lt; 55</text><text x='508' y='199' fill='#7d8fb0' font-size='11.5'>→ middle leaf</text>" +
      "<line x1='315' y1='162' x2='165' y2='212' stroke='#1c2a45' stroke-width='2'/>" +
      "<line x1='380' y1='162' x2='380' y2='212' stroke='#ffd166' stroke-width='2.5'/><polygon points='380,218 374,206 386,206' fill='#ffd166'/>" +
      "<line x1='445' y1='162' x2='595' y2='212' stroke='#1c2a45' stroke-width='2'/>" +
      "<rect x='85' y='220' width='160' height='36' rx='8' fill='#111a2e' stroke='#4f7cff' stroke-width='2'/><text x='165' y='243' text-anchor='middle' fill='#7d8fb0' font-size='13'>31 · 34 · 38</text>" +
      "<rect x='300' y='220' width='160' height='36' rx='8' fill='#111a2e' stroke='#ffd166' stroke-width='2.5'/>" +
      "<text x='330' y='243' text-anchor='middle' fill='#c9d6ea' font-size='13'>40</text>" +
      "<rect x='358' y='226' width='30' height='24' rx='5' fill='rgba(61,220,151,.15)' stroke='#3ddc97' stroke-width='2'/><text x='373' y='243' text-anchor='middle' fill='#3ddc97' font-size='13'>41</text>" +
      "<text x='424' y='243' text-anchor='middle' fill='#c9d6ea' font-size='13'>47</text>" +
      "<rect x='515' y='220' width='160' height='36' rx='8' fill='#111a2e' stroke='#4f7cff' stroke-width='2'/><text x='595' y='243' text-anchor='middle' fill='#7d8fb0' font-size='13'>55 · 60 · 64</text>" +
      "<text x='378' y='274' text-anchor='middle' fill='#3ddc97' font-size='12'>③ binary search inside the leaf → found</text>" +
      "</svg><div class='fig-cap'>Three pages touched, three binary searches, one answer. At each internal node the separators bracket the target (31 ≤ 41 &lt; 68, then 40 ≤ 41 &lt; 55); the leaf settles it. A miss (say, 42) walks the identical gold path and stops at the same leaf — landing on the exact slot where 42 would be inserted.</div></div>" +
      "<p>Two details make this loop production-grade. First, the same descent serves <strong>range scans</strong>: locate the leaf holding the range's start, then walk rightward through the leaves (via sibling links — Chapter 7) without ever climbing back up. Second, a <em>failed</em> lookup is not wasted work — inserts rely on it landing precisely on the insertion point, and the pages it visited become the breadcrumb trail a split will follow back up (Chapter 7).</p>" },

    { title: "B-Tree Lookup Complexity: Two Ways to Count",
      html: "<p>\"How fast is a B-Tree lookup?\" has two honest answers, and knowing which one matters is the whole discipline of disk-based data structures:</p>" +
      "<ul><li><strong>Counting page fetches (I/O)</strong> — the tree's height: <code>log_fanout(N)</code> block transfers. This is the number that dominates on disk, where a page fetch costs somewhere between microseconds (NVMe) and milliseconds (HDD).</li>" +
      "<li><strong>Counting comparisons (CPU)</strong> — binary search inside each node does log₂(keys-per-node) comparisons, and across the whole descent that multiplies out to ~<code>log₂(N)</code> total, the same as any balanced search structure. Fanout doesn't reduce comparisons — it <em>relocates</em> them into contiguous, cache-friendly pages.</li></ul>" +
      "<div class='fig'><svg viewBox='0 0 760 250' xmlns='http://www.w3.org/2000/svg' font-family='Menlo,monospace'>" +
      "<text x='185' y='24' text-anchor='middle' fill='#ff5d73' font-size='13'>fanout 2 — height ≈ 30</text>" +
      "<rect x='125' y='38' width='120' height='11' rx='3' fill='#111a2e' stroke='#ff5d73'/>" +
      "<rect x='125' y='54' width='120' height='11' rx='3' fill='#111a2e' stroke='#ff5d73'/>" +
      "<rect x='125' y='70' width='120' height='11' rx='3' fill='#111a2e' stroke='#ff5d73'/>" +
      "<rect x='125' y='86' width='120' height='11' rx='3' fill='#111a2e' stroke='#ff5d73'/>" +
      "<rect x='125' y='102' width='120' height='11' rx='3' fill='#111a2e' stroke='#ff5d73'/>" +
      "<text x='185' y='131' text-anchor='middle' fill='#ff5d73' font-size='15'>⋮</text>" +
      "<rect x='125' y='140' width='120' height='11' rx='3' fill='#111a2e' stroke='#ff5d73'/>" +
      "<rect x='125' y='156' width='120' height='11' rx='3' fill='#111a2e' stroke='#ff5d73'/>" +
      "<text x='185' y='192' text-anchor='middle' fill='#c9d6ea' font-size='12'>1 billion keys:</text>" +
      "<text x='185' y='209' text-anchor='middle' fill='#ff5d73' font-size='12'>log₂(10⁹) ≈ 30 page reads</text>" +
      "<text x='565' y='24' text-anchor='middle' fill='#3ddc97' font-size='13'>fanout 250 — height 4</text>" +
      "<rect x='490' y='42' width='150' height='26' rx='5' fill='#111a2e' stroke='#3ddc97' stroke-width='2'/><text x='565' y='59' text-anchor='middle' fill='#7d8fb0' font-size='11'>root · 250 keys</text>" +
      "<rect x='490' y='76' width='150' height='26' rx='5' fill='#111a2e' stroke='#3ddc97' stroke-width='2'/><text x='565' y='93' text-anchor='middle' fill='#7d8fb0' font-size='11'>level 2 · 62,500</text>" +
      "<rect x='490' y='110' width='150' height='26' rx='5' fill='#111a2e' stroke='#3ddc97' stroke-width='2'/><text x='565' y='127' text-anchor='middle' fill='#7d8fb0' font-size='11'>level 3 · 15.6 M</text>" +
      "<rect x='490' y='144' width='150' height='26' rx='5' fill='#111a2e' stroke='#3ddc97' stroke-width='2'/><text x='565' y='161' text-anchor='middle' fill='#7d8fb0' font-size='11'>leaves · 3.9 B</text>" +
      "<text x='565' y='192' text-anchor='middle' fill='#c9d6ea' font-size='12'>1 billion keys:</text>" +
      "<text x='565' y='209' text-anchor='middle' fill='#3ddc97' font-size='12'>log₂₅₀(10⁹) ≈ 4 page reads</text>" +
      "<text x='378' y='240' text-anchor='middle' fill='#7d8fb0' font-size='12'>same ~30 key comparisons either way — packed into 4 pages instead of scattered across 30</text>" +
      "</svg><div class='fig-cap'>Both trees perform ~log₂(N) comparisons; the B-Tree's trick is packaging. Fanout 250 folds 30 levels of binary decisions into 4 page-sized super-nodes, so the disk — which bills per page, not per comparison — sees a 4-step walk. And since the top two levels (~a few MB) live in the page cache permanently, the marginal lookup usually pays 1–2 real I/Os.</div></div>" +
      "<p>This is why B-Tree papers measure everything in <strong>block transfers</strong> and treat CPU as an afterthought — and why Chapter 9's cache-conscious variants exist for the moment RAM becomes the bottleneck and the comparisons start mattering again. One more consequence worth internalizing: because height grows logarithmically <em>in the fanout's base</em>, trees get taller extremely reluctantly — a tree of height 4 at fanout 250 must grow ~250× before it needs a fifth level.</p>" },
  ],
  terms: [
    { t: "fanout", d: "Number of children per node. High fanout ⇒ shallow tree ⇒ few disk reads per lookup." },
    { t: "B⁺-Tree", d: "The variant every database builds: values only in leaves, internal nodes hold only separator keys — what 'B-Tree' means in practice." },
    { t: "occupancy", d: "How full a node is relative to its capacity; splits and merges fire at the full/near-empty extremes." },
    { t: "separator key", d: "A key in an internal node that splits the key space between two child subtrees." },
    { t: "node split", d: "Overflow response: half the entries move to a new sibling and the middle key is promoted to the parent." },
    { t: "node merge", d: "Underflow response: two sparse siblings combine and a separator is removed from the parent." },
    { t: "seek time", d: "Time for an HDD head to reach the right track — the millisecond-scale cost that makes random I/O expensive." },
    { t: "Flash Translation Layer", d: "SSD firmware that remaps logical writes to physical flash pages, doing garbage collection and wear leveling." },
    { t: "balancing rotation", d: "The pointer surgery AVL-style in-memory trees use to stay shallow — too write-heavy for disk pages." },
    { t: "page", d: "The fixed-size block a storage engine reads and writes as a unit; B-Tree nodes are built to fill one." }
  ],
  quiz: [
    { type: "mc", q: "Why are plain binary search trees a poor fit for disk storage?",
      opts: ["They can't store strings", "Low fanout means many levels — and each level can cost a random disk read", "They can't be balanced", "Binary search doesn't work on sorted pages"], a: 1,
      why: "With 2 children per node, height (and thus potential disk seeks) is log₂N; B-Trees pack hundreds of keys per page-sized node to slash the height." },
    { type: "mc", q: "What happens when a B-Tree root splits?",
      opts: ["The tree loses a level", "Data is rebalanced into the leaves", "A new root is created and the tree grows one level taller", "The database must rebuild the index"], a: 2,
      why: "Splits propagate upward; a root split mints a fresh root above it. Growing only at the root is what keeps every leaf at the same depth." },
    { type: "mc", q: "Why can't an SSD overwrite a page in place?",
      opts: ["The OS forbids it", "Flash pages must be erased first, and erasure only works on whole blocks", "Pages are read-only after first write, forever", "Wear leveling prevents all writes"], a: 1,
      why: "Program–erase asymmetry is fundamental to flash; the FTL hides it by writing elsewhere and remapping, then garbage-collecting stale pages." },
    { type: "blank", q: "In an internal B-Tree node, the keys that direct a search into the correct child subtree are called ________ keys.",
      a: ["separator", "seperator", "separator keys"], why: "Separator keys fence the key space: less than the separator goes left, greater-or-equal goes right." },
    { type: "mc", q: "In the B⁺-Tree variant that databases actually implement, where do the values live?",
      opts: ["At every level, next to their keys", "Only in the leaf nodes — internal nodes hold separator keys alone", "Only in the root, for fast access", "In a separate hash table"], a: 1,
      why: "Keeping internal nodes value-free maximizes their fanout and confines all record operations to the leaf level; higher levels change only via splits and merges." },
    { type: "order", q: "Order the steps of a B-Tree point lookup:",
      items: ["Start at the root node", "Binary-search the node's keys to pick a child pointer", "Descend level by level to a leaf", "Find the key (or its absence) in the leaf"],
      why: "Each level narrows the range via separator keys until the leaf gives the definitive answer." }
  ]
});

/* ======================= CHAPTER 3 ======================= */
CHAPTERS.push({
  num: 6, part: 1, title: "File Formats",
  blurb: "Once you leave memory there are no objects or variables, just raw bytes in a file, and it's the database's job to give them meaning. This chapter is about that craft: how numbers and text get turned into bytes, how a file is split into fixed-size chunks called pages, and a clever page layout (the slotted page) that lets records of different sizes be added, deleted, and shuffled around without anything else losing track of where they are.",
  sections: [
    { title: "Motivation & Binary Encoding",
      html: "<p>In memory you have <code>malloc</code>, pointers, and a garbage collector. On disk you have… bytes at offsets. Files must be designed so data can be found, updated, and grown efficiently, with all bookkeeping done by the database itself.</p>" +
      "<h3>Primitive Types</h3>" +
      "<p>Numbers are stored fixed-size (e.g., 4-byte integers, IEEE-754 floats), and byte order matters: <strong>big-endian</strong> stores the most significant byte first, <strong>little-endian</strong> the least. A file written on one convention and read with the other yields garbage, so formats pin the byte order down explicitly.</p>" +
      "<h3>Strings and Variable-Size Data</h3>" +
      "<p>Anything variable-size is stored <strong>length-prefixed</strong>: a size field followed by the bytes (the classic \"Pascal string\"). That turns \"find the end\" from a scan into an O(1) read, and lets you skip over a value without parsing it.</p>" +
      "<p>Even the size fields themselves get optimized. Most lengths are small, so burning a fixed 4 bytes on every one is wasteful; real formats use <strong>variable-length integers (varints)</strong>: each byte carries 7 bits of the number plus a continuation bit saying \"more bytes follow.\" A length of 90 costs one byte; 4&nbsp;GB-scale lengths cost five. SQLite's record format and Protocol Buffers both lean on varints — millions of small numbers stored in millions of single bytes.</p>" +
      "<div class='fig'><svg viewBox='0 0 760 235' xmlns='http://www.w3.org/2000/svg' font-family='Menlo,monospace'>" +
      "<text x='80' y='30' fill='#c9d6ea' font-size='13'>the 32-bit integer 0x12345678, laid out two ways:</text>" +
      "<text x='80' y='68' fill='#2de2ff' font-size='12'>big-endian</text>" +
      "<rect x='230' y='48' width='70' height='32' rx='5' fill='#111a2e' stroke='#2de2ff' stroke-width='2'/><text x='265' y='68' text-anchor='middle' fill='#c9d6ea' font-size='13'>12</text>" +
      "<rect x='308' y='48' width='70' height='32' rx='5' fill='#111a2e' stroke='#2de2ff' stroke-width='2'/><text x='343' y='68' text-anchor='middle' fill='#c9d6ea' font-size='13'>34</text>" +
      "<rect x='386' y='48' width='70' height='32' rx='5' fill='#111a2e' stroke='#2de2ff' stroke-width='2'/><text x='421' y='68' text-anchor='middle' fill='#c9d6ea' font-size='13'>56</text>" +
      "<rect x='464' y='48' width='70' height='32' rx='5' fill='#111a2e' stroke='#2de2ff' stroke-width='2'/><text x='499' y='68' text-anchor='middle' fill='#c9d6ea' font-size='13'>78</text>" +
      "<text x='560' y='68' fill='#7d8fb0' font-size='11'>MSB first — reads like text</text>" +
      "<text x='80' y='118' fill='#ffd166' font-size='12'>little-endian</text>" +
      "<rect x='230' y='98' width='70' height='32' rx='5' fill='#111a2e' stroke='#ffd166' stroke-width='2'/><text x='265' y='118' text-anchor='middle' fill='#c9d6ea' font-size='13'>78</text>" +
      "<rect x='308' y='98' width='70' height='32' rx='5' fill='#111a2e' stroke='#ffd166' stroke-width='2'/><text x='343' y='118' text-anchor='middle' fill='#c9d6ea' font-size='13'>56</text>" +
      "<rect x='386' y='98' width='70' height='32' rx='5' fill='#111a2e' stroke='#ffd166' stroke-width='2'/><text x='421' y='118' text-anchor='middle' fill='#c9d6ea' font-size='13'>34</text>" +
      "<rect x='464' y='98' width='70' height='32' rx='5' fill='#111a2e' stroke='#ffd166' stroke-width='2'/><text x='499' y='118' text-anchor='middle' fill='#c9d6ea' font-size='13'>12</text>" +
      "<text x='560' y='118' fill='#7d8fb0' font-size='11'>LSB first — x86's native order</text>" +
      "<text x='80' y='172' fill='#c9d6ea' font-size='13'>the varint 300 (binary 100101100), 7 bits per byte:</text>" +
      "<rect x='230' y='185' width='150' height='32' rx='5' fill='#111a2e' stroke='#4f7cff' stroke-width='2'/>" +
      "<text x='250' y='205' fill='#ff5d73' font-size='13'>1</text><text x='312' y='205' text-anchor='middle' fill='#c9d6ea' font-size='13'>0101100</text>" +
      "<rect x='390' y='185' width='150' height='32' rx='5' fill='#111a2e' stroke='#4f7cff' stroke-width='2'/>" +
      "<text x='410' y='205' fill='#3ddc97' font-size='13'>0</text><text x='472' y='205' text-anchor='middle' fill='#c9d6ea' font-size='13'>0000010</text>" +
      "<text x='555' y='198' fill='#7d8fb0' font-size='11'>red bit: continue</text>" +
      "<text x='555' y='213' fill='#7d8fb0' font-size='11'>green bit: stop — 2 bytes total</text>" +
      "</svg><div class='fig-cap'>Top: the same 4 bytes mean 305,419,896 or 2,018,915,346 depending on which end you read from — which is why a format that doesn't pin endianness down is a format that corrupts data silently. Bottom: a varint spends one bit per byte on 'more follows', so 300 fits in 2 bytes and anything under 128 in one.</div></div>" +
      "<h3>Bit-Packed Data: Booleans, Enums, and Flags</h3>" +
      "<p>Booleans need one bit, not one byte — so eight of them pack into a byte. Enums become small integers. Flags combine both ideas: a bitmask where each bit is an independent boolean, set with <code>|=</code>, tested with <code>&amp;</code>, cleared with <code>&amp;= ~</code>.</p>" },

    { title: "General Principles & Page Structure",
      html: "<p>A file format usually opens with a fixed-size <strong>header</strong> describing everything needed to interpret the rest (versions, page size, root locations), sometimes mirrored by a trailer. The file body is split into <strong>fixed-size pages</strong> — read and written as whole units. Fixed size is a superpower: page N lives at offset N × page_size, no lookup table required.</p>" +
      "<p>Within structures, the same discipline applies: fixed-size fields go in predictable positions; variable-size data goes into dedicated regions with offsets pointing at it. It's very common to split a record into a fixed-size header holding offsets, plus a variable-size tail — most fields can then be read without parsing the whole record.</p>" +
      "<p>A naive B-Tree page could store its keys and pointers back-to-back in sorted order — but then every insert would shift half the page, and appending at the edge would break sorting. Variable-size records make it worse. We need a smarter page layout…</p>" },

    { title: "Slotted Pages", viz: "slotted", vizTitle: "Slotted page: insert, delete, defragment",
      html: "<p>The <strong>slotted page</strong> is the standard answer, used from PostgreSQL to SQLite. Three regions:</p>" +
      "<ul><li>a <strong>header</strong> with page metadata,</li>" +
      "<li>a <strong>slot directory</strong> of small pointers growing <em>forward</em> from the header,</li>" +
      "<li>and <strong>cells</strong> (the records) growing <em>backward</em> from the end of the page — free space is the shrinking gap in the middle.</li></ul>" +
      "<p>The genius is the indirection. Records are addressed by <strong>slot ID</strong>, not byte offset. The slots (kept in key order) are what's sorted; the cells can sit anywhere in the page in any order. So:</p>" +
      "<ul><li>Inserting in sorted position only shifts tiny slot pointers, never whole records.</li>" +
      "<li>Deleting just drops the slot; the cell becomes reclaimable garbage.</li>" +
      "<li>Defragmentation can slide cells around without changing any external reference.</li></ul>" +
      "<div class='callout'>Play with the page above: insert variable-size records, delete a few to create holes, then defragment and note the slot IDs never change.</div>" },

    { title: "Cell Layout & Combining Cells into Pages",
      html: "<p>A <strong>cell</strong> is the unit inside a page. Key cells (in internal nodes) hold a key plus a child-page pointer; key–value cells (in leaves) hold a key plus its record. A typical cell layout: [key size][value size][key bytes][value bytes] — sizes first, so a reader can skip without parsing. Because all cells in a page share properties (cell type, whether keys are fixed-size), the shared facts get hoisted into the page header rather than repeated per cell.</p>" +
      "<h3>A Cell, Byte by Byte</h3>" +
      "<p>Make it concrete. Storing the pair <code>\"cat\" → \"meow\"</code> as a leaf key–value cell with one-byte varint sizes:</p>" +
      "<p><code>[03] [04] [63 61 74] [6D 65 6F 77]</code></p>" +
      "<ul><li><code>03</code> — key length: 3 bytes.</li>" +
      "<li><code>04</code> — value length: 4 bytes.</li>" +
      "<li><code>63 61 74</code> — the ASCII bytes of <code>cat</code>.</li>" +
      "<li><code>6D 65 6F 77</code> — the ASCII bytes of <code>meow</code>.</li></ul>" +
      "<p>Nine bytes total, two of them bookkeeping. A reader comparing keys reads the first varint, compares exactly 3 bytes, and — on a mismatch — jumps <em>4 + 3 = 7</em> bytes past everything else without ever parsing the value. An internal-node key cell swaps the value for a fixed-size child page number: <code>[03] [63 61 74] [00 00 00 2A]</code> — \"keys ≥ <code>cat</code> live in page 42.\" Every real format (SQLite cells, InnoDB records, LMDB nodes) is a dialect of exactly this pattern.</p>" +
      "<div class='fig'><svg viewBox='0 0 760 150' xmlns='http://www.w3.org/2000/svg' font-family='Menlo,monospace'>" +
      "<text x='378' y='24' text-anchor='middle' fill='#c9d6ea' font-size='13'>leaf cell for  \"cat\" → \"meow\"  — nine bytes</text>" +
      "<rect x='60' y='45' width='64' height='36' rx='5' fill='rgba(79,124,255,.12)' stroke='#4f7cff' stroke-width='2'/><text x='92' y='68' text-anchor='middle' fill='#c9d6ea' font-size='13'>03</text>" +
      "<rect x='128' y='45' width='64' height='36' rx='5' fill='rgba(79,124,255,.12)' stroke='#4f7cff' stroke-width='2'/><text x='160' y='68' text-anchor='middle' fill='#c9d6ea' font-size='13'>04</text>" +
      "<rect x='196' y='45' width='64' height='36' rx='5' fill='rgba(45,226,255,.1)' stroke='#2de2ff' stroke-width='2'/><text x='228' y='68' text-anchor='middle' fill='#c9d6ea' font-size='13'>63</text>" +
      "<rect x='264' y='45' width='64' height='36' rx='5' fill='rgba(45,226,255,.1)' stroke='#2de2ff' stroke-width='2'/><text x='296' y='68' text-anchor='middle' fill='#c9d6ea' font-size='13'>61</text>" +
      "<rect x='332' y='45' width='64' height='36' rx='5' fill='rgba(45,226,255,.1)' stroke='#2de2ff' stroke-width='2'/><text x='364' y='68' text-anchor='middle' fill='#c9d6ea' font-size='13'>74</text>" +
      "<rect x='400' y='45' width='64' height='36' rx='5' fill='rgba(255,209,102,.08)' stroke='#ffd166' stroke-width='2'/><text x='432' y='68' text-anchor='middle' fill='#c9d6ea' font-size='13'>6D</text>" +
      "<rect x='468' y='45' width='64' height='36' rx='5' fill='rgba(255,209,102,.08)' stroke='#ffd166' stroke-width='2'/><text x='500' y='68' text-anchor='middle' fill='#c9d6ea' font-size='13'>65</text>" +
      "<rect x='536' y='45' width='64' height='36' rx='5' fill='rgba(255,209,102,.08)' stroke='#ffd166' stroke-width='2'/><text x='568' y='68' text-anchor='middle' fill='#c9d6ea' font-size='13'>6F</text>" +
      "<rect x='604' y='45' width='64' height='36' rx='5' fill='rgba(255,209,102,.08)' stroke='#ffd166' stroke-width='2'/><text x='636' y='68' text-anchor='middle' fill='#c9d6ea' font-size='13'>77</text>" +
      "<text x='126' y='103' text-anchor='middle' fill='#4f7cff' font-size='11'>key len · val len</text>" +
      "<text x='296' y='103' text-anchor='middle' fill='#2de2ff' font-size='11'>c  a  t</text>" +
      "<text x='534' y='103' text-anchor='middle' fill='#ffd166' font-size='11'>m  e  o  w</text>" +
      "<text x='126' y='128' text-anchor='middle' fill='#7d8fb0' font-size='10.5'>read these two first…</text>" +
      "<text x='296' y='128' text-anchor='middle' fill='#7d8fb0' font-size='10.5'>…compare exactly 3 bytes…</text>" +
      "<text x='534' y='128' text-anchor='middle' fill='#7d8fb0' font-size='10.5'>…or skip 7 bytes without parsing</text>" +
      "</svg><div class='fig-cap'>The byte strip from the walkthrough, drawn. Sizes lead (blue), key follows (cyan), value trails (gold) — and because the sizes lead, a scanner hopping cell-to-cell touches only the blue bytes of cells it doesn't care about.</div></div>" +
      "<p>To insert a cell, the engine claims space from the free region (or a suitable hole left by a deletion — availability lists track those holes and their sizes), copies the cell there, and wedges its offset into the slot directory at the right sorted position. First-fit vs best-fit strategies trade allocation speed against fragmentation.</p>" },

    { title: "Managing Variable-Size Data, Versioning & Checksumming",
      html: "<h3>Managing Variable-Size Data</h3>" +
      "<p>Deleting a cell doesn't rewrite the page — the cell is just marked dead and its space remembered in the availability list. If an insert needs more contiguous space than any single hole offers but the page's <em>total</em> free bytes suffice, the page is <strong>defragmented</strong>: live cells are rewritten compactly and the holes coalesce. (More on vacuum-style maintenance in Chapter 7.)</p>" +
      "<h3>Versioning</h3>" +
      "<p>Formats evolve. Databases handle old files by storing a format version — in a filename prefix, a separate metadata file, or the file header — and keeping code paths (or migrations) for every version they promise to read.</p>" +
      "<h3>Checksumming</h3>" +
      "<p>Disks lie occasionally: bit rot, torn writes, firmware bugs. Pages therefore carry <strong>checksums</strong> (or stronger CRCs), validated on read and recomputed on write. Putting a checksum on each <em>page</em> — rather than one for a whole file — localizes both the cost of validation and the blast radius of corruption: one bad page, not one bad database.</p>" }
  ],
  terms: [
    { t: "endianness", d: "Byte order of multi-byte numbers: big-endian (MSB first) vs little-endian (LSB first). Formats must pin it down." },
    { t: "length-prefixed string", d: "Variable-size data stored as [size][bytes], making skipping and slicing O(1)." },
    { t: "varint", d: "Variable-length integer: 7 data bits + a continuation bit per byte, so small numbers cost one byte (SQLite, protobuf)." },
    { t: "slotted page", d: "Page layout with a slot directory growing from the front and cells from the back; records addressed by slot ID." },
    { t: "cell", d: "A page's storage unit: a key + child pointer (internal) or key + value (leaf)." },
    { t: "slot directory", d: "The array of small offset pointers that stays sorted by key so the cells themselves never need to move." },
    { t: "availability list", d: "Per-page list of freed cell holes, consulted before claiming fresh free space." },
    { t: "checksum", d: "A small validation code detecting page corruption; checked on read, updated on write." },
    { t: "magic number", d: "A fixed multi-byte constant marking a page/file so readers can sanity-check what they're looking at." }
  ],
  quiz: [
    { type: "mc", q: "In a slotted page, what actually gets re-sorted when a record is inserted in key order?",
      opts: ["All the cells after the insertion point", "Only the slot directory of small pointers", "The page header", "The whole page is rewritten"], a: 1,
      why: "Cells land wherever free space is; logical order lives in the slot directory, so sorting means shuffling a few 2–4 byte pointers." },
    { type: "mc", q: "Why do databases put a checksum on every page rather than one per file?",
      opts: ["File-level checksums are illegal in POSIX", "Smaller numbers are more accurate", "Validation cost and corruption blast radius stay local to one page", "Pages change endianness"], a: 2,
      why: "You verify only the page you read, and one flipped bit condemns one page instead of casting doubt on the entire file." },
    { type: "mc", q: "How are variable-size strings typically stored on disk?",
      opts: ["Null-terminated, like C strings", "Length-prefixed: size field followed by the bytes", "Fixed 255-byte fields", "Base64-encoded"], a: 1,
      why: "A size prefix lets readers skip a value in O(1) without scanning for a terminator — vital when slicing through cells." },
    { type: "blank", q: "The shrinking gap between the slot directory and the cells in a slotted page is the page's ________ space.",
      a: ["free"], why: "Slots grow forward, cells grow backward, and free space is squeezed in the middle until a split is needed." },
    { type: "order", q: "Order the steps of inserting a cell into a slotted page:",
      items: ["Find space: a suitable hole from the availability list or the free region", "Copy the cell bytes into that space", "Insert its offset into the slot directory at the sorted position", "Update the page header's cell count"],
      why: "Space first, bytes second, then the indirection layer and metadata are updated." }
  ]
});

/* ======================= CHAPTER 4 ======================= */
CHAPTERS.push({
  num: 7, part: 1, title: "Implementing B-Trees",
  blurb: "Chapter 5 showed the B-Tree in its clean, textbook form. This chapter adds everything a real production B-Tree needs on top of that: links between neighboring pages so range scans stay fast, a way to store values too big to fit in one page, how a page split finds its way back up the tree, and how to reclaim the wasted space that slowly builds up as data is updated and deleted.",
  sections: [
    { title: "Page Header Machinery",
      html: "<p>A B-Tree page's header accumulates a surprising amount of engineering:</p>" +
      "<h3>Magic Numbers</h3><p>A fixed constant (like <code>0xDEADBEEF</code>-style markers) written into each page. Validating it on read catches \"this offset isn't the kind of page you think it is\" bugs and gross corruption cheaply.</p>" +
      "<h3>Sibling Links</h3><p>Leaves (sometimes all nodes) carry pointers to their left/right neighbors, so range scans hop leaf-to-leaf without climbing back through parents. The cost: a split now updates a sibling's back-pointer too.</p>" +
      "<h3>Rightmost Pointers</h3><p>With K separators and K+1 children, one child pointer doesn't pair with a key. Many implementations (following SQLite's style) store it as a special <em>rightmost pointer</em> in the header.</p>" +
      "<h3>Node High Keys</h3><p>A <strong>high key</strong> (the Blink-Tree idea) records the upper bound of what a node may ever contain. A searcher finding a key greater than the high key knows the target moved right during a concurrent split — follow the sibling link. High keys turn splits into something readers can race against safely.</p>" +
      "<h3>Overflow Pages</h3><p>When a value is too large for its page, the page stores a prefix plus a pointer to a chain of <strong>overflow pages</strong> holding the spillover. Keys usually stay in the primary page so searches don't chase chains.</p>" +
      "<div class='fig'><svg viewBox='0 0 760 250' xmlns='http://www.w3.org/2000/svg' font-family='Menlo,monospace'>" +
      "<rect x='40' y='50' width='200' height='110' rx='8' fill='#0c1220' stroke='#4f7cff' stroke-width='2'/>" +
      "<rect x='40' y='50' width='200' height='30' rx='8' fill='#111a2e' stroke='#4f7cff'/>" +
      "<text x='58' y='70' fill='#7d8fb0' font-size='10.5'>magic · count ·</text><text x='168' y='70' fill='#ffd166' font-size='10.5'>high key: 30</text>" +
      "<text x='140' y='105' text-anchor='middle' fill='#c9d6ea' font-size='12'>11 · 18 · 25 · 29</text>" +
      "<text x='140' y='145' text-anchor='middle' fill='#7d8fb0' font-size='10.5'>leaf A</text>" +
      "<rect x='280' y='50' width='200' height='110' rx='8' fill='#0c1220' stroke='#4f7cff' stroke-width='2'/>" +
      "<rect x='280' y='50' width='200' height='30' rx='8' fill='#111a2e' stroke='#4f7cff'/>" +
      "<text x='298' y='70' fill='#7d8fb0' font-size='10.5'>magic · count ·</text><text x='408' y='70' fill='#ffd166' font-size='10.5'>high key: 60</text>" +
      "<text x='380' y='105' text-anchor='middle' fill='#c9d6ea' font-size='12'>31 · 44 · 52*</text>" +
      "<text x='380' y='145' text-anchor='middle' fill='#7d8fb0' font-size='10.5'>leaf B — *value spills over</text>" +
      "<rect x='520' y='50' width='200' height='110' rx='8' fill='#0c1220' stroke='#4f7cff' stroke-width='2'/>" +
      "<rect x='520' y='50' width='200' height='30' rx='8' fill='#111a2e' stroke='#4f7cff'/>" +
      "<text x='538' y='70' fill='#7d8fb0' font-size='10.5'>magic · count ·</text><text x='648' y='70' fill='#ffd166' font-size='10.5'>high key: ∞</text>" +
      "<text x='620' y='105' text-anchor='middle' fill='#c9d6ea' font-size='12'>61 · 75 · 88</text>" +
      "<text x='620' y='145' text-anchor='middle' fill='#7d8fb0' font-size='10.5'>leaf C</text>" +
      "<line x1='240' y1='95' x2='274' y2='95' stroke='#2de2ff' stroke-width='2'/><polygon points='280,95 268,89 268,101' fill='#2de2ff'/>" +
      "<line x1='280' y1='120' x2='246' y2='120' stroke='#2de2ff' stroke-width='2'/><polygon points='240,120 252,114 252,126' fill='#2de2ff'/>" +
      "<line x1='480' y1='95' x2='514' y2='95' stroke='#2de2ff' stroke-width='2'/><polygon points='520,95 508,89 508,101' fill='#2de2ff'/>" +
      "<line x1='520' y1='120' x2='486' y2='120' stroke='#2de2ff' stroke-width='2'/><polygon points='480,120 492,114 492,126' fill='#2de2ff'/>" +
      "<text x='378' y='36' text-anchor='middle' fill='#2de2ff' font-size='11.5'>sibling links: range scans hop leaf → leaf, never re-climbing</text>" +
      "<line x1='420' y1='160' x2='480' y2='196' stroke='#ffd166' stroke-width='2' stroke-dasharray='5 4'/><polygon points='485,199 473,197 479,187' fill='#ffd166'/>" +
      "<rect x='490' y='196' width='140' height='34' rx='6' fill='#111a2e' stroke='#ffd166' stroke-width='1.5'/><text x='560' y='217' text-anchor='middle' fill='#7d8fb0' font-size='10.5'>overflow page(s)</text>" +
      "<text x='170' y='215' fill='#7d8fb0' font-size='11.5'>reader in leaf A looking for 35? 35 &gt; high key 30 ⇒</text>" +
      "<text x='170' y='231' fill='#7d8fb0' font-size='11.5'>a concurrent split moved it — follow the right sibling link</text>" +
      "</svg><div class='fig-cap'>One leaf level with its header machinery visible: magic number and count up front, the Blink-Tree high key (gold) promising each node's upper bound, bidirectional sibling links (cyan) for sideways scans, and an overflow chain for the value too big for its page.</div></div>" },

    { title: "Binary Search Within a Node", viz: "binsearch", vizTitle: "Binary search: halve until found",
      html: "<p>Inside each node, lookups binary-search the sorted keys: compare against the middle, discard half, repeat — log₂ comparisons. On a miss, the search settles exactly where the key <em>would</em> be (think of it as returning a negative insertion point): in a leaf that's the insert position, in an internal node it selects which child to descend into.</p>" +
      "<h3>Binary Search with Indirection Pointers</h3>" +
      "<p>In a slotted page, the binary search runs over the <em>slot directory</em>, since that's what's sorted — each probe dereferences a slot to reach the actual cell for comparison. With variable-size keys those cells are scattered across the page, which is cache-unfriendly; one mitigation is padding keys or keeping small fixed-size key prefixes near the slots so most comparisons stay local.</p>" },

    { title: "Propagating Splits and Merges",
      html: "<p>A leaf split must install a separator in the parent; if the parent overflows it splits too, potentially all the way to the root. But child pages don't store parent pointers — how does the split find its way up?</p>" +
      "<h3>Breadcrumbs</h3>" +
      "<p>During the downward descent, the engine records the path it took — a stack of <strong>breadcrumbs</strong> (page IDs, and often the position within each page). When a split or merge needs to propagate, it pops the stack to revisit ancestors. The breadcrumb trail also tells a concurrent-safety story: it's the set of nodes a modification might touch, hence the set that may need locks (see latch crabbing in Chapter 8). Alternatively some engines do maintain parent pointers — and then must update them on every split.</p>" +
      "<div class='fig'><svg viewBox='0 0 760 250' xmlns='http://www.w3.org/2000/svg' font-family='Menlo,monospace'>" +
      "<rect x='190' y='30' width='150' height='34' rx='7' fill='#111a2e' stroke='#4f7cff' stroke-width='2'/><text x='265' y='52' text-anchor='middle' fill='#c9d6ea' font-size='12'>root · page 1</text>" +
      "<rect x='120' y='105' width='150' height='34' rx='7' fill='#111a2e' stroke='#4f7cff' stroke-width='2'/><text x='195' y='127' text-anchor='middle' fill='#c9d6ea' font-size='12'>internal · page 7</text>" +
      "<rect x='60' y='180' width='150' height='34' rx='7' fill='#111a2e' stroke='#ff5d73' stroke-width='2.5'/><text x='135' y='202' text-anchor='middle' fill='#ff5d73' font-size='12'>leaf · page 23 FULL</text>" +
      "<line x1='245' y1='64' x2='210' y2='101' stroke='#2de2ff' stroke-width='2.5'/><polygon points='207,105 212,94 221,102' fill='#2de2ff'/>" +
      "<line x1='175' y1='139' x2='145' y2='176' stroke='#2de2ff' stroke-width='2.5'/><polygon points='142,180 146,168 156,175 ' fill='#2de2ff'/>" +
      "<text x='262' y='90' fill='#7d8fb0' font-size='10.5'>descend, pushing crumbs</text>" +
      "<rect x='450' y='40' width='250' height='120' rx='10' fill='#0c1220' stroke='#ffd166' stroke-width='1.5'/>" +
      "<text x='575' y='63' text-anchor='middle' fill='#ffd166' font-size='11.5'>breadcrumb stack</text>" +
      "<rect x='470' y='75' width='210' height='30' rx='5' fill='#111a2e' stroke='#1c2a45'/><text x='575' y='94' text-anchor='middle' fill='#c9d6ea' font-size='11'>(page 7, slot 0)  ← top</text>" +
      "<rect x='470' y='112' width='210' height='30' rx='5' fill='#111a2e' stroke='#1c2a45'/><text x='575' y='131' text-anchor='middle' fill='#c9d6ea' font-size='11'>(page 1, slot 2)</text>" +
      "<path d='M 215 195 C 330 200 420 160 460 110' fill='none' stroke='#ff5d73' stroke-width='2' stroke-dasharray='6 5'/><polygon points='463,105 452,111 460,118' fill='#ff5d73'/>" +
      "<text x='360' y='222' text-anchor='middle' fill='#ff5d73' font-size='11.5'>leaf splits → pop (page 7): install separator there;</text>" +
      "<text x='360' y='238' text-anchor='middle' fill='#ff5d73' font-size='11.5'>page 7 also full? pop (page 1) and repeat</text>" +
      "</svg><div class='fig-cap'>Child pages don't know their parents — the descent's own footprints do. Each level pushes (page, slot) onto a stack; when the leaf splits, the propagation pops its way back up the exact path it came down, no parent pointers required.</div></div>" },

    { title: "Rebalancing & Right-Only Appends",
      html: "<h3>Rebalancing</h3>" +
      "<p>Splits are not free — they allocate pages and write parents — so many implementations first try to <strong>rebalance</strong>: shift some elements to a less-full neighbor (updating the separator between them) to postpone the split. Symmetrically, merges can be postponed by borrowing elements from a fuller sibling. B*-Trees push this idea hard, keeping nodes ~two-thirds full by distributing among two siblings before splitting into three.</p>" +
      "<h3>Right-Only Appends</h3>" +
      "<p>Auto-incremented keys mean every insert lands in the rightmost leaf. Engines exploit this: cache the rightmost leaf (a <em>fast path</em>) to skip the root-to-leaf descent, and when it fills during a pure-append workload, split it without moving anything — new entries will only ever go right anyway, so leave the full page as-is and start a fresh one.</p>" +
      "<h3>Bulk Loading</h3>" +
      "<p>Building an index from presorted data shouldn't insert keys one by one. Instead, write the leaves left-to-right, fill by fill, and then <strong>build the parent levels bottom-up</strong> from the leaves' separators. No splits ever happen, pages come out optimally packed, and the write pattern is purely sequential.</p>" +
      "<div class='fig'><svg viewBox='0 0 760 235' xmlns='http://www.w3.org/2000/svg' font-family='Menlo,monospace'>" +
      "<text x='80' y='214' fill='#7d8fb0' font-size='11.5'>sorted input stream →</text>" +
      "<rect x='250' y='192' width='110' height='32' rx='6' fill='#111a2e' stroke='#3ddc97' stroke-width='2'/><text x='305' y='212' text-anchor='middle' fill='#c9d6ea' font-size='11'>1 … 99</text>" +
      "<rect x='372' y='192' width='110' height='32' rx='6' fill='#111a2e' stroke='#3ddc97' stroke-width='2'/><text x='427' y='212' text-anchor='middle' fill='#c9d6ea' font-size='11'>100 … 199</text>" +
      "<rect x='494' y='192' width='110' height='32' rx='6' fill='#111a2e' stroke='#3ddc97' stroke-width='2'/><text x='549' y='212' text-anchor='middle' fill='#c9d6ea' font-size='11'>200 … 299</text>" +
      "<rect x='616' y='192' width='90' height='32' rx='6' fill='#111a2e' stroke='#1c2a45' stroke-dasharray='5 4'/><text x='661' y='212' text-anchor='middle' fill='#7d8fb0' font-size='11'>next…</text>" +
      "<text x='478' y='176' text-anchor='middle' fill='#3ddc97' font-size='11'>① leaves written sequentially, packed full</text>" +
      "<line x1='355' y1='188' x2='420' y2='128' stroke='#1c2a45' stroke-width='2'/><line x1='478' y1='188' x2='466' y2='128' stroke='#1c2a45' stroke-width='2'/><line x1='560' y1='188' x2='510' y2='128' stroke='#1c2a45' stroke-width='2'/>" +
      "<rect x='390' y='94' width='170' height='32' rx='6' fill='#111a2e' stroke='#4f7cff' stroke-width='2'/><text x='475' y='114' text-anchor='middle' fill='#c9d6ea' font-size='11'>100 · 200</text>" +
      "<text x='300' y='114' text-anchor='end' fill='#4f7cff' font-size='11'>② parents derived from first keys</text>" +
      "<line x1='475' y1='90' x2='475' y2='58' stroke='#1c2a45' stroke-width='2'/>" +
      "<rect x='405' y='24' width='140' height='32' rx='6' fill='#111a2e' stroke='#ffd166' stroke-width='2'/><text x='475' y='44' text-anchor='middle' fill='#c9d6ea' font-size='11'>root</text>" +
      "<text x='330' y='44' text-anchor='end' fill='#ffd166' font-size='11'>③ up to a single root — zero splits</text>" +
      "</svg><div class='fig-cap'>Bulk loading inverts the usual growth direction: instead of trickling keys down from the root (paying descents and splits), finished leaves are laid down like bricks and the upper floors are computed from them. Purely sequential writes, 100% page occupancy.</div></div>" },

    { title: "Compression, Vacuum & Maintenance",
      html: "<h3>Compression</h3>" +
      "<p>Trading CPU for I/O: data can be compressed per-file (great ratio, terrible random access), per-page (the sweet spot for many engines, though compressed pages no longer align neatly with disk blocks), per-row, or per-field. Some systems also compress emptiness — encoding away the unused space inside partially-filled pages during transfer.</p>" +
      "<h3>Fragmentation Caused by Updates and Deletes</h3>" +
      "<p>Slotted pages make deletes cheap by leaving cells in place as garbage — but the garbage accumulates. Updates that don't fit in place behave like delete+insert, adding more. Meanwhile out-of-order inserts and repeated splits leave pages half-empty. The result: <strong>fragmentation</strong>, both inside pages (dead cells, holes) and across the file (sparse pages).</p>" +
      "<h3>Page Defragmentation (Vacuum)</h3>" +
      "<p>Maintenance runs — inline during writes, or as background <strong>vacuum</strong> processes — rewrite live cells contiguously to reclaim intra-page space, and coalesce underfilled sibling pages to reclaim whole pages. Because slotted pages address cells through slot IDs, all of this reshuffling is invisible to the rest of the tree.</p>" }
  ],
  terms: [
    { t: "sibling links", d: "Left/right neighbor pointers on leaves, letting range scans walk sideways without re-descending the tree." },
    { t: "high key", d: "A node's promised upper bound; lets readers detect concurrent splits and chase the sibling link (Blink-Tree)." },
    { t: "overflow page", d: "Chained page(s) holding the tail of a value too large for its home page." },
    { t: "breadcrumbs", d: "The stack of visited pages recorded on descent, replayed upward to propagate splits and merges." },
    { t: "rebalancing", d: "Shifting elements to a sibling to postpone a split or merge; B*-Trees institutionalize it." },
    { t: "bulk loading", d: "Building a tree from sorted data bottom-up: pack leaves sequentially, then derive parents — zero splits." },
    { t: "vacuum", d: "Background maintenance that rewrites pages compactly and reclaims space left by deletes and updates." },
    { t: "fast path append", d: "Caching the rightmost leaf so monotonically increasing keys skip the full root-to-leaf descent." }
  ],
  quiz: [
    { type: "mc", q: "A concurrent reader lands in a node whose keys are all smaller than its target — and the node's high key is smaller too. What happened, and what should it do?",
      opts: ["The key doesn't exist; give up", "The node split mid-flight; follow the sibling link right", "The tree is corrupted; halt", "Restart the search from the root with a lock"], a: 1,
      why: "That's the Blink-Tree contract: high key exceeded ⇒ the range moved to the right sibling during a split; the link pointer chases it without restarting." },
    { type: "mc", q: "Why is bulk-loading sorted data written bottom-up instead of via repeated inserts?",
      opts: ["Inserting sorted data is impossible in a B-Tree", "It avoids every split, packs pages fully, and writes sequentially", "It compresses better", "Parents must always be written before children"], a: 1,
      why: "Leaves fill left-to-right with no reshuffling, and internal levels are computed from the finished leaves — the fastest possible tree construction." },
    { type: "mc", q: "What do breadcrumbs solve during a leaf split?",
      opts: ["Finding free disk space", "Knowing which ancestors to update without storing parent pointers", "Compressing the separator keys", "Detecting page corruption"], a: 1,
      why: "The descent path is remembered on a stack; propagation pops it to reach the parent, grandparent, and so on." },
    { type: "blank", q: "The background process that reclaims space from dead cells and sparse pages is commonly called ________.",
      a: ["vacuum", "vacuuming", "garbage collection"], why: "Vacuum rewrites live data compactly; slot indirection keeps the shuffle invisible." },
    { type: "mc", q: "For an auto-increment primary key, which optimization applies?",
      opts: ["Hash the keys to spread inserts across leaves", "Cache the rightmost leaf and split it without redistributing", "Disable splits entirely", "Store new keys in overflow pages"], a: 1,
      why: "All inserts hit the rightmost edge, so the engine keeps a fast path to it and, on overflow, just starts a fresh right leaf — the old one will never receive another key." }
  ]
});

/* ======================= CHAPTER 5 ======================= */
CHAPTERS.push({
  num: 8, part: 1, title: "Transaction Processing and Recovery",
  blurb: "This is a big one: how a database keeps your data correct and safe even when the power fails or many users hit it at once. You'll learn how it caches pages in memory for speed, how a write-ahead log lets it recover cleanly after a crash without losing committed work, and the main ways it lets many transactions run at the same time (locking, keeping several versions of a row, and checking for conflicts at the end) without them corrupting each other's data.",
  sections: [
    { title: "Buffer Management", viz: "cache", vizTitle: "Page cache with CLOCK eviction",
      html: "<p>Every page access can't be a disk access, so the engine keeps a <strong>page cache</strong> (buffer pool): a fixed budget of in-memory frames holding copies of on-disk pages. Reads look in the cache first (<em>hit</em>) and fault the page in from disk on a <em>miss</em>; writes modify the cached copy, making it <strong>dirty</strong>, and flush it later — batching and deduplicating I/O.</p>" +
      "<h3>Caching Semantics &amp; Locking Pages</h3>" +
      "<p>References to a cached page must keep it alive: pages in active use are <strong>pinned</strong> so eviction can't yank them mid-operation. Hot pages that would just be re-fetched (say, the root and top B-Tree levels) can be kept resident essentially forever — the top of a B-Tree is a tiny fraction of the data but appears on <em>every</em> lookup path.</p>" +
      "<h3>Cache Eviction &amp; Page Replacement</h3>" +
      "<p>When the pool is full, someone must go. A dirty victim must be flushed before reuse (coordinated with the WAL — see below). Choosing victims well is the page-replacement problem:</p>" +
      "<ul><li><strong>FIFO</strong> — evict the oldest-loaded page. Simple, but age of load says nothing about usefulness (the root is loaded first and used forever).</li>" +
      "<li><strong>LRU</strong> — evict the least-recently-<em>used</em>. Good instincts, but naive implementations reorder a linked list on every access; variants like 2Q or LRU-K resist one-off scans polluting the cache.</li>" +
      "<li><strong>CLOCK</strong> — LRU's cheap cousin: frames in a circle with a reference bit; a sweeping hand clears set bits (second chance) and evicts the first unset one. Play with it above.</li>" +
      "<li><strong>LFU / TinyLFU</strong> — track access <em>frequency</em>, not recency; TinyLFU keeps frequency sketches over a time window so ancient popularity fades.</li></ul>" },

    { title: "Recovery: The Write-Ahead Log", viz: "wal", vizTitle: "Crash & recover: ARIES's three passes",
      html: "<p>Buffered writes create a terrifying window: the client got an acknowledgment, but the dirty page hasn't hit disk. The <strong>write-ahead log (WAL)</strong> closes it. Rule: append a log record describing every change — and force it to disk — <em>before</em> the change is acknowledged or the page is flushed. The log is append-only and sequential (cheap!), and every record gets a monotonically increasing <strong>LSN</strong> (log sequence number).</p>" +
      "<h3>Log Semantics, Checkpoints</h3>" +
      "<p>The log can't grow forever. Once all pages dirtied before some LSN have been flushed, the log up to that point is dead weight and can be <strong>trimmed</strong> — that's a checkpoint. Real systems use <em>fuzzy checkpoints</em> that don't stall writes: they record a window (begin/end checkpoint records plus a dirty-page table) rather than forcing everything out at once.</p>" +
      "<h3>Operation Versus Data Log</h3>" +
      "<p>A <em>physical</em> log records byte-level page diffs (fast to replay, verbose); a <em>logical</em> log records operations like \"insert X\" (compact, but replay must re-execute logic). ARIES uses a hybrid: physical redo, logical undo.</p>" +
      "<h3>Steal and Force Policies</h3>" +
      "<p>Two policy bits define the recovery problem. <strong>Steal</strong>: may a page dirtied by an <em>uncommitted</em> transaction be flushed? <strong>Force</strong>: must all of a transaction's pages be flushed <em>before</em> it commits? No-steal/force needs no undo/redo but cripples performance. A <strong>steal/no-force</strong> system — what everyone builds — is fastest but needs both undo (stolen uncommitted data may be on disk) and redo (committed data may not be).</p>" +
      "<h3>ARIES</h3>" +
      "<p>The canonical steal/no-force recovery algorithm runs three passes after a crash: <strong>analysis</strong> (scan the log to reconstruct dirty pages and in-flight — <em>loser</em> — transactions), <strong>redo</strong> (repeat history: reapply <em>all</em> logged changes, even losers', restoring the exact crash-moment state), and <strong>undo</strong> (roll losers back in reverse order, logging <em>compensation log records</em> so recovery itself survives a crash). Step through it above.</p>" },

    { title: "Concurrency Control: Serializability & Isolation",
      html: "<p>Transactions execute concurrently; the question is what interleavings are allowed. The gold standard is <strong>serializability</strong>: the outcome must equal <em>some</em> serial one-at-a-time execution. Weaker <strong>isolation levels</strong> trade correctness guarantees for performance, defined by which anomalies they admit:</p>" +
      "<ul><li><strong>Dirty read</strong> — seeing another transaction's uncommitted data.</li>" +
      "<li><strong>Non-repeatable (fuzzy) read</strong> — re-reading a row and getting a different committed value.</li>" +
      "<li><strong>Phantom read</strong> — re-running a range query and finding new rows.</li>" +
      "<li><strong>Lost update</strong> — two writers both read-modify-write; one overwrite silently vanishes.</li>" +
      "<li><strong>Write skew</strong> — two transactions each read a constraint and write disjoint rows; together they violate it.</li></ul>" +
      "<p>The classic ladder: <em>read uncommitted</em> (allows dirty reads) → <em>read committed</em> → <em>repeatable read</em> (still allows phantoms) → <em>serializable</em>. <strong>Snapshot isolation</strong> sits off-ladder: each transaction reads a consistent snapshot as of its start, dirty/fuzzy reads are impossible, but write skew still slips through.</p>" +
      "<div class='fig'><svg viewBox='0 0 760 245' xmlns='http://www.w3.org/2000/svg' font-family='Menlo,monospace'>" +
      "<text x='300' y='28' text-anchor='middle' fill='#7d8fb0' font-size='11'>dirty read</text>" +
      "<text x='405' y='28' text-anchor='middle' fill='#7d8fb0' font-size='11'>fuzzy read</text>" +
      "<text x='510' y='28' text-anchor='middle' fill='#7d8fb0' font-size='11'>phantom</text>" +
      "<text x='615' y='28' text-anchor='middle' fill='#7d8fb0' font-size='11'>write skew</text>" +
      "<text x='60' y='58' fill='#c9d6ea' font-size='12'>read uncommitted</text>" +
      "<text x='300' y='58' text-anchor='middle' fill='#ff5d73' font-size='12'>✗</text><text x='405' y='58' text-anchor='middle' fill='#ff5d73' font-size='12'>✗</text><text x='510' y='58' text-anchor='middle' fill='#ff5d73' font-size='12'>✗</text><text x='615' y='58' text-anchor='middle' fill='#ff5d73' font-size='12'>✗</text>" +
      "<line x1='60' y1='72' x2='700' y2='72' stroke='#1c2a45'/>" +
      "<text x='60' y='98' fill='#c9d6ea' font-size='12'>read committed</text>" +
      "<text x='300' y='98' text-anchor='middle' fill='#3ddc97' font-size='12'>✓</text><text x='405' y='98' text-anchor='middle' fill='#ff5d73' font-size='12'>✗</text><text x='510' y='98' text-anchor='middle' fill='#ff5d73' font-size='12'>✗</text><text x='615' y='98' text-anchor='middle' fill='#ff5d73' font-size='12'>✗</text>" +
      "<line x1='60' y1='112' x2='700' y2='112' stroke='#1c2a45'/>" +
      "<text x='60' y='138' fill='#c9d6ea' font-size='12'>repeatable read</text>" +
      "<text x='300' y='138' text-anchor='middle' fill='#3ddc97' font-size='12'>✓</text><text x='405' y='138' text-anchor='middle' fill='#3ddc97' font-size='12'>✓</text><text x='510' y='138' text-anchor='middle' fill='#ff5d73' font-size='12'>✗</text><text x='615' y='138' text-anchor='middle' fill='#ff5d73' font-size='12'>✗</text>" +
      "<line x1='60' y1='152' x2='700' y2='152' stroke='#1c2a45'/>" +
      "<text x='60' y='178' fill='#c9d6ea' font-size='12'>snapshot isolation</text>" +
      "<text x='300' y='178' text-anchor='middle' fill='#3ddc97' font-size='12'>✓</text><text x='405' y='178' text-anchor='middle' fill='#3ddc97' font-size='12'>✓</text><text x='510' y='178' text-anchor='middle' fill='#3ddc97' font-size='12'>✓</text><text x='615' y='178' text-anchor='middle' fill='#ffd166' font-size='12'>✗ !</text>" +
      "<line x1='60' y1='192' x2='700' y2='192' stroke='#1c2a45'/>" +
      "<text x='60' y='218' fill='#c9d6ea' font-size='12'>serializable</text>" +
      "<text x='300' y='218' text-anchor='middle' fill='#3ddc97' font-size='12'>✓</text><text x='405' y='218' text-anchor='middle' fill='#3ddc97' font-size='12'>✓</text><text x='510' y='218' text-anchor='middle' fill='#3ddc97' font-size='12'>✓</text><text x='615' y='218' text-anchor='middle' fill='#3ddc97' font-size='12'>✓</text>" +
      "</svg><div class='fig-cap'>✓ = anomaly prevented, ✗ = still possible. Each rung down the page buys one more guarantee and costs more coordination. The gold cell is the exam question and the production incident: snapshot isolation looks serializable in every everyday test, then write skew slips through under exactly the concurrent-constraint workload nobody tested.</div></div>" },

    { title: "Serializability Theory: Schedules and the Precedence Graph", viz: "schedgraph", vizTitle: "Test a schedule for conflict serializability",
      html: "<p>\"Equivalent to some serial execution\" sounds hand-wavy; the theory makes it testable. A <strong>schedule</strong> is the interleaved sequence of reads and writes from concurrent transactions. Two operations <strong>conflict</strong> when they touch the same item, come from different transactions, and at least one writes — giving three conflict flavors: read–write, write–read, and write–write. A schedule is <strong>conflict serializable</strong> if swapping non-conflicting operations can reorder it into a serial schedule.</p>" +
      "<p>The test is a one-liner: build the <strong>precedence graph</strong> — a node per transaction, an edge Ti → Tj whenever an operation of Ti conflicts with a <em>later</em> operation of Tj. <strong>Acyclic ⇒ conflict serializable</strong> (any topological order of the graph is an equivalent serial order); a cycle ⇒ not. Try it in the visualization: some interleavings that look wild are perfectly serializable, and some innocent-looking ones hide a cycle.</p>" +
      "<p>Two refinements complete the classical picture:</p>" +
      "<ul><li><strong>View serializability</strong> — a weaker, harder-to-test notion (equivalence of what each read <em>sees</em> and who writes last); it admits a few schedules conflict-serializability rejects (blind-write curiosities), but testing it is NP-complete, so real engines enforce the conflict flavor.</li>" +
      "<li><strong>Recoverability</strong> — serializable isn't enough if commits happen in the wrong order. A <strong>recoverable</strong> schedule commits readers only after the writers they read from; a <strong>cascadeless</strong> one reads only committed data (no cascading aborts, where one rollback unravels a chain of dependent transactions); <strong>strict</strong> schedules delay both reads and overwrites until the writer commits — what strict 2PL delivers, and why undo-based recovery (this chapter's ARIES) can use simple before-images.</li></ul>" +
      "<div class='callout'>Connect the dots: two-phase locking (below) guarantees conflict serializability precisely because lock conflicts force every pair of conflicting operations into a consistent order — the precedence graph of a 2PL schedule can never form a cycle.</div>" },

    { title: "Optimistic, Multiversion, and Pessimistic Control",
      html: "<p>Three philosophies enforce isolation:</p>" +
      "<p><strong>Optimistic (OCC)</strong> — let transactions run against private copies, then <em>validate</em> at commit: did anything I read change under me? If yes, abort and retry. Brilliant when conflicts are rare; wasteful when they aren't.</p>" +
      "<p><strong>Multiversion (MVCC)</strong> — never update in place; keep multiple timestamped versions of each record. Readers get a consistent snapshot without blocking writers, and vice versa. The engine of snapshot isolation in PostgreSQL, InnoDB, and most modern systems.</p>" +
      "<p>Under the hood, MVCC distinguishes <strong>committed</strong> from <strong>uncommitted</strong> versions: the last committed version of a value is the <em>current</em> one, and the transaction manager generally allows <em>at most one uncommitted version</em> of a value at a time (a second writer must wait or abort). Each version is tagged with the creating transaction's monotonically increasing ID or timestamp; a reader's snapshot is simply a visibility rule — \"show me the newest version whose creator committed before I started.\" Old versions become garbage the moment no active snapshot can see them — which is exactly what Postgres's VACUUM and InnoDB's purge threads clean up (Chapter 24 shows both). Whether reads may ever see uncommitted versions is precisely what the isolation level decides.</p>" +
      "<div class='fig'><svg viewBox='0 0 760 230' xmlns='http://www.w3.org/2000/svg' font-family='Menlo,monospace'>" +
      "<text x='70' y='30' fill='#c9d6ea' font-size='13'>key: balance — its version chain, newest last</text>" +
      "<rect x='70' y='55' width='180' height='58' rx='8' fill='#111a2e' stroke='#4f7cff' stroke-width='2'/>" +
      "<text x='160' y='79' text-anchor='middle' fill='#c9d6ea' font-size='12'>v1 = 100</text><text x='160' y='98' text-anchor='middle' fill='#7d8fb0' font-size='10.5'>tx 40 · committed</text>" +
      "<line x1='250' y1='84' x2='294' y2='84' stroke='#1c2a45' stroke-width='2'/><polygon points='300,84 288,78 288,90' fill='#1c2a45'/>" +
      "<rect x='300' y='55' width='180' height='58' rx='8' fill='#111a2e' stroke='#4f7cff' stroke-width='2'/>" +
      "<text x='390' y='79' text-anchor='middle' fill='#c9d6ea' font-size='12'>v2 = 70</text><text x='390' y='98' text-anchor='middle' fill='#7d8fb0' font-size='10.5'>tx 87 · committed (current)</text>" +
      "<line x1='480' y1='84' x2='524' y2='84' stroke='#1c2a45' stroke-width='2'/><polygon points='530,84 518,78 518,90' fill='#1c2a45'/>" +
      "<rect x='530' y='55' width='180' height='58' rx='8' fill='#111a2e' stroke='#ff5d73' stroke-width='2' stroke-dasharray='6 4'/>" +
      "<text x='620' y='79' text-anchor='middle' fill='#c9d6ea' font-size='12'>v3 = 55</text><text x='620' y='98' text-anchor='middle' fill='#ff5d73' font-size='10.5'>tx 99 · uncommitted</text>" +
      "<line x1='140' y1='160' x2='150' y2='120' stroke='#3ddc97' stroke-width='2'/><polygon points='152,114 143,122 155,126' fill='#3ddc97'/>" +
      "<text x='140' y='182' text-anchor='middle' fill='#3ddc97' font-size='11.5'>reader, snapshot @ tx 60</text>" +
      "<text x='140' y='198' text-anchor='middle' fill='#7d8fb0' font-size='10.5'>tx 87 hadn't committed yet</text>" +
      "<text x='140' y='213' text-anchor='middle' fill='#7d8fb0' font-size='10.5'>→ sees v1 = 100</text>" +
      "<line x1='390' y1='160' x2='390' y2='120' stroke='#3ddc97' stroke-width='2'/><polygon points='390,114 384,126 396,126' fill='#3ddc97'/>" +
      "<text x='390' y='182' text-anchor='middle' fill='#3ddc97' font-size='11.5'>reader, snapshot @ tx 95</text>" +
      "<text x='390' y='198' text-anchor='middle' fill='#7d8fb0' font-size='10.5'>newest committed before 95</text>" +
      "<text x='390' y='213' text-anchor='middle' fill='#7d8fb0' font-size='10.5'>→ sees v2 = 70</text>" +
      "<line x1='620' y1='160' x2='620' y2='120' stroke='#ff5d73' stroke-width='2'/><polygon points='620,114 614,126 626,126' fill='#ff5d73'/>" +
      "<text x='620' y='182' text-anchor='middle' fill='#ff5d73' font-size='11.5'>writer tx 99 only</text>" +
      "<text x='620' y='198' text-anchor='middle' fill='#7d8fb0' font-size='10.5'>invisible to every snapshot</text>" +
      "<text x='620' y='213' text-anchor='middle' fill='#7d8fb0' font-size='10.5'>until tx 99 commits</text>" +
      "</svg><div class='fig-cap'>One key, three versions, three observers — and nobody blocks anybody. Each reader applies the same visibility rule to a different snapshot ID and gets a different (but individually consistent) answer. When the oldest snapshot advances past tx 87, v1 becomes invisible to everyone — VACUUM's cue to reclaim it.</div></div>" +
      "<p><strong>Pessimistic (PCC)</strong> — assume conflict and prevent it up front, with timestamp ordering or, most commonly, locks. <strong>Two-phase locking (2PL)</strong>: a growing phase acquires locks, a shrinking phase (after the first release) may only release — this discipline is what guarantees serializability.</p>" +
      "<h3>Timestamp Ordering: Pessimism Without Locks</h3>" +
      "<p>The simplest lock-free pessimistic scheme: give every transaction a timestamp at start, and demand that the execution be equivalent to running them in timestamp order. The manager tracks, per value, <code>max_read_timestamp</code> and <code>max_write_timestamp</code>. Then:</p>" +
      "<ul><li>A <strong>read</strong> with a timestamp below <code>max_write_timestamp</code> aborts its transaction — a newer value already exists; letting the old transaction read would violate the order.</li>" +
      "<li>A <strong>write</strong> below <code>max_read_timestamp</code> aborts — someone newer already read the value this write would change retroactively.</li>" +
      "<li>A <strong>write</strong> below <code>max_write_timestamp</code> (but above the read mark) is simply <em>skipped</em>: a newer value already overwrote whatever this write would have produced. Dropping the stale write harmlessly is the <strong>Thomas Write Rule</strong>.</li></ul>" +
      "<p>Aborted transactions restart with a <em>fresh</em> timestamp — retrying with the old one guarantees the same abort.</p>" +
      "<h3>Deadlocks</h3>" +
      "<p>Locks bring deadlocks: T1 holds A wants B; T2 holds B wants A. Detection builds a <em>waits-for graph</em> and aborts a victim on a cycle; avoidance refuses to let cycles form. The classic avoidance pair uses transaction timestamps as priority (older = higher priority), applied when a transaction requests a lock another one holds:</p>" +
      "<ul><li><strong>Wait-die</strong> — an <em>older</em> requester may wait for a younger holder; a <em>younger</em> requester \"dies\" (aborts and restarts) instead of waiting for an older one. Transactions only ever wait on younger ones.</li>" +
      "<li><strong>Wound-wait</strong> — an <em>older</em> requester \"wounds\" the younger holder (aborts it and takes the lock); a <em>younger</em> requester is allowed to wait for an older one. Transactions only ever wait on older ones.</li></ul>" +
      "<p>Both make the waits-for graph acyclic by construction — all waiting edges point one way in age — trading some unnecessary aborts for the guarantee that no cycle can ever assemble. Note the division of labor: transaction <em>locks</em> get this machinery; <em>latches</em> (below) get none — the engine's own code is simply written so latch deadlocks cannot happen.</p>" },

    { title: "Locks, Latches, and Latch Crabbing",
      html: "<p>Two words that sound alike and aren't:</p>" +
      "<ul><li><strong>Locks</strong> guard <em>logical</em> content — keys, ranges — for the duration of a transaction. Heavyweight, deadlock-managed.</li>" +
      "<li><strong>Latches</strong> guard <em>physical</em> structures — a page being read while another thread splits it — for the duration of one operation. Usually reader-writer: many concurrent readers <em>or</em> one writer per page.</li></ul>" +
      "<h3>Readers-Writer Locks</h3>" +
      "<p>The workhorse latch is the <strong>readers-writer (RW) lock</strong>, born from one observation: reads don't conflict with reads. The compatibility table has exactly one 'yes' cell — <em>shared + shared</em>. A reader acquires <em>shared</em> mode and coexists with any number of other readers; a writer needs <em>exclusive</em> mode and coexists with nobody. So a page under three readers makes an arriving writer wait; a page under one writer makes everyone wait. Since real workloads read far more pages than they modify, letting the read crowd through concurrently is a massive throughput win over a plain mutex.</p>" +
      "<p>Implementation has its own craft: waiting threads can <em>block</em> (deschedule until woken — right for long waits) or <em>busy-wait</em> (spin briefly — right when the holder will finish in nanoseconds, since descheduling costs more than the wait). Queue-based spinlocks refine spinning with compare-and-swap: each waiter appends itself to a queue and spins on a flag that only its <em>predecessor</em> updates, so a lock release touches one waiter's cache line instead of stampeding all of them.</p>" +
      "<h3>Lock Granularity & Intention Locks</h3>" +
      "<p>Locks come in sizes: database, table, page, row. Fine granularity maximizes concurrency but multiplies bookkeeping; coarse is cheap but blocks everyone. Real engines mix them — and mixing creates a puzzle: how does a transaction wanting a whole-table lock know no one holds a lock on some row inside it, without scanning every row lock? <strong>Intention locks</strong> solve it: before locking a row, a transaction takes an <em>intention</em> lock (IS or IX) on the table above it — a flag saying \"something finer-grained is locked below.\" The table-level request then conflicts (or not) with the intention flags in O(1). <strong>Lock escalation</strong> runs the other way: thousands of row locks from one transaction may be traded for a single table lock to cap overhead.</p>" +
      "<h3>Latch Crabbing</h3>" +
      "<p>Naively you'd latch the whole root-to-leaf path — making the root a global bottleneck. <strong>Crabbing</strong> holds at most a parent and child at once: latch the child; if it's \"safe\" (won't split or merge under this operation), release the parent and move on, like a crab shuffling hand over hand. Contention stays local.</p>" +
      "<div class='fig'><svg viewBox='0 0 760 240' xmlns='http://www.w3.org/2000/svg' font-family='Menlo,monospace'>" +
      "<text x='140' y='24' text-anchor='middle' fill='#7d8fb0' font-size='11.5'>step ① latch root</text>" +
      "<circle cx='140' cy='60' r='20' fill='#111a2e' stroke='#ffd166' stroke-width='3'/><text x='140' y='65' text-anchor='middle' fill='#ffd166' font-size='11'>R</text>" +
      "<line x1='128' y1='76' x2='105' y2='108' stroke='#1c2a45' stroke-width='2'/><line x1='152' y1='76' x2='175' y2='108' stroke='#1c2a45' stroke-width='2'/>" +
      "<circle cx='100' cy='125' r='18' fill='#111a2e' stroke='#1c2a45' stroke-width='2'/><text x='100' y='130' text-anchor='middle' fill='#7d8fb0' font-size='11'>I</text>" +
      "<circle cx='180' cy='125' r='18' fill='#111a2e' stroke='#1c2a45' stroke-width='2'/><text x='180' y='130' text-anchor='middle' fill='#7d8fb0' font-size='11'>I</text>" +
      "<circle cx='100' cy='190' r='16' fill='#111a2e' stroke='#1c2a45' stroke-width='2'/><text x='100' y='195' text-anchor='middle' fill='#7d8fb0' font-size='10'>L</text>" +
      "<text x='390' y='24' text-anchor='middle' fill='#7d8fb0' font-size='11.5'>step ② latch child — safe? release root</text>" +
      "<circle cx='390' cy='60' r='20' fill='#111a2e' stroke='#3ddc97' stroke-width='2' stroke-dasharray='5 4'/><text x='390' y='65' text-anchor='middle' fill='#3ddc97' font-size='11'>R</text>" +
      "<text x='444' y='52' fill='#3ddc97' font-size='10'>released ✓</text>" +
      "<line x1='378' y1='76' x2='355' y2='108' stroke='#1c2a45' stroke-width='2'/><line x1='402' y1='76' x2='425' y2='108' stroke='#1c2a45' stroke-width='2'/>" +
      "<circle cx='350' cy='125' r='18' fill='#111a2e' stroke='#ffd166' stroke-width='3'/><text x='350' y='130' text-anchor='middle' fill='#ffd166' font-size='11'>I</text>" +
      "<circle cx='430' cy='125' r='18' fill='#111a2e' stroke='#1c2a45' stroke-width='2'/><text x='430' y='130' text-anchor='middle' fill='#7d8fb0' font-size='11'>I</text>" +
      "<circle cx='350' cy='190' r='16' fill='#111a2e' stroke='#1c2a45' stroke-width='2'/><text x='350' y='195' text-anchor='middle' fill='#7d8fb0' font-size='10'>L</text>" +
      "<text x='640' y='24' text-anchor='middle' fill='#7d8fb0' font-size='11.5'>step ③ latch leaf, release parent</text>" +
      "<circle cx='640' cy='60' r='20' fill='#111a2e' stroke='#1c2a45' stroke-width='2'/><text x='640' y='65' text-anchor='middle' fill='#7d8fb0' font-size='11'>R</text>" +
      "<text x='688' y='52' fill='#2de2ff' font-size='10'>free for others</text>" +
      "<line x1='628' y1='76' x2='605' y2='108' stroke='#1c2a45' stroke-width='2'/><line x1='652' y1='76' x2='675' y2='108' stroke='#1c2a45' stroke-width='2'/>" +
      "<circle cx='600' cy='125' r='18' fill='#111a2e' stroke='#3ddc97' stroke-width='2' stroke-dasharray='5 4'/><text x='600' y='130' text-anchor='middle' fill='#3ddc97' font-size='11'>I</text>" +
      "<circle cx='680' cy='125' r='18' fill='#111a2e' stroke='#1c2a45' stroke-width='2'/><text x='680' y='130' text-anchor='middle' fill='#7d8fb0' font-size='11'>I</text>" +
      "<circle cx='600' cy='190' r='16' fill='#111a2e' stroke='#ffd166' stroke-width='3'/><text x='600' y='195' text-anchor='middle' fill='#ffd166' font-size='10'>L</text>" +
      "<text x='378' y='228' text-anchor='middle' fill='#7d8fb0' font-size='11.5'>gold ring = latched · at most two latches held, and the root is free after one hop</text>" +
      "</svg><div class='fig-cap'>Hand-over-hand descent. The moment the child is latched and proven 'safe' (it won't split/merge under this operation), the ancestor's latch drops — so the root, which every single operation must pass through, is held for nanoseconds instead of the whole descent.</div></div>" +
      "<h3>Blink-Trees</h3>" +
      "<p>Blink-Trees go further using the high keys and sibling links from Chapter 7: a split installs the new sibling <em>before</em> the parent knows about it (a tolerated \"half-split\" state). A reader racing the split just detects the high-key overflow and hops right. Fewer latches, no deadlocks between readers and splitters.</p>" }
  ],
  terms: [
    { t: "page cache / buffer pool", d: "Fixed-size in-memory pool of page frames; the traffic filter between the tree and the disk." },
    { t: "dirty page", d: "A cached page modified in memory but not yet flushed to disk." },
    { t: "pinning", d: "Marking a cached page in-use so eviction can't recycle it mid-operation." },
    { t: "write-ahead log", d: "Append-only log where changes are made durable before pages are flushed or commits acknowledged." },
    { t: "steal / no-force", d: "The high-performance flush policy pair that necessitates both undo and redo at recovery." },
    { t: "ARIES", d: "Canonical recovery algorithm: analysis, redo (repeat history), undo (roll back losers with CLRs)." },
    { t: "snapshot isolation", d: "Each transaction reads a consistent snapshot as of its start; prevents most anomalies but not write skew." },
    { t: "conflict serializability", d: "Reorderable into a serial schedule by swapping non-conflicting operations — tested via the precedence graph." },
    { t: "precedence graph", d: "Node per transaction, edge per conflict ordering; acyclic ⇔ conflict serializable." },
    { t: "cascadeless schedule", d: "Transactions read only committed data, so one abort can't unravel others." },
    { t: "intention lock", d: "A table-level IS/IX flag announcing finer-grained locks below — multi-granularity locking's O(1) trick." },
    { t: "two-phase locking", d: "Grow-then-shrink lock discipline that guarantees serializability under pessimistic control." },
    { t: "timestamp ordering", d: "Lock-free pessimism: per-value max read/write timestamps abort any operation that would violate transaction-start order." },
    { t: "Thomas Write Rule", d: "A write older than the value's latest write is silently skipped — it would have been overwritten anyway." },
    { t: "wait-die / wound-wait", d: "Deadlock avoidance via age priority: all waiting edges point one way in timestamp order, so cycles can't form." },
    { t: "readers-writer lock", d: "Shared mode for readers (compatible with each other), exclusive mode for writers — the standard latch." },
    { t: "MVCC", d: "Multiversion concurrency control: readers see old versions while writers create new ones — nobody blocks." },
    { t: "latch crabbing", d: "Hand-over-hand page latching down the tree, releasing ancestors as soon as a child is proven safe." }
  ],
  quiz: [
    { type: "mc", q: "A database acknowledged a commit, then lost power before flushing the dirty pages. Why is the data safe?",
      opts: ["Dirty pages are stored in the CPU cache", "The WAL record was forced to disk before the acknowledgment; redo replays it", "Commits block until all pages flush", "The OS journal restores the pages"], a: 1,
      why: "Write-ahead means the log — cheap sequential I/O — is durable first; recovery's redo pass rebuilds the page changes from it." },
    { type: "mc", q: "Why does ARIES redo even the changes of transactions it's about to undo?",
      opts: ["It's a bug tolerated for legacy reasons", "Repeating history restores the exact pre-crash state, making undo simple and correct", "Redo is optional", "To warm up the page cache"], a: 1,
      why: "\"Repeat history\" first, then roll back losers with compensation records — this handles every steal/no-force corner case, including crashes during recovery." },
    { type: "mc", q: "Snapshot isolation is NOT full serializability because it still admits…",
      opts: ["dirty reads", "non-repeatable reads", "write skew", "torn pages"], a: 2,
      why: "Two transactions can each read overlapping data, write disjoint rows, and jointly violate a constraint neither saw broken — the classic on-call doctors example." },
    { type: "mc", q: "What distinguishes a latch from a lock?",
      opts: ["Latches are slower but fairer", "Latches guard physical page integrity for one operation; locks guard logical data for a whole transaction", "Locks are only used by MVCC", "Nothing — they're synonyms"], a: 1,
      why: "A latch stops a reader from seeing a half-split page; a lock stops another transaction from changing a row you depend on." },
    { type: "order", q: "Order ARIES's recovery passes:",
      items: ["Analysis — find dirty pages and loser transactions", "Redo — repeat all history from the log", "Undo — roll back losers, logging CLRs"],
      why: "Analyze what the world looked like, restore it exactly, then erase the uncommitted parts." },
    { type: "mc", q: "A schedule's precedence graph contains the cycle T1 → T2 → T1. What do we conclude?",
      opts: ["The schedule deadlocked", "The schedule is NOT conflict serializable — no serial order satisfies both dependencies", "T1 must abort", "The schedule is view serializable"], a: 1,
      why: "A cycle means T1 must come both before and after T2 in any equivalent serial order — impossible. Acyclicity is the exact test." },
    { type: "mc", q: "Before locking one row for writing, InnoDB takes an IX lock on the table. Why?",
      opts: ["To block all other writers immediately", "So a later whole-table lock request can detect finer-grained locks below in O(1), without scanning row locks", "To escalate the lock automatically", "IX locks are required by the SQL standard"], a: 1,
      why: "Intention locks make multi-granularity locking cheap: table-level requests test against intention flags instead of enumerating every row lock." },
    { type: "mc", q: "Under timestamp ordering, a write arrives whose timestamp is older than the value's max_write_timestamp but newer than its max_read_timestamp. What happens?",
      opts: ["The transaction aborts", "The write is silently skipped — a newer value already superseded it (Thomas Write Rule)", "The write overwrites the newer value", "The system deadlocks"], a: 1,
      why: "In the equivalent serial order, this write would have been immediately overwritten by the newer one anyway — dropping it changes nothing observable." },
    { type: "mc", q: "Under wound-wait, a YOUNG transaction requests a lock held by an OLDER one. What happens?",
      opts: ["The older transaction is aborted", "The young transaction waits — waiting for older transactions is always allowed in wound-wait", "The young transaction is instantly aborted", "Both restart with new timestamps"], a: 1,
      why: "Wound-wait only aborts younger holders when an older transaction is the requester; the reverse direction (young waits on old) is safe because all waiting edges point the same way in age — no cycles." }
  ]
});

/* ======================= CHAPTER 6 ======================= */
CHAPTERS.push({
  num: 9, part: 1, title: "B-Tree Variants",
  blurb: "The basic B-Tree has been reinvented many times to fit new hardware and new demands, and this chapter tours the most important variations. You'll see trees that never overwrite a page (which makes crashes and simultaneous readers much easier to handle), trees that batch up changes before applying them, and designs built specifically for flash storage and many-core CPUs. Think of it as a guided tour of how one good idea keeps adapting.",
  sections: [
    { title: "Copy-on-Write B-Trees", viz: "cow", vizTitle: "Path copying and the atomic root flip",
      html: "<p>Instead of updating pages in place, a <strong>copy-on-write</strong> tree treats every page as immutable: to change a leaf, write a modified <em>copy</em> of it, then a copy of its parent pointing at the new leaf, and so on up — finishing with one atomic swap of the root pointer.</p>" +
      "<p>The payoff is structural: readers and the single writer never conflict, because readers keep traversing the <em>old</em> root while the new tree is assembled beside it. Crash recovery is nearly free — if the root pointer never flipped, the old tree is untouched and perfectly consistent; no WAL is required for integrity. The costs: every logical write fans out into a whole path of page writes, and abandoned old pages need garbage collection.</p>" +
      "<h3>Implementing Copy-on-Write: LMDB</h3>" +
      "<p>LMDB (the engine under OpenLDAP) is the purist's example: a memory-mapped, copy-on-write B-Tree with <em>no</em> page cache and <em>no</em> log of its own, keeping the last two roots around (single writer, readers never block), and letting the OS page cache do the buffering.</p>" },

    { title: "Abstracting Node Updates & Lazy B-Trees",
      html: "<p>An implementation question hides here: does an in-memory node have to be the raw page bytes? Options range from operating directly on cached page buffers, to wrapping them, to converting pages into pointer-rich in-memory objects (\"materialized\" nodes) that get serialized back on flush. Memory-mapped files delegate the sync entirely to the OS — simple, but you surrender control over <em>when</em> bytes hit disk, which recovery correctness may need.</p>" +
      "<h3>Lazy B-Trees: WiredTiger</h3>" +
      "<p><strong>Lazy</strong> variants buffer updates before touching pages. WiredTiger (MongoDB's engine) keeps, per page, a clean on-disk image plus an in-memory <em>update list</em> of recent modifications; readers merge the two on the fly, and reconciliation rewrites the page only occasionally. Random small writes become batched page rewrites.</p>" +
      "<div class='fig'><svg viewBox='0 0 760 220' xmlns='http://www.w3.org/2000/svg' font-family='Menlo,monospace'>" +
      "<rect x='60' y='45' width='210' height='70' rx='8' fill='#111a2e' stroke='#4f7cff' stroke-width='2'/>" +
      "<text x='165' y='70' text-anchor='middle' fill='#4f7cff' font-size='11'>clean page image</text>" +
      "<text x='165' y='90' text-anchor='middle' fill='#7d8fb0' font-size='9.5'>as last written to disk —</text>" +
      "<text x='165' y='104' text-anchor='middle' fill='#7d8fb0' font-size='9.5'>never modified in memory</text>" +
      "<rect x='330' y='30' width='105' height='34' rx='6' fill='#111a2e' stroke='#2de2ff' stroke-width='2'/><text x='382' y='51' text-anchor='middle' fill='#2de2ff' font-size='10'>Δ set k3=9</text>" +
      "<rect x='450' y='30' width='105' height='34' rx='6' fill='#111a2e' stroke='#2de2ff' stroke-width='2'/><text x='502' y='51' text-anchor='middle' fill='#2de2ff' font-size='10'>Δ del k7</text>" +
      "<rect x='570' y='30' width='105' height='34' rx='6' fill='#111a2e' stroke='#2de2ff' stroke-width='2'/><text x='622' y='51' text-anchor='middle' fill='#2de2ff' font-size='10'>Δ set k1=4</text>" +
      "<text x='502' y='18' text-anchor='middle' fill='#2de2ff' font-size='10.5'>in-memory update list — writes land here, page untouched</text>" +
      "<line x1='165' y1='115' x2='330' y2='160' stroke='#3ddc97' stroke-width='2'/><polygon points='335,162 323,161 328,151' fill='#3ddc97'/>" +
      "<line x1='502' y1='64' x2='400' y2='155' stroke='#3ddc97' stroke-width='2'/><polygon points='396,159 400,148 409,155' fill='#3ddc97'/>" +
      "<rect x='340' y='160' width='170' height='40' rx='7' fill='#111a2e' stroke='#3ddc97' stroke-width='2.5'/>" +
      "<text x='425' y='185' text-anchor='middle' fill='#3ddc97' font-size='10.5'>reader's merged view</text>" +
      "<line x1='510' y1='180' x2='585' y2='180' stroke='#ffd166' stroke-width='2' stroke-dasharray='6 4'/><polygon points='591,180 579,174 579,186' fill='#ffd166'/>" +
      "<text x='598' y='172' fill='#ffd166' font-size='10'>reconciliation:</text>" +
      "<text x='598' y='186' fill='#7d8fb0' font-size='9.5'>occasionally fold list + image</text>" +
      "<text x='598' y='200' fill='#7d8fb0' font-size='9.5'>into a NEW clean page</text>" +
      "</svg><div class='fig-cap'>WiredTiger's laziness: the on-disk page image stays pristine while updates pile into a per-page list; every reader merges the two on the fly. Reconciliation amortizes dozens of tiny random writes into one batched page rewrite — the buffering dial turned up without going full LSM.</div></div>" +
      "<h3>Lazy-Adaptive Tree</h3>" +
      "<p>The LA-Tree generalizes: attach <em>update buffers</em> to subtrees at several levels; operations land in the top buffer and cascade downward in batches only when buffers overflow. Lookups must consult buffers along the path, trading read work for dramatically cheaper writes.</p>" },

    { title: "FD-Trees: Making Writes Sequential",
      html: "<p>The <strong>Flash Disk Tree</strong> attacks flash's hatred of small random writes. Structure: one small mutable B-Tree (the head) on top of a hierarchy of immutable sorted runs of geometrically increasing size (<strong>logarithmic runs</strong>). Writes touch only the head tree; when it fills, its contents merge down into the runs — every disk write is a big sequential one.</p>" +
      "<h3>Fractional Cascading</h3>" +
      "<p>Searching many sorted runs would multiply lookup cost, so FD-Trees thread them together with <strong>fractional cascading</strong>: each higher level embeds pointers (bridges) into every block of the level below, so after searching the smallest run, each next run is entered near the right position instead of from scratch. One real binary search, then guided hops.</p>" +
      "<div class='fig'><svg viewBox='0 0 760 235' xmlns='http://www.w3.org/2000/svg' font-family='Menlo,monospace'>" +
      "<path d='M 380 22 L 340 62 L 420 62 Z' fill='#111a2e' stroke='#ffd166' stroke-width='2'/>" +
      "<text x='445' y='48' fill='#ffd166' font-size='11.5'>head B-Tree — small, mutable, absorbs all writes</text>" +
      "<line x1='380' y1='62' x2='380' y2='86' stroke='#ff5d73' stroke-width='2'/><polygon points='380,92 374,80 386,80' fill='#ff5d73'/>" +
      "<text x='398' y='82' fill='#ff5d73' font-size='10.5'>overflow merges down</text>" +
      "<rect x='330' y='95' width='100' height='26' rx='5' fill='#111a2e' stroke='#2de2ff' stroke-width='2'/><text x='310' y='112' text-anchor='end' fill='#7d8fb0' font-size='11'>L1 · immutable run</text>" +
      "<rect x='280' y='140' width='200' height='26' rx='5' fill='#111a2e' stroke='#2de2ff' stroke-width='2'/><text x='260' y='157' text-anchor='end' fill='#7d8fb0' font-size='11'>L2 · 2× larger</text>" +
      "<rect x='180' y='185' width='400' height='26' rx='5' fill='#111a2e' stroke='#2de2ff' stroke-width='2'/><text x='160' y='202' text-anchor='end' fill='#7d8fb0' font-size='11'>L3 · 4× larger</text>" +
      "<line x1='360' y1='121' x2='340' y2='136' stroke='#3ddc97' stroke-width='2' stroke-dasharray='4 3'/><line x1='400' y1='121' x2='420' y2='136' stroke='#3ddc97' stroke-width='2' stroke-dasharray='4 3'/>" +
      "<line x1='320' y1='166' x2='260' y2='181' stroke='#3ddc97' stroke-width='2' stroke-dasharray='4 3'/><line x1='440' y1='166' x2='500' y2='181' stroke='#3ddc97' stroke-width='2' stroke-dasharray='4 3'/>" +
      "<text x='598' y='157' fill='#3ddc97' font-size='10.5'>bridges: enter the next run</text>" +
      "<text x='598' y='172' fill='#3ddc97' font-size='10.5'>near the right spot —</text>" +
      "<text x='598' y='187' fill='#3ddc97' font-size='10.5'>no fresh binary search</text>" +
      "<text x='380' y='229' text-anchor='middle' fill='#7d8fb0' font-size='11.5'>every disk write is a big sequential merge — flash's favorite pattern</text>" +
      "</svg><div class='fig-cap'>The FD-Tree silhouette: one small mutable head, then immutable sorted runs doubling in size. Writes only ever touch the head; searches binary-search it once, then ride the green bridge pointers down through the runs instead of restarting at each level.</div></div>" +
      "<div class='callout'>Sound familiar? Immutable sorted runs + merges = the same instincts as LSM-Trees (next chapter), grown from the B-Tree side of the family.</div>" },

    { title: "Bw-Trees: The Latch-Free B-Tree",
      html: "<p>The <strong>Buzzword-Tree</strong> throws three modern constraints at the B-Tree at once: no latches, no in-place writes, flash-friendly I/O.</p>" +
      "<h3>Update Chains</h3>" +
      "<p>Each logical node is a <em>base page</em> plus a chain of <strong>delta records</strong> — each update just prepends a delta describing the change. Readers reconstruct the node by folding the chain over the base.</p>" +
      "<h3>Taming Concurrency with Compare-and-Swap</h3>" +
      "<p>Nodes are reached only through a <strong>mapping table</strong> of logical IDs → memory addresses. Installing a delta is a single <strong>compare-and-swap</strong> on that table entry: if another thread won the race, retry on the fresh state. No thread ever blocks another — latch-free.</p>" +
      "<div class='fig'><svg viewBox='0 0 760 235' xmlns='http://www.w3.org/2000/svg' font-family='Menlo,monospace'>" +
      "<rect x='50' y='45' width='170' height='140' rx='10' fill='#0c1220' stroke='#4f7cff' stroke-width='2'/>" +
      "<text x='135' y='34' text-anchor='middle' fill='#4f7cff' font-size='12'>mapping table</text>" +
      "<rect x='66' y='60' width='138' height='28' rx='5' fill='#111a2e' stroke='#1c2a45'/><text x='135' y='78' text-anchor='middle' fill='#7d8fb0' font-size='11'>node 16 → addr</text>" +
      "<rect x='66' y='96' width='138' height='28' rx='5' fill='#111a2e' stroke='#ffd166' stroke-width='2'/><text x='135' y='114' text-anchor='middle' fill='#ffd166' font-size='11'>node 17 → ptr ●</text>" +
      "<rect x='66' y='132' width='138' height='28' rx='5' fill='#111a2e' stroke='#1c2a45'/><text x='135' y='150' text-anchor='middle' fill='#7d8fb0' font-size='11'>node 18 → addr</text>" +
      "<rect x='560' y='96' width='150' height='50' rx='8' fill='#111a2e' stroke='#4f7cff' stroke-width='2'/>" +
      "<text x='635' y='117' text-anchor='middle' fill='#c9d6ea' font-size='11.5'>base page 17</text><text x='635' y='134' text-anchor='middle' fill='#7d8fb0' font-size='10'>consolidated state</text>" +
      "<rect x='400' y='96' width='120' height='50' rx='8' fill='#111a2e' stroke='#2de2ff' stroke-width='2'/>" +
      "<text x='460' y='117' text-anchor='middle' fill='#c9d6ea' font-size='11.5'>Δ update k2</text><text x='460' y='134' text-anchor='middle' fill='#7d8fb0' font-size='10'>older delta</text>" +
      "<line x1='520' y1='121' x2='554' y2='121' stroke='#1c2a45' stroke-width='2'/><polygon points='560,121 548,115 548,127' fill='#1c2a45'/>" +
      "<rect x='240' y='96' width='120' height='50' rx='8' fill='#111a2e' stroke='#3ddc97' stroke-width='2.5'/>" +
      "<text x='300' y='117' text-anchor='middle' fill='#3ddc97' font-size='11.5'>Δ insert k9</text><text x='300' y='134' text-anchor='middle' fill='#7d8fb0' font-size='10'>NEW — chain head</text>" +
      "<line x1='360' y1='121' x2='394' y2='121' stroke='#1c2a45' stroke-width='2'/><polygon points='400,121 388,115 388,127' fill='#1c2a45'/>" +
      "<path d='M 204 110 C 220 106 226 106 234 112' fill='none' stroke='#3ddc97' stroke-width='2.5'/><polygon points='239,116 227,114 233,105' fill='#3ddc97'/>" +
      "<text x='222' y='90' text-anchor='middle' fill='#3ddc97' font-size='10.5'>CAS ✓</text>" +
      "<path d='M 204 122 C 260 160 340 165 396 140' fill='none' stroke='#ff5d73' stroke-width='2' stroke-dasharray='6 4'/>" +
      "<text x='300' y='185' text-anchor='middle' fill='#ff5d73' font-size='10.5'>old pointer (replaced atomically)</text>" +
      "<text x='380' y='218' text-anchor='middle' fill='#7d8fb0' font-size='11.5'>readers fold the chain right-to-left: base → Δ update → Δ insert = current node</text>" +
      "</svg><div class='fig-cap'>A Bw-Tree logical node is whatever the mapping-table pointer says it is. An update prepends a delta and CASes the pointer (green); a thread that loses the race simply retries against the new chain head. When chains grow long, consolidation folds them into a fresh base page — installed by the same CAS.</div></div>" +
      "<h3>Structural Modification Operations</h3>" +
      "<p>Splits and merges (<strong>SMOs</strong>) decompose into a sequence of individually-atomic CAS steps, each leaving the tree traversable (much like Blink-Tree half-splits): install a split delta, then tell the parent, each step helpable by any thread that stumbles on the intermediate state.</p>" +
      "<h3>Consolidation and Garbage Collection</h3>" +
      "<p>Long delta chains slow reads, so chains past a threshold are <strong>consolidated</strong> — folded into a new compact base page swapped in via CAS. Old chains are reclaimed only after all readers that might see them finish (epoch-based reclamation).</p>" },

    { title: "Cache-Oblivious B-Trees",
      html: "<p>Ordinary B-Trees are <em>cache-aware</em>: someone hardcoded the page size. A <strong>cache-oblivious</strong> structure is optimal for <em>any</em> two-level memory hierarchy without knowing the block size — the same code is efficient between RAM and disk, or L1 and L2 cache.</p>" +
      "<h3>van Emde Boas Layout</h3>" +
      "<p>The trick is layout: split a binary tree at half its height into a top subtree and many bottom subtrees, lay each out contiguously, and recurse inside each part. Any traversal path then touches runs of nearby memory at every scale — no block size ever appears in the code, yet block transfers stay asymptotically optimal. Combined with a <em>packed array</em> for leaf storage (gaps left for insertions), this yields a dynamic cache-oblivious B-Tree — more a beautiful idea than a production standard, but a real lens on why layout is everything.</p>" }
  ],
  terms: [
    { t: "copy-on-write", d: "Never overwrite: write new copies up the path, then atomically flip the root pointer." },
    { t: "LMDB", d: "A memory-mapped copy-on-write B-Tree engine with no WAL and no application-level cache." },
    { t: "update buffer", d: "Per-node/subtree staging area for writes, cascaded downward in batches (Lazy/LA-Trees, WiredTiger)." },
    { t: "fractional cascading", d: "Bridging pointers between sorted levels so one search guides all subsequent levels." },
    { t: "delta record", d: "Bw-Tree's unit of change: prepended to a node's chain instead of modifying the page." },
    { t: "mapping table", d: "Bw-Tree's logical-ID → address table; the single word a CAS swaps to publish any update." },
    { t: "compare-and-swap", d: "Atomic CPU instruction: replace a value only if it still equals what you expect — the engine of latch-free structures." },
    { t: "van Emde Boas layout", d: "Recursive tree layout giving locality at every scale, enabling cache-oblivious performance." }
  ],
  quiz: [
    { type: "mc", q: "How does a copy-on-write B-Tree survive a crash without a WAL?",
      opts: ["It replays the OS journal", "An unflipped root pointer means the old, fully consistent tree is still the tree", "It cannot — LMDB uses a hidden log", "Pages are checksummed"], a: 1,
      why: "All new pages are invisible until the single atomic root flip; a crash before the flip simply abandons them." },
    { type: "mc", q: "In a Bw-Tree, how does an update get published without latches?",
      opts: ["A global writer lock, briefly held", "A delta record is prepended and a CAS swings the mapping-table pointer to it", "The page is rewritten under an OS mutex", "Updates queue on a background thread"], a: 1,
      why: "The mapping table gives every node exactly one word to CAS; losers of the race simply retry against the new chain head." },
    { type: "mc", q: "What problem does fractional cascading solve in an FD-Tree?",
      opts: ["Flash wear leveling", "Searching each of many sorted runs from scratch", "Delta chain growth", "Root contention"], a: 1,
      why: "Bridges from each run into the next mean one full binary search total, then guided entry into every lower run." },
    { type: "blank", q: "A structure that performs optimally without knowing the memory hierarchy's block size is called cache-________.",
      a: ["oblivious"], why: "Via the van Emde Boas layout, locality holds at every scale, so no block-size parameter is needed." },
    { type: "order", q: "Order the steps of a copy-on-write update:",
      items: ["Write a modified copy of the target leaf", "Write copies of ancestors pointing at the new pages", "Atomically flip the root pointer", "Garbage-collect the abandoned old pages"],
      why: "Build the new path beside the old tree; publication is the single pointer flip at the end." }
  ]
});

/* ======================= CHAPTER 7 ======================= */
CHAPTERS.push({
  num: 10, part: 1, title: "Log-Structured Storage",
  blurb: "There's a whole other family of storage engines that works the opposite way to the B-Tree, and it powers databases like Cassandra and RocksDB. Instead of editing data in place, it collects writes in memory, dumps them to disk as sorted files that never change, and tidies up in the background. You'll learn how this LSM-Tree design works, how a small structure called a Bloom filter lets it skip pointless disk reads, and the basic trade-off between fast reads, fast writes, and small storage that no design can fully escape.",
  sections: [
    { title: "LSM Trees", viz: "lsm", vizTitle: "Memtable → flush → SSTables → compaction",
      html: "<p>The <strong>Log-Structured Merge-Tree</strong> is the immutable counterpart of the B-Tree, powering Cassandra, RocksDB, LevelDB, and friends. Writes never touch disk structures directly:</p>" +
      "<ul><li>Writes go to an in-memory sorted <strong>memtable</strong> (guarded by a WAL for durability).</li>" +
      "<li>When the memtable fills, it's <strong>flushed</strong> — written out sequentially as an immutable sorted run. In the original formulation this is a <em>two-component</em> tree (one memory, one disk component, merged wholesale); practical systems are <em>multicomponent</em>: each flush just adds another run.</li>" +
      "<li>Background <strong>compaction</strong> merge-sorts runs together, discarding shadowed versions.</li></ul>" +
      "<h3>Updates and Deletes</h3>" +
      "<p>You can't modify immutable files, so updates simply write a newer version, and deletes write a <strong>tombstone</strong> — a marker that shadows older values until compaction physically drops both. Range deletes get analogous <em>predicate deletes</em> markers.</p>" +
      "<h3>Lookups, Merge-Iteration & Reconciliation</h3>" +
      "<p>A key may live in the memtable <em>and</em> several runs, so reads consult multiple sources through a <strong>merge-iterator</strong>: cursors over each sorted source, always yielding the globally smallest key next (a priority queue does the bookkeeping — the same machinery drives compaction). When the same key surfaces from several sources, <strong>reconciliation</strong> picks the winner — the version with the latest timestamp — and tombstones beat the values they shadow.</p>" +
      "<h3>Maintenance: Compaction Styles</h3>" +
      "<ul><li><strong>Leveled compaction</strong> (LevelDB/RocksDB): level 0 holds raw flushed runs which may overlap; levels 1+ are partitioned into non-overlapping key-range tables of geometrically growing total size. Overflowing levels merge downward. Bounds how many tables a read can touch.</li>" +
      "<li><strong>Size-tiered compaction</strong>: group runs by size; merge similar-sized runs into a bigger tier. Cheaper writes, but reads may cross more overlapping runs.</li></ul>" +
      "<p>Numbers make the leveled geometry click. LevelDB's defaults: L1 targets ~10&nbsp;MB, and each level below is <strong>10×</strong> larger — L2 = 100&nbsp;MB, L3 = 1&nbsp;GB, L4 = 10&nbsp;GB… so a terabyte fits in six levels. When L1 overflows, one L1 table is merged into the ~10 L2 tables its key range overlaps (that ~10× rewrite is exactly where leveled compaction's write amplification comes from — per level, so roughly 10 × depth overall). The read-side payoff: within any level ≥ 1, key ranges never overlap, so a point lookup checks <em>at most one table per level</em> — memtable, a few L0 runs, then ~one table each in L1…L6, with Bloom filters eliminating nearly all of the misses before they touch disk. Size-tiered makes the mirror bet: merge only similar-sized runs (far fewer rewrites), accept that a read may have to consult several overlapping runs per tier. Write-heavy, read-rarely workloads tier; read-heavy workloads level — and hybrid schemes (RocksDB's universal compaction, Cassandra's per-table strategies) let you pick per workload.</p>" },

    { title: "Read, Write, and Space Amplification: The RUM Conjecture",
      html: "<p>Compare the families honestly with three amplification factors — how much <em>extra</em> work each design does per logical operation:</p>" +
      "<ul><li><strong>Read amplification</strong> — disk reads per query. LSM pays it (many runs to consult); B-Trees mostly don't.</li>" +
      "<li><strong>Write amplification</strong> — physical bytes written per logical byte. LSM pays via compaction rewriting data repeatedly; B-Trees pay by rewriting whole pages for small changes.</li>" +
      "<li><strong>Space amplification</strong> — bytes stored per live byte. LSM holds duplicate shadowed versions between compactions; B-Trees hold half-empty pages.</li></ul>" +
      "<p>The <strong>RUM Conjecture</strong> crystallizes the folklore: lowering any two of Read, Update (write), and Memory (space) overheads pushes the third up. It's a conjecture, not a theorem — but a superb map. B-Trees sit read-optimized; LSMs write-optimized; ultra-compact structures pay in both reads and writes.</p>" +
      "<div class='fig'><svg viewBox='0 0 760 260' xmlns='http://www.w3.org/2000/svg' font-family='Menlo,monospace'>" +
      "<line x1='380' y1='40' x2='185' y2='215' stroke='#1c2a45' stroke-width='2'/>" +
      "<line x1='380' y1='40' x2='575' y2='215' stroke='#1c2a45' stroke-width='2'/>" +
      "<line x1='185' y1='215' x2='575' y2='215' stroke='#1c2a45' stroke-width='2'/>" +
      "<text x='380' y='28' text-anchor='middle' fill='#2de2ff' font-size='13'>cheap Reads</text>" +
      "<text x='150' y='238' text-anchor='middle' fill='#ffd166' font-size='13'>cheap Updates</text>" +
      "<text x='610' y='238' text-anchor='middle' fill='#3ddc97' font-size='13'>low Memory/space</text>" +
      "<circle cx='380' cy='85' r='7' fill='#2de2ff'/><text x='400' y='82' fill='#c9d6ea' font-size='11.5'>B-Tree</text>" +
      "<text x='400' y='97' fill='#7d8fb0' font-size='10'>fast point reads · page rewrites · half-empty pages</text>" +
      "<circle cx='255' cy='180' r='7' fill='#ffd166'/><text x='273' y='177' fill='#c9d6ea' font-size='11.5'>LSM-Tree</text>" +
      "<text x='273' y='192' fill='#7d8fb0' font-size='10'>sequential writes · many runs per read</text>" +
      "<circle cx='505' cy='180' r='7' fill='#3ddc97'/><text x='430' y='163' fill='#c9d6ea' font-size='11.5'>compressed / succinct</text>" +
      "<text x='430' y='177' fill='#7d8fb0' font-size='10'>minimal bytes · CPU on every</text>" +
      "<text x='430' y='190' fill='#7d8fb0' font-size='10'>read AND write</text>" +
      "<text x='380' y='140' text-anchor='middle' fill='#7d8fb0' font-size='11'>pick a spot —</text>" +
      "<text x='380' y='155' text-anchor='middle' fill='#7d8fb0' font-size='11'>you can't have all three corners</text>" +
      "</svg><div class='fig-cap'>The RUM triangle as a map: each engine family camps near the corner it optimizes and pays rent toward the other two. Moving is allowed — leveled vs size-tiered compaction is the LSM sliding along the Update–Memory edge — but leaving the triangle isn't.</div></div>" },

    { title: "Implementation Details: SSTables & Bloom Filters", viz: "bloom", vizTitle: "Bloom filter: definitely-no or probably-yes",
      html: "<h3>Sorted String Tables</h3>" +
      "<p>Disk runs are usually <strong>SSTables</strong>: a data block of key-ordered records plus an index block (often itself a small B-Tree) over the keys. Immutability is a gift — an SSTable's size and layout are final at creation, so it can be packed perfectly, and lookups within one table are a single index probe.</p>" +
      "<h3>Bloom Filters</h3>" +
      "<p>The LSM read problem: is key K in <em>this</em> table, or must I check the next one? The crude answer is per-table <em>key-range metadata</em> — skip any table whose [min, max] excludes K — but ranges overlap and prove little. A <strong>Bloom filter</strong> answers \"definitely not\" or \"probably yes\" from a small in-memory bit array: adding a key sets the bits chosen by k hash functions; a probe checks those bits. Any zero bit ⇒ certainly absent (skip the table — no I/O!). All ones ⇒ probably present, with a tunable false-positive rate that shrinks as you spend more bits per key. Each SSTable carries one; together they eliminate almost all fruitless disk reads.</p>" +
      "<p>Walk one by hand: a 16-bit array, 3 hash functions. Adding <code>key1</code> hashes to positions 3, 5, 10 — set those bits. Adding <code>key2</code> hashes to 5, 8, 14 — set those (5 already was). Now probe <code>key3</code>, which hashes to 3, 10, 14: all three bits are set — by <em>other</em> keys' hashes — so the filter says \"probably present\" and we pay a wasted table lookup: a <strong>false positive</strong>. Probe <code>key4</code>, hashing to 5, 9, 15: bit 9 is zero, so <code>key4</code> is <em>certainly</em> not in this table, zero I/O. One-sided error is the whole contract — false positives cost a wasted read; false <em>negatives</em> (which can never happen) would silently lose data.</p>" +
      "<p>Tuning is arithmetic, not art: the false-positive rate falls exponentially with bits spent per key, with the optimal hash count k ≈ 0.7 × bits-per-key. The industry sweet spot is <strong>~10 bits per key ⇒ ~1% false positives with k ≈ 7</strong> hashes; 15–16 bits pushes toward 0.1%. And because SSTables are immutable, the key count is known exactly at build time — every filter is born perfectly sized, one of immutability's quiet gifts. (Bloom filters have probabilistic cousins on the same trade: HyperLogLog approximates distinct-counts, Count-Min Sketch approximates frequencies — tiny memory for answers with error bars.)</p>" +
      "<h3>Skiplists</h3>" +
      "<p>Memtables need a sorted, concurrent-friendly structure; the <strong>skiplist</strong> is the favorite: sorted linked lists stacked in randomized express lanes, giving probabilistic O(log n) search and lock-friendly (even CAS-only) insertion without any rebalancing.</p>" +
      "<p>The mechanics: every node lives in the bottom list; each node also appears in the lane above with probability ~1/2 (flip coins at insert until tails — a node's height is fixed at birth, never rebalanced). Search starts in the sparsest top lane and repeats one move: run right until the next key would overshoot, then drop down a lane; the bottom lane lands exactly at the target. With n keys there are ~log₂(n) lanes and the expected path is O(log n) — a balanced tree's search cost with none of a balanced tree's restructuring, which is exactly why concurrent inserts stay simple: linking a node into a lane is one pointer CAS, and no insert ever forces other nodes to move.</p>" +
      "<h3>Disk Access & Compression</h3>" +
      "<p>Because SSTables are immutable and block-organized, reads can memory-map or fetch whole blocks; compression applies per-block, with a small offset table mapping block numbers to their compressed positions.</p>" },

    { title: "Unordered LSM Storage: Bitcask & WiscKey",
      html: "<p>Drop the ordering axis and writes get even cheaper.</p>" +
      "<p><strong>Bitcask</strong> (from Riak) has no memtable and no sorted anything: values are appended to a data log, while an in-memory hash map (the <em>keydir</em>) maps every key to its latest log position. Reads are one seek; crashes rebuild the keydir by scanning logs; compaction rewrites logs keeping only the newest values. The catch: all keys must fit in memory, and range scans are impossible.</p>" +
      "<p><strong>WiscKey</strong> keeps range scans by separating keys from values: sorted keys live in a small LSM tree, while values sit in an unsorted append-only <em>vLog</em>. The tree being tiny makes compaction cheap (values aren't rewritten); the trade is that range reads must chase pointers into the vLog — random I/O that SSD parallelism largely forgives — and vLog garbage collection must walk backward through live records.</p>" +
      "<div class='fig'><svg viewBox='0 0 760 240' xmlns='http://www.w3.org/2000/svg' font-family='Menlo,monospace'>" +
      "<text x='185' y='24' text-anchor='middle' fill='#ffd166' font-size='13'>Bitcask</text>" +
      "<rect x='60' y='40' width='250 ' height='80' rx='8' fill='#0c1220' stroke='#ffd166' stroke-width='2'/>" +
      "<text x='185' y='60' text-anchor='middle' fill='#ffd166' font-size='11'>keydir (RAM) — ALL keys</text>" +
      "<text x='185' y='80' text-anchor='middle' fill='#c9d6ea' font-size='10.5'>k1 → file 2, offset 340</text>" +
      "<text x='185' y='97' text-anchor='middle' fill='#c9d6ea' font-size='10.5'>k2 → file 2, offset 810</text>" +
      "<rect x='60' y='160' width='250' height='34' rx='6' fill='#111a2e' stroke='#4f7cff' stroke-width='2'/>" +
      "<text x='185' y='181' text-anchor='middle' fill='#7d8fb0' font-size='10.5'>append-only data log (disk)</text>" +
      "<line x1='150' y1='120' x2='125' y2='156' stroke='#3ddc97' stroke-width='2'/><polygon points='122,161 124,149 134,155' fill='#3ddc97'/>" +
      "<text x='72' y='143' fill='#3ddc97' font-size='10.5'>1 seek</text>" +
      "<text x='185' y='222' text-anchor='middle' fill='#7d8fb0' font-size='10.5'>no order anywhere: no range scans</text>" +
      "<text x='570' y='24' text-anchor='middle' fill='#2de2ff' font-size='13'>WiscKey</text>" +
      "<path d='M 500 40 L 462 105 L 538 105 Z' fill='#111a2e' stroke='#2de2ff' stroke-width='2'/>" +
      "<text x='500' y='92' text-anchor='middle' fill='#2de2ff' font-size='10'>keys</text>" +
      "<text x='612' y='60' fill='#7d8fb0' font-size='10.5'>tiny LSM: sorted keys +</text>" +
      "<text x='612' y='75' fill='#7d8fb0' font-size='10.5'>pointers — cheap to compact</text>" +
      "<rect x='440' y='160' width='250' height='34' rx='6' fill='#111a2e' stroke='#ffd166' stroke-width='2'/>" +
      "<text x='565' y='181' text-anchor='middle' fill='#7d8fb0' font-size='10.5'>vLog: values, append-only, unsorted</text>" +
      "<line x1='500' y1='105' x2='520' y2='156' stroke='#3ddc97' stroke-width='2'/><polygon points='522,161 512,155 522,149' fill='#3ddc97'/>" +
      "<text x='565' y='222' text-anchor='middle' fill='#7d8fb0' font-size='10.5'>keys stay sorted: range scans survive</text>" +
      "</svg><div class='fig-cap'>Two ways to stop rewriting values. Bitcask deletes the ordering axis entirely — a RAM hash map straight to log offsets, one seek per read, no scans. WiscKey keeps a sorted key-tree small enough that compaction never has to move the (bulky) values sitting in the vLog.</div></div>" },

    { title: "Concurrency in LSM Trees",
      html: "<p>Mostly a coordination problem around structural switches:</p>" +
      "<ul><li><strong>Memtable switch</strong> — a filling memtable becomes immutable (a \"flushing\" table still serving reads) while a fresh one accepts writes; both must be readable until the flush lands.</li>" +
      "<li><strong>Flush finalization</strong> — swap the flushed table into the read set <em>before</em> discarding the memtable it replaces, or a moment of data invisibility opens up.</li>" +
      "<li><strong>Write-ahead log truncation</strong> — only trim log segments after their memtable's flush is durable.</li></ul>" +
      "<p>Reads meanwhile hold a consistent <em>view</em> (the set of tables at query start), with reference counting keeping compaction from deleting tables under a running query.</p>" },

    { title: "Log Stacking, LLAMA, and Open-Channel SSDs",
      html: "<p>Here's the twist ending: your log-structured storage engine runs on top of <em>other</em> log-structured systems.</p>" +
      "<h3>Flash Translation Layer</h3>" +
      "<p>The SSD's FTL is itself log-structured — remapping writes, garbage-collecting blocks, wear-leveling. A random-write-heavy workload forces the FTL to migrate data constantly; append-only workloads let it relax.</p>" +
      "<h3>Filesystem Logging</h3>" +
      "<p>Journaling filesystems add another log. So a write can be logged by the database (WAL), journaled by the filesystem, and remapped by the FTL — <strong>stacked logs</strong> that each add their own write amplification, fragment each other's sequential patterns, and schedule garbage collection at cross purposes.</p>" +
      "<div class='fig'><svg viewBox='0 0 760 225' xmlns='http://www.w3.org/2000/svg' font-family='Menlo,monospace'>" +
      "<rect x='130' y='30' width='500' height='44' rx='8' fill='#111a2e' stroke='#2de2ff' stroke-width='2'/>" +
      "<text x='380' y='50' text-anchor='middle' fill='#2de2ff' font-size='12'>database — WAL + LSM compaction</text>" +
      "<text x='380' y='66' text-anchor='middle' fill='#7d8fb0' font-size='10'>its own log, its own GC</text>" +
      "<line x1='380' y1='74' x2='380' y2='96' stroke='#ff5d73' stroke-width='2'/><polygon points='380,102 374,90 386,90' fill='#ff5d73'/>" +
      "<text x='398' y='92' fill='#ff5d73' font-size='10.5'>× write amplification</text>" +
      "<rect x='130' y='104' width='500' height='44' rx='8' fill='#111a2e' stroke='#4f7cff' stroke-width='2'/>" +
      "<text x='380' y='124' text-anchor='middle' fill='#4f7cff' font-size='12'>filesystem — journal</text>" +
      "<text x='380' y='140' text-anchor='middle' fill='#7d8fb0' font-size='10'>logs metadata (or data) again</text>" +
      "<line x1='380' y1='148' x2='380' y2='170' stroke='#ff5d73' stroke-width='2'/><polygon points='380,176 374,164 386,164' fill='#ff5d73'/>" +
      "<text x='398' y='166' fill='#ff5d73' font-size='10.5'>× write amplification</text>" +
      "<rect x='130' y='178' width='500' height='44' rx='8' fill='#111a2e' stroke='#ffd166' stroke-width='2'/>" +
      "<text x='380' y='198' text-anchor='middle' fill='#ffd166' font-size='12'>SSD FTL — log-structured remapping</text>" +
      "<text x='380' y='214' text-anchor='middle' fill='#7d8fb0' font-size='10'>relocates pages, erases blocks, wear-levels — a third log, a third GC</text>" +
      "</svg><div class='fig-cap'>One logical write, three log-structured systems, each unaware of the others: three write amplifications multiply, three garbage collectors collide, and each layer shreds the sequential patterns the one above worked to produce. LLAMA, open-channel SSDs, and zoned namespaces all attack the same disease: collapse the stack into one log that knows everything.</div></div>" +
      "<h3>LLAMA and Mindful Stacking</h3>" +
      "<p><strong>LLAMA</strong> (the latch-free, log-structured layer beneath the Bw-Tree) shows the fix: design the structure <em>with</em> its log-structured substrate in mind — logical pages become linked deltas in a log, and consolidation/GC serve both layers at once, instead of fighting.</p>" +
      "<h3>Open-Channel SSDs</h3>" +
      "<p>The radical version: strip the drive's FTL and expose raw flash geometry to software, so the database performs placement, GC, and wear leveling itself — one log to rule them all, no redundant layers. (The same spirit drives standards like NVMe Zoned Namespaces.)</p>" }
  ],
  terms: [
    { t: "memtable", d: "The in-memory sorted buffer (usually a skiplist) that absorbs all writes before a flush." },
    { t: "SSTable", d: "Immutable sorted disk run with an index block; the unit LSM reads and compactions operate on." },
    { t: "tombstone", d: "A deletion marker that shadows older versions of a key until compaction drops both." },
    { t: "compaction", d: "Background merge-sort of runs that reconciles versions and reclaims space." },
    { t: "merge-iteration", d: "Cursor-per-source priority-queue traversal yielding a single sorted stream from many sorted inputs." },
    { t: "Bloom filter", d: "Probabilistic bit-array membership test: 'definitely absent' or 'probably present'; kills useless disk reads." },
    { t: "RUM conjecture", d: "Pick two: read, update (write), and memory (space) overheads can't all be minimized at once." },
    { t: "write amplification", d: "Physical bytes written per logical byte — compaction's tax, and the FTL's." },
    { t: "keydir (Bitcask)", d: "In-memory hash map from every key to its latest position in an append-only data log." },
    { t: "open-channel SSD", d: "A drive exposing raw flash so software replaces the FTL — collapsing stacked logs into one." }
  ],
  quiz: [
    { type: "mc", q: "How does an LSM-Tree delete a key from an immutable SSTable?",
      opts: ["It rewrites the SSTable without the key", "It writes a tombstone that shadows the key until compaction drops both", "It flips a deletion bit inside the table", "Deletes are unsupported"], a: 1,
      why: "Immutable files can't be edited; the tombstone wins reconciliation against older versions, and compaction eventually makes the deletion physical." },
    { type: "mc", q: "A Bloom filter probe returns all-ones for key K. What do we know?",
      opts: ["K is certainly in the table", "K is probably in the table — but this may be a false positive", "K was deleted", "The filter is full and useless"], a: 1,
      why: "Bloom filters have one-sided error: zeros are definitive absence, ones are only probable presence." },
    { type: "mc", q: "Per the RUM conjecture, an engine that minimizes write and space amplification will tend to pay with…",
      opts: ["higher read amplification", "more memory", "lower durability", "smaller pages"], a: 0,
      why: "Reducing two of read/update/memory overheads pushes the third up — e.g., size-tiered LSMs write cheaply and store compactly but consult many overlapping runs per read." },
    { type: "mc", q: "Why can Bitcask answer any read in a single disk seek?",
      opts: ["Its data files are sorted", "An in-memory hash map holds the exact log offset of every key's latest value", "It caches all values in RAM", "It uses Bloom filters per segment"], a: 1,
      why: "The keydir is the entire index — which also means every key must fit in memory, and range scans are off the menu." },
    { type: "order", q: "Order the life of a written key-value pair in an LSM-Tree:",
      items: ["Appended to the WAL and inserted into the memtable", "Memtable fills and is flushed as an immutable SSTable", "Compaction merges the SSTable with others, reconciling versions", "Old shadowed versions and tombstones are discarded"],
      why: "Buffer in memory, spill sequentially, merge in the background — the write path never randomly updates disk." },
    { type: "mc", q: "In leveled compaction, why does a point lookup touch at most ONE table per level below L0?",
      opts: ["Each level is a single file", "Within a level, tables hold non-overlapping key ranges — exactly one can contain the key", "Bloom filters merge the tables", "Levels are sorted by age, not key"], a: 1,
      why: "Levels 1+ are partitioned by key range with no overlap; only L0's raw flushed runs can overlap, which is why L0 is kept small and compacted away first." }
  ]
});
