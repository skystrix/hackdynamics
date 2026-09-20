/* ==========================================================================
   bookData-additions2.js — Part IV: Databases in the Real World
   Chapter 21 — Scaling Patterns
   Chapter 22 — Operating Databases: Reliability & Security
   Chapter 23 — Modern Hardware & Cloud-Native Databases
   Chapter 24 — The Great Databases: A Field Guide
   Chapter 25 — Choosing and Evolving Your Database
   Original explanatory writing; same schema as the other bookData files.
   ========================================================================== */

/* ======================= CHAPTER 19 ======================= */
CHAPTERS.push({
  num: 21, part: 4, title: "Scaling Patterns",
  blurb: "At some point a single database can't keep up with the load, and this chapter is the practical playbook for what to do, roughly in the order you should try things. We'll cover adding read-only copies to spread out reads (and the 'lag' problem that creates), splitting data across several databases ('sharding') and the traps that come with it, putting a cache in front to soak up repeated reads, and reliable patterns for keeping all these moving parts in sync as data changes.",
  sections: [
    { title: "The Scaling Ladder",
      html: "<p>Scale in the order of increasing regret:</p>" +
      "<ol><li><strong>Tune</strong> — indexes, query plans, connection pooling. The cheapest 10× lives here, and Chapters 11–12 are the toolkit.</li>" +
      "<li><strong>Scale up</strong> — a bigger box. Unfashionable and spectacularly effective: modern hardware runs enormous workloads on one primary, and one node means none of Part III's problems.</li>" +
      "<li><strong>Scale reads out</strong> — replicas absorb read traffic (this section).</li>" +
      "<li><strong>Cache</strong> — absorb repeated reads before they reach the database at all.</li>" +
      "<li><strong>Shard</strong> — split the write load itself. Powerful, and a one-way door: cross-shard queries, transactions, and rebalancing become <em>your</em> problems.</li></ol>" +
      "<h3>Read Replicas and Their Lag</h3>" +
      "<p>Asynchronous replicas tail the primary's WAL and serve reads — but they run <em>behind</em>, from milliseconds to (during trouble) minutes. Every read-after-write bug in a scaled system traces here: user saves, next page reads a replica, the save \"vanished.\" The defenses are Chapter 17's session guarantees made concrete: route a user's reads to the primary briefly after their writes, or hold a token of the last-seen WAL position and only accept replicas that have caught up to it. Synchronous replication buys zero lag on the covered replica at the price of write latency coupled to the slowest acknowledger.</p>" },

    { title: "Sharding", viz: "hashring", vizTitle: "Consistent hashing: nodes join, keys barely move",
      html: "<p><strong>Sharding</strong> (horizontal partitioning) splits data across independent databases by a <strong>shard key</strong>. Three routing strategies:</p>" +
      "<ul><li><strong>Range</strong> — contiguous key ranges per shard. Range scans stay local, and ranges can split/merge adaptively (HBase, CockroachDB, Spanner) — but monotonic keys (timestamps!) hammer the last shard.</li>" +
      "<li><strong>Hash</strong> — uniform spread, dead-simple routing, no cross-shard range scans. The <strong>consistent-hashing ring</strong> (Chapter 19) keeps membership changes cheap — play with it above — while production systems more often use fixed <strong>virtual buckets</strong> (many small partitions mapped to nodes) for controlled rebalancing.</li>" +
      "<li><strong>Directory</strong> — an explicit lookup service maps keys (often tenants) to shards. Maximum flexibility — move any tenant anywhere — plus one more critical service to keep alive.</li></ul>" +
      "<p>The shard key decides everything downstream: every query that <em>doesn't</em> include it becomes a scatter-gather across all shards; every transaction that spans two shards needs Chapter 19's machinery. Choose the key that co-locates each transaction (usually tenant/user ID) — and fear the <strong>hot key</strong>: one celebrity account, one viral item, and a \"balanced\" cluster has one shard on fire. Mitigations: split the hot entity's data further (append random suffixes), cache it aggressively, or handle it on a dedicated path.</p>" },

    { title: "Caching Layers",
      html: "<p>A cache (Redis/Memcached tier, or in-process) absorbs read traffic before it touches the database. The patterns:</p>" +
      "<ul><li><strong>Cache-aside</strong> — app reads cache; on miss, reads DB and populates. Simple, dominant; data expires via TTL or explicit invalidation.</li>" +
      "<li><strong>Write-through</strong> — writes update cache and DB together: fresher reads, slower writes.</li>" +
      "<li><strong>Write-behind</strong> — writes hit the cache and flush to the DB asynchronously: fastest writes, and now the <em>cache</em> holds the only copy of recent data. (Recognize it? That's a memtable without a WAL — add durability or accept loss.)</li></ul>" +
      "<p>The two classic failure modes: <strong>stale data</strong> — \"there are only two hard things in computer science…\" — invalidation is genuinely hard because the cache can't know what a DB write changed unless someone tells it (CDC helps, below); and the <strong>thundering herd / stampede</strong> — a hot key expires and ten thousand concurrent misses hit the database as one wave. Defenses: per-key singleflight locks (one loader, others wait), probabilistic early refresh, jittered TTLs, or never-expire-with-background-refresh for known-hot keys.</p>" +
      "<div class='fig'><svg viewBox='0 0 760 215' xmlns='http://www.w3.org/2000/svg' font-family='Menlo,monospace'>" +
      "<text x='185' y='24' text-anchor='middle' fill='#ff5d73' font-size='12.5'>stampede</text>" +
      "<text x='70' y='58' fill='#7d8fb0' font-size='10'>50k req/s</text>" +
      "<line x1='70' y1='70' x2='134' y2='90' stroke='#ff5d73' stroke-width='2'/><line x1='70' y1='90' x2='134' y2='97' stroke='#ff5d73' stroke-width='2'/><line x1='70' y1='110' x2='134' y2='104' stroke='#ff5d73' stroke-width='2'/><line x1='70' y1='130' x2='134' y2='111' stroke='#ff5d73' stroke-width='2'/>" +
      "<rect x='140' y='80' width='90' height='44' rx='7' fill='#111a2e' stroke='#ffd166' stroke-width='2'/>" +
      "<text x='185' y='99' text-anchor='middle' fill='#ffd166' font-size='10'>cache</text><text x='185' y='114' text-anchor='middle' fill='#ff5d73' font-size='9.5'>key EXPIRED</text>" +
      "<line x1='230' y1='92' x2='294' y2='80' stroke='#ff5d73' stroke-width='2'/><line x1='230' y1='99' x2='294' y2='95' stroke='#ff5d73' stroke-width='2'/><line x1='230' y1='106' x2='294' y2='110' stroke='#ff5d73' stroke-width='2'/><line x1='230' y1='113' x2='294' y2='125' stroke='#ff5d73' stroke-width='2'/>" +
      "<rect x='300' y='80' width='70' height='44' rx='7' fill='#111a2e' stroke='#ff5d73' stroke-width='2.5'/>" +
      "<text x='335' y='99' text-anchor='middle' fill='#ff5d73' font-size='10'>DB</text><text x='335' y='114' text-anchor='middle' fill='#ff5d73' font-size='9.5'>flattened</text>" +
      "<text x='185' y='160' text-anchor='middle' fill='#7d8fb0' font-size='9.5'>every miss becomes a</text>" +
      "<text x='185' y='174' text-anchor='middle' fill='#7d8fb0' font-size='9.5'>simultaneous DB query</text>" +
      "<text x='570' y='24' text-anchor='middle' fill='#3ddc97' font-size='12.5'>singleflight</text>" +
      "<line x1='455' y1='70' x2='519' y2='90' stroke='#7d8fb0' stroke-width='2'/><line x1='455' y1='90' x2='519' y2='97' stroke='#7d8fb0' stroke-width='2'/><line x1='455' y1='110' x2='519' y2='104' stroke='#7d8fb0' stroke-width='2'/><line x1='455' y1='130' x2='519' y2='111' stroke='#7d8fb0' stroke-width='2'/>" +
      "<rect x='525' y='80' width='100' height='44' rx='7' fill='#111a2e' stroke='#3ddc97' stroke-width='2'/>" +
      "<text x='575' y='99' text-anchor='middle' fill='#3ddc97' font-size='10'>per-key gate</text><text x='575' y='114' text-anchor='middle' fill='#7d8fb0' font-size='9.5'>1 loads, rest wait</text>" +
      "<line x1='625' y1='102' x2='664' y2='102' stroke='#3ddc97' stroke-width='2.5'/><polygon points='670,102 658,96 658,108' fill='#3ddc97'/>" +
      "<text x='647' y='92' text-anchor='middle' fill='#3ddc97' font-size='9.5'>×1</text>" +
      "<rect x='670' y='80' width='60' height='44' rx='7' fill='#111a2e' stroke='#4f7cff' stroke-width='2'/>" +
      "<text x='700' y='106' text-anchor='middle' fill='#4f7cff' font-size='10'>DB</text>" +
      "<text x='570' y='160' text-anchor='middle' fill='#7d8fb0' font-size='9.5'>one query rebuilds the value;</text>" +
      "<text x='570' y='174' text-anchor='middle' fill='#7d8fb0' font-size='9.5'>waiters get the result microseconds later</text>" +
      "<text x='380' y='205' text-anchor='middle' fill='#7d8fb0' font-size='10.5'>same 50k req/s, same expiry — the only difference is deduplication at the miss</text>" +
      "</svg><div class='fig-cap'>The stampede and its antidote, side by side. Expiry converts a hot key's entire request rate into concurrent misses; singleflight collapses those misses into exactly one database query per key per expiry. Jittered TTLs make the storms rarer; singleflight makes them harmless.</div></div>" },

    { title: "Change Data Capture & the Outbox",
      html: "<p>Everything downstream — caches, search indexes, warehouses, other services — needs to know what changed in the database. Polling is slow and lossy; dual-writing from the application (\"write to DB, then also publish to Kafka\") is a distributed transaction in disguise and <em>will</em> desync the moment one write succeeds and the other fails.</p>" +
      "<p><strong>Change data capture (CDC)</strong> solves it with a move this site has prepared you for: <em>tail the WAL</em>. The replication log already records every committed change in order — CDC tools (Debezium and kin) decode it and publish a change stream. Consumers rebuild caches, feed search, populate the warehouse — all from one ordered, replay-able source of truth, with no application cooperation required.</p>" +
      "<p>For <em>intentional</em> events (\"OrderPlaced\", not \"row updated\"), the <strong>transactional outbox</strong> pattern: within the same local transaction as the business write, insert an event row into an <code>outbox</code> table; a relay (or CDC itself) publishes and clears it. Atomicity by construction — the event exists if and only if the commit happened.</p>" +
      "<div class='fig'><svg viewBox='0 0 760 235' xmlns='http://www.w3.org/2000/svg' font-family='Menlo,monospace'>" +
      "<rect x='40' y='75' width='90' height='50' rx='8' fill='#111a2e' stroke='#7d8fb0' stroke-width='2'/>" +
      "<text x='85' y='105' text-anchor='middle' fill='#c9d6ea' font-size='11'>app</text>" +
      "<line x1='130' y1='100' x2='164' y2='100' stroke='#2de2ff' stroke-width='2'/><polygon points='170,100 158,94 158,106' fill='#2de2ff'/>" +
      "<rect x='170' y='55' width='190' height='90' rx='9' fill='#0c1220' stroke='#3ddc97' stroke-width='2.5'/>" +
      "<text x='265' y='75' text-anchor='middle' fill='#3ddc97' font-size='10.5'>ONE local transaction</text>" +
      "<rect x='185' y='84' width='160' height='24' rx='5' fill='#111a2e' stroke='#1c2a45'/><text x='265' y='100' text-anchor='middle' fill='#c9d6ea' font-size='9.5'>UPDATE orders SET …</text>" +
      "<rect x='185' y='113' width='160' height='24' rx='5' fill='#111a2e' stroke='#ffd166'/><text x='265' y='129' text-anchor='middle' fill='#ffd166' font-size='9.5'>INSERT INTO outbox …</text>" +
      "<line x1='265' y1='145' x2='265' y2='168' stroke='#2de2ff' stroke-width='2'/><polygon points='265,174 259,162 271,162' fill='#2de2ff'/>" +
      "<rect x='150' y='176' width='230' height='34' rx='6' fill='#111a2e' stroke='#4f7cff' stroke-width='2'/>" +
      "<text x='265' y='197' text-anchor='middle' fill='#4f7cff' font-size='10.5'>WAL — every committed change, in order</text>" +
      "<line x1='380' y1='193' x2='434' y2='193' stroke='#2de2ff' stroke-width='2'/><polygon points='440,193 428,187 428,199' fill='#2de2ff'/>" +
      "<rect x='440' y='176' width='120' height='34' rx='6' fill='#111a2e' stroke='#2de2ff' stroke-width='2'/>" +
      "<text x='500' y='197' text-anchor='middle' fill='#2de2ff' font-size='10.5'>CDC (Debezium)</text>" +
      "<line x1='560' y1='185' x2='614' y2='60' stroke='#1c2a45' stroke-width='2'/><polygon points='616,55 606,62 617,68' fill='#1c2a45'/>" +
      "<line x1='560' y1='190' x2='614' y2='125' stroke='#1c2a45' stroke-width='2'/><polygon points='617,120 607,125 617,133' fill='#1c2a45'/>" +
      "<line x1='560' y1='196' x2='614' y2='192' stroke='#1c2a45' stroke-width='2'/><polygon points='620,192 608,187 609,198' fill='#1c2a45'/>" +
      "<rect x='620' y='38' width='110' height='34' rx='6' fill='#111a2e' stroke='#7d8fb0'/><text x='675' y='59' text-anchor='middle' fill='#c9d6ea' font-size='10'>cache invalidation</text>" +
      "<rect x='620' y='105' width='110' height='34' rx='6' fill='#111a2e' stroke='#7d8fb0'/><text x='675' y='126' text-anchor='middle' fill='#c9d6ea' font-size='10'>search index</text>" +
      "<rect x='620' y='172' width='110' height='34' rx='6' fill='#111a2e' stroke='#7d8fb0'/><text x='675' y='193' text-anchor='middle' fill='#c9d6ea' font-size='10'>warehouse</text>" +
      "<text x='85' y='150' text-anchor='middle' fill='#ff5d73' font-size='9.5'>no second write</text>" +
      "<text x='85' y='164' text-anchor='middle' fill='#ff5d73' font-size='9.5'>to Kafka here!</text>" +
      "</svg><div class='fig-cap'>The whole pattern in one picture: the business row and the outbox event commit atomically (green box), the WAL records both, and CDC fans the ordered change stream out to every downstream copy. The application never dual-writes — the event exists exactly when the commit does.</div></div>" +
      "<h3>Event Sourcing & CQRS</h3>" +
      "<p>Push the idea to its limit and the log <em>becomes</em> the database: <strong>event sourcing</strong> stores the append-only sequence of domain events as the source of truth, with current state derived by folding events (plus snapshots, to bound replay — exactly Chapter 1's durability recipe for in-memory stores). Its natural partner <strong>CQRS</strong> splits the write model (validated commands appending events) from read models (projections shaped per query, rebuilt from the log at will). Superb audit trails and retroactive fixes; the tax is eventual-consistent reads and real modeling discipline. Use where history <em>is</em> the business — ledgers, orders, compliance — not as a default.</p>" },

    { title: "Multi-Region",
      html: "<p>Going multi-region multiplies every prior question by geography — and the speed of light doesn't negotiate: ~80 ms round-trip across an ocean turns every synchronous cross-region hop into user-visible latency.</p>" +
      "<ul><li><strong>Active–passive</strong> — one region writes; others hold warm replicas for failover and local reads. Simple; failover is Chapter 16's problems at region scale (who decides the primary region is dead? what about the writes it hadn't shipped?).</li>" +
      "<li><strong>Active–active</strong> — multiple regions accept writes. Now conflicting concurrent writes are a fact of life, resolved by CRDTs (Chapter 17), last-write-wins (data loss dressed as a policy), or consensus-per-key with leaders placed near their writers (Spanner/CockroachDB style — Chapter 24).</li>" +
      "<li><strong>Geo-partitioning</strong> — often the honest answer: EU users' data lives, replicates, and commits in the EU; US in the US. Local latency, clean data-residency compliance (GDPR and its siblings), and cross-region traffic only for genuinely global data.</li></ul>" }
  ],
  terms: [
    { t: "replication lag", d: "How far an async replica trails the primary — the read-after-write bug factory." },
    { t: "shard key", d: "The attribute that routes rows to shards; queries without it become scatter-gather." },
    { t: "virtual buckets", d: "Many fixed partitions mapped to nodes — rebalancing moves buckets, not re-hashed keys." },
    { t: "hot key / celebrity problem", d: "One entity so popular it overwhelms its shard despite perfect average balance." },
    { t: "cache stampede", d: "A hot key expires and thousands of concurrent misses hit the database as one wave." },
    { t: "singleflight", d: "Per-key deduplication: one request loads on a miss, the rest wait for its result." },
    { t: "change data capture", d: "Tailing the database's WAL to publish an ordered stream of committed changes." },
    { t: "transactional outbox", d: "Event row committed in the same transaction as the business write; a relay publishes it — atomic by construction." },
    { t: "event sourcing", d: "The append-only event log is the source of truth; state is a fold over it." },
    { t: "CQRS", d: "Separate write model (commands → events) from read models (per-query projections)." },
    { t: "geo-partitioning", d: "Pin each user's data to their region: local latency and residency compliance at once." }
  ],
  quiz: [
    { type: "mc", q: "A user saves their profile, and the next page load shows the old version. The system uses async read replicas. What happened?",
      opts: ["The write was lost between the client and the primary on the way in", "The read hit a replica that hadn't yet replayed the write — replication lag", "The cache corrupted the row on its way back", "The shard key changed under the profile"], a: 1,
      why: "Classic read-after-write violation: route post-write reads to the primary or gate replicas on the writer's WAL position (a session guarantee, made real)." },
    { type: "mc", q: "Why is 'write to the DB, then publish to Kafka' from application code a trap?",
      opts: ["Kafka is too slow to keep up with the database's commit rate under load, so the publish falls behind the writes", "The two writes can't be made atomic — one can succeed and the other fail, silently desyncing consumers", "It requires a second connection to be held open", "Kafka cannot store JSON payloads natively"], a: 1,
      why: "It's an undeclared distributed transaction. The outbox pattern (or CDC from the WAL) restores atomicity by making the event part of the local commit." },
    { type: "mc", q: "Orders are sharded by order_id (hash). The dashboard query 'all orders for customer 42' now…",
      opts: ["runs faster than it did before the table was sharded, since each shard now holds fewer rows", "must scatter-gather across every shard, since customer_id isn't the shard key", "fails outright with a routing error, because no shard can be chosen for the query to be routed to", "uses the outbox table instead"], a: 1,
      why: "Queries not containing the shard key can't be routed — they fan out everywhere. Shard-key choice is a query-pattern decision, not a data decision." },
    { type: "mc", q: "A cached key serving 50k req/s expires. What prevents the database from being flattened?",
      opts: ["A longer TTL on its own, so the key expires far less often than it used to to be rebuilt by anyone once it finally does expire", "Singleflight: one request rebuilds the value while the rest wait (plus jittered TTLs / early refresh)", "Write-behind caching, which defers the rebuild to a background writer behind the read path entirely that the readers take", "Range sharding, which spreads the key across several nodes so no single one of them is hot under the load"], a: 1,
      why: "Stampede control means exactly one loader per key per expiry — everyone else gets the fresh result microseconds later." },
    { type: "order", q: "Order the scaling ladder, cheapest regret first:",
      items: ["Tune queries and indexes", "Scale up the hardware", "Add read replicas and caching", "Shard the writes"],
      why: "Each rung down adds operational surface and distributed-systems exposure; sharding is the one-way door you climb to last." }
  ]
});

