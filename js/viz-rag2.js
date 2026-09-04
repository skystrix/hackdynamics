/* ==========================================================================
   viz-rag2.js — RAG In Depth machines, batch 2: chapters 5–9.

     chunker          ch5  Playground  cut the same page five ways
     chunkSizeCurve   ch5  Tuner       Chroma's measured recall/precision table
     parentChild      ch6  Builder     match children, return parents, over-fetch
     vectorSpace      ch7  Playground  cosine, dot and L2 disagree until you normalize
     quantizeVec      ch7  Tuner       four rungs of the precision ladder
     contrastiveTrain ch8  Simulator   InfoNCE in 2-D, with and without hard negatives
     invertedIndex    ch9  Builder     dictionary and postings, analyzer toggles
     bm25Tuner        ch9  Tuner       k1 and b, with the three terms broken out

   Helpers come from js/viz-rag-kit.js, which must load first.
   ========================================================================== */

(function () {
  "use strict";
  window.VIZ = window.VIZ || {};
  var K = window.RAGKIT;
  var C = K.C, S = K.S, T = K.T, rect = K.rect, line = K.line, defsArrow = K.defsArrow,
      frame = K.frame, slider = K.slider, tabs = K.tabs, toggle = K.toggle, tipOn = K.tipOn;

  /* ========================================================================
     1. chunker — CH 5 — Playground
     The cello sentence, cut in half by a fixed window and kept whole by a
     recursive one, at the same size.
     ======================================================================== */
  VIZ.chunker = function (el) {
    var f = frame(el);

    var TEXT =
      "Cabin baggage\n" +
      "One personal item and one cabin bag not exceeding 55 x 40 x 20 cm and 8 kg are " +
      "carried without charge on all Larkspur fares.\n" +
      "Musical instruments\n" +
      "A cello, double bass or guitar may be carried in the cabin if an extra seat is " +
      "purchased at the applicable adult fare. The instrument must be secured in the seat " +
      "with the supplied strap.\n" +
      "Sports equipment\n" +
      "Skis, golf bags and bicycles are carried as checked baggage for 45 EUR per item, " +
      "subject to space, and must be pre-booked.";

    // The sentence the chapter asks the learner to find.
    var CELLO = "A cello, double bass or guitar may be carried in the cabin if an extra seat is purchased at the applicable adult fare.";

    var strategy = 0, size = 200, overlap = 0;   // 0 fixed, 1 recursive, 2 sentence
    var STRAT = ["fixed", "recursive", "sentence"];
    // Recursive separators, most structural first — chapter 5's hierarchy.
    var SEPS = ["\n\n", "\n", ". ", " "];

    function fixedChunks(t, n, ov) {
      var out = [], i = 0, step = Math.max(1, n - ov);
      while (i < t.length) { out.push(t.slice(i, i + n)); i += step; }
      return out;
    }
    function splitOn(t, sep, n) {
      // recursive: try to cut on the most structural separator that fits
      if (t.length <= n) return [t];
      for (var s = 0; s < SEPS.length; s++) {
        var parts = t.split(SEPS[s]);
        if (parts.length < 2) continue;
        var out = [], cur = "";
        for (var i = 0; i < parts.length; i++) {
          var piece = parts[i] + (i < parts.length - 1 ? SEPS[s] : "");
          if (cur.length + piece.length > n && cur) { out.push(cur); cur = piece; }
          else cur += piece;
        }
        if (cur) out.push(cur);
        // if any piece is still too big, keep descending
        var ok = out.every(function (c) { return c.length <= n; });
        if (ok) return out;
        var deeper = [];
        out.forEach(function (c) {
          deeper = deeper.concat(c.length <= n ? [c] : splitOn(c, null, n));
        });
        return deeper;
      }
      return fixedChunks(t, n, 0);
    }
    function sentenceChunks(t, n) {
      var sents = t.split(/(?<=[.!?])\s+|\n/).filter(function (x) { return x.trim(); });
      var out = [], cur = "";
      sents.forEach(function (s) {
        if ((cur + " " + s).length > n && cur) { out.push(cur.trim()); cur = s; }
        else cur = cur ? cur + " " + s : s;
      });
      if (cur) out.push(cur.trim());
      return out;
    }
    function chunks() {
      if (strategy === 0) return fixedChunks(TEXT, size, overlap);
      if (strategy === 1) return splitOn(TEXT, null, size);
      return sentenceChunks(TEXT, size);
    }

    var wrap = K.div("");
    wrap.style.cssText = "font:12.5px/1.7 var(--mono,ui-monospace);white-space:pre-wrap;" +
      "border:1px solid var(--line);border-radius:6px;padding:10px;background:var(--bg-3);margin-bottom:8px";
    f.body.appendChild(wrap);
    var svg = S("svg", { viewBox: "0 0 720 86", role: "img" }, f.body);

    var TINTS = ["var(--tint-primary)", "var(--tint-teal)", "var(--tint-green)",
                 "rgba(221,91,0,.12)", "rgba(255,100,200,.12)", "rgba(214,182,246,.28)"];
    var EDGES = [C.blue, C.teal, C.green, C.orange, C.pink, C.purple];

    function render() {
      var cs = chunks();
      // paint the text, one span per chunk
      wrap.innerHTML = "";
      cs.forEach(function (c, i) {
        var sp = document.createElement("span");
        sp.textContent = c;
        // a visible left edge per chunk: the tints alone are too faint to read
        // as boundaries, and boundaries are the entire point of this machine.
        sp.style.cssText = "background:" + TINTS[i % TINTS.length] +
          ";border-radius:3px;box-shadow:inset 2px 0 0 0 " + EDGES[i % EDGES.length] +
          ", inset 0 0 0 1px var(--line)";
        sp.title = "chunk " + (i + 1) + " · " + c.length + " characters";
        wrap.appendChild(sp);
      });

      // is the cello sentence whole inside any single chunk?
      var whole = cs.some(function (c) { return c.indexOf(CELLO) >= 0; });

      svg.innerHTML = "";
      var lens = cs.map(function (c) { return c.length; });
      var max = Math.max.apply(null, lens);
      T(svg, 24, 14, cs.length + " chunks · " + Math.round(lens.reduce(function (a, b) { return a + b; }, 0) / cs.length) +
        " characters average · longest " + max, { anchor: "start", size: 11, fill: C.dim });
      var bx = 24, bw = Math.min(28, (672 - cs.length * 3) / Math.max(1, cs.length));
      cs.forEach(function (c, i) {
        var h = Math.max(3, (c.length / max) * 34);
        rect(svg, bx + i * (bw + 3), 52 - h, bw, h, {
          fill: c.indexOf(CELLO) >= 0 ? C.green : C.blue, stroke: "none", rx: 2
        });
      });
      T(svg, 24, 72, whole
        ? "✓ the cello sentence survives whole inside one chunk (green)"
        : "✘ the cello sentence is split across chunks: no chunk says a cello needs a seat",
        { anchor: "start", size: 11.5, fill: whole ? C.green : C.pink, weight: 700 });

      f.say(whole
        ? (strategy === 0
            ? "Whole here, but only by luck of where this window landed. Recursive keeps it whole because it cuts on boundaries, not counts."
            : STRAT[strategy] + " cut on a boundary, so the sentence survived. That is the whole argument for the next section.")
        : "Find the cello sentence above: it now exists as two fragments, neither of which says a cello needs a seat. Switch to recursive at the same size.");
    }

    function controls() {
      f.controls.innerHTML = "";
      tabs(f.controls, STRAT, strategy, function (i) { strategy = i; controls(); render(); });
      slider(f.controls, "size", 80, 600, size, 10, String, function (v) { size = v; render(); });
      if (strategy === 0)
        slider(f.controls, "overlap", 0, 200, overlap, 10, String, function (v) { overlap = v; render(); });
      f.btn("reset", function () { strategy = 0; size = 200; overlap = 0; controls(); render(); });
    }
    controls(); render();
    f.say("Drag the size slider to 200 on fixed. Find the sentence that got cut in half.");
  };

  /* ========================================================================
     2. chunkSizeCurve — CH 5 — Tuner
     Chroma's measured table. Nothing here is modelled; the rows are the rows,
     and the noise band is the one the chapter insists on.
     ======================================================================== */
  VIZ.chunkSizeCurve = function (el) {
    var f = frame(el);
    var svg = S("svg", { viewBox: "0 0 720 300", role: "img" }, f.body);

    // Chroma 2024, five corpora, text-embedding-3-large, five chunks retrieved,
    // token level, in percent. size, overlap, recall, precision, label.
    var ROWS = [
      { size: 200, ov: 0,   recall: 88.1, prec: 7.0, label: "sharpest chunks" },
      { size: 400, ov: 0,   recall: 89.5, prec: 3.6, label: "best recall" },
      { size: 400, ov: 200, recall: 88.1, prec: 3.3, label: "overlap: both down" },
      { size: 800, ov: 400, recall: 85.4, prec: 1.5, label: "big + overlapped: worst" }
    ];
    var OTHER = [
      { name: "cluster-semantic 200", recall: 87.3, prec: 8.0, note: "highest precision tested" },
      { name: "LLM chunker (~240)",   recall: 91.9, prec: 3.9, note: "highest recall, costliest" }
    ];
    var metric = 0;          // 0 recall, 1 precision
    var showOverlap = true;
    var NOISE = 2.0;         // the chapter: treat differences under 2 points as noise

    function render() {
      svg.innerHTML = "";
      var key = metric === 0 ? "recall" : "prec";
      var pts = ROWS.filter(function (r) { return showOverlap || r.ov === 0; });
      var vals = ROWS.map(function (r) { return r[key]; });
      var lo = Math.min.apply(null, vals) - 3, hi = Math.max.apply(null, vals) + 3;

      var X0 = 70, X1 = 560, Y0 = 46, Y1 = 176;
      function px(sz) { return X0 + (Math.log2(sz) - Math.log2(200)) / (Math.log2(800) - Math.log2(200)) * (X1 - X0); }
      function py(v) { return Y1 - (v - lo) / (hi - lo) * (Y1 - Y0); }

      T(svg, 24, 16, "Chroma 2024 · five corpora · text-embedding-3-large · five chunks retrieved · token level, percent",
        { anchor: "start", size: 10, fill: C.dim });
      T(svg, 24, 32, metric === 0 ? "recall — the fraction of relevant tokens retrieved"
                                  : "precision — the fraction of retrieved tokens that are relevant",
        { anchor: "start", size: 11.5, fill: C.text, weight: 700 });

      rect(svg, X0, Y0, X1 - X0, Y1 - Y0, { fill: "none", stroke: C.line, rx: 4 });
      [200, 400, 800].forEach(function (sz) {
        T(svg, px(sz), Y1 + 16, String(sz), { size: 10, fill: C.faint });
      });
      T(svg, (X0 + X1) / 2, Y1 + 32, "chunk size, tokens", { size: 10, fill: C.faint });

      // the knee: where recall stops rising
      var knee = 400;
      line(svg, px(knee), Y0, px(knee), Y1, { stroke: C.orange, sw: 1.5, dash: "4 4" });
      T(svg, px(knee) + 20, Y0 + 12, "knee", { size: 10, fill: C.orange, weight: 700 });

      // no-overlap series
      var series = ROWS.filter(function (r) { return r.ov === 0; });
      var d = series.map(function (r, i) { return (i ? "L " : "M ") + px(r.size) + " " + py(r[key]); }).join(" ");
      // the 800 point only exists with overlap, so the plain line stops at 400
      S("path", { d: d, fill: "none", stroke: C.blue, "stroke-width": 2.5 }, svg);

      pts.forEach(function (r) {
        var x = px(r.size), y = py(r[key]);
        // the noise band the chapter insists on
        rect(svg, x - 9, py(r[key] + NOISE), 18, py(r[key] - NOISE) - py(r[key] + NOISE),
          { fill: r.ov ? C.orange : C.blue, stroke: "none", rx: 2, op: 0.16 });
        S("circle", { cx: x, cy: y, r: 5, fill: r.ov ? C.orange : C.blue }, svg);
        if (r.ov) {
          T(svg, x + 30, y + 6, r[key].toFixed(1), { size: 10.5, fill: C.orange, weight: 700 });
          T(svg, x + 30, y + 19, "overlap " + r.ov, { size: 9, fill: C.orange });
        } else {
          T(svg, x, y - 15, r[key].toFixed(1), { size: 10.5, fill: C.blue, weight: 700 });
        }
      });

      // the alternatives, as reference lines
      OTHER.forEach(function (o, i) {
        var y = py(o[key]);
        if (y > Y0 && y < Y1) {
          line(svg, X0, y, X1, y, { stroke: C.green, sw: 1, dash: "2 4" });
          T(svg, X0 + 6, y - 6, o.name + " " + o[key].toFixed(1), { anchor: "start", size: 9, fill: C.green });
        }
      });

      // the table
      var tx = 580;
      T(svg, tx, 46, "size/ov", { anchor: "start", size: 9.5, fill: C.faint, weight: 700 });
      T(svg, tx + 74, 46, "rec", { anchor: "end", size: 9.5, fill: C.faint, weight: 700 });
      T(svg, tx + 120, 46, "prec", { anchor: "end", size: 9.5, fill: C.faint, weight: 700 });
      ROWS.forEach(function (r, i) {
        var y = 66 + i * 18;
        T(svg, tx, y, r.size + "/" + r.ov, { anchor: "start", size: 9.5, fill: r.ov ? C.orange : C.text });
        T(svg, tx + 74, y, r.recall.toFixed(1), { anchor: "end", size: 9.5,
          fill: metric === 0 ? C.text : C.faint, weight: metric === 0 ? 700 : 400 });
        T(svg, tx + 120, y, r.prec.toFixed(1), { anchor: "end", size: 9.5,
          fill: metric === 1 ? C.text : C.faint, weight: metric === 1 ? 700 : 400 });
      });

      // the reading
      rect(svg, 24, 212, 672, 74, { fill: C.panel, stroke: C.line });
      var lines = metric === 0
        ? ["Recall is nearly flat from 200 to 400 and falls at 800. The answer is found about as often",
           "whatever the size, until chunks get big enough to dilute. The knee is where recall stops rising,",
           "and the right size is the smallest one at the knee."]
        : ["Precision moves by a factor of five: 7.0 at 200 tokens against 1.5 at 800. Smaller chunks do not",
           "find more; they find the same thing with far less noise around it, and Chapter 17 shows that",
           "noise in the context is not free."];
      lines.forEach(function (t, i) {
        T(svg, 40, 232 + i * 15, t, { anchor: "start", size: 10.5, fill: C.dim });
      });
      f.say(showOverlap
        ? "The two orange points are the overlapped runs, and both sit below the plain ones. Overlap lowered recall AND precision here, and the shaded band is the ±2 points the chapter calls noise: read that difference as 'nothing', not as 'worse'."
        : "Only the no-overlap runs. Turn overlap back on and watch both metrics fail to improve.");
    }

    function controls() {
      f.controls.innerHTML = "";
      tabs(f.controls, ["recall", "precision"], metric, function (i) { metric = i; controls(); render(); });
      toggle(f.controls, "show overlapped runs", showOverlap, function (v) { showOverlap = v; render(); });
      f.btn("reset", function () { metric = 0; showOverlap = true; controls(); render(); });
    }
    controls(); render();
    f.say("Pick a metric. Find the knee. Then look at what the overlapped runs actually did.");
  };

  /* ========================================================================
     3. parentChild — CH 6 — Builder
     The over-fetch multiplier, and the parent count it decides.
     ======================================================================== */
  VIZ.parentChild = function (el) {
    var f = frame(el);
    var svg = S("svg", { viewBox: "0 0 720 340", role: "img" }, f.body);

    // The toy index the chapter walks through, with its stated ranking.
    var PARENTS = {
      P1: { title: "Refund types", answer: false },
      P2: { title: "Cancellation window", answer: true },   // holds the 24-hour rule
      P3: { title: "Ancillary money-back", answer: false }
    };
    // rank order for Q2, exactly as the chapter states it
    var CHILDREN = [
      { id: "c2", p: "P1", text: "a refund is returned to the original form of payment" },
      { id: "c3", p: "P1", text: "non-refundable fares are issued as travel credit" },
      { id: "c1", p: "P1", text: "refund eligibility depends on the fare type" },
      { id: "c8", p: "P3", text: "money-back guarantee on bag fees paid twice" },
      { id: "c9", p: "P3", text: "ancillary refunds follow the flight's own status" },
      { id: "c6", p: "P2", text: "applies to every fare type, including Basic" },
      { id: "c4", p: "P2", text: "cancel within 24 hours of purchase for a full refund" },
      { id: "c5", p: "P2", text: "the window is measured from the time of booking" }
    ];
    var k = 4, mult = 1;

    function fetched() { return CHILDREN.slice(0, Math.min(CHILDREN.length, k * mult)); }
    function parentsOf(cs) {
      var seen = [], dupes = 0;
      cs.forEach(function (c) {
        if (seen.indexOf(c.p) < 0) seen.push(c.p); else dupes++;
      });
      return { list: seen, dupes: dupes };
    }

    function render() {
      svg.innerHTML = ""; defsArrow(svg);
      var got = fetched(), pr = parentsOf(got);
      var hasAnswer = pr.list.some(function (p) { return PARENTS[p].answer; });

      T(svg, 24, 16, "Q2: “I couldn't take my flight, how do I get my money back?”  ·  k = " +
        k + "  ·  over-fetch ×" + mult + "  →  " + got.length + " children",
        { anchor: "start", size: 11.5, fill: C.text, weight: 600 });

      // children column
      T(svg, 24, 40, "children matched, in rank order", { anchor: "start", size: 10, fill: C.faint, weight: 700 });
      CHILDREN.forEach(function (c, i) {
        var y = 52 + i * 30, on = i < got.length;
        var dup = on && got.slice(0, i).some(function (o) { return o.p === c.p; });
        rect(svg, 24, y, 330, 26, {
          fill: on ? (dup ? "rgba(255,100,200,.10)" : "var(--tint-primary)") : "none",
          stroke: on ? (dup ? C.pink : C.blue) : C.line, sw: on ? 1.8 : 1
        });
        T(svg, 34, y + 13, (i + 1) + ". " + c.id, { anchor: "start", size: 10.5,
          fill: on ? C.text : C.faint, weight: 700 });
        T(svg, 84, y + 13, c.text.slice(0, 36), { anchor: "start", size: 9.5, fill: on ? C.dim : C.faint });
        T(svg, 348, y + 13, c.p, { anchor: "end", size: 10, fill: on ? (dup ? C.pink : C.blue) : C.faint, weight: 700 });
        if (dup) line(svg, 28, y + 13, 350, y + 13, { stroke: C.pink, sw: 1.2 });
      });

      // parents column
      T(svg, 400, 40, "parents returned, after dedupe", { anchor: "start", size: 10, fill: C.faint, weight: 700 });
      Object.keys(PARENTS).forEach(function (p, i) {
        var y = 52 + i * 44, on = pr.list.indexOf(p) >= 0;
        rect(svg, 400, y, 296, 38, {
          fill: on ? (PARENTS[p].answer ? "var(--tint-green)" : "var(--tint-primary)") : "none",
          stroke: on ? (PARENTS[p].answer ? C.green : C.blue) : C.line, sw: on ? 2 : 1
        });
        T(svg, 414, y + 15, p + " — " + PARENTS[p].title, { anchor: "start", size: 11,
          fill: on ? C.text : C.faint, weight: 700 });
        T(svg, 414, y + 29, PARENTS[p].answer ? "holds the 24-hour rule, which answers Q2"
                                              : "does not answer Q2",
          { anchor: "start", size: 9, fill: on ? (PARENTS[p].answer ? C.green : C.dim) : C.faint });
      });

      var vy = 196;
      rect(svg, 400, vy, 296, 118, { fill: C.panel, stroke: hasAnswer ? C.green : C.pink, sw: 2 });
      T(svg, 414, vy + 20, "you asked for " + k + " documents", { anchor: "start", size: 11, fill: C.dim });
      T(svg, 414, vy + 40, "you got " + pr.list.length + " distinct parents",
        { anchor: "start", size: 13, fill: pr.list.length < k ? C.pink : C.green, weight: 700 });
      T(svg, 414, vy + 60, pr.dupes + " children collapsed onto a parent already returned",
        { anchor: "start", size: 9.5, fill: C.dim });
      T(svg, 414, vy + 84, hasAnswer ? "✓ the answer is in the returned set"
                                     : "✘ the answer is NOT in the returned set",
        { anchor: "start", size: 11.5, fill: hasAnswer ? C.green : C.pink, weight: 700 });
      T(svg, 414, vy + 102, hasAnswer ? "the generator can answer Q2" :
        "the generator reads these faithfully and says no", { anchor: "start", size: 9.5, fill: C.dim });

      f.say(mult === 1
        ? "Four children, three of them from P1, so four slots bought two documents and neither holds the 24-hour rule. Now set the multiplier to ×2."
        : "×" + mult + " fetches " + got.length + " children and still collapses them to " + pr.list.length +
          " parents, but c6 has pulled in P2 and the answer is in the set. Over-fetching is not optional.");
    }

    function controls() {
      f.controls.innerHTML = "";
      slider(f.controls, "k", 2, 6, k, 1, String, function (v) { k = v; render(); });
      slider(f.controls, "over-fetch ×", 1, 4, mult, 1, String, function (v) { mult = v; render(); });
      f.btn("reset", function () { k = 4; mult = 1; controls(); render(); });
    }
    controls(); render();
    f.say("Run Q2 with over-fetch ×1. Count the distinct parents.");
  };

  /* ========================================================================
     4. vectorSpace — CH 7 — Playground
     Real 2-D vectors, so the geometry on screen IS the geometry being scored.
     ======================================================================== */
  VIZ.vectorSpace = function (el) {
    var f = frame(el);
    var svg = S("svg", { viewBox: "0 0 720 330", role: "img" }, f.body);

    // Chosen so that dot, cosine and L2 each pick a different winner, which is
    // the chapter's worked a/b/c example made plottable.
    var Q = { x: 1, y: 1, label: "query — how do I get my money back?" };
    var DOCS = [
      { id: "a", x: 2,   y: 2,   text: "refund and cancellation policy (long, same topic)" },
      { id: "b", x: 1.1, y: 0.6, text: "travel credit terms (short, nearly the same topic)" },
      { id: "c", x: 3,   y: 0,   text: "baggage charges (long, different topic)" },
      { id: "d", x: 0.4, y: 1.2, text: "no-show policy" },
      { id: "e", x: 0.2, y: 0.3, text: "fleet note — tiny, but points nearly the same way" }
    ];
    var metric = 0, norm = false;   // 0 dot, 1 cosine, 2 L2

    function len(v) { return Math.sqrt(v.x * v.x + v.y * v.y); }
    function unit(v) { var L = len(v) || 1; return { x: v.x / L, y: v.y / L }; }
    function score(q, d) {
      var qq = norm ? unit(q) : q, dd = norm ? unit(d) : d;
      if (metric === 0) return qq.x * dd.x + qq.y * dd.y;
      if (metric === 1) return (q.x * d.x + q.y * d.y) / ((len(q) || 1) * (len(d) || 1));
      return -Math.sqrt(Math.pow(qq.x - dd.x, 2) + Math.pow(qq.y - dd.y, 2));  // negated: bigger is better
    }
    function ranked() {
      return DOCS.map(function (d) { return { d: d, s: score(Q, d) }; })
        .sort(function (m, n) { return n.s - m.s; });
    }

    function render() {
      svg.innerHTML = "";
      var X0 = 40, Y0 = 30, W = 300, H = 240, SC = 68;
      function px(v) { return X0 + v * SC; }
      function py(v) { return Y0 + H - v * SC; }

      T(svg, 24, 16, "the vectors are two-dimensional, so what you see is what is being scored",
        { anchor: "start", size: 10, fill: C.faint });
      // axes
      line(svg, X0, py(0), X0 + W, py(0), { stroke: C.line, sw: 1.5 });
      line(svg, X0, Y0, X0, py(0), { stroke: C.line, sw: 1.5 });
      if (norm) {
        S("path", { d: "M " + px(1) + " " + py(0) + " A " + SC + " " + SC + " 0 0 1 " + px(0) + " " + py(1),
          fill: "none", stroke: C.faint, "stroke-width": 1, "stroke-dasharray": "3 3" }, svg);
        T(svg, px(0.86), py(0.86), "unit circle", { size: 8.5, fill: C.faint });
      }

      var order = ranked();
      var rankOf = {};
      order.forEach(function (r, i) { rankOf[r.d.id] = i + 1; });

      DOCS.forEach(function (d) {
        var v = norm ? unit(d) : d;
        var top = rankOf[d.id] === 1;
        line(svg, px(0), py(0), px(v.x), py(v.y), { stroke: top ? C.green : C.faint, sw: top ? 2 : 1 });
        S("circle", { cx: px(v.x), cy: py(v.y), r: top ? 7 : 5, fill: top ? C.green : C.blue }, svg);
        T(svg, px(v.x) + 12, py(v.y) - 8, d.id + " (" + rankOf[d.id] + ")",
          { anchor: "start", size: 10.5, fill: top ? C.green : C.text, weight: 700 });
        tipOn(svg.lastChild, d.id, d.text);
      });
      var qv = norm ? unit(Q) : Q;
      line(svg, px(0), py(0), px(qv.x), py(qv.y), { stroke: C.orange, sw: 2.5 });
      S("circle", { cx: px(qv.x), cy: py(qv.y), r: 6, fill: C.orange }, svg);
      T(svg, px(qv.x) - 14, py(qv.y) - 10, "q", { anchor: "middle", size: 12, fill: C.orange, weight: 700 });

      // ranking panel
      var tx = 380;
      T(svg, tx, 30, ["dot product", "cosine", "euclidean (L2)"][metric] +
        (norm ? " · normalized" : " · raw vectors"), { anchor: "start", size: 12, fill: C.text, weight: 700 });
      order.forEach(function (r, i) {
        var y = 54 + i * 34;
        rect(svg, tx, y, 316, 28, { fill: i === 0 ? "var(--tint-green)" : C.panel,
          stroke: i === 0 ? C.green : C.line, sw: i === 0 ? 2 : 1 });
        T(svg, tx + 12, y + 14, (i + 1) + ". " + r.d.id, { anchor: "start", size: 11, weight: 700,
          fill: i === 0 ? C.green : C.text });
        T(svg, tx + 56, y + 14, r.d.text.slice(0, 40), { anchor: "start", size: 9, fill: C.dim });
        T(svg, tx + 306, y + 14, (metric === 2 ? (-r.s).toFixed(2) : r.s.toFixed(2)),
          { anchor: "end", size: 10.5, fill: C.dim });
      });

      // the three orderings, side by side, so disagreement is visible at a glance
      var saveM = metric, orders = [0, 1, 2].map(function (m) {
        metric = m; return ranked().map(function (r) { return r.d.id; }).join(" ");
      });
      metric = saveM;
      var agree = orders[0] === orders[1] && orders[1] === orders[2];
      T(svg, tx, 232, "dot      " + orders[0], { anchor: "start", size: 10,
        fill: C.dim, mono: true });
      T(svg, tx, 250, "cosine   " + orders[1], { anchor: "start", size: 10, fill: C.dim });
      T(svg, tx, 268, "L2       " + orders[2], { anchor: "start", size: 10, fill: C.dim });
      T(svg, tx, 294, agree ? "✓ all three metrics agree" : "✘ three metrics, three different orderings",
        { anchor: "start", size: 11.5, fill: agree ? C.green : C.pink, weight: 700 });

      f.say(agree
        ? "Normalized, the dot product IS the cosine, and L2 becomes a decreasing function of it. Three metrics collapse to one ordering, which is why most embedding APIs ship unit vectors."
        : "Raw vectors: dot product rewards c for being long, L2 rewards b for being physically close, cosine cares only about direction. Now turn normalization on.");
    }

    function controls() {
      f.controls.innerHTML = "";
      tabs(f.controls, ["dot product", "cosine", "L2"], metric, function (i) { metric = i; controls(); render(); });
      toggle(f.controls, "normalize", norm, function (v) { norm = v; render(); });
      f.btn("reset", function () { metric = 0; norm = false; controls(); render(); });
    }
    controls(); render();
    f.say("Select dot product with normalization off, and compare the top result to cosine.");
  };

  /* ========================================================================
     5. quantizeVec — CH 7 — Tuner
     The precision ladder, with the measured quality retained at each rung.
     ======================================================================== */
  VIZ.quantizeVec = function (el) {
    var f = frame(el);
    var svg = S("svg", { viewBox: "0 0 720 300", role: "img" }, f.body);

    // bits per dimension, and quality retained vs exact float32 search.
    // float16/int8/binary figures are the Hugging Face study of March 2024.
    var RUNGS = [
      { name: "float32", bits: 32, keep: 1.000, rescored: 1.000, note: "the baseline: exact search" },
      { name: "float16", bits: 16, keep: 0.999, rescored: 1.000, note: "ten bits of mantissa is more precision than an embedding carries" },
      { name: "int8",    bits: 8,  keep: 0.993, rescored: 0.999, note: "256 buckets per dimension, calibrated on a sample; 3.7× search speedup" },
      { name: "binary",  bits: 1,  keep: 0.925, rescored: 0.960, note: "one bit per dimension; distance becomes a popcount" }
    ];
    var rung = 0, dims = 1024, rescore = false;
    var FULL = 1024;

    function bytesPerVec(r, d) { return Math.ceil(d * r.bits / 8); }
    // Matryoshka: truncation costs quality, gently at first then fast.
    function truncKeep(d) {
      var frac = d / FULL;
      return Math.min(1, 0.955 + 0.045 * Math.log2(frac * 8) / 3);
    }

    function render() {
      svg.innerHTML = "";
      var r = RUNGS[rung];
      var q = (rescore ? r.rescored : r.keep) * truncKeep(dims);
      var bytes = bytesPerVec(r, dims);
      var base = bytesPerVec(RUNGS[0], FULL);

      T(svg, 24, 16, "four rungs of the ladder · quality is retrieval quality retained against exact float32 search",
        { anchor: "start", size: 10, fill: C.faint });

      // the ladder
      RUNGS.forEach(function (o, i) {
        var y = 36 + i * 34, on = i === rung;
        rect(svg, 24, y, 300, 28, { fill: on ? "var(--tint-primary)" : "none",
          stroke: on ? C.blue : C.line, sw: on ? 2 : 1 });
        T(svg, 36, y + 14, o.name, { anchor: "start", size: 11.5, weight: on ? 700 : 400,
          fill: on ? C.text : C.dim });
        T(svg, 120, y + 14, o.bits + (o.bits === 1 ? " bit/dim" : " bits/dim"),
          { anchor: "start", size: 10, fill: C.faint });
        T(svg, 314, y + 14, (bytesPerVec(o, dims) / 1024).toFixed(2) + " KB",
          { anchor: "end", size: 10, fill: on ? C.blue : C.faint });
      });

      // memory for a million vectors
      var mbNow = bytes * 1e6 / 1e6, mbBase = base * 1e6 / 1e6;
      T(svg, 24, 190, "memory for one million vectors", { anchor: "start", size: 10.5, fill: C.faint, weight: 700 });
      rect(svg, 24, 200, 300, 18, { fill: C.panel, stroke: C.line, rx: 4 });
      rect(svg, 24, 200, 300 * Math.min(1, mbNow / mbBase), 18, { fill: C.blue, stroke: "none", rx: 4 });
      T(svg, 330, 209, Math.round(mbNow) + " MB", { anchor: "start", size: 11, fill: C.blue, weight: 700 });
      T(svg, 24, 236, "against " + Math.round(mbBase) + " MB at float32 and " + FULL + " dimensions: " +
        (mbBase / mbNow).toFixed(1) + "× smaller", { anchor: "start", size: 10.5, fill: C.dim });

      // quality
      var qx = 400;
      T(svg, qx, 46, "quality retained", { anchor: "start", size: 10.5, fill: C.faint, weight: 700 });
      rect(svg, qx, 56, 280, 22, { fill: C.panel, stroke: C.line, rx: 4 });
      var good = q >= 0.99 ? C.green : q >= 0.95 ? C.orange : C.pink;
      rect(svg, qx, 56, 280 * Math.max(0, (q - 0.85) / 0.15), 22, { fill: good, stroke: "none", rx: 4 });
      T(svg, qx + 274, 67, (q * 100).toFixed(1) + "%", { anchor: "end", size: 13, fill: good, weight: 700 });
      T(svg, qx, 92, "bar starts at 85%: the interesting range is the top",
        { anchor: "start", size: 8.5, fill: C.faint });

      T(svg, qx, 122, r.note, { anchor: "start", size: 10, fill: C.dim });
      if (rung === 3) {
        T(svg, qx, 148, rescore
          ? "rescoring: take the top candidates by Hamming"
          : "no rescoring: the Hamming ranking is final.",
          { anchor: "start", size: 10, fill: rescore ? C.green : C.orange });
        T(svg, qx, 164, rescore
          ? "distance, then reorder with the full vectors."
          : "Turn it on and watch the loss come back.",
          { anchor: "start", size: 10, fill: rescore ? C.green : C.orange });
      }
      T(svg, qx, 200, "dimensions kept (Matryoshka)", { anchor: "start", size: 10.5, fill: C.faint, weight: 700 });
      T(svg, qx, 220, dims + " of " + FULL + " — truncation costs " +
        ((1 - truncKeep(dims)) * 100).toFixed(1) + " points", { anchor: "start", size: 10, fill: C.dim });

      f.say(rung === 3 && !rescore
        ? "Binary is 32× smaller and holds 92.5% of the quality on its own. Now turn rescoring on."
        : rung === 3 ? "Rescoring recovers most of the loss: about 96% retained, still at a thirty-second of the memory."
        : r.name + ": " + bytes + " bytes per vector, " + (q * 100).toFixed(1) + "% of the quality. Step down the ladder.");
    }

    function controls() {
      f.controls.innerHTML = "";
      tabs(f.controls, RUNGS.map(function (r) { return r.name; }), rung, function (i) {
        rung = i; controls(); render();
      });
      slider(f.controls, "dims", 64, FULL, dims, 64, String, function (v) { dims = v; render(); });
      toggle(f.controls, "rescore with full vectors", rescore, function (v) { rescore = v; render(); });
      f.btn("reset", function () { rung = 0; dims = FULL; rescore = false; controls(); render(); });
    }
    controls(); render();
    f.say("Switch to binary. Watch the quality fall. Then turn on rescoring.");
  };

  /* ========================================================================
     6. contrastiveTrain — CH 8 — Simulator
     Real InfoNCE on 2-D points. The refund pair is the one to watch.
     ======================================================================== */
  VIZ.contrastiveTrain = function (el) {
    var f = frame(el);
    var svg = S("svg", { viewBox: "0 0 720 340", role: "img" }, f.body);

    var SEED = [
      { q: "money back after not flying", p: "refund eligibility by fare type", hard: "the 24-hour cancellation window", tag: "refund" },
      { q: "cello in the cabin",          p: "musical instruments need a seat", hard: "cabin bag size limits",            tag: "cello" },
      { q: "my bag never arrived",        p: "delayed baggage, file a report",  hard: "checked baggage charges",          tag: "bag" },
      { q: "can my dog fly with me",      p: "pets in the cabin, 55 EUR",       hard: "emotional support animals",        tag: "pets" }
    ];
    // lr and tau chosen so the chapter's claim is what actually happens: without
    // hard negatives the refund pair never separates, with them it clears at
    // step 37. The sliders still let the learner break that.
    var lr = 0.3, temp = 0.1, hard = false;
    var pts, step, loss, timer = null;

    function rnd(seed) { var x = Math.sin(seed) * 10000; return x - Math.floor(x); }
    function init() {
      pts = SEED.map(function (s, i) {
        return {
          tag: s.tag, qLab: s.q, pLab: s.p, hLab: s.hard,
          q: { x: rnd(i * 3 + 1) * 2 - 1, y: rnd(i * 3 + 2) * 2 - 1 },
          p: { x: rnd(i * 3 + 3) * 2 - 1, y: rnd(i * 3 + 4) * 2 - 1 },
          h: { x: rnd(i * 3 + 5) * 2 - 1, y: rnd(i * 3 + 6) * 2 - 1 }
        };
      });
      // The two refund-ish passages start almost on top of each other: that is
      // the confusable pair the chapter says never separates without hard negatives.
      pts[0].p = { x: 0.62, y: 0.44 };
      pts[0].h = { x: 0.66, y: 0.40 };
      step = 0; loss = [];
    }
    function unit(v) { var L = Math.hypot(v.x, v.y) || 1; return { x: v.x / L, y: v.y / L }; }
    function cos(a, b) { var u = unit(a), w = unit(b); return u.x * w.x + u.y * w.y; }

    function train() {
      // InfoNCE over the batch: every other passage in the batch is a negative,
      // plus the mined hard negative when the toggle is on.
      var total = 0;
      pts.forEach(function (row, i) {
        var cands = [];
        pts.forEach(function (o, j) { cands.push({ v: o.p, pos: i === j, owner: o }); });
        if (hard) pts.forEach(function (o) { cands.push({ v: o.h, pos: false, owner: o }); });
        var logits = cands.map(function (c) { return cos(row.q, c.v) / temp; });
        var m = Math.max.apply(null, logits);
        var exps = logits.map(function (l) { return Math.exp(l - m); });
        var Z = exps.reduce(function (a, b) { return a + b; }, 0);
        var probs = exps.map(function (e) { return e / Z; });
        var posIdx = cands.findIndex(function (c) { return c.pos; });
        total += -Math.log(Math.max(1e-9, probs[posIdx]));
        // gradient: pull the positive toward q, push each negative away, in
        // proportion to how much probability mass it stole.
        cands.forEach(function (c, ci) {
          var g = (c.pos ? probs[ci] - 1 : probs[ci]) * lr;
          var u = unit(row.q);
          c.v.x -= g * u.x; c.v.y -= g * u.y;
          var n = unit(c.v);            // project back onto the unit circle
          c.v.x = n.x; c.v.y = n.y;
        });
      });
      loss.push(total / pts.length);
      if (loss.length > 120) loss.shift();
      step++;
    }
    function recallAt1() {
      var hit = 0;
      pts.forEach(function (row, i) {
        var best = -Infinity, bestOwner = null;
        pts.forEach(function (o) {
          var s = cos(row.q, o.p);
          if (s > best) { best = s; bestOwner = o; }
          if (hard) { var sh = cos(row.q, o.h); if (sh > best) { best = sh; bestOwner = null; } }
        });
        if (bestOwner === row) hit++;
      });
      return hit / pts.length;
    }
    function separation() { return cos(pts[0].q, pts[0].p) - cos(pts[0].q, pts[0].h); }

    function render() {
      svg.innerHTML = "";
      var X0 = 30, Y0 = 34, W = 300, H = 240, CX = X0 + W / 2, CY = Y0 + H / 2, R = 100;
      function px(v) { return CX + v.x * R; }
      function py(v) { return CY - v.y * R; }

      T(svg, 24, 16, "step " + step + " · τ = " + temp.toFixed(2) + " · lr = " + lr.toFixed(2) +
        " · hard negatives " + (hard ? "ON" : "off"), { anchor: "start", size: 11, fill: C.dim });
      S("circle", { cx: CX, cy: CY, r: R, fill: "none", stroke: C.line, "stroke-width": 1 }, svg);

      pts.forEach(function (row, i) {
        var col = [C.blue, C.teal, C.orange, C.purple][i];
        var q = unit(row.q), p = unit(row.p), h = unit(row.h);
        line(svg, px(q), py(q), px(p), py(p), { stroke: col, sw: 1, dash: "3 3" });
        S("circle", { cx: px(q), cy: py(q), r: 5, fill: col }, svg);
        T(svg, px(q), py(q) - 11, "q" + (i + 1), { size: 9, fill: col, weight: 700 });
        S("rect", { x: px(p) - 4, y: py(p) - 4, width: 8, height: 8, fill: col }, svg);
        T(svg, px(p), py(p) + 13, "p" + (i + 1), { size: 9, fill: col });
        if (hard) {
          S("path", { d: "M " + px(h) + " " + (py(h) - 5) + " L " + (px(h) + 5) + " " + (py(h) + 4) +
            " L " + (px(h) - 5) + " " + (py(h) + 4) + " z", fill: "none", stroke: C.pink, "stroke-width": 1.5 }, svg);
        }
      });
      T(svg, X0, Y0 + H + 16, "circle = query · square = its passage" + (hard ? " · triangle = hard negative" : ""),
        { anchor: "start", size: 9, fill: C.faint });

      // loss curve
      var LX = 380, LY = 40, LW = 300, LH = 84;
      T(svg, LX, LY - 10, "InfoNCE loss", { anchor: "start", size: 10.5, fill: C.faint, weight: 700 });
      rect(svg, LX, LY, LW, LH, { fill: "none", stroke: C.line, rx: 4 });
      if (loss.length > 1) {
        var mx = Math.max.apply(null, loss), mn = Math.min.apply(null, loss);
        var d = loss.map(function (v, i) {
          return (i ? "L " : "M ") + (LX + (i / (loss.length - 1)) * LW) + " " +
            (LY + LH - ((v - mn) / ((mx - mn) || 1)) * LH);
        }).join(" ");
        S("path", { d: d, fill: "none", stroke: C.blue, "stroke-width": 2 }, svg);
        T(svg, LX + LW - 4, LY + 12, loss[loss.length - 1].toFixed(3), { anchor: "end", size: 10, fill: C.blue });
      }

      // the refund pair readout
      var sep = separation(), r1 = recallAt1();
      var sy = 150;
      rect(svg, LX, sy, LW, 150, { fill: C.panel, stroke: sep > 0.15 ? C.green : C.pink, sw: 2 });
      T(svg, LX + 14, sy + 20, "the refund pair", { anchor: "start", size: 11.5, fill: C.text, weight: 700 });
      T(svg, LX + 14, sy + 38, "q1  " + pts[0].qLab, { anchor: "start", size: 9, fill: C.dim });
      T(svg, LX + 14, sy + 52, "p1  " + pts[0].pLab, { anchor: "start", size: 9, fill: C.dim });
      T(svg, LX + 14, sy + 66, "n   " + pts[0].hLab, { anchor: "start", size: 9, fill: C.pink });
      T(svg, LX + 14, sy + 90, "separation  cos(q1,p1) − cos(q1,n)", { anchor: "start", size: 9.5, fill: C.faint });
      T(svg, LX + 14, sy + 108, sep.toFixed(3), { anchor: "start", size: 15,
        fill: sep > 0.15 ? C.green : C.pink, weight: 700 });
      T(svg, LX + 120, sy + 108, sep > 0.15 ? "separated" : "still confusable",
        { anchor: "start", size: 10.5, fill: sep > 0.15 ? C.green : C.pink });
      T(svg, LX + 14, sy + 132, "recall@1 over the batch: " + (r1 * 100).toFixed(0) + "%",
        { anchor: "start", size: 10, fill: C.dim });
    }

    function tick() { train(); render(); say(); }
    function say() {
      var sep = separation();
      if (!hard && step > 30 && sep <= 0.15)
        f.say("Thirty steps in and the refund pair has not separated. Every negative in the batch is easy: cello, bags, pets. Nothing in the loss is pushing q1 away from the 24-hour rule. Enable hard negatives.");
      else if (hard && sep > 0.15)
        f.say("Separated. The mined negative is in the batch now, so the gradient lands on the one confusable cell instead of being spread over easy ones.");
      else if (step === 0)
        f.say("Press run. Watch the refund pair fail to separate.");
      else f.say("Step " + step + ": separation " + sep.toFixed(3) + ", loss " +
        (loss.length ? loss[loss.length - 1].toFixed(3) : "—") + ".");
    }
    function stop() { if (timer) { clearInterval(timer); timer = null; } }

    function controls() {
      f.controls.innerHTML = "";
      f.btn("step ▸", function () { stop(); tick(); });
      var runBtn = f.btn("run", function () {
        if (timer) { stop(); runBtn.textContent = "run"; return; }
        // respect a reduced-motion preference: run to completion in one go
        if (window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches) {
          for (var i = 0; i < 60; i++) train();
          render(); say(); return;
        }
        runBtn.textContent = "pause";
        timer = setInterval(function () {
          tick();
          if (step > 200) { stop(); runBtn.textContent = "run"; }
        }, 60);
      });
      toggle(f.controls, "hard negatives", hard, function (v) { hard = v; render(); say(); });
      slider(f.controls, "τ", 0.02, 1, temp, 0.01, function (v) { return v.toFixed(2); },
        function (v) { temp = v; render(); });
      slider(f.controls, "lr", 0.05, 1, lr, 0.05, function (v) { return v.toFixed(2); },
        function (v) { lr = v; render(); });
      f.btn("reset", function () {
        stop(); lr = 0.3; temp = 0.1; hard = false; init(); controls(); render();
        f.say("Press run. Watch the refund pair fail to separate.");
      });
    }
    init(); controls(); render();
    f.say("Press run. Watch the refund pair fail to separate. Then enable hard negatives.");
  };

  /* ========================================================================
     7. invertedIndex — CH 9 — Builder
     Dictionary and postings, and the analyzer that decides what a term is.
     ======================================================================== */
  VIZ.invertedIndex = function (el) {
    var f = frame(el);

    var DOCS = [
      "A cello may be carried in the cabin if an extra seat is purchased.",
      "Cellos and double basses are the instruments we are asked about most.",
      "Cabin bags must not exceed 55 x 40 x 20 cm and 8 kg."
    ];
    var query = "cello", stem = false, stop = false;
    var STOP = ["a", "an", "the", "in", "is", "if", "be", "and", "are", "we", "may", "must", "not", "of", "to"];

    var listWrap = K.div("");
    listWrap.style.cssText = "display:flex;flex-direction:column;gap:6px;margin-bottom:10px";
    f.body.appendChild(listWrap);
    var svg = S("svg", { viewBox: "0 0 720 260", role: "img" }, f.body);

    // A deliberately small Porter-ish stemmer: enough to fold the plural the
    // chapter asks about, and honest about being a toy.
    function stemWord(w) {
      return w.replace(/(ies)$/, "y").replace(/(sses)$/, "ss")
              .replace(/([^s])s$/, "$1").replace(/(ing|ed)$/, "");
    }
    function analyze(text) {
      var toks = text.toLowerCase().replace(/[^a-z0-9\s]/g, " ").split(/\s+/).filter(Boolean);
      if (stop) toks = toks.filter(function (t) { return STOP.indexOf(t) < 0; });
      if (stem) toks = toks.map(stemWord);
      return toks;
    }
    function build() {
      var dict = {};
      DOCS.forEach(function (d, i) {
        analyze(d).forEach(function (t, pos) {
          if (!dict[t]) dict[t] = {};
          if (!dict[t][i]) dict[t][i] = { tf: 0, pos: [] };
          dict[t][i].tf++; dict[t][i].pos.push(pos);
        });
      });
      return dict;
    }

    function renderDocs() {
      listWrap.innerHTML = "";
      DOCS.forEach(function (d, i) {
        var row = document.createElement("div");
        row.style.cssText = "display:flex;gap:6px;align-items:center";
        var lab = document.createElement("span");
        lab.textContent = "d" + i;
        lab.style.cssText = "font:11px var(--mono,ui-monospace);color:var(--text-faint);width:22px";
        var inp = document.createElement("input");
        inp.type = "text"; inp.value = d;
        inp.setAttribute("aria-label", "document " + i);
        inp.style.cssText = "flex:1;font:12px var(--mono,ui-monospace);background:var(--bg-3);" +
          "color:var(--text);border:1px solid var(--line);border-radius:5px;padding:5px 7px";
        inp.addEventListener("input", function () { DOCS[i] = inp.value; render(); });
        var del = document.createElement("button");
        del.type = "button"; del.textContent = "×";
        del.setAttribute("aria-label", "remove document " + i);
        del.addEventListener("click", function () { DOCS.splice(i, 1); renderDocs(); render(); });
        row.appendChild(lab); row.appendChild(inp); row.appendChild(del);
        listWrap.appendChild(row);
      });
    }

    function render() {
      var dict = build();
      var qterms = analyze(query);
      svg.innerHTML = "";

      T(svg, 24, 16, "dictionary — " + Object.keys(dict).length + " distinct terms" +
        (stem ? " · stemming on" : "") + (stop ? " · stopwords removed" : ""),
        { anchor: "start", size: 10.5, fill: C.faint, weight: 700 });

      // the postings for the query terms, then a few others
      var shown = qterms.filter(function (t) { return dict[t]; });
      Object.keys(dict).sort().forEach(function (t) {
        if (shown.length < 9 && shown.indexOf(t) < 0) shown.push(t);
      });

      shown.slice(0, 9).forEach(function (t, i) {
        var y = 34 + i * 22, isQ = qterms.indexOf(t) >= 0;
        var docs = Object.keys(dict[t] || {});
        rect(svg, 24, y, 400, 19, { fill: isQ ? "var(--tint-primary)" : "none",
          stroke: isQ ? C.blue : C.line, sw: isQ ? 1.8 : 1, rx: 4 });
        T(svg, 34, y + 10, t, { anchor: "start", size: 10.5, fill: isQ ? C.text : C.dim,
          weight: isQ ? 700 : 400 });
        T(svg, 150, y + 10, "df " + docs.length, { anchor: "start", size: 9, fill: C.faint });
        T(svg, 196, y + 10, "→ " + docs.map(function (d) {
          return "d" + d + "(" + dict[t][d].tf + ")";
        }).join("  "), { anchor: "start", size: 9.5, fill: isQ ? C.blue : C.faint });
      });

      // results
      var hits = {};
      qterms.forEach(function (t) {
        Object.keys(dict[t] || {}).forEach(function (d) { hits[d] = (hits[d] || 0) + 1; });
      });
      var ids = Object.keys(hits);
      var rx = 448;
      T(svg, rx, 16, "query “" + query + "” → " + analyze(query).join(" "),
        { anchor: "start", size: 10.5, fill: C.text, weight: 700 });
      rect(svg, rx, 26, 248, 120, { fill: C.panel, stroke: ids.length ? C.green : C.pink, sw: 2 });
      if (!ids.length) {
        T(svg, rx + 14, 60, "no documents match", { anchor: "start", size: 11.5, fill: C.pink, weight: 700 });
        T(svg, rx + 14, 80, "the analyzer turned the query into a term", { anchor: "start", size: 9, fill: C.dim });
        T(svg, rx + 14, 94, "that is not in the dictionary", { anchor: "start", size: 9, fill: C.dim });
      } else {
        ids.forEach(function (d, i) {
          T(svg, rx + 14, 48 + i * 22, "d" + d + "  " + DOCS[d].slice(0, 26) + "…",
            { anchor: "start", size: 10, fill: C.text });
        });
        T(svg, rx + 14, 132, ids.length + " document" + (ids.length > 1 ? "s" : "") + " matched",
          { anchor: "start", size: 10, fill: C.green, weight: 700 });
      }

      // the discovery, stated
      var d0 = analyze(DOCS[0] || "").indexOf(stem ? stemWord("cello") : "cello") >= 0;
      var d1 = analyze(DOCS[1] || "").indexOf(stem ? stemWord("cellos") : "cellos") >= 0;
      T(svg, rx, 172, "cello / cellos", { anchor: "start", size: 10.5, fill: C.faint, weight: 700 });
      T(svg, rx, 192, stem ? "stemming folds both to “" + stemWord("cellos") + "”"
                           : "unstemmed, these are two different terms",
        { anchor: "start", size: 10, fill: stem ? C.green : C.orange });
      T(svg, rx, 210, stem ? "so a search for one finds the other"
                           : "so a search for one cannot find the other",
        { anchor: "start", size: 10, fill: stem ? C.green : C.orange });

      f.say(stem
        ? "With stemming on, cello and cellos are one term, so the query reaches both documents. That is also how stemming loses distinctions you may want: it is a lossy fold, applied to the index and the query alike."
        : "Search cello with stemming off and d1, which says cellos, does not match. Toggle stemming.");
    }

    function controls() {
      f.controls.innerHTML = "";
      var inp = document.createElement("input");
      inp.type = "text"; inp.value = query; inp.placeholder = "query…";
      inp.setAttribute("aria-label", "query");
      inp.style.cssText = "font:12px var(--mono,ui-monospace);background:var(--bg-3);color:var(--text);" +
        "border:1px solid var(--line);border-radius:5px;padding:5px 8px;width:150px";
      inp.addEventListener("input", function () { query = inp.value; render(); });
      f.controls.appendChild(inp);
      toggle(f.controls, "stemming", stem, function (v) { stem = v; render(); });
      toggle(f.controls, "stopwords", stop, function (v) { stop = v; render(); });
      f.btn("+ document", function () { DOCS.push("A new document mentioning cellos."); renderDocs(); render(); });
      f.btn("reset", function () {
        DOCS.length = 0;
        DOCS.push("A cello may be carried in the cabin if an extra seat is purchased.",
                  "Cellos and double basses are the instruments we are asked about most.",
                  "Cabin bags must not exceed 55 x 40 x 20 cm and 8 kg.");
        query = "cello"; stem = false; stop = false;
        renderDocs(); controls(); render();
      });
    }
    renderDocs(); controls(); render();
    f.say("Search cello. Document d1 says cellos and does not match. Toggle stemming.");
  };

  /* ========================================================================
     8. bm25Tuner — CH 9 — Tuner
     k1 and b, with IDF, saturation and length normalization broken out.
     ======================================================================== */
  VIZ.bm25Tuner = function (el) {
    var f = frame(el);
    var svg = S("svg", { viewBox: "0 0 720 330", role: "img" }, f.body);

    // Five Larkspur documents. The long policy page and the short FAQ answer
    // are the pair the chapter asks you to watch.
    var DOCS = [
      { id: "FAQ answer",      len: 24,  tf: { refund: 2, fare: 0 }, note: "short, says refund twice" },
      { id: "Fare rules page", len: 210, tf: { refund: 6, fare: 5 }, note: "long, the page that answers Q2" },
      { id: "Travel credit",   len: 62,  tf: { refund: 2, fare: 1 }, note: "medium" },
      { id: "Ticket 9611",     len: 30,  tf: { refund: 2, fare: 0 }, note: "short support ticket" },
      { id: "Baggage charges", len: 48,  tf: { refund: 0, fare: 1 }, note: "mostly unrelated" }
    ];
    var N = 56;                                   // corpus size, the Larkspur set
    var DF = { refund: 14, fare: 9 };             // document frequency per term
    var QUERY = ["refund", "fare"];
    var k1 = 1.2, b = 0.75;

    function avgdl() { return DOCS.reduce(function (a, d) { return a + d.len; }, 0) / DOCS.length; }
    function idf(t) { return Math.log(1 + (N - DF[t] + 0.5) / (DF[t] + 0.5)); }
    function parts(d, t) {
      var tf = d.tf[t] || 0;
      var norm = 1 - b + b * (d.len / avgdl());
      var sat = tf * (k1 + 1) / (tf + k1 * norm);
      return { idf: idf(t), tf: tf, norm: norm, sat: sat, score: idf(t) * sat };
    }
    function total(d) {
      return QUERY.reduce(function (a, t) { return a + parts(d, t).score; }, 0);
    }

    function render() {
      svg.innerHTML = "";
      var scored = DOCS.map(function (d) { return { d: d, s: total(d) }; })
        .sort(function (m, n) { return n.s - m.s; });
      var max = Math.max.apply(null, scored.map(function (r) { return r.s; })) || 1;

      T(svg, 24, 16, "query “refund fare” · k₁ = " + k1.toFixed(2) + " · b = " + b.toFixed(2) +
        " · avgdl = " + avgdl().toFixed(0) + " terms", { anchor: "start", size: 11, fill: C.dim });

      scored.forEach(function (r, i) {
        var y = 38 + i * 50;
        var isFare = r.d.id === "Fare rules page", isFaq = r.d.id === "FAQ answer";
        var col = isFare ? C.green : isFaq ? C.orange : C.blue;
        T(svg, 24, y + 10, (i + 1) + ". " + r.d.id, { anchor: "start", size: 11.5,
          fill: col, weight: (isFare || isFaq) ? 700 : 400 });
        T(svg, 24, y + 24, r.d.note + " · " + r.d.len + " terms", { anchor: "start", size: 8.5, fill: C.faint });

        // the score bar, split by term
        var x = 210, W = 400;
        var acc = 0;
        QUERY.forEach(function (t, ti) {
          var p = parts(r.d, t);
          var w = (p.score / max) * W;
          rect(svg, x + acc, y, w, 20, { fill: ti ? C.sky : col, stroke: "none", rx: 2, op: ti ? 0.65 : 1 });
          if (w > 34) T(svg, x + acc + w / 2, y + 10, t, { size: 8.5, fill: "var(--bg-2)" });
          acc += w;
        });
        T(svg, x + W + 34, y + 10, r.s.toFixed(2), { anchor: "end", size: 12, fill: col, weight: 700 });

        // the three terms broken out for the query's first term
        var p0 = parts(r.d, "refund");
        T(svg, x, y + 34, "refund:  idf " + p0.idf.toFixed(2) +
          "   tf " + p0.tf +
          "   length norm " + p0.norm.toFixed(2) +
          "   saturated tf " + p0.sat.toFixed(2),
          { anchor: "start", size: 8.5, fill: C.faint });
      });

      var fare = scored.findIndex(function (r) { return r.d.id === "Fare rules page"; }) + 1;
      var faq = scored.findIndex(function (r) { return r.d.id === "FAQ answer"; }) + 1;
      rect(svg, 24, 292, 672, 30, { fill: C.panel, stroke: fare < faq ? C.green : C.orange, sw: 2 });
      T(svg, 38, 308, fare < faq
        ? "the long fare rules page now outranks the short FAQ answer (" + fare + " against " + faq + ")"
        : "the short FAQ answer outranks the long fare rules page (" + faq + " against " + fare + ")",
        { anchor: "start", size: 11, fill: fare < faq ? C.green : C.orange, weight: 700 });

      f.say(b < 0.05
        ? "b = 0: length normalization is switched off entirely. A long document is no longer penalised for being long, so the fare rules page, which says refund six times, climbs over the short FAQ answer that says it twice."
        : b > 0.95
        ? "b = 1: full length normalization. Every score is divided by how long the document is relative to the average, which is the harshest setting and favours short documents."
        : k1 < 0.3
        ? "k₁ near zero: term frequency saturates immediately, so saying refund six times counts barely more than saying it once. The score becomes almost pure IDF."
        : "k₁ controls how fast repeated terms stop helping; b controls how hard length is penalised. Slide b to 0 and watch the long page climb.");
    }

    function controls() {
      f.controls.innerHTML = "";
      slider(f.controls, "k₁", 0, 3, k1, 0.1, function (v) { return v.toFixed(1); },
        function (v) { k1 = v; render(); });
      slider(f.controls, "b", 0, 1, b, 0.05, function (v) { return v.toFixed(2); },
        function (v) { b = v; render(); });
      f.btn("reset", function () { k1 = 1.2; b = 0.75; controls(); render(); });
    }
    controls(); render();
    f.say("Slide b to 0. Watch the long page climb.");
  };
})();
