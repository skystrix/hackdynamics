/* ==========================================================================
   viz-rag4.js — RAG In Depth machines, batch 4: chapters 14–18.

     queryRewrite      ch14 Stepper    four ways to stop searching with a question
     rrfFusion         ch15 Playground rank fusion against score fusion
     rerankCascade     ch16 Tuner      k1, k2, and where the knee is
     colbertMaxSim     ch16 Inspector  the token that decides the score
     lostInMiddle      ch17 Tuner      the U, and the closed-book baseline
     contextPacker     ch17 Builder    a budget, an ordering, and what gets dropped
     faithfulnessCheck ch18 Playground decompose an answer, verify each claim

   Every number here is the chapter's own measurement. Where a chapter says a
   figure was redrawn rather than measured (chapter 17's position curve), the
   machine says so too.

   Helpers come from js/viz-rag-kit.js, which must load first.
   ========================================================================== */

(function () {
  "use strict";
  window.VIZ = window.VIZ || {};
  var K = window.RAGKIT;
  var C = K.C, S = K.S, T = K.T, rect = K.rect, line = K.line,
      frame = K.frame, slider = K.slider, tabs = K.tabs, toggle = K.toggle, tipOn = K.tipOn;

  function wrap(str, max) {
    var words = str.split(" "), lines = [""];
    words.forEach(function (w) {
      var last = lines[lines.length - 1];
      if ((last + " " + w).trim().length > max) lines.push(w);
      else lines[lines.length - 1] = (last + " " + w).trim();
    });
    return lines;
  }

  /* ========================================================================
     1. queryRewrite — CH 14 — Stepper
     ======================================================================== */
  VIZ.queryRewrite = function (el) {
    var f = frame(el);
    var svg = S("svg", { viewBox: "0 0 720 350", role: "img" }, f.body);

    var Q2 = "I couldn't take my flight, how do I get my money back?";
    // Measured in chapter 14. The raw question's dense rank for the gold
    // passage is 14 of 56; the rewrites move it.
    var STRATS = [
      { name: "raw", searchText: Q2, rank: 14, cos: 0.391,
        top: ["ticket 9104 — I could not take my flight last week",
              "ticket 9401 — I did not fly, do I get my money back",
              "ticket 9333 — my flight was fine but I could not travel",
              "FAQ, money — how do I get my money back?",
              "ticket 9210 — I missed my flight and want a refund"],
        note: "The question sits closer to other questions (mean cosine 0.647 to the twelve tickets) than to its own answer (0.391). Every one of the top five is somebody else asking it." },
      { name: "HyDE", searchText: "Cheaper fare classes are non-refundable; the value is issued as a travel credit, valid for six months from issue. Taxes are returned on request.",
        rank: 1, cos: 0.767,
        top: ["FARE RULES AND CANCELLATION — the gold passage",
              "travel credit terms — held against the booking reference",
              "taxes and charges — returned when a flight is not flown",
              "ticket 9104 — I could not take my flight last week",
              "flexible fares — classes Y and B cancelled any time"],
        note: "Ask a model to answer with no documents, embed that, and search with its vector. Cosine to the gold passage goes from 0.391 to 0.767. The invented detail (it says six months; the policy says twelve) never reaches the user: only the vector is used." },
      { name: "step-back", searchText: "What is the cancellation policy?",
        rank: 2, cos: 0.584,
        top: ["travel credit terms — held against the booking reference",
              "FARE RULES AND CANCELLATION — the gold passage",
              "cancellation by Larkspur — rerouting or reimbursement",
              "flexible fares — classes Y and B cancelled any time",
              "no-show policy — forfeits the value of that sector"],
        note: "Widen the question into the principle behind it, retrieve the principles, then answer the specific question from them. Measured: dense rank 2, cosine 0.584. Better, and not first: BM25 still puts it at rank 11." },
      { name: "multi-query", searchText: "cancellation policy refund  ·  what happens to the fare if I cancel  ·  travel credit instead of a refund",
        rank: 1, cos: null,
        top: ["FARE RULES AND CANCELLATION — the gold passage",
              "travel credit terms — held against the booking reference",
              "ticket 9755 — is there any way to move the flight",
              "taxes and charges — returned when a flight is not flown",
              "no-show policy — forfeits the value of that sector"],
        note: "Three rewrites, three ranked lists, merged by reciprocal rank fusion. The gold passage was 7th, 7th and 7th in the three lists and first after the merge: a document several phrasings all like beats one a single lucky phrasing loves." }
    ];
    var si = 0, step = 0;

    function render() {
      svg.innerHTML = "";
      var s = STRATS[si];
      T(svg, 24, 16, "Q2: “" + Q2 + "”", { anchor: "start", size: 11.5, fill: C.text, weight: 600 });

      // three steps: rewrite, retrieve, compare
      ["rewrite", "retrieve", "compare"].forEach(function (lab, i) {
        var x = 24 + i * 120, on = step >= i + 1;
        rect(svg, x, 30, 108, 26, { fill: on ? "var(--tint-primary)" : "none",
          stroke: on ? C.blue : C.line, sw: on ? 2 : 1 });
        T(svg, x + 54, 43, (i + 1) + ". " + lab, { size: 10.5, fill: on ? C.text : C.faint,
          weight: on ? 700 : 400 });
      });

      if (step >= 1) {
        T(svg, 24, 78, si === 0 ? "searched with the question itself" : "searched with:",
          { anchor: "start", size: 10, fill: C.faint });
        wrap(s.searchText, 92).slice(0, 3).forEach(function (ln, i) {
          T(svg, 24, 96 + i * 14, ln, { anchor: "start", size: 10, fill: si === 0 ? C.dim : C.orange });
        });
      }
      if (step >= 2) {
        T(svg, 24, 152, "top five", { anchor: "start", size: 10, fill: C.faint, weight: 700 });
        s.top.forEach(function (t, i) {
          var gold = t.indexOf("gold") >= 0;
          var y = 164 + i * 22;
          rect(svg, 24, y, 420, 19, { fill: gold ? "var(--tint-green)" : "none",
            stroke: gold ? C.green : C.line, sw: gold ? 1.8 : 1, rx: 4 });
          T(svg, 34, y + 10, (i + 1) + ".", { anchor: "start", size: 9.5, fill: C.faint });
          T(svg, 54, y + 10, t.slice(0, 52), { anchor: "start", size: 9.5,
            fill: gold ? C.green : C.dim, weight: gold ? 700 : 400 });
        });
      }
      if (step >= 3) {
        var rx = 460;
        T(svg, rx, 152, "rank of the gold passage", { anchor: "start", size: 10, fill: C.faint, weight: 700 });
        STRATS.forEach(function (o, i) {
          var y = 168 + i * 26, cur = i === si;
          rect(svg, rx, y, 236, 22, { fill: cur ? "var(--tint-primary)" : "none",
            stroke: cur ? C.blue : C.line, sw: cur ? 1.8 : 1, rx: 4 });
          T(svg, rx + 10, y + 11, o.name, { anchor: "start", size: 10,
            fill: cur ? C.text : C.dim, weight: cur ? 700 : 400 });
          T(svg, rx + 226, y + 11, o.rank === 1 ? "1st" : o.rank + "th",
            { anchor: "end", size: 11, fill: o.rank === 1 ? C.green : o.rank <= 3 ? C.orange : C.pink,
              weight: 700 });
        });
        rect(svg, 24, 278, 672, 62, { fill: C.panel, stroke: C.line });
        wrap(s.note, 104).slice(0, 3).forEach(function (ln, i) {
          T(svg, 40, 298 + i * 14, ln, { anchor: "start", size: 9.5, fill: C.dim });
        });
      } else {
        T(svg, 24, 300, "press step", { anchor: "start", size: 10, fill: C.faint });
      }

      f.say(step < 3 ? "Step through: rewrite, retrieve, compare."
        : si === 0 ? "The raw question puts the gold passage 14th of 56, behind five people asking the same question. Now try HyDE."
        : si === 1 ? "HyDE moves it to rank 1, and the hypothetical answer it searched with contains a wrong number that nobody ever sees."
        : si === 2 ? "Step-back reaches rank 2, not 1, and BM25 still has it at 11. Better is not the same as fixed."
        : "Three phrasings merged by RRF put it first. Note the second result differs from HyDE's: the strategies do not just re-rank, they retrieve different things.");
    }

    function controls() {
      f.controls.innerHTML = "";
      tabs(f.controls, STRATS.map(function (s) { return s.name; }), si, function (i) {
        si = i; step = 3; controls(); render();
      });
      f.btn("step ▸", function () { step = Math.min(3, step + 1); render(); });
      f.btn("◂ back", function () { step = Math.max(0, step - 1); render(); });
      f.btn("reset", function () { si = 0; step = 0; controls(); render(); });
    }
    controls(); render();
    f.say("Step the raw query first. Note the gold rank. Then try HyDE.");
  };

  /* ========================================================================
     2. rrfFusion — CH 15 — Playground
     ======================================================================== */
  VIZ.rrfFusion = function (el) {
    var f = frame(el);
    var svg = S("svg", { viewBox: "0 0 720 360", role: "img" }, f.body);

    // Chapter 15's worked example, with its raw scores, so the score-fusion
    // tabs are computed from the real distributions rather than invented ones.
    var DOCS = [
      { id: 29, label: "ticket 29", gold: false },
      { id: 4,  label: "doc 4 (gold)", gold: true },
      { id: 28, label: "ticket 28", gold: false },
      { id: 27, label: "ticket 27", gold: false },
      { id: 11, label: "policy 11", gold: false },
      { id: 33, label: "ticket 33", gold: false }
    ];
    var bm25 = [29, 28, 4, 27, 11, 33];        // ranks 1..6 as listed
    var dense = [4, 29, 11, 27, 33, 28];
    var RAW_BM = { 28: 6.30, 29: 6.30, 4: 5.49, 27: 4.50, 11: 2.10, 33: 1.05 };
    var RAW_COS = { 4: 0.358, 29: 0.330, 11: 0.329, 27: 0.306, 33: 0.240, 28: 0.180 };
    var kk = 60, method = 0;                    // 0 RRF, 1 max-norm, 2 z-score

    function rankIn(list, id) { return list.indexOf(id) + 1; }
    function znorm(map) {
      var vals = Object.keys(map).map(function (k) { return map[k]; });
      var mu = vals.reduce(function (a, b) { return a + b; }, 0) / vals.length;
      var sd = Math.sqrt(vals.reduce(function (a, b) { return a + Math.pow(b - mu, 2); }, 0) / vals.length) || 1;
      var out = {}; Object.keys(map).forEach(function (k) { out[k] = (map[k] - mu) / sd; });
      return out;
    }
    function maxnorm(map) {
      var mx = Math.max.apply(null, Object.keys(map).map(function (k) { return map[k]; })) || 1;
      var out = {}; Object.keys(map).forEach(function (k) { out[k] = map[k] / mx; });
      return out;
    }
    function scores() {
      var zb = znorm(RAW_BM), zc = znorm(RAW_COS);
      var nb = maxnorm(RAW_BM), nc = maxnorm(RAW_COS);
      return DOCS.map(function (d) {
        var rb = rankIn(bm25, d.id), rd = rankIn(dense, d.id);
        var parts, total;
        if (method === 0) {
          parts = [1 / (kk + rb), 1 / (kk + rd)];
          total = parts[0] + parts[1];
        } else if (method === 1) {
          parts = [nb[d.id], nc[d.id]]; total = parts[0] + parts[1];
        } else {
          parts = [zb[d.id], zc[d.id]]; total = parts[0] + parts[1];
        }
        return { d: d, rb: rb, rd: rd, parts: parts, total: total };
      }).sort(function (a, b) { return b.total - a.total; });
    }

    function render() {
      svg.innerHTML = "";
      var rows = scores();
      var names = ["reciprocal rank fusion", "max-normalized sum", "z-score sum"];
      T(svg, 24, 16, names[method] + (method === 0 ? "  ·  k = " + kk : "  ·  uses the raw scores"),
        { anchor: "start", size: 11.5, fill: C.text, weight: 700 });

      // the two input lists
      [["BM25", bm25, RAW_BM, C.orange, 24], ["dense", dense, RAW_COS, C.blue, 200]].forEach(function (L) {
        T(svg, L[4], 42, L[0] + " ranking", { anchor: "start", size: 10, fill: L[3], weight: 700 });
        L[1].forEach(function (id, i) {
          var d = DOCS.filter(function (x) { return x.id === id; })[0];
          var y = 54 + i * 24;
          rect(svg, L[4], y, 158, 21, { fill: d.gold ? "var(--tint-green)" : "none",
            stroke: d.gold ? C.green : C.line, sw: d.gold ? 1.6 : 1, rx: 4 });
          T(svg, L[4] + 8, y + 11, (i + 1) + ". " + d.label, { anchor: "start", size: 9.5,
            fill: d.gold ? C.green : C.dim, weight: d.gold ? 700 : 400 });
          T(svg, L[4] + 150, y + 11, L[2][id].toFixed(L[0] === "BM25" ? 2 : 3),
            { anchor: "end", size: 8.5, fill: C.faint });
        });
      });

      // fused
      T(svg, 380, 42, "fused", { anchor: "start", size: 10, fill: C.text, weight: 700 });
      rows.forEach(function (r, i) {
        var y = 54 + i * 24;
        rect(svg, 380, y, 316, 21, { fill: r.d.gold ? "var(--tint-green)" : "none",
          stroke: r.d.gold ? C.green : C.line, sw: r.d.gold ? 1.6 : 1, rx: 4 });
        T(svg, 388, y + 11, (i + 1) + ". " + r.d.label, { anchor: "start", size: 9.5,
          fill: r.d.gold ? C.green : C.dim, weight: r.d.gold ? 700 : 400 });
        T(svg, 560, y + 11, method === 0
          ? r.parts[0].toFixed(5) + " + " + r.parts[1].toFixed(5)
          : r.parts[0].toFixed(2) + " + " + r.parts[1].toFixed(2),
          { anchor: "start", size: 8, fill: C.faint });
        T(svg, 690, y + 11, r.total.toFixed(method === 0 ? 5 : 2),
          { anchor: "end", size: 9.5, fill: C.text, weight: 700 });
      });

      var goldRank = rows.findIndex(function (r) { return r.d.gold; }) + 1;
      var y0 = 208;
      rect(svg, 24, y0, 672, 60, { fill: C.panel, stroke: goldRank === 1 ? C.green : C.orange, sw: 2 });
      T(svg, 40, y0 + 22, "the gold passage lands at rank " + goldRank,
        { anchor: "start", size: 12, fill: goldRank === 1 ? C.green : C.orange, weight: 700 });
      T(svg, 40, y0 + 42, method === 0
        ? "ticket 29 is second in both lists; the gold passage is first in one and third in the other. Consensus wins under RRF."
        : method === 1
        ? "BM25 tops out at 6.30 and cosine at 0.358, so after dividing by each maximum the two sides are comparable again."
        : "z-scores make the two distributions comparable in spread, which is more defensible than max-norm and still needs both score sets at query time.",
        { anchor: "start", size: 9.5, fill: C.dim });

      // the scale argument
      var y1 = 278;
      T(svg, 24, y1, "why the scores cannot simply be added", { anchor: "start", size: 10, fill: C.faint, weight: 700 });
      rect(svg, 24, y1 + 10, 320, 20, { fill: C.panel, stroke: C.line, rx: 4 });
      rect(svg, 24, y1 + 10, 320, 20, { fill: C.orange, stroke: "none", rx: 4, op: 0.85 });
      T(svg, 184, y1 + 20, "BM25  max 21.66", { size: 9.5, fill: "var(--bg-2)" });
      rect(svg, 24, y1 + 36, 320, 20, { fill: C.panel, stroke: C.line, rx: 4 });
      rect(svg, 24, y1 + 36, 320 * (0.76 / 21.66), 20, { fill: C.blue, stroke: "none", rx: 4 });
      T(svg, 200, y1 + 46, "cosine  max 0.76", { anchor: "start", size: 9.5, fill: C.blue });
      T(svg, 360, y1 + 30, "add them and the vector side contributes at most 0.76",
        { anchor: "start", size: 9.5, fill: C.dim });
      T(svg, 360, y1 + 46, "against BM25's 21.66: the sum IS BM25.",
        { anchor: "start", size: 9.5, fill: C.pink, weight: 700 });

      f.say(method === 0
        ? (kk <= 5
          ? "At k = " + kk + " the top rank is worth far more than the second, so fusion becomes a vote for whichever list is most confident rather than a consensus between them."
          : "RRF used none of the raw scores. Every contribution came from a position alone. Now raise k, or switch to max-normalization.")
        : "Score fusion needs both score sets at query time and a calibration that survives a model swap. It works here and it is the thing RRF exists to avoid.");
    }

    function controls() {
      f.controls.innerHTML = "";
      tabs(f.controls, ["RRF", "max-norm", "z-score"], method, function (i) { method = i; controls(); render(); });
      slider(f.controls, "k", 1, 100, kk, 1, String, function (v) { kk = v; render(); });
      f.btn("swap gold up in BM25", function () {
        var i = bm25.indexOf(4);
        if (i > 0) { bm25.splice(i, 1); bm25.unshift(4); }
        render();
      });
      f.btn("reset", function () {
        bm25 = [29, 28, 4, 27, 11, 33]; dense = [4, 29, 11, 27, 33, 28];
        kk = 60; method = 0; controls(); render();
      });
    }
    controls(); render();
    f.say("Ticket 29 is second in both lists and beats a gold passage that is first in one. Then raise k and watch the lists flatten.");
  };

  /* ========================================================================
     3. rerankCascade — CH 16 — Tuner
     ======================================================================== */
  VIZ.rerankCascade = function (el) {
    var f = frame(el);
    var svg = S("svg", { viewBox: "0 0 720 320", role: "img" }, f.body);

    // Measured on the Larkspur set, 16 queries, chapter 16.
    var POINTS = { 10: { ndcg: 0.750, ms: 31 }, 20: { ndcg: 0.839, ms: 57 }, 50: { ndcg: 0.839, ms: 131 } };
    var FIRST_STAGE = 0.727;
    var MODELS = [
      { name: "6-layer", perPair: 2.62, ndcgAt20: 0.839, note: "cross-encoder/ms-marco-MiniLM-L-6-v2" },
      { name: "12-layer", perPair: 5.05, ndcgAt20: 0.844, note: "twice the layers, half a point of nDCG" },
      { name: "LLM", perPair: 42, ndcgAt20: 0.851, note: "reads the list; a generation per batch, and a bill" }
    ];
    var k1 = 20, k2 = 8, mi = 0, batched = true;

    function ndcgAt(k) {
      // interpolate the measured curve, then flatten past the knee
      var base = k <= 10 ? 0.727 + (k - 1) / 9 * 0.023
               : k <= 20 ? 0.750 + (k - 10) / 10 * 0.089
               : 0.839;
      return Math.min(0.98, base + (MODELS[mi].ndcgAt20 - 0.839));
    }
    function latency(k) {
      var per = MODELS[mi].perPair * (batched ? 1 : 3.3);
      return Math.round(5 + k * per);
    }
    function cost(k) { return mi === 2 ? (k * 0.00012) : 0; }

    function render() {
      svg.innerHTML = "";
      T(svg, 24, 16, "measured on 16 Larkspur queries · first stage as in chapter 15 (nDCG@10 " +
        FIRST_STAGE.toFixed(3) + ")", { anchor: "start", size: 10, fill: C.faint });

      var X0 = 60, X1 = 420, Y0 = 40, Y1 = 190;
      function px(k) { return X0 + (k - 1) / 99 * (X1 - X0); }
      function pyN(v) { return Y1 - (v - 0.70) / 0.20 * (Y1 - Y0); }
      function pyL(v) { return Y1 - v / 600 * (Y1 - Y0); }
      rect(svg, X0, Y0, X1 - X0, Y1 - Y0, { fill: "none", stroke: C.line, rx: 4 });

      // first-stage baseline
      line(svg, X0, pyN(FIRST_STAGE), X1, pyN(FIRST_STAGE), { stroke: C.faint, sw: 1, dash: "3 3" });
      T(svg, X0 + 5, pyN(FIRST_STAGE) - 6, "first stage " + FIRST_STAGE.toFixed(3),
        { anchor: "start", size: 8.5, fill: C.faint });

      var dn = "", dl = "";
      for (var i = 0; i <= 60; i++) {
        var k = 1 + 99 * i / 60;
        dn += (i ? " L " : "M ") + px(k).toFixed(1) + " " + pyN(ndcgAt(k)).toFixed(1);
        dl += (i ? " L " : "M ") + px(k).toFixed(1) + " " + pyL(latency(k)).toFixed(1);
      }
      S("path", { d: dn, fill: "none", stroke: C.green, "stroke-width": 2.5 }, svg);
      S("path", { d: dl, fill: "none", stroke: C.pink, "stroke-width": 2, "stroke-dasharray": "5 3" }, svg);
      T(svg, X0 + 6, Y0 + 14, "nDCG@10", { anchor: "start", size: 9.5, fill: C.green, weight: 700 });
      T(svg, X1 - 6, Y0 + 14, "latency", { anchor: "end", size: 9.5, fill: C.pink, weight: 700 });

      if (mi === 0 && batched) Object.keys(POINTS).forEach(function (k) {
        S("circle", { cx: px(+k), cy: pyN(POINTS[k].ndcg), r: 4, fill: C.green }, svg);
        S("circle", { cx: px(+k), cy: pyL(POINTS[k].ms), r: 3, fill: C.pink }, svg);
      });
      // the knee
      line(svg, px(20), Y0, px(20), Y1, { stroke: C.orange, sw: 1.5, dash: "4 4" });
      T(svg, px(20) + 6, Y0 + 30, "knee", { anchor: "start", size: 9.5, fill: C.orange, weight: 700 });
      line(svg, px(k1), Y0, px(k1), Y1, { stroke: C.text, sw: 1 });
      S("circle", { cx: px(k1), cy: pyN(ndcgAt(k1)), r: 5, fill: C.text }, svg);
      [1, 20, 50, 100].forEach(function (k) { T(svg, px(k), Y1 + 14, String(k), { size: 9, fill: C.faint }); });
      T(svg, (X0 + X1) / 2, Y1 + 30, "k1 — candidates handed to the reranker", { size: 9.5, fill: C.faint });

      var rx = 448;
      T(svg, rx, 44, MODELS[mi].name + " reranker", { anchor: "start", size: 12.5, fill: C.text, weight: 700 });
      T(svg, rx, 60, MODELS[mi].note, { anchor: "start", size: 8.5, fill: C.faint });
      [["nDCG@10", ndcgAt(k1).toFixed(3), ndcgAt(k1) > 0.83 ? C.green : C.orange],
       ["p95 latency", latency(k1) + " ms", latency(k1) > 200 ? C.pink : C.text],
       ["k2 into the prompt", String(k2), C.text],
       ["gain over first stage", "+" + (ndcgAt(k1) - FIRST_STAGE).toFixed(3), C.green]
      ].forEach(function (r, i) {
        T(svg, rx, 86 + i * 22, r[0], { anchor: "start", size: 10, fill: C.faint });
        T(svg, rx + 248, 86 + i * 22, r[1], { anchor: "end", size: 11.5, fill: r[2], weight: 700 });
      });
      if (mi === 2)
        T(svg, rx, 178, "and a per-query bill: $" + cost(k1).toFixed(4),
          { anchor: "start", size: 10, fill: C.orange });

      rect(svg, 24, 214, 672, 54, { fill: C.panel, stroke: C.line });
      T(svg, 40, 234, "k1 = 20 buys +0.112 nDCG for 26 ms.  k1 = 50 buys 0.000 for another 73 ms.",
        { anchor: "start", size: 11, fill: C.text, weight: 700 });
      T(svg, 40, 254, "Quality saturates once k1 covers the first stage's recall. Latency is linear in k1 by construction and never flattens.",
        { anchor: "start", size: 9.5, fill: C.dim });

      rect(svg, 24, 276, 672, 34, { fill: batched ? "var(--tint-green)" : "rgba(255,100,200,.10)",
        stroke: batched ? C.green : C.pink, sw: 1.8 });
      T(svg, 40, 296, batched
        ? "batched scoring: 50 pairs in 147 ms. One line of code."
        : "scored in a loop: the same 50 pairs take 485 ms, a factor of 3.3 for nothing.",
        { anchor: "start", size: 10.5, fill: batched ? C.green : C.pink, weight: 700 });

      f.say(k1 <= 10
        ? "k1 = " + k1 + " underperforms because the correct passage was not always inside the first ten candidates: the reranker cannot promote what it was never handed."
        : k1 >= 45
        ? "Past the knee the curve is flat and the latency is not. You are paying " + latency(k1) +
          " ms for the same nDCG the knee gave you at 57."
        : mi === 1 ? "Half a percent of nDCG for 76 percent more latency. Reranker size is a dial to measure, not a ladder to climb."
        : "Set k1 to 10, then 50. Watch nDCG flatten while latency does not.");
    }

    function controls() {
      f.controls.innerHTML = "";
      slider(f.controls, "k1", 1, 100, k1, 1, String, function (v) { k1 = v; render(); });
      slider(f.controls, "k2", 1, 20, k2, 1, String, function (v) { k2 = v; render(); });
      tabs(f.controls, MODELS.map(function (m) { return m.name; }), mi, function (i) { mi = i; controls(); render(); });
      toggle(f.controls, "batched", batched, function (v) { batched = v; render(); });
      f.btn("reset", function () { k1 = 20; k2 = 8; mi = 0; batched = true; controls(); render(); });
    }
    controls(); render();
    f.say("Set k1 to 10, then 50, then 100. Watch nDCG and latency.");
  };

  /* ========================================================================
     4. colbertMaxSim — CH 16 — Inspector
     ======================================================================== */
  VIZ.colbertMaxSim = function (el) {
    var f = frame(el);
    var svg = S("svg", { viewBox: "0 0 720 330", role: "img" }, f.body);

    // The measured matrix from chapter 16.
    var QTOK = ["bring", "my", "cello", "cabin"];
    var PASSAGES = [
      { name: "musical instruments (gold)", total: 8.36, gold: true,
        best: { bring: ["carried", 0.599], my: ["an", 0.651], cello: ["cello", 0.945], cabin: ["cabin", 0.904] },
        tokens: ["a", "cello", "double", "bass", "or", "guitar", "may", "be", "carried", "in", "the", "cabin", "if", "an", "extra", "seat"] },
      { name: "cabin baggage", total: 3.11, gold: false,
        best: { bring: ["carried", 0.491], my: ["personal", 0.192], cello: ["40", 0.080], cabin: ["cabin", 0.660] },
        tokens: ["one", "personal", "item", "and", "one", "cabin", "bag", "not", "exceeding", "55", "40", "20", "cm", "and", "8", "kg"] },
      { name: "pets in the cabin", total: 4.49, gold: false,
        best: { bring: ["carry", 0.549], my: ["carry", 0.259], cello: ["carrier", 0.125], cabin: ["cabin", 0.829] },
        tokens: ["cats", "and", "small", "dogs", "travel", "in", "an", "approved", "carrier", "under", "the", "seat", "carry", "cabin", "55", "EUR"] }
    ];
    var pi = 0, hover = null;

    function render() {
      svg.innerHTML = "";
      var p = PASSAGES[pi];
      T(svg, 24, 16, "each query token finds its best match in the passage; the maxima are summed",
        { anchor: "start", size: 10, fill: C.faint });
      T(svg, 24, 36, "Q1: “can I bring my cello in the cabin?”", { anchor: "start", size: 11.5,
        fill: C.text, weight: 600 });

      // the matrix: query tokens down, the passage's best-matching token across
      QTOK.forEach(function (qt, i) {
        var y = 58 + i * 40;
        var b = p.best[qt];
        var decides = b[1] > 0.9 || (qt === "cello");
        rect(svg, 24, y, 672, 34, {
          fill: hover === i ? "var(--tint-primary)" : (decides && p.gold ? "var(--tint-green)" : "none"),
          stroke: hover === i ? C.blue : (decides ? (p.gold ? C.green : C.pink) : C.line),
          sw: hover === i || decides ? 2 : 1
        });
        T(svg, 38, y + 17, qt, { anchor: "start", size: 12, fill: C.text, weight: 700 });
        T(svg, 110, y + 17, "best match →", { anchor: "start", size: 9, fill: C.faint });
        T(svg, 210, y + 17, "“" + b[0] + "”", { anchor: "start", size: 11.5,
          fill: b[1] > 0.5 ? C.green : b[1] > 0.2 ? C.orange : C.pink, weight: 700 });

        // the bar
        var BX = 330, BW = 280;
        rect(svg, BX, y + 10, BW, 14, { fill: C.panel, stroke: C.line, rx: 3 });
        rect(svg, BX, y + 10, BW * b[1], 14, {
          fill: b[1] > 0.5 ? C.green : b[1] > 0.2 ? C.orange : C.pink, stroke: "none", rx: 3 });
        T(svg, BX + BW + 40, y + 17, b[1].toFixed(3), { anchor: "end", size: 11, fill: C.text, weight: 700 });

        var g = svg.lastChild;
        var hit = rect(svg, 24, y, 672, 34, { fill: "transparent", stroke: "none" });
        hit.style.cursor = "pointer";
        hit.addEventListener("mouseenter", function () { hover = i; render(); });
        hit.addEventListener("mouseleave", function () { hover = null; render(); });
        tipOn(hit, qt + " → " + b[0],
          "MaxSim takes the single highest similarity this query token achieves against any token of the passage. " +
          "Here that is " + b[1].toFixed(3) + ".");
      });

      // totals across all three passages
      var y0 = 224;
      T(svg, 24, y0, "MaxSim total, summed over every query token", { anchor: "start", size: 10,
        fill: C.faint, weight: 700 });
      PASSAGES.forEach(function (o, i) {
        var y = y0 + 14 + i * 24, cur = i === pi;
        rect(svg, 24, y, 672, 21, { fill: cur ? "var(--tint-primary)" : "none",
          stroke: cur ? C.blue : C.line, sw: cur ? 1.8 : 1, rx: 4 });
        T(svg, 38, y + 11, o.name, { anchor: "start", size: 10,
          fill: o.gold ? C.green : C.dim, weight: o.gold ? 700 : 400 });
        rect(svg, 260, y + 5, 300 * (o.total / 8.36), 11, {
          fill: o.gold ? C.green : C.faint, stroke: "none", rx: 2 });
        T(svg, 690, y + 11, o.total.toFixed(2), { anchor: "end", size: 11,
          fill: o.gold ? C.green : C.dim, weight: 700 });
      });
      T(svg, 24, 316, "the cello row decides it: 0.945 against 0.080. No single passage vector can hold that.",
        { anchor: "start", size: 9.5, fill: C.dim });

      f.say(pi === 0
        ? "In the gold passage “cello” locks onto the literal token cello at 0.945. Switch to cabin baggage and watch that row collapse."
        : pi === 1
        ? "Here “cello” finds nothing: its best match in the whole passage is the number 40, at 0.080. That one row is the difference between 8.36 and 3.11."
        : "Note “cabin” still scores 0.829 on the pets passage. A wrong passage can answer part of a question perfectly well, which is why the total matters and no single row does.");
    }

    function controls() {
      f.controls.innerHTML = "";
      tabs(f.controls, PASSAGES.map(function (p) { return p.name.split(" (")[0]; }), pi, function (i) {
        pi = i; hover = null; controls(); render();
      });
      f.btn("reset", function () { pi = 0; hover = null; controls(); render(); });
    }
    controls(); render();
    f.say("Hover the cello row. See which passage token it locks onto.");
  };

  /* ========================================================================
     5. lostInMiddle — CH 17 — Tuner
     ======================================================================== */
  VIZ.lostInMiddle = function (el) {
    var f = frame(el);
    var svg = S("svg", { viewBox: "0 0 720 332", role: "img" }, f.body);

    // Chapter 17 is explicit that this curve is REDRAWN from the shape Liu et
    // al. report, not measured on the author's machine. The machine says the
    // same thing rather than implying a measurement that was never made.
    var SIZES = [5, 10, 20];
    var CLOSED = 0.56;                       // the closed-book baseline
    var n = 20, slot = 10;

    function acc(pos, total) {
      // U shape: high at both ends, deepest dip in the middle, and the dip gets
      // deeper as the window grows.
      var t = total === 1 ? 0 : (pos - 1) / (total - 1);
      var depth = 0.10 + (total - 5) / 15 * 0.16;
      var u = Math.pow(2 * t - 1, 2);        // 1 at the ends, 0 in the middle
      var top = 0.78 - (total - 5) / 15 * 0.05;
      return top - depth * (1 - u);
    }

    function render() {
      svg.innerHTML = "";
      var a = acc(slot, n);
      T(svg, 24, 16, "accuracy against the position of the passage that contains the answer",
        { anchor: "start", size: 10.5, fill: C.faint });
      T(svg, 24, 32, "shape redrawn from Liu et al. 2023 — the one figure in this course not measured on the author's machine",
        { anchor: "start", size: 8.5, fill: C.orange });

      var X0 = 60, X1 = 470, Y0 = 50, Y1 = 190;
      function px(p) { return X0 + (p - 1) / (n - 1) * (X1 - X0); }
      function py(v) { return Y1 - (v - 0.45) / 0.35 * (Y1 - Y0); }
      rect(svg, X0, Y0, X1 - X0, Y1 - Y0, { fill: "none", stroke: C.line, rx: 4 });

      // closed-book baseline
      line(svg, X0, py(CLOSED), X1, py(CLOSED), { stroke: C.pink, sw: 1.5, dash: "4 4" });
      T(svg, X1 - 4, py(CLOSED) - 7, "no retrieval at all (closed book)", { anchor: "end", size: 9, fill: C.pink });

      SIZES.forEach(function (sz) {
        var d = "", cur = sz === n;
        for (var p = 1; p <= sz; p++)
          d += (p === 1 ? "M " : " L ") + (X0 + (p - 1) / (sz - 1) * (X1 - X0)).toFixed(1) +
               " " + py(acc(p, sz)).toFixed(1);
        S("path", { d: d, fill: "none", stroke: cur ? C.blue : C.faint,
          "stroke-width": cur ? 3 : 1.2, opacity: cur ? 1 : 0.5 }, svg);
      });
      S("circle", { cx: px(slot), cy: py(a), r: 6, fill: a < CLOSED ? C.pink : C.green }, svg);
      T(svg, X0, Y1 + 14, "first", { anchor: "start", size: 9, fill: C.faint });
      T(svg, (X0 + X1) / 2, Y1 + 14, "middle of the window", { size: 9, fill: C.faint });
      T(svg, X1, Y1 + 14, "last", { anchor: "end", size: 9, fill: C.faint });

      // the window itself, as slots
      var SY = 232, sw = Math.min(30, 440 / n);
      T(svg, 24, SY - 10, "the window: click a slot to move the gold passage",
        { anchor: "start", size: 9.5, fill: C.faint, weight: 700 });
      for (var i = 1; i <= n; i++) {
        var x = 24 + (i - 1) * (sw + 2);
        var g = rect(svg, x, SY, sw, 24, {
          fill: i === slot ? C.green : C.panel, stroke: i === slot ? C.green : C.line,
          sw: i === slot ? 2 : 1, rx: 3 });
        g.style.cursor = "pointer";
        (function (i) { g.addEventListener("click", function () { slot = i; render(); }); })(i);
        if (i === slot) T(svg, x + sw / 2, SY + 12, "★", { size: 11, fill: "var(--bg-2)" });
      }

      var rx = 500;
      rect(svg, rx, 50, 196, 140, { fill: C.panel, stroke: a < CLOSED ? C.pink : C.line, sw: a < CLOSED ? 2 : 1 });
      T(svg, rx + 12, 74, "slot " + slot + " of " + n, { anchor: "start", size: 12, fill: C.text, weight: 700 });
      T(svg, rx + 12, 100, "predicted accuracy", { anchor: "start", size: 9.5, fill: C.faint });
      T(svg, rx + 12, 122, a.toFixed(3), { anchor: "start", size: 18,
        fill: a < CLOSED ? C.pink : C.green, weight: 700 });
      T(svg, rx + 12, 148, a < CLOSED ? "BELOW the closed-book" : "above the closed-book",
        { anchor: "start", size: 10, fill: a < CLOSED ? C.pink : C.dim, weight: a < CLOSED ? 700 : 400 });
      T(svg, rx + 12, 164, a < CLOSED ? "baseline: retrieving hurt" : "baseline of " + CLOSED.toFixed(2),
        { anchor: "start", size: 10, fill: a < CLOSED ? C.pink : C.dim });

      rect(svg, 24, 270, 672, 52, { fill: C.panel, stroke: C.line });
      T(svg, 40, 290, "Ends-first ordering: rank 1 first, rank 2 last, rank 3 second, rank 4 second-to-last.",
        { anchor: "start", size: 10.5, fill: C.text, weight: 700 });
      T(svg, 40, 308, "It costs nothing, changes no retrieval, and puts your two best passages where the model reads most carefully.",
        { anchor: "start", size: 9.5, fill: C.dim });

      f.say(a < CLOSED
        ? "At slot " + slot + " of " + n + " the answer is in the window and the model does worse than if you had retrieved nothing at all. A long window with the answer buried in it can be worth less than no window."
        : slot === 1 || slot === n
        ? "At the ends the model reads it reliably. This is why ordering is a design decision and not an accident of your sort order."
        : "Drag the gold passage further toward the middle, and switch the window size to 20.");
    }

    function controls() {
      f.controls.innerHTML = "";
      tabs(f.controls, SIZES.map(function (s) { return s + " passages"; }), SIZES.indexOf(n), function (i) {
        n = SIZES[i]; slot = Math.min(slot, n); controls(); render();
      });
      slider(f.controls, "slot", 1, n, slot, 1, String, function (v) { slot = v; render(); });
      f.btn("reset", function () { n = 20; slot = 10; controls(); render(); });
    }
    controls(); render();
    f.say("Drag the gold passage to slot 10 of 20. Compare with slot 1.");
  };

  /* ========================================================================
     6. contextPacker — CH 17 — Builder
     ======================================================================== */
  VIZ.contextPacker = function (el) {
    var f = frame(el);
    var svg = S("svg", { viewBox: "0 0 720 340", role: "img" }, f.body);

    // Chapter 17's measured budget: instructions 101, question 15, answer
    // reserve 300, and passages averaging 285 tokens.
    var INSTR = 101, QUESTION = 15, RESERVE = 300, PTOK = 285;
    var CAND = [
      { id: 1, score: 0.94, tok: 285, gold: true,  label: "fare rules and cancellation" },
      { id: 2, score: 0.88, tok: 285, gold: false, label: "travel credit terms" },
      { id: 3, score: 0.71, tok: 285, gold: false, label: "taxes and charges" },
      { id: 4, score: 0.66, tok: 285, gold: false, label: "no-show policy" },
      { id: 5, score: 0.61, tok: 285, gold: false, label: "ticket 9104" },
      { id: 6, score: 0.55, tok: 285, gold: false, label: "flexible fares" },
      { id: 7, score: 0.48, tok: 285, gold: false, label: "cancellation by Larkspur" }
    ];
    var budget = 2000, policy = 0, compress = false;   // 0 by score, 1 ends-first, 2 diversity

    function free() { return Math.max(0, budget - INSTR - QUESTION - RESERVE); }
    function tokOf(c) { return compress ? Math.round(c.tok * 0.62) : c.tok; }
    function chosen() {
      var out = [], used = 0;
      for (var i = 0; i < CAND.length; i++) {
        var t = tokOf(CAND[i]);
        if (used + t > free()) break;
        out.push(CAND[i]); used += t;
      }
      return { list: out, used: used };
    }
    function ordered(list) {
      if (policy === 0) return list.slice();
      if (policy === 1) {                          // ends-first
        var front = [], back = [];
        list.forEach(function (c, i) { (i % 2 === 0 ? front : back).push(c); });
        return front.concat(back.reverse());
      }
      // diversity: interleave so adjacent slots are not near-duplicates
      var out = [], pool = list.slice();
      while (pool.length) { out.push(pool.shift()); if (pool.length) out.push(pool.pop()); }
      return out;
    }

    function render() {
      svg.innerHTML = "";
      var ch = chosen(), ord = ordered(ch.list);
      var dropped = CAND.length - ch.list.length;

      T(svg, 24, 16, "budget " + budget + " tokens · fixed costs " + (INSTR + QUESTION + RESERVE) +
        " (instructions " + INSTR + ", question " + QUESTION + ", answer reserve " + RESERVE + ")",
        { anchor: "start", size: 10, fill: C.faint });

      // the budget bar
      var BX = 24, BW = 672;
      rect(svg, BX, 30, BW, 26, { fill: C.panel, stroke: C.line, rx: 4 });
      var scale = BW / budget;
      var acc = 0;
      [[INSTR, C.purple, "instr"], [QUESTION, C.sky, "q"], [RESERVE, C.orange, "reserve"]].forEach(function (p) {
        rect(svg, BX + acc * scale, 30, p[0] * scale, 26, { fill: p[1], stroke: "none", rx: 0, op: 0.7 });
        if (p[0] * scale > 34) T(svg, BX + (acc + p[0] / 2) * scale, 43, p[2], { size: 8.5, fill: "var(--bg-2)" });
        acc += p[0];
      });
      ord.forEach(function (c, i) {
        var t = tokOf(c);
        rect(svg, BX + acc * scale, 30, t * scale, 26, {
          fill: c.gold ? C.green : C.blue, stroke: "var(--bg-2)", sw: 1, rx: 0, op: c.gold ? 1 : 0.55 });
        if (t * scale > 22) T(svg, BX + (acc + t / 2) * scale, 43, String(i + 1), { size: 9, fill: "var(--bg-2)" });
        acc += t;
      });

      // the packed window, in order
      T(svg, 24, 78, "the packed window, in the order the model reads it",
        { anchor: "start", size: 10, fill: C.faint, weight: 700 });
      ord.forEach(function (c, i) {
        var y = 90 + i * 24;
        var endish = i === 0 || i === ord.length - 1;
        rect(svg, 24, y, 430, 21, {
          fill: c.gold ? "var(--tint-green)" : "none",
          stroke: c.gold ? C.green : (endish ? C.blue : C.line), sw: c.gold ? 2 : (endish ? 1.6 : 1), rx: 4 });
        T(svg, 34, y + 11, "[" + (i + 1) + "]", { anchor: "start", size: 9.5, fill: C.faint });
        T(svg, 66, y + 11, c.label, { anchor: "start", size: 10,
          fill: c.gold ? C.green : C.dim, weight: c.gold ? 700 : 400 });
        T(svg, 330, y + 11, "score " + c.score.toFixed(2), { anchor: "start", size: 8.5, fill: C.faint });
        T(svg, 446, y + 11, tokOf(c) + "t", { anchor: "end", size: 8.5, fill: C.faint });
        if (endish) T(svg, 462, y + 11, "◀ end slot", { anchor: "start", size: 8, fill: C.blue });
      });
      for (var d = 0; d < dropped; d++) {
        var y2 = 90 + (ord.length + d) * 24;
        rect(svg, 24, y2, 430, 21, { fill: "none", stroke: C.line, sw: 1, dash: "3 3", rx: 4 });
        T(svg, 66, y2 + 11, CAND[ord.length + d].label + " — dropped, no room",
          { anchor: "start", size: 9.5, fill: C.faint });
      }

      var rx = 500;
      var goldPos = ord.findIndex(function (c) { return c.gold; }) + 1;
      var goldAtEnd = goldPos === 1 || goldPos === ord.length;
      rect(svg, rx, 88, 196, 120, { fill: C.panel, stroke: goldAtEnd ? C.green : C.orange, sw: 2 });
      T(svg, rx + 12, 110, "passages packed", { anchor: "start", size: 9.5, fill: C.faint });
      T(svg, rx + 184, 110, String(ord.length), { anchor: "end", size: 12, fill: C.text, weight: 700 });
      T(svg, rx + 12, 132, "tokens used", { anchor: "start", size: 9.5, fill: C.faint });
      T(svg, rx + 184, 132, ch.used + " / " + free(), { anchor: "end", size: 11, fill: C.blue, weight: 700 });
      T(svg, rx + 12, 154, "dropped", { anchor: "start", size: 9.5, fill: C.faint });
      T(svg, rx + 184, 154, String(dropped), { anchor: "end", size: 11,
        fill: dropped ? C.orange : C.text, weight: 700 });
      T(svg, rx + 12, 182, goldAtEnd ? "the best passage is in an end slot" : "the best passage is buried at " + goldPos,
        { anchor: "start", size: 9, fill: goldAtEnd ? C.green : C.orange, weight: 700 });

      // the cache prefix marker
      rect(svg, 24, 246, 672, 42, { fill: C.panel, stroke: C.line });
      T(svg, 40, 262, "cache breakpoint", { anchor: "start", size: 10, fill: C.faint, weight: 700 });
      T(svg, 150, 262, "instructions (" + INSTR + " t)  ▸ breakpoint ◂  passages + question (" +
        (ch.used + QUESTION) + " t, new every request)", { anchor: "start", size: 9.5, fill: C.dim });
      T(svg, 40, 278, "the stable part is " + Math.round(INSTR / (INSTR + ch.used + QUESTION) * 100) +
        "% of this prompt, and " + INSTR + " tokens is below every model's minimum cacheable prefix, so it would not cache",
        { anchor: "start", size: 9, fill: C.orange });

      if (compress) {
        rect(svg, 24, 294, 672, 36, { fill: "var(--tint-green)", stroke: C.green, sw: 1.5 });
        T(svg, 40, 316, "compression at 60%: 285 tokens become " + Math.round(285 * 0.62) +
          ". Measured, the answer sentence survived at 60% and 40%, and was cut at 25%.",
          { anchor: "start", size: 9.5, fill: C.green });
      }
      svg.setAttribute("viewBox", "0 0 720 " + (compress ? 340 : 296));

      f.say(policy === 1
        ? "Ends-first puts rank 1 in the first slot and rank 2 in the last, so both of your best passages sit where Chapter 17 measured the model reads most reliably. Same budget, same passages, different order."
        : policy === 0
        ? "By score: the best passage is first and the second-best is second, which buries rank 2 in the middle. Switch to ends-first."
        : "Diversity ordering alternates from the top and the bottom of the list, which spreads near-duplicates apart at the cost of the end slots.");
    }

    function controls() {
      f.controls.innerHTML = "";
      slider(f.controls, "budget", 1000, 8000, budget, 250, String, function (v) { budget = v; render(); });
      tabs(f.controls, ["by score", "ends-first", "diversity"], policy, function (i) { policy = i; controls(); render(); });
      toggle(f.controls, "compression", compress, function (v) { compress = v; render(); });
      f.btn("reset", function () { budget = 2000; policy = 0; compress = false; controls(); render(); });
    }
    controls(); render();
    f.say("Set the budget to 2,000 tokens. Switch ordering to ends-first.");
  };

  /* ========================================================================
     7. faithfulnessCheck — CH 18 — Playground
     ======================================================================== */
  VIZ.faithfulnessCheck = function (el) {
    var f = frame(el);
    var svg = S("svg", { viewBox: "0 0 720 360", role: "img" }, f.body);

    var PASSAGES = [
      { n: 1, text: "Fare classes L, K and T are non-refundable; the fare is retained and issued as a travel credit valid for twelve months." },
      { n: 2, text: "Fare classes Y and B are refunded to the original form of payment within seven working days." },
      { n: 3, text: "Government taxes and airport charges are returned to the original form of payment on request." }
    ];
    // Entailment scores are chapter 18's measured NLI outputs.
    var ANSWERS = [
      { name: "faithful", text: "Your fare is non-refundable and is issued as a travel credit valid for twelve months [1]. Taxes and airport charges can be returned on request [3].",
        claims: [
          { c: "the fare is issued as a travel credit valid for twelve months", cite: 1, e: 1.88, verdict: "supported" },
          { c: "taxes and airport charges can be returned", cite: 3, e: 2.50, verdict: "supported" }
        ],
        note: "Every claim is entailed by the passage it names. This is what the detector is for, and it is the easy case." },
      { name: "plausible (blended)", text: "Your fare is non-refundable [1], and the money returns to your card within seven days [2].",
        claims: [
          { c: "your fare is non-refundable", cite: 1, e: 2.21, verdict: "supported" },
          { c: "the money returns to your card within seven days", cite: 2, e: 2.05, verdict: "supported" }
        ],
        note: "Both claims are supported. Both citations resolve. The answer is still wrong: passage 1 is about L, K and T, passage 2 about Y and B, and no fare is both. Faithfulness scores this 2/2." },
      { name: "mis-cited", text: "The credit can be transferred to another passenger [3].",
        claims: [
          { c: "the credit can be transferred to another passenger", cite: 3, e: -1.74, verdict: "mis-cited" }
        ],
        note: "The claim happens to be true and passage 9 entails it, but the answer cited passage 3, which does not. Only checking the CITED passage catches this." },
      { name: "fabricated", text: "You can request it on the manage-booking page [1].",
        claims: [
          { c: "you can request it on the manage-booking page", cite: 1, e: -2.70, verdict: "unsupported" }
        ],
        note: "No passage entails this at all. Invented, with a citation attached to make it look checked." }
    ];
    var ai = 0, stage = 0;      // 0 answer, 1 decomposed, 2 verified

    function render() {
      svg.innerHTML = "";
      var a = ANSWERS[ai];

      T(svg, 24, 16, "context", { anchor: "start", size: 10, fill: C.faint, weight: 700 });
      PASSAGES.forEach(function (p, i) {
        var y = 26 + i * 30;
        var cited = stage >= 2 && a.claims.some(function (c) { return c.cite === p.n; });
        rect(svg, 24, y, 672, 26, { fill: cited ? "var(--tint-primary)" : "none",
          stroke: cited ? C.blue : C.line, sw: cited ? 1.8 : 1, rx: 4 });
        T(svg, 36, y + 13, "[" + p.n + "]", { anchor: "start", size: 10, fill: C.blue, weight: 700 });
        T(svg, 66, y + 13, p.text.slice(0, 104), { anchor: "start", size: 9.5, fill: C.dim });
      });

      T(svg, 24, 132, "answer", { anchor: "start", size: 10, fill: C.faint, weight: 700 });
      rect(svg, 24, 140, 672, 40, { fill: C.panel, stroke: C.line });
      wrap(a.text, 108).slice(0, 2).forEach(function (ln, i) {
        T(svg, 38, 158 + i * 14, ln, { anchor: "start", size: 10, fill: C.text });
      });

      if (stage >= 1) {
        T(svg, 24, 202, stage >= 2 ? "claims, verified against the passage each one cites" : "claims",
          { anchor: "start", size: 10, fill: C.faint, weight: 700 });
        a.claims.forEach(function (c, i) {
          var y = 212 + i * 40;
          var ok = c.verdict === "supported";
          var col = !stage || stage < 2 ? C.line : ok ? C.green : C.pink;
          rect(svg, 24, y, 672, 34, {
            fill: stage < 2 ? "none" : (ok ? "var(--tint-green)" : "rgba(255,100,200,.10)"),
            stroke: col, sw: stage < 2 ? 1 : 2 });
          T(svg, 38, y + 13, c.c.slice(0, 78), { anchor: "start", size: 10, fill: C.text });
          T(svg, 38, y + 27, "cites passage [" + c.cite + "]", { anchor: "start", size: 8.5, fill: C.faint });
          if (stage >= 2) {
            T(svg, 560, y + 13, c.verdict, { anchor: "start", size: 10.5,
              fill: ok ? C.green : C.pink, weight: 700 });
            T(svg, 560, y + 27, "entailment " + (c.e > 0 ? "+" : "") + c.e.toFixed(2),
              { anchor: "start", size: 8.5, fill: C.faint });
          }
        });
        var yEnd = 212 + a.claims.length * 40 + 6;
        if (stage >= 2) {
          var sup = a.claims.filter(function (c) { return c.verdict === "supported"; }).length;
          rect(svg, 24, yEnd, 672, 62, { fill: C.panel, stroke: ai === 1 ? C.pink : C.line, sw: ai === 1 ? 2 : 1 });
          T(svg, 40, yEnd + 20, "faithfulness " + sup + " / " + a.claims.length + " = " +
            (sup / a.claims.length).toFixed(2), { anchor: "start", size: 12,
            fill: sup === a.claims.length ? (ai === 1 ? C.orange : C.green) : C.pink, weight: 700 });
          wrap(a.note, 100).slice(0, 2).forEach(function (ln, i) {
            T(svg, 40, yEnd + 40 + i * 13, ln, { anchor: "start", size: 9.5, fill: C.dim });
          });
          svg.setAttribute("viewBox", "0 0 720 " + (yEnd + 76));
        } else {
          svg.setAttribute("viewBox", "0 0 720 " + (yEnd + 10));
        }
      } else {
        svg.setAttribute("viewBox", "0 0 720 200");
      }

      f.say(stage === 0 ? "Press decompose to split the answer into claims."
        : stage === 1 ? "Now verify: each claim is checked against the passage it cites, not against the context as a whole."
        : ai === 1 ? "Two supported claims, two resolving citations, faithfulness 1.00, and the answer is wrong. Passage 1 is about fare classes L, K and T; passage 2 is about Y and B. No fare is both, and no per-claim check can see that."
        : ai === 2 ? "The claim is true and a passage entails it, just not the one cited. Checking against the concatenated context would have called this supported."
        : ai === 3 ? "Nothing entails this. The citation was decoration."
        : "Both claims entailed by the passages they name. Now load the plausible answer.");
    }

    function controls() {
      f.controls.innerHTML = "";
      tabs(f.controls, ANSWERS.map(function (a) { return a.name; }), ai, function (i) {
        ai = i; stage = 0; controls(); render();
      });
      f.btn("decompose", function () { stage = Math.max(stage, 1); render(); });
      f.btn("verify", function () { stage = 2; render(); });
      f.btn("reset", function () { ai = 0; stage = 0; controls(); render(); });
    }
    controls(); render();
    f.say("Load the plausible answer. Decompose it. Then find what the verdicts cannot tell you.");
  };
})();
