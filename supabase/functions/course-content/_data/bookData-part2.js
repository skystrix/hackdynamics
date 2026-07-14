/* ==========================================================================
   bookData-part2.js — Part III: Distributed Systems (chapters 14–20)
   Original explanatory writing on distributed-systems fundamentals.
   ========================================================================== */

/* ======================= CHAPTER 8 ======================= */
CHAPTERS.push({
  num: 14, part: 3, title: "Distributed Systems: Introduction and Overview",
  blurb: "Everything so far has assumed one machine. This chapter is where we spread a database across many, and where things get genuinely hard: messages get lost, the clocks on different machines disagree, and a computer can fail in confusing half-broken ways instead of cleanly stopping. We'll go through the wrong assumptions engineers keep making about networks, the different ways a machine can fail, and two famous results that mark the hard limits of what any distributed system can promise.",
  sections: [
    { title: "Concurrent Execution & Shared State",
      html: "<p>A distributed system is a set of processes that cooperate by <em>passing messages</em> — there is no shared memory, no global clock, and no single place where \"the current state\" lives. Concurrency here is harsher than multithreading: on one machine, threads at least share a memory and a clock; across machines, each process knows only its own state plus whatever (possibly stale) messages have told it.</p>" +
      "<p>Even an innocent shared value — say, a flag every node wants to read — becomes a protocol problem: any copy a node caches can be outdated the moment it arrives. Every 'read' of remote state is really a message exchange with a latency window in which the truth may change. Distributed algorithms are exactly the art of making useful guarantees despite this.</p>" },

    { title: "Fallacies of Distributed Computing",
      html: "<p>The classic \"fallacies\" are assumptions that hold on one machine and quietly become lies across a network. The big ones, and what actually breaks:</p>" +
      "<ul><li><strong>Processing is instantaneous</strong> — it isn't: remote requests queue, GC pauses strike, and a request you sent may execute much later than you imagine (or twice, after a retry).</li>" +
      "<li><strong>Clocks agree</strong> — they don't. Each machine's quartz drifts; NTP corrects with jumps and skews. Timestamps from different nodes are not comparable without care, which is why logical clocks exist (Chapter 17).</li>" +
      "<li><strong>State is consistent everywhere</strong> — replicas diverge; any protocol that assumes all copies match at all instants is broken by design.</li>" +
      "<li><strong>Local and remote calls are alike</strong> — an RPC can fail in a way a function call never can: <em>you may not learn whether it executed</em>.</li>" +
      "<li><strong>Failures are clean</strong> — real components fail partially: a process may accept connections but never respond, or respond to some peers and not others.</li>" +
      "<li><strong>The network is whole</strong> — <strong>network partitions</strong> split clusters into islands that each keep running; both sides may make progress on divergent state.</li>" +
      "<li><strong>Failures stay local</strong> — <strong>cascading failures</strong> spread: one slow node backs up queues, retries amplify the load, and the herd stampedes. Backoff and jitter exist to break these feedback loops.</li></ul>" +
      "<p>Two of these deserve a closer look, because they shape everything downstream.</p>" +
      "<h3>Processing: The Invisible Queue</h3>" +
      "<p>Between \"request sent\" and \"request executed\" sits a queue you don't see: the remote node buffers incoming messages and works through a backlog whose depth you can't observe. So a request may execute promptly, execute after an arbitrary delay, or never — and the sender can't tell which from silence. Queue capacity is the hidden tuning knob of every distributed system: unbounded queues convert overload into unbounded latency (everything is 'accepted,' nothing finishes in time); bounded queues convert it into explicit rejection — which sounds worse and is far better, because rejection is a signal the sender can act on (<em>backpressure</em>). Pair this with the pauses a node inflicts on itself — garbage collection, page faults, disk stalls — and \"the other node is processing my request right now\" becomes a belief, never a fact.</p>" +
      "<h3>Clocks: Why 'What Time Is It?' Has No Single Answer</h3>" +
      "<p>Each machine's quartz oscillator drifts (temperature alone shifts it), so clocks that started together wander apart. NTP corrects them — sometimes by <em>slewing</em> (speeding/slowing the clock), sometimes by <em>stepping</em> it, meaning wall-clock time can jump backward. Hence the crucial distinction between a <strong>time-of-day clock</strong> (comparable across machines, but non-monotonic) and a <strong>monotonic clock</strong> (strictly forward-moving, but meaningless across machines — only good for measuring local durations). The operational rules: never measure a duration with wall-clock time, and never order events from two machines by their local timestamps. When cross-node ordering is genuinely needed, either buy hardware bounds on uncertainty (Spanner's TrueTime — Chapter 19) or abandon physical time for <em>logical</em> clocks that count causality instead of seconds (Chapter 17's vector clocks).</p>" },

    { title: "Distributed Systems Abstractions: Links",
      html: "<p>To reason precisely, we build a ladder of link abstractions on top of a raw, unreliable channel:</p>" +
      "<ul><li><strong>Fair-loss link</strong> — messages may be lost or duplicated, but if you retransmit forever, delivery eventually happens. (This is roughly the raw network.)</li>" +
      "<li><strong>+ Acknowledgments</strong> — the receiver confirms delivery, giving the sender knowledge… when the ack arrives.</li>" +
      "<li><strong>+ Retransmits</strong> — the sender resends until acked: now delivery is guaranteed, but possibly <em>more than once</em> — the receiver may execute duplicates.</li>" +
      "<li><strong>+ Deduplication (exactly-once?)</strong> — with sequence numbers the receiver can drop duplicates, yielding <em>at-least-once delivery with effectively-once processing</em>. True exactly-once <em>delivery</em> over a lossy link is impossible in general — what systems actually engineer is idempotent or deduplicated <em>processing</em>.</li>" +
      "<li><strong>+ Ordering</strong> — sequence numbers also let the receiver reconstruct FIFO order per sender, the foundation the rest of the stack (broadcasts, consensus) builds on.</li></ul>" +
      "<div class='fig'><svg viewBox='0 0 760 250' xmlns='http://www.w3.org/2000/svg' font-family='Menlo,monospace'>" +
      "<rect x='90' y='195' width='580' height='40' rx='8' fill='#111a2e' stroke='#ff5d73' stroke-width='2'/>" +
      "<text x='250' y='220' text-anchor='middle' fill='#c9d6ea' font-size='11.5'>fair-loss link (≈ raw network)</text>" +
      "<text x='555' y='220' text-anchor='middle' fill='#ff5d73' font-size='10.5'>may lose, may duplicate</text>" +
      "<rect x='115' y='150' width='530' height='40' rx='8' fill='#111a2e' stroke='#4f7cff' stroke-width='2'/>" +
      "<text x='250' y='175' text-anchor='middle' fill='#c9d6ea' font-size='11.5'>+ acknowledgments</text>" +
      "<text x='545' y='175' text-anchor='middle' fill='#7d8fb0' font-size='10.5'>sender learns of delivery</text>" +
      "<rect x='140' y='105' width='480' height='40' rx='8' fill='#111a2e' stroke='#4f7cff' stroke-width='2'/>" +
      "<text x='260' y='130' text-anchor='middle' fill='#c9d6ea' font-size='11.5'>+ retransmits until acked</text>" +
      "<text x='530' y='130' text-anchor='middle' fill='#ffd166' font-size='10.5'>at-least-once: duplicates!</text>" +
      "<rect x='165' y='60' width='430' height='40' rx='8' fill='#111a2e' stroke='#4f7cff' stroke-width='2'/>" +
      "<text x='285' y='85' text-anchor='middle' fill='#c9d6ea' font-size='11.5'>+ sequence numbers: dedup</text>" +
      "<text x='515' y='85' text-anchor='middle' fill='#7d8fb0' font-size='10.5'>effectively-once processing</text>" +
      "<rect x='190' y='15' width='380' height='40' rx='8' fill='#111a2e' stroke='#3ddc97' stroke-width='2.5'/>" +
      "<text x='305' y='40' text-anchor='middle' fill='#c9d6ea' font-size='11.5'>+ reordering by seq: FIFO link</text>" +
      "<text x='505' y='40' text-anchor='middle' fill='#3ddc97' font-size='10.5'>consensus builds here</text>" +
      "</svg><div class='fig-cap'>The ladder of link abstractions — each rung is the one below plus one mechanism, and each mechanism has a price (acks cost round trips, retransmits create the duplicates that sequence numbers must then kill). Note what's NOT on the ladder: exactly-once delivery. No rung can provide it; systems settle for effectively-once processing.</div></div>" },

    { title: "Two Generals' Problem", viz: "twogenerals", vizTitle: "Two generals, one lossy valley",
      html: "<p>Two armies must attack simultaneously or lose; their messengers cross a valley where any of them may be captured. General A sends \"attack at dawn.\" Did it arrive? Only an acknowledgment can say — but then B doesn't know whether the <em>ack</em> arrived, so A must ack the ack, and so on forever.</p>" +
      "<p>The proof is a beautiful induction: suppose some finite protocol achieved certain agreement, and consider its <em>last</em> message. The protocol must work even if that message is lost (its loss was always possible), so the last message was unnecessary — remove it. Repeat until no messages remain, which is absurd. Hence: <strong>no finite exchange over a lossy channel produces common knowledge</strong>. This is why an \"exactly-once, both-sides-know\" commit over an unreliable network can never be absolute — protocols like 2PC manage this uncertainty rather than eliminate it.</p>" },

    { title: "FLP Impossibility, Synchrony & Failure Models",
      html: "<h3>FLP Impossibility</h3>" +
      "<p>The Fischer–Lynch–Paterson result: in a fully <strong>asynchronous</strong> system (no bounds on message delay or processing speed), no deterministic consensus protocol can guarantee termination if even <em>one</em> process may crash. You cannot distinguish \"crashed\" from \"slow,\" and an adversarial scheduler can dance the protocol between decisions forever. FLP forbids guaranteed termination under pure asynchrony — real algorithms escape by adding timing assumptions or randomness.</p>" +
      "<h3>System Synchrony</h3>" +
      "<p>Hence the spectrum of timing models: <strong>synchronous</strong> (known bounds on delays — a lovely fiction), <strong>asynchronous</strong> (no bounds — brutally pessimistic), and the practical middle, <strong>partial synchrony</strong>: the system behaves synchronously <em>eventually</em>, or after some unknown stabilization time. Most real algorithms (Paxos, Raft) are safe always and live under partial synchrony.</p>" +
      "<h3>Failure Models</h3>" +
      "<p>What may go wrong, from tame to terrifying:</p>" +
      "<ul><li><strong>Crash-stop</strong> — a process halts and never returns; the cleanest model to design against (recovering nodes are treated as new arrivals).</li>" +
      "<li><strong>Omission faults</strong> — a process skips some steps: messages silently not sent or not received; from outside it's indistinguishable from slowness.</li>" +
      "<li><strong>Arbitrary (Byzantine) faults</strong> — a process does <em>anything</em>, including sending contradictory lies to different peers — from bugs, corruption, or malice. Tolerating these costs heavy replication and cryptography (Chapter 20).</li></ul>" +
      "<p>Every fault-tolerant claim is really \"tolerates up to f failures <em>of model M</em>\" — always ask which M.</p>" }
  ],
  terms: [
    { t: "network partition", d: "A connectivity split that isolates groups of live nodes from each other while both keep running." },
    { t: "fair-loss link", d: "The baseline channel model: may lose or duplicate messages, but infinite retransmission eventually delivers." },
    { t: "exactly-once delivery", d: "Impossible in general over lossy links; systems settle for at-least-once delivery with idempotent or deduplicated processing." },
    { t: "common knowledge", d: "Everyone knows X, knows that everyone knows X, ad infinitum — unobtainable via finite messaging over lossy links." },
    { t: "FLP impossibility", d: "No deterministic consensus can guarantee termination in a fully asynchronous system with one possible crash." },
    { t: "partial synchrony", d: "Timing model where bounds hold eventually/unknown — the realistic home of practical consensus." },
    { t: "crash-stop fault", d: "Process halts forever; the simplest failure model to tolerate." },
    { t: "Byzantine fault", d: "Arbitrary, possibly malicious behavior — including telling different lies to different nodes." },
    { t: "cascading failure", d: "A local failure amplified through retries, queues, and load shifts into cluster-wide collapse." }
  ],
  quiz: [
    { type: "mc", q: "Why can't the two generals ever reach certainty, no matter how many acks fly?",
      opts: ["Messengers are too slow", "Any finite protocol must survive its last message being lost — making that message (and by induction all of them) unnecessary", "They lack synchronized clocks", "One general might be a traitor"], a: 1,
      why: "The induction on the final message shows common knowledge can't be built from finitely many lossy messages." },
    { type: "mc", q: "What exactly does FLP prove impossible?",
      opts: ["Consensus with any failures whatsoever", "Guaranteed-terminating deterministic consensus in a fully asynchronous system with one possible crash", "Consensus among more than 3 nodes", "Leaderless replication"], a: 1,
      why: "It's a liveness result: safety is achievable, but termination can't be guaranteed without timing assumptions or randomness — 'slow' and 'dead' are indistinguishable." },
    { type: "mc", q: "A retransmitting sender guarantees delivery over a fair-loss link. What new problem appears?",
      opts: ["Message encryption breaks", "Duplicates: the receiver may process the same message multiple times", "The link becomes synchronous", "Acks are no longer needed"], a: 1,
      why: "At-least-once delivery is the price of reliability; sequence numbers or idempotent handlers restore sanity on the processing side." },
    { type: "blank", q: "A process that may behave arbitrarily — even maliciously sending conflicting information — exhibits a ________ fault.",
      a: ["byzantine", "arbitrary"], why: "Named for the Byzantine generals thought experiment; the most expensive fault class to tolerate." },
    { type: "mc", q: "Which timing model do practical consensus algorithms like Raft actually assume for liveness?",
      opts: ["Full synchrony at all times", "Pure asynchrony", "Partial synchrony — bounds hold eventually", "No model at all"], a: 2,
      why: "They stay safe under any timing but only guarantee progress once the network behaves synchronously for long enough." }
  ]
});

