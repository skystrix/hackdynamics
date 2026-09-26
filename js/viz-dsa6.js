/* ==========================================================================
   viz-dsa6.js — DSA By Patterns machines, Part 4 (Hierarchies and Ranges,
   ch24–31).

     dsaTraversal      ch24 Stepper    pre/in/post/level/Morris, recursive or iterative, stack shown
     dsaTreeDP         ch25 Stepper    tuples returned upward, the accumulator on the side
     dsaValidateBST    ch25 Comparator the parent-child check against the carried range
     dsaRerooting      ch25 Stepper    sum of distances for every root in two passes
     dsaBSTDegenerate  ch26 Builder    height against n and log n, by insertion order
     dsaRotations      ch26 Stepper    rotate at any node; the four AVL cases
     dsaTreeFamily     ch26 Comparator AVL, red-black, treap and B-tree on the same 31 keys
     dsaBTreeFanout    ch26 Tuner      fanout against height for n keys
     dsaHeap           ch27 Builder    array and tree at once; build-heap against n inserts
     dsaTrie           ch28 Builder    insert, search, starts-with, delete; radix compression
     dsaBinaryLifting  ch29 Builder    the up table and a query's jumps
     dsaRangeTradeoff  ch30 Comparator seven structures on the update/query plane, by workload
     dsaSegTree        ch31 Builder    covering and partial nodes of a query, per level
     dsaLazyProp       ch31 Stepper    range add/assign leaving tags, pushed down on demand
     dsaMosAlgorithm   ch31 Stepper    arrival order against Mo's order, pointer moves counted

   Routines are the chapters' own (inorder, level_order, Morris, check,
   max_path_sum, mwis, is_bst, reroot, rotate_left/right, sift_up/down,
   Trie, build/lca, SegTree, _apply/_push). Needs viz-rag-kit.js and
   viz-dsa1.js.
   ========================================================================== */