/* ======================= CHAPTER 20 ======================= */
CHAPTERS.push({
  num: 22, part: 4, title: "Operating Databases: Reliability & Security",
  blurb: "This is the chapter about running a database in production without losing data or getting breached, the unglamorous work that quietly decides whether a company survives a bad day. You'll learn how to fail over to a backup machine automatically without the 'two masters at once' disaster, how to take backups that actually work when you need to restore them, how to change your table structure while the app keeps running, what to watch on your monitoring dashboards, and how to lock the database down in layers.",
  sections: [
    { title: "High Availability",
      html: "<p>HA is Part III applied to your own database. A primary with replicas needs an answer to: <em>who promotes a replica, and how do we guarantee two primaries never run at once?</em> Ad-hoc failover scripts rediscover split brain (Chapter 16) in production; the sound designs delegate the decision to a consensus system — an orchestrator (Patroni-style) storing leadership in etcd/ZooKeeper leases, or a cluster that has consensus built in (Chapter 24's Raft-based systems).</p>" +
      "<ul><li><strong>Fencing</strong> — the deposed primary must be <em>prevented</em> from accepting writes (kill it, revoke its storage, invalidate its lease), not merely asked to stop. STONITH — \"shoot the other node in the head\" — is the affectionate industry term.</li>" +
      "<li><strong>Failover data loss</strong> — async replication means the dead primary may hold acknowledged writes the replica never saw. Decide <em>in advance</em>: sync replication (pay latency, lose nothing) or async (fast, and an RPO greater than zero).</li>" +
      "<li><strong>Connection management</strong> — every failover strands thousands of connections. Pooling proxies (PgBouncer et al.) and client retry discipline turn a failover from an outage into a blip. Pools matter in steady state too: databases degrade badly past a few hundred real connections; the pool multiplexes thousands of app connections onto tens.</li></ul>" },

    { title: "Backups: The Only Test Is a Restore",
      html: "<p>Replication is not backup — it replicates <code>DROP TABLE</code> beautifully. Real backup strategy:</p>" +
      "<ul><li><strong>Logical backups</strong> (dump the rows as SQL/archive) — portable across versions and engines, restore selectively; slow at scale.</li>" +
      "<li><strong>Physical backups</strong> (copy the data files + the WAL needed to make them consistent) — fast, exact, engine-locked.</li>" +
      "<li><strong>Point-in-time recovery (PITR)</strong> — a periodic base backup <em>plus a continuous archive of the WAL</em>: restore the base, replay the log to any second — say, the moment <em>before</em> the bad deploy ran its migration. The WAL, once again, is the database's memory of everything.</li></ul>" +
      "<div class='fig'><svg viewBox='0 0 760 175' xmlns='http://www.w3.org/2000/svg' font-family='Menlo,monospace'>" +
      "<line x1='50' y1='95' x2='720' y2='95' stroke='#1c2a45' stroke-width='2'/><polygon points='726,95 714,89 714,101' fill='#1c2a45'/>" +
      "<rect x='70' y='75' width='24' height='40' rx='4' fill='#111a2e' stroke='#3ddc97' stroke-width='2.5'/>" +
      "<text x='82' y='60' text-anchor='middle' fill='#3ddc97' font-size='10.5'>base backup</text>" +
      "<text x='82' y='135' text-anchor='middle' fill='#7d8fb0' font-size='9.5'>Sun 02:00</text>" +
      "<rect x='110' y='84' width='52 ' height='22' rx='4' fill='#111a2e' stroke='#4f7cff'/><rect x='168' y='84' width='52' height='22' rx='4' fill='#111a2e' stroke='#4f7cff'/><rect x='226' y='84' width='52' height='22' rx='4' fill='#111a2e' stroke='#4f7cff'/><rect x='284' y='84' width='52' height='22' rx='4' fill='#111a2e' stroke='#4f7cff'/><rect x='342' y='84' width='52' height='22' rx='4' fill='#111a2e' stroke='#4f7cff'/><rect x='400' y='84' width='52' height='22' rx='4' fill='#111a2e' stroke='#4f7cff'/>" +
      "<text x='281' y='72' text-anchor='middle' fill='#4f7cff' font-size='10.5'>archived WAL segments — every committed change since the base</text>" +
      "<line x1='485' y1='50' x2='485' y2='140' stroke='#3ddc97' stroke-width='2.5'/>" +
      "<text x='485' y='40' text-anchor='middle' fill='#3ddc97' font-size='10.5'>replay STOPS: 14:31:59</text>" +
      "<line x1='530' y1='50' x2='530' y2='140' stroke='#ff5d73' stroke-width='2.5' stroke-dasharray='6 4'/>" +
      "<text x='555' y='40' text-anchor='middle' fill='#ff5d73' font-size='10.5'>14:32:00 bad deploy</text>" +
      "<text x='558' y='135' text-anchor='middle' fill='#ff5d73' font-size='9.5'>DROP TABLE users</text>" +
      "<path d='M 94 120 C 200 160 380 160 478 128' fill='none' stroke='#3ddc97' stroke-width='2' stroke-dasharray='6 4'/><polygon points='482,124 471,127 476,137' fill='#3ddc97'/>" +
      "<text x='290' y='165' text-anchor='middle' fill='#3ddc97' font-size='10.5'>restore = base + replay WAL to any chosen second</text>" +
      "</svg><div class='fig-cap'>Point-in-time recovery as a timeline: a weekly base backup plus a continuous WAL archive lets you rebuild the database as of ANY second — including the one just before the disaster. Replication can't do this; it delivered the DROP TABLE to every replica in milliseconds.</div></div>" +
      "<p>The operational truths: an untested backup is a hope, not a backup — <em>rehearse restores</em>, on a schedule, measuring the time (your real RTO). Define <strong>RPO</strong> (how much data you may lose) and <strong>RTO</strong> (how long recovery may take) as business decisions, then verify the machinery meets them. Keep at least one copy off-site and immutable/offline — ransomware operators delete reachable backups first. And retention is policy: legal hold on one hand, right-to-erasure on the other.</p>" },

    { title: "Schema Migrations Without Downtime",
      html: "<p>Changing a live schema is minor surgery on a running patient. Two hazards: DDL that <em>locks</em> (a naive <code>ALTER TABLE</code> can take an exclusive lock and rewrite the table while every query queues behind it — engines vary wildly in which operations are online), and code/schema <em>version skew</em> — during a rolling deploy, old and new application versions run against the same schema simultaneously.</p>" +
      "<p>The discipline that handles both is <strong>expand–contract</strong>:</p>" +
      "<ol><li><strong>Expand</strong> — add the new column/table/index additively; nothing reads it yet. (Create indexes with the engine's online/concurrent mode.)</li>" +
      "<li><strong>Migrate</strong> — deploy code that writes both old and new shapes; backfill history in small batches (never one table-locking mega-UPDATE).</li>" +
      "<li><strong>Switch reads</strong> — verified equal? Read from the new shape.</li>" +
      "<li><strong>Contract</strong> — much later, drop the old shape. Deliberately boring by then.</li></ol>" +
      "<p>Every step is compatible with the versions running beside it, and every step is individually revertible — which is the entire point.</p>" },

    { title: "Observability: The Four Questions",
      html: "<p>Database monitoring reduces to four questions:</p>" +
      "<ul><li><strong>Is it saturated?</strong> — CPU, I/O throughput and latency, memory pressure, connection count vs limit, disk headroom (a full disk is a hard outage with a WAL that can't append).</li>" +
      "<li><strong>Are queries healthy?</strong> — p95/p99 latency (averages hide the pain), slow-query logs, and the statement-level view (pg_stat_statements and equivalents): which query <em>shapes</em> consume the most total time. One bad plan flip shows up here first — estimated-vs-actual, Chapter 12.</li>" +
      "<li><strong>Is replication healthy?</strong> — lag in bytes <em>and</em> seconds per replica; a replica quietly hours behind is a failed failover waiting to be discovered at the worst moment.</li>" +
      "<li><strong>Are the internals coping?</strong> — engine-specific vitals: buffer-pool hit rate, checkpoint frequency, lock waits and deadlocks, autovacuum keeping ahead of dead-tuple accumulation (Postgres), compaction keeping ahead of write load (LSM engines — Chapter 10's read amplification made visible).</li></ul>" +
      "<p>Alert on symptoms users feel (latency, errors, lag, disk) and on leading indicators of doom (transaction-ID wraparound advancing, disk 80%), not on every twitch.</p>" },

    { title: "Security in Depth",
      html: "<p>Databases hold the crown jewels; treat every layer as hostile until proven otherwise:</p>" +
      "<ul><li><strong>Network</strong> — never expose a database to the internet; private networks, TLS on every connection (including replica traffic — WAL streams carry all the data).</li>" +
      "<li><strong>Authentication</strong> — no shared accounts, no passwords in configs: managed identities/certificates, short-lived credentials from a secrets manager, rotation that's automated because manual rotation never happens.</li>" +
      "<li><strong>Authorization</strong> — least privilege via roles (RBAC): the app account can't DROP, the analyst can't write, the migration role exists only during deploys. <strong>Row-level security</strong> pushes tenant isolation into the engine itself — every query is invisibly filtered to the tenant, so a forgotten WHERE clause can't leak another customer's data.</li>" +
      "<li><strong>Injection</strong> — still, decades on, a top breach vector; parameterized queries everywhere, never string-built SQL. The database side of the defense: accounts so scoped that even a successful injection can't reach beyond its slice.</li>" +
      "<li><strong>Encryption</strong> — at rest (disk/file-level against stolen media, or column-level for the truly sensitive) and in transit; keys in a KMS/HSM with rotation, never beside the data they protect.</li>" +
      "<li><strong>Audit & privacy</strong> — immutable audit logs of who touched what (shipped off the box); data classified and minimized; deletion honored through backups and replicas too — a right-to-erasure request doesn't stop at the primary.</li></ul>" }
  ],
  terms: [
    { t: "split brain (ops)", d: "Two primaries accepting writes after a botched failover — prevented by consensus-held leases and fencing." },
    { t: "fencing / STONITH", d: "Forcibly ensuring the deposed primary cannot write: kill it, revoke storage, invalidate its lease." },
    { t: "RPO / RTO", d: "Recovery point (data you may lose) and recovery time (downtime you may take) — business decisions the machinery must meet." },
    { t: "point-in-time recovery", d: "Base backup + continuous WAL archive = restore to any chosen second." },
    { t: "expand–contract", d: "Additive schema change, dual-write + backfill, switch reads, drop old — zero-downtime migration." },
    { t: "connection pooling", d: "Multiplexing thousands of app connections onto tens of real ones; databases hate connection crowds." },
    { t: "p99 latency", d: "The tail experience; averages hide the users who are suffering." },
    { t: "row-level security", d: "Engine-enforced per-row visibility policies — tenant isolation that survives application bugs." },
    { t: "parameterized query", d: "SQL with bound parameters instead of string concatenation — the injection killer." },
    { t: "replication lag alerting", d: "Bytes and seconds behind, per replica — a silent stale replica is a failed failover in waiting." }
  ],
  quiz: [
    { type: "mc", q: "Why is replication alone not a backup strategy?",
      opts: ["Replicas are slower to read from than the primary and cannot keep up with a restore", "Replication faithfully replicates the disaster — DROP TABLE arrives at every replica in milliseconds", "Replicas cannot be encrypted at rest", "WAL files expire before a restore"], a: 1,
      why: "Replication protects against machine failure, not human or software failure. PITR — base backup plus WAL archive — is what lets you rewind to before the mistake." },
    { type: "mc", q: "During failover, why must the old primary be fenced rather than just 'told to stop'?",
      opts: ["To free the memory the old primary is still holding for its open transactions, which the new primary now needs for itself", "A partitioned-away primary may still be alive and accepting writes — split brain unless it's forcibly cut off", "Fencing speeds up the replay of the remaining log", "The clients require it before they reconnect"], a: 1,
      why: "You can't distinguish dead from unreachable (Part III's oldest lesson); only revoked leases, killed processes, or detached storage make the guarantee." },
    { type: "mc", q: "A migration must rename a heavily-used column with zero downtime. The expand–contract play is:",
      opts: ["A single ALTER TABLE RENAME shipped in one deploy, taken during a quiet hour", "Add new column → dual-write + backfill → switch reads → drop old column later", "Drop and recreate the table overnight", "Fork the database and diverge"], a: 1,
      why: "Every phase stays compatible with both app versions running during rolling deploys, and every phase can be rolled back alone." },
    { type: "mc", q: "What does row-level security add over application-side WHERE clauses?",
      opts: ["Faster queries, since the engine can push the tenant filter below the join for you, and keep the plan cached across tenants as well", "The engine enforces tenant filters on every query — one forgotten clause can no longer leak another tenant's rows", "Smaller indexes on the tenant column", "Automatic encryption of the tenant's rows"], a: 1,
      why: "Defense in depth: isolation becomes a property of the database, not a convention every code path must remember." },
    { type: "blank", q: "Restoring last night's base backup and replaying archived WAL up to 14:31:59 — one second before the bad deploy — is called ________ recovery.",
      a: ["point in time", "point-in-time", "pitr"], why: "PITR turns the WAL archive into a time machine with one-second resolution." }
  ]
});