/* ======================= CHAPTER 9 ======================= */
CHAPTERS.push({
  num: 15, part: 3, title: "Failure Detection",
  blurb: "Before a cluster can react to a broken machine, it has to notice the machine is broken, and that turns out to be surprisingly tricky, because from a distance a slow machine and a dead one look exactly the same. This chapter covers how machines keep tabs on each other using regular 'I'm still alive' messages, and the unavoidable trade-off every such system faces: check too eagerly and you'll wrongly declare healthy machines dead; check too slowly and you'll keep sending work to a machine that's already gone.",
  sections: [
    { title: "The Detector's Dilemma: Heartbeats and Pings",
      html: "<p>A <strong>failure detector</strong> is a local oracle that labels peers alive or suspected. Two forces pull against each other: <strong>completeness</strong> (every real crash is eventually detected by every correct process) and <strong>accuracy</strong> (no live process is wrongly suspected — or at least, wrong suspicions are eventually corrected). Detect too eagerly and you trigger needless elections and rebalances; too lazily and requests pile up against a corpse. Since a slow node and a dead node look identical (hello, FLP), <em>perfect</em> detectors don't exist in asynchronous systems — only well-tuned imperfect ones.</p>" +
      "<p>The two basic mechanics: <strong>pings</strong> (ask each peer \"alive?\" and await a reply within a deadline) and <strong>heartbeats</strong> (each process proactively announces \"I'm alive\" on an interval; silence past a deadline raises suspicion). Both hinge on timeouts — and choosing timeouts is exactly the hard part.</p>" +
      "<h3>Timeout-Free Failure Detection</h3>" +
      "<p>Can we avoid timeouts entirely? Heartbeat-counting algorithms have each process gossip heartbeat counters along all known paths: processes that keep incrementing are alive; a neighbor's counter that freezes while others advance marks it suspect — comparing <em>relative</em> progress instead of wall-clock deadlines. Elegant in theory; assumptions about connectivity make it rare in practice.</p>" +
      "<h3>Outsourced Heartbeats</h3>" +
      "<p>A direct path can fail while the node lives. With <strong>outsourced heartbeats</strong> (as in SWIM-style protocols), if my ping to N times out, I ask a few other peers to ping N on my behalf — any success clears the suspicion. This spreads detection load and inoculates against one bad link masquerading as a dead node.</p>" },

    { title: "Phi-Accrual Failure Detection", viz: "heartbeat", vizTitle: "Suspicion that accrues, not a timer that fires",
      html: "<p>Binary timeouts throw away information. The <strong>φ-accrual detector</strong> (used in Cassandra and Akka) replaces \"dead / alive\" with a <em>continuous suspicion score</em>: it keeps a sliding window of heartbeat inter-arrival times, models their distribution, and computes φ — roughly, how improbable the current silence is given the node's own history. Applications pick their threshold: a load balancer might reroute at low φ, while a leader election waits for high φ. Fresh heartbeats snap suspicion back down; the detector adapts automatically to a node that's always been slow versus one that just went quiet.</p>" +
      "<div class='callout'>Pause the node above and watch suspicion climb smoothly toward the threshold — then resume it and watch trust return. That reversibility is the point.</div>" },

    { title: "Gossip and Reversed Detection",
      html: "<h3>Gossip-Based Failure Detection</h3>" +
      "<p>Scale the idea out: each node keeps a table of (peer, heartbeat counter, last-updated) and periodically gossips it to random peers, merging tables by taking the freshest entries. Liveness information spreads epidemically, so a node is judged by evidence gathered <em>cluster-wide</em>, not by one point-to-point link — dodging false positives from any single flaky path.</p>" +
      "<h3>Reversing the Problem: FUSE</h3>" +
      "<p>Sometimes you want the opposite guarantee: that failure notification, once it happens anywhere, is <em>unmissable everywhere</em>. FUSE-style approaches arrange processes in groups that deliberately convert any single failure into a group-wide, sticky failure signal — nodes that can't reach a peer stop responding themselves, propagating the alarm. False positives become acceptable; missed detections don't. It's failure detection tuned for agreement rather than uptime.</p>" }
  ],
  terms: [
    { t: "failure detector", d: "A local component labeling peers alive or suspected — necessarily imperfect in asynchronous systems." },
    { t: "completeness", d: "Every actual failure is eventually detected by every correct process." },
    { t: "accuracy", d: "Live processes aren't wrongly suspected (or wrong suspicions are eventually corrected)." },
    { t: "heartbeat", d: "Periodic 'I'm alive' message; silence beyond expectation raises suspicion." },
    { t: "outsourced heartbeat", d: "Asking third parties to probe a silent node, so one bad link can't fake a death." },
    { t: "φ (phi) accrual", d: "A continuous suspicion score derived from a node's own heartbeat-arrival history instead of a fixed timeout." },
    { t: "gossip-style detection", d: "Heartbeat tables merged epidemically so liveness verdicts rest on cluster-wide evidence." }
  ],
  quiz: [
    { type: "mc", q: "Why is a perfect failure detector impossible in an asynchronous system?",
      opts: ["Heartbeats consume too much bandwidth", "A crashed process and a very slow process are observationally identical", "Clocks can't be synchronized precisely enough", "TCP hides failures"], a: 1,
      why: "With no delay bounds, any silence might end a moment later — the same indistinguishability at the heart of FLP." },
    { type: "mc", q: "What does the φ-accrual detector output instead of a binary verdict?",
      opts: ["A ranked list of likely-dead nodes", "A continuously growing suspicion level calibrated to that node's own heartbeat history", "The exact crash time", "A majority vote"], a: 1,
      why: "Different subsystems can act at different thresholds, and a late heartbeat gracefully restores trust." },
    { type: "mc", q: "Node A's ping to node N times out, but N is fine — the A↔N link is bad. Which technique avoids the false positive?",
      opts: ["A longer timeout", "Outsourced heartbeats: A asks other peers to probe N", "Checksumming the pings", "Restarting node A"], a: 1,
      why: "Any indirect probe that succeeds proves N lives; SWIM-style protocols made this standard." },
    { type: "order", q: "Order the escalation in a ping-based detector with outsourcing:",
      items: ["Send a direct ping to the peer", "Deadline passes with no reply", "Ask several other nodes to ping the peer", "No indirect reply either — mark the peer suspected"],
      why: "Direct evidence first, then third-party evidence, and only then suspicion." }
  ]
});

