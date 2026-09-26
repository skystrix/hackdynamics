/* ==========================================================================
   viz-dsa8.js — DSA By Patterns machines, Part 6 (The Edges and the
   Engineer, ch40–49).

     dsaBits           ch40 Playground bits you click, and the standard tricks applied to them
     dsaPrefixFunction ch41 Builder    π filled from the border chain; the border drawn over the prefix
     dsaKMP            ch41 Stepper    KMP's comparisons against the naive search's
     dsaRollingHash    ch41 Stepper    the rolling polynomial hash, spurious hits counted
     dsaAhoCorasick    ch42 Builder    trie, failure links, output links, one pass over the text
     dsaSuffixArray    ch43 Builder    prefix doubling, one stage at a time
     dsaSieve          ch44 Stepper    four sieves, strikes counted against n ln n and n ln ln n
     dsaOrientation    ch45 Playground the integer cross product, and doubles that get the sign wrong
     dsaReduction      ch46 Stepper    3-SAT → independent set, cover ↔ independent set, subset sum → partition
     dsaRecognize      ch47 Playground the five steps on the chapter's six problems
     dsaContainerCosts ch48 Comparator the chapter's measured container table, by language and operation
     dsaProblemIndex   ch49 Playground the chapter's 54 problem shapes, searchable

   Routines are the chapters' own (lowest_set_bit, prefix_function,
   kmp_find_all, rabin_karp, the Aho–Corasick search, suffix_array,
   primes_up_to, cross). Needs viz-rag-kit.js and viz-dsa1.js.
   ========================================================================== */