/* ======================= CHAPTER 21 ======================= */
CHAPTERS.push({
  num: 23, part: 4, title: "Modern Hardware & Cloud-Native Databases",
  blurb: "A lot of database design was shaped by old assumptions about hardware, chiefly that reading a random spot on disk is painfully slow. This chapter looks at how newer hardware breaks those assumptions: fast SSDs, networks that are now quicker than disks used to be, and the cloud, which splits the database into separate services for storage and for computing. We'll see how these shifts are changing the way modern databases are built, including 'serverless' databases that scale down to nothing when no one is using them.",
  sections: [
    { title: "The Storage Revolution",
      html: "<p>Part I's structures were shaped by a brutal constraint: random I/O costs milliseconds. <strong>NVMe SSDs</strong> rewrote it — millions of IOPS, microsecond latency, and massive internal parallelism that rewards <em>many concurrent</em> requests over carefully minimized ones. Consequences ripple everywhere: the B-Tree-vs-LSM gap narrows (random reads stopped being scary); the bottleneck moves from the device to the software above it — which is why kernel-bypass interfaces (<code>io_uring</code>, SPDK) and thread-per-core engines exist.</p>" +
      "<p><strong>Zoned storage</strong> (ZNS) exposes flash's true nature — append-only zones, no in-place overwrite — letting the database own placement and garbage collection instead of fighting the FTL: Chapter 10's log-stacking argument, now a shipping standard. <strong>Persistent memory</strong> in its byte-addressable form (Optane) came and went commercially, but its legacy shipped: <strong>CXL</strong> is bringing memory pooling and tiering, and the recovery techniques designed for it inform WAL-free designs.</p>" +
      "<p>Meanwhile networks quietly passed disks: with 100–400 Gbps and <strong>RDMA</strong> (reading a remote machine's memory without its CPU), \"remote\" stopped implying \"slow\" — the prerequisite for everything below.</p>" },

    { title: "Disaggregation: The Log Is the Database",
      html: "<p>The signature cloud-database move is <strong>separating compute from storage</strong> — not as a deployment detail, but as a redesign of Part I's contract.</p>" +
      "<p><strong>Aurora</strong> made the canonical argument: a traditional primary ships whole dirty pages <em>and</em> WAL <em>and</em> backups across the network — the same bytes many times. Instead, ship <em>only the WAL</em> to a purpose-built distributed storage service; the storage layer itself replays log records to materialize pages, replicates them 6 ways across 3 zones (surviving failures via quorum writes — Chapter 17's arithmetic), and serves any page version on demand. Compute nodes become nearly stateless page caches: crash recovery is fast (the log already lives in storage), replicas attach cheaply, and \"the log is the database\" stops being a metaphor.</p>" +
      "<div class='fig'><svg viewBox='0 0 760 250' xmlns='http://www.w3.org/2000/svg' font-family='Menlo,monospace'>" +
      "<rect x='120' y='25' width='150' height='48' rx='8' fill='#111a2e' stroke='#ffd166' stroke-width='2.5'/>" +
      "<text x='195' y='45' text-anchor='middle' fill='#ffd166' font-size='11'>primary compute</text><text x='195' y='62' text-anchor='middle' fill='#7d8fb0' font-size='9'>≈ stateless page cache</text>" +
      "<rect x='320' y='25' width='130' height='48' rx='8' fill='#111a2e' stroke='#4f7cff' stroke-width='2'/>" +
      "<text x='385' y='45' text-anchor='middle' fill='#c9d6ea' font-size='11'>read replica</text><text x='385' y='62' text-anchor='middle' fill='#7d8fb0' font-size='9'>attaches in seconds</text>" +
      "<rect x='500' y='25' width='130' height='48' rx='8' fill='#111a2e' stroke='#4f7cff' stroke-width='2'/>" +
      "<text x='565' y='45' text-anchor='middle' fill='#c9d6ea' font-size='11'>read replica</text><text x='565' y='62' text-anchor='middle' fill='#7d8fb0' font-size='9'>same bytes below</text>" +
      "<line x1='195' y1='73' x2='195' y2='108' stroke='#ff5d73' stroke-width='2.5'/><polygon points='195,114 189,102 201,102' fill='#ff5d73'/>" +
      "<text x='215' y='97' fill='#ff5d73' font-size='10.5'>WAL records ONLY — no page shipping</text>" +
      "<rect x='60' y='118' width='640' height='94' rx='10' fill='#0c1220' stroke='#2de2ff' stroke-width='2'/>" +
      "<text x='380' y='138' text-anchor='middle' fill='#2de2ff' font-size='11'>distributed storage service — replays the log into pages</text>" +
      "<rect x='85' y='150' width='80' height='44' rx='6' fill='#111a2e' stroke='#3ddc97'/><text x='125' y='176' text-anchor='middle' fill='#7d8fb0' font-size='9.5'>node 1</text>" +
      "<rect x='175' y='150' width='80' height='44' rx='6' fill='#111a2e' stroke='#3ddc97'/><text x='215' y='176' text-anchor='middle' fill='#7d8fb0' font-size='9.5'>node 2</text>" +
      "<rect x='290' y='150' width='80' height='44' rx='6' fill='#111a2e' stroke='#3ddc97'/><text x='330' y='176' text-anchor='middle' fill='#7d8fb0' font-size='9.5'>node 3</text>" +
      "<rect x='380' y='150' width='80' height='44' rx='6' fill='#111a2e' stroke='#3ddc97'/><text x='420' y='176' text-anchor='middle' fill='#7d8fb0' font-size='9.5'>node 4</text>" +
      "<rect x='495' y='150' width='80' height='44' rx='6' fill='#111a2e' stroke='#3ddc97'/><text x='535' y='176' text-anchor='middle' fill='#7d8fb0' font-size='9.5'>node 5</text>" +
      "<rect x='585' y='150' width='80' height='44' rx='6' fill='#111a2e' stroke='#3ddc97'/><text x='625' y='176' text-anchor='middle' fill='#7d8fb0' font-size='9.5'>node 6</text>" +
      "<text x='170' y='207' text-anchor='middle' fill='#7d8fb0' font-size='9.5'>AZ 1</text><text x='375' y='207' text-anchor='middle' fill='#7d8fb0' font-size='9.5'>AZ 2</text><text x='580' y='207' text-anchor='middle' fill='#7d8fb0' font-size='9.5'>AZ 3</text>" +
      "<text x='380' y='238' text-anchor='middle' fill='#7d8fb0' font-size='10.5'>6 copies · write quorum 4/6 · read quorum 3/6 — an AZ can vanish and the log survives</text>" +
      "</svg><div class='fig-cap'>Aurora's redesign of Part I's contract: compute nodes keep only caches, the WAL is the sole thing shipped downward, and the storage tier itself runs recovery's redo logic to materialize any page on demand — replicated 6 ways by exactly the quorum arithmetic of Chapter 17. Kill the primary and a replacement replays nothing: the log was already the database.</div></div>" +
      "<p>The pattern generalizes: page-server architectures (Socrates/Hyperscale, Neon) split compute, log service, and page service into independent tiers; Neon adds <strong>copy-on-write branching</strong> of entire databases (Chapter 9's trick at database scale — a dev branch of production in seconds). <strong>Serverless</strong> databases push elasticity to its limit: scale-to-zero, per-request pricing, compute that wakes on demand — with cold starts and connection management as the visible seams.</p>" },

    { title: "HTAP and the In-Process Counterrevolution",
      html: "<h3>HTAP: One Database, Both Workloads</h3>" +
      "<p>The OLTP/OLAP split (Chapter 13) is an ETL pipeline and a day of staleness. <strong>HTAP</strong> systems host both: writes land in a row store, a columnar copy is maintained continuously (TiDB's replicas learn columnar via Raft; SingleStore and AlloyDB keep dual formats), and the optimizer routes each query to the right representation. The dream is analytics on <em>live</em> data with zero pipelines; the fine print is paying for both formats and isolating scan storms from transaction latency.</p>" +
      "<h3>Embedded & In-Process</h3>" +
      "<p>The opposite rebellion drops the server entirely. <strong>SQLite</strong> proved a full ACID database can be a library and became the most deployed software on the planet; <strong>DuckDB</strong> did the same for analytics — a vectorized columnar engine (Chapters 12–13) inside your Python process, querying Parquet on a laptop at speeds that embarrass small clusters. Together with edge-replicated SQLite derivatives, they mark a real architectural option: <em>not everything needs a server</em>.</p>" +
      "<div class='callout'>The through-line of the chapter: every layer of Part I — the WAL, the page, copy-on-write, the LSM — reappears at cloud scale as a <em>service</em>. Internals don't die; they get an API.</div>" }
  ],
  terms: [
    { t: "NVMe", d: "SSDs on a parallel protocol: millions of IOPS at microsecond latency — the end of the seek-time era." },
    { t: "io_uring / kernel bypass", d: "Async I/O interfaces that stop the OS from being the bottleneck NVMe exposed." },
    { t: "zoned storage (ZNS)", d: "Drives exposing append-only zones so the database, not the FTL, owns placement and GC." },
    { t: "RDMA", d: "Reading remote memory without the remote CPU — the fabric that makes disaggregation fast." },
    { t: "CXL", d: "The interconnect bringing pooled, tiered memory across devices and hosts." },
    { t: "disaggregated storage", d: "Compute and storage as independent tiers, scaled and billed separately." },
    { t: "log-as-database (Aurora)", d: "Ship only WAL to smart storage that materializes pages and replicates by quorum." },
    { t: "page server", d: "A dedicated tier (Socrates, Neon) serving page versions rebuilt from the log." },
    { t: "serverless database", d: "Scale-to-zero compute, per-use pricing — elasticity with cold-start seams." },
    { t: "HTAP", d: "Hybrid transactional/analytical processing: row and columnar copies of the same live data." },
    { t: "DuckDB / SQLite", d: "The in-process option: a full engine as a library — no server, no ops." }
  ],
  quiz: [
    { type: "mc", q: "Aurora ships only WAL records to its storage layer. Why is that enough to serve any page read?",
      opts: ["Pages never change once they are created, so the storage layer keeps only the first one of each page", "The log describes every change; storage replays it to materialize any page version on demand", "The compute nodes keep every page they have ever read, so nothing is requested twice from storage", "Reads never need whole pages, only the rows"], a: 1,
      why: "Redo logic moves into the storage service: the log is the authoritative database, pages are just its cached materializations — Chapter 8's recovery insight as an architecture." },
    { type: "mc", q: "NVMe drives deliver millions of IOPS. What does that change about B-Tree vs LSM trade-offs?",
      opts: ["Nothing changes; the trade-offs are structural and hold at any storage speed at all, whatever the storage underneath them happens to be capable of now", "Random-read penalties shrink, narrowing LSM's write advantage and softening read-amplification costs; software overhead becomes the bottleneck", "B-Trees stop working once the drive is this fast, since the descent cannot be pipelined the way it could when the seek dominated everything else", "LSMs no longer need compaction, because the reads over many runs are cheap enough now for the read path to absorb without any merging at all"], a: 1,
      why: "Both structures were shaped by 'random I/O is ruinous.' When it isn't, the calculus reweights — and CPU/software efficiency dominates." },
    { type: "mc", q: "What makes Neon-style copy-on-write branching of a whole database cheap?",
      opts: ["It gzips the data files before the branch is taken and unzips them on first read into the page cache", "A branch shares all existing pages and diverges only via new WAL — Chapter 9's CoW trick at database scale", "It skips the indexes on the branch", "Branches are read-only by design"], a: 1,
      why: "Nothing is copied at branch time; both timelines reference the same immutable history and write their own deltas." },
    { type: "mc", q: "What is the honest cost of HTAP's 'no more ETL' promise?",
      opts: ["It cannot run SQL over the analytical side, so a second query language has to be learned, so a second query language has to be learned and maintained", "Storing/maintaining two representations of the data, plus isolating analytical scan storms from transactional latency", "It only works while everything fits on one node", "Analytics become stale by a day or more"], a: 1,
      why: "The columnar copy is continuously maintained — that's storage and write amplification — and resource isolation between the two workloads is the perpetual engineering war." }
  ]
});