/* ======================= CHAPTER 10 ======================= */
CHAPTERS.push({
  num: 16, part: 3, title: "Leader Election",
  blurb: "A lot of coordination gets much simpler if one machine is temporarily 'in charge' of making decisions, so the group needs a way to agree on who that is and to pick a new one when it fails. This chapter walks through several classic algorithms for holding that election. It also explains the scenario everyone dreads: a network glitch that splits the group so two machines each believe they're the leader, and why that does so much damage.",
  sections: [
    { title: "Why Elect Anyone?",
      html: "<p>Many coordination tasks get dramatically simpler when one process (temporarily) decides for everyone — sequencing writes, assigning work, committing transactions. An election algorithm must deliver <strong>liveness</strong> (some leader eventually emerges) and ideally <strong>safety</strong> (at most one leader at a time). The dirty secret: with unreliable failure detection, classic election algorithms cannot fully guarantee safety — two halves of a partitioned cluster can each elect a champion (<em>split brain</em>). That's why elections alone don't make decisions final; consensus (Chapter 20) adds the missing guarantee. Elections are best understood as an <em>optimization</em> that names a probable coordinator cheaply.</p>" },

    { title: "The Bully Algorithm & Its Refinements", viz: "election", vizTitle: "Bully election: highest rank wins",
      html: "<p>Every process has a unique <strong>rank</strong>. When a process notices the leader is gone, it announces an election to all higher-ranked processes. If any of them answers, it takes over the procedure; if none answer, the initiator declares itself leader and notifies everyone below. Highest live rank always wins — hence \"bully\": a recovering high-rank node <em>always</em> snatches leadership back, even when the cluster was happy, causing avoidable churn.</p>" +
      "<h3>Next-In-Line Failover</h3>" +
      "<p>Skip the messaging storm: each elected leader pre-publishes a <em>succession list</em> of ranked alternates. On failure, detectors promote the highest-ranked <em>reachable</em> alternate directly — one hop, no rounds of proclamation.</p>" +
      "<h3>Candidate/Ordinary Optimization</h3>" +
      "<p>Split nodes into a small <em>candidate</em> set (the only ones eligible to lead) and <em>ordinary</em> nodes (which merely help pick among candidates). Fewer contenders means fewer conflicting simultaneous elections and less traffic.</p>" +
      "<h3>Invitation Algorithm</h3>" +
      "<p>Instead of one global fight, everyone starts as the leader of a group of one; leaders <em>invite</em> other groups to merge, and merging groups adopt one of the two leaders. Groups coalesce gradually — a natural fit when partitions heal and islands must reunify.</p>" +
      "<h3>Ring Algorithm</h3>" +
      "<p>Arrange processes in a logical ring. A node detecting leader death sends an election message around the ring; each node appends itself (or keeps the highest ID seen) and forwards, skipping dead neighbors. When the message returns to its originator, it has seen every live node — the highest ID becomes leader, announced with one more lap.</p>" +
      "<div class='callout'>Common thread: define a total order over live processes (rank, ID, freshness) and crown its maximum. The algorithms differ mainly in how much messaging finds that maximum, and how gracefully they handle simultaneous initiators.</div>" }
  ],
  terms: [
    { t: "split brain", d: "Two nodes simultaneously believing they lead — the safety violation elections risk under partitions." },
    { t: "bully algorithm", d: "Election by rank: challenge everyone above you; silence from above means you win." },
    { t: "succession list", d: "Pre-agreed ranked alternates enabling next-in-line failover without an election round." },
    { t: "candidate/ordinary split", d: "Restricting eligibility to a small candidate set to reduce election collisions." },
    { t: "invitation algorithm", d: "Leaders of small groups invite others to merge until one group (and leader) remains." },
    { t: "ring algorithm", d: "An election message circulates a logical ring, collecting the highest live ID." }
  ],
  quiz: [
    { type: "mc", q: "Why is the bully algorithm called that?",
      opts: ["It aborts lower-ranked transactions", "The highest-ranked live node always seizes leadership — including a recovered node kicking out a working leader", "It floods the network", "It requires unanimous consent"], a: 1,
      why: "Rank beats incumbency, so a briefly-dead top-rank node reclaims the crown on return, churning the cluster." },
    { type: "mc", q: "What failure of guarantees leads to split brain during a partition?",
      opts: ["Ranks colliding", "Each side's failure detector declares the other side dead, so each elects its own leader", "Election messages being reordered", "Clock drift"], a: 1,
      why: "Elections built on imperfect failure detection can't ensure at-most-one-leader; consensus quorums are the real fix." },
    { type: "mc", q: "In the ring algorithm, how does the initiator know the election message has seen every live node?",
      opts: ["A timeout expires", "The message travels the full ring and returns to the initiator", "The leader acknowledges it", "It counts acknowledgments from all nodes"], a: 1,
      why: "One full lap (skipping dead nodes) collects all live candidates; the highest ID seen wins and a second lap announces it." },
    { type: "blank", q: "The scheme where the current leader pre-announces ranked alternates for instant failover is called ________ failover.",
      a: ["next in line", "next-in-line"], why: "Detectors promote the top reachable alternate directly, skipping the election storm." }
  ]
});

