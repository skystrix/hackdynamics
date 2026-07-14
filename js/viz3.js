/* ==========================================================================
   viz3.js — interactive visualizations for the expansion chapters
   datamodels — one dataset rendered as relational / document / KV / graph
   invindex   — build an inverted index from documents, run searches
   hashjoin   — hash join: build phase then probe phase, animated stepper
   encodings  — columnar compression playground (RLE, dictionary, delta)
   hashring   — consistent hashing ring: nodes join/leave, keys barely move
   dbcompare  — workload-trait picker highlighting suitable database systems
   Same conventions as viz.js / viz2.js.
   ========================================================================== */

(function () {
  "use strict";
  window.VIZ = window.VIZ || {};

  var NS = "http://www.w3.org/2000/svg";
  var C = { cyan: "#2de2ff", blue: "#4f7cff", gold: "#ffd166", red: "#ff5d73",
            green: "#3ddc97", dim: "#7d8fb0", line: "#1c2a45", bg: "#0c1220", text: "#c9d6ea" };

  function S(tag, attrs, parent) {
    var e = document.createElementNS(NS, tag);
    for (var k in attrs) e.setAttribute(k, attrs[k]);
    if (parent) parent.appendChild(e);
    return e;
  }
  function T(parent, x, y, str, opts) {
    opts = opts || {};
    var t = S("text", { x: x, y: y, fill: opts.fill || C.text, "font-size": opts.size || 13,
      "font-family": "ui-monospace,Menlo,monospace", "text-anchor": opts.anchor || "middle",
      "dominant-baseline": "middle" }, parent);
    t.textContent = str;
    return t;
  }
  function div(cls, html) { var d = document.createElement("div"); d.className = cls || ""; if (html) d.innerHTML = html; return d; }
  function frame(el) {
    var mount = el.querySelector(".viz-mount");
    var body = div("viz-body"), controls = div("viz-controls"), note = div("viz-note");
    mount.appendChild(body); mount.appendChild(controls); mount.appendChild(note);
    return {
      body: body, controls: controls, note: note,
      btn: function (label, fn) {
        var b = document.createElement("button");
        b.textContent = label; b.addEventListener("click", fn);
        controls.appendChild(b); return b;
      },
      say: function (m) { note.textContent = m; }
    };
  }
  function wrap(s, n) {
    var words = s.split(" "), out = [], line = "";
    words.forEach(function (w) {
      if ((line + " " + w).length > n) { out.push(line); line = w; } else line = line ? line + " " + w : w;
    });
    if (line) out.push(line);
    return out;
  }

  /* ========================================================================
     19. DATA MODELS — the same tiny dataset in four shapes
     ======================================================================== */
  VIZ.datamodels = function (el) {
    var f = frame(el);
    var svg = S("svg", { viewBox: "0 0 700 300" }, f.body);
    var mode = "relational";
    var notes = {
      relational: "Facts stored once, linked by key VALUES. Any question is a join away — including ones nobody anticipated.",
      document: "The order and its items travel as ONE aggregate: one read, no joins. But 'total sales of item X across all orders' now means scanning inside every document.",
      kv: "Opaque values behind keys: nothing faster, nothing dumber. The database can't see inside — every query shape beyond get(key) is the app's problem.",
      graph: "Relationships ARE the data: edges are first-class and traversals follow pointers. 'Customers who bought what Ada bought' is a walk, not a 4-way join."
    };

    function box(x, y, w, h, color, dashed) {
      return S("rect", { x: x, y: y, width: w, height: h, rx: 8, fill: C.bg,
        stroke: color, "stroke-width": 1.4, "stroke-dasharray": dashed ? "5 4" : "" }, svg);
    }
    function render() {
      svg.innerHTML = "";
      if (mode === "relational") {
        // three normalized tables with FK arrows
        T(svg, 120, 22, "customers", { fill: C.gold, size: 12 });
        box(30, 32, 180, 74, C.blue);
        ["id │ name", "─────────", "c1 │ Ada", "c2 │ Bo"].forEach(function (r, i) { T(svg, 120, 48 + i * 15, r, { size: 10.5 }); });
        T(svg, 350, 22, "orders", { fill: C.gold, size: 12 });
        box(265, 32, 170, 74, C.blue);
        ["id │ cust", "─────────", "o1 │ c1", "o2 │ c2"].forEach(function (r, i) { T(svg, 350, 48 + i * 15, r, { size: 10.5 }); });
        T(svg, 575, 22, "order_items", { fill: C.gold, size: 12 });
        box(480, 32, 190, 88, C.blue);
        ["order │ item │ qty", "──────────────", "o1 │ disk │ 2", "o1 │ ram  │ 1", "o2 │ disk │ 1"].forEach(function (r, i) { T(svg, 575, 46 + i * 15, r, { size: 10 }); });
        S("path", { d: "M 265 70 C 240 70, 235 70, 212 70", stroke: C.cyan, fill: "none", "stroke-width": 1.5 }, svg);
        T(svg, 238, 58, "FK", { fill: C.cyan, size: 9 });
        S("path", { d: "M 480 76 C 460 76, 458 76, 437 76", stroke: C.cyan, fill: "none", "stroke-width": 1.5 }, svg);
        T(svg, 458, 64, "FK", { fill: C.cyan, size: 9 });
        T(svg, 350, 150, "SELECT … FROM customers JOIN orders JOIN order_items …", { fill: C.dim, size: 10.5 });
      } else if (mode === "document") {
        T(svg, 200, 22, "orders collection", { fill: C.gold, size: 12 });
        box(60, 32, 280, 150, C.green);
        ['{ "_id": "o1",', '  "customer": { "name": "Ada" },', '  "items": [', '    { "sku": "disk", "qty": 2 },', '    { "sku": "ram",  "qty": 1 } ],', '  "total": 94 }'].forEach(function (r, i) {
          T(svg, 76, 50 + i * 21, r, { size: 10.5, anchor: "start", fill: i === 0 || i === 5 ? C.text : C.dim });
        });
        box(380, 32, 260, 110, C.green, true);
        ['{ "_id": "o2",', '  "customer": { "name": "Bo" },', '  "items": [ { "sku": "disk", … } ] }'].forEach(function (r, i) {
          T(svg, 394, 56 + i * 24, r, { size: 10.5, anchor: "start", fill: C.dim });
        });
        T(svg, 350, 212, "one aggregate = one atomic read/write", { fill: C.dim, size: 10.5 });
      } else if (mode === "kv") {
        var rows = [["order:o1", "0x9F41…(94 bytes, opaque)"], ["order:o2", "0x2CB0…(61 bytes, opaque)"], ["cust:c1", "0x77A2…(28 bytes, opaque)"], ["session:9d1", "0xE001…(112 bytes, opaque)"]];
        T(svg, 350, 22, "key → value", { fill: C.gold, size: 12 });
        rows.forEach(function (r, i) {
          box(120, 38 + i * 42, 170, 32, C.cyan);
          T(svg, 205, 54 + i * 42, r[0], { size: 11 });
          S("path", { d: "M 292 " + (54 + i * 42) + " L 328 " + (54 + i * 42), stroke: C.dim, "stroke-width": 1.5 }, svg);
          box(330, 38 + i * 42, 250, 32, C.line);
          T(svg, 455, 54 + i * 42, r[1], { size: 10, fill: C.dim });
        });
      } else { // graph
        function node(x, y, label, color) {
          S("circle", { cx: x, cy: y, r: 30, fill: C.bg, stroke: color, "stroke-width": 1.6 }, svg);
          T(svg, x, y, label, { size: 10.5 });
          return { x: x, y: y };
        }
        function edge(a, b, label) {
          S("line", { x1: a.x, y1: a.y, x2: b.x, y2: b.y, stroke: C.dim, "stroke-width": 1.3 }, svg);
          T(svg, (a.x + b.x) / 2, (a.y + b.y) / 2 - 9, label, { size: 9, fill: C.gold });
        }
        var ada = node(140, 80, "Ada", C.cyan), bo = node(140, 210, "Bo", C.cyan);
        var o1 = node(340, 80, "order o1", C.blue), o2 = node(340, 210, "order o2", C.blue);
        var disk = node(560, 145, "disk", C.green), ram = node(560, 55, "ram", C.green);
        edge(ada, o1, "PLACED"); edge(bo, o2, "PLACED");
        edge(o1, disk, "CONTAINS"); edge(o1, ram, "CONTAINS"); edge(o2, disk, "CONTAINS");
      }
      wrap(notes[mode], 92).forEach(function (l, i) { T(svg, 350, 252 + i * 15, l, { size: 11.5, fill: C.gold }); });
    }
    f.btn("relational", function () { mode = "relational"; render(); });
    f.btn("document", function () { mode = "document"; render(); });
    f.btn("key-value", function () { mode = "kv"; render(); });
    f.btn("graph", function () { mode = "graph"; render(); });
    f.say("Same customers, orders, and items — four different bets about the questions to come.");
    render();
  };

  /* ========================================================================
     20. INVERTED INDEX — add documents, watch postings lists, run queries
     ======================================================================== */
  VIZ.invindex = function (el) {
    var f = frame(el);
    var listWrap = div("");
    listWrap.style.cssText = "font-family:ui-monospace,Menlo,monospace;font-size:13px;line-height:1.9;padding:6px 4px;min-height:120px";
    f.body.appendChild(listWrap);
    var docs = [];            // [{id, text}]
    var index = {};           // term -> [docIds]
    var lastHits = null, lastTerms = [];

    function analyze(text) {  // the "analysis pipeline": tokenize + lowercase
      return text.toLowerCase().split(/[^a-z0-9]+/).filter(Boolean);
    }
    function addDoc(text) {
      var id = docs.length + 1;
      docs.push({ id: id, text: text });
      analyze(text).forEach(function (term) {
        index[term] = index[term] || [];
        if (index[term].indexOf(id) === -1) index[term].push(id);
      });
      lastHits = null; lastTerms = [];
      render();
      f.say("doc" + id + " indexed: each of its terms now lists doc" + id + " in its postings.");
    }
    function search(q) {
      lastTerms = analyze(q);
      if (!lastTerms.length) return;
      // AND query = intersection of postings lists
      var lists = lastTerms.map(function (t) { return index[t] || []; });
      lastHits = lists.reduce(function (acc, l) { return acc.filter(function (d) { return l.indexOf(d) !== -1; }); }, lists[0] || []);
      render();
      f.say('AND-query "' + lastTerms.join(" ") + '" = intersection of ' + lastTerms.length +
        " postings list(s) → " + (lastHits.length ? "docs " + lastHits.join(", ") : "no matches") + ".");
    }
    function render() {
      var html = '<div style="color:' + C.dim + '">DOCUMENTS</div>';
      docs.forEach(function (d) {
        var hit = lastHits && lastHits.indexOf(d.id) !== -1;
        html += '<div style="color:' + (hit ? C.green : C.text) + '">' +
          (hit ? "▶ " : "&nbsp;&nbsp;") + "doc" + d.id + ': “' + d.text + '”</div>';
      });
      html += '<div style="color:' + C.dim + ';margin-top:10px">INVERTED INDEX (term → postings)</div>';
      var terms = Object.keys(index).sort();
      if (!terms.length) html += '<div style="color:' + C.dim + '">— empty —</div>';
      terms.forEach(function (t) {
        var probed = lastTerms.indexOf(t) !== -1;
        html += '<div><span style="color:' + (probed ? C.gold : C.cyan) + '">' + t.padEnd(12, " ") +
          "</span> → [" + index[t].map(function (d) {
            return '<span style="color:' + (lastHits && lastHits.indexOf(d) !== -1 && probed ? C.green : C.dim) + '">doc' + d + "</span>";
          }).join(", ") + "]</div>";
      });
      listWrap.innerHTML = html;
    }
    var input = document.createElement("input");
    input.type = "text"; input.placeholder = "text or query…"; input.style.width = "240px";
    f.controls.appendChild(input);
    f.btn("index as document", function () { if (input.value.trim()) { addDoc(input.value.trim()); input.value = ""; } });
    f.btn("search (AND)", function () { if (input.value.trim()) search(input.value.trim()); });
    f.btn("reset", function () { docs = []; index = {}; lastHits = null; lastTerms = []; render(); f.say("Empty index."); });
    // seed
    ["the write ahead log", "log structured merge tree", "b tree stores sorted keys"].forEach(addDoc);
    f.say("Three documents indexed. Try searching “log tree”, then add your own documents.");
  };

  /* ========================================================================
     21. HASH JOIN — build on the small side, probe with the big side
     ======================================================================== */
  VIZ.hashjoin = function (el) {
    var f = frame(el);
    var svg = S("svg", { viewBox: "0 0 700 320" }, f.body);
    var BUCKETS = 5;
    // small build side (customers) and larger probe side (orders)
    var build = [["c1", "Ada"], ["c2", "Bo"], ["c3", "Cy"]];
    var probe = [["o1", "c2"], ["o2", "c1"], ["o3", "c9"], ["o4", "c3"], ["o5", "c2"], ["o6", "c1"]];
    var step, table, out, msg;

    function h(k) { return (k.charCodeAt(1) * 7 + k.length) % BUCKETS; }
    function reset() {
      step = 0; table = {}; out = [];
      msg = "Two inputs. Phase 1 will BUILD a hash table on the smaller side. Step through!";
      render();
    }
    function next() {
      if (step < build.length) {
        var row = build[step];
        var b = h(row[0]);
        (table[b] = table[b] || []).push(row);
        msg = "BUILD: hash(" + row[0] + ") = bucket " + b + " — insert " + row[1] + "'s row.";
      } else if (step < build.length + probe.length) {
        var p = probe[step - build.length];
        var pb = h(p[1]);
        var matches = (table[pb] || []).filter(function (r) { return r[0] === p[1]; });
        if (matches.length) {
          out.push(p[0] + "+" + matches[0][1]);
          msg = "PROBE: order " + p[0] + " hashes its key " + p[1] + " → bucket " + pb + " → MATCH with " + matches[0][1] + ". O(1)!";
        } else {
          msg = "PROBE: order " + p[0] + " (key " + p[1] + ") → bucket " + pb + " → no match, row dropped.";
        }
      } else {
        msg = "Done: " + out.length + " joined rows. Build paid once (" + build.length + " inserts); every probe was constant-time.";
        render(); return;
      }
      step++;
      render();
    }
    function render() {
      svg.innerHTML = "";
      // build input (left)
      T(svg, 90, 18, "customers (build side)", { fill: C.gold, size: 11 });
      build.forEach(function (r, i) {
        var done = i < Math.min(step, build.length);
        var active = i === step && step < build.length;
        S("rect", { x: 30, y: 30 + i * 34, width: 120, height: 27, rx: 6,
          fill: active ? "rgba(255,209,102,.15)" : C.bg,
          stroke: done ? C.dim : active ? C.gold : C.blue, "stroke-width": active ? 2 : 1.2 }, svg);
        T(svg, 90, 44 + i * 34, r[0] + " │ " + r[1], { size: 11, fill: done ? C.dim : C.text });
      });
      // probe input (left, below)
      T(svg, 90, 152, "orders (probe side)", { fill: C.gold, size: 11 });
      probe.forEach(function (r, i) {
        var idx = build.length + i;
        var done = idx < step;
        var active = idx === step;
        S("rect", { x: 30, y: 164 + i * 26, width: 120, height: 21, rx: 5,
          fill: active ? "rgba(45,226,255,.12)" : C.bg,
          stroke: done ? C.dim : active ? C.cyan : C.line, "stroke-width": active ? 2 : 1 }, svg);
        T(svg, 90, 175 + i * 26, r[0] + " │ cust " + r[1], { size: 10, fill: done ? C.dim : C.text });
      });
      // hash table (middle)
      T(svg, 380, 18, "hash table (in memory)", { fill: C.cyan, size: 11 });
      for (var b = 0; b < BUCKETS; b++) {
        S("rect", { x: 280, y: 30 + b * 42, width: 200, height: 36, rx: 6,
          fill: C.bg, stroke: C.line }, svg);
        T(svg, 297, 48 + b * 42, "b" + b, { size: 10, fill: C.dim });
        (table[b] || []).forEach(function (r, i) {
          S("rect", { x: 316 + i * 78, y: 36 + b * 42, width: 72, height: 24, rx: 5,
            fill: "rgba(61,220,151,.1)", stroke: C.green }, svg);
          T(svg, 352 + i * 78, 48 + b * 42, r[0] + ":" + r[1], { size: 9.5, fill: C.green });
        });
      }
      // output (right)
      T(svg, 600, 18, "joined output", { fill: C.green, size: 11 });
      out.forEach(function (o, i) {
        S("rect", { x: 530, y: 30 + i * 30, width: 140, height: 24, rx: 5,
          fill: "rgba(61,220,151,.08)", stroke: C.green }, svg);
        T(svg, 600, 42 + i * 30, o, { size: 10.5, fill: C.green });
      });
      wrap(msg, 90).forEach(function (l, i) { T(svg, 350, 290 + i * 15, l, { size: 11.5, fill: C.gold }); });
    }
    f.btn("step ▸", next);
    f.btn("run all", function () { for (var i = 0; i < 12; i++) next(); });
    f.btn("reset", reset);
    reset();
  };

  /* ========================================================================
     22. COMPRESSION ENCODINGS — one column, three encodings, live sizes
     ======================================================================== */
  VIZ.encodings = function (el) {
    var f = frame(el);
    var svg = S("svg", { viewBox: "0 0 700 300" }, f.body);
    var datasets = {
      "sorted countries": ["DE","DE","DE","DE","DE","FR","FR","FR","IN","IN","IN","IN","US","US","US","US"],
      "timestamps": [1000,1001,1002,1004,1005,1005,1006,1009,1010,1012,1013,1015,1016,1018,1020,1021],
      "random ids": [847,112,905,333,671,58,724,481,299,846,150,932,17,568,410,777]
    };
    var current = "sorted countries";

    function rle(vals) {
      var runs = [];
      vals.forEach(function (v) {
        if (runs.length && runs[runs.length - 1][0] === v) runs[runs.length - 1][1]++;
        else runs.push([v, 1]);
      });
      return runs;
    }
    function render() {
      svg.innerHTML = "";
      var vals = datasets[current];
      var isNum = typeof vals[0] === "number";
      var bw = 660 / vals.length;

      // raw column
      T(svg, 20, 16, "raw column — " + vals.length + " × 4 B = 64 B", { fill: C.dim, size: 11, anchor: "start" });
      vals.forEach(function (v, i) {
        S("rect", { x: 20 + i * bw, y: 26, width: bw - 3, height: 26, rx: 4, fill: C.bg, stroke: C.blue }, svg);
        T(svg, 20 + i * bw + (bw - 3) / 2, 39, v, { size: 8.5 });
      });

      // RLE
      var runs = rle(vals);
      var rleBytes = runs.length * 5;
      T(svg, 20, 78, "run-length: " + runs.length + " runs ≈ " + rleBytes + " B" +
        (runs.length === vals.length ? "  — no runs, RLE useless here!" : ""), { fill: C.dim, size: 11, anchor: "start" });
      var x = 20;
      runs.forEach(function (r) {
        var w = r[1] * bw - 3;
        S("rect", { x: x, y: 88, width: w, height: 26, rx: 4,
          fill: r[1] > 1 ? "rgba(61,220,151,.12)" : C.bg, stroke: r[1] > 1 ? C.green : C.dim }, svg);
        T(svg, x + w / 2, 101, r[0] + "×" + r[1], { size: 9, fill: r[1] > 1 ? C.green : C.dim });
        x += r[1] * bw;
      });

      if (!isNum) {
        // dictionary encoding
        var dict = [], ids = vals.map(function (v) {
          var i = dict.indexOf(v);
          if (i === -1) { dict.push(v); return dict.length - 1; }
          return i;
        });
        var dictBytes = dict.length * 3 + Math.ceil(vals.length * Math.ceil(Math.log2(Math.max(dict.length, 2))) / 8);
        T(svg, 20, 140, "dictionary: " + dict.length + " entries + " +
          Math.ceil(Math.log2(Math.max(dict.length, 2))) + "-bit codes ≈ " + dictBytes + " B", { fill: C.dim, size: 11, anchor: "start" });
        dict.forEach(function (d, i) {
          S("rect", { x: 20 + i * 74, y: 150, width: 68, height: 22, rx: 4, fill: "rgba(255,209,102,.08)", stroke: C.gold }, svg);
          T(svg, 54 + i * 74, 161, i + " = " + d, { size: 9.5, fill: C.gold });
        });
        ids.forEach(function (id, i) {
          S("rect", { x: 20 + i * bw, y: 182, width: bw - 3, height: 20, rx: 3, fill: C.bg, stroke: C.cyan }, svg);
          T(svg, 20 + i * bw + (bw - 3) / 2, 192, id, { size: 9, fill: C.cyan });
        });
        summary(rleBytes, dictBytes, "dictionary");
      } else {
        // delta encoding
        var deltas = vals.map(function (v, i) { return i === 0 ? v : v - vals[i - 1]; });
        var maxD = Math.max.apply(null, deltas.slice(1).map(Math.abs));
        var bits = Math.max(1, Math.ceil(Math.log2(maxD + 1)) + 1);
        var deltaBytes = 4 + Math.ceil((vals.length - 1) * bits / 8);
        T(svg, 20, 140, "delta: base + " + (vals.length - 1) + " diffs @ " + bits + " bits ≈ " + deltaBytes + " B" +
          (bits > 16 ? "  — random data: deltas as big as the values!" : ""), { fill: C.dim, size: 11, anchor: "start" });
        deltas.forEach(function (d, i) {
          S("rect", { x: 20 + i * bw, y: 150, width: bw - 3, height: 22, rx: 3,
            fill: i === 0 ? "rgba(255,209,102,.1)" : C.bg, stroke: i === 0 ? C.gold : C.cyan }, svg);
          T(svg, 20 + i * bw + (bw - 3) / 2, 161, i === 0 ? d : (d >= 0 ? "+" + d : d), { size: 8, fill: i === 0 ? C.gold : C.cyan });
        });
        summary(rleBytes, deltaBytes, "delta");
      }
      function summary(rleB, otherB, otherName) {
        var best = Math.min(rleB, otherB);
        var ratio = (64 / best).toFixed(1);
        T(svg, 350, 245, "64 B raw → " + best + " B best (" + otherName + " vs RLE) = " + ratio + "× smaller", { fill: C.green, size: 13 });
        T(svg, 350, 272, "…and filters/aggregates can run on the encoded form without decompressing", { fill: C.dim, size: 10.5 });
      }
    }
    Object.keys(datasets).forEach(function (name) {
      f.btn(name, function () { current = name; render(); f.say("Encoding “" + name + "” — note which encodings win and which give up."); });
    });
    f.say("Same 16 values, three encodings. Sorted/low-cardinality data compresses absurdly; random data resists.");
    render();
  };

  /* ========================================================================
     23. CONSISTENT HASHING RING — nodes join/leave, keys barely move
     ======================================================================== */
  VIZ.hashring = function (el) {
    var f = frame(el);
    var svg = S("svg", { viewBox: "0 0 700 320" }, f.body);
    var cx = 350, cy = 150, R = 110;
    var nextId = 4;
    var nodes = [{ id: "N1", pos: 0.08 }, { id: "N2", pos: 0.41 }, { id: "N3", pos: 0.73 }];
    var keys = [];
    for (var i = 0; i < 24; i++) keys.push({ k: "k" + i, pos: (i * 0.618034) % 1 }); // golden-ratio spread
    var lastMoved = [];

    function ownerOf(pos) { // next node clockwise
      var sorted = nodes.slice().sort(function (a, b) { return a.pos - b.pos; });
      for (var i = 0; i < sorted.length; i++) if (sorted[i].pos >= pos) return sorted[i];
      return sorted[0];
    }
    function assign() { // returns map key->owner id
      var m = {};
      keys.forEach(function (k) { m[k.k] = ownerOf(k.pos).id; });
      return m;
    }
    var owners = assign();

    function change(fn, verb) {
      var before = owners;
      fn();
      owners = assign();
      lastMoved = keys.filter(function (k) { return before[k.k] !== owners[k.k]; }).map(function (k) { return k.k; });
      render();
      f.say(verb + " — " + lastMoved.length + " of " + keys.length + " keys moved (" +
        Math.round(lastMoved.length / keys.length * 100) + "%). mod-N hashing would have moved nearly all of them.");
    }
    function xy(pos, r) {
      var a = pos * Math.PI * 2 - Math.PI / 2;
      return [cx + Math.cos(a) * r, cy + Math.sin(a) * r];
    }
    var palette = [C.cyan, C.gold, C.green, C.blue, C.red, "#c792ea", "#f78c6c"];
    function colorOf(nodeId) {
      var idx = nodes.findIndex(function (n) { return n.id === nodeId; });
      return palette[idx % palette.length];
    }
    function render() {
      svg.innerHTML = "";
      S("circle", { cx: cx, cy: cy, r: R, fill: "none", stroke: C.line, "stroke-width": 2 }, svg);
      // arcs of ownership: draw each key dot colored by its owner
      keys.forEach(function (k) {
        var p = xy(k.pos, R);
        var moved = lastMoved.indexOf(k.k) !== -1;
        S("circle", { cx: p[0], cy: p[1], r: moved ? 6 : 4,
          fill: colorOf(owners[k.k]), stroke: moved ? "#fff" : "none", "stroke-width": 1.5, opacity: moved ? 1 : 0.8 }, svg);
      });
      // nodes
      nodes.forEach(function (n) {
        var p = xy(n.pos, R);
        var col = colorOf(n.id);
        S("rect", { x: p[0] - 22, y: p[1] - 14, width: 44, height: 28, rx: 8,
          fill: C.bg, stroke: col, "stroke-width": 2 }, svg);
        T(svg, p[0], p[1], n.id, { size: 11, fill: col });
      });
      // legend: key counts per node
      var counts = {};
      keys.forEach(function (k) { counts[owners[k.k]] = (counts[owners[k.k]] || 0) + 1; });
      nodes.forEach(function (n, i) {
        T(svg, 30, 30 + i * 20, n.id + ": " + (counts[n.id] || 0) + " keys", { size: 11, fill: colorOf(n.id), anchor: "start" });
      });
      T(svg, 350, 288, "each dot = a key, colored by owning node · keys belong to the next node clockwise",
        { size: 10.5, fill: C.dim });
      if (lastMoved.length) T(svg, 350, 305, "white-ringed dots just changed owners", { size: 10.5, fill: C.dim });
    }
    f.btn("+ add node", function () {
      change(function () { nodes.push({ id: "N" + nextId++, pos: Math.random() }); }, "Node joined at a random ring position");
    });
    f.btn("− remove node", function () {
      if (nodes.length <= 1) return f.say("Need at least one node.");
      change(function () { nodes.splice(Math.floor(Math.random() * nodes.length), 1); }, "Node left the ring");
    });
    f.btn("reset", function () {
      nodes = [{ id: "N1", pos: 0.08 }, { id: "N2", pos: 0.41 }, { id: "N3", pos: 0.73 }];
      nextId = 4; lastMoved = []; owners = assign(); render();
      f.say("Three nodes, 24 keys. Add and remove nodes — watch how few keys move each time.");
    });
    render();
    f.say("Three nodes, 24 keys. Add and remove nodes — watch how few keys move each time.");
  };

  /* ========================================================================
     24. DATABASE PICKER — choose workload traits, see which systems fit
     ======================================================================== */
  VIZ.dbcompare = function (el) {
    var f = frame(el);
    var wrapDiv = div("");
    wrapDiv.style.cssText = "font-family:ui-monospace,Menlo,monospace;font-size:13px;padding:4px";
    f.body.appendChild(wrapDiv);

    // trait dimensions the user picks from
    var questions = [
      { key: "shape", label: "data shape", opts: ["relational/joins", "documents", "key-value", "analytics/scans", "graph/traversal"] },
      { key: "consistency", label: "consistency need", opts: ["strict transactions", "eventual is fine"] },
      { key: "scale", label: "scale", opts: ["one beefy node is fine", "must scale horizontally", "global / multi-region"] }
    ];
    var picks = { shape: "relational/joins", consistency: "strict transactions", scale: "one beefy node is fine" };

    // each system scores against picked traits; reasons explain the verdict
    var systems = [
      { name: "PostgreSQL", fit: function (p) {
          if (p.shape === "graph/traversal") return [1, "possible, but joins strain at deep traversals"];
          if (p.scale === "global / multi-region") return [1, "single-primary writes; multi-region needs extensions/effort"];
          if (p.shape === "analytics/scans" ) return [1, "fine to a point; row storage limits big scans"];
          if (p.scale === "must scale horizontally") return [1, "read replicas yes; write sharding is manual (Citus helps)"];
          return [2, "the boring, excellent default — transactions, extensions, ecosystem"]; } },
      { name: "MySQL/InnoDB", fit: function (p) {
          if (p.shape === "relational/joins" && p.scale !== "global / multi-region") return [2, "proven OLTP workhorse; clustered PK B-Tree"];
          if (p.shape === "analytics/scans") return [0, "row engine; wrong tool for scans"];
          return [1, "capable relational engine; same single-primary limits"]; } },
      { name: "SQLite / DuckDB", fit: function (p) {
          if (p.scale !== "one beefy node is fine") return [0, "in-process by design — no cluster to scale"];
          if (p.shape === "analytics/scans") return [2, "DuckDB: vectorized columnar analytics in a library"];
          if (p.shape === "key-value" || p.shape === "relational/joins" || p.shape === "documents") return [1, "SQLite: zero-ops embedded ACID — if one writer suffices"];
          return [0, "not the shape"]; } },
      { name: "MongoDB", fit: function (p) {
          if (p.shape === "documents") return [p.scale === "must scale horizontally" ? 2 : 2, "aggregates + replica sets + sharding built in"];
          if (p.shape === "relational/joins") return [0, "cross-document joins fight the model"];
          return [1, "works, but the document model is its home turf"]; } },
      { name: "Cassandra / DynamoDB", fit: function (p) {
          if (p.consistency === "strict transactions") return [0, "quorum tunables ≠ multi-item ACID; wrong consistency home"];
          if (p.shape === "key-value" || p.shape === "documents") return [p.scale === "one beefy node is fine" ? 1 : 2, "Dynamo lineage: linear scale-out, per-key access"];
          if (p.shape === "analytics/scans") return [0, "per-partition access only; scans are anti-patterns"];
          return [1, "possible with careful per-query table design"]; } },
      { name: "Redis", fit: function (p) {
          if (p.shape === "key-value" && p.consistency === "eventual is fine") return [2, "in-memory microseconds; cache & structures king"];
          if (p.shape === "key-value") return [1, "superb cache; read durability fine print as a primary store"];
          return [0, "a data-structure server, not a general database"]; } },
      { name: "Spanner / CockroachDB", fit: function (p) {
          if (p.consistency === "strict transactions" && p.scale === "global / multi-region") return [2, "consensus-replicated ranges: serializable SQL, planet-wide"];
          if (p.consistency === "strict transactions" && p.scale === "must scale horizontally") return [2, "distributed SQL without giving up transactions"];
          if (p.scale === "one beefy node is fine") return [0, "consensus overhead with none of the payoff at one node"];
          return [1, "strong, but you pay consensus latency you may not need"]; } },
      { name: "ClickHouse / Snowflake", fit: function (p) {
          if (p.shape === "analytics/scans") return [2, "columnar + vectorized: built for exactly this"];
          return [0, "analytical engines; not an OLTP home"]; } },
      { name: "Neo4j / graph DBs", fit: function (p) {
          if (p.shape === "graph/traversal") return [2, "edges as first-class citizens; traversal is the query model"];
          return [0, "specialist — only shines on relationship-shaped data"]; } }
    ];

    function render() {
      var html = "";
      questions.forEach(function (q) {
        html += '<div style="margin:6px 0;color:' + C.dim + '">' + q.label.toUpperCase() + "</div><div>";
        q.opts.forEach(function (o) {
          var on = picks[q.key] === o;
          html += '<button data-k="' + q.key + '" data-v="' + o + '" style="margin:3px;padding:6px 12px;border-radius:8px;cursor:pointer;' +
            "font-family:inherit;font-size:12px;background:" + (on ? "rgba(45,226,255,.15)" : "#0c1220") +
            ";color:" + (on ? C.cyan : C.dim) + ";border:1px solid " + (on ? C.cyan : "#1c2a45") + '">' + o + "</button>";
        });
        html += "</div>";
      });
      html += '<div style="margin:14px 0 6px;color:' + C.dim + '">VERDICTS</div>';
      var scored = systems.map(function (s) { var r = s.fit(picks); return { name: s.name, score: r[0], why: r[1] }; })
        .sort(function (a, b) { return b.score - a.score; });
      scored.forEach(function (s) {
        var col = s.score === 2 ? C.green : s.score === 1 ? C.gold : C.dim;
        var mark = s.score === 2 ? "★ strong fit " : s.score === 1 ? "◐ workable  " : "○ poor fit  ";
        html += '<div style="padding:5px 8px;margin:3px 0;border-left:3px solid ' + col + ";background:rgba(255,255,255,.02)\">" +
          '<span style="color:' + col + '">' + mark + "</span><b style=\"color:" + C.text + '">' + s.name + "</b>" +
          ' <span style="color:' + C.dim + '"> — ' + s.why + "</span></div>";
      });
      wrapDiv.innerHTML = html;
      wrapDiv.querySelectorAll("button").forEach(function (b) {
        b.addEventListener("click", function () { picks[b.dataset.k] = b.dataset.v; render(); });
      });
    }
    render();
    f.say("Pick your workload's traits — verdicts re-rank live. Notice how often the boring answer wins.");
  };

})();
