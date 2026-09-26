/* ==========================================================================
   viz-dsa1.js — DSA By Patterns machines, stage 1: the three free chapters.

     dsaFourSolutions  ch1  Comparator four maximum-subarray algorithms, one array, counted
     dsaCourseMap      ch1  Inspector  six parts, their chapters, and the prerequisite arrows
     dsaGrowthRaces    ch2  Tuner      seven growth rates against a one-second budget
     dsaBigOQuiz       ch2  Playground rule on a claim, then see the constants that settle it
     dsaUnionFind      ch7  Builder    four variants, counted in array accesses as the chapter counts
     dsaAckermann      ch7  Tuner      α(n) and log* n, as far as n can be written

   Drawing helpers and the theme-following palette come from viz-rag-kit.js
   (course-neutral), which the page loads first.
   ========================================================================== */

(function () {
  "use strict";
  window.VIZ = window.VIZ || {};
  var K = window.RAGKIT;
  if (!K) throw new Error("viz-dsa1.js needs viz-rag-kit.js loaded first");
  var C = K.C, S = K.S, T = K.T, rect = K.rect, line = K.line, frame = K.frame;

  var REDUCED = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  function clear(svg) { while (svg.firstChild) svg.removeChild(svg.firstChild); }
  function commas(n) { return Math.round(n).toLocaleString("en-US"); }
  var SUP = { "0": "⁰", "1": "¹", "2": "²", "3": "³", "4": "⁴", "5": "⁵", "6": "⁶", "7": "⁷", "8": "⁸", "9": "⁹", "-": "⁻" };
  function sup(n) { return String(n).split("").map(function (ch) { return SUP[ch] || ch; }).join(""); }
  /* A number given as its base-10 logarithm, written for a person. */
  function fmtLog(l) {
    if (!isFinite(l)) return "∞";
    if (l < 12) return commas(Math.pow(10, l));    // exact near the budget, so 31,622² vs 31,623² reads
    var e = Math.floor(l), m = Math.pow(10, l - e);
    if (m >= 9.95) { m = 1; e += 1; }
    if (e > 1e6) return "10^(" + commas(e) + ")";
    return m.toFixed(1) + " × 10" + sup(e);
  }
  function fmtSeconds(s) {
    if (s < 1e-6) return (s * 1e9).toFixed(s * 1e9 < 10 ? 1 : 0) + " ns";
    if (s < 1e-3) return (s * 1e6).toFixed(1) + " µs";
    if (s < 1) return (s * 1e3).toFixed(1) + " ms";
    if (s < 60) return s.toFixed(1) + " s";
    if (s < 3600) return (s / 60).toFixed(1) + " min";
    if (s < 86400) return (s / 3600).toFixed(1) + " h";
    if (s < 3.156e7) return (s / 86400).toFixed(1) + " days";
    var y = s / 3.156e7;
    return y < 1e6 ? commas(y) + " years" : fmtLog(Math.log10(y)) + " years";
  }
  /* Time for 10^l operations at 10⁹ a second, kept in logs so 2ⁿ at n = 10⁶ stays finite. */
  function fmtTimeLog(l) {
    var ls = l - 9;
    if (ls < 7.4) return fmtSeconds(Math.pow(10, ls));
    var ly = ls - Math.log10(3.156e7);
    return (ly < 6 ? commas(Math.pow(10, ly)) : fmtLog(ly)) + " years";
  }
  function focusable(node, label, fn) {
    node.setAttribute("tabindex", "0");
    node.setAttribute("role", "button");
    node.setAttribute("aria-label", label);
    node.style.cursor = "pointer";
    node.addEventListener("keydown", function (e) {
      if (e.key === "Enter" || e.key === " ") { e.preventDefault(); fn(); }
    });
  }

  /* back / step / reset over a precomputed trace. `draw(k)` shows state k
     (0 = before the first step). Returns an object to reload the trace. */
  function stepper(f, getLen, draw, onReset) {
    var pos = 0;
    function go(k) { pos = Math.max(0, Math.min(getLen(), k)); draw(pos); }
    f.btn("◂ back", function () { go(pos - 1); });
    f.btn("step ▸", function () { go(pos + 1); });
    f.btn("to end ⏭", function () { go(getLen()); });
    f.btn("reset", function () { go(0); if (onReset) onReset(); });
    return { reload: function () { go(0); }, pos: function () { return pos; }, go: go };
  }
  function row(parent) {
    var s = document.createElement("span");
    s.style.cssText = "display:inline-flex;gap:6px;flex-wrap:wrap;align-items:center";
    parent.appendChild(s);
    return s;
  }
  /* Seeded integers in [0, k): machines replay the same "random" input. */
  function lcg(seed) {
    return function (k) { seed = (seed * 1103515245 + 12345) % 2147483648; return Math.floor(seed / 2147483648 * k); };
  }
  /* A row of value boxes across a 760-wide viewBox; returns the x centre of box i. */
  function boxes(svg, a, y, opts) {
    opts = opts || {};
    var n = a.length, W = Math.min(56, 720 / n), X0 = (760 - W * n) / 2;
    a.forEach(function (v, i) {
      var st = opts.style ? opts.style(i) : {};
      rect(svg, X0 + i * W + 3, y, W - 6, 34, { rx: 6, fill: st.fill || C.card, stroke: st.stroke || C.line, sw: st.sw || 1.2, op: st.op == null ? 1 : st.op });
      T(svg, X0 + i * W + W / 2, y + 17.5, String(v), { size: W < 40 ? 11 : 14, weight: 600, fill: st.col || C.text });
      if (!opts.noIndex) T(svg, X0 + i * W + W / 2, y + 46, String(i), { size: 8.5, fill: C.faint });
    });
    return { x: function (i) { return X0 + i * W + W / 2; }, left: function (i) { return X0 + i * W; }, W: W };
  }
  /* A text box that calls fn(value) on Enter. */
  function input(parent, value, label, width, fn) {
    var inp = document.createElement("input");
    inp.type = "text"; inp.value = value; inp.setAttribute("aria-label", label);
    inp.style.cssText = "width:" + width + ";font:14px ui-monospace,Menlo,monospace";
    inp.addEventListener("keydown", function (e) { if (e.key === "Enter") fn(inp.value); });
    parent.appendChild(inp);
    return inp;
  }

  /* Shared with the later viz-dsa*.js files. */
  window.DSAKIT = { clear: clear, commas: commas, sup: sup, fmtLog: fmtLog, focusable: focusable, REDUCED: REDUCED,
    stepper: stepper, row: row, lcg: lcg, boxes: boxes, input: input };

  /* ------------------------------------------------------------------------
     dsaFourSolutions — ch1 §1. The four algorithms exactly as the chapter
     gives them: cubic, quadratic and Kadane start best at 0 (the empty
     subarray is allowed), divide and conquer returns a non-empty subarray.
     Operations are additions, the count the chapter's Exercise 2 uses.
     ------------------------------------------------------------------------ */
  VIZ.dsaFourSolutions = function (el) {
    var f = frame(el);
    var N = 24;
    var NAMES = ["cubic", "quadratic", "divide & conquer", "Kadane"];
    var COST = ["n³", "n²", "n log n", "n"];
    var seed = 20260920;
    function rnd() { seed = (seed * 1103515245 + 12345) % 2147483648; return seed / 2147483648; }
    function randint(lo, hi) { return lo + Math.floor(rnd() * (hi - lo + 1)); }

    var shape = 0, a = [], alg = 0, trace = [], pos = 0, timer = null, results = [];

    function makeArray() {
      a = [];
      for (var i = 0; i < N; i++) {
        if (shape === 0) a.push(randint(-9, 9));
        else if (shape === 1) a.push(randint(-9, -1));
        else a.push(randint(-6, 2));
      }
      if (shape === 2) a[randint(4, N - 5)] = 30;
    }

    function traceOf(k) {
      var out = [], ops = 0, best, bl, br, i, j, s;
      if (k === 0 || k === 1) {
        best = 0; bl = -1; br = -1;
        for (i = 0; i < N; i++) {
          s = 0;
          for (j = i; j < N; j++) {
            if (k === 0) { s = 0; for (var t = i; t <= j; t++) { s += a[t]; ops++; } }
            else { s += a[j]; ops++; }
            if (s > best) { best = s; bl = i; br = j; }
            out.push({ lo: i, hi: j, sum: s, best: best, bl: bl, br: br, ops: ops,
              what: "sum of a[" + i + ".." + j + "] = " + s });
          }
        }
      } else if (k === 2) {
        (function rec(lo, hi) {
          if (lo === hi) {
            out.push({ lo: lo, hi: hi, sum: a[lo], best: a[lo], bl: lo, br: lo, ops: ops,
              what: "one element: best of a[" + lo + "] is " + a[lo] });
            return { v: a[lo], l: lo, r: lo };
          }
          var mid = (lo + hi) >> 1;
          var L = rec(lo, mid), R = rec(mid + 1, hi);
          var ls = -Infinity, s2 = 0, li = mid, x;
          for (x = mid; x >= lo; x--) { s2 += a[x]; ops++; if (s2 > ls) { ls = s2; li = x; } }
          var rs = -Infinity, ri = mid + 1; s2 = 0;
          for (x = mid + 1; x <= hi; x++) { s2 += a[x]; ops++; if (s2 > rs) { rs = s2; ri = x; } }
          var M = { v: ls + rs, l: li, r: ri };
          var W = L.v >= R.v ? L : R;
          if (M.v > W.v) W = M;
          out.push({ lo: lo, hi: hi, sum: W.v, best: W.v, bl: W.l, br: W.r, ops: ops,
            what: "a[" + lo + ".." + hi + "]: left " + L.v + ", right " + R.v + ", straddling " + M.v + " → " + W.v });
          return W;
        })(0, N - 1);
      } else {
        var cur = 0, start = 0;
        best = 0; bl = -1; br = -1;
        for (i = 0; i < N; i++) {
          if (cur + a[i] > 0) { if (cur === 0) start = i; cur = cur + a[i]; }
          else cur = 0;
          ops++;
          if (cur > best) { best = cur; bl = start; br = i; }
          out.push({ lo: cur > 0 ? start : i, hi: i, sum: cur, best: best, bl: bl, br: br, ops: ops,
            what: cur > 0 ? "extend: running sum " + cur : "running sum went negative at a[" + i + "]: abandon it, restart at 0" });
        }
      }
      return out;
    }

    function stop() { if (timer) { clearInterval(timer); timer = null; } runBtn.textContent = "run ▸"; }
    function load() { stop(); trace = traceOf(alg); pos = 0; render(); }
    function finishIfDone() {
      if (pos === trace.length && !results[alg]) {
        var last = trace[trace.length - 1];
        results[alg] = { best: last.best, ops: last.ops };
        var emptyOK = [0, 1, 3].filter(function (k) { return results[k]; }).map(function (k) { return results[k].best; });
        if (emptyOK.some(function (v) { return v !== emptyOK[0]; }))
          throw new Error("dsaFourSolutions: empty-allowed algorithms disagree");
      }
    }
    function step() { if (pos < trace.length) { pos++; finishIfDone(); } render(); }

    var svg = S("svg", { viewBox: "0 0 760 360", width: "100%", role: "img",
      "aria-label": "four maximum-subarray algorithms on one array" }, f.body);

    function render() {
      clear(svg);
      var cur = pos ? trace[pos - 1] : null;
      var maxAbs = Math.max.apply(null, a.map(Math.abs)) || 1;
      var X0 = 20, W = 720 / N, BASE = 118, H = 80;
      T(svg, 8, 14, NAMES[alg] + " · " + COST[alg] + " · step " + pos + " of " + trace.length,
        { anchor: "start", size: 12, fill: C.text, weight: 600 });
      T(svg, 752, 14, "additions: " + commas(cur ? cur.ops : 0), { anchor: "end", size: 12, fill: C.blue, weight: 600 });
      if (cur && cur.bl >= 0)
        rect(svg, X0 + cur.bl * W + 1, 24, (cur.br - cur.bl + 1) * W - 2, 190, { fill: C.green, stroke: "none", op: 0.10, rx: 4 });
      if (cur) rect(svg, X0 + cur.lo * W + 1, 28, (cur.hi - cur.lo + 1) * W - 2, 182, { stroke: C.blue, sw: 1.6, rx: 4 });
      line(svg, X0, BASE, X0 + N * W, BASE, { stroke: C.line, sw: 1 });
      for (var i = 0; i < N; i++) {
        var h = a[i] / maxAbs * H, x = X0 + i * W + 4;
        S("rect", { x: x, y: h >= 0 ? BASE - h : BASE, width: W - 8, height: Math.max(1, Math.abs(h)), rx: 2,
          fill: a[i] >= 0 ? C.teal : C.pink, opacity: 0.75 }, svg);
        T(svg, x + (W - 8) / 2, a[i] >= 0 ? BASE + 12 : BASE - 8, String(a[i]), { size: 10, fill: C.dim });
        T(svg, x + (W - 8) / 2, 222, String(i), { size: 8.5, fill: C.faint });
      }
      T(svg, 8, 240, cur ? cur.what : "Press step or run.", { anchor: "start", size: 11.5, fill: C.dim, mono: false });
      T(svg, 752, 240, cur ? "best so far: " + cur.best + (cur.bl < 0 ? " (the empty subarray)" : " = a[" + cur.bl + ".." + cur.br + "]") : "",
        { anchor: "end", size: 11.5, fill: C.green });

      /* scoreboard */
      var Y = 262;
      T(svg, 8, Y, "algorithm", { anchor: "start", size: 10, fill: C.faint });
      T(svg, 250, Y, "answer", { anchor: "end", size: 10, fill: C.faint });
      T(svg, 390, Y, "additions", { anchor: "end", size: 10, fill: C.faint });
      T(svg, 420, Y, "convention", { anchor: "start", size: 10, fill: C.faint });
      for (var k = 0; k < 4; k++) {
        var yy = Y + 22 + k * 20, r = results[k];
        if (k === alg) rect(svg, 2, yy - 10, 756, 19, { fill: C.blue, stroke: "none", op: 0.08, rx: 3 });
        T(svg, 8, yy, NAMES[k] + "  " + COST[k], { anchor: "start", size: 11.5, fill: k === alg ? C.blue : C.text });
        T(svg, 250, yy, r ? String(r.best) : "—", { anchor: "end", size: 11.5, fill: r ? C.text : C.faint, weight: r ? 600 : 400 });
        T(svg, 390, yy, r ? commas(r.ops) : "—", { anchor: "end", size: 11.5, fill: r ? C.text : C.faint });
        T(svg, 420, yy, k === 2 ? "non-empty: at least one element" : "empty allowed: best starts at 0",
          { anchor: "start", size: 10.5, fill: C.faint, mono: false });
      }
    }

    K.tabs(f.controls, NAMES, 0, function (k) { alg = k; load();
      f.say(results[k] ? NAMES[k] + " has already run on this array; step or run it again to watch." : "Now " + NAMES[k] + ". Step or run it on the same array and compare the counters."); });
    var shapeTabs = document.createElement("span");
    shapeTabs.style.cssText = "display:inline-flex;gap:6px;flex-wrap:wrap";
    f.controls.appendChild(shapeTabs);
    K.tabs(shapeTabs, ["random", "all negative", "one big positive"], 0, function (s) {
      shape = s; makeArray(); results = []; load();
      f.say(s === 1 ? "Every element is negative. Run all four and compare the answers column." :
        s === 2 ? "One large positive element among small ones. Which algorithms find it, and at what cost?" :
        "A fresh random array. Run each algorithm and compare the additions.");
    });
    f.btn("step", function () { stop(); step(); });
    var runBtn = f.btn("run ▸", function () {
      if (timer) { stop(); return; }
      if (pos === trace.length) { pos = 0; }
      if (REDUCED) { pos = trace.length; finishIfDone(); render(); return; }
      var batch = Math.max(1, Math.ceil(trace.length / 120));
      runBtn.textContent = "pause ❚❚";
      timer = setInterval(function () {
        for (var b = 0; b < batch && pos < trace.length; b++) pos++;
        finishIfDone(); render();
        if (pos === trace.length) stop();
      }, 30);
    });
    f.btn("reset", function () { load(); f.say("Back to step 0 on the same array. Pick an algorithm and run it."); });

    makeArray(); load();
    f.say("Four algorithms, one problem. Run each on the same array and watch the additions counter. Then set the input to all negative.");
  };

  /* ------------------------------------------------------------------------
     dsaCourseMap — ch1 §4. Parts, chapters, free and optional chapters, and
     the prerequisite arrows from the Blueprint, within the selected part.
     ------------------------------------------------------------------------ */
  VIZ.dsaCourseMap = function (el) {
    var f = frame(el);
    var TITLES = ["The Shape of the Subject","What a Running Time Is","Recurrences and Divide and Conquer","Amortized Analysis: Paying in Advance","Lower Bounds and the Role of Randomness","Recursion, the Call Stack and Induction","Union–Find: The Whole Method on One Structure","Two Pointers and Sliding Windows","Prefix Sums and Difference Arrays","Stacks, Queues and the Monotonic Trick","Linked Lists and the Runner","Intervals and the Sweep Line","Binary Search as an Invariant","Binary Search on the Answer","Sorting: The Comparison Bound and How to Break It","What Your Standard Library Actually Runs","Hash Tables from the Bottom","Backtracking: Enumerate, Prune, Return","From Memoization to SRTBOT","The Knapsack Family and Pseudopolynomial Time","Sequence DP: LIS, LCS and Edit Distance","Grid, Interval and Bitmask DP","Greedy: The Exchange Argument, Huffman and Matroids","Binary Trees and Traversal","Tree DP: Returning a Tuple Upward","Binary Search Trees and Keeping Them Balanced","Heaps and Priority Queues","Tries and Prefix Structures","Ancestors and Flattening: LCA and the Euler Tour","Range Queries: Prefix, Sparse Table, Fenwick","Segment Trees and Lazy Propagation","Graphs, Grids and Representations","BFS and DFS","Topological Order and DAG Dynamic Programming","Shortest Paths as One Relaxation","Minimum Spanning Trees and the Cut Property","Structure from DFS: SCCs, Bridges and 2-SAT","Max-Flow and Min-Cut","Flow Modelling and Bipartite Matching","Bit Manipulation","String Matching: KMP, Z and Rabin-Karp","Automata and Palindromes: Aho-Corasick and Manacher","Suffix Arrays and What They Answer","Numbers, Counting and Games","Geometry","Intractability: Recognizing What Cannot Be Done","The Recognition Procedure","The Working Engineer's Handbook","The Field Guide and the Frontier"];
    /* Blueprint "Prereq:" lines, chapter -> chapters it builds on. */
    var PRE = {2:[1],3:[2],4:[2,3],5:[3,4],6:[3],7:[2,4],8:[4],9:[8],10:[4,6],11:[6],12:[8,9],13:[2],14:[13],15:[3,5],16:[15],17:[4,5],18:[6],19:[6,18],20:[19],21:[19],22:[19,20],23:[19],24:[6,10],25:[19,24],26:[13,24],27:[24],28:[24],29:[25,27],30:[9,29],31:[30],32:[10,24],33:[32],34:[19,33],35:[27,33,34],36:[7,23,35],37:[33],38:[33,35],39:[38],40:[2,18],41:[17,40],42:[28,41],43:[15,41],44:[3,40],45:[12,15],46:[20,23,39],47:[1,46],48:[16,17,47],49:[1,48]};
    var FREE = { 1: 1, 2: 1, 7: 1 };
    var PARTS = [
      { t: "Foundations", lo: 1, hi: 12, teach: "running time, recurrences, amortized analysis, then the patterns amortization explains",
        builds: "dynamic array · union–find · stack, queue, deque · linked list · prefix-sum array" },
      { t: "Order and Lookup", lo: 13, hi: 17, teach: "binary search as an invariant and on the answer, the sorting family and its bound, the hash table",
        builds: "sorted array · the sorts · hash table (chaining and probing)" },
      { t: "The Paradigms", lo: 18, hi: 23, teach: "backtracking, dynamic programming as a procedure, greedy with its proof obligation",
        builds: "search trees with pruning · DP tables · Huffman tree" },
      { t: "Hierarchies and Ranges", lo: 24, hi: 31, teach: "trees, balancing, heaps, tries and the range-query family",
        builds: "binary tree · balanced BST · binary heap · trie · sparse table · Fenwick tree · segment tree" },
      { t: "Graphs", lo: 32, hi: 39, teach: "one traversal, one relaxation step, one residual network",
        builds: "adjacency lists · BFS/DFS trees · Dijkstra's heap · MST · flow network" },
      { t: "The Edges and the Engineer", lo: 40, hi: 49, teach: "bits, strings, numbers, geometry, intractability, then the recognition procedure",
        builds: "bitsets · KMP and automata · suffix array · sieve · convex hull" }
    ];
    var sel = 0;
    var svg = S("svg", { viewBox: "0 0 760 330", width: "100%", role: "group",
      "aria-label": "map of the course: six parts" }, f.body);
    var defs = S("defs", {}, svg);
    var mk = S("marker", { id: "dsaMapArrow", viewBox: "0 0 10 10", refX: 9, refY: 5, markerWidth: 6, markerHeight: 6, orient: "auto-start-reverse" }, defs);
    S("path", { d: "M 0 0 L 10 5 L 0 10 z", fill: C.orange }, mk);
    var layer = S("g", {}, svg);

    var boxes = PARTS.map(function (p, i) {
      var g = S("g", {}, svg), x = 6 + i * 125;
      var r = rect(g, x, 6, 119, 64, { rx: 8 });
      T(g, x + 60, 20, "PART " + (i + 1), { size: 9.5, fill: C.faint });
      var words = p.t.split(" "), l1 = p.t, l2 = "";
      if (p.t.length > 16) { l1 = words.slice(0, Math.ceil(words.length / 2)).join(" "); l2 = words.slice(Math.ceil(words.length / 2)).join(" "); }
      T(g, x + 60, l2 ? 33 : 38, l1, { size: 11, weight: 600, mono: false });
      if (l2) T(g, x + 60, 46, l2, { size: 11, weight: 600, mono: false });
      T(g, x + 60, 61, "ch " + p.lo + "–" + p.hi, { size: 9, fill: C.faint });
      function pick() { sel = i; render(); }
      g.addEventListener("mouseenter", pick);
      g.addEventListener("click", pick);
      g.addEventListener("focus", pick);
      focusable(g, "Part " + (i + 1) + ", " + p.t + ", chapters " + p.lo + " to " + p.hi, pick);
      return r;
    });

    function render() {
      clear(layer);
      boxes.forEach(function (b, i) {
        b.style.stroke = i === sel ? "var(--primary)" : "var(--line)";
        b.setAttribute("stroke-width", i === sel ? 2.4 : 1.5);
      });
      var p = PARTS[sel], n = p.hi - p.lo + 1;
      T(layer, 8, 90, "Part " + (sel + 1) + " teaches " + p.teach + ".", { anchor: "start", size: 11.5, fill: C.text, mono: false });
      T(layer, 8, 107, "Builds: " + p.builds, { anchor: "start", size: 11, fill: C.dim, mono: false });
      var X0 = 20, CW = Math.min(62, 720 / n), CY = 250;
      function cx(c) { return X0 + (c - p.lo) * CW + CW / 2; }
      var outs = {};
      for (var c = p.lo; c <= p.hi; c++) (PRE[c] || []).forEach(function (q) {
        if (q < p.lo) return;
        outs[q] = (outs[q] || 0) + 1;
        var x1 = cx(q), x2 = cx(c), hgt = Math.min(118, 18 + (c - q) * 14);
        S("path", { d: "M " + x1 + " " + (CY - 20) + " C " + x1 + " " + (CY - 20 - hgt) + " " + x2 + " " + (CY - 20 - hgt) + " " + x2 + " " + (CY - 22),
          fill: "none", stroke: C.orange, "stroke-width": 1.3, opacity: 0.8, "marker-end": "url(#dsaMapArrow)" }, layer);
      });
      var ext = [];
      for (c = p.lo; c <= p.hi; c++) {
        var free = FREE[c], opt = c >= 37 && c <= 45;
        var cell = S("g", {}, layer);
        rect(cell, cx(c) - CW / 2 + 3, CY - 18, CW - 6, 36, { rx: 6, fill: free ? C.green : C.card,
          stroke: free ? C.green : C.line, dash: opt ? "4 3" : "none", op: 1 });
        if (free) S("rect", { x: cx(c) - CW / 2 + 3, y: CY - 18, width: CW - 6, height: 36, rx: 6, fill: C.card, opacity: 0.55 }, cell);
        T(cell, cx(c), CY, String(c), { size: 13, weight: 700, fill: free ? C.green : C.text });
        K.tipOn(cell, "Chapter " + c + (free ? " · free" : "") + (opt ? " · optional" : ""), TITLES[c - 1]);
        (PRE[c] || []).forEach(function (q) { if (q < p.lo && ext.indexOf(q) < 0) ext.push(q); });
      }
      var most = 0, tops = [];
      Object.keys(outs).forEach(function (k) { most = Math.max(most, outs[k]); });
      Object.keys(outs).forEach(function (k) { if (outs[k] === most) tops.push(k); });
      T(layer, 8, CY + 38, "arrows: prerequisite → chapter that builds on it" + (most ? " · most arrows out: " +
        (tops.length === 1 ? "Chapter " + tops[0] + " (" + most + ")" : "Chapters " + tops.join(", ") + " (" + most + " each)") : ""),
        { anchor: "start", size: 10.5, fill: C.faint, mono: false });
      T(layer, 8, CY + 56, ext.length ? "Also builds on earlier parts: chapter" + (ext.length > 1 ? "s " : " ") + ext.sort(function (x, y) { return x - y; }).join(", ") : "Starts from nothing earlier.",
        { anchor: "start", size: 10.5, fill: C.faint, mono: false });
      T(layer, 752, CY + 38, "green = free · dashed = optional", { anchor: "end", size: 10.5, fill: C.faint, mono: false });
    }
    render();
    f.say("Hover a part, or tab to it, to see what it teaches and which structures it builds. Free chapters are green; hover a chapter for its title.");
  };

  /* ------------------------------------------------------------------------
     dsaGrowthRaces — ch2 §2. Every value is carried as a base-10 logarithm
     so 2ⁿ and n! at a million stay finite. Budget: 10⁹ operations a second.
     ------------------------------------------------------------------------ */
  VIZ.dsaGrowthRaces = function (el) {
    var f = frame(el);
    var LOG2 = Math.log10(2);
    function lgFact(n) {                          // log10(n!)
      if (n < 171) { var s = 0; for (var k = 2; k <= n; k++) s += Math.log10(k); return s; }
      return (n * Math.log(n) - n + 0.5 * Math.log(2 * Math.PI * n) + 1 / (12 * n)) / Math.LN10;
    }
    var FN = [
      { name: "log n",   col: C.sky,    lg: function (n) { return Math.log10(Math.max(1, Math.log2(n))); } },
      { name: "√n",      col: C.teal,   lg: function (n) { return 0.5 * Math.log10(n); } },
      { name: "n",       col: C.green,  lg: function (n) { return Math.log10(n); } },
      { name: "n log n", col: C.blue,   lg: function (n) { return Math.log10(n * Math.max(1, Math.log2(n))); } },
      { name: "n²",      col: C.orange, lg: function (n) { return 2 * Math.log10(n); } },
      { name: "2ⁿ",      col: C.pink,   lg: function (n) { return n * LOG2; } },
      { name: "n!",      col: C.purple, lg: lgFact }
    ];
    var on = FN.map(function () { return true; });
    var n = 20, seconds = false, BUDGET = 9;           // log10 of 10⁹ ops
    var PX0 = 64, PX1 = 470, PY0 = 22, PY1 = 300, LY = 11, LX = 6;
    function px(v) { return PX0 + Math.log10(v) / LX * (PX1 - PX0); }
    function py(l) { return PY1 - l / LY * (PY1 - PY0); }

    var svg = S("svg", { viewBox: "0 0 760 330", width: "100%", role: "img",
      "aria-label": "growth rates against a one-second budget" }, f.body);
    var lastFit = {};

    function render() {
      clear(svg);
      for (var e = 0; e <= LY; e++) {
        var yy = py(e);
        line(svg, PX0, yy, PX1, yy, { stroke: C.line, sw: 0.5, op: 0.5 });
        if (e % (seconds ? 3 : 2) === 0 || (seconds && e === 9))
          T(svg, PX0 - 6, yy, seconds ? fmtSeconds(Math.pow(10, e - 9)) : (e === 0 ? "1" : "10" + sup(e)), { anchor: "end", size: 9.5, fill: C.faint });
      }
      for (var xe = 0; xe <= LX; xe++) T(svg, px(Math.pow(10, xe)), PY1 + 13, xe === 0 ? "1" : "10" + sup(xe), { size: 9.5, fill: C.faint });
      T(svg, (PX0 + PX1) / 2, PY1 + 27, "n (log scale)", { size: 10, fill: C.faint });
      T(svg, 12, PY0 - 6, seconds ? "time at 10⁹ ops/s" : "operations", { anchor: "start", size: 10, fill: C.faint });
      line(svg, PX0, PY0, PX0, PY1, { stroke: C.line });
      line(svg, PX0, PY1, PX1, PY1, { stroke: C.line });
      var by = py(BUDGET);
      line(svg, PX0, by, PX1, by, { stroke: C.text, sw: 1.2, dash: "5 4" });
      T(svg, PX1 - 4, by - 7, "one second", { anchor: "end", size: 10, fill: C.text });
      line(svg, px(n), PY0, px(n), PY1, { stroke: C.faint, sw: 1, dash: "2 3" });

      FN.forEach(function (fn, i) {
        if (!on[i]) return;
        var d = "", left = null, STEPS = 240, lo = 0, hi = Math.log10(n);
        for (var s = 0; s <= STEPS; s++) {
          var x = Math.pow(10, lo + (hi - lo) * s / STEPS);
          if (i >= 5) x = Math.max(1, Math.round(x));
          var l = fn.lg(x);
          if (l > LY) { left = x; d += (d ? " L " : "M ") + px(x) + " " + PY0; break; }
          d += (d ? " L " : "M ") + px(x) + " " + py(Math.max(0, l));
        }
        S("path", { d: d, fill: "none", stroke: fn.col, "stroke-width": 2 }, svg);
        if (left) T(svg, Math.min(px(left) + 2, PX1 - 20), PY0 - 2, "↑" + fn.name, { anchor: "start", size: 9.5, fill: fn.col });
      });

      /* readout at the current n */
      var RX = 488;
      T(svg, RX, 18, "at n = " + commas(n), { anchor: "start", size: 12.5, weight: 700 });
      T(svg, RX, 40, "grows as", { anchor: "start", size: 9.5, fill: C.faint });
      T(svg, 640, 40, seconds ? "time" : "operations", { anchor: "end", size: 9.5, fill: C.faint });
      T(svg, 752, 40, "≤ 1 s?", { anchor: "end", size: 9.5, fill: C.faint });
      FN.forEach(function (fn, i) {
        var y = 62 + i * 30, l = fn.lg(n), fits = l <= BUDGET + 1e-12;
        T(svg, RX, y, fn.name, { anchor: "start", size: 12, fill: on[i] ? fn.col : C.faint, weight: 600 });
        T(svg, 640, y, seconds ? fmtTimeLog(l) : fmtLog(l), { anchor: "end", size: 11.5, fill: on[i] ? C.text : C.faint });
        T(svg, 752, y, fits ? "yes" : "no", { anchor: "end", size: 11.5, fill: fits ? C.green : C.pink, weight: 600 });
      });
      T(svg, RX, 290, "budget: 10⁹ simple operations a second,", { anchor: "start", size: 9.5, fill: C.faint, mono: false });
      T(svg, RX, 304, "about right for compiled code", { anchor: "start", size: 9.5, fill: C.faint, mono: false });
    }

    function setN(v, from) {
      var prev = n;
      n = Math.max(1, Math.min(1000000, Math.round(v)));
      if (from !== "slider") sl.set(Math.log10(n));
      if (from !== "box") box.value = n;
      var msgs = [];
      FN.forEach(function (fn, i) {
        var fits = fn.lg(n) <= BUDGET + 1e-12;
        if (lastFit[i] === true && !fits) msgs.push(n - prev === 1
          ? fn.name + " stopped fitting in one second at n = " + commas(n) + ": " + commas(prev) + " is the largest n it finishes."
          : fn.name + " stopped fitting somewhere between n = " + commas(prev) + " and " + commas(n) + ".");
        lastFit[i] = fits;
      });
      render();
      if (msgs.length) f.say(msgs.join(" ") + (n - prev === 1 ? "" : " Use n − 1 and n + 1 to find exactly where."));
    }

    var sl = K.slider(f.controls, "n", 0, 6, Math.log10(n), 0.001, function (v) { return ""; },
      function (v) { setN(Math.pow(10, v), "slider"); });
    var box = document.createElement("input");
    box.type = "number"; box.min = 1; box.max = 1000000; box.value = n; box.setAttribute("aria-label", "n exactly");
    box.style.cssText = "width:7.5em;font:13px ui-monospace,Menlo,monospace";
    box.addEventListener("input", function () { if (+box.value >= 1) setN(+box.value, "box"); });
    f.controls.appendChild(box);
    f.btn("n − 1", function () { setN(n - 1); });
    f.btn("n + 1", function () { setN(n + 1); });
    K.tabs(f.controls, ["y: operations", "y: seconds"], 0, function (i) { seconds = i === 1; render(); });
    var tg = document.createElement("span");
    tg.style.cssText = "display:inline-flex;gap:6px;flex-wrap:wrap";
    f.controls.appendChild(tg);
    FN.forEach(function (fn, i) { K.toggle(tg, fn.name, true, function (v) { on[i] = v; render(); }); });
    f.btn("reset", function () { on = FN.map(function () { return true; }); tg.querySelectorAll("button").forEach(function (b) { b.textContent = "■ " + b.textContent.slice(2); b.setAttribute("aria-pressed", "true"); }); lastFit = {}; setN(20); f.say("Back to n = 20."); });

    FN.forEach(function (fn, i) { lastFit[i] = fn.lg(n) <= BUDGET; });
    render();
    f.say("Drag n and watch which curves leave the chart. Type an exact n, or use n ± 1, to find where n² stops fitting in one second, then where 2ⁿ does.");
  };

  /* ------------------------------------------------------------------------
     dsaBigOQuiz — ch2 §3. Each claim carries its truth, the witness that
     settles it, and the functions to plot. Exactly one is flagged useless.
     ------------------------------------------------------------------------ */
  VIZ.dsaBigOQuiz = function (el) {
    var f = frame(el);
    var L2 = Math.log2;
    function firstPast(ratio, c) { for (var m = 2; m < 1e7; m++) if (ratio(m) > c) return m; return null; }
    var CLAIMS = [
      { s: "3n² + 5n ∈ O(n²)", truth: true, kind: "O", c: 4, n0: 5,
        f: function (n) { return 3 * n * n + 5 * n; }, g: function (n) { return n * n; },
        why: "3n² + 5n ≤ 4n² exactly when 5n ≤ n², that is from n = 5 on. Tight, too: it is Θ(n²)." },
      { s: "n log₂ n ∈ Ω(n)", truth: true, kind: "Ω", c: 1, n0: 2,
        f: function (n) { return n * L2(n); }, g: function (n) { return n; },
        why: "log₂ n ≥ 1 once n ≥ 2, so n log₂ n ≥ 1·n. True and loose: it rules out anything sublinear, while Θ(n log n) is the whole truth." },
      { s: "n² ∈ O(n log₂ n)", truth: false, ratio: function (n) { return n / L2(n); },
        why: "The ratio n² / (n log₂ n) = n / log₂ n grows without bound, so no constant c can stay above it." },
      { s: "2ⁿ⁺¹ ∈ O(2ⁿ)", truth: true, kind: "O", c: 2, n0: 1,
        f: function (n) { return Math.pow(2, n + 1); }, g: function (n) { return Math.pow(2, n); },
        why: "2ⁿ⁺¹ is exactly 2·2ⁿ, so c = 2 works from the start. Adding one to the exponent is a constant factor." },
      { s: "2²ⁿ ∈ O(2ⁿ)", truth: false, ratio: function (n) { return Math.pow(2, n); },
        why: "4ⁿ / 2ⁿ = 2ⁿ, which passes any c once n > log₂ c. Doubling the exponent is not a constant factor." },
      { s: "12n + 7 ∈ O(2ⁿ)", truth: true, useless: true, kind: "O", c: 1, n0: 7,
        f: function (n) { return 12 * n + 7; }, g: function (n) { return Math.pow(2, n); },
        why: "12n + 7 ≤ 2ⁿ from n = 7 on, so the claim holds. And it is useless: the function is Θ(n), and this bound says only that it is no worse than exponential. It is a correct claim that throws away everything you knew." },
      { s: "log₂ n ∈ Θ(log₁₀ n)", truth: true, kind: "Θ", c: 3.3219, c2: 3.3219, n0: 2,
        f: function (n) { return L2(n); }, g: function (n) { return Math.log10(n); },
        why: "log₂ n = log₂ 10 · log₁₀ n ≈ 3.32 · log₁₀ n for every n. A change of base is a constant factor, which is why the base is never written." },
      { s: "n ∈ Θ(n²)", truth: false, ratio: function (n) { return n; }, thetaLow: true,
        why: "n ≤ n², so n ∈ O(n²) holds. Θ also needs c·n² ≤ n past some point, and that fails for every c > 0 once n > 1/c: there is no lower bound." },
      { s: "n^1.5 ∈ o(n²)", truth: true, kind: "o",
        f: function (n) { return Math.pow(n, 1.5); }, g: function (n) { return n * n; },
        why: "The ratio n^1.5 / n² = 1/√n goes to 0. For every c > 0, n^1.5 ≤ c·n² once n ≥ 1/c². That is the little-o condition: dominated, not merely bounded." }
    ];
    var i = 0, state = "ask", score = 0, answered = 0, done = {};
    var claimEl = K.div("", "");
    claimEl.style.cssText = "font:600 20px ui-monospace,Menlo,monospace;text-align:center;padding:10px 0 4px";
    f.body.appendChild(claimEl);
    var svg = S("svg", { viewBox: "0 0 760 250", width: "100%", role: "img", "aria-label": "the claim, plotted" }, f.body);

    function plot() {
      clear(svg);
      var cl = CLAIMS[i];
      T(svg, 8, 14, "claim " + (i + 1) + " of " + CLAIMS.length + " · answered " + answered + " · correct " + score,
        { anchor: "start", size: 11, fill: C.faint });
      if (state === "ask") {
        T(svg, 380, 120, "Decide first: true or false?", { size: 14, fill: C.dim, mono: false });
        return;
      }
      var X0 = 60, X1 = 740, Y0 = 34, Y1 = 214, pts, nmax, m;
      if (cl.truth && cl.kind !== "o") {
        nmax = Math.max(12, cl.n0 * 3);
        var hiC = cl.c2 || cl.c, top = 0;
        for (m = 1; m <= nmax; m++) top = Math.max(top, cl.f(m), hiC * cl.g(m));
        var xx = function (v) { return X0 + (v - 1) / (nmax - 1) * (X1 - X0); };
        var yy = function (v) { return Y1 - v / top * (Y1 - Y0); };
        S("rect", { x: xx(cl.n0), y: Y0, width: X1 - xx(cl.n0), height: Y1 - Y0, fill: C.green, opacity: 0.08 }, svg);
        line(svg, xx(cl.n0), Y0, xx(cl.n0), Y1, { stroke: C.green, dash: "4 3" });
        T(svg, xx(cl.n0) + 4, Y0 + 8, "n₀ = " + cl.n0, { anchor: "start", size: 10.5, fill: C.green });
        var curve = function (fn, col, label) {
          var d = "";
          for (var k = 0; k <= 200; k++) { var v = 1 + (nmax - 1) * k / 200; d += (d ? " L " : "M ") + xx(v) + " " + yy(fn(v)); }
          S("path", { d: d, fill: "none", stroke: col, "stroke-width": 2 }, svg);
          T(svg, X1, yy(fn(nmax)) - 8, label, { anchor: "end", size: 10.5, fill: col });
        };
        curve(cl.f, C.blue, "f(n)");
        var cstr = String(+cl.c.toFixed(2));
        curve(function (v) { return cl.c * cl.g(v); }, C.orange, cstr + "·g(n)");
        line(svg, X0, Y1, X1, Y1, { stroke: C.line });
        T(svg, X0, Y1 + 12, "n = 1", { anchor: "start", size: 9.5, fill: C.faint });
        T(svg, X1, Y1 + 12, "n = " + nmax, { anchor: "end", size: 9.5, fill: C.faint });
        T(svg, 380, 238, "witness: c = " + cstr + ", n₀ = " + cl.n0 + " — " +
          (cl.kind === "O" ? "f stays below c·g in the shaded region" : cl.kind === "Ω" ? "f stays above c·g in the shaded region" : "c·g equals f: the two curves coincide"),
          { size: 11, fill: C.dim, mono: false });
      } else {
        var ratio = cl.ratio || function (v) { return cl.f(v) / cl.g(v); };
        nmax = cl.kind === "o" ? 400 : 64;
        var rs = [];
        for (m = 2; m <= nmax; m++) rs.push(Math.log10(ratio(m)));
        var lo = Math.min.apply(null, rs.concat([-2])), hi2 = Math.max.apply(null, rs.concat([2.5]));
        var X = function (v) { return X0 + (v - 2) / (nmax - 2) * (X1 - X0); };
        var Y = function (l) { return Y1 - (l - lo) / (hi2 - lo) * (Y1 - Y0); };
        var d2 = "";
        for (m = 2; m <= nmax; m++) d2 += (d2 ? " L " : "M ") + X(m) + " " + Y(rs[m - 2]);
        S("path", { d: d2, fill: "none", stroke: C.blue, "stroke-width": 2 }, svg);
        T(svg, X1, Y(rs[rs.length - 1]) - 9, cl.thetaLow ? "g(n) / f(n)" : "f(n) / g(n)", { anchor: "end", size: 10.5, fill: C.blue });
        (cl.kind === "o" ? [1, 0.1] : [1, 10, 100]).forEach(function (c) {
          var yc = Y(Math.log10(c));
          if (yc < Y0 || yc > Y1) return;
          line(svg, X0, yc, X1, yc, { stroke: C.orange, dash: "4 3", sw: 1 });
          var past = cl.kind === "o" ? firstPast(function (v) { return 1 / ratio(v); }, 1 / c) : firstPast(ratio, c);
          T(svg, X0 + 4, yc - 7, "c = " + c + (past ? (cl.kind === "o" ? " · ratio below it from n = " + past : " · passed at n = " + past) : ""),
            { anchor: "start", size: 10, fill: C.orange });
        });
        T(svg, X0, Y1 + 12, "n = 2", { anchor: "start", size: 9.5, fill: C.faint });
        T(svg, X1, Y1 + 12, "n = " + nmax + " · ratio on a log scale", { anchor: "end", size: 9.5, fill: C.faint });
        T(svg, 380, 238, cl.kind === "o" ? "every c, however small, is eventually above the ratio" : "every constant c is eventually passed: no witness exists",
          { size: 11, fill: C.dim, mono: false });
      }
    }

    function show() {
      var cl = CLAIMS[i];
      claimEl.textContent = cl.s;
      plot();
    }
    function answer(v) {
      if (state !== "ask") return;
      var cl = CLAIMS[i], right = v === cl.truth;
      if (!done[i]) { done[i] = 1; answered++; if (right) score++; }
      state = "shown"; show();
      f.say((right ? "Right. " : "Not quite. ") + (cl.truth ? "True. " : "False. ") + cl.why +
        (answered === CLAIMS.length ? " That was the last claim: " + score + " of " + CLAIMS.length + "." : " Press next claim."));
    }
    f.btn("true", function () { answer(true); });
    f.btn("false", function () { answer(false); });
    f.btn("show witness", function () {
      state = "shown"; show();
      f.say((CLAIMS[i].truth ? "True. " : "False. ") + CLAIMS[i].why);
    });
    f.btn("next claim ▸", function () {
      i = (i + 1) % CLAIMS.length; state = "ask"; show();
      f.say("Claim " + (i + 1) + ". Decide true or false before you reveal it.");
    });
    f.btn("reset", function () {
      i = 0; state = "ask"; score = 0; answered = 0; done = {}; show();
      f.say("Start again from the first claim.");
    });
    show();
    f.say("Each claim is either true or false. Decide, then reveal the constants c and n₀ that settle it. One claim is true and tells you nothing useful: find it.");
  };

  /* ------------------------------------------------------------------------
     dsaUnionFind — ch7 §3. Array accesses are counted the way the chapter
     counts them (its 14,997 / 12,502,500 / 24,993 / 9,999 come out of this
     accounting at n = 5,000): a find is depth + 1 reads, plus a read and a
     write for every node path compression re-points; a union is two finds
     and one write; quick-find's union reads two labels, scans all n slots
     and writes each slot it relabels.
     ------------------------------------------------------------------------ */
  VIZ.dsaUnionFind = function (el) {
    var f = frame(el);
    var N = 16, VNAMES = ["quick-find", "quick-union", "union by rank", "rank + compression"];
    var variant = 1, p, rank, uAcc, fAcc, selA = null, path = [], timer = null, last = "";
    var seed = 7;
    function rnd(k) { seed = (seed * 1103515245 + 12345) % 2147483648; return Math.floor(seed / 2147483648 * k); }

    function reset() {
      if (timer) { clearTimeout(timer); timer = null; }
      p = []; rank = [];
      for (var i = 0; i < N; i++) { p.push(i); rank.push(0); }
      uAcc = 0; fAcc = 0; selA = null; path = []; last = "";
    }
    function depthOf(x) { var d = 0; while (p[x] !== x) { x = p[x]; d++; if (d > N) throw new Error("dsaUnionFind: cycle in parent array"); } return d; }
    function find(x, counter) {
      var acc = 0, root = x, trail = [x];
      if (variant === 0) { acc = 1; root = p[x]; trail = x === root ? [x] : [x, root]; }
      else {
        while (p[root] !== root) { acc++; root = p[root]; trail.push(root); }
        acc++;
        if (variant === 3) {
          var y = x;
          while (p[y] !== root) { var nx = p[y]; p[y] = root; acc += 2; y = nx; }
        }
      }
      if (counter === "f") fAcc += acc; else uAcc += acc;
      return { root: root, trail: trail, acc: acc };
    }
    function union(a, b) {
      if (variant === 0) {
        var A = p[a], B = p[b], acc = 2;
        if (A !== B) for (var i = 0; i < N; i++) { acc++; if (p[i] === A) { p[i] = B; acc++; } }
        uAcc += acc;
        return A !== B;
      }
      var ra = find(a, "u").root, rb = find(b, "u").root;
      if (ra === rb) return false;
      if (variant === 1) p[ra] = rb;
      else {
        if (rank[ra] < rank[rb]) { var t = ra; ra = rb; rb = t; }
        p[rb] = ra;
        if (rank[ra] === rank[rb]) rank[ra]++;
      }
      uAcc++;
      return true;
    }
    function maxDepth() { var m = 0; for (var i = 0; i < N; i++) m = Math.max(m, depthOf(i)); return m; }

    var svg = S("svg", { viewBox: "0 0 760 440", width: "100%", role: "group",
      "aria-label": "union-find forest of 16 elements" }, f.body);

    function layout() {
      var kids = [], roots = [], i;
      for (i = 0; i < N; i++) kids.push([]);
      for (i = 0; i < N; i++) { if (p[i] === i) roots.push(i); else kids[p[i]].push(i); }
      var width = [];
      function w(x) { var s = 0; kids[x].forEach(function (c) { s += w(c); }); width[x] = Math.max(1, s); return width[x]; }
      var total = 0; roots.forEach(function (r) { total += w(r); });
      var md = Math.max(1, maxDepth()), dy = Math.min(44, 270 / md), unit = 740 / total, pos = {};
      function place(x, left, d) {
        pos[x] = { x: 10 + (left + width[x] / 2) * unit, y: 40 + d * dy };
        var l = left; kids[x].forEach(function (c) { place(c, l, d + 1); l += width[c]; });
      }
      var l0 = 0; roots.forEach(function (r) { place(r, l0, 0); l0 += width[r]; });
      pos.r = Math.min(12, dy / 2 - 1);
      return pos;
    }

    function render() {
      clear(svg);
      var pos = layout(), md = maxDepth(), i, R = pos.r;
      T(svg, 8, 14, VNAMES[variant], { anchor: "start", size: 12.5, weight: 700, fill: C.blue });
      T(svg, 752, 14, "array accesses — unions: " + commas(uAcc) + " · finds: " + commas(fAcc) + " · max depth: " + md,
        { anchor: "end", size: 11.5, fill: C.text });
      for (i = 0; i < N; i++) if (p[i] !== i) {
        var onPath = path.indexOf(i) >= 0 && path.indexOf(p[i]) >= 0;
        line(svg, pos[i].x, pos[i].y, pos[p[i]].x, pos[p[i]].y, { stroke: onPath ? C.orange : C.faint, sw: onPath ? 2.4 : 1.4 });
      }
      for (i = 0; i < N; i++) (function (x) {
        var g = S("g", {}, svg), isSel = x === selA, onP = path.indexOf(x) >= 0;
        S("circle", { cx: pos[x].x, cy: pos[x].y, r: R, fill: isSel ? C.blue : C.card,
          stroke: isSel ? C.blue : onP ? C.orange : p[x] === x ? C.green : C.line, "stroke-width": p[x] === x ? 2.2 : 1.5 }, g);
        T(g, pos[x].x, pos[x].y + 0.5, String(x), { size: R >= 11 ? 11 : 8.5, weight: 600, fill: isSel ? "var(--bg)" : C.text });
        g.addEventListener("click", function () { clickNode(x); });
        focusable(g, "element " + x + (p[x] === x ? ", a root" : ", parent " + p[x]), function () { clickNode(x); });
      })(i);

      /* the forest is one integer array */
      var AY = 372, CW = 740 / N;
      T(svg, 8, AY - 18, variant === 0 ? "id[]" : "parent[]", { anchor: "start", size: 10, fill: C.faint });
      for (i = 0; i < N; i++) {
        rect(svg, 10 + i * CW + 2, AY - 10, CW - 4, 26, { rx: 4, stroke: path.indexOf(i) >= 0 ? C.orange : C.line, fill: C.card });
        T(svg, 10 + i * CW + CW / 2, AY + 3, String(p[i]), { size: 11.5, fill: p[i] === i ? C.green : C.text, weight: 600 });
        T(svg, 10 + i * CW + CW / 2, AY + 26, String(i), { size: 9, fill: C.faint });
      }
      T(svg, 8, 430, last || "green ring = root · orange = the path the last find walked", { anchor: "start", size: 11, fill: C.dim, mono: false });
    }

    function clickNode(x) {
      stopTimer();
      if (selA === null) { selA = x; path = []; f.say("Selected " + x + ". Click another element to union them, or press find to walk from " + x + " to its root."); }
      else if (selA === x) { selA = null; f.say("Deselected."); }
      else {
        var a = selA, before = uAcc;
        selA = null; path = [];
        var merged = union(a, x);
        last = "union(" + a + ", " + x + "): " + (merged ? "" : "already connected, ") + commas(uAcc - before) + " accesses";
        f.say(last + ". Keep going, or run the adversarial sequence.");
      }
      render();
    }
    function stopTimer() { if (timer) { clearTimeout(timer); timer = null; } }

    K.tabs(f.controls, VNAMES, 1, function (k) {
      variant = k; reset(); render();
      f.say(VNAMES[k] + ": a fresh forest of 16 singletons. Run the adversarial sequence and compare the depth and the counters.");
    });
    f.btn("adversarial: union(i, i+1)", function () {
      reset(); render();
      var k = 0;
      function next() {
        if (k >= N - 1) {
          timer = null;
          last = "union(0,1) … union(14,15): " + commas(uAcc) + " accesses to build; max depth " + maxDepth();
          render();
          f.say(last + ". Now press find all: the cost the unions did not pay is waiting there.");
          return;
        }
        union(k, k + 1); k++;
        if (REDUCED) next(); else { render(); timer = setTimeout(next, 110); }
      }
      next();
    });
    f.btn("random union", function () {
      stopTimer();
      var a = rnd(N), b = rnd(N - 1); if (b >= a) b++;
      var before = uAcc, merged = union(a, b);
      selA = null; path = [];
      last = "union(" + a + ", " + b + "): " + (merged ? "" : "already connected, ") + commas(uAcc - before) + " accesses";
      render(); f.say(last + ".");
    });
    f.btn("find(selected)", function () {
      stopTimer();
      if (selA === null) { f.say("Click an element first, then press find."); return; }
      var r = find(selA, "f");
      path = r.trail;
      last = "find(" + selA + ") = " + r.root + ": " + r.acc + " accesses" + (variant === 3 ? "; the path now points straight at the root" : "");
      selA = null; render(); f.say(last + ".");
    });
    f.btn("find all", function () {
      stopTimer();
      var before = fAcc;
      for (var x = 0; x < N; x++) find(x, "f");
      path = []; selA = null;
      last = "find(0) … find(15): " + commas(fAcc - before) + " accesses; max depth now " + maxDepth();
      render(); f.say(last + ".");
    });
    f.btn("reset", function () { reset(); render(); f.say("Sixteen singletons again, same variant."); });

    reset(); render();
    f.say("Click two nodes to union them. Switch variants and run the adversarial sequence on each, then find all.");
  };

  /* ------------------------------------------------------------------------
     dsaAckermann — ch7 §6. A_0(j) = j+1, A_k(j) = A_{k−1} applied j+1 times
     to j, α(n) = least k with A_k(1) ≥ n: A_0(1)=2, A_1(1)=3, A_2(1)=7,
     A_3(1)=2,047, A_4(1)=A_3(2,047). The stops past 10⁸⁰ are symbolic.
     ------------------------------------------------------------------------ */
  VIZ.dsaAckermann = function (el) {
    var f = frame(el);
    function logStar(x) { var k = 0; while (x > 1) { x = Math.log2(x); k++; } return k; }
    function alphaOf(x) { return x <= 2 ? 0 : x <= 3 ? 1 : x <= 7 ? 2 : x <= 2047 ? 3 : 4; }
    var STOPS = [
      { n: "1", v: 1 }, { n: "2", v: 2 }, { n: "3", v: 3 }, { n: "4", v: 4 }, { n: "7", v: 7 },
      { n: "8", v: 8 }, { n: "16", v: 16 }, { n: "2,047", v: 2047 }, { n: "2,048", v: 2048 },
      { n: "65,536 = 2¹⁶", v: 65536 },
      { n: "10⁸⁰, the atoms in the observable universe", v: 1e80 },
      { n: "2⁶⁵⁵³⁶", digits: "19,729 digits", a: 4, ls: 5 },
      { n: "2^(2⁶⁵⁵³⁶)", digits: "a number of digits that itself has 19,729 digits", a: 4, ls: 6 },
      { n: "a tower of 100 twos", digits: "no way to write its digit count down", a: 4, ls: 100 },
      { n: "A₄(1) = A₃(2,047)", digits: "a tower of twos more than 2,048 high", a: 4, ls: "> 2,048" }
    ];
    STOPS.forEach(function (s) {
      if (s.v !== undefined) {
        s.a = alphaOf(s.v); s.ls = logStar(s.v);
        s.digits = s.v < 1e15 ? String(s.v).length + (s.v < 10 ? " digit" : " digits") : "81 digits";
      }
    });
    var idx = 0, showA = true, showL = true;
    var svg = S("svg", { viewBox: "0 0 760 300", width: "100%", role: "img",
      "aria-label": "inverse Ackermann and iterated logarithm as n grows" }, f.body);

    function render() {
      clear(svg);
      var s = STOPS[idx];
      T(svg, 8, 18, "n = " + s.n, { anchor: "start", size: 14, weight: 700 });
      T(svg, 8, 38, s.digits, { anchor: "start", size: 11, fill: C.faint, mono: false });
      if (showA) {
        T(svg, 420, 26, "α(n) = " + s.a, { anchor: "start", size: 20, weight: 700, fill: C.blue });
      }
      if (showL) {
        T(svg, 560, 26, "log* n " + (typeof s.ls === "string" ? s.ls : "= " + s.ls), { anchor: "start", size: 20, weight: 700, fill: C.orange });
      }
      var X0 = 50, X1 = 740, Y0 = 70, Y1 = 250, VMAX = 7;
      function X(i) { return X0 + i / (STOPS.length - 1) * (X1 - X0); }
      function Y(v) { return Y1 - Math.min(v, VMAX) / VMAX * (Y1 - Y0); }
      for (var v = 0; v <= VMAX; v++) {
        line(svg, X0, Y(v), X1, Y(v), { stroke: C.line, sw: 0.5, op: 0.5 });
        T(svg, X0 - 8, Y(v), String(v), { anchor: "end", size: 9.5, fill: C.faint });
      }
      line(svg, X0, Y(5), X1, Y(5), { stroke: C.pink, sw: 1.2, dash: "5 4" });
      T(svg, X0 + 6, Y(5) - 8, "α = 5 needs n greater than A₄(1)", { anchor: "start", size: 10, fill: C.pink, mono: false });
      function stair(get, col) {
        var d = "";
        for (var i = 0; i <= idx; i++) {
          var val = get(STOPS[i]), yy = Y(typeof val === "number" ? val : VMAX);
          d += (d ? " L " + X(i) + " " + yy : "M " + X(i) + " " + yy);
          if (i < idx) d += " L " + X(i + 1) + " " + yy;
        }
        S("path", { d: d, fill: "none", stroke: col, "stroke-width": 2.4 }, svg);
        for (i = 0; i <= idx; i++) {
          var vv = get(STOPS[i]);
          S("circle", { cx: X(i), cy: Y(typeof vv === "number" ? vv : VMAX), r: 3.2, fill: col }, svg);
          if (typeof vv !== "number" || vv > VMAX) T(svg, X(i), Y(VMAX) - 10, "↑", { size: 11, fill: col });
        }
      }
      if (showL) stair(function (t) { return t.ls; }, C.orange);
      if (showA) stair(function (t) { return t.a; }, C.blue);
      for (var i = 0; i < STOPS.length; i++) S("circle", { cx: X(i), cy: Y1 + 14, r: i === idx ? 5 : 3, fill: i === idx ? C.text : C.faint }, svg);
      T(svg, X0, Y1 + 32, "each dot is one stop of the slider; spacing is by stop, not by size", { anchor: "start", size: 10, fill: C.faint, mono: false });
    }

    var sl = K.slider(f.controls, "n: stop", 0, STOPS.length - 1, 0, 1, function (v) { return (v + 1) + " of " + STOPS.length; },
      function (v) { idx = v; render(); speak(); });
    f.btn("◂", function () { if (idx > 0) { idx--; sl.set(idx); render(); speak(); } });
    f.btn("▸", function () { if (idx < STOPS.length - 1) { idx++; sl.set(idx); render(); speak(); } });
    K.toggle(f.controls, "α(n)", true, function (v) { showA = v; render(); });
    K.toggle(f.controls, "log* n", true, function (v) { showL = v; render(); });
    f.btn("reset", function () { idx = 0; sl.set(0); render(); speak(); });
    function speak() {
      var s = STOPS[idx];
      if (idx === STOPS.length - 1) f.say("The slider is at its end and α(n) is still 4. Past this point n cannot be written with every atom in the universe, and α = 5 is further still.");
      else if (idx === 10) f.say("10⁸⁰ is every atom in the observable universe, and α is 4. log* has reached 5; α has not moved since n = 2,048.");
      else f.say("n = " + s.n + ": α(n) = " + s.a + ", log* n " + (typeof s.ls === "string" ? s.ls : "= " + s.ls) + ". Keep dragging.");
    }
    render();
    f.say("α(n) grows so slowly it is hard to believe. Drag n as far as it goes and watch α(n) refuse to reach 5.");
  };
})();