/* ======================= CHAPTER 11 ======================= */
CHAPTERS.push({
  num: 17, part: 3, title: "Replication and Consistency",
  blurb: "To survive machine failures and serve users everywhere, databases keep copies of the data on several machines, but then those copies can disagree, and deciding how much disagreement to tolerate is a deep design choice. This chapter explains the famous CAP trade-off (what you must give up when the network breaks), the range of consistency guarantees from strictest to loosest and what each one actually promises a user, and clever data types that can be edited on many machines at once and merged back together without conflicts.",
  sections: [
    { title: "Achieving Availability & the Infamous CAP",
      html: "<p>We replicate for fault tolerance, read scalability, and locality — and instantly acquire the problem of keeping copies meaningfully \"the same.\" <strong>CAP</strong> frames the core bind: when a network <strong>P</strong>artition strikes (and it will), a system must choose between <strong>C</strong>onsistency (every read sees the latest write — linearizability) and <strong>A</strong>vailability (every request to a live node gets a non-error answer). CP systems refuse requests they can't serve consistently; AP systems answer with possibly-stale data.</p>" +
      "<h3>Use CAP Carefully</h3>" +
      "<p>CAP is a boundary result, not a menu of three: you don't \"pick two\" in fair weather — without partitions you can have both C and A, and the real engineering happens on a continuum (latency vs. consistency trade-offs during normal operation matter just as much; see PACELC thinking). Availability in CAP's sense is also binary and eventual — real systems care about <em>how much</em> and <em>how fast</em>.</p>" +
      "<h3>Harvest and Yield</h3>" +
      "<p>A more supple vocabulary: <strong>yield</strong> is the fraction of requests answered; <strong>harvest</strong> is the completeness of each answer (a search over 90% of shards has 0.9 harvest). Systems can degrade gracefully by trading harvest for yield during trouble — answering everyone, slightly incompletely — instead of the binary CAP cliff.</p>" },

    { title: "Shared Memory, Ordering & Consistency Models",
      html: "<p>Think of a replicated register as <strong>distributed shared memory</strong>: clients read and write a \"single\" variable that is secretly many copies. A <strong>consistency model</strong> is the contract about which orderings of reads and writes clients may observe. From strongest to weakest:</p>" +
      "<ul><li><strong>Strict consistency</strong> — every write instantly visible everywhere: a theoretical fiction requiring instantaneous propagation.</li>" +
      "<li><strong>Linearizability</strong> — every operation appears to take effect atomically at some instant (the <em>linearization point</em>) between its start and finish, consistent with real time. Once any client reads the new value, no client may read the old one. Gold standard; costs coordination (in replicated systems, typically consensus rounds).</li>" +
      "<li><strong>Sequential consistency</strong> — all clients see operations in the <em>same</em> total order, and each client's own operations stay in program order — but that shared order needn't match real time (a lagging replica shows everyone a consistent, slightly old, movie).</li>" +
      "<li><strong>Causal consistency</strong> — only causally related operations must be seen in order; concurrent ones may be seen differently by different observers. Implemented by attaching causal metadata — e.g., <strong>vector clocks</strong>: per-node logical counters where comparing vectors reveals \"happened-before\" versus \"concurrent,\" and concurrent siblings must be reconciled by the application.</li></ul>" +
      "<h3>The Cost of Linearizability</h3>" +
      "<p>Strength is never free. On a single machine, linearizability falls out of hardware compare-and-swap; in a <em>replicated</em> system, every linearizable write must be ordered against every other before anyone may observe it — which in practice means a round of consensus (Chapter 20) or a write through a single leader per key, paying cross-node (possibly cross-continent) round trips on the hot path. That latency is a law, not an implementation detail: reading the newest write requires coordinating with whoever might have accepted a newer one. This is why real systems are deliberately two-tier — linearizable operations reserved for the few spots that need them (leader election, uniqueness, counters that must not double-spend), cheaper models everywhere else.</p>" +
      "<h3>Vector Clocks, Step by Step</h3>" +
      "<p>Watch causality get tracked. Three replicas A, B, C, each keeping a counter per replica, all starting at [A:0, B:0, C:0]:</p>" +
      "<ul><li>A accepts a write of <code>cart={book}</code>: A increments its own slot → version stamped <strong>[A:1, B:0, C:0]</strong>.</li>" +
      "<li>The write replicates to B. A client through B adds an item: B increments its slot on top of what it saw → <strong>[A:1, B:1, C:0]</strong>. Compare: every component ≥ the earlier stamp — this <em>descends</em> from A's write and safely supersedes it.</li>" +
      "<li>Meanwhile a client through C, which never saw B's update, also writes: <strong>[A:1, B:0, C:1]</strong>.</li></ul>" +
      "<p>Now compare [A:1, B:1, C:0] and [A:1, B:0, C:1]: the first is bigger in B, the second bigger in C — neither dominates, so the writes are provably <strong>concurrent</strong>: neither client could have known about the other. The store must keep <em>both</em> siblings and let the application reconcile (Dynamo's famous shopping-cart merge unions them). That's the honest contract of causal metadata: it can't invent an order that never existed — it can only tell you, with certainty, whether one exists.</p>" +
      "<div class='fig'><svg viewBox='0 0 760 255' xmlns='http://www.w3.org/2000/svg' font-family='Menlo,monospace'>" +
      "<rect x='150' y='20' width='330' height='42' rx='8' fill='#111a2e' stroke='#ffd166' stroke-width='2.5'/>" +
      "<text x='315' y='38' text-anchor='middle' fill='#ffd166' font-size='11.5'>linearizability</text>" +
      "<text x='315' y='54' text-anchor='middle' fill='#7d8fb0' font-size='9.5'>atomic instants, real-time order — needs consensus</text>" +
      "<line x1='315' y1='62' x2='315' y2='80' stroke='#1c2a45' stroke-width='2'/><text x='335' y='76' fill='#ff5d73' font-size='9.5'>give up: real-time agreement</text>" +
      "<rect x='150' y='82' width='330' height='42' rx='8' fill='#111a2e' stroke='#2de2ff' stroke-width='2'/>" +
      "<text x='315' y='100' text-anchor='middle' fill='#2de2ff' font-size='11.5'>sequential consistency</text>" +
      "<text x='315' y='116' text-anchor='middle' fill='#7d8fb0' font-size='9.5'>one shared order, may lag reality</text>" +
      "<line x1='315' y1='124' x2='315' y2='142' stroke='#1c2a45' stroke-width='2'/><text x='335' y='138' fill='#ff5d73' font-size='9.5'>give up: a single total order</text>" +
      "<rect x='150' y='144' width='330' height='42' rx='8' fill='#111a2e' stroke='#4f7cff' stroke-width='2'/>" +
      "<text x='315' y='162' text-anchor='middle' fill='#4f7cff' font-size='11.5'>causal consistency</text>" +
      "<text x='315' y='178' text-anchor='middle' fill='#7d8fb0' font-size='9.5'>only cause-and-effect stays ordered (vector clocks)</text>" +
      "<line x1='315' y1='186' x2='315' y2='204' stroke='#1c2a45' stroke-width='2'/><text x='335' y='200' fill='#ff5d73' font-size='9.5'>give up: any cross-client ordering</text>" +
      "<rect x='150' y='206' width='330' height='42' rx='8' fill='#111a2e' stroke='#7d8fb0' stroke-width='2'/>" +
      "<text x='315' y='224' text-anchor='middle' fill='#c9d6ea' font-size='11.5'>eventual consistency</text>" +
      "<text x='315' y='240' text-anchor='middle' fill='#7d8fb0' font-size='9.5'>replicas converge… eventually</text>" +
      "<line x1='620' y1='215' x2='620' y2='55' stroke='#3ddc97' stroke-width='2'/><polygon points='620,48 613,62 627,62' fill='#3ddc97'/>" +
      "<text x='648' y='105' fill='#3ddc97' font-size='10.5' transform='rotate(90 648 105)'>coordination · latency · unavailability under partition</text>" +
      "</svg><div class='fig-cap'>The ladder, with the price axis drawn in. Every step up buys a stronger contract and costs more cross-node coordination — which is why mature systems mix levels per operation instead of buying linearizability for everything.</div></div>" },

    { title: "Session Models & Eventual Consistency",
      html: "<p><strong>Session models</strong> promise sanity to a single client rather than global order:</p>" +
      "<ul><li><em>Read-own-writes</em> — you never un-see your own update.</li>" +
      "<li><em>Monotonic reads</em> — time never flows backward across your reads.</li>" +
      "<li><em>Monotonic writes</em> — your writes apply in the order you issued them.</li>" +
      "<li><em>Writes-follow-reads</em> — what you write lands after what you had read.</li></ul>" +
      "<p><strong>Eventual consistency</strong> is the famously modest floor: stop writing, and replicas converge… eventually. In exchange you get availability and low latency — updates propagate asynchronously, and readers may glimpse the past meanwhile.</p>" },

    { title: "Tunable Consistency & Witness Replicas", viz: "quorum", vizTitle: "Quorums: when must R and W overlap?",
      html: "<p>Dynamo-style systems put the dial in your hands. With <strong>N</strong> replicas, require <strong>W</strong> acknowledgments per write and <strong>R</strong> responses per read. If <code>R + W &gt; N</code>, every read set intersects every write set — some replica in your read quorum has the newest value (found by comparing versions). <code>R=1, W=1</code> is fast and loose; <code>R=1, W=N</code> makes writes expensive and reads trivial; majority quorums (<code>R=W=⌈(N+1)/2⌉</code>) balance both while tolerating minority failures.</p>" +
      "<h3>Witness Replicas</h3>" +
      "<p>Full copies are expensive. <strong>Witnesses</strong> are lightweight quorum members that normally store only version metadata, not data — they vote, making quorums reachable, and temporarily <em>upgrade</em> to store real records only when true copyholders are down. You get quorum arithmetic with fewer full datasets.</p>" +
      "<div class='callout'>Play with the sliders above: set R+W ≤ N and hunt for a stale read; set R+W &gt; N and convince yourself you can't.</div>" },

    { title: "Strong Eventual Consistency and CRDTs",
      html: "<p>What if replicas could accept writes independently and <em>merge without conflict — by construction</em>? <strong>Conflict-Free Replicated Data Types</strong> restrict operations to ones that commute (order-insensitive), making convergence a mathematical certainty: any two replicas that saw the same set of updates — in any order — are in the same state. That's <strong>strong eventual consistency</strong>: no coordination, no conflict resolution code, deterministic convergence.</p>" +
      "<p>Classics: a grow-only counter (per-node counts, merge = element-wise max, value = sum); a grow-only set (merge = union); two-phase and OR-sets that support removal; last-write-wins registers. The craft is designing your data so that <em>merge</em> is total and meaningful — you trade expressiveness for coordination-freedom.</p>" +
      "<div class='fig'><svg viewBox='0 0 760 235' xmlns='http://www.w3.org/2000/svg' font-family='Menlo,monospace'>" +
      "<text x='378' y='24' text-anchor='middle' fill='#c9d6ea' font-size='13'>G-counter: a page-view counter across three replicas</text>" +
      "<rect x='70' y='45' width='200' height='64' rx='8' fill='#111a2e' stroke='#2de2ff' stroke-width='2'/>" +
      "<text x='170' y='67' text-anchor='middle' fill='#2de2ff' font-size='11.5'>replica A's state</text>" +
      "<text x='170' y='90' text-anchor='middle' fill='#c9d6ea' font-size='12'>[A:3 · B:1 · C:0]</text>" +
      "<rect x='490' y='45' width='200' height='64' rx='8' fill='#111a2e' stroke='#ffd166' stroke-width='2'/>" +
      "<text x='590' y='67' text-anchor='middle' fill='#ffd166' font-size='11.5'>replica B's state</text>" +
      "<text x='590' y='90' text-anchor='middle' fill='#c9d6ea' font-size='12'>[A:2 · B:4 · C:1]</text>" +
      "<text x='170' y='128' text-anchor='middle' fill='#7d8fb0' font-size='9.5'>each replica increments ONLY its own slot</text>" +
      "<text x='590' y='128' text-anchor='middle' fill='#7d8fb0' font-size='9.5'>A's slot here is just stale gossip</text>" +
      "<line x1='230' y1='113' x2='340' y2='158' stroke='#3ddc97' stroke-width='2'/><polygon points='345,161 333,159 339,149' fill='#3ddc97'/>" +
      "<line x1='530' y1='113' x2='420' y2='158' stroke='#3ddc97' stroke-width='2'/><polygon points='415,161 421,149 427,159' fill='#3ddc97'/>" +
      "<rect x='255' y='160' width='250' height='60' rx='8' fill='#111a2e' stroke='#3ddc97' stroke-width='2.5'/>" +
      "<text x='380' y='182' text-anchor='middle' fill='#3ddc97' font-size='11.5'>merge = element-wise max</text>" +
      "<text x='380' y='204' text-anchor='middle' fill='#c9d6ea' font-size='12'>[A:3 · B:4 · C:1]  →  value = 8</text>" +
      "<text x='620' y='190' fill='#7d8fb0' font-size='9.5'>same result in ANY</text>" +
      "<text x='620' y='204' fill='#7d8fb0' font-size='9.5'>merge order — that's SEC</text>" +
      "</svg><div class='fig-cap'>Why the merge can't conflict: each replica owns one slot and only ever grows it, so max() per slot always picks the freshest fact about each replica. Merging is commutative, associative, and idempotent — apply merges in any order, any number of times, and every replica lands on [A:3, B:4, C:1] = 8.</div></div>" }
  ],
  terms: [
    { t: "CAP", d: "Under a partition, choose: consistent-but-refusing (CP) or available-but-possibly-stale (AP)." },
    { t: "harvest & yield", d: "Answer completeness vs. fraction of requests answered — a graceful-degradation vocabulary finer than CAP." },
    { t: "linearizability", d: "Each operation takes effect atomically at some point between invocation and response, consistent with real time." },
    { t: "linearization point", d: "The instant an operation's effect becomes visible to all — its atomic 'now'." },
    { t: "sequential consistency", d: "One total order seen by all clients, respecting each client's program order — but not necessarily real time." },
    { t: "causal consistency", d: "Causally related operations are seen in order everywhere; concurrent ones may differ." },
    { t: "vector clock", d: "Per-node logical counters that distinguish happened-before from concurrent updates." },
    { t: "read-own-writes", d: "Session guarantee: a client always sees at least its own previous updates." },
    { t: "tunable quorum", d: "Per-operation R/W replica counts; R+W>N guarantees read-write overlap." },
    { t: "CRDT", d: "A data type whose operations commute, so replicas merge deterministically without coordination." }
  ],
  quiz: [
    { type: "mc", q: "N=5 replicas, W=2, R=2. A read right after a successful write returns the OLD value. Is the system broken?",
      opts: ["Yes — quorums forbid this", "No — R+W=4 ≤ N=5, so read and write sets may miss each other entirely", "Yes — W must always be a majority", "No — reads always lag by design"], a: 1,
      why: "Overlap is only guaranteed when R+W > N. With 4 ≤ 5, the two readers may both hold stale copies." },
    { type: "mc", q: "What distinguishes linearizability from sequential consistency?",
      opts: ["Linearizability allows stale reads", "Linearizability additionally respects real time: once anyone sees a write, nobody may see its absence", "Sequential consistency is stronger", "They differ only in naming"], a: 1,
      why: "Sequential consistency needs one agreed order; linearizability pins that order to actual wall-clock overlap of operations." },
    { type: "mc", q: "Two vector clocks: [A:2, B:1] and [A:1, B:3]. Their relationship?",
      opts: ["The first happened before the second", "The second happened before the first", "They are concurrent — neither dominates, so the app must reconcile", "They are equal"], a: 2,
      why: "Each clock exceeds the other in one component, so neither causally precedes the other: a genuine conflict." },
    { type: "mc", q: "Why do CRDT replicas never need conflict resolution?",
      opts: ["A leader orders all their writes", "Their operations are designed to commute, so any delivery order converges to the same state", "They lock during merges", "They only support reads"], a: 1,
      why: "Commutativity + idempotent merge = strong eventual consistency, by construction rather than by coordination." },
    { type: "order", q: "Order these models from STRONGEST guarantee to weakest:",
      items: ["Linearizability", "Sequential consistency", "Causal consistency", "Eventual consistency"],
      why: "Real-time atomicity → agreed total order → causal order only → mere convergence someday." }
  ]
});

