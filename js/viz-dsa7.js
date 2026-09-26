/* ==========================================================================
   viz-dsa7.js — DSA By Patterns machines, Part 5 (Graphs, ch32–39).

     dsaGraphRep          ch32 Comparator list against matrix: cost of an operation, memory at n = 2,000
     dsaBfsDfs            ch33 Comparator one graph, a queue and a stack; distance against DFS depth
     dsaZeroOneBfs        ch33 Stepper    the deque with its two priorities; stale entries skipped
     dsaDfsTimes          ch33 Stepper    entry/exit times and the four edge types
     dsaTopoSort          ch34 Stepper    Kahn's peel and DFS finish order; a cycle stalls Kahn
     dsaRelaxation        ch35 Stepper    BFS, Dijkstra, Bellman–Ford, SPFA: one relaxation, four orders
     dsaFloydWarshall     ch35 Builder    the matrix as each vertex is allowed in the middle
     dsaAStar             ch35 Comparator Dijkstra beside A* on one grid, four heuristics
     dsaMST               ch36 Comparator Kruskal and Prim on one graph, ties editable
     dsaTarjanSCC         ch37 Stepper    index and low-link; components emitted; or Kosaraju
     dsaMaxFlow           ch38 Simulator  augmenting paths by BFS, DFS or the worst choice
     dsaDinicLevels       ch38 Stepper    level graph and blocking flow per phase
     dsaMinCut            ch38 Inspector  propose cuts against the one the residual graph gives
     dsaBipartiteMatching ch39 Simulator  Kuhn's alternating paths; the flow view; König's cover
     dsaProjectSelection  ch39 Builder    maximum closure as a minimum cut
     dsaGaleShapley       ch39 Stepper    proposals and held offers; who benefits from proposing

   Routines are the chapters' own (zero_one_bfs, dfs, kahn, dijkstra,
   floyd_warshall, kruskal, tarjan, max_flow, the Dinic phase, max_matching,
   gale_shapley). Needs viz-rag-kit.js and viz-dsa1.js.
   ========================================================================== */

