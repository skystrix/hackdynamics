/* ==========================================================================
   viz-rag6.js — RAG In Depth machines, batch 6: chapters 25–31. The last nine.

     rankMetrics   ch25 Playground  move the gold result and watch which metric moves
     ragTriad      ch26 Stepper     three scores over six answers
     judgeBias     ch26 Tuner       what a judge does when you swap the order
     latencyBudget ch27 Tuner       the stage that owns p95, and the four caches
     aclFilter     ch28 Inspector   four places to put an access rule
     injectionSim  ch28 Simulator   the attack chain, and the one link a control cuts
     traceViewer   ch29 Inspector   three traces and the six checks
     storePicker   ch30 Comparator  the elimination procedure, not a score
     frameworkMap  ch31 Inspector   the same six stages in four vocabularies

   Helpers come from js/viz-rag-kit.js, which must load first.
   ========================================================================== */

(function () {
  "use strict";
  window.VIZ = window.VIZ || {};
  var K = window.RAGKIT;
  var C = K.C, S = K.S, T = K.T, rect = K.rect, line = K.line,
      frame = K.frame, slider = K.slider, tabs = K.tabs, toggle = K.toggle, tipOn = K.tipOn;

  function wrap(str, max) {
    var w = str.split(" "), out = [""];
    w.forEach(function (x) {
      var last = out[out.length - 1];
      if ((last + " " + x).trim().length > max) out.push(x);
      else out[out.length - 1] = (last + " " + x).trim();
    });
    return out;
  }

  /* ========================================================================
     1. rankMetrics — CH 25 — Playground
     Metrics computed live, so the table matches chapter 25 exactly.
     ======================================================================== */
  VIZ.rankMetrics = function (el) {
    var f = frame(el);
    var svg = S("svg", { viewBox: "0 0 720 350", role: "img" }, f.body);

    var grades = [3, 0, 0, 0, 0, 0, 0, 0, 0, 0];   // one relevant result at rank 1
    var kk = 10;

    function mrr() {
      for (var i = 0; i < grades.length; i++) if (grades[i] > 0) return 1 / (i + 1);
      return 0;
    }
    function recallAt(k) {
      var total = grades.filter(function (g) { return g > 0; }).length;
      if (!total) return NaN;
      return grades.slice(0, k).filter(function (g) { return g > 0; }).length / total;
    }
    function precAt(k) {
      return grades.slice(0, k).filter(function (g) { return g > 0; }).length / k;
    }
    function hitAt(k) { return grades.slice(0, k).some(function (g) { return g > 0; }) ? 1 : 0; }
    function ndcgAt(k) {
      var dcg = grades.slice(0, k).reduce(function (a, g, i) {
        return a + (Math.pow(2, g) - 1) / Math.log2(i + 2); }, 0);
      var ideal = grades.slice().sort(function (a, b) { return b - a; }).slice(0, k);
      var idcg = ideal.reduce(function (a, g, i) {
        return a + (Math.pow(2, g) - 1) / Math.log2(i + 2); }, 0);
      return idcg ? dcg / idcg : 0;
    }

    function render() {
      svg.innerHTML = "";
      T(svg, 24, 16, "click a result to cycle its grade 0 → 1 → 2 → 3 · k = " + kk,
        { anchor: "start", size: 10.5, fill: C.faint });

      grades.forEach(function (g, i) {
        var y = 30 + i * 26, inK = i < kk;
        var col = g === 0 ? C.line : g === 1 ? C.sky : g === 2 ? C.orange : C.green;
        var box = rect(svg, 24, y, 380, 23, {
          fill: g ? (g === 3 ? "var(--tint-green)" : "none") : "none",
          stroke: col, sw: g ? 2 : 1, rx: 4, op: inK ? 1 : 0.4 });
        T(svg, 36, y + 12, "rank " + (i + 1), { anchor: "start", size: 9.5,
          fill: inK ? C.dim : C.faint });
        T(svg, 110, y + 12, g === 0 ? "not relevant" : "grade " + g, { anchor: "start", size: 9.5,
          fill: g ? col : C.faint, weight: g ? 700 : 400 });
        if (g) rect(svg, 220, y + 7, 40 * g, 9, { fill: col, stroke: "none", rx: 2 });
        if (i === kk - 1) T(svg, 396, y + 12, "◀ k", { anchor: "start", size: 9, fill: C.orange });
        box.style.cursor = "pointer";
        (function (i) {
          box.addEventListener("click", function () { grades[i] = (grades[i] + 1) % 4; render(); });
        })(i);
      });

      var rx = 430;
      var rows = [
        ["MRR", mrr(), "halves between rank 1 and rank 2"],
        ["recall@" + kk, recallAt(kk), "does not move at all until the gold falls out of k"],
        ["precision@5", precAt(5), "one relevant result in five is 0.200, wherever it sits"],
        ["hit@5", hitAt(5), "binary: in the top five or not"],
        ["nDCG@" + kk, ndcgAt(kk), "the only one that declines smoothly"]
      ];
      rows.forEach(function (r, i) {
        var y = 34 + i * 44;
        rect(svg, rx, y, 266, 38, { fill: C.panel, stroke: i === 4 ? C.green : C.line,
          sw: i === 4 ? 2 : 1 });
        T(svg, rx + 12, y + 15, r[0], { anchor: "start", size: 10.5, fill: C.text, weight: 700 });
        T(svg, rx + 254, y + 15, isNaN(r[1]) ? "—" : r[1].toFixed(3), { anchor: "end", size: 13,
          fill: i === 4 ? C.green : C.text, weight: 700 });
        T(svg, rx + 12, y + 30, r[2], { anchor: "start", size: 8, fill: C.faint });
      });

      rect(svg, 24, 292, 672, 50, { fill: C.panel, stroke: C.line });
      T(svg, 40, 312, "Move the single relevant result from rank 1 to rank 2: MRR halves, recall does not move at all.",
        { anchor: "start", size: 10.5, fill: C.text, weight: 700 });
      T(svg, 40, 330, "Push it past rank 10 and recall falls off a cliff from 1.000 to 0.000. nDCG is the only column that declines smoothly.",
        { anchor: "start", size: 9.5, fill: C.dim });

      var firstRel = grades.findIndex(function (g) { return g > 0; });
      f.say(firstRel < 0 ? "Nothing is relevant, so every metric is zero or undefined. Click a result to grade it."
        : firstRel === 0 ? "The gold result is at rank 1. Click it off and grade rank 2 instead: MRR halves and recall does not budge."
        : firstRel >= kk ? "The gold result has fallen out of the top " + kk +
            ". Recall went from 1.000 to 0.000 in one step, which is what a cliff metric does."
        : "Gold at rank " + (firstRel + 1) + ": MRR " + mrr().toFixed(3) + ", recall unchanged at " +
          recallAt(kk).toFixed(3) + ", nDCG " + ndcgAt(kk).toFixed(3) + ".");
    }

    function controls() {
      f.controls.innerHTML = "";
      slider(f.controls, "k", 1, 10, kk, 1, String, function (v) { kk = v; render(); });
      f.btn("gold → rank 2", function () { grades = grades.map(function () { return 0; }); grades[1] = 3; render(); });
      f.btn("gold → rank 11", function () { grades = grades.map(function () { return 0; }); render(); });
      f.btn("reset", function () {
        grades = [3, 0, 0, 0, 0, 0, 0, 0, 0, 0]; kk = 10; controls(); render();
      });
    }
    controls(); render();
    f.say("Move the relevant result from rank 1 to rank 2. Watch which metrics move.");
  };

  /* ========================================================================
     2. ragTriad — CH 26 — Stepper
     ======================================================================== */
  VIZ.ragTriad = function (el) {
    var f = frame(el);
    var svg = S("svg", { viewBox: "0 0 720 350", role: "img" }, f.body);

    // Measured over six answers to the same question, chapter 26.
    var ANSWERS = [
      { name: "good", claims: 3, faith: 1.00, rel: 0.461, tp: 3, fp: 0, fn: 0, correct: true,
        note: "Faithful, relevant, and correct. The only row where all three agree." },
      { name: "paraphrase", claims: 3, faith: 0.67, rel: 0.491, tp: 1, fp: 1, fn: 2, correct: true,
        note: "Correct, and scored 0.67 on faithfulness and 0.40 on correctness, because the NLI judge missed two of its rewordings." },
      { name: "unfaithful", claims: 3, faith: 1.00, rel: 0.425, tp: 1, fp: 2, fn: 2, correct: false,
        note: "A fabricated claim, and faithfulness scored it 1.00 — the same as the good answer. This is the row that should worry you." },
      { name: "irrelevant", claims: 3, faith: 0.00, rel: 0.024, tp: 0, fp: 3, fn: 3, correct: false,
        note: "The one case every metric agrees on, which is why it is the least useful row in the table." },
      { name: "verbose", claims: 8, faith: 0.75, rel: 0.382, tp: 3, fp: 4, fn: 0, correct: false,
        note: "Perfect recall and the worst precision: it said everything, including four things nobody asked about." },
      { name: "correct refusal", claims: 2, faith: 0.00, rel: 0.351, tp: 0, fp: 0, fn: 0, correct: true,
        note: "A correct refusal scores 0.00 on faithfulness, worst of all six. The metric has no way to reward not answering." }
    ];
    var ai = 0, step = 0;

    function render() {
      svg.innerHTML = "";
      var a = ANSWERS[ai];
      T(svg, 24, 16, "the triad over six answers to the same question", { anchor: "start",
        size: 11, fill: C.text, weight: 600 });

      // the three scores, revealed in order
      var SC = [
        { name: "context relevance", v: null, note: "did retrieval return the right passages" },
        { name: "faithfulness", v: a.faith, note: "is every claim entailed by the context" },
        { name: "answer relevance", v: a.rel, note: "does the answer address the question" }
      ];
      SC.forEach(function (s, i) {
        var y = 34 + i * 52, on = step > i;
        rect(svg, 24, y, 430, 46, { fill: on ? C.panel : "none",
          stroke: on ? (i === 1 && a.faith === 1 && !a.correct ? C.pink : C.blue) : C.line,
          sw: on ? 2 : 1 });
        T(svg, 38, y + 18, (i + 1) + ". " + s.name, { anchor: "start", size: 11,
          fill: on ? C.text : C.faint, weight: 700 });
        T(svg, 38, y + 34, s.note, { anchor: "start", size: 8.5, fill: C.faint });
        if (on && s.v !== null) {
          rect(svg, 250, y + 14, 130, 16, { fill: C.panel, stroke: C.line, rx: 3 });
          rect(svg, 250, y + 14, 130 * s.v, 16, {
            fill: s.v > 0.7 ? C.green : s.v > 0.3 ? C.orange : C.pink, stroke: "none", rx: 3 });
          T(svg, 420, y + 22, s.v.toFixed(3), { anchor: "end", size: 13,
            fill: s.v > 0.7 ? C.green : s.v > 0.3 ? C.orange : C.pink, weight: 700 });
        } else if (on) {
          T(svg, 420, y + 22, "not scored here", { anchor: "end", size: 9, fill: C.faint });
        }
      });

      // the whole table, so the contradictions are visible at once
      var rx = 470;
      T(svg, rx, 30, "all six, measured", { anchor: "start", size: 9.5, fill: C.faint, weight: 700 });
      T(svg, rx + 108, 42, "faith", { anchor: "end", size: 8, fill: C.faint });
      T(svg, rx + 158, 42, "rel", { anchor: "end", size: 8, fill: C.faint });
      T(svg, rx + 216, 42, "correct?", { anchor: "end", size: 8, fill: C.faint });
      ANSWERS.forEach(function (o, i) {
        var y = 54 + i * 24, cur = i === ai;
        var trap = (o.faith === 1 && !o.correct) || (o.faith === 0 && o.correct);
        rect(svg, rx, y, 226, 21, { fill: cur ? "var(--tint-primary)" : "none",
          stroke: cur ? C.blue : (trap ? C.pink : C.line), sw: cur ? 1.8 : (trap ? 1.5 : 1), rx: 4 });
        T(svg, rx + 8, y + 11, o.name, { anchor: "start", size: 9,
          fill: cur ? C.text : (trap ? C.pink : C.dim), weight: cur || trap ? 700 : 400 });
        T(svg, rx + 108, y + 11, o.faith.toFixed(2), { anchor: "end", size: 9,
          fill: o.faith === 1 && !o.correct ? C.pink : C.dim });
        T(svg, rx + 158, y + 11, o.rel.toFixed(3), { anchor: "end", size: 9, fill: C.dim });
        T(svg, rx + 216, y + 11, o.correct ? "yes" : "no", { anchor: "end", size: 9,
          fill: o.correct ? C.green : C.pink, weight: 700 });
      });
      T(svg, rx, 210, "the unfaithful answer scored 1.00,", { anchor: "start", size: 8.5, fill: C.pink });
      T(svg, rx, 222, "and the correct refusal scored 0.00.", { anchor: "start", size: 8.5, fill: C.pink });

      if (step >= 3) {
        rect(svg, 24, 200, 430, 60, { fill: C.panel, stroke: C.line });
        T(svg, 38, 220, "answer correctness: TP " + a.tp + "  FP " + a.fp + "  FN " + a.fn,
          { anchor: "start", size: 10.5, fill: C.text, weight: 700 });
        var p = a.tp + a.fp ? a.tp / (a.tp + a.fp) : 0, r = a.tp + a.fn ? a.tp / (a.tp + a.fn) : 0;
        T(svg, 38, 240, "precision " + p.toFixed(2) + "   recall " + r.toFixed(2) +
          "   F1 " + (p + r ? (2 * p * r / (p + r)).toFixed(2) : "0.00"),
          { anchor: "start", size: 10, fill: C.dim });
        rect(svg, 24, 268, 672, 62, { fill: C.panel, stroke: a.correct ? C.green : C.pink, sw: 2 });
        wrap(a.note, 100).slice(0, 2).forEach(function (ln, i) {
          T(svg, 40, 290 + i * 14, ln, { anchor: "start", size: 10,
            fill: a.correct ? C.green : C.pink });
        });
      }

      f.say(step < 3 ? "Step through the three scores."
        : ai === 2 ? "Faithfulness scored the fabrication 1.00, identically to the good answer. Every claim it made was entailed by SOME passage; none of them was the answer."
        : ai === 5 ? "A correct refusal is the worst-scoring row in the table. The triad has no way to reward not answering, which is exactly the behaviour Chapter 18 spent a chapter building."
        : ai === 4 ? "Perfect recall, worst precision. The verbose answer said everything, and four of its eight claims answered nothing anyone asked."
        : "Now load the unfaithful answer and score it again.");
    }

    function controls() {
      f.controls.innerHTML = "";
      tabs(f.controls, ANSWERS.map(function (a) { return a.name; }), ai, function (i) {
        ai = i; step = 3; controls(); render();
      });
      f.btn("step ▸", function () { step = Math.min(3, step + 1); render(); });
      f.btn("reset", function () { ai = 0; step = 0; controls(); render(); });
    }
    controls(); render();
    f.say("Score the good answer. Then load unfaithful and score again.");
  };

  /* ========================================================================
     3. judgeBias — CH 26 — Tuner
     ======================================================================== */
  VIZ.judgeBias = function (el) {
    var f = frame(el);
    var svg = S("svg", { viewBox: "0 0 720 330", role: "img" }, f.body);

    // Published figures (Zheng et al., MT-Bench), as chapter 26 reports them.
    var JUDGES = [
      { name: "GPT-4", consistency: 0.650, verbosity: 0.087, self: 0.10, human: 0.85 },
      { name: "GPT-3.5", consistency: 0.462, verbosity: 0.913, self: null, human: 0.66 },
      { name: "Claude-v1", consistency: 0.238, verbosity: 0.913, self: 0.25, human: 0.70 }
    ];
    var ji = 0, swap = false, pad = false, selfJudge = false, average = false;

    function agreement() {
      var j = JUDGES[ji], a = j.human;
      if (swap && !average) a -= (1 - j.consistency) * 0.5;
      if (pad) a -= j.verbosity * 0.22;
      if (selfJudge && j.self) a -= j.self * 0.4;
      if (average) a += 0.04;
      return Math.max(0.2, Math.min(0.95, a));
    }

    function render() {
      svg.innerHTML = "";
      var j = JUDGES[ji], ag = agreement();
      T(svg, 24, 16, "published: how LLM judges fail, with numbers (Zheng et al., MT-Bench)",
        { anchor: "start", size: 10, fill: C.faint });

      // the three biases
      var BIAS = [
        { name: "POSITION", on: swap,
          val: (j.consistency * 100).toFixed(1) + "% consistent",
          sub: "changes its mind on " + ((1 - j.consistency) * 100).toFixed(0) + "% of pairs when you swap the order" },
        { name: "VERBOSITY", on: pad,
          val: (j.verbosity * 100).toFixed(1) + "% failure",
          sub: "preferred a padded answer on a repetitive-list attack" },
        { name: "SELF-ENHANCEMENT", on: selfJudge,
          val: j.self === null ? "not reported" : "+" + (j.self * 100).toFixed(0) + "%",
          sub: j.self === null ? "the authors could not confirm this one"
             : "win rate the judge gives its own outputs" }
      ];
      BIAS.forEach(function (b, i) {
        var y = 34 + i * 54;
        rect(svg, 24, y, 430, 48, { fill: b.on ? "rgba(255,100,200,.10)" : "none",
          stroke: b.on ? C.pink : C.line, sw: b.on ? 2 : 1 });
        T(svg, 38, y + 18, b.name, { anchor: "start", size: 10.5,
          fill: b.on ? C.pink : C.dim, weight: 700 });
        T(svg, 420, y + 18, b.val, { anchor: "end", size: 11,
          fill: b.on ? C.pink : C.dim, weight: 700 });
        T(svg, 38, y + 35, b.sub, { anchor: "start", size: 8.5, fill: C.faint });
      });

      // the agreement readout
      var rx = 470;
      T(svg, rx, 34, j.name + " as judge", { anchor: "start", size: 12, fill: C.text, weight: 700 });
      T(svg, rx, 56, "agreement with human labels", { anchor: "start", size: 9.5, fill: C.faint });
      rect(svg, rx, 66, 226, 22, { fill: C.panel, stroke: C.line, rx: 4 });
      rect(svg, rx, 66, 226 * ag, 22, {
        fill: ag > 0.8 ? C.green : ag > 0.6 ? C.orange : C.pink, stroke: "none", rx: 4 });
      T(svg, rx + 218, 108, (ag * 100).toFixed(0) + "%", { anchor: "end", size: 18,
        fill: ag > 0.8 ? C.green : ag > 0.6 ? C.orange : C.pink, weight: 700 });
      T(svg, rx, 108, "baseline " + (j.human * 100).toFixed(0) + "%", { anchor: "start", size: 9, fill: C.faint });

      T(svg, rx, 138, average ? "averaging both orders removes the" : "the one fix that works:",
        { anchor: "start", size: 9, fill: average ? C.green : C.dim });
      T(svg, rx, 150, average ? "position effect at twice the cost." : "run every pair BOTH ways and average.",
        { anchor: "start", size: 9, fill: average ? C.green : C.dim });

      // Claude-v1's first-position preference, which is the sharpest number
      if (ji === 2 && swap && !average) {
        rect(svg, rx, 172, 226, 50, { fill: "rgba(255,100,200,.10)", stroke: C.pink, sw: 2 });
        T(svg, rx + 10, 192, "favours whichever answer", { anchor: "start", size: 9.5, fill: C.pink });
        T(svg, rx + 10, 206, "is FIRST 75.0% of the time", { anchor: "start", size: 11, fill: C.pink, weight: 700 });
      }

      rect(svg, 24, 208, 430, 46, { fill: C.panel, stroke: C.line });
      T(svg, 38, 228, "and yet: GPT-4 agrees with human preference about as often as two humans agree",
        { anchor: "start", size: 9.5, fill: C.dim });
      T(svg, 38, 244, "with each other. A judge can be badly biased and still be the best tool available.",
        { anchor: "start", size: 9.5, fill: C.dim });

      rect(svg, 24, 266, 672, 52, { fill: C.panel, stroke: C.line });
      T(svg, 40, 286, "Use a judge for RELATIVE comparisons under fixed conditions, never as an absolute score.",
        { anchor: "start", size: 10.5, fill: C.text, weight: 700 });
      T(svg, 40, 304, "Fix the order, fix the lengths, average both directions, and report the conditions with the number.",
        { anchor: "start", size: 9.5, fill: C.dim });

      f.say(swap && !average
        ? j.name + " changes its verdict on " + ((1 - j.consistency) * 100).toFixed(0) +
          "% of pairs purely because you swapped which answer came first. Turn on averaging."
        : pad ? "Padding the answer with repetition flips " + (j.verbosity * 100).toFixed(0) +
          "% of " + j.name + "'s verdicts. Length is not quality, and the judge cannot tell."
        : average ? "Averaging both orders removes the position effect, at exactly twice the judging cost."
        : "Toggle position swap. Read the agreement line.");
    }

    function controls() {
      f.controls.innerHTML = "";
      tabs(f.controls, JUDGES.map(function (j) { return j.name; }), ji, function (i) {
        ji = i; controls(); render();
      });
      toggle(f.controls, "position swap", swap, function (v) { swap = v; render(); });
      toggle(f.controls, "length padding", pad, function (v) { pad = v; render(); });
      toggle(f.controls, "judge its own output", selfJudge, function (v) { selfJudge = v; render(); });
      toggle(f.controls, "average both orders", average, function (v) { average = v; render(); });
      f.btn("reset", function () {
        ji = 0; swap = pad = selfJudge = average = false; controls(); render();
      });
    }
    controls(); render();
    f.say("Toggle position swap. Read the agreement line.");
  };

  /* ========================================================================
     4. latencyBudget — CH 27 — Tuner
     ======================================================================== */
  VIZ.latencyBudget = function (el) {
    var f = frame(el);
    var svg = S("svg", { viewBox: "0 0 720 360", role: "img" }, f.body);

    // Measured retrieval budget, chapter 27.
    var STAGES = [
      { name: "rerank 20 (cross-encoder)", p50: 60.0, p95: 71.3, p99: 80.5 },
      { name: "embed query", p50: 8.3, p95: 13.0, p99: 14.6 },
      { name: "bm25 scan (56 docs)", p50: 0.1, p95: 0.2, p99: 0.3 },
      { name: "dense scan (56 vectors)", p50: 0.0, p95: 0.1, p99: 2.6 },
      { name: "fuse (rrf)", p50: 0.0, p95: 0.0, p99: 0.0 }
    ];
    // Measured semantic-cache behaviour at each threshold.
    var CACHE = [
      { t: 0.95, hit: 0.10, falseHits: 0 }, { t: 0.90, hit: 0.20, falseHits: 0 },
      { t: 0.85, hit: 0.30, falseHits: 0 }, { t: 0.80, hit: 0.30, falseHits: 0 },
      { t: 0.70, hit: 0.80, falseHits: 3 }
    ];
    var MODELS = [
      { name: "Claude Opus 5", per1k: 5.89 },
      { name: "Claude Sonnet 5", per1k: 2.35 },
      { name: "Claude Haiku 4.5", per1k: 1.18 }
    ];
    var rerankK = 20, parallel = false, cacheIdx = 2, mi = 1;

    function rerankMs(k) { return { p50: 60.0 * k / 20, p95: 71.3 * k / 20 }; }
    function total(kind) {
      var r = rerankMs(rerankK);
      var seq = STAGES.slice(1).reduce(function (a, s) { return a + s[kind]; }, 0);
      // parallel: the two scans and the embed overlap, so only the slowest counts
      var pre = parallel ? Math.max(STAGES[1][kind], STAGES[2][kind], STAGES[3][kind]) : seq;
      return pre + r[kind === "p95" ? "p95" : "p50"];
    }
    function costPer1k() {
      var c = CACHE[cacheIdx];
      return MODELS[mi].per1k * (1 - c.hit);
    }

    function render() {
      svg.innerHTML = "";
      var t50 = total("p50"), t95 = total("p95");
      T(svg, 24, 16, "measured: the retrieval budget, milliseconds", { anchor: "start",
        size: 10.5, fill: C.faint, weight: 700 });

      var maxMs = Math.max(90, rerankMs(rerankK).p95 + 20);
      var BX = 200, BW = 150;
      var shown = [{ name: "rerank " + rerankK + " (cross-encoder)", p50: rerankMs(rerankK).p50,
                     p95: rerankMs(rerankK).p95 }].concat(STAGES.slice(1));
      shown.forEach(function (s, i) {
        var y = 32 + i * 28;
        var share = s.p50 / (shown.reduce(function (a, x) { return a + x.p50; }, 0) || 1);
        var owns = share > 0.5;
        T(svg, 24, y + 11, s.name, { anchor: "start", size: 9.5,
          fill: owns ? C.pink : C.dim, weight: owns ? 700 : 400 });
        rect(svg, BX, y + 3, BW * (s.p50 / maxMs), 16, {
          fill: owns ? C.pink : C.blue, stroke: "none", rx: 2 });
        rect(svg, BX + BW * (s.p50 / maxMs), y + 3, BW * ((s.p95 - s.p50) / maxMs), 16, {
          fill: owns ? C.pink : C.blue, stroke: "none", rx: 2, op: 0.35 });
        T(svg, BX + BW + 60, y + 11, s.p50.toFixed(1) + " / " + s.p95.toFixed(1),
          { anchor: "end", size: 9, fill: C.dim });
        T(svg, BX + BW + 108, y + 11, (share * 100).toFixed(1) + "%", { anchor: "end", size: 9,
          fill: owns ? C.pink : C.faint, weight: owns ? 700 : 400 });
      });
      T(svg, 24, 180, "solid = p50, faded = the p50→p95 tail. Share is of the median budget.",
        { anchor: "start", size: 8.5, fill: C.faint });

      rect(svg, 24, 192, 430, 60, { fill: C.panel, stroke: C.line });
      T(svg, 38, 212, "request p50 " + t50.toFixed(1) + " ms   ·   p95 " + t95.toFixed(1) + " ms",
        { anchor: "start", size: 11.5, fill: C.text, weight: 700 });
      T(svg, 38, 231, parallel
        ? "embed and the two scans overlap, so only the slowest counts."
        : "stage p95s sum to 84.6 ms; the request p95 was 79.7. Percentiles do not add.",
        { anchor: "start", size: 9, fill: C.dim });
      T(svg, 38, 246, "p95/p50: bm25 2.48×, dense 1.92×, rerank 1.19×, request 1.15×.",
        { anchor: "start", size: 9, fill: C.faint });

      // the cache
      var rx = 470;
      T(svg, rx, 34, "semantic cache", { anchor: "start", size: 10.5, fill: C.faint, weight: 700 });
      CACHE.forEach(function (c, i) {
        var y = 44 + i * 22, cur = i === cacheIdx;
        rect(svg, rx, y, 226, 19, { fill: cur ? "var(--tint-primary)" : "none",
          stroke: cur ? C.blue : C.line, sw: cur ? 1.8 : 1, rx: 3 });
        T(svg, rx + 8, y + 10, "≥ " + c.t.toFixed(2), { anchor: "start", size: 9,
          fill: cur ? C.text : C.dim, weight: cur ? 700 : 400 });
        T(svg, rx + 110, y + 10, (c.hit * 100) + "% hits", { anchor: "end", size: 9, fill: C.dim });
        T(svg, rx + 218, y + 10, c.falseHits ? c.falseHits + " WRONG" : "0 wrong",
          { anchor: "end", size: 9, fill: c.falseHits ? C.pink : C.green, weight: c.falseHits ? 700 : 400 });
      });
      T(svg, rx, 172, "closest FALSE pair 0.733, furthest TRUE 0.799.", { anchor: "start", size: 8.5, fill: C.dim });
      T(svg, rx, 184, "the entire safety margin is 0.066 of cosine.", { anchor: "start", size: 8.5, fill: C.orange });

      T(svg, rx, 210, "cost per 1,000 requests", { anchor: "start", size: 10.5, fill: C.faint, weight: 700 });
      T(svg, rx, 232, "$" + costPer1k().toFixed(2), { anchor: "start", size: 18, fill: C.green, weight: 700 });
      T(svg, rx + 96, 234, "at " + (CACHE[cacheIdx].hit * 100) + "% cache hits", { anchor: "start", size: 9, fill: C.dim });
      T(svg, rx, 250, "uncached $" + MODELS[mi].per1k.toFixed(2) + " · 277 in + 180 out tokens",
        { anchor: "start", size: 8.5, fill: C.faint });

      rect(svg, 24, 268, 672, 78, { fill: C.panel, stroke: C.line });
      T(svg, 40, 290, "The search everyone wants to speed up is 0.2% of the budget.",
        { anchor: "start", size: 11, fill: C.text, weight: 700 });
      T(svg, 40, 310, "The two jitteriest stages, bm25 at 2.48× and dense at 1.92×, are together 0.2% of the median. The steadiest stage",
        { anchor: "start", size: 9.5, fill: C.dim });
      T(svg, 40, 326, "at 1.19× is 87.6% of it. Optimise the share, not the ratio: only the reranker can move this number.",
        { anchor: "start", size: 9.5, fill: C.dim });

      f.say(rerankK <= 5
        ? "Shrink the reranker and the whole budget moves, because it was 87.6% of it. Nothing else in the list can do that."
        : CACHE[cacheIdx].falseHits
        ? "At threshold " + CACHE[cacheIdx].t.toFixed(2) + " the hit rate jumps to 80% and three of those hits are WRONG answers, served silently from cache. The safety margin between the closest false pair and the furthest true one is 0.066 of cosine."
        : parallel ? "Parallelising helps p50 a little. It cannot help p95, because the stage that owns p95 is the reranker and it is still serial."
        : "Run the budget. Find the stage that owns p95, then shrink it.");
    }

    function controls() {
      f.controls.innerHTML = "";
      slider(f.controls, "rerank k", 1, 50, rerankK, 1, String, function (v) { rerankK = v; render(); });
      toggle(f.controls, "parallel pre-stages", parallel, function (v) { parallel = v; render(); });
      slider(f.controls, "cache thr", 0, 4, cacheIdx, 1,
        function (v) { return CACHE[v].t.toFixed(2); }, function (v) { cacheIdx = v; render(); });
      tabs(f.controls, MODELS.map(function (m) { return m.name.split(" ")[1]; }), mi, function (i) {
        mi = i; controls(); render();
      });
      f.btn("reset", function () {
        rerankK = 20; parallel = false; cacheIdx = 2; mi = 1; controls(); render();
      });
    }
    controls(); render();
    f.say("Run 1,000 requests. Find the stage that owns p95.");
  };

  /* ========================================================================
     5. aclFilter — CH 28 — Inspector
     ======================================================================== */
  VIZ.aclFilter = function (el) {
    var f = frame(el);
    var svg = S("svg", { viewBox: "0 0 720 340", role: "img" }, f.body);

    // Measured over 16 queries x top 5 = 80 slots, chapter 28.
    var PLACES = [
      { name: "nowhere", passenger: 33, contractor: 6, lost: 0, ok: false,
        note: "No rule at all. Thirty-three forbidden chunks reached a passenger's context." },
      { name: "in the prompt (\"do not use\")", passenger: 33, contractor: 6, lost: 0, ok: false,
        note: "The forbidden chunk is retrieved, packed, and merely ASKED not to be used. Identical numbers to having no rule, because the text is already in the context window." },
      { name: "post-filter after top-k", passenger: 0, contractor: 0, lost: 33, ok: true, poor: true,
        note: "Correct, and it returned fewer than five results on 11 of 16 queries for the passenger. To always return five it needs to over-fetch 17 (3.4×)." },
      { name: "pre-filter in the retriever", passenger: 0, contractor: 0, lost: 0, ok: true,
        note: "Correct and free: the candidate set never contains a chunk this user may not read, so nothing downstream can leak it." }
    ];
    var USERS = [
      { name: "passenger", labels: "public", chunks: 40 },
      { name: "contractor", labels: "public + tickets", chunks: 52 },
      { name: "staff", labels: "public + tickets + internal", chunks: 56 }
    ];
    var pi = 1, ui = 0;

    function render() {
      svg.innerHTML = "";
      var p = PLACES[pi], u = USERS[ui];
      T(svg, 24, 16, "16 queries × top 5 = 80 context slots · user: " + u.name +
        " (may read " + u.chunks + " of 56 chunks)", { anchor: "start", size: 10.5, fill: C.faint });

      PLACES.forEach(function (o, i) {
        var y = 32 + i * 44, cur = i === pi;
        rect(svg, 24, y, 430, 40, {
          fill: cur ? (o.ok ? "var(--tint-green)" : "rgba(255,100,200,.10)") : "none",
          stroke: cur ? (o.ok ? C.green : C.pink) : C.line, sw: cur ? 2 : 1 });
        T(svg, 38, y + 17, o.name, { anchor: "start", size: 10.5,
          fill: cur ? C.text : C.dim, weight: cur ? 700 : 400 });
        T(svg, 38, y + 32, o.ok ? (o.poor ? "correct, poor" : "correct") : "BROKEN",
          { anchor: "start", size: 9, fill: o.ok ? (o.poor ? C.orange : C.green) : C.pink, weight: 700 });
        var leaked = ui === 0 ? o.passenger : ui === 1 ? o.contractor : 0;
        T(svg, 420, y + 17, leaked + " forbidden chunks", { anchor: "end", size: 10,
          fill: leaked ? C.pink : C.green, weight: 700 });
        T(svg, 420, y + 32, o.lost ? o.lost + " results lost" : "no results lost",
          { anchor: "end", size: 8.5, fill: o.lost ? C.orange : C.faint });
      });

      var leaked = ui === 0 ? p.passenger : ui === 1 ? p.contractor : 0;
      var rx = 470;
      rect(svg, rx, 32, 226, 96, { fill: C.panel, stroke: leaked ? C.pink : C.green, sw: 2 });
      T(svg, rx + 12, 56, "leak test", { anchor: "start", size: 11, fill: C.faint, weight: 700 });
      T(svg, rx + 12, 84, leaked ? "FAIL" : "PASS", { anchor: "start", size: 22,
        fill: leaked ? C.pink : C.green, weight: 700 });
      T(svg, rx + 12, 110, leaked ? leaked + " chunks this user may not read" : "no forbidden chunk reached a context",
        { anchor: "start", size: 8.5, fill: leaked ? C.pink : C.green });

      T(svg, rx, 150, "over-fetch a post-filter needs", { anchor: "start", size: 9.5, fill: C.faint, weight: 700 });
      [["passenger", "17", "3.4×"], ["contractor", "7", "1.4×"], ["staff", "5", "1.0×"]].forEach(function (r, i) {
        var y = 164 + i * 18;
        T(svg, rx, y, r[0], { anchor: "start", size: 9, fill: i === ui ? C.text : C.dim,
          weight: i === ui ? 700 : 400 });
        T(svg, rx + 150, y, r[1], { anchor: "end", size: 9, fill: C.dim });
        T(svg, rx + 210, y, r[2], { anchor: "end", size: 9, fill: i === 0 ? C.orange : C.faint });
      });

      rect(svg, 24, 220, 672, 52, { fill: C.panel, stroke: C.line });
      wrap(p.note, 104).slice(0, 2).forEach(function (ln, i) {
        T(svg, 40, 240 + i * 15, ln, { anchor: "start", size: 10, fill: C.dim });
      });

      rect(svg, 24, 282, 672, 48, { fill: C.panel, stroke: C.line });
      T(svg, 40, 302, "One rule: the retriever must not be able to return a chunk the user may not read.",
        { anchor: "start", size: 11, fill: C.text, weight: 700 });
      T(svg, 40, 320, "Everything downstream is a courtesy: a prompt-level rule is a request, made about text already in the window.",
        { anchor: "start", size: 9.5, fill: C.dim });

      f.say(pi === 1
        ? "The prompt-level rule scores identically to having no rule at all: 33 forbidden chunks for the passenger either way. The model was asked not to use text it had already been given."
        : pi === 2 ? "Correct, but it threw away 33 results doing it and returned fewer than five on 11 of 16 queries. To keep five it has to over-fetch 3.4×."
        : pi === 3 ? "Zero leaks and zero results lost. The candidate set never contained a forbidden chunk, so nothing downstream had the chance to leak one."
        : "No rule anywhere. Now move the filter into the prompt and watch the numbers not change.");
    }

    function controls() {
      f.controls.innerHTML = "";
      tabs(f.controls, USERS.map(function (u) { return u.name; }), ui, function (i) { ui = i; controls(); render(); });
      tabs(f.controls, ["nowhere", "prompt", "post-filter", "pre-filter"], pi, function (i) {
        pi = i; controls(); render();
      });
      f.btn("reset", function () { pi = 1; ui = 0; controls(); render(); });
    }
    controls(); render();
    f.say("Select the contractor user. Move the filter into the prompt. Run the leak test.");
  };

  /* ========================================================================
     6. injectionSim — CH 28 — Simulator
     ======================================================================== */
  VIZ.injectionSim = function (el) {
    var f = frame(el);
    var svg = S("svg", { viewBox: "0 0 720 360", role: "img" }, f.body);

    var CHAIN = [
      { n: 1, what: "attacker writes a camouflaged document", cut: "ingest review" },
      { n: 2, what: "ingest and embed, with no review step", cut: "ingest review" },
      { n: 3, what: "retrieved into the top 5; the reranker keeps it", cut: "detector" },
      { n: 4, what: "read as context: data becomes instructions", cut: null },
      { n: 5, what: "send_email fires; the data leaves", cut: "allow-list" }
    ];
    // Measured: two detectors over 10 payloads with 56 clean passages as negatives.
    var DETECTORS = [
      { name: "7 keyword patterns", plain: 5, para: 0, fp: 0 },
      { name: "embedding, cosine 0.274", plain: 4, para: 3, fp: 0 },
      { name: "embedding, cosine 0.20", plain: 5, para: 4, fp: 12 },
      { name: "both, at zero false positives", plain: 5, para: 3, fp: 0 }
    ];
    var payload = 0;         // 0 plain, 1 paraphrased
    var dAllow = false, dDetector = false, dNoTool = false, dApproval = false, di = 3;
    var ran = false;

    function caught() {
      if (!dDetector) return false;
      var d = DETECTORS[di];
      var hit = payload === 0 ? d.plain : d.para;
      return hit >= 5;      // a 5/5 detector catches this instance
    }
    function exfiltrated() {
      if (dAllow) return false;          // the tool was never available
      if (dNoTool) return false;         // context may not trigger tools
      if (dApproval) return false;       // a human said no
      if (caught()) return false;
      return true;
    }

    function render() {
      svg.innerHTML = "";
      T(svg, 24, 16, "the lethal trifecta: private data + untrusted content + a way to communicate out",
        { anchor: "start", size: 10.5, fill: C.pink, weight: 700 });
      T(svg, 24, 32, "remove any ONE and exfiltration stops", { anchor: "start", size: 9, fill: C.faint });

      CHAIN.forEach(function (c, i) {
        var y = 44 + i * 34;
        var stopped = ran && (
          (c.n === 2 && false) ||
          (c.n === 3 && caught()) ||
          (c.n === 5 && (dAllow || dNoTool || dApproval)));
        var reached = ran && !stopped &&
          (c.n < 5 || exfiltrated());
        var blockedEarlier = ran && c.n === 5 && caught();
        rect(svg, 24, y, 430, 30, {
          fill: stopped ? "var(--tint-green)" : (reached ? "rgba(255,100,200,.10)" : "none"),
          stroke: stopped ? C.green : (reached ? C.pink : C.line), sw: stopped || reached ? 2 : 1 });
        T(svg, 38, y + 15, c.n + ". " + c.what, { anchor: "start", size: 9.5,
          fill: stopped ? C.green : (reached ? C.pink : C.faint),
          weight: stopped || reached ? 700 : 400 });
        if (stopped) T(svg, 444, y + 15, "✓ cut", { anchor: "end", size: 9.5, fill: C.green, weight: 700 });
        else if (blockedEarlier) T(svg, 444, y + 15, "—", { anchor: "end", size: 9.5, fill: C.faint });
      });

      var rx = 470;
      if (ran) {
        var bad = exfiltrated();
        rect(svg, rx, 44, 226, 84, { fill: C.panel, stroke: bad ? C.pink : C.green, sw: 2 });
        T(svg, rx + 12, 68, bad ? "EXFILTRATED" : "BLOCKED", { anchor: "start", size: 15,
          fill: bad ? C.pink : C.green, weight: 700 });
        T(svg, rx + 12, 92, bad ? "send_email fired with the" : "the chain was cut at link " +
          (caught() ? "3" : "5"), { anchor: "start", size: 9, fill: C.dim });
        T(svg, rx + 12, 106, bad ? "contractor's booking data" : (dAllow ? "by the tool allow-list"
          : dNoTool ? "by the no-tool-from-context rule"
          : dApproval ? "by the approval step" : "by the detector"),
          { anchor: "start", size: 9, fill: C.dim });
      } else {
        T(svg, rx, 60, "press run", { anchor: "start", size: 11, fill: C.faint });
      }

      // detector performance
      T(svg, rx, 150, "detectors, 10 payloads, 56 clean negatives", { anchor: "start", size: 9,
        fill: C.faint, weight: 700 });
      DETECTORS.forEach(function (d, i) {
        var y = 162 + i * 22, cur = i === di;
        rect(svg, rx, y, 226, 19, { fill: cur ? "var(--tint-primary)" : "none",
          stroke: cur ? C.blue : C.line, sw: cur ? 1.6 : 1, rx: 3 });
        T(svg, rx + 6, y + 10, d.name, { anchor: "start", size: 8,
          fill: cur ? C.text : C.dim, weight: cur ? 700 : 400 });
        T(svg, rx + 176, y + 10, d.plain + "/" + d.para, { anchor: "end", size: 8, fill: C.dim });
        T(svg, rx + 220, y + 10, d.fp ? d.fp + " FP" : "0 FP", { anchor: "end", size: 8,
          fill: d.fp ? C.pink : C.green });
      });
      T(svg, rx, 258, "plain / paraphrased caught, of 5 each", { anchor: "start", size: 7.5, fill: C.faint });

      rect(svg, 24, 224, 430, 60, { fill: C.panel, stroke: C.line });
      T(svg, 38, 244, "what each defence acts on", { anchor: "start", size: 9.5, fill: C.faint, weight: 700 });
      T(svg, 38, 260, "detector → link 3, measured 8 of 10, and the attacker simply retries",
        { anchor: "start", size: 8.5, fill: C.orange });
      T(svg, 38, 274, "allow-list → link 5, cuts the chain WITHOUT reading the payload at all",
        { anchor: "start", size: 8.5, fill: C.green });

      rect(svg, 24, 296, 672, 54, { fill: C.panel, stroke: C.line });
      T(svg, 40, 316, "The reranker was measured to have no effect: the planted document ranked 2 before and after.",
        { anchor: "start", size: 10, fill: C.text, weight: 700 });
      T(svg, 40, 336, "A control that has to read the payload can be paraphrased around. A control on what the model may DO cannot.",
        { anchor: "start", size: 9.5, fill: C.dim });

      if (!ran) { f.say("Run with all defences off. Watch the email go out. Then enable one defence at a time."); return; }
      f.say(exfiltrated()
        ? "The injected instruction reached send_email and the contractor's booking data left the building. Enable one defence at a time."
        : caught() && !dAllow && !dNoTool && !dApproval
        ? (payload === 1
          ? "The detector caught even the paraphrase this time. Switch to the cosine 0.274 detector and try the paraphrased payload again."
          : "The detector caught the plain payload. Now switch the payload to paraphrased and run it again.")
        : "Cut at link 5, without anyone having to recognise the payload. That is why the allow-list is the control that survives an attacker who rewrites.");
    }

    function controls() {
      f.controls.innerHTML = "";
      tabs(f.controls, ["plain payload", "paraphrased"], payload, function (i) { payload = i; render(); });
      f.btn("run", function () { ran = true; render(); });
      toggle(f.controls, "tool allow-list", dAllow, function (v) { dAllow = v; render(); });
      toggle(f.controls, "no tool from context", dNoTool, function (v) { dNoTool = v; render(); });
      toggle(f.controls, "approval step", dApproval, function (v) { dApproval = v; render(); });
      toggle(f.controls, "detector", dDetector, function (v) { dDetector = v; render(); });
      slider(f.controls, "detector", 0, 3, di, 1,
        function (v) { return DETECTORS[v].name.slice(0, 14); }, function (v) { di = v; render(); });
      f.btn("reset", function () {
        payload = 0; dAllow = dDetector = dNoTool = dApproval = false; di = 3; ran = false;
        controls(); render();
      });
    }
    controls(); render();
    f.say("Run with all defences off. Watch the email go out. Then enable one defence at a time.");
  };

  /* ========================================================================
     7. traceViewer — CH 29 — Inspector
     ======================================================================== */
  VIZ.traceViewer = function (el) {
    var f = frame(el);
    var svg = S("svg", { viewBox: "0 0 720 436", role: "img" }, f.body);

    var TRACES = [
      { name: "healthy", spans: [
          { n: "rag.request", ms: 79.7, d: 0 }, { n: "embeddings", ms: 8.3, d: 1 },
          { n: "retrieval.bm25", ms: 0.1, d: 1, attr: "candidates=50" },
          { n: "retrieval.dense", ms: 0.1, d: 1, attr: "candidates=50, ef=128" },
          { n: "fuse", ms: 0.0, d: 1, attr: "in=100 out=50" },
          { n: "rerank", ms: 60.0, d: 1, attr: "pairs=20" }],
        verdict: "All six checks pass. The reranker owns 87.6% of the budget, as Chapter 27 measured.",
        fail: null },
      { name: "slow reranker", spans: [
          { n: "rag.request", ms: 412.0, d: 0 }, { n: "embeddings", ms: 8.4, d: 1 },
          { n: "retrieval.bm25", ms: 0.1, d: 1, attr: "candidates=50" },
          { n: "retrieval.dense", ms: 0.2, d: 1, attr: "candidates=50" },
          { n: "fuse", ms: 0.0, d: 1, attr: "in=100 out=50" },
          { n: "rerank", ms: 392.0, d: 1, attr: "pairs=200 ← not 20", bad: true }],
        verdict: "Check 4 passes but the budget blew up: k1 was raised from 20 to 200 and nobody changed the latency gate.",
        fail: "the span attribute, not the duration, is the diagnosis" },
      { name: "empty retrieval", spans: [
          { n: "rag.request", ms: 9.1, d: 0 }, { n: "embeddings", ms: 8.3, d: 1 },
          { n: "retrieval.bm25", ms: 0.1, d: 1, attr: "candidates=0, filter=airport:LIS", bad: true },
          { n: "retrieval.dense", ms: 0.1, d: 1, attr: "candidates=0", bad: true },
          { n: "fuse", ms: 0.0, d: 1, attr: "in=0 out=0", bad: true },
          { n: "rerank", ms: 0.0, d: 1, attr: "pairs=0 — skipped" }],
        verdict: "Check 2 fails: the filter matched nothing, so retrieval returned nothing, and the answer was generated from an empty context.",
        fail: "the request was FAST because it did no work. Latency alerts would never fire." }
    ];
    var CHECKS = [
      "is the answer in the corpus at all", "did retrieval return anything",
      "is the gold chunk in the candidates", "did it survive ranking into top k",
      "did it survive into the packed context", "is the answer grounded in what was packed"
    ];
    var ti = 0, diagnosed = false, sel = null;

    function failedCheck() { return ti === 2 ? 1 : ti === 1 ? 3 : -1; }

    function render() {
      svg.innerHTML = "";
      var t = TRACES[ti];
      var maxMs = Math.max.apply(null, t.spans.map(function (s) { return s.ms; })) || 1;
      T(svg, 24, 16, "trace: " + t.name + " · request " + t.spans[0].ms.toFixed(1) + " ms",
        { anchor: "start", size: 11, fill: C.text, weight: 700 });

      t.spans.forEach(function (s, i) {
        var y = 32 + i * 30, x = 24 + s.d * 16;
        var g = S("g", {}, svg);
        rect(g, x, y, 296 - s.d * 16, 26, {
          fill: sel === i ? "var(--tint-primary)" : "none",
          stroke: s.bad ? C.pink : (sel === i ? C.blue : C.line), sw: s.bad || sel === i ? 2 : 1, rx: 4 });
        T(g, x + 10, y + 13, s.n, { anchor: "start", size: 9.5,
          fill: s.bad ? C.pink : C.text, weight: s.bad ? 700 : 400 });
        // the waterfall bar
        rect(g, 336, y + 8, 120 * (s.ms / maxMs), 11, {
          fill: s.bad ? C.pink : (s.d ? C.blue : C.faint), stroke: "none", rx: 2 });
        T(g, 508, y + 13, s.ms.toFixed(1) + " ms", { anchor: "end", size: 9, fill: C.dim });
        if (s.attr) T(g, 516, y + 13, s.attr, { anchor: "start", size: 8,
          fill: s.bad ? C.pink : C.faint });
        g.style.cursor = "pointer";
        (function (i) { g.addEventListener("click", function () { sel = i; render(); }); })(i);
      });

      T(svg, 24, 236, "the six checks, in order", { anchor: "start", size: 9.5, fill: C.faint, weight: 700 });
      CHECKS.forEach(function (c, i) {
        var y = 246 + i * 19;
        var failed = diagnosed && i === failedCheck();
        var passed = diagnosed && (failedCheck() < 0 || i < failedCheck());
        rect(svg, 24, y, 430, 16, { fill: failed ? "rgba(255,100,200,.12)" : "none",
          stroke: failed ? C.pink : "none", sw: 1.5, rx: 3 });
        T(svg, 32, y + 8, (i + 1) + ". " + c, { anchor: "start", size: 8.5,
          fill: failed ? C.pink : (passed ? C.green : C.faint), weight: failed ? 700 : 400 });
        if (diagnosed) T(svg, 448, y + 8, failed ? "FAIL" : (passed ? "pass" : "—"),
          { anchor: "end", size: 8, fill: failed ? C.pink : (passed ? C.green : C.faint), weight: failed ? 700 : 400 });
      });

      var rx = 470;
      if (diagnosed) {
        rect(svg, rx, 236, 226, 118, { fill: C.panel, stroke: t.fail ? C.pink : C.green, sw: 2 });
        wrap(t.verdict, 30).slice(0, 5).forEach(function (ln, i) {
          T(svg, rx + 10, 256 + i * 14, ln, { anchor: "start", size: 8.5,
            fill: t.fail ? C.pink : C.green });
        });
        if (t.fail) wrap(t.fail, 30).slice(0, 2).forEach(function (ln, i) {
          T(svg, rx + 10, 326 + i * 12, ln, { anchor: "start", size: 8, fill: C.orange });
        });
      }

      T(svg, 24, 220, "record chunk IDS and scores, never chunk TEXT: a log of retrieved passages is a second copy of the corpus with weaker access control.",
        { anchor: "start", size: 8.5, fill: C.faint });

      // sampling: a full-width row at the bottom, clear of the waterfall
      rect(svg, 24, 378, 672, 48, { fill: C.panel, stroke: C.line });
      T(svg, 40, 396, "sampling a p95 (true = 15.2 ms):",
        { anchor: "start", size: 9, fill: C.faint, weight: 700 });
      [["n=10", "11.6–20.0 ms", "31% false alarms"], ["n=50", "13.3–16.3 ms", "18%"],
       ["n=200", "14.0–15.9 ms", "5%"]].forEach(function (r, i) {
        var x = 330 + i * 124;
        T(svg, x, 396, r[0], { anchor: "start", size: 8.5, fill: C.text, weight: 700 });
        T(svg, x, 408, r[1], { anchor: "start", size: 8, fill: C.dim });
        T(svg, x, 418, r[2], { anchor: "start", size: 8, fill: i === 0 ? C.pink : C.faint });
      });
      T(svg, 40, 414, "at n=10 the estimate spans nearly 9 ms.", { anchor: "start", size: 8, fill: C.faint });

      f.say(!diagnosed ? "Open a trace and press diagnose."
        : ti === 2 ? "The filter matched nothing, so retrieval returned zero candidates and the answer was generated from an empty context. Note the request was FAST: 9.1 ms. No latency alert would ever fire on this."
        : ti === 1 ? "The duration is not the diagnosis; the span attribute is. pairs=200 instead of 20 says somebody raised k1 and nobody moved the latency gate."
        : "All six checks pass, and the reranker owns the budget exactly as Chapter 27 measured.");
    }

    function controls() {
      f.controls.innerHTML = "";
      tabs(f.controls, TRACES.map(function (t) { return t.name; }), ti, function (i) {
        ti = i; diagnosed = false; sel = null; controls(); render();
      });
      f.btn("diagnose", function () { diagnosed = true; render(); });
      f.btn("reset", function () { ti = 0; diagnosed = false; sel = null; controls(); render(); });
    }
    controls(); render();
    f.say("Open the third trace. Find the span with zero results.");
  };

  /* ========================================================================
     8. storePicker — CH 30 — Comparator
     ======================================================================== */
  VIZ.storePicker = function (el) {
    var f = frame(el);
    var svg = S("svg", { viewBox: "0 0 720 360", role: "img" }, f.body);

    var STORES = [
      { name: "pgvector", filter: "post, iterative", tier: "RAM/disk", deploy: "extension" },
      { name: "Elasticsearch", filter: "pre + fallback", tier: "bbq/disk", deploy: "cluster" },
      { name: "Qdrant", filter: "DURING scan", tier: "SQ/PQ/BQ", deploy: "server" },
      { name: "Weaviate", filter: "pre", tier: "BQ/PQ/SQ", deploy: "server" },
      { name: "Milvus", filter: "pre", tier: "DiskANN", deploy: "cluster" },
      { name: "FAISS (library)", filter: "none", tier: "IVF+PQ", deploy: "in-process" }
    ];
    // 10M vectors at 384 dimensions, HNSW M=16, computed in chapter 30.
    var MEM = [
      { name: "float32", vec: 1536, total: 1664, gb: 16.64, x: 1.0 },
      { name: "float16", vec: 768, total: 896, gb: 8.96, x: 1.9 },
      { name: "int8", vec: 384, total: 512, gb: 5.12, x: 3.2 },
      { name: "int4", vec: 192, total: 320, gb: 3.20, x: 5.2 },
      { name: "1 bit", vec: 48, total: 176, gb: 1.76, x: 9.5 }
    ];
    var vectors = 5, qps = 50, sel = 20, hasPG = true, ops = 0, mi = 0;

    function verdict() {
      if (vectors <= 5 && hasPG && sel >= 20)
        return { store: "pgvector", axis: "you already run Postgres, and it fits",
          why: "Under about 5 M vectors at 384 dimensions is a few GB. If Postgres or Elasticsearch is already in your stack and the workload fits, stop here: an extension is not a system to operate." };
      if (sel < 5)
        return { store: "Qdrant", axis: "filter selectivity below the cliff",
          why: "Below 5% selectivity is where post-filtering returns fewer rows than you asked for. Qdrant evaluates the predicate DURING traversal, which is the only shape that keeps both recall and the graph." };
      if (sel < 20)
        return { store: "Weaviate or Qdrant", axis: "filter selectivity",
          why: "Between 5 and 20% is the region where products actually differ. Pre-filtering and in-graph filtering both work; post-filtering starts to cost over-fetch." };
      if (vectors > 50)
        return { store: "Milvus or a FAISS library", axis: "corpus size",
          why: "Past 50 M vectors the storage tier decides everything: DiskANN or IVF+PQ, and the question becomes who operates it." };
      if (ops === 0)
        return { store: "pgvector or a hosted store", axis: "who operates it",
          why: "With nobody to run a cluster, this decides more than any of the technical dimensions above, and nobody writes it down." };
      return { store: "Elasticsearch or Qdrant", axis: "hybrid and operations",
        why: "Native BM25 and fusion in one query, and a team that can run a cluster." };
    }

    function render() {
      svg.innerHTML = "";
      var v = verdict();
      T(svg, 24, 16, "the elimination procedure: each question removes candidates. None of them score.",
        { anchor: "start", size: 10.5, fill: C.faint });

      var STEPS = [
        { q: "1. does it fit?", a: vectors <= 5 ? "yes — a few GB at 384-d" : vectors + " M vectors",
          hit: vectors <= 5 },
        { q: "2. Postgres or ES already?", a: hasPG ? "yes → STOP HERE if it fits" : "no",
          hit: hasPG && vectors <= 5 },
        { q: "3. filter selectivity?", a: sel + "%" + (sel < 20 ? " — at or below the cliff" : ""),
          hit: sel < 20 },
        { q: "4. update rate?", a: "rebuilt nightly → a library; churn → compaction", hit: false },
        { q: "5. who operates it?", a: ops === 0 ? "nobody" : ops === 1 ? "one engineer" : "a platform team",
          hit: ops === 0 }
      ];
      STEPS.forEach(function (s, i) {
        var y = 32 + i * 30;
        rect(svg, 24, y, 430, 26, { fill: s.hit ? "var(--tint-primary)" : "none",
          stroke: s.hit ? C.blue : C.line, sw: s.hit ? 2 : 1, rx: 4 });
        T(svg, 38, y + 13, s.q, { anchor: "start", size: 9.5,
          fill: s.hit ? C.text : C.dim, weight: s.hit ? 700 : 400 });
        T(svg, 444, y + 13, s.a, { anchor: "end", size: 8.5, fill: s.hit ? C.blue : C.faint });
      });

      rect(svg, 24, 190, 430, 74, { fill: C.panel, stroke: C.green, sw: 2 });
      T(svg, 38, 212, v.store, { anchor: "start", size: 15, fill: C.green, weight: 700 });
      T(svg, 38, 230, "decided by: " + v.axis, { anchor: "start", size: 9.5, fill: C.blue, weight: 700 });
      wrap(v.why, 62).slice(0, 2).forEach(function (ln, i) {
        T(svg, 38, 246 + i * 12, ln, { anchor: "start", size: 8.5, fill: C.dim });
      });

      // the memory arithmetic
      var rx = 470;
      T(svg, rx, 32, "10 M vectors, 384-d, HNSW M=16", { anchor: "start", size: 9.5,
        fill: C.faint, weight: 700 });
      MEM.forEach(function (m, i) {
        var y = 44 + i * 22, cur = i === mi;
        rect(svg, rx, y, 226, 19, { fill: cur ? "var(--tint-primary)" : "none",
          stroke: cur ? C.blue : C.line, sw: cur ? 1.6 : 1, rx: 3 });
        T(svg, rx + 8, y + 10, m.name, { anchor: "start", size: 8.5,
          fill: cur ? C.text : C.dim, weight: cur ? 700 : 400 });
        T(svg, rx + 150, y + 10, m.gb.toFixed(2) + " GB", { anchor: "end", size: 8.5, fill: C.dim });
        T(svg, rx + 218, y + 10, m.x.toFixed(1) + "×", { anchor: "end", size: 8.5,
          fill: m.x > 5 ? C.green : C.faint, weight: m.x > 5 ? 700 : 400 });
      });
      T(svg, rx, 168, "the vendor number for the last row is 32×.", { anchor: "start", size: 8, fill: C.orange });
      T(svg, rx, 179, "It is true, and it is about the vector BYTES.", { anchor: "start", size: 8, fill: C.orange });
      T(svg, rx, 190, "The graph does not compress, so end to end", { anchor: "start", size: 8, fill: C.orange });
      T(svg, rx, 201, "you get 9.5×.", { anchor: "start", size: 8, fill: C.orange, weight: 700 });

      T(svg, rx, 226, "where the filter is evaluated", { anchor: "start", size: 9, fill: C.faint, weight: 700 });
      [["BEFORE the scan", "Weaviate, Milvus, Vespa, ES"],
       ["DURING traversal", "Qdrant filterable HNSW"],
       ["AFTER the scan", "pgvector approximate index"]].forEach(function (r, i) {
        var y = 240 + i * 22;
        T(svg, rx, y, r[0], { anchor: "start", size: 8.5, fill: C.text, weight: 700 });
        T(svg, rx, y + 10, r[1], { anchor: "start", size: 8, fill: C.faint });
      });

      rect(svg, 24, 276, 430, 74, { fill: C.panel, stroke: C.line });
      T(svg, 38, 296, "Every box here descends from one 2016 paper.", { anchor: "start",
        size: 10, fill: C.text, weight: 700 });
      T(svg, 38, 314, "Lucene, FAISS and hnswlib implement HNSW; Elasticsearch, OpenSearch, Milvus and Chroma",
        { anchor: "start", size: 8.5, fill: C.dim });
      T(svg, 38, 328, "build on those. pgvector and LanceDB write their own. You are choosing an operational",
        { anchor: "start", size: 8.5, fill: C.dim });
      T(svg, 38, 342, "posture far more often than you are choosing an algorithm.", { anchor: "start", size: 8.5, fill: C.dim });

      f.say("Decided by " + v.axis + ". " +
        (v.axis.indexOf("operates") >= 0
          ? "This decides more than the four technical questions above it, and nobody writes it down."
          : "Move a slider and watch which question takes over."));
    }

    function controls() {
      f.controls.innerHTML = "";
      slider(f.controls, "M vectors", 1, 100, vectors, 1, function (v) { return v + "M"; },
        function (v) { vectors = v; render(); });
      slider(f.controls, "selectivity", 1, 100, sel, 1, function (v) { return v + "%"; },
        function (v) { sel = v; render(); });
      toggle(f.controls, "already run Postgres", hasPG, function (v) { hasPG = v; render(); });
      tabs(f.controls, ["no ops", "1 engineer", "platform team"], ops, function (i) { ops = i; controls(); render(); });
      slider(f.controls, "precision row", 0, 4, mi, 1, function (v) { return MEM[v].name; },
        function (v) { mi = v; render(); });
      f.btn("reset", function () {
        vectors = 5; qps = 50; sel = 20; hasPG = true; ops = 0; mi = 0; controls(); render();
      });
    }
    controls(); render();
    f.say("Describe your workload. The verdict says which question decided it.");
  };

  /* ========================================================================
     9. frameworkMap — CH 31 — Inspector
     ======================================================================== */
  VIZ.frameworkMap = function (el) {
    var f = frame(el);
    var svg = S("svg", { viewBox: "0 0 720 340", role: "img" }, f.body);

    var STAGES = [
      { name: "load", ch: "4", lc: "DocumentLoader", li: "Reader", hs: "Converter" },
      { name: "chunk", ch: "5, 6", lc: "TextSplitter", li: "NodeParser", hs: "DocumentSplitter" },
      { name: "embed and store", ch: "7, 30", lc: "VectorStore", li: "VectorStoreIndex", hs: "DocumentStore" },
      { name: "retrieve", ch: "9–15", lc: "Retriever", li: "Retriever", hs: "Retriever" },
      { name: "rerank and pack", ch: "16, 17", lc: "DocumentCompressor", li: "NodePostprocessor", hs: "Ranker" },
      { name: "generate", ch: "18", lc: "Chain / LCEL", li: "ResponseSynthesizer", hs: "PromptBuilder" }
    ];
    // Measured over the SAME 50 pages (22,702 tokens), chapter 31.
    var DEFAULTS = [
      { fw: "LangChain", spec: "4000, 200", unit: "characters", median: 901, overlap: "5%", chunks: 37 },
      { fw: "LlamaIndex", spec: "1024, 200", unit: "tokens", median: 1024, overlap: "20%", chunks: 23 },
      { fw: "Haystack", spec: "200, 0", unit: "words", median: 295, overlap: "0%", chunks: 77 }
    ];
    var fi = 0, hover = 1;
    var KEYS = ["lc", "li", "hs"];

    function render() {
      svg.innerHTML = "";
      var key = KEYS[fi];
      T(svg, 24, 16, "the same six stages, in four vocabularies · " + DEFAULTS[fi].fw,
        { anchor: "start", size: 11, fill: C.text, weight: 700 });

      STAGES.forEach(function (s, i) {
        var y = 32 + i * 30, on = i === hover;
        var g = S("g", {}, svg);
        rect(g, 24, y, 430, 26, { fill: on ? "var(--tint-primary)" : "none",
          stroke: on ? C.blue : C.line, sw: on ? 2 : 1, rx: 4 });
        T(g, 38, y + 13, s.name, { anchor: "start", size: 10,
          fill: on ? C.text : C.dim, weight: on ? 700 : 400 });
        T(g, 170, y + 13, s[key], { anchor: "start", size: 9.5,
          fill: on ? C.blue : C.faint, weight: on ? 700 : 400 });
        T(g, 444, y + 13, "ch " + s.ch, { anchor: "end", size: 8.5, fill: C.faint });
        g.style.cursor = "pointer";
        (function (i) {
          g.addEventListener("mouseenter", function () { hover = i; render(); });
          g.addEventListener("click", function () { hover = i; render(); });
        })(i);
        tipOn(g, s.name, "LangChain: " + s.lc + "<br>LlamaIndex: " + s.li +
          "<br>Haystack: " + s.hs + "<br>Explained in chapter " + s.ch + ".");
      });

      // the chunk defaults, which is the discovery
      var rx = 470;
      T(svg, rx, 32, "default chunker, same 50 pages", { anchor: "start", size: 9.5,
        fill: C.faint, weight: 700 });
      DEFAULTS.forEach(function (d, i) {
        var y = 44 + i * 40, cur = i === fi;
        rect(svg, rx, y, 226, 36, { fill: cur ? "var(--tint-primary)" : "none",
          stroke: cur ? C.blue : C.line, sw: cur ? 1.8 : 1, rx: 4 });
        T(svg, rx + 8, y + 13, d.fw + "  " + d.spec, { anchor: "start", size: 9,
          fill: cur ? C.text : C.dim, weight: cur ? 700 : 400 });
        T(svg, rx + 8, y + 27, "in " + d.unit + " → " + d.median + " tok median, " + d.chunks + " chunks",
          { anchor: "start", size: 8, fill: C.faint });
      });

      // against chapter 5's knee
      var KY = 176;
      T(svg, rx, KY, "against Chapter 5's measured knee (~400 tokens)", { anchor: "start",
        size: 8.5, fill: C.faint, weight: 700 });
      var KX = rx, KW = 226;
      function kx(t) { return KX + Math.min(1, t / 1400) * KW; }
      line(svg, KX, KY + 30, KX + KW, KY + 30, { stroke: C.line, sw: 1.5 });
      line(svg, kx(400), KY + 16, kx(400), KY + 44, { stroke: C.green, sw: 2, dash: "3 3" });
      T(svg, kx(400), KY + 54, "knee 400", { size: 8, fill: C.green });
      DEFAULTS.forEach(function (d, i) {
        S("circle", { cx: kx(d.median), cy: KY + 30, r: i === fi ? 5 : 3.5,
          fill: i === fi ? C.blue : C.faint }, svg);
        if (i === fi) T(svg, kx(d.median), KY + 18, d.median + "", { size: 8, fill: C.blue, weight: 700 });
      });

      rect(svg, 24, 216, 430, 54, { fill: C.panel, stroke: C.line });
      T(svg, 38, 236, "Same document, same code path: 23 to 77 chunks.", { anchor: "start",
        size: 10.5, fill: C.text, weight: 700 });
      T(svg, 38, 254, "A 3.3× spread from imports alone, before anybody tunes anything.",
        { anchor: "start", size: 9.5, fill: C.dim });

      rect(svg, 24, 280, 672, 54, { fill: C.panel, stroke: C.orange, sw: 2 });
      T(svg, 40, 300, "The defaults are not the same, and they are not in the same UNIT.",
        { anchor: "start", size: 10.5, fill: C.orange, weight: 700 });
      T(svg, 40, 320, "LangChain counts characters, LlamaIndex tokens, Haystack words. Reading “1024” tells you nothing until you know which.",
        { anchor: "start", size: 9.5, fill: C.dim });

      f.say(hover === 1
        ? DEFAULTS[fi].fw + " splits on " + DEFAULTS[fi].unit + " by default: " + DEFAULTS[fi].spec +
          " produces a " + DEFAULTS[fi].median + "-token median chunk and " + DEFAULTS[fi].chunks +
          " chunks from these 50 pages. Chapter 5 measured the recall knee at about 400."
        : "Every framework names the same six stages differently. Hover chunk and read the default.");
    }

    function controls() {
      f.controls.innerHTML = "";
      tabs(f.controls, DEFAULTS.map(function (d) { return d.fw; }), fi, function (i) {
        fi = i; hover = 1; controls(); render();
      });
      f.btn("reset", function () { fi = 0; hover = 1; controls(); render(); });
    }
    controls(); render();
    f.say("Pick a framework. Hover chunk. Read the default, and the unit it is counted in.");
  };
})();