/* ======================= CHAPTER 12 ======================= */
CHAPTERS.push({
  num: 18, part: 3, title: "Anti-Entropy and Dissemination",
  blurb: "Once you have copies of your data on many machines, they slowly drift out of sync, and something has to keep pulling them back together. This chapter covers the techniques that do that: quietly fixing stale copies during normal reads, holding onto writes for a machine that's temporarily down, an efficient way (Merkle trees) to pinpoint exactly which piece of a huge dataset two machines disagree on, and 'gossip', where machines pass news to a few random neighbors so it reaches everyone the way a rumor spreads.",
  sections: [
    { title: "Spreading the Word: Three Broad Strategies",
      html: "<p>Cluster state (data, membership, liveness) can be disseminated by: <strong>notification broadcast</strong> from the origin (simple, fragile at scale), <strong>anti-entropy</strong> — periodic peer-to-peer reconciliation of differences (the reliable background repair), and <strong>gossip</strong> — probabilistic epidemic-style relay (scalable and robust to failures). Most real systems layer several: fast-but-lossy foreground paths backed by slow-but-thorough background repair.</p>" },

    { title: "Foreground Repair: Read Repair, Digest Reads, Hinted Handoff",
      html: "<h3>Read Repair</h3>" +
      "<p>Reads already contact several replicas — free reconnaissance! The coordinator compares the responses; if a replica returned stale data, the coordinator pushes the newest version back to it. Repair rides along on the read path: <em>blocking</em> variants fix replicas before answering the client, <em>asynchronous</em> ones fix them after.</p>" +
      "<h3>Digest Reads</h3>" +
      "<p>Shipping full records from every replica is wasteful, so the coordinator asks one replica for the data and the rest for a <strong>digest</strong> — a hash of it. Matching digests: done, cheap. Mismatch: fetch full versions and reconcile. Bandwidth for hashes instead of payloads, most of the time.</p>" +
      "<h3>Hinted Handoff</h3>" +
      "<p>When a write's target replica is down, a stand-in node accepts the write and stores a <strong>hint</strong>: \"this belongs to node X — deliver when it returns.\" The write survives, availability holds, and the returning node is caught up by replay rather than by full re-sync. (In sloppy-quorum designs, the stand-ins even count toward W.)</p>" },

    { title: "Background Repair: Merkle Trees & Bitmap Version Vectors", viz: "merkle", vizTitle: "Merkle trees: find divergence in log time",
      html: "<h3>Merkle Trees</h3>" +
      "<p>Comparing entire datasets replica-vs-replica is unthinkable; comparing hashes of datasets tells you <em>whether</em> they differ but not <em>where</em>. The <strong>Merkle tree</strong> gives both: hash data ranges into leaves, then hash children pairwise up to a root. Two replicas compare roots — equal means done in one exchange; unequal means recurse into the differing children, homing in on the divergent range in logarithmically many hash comparisons. Only that range's data is exchanged. The cost: trees must be rebuilt or maintained as data changes.</p>" +
      "<h3>Bitmap Version Vectors</h3>" +
      "<p>An alternative that skips hashing: each node logs its writes with sequence numbers and tracks, per peer, which of that peer's writes it has seen — as a compact bitmap over the sequence space (a contiguous synced prefix plus a bitmap of gaps). Syncing is then set subtraction: send exactly the writes whose bits the other side lacks. Recent-write-skewed workloads sync in near-constant time.</p>" },

    { title: "Gossip Dissemination", viz: "gossip", vizTitle: "Epidemic spread across a cluster",
      html: "<p><strong>Gossip protocols</strong> borrow epidemiology: a node that learns something \"infects\" a few random peers per round; the informed population grows exponentially, reaching everyone in O(log N) rounds with high probability — no coordinator, no fragile spanning tree, natural tolerance of dead nodes and lost messages. The vocabulary is literal: <em>infective</em> nodes spread the update, <em>susceptible</em> ones haven't heard it, <em>removed</em> ones stopped spreading it.</p>" +
      "<h3>Gossip Mechanics</h3>" +
      "<p>Key tuning: the <strong>fanout</strong> (peers contacted per round) and <strong>loss of interest</strong> — nodes must eventually stop repeating old news (after a fixed count, or probabilistically once they keep hearing it echoed back), or the cluster chatters forever. Too-early removal risks leaving pockets uninformed; too-late wastes bandwidth.</p>" +
      "<h3>Overlay Networks & Partial Views</h3>" +
      "<p>Gossiping to uniformly random peers requires knowing all of them — itself a scaling problem. Real systems keep <strong>partial views</strong> (small, periodically reshuffled peer sets) that make the overlay approximate a random graph without global membership knowledge.</p>" +
      "<h3>Hybrid Gossip</h3>" +
      "<p>Push–lazy-push hybrids (Plumtree-style) get the best of both: send full payloads along a constructed spanning tree (efficient), but gossip mere message <em>IDs</em> off-tree (robust) — any node that hears an ID it never received full-fat requests it, healing the tree around failures.</p>" }
  ],
  terms: [
    { t: "anti-entropy", d: "Background pairwise reconciliation that pulls diverged replicas back together." },
    { t: "read repair", d: "Fixing stale replicas using the versions gathered during a normal quorum read." },
    { t: "digest read", d: "Requesting hashes instead of full data from most replicas; fetch payloads only on mismatch." },
    { t: "hinted handoff", d: "A stand-in stores writes for a down replica and replays them on its return." },
    { t: "Merkle tree", d: "Hierarchy of hashes locating a divergent data range in O(log n) comparisons." },
    { t: "bitmap version vector", d: "Per-peer bitmaps over write sequence numbers, making sync an exact set-difference." },
    { t: "fanout", d: "How many peers a gossiping node infects per round." },
    { t: "partial view", d: "A small, shuffled subset of peers standing in for full membership knowledge." },
    { t: "Plumtree / hybrid gossip", d: "Payloads along a spanning tree, IDs by gossip — efficiency plus self-healing." }
  ],
  quiz: [
    { type: "mc", q: "Two replicas hold a terabyte each. How does a Merkle-tree comparison find their one divergent range?",
      opts: ["It hashes and ships all data once", "Compare roots, then recurse only into children whose hashes differ — log-many comparisons", "It samples random rows", "It replays both WALs"], a: 1,
      why: "Equal hashes prune entire subtrees instantly; only the mismatched path is walked, and only the guilty range is exchanged." },
    { type: "mc", q: "What is a 'hint' in hinted handoff?",
      opts: ["A Bloom filter of recent writes", "A stored write plus its true destination, replayed when the down replica returns", "A gossip rumor about node death", "A read-repair digest"], a: 1,
      why: "The stand-in acts as a temporary mailbox so writes survive a replica's absence without full re-synchronization." },
    { type: "mc", q: "Why does gossip reach the whole cluster in ~log(N) rounds?",
      opts: ["Nodes are arranged in a binary tree", "Each round roughly multiplies the informed population by the fanout — exponential growth", "The coordinator schedules it", "Messages are broadcast on the LAN"], a: 1,
      why: "Epidemics compound: 1 → f → f² informed nodes… exponential growth covers N nodes in logarithmic rounds." },
    { type: "blank", q: "Asking most replicas for a hash of the data instead of the data itself is called a ________ read.",
      a: ["digest"], why: "Matching digests prove agreement cheaply; payloads travel only when they differ." },
    { type: "order", q: "Order the read-repair flow:",
      items: ["Coordinator queries multiple replicas", "Responses (or digests) are compared", "A stale replica is detected", "The newest version is written back to it"],
      why: "Repair piggybacks on evidence the read already collected." }
  ]
});