(function () {
  "use strict";
  window.VIZ = window.VIZ || {};
  var K = window.RAGKIT, D = window.DSAKIT;
  if (!K || !D) throw new Error("viz-dsa6.js needs viz-rag-kit.js and viz-dsa1.js loaded first");
  var C = K.C, S = K.S, T = K.T, rect = K.rect, line = K.line, frame = K.frame;
  var clear = D.clear, commas = D.commas, stepper = D.stepper, row = D.row, lcg = D.lcg, boxes = D.boxes, focusable = D.focusable, wrap = D.wrap;

  function svgOf(f, h, label) { return S("svg", { viewBox: "0 0 760 " + h, width: "100%", role: "img", "aria-label": label }, f.body); }
  function say(svg, y, msg, col) { return T(svg, 8, y, msg, { anchor: "start", size: 11.5, mono: false, fill: col || C.text }); }
  function presetRow(f, list, fn) {
    var r = row(f.controls);
    list.forEach(function (p, i) { var b = document.createElement("button"); b.type = "button"; b.textContent = p; b.addEventListener("click", function () { fn(i); }); r.appendChild(b); });
    return r;
  }

  /* ---- binary trees: {v, left, right}; built from level-order arrays ---- */
  function fromLevel(arr) {
    if (!arr.length || arr[0] === null) return null;
    var nodes = arr.map(function (v, i) { return v === null ? null : { v: v, i: i, left: null, right: null }; });
    var kids = nodes.slice(1).reverse();
    nodes.forEach(function (n) { if (!n) return; n.left = kids.pop() || null; n.right = kids.pop() || null; });
    return nodes[0];
  }
  function walk(n, fn) { if (!n) return; walk(n.left, fn); fn(n); walk(n.right, fn); }
  function all(n) { var out = []; walk(n, function (x) { out.push(x); }); return out; }
  /* Place nodes by inorder rank and depth inside a box; returns maxDepth. */
  function layout(root) {
    var i = 0, maxD = 0;
    (function go(n, d) { if (!n) return; go(n.left, d + 1); n.x = i++; n.d = d; if (d > maxD) maxD = d; go(n.right, d + 1); })(root, 0);
    return { count: i, maxD: maxD };
  }
  /* Draw a laid-out binary tree. st(n) -> {fill, op, stroke, sw, label, sub, subCol}. */
  function drawBin(svg, root, box, st, extraEdges) {
    var L = layout(root), W = box.w / Math.max(1, L.count), H = L.maxD ? Math.min(box.hmax || 56, box.h / L.maxD) : 0;
    var px = function (n) { return box.x + n.x * W + W / 2; }, py = function (n) { return box.y + n.d * H; };
    var r = Math.max(7, Math.min(15, W / 2.6));
    walk(root, function (n) { [n.left, n.right].forEach(function (c) { if (c) line(svg, px(n), py(n), px(c), py(c), { stroke: C.line, sw: 1.3 }); }); });
    (extraEdges || []).forEach(function (e) { S("path", { d: "M " + px(e[0]) + " " + py(e[0]) + " Q " + (px(e[0]) + px(e[1])) / 2 + " " + (Math.max(py(e[0]), py(e[1])) + 30) + " " + px(e[1]) + " " + (py(e[1]) + r), fill: "none", stroke: C.orange, "stroke-width": 2, "stroke-dasharray": "5 3" }, svg); });
    walk(root, function (n) {
      var s = st ? st(n) || {} : {};
      S("circle", { cx: px(n), cy: py(n), r: r, fill: s.fill || C.card, opacity: s.op == null ? 1 : s.op, stroke: s.stroke || C.line, "stroke-width": s.sw || 1.2 }, svg);
      T(svg, px(n), py(n) + 0.5, s.label !== undefined ? s.label : String(n.v), { size: r > 11 ? 11 : 9.5, weight: 700 });
      if (s.sub !== undefined) T(svg, px(n), py(n) + r + 9, s.sub, { size: 8.5, fill: s.subCol || C.dim, weight: 600 });
    });
    return { px: px, py: py, r: r };
  }
  function height(n) { return n ? 1 + Math.max(height(n.left), height(n.right)) : 0; }

  /* ------------------------------------------------------------------------
     dsaTraversal — ch24 §2–5. Recursive orders show their call stack;
     iterative ones show the explicit stack (postorder is the chapter's
     reverse-preorder trick); level order its queue; Morris its threads.
     ------------------------------------------------------------------------ */
  VIZ.dsaTraversal = function (el) {
    var f = frame(el);
    var TREES = [["seven-node", [1, 2, 3, 4, 5, 6, 7]], ["left chain", [5, 4, null, 3, null, 2, null, 1]], ["lopsided", [1, 2, 3, 4, null, 5, 6, null, 7, null, null, 8, 9]]];
    var ORD = ["preorder", "inorder", "postorder", "level order", "Morris inorder"];
    var ti = 0, oi = 1, iter = false, root = null, tr = [];
    function build() {
      root = fromLevel(TREES[ti][1]);
      var out = [], ev = [];
      function snap(cur, stk, msg, extra) { ev.push(Object.assign({ cur: cur, stk: stk.slice(), out: out.slice(), msg: msg }, extra || {})); }
      snap(null, [], "Press step.");
      if (oi === 3) {
        var q = [root];
        snap(null, q.map(function (n) { return n.v; }), "the queue starts with the root");
        while (q.length) {
          var n = q.shift(); out.push(n.v);
          if (n.left) q.push(n.left); if (n.right) q.push(n.right);
          snap(n, q.map(function (x) { return x.v; }), "dequeue " + n.v + ", visit it, enqueue its children");
        }
      } else if (oi === 4) {
        var cur = root, threads = [], th = 0;
        while (cur) {
          if (!cur.left) { out.push(cur.v); snap(cur, [], "no left child: visit " + cur.v + ", go right" + (cur.right && threads.some(function (t) { return t[0] === cur; }) ? " — along a thread, back up" : ""), { threads: threads.slice(), th: th }); cur = cur.right; }
          else {
            var pre = cur.left; while (pre.right && pre.right !== cur) pre = pre.right;
            if (!pre.right) { pre.right = cur; threads.push([pre, cur]); th++; snap(cur, [], "thread: " + pre.v + ".right → " + cur.v + " (its inorder successor), then go left", { threads: threads.slice(), th: th, made: true }); cur = cur.left; }
            else { pre.right = null; threads = threads.filter(function (t) { return t[0] !== pre; }); th++; out.push(cur.v); snap(cur, [], "back at " + cur.v + " by the thread: remove it, visit " + cur.v + ", go right", { threads: threads.slice(), th: th }); cur = cur.right; }
          }
        }
        snap(null, [], "done, and every thread has been removed: the tree is as it was. No stack at all.", { threads: [], th: th });
      } else if (!iter) {
        var frames = [];
        (function rec(n) {
          if (!n) return;
          frames.push(n.v); snap(n, frames, "call " + ORD[oi].slice(0, -5) + "(" + n.v + ")");
          if (oi === 0) { out.push(n.v); snap(n, frames, "visit " + n.v + " before its subtrees"); }
          rec(n.left);
          if (oi === 1) { out.push(n.v); snap(n, frames, "visit " + n.v + " between its subtrees"); }
          rec(n.right);
          if (oi === 2) { out.push(n.v); snap(n, frames, "visit " + n.v + " after both subtrees"); }
          frames.pop(); snap(n, frames, "return from " + n.v);
        })(root);
      } else if (oi === 0) {
        var st = [root];
        snap(null, [root.v], "push the root");
        while (st.length) { var m = st.pop(); out.push(m.v); if (m.right) st.push(m.right); if (m.left) st.push(m.left); snap(m, st.map(function (x) { return x.v; }), "pop " + m.v + ", visit, push right then left"); }
      } else if (oi === 1) {
        var s2 = [], c = root;
        while (s2.length || c) {
          while (c) { s2.push(c); snap(c, s2.map(function (x) { return x.v; }), "dive left: push " + c.v); c = c.left; }
          c = s2.pop(); out.push(c.v); snap(c, s2.map(function (x) { return x.v; }), "pop " + c.v + " and visit it, then its right subtree");
          c = c.right;
        }
      } else {
        var s3 = [root], rev = [];
        snap(null, [root.v], "reverse-preorder trick: root, right, left — then reverse");
        while (s3.length) { var p = s3.pop(); rev.push(p.v); out = rev.slice(); if (p.left) s3.push(p.left); if (p.right) s3.push(p.right); snap(p, s3.map(function (x) { return x.v; }), "pop " + p.v + ", record it, push left then right"); }
        out = rev.slice().reverse(); snap(null, [], "reverse the recorded list: that is postorder");
      }
      tr = ev;
    }
    var svg = svgOf(f, 300, "tree traversal with its stack or queue");
    function draw(k) {
      clear(svg);
      var s = tr[k], morris = oi === 4;
      T(svg, 8, 14, ORD[oi] + (oi < 3 ? (iter ? " · iterative, explicit stack" : " · recursive, call stack") : oi === 3 ? " · queue" : " · O(1) extra space") + " · step " + k + " of " + (tr.length - 1), { anchor: "start", size: 12, weight: 700 });
      var threads = (s.threads || []);
      var visited = {}; s.out.forEach(function (v) { visited[v] = 1; });
      drawBin(svg, root, { x: 10, y: 44, w: 470, h: 170 }, function (n) {
        return { fill: n === s.cur ? C.blue : visited[n.v] ? C.green : C.card, op: n === s.cur ? 0.45 : visited[n.v] ? 0.3 : 1, stroke: n === s.cur ? C.blue : C.line, sw: n === s.cur ? 2.5 : 1.2 };
      }, threads);
      var RX = 510;
      T(svg, RX, 40, morris ? "threads live now: " + threads.length : oi === 3 ? "queue (front → back)" : iter ? "stack (bottom → top)" : "call stack (bottom → top)", { anchor: "start", size: 10, fill: C.faint, mono: false });
      if (morris) T(svg, RX, 62, "pointer writes so far: " + s.th, { anchor: "start", size: 11, weight: 600 });
      else s.stk.forEach(function (v, j) { rect(svg, RX + (j % 6) * 40, 50 + Math.floor(j / 6) * 34, 34, 28, { rx: 5, fill: C.card, stroke: j === s.stk.length - 1 ? C.orange : C.line }); T(svg, RX + 17 + (j % 6) * 40, 64 + Math.floor(j / 6) * 34, String(v), { size: 12, weight: 700 }); });
      T(svg, 8, 236, "output: " + (s.out.length ? s.out.join(" ") : "—"), { anchor: "start", size: 13, weight: 700, fill: C.green });
      say(svg, 262, s.msg, s.made ? C.orange : C.text);
      T(svg, 8, 286, morris ? "dashed orange: a temporary thread from a node's inorder predecessor back up to it" : "blue: the node being handled · green: already visited", { anchor: "start", size: 9.5, fill: C.faint, mono: false });
    }
    K.tabs(f.controls, ORD, oi, function (k) { oi = k; build(); sp.reload(); });
    K.toggle(f.controls, "iterative", iter, function (on) { iter = on; build(); sp.reload(); });
    K.tabs(f.controls, TREES.map(function (t) { return t[0]; }), 0, function (k) { ti = k; build(); sp.reload(); });
    var sp = stepper(f, function () { return tr.length - 1; }, draw);
    build(); draw(0);
    f.say("Pick an order and step; the panel on the right is the stack or queue doing the work. Run Morris and find the moment a node's right pointer points back up the tree.");
  };

  /* ------------------------------------------------------------------------
     dsaTreeDP — ch25 §1–3, §6. Postorder; each node's return value is
     written under it, the accumulator sits top right.
     ------------------------------------------------------------------------ */
  VIZ.dsaTreeDP = function (el) {
    var f = frame(el);
    var PROB = ["height", "balanced", "diameter", "max path sum", "independent set"];
    var TREES = [["diameter misses the root", [8, 3, 9, 1, 6, null, null, 4, null, 2, 7, 5, null, null, null, null, 10]],
      ["the chapter's max-path tree", [-10, 9, 20, null, null, 15, 7]], ["a path", [4, 1, null, 5, null, 2, null, 6]], ["random", null]];
    var pi = 2, ti = 0, root = null, tr = [], rnd = lcg(12);
    function randTree() { var arr = [3 + rnd(7)]; for (var i = 1; i < 12; i++) arr.push(rnd(4) === 0 ? null : rnd(19) - 9); return arr; }
    function build() {
      root = fromLevel(TREES[ti][1] || randTree());
      var ev = [], acc = pi === 2 ? 0 : pi === 3 ? -Infinity : null, ret = new Map();
      function snap(n, msg) { ev.push({ n: n, ret: new Map(ret), acc: acc, msg: msg }); }
      snap(null, "Postorder: a node computes only after both children have returned.");
      var fin = (function go(n) {
        if (!n) return pi === 4 ? [0, 0] : 0;
        var l = go(n.left), r = go(n.right), out, msg;
        if (pi === 0) { out = 1 + Math.max(l, r); msg = "height " + out + " = 1 + max(" + l + ", " + r + ")"; }
        else if (pi === 1) { out = l === -1 || r === -1 || Math.abs(l - r) > 1 ? -1 : 1 + Math.max(l, r); msg = out === -1 ? (l === -1 || r === -1 ? "a child already failed: return −1" : "heights " + l + " and " + r + " differ by more than 1: return −1") : "balanced here: return height " + out; }
        else if (pi === 2) { var turn = l + r; if (turn > acc) acc = turn; out = 1 + Math.max(l, r); msg = "path turning here: " + l + " + " + r + " = " + turn + " edges, to the accumulator; return height " + out; }
        else if (pi === 3) { var lc = Math.max(0, l), rc = Math.max(0, r), t2 = n.v + lc + rc; if (t2 > acc) acc = t2; out = n.v + Math.max(lc, rc); msg = "turning path " + n.v + " + " + lc + " + " + rc + " = " + t2 + " to the side; return downward " + out + (l < 0 || r < 0 ? " (a losing child clamped to 0)" : ""); }
        else { var take = n.v + l[1] + r[1], skip = Math.max(l[0], l[1]) + Math.max(r[0], r[1]); out = [take, skip]; msg = "take " + n.v + ": " + take + " (children skipped) · skip: " + skip + " (children free)"; }
        ret.set(n, out); snap(n, msg); return out;
      })(root);
      var ans = pi === 0 ? fin : pi === 1 ? (fin !== -1 ? "balanced" : "not balanced") : pi === 4 ? Math.max(fin[0], fin[1]) : acc;
      ev.push({ n: null, ret: new Map(ret), acc: acc, msg: "answer: " + ans + (pi === 2 || pi === 3 ? " — read from the accumulator, not from the root's return" : ""), done: true });
      tr = ev;
    }
    function fmt(v) { return Array.isArray(v) ? "(" + v[0] + "," + v[1] + ")" : String(v); }
    var svg = svgOf(f, 310, "tree DP: returned tuples and the accumulator");
    function draw(k) {
      clear(svg);
      var s = tr[k];
      T(svg, 8, 14, PROB[pi] + " · " + TREES[ti][0] + " · step " + k + " of " + (tr.length - 1), { anchor: "start", size: 12, weight: 700 });
      var accLabel = pi === 2 ? "longest turning path (edges)" : pi === 3 ? "best turning path" : null;
      if (accLabel) { rect(svg, 520, 26, 232, 44, { rx: 6, fill: C.card, stroke: C.orange, sw: 2 }); T(svg, 636, 38, accLabel, { size: 9.5, fill: C.faint, mono: false }); T(svg, 636, 56, s.acc === -Infinity ? "−∞" : String(s.acc), { size: 16, weight: 700, fill: C.orange }); }
      drawBin(svg, root, { x: 10, y: 90, w: 740, h: 140, hmax: 44 }, function (n) {
        var has = s.ret.has(n);
        return { fill: n === s.n ? C.blue : has ? C.teal : C.card, op: n === s.n ? 0.45 : has ? 0.25 : 1, stroke: n === s.n ? C.blue : C.line, sw: n === s.n ? 2.5 : 1.2,
          sub: has ? "↑" + fmt(s.ret.get(n)) : undefined, subCol: C.teal };
      });
      say(svg, 276, s.msg, s.done ? C.green : C.text);
      T(svg, 8, 298, pi === 2 || pi === 3 ? "return what composes (a downward path), record what does not (a path that has already turned)" : pi === 4 ? "each node returns (best if taken, best if skipped)" : "each node returns one number to its parent", { anchor: "start", size: 9.5, fill: C.faint, mono: false });
    }
    K.tabs(f.controls, PROB, pi, function (k) { pi = k; build(); sp.reload(); });
    K.tabs(f.controls, TREES.map(function (t) { return t[0]; }), 0, function (k) { ti = k; build(); sp.reload(); });
    var sp = stepper(f, function () { return tr.length - 1; }, draw);
    build(); draw(0);
    f.say("Each node returns a small tuple upward; the box at the top is the running global answer. On diameter, step to the end and find where the longest path turns: not at the root.");
  };

  /* ------------------------------------------------------------------------
     dsaValidateBST — ch25 §5. The local parent-child test, is_bst's range
     carried down, and the inorder sequence. Click a node to change its key.
     ------------------------------------------------------------------------ */
  VIZ.dsaValidateBST = function (el) {
    var f = frame(el);
    var PRE = [["the chapter's three", [5, 3, null, null, 6]], ["a real BST", [8, 4, 12, 2, 6, 10, 14]], ["deeper trap", [10, 5, 15, 2, 7, 12, 20, null, null, 6, 11]]];
    var arr = PRE[0][1].slice(), root = null, mode = 1;
    var svg = S("svg", { viewBox: "0 0 760 300", width: "100%", role: "group", "aria-label": "BST validation: local check against range check; click a node to change its key" }, f.body);
    function render() {
      clear(svg);
      root = fromLevel(arr);
      var local = true, range = true, info = new Map();
      (function go(n, lo, hi) {
        if (!n) return;
        var lok = (!n.left || n.left.v < n.v) && (!n.right || n.right.v > n.v), rok = lo < n.v && n.v < hi;
        if (!lok) local = false; if (!rok) range = false;
        info.set(n, { lok: lok, rok: rok, lo: lo, hi: hi });
        go(n.left, lo, n.v); go(n.right, n.v, hi);
      })(root, -Infinity, Infinity);
      var ino = all(root).map(function (n) { return n.v; }), inc = ino.every(function (v, i) { return !i || v > ino[i - 1]; });
      T(svg, 8, 14, "showing: " + (mode ? "the range each node inherits" : "each node against its own children"), { anchor: "start", size: 12, weight: 700 });
      var P = drawBin(svg, root, { x: 10, y: 50, w: 740, h: 150, hmax: 50 }, function (n) {
        var i = info.get(n), ok = mode ? i.rok : i.lok;
        var b = function (x) { return x === Infinity ? "∞" : x === -Infinity ? "−∞" : x; };
        return { fill: ok ? C.green : C.pink, op: 0.3, stroke: ok ? C.green : C.pink, sw: 2, sub: mode ? "(" + b(i.lo) + ", " + b(i.hi) + ")" : undefined };
      });
      all(root).forEach(function (n) {
        var hit = S("circle", { cx: P.px(n), cy: P.py(n), r: P.r, fill: "transparent" }, svg);
        function bump() { arr[n.i] = n.v >= 20 ? 1 : n.v + 1; render(); }
        hit.addEventListener("click", bump); focusable(hit, "node " + n.v + ", click to add one", bump);
      });
      T(svg, 8, 232, "parent-child check: " + (local ? "VALID" : "invalid"), { anchor: "start", size: 12.5, weight: 700, fill: local ? C.green : C.pink, mono: false });
      T(svg, 280, 232, "range check: " + (range ? "VALID" : "invalid"), { anchor: "start", size: 12.5, weight: 700, fill: range ? C.green : C.pink, mono: false });
      T(svg, 500, 232, "inorder " + ino.join(" ") + (inc ? "" : " ✗"), { anchor: "start", size: 11, fill: inc ? C.dim : C.pink });
      T(svg, 8, 258, local !== range ? "They disagree: the local check passed a tree that is not a search tree. The broken constraint comes from a grandparent." : "They agree on this tree.", { anchor: "start", size: 11.5, mono: false, fill: local !== range ? C.pink : C.dim, weight: local !== range ? 700 : 400 });
      T(svg, 8, 282, "click a node to raise its key (wraps at 20)", { anchor: "start", size: 9.5, fill: C.faint, mono: false });
    }
    K.tabs(f.controls, ["local check", "range check"], mode, function (k) { mode = k; render(); });
    presetRow(f, PRE.map(function (p) { return p[0]; }), function (i) { arr = PRE[i][1].slice(); render(); });
    render();
    f.say("One check looks at neighbours, the other carries a range down. Find the smallest tree where they disagree, then change keys until they agree.");
  };

  /* ------------------------------------------------------------------------
     dsaRerooting — ch25 §7, the chapter's reroot(): pass 1 up (size, dp),
     pass 2 down (res[u] = res[p] − size[u] + (n − size[u])).
     ------------------------------------------------------------------------ */
  VIZ.dsaRerooting = function (el) {
    var f = frame(el);
    var TREES = [["ten nodes", [-1, 0, 0, 1, 1, 2, 2, 3, 5, 5]], ["a path of eight", [-1, 0, 1, 2, 3, 4, 5, 6]], ["a star of nine", [-1, 0, 0, 0, 0, 0, 0, 0, 0]]];
    var ti = 0, par = [], kids = [], order = [], tr = [];
    function build() {
      par = TREES[ti][1]; var n = par.length; kids = par.map(function () { return []; });
      par.forEach(function (p, v) { if (p >= 0) kids[p].push(v); });
      order = [0]; for (var i = 0; i < order.length; i++) kids[order[i]].forEach(function (w) { order.push(w); });
      var size = par.map(function () { return 1; }), dp = par.map(function () { return 0; }), res = par.map(function () { return null; });
      tr = [{ size: size.slice(), dp: dp.slice(), res: res.slice(), msg: "Pass 1 walks up from the leaves; pass 2 walks down from the root.", pass: 0 }];
      order.slice(1).reverse().forEach(function (u) {
        var p = par[u]; size[p] += size[u]; dp[p] += dp[u] + size[u];
        tr.push({ size: size.slice(), dp: dp.slice(), res: res.slice(), u: u, pass: 1, msg: "pass 1: fold " + u + " into its parent " + p + ": size[" + p + "] = " + size[p] + ", dp[" + p + "] += dp[" + u + "] + size[" + u + "] → " + dp[p] });
      });
      res[0] = dp[0];
      tr.push({ size: size.slice(), dp: dp.slice(), res: res.slice(), u: 0, pass: 2, msg: "res[0] = dp[0] = " + dp[0] + ": the root's answer, the slow honest way" });
      order.slice(1).forEach(function (u) {
        res[u] = res[par[u]] - size[u] + (n - size[u]);
        tr.push({ size: size.slice(), dp: dp.slice(), res: res.slice(), u: u, pass: 2, msg: "pass 2: res[" + u + "] = res[" + par[u] + "] − " + size[u] + " + " + (n - size[u]) + " = " + res[u] + " (" + size[u] + " nodes a step closer, " + (n - size[u]) + " a step farther)" });
      });
    }
    var svg = svgOf(f, 320, "rerooting: sum of distances for every node");
    function draw(k) {
      clear(svg);
      var s = tr[k], n = par.length, slot = 0, pos = [], dep = [];
      (function lay(v, d) { dep[v] = d; if (!kids[v].length) { pos[v] = slot++; return; } kids[v].forEach(function (w) { lay(w, d + 1); }); pos[v] = (pos[kids[v][0]] + pos[kids[v][kids[v].length - 1]]) / 2; })(0, 0);
      var md = Math.max.apply(null, dep), W = 560 / slot, H = Math.min(52, 190 / Math.max(1, md));
      var px = function (v) { return 20 + pos[v] * W + W / 2; }, py = function (v) { return 50 + dep[v] * H; };
      T(svg, 8, 14, TREES[ti][0] + " · sum of distances to every other node · step " + k + " of " + (tr.length - 1), { anchor: "start", size: 12, weight: 700 });
      par.forEach(function (p, v) { if (p >= 0) line(svg, px(p), py(p), px(v), py(v), { stroke: C.line }); });
      par.forEach(function (p, v) {
        var cur = v === s.u, done = s.res[v] !== null;
        S("circle", { cx: px(v), cy: py(v), r: 13, fill: cur ? (s.pass === 1 ? C.teal : C.orange) : done ? C.green : C.card, opacity: cur ? 0.5 : done ? 0.3 : 1, stroke: cur ? C.blue : C.line, "stroke-width": cur ? 2.5 : 1 }, svg);
        T(svg, px(v), py(v), String(v), { size: 10.5, weight: 700 });
        T(svg, px(v), py(v) + 22, done ? "Σ " + s.res[v] : "s" + s.size[v] + " d" + s.dp[v], { size: 8.5, fill: done ? C.green : C.dim, weight: 600 });
      });
      var RX = 600;
      T(svg, RX, 50, "rerooting work", { anchor: "start", size: 10, fill: C.faint, mono: false });
      T(svg, RX, 72, k + " steps", { anchor: "start", size: 16, weight: 700, fill: C.green });
      T(svg, RX, 104, "BFS from every node", { anchor: "start", size: 10, fill: C.faint, mono: false });
      T(svg, RX, 126, n * n + " visits", { anchor: "start", size: 16, weight: 700, fill: C.orange });
      T(svg, RX, 150, "n answers in O(n), not O(n²)", { anchor: "start", size: 9.5, fill: C.faint, mono: false });
      wrap(svg, 8, 262, s.msg, 744, { size: 11, fill: s.pass === 2 ? C.orange : C.text });
      T(svg, 8, 304, "under each node: s = subtree size, d = total distance down into its subtree; Σ = its answer as the root", { anchor: "start", size: 9.5, fill: C.faint, mono: false });
    }
    K.tabs(f.controls, TREES.map(function (t) { return t[0]; }), 0, function (k) { ti = k; build(); sp.reload(); });
    var sp = stepper(f, function () { return tr.length - 1; }, draw);
    build(); draw(0);
    f.say("Two passes. The first goes up and computes one root's answer; the second carries it across each edge in O(1). Confirm it produces n answers in the time the naive method spends on a few.");
  };

  /* ------------------------------------------------------------------------
     dsaBSTDegenerate — ch26 §1. Plain insertion; height counted in levels
     below the root (a single node has height 0), as the chapter does.
     ------------------------------------------------------------------------ */
  VIZ.dsaBSTDegenerate = function (el) {
    var f = frame(el);
    var root = null, keys = [], rnd = lcg(26), last = null, lastPath = [];
    function ins(k) {
      if (keys.indexOf(k) >= 0) return false;
      keys.push(k); lastPath = [];
      var nd = { v: k, left: null, right: null };
      if (!root) { root = nd; last = nd; return true; }
      var c = root;
      for (;;) { lastPath.push(c); if (k < c.v) { if (!c.left) { c.left = nd; break; } c = c.left; } else { if (!c.right) { c.right = nd; break; } c = c.right; } }
      last = nd; return true;
    }
    var svg = svgOf(f, 320, "binary search tree height against insertion order");
    function render() {
      clear(svg);
      var n = keys.length, h = root ? height(root) - 1 : 0;
      T(svg, 8, 14, n + " keys · height " + h + " · log₂(n) = " + (n ? Math.log2(n).toFixed(1) : "—"), { anchor: "start", size: 12.5, weight: 700 });
      if (root) drawBin(svg, root, { x: 10, y: 40, w: 560, h: 220, hmax: 40 }, function (nd) { return { fill: nd === last ? C.orange : lastPath.indexOf(nd) >= 0 ? C.blue : C.card, op: nd === last || lastPath.indexOf(nd) >= 0 ? 0.35 : 1 }; });
      var RX = 590;
      T(svg, RX, 50, "height", { anchor: "start", size: 10, fill: C.faint, mono: false });
      rect(svg, RX, 60, 160, 16, { rx: 3, fill: C.card });
      S("rect", { x: RX, y: 60, width: 160 * Math.min(1, h / Math.max(1, n - 1 || 1)), height: 16, rx: 3, fill: h > 2 * Math.log2(n + 1) ? C.pink : C.green, opacity: 0.7 }, svg);
      T(svg, RX, 92, "n − 1 = " + Math.max(0, n - 1) + " is a path", { anchor: "start", size: 9.5, fill: C.faint, mono: false });
      T(svg, RX, 110, "⌊log₂ n⌋ = " + (n ? Math.floor(Math.log2(n)) : 0) + " is perfect", { anchor: "start", size: 9.5, fill: C.faint, mono: false });
      T(svg, RX, 140, "last insert walked " + lastPath.length + " node" + (lastPath.length === 1 ? "" : "s"), { anchor: "start", size: 10.5, weight: 600, mono: false });
      T(svg, 8, 284, keys.length ? "inserted: " + keys.slice(0, 26).join(" ") + (keys.length > 26 ? " …" : "") : "Insert keys, or press one of the fifteen-key buttons.", { anchor: "start", size: 10, fill: C.dim });
      T(svg, 8, 306, "blue: the path the last insertion walked · orange: the new leaf", { anchor: "start", size: 9.5, fill: C.faint, mono: false });
    }
    function reset() { root = null; keys = []; last = null; lastPath = []; }
    var inp = D.input(f.controls, "42", "key to insert (0–99)", "4em", function (v) { var k = parseInt(v, 10); if (k >= 0 && k < 100) { ins(k); render(); } });
    f.btn("insert", function () { var k = parseInt(inp.value, 10); if (k >= 0 && k < 100) { ins(k); render(); } });
    f.btn("sorted 15", function () { reset(); for (var i = 1; i <= 15; i++) ins(i * 6); render(); f.say("Sorted order: every key goes right. Height n − 1: a linked list with extra pointers."); });
    f.btn("shuffled 15", function () { reset(); var ks = []; for (var i = 1; i <= 15; i++) ks.push(i * 6); for (i = ks.length - 1; i > 0; i--) { var j = rnd(i + 1), t = ks[i]; ks[i] = ks[j]; ks[j] = t; } ks.forEach(ins); render(); f.say("The same fifteen keys shuffled. Press it again for another order, and watch the height stay near log n."); });
    f.btn("random 15", function () { reset(); while (keys.length < 15) ins(rnd(100)); render(); });
    f.btn("reset", function () { reset(); render(); });
    render();
    f.say("Insert keys and watch the height. Try sorted order, then the same keys shuffled.");
  };

  /* ------------------------------------------------------------------------
     dsaRotations — ch26 §2–3. Select a node, rotate at it; balance factors
     and the inorder sequence are shown after every rotation.
     ------------------------------------------------------------------------ */
  VIZ.dsaRotations = function (el) {
    var f = frame(el);
    /* level order, children listed only under real nodes; the root's balance factor is ±2 in each */
    var CASES = { LL: [50, 30, 80, 20, 40, null, null, 10], LR: [50, 30, 80, 10, 40, null, null, null, null, null, 45],
      RR: [30, 20, 60, null, null, 50, 70, null, null, null, 80], RL: [30, 20, 70, null, null, 50, 80, 40, 60] };
    var ci = "LL", root = null, sel = null, rots = 0, moved = [], hist = [];
    function load() { root = fromLevel(CASES[ci]); sel = null; rots = 0; moved = []; hist = []; }
    function parentOf(t, n) { var p = null; walk(root, function (x) { if (x.left === n || x.right === n) p = x; }); return p; }
    function rotate(dir) {
      if (!sel) { f.say("Click a node first: that is the node the rotation pivots on."); return; }
      var x = sel, y = dir === "R" ? x.left : x.right;
      if (!y) { f.say("A " + (dir === "R" ? "right" : "left") + " rotation at " + fmtK(x.v) + " needs a " + (dir === "R" ? "left" : "right") + " child."); return; }
      hist.push(JSON.stringify(ser(root)));
      var p = parentOf(root, x), inner = dir === "R" ? y.right : y.left;
      if (dir === "R") { x.left = y.right; y.right = x; } else { x.right = y.left; y.left = x; }
      if (!p) root = y; else if (p.left === x) p.left = y; else p.right = y;
      rots++; moved = [x, y, inner].filter(Boolean); sel = y;
      render();
      f.say("Three pointers moved: " + fmtK(x.v) + "'s child, " + fmtK(y.v) + "'s child, and the link from above." + (inner ? " The inner subtree " + fmtK(inner.v) + " crossed from " + fmtK(y.v) + " to " + fmtK(x.v) + "." : ""));
    }
    function ser(n) { return n ? [n.v, ser(n.left), ser(n.right)] : null; }
    function des(a) { return a ? { v: a[0], left: des(a[1]), right: des(a[2]) } : null; }
    function fmtK(v) { return String(v); }
    function bf(n) { return height(n.left) - height(n.right); }
    var svg = S("svg", { viewBox: "0 0 760 300", width: "100%", role: "group", "aria-label": "rotations: click a node, then rotate" }, f.body);
    function render() {
      clear(svg);
      var bad = all(root).filter(function (n) { return Math.abs(bf(n)) > 1; }), ino = all(root).map(function (n) { return n.v; });
      T(svg, 8, 14, "case " + ci + " · rotations " + rots + " · " + (bad.length ? "unbalanced at " + bad.map(function (n) { return n.v; }).join(", ") : "every balance factor is −1, 0 or +1"), { anchor: "start", size: 12, weight: 700, fill: bad.length ? C.text : C.green });
      var P = drawBin(svg, root, { x: 10, y: 50, w: 740, h: 160, hmax: 46 }, function (n) {
        var b = bf(n);
        return { fill: n === sel ? C.blue : moved.indexOf(n) >= 0 ? C.orange : Math.abs(b) > 1 ? C.pink : C.card, op: n === sel || moved.indexOf(n) >= 0 || Math.abs(b) > 1 ? 0.4 : 1, stroke: n === sel ? C.blue : C.line, sw: n === sel ? 2.5 : 1.2, sub: "bf " + (b > 0 ? "+" : "") + b, subCol: Math.abs(b) > 1 ? C.pink : C.faint };
      });
      all(root).forEach(function (n) {
        var hit = S("circle", { cx: P.px(n), cy: P.py(n), r: P.r + 2, fill: "transparent" }, svg);
        function pick() { sel = n; render(); }
        hit.addEventListener("click", pick); focusable(hit, "select node " + n.v, pick);
      });
      T(svg, 8, 244, "inorder: " + ino.join(" ") + "  — unchanged by every rotation", { anchor: "start", size: 11.5, weight: 600, fill: C.green });
      T(svg, 8, 268, sel ? "selected " + sel.v + ": rotate right lifts its left child, rotate left lifts its right child" : "click a node to select it", { anchor: "start", size: 10.5, fill: C.dim, mono: false });
      T(svg, 8, 290, "bf = height(left) − height(right). Straight leans (LL, RR) take one rotation; zigzags (LR, RL) take two", { anchor: "start", size: 9.5, fill: C.faint, mono: false });
    }
    K.tabs(f.controls, ["LL", "LR", "RL", "RR"], 0, function (k) { ci = ["LL", "LR", "RL", "RR"][k]; load(); render();
      f.say(ci === "LR" || ci === "RL" ? "A zigzag. Try a single rotation at the unbalanced node first, and watch the imbalance move across." : "A straight lean: one rotation at the unbalanced node fixes it."); });
    f.btn("rotate right ↻", function () { rotate("R"); });
    f.btn("rotate left ↺", function () { rotate("L"); });
    f.btn("undo", function () { if (hist.length) { root = des(JSON.parse(hist.pop())); rots = Math.max(0, rots - 1); sel = null; moved = []; render(); } });
    f.btn("reset", function () { load(); render(); });
    load(); render();
    f.say("One rotation, three pointers move: watch the BST property survive it. Find the case that needs two rotations, and say why one is not enough.");
  };

  /* ------------------------------------------------------------------------
     Four balanced trees, instrumented. Each insert returns nothing; each
     tree keeps .rot (rotations, or splits for the B-tree) and .touch
     (nodes on the search path).
     ------------------------------------------------------------------------ */
  function makeAVL() {
    var t = { root: null, rot: 0, touch: 0 };
    function h(n) { return n ? n.h : 0; }
    function up(n) { n.h = 1 + Math.max(h(n.left), h(n.right)); }
    function rr(x) { var y = x.left; x.left = y.right; y.right = x; up(x); up(y); t.rot++; return y; }
    function rl(x) { var y = x.right; x.right = y.left; y.left = x; up(x); up(y); t.rot++; return y; }
    function ins(n, k) {
      if (!n) return { v: k, left: null, right: null, h: 1 };
      t.touch++;
      if (k < n.v) n.left = ins(n.left, k); else n.right = ins(n.right, k);
      up(n);
      var b = h(n.left) - h(n.right);
      if (b > 1) { if (k > n.left.v) n.left = rl(n.left); return rr(n); }
      if (b < -1) { if (k < n.right.v) n.right = rr(n.right); return rl(n); }
      return n;
    }
    t.insert = function (k) { t.root = ins(t.root, k); };
    return t;
  }
  function makeRB() {                 // CLRS insertion: recolour when the uncle is red, rotate when black
    var t = { root: null, rot: 0, touch: 0 };
    function rotL(x) { var y = x.right; x.right = y.left; if (y.left) y.left.p = x; y.p = x.p; if (!x.p) t.root = y; else if (x === x.p.left) x.p.left = y; else x.p.right = y; y.left = x; x.p = y; t.rot++; }
    function rotR(x) { var y = x.left; x.left = y.right; if (y.right) y.right.p = x; y.p = x.p; if (!x.p) t.root = y; else if (x === x.p.right) x.p.right = y; else x.p.left = y; y.right = x; x.p = y; t.rot++; }
    t.insert = function (k) {
      var z = { v: k, left: null, right: null, p: null, red: true }, y = null, x = t.root;
      while (x) { t.touch++; y = x; x = k < x.v ? x.left : x.right; }
      z.p = y; if (!y) t.root = z; else if (k < y.v) y.left = z; else y.right = z;
      while (z.p && z.p.red) {
        var g = z.p.p;
        if (z.p === g.left) {
          var u = g.right;
          if (u && u.red) { z.p.red = false; u.red = false; g.red = true; z = g; }
          else { if (z === z.p.right) { z = z.p; rotL(z); } z.p.red = false; g.red = true; rotR(g); }
        } else {
          var u2 = g.left;
          if (u2 && u2.red) { z.p.red = false; u2.red = false; g.red = true; z = g; }
          else { if (z === z.p.left) { z = z.p; rotR(z); } z.p.red = false; g.red = true; rotL(g); }
        }
      }
      t.root.red = false;
    };
    return t;
  }
  function makeTreap(seed) {
    var t = { root: null, rot: 0, touch: 0 }, r = lcg(seed);
    function rr(x) { var y = x.left; x.left = y.right; y.right = x; t.rot++; return y; }
    function rl(x) { var y = x.right; x.right = y.left; y.left = x; t.rot++; return y; }
    function ins(n, k) {
      if (!n) return { v: k, left: null, right: null, pr: r(1000000) };
      t.touch++;
      if (k < n.v) { n.left = ins(n.left, k); if (n.left.pr < n.pr) n = rr(n); }
      else { n.right = ins(n.right, k); if (n.right.pr < n.pr) n = rl(n); }
      return n;
    }
    t.insert = function (k) { t.root = ins(t.root, k); };
    return t;
  }
  function makeBTree() {              // at most 3 keys a node (a 2-3-4 tree); split on overflow
    var t = { root: { keys: [], kids: [] }, rot: 0, touch: 0 };
    function ins(n, k) {              // returns [median, right] if n split
      t.touch++;
      if (!n.kids.length) { n.keys.push(k); n.keys.sort(function (a, b) { return a - b; }); }
      else {
        var i = 0; while (i < n.keys.length && k > n.keys[i]) i++;
        var sp = ins(n.kids[i], k);
        if (sp) { n.keys.splice(i, 0, sp[0]); n.kids.splice(i + 1, 0, sp[1]); }
      }
      if (n.keys.length <= 3) return null;
      t.rot++;                        // four keys: keep one, lift the second, move two right
      var med = n.keys[1], right = { keys: n.keys.slice(2), kids: n.kids.slice(2) };
      n.keys = n.keys.slice(0, 1); n.kids = n.kids.slice(0, 2);
      return [med, right];
    }
    t.insert = function (k) { var sp = ins(t.root, k); if (sp) t.root = { keys: [sp[0]], kids: [t.root, sp[1]] }; };
    return t;
  }
  function bstHeight(n) { return n ? 1 + Math.max(bstHeight(n.left), bstHeight(n.right)) : 0; }
  function btHeight(n) { return n.kids.length ? 1 + btHeight(n.kids[0]) : 1; }

  /* ------------------------------------------------------------------------
     dsaTreeFamily — ch26 §3–6. The same 31 keys into all four; height is
     counted in levels (a single node is 1), B-tree levels are node reads.
     ------------------------------------------------------------------------ */
  VIZ.dsaTreeFamily = function (el) {
    var f = frame(el);
    var ORD = ["sorted", "reversed", "random", "zigzag", "level order"], oi = 0, metric = 0, N = 31, snaps = [];
    function keys() {
      var a = [], i; for (i = 1; i <= N; i++) a.push(i);
      if (oi === 1) a.reverse();
      if (oi === 2) { var r = lcg(31); for (i = a.length - 1; i > 0; i--) { var j = r(i + 1), t = a[i]; a[i] = a[j]; a[j] = t; } }
      if (oi === 3) { var z = []; for (i = 0; i < N; i++) z.push(i % 2 ? N - (i >> 1) : 1 + (i >> 1)); a = z; }
      if (oi === 4) { a = []; var q = [[1, N]]; while (q.length) { var s = q.shift(); if (s[0] > s[1]) continue; var m = (s[0] + s[1]) >> 1; a.push(m); q.push([s[0], m - 1]); q.push([m + 1, s[1]]); } }
      return a;
    }
    function build() {
      var ks = keys(), trees = [makeAVL(), makeRB(), makeTreap(7), makeBTree()];
      snaps = [];
      for (var i = 0; i <= ks.length; i++) {
        if (i) trees.forEach(function (t) { t.insert(ks[i - 1]); });
        snaps.push({ key: i ? ks[i - 1] : null, count: i, m: trees.map(function (t, j) { return { rot: t.rot, touch: t.touch, h: j === 3 ? (i ? btHeight(t.root) : 0) : bstHeight(t.root) }; }),
          shapes: trees.map(function (t, j) { return j === 3 ? JSON.parse(JSON.stringify(t.root)) : cp(t.root); }) });
      }
    }
    function cp(n) { return n ? { v: n.v, red: n.red, left: cp(n.left), right: cp(n.right) } : null; }
    var NAMES = ["AVL", "red-black", "treap", "B-tree (≤3 keys a node)"], MET = ["height", "rotations (B-tree: splits)", "nodes touched"];
    var svg = svgOf(f, 420, "AVL, red-black, treap and B-tree on the same keys");
    function draw(k) {
      clear(svg);
      var s = snaps[k];
      T(svg, 8, 14, ORD[oi] + " order · " + s.count + " of " + N + " keys inserted" + (s.key !== null ? " · last: " + s.key : ""), { anchor: "start", size: 12, weight: 700 });
      [0, 1, 2, 3].forEach(function (j) {
        var bx = 8 + (j % 2) * 376, by = 28 + Math.floor(j / 2) * 150, sh = s.shapes[j];
        rect(svg, bx, by, 368, 142, { rx: 6, fill: "none", stroke: C.line, sw: 1 });
        T(svg, bx + 8, by + 13, NAMES[j] + " · height " + s.m[j].h, { anchor: "start", size: 10.5, weight: 700, mono: false });
        if (j < 3 && sh) {
          var L = layout(sh), W = 352 / Math.max(1, L.count), H = Math.min(22, 112 / Math.max(1, L.maxD));
          walk(sh, function (n) { [n.left, n.right].forEach(function (c) { if (c) line(svg, bx + 8 + n.x * W + W / 2, by + 26 + n.d * H, bx + 8 + c.x * W + W / 2, by + 26 + c.d * H, { stroke: C.line, sw: 1 }); }); });
          walk(sh, function (n) { S("circle", { cx: bx + 8 + n.x * W + W / 2, cy: by + 26 + n.d * H, r: 3.6, fill: j === 1 ? (n.red ? C.pink : C.text) : n.v === s.key ? C.orange : C.blue }, svg); });
        } else if (j === 3 && sh && s.count) {
          var levels = []; (function g(n, d) { (levels[d] = levels[d] || []).push(n); n.kids.forEach(function (c) { g(c, d + 1); }); })(sh, 0);
          levels.forEach(function (lv, d) {
            var tot = lv.reduce(function (a, n) { return a + n.keys.length; }, 0), x = bx + 8, cw = Math.min(14, 350 / (tot + lv.length));
            lv.forEach(function (n) { rect(svg, x, by + 24 + d * 26, n.keys.length * cw, 14, { rx: 2, fill: C.teal, op: 0.3, stroke: C.teal, sw: 0.8 }); x += n.keys.length * cw + cw * 0.9; });
          });
        }
      });
      var y0 = 336, vals = s.m.map(function (m) { return metric === 0 ? m.h : metric === 1 ? m.rot : m.touch; }), top = Math.max.apply(null, vals.concat([1]));
      T(svg, 8, y0 - 8, MET[metric] + ":", { anchor: "start", size: 10, fill: C.faint, mono: false });
      vals.forEach(function (v, j) {
        var x = 8 + j * 188;
        T(svg, x, y0 + 8, NAMES[j].split(" (")[0], { anchor: "start", size: 10, mono: false });
        rect(svg, x, y0 + 16, 170, 14, { rx: 3, fill: C.card });
        S("rect", { x: x, y: y0 + 16, width: 170 * v / top, height: 14, rx: 3, fill: [C.blue, C.pink, C.purple, C.teal][j], opacity: 0.7 }, svg);
        T(svg, x + 170, y0 + 44, commas(v), { anchor: "end", size: 11, weight: 700 });
      });
      T(svg, 8, 408, "red-black nodes drawn red or black · the treap's shape comes from random priorities, so the order barely matters to it", { anchor: "start", size: 9.5, fill: C.faint, mono: false });
    }
    K.tabs(f.controls, ORD, 0, function (k) { oi = k; build(); sp.go(N); });
    K.tabs(f.controls, MET, 0, function (k) { metric = k; draw(sp.pos()); });
    var sp = stepper(f, function () { return N; }, draw);
    build(); sp.go(N);
    f.say("Same keys, four trees. Switch the metric to see what each design bought: compare AVL's and red-black's rotations and heights across the insertion orders.");
  };

  /* ------------------------------------------------------------------------
     dsaBTreeFanout — ch26 §6. Height = the least h with B^h ≥ n, one node
     read per level; a node of B 16-byte entries.
     ------------------------------------------------------------------------ */
  VIZ.dsaBTreeFanout = function (el) {
    var f = frame(el);
    var B = 2, lg = 9;
    function hOf(b, n) { var h = 0, cap = 1; while (cap < n) { cap *= b; h++; } return h; }
    var svg = svgOf(f, 320, "B-tree height against fanout");
    function render() {
      clear(svg);
      var n = Math.pow(10, lg), h = hOf(B, n), bytes = B * 16;
      T(svg, 8, 14, "n = " + (lg >= 6 ? "10" + D.sup(lg) : commas(n)) + " keys · fanout " + B + " · height " + h, { anchor: "start", size: 12.5, weight: 700 });
      /* the height curve over fanouts 2 … 1024 (log x) */
      var X0 = 60, X1 = 460, Y0 = 40, Y1 = 250, hmax = hOf(2, n);
      var px = function (b) { return X0 + Math.log2(b) / 10 * (X1 - X0); }, py = function (hh) { return Y1 - hh / hmax * (Y1 - Y0); };
      [2, 16, 128, 256, 1024].forEach(function (b) { line(svg, px(b), Y1, px(b), Y1 + 4, { stroke: C.faint }); T(svg, px(b), Y1 + 14, String(b), { size: 9, fill: C.faint }); });
      T(svg, X1, Y1 + 28, "fanout (log scale) →", { anchor: "end", size: 9.5, fill: C.faint, mono: false });
      [0, Math.round(hmax / 2), hmax].forEach(function (hh) { T(svg, X0 - 6, py(hh), String(hh), { anchor: "end", size: 9, fill: C.faint }); });
      var d = "", prev = null;
      for (var b = 2; b <= 1024; b++) { var hh = hOf(b, n); d += (d ? " L " + px(b).toFixed(1) + " " + py(prev).toFixed(1) + " L " : "M ") + px(b).toFixed(1) + " " + py(hh).toFixed(1); prev = hh; }
      S("path", { d: d, fill: "none", stroke: C.blue, "stroke-width": 2 }, svg);
      S("circle", { cx: px(B), cy: py(h), r: 6, fill: C.orange }, svg);
      /* the lookup, level by level */
      var RX = 500;
      T(svg, RX, 44, "a lookup reads one node per level:", { anchor: "start", size: 10, fill: C.faint, mono: false });
      for (var i = 0; i < Math.min(h, 12); i++) {
        rect(svg, RX + i * 4, 54 + i * 15, 100, 12, { rx: 2, fill: C.teal, op: 0.35, stroke: C.teal, sw: 0.8 });
      }
      if (h > 12) T(svg, RX + 110, 54 + 11 * 15 + 6, "… " + h + " reads", { anchor: "start", size: 10, fill: C.dim });
      T(svg, RX, 250, h + " node read" + (h === 1 ? "" : "s") + " per lookup", { anchor: "start", size: 15, weight: 700, fill: h <= 4 ? C.green : C.orange });
      T(svg, 8, 284, "node = " + B + " entries × 16 bytes = " + commas(bytes) + " bytes" + (bytes <= 4096 ? " — fits a 4 KB page" : " — more than a 4 KB page: one read is no longer one page"), { anchor: "start", size: 11, fill: bytes <= 4096 ? C.dim : C.pink, mono: false });
      T(svg, 8, 306, "height is the least h with fanout^h ≥ n: fanout " + B + " holds up to " + (h >= 1 ? (Math.pow(B, h) > 1e15 ? "10^" + (h * Math.log10(B)).toFixed(0) : commas(Math.pow(B, h))) : 1) + " keys in " + h + " levels", { anchor: "start", size: 10, fill: C.faint, mono: false });
    }
    K.slider(f.controls, "fanout", 2, 512, B, 1, String, function (v) { B = v; render(); });
    K.slider(f.controls, "n", 3, 12, lg, 1, function (v) { return "10" + D.sup(v); }, function (v) { lg = v; render(); });
    render();
    f.say("Drag the fanout. The height is how many node reads a lookup costs: find the smallest fanout at which a billion keys fit in height 4.");
  };

  /* ------------------------------------------------------------------------
     dsaHeap — ch27 §1–3. A min-heap as array and tree at once; each swap of
     a sift is animated. Build-heap and n insertions are compared on the
     same fifteen values.
     ------------------------------------------------------------------------ */
  VIZ.dsaHeap = function (el) {
    var f = frame(el);
    var a = [1, 4, 3, 7, 5, 8], swaps = 0, path = [], queue = [], timer = null, cmp = null, rnd = lcg(27), src = [];
    function siftUp(i, out) { while (i > 0) { var p = (i - 1) >> 1; if (a[i] < a[p]) { out.push([i, p]); var t = a[i]; a[i] = a[p]; a[p] = t; i = p; } else break; } }
    function siftDown(i, n, out) {
      for (;;) { var l = 2 * i + 1, r = l + 1, m = i; if (l < n && a[l] < a[m]) m = l; if (r < n && a[r] < a[m]) m = r; if (m === i) break; out.push([i, m]); var t = a[i]; a[i] = a[m]; a[m] = t; i = m; }
    }
    function animate(ops, after) {
      if (timer) { clearInterval(timer); timer = null; }
      var final = a.slice(); queue = ops.slice();
      if (D.REDUCED || !ops.length) { swaps += ops.length; path = ops.length ? ops[ops.length - 1] : []; render(); if (after) after(); return; }
      /* replay from the pre-op state */
      var pre = final.slice(); for (var q = ops.length - 1; q >= 0; q--) { var o = ops[q], t = pre[o[0]]; pre[o[0]] = pre[o[1]]; pre[o[1]] = t; }
      a = pre; render();
      timer = setInterval(function () {
        var o = queue.shift(); if (!o) { clearInterval(timer); timer = null; a = final; path = []; render(); if (after) after(); return; }
        var t = a[o[0]]; a[o[0]] = a[o[1]]; a[o[1]] = t; path = o; swaps++; render();
      }, 320);
    }
    function insert(v) { if (a.length >= 31) return; a.push(v); var ops = []; siftUp(a.length - 1, ops); animate(ops); f.say(v + " goes in at the next free slot, index " + (a.length - 1) + ", then sifts up while it beats its parent: " + ops.length + " swap" + (ops.length === 1 ? "" : "s") + "."); }
    function extract() {
      if (!a.length) return;
      var m = a[0], last = a.pop(); if (a.length) { a[0] = last; }
      var ops = []; siftDown(0, a.length, ops); animate(ops);
      f.say("extract-min returns " + m + ". The last element " + last + " moves to the root and sifts down: " + ops.length + " swap" + (ops.length === 1 ? "" : "s") + ".");
    }
    function compare(desc) {
      src = []; for (var i = 0; i < 15; i++) src.push(1 + rnd(99));
      if (desc) src.sort(function (x, y) { return y - x; });
      a = []; var s1 = 0; src.forEach(function (v) { a.push(v); var ops = []; siftUp(a.length - 1, ops); s1 += ops.length; });
      a = src.slice(); var ops2 = [];
      for (i = (a.length >> 1) - 1; i >= 0; i--) siftDown(i, a.length, ops2);
      cmp = { ins: s1, build: ops2.length, desc: desc };
      swaps = 0; animate(ops2);               // a is the built heap; animate replays it from src
      f.say("Build-heap sifts down every internal node from the last one up. It took " + ops2.length + " swaps; inserting the same fifteen one at a time took " + s1 + ".");
    }
    var svg = svgOf(f, 330, "binary heap as array and tree");
    function render() {
      clear(svg);
      T(svg, 8, 14, "min-heap · " + a.length + " elements · swaps " + swaps, { anchor: "start", size: 12.5, weight: 700 });
      /* the array */
      var W = Math.min(46, 720 / Math.max(1, a.length));
      a.forEach(function (v, i) {
        var hot = path.indexOf(i) >= 0;
        rect(svg, 20 + i * W, 30, W - 3, 28, { rx: 4, fill: hot ? C.orange : C.card, op: hot ? 0.4 : 1, stroke: hot ? C.orange : C.line });
        T(svg, 20 + i * W + (W - 3) / 2, 44, String(v), { size: W < 30 ? 9.5 : 12, weight: 700 });
        T(svg, 20 + i * W + (W - 3) / 2, 66, String(i), { size: 8, fill: C.faint });
      });
      /* the tree: level l, position p → x */
      var levels = a.length ? Math.floor(Math.log2(a.length)) + 1 : 0, H = Math.min(46, 180 / Math.max(1, levels));
      function pos(i) { var l = Math.floor(Math.log2(i + 1)), p = i + 1 - Math.pow(2, l), cnt = Math.pow(2, l); return [20 + (p + 0.5) * 720 / cnt, 92 + l * H]; }
      a.forEach(function (v, i) { if (i) { var c = pos(i), pp = pos((i - 1) >> 1); line(svg, pp[0], pp[1], c[0], c[1], { stroke: path.indexOf(i) >= 0 && path.indexOf((i - 1) >> 1) >= 0 ? C.orange : C.line, sw: 1.4 }); } });
      a.forEach(function (v, i) {
        var c = pos(i), hot = path.indexOf(i) >= 0, bad = i && a[i] < a[(i - 1) >> 1];
        S("circle", { cx: c[0], cy: c[1], r: 13, fill: hot ? C.orange : C.card, opacity: hot ? 0.5 : 1, stroke: bad ? C.pink : C.line, "stroke-width": bad ? 2 : 1 }, svg);
        T(svg, c[0], c[1], String(v), { size: 10.5, weight: 700 });
      });
      if (cmp) T(svg, 8, 300, "on fifteen " + (cmp.desc ? "descending" : "random") + " values: n inserts " + cmp.ins + " swaps · build-heap " + cmp.build + " swaps", { anchor: "start", size: 12, weight: 700, fill: C.green, mono: false });
      T(svg, 8, 322, "node i: children 2i + 1 and 2i + 2, parent (i − 1) // 2 — the array is the tree", { anchor: "start", size: 9.5, fill: C.faint, mono: false });
    }
    var inp = D.input(f.controls, "2", "value to insert", "4em", function (v) { var x = parseInt(v, 10); if (!isNaN(x)) insert(x); });
    f.btn("insert", function () { var x = parseInt(inp.value, 10); if (!isNaN(x)) insert(x); });
    f.btn("extract-min", extract);
    f.btn("build-heap vs inserts (random)", function () { compare(false); });
    f.btn("… (descending)", function () { compare(true); });
    f.btn("reset", function () { if (timer) clearInterval(timer); timer = null; a = [1, 4, 3, 7, 5, 8]; swaps = 0; path = []; cmp = null; render(); });
    render();
    f.say("The array and the tree are the same thing. Insert a value and watch it sift; then build a heap from fifteen values both ways and compare the swap counts.");
  };

  /* ------------------------------------------------------------------------
     dsaTrie — ch28 §2–3. The chapter's dict-of-dicts Trie with '$' as the
     terminal flag; compression collapses single-child, non-terminal chains.
     ------------------------------------------------------------------------ */
  VIZ.dsaTrie = function (el) {
    var f = frame(el);
    var PRE = { "car card care cargo cat dog": "car card care cargo cat dog".split(" "),
      "ten on one prefix": ["international", "internationalise", "internationalism", "internationalist", "internationally", "internal", "internals", "interne", "internet", "internetwork"] };
    var root = {}, words = [], compress = false, hl = [], lastRes = "";
    function insert(w) { var n = root; for (var i = 0; i < w.length; i++) n = n[w[i]] = n[w[i]] || {}; n.$ = true; if (words.indexOf(w) < 0) words.push(w); }
    function walkTo(s) { var n = root, path = [root]; for (var i = 0; i < s.length; i++) { if (!n[s[i]]) return { node: null, path: path }; n = n[s[i]]; path.push(n); } return { node: n, path: path }; }
    function remove(w) {
      var r = walkTo(w); if (!r.node || !r.node.$) return false;
      delete r.node.$; words = words.filter(function (x) { return x !== w; });
      for (var i = w.length; i > 0; i--) { var n = r.path[i]; if (Object.keys(n).length) break; delete r.path[i - 1][w[i - 1]]; }
      return true;
    }
    function kids(n) { return Object.keys(n).filter(function (k) { return k !== "$"; }).sort(); }
    /* the drawn tree: {label, term, src (trie nodes covered), kids} */
    function view() {
      function mk(n, label, src) {
        var v = { label: label, term: !!n.$, src: src.concat([n]), kids: [] };
        kids(n).forEach(function (c) {
          var lab = c, m = n[c], chain = [m];
          if (compress) while (!m.$ && kids(m).length === 1) { var c2 = kids(m)[0]; lab += c2; m = m[c2]; chain.push(m); }
          v.kids.push(mk(m, lab, chain.slice(0, -1)));
        });
        return v;
      }
      return mk(root, "•", []);
    }
    function count(n) { return 1 + kids(n).reduce(function (s, c) { return s + count(n[c]); }, 0); }
    var svg = svgOf(f, 330, "trie with the last query's path highlighted");
    function render() {
      clear(svg);
      var v = view(), nodes = 0, slot = 0, maxD = 0;
      (function lay(x, d) { nodes++; x.d = d; if (d > maxD) maxD = d; if (!x.kids.length) { x.x = slot++; return; } x.kids.forEach(function (k) { lay(k, d + 1); }); x.x = (x.kids[0].x + x.kids[x.kids.length - 1].x) / 2; })(v, 0);
      var W = 740 / Math.max(1, slot), H = Math.min(44, 220 / Math.max(1, maxD));
      var px = function (x) { return 10 + x.x * W + W / 2; }, py = function (x) { return 40 + x.d * H; };
      T(svg, 8, 14, words.length + " words · " + nodes + " nodes" + (compress ? " (radix: " + count(root) + " uncompressed)" : ""), { anchor: "start", size: 12.5, weight: 700 });
      (function edges(x) { x.kids.forEach(function (k) { var on = hl.indexOf(k.src[k.src.length - 1]) >= 0; line(svg, px(x), py(x), px(k), py(k), { stroke: on ? C.orange : C.line, sw: on ? 2.5 : 1.2 }); edges(k); }); })(v);
      (function nodesDraw(x) {
        var on = hl.indexOf(x.src[x.src.length - 1]) >= 0;
        S("circle", { cx: px(x), cy: py(x), r: 11, fill: x.term ? C.green : on ? C.orange : C.card, opacity: x.term || on ? 0.45 : 1, stroke: on ? C.orange : C.line, "stroke-width": on ? 2 : 1 }, svg);
        T(svg, px(x), py(x), x.label.length > 4 ? x.label.slice(0, 3) + "…" : x.label, { size: x.label.length > 1 ? 8 : 10.5, weight: 700 });
        if (x.label.length > 1 && W > 50) T(svg, px(x), py(x) + 19, x.label, { size: 8, fill: C.dim });
        x.kids.forEach(nodesDraw);
      })(v);
      say(svg, 290, lastRes || "Type a word and insert it, or load a preset.");
      T(svg, 8, 314, "green: end of a word · orange: the last walk" + (compress ? " · a multi-letter node is a collapsed single-child chain" : ""), { anchor: "start", size: 9.5, fill: C.faint, mono: false });
    }
    function word() { var w = inp.value.trim().toLowerCase().replace(/[^a-z]/g, ""); return w.slice(0, 16); }
    var inp = D.input(f.controls, "cargo", "word", "8em", function () { var w = word(); if (w) { insert(w); hl = walkTo(w).path; lastRes = "inserted '" + w + "': " + w.length + " edges walked or made"; render(); } });
    f.btn("insert", function () { var w = word(); if (!w) return; insert(w); hl = walkTo(w).path; lastRes = "inserted '" + w + "': " + w.length + " edges walked or made, whatever else is stored"; render(); });
    f.btn("search", function () { var w = word(), r = walkTo(w); hl = r.path; lastRes = "search '" + w + "': " + (r.node ? (r.node.$ ? "found — the walk ends on a word end" : "not a word — the walk ends on a node that is not a word end") : "not found — the walk fell off after " + (r.path.length - 1) + " letters"); render(); });
    f.btn("starts with", function () { var w = word(), r = walkTo(w); hl = r.path; lastRes = "starts-with '" + w + "': " + (r.node ? "yes — the walk arrived, word end or not" : "no"); render(); });
    f.btn("delete", function () { var w = word(), ok = remove(w); hl = []; lastRes = ok ? "deleted '" + w + "': its end mark cleared and any branch left empty pruned" : "'" + w + "' is not stored"; render(); });
    K.toggle(f.controls, "compress (radix)", compress, function (on) { compress = on; render(); });
    presetRow(f, Object.keys(PRE), function (i) { root = {}; words = []; PRE[Object.keys(PRE)[i]].forEach(insert); hl = []; lastRes = ""; render(); });
    f.btn("clear", function () { root = {}; words = []; hl = []; lastRes = ""; render(); });
    PRE["car card care cargo cat dog"].forEach(insert); render();
    f.say("Type a word to insert it; the highlighted path is the walk your query makes. Load the ten words on one prefix, then toggle compression and watch the node count collapse.");
  };

  /* ------------------------------------------------------------------------
     dsaBinaryLifting — ch29 §1, the chapter's build() and lca().
     ------------------------------------------------------------------------ */
  VIZ.dsaBinaryLifting = function (el) {
    var f = frame(el);
    var PAR = [-1, 0, 0, 1, 1, 2, 3, 3, 4, 6, 9, 10, 11, 12, 5, 14, 15, 13, 17, 8];
    var n = PAR.length, LOG = 5, up = [], depth = [], kids = PAR.map(function () { return []; }), u = 18, v = 16, tr = [], showT = true;
    PAR.forEach(function (p, i) { if (p >= 0) kids[p].push(i); });
    (function () { up = [PAR.slice()]; for (var k = 1; k < LOG; k++) up.push(PAR.map(function (x, i) { return up[k - 1][i] === -1 ? -1 : up[k - 1][up[k - 1][i]]; })); })();
    (function d(x, dd) { depth[x] = dd; kids[x].forEach(function (c) { d(c, dd + 1); }); })(0, 0);
    function build() {
      var a = u, b = v, jumps = 0;
      tr = [{ a: a, b: b, jumps: 0, msg: "depth(" + u + ") = " + depth[u] + ", depth(" + v + ") = " + depth[v] }];
      if (depth[a] < depth[b]) { var t = a; a = b; b = t; }
      var diff = depth[a] - depth[b];
      tr.push({ a: a, b: b, jumps: 0, msg: "lift the deeper node " + a + " by " + diff + " = binary " + diff.toString(2) + ": one jump per set bit" });
      for (var k = 0; k < LOG; k++) if (diff >> k & 1) { var from = a; a = up[k][a]; jumps++; tr.push({ a: a, b: b, jumps: jumps, k: k, from: from, msg: "bit " + k + " is set: jump 2" + D.sup(k) + " = " + (1 << k) + " from " + from + " to up[" + k + "][" + from + "] = " + a }); }
      if (a === b) { tr.push({ a: a, b: b, jumps: jumps, done: a, msg: "they met: the LCA is " + a + " after " + jumps + " jump" + (jumps === 1 ? "" : "s") }); return; }
      for (k = LOG - 1; k >= 0; k--) {
        if (up[k][a] !== up[k][b]) { var fa = a, fb = b; a = up[k][a]; b = up[k][b]; jumps += 2; tr.push({ a: a, b: b, jumps: jumps, k: k, from: fa, from2: fb, msg: "2" + D.sup(k) + " up, their ancestors still differ: both jump, to " + a + " and " + b }); }
        else if (up[k][a] !== -1) tr.push({ a: a, b: b, jumps: jumps, k: k, skip: true, msg: "2" + D.sup(k) + " up they would meet (at " + up[k][a] + ") or overshoot: do not jump" });
      }
      tr.push({ a: a, b: b, jumps: jumps, done: up[0][a], msg: "no jump keeps them apart: the LCA is their parent, " + up[0][a] + " (" + jumps + " jumps in all)" });
    }
    var svg = svgOf(f, 400, "binary lifting table and an LCA query");
    function draw(k) {
      clear(svg);
      var s = tr[k], slot = 0, pos = [];
      (function lay(x) { if (!kids[x].length) { pos[x] = slot++; return; } kids[x].forEach(lay); pos[x] = (pos[kids[x][0]] + pos[kids[x][kids[x].length - 1]]) / 2; })(0);
      var md = Math.max.apply(null, depth), W = 400 / slot, H = 206 / md;
      var px = function (x) { return 14 + pos[x] * W + W / 2; }, py = function (x) { return 30 + depth[x] * H; };
      T(svg, 8, 14, "LCA(" + u + ", " + v + ") · jumps " + s.jumps + " · step " + k + " of " + (tr.length - 1), { anchor: "start", size: 12, weight: 700 });
      PAR.forEach(function (p, x) { if (p >= 0) line(svg, px(p), py(p), px(x), py(x), { stroke: C.line }); });
      if (s.from !== undefined) S("path", { d: "M " + px(s.from) + " " + py(s.from) + " Q " + (px(s.from) + 24) + " " + (py(s.from) + py(s.a)) / 2 + " " + px(s.a) + " " + py(s.a), fill: "none", stroke: C.orange, "stroke-width": 2.5, "stroke-dasharray": "5 3" }, svg);
      if (s.from2 !== undefined) S("path", { d: "M " + px(s.from2) + " " + py(s.from2) + " Q " + (px(s.from2) - 24) + " " + (py(s.from2) + py(s.b)) / 2 + " " + px(s.b) + " " + py(s.b), fill: "none", stroke: C.orange, "stroke-width": 2.5, "stroke-dasharray": "5 3" }, svg);
      PAR.forEach(function (p, x) {
        var isA = x === s.a, isB = x === s.b, fin = x === s.done;
        S("circle", { cx: px(x), cy: py(x), r: 9, fill: fin ? C.green : isA ? C.blue : isB ? C.purple : C.card, opacity: fin || isA || isB ? 0.5 : 1, stroke: x === u || x === v ? C.text : C.line, "stroke-width": x === u || x === v ? 2 : 1 }, svg);
        T(svg, px(x), py(x), String(x), { size: 8.5, weight: 700 });
      });
      if (showT) {
        var TX = 424, cw = 14.2;
        T(svg, TX, 30, "up[k][v]: the 2^k-th ancestor", { anchor: "start", size: 9.5, fill: C.faint, mono: false });
        for (var x = 0; x < n; x++) T(svg, TX + 44 + x * cw, 46, String(x), { size: 8, fill: C.faint });
        for (var kk = 0; kk < LOG; kk++) {
          T(svg, TX, 62 + kk * 16, "k=" + kk, { anchor: "start", size: 8.5, fill: C.dim });
          for (x = 0; x < n; x++) {
            var used = s.k === kk && (x === s.from || x === s.from2);
            if (used) rect(svg, TX + 44 + x * cw - 7, 62 + kk * 16 - 7, 14, 14, { rx: 2, fill: C.orange, op: 0.35, stroke: "none" });
            T(svg, TX + 44 + x * cw, 62 + kk * 16, up[kk][x] < 0 ? "–" : String(up[kk][x]), { size: 8, fill: used ? C.text : C.dim, weight: used ? 700 : 400 });
          }
        }
      }
      var diff = Math.abs(depth[u] - depth[v]), pc = diff.toString(2).split("").filter(function (c) { return c === "1"; }).length;
      wrap(svg, 8, 282, s.msg, 744, { size: 11.5, fill: s.done !== undefined ? C.green : s.skip ? C.dim : C.text });
      T(svg, 8, 330, "depth difference " + diff + " = " + diff.toString(2) + " in binary: " + pc + " one-bit" + (pc === 1 ? "" : "s") + ", so " + pc + " lifting jump" + (pc === 1 ? "" : "s"), { anchor: "start", size: 11, fill: C.teal, weight: 600, mono: false });
      T(svg, 8, 354, "the walk-up method climbs one parent at a time: " + (depth[u] + depth[v] - 2 * depth[lcaNaive()]) + " steps for this pair", { anchor: "start", size: 10, fill: C.faint, mono: false });
    }
    function lcaNaive() { var a = u, b = v; while (depth[a] > depth[b]) a = PAR[a]; while (depth[b] > depth[a]) b = PAR[b]; while (a !== b) { a = PAR[a]; b = PAR[b]; } return a; }
    K.slider(f.controls, "u", 0, n - 1, u, 1, String, function (x) { u = x; build(); sp.reload(); });
    K.slider(f.controls, "v", 0, n - 1, v, 1, String, function (x) { v = x; build(); sp.reload(); });
    K.toggle(f.controls, "table", showT, function (on) { showT = on; draw(sp.pos()); });
    var sp = stepper(f, function () { return tr.length - 1; }, draw);
    build(); draw(0);
    f.say("The table holds 2^k-th ancestors; watch the query jump in powers of two. Pick two deep nodes and check the lifting jumps equal the one-bits of the depth difference.");
  };

  /* ------------------------------------------------------------------------
     dsaRangeTradeoff — ch30 §1. Costs in CPython steps (≈ 40 ns each),
     with bulk passes that run at C speed priced per element: 0.1 for a
     slice sum, 0.2 for a prefix rebuild. That calibration reproduces the
     winners and most of the times in the chapter's measured table. The
     prefix sum rebuilds lazily, before the first query after an update.
     ------------------------------------------------------------------------ */
  VIZ.dsaRangeTradeoff = function (el) {
    var f = frame(el);
    var OPS = 20000, lr = -3, lgN = 5, op = 0;
    var MEAS = [["1 upd : 1000 qry", 2539, 17, 27], ["1 : 1", 1279, 8204, 21], ["1000 upd : 1 qry", 3, 31, 13]];
    function structs(n) {
      var lg = Math.log2(n), sq = Math.sqrt(n);
      return [
        { name: "plain array", upd: 1, qry: 0.1 * n / 3, sum: true, min: true, col: C.orange },
        { name: "prefix sums", upd: 1, qry: 2, rebuild: 0.2 * n, sum: true, min: false, why: "min has no inverse to subtract", col: C.pink },
        { name: "√n blocks", upd: 2, qry: 2 * sq, sum: true, min: true, col: C.sky, unpriced: true },
        { name: "√n blocks, prefixed", upd: 2 * sq, qry: 4, sum: true, min: false, why: "needs subtraction", col: C.purple, unpriced: true },
        { name: "Fenwick tree", upd: lg, qry: 2 * lg, sum: true, min: false, why: "range min is not invertible", col: C.green },
        { name: "segment tree", upd: lg + 1, qry: 2 * lg, sum: true, min: true, col: C.teal },
        { name: "sparse table", upd: 0.2 * n * lg, qry: 2, sum: false, min: true, why: "overlapping halves double-count a sum", col: C.blue }
      ];
    }
    var svg = svgOf(f, 400, "range structures on the update/query plane");
    function render() {
      clear(svg);
      var n = Math.pow(10, lgN), ratio = Math.pow(10, lr), U = Math.round(OPS * ratio / (1 + ratio)), Q = OPS - U, list = structs(n);
      list.forEach(function (s) {
        s.ok = (op === 0 ? s.sum : s.min) && !s.unpriced;
        var rebuilds = s.rebuild ? Math.min(U, Q) : 0;
        s.total = s.rebuild ? U * s.upd + rebuilds * s.rebuild + Q * s.qry : U * s.upd + Q * s.qry;
        s.effUpd = s.rebuild ? s.upd + s.rebuild * (U ? rebuilds / U : 0) : s.upd;
      });
      var ok = list.filter(function (s) { return s.ok; }), best = ok.reduce(function (a, b) { return b.total < a.total ? b : a; });
      T(svg, 8, 14, (op === 0 ? "range sum" : "range min") + " · n = 10" + D.sup(lgN) + " · " + commas(U) + " updates, " + commas(Q) + " queries", { anchor: "start", size: 12, weight: 700 });
      /* the plane: log update cost × log query cost */
      var X0 = 60, X1 = 380, Y0 = 34, Y1 = 250, LMAX = Math.log10(0.2 * n * Math.log2(n)) + 0.3;
      var px = function (c) { return X0 + Math.max(0, Math.log10(c)) / LMAX * (X1 - X0); }, py = function (c) { return Y1 - Math.max(0, Math.log10(c)) / LMAX * (Y1 - Y0); };
      line(svg, X0, Y1, X1, Y1, { stroke: C.line }); line(svg, X0, Y0, X0, Y1, { stroke: C.line });
      T(svg, X1, Y1 + 14, "cost of one update →", { anchor: "end", size: 9.5, fill: C.faint, mono: false });
      T(svg, X0 - 4, Y0 - 6, "↑ one query", { anchor: "start", size: 9.5, fill: C.faint, mono: false });
      var placed = [];
      list.forEach(function (s) {
        var x = px(s.upd + (s.rebuild || 0)), y = py(s.qry), ly = y - 8;
        while (placed.some(function (p) { return Math.abs(p[0] - x) < 90 && Math.abs(p[1] - ly) < 11; })) ly += 12;
        placed.push([x, ly]);
        var shown = s.ok || (s.unpriced && (op === 0 ? s.sum : s.min));
        S("circle", { cx: x, cy: y, r: s === best ? 8 : 6, fill: shown ? s.col : C.faint, opacity: s.ok ? 0.85 : shown ? 0.5 : 0.3, stroke: s === best ? C.text : "none", "stroke-width": 2 }, svg);
        T(svg, x > 300 ? x - 10 : x + 10, ly, s.name, { anchor: x > 300 ? "end" : "start", size: 9, fill: shown ? C.text : C.faint, mono: false });
      });
      /* the workload bill */
      var RX = 410, top = Math.log10(Math.max.apply(null, ok.map(function (s) { return s.total; })));
      T(svg, RX, 34, "total for this workload (log scale)", { anchor: "start", size: 9.5, fill: C.faint, mono: false });
      list.forEach(function (s, i) {
        var y = 44 + i * 30;
        T(svg, RX, y + 7, s.name, { anchor: "start", size: 10, mono: false, fill: s.ok ? (s === best ? C.green : C.text) : C.faint, weight: s === best ? 700 : 400 });
        if (!s.ok) { T(svg, RX, y + 20, s.unpriced && (op === 0 ? s.sum : s.min) ? "plotted, not priced: the chapter did not time it" : "n/a: " + s.why, { anchor: "start", size: 8.5, fill: C.faint, mono: false }); return; }
        var w = 200 * Math.max(0.02, Math.log10(Math.max(10, s.total)) / top);
        S("rect", { x: RX + 132, y: y, width: w * 0.6, height: 12, rx: 3, fill: s === best ? C.green : s.col, opacity: 0.7 }, svg);
        T(svg, 752, y + 7, "≈ " + ms(s.total), { anchor: "end", size: 10, weight: 600, fill: s === best ? C.green : C.text });
      });
      function ms(units) { var t = units * 40e-6; return t >= 1000 ? (t / 1000).toFixed(1) + " s" : t >= 10 ? Math.round(t) + " ms" : t.toFixed(1) + " ms"; }
      /* the chapter's measurement */
      T(svg, 8, 284, "chapter §1, measured in CPython on n = 10⁵, 20,000 operations (ms):  plain / prefix / Fenwick", { anchor: "start", size: 9.5, fill: C.faint, mono: false });
      MEAS.forEach(function (m, i) {
        T(svg, 8 + i * 250, 304, m[0] + ":", { anchor: "start", size: 10, fill: C.dim, mono: false });
        T(svg, 8 + i * 250, 322, commas(m[1]) + " / " + commas(m[2]) + " / " + commas(m[3]), { anchor: "start", size: 11, weight: 700 });
      });
      T(svg, 8, 350, "winner here: " + best.name, { anchor: "start", size: 13, weight: 700, fill: C.green, mono: false });
      T(svg, 8, 374, "one CPython step ≈ 40 ns; bulk passes run at C speed (0.1 step an element to sum a slice, 0.2 to rebuild prefixes) — calibrated on the table above", { anchor: "start", size: 9, fill: C.faint, mono: false });
    }
    K.slider(f.controls, "updates : queries", -3, 3, lr, 0.5, function (v) { var r = Math.pow(10, v); return r >= 1 ? commas(r) + " : 1" : "1 : " + commas(1 / r); }, function (v) { lr = v; render(); });
    K.slider(f.controls, "n", 3, 7, lgN, 1, function (v) { return "10" + D.sup(v); }, function (v) { lgN = v; render(); });
    K.tabs(f.controls, ["sum", "min"], 0, function (k) { op = k; render(); });
    render();
    f.say("Each dot is a structure. Set the workload to one update per thousand queries and find the winner; then invert the ratio and find it change.");
  };

  /* ------------------------------------------------------------------------
     dsaSegTree — ch31 §1, SegTree.query's three cases: disjoint, covering,
     partial. Root at 1, children 2v and 2v + 1.
     ------------------------------------------------------------------------ */
  VIZ.dsaSegTree = function (el) {
    var f = frame(el);
    var OPS = [["sum", function (a, b) { return a + b; }, 0], ["min", Math.min, Infinity], ["max", Math.max, -Infinity], ["gcd", function (a, b) { while (b) { var t = a % b; a = b; b = t; } return Math.abs(a); }, 0]];
    var a = [5, 3, 8, 6, 1, 4, 7, 2], oi = 0, ql = 1, qr = 6, t = [], drag = null;
    function build() {
      var op = OPS[oi][1]; t = [];
      (function b(v, l, r) { if (l === r) { t[v] = a[l]; return; } var m = (l + r) >> 1; b(2 * v, l, m); b(2 * v + 1, m + 1, r); t[v] = op(t[2 * v], t[2 * v + 1]); })(1, 0, a.length - 1);
    }
    function query() {
      var op = OPS[oi][1], e = OPS[oi][2], kind = {}, cover = [];
      var ans = (function q(v, l, r) {
        if (qr < l || r < ql) { kind[v] = "disjoint"; return e; }
        if (ql <= l && r <= qr) { kind[v] = "cover"; cover.push([l, r, t[v]]); return t[v]; }
        kind[v] = "partial"; var m = (l + r) >> 1;
        return op(q(2 * v, l, m), q(2 * v + 1, m + 1, r));
      })(1, 0, a.length - 1);
      return { kind: kind, cover: cover, ans: ans };
    }
    var svg = S("svg", { viewBox: "0 0 760 360", width: "100%", role: "group", "aria-label": "segment tree: drag across the index row to set the query, click a leaf to change it" }, f.body);
    function render() {
      clear(svg);
      build();
      var n = a.length, Q = query(), levels = Math.ceil(Math.log2(n)) + 1, X0 = 12, W = 670 / n, H = 54, perLevel = [];
      T(svg, 8, 14, OPS[oi][0] + " over [" + ql + ", " + qr + "] = " + (Q.ans === Infinity || Q.ans === -Infinity ? "—" : Q.ans) + " · visited " + Object.keys(Q.kind).length + " nodes", { anchor: "start", size: 12.5, weight: 700 });
      (function d(v, l, r, lev) {
        var x = X0 + l * W, w = (r - l + 1) * W, y = 30 + lev * H, k = Q.kind[v];
        perLevel[lev] = perLevel[lev] || 0; if (k === "partial") perLevel[lev]++;
        rect(svg, x + 2, y, w - 4, 34, { rx: 5, fill: k === "cover" ? C.green : k === "partial" ? C.orange : C.card, op: k === "cover" || k === "partial" ? 0.35 : 1, stroke: k ? (k === "disjoint" ? C.faint : k === "cover" ? C.green : C.orange) : C.line, sw: k && k !== "disjoint" ? 2 : 1, dash: k === "disjoint" ? "3 3" : "none" });
        T(svg, x + w / 2, y + 11, "[" + l + "," + r + "]", { size: 8.5, fill: C.faint });
        T(svg, x + w / 2, y + 25, String(t[v]), { size: 11.5, weight: 700 });
        if (l === r) {
          var hit = S("rect", { x: x + 2, y: y, width: w - 4, height: 34, fill: "transparent" }, svg);
          var bump = function () { a[l] = (a[l] + 1) % 10; render(); f.say("Point update: a[" + l + "] = " + a[l] + ". One root-to-leaf path is recomputed."); };
          hit.addEventListener("click", bump); focusable(hit, "leaf " + l + " value " + a[l] + ", click to add one", bump);
          return;
        }
        var m = (l + r) >> 1; d(2 * v, l, m, lev + 1); d(2 * v + 1, m + 1, r, lev + 1);
      })(1, 0, n - 1, 0);
      perLevel.forEach(function (c, lev) { T(svg, 752, 30 + lev * H + 17, c + " partial", { anchor: "end", size: 9, fill: c > 2 ? C.pink : C.orange, weight: 600 }); });
      /* the index row, draggable */
      var iy = 30 + levels * H + 4;
      svg.setAttribute("viewBox", "0 0 760 " + (iy + 76));
      for (var i = 0; i < n; i++) {
        var inQ = i >= ql && i <= qr;
        var cell = rect(svg, X0 + i * W + 2, iy, W - 4, 22, { rx: 4, fill: inQ ? C.blue : C.card, op: inQ ? 0.3 : 1, stroke: C.line });
        T(svg, X0 + i * W + W / 2, iy + 11, String(i), { size: 10, fill: C.dim });
        (function (i2, node) {
          node.style.cursor = "ew-resize";
          node.addEventListener("pointerdown", function (e) { drag = i2; ql = qr = i2; render(); e.preventDefault(); });
          node.addEventListener("pointerenter", function () { if (drag === null) return; ql = Math.min(drag, i2); qr = Math.max(drag, i2); render(); });
        })(i, cell);
      }
      T(svg, 8, iy + 42, "answer = " + Q.cover.map(function (c) { return c[2]; }).join(" " + (oi === 0 ? "+" : "∘") + " ") + " from covering nodes " + Q.cover.map(function (c) { return "[" + c[0] + "," + c[1] + "]"; }).join(" "), { anchor: "start", size: 11, weight: 600, fill: C.green });
      T(svg, 8, iy + 64, "green: covering, stops · orange: partial, recurses · dashed: disjoint, returns the identity · drag across the index row", { anchor: "start", size: 9.5, fill: C.faint, mono: false });
    }
    window.addEventListener("pointerup", function () { drag = null; });
    K.tabs(f.controls, OPS.map(function (o) { return o[0]; }), 0, function (k) { oi = k; render(); });
    K.slider(f.controls, "l", 0, 15, ql, 1, String, function (x) { ql = Math.min(x, a.length - 1); if (qr < ql) qr = ql; render(); });
    K.slider(f.controls, "r", 0, 15, qr, 1, String, function (x) { qr = Math.min(x, a.length - 1); if (ql > qr) ql = qr; render(); });
    K.tabs(f.controls, ["n = 8", "n = 16"], 0, function (k) { a = k ? [5, 3, 8, 6, 1, 4, 7, 2, 9, 2, 6, 5, 3, 5, 8, 9] : [5, 3, 8, 6, 1, 4, 7, 2]; ql = Math.min(ql, a.length - 1); qr = Math.min(qr, a.length - 1); render(); });
    render();
    f.say("Drag a range across the index row. The highlighted nodes are the ones that answer it: count the partial ones per level, and try to find a range with three.");
  };

  /* ------------------------------------------------------------------------
     dsaLazyProp — ch31 §3, _apply and _push with the (assign, add) tag.
     Each step of an operation is one node visit, push-down or tag.
     ------------------------------------------------------------------------ */
  VIZ.dsaLazyProp = function (el) {
    var f = frame(el);
    var N = 8, sm = [], lz = [], a0 = [1, 2, 3, 4, 5, 6, 7, 8], kind = 0, ql = 0, qr = 7, val = 5, tr = [], showPending = true, log = [];
    function init() { sm = []; lz = []; (function b(v, l, r) { lz[v] = [null, 0]; if (l === r) { sm[v] = a0[l]; return; } var m = (l + r) >> 1; b(2 * v, l, m); b(2 * v + 1, m + 1, r); sm[v] = sm[2 * v] + sm[2 * v + 1]; })(1, 0, N - 1); tr = [snap(null, "Pick an operation and press go.")]; }
    function snap(v, msg, ev) { return { sm: sm.slice(), lz: lz.map(function (x) { return x ? x.slice() : x; }), v: v, msg: msg, ev: ev }; }
    function apply(v, l, r, tag) {
      var asg = tag[0], add = tag[1];
      if (asg !== null) sm[v] = asg * (r - l + 1);
      sm[v] += add * (r - l + 1);
      if (asg !== null) lz[v] = [asg, add]; else lz[v] = [lz[v][0], lz[v][1] + add];
    }
    function tagStr(tg) { return !tg || (tg[0] === null && !tg[1]) ? "" : (tg[0] !== null ? "=" + tg[0] : "") + (tg[1] ? (tg[1] > 0 ? "+" : "") + tg[1] : ""); }
    function push(v, l, r) {
      if (lz[v][0] === null && lz[v][1] === 0) return false;
      var m = (l + r) >> 1, tg = lz[v]; apply(2 * v, l, m, tg); apply(2 * v + 1, m + 1, r, tg); lz[v] = [null, 0];
      tr.push(snap(v, "push-down at [" + l + "," + r + "]: its note " + tagStr(tg) + " is paid to both children and cleared", "push"));
      return true;
    }
    function go() {
      tr = [snap(null, (kind === 2 ? "query sum" : kind === 0 ? "add " + val + " to" : "assign " + val + " to") + " [" + ql + ", " + qr + "]")];
      var res = (function rec(v, l, r) {
        if (qr < l || r < ql) return 0;
        if (ql <= l && r <= qr) {
          if (kind === 2) { tr.push(snap(v, "[" + l + "," + r + "] is covered: its own sum " + sm[v] + " is correct, whatever its children say", "cover")); return sm[v]; }
          apply(v, l, r, kind === 0 ? [null, val] : [val, 0]);
          tr.push(snap(v, "[" + l + "," + r + "] is covered: update its sum to " + sm[v] + " and leave the note " + tagStr(lz[v]) + " for its children", "tag"));
          return 0;
        }
        tr.push(snap(v, "[" + l + "," + r + "] is partial: it must look below", "partial"));
        push(v, l, r);
        var m = (l + r) >> 1, s = rec(2 * v, l, m) + rec(2 * v + 1, m + 1, r);
        if (kind !== 2) { sm[v] = sm[2 * v] + sm[2 * v + 1]; tr.push(snap(v, "[" + l + "," + r + "] recomputes its sum from its children: " + sm[v], "pull")); }
        return s;
      })(1, 0, N - 1);
      var touched = tr.filter(function (x) { return x.ev; }).length, pushes = tr.filter(function (x) { return x.ev === "push"; }).length;
      tr.push(snap(null, (kind === 2 ? "sum = " + res + " · " : "") + touched + " node events, " + pushes + " push-down" + (pushes === 1 ? "" : "s") + " — no leaf below a covering node was touched", "done"));
      log.unshift((kind === 2 ? "sum" : kind === 0 ? "add " + val : "assign " + val) + " [" + ql + "," + qr + "]" + (kind === 2 ? " = " + res : "")); log = log.slice(0, 4);
      sp.reload(); sp.go(1);
    }
    var svg = svgOf(f, 330, "segment tree with lazy tags");
    function draw(k) {
      clear(svg);
      var s = tr[Math.min(k, tr.length - 1)], X0 = 20, W = 720 / N, H = 56;
      T(svg, 8, 14, "range add / assign and range sum over 8 elements · step " + k + " of " + (tr.length - 1), { anchor: "start", size: 12, weight: 700 });
      (function d(v, l, r, lev, owed) {
        var x = X0 + l * W, w = (r - l + 1) * W, y = 30 + lev * H, cur = v === s.v, tg = s.lz[v], pending = tg && (tg[0] !== null || tg[1]);
        var stale = owed;
        rect(svg, x + 2, y, w - 4, 38, { rx: 5, fill: cur ? (s.ev === "push" ? C.orange : s.ev === "tag" ? C.blue : s.ev === "cover" ? C.green : C.sky) : C.card, op: cur ? 0.35 : 1, stroke: stale ? C.pink : C.line, sw: stale ? 1.8 : 1, dash: stale ? "4 3" : "none" });
        T(svg, x + w / 2, y + 11, "[" + l + "," + r + "]", { size: 8.5, fill: C.faint });
        T(svg, x + w / 2, y + 26, String(s.sm[v]), { size: 11.5, weight: 700, fill: stale ? C.pink : C.text });
        if (showPending && pending) { rect(svg, x + w - 34, y - 6, 30, 14, { rx: 3, fill: C.orange, op: 0.9, stroke: "none" }); T(svg, x + w - 19, y + 1, tagStr(tg), { size: 8.5, weight: 700, fill: C.card }); }
        if (l === r) return;
        var m = (l + r) >> 1; d(2 * v, l, m, lev + 1, owed || pending); d(2 * v + 1, m + 1, r, lev + 1, owed || pending);
      })(1, 0, N - 1, 0, false);
      wrap(svg, 8, 262, s.msg, 744, { size: 11.5, fill: s.ev === "push" ? C.orange : s.ev === "done" ? C.green : C.text });
      T(svg, 8, 300, "orange tag: a pending note · dashed pink: a value that is stale until an ancestor's note is pushed", { anchor: "start", size: 9.5, fill: C.faint, mono: false });
      T(svg, 8, 318, log.length ? "history: " + log.join("  ←  ") : "", { anchor: "start", size: 9.5, fill: C.dim });
    }
    K.tabs(f.controls, ["add", "assign", "query sum"], 0, function (k) { kind = k; });
    K.slider(f.controls, "l", 0, 7, ql, 1, String, function (x) { ql = x; if (qr < ql) qr = ql; });
    K.slider(f.controls, "r", 0, 7, qr, 1, String, function (x) { qr = x; if (ql > qr) ql = qr; });
    K.slider(f.controls, "value", -5, 9, val, 1, String, function (x) { val = x; });
    f.btn("go ▸▸", go);
    K.toggle(f.controls, "show pending", showPending, function (on) { showPending = on; draw(sp.pos()); });
    f.btn("new array", function () { init(); log = []; sp.reload(); });
    var sp = stepper(f, function () { return tr.length - 1; }, draw);
    init(); draw(0);
    f.say("An update leaves notes instead of doing the work. Add 5 to [0, 7], then query [0, 1] and step: find the node where the note is cashed in.");
  };

  /* ------------------------------------------------------------------------
     dsaMosAlgorithm — ch31 §6. Pointers start on the empty window
     (l = 0, r = −1); moving them one index is one move.
     ------------------------------------------------------------------------ */
  VIZ.dsaMosAlgorithm = function (el) {
    var f = frame(el);
    var N = 48, B = 8, ORD = ["arrival", "Mo's", "Mo's, odd-even"], oi = 1, qs = [], tr = [], rnd = lcg(31);
    function gen() { qs = []; for (var i = 0; i < 14; i++) { var l = rnd(N), r = rnd(N); if (l > r) { var t = l; l = r; r = t; } qs.push([l, r, i]); } }
    function order(o) {
      var s = qs.slice();
      if (o === 1) s.sort(function (x, y) { return Math.floor(x[0] / B) - Math.floor(y[0] / B) || x[1] - y[1]; });
      if (o === 2) s.sort(function (x, y) { var bx = Math.floor(x[0] / B), by = Math.floor(y[0] / B); return bx - by || (bx % 2 ? y[1] - x[1] : x[1] - y[1]); });
      return s;
    }
    function moves(s) { var l = 0, r = -1, tot = 0, out = [{ l: l, r: r, tot: 0 }]; s.forEach(function (q) { tot += Math.abs(q[0] - l) + Math.abs(q[1] - r); l = q[0]; r = q[1]; out.push({ l: l, r: r, tot: tot, q: q }); }); return out; }
    function build() { tr = moves(order(oi)); }
    var svg = svgOf(f, 360, "Mo's algorithm: queries as points and the pointer path");
    function draw(k) {
      clear(svg);
      var s = tr[k], ord = order(oi), X0 = 50, Y0 = 34, S2 = 220 / N;
      var tots = [0, 1, 2].map(function (o) { var m = moves(order(o)); return m[m.length - 1].tot; });
      T(svg, 8, 14, ORD[oi] + " order · block " + B + " · query " + k + " of " + qs.length + " · moves " + s.tot, { anchor: "start", size: 12, weight: 700 });
      var px = function (l) { return X0 + l * S2 * 1.5; }, py = function (r) { return Y0 + 220 - r * S2; };
      for (var b = 0; b <= N; b += B) { line(svg, px(b), Y0, px(b), Y0 + 220, { stroke: C.line, dash: "2 4" }); }
      line(svg, X0, Y0 + 220, px(N), Y0 + 220, { stroke: C.faint }); line(svg, X0, Y0, X0, Y0 + 220, { stroke: C.faint });
      T(svg, px(N), Y0 + 234, "left end l →  (bands = blocks of " + B + ")", { anchor: "end", size: 9, fill: C.faint, mono: false });
      T(svg, X0 - 6, Y0 - 8, "↑ right end r", { anchor: "start", size: 9, fill: C.faint, mono: false });
      var d = "M " + px(0) + " " + py(0);
      ord.slice(0, k).forEach(function (q) { d += " L " + px(q[0]) + " " + py(q[1]); });
      S("path", { d: d, fill: "none", stroke: C.orange, "stroke-width": 1.8, opacity: 0.8 }, svg);
      qs.forEach(function (q) { var done = ord.indexOf(q) < k; S("circle", { cx: px(q[0]), cy: py(q[1]), r: 4.5, fill: done ? C.orange : C.blue, opacity: 0.85 }, svg); });
      /* the array with the current window */
      var AX = 440, aw = 300 / N;
      T(svg, AX, 44, "window [l, r] on the array", { anchor: "start", size: 9.5, fill: C.faint, mono: false });
      for (var i = 0; i < N; i++) S("rect", { x: AX + i * aw, y: 52, width: aw - 0.6, height: 16, fill: i >= s.l && i <= s.r ? C.blue : C.card, opacity: i >= s.l && i <= s.r ? 0.6 : 1 }, svg);
      [0, 1, 2].forEach(function (o, j) {
        var y = 100 + j * 36, w = 280 * tots[o] / Math.max.apply(null, tots);
        T(svg, AX, y, ORD[o] + ": " + commas(tots[o]) + " moves", { anchor: "start", size: 10.5, weight: o === oi ? 700 : 400, mono: false });
        S("rect", { x: AX, y: y + 6, width: w, height: 10, rx: 3, fill: o === oi ? C.orange : C.faint, opacity: 0.7 }, svg);
      });
      /* block-size sweep */
      var sweep = [], bb; for (bb = 1; bb <= N; bb++) { var keep = B; B = bb; var m = moves(order(1)); sweep.push(m[m.length - 1].tot); B = keep; }
      var smax = Math.max.apply(null, sweep), bestB = sweep.indexOf(Math.min.apply(null, sweep)) + 1;
      T(svg, AX, 222, "Mo's moves by block size 1 … " + N + " (best " + bestB + ")", { anchor: "start", size: 9.5, fill: C.faint, mono: false });
      var dd = ""; sweep.forEach(function (v, j) { dd += (j ? " L " : "M ") + (AX + j * 300 / N).toFixed(1) + " " + (290 - 56 * v / smax).toFixed(1); });
      S("path", { d: dd, fill: "none", stroke: C.teal, "stroke-width": 1.8 }, svg);
      S("circle", { cx: AX + (B - 1) * 300 / N, cy: 290 - 56 * sweep[B - 1] / smax, r: 4, fill: C.orange }, svg);
      T(svg, 8, 290, s.q ? "query " + (s.q[2] + 1) + " = [" + s.q[0] + ", " + s.q[1] + "]: the window slides there one index at a time" : "Queries arrive in the order they are listed; Mo's reorders them first.", { anchor: "start", size: 11, mono: false });
      T(svg, 8, 314, "n / √Q ≈ " + (N / Math.sqrt(qs.length)).toFixed(1) + " is the textbook block; inside a band the right end only climbs", { anchor: "start", size: 9.5, fill: C.faint, mono: false });
    }
    K.tabs(f.controls, ORD, oi, function (k) { oi = k; build(); sp.go(qs.length); });
    K.slider(f.controls, "block", 1, 48, B, 1, String, function (v) { B = v; build(); sp.go(qs.length); });
    f.btn("new queries", function () { gen(); build(); sp.go(qs.length); });
    var sp = stepper(f, function () { return qs.length; }, draw);
    gen(); build(); sp.go(qs.length);
    f.say("Same queries, different order. The counter is total pointer movement: compare arrival order with Mo's, then slide the block size to find the minimum.");
  };
})();
