/* ==========================================================================
   viz-dsa4.js — DSA By Patterns machines, Part 2 (Order and Lookup, ch13–17).

     dsaBinarySearch       ch13 Stepper    lower/upper bound and find, half-open, closed or mixed
     dsaSearchOverflow     ch13 Playground (lo + hi) / 2 against lo + (hi − lo) / 2 in 32-bit ints
     dsaRotatedSearch      ch13 Stepper    which half is sorted, and the duplicates that hide it
     dsaBinarySearchAnswer ch14 Tuner      a candidate, its predicate, and the lower-bound loop over it
     dsaSortRace           ch15 Comparator six sorts, six input shapes, comparisons counted
     dsaPartition          ch15 Stepper    Lomuto, Hoare and three-way; recursion depth tracked
     dsaRadixSort          ch15 Builder    LSD passes against bucket count as the digit widens
     dsaTimsort            ch16 Stepper    runs, the merge stack's two invariants, galloping
     dsaHashTable          ch17 Builder    chaining and three probe sequences; tombstones on or off
     dsaLoadFactor         ch17 Tuner      Knuth's formulas against a simulated table
     dsaHashFlood          ch17 Simulator  k mod 101 against a randomly drawn ((a·k + b) mod p) mod 101

   Routines are the chapters' own (lower_bound, can_finish, can_ship,
   split_array, max_min_gap, partition3, ProbingMap, ChainedMap), conventions
   included. Needs viz-rag-kit.js and viz-dsa1.js.
   ========================================================================== */