/* ======================= CHAPTER 13 ======================= */
CHAPTERS.push({
  num: 19, part: 3, title: "Distributed Transactions",
  blurb: "A transaction on one machine is all-or-nothing; making that same guarantee when the change spans several machines that can each fail on their own is much harder. This chapter starts with the classic two-phase commit protocol and its serious weakness (everyone gets stuck if the coordinator dies at the wrong moment), then looks at how real systems like Google's Spanner work around it. We'll also cover consistent hashing, a neat way to decide which machine holds which data so that adding or removing machines barely disturbs anything.",
  sections: [
    { title: "Making Operations Appear Atomic",
      html: "<p>A distributed transaction must be all-or-nothing across nodes that can each crash independently — plus invisible in its intermediate states to everyone else. Since single-node atomicity tools (one WAL, one commit record) don't span machines, we need an <strong>atomic commitment protocol</strong>: an agreement ritual in which every participant durably promises, and a decision binds them all. The catch, as always, is what happens when participants — or the one running the ritual — die mid-promise.</p>" },

    { title: "Two-Phase Commit", viz: "twopc", vizTitle: "2PC: votes, decisions, and the blocking trap",
      html: "<p><strong>2PC</strong> splits commitment in two:</p>" +
      "<ol><li><strong>Prepare/vote</strong> — the coordinator asks every cohort \"can you commit?\" Each cohort does everything short of committing (validates, acquires what it needs, <em>durably logs</em> its readiness) and votes. A YES vote is a binding promise: the cohort surrenders its right to abort unilaterally.</li>" +
      "<li><strong>Commit/abort</strong> — unanimous YES ⇒ the coordinator logs COMMIT and broadcasts it; any NO or timeout ⇒ ABORT broadcast. Cohorts apply and acknowledge.</li></ol>" +
      "<h3>Cohort Failures</h3>" +
      "<p>A cohort dying before voting just aborts the round — annoying, clean. A cohort dying <em>after</em> voting YES must, on recovery, ask around for the verdict and honor it; its promise survived the crash in its log.</p>" +
      "<h3>Coordinator Failures — the Blocking Problem</h3>" +
      "<p>Now the nightmare: all cohorts voted YES, and the coordinator crashes before announcing a decision. Every cohort is bound by its promise (can't abort) yet ignorant of the outcome (can't commit) — <strong>blocked</strong>, holding locks, possibly for as long as the coordinator stays dead. Cohorts can query each other, but if no one heard a verdict, the uncertainty stands. This blocking window is 2PC's defining flaw.</p>" },

    { title: "Three-Phase Commit",
      html: "<p><strong>3PC</strong> inserts a buffer phase: propose → <strong>prepare-to-commit</strong> (spread the fact that everyone voted yes) → commit. Because every cohort learns \"we're all willing\" before anyone commits, survivors of a coordinator crash can deduce the outcome among themselves and proceed by timeout — no eternal blocking. The price: an extra round trip on <em>every</em> transaction, and a fatal sensitivity: under a network partition, two sides can time out to <em>opposite</em> verdicts. Guaranteed non-blocking only in fairly friendly failure models — which is why practice went another way: make the <em>coordinator itself</em> fault-tolerant via consensus (Chapter 20), rather than adding phases.</p>" },

    { title: "Three Escapes: Calvin, Spanner, Percolator",
      html: "<h3>Calvin — agree on the schedule, not each commit</h3>" +
      "<p><strong>Deterministic databases</strong> flip the problem: if every replica executes the <em>same transactions in the same order</em> with deterministic logic, they end identical — no per-transaction commit protocol needed. Calvin runs a replicated, consensus-backed <strong>sequencer</strong> that batches and orders all transactions up front; schedulers on each replica then execute the agreed script (transactions must declare read/write sets, and reconnaissance queries handle the ones that can't). One consensus round per <em>batch</em>, not per transaction.</p>" +
      "<h3>Spanner — synchronized time as an ordering device</h3>" +
      "<p>Google's Spanner runs Paxos per data shard (so every shard's writes are replicated and ordered), 2PC <em>across</em> shards for multi-shard transactions — with the coordinator role backed by a Paxos group, neutering the blocking problem — and its signature move: <strong>TrueTime</strong>, an API exposing clock uncertainty as an interval. Commit timestamps are taken from TrueTime, and a transaction <em>waits out the uncertainty</em> before making its writes visible, so timestamp order provably matches real-time order: external consistency, plus consistent snapshot reads at any past timestamp.</p>" +
      "<div class='fig'><svg viewBox='0 0 760 190' xmlns='http://www.w3.org/2000/svg' font-family='Menlo,monospace'>" +
      "<line x1='60' y1='120' x2='710' y2='120' stroke='#1c2a45' stroke-width='2'/><polygon points='716,120 704,114 704,126' fill='#1c2a45'/>" +
      "<text x='700' y='143' text-anchor='end' fill='#7d8fb0' font-size='10.5'>real time →</text>" +
      "<rect x='150' y='105' width='170' height='30' rx='5' fill='rgba(255,209,102,.12)' stroke='#ffd166' stroke-width='2'/>" +
      "<text x='235' y='95' text-anchor='middle' fill='#ffd166' font-size='10.5'>TT.now() = [earliest, latest]</text>" +
      "<text x='235' y='155' text-anchor='middle' fill='#7d8fb0' font-size='9.5'>uncertainty ε ≈ a few ms</text>" +
      "<line x1='320' y1='60' x2='320' y2='135' stroke='#2de2ff' stroke-width='2.5'/>" +
      "<text x='320' y='48' text-anchor='middle' fill='#2de2ff' font-size='10.5'>commit ts s = latest</text>" +
      "<rect x='320' y='105' width='150' height='30' rx='5' fill='rgba(255,93,115,.1)' stroke='#ff5d73' stroke-width='2' stroke-dasharray='6 4'/>" +
      "<text x='395' y='95' text-anchor='middle' fill='#ff5d73' font-size='10.5'>commit wait</text>" +
      "<text x='395' y='155' text-anchor='middle' fill='#7d8fb0' font-size='9.5'>hold writes until TT.now().earliest &gt; s</text>" +
      "<line x1='470' y1='60' x2='470' y2='135' stroke='#3ddc97' stroke-width='2.5'/>" +
      "<text x='490' y='48' text-anchor='middle' fill='#3ddc97' font-size='10.5'>writes visible</text>" +
      "<text x='590' y='75' fill='#7d8fb0' font-size='9.5'>every clock on Earth now</text>" +
      "<text x='590' y='89' fill='#7d8fb0' font-size='9.5'>agrees s is in the past —</text>" +
      "<text x='590' y='103' fill='#7d8fb0' font-size='9.5'>ts order = real-time order</text>" +
      "</svg><div class='fig-cap'>The commit-wait, drawn on a timeline. The transaction stamps itself with the pessimistic end of TrueTime's uncertainty interval, then simply waits the interval out before publishing. After the green line, no clock anywhere can believe s hasn't happened yet — so a later transaction is guaranteed a later timestamp. External consistency, bought with a few milliseconds of patience.</div></div>" +
      "<h3>Percolator — transactions layered on a versioned store</h3>" +
      "<p>Percolator builds snapshot-isolation transactions <em>on top of</em> BigTable using extra columns: a <em>lock</em> column and a <em>write</em> (commit-pointer) column per row. Writes buffer client-side; commit runs client-driven 2PC: lock all written rows (one row is the <strong>primary</strong> — the linchpin), then commit by writing the primary's commit record, which atomically decides the whole transaction; secondaries are pointed at it lazily. Any reader stumbling on a leftover lock checks the primary to learn the verdict and can roll the state forward or back — crashed clients can't wedge the system.</p>" },

    { title: "Database Partitioning & Consistent Hashing",
      html: "<p>Transactions span shards because data must be <strong>partitioned</strong> — no node holds everything. Ranges must be split/merged as they grow, and reassigned as nodes come and go; routing (\"which node owns key K?\") must stay cheap and agreed.</p>" +
      "<p>Naive <code>hash(key) mod N</code> reshuffles nearly <em>all</em> keys when N changes. <strong>Consistent hashing</strong> fixes this: map both nodes and keys onto a ring (a hash space that wraps); each key belongs to the next node clockwise. Adding or removing a node relocates only the keys in its immediate arc — a 1/N fraction — and <em>virtual nodes</em> (each physical node appearing at many ring points) smooth the load distribution.</p>" +
      "<h3>Coordination Avoidance</h3>" +
      "<p>The final trick is philosophical: coordinate only when semantics demand it. If operations preserve application invariants regardless of interleaving (<strong>invariant confluence</strong>), replicas may execute them independently and reconcile later — full speed, no consensus on the hot path. Adding items to distinct orders? Confluent. Enforcing \"IDs are unique\" or \"balance ≥ 0\" at the boundary? That genuinely needs coordination. Systems like RAMP explore the middle: transactional visibility (readers see all of a transaction's writes or none) with minimal, metadata-only coordination.</p>" }
  ],
  terms: [
    { t: "atomic commitment", d: "A protocol making a multi-node change all-or-nothing: unanimous promises, then one binding decision." },
    { t: "cohort", d: "A 2PC participant that votes on and then applies (or aborts) its slice of the transaction." },
    { t: "blocking problem", d: "2PC's flaw: yes-voters can neither commit nor abort while the coordinator's verdict is unknown." },
    { t: "three-phase commit", d: "2PC plus a prepare-to-commit round — non-blocking in friendly models, partition-fragile in real ones." },
    { t: "deterministic database", d: "Replicas execute an agreed transaction order with deterministic logic — identical by construction (Calvin)." },
    { t: "TrueTime", d: "Spanner's clock API returning explicit uncertainty intervals; commits wait out the uncertainty to order in real time." },
    { t: "Percolator primary lock", d: "The single row whose commit record atomically decides a whole client-driven transaction." },
    { t: "consistent hashing", d: "Nodes and keys on a hash ring; membership changes move only ~1/N of the keys." },
    { t: "invariant confluence", d: "The property that lets operations proceed without coordination: any interleaving preserves the invariants." }
  ],
  quiz: [
    { type: "mc", q: "All cohorts voted YES; the coordinator then crashed silently. Why can't a cohort just abort?",
      opts: ["Its lease expired", "Its YES vote was a durable promise — the coordinator may have logged COMMIT and told someone else", "The lock manager forbids it", "Aborts require unanimous votes too"], a: 1,
      why: "A verdict may already exist and be partially applied; unilateral abort could split the atom. That's precisely the blocking problem." },
    { type: "mc", q: "How does Calvin avoid running an atomic commitment protocol per transaction?",
      opts: ["It forbids multi-shard transactions", "A consensus-backed sequencer fixes a global transaction order first; deterministic replicas simply execute it", "It uses TrueTime", "It retries until conflicts vanish"], a: 1,
      why: "Determinism means agreement on the input order implies agreement on every resulting state — commit protocols become redundant." },
    { type: "mc", q: "Why do Spanner transactions deliberately wait before publishing their writes?",
      opts: ["To batch disk flushes", "To let TrueTime's clock-uncertainty interval pass, guaranteeing timestamp order matches real-time order", "To wait for all replicas", "To acquire locks lazily"], a: 1,
      why: "The commit-wait rides out clock uncertainty, buying external consistency with bounded added latency." },
    { type: "mc", q: "With consistent hashing, adding one node to a 10-node ring moves roughly…",
      opts: ["all keys", "half the keys", "about a tenth of the keys — just the new node's arc", "no keys"], a: 2,
      why: "Only keys falling in the arc now owned by the newcomer relocate; mod-N hashing would have reshuffled almost everything." },
    { type: "order", q: "Order a successful two-phase commit:",
      items: ["Coordinator sends PREPARE to all cohorts", "Each cohort durably logs readiness and votes YES", "Coordinator logs the decision and broadcasts COMMIT", "Cohorts apply and acknowledge"],
      why: "Promises first — durably — then one decision binds everyone." }
  ]
});

