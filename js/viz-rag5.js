/* ==========================================================================
   viz-rag5.js — RAG In Depth machines, batch 5: chapters 19–24.

     condenseTurns    ch19 Stepper    four turns, four memory policies
     adaptiveLoop     ch20 Simulator  who decides whether to retrieve again
     agentLoop        ch21 Simulator  tools, a router, a critic, and a budget
     text2query       ch22 Stepper    the prompt, the query, and four wrong answers
     kgExtract        ch23 Builder    extract, then resolve, and watch it overmerge
     graphragPipeline ch24 Stepper    extract, cluster, report, and what it costs

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
     1. condenseTurns — CH 19 — Stepper
     ======================================================================== */
  VIZ.condenseTurns = function (el) {
    var f = frame(el);
    var svg = S("svg", { viewBox: "0 0 720 350", role: "img" }, f.body);

    var TURNS = [
      { user: "I'm flying Lisbon to Bordeaux next month on a class L ticket.",
        need: "no retrieval: this turn only states constraints" },
      { user: "How many bags can I take?", need: "cabin and checked baggage allowance" },
      { user: "What if I can't fly?", need: "fare rules for class L: non-refundable, travel credit" },
      { user: "And the taxes?", need: "taxes and charges: returned on request" }
    ];
    // Measured in chapter 19: the rank of the correct passage for the
    // reference turn, and the MRR across all four turns, per policy.
    var POLICIES = [
      { name: "none", rank: 13, mrr: 0.54, tok: 0,
        rewrite: function (t) { return TURNS[t].user; },
        note: "The retriever sees the turn and nothing else. “What if I can't fly?” has no fare class in it, so the index has nothing to narrow on." },
      { name: "glue history", rank: 19, mrr: 0.54, tok: 316,
        rewrite: function (t) { return TURNS.slice(0, t + 1).map(function (x) { return x.user; }).join("  "); },
        note: "Pasting the history into the query is worse than not having it: rank 19 against 13. The earlier turns add vocabulary the retriever now has to explain away." },
      { name: "condense", rank: 9, mrr: 0.78, tok: 106,
        rewrite: function (t) { return t === 2 ? "What happens if a passenger cannot take their flight?"
          : t === 3 ? "What happens to taxes and charges when a flight is not taken?"
          : t === 1 ? "How many bags are included?" : TURNS[0].user; },
        note: "A model rewrites the turn into a standalone question. Better, and it has dropped the fare class, so the retriever still cannot tell class L from class Y." },
      { name: "entity memory", rank: 1, mrr: 0.88, tok: 27,
        rewrite: function (t) { return t === 2 ? "What happens to a class L ticket if the passenger cancels?"
          : t === 3 ? "Are taxes refunded on a cancelled class L ticket?"
          : t === 1 ? "Cabin and checked baggage allowance, LIS to BOD" : TURNS[0].user; },
        note: "Keep the facts, not the text: route=LIS-BOD, fare_class=L, travel=next month. The constraints survive into every later turn, and the rewrite carries them." }
    ];
    var pi = 0, turn = 2;

    function render() {
      svg.innerHTML = "";
      var p = POLICIES[pi];
      T(svg, 24, 16, "memory policy: " + p.name, { anchor: "start", size: 12, fill: C.text, weight: 700 });

      TURNS.forEach(function (t, i) {
        var y = 32 + i * 30, cur = i === turn, past = i < turn;
        rect(svg, 24, y, 430, 26, { fill: cur ? "var(--tint-primary)" : "none",
          stroke: cur ? C.blue : C.line, sw: cur ? 2 : 1, rx: 4 });
        T(svg, 36, y + 13, "turn " + (i + 1), { anchor: "start", size: 9, fill: C.faint });
        T(svg, 86, y + 13, t.user.slice(0, 56), { anchor: "start", size: 9.5,
          fill: cur ? C.text : (past ? C.dim : C.faint), weight: cur ? 700 : 400 });
      });

      T(svg, 24, 168, "what the retriever actually receives", { anchor: "start", size: 10,
        fill: C.faint, weight: 700 });
      rect(svg, 24, 176, 672, 42, { fill: C.panel, stroke: pi === 3 ? C.green : C.line,
        sw: pi === 3 ? 2 : 1 });
      wrap(p.rewrite(turn), 100).slice(0, 2).forEach(function (ln, i) {
        T(svg, 38, 194 + i * 14, ln, { anchor: "start", size: 10,
          fill: pi === 3 ? C.green : C.text });
      });

      // ranks and MRR across policies
      T(svg, 24, 240, "rank of the correct passage for turn 3, and MRR over all four turns",
        { anchor: "start", size: 10, fill: C.faint, weight: 700 });
      POLICIES.forEach(function (o, i) {
        var y = 250 + i * 24, cur = i === pi;
        rect(svg, 24, y, 672, 21, { fill: cur ? "var(--tint-primary)" : "none",
          stroke: cur ? C.blue : C.line, sw: cur ? 1.8 : 1, rx: 4 });
        T(svg, 36, y + 11, o.name, { anchor: "start", size: 10,
          fill: cur ? C.text : C.dim, weight: cur ? 700 : 400 });
        T(svg, 150, y + 11, "rank " + o.rank, { anchor: "start", size: 10,
          fill: o.rank === 1 ? C.green : o.rank > 12 ? C.pink : C.orange, weight: 700 });
        rect(svg, 230, y + 5, 300 * o.mrr, 11, { fill: o.rank === 1 ? C.green : C.blue,
          stroke: "none", rx: 2, op: cur ? 1 : 0.45 });
        T(svg, 545, y + 11, "MRR " + o.mrr.toFixed(2), { anchor: "start", size: 9.5, fill: C.dim });
        T(svg, 690, y + 11, o.tok + " tok", { anchor: "end", size: 9.5, fill: C.faint });
      });

      f.say(pi === 0 ? "With no memory, turn 3 retrieves on “What if I can't fly?” alone and puts the fare-rules passage 13th. Try gluing the history on."
        : pi === 1 ? "Gluing the history on makes it worse, not better: rank 19. More words is not more signal when the extra words are about bags."
        : pi === 2 ? "Condensing reaches rank 9 and drops the fare class on the way. Now try entity memory."
        : "Entity memory keeps route, fare class and dates as facts, so the rewrite can say “a class L ticket” and the retriever lands on rank 1 — at 27 tokens against the full buffer's 316.");
    }

    function controls() {
      f.controls.innerHTML = "";
      tabs(f.controls, POLICIES.map(function (p) { return p.name; }), pi, function (i) {
        pi = i; controls(); render();
      });
      slider(f.controls, "turn", 1, 4, turn + 1, 1, String, function (v) { turn = v - 1; render(); });
      f.btn("reset", function () { pi = 0; turn = 2; controls(); render(); });
    }
    controls(); render();
    f.say("Step to turn 3 with memory none. Read the rewritten question.");
  };

  /* ========================================================================
     2. adaptiveLoop — CH 20 — Simulator
     ======================================================================== */
  VIZ.adaptiveLoop = function (el) {
    var f = frame(el);
    var svg = S("svg", { viewBox: "0 0 720 360", role: "img" }, f.body);

    // Measured hop-2 shapes from chapter 20: what the second query looks like
    // decides everything, and carrying the question forward is the worst of them.
    var HOP2 = [
      { shape: "the original question again", rank: 8, first: "the post-mortem" },
      { shape: "question + bridge phrase (IRCoT)", rank: 5, first: "the post-mortem" },
      { shape: "question + draft answer (ITER-RETGEN)", rank: 3, first: "the post-mortem" },
      { shape: "the bridge phrase alone", rank: 1, first: "THE POLICY" }
    ];
    var MODES = [
      { name: "single", retr: 1, gen: 1, ok: false,
        trace: ["retrieve once for Q4", "rank 1: the post-mortem, which NAMES the change",
                "rank 8: the policy, which CONTAINS it", "pack the top 5 — rank 8 is cut",
                "answer from what was packed"],
        verdict: "wrong: the policy was at rank 8 and never reached the prompt" },
      { name: "iterative", retr: 2, gen: 2, ok: true,
        trace: ["retrieve for Q4", "read: the post-mortem names a policy it does not contain",
                "hop 2 with the bridge phrase alone", "rank 1: the policy", "answer from both"],
        verdict: "correct, in two retrievals and two generations" },
      { name: "FLARE", retr: null, gen: null, ok: null,
        trace: ["draft a sentence", "check the generator's confidence",
                "below the threshold: retrieve and redraft", "above it: keep going",
                "repeat per sentence"],
        verdict: "the threshold decides both the cost and the answer" },
      { name: "Self-RAG", retr: null, gen: null, ok: true,
        trace: ["Retrieve token: should this segment be grounded at all?",
                "ISREL: is the passage relevant?", "ISSUP: is what I wrote supported by it?",
                "ISUSE: is it useful for the question?", "most calls, most control"],
        verdict: "ISSUP is Chapter 18's faithfulness check, moved inside the model" },
      { name: "CRAG", retr: 2, gen: 1, ok: true,
        trace: ["retrieve once", "score the top document with a cheap evaluator (~3 ms)",
                "above the line: use it", "below: retrieve again or fall back",
                "one generation, plus an evaluator"],
        verdict: "cheapest correct option here: gate with the cheap thing" }
    ];
    // The CRAG evaluator's measured scores.
    var SCORES = [
      { q: "Can I bring my cello in the cabin?", s: 7.16, v: "answered" },
      { q: "Which policy changed after INC-2042?", s: 6.53, v: "half-answered" },
      { q: "How much does a checked bag cost?", s: 6.43, v: "answered" },
      { q: "…how do I get my money back?", s: 6.15, v: "WRONG passage" },
      { q: "…emotional support peacock?", s: 1.12, v: "not in corpus" },
      { q: "What is Larkspur's share price today?", s: -3.34, v: "not in corpus" }
    ];
    var mi = 1, thresh = 4.0, step = 0;

    function render() {
      svg.innerHTML = "";
      var m = MODES[mi];
      T(svg, 24, 16, "Q4: “Which policy changed after incident INC-2042?”",
        { anchor: "start", size: 11.5, fill: C.text, weight: 600 });

      m.trace.forEach(function (t, i) {
        var y = 32 + i * 26, on = step > i;
        rect(svg, 24, y, 430, 22, { fill: on ? "var(--tint-primary)" : "none",
          stroke: on ? C.blue : C.line, sw: on ? 1.8 : 1, rx: 4 });
        T(svg, 36, y + 11, (i + 1) + ".", { anchor: "start", size: 9, fill: C.faint });
        T(svg, 58, y + 11, t, { anchor: "start", size: 9.5, fill: on ? C.text : C.faint });
      });

      var yv = 32 + m.trace.length * 26 + 6;
      if (step >= m.trace.length) {
        rect(svg, 24, yv, 430, 40, { fill: C.panel, stroke: m.ok === false ? C.pink : C.green, sw: 2 });
        wrap(m.verdict, 62).slice(0, 2).forEach(function (ln, i) {
          T(svg, 38, yv + 17 + i * 13, ln, { anchor: "start", size: 10,
            fill: m.ok === false ? C.pink : C.green, weight: 700 });
        });
      }

      // the hop-2 table, which is the chapter's real finding
      var rx = 470;
      T(svg, rx, 30, "hop 2: the query shape decides the rank", { anchor: "start", size: 9.5,
        fill: C.faint, weight: 700 });
      HOP2.forEach(function (h, i) {
        var y = 40 + i * 30, best = h.rank === 1;
        rect(svg, rx, y, 226, 26, { fill: best ? "var(--tint-green)" : "none",
          stroke: best ? C.green : C.line, sw: best ? 1.8 : 1, rx: 4 });
        wrap(h.shape, 30).slice(0, 1).forEach(function (ln) {
          T(svg, rx + 8, y + 10, ln, { anchor: "start", size: 8.5,
            fill: best ? C.green : C.dim, weight: best ? 700 : 400 });
        });
        T(svg, rx + 8, y + 21, "policy at rank " + h.rank, { anchor: "start", size: 8.5,
          fill: best ? C.green : C.faint });
      });
      T(svg, rx, 172, "carrying the question forward keeps", { anchor: "start", size: 8.5, fill: C.dim });
      T(svg, rx, 184, "re-retrieving what hop 1 already had.", { anchor: "start", size: 8.5, fill: C.dim });

      // the CRAG evaluator scale
      var ty = 208;
      T(svg, rx, ty, "CRAG evaluator, measured", { anchor: "start", size: 9.5, fill: C.faint, weight: 700 });
      var GX = rx, GW = 226;
      function sx(v) { return GX + (v + 5) / 14 * GW; }
      line(svg, GX, ty + 30, GX + GW, ty + 30, { stroke: C.line, sw: 1.5 });
      line(svg, sx(thresh), ty + 12, sx(thresh), ty + 48, { stroke: C.orange, sw: 2, dash: "3 3" });
      T(svg, sx(thresh), ty + 58, "threshold " + thresh.toFixed(1), { size: 8.5, fill: C.orange });
      SCORES.forEach(function (o) {
        var above = o.s >= thresh, wrong = o.v === "WRONG passage";
        S("circle", { cx: sx(o.s), cy: ty + 30, r: wrong ? 5 : 3.5,
          fill: wrong ? C.pink : above ? C.green : C.faint }, svg);
      });
      T(svg, GX, ty + 74, "answerable 6.15 to 7.16 · absent −3.34 to 1.12",
        { anchor: "start", size: 8.5, fill: C.dim });
      T(svg, GX, ty + 86, "the pink dot scores 6.15 on a passage", { anchor: "start", size: 8.5, fill: C.pink });
      T(svg, GX, ty + 98, "that does not answer the question.", { anchor: "start", size: 8.5, fill: C.pink });

      // the cost table
      rect(svg, 24, 296, 430, 54, { fill: C.panel, stroke: C.line });
      T(svg, 38, 314, "retrievals " + (m.retr === null ? "0 to n" : m.retr) +
        "   ·   generations " + (m.gen === null ? "n" : m.gen),
        { anchor: "start", size: 10.5, fill: C.text, weight: 700 });
      T(svg, 38, 334, "the evaluator costs about 3 ms; a generation costs hundreds. Gate with the cheap thing.",
        { anchor: "start", size: 9, fill: C.dim });

      f.say(step < m.trace.length ? "Step the " + m.name + " loop."
        : mi === 0 ? "Single-shot got Q4 wrong, and not because retrieval failed: the policy was found at rank 8 and the packing cut at 5 threw it away."
        : mi === 1 ? "Two hops, and the second one used the bridge phrase ALONE. Carrying the question forward would have put the policy at rank 8 again."
        : mi === 4 ? "CRAG gates one generation behind a 3 ms evaluator. Note the pink dot: the query-gap question scores 6.15, comfortably above any threshold, on a passage that does not answer it."
        : "The decision has moved inside the model, which buys control and costs calls.");
    }

    function controls() {
      f.controls.innerHTML = "";
      tabs(f.controls, MODES.map(function (m) { return m.name; }), mi, function (i) {
        mi = i; step = 0; controls(); render();
      });
      f.btn("step ▸", function () { step = Math.min(MODES[mi].trace.length, step + 1); render(); });
      f.btn("run", function () { step = MODES[mi].trace.length; render(); });
      slider(f.controls, "threshold", -4, 8, thresh, 0.5, function (v) { return v.toFixed(1); },
        function (v) { thresh = v; render(); });
      f.btn("reset", function () { mi = 1; thresh = 4.0; step = 0; controls(); render(); });
    }
    controls(); render();
    f.say("Run Q4 in single mode. Then iterative. Count the hops.");
  };

  /* ========================================================================
     3. agentLoop — CH 21 — Simulator
     ======================================================================== */
  VIZ.agentLoop = function (el) {
    var f = frame(el);
    var svg = S("svg", { viewBox: "0 0 720 380", role: "img" }, f.body);

    var QS = [
      { id: "Q1", q: "Can I bring my cello in the cabin?", plan: ["vector"], answer: "musical instruments: an extra seat" },
      { id: "Q2", q: "I couldn't take my flight, how do I get my money back?", plan: ["rewrite", "vector"], answer: "fare rules and cancellation" },
      { id: "Q3", q: "How many refund tickets were opened in March?", plan: ["sql"], answer: "12" },
      { id: "Q4", q: "Which policy changed after incident INC-2042?", plan: ["vector", "vector"], answer: "the refund and cancellation policy" },
      { id: "Q5", q: "Can I bring my emotional support peacock in the cabin?", plan: ["vector"], answer: "refuse" }
    ];
    // Measured token growth against the step budget, chapter 21.
    var BUDGETS = { 3: 3603, 6: 9852, 10: 22300, 15: 44000, 30: 155100 };
    var qi = 2, budget = 6, injectSQL = false, injectJunk = false, injectCritic = false;
    var trace = null;

    function run() {
      var q = QS[qi], steps = [], used = 0, done = false, answer = null;
      var plan = q.plan.slice();
      while (used < budget && used < 30) {
        used++;
        var want = plan.shift() || "vector";
        if (want === "sql" && injectSQL) {
          steps.push({ n: used, tool: "count_tickets", res: "ERROR: relation \"refunds\" does not exist", bad: true });
          plan.unshift("vector");          // the fallback the router takes
          continue;
        }
        if (want === "rewrite") {
          steps.push({ n: used, tool: "rewrite", res: "“refund and cancellation policy”", bad: false });
          continue;
        }
        var junk = injectJunk && want === "vector";
        steps.push({ n: used, tool: want === "sql" ? "count_tickets" : "search_policies",
          res: junk ? "3 passages about the fleet and route network"
             : want === "sql" ? "12" : "rank 1: " + q.answer, bad: junk });
        if (junk) { plan.push("vector"); continue; }
        if (injectCritic) { steps.push({ n: used, tool: "critic", res: "not satisfied — try again", bad: true }); plan.push("vector"); continue; }
        if (!plan.length) { done = true; answer = q.answer; break; }
      }
      trace = { steps: steps.slice(0, 12), used: used, done: done, answer: answer,
                capped: used >= Math.min(budget, 30) && !done };
    }

    function tokensFor(b) {
      var ks = Object.keys(BUDGETS).map(Number).sort(function (a, c) { return a - c; });
      for (var i = 0; i < ks.length; i++) if (b <= ks[i]) return BUDGETS[ks[i]];
      return BUDGETS[30];
    }

    function render() {
      svg.innerHTML = "";
      var q = QS[qi];
      T(svg, 24, 16, q.id + ": “" + q.q + "”", { anchor: "start", size: 11.5, fill: C.text, weight: 600 });
      T(svg, 24, 32, "budget " + budget + " steps", { anchor: "start", size: 9.5, fill: C.faint });

      if (trace) {
        trace.steps.forEach(function (s, i) {
          var y = 44 + i * 24;
          rect(svg, 24, y, 460, 21, { fill: s.bad ? "rgba(255,100,200,.10)" : "var(--tint-primary)",
            stroke: s.bad ? C.pink : C.blue, sw: 1.6, rx: 4 });
          T(svg, 36, y + 11, s.n + ".", { anchor: "start", size: 9, fill: C.faint });
          T(svg, 56, y + 11, s.tool, { anchor: "start", size: 9.5,
            fill: s.bad ? C.pink : C.text, weight: 700 });
          T(svg, 180, y + 11, s.res.slice(0, 44), { anchor: "start", size: 9, fill: C.dim });
        });
        var ye = 44 + trace.steps.length * 24 + 6;
        rect(svg, 24, ye, 460, 44, { fill: C.panel,
          stroke: trace.done ? C.green : C.pink, sw: 2 });
        T(svg, 38, ye + 18, trace.done ? "✓ answered in " + trace.used + " steps"
          : "✘ budget exhausted after " + trace.used + " steps, no answer",
          { anchor: "start", size: 11, fill: trace.done ? C.green : C.pink, weight: 700 });
        T(svg, 38, ye + 34, trace.done ? "answer: " + trace.answer
          : "the loop returns what it has, with the gap stated. Without a budget it would not return at all.",
          { anchor: "start", size: 9, fill: C.dim });
      }

      // the cost curve
      var rx = 500;
      T(svg, rx, 44, "cumulative input tokens", { anchor: "start", size: 9.5, fill: C.faint, weight: 700 });
      var ks = [3, 6, 10, 15, 30];
      ks.forEach(function (b, i) {
        var y = 58 + i * 26, cur = budget <= b && (i === 0 || budget > ks[i - 1]);
        rect(svg, rx, y, 196, 22, { fill: cur ? "var(--tint-primary)" : "none",
          stroke: cur ? C.blue : C.line, sw: cur ? 1.8 : 1, rx: 4 });
        T(svg, rx + 8, y + 11, b + " steps", { anchor: "start", size: 9.5,
          fill: cur ? C.text : C.dim, weight: cur ? 700 : 400 });
        T(svg, rx + 188, y + 11, BUDGETS[b].toLocaleString(), { anchor: "end", size: 9.5,
          fill: b >= 15 ? C.pink : C.dim });
      });
      T(svg, rx, 200, "going from 6 steps to 15 does not", { anchor: "start", size: 8.5, fill: C.dim });
      T(svg, rx, 212, "multiply the bill by 2.5. It multiplies", { anchor: "start", size: 8.5, fill: C.dim });
      T(svg, rx, 224, "it by 4.5: every step re-sends the", { anchor: "start", size: 8.5, fill: C.dim });
      T(svg, rx, 236, "whole transcript.", { anchor: "start", size: 8.5, fill: C.dim });

      // router accuracy, measured
      T(svg, rx, 264, "router: description style", { anchor: "start", size: 9.5, fill: C.faint, weight: 700 });
      [["terse", "8/12", "policy 2, tickets 4, count 6", C.pink],
       ["detailed", "8/12", "policy 6, tickets 3, count 3", C.green],
       ["best sentence", "9/12", "policy 5, tickets 3, count 4", C.orange]
      ].forEach(function (r, i) {
        var y = 278 + i * 26;
        T(svg, rx, y, r[0], { anchor: "start", size: 9, fill: C.text });
        T(svg, rx + 188, y, r[1], { anchor: "end", size: 9, fill: r[3], weight: 700 });
        T(svg, rx, y + 11, r[2], { anchor: "start", size: 7.5, fill: C.faint });
      });
      T(svg, rx, 356, "gold: policy 6, tickets 3, count 3. Accuracy", { anchor: "start", size: 8, fill: C.dim });
      T(svg, rx, 366, "barely moves; the DISTRIBUTION collapses.", { anchor: "start", size: 8, fill: C.dim });

      if (!trace) { f.say("Pick a question and press run."); return; }
      f.say(injectCritic ? "The critic is never satisfied, so nothing can end the loop from the inside. The budget is the only thing that stops it, and it returns a partial answer with the gap stated."
        : injectSQL ? "The SQL tool errored and the router fell back to the vector index, which cannot count. A tool failure becomes a wrong answer unless the critic notices the shape of the result."
        : injectJunk ? "The vector tool returns junk and the loop keeps retrying it. Every retry re-sends the whole transcript, which is why the token curve is not linear."
        : trace.done ? "Answered in " + trace.used + " steps. Now inject a SQL tool error and run Q3 again."
        : "The budget stopped it. That is the mechanism working, not failing.");
    }

    function controls() {
      f.controls.innerHTML = "";
      tabs(f.controls, QS.map(function (q) { return q.id; }), qi, function (i) {
        qi = i; trace = null; controls(); render();
      });
      f.btn("run", function () { run(); render(); });
      slider(f.controls, "budget", 2, 30, budget, 1, String, function (v) { budget = v; if (trace) run(); render(); });
      toggle(f.controls, "SQL errors", injectSQL, function (v) { injectSQL = v; if (trace) run(); render(); });
      toggle(f.controls, "vector junk", injectJunk, function (v) { injectJunk = v; if (trace) run(); render(); });
      toggle(f.controls, "critic never satisfied", injectCritic, function (v) { injectCritic = v; if (trace) run(); render(); });
      f.btn("reset", function () {
        qi = 2; budget = 6; injectSQL = injectJunk = injectCritic = false; trace = null;
        controls(); render();
      });
    }
    controls(); render();
    f.say("Run Q3. Watch the router pick SQL. Then inject SQL tool errors.");
  };

  /* ========================================================================
     4. text2query — CH 22 — Stepper
     ======================================================================== */
  VIZ.text2query = function (el) {
    var f = frame(el);
    var svg = S("svg", { viewBox: "0 0 720 380", role: "img" }, f.body);

    // Measured cosines from "refund tickets" to each part of the schema.
    var SCHEMA_SIM = [
      { name: "refunds", note: "a table that does not exist", sim: 0.722, real: false },
      { name: "'refund'", note: "a VALUE inside a column, not in the DDL", sim: 0.728, real: false },
      { name: "refund_lines", note: "real, but holds money returned, not cases", sim: 0.574, real: true },
      { name: "tickets", note: "the correct table", sim: 0.613, real: true, correct: true },
      { name: "category", note: "the column the query must filter on", sim: 0.073, real: true, correct: true }
    ];
    // The four queries chapter 22 measures. True answer is 12.
    var QUERIES = {
      good: { sql: "SELECT COUNT(*) FROM tickets\nWHERE category = 'refund'\n  AND opened_at >= '2026-03-01'\n  AND opened_at < '2026-04-01';",
              n: 12, ok: true, why: "filters the category and uses a half-open date range" },
      noMap: { sql: "SELECT COUNT(*) FROM refunds\nWHERE month = 'March';",
               n: null, ok: false, err: "no such table: refunds",
               why: "without terminology mapping the model queries the table the words suggest, which does not exist. This one at least fails loudly." },
      fanout: { sql: "SELECT COUNT(*) FROM tickets t\nJOIN bookings b USING (booking_ref)\nJOIN segments s USING (booking_ref)\nWHERE t.category = 'refund' AND …;",
                n: 22, ok: false, why: "multi-leg bookings fan the ticket out into several rows. 1.8× the true answer, and it looks plausible." },
      everyMarch: { sql: "SELECT COUNT(*) FROM tickets\nWHERE category = 'refund'\n  AND strftime('%m', opened_at) = '03';",
                    n: 20, ok: false, why: "every March in the table, including last year's. The year is nowhere in the predicate." },
      distinct: { sql: "SELECT COUNT(DISTINCT passenger_id) FROM tickets\nJOIN bookings USING (booking_ref)\nWHERE category = 'refund' AND …;",
                  n: 10, ok: false, why: "counts complaining customers, not tickets. It answers a question nobody asked." }
    };
    var mapping = true, fewshot = true, step = 0, variant = "good";

    function pick() {
      if (!mapping) return "noMap";
      if (!fewshot) return "fanout";
      return variant;
    }

    function render() {
      svg.innerHTML = "";
      var key = pick(), q = QUERIES[key];
      T(svg, 24, 16, "Q3: “How many refund tickets were opened in March?”  ·  true answer 12",
        { anchor: "start", size: 11.5, fill: C.text, weight: 600 });

      // the schema gap
      T(svg, 24, 38, "cosine from “refund tickets” to each part of the schema", { anchor: "start",
        size: 9.5, fill: C.faint, weight: 700 });
      SCHEMA_SIM.forEach(function (o, i) {
        var y = 48 + i * 24;
        rect(svg, 24, y, 430, 21, { fill: o.correct ? "var(--tint-green)" : "none",
          stroke: o.correct ? C.green : (o.real ? C.line : C.pink), sw: o.correct ? 1.6 : 1, rx: 4 });
        T(svg, 36, y + 11, o.name, { anchor: "start", size: 9.5,
          fill: o.correct ? C.green : o.real ? C.dim : C.pink, weight: o.correct ? 700 : 400 });
        T(svg, 130, y + 11, o.note.slice(0, 40), { anchor: "start", size: 8, fill: C.faint });
        rect(svg, 330, y + 6, 90 * o.sim, 10, { fill: o.correct ? C.green : C.pink, stroke: "none", rx: 2 });
        T(svg, 446, y + 11, o.sim.toFixed(3), { anchor: "end", size: 9, fill: C.dim });
      });
      T(svg, 24, 176, "the top two are a table that does not exist and a value that is not in the DDL.",
        { anchor: "start", size: 9, fill: C.pink });
      T(svg, 24, 188, "the column the query must filter on scores 0.073, below every distractor.",
        { anchor: "start", size: 9, fill: C.pink });

      // the prompt parts
      var rx = 470;
      T(svg, rx, 38, "prompt parts", { anchor: "start", size: 9.5, fill: C.faint, weight: 700 });
      [["1. schema (DDL)", "177 tok, 4 tables", true],
       ["2. terminology", "glosses, enums, sample rows", mapping],
       ["3. few-shot", "2–3 pairs from THIS schema", fewshot],
       ["4. format rules", "one statement, no DML, LIMIT", true]
      ].forEach(function (p, i) {
        var y = 48 + i * 28;
        rect(svg, rx, y, 226, 25, { fill: p[2] ? "var(--tint-primary)" : "none",
          stroke: p[2] ? C.blue : C.pink, sw: p[2] ? 1.6 : 1.6, dash: p[2] ? "none" : "3 3", rx: 4 });
        T(svg, rx + 8, y + 10, p[0], { anchor: "start", size: 9,
          fill: p[2] ? C.text : C.pink, weight: 700 });
        T(svg, rx + 8, y + 20, p[2] ? p[1] : "OFF", { anchor: "start", size: 7.5,
          fill: p[2] ? C.faint : C.pink });
      });
      T(svg, rx, 176, "12 tables: 359 tokens. 200 tables:", { anchor: "start", size: 8.5, fill: C.dim });
      T(svg, rx, 188, "5,983, against a 4,096 budget.", { anchor: "start", size: 8.5, fill: C.orange });

      // the generated query
      if (step >= 1) {
        T(svg, 24, 214, "generated", { anchor: "start", size: 9.5, fill: C.faint, weight: 700 });
        rect(svg, 24, 222, 672, 74, { fill: C.panel, stroke: q.ok ? C.green : C.pink, sw: 2 });
        q.sql.split("\n").slice(0, 4).forEach(function (ln, i) {
          T(svg, 38, 240 + i * 16, ln, { anchor: "start", size: 10,
            fill: q.ok ? C.green : C.text });
        });
      }
      if (step >= 2) {
        rect(svg, 24, 304, 672, 66, { fill: C.panel, stroke: q.ok ? C.green : C.pink, sw: 2 });
        T(svg, 38, 324, q.err ? "ERROR: " + q.err : "result: " + q.n,
          { anchor: "start", size: 14, fill: q.ok ? C.green : C.pink, weight: 700 });
        if (!q.err && !q.ok) T(svg, 150, 324, "(true answer 12)", { anchor: "start", size: 10, fill: C.faint });
        wrap(q.why, 100).slice(0, 2).forEach(function (ln, i) {
          T(svg, 38, 344 + i * 13, ln, { anchor: "start", size: 9.5, fill: C.dim });
        });
      }

      f.say(step < 2 ? "Step: generate, then execute."
        : !mapping ? "With terminology mapping off the model queries a non-existent refunds table. Turn few-shot on and mapping back on."
        : !fewshot ? "The join fans multi-leg bookings out and returns 22. It parses, it executes, it returns an integer, and it is wrong by 1.8×."
        : key === "good" ? "Correct. Now switch the variant to see the three wrong queries that all parse, all execute, and all return a plausible integer."
        : "All three wrong queries return an integer. No exception, no empty result, nothing for a retry loop to catch.");
    }

    function controls() {
      f.controls.innerHTML = "";
      tabs(f.controls, ["correct", "fan-out", "every March", "distinct"],
        ["good", "fanout", "everyMarch", "distinct"].indexOf(variant), function (i) {
          variant = ["good", "fanout", "everyMarch", "distinct"][i];
          mapping = true; fewshot = true; step = 2; controls(); render();
        });
      toggle(f.controls, "terminology mapping", mapping, function (v) { mapping = v; step = 2; render(); });
      toggle(f.controls, "few-shot", fewshot, function (v) { fewshot = v; step = 2; render(); });
      f.btn("step ▸", function () { step = Math.min(2, step + 1); render(); });
      f.btn("reset", function () { mapping = true; fewshot = true; step = 0; variant = "good"; controls(); render(); });
    }
    controls(); render();
    f.say("Turn off terminology mapping and step. Read the error.");
  };

  /* ========================================================================
     5. kgExtract — CH 23 — Builder
     ======================================================================== */
  VIZ.kgExtract = function (el) {
    var f = frame(el);
    var svg = S("svg", { viewBox: "0 0 720 396", role: "img" }, f.body);

    var NAMES = [
      { a: "Larkspur Ltd", b: "Larkspur Limited", str: 0.86, emb: 0.94, same: true },
      { a: "Larkspur Ltd", b: "Larkspur Ltd.", str: 0.96, emb: 0.99, same: true },
      { a: "Larkspur Ltd", b: "LARKSPUR LTD", str: 1.00, emb: 1.00, same: true },
      { a: "Larkspur Ltd", b: "Larkspur Air Cargo", str: 0.70, emb: 0.88, same: false },
      { a: "Larkspur Ltd", b: "Larkspur Holdings", str: 0.71, emb: 0.90, same: false },
      { a: "Larkspur Ltd", b: "Larkspur Airlines", str: 0.72, emb: 0.91, same: false }
    ];
    // Measured over 153 candidate pairs, chapter 23.
    var MATCHERS = [
      { name: "exact string equality", p: 1.00, r: 0.00, f1: 0.00, wrong: 0 },
      { name: "normalised (case, punct, Ltd/Limited)", p: 1.00, r: 0.20, f1: 0.33, wrong: 0 },
      { name: "string similarity ≥ 0.80", p: 1.00, r: 0.24, f1: 0.39, wrong: 0 },
      { name: "string similarity ≥ 0.70", p: 0.75, r: 0.24, f1: 0.36, wrong: 2 },
      { name: "embedding cosine ≥ 0.85", p: 0.62, r: 0.20, f1: 0.30, wrong: 3 },
      { name: "embedding cosine ≥ 0.70", p: 0.48, r: 0.44, f1: 0.46, wrong: 12 },
      { name: "cascade: rules, aliases, similarity 0.90", p: 1.00, r: 0.72, f1: 0.84, wrong: 0 }
    ];
    var thresh = 0.95, useEmb = false, extracted = false;

    function merged() {
      return NAMES.filter(function (n) { return (useEmb ? n.emb : n.str) >= thresh; });
    }

    function render() {
      svg.innerHTML = "";
      T(svg, 24, 16, "a contract paragraph mentions the licensee six ways", { anchor: "start",
        size: 11, fill: C.text, weight: 600 });

      if (!extracted) {
        T(svg, 24, 44, "press extract", { anchor: "start", size: 11, fill: C.faint });
        f.say("Press extract. Then slide the threshold down until the duplicates merge, and further until it goes wrong.");
      } else {
        var m = merged();
        var wrongMerges = m.filter(function (n) { return !n.same; }).length;
        var goodMerges = m.filter(function (n) { return n.same; }).length;

        T(svg, 24, 40, "candidate pairs against “Larkspur Ltd” · " +
          (useEmb ? "embedding cosine" : "string similarity") + " ≥ " + thresh.toFixed(2),
          { anchor: "start", size: 9.5, fill: C.faint, weight: 700 });
        NAMES.forEach(function (n, i) {
          var y = 50 + i * 28, sim = useEmb ? n.emb : n.str, will = sim >= thresh;
          var bad = will && !n.same;
          rect(svg, 24, y, 430, 25, {
            fill: bad ? "rgba(255,100,200,.12)" : will ? "var(--tint-green)" : "none",
            stroke: bad ? C.pink : will ? C.green : C.line, sw: will ? 2 : 1, rx: 4 });
          T(svg, 36, y + 13, n.b, { anchor: "start", size: 10,
            fill: bad ? C.pink : will ? C.green : C.dim, weight: will ? 700 : 400 });
          T(svg, 250, y + 13, n.same ? "same company" : "DIFFERENT company",
            { anchor: "start", size: 8, fill: n.same ? C.faint : C.pink });
          rect(svg, 366, y + 8, 60 * sim, 9, { fill: bad ? C.pink : will ? C.green : C.faint,
            stroke: "none", rx: 2 });
          T(svg, 446, y + 13, sim.toFixed(2), { anchor: "end", size: 9, fill: C.dim });
        });

        rect(svg, 24, 224, 430, 54, { fill: C.panel, stroke: wrongMerges ? C.pink : C.green, sw: 2 });
        T(svg, 38, 244, goodMerges + " correct merges, " + wrongMerges + " wrong",
          { anchor: "start", size: 12, fill: wrongMerges ? C.pink : C.green, weight: 700 });
        T(svg, 38, 264, wrongMerges
          ? "Larkspur Air Cargo and Larkspur Holdings are separate companies in this contract."
          : thresh > 0.9 ? "Nothing has merged yet: Ltd and Limited are still two nodes."
          : "The duplicates collapsed and nothing else did.",
          { anchor: "start", size: 9.5, fill: C.dim });

        f.say(wrongMerges
          ? "At " + thresh.toFixed(2) + ", " + wrongMerges + " different companies have been merged into one node. An over-merge is worse than a duplicate: a duplicate splits your evidence, an over-merge invents a relationship that does not exist."
          : goodMerges === 0
          ? "Nothing merges at " + thresh.toFixed(2) + ". “Larkspur Ltd” and “Larkspur Limited” are still two separate nodes with half the evidence each."
          : "Merged the duplicates and nothing else. Keep sliding down and watch it break.");
      }

      // the measured matcher table
      var ty = 290;
      T(svg, 24, ty, "measured: precision, recall and F1 over 153 candidate pairs", { anchor: "start",
        size: 9.5, fill: C.faint, weight: 700 });
      MATCHERS.forEach(function (o, i) {
        var y = ty + 10 + i * 12, best = o.f1 > 0.8;
        T(svg, 24, y, o.name, { anchor: "start", size: 8, fill: best ? C.green : C.dim,
          weight: best ? 700 : 400 });
        T(svg, 300, y, o.p.toFixed(2), { anchor: "end", size: 8, fill: o.p === 1 ? C.green : C.pink });
        T(svg, 340, y, o.r.toFixed(2), { anchor: "end", size: 8, fill: C.dim });
        T(svg, 384, y, o.f1.toFixed(2), { anchor: "end", size: 8, fill: best ? C.green : C.dim,
          weight: best ? 700 : 400 });
        T(svg, 460, y, o.wrong ? o.wrong + " wrong merges" : "0 wrong", { anchor: "end", size: 8,
          fill: o.wrong ? C.pink : C.faint });
      });
      T(svg, 24, ty + 10 + MATCHERS.length * 12 + 6,
        "no single matcher clears F1 0.46. The cascade reaches 0.84 with precision intact.",
        { anchor: "start", size: 9, fill: C.text, weight: 700 });

      // the right column: what the graph stores
      var rx = 470;
      if (extracted) {
        T(svg, rx, 40, "what the graph stores for Q4", { anchor: "start", size: 9.5,
          fill: C.faint, weight: 700 });
        [["(:Incident INC-2042)", C.orange], ["│ AMENDED", C.green],
         ["(:Policy Refund and Cancellation)", C.blue]].forEach(function (n, i) {
          T(svg, rx, 60 + i * 22, n[0], { anchor: "start", size: 9.5, fill: n[1], weight: 700 });
        });
        T(svg, rx, 134, "doc 17 and doc 7 share NO words", { anchor: "start", size: 9, fill: C.pink });
        T(svg, rx, 146, "longer than six characters.", { anchor: "start", size: 9, fill: C.pink });
        T(svg, rx, 166, "One edge, written once at ingest,", { anchor: "start", size: 9, fill: C.dim });
        T(svg, rx, 178, "replaces a second generation.", { anchor: "start", size: 9, fill: C.dim });
        T(svg, rx, 206, "Chapter 20 reached doc 7 with a", { anchor: "start", size: 8.5, fill: C.faint });
        T(svg, rx, 218, "second retrieval. This is a lookup.", { anchor: "start", size: 8.5, fill: C.faint });
      }
    }

    function controls() {
      f.controls.innerHTML = "";
      f.btn("extract", function () { extracted = true; render(); });
      slider(f.controls, "threshold", 0.60, 1.00, thresh, 0.01, function (v) { return v.toFixed(2); },
        function (v) { thresh = v; render(); });
      toggle(f.controls, "embedding matcher", useEmb, function (v) { useEmb = v; render(); });
      f.btn("reset", function () { thresh = 0.95; useEmb = false; extracted = false; controls(); render(); });
    }
    controls(); render();
    f.say("Press extract. Then slide the threshold down until the duplicates merge, and further until it goes wrong.");
  };

  /* ========================================================================
     6. graphragPipeline — CH 24 — Stepper
     ======================================================================== */
  VIZ.graphragPipeline = function (el) {
    var f = frame(el);
    var svg = S("svg", { viewBox: "0 0 720 370", role: "img" }, f.body);

    // Measured on Larkspur, chapter 24.
    var STRATEGIES = [
      { name: "stuff the whole corpus", units: 56, tokens: 1889, calls: 1, cov: 1.00 },
      { name: "level 1 reports (fine)", units: 13, tokens: 1499, calls: 13, cov: 0.61 },
      { name: "level 0 reports (coarse)", units: 6, tokens: 1025, calls: 6, cov: 0.61 },
      { name: "top-5 vector window", units: 5, tokens: 171, calls: 1, cov: 0.09 }
    ];
    var STAGES = [
      { name: "chunk at 600", cost: "free",
        detail: "600-token chunks recover almost twice as many entity references as 2,400-token ones, on the same text." },
      { name: "extract", cost: "1 call per chunk",
        detail: "One extraction call for every chunk. This is the bulk of the indexing bill." },
      { name: "glean", cost: "+1 call per round",
        detail: "Ask again for what the first pass missed. Each round costs another call per chunk." },
      { name: "summarize descriptions", cost: "1 call per super-node",
        detail: "Entities mentioned many times get their descriptions merged into one." },
      { name: "Leiden + reports", cost: "1 call per community",
        detail: "Cluster the entity graph, then write one report per community. Level 0 gives 6 communities, level 1 gives 13." }
    ];
    var step = 0, gleaning = 0, level = 0, mode = 0;   // mode 0 global, 1 local

    function entities() { return 71 + gleaning * 11; }         // ~15% per pass
    function extractCalls() { return 56 * (1 + gleaning); }

    function render() {
      svg.innerHTML = "";
      T(svg, 24, 16, "the indexing pipeline, and where the money goes", { anchor: "start",
        size: 11, fill: C.text, weight: 600 });

      STAGES.forEach(function (s, i) {
        var y = 32 + i * 30, on = step > i;
        rect(svg, 24, y, 430, 26, { fill: on ? "var(--tint-primary)" : "none",
          stroke: on ? C.blue : C.line, sw: on ? 1.8 : 1, rx: 4 });
        T(svg, 36, y + 13, (i + 1) + ". " + s.name, { anchor: "start", size: 10,
          fill: on ? C.text : C.faint, weight: on ? 700 : 400 });
        T(svg, 340, y + 13, i === 1 ? extractCalls() + " calls" : (i === 2 && gleaning ? gleaning * 56 + " calls" : s.cost),
          { anchor: "start", size: 8.5, fill: on ? C.orange : C.faint });
      });

      if (step >= 1 && step <= STAGES.length) {
        rect(svg, 24, 186, 430, 40, { fill: C.panel, stroke: C.line });
        wrap(STAGES[step - 1].detail, 62).slice(0, 2).forEach(function (ln, i) {
          T(svg, 38, 204 + i * 13, ln, { anchor: "start", size: 9, fill: C.dim });
        });
      }

      // the graph state
      var rx = 470;
      T(svg, rx, 32, "after " + gleaning + " gleaning pass" + (gleaning === 1 ? "" : "es"),
        { anchor: "start", size: 9.5, fill: C.faint, weight: 700 });
      [["entities", String(entities()), gleaning ? C.green : C.text],
       ["extraction calls", String(extractCalls()), gleaning ? C.pink : C.text],
       ["communities, level 0", "6", C.text],
       ["communities, level 1", "13", C.text]
      ].forEach(function (r, i) {
        T(svg, rx, 50 + i * 20, r[0], { anchor: "start", size: 9, fill: C.faint });
        T(svg, rx + 220, 50 + i * 20, r[1], { anchor: "end", size: 10.5, fill: r[2], weight: 700 });
      });
      if (gleaning)
        T(svg, rx, 140, "+" + Math.round((entities() / 71 - 1) * 100) + "% entities for " +
          (1 + gleaning) + "× the extraction cost", { anchor: "start", size: 8.5, fill: C.orange });

      // community sizes
      T(svg, rx, 168, "Leiden, recursive", { anchor: "start", size: 9.5, fill: C.faint, weight: 700 });
      var sizes = level === 0 ? [16, 13, 11, 7, 4, 2] : [8, 6, 6, 6, 5, 5, 4, 3, 2, 2, 2, 2, 2];
      var bw = Math.min(16, 220 / sizes.length);
      sizes.forEach(function (s, i) {
        rect(svg, rx + i * (bw + 2), 182 + (16 - s), bw, s * 2.4, {
          fill: level === 0 ? C.blue : C.teal, stroke: "none", rx: 1 });
      });
      T(svg, rx, 224, "level " + level + ": " + sizes.length + " communities, sizes " + sizes.join(" "),
        { anchor: "start", size: 8, fill: C.dim });
      T(svg, rx, 240, "10 runs: Louvain gave 2 distinct partitions,", { anchor: "start", size: 8, fill: C.faint });
      T(svg, rx, 250, "Leiden gave 4. Leiden was LESS stable here.", { anchor: "start", size: 8, fill: C.faint });

      // the global-search cost table
      var ty = 268;
      T(svg, 24, ty, "what a global answer costs, and what it sees", { anchor: "start",
        size: 9.5, fill: C.faint, weight: 700 });
      STRATEGIES.forEach(function (s, i) {
        var y = ty + 12 + i * 20;
        var cur = (level === 0 && s.name.indexOf("level 0") === 0) ||
                  (level === 1 && s.name.indexOf("level 1") === 0);
        rect(svg, 24, y, 672, 18, { fill: cur ? "var(--tint-primary)" : "none",
          stroke: cur ? C.blue : "none", sw: 1.5, rx: 3 });
        T(svg, 32, y + 9, s.name, { anchor: "start", size: 8.5,
          fill: cur ? C.text : C.dim, weight: cur ? 700 : 400 });
        T(svg, 300, y + 9, s.tokens.toLocaleString() + " tok", { anchor: "end", size: 8.5, fill: C.dim });
        T(svg, 370, y + 9, s.calls + " map call" + (s.calls === 1 ? "" : "s"), { anchor: "end", size: 8.5, fill: C.dim });
        rect(svg, 400, y + 4, 200 * s.cov, 10, {
          fill: s.cov > 0.5 ? C.green : C.pink, stroke: "none", rx: 2 });
        T(svg, 690, y + 9, Math.round(s.cov * 100) + "% of the corpus", { anchor: "end", size: 8.5,
          fill: s.cov > 0.5 ? C.green : C.pink, weight: 700 });
      });
      T(svg, 24, 360, "the cheapest row is the one that cannot answer the question. Cost is not the axis that separates these: COVERAGE is.",
        { anchor: "start", size: 9, fill: C.text, weight: 700 });

      f.say(step < STAGES.length ? "Step through the pipeline."
        : gleaning ? "One gleaning pass adds " + Math.round((entities() / 71 - 1) * 100) +
            "% more entities and doubles the extraction bill. Whether that is worth it depends on whether the missed entities were the ones your questions need."
        : level === 1 ? "Level 1 splits the same graph into 13 finer communities: more map calls, more tokens, the same 61% coverage. Finer is not broader."
        : "Set gleaning to 1 and watch the entity count and the cost. Then switch to level 1.");
    }

    function controls() {
      f.controls.innerHTML = "";
      f.btn("step ▸", function () { step = Math.min(STAGES.length, step + 1); render(); });
      f.btn("run all", function () { step = STAGES.length; render(); });
      slider(f.controls, "gleaning", 0, 2, gleaning, 1, String, function (v) { gleaning = v; render(); });
      tabs(f.controls, ["level 0", "level 1"], level, function (i) { level = i; controls(); render(); });
      f.btn("reset", function () { step = 0; gleaning = 0; level = 0; controls(); render(); });
    }
    controls(); render();
    f.say("Step through the pipeline once. Then set gleaning to 1 and watch the entity count and the cost.");
  };
})();
