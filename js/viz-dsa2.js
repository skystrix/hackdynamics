/* ==========================================================================
   viz-dsa2.js — DSA By Patterns machines, stage 2: the first machine in each
   of the other Part 1 chapters.

     dsaRecursionTree  ch3  Builder    a, b, f(n): which level of the tree dominates
     dsaAmortizedArray ch4  Builder    four growth policies and the total-copies counter
     dsaDecisionTree   ch5  Inspector  binary insertion sort's comparison tree for n = 3, 4, 5
     dsaCallStack      ch6  Stepper    frames pushed and popped; fib(2) counted
     dsaTwoPointers    ch8  Stepper    pair sum, container, dedupe, Dutch flag
     dsaPrefixSum      ch9  Builder    one subtraction in 1-D, four lookups in 2-D
     dsaMonoStack      ch10 Stepper    next greater, stock span, largest rectangle, rain water
     dsaLruCache       ch11 Simulator  map + doubly linked list; LRU, LFU and FIFO side by side
     dsaSweepLine      ch12 Stepper    merge, insert, meeting rooms, union length

   Every routine follows the chapter's own code (conventions included), so a
   reader who steps the machine is stepping the code on the page.
   Needs viz-rag-kit.js and viz-dsa1.js (for DSAKIT) loaded first.
   ========================================================================== */