/* ======================= CHAPTER 14 ======================= */
CHAPTERS.push({
  num: 20, part: 3, title: "Consensus",
  blurb: "This is the hardest and most important problem in distributed systems: getting a group of unreliable machines to agree on a single value and never go back on it, even as some of them crash. This chapter builds up to the well-known algorithms that solve it, Paxos (powerful but famously hard to follow) and Raft (designed to be understandable), and shows how they work step by step. We finish with the extreme case where some machines might not just fail but actively lie, and how a system can still reach agreement anyway.",
  sections: [
    { title: "Broadcast, Atomic Broadcast & Virtual Synchrony",
      html: "<p>Consensus makes processes <strong>agree</strong>: every correct process decides the <em>same</em> value (agreement), only a value someone actually proposed (validity), and eventually decides at all (termination). Its sibling problem is broadcast. A plain <em>best-effort broadcast</em> dies with its sender mid-send; <em>reliable broadcast</em> (everyone relays everything) survives but delivers in chaotic orders.</p>" +
      "<p><strong>Atomic broadcast</strong> (total order broadcast) demands both: messages delivered everywhere, and everywhere in the <em>same order</em>. This is consensus wearing different clothes — solve one and you've solved the other: an ordered, agreed sequence of decisions is exactly a replicated log.</p>" +
      "<h3>Virtual Synchrony</h3>" +
      "<p>One classical framing: group membership as first-class. Processes belong to <em>views</em>; messages are delivered within a view, and all members observe the same messages between the same membership changes. Elegant model, historically hampered by implementations that stall while memberships settle.</p>" +
      "<h3>ZAB — ZooKeeper Atomic Broadcast</h3>" +
      "<p>The atomic broadcast that runs much of the industry's coordination. A single elected leader sequences all writes in numbered <em>epochs</em>: a new leader first learns the latest state from a quorum of followers and closes the old epoch (no stale leader can slip anything in — its epoch is dead), then proposes, collects quorum acks, and commits, in strict order. Fast in the steady state: ordering costs no negotiation because exactly one process does the ordering.</p>" },

    { title: "Paxos: The Mother Algorithm",
      html: "<p><strong>Paxos</strong> distributes agreement over three roles (usually collocated): <strong>proposers</strong> push candidate values, <strong>acceptors</strong> vote, <strong>learners</strong> adopt results.</p>" +
      "<h3>The Algorithm</h3>" +
      "<ol><li><strong>Prepare</strong> — a proposer picks a globally-unique, monotonically-increasing ballot number n and asks acceptors to promise: \"ignore anything numbered below n — and tell me the highest-numbered value you've already accepted.\"</li>" +
      "<li><strong>Promise</strong> — an acceptor promises (if n beats what it has seen) and reports any prior acceptance.</li>" +
      "<li><strong>Accept</strong> — with a quorum of promises, the proposer proposes <em>the highest-ballot value it heard back</em> — or its own value only if it heard none. This is the safety heart: a possibly-chosen value can never be overwritten, only re-proposed.</li>" +
      "<li><strong>Accepted</strong> — a quorum accepting value v at ballot n makes v <em>chosen</em> — permanently.</li></ol>" +
      "<div class='fig'><svg viewBox='0 0 760 265' xmlns='http://www.w3.org/2000/svg' font-family='Menlo,monospace'>" +
      "<text x='110' y='28' text-anchor='middle' fill='#ffd166' font-size='12'>proposer</text>" +
      "<text x='330' y='28' text-anchor='middle' fill='#c9d6ea' font-size='12'>acceptor 1</text>" +
      "<text x='510' y='28' text-anchor='middle' fill='#c9d6ea' font-size='12'>acceptor 2</text>" +
      "<text x='690' y='28' text-anchor='middle' fill='#7d8fb0' font-size='12'>acceptor 3</text>" +
      "<line x1='110' y1='38' x2='110' y2='250' stroke='#1c2a45' stroke-width='2'/>" +
      "<line x1='330' y1='38' x2='330' y2='250' stroke='#1c2a45' stroke-width='2'/>" +
      "<line x1='510' y1='38' x2='510' y2='250' stroke='#1c2a45' stroke-width='2'/>" +
      "<line x1='690' y1='38' x2='690' y2='250' stroke='#1c2a45' stroke-width='2' stroke-dasharray='5 4'/>" +
      "<line x1='110' y1='60' x2='325' y2='75' stroke='#2de2ff' stroke-width='2'/><polygon points='330,75 318,70 320,80' fill='#2de2ff'/>" +
      "<line x1='110' y1='60' x2='505' y2='83' stroke='#2de2ff' stroke-width='2'/><polygon points='510,83 498,78 500,88' fill='#2de2ff'/>" +
      "<line x1='110' y1='60' x2='560' y2='72' stroke='#2de2ff' stroke-width='1.5' stroke-dasharray='4 4'/><text x='585' y='72' fill='#7d8fb0' font-size='9.5'>lost ✕</text>" +
      "<text x='195' y='53' fill='#2de2ff' font-size='10.5'>① prepare(n=5)</text>" +
      "<line x1='330' y1='100' x2='115' y2='115' stroke='#3ddc97' stroke-width='2'/><polygon points='110,115 122,111 120,121' fill='#3ddc97'/>" +
      "<line x1='510' y1='108' x2='115' y2='123' stroke='#3ddc97' stroke-width='2'/><polygon points='110,123 122,119 120,129' fill='#3ddc97'/>" +
      "<text x='215' y='103' fill='#3ddc97' font-size='10.5'>② promise(5) ×2 = quorum ✓</text>" +
      "<text x='420' y='125' fill='#7d8fb0' font-size='9.5'>+ report any earlier accepted value</text>" +
      "<line x1='110' y1='155' x2='325' y2='170' stroke='#ffd166' stroke-width='2'/><polygon points='330,170 318,165 320,175' fill='#ffd166'/>" +
      "<line x1='110' y1='155' x2='505' y2='178' stroke='#ffd166' stroke-width='2'/><polygon points='510,178 498,173 500,183' fill='#ffd166'/>" +
      "<text x='195' y='148' fill='#ffd166' font-size='10.5'>③ accept(5, v)</text>" +
      "<line x1='330' y1='195' x2='115' y2='210' stroke='#3ddc97' stroke-width='2'/><polygon points='110,210 122,206 120,216' fill='#3ddc97'/>" +
      "<line x1='510' y1='203' x2='115' y2='218' stroke='#3ddc97' stroke-width='2'/><polygon points='110,218 122,214 120,224' fill='#3ddc97'/>" +
      "<text x='215' y='198' fill='#3ddc97' font-size='10.5'>④ accepted ×2 = quorum ✓</text>" +
      "<text x='378' y='245' text-anchor='middle' fill='#ffd166' font-size='11'>v is CHOSEN — permanently. acceptor 3 never even voted.</text>" +
      "</svg><div class='fig-cap'>One clean Paxos round over five messages and a lossy network. A majority (2 of 3) suffices at both phases, so acceptor 3's silence costs nothing. The promise in phase ② is the load-bearing part: it both blocks older ballots and surfaces any possibly-chosen value the new proposer is obliged to re-propose.</div></div>" +
      "<h3>Quorums & Failure Scenarios</h3>" +
      "<p>Majorities are the magic: any two quorums intersect, so any later proposer's prepare phase <em>must</em> meet at least one acceptor who knows the chosen value and will resurface it. Paxos survives proposer crashes (someone else re-runs with a higher ballot), acceptor minorities failing, and message loss. Its liveness bane: <em>dueling proposers</em> forever preempting each other with ever-higher ballots — broken in practice with randomized backoff or by electing a distinguished proposer.</p>" +
      "<p>Run the nastiest scenario by hand — five acceptors A₁–A₅, and proposer P₁ crashes mid-flight:</p>" +
      "<ul><li>P₁ wins promises at ballot 1, sends <em>accept(1, X)</em>… and dies after only A₁ and A₂ accept. Two of five: X is <strong>not chosen</strong> (no quorum), but it's not nothing either.</li>" +
      "<li>P₂ starts ballot 2 and gathers promises from {A₂, A₃, A₄} — a quorum. A₂ reports \"I accepted X at ballot 1\"; A₃ and A₄ report nothing. The rule fires: P₂ must propose <strong>X</strong>, not its own value. If a quorum <em>might</em> have accepted X, re-proposing X is the only safe move.</li>" +
      "<li>Contrast the sunnier case: had P₂'s quorum been {A₃, A₄, A₅} — three acceptors that never saw X — every report comes back empty, and P₂ may propose its own value Y freely. Both outcomes are correct, because X had not been chosen; what matters is that no quorum that <em>could</em> overlap a successful accept round can miss it.</li></ul>" +
      "<p>Now the punchline about why the prepare phase exists at all: once a value IS chosen — accepted by a full quorum — <em>every</em> future prepare quorum intersects that accept quorum in at least one acceptor, so every future proposer hears about the value and is forced to re-propose it, forever. Ballots may keep climbing; the value can never change. Agreement isn't an event in Paxos; it's a point of no return.</p>" +
      "<h3>Multi-Paxos & the Zoo of Variants</h3>" +
      "<p>Real systems need a <em>log</em> of decisions, not one. <strong>Multi-Paxos</strong> amortizes: run prepare once to establish a stable leader, who then drives many accept rounds (one per log slot) until challenged — turning two round trips into one. Then the family tree: <strong>Fast Paxos</strong> lets clients send values straight to acceptors (larger quorums, collision recovery); <strong>EPaxos</strong> goes leaderless, ordering only genuinely conflicting commands via dependency graphs; <strong>Flexible Paxos</strong> generalizes the quorum requirement — phase-1 and phase-2 quorums need only intersect <em>each other</em>, so a leader can commit with fewer acks if elections pay more.</p>" +
      "<h3>Generalized Solution to Consensus</h3>" +
      "<p>Recent work reframes all of these as one pattern: nodes write to and read from immutable per-round registers, and any configuration of intersecting read/write quorums yields a correct consensus — Paxos and friends drop out as special cases. A hint that the design space is far from exhausted.</p>" },

    { title: "Raft: Consensus You Can Hold in Your Head", viz: "raft", vizTitle: "Raft: elections, replication, commits",
      html: "<p><strong>Raft</strong> was designed for understandability, decomposing consensus into leader election + log replication + safety rules, with time cut into numbered <strong>terms</strong>, each having at most one leader.</p>" +
      "<h3>Election</h3>" +
      "<p>Followers expect periodic heartbeats. A follower whose randomized <em>election timeout</em> expires becomes a <strong>candidate</strong>: increments the term, votes for itself, solicits votes. Majority ⇒ leader; a rival's higher term ⇒ step down; split vote ⇒ new randomized timeout breaks the tie next round. One vote per node per term makes two leaders in a term arithmetically impossible.</p>" +
      "<h3>Leader Role & Replication</h3>" +
      "<p>All writes flow through the leader: append to own log → replicate via <em>AppendEntries</em> → once a majority holds an entry, it's <strong>committed</strong> — applied and acknowledged. Heartbeats are just empty AppendEntries. Consistency checks in AppendEntries (previous entry's index+term must match) force followers' logs into agreement, back-filling or truncating divergent tails.</p>" +
      "<h3>Failure Scenarios & Safety</h3>" +
      "<p>The election restriction does the heavy lifting: a node votes only for candidates whose log is <em>at least as up-to-date</em> as its own — so no leader can be elected that lacks a committed entry (it lives on a majority, and majorities overlap). A deposed leader's unreplicated tail entries are overwritten by the new leader; anything committed survives every failover. Old leaders rejoining discover the higher term and fall in line as followers.</p>" +
      "<p>Trace one repair. Leader L (term 2) has entries [1,1,2,2,2] (numbers are each entry's term); it committed through index 3, then crashed while indexes 4–5 sat unreplicated. Follower F, holding [1,1,2], wins the term-3 election (its log contains everything committed, so it's electable) and accepts a new entry: [1,1,2,3]. When old L rejoins as a follower, the new leader's AppendEntries consistency check walks backward until the logs agree at index 3, then <strong>truncates L's tail</strong> — the uncommitted [2,2] at indexes 4–5 vanish, replaced by [3]. Was anything lost? Nothing that counted: those entries never reached a majority, so no client was ever told they committed. The invariant to internalize: <em>committed = replicated to a majority = present in every electable candidate's log = permanent</em>; everything short of that is provisional by design, and clients learn success only past the commit line.</p>" +
      "<div class='callout'>In the simulation above: kill the leader, elect a successor, and check that every committed entry is still in every live log.</div>" },

    { title: "Byzantine Consensus: When Nodes Lie",
      html: "<p>Everything so far trusted processes to fail <em>honestly</em>. In trustless settings (cross-organization systems, blockchains), a faulty node may send different lies to different peers. Tolerating <strong>f</strong> such traitors requires <strong>3f + 1</strong> participants — with fewer, liars and network delays are indistinguishable from honest confusion.</p>" +
      "<h3>PBFT — Practical Byzantine Fault Tolerance</h3>" +
      "<p>PBFT runs a primary plus replicas through three all-to-all rounds, every message signed:</p>" +
      "<ol><li><strong>Pre-prepare</strong> — the primary assigns the request a sequence number and broadcasts it.</li>" +
      "<li><strong>Prepare</strong> — replicas echo to everyone; collecting 2f matching prepares proves a quorum of honest nodes saw the <em>same</em> proposal (the primary can't have equivocated undetected).</li>" +
      "<li><strong>Commit</strong> — replicas announce readiness; 2f + 1 matching commits ⇒ execute and reply. The client waits for f + 1 identical replies — at least one is from an honest node.</li></ol>" +
      "<p>A misbehaving or silent primary triggers a signed <strong>view change</strong> replacing it deterministically. The all-to-all O(n²) message traffic is the tax that keeps BFT clusters small.</p>" +
      "<div class='fig'><svg viewBox='0 0 760 250' xmlns='http://www.w3.org/2000/svg' font-family='Menlo,monospace'>" +
      "<text x='95' y='30' text-anchor='end' fill='#ffd166' font-size='11.5'>primary</text>" +
      "<text x='95' y='85' text-anchor='end' fill='#c9d6ea' font-size='11.5'>replica 1</text>" +
      "<text x='95' y='140' text-anchor='end' fill='#c9d6ea' font-size='11.5'>replica 2</text>" +
      "<text x='95' y='195' text-anchor='end' fill='#ff5d73' font-size='11.5'>replica 3 ☠</text>" +
      "<line x1='110' y1='26' x2='730' y2='26' stroke='#1c2a45' stroke-width='2'/>" +
      "<line x1='110' y1='81' x2='730' y2='81' stroke='#1c2a45' stroke-width='2'/>" +
      "<line x1='110' y1='136' x2='730' y2='136' stroke='#1c2a45' stroke-width='2'/>" +
      "<line x1='110' y1='191' x2='730' y2='191' stroke='#ff5d73' stroke-width='1.5' stroke-dasharray='5 4'/>" +
      "<line x1='150' y1='26' x2='230' y2='81' stroke='#2de2ff' stroke-width='2'/><line x1='150' y1='26' x2='230' y2='136' stroke='#2de2ff' stroke-width='2'/><line x1='150' y1='26' x2='230' y2='191' stroke='#2de2ff' stroke-width='1.5' stroke-dasharray='4 4'/>" +
      "<text x='160' y='115' fill='#2de2ff' font-size='10.5'>pre-prepare</text>" +
      "<text x='160' y='130' fill='#7d8fb0' font-size='9'>seq # assigned, signed</text>" +
      "<line x1='280' y1='81' x2='360' y2='26' stroke='#3ddc97' stroke-width='2'/><line x1='280' y1='81' x2='360' y2='136' stroke='#3ddc97' stroke-width='2'/>" +
      "<line x1='280' y1='136' x2='360' y2='26' stroke='#3ddc97' stroke-width='2'/><line x1='280' y1='136' x2='360' y2='81' stroke='#3ddc97' stroke-width='2'/>" +
      "<line x1='280' y1='191' x2='360' y2='81' stroke='#ff5d73' stroke-width='1.5' stroke-dasharray='4 4'/><line x1='280' y1='191' x2='360' y2='136' stroke='#ff5d73' stroke-width='1.5' stroke-dasharray='4 4'/>" +
      "<text x='390' y='55' fill='#3ddc97' font-size='10.5'>prepare (all→all)</text>" +
      "<text x='390' y='70' fill='#7d8fb0' font-size='9'>2f matching ⇒ no equivocation</text>" +
      "<line x1='500' y1='26' x2='580' y2='81' stroke='#ffd166' stroke-width='2'/><line x1='500' y1='26' x2='580' y2='136' stroke='#ffd166' stroke-width='2'/>" +
      "<line x1='500' y1='81' x2='580' y2='26' stroke='#ffd166' stroke-width='2'/><line x1='500' y1='81' x2='580' y2='136' stroke='#ffd166' stroke-width='2'/>" +
      "<line x1='500' y1='136' x2='580' y2='26' stroke='#ffd166' stroke-width='2'/><line x1='500' y1='136' x2='580' y2='81' stroke='#ffd166' stroke-width='2'/>" +
      "<text x='600' y='115' fill='#ffd166' font-size='10.5'>commit (all→all)</text>" +
      "<text x='600' y='130' fill='#7d8fb0' font-size='9'>2f+1 ⇒ execute &amp; reply</text>" +
      "<text x='420' y='225' text-anchor='middle' fill='#7d8fb0' font-size='10.5'>f = 1 traitor tolerated with n = 3f + 1 = 4 replicas · every message signed · replica 3's lies (red) can't assemble a quorum</text>" +
      "</svg><div class='fig-cap'>PBFT's three rounds with one Byzantine replica. The primary assigns an order (pre-prepare); replicas cross-check it against each other (prepare — this is what catches a lying primary sending different orders to different replicas); then confirm readiness (commit). Honest quorums of 2f+1 always out-vote the f traitors, and the client believes only f+1 matching replies.</div></div>" +
      "<h3>Recovery and Checkpointing</h3>" +
      "<p>Certificates (those 2f+1 signed message sets) can't be kept forever. Replicas periodically agree on a signed <strong>stable checkpoint</strong> — proof of a common prefix of executed operations — then discard older protocol messages. Lagging or recovering replicas fast-forward from the latest checkpoint instead of replaying signed history from genesis.</p>" }
  ],
  terms: [
    { t: "consensus", d: "Agreement + validity + termination: all correct nodes decide the same proposed value, eventually." },
    { t: "atomic broadcast", d: "Everyone delivers the same messages in the same order — equivalent in power to consensus." },
    { t: "ZAB", d: "ZooKeeper's leader-based atomic broadcast: epochs, quorum acks, strict sequential commits." },
    { t: "ballot number", d: "Paxos's monotonically increasing proposal number; higher ballots preempt lower ones." },
    { t: "quorum intersection", d: "Any two majorities share a member — the mechanism that makes chosen values indelible." },
    { t: "Multi-Paxos", d: "One prepare phase establishes a stable leader who drives many single-round-trip decisions." },
    { t: "term (Raft)", d: "A numbered epoch with at most one leader; higher terms instantly depose lower ones." },
    { t: "committed entry", d: "A log entry replicated to a majority — guaranteed to survive every subsequent leader change." },
    { t: "3f + 1", d: "Minimum nodes to tolerate f Byzantine (lying) faults." },
    { t: "view change (PBFT)", d: "The signed protocol that deterministically replaces a faulty primary." }
  ],
  quiz: [
    { type: "mc", q: "In Paxos, a proposer wins its prepare phase and finds an acceptor already accepted value v at a lower ballot. It must…",
      opts: ["propose its own value anyway — higher ballot wins", "propose v, the highest-ballot value reported", "abort the round permanently", "split the quorum in half"], a: 1,
      why: "Re-proposing possibly-chosen values is THE safety rule: quorum intersection ensures a chosen value is always seen and never displaced." },
    { type: "mc", q: "Why can a Raft term never have two leaders?",
      opts: ["The network delivers votes in order", "Each node votes at most once per term, and winning takes a majority — two majorities would share a voter", "Leaders are assigned round-robin", "Election timeouts are synchronized"], a: 1,
      why: "One-vote-per-term plus overlapping majorities makes a second winner arithmetically impossible." },
    { type: "mc", q: "A Raft leader crashes. Which entries are guaranteed to survive into the next leadership?",
      opts: ["All entries in the crashed leader's log", "Only committed entries — those already replicated to a majority", "None; the log restarts", "Only entries from earlier terms"], a: 1,
      why: "Committed entries live on a majority, and the up-to-date-log election rule means any electable candidate has them; uncommitted tail entries may be discarded." },
    { type: "mc", q: "Why does Byzantine tolerance of f faults need 3f + 1 nodes when crash tolerance needs only 2f + 1?",
      opts: ["Signatures triple message size", "Quorums must overlap in enough honest nodes even when f liars vote in both — and f more honest nodes may be unreachable", "It's a regulatory convention", "Byzantine nodes crash more often"], a: 1,
      why: "With arbitrary faults you need quorum intersections to contain at least one honest node beyond the f possible traitors, under worst-case reachability." },
    { type: "order", q: "Order a client write through Raft:",
      items: ["Leader appends the entry to its own log", "Leader sends AppendEntries to followers", "A majority acknowledges the entry", "The entry is committed and applied"],
      why: "Self first, replicate second, majority makes it permanent, then it's applied and acknowledged." }
  ]
});
