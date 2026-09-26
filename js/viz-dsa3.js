/* ==========================================================================
   viz-dsa3.js — DSA By Patterns machines, stage 3: the second and third
   machines of Part 1's keystone chapters.

     dsaPotential      ch4  Stepper    actual cost, ΔΦ and the charge, for the array and the counter
     dsaEnterLeaveOnce ch4  Stepper    a monotonic-stack scan with its pushes and pops counted
     dsaSlidingWindow  ch8  Stepper    three windows, and total pointer movement against 2n
     dsaWindowFails    ch8  Comparator the min-length template against every window, with negatives
     dsaMonoDeque      ch10 Stepper    window maximum, and the elements that never were one
     dsaShuntingYard   ch10 Stepper    infix to RPN, one token at a time

   Routines are the chapters' own (longest_unique, min_len, window_max,
   to_rpn), conventions included. Needs viz-rag-kit.js and viz-dsa1.js.
   ========================================================================== */

(function () {
  "use strict";
  window.VIZ = window.VIZ || {};
  var K = window.RAGKIT, D = window.DSAKIT;
  if (!K || !D) throw new Error("viz-dsa3.js needs viz-rag-kit.js and viz-dsa1.js loaded first");
  var C = K.C, S = K.S, T = K.T, rect = K.rect, line = K.line, frame = K.frame;
  var clear = D.clear, commas = D.commas, focusable = D.focusable;

  function stepper(f, getLen, draw) {
    var pos = 0;
    function go(k) { pos = Math.max(0, Math.min(getLen(), k)); draw(pos); }
    f.btn("◂ back", function () { go(pos - 1); });
    f.btn("step ▸", function () { go(pos + 1); });
    f.btn("to end ⏭", function () { go(getLen()); });
    f.btn("reset", function () { go(0); });
    return { reload: function () { go(0); }, go: go };
  }
  function row(parent) {
    var s = document.createElement("span");
    s.style.cssText = "display:inline-flex;gap:6px;flex-wrap:wrap;align-items:center";
    parent.appendChild(s);
    return s;
  }
  function lcg(seed) {
    return function (k) { seed = (seed * 1103515245 + 12345) % 2147483648; return Math.floor(seed / 2147483648 * k); };
  }
  /* A row of value boxes; returns the x centre of box i. */
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

  /* ------------------------------------------------------------------------
     dsaPotential — ch4 §4. The array: Φ = 2·size − capacity, doubling from
     empty, one unit per store and per copy. The counter: Φ = number of 1
     bits, cost = bits flipped. Amortized = actual + ΔΦ.
     ------------------------------------------------------------------------ */
  VIZ.dsaPotential = function (el) {
    var f = frame(el);
    var which = 0, N = 33, tr = [];
    function build() {
      tr = []; var i, totA = 0, totC = 0;
      if (which === 0) {
        var size = 0, cap = 0;
        for (i = 1; i <= N; i++) {
          var phi0 = 2 * size - cap, cost = 1, grew = size === cap;
          if (grew) { cost += size; cap = Math.max(1, cap * 2); }
          size++;
          var phi1 = 2 * size - cap;
          totA += cost; totC += cost + phi1 - phi0;
          tr.push({ i: i, cost: cost, dphi: phi1 - phi0, charge: cost + phi1 - phi0, phi: phi1, totA: totA, totC: totC,
            what: grew ? "append " + i + " fills a full array: copy " + (size - 1) + " and store 1, capacity → " + cap : "append " + i + ": room left, store 1", spike: grew && size > 2 });
        }
      } else {
        var bits = 0;
        for (i = 1; i <= N; i++) {
          var t = 0; while ((bits >> t) & 1) t++;
          var ones0 = pop(bits); bits++; var ones1 = pop(bits);
          totA += t + 1; totC += t + 1 + ones1 - ones0;
          tr.push({ i: i, cost: t + 1, dphi: ones1 - ones0, charge: t + 1 + ones1 - ones0, phi: ones1, totA: totA, totC: totC, bits: bits,
            what: "increment to " + i + " (" + bits.toString(2) + "): flip " + t + " trailing 1" + (t === 1 ? "" : "s") + " and one 0", spike: t >= 3 });
        }
      }
    }
    function pop(x) { var c = 0; while (x) { c += x & 1; x >>= 1; } return c; }
    var svg = S("svg", { viewBox: "0 0 760 340", width: "100%", role: "img", "aria-label": "potential method: actual cost, change in potential, amortized charge" }, f.body);
    function draw(k) {
      clear(svg);
      var cur = k ? tr[k - 1] : null;
      T(svg, 8, 14, (which === 0 ? "doubling array, Φ = 2·size − capacity" : "binary counter, Φ = number of 1 bits") + " · step " + k + " of " + N,
        { anchor: "start", size: 12, weight: 700 });
      var X0 = 50, X1 = 750, Y0 = 36, Y1 = 196, top = which === 0 ? 34 : 7, bw = (X1 - X0) / N;
      line(svg, X0, Y1, X1, Y1, { stroke: C.line });
      [0, Math.round(top / 2), top].forEach(function (v) { T(svg, X0 - 6, Y1 - v / top * (Y1 - Y0), String(v), { anchor: "end", size: 9, fill: C.faint }); });
      tr.slice(0, k).forEach(function (s, j) {
        var h = s.cost / top * (Y1 - Y0);
        S("rect", { x: X0 + j * bw + 1, y: Y1 - h, width: Math.max(1, bw - 2), height: h, fill: s.spike ? C.orange : C.teal, opacity: 0.8 }, svg);
        S("circle", { cx: X0 + j * bw + bw / 2, cy: Y1 - s.charge / top * (Y1 - Y0), r: 3, fill: C.blue }, svg);
      });
      T(svg, X1, Y0 - 6, "bars: actual cost · dots: amortized charge", { anchor: "end", size: 9.5, fill: C.faint, mono: false });
      /* the three columns */
      var cols = [["actual cost", cur ? cur.cost : "—", C.orange], ["ΔΦ", cur ? (cur.dphi > 0 ? "+" : "") + cur.dphi : "—", C.dim],
        ["charged", cur ? cur.charge : "—", C.blue], ["Φ now", cur ? cur.phi : 0, C.faint]];
      cols.forEach(function (c, j) {
        T(svg, 90 + j * 170, 222, c[0], { size: 10, fill: C.faint, mono: false });
        T(svg, 90 + j * 170, 246, String(c[1]), { size: 22, weight: 700, fill: c[2] });
      });
      T(svg, 8, 284, "running totals — actual " + (cur ? commas(cur.totA) : 0) + " · charged " + (cur ? commas(cur.totC) : 0) +
        (cur ? (cur.totA <= cur.totC ? "   actual ≤ charged, because Φ never drops below its start" : "   BROKEN: actual exceeds charged") : ""),
        { anchor: "start", size: 11.5, fill: cur && cur.totA > cur.totC ? C.pink : C.green, mono: false });
      T(svg, 8, 306, cur ? cur.what : "Press step.", { anchor: "start", size: 11.5, mono: false });
      if (cur && cur.totA > cur.totC) throw new Error("dsaPotential: actual total exceeded amortized total");
    }
    K.tabs(f.controls, ["doubling array", "binary counter"], 0, function (k) {
      which = k; build(); sp.reload();
      f.say(k === 0 ? "Appends to a doubling array. Find a resize: the bar spikes and the dot stays at 3." : "Increments of a binary counter. The expensive increments clear the 1 bits earlier ones paid for; the charge stays at 2.");
    });
    var sp = stepper(f, function () { return N; }, draw);
    build(); draw(0);
    f.say("Three columns: what it cost, what changed in the bank, what you were charged. Step and watch them stay in balance; find the step where the actual cost spikes.");
  };

  /* ------------------------------------------------------------------------
     dsaEnterLeaveOnce — ch4 §5. One step is one arrival: all its pops, then
     its push. The scan pops while the top is smaller (next-greater style).
     ------------------------------------------------------------------------ */
  VIZ.dsaEnterLeaveOnce = function (el) {
    var f = frame(el);
    var SHAPES = {
      random: function () { var r = lcg(11), a = []; for (var i = 0; i < 14; i++) a.push(1 + r(9)); return a; },
      increasing: function () { var a = []; for (var i = 0; i < 14; i++) a.push(i + 1); return a; },
      decreasing: function () { var a = []; for (var i = 0; i < 14; i++) a.push(14 - i); return a; },
      "one tall arrival": function () { return [3, 9, 8, 7, 6, 5, 4, 3, 2, 10, 1, 4, 2, 6]; }
    };
    var names = Object.keys(SHAPES), shape = 3, a = [], tr = [];
    function build() {
      a = SHAPES[names[shape]]();
      var st = [], pushes = 0, pops = 0, maxPops = 0;
      tr = [{ st: [], pushes: 0, pops: 0, i: -1, popped: [], maxPops: 0 }];
      a.forEach(function (v, i) {
        var popped = [];
        while (st.length && a[st[st.length - 1]] < v) { popped.push(st.pop()); pops++; }
        st.push(i); pushes++;
        maxPops = Math.max(maxPops, popped.length);
        tr.push({ st: st.slice(), pushes: pushes, pops: pops, i: i, popped: popped, maxPops: maxPops });
      });
    }
    var svg = S("svg", { viewBox: "0 0 760 320", width: "100%", role: "img", "aria-label": "monotonic stack scan with push and pop counts" }, f.body);
    function draw(k) {
      clear(svg);
      var s = tr[k], n = a.length;
      T(svg, 8, 14, "arrival " + (s.i + 1) + " of " + n + " · pushes " + s.pushes + " · pops " + s.pops + " · n = " + n,
        { anchor: "start", size: 12.5, weight: 700 });
      T(svg, 752, 14, "most pops in one step: " + s.maxPops, { anchor: "end", size: 12, weight: 700, fill: C.orange });
      var bx = boxes(svg, a, 40, { style: function (i) {
        if (i === s.i) return { fill: C.blue, op: 0.3, stroke: C.blue, sw: 2 };
        if (s.popped.indexOf(i) >= 0) return { fill: C.orange, op: 0.3, stroke: C.orange, sw: 2 };
        if (s.st.indexOf(i) >= 0) return { stroke: C.teal, sw: 2 };
        if (i < s.i) return { col: C.faint };
        return {};
      } });
      /* the stack */
      T(svg, 8, 118, "stack (bottom → top)", { anchor: "start", size: 9.5, fill: C.faint, mono: false });
      s.st.forEach(function (idx, j) {
        rect(svg, 8 + j * 50, 128, 44, 30, { rx: 5, fill: C.card, stroke: j === s.st.length - 1 ? C.teal : C.line });
        T(svg, 30 + j * 50, 143, String(a[idx]), { size: 13, weight: 600 });
      });
      /* the two counters against n */
      function bar(y, label, v, col) {
        T(svg, 8, y + 9, label, { anchor: "start", size: 11, mono: false });
        rect(svg, 120, y, 560, 18, { rx: 4, fill: C.card });
        S("rect", { x: 120, y: y, width: 560 * v / n, height: 18, rx: 4, fill: col, opacity: 0.75 }, svg);
        T(svg, 752, y + 9, v + " / " + n, { anchor: "end", size: 11, weight: 600 });
      }
      bar(186, "total pushes", s.pushes, C.teal);
      bar(214, "total pops", s.pops, C.orange);
      var msg = s.i < 0 ? "Press step: each step is one arrival, with all the pops it causes." :
        s.popped.length ? a[s.i] + " arrives and pops " + s.popped.length + " smaller element" + (s.popped.length === 1 ? "" : "s") + " (" + s.popped.map(function (j) { return a[j]; }).join(", ") + "), then is pushed" :
        a[s.i] + " arrives, pops nothing, is pushed";
      T(svg, 8, 262, msg, { anchor: "start", size: 11.5, mono: false, fill: s.popped.length >= 6 ? C.orange : C.text });
      T(svg, 8, 284, "an element is pushed once and popped at most once: pushes ≤ n and pops ≤ n, so the whole scan is ≤ 2n however the pops bunch up",
        { anchor: "start", size: 10, fill: C.faint, mono: false });
    }
    K.tabs(f.controls, names, shape, function (k) { shape = k; build(); sp.reload();
      f.say(names[k] === "decreasing" ? "Nothing is ever popped: the stack grows to n. Worst for space." :
        names[k] === "increasing" ? "Every arrival pops exactly one: the pops total n − 1." : "Step through and watch the counters against n."); });
    var sp = stepper(f, function () { return a.length; }, draw);
    build(); draw(0);
    f.say("The inner loop looks nested. Count the pushes and pops and see what it really is. Find the step that pops six at once, then check both counters are still at most n.");
  };

  /* ------------------------------------------------------------------------
     dsaSlidingWindow — ch8 §5. Pointer movement counts every advance of
     either edge, a jump of d counting d, as the chapter measured it.
     ------------------------------------------------------------------------ */
  VIZ.dsaSlidingWindow = function (el) {
    var f = frame(el);
    var PROBS = [
      { name: "longest without repeat", a: "abcabcbbdefgad".split(""), kind: "longest" },
      { name: "min length, sum ≥ 15", a: [2, 3, 1, 2, 4, 3, 7, 1, 2, 8, 1, 1, 5, 4], kind: "shortest", target: 15 },
      { name: "longest, at most 2 distinct", a: "aabcbbcaacccbd".split(""), kind: "atmost", K: 2 }
    ];
    var p = 0, tr = [];
    function build() {
      var P = PROBS[p], a = P.a, n = a.length, out = [], left = 0, moves = 0, best, bl = -1, br = -1, right;
      if (P.kind === "longest") {
        var last = {}; best = 0;
        for (right = 0; right < n; right++) {
          moves++;                                               // right advanced
          var jump = 0;
          if (last[a[right]] !== undefined && last[a[right]] >= left) { jump = last[a[right]] + 1 - left; left = last[a[right]] + 1; moves += jump; }
          last[a[right]] = right;
          if (right - left + 1 > best) { best = right - left + 1; bl = left; br = right; }
          out.push({ l: left, r: right, moves: moves, jump: jump, best: best, bl: bl, br: br,
            msg: jump ? "'" + a[right] + "' repeats inside the window: left jumps " + jump + " position" + (jump === 1 ? "" : "s") + " past the earlier copy" : "extend right: '" + a[right] + "' is new to the window" });
        }
      } else if (P.kind === "shortest") {
        var s = 0; best = Infinity;
        for (right = 0; right < n; right++) {
          s += a[right]; moves++;
          var shrunk = 0;
          while (s >= P.target) { if (right - left + 1 < best) { best = right - left + 1; bl = left; br = right; } s -= a[left]; left++; moves++; shrunk++; }
          out.push({ l: left, r: right, moves: moves, jump: shrunk, best: best, bl: bl, br: br, sum: s,
            msg: shrunk ? "sum reached " + P.target + ": record, then shrink while still valid — left moved " + shrunk : "sum " + s + " < " + P.target + ": extend right" });
        }
      } else {
        var cnt = {}, distinct = 0; best = 0;
        for (right = 0; right < n; right++) {
          if (!cnt[a[right]]) distinct++;
          cnt[a[right]] = (cnt[a[right]] || 0) + 1; moves++;
          var sh = 0;
          while (distinct > P.K) { cnt[a[left]]--; if (!cnt[a[left]]) distinct--; left++; moves++; sh++; }
          if (right - left + 1 > best) { best = right - left + 1; bl = left; br = right; }
          out.push({ l: left, r: right, moves: moves, jump: sh, best: best, bl: bl, br: br,
            msg: sh ? "a third distinct value: shrink while invalid — left moved " + sh : "extend right: still at most " + P.K + " distinct" });
        }
      }
      tr = out;
    }
    var svg = S("svg", { viewBox: "0 0 760 300", width: "100%", role: "img", "aria-label": "sliding window" }, f.body);
    function draw(k) {
      clear(svg);
      var P = PROBS[p], a = P.a, n = a.length, s = k ? tr[k - 1] : null;
      T(svg, 8, 14, P.name + " · step " + k + " of " + n, { anchor: "start", size: 12.5, weight: 700 });
      var best = s ? (s.best === Infinity ? "none yet" : s.best) : "—";
      T(svg, 752, 14, (P.kind === "shortest" ? "shortest valid: " : "longest valid: ") + best, { anchor: "end", size: 12, weight: 700, fill: C.green });
      var bx = boxes(svg, a, 50, { style: function (i) {
        if (s && i >= s.l && i <= s.r) return { fill: C.blue, op: 0.25, stroke: C.blue, sw: 1.6 };
        if (s && i < s.l) return { col: C.faint };
        return {};
      } });
      if (s && s.bl >= 0) S("rect", { x: bx.left(s.bl) + 2, y: 40, width: (s.br - s.bl + 1) * bx.W - 4, height: 4, rx: 2, fill: C.green }, svg);
      if (s) {
        [["left", s.l, C.blue], ["right", s.r, C.orange]].forEach(function (pp, j) {
          if (pp[1] >= n) return;
          S("path", { d: "M " + bx.x(pp[1]) + " " + (108 + j * 22) + " l -6 10 l 12 0 z", fill: pp[2] }, svg);
          T(svg, bx.x(pp[1]) + 10, 116 + j * 22, pp[0], { anchor: "start", size: 10, fill: pp[2], weight: 600 });
        });
      }
      /* total pointer movement against 2n */
      var mv = s ? s.moves : 0;
      T(svg, 8, 190, "total pointer movement", { anchor: "start", size: 11, mono: false });
      rect(svg, 170, 181, 500, 18, { rx: 4, fill: C.card });
      S("rect", { x: 170, y: 181, width: 500 * mv / (2 * n), height: 18, rx: 4, fill: C.orange, opacity: 0.75 }, svg);
      T(svg, 752, 190, mv + " / 2n = " + 2 * n, { anchor: "end", size: 11, weight: 600 });
      T(svg, 8, 226, s ? s.msg : "Press step: the right edge grows by one each step; the left edge moves only when the rule says so.",
        { anchor: "start", size: 11.5, mono: false, fill: s && s.jump >= 2 ? C.orange : C.text });
      T(svg, 8, 250, "green bar = best window so far · faded values have left the window for good", { anchor: "start", size: 9.5, fill: C.faint, mono: false });
    }
    K.tabs(f.controls, PROBS.map(function (x) { return x.name; }), 0, function (k) { p = k; build(); sp.reload();
      f.say(PROBS[k].kind === "shortest" ? "Shortest valid window: shrink while the window is valid, recording before each shrink." :
        PROBS[k].kind === "atmost" ? "Longest valid window: shrink while it is invalid, record after. At most K distinct is the monotone half of exactly K." :
        "Longest without a repeat: the left edge jumps past the earlier copy in one assignment."); });
    var sp = stepper(f, function () { return PROBS[p].a.length; }, draw);
    build(); draw(0);
    f.say("Grow right, shrink left. The counter is total pointer movement: find a step where the left edge jumps several places, and watch the total stay under 2n.");
  };

  /* ------------------------------------------------------------------------
     dsaWindowFails — ch8 §6. The chapter's min_len template against a
     brute force over every window, on an input the reader edits.
     ------------------------------------------------------------------------ */
  VIZ.dsaWindowFails = function (el) {
    var f = frame(el);
    var a = [2, 3, 1, 2, 4, 3], target = 7, rnd = lcg(5), trail = [];
    function template() {
      var best = Infinity, s = 0, left = 0, rec = null;
      trail = [];
      for (var right = 0; right < a.length; right++) {
        s += a[right];
        while (s >= target) {
          if (right - left + 1 < best) { best = right - left + 1; rec = [left, right]; }
          trail.push([left, right]);
          s -= a[left]; left++;
        }
      }
      return { best: best, rec: rec };
    }
    function brute() {
      var best = Infinity, rec = null;
      for (var i = 0; i < a.length; i++) { var s = 0; for (var j = i; j < a.length; j++) { s += a[j]; if (s >= target && j - i + 1 < best) { best = j - i + 1; rec = [i, j]; } } }
      return { best: best, rec: rec };
    }
    var svg = S("svg", { viewBox: "0 0 760 320", width: "100%", role: "group", "aria-label": "sliding window template against brute force" }, f.body);
    function render() {
      clear(svg);
      var tpl = template(), br = brute(), agree = tpl.best === br.best;
      T(svg, 8, 14, "min length with sum ≥ " + target + " · click a value to change it", { anchor: "start", size: 12.5, weight: 700 });
      var bx = boxes(svg, a, 40, { style: function (i) { return a[i] < 0 ? { col: C.pink } : {}; } });
      a.forEach(function (v, i) {
        var hit = S("rect", { x: bx.left(i), y: 40, width: bx.W, height: 34, fill: "transparent" }, svg);
        function bump() { a[i] = a[i] >= 6 ? -3 : a[i] + 1; render(); speak(); }
        hit.addEventListener("click", bump); focusable(hit, "value " + i + " is " + a[i] + ", click to add one (wraps from 6 to −3)", bump);
      });
      function show(y, name, res, col) {
        T(svg, 8, y, name, { anchor: "start", size: 11.5, weight: 700, fill: col, mono: false });
        T(svg, 752, y, "answer: " + (res.best === Infinity ? "∞ (never found a window)" : res.best), { anchor: "end", size: 12, weight: 700, fill: col });
        if (res.rec) S("rect", { x: bx.left(res.rec[0]) + 3, y: y + 8, width: (res.rec[1] - res.rec[0] + 1) * bx.W - 6, height: 8, rx: 3, fill: col, opacity: 0.8 }, svg);
      }
      show(116, "the template (shrink while valid)", tpl, C.orange);
      show(150, "every window checked (brute force)", br, C.teal);
      T(svg, 8, 190, "windows the template ever recorded: " + (trail.length ? trail.map(function (w) { return "[" + w[0] + ".." + w[1] + "]"; }).join(" ") : "none"),
        { anchor: "start", size: 10.5, fill: C.dim, mono: false });
      rect(svg, 8, 206, 744, 34, { rx: 6, fill: agree ? C.green : C.pink, stroke: "none", op: 0.15 });
      T(svg, 380, 223, agree ? "they agree on this input" : "they disagree: the template missed a shorter window", { size: 13, weight: 700, fill: agree ? C.green : C.pink, mono: false });
      T(svg, 8, 262, "length " + a.length + " · negatives in pink", { anchor: "start", size: 10, fill: C.faint, mono: false });
    }
    function speak() {
      var tpl = template(), br = brute();
      if (tpl.best !== br.best && a.length <= 2) f.say("Separated with " + a.length + " elements: the smallest possible. The left edge never had a reason to move past the value dragging the sum down.");
      else if (tpl.best !== br.best) f.say("Separated. Now shrink it: remove elements and adjust values while they still disagree. The smallest separating input has two elements.");
      else f.say("They agree. With only non-negative values they always will: extending the window can only raise the sum.");
    }
    f.btn("target −1", function () { target--; render(); speak(); });
    f.btn("target +1", function () { target++; render(); speak(); });
    f.btn("add element", function () { if (a.length < 10) a.push(1); render(); speak(); });
    f.btn("remove last", function () { if (a.length > 1) a.pop(); render(); speak(); });
    f.btn("random (−3 to 6)", function () { var n = 3 + rnd(5); a = []; for (var i = 0; i < n; i++) a.push(rnd(10) - 3); target = 1 + rnd(8); render(); speak(); });
    f.btn("reset", function () { a = [2, 3, 1, 2, 4, 3]; target = 7; render(); speak(); });
    render();
    f.say("The template works when every value is non-negative. Put a negative in, or press random, and find an input where the two answers differ.");
  };

  /* ------------------------------------------------------------------------
     dsaMonoDeque — ch10 §5. The chapter's window_max: evict dominated
     elements from the back with <=, expire the front by index.
     ------------------------------------------------------------------------ */
  VIZ.dsaMonoDeque = function (el) {
    var f = frame(el);
    var A = [4, 2, 12, 3, 8, 7, 1, 6, 5, 11, 2, 9, 10, 3], k = 3, tr = [];
    function build() {
      var dq = [], out = [], wasMax = {}, pushed = {}, popped = {}, maxLen = 0;
      tr = [{ dq: [], out: [], i: -1, msg: "Press step: each step is one arrival" }];
      A.forEach(function (v, i) {
        var evicted = [];
        while (dq.length && A[dq[dq.length - 1]] <= v) { var j = dq.pop(); evicted.push(j); popped[j] = 1; }
        dq.push(i); pushed[i] = 1;
        var expired = null;
        if (dq[0] <= i - k) { expired = dq.shift(); popped[expired] = 1; }
        if (i >= k - 1) { out.push(A[dq[0]]); wasMax[dq[0]] = 1; }
        maxLen = Math.max(maxLen, dq.length);
        var never = Object.keys(popped).map(Number).filter(function (x) { return !wasMax[x]; });
        tr.push({ dq: dq.slice(), out: out.slice(), i: i, evicted: evicted, expired: expired, never: never, maxLen: maxLen,
          msg: A[i] + " arrives" + (evicted.length ? ", evicting " + evicted.map(function (j) { return A[j]; }).join(", ") + " from the back (older and not larger: never the max again)" : "") +
            (expired !== null ? "; " + A[expired] + " expires from the front" : "") + (i >= k - 1 ? "; window max " + A[dq[0]] : "") });
      });
    }
    var svg = S("svg", { viewBox: "0 0 760 320", width: "100%", role: "img", "aria-label": "monotonic deque for the sliding window maximum" }, f.body);
    function draw(step) {
      clear(svg);
      var s = tr[step];
      T(svg, 8, 14, "window size k = " + k + " · step " + step + " of " + A.length, { anchor: "start", size: 12.5, weight: 700 });
      var bx = boxes(svg, A, 36, { style: function (i) {
        var inW = s.i >= 0 && i <= s.i && i > s.i - k;
        if (s.evicted && s.evicted.indexOf(i) >= 0) return { fill: C.orange, op: 0.3, stroke: C.orange, sw: 2 };
        if (s.dq.indexOf(i) >= 0) return { fill: C.teal, op: 0.3, stroke: C.teal, sw: 2 };
        if (inW) return { stroke: C.blue, sw: 1.6 };
        if (s.never && s.never.indexOf(i) >= 0) return { col: C.faint };
        return {};
      } });
      if (s.i >= 0) {
        var lo = Math.max(0, s.i - k + 1);
        S("rect", { x: bx.left(lo), y: 30, width: (s.i - lo + 1) * bx.W, height: 46, rx: 6, fill: "none", stroke: C.blue, "stroke-width": 1.5, "stroke-dasharray": "5 3" }, svg);
      }
      T(svg, 8, 112, "deque, front → back (values decreasing)", { anchor: "start", size: 9.5, fill: C.faint, mono: false });
      s.dq.forEach(function (idx, j) {
        rect(svg, 8 + j * 60, 122, 54, 30, { rx: 5, fill: j === 0 ? C.green : C.card, stroke: j === 0 ? C.green : C.line, op: j === 0 ? 0.3 : 1 });
        T(svg, 35 + j * 60, 137, String(A[idx]), { size: 13, weight: 700 });
      });
      T(svg, 8, 178, "maxima emitted: " + (s.out.length ? s.out.join(", ") : "—"), { anchor: "start", size: 12, fill: C.green, weight: 600 });
      T(svg, 8, 202, "popped without ever being the window maximum: " + (s.never && s.never.length ? s.never.map(function (j) { return A[j]; }).join(", ") : "—"),
        { anchor: "start", size: 11.5, fill: C.dim, mono: false });
      T(svg, 752, 112, "largest the deque has been: " + (s.maxLen || 0) + " (window " + k + ")", { anchor: "end", size: 10.5, fill: C.faint, mono: false });
      T(svg, 8, 236, s.msg, { anchor: "start", size: 11.5, mono: false });
    }
    K.slider(f.controls, "k", 2, 6, k, 1, function (v) { return String(v); }, function (v) { k = v; build(); sp.reload(); });
    var sp = stepper(f, function () { return A.length; }, draw);
    build(); draw(0);
    f.say("The deque holds only the candidates. Watch how few survive, and find an element that is pushed and popped without ever being the window maximum.");
  };

  /* ------------------------------------------------------------------------
     dsaShuntingYard — ch10 §7. The chapter's to_rpn: an operator is forced
     out by one of greater or equal precedence (>=, so left-associative).
     ------------------------------------------------------------------------ */
  VIZ.dsaShuntingYard = function (el) {
    var f = frame(el);
    var PREC = { "+": 1, "-": 1, "*": 2, "/": 2 };
    var PRESETS = ["3+4*2-(1+1)", "8-3-2", "2*(3+4)*5", "1+2*3-4/2"];
    var expr = PRESETS[0], tr = [], err = null;
    function tokenize(s) {
      var t = [], m, re = /\s*(\d+|[()+\-*/])\s*/g, last = 0;
      s = s.replace(/\s+/g, "");
      while ((m = re.exec(s))) { if (m.index !== last) return null; t.push(m[1]); last = re.lastIndex; }
      return last === s.length && t.length ? t : null;
    }
    function build() {
      err = null; tr = [];
      var toks = tokenize(expr);
      if (!toks) { err = "Only whole numbers, + − * / and parentheses."; return; }
      var out = [], ops = [], depth = 0;
      tr.push({ toks: toks, i: -1, out: [], ops: [], msg: "numbers go straight to the output; operators wait on the stack" });
      for (var i = 0; i < toks.length; i++) {
        var t = toks[i];
        if (/^\d+$/.test(t)) { out.push(t); tr.push({ toks: toks, i: i, out: out.slice(), ops: ops.slice(), msg: t + " is a number: to the output" }); }
        else if (t === "(") { ops.push(t); depth++; tr.push({ toks: toks, i: i, out: out.slice(), ops: ops.slice(), msg: "( waits on the stack as a fence" }); }
        else if (t === ")") {
          if (!depth) { err = "Unbalanced: a ) with no ( before it."; return; }
          while (ops[ops.length - 1] !== "(") { var o = ops.pop(); out.push(o); tr.push({ toks: toks, i: i, out: out.slice(), ops: ops.slice(), forced: o, msg: ") pops " + o + " to the output" }); }
          ops.pop(); depth--; tr.push({ toks: toks, i: i, out: out.slice(), ops: ops.slice(), msg: ") discards its matching (" });
        } else {
          while (ops.length && ops[ops.length - 1] !== "(" && PREC[ops[ops.length - 1]] >= PREC[t]) {
            var o2 = ops.pop(); out.push(o2);
            tr.push({ toks: toks, i: i, out: out.slice(), ops: ops.slice(), forced: o2, msg: t + " arrives: " + o2 + " on the stack has " + (PREC[o2] > PREC[t] ? "higher" : "equal") + " precedence, so it is forced out" });
          }
          ops.push(t); tr.push({ toks: toks, i: i, out: out.slice(), ops: ops.slice(), msg: t + " waits on the stack" });
        }
      }
      if (depth) { err = "Unbalanced: a ( is never closed."; return; }
      while (ops.length) { var o3 = ops.pop(); out.push(o3); tr.push({ toks: toks, i: toks.length, out: out.slice(), ops: ops.slice(), forced: o3, msg: "input done: flush " + o3 }); }
      var st = [], okDiv = true, bad = false;
      out.forEach(function (x) {
        if (/^\d+$/.test(x)) st.push(+x);
        else if (st.length < 2) bad = true;
        else { var b = st.pop(), a = st.pop(); if (x === "/" && b === 0) okDiv = false; st.push(x === "+" ? a + b : x === "-" ? a - b : x === "*" ? a * b : a / b); }
      });
      if (bad || st.length !== 1) { err = "Every operator needs a number on each side (no unary minus)."; tr = []; return; }
      var val = okDiv ? st[0] : "undefined (division by zero)";
      tr[tr.length - 1].msg += " · RPN evaluates to " + (typeof val === "number" ? +val.toFixed(6) : val);
    }
    var svg = S("svg", { viewBox: "0 0 760 300", width: "100%", role: "img", "aria-label": "shunting-yard: operator stack and output queue" }, f.body);
    function draw(k) {
      clear(svg);
      if (err) { T(svg, 380, 120, err, { size: 13, fill: C.pink, mono: false }); return; }
      var s = tr[k];
      T(svg, 8, 14, "step " + k + " of " + (tr.length - 1), { anchor: "start", size: 12, weight: 700 });
      var W = Math.min(40, 720 / s.toks.length);
      s.toks.forEach(function (t, i) {
        var done = i < s.i, cur = i === s.i;
        rect(svg, 20 + i * W, 32, W - 4, 30, { rx: 5, fill: cur ? C.blue : C.card, stroke: cur ? C.blue : C.line, op: cur ? 0.3 : 1 });
        T(svg, 20 + i * W + (W - 4) / 2, 47, t, { size: 14, weight: 600, fill: done ? C.faint : C.text });
      });
      T(svg, 8, 90, "operator stack (top on the right)", { anchor: "start", size: 9.5, fill: C.faint, mono: false });
      s.ops.forEach(function (o, j) {
        rect(svg, 8 + j * 44, 100, 38, 30, { rx: 5, fill: C.card, stroke: j === s.ops.length - 1 ? C.orange : C.line });
        T(svg, 27 + j * 44, 115, o, { size: 15, weight: 700, fill: C.orange });
      });
      T(svg, 8, 160, "output (RPN)", { anchor: "start", size: 9.5, fill: C.faint, mono: false });
      s.out.forEach(function (o, j) {
        var isF = s.forced && j === s.out.length - 1;
        rect(svg, 8 + j * 38, 170, 34, 30, { rx: 5, fill: isF ? C.orange : C.card, stroke: isF ? C.orange : C.line, op: isF ? 0.35 : 1 });
        T(svg, 25 + j * 38, 185, o, { size: 14, weight: 600 });
      });
      T(svg, 8, 234, s.msg, { anchor: "start", size: 11.5, mono: false, fill: s.forced ? C.orange : C.text });
    }
    var inp = document.createElement("input");
    inp.type = "text"; inp.value = expr; inp.setAttribute("aria-label", "infix expression");
    inp.style.cssText = "width:14em;font:14px ui-monospace,Menlo,monospace";
    inp.addEventListener("input", function () { expr = inp.value; build(); sp.reload(); f.say(err ? err : "Step through it. An orange output box is an operator forced out of the stack."); });
    f.controls.appendChild(inp);
    var pr = row(f.controls);
    PRESETS.forEach(function (p) {
      var b = document.createElement("button"); b.type = "button"; b.textContent = p;
      b.addEventListener("click", function () { expr = p; inp.value = p; build(); sp.reload();
        f.say(p === "8-3-2" ? "Equal precedence: the second − forces the first out, so it evaluates as (8 − 3) − 2 = 3." : "Step through it. An orange output box is an operator forced out of the stack."); });
      pr.appendChild(b);
    });
    var sp = stepper(f, function () { return err ? 0 : tr.length - 1; }, draw);
    build(); draw(0);
    f.say("Type an expression. Watch operators wait on the stack until precedence evicts them: find the step where one is forced out.");
  };
})();
