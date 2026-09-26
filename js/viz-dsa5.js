/* ==========================================================================
   viz-dsa5.js — DSA By Patterns machines, Part 3 (The Paradigms, ch18–23).

     dsaBacktrackTree   ch18 Stepper    subsets, permutations, combinations; the dedupe rules
     dsaNQueens         ch18 Simulator  queens placed with and without the diagonal prune
     dsaSudoku          ch18 Simulator  left-to-right against most-constrained-first
     dsaMemoTable       ch19 Stepper    fib, grid paths, min coins: calls per subproblem, memo on/off
     dsaSRTBOT          ch19 Playground six questions per problem, Time answered before it is shown
     dsaDPOrder         ch19 Comparator coin loop outer against amount loop outer
     dsaKnapsack        ch20 Builder    the K(i, c) table, its traceback, and greedy by ratio
     dsaLIS             ch21 Comparator the O(n²) scan against patience sorting's tails
     dsaGridDP          ch22 Builder    paths around walls, or minimum path sum
     dsaGreedyIntervals ch23 Comparator earliest start, shortest, earliest finish, and the optimum
     dsaExchange        ch23 Stepper    an optimum swapped, one interval at a time, into greedy's
     dsaHuffman         ch23 Builder    merge the two smallest; code lengths from depth
     dsaGreedyCoins     ch23 Playground largest-coin-first against the coin-change table

   Routines are the chapters' own (subsets, permute_unique, subsets_with_dup,
   combinations, n_queens, solve_sudoku, fib, grid_paths, min_coins,
   count_combinations/count_sequences, knapsack, lis_length, unique_paths,
   min_path_sum, max_nonoverlapping, huffman_codes, greedy_coins).
   Needs viz-rag-kit.js and viz-dsa1.js.
   ========================================================================== */