(function () {
  "use strict";
  window.VIZ = window.VIZ || {};
  var K = window.RAGKIT, D = window.DSAKIT;
  if (!K || !D) throw new Error("viz-dsa8.js needs viz-rag-kit.js and viz-dsa1.js loaded first");
  var C = K.C, S = K.S, T = K.T, rect = K.rect, line = K.line, frame = K.frame;
  var clear = D.clear, commas = D.commas, stepper = D.stepper, row = D.row, lcg = D.lcg, focusable = D.focusable, wrap = D.wrap;

  function svgOf(f, h, label, role) { return S("svg", { viewBox: "0 0 760 " + h, width: "100%", role: role || "img", "aria-label": label }, f.body); }
  function presetRow(f, list, fn) {
    var r = row(f.controls);
    list.forEach(function (p, i) { var b = document.createElement("button"); b.type = "button"; b.textContent = p; b.addEventListener("click", function () { fn(i); }); r.appendChild(b); });
    return r;
  }
  /* A row of character cells; style(i) -> {fill, op, stroke, col}. Returns x of cell i. */
  function chars(svg, s, x0, y, cw, style, idx) {
    for (var i = 0; i < s.length; i++) {
      var st = style ? style(i) || {} : {};
      rect(svg, x0 + i * cw + 1, y, cw - 2, 26, { rx: 4, fill: st.fill || C.card, op: st.op == null ? 1 : st.op, stroke: st.stroke || C.line, sw: st.sw || 1 });
      T(svg, x0 + i * cw + cw / 2, y + 13, s[i], { size: cw < 22 ? 11 : 13, weight: 700, fill: st.col || C.text });
      if (idx) T(svg, x0 + i * cw + cw / 2, y + 34, String(i), { size: 8, fill: C.faint });
    }
  }

  /* ------------------------------------------------------------------------
     dsaBits — ch40 §2. 8 or 32 bits; negation is shown as ~n, then + 1.
     ------------------------------------------------------------------------ */
  VIZ.dsaBits = function (el) {
    var f = frame(el);
    var W = 8, n = 12, signed = true, op = 0, OPS = ["n & (n−1)", "n & −n", "n | (n+1)", "n << 1", "n >> 1", "n >>> 1", "~n", "−n"];
    function mask(x) { return W === 32 ? x | 0 : x & 255; }
    function asNum(x) { x = mask(x); if (W === 32) return signed ? x : x >>> 0; return signed && x & 128 ? x - 256 : x; }
    function bits(x) { var s = ""; for (var i = W - 1; i >= 0; i--) s += (x >>> i) & 1; return s; }
    function apply(x) { switch (op) { case 0: return x & (x - 1); case 1: return x & -x; case 2: return x | (x + 1); case 3: return x << 1; case 4: return W === 8 ? ((x << 24) >> 24) >> 1 : x >> 1; case 5: return W === 8 ? (x & 255) >>> 1 : x >>> 1; case 6: return ~x; default: return -x; } }
    var svg = svgOf(f, 300, "bits of a value and an operation applied to them; click a bit to flip it", "group");
    function render() {
      clear(svg);
      n = mask(n);
      var r = mask(apply(n)), cw = Math.min(40, 580 / W), X0 = (760 - cw * W) / 2;
      T(svg, 8, 14, W + "-bit " + (signed ? "signed" : "unsigned") + " · " + OPS[op], { anchor: "start", size: 12.5, weight: 700 });
      function rowOf(y, x, label, clickable, cmp) {
        T(svg, X0 - 10, y + 13, label, { anchor: "end", size: 10.5, fill: C.dim, mono: false });
        var b = bits(x);
        for (var i = 0; i < W; i++) {
          var bit = b[i], changed = cmp !== undefined && bits(cmp)[i] !== bit;
          var c = rect(svg, X0 + i * cw + 1, y, cw - 2, 26, { rx: 4, fill: bit === "1" ? C.blue : C.card, op: bit === "1" ? 0.45 : 1, stroke: changed ? C.orange : C.line, sw: changed ? 2.4 : 1 });
          T(svg, X0 + i * cw + cw / 2, y + 13, bit, { size: W === 32 ? 10 : 13, weight: 700 });
          if (clickable) (function (pos, node) { function tg() { n = mask(n ^ (1 << pos)); render(); } node.addEventListener("click", tg); focusable(node, "bit " + pos, tg); })(W - 1 - i, c);
        }
        T(svg, X0 + W * cw + 10, y + 13, String(asNum(x)), { anchor: "start", size: 12, weight: 700 });
      }
      for (var i = 0; i < W; i += W === 32 ? 4 : 1) T(svg, X0 + i * cw + cw / 2, 36, String(W - 1 - i), { size: 8, fill: C.faint });
      rowOf(44, n, "n", true);
      if (op === 7) {
        rowOf(88, ~n, "~n", false, n);
        rowOf(132, r, "~n + 1", false, ~n);
        var low = n & -n, pos = low ? Math.round(Math.log2(low >>> 0)) : -1;
        wrap(svg, 8, 186, n === 0 ? "−0 is 0: inverting gives all ones, and adding one carries off the top." : "Invert every bit, then add one. The carry runs through the ones that were n's low zeros and stops at bit " + pos + ", n's lowest set bit: below it −n matches n, above it −n is n inverted.", 744, { size: 11.5 });
      } else {
        rowOf(88, r, OPS[op], false, n);
        var why = ["subtracting 1 turns the lowest set bit to 0 and the zeros below it to 1; and-ing clears exactly that bit", "−n is ~n + 1, which agrees with n only at its lowest set bit: that bit alone survives", "adding 1 sets the lowest zero bit (clearing the ones below it); or-ing restores them",
          "every bit moves up one place: multiplication by 2, with the top bit lost", "arithmetic shift: the sign bit is copied in, so negative numbers stay negative", "logical shift: a zero comes in at the top", "every bit inverted: ~n = −n − 1 in two's complement", ""][op];
        wrap(svg, 8, 142, why, 744, { size: 11.5 });
      }
      var pow = n > 0 && (n & (n - 1)) === 0;
      T(svg, 8, 250, "power of two? n > 0 and n & (n−1) == 0 → " + (pow ? "yes" : "no") + (W === 32 && n === (-2147483648 | 0) ? " — without the n > 0 guard, MIN_VALUE would pass" : ""), { anchor: "start", size: 11, fill: pow ? C.green : C.dim, mono: false });
      T(svg, 8, 274, "click the top row's bits to flip them · orange outline: a bit the operation changed", { anchor: "start", size: 9.5, fill: C.faint, mono: false });
    }
    var inp = D.input(f.controls, "12", "value", "6em", function (v) { var x = parseInt(v, 10); if (!isNaN(x)) { n = x; render(); } });
    f.btn("set", function () { var x = parseInt(inp.value, 10); if (!isNaN(x)) { n = x; render(); } });
    K.tabs(f.controls, OPS, op, function (k) { op = k; render(); });
    K.tabs(f.controls, ["8-bit", "32-bit"], 0, function (k) { W = k ? 32 : 8; render(); });
    K.toggle(f.controls, "signed", signed, function (on) { signed = on; render(); });
    render();
    f.say("Click bits to flip them. Apply an operation and watch what it does to the pattern; negate a number and find where 'invert and add one' shows bit by bit.");
  };

  /* ------------------------------------------------------------------------
     dsaPrefixFunction — ch41 §3, prefix_function. Steps: each comparison
     and each fallback k = π[k − 1].
     ------------------------------------------------------------------------ */
  VIZ.dsaPrefixFunction = function (el) {
    var f = frame(el);
    var s = "abacabad", tr = [], overlay = true;
    function build() {
      var pi = [0], ev = [{ pi: [0], i: 0, k: 0, msg: "π[0] = 0: a one-character string has only the empty border" }];
      for (var i = 1; i < s.length; i++) {
        var k = pi[i - 1];
        ev.push({ pi: pi.slice(), i: i, k: k, msg: "i = " + i + ": start from the previous border, k = π[" + (i - 1) + "] = " + k });
        while (k > 0 && s[i] !== s[k]) { var k2 = pi[k - 1]; ev.push({ pi: pi.slice(), i: i, k: k2, fb: true, msg: "s[" + i + "] = " + s[i] + " ≠ s[" + k + "] = " + s[k] + ": fall back k = π[" + (k - 1) + "] = " + k2 }); k = k2; }
        if (s[i] === s[k]) k++;
        pi.push(k);
        ev.push({ pi: pi.slice(), i: i, k: k, set: true, msg: "π[" + i + "] = " + k + (k ? ": the longest border of " + s.slice(0, i + 1) + " is " + s.slice(0, k) : ": no border") });
      }
      tr = ev;
    }
    var svg = svgOf(f, 280, "prefix function table with the border overlaid");
    function draw(q) {
      clear(svg);
      var e = tr[q], n = s.length, cw = Math.min(46, 720 / n), X0 = (760 - cw * n) / 2, b = e.set ? e.pi[e.i] : e.k;
      T(svg, 8, 14, "s = " + s + " · step " + q + " of " + (tr.length - 1), { anchor: "start", size: 12.5, weight: 700 });
      chars(svg, s, X0, 34, cw, function (i) {
        if (i > e.i) return { col: C.faint };
        if (overlay && b && i < b) return { fill: C.teal, op: 0.35, stroke: C.teal };
        if (overlay && b && i > e.i - b && i <= e.i) return { fill: C.orange, op: 0.35, stroke: C.orange };
        return {};
      }, true);
      if (overlay && b && b * 2 > e.i + 1) T(svg, 752, 26, "the border overlaps itself", { anchor: "end", size: 10, fill: C.purple, weight: 700, mono: false });
      T(svg, X0 - 8, 98, "π", { anchor: "end", size: 13, weight: 700, fill: C.dim });
      for (var i = 0; i < n; i++) {
        var has = i < e.pi.length;
        rect(svg, X0 + i * cw + 1, 86, cw - 2, 26, { rx: 4, fill: i === e.i ? C.blue : C.card, op: i === e.i ? 0.3 : 1, stroke: C.line });
        if (has) T(svg, X0 + i * cw + cw / 2, 99, String(e.pi[i]), { size: 13, weight: 700, fill: i === e.i && e.set ? C.green : C.text });
      }
      wrap(svg, 8, 152, e.msg, 744, { size: 11.5, fill: e.fb ? C.orange : e.set ? C.green : C.text });
      T(svg, 8, 214, "teal: the border as a prefix · orange: the same string as a suffix of s[0.." + e.i + "]", { anchor: "start", size: 9.5, fill: C.faint, mono: false });
      var fbs = tr.slice(0, q + 1).filter(function (x) { return x.fb; }).length;
      T(svg, 8, 236, "fallbacks so far: " + fbs + " — never more than n − 1 = " + (n - 1) + " in all, however they bunch up", { anchor: "start", size: 10.5, fill: C.dim, mono: false });
    }
    var inp = D.input(f.controls, s, "pattern", "10em", function (v) { var x = v.replace(/[^a-z]/gi, "").slice(0, 16); if (x) { s = x; build(); sp.reload(); } });
    presetRow(f, ["abacabad", "aabaaab", "abababab", "aaaaaaab"], function (i) { s = ["abacabad", "aabaaab", "abababab", "aaaaaaab"][i]; inp.value = s; build(); sp.reload(); });
    K.toggle(f.controls, "show the border", overlay, function (on) { overlay = on; draw(sp.pos()); });
    var sp = stepper(f, function () { return tr.length - 1; }, draw);
    build(); draw(0);
    f.say("Each cell is the length of the longest border of that prefix; the overlay shows the border itself. Find a string whose border is longer than half its prefix, so the two copies overlap.");
  };

  function prefixFn(p) { var pi = [0]; for (var i = 1; i < p.length; i++) { var k = pi[i - 1]; while (k > 0 && p[i] !== p[k]) k = pi[k - 1]; if (p[i] === p[k]) k++; pi.push(k); } return pi; }

  /* ------------------------------------------------------------------------
     dsaKMP — ch41 §4, kmp_find_all. A comparison is one test of t[i]
     against p[k]; the naive search compares each alignment left to right.
     ------------------------------------------------------------------------ */
  VIZ.dsaKMP = function (el) {
    var f = frame(el);
    var PRE = [["abacabacabacabad", "abacabad"], ["aaaaaaaaaaaaaaaaaaaaaaab", "aaaaab"], ["abcxabcdabxabcdabcdabcy", "abcdabcy"]];
    var t = PRE[0][0], p = PRE[0][1], tr = [], showNaive = true;
    function naive() { var c = 0, hits = []; for (var s = 0; s + p.length <= t.length; s++) { var j = 0; while (j < p.length) { c++; if (t[s + j] !== p[j]) break; j++; } if (j === p.length) hits.push(s); } return { c: c, hits: hits }; }
    function build() {
      var pi = prefixFn(p), k = 0, cmp = 0, ev = [{ i: -1, k: 0, cmp: 0, found: [], msg: "π(" + p + ") = " + pi.join(", ") }], found = [];
      for (var i = 0; i < t.length; i++) {
        for (;;) {
          cmp++;
          if (t[i] === p[k]) { ev.push({ i: i, k: k, cmp: cmp, ok: true, found: found.slice(), msg: "t[" + i + "] = p[" + k + "] = " + t[i] + ": extend to " + (k + 1) }); k++; break; }
          if (k === 0) { ev.push({ i: i, k: 0, cmp: cmp, bad: true, found: found.slice(), msg: "t[" + i + "] ≠ p[0]: move on; the pattern slides one" }); break; }
          var k2 = pi[k - 1]; ev.push({ i: i, k: k, cmp: cmp, bad: true, found: found.slice(), msg: "t[" + i + "] = " + t[i] + " ≠ p[" + k + "] = " + p[k] + ": fall back to k = π[" + (k - 1) + "] = " + k2 + " — the pattern slides " + (k - k2) + ", the text pointer stays" }); k = k2;
        }
        if (k === p.length) { found.push(i - p.length + 1); ev.push({ i: i, k: k, cmp: cmp, found: found.slice(), hit: true, msg: "match at " + (i - p.length + 1) + "; fall back to π[m − 1] = " + pi[k - 1] + " to look for an overlapping one" }); k = pi[k - 1]; }
      }
      tr = ev;
    }
    var svg = svgOf(f, 300, "KMP against naive search");
    function draw(q) {
      clear(svg);
      var e = tr[q], n = t.length, cw = Math.min(30, 720 / n), X0 = 20, nv = naive(), done = q === tr.length - 1;
      T(svg, 8, 14, "KMP comparisons " + e.cmp + (showNaive ? " · naive comparisons (whole run) " + nv.c : "") + " · step " + q + " of " + (tr.length - 1), { anchor: "start", size: 12, weight: 700 });
      chars(svg, t, X0, 34, cw, function (i) { return i === e.i ? { fill: e.bad ? C.pink : C.green, op: 0.4, stroke: e.bad ? C.pink : C.green } : i < e.i ? { col: C.dim } : {}; }, true);
      if (e.i >= 0) {
        var start = e.i - e.k;
        chars(svg, p, X0 + start * cw, 84, cw, function (j) { return j < e.k ? { fill: j < e.k - (e.ok ? 0 : 0) ? C.teal : C.card, op: 0.3 } : j === e.k ? { stroke: e.bad ? C.pink : C.green, sw: 2 } : { col: C.faint }; });
        S("path", { d: "M " + (X0 + e.i * cw + cw / 2) + " 76 l -5 -8 l 10 0 z", fill: C.blue }, svg);
      }
      e.found.forEach(function (s) { rect(svg, X0 + s * cw + 1, 28, p.length * cw - 2, 3, { rx: 1, fill: C.green, stroke: "none" }); });
      wrap(svg, 8, 140, e.msg, 744, { size: 11.5, fill: e.hit ? C.green : e.bad ? C.orange : C.text });
      if (done) {
        T(svg, 8, 192, "KMP: " + e.cmp + " comparisons for " + n + " text characters" + (showNaive ? " · naive: " + nv.c + " (" + (nv.c / e.cmp).toFixed(1) + "×)" : ""), { anchor: "start", size: 12, weight: 700, fill: C.green, mono: false });
        T(svg, 8, 214, "matches at " + (e.found.length ? e.found.join(", ") : "none") + " · the text pointer (blue) never moved back", { anchor: "start", size: 11, fill: C.dim, mono: false });
      }
      T(svg, 8, 276, "teal: pattern characters the border guarantees — KMP never reads them again", { anchor: "start", size: 9.5, fill: C.faint, mono: false });
    }
    var ti = D.input(f.controls, t, "text", "14em", function () { apply(); });
    var pinp = D.input(f.controls, p, "pattern", "8em", function () { apply(); });
    function apply() { var a = ti.value.replace(/\s/g, "").slice(0, 28), b = pinp.value.replace(/\s/g, "").slice(0, 12); if (a && b && b.length <= a.length) { t = a; p = b; build(); sp.reload(); } }
    presetRow(f, ["chapter's figure", "a…ab", "abcdabcy"], function (i) { t = PRE[i][0]; p = PRE[i][1]; ti.value = t; pinp.value = p; build(); sp.reload(); });
    K.toggle(f.controls, "naive count", showNaive, function (on) { showNaive = on; draw(sp.pos()); });
    var sp = stepper(f, function () { return tr.length - 1; }, draw);
    build(); draw(0);
    f.say("Two counters: naive comparisons and KMP's. Find a text and pattern where naive does ten times the work, and confirm the text pointer never moves back in KMP.");
  };

  /* ------------------------------------------------------------------------
     dsaRollingHash — ch41 §6, rabin_karp's polynomial hash, rolled one
     window at a time. BigInt keeps the 2⁶¹ − 1 arithmetic exact.
     ------------------------------------------------------------------------ */
  VIZ.dsaRollingHash = function (el) {
    var f = frame(el);
    var MODS = [["11 (a bad one)", 11n], ["2³² (Java's hashCode)", 4294967296n], ["2⁶¹ − 1", 2305843009213693951n]], BASES = [["31", 31n], ["256", 256n], ["random", null]];
    var PRE = [["the quick brown fox jumps over the lazy dog", "fox"], ["AaAaAaAaBBAaBB", "BB"], ["abracadabra cadabra abracad", "cad"]];
    var t = PRE[0][0], p = PRE[0][1], mi = 0, bi = 0, rb = 0n, tr = [];
    function B() { return BASES[bi][1] !== null ? BASES[bi][1] : rb; }
    function build() {
      var M = MODS[mi][1], b = B(), m = p.length, hp = 0n, h = 0n, i, pw = 1n;
      for (i = 0; i < m - 1; i++) pw = pw * b % M;
      for (i = 0; i < m; i++) { hp = (hp * b + BigInt(p.charCodeAt(i))) % M; h = (h * b + BigInt(t.charCodeAt(i))) % M; }
      var ev = [], spur = 0, hits = 0, ver = 0;
      for (var s = 0; s + m <= t.length; s++) {
        if (s) { var out = BigInt(t.charCodeAt(s - 1)), inn = BigInt(t.charCodeAt(s + m - 1)); h = (((h - out * pw) % M + M) * b + inn) % M; }
        var eq = h === hp, real = false, c = 0;
        if (eq) { real = true; for (var j = 0; j < m; j++) { c++; if (t[s + j] !== p[j]) { real = false; break; } } ver += c; if (real) hits++; else spur++; }
        ev.push({ s: s, h: h, eq: eq, real: real, spur: spur, hits: hits, ver: ver, roll: s ? "h' = ((h − '" + t[s - 1] + "'·B^" + (m - 1) + ")·B + '" + t[s + m - 1] + "') mod M" : "the first window is hashed directly" });
      }
      tr = ev; tr.hp = hp;
    }
    var svg = svgOf(f, 300, "Rabin-Karp rolling hash");
    function draw(q) {
      clear(svg);
      var e = tr[q], n = t.length, m = p.length, cw = Math.min(26, 720 / n), X0 = 20;
      T(svg, 8, 14, "base " + (bi === 2 ? "random (" + rb + ")" : BASES[bi][0]) + " · modulus " + MODS[mi][0] + " · window " + (e.s + 1) + " of " + tr.length, { anchor: "start", size: 12, weight: 700 });
      chars(svg, t, X0, 34, cw, function (i) { return i >= e.s && i < e.s + m ? { fill: e.eq ? (e.real ? C.green : C.pink) : C.blue, op: 0.35, stroke: e.eq ? (e.real ? C.green : C.pink) : C.blue } : {}; });
      T(svg, 8, 96, "window hash  " + e.h.toString(), { anchor: "start", size: 12, weight: 700, fill: e.eq ? (e.real ? C.green : C.pink) : C.text });
      T(svg, 8, 118, "pattern hash " + tr.hp.toString() + "  (\"" + p + "\")", { anchor: "start", size: 12, weight: 700, fill: C.dim });
      T(svg, 8, 142, e.roll + " — O(1), whatever m is", { anchor: "start", size: 10.5, fill: C.dim });
      T(svg, 8, 172, e.eq ? (e.real ? "hashes equal and the characters match: a real occurrence" : "hashes equal but the characters differ: a spurious hit, caught only by checking") : "hashes differ: skip without reading the window", { anchor: "start", size: 11.5, weight: 600, fill: e.eq ? (e.real ? C.green : C.pink) : C.text, mono: false });
      T(svg, 8, 204, "so far: real matches " + e.hits + " · spurious hits " + e.spur + " · characters verified " + e.ver, { anchor: "start", size: 11.5, weight: 700, fill: e.spur ? C.pink : C.dim, mono: false });
      T(svg, 8, 236, "under base 31, \"Aa\" and \"BB\" are the same integer, 2112 — so they collide under every modulus, Java's 2³² included; only a random base separates them", { anchor: "start", size: 9.5, fill: C.faint, mono: false });
    }
    var ti = D.input(f.controls, t, "text", "16em", function () { apply(); });
    var pinp = D.input(f.controls, p, "pattern", "6em", function () { apply(); });
    function apply() { var a = ti.value.slice(0, 40), b = pinp.value.slice(0, 10); if (a && b && b.length <= a.length) { t = a; p = b; build(); sp.go(tr.length - 1); } }
    K.tabs(f.controls, MODS.map(function (x) { return "mod " + x[0]; }), mi, function (k) { mi = k; build(); sp.go(tr.length - 1); });
    K.tabs(f.controls, BASES.map(function (x) { return "base " + x[0]; }), bi, function (k) { bi = k; if (k === 2) rb = BigInt(2 + Math.floor(Math.random() * 1e9)); build(); sp.go(tr.length - 1); });
    presetRow(f, ["fox", "Aa / BB", "cadabra"], function (i) { t = PRE[i][0]; p = PRE[i][1]; ti.value = t; pinp.value = p; build(); sp.go(tr.length - 1); });
    var sp = stepper(f, function () { return tr.length - 1; }, draw);
    build(); draw(0);
    f.say("The hash updates in O(1) as the window slides. Pick the bad modulus and hunt for a false positive; then load Aa / BB and find which setting, modulus or base, stops the collisions.");
  };

  /* ------------------------------------------------------------------------
     dsaAhoCorasick — ch42 §2–3. goto as a trie, fail by BFS, output links
     to the nearest marked node on the failure chain.
     ------------------------------------------------------------------------ */
  VIZ.dsaAhoCorasick = function (el) {
    var f = frame(el);
    var pats = ["he", "she", "his", "hers"], text = "ushers", A = null, tr = [], showFail = true;
    function build() {
      var go = [{}], out = [[]], lab = [""], par = [-1];
      pats.forEach(function (w, idx) { var v = 0; for (var i = 0; i < w.length; i++) { if (go[v][w[i]] === undefined) { go[v][w[i]] = go.length; go.push({}); out.push([]); lab.push(lab[v] + w[i]); par.push(v); } v = go[v][w[i]]; } out[v].push(idx); });
      var fail = go.map(function () { return 0; }), link = go.map(function () { return -1; }), q = [], order = [];
      Object.keys(go[0]).forEach(function (c) { q.push(go[0][c]); });
      while (q.length) { var v = q.shift(); order.push(v); Object.keys(go[v]).forEach(function (c) { var u = go[v][c], x = fail[v]; while (x && go[x][c] === undefined) x = fail[x]; fail[u] = v && go[x][c] !== undefined ? go[x][c] : 0; if (fail[u] === u) fail[u] = 0; q.push(u); }); }
      order.forEach(function (u) { var fl = fail[u]; link[u] = out[fl].length ? fl : link[fl]; });
      A = { go: go, out: out, lab: lab, par: par, fail: fail, link: link };
      var v2 = 0, found = [], ev = [{ v: 0, i: -1, found: [], msg: "the automaton starts at the root" }];
      for (var i = 0; i < text.length; i++) {
        var c = text[i], fb = [];
        while (v2 && go[v2][c] === undefined) { fb.push(lab[v2] || "root"); v2 = fail[v2]; }
        v2 = go[v2][c] !== undefined ? go[v2][c] : 0;
        var u = out[v2].length ? v2 : link[v2], rep = [], viaLink = false;
        while (u > 0) { out[u].forEach(function (k) { found.push([i - pats[k].length + 1, pats[k]]); rep.push(pats[k]); }); if (u !== v2) viaLink = true; u = link[u]; }
        ev.push({ v: v2, i: i, found: found.slice(), rep: rep, viaLink: viaLink, msg: "'" + c + "'" + (fb.length ? ": no edge, fall back from " + fb.join(" → ") : "") + " → state " + (lab[v2] || "root") + (rep.length ? " · report " + rep.join(", ") + (viaLink ? " (one of them by an output link)" : "") : "") });
      }
      tr = ev;
    }
    var svg = svgOf(f, 360, "Aho-Corasick automaton and a scan of the text");
    function draw(q) {
      clear(svg);
      var e = tr[q], n = A.go.length, kids = A.go.map(function (g) { return Object.keys(g).sort().map(function (c) { return g[c]; }); });
      var slot = 0, pos = [], dep = [];
      (function lay(v, d) { dep[v] = d; if (!kids[v].length) { pos[v] = slot++; return; } kids[v].forEach(function (u) { lay(u, d + 1); }); pos[v] = (pos[kids[v][0]] + pos[kids[v][kids[v].length - 1]]) / 2; })(0, 0);
      var md = Math.max.apply(null, dep), W = 520 / Math.max(1, slot), H = Math.min(52, 200 / Math.max(1, md));
      var px = function (v) { return 20 + pos[v] * W + W / 2; }, py = function (v) { return 44 + dep[v] * H; };
      T(svg, 8, 14, "patterns: " + pats.join(", ") + " · text: " + text, { anchor: "start", size: 12, weight: 700 });
      for (var v = 1; v < n; v++) { line(svg, px(A.par[v]), py(A.par[v]), px(v), py(v), { stroke: C.line, sw: 1.4 }); T(svg, (px(A.par[v]) + px(v)) / 2 - 6, (py(A.par[v]) + py(v)) / 2, A.lab[v].slice(-1), { size: 9.5, fill: C.dim, weight: 700 }); }
      if (showFail) for (v = 1; v < n; v++) {
        var fl = A.fail[v]; if (!fl && dep[v] === 1) continue;
        var isOut = A.link[v] === fl && fl > 0;
        S("path", { d: "M " + px(v) + " " + py(v) + " Q " + ((px(v) + px(fl)) / 2 + 30) + " " + ((py(v) + py(fl)) / 2 - 10) + " " + px(fl) + " " + py(fl), fill: "none", stroke: isOut ? C.orange : C.purple, "stroke-width": isOut ? 2 : 1.2, "stroke-dasharray": "4 3", opacity: 0.8 }, svg);
      }
      for (v = 0; v < n; v++) {
        S("circle", { cx: px(v), cy: py(v), r: 12, fill: v === e.v ? C.blue : A.out[v].length ? C.green : C.card, opacity: v === e.v || A.out[v].length ? 0.45 : 1, stroke: v === e.v ? C.blue : C.line, "stroke-width": v === e.v ? 2.5 : 1 }, svg);
        T(svg, px(v), py(v) + 22, A.lab[v] || "root", { size: 8.5, fill: C.dim });
      }
      var X = 560, cw = Math.min(26, 190 / text.length);
      chars(svg, text, X, 44, cw, function (i) { return i === e.i ? { fill: C.blue, op: 0.4, stroke: C.blue } : i < e.i ? { col: C.dim } : {}; });
      T(svg, X, 96, "matches:", { anchor: "start", size: 10, fill: C.faint, mono: false });
      e.found.forEach(function (m, j) { T(svg, X, 114 + j * 16, m[1] + " at " + m[0], { anchor: "start", size: 10.5, weight: 600, fill: C.green }); });
      wrap(svg, 8, 292, e.msg, 744, { size: 11.5, fill: e.viaLink ? C.orange : e.rep && e.rep.length ? C.green : C.text });
      T(svg, 8, 344, "green: a pattern ends here · dashed purple: failure link · dashed orange: a failure link that is also an output link", { anchor: "start", size: 9.5, fill: C.faint, mono: false });
    }
    var pinp = D.input(f.controls, pats.join(", "), "patterns, comma separated", "12em", function () { apply(); });
    var tinp = D.input(f.controls, text, "text", "10em", function () { apply(); });
    function apply() { var ps = pinp.value.toLowerCase().split(/[\s,]+/).map(function (x) { return x.replace(/[^a-z]/g, ""); }).filter(Boolean).slice(0, 6), tx = tinp.value.toLowerCase().replace(/[^a-z]/g, "").slice(0, 14); if (ps.length && tx) { pats = ps; text = tx; build(); sp.reload(); } }
    f.btn("build", apply);
    K.toggle(f.controls, "failure links", showFail, function (on) { showFail = on; draw(sp.pos()); });
    var sp = stepper(f, function () { return tr.length - 1; }, draw);
    build(); draw(0);
    f.say("Add patterns, then scan the text once: every match is found without backing up. With she and he among the patterns, find the output link that reports both from one state.");
  };

  /* ------------------------------------------------------------------------
     dsaSuffixArray — ch43 §2, prefix doubling. Ranks are shown compressed
     (0, 1, 2 …) as the chapter's banana walk-through does.
     ------------------------------------------------------------------------ */
  VIZ.dsaSuffixArray = function (el) {
    var f = frame(el);
    var s = "banana", st = [], showSuf = true;
    function build() {
      var n = s.length, alpha = s.split("").slice().sort().filter(function (c, i, a) { return !i || c !== a[i - 1]; });
      var rank = s.split("").map(function (c) { return alpha.indexOf(c); }), sa = [], i;
      for (i = 0; i < n; i++) sa.push(i);
      sa.sort(function (a, b) { return rank[a] - rank[b] || a - b; });
      st = [{ k: 0, sa: sa.slice(), rank: rank.slice(), key: null, msg: "stage 0: rank each suffix by its first character" }];
      var k = 1;
      while (n > 1) {
        var key = function (x) { return [rank[x], x + k < n ? rank[x + k] : -1]; };
        sa.sort(function (a, b) { var ka = key(a), kb = key(b); return ka[0] - kb[0] || ka[1] - kb[1]; });
        var nw = []; nw[sa[0]] = 0;
        for (var j = 1; j < n; j++) { var a = key(sa[j]), b2 = key(sa[j - 1]); nw[sa[j]] = nw[sa[j - 1]] + (a[0] !== b2[0] || a[1] !== b2[1] ? 1 : 0); }
        var keys = sa.map(function (x) { return key(x); });
        rank = nw;
        var distinct = rank[sa[n - 1]] === n - 1;
        st.push({ k: k, sa: sa.slice(), rank: rank.slice(), keys: keys, msg: "stage " + st.length + ": sort by (rank[i], rank[i + " + k + "]) — the first " + 2 * k + " characters — " + (distinct ? "every rank is distinct: done" : "ties remain, so double again") });
        if (distinct) break;
        k *= 2;
      }
    }
    var svg = svgOf(f, 360, "suffix array by prefix doubling");
    function draw(q) {
      clear(svg);
      var e = st[q], n = s.length, ties = {};
      svg.setAttribute("viewBox", "0 0 760 " + Math.round(48 + n * Math.min(22, 290 / n) + 60));
      e.sa.forEach(function (x) { ties[e.rank[x]] = (ties[e.rank[x]] || 0) + 1; });
      T(svg, 8, 14, "s = " + s + " · stage " + q + " of " + (st.length - 1) + " · comparing the first " + (q ? 2 * e.k : 1) + " character" + (q ? "s" : ""), { anchor: "start", size: 12, weight: 700 });
      ["i", "rank", q ? "pair" : "", showSuf ? "suffix" : ""].forEach(function (h, j) { T(svg, [30, 90, 170, 300][j], 36, h, { anchor: "start", size: 9.5, fill: C.faint, mono: false }); });
      var rh = Math.min(22, 290 / n);
      e.sa.forEach(function (x, r) {
        var y = 48 + r * rh, tie = ties[e.rank[x]] > 1, len = q ? 2 * e.k : 1;
        rect(svg, 20, y, 720, rh - 2, { rx: 3, fill: tie ? C.orange : C.card, op: tie ? 0.15 : 1, stroke: "none" });
        T(svg, 30, y + rh / 2 - 1, String(x), { anchor: "start", size: 11, weight: 700 });
        T(svg, 90, y + rh / 2 - 1, String(e.rank[x]), { anchor: "start", size: 11, weight: 700, fill: tie ? C.orange : C.green });
        if (q) T(svg, 170, y + rh / 2 - 1, "(" + e.keys[r][0] + ", " + e.keys[r][1] + ")", { anchor: "start", size: 10.5, fill: C.dim });
        if (showSuf) { T(svg, 300, y + rh / 2 - 1, s.slice(x, x + len), { anchor: "start", size: 11, weight: 700, fill: C.blue }); T(svg, 300 + Math.min(len, n - x) * 7.2, y + rh / 2 - 1, s.slice(x + len), { anchor: "start", size: 11, fill: C.faint }); }
      });
      wrap(svg, 8, 48 + n * rh + 18, e.msg, 744, { size: 11.5, fill: q === st.length - 1 ? C.green : C.text });
      if (q === st.length - 1) T(svg, 8, 48 + n * rh + 44, "suffix array: [" + e.sa.join(", ") + "] after " + (st.length - 1) + " doubling stage" + (st.length === 2 ? "" : "s") + " (log₂ n = " + Math.log2(n).toFixed(1) + ")", { anchor: "start", size: 11.5, weight: 700, fill: C.green, mono: false });
    }
    var inp = D.input(f.controls, s, "string", "10em", function (v) { var x = v.replace(/\s/g, "").slice(0, 12); if (x) { s = x; build(); sp.reload(); } });
    presetRow(f, ["banana", "mississippi", "aaaaaaaa", "abcdefgh"], function (i) { s = ["banana", "mississippi", "aaaaaaaa", "abcdefgh"][i]; inp.value = s; build(); sp.reload(); });
    K.toggle(f.controls, "show suffixes", showSuf, function (on) { showSuf = on; draw(sp.pos()); });
    var sp = stepper(f, function () { return st.length - 1; }, draw);
    build(); draw(0);
    f.say("Sort by the first character, then the first two, then four: watch the ranks refine. Try a string of one repeated character and count the stages.");
  };

  /* ------------------------------------------------------------------------
     dsaSieve — ch44 §3. One step is one outer iteration: every strike it
     makes. Colours mark the prime that struck each composite first.
     ------------------------------------------------------------------------ */
  VIZ.dsaSieve = function (el) {
    var f = frame(el);
    var N = 120, v = 2, VAR = ["every number", "primes only", "from p², to √n", "linear"], tr = [];
    var COL = [C.blue, C.teal, C.orange, C.purple, C.pink, C.sky, C.green];
    function build() {
      var struck = [], by = [], strikes = 0, ev = [{ struck: [], by: [], strikes: 0, p: 0, msg: "2 … " + N + ", nothing struck" }];
      if (v === 3) {
        var primes = [], spf = [];
        for (var i = 2; i <= N; i++) {
          if (!spf[i]) { spf[i] = i; primes.push(i); }
          var made = [];
          for (var j = 0; j < primes.length && primes[j] <= spf[i] && i * primes[j] <= N; j++) { spf[i * primes[j]] = primes[j]; struck[i * primes[j]] = 1; by[i * primes[j]] = primes[j]; strikes++; made.push(i * primes[j]); }
          if (made.length) ev.push({ struck: struck.slice(), by: by.slice(), strikes: strikes, p: i, msg: "i = " + i + ": strike " + made.join(", ") + " — each by its smallest prime factor, once" });
        }
      } else {
        for (var p = 2; p <= (v === 2 ? Math.floor(Math.sqrt(N)) : N); p++) {
          if (v >= 1 && struck[p]) continue;
          var start = v === 2 ? p * p : 2 * p, cnt = 0;
          for (var m = start; m <= N; m += p) { if (!struck[m]) by[m] = p; struck[m] = 1; strikes++; cnt++; }
          if (cnt) ev.push({ struck: struck.slice(), by: by.slice(), strikes: strikes, p: p, msg: (v === 0 ? "strike every multiple of " + p + (struck[p] ? " (composite, but this variant does not check)" : "") : p + " is prime: strike its multiples from " + start) + " — " + cnt + " strikes" });
        }
      }
      ev.push({ struck: struck.slice(), by: by.slice(), strikes: strikes, p: 0, done: true, msg: "done: " + commas(strikes) + " strikes" });
      tr = ev;
    }
    var svg = svgOf(f, 400, "sieve of Eratosthenes grid");
    function draw(k) {
      clear(svg);
      var e = tr[k], cols = N <= 120 ? 12 : 20, rows = Math.ceil(N / cols), cw = 460 / cols, ch = Math.min(26, 330 / rows), pr = [], order = [];
      for (var i = 2; i <= N; i++) if (!e.struck[i]) pr.push(i);
      tr[tr.length - 1].by.forEach(function (b) { if (b && order.indexOf(b) < 0) order.push(b); });
      order.sort(function (a, b) { return a - b; });
      T(svg, 8, 14, VAR[v] + " · n = " + N + " · step " + k + " of " + (tr.length - 1) + " · strikes " + commas(e.strikes), { anchor: "start", size: 12, weight: 700 });
      for (i = 1; i <= N; i++) {
        var x = 20 + ((i - 1) % cols) * cw, y = 30 + Math.floor((i - 1) / cols) * ch, s2 = e.struck[i], cur = e.p && e.by[i] === e.p && s2;
        rect(svg, x, y, cw - 2, ch - 2, { rx: 2, fill: i === 1 ? C.card : s2 ? COL[order.indexOf(e.by[i]) % 7] : e.done || i <= e.p ? C.green : C.card, op: s2 ? (cur ? 0.7 : 0.3) : e.done || i <= e.p ? 0.25 : 1, stroke: i === e.p ? C.text : "none", sw: 2 });
        if (ch >= 14) T(svg, x + cw / 2 - 1, y + ch / 2 - 1, String(i), { size: ch < 20 ? 8 : 9.5, fill: s2 ? C.dim : C.text, weight: s2 ? 400 : 700 });
      }
      var RX = 500, lnn = N * Math.log(N), lnln = N * Math.log(Math.log(N));
      T(svg, RX, 44, "strikes", { anchor: "start", size: 10, fill: C.faint, mono: false });
      T(svg, RX, 70, commas(e.strikes), { anchor: "start", size: 24, weight: 700, fill: C.orange });
      T(svg, RX, 100, "n ln n = " + commas(lnn), { anchor: "start", size: 11, fill: C.dim });
      T(svg, RX, 118, "n ln ln n = " + commas(lnln), { anchor: "start", size: 11, fill: C.dim });
      if (e.done) T(svg, RX, 136, "composites = " + commas(N - 1 - pr.length) + (v === 3 ? ": one strike each" : ""), { anchor: "start", size: 11, fill: C.dim });
      T(svg, RX, 166, "primes up to n: " + (e.done ? pr.length : "…"), { anchor: "start", size: 11, weight: 600, fill: C.green });
      T(svg, RX, 206, "chapter §3 at n = 10⁶:", { anchor: "start", size: 9.5, fill: C.faint, mono: false });
      [["every number", "11,970,035"], ["primes only", "2,775,210"], ["from p², to √n", "2,122,048"], ["linear", "921,501"]].forEach(function (r, j) { T(svg, RX, 224 + j * 16, r[0] + ": " + r[1], { anchor: "start", size: 10, fill: j === v ? C.text : C.dim, weight: j === v ? 700 : 400 }); });
      wrap(svg, 8, 376, e.msg, 744, { size: 11, fill: e.done ? C.green : C.text });
    }
    K.tabs(f.controls, VAR, v, function (k) { v = k; build(); sp.reload(); });
    K.slider(f.controls, "n", 30, 1000, N, 10, String, function (x) { N = x; build(); sp.reload(); });
    var sp = stepper(f, function () { return tr.length - 1; }, draw);
    build(); draw(0);
    f.say("Strike every multiple of each prime; the counter shows why this is nearly linear. Run each variant to the end at n = 1,000 and compare the strikes with n ln n and n ln ln n.");
  };

  /* ------------------------------------------------------------------------
     dsaOrientation — ch45 §1. Left: cross(o, a, b) on integer points you
     drag. Right: Kettner's setup, p = (0.5 + i·u, 0.5 + j·u) with u = 2⁻⁵³,
     q = (12, 12), r = (24, 24); each pixel compares the double's sign with
     the exact one (every double is a dyadic rational, so BigInt is exact).
     ------------------------------------------------------------------------ */
  VIZ.dsaOrientation = function (el) {
    var f = frame(el);
    var P = [[2, 2], [9, 4], [5, 9]], drag = -1, pick = [100, 100], map = null, bad = 0;
    function cross(o, a, b) { return (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]); }
    function computeMap() {
      var U = Math.pow(2, -53), S2 = 1n << 53n, q = [12, 12], r = [24, 24], out = new Int8Array(256 * 256 * 2);
      bad = 0;
      for (var j = 0; j < 256; j++) for (var i = 0; i < 256; i++) {
        var px = 0.5 + i * U, py = 0.5 + j * U;
        var dbl = Math.sign((q[0] - px) * (r[1] - py) - (q[1] - py) * (r[0] - px));
        var PX = (S2 >> 1n) + BigInt(i), PY = (S2 >> 1n) + BigInt(j), QX = 12n * S2, RX = 24n * S2;
        var ex = (QX - PX) * (RX - PY) - (QX - PY) * (RX - PX), es = ex > 0n ? 1 : ex < 0n ? -1 : 0;
        out[2 * (j * 256 + i)] = dbl; out[2 * (j * 256 + i) + 1] = es;
        if (dbl !== es) bad++;
      }
      map = out;
    }
    var box = document.createElement("div");
    box.style.cssText = "display:flex;gap:16px;flex-wrap:wrap;align-items:flex-start";
    f.body.appendChild(box);
    var svg = S("svg", { viewBox: "0 0 380 330", width: "100%", role: "group", "aria-label": "three draggable points and their orientation" }, box);
    svg.style.cssText = "flex:1 1 300px;max-width:420px";
    var right = document.createElement("div"); right.style.cssText = "flex:1 1 260px;min-width:240px";
    box.appendChild(right);
    var cv = document.createElement("canvas"); cv.width = 256; cv.height = 256;
    cv.style.cssText = "width:100%;max-width:300px;image-rendering:pixelated;cursor:crosshair;border:1px solid var(--line);border-radius:6px";
    cv.setAttribute("role", "img"); cv.setAttribute("aria-label", "where double-precision orientation disagrees with exact arithmetic");
    right.appendChild(cv);
    var info = document.createElement("div"); info.style.cssText = "font:12px var(--mono, ui-monospace);color:var(--text-dim);margin-top:6px;line-height:1.5";
    right.appendChild(info);
    var G = 30, O = 20;
    function toXY(p) { return [O + p[0] * G, 300 - p[1] * G]; }
    function render() {
      clear(svg);
      for (var g = 0; g <= 11; g++) { line(svg, O + g * G, 300, O + g * G, 300 - 10 * G, { stroke: C.line, sw: 0.5 }); if (g <= 10) line(svg, O, 300 - g * G, O + 11 * G, 300 - g * G, { stroke: C.line, sw: 0.5 }); }
      var c = cross(P[0], P[1], P[2]), col = c > 0 ? C.green : c < 0 ? C.pink : C.orange;
      var pts = P.map(toXY);
      S("path", { d: "M " + pts[0][0] + " " + pts[0][1] + " L " + pts[1][0] + " " + pts[1][1] + " L " + pts[2][0] + " " + pts[2][1] + " z", fill: col, opacity: 0.18, stroke: col, "stroke-width": 2 }, svg);
      ["o", "a", "b"].forEach(function (nm, i) {
        var h = S("circle", { cx: pts[i][0], cy: pts[i][1], r: 9, fill: [C.text, C.blue, C.purple][i], opacity: 0.85 }, svg);
        T(svg, pts[i][0] + 12, pts[i][1] - 12, nm + "(" + P[i][0] + "," + P[i][1] + ")", { anchor: "start", size: 10.5, weight: 700 });
        h.style.cursor = "grab";
        h.addEventListener("pointerdown", function (e) { drag = i; e.preventDefault(); });
        focusable(h, "point " + nm + ", arrow keys move it", function () {});
        h.addEventListener("keydown", function (e) { var d = { ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, 1], ArrowDown: [0, -1] }[e.key]; if (!d) return; e.preventDefault(); P[i] = [Math.max(0, Math.min(11, P[i][0] + d[0])), Math.max(0, Math.min(10, P[i][1] + d[1]))]; render(); var again = svg.querySelectorAll("[role=button]")[i]; if (again) again.focus(); });
      });
      var o = P[0], a = P[1], b = P[2];
      T(svg, 8, 14, "(" + (a[0] - o[0]) + ")·(" + (b[1] - o[1]) + ") − (" + (a[1] - o[1]) + ")·(" + (b[0] - o[0]) + ") = " + c, { anchor: "start", size: 11.5, weight: 700 });
      T(svg, 8, 322, c > 0 ? "positive: o → a → b turns left" : c < 0 ? "negative: it turns right" : "zero: the three points are collinear", { anchor: "start", size: 11.5, weight: 700, fill: col, mono: false });
    }
    svg.addEventListener("pointermove", function (e) {
      if (drag < 0) return;
      var r = svg.getBoundingClientRect(), x = (e.clientX - r.left) * 380 / r.width, y = (e.clientY - r.top) * 330 / r.height;
      P[drag] = [Math.max(0, Math.min(11, Math.round((x - O) / G))), Math.max(0, Math.min(10, Math.round((300 - y) / G)))];
      render();
    });
    window.addEventListener("pointerup", function () { drag = -1; });
    function paintMap() {
      var cs = getComputedStyle(el), ok = cs.getPropertyValue("--bg-3").trim() || "#ddd", wr = cs.getPropertyValue("--pink").trim() || "#e05", ctx = cv.getContext("2d"), img = ctx.createImageData(256, 256);
      function rgb(css) { var d = document.createElement("div"); d.style.color = css; document.body.appendChild(d); var m = getComputedStyle(d).color.match(/\d+/g); document.body.removeChild(d); return m ? m.map(Number) : [200, 200, 200]; }
      var A = rgb(ok), B = rgb(wr);
      for (var j = 0; j < 256; j++) for (var i = 0; i < 256; i++) {
        var k = j * 256 + i, wrong = map[2 * k] !== map[2 * k + 1], c = wrong ? B : A, o = 4 * ((255 - j) * 256 + i);
        img.data[o] = c[0]; img.data[o + 1] = c[1]; img.data[o + 2] = c[2]; img.data[o + 3] = 255;
      }
      ctx.putImageData(img, 0, 0);
      ctx.strokeStyle = cs.getPropertyValue("--primary").trim() || "#36f"; ctx.lineWidth = 2; ctx.strokeRect(pick[0] - 3, 255 - pick[1] - 3, 7, 7);
    }
    function showPick() {
      var k = pick[1] * 256 + pick[0], d = map[2 * k], x = map[2 * k + 1], nm = function (s) { return s > 0 ? "left" : s < 0 ? "right" : "collinear"; };
      info.innerHTML = "p = (0.5 + " + pick[0] + "u, 0.5 + " + pick[1] + "u), u = 2⁻⁵³<br>double says <b>" + nm(d) + "</b>, exact says <b>" + nm(x) + "</b>" + (d !== x ? " — <span style='color:var(--pink)'>wrong</span>" : "") +
        "<br>wrong on " + commas(bad) + " of 65,536 inputs (" + (100 * bad / 65536).toFixed(0) + "%)";
    }
    cv.addEventListener("click", function (e) { var r = cv.getBoundingClientRect(); pick = [Math.max(0, Math.min(255, Math.floor((e.clientX - r.left) * 256 / r.width))), Math.max(0, Math.min(255, 255 - Math.floor((e.clientY - r.top) * 256 / r.height)))]; paintMap(); showPick(); });
    var mapped = false;
    f.btn("compute the float map", function () { if (!mapped) { info.textContent = "computing 65,536 exact orientations…"; setTimeout(function () { computeMap(); mapped = true; paintMap(); showPick(); }, 20); } });
    f.btn("collinear example", function () { P = [[1, 1], [4, 4], [8, 8]]; render(); });
    render();
    info.textContent = "Right: press 'compute the float map' to test q = (12, 12), r = (24, 24) and p within 255 ulps of (0.5, 0.5), which is exactly collinear with them.";
    f.say("Drag the points: the number is a signed area, and its sign is the answer. Then compute the float map and click a pink pixel: a nearly collinear p where doubles get the sign wrong.");
  };

  /* ------------------------------------------------------------------------
     dsaReduction — ch46 §2–3. Each reduction in four steps: the instance,
     the construction, the answer found on the built instance by brute
     force, and that answer read back.
     ------------------------------------------------------------------------ */
  VIZ.dsaReduction = function (el) {
    var f = frame(el);
    var RED = ["3-SAT → independent set", "vertex cover ↔ independent set", "subset sum → partition"], ri = 0, stepK = 0;
    var clauses = [[1, -2, 3], [-1, 2, 3], [-1, -2, -3]], G6 = { pos: [[80, 70], [220, 40], [330, 110], [260, 220], [120, 220], [40, 150]], e: [[0, 1], [1, 2], [2, 3], [3, 4], [4, 5], [5, 0], [0, 3], [1, 4]] }, nums = [3, 34, 4, 12, 5, 2], target = 9;
    function lit(l) { return (l < 0 ? "¬x" : "x") + Math.abs(l); }
    function sat() {
      var V = [], E = [];
      clauses.forEach(function (c, ci) { c.forEach(function (l, j) { V.push({ l: l, c: ci, j: j }); }); });
      V.forEach(function (a, i) { V.forEach(function (b, j) { if (j > i && ((a.c === b.c) || a.l === -b.l)) E.push([i, j, a.c === b.c ? "tri" : "neg"]); }); });
      var m = clauses.length, best = null;
      for (var mask = 0; mask < 1 << V.length && !best; mask++) {
        var set = []; for (var k = 0; k < V.length; k++) if (mask >> k & 1) set.push(k);
        if (set.length !== m) continue;
        if (E.every(function (e) { return set.indexOf(e[0]) < 0 || set.indexOf(e[1]) < 0; })) best = set;
      }
      var asg = best ? [0, 0, 0].map(function (x, v) { var hit = best.map(function (i) { return V[i].l; }).filter(function (l) { return Math.abs(l) === v + 1; }); return hit.length ? hit[0] > 0 : true; }) : null;
      return { V: V, E: E, best: best, asg: asg };
    }
    function maxIS() {
      var n = G6.pos.length, best = [];
      for (var mask = 0; mask < 1 << n; mask++) { var set = []; for (var k = 0; k < n; k++) if (mask >> k & 1) set.push(k); if (set.length > best.length && G6.e.every(function (e) { return set.indexOf(e[0]) < 0 || set.indexOf(e[1]) < 0; })) best = set; }
      return best;
    }
    function part() {
      var S2 = nums.reduce(function (a, b) { return a + b; }, 0), d = Math.abs(S2 - 2 * target), all = nums.concat([d]), T2 = S2 + d, half = T2 / 2, found = null;
      if (T2 % 2 === 0) for (var mask = 0; mask < 1 << all.length && !found; mask++) { var s = 0; for (var k = 0; k < all.length; k++) if (mask >> k & 1) s += all[k]; if (s === half && (mask >> (all.length - 1) & 1)) found = mask; }
      return { S: S2, d: d, all: all, half: half, found: found };
    }
    var svg = svgOf(f, 340, "a reduction stepped through", "group");
    function render() {
      clear(svg);
      var STEPS = ["the instance of A", "build the instance of B", "solve B", "read the answer back"];
      T(svg, 8, 14, RED[ri] + " · step " + (stepK + 1) + " of 4: " + STEPS[stepK], { anchor: "start", size: 12, weight: 700 });
      if (ri === 0) {
        var R = sat();
        clauses.forEach(function (c, ci) {
          T(svg, 8, 44 + ci * 24, "(", { anchor: "start", size: 13 });
          c.forEach(function (l, j) {
            var x = 20 + j * 66, cell = rect(svg, x, 32 + ci * 24, 56, 22, { rx: 4, fill: l < 0 ? C.pink : C.teal, op: 0.25, stroke: C.line });
            T(svg, x + 28, 43 + ci * 24, lit(l), { size: 12, weight: 700 });
            (function (a, b, node) { function flip() { clauses[a][b] = -clauses[a][b]; render(); } node.addEventListener("click", flip); focusable(node, "literal " + lit(l) + ", click to negate", flip); })(ci, j, cell);
            if (j < 2) T(svg, x + 61, 43 + ci * 24, "∨", { size: 11, fill: C.dim });
          });
          T(svg, 216, 44 + ci * 24, ")" + (ci < 2 ? " ∧" : ""), { anchor: "start", size: 13 });
        });
        T(svg, 8, 120, "click a literal to negate it", { anchor: "start", size: 9.5, fill: C.faint, mono: false });
        if (stepK >= 1) {
          var px = function (i) { var v = R.V[i]; return 380 + v.c * 125 + [0, 60, 30][v.j]; }, py = function (i) { var v = R.V[i]; return v.j === 2 ? 70 : 140; };
          R.E.forEach(function (e) { var neg = e[2] === "neg"; if (!neg || stepK >= 1) line(svg, px(e[0]), py(e[0]), px(e[1]), py(e[1]), { stroke: neg ? C.orange : C.line, sw: neg ? 1.6 : 1.3, dash: neg ? "4 3" : "none" }); });
          R.V.forEach(function (v, i) {
            var inS = stepK >= 2 && R.best && R.best.indexOf(i) >= 0;
            S("circle", { cx: px(i), cy: py(i), r: 16, fill: inS ? C.green : v.l < 0 ? C.pink : C.teal, opacity: inS ? 0.6 : 0.25, stroke: C.line }, svg);
            T(svg, px(i), py(i), lit(v.l), { size: 10, weight: 700 });
          });
          T(svg, 380, 190, "a triangle per clause; dashed orange joins a literal to its negation", { anchor: "start", size: 9.5, fill: C.faint, mono: false });
        }
        var msg = ["Three clauses over x1, x2, x3. Is there an assignment making every clause true?", "Each clause becomes a triangle, so an independent set takes at most one literal per clause; each literal is joined to its negation, so it never takes both x and ¬x.",
          R.best ? "An independent set of size m = 3 exists: one vertex per triangle, green." : "No independent set of size 3 exists.", R.best ? "Set the chosen literals true: x1 = " + R.asg[0] + ", x2 = " + R.asg[1] + ", x3 = " + R.asg[2] + ". Every clause has a true literal, so the formula is satisfiable." : "No size-3 independent set, so no satisfying assignment: the formula is unsatisfiable."][stepK];
        wrap(svg, 8, 250, msg, 744, { size: 11.5, fill: stepK >= 2 ? (R.best ? C.green : C.pink) : C.text });
      } else if (ri === 1) {
        var IS = stepK >= 2 ? maxIS() : [], VC = G6.pos.map(function (p, i) { return i; }).filter(function (i) { return IS.indexOf(i) < 0; });
        G6.e.forEach(function (e) { var covered = stepK >= 3 && (VC.indexOf(e[0]) >= 0 || VC.indexOf(e[1]) >= 0); line(svg, G6.pos[e[0]][0] + 180, G6.pos[e[0]][1] + 20, G6.pos[e[1]][0] + 180, G6.pos[e[1]][1] + 20, { stroke: covered ? C.blue : C.line, sw: covered ? 2.2 : 1.3 }); });
        G6.pos.forEach(function (p, i) { var inI = IS.indexOf(i) >= 0; S("circle", { cx: p[0] + 180, cy: p[1] + 20, r: 15, fill: inI ? C.green : stepK >= 3 ? C.blue : C.card, opacity: inI || stepK >= 3 ? 0.5 : 1, stroke: C.line }, svg); T(svg, p[0] + 180, p[1] + 20, String(i), { size: 11, weight: 700 }); });
        var m2 = ["A graph. Question A: the largest set of vertices with no edge inside it.", "B is the same graph: nothing to build. A set is independent exactly when every edge has an endpoint outside it.", "Largest independent set, by brute force: {" + IS.join(", ") + "}, size " + IS.length + ".", "Its complement {" + VC.join(", ") + "} touches every edge: a minimum vertex cover, size " + VC.length + " = n − " + IS.length + "."][stepK];
        wrap(svg, 8, 272, m2, 744, { size: 11.5, fill: stepK >= 2 ? C.green : C.text });
      } else {
        var P2 = part(), W = 720 / (nums.length + 1);
        T(svg, 8, 40, "set {" + nums.join(", ") + "}, total S = " + P2.S + " · target t = " + target, { anchor: "start", size: 12, weight: 600 });
        (stepK >= 1 ? P2.all : nums).forEach(function (x, i) {
          var isD = i === nums.length, side = stepK >= 2 && P2.found !== null ? (P2.found >> i & 1) : -1;
          rect(svg, 20 + i * W, 60, W - 8, 40, { rx: 6, fill: isD ? C.orange : side === 1 ? C.teal : side === 0 ? C.purple : C.card, op: isD || side >= 0 ? 0.35 : 1, stroke: isD ? C.orange : C.line, sw: isD ? 2 : 1 });
          T(svg, 20 + i * W + (W - 8) / 2, 80, String(x), { size: 14, weight: 700 });
        });
        var m3 = ["Subset sum: does some subset of the set add up to t?", "Append one number, |S − 2t| = " + P2.d + ", making a set with total " + (P2.S + P2.d) + ". Partition asks for two halves of " + P2.half + " each.",
          P2.found !== null ? "A partition exists: teal and purple halves, " + P2.half + " each." : "No equal partition exists.",
          P2.found !== null ? "On the added number's side, the other numbers sum to " + (P2.half - P2.d) + (P2.half - P2.d === target ? " = t" : "") + "; on the far side, to " + P2.half + (P2.half === target ? " = t" : "") + ". Either way, a subset summing to t: yes." : "So no subset sums to " + target + "."][stepK];
        wrap(svg, 8, 140, m3, 744, { size: 11.5, fill: stepK >= 2 ? (P2.found !== null ? C.green : C.pink) : C.text });
      }
    }
    K.tabs(f.controls, RED, 0, function (k) { ri = k; stepK = 0; render(); });
    f.btn("◂ back", function () { stepK = Math.max(0, stepK - 1); render(); });
    f.btn("step ▸", function () { stepK = Math.min(3, stepK + 1); render(); });
    f.btn("reset", function () { stepK = 0; render(); });
    K.slider(f.controls, "t (subset sum)", 1, 60, target, 1, String, function (x) { target = x; if (ri === 2) render(); });
    render();
    f.say("Watch the instance transform; the answer to one problem reads off as the answer to the other. In 3-SAT, flip a literal and watch which dashed edge in the graph changes.");
  };

  /* ------------------------------------------------------------------------
     dsaRecognize — ch47 §6. The chapter's six problems; each of the five
     steps is answered from a menu before the trace is shown.
     ------------------------------------------------------------------------ */
  VIZ.dsaRecognize = function (el) {
    var f = frame(el);
    var STEPS = ["1 · what do the constraints allow?", "2 · what is the object?", "3 · what is the question?", "4 · which candidate passes its test?", "5 · which tempting one fails?"];
    var BUD = ["O(n²) fits", "about n log n", "linear or near-linear", "exponential is fine"], OBJ = ["sequence", "string", "grid", "tree", "graph", "stream"], QUE = ["count", "optimum", "decide", "a stream of queries"];
    var PROBS = [
      { q: "Count the subarrays whose sum is divisible by k; n up to 2 × 10⁵, values may be negative.", a: [1, 0, 0], c: ["prefix sums + a hash map of remainders", "sliding window", "DP over positions"], ok: 0, r: ["sliding window", "prefix sums", "hashing"], bad: 0,
        t: "n log n fits. A sequence, and a count. A subarray sum is a difference of prefix sums, so it is divisible by k exactly when two prefix sums share a remainder: count equal remainders. The sliding window fails because negatives break monotonicity. In Java, % can return negatives, so use floorMod." },
      { q: "Split n positive numbers into k contiguous parts minimising the largest part's sum; n up to 10⁵.", a: [1, 0, 1], c: ["DP over (prefix, parts)", "binary search on the answer with a greedy check", "sort and pair greedily"], ok: 1, r: ["DP over (prefix, parts)", "binary search on the answer", "the greedy check"], bad: 0,
        t: "A sequence, and an optimum: minimise a maximum. The DP is O(n²k), which step 1 rules out. A greedy pass decides whether cap c suffices, and any larger cap also suffices, so binary search on c between the largest element and the total: about 47 greedy passes at n = 10⁵." },
      { q: "Courses with prerequisites, any number per semester; the fewest semesters.", a: [2, 4, 1], c: ["BFS shortest path", "longest path in the DAG, by Kahn's layers", "Dijkstra"], ok: 1, r: ["BFS shortest path", "longest path in the DAG", "topological order"], bad: 0,
        t: "A graph — a DAG if the courses are consistent — and an optimum. 'Fewest' suggests a shortest path, and it fails its test: on a chain of six courses plus one shortcut prerequisite BFS answers 2 while six semesters are needed, because every course waits for its longest prerequisite chain. The answer is the longest path in the DAG, one Kahn layer per semester; a cycle means no schedule." },
      { q: "After each number arrives in a stream, report the median.", a: [1, 5, 3], c: ["sort after every arrival", "two heaps, lower half and upper half", "a Fenwick tree over values"], ok: 1, r: ["two heaps", "a Fenwick tree over values", "a sorted list"], bad: 1,
        t: "A stream, and a stream of queries. Two heaps: the lower half in a max-heap, the upper in a min-heap, sizes within one, so the median is a top. The Fenwick tree needs the values known in advance. 10⁵ arrivals took 0.03 s." },
      { q: "A 500 × 500 grid of open cells and walls; the fewest walls to break from one corner to the other.", a: [2, 2, 1], c: ["plain BFS", "0-1 BFS", "grid DP"], ok: 1, r: ["0-1 BFS", "plain BFS", "Dijkstra"], bad: 1,
        t: "A grid read as a graph, and an optimum. Every move costs 0 (open) or 1 (a wall), so 0-1 BFS. Plain BFS needs equal move costs; grid DP needs a DAG order, and paths here may move up or left. It matched Dijkstra on every test." },
      { q: "In a network of 10,000 people, find the largest group in which everyone knows everyone else.", a: [0, 4, 1], c: ["a subset DP", "maximum flow", "exact branch-and-bound that exploits sparsity"], ok: 2, r: ["a good approximation", "exact search", "branch and bound"], bad: 0,
        t: "A graph, an optimum — and it is maximum clique, NP-hard. Say so, then check structure: real networks are sparse, and exact branch-and-bound found the answer on a sparse random graph of 10,000 vertices in 0.54 s. There is no good approximation to fall back on: clique has no constant-factor approximation unless P = NP." }
    ];
    var pi = 0, ans = [], shown = false;
    var svg = svgOf(f, 360, "the recognition procedure on one problem");
    function opts(k) { var P = PROBS[pi]; return [BUD, OBJ, QUE, P.c, P.r][k]; }
    function right(k) { var P = PROBS[pi]; return k < 3 ? P.a[k] : k === 3 ? P.ok : P.bad; }
    function render() {
      clear(svg);
      var P = PROBS[pi], cur = ans.length;
      T(svg, 8, 14, "problem " + (pi + 1) + " of 6", { anchor: "start", size: 12, weight: 700 });
      var yEnd = wrap(svg, 8, 34, P.q, 744, { size: 12, fill: C.text });
      STEPS.forEach(function (s, k) {
        var y = yEnd + 6 + k * 30, done = k < ans.length, good = done && ans[k] === right(k);
        rect(svg, 8, y, 744, 26, { rx: 5, fill: k === cur && !shown ? C.card : "none", stroke: k === cur && !shown ? C.blue : C.line, sw: k === cur ? 1.8 : 1 });
        T(svg, 16, y + 13, s, { anchor: "start", size: 10.5, weight: 700, mono: false, fill: done || k === cur ? C.text : C.faint });
        if (done) T(svg, 250, y + 13, opts(k)[ans[k]] + (good ? "  ✓" : "  ✗ — " + opts(k)[right(k)]), { anchor: "start", size: 10, fill: good ? C.green : C.pink, weight: 600, mono: false });
        else if (k === cur && !shown) T(svg, 250, y + 13, "choose below", { anchor: "start", size: 10, fill: C.blue, mono: false });
      });
      var yT = yEnd + 6 + 5 * 30 + 12;
      if (shown || ans.length === 5) wrap(svg, 8, yT, "Trace: " + P.t, 744, { size: 11, fill: C.dim });
      paintMenu();
    }
    var menu = row(f.controls);
    function paintMenu() {
      while (menu.firstChild) menu.removeChild(menu.firstChild);
      if (ans.length >= 5 || shown) return;
      opts(ans.length).forEach(function (o, i) { var b = document.createElement("button"); b.type = "button"; b.textContent = o; b.addEventListener("click", function () { ans.push(i); render(); }); menu.appendChild(b); });
    }
    f.btn("reveal the trace", function () { shown = true; render(); });
    f.btn("next problem ▸", function () { pi = (pi + 1) % PROBS.length; ans = []; shown = false; render(); });
    f.btn("start over", function () { ans = []; shown = false; render(); });
    render();
    f.say("Read the statement. Answer the five questions in order before revealing the trace, and find the problem where your step-3 answer eliminates the technique you were sure it would be.");
  };

  /* ------------------------------------------------------------------------
     dsaContainerCosts — ch48 §1, the chapter's measured table at n = 10⁶.
     Other n are extrapolated from that one measurement by the cost class,
     and marked as such.
     ------------------------------------------------------------------------ */
  VIZ.dsaContainerCosts = function (el) {
    var f = frame(el);
    /* [operation, py name, py class, py ns, java name, java class, java ns] at n = 10⁶ */
    var ROWS = [["append at end", "list.append", "1*", 37, "ArrayList.add", "1*", 21], ["read index i", "list[i]", "1", 33, "ArrayList.get", "1", 4],
      ["insert at front", "list.insert(0, x)", "n", 475e3, "ArrayList.add(0, x)", "n", 99e3], ["remove at front", "list.pop(0)", "n", 158e3, "ArrayList.remove(0)", "n", 97e3],
      ["front of a queue", "deque.popleft", "1", 42, "ArrayDeque.pollFirst", "1", 3], ["search unsorted", "x in list", "n", 5.7e6, "ArrayList.contains", "n", 633e3],
      ["hash insert", "dict[k] = v", "1*", 96, "HashMap.put", "1*", 9], ["hash lookup", "k in dict", "1", 44, "HashMap.get", "1", 10],
      ["sorted insert", "bisect.insort", "n", 478e3, "TreeMap.put", "log n", 78], ["heap push", "heappush", "log n", 121, "PriorityQueue.offer", "log n", 14],
      ["heap pop", "heappop", "log n", 1300, "PriorityQueue.poll", "log n", 312], ["middle of a list", "(no linked list)", "", null, "LinkedList.get(n/2)", "n", 888e3]];
    var oi = 8, lg = 6, mode = 0;
    function scale(cls, ns) { if (ns === null) return null; var n = Math.pow(10, lg); return cls.indexOf("n") === 0 ? ns * n / 1e6 : cls === "log n" ? ns * Math.log2(n) / Math.log2(1e6) : ns; }
    function fmt(ns) { if (ns === null) return "—"; return ns >= 1e9 ? (ns / 1e9).toFixed(1) + " s" : ns >= 1e6 ? (ns / 1e6).toFixed(ns >= 1e7 ? 0 : 1) + " ms" : ns >= 1e3 ? (ns / 1e3).toFixed(ns >= 1e4 ? 0 : 1) + " µs" : Math.round(ns) + " ns"; }
    var svg = svgOf(f, 400, "container operation costs in Python and Java");
    function render() {
      clear(svg);
      var extrap = lg !== 6;
      T(svg, 8, 14, "n = 10" + D.sup(lg) + " · " + (mode ? "cost class" : extrap ? "time, extrapolated from the measurement at 10⁶ by cost class" : "time measured at n = 10⁶"), { anchor: "start", size: 12, weight: 700 });
      ["operation", "Python", "", "Java", ""].forEach(function (h, j) { T(svg, [8, 150, 330, 420, 610][j], 38, h, { anchor: "start", size: 9.5, fill: C.faint, mono: false }); });
      var LOG1 = 9.5;
      ROWS.forEach(function (r, i) {
        var y = 52 + i * 25, sel = i === oi, pyT = scale(r[2], r[3]), jT = scale(r[5], r[6]);
        if (sel) rect(svg, 4, y - 4, 752, 23, { rx: 4, fill: C.blue, op: 0.1, stroke: C.blue, sw: 1 });
        var hit = rect(svg, 4, y - 4, 752, 23, { rx: 4, fill: "transparent", stroke: "none" });
        (function (k) { function pick() { oi = k; render(); } hit.addEventListener("click", pick); focusable(hit, r[0], pick); })(i);
        T(svg, 8, y + 7, r[0], { anchor: "start", size: 10.5, mono: false, weight: sel ? 700 : 400 });
        T(svg, 150, y + 7, r[1], { anchor: "start", size: 9.5, fill: C.dim });
        T(svg, 420, y + 7, r[4], { anchor: "start", size: 9.5, fill: C.dim });
        if (mode) {
          T(svg, 330, y + 7, r[2] ? "O(" + r[2].replace("*", "") + ")" + (r[2].indexOf("*") > 0 ? " amortized" : "") : "—", { anchor: "start", size: 10.5, weight: 700, fill: r[2] === "n" ? C.pink : C.green });
          T(svg, 610, y + 7, "O(" + r[5].replace("*", "") + ")" + (r[5].indexOf("*") > 0 ? " amortized" : ""), { anchor: "start", size: 10.5, weight: 700, fill: r[5] === "n" ? C.pink : C.green });
        } else {
          T(svg, 330, y + 7, fmt(pyT), { anchor: "start", size: 10.5, weight: 700, fill: r[2] === "n" ? C.pink : C.text });
          T(svg, 610, y + 7, fmt(jT), { anchor: "start", size: 10.5, weight: 700, fill: r[5] === "n" ? C.pink : C.text });
          if (pyT !== null) S("rect", { x: 270, y: y + 2, width: 54 * Math.max(0.03, Math.log10(Math.max(1, pyT)) / LOG1), height: 10, rx: 2, fill: r[2] === "n" ? C.pink : C.teal, opacity: 0.6 }, svg);
          S("rect", { x: 560, y: y + 2, width: 44 * Math.max(0.03, Math.log10(Math.max(1, jT)) / LOG1), height: 10, rx: 2, fill: r[5] === "n" ? C.pink : C.teal, opacity: 0.6 }, svg);
        }
      });
      var R = ROWS[oi], ratio = R[3] && R[6] ? R[3] / R[6] : null;
      var note = oi === 8 ? "Python has no balanced tree: bisect.insort finds the place in O(log n) and shifts in O(n). TreeMap stays logarithmic." :
        oi === 11 ? "LinkedList is slow at almost everything — each node is a separate object behind a pointer. It wins one job: inserting while walking with a ListIterator, where 80,000 inserts took 5.2 ms against ArrayList's 146 ms." :
        R[2] === "n" ? "An O(n) operation inside a loop is O(n²): this row is where quadratic code hides." :
        ratio && ratio > 3 ? "Same cost class; Java's constant is about " + Math.round(ratio) + "× smaller here — noise next to a change of class." : "Same class in both languages.";
      wrap(svg, 8, 360, note, 744, { size: 11, fill: C.dim });
    }
    K.tabs(f.controls, ["measured time", "cost class"], 0, function (k) { mode = k; render(); });
    K.slider(f.controls, "n", 3, 8, lg, 1, function (v) { return "10" + D.sup(v); }, function (v) { lg = v; render(); });
    render();
    f.say("Pick an operation (click a row). Find the one where Python's list and Java's ArrayList differ in kind, not just in constant, and the one situation where LinkedList finally wins.");
  };

  /* ------------------------------------------------------------------------
     dsaProblemIndex — ch49 §2–3: the chapter's 54 shapes, each tagged by
     object and question; a search matches words in shape, technique and trap.
     ------------------------------------------------------------------------ */
  VIZ.dsaProblemIndex = function (el) {
    var f = frame(el);
    var CAT = [["Maximum-sum subarray", "Kadane's scan, Chapter 1, O(n)", "an all-negative array needs the empty-subarray convention stated", "seq", "opt"], ["Subarray sum equal to, or divisible by, k", "Prefix sums with a hash map, Chapter 9, O(n)", "negatives break sliding windows", "seq", "count"], ["Longest window satisfying a monotone condition", "Sliding window, Chapter 8, O(n)", "the condition must stay valid as the window shrinks", "seq", "opt"], ["Pair or triple with a target sum in sorted data", "Two pointers, Chapter 8, O(n) per anchor", "duplicates repeat answers", "seq", "find"], ["Next greater element, largest rectangle", "Monotonic stack, Chapter 10, O(n) amortized", "equal heights need a strict or non-strict rule", "seq", "find"], ["Sliding-window maximum", "Monotonic deque, Chapter 10, O(n)", "store indices, not values", "seq", "query"], ["Many range sums or range updates, static", "Prefix sums, difference arrays, Chapter 9", "an update between queries breaks them", "seq", "query"], ["Range queries with point updates", "Fenwick tree, Chapter 30, O(log n)", "minimum is not invertible, use a segment tree", "seq", "query"], ["Range updates and range queries", "Segment tree with lazy propagation, Chapter 31", "pushing laziness down before reading", "seq", "query"], ["Range minimum, static", "Sparse table, Chapter 30, O(1) query", "only idempotent operations", "seq", "query"], ["First position where a predicate turns true", "Binary search, Chapter 13; on the answer, Chapter 14", "the predicate must be monotone", "seq", "find"], ["Minimise the maximum, maximise the minimum", "Binary search on the answer with a greedy check, Chapter 14", "", "seq", "opt"], ["k-th smallest, top k", "Quickselect, Chapter 15; heap of size k, Chapter 27", "sorting everything is O(n log n) for k items", "seq", "find", "kth largest element order statistic"], ["Running median", "Two heaps, Chapter 27, O(log n) per item", "", "seq", "query", "stream heap"], ["Majority element", "Boyer-Moore vote, Chapter 12, O(1) space", "the second pass that verifies it", "seq", "find"], ["Merge or count overlapping intervals", "Sort and sweep, Chapter 12", "touching endpoints, open or closed", "seq", "count"], ["All subsets, permutations, placements", "Backtracking, Chapter 18; bitmask loop, Chapter 40", "prune before recursing, not after", "seq", "enum"], ["Knapsack, subset sum, coin change", "Pseudopolynomial DP, Chapter 20, O(nW)", "W is not polynomial in the input size", "num", "opt"], ["LIS, LCS, edit distance", "Sequence DP, Chapter 21; LIS in O(n log n)", "the tails array is not the subsequence", "seq", "opt", "longest increasing subsequence longest common subsequence"], ["Assign n items, n up to 20", "Bitmask DP, Chapter 22, O(2^nn)", "assignment itself is polynomial, Chapter 39", "set", "opt"], ["Find one pattern in a text", "KMP or Z, Chapter 41, O(n + m)", "Java's indexOf is quadratic on adversarial input", "str", "find"], ["Find many patterns at once", "Aho-Corasick, Chapter 42, O(n + L + z)", "", "str", "find"], ["Repeated or distinct substrings", "Suffix array with LCP, Chapter 43", "the naive suffix sort's memory", "str", "count"], ["Longest palindromic substring", "Centre expansion, Chapter 21; Manacher, Chapter 42, O(n)", "", "str", "opt"], ["Primes, divisors, gcd", "Sieve and smallest prime factor, Euclid, Chapter 44", "floating square roots", "num", "find"], ["Counting modulo a prime", "Factorial tables and inverses, Chapter 44", "int overflow before the modulus", "num", "count"], ["Set of up to 64 flags", "A bitmask, Chapter 40, O(1) per set operation", "", "set", "decide", "bitmask"], ["Maximum XOR of a pair, of a subset", "Binary trie, Chapter 28; XOR basis, Chapter 40", "", "set", "opt"], ["Height, diameter, balance, path sums", "Tree DP returning a tuple, Chapter 25, O(n)", "recursion depth on a path-shaped tree", "tree", "opt"], ["Ordered map with updates", "Balanced BST, Chapter 26, O(log n)", "Python has none in its standard library", "tree", "query"], ["Ancestor queries, subtree aggregates", "Binary lifting and the Euler tour, Chapter 29", "", "tree", "query"], ["Shortest path, unweighted or 0-1 weights", "BFS or 0-1 BFS, Chapter 33, O(V + E)", "", "graph", "opt", "bfs breadth first"], ["Shortest path, non-negative weights", "Dijkstra, Chapter 35, O(E log V)", "negative edges break it silently", "graph", "opt", "dijkstra"], ["Shortest path with negative edges", "Bellman-Ford, Chapter 35, O(VE), which also detects negative cycles", "", "graph", "opt", "bellman ford"], ["All pairs, a few hundred vertices", "Floyd-Warshall, Chapter 35, O(V^3)", "", "graph", "opt"], ["Order with dependencies", "Topological sort, Chapter 34; longest path by DAG DP", "fewest rounds is a longest path", "graph", "find", "topological sort dag prerequisites tasks"], ["Connectivity as edges arrive", "Union-find, Chapter 7, near-constant per operation", "", "graph", "query", "union find disjoint set"], ["Cheapest network connecting everything", "Kruskal or Prim, Chapter 36", "connecting a subset is Steiner, NP-hard", "graph", "opt", "minimum spanning tree mst"], ["Strongly connected parts, 2-SAT", "Tarjan or Kosaraju, Chapter 37, O(V + E)", "", "graph", "decide", "strongly connected components scc"], ["Bridges, articulation points, Euler circuits", "DFS low-links and Hierholzer, Chapter 37", "", "graph", "find"], ["Maximum throughput, minimum cut", "Dinic, Chapter 38", "DFS augmenting on large capacities", "graph", "opt"], ["Match workers to jobs, disjoint paths, selections", "Flow modelling, Chapter 39; weighted assignment by the Hungarian method", "", "graph", "opt", "bipartite matching max flow"], ["Stable pairing by preferences", "Gale-Shapley, Chapter 39", "it is not a flow problem", "graph", "find"], ["Grid paths, counts, minimum cost", "Grid DP, Chapter 22, or BFS when moves go in every direction", "", "grid", "count"], ["Islands, flood fill, multi-source spread", "BFS or DFS on the implicit grid graph, Chapters 32 and 33", "", "grid", "find", "bfs dfs connected components"], ["Convex hull, polygon area, point in polygon", "Monotone chain, shoelace, winding number, Chapter 45", "floats", "geo", "find"], ["Segment intersection", "Four orientations plus the collinear case, Chapter 45", "", "geo", "decide"], ["Farthest Manhattan pair", "Rotate to u = x + y, v = x - y, Chapter 45, O(n)", "", "geo", "opt"], ["DP over lines, min of m·x + b", "Convex hull trick or Li Chao tree, Chapter 45", "", "geo", "opt"], ["Who wins an impartial game", "Grundy numbers and XOR, Chapter 44", "", "num", "decide", "nim grundy"], ["Cache with eviction", "Hash map plus linked list for LRU, Chapter 11; the competitive ratio, Chapter 48", "", "sys", "query", "lru lfu least recently used"], ["Uniform sample of a stream, shuffle", "Reservoir sampling, Fisher-Yates, Chapter 48", "", "sys", "query"], ["Set membership in little memory, distinct counts", "Bloom filter, HyperLogLog, Chapter 48", "", "sys", "count", "bloom filter hyperloglog"], ["Subset, ordering or assignment under a global constraint", "Probably NP-hard, Chapter 46: check the structure, then approximate, parameterise or search", "", "any", "opt"]];
    var OBJ = [["all", "any object"], ["seq", "sequence"], ["str", "string"], ["num", "number"], ["set", "set / bits"], ["tree", "tree"], ["graph", "graph"], ["grid", "grid"], ["geo", "geometry"], ["sys", "system"], ["any", "anything hard"]];
    var QUE = [["all", "any question"], ["opt", "optimum"], ["count", "count"], ["find", "find / order"], ["decide", "decide"], ["query", "queries"], ["enum", "enumerate"]];
    var q = "", ob = "all", qu = "all", open = -1;
    var wrapEl = document.createElement("div"); wrapEl.style.cssText = "font:13px var(--sans, system-ui);color:var(--text)";
    f.body.appendChild(wrapEl);
    var head = document.createElement("div"); head.style.cssText = "display:flex;gap:8px;align-items:center;flex-wrap:wrap;margin-bottom:8px";
    wrapEl.appendChild(head);
    var box = document.createElement("input"); box.type = "search"; box.placeholder = "describe the problem: e.g. shortest path with negative weights"; box.setAttribute("aria-label", "describe your problem");
    box.style.cssText = "flex:1 1 280px;font:14px var(--sans, system-ui);padding:6px 8px;border:1px solid var(--line);border-radius:6px;background:var(--bg-2);color:var(--text)";
    head.appendChild(box);
    var count = document.createElement("span"); count.style.cssText = "font:12px var(--mono, ui-monospace);color:var(--text-dim)";
    head.appendChild(count);
    var list = document.createElement("div"); list.setAttribute("role", "list"); list.style.cssText = "max-height:340px;overflow:auto;border:1px solid var(--line);border-radius:8px";
    wrapEl.appendChild(list);
    function stem(w) { return w.toLowerCase().replace(/iz/g, "is").replace(/ies$/, "y").replace(/([^s])s$/, "$1"); }
    var SYN = { weight: ["edge", "cost"], edge: ["weight"], cost: ["weight", "price"], fewest: ["minimum", "minimise", "shortest"], largest: ["maximum", "maximise", "longest"],
      smallest: ["minimum", "minimise"], cheapest: ["minimum", "minimise", "cost"], number: ["count"], how: ["count"], median: ["heap"] };
    /* Title words weigh 3, words elsewhere 1, synonyms 1; "non-negative" is one token, so it does not match "negative". */
    function score(e) {
      var words = q.toLowerCase().split(/[^a-z0-9-]+/).filter(function (w) { return w.length > 1 && ["the", "of", "a", "an", "with", "in", "to", "and", "or", "for", "on", "at", "by", "is", "my", "i"].indexOf(w) < 0; });
      if (!words.length) return 1;
      var title = (e[0] + " " + (e[5] || "")).toLowerCase().split(/[^a-z0-9-]+/).map(stem), body = (e[1] + " " + e[2]).toLowerCase().split(/[^a-z0-9-]+/).map(stem), s = 0;
      words.forEach(function (w) {
        var sw = stem(w);
        if (title.indexOf("non-" + sw) >= 0) s -= 2;
        if (title.indexOf(sw) >= 0) s += 3; else if (body.indexOf(sw) >= 0) s += 1;
        else if ((SYN[sw] || []).some(function (y) { return title.indexOf(y) >= 0 || body.indexOf(y) >= 0; })) s += 1;
      });
      return s;
    }
    function render() {
      while (list.firstChild) list.removeChild(list.firstChild);
      var res = CAT.map(function (e, i) { return { e: e, i: i, s: score(e) }; }).filter(function (r) { return r.s > 0 && (ob === "all" || r.e[3] === ob) && (qu === "all" || r.e[4] === qu); });
      res.sort(function (a, b) { return b.s - a.s || a.i - b.i; });
      count.textContent = res.length + " of " + CAT.length + " shapes";
      if (!res.length) { var none = document.createElement("div"); none.style.cssText = "padding:10px;color:var(--text-dim)"; none.textContent = "Nothing matches. Chapter 47's procedure first: name the object and the question, then filter by them."; list.appendChild(none); }
      res.forEach(function (r) {
        var e = r.e, item = document.createElement("div"); item.setAttribute("role", "listitem");
        item.style.cssText = "border-bottom:1px solid var(--line);padding:8px 10px";
        var b = document.createElement("button"); b.type = "button"; b.setAttribute("aria-expanded", open === r.i ? "true" : "false");
        b.style.cssText = "all:unset;cursor:pointer;display:block;width:100%;font-weight:600";
        b.textContent = (open === r.i ? "▾ " : "▸ ") + e[0];
        b.addEventListener("click", function () { open = open === r.i ? -1 : r.i; render(); });
        item.appendChild(b);
        if (open === r.i) {
          var d = document.createElement("div"); d.style.cssText = "margin:6px 0 2px 18px;line-height:1.5;color:var(--text-dim)";
          var tech = e[1].replace(/Chapter (\d+)/g, function (m, n) { return "<a href='#/ch/" + n + "'>Chapter " + n + "</a>"; });
          d.innerHTML = "<b style='color:var(--text)'>Technique:</b> " + tech + (e[2] ? "<br><b style='color:var(--pink)'>Trap:</b> " + e[2] : "");
          item.appendChild(d);
        }
        list.appendChild(item);
      });
    }
    box.addEventListener("input", function () { q = box.value; open = -1; render(); });
    var r1 = row(f.controls);
    K.tabs(r1, OBJ.map(function (o) { return o[1]; }), 0, function (k) { ob = OBJ[k][0]; render(); });
    var r2 = row(f.controls);
    K.tabs(r2, QUE.map(function (o) { return o[1]; }), 0, function (k) { qu = QUE[k][0]; render(); });
    render();
    f.say("Describe your problem in a few words; the index answers with a technique and a chapter. Search for a problem you failed earlier in the course and find the chapter you needed.");
  };
})();
