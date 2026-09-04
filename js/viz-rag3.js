/* ==========================================================================
   viz-rag3.js — RAG In Depth machines, batch 3: chapters 10–13.

     bruteForce      ch10 Tuner      what a scan costs, from the measured table
     hnswSearch      ch11 Simulator  a real 2-D HNSW: build, descend, beam, recall
     ivfCells        ch12 Builder    Voronoi cells, nprobe, and the boundary problem
     pqCodebook      ch12 Playground quantize in pieces, and read the reconstruction
     filteredAnn     ch13 Tuner      pre, post and in-graph against selectivity
     pgvectorExplain ch13 Inspector  four plans, and the node that throws rows away

   Helpers come from js/viz-rag-kit.js, which must load first.
   ========================================================================== */

(function () {
  "use strict";
  window.VIZ = window.VIZ || {};
  var K = window.RAGKIT;
  var C = K.C, S = K.S, T = K.T, rect = K.rect, line = K.line,
      frame = K.frame, slider = K.slider, tabs = K.tabs, toggle = K.toggle, tipOn = K.tipOn;

  // One deterministic PRNG for every machine here, so a reset is reproducible.
  function rng(seed) {
    var s = seed >>> 0;
    return function () {
      s ^= s << 13; s >>>= 0; s ^= s >> 17; s ^= s << 5; s >>>= 0;
      return s / 4294967296;
    };
  }
  function dist(a, b) { return Math.hypot(a.x - b.x, a.y - b.y); }

  /* ========================================================================
     1. bruteForce — CH 10 — Tuner
     ======================================================================== */
  VIZ.bruteForce = function (el) {
    var f = frame(el);
    var svg = S("svg", { viewBox: "0 0 720 330", role: "img" }, f.body);

    // Measured on an Apple M1 laptop, 8 GB, float32, best of three over twenty
    // queries. These are the rows the chapter prints.
    var MEASURED = [
      { n: 1e4, d: 384,  ms: 0.40 }, { n: 1e5, d: 384,  ms: 4.33 },
      { n: 1e6, d: 384,  ms: 42.2 }, { n: 1e4, d: 1536, ms: 1.94 },
      { n: 1e5, d: 1536, ms: 19.3 }, { n: 5e5, d: 1536, ms: 172 }
    ];
    // Throughput fitted to those rows: ~8.5 G multiply-adds/s while the working
    // set fits, ~4.5 G once it does not. The bend is the whole point of the
    // last measured row, so it is modelled rather than smoothed away.
    var PROFILES = [
      { name: "laptop", macs: 8.5e9, slow: 4.5e9, ram: 8e9, measured: true },
      { name: "server", macs: 60e9,  slow: 34e9,  ram: 128e9, measured: false },
      { name: "GPU",    macs: 900e9, slow: 500e9, ram: 40e9,  measured: false }
    ];
    var N = 1e6, dim = 1536, prof = 0;

    function bytes(n, d) { return n * d * 4; }
    function ms(n, d, p) {
      var b = bytes(n, d);
      var rate = b > p.ram * 0.35 ? p.slow : p.macs;
      return (n * d) / rate * 1000;
    }
    function fmtBytes(b) {
      if (b >= 1e9) return (b / 1e9).toFixed(1) + " GB";
      if (b >= 1e6) return (b / 1e6).toFixed(0) + " MB";
      return (b / 1e3).toFixed(0) + " kB";
    }
    function fmtN(n) {
      if (n >= 1e6) return (n / 1e6).toFixed(n >= 1e7 ? 0 : 1).replace(/\.0$/, "") + " M";
      if (n >= 1e3) return Math.round(n / 1e3) + " k";
      return String(n);
    }

    function render() {
      svg.innerHTML = "";
      var p = PROFILES[prof];
      var t = ms(N, dim, p), b = bytes(N, dim), qps = 1000 / t;
      var fits = b < p.ram * 0.75;

      T(svg, 24, 16, "brute force: N × d multiply-adds per query, then a partial selection. Recall is exactly 1.",
        { anchor: "start", size: 10.5, fill: C.faint });

      // latency vs N, log-log
      var X0 = 60, X1 = 420, Y0 = 40, Y1 = 180;
      function px(n) { return X0 + (Math.log10(n) - 3) / (8 - 3) * (X1 - X0); }
      function py(v) { return Y1 - (Math.log10(Math.max(0.05, v)) + 1.3) / (4.3 + 1.3) * (Y1 - Y0); }
      rect(svg, X0, Y0, X1 - X0, Y1 - Y0, { fill: "none", stroke: C.line, rx: 4 });

      // the 100 ms p95 line the blueprint asks for
      line(svg, X0, py(100), X1, py(100), { stroke: C.pink, sw: 1.5, dash: "4 4" });
      T(svg, X1 - 4, py(100) - 6, "100 ms", { anchor: "end", size: 9, fill: C.pink });

      var d = "";
      for (var i = 0; i <= 50; i++) {
        var n = Math.pow(10, 3 + (8 - 3) * i / 50);
        d += (i ? " L " : "M ") + px(n).toFixed(1) + " " + py(ms(n, dim, p)).toFixed(1);
      }
      S("path", { d: d, fill: "none", stroke: C.blue, "stroke-width": 2.5 }, svg);

      // the measured points for this dimension, on the laptop profile only
      if (prof === 0) {
        MEASURED.filter(function (m) { return m.d === dim; }).forEach(function (m) {
          S("circle", { cx: px(m.n), cy: py(m.ms), r: 4, fill: C.orange }, svg);
        });
        T(svg, X0 + 6, Y0 + 12, "orange = measured on the M1", { anchor: "start", size: 8.5, fill: C.orange });
      } else {
        T(svg, X0 + 6, Y0 + 12, "estimated: only the laptop row is measured", { anchor: "start", size: 8.5, fill: C.faint });
      }
      S("circle", { cx: px(N), cy: py(t), r: 5.5, fill: fits ? C.green : C.pink }, svg);
      [1e3, 1e5, 1e6, 1e8].forEach(function (n) {
        T(svg, px(n), Y1 + 14, fmtN(n), { size: 9, fill: C.faint });
      });
      T(svg, (X0 + X1) / 2, Y1 + 30, "N vectors", { size: 9.5, fill: C.faint });
      [0.1, 1, 10, 100, 1000].forEach(function (v) {
        if (py(v) > Y0 && py(v) < Y1) T(svg, X0 - 8, py(v), v + "", { anchor: "end", size: 8.5, fill: C.faint });
      });

      // readout
      var rx = 448;
      T(svg, rx, 44, fmtN(N) + " × " + dim + "d, float32", { anchor: "start", size: 12.5, fill: C.text, weight: 700 });
      var rows = [
        ["memory for the vectors", fmtBytes(b), fits ? C.text : C.pink],
        ["scan time per query", t < 1 ? t.toFixed(2) + " ms" : t.toFixed(t < 10 ? 1 : 0) + " ms",
          t > 100 ? C.pink : C.text],
        ["queries per second", qps > 10 ? Math.round(qps) : qps.toFixed(1), C.text],
        ["recall", "1.000 — it cannot miss", C.green]
      ];
      rows.forEach(function (r, i) {
        T(svg, rx, 70 + i * 22, r[0], { anchor: "start", size: 10, fill: C.faint });
        T(svg, rx + 244, 70 + i * 22, r[1], { anchor: "end", size: 11, fill: r[2], weight: 700 });
      });

      rect(svg, rx, 166, 244, 62, { fill: C.panel, stroke: fits ? C.line : C.pink, sw: fits ? 1 : 2 });
      if (!fits) {
        T(svg, rx + 12, 188, "the vectors do not fit in " + fmtBytes(p.ram),
          { anchor: "start", size: 10, fill: C.pink, weight: 700 });
        T(svg, rx + 12, 206, "the scan becomes memory-bandwidth bound", { anchor: "start", size: 9, fill: C.dim });
        T(svg, rx + 12, 220, "and the linear curve bends upward", { anchor: "start", size: 9, fill: C.dim });
      } else {
        T(svg, rx + 12, 188, "the working set fits: the scan is arithmetic bound",
          { anchor: "start", size: 9.5, fill: C.dim });
        T(svg, rx + 12, 206, "cost is linear in N and linear in d, with no", { anchor: "start", size: 9, fill: C.dim });
        T(svg, rx + 12, 220, "algorithmic surprise hiding anywhere in it", { anchor: "start", size: 9, fill: C.dim });
      }

      // the halving demonstration the chapter asks for
      var halfB = bytes(N, dim / 2), halfT = ms(N, dim / 2, p);
      rect(svg, 24, 250, 672, 62, { fill: C.panel, stroke: C.line });
      T(svg, 40, 272, "halve d to " + Math.round(dim / 2) + ":",
        { anchor: "start", size: 11, fill: C.text, weight: 700 });
      T(svg, 168, 272, fmtBytes(b) + " → " + fmtBytes(halfB) + "   ·   " +
        t.toFixed(1) + " ms → " + halfT.toFixed(1) + " ms",
        { anchor: "start", size: 11, fill: C.blue });
      T(svg, 40, 294, "both halve, because both are linear in d. That is the whole of Chapter 7's truncation argument, priced.",
        { anchor: "start", size: 9.5, fill: C.dim });

      f.say(N >= 1e6 && dim >= 1536
        ? "A million 1,536-dimensional float32 vectors need " + fmtBytes(b) +
          ". The chapter could not measure this row on an 8 GB laptop, and that absence is the lesson."
        : t > 100
        ? "Past 100 ms a scan is no longer a request handler. This is where Chapter 11's graph earns its complexity."
        : "At this size the scan is cheap and exact, and an approximate index would be buying nothing.");
    }

    function controls() {
      f.controls.innerHTML = "";
      slider(f.controls, "N", 3, 8, Math.log10(N), 0.1,
        function (v) { return fmtN(Math.pow(10, v)); },
        function (v) { N = Math.pow(10, v); render(); });
      slider(f.controls, "d", 64, 3072, dim, 64, String, function (v) { dim = v; render(); });
      tabs(f.controls, PROFILES.map(function (p) { return p.name; }), prof, function (i) {
        prof = i; controls(); render();
      });
      f.btn("reset", function () { N = 1e6; dim = 1536; prof = 0; controls(); render(); });
    }
    controls(); render();
    f.say("Set N to one million and d to 1536. Read the memory bar.");
  };

  /* ========================================================================
     2. hnswSearch — CH 11 — Simulator
     A real HNSW over 2-D points: levels, heuristic neighbour selection,
     greedy descent, and a layer-0 beam of width ef. Recall is measured
     against an exact scan of the same points, so it is the real recall.
     ======================================================================== */
  VIZ.hnswSearch = function (el) {
    var f = frame(el);
    var svg = S("svg", { viewBox: "0 0 720 400", role: "img" }, f.body);

    // M = 4 over clustered points, because in two dimensions a denser graph
    // never loses recall: greedy search only gets trapped when the graph is
    // sparse and the data has structure. The recall loss the chapter measures
    // is a high-dimensional effect, and this is the closest honest 2-D analogue.
    var M = 4, efC = 32, efS = 10, KNN = 10;
    var nodes, entry, maxLevel, query, trace, rand, prand;

    function reset(seed) {
      // Two independent streams: one for levels, one for positions. Sharing a
      // single stream made the point set depend on how many levels had been
      // drawn, which is not reproducible from the point count alone.
      rand = rng(seed || 7);
      prand = rng(seed || 7);
      nodes = []; entry = null; maxLevel = 0; centres = null;
      // this query misses exactly one of the true top ten at ef = 10 and finds
      // all ten at ef = 40, which is the discovery the chapter asks for
      query = { x: 0.191, y: 0.433 };
      trace = null;
    }
    function levelFor() {
      var mL = 1 / Math.log(M);
      return Math.floor(-Math.log(rand() || 1e-9) * mL);
    }
    // Chapter 11's heuristic: keep a candidate only if it is closer to the new
    // node than to any neighbour already kept. That is what stops every node
    // linking into one dense clump and leaves long-range edges intact.
    function selectNeighbours(cands, m, of) {
      var picked = [];
      cands.sort(function (a, b) { return dist(of, a) - dist(of, b); });
      for (var i = 0; i < cands.length && picked.length < m; i++) {
        var c = cands[i], good = true;
        for (var j = 0; j < picked.length; j++)
          if (dist(c, picked[j]) < dist(c, of)) { good = false; break; }
        if (good) picked.push(c);
      }
      // top up if the heuristic was too strict to fill m
      for (var k2 = 0; k2 < cands.length && picked.length < m; k2++)
        if (picked.indexOf(cands[k2]) < 0) picked.push(cands[k2]);
      return picked;
    }
    function searchLayer(q, entries, ef, lc, counter) {
      var visited = {}, cand = [], res = [];
      entries.forEach(function (e) {
        visited[e.id] = 1; counter.n++;
        var d = dist(q, e); cand.push({ n: e, d: d }); res.push({ n: e, d: d });
      });
      while (cand.length) {
        cand.sort(function (a, b) { return a.d - b.d; });
        var c = cand.shift();
        res.sort(function (a, b) { return a.d - b.d; });
        if (res.length >= ef && c.d > res[res.length - 1].d) break;
        (c.n.edges[lc] || []).forEach(function (nb) {
          if (visited[nb.id]) return;
          visited[nb.id] = 1; counter.n++;
          var d = dist(q, nb);
          res.sort(function (a, b) { return a.d - b.d; });
          if (res.length < ef || d < res[res.length - 1].d) {
            cand.push({ n: nb, d: d }); res.push({ n: nb, d: d });
            res.sort(function (a, b) { return a.d - b.d; });
            if (res.length > ef) res.pop();
          }
        });
      }
      res.sort(function (a, b) { return a.d - b.d; });
      return { res: res.slice(0, ef), order: Object.keys(visited) };
    }
    function insert(pt) {
      var lvl = levelFor();
      var node = { id: nodes.length, x: pt.x, y: pt.y, level: lvl, edges: {} };
      for (var l = 0; l <= lvl; l++) node.edges[l] = [];
      if (!entry) { nodes.push(node); entry = node; maxLevel = lvl; return; }
      var counter = { n: 0 }, ep = [entry];
      for (var lc = maxLevel; lc > lvl; lc--)
        ep = [searchLayer(node, ep, 1, lc, counter).res[0].n];
      for (var lc2 = Math.min(maxLevel, lvl); lc2 >= 0; lc2--) {
        var found = searchLayer(node, ep, efC, lc2, counter).res.map(function (r) { return r.n; });
        var nbrs = selectNeighbours(found.slice(), M, node);
        node.edges[lc2] = nbrs.slice();
        nbrs.forEach(function (nb) {
          nb.edges[lc2] = nb.edges[lc2] || [];
          nb.edges[lc2].push(node);
          if (nb.edges[lc2].length > M)
            nb.edges[lc2] = selectNeighbours(nb.edges[lc2].slice(), M, nb);
        });
        ep = found;
      }
      nodes.push(node);
      if (lvl > maxLevel) { maxLevel = lvl; entry = node; }
    }
    var centres = null;
    function addPoints(k) {
      if (!centres) {
        centres = [];
        for (var c = 0; c < 12; c++) centres.push({ x: 0.12 + prand() * 0.76, y: 0.12 + prand() * 0.76 });
      }
      for (var i = 0; i < k; i++) {
        var cc = centres[nodes.length % centres.length];
        insert({ x: Math.max(0.02, Math.min(0.98, cc.x + (prand() - 0.5) * 0.14)),
                 y: Math.max(0.02, Math.min(0.98, cc.y + (prand() - 0.5) * 0.14)) });
      }
      trace = null;
    }
    function bruteTop(k) {
      return nodes.map(function (n) { return { n: n, d: dist(query, n) }; })
        .sort(function (a, b) { return a.d - b.d; }).slice(0, k);
    }
    function runSearch() {
      if (!entry) return;
      var counter = { n: 0 }, ep = [entry], path = [];
      for (var lc = maxLevel; lc > 0; lc--) {
        var r = searchLayer(query, ep, 1, lc, counter);
        path.push({ layer: lc, visited: r.order.length });
        ep = [r.res[0].n];
      }
      var r0 = searchLayer(query, ep, Math.max(efS, KNN), 0, counter);
      path.push({ layer: 0, visited: r0.order.length });
      var got = r0.res.slice(0, KNN).map(function (x) { return x.n.id; });
      var truth = bruteTop(KNN).map(function (x) { return x.n.id; });
      var hit = got.filter(function (id) { return truth.indexOf(id) >= 0; }).length;
      trace = { path: path, comps: counter.n, got: got, truth: truth,
                recall: truth.length ? hit / truth.length : 0,
                visited0: r0.order.map(Number) };
    }

    function render() {
      svg.innerHTML = "";
      var PW = 300, PH = 104, PX = 30;
      var layers = Math.min(2, maxLevel);
      T(svg, 24, 15, nodes.length + " points · M = " + M + " · ef_construction = " + efC +
        " · ef_search = " + efS + " · " + (maxLevel + 1) + " layers",
        { anchor: "start", size: 10.5, fill: C.dim });

      // stacked planes, highest layer at the top
      for (var li = layers; li >= 0; li--) {
        var top = 26 + (layers - li) * (PH + 12);
        rect(svg, PX, top, PW, PH, { fill: "none", stroke: C.line, rx: 6 });
        T(svg, PX + 6, top + 11, li === layers && maxLevel > layers ? "layer " + li + " and above" : "layer " + li,
          { anchor: "start", size: 9, fill: C.faint });
        var inLayer = nodes.filter(function (n) { return n.level >= li; });
        T(svg, PX + PW - 6, top + 11, inLayer.length + " nodes", { anchor: "end", size: 9, fill: C.faint });
        (function (li, top) {
          function nx(n) { return PX + 10 + n.x * (PW - 20); }
          function ny(n) { return top + 16 + n.y * (PH - 26); }
          // edges first, faintly
          inLayer.forEach(function (n) {
            (n.edges[li] || []).forEach(function (nb) {
              if (nb.id > n.id) line(svg, nx(n), ny(n), nx(nb), ny(nb), { stroke: C.line, sw: 0.6 });
            });
          });
          var vis = trace ? trace.visited0 : [];
          inLayer.forEach(function (n) {
            var isTruth = trace && trace.truth.indexOf(n.id) >= 0;
            var isGot = trace && trace.got.indexOf(n.id) >= 0;
            var seen = li === 0 && vis.indexOf(n.id) >= 0;
            var col = isGot ? C.green : isTruth ? C.pink : seen ? C.blue : C.faint;
            S("circle", { cx: nx(n), cy: ny(n), r: isTruth || isGot ? 4 : 2.4,
              fill: col, opacity: seen || isTruth || isGot ? 1 : 0.75 }, svg);
          });
          if (n_entry() && n_entry().level >= li)
            S("circle", { cx: nx(n_entry()), cy: ny(n_entry()), r: 5,
              fill: "none", stroke: C.orange, "stroke-width": 2 }, svg);
          // the query
          var qx = PX + 10 + query.x * (PW - 20), qy = top + 16 + query.y * (PH - 26);
          S("path", { d: "M " + (qx - 5) + " " + qy + " L " + qx + " " + (qy - 5) +
            " L " + (qx + 5) + " " + qy + " L " + qx + " " + (qy + 5) + " z",
            fill: C.orange }, svg);
        })(li, top);
      }
      function n_entry() { return entry; }

      // readout
      var rx = 360;
      if (!trace) {
        T(svg, rx, 46, "press run search", { anchor: "start", size: 12, fill: C.faint });
        T(svg, rx, 68, "click anywhere in a plane to move the query", { anchor: "start", size: 9.5, fill: C.faint });
      } else {
        T(svg, rx, 44, "search", { anchor: "start", size: 12, fill: C.text, weight: 700 });
        trace.path.forEach(function (p, i) {
          T(svg, rx, 66 + i * 16, "layer " + p.layer + (p.layer ? "  greedy descent" : "  beam, ef = " + efS) +
            "   " + p.visited + " nodes", { anchor: "start", size: 9.5, fill: C.dim });
        });
        var y = 70 + trace.path.length * 16;
        var good = trace.recall >= 1;
        rect(svg, rx, y, 330, 96, { fill: C.panel, stroke: good ? C.green : C.pink, sw: 2 });
        T(svg, rx + 14, y + 24, "recall@10", { anchor: "start", size: 10.5, fill: C.faint });
        T(svg, rx + 120, y + 24, trace.recall.toFixed(3),
          { anchor: "start", size: 15, fill: good ? C.green : C.pink, weight: 700 });
        T(svg, rx + 14, y + 46, "distance computations", { anchor: "start", size: 10.5, fill: C.faint });
        T(svg, rx + 160, y + 46, String(trace.comps), { anchor: "start", size: 12, fill: C.blue, weight: 700 });
        T(svg, rx + 14, y + 66, "an exact scan would cost " + nodes.length,
          { anchor: "start", size: 9, fill: C.faint });
        var missed = trace.truth.filter(function (id) { return trace.got.indexOf(id) < 0; });
        T(svg, rx + 14, y + 84, missed.length
          ? "missed " + missed.length + " of the true top 10 (pink)"
          : "found every one of the true top 10",
          { anchor: "start", size: 10, fill: good ? C.green : C.pink, weight: 700 });
      }
      T(svg, rx, 350, "two dimensions, so ef buys less here than the chapter's",
        { anchor: "start", size: 8.5, fill: C.faint });
      T(svg, rx, 362, "high-dimensional run: the shape holds, the ratio is smaller.",
        { anchor: "start", size: 8.5, fill: C.faint });
      T(svg, rx, 380, "orange ring = entry point · diamond = query",
        { anchor: "start", size: 8.5, fill: C.faint });
      T(svg, rx, 392, "green = returned · pink = a true neighbour missed",
        { anchor: "start", size: 8.5, fill: C.faint });

      if (!trace) f.say("Click insert 50, then run search. Read the recall. Now raise ef.");
      else if (trace.recall >= 1)
        f.say("Every true neighbour found, for " + trace.comps + " distance computations against " +
          nodes.length + " for an exact scan. Lower ef until one goes missing.");
      else
        f.say("ef = " + efS + " missed " + Math.round((1 - trace.recall) * KNN) +
          " of the true top ten. The beam was too narrow to hold the node that bridges to that region. Raise ef and run again.");
    }

    // click a plane to move the query
    svg.addEventListener("click", function (ev) {
      var pt = svg.getBoundingClientRect();
      var vx = (ev.clientX - pt.left) / pt.width * 720;
      var vy = (ev.clientY - pt.top) / pt.height * 400;
      if (vx < 30 || vx > 330) return;
      var PH = 104, layers = Math.min(2, maxLevel);
      for (var li = layers; li >= 0; li--) {
        var top = 26 + (layers - li) * (PH + 12);
        if (vy >= top && vy <= top + PH) {
          query = { x: Math.max(0, Math.min(1, (vx - 40) / 280)),
                    y: Math.max(0, Math.min(1, (vy - top - 16) / (PH - 26))) };
          runSearch(); render(); return;
        }
      }
    });

    function controls() {
      f.controls.innerHTML = "";
      f.btn("insert 100", function () { addPoints(100); render(); });
      f.btn("run search", function () { runSearch(); render(); });
      slider(f.controls, "ef_search", 10, 80, efS, 2, String, function (v) {
        efS = v; if (trace) runSearch(); render();
      });
      slider(f.controls, "M", 4, 16, M, 2, String, function (v) {
        var n = nodes.length || 400; M = v; reset(7); addPoints(n); render();
      });
      f.btn("reset", function () { M = 4; efC = 32; efS = 10; reset(7); addPoints(400); runSearch(); controls(); render(); });
    }
    reset(7); addPoints(400); runSearch(); controls(); render();
    f.say("Click run search. Read the recall. Now raise ef_search and run it again.");
  };

  /* ========================================================================
     3. ivfCells — CH 12 — Builder
     ======================================================================== */
  VIZ.ivfCells = function (el) {
    var f = frame(el);
    var svg = S("svg", { viewBox: "0 0 720 350", role: "img" }, f.body);

    var nlist = 8, nprobe = 1, KNN = 10;
    var pts, cents, assign, query, rand;

    function init(seed) {
      rand = rng(seed || 11);
      // clustered data, because that is what an IVF assumes
      pts = [];
      var centres = [];
      for (var c = 0; c < 6; c++) centres.push({ x: 0.15 + rand() * 0.7, y: 0.15 + rand() * 0.7 });
      for (var i = 0; i < 260; i++) {
        var cc = centres[i % centres.length];
        pts.push({ x: Math.max(0.02, Math.min(0.98, cc.x + (rand() - 0.5) * 0.28)),
                   y: Math.max(0.02, Math.min(0.98, cc.y + (rand() - 0.5) * 0.28)), id: i });
      }
      query = { x: 0.5, y: 0.5 };
      train();
    }
    function train() {
      // k-means, a few rounds, deterministic start
      cents = [];
      for (var i = 0; i < nlist; i++) cents.push({ x: pts[i * 7 % pts.length].x, y: pts[i * 7 % pts.length].y });
      for (var it = 0; it < 12; it++) {
        assign = pts.map(function (p) {
          var best = 0, bd = Infinity;
          cents.forEach(function (c, ci) { var d = dist(p, c); if (d < bd) { bd = d; best = ci; } });
          return best;
        });
        var sx = [], sy = [], n = [];
        for (var j = 0; j < nlist; j++) { sx[j] = sy[j] = n[j] = 0; }
        pts.forEach(function (p, pi) { sx[assign[pi]] += p.x; sy[assign[pi]] += p.y; n[assign[pi]]++; });
        for (var k2 = 0; k2 < nlist; k2++) if (n[k2]) { cents[k2] = { x: sx[k2] / n[k2], y: sy[k2] / n[k2] }; }
      }
    }
    function probed() {
      return cents.map(function (c, i) { return { i: i, d: dist(query, c) }; })
        .sort(function (a, b) { return a.d - b.d; }).slice(0, nprobe).map(function (o) { return o.i; });
    }
    function result() {
      var cells = probed();
      var scanned = pts.filter(function (p, pi) { return cells.indexOf(assign[pi]) >= 0; });
      var found = scanned.map(function (p) { return { p: p, d: dist(query, p) }; })
        .sort(function (a, b) { return a.d - b.d; }).slice(0, KNN).map(function (o) { return o.p.id; });
      var truth = pts.map(function (p) { return { p: p, d: dist(query, p) }; })
        .sort(function (a, b) { return a.d - b.d; }).slice(0, KNN).map(function (o) { return o.p.id; });
      var hit = found.filter(function (id) { return truth.indexOf(id) >= 0; }).length;
      return { cells: cells, scanned: scanned.length, found: found, truth: truth,
               recall: hit / KNN };
    }

    function render() {
      svg.innerHTML = "";
      var PX = 24, PY = 30, PW = 320, PH = 300;
      function nx(p) { return PX + p.x * PW; }
      function ny(p) { return PY + p.y * PH; }
      var r = result();

      T(svg, 24, 16, "nlist = " + nlist + " cells · nprobe = " + nprobe +
        " · click anywhere to move the query", { anchor: "start", size: 10.5, fill: C.dim });
      rect(svg, PX, PY, PW, PH, { fill: "none", stroke: C.line, rx: 6 });

      // cell shading by nearest-centroid, drawn as a coarse raster so the
      // Voronoi boundaries are visible without computing the polygons
      var STEP = 8;
      for (var gx = 0; gx < PW; gx += STEP) {
        for (var gy = 0; gy < PH; gy += STEP) {
          var p = { x: (gx + STEP / 2) / PW, y: (gy + STEP / 2) / PH };
          var best = 0, bd = Infinity;
          cents.forEach(function (c, ci) { var d = dist(p, c); if (d < bd) { bd = d; best = ci; } });
          if (r.cells.indexOf(best) >= 0)
            rect(svg, PX + gx, PY + gy, STEP, STEP, { fill: C.blue, stroke: "none", rx: 0, op: 0.13 });
        }
      }
      pts.forEach(function (p, pi) {
        var inCell = r.cells.indexOf(assign[pi]) >= 0;
        var isTruth = r.truth.indexOf(p.id) >= 0, isFound = r.found.indexOf(p.id) >= 0;
        S("circle", { cx: nx(p), cy: ny(p), r: isTruth || isFound ? 4 : 2,
          fill: isFound ? C.green : isTruth ? C.pink : inCell ? C.blue : C.faint,
          opacity: inCell || isTruth ? 1 : 0.4 }, svg);
      });
      cents.forEach(function (c, ci) {
        var on = r.cells.indexOf(ci) >= 0;
        S("path", { d: "M " + (nx(c) - 5) + " " + (ny(c) + 4) + " L " + nx(c) + " " + (ny(c) - 5) +
          " L " + (nx(c) + 5) + " " + (ny(c) + 4) + " z",
          fill: "none", stroke: on ? C.orange : C.faint, "stroke-width": on ? 2 : 1 }, svg);
      });
      var qx = nx(query), qy = ny(query);
      S("circle", { cx: qx, cy: qy, r: 6, fill: "none", stroke: C.orange, "stroke-width": 2.5 }, svg);
      line(svg, qx - 9, qy, qx + 9, qy, { stroke: C.orange, sw: 1.5 });
      line(svg, qx, qy - 9, qx, qy + 9, { stroke: C.orange, sw: 1.5 });

      var rx = 372;
      T(svg, rx, 44, "this query", { anchor: "start", size: 12, fill: C.text, weight: 700 });
      var good = r.recall >= 1;
      rect(svg, rx, 56, 324, 108, { fill: C.panel, stroke: good ? C.green : C.pink, sw: 2 });
      T(svg, rx + 14, 80, "recall@10", { anchor: "start", size: 10.5, fill: C.faint });
      T(svg, rx + 110, 80, r.recall.toFixed(3), { anchor: "start", size: 15,
        fill: good ? C.green : C.pink, weight: 700 });
      T(svg, rx + 14, 106, "vectors scanned", { anchor: "start", size: 10.5, fill: C.faint });
      T(svg, rx + 130, 106, r.scanned + " of " + pts.length +
        "  (" + (r.scanned / pts.length * 100).toFixed(1) + "%)",
        { anchor: "start", size: 11, fill: C.blue, weight: 700 });
      T(svg, rx + 14, 132, good ? "every true neighbour was inside a probed cell"
                                : "a true neighbour sits in a cell you did not probe",
        { anchor: "start", size: 10, fill: good ? C.green : C.pink, weight: 700 });
      T(svg, rx + 14, 150, good ? "" : "pink points are the ones the boundary hid",
        { anchor: "start", size: 9, fill: C.dim });

      // the measured table from the chapter
      T(svg, rx, 190, "measured — 20,000 unit vectors, 128d, 40 clusters", { anchor: "start", size: 9.5,
        fill: C.faint, weight: 700 });
      var TAB = [
        ["nlist 64", "nprobe 1", "0.798", "2.2%"], ["", "nprobe 2", "0.968", "3.6%"],
        ["", "nprobe 4", "0.995", "6.7%"], ["nlist 256", "nprobe 1", "0.288", "0.4%"],
        ["", "nprobe 4", "0.835", "1.8%"], ["", "nprobe 16", "1.000", "6.4%"]
      ];
      TAB.forEach(function (row, i) {
        var y = 208 + i * 15;
        T(svg, rx, y, row[0], { anchor: "start", size: 9, fill: C.dim });
        T(svg, rx + 66, y, row[1], { anchor: "start", size: 9, fill: C.dim });
        T(svg, rx + 160, y, row[2], { anchor: "end", size: 9, fill: C.text });
        T(svg, rx + 214, y, row[3], { anchor: "end", size: 9, fill: C.faint });
      });
      T(svg, rx, 312, "at nlist 64, nprobe 1, one in five of the true top ten", { anchor: "start", size: 9, fill: C.dim });
      T(svg, rx, 326, "was in a neighbouring cell. That is the boundary problem.", { anchor: "start", size: 9, fill: C.dim });

      f.say(good
        ? "Every true neighbour was inside a probed cell. Move the query onto a cell edge and drop nprobe to 1."
        : "A true neighbour is in a cell you did not probe, so no amount of exactness inside the probed cells can reach it. Raise nprobe to " + (nprobe + 1) + ".");
    }

    svg.addEventListener("click", function (ev) {
      var b = svg.getBoundingClientRect();
      var vx = (ev.clientX - b.left) / b.width * 720, vy = (ev.clientY - b.top) / b.height * 350;
      if (vx < 24 || vx > 344 || vy < 30 || vy > 330) return;
      query = { x: (vx - 24) / 320, y: (vy - 30) / 300 };
      render();
    });

    function controls() {
      f.controls.innerHTML = "";
      slider(f.controls, "nlist", 4, 24, nlist, 1, String, function (v) { nlist = v; train(); render(); });
      slider(f.controls, "nprobe", 1, 8, nprobe, 1, String, function (v) { nprobe = v; render(); });
      // Hunting for a boundary query by hand works, but it depends on luck.
      // This walks the plot and stops on a query the current nprobe misses.
      f.btn("find a boundary query", function () {
        var save = query, best = null;
        for (var i = 1; i < 20 && !best; i++) {
          for (var j = 1; j < 20 && !best; j++) {
            query = { x: i / 20, y: j / 20 };
            if (result().recall < 1) best = query;
          }
        }
        query = best || save;
        render();
        if (!best) f.say("No query at this nprobe misses anything. Lower nprobe, or raise nlist to make the cells smaller.");
      });
      f.btn("reset", function () { nlist = 8; nprobe = 1; init(11); controls(); render(); });
    }
    init(11); controls(); render();
    f.say("Train with 8 cells. Click just inside a cell edge. Then raise nprobe.");
  };

  /* ========================================================================
     4. pqCodebook — CH 12 — Playground
     ======================================================================== */
  VIZ.pqCodebook = function (el) {
    var f = frame(el);
    var svg = S("svg", { viewBox: "0 0 720 340", role: "img" }, f.body);

    var D = 16, m = 4, kBits = 8, pick = 0;
    var vecs, books, rand;

    function init() {
      rand = rng(29);
      vecs = [];
      for (var i = 0; i < 48; i++) {
        var v = [];
        for (var j = 0; j < D; j++) v.push(Math.round((rand() * 2 - 1) * 100) / 100);
        vecs.push(v);
      }
      trainBooks();
    }
    function trainBooks() {
      // one k-means per sub-space, k = 2^kBits (capped so the toy stays quick)
      var sub = D / m, k = Math.min(Math.pow(2, kBits), 16);
      books = [];
      for (var s = 0; s < m; s++) {
        var slice = vecs.map(function (v) { return v.slice(s * sub, (s + 1) * sub); });
        var cs = [];
        for (var i = 0; i < k; i++) cs.push(slice[(i * 5) % slice.length].slice());
        for (var it = 0; it < 10; it++) {
          var sums = cs.map(function () { return new Array(sub).fill(0); }), n = cs.map(function () { return 0; });
          slice.forEach(function (x) {
            var b = 0, bd = Infinity;
            cs.forEach(function (c, ci) {
              var d = 0; for (var q = 0; q < sub; q++) d += Math.pow(x[q] - c[q], 2);
              if (d < bd) { bd = d; b = ci; }
            });
            for (var q2 = 0; q2 < sub; q2++) sums[b][q2] += x[q2];
            n[b]++;
          });
          cs = cs.map(function (c, ci) {
            return n[ci] ? sums[ci].map(function (t) { return t / n[ci]; }) : c;
          });
        }
        books.push(cs);
      }
    }
    function encode(v) {
      var sub = D / m, codes = [];
      for (var s = 0; s < m; s++) {
        var x = v.slice(s * sub, (s + 1) * sub), b = 0, bd = Infinity;
        books[s].forEach(function (c, ci) {
          var d = 0; for (var q = 0; q < sub; q++) d += Math.pow(x[q] - c[q], 2);
          if (d < bd) { bd = d; b = ci; }
        });
        codes.push(b);
      }
      return codes;
    }
    function decode(codes) {
      var out = [];
      codes.forEach(function (c, s) { out = out.concat(books[s][c]); });
      return out;
    }
    function rankShift() {
      // how far the PQ ranking of the whole set moves against the exact one
      var q = vecs[0];
      function d2(a, b) { var s = 0; for (var i = 0; i < D; i++) s += Math.pow(a[i] - b[i], 2); return s; }
      var exact = vecs.map(function (v, i) { return { i: i, d: d2(q, v) }; })
        .sort(function (a, b) { return a.d - b.d; }).slice(0, 10).map(function (o) { return o.i; });
      var approx = vecs.map(function (v, i) { return { i: i, d: d2(q, decode(encode(v))) }; })
        .sort(function (a, b) { return a.d - b.d; }).slice(0, 10).map(function (o) { return o.i; });
      var hit = approx.filter(function (i) { return exact.indexOf(i) >= 0; }).length;
      return hit / 10;
    }

    function render() {
      svg.innerHTML = "";
      var v = vecs[pick], codes = encode(v), rec = decode(codes);
      var sub = D / m, k = Math.min(Math.pow(2, kBits), 16);
      var before = D * 4, after = m;

      T(svg, 24, 16, D + "-dimensional vectors · m = " + m + " sub-vectors of " + sub +
        " dims · " + k + " centroids per sub-space", { anchor: "start", size: 10.5, fill: C.dim });

      // the original and the reconstruction, dimension by dimension
      var X0 = 30, W = 640, cw = W / D;
      ["original", "reconstruction"].forEach(function (label, row) {
        var y = 46 + row * 78;
        T(svg, X0, y - 8, label, { anchor: "start", size: 10, fill: C.faint, weight: 700 });
        var vals = row ? rec : v;
        for (var i = 0; i < D; i++) {
          var h = Math.abs(vals[i]) * 26;
          var mid = y + 32;
          rect(svg, X0 + i * cw + 2, vals[i] >= 0 ? mid - h : mid, cw - 4, h, {
            fill: row ? C.orange : C.blue, stroke: "none", rx: 1
          });
          if (row === 0) line(svg, X0 + i * cw + 2, mid, X0 + i * cw + cw - 2, mid, { stroke: C.line, sw: 0.6 });
        }
        // sub-vector boundaries
        for (var s = 1; s < m; s++)
          line(svg, X0 + s * sub * cw, y - 2, X0 + s * sub * cw, y + 64, { stroke: C.faint, sw: 1, dash: "3 3" });
      });

      // the codes
      T(svg, X0, 214, "codes", { anchor: "start", size: 10, fill: C.faint, weight: 700 });
      codes.forEach(function (c, s) {
        var x = X0 + s * sub * cw, w = sub * cw;
        rect(svg, x + 2, 222, w - 4, 24, { fill: "var(--tint-primary)", stroke: C.blue, sw: 1.5 });
        T(svg, x + w / 2, 234, "byte " + c, { size: 10.5, fill: C.text, weight: 700 });
      });

      var err = 0;
      for (var i = 0; i < D; i++) err += Math.pow(v[i] - rec[i], 2);
      err = Math.sqrt(err);
      var r10 = rankShift();

      rect(svg, 24, 262, 672, 66, { fill: C.panel, stroke: r10 >= 0.8 ? C.green : C.pink, sw: 2 });
      T(svg, 40, 284, before + " bytes → " + after + " bytes",
        { anchor: "start", size: 13, fill: C.text, weight: 700 });
      T(svg, 200, 284, (before / after).toFixed(0) + "× smaller",
        { anchor: "start", size: 11, fill: C.blue, weight: 700 });
      T(svg, 320, 284, "reconstruction error " + err.toFixed(3),
        { anchor: "start", size: 10.5, fill: C.dim });
      T(svg, 520, 284, "recall@10 " + r10.toFixed(2),
        { anchor: "start", size: 11, fill: r10 >= 0.8 ? C.green : C.pink, weight: 700 });
      T(svg, 40, 308, m === 2
        ? "m = 2: eight dimensions share one byte, so the reconstruction barely resembles the original and the ranking breaks."
        : "the reconstruction is visibly not the original, and the ranking is almost unchanged. That gap is the whole trick.",
        { anchor: "start", size: 9.5, fill: C.dim });

      f.say(m === 2
        ? "m = 2 wrecks it: too much of the vector is being represented by too few centroids, and recall@10 falls with it."
        : m === 4
        ? "m = 4 turns " + before + " bytes into " + after + ", and the ranking over the set is nearly intact. Now try m = 2."
        : "m = " + m + ": " + (before / after).toFixed(0) + "× smaller, recall@10 " + r10.toFixed(2) + ".");
    }

    function controls() {
      f.controls.innerHTML = "";
      tabs(f.controls, ["m=2", "m=4", "m=8"], [2, 4, 8].indexOf(m), function (i) {
        m = [2, 4, 8][i]; trainBooks(); controls(); render();
      });
      slider(f.controls, "vector", 0, 47, pick, 1, String, function (v) { pick = v; render(); });
      f.btn("reset", function () { m = 4; pick = 0; trainBooks(); controls(); render(); });
    }
    init(); controls(); render();
    f.say("Choose m = 4. Compare the reconstruction to the original, then switch to m = 2.");
  };

  /* ========================================================================
     5. filteredAnn — CH 13 — Tuner
     ======================================================================== */
  VIZ.filteredAnn = function (el) {
    var f = frame(el);
    var svg = S("svg", { viewBox: "0 0 720 320", role: "img" }, f.body);

    var N = 5000, KNN = 10;
    var sel = 20, strat = 1;                   // percent, and post-filter default
    var STRATS = ["pre-filter", "post-filter", "filtered HNSW", "iterative"];
    // Measured points from the chapter, at L = 200 (and L = 1000 at 1%).
    var MEASURED = {
      20: { postRecall: 0.978, postComps: 357, preComps: 980,  postReturned: 10 },
      5:  { postRecall: 0.890, postComps: 357, preComps: 257,  postReturned: 10 },
      1:  { postRecall: 0.755, postComps: 2017, preComps: 41,  postReturned: 7.6 }
    };

    function matching(s) { return Math.max(1, Math.round(N * s / 100)); }
    function model(s) {
      var mm = matching(s);
      // interpolate the measured post-filter curve; it falls off as selectivity
      // tightens because the index chose candidates without knowing the predicate
      var pr = s >= 20 ? 0.978 : s >= 5 ? 0.890 + (s - 5) / 15 * 0.088
             : s >= 1 ? 0.755 + (s - 1) / 4 * 0.135 : Math.max(0.15, 0.755 * s);
      var returned = s >= 5 ? KNN : Math.max(1, Math.min(KNN, 7.6 + (s - 1) / 4 * 2.4));
      var postComps = s >= 5 ? 357 : 357 + (5 - s) / 4 * 1660;
      return {
        pre:  { recall: 1.0, comps: mm, returned: KNN },
        post: { recall: pr, comps: Math.round(postComps), returned: returned },
        // in-graph keeps the graph but only admits matches: recall stays high,
        // cost grows because more of the graph must be walked to fill k
        graph: { recall: Math.min(1, 0.985 + s / 2000), comps: Math.round(357 + (100 - s) * 4.2), returned: KNN },
        iter: { recall: Math.min(1, 0.97 + s / 3000), comps: Math.round(357 + (100 - s) * 6.4), returned: KNN }
      };
    }
    function pickOf(mo) { return [mo.pre, mo.post, mo.graph, mo.iter][strat]; }

    function render() {
      svg.innerHTML = "";
      var mo = model(sel), cur = pickOf(mo);

      T(svg, 24, 16, N.toLocaleString() + " vectors · asking for top " + KNN + " · filter matches " +
        matching(sel).toLocaleString() + " of them (" + sel + "%)",
        { anchor: "start", size: 10.5, fill: C.dim });

      // recall against selectivity, all four strategies
      var X0 = 60, X1 = 400, Y0 = 40, Y1 = 176;
      function px(s) { return X1 - (Math.log10(s) - Math.log10(0.5)) / (Math.log10(100) - Math.log10(0.5)) * (X1 - X0); }
      function py(r) { return Y1 - (r - 0.5) / 0.55 * (Y1 - Y0); }
      rect(svg, X0, Y0, X1 - X0, Y1 - Y0, { fill: "none", stroke: C.line, rx: 4 });
      T(svg, (X0 + X1) / 2, Y1 + 30, "selectivity — tighter to the right", { size: 9.5, fill: C.faint });
      [100, 20, 5, 1].forEach(function (s) { T(svg, px(s), Y1 + 14, s + "%", { size: 9, fill: C.faint }); });
      [0.6, 0.8, 1.0].forEach(function (r) { T(svg, X0 - 8, py(r), r.toFixed(1), { anchor: "end", size: 8.5, fill: C.faint }); });

      [["pre", C.green], ["post", C.pink], ["graph", C.blue], ["iter", C.orange]].forEach(function (o, si) {
        var d = "";
        for (var i = 0; i <= 40; i++) {
          var s = Math.pow(10, Math.log10(100) - (Math.log10(100) - Math.log10(0.5)) * i / 40);
          d += (i ? " L " : "M ") + px(s).toFixed(1) + " " + py(model(s)[o[0]].recall).toFixed(1);
        }
        S("path", { d: d, fill: "none", stroke: o[1], "stroke-width": si === strat ? 3 : 1.2,
          opacity: si === strat ? 1 : 0.45 }, svg);
      });
      S("circle", { cx: px(sel), cy: py(cur.recall), r: 5, fill: C.text }, svg);
      line(svg, px(sel), Y0, px(sel), Y1, { stroke: C.faint, sw: 1, dash: "2 3" });

      // measured markers
      Object.keys(MEASURED).forEach(function (s) {
        S("circle", { cx: px(+s), cy: py(MEASURED[s].postRecall), r: 3, fill: C.pink }, svg);
      });
      T(svg, X0 + 6, Y0 + 12, "small pink dots = measured post-filter runs", { anchor: "start", size: 8.5, fill: C.faint });

      // readout
      var rx = 430;
      T(svg, rx, 44, STRATS[strat], { anchor: "start", size: 13, fill: C.text, weight: 700 });
      var short = cur.returned < KNN - 0.05;
      rect(svg, rx, 56, 266, 122, { fill: C.panel, stroke: short ? C.pink : C.green, sw: 2 });
      [["recall@10", cur.recall.toFixed(3), cur.recall >= 0.99 ? C.green : cur.recall >= 0.9 ? C.orange : C.pink],
       ["distance computations", String(cur.comps), cur.comps > N / 2 ? C.pink : C.blue],
       ["results returned", cur.returned.toFixed(1) + " of " + KNN, short ? C.pink : C.green]
      ].forEach(function (r, i) {
        T(svg, rx + 14, 82 + i * 26, r[0], { anchor: "start", size: 10, fill: C.faint });
        T(svg, rx + 252, 82 + i * 26, r[1], { anchor: "end", size: 12, fill: r[2], weight: 700 });
      });
      T(svg, rx + 14, 166, "an exact scan of the whole corpus would cost " + N,
        { anchor: "start", size: 8.5, fill: C.faint });

      var notes = [
        "Exact over the matching set, so recall is 1 by construction. Cost is the size of that set, which means it climbs toward a full scan as the filter loosens.",
        "Searches the index, then discards what fails the predicate. Below about 5% it stops returning ten results at all: it ran out of candidates, not out of matches.",
        "Walks the graph but admits only matching nodes. Keeps the navigation pre-filtering throws away and the completeness post-filtering loses, at more graph walking.",
        "Post-filtering with a widening search until k matches are found. Recovers the rows, and pays for them in repeated traversal."
      ];
      var words = notes[strat].split(" "), lines = [""], max = 40;
      words.forEach(function (w) {
        var last = lines[lines.length - 1];
        if ((last + " " + w).trim().length > max) lines.push(w); else lines[lines.length - 1] = (last + " " + w).trim();
      });
      lines.slice(0, 5).forEach(function (ln, i) {
        T(svg, rx, 200 + i * 14, ln, { anchor: "start", size: 9.5, fill: C.dim });
      });

      // crossover callout
      var mo5 = model(5);
      rect(svg, 24, 268, 396, 44, { fill: C.panel, stroke: C.line });
      T(svg, 38, 286, sel >= 8
        ? "at " + sel + "% post-filtering is cheaper: " + mo.post.comps + " computations against " + mo.pre.comps
        : "at " + sel + "% pre-filtering wins on BOTH axes: " + mo.pre.comps + " computations and recall 1.000",
        { anchor: "start", size: 10.5, fill: sel >= 8 ? C.dim : C.green, weight: 700 });
      T(svg, 38, 302, "the crossover is near 5%, where pre-filtering costs " + mo5.pre.comps +
        " against post-filtering's " + mo5.post.comps, { anchor: "start", size: 9, fill: C.faint });

      f.say(short
        ? "Post-filtering returned only " + cur.returned.toFixed(1) + " of the " + KNN +
          " you asked for. The index chose its candidates without knowing the predicate, and the filter ate them."
        : strat === 0 && sel > 50
        ? "Pre-filtering is exact, but at " + sel + "% selectivity you are scanning " + cur.comps +
          " vectors: this is brute force with extra steps."
        : "Tighten the filter to 2% and step through each strategy in turn.");
    }

    function controls() {
      f.controls.innerHTML = "";
      tabs(f.controls, STRATS, strat, function (i) { strat = i; controls(); render(); });
      slider(f.controls, "selectivity", 0.5, 100, sel, 0.5, function (v) { return v + "%"; },
        function (v) { sel = v; render(); });
      f.btn("reset", function () { sel = 20; strat = 1; controls(); render(); });
    }
    controls(); render();
    f.say("Tighten the filter to 2%. Watch each strategy in turn.");
  };

  /* ========================================================================
     6. pgvectorExplain — CH 13 — Inspector
     ======================================================================== */
  VIZ.pgvectorExplain = function (el) {
    var f = frame(el);
    var svg = S("svg", { viewBox: "0 0 720 340", role: "img" }, f.body);

    var variant = 0, sel = null;
    var PLANS = [
      { name: "flat (no index)",
        sql: "SELECT id FROM chunks ORDER BY embedding <=> $1 LIMIT 10;",
        nodes: [
          { t: "Limit", rows: 10, ms: 412, depth: 0,
            tip: ["Limit", "Stops after ten rows. It got all ten, so nothing was lost above it."] },
          { t: "Sort  (embedding <=> $1)", rows: 50000, ms: 412, depth: 1, warn: true,
            tip: ["Sort", "Every row in the table had to be scored and sorted. This is the node that says there is no usable index: 50,000 rows sorted to return ten."] },
          { t: "Seq Scan on chunks", rows: 50000, ms: 96, depth: 2,
            tip: ["Seq Scan", "A full table scan. Exact, and linear in the table, which is Chapter 10's flat index in a database."] }
        ],
        read: "No index: every row is scored and sorted. Exact, and the slowest plan here." },
      { name: "HNSW",
        sql: "SELECT id FROM chunks ORDER BY embedding <=> $1 LIMIT 10;",
        nodes: [
          { t: "Limit", rows: 10, ms: 2.1, depth: 0,
            tip: ["Limit", "Ten rows asked for, ten returned."] },
          { t: "Index Scan using chunks_embedding_idx", rows: 10, ms: 2.0, depth: 1, good: true,
            tip: ["Index Scan", "The HNSW index returns rows already in distance order, which is why there is no Sort node above it. This is the plan you want."] },
          { t: "Order By: (embedding <=> $1)", rows: null, ms: null, depth: 2, meta: true,
            tip: ["Order By", "The index is being used for ordering, not just for lookup. Its absence here would mean the index was not used for the distance at all."] }
        ],
        read: "An index scan feeding a limit, and no Sort node, because the index already returns rows in distance order." },
      { name: "HNSW + WHERE",
        sql: "SELECT id FROM chunks WHERE airport = 'LIS' ORDER BY embedding <=> $1 LIMIT 10;",
        nodes: [
          { t: "Limit", rows: 2, ms: 2.4, depth: 0, warn: true,
            tip: ["Limit", "You asked for ten. It returned two. An actual rows below your LIMIT at the top means the query ran out of candidates, not out of matches."] },
          { t: "Index Scan using chunks_embedding_idx", rows: 2, ms: 2.3, depth: 1,
            tip: ["Index Scan", "The index walked to forty candidates, which is hnsw.ef_search at its default, without knowing anything about the predicate."] },
          { t: "Order By: (embedding <=> $1)", rows: null, ms: null, depth: 2, meta: true,
            tip: ["Order By", "Still ordering by distance."] },
          { t: "Filter: (airport = 'LIS')", rows: null, ms: null, depth: 2, meta: true, warn: true,
            tip: ["Filter", "The predicate is applied AFTER the index has already chosen its candidates. This is post-filtering, in a query plan."] },
          { t: "Rows Removed by Filter: 38", rows: null, ms: null, depth: 2, meta: true, cliff: true,
            tip: ["Rows Removed by Filter", "The cliff, in one line. Forty candidates in, thirty-eight discarded, two returned. This is what a support ticket about missing results looks like from the database side."] }
        ],
        read: "Forty candidates in, thirty-eight discarded, two returned. Two lines diagnose the whole chapter." },
      { name: "iterative scan",
        sql: "SET hnsw.iterative_scan = relaxed_order;  -- then the same query",
        nodes: [
          { t: "Limit", rows: 10, ms: 11.6, depth: 0, good: true,
            tip: ["Limit", "Ten asked for, ten returned. The rows came back."] },
          { t: "Index Scan using chunks_embedding_idx", rows: 10, ms: 11.4, depth: 1,
            tip: ["Index Scan", "The same index, but now it keeps widening the search until the limit is satisfied or the scan budget runs out."] },
          { t: "Order By: (embedding <=> $1)", rows: null, ms: null, depth: 2, meta: true,
            tip: ["Order By", "Unchanged."] },
          { t: "Filter: (airport = 'LIS')", rows: null, ms: null, depth: 2, meta: true,
            tip: ["Filter", "Still a post-filter. What changed is that the scan no longer gives up after one pass."] },
          { t: "Rows Removed by Filter: 611", rows: null, ms: null, depth: 2, meta: true,
            tip: ["Rows Removed by Filter", "Far more rows discarded than before, and that is the cost: the rows were recovered by walking much more of the graph. 11.6 ms against 2.4."] }
        ],
        read: "The rows come back, and the bill arrives with them: 611 rows discarded and 11.6 ms against 2.4." }
    ];

    function render() {
      svg.innerHTML = "";
      var p = PLANS[variant];
      T(svg, 24, 16, p.sql, { anchor: "start", size: 9.5, fill: C.faint });

      p.nodes.forEach(function (n, i) {
        var y = 38 + i * 42, x = 30 + n.depth * 26;
        var col = n.cliff ? C.pink : n.warn ? C.orange : n.good ? C.green : C.blue;
        var g = S("g", {}, svg);
        rect(g, x, y, 660 - n.depth * 26, 34, {
          fill: sel === i ? "var(--tint-primary)" : (n.meta ? "none" : C.card),
          stroke: n.meta ? (n.cliff || n.warn ? col : C.line) : col,
          sw: n.cliff ? 2.5 : (n.meta ? 1 : 1.8),
          dash: n.meta ? "3 3" : "none"
        });
        T(g, x + 12, y + 17, (n.depth ? "-> " : "") + n.t, { anchor: "start", size: 11,
          fill: n.cliff ? C.pink : C.text, weight: n.cliff || n.good ? 700 : 400 });
        if (n.rows !== null && n.rows !== undefined)
          T(g, 600, y + 17, "actual rows=" + n.rows, { anchor: "end", size: 10,
            fill: n.warn && n.rows < 10 ? C.pink : C.dim });
        if (n.ms !== null && n.ms !== undefined)
          T(g, 682, y + 17, n.ms + " ms", { anchor: "end", size: 10, fill: C.dim });
        g.style.cursor = "pointer";
        g.addEventListener("click", function () { sel = i; render(); });
        tipOn(g, n.tip[0], n.tip[1]);
      });

      var y0 = 38 + p.nodes.length * 42 + 8;
      rect(svg, 24, y0, 672, 62, { fill: C.panel, stroke: C.line });
      if (sel !== null && p.nodes[sel]) {
        T(svg, 40, y0 + 20, p.nodes[sel].tip[0], { anchor: "start", size: 11.5, fill: C.text, weight: 700 });
        var words = p.nodes[sel].tip[1].split(" "), lines = [""], max = 96;
        words.forEach(function (w) {
          var last = lines[lines.length - 1];
          if ((last + " " + w).trim().length > max) lines.push(w); else lines[lines.length - 1] = (last + " " + w).trim();
        });
        lines.slice(0, 2).forEach(function (ln, i) {
          T(svg, 40, y0 + 38 + i * 13, ln, { anchor: "start", size: 9.5, fill: C.dim });
        });
      } else {
        T(svg, 40, y0 + 26, p.read, { anchor: "start", size: 10.5, fill: C.dim });
        T(svg, 40, y0 + 46, "click a node to read what it means", { anchor: "start", size: 9, fill: C.faint });
      }
      svg.setAttribute("viewBox", "0 0 720 " + (y0 + 74));

      f.say(variant === 2
        ? "Two lines are the whole diagnosis: Rows Removed by Filter counts what the predicate threw away after the index had already chosen it, and actual rows=2 at the top means the query ran out of candidates."
        : variant === 3
        ? "The rows came back, and so did the cost: 611 rows discarded and 11.6 ms against 2.4."
        : variant === 1
        ? "An index scan feeding a limit with no Sort node. Now open the HNSW + WHERE plan."
        : "No index: 50,000 rows sorted to return ten. Exact and slow, which is Chapter 10 in a database.");
    }

    function controls() {
      f.controls.innerHTML = "";
      tabs(f.controls, PLANS.map(function (p) { return p.name; }), variant, function (i) {
        variant = i; sel = null; controls(); render();
      });
      f.btn("reset", function () { variant = 0; sel = null; controls(); render(); });
    }
    controls(); render();
    f.say("Open the HNSW + WHERE plan. Find the node that throws rows away.");
  };
})();
