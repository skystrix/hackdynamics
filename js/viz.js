/* ==========================================================================
   viz.js — interactive visualizations, Part I (storage engines)
   Every visualization is a mount function registered on window.VIZ under a
   name referenced from bookData (`viz: "btree"` etc.). Each receives the
   .viz frame element and builds its own SVG/canvas + controls inside it.
   All hand-rolled: SVG for structural diagrams, canvas for particle-ish sims.
   ========================================================================== */

(function () {
  "use strict";
  window.VIZ = window.VIZ || {};

  /* ---------- tiny shared helpers ---------- */

  var NS = "http://www.w3.org/2000/svg";
  var C = { cyan: "#2de2ff", blue: "#4f7cff", gold: "#ffd166", red: "#ff5d73",
            green: "#3ddc97", dim: "#7d8fb0", line: "#1c2a45", bg: "#0c1220", text: "#c9d6ea" };

  // Create an SVG element with attributes, optionally appended to a parent.
  function S(tag, attrs, parent) {
    var e = document.createElementNS(NS, tag);
    for (var k in attrs) e.setAttribute(k, attrs[k]);
    if (parent) parent.appendChild(e);
    return e;
  }
  // SVG text helper (centered by default).
  function T(parent, x, y, str, opts) {
    opts = opts || {};
    var t = S("text", {
      x: x, y: y, fill: opts.fill || C.text,
      "font-size": opts.size || 13, "font-family": "ui-monospace,Menlo,monospace",
      "text-anchor": opts.anchor || "middle", "dominant-baseline": "middle"
    }, parent);
    t.textContent = str;
    return t;
  }
  function div(cls, html) {
    var d = document.createElement("div");
    d.className = cls || "";
    if (html) d.innerHTML = html;
    return d;
  }

  // Standard frame inside a .viz element: body (drawing) + controls + note.
  function frame(el) {
    var mount = el.querySelector(".viz-mount");
    var body = div("viz-body"), controls = div("viz-controls"), note = div("viz-note");
    mount.appendChild(body); mount.appendChild(controls); mount.appendChild(note);
    return {
      body: body, controls: controls, note: note,
      btn: function (label, fn) {
        var b = document.createElement("button");
        b.textContent = label;
        b.addEventListener("click", fn);
        controls.appendChild(b);
        return b;
      },
      say: function (msg) { note.textContent = msg; }
    };
  }

  // Hover/tap tooltip binding for any SVG/DOM node (uses window.vizTip from app.js).
  function tipOn(node, title, bodyHtml) {
    function show(e) {
      var p = e.touches ? e.touches[0] : e;
      vizTip.show(p.clientX, p.clientY, title, bodyHtml);
    }
    node.addEventListener("mousemove", show);
    node.addEventListener("mouseleave", vizTip.hide);
    node.addEventListener("touchstart", function (e) { show(e); e.stopPropagation(); }, { passive: true });
    document.addEventListener("touchstart", vizTip.hide, { passive: true });
    node.style.cursor = "pointer";
  }

  /* ========================================================================
     1. DBMS ARCHITECTURE — layered stack, hover each component
     ======================================================================== */
  VIZ.dbmsArch = function (el) {
    var f = frame(el);
    var svg = S("svg", { viewBox: "0 0 700 360" }, f.body);
    var layers = [
      { y: 10,  h: 50, label: "Transport — client sessions & cluster communication", color: C.blue,
        tip: ["Transport", "Accepts client connections, speaks the wire protocol, and (in a cluster) relays messages between nodes. Queries enter the system here."] },
      { y: 70,  h: 78, label: "Query Processor", color: C.cyan,
        tip: ["Query Processor", "Parses and validates the query, then the optimizer rewrites it and picks the cheapest execution plan using statistics and knowledge of data placement."],
        subs: [["Parser", "Checks syntax, resolves table/column names, verifies permissions."],
               ["Optimizer", "Chooses join order, access methods, and index usage — cost-based, driven by internal statistics."]] },
      { y: 158, h: 50, label: "Execution Engine — carries out the plan", color: C.gold,
        tip: ["Execution Engine", "Executes the plan: local reads/writes go to the storage engine; remote ones are shipped to other nodes."] },
      { y: 218, h: 130, label: "Storage Engine", color: C.green,
        tip: ["Storage Engine", "The component this journey is about: it owns how data physically lives on disk and in memory."],
        subs: [["Transaction Manager", "Schedules transactions; makes sure the database can't reach a logically inconsistent state."],
               ["Lock Manager", "Locks objects so concurrent transactions don't violate physical integrity."],
               ["Access Methods", "The on-disk structures themselves: heap files, B-Trees, LSM-Trees."],
               ["Buffer Manager", "Caches disk pages in memory to avoid repeated I/O."],
               ["Recovery Manager", "Keeps the write-ahead log and restores state after a crash."]] }
    ];
    layers.forEach(function (L) {
      var g = S("g", {}, svg);
      var r = S("rect", { x: 40, y: L.y, width: 620, height: L.h, rx: 10,
        fill: C.bg, stroke: L.color, "stroke-width": 1.5 }, g);
      T(g, 350, L.y + (L.subs ? 16 : L.h / 2), L.label, { fill: L.color, size: 14 });
      tipOn(r, L.tip[0], L.tip[1]);
      if (L.subs) {
        var w = 600 / L.subs.length;
        L.subs.forEach(function (s, i) {
          var sx = 50 + i * w;
          var sr = S("rect", { x: sx, y: L.y + 26, width: w - 8, height: L.h - 36, rx: 7,
            fill: "#111a2e", stroke: C.line }, g);
          // wrap two-word names on two lines if narrow
          var words = s[0].split(" ");
          if (words.length > 1 && w < 130) {
            T(g, sx + (w - 8) / 2, L.y + 26 + (L.h - 36) / 2 - 8, words[0], { size: 11 });
            T(g, sx + (w - 8) / 2, L.y + 26 + (L.h - 36) / 2 + 8, words.slice(1).join(" "), { size: 11 });
          } else {
            T(g, sx + (w - 8) / 2, L.y + 26 + (L.h - 36) / 2, s[0], { size: 11.5 });
          }
          tipOn(sr, s[0], s[1]);
        });
      }
    });
    // downward "query path" arrow
    S("path", { d: "M 20 20 L 20 330 L 14 318 M 20 330 L 26 318", stroke: C.cyan,
      "stroke-width": 2, fill: "none", opacity: 0.6 }, svg);
    T(svg, 20, 348, "query path", { fill: C.dim, size: 10 });
    f.say("Hover or tap any component to see what it does. A query travels top → bottom.");
  };

  /* ========================================================================
     2. ROW vs COLUMN LAYOUT — how the same table serializes to disk
     ======================================================================== */
  VIZ.rowcol = function (el) {
    var f = frame(el);
    var svg = S("svg", { viewBox: "0 0 700 330" }, f.body);
    var cols = ["id", "symbol", "date", "price"];
    var rows = [
      ["1", "AAPL", "07-11", "213.4"],
      ["2", "MSFT", "07-11", "504.1"],
      ["3", "AAPL", "07-12", "215.0"],
      ["4", "MSFT", "07-12", "500.7"]
    ];
    var mode = "row", queryOn = false;

    function render() {
      svg.innerHTML = "";
      T(svg, 350, 16, "logical table", { fill: C.dim, size: 11 });
      // logical table grid
      var cw = 90, x0 = 350 - (cw * 4) / 2;
      cols.forEach(function (c, j) { T(svg, x0 + j * cw + cw / 2, 36, c, { fill: C.gold, size: 12 }); });
      rows.forEach(function (r, i) {
        r.forEach(function (v, j) {
          S("rect", { x: x0 + j * cw, y: 48 + i * 26, width: cw - 4, height: 22, rx: 4,
            fill: C.bg, stroke: C.line }, svg);
          T(svg, x0 + j * cw + cw / 2 - 2, 59 + i * 26, v, { size: 11 });
        });
      });
      // arrow
      S("path", { d: "M 350 162 L 350 186 M 344 176 L 350 186 L 356 176",
        stroke: C.cyan, "stroke-width": 2, fill: "none" }, svg);
      T(svg, 350, 200, mode === "row" ? "row-oriented file: values of one ROW are adjacent"
                                      : "column-oriented file: values of one COLUMN are adjacent",
        { fill: C.cyan, size: 12 });

      // the flattened on-disk strip: 16 cells in storage order
      var cells = [];
      if (mode === "row") rows.forEach(function (r, i) { r.forEach(function (v, j) { cells.push({ v: v, col: j, row: i }); }); });
      else cols.forEach(function (c, j) { rows.forEach(function (r, i) { cells.push({ v: r[j], col: j, row: i }); }); });

      var bw = 660 / 16;
      cells.forEach(function (cell, k) {
        var isPrice = cell.col === 3;
        var hot = queryOn && isPrice;
        S("rect", { x: 20 + k * bw, y: 218, width: bw - 3, height: 34, rx: 4,
          fill: hot ? "rgba(255,209,102,.18)" : C.bg,
          stroke: hot ? C.gold : (["#4f7cff", "#2de2ff", "#3ddc97", "#ffd166"])[cell.col],
          "stroke-width": hot ? 2 : 1 }, svg);
        T(svg, 20 + k * bw + (bw - 3) / 2, 235, cell.v, { size: 9.5, fill: hot ? C.gold : C.text });
      });
      T(svg, 350, 272, "storage order →", { fill: C.dim, size: 10 });

      if (queryOn) {
        // show how many disk "touches" the aggregate needs in each layout
        var touches = mode === "row" ? "must scan the WHOLE strip — price values are scattered every 4th cell"
                                     : "reads ONE contiguous range — prices sit together";
        T(svg, 350, 300, "SELECT AVG(price):  " + touches, { fill: C.gold, size: 12 });
      }
    }
    f.btn("row-oriented", function () { mode = "row"; render(); });
    f.btn("column-oriented", function () { mode = "column"; render(); });
    f.btn("run SELECT AVG(price)", function () { queryOn = true; render(); });
    f.say("Toggle the layout, then run the analytical query and compare which bytes must be read.");
    render();
  };

  /* ========================================================================
     3. B-TREE — insert keys, watch nodes split (order-4 B-Tree)
     ======================================================================== */
  VIZ.btree = function (el) {
    var f = frame(el);
    var svg = S("svg", { viewBox: "0 0 700 340" }, f.body);
    var MAXK = 3; // order-4: max 3 keys per node
    var root, touched, lastMsg;

    function Node(leaf) { return { keys: [], kids: [], leaf: leaf, id: Math.random() }; }
    function reset() { root = Node(true); touched = {}; render(); f.say("Empty tree. Insert some keys!"); }

    // classic preemptive-split insertion (split any full node on the way down)
    function splitChild(parent, i) {
      var child = parent.kids[i], right = Node(child.leaf);
      var mid = 1; // with MAXK=3, promote keys[1]
      right.keys = child.keys.splice(mid + 1);
      var up = child.keys.pop();
      if (!child.leaf) right.kids = child.kids.splice(mid + 1);
      parent.keys.splice(i, 0, up);
      parent.kids.splice(i + 1, 0, right);
      touched[child.id] = touched[right.id] = touched[parent.id] = true;
      lastMsg = "Node overflow! Key " + up + " promoted to the parent; node split in two.";
    }
    function insert(k) {
      lastMsg = "Inserted " + k + ".";
      if (root.keys.length === MAXK) {
        var nr = Node(false);
        nr.kids.push(root);
        splitChild(nr, 0);
        root = nr;
        lastMsg = "Root was full — tree grew one level taller (B-Trees grow at the ROOT).";
      }
      var n = root;
      while (true) {
        touched[n.id] = true;
        if (n.leaf) {
          if (n.keys.indexOf(k) !== -1) { lastMsg = k + " already exists."; return; }
          var i = n.keys.findIndex(function (x) { return x > k; });
          n.keys.splice(i === -1 ? n.keys.length : i, 0, k);
          return;
        }
        var i2 = n.keys.findIndex(function (x) { return k < x; });
        if (i2 === -1) i2 = n.keys.length;
        if (n.kids[i2].keys.length === MAXK) { splitChild(n, i2); continue; } // re-choose after split
        n = n.kids[i2];
      }
    }

    // layout: post-order width computation, then draw
    function render() {
      svg.innerHTML = "";
      var KW = 26, PAD = 14, LH = 78;
      function width(n) {
        var own = n.keys.length * KW + 10;
        if (n.leaf) return own;
        var sum = 0;
        n.kids.forEach(function (c) { sum += width(c) + PAD; });
        return Math.max(own, sum - PAD);
      }
      function draw(n, x, y, w) {
        var own = n.keys.length * KW + 10;
        var nx = x + w / 2 - own / 2;
        if (!n.leaf) {
          var cx = x;
          n.kids.forEach(function (c) {
            var cw = width(c);
            S("line", { x1: x + w / 2, y1: y + 30, x2: cx + cw / 2, y2: y + LH,
              stroke: C.line, "stroke-width": 1.5 }, svg);
            draw(c, cx, y + LH, cw);
            cx += cw + PAD;
          });
        }
        var hot = touched[n.id];
        var g = S("g", {}, svg);
        S("rect", { x: nx, y: y, width: own, height: 30, rx: 7,
          fill: hot ? "rgba(45,226,255,.15)" : C.bg,
          stroke: hot ? C.cyan : (n.leaf ? C.green : C.blue), "stroke-width": hot ? 2 : 1.4 }, g);
        n.keys.forEach(function (k, i) {
          T(g, nx + 8 + i * KW + KW / 2 - 3, y + 15, k, { size: 12, fill: hot ? C.cyan : C.text });
        });
        tipOn(g, n.leaf ? "Leaf node" : "Internal node",
          n.leaf ? "Holds actual keys (and, in a real database, values or row pointers). All leaves sit at the same depth."
                 : "Holds separator keys that route searches: keys smaller go left of a separator, larger-or-equal go right.");
      }
      var w = Math.max(width(root), 60);
      draw(root, 350 - w / 2, 14, w);
      f.say(lastMsg || "");
    }

    var used = {};
    function randomKey() {
      if (Object.keys(used).length > 85) return null;
      var k; do { k = Math.floor(Math.random() * 99) + 1; } while (used[k]);
      used[k] = true; return k;
    }
    var input = document.createElement("input");
    input.type = "number"; input.placeholder = "key 1–99"; input.min = 1; input.max = 99;
    f.controls.appendChild(input);
    f.btn("insert", function () {
      var k = parseInt(input.value, 10);
      if (!(k >= 1 && k <= 99)) return f.say("Enter a key between 1 and 99.");
      touched = {}; used[k] = true; insert(k); render(); input.value = "";
    });
    f.btn("insert random ×5", function () {
      touched = {};
      for (var i = 0; i < 5; i++) { var k = randomKey(); if (k) insert(k); }
      render();
    });
    f.btn("reset", function () { used = {}; reset(); });
    reset();
    // seed a few keys so the first view isn't empty
    touched = {}; [42, 17, 68, 25, 90, 7].forEach(function (k) { used[k] = true; insert(k); });
    lastMsg = "A small order-4 B-Tree. Keep inserting and watch splits ripple upward.";
    render();
  };

  /* ========================================================================
     4. SLOTTED PAGE — header, slot directory, cells, fragmentation, defrag
     ======================================================================== */
  VIZ.slotted = function (el) {
    var f = frame(el);
    var svg = S("svg", { viewBox: "0 0 700 240" }, f.body);
    var PAGE_X = 20, PAGE_W = 660, HDR_W = 90, SLOT_W = 34;
    var cells = [];   // {id, size, offset, dead}
    var nextId = 1;

    function freeSpace() {
      var used = cells.reduce(function (s, c) { return s + c.size; }, 0);
      var lowest = cells.filter(function (c) { return !c.dead; });
      return PAGE_W - HDR_W - cells.filter(function(c){return !c.dead;}).length * SLOT_W - used;
    }
    function lowestOffset() {
      return cells.length ? Math.min.apply(null, cells.map(function (c) { return c.offset; })) : PAGE_X + PAGE_W;
    }
    function render(msg) {
      svg.innerHTML = "";
      // page outline + header
      S("rect", { x: PAGE_X, y: 30, width: PAGE_W, height: 150, rx: 8, fill: "#060a12", stroke: C.line, "stroke-width": 1.5 }, svg);
      var hdr = S("rect", { x: PAGE_X, y: 30, width: HDR_W, height: 150, fill: "rgba(79,124,255,.12)", stroke: C.blue }, svg);
      T(svg, PAGE_X + HDR_W / 2, 100, "header", { fill: C.blue, size: 11 });
      tipOn(hdr, "Page header", "Fixed-size metadata: magic number, cell count, free-space bounds, sibling links, flags.");

      // slot directory grows LEFT→RIGHT after the header
      var live = cells.filter(function (c) { return !c.dead; });
      live.forEach(function (c, i) {
        var sx = PAGE_X + HDR_W + 6 + i * SLOT_W;
        var s = S("rect", { x: sx, y: 40, width: SLOT_W - 6, height: 24, rx: 4,
          fill: "rgba(45,226,255,.12)", stroke: C.cyan }, svg);
        T(svg, sx + (SLOT_W - 6) / 2, 52, "#" + c.id, { size: 10, fill: C.cyan });
        // pointer line from slot to its cell
        S("path", { d: "M " + (sx + (SLOT_W - 6) / 2) + " 64 C " + (sx + 14) + " 110, " + (c.offset + c.size / 2) + " 90, " + (c.offset + c.size / 2) + " 118",
          stroke: C.cyan, fill: "none", opacity: 0.45, "stroke-dasharray": "3 3" }, svg);
        tipOn(s, "Slot " + c.id, "A small pointer in the slot directory. It stores the cell's offset (" + Math.round(c.offset - PAGE_X) + ") and length (" + c.size + "). Records are referred to by slot ID, so cells can move inside the page without changing their external address.");
      });
      T(svg, PAGE_X + HDR_W + 40, 24, "slot directory →", { fill: C.dim, size: 10, anchor: "start" });

      // cells grow RIGHT→LEFT from the end of the page
      cells.forEach(function (c) {
        var r = S("rect", { x: c.offset, y: 118, width: c.size, height: 52, rx: 5,
          fill: c.dead ? "rgba(125,143,176,.08)" : "rgba(61,220,151,.12)",
          stroke: c.dead ? C.dim : C.green, "stroke-dasharray": c.dead ? "4 3" : "" }, svg);
        T(svg, c.offset + c.size / 2, 144, c.dead ? "✕" : "cell " + c.id, { size: 10, fill: c.dead ? C.dim : C.green });
        tipOn(r, c.dead ? "Dead cell (garbage)" : "Cell " + c.id,
          c.dead ? "This record was deleted. Its bytes remain as fragmentation until the page is defragmented (vacuumed)."
                 : "A variable-size record of " + c.size + " bytes, written into free space claimed from the page's tail.");
      });
      T(svg, PAGE_X + PAGE_W - 30, 24, "← cells", { fill: C.dim, size: 10 });

      // free space annotation
      var slotEnd = PAGE_X + HDR_W + 6 + live.length * SLOT_W;
      var lo = lowestOffset();
      if (lo - slotEnd > 40) {
        T(svg, (slotEnd + lo) / 2, 145, "· · free space · ·", { fill: C.dim, size: 11 });
      }
      T(svg, 350, 205, msg || "", { fill: C.gold, size: 12 });
      T(svg, 350, 225, "free: " + Math.max(0, Math.round(lo - slotEnd)) + " bytes", { fill: C.dim, size: 10 });
    }

    f.btn("insert record", function () {
      var size = 40 + Math.floor(Math.random() * 60);
      var slotEnd = PAGE_X + HDR_W + 6 + (cells.filter(function(c){return !c.dead;}).length + 1) * SLOT_W;
      var lo = lowestOffset();
      if (lo - size < slotEnd) return render("Page full! Delete something or defragment.");
      cells.push({ id: nextId++, size: size, offset: lo - size, dead: false });
      render("Appended a " + size + "-byte cell at the tail of free space; added slot #" + (nextId - 1) + ".");
    });
    f.btn("delete random", function () {
      var live = cells.filter(function (c) { return !c.dead; });
      if (!live.length) return render("Nothing to delete.");
      var v = live[Math.floor(Math.random() * live.length)];
      v.dead = true;
      render("Deleted cell " + v.id + " — only the slot is removed; the bytes become a hole (fragmentation).");
    });
    f.btn("defragment", function () {
      var live = cells.filter(function (c) { return !c.dead; }).sort(function (a, b) { return b.offset - a.offset; });
      var cursor = PAGE_X + PAGE_W;
      live.forEach(function (c) { cursor -= c.size; c.offset = cursor; });
      cells = live.sort(function (a, b) { return a.id - b.id; });
      render("Defragmented: live cells rewritten contiguously, holes reclaimed. Slot IDs didn't change!");
    });
    f.btn("reset", function () { cells = []; nextId = 1; render("Fresh page."); });
    render("An empty slotted page. Insert a few variable-size records.");
  };

  /* ========================================================================
     5. BINARY SEARCH — step through lookup within a sorted node
     ======================================================================== */
  VIZ.binsearch = function (el) {
    var f = frame(el);
    var svg = S("svg", { viewBox: "0 0 700 170" }, f.body);
    var arr = [3, 8, 12, 19, 24, 31, 38, 45, 52, 60, 67, 73, 81, 88, 95];
    var target, lo, hi, mid, doneMsg, steps;

    function start() {
      target = arr[Math.floor(Math.random() * arr.length)];
      if (Math.random() < 0.3) target += 1; // sometimes search a missing key
      lo = 0; hi = arr.length - 1; mid = null; doneMsg = null; steps = 0;
      render();
      f.say("Searching for " + target + ". Click STEP to halve the range.");
    }
    function step() {
      if (doneMsg) return;
      if (lo > hi) { doneMsg = target + " is NOT in the node (" + steps + " comparisons) — descend via the nearest separator."; render(); return; }
      mid = (lo + hi) >> 1; steps++;
      if (arr[mid] === target) doneMsg = "Found " + target + " at index " + mid + " in " + steps + " comparisons (log₂ 15 ≈ 4).";
      else if (arr[mid] < target) lo = mid + 1;
      else hi = mid - 1;
      render();
      if (doneMsg) f.say(doneMsg);
      else f.say("arr[mid]=" + arr[mid] + (arr[mid] < target ? " < " : " > ") + target + " → discard the " + (arr[mid] < target ? "left" : "right") + " half.");
    }
    function render() {
      svg.innerHTML = "";
      var bw = 660 / arr.length;
      arr.forEach(function (v, i) {
        var inRange = i >= lo && i <= hi && !doneMsg;
        var isMid = i === mid;
        var found = doneMsg && isMid && arr[i] === target;
        S("rect", { x: 20 + i * bw, y: 50, width: bw - 5, height: 44, rx: 6,
          fill: found ? "rgba(61,220,151,.2)" : isMid ? "rgba(255,209,102,.18)" : inRange ? "rgba(45,226,255,.08)" : C.bg,
          stroke: found ? C.green : isMid ? C.gold : inRange ? C.cyan : C.line,
          "stroke-width": isMid || found ? 2 : 1 }, svg);
        T(svg, 20 + i * bw + (bw - 5) / 2, 72, v, { size: 13, fill: inRange || found ? C.text : C.dim });
        T(svg, 20 + i * bw + (bw - 5) / 2, 108, i, { size: 9, fill: C.dim });
      });
      if (!doneMsg) {
        if (lo <= hi) {
          T(svg, 20 + lo * bw + (bw - 5) / 2, 32, "lo", { fill: C.cyan, size: 12 });
          T(svg, 20 + hi * bw + (bw - 5) / 2, 32, "hi", { fill: C.cyan, size: 12 });
        }
        if (mid !== null) T(svg, 20 + mid * bw + (bw - 5) / 2, 132, "▲ mid", { fill: C.gold, size: 11 });
      }
      T(svg, 350, 155, "target: " + target + "   comparisons: " + steps, { fill: C.dim, size: 12 });
    }
    f.btn("step", step);
    f.btn("new search", start);
    start();
  };

  /* ========================================================================
     6. PAGE CACHE — CLOCK eviction over 6 frames
     ======================================================================== */
  VIZ.cache = function (el) {
    var f = frame(el);
    var svg = S("svg", { viewBox: "0 0 700 260" }, f.body);
    var N = 6, frames, hand, hits, misses;

    function reset() { frames = Array(N).fill(null); hand = 0; hits = 0; misses = 0; render("Empty cache: " + N + " page frames arranged as a clock."); }

    function request(p) {
      // hit: just set the usage (reference) bit
      for (var i = 0; i < N; i++) {
        if (frames[i] && frames[i].p === p) {
          frames[i].use = 1; hits++;
          return render("HIT — page " + p + " is already cached. Its usage bit is set to 1 (recently used).");
        }
      }
      misses++;
      // miss: sweep the clock hand — clear 1-bits, evict the first 0-bit frame
      var evicted = null, spins = 0;
      while (true) {
        if (!frames[hand]) break;                 // empty frame: use it
        if (frames[hand].use === 0) { evicted = frames[hand].p; break; }
        frames[hand].use = 0;                     // second chance: clear and move on
        hand = (hand + 1) % N; spins++;
        if (spins > 2 * N) break;                 // safety
      }
      frames[hand] = { p: p, use: 1 };
      var slot = hand;
      hand = (hand + 1) % N;
      render("MISS — page " + p + " loaded into frame " + slot +
        (evicted !== null ? " (evicted page " + evicted + ": the hand cleared usage bits until it found one already at 0)." : "."));
    }

    function render(msg) {
      svg.innerHTML = "";
      var cx = 350, cy = 118, R = 82;
      for (var i = 0; i < N; i++) {
        var a = (i / N) * Math.PI * 2 - Math.PI / 2;
        var x = cx + Math.cos(a) * R, y = cy + Math.sin(a) * R;
        var fr = frames[i];
        var g = S("g", {}, svg);
        S("circle", { cx: x, cy: y, r: 28, fill: fr ? "rgba(45,226,255,.1)" : C.bg,
          stroke: fr ? C.cyan : C.line, "stroke-width": 1.5 }, g);
        T(g, x, y - 6, fr ? "P" + fr.p : "—", { size: 13, fill: fr ? C.text : C.dim });
        T(g, x, y + 11, fr ? "use:" + fr.use : "", { size: 10, fill: fr && fr.use ? C.gold : C.dim });
        tipOn(g, "Frame " + i, fr
          ? "Caches page " + fr.p + ". Usage bit = " + fr.use + ". A 1 means “recently referenced” — the sweeping hand will spare it once, clearing the bit instead of evicting."
          : "Empty frame — next miss can load straight in.");
      }
      // clock hand
      var ha = (hand / N) * Math.PI * 2 - Math.PI / 2;
      S("line", { x1: cx, y1: cy, x2: cx + Math.cos(ha) * (R - 34), y2: cy + Math.sin(ha) * (R - 34),
        stroke: C.gold, "stroke-width": 3, "stroke-linecap": "round" }, svg);
      S("circle", { cx: cx, cy: cy, r: 5, fill: C.gold }, svg);
      T(svg, 350, 228, msg, { fill: C.gold, size: 11.5 });
      T(svg, 350, 248, "hits: " + hits + "   misses: " + misses, { fill: C.dim, size: 11 });
    }
    f.btn("request random page", function () { request(Math.floor(Math.random() * 9) + 1); });
    f.btn("request page 1", function () { request(1); });
    f.btn("reset", reset);
    reset();
  };

  /* ========================================================================
     7. WAL & ARIES RECOVERY — crash, then analysis / redo / undo passes
     ======================================================================== */
  VIZ.wal = function (el) {
    var f = frame(el);
    var svg = S("svg", { viewBox: "0 0 700 300" }, f.body);
    // A fixed little history: T1 commits before the crash, T2 does not.
    var log = [
      { lsn: 1, tx: "T1", op: "BEGIN" },
      { lsn: 2, tx: "T1", op: "A = 50", page: "A", val: 50, old: 10 },
      { lsn: 3, tx: "T2", op: "BEGIN" },
      { lsn: 4, tx: "T2", op: "B = 70", page: "B", val: 70, old: 20 },
      { lsn: 5, tx: "T1", op: "COMMIT" },
      { lsn: 6, tx: "T2", op: "C = 90", page: "C", val: 90, old: 30 }
    ];
    var pages, phase, cursor, msg;

    function reset() {
      pages = { A: 10, B: 20, C: 30 };
      phase = "crash"; cursor = -1;
      msg = "💥 CRASH. On-disk pages hold pre-crash values (some updates may or may not have been flushed). Step through recovery.";
      render();
    }
    function step() {
      if (phase === "crash") {
        phase = "analysis";
        msg = "ANALYSIS — scan the log: T1 has a COMMIT record (winner ✓). T2 never committed (loser ✗). Also rebuild the dirty-page picture.";
      } else if (phase === "analysis") {
        phase = "redo"; cursor = 0;
        msg = "REDO — repeat history from the start: reapply EVERY update, even losers'. This restores the exact pre-crash state.";
      } else if (phase === "redo") {
        // apply next update record
        while (cursor < log.length && !log[cursor].page) cursor++;
        if (cursor < log.length) {
          var r = log[cursor];
          pages[r.page] = r.val;
          msg = "REDO LSN " + r.lsn + ": reapply " + r.tx + "'s write, page " + r.page + " ← " + r.val + ".";
          cursor++;
        }
        var more = log.slice(cursor).some(function (r) { return r.page; });
        if (!more) { phase = "undo"; cursor = log.length - 1; }
      } else if (phase === "undo") {
        while (cursor >= 0 && !(log[cursor].page && log[cursor].tx === "T2")) cursor--;
        if (cursor >= 0) {
          var r2 = log[cursor];
          pages[r2.page] = r2.old;
          msg = "UNDO LSN " + r2.lsn + ": roll back loser T2, page " + r2.page + " ← " + r2.old + " (a compensation record — CLR — is logged so undo survives another crash).";
          cursor--;
        }
        var moreU = cursor >= 0 && log.slice(0, cursor + 1).some(function (r) { return r.page && r.tx === "T2"; });
        if (!moreU) phase = "done";
      } else if (phase === "done") {
        msg = "✅ Recovery complete: committed T1's effects are durable, uncommitted T2 has vanished. Atomicity + durability, from one append-only log.";
      }
      render();
    }
    function render() {
      svg.innerHTML = "";
      T(svg, 350, 18, "WRITE-AHEAD LOG (append-only)", { fill: C.dim, size: 11 });
      var bw = 660 / log.length;
      log.forEach(function (r, i) {
        var active = i === (phase === "redo" || phase === "undo" ? cursor : -1);
        var winner = r.tx === "T1";
        S("rect", { x: 20 + i * bw, y: 30, width: bw - 6, height: 52, rx: 7,
          fill: active ? "rgba(255,209,102,.18)" : C.bg,
          stroke: active ? C.gold : winner ? C.green : C.red, "stroke-width": active ? 2 : 1.2 }, svg);
        T(svg, 20 + i * bw + (bw - 6) / 2, 46, r.tx, { size: 11, fill: winner ? C.green : C.red });
        T(svg, 20 + i * bw + (bw - 6) / 2, 66, r.op, { size: 10 });
        T(svg, 20 + i * bw + (bw - 6) / 2, 94, "LSN " + r.lsn, { size: 9, fill: C.dim });
      });
      // crash marker
      S("line", { x1: 683, y1: 26, x2: 683, y2: 100, stroke: C.red, "stroke-width": 2, "stroke-dasharray": "5 4" }, svg);
      T(svg, 683, 112, "💥", { size: 14 });

      // phase pipeline
      ["analysis", "redo", "undo", "done"].forEach(function (p, i) {
        var on = phase === p || (phase === "done" && p === "done");
        var reached = ["crash", "analysis", "redo", "undo", "done"].indexOf(phase) >= i + 1;
        S("rect", { x: 110 + i * 130, y: 132, width: 116, height: 30, rx: 15,
          fill: on ? "rgba(45,226,255,.15)" : C.bg, stroke: reached || on ? C.cyan : C.line }, svg);
        T(svg, 110 + i * 130 + 58, 147, p.toUpperCase(), { size: 11, fill: reached || on ? C.cyan : C.dim });
      });

      // page states
      T(svg, 350, 186, "DATA PAGES ON DISK", { fill: C.dim, size: 11 });
      ["A", "B", "C"].forEach(function (p, i) {
        S("rect", { x: 230 + i * 90, y: 196, width: 70, height: 44, rx: 8, fill: "#111a2e", stroke: C.blue }, svg);
        T(svg, 265 + i * 90, 212, "page " + p, { size: 10, fill: C.blue });
        T(svg, 265 + i * 90, 230, pages[p], { size: 14, fill: C.gold });
      });
      // message
      var lines = wrap(msg, 92);
      lines.forEach(function (l, i) { T(svg, 350, 262 + i * 16, l, { fill: C.text, size: 11.5 }); });
    }
    function wrap(s, n) {
      var words = s.split(" "), out = [], line = "";
      words.forEach(function (w) {
        if ((line + " " + w).length > n) { out.push(line); line = w; }
        else line = line ? line + " " + w : w;
      });
      if (line) out.push(line);
      return out;
    }
    f.btn("step ▸", step);
    f.btn("reset", reset);
    reset();
  };

  /* ========================================================================
     8. COPY-ON-WRITE B-TREE — path copying, atomic root flip
     ======================================================================== */
  VIZ.cow = function (el) {
    var f = frame(el);
    var svg = S("svg", { viewBox: "0 0 700 300" }, f.body);
    var stage = 0;
    var msgs = [
      "A tiny copy-on-write tree. The ROOT pointer is the single source of truth. Click STEP to update leaf L2.",
      "Step 1 — never touch pages in place: write a NEW copy of leaf L2 (L2′) with the updated data.",
      "Step 2 — the parent must point at L2′, so copy the parent too (P′). The copying cascades up the path.",
      "Step 3 — write a new root R′ pointing at P′. Everything new sits beside the old version.",
      "Step 4 — ONE atomic pointer flip: ROOT now points at R′. Readers that started earlier still see the old tree; new readers see the new one. No WAL needed for consistency — the old tree IS the recovery state."
    ];
    function render() {
      svg.innerHTML = "";
      var oldFaded = stage >= 4;
      function node(x, y, label, opts) {
        opts = opts || {};
        var g = S("g", { opacity: opts.faded ? 0.3 : 1 }, svg);
        S("rect", { x: x - 34, y: y, width: 68, height: 32, rx: 8,
          fill: opts.fresh ? "rgba(61,220,151,.15)" : C.bg,
          stroke: opts.fresh ? C.green : C.blue, "stroke-width": opts.fresh ? 2 : 1.3 }, g);
        T(g, x, y + 16, label, { size: 12, fill: opts.fresh ? C.green : C.text });
        return { x: x, y: y };
      }
      function edge(a, b, opts) {
        opts = opts || {};
        S("line", { x1: a.x, y1: a.y + 32, x2: b.x, y2: b.y,
          stroke: opts.fresh ? C.green : C.line, "stroke-width": 1.5,
          opacity: opts.faded ? 0.25 : 1, "stroke-dasharray": opts.fresh ? "" : "" }, svg);
      }
      // ROOT pointer box
      S("rect", { x: 310, y: 8, width: 80, height: 26, rx: 13, fill: "rgba(255,209,102,.12)", stroke: C.gold }, svg);
      T(svg, 350, 21, "ROOT ptr", { size: 11, fill: C.gold });

      // old tree (left-ish)
      var R = node(250, 62, "R", { faded: oldFaded });
      var P1 = node(160, 140, "P1", { faded: oldFaded });
      var P2 = node(340, 140, "P2", { faded: oldFaded });
      var L1 = node(110, 218, "L1", { faded: oldFaded });
      var L2 = node(210, 218, "L2", { faded: oldFaded || stage >= 1 });
      var L3 = node(300, 218, "L3");
      var L4 = node(390, 218, "L4");
      edge(R, P1, { faded: oldFaded }); edge(R, P2, { faded: oldFaded });
      edge(P1, L1, { faded: oldFaded }); edge(P1, L2, { faded: oldFaded });
      edge(P2, L3, { faded: oldFaded }); edge(P2, L4, { faded: oldFaded });

      // new copies appear stage by stage
      var L2n, P1n, Rn;
      if (stage >= 1) L2n = node(520, 218, "L2′", { fresh: true });
      if (stage >= 2) { P1n = node(500, 140, "P1′", { fresh: true }); edge(P1n, L1, { fresh: true }); edge(P1n, L2n, { fresh: true }); }
      if (stage >= 3) { Rn = node(480, 62, "R′", { fresh: true }); edge(Rn, P1n, { fresh: true }); edge(Rn, P2, { fresh: true }); }

      // root pointer arrow
      var target = stage >= 4 ? { x: 480, y: 62 } : { x: 250, y: 62 };
      S("path", { d: "M 350 34 L " + target.x + " " + (target.y - 2),
        stroke: C.gold, "stroke-width": 2, fill: "none", "marker-end": "" }, svg);
      S("circle", { cx: target.x, cy: target.y - 2, r: 4, fill: C.gold }, svg);

      var lines = wrap(msgs[stage], 86);
      lines.forEach(function (l, i) { T(svg, 350, 266 + i * 15, l, { size: 11.5 }); });
    }
    function wrap(s, n) {
      var words = s.split(" "), out = [], line = "";
      words.forEach(function (w) {
        if ((line + " " + w).length > n) { out.push(line); line = w; } else line = line ? line + " " + w : w;
      });
      if (line) out.push(line);
      return out;
    }
    f.btn("step ▸", function () { stage = Math.min(stage + 1, 4); render(); });
    f.btn("reset", function () { stage = 0; render(); });
    render();
  };

  /* ========================================================================
     9. LSM TREE — memtable, flush to SSTables, compaction with tombstones
     ======================================================================== */
  VIZ.lsm = function (el) {
    var f = frame(el);
    var svg = S("svg", { viewBox: "0 0 700 330" }, f.body);
    var MEMCAP = 5;
    var mem = [];        // [{k, v, dead}] sorted by k
    var runs = [];       // disk runs: arrays of {k, v, dead}, newest first
    var seq = 1;

    function put(k, dead) {
      var e = { k: k, v: "v" + seq++, dead: !!dead };
      var i = mem.findIndex(function (x) { return x.k === k; });
      if (i !== -1) mem[i] = e;
      else {
        var j = mem.findIndex(function (x) { return x.k > k; });
        mem.splice(j === -1 ? mem.length : j, 0, e);
      }
      if (mem.length >= MEMCAP) return flush("Memtable hit its size threshold → automatically FLUSHED to disk as an immutable sorted run (SSTable).");
      render(dead ? "Deletes can't modify immutable disk files — so we insert a TOMBSTONE for “" + k + "” instead."
                  : "“" + k + "” written to the in-memory, sorted memtable. Writes never touch disk structures directly.");
    }
    function flush(msg) {
      if (!mem.length) return render("Memtable is empty — nothing to flush.");
      runs.unshift(mem);
      mem = [];
      render(msg || "FLUSH: memtable written sequentially to disk as a new immutable SSTable. Sequential I/O — the whole point of LSM.");
    }
    function compact() {
      if (runs.length < 2) return render("Need at least two disk runs to compact.");
      // merge-iterate: newest version of each key wins; drop tombstones at the end
      var winner = {};
      runs.forEach(function (run) {           // runs[0] is newest
        run.forEach(function (e) { if (!(e.k in winner)) winner[e.k] = e; });
      });
      var merged = Object.keys(winner).sort().map(function (k) { return winner[k]; })
        .filter(function (e) { return !e.dead; });
      runs = [merged];
      render("COMPACTION: runs merge-sorted into one. Older shadowed versions reconciled away, tombstones and their victims dropped for good.");
    }
    var KEYS = "abcdefghijklmnop".split("");
    function randKey() { return KEYS[Math.floor(Math.random() * KEYS.length)]; }

    function drawRun(entries, x, y, label, hot) {
      var w = Math.max(entries.length * 34 + 12, 60);
      S("rect", { x: x, y: y, width: w, height: 46, rx: 8,
        fill: hot ? "rgba(45,226,255,.07)" : "#0a0f1c",
        stroke: hot ? C.cyan : C.line, "stroke-width": 1.3 }, svg);
      T(svg, x + 4, y - 9, label, { size: 9.5, fill: C.dim, anchor: "start" });
      entries.forEach(function (e, i) {
        var g = S("g", {}, svg);
        S("rect", { x: x + 8 + i * 34, y: y + 8, width: 28, height: 30, rx: 5,
          fill: e.dead ? "rgba(255,93,115,.15)" : "rgba(61,220,151,.1)",
          stroke: e.dead ? C.red : C.green }, g);
        T(g, x + 8 + i * 34 + 14, y + 19, e.k, { size: 11, fill: e.dead ? C.red : C.text });
        T(g, x + 8 + i * 34 + 14, y + 32, e.dead ? "†" : e.v, { size: 8.5, fill: C.dim });
        tipOn(g, e.dead ? "Tombstone for “" + e.k + "”" : "“" + e.k + "” → " + e.v,
          e.dead ? "A deletion marker. It shadows any older value of this key during reads and merges, and is discarded during compaction."
                 : "A key–value entry. Version tag " + e.v + " — during merges, the entry from the NEWER run wins (reconciliation).");
      });
      return w;
    }
    function render(msg) {
      svg.innerHTML = "";
      T(svg, 660, 84, "MEMORY", { fill: C.gold, size: 11 });
      drawRun(mem, 350 - Math.max(mem.length * 34 + 12, 60) / 2, 28, "memtable (mutable, sorted) — " + mem.length + "/" + MEMCAP, true);
      // memory/disk divider
      S("line", { x1: 20, y1: 96, x2: 680, y2: 96, stroke: C.line, "stroke-dasharray": "6 5" }, svg);
      T(svg, 660, 108, "DISK", { fill: C.blue, size: 11 });
      var y = 120;
      runs.forEach(function (run, i) {
        drawRun(run, 30, y, "SSTable run " + (runs.length - i) + (i === 0 ? " (newest)" : ""), false);
        y += 66;
      });
      if (!runs.length) T(svg, 350, 150, "no disk runs yet — flush the memtable", { fill: C.dim, size: 11 });
      // status sits below the last run; the canvas grows as runs pile up
      var lines = wrap(msg || "", 90), my = Math.max(300, y - 4);
      lines.forEach(function (l, i) { T(svg, 350, my + i * 14, l, { size: 11, fill: C.gold }); });
      svg.setAttribute("viewBox", "0 0 700 " + Math.max(330, my + lines.length * 14 + 6));
    }
    function wrap(s, n) {
      var words = s.split(" "), out = [], line = "";
      words.forEach(function (w) {
        if ((line + " " + w).length > n) { out.push(line); line = w; } else line = line ? line + " " + w : w;
      });
      if (line) out.push(line);
      return out.slice(0, 2);
    }
    f.btn("write random key", function () { put(randKey()); });
    f.btn("write ×4", function () { for (var i = 0; i < 4; i++) put(randKey()); });
    f.btn("delete random key", function () { put(randKey(), true); });
    f.btn("flush memtable", function () { flush(); });
    f.btn("compact runs", compact);
    f.btn("reset", function () { mem = []; runs = []; seq = 1; render("Fresh LSM tree."); });
    render("Write some keys — watch them buffer in memory, flush into immutable runs, and merge during compaction.");
  };

  /* ========================================================================
     10. BLOOM FILTER — add keys, probe membership, hunt false positives
     ======================================================================== */
  VIZ.bloom = function (el) {
    var f = frame(el);
    var svg = S("svg", { viewBox: "0 0 700 190" }, f.body);
    var M = 24, bits = Array(M).fill(0), added = [], lastProbe = null;

    // three cheap independent-ish string hashes
    function h(s, seed) {
      var x = seed;
      for (var i = 0; i < s.length; i++) x = (x * 31 + s.charCodeAt(i)) >>> 0;
      return x % M;
    }
    function hashes(s) { return [h(s, 17), h(s, 131), h(s, 977)]; }

    function render(msg, msgColor) {
      svg.innerHTML = "";
      var bw = 660 / M;
      for (var i = 0; i < M; i++) {
        var probed = lastProbe && lastProbe.idx.indexOf(i) !== -1;
        S("rect", { x: 20 + i * bw, y: 60, width: bw - 4, height: 40, rx: 5,
          fill: bits[i] ? "rgba(45,226,255,.2)" : C.bg,
          stroke: probed ? C.gold : bits[i] ? C.cyan : C.line,
          "stroke-width": probed ? 2.5 : 1 }, svg);
        T(svg, 20 + i * bw + (bw - 4) / 2, 80, bits[i], { size: 12, fill: bits[i] ? C.cyan : C.dim });
        T(svg, 20 + i * bw + (bw - 4) / 2, 112, i, { size: 8, fill: C.dim });
      }
      if (lastProbe) {
        lastProbe.idx.forEach(function (bi, k) {
          S("path", { d: "M 350 30 C 350 40, " + (20 + bi * bw + bw / 2) + " 38, " + (20 + bi * bw + bw / 2) + " 58",
            stroke: C.gold, fill: "none", opacity: 0.6 }, svg);
        });
        T(svg, 350, 20, "h1·h2·h3(“" + lastProbe.key + "”) → " + lastProbe.idx.join(", "), { fill: C.gold, size: 12 });
      }
      T(svg, 350, 140, msg || "", { fill: msgColor || C.text, size: 12 });
      T(svg, 350, 165, "added: " + (added.join(", ") || "—"), { fill: C.dim, size: 11 });
    }
    var input = document.createElement("input");
    input.type = "text"; input.placeholder = "a word…";
    f.controls.appendChild(input);
    f.btn("add", function () {
      var k = input.value.trim().toLowerCase(); if (!k) return;
      var idx = hashes(k);
      idx.forEach(function (i) { bits[i] = 1; });
      if (added.indexOf(k) === -1) added.push(k);
      lastProbe = { key: k, idx: idx };
      render("Added “" + k + "” — set bits " + idx.join(", ") + ".", C.cyan);
      input.value = "";
    });
    f.btn("check", function () {
      var k = input.value.trim().toLowerCase(); if (!k) return;
      var idx = hashes(k);
      lastProbe = { key: k, idx: idx };
      var all = idx.every(function (i) { return bits[i]; });
      var truly = added.indexOf(k) !== -1;
      if (!all) render("Bit " + idx.find(function (i) { return !bits[i]; }) + " is 0 → “" + k + "” is DEFINITELY absent. Skip the disk read!", C.green);
      else if (truly) render("All bits set → “probably present”. It is — a true positive.", C.cyan);
      else render("All bits set → “probably present”… but we never added “" + k + "”. FALSE POSITIVE — a wasted (but harmless) disk read.", C.red);
      input.value = "";
    });
    f.btn("reset", function () { bits = Array(M).fill(0); added = []; lastProbe = null; render("Empty filter."); });
    render("Add a few words, then check words you did and didn't add. Try to trigger a false positive!");
  };

})();