/* ======================= CHAPTER 22 ======================= */
CHAPTERS.push({
  num: 24, part: 4, title: "The Great Databases: A Field Guide",
  blurb: "Now that you know the building blocks, this chapter goes database by database and shows how the real, popular ones are actually put together: Postgres, MySQL, SQLite, MongoDB, Cassandra, DynamoDB, Redis, Spanner, ClickHouse, Snowflake, and more. For each one you'll see which design choices from earlier chapters it made and what those choices cost. It's the chapter that ties all the theory back to the names you'll actually run into at work.",
  sections: [
    { title: "The Relational Workhorses: PostgreSQL, MySQL, SQLite",
      html: "<h3>PostgreSQL</h3>" +
      "<p>The default choice of the modern stack, and a walking tour of this site: <strong>heap tables</strong> (Chapter 1) with B-Tree secondary indexes pointing at physical row locations; <strong>MVCC</strong> (Chapter 8) implemented by keeping old row versions <em>in the heap itself</em> — every UPDATE writes a new version, and <strong>VACUUM</strong> (Chapter 7's maintenance, elevated to a lifestyle) reclaims the dead ones. Miss vacuum tuning at scale and you learn about table bloat and transaction-ID wraparound personally. A WAL with PITR, streaming and logical replication, and the killer feature: the <em>extension ecosystem</em> — PostGIS, pgvector, TimescaleDB — that lets one boring engine absorb specialist workloads (Chapter 2's convergence argument, embodied).</p>" +
      "<h3>MySQL / InnoDB</h3>" +
      "<p>The web's incumbent. InnoDB makes the opposite layout bet: tables are <strong>index-organized</strong> — the primary key's B-Tree <em>contains</em> the rows (Chapter 1), so PK lookups are one structure deep, secondary indexes point at PKs (Chapter 1's indirection trade), and PK choice is a physical-design decision. MVCC via <strong>undo logs</strong> (old versions reconstructed on demand rather than left in place — no vacuum, different bloat), plus a redo log and change buffering. Its replication story made it the original scale-out workhorse of the web.</p>" +
      "<h3>SQLite</h3>" +
      "<p>Not a small database — a <em>different location</em> for one: an in-process library, one file on disk, B-Trees within (Chapter 6's slotted pages, textbook clean), transactions via rollback journal or WAL mode. Single-writer-many-readers concurrency, zero administration, absurd reliability. It's in every phone, browser, and plane; the correct choice more often than server habit admits.</p>" },

    { title: "The Dynamo Lineage & Documents: Cassandra, DynamoDB, MongoDB",
      html: "<h3>Cassandra & DynamoDB</h3>" +
      "<p>Children of the Dynamo design, which you now know piece by piece: <strong>consistent-hash partitioning</strong> (Chapter 21), <strong>leaderless replication with tunable R/W quorums</strong> (Chapter 17), <strong>hinted handoff and read repair and Merkle anti-entropy</strong> (Chapter 18), over an <strong>LSM storage engine</strong> with SSTables and Bloom filters (Chapter 10). Cassandra is the self-hosted embodiment: wide-column model, tables designed per query, masterless multi-datacenter writes. DynamoDB is the managed descendant: single-digit-millisecond guarantees at any scale, provisioned or on-demand capacity — in exchange for designing everything around partition keys and living without joins. Both punish hot partitions (Chapter 21's celebrity problem) mercilessly.</p>" +
      "<h3>MongoDB</h3>" +
      "<p>The document model (Chapter 2) grown up: BSON documents in <strong>WiredTiger</strong> — which you met in Chapter 9 as the lazy B-Tree with update buffers and MVCC. Replica sets run a Raft-like election (Chapter 20) with an <strong>oplog</strong> that secondaries tail (and CDC consumers love); sharding routes by shard key through config servers and mongos routers (Chapter 21's directory pattern). Modern versions added multi-document transactions; the idiomatic power remains aggregate-shaped data where one document = one atomic read.</p>" },

    { title: "The Building Blocks: Redis & RocksDB",
      html: "<h3>Redis</h3>" +
      "<p>An in-memory data-structure server (Chapter 1's memory-based store): strings, hashes, sorted sets, streams, served from a <strong>single-threaded event loop</strong> — no locks, no contention, microsecond latency, and every operation trivially atomic because nothing interleaves. Durability à la carte: RDB snapshots plus an <strong>AOF</strong> — an append-only command log, snapshot-compacted — which is precisely Chapter 1's log+checkpoint recipe. Redis Cluster shards by hash slots (Chapter 21's virtual buckets). The eternal caution: as a cache it's superb; as a primary store, read the durability fine print twice.</p>" +
      "<h3>RocksDB</h3>" +
      "<p>Not an app database but the <em>engine inside</em> everything: the LSM tree of Chapter 10 as an embeddable library — memtables, leveled/tiered compaction, Bloom filters, column families, all tunable. It powers MyRocks (MySQL), CockroachDB's early storage, TiKV, Kafka Streams state, Flink checkpoints… Learn RocksDB's knobs and you've learned the practical surface of every LSM lesson in Part I.</p>" },

    { title: "Planet-Scale SQL: Spanner & CockroachDB",
      html: "<h3>Spanner</h3>" +
      "<p>Chapter 19's headline act, seen whole: data split into ranges, <strong>each range a Paxos group</strong> (Chapter 20); transactions across ranges via 2PC <em>over</em> those fault-tolerant groups (defusing the blocking problem); and <strong>TrueTime</strong> — GPS-and-atomic-clock time with explicit uncertainty — letting commits wait out the ambiguity to achieve external consistency planet-wide. The lesson in one line: pay for extraordinary infrastructure (clocks!), buy back the strongest guarantees at global scale.</p>" +
      "<h3>CockroachDB</h3>" +
      "<p>The same shape without the exotic hardware: ranges replicated by <strong>Raft</strong>, SQL compiled onto a distributed KV layer, <strong>hybrid logical clocks</strong> (Chapter 17's logical clocks fused with physical time) substituting for TrueTime at the cost of slightly weaker/slower cross-range guarantees, and geo-partitioning (Chapter 21) as a first-class schema feature. TiDB and YugabyteDB play in the same family with different accents (TiDB adding the HTAP columnar tier from Chapter 23).</p>" },

    { title: "The Analytics Champions: ClickHouse, Snowflake, BigQuery, DuckDB",
      html: "<p>Chapter 13's ideas, specialized four ways:</p>" +
      "<ul><li><strong>ClickHouse</strong> — columnar + vectorized + <em>LSM-style merging parts</em>, built for real-time: billions of rows/sec scanned, data queryable seconds after ingest. Sparse primary indexes and aggressive skipping; the choice for live dashboards and event analytics.</li>" +
      "<li><strong>Snowflake</strong> — the separated-storage-and-compute warehouse perfected: data in immutable micro-partitions on object storage (zone maps everywhere), independent virtual warehouses per team, time travel via snapshot metadata (MVCC economics at warehouse scale), zero knobs as a product philosophy.</li>" +
      "<li><strong>BigQuery</strong> — the serverless extreme (from the Dremel lineage): no clusters at all; queries fan out across thousands of workers reading a columnar store, and you pay per byte scanned. Partitioning and clustering exist to shrink exactly that bill.</li>" +
      "<li><strong>DuckDB</strong> — all of Chapter 13 in a library on your laptop, querying Parquet in place. The reminder that 'big data' below a few hundred gigabytes is usually a single-machine problem wearing a costume.</li></ul>" +
      "<div class='callout'>Field-guide method: for any database you meet, ask Chapter 1's three questions — buffered how? mutable or immutable? ordered how? — then find its replication (Part III) and its consistency contract. Every system above answered those five questions; the answers <em>are</em> the product.</div>" }
  ],
  terms: [
    { t: "heap + VACUUM (Postgres)", d: "MVCC keeps dead row versions in the heap; vacuum reclaims them — tune it or meet bloat." },
    { t: "index-organized table (InnoDB)", d: "Rows live inside the primary-key B-Tree; secondaries point at PKs." },
    { t: "oplog (MongoDB)", d: "The replica set's replication log — tailed by secondaries and CDC consumers alike." },
    { t: "Dynamo lineage", d: "Consistent hashing + leaderless quorums + anti-entropy + LSM: Cassandra, DynamoDB, Riak." },
    { t: "partition key discipline", d: "In Dynamo-style stores, access patterns must be designed around keys — hot partitions are the failure mode." },
    { t: "single-threaded event loop (Redis)", d: "No interleaving ⇒ every operation atomic, no locks — and one CPU is the ceiling." },
    { t: "AOF", d: "Redis's append-only command log with snapshot compaction — the log+checkpoint durability recipe." },
    { t: "RocksDB", d: "The embeddable LSM engine inside dozens of other systems — Part I's Chapter 10 as a library." },
    { t: "range + consensus group", d: "Spanner/CockroachDB unit: each data range is its own Paxos/Raft group." },
    { t: "hybrid logical clock", d: "Physical time fused with logical counters — TrueTime's guarantees, approximated without atomic clocks." },
    { t: "micro-partitions (Snowflake)", d: "Immutable columnar chunks on object storage with pervasive zone maps and time travel." }
  ],
  quiz: [
    { type: "mc", q: "Postgres UPDATEs a row 1M times a day and autovacuum is disabled. What happens?",
      opts: ["Nothing; Postgres updates the row in place and leaves no older version behind it, so there is nothing for a vacuum to reclaim afterwards", "Dead row versions accumulate (bloat), scans slow, and transaction-ID wraparound eventually threatens the database", "The write-ahead log shrinks, since the updates all touch one row over and over again throughout the day", "The indexes repair themselves on the next scan"], a: 1,
      why: "Postgres MVCC writes a new version per update and leaves the old in the heap; VACUUM is the garbage collector the design depends on." },
    { type: "mc", q: "In InnoDB, why is choosing a random UUID as primary key a physical-design mistake?",
      opts: ["UUIDs are too long to index efficiently at this row count, and the wider key inflates every secondary index that references it as well", "Rows live in the PK B-Tree, so random keys spray inserts across all pages — no right-only append fast path, endless page splits", "UUIDs cannot be compared for ordering, so the tree cannot decide which of two rows comes first in the clustered index", "Secondary indexes stop working entirely once the primary key stops being monotonic in the table that they point back into"], a: 1,
      why: "Index-organized tables make PK order the physical order; monotonic keys append (Chapter 7's optimization), random keys shatter locality." },
    { type: "mc", q: "Which parts of this site do you need to fully explain Cassandra? ",
      opts: ["Only the LSM storage chapter is needed, since the rest is standard replication on top of it of the storage engine", "Consistent hashing, tunable quorums, hinted handoff/Merkle repair, and LSM storage — Chapters 10, 17, 18, 21 assembled", "Only the consensus chapter is needed", "None of them; it is proprietary"], a: 1,
      why: "Cassandra is the Dynamo paper's design shipping in the open: nearly every mechanism has its own chapter here." },
    { type: "mc", q: "Why can Redis guarantee atomicity of each operation without any locks?",
      opts: ["It uses MVCC under the covers, so each command sees its own snapshot", "A single-threaded event loop means operations never interleave", "It locks the whole dataset per command", "It is not in fact atomic at all"], a: 1,
      why: "One thread, one operation at a time: concurrency control by not having concurrency — and microsecond latency because everything is in memory." },
    { type: "mc", q: "Spanner and CockroachDB both replicate ranges via consensus. What does Spanner's TrueTime buy that HLCs approximate?",
      opts: ["Faster disk writes across the replicas, which is what shortens the commit path, and a shorter commit path is what the ordering rests on", "External consistency: commit-timestamp order provably matches real-time order, via waiting out bounded clock uncertainty", "Cheaper storage for the replicated ranges, which is where most of the cost of a geo-replicated cluster sits", "Automatic sharding of the key space"], a: 1,
      why: "Bounded, hardware-backed clock uncertainty lets Spanner make real-time ordering guarantees; hybrid logical clocks get close without the atomic clocks, with weaker edges." }
  ]
});

