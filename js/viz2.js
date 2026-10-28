/* ==========================================================================
   viz2.js — interactive visualizations, Part II (distributed systems)
   Same registry (window.VIZ) and conventions as viz.js. These sims animate
   messages between nodes on canvas/SVG; several let you inject failures.
   ========================================================================== */

(function () {
  "use strict";
  window.VIZ = window.VIZ || {};

  var NS = "http://www.w3.org/2000/svg";
  var C = { cyan: "#2de2ff", blue: "#4f7cff", gold: "#ffd166", red: "#ff5d73",
            green: "#3ddc97", dim: "#7d8fb0", line: "#1c2a45", bg: "#0c1220", text: "#c9d6ea" };
  // SVG attributes keep the legacy hexes above and are re-inked by the CSS
  // remap in tokens.css. Canvas can't be reached by CSS, so canvas draw passes
  // shadow C with this live token palette (read per frame → theme-reactive).
  function CP() {
    var s = getComputedStyle(document.documentElement);
    function v(n) { return s.getPropertyValue(n).trim(); }
    return { cyan: v("--primary"), blue: v("--teal"), gold: v("--orange"),
             red: v("--pink"), green: v("--green"), dim: v("--text-dim"),
             line: v("--line"), bg: v("--bg-3"), text: v("--text") };
  }

  function S(tag, attrs, parent) {
    var e = document.createElementNS(NS, tag);
    for (var k in attrs) e.setAttribute(k, attrs[k]);
    if (parent) parent.appendChild(e);
    return e;
  }
  function T(parent, x, y, str, opts) {
    opts = opts || {};
    var t = S("text", { x: x, y: y, fill: opts.fill || C.text, "font-size": opts.size || 13,
      "font-family": "ui-monospace,Menlo,monospace", "text-anchor": opts.anchor || "middle",
      "dominant-baseline": "middle" }, parent);
    t.textContent = str;
    return t;
  }
  function div(cls) { var d = document.createElement("div"); d.className = cls || ""; return d; }
  function frame(el) {
    var mount = el.querySelector(".viz-mount");
    var body = div("viz-body"), controls = div("viz-controls"), note = div("viz-note");
    mount.appendChild(body); mount.appendChild(controls); mount.appendChild(note);
    return {
      body: body, controls: controls, note: note,
      btn: function (label, fn) {
        var b = document.createElement("button");
        b.textContent = label; b.addEventListener("click", fn);
        controls.appendChild(b); return b;
      },
      say: function (m) { note.textContent = m; }
    };
  }
  function wrap(s, n) {
    var words = s.split(" "), out = [], line = "";
    words.forEach(function (w) {
      if ((line + " " + w).length > n) { out.push(line); line = w; } else line = line ? line + " " + w : w;
    });
    if (line) out.push(line);
    return out;
  }

  // Animation loop that pauses while the viz is scrolled off-screen.
  // Mounting is already lazy (app.js mounts a viz only near the viewport),
  // so the loop starts immediately; the observer just pauses/resumes it.
  function visibleLoop(el, tick) {
    var running = false, raf;
    // schedule (don't invoke) the first tick, so mount functions finish
    // initializing their state before the loop's first frame runs
    function start() { if (running) return; running = true; raf = requestAnimationFrame(loop); }
    function stop() { running = false; cancelAnimationFrame(raf); }
    function loop() { if (!running) return; tick(); raf = requestAnimationFrame(loop); }
    new IntersectionObserver(function (en) {
      if (en[0].isIntersecting) start(); else stop();
    }).observe(el);
    start();
  }

  /* ========================================================================
     11. TWO GENERALS — the impossibility of agreement over a lossy link
     ======================================================================== */
  VIZ.twogenerals = function (el) {
    var f = frame(el);
    var cv = document.createElement("canvas");
    cv.width = 700; cv.height = 220; cv.style.height = "auto";
    f.body.appendChild(cv);
    var ctx = cv.getContext("2d");
    var lossP = 0.4, msgs = [], acks = 0, lost = 0, status = "Two armies must attack TOGETHER or lose. Their only channel: messengers through a valley that eats " + Math.round(lossP * 100) + "% of them.";

    var slider = document.createElement("input");
    slider.type = "range"; slider.min = 0; slider.max = 90; slider.value = 40;
    var lbl = document.createElement("label");
    lbl.textContent = "loss 40%";
    slider.addEventListener("input", function () { lossP = slider.value / 100; lbl.textContent = "loss " + slider.value + "%"; });
    f.controls.appendChild(lbl); f.controls.appendChild(slider);

    function send(dir) { // dir 1 = A→B, -1 = B→A
      msgs.push({ t: 0, dir: dir, doomed: Math.random() < lossP });
    }
    f.btn("send attack plan →", function () { send(1); status = "General A sends: “attack at dawn”. Will it arrive? A can never be sure…"; });
    f.btn("← send ack", function () { send(-1); status = "General B acks… but now B doesn't know if the ACK arrived. Acking the ack regresses forever."; });
    f.btn("reset", function () { msgs = []; acks = 0; lost = 0; status = "No finite number of messages creates COMMON knowledge over a lossy link."; });

    function draw() {
      var C = CP();
      ctx.clearRect(0, 0, 700, 220);
      // camps
      [["General A", 70], ["General B", 630]].forEach(function (g) {
        ctx.strokeStyle = C.blue; ctx.fillStyle = C.bg;
        ctx.beginPath(); ctx.arc(g[1], 90, 34, 0, 7); ctx.fill(); ctx.stroke();
        ctx.fillStyle = C.text; ctx.font = "500 12px Figtree, sans-serif"; ctx.textAlign = "center";
        ctx.fillText(g[0], g[1], 94);
      });
      // valley
      ctx.strokeStyle = C.line; ctx.setLineDash([6, 5]);
      ctx.beginPath(); ctx.moveTo(110, 90); ctx.lineTo(590, 90); ctx.stroke();
      ctx.setLineDash([]);
      ctx.fillStyle = C.dim; ctx.fillText("~ the valley (lossy channel) ~", 350, 130);

      // messages in flight
      msgs = msgs.filter(function (m) {
        m.t += 0.012;
        var x = m.dir === 1 ? 110 + m.t * 480 : 590 - m.t * 480;
        if (m.doomed && m.t > 0.5) { // eaten mid-valley
          ctx.fillStyle = C.red; ctx.fillText("✕ lost", x, 74);
          lost++;
          status = "A messenger was lost. The sender will NEVER know — that uncertainty is the whole problem.";
          return false;
        }
        if (m.t >= 1) {
          acks++;
          status = "Delivered! But the sender doesn't know that. Only another (also lossy) message could tell them.";
          return false;
        }
        ctx.fillStyle = m.dir === 1 ? C.cyan : C.gold;
        ctx.beginPath(); ctx.arc(x, 90, 5, 0, 7); ctx.fill();
        return true;
      });
      ctx.fillStyle = C.dim;
      ctx.fillText("delivered: " + acks + "   lost: " + lost, 350, 160);
      ctx.fillStyle = C.gold;
      wrap(status, 78).forEach(function (l, i) { ctx.fillText(l, 350, 185 + i * 16); });
    }
    visibleLoop(el, draw);
    f.say("Send messages back and forth. However many arrive, certainty never does.");
  };

  /* ========================================================================
     12. FAILURE DETECTION — heartbeats & a phi-accrual-style suspicion level
     ======================================================================== */
  VIZ.heartbeat = function (el) {
    var f = frame(el);
    var cv = document.createElement("canvas");
    cv.width = 700; cv.height = 230; cv.style.height = "auto";
    f.body.appendChild(cv);
    var ctx = cv.getContext("2d");
    var alive = true, lastBeat = performance.now(), interval = 1400, jitter = 500;
    var nextBeat = lastBeat + interval;
    var history = [], THRESH = 3.0;

    f.btn("⏸ pause the node", function () { alive = false; });
    f.btn("▶ resume the node", function () { alive = true; nextBeat = performance.now() + 300; });

    function draw() {
      var C = CP();
      var now = performance.now();
      if (alive && now >= nextBeat) {
        lastBeat = now;
        nextBeat = now + interval + (Math.random() - 0.5) * jitter;
        history.push(now);
        if (history.length > 20) history.shift();
      }
      // suspicion: elapsed-since-last-beat scaled by expected interval.
      // (Real phi-accrual fits a distribution to inter-arrival times; the
      // shape of the idea — a continuous score, not a binary timeout — is the same.)
      var phi = (now - lastBeat) / interval;
      var suspected = phi > THRESH;

      ctx.clearRect(0, 0, 700, 230);
      // node icon
      ctx.strokeStyle = suspected ? C.red : C.green;
      ctx.fillStyle = C.bg;
      ctx.beginPath(); ctx.arc(70, 70, 30, 0, 7); ctx.fill(); ctx.stroke();
      ctx.fillStyle = suspected ? C.red : C.green;
      ctx.font = "500 11px Figtree, sans-serif"; ctx.textAlign = "center";
      ctx.fillText(alive ? "node" : "node (dead)", 70, 68);
      ctx.fillText(suspected ? "SUSPECTED" : "trusted", 70, 84);

      // heartbeat timeline (last ~14s)
      var t0 = now - 14000;
      ctx.strokeStyle = C.line;
      ctx.beginPath(); ctx.moveTo(130, 70); ctx.lineTo(680, 70); ctx.stroke();
      history.forEach(function (h) {
        if (h < t0) return;
        var x = 130 + ((h - t0) / 14000) * 550;
        ctx.strokeStyle = C.cyan;
        ctx.beginPath(); ctx.moveTo(x, 55); ctx.lineTo(x, 85); ctx.stroke();
      });
      ctx.fillStyle = C.dim; ctx.textAlign = "left";
      ctx.fillText("heartbeats →", 130, 44);

      // suspicion gauge
      var gw = 550, gx = 130, gy = 130;
      ctx.strokeStyle = C.line; ctx.strokeRect(gx, gy, gw, 26);
      var fill = Math.min(phi / (THRESH * 1.4), 1);
      var grad = ctx.createLinearGradient(gx, 0, gx + gw, 0);
      grad.addColorStop(0, C.green); grad.addColorStop(0.6, C.gold); grad.addColorStop(1, C.red);
      ctx.fillStyle = grad;
      ctx.fillRect(gx + 1, gy + 1, (gw - 2) * fill, 24);
      // threshold marker
      var tx = gx + gw * (THRESH / (THRESH * 1.4));
      ctx.strokeStyle = C.red; ctx.setLineDash([4, 3]);
      ctx.beginPath(); ctx.moveTo(tx, gy - 8); ctx.lineTo(tx, gy + 34); ctx.stroke();
      ctx.setLineDash([]);
      ctx.fillStyle = C.text; ctx.textAlign = "left";
      ctx.fillText("suspicion φ = " + phi.toFixed(2), gx, gy + 48);
      ctx.fillStyle = C.red; ctx.fillText("threshold", tx + 6, gy - 4);

      ctx.fillStyle = C.gold; ctx.textAlign = "center";
      var msg = suspected
        ? "φ crossed the threshold → the detector SUSPECTS the node. If a late heartbeat arrives, trust is restored — suspicion, not certainty."
        : alive ? "Heartbeats keep arriving; suspicion decays to zero each time one lands."
                : "Node paused — no heartbeats. Watch suspicion accrue continuously instead of a binary timeout firing.";
      wrap(msg, 80).forEach(function (l, i) { ctx.fillText(l, 350, 200 + i * 15); });
    }
    visibleLoop(el, draw);
    f.say("Pause the node and watch the accrual detector grow suspicious — then resurrect it.");
  };

  /* ========================================================================
     13. BULLY LEADER ELECTION — highest rank wins
     ======================================================================== */
  VIZ.election = function (el) {
    var f = frame(el);
    var svg = S("svg", { viewBox: "0 0 700 280" }, f.body);
    var nodes, leader, phase, msg;

    function reset() {
      nodes = [1, 2, 3, 4, 5].map(function (id, i) {
        return { id: id, alive: true, x: 110 + i * 120, y: 110 };
      });
      leader = 5; phase = "stable";
      msg = "Node 5 (highest rank) is the leader. Kill it to trigger a bully election.";
      render();
    }
    function killLeader() {
      var l = nodes.find(function (n) { return n.id === leader; });
      if (!l || !l.alive) return;
      l.alive = false; phase = "detect";
      msg = "Node " + leader + " died. Suppose node 2 notices the missing heartbeats first…";
      leader = null;
      render();
    }
    function step() {
      if (phase === "detect") {
        phase = "election";
        msg = "Node 2 sends ELECTION to every node with a HIGHER rank (3, 4, 5). Any live higher node replies and takes over the election.";
      } else if (phase === "election") {
        phase = "bully";
        msg = "Nodes 3 and 4 answer “I'm alive” (5 stays silent — it's dead). The highest live responder, node 4, bullies its way onward.";
      } else if (phase === "bully") {
        phase = "coord";
        leader = Math.max.apply(null, nodes.filter(function (n) { return n.alive; }).map(function (n) { return n.id; }));
        msg = "Node " + leader + " hears silence from above → it declares itself COORDINATOR and broadcasts victory to everyone below.";
      } else if (phase === "coord") {
        phase = "stable";
        msg = "Stable again. Caveat: if the old leader revives, it will bully the leadership right back — one cause of flapping.";
      } else if (phase === "stable" && leader) {
        msg = "Cluster is stable under node " + leader + ".";
      }
      render();
    }
    function revive() {
      nodes.forEach(function (n) { n.alive = true; });
      leader = 5; phase = "stable";
      msg = "Everyone is back. Highest rank (5) reclaims leadership — that's the bully property.";
      render();
    }
    function render() {
      svg.innerHTML = "";
      // election message arrows for the current phase
      if (phase === "election") {
        [3, 4, 5].forEach(function (to) { arrow(2, to, C.gold, "ELECTION"); });
      } else if (phase === "bully") {
        [3, 4].forEach(function (fr) { arrow(fr, 2, C.cyan, "ALIVE"); });
      } else if (phase === "coord") {
        nodes.filter(function (n) { return n.alive && n.id !== leader; })
             .forEach(function (n) { arrow(leader, n.id, C.green, "COORDINATOR"); });
      }
      nodes.forEach(function (n) {
        var isL = n.id === leader && phase !== "detect";
        var g = S("g", { opacity: n.alive ? 1 : 0.35 }, svg);
        S("circle", { cx: n.x, cy: n.y, r: 32,
          fill: isL ? "rgba(255,209,102,.12)" : "#0c1220",
          stroke: n.alive ? (isL ? C.gold : C.blue) : C.red, "stroke-width": isL ? 2.5 : 1.5 }, g);
        T(g, n.x, n.y - 4, "N" + n.id, { size: 14, fill: n.alive ? C.text : C.red });
        T(g, n.x, n.y + 14, "rank " + n.id, { size: 9, fill: C.dim });
        if (isL) T(g, n.x, n.y - 46, "👑", { size: 18 });
        if (!n.alive) T(g, n.x, n.y - 46, "💀", { size: 16 });
      });
      wrap(msg, 84).forEach(function (l, i) { T(svg, 350, 218 + i * 16, l, { size: 12, fill: C.gold }); });
    }
    function arrow(fromId, toId, color, label) {
      var a = nodes.find(function (n) { return n.id === fromId; });
      var b = nodes.find(function (n) { return n.id === toId; });
      var lift = Math.abs(toId - fromId) * 18 + 20;
      var mx = (a.x + b.x) / 2, my = a.y - 32 - lift;
      S("path", { d: "M " + a.x + " " + (a.y - 34) + " Q " + mx + " " + my + " " + b.x + " " + (b.y - 34),
        stroke: color, fill: "none", "stroke-width": 1.6, opacity: 0.8 }, svg);
      S("circle", { cx: b.x, cy: b.y - 34, r: 3.5, fill: color }, svg);
      T(svg, mx, my + 8, label, { size: 8.5, fill: color });
    }
    f.btn("💀 kill the leader", killLeader);
    f.btn("step ▸", step);
    f.btn("revive all", revive);
    reset();
  };

  /* ========================================================================
     14. TUNABLE QUORUMS — pick R and W over 5 replicas, test the overlap
     ======================================================================== */
  VIZ.quorum = function (el) {
    var f = frame(el);
    var svg = S("svg", { viewBox: "0 0 700 260" }, f.body);
    var N = 5, W = 3, R = 2;
    var reps = Array(N).fill(0);           // version held by each replica
    var latest = 0;
    var lastWrite = [], lastRead = [], msg = "Slide W and R, then write and read. Overlap is guaranteed only when R + W > N.";

    function mkSlider(label, val, fn) {
      var l = document.createElement("label");
      var s = document.createElement("input");
      s.type = "range"; s.min = 1; s.max = N; s.value = val;
      l.textContent = label + "=" + val + " ";
      s.addEventListener("input", function () { fn(+s.value); l.firstChild.textContent = label + "=" + s.value + " "; render(); });
      l.appendChild(s);
      f.controls.appendChild(l);
    }
    mkSlider("W", W, function (v) { W = v; });
    mkSlider("R", R, function (v) { R = v; });

    function pick(k) { // choose k random distinct replicas
      var idx = [0, 1, 2, 3, 4].sort(function () { return Math.random() - 0.5; });
      return idx.slice(0, k);
    }
    f.btn("write (v++)", function () {
      latest++;
      lastWrite = pick(W); lastRead = [];
      lastWrite.forEach(function (i) { reps[i] = latest; });
      msg = "Wrote version v" + latest + " to " + W + " replica(s). The others still hold stale data until anti-entropy catches up.";
      render();
    });
    f.btn("read", function () {
      lastRead = pick(R); lastWrite = [];
      var seen = Math.max.apply(null, lastRead.map(function (i) { return reps[i]; }));
      var guaranteed = R + W > N;
      msg = "Read " + R + " replica(s) → newest version seen: v" + seen +
        (seen === latest ? " — the latest! " : " — STALE (latest is v" + latest + "). ") +
        (guaranteed ? "R+W=" + (R + W) + " > N=5, so read and write sets MUST overlap: staleness is impossible."
                    : "R+W=" + (R + W) + " ≤ N=5: no overlap guarantee — reads may miss the newest write.");
      render();
    });
    function render() {
      svg.innerHTML = "";
      T(svg, 350, 18, "N = 5 replicas · latest committed version: v" + latest, { fill: C.dim, size: 12 });
      for (var i = 0; i < N; i++) {
        var x = 100 + i * 125;
        var inW = lastWrite.indexOf(i) !== -1, inR = lastRead.indexOf(i) !== -1;
        var stale = reps[i] < latest;
        S("rect", { x: x - 45, y: 44, width: 90, height: 74, rx: 10,
          fill: inW ? "rgba(61,220,151,.12)" : inR ? "rgba(255,209,102,.12)" : "#0c1220",
          stroke: inW ? C.green : inR ? C.gold : (stale ? C.dim : C.cyan),
          "stroke-width": inW || inR ? 2.2 : 1.3 }, svg);
        T(svg, x, 66, "replica " + (i + 1), { size: 10.5, fill: C.dim });
        T(svg, x, 92, "v" + reps[i], { size: 17, fill: stale ? C.dim : C.cyan });
        if (inW) T(svg, x, 132, "← write", { size: 10, fill: C.green });
        if (inR) T(svg, x, 132, "← read", { size: 10, fill: C.gold });
      }
      // overlap meter
      var over = R + W - N;
      T(svg, 350, 168, "R + W = " + (R + W) + (R + W > N ? "  >  N — guaranteed overlap of ≥ " + over : "  ≤  N — overlap NOT guaranteed"),
        { size: 13, fill: R + W > N ? C.green : C.red });
      wrap(msg, 88).forEach(function (l, i2) { T(svg, 350, 196 + i2 * 16, l, { size: 11.5, fill: C.gold }); });
    }
    render();
  };

  /* ========================================================================
     15. GOSSIP DISSEMINATION — epidemic spread across a cluster
     ======================================================================== */
  VIZ.gossip = function (el) {
    var f = frame(el);
    var cv = document.createElement("canvas");
    cv.width = 700; cv.height = 300; cv.style.height = "auto";
    f.body.appendChild(cv);
    var ctx = cv.getContext("2d");
    var NODES = 36, FANOUT = 3;
    var nodes, round, flights;

    function reset() {
      nodes = [];
      for (var i = 0; i < NODES; i++) {
        nodes.push({
          x: 60 + Math.random() * 580, y: 45 + Math.random() * 200,
          hot: false
        });
      }
      nodes[Math.floor(Math.random() * NODES)].hot = true; // patient zero
      round = 0; flights = [];
      f.say("One node learned an update (gold). Each round, every informed node gossips to " + FANOUT + " random peers.");
    }
    function gossipRound() {
      if (flights.length) return; // wait for animation to settle
      round++;
      nodes.forEach(function (n) {
        if (!n.hot) return;
        for (var k = 0; k < FANOUT; k++) {
          var peer = nodes[Math.floor(Math.random() * NODES)];
          if (peer !== n) flights.push({ a: n, b: peer, t: 0 });
        }
      });
    }
    function draw() {
      var C = CP();
      ctx.clearRect(0, 0, 700, 300);
      // flights
      flights = flights.filter(function (fl) {
        fl.t += 0.045;
        var x = fl.a.x + (fl.b.x - fl.a.x) * fl.t;
        var y = fl.a.y + (fl.b.y - fl.a.y) * fl.t;
        ctx.globalAlpha = 0.3; ctx.strokeStyle = C.cyan;
        ctx.beginPath(); ctx.moveTo(fl.a.x, fl.a.y); ctx.lineTo(x, y); ctx.stroke();
        ctx.globalAlpha = 1;
        ctx.fillStyle = C.cyan;
        ctx.beginPath(); ctx.arc(x, y, 3, 0, 7); ctx.fill();
        if (fl.t >= 1) { fl.b.hot = true; return false; }
        return true;
      });
      // nodes
      var hotN = 0;
      nodes.forEach(function (n) {
        if (n.hot) hotN++;
        ctx.fillStyle = n.hot ? C.gold : C.line;
        ctx.strokeStyle = n.hot ? C.gold : C.dim;
        ctx.beginPath(); ctx.arc(n.x, n.y, 6, 0, 7); ctx.fill();
      });
      ctx.fillStyle = C.text; ctx.font = "500 12px Figtree, sans-serif"; ctx.textAlign = "center";
      ctx.fillText("round " + round + " — informed: " + hotN + "/" + NODES +
        (hotN === NODES ? "  ✓ fully disseminated in ~log(N) rounds!" : ""), 350, 275);
    }
    visibleLoop(el, draw);
    f.btn("gossip one round", gossipRound);
    f.btn("reset outbreak", reset);
    reset();
  };

  /* ========================================================================
     16. MERKLE TREE ANTI-ENTROPY — locate a divergent range in log time
     ======================================================================== */
  VIZ.merkle = function (el) {
    var f = frame(el);
    var svg = S("svg", { viewBox: "0 0 700 300" }, f.body);
    // two replicas, 8 data ranges each; replica B's range 5 has drifted
    var diffLeaf = 5, stage = 0;
    var msgs = [
      "Replicas A and B each hash their data into a Merkle tree: leaves hash ranges, parents hash their children. Click COMPARE.",
      "Compare ROOT hashes: they differ → the replicas diverge somewhere. One hash exchanged, whole dataset covered.",
      "Descend: left subtrees match (skip half the data instantly!), right subtrees differ → recurse right.",
      "Next level: only the node covering ranges 4–5 differs. Everything else is verified equal without reading it.",
      "Found it: range 5 disagrees. Only THIS range needs repair — log(n) hash comparisons instead of shipping all data."
    ];
    // path from root to the bad leaf (indices in a heap-style layout)
    function render() {
      svg.innerHTML = "";
      [["Replica A", 175, false], ["Replica B", 525, true]].forEach(function (rep) {
        var ox = rep[1], drift = rep[2];
        T(svg, ox, 16, rep[0], { fill: C.dim, size: 12 });
        // depth 0..3 (root..leaves), 8 leaves, x spacing
        for (var d = 0; d <= 3; d++) {
          var count = 1 << d;
          for (var i = 0; i < count; i++) {
            // does this node cover the differing leaf?
            var covers = (diffLeaf >> (3 - d)) === i;
            var differs = covers && drift !== false; // both trees marked, colors differ below
            var checkedAt = [1, 2, 3, 4][d];        // stage at which this level is compared
            var compared = stage >= checkedAt && covers;
            var matchedSibling = stage >= checkedAt && !covers && Math.abs((diffLeaf >> (3 - d)) - i) <= 1;
            var w = 150 / count * 1.9;
            var x = ox - 140 + (i + 0.5) * (280 / count);
            var y = 34 + d * 56;
            // edges to children
            if (d < 3) {
              for (var c = 0; c < 2; c++) {
                var cx = ox - 140 + (i * 2 + c + 0.5) * (280 / (count * 2));
                S("line", { x1: x, y1: y + 11, x2: cx, y2: y + 45, stroke: C.line }, svg);
              }
            }
            var col = compared ? (covers ? C.red : C.green) : C.blue;
            if (stage >= checkedAt && !covers) col = C.green;
            if (stage < checkedAt) col = C.line;
            S("rect", { x: x - 17, y: y - 11, width: 34, height: 22, rx: 5,
              fill: compared && covers ? "rgba(255,93,115,.15)" : "#0c1220",
              stroke: col, "stroke-width": compared && covers ? 2 : 1.2 }, svg);
            // fake hash label: differs on covering path of replica B
            var h = (d * 8 + i * 3 + 7).toString(16);
            if (drift && covers) h = (d * 8 + i * 3 + 12).toString(16);
            T(svg, x, y, "#" + h, { size: 9, fill: stage >= checkedAt ? (covers ? C.red : C.green) : C.dim });
          }
        }
      });
      wrap(msgs[Math.min(stage, 4)], 88).forEach(function (l, i) {
        T(svg, 350, 264 + i * 15, l, { size: 11.5, fill: C.gold });
      });
    }
    f.btn("compare ▸", function () { stage = Math.min(stage + 1, 4); render(); });
    f.btn("reset", function () { stage = 0; render(); });
    render();
  };

  /* ========================================================================
     17. TWO-PHASE COMMIT — propose/vote, commit/ack, with failure injection
     ======================================================================== */
  VIZ.twopc = function (el) {
    var f = frame(el);
    var svg = S("svg", { viewBox: "0 0 700 330" }, f.body);
    var failMode = "none"; // none | cohort | coordinator
    var stage = 0;

    function script() {
      if (failMode === "none") return [
        "A client asks to commit a transaction spanning three cohorts. The coordinator runs the protocol.",
        "PHASE 1 — PREPARE: coordinator asks every cohort “can you commit?”. Each cohort durably logs its ability to comply BEFORE answering.",
        "All cohorts vote YES. A yes vote is a promise: the cohort can no longer unilaterally abort.",
        "PHASE 2 — COMMIT: the coordinator logs the decision and tells everyone to commit.",
        "Cohorts apply and acknowledge. Done — atomic across all three nodes. Cost: two round trips + multiple forced log writes."
      ];
      if (failMode === "cohort") return [
        "Same setup, but cohort 3 will fail during the vote.",
        "PHASE 1 — PREPARE: proposal goes out to all three cohorts.",
        "Cohorts 1–2 vote YES… cohort 3 is down (or votes NO). One missing/negative vote decides it.",
        "PHASE 2 — ABORT: the decision must be unanimous, so the coordinator broadcasts ABORT.",
        "Cohorts roll back. Atomicity preserved: either everyone commits, or no one does."
      ];
      return [
        "Same setup — but the coordinator will crash at the worst possible moment.",
        "PHASE 1 — PREPARE: proposal goes out; every cohort durably prepares.",
        "All vote YES… and the coordinator crashes before announcing a decision. 💥",
        "Cohorts are BLOCKED: each promised not to abort, but none knows the global verdict. They hold locks and wait.",
        "This blocking window is 2PC's Achilles' heel — the motivation for 3PC and, ultimately, for consensus-based commit (Paxos/Raft)."
      ];
    }
    function render() {
      svg.innerHTML = "";
      var msgs = script();
      var actors = [["Coordinator", 120], ["Cohort 1", 320], ["Cohort 2", 480], ["Cohort 3", 640]];
      var coordDead = failMode === "coordinator" && stage >= 2;
      var c3Dead = failMode === "cohort" && stage >= 2;
      actors.forEach(function (a, i) {
        var dead = (i === 0 && coordDead) || (i === 3 && c3Dead);
        S("rect", { x: a[1] - 55, y: 12, width: 110, height: 30, rx: 8,
          fill: "#0c1220", stroke: dead ? C.red : (i === 0 ? C.gold : C.blue), opacity: dead ? 0.5 : 1 }, svg);
        T(svg, a[1], 27, a[0] + (dead ? " 💥" : ""), { size: 11, fill: dead ? C.red : (i === 0 ? C.gold : C.text) });
        S("line", { x1: a[1], y1: 46, x2: a[1], y2: 250, stroke: C.line, "stroke-dasharray": "3 4" }, svg);
      });
      function msgArrow(x1, x2, y, label, color) {
        S("line", { x1: x1, y1: y, x2: x2, y2: y, stroke: color, "stroke-width": 1.6 }, svg);
        S("path", { d: "M " + x2 + " " + y + " l " + (x1 < x2 ? -8 : 8) + " -4 v 8 z", fill: color }, svg);
        T(svg, (x1 + x2) / 2, y - 9, label, { size: 9.5, fill: color });
      }
      var cx = 120;
      // stage 1: prepare to all
      if (stage >= 1) [320, 480, 640].forEach(function (x, i) {
        if (!(c3Dead && i === 2 && stage === 1)) msgArrow(cx, x, 70 + i * 14, i === 0 ? "PREPARE?" : "", C.cyan);
      });
      // stage 2: votes back
      if (stage >= 2) {
        [320, 480].forEach(function (x, i) { msgArrow(x, cx, 128 + i * 14, i === 0 ? "YES" : "", C.green); });
        if (failMode === "cohort") T(svg, 640, 135, "✕ no vote", { size: 10, fill: C.red });
        else msgArrow(640, cx, 156, "YES", C.green);
      }
      // stage 3: decision
      if (stage >= 3) {
        if (failMode === "coordinator") {
          T(svg, 120, 185, "…silence…", { size: 11, fill: C.red });
          [320, 480, 640].forEach(function (x) { T(svg, x, 200, "⏳ blocked", { size: 10, fill: C.gold }); });
        } else {
          var verdict = failMode === "cohort" ? "ABORT!" : "COMMIT!";
          var vcol = failMode === "cohort" ? C.red : C.green;
          [320, 480, 640].forEach(function (x, i) { msgArrow(cx, x, 186 + i * 14, i === 0 ? verdict : "", vcol); });
        }
      }
      // stage 4: acks / outcome
      if (stage >= 4 && failMode === "none") {
        [320, 480, 640].forEach(function (x, i) { msgArrow(x, cx, 232 + i * 6, i === 0 ? "ACK" : "", C.dim); });
      }
      wrap(msgs[stage], 88).forEach(function (l, i) { T(svg, 350, 278 + i * 15, l, { size: 11.5, fill: C.gold }); });
    }
    f.btn("step ▸", function () { stage = Math.min(stage + 1, 4); render(); });
    f.btn("scenario: all good", function () { failMode = "none"; stage = 0; render(); });
    f.btn("scenario: cohort fails", function () { failMode = "cohort"; stage = 0; render(); });
    f.btn("scenario: coordinator crashes", function () { failMode = "coordinator"; stage = 0; render(); });
    render();
  };

  /* ========================================================================
     18. RAFT — leader election + log replication over five nodes
     ======================================================================== */
  VIZ.raft = function (el) {
    var f = frame(el);
    var svg = S("svg", { viewBox: "0 0 700 372" }, f.body);
    var N = 5, nodes, term, flights, msg, pendingEntry;

    function reset() {
      nodes = [];
      for (var i = 0; i < N; i++) {
        var a = (i / N) * Math.PI * 2 - Math.PI / 2;
        nodes.push({
          id: i + 1, alive: true, role: i === 0 ? "leader" : "follower",
          x: 350 + Math.cos(a) * 120, y: 130 + Math.sin(a) * 95,
          log: [], commit: 0
        });
      }
      term = 1; flights = []; pendingEntry = null;
      msg = "Term 1: node 1 is leader, sending heartbeats. Kill it, or send a client write.";
      render();
    }
    function leader() { return nodes.find(function (n) { return n.role === "leader" && n.alive; }); }
    function alive() { return nodes.filter(function (n) { return n.alive; }); }

    function fly(a, b, color, label, onArrive) {
      flights.push({ a: a, b: b, t: 0, color: color, label: label, onArrive: onArrive });
    }
    function killLeader() {
      var l = leader();
      if (!l) { msg = "No leader to kill."; return render(); }
      l.alive = false; l.role = "follower";
      msg = "Leader " + l.id + " crashed. Followers' election timeouts start ticking… (click ELECT)";
      render();
    }
    function elect() {
      if (leader()) { msg = "There's already a live leader for term " + term + "."; return render(); }
      var live = alive();
      if (live.length <= N / 2) { msg = "No majority of nodes alive — the cluster CANNOT elect a leader. Availability lost, safety kept."; return render(); }
      term++;
      var cand = live[Math.floor(Math.random() * live.length)];
      cand.role = "candidate";
      msg = "Node " + cand.id + "'s timeout fired first: it becomes CANDIDATE for term " + term + " and requests votes.";
      var votes = 1, needed = Math.floor(N / 2) + 1;
      live.forEach(function (n) {
        if (n === cand) return;
        fly(cand, n, C.gold, "RequestVote", function () {
          fly(n, cand, C.green, "vote", function () {
            votes++;
            if (votes >= needed && cand.role === "candidate") {
              cand.role = "leader";
              msg = "Node " + cand.id + " got a MAJORITY (" + votes + "/" + N + ") → LEADER of term " + term + ". At most one leader per term, ever.";
              render();
            }
          });
        });
      });
      render();
    }
    function clientWrite() {
      var l = leader();
      if (!l) { msg = "No leader — writes have nowhere to go. Elect one first (that's why elections matter)."; return render(); }
      var entry = { term: term, v: "x=" + Math.floor(Math.random() * 90 + 10) };
      l.log.push(entry);
      var acks = 1, needed = Math.floor(N / 2) + 1, committed = false;
      msg = "Client sends “" + entry.v + "”. Leader appends it to its OWN log first, then replicates via AppendEntries.";
      alive().forEach(function (n) {
        if (n === l) return;
        fly(l, n, C.cyan, "AppendEntries", function () {
          n.log.push(entry);
          fly(n, l, C.green, "ok", function () {
            acks++;
            if (acks >= needed && !committed) {
              committed = true;
              l.commit = l.log.length;
              alive().forEach(function (m) { m.commit = Math.min(m.log.length, l.commit); });
              msg = "Majority (" + acks + "/" + N + ") persisted the entry → COMMITTED. It can now be applied and acknowledged to the client.";
              render();
            }
          });
        });
      });
      render();
    }
    function reviveAll() {
      nodes.forEach(function (n) {
        if (!n.alive) {
          n.alive = true; n.role = "follower";
          var l = leader();
          if (l) { n.log = l.log.slice(); n.commit = l.commit; } // catch up from leader
        }
      });
      msg = "Crashed nodes rejoin as followers and catch up from the leader's log (missing entries are back-filled).";
      render();
    }

    function render() {
      svg.innerHTML = "";
      T(svg, 30, 20, "TERM " + term, { fill: C.gold, size: 13, anchor: "start" });
      // flights (drawn each frame by the loop; here draw static baseline)
      nodes.forEach(function (n) {
        var col = !n.alive ? C.red : n.role === "leader" ? C.gold : n.role === "candidate" ? C.cyan : C.blue;
        var g = S("g", { opacity: n.alive ? 1 : 0.35 }, svg);
        S("circle", { cx: n.x, cy: n.y, r: 26, fill: n.role === "leader" ? "rgba(255,209,102,.12)" : "#0c1220",
          stroke: col, "stroke-width": n.role === "leader" ? 2.5 : 1.5 }, g);
        T(g, n.x, n.y - 5, "N" + n.id, { size: 12, fill: n.alive ? C.text : C.red });
        T(g, n.x, n.y + 10, n.alive ? n.role.slice(0, 6) : "dead", { size: 8, fill: col });
      });
      // logs panel
      T(svg, 350, 242, "REPLICATED LOGS (✔ = committed)", { fill: C.dim, size: 10 });
      nodes.forEach(function (n, i) {
        var y = 256 + i * 18;
        T(svg, 40, y, "N" + n.id, { size: 10, fill: n.alive ? C.text : C.red, anchor: "start" });
        n.log.forEach(function (e, j) {
          var committed = j < n.commit;
          S("rect", { x: 75 + j * 62, y: y - 8, width: 56, height: 15, rx: 4,
            fill: committed ? "rgba(61,220,151,.12)" : "#0c1220",
            stroke: committed ? C.green : C.dim }, svg);
          T(svg, 75 + j * 62 + 28, y, e.v + (committed ? " ✔" : ""), { size: 8.5, fill: committed ? C.green : C.dim });
        });
      });
      msgText();
    }
    var msgEl = null;
    function msgText() {
      wrap(msg, 92).forEach(function (l, i) { T(svg, 350, 348 + i * 14, l, { size: 11, fill: C.gold }); });
    }

    // animation loop: move message dots, then trigger arrivals
    visibleLoop(el, function () {
      // clear previous dots layer by re-rendering only when flights change is
      // costly; instead draw dots on an overlaying group each frame
      var old = svg.querySelector("#flightlayer");
      if (old) old.remove();
      var layer = S("g", { id: "flightlayer" }, svg);
      var arrived = [];
      flights.forEach(function (fl) {
        fl.t += 0.03;
        if (fl.t >= 1) { arrived.push(fl); return; }
        var x = fl.a.x + (fl.b.x - fl.a.x) * fl.t;
        var y = fl.a.y + (fl.b.y - fl.a.y) * fl.t;
        S("line", { x1: fl.a.x, y1: fl.a.y, x2: x, y2: y, stroke: fl.color, opacity: 0.25 }, layer);
        S("circle", { cx: x, cy: y, r: 4, fill: fl.color }, layer);
      });
      if (arrived.length) {
        flights = flights.filter(function (fl) { return arrived.indexOf(fl) === -1; });
        arrived.forEach(function (fl) { if (fl.onArrive) fl.onArrive(); });
        render();
      }
    });

    f.btn("💀 kill leader", killLeader);
    f.btn("🗳 run election", elect);
    f.btn("✍ client write", clientWrite);
    f.btn("revive all", reviveAll);
    f.btn("reset", reset);
    reset();
  };

})();