(function () {
  "use strict";
  window.VIZ = window.VIZ || {};
  var K = window.RAGKIT, D = window.DSAKIT;
  if (!K || !D) throw new Error("viz-dsa2.js needs viz-rag-kit.js and viz-dsa1.js loaded first");
  var C = K.C, S = K.S, T = K.T, rect = K.rect, line = K.line, frame = K.frame;
  var clear = D.clear, commas = D.commas, focusable = D.focusable, stepper = D.stepper, row = D.row;

  function numFmt(v) {
    if (v >= 1e6) return v.toExponential(2).replace("e+", "×10^");
    return Math.abs(v - Math.round(v)) < 1e-9 ? commas(v) : v.toFixed(1);
  }

  /* ------------------------------------------------------------------------
     dsaRecursionTree — ch3 §3. T(n) = a·T(n/b) + f(n) with n = b⁶, so there
     are six levels of internal nodes above a level of b⁰-sized leaves that
     cost 1 each. Level i costs aⁱ·f(n/bⁱ).
     ------------------------------------------------------------------------ */
  VIZ.dsaRecursionTree = function (el) {
    var f = frame(el);
    var L = 6, a = 2, b = 2, fi = 2, shown = 3;
    var FN = [
      { name: "1", f: function () { return 1; } },
      { name: "log n", f: function (m) { return m > 1 ? Math.log2(m) : 0; } },
      { name: "n", f: function (m) { return m; } },
      { name: "n²", f: function (m) { return m * m; } },
      { name: "n³", f: function (m) { return m * m * m; } }
    ];
    function n() { return Math.pow(b, L); }
    function cost(i) { return i < L ? Math.pow(a, i) * FN[fi].f(n() / Math.pow(b, i)) : Math.pow(a, L); }
    function theta() {
      var c = Math.log(a) / Math.log(b), cs = Math.abs(c - Math.round(c)) < 1e-9 ? String(Math.round(c)) : c.toFixed(2);
      var nc = cs === "0" ? "1" : cs === "1" ? "n" : cs === "2" ? "n²" : cs === "3" ? "n³" : "n^" + cs;
      if (fi === 1) return a === 1 ? "Θ(log² n)" : "Θ(" + nc + ")";
      var d = [0, null, 1, 2, 3][fi], nd = d === 0 ? "1" : d === 1 ? "n" : "n" + (d === 2 ? "²" : "³");
      if (Math.abs(d - c) < 1e-9) return d === 0 ? "Θ(log n)" : "Θ(" + nd + " log n)";
      return d > c ? "Θ(" + nd + ")" : "Θ(" + nc + ")";
    }
    function trend() {
      var first = cost(0), last = cost(L - 1);
      if (last > first * 1.05) return "Level cost grows going down: the leaves do the work.";
      if (last < first * 0.95) return "Level cost shrinks going down: the root does most of the work.";
      return "Every level costs the same: everyone shares the work, times the number of levels.";
    }
    var svg = S("svg", { viewBox: "0 0 760 360", width: "100%", role: "img", "aria-label": "recursion tree with per-level costs" }, f.body);
    function render() {
      clear(svg);
      T(svg, 8, 14, "T(n) = " + (a === 1 ? "" : a) + "T(n/" + b + ") + " + FN[fi].name + "   with n = " + b + "⁶ = " + commas(n()),
        { anchor: "start", size: 12.5, weight: 700 });
      var costs = [], i, max = 0;
      for (i = 0; i <= L; i++) { costs.push(cost(i)); if (i < shown) max = Math.max(max, costs[i]); }
      var Y0 = 40, RH = 40;
      for (i = 0; i < shown; i++) {
        var y = Y0 + i * RH, count = Math.pow(a, i), draw = Math.min(count, 32), w = Math.min(22, 440 / draw - 3);
        var size = i < L ? n() / Math.pow(b, i) : 1;
        for (var k = 0; k < draw; k++)
          rect(svg, 20 + k * (440 / draw) + (440 / draw - w) / 2, y, w, 16, { rx: 3, fill: i === L ? C.teal : C.card, stroke: i === L ? C.teal : C.line });
        T(svg, 20, y + 28, (i === L ? "leaves: " : "level " + i + ": ") + commas(count) + (count === 1 ? " node" : " nodes") +
          (count > 32 ? " (32 drawn)" : "") + " of size " + commas(size), { anchor: "start", size: 9.5, fill: C.faint, mono: false });
        var bw = max > 0 ? costs[i] / max * 200 : 0;
        S("rect", { x: 480, y: y, width: Math.max(1, bw), height: 16, rx: 3, fill: C.blue, opacity: 0.75 }, svg);
        T(svg, 752, y + 8, numFmt(costs[i]), { anchor: "end", size: 11, weight: 600 });
      }
      if (shown <= L) T(svg, 20, Y0 + shown * RH + 4, "… " + (L + 1 - shown) + " more level" + (L + 1 - shown === 1 ? "" : "s") + " below: press expand",
        { anchor: "start", size: 10.5, fill: C.faint, mono: false });
      T(svg, 480, 30, "cost of each level", { anchor: "start", size: 9.5, fill: C.faint });
      if (shown === L + 1) {
        var tot = costs.reduce(function (s, v) { return s + v; }, 0);
        T(svg, 8, 350, trend() + "  Total " + numFmt(tot) + " = " + theta(), { anchor: "start", size: 11.5, fill: C.text, mono: false });
      }
    }
    var ctl = row(f.controls);
    K.slider(ctl, "a", 1, 8, a, 1, function (v) { return String(v); }, function (v) { a = v; render(); say(); });
    K.slider(ctl, "b", 2, 8, b, 1, function (v) { return String(v); }, function (v) { b = v; render(); say(); });
    K.tabs(f.controls, FN.map(function (x) { return "f = " + x.name; }), fi, function (k) { fi = k; render(); say(); });
    f.btn("expand ▾", function () { shown = Math.min(L + 1, shown + 1); render(); say(); });
    f.btn("collapse ▴", function () { shown = Math.max(1, shown - 1); render(); say(); });
    f.btn("expand all", function () { shown = L + 1; render(); say(); });
    function say() {
      if (shown < L + 1) f.say("Each level's total cost is on the right. Expand levels until you can see which one dominates.");
      else f.say(trend() + " The answer is " + theta() + ".");
    }
    render(); say();
  };

  /* ------------------------------------------------------------------------
     dsaAmortizedArray — ch4 §1. One unit per element stored, one per element
     copied, the chapter's accounting: under doubling from empty, seventeen
     appends cost 48.
     ------------------------------------------------------------------------ */
  VIZ.dsaAmortizedArray = function (el) {
    var f = frame(el);
    var POL = [
      { name: "×2", grow: function (c) { return Math.max(1, c * 2); } },
      { name: "×1.5", grow: function (c) { return Math.max(c + 1, Math.floor(c * 1.5)); } },
      { name: "+1", grow: function (c) { return c + 1; } },
      { name: "+16", grow: function (c) { return c + 16; } }
    ];
    var pol = 0, cap, size, copied, units, hist, maxOne;
    function reset() { cap = 0; size = 0; copied = 0; units = 0; hist = []; maxOne = 0; }
    function append() {
      var c = 1;
      if (size === cap) { copied += size; c += size; cap = POL[pol].grow(cap); }
      size++; units += c; hist.push(c); maxOne = Math.max(maxOne, c);
    }
    var svg = S("svg", { viewBox: "0 0 760 330", width: "100%", role: "img", "aria-label": "dynamic array appends and copy cost" }, f.body);
    function render() {
      clear(svg);
      T(svg, 8, 14, "growth " + POL[pol].name + " · size " + commas(size) + " · capacity " + commas(cap), { anchor: "start", size: 12.5, weight: 700 });
      T(svg, 752, 14, "total elements ever copied: " + commas(copied), { anchor: "end", size: 12.5, weight: 700, fill: C.orange });
      var shown = Math.min(cap, 128), cw = 740 / Math.max(32, shown);
      for (var i = 0; i < shown; i++)
        S("rect", { x: 10 + i * cw + 0.5, y: 30, width: Math.max(1, cw - 1), height: 22, rx: 2,
          fill: i < size ? C.blue : C.card, stroke: C.line, "stroke-width": 0.6, opacity: i < size ? 0.8 : 1 }, svg);
      T(svg, 10, 64, cap > 128 ? "first 128 of " + commas(cap) + " slots drawn · blue = filled" : "one box per slot · blue = filled",
        { anchor: "start", size: 9.5, fill: C.faint, mono: false });
      /* per-append cost, the spikes */
      var X0 = 50, X1 = 750, Y0 = 84, Y1 = 250, last = hist.slice(-150), top = Math.max(4, Math.max.apply(null, last.concat([1])));
      line(svg, X0, Y1, X1, Y1, { stroke: C.line });
      T(svg, 8, Y0 - 4, "cost of each append (last " + last.length + ")", { anchor: "start", size: 9.5, fill: C.faint });
      T(svg, X0 - 6, Y0 + 6, commas(top), { anchor: "end", size: 9, fill: C.faint });
      T(svg, X0 - 6, Y1, "0", { anchor: "end", size: 9, fill: C.faint });
      var bw = (X1 - X0) / 150;
      last.forEach(function (c, k) {
        var h = c / top * (Y1 - Y0);
        S("rect", { x: X0 + k * bw, y: Y1 - h, width: Math.max(1, bw - 0.6), height: h, fill: c > 1 ? C.orange : C.teal, opacity: 0.85 }, svg);
      });
      var avg = size ? units / size : 0;
      T(svg, 8, 276, "appends " + commas(size) + " · total cost " + commas(units) + " units · average " + avg.toFixed(2) +
        " per append · most expensive single append " + commas(maxOne), { anchor: "start", size: 11.5, mono: false });
      T(svg, 8, 298, "copies per append so far: " + (size ? (copied / size).toFixed(2) : "0") +
        (pol === 2 && size >= 20 ? "  — growing with n, so n appends cost Θ(n²)" : pol !== 2 && size >= 20 ? "  — staying bounded, so each append is O(1) amortized" : ""),
        { anchor: "start", size: 11.5, fill: pol === 2 ? C.pink : C.green, mono: false });
      T(svg, 8, 320, "units: 1 per element stored + 1 per element copied during a resize", { anchor: "start", size: 9.5, fill: C.faint, mono: false });
    }
    K.tabs(f.controls, POL.map(function (p) { return "grow " + p.name; }), 0, function (k) {
      pol = k; reset(); render();
      f.say("Growth " + POL[k].name + ", starting empty. Append a hundred and read the copy counter.");
    });
    f.btn("append ×1", function () { append(); render(); speak(); });
    f.btn("append ×10", function () { for (var i = 0; i < 10; i++) append(); render(); speak(); });
    f.btn("append ×100", function () { for (var i = 0; i < 100; i++) append(); render(); speak(); });
    f.btn("reset", function () { reset(); render(); f.say("Empty again, same growth policy."); });
    function speak() {
      if (size === 17 && pol === 0) f.say("Seventeen appends under doubling: " + units + " units, as the chapter's table says. The spikes double in price and halve in frequency.");
      else f.say(commas(size) + " appends, " + commas(copied) + " elements copied in total. Switch policy to compare; each switch starts from empty.");
    }
    reset(); render();
    f.say("Append elements and watch capacity jump. The counter at the top right is total elements ever copied. Try +1, then ×2, with a hundred appends each.");
  };

  /* ------------------------------------------------------------------------
     dsaDecisionTree — ch5 §1. The tree is binary insertion sort's, built by
     running the algorithm on every permutation and merging the comparison
     sequences into a trie (the algorithm is adaptive, so equal histories ask
     the same next question).
     ------------------------------------------------------------------------ */
  VIZ.dsaDecisionTree = function (el) {
    var f = frame(el);
    var SUB = "₀₁₂₃₄";
    function perms(n) {
      var out = [];
      (function rec(p, used) {
        if (p.length === n) { out.push(p.slice()); return; }
        for (var v = 0; v < n; v++) if (!used[v]) { used[v] = 1; p.push(v); rec(p, used); p.pop(); used[v] = 0; }
      })([], []);
      return out;                                   // p[i] = rank of element xᵢ
    }
    function trace(p, n) {                          // binary insertion sort, comparisons recorded
      var seq = [], s = [0];
      for (var k = 1; k < n; k++) {
        var lo = 0, hi = s.length;
        while (lo < hi) {
          var mid = (lo + hi) >> 1, less = p[k] < p[s[mid]];
          seq.push([k, s[mid], less]);
          if (less) hi = mid; else lo = mid + 1;
        }
        s.splice(lo, 0, k);
      }
      return { seq: seq, out: s };
    }
    var n = 4, root, sel, nodes;
    function build() {
      root = { perms: [], kids: [null, null], depth: 0 };
      perms(n).forEach(function (p) {
        var t = trace(p, n), node = root;
        node.perms.push(p);
        t.seq.forEach(function (c) {
          node.cmp = [c[0], c[1]];
          var side = c[2] ? 0 : 1;
          if (!node.kids[side]) node.kids[side] = { perms: [], kids: [null, null], depth: node.depth + 1 };
          node = node.kids[side];
          node.perms.push(p);
        });
        node.out = t.out;
      });
      nodes = []; var leaves = 0;
      (function walk(nd) {
        nodes.push(nd);
        if (!nd.cmp) { nd.leafIndex = leaves++; return; }
        nd.kids.forEach(function (k) { if (k) walk(k); });
      })(root);
      root.leafCount = leaves;
      sel = root;
    }
    function height() { return nodes.reduce(function (m, nd) { return Math.max(m, nd.depth); }, 0); }
    function order(out) { return out.map(function (i) { return "x" + SUB[i]; }).join(" < "); }
    function ordOf(p) { var idx = p.map(function (r, i) { return [r, i]; }).sort(function (x, y) { return x[0] - y[0]; }).map(function (x) { return x[1]; }); return order(idx); }
    var svg = S("svg", { viewBox: "0 0 760 400", width: "100%", role: "group", "aria-label": "decision tree of binary insertion sort" }, f.body);
    function render() {
      clear(svg);
      var H = height(), X0 = 14, X1 = 746, Y0 = 34, Y1 = 250, dy = (Y1 - Y0) / Math.max(1, H), NL = root.leafCount;
      function pos(nd) {
        if (nd.x !== undefined) return nd;
        if (!nd.cmp) nd.x = X0 + (nd.leafIndex + 0.5) * (X1 - X0) / NL;
        else { var ks = nd.kids.filter(Boolean).map(pos); nd.x = ks.reduce(function (s, k) { return s + k.x; }, 0) / ks.length; }
        nd.y = Y0 + nd.depth * dy;
        return nd;
      }
      nodes.forEach(function (nd) { delete nd.x; });
      pos(root);
      nodes.forEach(function (nd) { nd.kids.forEach(function (k, s) { if (k) line(svg, nd.x, nd.y, k.x, k.y, { stroke: s === 0 ? C.teal : C.orange, sw: 1, op: 0.7 }); }); });
      var r = n === 5 ? 3.2 : n === 4 ? 5 : 8;
      nodes.forEach(function (nd) {
        var g = S("g", {}, svg), isSel = nd === sel;
        S("circle", { cx: nd.x, cy: nd.y, r: isSel ? r + 3 : r, fill: nd.cmp ? C.card : C.green, stroke: isSel ? C.blue : nd.cmp ? C.dim : C.green, "stroke-width": isSel ? 2.5 : 1 }, g);
        S("circle", { cx: nd.x, cy: nd.y, r: 9, fill: "transparent" }, g);
        function pick() { sel = nd; render(); speak(); }
        g.addEventListener("click", pick);
        focusable(g, nd.cmp ? "comparison x" + nd.cmp[0] + " less than x" + nd.cmp[1] + ", " + nd.perms.length + " orderings alive" : "leaf: " + order(nd.out), pick);
      });
      T(svg, 8, 14, "n = " + n + ": " + commas(NL) + " leaves, height " + H + " · lower bound ⌈log₂ " + NL + "⌉ = " + Math.ceil(Math.log2(NL)),
        { anchor: "start", size: 12, weight: 700 });
      T(svg, 752, 14, "teal edge = yes · orange edge = no", { anchor: "end", size: 9.5, fill: C.faint, mono: false });
      /* leaves per depth against the most a depth can hold */
      var by = {}; nodes.forEach(function (nd) { if (!nd.cmp) by[nd.depth] = (by[nd.depth] || 0) + 1; });
      var minD = Math.min.apply(null, Object.keys(by).map(Number)), parts = [];
      for (var d = Math.max(1, minD - 1); d <= H; d++) parts.push("depth " + d + ": " + (by[d] || 0) + " of at most " + Math.pow(2, d));
      T(svg, 8, 272, "leaves by depth — " + parts.join(" · "), { anchor: "start", size: 10, fill: C.dim, mono: false });
      /* the selected node */
      var Y = 298;
      if (sel.cmp) T(svg, 8, Y, "this node asks: is x" + SUB[sel.cmp[0]] + " < x" + SUB[sel.cmp[1]] + "?   " + sel.perms.length + " ordering" + (sel.perms.length === 1 ? "" : "s") + " still possible:",
        { anchor: "start", size: 12, fill: C.blue, weight: 600 });
      else T(svg, 8, Y, "leaf at depth " + sel.depth + ": the algorithm stops and outputs " + order(sel.out), { anchor: "start", size: 12, fill: C.green, weight: 600 });
      var list = sel.perms.slice(0, 12).map(ordOf);
      list.forEach(function (s, k) { T(svg, 8 + (k % 3) * 250, Y + 22 + Math.floor(k / 3) * 18, s, { anchor: "start", size: 10.5, fill: C.dim }); });
      if (sel.perms.length > 12) T(svg, 752, Y + 22 + 3 * 18, "+ " + (sel.perms.length - 12) + " more", { anchor: "end", size: 10.5, fill: C.faint });
    }
    function speak() {
      var H = height(), lb = Math.ceil(Math.log2(root.leafCount));
      if (sel === root) f.say("Each node is one comparison. Click one, or tab to it, to see which orderings are still alive below it. " + (n === 4 ? "Count the leaves at depth 4 against the 16 a depth can hold." : n === 5 ? "Binary insertion sort needs " + H + " comparisons on its worst input; the bound is " + lb + ", and Ford–Johnson reaches it." : "Six orderings need three levels: 2² = 4 is too few."));
      else if (!sel.cmp) f.say("One ordering left: the algorithm is done after " + sel.depth + " comparisons on this input.");
      else f.say(sel.perms.length + " orderings are still possible here; one comparison can split them at best in half. Height " + H + " against the bound " + lb +
        (n === 5 ? ". Binary insertion sort needs " + H + " on its worst input; Ford–Johnson's merge insertion reaches the bound, 7." : "."));
    }
    K.tabs(f.controls, ["n = 3", "n = 4", "n = 5"], 1, function (k) { n = k + 3; build(); render(); speak(); });
    f.btn("select root", function () { sel = root; render(); speak(); });
    f.btn("up to parent", function () {
      var par = null; nodes.forEach(function (nd) { if (nd.kids.indexOf(sel) >= 0) par = nd; });
      if (par) { sel = par; render(); speak(); }
    });
    f.btn("yes ↙", function () { if (sel.kids[0]) { sel = sel.kids[0]; render(); speak(); } });
    f.btn("no ↘", function () { if (sel.kids[1]) { sel = sel.kids[1]; render(); speak(); } });
    build(); render(); speak();
  };

  /* ------------------------------------------------------------------------
     dsaCallStack — ch6 §2. Frames are recorded from the real recursion, so
     fib(6) makes the chapter's 25 calls and pushes fib(2) five times.
     ------------------------------------------------------------------------ */
  VIZ.dsaCallStack = function (el) {
    var f = frame(el);
    var TREE = { v: "A", l: { v: "B", l: { v: "D" }, r: { v: "E", l: { v: "F" } } }, r: { v: "C", r: { v: "G" } } };
    var FUNCS = [
      { name: "factorial", lo: 0, hi: 8, def: 5, run: function (ev, n) {
        (function fact(n, acc) {
          ev.push({ push: "fact(" + n + ", " + acc + ")", key: "fact(" + n + ")" });
          var r = n === 0 ? acc : fact(n - 1, acc * n);
          ev.push({ pop: r }); return r;
        })(n, 1); } },
      { name: "fib", lo: 0, hi: 8, def: 6, run: function (ev, n) {
        (function fib(n) {
          ev.push({ push: "fib(" + n + ")", key: "fib(" + n + ")" });
          var r = n < 2 ? n : fib(n - 1) + fib(n - 2);
          ev.push({ pop: r }); return r;
        })(n); } },
      { name: "tree height", lo: 0, hi: 0, def: 0, run: function (ev) {
        (function height(t) {
          ev.push({ push: "height(" + (t ? t.v : "None") + ")", key: t ? t.v : "None" });
          var r = !t ? 0 : 1 + Math.max(height(t.l), height(t.r));
          ev.push({ pop: r }); return r;
        })(TREE); } },
      { name: "Hanoi", lo: 1, hi: 4, def: 3, run: function (ev, n) {
        var moves = 0;
        (function hanoi(n, a, b, c) {
          ev.push({ push: "hanoi(" + n + ", " + a + "→" + b + ")", key: "hanoi(" + n + ")" });
          if (n > 0) { hanoi(n - 1, a, c, b); moves++; hanoi(n - 1, c, b, a); }
          ev.push({ pop: moves + " moves" });
        })(n, "A", "C", "B"); } }
    ];
    var fi = 1, arg = 6, ev = [], pos = 0;
    function load() { ev = []; FUNCS[fi].run(ev, arg); pos = 0; }
    function state(k) {
      var stack = [], counts = {}, pushes = 0, maxD = 0, last = null;
      for (var i = 0; i < k; i++) {
        var e = ev[i];
        if (e.push) { stack.push({ label: e.push, ret: null }); pushes++; counts[e.key] = (counts[e.key] || 0) + 1; maxD = Math.max(maxD, stack.length); last = { push: e.push }; }
        else { var fr = stack.pop(); last = { pop: fr.label, val: e.pop, to: stack.length ? stack[stack.length - 1].label : null }; }
      }
      return { stack: stack, counts: counts, pushes: pushes, maxD: maxD, last: last };
    }
    var svg = S("svg", { viewBox: "0 0 760 300", width: "100%", role: "img", "aria-label": "the call stack, frames growing to the right" }, f.body);
    function render() {
      clear(svg);
      var st = state(pos), fn = FUNCS[fi];
      T(svg, 8, 14, fn.name + (fn.hi ? "(" + arg + ")" : "") + " · event " + pos + " of " + ev.length + " · frames pushed " + st.pushes + " · deepest " + st.maxD,
        { anchor: "start", size: 12, weight: 700 });
      T(svg, 752, 14, "bottom of the stack ← → top", { anchor: "end", size: 9.5, fill: C.faint, mono: false });
      var n = st.stack.length, w = Math.min(96, 740 / Math.max(1, n)), y = 40;
      st.stack.forEach(function (fr, i) {
        var top = i === n - 1;
        rect(svg, 10 + i * w, y, w - 6, 56, { rx: 6, fill: top ? C.blue : C.card, stroke: top ? C.blue : C.line, op: top ? 0.9 : 1 });
        T(svg, 10 + i * w + (w - 6) / 2, y + 22, fr.label, { size: w < 70 ? 8.5 : 10.5, weight: 600, fill: top ? "var(--bg)" : C.text });
        T(svg, 10 + i * w + (w - 6) / 2, y + 40, top ? "running" : "waiting", { size: 9, fill: top ? "var(--bg)" : C.faint, mono: false });
      });
      if (!n) T(svg, 380, y + 28, pos === 0 ? "empty: press step in" : "empty: the whole call has returned", { size: 12, fill: C.faint, mono: false });
      var msg = !st.last ? "" : st.last.push ? "pushed " + st.last.push : st.last.pop + " returned " + st.last.val + (st.last.to ? " to " + st.last.to : " to the caller: done");
      T(svg, 8, 124, msg, { anchor: "start", size: 12, fill: st.last && st.last.pop ? C.green : C.blue, weight: 600 });
      /* how often each call was pushed */
      T(svg, 8, 156, "frames pushed so far, by call", { anchor: "start", size: 9.5, fill: C.faint, mono: false });
      var keys = Object.keys(st.counts).sort(function (x, y) { return st.counts[y] - st.counts[x] || (x < y ? -1 : 1); });
      keys.slice(0, 18).forEach(function (k, i) {
        var xx = 8 + (i % 6) * 124, yy = 178 + Math.floor(i / 6) * 22;
        T(svg, xx, yy, k + " × " + st.counts[k], { anchor: "start", size: 11, fill: k === "fib(2)" ? C.orange : C.text, weight: k === "fib(2)" ? 700 : 400 });
      });
      T(svg, 8, 290, "total calls when finished: " + ev.filter(function (e) { return e.push; }).length, { anchor: "start", size: 10, fill: C.faint, mono: false });
    }
    function after() {
      render();
      var st = state(pos);
      if (pos === ev.length && fi === 1) f.say("fib(" + arg + ") returned. fib(2) was pushed " + (st.counts["fib(2)"] || 0) + " times: the same answer computed over and over, which is what the next section fixes.");
      else f.say("Step in to push the next frame or pop the top one. Step out runs until the top frame returns.");
    }
    K.tabs(f.controls, FUNCS.map(function (x) { return x.name; }), fi, function (k) {
      fi = k; arg = FUNCS[k].def; argSl.set(arg); argSl.el.style.display = FUNCS[k].hi ? "" : "none"; load(); after();
    });
    var argSl = K.slider(f.controls, "n", 0, 8, arg, 1, function (v) { return String(v); }, function (v) {
      arg = Math.max(FUNCS[fi].lo, Math.min(FUNCS[fi].hi, v)); argSl.set(arg); load(); after();
    });
    f.btn("step in ▸", function () { if (pos < ev.length) pos++; after(); });
    f.btn("step out ⤴", function () {
      var depth = state(pos).stack.length;
      if (!depth) { if (pos < ev.length) pos++; after(); return; }
      while (pos < ev.length && state(pos).stack.length >= depth) pos++;
      after();
    });
    f.btn("◂ back", function () { if (pos > 0) pos--; after(); });
    f.btn("reset", function () { pos = 0; after(); });
    load(); render();
    f.say("Step into each call. The stack grows to the right; return values flow back. Pick fib, set n = 6, and count the frames for fib(2).");
  };

  /* ------------------------------------------------------------------------
     dsaTwoPointers — ch8 §1 and §4. The routines are the chapter's
     pair_sum, dedupe and dutch_flag, and the container rule with its wrong
     twin on the chapter's counterexample.
     ------------------------------------------------------------------------ */
  VIZ.dsaTwoPointers = function (el) {
    var f = frame(el);
    var PAIR = [1, 2, 4, 7, 9, 11, 14, 16, 19, 23], HGT = [5, 9, 6, 3, 7, 1, 6, 8, 5];
    var DEDUP = [1, 1, 2, 3, 3, 3, 4, 6, 6, 7], FLAG = [2, 0, 1, 2, 1, 0, 0, 2, 1, 1];
    var prob = 0, target = 30, wrong = false, tr = [];
    function pairTrace() {
      var out = [], i = 0, j = PAIR.length - 1, gone = [];
      out.push({ a: PAIR, i: i, j: j, gone: gone.slice(), msg: "i at the left end, j at the right; target " + target });
      while (i < j) {
        var s = PAIR[i] + PAIR[j];
        if (s === target) { out.push({ a: PAIR, i: i, j: j, gone: gone.slice(), hit: true, msg: "a[" + i + "] + a[" + j + "] = " + s + ": found" }); return out; }
        if (s < target) { gone.push(i); i++; out.push({ a: PAIR, i: i, j: j, gone: gone.slice(), msg: s + " < " + target + ": a[" + (i - 1) + "] is too small even with the largest survivor, discard it" }); }
        else { gone.push(j); j--; out.push({ a: PAIR, i: i, j: j, gone: gone.slice(), msg: s + " > " + target + ": a[" + (j + 1) + "] is too large even with the smallest survivor, discard it" }); }
      }
      out.push({ a: PAIR, i: i, j: j, gone: gone.slice(), msg: "pointers met: no pair sums to " + target + ", proved with " + (out.length - 1) + " comparisons" });
      return out;
    }
    function containerTrace() {
      var out = [], i = 0, j = HGT.length - 1, gone = [], best = 0, bi = -1, bj = -1;
      while (i < j) {
        var area = Math.min(HGT[i], HGT[j]) * (j - i);
        if (area > best) { best = area; bi = i; bj = j; }
        var moveLeft = wrong ? HGT[i] > HGT[j] : HGT[i] <= HGT[j];
        out.push({ a: HGT, i: i, j: j, gone: gone.slice(), best: best, bi: bi, bj: bj, area: area,
          msg: "width " + (j - i) + " × height " + Math.min(HGT[i], HGT[j]) + " = " + area + " · move the " + (moveLeft === (HGT[i] <= HGT[j]) ? "shorter" : "TALLER") + " side next" });
        if (moveLeft) { gone.push(i); i++; } else { gone.push(j); j--; }
      }
      out.push({ a: HGT, i: i, j: j, gone: gone.slice(), best: best, bi: bi, bj: bj, done: true,
        msg: "pointers met. Best found: " + best + (wrong ? " — the true answer is 48; moving the taller side threw it away" : " — the true answer, 48") });
      return out;
    }
    function dedupeTrace() {
      var a = DEDUP.slice(), out = [], w = 1;
      out.push({ a: a.slice(), w: w, r: 1, msg: "w = 1: a[0] is kept. r reads from index 1." });
      for (var r = 1; r < a.length; r++) {
        if (a[r] !== a[w - 1]) { a[w] = a[r]; w++; out.push({ a: a.slice(), w: w, r: r, msg: "a[" + r + "] = " + a[r] + " is new: write it at " + (w - 1) + ", w = " + w }); }
        else out.push({ a: a.slice(), w: w, r: r, msg: "a[" + r + "] = " + a[r] + " repeats a[w−1]: skip" });
      }
      out.push({ a: a.slice(), w: w, r: a.length, done: true, msg: "done: the first " + w + " slots hold the distinct values, in one pass" });
      return out;
    }
    function flagTrace() {
      var a = FLAG.slice(), out = [], lo = 0, i = 0, hi = a.length - 1, PIV = 1, t;
      out.push({ a: a.slice(), lo: lo, i: i, hi: hi, msg: "pivot 1: below it goes left, above it goes right" });
      while (i <= hi) {
        if (a[i] < PIV) { t = a[lo]; a[lo] = a[i]; a[i] = t; lo++; i++; out.push({ a: a.slice(), lo: lo, i: i, hi: hi, msg: "small: swap into the left region, advance lo and i" }); }
        else if (a[i] > PIV) { t = a[hi]; a[hi] = a[i]; a[i] = t; hi--; out.push({ a: a.slice(), lo: lo, i: i, hi: hi, msg: "large: swap to the right end, hi moves in, i stays (the arrival is unread)" }); }
        else { i++; out.push({ a: a.slice(), lo: lo, i: i, hi: hi, msg: "equal to the pivot: leave it, advance i" }); }
      }
      out.push({ a: a.slice(), lo: lo, i: i, hi: hi, done: true, msg: "i passed hi: three regions, one pass, no extra array" });
      return out;
    }
    function load() { tr = [pairTrace, containerTrace, dedupeTrace, flagTrace][prob](); }
    var svg = S("svg", { viewBox: "0 0 760 300", width: "100%", role: "img", "aria-label": "two pointers on an array" }, f.body);
    function draw(k) {
      clear(svg);
      var s = tr[Math.min(k, tr.length - 1)], a = s.a, N = a.length, W = 720 / N, X0 = 20, BASE = 200;
      var mx = Math.max.apply(null, a.map(Math.abs)) || 1, bars = prob === 1;
      T(svg, 8, 14, ["pair sum", "container with most water", "dedupe (read / write pointers)", "Dutch flag"][prob] + " · step " + k + " of " + (tr.length - 1),
        { anchor: "start", size: 12, weight: 700 });
      for (var x = 0; x < N; x++) {
        var cx = X0 + x * W, gone = s.gone && s.gone.indexOf(x) >= 0;
        var region = prob === 3 ? (x < s.lo ? C.teal : x > s.hi ? C.orange : x < s.i ? C.sky : null) : prob === 2 ? (x < s.w ? C.teal : null) : null;
        if (gone) S("rect", { x: cx + 1, y: 28, width: W - 2, height: BASE - 20, fill: C.faint, opacity: 0.18 }, svg);
        if (region) S("rect", { x: cx + 1, y: 28, width: W - 2, height: BASE - 20, fill: region, opacity: 0.14 }, svg);
        if (bars) {
          var h = a[x] / mx * 140;
          S("rect", { x: cx + W * 0.2, y: BASE - h, width: W * 0.6, height: h, rx: 2, fill: gone ? C.faint : C.blue, opacity: 0.8 }, svg);
          T(svg, cx + W / 2, BASE - h - 8, String(a[x]), { size: 11, fill: C.dim });
        } else {
          rect(svg, cx + 4, 120, W - 8, 40, { rx: 6, fill: C.card, stroke: C.line });
          T(svg, cx + W / 2, 140, String(a[x]), { size: 15, weight: 600, fill: gone ? C.faint : C.text });
        }
        T(svg, cx + W / 2, BASE + 14, String(x), { size: 9, fill: C.faint });
      }
      if (prob === 1 && s.bi >= 0) {
        var top = BASE - Math.min(a[s.bi], a[s.bj]) / mx * 140;
        S("rect", { x: X0 + s.bi * W + W / 2, y: top, width: (s.bj - s.bi) * W, height: BASE - top, fill: C.green, opacity: 0.16 }, svg);
      }
      function ptr(idx, label, col, dy) {
        if (idx < 0 || idx >= N) return;
        var px = X0 + idx * W + W / 2;
        S("path", { d: "M " + px + " " + (BASE + 22 + dy) + " l -6 10 l 12 0 z", fill: col }, svg);
        T(svg, px, BASE + 42 + dy, label, { size: 11, fill: col, weight: 700 });
      }
      if (prob <= 1) { ptr(s.i, "i", C.blue, 0); ptr(s.j, "j", C.orange, 0); }
      if (prob === 2) { ptr(s.w, "w", C.teal, 0); ptr(s.r, "r", C.blue, 26); }
      if (prob === 3) { ptr(s.lo, "lo", C.teal, 0); ptr(s.i, "i", C.blue, 26); ptr(s.hi, "hi", C.orange, 0); }
      T(svg, 8, 286, s.msg, { anchor: "start", size: 11.5, fill: s.hit || (s.done && !wrong) ? C.green : s.done && wrong ? C.pink : C.text, mono: false });
      if (prob === 1) T(svg, 752, 14, "best so far: " + s.best + (wrong ? " · rule: move the TALLER (wrong)" : " · rule: move the shorter"),
        { anchor: "end", size: 11, fill: wrong ? C.pink : C.green, weight: 600 });
      if (prob === 3) T(svg, 752, 14, "teal < pivot · blue = pivot · orange > pivot · unshaded unread", { anchor: "end", size: 9.5, fill: C.faint, mono: false });
      if (prob === 0) T(svg, 752, 14, "grey = discarded, proved unable to be in the pair", { anchor: "end", size: 9.5, fill: C.faint, mono: false });
      if (prob === 2) T(svg, 752, 14, "teal = the distinct prefix written so far", { anchor: "end", size: 9.5, fill: C.faint, mono: false });
    }
    var tabsBox = row(f.controls);
    K.tabs(tabsBox, ["pair sum", "container", "dedupe", "Dutch flag"], 0, function (k) {
      prob = k; load(); sp.reload(); extra.style.display = k === 0 || k === 1 ? "" : "none";
      tgtBtn.style.display = k === 0 ? "" : "none"; ruleBtn.style.display = k === 1 ? "" : "none";
      f.say(["Pair sum on a sorted array: each step discards one end. Grey columns are proved impossible, not unvisited.",
        "Container: step it, and at each step where the heights differ ask what moving the taller side would throw away. Then switch the rule and run it.",
        "Same-direction pointers: r reads every element, w writes only the new ones.",
        "Three regions and one unread middle: lo, i and hi."][k]);
    });
    var extra = row(f.controls);
    var tgtBtn = f.btn("target: 30", function () { target = target === 30 ? 29 : 30; tgtBtn.textContent = "target: " + target; load(); sp.reload(); });
    var ruleBtn = f.btn("rule: move shorter", function () {
      wrong = !wrong; ruleBtn.textContent = wrong ? "rule: move TALLER" : "rule: move shorter"; load(); sp.reload();
      f.say(wrong ? "The wrong rule, on the chapter's counterexample. Run it to the end and compare its best with 48." : "The correct rule again.");
    });
    extra.appendChild(tgtBtn); extra.appendChild(ruleBtn); ruleBtn.style.display = "none";
    var sp = stepper(f, function () { return tr.length - 1; }, draw);
    load(); draw(0);
    f.say("Two pointers, one pass. The shaded regions are what each invariant has already ruled out. Pick a problem and step.");
  };

  /* ------------------------------------------------------------------------
     dsaPrefixSum — ch9 §1 and §6. P has n + 1 entries with P[0] = 0, and a
     range a[l..r] is P[r+1] − P[l]; in 2-D, four lookups.
     ------------------------------------------------------------------------ */
  VIZ.dsaPrefixSum = function (el) {
    var f = frame(el);
    var seed = 9;
    function rnd(k) { seed = (seed * 1103515245 + 12345) % 2147483648; return Math.floor(seed / 2147483648 * k); }
    var A = [], G = [], l = 2, r = 6, two = false, r1 = 1, c1 = 1, r2 = 3, c2 = 4, pending = null;
    function fill() { A = []; for (var i = 0; i < 10; i++) A.push(rnd(19) - 9); G = []; for (var y = 0; y < 5; y++) { G.push([]); for (var x = 0; x < 6; x++) G[y].push(rnd(10)); } }
    function P1() { var p = [0]; A.forEach(function (v) { p.push(p[p.length - 1] + v); }); return p; }
    function P2() {
      var p = []; for (var y = 0; y <= 5; y++) { p.push([]); for (var x = 0; x <= 6; x++) p[y].push(0); }
      for (y = 1; y <= 5; y++) for (x = 1; x <= 6; x++) p[y][x] = G[y - 1][x - 1] + p[y - 1][x] + p[y][x - 1] - p[y - 1][x - 1];
      return p;
    }
    var svg = S("svg", { viewBox: "0 0 760 330", width: "100%", role: "group", "aria-label": "prefix sums" }, f.body);
    function cell(x, y, w, h, txt, o) {
      o = o || {};
      var g = S("g", {}, svg);
      rect(g, x, y, w, h, { rx: 5, fill: o.fill || C.card, stroke: o.stroke || C.line, sw: o.sw || 1.2, op: o.op == null ? 1 : o.op });
      T(g, x + w / 2, y + h / 2 + 0.5, txt, { size: o.size || 12, weight: o.weight || 500, fill: o.col || C.text });
      return g;
    }
    function render() {
      clear(svg);
      if (!two) {
        var p = P1(), W = 64, X0 = 20;
        T(svg, 8, 14, "a[" + l + ".." + r + "] = P[" + (r + 1) + "] − P[" + l + "] = " + p[r + 1] + " − " + (p[l] < 0 ? "(" + p[l] + ")" : p[l]) + " = " + (p[r + 1] - p[l]),
          { anchor: "start", size: 13, weight: 700 });
        T(svg, 752, 14, "direct sum: " + A.slice(l, r + 1).reduce(function (s, v) { return s + v; }, 0), { anchor: "end", size: 11, fill: C.faint });
        T(svg, 8, 44, "a", { anchor: "start", size: 11, fill: C.faint });
        A.forEach(function (v, i) {
          var inR = i >= l && i <= r;
          var g = cell(X0 + 20 + i * W + 32, 34, W - 6, 34, String(v), { fill: inR ? C.blue : C.card, op: inR ? 0.25 : 1 });
          T(svg, X0 + 20 + i * W + 32 + (W - 6) / 2, 80, String(i), { size: 9, fill: C.faint });
          (function (i) { function bump() { A[i] = A[i] >= 9 ? -9 : A[i] + 1; render(); } g.addEventListener("click", bump); focusable(g, "a[" + i + "] = " + A[i] + ", click to add one", bump); })(i);
        });
        T(svg, 8, 128, "P", { anchor: "start", size: 11, fill: C.faint });
        p.forEach(function (v, i) {
          var plus = i === r + 1, minus = i === l;
          cell(X0 + 20 + i * W, 116, W - 6, 34, String(v), { fill: plus ? C.green : minus ? C.pink : C.card, op: plus || minus ? 0.3 : 1,
            stroke: plus ? C.green : minus ? C.pink : C.line, sw: plus || minus ? 2 : 1.2, weight: plus || minus ? 700 : 500 });
          T(svg, X0 + 20 + i * W + (W - 6) / 2, 162, String(i), { size: 9, fill: C.faint });
          if (plus) T(svg, X0 + 20 + i * W + (W - 6) / 2, 182, "+", { size: 16, weight: 700, fill: C.green });
          if (minus) T(svg, X0 + 20 + i * W + (W - 6) / 2, 182, "−", { size: 16, weight: 700, fill: C.pink });
        });
        T(svg, 8, 214, "P has n + 1 entries; P[0] = 0 is the sentinel, so a range starting at 0 needs no special case.", { anchor: "start", size: 11, fill: C.dim, mono: false });
        T(svg, 8, 234, "P[i] is the sum of the first i elements: a[0] up to, not including, a[i]. Click a value in a to change it.", { anchor: "start", size: 11, fill: C.dim, mono: false });
      } else {
        var q = P2(), ya = Math.min(r1, r2), yb = Math.max(r1, r2), xa = Math.min(c1, c2), xb = Math.max(c1, c2), CW = 44, CH = 34;
        var looks = [[yb + 1, xb + 1, "+"], [ya, xb + 1, "−"], [yb + 1, xa, "−"], [ya, xa, "+"]];
        var vals = looks.map(function (t) { return q[t[0]][t[1]]; });
        var ans = vals[0] - vals[1] - vals[2] + vals[3], direct = 0;
        for (var y = ya; y <= yb; y++) for (var x = xa; x <= xb; x++) direct += G[y][x];
        var zeros = vals.filter(function (v, i) { return looks[i][0] === 0 || looks[i][1] === 0; }).length;
        T(svg, 8, 14, "sum = " + vals[0] + " − " + vals[1] + " − " + vals[2] + " + " + vals[3] + " = " + ans + "   (direct " + direct + ")",
          { anchor: "start", size: 13, weight: 700 });
        T(svg, 8, 34, "grid: click one corner, then the other", { anchor: "start", size: 10, fill: C.faint, mono: false });
        for (y = 0; y < 5; y++) for (x = 0; x < 6; x++) (function (y, x) {
          var inR = y >= ya && y <= yb && x >= xa && x <= xb, isP = pending && pending[0] === y && pending[1] === x;
          var g = cell(20 + x * CW, 46 + y * CH, CW - 4, CH - 4, String(G[y][x]), { fill: inR ? C.blue : C.card, op: inR ? 0.25 : 1, stroke: isP ? C.orange : C.line, sw: isP ? 2.4 : 1.2 });
          function pick() {
            if (!pending) { pending = [y, x]; r1 = r2 = y; c1 = c2 = x; }
            else { r1 = pending[0]; c1 = pending[1]; r2 = y; c2 = x; pending = null; }
            render(); speak();
          }
          g.addEventListener("click", pick); focusable(g, "cell row " + y + " column " + x, pick);
        })(y, x);
        T(svg, 300, 34, "P (one extra row and column of zeros)", { anchor: "start", size: 10, fill: C.faint, mono: false });
        for (y = 0; y <= 5; y++) for (x = 0; x <= 6; x++) {
          var li = -1; looks.forEach(function (t, i) { if (t[0] === y && t[1] === x) li = i; });
          var sign = li >= 0 ? looks[li][2] : null, col = sign === "+" ? C.green : sign === "−" ? C.pink : null;
          cell(300 + x * 64, 46 + y * 38, 60, 34, String(q[y][x]) + (sign ? " " + sign : ""), { fill: col || C.card, op: col ? 0.28 : 1, stroke: col || C.line,
            sw: col ? 2 : 1, weight: col ? 700 : 400, col: y === 0 || x === 0 ? C.faint : C.text, size: 11 });
        }
        T(svg, 8, 324, zeros + " of the four lookups " + (zeros === 1 ? "sits" : "sit") + " in P's zero row or column" + (zeros === 3 ? " — the rectangle starts at the top-left corner" : ""),
          { anchor: "start", size: 11, fill: zeros === 3 ? C.green : C.dim, mono: false });
      }
    }
    function speak() {
      if (!two) f.say("Drag the range. The answer is one subtraction: watch which two cells of P it reads.");
      else if (pending) f.say("First corner set. Click the opposite corner.");
      else f.say("Four lookups, two added and two subtracted. Find the rectangle where three of the four are zero, and say why.");
    }
    K.tabs(f.controls, ["1-D", "2-D"], 0, function (k) { two = k === 1; pending = null; sl.forEach(function (s) { s.el.style.display = two ? "none" : ""; }); render(); speak(); });
    var sl = [
      K.slider(f.controls, "l", 0, 9, l, 1, function (v) { return String(v); }, function (v) { l = Math.min(v, r); sl[0].set(l); render(); }),
      K.slider(f.controls, "r", 0, 9, r, 1, function (v) { return String(v); }, function (v) { r = Math.max(v, l); sl[1].set(r); render(); })
    ];
    f.btn("new values", function () { fill(); render(); });
    fill(); render(); speak();
  };

  /* ------------------------------------------------------------------------
     dsaMonoStack — ch10 §3 and §4. The four routines are the chapter's
     next_greater, stock_span, largest_rectangle (with its 0 sentinel) and
     trap; one step is one push or one pop.
     ------------------------------------------------------------------------ */
  VIZ.dsaMonoStack = function (el) {
    var f = frame(el);
    var DATA = [[2, 7, 3, 5, 4, 6, 1, 8], [100, 80, 60, 70, 60, 75, 85], [2, 1, 5, 6, 2, 3], [0, 1, 0, 2, 1, 0, 1, 3, 2, 1, 2, 1]];
    var NAMES = ["next greater", "stock span", "largest rectangle", "trapping rain water"];
    var prob = 0, tr = [];
    function snap(o) { o.st = o.st.slice(); o.res = o.res.slice(); o.slabs = (o.slabs || []).slice(); return o; }
    function build() {
      var a = DATA[prob].slice(), n = a.length, st = [], res = [], out = [], pushes = 0, pops = 0, i, v;
      out.push(snap({ a: a, st: st, res: res, i: -1, pushes: 0, pops: 0, msg: "empty stack; press step" }));
      if (prob === 0) {
        for (i = 0; i < n; i++) res.push(-1);
        for (i = 0; i < n; i++) {
          v = a[i];
          while (st.length && a[st[st.length - 1]] < v) { var j = st.pop(); pops++; res[j] = v; out.push(snap({ a: a, st: st, res: res, i: i, pushes: pushes, pops: pops, hi: j, msg: "a[" + i + "] = " + v + " evicts index " + j + " (" + a[j] + "): its next greater is " + v }));
          }
          st.push(i); pushes++; out.push(snap({ a: a, st: st, res: res, i: i, pushes: pushes, pops: pops, msg: "push index " + i + " (" + v + "): still waiting for something larger" }));
        }
      } else if (prob === 1) {
        for (i = 0; i < n; i++) {
          v = a[i];
          while (st.length && a[st[st.length - 1]] <= v) { var k = st.pop(); pops++; out.push(snap({ a: a, st: st, res: res, i: i, pushes: pushes, pops: pops, hi: k, msg: "price " + v + " ≥ " + a[k] + " on day " + k + ": that day cannot end a later span, pop it" })); }
          res.push(st.length ? i - st[st.length - 1] : i + 1);
          st.push(i); pushes++;
          out.push(snap({ a: a, st: st, res: res, i: i, pushes: pushes, pops: pops, msg: "day " + i + ": span " + res[i] + (st.length > 1 ? ", back to day " + st[st.length - 2] + "'s higher price" : ", back to the start") }));
        }
      } else if (prob === 2) {
        var h = a.concat([0]), best = 0, rectB = null;
        for (i = 0; i < h.length; i++) {
          v = h[i];
          while (st.length && h[st[st.length - 1]] >= v) {
            var top = st.pop(), height = h[top], left = st.length ? st[st.length - 1] + 1 : 0, area = height * (i - left);
            pops++;
            var win = area > best; if (win) { best = area; rectB = [left, i - 1, height]; }
            out.push(snap({ a: h, st: st, res: res, i: i, pushes: pushes, pops: pops, hi: top, best: best, rect: [left, i - 1, height], bestRect: rectB,
              msg: "pop bar " + top + " (height " + height + "): it spans " + left + ".." + (i - 1) + ", left boundary " + left + ", area " + area + (win ? " — new best" : "") }));
          }
          st.push(i); pushes++;
          out.push(snap({ a: h, st: st, res: res, i: i, pushes: pushes, pops: pops, best: best, bestRect: rectB, msg: i === h.length - 1 ? "the 0 sentinel settles every bar left on the stack; best " + best : "push bar " + i + " (height " + v + ")" }));
        }
      } else {
        var total = 0, slabs = [];
        for (i = 0; i < n; i++) {
          v = a[i];
          while (st.length && a[st[st.length - 1]] < v) {
            var fl = a[st.pop()]; pops++;
            if (!st.length) { out.push(snap({ a: a, st: st, res: res, i: i, pushes: pushes, pops: pops, total: total, slabs: slabs, msg: "popped a floor of " + fl + " with no left wall: water escapes" })); break; }
            var w = i - st[st.length - 1] - 1, d = Math.min(a[st[st.length - 1]], v) - fl;
            total += w * d; if (w * d > 0) slabs.push([st[st.length - 1] + 1, i - 1, fl, fl + d]);
            out.push(snap({ a: a, st: st, res: res, i: i, pushes: pushes, pops: pops, total: total, slabs: slabs, msg: "floor " + fl + ", walls at " + st[st.length - 1] + " and " + i + ": slab " + w + " wide × " + d + " deep = " + (w * d) + ", total " + total }));
          }
          st.push(i); pushes++;
          out.push(snap({ a: a, st: st, res: res, i: i, pushes: pushes, pops: pops, total: total, slabs: slabs, msg: "push index " + i + " (height " + v + ")" }));
        }
      }
      tr = out;
    }
    var svg = S("svg", { viewBox: "0 0 760 330", width: "100%", role: "img", "aria-label": "monotonic stack" }, f.body);
    function draw(k) {
      clear(svg);
      var s = tr[k], a = s.a, n = a.length, X0 = 20, W = Math.min(64, 480 / n), BASE = 200, mx = Math.max.apply(null, a) || 1, sc = 150 / mx;
      T(svg, 8, 14, NAMES[prob] + " · step " + k + " of " + (tr.length - 1) + " · pushes " + s.pushes + " · pops " + s.pops,
        { anchor: "start", size: 12, weight: 700 });
      (s.slabs || []).forEach(function (sl) {
        S("rect", { x: X0 + sl[0] * W, y: BASE - sl[3] * sc, width: (sl[1] - sl[0] + 1) * W, height: (sl[3] - sl[2]) * sc, fill: C.sky, opacity: 0.35 }, svg);
      });
      if (s.bestRect) S("rect", { x: X0 + s.bestRect[0] * W, y: BASE - s.bestRect[2] * sc, width: (s.bestRect[1] - s.bestRect[0] + 1) * W, height: s.bestRect[2] * sc, fill: C.green, opacity: 0.15 }, svg);
      if (s.rect) S("rect", { x: X0 + s.rect[0] * W, y: BASE - s.rect[2] * sc, width: (s.rect[1] - s.rect[0] + 1) * W, height: s.rect[2] * sc, fill: "none", stroke: C.orange, "stroke-width": 2, "stroke-dasharray": "5 3" }, svg);
      for (var x = 0; x < n; x++) {
        var onSt = s.st.indexOf(x) >= 0, cur = x === s.i, hit = x === s.hi;
        S("rect", { x: X0 + x * W + W * 0.15, y: BASE - a[x] * sc, width: W * 0.7, height: Math.max(1, a[x] * sc), rx: 2,
          fill: hit ? C.orange : cur ? C.blue : onSt ? C.teal : C.faint, opacity: hit || cur || onSt ? 0.85 : 0.45 }, svg);
        T(svg, X0 + x * W + W / 2, BASE + 12, String(a[x]), { size: 10, fill: C.dim });
        T(svg, X0 + x * W + W / 2, BASE + 26, String(x), { size: 8.5, fill: C.faint });
        if (prob <= 1 && s.res[x] !== undefined) T(svg, X0 + x * W + W / 2, BASE + 46, String(s.res[x]), { size: 11, weight: 700, fill: C.green });
      }
      if (prob <= 1) T(svg, 8, BASE + 46, prob === 0 ? "answer" : "span", { anchor: "start", size: 9, fill: C.green });
      /* the stack itself */
      var SX = 540;
      T(svg, SX, 34, "stack (indices), top at the top", { anchor: "start", size: 9.5, fill: C.faint, mono: false });
      s.st.slice(-7).forEach(function (idx, j, arr) {
        var yy = 190 - j * 22;
        rect(svg, SX, yy - 9, 150, 19, { rx: 4, fill: C.card, stroke: j === arr.length - 1 ? C.teal : C.line });
        T(svg, SX + 75, yy + 0.5, "index " + idx + " · " + a[idx], { size: 10.5 });
      });
      if (prob === 2) T(svg, 752, 14, "best area " + (s.best || 0), { anchor: "end", size: 12, weight: 700, fill: C.green });
      if (prob === 3) T(svg, 752, 14, "water " + (s.total || 0), { anchor: "end", size: 12, weight: 700, fill: C.sky });
      T(svg, 8, 312, s.msg, { anchor: "start", size: 11.5, mono: false, fill: s.hi !== undefined ? C.orange : C.text });
    }
    K.tabs(f.controls, NAMES, 0, function (k) { prob = k; build(); sp.reload();
      f.say(k === 2 ? "Step until the best area stops changing, and find the pop that set it: which bar was popped, and what was its left boundary?" :
        k === 3 ? "Each pop with a left wall fills one horizontal slab of water." : "Each pop finishes one element's answer. Watch what the popped element learns on its way out."); });
    var sp = stepper(f, function () { return tr.length - 1; }, draw);
    build(); draw(0);
    f.say("Each pop finishes one element's answer. Watch what the popped element learns on its way out.");
  };

  /* ------------------------------------------------------------------------
     dsaLruCache — ch11 §7. A map plus a doubly linked list, most recent at
     the head. The same access stream runs through LRU, LFU (ties broken by
     recency) and FIFO at once, so a miss in one can be checked in the others.
     ------------------------------------------------------------------------ */
  VIZ.dsaLruCache = function (el) {
    var f = frame(el);
    var KEYS = ["A", "B", "C", "D", "E", "F"], PN = ["LRU", "LFU", "FIFO"];
    var cap = 4, view = 0, pol, log, clock;
    function reset() {
      pol = PN.map(function () { return { list: [], freq: {}, hits: 0, miss: 0, last: null }; });   // list[0] = head
      log = []; clock = 0;
    }
    function access(k) {
      clock++;
      var res = pol.map(function (p, pi) {
        var at = p.list.indexOf(k), evicted = null;
        if (at >= 0) {
          p.hits++; p.freq[k] = (p.freq[k] || 0) + 1;
          if (pi !== 2) { p.list.splice(at, 1); p.list.unshift(k); }            // FIFO does not reorder on a hit
          p.last = { k: k, hit: true };
          return "hit";
        }
        p.miss++;
        if (p.list.length >= cap) {
          if (pi === 1) {                                                           // LFU: lowest count, then least recent
            var victim = null;
            for (var i = p.list.length - 1; i >= 0; i--) if (victim === null || p.freq[p.list[i]] < p.freq[victim]) victim = p.list[i];
            p.list.splice(p.list.indexOf(victim), 1); evicted = victim;
          } else evicted = p.list.pop();                                            // LRU and FIFO: the tail
          delete p.freq[evicted];
        }
        p.list.unshift(k); p.freq[k] = 1;
        p.last = { k: k, hit: false, ev: evicted };
        return evicted ? "miss, evict " + evicted : "miss";
      });
      log.push({ k: k, res: res });
    }
    var svg = S("svg", { viewBox: "0 0 760 330", width: "100%", role: "img", "aria-label": "cache as a hash map and a doubly linked list" }, f.body);
    function render() {
      clear(svg);
      var p = pol[view];
      T(svg, 8, 14, PN[view] + " · capacity " + cap + " · hits " + p.hits + " · misses " + p.miss, { anchor: "start", size: 12.5, weight: 700 });
      /* hash map column */
      T(svg, 8, 40, "hash map", { anchor: "start", size: 9.5, fill: C.faint, mono: false });
      var X0 = 150, NW = 110, Y = 80;
      p.list.slice().sort().forEach(function (k, i) {
        rect(svg, 8, 50 + i * 26, 70, 20, { rx: 4, fill: C.card });
        T(svg, 43, 60 + i * 26, k + " → node", { size: 10 });
        var li = p.list.indexOf(k);
        line(svg, 78, 60 + i * 26, X0 + li * NW + 10, Y + 10, { stroke: C.line, sw: 0.8, dash: "3 3" });
      });
      /* the list, head to tail */
      T(svg, X0, 44, view === 2 ? "queue by arrival — head = newest, tail = oldest" : "doubly linked list — head = most recent, tail = next to die",
        { anchor: "start", size: 9.5, fill: C.faint, mono: false });
      p.list.forEach(function (k, i) {
        var x = X0 + i * NW, isTail = i === p.list.length - 1 && p.list.length >= cap, isLast = p.last && p.last.k === k;
        rect(svg, x, Y - 12, 86, 50, { rx: 7, fill: isLast ? (p.last.hit ? C.green : C.blue) : C.card, stroke: isTail ? C.pink : C.line, sw: isTail ? 2.2 : 1.3, op: isLast ? 0.85 : 1 });
        T(svg, x + 43, Y + 6, k, { size: 17, weight: 700, fill: isLast ? "var(--bg)" : C.text });
        if (view === 1) T(svg, x + 43, Y + 26, "used " + p.freq[k] + "×", { size: 9.5, fill: isLast ? "var(--bg)" : C.faint, mono: false });
        if (i < p.list.length - 1) {
          line(svg, x + 86, Y + 2, x + NW, Y + 2, { stroke: C.faint, sw: 1 });
          line(svg, x + 86, Y + 18, x + NW, Y + 18, { stroke: C.faint, sw: 1 });
          T(svg, x + 98, Y - 5, "next →", { size: 7.5, fill: C.faint, mono: false });
          T(svg, x + 98, Y + 29, "← prev", { size: 7.5, fill: C.faint, mono: false });
        }
      });
      if (p.list.length >= cap) T(svg, X0 + (p.list.length - 1) * NW + 43, Y + 52, view === 1 ? "tail" : "dies next", { size: 10, fill: C.pink, mono: false });
      if (p.last && p.last.ev) T(svg, 752, Y + 6, p.last.ev + " evicted", { anchor: "end", size: 12, fill: C.pink, weight: 700 });
      /* all three policies on the same stream */
      var SY = 170;
      T(svg, 8, SY, "same accesses, all three policies (latest at right)", { anchor: "start", size: 9.5, fill: C.faint, mono: false });
      var recent = log.slice(-14);
      PN.forEach(function (nm, pi) {
        var yy = SY + 22 + pi * 34;
        T(svg, 8, yy, nm, { anchor: "start", size: 11, weight: 700, fill: pi === view ? C.blue : C.text });
        T(svg, 80, yy, pol[pi].hits + " hit" + (pol[pi].hits === 1 ? "" : "s"), { anchor: "start", size: 10, fill: C.faint });
        recent.forEach(function (e, j) {
          var hit = e.res[pi] === "hit", x = 150 + j * 43;
          rect(svg, x, yy - 12, 38, 24, { rx: 4, fill: hit ? C.green : C.pink, stroke: "none", op: 0.2 });
          T(svg, x + 19, yy, e.k, { size: 11, weight: 700, fill: hit ? C.green : C.pink });
        });
      });
      T(svg, 8, 318, "green = hit · pink = miss", { anchor: "start", size: 9.5, fill: C.faint, mono: false });
    }
    var kb = row(f.controls);
    KEYS.forEach(function (k) {
      var b = document.createElement("button"); b.type = "button"; b.textContent = "access " + k;
      b.addEventListener("click", function () {
        access(k); render();
        var e = log[log.length - 1];
        f.say(k + ": " + PN.map(function (nm, i) { return nm + " " + e.res[i]; }).join(" · ") + ".");
      });
      kb.appendChild(b);
    });
    K.tabs(f.controls, PN.map(function (x) { return "show " + x; }), 0, function (k) { view = k; render(); });
    var cb = row(f.controls);
    K.tabs(cb, ["capacity 2", "3", "4", "5"], 2, function (k) { cap = k + 2; reset(); render(); f.say("Capacity " + cap + ", empty cache."); });
    f.btn("cyclic scan A–E ×2", function () {
      reset(); "ABCDEABCDE".split("").forEach(access); render();
      f.say("Five keys in a loop through a capacity-" + cap + " cache: every policy that remembers recency or frequency evicts the key needed next. The chapter measured 0% for all three on 10,000 accesses.");
    });
    f.btn("reset", function () { reset(); render(); f.say("Empty cache, same capacity."); });
    reset(); render();
    f.say("Access keys and watch the list reorder. The tail is what dies next. Find a sequence where LRU evicts the key it is about to need and FIFO keeps it (capacity 2 makes it short).");
  };

  /* ------------------------------------------------------------------------
     dsaSweepLine — ch12 §1–§3. merge (touching intervals merge, as the
     chapter's s <= end test does), insert in three phases, meeting rooms
     with ends sorted before starts, union length by a counter.
     ------------------------------------------------------------------------ */
  VIZ.dsaSweepLine = function (el) {
    var f = frame(el);
    var SETS = [
      [[1, 4], [2, 6], [8, 10], [9, 12], [15, 18], [18, 20]],
      [[1, 3], [6, 9], [11, 13], [16, 19]],
      [[0, 5], [5, 10], [2, 7], [3, 11], [12, 15], [13, 18], [16, 20]],
      [[1, 5], [3, 8], [10, 12], [11, 16], [14, 15], [18, 20]]
    ];
    var NEW = [5, 12], NAMES = ["merge", "insert", "meeting rooms", "union length"];
    var prob = 2, tr = [];
    function build() {
      var iv = SETS[prob].map(function (x) { return x.slice(); }), out = [], i;
      if (prob === 0) {
        iv.sort(function (x, y) { return x[0] - y[0] || x[1] - y[1]; });
        var res = [iv[0].slice()];
        out.push({ iv: iv, x: iv[0][0], out: res.map(function (r) { return r.slice(); }), cur: 0, msg: "sorted by start; the first interval starts the output" });
        for (i = 1; i < iv.length; i++) {
          var s = iv[i][0], e = iv[i][1], last = res[res.length - 1];
          if (s <= last[1]) { last[1] = Math.max(last[1], e); out.push({ iv: iv, x: s, cur: i, out: res.map(function (r) { return r.slice(); }), msg: "[" + s + ", " + e + "] starts at or before the current end: absorb it" + (s === iv[i - 1][1] ? " (touching counts as overlapping here)" : "") }); }
          else { res.push([s, e]); out.push({ iv: iv, x: s, cur: i, out: res.map(function (r) { return r.slice(); }), msg: "[" + s + ", " + e + "] starts after the current end: emit and restart" }); }
        }
        out.push({ iv: iv, x: 21, out: res, done: true, msg: "done: " + res.length + " merged intervals" });
      } else if (prob === 1) {
        var r2 = [], k = 0, nw = NEW.slice();
        out.push({ iv: iv, nw: nw, x: 0, out: [], msg: "insert [" + NEW[0] + ", " + NEW[1] + "] into a sorted, merged list: three phases" });
        while (k < iv.length && iv[k][1] < nw[0]) { r2.push(iv[k]); out.push({ iv: iv, nw: nw, x: iv[k][1], cur: k, out: r2.slice(), msg: "phase 1: [" + iv[k] + "] ends before the new one starts: copy it" }); k++; }
        while (k < iv.length && iv[k][0] <= nw[1]) { nw = [Math.min(nw[0], iv[k][0]), Math.max(nw[1], iv[k][1])]; out.push({ iv: iv, nw: nw, x: iv[k][0], cur: k, out: r2.slice(), msg: "phase 2: [" + iv[k] + "] overlaps: widen the new interval to [" + nw + "]" }); k++; }
        r2.push(nw); out.push({ iv: iv, nw: nw, x: nw[1], out: r2.slice(), msg: "emit the widened interval [" + nw + "]" });
        while (k < iv.length) { r2.push(iv[k]); out.push({ iv: iv, nw: nw, x: iv[k][0], cur: k, out: r2.slice(), msg: "phase 3: copy [" + iv[k] + "]" }); k++; }
        out.push({ iv: iv, nw: nw, x: 21, out: r2, done: true, msg: "done in one pass: " + r2.length + " intervals" });
      } else {
        var ev = [];
        iv.forEach(function (x, j) { ev.push([x[0], 1, j]); ev.push([x[1], -1, j]); });
        ev.sort(function (p, q) { return p[0] - q[0] || p[1] - q[1]; });            // ends (−1) before starts (+1)
        var curN = 0, best = 0, active = [], covered = 0, prevX = null, bestAt = null;
        out.push({ iv: iv, x: -1, active: [], count: 0, best: 0, covered: 0, msg: "2n events sorted by coordinate; at a tie, an end comes before a start" });
        ev.forEach(function (e) {
          if (prob === 3 && prevX !== null && curN > 0) covered += e[0] - prevX;
          prevX = e[0];
          curN += e[1];
          if (e[1] > 0) active.push(e[2]); else active.splice(active.indexOf(e[2]), 1);
          if (curN > best) { best = curN; bestAt = e[0]; }
          out.push({ iv: iv, x: e[0], active: active.slice(), count: curN, best: best, bestAt: bestAt, covered: covered,
            msg: (e[1] > 0 ? "start of [" : "end of [") + iv[e[2]] + "] at " + e[0] + ": open count " + curN + (prob === 2 && curN === best && e[1] > 0 ? " — the peak so far" : "") +
              (prob === 3 ? " · covered so far " + covered : "") });
        });
        out.push({ iv: iv, x: 21, active: [], count: 0, best: best, bestAt: bestAt, covered: covered, done: true,
          msg: prob === 2 ? "rooms needed = the peak open count = " + best + ", first reached at " + bestAt : "union length = " + covered });
      }
      tr = out;
    }
    var svg = S("svg", { viewBox: "0 0 760 330", width: "100%", role: "img", "aria-label": "sweep line over intervals" }, f.body);
    function X(v) { return 40 + v / 20 * 680; }
    function draw(k) {
      clear(svg);
      var s = tr[k], iv = s.iv, RH = 22, Y0 = 36;
      T(svg, 8, 14, NAMES[prob] + " · step " + k + " of " + (tr.length - 1), { anchor: "start", size: 12, weight: 700 });
      for (var v = 0; v <= 20; v += 2) { line(svg, X(v), Y0 - 6, X(v), Y0 + iv.length * RH + 4, { stroke: C.line, sw: 0.4 }); T(svg, X(v), Y0 + iv.length * RH + 14, String(v), { size: 9, fill: C.faint }); }
      iv.forEach(function (x, j) {
        var on = s.active ? s.active.indexOf(j) >= 0 : s.cur === j;
        S("rect", { x: X(x[0]), y: Y0 + j * RH, width: Math.max(2, X(x[1]) - X(x[0])), height: 14, rx: 4, fill: on ? C.blue : C.faint, opacity: on ? 0.85 : 0.4 }, svg);
      });
      var yl = Y0 + iv.length * RH + 30;
      if (s.nw) { S("rect", { x: X(s.nw[0]), y: yl - 8, width: X(s.nw[1]) - X(s.nw[0]), height: 14, rx: 4, fill: C.orange, opacity: 0.8 }, svg); T(svg, 8, yl, "new", { anchor: "start", size: 9.5, fill: C.orange }); yl += 24; }
      if (s.out) {
        T(svg, 8, yl, "output", { anchor: "start", size: 9.5, fill: C.green });
        s.out.forEach(function (x) { S("rect", { x: X(x[0]), y: yl - 7, width: Math.max(2, X(x[1]) - X(x[0])), height: 14, rx: 4, fill: C.green, opacity: 0.75 }, svg); });
      }
      if (s.x >= 0 && s.x <= 20) {
        line(svg, X(s.x), Y0 - 12, X(s.x), yl + 16, { stroke: C.orange, sw: 2 });
        if (s.count !== undefined) T(svg, X(s.x), yl + 30, "open: " + s.count, { size: 12, weight: 700, fill: C.orange });
      }
      if (prob === 2) T(svg, 752, 14, "peak open so far: " + (s.best || 0), { anchor: "end", size: 12, weight: 700, fill: C.green });
      if (prob === 3) T(svg, 752, 14, "covered length: " + (s.covered || 0), { anchor: "end", size: 12, weight: 700, fill: C.green });
      T(svg, 8, 322, s.msg, { anchor: "start", size: 11.5, mono: false, fill: s.done ? C.green : C.text });
    }
    K.tabs(f.controls, NAMES, 2, function (k) { prob = k; build(); sp.reload();
      f.say(["Sorted by start, then one pass: absorb or emit.", "Copy before, absorb the overlap, copy after: three loops, one pass.",
        "The line sweeps right. The number below it is how many intervals are open. Find where it peaks.", "Add each gap's width while the open count is positive."][k]); });
    var sp = stepper(f, function () { return tr.length - 1; }, draw);
    build(); draw(0);
    f.say("The line sweeps right. The number below it is how many intervals are currently open. Step to the peak and compare it with the answer at the end.");
  };
})();