(function () {
  "use strict";
  window.VIZ = window.VIZ || {};
  var K = window.RAGKIT, D = window.DSAKIT;
  if (!K || !D) throw new Error("viz-dsa7.js needs viz-rag-kit.js and viz-dsa1.js loaded first");
  var C = K.C, S = K.S, T = K.T, rect = K.rect, line = K.line, frame = K.frame;
  var clear = D.clear, commas = D.commas, stepper = D.stepper, row = D.row, lcg = D.lcg, focusable = D.focusable, wrap = D.wrap;
  var INF = Infinity;

  function svgOf(f, h, label, role) { return S("svg", { viewBox: "0 0 760 " + h, width: "100%", role: role || "img", "aria-label": label }, f.body); }
  function presetRow(f, list, fn) {
    var r = row(f.controls);
    list.forEach(function (p, i) { var b = document.createElement("button"); b.type = "button"; b.textContent = p; b.addEventListener("click", function () { fn(i); }); r.appendChild(b); });
    return r;
  }
  function fmtD(d) { return d === INF ? "∞" : String(d); }

  /* An edge from (x1,y1) to (x2,y2) between circles of radius r; bend > 0
     curves it (for antiparallel pairs). Returns the label point. */
  function edge(svg, x1, y1, x2, y2, o) {
    o = o || {};
    var r = o.r || 14, dx = x2 - x1, dy = y2 - y1, L = Math.sqrt(dx * dx + dy * dy) || 1, ux = dx / L, uy = dy / L;
    var bend = o.bend || 0, mx = (x1 + x2) / 2 - uy * bend, my = (y1 + y2) / 2 + ux * bend;
    var sx = x1 + ux * r, sy = y1 + uy * r, ex = x2 - ux * r, ey = y2 - uy * r;
    if (bend) { var a1 = Math.atan2(my - y1, mx - x1), a2 = Math.atan2(y2 - my, x2 - mx); sx = x1 + Math.cos(a1) * r; sy = y1 + Math.sin(a1) * r; ex = x2 - Math.cos(a2) * r; ey = y2 - Math.sin(a2) * r; }
    var col = o.stroke || C.line, sw = o.sw || 1.4;
    S("path", { d: "M " + sx + " " + sy + " Q " + mx + " " + my + " " + ex + " " + ey, fill: "none", stroke: col, "stroke-width": sw, "stroke-dasharray": o.dash || "none", opacity: o.op == null ? 1 : o.op }, svg);
    if (o.arrow !== false && o.directed) {
      var ang = Math.atan2(ey - my, ex - mx), h = 7 + sw;
      S("path", { d: "M " + ex + " " + ey + " L " + (ex - h * Math.cos(ang - 0.4)) + " " + (ey - h * Math.sin(ang - 0.4)) + " L " + (ex - h * Math.cos(ang + 0.4)) + " " + (ey - h * Math.sin(ang + 0.4)) + " z", fill: col, opacity: o.op == null ? 1 : o.op }, svg);
    }
    var lx = bend ? mx : (x1 + x2) / 2, ly = bend ? my : (y1 + y2) / 2;
    if (o.label !== undefined && o.label !== "") {
      rect(svg, lx - 4 - String(o.label).length * 3.2, ly - 8, 8 + String(o.label).length * 6.4, 15, { rx: 3, fill: C.card, stroke: "none" });
      T(svg, lx, ly, String(o.label), { size: 9.5, weight: 700, fill: o.labelCol || C.dim });
    }
    return [lx, ly];
  }
  function node(svg, x, y, label, o) {
    o = o || {};
    var c = S("circle", { cx: x, cy: y, r: o.r || 14, fill: o.fill || C.card, opacity: o.op == null ? 1 : o.op, stroke: o.stroke || C.line, "stroke-width": o.sw || 1.2 }, svg);
    T(svg, x, y + 0.5, String(label), { size: o.size || 11, weight: 700 });
    if (o.sub !== undefined) T(svg, x, y + (o.r || 14) + 10, String(o.sub), { size: 9, weight: 600, fill: o.subCol || C.dim });
    return c;
  }
  /* Draw graph {pos:[[x,y]], names, edges:[[u,v,w]], directed}. est(e, i) and nst(v) give styles. */
  function drawGraph(svg, G, est, nst, ox, oy) {
    ox = ox || 0; oy = oy || 0;
    var has = {}; G.edges.forEach(function (e) { has[e[0] + "," + e[1]] = 1; });
    G.edges.forEach(function (e, i) {
      var s = est ? est(e, i) || {} : {}, p = G.pos[e[0]], q = G.pos[e[1]];
      s.directed = G.directed; s.bend = s.bend || (G.directed && has[e[1] + "," + e[0]] ? 14 : 0);
      if (s.hide) return;
      edge(svg, p[0] + ox, p[1] + oy, q[0] + ox, q[1] + oy, s);
    });
    G.pos.forEach(function (p, v) { var s = nst ? nst(v) || {} : {}; node(svg, p[0] + ox, p[1] + oy, G.names ? G.names[v] : v, s); });
  }

  /* ------------------------------------------------------------------------
     dsaGraphRep — ch32 §2. An 8-vertex undirected graph as both; clicking a
     matrix cell toggles that edge. Memory is priced at n = 2,000 as the
     chapter does: int32 list 8 bytes an edge, byte matrix n², bit matrix n²/8.
     ------------------------------------------------------------------------ */
  VIZ.dsaGraphRep = function (el) {
    var f = frame(el);
    var N = 8, dens = 0.3, adj = [], op = 0, u = 0, v = 5, seed = 1;
    function gen() { var r = lcg(seed * 101 + Math.round(dens * 100)); adj = []; for (var i = 0; i < N; i++) { adj.push([]); for (var j = 0; j < N; j++) adj[i].push(0); } for (i = 0; i < N; i++) for (j = i + 1; j < N; j++) if (r(1000) < dens * 1000) adj[i][j] = adj[j][i] = 1; }
    var svg = svgOf(f, 360, "the same graph as an adjacency list and a matrix", "group");
    function render() {
      clear(svg);
      var E = 0, i, j; for (i = 0; i < N; i++) for (j = i + 1; j < N; j++) E += adj[i][j];
      var d = E / (N * (N - 1) / 2), OPS = ["is (u, v) an edge?", "neighbours of u", "add edge (u, v)"];
      T(svg, 8, 14, N + " vertices · " + E + " edges · density " + Math.round(100 * d) + "% · " + OPS[op], { anchor: "start", size: 12, weight: 700 });
      /* the drawing */
      var pos = []; for (i = 0; i < N; i++) pos.push([110 + 80 * Math.cos(2 * Math.PI * i / N - Math.PI / 2), 120 + 80 * Math.sin(2 * Math.PI * i / N - Math.PI / 2)]);
      for (i = 0; i < N; i++) for (j = i + 1; j < N; j++) if (adj[i][j]) line(svg, pos[i][0], pos[i][1], pos[j][0], pos[j][1], { stroke: (i === u && j === v) || (i === v && j === u) ? C.orange : C.line, sw: 1.4 });
      pos.forEach(function (p, k) { node(svg, p[0], p[1], k, { r: 11, fill: k === u ? C.blue : k === v && op !== 1 ? C.purple : C.card, op: k === u || (k === v && op !== 1) ? 0.4 : 1 }); });
      /* the list, with the entries this operation reads */
      var LX = 225, listRead = 0, matRead = 0, found = false;
      T(svg, LX, 36, "adjacency list", { anchor: "start", size: 10, fill: C.faint, mono: false });
      for (i = 0; i < N; i++) {
        T(svg, LX, 54 + i * 19, i + ":", { anchor: "start", size: 10, fill: C.dim });
        var nb = []; for (j = 0; j < N; j++) if (adj[i][j]) nb.push(j);
        nb.forEach(function (w, q) {
          var read = i === u && (op === 1 || (op === 0 && !found));
          if (read) { listRead++; if (op === 0 && w === v) found = true; }
          rect(svg, LX + 20 + q * 20, 46 + i * 19, 17, 16, { rx: 3, fill: read ? C.orange : C.card, op: read ? 0.4 : 1, stroke: C.line, sw: 0.8 });
          T(svg, LX + 28.5 + q * 20, 54 + i * 19, String(w), { size: 9.5, weight: 600 });
        });
      }
      /* the matrix, clickable */
      var MX = 440, cs = 22;
      T(svg, MX, 36, "adjacency matrix (click a cell)", { anchor: "start", size: 10, fill: C.faint, mono: false });
      for (i = 0; i < N; i++) for (j = 0; j < N; j++) {
        var rd = (op === 0 || op === 2) ? i === u && j === v : i === u;
        if (rd) matRead++;
        var cell = rect(svg, MX + j * cs, 44 + i * cs, cs - 2, cs - 2, { rx: 2, fill: rd ? C.orange : adj[i][j] ? C.teal : C.card, op: rd ? 0.45 : adj[i][j] ? 0.35 : 1, stroke: C.line, sw: 0.6 });
        T(svg, MX + j * cs + cs / 2 - 1, 44 + i * cs + cs / 2 - 1, String(adj[i][j]), { size: 9, fill: adj[i][j] ? C.text : C.faint });
        if (i !== j) (function (a, b, node2) { function tg() { adj[a][b] = adj[b][a] = adj[a][b] ? 0 : 1; render(); } node2.addEventListener("click", tg); focusable(node2, "toggle edge " + a + "–" + b, tg); })(i, j, cell);
      }
      if (op === 2) { listRead = 1; matRead = 1; }
      T(svg, 8, 234, "this operation reads: list " + listRead + " entr" + (listRead === 1 ? "y" : "ies") + " · matrix " + matRead + " cell" + (matRead === 1 ? "" : "s") + (op === 1 ? " (a whole row, zeros included)" : op === 0 ? " (one cell; the list scans u's neighbours" + (found ? " until it meets v)" : ", and v is not there)") : " — O(1) in both"), { anchor: "start", size: 11, mono: false, weight: 600 });
      /* memory at n = 2,000 with this density */
      var n2 = 2000, E2 = d * n2 * (n2 - 1) / 2, mem = [["int32 list", 8 * E2, C.blue], ["byte matrix", n2 * n2, C.orange], ["bit matrix", n2 * n2 / 8, C.purple]], top = Math.max(8 * n2 * (n2 - 1) / 2, n2 * n2);
      T(svg, 8, 262, "memory for n = 2,000 at " + Math.round(100 * d) + "% density:", { anchor: "start", size: 10, fill: C.faint, mono: false });
      mem.forEach(function (m, k) {
        var y = 270 + k * 22, w = 480 * m[1] / top;
        T(svg, 8, y + 8, m[0], { anchor: "start", size: 10, mono: false });
        S("rect", { x: 110, y: y, width: Math.max(1, w), height: 14, rx: 3, fill: m[2], opacity: 0.7 }, svg);
        T(svg, 752, y + 8, (m[1] / 1e6).toFixed(2) + " MB", { anchor: "end", size: 10.5, weight: 700 });
      });
      T(svg, 8, 346, "break-even: list = byte matrix at 25% density, list = bit matrix at 3.1% — real graphs sit far below both", { anchor: "start", size: 9.5, fill: C.faint, mono: false });
    }
    K.tabs(f.controls, ["is adjacent", "neighbours of u", "add edge"], 0, function (k) { op = k; render(); });
    K.slider(f.controls, "density", 0, 100, 30, 5, function (x) { return x + "%"; }, function (x) { dens = x / 100; gen(); render(); });
    K.slider(f.controls, "u", 0, 7, u, 1, String, function (x) { u = x; render(); });
    K.slider(f.controls, "v", 0, 7, v, 1, String, function (x) { v = x; render(); });
    f.btn("new graph", function () { seed++; gen(); render(); });
    gen(); render();
    f.say("The same graph, two ways. Pick an operation and compare what each representation reads; then raise the density and find where the matrix's memory stops being wasteful.");
  };

  /* A 14-vertex ring with three chords: DFS runs round the ring, BFS cuts across. */
  var RING = (function () {
    var n = 14, pos = [], edges = [];
    for (var i = 0; i < n; i++) { pos.push([175 + 130 * Math.cos(2 * Math.PI * i / n - Math.PI / 2), 150 + 110 * Math.sin(2 * Math.PI * i / n - Math.PI / 2)]); edges.push([i, (i + 1) % n]); }
    [[0, 5], [5, 10], [3, 11]].forEach(function (e) { edges.push(e); });
    var adj = pos.map(function () { return []; });
    edges.forEach(function (e) { adj[e[0]].push(e[1]); adj[e[1]].push(e[0]); });
    adj.forEach(function (a) { a.sort(function (x, y) { return x - y; }); });
    return { pos: pos, edges: edges, adj: adj, directed: false };
  })();

  /* ------------------------------------------------------------------------
     dsaBfsDfs — ch33 §1, §5. BFS marks on insertion; the DFS is the true
     one (an iterator per open vertex), so depth is depth in the DFS tree.
     ------------------------------------------------------------------------ */
  VIZ.dsaBfsDfs = function (el) {
    var f = frame(el);
    var G = RING, s0 = 0, trB = [], trD = [];
    function build() {
      var dist = G.pos.map(function () { return -1; }), q = [s0], ev = [];
      dist[s0] = 0; ev.push({ lab: dist.slice(), fr: q.slice(), cur: -1 });
      while (q.length) { var u = q.shift(); G.adj[u].forEach(function (w) { if (dist[w] < 0) { dist[w] = dist[u] + 1; q.push(w); } }); ev.push({ lab: dist.slice(), fr: q.slice(), cur: u }); }
      trB = ev;
      var dep = G.pos.map(function () { return -1; }), st = [[s0, 0]], ev2 = [];
      dep[s0] = 0; ev2.push({ lab: dep.slice(), fr: [s0], cur: s0 });
      while (st.length) {
        var top = st[st.length - 1], x = top[0], adv = false;
        while (top[1] < G.adj[x].length) { var y = G.adj[x][top[1]++]; if (dep[y] < 0) { dep[y] = dep[x] + 1; st.push([y, 0]); adv = true; break; } }
        if (!adv) st.pop();
        ev2.push({ lab: dep.slice(), fr: st.map(function (e) { return e[0]; }), cur: adv ? st[st.length - 1][0] : x, back: !adv });
      }
      trD = ev2;
    }
    var svg = svgOf(f, 360, "BFS and DFS from the same start");
    function draw(k) {
      clear(svg);
      var b = trB[Math.min(k, trB.length - 1)], d = trD[Math.min(k, trD.length - 1)];
      T(svg, 8, 14, "start " + s0 + " · step " + k, { anchor: "start", size: 12, weight: 700 });
      [[b, "BFS: queue · label = distance", 0, C.teal], [d, "DFS: stack · label = depth in the DFS tree", 380, C.orange]].forEach(function (p) {
        var st = p[0], ox = p[2];
        T(svg, ox + 8, 34, p[1], { anchor: "start", size: 10.5, weight: 700, fill: p[3], mono: false });
        drawGraph(svg, G, function () { return { stroke: C.line }; }, function (v) {
          var lab = st.lab[v];
          return { r: 12, fill: v === st.cur ? C.blue : lab >= 0 ? p[3] : C.card, op: v === st.cur ? 0.5 : lab >= 0 ? 0.3 : 1, sub: lab >= 0 ? lab : "", subCol: p[3], size: 10 };
        }, ox + 10, 22);
        T(svg, ox + 8, 322, (p[2] ? "stack" : "queue") + ": " + (st.fr.length ? st.fr.join(" ") : "—"), { anchor: "start", size: 10.5, fill: C.dim });
      });
      var bd = trB[trB.length - 1].lab, dd = trD[trD.length - 1].lab, worst = -1, wd = 0;
      for (var v = 0; v < bd.length; v++) if (dd[v] - bd[v] > wd) { wd = dd[v] - bd[v]; worst = v; }
      if (k >= Math.max(trB.length, trD.length) - 1 && worst >= 0) T(svg, 8, 346, "vertex " + worst + ": " + bd[worst] + " step" + (bd[worst] === 1 ? "" : "s") + " from the start, but depth " + dd[worst] + " in the DFS tree — depth is not distance", { anchor: "start", size: 11.5, weight: 700, fill: C.pink, mono: false });
    }
    K.slider(f.controls, "start", 0, 13, s0, 1, String, function (x) { s0 = x; build(); sp.reload(); });
    var sp = stepper(f, function () { return Math.max(trB.length, trD.length) - 1; }, draw);
    build(); draw(0);
    f.say("Same graph, same start. One uses a queue, one a stack: watch the frontier. Step to the end and find a vertex BFS reaches in 2 steps that DFS reaches far deeper.");
  };

  /* ------------------------------------------------------------------------
     dsaZeroOneBfs — ch33 §4, zero_one_bfs. Click an edge to flip its weight.
     ------------------------------------------------------------------------ */
  VIZ.dsaZeroOneBfs = function (el) {
    var f = frame(el);
    var names = ["s", "a", "b", "c", "d", "e", "f"], pos = [[70, 150], [230, 70], [230, 230], [390, 70], [390, 230], [550, 150], [680, 150]];
    var edges = [[0, 1, 1], [0, 2, 0], [2, 1, 0], [1, 3, 1], [2, 4, 1], [3, 4, 0], [4, 3, 1], [3, 5, 0], [4, 5, 1], [5, 6, 1], [4, 6, 0]], tr = [];
    function build() {
      var adj = names.map(function () { return []; }), dist = names.map(function () { return INF; }), fin = [], dq = [[0, 0]], ev = [];
      edges.forEach(function (e) { adj[e[0]].push([e[1], e[2]]); });
      dist[0] = 0;
      ev.push({ dq: dq.slice(), dist: dist.slice(), fin: [], msg: "the deque holds (distance, vertex); s at 0" });
      while (dq.length) {
        var p = dq.shift(), d = p[0], u = p[1];
        if (d > dist[u]) { ev.push({ dq: dq.slice(), dist: dist.slice(), fin: fin.slice(), cur: u, stale: true, msg: "pop (" + d + ", " + names[u] + "): stale — " + names[u] + " was improved to " + dist[u] + " after this push, skip" }); continue; }
        if (fin.indexOf(u) < 0) fin.push(u);
        var acts = [];
        adj[u].forEach(function (vw) {
          var v = vw[0], w = vw[1];
          if (d + w < dist[v]) { dist[v] = d + w; if (w === 0) dq.unshift([d, v]); else dq.push([d + 1, v]); acts.push(names[v] + "→" + (w ? "back" : "front") + " at " + dist[v]); }
        });
        ev.push({ dq: dq.slice(), dist: dist.slice(), fin: fin.slice(), cur: u, msg: "pop (" + d + ", " + names[u] + ")" + (acts.length ? ": " + acts.join(", ") : ": nothing improves") });
      }
      /* first-discovery BFS, for contrast */
      var bd = names.map(function () { return -1; }), q = [0]; bd[0] = 0;
      while (q.length) { var x = q.shift(); adj[x].forEach(function (vw) { if (bd[vw[0]] < 0) { bd[vw[0]] = bd[x] + vw[1]; q.push(vw[0]); } }); }
      ev.forEach(function (e) { e.naive = bd; });
      tr = ev;
    }
    var svg = svgOf(f, 350, "0-1 BFS with its deque", "group");
    function draw(k) {
      clear(svg);
      var s = tr[k], done = k === tr.length - 1;
      T(svg, 8, 14, "0-1 BFS from s · step " + k + " of " + (tr.length - 1), { anchor: "start", size: 12, weight: 700 });
      edges.forEach(function (e) {
        var p = pos[e[0]], q = pos[e[1]], two = edges.some(function (o) { return o[0] === e[1] && o[1] === e[0]; });
        var lp = edge(svg, p[0], p[1], q[0], q[1], { directed: true, bend: two ? 16 : 0, stroke: e[2] ? C.faint : C.teal, sw: e[2] ? 1.4 : 2.4, label: e[2], labelCol: e[2] ? C.dim : C.teal });
        var hit = S("circle", { cx: lp[0], cy: lp[1], r: 10, fill: "transparent" }, svg);
        function flip() { e[2] = 1 - e[2]; build(); sp.reload(); }
        hit.addEventListener("click", flip); focusable(hit, "edge " + names[e[0]] + " to " + names[e[1]] + " weight " + e[2] + ", click to flip", flip);
      });
      pos.forEach(function (p, v) {
        var wrong = done && s.naive[v] !== s.dist[v];
        node(svg, p[0], p[1], names[v], { fill: v === s.cur ? C.blue : s.fin.indexOf(v) >= 0 ? C.green : C.card, op: v === s.cur ? 0.45 : s.fin.indexOf(v) >= 0 ? 0.3 : 1, sub: "d=" + fmtD(s.dist[v]) + (wrong ? " (BFS: " + s.naive[v] + ")" : ""), subCol: wrong ? C.pink : C.dim });
      });
      T(svg, 8, 276, "deque (front → back):", { anchor: "start", size: 10, fill: C.faint, mono: false });
      s.dq.forEach(function (p, j) { rect(svg, 150 + j * 58, 264, 52, 22, { rx: 4, fill: C.card, stroke: j === 0 ? C.blue : C.line }); T(svg, 176 + j * 58, 275, "(" + p[0] + "," + names[p[1]] + ")", { size: 10, weight: 600 }); });
      wrap(svg, 8, 304, s.msg, 744, { size: 11, fill: s.stale ? C.orange : C.text });
      T(svg, 8, 340, "finalised in order: " + s.fin.map(function (v) { return names[v]; }).join(" ") + " · teal edges weigh 0 · click a weight to flip it", { anchor: "start", size: 9.5, fill: C.faint, mono: false });
    }
    var sp = stepper(f, function () { return tr.length - 1; }, draw);
    build(); draw(0);
    f.say("Zero-weight edges go to the front, one-weight to the back: watch the deque stay sorted. Find the vertex finalised out of the order it was first inserted, and say which end put it there.");
  };

  /* ------------------------------------------------------------------------
     dsaDfsTimes — ch33 §5. The chapter's six-vertex graph and neighbour
     order, so the intervals are the figure's: 0 [0,11], 1 [1,6], …
     ------------------------------------------------------------------------ */
  VIZ.dsaDfsTimes = function (el) {
    var f = frame(el);
    var pos = [[200, 50], [110, 140], [70, 250], [200, 250], [300, 140], [360, 250]];
    var adj = [[1, 4, 2], [2, 3], [0], [], [3, 5], [4]], tr = [], colour = true;
    var TYPES = { tree: C.blue, back: C.pink, forward: C.purple, cross: C.orange };
    function build() {
      var tin = [-1, -1, -1, -1, -1, -1], tout = tin.slice(), t = 0, type = {}, ev = [];
      function snap(msg, cur) { ev.push({ tin: tin.slice(), tout: tout.slice(), type: Object.assign({}, type), msg: msg, cur: cur }); }
      snap("Press step. The clock ticks once at every entry and every exit.", -1);
      (function dfs(u) {
        tin[u] = t++; snap("enter " + u + " at time " + tin[u], u);
        adj[u].forEach(function (v) {
          var k = u + "," + v;
          if (tin[v] < 0) { type[k] = "tree"; snap(u + "→" + v + ": " + v + " is new — a tree edge", u); dfs(v); }
          else if (tout[v] < 0) { type[k] = "back"; snap(u + "→" + v + ": " + v + " is still open, its interval contains " + u + "'s — a back edge, closing a cycle", u); }
          else if (tin[v] > tin[u]) { type[k] = "forward"; snap(u + "→" + v + ": " + v + " finished inside " + u + "'s interval — a forward edge", u); }
          else { type[k] = "cross"; snap(u + "→" + v + ": " + v + "'s interval ended before " + u + "'s began — a cross edge", u); }
        });
        tout[u] = t++; snap("exit " + u + " at time " + tout[u] + ": interval [" + tin[u] + ", " + tout[u] + "]", u);
      })(0);
      tr = ev;
    }
    var svg = svgOf(f, 330, "DFS entry and exit times and edge types");
    function draw(k) {
      clear(svg);
      var s = tr[k];
      T(svg, 8, 14, "DFS from 0 · step " + k + " of " + (tr.length - 1), { anchor: "start", size: 12, weight: 700 });
      var edges = []; adj.forEach(function (a, u) { a.forEach(function (v) { edges.push([u, v]); }); });
      drawGraph(svg, { pos: pos, edges: edges, directed: true }, function (e) {
        var ty = s.type[e[0] + "," + e[1]];
        return { stroke: ty && colour ? TYPES[ty] : ty ? C.text : C.line, sw: ty === "tree" ? 2.6 : 1.6, dash: ty === "cross" || ty === "forward" ? "5 3" : "none", label: ty && colour ? ty : "" };
      }, function (v) {
        return { fill: v === s.cur ? C.blue : s.tout[v] >= 0 ? C.green : s.tin[v] >= 0 ? C.sky : C.card, op: 0.4, sub: s.tin[v] >= 0 ? "[" + s.tin[v] + "," + (s.tout[v] >= 0 ? s.tout[v] : "…") + "]" : "" };
      });
      /* the intervals on a timeline */
      var X0 = 430, W = 300 / 12;
      T(svg, X0, 40, "intervals: nested or disjoint, never crossing", { anchor: "start", size: 10, fill: C.faint, mono: false });
      for (var t = 0; t <= 11; t++) T(svg, X0 + t * W + W / 2, 60, String(t), { size: 8.5, fill: C.faint });
      [0, 1, 2, 3, 4, 5].forEach(function (v) {
        if (s.tin[v] < 0) return;
        var end = s.tout[v] >= 0 ? s.tout[v] : Math.max.apply(null, s.tin.concat(s.tout));
        rect(svg, X0 + s.tin[v] * W + 2, 70 + v * 24, (end - s.tin[v] + 1) * W - 4, 18, { rx: 4, fill: s.tout[v] >= 0 ? C.green : C.sky, op: 0.35, stroke: v === s.cur ? C.blue : "none", sw: 2 });
        T(svg, X0 + s.tin[v] * W + 8, 79 + v * 24, String(v), { anchor: "start", size: 10, weight: 700 });
      });
      wrap(svg, 8, 292, s.msg, 744, { size: 11.5, fill: /back/.test(s.msg) ? C.pink : C.text });
      if (colour) T(svg, 430, 232, "blue tree · pink back · purple forward · orange cross", { anchor: "start", size: 9.5, fill: C.faint, mono: false });
    }
    K.toggle(f.controls, "colour edge types", colour, function (on) { colour = on; draw(sp.pos()); });
    var sp = stepper(f, function () { return tr.length - 1; }, draw);
    build(); draw(0);
    f.say("Every edge gets a type, and the types come entirely from the entry and exit times. Find a back edge and confirm its endpoints' intervals nest.");
  };

  /* ------------------------------------------------------------------------
     dsaTopoSort — ch34 §2, kahn(); and DFS finish order reversed. The
     chapter's DAG A–H; "add a cycle" adds H → D.
     ------------------------------------------------------------------------ */
  VIZ.dsaTopoSort = function (el) {
    var f = frame(el);
    var names = "ABCDEFGH".split(""), pos = [[80, 60], [80, 200], [230, 40], [230, 150], [230, 250], [400, 80], [400, 220], [560, 150]];
    var base = [[0, 2], [0, 3], [1, 3], [1, 4], [2, 5], [3, 5], [3, 6], [4, 6], [5, 7], [6, 7]], cyc = false, alg = 0, tr = [];
    function edges() { return cyc ? base.concat([[7, 3]]) : base; }
    function build() {
      var E = edges(), n = 8, adj = names.map(function () { return []; }), indeg = names.map(function () { return 0; }), ev = [];
      E.forEach(function (e) { adj[e[0]].push(e[1]); indeg[e[1]]++; });
      if (alg === 0) {
        var ready = [], order = [];
        for (var v = 0; v < n; v++) if (!indeg[v]) ready.push(v);
        ev.push({ indeg: indeg.slice(), ready: ready.slice(), order: [], msg: "ready: every vertex with in-degree 0 — nothing is waiting on it" });
        while (ready.length) {
          var u = ready.shift(); order.push(u); var freed = [];
          adj[u].forEach(function (w) { indeg[w]--; if (!indeg[w]) { ready.push(w); freed.push(names[w]); } });
          ev.push({ indeg: indeg.slice(), ready: ready.slice(), order: order.slice(), cur: u, msg: "emit " + names[u] + "; decrement its successors" + (freed.length ? " — " + freed.join(", ") + " reach 0 and join ready" : "") });
        }
        if (order.length < n) ev.push({ indeg: indeg.slice(), ready: [], order: order.slice(), stuck: true, msg: "ready is empty with " + (n - order.length) + " vertices left: " + names.filter(function (x, i) { return order.indexOf(i) < 0; }).join(", ") + " — a cycle, and everything downstream of it" });
        else ev.push({ indeg: indeg.slice(), ready: [], order: order.slice(), done: true, msg: "all 8 emitted: " + order.map(function (i) { return names[i]; }).join(", ") });
      } else {
        var col = names.map(function () { return 0; }), post = [], cycleAt = null;
        ev.push({ col: col.slice(), post: [], msg: "DFS: a vertex joins the list when it finishes; reversed, the list is a topological order" });
        for (var s = 0; s < n; s++) {
          if (col[s]) continue;
          (function dfs(x) {
            col[x] = 1; ev.push({ col: col.slice(), post: post.slice(), cur: x, msg: "enter " + names[x] });
            adj[x].forEach(function (w) {
              if (col[w] === 1 && !cycleAt) { cycleAt = [x, w]; ev.push({ col: col.slice(), post: post.slice(), cur: x, stuck: true, msg: names[x] + " → " + names[w] + " reaches a vertex still open: a back edge, so there is a cycle and no order exists" }); }
              if (!col[w]) dfs(w);
            });
            col[x] = 2; post.push(x); ev.push({ col: col.slice(), post: post.slice(), cur: x, msg: names[x] + " finishes: prepend it" });
          })(s);
        }
        ev.push({ col: col.slice(), post: post.slice(), done: !cycleAt, stuck: !!cycleAt, msg: cycleAt ? "finish order exists, but with a back edge it is not a valid order" : "reverse finish order: " + post.slice().reverse().map(function (i) { return names[i]; }).join(", ") });
      }
      tr = ev;
    }
    var svg = svgOf(f, 330, "topological sort");
    function draw(k) {
      clear(svg);
      var s = tr[k];
      T(svg, 8, 14, (alg ? "DFS finish order" : "Kahn's algorithm") + (cyc ? " · with H → D, a cycle" : "") + " · step " + k + " of " + (tr.length - 1), { anchor: "start", size: 12, weight: 700 });
      drawGraph(svg, { pos: pos, edges: edges(), directed: true, names: names }, function (e) { return { stroke: cyc && e[0] === 7 && e[1] === 3 ? C.pink : C.line, sw: cyc && e[0] === 7 ? 2.4 : 1.4 }; }, function (v) {
        if (alg === 0) { var done = s.order.indexOf(v) >= 0, rd = s.ready.indexOf(v) >= 0; return { fill: v === s.cur ? C.blue : done ? C.green : rd ? C.teal : s.stuck ? C.pink : C.card, op: 0.4, sub: done ? "" : "in " + s.indeg[v] }; }
        return { fill: v === s.cur ? C.blue : s.col[v] === 2 ? C.green : s.col[v] === 1 ? C.sky : C.card, op: 0.4 };
      });
      var list = alg === 0 ? s.order : s.post.slice().reverse();
      T(svg, 8, 282, (alg === 0 ? "emitted: " : "reverse finish order so far: ") + (list.length ? list.map(function (i) { return names[i]; }).join(" ") : "—") + (alg === 0 ? "   ready: " + (s.ready.length ? s.ready.map(function (i) { return names[i]; }).join(" ") : "—") : ""), { anchor: "start", size: 12, weight: 700, fill: C.green });
      wrap(svg, 8, 306, s.msg, 744, { size: 11, fill: s.stuck ? C.pink : s.done ? C.green : C.text });
    }
    K.tabs(f.controls, ["Kahn", "DFS"], 0, function (k) { alg = k; build(); sp.reload(); });
    K.toggle(f.controls, "add a cycle (H → D)", cyc, function (on) { cyc = on; build(); sp.reload(); });
    var sp = stepper(f, function () { return tr.length - 1; }, draw);
    build(); draw(0);
    f.say("Peel every vertex that has nothing waiting on it. Add the edge that creates a cycle and watch Kahn's algorithm stall with vertices remaining.");
  };

  /* ------------------------------------------------------------------------
     dsaRelaxation — ch35 §1–3. One relax() four ways. Dijkstra here is the
     textbook one that refuses to change a settled vertex, which is the
     version the chapter shows failing on a negative edge.
     ------------------------------------------------------------------------ */
  VIZ.dsaRelaxation = function (el) {
    var f = frame(el);
    var names = ["s", "a", "b", "c", "d", "t"], pos = [[70, 150], [220, 60], [220, 240], [400, 60], [400, 240], [560, 150]];
    var E0 = [[0, 1, 2], [0, 2, 3], [1, 3, 4], [2, 1, 1], [2, 4, 5], [3, 5, 3], [4, 3, 1], [4, 5, 6], [1, 4, 7]];
    var ALG = ["BFS (hops)", "Dijkstra", "Bellman–Ford", "SPFA"], alg = 1, neg = false, tr = [];
    function E() { return E0.map(function (e) { return neg && e[0] === 2 && e[1] === 1 ? [2, 1, -2] : e; }); }
    function truth() { var d = names.map(function () { return INF; }); d[0] = 0; for (var r = 0; r < names.length; r++) E().forEach(function (e) { if (d[e[0]] + e[2] < d[e[1]]) d[e[1]] = d[e[0]] + e[2]; }); return d; }
    function build() {
      var es = E(), n = names.length, dist = names.map(function () { return INF; }), ev = [], order = [];
      dist[0] = 0;
      function relax(u, v, w, extra) {
        var old = dist[v], better = dist[u] + w < dist[v], refused = extra && extra.settled && better;
        if (better && !refused) dist[v] = dist[u] + w;
        order.push(names[u] + "→" + names[v] + (better ? (refused ? " ✗" : " " + fmtD(old) + "→" + dist[v]) : " ·"));
        ev.push({ dist: dist.slice(), cur: [u, v], order: order.slice(-12), settled: extra && extra.set ? extra.set.slice() : [], msg: names[u] + "→" + names[v] + " (w " + w + "): " + fmtD(dist[u]) + " + " + w + " = " + fmtD(dist[u] + w) + (better ? (refused ? " < " + fmtD(old) + ", but " + names[v] + " is already settled: the update is refused" : " < " + fmtD(old) + ": improve " + names[v]) : " — no improvement") , refused: refused });
      }
      ev.push({ dist: dist.slice(), order: [], settled: [], msg: "d[s] = 0, everything else ∞" });
      if (alg === 0) {
        var q = [0], seen = [0];
        while (q.length) { var u = q.shift(); es.filter(function (e) { return e[0] === u; }).forEach(function (e) { if (seen.indexOf(e[1]) < 0) { seen.push(e[1]); q.push(e[1]); } relax(u, e[1], 1); }); }
      } else if (alg === 1) {
        var set = [], pq = [[0, 0]];
        while (pq.length) {
          pq.sort(function (a, b) { return a[0] - b[0]; }); var top = pq.shift();
          if (set.indexOf(top[1]) >= 0 || top[0] > dist[top[1]]) continue;
          set.push(top[1]);
          ev.push({ dist: dist.slice(), order: order.slice(-12), settled: set.slice(), pop: top[1], msg: "pop " + names[top[1]] + " at " + dist[top[1]] + ": the smallest tentative distance, so it is declared final" });
          es.filter(function (e) { return e[0] === top[1]; }).forEach(function (e) { var had = dist[e[1]]; relax(e[0], e[1], e[2], { settled: set.indexOf(e[1]) >= 0, set: set }); if (dist[e[1]] < had) pq.push([dist[e[1]], e[1]]); });
        }
      } else if (alg === 2) {
        for (var r = 1; r < n; r++) {
          var ch = false;
          ev.push({ dist: dist.slice(), order: order.slice(-12), settled: [], msg: "round " + r + ": relax every edge once, in list order" });
          es.forEach(function (e) { if (dist[e[0]] === INF) return; var had = dist[e[1]]; relax(e[0], e[1], e[2]); if (dist[e[1]] < had) ch = true; });
          if (!ch) { ev.push({ dist: dist.slice(), order: order.slice(-12), settled: [], msg: "round " + r + " changed nothing: stop early" }); break; }
        }
      } else {
        var qq = [0], inq = [true];
        while (qq.length) { var x = qq.shift(); inq[x] = false; es.filter(function (e) { return e[0] === x; }).forEach(function (e) { var had = dist[e[1]]; relax(x, e[1], e[2]); if (dist[e[1]] < had && !inq[e[1]]) { qq.push(e[1]); inq[e[1]] = true; } }); }
      }
      var tru = truth(), bad = dist.map(function (d, i) { return alg === 0 ? false : d !== tru[i]; });
      ev.push({ dist: dist.slice(), order: order.slice(-12), settled: [], done: true, bad: bad, msg: bad.some(Boolean) ? "wrong: " + names.filter(function (x, i) { return bad[i]; }).map(function (x) { return x + " = " + dist[names.indexOf(x)] + " (true " + tru[names.indexOf(x)] + ")"; }).join(", ") + " — finalised too early" : alg === 0 ? "hop counts: BFS ignores the weights" : "every distance is the true shortest distance" });
      tr = ev;
    }
    var svg = svgOf(f, 340, "shortest paths by relaxation");
    function draw(k) {
      clear(svg);
      var s = tr[k];
      T(svg, 8, 14, ALG[alg] + (neg ? " · b→a weighs −2" : "") + " · step " + k + " of " + (tr.length - 1), { anchor: "start", size: 12, weight: 700 });
      drawGraph(svg, { pos: pos, edges: E(), directed: true, names: names }, function (e) {
        var cur = s.cur && s.cur[0] === e[0] && s.cur[1] === e[1];
        return { stroke: cur ? (s.refused ? C.pink : C.orange) : e[2] < 0 ? C.pink : C.line, sw: cur ? 3 : 1.4, label: alg === 0 ? "" : e[2], labelCol: e[2] < 0 ? C.pink : C.dim };
      }, function (v) {
        var bad = s.done && s.bad[v];
        return { fill: bad ? C.pink : s.settled.indexOf(v) >= 0 ? C.green : v === s.pop ? C.blue : C.card, op: 0.4, sub: "d=" + fmtD(s.dist[v]), subCol: bad ? C.pink : C.dim };
      });
      T(svg, 610, 34, "order of relaxations", { anchor: "start", size: 10, fill: C.faint, mono: false });
      s.order.forEach(function (o, j) { T(svg, 610, 52 + j * 16, o, { anchor: "start", size: 9.5, fill: /✗/.test(o) ? C.pink : /→\d|→-/.test(o.split(" ")[1] || "") ? C.text : C.dim }); });
      wrap(svg, 8, 296, s.msg, 590, { size: 11, fill: s.refused || (s.done && s.bad.some(Boolean)) ? C.pink : s.done ? C.green : C.text });
    }
    K.tabs(f.controls, ALG, alg, function (k) { alg = k; build(); sp.reload(); });
    K.toggle(f.controls, "negative edge b → a", neg, function (on) { neg = on; build(); sp.reload(); });
    var sp = stepper(f, function () { return tr.length - 1; }, draw);
    build(); draw(0);
    f.say("Every algorithm here relaxes edges; only the order changes, and the order panel shows it. Turn the negative edge on, run Dijkstra, and find the vertex finalised too early.");
  };

  /* ------------------------------------------------------------------------
     dsaFloydWarshall — ch35 §4, floyd_warshall with k outermost.
     ------------------------------------------------------------------------ */
  VIZ.dsaFloydWarshall = function (el) {
    var f = frame(el);
    var names = ["0", "1", "2", "3", "4"], pos = [[70, 70], [220, 40], [290, 170], [140, 230], [30, 170]];
    var edges = [[0, 1, 3], [1, 2, 4], [2, 3, 1], [3, 0, 2], [0, 4, 7], [4, 3, 1], [1, 3, 9], [3, 2, 5], [2, 0, 8]], tr = [];
    function build() {
      var n = 5, Dm = [], i, j, k;
      for (i = 0; i < n; i++) { Dm.push([]); for (j = 0; j < n; j++) Dm[i].push(i === j ? 0 : INF); }
      edges.forEach(function (e) { Dm[e[0]][e[1]] = Math.min(Dm[e[0]][e[1]], e[2]); });
      tr = [{ D: Dm.map(function (r) { return r.slice(); }), k: -1, imp: [], msg: "D₀ is the edge matrix: no vertex allowed in the middle yet" }];
      for (k = 0; k < n; k++) {
        tr.push({ D: Dm.map(function (r) { return r.slice(); }), k: k, imp: [], start: true, msg: "k = " + k + ": now paths may pass through vertex " + k });
        for (i = 0; i < n; i++) for (j = 0; j < n; j++) {
          if (Dm[i][k] === INF || Dm[k][j] === INF || i === k || j === k || i === j) continue;
          var via = Dm[i][k] + Dm[k][j];
          if (via < Dm[i][j]) {
            var old = Dm[i][j]; Dm[i][j] = via;
            tr.push({ D: Dm.map(function (r) { return r.slice(); }), k: k, imp: [i, j], msg: "D[" + i + "][" + j + "]: " + fmtD(old) + " → " + via + " by going " + i + " → " + k + " → " + j + " (" + Dm[i][k] + " + " + Dm[k][j] + ")" });
          }
        }
      }
      tr.push({ D: Dm.map(function (r) { return r.slice(); }), k: n, imp: [], done: true, msg: "all five allowed in the middle: every entry is a shortest distance" });
    }
    var svg = svgOf(f, 320, "Floyd-Warshall distance matrix");
    function draw(q) {
      clear(svg);
      var s = tr[q];
      T(svg, 8, 14, (s.k < 0 ? "before any k" : s.k >= 5 ? "done" : "k = " + s.k) + " · step " + q + " of " + (tr.length - 1), { anchor: "start", size: 12, weight: 700 });
      drawGraph(svg, { pos: pos, edges: edges, directed: true, names: names }, function (e) { return { label: e[2], stroke: C.line }; }, function (v) { return { fill: v === s.k ? C.orange : C.card, op: v === s.k ? 0.45 : 1 }; }, 10, 20);
      var MX = 380, cs = 58;
      for (var j = 0; j < 5; j++) { T(svg, MX + j * cs + cs / 2, 40, "→" + j, { size: 10, fill: C.faint }); T(svg, MX - 14, 60 + j * 40, j + "→", { size: 10, fill: C.faint }); }
      /* cells improved so far during this k */
      var impK = tr.slice(0, q + 1).filter(function (t) { return t.k === s.k && t.imp.length; }).map(function (t) { return t.imp[0] + "," + t.imp[1]; });
      for (var i = 0; i < 5; i++) for (j = 0; j < 5; j++) {
        var cur = s.imp[0] === i && s.imp[1] === j, thisK = impK.indexOf(i + "," + j) >= 0, src = s.imp.length && ((i === s.imp[0] && j === s.k) || (i === s.k && j === s.imp[1]));
        rect(svg, MX + j * cs + 2, 44 + i * 40, cs - 4, 34, { rx: 4, fill: cur ? C.green : src ? C.blue : thisK ? C.green : (i === s.k || j === s.k) && s.k < 5 ? C.orange : C.card, op: cur ? 0.5 : src ? 0.3 : thisK ? 0.18 : (i === s.k || j === s.k) && s.k < 5 ? 0.12 : 1, stroke: cur ? C.green : C.line });
        T(svg, MX + j * cs + cs / 2, 61 + i * 40, fmtD(s.D[i][j]), { size: 13, weight: 700, fill: cur ? C.green : C.text });
      }
      wrap(svg, 8, 284, s.msg, 744, { size: 11.5, fill: s.imp.length ? C.green : C.text });
      T(svg, 8, 312, "orange row and column: vertex k's own distances, which cannot change during round k · blue: the two cells an improvement reads", { anchor: "start", size: 9.5, fill: C.faint, mono: false });
    }
    f.btn("next k ⏩", function () { var p = sp.pos() + 1; while (p < tr.length - 1 && !tr[p].start) p++; sp.go(p); });
    var sp = stepper(f, function () { return tr.length - 1; }, draw);
    build(); draw(0);
    f.say("One vertex at a time is allowed in the middle; watch which cells improve at each k. Find a cell that improves only when k is one particular vertex, and name the path it has just discovered.");
  };

  /* ------------------------------------------------------------------------
     dsaAStar — ch35 §6. Dijkstra and A* on the same 4-connected grid; the
     inadmissible heuristic is three times Manhattan, as the chapter's.
     ------------------------------------------------------------------------ */
  VIZ.dsaAStar = function (el) {
    var f = frame(el);
    var W = 24, H = 14, HS = ["zero (= Dijkstra)", "Manhattan", "Euclidean", "3 × Manhattan"], hi = 1, wall = {}, seed = 2, res = null, anim = 1, timer = null;   // seed 2: 3 × Manhattan loses 4 steps
    function gen() { var r = lcg(seed); wall = {}; for (var i = 0; i < W * H; i++) if (r(100) < 26) wall[i] = 1; delete wall[0]; delete wall[W * H - 1]; }
    function search(hk) {
      var goal = W * H - 1, gx = W - 1, gy = H - 1;
      function h(i) { var x = i % W, y = (i / W) | 0, dx = gx - x, dy = gy - y; return hk === 0 ? 0 : hk === 1 ? dx + dy : hk === 2 ? Math.sqrt(dx * dx + dy * dy) : 3 * (dx + dy); }
      var g = {}, closed = {}, order = [], par = {}, heap = [[h(0), 0, 0]], tick = 0;
      g[0] = 0;
      while (heap.length) {
        var bi = 0; for (var q = 1; q < heap.length; q++) if (heap[q][0] < heap[bi][0] || (heap[q][0] === heap[bi][0] && heap[q][1] < heap[bi][1])) bi = q;
        var top = heap.splice(bi, 1)[0], u = top[2];
        if (closed[u]) continue;
        closed[u] = 1; order.push(u);
        if (u === goal) break;
        var x = u % W, y = (u / W) | 0;
        [[1, 0], [0, 1], [-1, 0], [0, -1]].forEach(function (d) {
          var nx = x + d[0], ny = y + d[1]; if (nx < 0 || ny < 0 || nx >= W || ny >= H) return;
          var v = ny * W + nx; if (wall[v] || closed[v]) return;
          if (g[v] === undefined || g[u] + 1 < g[v]) { g[v] = g[u] + 1; par[v] = u; heap.push([g[v] + h(v), ++tick, v]); }
        });
      }
      var path = []; if (closed[goal]) { var c = goal; while (c !== undefined) { path.push(c); c = par[c]; } }
      return { order: order, path: path, found: !!closed[goal] };
    }
    function run() { res = [search(0), search(hi)]; if (timer) clearInterval(timer); if (D.REDUCED) { anim = 1; render(); return; } anim = 0; timer = setInterval(function () { anim = Math.min(1, anim + 0.025); render(); if (anim >= 1) { clearInterval(timer); timer = null; } }, 30); }
    var svg = svgOf(f, 330, "Dijkstra and A* on one grid; click a cell to toggle a wall", "group");
    function render() {
      clear(svg);
      var cs = 14.5;
      T(svg, 8, 14, "corner to corner · A* heuristic: " + HS[hi], { anchor: "start", size: 12, weight: 700 });
      [[0, "Dijkstra"], [1, "A*"]].forEach(function (p) {
        var ox = 8 + p[0] * 378, R = res[p[0]], shown = Math.ceil(R.order.length * anim), exp = {};
        R.order.slice(0, shown).forEach(function (i) { exp[i] = 1; });
        var onPath = {}; if (anim >= 1) R.path.forEach(function (i) { onPath[i] = 1; });
        for (var i = 0; i < W * H; i++) {
          var x = ox + (i % W) * cs, y = 28 + ((i / W) | 0) * cs;
          var c = rect(svg, x, y, cs - 1, cs - 1, { rx: 1.5, fill: wall[i] ? C.text : onPath[i] ? C.orange : exp[i] ? (p[0] ? C.teal : C.blue) : C.card, op: wall[i] ? 0.75 : onPath[i] ? 0.9 : exp[i] ? 0.35 : 1, stroke: "none", sw: 0 });
          if (i && i !== W * H - 1) (function (k, node2) { function tg() { wall[k] = !wall[k]; run(); } node2.addEventListener("click", tg); })(i, c);
        }
        var len = R.path.length ? R.path.length - 1 : "—";
        T(svg, ox, 248, p[1] + ": expanded " + (anim >= 1 ? R.order.length : shown) + " cells", { anchor: "start", size: 11.5, weight: 700, fill: p[0] ? C.teal : C.blue, mono: false });
        T(svg, ox, 268, "path length " + (anim >= 1 ? len : "…"), { anchor: "start", size: 11, fill: C.dim, mono: false });
      });
      if (anim >= 1 && res[0].found) {
        var a = res[0].path.length, b = res[1].path.length, worse = b > a;
        T(svg, 8, 296, worse ? "A* returned a path " + (b - a) + " steps longer than the shortest: an overestimating heuristic broke the guarantee" : hi === 3 ? "same length on this grid: the overestimate got lucky — try a new grid" : "same length: A* is optimal while its heuristic never overestimates", { anchor: "start", size: 11.5, weight: 700, fill: worse ? C.pink : C.green, mono: false });
      } else if (anim >= 1) T(svg, 8, 296, "no path: the walls cut the corners apart — click walls to open one", { anchor: "start", size: 11.5, fill: C.pink, mono: false });
      T(svg, 8, 318, "blue / teal: expanded cells · orange: the path found · click a cell to toggle a wall", { anchor: "start", size: 9.5, fill: C.faint, mono: false });
    }
    K.tabs(f.controls, HS, hi, function (k) { hi = k; run(); });
    f.btn("new grid", function () { seed++; gen(); run(); });
    f.btn("run both ▶", run);
    gen(); res = [search(0), search(hi)]; render();
    f.say("Two searches, one grid; watch how many cells each opens. Set the heuristic to 3 × Manhattan and find the shorter path A* misses.");
  };

  /* ------------------------------------------------------------------------
     dsaMST — ch36 §3–4. Kruskal (sorted edges, union-find) and Prim (lazy
     heap from vertex 0) stepped side by side. Click an edge's weight to
     cycle it 1–9; equal weights break ties by list order.
     ------------------------------------------------------------------------ */
  VIZ.dsaMST = function (el) {
    var f = frame(el);
    var pos = [[60, 70], [200, 40], [340, 70], [60, 220], [200, 250], [340, 220], [200, 145]];
    var PRE = [["distinct weights", [[0, 1, 4], [1, 2, 8], [0, 3, 3], [2, 5, 7], [3, 4, 9], [4, 5, 6], [0, 6, 5], [1, 6, 2], [2, 6, 1], [3, 6, 10], [5, 6, 11], [4, 6, 12]]],
      ["tied weights", [[0, 1, 2], [1, 2, 1], [0, 3, 1], [2, 5, 1], [3, 4, 1], [4, 5, 3], [0, 6, 1], [1, 6, 3], [2, 6, 1], [3, 6, 1], [5, 6, 1], [4, 6, 3]]]];
    var edges = PRE[1][1].map(function (e) { return e.slice(); }), tr = [];
    function build() {
      var n = pos.length, idx = edges.map(function (e, i) { return i; }).sort(function (a, b) { return edges[a][2] - edges[b][2] || a - b; });
      var par = pos.map(function (x, i) { return i; }); function find(x) { while (par[x] !== x) x = par[x] = par[par[x]]; return x; }
      var kSteps = [], kIn = [];
      idx.forEach(function (i) { var e = edges[i], a = find(e[0]), b = find(e[1]); if (a !== b) { par[a] = b; kIn.push(i); kSteps.push({ e: i, ok: true, set: kIn.slice() }); } else kSteps.push({ e: i, ok: false, set: kIn.slice() }); });
      /* lazy Prim: a heap of (weight, push order, edge); ties go to the edge pushed first */
      var inT = [0], pIn = [], pSteps = [], heap = [], seq = 0;
      function add(v) { edges.forEach(function (e, i) { if (e[0] === v || e[1] === v) heap.push([e[2], seq++, i]); }); }
      add(0);
      while (inT.length < n && heap.length) {
        heap.sort(function (x, y) { return x[0] - y[0] || x[1] - y[1]; });
        var top = heap.shift(), e2 = edges[top[2]], ina = inT.indexOf(e2[0]) >= 0, inb = inT.indexOf(e2[1]) >= 0;
        if (ina && inb) continue;
        var nv = ina ? e2[1] : e2[0]; inT.push(nv); pIn.push(top[2]); pSteps.push({ e: top[2], ok: true, set: pIn.slice(), tree: inT.slice() }); add(nv);
      }
      tr = { k: kSteps, p: pSteps };
    }
    function total(set) { return set.reduce(function (s, i) { return s + edges[i][2]; }, 0); }
    var svg = svgOf(f, 340, "Kruskal and Prim on one graph; click a weight to change it", "group");
    function draw(q) {
      clear(svg);
      var ks = tr.k[Math.min(q, tr.k.length) - 1], ps = tr.p[Math.min(q, tr.p.length) - 1], kset = ks ? ks.set : [], pset = ps ? ps.set : [];
      T(svg, 8, 14, "step " + q + " · Kruskal considers edges by weight; Prim grows one tree from vertex 0", { anchor: "start", size: 12, weight: 700 });
      [[0, "Kruskal", kset, ks, C.blue], [1, "Prim", pset, ps, C.orange]].forEach(function (p) {
        var ox = p[0] * 380, set = p[2], st = p[3];
        T(svg, ox + 8, 34, p[1] + " · total " + total(set) + " · " + set.length + " of 6 edges", { anchor: "start", size: 11, weight: 700, fill: p[4], mono: false });
        edges.forEach(function (e, i) {
          var inS = set.indexOf(i) >= 0, cur = st && st.e === i;
          var lp = edge(svg, pos[e[0]][0] + ox, pos[e[0]][1] + 12, pos[e[1]][0] + ox, pos[e[1]][1] + 12, { stroke: cur && !st.ok ? C.pink : inS ? p[4] : C.line, sw: inS ? 3 : 1.2, dash: cur && !st.ok ? "4 3" : "none", label: e[2], labelCol: inS ? p[4] : C.dim });
          var hit = S("circle", { cx: lp[0], cy: lp[1], r: 9, fill: "transparent" }, svg);
          function bump() { e[2] = e[2] % 9 + 1; build(); sp.reload(); }
          hit.addEventListener("click", bump); focusable(hit, "edge " + e[0] + "–" + e[1] + " weight " + e[2] + ", click to change", bump);
        });
        pos.forEach(function (pp, v) { node(svg, pp[0] + ox, pp[1] + 12, v, { r: 12, fill: p[0] && ps && ps.tree.indexOf(v) >= 0 ? C.orange : C.card, op: 0.3 }); });
      });
      var done = q >= Math.max(tr.k.length, tr.p.length);
      if (done) {
        var diff = kset.filter(function (i) { return pset.indexOf(i) < 0; }).length;
        T(svg, 8, 306, "totals " + total(kset) + " and " + total(pset) + (diff ? " — equal, with " + diff + " different edge" + (diff === 1 ? "" : "s") + ": ties let two minimum trees exist" : " — and the same edges" + (edges.every(function (e, i) { return edges.every(function (o, j) { return i === j || o[2] !== e[2]; }); }) ? ": with distinct weights the tree is unique" : ": here the ties happened to break the same way")), { anchor: "start", size: 11.5, weight: 700, fill: diff ? C.orange : C.green, mono: false });
      } else if (ks) T(svg, 8, 306, "Kruskal: edge " + edges[ks.e][0] + "–" + edges[ks.e][1] + " (" + edges[ks.e][2] + ") " + (ks.ok ? "joins two components: take it" : "would close a cycle: skip"), { anchor: "start", size: 11, mono: false, fill: ks.ok ? C.text : C.pink });
      T(svg, 8, 328, "click a weight to cycle it 1–9", { anchor: "start", size: 9.5, fill: C.faint, mono: false });
    }
    presetRow(f, PRE.map(function (p) { return p[0]; }), function (i) { edges = PRE[i][1].map(function (e) { return e.slice(); }); build(); sp.reload(); });
    var sp = stepper(f, function () { return Math.max(tr.k.length, tr.p.length); }, draw);
    build(); draw(0);
    f.say("Two algorithms, same total weight. Step both to the end and watch them disagree about which edges; then make two weights equal and find a case where the trees differ.");
  };

  /* ------------------------------------------------------------------------
     dsaTarjanSCC — ch37 §2–3. The chapter's graph a–i with its neighbour
     order, so the components come out {i}, {d,e}, {f,g,h}, {a,b,c}.
     ------------------------------------------------------------------------ */
  VIZ.dsaTarjanSCC = function (el) {
    var f = frame(el);
    var names = "abcdefghi".split(""), pos = [[70, 60], [200, 60], [135, 170], [290, 190], [420, 190], [330, 60], [460, 60], [560, 120], [560, 250]];
    var adj = [[1], [2, 5], [0, 3], [4], [3, 8], [6], [7, 4], [8, 5], []], alg = 0, tr = [];
    var COMP = [C.teal, C.purple, C.orange, C.sky, C.pink];
    function build() {
      var n = names.length, ev = [];
      if (alg === 0) {
        var index = names.map(function () { return -1; }), low = index.slice(), on = [], st = [], comp = index.slice(), t = 0, c = 0;
        function snap(msg, cur, emit) { ev.push({ index: index.slice(), low: low.slice(), st: st.slice(), comp: comp.slice(), msg: msg, cur: cur, emit: emit }); }
        snap("Each vertex gets an index when entered and a low-link: the smallest index it can reach and still find on the stack.", -1);
        (function dfs(u) {
          index[u] = low[u] = t++; st.push(u); on[u] = true; snap("enter " + names[u] + ": index = low = " + index[u] + ", push it", u);
          adj[u].forEach(function (v) {
            if (index[v] < 0) { dfs(v); if (low[v] < low[u]) { low[u] = low[v]; snap(names[u] + " takes " + names[v] + "'s low-link: " + low[u], u); } }
            else if (on[v]) { if (index[v] < low[u]) { low[u] = index[v]; snap(names[u] + " → " + names[v] + " finds it on the stack: low[" + names[u] + "] = " + low[u], u); } }
            else snap(names[u] + " → " + names[v] + ": " + names[v] + " is already in a finished component — ignored", u);
          });
          if (low[u] === index[u]) {
            var cc = [], w; do { w = st.pop(); on[w] = false; comp[w] = c; cc.push(names[w]); } while (w !== u);
            c++; snap("low[" + names[u] + "] = index[" + names[u] + "] = " + index[u] + ": pop to " + names[u] + " — component {" + cc.reverse().join(", ") + "}", u, true);
          }
        })(0);
      } else {
        var seen = names.map(function () { return false; }), order = [], radj = names.map(function () { return []; }), comp2 = names.map(function () { return -1; }), c2 = 0;
        adj.forEach(function (a, u) { a.forEach(function (v) { radj[v].push(u); }); });
        ev.push({ order: [], comp: comp2.slice(), msg: "Kosaraju pass 1: DFS the graph and list vertices as they finish", cur: -1 });
        for (var s = 0; s < n; s++) if (!seen[s]) (function d1(u) { seen[u] = true; adj[u].forEach(function (v) { if (!seen[v]) d1(v); }); order.push(u); ev.push({ order: order.slice(), comp: comp2.slice(), cur: u, msg: names[u] + " finishes" }); })(s);
        ev.push({ order: order.slice(), comp: comp2.slice(), cur: -1, msg: "pass 2: on the reversed graph, start from the latest finisher; each search is one component" });
        order.slice().reverse().forEach(function (s2) {
          if (comp2[s2] >= 0) return;
          var cc = [];
          (function d2(u) { comp2[u] = c2; cc.push(names[u]); radj[u].forEach(function (v) { if (comp2[v] < 0) d2(v); }); })(s2);
          c2++; ev.push({ order: order.slice(), comp: comp2.slice(), cur: s2, emit: true, msg: "search from " + names[s2] + " on the reversed graph: component {" + cc.join(", ") + "}" });
        });
      }
      tr = ev;
    }
    var svg = svgOf(f, 340, "strongly connected components");
    function draw(k) {
      clear(svg);
      var s = tr[k], E = []; adj.forEach(function (a, u) { a.forEach(function (v) { E.push([u, v]); }); });
      T(svg, 8, 14, (alg ? "Kosaraju" : "Tarjan") + " · step " + k + " of " + (tr.length - 1), { anchor: "start", size: 12, weight: 700 });
      drawGraph(svg, { pos: pos, edges: E, directed: true, names: names }, function (e) { var a = s.comp[e[0]], b = s.comp[e[1]]; return { stroke: a >= 0 && a === b ? COMP[a % 5] : C.line, sw: a >= 0 && a === b ? 2.4 : 1.3 }; }, function (v) {
        var cc = s.comp[v];
        return { fill: cc >= 0 ? COMP[cc % 5] : v === s.cur ? C.blue : alg === 0 && s.index[v] >= 0 ? C.sky : C.card, op: cc >= 0 ? 0.45 : 0.3, stroke: v === s.cur ? C.blue : C.line, sw: v === s.cur ? 2.5 : 1.2,
          sub: alg === 0 && s.index[v] >= 0 ? s.index[v] + "/" + s.low[v] : "", subCol: alg === 0 && s.index[v] === s.low[v] ? C.green : C.dim };
      });
      T(svg, 610, 40, alg === 0 ? "stack (bottom → top)" : "finish order", { anchor: "start", size: 10, fill: C.faint, mono: false });
      (alg === 0 ? s.st : s.order).forEach(function (v, j) { rect(svg, 610 + (j % 5) * 28, 50 + Math.floor(j / 5) * 28, 24, 22, { rx: 4, fill: C.card, stroke: C.line }); T(svg, 622 + (j % 5) * 28, 61 + Math.floor(j / 5) * 28, names[v], { size: 11, weight: 700 }); });
      if (alg === 0) T(svg, 610, 140, "under a vertex: index/low", { anchor: "start", size: 9, fill: C.faint, mono: false });
      wrap(svg, 8, 300, s.msg, 744, { size: 11.5, fill: s.emit ? C.green : C.text });
    }
    K.tabs(f.controls, ["Tarjan", "Kosaraju"], 0, function (k) { alg = k; build(); sp.reload(); });
    var sp = stepper(f, function () { return tr.length - 1; }, draw);
    build(); draw(0);
    f.say("Two numbers per vertex. When they become equal, a component closes: find each vertex where low-link equals index and confirm a component is emitted exactly then.");
  };

  /* ---- a residual network: edge e and e ^ 1 are a forward/backward pair ---- */
  function Net(n, list) {
    var N = { n: n, to: [], cap: [], orig: [], from: [], adj: [] };
    for (var i = 0; i < n; i++) N.adj.push([]);
    list.forEach(function (e) {
      N.adj[e[0]].push(N.to.length); N.to.push(e[1]); N.from.push(e[0]); N.cap.push(e[2]); N.orig.push(e[2]);
      N.adj[e[1]].push(N.to.length); N.to.push(e[0]); N.from.push(e[1]); N.cap.push(0); N.orig.push(0);
    });
    return N;
  }
  function bfsPath(N, s, t) {
    var prev = [], q = [s], seen = {}; seen[s] = 1;
    while (q.length) { var u = q.shift(); N.adj[u].forEach(function (e) { var v = N.to[e]; if (N.cap[e] > 0 && !seen[v]) { seen[v] = 1; prev[v] = e; q.push(v); } }); }
    if (!seen[t]) return null;
    var p = [], x = t; while (x !== s) { p.unshift(prev[x]); x = N.from[prev[x]]; } return p;
  }
  function dfsPath(N, s, t) {
    var seen = {}, p = [];
    return (function go(u) { if (u === t) return true; seen[u] = 1; for (var k = 0; k < N.adj[u].length; k++) { var e = N.adj[u][k], v = N.to[e]; if (N.cap[e] > 0 && !seen[v]) { p.push(e); if (go(v)) return true; p.pop(); } } return false; })(s) ? p : null;
  }
  function worstPath(N, s, t) {              // the simple path with the smallest bottleneck
    var best = null, bb = INF, p = [], seen = {};
    (function go(u, b) { if (u === t) { if (b < bb) { bb = b; best = p.slice(); } return; } seen[u] = 1; N.adj[u].forEach(function (e) { var v = N.to[e]; if (N.cap[e] > 0 && !seen[v]) { p.push(e); go(v, Math.min(b, N.cap[e])); p.pop(); } }); seen[u] = 0; })(s, INF);
    return best;
  }
  function push(N, p) { var b = Math.min.apply(null, p.map(function (e) { return N.cap[e]; })); p.forEach(function (e) { N.cap[e] -= b; N.cap[e ^ 1] += b; }); return b; }
  function reach(N, s) { var seen = {}, q = [s]; seen[s] = 1; while (q.length) { var u = q.shift(); N.adj[u].forEach(function (e) { if (N.cap[e] > 0 && !seen[N.to[e]]) { seen[N.to[e]] = 1; q.push(N.to[e]); } }); } return seen; }
  /* Draw a network: flow/capacity on each original edge, or residual capacities. */
  function drawNet(svg, N, G, o) {
    o = o || {};
    var onPath = {}; (o.path || []).forEach(function (e) { onPath[e] = 1; });
    for (var e = 0; e < N.to.length; e += 2) {
      var u = N.from[e], v = N.to[e], p = G.pos[u], q = G.pos[v], fl = N.orig[e] - N.cap[e], sat = N.cap[e] === 0;
      if (o.residual) {
        if (N.cap[e] > 0) edge(svg, p[0], p[1], q[0], q[1], { directed: true, bend: 9, stroke: onPath[e] ? C.orange : C.teal, sw: onPath[e] ? 3 : 1.4, label: N.cap[e], labelCol: C.teal });
        if (N.cap[e ^ 1] > 0) edge(svg, q[0], q[1], p[0], p[1], { directed: true, bend: 9, stroke: onPath[e ^ 1] ? C.orange : C.pink, sw: onPath[e ^ 1] ? 3 : 1.4, dash: "4 3", label: N.cap[e ^ 1], labelCol: C.pink });
      } else {
        var cut = o.cut && o.cut[u] && !o.cut[v];
        edge(svg, p[0], p[1], q[0], q[1], { directed: true, stroke: cut ? C.pink : onPath[e] || onPath[e ^ 1] ? C.orange : fl > 0 ? (sat ? C.blue : C.sky) : C.line, sw: cut ? 3.2 : onPath[e] || onPath[e ^ 1] ? 3 : fl > 0 ? 2.2 : 1.3, label: (N.orig[e] >= 1e6 ? "∞" : fl + "/" + N.orig[e]), labelCol: cut ? C.pink : sat ? C.blue : C.dim });
      }
    }
    G.pos.forEach(function (p, v) { var s = o.nst ? o.nst(v) || {} : {}; node(svg, p[0], p[1], G.names[v], s); });
  }

  /* ------------------------------------------------------------------------
     dsaMaxFlow — ch38 §1–3. One augmentation per step. The worst choice
     takes the augmenting path with the smallest bottleneck, the path an
     adversary would hand arbitrary Ford–Fulkerson.
     ------------------------------------------------------------------------ */
  VIZ.dsaMaxFlow = function (el) {
    var f = frame(el);
    var NETS = [
      { name: "the chapter's unit diamond", names: ["s", "a", "b", "t"], pos: [[80, 150], [300, 60], [300, 240], [520, 150]], e: [[0, 1, 1], [0, 2, 1], [1, 2, 1], [1, 3, 1], [2, 3, 1]] },
      { name: "100 / 1 trap", names: ["s", "a", "b", "t"], pos: [[80, 150], [300, 60], [300, 240], [520, 150]], e: [[0, 1, 100], [0, 2, 100], [1, 2, 1], [1, 3, 100], [2, 3, 100]] },
      { name: "six vertices", names: ["s", "a", "b", "c", "d", "t"], pos: [[60, 150], [220, 60], [220, 240], [400, 60], [400, 240], [540, 150]], e: [[0, 1, 10], [0, 2, 5], [1, 2, 4], [1, 3, 6], [2, 4, 9], [4, 3, 3], [4, 5, 4], [3, 5, 10]] }
    ];
    var ALG = ["Edmonds–Karp (BFS)", "Ford–Fulkerson (DFS)", "Ford–Fulkerson, worst path"], ni = 1, ai = 2, resid = false, tr = [];
    function build() {
      var G = NETS[ni], N = Net(G.names.length, G.e), t = G.names.length - 1, total = 0;
      tr = [{ cap: N.cap.slice(), total: 0, path: null, msg: "no flow yet" }];
      for (var guard = 0; guard < 400; guard++) {
        var p = ai === 0 ? bfsPath(N, 0, t) : ai === 1 ? dfsPath(N, 0, t) : worstPath(N, 0, t);
        if (!p) break;
        var names = [G.names[0]].concat(p.map(function (e) { return G.names[N.to[e]] + (e & 1 ? "ᵇ" : ""); })), b = push(N, p);
        total += b;
        tr.push({ cap: N.cap.slice(), total: total, path: p, b: b, msg: "augment along " + names.join(" → ") + " by " + b + (p.some(function (e) { return e & 1; }) ? " (ᵇ marks a backward residual edge: flow undone)" : "") });
      }
      tr.push({ cap: N.cap.slice(), total: total, path: null, done: true, msg: "no augmenting path left: maximum flow " + total + " after " + (tr.length - 1) + " augmentation" + (tr.length === 2 ? "" : "s") });
      tr.N = N;
    }
    var svg = svgOf(f, 340, "max flow by augmenting paths");
    function draw(k) {
      clear(svg);
      var s = tr[k], G = NETS[ni], N = tr.N; N.cap = s.cap.slice();
      T(svg, 8, 14, G.name + " · " + ALG[ai] + " · augmentations " + (s.done ? tr.length - 2 : k) + " · flow " + s.total, { anchor: "start", size: 12, weight: 700 });
      drawNet(svg, N, G, { path: s.path, residual: resid, nst: function () { return { r: 16 }; } });
      wrap(svg, 8, 290, s.msg, 744, { size: 11.5, fill: s.done ? C.green : C.text });
      T(svg, 600, 60, resid ? "residual graph" : "flow / capacity", { anchor: "start", size: 10.5, weight: 700, fill: C.dim, mono: false });
      T(svg, 600, 80, resid ? "teal: room left forward" : "blue: saturated", { anchor: "start", size: 9.5, fill: C.faint, mono: false });
      T(svg, 600, 96, resid ? "pink dashed: undoable flow" : "orange: this path", { anchor: "start", size: 9.5, fill: C.faint, mono: false });
    }
    K.tabs(f.controls, NETS.map(function (x) { return x.name; }), ni, function (k) { ni = k; build(); sp.reload(); });
    K.tabs(f.controls, ALG, ai, function (k) { ai = k; build(); sp.reload(); });
    K.toggle(f.controls, "residual view", resid, function (on) { resid = on; draw(sp.pos()); });
    var sp = stepper(f, function () { return tr.length - 1; }, draw);
    build(); draw(0);
    f.say("Each augmentation pushes flow along one path. Run the worst path choice on the 100 / 1 trap and count the augmentations, then run Edmonds–Karp on the same graph. Toggle the residual view to see the backward edges.");
  };

  /* ------------------------------------------------------------------------
     dsaDinicLevels — ch38 §4. Each phase: BFS levels, then blocking flow by
     DFS that only steps from level k to k + 1, with a per-vertex pointer.
     ------------------------------------------------------------------------ */
  VIZ.dsaDinicLevels = function (el) {
    var f = frame(el);
    var G = { names: ["s", "a", "b", "c", "d", "e", "t"], pos: [[50, 150], [180, 60], [180, 240], [330, 60], [330, 240], [470, 150], [600, 150]],
      e: [[0, 1, 3], [0, 2, 3], [1, 3, 2], [1, 2, 2], [2, 4, 3], [4, 3, 2], [3, 6, 2], [3, 5, 2], [4, 5, 2], [5, 6, 3]] }, tr = [];
    function build() {
      var N = Net(G.names.length, G.e), s = 0, t = G.names.length - 1, flow = 0, phase = 0, sinkLv = [];
      tr = [{ cap: N.cap.slice(), level: null, msg: "Each phase: label levels by BFS, then saturate every shortest path at once.", phase: 0, flow: 0, sinkLv: [] }];
      for (;;) {
        var level = G.names.map(function () { return -1; }), q = [s]; level[s] = 0;
        while (q.length) { var u = q.shift(); N.adj[u].forEach(function (e) { var v = N.to[e]; if (N.cap[e] > 0 && level[v] < 0) { level[v] = level[u] + 1; q.push(v); } }); }
        if (level[t] < 0) break;
        phase++; sinkLv.push(level[t]);
        tr.push({ cap: N.cap.slice(), level: level.slice(), phase: phase, flow: flow, sinkLv: sinkLv.slice(), msg: "phase " + phase + ": BFS puts t at level " + level[t] + ". Only edges from level k to k + 1 may be used." });
        var it = G.names.map(function () { return 0; });
        for (;;) {
          var path = [];
          var got = (function dfs(u) {
            if (u === t) return true;
            for (; it[u] < N.adj[u].length; it[u]++) { var e = N.adj[u][it[u]], v = N.to[e]; if (N.cap[e] > 0 && level[v] === level[u] + 1) { path.push(e); if (dfs(v)) return true; path.pop(); } }
            return false;
          })(s);
          if (!got) break;
          var b = push(N, path); flow += b;
          tr.push({ cap: N.cap.slice(), level: level.slice(), phase: phase, flow: flow, path: path.slice(), sinkLv: sinkLv.slice(), msg: "phase " + phase + ": push " + b + " along " + [G.names[s]].concat(path.map(function (e) { return G.names[N.to[e]]; })).join(" → ") + " (length " + path.length + ")" });
        }
        tr.push({ cap: N.cap.slice(), level: level.slice(), phase: phase, flow: flow, sinkLv: sinkLv.slice(), blocked: true, msg: "phase " + phase + " blocked: every level-" + level[t] + " path has a saturated edge" });
      }
      tr.push({ cap: N.cap.slice(), level: null, phase: phase, flow: flow, sinkLv: sinkLv, done: true, msg: "BFS cannot reach t: maximum flow " + flow + " in " + phase + " phases; t's level went " + sinkLv.join(" → ") });
      tr.N = N;
    }
    var svg = svgOf(f, 340, "Dinic's level graphs");
    function draw(k) {
      clear(svg);
      var s = tr[k], N = tr.N; N.cap = s.cap.slice();
      T(svg, 8, 14, "Dinic · phase " + s.phase + " · flow " + s.flow + " · t's level by phase: " + (s.sinkLv.length ? s.sinkLv.join(" → ") : "—"), { anchor: "start", size: 12, weight: 700 });
      if (s.level) {
        var mx = Math.max.apply(null, s.level);
        for (var L = 0; L <= mx; L++) { var xs = G.pos.filter(function (p, v) { return s.level[v] === L; }).map(function (p) { return p[0]; }); if (xs.length) T(svg, Math.min.apply(null, xs), 292, "L" + L, { size: 9, fill: C.faint }); }
      }
      var onPath = {}; (s.path || []).forEach(function (e) { onPath[e] = 1; });
      for (var e = 0; e < N.to.length; e += 2) {
        var u = N.from[e], v = N.to[e], p = G.pos[u], q = G.pos[v], fl = N.orig[e] - N.cap[e], inLG = s.level && N.cap[e] > 0 && s.level[v] === s.level[u] + 1;
        edge(svg, p[0], p[1], q[0], q[1], { directed: true, stroke: onPath[e] ? C.orange : inLG ? C.teal : fl ? C.blue : C.line, sw: onPath[e] ? 3 : inLG ? 2.2 : 1.2, op: s.level && !inLG && !onPath[e] ? 0.4 : 1, label: fl + "/" + N.orig[e], labelCol: N.cap[e] === 0 ? C.blue : C.dim });
      }
      G.pos.forEach(function (p, v) { node(svg, p[0], p[1], G.names[v], { r: 15, fill: s.level && s.level[v] >= 0 ? C.teal : C.card, op: 0.3, sub: s.level ? (s.level[v] >= 0 ? "level " + s.level[v] : "unreached") : "" }); });
      wrap(svg, 8, 312, s.msg, 744, { size: 11.5, fill: s.done ? C.green : s.blocked ? C.orange : C.text });
    }
    f.btn("next phase ⏩", function () { var p = sp.pos() + 1; while (p < tr.length - 1 && !tr[p].blocked) p++; sp.go(p + 1 < tr.length ? p + 1 : p); });
    var sp = stepper(f, function () { return tr.length - 1; }, draw);
    build(); draw(0);
    f.say("Each phase builds a level graph and saturates it; teal edges are the level graph. Count the phases and confirm the sink's level strictly increases each time.");
  };

  /* ------------------------------------------------------------------------
     dsaMinCut — ch38 §5. The flow is computed first; click a vertex to move
     it between S and T and price your own cut.
     ------------------------------------------------------------------------ */
  VIZ.dsaMinCut = function (el) {
    var f = frame(el);
    var G = { names: ["s", "a", "b", "c", "d", "t"], pos: [[60, 150], [220, 60], [220, 240], [400, 60], [400, 240], [560, 150]],
      e: [[0, 1, 10], [0, 2, 5], [1, 2, 4], [1, 3, 6], [2, 4, 9], [4, 3, 3], [4, 5, 4], [3, 5, 10]] };
    var N = Net(6, G.e), flow = 0, p, side = { 0: 1 }, reveal = false, log = [];
    while ((p = bfsPath(N, 0, 5))) flow += push(N, p);
    var algo = reach(N, 0);
    function capOf(Sset) { var c = 0; G.e.forEach(function (e) { if (Sset[e[0]] && !Sset[e[1]]) c += e[2]; }); return c; }
    var svg = svgOf(f, 330, "min cut: click a vertex to move it across your cut", "group");
    function render() {
      clear(svg);
      var S2 = reveal ? algo : side, c = capOf(S2);
      T(svg, 8, 14, "maximum flow " + flow + " · " + (reveal ? "the residual graph's cut" : "your cut") + ": S = {" + G.names.filter(function (x, v) { return S2[v]; }).join(", ") + "} · capacity " + c, { anchor: "start", size: 12, weight: 700 });
      drawNet(svg, N, G, { cut: S2, nst: function (v) { return { r: 17, fill: S2[v] ? C.teal : C.orange, op: 0.35, sub: S2[v] ? "S" : "T" }; } });
      G.pos.forEach(function (pp, v) {
        if (v === 0 || v === 5 || reveal) return;
        var hit = S("circle", { cx: pp[0], cy: pp[1], r: 18, fill: "transparent" }, svg);
        function tg() { side[v] = side[v] ? 0 : 1; render(); }
        hit.addEventListener("click", tg); focusable(hit, "move " + G.names[v] + " across the cut", tg);
      });
      T(svg, 8, 282, c === flow ? "capacity " + c + " = the flow: this is a minimum cut" : "capacity " + c + " > flow " + flow + ": every cut is at least the flow", { anchor: "start", size: 12, weight: 700, fill: c === flow ? C.green : C.dim, mono: false });
      T(svg, 8, 304, "cuts you have priced: " + (log.length ? log.join(", ") : "—"), { anchor: "start", size: 10.5, fill: C.dim, mono: false });
      T(svg, 8, 324, "pink: edges leaving S, whose capacities sum to the cut · s and t stay put · labels are flow / capacity", { anchor: "start", size: 9.5, fill: C.faint, mono: false });
    }
    f.btn("price this cut", function () { if (reveal) return; var c = capOf(side), k = "{" + G.names.filter(function (x, v) { return side[v]; }).join("") + "} " + c; if (log.indexOf(k) < 0) log.push(k); render(); });
    K.toggle(f.controls, "reveal the algorithm's cut", reveal, function (on) { reveal = on; render(); });
    f.btn("reset", function () { side = { 0: 1 }; log = []; render(); });
    render();
    f.say("The flow is maxed out. Now try to find a cheaper cut than the algorithm's: click vertices to move them into S, price three cuts, then reveal the one the residual graph gives.");
  };

  /* ------------------------------------------------------------------------
     dsaBipartiteMatching — ch39 §2, Kuhn's max_matching. The grid on the
     right toggles edges.
     ------------------------------------------------------------------------ */
  VIZ.dsaBipartiteMatching = function (el) {
    var f = frame(el);
    var L = ["w1", "w2", "w3", "w4"], R = ["j1", "j2", "j3", "j4"], E = [[1, 1, 0, 0], [1, 0, 0, 0], [0, 1, 1, 1], [0, 0, 1, 0]], flowV = false, konig = false, tr = [];
    function build() {
      var mR = [-1, -1, -1, -1], mL = [-1, -1, -1, -1], ev = [{ mR: mR.slice(), msg: "No pairs yet. Each left vertex in turn looks for an alternating path." }];
      for (var u = 0; u < 4; u++) {
        var seen = [], path = [];
        var ok = (function tryK(x) {
          for (var j = 0; j < 4; j++) {
            if (!E[x][j] || seen[j]) continue;
            seen[j] = true; path.push([x, j]);
            if (mR[j] < 0 || tryK(mR[j])) { mR[j] = x; mL[x] = j; return true; }
            path.push([mR[j], j]);
          }
          return false;
        })(u);
        ev.push({ mR: mR.slice(), path: path.slice(), u: u, ok: ok, msg: ok ? L[u] + " is matched" + (path.length > 1 ? " by an alternating path " + path.map(function (p) { return L[p[0]] + "–" + R[p[1]]; }).join(", ") + ": everyone on it shifts one partner" : " to " + R[mL[u]] + ", which was free") : L[u] + " finds no alternating path: it stays unmatched" });
      }
      /* König: Z = vertices reachable from unmatched left by alternating paths */
      var ZL = [], ZR = [], q = []; for (u = 0; u < 4; u++) if (!mR.some(function (x) { return x === u; })) { ZL[u] = 1; q.push(u); }
      while (q.length) { var x = q.shift(); for (var j = 0; j < 4; j++) if (E[x][j] && !ZR[j] && mR[j] !== x) { ZR[j] = 1; if (mR[j] >= 0 && !ZL[mR[j]]) { ZL[mR[j]] = 1; q.push(mR[j]); } } }
      var cover = { L: [0, 1, 2, 3].filter(function (i) { return !ZL[i]; }), R: [0, 1, 2, 3].filter(function (j) { return ZR[j]; }) };
      ev.forEach(function (e) { e.cover = cover; });
      tr = ev;
    }
    var svg = svgOf(f, 330, "bipartite matching; click the grid to toggle edges", "group");
    function draw(k) {
      clear(svg);
      var s = tr[k], done = k === tr.length - 1, size = s.mR.filter(function (x) { return x >= 0; }).length;
      var lx = flowV ? 180 : 120, rx = flowV ? 400 : 440, ys = function (i) { return 60 + i * 60; };
      T(svg, 8, 14, "matching of size " + size + " · step " + k + " of " + (tr.length - 1) + (flowV ? " · as a flow network, every capacity 1" : ""), { anchor: "start", size: 12, weight: 700 });
      if (flowV) { node(svg, 50, 150, "s", { r: 15 }); node(svg, 530, 150, "t", { r: 15 }); }
      var onPath = {}; (s.path || []).forEach(function (p) { onPath[p[0] + "," + p[1]] = 1; });
      for (var i = 0; i < 4; i++) {
        var li = s.mR.indexOf(i) >= 0, rj = s.mR[i] >= 0;
        if (flowV) { edge(svg, 50, 150, lx, ys(i), { directed: true, r: 15, stroke: li ? C.green : C.line, sw: li ? 2.4 : 1.2 }); edge(svg, rx, ys(i), 530, 150, { directed: true, r: 15, stroke: rj ? C.green : C.line, sw: rj ? 2.4 : 1.2 }); }
        for (var j = 0; j < 4; j++) if (E[i][j]) {
          var m = s.mR[j] === i, pth = onPath[i + "," + j];
          edge(svg, lx, ys(i), rx, ys(j), { directed: flowV, stroke: pth ? C.orange : m ? C.green : C.line, sw: m || pth ? 3 : 1.3, dash: pth && !m ? "5 3" : "none" });
        }
      }
      for (i = 0; i < 4; i++) {
        var inC = konig && done;
        node(svg, lx, ys(i), L[i], { r: 16, fill: inC && s.cover.L.indexOf(i) >= 0 ? C.pink : i === s.u ? C.blue : C.card, op: 0.4 });
        node(svg, rx, ys(i), R[i], { r: 16, fill: inC && s.cover.R.indexOf(i) >= 0 ? C.pink : C.card, op: 0.4 });
      }
      /* the edge grid */
      var GX = 590, cs = 34;
      T(svg, GX, 44, "edges (click)", { anchor: "start", size: 9.5, fill: C.faint, mono: false });
      for (i = 0; i < 4; i++) { T(svg, GX - 14, 70 + i * cs, L[i], { size: 9.5, fill: C.dim }); T(svg, GX + i * cs + cs / 2, 56, R[i], { size: 9.5, fill: C.dim }); }
      for (i = 0; i < 4; i++) for (j = 0; j < 4; j++) (function (a, b) {
        var c = rect(svg, GX + b * cs + 2, 60 + a * cs, cs - 4, cs - 4, { rx: 4, fill: E[a][b] ? C.teal : C.card, op: E[a][b] ? 0.5 : 1, stroke: C.line });
        function tg() { E[a][b] = 1 - E[a][b]; build(); sp.go(tr.length - 1); }
        c.addEventListener("click", tg); focusable(c, L[a] + "–" + R[b] + (E[a][b] ? " on" : " off"), tg);
      })(i, j);
      wrap(svg, 8, 292, s.msg, 744, { size: 11.5, fill: s.ok === false ? C.pink : C.text });
      if (konig && done) T(svg, 590, 220, "cover " + (s.cover.L.length + s.cover.R.length) + " = matching " + size, { anchor: "start", size: 11.5, weight: 700, fill: C.pink, mono: false });
    }
    K.toggle(f.controls, "show as a flow network", flowV, function (on) { flowV = on; draw(sp.pos()); });
    K.toggle(f.controls, "show König's cover", konig, function (on) { konig = on; draw(sp.pos()); });
    var sp = stepper(f, function () { return tr.length - 1; }, draw);
    build(); draw(0);
    f.say("Match what you can, then find an augmenting path. Step to the maximum matching, then reveal the minimum vertex cover and confirm the two numbers are equal.");
  };

  /* ------------------------------------------------------------------------
     dsaProjectSelection — ch39 §6. Profits from s, costs to t, requires as
     infinite edges; the chosen set is the source side of the min cut.
     ------------------------------------------------------------------------ */
  VIZ.dsaProjectSelection = function (el) {
    var f = frame(el);
    var names = ["s", "A", "B", "C", "D", "E", "t"], val = [0, 15, 6, -7, -4, -5, 0], req = [[1, 3, true], [1, 4, true], [2, 4, true], [2, 5, true]];
    var pos = [[60, 150], [220, 80], [220, 220], [420, 50], [420, 150], [420, 250], [600, 150]];
    var svg = svgOf(f, 330, "project selection network and its minimum cut");
    function render() {
      clear(svg);
      var list = [], BIG = 1e6, pos2 = 0;
      for (var v = 1; v <= 5; v++) { if (val[v] > 0) { list.push([0, v, val[v]]); pos2 += val[v]; } if (val[v] < 0) list.push([v, 6, -val[v]]); }
      req.forEach(function (r) { if (r[2]) list.push([r[0], r[1], BIG]); });
      var N = Net(7, list), flow = 0, p; while ((p = bfsPath(N, 0, 6))) flow += push(N, p);
      var S2 = reach(N, 0), chosen = [1, 2, 3, 4, 5].filter(function (x) { return S2[x]; });
      /* brute force over closed sets */
      var best = 0, bestSet = [];
      for (var m = 0; m < 32; m++) {
        var set = [1, 2, 3, 4, 5].filter(function (x, i) { return m >> i & 1; });
        if (!req.every(function (r) { return !r[2] || set.indexOf(r[0]) < 0 || set.indexOf(r[1]) >= 0; })) continue;
        var pr = set.reduce(function (a, x) { return a + val[x]; }, 0); if (pr > best) { best = pr; bestSet = set; }
      }
      T(svg, 8, 14, "positive profits " + pos2 + " − min cut " + flow + " = best profit " + (pos2 - flow) + " · take {" + chosen.map(function (x) { return names[x]; }).join(", ") + "}", { anchor: "start", size: 12, weight: 700 });
      drawNet(svg, N, { pos: pos, names: names.map(function (n, i) { return i && i < 6 ? n + (val[i] > 0 ? "+" + val[i] : val[i]) : n; }) }, { cut: S2, nst: function (v) { return { r: v && v < 6 ? 21 : 16, fill: v === 0 ? C.teal : v === 6 ? C.orange : S2[v] ? C.green : C.card, op: 0.4, size: 10 }; } });
      T(svg, 8, 290, "checked against every closed set: best " + best + " with {" + bestSet.map(function (x) { return names[x]; }).join(", ") + "}" + (best === pos2 - flow ? " — agrees" : " — DISAGREES"), { anchor: "start", size: 11, fill: best === pos2 - flow ? C.green : C.pink, mono: false });
      T(svg, 8, 312, "green: projects on the source side of the cut, the ones to fund · pink: cut edges · ∞: a requirement", { anchor: "start", size: 9.5, fill: C.faint, mono: false });
    }
    [["A profit", 1, 0, 30], ["B profit", 2, 0, 30], ["C cost", 3, 0, 20], ["D cost", 4, 0, 20], ["E cost", 5, 0, 20]].forEach(function (c) {
      K.slider(f.controls, c[0], c[2], c[3], Math.abs(val[c[1]]), 1, String, function (x) { val[c[1]] = c[1] <= 2 ? x : -x; render(); });
    });
    req.forEach(function (r) { K.toggle(f.controls, names[r[0]] + " needs " + names[r[1]], true, function (on) { r[2] = on; render(); }); });
    render();
    f.say("Profits become source edges, costs become sink edges, prerequisites become infinite. Make one tool expensive enough to kill a profitable project and watch the selection change.");
  };

  /* ------------------------------------------------------------------------
     dsaGaleShapley — ch39 §7. Proposers go down their lists; each receiver
     holds its best offer so far.
     ------------------------------------------------------------------------ */
  VIZ.dsaGaleShapley = function (el) {
    var f = frame(el);
    var PRE = [
      { name: "rival first choices", P: ["A", "B", "C"], R: ["x", "y", "z"], pp: [[0, 1, 2], [1, 2, 0], [2, 0, 1]], rp: [[1, 2, 0], [2, 0, 1], [0, 1, 2]] },
      { name: "four a side", P: ["A", "B", "C", "D"], R: ["w", "x", "y", "z"], pp: [[1, 0, 3, 2], [3, 1, 0, 2], [1, 3, 2, 0], [0, 1, 2, 3]], rp: [[2, 0, 3, 1], [3, 1, 0, 2], [0, 3, 2, 1], [1, 2, 0, 3]] }
    ];
    var pi = 0, side = 0, tr = [];
    function build() {
      var I = PRE[pi], Pn = side ? I.R : I.P, Rn = side ? I.P : I.R, pp = side ? I.rp : I.pp, rp = side ? I.pp : I.rp, n = Pn.length;
      var next = Pn.map(function () { return 0; }), held = Rn.map(function () { return -1; }), free = Pn.map(function (x, i) { return i; }), ev = [], props = 0;
      ev.push({ held: held.slice(), msg: Pn.join(", ") + " propose; " + Rn.join(", ") + " hold the best offer so far", props: 0 });
      while (free.length) {
        var p = free.shift(), r = pp[p][next[p]++]; props++;
        var cur = held[r], rank = function (x) { return rp[r].indexOf(x); }, msg;
        if (cur < 0) { held[r] = p; msg = Pn[p] + " proposes to " + Rn[r] + ", who is free and holds the offer"; }
        else if (rank(p) < rank(cur)) { held[r] = p; free.push(cur); msg = Pn[p] + " proposes to " + Rn[r] + ", who trades up from " + Pn[cur] + " — " + Pn[cur] + " is free again"; }
        else { free.push(p); msg = Pn[p] + " proposes to " + Rn[r] + ", who prefers " + Pn[cur] + " and rejects"; }
        ev.push({ held: held.slice(), msg: msg, p: p, r: r, props: props });
      }
      tr = ev; tr.Pn = Pn; tr.Rn = Rn; tr.pp = pp; tr.rp = rp;
    }
    function outcome(sd) { var keep = side; side = sd; build(); var h = tr[tr.length - 1].held, Pn = tr.Pn, Rn = tr.Rn, pp = tr.pp, rp = tr.rp, out = {}; h.forEach(function (p, r) { out[Pn[p]] = pp[p].indexOf(r) + 1; out[Rn[r]] = rp[r].indexOf(p) + 1; }); side = keep; build(); return out; }
    var svg = svgOf(f, 330, "Gale-Shapley stable matching");
    function draw(k) {
      clear(svg);
      var s = tr[k], Pn = tr.Pn, Rn = tr.Rn, n = Pn.length, done = k === tr.length - 1;
      T(svg, 8, 14, PRE[pi].name + " · " + (side ? "the second side proposes" : "the first side proposes") + " · proposals " + s.props, { anchor: "start", size: 12, weight: 700 });
      var py = function (i) { return 60 + i * 52; };
      for (var r = 0; r < n; r++) if (s.held[r] >= 0) line(svg, 150, py(s.held[r]), 380, py(r), { stroke: done ? C.green : C.teal, sw: 2.6 });
      if (s.p !== undefined) line(svg, 150, py(s.p), 380, py(s.r), { stroke: C.orange, sw: 2, dash: "5 3" });
      for (var i = 0; i < n; i++) {
        node(svg, 150, py(i), Pn[i], { r: 15, fill: i === s.p ? C.orange : C.blue, op: 0.3 });
        node(svg, 380, py(i), Rn[i], { r: 15, fill: C.purple, op: 0.3 });
        T(svg, 20, py(i), tr.pp[i].map(function (x) { return Rn[x]; }).join(" "), { anchor: "start", size: 10, fill: C.dim });
        T(svg, 410, py(i), tr.rp[i].map(function (x) { return Pn[x]; }).join(" "), { anchor: "start", size: 10, fill: C.dim });
      }
      T(svg, 20, 40, "preferences, best first", { anchor: "start", size: 9, fill: C.faint, mono: false });
      wrap(svg, 8, 282, s.msg, 744, { size: 11.5, fill: done ? C.green : C.text });
      if (done) {
        var a = outcome(0), b = outcome(1), names = Object.keys(a), better = names.filter(function (x) { return a[x] !== b[x]; });
        T(svg, 520, 60, "partner's rank (1 = first choice)", { anchor: "start", size: 9.5, fill: C.faint, mono: false });
        [["who", 520], ["1st side proposes", 560], ["2nd side", 680]].forEach(function (h) { T(svg, h[1], 78, h[0], { anchor: "start", size: 9, fill: C.faint, mono: false }); });
        names.forEach(function (x, j) {
          var o = { anchor: "start", size: 10.5, fill: a[x] !== b[x] ? C.orange : C.dim, weight: a[x] !== b[x] ? 700 : 400 };
          T(svg, 524, 96 + j * 17, x, o); T(svg, 600, 96 + j * 17, String(a[x]), o); T(svg, 696, 96 + j * 17, String(b[x]), o);
        });
        T(svg, 8, 310, better.length ? "orange: people whose partner depends on which side proposes — each does best when their own side proposes" : "this instance has one stable matching: proposing changes nothing", { anchor: "start", size: 10, fill: C.faint, mono: false });
      }
    }
    K.tabs(f.controls, PRE.map(function (p) { return p.name; }), 0, function (k) { pi = k; build(); sp.reload(); });
    K.tabs(f.controls, ["first side proposes", "second side proposes"], 0, function (k) { side = k; build(); sp.reload(); });
    var sp = stepper(f, function () { return tr.length - 1; }, draw);
    build(); draw(0);
    f.say("One side proposes, the other holds the best offer so far. Step to the end, swap which side proposes, and find a participant who does strictly better.");
  };
})();