/* ======================= CHAPTER 23 ======================= */
CHAPTERS.push({
  num: 25, part: 4, title: "Choosing and Evolving Your Database",
  blurb: "Sooner or later you have to actually pick a database, and later you may have to move off it, and both are high-stakes decisions. This chapter gives you a clear way to think through the choice based on your real needs, warns you about the tricks that make benchmark numbers lie, and lays out a step-by-step plan for moving from one database to another without losing data or taking downtime. It also weighs the real costs of running a database yourself versus paying a cloud provider to run it for you.",
  sections: [
    { title: "A Decision Framework That Isn't a Vibe", viz: "dbcompare", vizTitle: "Workload → candidate systems",
      html: "<p>Database choices are workload questions wearing a technology costume. Force the requirements into writing <em>before</em> naming products:</p>" +
      "<ul><li><strong>Shape</strong> — entities and joins? aggregates? key-value? traversals? time series? text? vectors? (Chapter 2 is the menu.)</li>" +
      "<li><strong>Consistency</strong> — which operations truly need linearizability or serializable transactions, and which tolerate staleness? Be honest per-operation; \"everything must be strongly consistent\" usually means \"we haven't thought about it.\" (Chapter 17.)</li>" +
      "<li><strong>Scale & latency</strong> — real numbers with a growth curve: GB or TB? reads:writes? p99 targets? One box handles more than pride admits (Chapter 21's ladder).</li>" +
      "<li><strong>Operations & team</strong> — who's on call? Managed vs self-hosted is often the biggest term in the equation. What does the team already run well at 3 a.m.?</li>" +
      "<li><strong>Ecosystem & exit</strong> — drivers, tooling, hiring pool — and the cost of leaving. Open formats and standard SQL are exit doors; proprietary APIs are moats (someone else's).</li></ul>" +
      "<p>Then apply the tiebreaker that ages best — <strong>boring technology</strong>: every novel database is a spend from a finite innovation budget; spend it where your product differentiates, and default to the proven, dull choice everywhere else. Try the workload picker above and see how often the boring answer survives.</p>" },

    { title: "Benchmarks: How Numbers Lie",
      html: "<p>Every vendor benchmark is true and none are relevant. The classic distortions:</p>" +
      "<ul><li><strong>Wrong workload</strong> — YCSB-style uniform key-value ops predict nothing about your join-heavy, skewed, 99%-read reality. Benchmark <em>your</em> queries on <em>your</em> data distribution — skew included (Chapter 21's hot keys ruin uniform-benchmark projections).</li>" +
      "<li><strong>Durability off</strong> — the oldest trick: async commit / fsync disabled makes any database look heroic (Chapter 8 told you why). Check the write-acknowledgment settings first.</li>" +
      "<li><strong>Warm everything</strong> — data fits in RAM, caches pre-heated, one client at the target concurrency. Production is cold caches, compaction storms, vacuum debt, noisy neighbors — steady-state numbers after <em>hours</em>, not the first glorious minute.</li>" +
      "<li><strong>Averages</strong> — report p99/p999 under sustained mixed load or report nothing (Chapter 22).</li></ul>" +
      "<p>The meta-rule: a benchmark is an experiment; without your workload's shape, skew, durability settings, and failure injection, it measures the marketing department.</p>" },

    { title: "The Migration Playbook",
      html: "<p>Sooner or later you outgrow, or regret, a choice. Migrations don't fail at the copy step; they fail at the <em>cutover</em>. The playbook that doesn't lose data:</p>" +
      "<ol><li><strong>Backfill</strong> — bulk-copy history to the new system while the old keeps serving.</li>" +
      "<li><strong>Continuous sync</strong> — CDC (Chapter 21) streams every new change from old to new; the copy converges and stays converged.</li>" +
      "<li><strong>Verify</strong> — checksum-compare continuously (Merkle-style range digests — Chapter 18 — make it cheap). Silent divergence discovered at cutover is the disaster scenario.</li>" +
      "<li><strong>Shadow reads</strong> — serve from the old, mirror reads to the new, compare results and latency in production silence.</li>" +
      "<li><strong>Cut over reads, then writes</strong> — gradually, per cohort, with the reverse CDC path primed so rollback stays possible.</li>" +
      "<li><strong>Retire</strong> — only after the new system has survived real traffic and a real incident.</li></ol>" +
      "<p>Anti-patterns: the big-bang weekend cutover (no rollback, all risk at once) and long-term <em>application-level dual-writes</em> (Chapter 21 explained why they desync; if you must dual-write, bound its lifetime and verify relentlessly). For strangling a monolith table-by-table, the same loop applies per slice.</p>" },

    { title: "Build, Buy, Manage — and the Long Game",
      html: "<h3>The Economics</h3>" +
      "<p><strong>Building</strong> a database (or heavily forking one) is justified at the margins where nothing fits — and it's a permanent staffing commitment, not a project. <strong>Managed services</strong> trade money for the on-call rotation, backups, patching, and failover drills of Chapter 22; below significant scale that trade is nearly always right. <strong>Self-hosting</strong> wins on cost at scale, on data-residency edges, and when you need knobs the service hides — priced honestly, including the engineers.</p>" +
      "<p><strong>Lock-in</strong> is a gradient, not a sin: standard SQL on managed Postgres is an easy exit; a proprietary API woven through every service is a costly one. Pay for lock-in knowingly, in exchange for real leverage — never by accident.</p>" +
      "<h3>Total Cost, Actually Totaled</h3>" +
      "<p>Instance bills are the visible fraction. Add storage growth (with replication factor), cross-AZ/region traffic (quietly enormous), backup retention, licenses — and the dominant term, engineering time: migrations, upgrades, incident load, the learning curve of each additional system in the polyglot estate (Chapter 2's warning, invoiced).</p>" +
      "<h3>Principles That Age Well</h3>" +
      "<ul><li>Model the data before choosing the database; the questions you'll ask matter more than the data you have.</li>" +
      "<li>One boring relational database is the right default until a <em>measured</em> workload says otherwise.</li>" +
      "<li>Keep the exit door visible: open formats, standard interfaces, tested restores, rehearsed migrations.</li>" +
      "<li>Consistency requirements are per-operation business decisions — write them down.</li>" +
      "<li>The database outlives the app that chose it. Choose like it's infrastructure, because it is.</li></ul>" }
  ],
  terms: [
    { t: "innovation budget", d: "The finite novelty a team can absorb — spend it on differentiators, not on exotic infrastructure." },
    { t: "boring technology", d: "The strategy of defaulting to proven, well-understood systems whose failure modes are documented." },
    { t: "YCSB", d: "The standard key-value benchmark — and a poor proxy for join-heavy, skewed, real workloads." },
    { t: "durability fine print", d: "Async commit and disabled fsync: the classic way benchmark numbers are inflated." },
    { t: "shadow reads", d: "Mirroring production reads to the new system and comparing silently before cutover." },
    { t: "CDC-based migration", d: "Backfill + continuous change streaming + verification: convergence without a big-bang cutover." },
    { t: "reverse sync", d: "The primed old←new CDC path that keeps rollback possible after cutover." },
    { t: "lock-in gradient", d: "Exit cost as a spectrum — standard SQL is a door, proprietary APIs are a moat." },
    { t: "total cost of ownership", d: "Instances + storage×replication + traffic + backups + the engineers — the last term dominates." }
  ],
  quiz: [
    { type: "mc", q: "A vendor benchmark shows 1M writes/sec. What's the FIRST thing to check?",
      opts: ["The programming language the benchmark harness was written in, since a faster runtime flatters the numbers", "Whether durability was on — sync commit, fsync per write — and whether the workload resembles yours", "The colour scheme used in the graphs, which tell you how much of it is marketing rather than measurement", "The number of CPU cores on the box, since more of them inflates the headline figure on a box nobody runs"], a: 1,
      why: "Async-durability benchmarks measure RAM speed and marketing. Then: your query shapes, your skew, sustained load, p99 — or the number predicts nothing." },
    { type: "mc", q: "Mid-migration, the new database silently diverges from the old. Which playbook step exists to catch this?",
      opts: ["The big-bang cutover at the end, once everything else is done", "Continuous checksum/range-digest verification while CDC syncs", "Dropping the old database sooner", "Shadow writes to both systems"], a: 1,
      why: "Verification (Merkle-style digests make it cheap) runs the whole time — divergence must be caught while the old system is still authoritative." },
    { type: "mc", q: "Why do experienced architects default to 'boring' databases?",
      opts: ["Novelty is expensive: unknown failure modes, thin hiring pools, immature tooling — spend innovation where the product differentiates", "New databases are always slower than established ones at the same workload, because the newer engine has not had its hot paths tuned yet", "Boring databases are free to license and to run", "Compliance regimes require one of them"], a: 0,
      why: "Every system has failure modes; boring ones have documented failure modes and a decade of Stack Overflow. The innovation budget is real and finite." },
    { type: "mc", q: "When is self-hosting a database the right call over a managed service?",
      opts: ["Always; a managed service is rent paid on hardware you could own outright, and the rent never stops for as long as the service runs", "At scale where the margin is material, at residency/compliance edges, or when you need hidden knobs — priced including the engineers", "Never; the managed option is the right call in every situation", "Only for NoSQL stores"], a: 1,
      why: "It's an economics question that flips with scale and constraints; the honest calculation includes the on-call humans, not just the instances." },
    { type: "order", q: "Order the zero-drama migration:",
      items: ["Backfill historical data", "CDC keeps the copy in sync + continuous verification", "Shadow reads compare silently in production", "Cut over gradually with reverse sync primed", "Retire the old system"],
      why: "Copy, converge, verify, rehearse, then cut — with a rollback path alive at every step." }
  ]
});