(function () {
  "use strict";
  window.VIZ = window.VIZ || {};
  var K = window.RAGKIT, D = window.DSAKIT;
  if (!K || !D) throw new Error("viz-dsa5.js needs viz-rag-kit.js and viz-dsa1.js loaded first");
  var C = K.C, S = K.S, T = K.T, rect = K.rect, line = K.line, frame = K.frame;
  var clear = D.clear, commas = D.commas, stepper = D.stepper, row = D.row, lcg = D.lcg, boxes = D.boxes, focusable = D.focusable;

  function svgOf(f, h, label) { return S("svg", { viewBox: "0 0 760 " + h, width: "100%", role: "img", "aria-label": label }, f.body); }
  function say(svg, y, msg, col) { return T(svg, 8, y, msg, { anchor: "start", size: 11.5, mono: false, fill: col || C.text }); }
  function presetRow(f, list, fn) {
    var r = row(f.controls);
    list.forEach(function (p, i) {
      var b = document.createElement("button"); b.type = "button"; b.textContent = p;
      b.addEventListener("click", function () { fn(i); }); r.appendChild(b);
    });
    return r;
  }
  /* A generator driven by step / run / to end. make() returns a fresh
     iterator; each value it yields is one state to draw. */
  function runner(f, make, draw, opts) {
    opts = opts || {};
    var it, cur, n, done, timer = null;
    function stop() { if (timer) { clearInterval(timer); timer = null; } }
    function reset() { stop(); it = make(); n = 0; done = false; cur = null; draw(cur, n, done); }
    function adv(k) {
      for (var i = 0; i < k && !done; i++) { var r = it.next(); if (r.done) done = true; else { cur = r.value; n++; } }
    }
    f.btn("step ▸", function () { stop(); adv(1); draw(cur, n, done); });
    f.btn("run ▶", function () {
      if (timer) { stop(); return; }
      timer = setInterval(function () { adv(opts.speed || 1); draw(cur, n, done); if (done) stop(); }, opts.ms || 60);
    });
    f.btn("to end ⏭", function () {
      stop();
      /* chunked so a 10-million-node search never freezes the page */
      timer = setInterval(function () { adv(opts.chunk || 200000); draw(cur, n, done); if (done) stop(); }, 0);
    });
    f.btn("reset", reset);
    return { reset: reset };
  }

  /* ------------------------------------------------------------------------
     dsaBacktrackTree — ch18 §2–5. Every node the recursion visits, in the
     order it visits them. The dedupe rule is per problem: the guard of
     permute_unique, the j > start skip of subsets_with_dup, or the start
     index of combinations.
     ------------------------------------------------------------------------ */
  VIZ.dsaBacktrackTree = function (el) {
    var f = frame(el);
    var PROB = ["subsets", "permutations", "combinations, k = 2"], p = 0, dup = false, rule = false, nodes = [];
    var RULE = ["skip equal siblings", "skip unless used[i−1]", "start index"];
    function build() {
      nodes = [];
      var nums = p === 0 ? (dup ? [1, 2, 2] : [1, 2, 3]) : p === 1 ? (dup ? [1, 1, 2] : [1, 2, 3]) : [1, 2, 3, 4];
      function add(parent, label, cur, leaf) { var nd = { id: nodes.length, parent: parent, label: label, cur: cur.slice(), leaf: leaf, kids: [] }; if (parent >= 0) nodes[parent].kids.push(nd.id); nodes.push(nd); return nd.id; }
      var root = add(-1, "{ }", [], false), cur = [];
      if (p === 0 && !(dup && rule)) {                       // include / exclude
        (function go(i, par) {
          if (i === nums.length) { nodes[par].leaf = true; return; }
          cur.push(nums[i]); go(i + 1, add(par, "+" + nums[i], cur, false)); cur.pop();
          go(i + 1, add(par, "−" + nums[i], cur, false));
        })(0, root);
      } else if (p === 0) {                                   // subsets_with_dup: every node is an answer
        nodes[root].leaf = true;
        (function go(start, par) {
          for (var j = start; j < nums.length; j++) {
            if (j > start && nums[j] === nums[j - 1]) { nodes[add(par, "skip " + nums[j], cur, false)].skipped = true; continue; }
            cur.push(nums[j]); var id = add(par, "+" + nums[j], cur, true); go(j + 1, id); cur.pop();
          }
        })(0, root);
      } else if (p === 1) {
        var used = nums.map(function () { return false; });
        (function go(par) {
          if (cur.length === nums.length) { nodes[par].leaf = true; return; }
          for (var i = 0; i < nums.length; i++) {
            if (used[i]) continue;
            if (dup && rule && i > 0 && nums[i] === nums[i - 1] && !used[i - 1]) { nodes[add(par, "skip", cur, false)].skipped = true; continue; }
            used[i] = true; cur.push(nums[i]); go(add(par, String(nums[i]), cur, false)); cur.pop(); used[i] = false;
          }
        })(root);
      } else {
        (function go(start, par) {
          if (cur.length === 2) { nodes[par].leaf = true; return; }
          for (var j = rule ? start : 1; j <= 4; j++) {
            if (!rule && cur.indexOf(j) >= 0) continue;
            cur.push(j); go(j + 1, add(par, String(j), cur, false)); cur.pop();
          }
        })(1, root);
      }
      /* layout: leaves evenly spaced in visit order, parents centred */
      var depth = function (nd) { var d = 0; while (nd.parent >= 0) { nd = nodes[nd.parent]; d++; } return d; };
      var leaves = 0;
      (function lay(id) {
        var nd = nodes[id]; nd.d = depth(nd);
        if (!nd.kids.length) { nd.x = leaves++; return; }
        nd.kids.forEach(lay);
        nd.x = (nodes[nd.kids[0]].x + nodes[nd.kids[nd.kids.length - 1]].x) / 2;
      })(root);
      nodes.leafCount = leaves;
      nodes.maxD = Math.max.apply(null, nodes.map(function (n) { return n.d; }));
    }
    var svg = svgOf(f, 330, "backtracking state-space tree");
    function key(a) { return (p === 2 ? a.slice().sort() : a).join(","); }
    function draw(k) {
      clear(svg);
      var W = 720 / Math.max(1, nodes.leafCount), H = Math.min(60, 200 / Math.max(1, nodes.maxD));
      var px = function (nd) { return 20 + nd.x * W + W / 2; }, py = function (nd) { return 40 + nd.d * H; };
      var seen = {}, answers = 0, repeats = 0, shown = nodes.slice(0, k + 1);
      shown.forEach(function (nd) {
        if (nd.parent >= 0) line(svg, px(nodes[nd.parent]), py(nodes[nd.parent]) + 8, px(nd), py(nd) - 8, { stroke: nd.skipped ? C.orange : C.line, dash: nd.skipped ? "3 3" : "none" });
      });
      shown.forEach(function (nd, i) {
        var isAns = nd.leaf && !nd.skipped, rep = false;
        if (isAns) { var kk = key(nd.cur); if (seen[kk]) { rep = true; repeats++; } seen[kk] = 1; answers++; }
        nd.rep = rep;
        S("circle", { cx: px(nd), cy: py(nd), r: 8, fill: nd.skipped ? C.orange : rep ? C.pink : isAns ? C.green : C.card, stroke: i === k ? C.blue : C.line, "stroke-width": i === k ? 2.5 : 1, opacity: nd.skipped ? 0.5 : 1 }, svg);
        if (nd.parent >= 0 && W > 22) T(svg, px(nd), py(nd) - 14, nd.label, { size: 9, fill: nd.skipped ? C.orange : C.dim });
        if (isAns && W > 24) T(svg, px(nd), py(nd) + 20, "[" + nd.cur.join("") + "]", { size: 9, weight: 600, fill: rep ? C.pink : C.green });
      });
      var distinct = Object.keys(seen).length;
      T(svg, 8, 14, PROB[p] + " of [" + (p === 0 ? (dup ? "1,2,2" : "1,2,3") : p === 1 ? (dup ? "1,1,2" : "1,2,3") : "1,2,3,4") + "] · " + (p === 2 ? (rule ? "start index on" : "any unused element") : dup ? (rule ? RULE[p] + " on" : "no dedupe rule") : "distinct values") + " · node " + (k + 1) + " of " + nodes.length,
        { anchor: "start", size: 12, weight: 700 });
      T(svg, 8, 300, "answers " + answers + " · distinct " + distinct + " · repeats " + repeats, { anchor: "start", size: 12.5, weight: 700, fill: repeats ? C.pink : C.green });
      T(svg, 752, 300, "green: an answer · pink: an answer already found · orange: a branch the rule skips", { anchor: "end", size: 9.5, fill: C.faint, mono: false });
      var nd = nodes[k];
      T(svg, 8, 322, k === 0 ? "the root: nothing chosen yet" : nd.skipped ? "the rule refuses this branch before descending" : "chosen so far: [" + nd.cur.join(", ") + "]" + (nd.leaf ? " — an answer is recorded here" : ""),
        { anchor: "start", size: 11, fill: C.dim, mono: false });
    }
    K.tabs(f.controls, PROB, 0, function (k) { p = k; build(); sp.reload(); hint(); });
    K.toggle(f.controls, "duplicate values", dup, function (on) { dup = on; build(); sp.reload(); hint(); });
    K.toggle(f.controls, "dedupe rule", rule, function (on) { rule = on; build(); sp.reload(); hint(); });
    function hint() {
      f.say(p === 2 ? (rule ? "The start index: each level only looks forward, so {1,2} is never also {2,1}. Six leaves, six answers." : "Any unused element at each level: every pair is found twice, once per order. Count the pink leaves, then turn the start index on.") :
        dup ? (rule ? "The rule is on: " + RULE[p] + ". Step to the end and check that repeats is zero and nothing real was lost." : "Duplicates, no rule: step to the end and count the pink leaves, the answers found twice.") :
        "The tree grows as you step. Each green leaf is one complete answer.");
    }
    var sp = stepper(f, function () { return nodes.length - 1; }, draw);
    build(); draw(0);
    f.say("The tree grows as you step; each leaf is one complete answer. Turn duplicate values on without the dedupe rule and count the repeated leaves.");
  };

  /* ------------------------------------------------------------------------
     dsaNQueens — ch18 §6. queens[row] = column, drawn with rows across so
     the queens go in column by column. A node is one call of go(r), root
     included, which is how the chapter counts 2,057 and 109,601 at n = 8.
     Unpruned checks only the column (a permutation) and the diagonals at
     the leaf.
     ------------------------------------------------------------------------ */
  VIZ.dsaNQueens = function (el) {
    var f = frame(el);
    var n = 6, prune = true, nodes = 0, sols = 0, lastSol = null;
    var TABLE = { 6: [4, 153, 1957], 7: [40, 552, 13700], 8: [92, 2057, 109601], 9: [352, 8394, 986410], 10: [724, 35539, 9864101] };
    function* search() {
      var q = [], cols = {}, diag = {}, anti = {};
      function ok() { for (var a = 0; a < q.length; a++) for (var b = a + 1; b < q.length; b++) if (Math.abs(q[a] - q[b]) === b - a) return false; return true; }
      function* go(r) {
        nodes++;
        if (r === n) {
          var good = prune || ok();
          if (good) { sols++; lastSol = q.slice(); }
          yield { q: q.slice(), leaf: true, good: good };
          return;
        }
        yield { q: q.slice() };
        for (var c = 0; c < n; c++) {
          if (cols[c]) continue;
          if (prune && (diag[r - c] || anti[r + c])) continue;
          q.push(c); cols[c] = diag[r - c] = anti[r + c] = 1;
          yield* go(r + 1);
          q.pop(); cols[c] = 0; diag[r - c] = 0; anti[r + c] = 0;
        }
      }
      yield* go(0);
    }
    var svg = svgOf(f, 340, "n-queens search board and node counter");
    function draw(st, k, done) {
      clear(svg);
      var cell = Math.min(56, 290 / n), X0 = 20, Y0 = 36, q = st ? st.q : [];
      T(svg, 8, 14, n + " queens · pruning " + (prune ? "on: diagonals checked at every placement" : "off: diagonals checked only at the leaf"), { anchor: "start", size: 12, weight: 700 });
      for (var r = 0; r < n; r++) for (var c = 0; c < n; c++) {
        var att = false;
        for (var a = 0; a < q.length; a++) if (q[a] === c || Math.abs(q[a] - c) === Math.abs(a - r)) att = true;
        rect(svg, X0 + r * cell, Y0 + c * cell, cell, cell, { rx: 0, fill: (r + c) % 2 ? C.panel : C.card, stroke: C.line, sw: 0.5 });
        if (att && r >= q.length && prune) S("rect", { x: X0 + r * cell, y: Y0 + c * cell, width: cell, height: cell, fill: C.orange, opacity: 0.15 }, svg);
      }
      q.forEach(function (c, r) {
        var clash = false;
        for (var b = 0; b < q.length; b++) if (b !== r && Math.abs(q[b] - c) === Math.abs(b - r)) clash = true;
        T(svg, X0 + r * cell + cell / 2, Y0 + c * cell + cell / 2 + 1, "♛", { size: cell * 0.7, fill: clash ? C.pink : C.blue, mono: false });
      });
      var RX = 350;
      T(svg, RX, 52, "nodes visited", { anchor: "start", size: 10.5, fill: C.faint, mono: false });
      T(svg, RX, 78, commas(nodes), { anchor: "start", size: 24, weight: 700, fill: prune ? C.green : C.orange });
      T(svg, RX, 110, "solutions found", { anchor: "start", size: 10.5, fill: C.faint, mono: false });
      T(svg, RX, 134, String(sols), { anchor: "start", size: 20, weight: 700 });
      var t = TABLE[n];
      if (t) T(svg, RX, 170, "chapter's table, n = " + n + ": " + t[0] + " solutions · pruned " + commas(t[1]) + " · unpruned " + commas(t[2]), { anchor: "start", size: 10, fill: C.dim, mono: false });
      if (t && done) T(svg, RX, 190, "× " + (t[2] / t[1]).toFixed(1) + " more nodes without the prune", { anchor: "start", size: 11, weight: 700, fill: C.orange, mono: false });
      var msg = !st ? "Press step: each step is one call of go(r)." : done ? "search complete: " + commas(nodes) + " nodes, " + sols + " solutions" :
        st.leaf ? (st.good ? "a full board with no attacks: solution " + sols : "a full board, but two queens share a diagonal: rejected at the leaf") : "column " + (q.length + 1) + ": " + (q.length ? "placed " + q.length + " so far" : "empty board");
      T(svg, RX, 230, msg, { anchor: "start", size: 11, mono: false, fill: st && st.leaf && !st.good ? C.pink : C.text });
      T(svg, RX, 256, prune ? "orange squares are attacked, so the search never tries them" : "pink queens attack each other: the search walked there anyway", { anchor: "start", size: 9.5, fill: C.faint, mono: false });
    }
    var rn = runner(f, function () { nodes = 0; sols = 0; lastSol = null; return search(); }, draw, { ms: 50 });
    K.slider(f.controls, "n", 4, 10, n, 1, String, function (v) { n = v; rn.reset(); });
    K.toggle(f.controls, "pruning", prune, function (on) { prune = on; rn.reset(); });
    rn.reset();
    f.say("Place queens column by column. Set n = 8, run to the end with pruning off and then on, and compare the node counts.");
  };

  /* ------------------------------------------------------------------------
     dsaSudoku — ch18 §7, the chapter's solve_sudoku, with the cell choice
     switchable. A step is one digit placement, the count the chapter uses.
     ------------------------------------------------------------------------ */
  VIZ.dsaSudoku = function (el) {
    var f = frame(el);
    var PUZ = [["AI Escargot", "100007090030020008009600500005300900010080002600004000300000010040000007007000300"],
      ["a newspaper puzzle", "530070000600195000098000060800060003400803001700020006060000280000419005000080079"]];
    var pz = 0, mc = false, given = [], b = [], place = 0;
    function cand(i) {
      var r = (i / 9) | 0, c = i % 9, br = r - r % 3, bc = c - c % 3, u = {};
      for (var k = 0; k < 9; k++) { u[b[r * 9 + k]] = 1; u[b[k * 9 + c]] = 1; u[b[(br + ((k / 3) | 0)) * 9 + bc + k % 3]] = 1; }
      var o = []; for (var d = 1; d <= 9; d++) if (!u[d]) o.push(d);
      return o;
    }
    function* solve() {
      var best = null;
      for (var i = 0; i < 81; i++) if (!b[i]) { var cd = cand(i); if (!best || cd.length < best[1].length) best = [i, cd]; if (!mc) break; }
      if (!best) return true;
      for (var j = 0; j < best[1].length; j++) {
        b[best[0]] = best[1][j]; place++;
        yield { cell: best[0], opts: best[1].length };
        if (yield* solve()) return true;
        b[best[0]] = 0;
        yield { cell: best[0], undo: true };
      }
      return false;
    }
    function* whole() { var ok = yield* solve(); yield { solved: ok }; }
    var svg = svgOf(f, 330, "sudoku board, current cell and placement counter");
    function draw(st) {
      clear(svg);
      var cs = 32, X0 = 20, Y0 = 26;
      T(svg, 8, 14, PUZ[pz][0] + " · " + (mc ? "most-constrained cell first" : "left to right, top to bottom"), { anchor: "start", size: 12, weight: 700 });
      for (var i = 0; i < 81; i++) {
        var r = (i / 9) | 0, c = i % 9, x = X0 + c * cs, y = Y0 + r * cs, cur = st && st.cell === i;
        rect(svg, x, y, cs, cs, { rx: 0, fill: cur ? (st.undo ? C.pink : C.blue) : C.card, op: cur ? 0.35 : 1, stroke: C.line, sw: 0.5 });
        if (b[i]) T(svg, x + cs / 2, y + cs / 2 + 1, String(b[i]), { size: 15, weight: given[i] ? 800 : 500, fill: given[i] ? C.text : C.teal });
        else T(svg, x + cs - 5, y + 8, String(cand(i).length), { size: 7.5, fill: cand(i).length === 0 ? C.pink : C.faint, anchor: "end" });
      }
      for (var t = 0; t <= 3; t++) { line(svg, X0 + t * 3 * cs, Y0, X0 + t * 3 * cs, Y0 + 9 * cs, { stroke: C.text, sw: 1.6 }); line(svg, X0, Y0 + t * 3 * cs, X0 + 9 * cs, Y0 + t * 3 * cs, { stroke: C.text, sw: 1.6 }); }
      var RX = 330;
      T(svg, RX, 50, "digit placements tried", { anchor: "start", size: 10.5, fill: C.faint, mono: false });
      T(svg, RX, 78, commas(place), { anchor: "start", size: 26, weight: 700, fill: mc ? C.green : C.orange });
      T(svg, RX, 112, pz === 0 ? "chapter §7: 8,969 left to right · 217 most-constrained" : "try both orders on this one too", { anchor: "start", size: 10.5, fill: C.dim, mono: false });
      var msg = !st ? "Press step or run." :
        st.solved !== undefined ? (st.solved ? "solved after " + commas(place) + " placements" : "no solution") :
        st.undo ? "dead end: take the digit back out of r" + (((st.cell / 9) | 0) + 1) + "c" + (st.cell % 9 + 1) :
        "r" + (((st.cell / 9) | 0) + 1) + "c" + (st.cell % 9 + 1) + " ← " + b[st.cell] + " (" + st.opts + " candidate" + (st.opts === 1 ? ", so not a choice at all)" : "s)");
      T(svg, RX, 150, msg, { anchor: "start", size: 11, mono: false, fill: st && st.undo ? C.pink : st && st.solved ? C.green : C.text });
      T(svg, RX, 212, "bold: givens · small number: a blank's candidate count", { anchor: "start", size: 9.5, fill: C.faint, mono: false });
      T(svg, RX, 176, mc ? "it fills the blank with the fewest candidates:" : "it fills the next blank in reading order,", { anchor: "start", size: 9.5, fill: C.faint, mono: false });
      T(svg, RX, 192, mc ? "a one-candidate cell is a forced move, not a guess" : "however many candidates that blank has", { anchor: "start", size: 9.5, fill: C.faint, mono: false });
    }
    var rn = runner(f, function () { given = PUZ[pz][1].split("").map(Number); b = given.slice(); place = 0; return whole(); }, draw, { ms: 30, speed: 3, chunk: 5000 });
    K.tabs(f.controls, ["left to right", "most-constrained first"], 0, function (k) { mc = k === 1; rn.reset(); });
    K.tabs(f.controls, PUZ.map(function (x) { return x[0]; }), 0, function (k) { pz = k; rn.reset(); });
    rn.reset();
    f.say("Which empty cell should you fill next? Run AI Escargot to the end left to right, then most-constrained first, and compare the counters.");
  };

  /* ------------------------------------------------------------------------
     dsaMemoTable — ch19 §2 and §5. Each call is one event; the grid shows,
     per subproblem, how many times it was called and its value once known.
     ------------------------------------------------------------------------ */
  VIZ.dsaMemoTable = function (el) {
    var f = frame(el);
    var PROB = ["fib(n)", "grid paths m × m", "min coins {1, 3, 4}"], p = 0, memo = true, size = 20, ev = [];
    function build() {
      ev = []; var M = {}, calls = 0;
      function rec(k, v, kind) { calls++; ev.push({ k: k, v: v, kind: kind, calls: calls }); }
      if (p === 0) {
        (function fib(n) {
          if (n < 2) { rec(n, n, "base"); return n; }
          if (memo && M[n] !== undefined) { rec(n, M[n], "hit"); return M[n]; }
          var i = ev.length; rec(n, null, "call");
          var v = fib(n - 1) + fib(n - 2); ev[i].v = v; ev.push({ k: n, v: v, kind: "done", calls: calls });
          if (memo) M[n] = v; return v;
        })(size);
      } else if (p === 1) {
        (function paths(i, j) {
          var key = i + "," + j;
          if (i < 0 || j < 0) { rec(key, 0, "off"); return 0; }
          if (i === 0 && j === 0) { rec(key, 1, "base"); return 1; }
          if (memo && M[key] !== undefined) { rec(key, M[key], "hit"); return M[key]; }
          var s = ev.length; rec(key, null, "call");
          var v = paths(i - 1, j) + paths(i, j - 1); ev[s].v = v; ev.push({ k: key, v: v, kind: "done", calls: calls });
          if (memo) M[key] = v; return v;
        })(size - 1, size - 1);
      } else {
        (function coins(a) {
          if (a === 0) { rec(0, 0, "base"); return 0; }
          if (memo && M[a] !== undefined) { rec(a, M[a], "hit"); return M[a]; }
          var s = ev.length; rec(a, null, "call");
          var best = Infinity;
          [1, 3, 4].forEach(function (c) { if (c <= a) best = Math.min(best, 1 + coins(a - c)); });
          ev[s].v = best; ev.push({ k: a, v: best, kind: "done", calls: calls });
          if (memo) M[a] = best; return best;
        })(size);
      }
    }
    var svg = svgOf(f, 320, "subproblem table with call counts");
    function draw(k) {
      clear(svg);
      var seen = {}, vals = {}, hits = 0, last = ev[k - 1], calls = last ? last.calls : 0;
      ev.slice(0, k).forEach(function (e) {
        if (e.kind === "done") { vals[e.k] = e.v; return; }
        seen[e.k] = (seen[e.k] || 0) + 1;
        if (e.kind === "hit") hits++;
        if (e.kind === "base" || e.kind === "off") vals[e.k] = e.v;
      });
      var total = ev.length ? ev[ev.length - 1].calls : 0;
      T(svg, 8, 14, PROB[p].replace("n)", size + ")").replace("m × m", size + " × " + size) + (p === 2 ? ", amount " + size : "") + " · memo " + (memo ? "on" : "off"), { anchor: "start", size: 12.5, weight: 700 });
      T(svg, 752, 14, "calls " + commas(calls) + " of " + commas(total) + " · cache hits " + commas(hits), { anchor: "end", size: 12, weight: 700, fill: memo ? C.green : C.orange });
      var maxSeen = Math.max.apply(null, Object.keys(seen).map(function (x) { return seen[x]; }).concat([1]));
      function cellAt(x, y, w, h, key, label) {
        var c = seen[key] || 0, cur = last && last.k === key && last.kind !== "done";
        rect(svg, x, y, w, h, { rx: 4, fill: c ? (c > 1 ? C.orange : C.teal) : C.card, op: c ? 0.18 + 0.6 * Math.min(1, c / maxSeen) : 1, stroke: cur ? C.blue : C.line, sw: cur ? 2.5 : 1 });
        T(svg, x + w / 2, y + 10, label, { size: 8.5, fill: C.faint });
        if (vals[key] !== undefined) T(svg, x + w / 2, y + h / 2 + 3, String(vals[key] === Infinity ? "∞" : vals[key]), { size: w < 34 ? 9 : 11, weight: 700 });
        if (c) T(svg, x + w / 2, y + h - 7, "×" + commas(c), { size: w < 34 ? 7.5 : 9, fill: c > 1 ? C.orange : C.teal, weight: 600 });
      }
      if (p === 1) {
        var cw = Math.min(56, 270 / size);
        for (var i = 0; i < size; i++) for (var j = 0; j < size; j++) cellAt(20 + j * cw, 36 + i * cw, cw - 3, cw - 3, i + "," + j, i + "," + j);
      } else {
        var n = size + 1, w = 720 / n;
        for (var t = 0; t <= size; t++) cellAt(20 + t * w, 40, w - 3, 58, t, (p === 0 ? "f" : "C") + t);
      }
      var e = last;
      var X = p === 1 ? 360 : 8, Y = p === 1 ? 60 : 124;
      var msg = !e ? "Press step: each step is one call (or one return)." :
        e.kind === "hit" ? "call " + e.k + ": in the memo, returned without recursing" :
        e.kind === "base" ? "call " + e.k + ": base case, " + e.v :
        e.kind === "off" ? "call " + e.k + ": off the grid, 0" :
        e.kind === "done" ? e.k + " returns " + (e.v === Infinity ? "∞" : e.v) + (memo ? ", stored in the memo" : ", and is forgotten") :
        "call " + e.k + ": not known, so recurse";
      T(svg, X, Y, msg, { anchor: "start", size: 11.5, mono: false, fill: e && e.kind === "hit" ? C.green : C.text });
      T(svg, X, Y + 24, "×N: times that subproblem was called; orange means more than once", { anchor: "start", size: 9.5, fill: C.faint, mono: false });
      T(svg, X, Y + 42, memo ? "with the memo each subproblem is computed once" : "without it, a subproblem is recomputed every time", { anchor: "start", size: 9.5, fill: C.faint, mono: false });
    }
    var sz;
    K.tabs(f.controls, PROB, 0, function (k) { p = k; size = k === 1 ? 5 : k === 0 ? 20 : 12; sz.input.max = k === 1 ? 8 : 20; sz.set(size); build(); sp.reload(); });
    sz = K.slider(f.controls, "size", 2, 20, size, 1, String, function (v) { size = v; build(); sp.reload(); });
    K.toggle(f.controls, "memo", memo, function (on) { memo = on; build(); sp.reload(); });
    var sp = stepper(f, function () { return ev.length; }, draw);
    build(); draw(0);
    f.say("Same recursion, one table. Run fib(20) to the end with the memo on, then off, and watch the call counter go from 39 to 21,891.");
  };

  /* ------------------------------------------------------------------------
     dsaSRTBOT — ch19 §5. The chapter's four cards. S, R, T, B and O are
     revealed in order; Time is answered first, then revealed.
     ------------------------------------------------------------------------ */
  VIZ.dsaSRTBOT = function (el) {
    var f = frame(el);
    var CARDS = [
      { name: "longest common subsequence", q: "Length of the LCS of strings s (length m) and t (length n).",
        a: ["L(i, j) = length of the LCS of prefixes s[:i] and t[:j]", "if s[i−1] = t[j−1]: L(i, j) = 1 + L(i−1, j−1); else max(L(i−1, j), L(i, j−1))",
          "increasing i, then increasing j: each cell reads smaller i or j", "L(0, j) = 0 and L(i, 0) = 0: an empty prefix shares nothing", "L(m, n)"],
        time: ["O(m + n)", "O(mn)", "O(mn · (m + n))"], ok: 1, why: "m·n subproblems × O(1) each. The transition reads three cells, so the count is the time." },
      { name: "grid paths", q: "Right/down paths from the top-left to cell (m, n).",
        a: ["P(i, j) = number of right/down paths to cell (i, j)", "P(i, j) = P(i−1, j) + P(i, j−1)", "increasing i, then j", "P(0, 0) = 1; any off-grid cell 0", "P(m, n)"],
        time: ["O(mn)", "O(2^(m+n))", "O(m + n)"], ok: 0, why: "mn subproblems × O(1). The honest recursion without a table is the exponential one." },
      { name: "minimum coins", q: "Fewest coins from a set summing to an amount A.",
        a: ["C(a) = fewest coins summing to a", "C(a) = 1 + min over coins c ≤ a of C(a − c)", "increasing a", "C(0) = 0", "C(A)"],
        time: ["O(A)", "O(A · number of coins)", "O(A²)"], ok: 1, why: "A subproblems, and each transition loops over the coins: the transition is not O(1)." },
      { name: "longest increasing subsequence", q: "Length of the longest strictly increasing subsequence of a[0..n−1].",
        a: ["x(i) = length of the LIS ending at index i", "x(i) = 1 + max over j < i with a[j] < a[i] of x(j), or 1", "increasing i", "x(0) = 1", "max over all i of x(i)"],
        time: ["O(n)", "O(n²)", "O(n log n)"], ok: 1, trap: 0,
        why: "n subproblems, but each transition scans every earlier j: O(n) per transition, O(n²) total. The count looked linear; the transition did not. Chapter 21's n log n needs different state, not fewer subproblems." }
    ];
    var ci = 0, shown = 0, pick = -1;
    var LET = ["S — subproblems", "R — relate", "T — topological order", "B — base cases", "O — original problem", "T — time"];
    var svg = svgOf(f, 336, "SRTBOT card");
    function render() {
      clear(svg);
      var c = CARDS[ci];
      T(svg, 8, 14, c.name, { anchor: "start", size: 13, weight: 700 });
      T(svg, 8, 34, c.q, { anchor: "start", size: 11, fill: C.dim, mono: false });
      LET.forEach(function (l, i) {
        var y = 56 + i * 40, open = i < shown || (i === 5 && shown > 5);
        rect(svg, 8, y, 744, 34, { rx: 6, fill: open ? C.card : "none", stroke: i === shown ? C.blue : C.line, sw: i === shown ? 2 : 1 });
        T(svg, 18, y + 17, l, { anchor: "start", size: 11, weight: 700, fill: open ? C.text : C.faint, mono: false });
        if (i < 5) T(svg, 200, y + 17, open ? c.a[i] : i === shown ? "say it to yourself, then reveal" : "", { anchor: "start", size: 10.5, fill: open ? C.text : C.faint });
        else if (open) T(svg, 200, y + 17, c.time[c.ok] + (pick >= 0 ? (pick === c.ok ? " — you had it" : " — you said " + c.time[pick]) : ""), { anchor: "start", size: 11, weight: 700, fill: pick === c.ok ? C.green : pick >= 0 ? C.pink : C.text });
        else if (shown === 5) T(svg, 200, y + 17, pick >= 0 ? "your answer: " + c.time[pick] + " — now reveal" : "pick an answer below before revealing", { anchor: "start", size: 10.5, fill: C.blue });
      });
      if (shown > 5) D.wrap(svg, 8, 302, c.why, 744, { size: 10.5, fill: C.dim });
    }
    K.tabs(f.controls, CARDS.map(function (c) { return c.name; }), 0, function (k) { ci = k; shown = 0; pick = -1; paintTime(); render(); });
    f.btn("reveal next", function () { if (shown === 5 && pick < 0) { f.say("Commit to a running time first: that is the whole point of the last step."); return; } if (shown <= 5) shown++; render(); });
    var tr = row(f.controls), tb = [];
    function paintTime() {
      while (tr.firstChild) tr.removeChild(tr.firstChild);
      tb = CARDS[ci].time.map(function (t, i) {
        var b = document.createElement("button"); b.type = "button"; b.textContent = "Time: " + t;
        b.setAttribute("aria-pressed", "false");
        b.addEventListener("click", function () { pick = i; tb.forEach(function (o, j) { o.setAttribute("aria-pressed", j === i ? "true" : "false"); }); render(); });
        tr.appendChild(b); return b;
      });
    }
    f.btn("start over", function () { shown = 0; pick = -1; paintTime(); render(); });
    paintTime(); render();
    f.say("Six questions, in order. Answer each before revealing it, especially Time: find the problem where the subproblem count is right but the transition is not O(1).");
  };

  /* ------------------------------------------------------------------------
     dsaDPOrder — ch19 §8. count_combinations and count_sequences, one
     update (ways[a] += ways[a − c]) per step, stepped together.
     ------------------------------------------------------------------------ */
  VIZ.dsaDPOrder = function (el) {
    var f = frame(el);
    var SETS = [[1, 2, 5], [1, 2], [2, 3], [1, 3, 4]], si = 0, A = 10, tA = [], tB = [];
    function build() {
      var coins = SETS[si], w = [1], a, i;
      for (a = 1; a <= A; a++) w.push(0);
      tA = [{ w: w.slice() }];
      coins.forEach(function (c) { for (a = c; a <= A; a++) { w[a] += w[a - c]; tA.push({ w: w.slice(), a: a, c: c }); } });
      w = [1]; for (a = 1; a <= A; a++) w.push(0);
      tB = [{ w: w.slice() }];
      for (a = 1; a <= A; a++) for (i = 0; i < coins.length; i++) { var c = coins[i]; if (c <= a) { w[a] += w[a - c]; tB.push({ w: w.slice(), a: a, c: c }); } }
    }
    var svg = svgOf(f, 290, "two loop orders filling the same coin table");
    function draw(k) {
      clear(svg);
      var a = tA[Math.min(k, tA.length - 1)], b = tB[Math.min(k, tB.length - 1)], fa = tA[tA.length - 1].w, fb = tB[tB.length - 1].w;
      var doneA = k >= tA.length - 1, doneB = k >= tB.length - 1, div = -1;
      for (var x = 0; x <= A; x++) if (fa[x] !== fb[x]) { div = x; break; }
      T(svg, 8, 14, "coins {" + SETS[si].join(", ") + "} · amounts 0–" + A + " · step " + k, { anchor: "start", size: 12.5, weight: 700 });
      var W = 680 / (A + 1);
      for (x = 0; x <= A; x++) T(svg, 70 + x * W + W / 2, 40, String(x), { size: 9.5, fill: C.faint });
      function rowAt(y, st, name, sub, done) {
        T(svg, 8, y + 14, name, { anchor: "start", size: 10.5, weight: 700, mono: false });
        T(svg, 8, y + 30, sub, { anchor: "start", size: 9, fill: C.faint, mono: false });
        st.w.forEach(function (v, i) {
          var hot = st.a === i, src = st.a !== undefined && st.a - st.c === i, bad = done && doneA && doneB && i >= div && div >= 0 && fa[i] !== fb[i];
          rect(svg, 70 + i * W + 2, y, W - 4, 36, { rx: 5, fill: hot ? C.blue : src ? C.teal : bad ? C.pink : C.card, op: hot || src || bad ? 0.3 : 1, stroke: hot ? C.blue : i === div && doneA && doneB ? C.pink : C.line, sw: hot || i === div ? 2 : 1 });
          T(svg, 70 + i * W + W / 2, y + 18, commas(v), { size: v > 999 ? 9 : 12, weight: 600 });
        });
        T(svg, 752, y + 50, st.a !== undefined ? "ways[" + st.a + "] += ways[" + (st.a - st.c) + "]   (coin " + st.c + ")" : done ? "done" : "", { anchor: "end", size: 10, fill: C.dim });
      }
      rowAt(56, a, "coin outer", "combinations", doneA);
      rowAt(136, b, "amount outer", "sequences", doneB);
      var msg = doneA && doneB ? (div >= 0 ? "they first differ at amount " + div + ": " + fa[div] + " multisets against " + fb[div] + " ordered sequences — the larger row counts permutations" : "they never differ for this coin set") :
        "blue: the cell being updated · teal: the cell it reads";
      T(svg, 8, 226, msg, { anchor: "start", size: 11.5, mono: false, fill: doneA && doneB && div >= 0 ? C.pink : C.text, weight: doneA && doneB ? 700 : 400 });
      T(svg, 8, 250, "coin outer commits to an order among the coins, so {1,2} is never counted again as {2,1}; amount outer re-offers every coin at every amount",
        { anchor: "start", size: 9.5, fill: C.faint, mono: false });
    }
    K.tabs(f.controls, SETS.map(function (s) { return "{" + s.join(",") + "}"; }), 0, function (k) { si = k; build(); sp.reload(); });
    var sp = stepper(f, function () { return Math.max(tA.length, tB.length) - 1; }, draw);
    build(); draw(0);
    f.say("Two loops, two orders, two different answers. Step both to the end and find the cell where they first diverge; say which row counts permutations.");
  };

  /* ------------------------------------------------------------------------
     dsaKnapsack — ch20 §1, the chapter's knapsack() and its traceback.
     Weights are whole tens so the columns can be the chapter's 0, 10, …
     ------------------------------------------------------------------------ */
  VIZ.dsaKnapsack = function (el) {
    var f = frame(el);
    var items = [["A", 60, 10], ["B", 100, 20], ["C", 120, 30]], W = 50, K2 = [], trace = false, rnd = lcg(3);
    function build() {
      var n = items.length, cols = W / 10;
      K2 = []; for (var i = 0; i <= n; i++) { K2.push([]); for (var c = 0; c <= cols; c++) K2[i].push(0); }
      for (i = 1; i <= n; i++) for (c = 0; c <= cols; c++) {
        var v = items[i - 1][1], w = items[i - 1][2] / 10;
        K2[i][c] = K2[i - 1][c];
        if (w <= c && K2[i - 1][c - w] + v > K2[i][c]) K2[i][c] = K2[i - 1][c - w] + v;
      }
    }
    function traceback() {
      var taken = [], path = [], c = W / 10;
      for (var i = items.length; i > 0; i--) { path.push([i, c]); if (K2[i][c] !== K2[i - 1][c]) { taken.unshift(i - 1); c -= items[i - 1][2] / 10; } }
      path.push([0, c]);
      return { taken: taken, path: path };
    }
    function greedy() {
      var order = items.map(function (it, i) { return i; }).sort(function (a, b) { return items[b][1] / items[b][2] - items[a][1] / items[a][2]; });
      var cap = W, v = 0, took = [];
      order.forEach(function (i) { if (items[i][2] <= cap) { cap -= items[i][2]; v += items[i][1]; took.push(i); } });
      return { v: v, took: took };
    }
    var svg = svgOf(f, 340, "knapsack table and traceback");
    function draw(k) {
      clear(svg);
      var n = items.length, cols = W / 10, total = n * (cols + 1), cw = Math.min(90, 600 / (cols + 1)), rh = Math.min(34, 190 / (n + 1));
      var X0 = 150, Y0 = 44, done = k >= total, tb = done && trace ? traceback() : null;
      T(svg, 8, 14, "K(i, c): best value from the first i items within capacity c · cell " + Math.min(k, total) + " of " + total, { anchor: "start", size: 12, weight: 700 });
      for (var c = 0; c <= cols; c++) T(svg, X0 + c * cw + cw / 2, Y0 - 8, String(c * 10), { size: 10, fill: C.faint });
      for (var i = 0; i <= n; i++) {
        var y = Y0 + i * rh;
        T(svg, 8, y + rh / 2, i === 0 ? "{ }" : "+" + items[i - 1][0] + " (v" + items[i - 1][1] + ", w" + items[i - 1][2] + ")", { anchor: "start", size: 10, mono: false });
        for (c = 0; c <= cols; c++) {
          var idx = i === 0 ? -1 : (i - 1) * (cols + 1) + c, filled = i === 0 || idx < k, cur = idx === k - 1;
          var onPath = tb && tb.path.some(function (pp) { return pp[0] === i && pp[1] === c; });
          rect(svg, X0 + c * cw + 1, y + 1, cw - 2, rh - 2, { rx: 3, fill: onPath ? C.orange : cur ? C.blue : C.card, op: onPath || cur ? 0.35 : 1, stroke: C.line, sw: 0.8 });
          if (filled) T(svg, X0 + c * cw + cw / 2, y + rh / 2, String(K2[i][c]), { size: 11, weight: cur ? 700 : 500, fill: i === n && c === cols ? C.green : C.text });
        }
      }
      var yb = Y0 + (n + 1) * rh + 18;
      if (k > 0 && k <= total && !done) {
        var ii = Math.floor((k - 1) / (cols + 1)) + 1, cc = (k - 1) % (cols + 1), it = items[ii - 1], w = it[2] / 10;
        T(svg, 8, yb, "K(" + ii + ", " + cc * 10 + ") = max(leave " + it[0] + ": " + K2[ii - 1][cc] + (w <= cc ? ", take " + it[0] + ": " + K2[ii - 1][cc - w] + " + " + it[1] + " = " + (K2[ii - 1][cc - w] + it[1]) : ", " + it[0] + " does not fit") + ") = " + K2[ii][cc],
          { anchor: "start", size: 11.5, mono: false });
      }
      if (done) {
        var g = greedy(), best = K2[n][cols];
        T(svg, 8, yb, "optimum " + best + (tb ? " = {" + tb.taken.map(function (t) { return items[t][0]; }).join(", ") + "}" : " — turn traceback on to see which items"), { anchor: "start", size: 12, weight: 700, fill: C.green, mono: false });
        T(svg, 8, yb + 22, "greedy by value/weight takes {" + g.took.map(function (t) { return items[t][0]; }).join(", ") + "} = " + g.v + (g.v < best ? " — it grabbed the best ratio first and it cost " + (best - g.v) : " — it happens to match here"),
          { anchor: "start", size: 11.5, fill: g.v < best ? C.pink : C.dim, mono: false });
      }
      T(svg, 8, 328, "traceback: where a row's value differs from the row above, that item was taken; subtract its weight and go up", { anchor: "start", size: 9.5, fill: C.faint, mono: false });
    }
    var sp;
    K.slider(f.controls, "capacity", 10, 80, W, 10, String, function (v) { W = v; build(); sp.go(sp.pos()); });
    K.toggle(f.controls, "traceback", trace, function (on) { trace = on; sp.go(sp.pos()); });
    f.btn("add item", function () { if (items.length < 6) { items.push([String.fromCharCode(65 + items.length), 10 * (2 + rnd(14)), 10 * (1 + rnd(4))]); build(); sp.reload(); } });
    f.btn("remove last", function () { if (items.length > 1) { items.pop(); build(); sp.reload(); } });
    f.btn("chapter's three", function () { items = [["A", 60, 10], ["B", 100, 20], ["C", 120, 30]]; W = 50; build(); sp.reload(); });
    sp = stepper(f, function () { return items.length * (W / 10 + 1); }, draw);
    build(); draw(0);
    f.say("Fill the table cell by cell, then turn the traceback on: find the item greedy-by-ratio takes that the optimum does not.");
  };

  /* ------------------------------------------------------------------------
     dsaLIS — ch21 §1–2. Step i processes a[i] in both: the O(n²) x(i) and
     lis_length's tails with bisect_left.
     ------------------------------------------------------------------------ */
  VIZ.dsaLIS = function (el) {
    var f = frame(el);
    var PRE = [[10, 22, 9, 33, 21, 50, 41, 60], [3, 1, 4, 1, 5, 9, 2, 6, 5, 3, 5], [5, 4, 3, 2, 1], [1, 2, 3, 4, 5, 6]], a = PRE[0].slice(), tr = [];
    function build() {
      var x = [], tails = [];
      tr = [{ x: [], tails: [] }];
      a.forEach(function (v, i) {
        var best = 1, from = -1;
        for (var j = 0; j < i; j++) if (a[j] < v && x[j] + 1 > best) { best = x[j] + 1; from = j; }
        x.push(best);
        var lo = 0, hi = tails.length;
        while (lo < hi) { var m = (lo + hi) >> 1; if (tails[m] < v) lo = m + 1; else hi = m; }
        var over = lo < tails.length ? tails[lo] : null;
        if (lo === tails.length) tails.push(v); else tails[lo] = v;
        tr.push({ x: x.slice(), tails: tails.slice(), i: i, k: lo, over: over, from: from });
      });
    }
    function isSubseq(s) { var j = 0; for (var i = 0; i < a.length && j < s.length; i++) if (a[i] === s[j]) j++; return j === s.length; }
    function realLIS() {
      var x = tr[tr.length - 1].x, best = Math.max.apply(null, x.concat([0])), i = x.lastIndexOf(best), out = [];
      while (i >= 0) { out.unshift(a[i]); var want = x[i] - 1, nxt = -1; for (var j = i - 1; j >= 0; j--) if (x[j] === want && a[j] < a[i]) { nxt = j; break; } i = want ? nxt : -1; }
      return out;
    }
    var svg = svgOf(f, 320, "LIS by quadratic scan and by patience sorting");
    function draw(k) {
      clear(svg);
      var s = tr[k], n = a.length, done = k === n;
      T(svg, 8, 14, "step " + k + " of " + n, { anchor: "start", size: 12.5, weight: 700 });
      var bx = boxes(svg, a, 30, { style: function (i) { return i === s.i ? { fill: C.blue, op: 0.35, stroke: C.blue, sw: 2 } : i === s.from ? { fill: C.teal, op: 0.25 } : i > (s.i === undefined ? -1 : s.i) ? { col: C.faint } : {}; } });
      T(svg, 8, 96, "x(i), O(n²):", { anchor: "start", size: 10, fill: C.faint, mono: false });
      s.x.forEach(function (v, i) { T(svg, bx.x(i), 96, String(v), { size: 12, weight: 700, fill: C.teal }); });
      T(svg, 8, 132, "tails, O(n log n):", { anchor: "start", size: 10, fill: C.faint, mono: false });
      s.tails.forEach(function (v, j) {
        rect(svg, 130 + j * 56, 116, 50, 30, { rx: 5, fill: j === s.k ? C.orange : C.card, op: j === s.k ? 0.35 : 1, stroke: j === s.k ? C.orange : C.line });
        T(svg, 155 + j * 56, 131, String(v), { size: 13, weight: 700 });
        T(svg, 155 + j * 56, 156, "len " + (j + 1), { size: 8.5, fill: C.faint });
      });
      if (s.i !== undefined) say(svg, 186, a[s.i] + (s.over === null ? " is larger than every tail: append, length " + s.tails.length : " overwrites tails[" + s.k + "] = " + s.over + ": a smaller tail for length " + (s.k + 1)) +
        " · x(" + s.i + ") = " + s.x[s.i] + (s.from >= 0 ? ", extending the run ending at " + a[s.from] : ""));
      if (done) {
        var L1 = Math.max.apply(null, s.x.concat([0])), L2 = s.tails.length, sub = isSubseq(s.tails);
        T(svg, 8, 214, "both lengths: " + L1 + " and " + L2 + (L1 === L2 ? " — they agree" : ""), { anchor: "start", size: 12, weight: 700, fill: C.green, mono: false });
        T(svg, 8, 238, "tails = [" + s.tails.join(", ") + "] — " + (sub ? "a subsequence of the input this time" : "NOT a subsequence of the input: its entries come from different runs"), { anchor: "start", size: 12, weight: 700, fill: sub ? C.dim : C.pink, mono: false });
        T(svg, 8, 262, "an actual LIS, from x(i): [" + realLIS().join(", ") + "]", { anchor: "start", size: 11.5, fill: C.teal, mono: false });
      }
      T(svg, 8, 300, "tails[k] = the smallest value that ends any increasing run of length k + 1 seen so far — a table of records, not one run", { anchor: "start", size: 9.5, fill: C.faint, mono: false });
    }
    presetRow(f, PRE.map(function (p) { return "[" + p.join(",") + "]"; }).slice(0, 2).concat(["decreasing", "increasing"]), function (i) { a = PRE[i].slice(); inp.value = a.join(", "); build(); sp.reload(); });
    var inp = D.input(f.controls, a.join(", "), "array for LIS, comma separated", "14em", function (v) {
      var xs = v.split(/[\s,]+/).filter(Boolean).map(Number);
      if (xs.length && xs.length <= 12 && xs.every(function (x) { return isFinite(x) && Math.abs(x) < 1000; })) { a = xs; build(); sp.reload(); f.say("Step to the end and check the tails array against the input."); }
      else f.say("Up to 12 numbers, comma separated, then Enter.");
    });
    var sp = stepper(f, function () { return a.length; }, draw);
    build(); draw(0);
    f.say("Two algorithms, same length. Step to the end and watch the tails array: find an input where its final contents are not a subsequence at all, and confirm the length is still right.");
  };

  /* ------------------------------------------------------------------------
     dsaGridDP — ch22 §1, unique_paths and min_path_sum. The corners stay
     open so the zero has to come from a real cut.
     ------------------------------------------------------------------------ */
  VIZ.dsaGridDP = function (el) {
    var f = frame(el);
    var N = 5, mode = 0, wall = {}, cost = {}, P = [], rnd = lcg(22);
    function build() {
      P = [];
      for (var i = 0; i < N; i++) { P.push([]); for (var j = 0; j < N; j++) {
        var v;
        if (mode === 0) { if (wall[i + "," + j]) v = 0; else if (!i && !j) v = 1; else v = (i ? P[i - 1][j] : 0) + (j ? P[i][j - 1] : 0); }
        else { var c = cost[i + "," + j] || 1, best = !i && !j ? 0 : !i ? P[i][j - 1] : !j ? P[i - 1][j] : Math.min(P[i - 1][j], P[i][j - 1]); v = best + c; }
        P[i].push(v);
      } }
    }
    var svg = S("svg", { viewBox: "0 0 760 380", width: "100%", role: "group", "aria-label": "grid DP: click a cell to toggle a wall or change its cost" }, f.body);
    function draw(k) {
      clear(svg);
      var cs = Math.min(56, 300 / N), X0 = 20, Y0 = 36, total = N * N, walls = Object.keys(wall).filter(function (x) { return wall[x]; }).length;
      T(svg, 8, 14, (mode === 0 ? "paths to each cell, walls hold zero" : "cheapest path sum to each cell") + " · " + N + " × " + N + " · cell " + Math.min(k, total) + " of " + total, { anchor: "start", size: 12, weight: 700 });
      for (var i = 0; i < N; i++) for (var j = 0; j < N; j++) {
        var idx = i * N + j, filled = idx < k, cur = idx === k - 1, isW = mode === 0 && wall[i + "," + j], x = X0 + j * cs, y = Y0 + i * cs;
        var r = rect(svg, x + 1, y + 1, cs - 2, cs - 2, { rx: 4, fill: isW ? C.text : cur ? C.blue : C.card, op: isW ? 0.8 : cur ? 0.35 : 1, stroke: C.line });
        if (!isW && filled) T(svg, x + cs / 2, y + cs / 2 + (mode ? 6 : 0), commas(P[i][j]), { size: P[i][j] > 9999 ? 8.5 : cs < 40 ? 10 : 12, weight: 700, fill: mode === 0 && P[i][j] === 0 ? C.pink : C.text });
        if (mode === 1) T(svg, x + 6, y + 10, "+" + (cost[i + "," + j] || 1), { size: 8.5, fill: C.faint, anchor: "start" });
        (function (i2, j2, node) {
          function hit() {
            if (mode === 0) { if ((i2 === 0 && j2 === 0) || (i2 === N - 1 && j2 === N - 1)) { f.say("The corners stay open: zero the count with a real cut."); return; } wall[i2 + "," + j2] = !wall[i2 + "," + j2]; }
            else cost[i2 + "," + j2] = (cost[i2 + "," + j2] || 1) % 9 + 1;
            build(); sp.go(total);
          }
          node.addEventListener("click", hit); focusable(node, "cell " + i2 + "," + j2, hit);
        })(i, j, r);
      }
      var RX = X0 + N * cs + 30, ans = P[N - 1][N - 1], done = k >= total;
      T(svg, RX, 52, mode === 0 ? "paths to the far corner" : "cheapest path sum", { anchor: "start", size: 10.5, fill: C.faint, mono: false });
      T(svg, RX, 80, done ? commas(ans) : "…", { anchor: "start", size: 24, weight: 700, fill: mode === 0 && done && ans === 0 ? C.pink : C.green });
      if (mode === 0) {
        var bin = 1; for (var t = 1; t < N; t++) bin = bin * (N - 1 + t) / t;
        T(svg, RX, 110, "walls: " + walls + " · with none, C(" + (2 * N - 2) + ", " + (N - 1) + ") = " + commas(Math.round(bin)), { anchor: "start", size: 10.5, fill: C.dim, mono: false });
        T(svg, RX, 136, done && ans === 0 ? "zero with " + walls + " wall" + (walls === 1 ? "" : "s") + ": every monotone path crosses them" : "every monotone path crosses each anti-diagonal once", { anchor: "start", size: 10.5, fill: done && ans === 0 ? C.pink : C.faint, mono: false });
      } else T(svg, RX, 110, "each cell: the cheaper of above and left, plus its own cost", { anchor: "start", size: 10.5, fill: C.dim, mono: false });
      if (k > 0 && k <= total) {
        var ci = Math.floor((k - 1) / N), cj = (k - 1) % N;
        T(svg, RX, 176, mode === 0 ? (wall[ci + "," + cj] ? "(" + ci + "," + cj + ") is a wall: 0" : !ci && !cj ? "(0,0): the start, 1" : "(" + ci + "," + cj + ") = above " + (ci ? P[ci - 1][cj] : 0) + " + left " + (cj ? P[ci][cj - 1] : 0) + " = " + P[ci][cj]) :
          "(" + ci + "," + cj + ") = " + (ci || cj ? "min(" + (ci ? P[ci - 1][cj] : "—") + ", " + (cj ? P[ci][cj - 1] : "—") + ") + " : "") + (cost[ci + "," + cj] || 1) + " = " + P[ci][cj], { anchor: "start", size: 11, mono: false });
      }
      T(svg, RX, 206, mode === 0 ? "click a cell to toggle a wall" : "click a cell to raise its cost (1–9)", { anchor: "start", size: 9.5, fill: C.faint, mono: false });
    }
    K.tabs(f.controls, ["count paths", "min path sum"], 0, function (k) { mode = k; build(); sp.go(N * N); });
    K.slider(f.controls, "size", 3, 10, N, 1, function (v) { return v + "×" + v; }, function (v) { N = v; wall = {}; build(); sp.reload(); });
    f.btn("clear walls", function () { wall = {}; build(); sp.go(N * N); });
    f.btn("random costs", function () { cost = {}; for (var i = 0; i < 100; i++) cost[((i / 10) | 0) + "," + (i % 10)] = 1 + rnd(9); build(); sp.go(N * N); });
    var sp = stepper(f, function () { return N * N; }, draw);
    build(); draw(0);
    f.say("Click to add walls; watch the counts fill in from the corner. With the corners open, find the fewest walls that take the count to zero, and where they must be.");
  };

  /* ------------------------------------------------------------------------
     Intervals shared by the two ch23 interval machines. Touching endpoints
     are compatible, as in max_nonoverlapping.
     ------------------------------------------------------------------------ */
  function overlaps(a, b) { return a[0] < b[1] && b[0] < a[1]; }
  function greedyBy(ivs, keyFn) {
    var order = ivs.map(function (v, i) { return i; }).sort(function (x, y) { return keyFn(ivs[x]) - keyFn(ivs[y]) || ivs[x][0] - ivs[y][0] || x - y; });
    var took = [];
    order.forEach(function (i) { if (took.every(function (j) { return !overlaps(ivs[i], ivs[j]); })) took.push(i); });
    return took.sort(function (x, y) { return ivs[x][1] - ivs[y][1]; });
  }
  function optimum(ivs) {
    var best = [];
    for (var m = 0; m < 1 << ivs.length; m++) {
      var s = []; for (var i = 0; i < ivs.length; i++) if (m >> i & 1) s.push(i);
      if (s.length <= best.length) continue;
      var ok = true; for (var a = 0; a < s.length && ok; a++) for (var b = a + 1; b < s.length; b++) if (overlaps(ivs[s[a]], ivs[s[b]])) { ok = false; break; }
      if (ok) best = s;
    }
    return best;
  }

  /* ------------------------------------------------------------------------
     dsaGreedyIntervals — ch23 §1. Drag a bar to move it, drag its right end
     to resize; arrow keys do the same when a bar has focus.
     ------------------------------------------------------------------------ */
  VIZ.dsaGreedyIntervals = function (el) {
    var f = frame(el);
    var PRE = { "the 3-interval counterexample": [[0, 3], [2, 4], [3, 6]], "the chapter's five": [[0, 3], [1, 4], [4, 8], [6, 10], [11, 14]], "starts early, runs long": [[0, 16], [1, 3], [4, 6], [7, 9]] };
    var ivs = PRE["the chapter's five"].map(function (x) { return x.slice(); }), rnd = lcg(8), drag = null;
    var RULES = [["earliest start", function (v) { return v[0]; }], ["shortest", function (v) { return v[1] - v[0]; }], ["earliest finish", function (v) { return v[1]; }]];
    var svg = S("svg", { viewBox: "0 0 760 320", width: "100%", role: "group", "aria-label": "interval scheduling: three greedy rules and the optimum" }, f.body);
    var X0 = 30, U = 44;                          // 16 units across
    function render() {
      clear(svg);
      var opt = optimum(ivs), res = RULES.map(function (r) { return greedyBy(ivs, r[1]); });
      T(svg, 8, 14, ivs.length + " intervals · the optimum keeps " + opt.length, { anchor: "start", size: 12.5, weight: 700 });
      var H = Math.min(18, 140 / ivs.length);
      for (var t = 0; t <= 16; t += 2) { line(svg, X0 + t * U, 26, X0 + t * U, 50 + ivs.length * (H + 4) + 180, { stroke: C.line, dash: "2 5" }); T(svg, X0 + t * U, 30, String(t), { size: 9, fill: C.faint }); }
      ivs.forEach(function (v, i) {
        var y = 40 + i * (H + 4);
        var bar = rect(svg, X0 + v[0] * U, y, (v[1] - v[0]) * U, H, { rx: 4, fill: C.blue, op: 0.35, stroke: C.blue });
        var grip = S("rect", { x: X0 + v[1] * U - 7, y: y, width: 10, height: H, fill: C.blue, opacity: 0.8, rx: 2 }, svg);
        T(svg, X0 + v[0] * U + 6, y + H / 2, "[" + v[0] + "," + v[1] + "]", { anchor: "start", size: 9.5, weight: 600 });
        bar.style.cursor = "grab"; grip.style.cursor = "ew-resize";
        bar.addEventListener("pointerdown", function (e) { drag = { i: i, mode: "move", x: e.clientX, v: v.slice() }; e.preventDefault(); });
        grip.addEventListener("pointerdown", function (e) { drag = { i: i, mode: "size", x: e.clientX, v: v.slice() }; e.preventDefault(); });
        focusable(bar, "interval " + v[0] + " to " + v[1] + "; arrows move it, shift+arrows resize it", function () {});
        bar.addEventListener("keydown", function (e) {
          var d = e.key === "ArrowLeft" ? -1 : e.key === "ArrowRight" ? 1 : 0; if (!d) return;
          e.preventDefault();
          if (e.shiftKey) v[1] = Math.max(v[0] + 1, Math.min(16, v[1] + d));
          else if (v[0] + d >= 0 && v[1] + d <= 16) { v[0] += d; v[1] += d; }
          render(); var again = svg.querySelectorAll("[role=button]")[i]; if (again) again.focus();
        });
      });
      var y0 = 50 + ivs.length * (H + 4) + 10;
      svg.setAttribute("viewBox", "0 0 760 " + Math.round(y0 + 176));
      RULES.concat([["optimum (every subset)", null]]).forEach(function (r, q) {
        var took = q < 3 ? res[q] : opt, y = y0 + q * 44, good = took.length === opt.length;
        T(svg, 8, y + 6, r[0] + ": " + took.length, { anchor: "start", size: 11, weight: 700, fill: q === 3 ? C.teal : good ? C.green : C.pink, mono: false });
        took.forEach(function (i) { rect(svg, X0 + ivs[i][0] * U + 1.5, y + 14, (ivs[i][1] - ivs[i][0]) * U - 3, 14, { rx: 3, fill: q === 3 ? C.teal : good ? C.green : C.pink, op: 0.55, stroke: "none" }); });
      });
      var losers = RULES.filter(function (r, q) { return res[q].length < opt.length; }).map(function (r) { return r[0]; });
      f.say(losers.length ? "Here " + losers.join(" and ") + " fall" + (losers.length === 1 ? "s" : "") + " short of the optimum. Earliest finish never does." : "All three agree with the optimum on this input. Drag the bars until two of them disagree.");
    }
    svg.addEventListener("pointermove", function (e) {
      if (!drag) return;
      var pt = svg.getBoundingClientRect(), d = Math.round((e.clientX - drag.x) * 760 / pt.width / U), v = ivs[drag.i];
      if (drag.mode === "move") { var len = drag.v[1] - drag.v[0], s = Math.max(0, Math.min(16 - len, drag.v[0] + d)); v[0] = s; v[1] = s + len; }
      else v[1] = Math.max(v[0] + 1, Math.min(16, drag.v[1] + d));
      render();
    });
    window.addEventListener("pointerup", function () { drag = null; });
    presetRow(f, Object.keys(PRE), function (i) { ivs = PRE[Object.keys(PRE)[i]].map(function (x) { return x.slice(); }); render(); });
    f.btn("random", function () { var n = 4 + rnd(4); ivs = []; for (var i = 0; i < n; i++) { var s = rnd(14); ivs.push([s, Math.min(16, s + 1 + rnd(6))]); } render(); });
    f.btn("add", function () { if (ivs.length < 9) { var s = rnd(13); ivs.push([s, s + 2]); render(); } });
    f.btn("remove last", function () { if (ivs.length > 1) { ivs.pop(); render(); } });
    render();
  };

  /* ------------------------------------------------------------------------
     dsaExchange — ch23 §2. Start from an optimum that is not greedy's and
     replace its first disagreement with greedy's interval until they match.
     ------------------------------------------------------------------------ */
  VIZ.dsaExchange = function (el) {
    var f = frame(el);
    var INST = [{ name: "the chapter's five", ivs: [[0, 3], [1, 4], [4, 8], [6, 10], [11, 14]], O: [[1, 4], [6, 10], [11, 14]] },
      { name: "a longer one", ivs: [[0, 2], [1, 3], [2, 5], [3, 6], [5, 8], [6, 9], [8, 11], [10, 12], [11, 14]], O: [[1, 3], [3, 6], [6, 9], [10, 12], [12, 16]] }];
    INST[1].ivs.push([12, 16]);
    var ii = 0, tr = [];
    function build() {
      var I = INST[ii], G = greedyBy(I.ivs, function (v) { return v[1]; }).map(function (i) { return I.ivs[i]; }), O = I.O.map(function (x) { return x.slice(); });
      tr = [{ O: O.map(function (x) { return x.slice(); }), G: G, r: -1 }];
      for (var r = 0; r < O.length; r++) {
        if (O[r][0] === G[r][0] && O[r][1] === G[r][1]) continue;
        var old = O[r]; O[r] = G[r].slice();
        var legal = O.every(function (a, i) { return O.every(function (b, j) { return i === j || !overlaps(a, b); }); });
        tr.push({ O: O.map(function (x) { return x.slice(); }), G: G, r: r, old: old, legal: legal });
      }
    }
    var svg = svgOf(f, 300, "exchange argument: an optimum swapped toward greedy");
    function draw(k) {
      clear(svg);
      var s = tr[k], U = 44, X0 = 30;
      T(svg, 8, 14, INST[ii].name + " · exchange " + k + " of " + (tr.length - 1), { anchor: "start", size: 12.5, weight: 700 });
      for (var t = 0; t <= 16; t += 2) { line(svg, X0 + t * U, 26, X0 + t * U, 190, { stroke: C.line, dash: "2 5" }); T(svg, X0 + t * U, 30, String(t), { size: 9, fill: C.faint }); }
      function band(y, set, label, col, hl) {
        T(svg, 8, y - 6, label, { anchor: "start", size: 10.5, weight: 700, fill: col, mono: false });
        set.forEach(function (v, i) {
          rect(svg, X0 + v[0] * U, y, (v[1] - v[0]) * U, 22, { rx: 4, fill: i === hl ? C.orange : col, op: i === hl ? 0.7 : 0.4, stroke: i === hl ? C.orange : "none", sw: 2 });
          T(svg, X0 + v[0] * U + (v[1] - v[0]) * U / 2, y + 11, "[" + v[0] + "," + v[1] + "]", { size: 10, weight: 600 });
        });
      }
      band(60, s.G, "greedy G (earliest finish)", C.green, -1);
      band(130, s.O, k === 0 ? "an optimum O" : "O after " + k + " swap" + (k === 1 ? "" : "s"), C.blue, s.r);
      var same = s.O.every(function (v, i) { return v[0] === s.G[i][0] && v[1] === s.G[i][1]; });
      if (k === 0) say(svg, 214, "O keeps " + s.O.length + " intervals, as many as greedy. Find the first position where they differ.");
      else say(svg, 214, "position " + (s.r + 1) + ": swap [" + s.old.join(",") + "] for greedy's [" + s.O[s.r].join(",") + "], which finishes no later — so it cannot hit O's next interval", C.orange);
      if (k > 0) T(svg, 8, 238, "still legal: " + (s.legal ? "yes" : "NO") + " · still " + s.O.length + " intervals: the swap made nothing worse", { anchor: "start", size: 12, weight: 700, fill: s.legal ? C.green : C.pink, mono: false });
      if (same) T(svg, 8, 262, "O has become G, and every step kept an optimum. So G is optimal: that is the whole proof.", { anchor: "start", size: 12, weight: 700, fill: C.green, mono: false });
    }
    K.tabs(f.controls, INST.map(function (x) { return x.name; }), 0, function (k) { ii = k; build(); sp.reload(); });
    var sp = stepper(f, function () { return tr.length - 1; }, draw);
    build(); draw(0);
    f.say("Take any optimal answer. Swap it one step toward greedy, and confirm it did not get worse; repeat until there is nothing left to swap.");
  };

  /* ------------------------------------------------------------------------
     dsaHuffman — ch23 §5, huffman_codes: a heap on (frequency, tick), the
     first pop becomes the 0 branch.
     ------------------------------------------------------------------------ */
  VIZ.dsaHuffman = function (el) {
    var f = frame(el);
    var PRE = [["a:45 b:13 c:12 d:16 e:9 f:5", "the chapter's six"], ["a:10 b:10 c:10 d:10 e:10 f:10", "uniform"], ["a:1000 b:1 c:1 d:1 e:1", "one dominant"]];
    var freq = [], tr = [];
    function parse(s) {
      var out = [];
      s.split(/[\s,]+/).filter(Boolean).forEach(function (p) { var m = /^([^:]+):(\d+)$/.exec(p); if (m && +m[2] > 0) out.push([m[1].slice(0, 3), +m[2]]); });
      return out.length >= 2 && out.length <= 8 ? out : null;
    }
    function build() {
      var tick = 0, heap = freq.map(function (x) { return { f: x[1], t: tick++, sym: x[0] }; });
      function sortH() { heap.sort(function (a, b) { return a.f - b.f || a.t - b.t; }); }
      sortH();
      tr = [{ roots: heap.slice() }];
      while (heap.length > 1) {
        var l = heap.shift(), r = heap.shift(), nd = { f: l.f + r.f, t: tick++, l: l, r: r };
        heap.push(nd); sortH();
        tr.push({ roots: heap.slice(), merged: nd });
      }
    }
    function leaves(nd) { return nd.sym !== undefined ? 1 : leaves(nd.l) + leaves(nd.r); }
    function codes(nd, path, out) { if (nd.sym !== undefined) out[nd.sym] = path || "0"; else { codes(nd.l, path + "0", out); codes(nd.r, path + "1", out); } return out; }
    var svg = svgOf(f, 380, "Huffman merge forest and codes");
    function draw(k) {
      clear(svg);
      var s = tr[k], total = freq.reduce(function (a, x) { return a + x[1]; }, 0), nl = freq.length, W = 720 / nl, done = k === tr.length - 1;
      T(svg, 8, 14, "merge " + k + " of " + (tr.length - 1) + " · " + s.roots.length + " tree" + (s.roots.length === 1 ? "" : "s") + " in the heap", { anchor: "start", size: 12.5, weight: 700 });
      var slot = 0, maxD = 0;
      function lay(nd, d) { maxD = Math.max(maxD, d); if (nd.sym !== undefined) { nd.x = slot++; nd.d = d; return; } lay(nd.l, d + 1); lay(nd.r, d + 1); nd.x = (nd.l.x + nd.r.x) / 2; nd.d = d; }
      s.roots.forEach(function (r) { lay(r, 0); });
      var H = Math.min(46, 210 / Math.max(1, maxD)), px = function (nd) { return 20 + nd.x * W + W / 2; }, py = function (nd) { return 44 + nd.d * H; };
      function paint(nd) {
        if (nd.sym === undefined) {
          [[nd.l, "0"], [nd.r, "1"]].forEach(function (c) {
            line(svg, px(nd), py(nd) + 11, px(c[0]), py(c[0]) - 11, { stroke: C.line });
            T(svg, (px(nd) + px(c[0])) / 2 + (c[1] === "0" ? -7 : 7), (py(nd) + py(c[0])) / 2, c[1], { size: 9, fill: C.blue, weight: 700 });
            paint(c[0]);
          });
        }
        var isNew = nd === s.merged;
        S("circle", { cx: px(nd), cy: py(nd), r: 11, fill: nd.sym !== undefined ? C.teal : isNew ? C.orange : C.card, opacity: nd.sym !== undefined ? 0.4 : isNew ? 0.5 : 1, stroke: isNew ? C.orange : C.line, "stroke-width": isNew ? 2 : 1 }, svg);
        T(svg, px(nd), py(nd), nd.sym !== undefined ? nd.sym : String(nd.f), { size: 10, weight: 700 });
        if (nd.sym !== undefined) T(svg, px(nd), py(nd) + 21, String(nd.f), { size: 9, fill: C.faint });
      }
      s.roots.forEach(paint);
      if (s.merged) say(svg, 290, "popped the two smallest, " + s.merged.l.f + " and " + s.merged.r.f + ", and pushed their sum " + s.merged.f, C.orange);
      else say(svg, 290, "Every character starts as its own tree. Step: pop the two smallest, push one node.");
      if (done) {
        var cd = codes(s.roots[0], "", {}), bits = 0, fixed = Math.max(1, Math.ceil(Math.log2(nl)));
        freq.forEach(function (x) { bits += x[1] * cd[x[0]].length; });
        T(svg, 8, 316, "codes: " + freq.map(function (x) { return x[0] + "=" + cd[x[0]]; }).join("  "), { anchor: "start", size: 11, weight: 600 });
        T(svg, 8, 340, "total " + commas(bits) + " bits against " + commas(total * fixed) + " for a fixed " + fixed + "-bit code (" + Math.round(100 - 100 * bits / (total * fixed)) + "% smaller)", { anchor: "start", size: 12, weight: 700, fill: C.green, mono: false });
      }
      T(svg, 8, 366, "a leaf's depth is its code length; no code is a prefix of another because every character is a leaf", { anchor: "start", size: 9.5, fill: C.faint, mono: false });
    }
    presetRow(f, PRE.map(function (p) { return p[1]; }), function (i) { freq = parse(PRE[i][0]); inp.value = PRE[i][0]; build(); sp.reload(); });
    var inp = D.input(f.controls, PRE[0][0], "symbol:frequency pairs", "18em", function (v) {
      var p = parse(v); if (!p) { f.say("Two to eight pairs like a:45 b:13, then Enter."); return; }
      freq = p; build(); sp.reload(); f.say("Step the merges, then read the code lengths off the depths.");
    });
    var sp = stepper(f, function () { return tr.length - 1; }, draw);
    freq = parse(PRE[0][0]); build(); draw(0);
    f.say("Merge the two smallest, repeatedly. Then pick 'one dominant' and watch that character's code fall to one bit.");
  };

  /* ------------------------------------------------------------------------
     dsaGreedyCoins — ch23 §8: greedy_coins against the coin-change table,
     and first_counterexample's Kozen–Zaks bound.
     ------------------------------------------------------------------------ */
  VIZ.dsaGreedyCoins = function (el) {
    var f = frame(el);
    var PRE = [[1, 5, 10, 25], [1, 3, 4], [1, 7, 10], [1, 15, 25]], coins = [1, 3, 4], amt = 6;
    function greedy(a) { var used = [], cs = coins.slice().sort(function (x, y) { return y - x; }); cs.forEach(function (c) { while (a >= c) { used.push(c); a -= c; } }); return a === 0 ? used : null; }
    function dp(A) {
      var best = [[]]; for (var a = 1; a <= A; a++) { best.push(null); coins.forEach(function (c) { if (c <= a && best[a - c] && (!best[a] || best[a - c].length + 1 < best[a].length)) best[a] = best[a - c].concat([c]); }); }
      return best;
    }
    var svg = svgOf(f, 300, "greedy coins against the optimum");
    function render() {
      clear(svg);
      var s = coins.slice().sort(function (a, b) { return a - b; }), bound = s.length >= 2 ? s[s.length - 1] + s[s.length - 2] : s[0], top = Math.max(bound, amt, 20), opt = dp(top);
      var g = greedy(amt), o = opt[amt], first = null;
      for (var a = 1; a < bound; a++) { var ga = greedy(a); if (opt[a] && (!ga || ga.length > opt[a].length)) { first = a; break; } }
      T(svg, 8, 14, "coins {" + s.join(", ") + "} · amount " + amt, { anchor: "start", size: 12.5, weight: 700 });
      function chips(y, used, label, col) {
        T(svg, 8, y + 14, label, { anchor: "start", size: 11, weight: 700, fill: col, mono: false });
        if (!used) { T(svg, 170, y + 14, "stuck: no coin fits what is left", { anchor: "start", size: 11, fill: C.pink, mono: false }); return; }
        used.slice(0, 16).forEach(function (c, i) { S("circle", { cx: 186 + i * 36, cy: y + 14, r: 15, fill: col, opacity: 0.3, stroke: col }, svg); T(svg, 186 + i * 36, y + 14, String(c), { size: 11, weight: 700 }); });
        T(svg, 752, y + 14, used.length + " coin" + (used.length === 1 ? "" : "s"), { anchor: "end", size: 12, weight: 700, fill: col });
      }
      var wrong = o && (!g || g.length > o.length);
      chips(34, g, "greedy", wrong ? C.pink : C.green);
      chips(74, o, "optimum (table)", C.teal);
      /* every amount below the bound */
      T(svg, 8, 136, "amounts 1 … " + (bound - 1) + " (Kozen–Zaks: a first failure, if any, is below " + s[s.length - 1] + " + " + s[s.length - 2] + " = " + bound + ")", { anchor: "start", size: 10, fill: C.faint, mono: false });
      var W = Math.min(40, 720 / Math.max(1, bound - 1));
      for (a = 1; a < bound; a++) {
        var gg = greedy(a), bad = opt[a] && (!gg || gg.length > opt[a].length);
        var cell = rect(svg, 20 + (a - 1) * W, 146, W - 2, 26, { rx: 3, fill: bad ? C.pink : C.green, op: a === amt ? 0.7 : 0.25, stroke: a === amt ? C.text : "none", sw: 2 });
        (function (v) { function pick() { amt = v; sl.set(v); render(); } cell.addEventListener("click", pick); focusable(cell, "amount " + v, pick); })(a);
        if (W >= 16) T(svg, 20 + (a - 1) * W + W / 2 - 1, 159, String(a), { size: 9, weight: 600 });
      }
      T(svg, 8, 200, first ? "first counterexample: " + first + " — greedy " + greedy(first).length + " coins, optimum " + opt[first].length : "canonical: greedy is optimal at every amount, so at every amount at all",
        { anchor: "start", size: 12, weight: 700, fill: first ? C.pink : C.green, mono: false });
      T(svg, 8, 226, "pink: greedy uses more coins than it needs · click an amount in the strip, or drag the slider", { anchor: "start", size: 9.5, fill: C.faint, mono: false });
    }
    presetRow(f, PRE.map(function (p) { return "{" + p.join(",") + "}"; }), function (i) { coins = PRE[i].slice(); inp.value = coins.join(", "); render(); });
    var inp = D.input(f.controls, coins.join(", "), "coin set, comma separated", "10em", function (v) {
      var xs = v.split(/[\s,]+/).filter(Boolean).map(Number);
      if (xs.length && xs.length <= 6 && xs.every(function (x) { return x >= 1 && x <= 60 && x === Math.floor(x); })) { coins = xs.filter(function (x, i) { return xs.indexOf(x) === i; }); render(); }
      else f.say("One to six whole coins from 1 to 60, comma separated, then Enter.");
    });
    var sl = K.slider(f.controls, "amount", 1, 60, amt, 1, String, function (v) { amt = v; render(); });
    render();
    f.say("Greedy takes the biggest coin that fits. Find the smallest coin set and amount where that is a mistake.");
  };
})();