(function () {
  "use strict";
  window.VIZ = window.VIZ || {};
  var K = window.RAGKIT, D = window.DSAKIT;
  if (!K || !D) throw new Error("viz-dsa4.js needs viz-rag-kit.js and viz-dsa1.js loaded first");
  var C = K.C, S = K.S, T = K.T, rect = K.rect, line = K.line, frame = K.frame;
  var clear = D.clear, commas = D.commas, stepper = D.stepper, row = D.row, lcg = D.lcg, boxes = D.boxes;

  function svgOf(f, h, label) { return S("svg", { viewBox: "0 0 760 " + h, width: "100%", role: "img", "aria-label": label }, f.body); }
  function say(svg, y, msg, col) { return T(svg, 8, y, msg, { anchor: "start", size: 11.5, mono: false, fill: col || C.text }); }

  /* ------------------------------------------------------------------------
     dsaBinarySearch — ch13 §1–4. Half-open is the chapter's lower_bound;
     closed is its second consistent spelling; mixed is hi = len(a) with
     hi = mid under while lo <= hi, the spelling §2 measured never ending.
     ------------------------------------------------------------------------ */
  VIZ.dsaBinarySearch = function (el) {
    var f = frame(el);
    var A = [3, 7, 7, 10, 14, 14, 14, 19, 23, 28, 31, 31, 40, 45, 52, 60], n = A.length;
    var VARS = ["lower bound", "upper bound", "find"], CONV = ["half-open [lo, hi)", "closed [lo, hi]", "mixed ✗"];
    var v = 0, cv = 0, target = 14, tr = [];
    function build() {
      var closed = cv === 1, mixed = cv === 2;
      var lo = 0, hi = closed ? n - 1 : n, cmp = 0, out = [], steps = 0;
      function band() { return closed ? hi - lo + 1 : hi - lo; }
      out.push({ lo: lo, hi: hi, mid: -1, cmp: 0, w: band(), msg: "The band is every index the answer could still be at: all of them." });
      while (closed || mixed ? lo <= hi : lo < hi) {
        if (++steps > 40) break;
        var mid = lo + ((hi - lo) >> 1), w0 = band();
        if (mid >= n) { out.push({ lo: lo, hi: hi, mid: mid, cmp: cmp, w: w0, bad: "crash", msg: "mid = " + mid + ": a[" + mid + "] is past the end. IndexError — the loop let lo reach len(a)." }); return (tr = out); }
        var x = A[mid], goRight, found = false;
        cmp++;
        if (v === 2 && x === target) found = true;
        else goRight = v === 1 ? x <= target : x < target;
        if (found) { out.push({ lo: lo, hi: hi, mid: mid, cmp: cmp, w: w0, res: mid, msg: "a[" + mid + "] = " + x + " is the target: return " + mid }); return (tr = out); }
        var why = "a[" + mid + "] = " + x + (goRight ? (v === 1 ? " ≤ " : " < ") + target + ": mid cannot be the answer, lo = mid + 1" : (v === 1 ? " > " : v === 2 ? " > " : " ≥ ") + target + ": ");
        if (goRight) lo = mid + 1;
        else if (closed) { hi = mid - 1; why += "hi = mid − 1 (closed: mid is excluded)"; }
        else { hi = mid; why += "hi = mid (mid might be the answer; half-open keeps it)"; }
        var w1 = band();
        out.push({ lo: lo, hi: hi, mid: mid, cmp: cmp, w: w1, msg: why });
        if (w1 >= w0) { out[out.length - 1].bad = "loop"; out[out.length - 1].msg = "lo = hi = " + lo + " and hi = mid leaves it there: the band did not shrink. This loop never ends."; return (tr = out); }
      }
      var res = v === 2 ? -1 : lo;
      out.push({ lo: lo, hi: hi, mid: -1, cmp: cmp, w: band(), res: res, done: true,
        msg: v === 2 ? target + " is not in the array: return −1" : "band empty: return lo = " + lo + (v === 0 ? " (first index with a[i] ≥ " + target + ")" : " (first index with a[i] > " + target + ")") });
      tr = out;
    }
    var svg = svgOf(f, 290, "binary search with the invariant band shaded");
    function draw(k) {
      clear(svg);
      var s = tr[k], closed = cv === 1;
      T(svg, 8, 14, VARS[v] + " of " + target + " · " + CONV[cv] + " · comparisons " + s.cmp, { anchor: "start", size: 12.5, weight: 700 });
      if (s.res !== undefined) T(svg, 752, 14, "returns " + s.res, { anchor: "end", size: 13, weight: 700, fill: C.green });
      var bx = boxes(svg, A, 56, { style: function (i) {
        if (i === s.mid) return { fill: s.bad ? C.pink : C.orange, op: 0.35, stroke: s.bad ? C.pink : C.orange, sw: 2 };
        var inBand = closed ? i >= s.lo && i <= s.hi : i >= s.lo && i < s.hi;
        return inBand ? { fill: C.blue, op: 0.22, stroke: C.blue, sw: 1.4 } : { col: C.faint };
      } });
      var left = bx.left(Math.min(s.lo, n)), right = closed ? bx.left(s.hi + 1) : bx.left(Math.min(s.hi, n));
      if (right > left) S("rect", { x: left, y: 46, width: right - left, height: 4, rx: 2, fill: C.blue }, svg);
      T(svg, 752, 40, "band width " + Math.max(0, s.w), { anchor: "end", size: 10.5, fill: C.blue, weight: 600 });
      [["lo", s.lo, C.teal, 0], ["hi", s.hi, C.pink, 1]].forEach(function (p) {
        var x = p[1] >= n ? bx.left(n) : p[1] < 0 ? bx.left(0) - 8 : bx.x(p[1]);
        S("path", { d: "M " + x + " " + (116 + p[3] * 22) + " l -6 10 l 12 0 z", fill: p[2] }, svg);
        T(svg, x > 680 ? x - 10 : x + 10, 124 + p[3] * 22, p[0] + " = " + p[1], { anchor: x > 680 ? "end" : "start", size: 10, fill: p[2], weight: 600 });
      });
      /* band width after each step: must strictly fall */
      T(svg, 8, 184, "band width after each step:", { anchor: "start", size: 10.5, fill: C.faint, mono: false });
      tr.slice(0, k + 1).forEach(function (t, j) {
        T(svg, 190 + j * 30, 184, String(Math.max(0, t.w)), { size: 11, weight: 600, fill: t.bad ? C.pink : C.dim });
      });
      say(svg, 216, s.msg, s.bad ? C.pink : s.done || s.res !== undefined ? C.green : C.text);
      T(svg, 8, 244, "lower bound: first a[i] ≥ t · upper bound: first a[i] > t · for an absent t the two agree on the insertion point",
        { anchor: "start", size: 9.5, fill: C.faint, mono: false });
    }
    K.tabs(f.controls, VARS, 0, function (k) { v = k; build(); sp.reload(); });
    K.tabs(f.controls, CONV, 0, function (k) { cv = k; build(); sp.reload();
      f.say(k === 2 ? "hi = len(a) with hi = mid, but the loop runs while lo <= hi: two conventions mixed. Find the input that loops and the one that crashes." : "Step and watch the band. Every step must shrink it."); });
    K.slider(f.controls, "target", 0, 64, target, 1, String, function (t) { target = t; build(); sp.reload(); });
    var sp = stepper(f, function () { return tr.length - 1; }, draw);
    build(); draw(0);
    f.say("The shaded band is where the answer must be; every step must shrink it. Search 14 (three copies) under each variant, then a value that is absent.");
  };

  /* ------------------------------------------------------------------------
     dsaSearchOverflow — ch13 §5. Java int arithmetic: the sum wraps modulo
     2³², and / truncates toward zero.
     ------------------------------------------------------------------------ */
  VIZ.dsaSearchOverflow = function (el) {
    var f = frame(el);
    var MAX = 2147483647, lo = 1073741824, hi = 1073741824, showN = true, showS = true;
    var svg = svgOf(f, 300, "naive and safe midpoints on a 32-bit number line");
    function wrap(x) { return x > MAX ? x - 4294967296 : x; }
    function render() {
      clear(svg);
      if (lo > hi) { var t = lo; lo = hi; hi = t; }
      var sum = lo + hi, wrapped = wrap(sum), naive = Math.trunc(wrapped / 2), safe = lo + Math.trunc((hi - lo) / 2);
      var X0 = 30, X1 = 730, px = function (v) { return X0 + (v + 2147483648) / 4294967296 * (X1 - X0); };
      T(svg, 8, 14, "32-bit signed int, as in Java or C · lo = " + commas(lo) + " · hi = " + commas(hi), { anchor: "start", size: 12, weight: 700 });
      line(svg, X0, 120, X1, 120, { stroke: C.line, sw: 2 });
      [[-2147483648, "−2,147,483,648"], [0, "0"], [MAX, "2,147,483,647"]].forEach(function (p) {
        line(svg, px(p[0]), 114, px(p[0]), 126, { stroke: C.faint });
        T(svg, px(p[0]), 138, p[1], { size: 9.5, fill: C.faint, anchor: p[0] < 0 ? "start" : p[0] > 0 ? "end" : "middle" });
      });
      function mark(v, label, col, up, dy) {
        var x = px(v);
        S("circle", { cx: x, cy: 120, r: 5, fill: col }, svg);
        line(svg, x, up ? 114 : 126, x, up ? 70 - dy : 160 + dy, { stroke: col, sw: 1.2 });
        T(svg, x, up ? 62 - dy : 170 + dy, label, { size: 10.5, weight: 600, fill: col, anchor: x < 150 ? "start" : x > 610 ? "end" : "middle" });
      }
      if (lo === hi) mark(lo, "lo = hi", C.teal, true, 0);
      else { mark(lo, "lo", C.teal, true, 0); mark(hi, "hi", C.teal, true, Math.abs(px(hi) - px(lo)) < 40 ? 16 : 0); }
      if (showS) mark(safe, "lo + (hi − lo)/2 = " + commas(safe), C.green, false, 0);
      if (showN) mark(naive, "(lo + hi)/2 = " + commas(naive), naive < 0 ? C.pink : C.orange, false, 24);
      var over = sum > MAX;
      T(svg, 8, 226, "lo + hi = " + commas(sum) + (over ? " — past 2,147,483,647 by " + commas(sum - MAX) + ", so it wraps to " + commas(wrapped) : " — fits in 32 bits"),
        { anchor: "start", size: 11.5, fill: over ? C.pink : C.text, mono: false });
      T(svg, 8, 250, over && showN ? "a[" + naive + "] → ArrayIndexOutOfBoundsException: Index " + naive + " out of bounds" :
        "the safe form subtracts two in-range values and never forms the sum", { anchor: "start", size: 11, fill: over && showN ? C.pink : C.dim });
      T(svg, 8, 274, "Python's ints never wrap, so (lo + hi) // 2 is safe there; the bug lives in Java, C, C++ and Go", { anchor: "start", size: 9.5, fill: C.faint, mono: false });
      sl.set(lo); sh.set(hi);
    }
    var fmt = function (v) { return commas(v); };
    var sl = K.slider(f.controls, "lo", 0, MAX, lo, 1, fmt, function (v) { lo = v; if (hi < lo) hi = lo; render(); });
    var sh = K.slider(f.controls, "hi", 0, MAX, hi, 1, fmt, function (v) { hi = v; if (lo > hi) lo = hi; render(); });
    K.toggle(f.controls, "(lo + hi) / 2", true, function (on) { showN = on; render(); });
    K.toggle(f.controls, "lo + (hi − lo) / 2", true, function (on) { showS = on; render(); });
    var pr = row(f.controls);
    [["2³⁰, 2³⁰", 1073741824, 1073741824], ["…800, …900", 1073741800, 1073741900], ["2e9, 2e9", 2000000000, 2000000000], ["small", 0, 1000]].forEach(function (p) {
      var b = document.createElement("button"); b.type = "button"; b.textContent = p[0];
      b.addEventListener("click", function () { lo = p[1]; hi = p[2]; render(); });
      pr.appendChild(b);
    });
    render();
    f.say("Two formulas for the midpoint. Drag lo and hi up and watch one of them break: find the first pair where lo + hi no longer fits.");
  };

  /* ------------------------------------------------------------------------
     dsaRotatedSearch — ch13 §6, half-open. When a[lo], a[mid] and a[hi−1]
     are equal the sorted half cannot be named, so both ends shrink by one.
     ------------------------------------------------------------------------ */
  VIZ.dsaRotatedSearch = function (el) {
    var f = frame(el);
    var BASE = [[0, 1, 2, 4, 5, 6, 7, 9, 11, 13, 15, 18, 21, 24], [2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 3, 2, 2]];
    var dup = 0, rot = 4, target = 13, a = [], tr = [];
    function build() {
      var b = BASE[dup], n = b.length;
      a = dup ? b.slice() : b.slice(n - rot).concat(b.slice(0, n - rot));
      if (dup) a = a.slice(rot).concat(a.slice(0, rot));
      var lo = 0, hi = n, probes = 0;
      tr = [{ lo: 0, hi: n, mid: -1, probes: 0, msg: "If the target is here, it is in [lo, hi). At least one half of it is sorted." }];
      while (lo < hi) {
        var mid = lo + ((hi - lo) >> 1); probes++;
        var s = { mid: mid, probes: probes, lo0: lo, hi0: hi };
        if (a[mid] === target) { s.lo = lo; s.hi = hi; s.found = mid; s.msg = "a[" + mid + "] = " + target + ": found after " + probes + " probes"; tr.push(s); return; }
        if (a[lo] === a[mid] && a[mid] === a[hi - 1]) {
          s.amb = true; s.msg = "a[lo] = a[mid] = a[hi−1] = " + a[mid] + ": either half could hold the break. No test can say which — shrink both ends by one";
          lo++; hi--;
        } else if (a[lo] <= a[mid]) {
          s.sorted = [lo, mid];
          if (a[lo] <= target && target < a[mid]) { hi = mid; s.msg = "a[lo] ≤ a[mid]: the left half is sorted, and " + target + " lies in its range, so go left"; }
          else { lo = mid + 1; s.msg = "a[lo] ≤ a[mid]: the left half is sorted, and " + target + " is outside it, so go right"; }
        } else {
          s.sorted = [mid, hi - 1];
          if (a[mid] < target && target <= a[hi - 1]) { lo = mid + 1; s.msg = "a[lo] > a[mid]: the right half is sorted, and " + target + " lies in its range, so go right"; }
          else { hi = mid; s.msg = "a[lo] > a[mid]: the right half is sorted, and " + target + " is outside it, so go left"; }
        }
        s.lo = lo; s.hi = hi; tr.push(s);
      }
      tr.push({ lo: lo, hi: hi, mid: -1, probes: probes, done: true, msg: "empty range: " + target + " is not here (" + probes + " probes, log₂n ≈ " + Math.log2(n).toFixed(1) + ")" });
    }
    var svg = svgOf(f, 280, "search in a rotated sorted array");
    function draw(k) {
      clear(svg);
      var s = tr[k], lo = s.lo0 !== undefined ? s.lo0 : s.lo, hi = s.hi0 !== undefined ? s.hi0 : s.hi;
      T(svg, 8, 14, "search " + target + " · rotation " + rot + " · probes " + s.probes, { anchor: "start", size: 12.5, weight: 700 });
      var bx = boxes(svg, a, 50, { style: function (i) {
        if (i === s.mid) return { fill: s.amb ? C.orange : s.found === i ? C.green : C.blue, op: 0.4, stroke: s.amb ? C.orange : C.blue, sw: 2 };
        if (s.amb && (i === lo || i === hi - 1)) return { fill: C.orange, op: 0.18, stroke: C.orange, sw: 1.6 };
        if (s.sorted && i >= s.sorted[0] && i <= s.sorted[1]) return { fill: C.teal, op: 0.22, stroke: C.teal, sw: 1.4 };
        if (i >= lo && i < hi) return { stroke: C.blue, sw: 1.2 };
        return { col: C.faint };
      } });
      if (s.sorted) {
        var x0 = bx.left(s.sorted[0]) + 3, x1 = bx.left(s.sorted[1] + 1) - 3;
        S("rect", { x: x0, y: 40, width: x1 - x0, height: 4, rx: 2, fill: C.teal }, svg);
        T(svg, (x0 + x1) / 2, 32, "sorted half", { size: 9.5, fill: C.teal, weight: 600 });
      }
      if (hi > lo) S("rect", { x: bx.left(lo), y: 108, width: bx.left(hi) - bx.left(lo), height: 4, rx: 2, fill: C.blue, opacity: 0.6 }, svg);
      T(svg, 8, 128, "[lo, hi) = [" + lo + ", " + hi + ")" + (s.lo0 !== undefined && !s.found ? " → [" + s.lo + ", " + s.hi + ")" : ""), { anchor: "start", size: 11, fill: C.blue, weight: 600 });
      say(svg, 170, s.msg, s.amb ? C.orange : s.found !== undefined ? C.green : C.text);
      var amb = tr.filter(function (t) { return t.amb; }).length;
      T(svg, 8, 200, "ambiguous steps so far: " + tr.slice(0, k + 1).filter(function (t) { return t.amb; }).length + " of " + amb + " in this search",
        { anchor: "start", size: 10.5, fill: amb ? C.orange : C.faint, mono: false });
      T(svg, 8, 224, dup ? "all equal but one: absent targets cost n/2 + 1 probes — linear, because the probe stopped being informative" :
        "distinct values: one half is always provably sorted, so every probe discards a side", { anchor: "start", size: 9.5, fill: C.faint, mono: false });
    }
    var tg = K.slider(f.controls, "target", 0, 25, target, 1, String, function (t) { target = t; build(); sp.reload(); });
    K.slider(f.controls, "rotation", 0, 13, rot, 1, String, function (r) { rot = r; build(); sp.reload(); });
    K.tabs(f.controls, ["distinct values", "duplicates"], 0, function (k) { dup = k; target = k ? 1 : 13; tg.set(target); build(); sp.reload();
      f.say(k ? "Fourteen values, all 2 but one 3. Step a search for 1 (absent) and count the ambiguous steps." : "One half is always sorted. Step and watch the algorithm decide which."); });
    var sp = stepper(f, function () { return tr.length - 1; }, draw);
    build(); draw(0);
    f.say("One half is always sorted. Step and watch the algorithm decide which; then switch to duplicates and find a rotation where the test cannot tell.");
  };

  /* ------------------------------------------------------------------------
     dsaBinarySearchAnswer — ch14 §1–3. Four of the chapter's problems, each
     with its own predicate, searched with the lower-bound loop over [lo, hi].
     The max-min-gap problem uses the negated predicate "too large", as §3 does.
     ------------------------------------------------------------------------ */
  VIZ.dsaBinarySearchAnswer = function (el) {
    var f = frame(el);
    function sum(a) { return a.reduce(function (s, x) { return s + x; }, 0); }
    var PROBS = [
      { name: "Koko: eating rate", data: [3, 6, 7, 11, 18, 4], h: 11, cand: "k bananas / hour",
        lo: 1, hi: function (p) { return Math.max.apply(null, p.data); },
        pred: function (p, k) { var hrs = p.data.map(function (x) { return Math.ceil(x / k); }); return { ok: sum(hrs) <= p.h, detail: "hours per pile " + hrs.join(" + ") + " = " + sum(hrs) + (sum(hrs) <= p.h ? " ≤ " : " > ") + p.h }; },
        q: "can she finish within 11 hours at rate k?" },
      { name: "ship within D days", data: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10], h: 5, cand: "capacity",
        lo: function (p) { return Math.max.apply(null, p.data); }, hi: function (p) { return sum(p.data); },
        pred: function (p, c) { var used = 1, load = 0, days = [[]]; p.data.forEach(function (w) { if (load + w > c) { used++; load = 0; days.push([]); } load += w; days[days.length - 1].push(w); });
          return { ok: used <= p.h, detail: days.map(function (d) { return "[" + d.join(",") + "]"; }).join(" ") + " = " + used + " days" + (used <= p.h ? " ≤ " : " > ") + p.h }; },
        q: "can every package ship in 5 days at this capacity?" },
      { name: "split array, m = 2", data: [7, 2, 5, 10, 8], h: 2, cand: "largest part sum",
        lo: function (p) { return Math.max.apply(null, p.data); }, hi: function (p) { return sum(p.data); },
        pred: function (p, L) { var parts = 1, tot = 0, ps = [[]]; p.data.forEach(function (x) { if (tot + x > L) { parts++; tot = 0; ps.push([]); } tot += x; ps[ps.length - 1].push(x); });
          return { ok: parts <= p.h, detail: ps.map(function (d) { return "[" + d.join(",") + "]"; }).join(" ") + " = " + parts + " parts" + (parts <= p.h ? " ≤ " : " > ") + p.h }; },
        q: "can every part be kept at or below L with at most 2 parts?" },
      { name: "max-min gap, k = 3", data: [1, 2, 4, 8, 9], h: 3, cand: "gap G", gap: true,
        lo: 1, hi: function (p) { return p.data[p.data.length - 1] - p.data[0] + 1; },
        pred: function (p, g) { var placed = 1, last = p.data[0], at = [last]; p.data.slice(1).forEach(function (x) { if (x - last >= g) { placed++; last = x; at.push(x); } });
          return { ok: placed < p.h, detail: "greedy places at " + at.join(", ") + " = " + placed + (placed < p.h ? " < 3: too large" : " ≥ 3: fits") }; },
        q: "is gap G too large to keep for 3 objects? (the negated predicate)" }
    ];
    var pi = 0, cand = 3, tr = [], showAll = false;
    function P() { return PROBS[pi]; }
    function bounds() { var p = P(); return [typeof p.lo === "function" ? p.lo(p) : p.lo, p.hi(p)]; }
    function build() {
      var p = P(), b = bounds(), lo = b[0], hi = b[1];
      tr = [{ lo: lo, hi: hi, probes: {} }];
      var probes = {};
      while (lo < hi) {
        var mid = lo + ((hi - lo) >> 1), r = p.pred(p, mid);
        probes = Object.assign({}, probes); probes[mid] = r.ok;
        if (r.ok) hi = mid; else lo = mid + 1;
        tr.push({ lo: lo, hi: hi, mid: mid, ok: r.ok, probes: probes });
      }
      var ans = p.gap ? lo - 1 : lo;
      tr[tr.length - 1].answer = ans;
    }
    var svg = svgOf(f, 330, "search on the answer: the predicate strip and the probes");
    function draw(k) {
      clear(svg);
      var p = P(), s = tr[k], b = bounds(), lo0 = b[0], hi0 = b[1], cnt = hi0 - lo0 + 1;
      T(svg, 8, 14, p.name + " · data " + p.data.join(", "), { anchor: "start", size: 12, weight: 700 });
      T(svg, 752, 14, "probes " + k + " · range " + commas(cnt) + " candidates", { anchor: "end", size: 11, fill: C.dim });
      T(svg, 8, 38, p.q, { anchor: "start", size: 11, fill: C.dim, mono: false });
      var X0 = 20, W = 720 / cnt;
      for (var c = lo0; c <= hi0; c++) {
        var x = X0 + (c - lo0) * W, probed = s.probes[c], known = probed !== undefined, val = p.pred(p, c).ok;
        var show = known || showAll;
        rect(svg, x + 0.5, 56, Math.max(1, W - 1), 28, { rx: W > 10 ? 3 : 0, fill: show ? (val ? C.green : C.pink) : C.card, stroke: c === cand ? C.text : C.line, sw: c === cand ? 2 : 1, op: show ? (known ? 0.85 : 0.3) : 1 });
        if (W >= 14 && show) T(svg, x + W / 2, 70, val ? "T" : "F", { size: 10, weight: 700, fill: C.text });
      }
      if (s.lo <= s.hi) {
        var bl = X0 + (s.lo - lo0) * W, br = X0 + (Math.min(s.hi, hi0) - lo0 + 1) * W;
        S("rect", { x: bl, y: 88, width: Math.max(2, br - bl), height: 4, rx: 2, fill: C.blue }, svg);
      }
      T(svg, X0, 104, String(lo0), { anchor: "start", size: 9.5, fill: C.faint });
      T(svg, X0 + cnt * W, 104, String(hi0), { anchor: "end", size: 9.5, fill: C.faint });
      T(svg, 380, 104, "blue bar: the range still in play, [" + s.lo + ", " + s.hi + "]", { size: 9.5, fill: C.blue });
      /* the dragged candidate */
      var r = p.pred(p, cand);
      T(svg, 8, 140, p.cand + " = " + cand + ": " + (r.ok ? (p.gap ? "TRUE" : "YES") : (p.gap ? "FALSE" : "NO")), { anchor: "start", size: 14, weight: 700, fill: r.ok ? C.green : C.pink });
      T(svg, 8, 164, r.detail, { anchor: "start", size: 11, fill: C.dim });
      var flips = 0, prev = null;
      for (c = lo0; c <= hi0; c++) { var o = p.pred(p, c).ok; if (prev !== null && o !== prev) flips++; prev = o; }
      if (s.mid !== undefined) say(svg, 200, "probe " + k + ": candidate " + s.mid + " is " + (s.ok ? "true, so the answer is " + s.mid + " or smaller: hi = mid" : "false, so discard it: lo = mid + 1"));
      if (s.answer !== undefined) say(svg, 224, "lo = hi = " + s.lo + (p.gap ? ": the first gap that is too large, so the answer is lo − 1 = " + s.answer : ": the answer is " + s.answer), C.green);
      T(svg, 8, 262, "the strip flips " + flips + " time" + (flips === 1 ? "" : "s") + " across all " + commas(cnt) + " candidates — the search computed only " + (tr.length - 1) + " of them",
        { anchor: "start", size: 10.5, fill: C.faint, mono: false });
      T(svg, 8, 284, p.gap ? "maximise the minimum: 'gap ≥ G fits' is true then false, so §3 negates it to 'G too large' and subtracts one at the end" :
        "minimise the maximum: the predicate gets easier as the candidate grows, so the strip is false then true and the answer is the first true",
        { anchor: "start", size: 9.5, fill: C.faint, mono: false });
    }
    var cs;
    K.tabs(f.controls, PROBS.map(function (x) { return x.name; }), 0, function (k) {
      pi = k; var b = bounds(); cand = Math.round((b[0] + b[1]) / 2);
      cs.input.min = b[0]; cs.input.max = b[1]; cs.set(cand); build(); sp.reload();
    });
    cs = K.slider(f.controls, "candidate", 1, 18, cand, 1, String, function (v) { cand = v; draw(sp.pos()); });
    K.toggle(f.controls, "show the whole strip", false, function (on) { showAll = on; draw(sp.pos()); });
    var sp = stepper(f, function () { return tr.length - 1; }, draw);
    build(); draw(0);
    f.say("Drag the candidate answer. The predicate below is either yes or no: set it one below the answer, then one above, and find where it flips. Then step the search.");
  };

  /* ------------------------------------------------------------------------
     Sorting, instrumented. Each routine counts element comparisons (cmp)
     and writes into the array (w). Used by dsaSortRace.
     ------------------------------------------------------------------------ */
  function countSorts(src) {
    function insertion(a) { var c = 0, w = 0; for (var i = 1; i < a.length; i++) { var x = a[i], j = i - 1; while (j >= 0 && (c++, a[j] > x)) { a[j + 1] = a[j]; w++; j--; } a[j + 1] = x; w++; } return [c, w]; }
    function selection(a) { var c = 0, w = 0; for (var i = 0; i < a.length - 1; i++) { var m = i; for (var j = i + 1; j < a.length; j++) { c++; if (a[j] < a[m]) m = j; } if (m !== i) { var t = a[i]; a[i] = a[m]; a[m] = t; w += 2; } } return [c, w]; }
    function bubble(a) { var c = 0, w = 0, n = a.length; for (var e = n - 1; e > 0; e--) { var sw = false; for (var j = 0; j < e; j++) { c++; if (a[j] > a[j + 1]) { var t = a[j]; a[j] = a[j + 1]; a[j + 1] = t; w += 2; sw = true; } } if (!sw) break; } return [c, w]; }
    function merge(a) {
      var c = 0, w = 0, tmp = a.slice();
      (function ms(lo, hi) {
        if (hi - lo < 2) return;
        var mid = (lo + hi) >> 1; ms(lo, mid); ms(mid, hi);
        var i = lo, j = mid, k = lo;
        while (i < mid && j < hi) { c++; tmp[k++] = a[j] < a[i] ? a[j++] : a[i++]; }
        while (i < mid) tmp[k++] = a[i++];
        while (j < hi) tmp[k++] = a[j++];
        for (k = lo; k < hi; k++) { a[k] = tmp[k]; w++; }
      })(0, a.length);
      return [c, w];
    }
    function quickFirst(a) {          // Lomuto, pivot = first element
      var c = 0, w = 0;
      (function qs(lo, hi) {
        if (lo >= hi) return;
        var p = a[lo], i = lo, t;
        for (var j = lo + 1; j <= hi; j++) { c++; if (a[j] <= p) { i++; t = a[i]; a[i] = a[j]; a[j] = t; w += 2; } }
        t = a[lo]; a[lo] = a[i]; a[i] = t; w += 2;
        qs(lo, i - 1); qs(i + 1, hi);
      })(0, a.length - 1);
      return [c, w];
    }
    function quick3(a) {              // the chapter's partition3, random pivot
      var c = 0, w = 0, r = lcg(99);
      (function qs(lo, hi) {
        if (lo >= hi) return;
        var p = a[lo + r(hi - lo + 1)], lt = lo, i = lo, gt = hi, t;
        while (i <= gt) {
          c++;
          if (a[i] < p) { t = a[lt]; a[lt] = a[i]; a[i] = t; w += 2; lt++; i++; }
          else { c++; if (a[i] > p) { t = a[i]; a[i] = a[gt]; a[gt] = t; w += 2; gt--; } else i++; }
        }
        qs(lo, lt - 1); qs(gt + 1, hi);
      })(0, a.length - 1);
      return [c, w];
    }
    return [insertion, selection, bubble, merge, quickFirst, quick3].map(function (fn) {
      var a = src.slice(), r = fn(a);
      for (var i = 1; i < a.length; i++) if (a[i - 1] > a[i]) throw new Error("sort race: " + fn.name + " did not sort");
      return { cmp: r[0], w: r[1] };
    });
  }
  function shapeArray(shape, n, seed) {
    var r = lcg(seed), a = [], i;
    for (i = 0; i < n; i++) a.push(r(1000));
    if (shape === "sorted" || shape === "nearly sorted") a.sort(function (x, y) { return x - y; });
    if (shape === "reversed") a.sort(function (x, y) { return y - x; });
    if (shape === "nearly sorted") for (i = 0; i < 12; i++) { var from = r(n), v = a.splice(from, 1)[0]; a.splice(r(n), 0, v); }
    if (shape === "many dupes") a = a.map(function (x) { return x % 10; });
    if (shape === "all equal") a = a.map(function () { return 7; });
    return a;
  }

  /* ------------------------------------------------------------------------
     dsaSortRace — ch15 §1. n = 600, the chapter's six rows. Counts are
     this machine's own arrays, so they sit near the chapter's table rather
     than on it; the ceiling n(n−1)/2 = 179,700 is exact.
     ------------------------------------------------------------------------ */
  VIZ.dsaSortRace = function (el) {
    var f = frame(el);
    var N = 600, SHAPES = ["random", "sorted", "reversed", "nearly sorted", "many dupes", "all equal"];
    var NAMES = ["insertion", "selection", "bubble", "mergesort", "quick, first pivot", "quick, random 3-way"];
    var shape = 0, a = [], res = [], prog = 1, timer = null, metric = 0;
    function build() { a = shapeArray(SHAPES[shape], N, 600 + shape); res = countSorts(a); }
    var svg = svgOf(f, 340, "comparisons for six sorts on one input");
    function draw() {
      clear(svg);
      var CEIL = N * (N - 1) / 2;
      T(svg, 8, 14, "n = 600 · input: " + SHAPES[shape] + " · counting " + (metric ? "writes" : "comparisons"), { anchor: "start", size: 12.5, weight: 700 });
      /* the input, as 600 thin bars */
      var mx = Math.max.apply(null, a) || 1;
      a.forEach(function (v, i) { S("rect", { x: 20 + i * 1.2, y: 58 - 28 * v / mx, width: 1.2, height: 28 * v / mx + 1, fill: C.faint }, svg); });
      var vals = res.map(function (r) { return metric ? r.w : r.cmp; }), top = metric ? Math.max.apply(null, vals) : CEIL;
      var best = Math.min.apply(null, vals);
      NAMES.forEach(function (nm, i) {
        var y = 80 + i * 36, v = vals[i], shown = v * prog, bad = !metric && v > 0.5 * CEIL, win = v === best;
        T(svg, 8, y + 11, nm, { anchor: "start", size: 11.5, mono: false, weight: win ? 700 : 400, fill: win ? C.green : C.text });
        rect(svg, 160, y, 480, 22, { rx: 4, fill: C.card });
        S("rect", { x: 160, y: y, width: Math.max(1, 480 * shown / top), height: 22, rx: 4, fill: bad ? C.pink : win ? C.green : C.blue, opacity: 0.75 }, svg);
        T(svg, 752, y + 11, commas(shown) + (win && prog === 1 ? " ◂ least" : ""), { anchor: "end", size: 11.5, weight: 600, fill: bad ? C.pink : win ? C.green : C.text });
      });
      if (!metric) { line(svg, 640, 76, 640, 296, { stroke: C.pink, dash: "4 3" }); T(svg, 636, 306, "n(n−1)/2 = 179,700", { anchor: "end", size: 9.5, fill: C.pink }); }
      T(svg, 8, 328, metric ? "selection sort writes at most 2(n − 1) = 1,198 cells whatever the input: the one input-independent virtue in the table" :
        "green = fewest comparisons · pink = more than half the quadratic ceiling", { anchor: "start", size: 10, fill: C.faint, mono: false });
    }
    function run() {
      if (timer) clearInterval(timer);
      if (D.REDUCED) { prog = 1; draw(); return; }
      prog = 0;
      timer = setInterval(function () { prog = Math.min(1, prog + 0.05); draw(); if (prog >= 1) { clearInterval(timer); timer = null; } }, 30);
    }
    K.tabs(f.controls, SHAPES, 0, function (k) { shape = k; build(); run();
      f.say(k === 3 ? "Nearly sorted: twelve elements moved out of place. Which row is cheapest, and how far is bubble sort from its best?" :
        k === 5 ? "All equal: one of the six collapses to the ceiling. Which, and why does the three-way partition do 2n?" : "Six sorts, one array. Compare the rows, then change the input shape."); });
    K.tabs(f.controls, ["comparisons", "writes"], 0, function (k) { metric = k; draw(); });
    f.btn("run ▸", run);
    build(); draw();
    f.say("Six sorts, one array. Change the input shape and watch the winner change: find which one wins on nearly sorted input, then which one collapses on all-equal.");
  };

  /* ------------------------------------------------------------------------
     dsaPartition — ch15 §3. Whole quicksort traced one comparison or swap
     at a time. The chosen pivot is swapped to the front for Lomuto and Hoare
     (so "first" is the chapter's worst case); three-way is partition3 as the
     chapter writes it, pivot by value.
     ------------------------------------------------------------------------ */
  VIZ.dsaPartition = function (el) {
    var f = frame(el);
    var SCH = ["Lomuto", "Hoare", "three-way"], PIV = ["first", "random", "median of three"], INP = ["random input", "sorted input", "many dupes", "all equal"];
    var sch = 0, piv = 0, inp = 1, N = 16, tr = [];
    function build() {
      var r = lcg(31 + inp), a = [], i;
      var pool = []; for (i = 1; i <= 40; i++) pool.push(i);
      for (i = 0; i < N; i++) a.push(inp === 3 ? 5 : inp === 2 ? 1 + r(3) : pool.splice(r(pool.length), 1)[0]);   // distinct unless dupes are the point
      if (inp === 1) a.sort(function (x, y) { return x - y; });
      var rp = lcg(7), depthMax = 0, cmps = 0, swaps = 0;
      tr = [];
      function snap(o) { o.a = a.slice(); o.cmps = cmps; o.swaps = swaps; o.depthMax = depthMax; tr.push(o); }
      function sw(x, y) { var t = a[x]; a[x] = a[y]; a[y] = t; swaps++; }
      function choose(lo, hi) {
        if (piv === 0) return lo;
        if (piv === 1) return lo + rp(hi - lo + 1);
        var m = (lo + hi) >> 1, c = [[a[lo], lo], [a[m], m], [a[hi], hi]].sort(function (x, y) { return x[0] - y[0]; });
        return c[1][1];
      }
      (function qs(lo, hi, d) {
        if (lo > hi) return;
        depthMax = Math.max(depthMax, d);
        if (lo === hi) { snap({ lo: lo, hi: hi, d: d, msg: "one element: already in place (depth " + d + ")", leaf: true }); return; }
        var pi = choose(lo, hi), p, i, j, t;
        if (sch === 2) {
          p = a[pi];
          var lt = lo, gt = hi; i = lo;
          snap({ lo: lo, hi: hi, d: d, lt: lt, i: i, gt: gt, p: p, pidx: pi, msg: "partition [" + lo + ".." + hi + "] around " + p + " (" + PIV[piv] + "); depth " + d });
          while (i <= gt) {
            cmps++;
            if (a[i] < p) { sw(lt, i); lt++; i++; snap({ lo: lo, hi: hi, d: d, lt: lt, i: i, gt: gt, p: p, msg: "a[i] < " + p + ": swap into the < band" }); }
            else { cmps++; if (a[i] > p) { sw(i, gt); gt--; snap({ lo: lo, hi: hi, d: d, lt: lt, i: i, gt: gt, p: p, msg: "a[i] > " + p + ": swap to the > band at the end" }); }
              else { i++; snap({ lo: lo, hi: hi, d: d, lt: lt, i: i, gt: gt, p: p, msg: "a[i] = " + p + ": leave it in the equal band" }); } }
          }
          snap({ lo: lo, hi: hi, d: d, lt: lt, i: i, gt: gt, p: p, split: true, msg: "equal band [" + lt + ".." + gt + "] is final and never recursed into; recurse on the two sides" });
          qs(lo, lt - 1, d + 1); qs(gt + 1, hi, d + 1);
          return;
        }
        if (pi !== lo) sw(lo, pi);
        p = a[lo];
        snap({ lo: lo, hi: hi, d: d, p: p, pidx: lo, i: sch ? lo - 1 : lo, j: sch ? hi + 1 : lo + 1, hoare: sch === 1, msg: "partition [" + lo + ".." + hi + "] around " + p + " (" + PIV[piv] + ", moved to the front); depth " + d });
        if (sch === 0) {
          i = lo;
          for (j = lo + 1; j <= hi; j++) {
            cmps++;
            if (a[j] <= p) { i++; sw(i, j); snap({ lo: lo, hi: hi, d: d, p: p, pidx: lo, i: i, j: j + 1, msg: "a[j] ≤ " + p + ": swap it forward (Lomuto swaps every ≤ element)" }); }
            else snap({ lo: lo, hi: hi, d: d, p: p, pidx: lo, i: i, j: j + 1, msg: "a[j] > " + p + ": leave it" });
          }
          sw(lo, i);
          snap({ lo: lo, hi: hi, d: d, p: p, pidx: i, i: i, j: hi + 1, split: true, msg: "pivot to its final place " + i + "; sides of size " + (i - lo) + " and " + (hi - i) });
          qs(lo, i - 1, d + 1); qs(i + 1, hi, d + 1);
        } else {
          i = lo - 1; j = hi + 1;
          for (;;) {
            do { i++; cmps++; } while (a[i] < p);
            do { j--; cmps++; } while (a[j] > p);
            if (i >= j) break;
            sw(i, j);
            snap({ lo: lo, hi: hi, d: d, p: p, i: i, j: j, hoare: true, msg: "both pointers stopped on the wrong side: swap a[" + i + "] and a[" + j + "]" });
          }
          snap({ lo: lo, hi: hi, d: d, p: p, i: i, j: j, hoare: true, split: true, msg: "pointers crossed at " + j + ": recurse on [" + lo + ".." + j + "] and [" + (j + 1) + ".." + hi + "]" });
          qs(lo, j, d + 1); qs(j + 1, hi, d + 1);
        }
      })(0, N - 1, 1);
      snap({ lo: -1, hi: -1, d: 0, done: true, msg: "sorted. Deepest recursion: " + depthMax + " for n = " + N + " (log₂n = 4)" });
    }
    var svg = svgOf(f, 300, "quicksort partition, regions shaded");
    function draw(k) {
      clear(svg);
      var s = tr[k];
      T(svg, 8, 14, SCH[sch] + " · pivot " + PIV[piv] + " · " + INP[inp] + " · step " + k + " of " + (tr.length - 1), { anchor: "start", size: 12, weight: 700 });
      T(svg, 752, 14, "depth " + (s.d || 0) + " · deepest " + s.depthMax, { anchor: "end", size: 12, weight: 700, fill: s.depthMax >= N - 1 ? C.pink : C.dim });
      boxes(svg, s.a, 46, { style: function (x) {
        if (s.done) return { fill: C.green, op: 0.15 };
        if (x < s.lo || x > s.hi) return { col: C.faint };
        if (x === s.pidx) return { fill: C.blue, op: 0.4, stroke: C.blue, sw: 2 };
        if (sch === 2 && s.lt !== undefined) {
          if (x < s.lt) return { fill: C.teal, op: 0.3 };
          if (x < s.i) return { fill: C.blue, op: 0.25 };
          if (x > s.gt) return { fill: C.orange, op: 0.3 };
          return {};
        }
        if (sch === 0 && s.i !== undefined) {
          if (x > s.lo && x <= s.i) return { fill: C.teal, op: 0.3 };
          if (x > s.i && x < s.j) return { fill: C.orange, op: 0.3 };
          return {};
        }
        if (s.hoare) {
          if (s.split) return x <= s.j ? { fill: C.teal, op: 0.3 } : { fill: C.orange, op: 0.3 };
          if (x <= s.i) return { fill: C.teal, op: 0.3 };
          if (x >= s.j) return { fill: C.orange, op: 0.3 };
        }
        return {};
      } });
      if (!s.done && s.lo >= 0) {
        var ptr = sch === 2 ? [["lt", s.lt], ["i", s.i], ["gt", s.gt]] : [["i", s.i], ["j", s.j]];
        var W = Math.min(56, 720 / N), X0 = (760 - W * N) / 2;
        ptr.forEach(function (p, q) {
          if (p[1] === undefined || p[1] < Math.max(0, s.lo - 1) || p[1] > Math.min(N - 1, s.hi + 1)) return;
          var x = X0 + p[1] * W + W / 2;
          S("path", { d: "M " + x + " " + (100 + q * 16) + " l -5 9 l 10 0 z", fill: [C.teal, C.blue, C.orange][q] }, svg);
          T(svg, x + 8, 106 + q * 16, p[0], { anchor: "start", size: 9.5, weight: 600, fill: [C.teal, C.blue, C.orange][q] });
        });
      }
      T(svg, 8, 172, "comparisons " + s.cmps + " · swaps " + s.swaps, { anchor: "start", size: 11.5, weight: 600 });
      say(svg, 196, s.msg, s.done ? C.green : s.split ? C.blue : C.text);
      T(svg, 8, 226, sch === 0 ? "teal: ≤ pivot · orange: > pivot · white: not yet examined (at the end)" :
        sch === 1 ? "teal: settled ≤ pivot side · orange: settled ≥ pivot side · the unexamined region is in the middle" :
        "teal: < pivot · blue: = pivot · orange: > pivot · white: unexamined, between i and gt", { anchor: "start", size: 10, fill: C.faint, mono: false });
      T(svg, 8, 248, "recursion depth is the stack the sort needs: log₂n when the pivot splits evenly, n when it is always extreme", { anchor: "start", size: 10, fill: C.faint, mono: false });
    }
    K.tabs(f.controls, SCH, 0, function (k) { sch = k; build(); sp.reload(); });
    K.tabs(f.controls, PIV, 0, function (k) { piv = k; build(); sp.reload(); });
    K.tabs(f.controls, INP, 1, function (k) { inp = k; build(); sp.reload(); });
    f.btn("next partition ⏩", function () { var k = sp.pos() + 1; while (k < tr.length - 1 && !tr[k].split) k++; sp.go(k + 1 < tr.length ? k + 1 : k); });
    var sp = stepper(f, function () { return tr.length - 1; }, draw);
    build(); draw(0);
    f.say("Watch the array split. The shaded regions are what the scheme has already decided. With a first-element pivot on sorted input, step to the end and read the deepest recursion.");
  };

  /* ------------------------------------------------------------------------
     dsaRadixSort — ch15 §5. LSD radix on 8-bit keys; each pass is a stable
     counting sort on one digit. Cost per pass: n moves + b bucket visits.
     ------------------------------------------------------------------------ */
  VIZ.dsaRadixSort = function (el) {
    var f = frame(el);
    var WIDTHS = [1, 2, 4, 8], wi = 2, n = 12, keys = [], passes = [];
    var MEAS = [[1, 32, 2, 486.0], [4, 8, 16, 232.6], [8, 4, 256, 87.7], [11, 3, 2048, 101.1], [16, 2, 65536, 112.8]];
    function build() {
      var r = lcg(1500 + n); keys = [];
      for (var i = 0; i < n; i++) keys.push(r(256));
      var w = WIDTHS[wi], b = 1 << w, d = 8 / w, cur = keys.slice();
      passes = [{ arr: cur.slice() }];
      for (var p = 0; p < d; p++) {
        var bk = []; for (var j = 0; j < b; j++) bk.push([]);
        cur.forEach(function (x) { bk[(x >> (p * w)) & (b - 1)].push(x); });
        cur = [].concat.apply([], bk);
        passes.push({ arr: cur.slice(), buckets: bk, pass: p });
      }
      for (var q = 1; q < cur.length; q++) if (cur[q - 1] > cur[q]) throw new Error("dsaRadixSort: not sorted");
    }
    function bin(x) { var s = x.toString(2); return "00000000".slice(s.length) + s; }
    var svg = svgOf(f, 420, "LSD radix sort passes and buckets");
    function draw(k) {
      clear(svg);
      var w = WIDTHS[wi], b = 1 << w, d = 8 / w, s = passes[k];
      T(svg, 8, 14, "8-bit keys · " + w + "-bit digit · " + d + " pass" + (d > 1 ? "es" : "") + " × " + b + " buckets · pass " + k + " of " + d, { anchor: "start", size: 12, weight: 700 });
      /* the array, in binary, with the current digit highlighted */
      var digit = k > 0 ? s.pass : k;
      var cw = 720 / Math.min(n, 16);
      s.arr.slice(0, 16).forEach(function (x, i) {
        var cx = 20 + i * cw + cw / 2, bits = bin(x);
        T(svg, cx, 38, String(x), { size: 11, weight: 700 });
        for (var t = 0; t < 8; t++) {
          var bitIdx = 7 - t, hot = k > 0 && bitIdx >= s.pass * w && bitIdx < (s.pass + 1) * w;
          var nextHot = k < d && bitIdx >= digit * w && bitIdx < (digit + 1) * w && k === 0;
          T(svg, cx - 17.5 + t * 5, 54, bits[t], { size: 8, fill: hot ? C.orange : nextHot ? C.blue : C.faint, weight: hot ? 700 : 400 });
        }
      });
      if (n > 16) T(svg, 752, 38, "+" + (n - 16) + " more", { anchor: "end", size: 9.5, fill: C.faint });
      /* buckets of the pass just done */
      if (s.buckets) {
        T(svg, 8, 80, "buckets for digit " + (s.pass + 1) + " (bits " + (s.pass * w) + "–" + ((s.pass + 1) * w - 1) + "), filled in input order so the pass is stable", { anchor: "start", size: 10, fill: C.faint, mono: false });
        if (b <= 16) {
          var bw = 720 / b;
          s.buckets.forEach(function (bk, j) {
            rect(svg, 20 + j * bw + 1, 90, bw - 2, 104, { rx: 4, fill: C.card, stroke: bk.length ? C.orange : C.line, sw: 1 });
            T(svg, 20 + j * bw + bw / 2, 102, ("0000" + j.toString(2)).slice(-w), { size: 8.5, fill: C.faint });
            bk.slice(0, 7).forEach(function (x, q) { T(svg, 20 + j * bw + bw / 2, 118 + q * 12, String(x), { size: bw < 40 ? 8.5 : 10 }); });
          });
        } else {
          var cw2 = 720 / b;
          s.buckets.forEach(function (bk, j) { S("rect", { x: 20 + j * cw2, y: 110, width: Math.max(0.8, cw2), height: bk.length ? 50 : 14, fill: bk.length ? C.orange : C.line, opacity: bk.length ? 0.9 : 0.4 }, svg); });
          T(svg, 380, 180, b + " buckets, " + s.buckets.filter(function (x) { return x.length; }).length + " of them non-empty: every one is still visited to write the output", { size: 10, fill: C.dim, mono: false });
        }
      }
      /* the cost: n + b per pass */
      var nw = d * n, bwk = d * b;
      T(svg, 8, 222, "work = passes × (n + b) = " + d + " × (" + n + " + " + b + ") = " + commas(nw + bwk), { anchor: "start", size: 12, weight: 700 });
      WIDTHS.forEach(function (ww, j) {
        var dd = 8 / ww, bb = 1 << ww, y = 238 + j * 22, tot = dd * (n + bb), scale = 400 / Math.max(8 * (n + 2), n + 256);
        T(svg, 8, y + 8, ww + "-bit", { anchor: "start", size: 10.5, weight: ww === w ? 700 : 400, fill: ww === w ? C.text : C.dim });
        S("rect", { x: 60, y: y, width: dd * n * scale, height: 16, fill: C.blue, opacity: 0.75 }, svg);
        S("rect", { x: 60 + dd * n * scale, y: y, width: dd * bb * scale, height: 16, fill: C.orange, opacity: 0.75 }, svg);
        T(svg, 752, y + 8, dd + "×" + n + " + " + dd + "×" + bb + " = " + commas(tot) + (bb > n ? "  buckets dominate" : ""), { anchor: "end", size: 10, fill: bb > n ? C.orange : C.dim });
      });
      T(svg, 8, 338, "blue: moving keys · orange: visiting buckets", { anchor: "start", size: 9.5, fill: C.faint, mono: false });
      /* the chapter's measurement */
      T(svg, 8, 364, "chapter §5, measured on 200,000 32-bit values:", { anchor: "start", size: 10, fill: C.faint, mono: false });
      MEAS.forEach(function (m, j) {
        var x = 8 + j * 150;
        T(svg, x, 384, m[0] + "-bit: " + m[1] + " × " + commas(m[2]), { anchor: "start", size: 9.5, fill: C.dim });
        T(svg, x, 402, m[3] + " ms", { anchor: "start", size: 11, weight: 700, fill: m[0] === 8 ? C.green : C.dim });
      });
    }
    K.tabs(f.controls, WIDTHS.map(function (x) { return x + "-bit digit"; }), wi, function (k) { wi = k; build(); sp.reload(); });
    K.slider(f.controls, "n keys", 4, 64, n, 4, String, function (v) { n = v; build(); sp.reload(); });
    var sp = stepper(f, function () { return passes.length - 1; }, draw);
    build(); draw(0);
    f.say("One pass per digit. Widen the digit and watch passes fall while buckets multiply: find the width where the bucket work passes the key work, then change n and watch it move.");
  };

  /* ------------------------------------------------------------------------
     dsaTimsort — ch16 §1. Scaled down: n = 32 and minrun = 4 (CPython picks
     32–64 and would insertion-sort all 32). Runs are found, descending ones
     reversed, short ones extended by binary insertion; the stack is kept by
     CPython's corrected merge_collapse.
     ------------------------------------------------------------------------ */
  VIZ.dsaTimsort = function (el) {
    var f = frame(el);
    var SH = ["random", "sorted", "reversed", "nearly sorted", "four runs"], sh = 3, N = 32, MINRUN = 4, tr = [];
    function build() {
      var r = lcg(77 + sh), a = [], i;
      for (i = 0; i < N; i++) a.push(1 + r(60));
      if (sh === 1 || sh === 3) a.sort(function (x, y) { return x - y; });
      if (sh === 2) a.sort(function (x, y) { return y - x; });
      if (sh === 3) { var t = a[5]; a[5] = a[20]; a[20] = t; }
      if (sh === 4) { a = []; for (var q = 0; q < 4; q++) { var run = []; for (i = 0; i < 8; i++) run.push(1 + r(60)); run.sort(function (x, y) { return x - y; }); a = a.concat(run); } }
      var cmps = 0, merges = 0, stack = [];
      tr = [];
      function snap(o) { o.a = a.slice(); o.stack = stack.map(function (s) { return s.slice(); }); o.cmps = cmps; o.merges = merges; tr.push(o); }
      function mergeAt(k, why) {
        var A = stack[k], B = stack[k + 1], lo = A[0], mid = A[0] + A[1], hi = B[0] + B[1];
        var L = a.slice(lo, mid), R = a.slice(mid, hi), x = 0, y = 0, o = lo, runA = 0, runB = 0, gal = 0;
        while (x < L.length && y < R.length) {
          cmps++;
          if (R[y] < L[x]) { a[o++] = R[y++]; runB++; runA = 0; } else { a[o++] = L[x++]; runA++; runB = 0; }
          gal = Math.max(gal, runA, runB);
        }
        while (x < L.length) a[o++] = L[x++];
        while (y < R.length) a[o++] = R[y++];
        merges++;
        stack.splice(k, 2, [lo, A[1] + B[1]]);
        snap({ hl: [lo, hi], msg: why + ": merge runs of " + A[1] + " and " + B[1] + (gal >= 7 ? " — one side won " + gal + " in a row, so galloping would engage here" : ""), gallop: gal >= 7, merge: true });
      }
      function collapse() {
        while (stack.length > 1) {
          var n = stack.length - 2, len = function (i) { return stack[i][1]; };
          if ((n > 0 && len(n - 1) <= len(n) + len(n + 1)) || (n > 1 && len(n - 2) <= len(n - 1) + len(n))) {
            var why = "a run is no longer than the two newer runs on top of it combined: |Z| > |Y| + |X| is broken";
            if (len(n - 1) < len(n + 1)) n--;
            mergeAt(n, why);
          } else if (len(n) <= len(n + 1)) mergeAt(n, "invariant |Y| > |X| broken (" + len(n) + " ≤ " + len(n + 1) + ")");
          else break;
        }
      }
      snap({ msg: "Scan for runs before sorting anything." });
      i = 0;
      while (i < N) {
        var j = i + 1, desc = false;
        if (j < N) { cmps++; if (a[j] < a[i]) { desc = true; while (j + 1 < N && (cmps++, a[j + 1] < a[j])) j++; j++; } else { while (j + 1 < N && (cmps++, a[j + 1] >= a[j])) j++; j++; } }
        var natural = j - i;
        if (desc) { var seg = a.slice(i, j).reverse(); for (var q2 = 0; q2 < seg.length; q2++) a[i + q2] = seg[q2]; }
        snap({ hl: [i, j], msg: "found a " + (desc ? "strictly descending run of " + natural + ", reversed in place" : "run of " + natural + " already in order"), run: true });
        if (natural < MINRUN && j < N) {
          var end = Math.min(N, i + MINRUN);
          for (var p = j; p < end; p++) {
            var x = a[p], L2 = i, H = p;
            while (L2 < H) { var m = (L2 + H) >> 1; cmps++; if (x < a[m]) H = m; else L2 = m + 1; }
            for (var z = p; z > L2; z--) a[z] = a[z - 1];
            a[L2] = x;
          }
          j = end;
          snap({ hl: [i, j], msg: "shorter than minrun " + MINRUN + ": extended to " + (j - i) + " by binary insertion", run: true });
        }
        stack.push([i, j - i]);
        snap({ msg: "push a run of " + (j - i) + " onto the stack" });
        collapse();
        i = j;
      }
      while (stack.length > 1) { var n2 = stack.length - 2; if (n2 > 0 && stack[n2 - 1][1] < stack[n2 + 1][1]) n2--; mergeAt(n2, "input exhausted, force-collapse"); }
      for (i = 1; i < N; i++) if (a[i - 1] > a[i]) throw new Error("dsaTimsort: not sorted");
      snap({ done: true, msg: "sorted: " + cmps + " comparisons and " + merges + " merge" + (merges === 1 ? "" : "s") + " (n log₂n = 160)" });
    }
    var svg = svgOf(f, 330, "timsort runs and merge stack");
    function draw(k) {
      clear(svg);
      var s = tr[k];
      T(svg, 8, 14, SH[sh] + " input · n = 32 · minrun = 4 (scaled down) · step " + k + " of " + (tr.length - 1), { anchor: "start", size: 12, weight: 700 });
      T(svg, 752, 14, "comparisons " + s.cmps + " · merges " + s.merges, { anchor: "end", size: 11.5, weight: 700, fill: C.dim });
      var X0 = 20, bw = 520 / N, colors = [C.teal, C.blue, C.purple, C.orange, C.sky, C.pink];
      var owner = []; s.stack.forEach(function (r, q) { for (var t = r[0]; t < r[0] + r[1]; t++) owner[t] = q; });
      s.a.forEach(function (v, i) {
        var h = v / 60 * 140, inHl = s.hl && i >= s.hl[0] && i < s.hl[1];
        S("rect", { x: X0 + i * bw + 1, y: 190 - h, width: bw - 2, height: h, fill: owner[i] !== undefined ? colors[owner[i] % 6] : C.faint, opacity: inHl ? 1 : 0.55 }, svg);
      });
      if (s.hl) S("rect", { x: X0 + s.hl[0] * bw, y: 194, width: (s.hl[1] - s.hl[0]) * bw, height: 4, rx: 2, fill: s.merge ? C.orange : C.green }, svg);
      /* the merge stack */
      T(svg, 560, 40, "run stack (top = newest)", { anchor: "start", size: 10, fill: C.faint, mono: false });
      s.stack.slice().reverse().forEach(function (r, q) {
        var idx = s.stack.length - 1 - q, y = 50 + q * 26;
        rect(svg, 560, y, 60 + Math.min(130, r[1] * 4), 22, { rx: 4, fill: colors[idx % 6], stroke: "none", op: 0.5 });
        T(svg, 566, y + 11, "len " + r[1] + (q === 0 ? "  X" : q === 1 ? "  Y" : q === 2 ? "  Z" : ""), { anchor: "start", size: 10.5, weight: 600 });
      });
      var st = s.stack, n = st.length, ok1 = n < 2 || st[n - 2][1] > st[n - 1][1], ok2 = n < 3 || st[n - 3][1] > st[n - 2][1] + st[n - 1][1];
      T(svg, 560, 262, "|Y| > |X|: " + (ok1 ? "holds" : "broken"), { anchor: "start", size: 10, fill: ok1 ? C.green : C.pink });
      T(svg, 560, 278, "|Z| > |Y| + |X|: " + (ok2 ? "holds" : "broken"), { anchor: "start", size: 10, fill: ok2 ? C.green : C.pink });
      say(svg, 226, s.msg, s.gallop ? C.orange : s.done ? C.green : C.text);
      T(svg, 8, 252, "coloured bars belong to a run on the stack; grey ones have not been scanned yet", { anchor: "start", size: 9.5, fill: C.faint, mono: false });
    }
    K.tabs(f.controls, SH, sh, function (k) { sh = k; build(); sp.reload();
      f.say(k === 1 ? "Sorted: one run, found by the scanner, and nothing to merge." : k === 2 ? "Reversed: one strictly descending run, reversed in one pass." : "Step through and watch runs found before any merging."); });
    var sp = stepper(f, function () { return tr.length - 1; }, draw);
    build(); draw(0);
    f.say("Timsort looks for runs that are already sorted. Watch it find them before it does any work; on nearly sorted input, find the point where there is nothing left to merge.");
  };

  /* ------------------------------------------------------------------------
     dsaHashTable — ch17 §4–5. h(k) = k mod m. Chaining is ChainedMap
     (resize past α = 1); open addressing is ProbingMap (resize when live +
     tombstones would pass 2/3), with the probe sequence switchable.
     ------------------------------------------------------------------------ */
  VIZ.dsaHashTable = function (el) {
    var f = frame(el);
    var STRAT = ["chaining", "linear", "quadratic", "double"], st = 1, tomb = false, m = 8, slots = [], chains = [], last = null, lastMsg = "";
    var EMPTY = null, TOMB = "†";
    function reset() { m = 8; slots = []; chains = []; for (var i = 0; i < m; i++) { slots.push(EMPTY); chains.push([]); } last = null; }
    function g(k) { return 2 * (Math.floor(k / m) % (m / 2)) + 1; }
    function probe(k, i) { var h = k % m; return st === 1 ? (h + i) % m : st === 2 ? (h + i * i) % m : (h + i * g(k)) % m; }
    function find(k) {                // returns {slot, path}
      var path = [];
      for (var i = 0; i < m; i++) {
        var s = probe(k, i); path.push(s);
        if (slots[s] === EMPTY) return { slot: -1, path: path };
        if (slots[s] === k) return { slot: s, path: path };
      }
      return { slot: -1, path: path, full: true };
    }
    function used() { return slots.filter(function (x) { return x !== EMPTY; }).length; }
    function live() { return st === 0 ? chains.reduce(function (s, c) { return s + c.length; }, 0) : slots.filter(function (x) { return x !== EMPTY && x !== TOMB; }).length; }
    function keysNow() { return st === 0 ? [].concat.apply([], chains) : slots.filter(function (x) { return x !== EMPTY && x !== TOMB; }); }
    /* Reinsert keys into a fresh table of newM slots; a quadratic sequence that
       finds no free slot grows the table (up to 32) and starts again. */
    function rebuild(keys, newM) {
      m = newM; slots = []; chains = []; for (var i = 0; i < m; i++) { slots.push(EMPTY); chains.push([]); }
      var lost = keys.filter(function (k) {
        if (st === 0) { chains[k % m].push(k); return false; }
        for (var j = 0; j < m; j++) { var s = probe(k, j); if (slots[s] === EMPTY) { slots[s] = k; return false; } }
        return true;
      });
      if (lost.length && m < 32) return rebuild(keys, 2 * m);
      return lost;
    }
    function rehash(newM) { rebuild(keysNow(), newM); }
    function insert(k) {
      if (st === 0) {
        var c = chains[k % m];
        if (c.indexOf(k) >= 0) return (lastMsg = k + " is already in bucket " + (k % m));
        c.push(k); last = { path: [k % m], hit: k % m };
        lastMsg = "h(" + k + ") = " + k + " mod " + m + " = " + (k % m) + ": appended to that bucket (length " + c.length + ")";
        if (live() > m) { if (m >= 32) return (lastMsg += "; the machine stops growing at 32 slots"); rehash(2 * m); last = null; lastMsg += "; α passed 1, so the table doubled to " + m + " and every key was rehashed"; }
        return lastMsg;
      }
      var fnd = find(k);
      if (fnd.slot >= 0) return (lastMsg = k + " is already at slot " + fnd.slot);
      if (3 * (used() + 1) > 2 * m) {
        if (m >= 32 && 3 * live() >= m) return (lastMsg = "the machine stops growing at 32 slots");
        rehash(3 * live() >= m ? 2 * m : m);
        lastMsg = "live keys + tombstones would pass 2/3 of the table: resized to " + m + " (tombstones dropped). ";
      } else lastMsg = "";
      var path = [];
      for (var i = 0; i < m; i++) {
        var s = probe(k, i); path.push(s);
        if (slots[s] === EMPTY || slots[s] === TOMB) {
          var reuse = slots[s] === TOMB; slots[s] = k; last = { path: path, hit: s };
          return (lastMsg += "h(" + k + ") = " + (k % m) + "; placed at slot " + s + " after " + path.length + " probe" + (path.length > 1 ? "s" : "") + (reuse ? ", reusing a tombstone" : ""));
        }
      }
      last = { path: path };
      var offs = {}; for (i = 0; i < m; i++) offs[(i * i) % m] = 1;
      return (lastMsg += "no free slot on " + k + "'s probe sequence" + (st === 2 ? ": offsets i² mod " + m + " reach only " + Object.keys(offs).join(", ") + " — quadratic probing on a power-of-two table cannot see most slots" : ""));
    }
    function remove(k) {
      if (st === 0) {
        var c = chains[k % m], i = c.indexOf(k);
        if (i < 0) return (lastMsg = k + " is not in the table");
        c.splice(i, 1); last = { path: [k % m] };
        return (lastMsg = "unlinked " + k + " from bucket " + (k % m) + ": chaining has no deletion bug");
      }
      var fnd = find(k);
      if (fnd.slot < 0) return (lastMsg = k + " not found (" + fnd.path.length + " probes)");
      slots[fnd.slot] = tomb ? TOMB : EMPTY; last = { path: fnd.path, hit: fnd.slot };
      return (lastMsg = "deleted " + k + " at slot " + fnd.slot + (tomb ? ": left a tombstone, so probes keep walking through it" : ": slot cleared to EMPTY — any key whose probe sequence passed through here is now cut off"));
    }
    function lookup(k) {
      if (st === 0) { var c = chains[k % m]; last = { path: [k % m], hit: c.indexOf(k) >= 0 ? k % m : undefined }; return (lastMsg = "bucket " + (k % m) + ": " + (c.indexOf(k) >= 0 ? "found after " + (c.indexOf(k) + 1) + " comparison(s)" : "walked " + c.length + " key(s), not there")); }
      var fnd = find(k); last = { path: fnd.path, hit: fnd.slot >= 0 ? fnd.slot : undefined };
      return (lastMsg = fnd.slot >= 0 ? "found " + k + " at slot " + fnd.slot + " in " + fnd.path.length + " probes" : k + " not found: the probe hit an empty slot after " + fnd.path.length + " probes");
    }
    function stranded() {
      if (st === 0) return [];
      return slots.filter(function (x) { return x !== EMPTY && x !== TOMB && find(x).slot < 0; });
    }
    var svg = svgOf(f, 330, "hash table slots, probe path and unreachable keys");
    function render() {
      clear(svg);
      var lv = live(), strand = stranded(), cw = 720 / m;
      T(svg, 8, 14, STRAT[st] + " · m = " + m + " · h(k) = k mod " + m + (st === 3 ? " · step g(k) = 2(⌊k/m⌋ mod " + m / 2 + ") + 1" : "") + " · α = " + (lv / m).toFixed(2),
        { anchor: "start", size: 11.5, weight: 700 });
      for (var i = 0; i < m; i++) {
        var x = 20 + i * cw, v = slots[i], onPath = last && last.path.indexOf(i) >= 0, isHit = last && last.hit === i;
        var isStr = st !== 0 && strand.indexOf(v) >= 0;
        rect(svg, x + 2, 40, cw - 4, 38, { rx: 5, fill: isStr ? C.pink : isHit ? C.green : onPath ? C.orange : C.card, op: isStr || isHit || onPath ? 0.3 : 1, stroke: isStr ? C.pink : onPath ? C.orange : C.line, sw: onPath || isStr ? 2 : 1.2 });
        if (st !== 0) T(svg, x + cw / 2, 59, v === EMPTY ? "" : String(v), { size: m > 16 ? 10 : 14, weight: 700, fill: v === TOMB ? C.faint : C.text });
        T(svg, x + cw / 2, 90, String(i), { size: 8.5, fill: C.faint });
        if (onPath && st !== 0) T(svg, x + cw / 2, 30, "#" + (last.path.indexOf(i) + 1), { size: 9, fill: C.orange, weight: 700 });
        if (st === 0) chains[i].forEach(function (k, q) {
          if (q > 5) return;
          line(svg, x + cw / 2, 78 + q * 26, x + cw / 2, 84 + q * 26, { stroke: C.line });
          rect(svg, x + 4, 84 + q * 26 + 4, cw - 8, 20, { rx: 4, fill: C.card });
          T(svg, x + cw / 2, 84 + q * 26 + 14, q === 5 ? "+" + (chains[i].length - 5) : String(k), { size: m > 16 ? 9 : 11, weight: 600 });
        });
      }
      var y0 = st === 0 ? 256 : 128;
      say(svg, y0, lastMsg || "Type a key and insert it. Try 1, 9 and 17: all hash to slot 1 when m = 8.");
      if (strand.length) T(svg, 8, y0 + 26, "UNREACHABLE: " + strand.join(", ") + " — still in the table, but every lookup for it stops at the empty slot first", { anchor: "start", size: 12, weight: 700, fill: C.pink, mono: false });
      if (st !== 0) {
        T(svg, 8, y0 + 56, "slots used (live + tombstones): " + used() + " of " + m + " · live keys: " + lv + " · tombstones: " + slots.filter(function (x) { return x === TOMB; }).length,
          { anchor: "start", size: 10.5, fill: C.dim, mono: false });
        T(svg, 8, y0 + 78, "orange: the last operation's probe path, numbered · † = tombstone · pink = a key no lookup can reach", { anchor: "start", size: 9.5, fill: C.faint, mono: false });
      }
    }
    function num(v) { var k = parseInt(v, 10); return isNaN(k) || k < 0 || k > 999 ? null : k; }
    var inp = D.input(f.controls, "17", "key to insert, delete or look up (0–999)", "5em", function (v) { var k = num(v); if (k !== null) { insert(k); render(); } });
    [["insert", insert], ["delete", remove], ["look up", lookup]].forEach(function (p) {
      f.btn(p[0], function () { var k = num(inp.value); if (k === null) { lastMsg = "keys are whole numbers 0–999"; render(); return; } p[1](k); render(); });
    });
    f.btn("1, 9, 17 then delete 9", function () { reset(); [1, 9, 17].forEach(insert); remove(9); lookup(17); render(); });
    K.tabs(f.controls, STRAT, st, function (k) {
      var keys = keysNow(); st = k; var lost = rebuild(keys, m); last = null;
      lastMsg = "same keys, reinserted under " + STRAT[k] + (lost.length ? "; no free slot on the probe sequence of " + lost.join(", ") + ", so they were dropped" : "");
      render();
    });
    K.toggle(f.controls, "tombstones", tomb, function (on) { tomb = on; render(); f.say(on ? "Tombstones on: delete marks the slot, and lookups walk through it." : "Tombstones off: delete clears the slot to empty. Find the key this strands."); });
    f.btn("clear", function () { reset(); lastMsg = ""; render(); });
    reset(); render();
    f.say("Insert keys and watch collisions resolve. Try deleting one from the middle of a chain with tombstones off, and find the key that becomes unreachable.");
  };

  /* ------------------------------------------------------------------------
     dsaLoadFactor — ch17 §6. Knuth's formulas, and a table of m = 4,096
     filled to α and measured, redrawn each time the slider moves.
     ------------------------------------------------------------------------ */
  VIZ.dsaLoadFactor = function (el) {
    var f = frame(el);
    var alpha = 0.5, succ = false, show = [true, true, true];
    var NAMES = ["linear probing", "double hashing", "chaining"], COL = [C.pink, C.blue, C.teal];
    function formula(s, a) {
      if (!succ) return [0.5 * (1 + 1 / ((1 - a) * (1 - a))), 1 / (1 - a), a][s];
      return [0.5 * (1 + 1 / (1 - a)), Math.log(1 / (1 - a)) / a, 1 + a / 2][s];
    }
    function measure(a) {
      var M = 4096, n = Math.round(a * M), r = lcg(Math.round(a * 1000) + 3), res = [];
      /* linear */
      var t = new Array(M).fill(0), totS = 0, i, j, k;
      for (k = 0; k < n; k++) { var h = r(M), p = 1; while (t[h]) { h = (h + 1) % M; p++; } t[h] = 1; totS += p; }
      var totU = 0; for (i = 0; i < M; i++) { j = i; var q = 1; while (t[j]) { j = (j + 1) % M; q++; } totU += q; }
      res.push(succ ? totS / n : totU / M);
      /* double: a random odd step per key (M is a power of two) */
      t = new Array(M).fill(0); totS = 0;
      for (k = 0; k < n; k++) { var h2 = r(M), st = 2 * r(M / 2) + 1, p2 = 1; while (t[h2]) { h2 = (h2 + st) % M; p2++; } t[h2] = 1; totS += p2; }
      totU = 0; for (i = 0; i < 2000; i++) { var hh = r(M), s2 = 2 * r(M / 2) + 1, q2 = 1; while (t[hh]) { hh = (hh + s2) % M; q2++; } totU += q2; }
      res.push(succ ? totS / n : totU / 2000);
      /* chaining: keys compared */
      var b = new Array(M).fill(0); for (k = 0; k < n; k++) b[r(M)]++;
      if (succ) { var tot = 0; b.forEach(function (c) { tot += c * (c + 1) / 2; }); res.push(tot / n); }
      else res.push(n / M);
      return res;
    }
    var svg = svgOf(f, 340, "average probes against load factor");
    function render() {
      clear(svg);
      var X0 = 60, X1 = 740, Y0 = 30, Y1 = 250, LMAX = 3;       // log10 scale, 1 … 1000
      function px(a) { return X0 + a * (X1 - X0); }
      function py(v) { return Y1 - Math.max(0, Math.min(LMAX, Math.log10(Math.max(v, 1e-9) < 1 ? 1 : v))) / LMAX * (Y1 - Y0); }
      T(svg, 8, 14, "average probes per " + (succ ? "successful" : "unsuccessful") + " search against load factor α = " + alpha.toFixed(2), { anchor: "start", size: 12.5, weight: 700 });
      [1, 10, 100, 1000].forEach(function (v) { line(svg, X0, py(v), X1, py(v), { stroke: C.line, dash: "2 4" }); T(svg, X0 - 6, py(v), String(v), { anchor: "end", size: 9.5, fill: C.faint }); });
      [0, 0.25, 0.5, 0.75, 1].forEach(function (a) { T(svg, px(a), Y1 + 14, a.toFixed(2), { size: 9.5, fill: C.faint }); });
      [0, 1, 2].forEach(function (s) {
        if (!show[s]) return;
        var d = "";
        for (var a = 0.01; a <= 0.995; a += 0.005) d += (d ? " L " : "M ") + px(a).toFixed(1) + " " + py(formula(s, a)).toFixed(1);
        S("path", { d: d, fill: "none", stroke: COL[s], "stroke-width": 2 }, svg);
      });
      line(svg, px(alpha), Y0, px(alpha), Y1, { stroke: C.text, dash: "3 3" });
      var ms = measure(alpha);
      [0, 1, 2].forEach(function (s) {
        if (!show[s]) return;
        S("circle", { cx: px(alpha), cy: py(ms[s]), r: 5, fill: "none", stroke: COL[s], "stroke-width": 2 }, svg);
        var y = 290 + s * 18;
        T(svg, 8, y, NAMES[s], { anchor: "start", size: 11, fill: COL[s], weight: 700, mono: false });
        T(svg, 150, y, "formula " + formula(s, alpha).toFixed(2), { anchor: "start", size: 11 });
        T(svg, 300, y, "measured " + ms[s].toFixed(2), { anchor: "start", size: 11, weight: 600 });
      });
      T(svg, 752, 290, "lines: Knuth's formulas", { anchor: "end", size: 9.5, fill: C.faint, mono: false });
      T(svg, 752, 308, "rings: a 4,096-slot table filled to α", { anchor: "end", size: 9.5, fill: C.faint, mono: false });
      T(svg, 752, 326, "chaining counts keys compared", { anchor: "end", size: 9.5, fill: C.faint, mono: false });
    }
    K.slider(f.controls, "α", 0.1, 0.99, alpha, 0.01, function (v) { return v.toFixed(2); }, function (v) { alpha = v; render(); });
    K.tabs(f.controls, ["unsuccessful", "successful"], 0, function (k) { succ = k === 1; render(); });
    NAMES.forEach(function (nm, s) { K.toggle(f.controls, nm, true, function (on) { show[s] = on; render(); }); });
    render();
    f.say("Drag the load factor. The curves are average probes per lookup: find where linear probing's unsuccessful search passes 10, and read chaining at the same load.");
  };

  /* ------------------------------------------------------------------------
     dsaHashFlood — ch17 §2, §3, §7. A chained table of 101 buckets; each
     insert walks its bucket for a duplicate first. Fixed h(k) = k mod 101,
     or h_ab(k) = ((a·k + b) mod p) mod 101 with p = 2³¹ − 1.
     ------------------------------------------------------------------------ */
  VIZ.dsaHashFlood = function (el) {
    var f = frame(el);
    var M = 101, P = 2147483647, n = 1000, seedOn = false, stream = 0, ab = [1, 0], log = [], counts = [], cmps = 0, prog = 1, timer = null;
    function mulmod(a, k) { return Number((BigInt(a) * BigInt(k)) % BigInt(P)); }
    function h(k) { return seedOn ? (mulmod(ab[0], k) + ab[1]) % P % M : k % M; }
    function newSeed() { ab = [1 + Math.floor(Math.random() * (P - 1)), Math.floor(Math.random() * P)]; }   // a real draw: that is the defence
    function run() {
      var r = lcg(9), keys = [], i;
      for (i = 1; i <= n; i++) keys.push(stream ? 101 * i : 1 + r(1000000));
      counts = new Array(M).fill(0); cmps = 0;
      keys.forEach(function (k) { var b = h(k); cmps += counts[b]; counts[b]++; });
      var worst = Math.max.apply(null, counts);
      log.unshift([stream ? "adversarial" : "normal", seedOn ? "random" : "k mod 101", n, worst, cmps]);
      log = log.slice(0, 4);
      if (timer) clearInterval(timer);
      if (D.REDUCED) { prog = 1; render(); return; }
      prog = 0;
      timer = setInterval(function () { prog = Math.min(1, prog + 0.06); render(); if (prog >= 1) { clearInterval(timer); timer = null; } }, 30);
    }
    var svg = svgOf(f, 330, "bucket sizes in a chained hash table under two key streams");
    function render() {
      clear(svg);
      T(svg, 8, 14, (stream ? "adversarial: 101, 202, 303, …" : "normal: random keys") + " · n = " + commas(n) + " · hash: " + (seedOn ? "((a·k + b) mod p) mod 101" : "k mod 101"),
        { anchor: "start", size: 12, weight: 700 });
      if (seedOn) T(svg, 8, 32, "a = " + commas(ab[0]) + ", b = " + commas(ab[1]) + ", drawn at table creation", { anchor: "start", size: 10, fill: C.dim });
      var top = Math.max(20, Math.max.apply(null, counts.concat([1]))), bw = 720 / M;
      counts.forEach(function (c, b) {
        var hgt = 150 * Math.min(1, c * prog / top);
        S("rect", { x: 20 + b * bw, y: 200 - hgt, width: Math.max(1, bw - 1), height: hgt, fill: c > 3 * n / M ? C.pink : C.blue, opacity: 0.8 }, svg);
      });
      line(svg, 20, 200, 740, 200, { stroke: C.line });
      T(svg, 20, 214, "bucket 0", { anchor: "start", size: 9, fill: C.faint });
      T(svg, 740, 214, "bucket 100", { anchor: "end", size: 9, fill: C.faint });
      T(svg, 752, 48, "tallest bar: " + top + " keys", { anchor: "end", size: 10, fill: C.dim });
      /* the run log */
      T(svg, 8, 236, "stream", { anchor: "start", size: 9.5, fill: C.faint, mono: false });
      ["hash", "n", "worst bucket", "comparisons"].forEach(function (h2, j) { T(svg, 150 + j * 150, 236, h2, { anchor: "start", size: 9.5, fill: C.faint, mono: false }); });
      log.forEach(function (r, q) {
        var y = 254 + q * 18, bad = r[3] > r[2] / 4;
        T(svg, 8, y, r[0], { anchor: "start", size: 10.5, fill: bad ? C.pink : C.text });
        [r[1], commas(r[2]), commas(r[3]), commas(r[4])].forEach(function (v, j) { T(svg, 150 + j * 150, y, v, { anchor: "start", size: 10.5, fill: bad ? C.pink : C.text, weight: j === 3 ? 700 : 400 }); });
      });
    }
    K.tabs(f.controls, ["normal stream", "adversarial stream"], 0, function (k) { stream = k; run(); });
    K.toggle(f.controls, "randomized seed", false, function (on) { seedOn = on; if (on) newSeed(); run();
      f.say(on ? "Seed on: the attacker's keys are now arbitrary numbers to a function they could not predict." : "Seed off: the hash is k mod 101, public and fixed."); });
    f.btn("draw a new seed", function () { if (seedOn) { newSeed(); run(); } });
    K.slider(f.controls, "n", 200, 2000, n, 200, commas, function (v) { n = v; run(); });
    run();
    f.say("Two key streams, one table. Run the adversarial stream with the seed off and watch every key land in one bucket; then double n and watch the comparisons quadruple.");
  };
})();