/* ======================= CHAPTER 24 ======================= */
CHAPTERS.push({
  num: 26, part: 4, title: "Using the Database: The Backend Engineer's Handbook",
  blurb: "This is the practical chapter about the database code you actually write in a backend app. We'll cover connection pools (and the surprising fact that smaller ones often perform better), how to set timeouts so a slow query can't take down your service, how to safely retry a failed write without accidentally charging a customer twice, the 'N+1' mistake that quietly makes pages slow, how to page through millions of rows without grinding to a halt, and why the network trip to the database, not the query itself, is usually what's slow.",
  sections: [
    { title: "The Life and Cost of a Connection",
      html: "<p>Everything this site has explained — B-Trees, WALs, consensus — is reached from your application through one humble object: a <strong>database connection</strong>. Treating it casually is the most common way good backends go bad.</p>" +
      "<p>A connection is expensive to <em>create</em>: a TCP handshake, usually a TLS handshake, authentication, and server-side session setup — tens to hundreds of milliseconds before the first query, and painfully more cross-region. And it's expensive to <em>keep</em>: in PostgreSQL every connection is a whole <strong>backend process</strong> holding its own memory (a single sort can consume a full <code>work_mem</code> <em>per connection running it</em>); in most engines it's at least a thread plus buffers. A database \"supporting 5,000 connections\" is not 5,000 workers — it's a few dozen truly-active queries and thousands of expensive bystanders forcing context switches.</p>" +
      "<div class='fig'><svg viewBox='0 0 760 190' xmlns='http://www.w3.org/2000/svg' font-family='Menlo,monospace'>" +
      "<line x1='60' y1='95' x2='710' y2='95' stroke='#1c2a45' stroke-width='2'/><polygon points='716,95 704,89 704,101' fill='#1c2a45'/>" +
      "<rect x='70' y='78' width='120' height='34' rx='6' fill='#111a2e' stroke='#4f7cff' stroke-width='2'/><text x='130' y='99' text-anchor='middle' fill='#c9d6ea' font-size='10.5'>TCP handshake</text>" +
      "<text x='130' y='130' text-anchor='middle' fill='#7d8fb0' font-size='9.5'>1 RTT</text>" +
      "<rect x='200' y='78' width='140' height='34' rx='6' fill='#111a2e' stroke='#4f7cff' stroke-width='2'/><text x='270' y='99' text-anchor='middle' fill='#c9d6ea' font-size='10.5'>TLS handshake</text>" +
      "<text x='270' y='130' text-anchor='middle' fill='#7d8fb0' font-size='9.5'>1–2 RTTs + crypto</text>" +
      "<rect x='350' y='78' width='140' height='34' rx='6' fill='#111a2e' stroke='#4f7cff' stroke-width='2'/><text x='420' y='99' text-anchor='middle' fill='#c9d6ea' font-size='10.5'>auth + session setup</text>" +
      "<text x='420' y='130' text-anchor='middle' fill='#7d8fb0' font-size='9.5'>password/cert · fork backend</text>" +
      "<rect x='500' y='78' width='110' height='34' rx='6' fill='#111a2e' stroke='#3ddc97' stroke-width='2.5'/><text x='555' y='99' text-anchor='middle' fill='#3ddc97' font-size='10.5'>first query!</text>" +
      "<text x='555' y='130' text-anchor='middle' fill='#7d8fb0' font-size='9.5'>often &lt; 1 ms itself</text>" +
      "<text x='340' y='35' text-anchor='middle' fill='#ffd166' font-size='12'>tens of milliseconds of ceremony before microseconds of work</text>" +
      "<text x='340' y='55' text-anchor='middle' fill='#7d8fb0' font-size='10.5'>connect-per-request pays this on EVERY request — a pool pays it once per connection lifetime</text>" +
      "<text x='660' y='125' text-anchor='middle' fill='#ff5d73' font-size='9.5'>× every request?!</text>" +
      "</svg><div class='fig-cap'>Why connect-per-request is a bug, drawn to (rough) scale: the setup ceremony dwarfs a typical indexed query by 10–100×. Pools exist to pay the ceremony rarely and amortize it over thousands of queries.</div></div>" +
      "<div class='callout'>The two rules that follow from the physics: never connect per request, and never let one query hold a connection longer than it needs — everything else in this chapter is a footnote to these.</div>" },

    { title: "Connection Pools in Practice", viz: "pool", vizTitle: "Connection pool under load: exhaustion, queueing, leaks",
      html: "<p>A <strong>connection pool</strong> keeps a fixed set of ready connections; requests borrow one, run their queries, and return it. The counterintuitive craft is in the sizing:</p>" +
      "<h3>Small Pools Win</h3>" +
      "<p>The database can only truly execute about as many queries in parallel as it has CPU cores (plus a little slack for I/O waits). Every connection beyond that adds contention — more context switches, more latch conflicts (Chapter 8), more memory — while throughput <em>drops</em>. The classic starting point: <code>pool ≈ cores × 2 + effective_spindles</code> — for a 16-core server, ~30–40 connections, <em>total, across all app instances</em>. Teams routinely discover their \"we need 800 connections\" service runs faster on 30. Excess demand should wait <em>in the pool's queue</em> (cheap, ordered, observable) rather than inside the database (expensive, contended).</p>" +
      "<h3>Exhaustion, Leaks & the Saturation Spiral</h3>" +
      "<p>The pool is also your bulkhead, and its failure modes are predictable: a <strong>leak</strong> (code path that borrows and never returns — the forgotten <code>finally</code>) shrinks effective capacity until everything queues; a <strong>slow query</strong> under load occupies connections longer, which grows the queue, which times out requests, which triggers retries, which adds load — Chapter 14's cascading failure, reproduced in miniature inside your own process. Instrument three numbers: connections in use, requests waiting, and wait time. They're the earliest smoke alarm your backend has.</p>" +
      "<h3>External Poolers: PgBouncer and Friends</h3>" +
      "<p>When many services (or many serverless instances — Chapter 23) share one database, in-process pools multiply out of control: 50 instances × 20 connections is 1,000 backends. An <strong>external pooler</strong> (PgBouncer, RDS Proxy, Odyssey) sits in front and multiplexes thousands of client connections onto tens of real ones. Its <em>pooling mode</em> decides what still works:</p>" +
      "<ul><li><strong>Session mode</strong> — one server connection per client for its whole session. Safe and boring; multiplexes only idle clients.</li>" +
      "<li><strong>Transaction mode</strong> — a server connection is borrowed per <em>transaction</em>. This is where the big multiplexing wins live — and where <strong>session state breaks</strong>: prepared statements, <code>SET</code> variables, advisory locks, and temp tables all assume \"my connection\" is one connection. Your driver's settings must match, or you'll debug ghosts.</li>" +
      "<li><strong>Statement mode</strong> — borrowed per statement; multi-statement transactions don't work at all. For autocommit-only workloads.</li></ul>" },

    { title: "The Timeout Ladder",
      html: "<p>Every database call must have a bounded worst case — and one timeout is never enough, because failure has layers. The ladder, from innermost out:</p>" +
      "<ul><li><strong>Connect timeout</strong> — how long to wait for a new connection (TCP+TLS+auth). Fail fast; a down database should produce errors in seconds, not hang threads for minutes.</li>" +
      "<li><strong>Statement timeout</strong> — <em>server-side</em> cap on a single query's runtime (<code>statement_timeout</code> in Postgres). The one people forget, and the most important one on the list.</li>" +
      "<li><strong>Lock timeout</strong> — cap on <em>waiting for a lock</em> specifically (<code>lock_timeout</code>), so a migration or a stuck writer can't queue your whole app behind it (Chapter 22's DDL lesson).</li>" +
      "<li><strong>Idle-in-transaction timeout</strong> — kills sessions that opened a transaction and wandered off (<code>idle_in_transaction_session_timeout</code>); more on why in the next section.</li>" +
      "<li><strong>Request deadline</strong> — the application-level budget for the whole operation, which the inner timeouts must fit inside. Mature systems <em>propagate</em> the remaining budget: if the HTTP request has 300 ms left, don't start a query allowed to run for 5 s.</li></ul>" +
      "<div class='fig'><svg viewBox='0 0 760 235' xmlns='http://www.w3.org/2000/svg' font-family='Menlo,monospace'>" +
      "<rect x='60' y='30' width='640' height='180' rx='10' fill='#0c1220' stroke='#ffd166' stroke-width='2'/>" +
      "<text x='380' y='52' text-anchor='middle' fill='#ffd166' font-size='11.5'>request deadline · 1000 ms — the budget everything must fit inside</text>" +
      "<rect x='90' y='68' width='580' height='120' rx='8' fill='#111a2e' stroke='#4f7cff' stroke-width='2'/>" +
      "<text x='380' y='88' text-anchor='middle' fill='#4f7cff' font-size='11'>transaction / idle-in-transaction timeout · e.g. 5 s cap on open transactions</text>" +
      "<rect x='120' y='100' width='520' height='70' rx='7' fill='#0c1220' stroke='#2de2ff' stroke-width='2'/>" +
      "<text x='380' y='120' text-anchor='middle' fill='#2de2ff' font-size='11'>statement timeout · 500 ms — server kills the query itself</text>" +
      "<rect x='150' y='130' width='460' height='28' rx='6' fill='#111a2e' stroke='#3ddc97' stroke-width='2'/>" +
      "<text x='380' y='148' text-anchor='middle' fill='#3ddc97' font-size='10.5'>lock timeout · 100 ms — never queue long behind someone's lock</text>" +
      "<text x='380' y='226' text-anchor='middle' fill='#7d8fb0' font-size='10.5'>each ring must be smaller than the ring outside it — a 5 s statement timeout inside a 1 s deadline is a lie</text>" +
      "</svg><div class='fig-cap'>The ladder as nested budgets: inner timeouts must be strictly tighter than outer ones, or the outer deadline fires first and you learn nothing about what actually stalled.</div></div>" +
      "<h3>The Zombie Query</h3>" +
      "<p>Here's the trap that makes the <em>server-side</em> statement timeout non-negotiable: when your <em>client</em> times out, it abandons the socket — but the server doesn't know. The query keeps running, keeps holding locks, keeps burning CPU: a <strong>zombie</strong>. Under load, client timeouts plus retries can pile zombies onto an already-slow database until it collapses — the client-side timeout <em>caused</em> the outage it was meant to contain. Client timeouts protect your threads; only server-side timeouts (or explicit query cancellation, which good drivers send) protect the database.</p>" },

    { title: "Retries Without Regret: Ambiguity & Idempotency",
      html: "<p>A query failed. Run it again? For a <strong>read</strong>, almost always yes. For a <strong>write</strong>, the honest answer is: <em>it depends what \"failed\" means</em> — and this is Chapter 14's Two Generals problem arriving in your ORM.</p>" +
      "<div class='fig'><svg viewBox='0 0 760 225' xmlns='http://www.w3.org/2000/svg' font-family='Menlo,monospace'>" +
      "<text x='120' y='30' text-anchor='middle' fill='#c9d6ea' font-size='12'>your app</text>" +
      "<text x='640' y='30' text-anchor='middle' fill='#c9d6ea' font-size='12'>database</text>" +
      "<line x1='120' y1='40' x2='120' y2='205' stroke='#1c2a45' stroke-width='2'/>" +
      "<line x1='640' y1='40' x2='640' y2='205' stroke='#1c2a45' stroke-width='2'/>" +
      "<line x1='120' y1='55' x2='633' y2='75' stroke='#2de2ff' stroke-width='2'/><polygon points='639,75 627,71 629,81' fill='#2de2ff'/>" +
      "<text x='380' y='52' text-anchor='middle' fill='#2de2ff' font-size='10.5'>INSERT payment … COMMIT</text>" +
      "<rect x='648' y='85' width='100' height='26' rx='5' fill='#111a2e' stroke='#3ddc97' stroke-width='2'/><text x='698' y='102' text-anchor='middle' fill='#3ddc97' font-size='9.5'>committed ✓</text>" +
      "<line x1='640' y1='120' x2='420' y2='133' stroke='#3ddc97' stroke-width='2'/>" +
      "<text x='500' y='118' text-anchor='middle' fill='#3ddc97' font-size='10.5'>OK</text>" +
      "<text x='390' y='140' text-anchor='middle' fill='#ff5d73' font-size='13'>✕</text>" +
      "<text x='390' y='158' text-anchor='middle' fill='#ff5d73' font-size='10'>ack lost — network blip</text>" +
      "<text x='120' y='180' text-anchor='middle' fill='#ffd166' font-size='10.5'>app sees: timeout.</text>" +
      "<text x='120' y='196' text-anchor='middle' fill='#ffd166' font-size='10.5'>did it commit? UNKNOWABLE</text>" +
      "<text x='560' y='180' text-anchor='end' fill='#7d8fb0' font-size='10'>blind retry now = second payment row.</text>" +
      "<text x='560' y='196' text-anchor='end' fill='#7d8fb0' font-size='10'>the customer counts this differently than you do</text>" +
      "</svg><div class='fig-cap'>The ambiguous commit: the write succeeded but the acknowledgment died in transit. From the client's chair, 'timed out' and 'failed' are indistinguishable — so a retry policy that treats them the same will eventually double-charge someone.</div></div>" +
      "<p>The error taxonomy that keeps retries safe:</p>" +
      "<ul><li><strong>Definitely didn't execute</strong> (connection refused, pool timeout <em>before</em> sending) — retry freely.</li>" +
      "<li><strong>Definitely executed and failed deterministically</strong> (constraint violation, syntax error) — retrying is pointless; fix the input.</li>" +
      "<li><strong>Explicitly retryable</strong> — serialization failures (SQLSTATE <code>40001</code>) and deadlock victims (<code>40P01</code>): the database <em>asks</em> you to retry these; a serializable-isolation app without a retry loop is simply broken (Chapter 8).</li>" +
      "<li><strong>Ambiguous</strong> (timeout or dropped connection <em>after</em> sending a write) — retry only if the operation is <strong>idempotent</strong>.</li></ul>" +
      "<h3>Manufacturing Idempotency</h3>" +
      "<p>Idempotency rarely happens by accident; you build it in. Give the operation a client-generated <strong>idempotency key</strong> and let a unique constraint reject the duplicate (<code>INSERT … ON CONFLICT (request_id) DO NOTHING</code>) — the database's own uniqueness machinery (Chapter 11) becomes your dedupe. Or phrase writes as absolute states rather than deltas: <code>SET status='paid'</code> retries harmlessly; <code>SET balance = balance − 100</code> does not. Wrap it all in <strong>bounded retries with exponential backoff and jitter</strong> — synchronized, instant retries from a thousand clients are Chapter 21's stampede aimed at your own primary.</p>" },

    { title: "Transactions in Application Code",
      html: "<p>Chapter 8 explained transactions from the engine's side. From the application's side, one rule dominates everything: <strong>transactions must be short</strong>. An open transaction holds locks that block writers (and DDL — which then queues <em>everyone</em>, Chapter 22), pins its snapshot so MVCC garbage collection can't reclaim old versions (vacuum falls behind, bloat grows — Chapter 24's Postgres lesson), and occupies a pooled connection the whole time.</p>" +
      "<p>The classic violation is invisible in code review: open a transaction, and <em>inside it</em> call a payment API, send an email, or await anything on the open internet. Now your transaction's duration is coupled to someone else's p99. The session sits <strong>idle in transaction</strong> — holding locks and snapshot while doing nothing — which is exactly why the ladder's <code>idle_in_transaction_session_timeout</code> exists. The discipline: gather all inputs <em>first</em>, then begin → write → commit in one tight breath, then do the slow outward things after (the outbox pattern — Chapter 21 — exists precisely so \"tell the world\" can happen safely outside the transaction).</p>" +
      "<h3>Concurrent Updates: Optimistic and Pessimistic, In Practice</h3>" +
      "<p>Two users edit the same row. Chapter 8's theory becomes two working patterns:</p>" +
      "<ul><li><strong>Optimistic (version column)</strong> — add <code>version int</code>; update with <code>UPDATE … SET …, version = version + 1 WHERE id = ? AND version = ?</code>. Zero rows updated ⇒ someone got there first ⇒ reload and retry (or surface a conflict). No locks held during user think-time — which is why this is the <em>only</em> correct pattern when a human is between the read and the write.</li>" +
      "<li><strong>Pessimistic (<code>SELECT … FOR UPDATE</code>)</strong> — lock the rows up front when a conflict is near-certain and the critical section is short. Never across user interaction.</li></ul>" +
      "<h3>The Job-Queue Idiom: FOR UPDATE SKIP LOCKED</h3>" +
      "<p>The single most useful SQL trick most backend engineers don't know. A table of pending jobs, N workers: plain <code>FOR UPDATE</code> makes every worker queue behind the first (they all want the same next row). Add <strong><code>SKIP LOCKED</code></strong> and each worker atomically claims the next <em>unclaimed</em> row, skipping colleagues' locks entirely:</p>" +
      "<pre><code>UPDATE jobs SET state = 'running', claimed_by = $worker\nWHERE id = (\n  SELECT id FROM jobs WHERE state = 'queued'\n  ORDER BY created_at\n  FOR UPDATE SKIP LOCKED\n  LIMIT 1\n)\nRETURNING id, payload;</code></pre>" +
      "<p>One statement: find, claim, and fetch a job, race-free, with workers scaling linearly. Whole message-queue deployments have been replaced by these seven lines.</p>" },

    { title: "ORMs and the N+1 Problem",
      html: "<p>ORMs map rows to objects and write your SQL. Used well they remove genuinely tedious code; used naively they hide the single most expensive performance bug in backend software: <strong>N+1 queries</strong>. You load 100 orders (1 query); then rendering touches <code>order.customer.name</code>, and the ORM <em>lazily</em> loads each customer — 100 more queries, each a full round trip.</p>" +
      "<div class='fig'><svg viewBox='0 0 760 235' xmlns='http://www.w3.org/2000/svg' font-family='Menlo,monospace'>" +
      "<text x='190' y='26' text-anchor='middle' fill='#ff5d73' font-size='12.5'>lazy loading: 1 + N round trips</text>" +
      "<rect x='60' y='45' width='90' height='40' rx='7' fill='#111a2e' stroke='#7d8fb0' stroke-width='2'/><text x='105' y='70' text-anchor='middle' fill='#c9d6ea' font-size='10.5'>app</text>" +
      "<rect x='250' y='45' width='90' height='40' rx='7' fill='#111a2e' stroke='#4f7cff' stroke-width='2'/><text x='295' y='70' text-anchor='middle' fill='#c9d6ea' font-size='10.5'>DB</text>" +
      "<line x1='150' y1='53' x2='244' y2='53' stroke='#2de2ff' stroke-width='2'/><text x='197' y='45' text-anchor='middle' fill='#2de2ff' font-size='9'>orders ×1</text>" +
      "<line x1='150' y1='66' x2='244' y2='66' stroke='#ff5d73' stroke-width='1.5'/>" +
      "<line x1='150' y1='73' x2='244' y2='73' stroke='#ff5d73' stroke-width='1.5'/>" +
      "<line x1='150' y1='80' x2='244' y2='80' stroke='#ff5d73' stroke-width='1.5'/>" +
      "<text x='197' y='97' text-anchor='middle' fill='#ff5d73' font-size='9'>customer ×100…</text>" +
      "<text x='190' y='130' text-anchor='middle' fill='#7d8fb0' font-size='10'>100 × 1 ms RTT = 100 ms of pure network,</text>" +
      "<text x='190' y='146' text-anchor='middle' fill='#7d8fb0' font-size='10'>invisible in code, brutal in production</text>" +
      "<text x='190' y='162' text-anchor='middle' fill='#7d8fb0' font-size='10'>(and EXPLAIN shows 101 innocent fast queries)</text>" +
      "<text x='570' y='26' text-anchor='middle' fill='#3ddc97' font-size='12.5'>eager loading: 1 or 2 round trips</text>" +
      "<rect x='440' y='45' width='90' height='40' rx='7' fill='#111a2e' stroke='#7d8fb0' stroke-width='2'/><text x='485' y='70' text-anchor='middle' fill='#c9d6ea' font-size='10.5'>app</text>" +
      "<rect x='630' y='45' width='90' height='40' rx='7' fill='#111a2e' stroke='#4f7cff' stroke-width='2'/><text x='675' y='70' text-anchor='middle' fill='#c9d6ea' font-size='10.5'>DB</text>" +
      "<line x1='530' y1='60' x2='624' y2='60' stroke='#3ddc97' stroke-width='2.5'/><polygon points='630,60 618,55 618,65' fill='#3ddc97'/>" +
      "<text x='577' y='50' text-anchor='middle' fill='#3ddc97' font-size='9'>orders JOIN customers</text>" +
      "<text x='577' y='108' text-anchor='middle' fill='#7d8fb0' font-size='10'>or two queries: orders, then</text>" +
      "<text x='577' y='124' text-anchor='middle' fill='#7d8fb0' font-size='10'>customers WHERE id IN (…) — batched,</text>" +
      "<text x='577' y='140' text-anchor='middle' fill='#7d8fb0' font-size='10'>one round trip per TABLE, not per row</text>" +
      "<text x='380' y='190' text-anchor='middle' fill='#ffd166' font-size='11'>the fix is one annotation away: join fetch / includes / select_related / preload</text>" +
      "<text x='380' y='212' text-anchor='middle' fill='#7d8fb0' font-size='10'>every ORM has it — the skill is noticing you need it (log your per-request query COUNT)</text>" +
      "</svg><div class='fig-cap'>The same page load, two shapes. N+1 is deadly precisely because every individual query is fast — no slow-query log will ever flag it. The tell is query count per request; the fix is eager loading or an IN-batch.</div></div>" +
      "<p>Working rules for the ORM years of your career: log and alert on <em>queries per request</em> (a page that runs 40+ queries is a bug with rare exceptions); learn to read the SQL your ORM emits (it's in the debug log) and run it through <code>EXPLAIN</code> (Chapter 12); fetch only the columns you need for hot paths (dragging a 2&nbsp;MB JSON column through the pool to render a title defeats Chapter 11's covering indexes too); and when a query gets genuinely hard, <em>write SQL</em> — every good ORM has an escape hatch, and the database speaks it natively.</p>" },

    { title: "Pagination That Scales",
      html: "<p><code>LIMIT 20 OFFSET 100000</code> reads like an index jump; it executes as \"walk 100,020 rows in order, discard 100,000.\" Cost grows linearly with page number — page one is instant, page five thousand times out. Worse, concurrent inserts shift rows between requests, so users see duplicates or gaps as they page (<em>page drift</em>).</p>" +
      "<p><strong>Keyset (cursor) pagination</strong> fixes both by using the last row you saw as the bookmark:</p>" +
      "<pre><code>SELECT * FROM orders\nWHERE (created_at, id) &lt; ($last_created_at, $last_id)\nORDER BY created_at DESC, id DESC\nLIMIT 20;</code></pre>" +
      "<p>With a composite index on <code>(created_at, id)</code> — Chapter 11's leftmost-prefix rules apply — every page is a single index <em>seek</em>: page one million costs the same as page one. The <code>id</code> tiebreaker makes the sort total, so rows can't be skipped when timestamps collide. This is why real APIs (Stripe, GitHub, Slack) hand you an opaque <code>cursor</code>, not a page number. The honest trade: no jumping straight to page 47 — which almost no product actually needs, and which infinite scroll never needed at all.</p>" +
      "<div class='callout'>Deep OFFSET also quietly poisons replicas: those long walking scans hold back the replica's replay and inflate lag (Chapter 21). When \"pagination\" shows up in a replication-lag incident review, this is how it got there.</div>" },

    { title: "Batching, Bulk Writes & the Round-Trip Tax",
      html: "<p>The slowest part of a fast query is the network around it. At 1 ms round-trip time, a loop inserting 10,000 rows one <code>INSERT</code> at a time spends <em>ten seconds in the network</em> even if the database does its work in milliseconds. The fixes, in escalating order of firepower:</p>" +
      "<ul><li><strong>Multi-row statements</strong> — <code>INSERT INTO t VALUES (…), (…), (…)</code> with 100–1,000 rows per statement: one round trip, one parse, one WAL flush amortized across the batch (Chapter 8's group-commit logic, invoked from the client side).</li>" +
      "<li><strong>Driver batch APIs / pipelining</strong> — send many statements without awaiting each reply; the RTTs overlap instead of stacking.</li>" +
      "<li><strong>Bulk-load paths</strong> — <code>COPY</code> (Postgres) or <code>LOAD DATA</code> (MySQL) stream raw data past most per-statement machinery: routinely 10–100× faster than any INSERT loop. For initial loads, also remember Chapter 7's gift: loading in <em>key order</em> builds perfectly packed B-Trees.</li></ul>" +
      "<h3>But Bound Your Transactions</h3>" +
      "<p>Batching pulls toward \"do it all in one transaction\"; the engine pushes back. A million-row transaction holds its locks for minutes, blocks vacuum for its whole duration, and lands on replicas as one indivisible lump — replication lag spikes exactly when you're touching the most data (Chapter 21's read-after-write bugs at their worst). The professional pattern for backfills is Chapter 22's, now with numbers: <strong>chunk it</strong> — loop of 1,000–10,000-row transactions keyed by primary-key range, each committing quickly, with a pause (and a replica-lag check) between chunks. Idempotent chunks (keyed by range, not by \"rows I haven't done yet\") mean a crashed backfill just re-runs.</p>" +
      "<div class='callout'>The unifying lens for this whole chapter: your application and the database are a distributed system of two nodes — every lesson of Part III applies, just with better latency. Round trips are the cost model, timeouts are the failure detector, idempotency keys are the dedup layer, and the connection pool is your admission control.</div>" }
  ],
  terms: [
    { t: "connection pool", d: "A fixed set of ready connections that requests borrow and return — amortizes connection cost and caps database load." },
    { t: "pool sizing (cores×2)", d: "Small pools win: size near the database's real parallelism, not the app's thread count — queue excess in the pool." },
    { t: "PgBouncer transaction mode", d: "Server connections borrowed per transaction: big multiplexing wins, but session state (SET, prepared statements) breaks." },
    { t: "statement_timeout", d: "Server-side cap on query runtime — the timeout that actually stops runaway work, not just abandons it." },
    { t: "zombie query", d: "A query whose client gave up but whose server keeps running it — holding locks and CPU. Server-side timeouts kill it." },
    { t: "idle in transaction", d: "An open transaction doing nothing — holding locks and pinning MVCC snapshots while, say, awaiting a payment API." },
    { t: "ambiguous commit", d: "Write sent, acknowledgment lost: committed and failed are indistinguishable to the client. Retry only with idempotency." },
    { t: "idempotency key", d: "Client-generated unique ID + unique constraint, so a retried write deduplicates instead of duplicating." },
    { t: "SQLSTATE 40001", d: "Serialization failure — the database explicitly asking you to retry the transaction. Serializable isolation requires a retry loop." },
    { t: "optimistic locking", d: "Version column + conditional UPDATE: detect conflicts at write time without holding locks through think-time." },
    { t: "FOR UPDATE SKIP LOCKED", d: "Each worker atomically claims the next unclaimed row, skipping locked ones — the SQL-native job queue." },
    { t: "N+1 queries", d: "One query for a list, then one lazy query per element — 101 fast queries adding up to one slow page." },
    { t: "keyset pagination", d: "WHERE (sort_key, id) < (last seen) — every page is an index seek; page one million costs the same as page one." },
    { t: "COPY / bulk load", d: "The streaming bulk path past per-statement overhead — 10–100× faster than INSERT loops for big loads." }
  ],
  quiz: [
    { type: "mc", q: "A 16-core database serves a fleet of app servers holding 900 pooled connections total, and p99 latency is bad. The counterintuitive fix?",
      opts: ["Raise the pool to 2,000 connections so fewer requests wait for one of the database's cores", "Shrink total connections to a few dozen and let requests queue in the pools", "Add more application servers to spread the load", "Disable pooling entirely and connect per request"], a: 1,
      why: "The database can only run ~cores' worth of queries at once; hundreds of extra connections add context switching, latch contention, and memory pressure. Excess demand belongs in the pool's cheap queue, not inside the engine." },
    { type: "mc", q: "Your client library times out after 2 s, but the database keeps executing the 90-second query. What's missing?",
      opts: ["A bigger connection pool, so the abandoned socket does not starve the next request that arrives that arrives behind it", "A server-side statement_timeout (or driver-sent cancellation) — client timeouts only abandon the socket", "A read replica to take the long query, so the long query stops competing with the rest of the traffic", "An index on the queried column"], a: 1,
      why: "Client timeouts protect app threads, not the database: the abandoned query is a zombie, still holding locks and CPU. Only the server can actually stop it." },
    { type: "mc", q: "An INSERT charging a customer times out — no response ever arrived. Blindly retrying risks…",
      opts: ["nothing at all; a timeout means the write never reached the database and cannot have committed anywhere, so the retry is always safe", "a double charge: the INSERT may have committed with its acknowledgment lost — retry safely only via an idempotency key", "a deadlock between the retry and the original statement, which the detector then has to break", "replica lag, since the retry may be routed to a replica that has not yet seen the first attempt"], a: 1,
      why: "Ambiguous commit is Two Generals in your driver: 'timed out' includes 'succeeded silently'. A client-generated unique key turns the retry into a harmless duplicate-rejection." },
    { type: "mc", q: "A code path opens a transaction, calls a payment API that takes 8 s, then commits. What breaks under load?",
      opts: ["Nothing; an open transaction costs nothing while it waits for a response to come back from the payment provider while the request is in flight", "Locks are held and MVCC snapshots pinned for 8 s per request: writers block, vacuum stalls, and the pool drains — the idle-in-transaction pattern", "The payment API itself gets slower under the load", "The write-ahead log fills up"], a: 1,
      why: "Transaction duration is now coupled to a third party's latency. Gather inputs first, keep begin→commit tight, and publish through an outbox afterward." },
    { type: "mc", q: "A page issues 1 query for 50 orders, then 50 more for each order's customer. Every query is under 1 ms. Why is the page slow, and what's the fix?",
      opts: ["The database is overloaded and needs read replicas to absorb the fifty extra queries the page issues on each load", "50 sequential round trips of network latency — fix with eager loading (JOIN or one IN-batch)", "A missing WHERE clause on the orders query", "The connection pool is too small for this"], a: 1,
      why: "N+1's queries are individually innocent — the cost is pure round-trip count. One join or one batched IN collapses 51 trips into 1–2." },
    { type: "mc", q: "Why does `LIMIT 20 OFFSET 1000000` get slower as users page deeper?",
      opts: ["The result set itself grows with the offset, so more rows come back on each page request that the user has asked for", "The engine must walk and discard a million ordered rows before returning 20 — keyset pagination seeks straight to the bookmark instead", "LIMIT disables the index, so the scan reads the table in full once the offset is large and the offset has to be counted out row by row by the executor", "The rows move around on disk as the table is written to, invalidating the offset"], a: 1,
      why: "OFFSET is a walk-and-throw-away, linear in depth; WHERE (key) < (last seen) with a matching composite index is one seek regardless of depth." },
    { type: "mc", q: "Five workers poll a jobs table with SELECT … FOR UPDATE LIMIT 1 and all serialize behind one row. The one-keyword fix?",
      opts: ["NOWAIT, which returns immediately rather than queueing, so a worker fails fast instead of queueing behind the row", "SKIP LOCKED — each worker claims the next unclaimed row instead of queueing on locked ones", "DISTINCT, so no two workers see the same row, so no two workers can ever be handed the same pending row", "GROUP BY, which partitions the pending rows, so each worker is handed a different bucket of pending rows"], a: 1,
      why: "SKIP LOCKED makes lock conflicts invisible: every worker atomically grabs a different pending row, and the job queue scales with workers." },
    { type: "order", q: "Order the timeout ladder from innermost (tightest) to outermost:",
      items: ["Lock timeout", "Statement timeout", "Transaction / idle-in-transaction timeout", "Request deadline"],
      why: "Each ring must be tighter than the one outside it, so failures surface at the most informative layer instead of as one generic outer timeout." }
  ]
});
