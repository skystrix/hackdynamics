/* ==========================================================================
   viz-llm1.js — LLM In Depth machines, batch 1: chapters 1–5.

     llmNextToken   ch1  Playground real measured distributions; confidence is context
     llmBpeTrainer  ch2  Builder    byte-pair encoding, trained live, merge by merge
     llmVocabTradeoff ch2 Tuner     three costs that move against each other
     llmTokenizerCompare ch2 Comparator one text, three real encodings, measured
     llmChatTemplate ch3 Stepper    a conversation flattened, then broken on purpose
     llmTokenBoundaries ch3 Playground tokens with ids, and the classic traps flagged
     llmEmbeddingSpace ch4 Playground real GPT-2 rows, three metrics, one Gram matrix
     llmContrastive ch4 Stepper     InfoNCE and its gradients, evaluated live
     llmMultiHead   ch6 Inspector  eight real GPT-2 heads, picked by measuring 144
     llmKvBudget    ch6 Tuner      the cache formula, live, against a 16 GB card
     llmRope        ch7 Inspector  one subspace, and a score that ignores where
     llmContextStretch ch7 Tuner   64 pairs, and the angles training never showed
     llmNeedle      ch7 Playground P4, actually run, with and without decoys
     llmBlock       ch8 Inspector  32 blocks, real backprop, skips on and off
     llmActivations ch8 Comparator curves, matched parameters, and an ablation run
     llmParamCounter ch9 Builder   the section's table, produced from a config
     llmMemoryFit   ch9 Tuner      weights, cache, optimizer, and counted activations
     llmMoeRouter   ch10 Simulator collapse, run rather than asserted, and the loss that stops it
     llmActiveVsTotal ch10 Comparator two bills, and the dense model you would buy instead
     llmLogitLens   ch11 Stepper    every layer asked what it would answer now
     llmInductionHead ch11 Inspector 144 heads scored; both halves of the circuit fall out
     llmCorpusPipeline ch12 Stepper  1,000 documents, six filters, real MinHash
     llmContamination ch12 Playground the n-gram knob, and the floor under it
     llmLossStep    ch13 Stepper    real per-token loss, and what the worst one is
     llmLossCurves  ch13 Comparator six shapes, one fault each, healthy drawn behind
     llmOptimizer   ch14 Simulator  four rules, a quartic wall, and warmup that saves a run
     llmPrecision   ch14 Comparator real fp16/bf16/fp8 encoders, and two facts performed
     llmMemoryLevers ch14 Tuner     the two levers, against 16 GB and the clock
     llmScalingLaw  ch15 Tuner      one budget, three laws, and Chinchilla rederived
     llmEmergence   ch15 Comparator the inference bill, and a jump that is a ruler
     llmCourseMap   ch1  Inspector  three machines, one block, two directions
     llmAttention   ch5  Inspector  one head, clickable queries, the divisor toggle
     llmCausalMask  ch5  Stepper    generate left to right, then let it read the future
     llmAttentionCost ch5 Tuner     the quadratic term, against a 16 GB card

   Helpers come from js/viz-rag-kit.js, which must load first. The kit is
   course-neutral (SVG builders and a theme-following palette), so this course
   reads it rather than shipping a second copy under a different name.
   ========================================================================== */

(function () {
  "use strict";
  window.VIZ = window.VIZ || {};
  var K = window.RAGKIT;
  var C = K.C, S = K.S, T = K.T, rect = K.rect, line = K.line,
      frame = K.frame, toggle = K.toggle, tipOn = K.tipOn, slider = K.slider,
      tabs = K.tabs;

  /* Break a row of boxes of the given widths into lines, keeping room on the
     last line for a "+N more" tail. Every machine here that draws a row of
     tokens needs this, and none of them needs its own copy: pass items that
     carry a .w, get .x and .ln back on the ones that fit. */

  /* Draw a sentence as however many lines it needs, breaking on spaces at
     `cw` characters. Returns the y of the line after the last one drawn. */
  function wrapT(p, x, y, cw, lh, str, opts) {
    var words = str.split(" "), cur = "", out = [], i;
    for (i = 0; i < words.length; i++) {
      var t = cur ? cur + " " + words[i] : words[i];
      if (t.length > cw && cur) { out.push(cur); cur = words[i]; } else cur = t;
    }
    if (cur) out.push(cur);
    if (opts && opts.max && out.length > opts.max) {
      out = out.slice(0, opts.max);
      out[opts.max - 1] = out[opts.max - 1].replace(/.{2}$/, "…");
    }
    for (i = 0; i < out.length; i++)
      T(p, x, y + i * lh, out[i], { anchor: "start", size: (opts && opts.size) || 10.5,
        fill: (opts && opts.fill) || C.text });
    return y + out.length * lh;
  }

  /* A deterministic RNG, so every reader sees the same "random" weights and a
     screenshot means something. Three machines want it; it lives here once. */
  function hash32(str) {
    var h = 2166136261 >>> 0, i;
    for (i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619) >>> 0; }
    return h >>> 0;
  }
  function mulberry(a) {
    return function () {
      a |= 0; a = (a + 0x6D2B79F5) | 0;
      var t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  function gauss(r) {              // Box-Muller, unit variance
    var u = 1 - r(), v = r();
    return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
  }

  var WX0 = 8, WX1 = 752, WTAIL = 690, WGAP = 3;
  function wrapBoxes(items, maxLines) {
    var x = WX0, ln = 0, i;
    for (i = 0; i < items.length; i++) {
      if (x + items[i].w > (ln + 1 >= maxLines ? WTAIL : WX1)) {
        if (ln + 1 >= maxLines) return { pos: items.slice(0, i), lines: ln + 1, cut: i };
        ln++; x = WX0;
      }
      items[i].x = x; items[i].ln = ln;
      x += items[i].w + WGAP;
    }
    return { pos: items, lines: ln + 1, cut: -1 };
  }

  /* ========================================================================
     1. llmAttention — CH 5 — Inspector

     One attention head over a sentence the learner can edit. Scores are real
     dot products of real 128-dimensional vectors, so the divisor toggle is a
     measurement rather than a story: without it the score std is sqrt(128),
     the softmax saturates, and the row collapses.

     The head is hand-built, not trained, and the chapter's own paragraph says
     how: W_Q and W_K are separate matrices, so a query can be projected to
     point where a different kind of key points. Here one alignment direction
     u is added to the query of every pronoun and to the key of every noun,
     which is "a pronoun wants its antecedent" written as arithmetic.

     There is no position information anywhere in this machine. Chapter 7 adds
     it, and until then two copies of "the" are the same vector — which the
     heatmap shows as two identical columns.
     ======================================================================== */
  VIZ.llmAttention = function (el) {
    var f = frame(el);

    var DH = 128;                 // head dimension, the chapter's 128
    var ALIGN = 5;                // length of the pronoun/noun alignment term
    var MAXTOK = 12;
    var DEFAULT = "the cat sat on the mat because it was warm";

    /* ---- deterministic vectors -------------------------------------- */
    var vcache = {};
    function vec(seed) {
      if (vcache[seed]) return vcache[seed];
      var r = mulberry(hash32(seed)), o = new Float64Array(DH);
      for (var i = 0; i < DH; i++) o[i] = gauss(r);
      return (vcache[seed] = o);
    }
    var U = (function () {        // the one direction this head aligns on
      var u = vec("align|dir").slice(), n = 0, i;
      for (i = 0; i < DH; i++) n += u[i] * u[i];
      n = Math.sqrt(n);
      for (i = 0; i < DH; i++) u[i] /= n;
      return u;
    })();

    /* ---- a word list, not a parser. Closed classes really are closed;
            everything left over is treated as a noun. ------------------ */
    var FUNC = " the a an of on in at to for and or but because while with by from as if then than ";
    var PRON = " it they he she him her them itself themselves ";
    var VERB = " is are was were be been being sat ran ate saw went came took made had has have did do does said told carried sleeps slept runs \
                  unlock unlocks opened opens close closes hold holds fit fits work works broke broke wrote read ";
    var ADJ  = " warm cold red big small quick lazy happy tired new old ";
    function has(list, w) { return list.indexOf(" " + w + " ") >= 0; }
    function isPron(w) { return has(PRON, w) ? 1 : 0; }
    function isNoun(w) {
      return (has(FUNC, w) || has(PRON, w) || has(VERB, w) || has(ADJ, w)) ? 0 : 1;
    }
    function role(w) { return isPron(w) ? "pronoun" : isNoun(w) ? "noun" : "function word"; }

    function proj(w, which) {
      var a = vec(w + "|" + which).slice();
      var boost = which === "q" ? isPron(w) : which === "k" ? isNoun(w) : 0;
      if (boost) for (var i = 0; i < DH; i++) a[i] += ALIGN * U[i];
      return a;
    }
    function dot(a, b) { var s = 0; for (var i = 0; i < DH; i++) s += a[i] * b[i]; return s; }

    /* ---- state ------------------------------------------------------- */
    var words, Q, Kv, Vv, sel = 0, masked = true, scaled = true;

    function setSentence(str) {
      var w = String(str).toLowerCase().replace(/[^a-z' ]+/g, " ").split(/\s+/)
                .filter(function (x) { return x; }).slice(0, MAXTOK);
      if (w.length < 2) throw new Error("need at least two words");
      words = w;
      Q = words.map(function (x) { return proj(x, "q"); });
      Kv = words.map(function (x) { return proj(x, "k"); });
      Vv = words.map(function (x) { return proj(x, "v"); });
      if (sel >= words.length) sel = words.length - 1;
    }

    function rowScores(i) {       // raw dot products for query i, every key
      var d = scaled ? Math.sqrt(DH) : 1;
      return words.map(function (_, j) { return dot(Q[i], Kv[j]) / d; });
    }
    function rowWeights(i) {      // softmax over the keys the mask allows
      var s = rowScores(i), out = words.map(function () { return 0; });
      var live = [], j;
      for (j = 0; j < words.length; j++) if (!masked || j <= i) live.push(j);
      var m = -Infinity;
      live.forEach(function (j) { if (s[j] > m) m = s[j]; });
      var z = 0;
      live.forEach(function (j) { out[j] = Math.exp(s[j] - m); z += out[j]; });
      live.forEach(function (j) { out[j] /= z; });
      return out;
    }

    /* ---- drawing ----------------------------------------------------- */
    var svg = S("svg", {
      viewBox: "0 0 760 440", width: "100%",
      role: "img", "aria-label": "one attention head over a sentence"
    }, f.body);

    function cellSize() {
      return Math.max(16, Math.min(28, Math.floor(250 / words.length)));
    }

    function render() {
      while (svg.firstChild) svg.removeChild(svg.firstChild);
      var n = words.length, cell = cellSize(), i, j;
      var gx = 112, gy = 96;

      /* --- the sentence across the top --- */
      T(svg, 8, 14, "sentence — click a word to make it the query",
        { anchor: "start", size: 11, fill: C.faint });
      T(svg, 752, 14, "teal = noun (key side)   ·   orange = pronoun (query side)",
        { anchor: "end", size: 10.5, fill: C.faint });
      var x = 8;
      for (i = 0; i < n; i++) {
        var w = words[i], cw = 14 + 7.2 * w.length;
        var chip = rect(svg, x, 24, cw, 26, {
          rx: 5, fill: i === sel ? C.card : "none",
          stroke: i === sel ? C.orange : C.line, sw: i === sel ? 2 : 1
        });
        var tone = isPron(w) ? C.orange : isNoun(w) ? C.teal : C.dim;
        T(svg, x + cw / 2, 38, w, { size: 12, fill: tone });
        (function (idx, word) {
          chip.style.cursor = "pointer";
          chip.addEventListener("click", function () { sel = idx; render(); });
          tipOn(chip, word, "position " + idx + " &middot; " + role(word) +
            "<br>q, k and v are three different 128-dimensional projections of this word.");
        })(i, w);
        x += cw + 6;
      }

      /* --- heatmap --- */
      T(svg, 8, 74, "weights: query row x key column", { anchor: "start", size: 11, fill: C.faint });
      for (i = 0; i < n; i++) {
        T(svg, gx + i * cell + cell / 2, gy - 10, String(i), { size: 9.5, fill: C.faint });
        T(svg, gx - 8, gy + i * cell + cell / 2, words[i].slice(0, 9),
          { anchor: "end", size: 10.5, fill: i === sel ? C.orange : C.dim });
        var wts = rowWeights(i);
        for (j = 0; j < n; j++) {
          var off = masked && j > i;
          var c = S("rect", {
            x: gx + j * cell, y: gy + i * cell, width: cell - 1.5, height: cell - 1.5, rx: 2,
            fill: off ? C.line : C.blue, opacity: off ? 0.1 : 0.07 + 0.93 * wts[j]
          }, svg);
          (function (qi, kj, wt, isOff) {
            c.style.cursor = "pointer";
            c.addEventListener("click", function () { sel = qi; render(); });
            tipOn(c, words[qi] + "  →  " + words[kj],
              isOff ? "masked: position " + kj + " is in the future of position " + qi
                    : "weight " + wt.toFixed(4));
          })(i, j, wts[j], off);
        }
      }
      rect(svg, gx - 2, gy + sel * cell - 2, n * cell + 2, cell + 2,
        { rx: 3, stroke: C.orange, sw: 1.5 });

      /* --- the selected softmax row, as bars --- */
      var wts2 = rowWeights(sel), sc = rowScores(sel);
      T(svg, 400, 74, "softmax row for query «" + words[sel] + "»",
        { anchor: "start", size: 11, fill: C.faint });
      var bx = 476, bw = 212;
      for (i = 0; i < n; i++) {
        var yy = gy + i * cell + cell / 2;
        var dead = masked && i > sel;
        T(svg, 400, yy, words[i].slice(0, 9), { anchor: "start", size: 10.5,
          fill: dead ? C.faint : C.dim });
        line(svg, bx, yy, bx + bw, yy, { stroke: C.line, sw: 0.6 });
        if (!dead) {
          S("rect", { x: bx, y: yy - Math.min(8, cell / 2 - 2), width: Math.max(0.6, wts2[i] * bw),
            height: Math.min(16, cell - 4), rx: 2, fill: C.blue, opacity: 0.85 }, svg);
        }
        T(svg, 752, yy, dead ? "—" : wts2[i].toFixed(3),
          { anchor: "end", size: 10, fill: dead ? C.faint : C.text });
      }

      /* --- what the numbers say --- */
      var liveS = sc.filter(function (_, j) { return !masked || j <= sel; });
      var mu = liveS.reduce(function (a, b) { return a + b; }, 0) / liveS.length;
      var sd = Math.sqrt(liveS.reduce(function (a, b) { return a + (b - mu) * (b - mu); }, 0) / liveS.length);
      var top = 0;
      for (i = 1; i < n; i++) if (wts2[i] > wts2[top]) top = i;
      var H = 0;
      wts2.forEach(function (p) { if (p > 0) H -= p * Math.log(p); });

      line(svg, 8, 368, 752, 368, { stroke: C.line, sw: 1 });
      T(svg, 8, 386, "raw scores  " + Math.min.apply(null, liveS).toFixed(2) + " .. " +
        Math.max.apply(null, liveS).toFixed(2) + "     std " + sd.toFixed(2) +
        "     divisor " + (scaled ? "√128 = 11.31" : "OFF (1)"),
        { anchor: "start", size: 11, fill: scaled ? C.dim : C.orange });
      T(svg, 8, 406, "weights     max " + wts2[top].toFixed(3) + " on «" + words[top] +
        "»     entropy " + H.toFixed(2) + " of " + Math.log(liveS.length).toFixed(2) + " nats",
        { anchor: "start", size: 11, fill: scaled ? C.dim : C.orange });
      // Two things the learner would otherwise have to guess. Both are true and
      // both matter for reading everything above correctly.
      T(svg, 752, 386, "a hand-built head, not a trained one", { anchor: "end", size: 10, fill: C.faint });
      T(svg, 752, 406, "no position information yet — Chapter 7 adds it", { anchor: "end", size: 10, fill: C.faint });

      /* --- the output: sum of v weighted by that row --- */
      var out = new Float64Array(DH);
      for (i = 0; i < n; i++) if (wts2[i]) for (j = 0; j < DH; j++) out[j] += wts2[i] * Vv[i][j];
      T(svg, 8, 428, "output = Σ wᵢvᵢ", { anchor: "start", size: 11, fill: C.faint });
      var ox = 120, big = 0;
      for (j = 0; j < DH; j++) big = Math.max(big, Math.abs(out[j]));
      for (j = 0; j < 24; j++) {
        var val = out[j] / (big || 1);
        S("rect", { x: ox + j * 13, y: 419, width: 11.5, height: 16, rx: 2,
          fill: val >= 0 ? C.teal : C.pink, opacity: 0.15 + 0.85 * Math.abs(val) }, svg);
      }
      T(svg, ox + 24 * 13 + 10, 428, "first 24 of 128 dimensions",
        { anchor: "start", size: 10, fill: C.faint });
    }

    /* ---- controls ----------------------------------------------------- */
    function step(d) {
      sel = (sel + d + words.length) % words.length;
      render();
      f.say("query is now «" + words[sel] + "» (position " + sel + ").");
    }
    f.btn("◀ query", function () { step(-1); });
    f.btn("query ▶", function () { step(1); });

    var maskT = toggle(f.controls, "causal mask", true, function (v) {
      masked = v; render();
      f.say(v ? "Mask on: a position may read itself and everything before it."
              : "Mask off: every position can now read the future. Chapter 5 section 3 is what that breaks.");
    });
    var scaleT = toggle(f.controls, "divide by √d_k", true, function (v) {
      scaled = v; render();
      f.say(v ? "Divisor back on: the scores have std near 1 and the row is a distribution again."
              : "Divisor off. The scores now have std near √128 = 11.3, and the softmax saturates: "
                + "read the max weight and the entropy at the bottom.");
    });

    var input = document.createElement("input");
    input.type = "text"; input.value = DEFAULT;
    input.setAttribute("aria-label", "sentence");
    input.style.cssText = "font:12px ui-monospace,Menlo,monospace;padding:4px 6px;min-width:250px;" +
      "background:var(--bg-2);color:var(--text);border:1px solid var(--line);border-radius:6px";
    f.controls.appendChild(input);
    function apply() {
      try {
        setSentence(input.value); render();
        f.say("New sentence, " + words.length + " tokens. Same head, same matrices: only the words changed.");
      } catch (e) { f.say("Could not use that: " + e.message); }
    }
    input.addEventListener("keydown", function (e) { if (e.key === "Enter") { e.preventDefault(); apply(); } });
    f.btn("use sentence", apply);

    f.btn("reset", function () {
      input.value = DEFAULT; sel = 7; masked = true; scaled = true;
      maskT.set(true); scaleT.set(true);
      setSentence(DEFAULT); render();
      f.say("Click a word to see what it attends to. Then switch off the scaling and watch the distribution die.");
    });

    setSentence(DEFAULT);
    sel = 7;                                  // «it», the pronoun the head looks for
    render();
    f.say("Click a word to see what it attends to. Then switch off the scaling and watch the distribution die.");
  };

  /* ========================================================================
     2. llmCausalMask — CH 5 — Stepper

     The head here is the one a broken mask produces. Trained without a mask,
     the cheapest way to cut the loss is to put your weight one position ahead
     and copy what is there, so that is what gradient descent finds. This
     machine ships that head: a relative-position bias of +6 at offset +1, on
     top of ordinary scaled dot products of 32-dimensional vectors.

     Run it unmasked and it scores 7 out of 7, with 0.89 to 0.99 of its weight
     on position i+1 every step. It is not predicting, it is reading. Put the
     mask back and the same head scores 0 out of 7, because copying the next
     token is the only thing it ever learned. That is the section's closing
     line made measurable: a loss that falls beautifully and a model that
     cannot generate.

     The readout is Chapter 4's weight tying, reused: logits are the output
     vector dotted against each token's own value vector.
     ======================================================================== */
  VIZ.llmCausalMask = function (el) {
    var f = frame(el);

    var DH = 32;                  // small enough that the dot products stay tangible
    var NEXTBIAS = 6;             // what a maskless head learns: look one ahead
    var WORDS = "the cat sat down on the warm mat".split(" ");
    var VOCAB = WORDS.filter(function (w, i) { return WORDS.indexOf(w) === i; });
    var N = WORDS.length, LAST = N - 2;

    var vc = {};
    function vec(seed) {
      if (vc[seed]) return vc[seed];
      var r = mulberry(hash32(seed)), o = new Float64Array(DH);
      for (var i = 0; i < DH; i++) o[i] = gauss(r);
      return (vc[seed] = o);
    }
    function dot(a, b) { var s = 0; for (var i = 0; i < DH; i++) s += a[i] * b[i]; return s; }
    function soft(x) {
      var m = Math.max.apply(null, x), e = x.map(function (v) { return Math.exp(v - m); });
      var z = e.reduce(function (a, b) { return a + b; }, 0);
      return e.map(function (v) { return v / z; });
    }

    var Qv = WORDS.map(function (w) { return vec(w + "|q"); });
    var Kv = WORDS.map(function (w) { return vec(w + "|k"); });
    var Vv = WORDS.map(function (w) { return vec(w + "|v"); });

    var cur = 0, masked = true;

    /* One position's attention row, and the token it then predicts. */
    function stepAt(i) {
      var allowed = [], j;
      for (j = 0; j < N; j++) if (!masked || j <= i) allowed.push(j);
      var sc = allowed.map(function (j) {
        return dot(Qv[i], Kv[j]) / Math.sqrt(DH) + ((j - i) === 1 ? NEXTBIAS : 0);
      });
      var w = soft(sc), weights = WORDS.map(function () { return -1; });
      allowed.forEach(function (j, a) { weights[j] = w[a]; });
      var out = new Float64Array(DH);
      allowed.forEach(function (j, a) {
        for (var d = 0; d < DH; d++) out[d] += w[a] * Vv[j][d];
      });
      var probs = soft(VOCAB.map(function (t) { return dot(out, vec(t + "|v")) / Math.sqrt(DH); }));
      var best = 0;
      for (j = 1; j < VOCAB.length; j++) if (probs[j] > probs[best]) best = j;
      var topj = allowed[0];
      allowed.forEach(function (j) { if (weights[j] > weights[topj]) topj = j; });
      return { weights: weights, probs: probs, best: best, topj: topj,
               hit: VOCAB[best] === WORDS[i + 1] };
    }
    function tally() {
      var n = 0;
      for (var i = 0; i <= cur; i++) if (stepAt(i).hit) n++;
      return n;
    }

    var svg = S("svg", { viewBox: "0 0 760 440", width: "100%",
      role: "img", "aria-label": "causal mask stepper" }, f.body);

    function render() {
      while (svg.firstChild) svg.removeChild(svg.firstChild);
      var st = stepAt(cur), i, j;
      var cell = 26, gx = 112, gy = 106;

      T(svg, 8, 14, "generating left to right — position " + cur + " of " + LAST +
        ", predicting position " + (cur + 1), { anchor: "start", size: 11, fill: C.faint });
      T(svg, 752, 14, masked ? "mask on: the future is unreachable"
                             : "mask OFF: the future is readable",
        { anchor: "end", size: 10.5, fill: masked ? C.faint : C.orange });

      /* --- the sequence --- */
      var x = 8;
      for (i = 0; i < N; i++) {
        var cw = 14 + 7.2 * WORDS[i].length;
        var future = i > cur;
        var isTarget = i === cur + 1;
        rect(svg, x, 24, cw, 26, { rx: 5,
          fill: i === cur ? C.card : "none",
          stroke: i === cur ? C.orange : isTarget && !masked ? C.pink : C.line,
          sw: i === cur || (isTarget && !masked) ? 2 : 1,
          dash: future && masked ? "3 3" : "none",
          op: future && masked ? 0.45 : 1 });
        T(svg, x + cw / 2, 38, WORDS[i], { size: 12,
          fill: i === cur ? C.orange : isTarget && !masked ? C.pink : future && masked ? C.faint : C.dim });
        x += cw + 6;
      }
      if (!masked) T(svg, 8, 62, "the answer is sitting at position " + (cur + 1) +
        ", and nothing stops the head from reading it",
        { anchor: "start", size: 10, fill: C.pink });

      /* --- the mask matrix --- */
      T(svg, 8, 80, "mask: row = query, column = key", { anchor: "start", size: 11, fill: C.faint });
      for (i = 0; i < N; i++) {
        T(svg, gx + i * cell + cell / 2, gy - 10, String(i), { size: 9.5, fill: C.faint });
        T(svg, gx - 8, gy + i * cell + cell / 2, WORDS[i].slice(0, 9),
          { anchor: "end", size: 10.5, fill: i === cur ? C.orange : i > cur ? C.faint : C.dim });
        var row = i <= cur ? stepAt(i) : null;
        for (j = 0; j < N; j++) {
          var blocked = masked && j > i;
          var wt = row ? row.weights[j] : -1;
          var c = S("rect", { x: gx + j * cell, y: gy + i * cell,
            width: cell - 1.5, height: cell - 1.5, rx: 2,
            fill: blocked ? C.pink : wt >= 0 ? C.blue : C.line,
            opacity: blocked ? 0.14 : wt >= 0 ? 0.07 + 0.93 * wt : 0.07 }, svg);
          if (blocked) T(svg, gx + j * cell + (cell - 1.5) / 2, gy + i * cell + (cell - 1.5) / 2,
            "−∞", { size: 9, fill: C.pink });
          (function (qi, kj, weight, isBlocked) {
            tipOn(c, "query " + qi + " → key " + kj,
              isBlocked ? "masked to −∞, so the softmax gives it exactly 0"
                : weight >= 0 ? "weight " + weight.toFixed(4) : "not generated yet");
          })(i, j, wt, blocked);
        }
      }
      rect(svg, gx - 2, gy + cur * cell - 2, N * cell + 2, cell + 2,
        { rx: 3, stroke: C.orange, sw: 1.5 });

      /* --- what it predicts --- */
      T(svg, 392, 80, "next-token distribution", { anchor: "start", size: 11, fill: C.faint });
      var bx = 470, bw = 200;
      for (i = 0; i < VOCAB.length; i++) {
        var yy = gy + i * cell + cell / 2;
        var actual = VOCAB[i] === WORDS[cur + 1];
        T(svg, 392, yy, VOCAB[i], { anchor: "start", size: 10.5,
          fill: actual ? C.orange : C.dim });
        line(svg, bx, yy, bx + bw, yy, { stroke: C.line, sw: 0.6 });
        S("rect", { x: bx, y: yy - 8, width: Math.max(0.6, st.probs[i] * bw), height: 16, rx: 2,
          fill: actual ? C.orange : C.blue, opacity: 0.85 }, svg);
        T(svg, 752, yy, st.probs[i].toFixed(3),
          { anchor: "end", size: 10, fill: actual ? C.orange : C.text });
      }
      T(svg, 392, gy + VOCAB.length * cell + 14, "orange = the token that actually comes next",
        { anchor: "start", size: 10, fill: C.faint });

      /* --- the mechanism, in one line --- */
      line(svg, 8, 330, 752, 330, { stroke: C.line, sw: 1 });
      T(svg, 8, 350, "position " + cur + " puts " + st.weights[st.topj].toFixed(3) +
        " of its weight on position " + st.topj +
        (st.topj === cur + 1 ? "  — the answer" : ""),
        { anchor: "start", size: 11, fill: st.topj === cur + 1 ? C.pink : C.dim });
      T(svg, 8, 370, "predicts «" + VOCAB[st.best] + "» at p = " + st.probs[st.best].toFixed(3) +
        "     actual «" + WORDS[cur + 1] + "»     " + (st.hit ? "hit" : "miss"),
        { anchor: "start", size: 11, fill: st.hit ? C.pink : C.dim });
      T(svg, 752, 370, "a head trained without a mask · 32 dims, +6 at offset +1",
        { anchor: "end", size: 10, fill: C.faint });

      /* --- the tape so far --- */
      T(svg, 8, 398, "so far", { anchor: "start", size: 10, fill: C.faint });
      var tx = 62;
      for (i = 0; i <= cur; i++) {
        var s2 = stepAt(i), lab = VOCAB[s2.best], cw2 = 16 + 7.2 * lab.length;
        rect(svg, tx, 386, cw2, 22, { rx: 4, stroke: s2.hit ? C.pink : C.line, sw: 1 });
        T(svg, tx + cw2 / 2, 397, (s2.hit ? "✓ " : "✗ ") + lab,
          { size: 10, fill: s2.hit ? C.pink : C.faint });
        tx += cw2 + 6;
      }
      var got = tally();
      T(svg, 8, 428, (masked
        ? "Masked: " + got + "/" + (cur + 1) + " correct. Copying position i+1 was all this head learned."
        : "Unmasked: " + got + "/" + (cur + 1) + " correct. It is not predicting, it is reading position i+1."),
        { anchor: "start", size: 11, fill: masked ? C.dim : C.pink });
    }

    function go(d) {
      cur = Math.max(0, Math.min(LAST, cur + d));
      render();
      f.say("Position " + cur + ", predicting position " + (cur + 1) + ". " +
        (masked ? "Every score above the diagonal is −∞."
                : "Position " + (cur + 1) + " is readable, and the head is reading it."));
    }
    f.btn("◀ back", function () { go(-1); });
    f.btn("step ▶", function () { go(1); });
    f.btn("to end", function () { cur = LAST; render();
      f.say("Last position. Read the tally: " + tally() + " of " + (cur + 1) + " correct."); });

    var maskT = toggle(f.controls, "causal mask", true, function (v) {
      masked = v; render();
      f.say(v ? "Mask back on. Same head, same weights, and now it is worthless: the one thing it "
                + "learned was to copy position i+1, and that is exactly what the mask forbids."
              : "Mask off. Watch the weight jump to position i+1 and the prediction go to near 1.000. "
                + "The loss would look wonderful and the model cannot generate a single token.");
    });

    f.btn("reset", function () {
      cur = 0; masked = true; maskT.set(true); render();
      f.say("Step a generation. Then remove the mask and see the model cheat.");
    });

    render();
    f.say("Step a generation. Then remove the mask and see the model cheat.");
  };

  /* ========================================================================
     3. llmAttentionCost — CH 5 — Tuner

     Every number here is the section's own arithmetic: the score matrix is
     n x n per head, held in fp16, for every head and every sequence in the
     batch. The four rows of the chapter's table reproduce exactly, which is
     the point — the learner should be able to check the machine against the
     page before trusting it on settings the page does not cover.

     The discovery the text asks for: find the sequence length where the
     score matrices alone exceed 16 GB. At Corvid's shape that is n = 15,811,
     and 16,384 is the first power of two past it — twice the context the
     model is trained for, which is why Chapter 28 exists.
     ======================================================================== */
  VIZ.llmAttentionCost = function (el) {
    var f = frame(el);

    var FP16 = 2, DHEAD = 128, BUDGET = 16e9;     // bytes, and the course's 16 GB card
    var eN = 13, eD = 12, eB = 0;                 // log2 of n, d_model, batch

    function n()  { return 1 << eN; }
    function dm() { return 1 << eD; }
    function bs() { return 1 << eB; }
    function heads() { return dm() / DHEAD; }
    function scoresPerHead() { var v = n(); return v * v; }
    function bytes() { return scoresPerHead() * FP16 * heads() * bs(); }
    function flops() { return 4 * scoresPerHead() * dm() * bs(); }
    function crossingN() {                        // n where the scores fill the card
      return Math.sqrt(BUDGET / (FP16 * heads() * bs()));
    }

    function gb(b) { return b / 1e9; }
    function fmtBytes(b) {
      if (b >= 1e9) return (b / 1e9).toFixed(2) + " GB";
      if (b >= 1e6) return (b / 1e6).toFixed(1) + " MB";
      return (b / 1e3).toFixed(1) + " kB";
    }
    function commas(v) { return v.toLocaleString("en-US"); }
    function pct(b) {
      var p = b / BUDGET * 100;
      return p >= 1 ? p.toFixed(1) + "%" : p >= 0.01 ? p.toFixed(2) + "%" : "under 0.01%";
    }

    var svg = S("svg", { viewBox: "0 0 760 420", width: "100%",
      role: "img", "aria-label": "attention score-matrix cost against a 16 GB budget" }, f.body);

    /* log-log plot box */
    var PX0 = 74, PX1 = 462, PY0 = 60, PY1 = 300;
    var EMIN = 9, EMAX = 17;                      // n from 512 to 131,072
    var DECMIN = -3, DECMAX = 4;                  // GB from 0.001 to 10,000
    function px(e) { return PX0 + (e - EMIN) / (EMAX - EMIN) * (PX1 - PX0); }
    function py(g) {
      var d = Math.log(g) / Math.LN10;
      d = Math.max(DECMIN, Math.min(DECMAX, d));
      return PY1 - (d - DECMIN) / (DECMAX - DECMIN) * (PY1 - PY0);
    }

    function render() {
      while (svg.firstChild) svg.removeChild(svg.firstChild);
      var b = bytes(), over = b > BUDGET, i;

      T(svg, 8, 14, "score matrices only — no weights, no activations, no KV cache",
        { anchor: "start", size: 11, fill: C.faint });
      T(svg, 752, 14, "fp16, " + heads() + " heads of " + DHEAD + ", batch " + bs(),
        { anchor: "end", size: 10.5, fill: C.faint });

      /* --- axes --- */
      line(svg, PX0, PY1, PX1, PY1, { stroke: C.line, sw: 1.5 });
      line(svg, PX0, PY0, PX0, PY1, { stroke: C.line, sw: 1.5 });
      for (i = DECMIN; i <= DECMAX; i++) {
        var y = py(Math.pow(10, i));
        if (i > DECMIN) line(svg, PX0, y, PX1, y, { stroke: C.line, sw: 0.5, op: 0.4 });
        T(svg, PX0 - 8, y, i < 0 ? Math.pow(10, i).toFixed(-i) : commas(Math.pow(10, i)),
          { anchor: "end", size: 9, fill: C.faint });
      }
      T(svg, 20, PY0 - 14, "GB", { anchor: "start", size: 9.5, fill: C.faint });
      for (i = EMIN; i <= EMAX; i += 2) {
        T(svg, px(i), PY1 + 14, commas(1 << i), { size: 9, fill: C.faint });
      }
      T(svg, PX1, PY1 + 26, "sequence length n", { anchor: "end", size: 10, fill: C.faint });

      /* --- the 16 GB budget --- */
      var by = py(gb(BUDGET));
      line(svg, PX0, by, PX1, by, { stroke: C.orange, sw: 1.3, dash: "5 4" });
      T(svg, PX0 + 6, by - 9, "16 GB card", { anchor: "start", size: 9.5, fill: C.orange });

      /* --- the quadratic curve: slope 2 on log-log, by construction --- */
      var pts = [];
      for (i = EMIN; i <= EMAX; i += 0.25) {
        var nn = Math.pow(2, i);
        pts.push(px(i) + "," + py(gb(nn * nn * FP16 * heads() * bs())));
      }
      S("polyline", { points: pts.join(" "), fill: "none", stroke: C.blue, sw: 2,
        "stroke-width": 2 }, svg);

      /* --- where the curve crosses the card --- */
      var cx = crossingN(), ce = Math.log(cx) / Math.LN2;
      if (ce >= EMIN && ce <= EMAX) {
        line(svg, px(ce), by, px(ce), PY1 - 17, { stroke: C.orange, sw: 0.9, dash: "3 3" });
        T(svg, px(ce), PY1 - 8, "n = " + commas(Math.round(cx)),
          { size: 9.5, fill: C.orange });
      }

      /* --- the learner's current point --- */
      var cxp = px(eN), cyp = py(gb(b));
      S("circle", { cx: cxp, cy: cyp, r: 5.5, fill: over ? C.pink : C.blue }, svg);
      // Beside the point, never above it: above puts the label on the 16 GB
      // dashed line exactly when the reading matters most.
      // Put the label on the side away from the crossing rule, and away from the
      // right edge, so it never lies along a line the reader is trying to read.
      var ce2 = Math.log(crossingN()) / Math.LN2;
      var left = cxp > PX1 - 90 || (ce2 > eN && px(ce2) - cxp < 80);
      // Near the crossing the point sits on the budget rule, which is exactly when
      // the reading matters, so nudge the label clear of it.
      var ly = Math.abs(cyp - by) < 14 ? cyp + (cyp <= by ? -12 : 12) : cyp;
      T(svg, left ? cxp - 11 : cxp + 11, ly, fmtBytes(b),
        { size: 10.5, anchor: left ? "end" : "start", fill: over ? C.pink : C.blue });

      /* --- the numbers --- */
      var rx = 500, ry = 66, step = 25;
      function row(label, value, tone) {
        T(svg, rx, ry, label, { anchor: "start", size: 10.5, fill: C.faint });
        T(svg, 752, ry, value, { anchor: "end", size: 11, fill: tone || C.text });
        ry += step;
      }
      row("sequence length", commas(n()));
      row("d_model", commas(dm()));
      row("heads (d_model / " + DHEAD + ")", String(heads()));
      row("batch", String(bs()));
      ry += 6;
      line(svg, rx, ry - 16, 752, ry - 16, { stroke: C.line, sw: 0.8 });
      row("scores per head", commas(scoresPerHead()));
      row("one head, fp16", fmtBytes(scoresPerHead() * FP16));
      row("all " + heads() + " heads x batch", fmtBytes(b), over ? C.pink : C.text);
      row("attention FLOPs", (flops() / 1e12).toFixed(2) + " TFLOP");

      /* --- the verdict --- */
      line(svg, 8, 334, 752, 334, { stroke: C.line, sw: 1 });
      T(svg, 8, 354, over
          ? "Exceeds the 16 GB card by " + (b / BUDGET).toFixed(1) + "x — and that is before a single weight is loaded."
          : "Fits: " + fmtBytes(b) + " of 16 GB, which is " + pct(b) +
            " of the card spent on numbers nobody keeps.",
        { anchor: "start", size: 11, fill: over ? C.pink : C.dim });
      T(svg, 8, 376, "this shape crosses 16 GB at n = " + commas(Math.round(crossingN())) +
        "; the first power of two past it is " + commas(Math.pow(2, Math.ceil(Math.log(crossingN()) / Math.LN2))),
        { anchor: "start", size: 11, fill: C.orange });
      T(svg, 8, 402, "Note that number. Chapter 28 computes the same output without ever writing the matrix down.",
        { anchor: "start", size: 10.5, fill: C.faint });
      T(svg, 752, 402, "double n, quadruple both", { anchor: "end", size: 10, fill: C.faint });
    }

    var sN = slider(f.controls, "n", EMIN, EMAX, eN, 1,
      function (v) { return commas(1 << v); }, function (v) { eN = v; render(); say(); });
    var sD = slider(f.controls, "d_model", 10, 14, eD, 1,
      function (v) { return commas(1 << v); }, function (v) { eD = v; render(); say(); });
    var sB = slider(f.controls, "batch", 0, 5, eB, 1,
      function (v) { return String(1 << v); }, function (v) { eB = v; render(); say(); });

    function say() {
      var b = bytes();
      f.say(b > BUDGET
        ? "n = " + commas(n()) + ": " + fmtBytes(b) + " of score matrices, " +
          (b / BUDGET).toFixed(1) + "x a 16 GB card."
        : "n = " + commas(n()) + ": " + fmtBytes(b) + ", " + pct(b) + " of a 16 GB card.");
    }

    f.btn("Corvid at 8,192", function () {
      eN = 13; eD = 12; eB = 0; sN.set(13); sD.set(12); sB.set(0); render();
      f.say("Corvid's trained context: 4.29 GB of score matrices, a quarter of the card, " +
            "before the weights. This row is in the chapter's table.");
    });
    f.btn("reset", function () {
      eN = 13; eD = 12; eB = 0; sN.set(13); sD.set(12); sB.set(0); render();
      f.say("Drag n until the score matrices pass the 16 GB line. Note where that happens.");
    });

    render();
    f.say("Drag n until the score matrices pass the 16 GB line. Note where that happens.");
  };

  /* ========================================================================
     4. llmNextToken — CH 1 — Playground

     The distributions here are real and they were measured, not drawn. What
     they are not is live: no model runs in your browser, so the machine holds
     the readings for a fixed set of prompts and says so when you leave it.

     Corvid-8B is fictional, and a distribution cannot be derived from a
     configuration the way Chapter 5's costs can, so this shows a real 0.5B
     base model instead and names it on screen. A base model rather than an
     instruct one, because Chapter 1 is about next-token prediction and that
     is exactly what a base model does.

     The discovery: "The capital of France is" puts 0.316 on " Paris" and
     needs 37 tokens to cover 90% of the mass. Delete "of France" and the
     same weights need 866. That is a 23x change in how many futures are
     live, from deleting two words.
     ======================================================================== */
  VIZ.llmNextToken = function (el) {
    var f = frame(el);

    /* Measured Qwen/Qwen2.5-0.5B on an 8 GB M1, 2026-09-11. Real distributions, shipped with
       the page: there is no model running in your browser. */
    var MODEL = "Qwen/Qwen2.5-0.5B", VOCAB = 151936, MAXH = 11.9312;
    var DATA = [
      { q: "The capital of France is", H: 3.2579, n90: 37, tok: 5,
        top: [[" Paris",0.315602], [" ______",0.114601], [" ____",0.063536], [" __",0.055125], [":\n",0.051322], [" located",0.035857], [" the",0.028052], ["\n",0.024568], [" (",0.019713], [" .\n",0.01877], [":\n\n",0.018764], [":",0.01557]],
        at: [0.3156021535396576,0.018769532442092896,0.0003911969542969018,7.488376013498055e-06,1.2604672861016297e-07,1.7928548923240584e-10],
        curve: [[1,0.316],[2,0.115],[3,0.0635],[4,0.0551],[6,0.0359],[8,0.0246],[11,0.0188],[15,0.0109],[20,0.00769],[27,0.00345],[36,0.00196],[48,0.00112],[65,0.000748],[88,0.000453],[118,0.000309],[159,0.000147],[215,9.05e-05],[289,5.57e-05],[390,3.27e-05],[525,2.01e-05],[708,1.31e-05],[954,8.28e-06],[1285,4.84e-06],[1732,2.9e-06],[2334,1.81e-06],[3145,1.08e-06],[4238,6.47e-07],[5711,3.71e-07],[7696,2.11e-07],[10370,1.17e-07],[13974,6.36e-08],[18831,3.3e-08],[25375,1.63e-08],[34194,7.62e-09],[46078,3.34e-09],[62092,1.31e-09],[83671,4.3e-10],[112750,8.53e-11],[151935,4.3e-15]] },
      { q: "The capital is", H: 5.1501, n90: 866, tok: 3,
        top: [[" the",0.226412], [" located",0.115853], [" a",0.045004], [" divided",0.018255], [" in",0.016831], [" situated",0.015525], [" known",0.011739], [" also",0.010841], [" Lahore",0.009426], [" surrounded",0.009159], [" one",0.008336], [" an",0.007694]],
        at: [0.22641196846961975,0.009159380570054054,0.0010903241345658898,7.028609252301976e-05,1.043480210682901e-06,8.7800522408088e-10],
        curve: [[1,0.226],[2,0.116],[3,0.045],[4,0.0183],[6,0.0155],[8,0.0108],[11,0.00834],[15,0.00442],[20,0.00389],[27,0.00317],[36,0.00287],[48,0.0023],[65,0.00169],[88,0.0012],[118,0.000892],[159,0.000696],[215,0.000484],[289,0.00034],[390,0.000252],[525,0.00018],[708,0.000115],[954,7.67e-05],[1285,4.83e-05],[1732,3.01e-05],[2334,1.79e-05],[3145,1.06e-05],[4238,6.25e-06],[5711,3.52e-06],[7696,1.88e-06],[10370,9.46e-07],[13974,4.71e-07],[18831,2.18e-07],[25375,9.85e-08],[34194,4.3e-08],[46078,1.78e-08],[62092,6.63e-09],[83671,2.08e-09],[112750,4.3e-10],[151935,2.67e-14]] },
      { q: "The capital of", H: 4.6714, n90: 355, tok: 3,
        top: [[" Ber",0.186373], [" the",0.140428], [" a",0.067826], [" France",0.041633], [" Russia",0.033038], [" Brazil",0.018033], [" Canada",0.014085], [" India",0.012], [" Australia",0.009617], [" Japan",0.00935], [" Finland",0.008252], [" Poland",0.007974]],
        at: [0.18637333810329437,0.009349867701530457,0.0011699527967721224,3.5689936339622363e-05,6.022225420565519e-07,7.576075322646147e-10],
        curve: [[1,0.186],[2,0.14],[3,0.0678],[4,0.0416],[6,0.018],[8,0.012],[11,0.00825],[15,0.00659],[20,0.0054],[27,0.0039],[36,0.00293],[48,0.00241],[65,0.00183],[88,0.00139],[118,0.000905],[159,0.000629],[215,0.000433],[289,0.000274],[390,0.000167],[525,0.000101],[708,6.27e-05],[954,3.89e-05],[1285,2.48e-05],[1732,1.54e-05],[2334,9.23e-06],[3145,5.6e-06],[4238,3.39e-06],[5711,1.93e-06],[7696,1.09e-06],[10370,5.57e-07],[13974,2.76e-07],[18831,1.28e-07],[25375,5.7e-08],[34194,2.51e-08],[46078,1.06e-08],[62092,4.36e-09],[83671,1.57e-09],[112750,4.28e-10],[151935,4.37e-14]] },
      { q: "Once upon a", H: 0.257, n90: 1, tok: 3,
        top: [[" time",0.975269], [" Time",0.002652], [" midnight",0.001394], [" summer",0.000944], [" night",0.000592], [" rainy",0.000574], [" spring",0.000505], [" great",0.000464], [" day",0.000437], [" point",0.000398], [" winter",0.000397], [" beautiful",0.00039]],
        at: [0.9752694964408875,0.0003984857758041471,3.383825969649479e-05,1.604263502485992e-06,2.7761963394823397e-08,2.2032896340729025e-11],
        curve: [[1,0.975],[2,0.00265],[3,0.00139],[4,0.000944],[6,0.000574],[8,0.000464],[11,0.000397],[15,0.000289],[20,0.000211],[27,0.000139],[36,0.000123],[48,8.83e-05],[65,6.33e-05],[88,3.96e-05],[118,2.81e-05],[159,1.63e-05],[215,1.1e-05],[289,7.92e-06],[390,5.43e-06],[525,3.86e-06],[708,2.6e-06],[954,1.7e-06],[1285,1.12e-06],[1732,7.26e-07],[2334,4.67e-07],[3145,2.77e-07],[4238,1.63e-07],[5711,9.23e-08],[7696,4.93e-08],[10370,2.56e-08],[13974,1.28e-08],[18831,6.06e-09],[25375,2.75e-09],[34194,1.18e-09],[46078,4.81e-10],[62092,1.77e-10],[83671,5.39e-11],[112750,1.02e-11],[151935,1.93e-16]] },
      { q: "The quick brown fox jumps over the lazy", H: 0.8381, n90: 2, tok: 8,
        top: [[" dog",0.886938], ["\n",0.016173], [" dogs",0.010253], [" (",0.009005], [" brown",0.007478], [" __",0.005022], [" ____",0.003792], [" turtle",0.003455], [" green",0.002689], [" gray",0.00258], [" grey",0.002528], [" cat",0.002485]],
        at: [0.8869379758834839,0.0025795886758714914,6.894263788126409e-05,2.4205930913012708e-06,4.145562115809298e-08,4.662369448849013e-11],
        curve: [[1,0.887],[2,0.0162],[3,0.0103],[4,0.00901],[6,0.00502],[8,0.00345],[11,0.00253],[15,0.00202],[20,0.00115],[27,0.000583],[36,0.000355],[48,0.000205],[65,0.000137],[88,8.06e-05],[118,5.66e-05],[159,3.87e-05],[215,2.71e-05],[289,1.78e-05],[390,1.14e-05],[525,7.07e-06],[708,4.42e-06],[954,2.63e-06],[1285,1.6e-06],[1732,9.87e-07],[2334,6.03e-07],[3145,3.65e-07],[4238,2.18e-07],[5711,1.26e-07],[7696,7.2e-08],[10370,3.88e-08],[13974,2.06e-08],[18831,1.05e-08],[25375,5.19e-09],[34194,2.38e-09],[46078,1.02e-09],[62092,3.87e-10],[83671,1.17e-10],[112750,2.14e-11],[151935,2.97e-16]] },
      { q: "Monday, Tuesday, Wednesday,", H: 1.4798, n90: 3, tok: 6,
        top: [[" and",0.521502], [" Thursday",0.300462], [" Friday",0.102243], [" &",0.016369], [" Saturday",0.007193], [" April",0.005625], [" Thurs",0.005089], [" Wednesday",0.002577], [" ",0.002535], [" Sunday",0.00189], [" or",0.001498], [" etc",0.001337]],
        at: [0.5215016007423401,0.0018896183464676142,4.5390534069156274e-05,3.1711658721178537e-06,1.2620469647117716e-07,2.4597210379617707e-10],
        curve: [[1,0.522],[2,0.3],[3,0.102],[4,0.0164],[6,0.00562],[8,0.00258],[11,0.0015],[15,0.00093],[20,0.00054],[27,0.000286],[36,0.000164],[48,0.000112],[65,8.13e-05],[88,5.6e-05],[118,3.83e-05],[159,2.76e-05],[215,2.04e-05],[289,1.38e-05],[390,9.86e-06],[525,6.92e-06],[708,4.94e-06],[954,3.41e-06],[1285,2.38e-06],[1732,1.67e-06],[2334,1.15e-06],[3145,7.86e-07],[4238,5.19e-07],[5711,3.31e-07],[7696,2.06e-07],[10370,1.18e-07],[13974,6.13e-08],[18831,3.01e-08],[25375,1.39e-08],[34194,6.29e-09],[46078,2.83e-09],[62092,1.26e-09],[83671,4.92e-10],[112750,1.39e-10],[151935,6.52e-14]] },
      { q: "Attention is all you", H: 2.3623, n90: 13, tok: 4,
        top: [[" need",0.47797], [" have",0.135476], [" get",0.053875], [" hear",0.038189], [" want",0.037174], [" see",0.031387], [" can",0.027454], [" know",0.026693], [" ever",0.021041], [" got",0.018315], [" are",0.01784], [" really",0.011077]],
        at: [0.4779701828956604,0.0183151476085186,0.00014739346806891263,3.0450389658653876e-06,4.9016161796089364e-08,1.1057834509164977e-10],
        curve: [[1,0.478],[2,0.135],[3,0.0539],[4,0.0382],[6,0.0314],[8,0.0267],[11,0.0178],[15,0.00454],[20,0.00289],[27,0.00139],[36,0.000823],[48,0.0005],[65,0.000318],[88,0.000188],[118,0.00011],[159,7.19e-05],[215,4.42e-05],[289,2.44e-05],[390,1.47e-05],[525,9.16e-06],[708,5.38e-06],[954,3.29e-06],[1285,2.02e-06],[1732,1.19e-06],[2334,7.4e-07],[3145,4.33e-07],[4238,2.53e-07],[5711,1.46e-07],[7696,8.21e-08],[10370,4.56e-08],[13974,2.52e-08],[18831,1.37e-08],[25375,7.13e-09],[34194,3.56e-09],[46078,1.66e-09],[62092,7.05e-10],[83671,2.49e-10],[112750,5.55e-11],[151935,6.97e-15]] },
      { q: "The largest planet in our solar system is", H: 4.4723, n90: 117, tok: 8,
        top: [[" __",0.099604], [" Jupiter",0.074925], [" the",0.063262], [" ____",0.042163], [" ______",0.038408], ["\n",0.035084], [" _____",0.032686], [" a",0.026315], [" known",0.025771], [" called",0.023196], [" approximately",0.023093], [" not",0.018675]],
        at: [0.09960374981164932,0.023195752874016762,0.0009316294454038143,1.2357170817267615e-05,1.3574893387158227e-07,9.261038463881377e-11],
        curve: [[1,0.0996],[2,0.0749],[3,0.0633],[4,0.0422],[6,0.0351],[8,0.0263],[11,0.0231],[15,0.0148],[20,0.0116],[27,0.00896],[36,0.00589],[48,0.00352],[65,0.00183],[88,0.00104],[118,0.000703],[159,0.00046],[215,0.000261],[289,0.000138],[390,7.67e-05],[525,4.14e-05],[708,2.53e-05],[954,1.35e-05],[1285,7.88e-06],[1732,4.54e-06],[2334,2.73e-06],[3145,1.54e-06],[4238,8.4e-07],[5711,4.54e-07],[7696,2.43e-07],[10370,1.24e-07],[13974,6.21e-08],[18831,2.99e-08],[25375,1.36e-08],[34194,5.94e-09],[46078,2.42e-09],[62092,8.63e-10],[83671,2.44e-10],[112750,3.9e-11],[151935,9.65e-16]] },
      { q: "import numpy as", H: 0.0343, n90: 1, tok: 3,
        top: [[" np",0.99671], [" n",0.00056], [" nm",0.000413], [" numpy",0.0003], [" num",0.000242], [" N",0.000217], [" ",0.000172], [" _",0.000166], [" py",0.000111], [" NP",6.2e-05], [" on",6e-05], [" m",4.1e-05]],
        at: [0.9967097043991089,6.205820682225749e-05,1.7053534975275397e-06,3.7040937428400866e-08,4.243221884969728e-10,6.055063677019856e-13],
        curve: [[1,0.997],[2,0.00056],[3,0.000413],[4,0.0003],[6,0.000217],[8,0.000166],[11,6.01e-05],[15,3.58e-05],[20,2.07e-05],[27,1.51e-05],[36,1.04e-05],[48,5.51e-06],[65,3.21e-06],[88,2.01e-06],[118,1.42e-06],[159,8.07e-07],[215,5.07e-07],[289,2.93e-07],[390,1.78e-07],[525,1.12e-07],[708,6.64e-08],[954,4e-08],[1285,2.28e-08],[1732,1.37e-08],[2334,7.86e-09],[3145,4.39e-09],[4238,2.47e-09],[5711,1.37e-09],[7696,7.31e-10],[10370,3.93e-10],[13974,2.1e-10],[18831,1.08e-10],[25375,5.43e-11],[34194,2.59e-11],[46078,1.15e-11],[62092,4.59e-12],[83671,1.47e-12],[112750,2.82e-13],[151935,1.73e-17]] },
      { q: "She opened the door and", H: 4.4469, n90: 134, tok: 5,
        top: [[" saw",0.17736], [" looked",0.058872], [" let",0.03893], [" walked",0.037116], [" stepped",0.032964], [" found",0.032472], [" ______",0.028616], [" I",0.027132], [" the",0.02642], [" there",0.024849], [" stood",0.020385], [" said",0.017066]],
        at: [0.1773596554994583,0.02484918013215065,0.0010655832011252642,1.633200008654967e-05,2.4419065880465496e-07,3.5127939446155665e-10],
        curve: [[1,0.177],[2,0.0589],[3,0.0389],[4,0.0371],[6,0.0325],[8,0.0271],[11,0.0204],[15,0.0141],[20,0.0126],[27,0.00632],[36,0.0043],[48,0.00296],[65,0.00192],[88,0.00125],[118,0.000763],[159,0.000419],[215,0.000252],[289,0.000155],[390,9.29e-05],[525,5.3e-05],[708,3.22e-05],[954,1.77e-05],[1285,1.08e-05],[1732,6.38e-06],[2334,3.81e-06],[3145,2.24e-06],[4238,1.26e-06],[5711,7.31e-07],[7696,4.14e-07],[10370,2.27e-07],[13974,1.22e-07],[18831,6.3e-08],[25375,3.12e-08],[34194,1.49e-08],[46078,6.56e-09],[62092,2.58e-09],[83671,8.33e-10],[112750,1.69e-10],[151935,4.34e-15]] },
      { q: "I think the best thing about", H: 6.3812, n90: 3973, tok: 6,
        top: [[" the",0.118802], [" this",0.104302], [" a",0.030333], [" my",0.027681], [" being",0.025501], [" having",0.013549], [" it",0.011979], [" learning",0.011922], [" working",0.010799], [" using",0.009844], [" our",0.009409], [" going",0.008982]],
        at: [0.11880157887935638,0.009844080545008183,0.0008342074579559267,9.238996426574886e-05,5.47474382983637e-06,3.537192982960846e-09],
        curve: [[1,0.119],[2,0.104],[3,0.0303],[4,0.0277],[6,0.0135],[8,0.0119],[11,0.00941],[15,0.0067],[20,0.0045],[27,0.00363],[36,0.00262],[48,0.0017],[65,0.00119],[88,0.000932],[118,0.000738],[159,0.000585],[215,0.000428],[289,0.000331],[390,0.00024],[525,0.000182],[708,0.00013],[954,9.61e-05],[1285,7.15e-05],[1732,5.21e-05],[2334,3.77e-05],[3145,2.67e-05],[4238,1.85e-05],[5711,1.25e-05],[7696,8.22e-06],[10370,5.14e-06],[13974,2.97e-06],[18831,1.47e-06],[25375,5.6e-07],[34194,1.45e-07],[46078,4.37e-08],[62092,1.74e-08],[83671,6.91e-09],[112750,2.04e-09],[151935,1.02e-12]] },
      { q: "The three primary colours are red, blue and", H: 1.6653, n90: 7, tok: 9,
        top: [[" yellow",0.542863], [" green",0.261315], [" __",0.033421], [" (",0.026621], [" white",0.016966], [" what",0.014938], ["\n",0.013061], [" cyan",0.011127], [" orange",0.005635], [" ___",0.005611], [" ____",0.005424], [" _____",0.005201]],
        at: [0.5428628921508789,0.00561147928237915,5.579982462222688e-05,7.76239119204547e-07,7.453671457824385e-09,6.164727582580465e-12],
        curve: [[1,0.543],[2,0.261],[3,0.0334],[4,0.0266],[6,0.0149],[8,0.0111],[11,0.00542],[15,0.00349],[20,0.00115],[27,0.000859],[36,0.000694],[48,0.000322],[65,0.000174],[88,6.72e-05],[118,4.38e-05],[159,2.55e-05],[215,1.41e-05],[289,7.68e-06],[390,4.46e-06],[525,2.57e-06],[708,1.43e-06],[954,8.33e-07],[1285,4.87e-07],[1732,2.79e-07],[2334,1.56e-07],[3145,8.51e-08],[4238,4.77e-08],[5711,2.53e-08],[7696,1.33e-08],[10370,6.89e-09],[13974,3.45e-09],[18831,1.68e-09],[25375,7.79e-10],[34194,3.44e-10],[46078,1.43e-10],[62092,5.31e-11],[83671,1.56e-11],[112750,2.77e-12],[151935,5.86e-17]] },
      { q: "A language model predicts the next", H: 1.1464, n90: 5, tok: 6,
        top: [[" word",0.798302], [" letter",0.039076], [" sentence",0.036296], [" character",0.01944], [" words",0.013023], [" ",0.012098], [" two",0.007165], [" number",0.00646], [" three",0.0062], [" few",0.00515], [" action",0.004373], [" utter",0.004363]],
        at: [0.7983022332191467,0.005149770062416792,5.6359069276368245e-05,5.959042823633354e-07,4.14946699223151e-09,3.1229784383524084e-12],
        curve: [[1,0.798],[2,0.0391],[3,0.0363],[4,0.0194],[6,0.0121],[8,0.00646],[11,0.00437],[15,0.0027],[20,0.00184],[27,0.000751],[36,0.000432],[48,0.000261],[65,0.000135],[88,7.52e-05],[118,3.79e-05],[159,2.1e-05],[215,1.23e-05],[289,6.76e-06],[390,3.62e-06],[525,2.24e-06],[708,1.25e-06],[954,6.52e-07],[1285,3.67e-07],[1732,2.07e-07],[2334,1.12e-07],[3145,5.9e-08],[4238,3.04e-08],[5711,1.61e-08],[7696,7.95e-09],[10370,3.79e-09],[13974,1.78e-09],[18831,8.22e-10],[25375,3.72e-10],[34194,1.63e-10],[46078,6.76e-11],[62092,2.53e-11],[83671,7.72e-12],[112750,1.44e-12],[151935,1.06e-16]] },
      { q: "To be or not to", H: 0.1851, n90: 1, tok: 5,
        top: [[" be",0.983188], ["-be",0.000987], [" Be",0.00093], [" ",0.000771], ["-",0.000593], [" bee",0.000459], ["...",0.000398], [" to",0.000384], [" ",0.000383], [" go",0.00027], [" bat",0.000252], ["...\n\n",0.000246]],
        at: [0.9831883311271667,0.0002697708550840616,2.3964130377862602e-05,1.1711266552083544e-06,2.2559722978598984e-08,4.1618455209890826e-11],
        curve: [[1,0.983],[2,0.000987],[3,0.00093],[4,0.000771],[6,0.000459],[8,0.000384],[11,0.000252],[15,0.000164],[20,0.000132],[27,9.74e-05],[36,7.66e-05],[48,6e-05],[65,4.36e-05],[88,2.95e-05],[118,1.94e-05],[159,1.28e-05],[215,8.93e-06],[289,6.52e-06],[390,4.22e-06],[525,2.79e-06],[708,1.86e-06],[954,1.25e-06],[1285,8.11e-07],[1732,5.18e-07],[2334,3.27e-07],[3145,1.98e-07],[4238,1.16e-07],[5711,6.67e-08],[7696,3.74e-08],[10370,2.1e-08],[13974,1.15e-08],[18831,6.02e-09],[25375,3.03e-09],[34194,1.46e-09],[46078,6.44e-10],[62092,2.59e-10],[83671,9.08e-11],[112750,2.15e-11],[151935,4.1e-15]] },
    ];

    var idx = 0, prev = null, full = false, unknown = "";

    function norm(s) { return s.replace(/\s+/g, " ").trim().toLowerCase(); }
    function find(s) {
      var n = norm(s);
      for (var i = 0; i < DATA.length; i++) if (norm(DATA[i].q) === n) return i;
      return -1;
    }
    /* Tokens carry leading spaces and newlines that would otherwise vanish. */
    function show(t) {
      return t.replace(/ /g, "·").replace(/\n/g, "⏎").replace(/\t/g, "⇥");
    }
    function sig(v) {
      if (v >= 0.001) return v.toFixed(3);
      if (v === 0) return "0";
      var e = Math.floor(Math.log(v) / Math.LN10);
      return (v / Math.pow(10, e)).toFixed(1) + "e" + e;
    }

    var svg = S("svg", { viewBox: "0 0 760 430", width: "100%",
      role: "img", "aria-label": "measured next-token distribution" }, f.body);

    function render() {
      while (svg.firstChild) svg.removeChild(svg.firstChild);
      var d = DATA[idx], i;

      T(svg, 8, 14, "one prompt in, " + VOCAB.toLocaleString("en-US") +
        " probabilities out", { anchor: "start", size: 11, fill: C.faint });
      T(svg, 752, 14, "measured on " + MODEL + " — not running live",
        { anchor: "end", size: 10, fill: C.faint });

      /* --- the prompt --- */
      rect(svg, 8, 24, 744, 30, { rx: 6, stroke: unknown ? C.pink : C.line, sw: 1.2 });
      T(svg, 18, 39, (unknown || d.q).replace(/\n/g, "⏎"),
        { anchor: "start", size: 12, fill: unknown ? C.faint : C.text });
      if (unknown) {
        T(svg, 744, 39, "not measured", { anchor: "end", size: 10, fill: C.pink });
        T(svg, 8, 70, "No reading was shipped for that prompt. The panel below is the last one that was.",
          { anchor: "start", size: 10.5, fill: C.pink });
      } else {
        T(svg, 744, 39, d.tok + " tokens", { anchor: "end", size: 10, fill: C.faint });
      }

      if (!full) {
        /* --- top ten, as bars --- */
        T(svg, 8, 92, "top 10 of " + VOCAB.toLocaleString("en-US"),
          { anchor: "start", size: 11, fill: C.faint });
        var bx = 150, bw = 300, y0 = 110, rh = 25;
        for (i = 0; i < 10; i++) {
          var yy = y0 + i * rh, tk = d.top[i];
          T(svg, 8, yy, String(i + 1), { anchor: "start", size: 9.5, fill: C.faint });
          T(svg, 142, yy, show(tk[0]), { anchor: "end", size: 11,
            fill: i === 0 ? C.blue : C.dim });
          line(svg, bx, yy, bx + bw, yy, { stroke: C.line, sw: 0.6 });
          S("rect", { x: bx, y: yy - 8, width: Math.max(0.8, tk[1] * bw), height: 16, rx: 2,
            fill: C.blue, opacity: i === 0 ? 0.9 : 0.5 }, svg);
          T(svg, bx + bw + 44, yy, tk[1].toFixed(3), { anchor: "end", size: 10.5,
            fill: i === 0 ? C.blue : C.text });
        }
        T(svg, 8, y0 + 10 * rh + 2,
          "everything else — " + (VOCAB - 10).toLocaleString("en-US") +
          " tokens — shares the remaining " +
          (1 - d.top.slice(0, 10).reduce(function (a, t) { return a + t[1]; }, 0)).toFixed(3),
          { anchor: "start", size: 10, fill: C.faint });
      } else {
        /* --- the whole vocabulary, sorted, log-log --- */
        var PX0 = 60, PX1 = 470, PY0 = 100, PY1 = 350;
        var RMAX = Math.log(VOCAB) / Math.LN10, PMIN = -12;
        function rx2(r) { return PX0 + Math.log(r) / Math.LN10 / RMAX * (PX1 - PX0); }
        function ry2(v) {
          var e = Math.max(PMIN, Math.log(Math.max(v, 1e-300)) / Math.LN10);
          return PY1 - (e - PMIN) / (0 - PMIN) * (PY1 - PY0);
        }
        T(svg, 8, 92, "every token, sorted by probability — both axes log",
          { anchor: "start", size: 11, fill: C.faint });
        line(svg, PX0, PY1, PX1, PY1, { stroke: C.line, sw: 1.5 });
        line(svg, PX0, PY0, PX0, PY1, { stroke: C.line, sw: 1.5 });
        for (i = 0; i >= PMIN; i -= 3) {
          var gy2 = ry2(Math.pow(10, i));
          if (i < 0) line(svg, PX0, gy2, PX1, gy2, { stroke: C.line, sw: 0.5, op: 0.4 });
          T(svg, PX0 - 8, gy2, i === 0 ? "1" : "1e" + i, { anchor: "end", size: 9, fill: C.faint });
        }
        [1, 10, 100, 1000, 10000, 100000].forEach(function (r) {
          T(svg, rx2(r), PY1 + 14, r >= 1000 ? (r / 1000) + "k" : String(r),
            { size: 9, fill: C.faint });
        });
        T(svg, PX1, PY1 + 32, "rank", { anchor: "end", size: 10, fill: C.faint });
        var pts = d.curve.map(function (c) { return rx2(c[0]) + "," + ry2(c[1]); });
        S("polyline", { points: pts.join(" "), fill: "none", stroke: C.blue,
          "stroke-width": 2 }, svg);
        // the 90% nucleus, drawn where it falls on the curve
        line(svg, rx2(d.n90), PY0, rx2(d.n90), PY1, { stroke: C.orange, sw: 1, dash: "4 3" });
        T(svg, rx2(d.n90) + 6, PY0 + 12, d.n90.toLocaleString("en-US") + " cover 90%",
          { anchor: "start", size: 10, fill: C.orange });
        T(svg, PX0 + 4, PY1 - 8, "rank 1,000 is already in the millionths",
          { anchor: "start", size: 9.5, fill: C.faint });
      }

      /* --- the readout --- */
      var rx = 508, ry = 96, stp = 24;
      function row(label, value, tone) {
        T(svg, rx, ry, label, { anchor: "start", size: 10.5, fill: C.faint });
        T(svg, 752, ry, value, { anchor: "end", size: 11, fill: tone || C.text });
        ry += stp;
      }
      row("top token", show(d.top[0][0]), C.blue);
      row("its probability", d.top[0][1].toFixed(3), C.blue);
      ry += 4;
      row("entropy", d.H.toFixed(3) + " nats");
      row("of a possible", MAXH.toFixed(2) + " nats");
      row("tokens to cover 90%", d.n90.toLocaleString("en-US"), C.orange);
      ry += 4;
      line(svg, rx, ry - 14, 752, ry - 14, { stroke: C.line, sw: 0.8 });
      ["1", "10", "100", "1,000", "10,000", "100,000"].forEach(function (lab, i) {
        row("p at rank " + lab, sig(d.at[i]));
      });

      /* --- the comparison, which is the whole point --- */
      line(svg, 8, 372, 752, 372, { stroke: C.line, sw: 1 });
      if (prev !== null && prev !== idx) {      // 0 is a valid index, so test against null
        var a = DATA[prev], b = d;
        T(svg, 8, 392, "was «" + a.q + "»: entropy " + a.H.toFixed(2) + ", " +
          a.n90.toLocaleString("en-US") + " tokens covered 90%",
          { anchor: "start", size: 10.5, fill: C.faint });
        var mult = b.n90 / a.n90;
        T(svg, 8, 412, "now: entropy " + b.H.toFixed(2) + ", " +
          b.n90.toLocaleString("en-US") + " tokens — " +
          (mult >= 1 ? mult.toFixed(1) + "x wider" : (1 / mult).toFixed(1) + "x narrower") +
          ". Same weights, different context.",
          { anchor: "start", size: 11, fill: C.orange });
      } else {
        T(svg, 8, 392, "Pick another prompt, or edit this one. The readout below the fold " +
          "compares it with the last.", { anchor: "start", size: 10.5, fill: C.faint });
        T(svg, 8, 412, "Nothing here is looked up. These are the tokens the weights make probable.",
          { anchor: "start", size: 10.5, fill: C.faint });
      }
    }

    /* ---- controls ------------------------------------------------------ */
    var sel = document.createElement("select");
    sel.setAttribute("aria-label", "prompt");
    sel.style.cssText = "font:12px ui-monospace,Menlo,monospace;padding:4px 6px;max-width:290px;" +
      "background:var(--bg-2);color:var(--text);border:1px solid var(--line);border-radius:6px";
    DATA.forEach(function (d, i) {
      var o = document.createElement("option");
      o.value = i; o.textContent = d.q.replace(/\n/g, "⏎");
      sel.appendChild(o);
    });
    var input = document.createElement("input");
    input.type = "text"; input.value = DATA[0].q;
    input.setAttribute("aria-label", "edit the prompt");
    input.style.cssText = "font:12px ui-monospace,Menlo,monospace;padding:4px 6px;min-width:230px;" +
      "background:var(--bg-2);color:var(--text);border:1px solid var(--line);border-radius:6px";

    function pick(i, msg) {
      prev = idx; idx = i; unknown = "";
      input.value = DATA[i].q; sel.value = String(i);
      render();
      f.say(msg || ("«" + DATA[i].q + "» — top token " + show(DATA[i].top[0][0]) +
        " at " + DATA[i].top[0][1].toFixed(3) + ", " + DATA[i].n90.toLocaleString("en-US") +
        " tokens to cover 90% of the mass."));
    }
    sel.addEventListener("change", function () { pick(+sel.value); });
    f.controls.appendChild(sel);
    f.controls.appendChild(input);

    function apply() {
      var i = find(input.value);
      if (i < 0) {
        unknown = input.value; render();
        f.say("No measurement shipped for that prompt. Nothing is running live here: " +
              "the page carries readings for " + DATA.length +
              " prompts, and the list beside the box has all of them.");
      } else { pick(i); }
    }
    input.addEventListener("keydown", function (e) {
      if (e.key === "Enter") { e.preventDefault(); apply(); }
    });
    f.btn("read it", apply);

    toggle(f.controls, "full vocabulary", false, function (v) {
      full = v; render();
      f.say(v ? "All " + VOCAB.toLocaleString("en-US") + " tokens, sorted, on log axes. " +
                "The orange line is where 90% of the probability has been spent."
              : "Back to the top ten.");
    });

    f.btn("reset", function () {
      prev = null; unknown = ""; full = false;
      idx = 0; input.value = DATA[0].q; sel.value = "0";
      render();
      f.say("Edit the prompt. Watch which tokens the model thinks could come next, and how sure it is.");
    });

    render();
    f.say("Edit the prompt. Watch which tokens the model thinks could come next, and how sure it is.");
  };

  /* ========================================================================
     5. llmCourseMap — CH 1 — Inspector

     Three lanes, one per machine, five stages each. Colour is the Part that
     owns a stage, so before anything is clicked the reader can see that the
     same orange box sits in the middle of all three lanes: the block of
     Chapters 5 to 11 is the same block whether it is being trained or served.
     That is the section's claim, drawn.

     The blueprint's discovery is the arrows. Pretraining and post-training
     run the block forwards and then backwards, at 6N FLOPs per token;
     inference runs it forwards only, at 2N. Part III and Part V are the same
     machine in two directions, and the third of the cost that the backward
     pass does not spend is the whole reason serving is a different job.

     N = 8.03e9 for Corvid-8B, so every FLOP figure here is 2N or 6N and
     checkable by hand, which is what Chapter 9 asks the reader to do.
     ======================================================================== */
  VIZ.llmCourseMap = function (el) {
    var f = frame(el);

    var N = 8.03e9;
    var FWD = 2 * N / 1e9, TRAIN = 6 * N / 1e9;      // GFLOP per token

    var PART = {
      1: { name: "Part I — What a Language Model Is", col: "sky", ch: "1–4" },
      2: { name: "Part II — Inside the Block", col: "orange", ch: "5–11" },
      3: { name: "Part III — Making a Model", col: "teal", ch: "12–17" },
      4: { name: "Part IV — Making It Useful", col: "purple", ch: "18–25" },
      5: { name: "Part V — Making It Fast, Correct and Safe", col: "green", ch: "26–34" },
      6: { name: "Part VI — Build It: PocketLM", col: "pink", ch: "35–41" }
    };

    var LANES = [
      { name: "Pretraining", cost: TRAIN, dir: "both", build: 37,
        sub: "where the parameters come from",
        stages: [
          { t: "corpus", p: 3, ch: "12", d: "Trillions of tokens, filtered, deduplicated and decontaminated. The part nobody photographs." },
          { t: "tokenizer", p: 1, ch: "2–3", d: "Text becomes token ids. Every cost in this course is counted in these, not in words." },
          { t: "the block", p: 2, ch: "5–11", d: "Attention, the feed-forward, the residual stream. The same block in all three lanes." },
          { t: "training loop", p: 3, ch: "13–14", d: "Predict the next token, measure the loss, step the optimizer. Millions of dollars, months of GPU time." },
          { t: "scale & hardware", p: 3, ch: "15–17", d: "How big, how long, on what silicon, split across how many. The arithmetic behind the other four boxes." }
        ] },
      { name: "Post-training", cost: TRAIN, dir: "both", build: 40,
        sub: "where a text continuer becomes an assistant",
        stages: [
          { t: "instruction data", p: 4, ch: "20", d: "Thousands of examples of the behaviour you want, with the loss mask that makes it supervised." },
          { t: "chat template", p: 1, ch: "3", d: "The turn structure a model was tuned on. Get it wrong and the model answers a question you did not ask." },
          { t: "the block", p: 2, ch: "5–11", d: "Unchanged. Post-training moves the weights, not the architecture." },
          { t: "SFT + LoRA", p: 4, ch: "20–21", d: "Fine-tune the whole thing, or a low-rank update of it on one GPU. Thousands of dollars, not millions." },
          { t: "preferences", p: 4, ch: "22–23", d: "Pairs of responses and which one a human preferred, learned as a signal examples cannot express." }
        ] },
      { name: "Inference", cost: FWD, dir: "fwd", build: 41,
        sub: "where the model earns or loses money",
        stages: [
          { t: "tokenizer", p: 1, ch: "2–3", d: "The same tokenizer, now on the critical path of every request." },
          { t: "the block", p: 2, ch: "5–11", d: "The same block again, run forwards only. No backward pass, so a third of the arithmetic disappears." },
          { t: "KV cache", p: 5, ch: "26", d: "Keep every key and value so each new token reads the past instead of recomputing it." },
          { t: "batching", p: 5, ch: "27", d: "How many requests share one pass. The lever that decides your bill." },
          { t: "sampling", p: 4, ch: "18", d: "Turn the distribution into one token, over and over. Chapter 1's loop, closed." }
        ] }
    ];

    var sel = { lane: 2, st: 1 };                    // the block, in the inference lane

    var svg = S("svg", { viewBox: "0 0 760 430", width: "100%",
      role: "img", "aria-label": "the three machines and the six parts" }, f.body);

    var BX = 112, BW = 118, BGAP = 10, BH = 44;
    function bx(i) { return BX + i * (BW + BGAP); }
    function laneY(l) { return 36 + l * 68; }

    function render() {
      while (svg.firstChild) svg.removeChild(svg.firstChild);
      var cur = LANES[sel.lane].stages[sel.st], l, i;

      T(svg, 8, 14, "three machines, one architecture", { anchor: "start", size: 11, fill: C.faint });
      T(svg, 752, 14, "colour = the Part that owns the stage",
        { anchor: "end", size: 10, fill: C.faint });

      for (l = 0; l < LANES.length; l++) {
        var L = LANES[l], y = laneY(l);
        T(svg, 8, y + 14, L.name, { anchor: "start", size: 11,
          fill: l === sel.lane ? C.text : C.dim });
        T(svg, 8, y + 30, L.cost.toFixed(1) + " GFLOP/tok",
          { anchor: "start", size: 9, fill: C.faint });

        for (i = 0; i < L.stages.length; i++) {
          var st = L.stages[i], on = (l === sel.lane && i === sel.st);
          var same = st.p === cur.p;
          var col = C[PART[st.p].col];
          var box = rect(svg, bx(i), y, BW, BH, { rx: 6, fill: col,
            stroke: on ? C.text : col, sw: on ? 2 : 1,
            op: on ? 0.34 : same ? 0.22 : 0.09 });
          T(svg, bx(i) + BW / 2, y + 18, st.t, { size: 10.5,
            fill: same ? C.text : C.dim });
          T(svg, bx(i) + BW / 2, y + 33, "ch " + st.ch, { size: 9, fill: C.faint });
          if (i < L.stages.length - 1) {
            line(svg, bx(i) + BW + 1, y + BH / 2, bx(i + 1) - 2, y + BH / 2,
              { stroke: C.faint, sw: 1 });
          }
          (function (li, si, stage) {
            box.style.cursor = "pointer";
            box.addEventListener("click", function () { sel = { lane: li, st: si }; render(); note(); });
            tipOn(box, stage.t, PART[stage.p].name + " &middot; chapters " + stage.ch +
              "<br>" + stage.d);
          })(l, i, st);
        }

        /* the direction of the pass: this is the blueprint's discovery */
        var y2 = y + BH + 9;
        if (L.dir === "both") {
          line(svg, bx(4) + BW, y2 + 4, bx(0), y2 + 4, { stroke: C.teal, sw: 1, dash: "4 3" });
          T(svg, bx(2) + BW / 2, y2 - 4, "backward pass — 4N more",
            { size: 9, fill: C.teal });
        } else {
          T(svg, bx(2) + BW / 2, y2 - 1, "forward only — no backward pass",
            { size: 9, fill: C.green });
        }
      }

      /* --- the stage detail --- */
      line(svg, 8, 252, 752, 252, { stroke: C.line, sw: 1 });
      var P = PART[cur.p];
      T(svg, 8, 274, cur.t, { anchor: "start", size: 14, fill: C[P.col], weight: 600 });
      T(svg, 752, 274, P.name, { anchor: "end", size: 11, fill: C[P.col] });
      T(svg, 8, 298, cur.d, { anchor: "start", size: 11, fill: C.dim });
      T(svg, 8, 320, "opened in chapters " + cur.ch + "   ·   this Part runs " + P.ch +
        "   ·   built yourself in Chapter " + LANES[sel.lane].build,
        { anchor: "start", size: 10.5, fill: C.faint });

      /* --- how many lanes share this Part --- */
      var lanes = [];
      LANES.forEach(function (L2, li) {
        if (L2.stages.some(function (s2) { return s2.p === cur.p; })) lanes.push(L2.name);
      });
      T(svg, 8, 348, lanes.length === 3
          ? "This Part appears in all three lanes: " + lanes.join(", ") + "."
          : "Appears in: " + lanes.join(", ") + ".",
        { anchor: "start", size: 11, fill: lanes.length === 3 ? C.orange : C.dim });

      /* --- the cost contrast --- */
      line(svg, 8, 364, 752, 364, { stroke: C.line, sw: 0.8 });
      T(svg, 8, 384, "Corvid-8B, N = 8.03 billion parameters:", { anchor: "start", size: 10.5, fill: C.faint });
      T(svg, 8, 404, "training a token costs 6N = " + TRAIN.toFixed(1) +
        " GFLOP; serving one costs 2N = " + FWD.toFixed(1) + " GFLOP, exactly a third.",
        { anchor: "start", size: 11, fill: C.dim });
      T(svg, 8, 422, "What separates pretraining from post-training is not that cost. " +
        "It is 15 trillion tokens against a few million.",
        { anchor: "start", size: 10.5, fill: C.faint });
    }

    function note() {
      var cur = LANES[sel.lane].stages[sel.st];
      f.say("«" + cur.t + "» in " + LANES[sel.lane].name + " — " + PART[cur.p].name +
        ", chapters " + cur.ch + ".");
    }
    function walk(d) {
      var flat = [], l, i;
      for (l = 0; l < LANES.length; l++)
        for (i = 0; i < LANES[l].stages.length; i++) flat.push({ lane: l, st: i });
      var at = 0;
      flat.forEach(function (o, k) { if (o.lane === sel.lane && o.st === sel.st) at = k; });
      sel = flat[(at + d + flat.length) % flat.length];
      render(); note();
    }
    f.btn("◀ stage", function () { walk(-1); });
    f.btn("stage ▶", function () { walk(1); });
    f.btn("the block", function () {
      sel = { lane: 0, st: 2 }; render();
      f.say("The block, in the pretraining lane. Step through the lanes and it is the same box: " +
            "Chapters 5 to 11 are what a training run and a served request have in common.");
    });
    f.btn("reset", function () {
      sel = { lane: 2, st: 1 }; render();
      f.say("Hover a stage to see which chapters open it.");
    });

    render();
    f.say("Hover a stage to see which chapters open it.");
  };

  /* ========================================================================
     6. llmBpeTrainer — CH 2 — Builder

     Byte-pair encoding, trained live in the page. Nothing here is canned: the
     four lines the section states are the four lines below, and on the
     chapter's corpus the first twelve merges it produces are the twelve the
     chapter prints, counts included. That is the check to run before trusting
     it on a corpus you paste in.

     Ties are broken by first appearance while scanning the corpus, which is
     what makes merges 6 through 12 come out in the chapter's order: seven
     pairs all occur three times, and the order is the order they were seen.
     ======================================================================== */
  VIZ.llmBpeTrainer = function (el) {
    var f = frame(el);

    var EOW = "</w>";
    var DEFAULT = "the lower newer wider tower flower power lower newer wider " +
                  "slower newest widest lowest towered flowered powered";

    var corpus = DEFAULT, seqs = [], merges = [], alphabet = 0, stalled = false;

    function reset() {
      var freq = {}, words = corpus.toLowerCase().match(/[^ ]+/g) || [], letters = {};
      words.forEach(function (w) { freq[w] = (freq[w] || 0) + 1; });
      seqs = Object.keys(freq).map(function (w) {
        var sym = w.split("").concat([EOW]);
        sym.forEach(function (c) { letters[c] = 1; });
        return { w: w, sym: sym, n: freq[w] };
      });
      alphabet = Object.keys(letters).length;
      merges = []; stalled = false;
      return words.length;
    }

    /* The four lines of the section: count pairs, take the most frequent,
       record it, merge it everywhere. */
    function step() {
      var counts = {}, seen = {}, k = 0;
      seqs.forEach(function (s) {
        for (var i = 0; i + 1 < s.sym.length; i++) {
          var key = s.sym[i] + " " + s.sym[i + 1];
          if (!(key in counts)) { counts[key] = 0; seen[key] = k++; }
          counts[key] += s.n;
        }
      });
      var best = null;
      Object.keys(counts).forEach(function (key) {
        if (best === null || counts[key] > counts[best] ||
            (counts[key] === counts[best] && seen[key] < seen[best])) best = key;
      });
      if (best === null || counts[best] < 2) { stalled = true; return false; }
      var parts = best.split(" "), a = parts[0], b = parts[1], ab = a + b;
      merges.push({ a: a, b: b, c: counts[best] });
      seqs.forEach(function (s) {
        var out = [];
        for (var i = 0; i < s.sym.length; i++) {
          if (i + 1 < s.sym.length && s.sym[i] === a && s.sym[i + 1] === b) { out.push(ab); i++; }
          else out.push(s.sym[i]);
        }
        s.sym = out;
      });
      return true;
    }
    function run(n) { for (var i = 0; i < n; i++) if (!step()) break; }

    /* Encode a word with the merges learned so far, in the order learned. */
    function encode(word) {
      var sym = word.toLowerCase().split("").concat([EOW]);
      merges.forEach(function (m) {
        var out = [];
        for (var i = 0; i < sym.length; i++) {
          if (i + 1 < sym.length && sym[i] === m.a && sym[i + 1] === m.b) { out.push(m.a + m.b); i++; }
          else out.push(sym[i]);
        }
        sym = out;
      });
      return sym;
    }
    function pretty(s) { return s === EOW ? "." : s.split(EOW).join("."); }

    var svg = S("svg", { viewBox: "0 0 760 430", width: "100%",
      role: "img", "aria-label": "byte-pair encoding trained live" }, f.body);

    function render() {
      while (svg.firstChild) svg.removeChild(svg.firstChild);
      var i, j;

      T(svg, 8, 14, "corpus: " + seqs.length + " distinct words, alphabet " + alphabet +
        " symbols, vocabulary " + (alphabet + merges.length),
        { anchor: "start", size: 11, fill: C.faint });
      T(svg, 752, 14, merges.length + " merges", { anchor: "end", size: 11,
        fill: merges.length ? C.orange : C.faint });

      T(svg, 8, 40, "merges, in the order learned", { anchor: "start", size: 11, fill: C.faint });
      var show = merges.slice(-12), off = merges.length - show.length;
      if (!show.length) {
        T(svg, 8, 64, "none yet, press merge", { anchor: "start", size: 11, fill: C.dim });
      }
      if (off > 0) T(svg, 392, 40, off + " earlier not shown",
        { anchor: "end", size: 9, fill: C.faint });
      for (i = 0; i < show.length; i++) {
        var m = show[i], yy = 62 + i * 21, last = (i === show.length - 1);
        T(svg, 34, yy, String(off + i + 1) + ".", { anchor: "end", size: 10, fill: C.faint });
        T(svg, 42, yy, pretty(m.a) + " + " + pretty(m.b),
          { anchor: "start", size: 11, fill: last ? C.orange : C.dim });
        T(svg, 250, yy, "= " + pretty(m.a + m.b),
          { anchor: "start", size: 11, fill: last ? C.orange : C.text });
        T(svg, 392, yy, "count " + m.c, { anchor: "end", size: 10,
          fill: last ? C.orange : C.faint });
      }

      T(svg, 412, 40, "the corpus, split by what has been learned",
        { anchor: "start", size: 11, fill: C.faint });
      var wsh = seqs.slice(0, 12);
      for (i = 0; i < wsh.length; i++) {
        var s2 = wsh[i], yy2 = 62 + i * 21, x = 412;
        for (j = 0; j < s2.sym.length && x < 720; j++) {
          var lab = pretty(s2.sym[j]), w = 7 + lab.length * 6.4;
          rect(svg, x, yy2 - 9, w, 18, { rx: 3, fill: C.blue, stroke: "none",
            op: 0.1 + Math.min(0.5, (s2.sym[j].length - 1) * 0.16) });
          T(svg, x + w / 2, yy2, lab, { size: 10, fill: C.text });
          x += w + 3;
        }
        T(svg, 752, yy2, "x" + s2.n, { anchor: "end", size: 9, fill: C.faint });
      }
      if (seqs.length > 12) T(svg, 412, 62 + 12 * 21 + 4,
        "and " + (seqs.length - 12) + " more distinct words",
        { anchor: "start", size: 9, fill: C.faint });

      line(svg, 8, 330, 752, 330, { stroke: C.line, sw: 1 });
      var probe = "lowest", enc = encode(probe);
      T(svg, 8, 350, "encode the word lowest with " + merges.length + " merges:",
        { anchor: "start", size: 11, fill: C.faint });
      var px2 = 260;
      for (j = 0; j < enc.length && px2 < 700; j++) {
        var lab2 = pretty(enc[j]), w2 = 8 + lab2.length * 6.6;
        rect(svg, px2, 341, w2, 18, { rx: 3, stroke: C.orange, sw: 1 });
        T(svg, px2 + w2 / 2, 350, lab2, { size: 10.5, fill: C.orange });
        px2 += w2 + 4;
      }
      T(svg, 752, 350, enc.length + (enc.length === 1 ? " piece" : " pieces"),
        { anchor: "end", size: 10, fill: C.faint });

      T(svg, 8, 378, stalled
          ? "No pair occurs twice any more: this corpus is exhausted. A real tokenizer runs tens of thousands of merges."
          : "A dot marks the end of a word, so a word-final er is a different symbol from one in the middle.",
        { anchor: "start", size: 10.5, fill: stalled ? C.pink : C.faint });
      /* The discovery, made findable. The merge table only shows the last
         twelve, so after 200 merges the interesting symbols have scrolled
         away; this asks the vocabulary directly. */
      T(svg, 8, 402, "morphemes it found on its own:",
        { anchor: "start", size: 10.5, fill: C.faint });
      var learned = {};
      merges.forEach(function (m, k) {
        var sym = m.a + m.b;
        if (!(sym in learned)) learned[sym] = k + 1;
      });
      var TARGETS = ["the", "ing", "tion", "er", "est", "ed", "ly", "re"];
      var mx = 208, found = 0;
      TARGETS.forEach(function (t) {
        var at = learned[t] || learned[t + EOW], hit = !!at;
        if (hit) found++;
        var lab = hit ? t + " @" + at : t;
        var w3 = 10 + lab.length * 6.4;
        rect(svg, mx, 393, w3, 18, { rx: 3, stroke: hit ? C.teal : C.line, sw: 1,
          fill: hit ? C.teal : "none", op: hit ? 0.16 : 1 });
        T(svg, mx + w3 / 2, 402, lab, { size: 10, fill: hit ? C.teal : C.faint });
        mx += w3 + 5;
      });
      T(svg, 8, 424, found
          ? "Found " + found + ", and nobody wrote a rule: a suffix is a character sequence that repeats."
          : "None yet on this corpus. Paste a paragraph of real English and run 200 merges.",
        { anchor: "start", size: 10.5, fill: found ? C.teal : C.faint });
    }

    function say() {
      if (!merges.length) { f.say("No merges yet. Press merge."); return; }
      var m = merges[merges.length - 1];
      f.say("Merge " + merges.length + ": " + pretty(m.a) + " + " + pretty(m.b) + " = " +
        pretty(m.a + m.b) + ", which occurred " + m.c + " times. Vocabulary is now " +
        (alphabet + merges.length) + ".");
    }

    f.btn("merge", function () {
      if (step()) { render(); say(); }
      else { render(); f.say("Nothing left to merge: no pair occurs twice in this corpus."); }
    });
    f.btn("run 50", function () { run(50); render(); say(); });
    f.btn("run 200", function () { run(200); render(); say(); });

    var input = document.createElement("input");
    input.type = "text"; input.value = "";
    input.placeholder = "paste a paragraph of your own";
    input.setAttribute("aria-label", "training corpus");
    input.style.cssText = "font:12px ui-monospace,Menlo,monospace;padding:4px 6px;min-width:240px;" +
      "background:var(--bg-2);color:var(--text);border:1px solid var(--line);border-radius:6px";
    f.controls.appendChild(input);

    function useCorpus() {
      var t = input.value.replace(/[^A-Za-z0-9' ]+/g, " ").trim();
      if (!t) { f.say("Type or paste some text first, then press train on this."); return; }
      corpus = t;
      var n = reset(); render();
      f.say(n + " words, " + seqs.length + " distinct, alphabet " + alphabet +
        ". Now run 200 merges and look for the, ing and tion appearing on their own.");
    }
    input.addEventListener("keydown", function (e) {
      if (e.key === "Enter") { e.preventDefault(); useCorpus(); }
    });
    f.btn("train on this", useCorpus);

    f.btn("reset", function () {
      corpus = DEFAULT; input.value = ""; reset(); render();
      f.say("Press merge and watch the most common pair become one token. Do it 30 times.");
    });

    reset();
    render();
    f.say("Press merge and watch the most common pair become one token. Do it 30 times.");
  };

  /* ========================================================================
     7. llmVocabTradeoff — CH 2 — Tuner

     The parameter arithmetic is exact and derived from Corvid's own card, and
     it checks out against the course's stated total: 32 blocks of 218,112,000
     plus two untied embedding tables of 128,256 x 4,096 comes to 8,030,261,248,
     which is the 8.03B on the spec card. The four published model figures in
     the section reproduce too, from 134M for Mistral to 1.05B for Gemma.

     Tokens per word is measured, in two series that must not be confused.
     The small end is this course's own BPE trained on 60,000 words of the
     book's prose and scored on 10,000 held out; the large end is six real
     tokenizers on the same held-out English. Different algorithms and
     different training data, so they are drawn and labelled apart.

     What the measurement says is the section's second point: English stops
     getting shorter at a vocabulary of about five thousand. Everything above
     that was bought for other languages.
     ======================================================================== */
  VIZ.llmVocabTradeoff = function (el) {
    var f = frame(el);

    var DM = 4096, DFF = 14336, KVD = 1024, LAYERS = 32;
    var BLOCK = DM * DM + DM * KVD * 2 + DM * DM + 3 * DM * DFF + 2 * DM;   // 218,112,000
    var MODELS = [
      { n: "Mistral-7B-v0.3", v: 32768 }, { n: "Llama-3-8B", v: 128256 },
      { n: "Qwen2.5-7B", v: 152064 }, { n: "Gemma-2-9B", v: 256000 }
    ];
    var OWN = [[28, 5.7875], [128, 3.115], [278, 2.4821], [528, 2.0436],
               [1028, 1.6814], [2028, 1.3865], [4028, 1.1862], [5266, 1.1211]];
    var REAL = [[49152, 1.117, "SmolLM2"], [50257, 1.117, "gpt2"],
                [100277, 1.108, "cl100k"], [128000, 1.117, "Llama-3"],
                [151643, 1.108, "Qwen2.5"], [200000, 1.117, "o200k"]];

    var eV = 17, tied = false;                 // log2 vocab; Corvid's are untied
    function V() { return Math.round(Math.pow(2, eV)); }
    function tables() { return tied ? 1 : 2; }
    function embed() { return tables() * V() * DM; }
    function headFlops() { return 2 * V() * DM; }

    /* Interpolate the measured series so the readout tracks the slider. */
    function tpwAt(v) {
      var all = OWN.concat(REAL.map(function (r) { return [r[0], r[1]]; }));
      if (v <= all[0][0]) return all[0][1];
      for (var i = 1; i < all.length; i++) {
        if (v <= all[i][0]) {
          var a = all[i - 1], b = all[i];
          var t = (Math.log(v) - Math.log(a[0])) / (Math.log(b[0]) - Math.log(a[0]));
          return a[1] + t * (b[1] - a[1]);
        }
      }
      return all[all.length - 1][1];
    }
    function fmtP(n) {
      if (n >= 1e9) return (n / 1e9).toFixed(2) + "B";
      return (n / 1e6).toFixed(0) + "M";
    }
    function commas(v) { return Math.round(v).toLocaleString("en-US"); }

    var svg = S("svg", { viewBox: "0 0 760 430", width: "100%",
      role: "img", "aria-label": "vocabulary size against three costs" }, f.body);

    var AX0 = 70, AX1 = 430, AY0 = 46, AY1 = 250;      // parameter chart
    var EMIN = 12, EMAX = 18, PMAX = 2.2e9;
    function ax(e) { return AX0 + (e - EMIN) / (EMAX - EMIN) * (AX1 - AX0); }
    function ay(p) { return AY1 - Math.min(p, PMAX) / PMAX * (AY1 - AY0); }

    var TX0 = 70, TX1 = 740, TY0 = 288, TY1 = 352;     // tokens-per-word chart
    var TVMIN = Math.log(16), TVMAX = Math.log(262144);
    function tx(v) { return TX0 + (Math.log(v) - TVMIN) / (TVMAX - TVMIN) * (TX1 - TX0); }
    function ty(w) { return TY1 - (Math.min(w, 6) - 1) / 5 * (TY1 - TY0); }

    function render() {
      while (svg.firstChild) svg.removeChild(svg.firstChild);
      var v = V(), emb = embed(), i, e;
      var overFour = emb > 4 * BLOCK;

      T(svg, 8, 14, "Corvid-8B: d_model 4,096, 32 blocks of " + commas(BLOCK) + " parameters",
        { anchor: "start", size: 11, fill: C.faint });
      T(svg, 752, 14, tied ? "tied: one table" : "untied: two tables, as Corvid has them",
        { anchor: "end", size: 10, fill: C.faint });

      /* ---- parameter chart ---- */
      T(svg, 8, 34, "embedding parameters", { anchor: "start", size: 11, fill: C.faint });
      line(svg, AX0, AY1, AX1, AY1, { stroke: C.line, sw: 1.5 });
      line(svg, AX0, AY0, AX0, AY1, { stroke: C.line, sw: 1.5 });
      for (i = 0; i <= 2000; i += 500) {
        var yy = ay(i * 1e6);
        if (i) line(svg, AX0, yy, AX1, yy, { stroke: C.line, sw: 0.5, op: 0.4 });
        T(svg, AX0 - 6, yy, i >= 1000 ? (i / 1000) + "B" : i + "M",
          { anchor: "end", size: 9, fill: C.faint });
      }
      for (e = EMIN; e <= EMAX; e++) {
        var lv = Math.pow(2, e);
        T(svg, ax(e), AY1 + 14, lv >= 1000 ? (lv / 1024) + "k" : String(lv),
          { size: 9, fill: C.faint });
      }
      T(svg, AX1, AY1 + 30, "vocabulary", { anchor: "end", size: 10, fill: C.faint });

      line(svg, AX0, ay(BLOCK), AX1, ay(BLOCK), { stroke: C.teal, sw: 1, dash: "4 3" });
      T(svg, AX0 + 5, ay(BLOCK) - 7, "one block", { anchor: "start", size: 9, fill: C.teal });
      line(svg, AX0, ay(4 * BLOCK), AX1, ay(4 * BLOCK), { stroke: C.orange, sw: 1.3, dash: "5 4" });
      T(svg, AX0 + 5, ay(4 * BLOCK) - 7, "four blocks = " + fmtP(4 * BLOCK),
        { anchor: "start", size: 9.5, fill: C.orange });

      var pts = [];
      for (e = EMIN; e <= EMAX; e += 0.25) {
        pts.push(ax(e) + "," + ay(tables() * Math.pow(2, e) * DM));
      }
      S("polyline", { points: pts.join(" "), fill: "none", stroke: C.blue,
        "stroke-width": 2 }, svg);

      MODELS.forEach(function (m) {
        var e2 = Math.log(m.v) / Math.LN2;
        if (e2 < EMIN || e2 > EMAX) return;
        S("circle", { cx: ax(e2), cy: ay(tables() * m.v * DM), r: 3, fill: C.dim }, svg);
      });

      S("circle", { cx: ax(eV), cy: ay(emb), r: 5.5, fill: overFour ? C.orange : C.blue }, svg);
      // No floating value label: the chart is crowded with reference rules and
      // tick labels, and the readout panel beside it already carries the number.
      // The marker's colour is the only thing the chart needs to say.

      /* ---- the three numbers ---- */
      var rx = 470, ry = 56, stp = 24;
      function row(label, value, tone) {
        T(svg, rx, ry, label, { anchor: "start", size: 10.5, fill: C.faint });
        T(svg, 752, ry, value, { anchor: "end", size: 11, fill: tone || C.text });
        ry += stp;
      }
      row("vocabulary", commas(v));
      ry += 4;
      row("embedding parameters", fmtP(emb), overFour ? C.orange : C.text);
      row("as blocks of Corvid", (emb / BLOCK).toFixed(2) + " blocks",
        overFour ? C.orange : C.text);
      row("output layer, per token", (headFlops() / 1e9).toFixed(2) + " GFLOP");
      row("tokens per English word", tpwAt(v).toFixed(3), C.teal);
      ry += 4;
      line(svg, rx, ry - 14, 752, ry - 14, { stroke: C.line, sw: 0.8 });
      MODELS.forEach(function (m) {
        row(m.n, commas(m.v) + "  " + fmtP(tables() * m.v * DM),
          Math.abs(Math.log(m.v) / Math.LN2 - eV) < 0.08 ? C.blue : C.dim);
      });

      /* ---- tokens per word, measured ---- */
      T(svg, 8, 276, "tokens per English word, 10,000 held-out words",
        { anchor: "start", size: 11, fill: C.faint });
      S("circle", { cx: 456, cy: 272, r: 3, fill: C.teal }, svg);
      T(svg, 464, 276, "this course's own BPE", { anchor: "start", size: 9.5, fill: C.teal });
      S("circle", { cx: 610, cy: 272, r: 3.5, fill: C.purple }, svg);
      T(svg, 618, 276, "six real tokenizers", { anchor: "start", size: 9.5, fill: C.purple });
      line(svg, TX0, TY1, TX1, TY1, { stroke: C.line, sw: 1.5 });
      line(svg, TX0, TY0, TX0, TY1, { stroke: C.line, sw: 1.5 });
      [1, 2, 4, 6].forEach(function (w) {
        T(svg, TX0 - 6, ty(w), String(w), { anchor: "end", size: 9, fill: C.faint });
        if (w > 1) line(svg, TX0, ty(w), TX1, ty(w), { stroke: C.line, sw: 0.5, op: 0.4 });
      });
      [16, 256, 4096, 65536, 262144].forEach(function (vv) {
        T(svg, tx(vv), TY1 + 13, vv >= 1024 ? (vv / 1024) + "k" : String(vv),
          { size: 9, fill: C.faint });
      });
      S("polyline", { points: OWN.map(function (p) { return tx(p[0]) + "," + ty(p[1]); }).join(" "),
        fill: "none", stroke: C.teal, "stroke-width": 2 }, svg);
      OWN.forEach(function (p) {
        S("circle", { cx: tx(p[0]), cy: ty(p[1]), r: 2.5, fill: C.teal }, svg);
      });
      REAL.forEach(function (p) {
        S("circle", { cx: tx(p[0]), cy: ty(p[1]), r: 3.5, fill: C.purple }, svg);
      });
      line(svg, tx(v), TY0, tx(v), TY1, { stroke: C.blue, sw: 1, dash: "3 3" });

      /* ---- what the two charts add up to ---- */
      var cross = Math.round(4 * BLOCK / (tables() * DM));
      T(svg, 8, 378, overFour
          ? "At " + commas(v) + " the embedding costs " + (emb / BLOCK).toFixed(1) +
            " blocks, more than four, and every one of those parameters learns one vector."
          : "At " + commas(v) + " the embedding costs " + (emb / BLOCK).toFixed(2) +
            " blocks. It passes four at a vocabulary of " + commas(cross) + ".",
        { anchor: "start", size: 11, fill: overFour ? C.orange : C.dim });
      T(svg, 8, 400,
        "English stopped getting shorter at about 5,000: 1.121 tokens per word there, 1.117 at 200,000.",
        { anchor: "start", size: 10.5, fill: C.teal });
      T(svg, 8, 422,
        "Everything above that was bought for other languages, which is what section 6 measures.",
        { anchor: "start", size: 10.5, fill: C.faint });
    }

    function say() {
      var v = V(), emb = embed();
      f.say("Vocabulary " + commas(v) + ": " + fmtP(emb) + " of embedding, " +
        (emb / BLOCK).toFixed(2) + " transformer blocks, " +
        tpwAt(v).toFixed(3) + " tokens per English word.");
    }
    var sV = slider(f.controls, "vocab", EMIN, EMAX, eV, 0.25,
      function (x) { return commas(Math.pow(2, x)); },
      function (x) { eV = x; render(); say(); });
    toggle(f.controls, "tied embeddings", false, function (on) {
      tied = on; render();
      f.say(on ? "Tied: one table shared by input and output, so the cost halves and the crossing "
                 + "moves to " + commas(4 * BLOCK / DM) + "."
               : "Untied, as Corvid is: two tables, and the crossing is at "
                 + commas(4 * BLOCK / (2 * DM)) + ".");
    });
    f.btn("Gemma-2-9B", function () {
      eV = Math.log(256000) / Math.LN2; sV.set(eV); render();
      f.say("Gemma-2-9B's 256,000 is the largest vocabulary here: 1.05B parameters per table, " +
            "which on Corvid's shape is more than four transformer blocks before a single one is built.");
    });
    f.btn("reset", function () {
      eV = 17; tied = false; sV.set(17); render();
      f.say("Move the vocabulary slider and find where the embedding table passes four blocks.");
    });

    render();
    f.say("Move the vocabulary slider and find where the embedding table passes four blocks.");
  };

  /* ========================================================================
     8. llmTokenizerCompare — CH 2 — Comparator

     Six texts, three real encodings, measured with tiktoken 0.14.0 on
     12 September 2026 and shipped with the page: nothing is tokenizing live
     here, because the three merge tables together are several megabytes and
     this file is 92 kilobytes.

     The four language rows reproduce the section's published table exactly —
     53/51/56/49 characters and 12/11/11, 20/16/11, 85/56/17, 133/69/17 — so
     the machine and the chapter cannot drift apart.

     What the render adds over the table is where the boundaries fall. Under
     gpt2 the Tamil sentence is 133 tokens of which almost none is a
     character: they are raw bytes, drawn narrow and pink, because byte-level
     BPE that never learned Tamil has nothing left to fall back to. The same
     sentence under o200k is 17 tokens, most of them syllables.

     The pre-tokenizer probe answers all three of exercise 4's predictions at
     once: four spaces, 1234567, and don't.
     ======================================================================== */
  VIZ.llmTokenizerCompare = function (el) {
    var f = frame(el);

    var ENC = [
      { k: "g", name: "gpt2",        v: 50257,  c: C.green },
      { k: "c", name: "cl100k_base", v: 100277, c: C.blue },
      { k: "o", name: "o200k_base",  v: 200019, c: C.orange }
    ];

    var DATA = [
      { lab: "English", s: "The library closes at six in the evening on weekdays.",
        g: "546865 206c696272617279 20636c6f736573 206174 20736978 20696e 20746865 206576656e696e67 206f6e 207765656b 64617973 2e",
        c: "546865 206c696272617279 20636c6f736573 206174 20736978 20696e 20746865 206576656e696e67 206f6e 207765656b64617973 2e",
        o: "546865 206c696272617279 20636c6f736573 206174 20736978 20696e 20746865 206576656e696e67 206f6e 207765656b64617973 2e",
      },
      { lab: "French", s: "La bibliothèque ferme à dix-huit heures en semaine.",
        g: "4c61 2062 69626c69 6f7468 c3a8 717565 20666572 6d65 20c3a0 2064 6978 2d 68 756974 206865 75726573 20656e 2073656d 61696e65 2e",
        c: "4c61 206269626c69 6f7468 c3a8 717565 20666572 6d65 20c3a0 2064 6978 2d68 756974 20686575726573 20656e 2073656d61696e65 2e",
        o: "4c61 206269626c696f7468c3a8717565 206665726d65 20c3a0 20646978 2d68 756974 20686575726573 20656e 2073656d61696e65 2e",
      },
      { lab: "Hindi", s: "पुस्तकालय सप्ताह के दिनों में शाम छह बजे बंद हो जाता है।",
        g: "e0a4 aa e0a5 81 e0a4 b8 e0a5 8d e0a4 a4 e0a4 95 e0a4be e0a4 b2 e0a4 af 20e0a4 b8 e0a4 aa e0a5 8d e0a4 a4 e0a4be e0a4 b9 20e0a4 95 e0a5 87 20e0a4 a6 e0a4 bf e0a4 a8 e0a5 8b e0a4 82 20e0a4 ae e0a5 87 e0a4 82 20e0a4 b6 e0a4be e0a4 ae 20e0a4 9b e0a4 b9 20e0a4 ac e0a4 9c e0a5 87 20e0a4 ac e0a4 82 e0a4 a6 20e0a4 b9 e0a5 8b 20e0a4 9c e0a4be e0a4 a4 e0a4be 20e0a4 b9 e0a5 88 e0a5 a4",
        c: "e0a4aa e0a581 e0a4b8 e0a58de0a4 a4 e0a495 e0a4bee0a4 b2 e0a4 af 20e0a4b8 e0a4aa e0a58de0a4 a4 e0a4bee0a4 b9 20e0a495 e0a587 20e0a4 a6 e0a4bfe0a4 a8 e0a58b e0a482 20e0a4ae e0a587e0a4 82 20e0a4 b6 e0a4bee0a4 ae 20e0a4 9b e0a4b9 20e0a4 ac e0a4 9c e0a587 20e0a4 ac e0a482 e0a4 a6 20e0a4b9 e0a58b 20e0a4 9c e0a4bee0a4 a4 e0a4be 20e0a4b9 e0a5 88 e0a5 a4",
        o: "e0a4aa e0a581 e0a4b8e0a58de0a4a4 e0a495 e0a4bee0a4b2e0a4af 20e0a4b8e0a4aae0a58de0a4a4e0a4bee0a4b9 20e0a495e0a587 20e0a4a6e0a4bfe0a4a8e0a58be0a482 20e0a4aee0a587e0a482 20e0a4b6e0a4bee0a4ae 20e0a49be0a4b9 20e0a4ace0a49ce0a587 20e0a4ace0a482e0a4a6 20e0a4b9e0a58b 20e0a49ce0a4bee0a4a4e0a4be 20e0a4b9e0a588 e0a5a4",
      },
      { lab: "Tamil", s: "நூலகம் வார நாட்களில் மாலை ஆறு மணிக்கு மூடப்படும்.",
        g: "e0 ae a8 e0 af 82 e0 ae b2 e0 ae 95 e0 ae ae e0 af 8d 20 e0 ae b5 e0 ae be e0 ae b0 20 e0 ae a8 e0 ae be e0 ae 9f e0 af 8d e0 ae 95 e0 ae b3 e0 ae bf e0 ae b2 e0 af 8d 20 e0 ae ae e0 ae be e0 ae b2 e0 af 88 20 e0 ae 86 e0 ae b1 e0 af 81 20 e0 ae ae e0 ae a3 e0 ae bf e0 ae 95 e0 af 8d e0 ae 95 e0 af 81 20 e0 ae ae e0 af 82 e0 ae 9f e0 ae aa e0 af 8d e0 ae aa e0 ae 9f e0 af 81 e0 ae ae e0 af 8d 2e",
        c: "e0ae a8 e0af 82 e0ae b2 e0ae 95 e0ae ae e0af8d 20e0ae b5 e0ae be e0ae b0 20e0ae a8 e0ae be e0ae 9f e0af8de0ae 95 e0ae b3 e0aebfe0ae b2 e0af8d 20e0ae ae e0ae be e0ae b2 e0af 88 20e0ae 86 e0ae b1 e0af81 20e0ae ae e0ae a3 e0aebfe0ae 95 e0af8de0ae 95 e0af81 20e0ae ae e0af 82 e0ae 9f e0ae aa e0af8de0ae aa e0ae 9f e0af81 e0ae ae e0af8d 2e",
        o: "e0aea8 e0af82 e0aeb2e0ae95 e0aeaee0af8d 20e0aeb5e0aebee0aeb0 20e0aea8e0aebee0ae9f e0af8de0ae95e0aeb3e0aebfe0aeb2e0af8d 20e0aeae e0aebee0aeb2e0af88 20e0ae86 e0aeb1e0af81 20e0aeaee0aea3 e0aebfe0ae95e0af8de0ae95e0af81 20e0aeaee0af82 e0ae9f e0aeaae0af8de0aeaae0ae9fe0af81e0aeaee0af8d 2e",
      },
      { lab: "pre-tokenizer probe", s: "don't    stop 1234567",
        n: "Four spaces, a 7-digit number, an apostrophe: gpt2 spends one token per space, o200k keeps don't whole.",
        g: "646f6e 2774 20 20 20 2073746f70 20313233 3435 3637",
        c: "646f6e 2774 202020 2073746f70 20 313233 343536 37",
        o: "646f6e2774 202020 2073746f70 20 313233 343536 37",
      },
      { lab: "code", s: "for i in range(10):\n    print(i)",
        n: "Indentation: gpt2 spends one token per space, cl100k and o200k have one token for the whole run.",
        g: "666f72 2069 20696e 2072616e6765 28 3130 293a 0a 20 20 20 207072696e74 28 69 29",
        c: "666f72 2069 20696e 2072616e6765 28 3130 293a0a 202020 207072696e74 2869 29",
        o: "666f72 2069 20696e 2072616e6765 28 3130 293a0a 202020 207072696e74 2869 29",
      },
    ];

    var idx = 0, bytesView = false, unknown = "";
    var DEC = window.TextDecoder ? new TextDecoder("utf-8", { fatal: true }) : null;

    /* One token: its bytes, and its text if those bytes happen to be a whole
       character. Under gpt2 most Tamil tokens are half of one. */
    function toks(row, k) {
      var cache = row["_" + k];
      if (cache) return cache;
      cache = row[k].split(" ").map(function (hex) {
        var b = new Uint8Array(hex.length / 2), i;
        for (i = 0; i < b.length; i++) b[i] = parseInt(hex.substr(i * 2, 2), 16);
        var s = null;
        try { s = DEC ? DEC.decode(b) : null; } catch (e) { s = null; }
        return { hex: hex, s: s, n: b.length };
      });
      row["_" + k] = cache;
      return cache;
    }
    function show(t) {
      return t.replace(/ /g, "·").replace(/\n/g, "⏎").replace(/\t/g, "⇥");
    }
    function commas(v) { return v.toLocaleString("en-US"); }
    function chars(s) { return Array.from ? Array.from(s).length : s.length; }

    var svg = S("svg", { viewBox: "0 0 760 430", width: "100%",
      role: "img", "aria-label": "one text, three tokenizers, token by token" }, f.body);

    var BARX = 250, BARMAX = 140, BARW = 300, MAXLN = 4;

    /* Measure the wrap before drawing any of it: a one-line text should not
       leave three empty rows under each of the three encodings, and Tamil
       under gpt2 needs every row it can get. The viewBox follows. */
    function wrap(list) {
      var L = wrapBoxes(list.map(function (t) {
        var raw = t.s === null, fs = bytesView ? 9 : 10;
        var lab = bytesView ? t.hex : (raw ? "" : show(t.s));
        return { lab: lab, fs: fs, w: lab ? 8 + lab.length * fs * 0.62 : 11,
                 raw: raw, n: t.n };
      }), MAXLN);
      L.total = list.length;
      return L;
    }

    function render() {
      while (svg.firstChild) svg.removeChild(svg.firstChild);
      var row = DATA[idx], i;

      T(svg, 8, 14, "one text, three real encodings", { anchor: "start", size: 11, fill: C.faint });
      T(svg, 752, 14, "measured with tiktoken 0.14.0 \u2014 not running live",
        { anchor: "end", size: 10, fill: C.faint });

      rect(svg, 8, 24, 744, 30, { rx: 6, stroke: unknown ? C.pink : C.line, sw: 1.2 });
      T(svg, 18, 39, show(unknown || row.s).slice(0, 78),
        { anchor: "start", size: 12, fill: unknown ? C.faint : C.text });
      T(svg, 744, 39, unknown ? "not measured" : row.lab + ", " + chars(row.s) + " characters",
        { anchor: "end", size: 10, fill: unknown ? C.pink : C.faint });

      var lay = ENC.map(function (e) { return wrap(toks(row, e.k)); });
      var tops = [], top = 66;
      lay.forEach(function (L) { tops.push(top); top += 55 + (L.lines - 1) * 21; });

      var anyRaw = false;
      ENC.forEach(function (e, p) {
        var L = lay[p], t0 = tops[p], y = t0 + 10;

        T(svg, 8, y, e.name, { anchor: "start", size: 11.5, fill: e.c });
        T(svg, 120, y, commas(e.v) + " entries", { anchor: "start", size: 9.5, fill: C.faint });
        rect(svg, BARX, y - 5, Math.min(L.total, BARMAX) / BARMAX * BARW, 10,
          { rx: 3, fill: e.c, stroke: "none", op: 0.5 });
        T(svg, 752, y, L.total + " tokens", { anchor: "end", size: 11, fill: e.c });

        L.pos.forEach(function (b) {
          if (b.raw) anyRaw = true;
          var yy = t0 + 32 + b.ln * 21;
          rect(svg, b.x, yy - 9, b.w, 18, { rx: 3, stroke: "none",
            fill: b.raw ? C.pink : e.c,
            op: b.raw ? 0.3 : 0.12 + Math.min(0.55, (b.n - 1) * 0.11) });
          if (b.lab) T(svg, b.x + b.w / 2, yy, b.lab, { size: b.fs, fill: C.text });
        });
        if (L.cut >= 0) T(svg, 752, t0 + 32 + (L.lines - 1) * 21,
          "+" + (L.total - L.cut) + " more", { anchor: "end", size: 9, fill: C.faint });
      });

      /* ---- what the three rows add up to ---- */
      var en = DATA[0], g = lay[0].total, o = lay[2].total;
      var eg = toks(en, "g").length, eo = toks(en, "o").length;
      var fy = top + 8;
      T(svg, 8, fy, row.n ? row.n : idx === 0
          ? "The English sentence: 53 characters, and the three encodings disagree by one token. Now pick Tamil."
          : chars(row.s) + " characters of " + row.lab + ": " + g + " tokens under gpt2, " +
            (g / eg).toFixed(1) + "x the English sentence, and " + o + " under o200k, " +
            (o / eo).toFixed(1) + "x.",
        { anchor: "start", size: 11, fill: row.n || idx === 0 ? C.dim : C.orange });
      T(svg, 8, fy + 20, anyRaw
          ? "A pink box is not a character but part of one: raw bytes, all byte-level BPE has left for a script it never learned."
          : "Box shading is byte length: the darker a token, the more of the text one entry of the vocabulary covered.",
        { anchor: "start", size: 10, fill: anyRaw ? C.pink : C.faint });

      svg.setAttribute("viewBox", "0 0 760 " + (fy + 36));
    }

    function say() {
      var row = DATA[idx];
      f.say(row.lab + ", " + chars(row.s) + " characters: " +
        ENC.map(function (e) { return toks(row, e.k).length + " under " + e.name; }).join(", ") + ".");
    }

    /* ---- controls ------------------------------------------------------ */
    var sel = document.createElement("select");
    sel.setAttribute("aria-label", "text");
    sel.style.cssText = "font:12px ui-monospace,Menlo,monospace;padding:4px 6px;max-width:250px;" +
      "background:var(--bg-2);color:var(--text);border:1px solid var(--line);border-radius:6px";
    DATA.forEach(function (d, i) {
      var o = document.createElement("option");
      o.value = i; o.textContent = d.lab + ": " + d.s.replace(/\n/g, "⏎").slice(0, 30);
      sel.appendChild(o);
    });
    var input = document.createElement("input");
    input.type = "text"; input.value = DATA[0].s;
    input.setAttribute("aria-label", "text to encode");
    input.style.cssText = "font:12px ui-monospace,Menlo,monospace;padding:4px 6px;min-width:220px;" +
      "background:var(--bg-2);color:var(--text);border:1px solid var(--line);border-radius:6px";

    function pick(i) {
      idx = i; unknown = "";
      input.value = DATA[i].s; sel.value = String(i);
      render(); say();
    }
    sel.addEventListener("change", function () { pick(+sel.value); });
    f.controls.appendChild(sel);
    f.controls.appendChild(input);

    function norm(s) { return s.replace(/\s+/g, " ").trim().toLowerCase(); }
    function apply() {
      var n = norm(input.value), i;
      for (i = 0; i < DATA.length; i++) if (norm(DATA[i].s) === n) { pick(i); return; }
      unknown = input.value; render();
      f.say("No tokenization shipped for that text. The three merge tables are several megabytes, " +
            "so nothing runs live here: the page carries readings for " + DATA.length +
            " texts, and the list beside the box has all of them.");
    }
    input.addEventListener("keydown", function (e) {
      if (e.key === "Enter") { e.preventDefault(); apply(); }
    });
    f.btn("encode it", apply);

    var tgBytes = toggle(f.controls, "byte view", false, function (v) {
      bytesView = v; render();
      f.say(v ? "Every token as the bytes it actually is. A gpt2 token of Tamil is one byte: e0, or ae, "
              + "which is a third of a character."
              : "Back to text. A token with no label is bytes that are not a whole character.");
    });

    f.btn("Tamil", function () { pick(3); });
    f.btn("reset", function () {
      bytesView = false; unknown = ""; tgBytes.set(false);
      pick(0);
      f.say("Pick English, then Tamil. Same sentence, same meaning, and watch the token count go up eleven times.");
    });

    render();
    f.say("Pick English, then Tamil. Same sentence, same meaning, and watch the token count go up eleven times.");
  };


  /* ========================================================================
     9. llmChatTemplate — CH 3 — Stepper

     A conversation is not a thing a model has. It is four messages rendered
     into one flat string by a template that shipped with the weights, and
     this machine shows that string as the model actually receives it: as
     tokens, with every marker either a single control id or the rubble of
     one.

     Measured with transformers 5.17.0 against Llama-3-8B-Instruct's and
     Qwen2.5-7B-Instruct's own tokenizer_config.json, 12 September 2026, and
     the section's three published figures come out of it at step 2: 20
     tokens for Llama through Llama, 18 for Qwen through Qwen, 67 for Llama
     through Qwen. The fourth cell of that square, 40, the chapter does not
     print, and the machine does.

     The wrong-tokenizer toggle is the whole chapter in one control. Nothing
     raises, nothing logs; the boxes just stop being solid.
     ======================================================================== */
  VIZ.llmChatTemplate = function (el) {
    var f = frame(el);

    var TPL = { L: "Llama 3", Q: "Qwen 2.5" };
    var ROLES = ["system", "user", "assistant", "user"];
    var SAID = ["You are terse.", "Hi", "Hello.", "Why?"];

    var CELL = {
      LL10: { k: "xx.x.....e", t: ["<|begin_of_text|>", "<|start_header_id|>", "system", "<|end_header_id|>", "\n\n", "You", " are", " terse", ".", "<|eot_id|>"] },
      LL11: { k: "xx.x.....egggg", t: ["<|begin_of_text|>", "<|start_header_id|>", "system", "<|end_header_id|>", "\n\n", "You", " are", " terse", ".", "<|eot_id|>", "<|start_header_id|>", "assistant", "<|end_header_id|>", "\n\n"] },
      LL20: { k: "xx.x.....ex.x..e", t: ["<|begin_of_text|>", "<|start_header_id|>", "system", "<|end_header_id|>", "\n\n", "You", " are", " terse", ".", "<|eot_id|>", "<|start_header_id|>", "user", "<|end_header_id|>", "\n\n", "Hi", "<|eot_id|>"] },
      LL21: { k: "xx.x.....ex.x..egggg", t: ["<|begin_of_text|>", "<|start_header_id|>", "system", "<|end_header_id|>", "\n\n", "You", " are", " terse", ".", "<|eot_id|>", "<|start_header_id|>", "user", "<|end_header_id|>", "\n\n", "Hi", "<|eot_id|>", "<|start_header_id|>", "assistant", "<|end_header_id|>", "\n\n"] },
      LL30: { k: "xx.x.....ex.x..ex.x...e", t: ["<|begin_of_text|>", "<|start_header_id|>", "system", "<|end_header_id|>", "\n\n", "You", " are", " terse", ".", "<|eot_id|>", "<|start_header_id|>", "user", "<|end_header_id|>", "\n\n", "Hi", "<|eot_id|>", "<|start_header_id|>", "assistant", "<|end_header_id|>", "\n\n", "Hello", ".", "<|eot_id|>"] },
      LL31: { k: "xx.x.....ex.x..ex.x...egggg", t: ["<|begin_of_text|>", "<|start_header_id|>", "system", "<|end_header_id|>", "\n\n", "You", " are", " terse", ".", "<|eot_id|>", "<|start_header_id|>", "user", "<|end_header_id|>", "\n\n", "Hi", "<|eot_id|>", "<|start_header_id|>", "assistant", "<|end_header_id|>", "\n\n", "Hello", ".", "<|eot_id|>", "<|start_header_id|>", "assistant", "<|end_header_id|>", "\n\n"] },
      LL40: { k: "xx.x.....ex.x..ex.x...ex.x...e", t: ["<|begin_of_text|>", "<|start_header_id|>", "system", "<|end_header_id|>", "\n\n", "You", " are", " terse", ".", "<|eot_id|>", "<|start_header_id|>", "user", "<|end_header_id|>", "\n\n", "Hi", "<|eot_id|>", "<|start_header_id|>", "assistant", "<|end_header_id|>", "\n\n", "Hello", ".", "<|eot_id|>", "<|start_header_id|>", "user", "<|end_header_id|>", "\n\n", "Why", "?", "<|eot_id|>"] },
      LL41: { k: "xx.x.....ex.x..ex.x...ex.x...egggg", t: ["<|begin_of_text|>", "<|start_header_id|>", "system", "<|end_header_id|>", "\n\n", "You", " are", " terse", ".", "<|eot_id|>", "<|start_header_id|>", "user", "<|end_header_id|>", "\n\n", "Hi", "<|eot_id|>", "<|start_header_id|>", "assistant", "<|end_header_id|>", "\n\n", "Hello", ".", "<|eot_id|>", "<|start_header_id|>", "user", "<|end_header_id|>", "\n\n", "Why", "?", "<|eot_id|>", "<|start_header_id|>", "assistant", "<|end_header_id|>", "\n\n"] },
      LQ10: { k: "sssssssssssss.sssssss...sssssss", t: ["<", "|", "begin", "_of", "_text", "|", "><", "|", "start", "_header", "_id", "|", ">", "system", "<", "|", "end", "_header", "_id", "|", ">\n\n", "You", " are", " terse", ".<", "|", "e", "ot", "_id", "|", ">"] },
      LQ11: { k: "sssssssssssss.sssssss...sssssssssssssgsssssss", t: ["<", "|", "begin", "_of", "_text", "|", "><", "|", "start", "_header", "_id", "|", ">", "system", "<", "|", "end", "_header", "_id", "|", ">\n\n", "You", " are", " terse", ".<", "|", "e", "ot", "_id", "|", "><", "|", "start", "_header", "_id", "|", ">", "assistant", "<", "|", "end", "_header", "_id", "|", ">\n\n"] },
      LQ20: { k: "sssssssssssss.sssssss...sssssssssssss.sssssss.sssssss", t: ["<", "|", "begin", "_of", "_text", "|", "><", "|", "start", "_header", "_id", "|", ">", "system", "<", "|", "end", "_header", "_id", "|", ">\n\n", "You", " are", " terse", ".<", "|", "e", "ot", "_id", "|", "><", "|", "start", "_header", "_id", "|", ">", "user", "<", "|", "end", "_header", "_id", "|", ">\n\n", "Hi", "<", "|", "e", "ot", "_id", "|", ">"] },
      LQ21: { k: "sssssssssssss.sssssss...sssssssssssss.sssssss.sssssssssssssgsssssss", t: ["<", "|", "begin", "_of", "_text", "|", "><", "|", "start", "_header", "_id", "|", ">", "system", "<", "|", "end", "_header", "_id", "|", ">\n\n", "You", " are", " terse", ".<", "|", "e", "ot", "_id", "|", "><", "|", "start", "_header", "_id", "|", ">", "user", "<", "|", "end", "_header", "_id", "|", ">\n\n", "Hi", "<", "|", "e", "ot", "_id", "|", "><", "|", "start", "_header", "_id", "|", ">", "assistant", "<", "|", "end", "_header", "_id", "|", ">\n\n"] },
      LQ30: { k: "sssssssssssss.sssssss...sssssssssssss.sssssss.sssssssssssss.sssssss.sssssss", t: ["<", "|", "begin", "_of", "_text", "|", "><", "|", "start", "_header", "_id", "|", ">", "system", "<", "|", "end", "_header", "_id", "|", ">\n\n", "You", " are", " terse", ".<", "|", "e", "ot", "_id", "|", "><", "|", "start", "_header", "_id", "|", ">", "user", "<", "|", "end", "_header", "_id", "|", ">\n\n", "Hi", "<", "|", "e", "ot", "_id", "|", "><", "|", "start", "_header", "_id", "|", ">", "assistant", "<", "|", "end", "_header", "_id", "|", ">\n\n", "Hello", ".<", "|", "e", "ot", "_id", "|", ">"] },
      LQ31: { k: "sssssssssssss.sssssss...sssssssssssss.sssssss.sssssssssssss.sssssss.sssssssssssssgsssssss", t: ["<", "|", "begin", "_of", "_text", "|", "><", "|", "start", "_header", "_id", "|", ">", "system", "<", "|", "end", "_header", "_id", "|", ">\n\n", "You", " are", " terse", ".<", "|", "e", "ot", "_id", "|", "><", "|", "start", "_header", "_id", "|", ">", "user", "<", "|", "end", "_header", "_id", "|", ">\n\n", "Hi", "<", "|", "e", "ot", "_id", "|", "><", "|", "start", "_header", "_id", "|", ">", "assistant", "<", "|", "end", "_header", "_id", "|", ">\n\n", "Hello", ".<", "|", "e", "ot", "_id", "|", "><", "|", "start", "_header", "_id", "|", ">", "assistant", "<", "|", "end", "_header", "_id", "|", ">\n\n"] },
      LQ40: { k: "sssssssssssss.sssssss...sssssssssssss.sssssss.sssssssssssss.sssssss.sssssssssssss.sssssss.sssssss", t: ["<", "|", "begin", "_of", "_text", "|", "><", "|", "start", "_header", "_id", "|", ">", "system", "<", "|", "end", "_header", "_id", "|", ">\n\n", "You", " are", " terse", ".<", "|", "e", "ot", "_id", "|", "><", "|", "start", "_header", "_id", "|", ">", "user", "<", "|", "end", "_header", "_id", "|", ">\n\n", "Hi", "<", "|", "e", "ot", "_id", "|", "><", "|", "start", "_header", "_id", "|", ">", "assistant", "<", "|", "end", "_header", "_id", "|", ">\n\n", "Hello", ".<", "|", "e", "ot", "_id", "|", "><", "|", "start", "_header", "_id", "|", ">", "user", "<", "|", "end", "_header", "_id", "|", ">\n\n", "Why", "?<", "|", "e", "ot", "_id", "|", ">"] },
      LQ41: { k: "sssssssssssss.sssssss...sssssssssssss.sssssss.sssssssssssss.sssssss.sssssssssssss.sssssss.sssssssssssssgsssssss", t: ["<", "|", "begin", "_of", "_text", "|", "><", "|", "start", "_header", "_id", "|", ">", "system", "<", "|", "end", "_header", "_id", "|", ">\n\n", "You", " are", " terse", ".<", "|", "e", "ot", "_id", "|", "><", "|", "start", "_header", "_id", "|", ">", "user", "<", "|", "end", "_header", "_id", "|", ">\n\n", "Hi", "<", "|", "e", "ot", "_id", "|", "><", "|", "start", "_header", "_id", "|", ">", "assistant", "<", "|", "end", "_header", "_id", "|", ">\n\n", "Hello", ".<", "|", "e", "ot", "_id", "|", "><", "|", "start", "_header", "_id", "|", ">", "user", "<", "|", "end", "_header", "_id", "|", ">\n\n", "Why", "?<", "|", "e", "ot", "_id", "|", "><", "|", "start", "_header", "_id", "|", ">", "assistant", "<", "|", "end", "_header", "_id", "|", ">\n\n"] },
      QL10: { k: "ssssss.....ssssss", t: ["<", "|", "im", "_start", "|", ">", "system", "\n", "You", " are", " terse", ".<", "|", "im", "_end", "|", ">\n"] },
      QL11: { k: "ssssss.....ssssssssssssgg", t: ["<", "|", "im", "_start", "|", ">", "system", "\n", "You", " are", " terse", ".<", "|", "im", "_end", "|", ">\n", "<", "|", "im", "_start", "|", ">", "assistant", "\n"] },
      QL20: { k: "ssssss.....ssssssssssss...ssssss", t: ["<", "|", "im", "_start", "|", ">", "system", "\n", "You", " are", " terse", ".<", "|", "im", "_end", "|", ">\n", "<", "|", "im", "_start", "|", ">", "user", "\n", "Hi", "<", "|", "im", "_end", "|", ">\n"] },
      QL21: { k: "ssssss.....ssssssssssss...ssssssssssssgg", t: ["<", "|", "im", "_start", "|", ">", "system", "\n", "You", " are", " terse", ".<", "|", "im", "_end", "|", ">\n", "<", "|", "im", "_start", "|", ">", "user", "\n", "Hi", "<", "|", "im", "_end", "|", ">\n", "<", "|", "im", "_start", "|", ">", "assistant", "\n"] },
      QL30: { k: "ssssss.....ssssssssssss...ssssssssssss...ssssss", t: ["<", "|", "im", "_start", "|", ">", "system", "\n", "You", " are", " terse", ".<", "|", "im", "_end", "|", ">\n", "<", "|", "im", "_start", "|", ">", "user", "\n", "Hi", "<", "|", "im", "_end", "|", ">\n", "<", "|", "im", "_start", "|", ">", "assistant", "\n", "Hello", ".<", "|", "im", "_end", "|", ">\n"] },
      QL31: { k: "ssssss.....ssssssssssss...ssssssssssss...ssssssssssssgg", t: ["<", "|", "im", "_start", "|", ">", "system", "\n", "You", " are", " terse", ".<", "|", "im", "_end", "|", ">\n", "<", "|", "im", "_start", "|", ">", "user", "\n", "Hi", "<", "|", "im", "_end", "|", ">\n", "<", "|", "im", "_start", "|", ">", "assistant", "\n", "Hello", ".<", "|", "im", "_end", "|", ">\n", "<", "|", "im", "_start", "|", ">", "assistant", "\n"] },
      QL40: { k: "ssssss.....ssssssssssss...ssssssssssss...ssssssssssss...ssssss", t: ["<", "|", "im", "_start", "|", ">", "system", "\n", "You", " are", " terse", ".<", "|", "im", "_end", "|", ">\n", "<", "|", "im", "_start", "|", ">", "user", "\n", "Hi", "<", "|", "im", "_end", "|", ">\n", "<", "|", "im", "_start", "|", ">", "assistant", "\n", "Hello", ".<", "|", "im", "_end", "|", ">\n", "<", "|", "im", "_start", "|", ">", "user", "\n", "Why", "?<", "|", "im", "_end", "|", ">\n"] },
      QL41: { k: "ssssss.....ssssssssssss...ssssssssssss...ssssssssssss...ssssssssssssgg", t: ["<", "|", "im", "_start", "|", ">", "system", "\n", "You", " are", " terse", ".<", "|", "im", "_end", "|", ">\n", "<", "|", "im", "_start", "|", ">", "user", "\n", "Hi", "<", "|", "im", "_end", "|", ">\n", "<", "|", "im", "_start", "|", ">", "assistant", "\n", "Hello", ".<", "|", "im", "_end", "|", ">\n", "<", "|", "im", "_start", "|", ">", "user", "\n", "Why", "?<", "|", "im", "_end", "|", ">\n", "<", "|", "im", "_start", "|", ">", "assistant", "\n"] },
      QQ10: { k: "x......e.", t: ["<|im_start|>", "system", "\n", "You", " are", " terse", ".", "<|im_end|>", "\n"] },
      QQ11: { k: "x......e.ggg", t: ["<|im_start|>", "system", "\n", "You", " are", " terse", ".", "<|im_end|>", "\n", "<|im_start|>", "assistant", "\n"] },
      QQ20: { k: "x......e.x...e.", t: ["<|im_start|>", "system", "\n", "You", " are", " terse", ".", "<|im_end|>", "\n", "<|im_start|>", "user", "\n", "Hi", "<|im_end|>", "\n"] },
      QQ21: { k: "x......e.x...e.ggg", t: ["<|im_start|>", "system", "\n", "You", " are", " terse", ".", "<|im_end|>", "\n", "<|im_start|>", "user", "\n", "Hi", "<|im_end|>", "\n", "<|im_start|>", "assistant", "\n"] },
      QQ30: { k: "x......e.x...e.x....e.", t: ["<|im_start|>", "system", "\n", "You", " are", " terse", ".", "<|im_end|>", "\n", "<|im_start|>", "user", "\n", "Hi", "<|im_end|>", "\n", "<|im_start|>", "assistant", "\n", "Hello", ".", "<|im_end|>", "\n"] },
      QQ31: { k: "x......e.x...e.x....e.ggg", t: ["<|im_start|>", "system", "\n", "You", " are", " terse", ".", "<|im_end|>", "\n", "<|im_start|>", "user", "\n", "Hi", "<|im_end|>", "\n", "<|im_start|>", "assistant", "\n", "Hello", ".", "<|im_end|>", "\n", "<|im_start|>", "assistant", "\n"] },
      QQ40: { k: "x......e.x...e.x....e.x....e.", t: ["<|im_start|>", "system", "\n", "You", " are", " terse", ".", "<|im_end|>", "\n", "<|im_start|>", "user", "\n", "Hi", "<|im_end|>", "\n", "<|im_start|>", "assistant", "\n", "Hello", ".", "<|im_end|>", "\n", "<|im_start|>", "user", "\n", "Why", "?", "<|im_end|>", "\n"] },
      QQ41: { k: "x......e.x...e.x....e.x....e.ggg", t: ["<|im_start|>", "system", "\n", "You", " are", " terse", ".", "<|im_end|>", "\n", "<|im_start|>", "user", "\n", "Hi", "<|im_end|>", "\n", "<|im_start|>", "assistant", "\n", "Hello", ".", "<|im_end|>", "\n", "<|im_start|>", "user", "\n", "Why", "?", "<|im_end|>", "\n", "<|im_start|>", "assistant", "\n"] },
    };

    var tpl = "L", wrong = false, step = 2, gen = true;
    function tokr() { return wrong ? (tpl === "L" ? "Q" : "L") : tpl; }
    function cell(t, k) { return CELL[tpl + t + step + (k ? 1 : 0)]; }

    function show(s) {
      return s.replace(/ /g, "·").replace(/\n/g, "⏎").replace(/\t/g, "⇥");
    }
    function markers(c) {
      var n = 0;
      c.t.forEach(function (s) { if (/^<\|.*\|>$/.test(s)) n++; });
      return n;
    }
    function shards(c) { return c.k.split("s").length - 1; }

    var svg = S("svg", { viewBox: "0 0 760 430", width: "100%",
      role: "img", "aria-label": "a conversation rendered by a chat template" }, f.body);

    var TY0 = 68, MAXLN = 7;

    function wrap(c) {
      return wrapBoxes(c.t.map(function (t, i) {
        var lab = show(t);
        return { lab: lab, w: 8 + lab.length * 6.2, c: c.k.charAt(i) };
      }), MAXLN);
    }

    function render() {
      while (svg.firstChild) svg.removeChild(svg.firstChild);
      var tk = tokr(), c = cell(tk, gen), mine = cell(tpl, gen), i;
      var n = c.t.length, base = mine.t.length;

      T(svg, 8, 14, "a conversation, flattened into one string",
        { anchor: "start", size: 11, fill: C.faint });
      T(svg, 752, 14, "measured with transformers 5.17.0 — not running live",
        { anchor: "end", size: 10, fill: C.faint });

      T(svg, 8, 36, "turns: " + ROLES.slice(0, step).join(", ") + "   (" + step + " of 4)",
        { anchor: "start", size: 11, fill: C.dim });
      T(svg, 752, 36, wrong
          ? TPL[tpl] + "'s template through " + TPL[tk] + "'s tokenizer"
          : TPL[tpl] + "'s template through its own tokenizer",
        { anchor: "end", size: 11, fill: wrong ? C.pink : C.teal });
      line(svg, 8, 48, 752, 48, { stroke: C.line, sw: 1 });

      /* ---- the string, as tokens ---- */
      var L = wrap(c);
      L.pos.forEach(function (b) {
        var yy = TY0 + b.ln * 21, fill = C.blue, op = 0.12, txt = C.text, st = "none", dash = "none";
        if (b.c === "x") { fill = C.orange; op = 0.35; }
        else if (b.c === "e") { fill = C.pink; op = 0.35; }
        else if (b.c === "g") { fill = C.green; op = 0.35; }
        else if (b.c === "s") { fill = "none"; st = C.pink; dash = "3 2"; txt = C.pink; }
        rect(svg, b.x, yy - 9, b.w, 18, { rx: 3, fill: fill, stroke: st, sw: 1, dash: dash, op: op });
        T(svg, b.x + b.w / 2, yy, b.lab, { size: 10, fill: txt });
      });
      if (L.cut >= 0) T(svg, 752, TY0 + (L.lines - 1) * 21, "+" + (n - L.cut) + " more",
        { anchor: "end", size: 9, fill: C.faint });

      /* ---- the count, and what it cost ---- */
      var cy = TY0 + L.lines * 21 + 14;
      T(svg, 8, cy, "tokens the model receives", { anchor: "start", size: 11, fill: C.faint });
      T(svg, 752, cy, n + (wrong ? "  (" + base + " with the matching tokenizer)" : ""),
        { anchor: "end", size: 12, fill: wrong ? C.pink : C.teal });

      T(svg, 8, cy + 24, wrong
          ? markers(mine) + " control tokens became " + shards(c) +
            " tokens of punctuation: " + n + " instead of " + base + ", " +
            (n / base).toFixed(1) + "x, and no exception anywhere."
          : "Every marker is one id: " + markers(c) +
            " of them, and the model reads structure rather than punctuation.",
        { anchor: "start", size: 11, fill: wrong ? C.pink : C.dim });
      T(svg, 8, cy + 44, gen
          ? "The green tail is the generation prompt, and it is what puts the model in the position of speaking next."
          : "No generation prompt. Nothing tells the model it is its turn, so it carries on writing the user's.",
        { anchor: "start", size: 10.5, fill: gen ? C.green : C.orange });

      /* ---- legend ---- */
      var lx = 8;
      [[C.orange, "structure"], [C.pink, "end of turn"], [C.green, "generation prompt"],
       [C.blue, "content"]].forEach(function (p) {
        rect(svg, lx, cy + 60, 12, 10, { rx: 2, fill: p[0], stroke: "none", op: 0.35 });
        T(svg, lx + 17, cy + 65, p[1], { anchor: "start", size: 9.5, fill: C.faint });
        lx += 30 + p[1].length * 5.6;
      });
      rect(svg, lx, cy + 60, 12, 10, { rx: 2, fill: "none", stroke: C.pink, sw: 1, dash: "3 2" });
      T(svg, lx + 17, cy + 65, "a marker that shattered into text",
        { anchor: "start", size: 9.5, fill: C.pink });

      svg.setAttribute("viewBox", "0 0 760 " + (cy + 84));
    }

    function say() {
      var tk = tokr(), n = cell(tk, gen).t.length, base = cell(tpl, gen).t.length;
      f.say(step + (step === 1 ? " turn" : " turns") + ", " + TPL[tpl] + "'s template" +
        (wrong ? " through " + TPL[tk] + "'s tokenizer: " + n + " tokens against " + base +
                 ", and the structure is gone."
               : " through its own tokenizer: " + n + " tokens, every marker a single id."));
    }

    /* ---- controls ------------------------------------------------------ */
    var tb = tabs(f.controls, ["Llama 3", "Qwen 2.5"], 0, function (i) {
      tpl = i ? "Q" : "L"; render(); say();
    });
    var tgWrong = toggle(f.controls, "wrong tokenizer", false, function (v) {
      wrong = v; render();
      if (!v) { say(); return; }
      var n = cell(tokr(), gen).t.length, base = cell(tpl, gen).t.length;
      f.say("The template is still " + TPL[tpl] + "'s. Only the tokenizer changed, and the string " +
        "went from " + base + " tokens to " + n + ". Nothing raised, nothing logged.");
    });
    f.btn("add turn", function () {
      if (step >= 4) { f.say("All four turns are in. Now turn the wrong tokenizer on."); return; }
      step++; render(); say();
    });
    f.btn("back", function () {
      if (step <= 1) { f.say("The system message is the first thing the template writes."); return; }
      step--; render(); say();
    });
    var tgGen = toggle(f.controls, "generation prompt", true, function (v) {
      gen = v; render();
      f.say(v ? "The assistant header is back on the end. That fragment is the whole cue."
              : "Generation prompt off: the string stops after the last turn ended, and the model " +
                "has no reason to think the next word is its own.");
    });
    f.btn("reset", function () {
      tpl = "L"; wrong = false; step = 2; gen = true;
      tb.sync(0); tgWrong.set(false); tgGen.set(true);
      render();
      f.say("Watch a conversation become one flat string. Then break the template on purpose.");
    });

    render();
    f.say("Watch a conversation become one flat string. Then break the template on purpose.");
  };


  /* ========================================================================
     10. llmTokenBoundaries — CH 3 — Playground

     Eight strings through four real tokenizers, with the ids, measured with
     tiktoken 0.14.0 and transformers 5.17.0 on 12 September 2026. Every split
     the chapter prints comes back out of this data: 3478 as 34|78 under gpt2
     and 347|8 under cl100k and Llama, 1234567 as three tokens or seven,
     1,234,567 as six or five or nine, the four-space indent as five tokens or
     three, and \treturn as two.

     The flags are computed from the token list rather than stored, so they
     describe whatever is on screen. The rule that matters is the digit one: a
     number split across tokens is red unless every piece is a single digit,
     which is the one case where the boundaries and place value agree. That is
     Qwen's deliberate choice, and it is the only row of the section's figure
     that is not a failure.

     Whitespace markers default to on. Turning them off is the demonstration:
     the trailing space becomes invisible, which is how the bug survives.
     ======================================================================== */
  VIZ.llmTokenBoundaries = function (el) {
    var f = frame(el);

    var ENC = [
      { k: "g", name: "gpt2" }, { k: "c", name: "cl100k_base" },
      { k: "l", name: "Llama 3" }, { k: "q", name: "Qwen 2.5" }
    ];

    var DATA = [
      { s: "3478 * 29",
        g: [["34", 2682], ["78", 3695], [" *", 1635], [" 29", 2808]],
        c: [["347", 17678], ["8", 23], [" *", 353], [" ", 220], ["29", 1682]],
        l: [["347", 17678], ["8", 23], [" *", 353], [" ", 220], ["29", 1682]],
        q: [["3", 18], ["4", 19], ["7", 22], ["8", 23], [" *", 353], [" ", 220], ["2", 17], ["9", 24]],
      },
      { s: "1234567",
        g: [["123", 10163], ["45", 2231], ["67", 3134]],
        c: [["123", 4513], ["456", 10961], ["7", 22]],
        l: [["123", 4513], ["456", 10961], ["7", 22]],
        q: [["1", 16], ["2", 17], ["3", 18], ["4", 19], ["5", 20], ["6", 21], ["7", 22]],
      },
      { s: "1,234,567",
        g: [["1", 16], [",", 11], ["234", 24409], [",", 11], ["5", 20], ["67", 3134]],
        c: [["1", 16], [",", 11], ["234", 11727], [",", 11], ["567", 19282]],
        l: [["1", 16], [",", 11], ["234", 11727], [",", 11], ["567", 19282]],
        q: [["1", 16], [",", 11], ["2", 17], ["3", 18], ["4", 19], [",", 11], ["5", 20], ["6", 21], ["7", 22]],
      },
      { s: "$1,234,567.00",
        g: [["$", 3], ["1", 16], [",", 11], ["234", 24409], [",", 11], ["5", 20], ["67", 3134], [".", 13], ["00", 405]],
        c: [["$", 3], ["1", 16], [",", 11], ["234", 11727], [",", 11], ["567", 19282], [".", 13], ["00", 410]],
        l: [["$", 3], ["1", 16], [",", 11], ["234", 11727], [",", 11], ["567", 19282], [".", 13], ["00", 410]],
        q: [["$", 3], ["1", 16], [",", 11], ["2", 17], ["3", 18], ["4", 19], [",", 11], ["5", 20], ["6", 21], ["7", 22], [".", 13], ["0", 15], ["0", 15]],
      },
      { s: "    return x",
        g: [[" ", 220], [" ", 220], [" ", 220], [" return", 1441], [" x", 2124]],
        c: [["   ", 262], [" return", 471], [" x", 865]],
        l: [["   ", 262], [" return", 471], [" x", 865]],
        q: [["   ", 262], [" return", 470], [" x", 856]],
      },
      { s: "\treturn x",
        g: [["\t", 197], ["return", 7783], [" x", 2124]],
        c: [["\treturn", 862], [" x", 865]],
        l: [["\treturn", 862], [" x", 865]],
        q: [["\treturn", 853], [" x", 856]],
      },
      { s: "The capital of France is",
        g: [["The", 464], [" capital", 3139], [" of", 286], [" France", 4881], [" is", 318]],
        c: [["The", 791], [" capital", 6864], [" of", 315], [" France", 9822], [" is", 374]],
        l: [["The", 791], [" capital", 6864], [" of", 315], [" France", 9822], [" is", 374]],
        q: [["The", 785], [" capital", 6722], [" of", 315], [" France", 9625], [" is", 374]],
      },
      { s: "The capital of France is ",
        g: [["The", 464], [" capital", 3139], [" of", 286], [" France", 4881], [" is", 318], [" ", 220]],
        c: [["The", 791], [" capital", 6864], [" of", 315], [" France", 9822], [" is", 374], [" ", 220]],
        l: [["The", 791], [" capital", 6864], [" of", 315], [" France", 9822], [" is", 374], [" ", 220]],
        q: [["The", 785], [" capital", 6722], [" of", 315], [" France", 9625], [" is", 374], [" ", 220]],
      },
    ];

    var idx = 0, ei = 0, marks = true, unknown = "";

    function show(s) {
      return marks ? s.replace(/ /g, "·").replace(/\n/g, "⏎").replace(/\t/g, "⇥") : s;
    }
    function digits(s) { return /^[0-9]+$/.test(s); }
    function toks() { return DATA[idx][ENC[ei].k]; }

    /* Flags are read off the token list, not stored, so they describe exactly
       what is drawn. Each returns the class it paints a token. */
    function classify(list) {
      var cls = list.map(function () { return ""; }), notes = [], i, j;

      /* Every run of adjacent all-digit tokens is one number the tokenizer
         broke up. One note per kind, not one per run, or 1,234,567 says the
         same sentence twice. */
      var worst = null, single = 0;
      for (i = 0; i < list.length; i++) {
        if (!digits(list[i][0])) continue;
        for (j = i; j < list.length && digits(list[j][0]); j++) { /* find the run */ }
        if (j - i > 1) {
          var one = true, k;
          for (k = i; k < j; k++) if (list[k][0].length > 1) one = false;
          for (k = i; k < j; k++) cls[k] = one ? "ok" : "bad";
          if (one) single += j - i;
          else if (!worst || j - i > worst[1] - worst[0]) worst = [i, j];
        }
        i = j - 1;
      }
      if (worst) {
        var pieces = [];
        for (i = worst[0]; i < worst[1]; i++) pieces.push(list[i][0]);
        notes.push(["bad", "A number cut into " + pieces.length + ": " + pieces.join(" · ") +
                           ". Not one of those boundaries is a place value."]);
      }
      if (single) notes.push(["ok", "One token per digit: the boundaries agree with place " +
                                    "value, and " + single + " tokens is what that costs."]);

      var sp = 0;
      for (i = 0; i < list.length; i++) if (list[i][0] === " ") sp++;
      if (sp > 1) {
        for (i = 0; i < list.length; i++) if (list[i][0] === " ") cls[i] = "warn";
        notes.push(["warn", sp + " single-space tokens: this tokenizer has no entry for a run " +
                            "of spaces, so indentation costs one token each."]);
      }

      for (i = 1; i < list.length - 1; i++) {
        if (list[i][0] === "," && digits(list[i - 1][0]) && digits(list[i + 1][0])) {
          cls[i] = "warn";
          notes.push(["warn", "A comma inside a number: it takes a token of its own and splits " +
                              "the digits on either side into separate ones."]);
          break;
        }
      }

      for (i = 0; i < list.length; i++) {
        if (list[i][0].charAt(0) === "\t" && list[i][0].length > 1) {
          cls[i] = "ok";
          notes.push(["ok", "«" + show(list[i][0]) + "» is one entry here: the tab merged into the " +
                            "word, so this line costs two tokens rather than three."]);
          break;
        }
        if (list[i][0] === "\t") {
          cls[i] = "warn";
          notes.push(["warn", "The tab is a token all by itself here. The modern three hold «⇥return» " +
                              "as one entry and spend two tokens on this line."]);
          break;
        }
      }
      for (i = 0; i < list.length; i++) {
        if (/^ {2,}$/.test(list[i][0])) {
          cls[i] = "ok";
          notes.push(["ok", "«" + show(list[i][0]) + "» is one entry: a run of spaces costs one " +
                            "token here rather than one token per space."]);
          break;
        }
      }

      var last = list[list.length - 1][0];
      if (/\s$/.test(last)) {
        cls[list.length - 1] = "bad";
        notes.push(["bad", "The text ends in whitespace, so the next word must arrive without its " +
                           "leading space: «Paris», not «·Paris»."]);
        notes.push(["bad", "Under cl100k «hello» is id 15339 and «·hello» is 24748: two unrelated " +
                           "rows of the embedding table."]);
      }
      return { cls: cls, notes: notes };
    }

    var svg = S("svg", { viewBox: "0 0 760 430", width: "100%",
      role: "img", "aria-label": "tokens with ids, and the classic traps flagged" }, f.body);

    var TY0 = 82, PITCH = 40, MAXLN = 4;

    function render() {
      while (svg.firstChild) svg.removeChild(svg.firstChild);
      var list = toks(), e = ENC[ei], i;
      var fl = classify(list);

      T(svg, 8, 14, "one text, one tokenizer, every boundary",
        { anchor: "start", size: 11, fill: C.faint });
      T(svg, 752, 14, "measured with tiktoken 0.14.0 and transformers 5.17.0",
        { anchor: "end", size: 10, fill: C.faint });

      rect(svg, 8, 24, 744, 30, { rx: 6, stroke: unknown ? C.pink : C.line, sw: 1.2 });
      T(svg, 18, 39, show(unknown || DATA[idx].s) || "(empty)",
        { anchor: "start", size: 12.5, fill: unknown ? C.faint : C.text });
      T(svg, 744, 39, unknown ? "not measured"
          : list.length + " tokens under " + e.name,
        { anchor: "end", size: 10.5, fill: unknown ? C.pink : C.teal });

      T(svg, 8, 68, "token, and the id the model actually reads",
        { anchor: "start", size: 10.5, fill: C.faint });

      var L = wrapBoxes(list.map(function (t, i2) {
        var lab = show(t[0]) || "·", id = String(t[1]);
        return { lab: lab, id: id, c: fl.cls[i2],
                 w: 12 + Math.max(lab.length * 6.4, id.length * 5.6) };
      }), MAXLN);
      L.pos.forEach(function (b) {
        var yy = TY0 + b.ln * PITCH, tone = C.blue, op = 0.12;
        if (b.c === "bad") { tone = C.pink; op = 0.3; }
        else if (b.c === "warn") { tone = C.orange; op = 0.3; }
        else if (b.c === "ok") { tone = C.teal; op = 0.3; }
        rect(svg, b.x, yy, b.w, 21, { rx: 3, fill: tone, stroke: "none", op: op });
        T(svg, b.x + b.w / 2, yy + 10, b.lab, { size: 10.5, fill: C.text });
        T(svg, b.x + b.w / 2, yy + 30, b.id, { size: 9, fill: C.faint });
      });
      if (L.cut >= 0) T(svg, 752, TY0 + (L.lines - 1) * PITCH + 10,
        "+" + (list.length - L.cut) + " more", { anchor: "end", size: 9, fill: C.faint });

      /* ---- the flags ---- */
      var fy = TY0 + L.lines * PITCH + 8;
      if (!fl.notes.length) {
        T(svg, 8, fy, "Nothing to flag here: every boundary falls between words, which is the case " +
          "byte-pair encoding was built for.", { anchor: "start", size: 10.5, fill: C.dim });
        fy += 20;
      }
      fl.notes.slice(0, 3).forEach(function (n) {
        var tone = n[0] === "bad" ? C.pink : n[0] === "warn" ? C.orange : C.teal;
        rect(svg, 8, fy - 5, 5, 11, { rx: 2, fill: tone, stroke: "none", op: 0.85 });
        T(svg, 20, fy, n[1].slice(0, 114), { anchor: "start", size: 10.5, fill: tone });
        fy += 20;
      });

      T(svg, 8, fy + 8, marks
          ? "Middle dots are spaces. The model does not see them either, but it does see which token they belong to."
          : "Markers off. The trailing space is now invisible, which is how this bug gets through review.",
        { anchor: "start", size: 10, fill: marks ? C.faint : C.orange });

      svg.setAttribute("viewBox", "0 0 760 " + (fy + 26));
    }

    function say() {
      var list = toks(), fl = classify(list);
      f.say("«" + show(DATA[idx].s) + "» is " + list.length + " tokens under " + ENC[ei].name +
        (fl.notes.length ? ". " + fl.notes[0][1] : ", and nothing here is a trap."));
    }

    /* ---- controls ------------------------------------------------------ */
    var tb = tabs(f.controls, ["gpt2", "cl100k", "Llama 3", "Qwen 2.5"], 0, function (i) {
      ei = i; render(); say();
    });

    var sel = document.createElement("select");
    sel.setAttribute("aria-label", "text");
    sel.style.cssText = "font:12px ui-monospace,Menlo,monospace;padding:4px 6px;max-width:200px;" +
      "background:var(--bg-2);color:var(--text);border:1px solid var(--line);border-radius:6px";
    DATA.forEach(function (d, i) {
      var o = document.createElement("option");
      o.value = i;
      o.textContent = d.s.replace(/\t/g, "⇥").replace(/ /g, "·");
      sel.appendChild(o);
    });
    var input = document.createElement("input");
    input.type = "text"; input.value = DATA[0].s;
    input.setAttribute("aria-label", "text to tokenize");
    input.style.cssText = "font:12px ui-monospace,Menlo,monospace;padding:4px 6px;min-width:170px;" +
      "background:var(--bg-2);color:var(--text);border:1px solid var(--line);border-radius:6px";

    function pick(i) {
      idx = i; unknown = "";
      input.value = DATA[i].s; sel.value = String(i);
      render(); say();
    }
    sel.addEventListener("change", function () { pick(+sel.value); });
    f.controls.appendChild(sel);
    f.controls.appendChild(input);

    function apply() {
      var v = input.value, i;
      for (i = 0; i < DATA.length; i++) if (DATA[i].s === v) { pick(i); return; }
      unknown = v; render();
      f.say("No reading shipped for that exact text — trailing spaces count. Four merge tables " +
            "are far too large to ship, so the page carries " + DATA.length +
            " strings and the list beside the box has all of them.");
    }
    input.addEventListener("keydown", function (e) {
      if (e.key === "Enter") { e.preventDefault(); apply(); }
    });
    f.btn("tokenize it", apply);

    var tgMarks = toggle(f.controls, "show whitespace", true, function (v) {
      marks = v; render();
      f.say(v ? "Spaces are dots again."
              : "Markers off. Look at the last box: there is a token there you cannot see, and " +
                "that is the whole trailing-space bug.");
    });
    f.btn("reset", function () {
      ei = 0; marks = true; tb.sync(0); tgMarks.set(true);
      pick(0);
      f.say("Type a big number. Then type it with commas.");
    });

    render();
    f.say("Type a big number. Then type it with commas.");
  };


  /* ========================================================================
     11. llmEmbeddingSpace — CH 4 — Playground

     Real rows of a real embedding table: GPT-2's wte, 50,257 x 768, read on
     12 September 2026. A text's vector is the mean of its words' rows, which
     is section 1's object and nothing more.

     Shipping 768 numbers per word would be half a megabyte, and it is not
     needed. Every quantity this machine draws — norm, dot, cosine, Euclidean
     distance — is a bilinear function of the vectors, so the Gram matrix of
     the vocabulary is the entire geometry. 51 words, a 1,326-entry lower
     triangle, and any sentence the reader builds from those words gets its
     exact 768-dimensional numbers computed in the browser. Nothing here is
     approximate and nothing here is projected except the picture.

     The picture is honest too: each vector is drawn in the plane it shares
     with the query, so its length, its angle and its horizontal position are
     the true norm, the true angle and the true dot product. What is lost is
     only the relation between two texts that are neither the query.

     Two things fall out of the data and are the whole section. Against "a cat
     was sitting on a rug", the single word "cat" wins on dot product and
     comes fifth on cosine, because it is a longer vector rather than a nearer
     one. And "the cat sat on the mat" and "the mat sat on the cat" have
     cosine exactly 1.000, because a mean of word vectors has no word order —
     which is the argument for Chapter 4's second half.
     ======================================================================== */
  VIZ.llmEmbeddingSpace = function (el) {
    var f = frame(el);

    var WORDS = ["the", "a", "an", "and", "cat", "dog", "mat", "rug", "sat", "sitting", "was", "on", "under", "king", "queen", "man", "woman", "boy", "girl", "Paris", "France", "London", "England", "computer", "machine", "run", "running", "ran", "chased", "after", "puppy", "kitten", "stock", "market", "fell", "sharply", "rose", "bank", "river", "money", "boat", "water", "food", "ate", "slept", "big", "small", "red", "blue", "house", "tree"];
    /* lower triangle of the 51x51 Gram matrix of those rows, 3dp */
    var GT = [
      7.13, 5.76, 6.619, 5.014, 5.675, 6.12, 4.255, 3.902, 3.284, 6.778, 1.79, 1.945,
      2.111, 1.926, 10.613, 1.607, 1.733, 1.861, 1.774, 5.756, 10.328, 1.093, 1.246, 1.296,
      1.218, 3.037, 3.13, 12.492, 0.453, 0.679, 1.121, 0.783, 3.398, 3.898, 5.077, 16.988,
      1.611, 1.772, 1.901, 1.811, 2.784, 2.376, 3.14, 3.276, 10.74, 1.687, 1.698, 1.869,
      1.754, 2.214, 2.425, 2.633, 3.131, 5.723, 10.411, 3.334, 3.137, 2.858, 3.711, 2.332,
      2.177, 1.829, 1.954, 3.212, 2.121, 7.142, 3.804, 3.584, 3.114, 3.957, 1.716, 1.75,
      1.343, 0.947, 1.85, 2.245, 3.169, 6.114, 2.615, 2.562, 2.48, 2.776, 1.895, 1.794,
      1.804, 2.401, 1.562, 1.988, 2.4, 3.173, 7.834, 1.406, 1.44, 1.726, 1.496, 2.922,
      2.968, 2.799, 3.345, 2.896, 3.493, 2.326, 1.68, 1.841, 11.691, 0.78, 1.085, 1.548,
      1.085, 3.509, 3.0, 3.692, 4.175, 2.711, 2.873, 2.206, 1.373, 1.876, 8.506, 14.326,
      2.494, 2.447, 2.256, 2.579, 3.163, 3.408, 2.567, 2.118, 2.284, 2.607, 2.864, 2.456,
      1.901, 3.82, 2.764, 9.291, 1.533, 1.679, 1.76, 1.834, 3.281, 3.639, 3.293, 3.332,
      2.271, 3.076, 2.681, 1.81, 1.848, 3.214, 5.465, 6.278, 10.247, 1.363, 1.445, 1.449,
      1.569, 3.372, 4.261, 2.954, 3.234, 2.412, 2.678, 2.282, 1.814, 2.036, 4.016, 3.589,
      5.643, 5.267, 11.081, 1.201, 1.448, 1.519, 1.66, 3.904, 3.96, 3.364, 3.565, 2.317,
      2.713, 2.553, 1.763, 2.039, 3.799, 5.6, 4.707, 7.792, 7.976, 11.092, 1.698, 1.63,
      1.963, 1.487, 3.001, 2.24, 2.267, 2.769, 2.651, 2.728, 1.917, 1.71, 1.782, 2.599,
      3.178, 2.435, 2.814, 2.713, 3.042, 11.461, 1.91, 1.759, 2.03, 1.455, 2.705, 2.595,
      1.884, 2.424, 1.86, 2.042, 1.99, 1.54, 2.084, 3.023, 3.51, 2.289, 2.866, 2.954,
      2.83, 7.186, 11.194, 1.963, 1.791, 2.039, 1.705, 3.188, 2.296, 1.842, 2.068, 2.362,
      2.44, 2.058, 1.677, 1.677, 2.751, 3.009, 2.455, 2.611, 2.546, 2.601, 6.244, 4.852,
      10.152, 1.761, 1.592, 1.853, 1.453, 2.524, 2.433, 1.897, 2.241, 2.08, 2.271, 1.951,
      1.418, 1.939, 3.18, 3.18, 2.725, 2.826, 3.236, 3.222, 4.5, 6.995, 6.093, 11.397,
      1.807, 1.918, 1.943, 1.843, 3.244, 2.983, 2.485, 2.852, 2.108, 2.413, 2.042, 1.706,
      1.821, 2.108, 2.157, 2.427, 2.767, 2.919, 3.116, 1.896, 1.95, 2.105, 2.095, 9.372,
      1.709, 1.732, 1.73, 1.935, 3.282, 3.437, 2.73, 2.975, 2.385, 2.497, 2.278, 1.931,
      1.721, 3.03, 3.136, 3.023, 3.324, 3.159, 3.038, 1.796, 2.417, 2.14, 2.123, 5.667,
      12.185, 2.052, 2.171, 2.097, 2.262, 2.555, 2.458, 1.818, 2.38, 2.153, 2.253, 2.346,
      2.228, 1.928, 2.059, 2.237, 2.35, 1.956, 2.392, 2.093, 1.874, 1.807, 2.211, 1.811,
      2.417, 2.748, 10.061, 2.183, 2.2, 2.103, 2.236, 2.549, 2.521, 1.868, 2.135, 2.447,
      4.185, 2.297, 2.57, 2.441, 2.419, 2.538, 2.062, 2.089, 2.078, 2.016, 1.929, 1.927,
      2.393, 1.912, 2.711, 2.941, 6.197, 9.619, 1.477, 1.688, 1.85, 1.885, 2.94, 2.561,
      2.596, 3.336, 4.074, 2.845, 4.169, 1.906, 1.924, 2.618, 3.187, 2.257, 2.663, 2.853,
      2.637, 2.386, 2.443, 2.605, 2.17, 2.475, 3.086, 6.947, 6.276, 10.185, 0.759, 1.119,
      1.667, 1.045, 3.485, 3.364, 2.463, 4.016, 4.117, 3.594, 2.677, 1.452, 1.965, 3.448,
      4.025, 2.503, 3.16, 3.692, 3.555, 3.744, 3.486, 3.108, 3.179, 2.361, 2.856, 3.421,
      3.574, 5.633, 11.862, 3.038, 2.896, 2.645, 3.191, 1.777, 1.872, 1.725, 1.962, 1.641,
      2.109, 2.984, 3.442, 3.053, 1.871, 1.938, 2.018, 2.091, 2.244, 2.177, 1.567, 1.932,
      1.76, 1.879, 2.003, 2.067, 2.115, 2.28, 2.122, 2.513, 6.89, 0.511, 0.853, 1.367,
      0.832, 4.794, 7.516, 3.061, 5.295, 2.558, 3.088, 1.775, 1.065, 1.967, 3.728, 4.622,
      2.788, 4.034, 5.233, 5.593, 2.883, 3.149, 2.511, 3.756, 2.441, 3.16, 2.414, 2.914,
      3.17, 4.638, 2.08, 14.165, 0.299, 0.929, 1.543, 0.705, 6.53, 6.133, 3.552, 4.899,
      2.775, 3.131, 1.879, 1.19, 1.776, 4.31, 6.019, 2.777, 4.61, 5.324, 5.756, 3.224,
      3.583, 3.718, 2.906, 2.974, 3.188, 2.433, 3.08, 3.634, 5.042, 1.941, 9.303, 15.992,
      1.756, 1.925, 1.922, 1.785, 2.311, 2.542, 1.84, 2.691, 2.63, 2.875, 2.056, 1.913,
      2.313, 2.494, 2.111, 2.005, 1.895, 2.24, 2.407, 3.022, 2.251, 2.43, 1.792, 2.636,
      2.486, 2.448, 2.728, 2.674, 2.36, 1.804, 3.181, 3.09, 12.291, 1.837, 1.871, 1.913,
      2.002, 2.623, 2.576, 2.542, 3.08, 2.098, 2.129, 2.174, 1.612, 2.033, 2.479, 2.411,
      2.38, 2.462, 2.007, 2.266, 2.703, 2.296, 2.655, 2.062, 2.618, 2.927, 2.395, 2.055,
      2.372, 2.645, 1.985, 2.803, 2.28, 4.209, 10.69, 1.405, 1.415, 1.604, 1.706, 2.522,
      2.731, 2.434, 2.971, 3.645, 3.15, 3.757, 1.609, 2.234, 2.855, 2.761, 2.999, 3.156,
      3.37, 3.309, 2.302, 2.508, 2.484, 2.579, 2.294, 2.38, 2.246, 2.29, 4.583, 4.133,
      2.316, 2.711, 3.19, 2.167, 2.42, 9.434, 0.74, 0.893, 1.363, 0.695, 2.362, 2.892,
      2.179, 3.707, 1.92, 2.065, 1.697, 1.223, 1.842, 2.914, 2.356, 1.761, 2.658, 3.219,
      3.007, 2.677, 3.061, 2.194, 2.873, 2.522, 2.187, 1.809, 1.949, 2.868, 3.826, 1.888,
      3.762, 4.26, 2.484, 2.193, 3.005, 11.781, 1.077, 1.169, 1.556, 1.583, 2.77, 2.399,
      2.873, 3.861, 4.387, 2.494, 3.351, 1.414, 1.833, 3.399, 3.662, 2.51, 3.33, 2.894,
      3.434, 3.113, 2.948, 2.474, 2.632, 2.33, 2.861, 1.642, 1.987, 4.034, 3.548, 1.847,
      3.051, 3.646, 2.633, 2.065, 5.484, 3.851, 11.094, 1.425, 1.518, 1.652, 1.603, 2.555,
      2.319, 2.307, 2.932, 2.216, 2.563, 2.0, 1.548, 1.566, 2.934, 2.725, 2.126, 2.696,
      2.564, 2.62, 2.624, 2.439, 2.771, 2.181, 3.632, 3.267, 2.685, 2.556, 2.902, 3.194,
      1.758, 2.335, 3.105, 3.795, 3.279, 2.189, 2.573, 2.42, 10.804, 1.292, 1.29, 1.495,
      1.42, 2.836, 3.518, 3.071, 4.49, 2.71, 2.791, 2.119, 1.586, 1.722, 4.032, 3.722,
      2.788, 3.283, 3.135, 3.468, 2.584, 2.288, 2.599, 2.543, 2.765, 2.938, 2.199, 2.551,
      2.969, 3.609, 1.836, 3.573, 3.652, 2.717, 3.418, 3.111, 3.158, 3.401, 4.335, 10.986,
      2.364, 2.431, 2.409, 2.067, 2.546, 2.843, 2.457, 3.201, 2.463, 2.43, 2.425, 2.0,
      1.95, 3.221, 2.544, 3.078, 2.961, 2.64, 2.856, 2.722, 2.857, 2.856, 2.96, 2.94,
      3.037, 2.502, 2.637, 2.85, 2.824, 2.192, 3.013, 2.945, 2.956, 3.592, 2.556, 2.219,
      2.61, 4.058, 3.029, 9.932, 1.171, 1.431, 1.574, 1.427, 3.947, 4.019, 2.8, 4.336,
      2.038, 2.744, 2.147, 1.53, 1.767, 3.494, 3.373, 2.657, 3.246, 3.457, 3.569, 2.58,
      2.798, 2.433, 2.809, 3.137, 3.662, 2.417, 2.479, 3.04, 3.913, 2.104, 4.142, 4.445,
      3.057, 2.861, 2.458, 2.915, 2.66, 3.994, 5.724, 3.089, 12.006, 2.538, 2.522, 2.409,
      2.338, 2.812, 2.635, 2.108, 2.514, 2.044, 2.101, 2.506, 2.295, 2.04, 2.476, 2.556,
      2.432, 2.729, 2.393, 2.64, 2.215, 2.122, 2.251, 2.27, 2.675, 2.774, 2.264, 2.89,
      2.504, 2.484, 2.272, 2.302, 2.154, 2.986, 2.423, 2.268, 2.332, 2.797, 3.318, 5.335,
      3.287, 4.449, 9.278, 2.406, 2.457, 2.573, 2.349, 3.078, 3.13, 1.799, 3.238, 2.502,
      2.567, 2.36, 2.104, 2.37, 2.546, 3.034, 2.346, 2.796, 2.346, 2.885, 2.744, 2.815,
      2.351, 2.183, 2.774, 2.352, 2.005, 2.494, 2.308, 2.695, 2.372, 3.265, 3.065, 2.916,
      2.934, 2.006, 1.95, 2.325, 2.541, 2.918, 3.829, 2.98, 4.311, 9.721, 0.94, 1.086,
      1.635, 1.385, 3.31, 3.335, 2.909, 4.179, 4.557, 3.532, 3.418, 1.471, 1.747, 3.419,
      4.197, 2.348, 3.049, 3.12, 3.409, 3.243, 3.281, 2.503, 3.226, 1.917, 2.536, 2.173,
      2.429, 5.463, 6.008, 2.226, 4.244, 4.646, 2.208, 2.623, 4.726, 3.198, 4.603, 2.337,
      3.087, 2.698, 3.371, 2.405, 5.604, 12.938, 0.39, 0.728, 1.291, 0.891, 3.351, 2.965,
      3.119, 5.619, 5.295, 4.082, 3.244, 1.426, 2.134, 4.065, 5.116, 2.536, 3.787, 3.963,
      4.314, 3.375, 2.983, 2.831, 3.357, 2.519, 2.508, 2.469, 2.575, 5.086, 5.85, 1.968,
      4.331, 4.886, 2.408, 2.092, 4.875, 3.154, 4.532, 2.604, 3.659, 3.032, 3.619, 2.502,
      2.932, 7.609, 14.375, 2.651, 2.673, 2.376, 2.272, 2.488, 2.322, 1.966, 2.524, 2.131,
      2.226, 2.344, 2.249, 1.814, 2.767, 2.165, 2.568, 2.504, 2.3, 2.633, 2.298, 1.981,
      2.293, 1.974, 2.559, 2.932, 2.435, 2.477, 2.164, 2.168, 1.967, 2.387, 1.901, 2.461,
      2.55, 2.125, 2.32, 2.02, 2.345, 2.543, 3.443, 2.81, 2.307, 2.611, 2.152, 1.991,
      8.236, 2.741, 2.773, 2.517, 2.232, 2.497, 2.342, 1.635, 2.321, 2.219, 2.348, 2.313,
      2.079, 2.143, 2.137, 2.092, 2.425, 2.78, 2.442, 2.647, 1.872, 2.0, 2.12, 1.618,
      2.354, 2.69, 2.431, 2.241, 2.158, 2.011, 1.952, 2.466, 2.466, 1.92, 2.446, 1.908,
      2.099, 2.08, 2.422, 2.533, 2.748, 2.554, 2.784, 2.868, 1.793, 1.629, 4.844, 8.01,
      2.421, 2.392, 2.234, 2.214, 2.663, 2.29, 2.075, 2.46, 2.617, 2.3, 2.337, 2.151,
      2.07, 2.18, 2.436, 2.465, 2.405, 2.266, 2.354, 2.045, 1.641, 2.365, 2.356, 2.337,
      1.925, 2.27, 2.452, 2.469, 2.531, 2.286, 1.894, 2.619, 2.238, 1.756, 2.261, 2.662,
      2.971, 2.038, 3.035, 2.439, 2.263, 2.87, 2.312, 1.947, 1.862, 3.113, 2.506, 8.969,
      2.107, 2.179, 2.17, 1.955, 2.566, 2.783, 2.066, 2.826, 2.424, 2.751, 2.261, 2.033,
      2.072, 2.752, 2.744, 2.302, 2.653, 2.976, 2.763, 2.259, 2.449, 2.491, 2.239, 2.594,
      2.819, 2.233, 2.591, 2.467, 3.085, 2.09, 3.354, 3.426, 2.576, 1.823, 2.426, 2.894,
      2.971, 2.28, 2.994, 2.647, 3.454, 2.76, 2.344, 2.049, 2.471, 3.233, 3.108, 5.991,
      9.771, 2.052, 2.058, 2.018, 2.184, 3.222, 3.298, 2.603, 3.426, 2.406, 3.177, 2.302,
      2.158, 2.037, 3.177, 3.178, 3.04, 3.448, 3.322, 3.596, 2.438, 2.58, 3.022, 2.725,
      3.182, 3.306, 2.703, 2.417, 2.491, 2.182, 2.31, 3.02, 3.261, 3.34, 2.66, 2.437,
      2.124, 2.578, 3.458, 3.102, 2.914, 4.091, 3.259, 3.3, 2.249, 2.919, 2.42, 2.554,
      2.3, 2.599, 10.317, 1.364, 1.489, 1.619, 1.701, 2.959, 3.788, 3.222, 4.344, 2.664,
      2.779, 2.171, 1.629, 1.683, 3.04, 2.999, 2.986, 3.174, 3.277, 2.921, 2.259, 1.619,
      1.685, 1.684, 3.274, 3.445, 2.388, 2.348, 2.735, 3.293, 1.753, 3.382, 3.954, 2.671,
      2.598, 3.034, 3.1, 3.31, 3.26, 4.845, 1.95, 3.918, 2.745, 2.855, 3.016, 3.48,
      2.312, 2.274, 2.897, 3.097, 3.695, 11.499
    ];
    var PRESETS = ["the cat sat on the mat", "a cat was sitting on a rug", "the mat sat on the cat", "the dog chased the cat", "the stock market fell sharply", "cat", "king", "queen"];

    var IDX = {};
    WORDS.forEach(function (w, i) { IDX[w.toLowerCase()] = i; });
    function G(i, j) { return i >= j ? GT[i * (i + 1) / 2 + j] : GT[j * (j + 1) / 2 + i]; }

    /* A text is a bag of word rows, so every inner product is a mean over the
       Gram matrix. Exact in 768 dimensions, from 1,326 shipped numbers. */
    function bag(s) {
      var out = [], ws = s.toLowerCase().split(/\s+/), i;
      for (i = 0; i < ws.length; i++) {
        if (!ws[i]) continue;
        if (!(ws[i] in IDX)) return { bad: ws[i] };
        out.push(IDX[ws[i]]);
      }
      return out.length ? { ids: out } : { bad: "" };
    }
    function dot(a, b) {
      var s = 0, i, j;
      for (i = 0; i < a.length; i++) for (j = 0; j < b.length; j++) s += G(a[i], b[j]);
      return s / (a.length * b.length);
    }

    var texts = PRESETS.map(function (s) {
      var b = bag(s).ids;
      return { s: s, ids: b, n: Math.sqrt(dot(b, b)) };
    });
    var LET = "ABCDEFGHIJKL";
    var qi = 1, metric = 0, unit = false;          // default query is the paraphrase
    var METRICS = ["dot product", "cosine", "Euclidean"];

    function pair(a, b) {
      var d = dot(a.ids, b.ids), c = d / (a.n * b.n);
      if (unit) return { d: c, c: c, e: Math.sqrt(Math.max(0, 2 - 2 * c)) };
      return { d: d, c: c, e: Math.sqrt(Math.max(0, a.n * a.n + b.n * b.n - 2 * d)) };
    }
    function score(p) { return metric === 0 ? p.d : metric === 1 ? p.c : p.e; }
    function ranked(by) {
      var q = texts[qi];
      var rows = texts.map(function (t, i) { return { i: i, t: t, p: pair(q, t) }; })
                      .filter(function (r) { return r.i !== qi; });
      rows.sort(function (x, y) {
        var a = by === 2 ? x.p.e : by === 1 ? x.p.c : x.p.d;
        var b = by === 2 ? y.p.e : by === 1 ? y.p.c : y.p.d;
        return by === 2 ? a - b : b - a;
      });
      return rows;
    }
    function fmt(v) { return (v < 0 ? "" : " ") + v.toFixed(3); }

    var svg = S("svg", { viewBox: "0 0 760 380", width: "100%",
      role: "img", "aria-label": "texts as vectors, and three ways to score them" }, f.body);

    var OX = 66, OY = 268, PW = 300, PH = 205;     // plane origin and extent

    function render() {
      while (svg.firstChild) svg.removeChild(svg.firstChild);
      var q = texts[qi], rows = ranked(metric), i;

      /* One isotropic scale, or the angles stop being the angles. Every point
         is drawn above the axis, so the plane needs half the height it would
         otherwise and the picture still reads as the section's figure. */
      var ql0 = unit ? 1 : q.n, mx = ql0, my = 0.001;
      var pts = texts.map(function (t, k) {
        if (k === qi) return null;
        var p = pair(q, t), len = unit ? 1 : t.n, x = p.c * len;
        var y = Math.sqrt(Math.max(0, len * len - x * x));
        mx = Math.max(mx, x); my = Math.max(my, y);
        return { x: x, y: y, k: k };
      });
      var sc = Math.min(PW / mx, PH / my);

      T(svg, 8, 14, "GPT-2's embedding table: 50,257 rows of 768 numbers",
        { anchor: "start", size: 11, fill: C.faint });
      T(svg, 752, 14, "every number below is the real 768 dimensions",
        { anchor: "end", size: 10, fill: C.faint });
      T(svg, 8, 34, "query  " + LET.charAt(qi) + "  «" + q.s + "»" +
        (unit ? "   normalized" : "   |q| = " + q.n.toFixed(3)),
        { anchor: "start", size: 11.5, fill: C.blue });

      /* ---- the plane ---- */
      line(svg, OX - 10, OY, OX + PW + 14, OY, { stroke: C.line, sw: 1.2 });
      line(svg, OX, OY + 10, OX, OY - PH - 6, { stroke: C.line, sw: 1.2 });
      T(svg, OX + PW + 14, OY + 18, unit ? "cosine with the query" : "dot with the query direction",
        { anchor: "end", size: 9, fill: C.faint });
      if (unit) {
        S("path", { d: "M " + (OX + sc) + " " + OY + " A " + sc + " " + sc + " 0 0 0 " +
          OX + " " + (OY - sc), fill: "none", stroke: C.line,
          "stroke-width": 1, "stroke-dasharray": "3 3" }, svg);
      }

      var ql = ql0 * sc;
      line(svg, OX, OY, OX + ql, OY, { stroke: C.blue, sw: 2.5 });
      T(svg, OX + ql + 9, OY + 12, LET.charAt(qi), { size: 10.5, fill: C.blue });

      /* Two texts with the same bag of words land on the same point — that is
         the section's discovery, not a bug — so labels stack instead of
         overprinting. */
      var placed = [];
      pts.forEach(function (p) {
        if (!p) return;
        var px = OX + p.x * sc, py = OY - p.y * sc;
        var hot = rows.length && rows[0].i === p.k;
        line(svg, OX, OY, px, py, { stroke: hot ? C.orange : C.dim, sw: hot ? 2 : 1.2,
          op: hot ? 1 : 0.6 });
        S("circle", { cx: px, cy: py, r: 3, fill: hot ? C.orange : C.dim }, svg);
        var lx = px + 9, ly = py - 6, n = 0;
        while (placed.some(function (o) {
          return Math.abs(o[0] - lx) < 9 && Math.abs(o[1] - ly) < 12;
        }) && n++ < 6) ly += 13;
        placed.push([lx, ly]);
        T(svg, lx, ly, LET.charAt(p.k), { size: 10.5, fill: hot ? C.orange : C.dim });
      });

      /* ---- the ranking ---- */
      var RX = 398, ry = 56;
      T(svg, RX, ry - 16, "ranked by " + METRICS[metric] +
        (metric === 2 ? ", nearest first" : ", highest first"),
        { anchor: "start", size: 10.5, fill: C.faint });
      var cosOrder = ranked(1).map(function (r) { return r.i; });
      rows.forEach(function (r, k) {
        var moved = cosOrder.indexOf(r.i) !== k;
        var lab = r.t.s.length > 30 ? r.t.s.slice(0, 29) + "…" : r.t.s;
        T(svg, RX, ry, LET.charAt(r.i), { anchor: "start", size: 10.5,
          fill: k === 0 ? C.orange : C.faint });
        T(svg, RX + 14, ry, lab, { anchor: "start", size: 10.5,
          fill: k === 0 ? C.orange : C.dim });
        T(svg, 752, ry, fmt(score(r.p)), { anchor: "end", size: 10.5,
          fill: moved && metric !== 1 ? C.pink : k === 0 ? C.orange : C.text });
        ry += 21;
      });
      if (metric !== 1) {
        T(svg, RX, ry + 4, unit ? "Same order as cosine, necessarily."
            : "Pink: a text this metric ranks somewhere cosine does not.",
          { anchor: "start", size: 9.5, fill: unit ? C.teal : C.pink });
        ry += 10;
      }

      /* ---- what the two panels are saying ---- */
      var fy = Math.max(OY + 30, ry + 22);       // the ranking can outgrow the plane
      var top = rows[0], cosTop = ranked(1)[0];
      T(svg, 8, fy, unit
          ? "Normalized: every vector sits on the circle, dot equals cosine, and Euclidean is sqrt(2 − 2cos). All three rank alike."
          : metric === 1
            ? "Cosine ignores length entirely: «" + cosTop.t.s.slice(0, 34) + "» is the nearest in angle."
            : top.i !== cosTop.i
              ? "«" + top.t.s.slice(0, 22) + "» wins here and «" + cosTop.t.s.slice(0, 22) +
                "» wins on cosine. Same vectors, opposite answers."
              : "This metric and cosine agree on the winner here. Try «cat» as a candidate against a sentence.",
        { anchor: "start", size: 10.5, fill: unit ? C.teal : top.i !== cosTop.i ? C.orange : C.dim });

      var a = texts[0], b = null;
      texts.forEach(function (t, k) {
        if (k && t.ids.length === a.ids.length && Math.abs(dot(a.ids, t.ids) - a.n * a.n) < 2e-3) b = t;
      });
      T(svg, 8, fy + 20, b
          ? "«" + a.s + "» and «" + b.s + "» have cosine 1.000: a mean of word rows has no word order."
          : "A text's vector here is the mean of its words' rows, so two texts with the same words are the same point.",
        { anchor: "start", size: 10.5, fill: b ? C.pink : C.faint });
      T(svg, 8, fy + 40, "Lengths and angles in the plane are exact; only the relation between two " +
        "non-query texts is lost by drawing it flat.",
        { anchor: "start", size: 9.5, fill: C.faint });

      svg.setAttribute("viewBox", "0 0 760 " + (fy + 56));
    }

    function say() {
      var rows = ranked(metric), q = texts[qi];
      f.say("Against «" + q.s + "», " + METRICS[metric] + " puts «" + rows[0].t.s +
        "» first at " + score(rows[0].p).toFixed(3) + ".");
    }

    /* ---- controls ------------------------------------------------------ */
    var sel = document.createElement("select");
    sel.setAttribute("aria-label", "query text");
    sel.style.cssText = "font:12px ui-monospace,Menlo,monospace;padding:4px 6px;max-width:210px;" +
      "background:var(--bg-2);color:var(--text);border:1px solid var(--line);border-radius:6px";
    function fillSel() {
      while (sel.firstChild) sel.removeChild(sel.firstChild);
      texts.forEach(function (t, i) {
        var o = document.createElement("option");
        o.value = i; o.textContent = LET.charAt(i) + "  " + t.s;
        sel.appendChild(o);
      });
      sel.value = String(qi);
    }
    sel.addEventListener("change", function () { qi = +sel.value; render(); say(); });
    f.controls.appendChild(sel);

    var mt = tabs(f.controls, ["dot", "cosine", "Euclidean"], 0, function (i) {
      metric = i; render(); say();
    });

    var input = document.createElement("input");
    input.type = "text"; input.value = "";
    input.placeholder = "a sentence from the 51 words";
    input.setAttribute("aria-label", "text to add");
    input.style.cssText = "font:12px ui-monospace,Menlo,monospace;padding:4px 6px;min-width:190px;" +
      "background:var(--bg-2);color:var(--text);border:1px solid var(--line);border-radius:6px";
    f.controls.appendChild(input);

    function add() {
      if (texts.length >= LET.length) {
        f.say("Twelve texts is as many as the plane can label. Press reset to start again."); return;
      }
      var b = bag(input.value);
      if (b.bad !== undefined) {
        f.say(b.bad
          ? "«" + b.bad + "» is not one of the 51 words whose rows are shipped. The table has 50,257 " +
            "rows and this page carries 51 of them: " + WORDS.slice(0, 12).join(", ") + ", and 39 more."
          : "Type a sentence first, using the shipped words.");
        return;
      }
      texts.push({ s: input.value.toLowerCase().replace(/\s+/g, " ").trim(),
                   ids: b.ids, n: Math.sqrt(dot(b.ids, b.ids)) });
      input.value = ""; fillSel(); render();
      var t = texts[texts.length - 1];
      f.say("Added " + LET.charAt(texts.length - 1) + ": " + t.ids.length +
        " word rows averaged, |v| = " + t.n.toFixed(3) + ".");
    }
    input.addEventListener("keydown", function (e) {
      if (e.key === "Enter") { e.preventDefault(); add(); }
    });
    f.btn("add text", add);

    var tgUnit = toggle(f.controls, "normalize", false, function (v) {
      unit = v; render();
      f.say(v ? "Every vector scaled to length 1. The dot product is now the cosine, and Euclidean " +
                "is sqrt(2 − 2cos), so the three metrics cannot disagree."
              : "Lengths are back. Now the dot product can prefer a long vector pointing the wrong way.");
    });
    f.btn("reset", function () {
      texts = PRESETS.map(function (s) {
        var b = bag(s).ids;
        return { s: s, ids: b, n: Math.sqrt(dot(b, b)) };
      });
      qi = 1; metric = 0; unit = false;
      mt.sync(0); tgUnit.set(false); fillSel(); render();
      f.say("Add two sentences that mean the same thing. Then add one that only shares words.");
    });

    fillSel();
    render();
    f.say("Add two sentences that mean the same thing. Then add one that only shares words.");
  };


  /* ========================================================================
     12. llmContrastive — CH 4 — Stepper

     Nothing is precomputed here: the InfoNCE loss and its gradients are the
     real thing, evaluated in the browser every step.

     The one simplification, and it is deliberate: the embeddings live on a
     circle and gradient descent runs on the angles themselves rather than
     through an encoder's weights. Normalized embeddings really are points on
     a sphere, cosine similarity really is cos of the angle between them, and
     the derivative of the loss with respect to a point is exact — so what
     moves on screen is what the gradient says, not an animation of it. What
     a real bi-encoder adds is that the points can only move as far as shared
     weights allow them to.

     The section's claim is the readout on the right: an easy negative is
     already correct, so its softmax weight is near zero and it contributes
     almost no gradient. Slide the hard negative up against an anchor and its
     bar grows past the sum of the three random ones put together.
     ======================================================================== */
  VIZ.llmContrastive = function (el) {
    var f = frame(el);

    var TAU = 0.1, LR = 0.02, NP = 3, NN = 3;
    var A0 = [0.00, 2.09, 4.19], P0 = [0.18, 2.27, 4.37];
    var N0 = [5.33, 1.13, 3.23];              // negative 0 is the one that moves

    var A, P, N, loss = [], steps = 0, inBatch = true;
    function init() {
      A = A0.slice(); P = P0.slice(); N = N0.slice();
      loss = []; steps = 0;
    }

    /* InfoNCE over cosine similarities, which on a circle is cos of the angle
       difference. Returns the mean loss and the gradient on every point. */
    function pass() {
      var gA = [0, 0, 0], gP = [0, 0, 0], gN = [0, 0, 0], total = 0, i, k;
      var work = [0, 0, 0], ib = 0;           // |gradient| each negative earned
      for (i = 0; i < NP; i++) {
        var cand = [{ a: P[i], g: gP, j: i }];
        if (inBatch) for (k = 0; k < NP; k++) if (k !== i) cand.push({ a: P[k], g: gP, j: k, ib: 1 });
        for (k = 0; k < NN; k++) cand.push({ a: N[k], g: gN, j: k, neg: k });

        var lg = cand.map(function (c) { return Math.cos(A[i] - c.a) / TAU; });
        var m = Math.max.apply(null, lg), z = 0;
        var w = lg.map(function (v) { var e = Math.exp(v - m); z += e; return e; });
        for (k = 0; k < w.length; k++) w[k] /= z;
        total += -Math.log(Math.max(w[0], 1e-12));

        for (k = 0; k < cand.length; k++) {
          var c = cand[k], d = (w[k] - (k === 0 ? 1 : 0)) / TAU, sn = Math.sin(A[i] - c.a);
          gA[i] += d * -sn;
          c.g[c.j] += d * sn;
          if (c.neg !== undefined) work[c.neg] += Math.abs(d * sn);
          else if (c.ib) ib += Math.abs(d * sn);
        }
      }
      return { L: total / NP, gA: gA, gP: gP, gN: gN, work: work, ib: ib };
    }

    function step() {
      var r = pass(), i;
      for (i = 0; i < NP; i++) { A[i] -= LR * r.gA[i]; P[i] -= LR * r.gP[i]; }
      for (i = 0; i < NN; i++) N[i] -= LR * r.gN[i];
      var TWO = Math.PI * 2;                  // keep the slider's number readable
      for (i = 0; i < NP; i++) { A[i] = (A[i] % TWO + TWO) % TWO; P[i] = (P[i] % TWO + TWO) % TWO; }
      for (i = 0; i < NN; i++) N[i] = (N[i] % TWO + TWO) % TWO;
      steps++;
      loss.push(pass().L);
      if (loss.length > 120) loss.shift();
    }

    var svg = S("svg", { viewBox: "0 0 760 360", width: "100%",
      role: "img", "aria-label": "contrastive training on a circle" }, f.body);

    var CX = 176, CY = 170, R = 100;
    function px(t) { return CX + R * Math.cos(t); }
    function py(t) { return CY - R * Math.sin(t); }

    function render() {
      while (svg.firstChild) svg.removeChild(svg.firstChild);
      var r = pass(), i;

      T(svg, 8, 14, "InfoNCE on normalized embeddings, computed here, not replayed",
        { anchor: "start", size: 11, fill: C.faint });
      T(svg, 752, 14, "temperature " + TAU + ", step " + LR + ", " + steps + " steps taken",
        { anchor: "end", size: 10, fill: C.faint });

      S("circle", { cx: CX, cy: CY, r: R, fill: "none", stroke: C.line,
        "stroke-width": 1, "stroke-dasharray": "3 3" }, svg);

      /* The gradient on a point is tangent to the circle, so draw it as one. */
      function arrow(t, g, tone) {
        var len = Math.max(-26, Math.min(26, -g * 2.2));
        if (Math.abs(len) < 1.5) return;
        var tx = -Math.sin(t), ty = -Math.cos(t);          // tangent, screen y down
        line(svg, px(t), py(t), px(t) + tx * len, py(t) + ty * len,
          { stroke: tone, sw: 2, op: 0.9 });
      }
      function dot2(t, tone, rad, lab, labTone) {
        S("circle", { cx: px(t), cy: py(t), r: rad, fill: tone }, svg);
        if (lab) T(svg, CX + (R + 20) * Math.cos(t), CY - (R + 20) * Math.sin(t), lab,
          { size: 9.5, fill: labTone || tone });
      }
      for (i = 0; i < NP; i++) {
        line(svg, px(A[i]), py(A[i]), px(P[i]), py(P[i]),
          { stroke: C.teal, sw: 1, dash: "3 3", op: 0.7 });
        arrow(A[i], r.gA[i], C.blue);
        arrow(P[i], r.gP[i], C.teal);
        dot2(A[i], C.blue, 5, "a" + (i + 1));
        dot2(P[i], C.teal, 5, "p" + (i + 1));
      }
      for (i = 0; i < NN; i++) {
        arrow(N[i], r.gN[i], C.pink);
        dot2(N[i], i ? C.dim : C.pink, i ? 4 : 5.5, "n" + (i + 1), i ? C.faint : C.pink);
      }
      T(svg, CX, CY - 6, "loss " + r.L.toFixed(3), { size: 13, fill: C.text });
      T(svg, CX, CY + 12, steps ? "after " + steps + " steps" : "before training",
        { size: 9.5, fill: C.faint });

      /* ---- the work each negative did ---- */
      var RX = 372, ry = 44;
      T(svg, RX, ry - 14, "gradient each negative produced",
        { anchor: "start", size: 10.5, fill: C.faint });
      var bars = [["hard negative n1", r.work[0], 1], ["random negative n2", r.work[1], 0],
                  ["random negative n3", r.work[2], 0],
                  [inBatch ? "the other pairs' positives" : "in-batch negatives, off", r.ib, 0]];
      var wmax = 0.02, rest = r.work[1] + r.work[2] + r.ib;
      bars.forEach(function (b2) { wmax = Math.max(wmax, b2[1]); });
      bars.forEach(function (b2) {
        T(svg, RX, ry, b2[0], { anchor: "start", size: 10, fill: b2[2] ? C.pink : C.dim });
        rect(svg, RX + 150, ry - 6, b2[1] / wmax * 130, 12,
          { rx: 3, fill: b2[2] ? C.pink : C.dim, stroke: "none", op: b2[2] ? 0.85 : 0.45 });
        T(svg, 752, ry, b2[1].toFixed(2), { anchor: "end", size: 10,
          fill: b2[2] ? C.pink : C.faint });
        ry += 20;
      });
      var onTop = A.some(function (t) { return Math.abs(Math.sin(t - N[0])) < 0.03; });
      T(svg, RX, ry + 6, r.work[0] > rest
          ? "n1 alone out-produces every other negative combined."
          : onTop
            ? "n1 sits on an anchor: no direction left to push it."
            : "n1 is easy: the softmax gives it almost no weight.",
        { anchor: "start", size: 10, fill: r.work[0] > rest ? C.pink : C.faint });

      /* ---- the loss curve ---- */
      var LX = 372, LY0 = 176, LY1 = 268, LW = 380;
      T(svg, LX, LY0 - 8, "InfoNCE, mean over the three anchors",
        { anchor: "start", size: 10.5, fill: C.faint });
      line(svg, LX, LY1, LX + LW, LY1, { stroke: C.line, sw: 1 });
      line(svg, LX, LY0, LX, LY1, { stroke: C.line, sw: 1 });
      var lmax = Math.max.apply(null, loss.concat([r.L, 0.5])) * 1.05;
      T(svg, LX - 4, LY0, lmax.toFixed(1), { anchor: "end", size: 8.5, fill: C.faint });
      T(svg, LX - 4, LY1, "0", { anchor: "end", size: 8.5, fill: C.faint });
      if (loss.length > 1) {
        var pts = loss.map(function (v, k) {
          return (LX + k / (loss.length - 1) * LW) + "," + (LY1 - v / lmax * (LY1 - LY0));
        });
        S("polyline", { points: pts.join(" "), fill: "none", stroke: C.orange,
          "stroke-width": 2 }, svg);
        T(svg, LX + LW, LY0 - 8, "from " + loss[0].toFixed(3) + " to " +
          loss[loss.length - 1].toFixed(3), { anchor: "end", size: 9.5, fill: C.orange });
      } else {
        T(svg, LX + 8, (LY0 + LY1) / 2, "press step", { anchor: "start", size: 10, fill: C.faint });
      }

      /* ---- what it is saying ---- */
      T(svg, 8, 312, inBatch
          ? "In-batch negatives are on: every other pair's positive is also a negative, which is why they are free."
          : "In-batch negatives are off: only the three explicit negatives are in each anchor's softmax.",
        { anchor: "start", size: 10.5, fill: C.dim });
      T(svg, 8, 332, "An arrow is the gradient on that point, tangent to the circle. A negative already " +
        "far away has almost none.", { anchor: "start", size: 10, fill: C.faint });

      svg.setAttribute("viewBox", "0 0 760 348");
    }

    function say() {
      var r = pass(), rest = r.work[1] + r.work[2] + r.ib;
      f.say("Loss " + r.L.toFixed(3) + " after " + steps + " steps. The hard negative is producing " +
        r.work[0].toFixed(2) + " of gradient against " + rest.toFixed(2) +
        " from every other negative in the softmax.");
    }

    /* ---- controls ------------------------------------------------------ */
    f.btn("step", function () { step(); sN.set(N[0]); render(); say(); });
    f.btn("run 20", function () {
      var i; for (i = 0; i < 20; i++) step();
      sN.set(N[0]); render(); say();
    });
    var sN = slider(f.controls, "hard negative", 0, 6.28, N0[0], 0.02,
      function (v) { return (v / Math.PI).toFixed(2) + "π"; },
      function (v) {
        N[0] = v; render();
        var r = pass();
        f.say("n1 at " + (v / Math.PI).toFixed(2) + "π: gradient " + r.work[0].toFixed(2) +
          ", loss " + r.L.toFixed(3) + ".");
      });
    var tgB = toggle(f.controls, "in-batch negatives", true, function (v) {
      inBatch = v; render();
      f.say(v ? "Every other pair's positive is a negative again: more negatives for no extra encoding."
              : "Only the four explicit negatives now. Fewer terms in the softmax, and a smaller loss " +
                "that means less than it looks.");
    });
    f.btn("reset", function () {
      init(); inBatch = true; tgB.set(true); sN.set(N0[0]); render();
      f.say("Step the training. Watch positives pull together and negatives push apart.");
    });

    init();
    render();
    f.say("Step the training. Watch positives pull together and negatives push apart.");
  };


  /* ========================================================================
     13. llmMultiHead — CH 6 — Inspector

     Real attention weights from real GPT-2, read on 12 September 2026 with
     output_attentions on three sentences. These eight heads were not chosen
     by taste: all 144 of GPT-2's heads were scored on four measurements, and
     these are the ones the measurements picked out, plus one that scored on
     nothing so the reader has something dull to compare against.

     What came back is better than the section's illustration.

       L4 H11  puts 1.000 of its weight on the previous token, every position,
               every sentence. Not "mostly": one.
       L5 H5   is an induction head. On "Ada Lovelace ... Ada Lovelace", the
               query «vel» sends 0.832 to the «ace» that followed the first
               «vel», and the query «ace» sends 0.945 to the « wrote» that
               followed the first «ace». That is A B ... A -> B, measured.
       L7 H2   sends 0.957 to the very first token and does nothing else,
               which is the attention sink of section 6.

     Both halves of the induction circuit the section describes are therefore
     on screen at once: L4 H11 writes the previous token into the stream, and
     L5 H5 reads it to find the match.

     The four scores in the table are computed in the browser from the shipped
     weights, so they describe exactly the grid beside them, and they change
     when the sentence does.
     ======================================================================== */
  VIZ.llmMultiHead = function (el) {
    var f = frame(el);

    var HEADS = [{l: 4, h: 11}, {l: 2, h: 2}, {l: 5, h: 5}, {l: 6, h: 9}, {l: 0, h: 8}, {l: 11, h: 8}, {l: 7, h: 2}, {l: 1, h: 11}];
    var SENTS = [
      { s: "She said \"wait\" and then she said \"go\"",
        t: ["She", " said", " \"", "wait", "\"", " and", " then", " she", " said", " \"", "go", "\""],
        a: [
          [1000,1000,0,0,1000,0,0,0,1000,0,0,0,0,1000,0,0,0,0,0,1000,0,0,0,0,0,0,1000,0,0,0,0,0,0,0,999,0,0,0,0,0,0,0,0,1000,0,0,0,0,0,0,0,0,0,1000,0,0,0,0,0,0,0,0,0,0,1000,0,0,0,0,0,0,0,0,0,0,0,1000,0],
          [1000,997,3,355,610,35,170,139,635,55,90,41,19,596,254,43,10,7,354,524,63,29,1,2,24,55,843,45,14,2,1,26,31,339,513,75,18,0,0,3,5,65,57,758,93,42,1,0,9,3,38,72,97,639,99,29,0,0,0,3,32,22,67,55,712,80,7,0,0,0,0,3,5,8,45,32,719,181],
          [1000,966,34,980,6,14,988,1,5,7,956,0,2,16,25,970,1,6,7,5,11,966,1,5,7,1,2,18,677,239,35,11,2,1,12,24,508,6,366,78,0,2,12,10,18,599,3,8,338,1,14,13,8,4,11,909,4,1,8,11,3,1,42,4,1,14,626,0,0,17,1,279,12,14,0,1,24,28],
          [1000,998,2,995,1,4,993,0,4,3,977,0,9,10,4,998,0,1,0,0,0,995,0,1,1,0,0,3,952,36,3,0,0,0,3,6,605,1,374,10,0,1,7,0,1,734,0,2,256,0,1,2,0,1,3,974,1,1,1,22,1,0,0,0,0,1,736,0,4,7,0,213,17,2,0,4,8,9],
          [1000,824,176,286,92,622,585,176,156,82,105,52,444,16,383,53,50,332,11,172,382,85,84,297,20,161,323,28,93,42,178,46,274,203,107,58,79,43,204,24,263,188,79,69,50,35,16,144,13,349,136,18,46,18,225,158,98,108,38,56,133,68,76,109,122,35,32,17,171,8,146,113,13,30,18,242,9,200],
          [1000,0,1000,0,130,870,0,7,901,92,0,356,193,144,307,0,481,83,2,34,400,0,281,34,1,19,360,304,0,116,51,3,14,344,269,203,0,423,120,3,64,120,102,101,66,0,8,437,33,12,37,33,55,21,364,0,11,304,119,59,30,19,38,10,219,191,0,42,14,7,73,61,52,691,6,1,1,53],
          [1000,999,1,999,0,1,999,0,1,0,993,0,2,0,5,986,0,1,0,0,12,985,1,2,0,0,1,10,982,7,1,0,0,0,1,8,908,0,75,1,3,3,3,2,4,944,0,1,43,2,4,1,1,1,3,967,2,1,0,24,2,1,1,1,1,0,584,0,1,1,1,393,8,1,1,2,1,8],
          [1000,506,494,127,14,859,84,4,3,910,199,39,460,2,301,311,25,34,2,98,530,50,16,24,4,32,47,827,260,10,13,1,47,46,11,613,45,207,28,5,59,22,7,4,623,27,5,394,0,47,12,3,1,6,504,15,1,2,3,9,14,3,0,0,2,951,70,16,181,1,167,33,8,5,21,242,1,255],
        ] },
      { s: "Ada Lovelace wrote the first program. Ada Lovelace was a mathematician.",
        t: ["Ad", "a", " Lo", "vel", "ace", " wrote", " the", " first", " program", ".", " Ada", " Lo", "vel", "ace", " was", " a", " mathematician", "."],
        a: [
          [1000,1000,0,0,1000,0,0,0,1000,0,0,0,0,1000,0,0,0,0,0,1000,0,0,0,0,0,0,1000,0,0,0,0,0,0,0,1000,0,0,0,0,0,0,0,0,1000,0,0,0,0,0,0,0,0,0,1000,0,0,0,0,0,0,0,0,0,0,1000,0,0,0,0,0,0,0,0,0,0,0,1000,0,0,0,0,0,0,0,0,0,0,0,0,999,1,0,0,0,0,0,0,0,0,0,0,0,0,1000,0,0,0,0,0,0,0,0,0,0,0,0,0,1,999,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1000,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1000,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1000,0],
          [1000,1000,0,723,238,39,4,4,990,2,15,3,550,402,30,667,22,29,31,62,189,51,2,6,7,31,790,113,117,1,4,2,9,134,581,152,72,1,1,2,3,124,180,592,24,48,0,2,2,11,119,125,169,241,284,94,0,1,1,1,14,18,22,75,461,313,18,0,0,0,0,1,1,4,9,31,900,36,1,0,0,0,0,0,0,0,1,2,85,902,9,2,0,0,0,0,0,0,0,1,1,23,505,409,58,69,0,0,0,0,1,3,1,4,35,119,79,122,406,162,36,0,0,0,0,1,0,2,1,10,17,14,29,31,745,114,104,0,0,0,0,0,0,1,2,14,5,19,31,21,197,344,262,29,0,0,0,0,0,0,0,0,0,4,3,9,26,31,178,445,274],
          [1000,999,1,996,0,3,1000,0,0,0,998,0,0,0,2,992,0,0,0,0,8,989,1,0,0,0,1,8,995,1,1,0,0,0,2,2,979,0,0,0,0,0,1,2,18,922,1,1,0,0,0,3,5,10,58,54,1,944,0,0,0,0,0,0,0,1,540,1,3,386,37,24,1,0,3,0,4,2,76,0,0,0,832,89,0,0,0,0,1,0,1,46,0,0,0,0,945,1,1,0,0,4,0,0,3,647,3,13,0,7,189,11,14,23,34,5,6,4,15,29,891,0,10,0,0,15,1,3,11,12,6,10,1,1,12,23,932,0,1,0,0,1,4,4,0,3,13,10,0,1,2,19,9,861,0,1,0,0,1,1,1,2,1,67,2,0,0,1,6,8,49],
          [1000,1000,0,1000,0,0,1000,0,0,0,997,0,0,0,3,992,0,0,0,0,8,999,0,0,0,0,0,1,999,0,0,0,0,0,0,1,996,0,0,0,0,0,0,1,3,996,0,0,0,0,0,0,1,0,3,678,0,319,0,0,1,0,0,0,1,0,775,0,0,220,1,2,0,0,1,0,0,0,4,0,0,0,996,0,0,0,0,0,0,0,0,696,0,0,0,1,298,0,1,0,0,1,0,0,3,989,0,0,0,0,4,0,3,0,1,0,0,0,0,2,992,0,0,0,0,1,0,3,1,0,0,0,0,0,1,2,995,0,0,0,0,0,0,0,0,1,0,0,0,0,0,2,1,979,0,0,0,0,0,0,0,0,0,16,0,0,0,0,1,1,3],
          [1000,644,356,533,377,90,492,314,120,73,395,285,174,111,35,271,269,289,47,80,42,35,87,30,16,11,29,792,122,133,71,41,48,81,445,58,166,74,64,38,51,228,214,69,96,40,54,16,6,8,14,214,26,22,601,180,98,75,25,24,85,90,47,248,74,55,149,117,46,20,27,53,147,70,60,104,164,45,236,149,82,44,57,27,72,53,47,82,26,79,45,202,135,116,68,23,11,69,30,21,84,17,124,77,24,34,46,20,8,11,14,197,44,42,231,28,32,11,14,267,10,20,6,4,3,10,193,18,17,115,7,11,6,4,183,392,128,56,41,21,11,41,88,66,106,56,71,41,21,11,80,116,46,17,21,7,2,4,6,81,11,10,248,5,10,3,5,54,113,4,399],
          [1000,0,1000,0,682,318,0,535,445,20,0,342,164,21,473,0,178,117,25,138,542,0,139,93,14,71,166,516,0,65,28,9,28,155,569,146,0,38,20,6,17,308,158,239,214,0,47,21,6,28,94,143,53,149,458,0,149,89,12,42,37,110,45,88,71,356,0,33,16,4,1,1,3,3,3,1,36,899,0,1,1,0,0,0,0,0,0,0,1,101,895,0,60,18,1,35,43,61,40,81,138,380,13,8,122,0,32,11,1,10,38,46,35,90,108,193,26,25,100,285,0,10,6,1,5,18,68,48,48,29,140,10,3,54,381,179,0,15,7,1,6,17,17,48,102,25,97,20,12,44,259,150,180,0,16,4,1,13,21,37,14,37,250,36,9,3,24,94,40,40,361],
          [1000,1000,0,999,0,1,1000,0,0,0,999,0,0,0,1,977,0,0,0,0,23,998,0,0,0,0,0,1,999,0,0,0,0,0,0,1,998,0,0,0,0,0,0,0,2,995,0,0,0,0,0,0,0,1,4,947,0,40,0,0,8,0,0,1,1,2,928,1,0,55,7,5,0,0,1,0,1,1,357,0,0,0,633,3,0,0,0,0,0,0,5,842,0,0,0,1,145,2,0,1,1,2,1,0,5,991,0,0,0,0,4,2,2,0,1,0,0,0,0,1,991,0,0,0,0,1,0,2,2,0,0,0,0,0,0,2,995,0,0,0,0,1,0,0,0,2,0,0,0,0,0,0,1,961,0,0,0,0,1,0,0,0,0,15,0,0,2,0,2,3,15],
          [1000,517,483,37,2,961,51,4,13,932,67,15,1,1,916,77,2,1,1,1,919,106,6,2,1,1,8,876,31,4,2,0,0,1,4,958,63,2,2,1,2,6,3,3,920,185,85,19,7,35,74,230,51,66,247,63,4,0,0,2,1,1,0,1,47,881,5,1,510,0,0,0,1,2,1,84,3,392,7,1,6,347,3,1,3,1,2,78,1,6,542,9,5,1,1,481,1,1,0,1,49,19,0,1,431,37,1,0,0,0,8,6,2,3,76,4,1,0,0,862,60,24,1,0,0,2,18,3,1,76,6,1,0,0,7,801,24,0,0,0,1,2,4,0,10,55,7,0,0,0,4,1,888,89,41,10,3,18,33,109,20,29,144,26,9,3,18,101,101,68,176],
        ] },
      { s: "The cat sat on the mat because it was warm",
        t: ["The", " cat", " sat", " on", " the", " mat", " because", " it", " was", " warm"],
        a: [
          [1000,1000,0,0,999,1,0,0,1000,0,0,0,0,1000,0,0,0,0,0,1000,0,0,0,0,0,0,1000,0,0,0,0,0,0,0,998,2,0,0,0,0,0,0,0,1000,0,0,0,0,0,0,0,0,0,1000,0],
          [1000,986,14,514,425,61,265,47,648,40,33,1,29,918,19,110,2,13,674,180,21,226,1,15,34,425,56,243,54,0,8,13,69,100,675,80,26,0,0,1,5,7,50,843,70,33,0,0,1,3,3,29,686,193,49],
          [1000,996,4,990,2,7,995,2,2,1,959,26,4,2,9,981,2,0,13,2,3,937,40,2,0,0,2,18,673,27,159,15,7,18,93,7,791,17,30,4,14,23,99,9,13,974,9,0,0,0,2,7,6,0,1],
          [1000,999,1,985,1,14,999,1,0,0,991,4,0,0,5,998,0,1,0,0,1,991,2,0,0,0,0,6,980,3,3,0,0,2,3,10,987,1,0,0,0,0,1,6,5,997,0,0,0,0,0,1,1,0,1],
          [1000,803,197,689,211,100,382,88,102,428,122,17,49,178,634,294,166,205,162,111,61,194,27,50,254,359,30,87,125,14,34,123,354,23,48,278,109,70,21,119,232,30,55,132,232,238,138,81,74,120,91,62,48,72,77],
          [1000,0,1000,1,456,543,0,195,669,136,1,275,241,135,348,0,81,642,88,31,157,0,208,181,79,78,106,347,0,163,98,29,51,22,268,370,0,92,45,10,14,20,272,373,173,0,131,116,25,35,288,87,101,109,108],
          [1000,999,1,999,0,1,1000,0,0,0,991,1,0,0,8,989,0,1,1,4,6,990,0,0,0,1,2,6,972,0,2,0,0,1,13,11,988,0,0,0,1,1,3,4,2,994,0,0,0,0,0,1,0,0,3],
          [1000,410,590,83,9,907,136,1,1,862,390,1,1,13,593,66,4,9,1,0,920,81,0,1,9,1,1,906,96,4,1,10,18,1,2,867,71,1,5,7,5,3,6,13,888,61,1,4,10,3,2,8,1,4,906],
        ] },
    ];

    var si = 0, hi = 0, overlay = false;
    function toks() { return SENTS[si].t; }
    function W(k, i, j) { return SENTS[si].a[k][i * (i + 1) / 2 + j] / 1000; }
    function w(i, j) {
      if (!overlay) return W(hi, i, j);
      var s = 0, k;
      for (k = 0; k < HEADS.length; k++) s += W(k, i, j);
      return s / HEADS.length;
    }
    function name(k) { return "L" + HEADS[k].l + " H" + HEADS[k].h; }
    function show(s) { return s.replace(/ /g, "·").replace(/\n/g, "⏎"); }

    /* The four measurements, taken off the shipped weights so they describe
       the grid rather than a claim about it. */
    function scores(k) {
      var t = toks(), n = t.length, i, j;
      var prev = 0, first = 0, ind = 0, nind = 0, quote = 0, nq = 0;
      var qs = [];
      for (i = 0; i < n; i++) if (t[i].replace(/\s/g, "") === '"') qs.push(i);
      for (i = 1; i < n; i++) {
        prev += W(k, i, i - 1);
        first += W(k, i, 0);
        var hit = 0, any = false;
        for (j = 1; j < i; j++) if (t[j - 1] === t[i]) { hit += W(k, i, j); any = true; }
        if (any) { ind += hit; nind++; }
        if (qs.length && i > qs[0]) {
          var qh = 0;
          for (j = 0; j < qs.length; j++) if (qs[j] <= i) qh += W(k, i, qs[j]);
          quote += qh; nq++;
        }
      }
      return { prev: prev / (n - 1), first: first / (n - 1),
               ind: nind ? ind / nind : -1, quote: nq ? quote / nq : -1 };
    }

    var svg = S("svg", { viewBox: "0 0 760 440", width: "100%",
      role: "img", "aria-label": "eight real GPT-2 heads on one sentence" }, f.body);

    var COLS = [["prev", "prev"], ["ind", "induction"], ["quote", "quote"], ["first", "first tok"]];

    function render() {
      while (svg.firstChild) svg.removeChild(svg.firstChild);
      var t = toks(), n = t.length, i, j;
      var cell = Math.max(14, Math.min(26, Math.floor(250 / n)));

      T(svg, 8, 14, "GPT-2 small, 12 layers x 12 heads — these eight were picked by measuring all 144",
        { anchor: "start", size: 11, fill: C.faint });

      /* --- the sentence as chips --- */
      var L = wrapBoxes(t.map(function (x) {
        var lab = show(x);
        return { lab: lab, w: 12 + lab.length * 6.6 };
      }), 2);
      L.pos.forEach(function (b, k) {
        var yy = 34 + b.ln * 24;
        rect(svg, b.x, yy - 10, b.w, 20, { rx: 4, fill: C.blue, stroke: "none", op: 0.1 });
        T(svg, b.x + b.w / 2, yy, b.lab, { size: 10.5, fill: C.dim });
        T(svg, b.x + b.w / 2, yy + 13, String(k), { size: 8, fill: C.faint });
      });
      var gy = 34 + L.lines * 24 + 32, gx = 104;

      /* --- heatmap --- */
      T(svg, 8, gy - 26, overlay ? "mean of the eight heads, query row x key column"
          : name(hi) + ": query row x key column",
        { anchor: "start", size: 11, fill: overlay ? C.faint : C.orange });
      for (i = 0; i < n; i++) {
        T(svg, gx + i * cell + cell / 2, gy - 10, String(i), { size: 8.5, fill: C.faint });
        T(svg, gx - 7, gy + i * cell + cell / 2, show(t[i]).slice(0, 8),
          { anchor: "end", size: 9.5, fill: C.dim });
        for (j = 0; j < n; j++) {
          if (j > i) {
            rect(svg, gx + j * cell, gy + i * cell, cell - 1.5, cell - 1.5,
              { rx: 2, fill: C.line, stroke: "none", op: 0.12 });
            continue;
          }
          var v = w(i, j);
          var c = rect(svg, gx + j * cell, gy + i * cell, cell - 1.5, cell - 1.5,
            { rx: 2, fill: C.blue, stroke: "none", op: 0.06 + 0.94 * v });
          (function (qi, kj, vv) {
            tipOn(c, show(t[qi]) + "  →  " + show(t[kj]), "weight " + vv.toFixed(4));
          })(i, j, v);
        }
      }

      /* --- the eight heads, scored --- */
      var RX = gx + n * cell + 22, ry = gy + 4, CW = 58;
      if (RX < 412) RX = 412;
      COLS.forEach(function (c, k) {
        T(svg, RX + 52 + k * CW + CW / 2, ry - 12, c[1], { size: 8.5, fill: C.faint });
      });
      for (i = 0; i < HEADS.length; i++) {
        var sc = scores(i), on = !overlay && i === hi;
        var box = rect(svg, RX - 6, ry - 9, 52 + 4 * CW + 8, 20,
          { rx: 4, fill: on ? C.orange : "none", stroke: "none", op: on ? 0.16 : 1 });
        T(svg, RX, ry, name(i), { anchor: "start", size: 10, fill: on ? C.orange : C.dim });
        COLS.forEach(function (c, k) {
          var v = sc[c[0]], bx = RX + 52 + k * CW;
          if (v < 0) { T(svg, bx + CW / 2, ry, "—", { size: 9, fill: C.faint }); return; }
          rect(svg, bx + 2, ry - 6, (CW - 8) * v, 12,
            { rx: 2, fill: v > 0.4 ? C.teal : C.dim, stroke: "none", op: v > 0.4 ? 0.75 : 0.4 });
          T(svg, bx + CW / 2, ry, v.toFixed(2), { size: 9,
            fill: v > 0.4 ? C.text : C.faint });
        });
        (function (k) {
          box.style.cursor = "pointer";
          box.addEventListener("click", function () { hi = k; overlay = false; tgO.set(false); render(); say(); });
        })(i);
        ry += 22;
      }

      /* --- what this head is doing --- */
      var fy = Math.max(gy + n * cell + 26, ry + 14);
      var s0 = scores(hi);
      T(svg, 8, fy, overlay
          ? "The mean of these eight. Averaging heads is what a single head would have been forced to do."
          : s0.prev > 0.8 ? name(hi) + " puts " + s0.prev.toFixed(3) +
              " of every row on the token one back. Nothing told it to."
          : s0.ind > 0.3 ? name(hi) + " is an induction head: " + s0.ind.toFixed(3) +
              " onto whatever followed this token the last time it appeared."
          : s0.first > 0.8 ? name(hi) + " sends " + s0.first.toFixed(3) +
              " to the very first token and little anywhere else: an attention sink."
          : s0.quote > 0.35 ? name(hi) + " puts " + s0.quote.toFixed(2) +
              " on the quotation marks, from every position after the first one."
          : name(hi) + " scores on none of the four. Most heads are like this one.",
        { anchor: "start", size: 10.5, fill: overlay ? C.dim : C.orange });
      T(svg, 8, fy + 20, "Scores are computed from the weights on screen, so they move when the " +
        "sentence does. Click a row.", { anchor: "start", size: 9.5, fill: C.faint });

      svg.setAttribute("viewBox", "0 0 760 " + (fy + 36));
    }

    function say() {
      var s0 = scores(hi);
      f.say(overlay ? "All eight averaged." : name(hi) + " on this sentence: previous token " +
        s0.prev.toFixed(3) + ", first token " + s0.first.toFixed(3) +
        (s0.ind >= 0 ? ", induction " + s0.ind.toFixed(3) : "") +
        (s0.quote >= 0 ? ", quotes " + s0.quote.toFixed(3) : "") + ".");
    }

    /* ---- controls ------------------------------------------------------ */
    var sel = document.createElement("select");
    sel.setAttribute("aria-label", "sentence");
    sel.style.cssText = "font:12px ui-monospace,Menlo,monospace;padding:4px 6px;max-width:250px;" +
      "background:var(--bg-2);color:var(--text);border:1px solid var(--line);border-radius:6px";
    SENTS.forEach(function (s, i) {
      var o = document.createElement("option");
      o.value = i; o.textContent = s.s;
      sel.appendChild(o);
    });
    sel.addEventListener("change", function () { si = +sel.value; render(); say(); });
    f.controls.appendChild(sel);

    f.btn("next head", function () {
      hi = (hi + 1) % HEADS.length; overlay = false; tgO.set(false); render(); say();
    });
    var tgO = toggle(f.controls, "overlay all eight", false, function (v) {
      overlay = v; render();
      f.say(v ? "Every head averaged into one picture. This is the compromise a single head would " +
                "have had to make, and it is why there are 32 of them."
              : "Back to " + name(hi) + ".");
    });
    f.btn("reset", function () {
      si = 0; hi = 0; overlay = false; sel.value = "0"; tgO.set(false); render();
      f.say("Click through the heads. Two of them are doing something obvious.");
    });

    render();
    f.say("Click through the heads. Two of them are doing something obvious.");
  };


  /* ========================================================================
     14. llmKvBudget — CH 6 — Tuner

     The section's formula, made live. Every figure in its table comes back
     out: 512.0 KB per token under MHA, 128.0 KB at Corvid's 4:1 grouping,
     16.0 KB under MQA, and 4.295 / 1.074 / 0.134 GB at 8,192 context.

     One number does not. The chapter's table says three full-context MHA
     requests fit in 11.98 GB; 11.985 / 4.295 is 2.79, so two fit. Eleven and
     eighty-nine are right — those quotients are 11.16 and 89.3 — so the row
     was rounded where the other two were floored. A machine that reports how
     many requests fit has to floor, so this one says two, and the chapter's
     MHA row wants a one-character fix.

     The real-model strip carries only what the chapter itself states: the
     query:KV ratios and Gemma's head dimension of 256. Clicking one prices
     that choice on Corvid's 32 layers, which is the comparison the section
     draws rather than a claim about that model's own cache.
     ======================================================================== */
  VIZ.llmKvBudget = function (el) {
    var f = frame(el);

    var LAYERS = 32, QH = 32, PARAMS = 8.03e9, CARD = 16e9;
    var REAL = [
      { n: "Llama-3-8B", q: 32, kv: 8, d: 128 },
      { n: "Mistral-7B-v0.3", q: 32, kv: 8, d: 128 },
      { n: "Qwen2.5-7B", q: 28, kv: 4, d: 128 },
      { n: "Gemma-2-9B", q: 16, kv: 8, d: 256 }
    ];

    var kv = 8, dh = 128, eCtx = 13, fp8 = false;   // 2^13 = 8,192, Corvid's context
    function ctx() { return 1 << eCtx; }
    function pb() { return fp8 ? 1 : 2; }
    function perTok(k) { return 2 * LAYERS * k * dh * pb(); }
    function perReq(k) { return perTok(k) * ctx(); }
    function weights() { return PARAMS * 0.5; }     // int4, as the section's callout sets up
    function budget() { return CARD - weights(); }
    function fits(k) { return Math.floor(budget() / perReq(k)); }

    function kb(b) {
      if (b >= 1048576) return (b / 1048576).toFixed(1) + " MB";
      return (b / 1024).toFixed(1) + " KB";
    }
    function gb(b) { return (b / 1e9).toFixed(3) + " GB"; }
    function commas(v) { return Math.round(v).toLocaleString("en-US"); }

    var svg = S("svg", { viewBox: "0 0 760 400", width: "100%",
      role: "img", "aria-label": "the KV cache priced against a 16 GB card" }, f.body);

    function render() {
      while (svg.firstChild) svg.removeChild(svg.firstChild);
      var i, scheme = kv === QH ? "MHA" : kv === 1 ? "MQA" : "GQA " + (QH / kv).toFixed(0) + ":1";

      T(svg, 8, 14, "Corvid-8B: 32 layers, 32 query heads, head dimension " + dh,
        { anchor: "start", size: 11, fill: C.faint });
      T(svg, 752, 14, scheme + ", cache in " + (fp8 ? "fp8" : "bfloat16"),
        { anchor: "end", size: 11, fill: C.orange });

      /* ---- the formula, with this configuration's numbers in it ---- */
      T(svg, 8, 44, "2  ×  " + LAYERS + " layers  ×  " + kv + " KV heads  ×  " + dh +
        " dim  ×  " + pb() + " bytes", { anchor: "start", size: 12.5, fill: C.text });
      T(svg, 8, 66, "=  " + commas(perTok(kv)) + " bytes  =  " + kb(perTok(kv)) + " per token",
        { anchor: "start", size: 12.5, fill: C.teal });

      /* ---- the three schemes, priced ---- */
      var BX = 118, BW = 330, ry = 106;
      T(svg, 8, 88, "at " + commas(ctx()) + " tokens of context, in a " +
        gb(budget()) + " budget", { anchor: "start", size: 11, fill: C.faint });
      var rows = [["MHA", QH], [kv === QH || kv === 1 ? "GQA 4:1" : scheme,
                   kv === QH || kv === 1 ? QH / 4 : kv], ["MQA", 1]];
      var wmax = perReq(QH);
      rows.forEach(function (r) {
        var k = r[1], on = k === kv;
        var tone = k === QH ? C.pink : k === 1 ? C.teal : C.orange;
        T(svg, 8, ry, r[0], { anchor: "start", size: 11, fill: on ? tone : C.dim });
        T(svg, 108, ry, k + " KV", { anchor: "end", size: 9.5, fill: C.faint });
        rect(svg, BX, ry - 8, Math.max(2, perReq(k) / wmax * BW), 16,
          { rx: 3, fill: tone, stroke: "none", op: on ? 0.85 : 0.35 });
        T(svg, BX + BW + 12, ry, kb(perTok(k)) + "/token", { anchor: "start", size: 10,
          fill: on ? tone : C.dim });
        T(svg, 752, ry, fits(k) + (fits(k) === 1 ? " request" : " requests"),
          { anchor: "end", size: 11, fill: on ? tone : C.dim });
        ry += 30;
      });

      /* ---- the numbers behind the bars ---- */
      var NY = 208;
      function row(label, value, tone) {
        T(svg, 8, NY, label, { anchor: "start", size: 10.5, fill: C.faint });
        T(svg, 420, NY, value, { anchor: "end", size: 11, fill: tone || C.text });
        NY += 21;
      }
      row("cache per token", kb(perTok(kv)), C.teal);
      row("cache for one full-context request", gb(perReq(kv)), C.teal);
      row("weights at 4 bits", gb(weights()));
      row("left for cache on a 16 GB card", gb(budget()));
      row("full-context requests that fit", String(fits(kv)),
        fits(kv) < 3 ? C.pink : C.teal);

      /* ---- what real models chose ---- */
      T(svg, 452, 208, "what real models chose, from the section",
        { anchor: "start", size: 10.5, fill: C.faint });
      var sy = 230;
      REAL.forEach(function (m) {
        var on = m.kv === kv && m.d === dh;
        var box = rect(svg, 448, sy - 10, 304, 20, { rx: 4, fill: C.blue,
          stroke: "none", op: on ? 0.16 : 0 });
        T(svg, 456, sy, m.n, { anchor: "start", size: 10, fill: on ? C.blue : C.dim });
        T(svg, 744, sy, m.q + ":" + m.kv + (m.d !== 128 ? "  dim " + m.d : ""),
          { anchor: "end", size: 10, fill: on ? C.blue : C.faint });
        (function (mm) {
          box.style.cursor = "pointer";
          box.addEventListener("click", function () {
            kv = mm.kv; dh = mm.d; sKV.set(Math.log(kv) / Math.LN2); render();
            f.say(mm.n + "'s " + mm.q + ":" + mm.kv + " at head dimension " + mm.d +
              ", priced on Corvid's 32 layers: " + kb(perTok(kv)) + " per token, " +
              fits(kv) + " requests.");
          });
        })(m);
        sy += 22;
      });

      /* ---- the discovery ---- */
      var mha = fits(QH), gqa = fits(QH / 4);
      T(svg, 8, 336, "MHA fits " + mha + ", Corvid's 4:1 grouping fits " + gqa +
        ". Same query heads, same head dimension, same hardware.",
        { anchor: "start", size: 11, fill: C.orange });
      T(svg, 8, 358, "At bfloat16 the weights alone are " + gb(PARAMS * 2) +
        " and do not fit the card at all, which is why the budget above assumes 4-bit.",
        { anchor: "start", size: 10, fill: C.faint });
      T(svg, 8, 378, "Query heads never appear in the formula. Only the KV heads do, which is the " +
        "whole reason the two counts came apart.", { anchor: "start", size: 10, fill: C.faint });

      svg.setAttribute("viewBox", "0 0 760 394");
    }

    function say() {
      f.say(kb(perTok(kv)) + " per token with " + kv + " KV heads: " + gb(perReq(kv)) +
        " for one " + commas(ctx()) + "-token request, so " + fits(kv) +
        " fit in " + gb(budget()) + ".");
    }

    /* ---- controls ------------------------------------------------------ */
    var tb = tabs(f.controls, ["MHA", "GQA 4:1", "MQA"], 1, function (i) {
      kv = i === 0 ? QH : i === 2 ? 1 : QH / 4;
      sKV.set(Math.log(kv) / Math.LN2); render(); say();
    });
    var sKV = slider(f.controls, "KV heads", 0, 5, 3, 1,
      function (v) { return String(1 << v); },
      function (v) {
        kv = 1 << v;
        tb.sync(kv === QH ? 0 : kv === 1 ? 2 : kv === QH / 4 ? 1 : -1);
        render(); say();
      });
    var sC = slider(f.controls, "context", 10, 17, 13, 1,
      function (v) { return commas(1 << v); },
      function (v) { eCtx = v; render(); say(); });
    var tgP = toggle(f.controls, "fp8 cache", false, function (v) {
      fp8 = v; render();
      f.say(v ? "One byte per number instead of two: the cache halves and the request count doubles. " +
                "Chapter 29 is where the quality cost of that gets measured."
              : "Back to bfloat16, two bytes a number.");
    });
    f.btn("reset", function () {
      kv = 8; dh = 128; eCtx = 13; fp8 = false;
      tb.sync(1); sKV.set(3); sC.set(13); tgP.set(false); render();
      f.say("Set MHA. Now switch to GQA. Watch how many users fit.");
    });

    render();
    f.say("Set MHA. Now switch to GQA. Watch how many users fit.");
  };


  /* ========================================================================
     15. llmRope — CH 7 — Inspector

     One 2-D subspace, computed live. The section's four checks come out of it
     exactly: with the first pair's theta of 1.0, q = (1, 0) and k = (0.78,
     0.54), positions (1,3), (5,7), (50,52) and (1000,1002) all score
     -0.815615, and gaps of 1, 3 and 8 give -0.033, -0.848 and -0.648.

     The controls are position m and the gap, never m and n, because that is
     the discovery made structural: sliding m moves both arrows around the
     circle together and the angle between them — and therefore the number —
     does not change. There is no state in which the reader has to be told
     that; the slider cannot express the alternative.

     Pair index sets theta the way a real model does, base^(-2i/d) at head
     dimension 128, so pair 0 turns once every 6 tokens and pair 63 once every
     54,410. Those are section 6's numbers, and the base toggle reproduces its
     other pair: 500,000 stretches the slowest wavelength to 2,559,196.
     ======================================================================== */
  VIZ.llmRope = function (el) {
    var f = frame(el);

    var Q = [1, 0], K = [0.78, 0.54], DH = 128;
    var m = 1, gap = 2, pair = 0, base = 10000;

    function theta() { return Math.pow(base, -2 * pair / DH); }
    function wave() { return 2 * Math.PI / theta(); }
    function rot(v, a) {
      var c = Math.cos(a), s = Math.sin(a);
      return [v[0] * c - v[1] * s, v[0] * s + v[1] * c];
    }
    function score(mm, nn) {
      var a = rot(Q, mm * theta()), b = rot(K, nn * theta());
      return a[0] * b[0] + a[1] * b[1];
    }
    function commas(v) { return Math.round(v).toLocaleString("en-US"); }

    var svg = S("svg", { viewBox: "0 0 760 384", width: "100%",
      role: "img", "aria-label": "one RoPE subspace, two positions" }, f.body);

    var CX = 150, CY = 152, R = 88;
    var GX0 = 350, GX1 = 744, GY0 = 96, GY1 = 240, GMAX = 16;

    function render() {
      while (svg.firstChild) svg.removeChild(svg.firstChild);
      var n = m + gap, th = theta(), s = score(m, n), i;

      T(svg, 8, 14, "one 2-D pair of a 128-dimensional head, rotated by position",
        { anchor: "start", size: 11, fill: C.faint });
      T(svg, 752, 14, "pair " + pair + " of 64  ·  theta " + th.toFixed(6) +
        "  ·  one turn every " + commas(wave()) + " tokens",
        { anchor: "end", size: 10, fill: C.faint });

      /* ---- the plane ---- */
      S("circle", { cx: CX, cy: CY, r: R, fill: "none", stroke: C.line,
        "stroke-width": 1, "stroke-dasharray": "3 3" }, svg);
      line(svg, CX - R - 14, CY, CX + R + 14, CY, { stroke: C.line, sw: 0.8 });
      line(svg, CX, CY - R - 14, CX, CY + R + 14, { stroke: C.line, sw: 0.8 });

      var qa = m * th, ka = n * th;
      var qv = rot(Q, qa), kv = rot(K, ka);
      var kl = Math.sqrt(K[0] * K[0] + K[1] * K[1]);

      /* the arc between them is the whole story: it is gap x theta, always */
      var a0 = Math.atan2(qv[1], qv[0]), a1 = Math.atan2(kv[1], kv[0]);
      var del = a1 - a0;
      while (del > Math.PI) del -= 2 * Math.PI;
      while (del <= -Math.PI) del += 2 * Math.PI;
      var arcR = 38;
      S("path", { d: "M " + (CX + arcR * Math.cos(a0)) + " " + (CY - arcR * Math.sin(a0)) +
        " A " + arcR + " " + arcR + " 0 0 " + (del > 0 ? 0 : 1) + " " +
        (CX + arcR * Math.cos(a0 + del)) + " " + (CY - arcR * Math.sin(a0 + del)),
        fill: "none", stroke: C.teal, "stroke-width": 2, opacity: 0.85 }, svg);

      line(svg, CX, CY, CX + qv[0] * R, CY - qv[1] * R, { stroke: C.blue, sw: 2.5 });
      T(svg, CX + qv[0] * (R + 16), CY - qv[1] * (R + 16), "q at " + m,
        { size: 10, fill: C.blue });
      line(svg, CX, CY, CX + kv[0] / kl * R * kl, CY - kv[1] / kl * R * kl,
        { stroke: C.orange, sw: 2.5 });
      T(svg, CX + kv[0] / kl * (R * kl + 18), CY - kv[1] / kl * (R * kl + 18), "k at " + n,
        { size: 10, fill: C.orange });
      var born = Math.atan2(K[1], K[0]) - Math.atan2(Q[1], Q[0]);
      T(svg, 8, CY + R + 26, "arms " + Math.abs(del).toFixed(4) + " rad apart",
        { anchor: "start", size: 10.5, fill: C.teal });
      T(svg, 8, CY + R + 44, "= gap x theta " + (gap * th).toFixed(4) + " + the " +
        born.toFixed(4) + " q and k began with",
        { anchor: "start", size: 9.5, fill: C.faint });

      /* ---- score against gap ---- */
      T(svg, GX0, GY0 - 26, "score against gap, with both positions rotated",
        { anchor: "start", size: 11, fill: C.faint });
      function gx(d) { return GX0 + d / GMAX * (GX1 - GX0); }
      function gy(v) { return (GY0 + GY1) / 2 - v / 1.05 * (GY1 - GY0) / 2; }
      line(svg, GX0, gy(0), GX1, gy(0), { stroke: C.line, sw: 1 });
      line(svg, GX0, GY0, GX0, GY1, { stroke: C.line, sw: 1 });
      [-1, 0, 1].forEach(function (v) {
        T(svg, GX0 - 6, gy(v), v === 0 ? "0" : String(v),
          { anchor: "end", size: 9, fill: C.faint });
      });
      var pts = [];
      for (i = 0; i <= GMAX * 8; i++) {
        var d = i / 8;
        pts.push(gx(d) + "," + gy(score(m, m + d)));
      }
      S("polyline", { points: pts.join(" "), fill: "none", stroke: C.dim,
        "stroke-width": 1.6 }, svg);
      for (i = 0; i <= GMAX; i += 2) T(svg, gx(i), GY1 + 14, String(i),
        { size: 9, fill: C.faint });
      T(svg, GX1, GY1 + 30, "gap between the two positions",
        { anchor: "end", size: 9.5, fill: C.faint });
      line(svg, gx(gap), GY0, gx(gap), GY1, { stroke: C.orange, sw: 1, dash: "3 3" });
      S("circle", { cx: gx(gap), cy: gy(s), r: 4, fill: C.orange }, svg);

      /* ---- the invariance, checked live ---- */
      T(svg, 8, 296, "the same gap, four places in the sequence",
        { anchor: "start", size: 11, fill: C.faint });
      var xs = 8, same = true, first = score(1, 1 + gap);
      [1, 5, 50, 1000].forEach(function (mm) {
        var v = score(mm, mm + gap);
        if (Math.abs(v - first) > 5e-7) same = false;
        T(svg, xs, 318, "m=" + mm + " n=" + (mm + gap), { anchor: "start", size: 10, fill: C.faint });
        T(svg, xs, 336, v.toFixed(6), { anchor: "start", size: 11.5,
          fill: mm === m ? C.orange : C.teal });
        xs += 132;
      });
      T(svg, 560, 327, same ? "identical to six decimals" : "these differ",
        { anchor: "start", size: 10.5, fill: same ? C.teal : C.pink });

      T(svg, 8, 362, "Absolute rotations in, relative distance out: move m and both arrows turn, " +
        "but the angle between them cannot.", { anchor: "start", size: 10, fill: C.faint });

      svg.setAttribute("viewBox", "0 0 760 378");
    }

    function say() {
      f.say("positions m=" + m + " n=" + (m + gap) + ", gap " + gap + ", score = " +
        score(m, m + gap).toFixed(6) + ".");
    }

    /* ---- controls ------------------------------------------------------ */
    var sM = slider(f.controls, "position m", 0, 64, 1, 1,
      function (v) { return String(v); },
      function (v) { m = v; render(); say(); });
    var sG = slider(f.controls, "gap", 0, 16, 2, 1,
      function (v) { return String(v); },
      function (v) { gap = v; render(); say(); });
    var sP = slider(f.controls, "pair", 0, 63, 0, 1,
      function (v) { return String(v); },
      function (v) {
        pair = v; render();
        f.say("Pair " + v + " turns once every " + commas(wave()) +
          " tokens. Fast pairs tell neighbours apart, slow pairs tell regions apart.");
      });
    f.btn("m = 1000", function () {
      m = 1000; sM.input.max = 1024; sM.set(1000); render();
      f.say("A thousand tokens in, gap " + gap + ", score = " + score(m, m + gap).toFixed(6) +
        " — the same six decimals as at position 1.");
    });
    var tgB = toggle(f.controls, "base 500,000", false, function (v) {
      base = v ? 500000 : 10000; render();
      f.say("Base " + commas(base) + ": the slowest pair now turns once every " +
        commas(2 * Math.PI * Math.pow(base, 126 / DH)) + " tokens. The fastest pair " +
        "has not moved, which is the whole point of raising it.");
    });
    f.btn("reset", function () {
      m = 1; gap = 2; pair = 0; base = 10000;
      sM.input.max = 64; sM.set(1); sG.set(2); sP.set(0); tgB.set(false);
      render();
      f.say("Drag both positions while keeping the gap fixed. The score does not move.");
    });

    render();
    f.say("Drag both positions while keeping the gap fixed. The score does not move.");
  };


  /* ========================================================================
     16. llmContextStretch — CH 7 — Tuner

     The same rotation arithmetic as llmRope, asked a different question: what
     angle does each of the 64 pairs reach at the far end of the context, and
     has the model ever seen it?

     The quality proxy is stated rather than fudged. A pair is in trained
     territory while its rotation at the target position stays inside the
     largest angle it reached during training; past that the model is reading
     a rotation it never saw, and the proxy is the fraction of the 64 pairs
     still inside. That is a proxy, not a benchmark, and the machine says so —
     but it is computed from real rotation angles rather than drawn as a
     shape, so the cliff appears where the arithmetic puts it.

     Section 6's wavelength table falls out of the same function: at head
     dimension 128 the fastest pair turns once every 6 tokens under either
     base, and the slowest turns once every 54,410 at base 10,000 and
     2,559,196 at 500,000 — the factor of 47 the section quotes.
     ======================================================================== */
  VIZ.llmContextStretch = function (el) {
    var f = frame(el);

    var DH = 128, NP = DH / 2, TRAINED = 8192;
    var METHODS = ["none", "position interpolation", "NTK-aware", "YaRN"];

    var eTgt = 17, method = 0, base = 500000;      // 2^17 = 131,072, Llama 3.2's target
    function target() { return 1 << eTgt; }
    function factor() { return Math.max(1, target() / TRAINED); }

    /* theta for pair i, before and after the method. PI divides every angle
       by the factor, which is what dividing the position index does. NTK
       raises the base instead, which leaves the fast pairs untouched because
       base^0 is 1 whatever the base. YaRN's ramp leaves the already-wrapped
       pairs exactly alone and NTK-scales the rest. */
    function th0(i) { return Math.pow(base, -2 * i / DH); }
    function wrapped(i) { return th0(i) * TRAINED >= 2 * Math.PI; }
    function ntk(i) {
      return Math.pow(base * Math.pow(factor(), DH / (DH - 2)), -2 * i / DH);
    }
    function theta(i) {
      if (method === 1) return th0(i) / factor();
      if (method === 2) return ntk(i);
      if (method === 3) return wrapped(i) ? th0(i) : ntk(i);
      return th0(i);
    }
    /* A pair that wrapped during training has seen every angle there is, so
       it is fine anywhere. For the rest, what matters is not whether they
       overshoot but by how much: the ratio of the angle they reach now to the
       largest one training showed them. A binary test would score NTK the
       same as no scaling at all, which is wrong by a factor of six. */
    function over(i, pos) {
      if (wrapped(i)) return 1;
      return Math.min(1, th0(i) * TRAINED / (theta(i) * pos));
    }
    function safe(i, pos) { return over(i, pos) > 0.999; }
    function okAt(pos) {
      var s2 = 0, i;
      for (i = 0; i < NP; i++) s2 += over(i, pos);
      return s2 / NP;
    }
    function worst(pos) {
      var w = 1, i;
      for (i = 0; i < NP; i++) if (!wrapped(i)) w = Math.max(w, 1 / over(i, pos));
      return w;
    }
    function reach(i, pos) { return theta(i) * pos; }
    function commas(v) { return Math.round(v).toLocaleString("en-US"); }

    var svg = S("svg", { viewBox: "0 0 760 400", width: "100%",
      role: "img", "aria-label": "context extension against a rotation-angle proxy" }, f.body);

    var AX0 = 62, AX1 = 744, AY0 = 96, AY1 = 236;

    function render() {
      while (svg.firstChild) svg.removeChild(svg.firstChild);
      var i, tgt = target();

      T(svg, 8, 14, "Corvid trained at " + commas(TRAINED) + ", asked for " + commas(tgt) +
        ": a factor of " + factor().toFixed(0), { anchor: "start", size: 11, fill: C.faint });
      T(svg, 752, 14, "rope_theta " + commas(base) + "  ·  " + METHODS[method],
        { anchor: "end", size: 11, fill: C.orange });

      /* ---- the proxy against position ---- */
      T(svg, 8, 70, "share of each pair's rotation that training already showed it, averaged over 64",
        { anchor: "start", size: 11, fill: C.faint });
      function px(p) { return AX0 + Math.log(p / 512) / Math.log(262144 / 512) * (AX1 - AX0); }
      function py(v) { return AY1 - v * (AY1 - AY0); }
      line(svg, AX0, AY1, AX1, AY1, { stroke: C.line, sw: 1.2 });
      line(svg, AX0, AY0, AX0, AY1, { stroke: C.line, sw: 1.2 });
      [0, 0.5, 1].forEach(function (v) {
        T(svg, AX0 - 6, py(v), (v * 100).toFixed(0) + "%", { anchor: "end", size: 9, fill: C.faint });
        if (v) line(svg, AX0, py(v), AX1, py(v), { stroke: C.line, sw: 0.5, op: 0.4 });
      });
      [1024, 8192, 32768, 131072].forEach(function (p) {
        T(svg, px(p), AY1 + 14, commas(p), { size: 9, fill: C.faint });
      });
      line(svg, px(TRAINED), AY0 - 6, px(TRAINED), AY1, { stroke: C.teal, sw: 1, dash: "4 3" });
      T(svg, px(TRAINED) + 5, AY0 + 4, "trained here", { anchor: "start", size: 9, fill: C.teal });

      var pts = [], p;
      for (i = 0; i <= 160; i++) {
        p = 512 * Math.pow(262144 / 512, i / 160);
        pts.push(px(p) + "," + py(okAt(p)));
      }
      S("polyline", { points: pts.join(" "), fill: "none", stroke: C.orange,
        "stroke-width": 2.2 }, svg);
      line(svg, px(tgt), AY0 - 6, px(tgt), AY1, { stroke: C.orange, sw: 1, dash: "3 3" });
      S("circle", { cx: px(tgt), cy: py(okAt(tgt)), r: 4.5, fill: C.orange }, svg);

      /* ---- the 64 pairs, each one's wavelength against the target ---- */
      var BY = 286, BW = 682;
      T(svg, 8, BY - 8, "each of the 64 pairs: how much of one turn it completes by position " +
        commas(tgt), { anchor: "start", size: 10.5, fill: C.faint });
      for (i = 0; i < NP; i++) {
        var turns = reach(i, tgt) / (2 * Math.PI), ov = over(i, tgt);
        var h = Math.min(1, Math.log(1 + turns) / Math.log(1 + 40)) * 26;
        rect(svg, AX0 + i * (BW / NP), BY + 30 - h, BW / NP - 1.5, h,
          { rx: 1, fill: ov > 0.999 ? C.teal : C.pink, stroke: "none",
            op: ov > 0.999 ? 0.6 : 0.3 + 0.6 * (1 - ov) });
      }
      line(svg, AX0, BY + 30, AX0 + BW, BY + 30, { stroke: C.line, sw: 0.8 });
      T(svg, AX0, BY + 44, "pair 0, fastest", { anchor: "start", size: 9, fill: C.faint });
      T(svg, AX0 + BW, BY + 44, "pair 63, slowest", { anchor: "end", size: 9, fill: C.faint });

      /* ---- the two numbers that trade against each other ---- */
      var slow = 2 * Math.PI / th0(NP - 1);
      var res = theta(0), res0 = th0(0);
      T(svg, 8, 346, "wavelengths at this base: fastest pair " + (2 * Math.PI).toFixed(0) +
        " tokens, slowest pair " + commas(slow) + ".",
        { anchor: "start", size: 10.5, fill: C.dim });
      var wst = worst(tgt);
      T(svg, 8, 366, wst < 1.001
          ? "Every pair is inside angles training showed it at " + commas(tgt) + " tokens."
          : "The worst pair reaches " + wst.toFixed(1) + "x the largest angle training ever " +
            "showed it, and " + ((1 - okAt(tgt)) * 100).toFixed(0) + "% of the rotation is unseen.",
        { anchor: "start", size: 11, fill: wst < 1.001 ? C.teal : wst < 4 ? C.orange : C.pink });
      T(svg, 8, 386, "Neighbours are " + res.toFixed(4) +
        " rad apart at the fastest pair, against " + res0.toFixed(4) +
        (res < res0 * 0.999 ? " before — the resolution PI spends." : " before scaling."),
        { anchor: "start", size: 10.5, fill: res < res0 * 0.999 ? C.orange : C.teal });
      T(svg, 8, 406, method === 3
          ? "On this proxy YaRN matches NTK: what it adds is a temperature correction on attention, which rotation angles cannot show."
          : "A proxy — the share of pairs still in trained angular range — not a benchmark. Section 7 is the test that uses a document.",
        { anchor: "start", size: 9.5, fill: C.faint });

      svg.setAttribute("viewBox", "0 0 760 420");
    }

    function say() {
      f.say(METHODS[method] + " at " + commas(target()) + ": the worst pair overshoots by " +
        worst(target()).toFixed(1) + "x, and " + (okAt(target()) * 100).toFixed(0) +
        "% of the rotation across the 64 pairs is angle training had shown them.");
    }

    /* ---- controls ------------------------------------------------------ */
    var mt = tabs(f.controls, ["no scaling", "PI", "NTK", "YaRN"], 0, function (i) {
      method = i; render(); say();
    });
    var sT = slider(f.controls, "target", 13, 18, 17, 1,
      function (v) { return commas(1 << v); },
      function (v) { eTgt = v; render(); say(); });
    var tgB = toggle(f.controls, "base 10,000", false, function (v) {
      base = v ? 10000 : 500000; render();
      f.say("Base " + commas(base) + ": the slowest pair turns once every " +
        commas(2 * Math.PI * Math.pow(base, 126 / DH)) + " tokens. Raising the base is " +
        "the same lever as NTK scaling, applied once at training time.");
    });
    f.btn("reset", function () {
      eTgt = 17; method = 0; base = 500000;
      mt.sync(0); sT.set(17); tgB.set(false); render();
      f.say("Push the target context past the training length with no scaling. Then turn scaling on.");
    });

    render();
    f.say("Push the target context past the training length with no scaling. Then turn scaling on.");
  };


  /* ========================================================================
     17. llmNeedle — CH 7 — Playground

     P4, actually run. Qwen2.5-0.5B-Instruct, a haystack built from this
     course's own prose, and the score in each cell is the probability the
     model puts on the answer's digits — one forward pass per cell, so no
     cell depends on decoding luck.

     Two tasks on the same grid, because one of them is the chapter's point.
     The plain version hides one passcode and asks for it. The second hides
     four passcodes of identical shape and asks for one, which is the
     interference a RULER-style test adds.

     The scale is honest about itself: P4 as the chapter defines it hides a
     fact in 100,000 tokens, and this is 8,192 on a laptop. What transfers is
     the comparison between the two tasks, not the absolute length.

     What came back: the plain task averages 0.98 and never really fails, and
     adding three decoys drops the average to 0.82 with cells as low as 0.05.
     The ends stay reliable and the interior does not, which is the shape the
     section describes — but it is scattered rather than a tidy U at this
     model size, and the machine reports the numbers rather than smoothing
     them.
     ======================================================================== */
  VIZ.llmNeedle = function (el) {
    var f = frame(el);

    var ND = {
      model: "Qwen2.5-0.5B-Instruct",
      depths: [0, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100],
      A: [
        { len: 1024, p: [0.99784, 0.99815, 0.99878, 0.99718, 0.99665, 0.99782, 0.9973, 0.99622, 0.98838, 0.99757, 0.99552] },
        { len: 2048, p: [0.99842, 0.99921, 0.99492, 0.99707, 0.99214, 0.99602, 0.98653, 0.99582, 0.99672, 0.99176, 0.98793] },
        { len: 4096, p: [0.99664, 0.98582, 0.98537, 0.98922, 0.99391, 0.99304, 0.99157, 0.99476, 0.9958, 0.99535, 0.47381] },
        { len: 8192, p: [0.99806, 0.99298, 0.99754, 0.99374, 0.98692, 0.98798, 0.99815, 0.9981, 0.99481, 0.98903, 0.98553] },
      ],
      B: [
        { len: 1024, p: [0.99871, 0.99811, 0.9976, 0.98613, 0.8764, 0.98804, 0.98409, 0.86839, 0.58508, 0.9916, 0.99861] },
        { len: 2048, p: [0.99702, 0.86802, 0.84069, 0.82015, 0.37915, 0.65642, 0.79083, 0.26627, 0.65891, 0.95189, 0.97767] },
        { len: 4096, p: [0.97502, 0.89174, 0.79675, 0.8741, 0.29447, 0.96624, 0.8834, 0.65452, 0.51089, 0.99105, 0.98468] },
        { len: 8192, p: [0.99598, 0.37726, 0.04981, 0.45014, 0.81791, 0.99609, 0.99788, 0.88854, 0.99831, 0.99779, 0.99623] },
      ],
    };

    var task = 0, di = 5, li = 0;                  // depth 50%, shortest document
    function rows() { return task ? ND.B : ND.A; }
    function cell(l, d) { return rows()[l].p[d]; }
    function commas(v) { return Math.round(v).toLocaleString("en-US"); }

    var svg = S("svg", { viewBox: "0 0 760 400", width: "100%",
      role: "img", "aria-label": "needle retrieval by depth and document length" }, f.body);

    var GX = 104, GY = 62, CW = 55, CH = 28;

    function render() {
      while (svg.firstChild) svg.removeChild(svg.firstChild);
      var R = rows(), nd = ND.depths.length, i, j;
      if (li >= R.length) li = R.length - 1;

      T(svg, 8, 14, task ? "four passcodes hidden, one asked for"
          : "one passcode hidden, and asked for",
        { anchor: "start", size: 11.5, fill: task ? C.orange : C.teal });
      T(svg, 752, 14, ND.model + " — probability on the answer, one pass per cell",
        { anchor: "end", size: 10, fill: C.faint });

      /* ---- the heatmap ---- */
      T(svg, GX - 8, GY - 26, "depth of the needle in the document",
        { anchor: "start", size: 10, fill: C.faint });
      for (j = 0; j < nd; j++) {
        T(svg, GX + j * CW + CW / 2, GY - 10, ND.depths[j] + "%",
          { size: 8.5, fill: j === di ? C.orange : C.faint });
      }
      T(svg, GX - 10, GY - 10, "tokens", { anchor: "end", size: 8.5, fill: C.faint });
      for (i = 0; i < R.length; i++) {
        T(svg, GX - 10, GY + i * CH + CH / 2, commas(R[i].len),
          { anchor: "end", size: 9.5, fill: i === li ? C.orange : C.dim });
        for (j = 0; j < nd; j++) {
          var p = R[i].p[j], on = (i === li && j === di);
          rect(svg, GX + j * CW, GY + i * CH, CW - 2, CH - 2,
            { rx: 2, fill: C.pink, stroke: "none", op: 0.5 });
          rect(svg, GX + j * CW, GY + i * CH, CW - 2, CH - 2,
            { rx: 2, fill: C.teal, stroke: "none", op: p });
          var c = rect(svg, GX + j * CW, GY + i * CH, CW - 2, CH - 2,
            { rx: 2, fill: "none", stroke: on ? C.orange : "none", sw: on ? 2 : 0 });
          T(svg, GX + j * CW + (CW - 2) / 2, GY + i * CH + CH / 2, p.toFixed(2),
            { size: 8.5, fill: C.text });
          (function (ii, jj, pp) {
            c.style.cursor = "pointer";
            c.addEventListener("click", function () {
              li = ii; di = jj; sD.set(jj); sL.set(ii); render(); say();
            });
            tipOn(c, commas(R[ii].len) + " tokens, needle at " + ND.depths[jj] + "%",
              "probability on the answer: " + pp.toFixed(4));
          })(i, j, p);
        }
      }

      /* ---- averaged over lengths: the depth profile ---- */
      var PY0 = GY + R.length * CH + 40, PY1 = PY0 + 74;
      T(svg, 8, PY0 - 12, "averaged over every document length, both tasks",
        { anchor: "start", size: 10.5, fill: C.faint });
      line(svg, GX, PY1, GX + nd * CW - 2, PY1, { stroke: C.line, sw: 1 });
      line(svg, GX, PY0, GX, PY1, { stroke: C.line, sw: 1 });
      T(svg, GX - 6, PY0, "1.0", { anchor: "end", size: 8.5, fill: C.faint });
      T(svg, GX - 6, PY1, "0", { anchor: "end", size: 8.5, fill: C.faint });
      [["A", C.teal], ["B", C.orange]].forEach(function (t) {
        var set = ND[t[0]], pts = [];
        for (j = 0; j < nd; j++) {
          var s2 = 0;
          for (i = 0; i < set.length; i++) s2 += set[i].p[j];
          pts.push((GX + j * CW + CW / 2 - 1) + "," + (PY1 - s2 / set.length * (PY1 - PY0)));
        }
        S("polyline", { points: pts.join(" "), fill: "none", stroke: t[1],
          "stroke-width": t[0] === (task ? "B" : "A") ? 2.4 : 1.2,
          opacity: t[0] === (task ? "B" : "A") ? 1 : 0.4 }, svg);
      });
      rect(svg, 470, PY0 - 16, 14, 3, { rx: 1, fill: C.teal, stroke: "none" });
      T(svg, 490, PY0 - 12, "one needle", { anchor: "start", size: 9.5, fill: C.teal });
      rect(svg, 580, PY0 - 16, 14, 3, { rx: 1, fill: C.orange, stroke: "none" });
      T(svg, 600, PY0 - 12, "four needles", { anchor: "start", size: 9.5, fill: C.orange });

      /* ---- what the grid says ---- */
      var lo = 1, loAt = "", hi = 0, all = 0, n = 0;
      for (i = 0; i < R.length; i++) for (j = 0; j < nd; j++) {
        var v = R[i].p[j];
        all += v; n++;
        if (v < lo) { lo = v; loAt = commas(R[i].len) + " tokens at " + ND.depths[j] + "%"; }
        if (v > hi) hi = v;
      }
      var fy = PY1 + 30;
      T(svg, 8, fy, "selected: " + commas(R[li].len) + " tokens, needle at " +
        ND.depths[di] + "% — the model puts " + cell(li, di).toFixed(4) + " on the answer",
        { anchor: "start", size: 11, fill: C.orange });
      /* the section's claim, tested: are the two ends better than the middle? */
      var ends = 0, en = 0, mid = 0, mn = 0;
      for (i = 0; i < R.length; i++) for (j = 0; j < nd; j++) {
        if (j === 0 || j === nd - 1) { ends += R[i].p[j]; en++; }
        else { mid += R[i].p[j]; mn++; }
      }
      T(svg, 8, fy + 20, "Mean " + (all / n).toFixed(2) + ": " + (ends / en).toFixed(2) +
        " at the two ends against " + (mid / mn).toFixed(2) + " in between, worst " +
        lo.toFixed(2) + " at " + loAt + ".",
        { anchor: "start", size: 10.5, fill: task ? C.pink : C.teal });
      T(svg, 8, fy + 40, "P4 hides its fact in 100,000 tokens; this is " +
        commas(R[R.length - 1].len) + " on a laptop. Read the gap between the curves, not the length.",
        { anchor: "start", size: 9.5, fill: C.faint });

      svg.setAttribute("viewBox", "0 0 760 " + (fy + 56));
    }

    function say() {
      var R = rows();
      f.say(commas(R[li].len) + " tokens, needle at " + ND.depths[di] + "%: " +
        cell(li, di).toFixed(4) + " on the answer" +
        (task ? ", with three decoys in the document." : ", with nothing else to confuse it."));
    }

    /* ---- controls ------------------------------------------------------ */
    var tb = tabs(f.controls, ["one needle", "four needles"], 0, function (i) {
      task = i; render(); say();
    });
    var sD = slider(f.controls, "depth", 0, ND.depths.length - 1, 5, 1,
      function (v) { return ND.depths[v] + "%"; },
      function (v) { di = v; render(); say(); });
    var sL = slider(f.controls, "document", 0, ND.A.length - 1, 0, 1,
      function (v) { return commas(ND.A[v].len); },
      function (v) { li = v; render(); say(); });
    f.btn("reset", function () {
      task = 0; di = 5; li = 0;
      tb.sync(0); sD.set(5); sL.set(0); render();
      f.say("Sweep the depth. Then switch to four needles and sweep it again.");
    });

    render();
    f.say("Sweep the depth. Then switch to four needles and sweep it again.");
  };


  /* ========================================================================
     18. llmBlock — CH 8 — Inspector

     A real stack, forward and backward. Thirty-two blocks of width 32, each
     one x -> x + W2 GELU(W1 LayerNorm(x)) with fixed deterministic weights,
     and the backward pass is the actual transposed Jacobian of every piece,
     LayerNorm's included, rather than an animation of one.

     That matters because the section's claim is a claim about arithmetic. The
     residual path contributes an identity term to every Jacobian, so the
     product that carries the gradient down the stack is a product of (I + J)
     rather than of J. Turn the skips off and the same weights, the same
     input and the same loss give a gradient at layer 1 that is orders of
     magnitude smaller — and the machine computes both, so the difference is
     measured on screen rather than asserted underneath it.

     Post-LN is the third setting and it is not a strawman: the normalization
     moves to after the addition, which is exactly the 2017 arrangement, and
     the gradient decays because every block's output is rescaled on the way
     down. That decay is the reason post-LN needed warmup.
     ======================================================================== */
  VIZ.llmBlock = function (el) {
    var f = frame(el);

    var D = 32, L = 32;                        // width and depth of the toy stack
    var mode = 0, sel = 16;
    var MODES = ["pre-LN, with residual", "post-LN, with residual",
                 "no residual, norm kept", "no residual, no norm"];
    function skip() { return mode < 2; }
    function normAt() { return mode === 1 ? "post" : mode === 3 ? "none" : "pre"; }

    /* fixed weights: the reader and the author see the same numbers */
    var W1 = [], W2 = [], i0, j0, r0 = mulberry(hash32("block"));
    for (i0 = 0; i0 < L; i0++) {
      var a = new Float64Array(D * D), b = new Float64Array(D * D);
      for (j0 = 0; j0 < D * D; j0++) {
        a[j0] = gauss(r0) / Math.sqrt(D);
        b[j0] = gauss(r0) / Math.sqrt(D);
      }
      W1.push(a); W2.push(b);
    }
    var X0 = new Float64Array(D);
    for (i0 = 0; i0 < D; i0++) X0[i0] = gauss(r0);

    function nrm(v) { var s = 0, i; for (i = 0; i < D; i++) s += v[i] * v[i]; return Math.sqrt(s); }
    function mat(W, v) {
      var o = new Float64Array(D), i, j;
      for (i = 0; i < D; i++) { var s = 0; for (j = 0; j < D; j++) s += W[i * D + j] * v[j]; o[i] = s; }
      return o;
    }
    function matT(W, v) {
      var o = new Float64Array(D), i, j;
      for (i = 0; i < D; i++) { var s = 0; for (j = 0; j < D; j++) s += W[j * D + i] * v[j]; o[i] = s; }
      return o;
    }
    function ln(v) {
      var m = 0, i; for (i = 0; i < D; i++) m += v[i];
      m /= D;
      var s = 0; for (i = 0; i < D; i++) s += (v[i] - m) * (v[i] - m);
      var sd = Math.sqrt(s / D + 1e-5), o = new Float64Array(D);
      for (i = 0; i < D; i++) o[i] = (v[i] - m) / sd;
      return { y: o, sd: sd };
    }
    /* LayerNorm's Jacobian is symmetric: (I - 11'/D - yy'/D) / sd */
    function lnBack(g, y, sd) {
      var i, gs = 0, gy = 0;
      for (i = 0; i < D; i++) { gs += g[i]; gy += g[i] * y[i]; }
      var o = new Float64Array(D);
      for (i = 0; i < D; i++) o[i] = (g[i] - gs / D - y[i] * gy / D) / sd;
      return o;
    }
    function gelu(v) {
      var o = new Float64Array(D), i;
      for (i = 0; i < D; i++) o[i] = 0.5 * v[i] * (1 + Math.tanh(0.7978845608 * (v[i] + 0.044715 * v[i] * v[i] * v[i])));
      return o;
    }
    function geluP(v) {
      var o = new Float64Array(D), i;
      for (i = 0; i < D; i++) {
        var x = v[i], t = Math.tanh(0.7978845608 * (x + 0.044715 * x * x * x));
        o[i] = 0.5 * (1 + t) + 0.5 * x * (1 - t * t) * 0.7978845608 * (1 + 3 * 0.044715 * x * x);
      }
      return o;
    }

    /* one forward pass, keeping what the backward pass needs */
    function forward() {
      var x = X0.slice(), tape = [], i, np = normAt();
      for (i = 0; i < L; i++) {
        var pre = x.slice(), rec = {}, h = pre;
        if (np === "pre") { var n1 = ln(pre); h = n1.y; rec.ny = n1.y; rec.nsd = n1.sd; }
        rec.a1 = mat(W1[i], h);
        var a2 = mat(W2[i], gelu(rec.a1));
        var sum = new Float64Array(D), k;
        for (k = 0; k < D; k++) sum[k] = (skip() ? pre[k] : 0) + a2[k];
        if (np === "post") { var n2 = ln(sum); rec.oy = n2.y; rec.osd = n2.sd; x = n2.y.slice(); }
        else x = sum;
        rec.norm = nrm(x);
        tape.push(rec);
      }
      return { x: x, tape: tape };
    }

    /* and the exact transposed Jacobian back down the stack */
    function backward(fw) {
      var g = fw.x.slice(), out = new Array(L + 1), i, np = normAt();
      out[L] = nrm(g);
      for (i = L - 1; i >= 0; i--) {
        var r = fw.tape[i], gs = g;
        if (np === "post") gs = lnBack(g, r.oy, r.osd);
        var gff = matT(W2[i], gs), gp = geluP(r.a1), k;
        for (k = 0; k < D; k++) gff[k] *= gp[k];
        gff = matT(W1[i], gff);
        if (np === "pre") gff = lnBack(gff, r.ny, r.nsd);
        var gn = new Float64Array(D);
        for (k = 0; k < D; k++) gn[k] = (skip() ? gs[k] : 0) + gff[k];
        g = gn;
        out[i] = nrm(g);
      }
      return out;
    }

    var svg = S("svg", { viewBox: "0 0 760 400", width: "100%",
      role: "img", "aria-label": "a stack of blocks, forward and backward" }, f.body);

    var GX0 = 62, GX1 = 744, NY0 = 68, NY1 = 158, GY0 = 208, GY1 = 306;

    function render() {
      while (svg.firstChild) svg.removeChild(svg.firstChild);
      var fw = forward(), gr = backward(fw), i;

      T(svg, 8, 14, L + " blocks of width " + D + ", forward and backward, computed here",
        { anchor: "start", size: 11, fill: C.faint });
      T(svg, 752, 14, MODES[mode], { anchor: "end", size: 11,
        fill: mode === 0 ? C.teal : mode === 1 ? C.orange : C.pink });
      var TONE = mode === 0 ? C.teal : mode === 1 ? C.orange : C.pink;

      function bx(i) { return GX0 + i / (L - 1) * (GX1 - GX0 - 10); }

      /* ---- the stream's norm, layer by layer ---- */
      var nmax = 1e-9;
      fw.tape.forEach(function (r) { nmax = Math.max(nmax, r.norm); });
      T(svg, 8, NY0 - 12, "norm of the residual stream after each block",
        { anchor: "start", size: 10.5, fill: C.faint });
      line(svg, GX0, NY1, GX1, NY1, { stroke: C.line, sw: 1 });
      T(svg, GX0 - 6, NY0, nmax.toFixed(0), { anchor: "end", size: 8.5, fill: C.faint });
      T(svg, GX0 - 6, NY1, "0", { anchor: "end", size: 8.5, fill: C.faint });
      for (i = 0; i < L; i++) {
        var h = fw.tape[i].norm / nmax * (NY1 - NY0);
        var c = rect(svg, bx(i), NY1 - h, (GX1 - GX0 - 10) / L - 2, h,
          { rx: 1, fill: i === sel ? C.orange : C.blue, stroke: "none",
            op: i === sel ? 0.9 : 0.45 });
        (function (k) {
          c.style.cursor = "pointer";
          c.addEventListener("click", function () { sel = k; render(); say(); });
          tipOn(c, "block " + (k + 1), "stream norm " + fw.tape[k].norm.toFixed(3) +
            "<br>gradient reaching its input: " + gr[k].toExponential(2));
        })(i);
      }

      /* ---- the gradient, log scale ---- */
      T(svg, 8, GY0 - 12, "gradient magnitude arriving at each block's input, log scale",
        { anchor: "start", size: 10.5, fill: C.faint });
      var lo = Infinity, hi = 0;
      gr.forEach(function (v) { if (v > 0) { lo = Math.min(lo, v); hi = Math.max(hi, v); } });
      if (!isFinite(lo) || lo <= 0) lo = 1e-30;
      var span = Math.max(1, Math.log10(hi / lo));
      function gy(v) {
        return GY1 - Math.min(1, Math.max(0, Math.log10(Math.max(v, lo) / lo) / span)) * (GY1 - GY0);
      }
      line(svg, GX0, GY1, GX1, GY1, { stroke: C.line, sw: 1 });
      line(svg, GX0, GY0, GX0, GY1, { stroke: C.line, sw: 1 });
      T(svg, GX0 - 6, GY0, hi.toExponential(0), { anchor: "end", size: 8.5, fill: C.faint });
      T(svg, GX0 - 6, GY1, lo.toExponential(0), { anchor: "end", size: 8.5, fill: C.faint });
      var pts = [];
      for (i = 0; i <= L; i++) pts.push((GX0 + i / L * (GX1 - GX0 - 10)) + "," + gy(gr[i]));
      S("polyline", { points: pts.join(" "), fill: "none",
        stroke: TONE, "stroke-width": 2.2 }, svg);
      S("circle", { cx: GX0 + sel / L * (GX1 - GX0 - 10), cy: gy(gr[sel]), r: 4,
        fill: C.orange }, svg);
      T(svg, GX0 + 4, GY1 + 14, "block 1", { anchor: "start", size: 9, fill: C.faint });
      T(svg, GX1 - 10, GY1 + 14, "block " + L, { anchor: "end", size: 9, fill: C.faint });

      /* ---- the number the section is about ---- */
      var ratio = gr[L] > 0 ? gr[0] / gr[L] : 0;
      T(svg, 8, 336, "block " + (sel + 1) + ": stream norm " + fw.tape[sel].norm.toFixed(2) +
        ", gradient at its input " + gr[sel].toExponential(2),
        { anchor: "start", size: 11, fill: C.orange });
      T(svg, 8, 356, "The gradient reaching block 1 is " +
        (ratio >= 0.01 ? ratio.toFixed(2) + "x" : ratio.toExponential(1) + "x") +
        " the one at the top.", { anchor: "start", size: 11, fill: TONE });
      T(svg, 8, 376,
        mode === 0 ? "The identity path in x + F(x) is why a 32-deep stack trains at all."
        : mode === 1 ? "Post-LN rescales every block's output on the way down: that is what warmup was for."
        : mode === 2 ? "Worse, but the norm layer is still rescaling and holding it up."
        : "Skips and norm both gone, and now it is the vanishing gradient the textbooks draw.",
        { anchor: "start", size: 10.5, fill: TONE });
      T(svg, 8, 396, "Every number here is a real forward and backward pass over fixed weights, " +
        "LayerNorm's Jacobian included.", { anchor: "start", size: 9.5, fill: C.faint });

      svg.setAttribute("viewBox", "0 0 760 412");
    }

    function say() {
      var fw = forward(), gr = backward(fw);
      f.say("Block " + (sel + 1) + ": stream norm " + fw.tape[sel].norm.toFixed(2) +
        ", gradient " + gr[sel].toExponential(2) + ". At block 1 it is " +
        gr[0].toExponential(2) + " against " + gr[L].toExponential(2) + " at the top.");
    }

    /* ---- controls ------------------------------------------------------ */
    var tb = tabs(f.controls, ["pre-LN", "post-LN", "no residual", "neither"], 0, function (i) {
      mode = i; render(); say();
    });
    var sB = slider(f.controls, "block", 0, L - 1, 16, 1,
      function (v) { return String(v + 1); },
      function (v) { sel = v; render(); say(); });
    f.btn("reset", function () {
      mode = 0; sel = 16; tb.sync(0); sB.set(16); render();
      f.say("Follow one vector through the block. Then remove the residual connections.");
    });

    render();
    f.say("Follow one vector through the block. Then remove the residual connections.");
  };


  /* ========================================================================
     19. llmActivations — CH 8 — Comparator

     Three things, none of them asserted.

     The curves are the functions, evaluated. The parameter arithmetic is the
     section's, live: a two-matrix feed-forward at 4x on Corvid's 4,096 costs
     2 x 4,096 x 16,384 = 134,217,728, and matching that with three matrices
     needs 134,217,728 / (3 x 4,096) = 10,923, which is 2.667x — four times
     two thirds. The real-model ratios are the section's own table.

     The third thing is an ablation, run here on 12 September 2026 because
     Chapter 38's table records this variant as "not measured, the run did not
     finish in budget". Four layers, width 128, 400 steps from one seed on
     identical batches, 256 held-out sequences, paired:

       GELU 4x           823,296 params   val 2.4823
       SwiGLU 2.667x     822,784 params   val 2.4868   +0.0045 [+0.0014, +0.0076]
       SwiGLU 4x       1,085,440 params   val 2.4750   -0.0073 [-0.0105, -0.0041]

     Read honestly, that is not Shazeer's result and the machine says so. At
     823,296 parameters and 400 steps of character prediction, matched SwiGLU
     is very slightly worse and the interval excludes zero. What the run does
     demonstrate is the arithmetic of fairness: the version that wins is the
     one carrying 32% more parameters, which is exactly the comparison the
     two-thirds correction exists to prevent.
     ======================================================================== */
  VIZ.llmActivations = function (el) {
    var f = frame(el);

    var DM = 4096, MULT = 4;
    var REAL = [
      { n: "GPT-2", d: 768, ff: 3072, a: "GELU" },
      { n: "Llama-2-7B", d: 4096, ff: 11008, a: "SwiGLU" },
      { n: "Llama-3-8B", d: 4096, ff: 14336, a: "SwiGLU" },
      { n: "Mistral-7B-v0.3", d: 4096, ff: 14336, a: "SwiGLU" },
      { n: "Gemma-2-9B", d: 3584, ff: 14336, a: "GELU" },
      { n: "Qwen2.5-7B", d: 3584, ff: 18944, a: "SwiGLU" }
    ];
    var ABL = [
      { n: "GELU 4x", p: 823296, v: 2.4823, d: null },
      { n: "SwiGLU 2.667x", p: 822784, v: 2.4868, d: 0.0045, ci: [0.0014, 0.0076] },
      { n: "SwiGLU 4x", p: 1085440, v: 2.4750, d: -0.0073, ci: [-0.0105, -0.0041] }
    ];

    var act = 0, matched = true;               // 0 ReLU, 1 GELU, 2 SwiGLU
    var NAMES = ["ReLU", "GELU", "SwiGLU"];

    function relu(x) { return x > 0 ? x : 0; }
    function gelu(x) {
      return 0.5 * x * (1 + Math.tanh(0.7978845608 * (x + 0.044715 * x * x * x)));
    }
    function silu(x) { return x / (1 + Math.exp(-x)); }
    function fn(x) { return act === 0 ? relu(x) : act === 1 ? gelu(x) : silu(x); }

    function dff() {
      if (act < 2) return DM * MULT;
      return matched ? Math.round(DM * MULT * 2 / 3) : DM * MULT;
    }
    function params() { return (act < 2 ? 2 : 3) * DM * dff(); }
    function commas(v) { return Math.round(v).toLocaleString("en-US"); }
    function fmtP(n) { return (n / 1e6).toFixed(1) + "M"; }

    var svg = S("svg", { viewBox: "0 0 760 420", width: "100%",
      role: "img", "aria-label": "three activations, matched on parameters" }, f.body);

    var CX0 = 40, CX1 = 300, CY0 = 60, CY1 = 200;

    function render() {
      while (svg.firstChild) svg.removeChild(svg.firstChild);
      var i, base = 2 * DM * DM * MULT;

      T(svg, 8, 14, "Corvid's d_model " + commas(DM) + ", feed-forward at " + MULT + "x",
        { anchor: "start", size: 11, fill: C.faint });
      T(svg, 752, 14, NAMES[act] + (act === 2 ? (matched ? ", width corrected to 2/3"
          : ", width left at 4x") : ""),
        { anchor: "end", size: 11, fill: C.orange });

      /* ---- the curve ---- */
      function cx(x) { return CX0 + (x + 4) / 8 * (CX1 - CX0); }
      function cy(y) { return CY1 - (y + 1) / 5 * (CY1 - CY0); }
      line(svg, CX0, cy(0), CX1, cy(0), { stroke: C.line, sw: 1 });
      line(svg, cx(0), CY0, cx(0), CY1, { stroke: C.line, sw: 1 });
      T(svg, CX1, cy(0) + 13, "input", { anchor: "end", size: 9, fill: C.faint });
      [1, 2, 3].forEach(function (v) {        // 0 would sit on the x axis itself
        T(svg, cx(0) - 6, cy(v), String(v), { anchor: "end", size: 8.5, fill: C.faint });
      });
      [[relu, C.dim, 0], [gelu, C.dim, 1], [silu, C.dim, 2]].forEach(function (c) {
        var pts = [], x;
        for (i = 0; i <= 120; i++) {
          x = -4 + i / 120 * 8;
          pts.push(cx(x) + "," + cy(c[0](x)));
        }
        S("polyline", { points: pts.join(" "), fill: "none",
          stroke: c[2] === act ? C.orange : C.dim, "stroke-width": c[2] === act ? 2.4 : 1,
          opacity: c[2] === act ? 1 : 0.35 }, svg);
      });
      T(svg, CX0 + 4, CY0 + 4, act === 2 ? "SiLU, the gate's curve" : NAMES[act],
        { anchor: "start", size: 10, fill: C.orange });
      T(svg, CX0 + 4, CY1 + 26, act === 2
          ? "SwiGLU is a shape, not a curve: silu(x W_gate) * (x W_up), then W_down."
          : act === 1 ? "No dead zone: small negatives pass through slightly."
          : "Hard cut at zero, and a unit stuck negative gets no gradient ever.",
        { anchor: "start", size: 9.5, fill: C.faint });

      /* ---- the parameter arithmetic, live ---- */
      var RX = 336, ry = 58;
      function row(k, v, tone) {
        T(svg, RX, ry, k, { anchor: "start", size: 10.5, fill: C.faint });
        T(svg, 752, ry, v, { anchor: "end", size: 11, fill: tone || C.text });
        ry += 21;
      }
      T(svg, RX, 38, "one layer's feed-forward, on Corvid",
        { anchor: "start", size: 11, fill: C.faint });
      row("matrices", act < 2 ? "2  (up, down)" : "3  (gate, up, down)");
      row("intermediate width", commas(dff()) +
        "   " + (dff() / DM).toFixed(3) + "x", act === 2 && matched ? C.teal : C.text);
      /* the two-thirds width is 10,922.667, so a matched layer misses by a few
         thousand out of 134 million. That is rounding, not a mismatch. */
      var off = params() / base - 1, even = Math.abs(off) < 0.001;
      row("parameters", commas(params()), even ? C.teal : C.pink);
      row("against a 2-matrix 4x layer", commas(base));
      row("difference", (off === 0 ? "none" : (off > 0 ? "+" : "") +
        (off * 100).toFixed(Math.abs(off) < 0.01 ? 3 : 1) + "%"),
        even ? C.teal : C.pink);
      T(svg, RX, ry + 4, act === 2 && matched
          ? commas(base) + " / (3 x " + commas(DM) + ") = " + commas(base / (3 * DM)) +
            ", which is 4 x two thirds."
          : act === 2 ? "Three matrices at full width is 50% more network, not a fairer test."
          : "Two matrices, so the 4x default and nothing to correct.",
        { anchor: "start", size: 9.5, fill: act === 2 && matched ? C.teal : C.faint });

      /* ---- what real models actually chose ---- */
      var TY = 250;
      T(svg, 8, TY - 10, "ratios read from real configurations",
        { anchor: "start", size: 10.5, fill: C.faint });
      var maxr = 5.4;
      REAL.forEach(function (m, k) {
        var yy = TY + 4 + k * 17, r = m.ff / m.d;
        T(svg, 8, yy, m.n, { anchor: "start", size: 9.5, fill: C.dim });
        rect(svg, 130, yy - 5, r / maxr * 220, 10, { rx: 2,
          fill: Math.abs(r - 8 / 3) < 0.03 ? C.teal : C.blue, stroke: "none", op: 0.55 });
        T(svg, 360, yy, r.toFixed(3) + "x  " + m.a, { anchor: "start", size: 9.5,
          fill: Math.abs(r - 8 / 3) < 0.03 ? C.teal : C.faint });
      });
      line(svg, 130 + (8 / 3) / maxr * 220, TY - 2, 130 + (8 / 3) / maxr * 220, TY + 4 + 6 * 17 - 12,
        { stroke: C.teal, sw: 1, dash: "3 3" });
      T(svg, 8, TY + 4 + 6 * 17 + 2, "Only Llama-2 sits on the rule. It told you how to run the " +
        "ablation, never how wide to build.", { anchor: "start", size: 9.5, fill: C.faint });

      /* ---- the ablation, run for this machine ---- */
      var AX = 470, ay = TY + 4;
      T(svg, AX, TY - 10, "ablation run for this machine, 400 steps",
        { anchor: "start", size: 10.5, fill: C.faint });
      ABL.forEach(function (a) {
        var hot = (act === 2 && matched && a.n === "SwiGLU 2.667x") ||
                  (act === 2 && !matched && a.n === "SwiGLU 4x") ||
                  (act === 1 && a.n === "GELU 4x");
        T(svg, AX, ay, a.n, { anchor: "start", size: 9.5, fill: hot ? C.orange : C.dim });
        T(svg, 660, ay, fmtP(a.p), { anchor: "end", size: 9.5, fill: C.faint });
        T(svg, 752, ay, a.v.toFixed(4), { anchor: "end", size: 9.5,
          fill: hot ? C.orange : C.text });
        ay += 17;
        if (a.d !== null) {
          T(svg, AX + 10, ay, (a.d > 0 ? "+" : "") + a.d.toFixed(4) + "  [" +
            a.ci[0].toFixed(4) + ", " + a.ci[1].toFixed(4) + "]",
            { anchor: "start", size: 9, fill: a.d > 0 ? C.pink : C.teal });
          ay += 16;
        }
      });
      T(svg, AX, ay + 4, "paired against GELU, 256 held-out sequences",
        { anchor: "start", size: 9, fill: C.faint });

      T(svg, 8, 396, "At this size matched SwiGLU is 0.0045 worse, not better — a 823,296-parameter " +
        "model is not where the effect lives.", { anchor: "start", size: 10, fill: C.pink });
      T(svg, 8, 414, "What it does show: the variant that wins carries 32% more parameters — " +
        "the comparison the rule exists to prevent.",
        { anchor: "start", size: 10, fill: C.teal });

      svg.setAttribute("viewBox", "0 0 760 430");
    }

    function say() {
      f.say(NAMES[act] + ": " + (act < 2 ? "2" : "3") + " matrices, intermediate " +
        commas(dff()) + ", " + commas(params()) + " parameters against " +
        commas(2 * DM * DM * MULT) + " for a two-matrix layer at 4x.");
    }

    /* ---- controls ------------------------------------------------------ */
    var tb = tabs(f.controls, ["ReLU", "GELU", "SwiGLU"], 0, function (i) {
      act = i; render(); say();
    });
    var tgM = toggle(f.controls, "two-thirds correction", true, function (v) {
      matched = v; render();
      if (act < 2) { f.say("The correction only applies to SwiGLU: two matrices have nothing to shrink."); return; }
      f.say(v ? "Intermediate width " + commas(dff()) + ": the parameter counts now match, and the " +
                "comparison is between activations rather than between network sizes."
              : "Three matrices at the full 4x width: " + commas(params()) + " parameters against " +
                commas(2 * DM * DM * MULT) + ", which is 50% more network.");
    });
    f.btn("reset", function () {
      act = 0; matched = true; tb.sync(0); tgM.set(true); render();
      f.say("Switch to SwiGLU, then turn the two-thirds correction off and watch the parameter count.");
    });

    render();
    f.say("Switch to SwiGLU, then turn the two-thirds correction off and watch the parameter count.");
  };


  /* ========================================================================
     20. llmParamCounter — CH 9 — Builder

     The section's table, live. At Corvid's settings every line matches: the
     embedding at 525,336,576, attention at 41,943,040, feed-forward at
     176,160,768, two norms at 8,192, a block at 218,112,000, 32 of them at
     6,979,584,000, and 8,030,261,248 in total. The machine says so on screen
     rather than leaving the reader to trust it.

     The head dimension is pinned at 128 and the head count derived from
     d_model, which is what every model in the section does, and it is what
     makes the blueprint's discovery true: doubling d_model doubles the head
     count too, so Q and O grow with d squared while the embedding grows
     linearly. The total does not quadruple — the blocks do, and the
     vocabulary does not, so watching the two shares move apart is the more
     useful version of that observation.
     ======================================================================== */
  VIZ.llmParamCounter = function (el) {
    var f = frame(el);

    var DHEAD = 128;
    var eD = 12, eV = 17, eL = 5, eKV = 3, ffm = 3.5, tied = false;
    /* Corvid: d 4,096, vocab 128,256, 32 layers, 8 KV heads, ff 14,336 */
    var vocabExact = 128256;

    function d() { return 1 << eD; }
    function V() { return eV === 17 ? vocabExact : 1 << eV; }
    function L() { return 1 << eL; }
    function kv() { return 1 << eKV; }
    function heads() { return d() / DHEAD; }
    function ff() { return Math.round(d() * ffm); }

    function embed() { return V() * d(); }
    function attn() {
      return d() * heads() * DHEAD * 2 + d() * kv() * DHEAD * 2;
    }
    function ffn() { return 3 * d() * ff(); }
    function norms() { return 2 * d(); }
    function block() { return attn() + ffn() + norms(); }
    function head() { return tied ? 0 : V() * d(); }
    function total() { return embed() + L() * block() + d() + head(); }

    function commas(v) { return Math.round(v).toLocaleString("en-US"); }
    function pct(a, b) { return (a / b * 100).toFixed(a / b < 0.001 ? 3 : 2) + "%"; }
    function bytes(n, per) {
      var b = n * per;
      if (b >= 1e9) return (b / 1e9).toFixed(2) + " GB";
      return (b / 1e6).toFixed(0) + " MB";
    }
    function isCorvid() {
      return d() === 4096 && V() === 128256 && L() === 32 && kv() === 8 &&
             ff() === 14336 && !tied;
    }

    var svg = S("svg", { viewBox: "0 0 760 420", width: "100%",
      role: "img", "aria-label": "a parameter count, built from a config" }, f.body);

    function render() {
      while (svg.firstChild) svg.removeChild(svg.firstChild);
      var T0 = total(), i;

      T(svg, 8, 14, "d_model " + commas(d()) + " · " + heads() + " heads of " + DHEAD +
        " · " + kv() + " KV · ff " + commas(ff()) + " · " + L() + " layers · vocab " + commas(V()),
        { anchor: "start", size: 11, fill: C.faint });
      T(svg, 752, 14, isCorvid() ? "this is Corvid-8B" : "",
        { anchor: "end", size: 11, fill: C.teal });

      /* ---- the table ---- */
      var ry = 46;
      function row(k, n, tone, ind) {
        T(svg, 8 + (ind || 0), ry, k, { anchor: "start", size: 10.5, fill: tone || C.dim });
        T(svg, 300, ry, commas(n), { anchor: "end", size: 10.5, fill: tone || C.text });
        T(svg, 366, ry, pct(n, T0), { anchor: "end", size: 9.5, fill: C.faint });
        ry += 19;
      }
      T(svg, 8, 30, "parameters", { anchor: "start", size: 10, fill: C.faint });
      row("token embeddings", embed(), C.blue);
      row("W_Q + W_O", d() * heads() * DHEAD * 2, C.faint, 12);
      row("W_K + W_V", d() * kv() * DHEAD * 2, C.faint, 12);
      row("feed-forward, 3 matrices", ffn(), C.faint, 12);
      row("two norm gains", norms(), C.faint, 12);
      row("one block", block(), C.orange);
      row(L() + " blocks", L() * block(), C.orange);
      row("final norm", d(), C.faint);
      row(tied ? "output projection, tied" : "output projection", head(), C.blue);
      line(svg, 8, ry - 12, 366, ry - 12, { stroke: C.line, sw: 1 });
      T(svg, 8, ry + 2, "total", { anchor: "start", size: 11.5, fill: C.text });
      T(svg, 300, ry + 2, commas(T0), { anchor: "end", size: 11.5,
        fill: isCorvid() ? C.teal : C.text });
      T(svg, 366, ry + 2, (T0 / 1e9).toFixed(2) + "B", { anchor: "end", size: 10, fill: C.faint });

      /* ---- where it lives, to scale ---- */
      var BX = 404, BW = 348;
      T(svg, BX, 30, "to scale", { anchor: "start", size: 10, fill: C.faint });
      var seg = [[embed(), C.blue, "embed"], [L() * block(), C.pink, "blocks"],
                 [d(), C.dim, ""], [head(), C.blue, "head"]];
      var x = BX;
      seg.forEach(function (s2) {
        var w = s2[0] / T0 * BW;
        if (w > 0.2) rect(svg, x, 40, Math.max(1, w - 1), 26,
          { rx: 3, fill: s2[1], stroke: "none", op: 0.7 });
        x += w;
      });
      T(svg, BX, 80, "embedding " + pct(embed(), T0), { anchor: "start", size: 9.5, fill: C.blue });
      T(svg, BX + BW, 80, "blocks " + pct(L() * block(), T0),
        { anchor: "end", size: 9.5, fill: C.pink });

      T(svg, BX, 108, "inside one block", { anchor: "start", size: 10, fill: C.faint });
      var seg2 = [[attn(), C.orange, "attention"], [ffn(), C.teal, "feed-forward"],
                  [norms(), C.dim, "norms"]];
      x = BX;
      seg2.forEach(function (s2) {
        var w = s2[0] / block() * BW;
        if (w > 0.2) rect(svg, x, 118, Math.max(1, w - 1), 22,
          { rx: 3, fill: s2[1], stroke: "none", op: 0.7 });
        x += w;
      });
      T(svg, BX, 154, "attention " + pct(attn(), block()), { anchor: "start", size: 9.5, fill: C.orange });
      T(svg, BX + BW, 154, "feed-forward " + pct(ffn(), block()),
        { anchor: "end", size: 9.5, fill: C.teal });
      T(svg, BX, 172, "the two norms are " + pct(norms(), block()) + " of a block",
        { anchor: "start", size: 9.5, fill: C.faint });

      /* ---- what it weighs ---- */
      T(svg, BX, 208, "on disk", { anchor: "start", size: 10, fill: C.faint });
      var py = 228;
      [["fp32", 4], ["bf16", 2], ["int8", 1], ["4-bit", 0.5]].forEach(function (p) {
        T(svg, BX, py, p[0], { anchor: "start", size: 10, fill: C.dim });
        rect(svg, BX + 52, py - 6, T0 * p[1] / (T0 * 4) * 160, 12,
          { rx: 2, fill: C.blue, stroke: "none", op: 0.5 });
        T(svg, BX + 300, py, bytes(T0, p[1]), { anchor: "end", size: 10, fill: C.text });
        py += 20;
      });

      /* ---- the discovery ---- */
      var d2 = d() * 2, e2 = V() * d2;
      var b2 = (d2 * (d2 / DHEAD) * DHEAD * 2 + d2 * kv() * DHEAD * 2) +
               3 * d2 * Math.round(d2 * ffm) + 2 * d2;
      var t2 = e2 + L() * b2 + d2 + (tied ? 0 : e2);
      T(svg, 8, 340, "double d_model to " + commas(d2) + " and the total goes to " +
        commas(t2) + ", which is " + (t2 / T0).toFixed(2) + "x",
        { anchor: "start", size: 11, fill: C.orange });
      T(svg, 8, 360, "the blocks alone go " + (b2 / block()).toFixed(2) +
        "x — every weight matrix is d by d — while the vocabulary only doubles.",
        { anchor: "start", size: 10.5, fill: C.faint });
      T(svg, 8, 380, "Vocabulary is " + pct(embed() + head(), T0) +
        " of this model. On a 0.5B one it is over a quarter, which is when tying stops being optional.",
        { anchor: "start", size: 10, fill: C.faint });
      T(svg, 8, 400, isCorvid()
          ? "8,030,261,248 — the figure on Corvid's spec card, produced from the config rather than quoted."
          : "Press Corvid-8B to put every number back on the card.",
        { anchor: "start", size: 10, fill: isCorvid() ? C.teal : C.faint });

      svg.setAttribute("viewBox", "0 0 760 416");
    }

    function say() {
      f.say(commas(total()) + " parameters: " + pct(embed() + head(), total()) +
        " vocabulary, " + pct(L() * block(), total()) + " blocks, " +
        bytes(total(), 2) + " at bf16.");
    }

    /* ---- controls ------------------------------------------------------ */
    var sD = slider(f.controls, "d_model", 9, 13, 12, 1,
      function (v) { return commas(1 << v); },
      function (v) {
        eD = v;
        if (eKV > eD - 7) { eKV = eD - 7; sK.set(eKV); }
        render(); say();
      });
    var sL = slider(f.controls, "layers", 0, 6, 5, 1,
      function (v) { return String(1 << v); },
      function (v) { eL = v; render(); say(); });
    var sK = slider(f.controls, "KV heads", 0, 6, 3, 1,
      function (v) { return String(1 << v); },
      function (v) { eKV = Math.min(v, eD - 7); render(); say(); });
    var sF = slider(f.controls, "ff x", 1, 6, 3.5, 0.5,
      function (v) { return v.toFixed(1); },
      function (v) { ffm = v; render(); say(); });
    var sV = slider(f.controls, "vocab", 13, 18, 17, 1,
      function (v) { return v === 17 ? "128,256" : commas(1 << v); },
      function (v) { eV = v; render(); say(); });
    var tgT = toggle(f.controls, "tie embeddings", false, function (v) {
      tied = v; render();
      f.say(v ? "Tied: the output projection is the embedding table transposed, so " +
                commas(V() * d()) + " parameters disappear from the count."
              : "Untied, as Corvid is: two tables of " + commas(V() * d()) + ".");
    });
    f.btn("Corvid-8B", function () {
      eD = 12; eV = 17; eL = 5; eKV = 3; ffm = 3.5; tied = false;
      sD.set(12); sL.set(5); sK.set(3); sF.set(3.5); sV.set(17); tgT.set(false);
      render();
      f.say("8,030,261,248 parameters, and every line of the section's table is on screen.");
    });
    f.btn("reset", function () {
      eD = 12; eV = 17; eL = 5; eKV = 3; ffm = 3.5; tied = false;
      sD.set(12); sL.set(5); sK.set(3); sF.set(3.5); sV.set(17); tgT.set(false);
      render();
      f.say("Build Corvid-8B. Then try to make a 3B model with the same context.");
    });

    render();
    f.say("Build Corvid-8B. Then try to make a 3B model with the same context.");
  };


  /* ========================================================================
     21. llmMemoryFit — CH 9 — Tuner

     Sections 4 and 5, priced live. The inference table comes back exactly:
     Corvid at 8,192 tokens and one request is 17.13 GB at bf16, 9.10 at int8,
     5.09 at 4-bit, and the first of those does not fit a 16 GB card. So does
     the training figure: 2 + 4 + 4 + 4 + 4 bytes a parameter is 18, and
     18 x 8.03e9 is 144.5 GB against an 80 GB H100.

     Activation memory is the one term the section gives as "tens of
     gigabytes more" rather than a formula, so this machine counts the actual
     tensors a backward pass has to keep — six d-sized ones, two kv-sized,
     three ff-sized, and the attention probabilities, which are the only term
     that grows with sequence length. The count is on screen beside the
     total. Gradient checkpointing keeps the block boundary only, and the
     toggle shows what that trade is worth: it is usually the difference
     between fitting and not.
     ======================================================================== */
  VIZ.llmMemoryFit = function (el) {
    var f = frame(el);

    var N = 8030261248, D = 4096, L = 32, KV = 8, FF = 14336, DHEAD = 128;
    var HEADS = D / DHEAD;
    var CARD = 16e9, H100 = 80e9;

    var train = false, wbits = 2, eB = 0, eS = 13, ckpt = false;
    function batch() { return 1 << eB; }
    function seq() { return 1 << eS; }

    function weights() { return N * (train ? 2 : wbits); }
    function optState() { return train ? N * 16 : 0; }   // fp32 master, grads, m, v
    function kvCache() {
      return train ? 0 : 2 * L * KV * DHEAD * 2 * seq() * batch();
    }
    /* what a backward pass must keep, per token per layer, counted rather
       than guessed: 6 of width d, 2 of width kv*d_head, 3 of width ff, and
       the attention probabilities, which are heads numbers per key position */
    function actPerTok() {
      if (ckpt) return D;
      return 6 * D + 2 * KV * DHEAD + 3 * FF + HEADS * seq();
    }
    /* Serving keeps nothing for a backward pass, so the section counts only
       weights and cache and so does this: the few megabytes in flight would
       move the published 17.13 GB and teach nothing. */
    function acts() {
      if (!train) return 0;
      return actPerTok() * L * seq() * batch() * 2;
    }
    function total() { return weights() + optState() + kvCache() + acts(); }

    function gb(b) { return (b / 1e9).toFixed(2) + " GB"; }
    function commas(v) { return Math.round(v).toLocaleString("en-US"); }

    var svg = S("svg", { viewBox: "0 0 760 400", width: "100%",
      role: "img", "aria-label": "memory, stacked against a card" }, f.body);

    var BX = 8, BW = 744, BY = 78, BH = 34;

    function render() {
      while (svg.firstChild) svg.removeChild(svg.firstChild);
      var t = total(), i;
      var top = Math.max(t, H100) * 1.04;

      T(svg, 8, 14, "Corvid-8B, " + (train ? "training" : "serving") + ": batch " +
        batch() + " at " + commas(seq()) + " tokens",
        { anchor: "start", size: 11, fill: C.faint });
      T(svg, 752, 14, train ? "mixed-precision AdamW" : "weights at " +
        (wbits === 2 ? "bf16" : wbits === 1 ? "int8" : "4-bit"),
        { anchor: "end", size: 11, fill: C.orange });

      /* ---- the stack ---- */
      var parts = [["weights", weights(), C.teal],
                   ["optimizer state and gradients", optState(), C.pink],
                   ["KV cache", kvCache(), C.blue],
                   ["activations", acts(), C.orange]];
      var x = BX;
      parts.forEach(function (p) {
        if (p[1] <= 0) return;
        var w = p[1] / top * BW;
        rect(svg, x, BY, Math.max(1, w), BH, { rx: 3, fill: p[2], stroke: "none", op: 0.75 });
        x += w;
      });
      rect(svg, BX, BY, BW, BH, { rx: 3, fill: "none", stroke: C.line, sw: 1 });

      [[CARD, "16 GB card", C.pink], [H100, "80 GB H100", C.orange]].forEach(function (c) {
        var cx = BX + c[0] / top * BW;
        line(svg, cx, BY - 12, cx, BY + BH + 8, { stroke: c[2], sw: 1.5, dash: "4 3" });
        /* the line can sit hard against either edge once the bar is huge */
        var an = cx < 42 ? "start" : cx > 716 ? "end" : "middle";
        T(svg, cx + (an === "start" ? -4 : an === "end" ? 4 : 0), BY - 18, c[1],
          { anchor: an, size: 9, fill: c[2] });
      });
      T(svg, BX, BY + BH + 22, gb(t) + " in total",
        { anchor: "start", size: 12, fill: t > H100 ? C.pink : t > CARD ? C.orange : C.teal });
      T(svg, 752, BY + BH + 22, t > H100 ? "over an H100" : t > CARD ? "over a 16 GB card" : "fits both",
        { anchor: "end", size: 11, fill: t > H100 ? C.pink : t > CARD ? C.orange : C.teal });

      /* ---- the components ---- */
      var ry = 158;
      parts.forEach(function (p) {
        if (p[1] <= 0) return;
        rect(svg, 8, ry - 6, 11, 11, { rx: 2, fill: p[2], stroke: "none", op: 0.75 });
        T(svg, 26, ry, p[0], { anchor: "start", size: 10.5, fill: C.dim });
        T(svg, 300, ry, gb(p[1]), { anchor: "end", size: 10.5, fill: C.text });
        T(svg, 366, ry, (p[1] / t * 100).toFixed(1) + "%", { anchor: "end", size: 9.5, fill: C.faint });
        ry += 20;
      });

      /* ---- where the numbers come from ---- */
      var RX = 404, ay = 158;
      function note(s2, tone) {
        T(svg, RX, ay, s2, { anchor: "start", size: 9.5, fill: tone || C.faint });
        ay += 17;
      }
      if (train) {
        note("2 bf16 + 4 fp32 master + 4 grad + 4 m + 4 v", C.dim);
        note("= 18 bytes a parameter, " + gb(N * 18) + " before activations", C.pink);
        note("");
        note(ckpt ? "checkpointed: " + commas(D) + " numbers per token per layer"
                  : commas(actPerTok()) + " numbers per token per layer:", C.dim);
        if (!ckpt) {
          note("  6xd " + commas(6 * D) + " · 2xkv " + commas(2 * KV * DHEAD) +
               " · 3xff " + commas(3 * FF));
          note("  attention probabilities " + commas(HEADS * seq()) + ", the only term", C.orange);
          note("  that grows with sequence length", C.orange);
        }
      } else {
        note("weights = " + N.toExponential(2) + " x " + wbits + " bytes", C.dim);
        note("KV cache = 2 x 32 layers x 8 KV x 128 x 2 bytes", C.dim);
        note("  = 128 KB a token, x " + commas(seq()) + " x " + batch(), C.dim);
        note("");
        note("activations while serving are one token in flight,", C.faint);
        note("a few megabytes, and never the reason for an OOM", C.faint);
      }

      /* ---- the discovery ---- */
      var fixed = weights() + optState(), b2 = -1;
      for (i = 0; i <= 6; i++) {
        var bb = 1 << i;
        var av = train ? actPerTok() * L * seq() * bb * 2 : 0;
        var kvv = train ? 0 : 2 * L * KV * DHEAD * 2 * seq() * bb;
        if (av + kvv > fixed) { b2 = bb; break; }
      }
      T(svg, 8, 300, train
          ? (acts() > weights() + optState()
             ? "Activations are already larger than every weight, gradient and moment combined."
             : b2 > 0 ? "At batch " + b2 + " the activations pass the 18 bytes a parameter and " +
                        "become the thing that fills the card."
             : "Activations stay under the parameter state across every batch on the slider.")
          : (kvCache() > weights()
             ? "The cache is now larger than the weights: " + gb(kvCache()) + " against " + gb(weights()) + "."
             : b2 > 0 ? "At batch " + b2 + " the cache overtakes the weights."
             : "Weights dominate at every batch this slider reaches."),
        { anchor: "start", size: 11, fill: C.orange });
      T(svg, 8, 322, train && !ckpt
          ? "Turn checkpointing on: the stored tensors drop to the block boundary and are recomputed instead."
          : train ? "Checkpointing keeps " + commas(D) + " numbers a token a layer instead of " +
                    commas(6 * D + 2 * KV * DHEAD + 3 * FF + HEADS * seq()) + ", and pays in recompute."
          : "At bf16 the weights alone are " + gb(N * 2) + " and a 16 GB card is already lost.",
        { anchor: "start", size: 10.5, fill: C.faint });
      T(svg, 8, 344, train
          ? "144.5 GB of parameter state against an 80 GB H100 is why Chapter 17 shards it and Chapter 21 freezes it."
          : "Serving is weights plus cache. Training is weights times nine, and then activations on top.",
        { anchor: "start", size: 10, fill: C.faint });
      T(svg, 8, 366, "Activation memory is counted from the tensors a backward pass keeps, not from a rule of thumb.",
        { anchor: "start", size: 9.5, fill: C.faint });

      svg.setAttribute("viewBox", "0 0 760 382");
    }

    function say() {
      f.say((train ? "Training" : "Serving") + " at batch " + batch() + ", " + commas(seq()) +
        " tokens: " + gb(total()) + " in total, of which " + gb(acts()) + " is activations.");
    }

    /* ---- controls ------------------------------------------------------ */
    var mt = tabs(f.controls, ["serving", "training"], 0, function (i) {
      train = !!i; render(); say();
    });
    var pt = tabs(f.controls, ["bf16", "int8", "4-bit"], 0, function (i) {
      wbits = i === 0 ? 2 : i === 1 ? 1 : 0.5;
      if (train) { f.say("Training runs in mixed precision; the weight precision switch applies to serving."); return; }
      render(); say();
    });
    var sB = slider(f.controls, "batch", 0, 6, 0, 1,
      function (v) { return String(1 << v); },
      function (v) { eB = v; render(); say(); });
    var sS = slider(f.controls, "tokens", 9, 15, 13, 1,
      function (v) { return commas(1 << v); },
      function (v) { eS = v; render(); say(); });
    var tgC = toggle(f.controls, "gradient checkpointing", false, function (v) {
      ckpt = v; render();
      f.say(v ? "Only the block boundary is kept and the rest is recomputed: activations fall to " +
                gb(acts()) + "."
              : "Every intermediate kept for the backward pass: " + gb(acts()) + ".");
    });
    f.btn("reset", function () {
      train = false; wbits = 2; eB = 0; eS = 13; ckpt = false;
      mt.sync(0); pt.sync(0); sB.set(0); sS.set(13); tgC.set(false); render();
      f.say("Set training mode. Watch what actually fills the card.");
    });

    render();
    f.say("Set training mode. Watch what actually fills the card.");
  };


  /* ========================================================================
     22. llmMoeRouter — CH 10 — Simulator

     Section 3's rich-get-richer loop, run rather than asserted. Eight
     experts, a router that is one 4-wide weight vector each, and a token
     stream drawn from four clusters. One update rule does the whole thing:
     a chosen expert's weight moves toward the token it was chosen for, by
     the gate weight it was given. Nothing else is needed for collapse — the
     chosen expert's weight vector grows, a longer vector wins more dot
     products, and it is chosen for tokens that were never its kind.

     The balancing loss is the real one, not a thumb on the scale: Switch
     Transformer's L_aux = E · sum_e f_e · P_e, with f the fraction of slots
     an expert took and P the router's softmax over ALL experts, and its
     gradient applied to every expert. The P_e factor is the point — it is
     why the loss reaches experts the router did not choose, which is exactly
     the gradient the main objective cannot supply. L_aux is displayed
     whether or not it is being applied, so it can be watched climbing away
     from 1.000 during a collapse.

     At 200 tokens with top-2 and no balancing, expert 6 takes 70% of tokens
     against a 25% fair share and three experts are left under a tenth of it,
     which is the section's figure and the blueprint's discovery. Turn
     balancing on and the same 200 tokens spread 18-32%.

     Capacity is per batch of 64 and does what section 3 says: at a 1.25
     factor the collapsed run drops 24% of its slots and the balanced run 7%.
     That gap is the load-imbalance-costs-wall-clock argument of section 5,
     in the one place a reader can see it.
     ======================================================================== */
  VIZ.llmMoeRouter = function (el) {
    var f = frame(el);

    var E = 8, D = 4, NT = 4, NZ = 0.4, LR = 0.15, W0 = 0.2, AUXC = 32, BATCH = 64;
    var CAPS = [0, 1, 1.25, 1.5, 2];
    var EC = [C.blue, C.teal, C.orange, C.green, C.pink, C.sky, C.purple, C.dim];

    var K = 2, bal = false, ci = 0;
    var cen, W, load, n, dropped, skipped, inB, bi, recent, auxL, cap;

    function init() {
      var r = mulberry(7), c, d, e, v, nn;
      cen = [];
      for (c = 0; c < NT; c++) {
        v = []; for (d = 0; d < D; d++) v.push(gauss(r));
        nn = Math.sqrt(v.reduce(function (s, z) { return s + z * z; }, 0));
        cen.push(v.map(function (z) { return z / nn; }));
      }
      W = [];
      for (e = 0; e < E; e++) {
        v = []; for (d = 0; d < D; d++) v.push(gauss(r) * W0);
        W.push(v);
      }
      load = []; for (e = 0; e < E; e++) load.push(0);
      n = 0; dropped = 0; skipped = 0; bi = 0; recent = []; auxL = 0;
      inB = []; for (e = 0; e < E; e++) inB.push(0);
      cap = CAPS[ci] ? Math.ceil(CAPS[ci] * K * BATCH / E) : Infinity;
      rng = r;
    }
    var rng;

    function softmax(z, idx) {
      var m = -Infinity, i, out = [], s = 0;
      for (i = 0; i < idx.length; i++) if (z[idx[i]] > m) m = z[idx[i]];
      for (i = 0; i < idx.length; i++) { out.push(Math.exp(z[idx[i]] - m)); s += out[i]; }
      for (i = 0; i < idx.length; i++) out[i] /= s;
      return out;
    }

    function step() {
      var d, e, i;
      if (bi === 0) { inB = []; for (e = 0; e < E; e++) inB.push(0); }

      var c = Math.floor(rng() * NT), x = [], nx = 0;
      for (d = 0; d < D; d++) { x.push(cen[c][d] + gauss(rng) * NZ); nx += x[d] * x[d]; }
      nx = Math.sqrt(nx);
      for (d = 0; d < D; d++) x[d] /= nx;

      var z = W.map(function (w) {
        var s = 0; for (var j = 0; j < D; j++) s += w[j] * x[j]; return s;
      });
      var order = z.map(function (v, i2) { return i2; })
                   .sort(function (a, b) { return z[b] - z[a]; });
      var idx = order.slice(0, K), g = softmax(z, idx), took = [];

      n++;
      var f0 = load.map(function (v) { return v / Math.max(1, n * K); });

      for (i = 0; i < idx.length; i++) {
        e = idx[i];
        if (inB[e] >= cap) { dropped++; continue; }
        inB[e]++; load[e]++; took.push(e);
        for (d = 0; d < D; d++) W[e][d] += LR * g[i] * x[d];
      }
      if (!took.length) skipped++;

      /* L_aux = E · Σ f_e P_e, with P the softmax over every expert. Computed
         always so it can be read during a collapse; applied only when on. */
      var all = z.map(function (v, i2) { return i2; });
      var P = softmax(z, all), fb = 0;
      for (e = 0; e < E; e++) fb += f0[e] * P[e];
      auxL = E * fb;
      if (bal) {
        for (e = 0; e < E; e++) {
          var gr = AUXC * E * P[e] * (f0[e] - fb);
          for (d = 0; d < D; d++) W[e][d] -= LR * gr * x[d];
        }
      }

      recent.push({ e: took.length ? took[0] : -1, drop: !took.length });
      if (recent.length > 48) recent.shift();
      bi = (bi + 1) % BATCH;
    }

    function run(m) { for (var i = 0; i < m; i++) step(); render(); say(); }
    function restart() { var t = n; init(); for (var i = 0; i < t; i++) step(); render(); }

    var svg = S("svg", { viewBox: "0 0 760 396", width: "100%",
      role: "img", "aria-label": "eight experts, and the traffic each one took" }, f.body);

    function commas(v) { return Math.round(v).toLocaleString("en-US"); }
    function fair() { return K / E; }
    function share(e) { return n ? load[e] / n : 0; }

    var BX = 104, BW = 430;

    function render() {
      while (svg.firstChild) svg.removeChild(svg.firstChild);
      var e, i, top = 0, dead = 0;
      for (e = 0; e < E; e++) {
        if (share(e) > share(top)) top = e;
        if (n && share(e) < fair() * 0.25) dead++;
      }

      T(svg, 8, 14, E + " experts · top-" + K + " · balancing loss " + (bal ? "on" : "off") +
        " · capacity " + (CAPS[ci] ? CAPS[ci].toFixed(2) + "x, " + cap + " tokens per expert per batch of " + BATCH : "off"),
        { anchor: "start", size: 11, fill: bal ? C.green : C.orange });

      /* ---- the fair-share rule, labelled above its own line ---- */
      var fx = BX + fair() * BW;
      T(svg, fx, 30, "fair share " + (fair() * 100).toFixed(0) + "%",
        { anchor: "middle", size: 9.5, fill: C.faint });
      line(svg, fx, 40, fx, 40 + E * 22 + 4, { stroke: C.faint, sw: 1, dash: "3 3" });

      var y = 54;
      for (e = 0; e < E; e++) {
        var s = share(e), hot = n && s > fair() * 1.6, cold = n && s < fair() * 0.25;
        T(svg, 8, y, "expert " + e, { anchor: "start", size: 10.5, fill: C.dim });
        rect(svg, BX, y - 8, Math.max(n && load[e] ? 1.5 : 0, s * BW), 16,
          { rx: 3, fill: EC[e], stroke: "none", op: 0.75 });
        T(svg, 616, y, n ? commas(load[e]) + " of " + commas(n) : "—",
          { anchor: "end", size: 10.5, fill: C.dim });
        T(svg, 684, y, n ? (s * 100).toFixed(0) + "%" : "",
          { anchor: "end", size: 10.5, fill: hot ? C.pink : cold ? C.orange : C.text });
        T(svg, 752, y, hot ? "overloaded" : cold ? "starved" : "",
          { anchor: "end", size: 9.5, fill: hot ? C.pink : C.orange });
        y += 22;
      }

      /* ---- the numbers ---- */
      var sy = 254;
      line(svg, 8, sy - 16, 752, sy - 16, { stroke: C.line, sw: 1 });
      function stat(x, lab, val, tone) {
        T(svg, x, sy, lab, { anchor: "start", size: 9.5, fill: C.faint });
        T(svg, x, sy + 18, val, { anchor: "start", size: 12, fill: tone || C.text });
      }
      stat(8, "tokens routed", commas(n));
      stat(126, "busiest expert",
        n ? "e" + top + "  " + (share(top) * 100).toFixed(0) + "%" : "—",
        n && share(top) > fair() * 1.6 ? C.pink : C.text);
      stat(268, "starved, under a quarter of fair", n ? dead + " of " + E : "—",
        dead ? C.orange : C.text);
      stat(470, "slots dropped at capacity",
        CAPS[ci] ? commas(dropped) + " of " + commas(n * K) +
          "  " + (n ? (dropped / (n * K) * 100).toFixed(0) : 0) + "%" : "capacity off",
        dropped ? C.pink : C.dim);
      stat(658, "L_aux", n ? auxL.toFixed(3) : "—",
        auxL > 1.25 ? C.pink : auxL ? C.green : C.dim);

      /* ---- the last 48 tokens, coloured by the expert that ranked first --- */
      T(svg, 8, 310, "the last " + Math.min(48, recent.length) + " tokens, by the expert ranked first",
        { anchor: "start", size: 9.5, fill: C.faint });
      for (i = 0; i < recent.length; i++) {
        var r0 = recent[i];
        rect(svg, 8 + i * 12, 318, 10, 12, { rx: 2, stroke: "none",
          fill: r0.drop ? C.faint : EC[r0.e], op: r0.drop ? 0.35 : 0.85 });
      }
      if (skipped) T(svg, 752, 324, commas(skipped) +
        (skipped === 1 ? " token took" : " tokens took") + " no expert at all",
        { anchor: "end", size: 9.5, fill: C.faint });

      /* ---- what it means ---- */
      var msg, tone = C.faint;
      if (!n) msg = "Nothing has been routed yet. Run 200 tokens with balancing off.";
      else if (!bal && share(top) >= 0.6) {
        msg = "Collapsed. Expert " + top + " took " + (share(top) * 100).toFixed(0) +
          "% of tokens against a " + (fair() * 100).toFixed(0) + "% fair share, and " + dead +
          " experts are under a quarter of theirs.";
        tone = C.pink;
      } else if (bal) {
        msg = "Balanced. Every expert is between " +
          (Math.min.apply(null, load.map(function (v) { return v / n; })) * 100).toFixed(0) + "% and " +
          (share(top) * 100).toFixed(0) + "% of tokens, and L_aux is " + auxL.toFixed(3) +
          " against 1.000 for a perfect spread.";
        tone = C.green;
      } else msg = "Keep going. The loop needs a couple of hundred tokens to run to completion.";
      T(svg, 8, 358, msg, { anchor: "start", size: 11, fill: tone });
      T(svg, 8, 378, "One update rule: a chosen expert's weight moves toward its token. " +
        "A longer weight vector wins more dot products.",
        { anchor: "start", size: 10, fill: C.faint });
    }

    function say() {
      if (!n) { f.say("Run 200 tokens with balancing off. Watch one expert eat the model."); return; }
      var top = 0, e;
      for (e = 0; e < E; e++) if (share(e) > share(top)) top = e;
      f.say(commas(n) + " tokens: expert " + top + " took " + (share(top) * 100).toFixed(0) +
        "%, fair share is " + (fair() * 100).toFixed(0) + "%, L_aux " + auxL.toFixed(3) +
        (CAPS[ci] ? ", " + (dropped / (n * K) * 100).toFixed(0) + "% of slots dropped" : "") + ".");
    }

    /* ---- controls ------------------------------------------------------ */
    f.btn("+1 token", function () { run(1); });
    f.btn("+50", function () { run(50); });
    f.btn("run 200", function () { init(); run(200); });
    var tgB = toggle(f.controls, "balancing loss", false, function (v) {
      bal = v; restart();
      f.say(v ? "The same " + commas(n) + " tokens, re-routed with L_aux applied. Its gradient reaches every " +
                "expert through the full softmax, including the ones the router did not choose."
              : "Balancing off. Nothing opposes the loop: chosen more, trained more, therefore chosen more.");
    });
    var sK = slider(f.controls, "top-k", 1, 4, 2, 1,
      function (v) { return String(v); },
      function (v) {
        K = v; restart();
        f.say("top-" + K + ": fair share is now " + (fair() * 100).toFixed(0) +
          "% of tokens per expert, and each token costs " + K + " expert" + (K > 1 ? "s" : "") + " of arithmetic.");
      });
    var sC = slider(f.controls, "capacity", 0, 4, 0, 1,
      function (v) { return CAPS[v] ? CAPS[v].toFixed(2) + "x" : "off"; },
      function (v) {
        ci = v; restart();
        f.say(CAPS[ci] ? "Capacity " + CAPS[ci].toFixed(2) + "x: " + cap + " tokens per expert per batch, and " +
              (n ? (dropped / (n * K) * 100).toFixed(0) : 0) + "% of slots dropped" +
              (bal ? ", with the loss holding the load even." : ". Now turn the balancing loss on.")
            : "Capacity off: every token reaches every expert it picked, however unbalanced that is.");
      });
    f.btn("reset", function () {
      K = 2; bal = false; ci = 0; sK.set(2); tgB.set(false); sC.set(0);
      init(); render();
      f.say("Run 200 tokens with balancing off. Watch one expert eat the model.");
    });

    init();
    render();
    f.say("Run 200 tokens with balancing off. Watch one expert eat the model.");
  };


  /* ========================================================================
     23. llmActiveVsTotal — CH 10 — Comparator

     Section 4's two bills, and the dense model you would have to buy instead.

     Mixtral comes back exactly as printed: one expert 176,160,768, eight per
     layer 1,409,286,144, total 46,701,744,128, active 12,878,876,672, ratio
     3.63x, 93.4 GB to hold and 25.8 GFLOPs to run. The section's figures omit
     the routers — 4,096 x 8 x 32 = 1,048,576 parameters, the "rounding error"
     of section 2 — so this omits them too and says so on screen rather than
     quietly disagreeing by a millionth.

     Qwen3-30B-A3B is derived the same way from its config and lands on 30.52B
     total and 3.34B active, which is what its name claims. DeepSeek-V3 is
     carried at the published 671B/37B instead: its MLA attention and its
     three leading dense layers are not in this chapter's arithmetic, and a
     derivation that needed apologies would be worth less than a quoted pair.

     tokens/second is chapter 26's model rather than a benchmark: single
     stream decode is bandwidth-bound, so it is 3.35 TB/s over the bytes read
     per token. At batch 1 an MoE reads only the experts it picked, which is
     why matching on FLOPs matches on speed. The quality axis uses the
     geometric mean of total and active, the field's rule of thumb, labelled
     as one — and it splits Mixtral's 3.63x evenly, 1.90x of memory bought for
     1.90x of speed.
     ======================================================================== */
  VIZ.llmActiveVsTotal = function (el) {
    var f = frame(el);

    var BW_HBM = 3.35e12;                     // H100 SXM, bytes per second
    var MODELS = [
      { name: "Mixtral-8x7B", d: 4096, L: 32, ff: 14336, E: 8, k: 2, V: 32000,
        qh: 32, kvh: 8, hd: 128, tied: false, dense_ff: 14336, note: "8 experts of full width, top-2" },
      { name: "Qwen3-30B-A3B", d: 2048, L: 48, ff: 768, E: 128, k: 8, V: 151936,
        qh: 32, kvh: 4, hd: 128, tied: false, dense_ff: 6144, note: "128 fine-grained experts, top-8" },
      { name: "DeepSeek-V3", pub: { total: 671e9, active: 37e9 }, E: 256, k: 8, ff: 2048,
        dense_ff: 18432, note: "256 routed experts plus one shared, top-8" }
    ];
    var AXES = ["same FLOPs per token", "same memory", "same quality"];

    var mi = 0, ax = 0;

    function count(m) {
      if (m.pub) return { total: m.pub.total, active: m.pub.active, pub: true };
      var attn = m.d * m.qh * m.hd * 2 + m.d * m.kvh * m.hd * 2;
      var norms = 2 * m.d, one = 3 * m.d * m.ff;
      var vocab = m.V * m.d * (m.tied ? 1 : 2);
      return {
        one: one, all: one * m.E, attn: attn, norms: norms, vocab: vocab,
        total: m.L * (attn + norms + one * m.E) + vocab + m.d,
        active: m.L * (attn + norms + one * m.k) + vocab + m.d
      };
    }
    function denseN(c) {
      if (ax === 0) return c.active;
      if (ax === 1) return c.total;
      return Math.sqrt(c.total * c.active);      // the field's rule of thumb
    }

    function commas(v) { return Math.round(v).toLocaleString("en-US"); }
    function bil(v) { return (v / 1e9).toFixed(v < 1e11 ? 2 : 1) + "B"; }
    function gb(v) {
      var b = v * 2;
      return b >= 1e12 ? (b / 1e12).toFixed(2) + " TB" : (b / 1e9).toFixed(2) + " GB";
    }
    function tps(v) { return (BW_HBM / (2 * v)).toFixed(BW_HBM / (2 * v) < 100 ? 1 : 0); }

    var svg = S("svg", { viewBox: "0 0 760 404", width: "100%",
      role: "img", "aria-label": "an MoE model and the dense model matched to it" }, f.body);

    function render() {
      while (svg.firstChild) svg.removeChild(svg.firstChild);
      var m = MODELS[mi], c = count(m), dn = denseN(c);

      T(svg, 8, 14, m.name + " · " + m.note + " · matched against a dense model on " + AXES[ax],
        { anchor: "start", size: 11, fill: C.teal });

      /* ---- left: where the two numbers come from ---- */
      var y = 46;
      T(svg, 8, 32, c.pub ? "published, not derived here" : "counted from the config, Chapter 9's method",
        { anchor: "start", size: 10, fill: C.faint });
      function row(k, v, tone, sz) {
        T(svg, 8, y, k, { anchor: "start", size: sz || 10.5, fill: tone || C.dim });
        T(svg, 356, y, v, { anchor: "end", size: sz || 10.5, fill: tone || C.text });
        y += 19;
      }
      if (c.pub) {
        row("total parameters", commas(c.total));
        row("active per token", commas(c.active));
        y += 8;
        T(svg, 8, y, "MLA attention and three leading dense layers are outside", { anchor: "start", size: 10, fill: C.faint });
        y += 16;
        T(svg, 8, y, "this chapter's arithmetic, so these are the published pair.", { anchor: "start", size: 10, fill: C.faint });
        y += 30;
      } else {
        row("attention, one layer", commas(c.attn), C.faint);
        row("one expert, 3 x d x ff", commas(c.one), C.orange);
        row(m.E + " experts, per layer", commas(c.all), C.orange);
        row(m.k + " experts, per token", commas(c.one * m.k), C.teal);
        row("embedding + output", commas(c.vocab), C.blue);
        line(svg, 8, y - 12, 356, y - 12, { stroke: C.line, sw: 1 });
        row("TOTAL parameters", commas(c.total), C.text, 11.5);
        row("ACTIVE per token", commas(c.active), C.teal, 11.5);
        row("ratio", (c.total / c.active).toFixed(2) + "x", C.pink, 11.5);
        y += 4;
        T(svg, 8, y, "routers, " + commas(m.d * m.E * m.L) + " parameters, left out as §4 leaves them out.",
          { anchor: "start", size: 9.5, fill: C.faint });
        y += 22;
      }

      T(svg, 8, y, "what each number actually buys", { anchor: "start", size: 10, fill: C.faint });
      y += 20;
      T(svg, 8, y, "hold in memory   " + commas(c.total) + " x 2 bytes", { anchor: "start", size: 10, fill: C.dim });
      T(svg, 356, y, gb(c.total), { anchor: "end", size: 10.5, fill: C.pink });
      y += 19;
      T(svg, 8, y, "pay per token    2 x " + commas(c.active), { anchor: "start", size: 10, fill: C.dim });
      T(svg, 356, y, (2 * c.active / 1e9).toFixed(1) + " GFLOPs", { anchor: "end", size: 10.5, fill: C.teal });

      /* ---- right: the two columns ---- */
      var RX = 400, CA = 610, CB = 752;
      T(svg, RX, 32, "the bill, either way", { anchor: "start", size: 10, fill: C.faint });
      T(svg, CA, 50, m.name.split("-")[0] + ", sparse", { anchor: "end", size: 10, fill: C.teal });
      T(svg, CB, 50, "dense", { anchor: "end", size: 10, fill: C.blue });
      var ry = 76;
      function cmp(k, a, b, tone) {
        T(svg, RX, ry, k, { anchor: "start", size: 10, fill: C.faint });
        T(svg, CA, ry, a, { anchor: "end", size: 10.5, fill: tone || C.text });
        T(svg, CB, ry, b, { anchor: "end", size: 10.5, fill: tone || C.text });
        ry += 21;
      }
      cmp("parameters held", bil(c.total), bil(dn));
      cmp("parameters per token", bil(c.active), bil(dn));
      cmp("memory at bf16", gb(c.total), gb(dn), C.pink);
      cmp("GFLOPs per token", (2 * c.active / 1e9).toFixed(1), (2 * dn / 1e9).toFixed(1), C.teal);
      cmp("decode, H100, batch 1", tps(c.active) + " tok/s", tps(dn) + " tok/s", C.orange);

      /* ---- two bars, to scale ---- */
      var by = 198, BXX = RX, BWW = 352;
      var mmax = Math.max(c.total, dn), smax = Math.max(1 / c.active, 1 / dn);
      T(svg, BXX, by, "memory", { anchor: "start", size: 9.5, fill: C.faint });
      rect(svg, BXX, by + 10, c.total / mmax * BWW, 14, { rx: 3, fill: C.pink, stroke: "none", op: 0.7 });
      rect(svg, BXX, by + 28, dn / mmax * BWW, 14, { rx: 3, fill: C.blue, stroke: "none", op: 0.55 });
      T(svg, BXX, by + 58, "single-stream decode speed", { anchor: "start", size: 9.5, fill: C.faint });
      rect(svg, BXX, by + 68, (1 / c.active) / smax * BWW, 14, { rx: 3, fill: C.orange, stroke: "none", op: 0.7 });
      rect(svg, BXX, by + 86, (1 / dn) / smax * BWW, 14, { rx: 3, fill: C.blue, stroke: "none", op: 0.55 });

      /* ---- the verdict ---- */
      var rM = c.total / dn, rS = dn / c.active, msg;
      if (ax === 0) msg = "Same arithmetic per token, so the same single-stream speed — and the sparse model needs " +
        rM.toFixed(2) + "x the memory to deliver it.";
      else if (ax === 1) msg = "Same " + gb(c.total) + " on the card, and the sparse model decodes " +
        rS.toFixed(2) + "x faster for it.";
      else msg = "Roughly matched quality at the geometric mean of " + bil(c.total) + " and " + bil(c.active) +
        ": the sparse model is " + rS.toFixed(2) + "x faster and costs " + rM.toFixed(2) + "x the memory.";
      T(svg, RX, 328, "", { anchor: "start", size: 10 });
      line(svg, RX, 318, 752, 318, { stroke: C.line, sw: 1 });
      wrapT(svg, RX, 336, 46, 17, msg, { size: 10.5, fill: ax === 1 ? C.teal : C.pink });

      T(svg, 8, 380, ax === 2
          ? "The geometric mean is a rule of thumb from the scaling literature, not a measurement. Read it as an ordering, not a number."
          : "tokens/second is Chapter 26's model: 3.35 TB/s over the bytes a token reads. At batch 1 an MoE reads only what it picked.",
        { anchor: "start", size: 10, fill: C.faint });
    }

    function say() {
      var m = MODELS[mi], c = count(m), dn = denseN(c);
      f.say(m.name + ": " + bil(c.total) + " held, " + bil(c.active) + " per token. Matched on " +
        AXES[ax] + ", the dense model is " + bil(dn) + " — " + (c.total / dn).toFixed(2) +
        "x less memory and " + (dn / c.active).toFixed(2) + "x the arithmetic.");
    }

    /* ---- controls ------------------------------------------------------ */
    var tM = tabs(f.controls, MODELS.map(function (m) { return m.name; }), 0, function (i) {
      mi = i; render(); say();
    });
    var tA = tabs(f.controls, AXES, 0, function (i) { ax = i; render(); say(); });
    f.btn("reset", function () {
      mi = 0; ax = 0; tM.sync(0); tA.sync(0); render();
      f.say("Mixtral: 46.7B to hold, 12.9B to run. Match a dense model on one axis and watch the other diverge.");
    });

    render();
    f.say("Mixtral: 46.7B to hold, 12.9B to run. Match a dense model on one axis and watch the other diverge.");
  };



  /* ========================================================================
     24. llmLogitLens — CH 11 — Stepper

     Real GPT-2 small, run on 12 September 2026: hidden_states with
     output_hidden_states, ln_f applied to each intermediate, multiplied by
     the tied embedding matrix. The last row is asserted equal to the model's
     own logits before shipping, so what is on screen is the lens and not an
     approximation of it.

     The section's shape is there, and two things it does not lead you to
     expect are there too.

     Where the answer takes the lead is later than "two thirds of the way
     up". ' Paris' overtakes ' London' at block 11 of 12; ' 5' overtakes
     ' etc' at block 10. GPT-2 is small and the crossover sits high in it,
     which is worth seeing rather than smoothing over.

     And the last block does not only sharpen. On "The largest planet in our
     solar system is", ' Jupiter' is rank 1 at blocks 10 and 11 — and the
     model's actual output is ' about', with ' Jupiter' back at rank 5. The
     right answer led and lost inside the final block, which is the failure
     the section asks the reader to look for, found in the model rather than
     supposed.
     ======================================================================== */
  VIZ.llmLogitLens = function (el) {
    var f = frame(el);
    var LENS = [
      { p: "The Eiffel Tower is in the city of", ans: " Paris", riv: " London", fin: " Paris", toks: ["The", " E", "iff", "el", " Tower", " is", " in", " the", " city", " of"],
        rows: [
          { t: [" destro", " mathemat", " challeng", " conclud", " arrang"], p: [0.6659, 0.2512, 0.0699, 0.0053, 0.0048], ap: 0.0, ar: 22680, rp: 0.0, rr: 21196 },
          { t: [" the", " course", " a", " his", " '"], p: [0.69, 0.0533, 0.0308, 0.0069, 0.0067], ap: 0.0, ar: 5042, rp: 5e-05, rr: 580 },
          { t: [" the", " course", " a", " its", " late"], p: [0.813, 0.0532, 0.0172, 0.0069, 0.0042], ap: 0.0, ar: 4947, rp: 4e-05, rr: 383 },
          { t: [" the", " course", " a", " its", " late"], p: [0.7202, 0.1282, 0.0218, 0.0065, 0.0055], ap: 0.0, ar: 2365, rp: 0.00026, rr: 84 },
          { t: [" the", " course", " a", " his", " Ar"], p: [0.6878, 0.0655, 0.0126, 0.0074, 0.0064], ap: 2e-05, ar: 1012, rp: 0.00037, rr: 116 },
          { t: [" the", " course", " Z", " La", " Ar"], p: [0.4145, 0.0855, 0.022, 0.0216, 0.0182], ap: 6e-05, ar: 658, rp: 0.00016, rr: 367 },
          { t: [" the", " England", " course", " Mir", " Ar"], p: [0.0575, 0.0528, 0.0421, 0.0328, 0.0296], ap: 0.00042, ar: 261, rp: 0.00283, rr: 66 },
          { t: [" East", " England", " southwest", " south", " La"], p: [0.0567, 0.0452, 0.0387, 0.0354, 0.0345], ap: 0.00136, ar: 103, rp: 0.00496, rr: 45 },
          { t: [" Ing", " Rome", " La", " Naples", " San"], p: [0.1356, 0.0809, 0.0495, 0.0359, 0.0303], ap: 0.0028, ar: 64, rp: 0.00755, rr: 24 },
          { t: [" Rome", " London", " Chicago", " San", " La"], p: [0.1916, 0.0604, 0.0541, 0.0463, 0.0462], ap: 0.02549, ar: 10, rp: 0.06037, rr: 2 },
          { t: [" London", " Paris", " Amsterdam", " Rome", " Chicago"], p: [0.2854, 0.2484, 0.0876, 0.0393, 0.0312], ap: 0.24842, ar: 2, rp: 0.28538, rr: 1 },
          { t: [" Paris", " London", " Amsterdam", " Berlin", " Hamburg"], p: [0.1834, 0.1746, 0.0797, 0.0535, 0.0328], ap: 0.18342, ar: 1, rp: 0.17464, rr: 2 },
          { t: [" Paris", " London", " New", " Amsterdam", " Berlin"], p: [0.07, 0.0584, 0.031, 0.0292, 0.0235], ap: 0.06997, ar: 1, rp: 0.05836, rr: 2 },
        ] },
      { p: "1, 2, 3, 4,", ans: " 5", riv: " etc", fin: " 5", toks: ["1", ",", " 2", ",", " 3", ",", " 4", ","],
        rows: [
          { t: [" mathemat", " challeng", " destro", " arrang", "theless"], p: [0.7634, 0.1159, 0.0837, 0.0197, 0.0106], ap: 0.0, ar: 25090, rp: 0.0, rr: 28464 },
          { t: [" which", " including", " etc", " while", " I"], p: [0.0519, 0.0224, 0.0188, 0.018, 0.0158], ap: 0.00039, ar: 365, rp: 0.01882, rr: 3 },
          { t: [" etc", " which", "6", "5", "7"], p: [0.2065, 0.0301, 0.029, 0.0284, 0.0206], ap: 0.00156, ar: 90, rp: 0.20653, rr: 1 },
          { t: [" etc", "6", "9", " respectively", "8"], p: [0.2904, 0.0683, 0.0626, 0.036, 0.0299], ap: 0.00155, ar: 70, rp: 0.29041, rr: 1 },
          { t: [" etc", "9", " respectively", "6", "19"], p: [0.9466, 0.0044, 0.0041, 0.004, 0.0024], ap: 0.00018, ar: 47, rp: 0.94657, rr: 1 },
          { t: [" etc", " respectively", "etc", "6", " and"], p: [0.9906, 0.006, 0.0008, 0.0002, 0.0002], ap: 1e-05, ar: 41, rp: 0.99062, rr: 1 },
          { t: [" etc", "etc", " respectively", " and", " &"], p: [0.9977, 0.0018, 0.0001, 0.0001, 0.0], ap: 0.0, ar: 35, rp: 0.99768, rr: 1 },
          { t: [" etc", "etc", " respectively", " 3", " &"], p: [0.9982, 0.0015, 0.0, 0.0, 0.0], ap: 1e-05, ar: 11, rp: 0.99817, rr: 1 },
          { t: [" etc", " 4", " 3", " 5", " 6"], p: [0.9904, 0.006, 0.0011, 0.0009, 0.0003], ap: 0.00086, ar: 4, rp: 0.99044, rr: 1 },
          { t: [" 4", " etc", " 5", " 3", " 6"], p: [0.698, 0.2233, 0.051, 0.0197, 0.0024], ap: 0.05102, ar: 3, rp: 0.22335, rr: 2 },
          { t: [" 5", " 4", " 6", "5", " 7"], p: [0.9949, 0.0042, 0.0005, 0.0002, 0.0001], ap: 0.99486, ar: 1, rp: 3e-05, rr: 7 },
          { t: [" 5", " 6", " 4", " 7", " 3"], p: [0.9956, 0.0029, 0.0009, 0.0004, 0.0001], ap: 0.99564, ar: 1, rp: 1e-05, rr: 10 },
          { t: [" 5", " 6", " 4", " and", " 7"], p: [0.8706, 0.0265, 0.0241, 0.0096, 0.0091], ap: 0.8706, ar: 1, rp: 0.00293, rr: 10 },
        ] },
      { p: "Ada Lovelace wrote the first algorithm. Ada", ans: " Lo", riv: "'s", fin: " Lo", toks: ["Ad", "a", " Lo", "vel", "ace", " wrote", " the", " first", " algorithm", ".", " Ada"],
        rows: [
          { t: [" Ada", " mathemat", " Citiz", " Adin", " challeng"], p: [1.0, 0.0, 0.0, 0.0, 0.0], ap: 0.0, ar: 46917, rp: 0.0, rr: 44646 },
          { t: [" Ada", "ption", " Marion", "IO", " Prototype"], p: [0.9862, 0.0075, 0.001, 0.0009, 0.0006], ap: 1e-05, ar: 57, rp: 1e-05, rr: 60 },
          { t: [" Ada", "ption", " Prototype", "IO", " Marion"], p: [0.8572, 0.1227, 0.0018, 0.0017, 0.0012], ap: 0.00042, ar: 9, rp: 0.00019, rr: 16 },
          { t: [" Ada", "ption", " Lo", "IO", " Cortex"], p: [0.775, 0.0988, 0.0106, 0.0075, 0.0058], ap: 0.01065, ar: 3, rp: 0.00147, rr: 15 },
          { t: [" Ada", "ption", " Lo", "IO", " Cortex"], p: [0.5944, 0.0595, 0.0298, 0.0249, 0.0209], ap: 0.02982, ar: 3, rp: 0.01507, rr: 7 },
          { t: [" Ada", "ption", " Lo", "'s", "IO"], p: [0.1973, 0.1558, 0.0895, 0.0447, 0.0359], ap: 0.0895, ar: 3, rp: 0.04466, rr: 4 },
          { t: [" Ada", "'s", " Lo", "Script", " Labs"], p: [0.3502, 0.0895, 0.083, 0.0503, 0.0345], ap: 0.08302, ar: 3, rp: 0.08945, rr: 2 },
          { t: ["'s", " Ada", " Labs", " Lo", " Core"], p: [0.4261, 0.0717, 0.0634, 0.059, 0.0314], ap: 0.05898, ar: 4, rp: 0.42606, rr: 1 },
          { t: ["'s", " Lo", " Labs", " is", " Ada"], p: [0.5939, 0.1084, 0.0664, 0.0207, 0.0192], ap: 0.10845, ar: 2, rp: 0.59387, rr: 1 },
          { t: ["'s", " Lo", " Labs", " is", " Core"], p: [0.7292, 0.0511, 0.0435, 0.0191, 0.0141], ap: 0.05108, ar: 2, rp: 0.72916, rr: 1 },
          { t: [" Lo", "'s", " is", " was", " Ada"], p: [0.3972, 0.3143, 0.0288, 0.02, 0.0146], ap: 0.39718, ar: 1, rp: 0.31433, rr: 2 },
          { t: [" Lo", "'s", "Lo", " was", " L"], p: [0.9883, 0.0025, 0.0018, 0.0005, 0.0004], ap: 0.98827, ar: 1, rp: 0.00248, rr: 2 },
          { t: [" Lo", "'s", " was", "Lo", " wrote"], p: [0.8874, 0.0096, 0.0062, 0.004, 0.0035], ap: 0.88742, ar: 1, rp: 0.00958, rr: 2 },
        ] },
      { p: "The largest planet in our solar system is", ans: " Jupiter", riv: " probably", fin: " about", toks: ["The", " largest", " planet", " in", " our", " solar", " system", " is"],
        rows: [
          { t: [" destro", " mathemat", " arrang", " challeng", "theless"], p: [0.8109, 0.1447, 0.0222, 0.016, 0.0051], ap: 0.0, ar: 42896, rp: 0.0, rr: 4224 },
          { t: [" not", " also", " now", " still", " a"], p: [0.2783, 0.1026, 0.0859, 0.0474, 0.0373], ap: 0.0, ar: 28575, rp: 0.01035, rr: 14 },
          { t: [" now", " not", " also", " still", " currently"], p: [0.3058, 0.1925, 0.1257, 0.0587, 0.0384], ap: 0.0, ar: 29349, rp: 0.01005, rr: 11 },
          { t: [" now", " not", " still", " also", " currently"], p: [0.2222, 0.2142, 0.0792, 0.0675, 0.0445], ap: 0.0, ar: 26247, rp: 0.01133, rr: 11 },
          { t: [" now", " not", " still", " currently", " also"], p: [0.2695, 0.1503, 0.1102, 0.0812, 0.0621], ap: 0.0, ar: 20998, rp: 0.05925, rr: 6 },
          { t: [" now", " not", " still", " probably", " currently"], p: [0.3587, 0.1354, 0.1111, 0.1031, 0.0565], ap: 0.0, ar: 14306, rp: 0.10312, rr: 4 },
          { t: [" probably", " now", " still", " not", " currently"], p: [0.3281, 0.1926, 0.14, 0.0632, 0.0532], ap: 0.0, ar: 3826, rp: 0.32806, rr: 1 },
          { t: [" probably", " now", " still", " indeed", " definitely"], p: [0.626, 0.1034, 0.0594, 0.0449, 0.0403], ap: 0.0, ar: 420, rp: 0.62595, rr: 1 },
          { t: [" probably", " still", " definitely", " indeed", " located"], p: [0.7479, 0.0438, 0.0398, 0.0278, 0.0268], ap: 2e-05, ar: 126, rp: 0.7479, rr: 1 },
          { t: [" probably", " located", " now", " indeed", " undoubtedly"], p: [0.6354, 0.2358, 0.0191, 0.0107, 0.0091], ap: 0.00205, ar: 18, rp: 0.63537, rr: 1 },
          { t: [" Jupiter", " Earth", " Mars", " Venus", " located"], p: [0.348, 0.2558, 0.0969, 0.0682, 0.0612], ap: 0.34799, ar: 1, rp: 0.01284, rr: 9 },
          { t: [" Jupiter", " Earth", " Saturn", " Mars", " located"], p: [0.3644, 0.1929, 0.1265, 0.0816, 0.052], ap: 0.36436, ar: 1, rp: 0.00823, rr: 9 },
          { t: [" about", " the", " a", " Earth", " Jupiter"], p: [0.0938, 0.0621, 0.0583, 0.0282, 0.027], ap: 0.02702, ar: 5, rp: 0.01617, rr: 11 },
        ] },
    ];

    var pi = 0, L = 12;

    function d() { return LENS[pi]; }
    function nL() { return d().rows.length - 1; }
    function lab(i) { return i === 0 ? "embed" : "block " + i; }
    function cross() {                          // first layer the answer leads
      var r = d().rows, i;
      for (i = 0; i < r.length; i++) if (r[i].ar === 1) return i;
      return -1;
    }
    function won() { return d().fin === d().ans; }
    function clip(s) { return s.length > 13 ? s.slice(0, 12) + "…" : s; }
    function q(s) { return "'" + s.replace(/ /g, "·") + "'"; }

    var svg = S("svg", { viewBox: "0 0 760 424", width: "100%",
      role: "img", "aria-label": "what every layer would predict, read through the output matrix" }, f.body);

    function render() {
      while (svg.firstChild) svg.removeChild(svg.firstChild);
      var D = d(), rows = D.rows, i, row;

      T(svg, 8, 14, "GPT-2 small · " + D.p + " ___", { anchor: "start", size: 11, fill: C.teal });
      T(svg, 752, 14, "it answers " + q(D.fin), { anchor: "end", size: 11,
        fill: won() ? C.green : C.orange });

      /* ---- every layer's top token, at a glance ---- */
      T(svg, 8, 34, "top token, layer by layer", { anchor: "start", size: 9.5, fill: C.faint });
      var y = 52;
      for (i = 0; i < rows.length; i++) {
        row = rows[i];
        if (i === L) rect(svg, 4, y - 10, 320, 20, { rx: 4, fill: C.panel, stroke: "none", op: 0.9 });
        T(svg, 10, y, lab(i), { anchor: "start", size: 9.5,
          fill: i === L ? C.text : C.faint });
        T(svg, 74, y, q(clip(row.t[0])), { anchor: "start", size: 10,
          fill: row.t[0] === D.ans ? C.green : row.t[0] === D.riv ? C.orange : C.dim });
        rect(svg, 212, y - 5, row.p[0] * 96, 10, { rx: 2, stroke: "none", op: 0.65,
          fill: row.t[0] === D.ans ? C.green : row.t[0] === D.riv ? C.orange : C.blue });
        T(svg, 322, y, row.p[0].toFixed(2), { anchor: "end", size: 9.5, fill: C.faint });
        y += 20;
      }

      /* ---- the top five at the layer being looked at ---- */
      row = rows[L];
      T(svg, 348, 34, "top five at " + lab(L), { anchor: "start", size: 9.5, fill: C.faint });
      y = 56;
      for (i = 0; i < 5; i++) {
        var isA = row.t[i] === D.ans, isR = row.t[i] === D.riv;
        T(svg, 348, y, (i + 1) + ".", { anchor: "start", size: 9.5, fill: C.faint });
        T(svg, 372, y, q(clip(row.t[i])), { anchor: "start", size: 11,
          fill: isA ? C.green : isR ? C.orange : C.text });
        rect(svg, 524, y - 6, row.p[i] * 172, 12, { rx: 2, stroke: "none", op: 0.65,
          fill: isA ? C.green : isR ? C.orange : C.blue });
        T(svg, 752, y, row.p[i].toFixed(3), { anchor: "end", size: 10, fill: C.dim });
        y += 22;
      }
      T(svg, 348, 178, "answer " + q(D.ans) + " is rank " + row.ar.toLocaleString("en-US") +
        (row.ap >= 0.001 ? " at " + row.ap.toFixed(3) : ""),
        { anchor: "start", size: 10, fill: C.green });
      T(svg, 348, 196, "rival " + q(D.riv) + " is rank " + row.rr.toLocaleString("en-US") +
        (row.rp >= 0.001 ? " at " + row.rp.toFixed(3) : ""),
        { anchor: "start", size: 10, fill: C.orange });

      /* ---- rank of each, every layer, on a log scale ---- */
      var PX0 = 400, PX1 = 744, PY0 = 240, PY1 = 340, MAXR = 5;
      T(svg, 348, 224, "rank of each token, every layer (log scale)",
        { anchor: "start", size: 9.5, fill: C.faint });
      function rx(i) { return PX0 + i / nL() * (PX1 - PX0); }
      function ry(r) { return PY0 + Math.min(MAXR, Math.log(r) / Math.LN10) / MAXR * (PY1 - PY0); }
      [1, 10, 100, 10000].forEach(function (r) {
        line(svg, PX0, ry(r), PX1, ry(r), { stroke: C.line, sw: 1, dash: "2 4" });
        T(svg, PX0 - 10, ry(r), r === 1 ? "rank 1" : r.toLocaleString("en-US"),
          { anchor: "end", size: 9, fill: C.faint });
      });
      ["ar", "rr"].forEach(function (k) {
        var pts = [];
        for (i = 0; i < rows.length; i++) pts.push(rx(i) + "," + ry(rows[i][k]));
        S("polyline", { points: pts.join(" "), fill: "none",
          stroke: k === "ar" ? C.green : C.orange, "stroke-width": 2 }, svg);
      });
      rect(svg, rx(L) - 1, PY0 - 6, 2, PY1 - PY0 + 12, { rx: 1, fill: C.text, stroke: "none", op: 0.35 });
      T(svg, PX0, PY1 + 18, "embed", { anchor: "start", size: 9, fill: C.faint });
      T(svg, PX1, PY1 + 18, "block " + nL(), { anchor: "end", size: 9, fill: C.faint });

      /* ---- what happened ---- */
      var c = cross(), msg, tone;
      if (c < 0) { msg = "The answer never reached rank 1 at any layer."; tone = C.orange; }
      else if (won()) {
        msg = "The answer " + q(D.ans) + " takes the lead at " + lab(c) + " of " + nL() +
          ", " + Math.round(c / nL() * 100) + "% of the way up, and the model keeps it.";
        tone = C.green;
      } else {
        msg = "The answer " + q(D.ans) + " led from " + lab(c) + ", then lost it: the model " +
          "answers " + q(D.fin) + ", with " + q(D.ans) + " back at rank " + rows[nL()].ar + ".";
        tone = C.pink;
      }
      line(svg, 8, 362, 752, 362, { stroke: C.line, sw: 1 });
      T(svg, 8, 382, msg, { anchor: "start", size: 10.5, fill: tone });
      T(svg, 8, 404, won()
          ? "The last blocks mostly sharpen a decision already made — but look at the planet prompt before believing that is a rule."
          : "Which is a different failure from never having considered it: it was rank 1 two blocks earlier.",
        { anchor: "start", size: 10, fill: C.faint });
    }

    function say() {
      var D = d(), c = cross();
      f.say(lab(L) + ": " + q(D.rows[L].t[0]) + " at " + D.rows[L].p[0].toFixed(3) +
        ". The answer " + q(D.ans) + " is rank " + D.rows[L].ar.toLocaleString("en-US") +
        (c >= 0 ? ", and it first leads at " + lab(c) + "." : ", and never leads."));
    }

    /* ---- controls ------------------------------------------------------ */
    var sL = slider(f.controls, "layer", 0, 12, 12, 1,
      function (v) { return v === 0 ? "embed" : String(v); },
      function (v) { L = v; render(); say(); });
    var tP = tabs(f.controls, ["Eiffel Tower", "1, 2, 3, 4,", "Ada Lovelace", "largest planet"], 0,
      function (i) {
        pi = i; L = nL(); sL.set(L); render();
        f.say(d().p + " ___ — step down from the top and find where it changes its mind.");
      });
    f.btn("reset", function () {
      pi = 0; L = 12; tP.sync(0); sL.set(12); render();
      f.say("Step up the layers. Watch the model change its mind.");
    });

    render();
    f.say("Step up the layers. Watch the model change its mind.");
  };


  /* ========================================================================
     25. llmInductionHead — CH 11 — Inspector

     All 144 GPT-2 heads, scored on three sequences that are a token list
     concatenated with itself, so the repeat is exact rather than nearly so.
     Measured 12 September 2026 with output_attentions.

     Two scores, because section 2 is about two heads. The previous-token
     score is the mean weight on position i-1; the induction score is the
     mean weight on position i-T+1 over the second copy, which is the token
     that followed the previous occurrence of the current one.

     Both halves of the circuit fall straight out, and they are the same two
     heads Chapter 6's machine found by a different measurement:

       L4 H11  previous-token, 0.998 / 0.998 / 0.996 across the three
       L5 H5   induction,      0.693 / 0.801 / 0.814

     The digit sequence scores highest, which is the point of including it:
     there is no co-occurrence statistic to lean on in " 7 4 9 2 8", so
     whatever puts 0.75 of its attention on ' 9' is reading the pattern in
     the prompt and nothing else.

     The attention row shipped for every head is at the second occurrence of
     the sequence's second token, where induction and previous-token
     behaviour point at different places and are told apart at a glance. It
     also shows the attention sink of Chapter 6 section 6 still taking its
     cut: L5 H5 leaves 49% on position 0 in the first sequence.
     ======================================================================== */
  VIZ.llmInductionHead = function (el) {
    var f = frame(el);
    var SEQ = [
      { lab: "a sentence, said twice", toks: [" Ada", " Lo", "vel", "ace", " wrote", " code", ".", " Ada", " Lo", "vel", "ace", " wrote", " code", "."], T: 7, q: 8,
        ind: [0.0736, 0.0002, 0.0512, 0.0013, 0.0078, 0.0014, 0.0837, 0.0463, 0.0637, 0.0987, 0.0487, 0.075, 0.0387, 0.0683, 0.0734, 0.0447, 0.0633, 0.0976, 0.0874, 0.0876, 0.0698, 0.0506, 0.0888, 0.0204, 0.0352, 0.0152, 0.0027, 0.0313, 0.0365, 0.0275, 0.0754, 0.0467, 0.0218, 0.0166, 0.0576, 0.0234, 0.0128, 0.062, 0.0065, 0.0039, 0.024, 0.0462, 0.0845, 0.008, 0.0405, 0.011, 0.0261, 0.0445, 0.0299, 0.0422, 0.0287, 0.0086, 0.0127, 0.0176, 0.0361, 0.0212, 0.0252, 0.0226, 0.0221, 0.0, 0.4094, 0.6809, 0.0165, 0.0609, 0.0174, 0.6932, 0.0009, 0.0147, 0.3039, 0.0827, 0.0556, 0.026, 0.0193, 0.0777, 0.03, 0.0805, 0.0367, 0.0353, 0.0919, 0.056, 0.018, 0.4611, 0.0426, 0.0469, 0.005, 0.1207, 0.4224, 0.0656, 0.0167, 0.0326, 0.0696, 0.103, 0.0184, 0.0334, 0.505, 0.0899, 0.0167, 0.3855, 0.0375, 0.0242, 0.0133, 0.0177, 0.195, 0.0087, 0.06, 0.0374, 0.0901, 0.0275, 0.0706, 0.0599, 0.049, 0.0385, 0.0303, 0.0218, 0.1765, 0.0457, 0.0786, 0.189, 0.0087, 0.0245, 0.2228, 0.3056, 0.1221, 0.0874, 0.174, 0.0146, 0.1821, 0.3254, 0.0388, 0.0192, 0.1651, 0.1951, 0.1034, 0.0525, 0.0594, 0.0357, 0.0642, 0.0813, 0.1512, 0.0804, 0.083, 0.2458, 0.2011, 0.1136],
        prev: [0.1489, 0.002, 0.1667, 0.0846, 0.1283, 0.006, 0.1922, 0.366, 0.2116, 0.1887, 0.1023, 0.1747, 0.4278, 0.2505, 0.2014, 0.1373, 0.1512, 0.1468, 0.1339, 0.1484, 0.1512, 0.1367, 0.1976, 0.0377, 0.204, 0.0918, 0.5839, 0.3053, 0.3464, 0.3566, 0.1663, 0.2363, 0.3775, 0.4051, 0.2026, 0.1319, 0.0778, 0.1794, 0.3823, 0.4502, 0.0941, 0.0982, 0.2704, 0.4658, 0.2481, 0.2465, 0.1589, 0.203, 0.3176, 0.1579, 0.0995, 0.2123, 0.13, 0.1508, 0.1758, 0.184, 0.1047, 0.1257, 0.0863, 0.9976, 0.0818, 0.0769, 0.2437, 0.1779, 0.2238, 0.0775, 0.3609, 0.1326, 0.0877, 0.1057, 0.1382, 0.1145, 0.2186, 0.1051, 0.105, 0.121, 0.1184, 0.1275, 0.1003, 0.1352, 0.3765, 0.0771, 0.0926, 0.1403, 0.2509, 0.1055, 0.0782, 0.1215, 0.1108, 0.1344, 0.1055, 0.0909, 0.1634, 0.1154, 0.0778, 0.0798, 0.0967, 0.0811, 0.1019, 0.091, 0.1148, 0.1927, 0.1027, 0.2163, 0.105, 0.1092, 0.1017, 0.0861, 0.1, 0.0816, 0.0911, 0.2123, 0.0946, 0.0948, 0.0819, 0.1146, 0.0924, 0.0838, 0.1446, 0.0823, 0.0867, 0.0801, 0.0889, 0.0865, 0.1054, 0.118, 0.0867, 0.0936, 0.0818, 0.1438, 0.0815, 0.1072, 0.1632, 0.0881, 0.0868, 0.1147, 0.102, 0.0926, 0.0848, 0.0995, 0.1926, 0.0863, 0.1212, 0.1132],
        rows: ["24,13,12,11,4,5,10,10,11,0,0,0,0,0","0,54,0,0,0,0,0,0,46,0,0,0,0,0","22,10,5,11,8,21,12,5,6,0,0,0,0,0","0,0,0,0,0,0,0,0,99,0,0,0,0,0","3,10,0,0,1,1,1,6,79,0,0,0,0,0","0,67,0,0,0,0,0,0,33,0,0,0,0,0","28,11,8,5,5,6,4,24,8,0,0,0,0,0","8,0,0,1,1,2,10,75,3,0,0,0,0,0","30,6,3,3,6,15,13,19,5,0,0,0,0,0","27,5,9,9,11,9,17,10,3,0,0,0,0,0","13,35,5,5,5,3,7,3,24,0,0,0,0,0","19,4,4,6,13,12,16,21,5,0,0,0,0,0","14,2,2,4,9,6,15,37,11,0,0,0,0,0","6,1,1,1,12,8,58,7,6,0,0,0,0,0","13,3,3,4,8,10,20,24,16,0,0,0,0,0","48,3,3,4,7,8,9,10,7,0,0,0,0,0","42,5,4,5,6,7,8,13,10,0,0,0,0,0","43,4,2,3,2,2,33,9,2,0,0,0,0,0","42,5,5,4,2,10,28,3,2,0,0,0,0,0","39,2,5,7,9,8,25,2,2,0,0,0,0,0","30,7,4,6,5,8,26,8,7,0,0,0,0,0","44,10,2,4,7,8,12,4,9,0,0,0,0,0","0,7,6,8,14,14,14,21,16,0,0,0,0,0","1,55,0,0,0,0,7,0,36,0,0,0,0,0","29,3,1,2,3,2,17,25,20,0,0,0,0,0","77,1,1,3,5,5,5,1,1,0,0,0,0,0","2,0,0,0,0,2,5,81,10,0,0,0,0,0","7,1,0,0,7,5,6,38,34,0,0,0,0,0","13,0,0,0,0,0,21,55,10,0,0,0,0,0","8,0,0,1,6,3,52,18,12,0,0,0,0,0","19,1,1,2,11,6,49,5,6,0,0,0,0,0","11,1,2,2,12,9,9,31,23,0,0,0,0,0","20,0,1,1,29,9,19,10,12,0,0,0,0,0","5,0,1,1,2,7,8,59,17,0,0,0,0,0","17,4,3,4,9,9,10,24,20,0,0,0,0,0","67,1,1,2,3,4,6,8,9,0,0,0,0,0","13,65,1,0,0,0,1,0,19,0,0,0,0,0","31,0,0,0,7,7,39,14,2,0,0,0,0,0","2,0,0,0,2,2,1,55,38,0,0,0,0,0","11,0,0,0,0,0,6,56,26,0,0,0,0,0","81,2,1,3,2,1,6,3,1,0,0,0,0,0","72,4,1,2,5,3,4,6,3,0,0,0,0,0","4,0,0,0,0,1,5,70,19,0,0,0,0,0","4,0,1,1,1,4,5,66,20,0,0,0,0,0","15,0,0,0,15,4,29,17,20,0,0,0,0,0","69,0,1,0,2,0,7,18,2,0,0,0,0,0","36,7,2,1,2,4,7,22,20,0,0,0,0,0","43,1,0,0,5,5,10,17,18,0,0,0,0,0","66,0,0,0,2,1,12,17,1,0,0,0,0,0","50,0,0,0,2,2,23,18,4,0,0,0,0,0","83,1,0,0,4,1,6,4,1,0,0,0,0,0","58,1,1,0,0,0,7,21,12,0,0,0,0,0","83,4,1,1,1,0,1,3,5,0,0,0,0,0","64,0,0,0,2,2,11,19,2,0,0,0,0,0","61,1,1,1,4,4,9,15,6,0,0,0,0,0","17,8,1,0,2,1,1,24,45,0,0,0,0,0","83,3,1,4,3,1,3,0,1,0,0,0,0,0","84,0,0,0,2,1,4,6,3,0,0,0,0,0","83,0,7,2,1,2,4,0,0,0,0,0,0,0","0,0,0,0,0,0,0,100,0,0,0,0,0,0","77,0,3,2,14,2,0,0,2,0,0,0,0,0","59,0,41,0,0,0,0,0,0,0,0,0,0,0","65,0,0,0,1,1,1,22,9,0,0,0,0,0","34,1,1,1,7,5,24,21,6,0,0,0,0,0","68,0,0,0,3,4,13,7,5,0,0,0,0,0","49,1,45,0,4,0,0,1,0,0,0,0,0,0","26,0,0,0,0,0,0,66,8,0,0,0,0,0","92,0,0,0,1,1,1,4,2,0,0,0,0,0","81,0,5,1,8,1,0,2,3,0,0,0,0,0","67,2,2,4,4,2,5,13,2,0,0,0,0,0","52,14,1,4,1,1,5,9,15,0,0,0,0,0","87,2,0,1,1,1,1,4,3,0,0,0,0,0","39,1,1,0,1,1,22,27,9,0,0,0,0,0","80,1,1,1,4,0,0,5,8,0,0,0,0,0","76,1,2,2,6,2,10,2,1,0,0,0,0,0","82,1,0,0,5,3,4,3,3,0,0,0,0,0","90,1,3,3,0,0,1,1,2,0,0,0,0,0","67,2,1,1,5,2,6,8,9,0,0,0,0,0","73,3,1,1,8,1,2,4,6,0,0,0,0,0","71,3,2,2,1,2,4,9,6,0,0,0,0,0","38,0,0,0,0,0,1,57,3,0,0,0,0,0","61,0,37,0,2,0,0,0,0,0,0,0,0,0","82,1,1,2,2,1,1,0,11,0,0,0,0,0","62,1,1,1,2,1,12,15,7,0,0,0,0,0","66,0,0,0,0,0,6,26,2,0,0,0,0,0","69,4,2,5,8,3,2,3,2,0,0,0,0,0","82,0,16,0,1,0,0,0,0,0,0,0,0,0","92,0,0,0,1,0,1,1,4,0,0,0,0,0","99,0,0,0,0,0,0,0,0,0,0,0,0,0","85,1,0,1,1,1,8,2,1,0,0,0,0,0","89,1,2,1,1,1,2,2,1,0,0,0,0,0","92,1,0,1,3,1,1,1,1,0,0,0,0,0","95,0,0,0,0,0,1,2,2,0,0,0,0,0","88,0,0,0,0,0,6,1,4,0,0,0,0,0","53,1,43,1,2,0,0,0,0,0,0,0,0,0","99,0,0,0,0,0,0,0,0,0,0,0,0,0","83,1,2,3,1,1,6,2,1,0,0,0,0,0","64,0,15,15,3,0,0,1,0,0,0,0,0,0","96,0,0,1,0,0,1,1,0,0,0,0,0,0","93,1,0,1,0,0,3,1,0,0,0,0,0,0","83,0,0,0,0,0,1,11,5,0,0,0,0,0","84,0,0,0,1,0,5,7,2,0,0,0,0,0","82,1,1,3,1,1,2,6,3,0,0,0,0,0","49,0,0,0,0,0,7,34,9,0,0,0,0,0","77,2,3,4,1,2,1,6,5,0,0,0,0,0","93,1,0,1,0,0,1,2,1,0,0,0,0,0","80,2,1,1,2,1,2,4,8,0,0,0,0,0","88,1,5,2,1,1,2,1,0,0,0,0,0,0","80,2,3,3,0,1,0,8,3,0,0,0,0,0","98,0,0,0,0,0,0,0,0,0,0,0,0,0","91,1,2,0,0,0,1,3,1,0,0,0,0,0","52,1,0,0,1,1,8,32,5,0,0,0,0,0","98,0,0,0,0,0,1,0,0,0,0,0,0,0","88,1,0,1,2,1,1,4,1,0,0,0,0,0","84,0,8,7,0,0,0,0,0,0,0,0,0,0","89,1,0,1,1,0,3,2,2,0,0,0,0,0","96,1,1,0,0,0,0,1,0,0,0,0,0,0","78,1,12,6,1,0,2,0,1,0,0,0,0,0","98,0,0,0,0,0,1,1,1,0,0,0,0,0","98,0,0,0,1,0,0,0,0,0,0,0,0,0","74,1,7,13,1,1,1,1,2,0,0,0,0,0","64,1,18,14,1,0,0,0,2,0,0,0,0,0","94,0,0,1,2,2,1,0,1,0,0,0,0,0","96,0,0,2,0,0,1,0,0,0,0,0,0,0","96,0,1,1,0,0,1,0,0,0,0,0,0,0","99,0,0,0,0,0,0,1,0,0,0,0,0,0","89,0,1,8,0,0,0,0,0,0,0,0,0,0","96,0,0,1,0,0,0,0,1,0,0,0,0,0","95,0,0,2,1,0,1,1,0,0,0,0,0,0","97,0,0,0,0,0,0,2,1,0,0,0,0,0","72,1,17,7,0,0,0,0,1,0,0,0,0,0","82,2,2,8,0,1,2,1,2,0,0,0,0,0","89,3,1,0,1,0,0,1,5,0,0,0,0,0","96,1,0,2,0,0,1,0,0,0,0,0,0,0","86,1,6,5,0,0,1,1,0,0,0,0,0,0","98,0,0,0,0,0,0,0,1,0,0,0,0,0","77,4,1,5,2,1,5,3,2,0,0,0,0,0","88,1,3,6,1,1,0,0,1,0,0,0,0,0","31,2,43,20,0,0,0,2,2,0,0,0,0,0","95,1,1,1,0,0,0,0,0,0,0,0,0,0","0,1,0,0,0,0,0,1,98,0,0,0,0,0","35,2,37,23,0,0,1,1,1,0,0,0,0,0","95,0,1,2,0,0,1,0,0,0,0,0,0,0","100,0,0,0,0,0,0,0,0,0,0,0,0,0"] },
      { lab: "four words that never co-occur", toks: [" vex", " qu", "ilt", " harbor", " zinc", ".", " vex", " qu", "ilt", " harbor", " zinc", "."], T: 6, q: 7,
        ind: [0.1098, 0.0005, 0.0956, 0.0021, 0.0118, 0.0017, 0.0929, 0.0591, 0.0607, 0.1025, 0.0604, 0.1062, 0.0769, 0.0854, 0.086, 0.0542, 0.0749, 0.0841, 0.0636, 0.1123, 0.0894, 0.0845, 0.1062, 0.0124, 0.0659, 0.0523, 0.0074, 0.0331, 0.0481, 0.0364, 0.111, 0.0604, 0.0309, 0.0257, 0.0754, 0.0284, 0.0062, 0.0956, 0.0221, 0.0051, 0.0299, 0.0577, 0.0491, 0.0061, 0.0165, 0.056, 0.0317, 0.0357, 0.0192, 0.0439, 0.0392, 0.0296, 0.0282, 0.0389, 0.0426, 0.0236, 0.049, 0.0169, 0.01, 0.0, 0.4109, 0.53, 0.0419, 0.068, 0.0161, 0.8008, 0.0026, 0.0031, 0.2423, 0.0855, 0.0645, 0.0096, 0.014, 0.0304, 0.0209, 0.0209, 0.0548, 0.0301, 0.0343, 0.0563, 0.0075, 0.6555, 0.0548, 0.0201, 0.0121, 0.134, 0.346, 0.0464, 0.0171, 0.0422, 0.0678, 0.1012, 0.011, 0.0488, 0.5311, 0.0954, 0.0304, 0.2951, 0.0374, 0.0629, 0.014, 0.0118, 0.2557, 0.0126, 0.1155, 0.0479, 0.0856, 0.0878, 0.201, 0.0707, 0.1262, 0.0344, 0.1398, 0.0157, 0.2999, 0.0487, 0.1032, 0.2824, 0.0186, 0.0491, 0.3174, 0.3414, 0.0679, 0.1113, 0.1663, 0.0349, 0.2472, 0.397, 0.0388, 0.0153, 0.3515, 0.3122, 0.1477, 0.1052, 0.087, 0.0899, 0.0864, 0.1198, 0.118, 0.1215, 0.0837, 0.2075, 0.3676, 0.103],
        prev: [0.2356, 0.0011, 0.1753, 0.2433, 0.0725, 0.0056, 0.2007, 0.4582, 0.1936, 0.1967, 0.1063, 0.202, 0.4141, 0.2589, 0.2307, 0.1528, 0.1775, 0.1592, 0.1496, 0.1737, 0.1847, 0.1595, 0.2077, 0.04, 0.2193, 0.1301, 0.5547, 0.3104, 0.2483, 0.3698, 0.1906, 0.2474, 0.339, 0.413, 0.2227, 0.1469, 0.0914, 0.17, 0.404, 0.2386, 0.1043, 0.1338, 0.302, 0.5151, 0.3526, 0.1768, 0.1455, 0.2194, 0.2306, 0.2161, 0.1198, 0.2774, 0.1257, 0.17, 0.2371, 0.2116, 0.1247, 0.1378, 0.0968, 0.998, 0.1228, 0.0918, 0.3246, 0.1998, 0.2575, 0.0959, 0.4877, 0.1105, 0.1419, 0.1352, 0.1554, 0.1212, 0.2661, 0.1127, 0.1158, 0.1331, 0.1156, 0.1973, 0.1222, 0.2089, 0.5477, 0.0939, 0.1422, 0.1818, 0.4133, 0.1075, 0.0957, 0.1567, 0.1562, 0.1194, 0.1302, 0.114, 0.1936, 0.1188, 0.0976, 0.113, 0.1239, 0.0975, 0.1276, 0.1092, 0.1168, 0.1944, 0.1294, 0.2246, 0.1424, 0.1511, 0.1294, 0.1134, 0.1252, 0.0984, 0.1226, 0.2481, 0.102, 0.1074, 0.1129, 0.1118, 0.1126, 0.1123, 0.1602, 0.1005, 0.156, 0.1181, 0.1175, 0.1044, 0.1168, 0.1633, 0.1148, 0.1239, 0.0995, 0.1497, 0.14, 0.1255, 0.2119, 0.1256, 0.1398, 0.1659, 0.1411, 0.1191, 0.1408, 0.1205, 0.1955, 0.1222, 0.1464, 0.1771],
        rows: ["23,10,3,10,24,7,15,8,0,0,0,0","0,60,0,0,0,0,0,39,0,0,0,0","20,16,4,21,6,16,6,11,0,0,0,0","0,1,0,0,0,0,0,99,0,0,0,0","1,13,0,0,0,0,1,85,0,0,0,0","0,59,0,0,0,0,0,41,0,0,0,0","22,9,7,14,26,3,12,8,0,0,0,0","9,2,1,4,5,33,28,17,0,0,0,0","14,11,9,7,27,14,7,11,0,0,0,0","25,5,9,12,16,16,12,3,0,0,0,0","16,37,3,3,5,7,4,24,0,0,0,0","21,8,6,17,15,15,10,8,0,0,0,0","4,1,2,4,5,18,51,15,0,0,0,0","5,1,2,5,5,51,17,13,0,0,0,0","12,3,5,6,12,20,26,16,0,0,0,0","50,4,5,6,7,10,10,8,0,0,0,0","41,5,8,7,9,8,12,10,0,0,0,0","35,14,2,2,3,32,2,9,0,0,0,0","56,8,3,5,2,21,4,2,0,0,0,0","34,5,8,14,7,24,4,4,0,0,0,0","36,6,6,4,8,24,7,9,0,0,0,0","49,8,6,4,6,15,4,8,0,0,0,0","0,7,11,12,17,16,21,15,0,0,0,0","1,42,0,0,0,7,0,49,0,0,0,0","29,2,1,8,7,19,11,23,0,0,0,0","68,1,5,6,11,5,3,1,0,0,0,0","3,0,0,2,1,15,69,9,0,0,0,0","13,0,0,3,11,14,33,25,0,0,0,0","29,0,0,2,1,64,4,1,0,0,0,0","9,0,1,4,6,55,12,12,0,0,0,0","19,1,1,3,4,63,3,5,0,0,0,0","11,1,3,5,9,8,36,26,0,0,0,0","20,0,1,2,2,29,42,4,0,0,0,0","5,0,1,4,10,18,51,10,0,0,0,0","19,4,5,10,13,12,19,18,0,0,0,0","69,1,2,3,4,6,7,8,0,0,0,0","9,71,1,0,0,1,0,17,0,0,0,0","48,0,1,1,3,31,12,4,0,0,0,0","2,0,0,1,2,8,52,34,0,0,0,0","24,0,0,2,11,22,27,13,0,0,0,0","85,1,1,1,2,5,5,1,0,0,0,0","72,1,2,3,4,8,8,1,0,0,0,0","8,1,0,2,11,10,46,22,0,0,0,0","3,0,1,3,9,5,78,3,0,0,0,0","17,0,1,3,4,47,19,9,0,0,0,0","56,0,1,1,1,15,19,7,0,0,0,0","41,4,2,3,10,7,13,20,0,0,0,0","41,0,1,4,6,14,27,7,0,0,0,0","52,0,0,1,0,11,33,2,0,0,0,0","63,0,1,0,1,20,12,4,0,0,0,0","79,0,0,1,0,8,10,2,0,0,0,0","34,0,2,4,4,12,41,2,0,0,0,0","67,4,1,0,0,8,6,14,0,0,0,0","71,0,1,1,2,18,6,2,0,0,0,0","63,1,3,4,5,9,9,7,0,0,0,0","13,5,1,2,7,7,32,33,0,0,0,0","55,4,8,6,3,8,11,7,0,0,0,0","87,0,2,1,2,1,4,2,0,0,0,0","96,0,0,0,0,2,0,0,0,0,0,0","0,0,0,0,0,0,100,0,0,0,0,0","38,1,31,7,2,14,1,5,0,0,0,0","16,0,83,0,0,0,0,0,0,0,0,0","56,1,1,0,1,2,33,7,0,0,0,0","45,1,1,2,2,9,32,8,0,0,0,0","54,1,1,2,1,4,30,7,0,0,0,0","3,0,95,1,0,0,0,0,0,0,0,0","21,0,0,0,1,1,75,1,0,0,0,0","93,0,0,0,0,1,5,0,0,0,0,0","71,0,12,9,0,0,4,3,0,0,0,0","64,2,2,5,3,10,10,5,0,0,0,0","59,4,3,3,5,16,7,3,0,0,0,0","94,0,0,0,0,1,1,3,0,0,0,0","49,2,1,1,4,6,34,5,0,0,0,0","86,0,3,2,3,1,4,1,0,0,0,0","78,0,2,1,2,9,6,1,0,0,0,0","84,2,1,1,3,2,3,4,0,0,0,0","73,1,6,1,3,5,5,5,0,0,0,0","54,2,3,2,2,6,16,15,0,0,0,0","55,5,2,1,2,3,11,21,0,0,0,0","48,3,6,8,15,5,13,3,0,0,0,0","20,0,1,0,1,1,74,3,0,0,0,0","3,0,97,0,0,0,0,0,0,0,0,0","67,1,5,2,3,2,2,17,0,0,0,0","74,0,1,2,0,13,9,1,0,0,0,0","30,0,0,0,3,12,53,3,0,0,0,0","61,2,19,3,4,4,3,4,0,0,0,0","38,0,61,0,0,0,0,0,0,0,0,0","84,0,1,0,1,3,4,6,0,0,0,0","96,0,0,0,0,1,1,2,0,0,0,0","90,0,1,1,4,3,1,0,0,0,0,0","87,2,4,2,1,1,1,2,0,0,0,0","60,4,7,8,3,10,2,5,0,0,0,0","91,0,0,1,2,1,5,1,0,0,0,0","97,0,0,0,0,2,1,0,0,0,0,0","2,0,97,0,0,0,0,0,0,0,0,0","87,0,12,0,0,0,0,0,0,0,0,0","74,2,4,2,4,9,2,4,0,0,0,0","58,0,40,1,0,1,0,0,0,0,0,0","95,0,2,1,1,1,0,0,0,0,0,0","90,1,2,2,0,2,2,1,0,0,0,0","98,0,0,0,0,1,0,0,0,0,0,0","80,0,0,0,1,3,13,2,0,0,0,0","37,1,39,7,6,5,3,1,0,0,0,0","53,0,1,1,2,10,29,5,0,0,0,0","68,0,10,3,11,4,3,1,0,0,0,0","92,0,1,1,3,1,1,1,0,0,0,0","72,1,6,2,1,6,4,7,0,0,0,0","74,2,17,3,2,1,1,0,0,0,0,0","58,1,18,9,4,2,8,1,0,0,0,0","99,0,0,0,0,0,0,0,0,0,0,0","93,0,2,0,1,1,2,0,0,0,0,0","53,1,1,1,5,9,23,7,0,0,0,0","98,0,1,0,0,0,0,0,0,0,0,0","86,1,3,2,2,0,3,2,0,0,0,0","86,0,13,1,0,0,0,0,0,0,0,0","90,1,1,1,0,3,1,3,0,0,0,0","89,0,4,4,2,0,1,0,0,0,0,0","34,0,63,1,0,2,0,0,0,0,0,0","98,0,0,0,0,1,0,0,0,0,0,0","98,0,2,0,0,0,0,0,0,0,0,0","57,0,33,5,3,2,0,0,0,0,0,0","69,0,29,1,0,0,0,0,0,0,0,0","97,0,2,0,0,0,0,0,0,0,0,0","98,0,1,0,0,0,0,0,0,0,0,0","98,0,1,0,0,0,0,0,0,0,0,0","99,0,0,0,0,1,0,0,0,0,0,0","89,0,10,1,0,0,0,0,0,0,0,0","78,0,19,0,0,1,0,2,0,0,0,0","98,0,1,0,0,0,0,0,0,0,0,0","93,0,0,0,1,1,3,1,0,0,0,0","63,0,34,1,0,0,0,1,0,0,0,0","74,0,18,4,1,2,0,0,0,0,0,0","46,16,8,7,7,10,3,3,0,0,0,0","98,0,1,0,0,0,0,0,0,0,0,0","90,0,7,2,0,0,0,0,0,0,0,0","95,1,1,1,1,0,1,0,0,0,0,0","86,1,6,0,1,4,0,1,0,0,0,0","92,0,7,1,0,0,0,0,0,0,0,0","86,1,10,1,0,0,0,1,0,0,0,0","98,0,1,0,0,0,0,0,0,0,0,0","0,13,13,8,6,1,49,10,0,0,0,0","73,0,23,3,0,1,0,0,0,0,0,0","88,0,11,0,0,1,0,0,0,0,0,0","56,2,8,3,1,27,1,2,0,0,0,0"] },
      { lab: "digits, so nothing but the pattern helps", toks: [" 7", " 4", " 9", " 2", " 8", ".", " 7", " 4", " 9", " 2", " 8", "."], T: 6, q: 7,
        ind: [0.1065, 0.0013, 0.1081, 0.0046, 0.0426, 0.0056, 0.0963, 0.0553, 0.095, 0.1094, 0.0776, 0.093, 0.0607, 0.0708, 0.0732, 0.0491, 0.0668, 0.0743, 0.0856, 0.0705, 0.0766, 0.0757, 0.1019, 0.0265, 0.0581, 0.0201, 0.0076, 0.0268, 0.0373, 0.029, 0.0857, 0.0563, 0.0302, 0.0261, 0.0688, 0.027, 0.0222, 0.0699, 0.0162, 0.0111, 0.0921, 0.0462, 0.0353, 0.0171, 0.0423, 0.0723, 0.049, 0.0779, 0.0197, 0.0259, 0.0326, 0.0304, 0.029, 0.0112, 0.055, 0.0339, 0.0467, 0.035, 0.0088, 0.0, 0.4761, 0.682, 0.0423, 0.0871, 0.0234, 0.814, 0.0012, 0.0037, 0.3818, 0.0953, 0.0383, 0.0408, 0.0475, 0.0547, 0.016, 0.0704, 0.0716, 0.0468, 0.0482, 0.086, 0.0131, 0.7318, 0.0622, 0.0197, 0.0171, 0.1059, 0.2709, 0.1, 0.0088, 0.0428, 0.1074, 0.0713, 0.036, 0.0471, 0.7113, 0.0857, 0.0213, 0.1684, 0.0331, 0.018, 0.0026, 0.0611, 0.0851, 0.0241, 0.0718, 0.0344, 0.0523, 0.0178, 0.0285, 0.0728, 0.0108, 0.0625, 0.0434, 0.0169, 0.0658, 0.0437, 0.0087, 0.2329, 0.0099, 0.1119, 0.0365, 0.1197, 0.1162, 0.0409, 0.0578, 0.031, 0.0243, 0.2858, 0.0789, 0.0218, 0.0862, 0.0586, 0.1435, 0.0374, 0.0439, 0.0891, 0.0801, 0.0589, 0.0387, 0.049, 0.1174, 0.0653, 0.1629, 0.1202],
        prev: [0.1804, 0.0017, 0.1993, 0.1047, 0.1995, 0.0257, 0.1909, 0.3635, 0.2037, 0.1955, 0.1378, 0.1816, 0.3034, 0.2693, 0.2242, 0.1445, 0.1753, 0.1477, 0.1507, 0.1514, 0.1686, 0.158, 0.207, 0.099, 0.2781, 0.1153, 0.6855, 0.3298, 0.2595, 0.3412, 0.1937, 0.2565, 0.3344, 0.3561, 0.2141, 0.1483, 0.0959, 0.2028, 0.4654, 0.5367, 0.1827, 0.1278, 0.395, 0.4808, 0.354, 0.1927, 0.2129, 0.2872, 0.1474, 0.2215, 0.116, 0.2175, 0.107, 0.132, 0.2188, 0.2276, 0.134, 0.1551, 0.1015, 0.9962, 0.1659, 0.0986, 0.4113, 0.1781, 0.2606, 0.1008, 0.5749, 0.1015, 0.1669, 0.1383, 0.1257, 0.1449, 0.278, 0.1357, 0.0982, 0.1464, 0.1682, 0.178, 0.126, 0.1907, 0.7544, 0.1173, 0.111, 0.1533, 0.3939, 0.1048, 0.0928, 0.1404, 0.1087, 0.1249, 0.1514, 0.1017, 0.2468, 0.1275, 0.1052, 0.1333, 0.1201, 0.1177, 0.1119, 0.1059, 0.096, 0.185, 0.1469, 0.4006, 0.1457, 0.1161, 0.1272, 0.1084, 0.1086, 0.1137, 0.1016, 0.2272, 0.1197, 0.1219, 0.1078, 0.125, 0.0999, 0.1175, 0.1141, 0.114, 0.1008, 0.1064, 0.1239, 0.107, 0.1502, 0.1318, 0.0985, 0.1436, 0.129, 0.1293, 0.1059, 0.1209, 0.1962, 0.1078, 0.1054, 0.1404, 0.1287, 0.1154, 0.1018, 0.1191, 0.1845, 0.1082, 0.145, 0.1165],
        rows: ["32,6,5,3,5,41,4,3,0,0,0,0","0,53,0,0,1,0,0,46,0,0,0,0","19,12,14,21,9,8,9,8,0,0,0,0","0,1,0,0,1,1,4,93,0,0,0,0","9,8,7,4,9,7,12,43,0,0,0,0","2,61,0,0,0,0,0,36,0,0,0,0","21,8,22,3,18,1,20,8,0,0,0,0","7,2,8,7,9,19,28,21,0,0,0,0","10,11,12,14,10,15,12,15,0,0,0,0","22,11,12,12,11,12,12,9,0,0,0,0","14,27,9,11,9,7,6,18,0,0,0,0","25,9,12,6,12,15,12,9,0,0,0,0","6,2,5,13,13,6,37,17,0,0,0,0","12,2,4,5,7,39,13,18,0,0,0,0","17,2,6,8,9,15,27,17,0,0,0,0","52,4,5,6,7,8,9,9,0,0,0,0","43,6,6,7,9,6,11,12,0,0,0,0","38,6,4,20,2,15,9,6,0,0,0,0","46,7,10,5,6,18,4,5,0,0,0,0","52,6,7,7,8,10,4,6,0,0,0,0","40,7,6,6,7,15,11,9,0,0,0,0","40,11,9,8,8,3,9,11,0,0,0,0","0,9,12,13,15,12,20,19,0,0,0,0","9,17,1,2,2,13,2,54,0,0,0,0","14,3,5,6,10,9,27,25,0,0,0,0","82,1,1,1,2,11,1,1,0,0,0,0","2,0,1,2,6,6,59,25,0,0,0,0","11,1,2,9,8,7,17,44,0,0,0,0","25,0,1,2,2,60,3,7,0,0,0,0","7,0,1,2,4,51,13,21,0,0,0,0","27,4,6,6,10,29,9,9,0,0,0,0","12,1,4,8,12,7,30,27,0,0,0,0","10,1,4,6,11,21,17,30,0,0,0,0","7,1,2,3,10,28,24,25,0,0,0,0","24,5,7,8,12,6,18,19,0,0,0,0","68,2,2,3,4,4,7,9,0,0,0,0","33,39,0,0,0,4,0,23,0,0,0,0","38,3,2,4,3,33,8,8,0,0,0,0","1,0,1,3,2,13,29,52,0,0,0,0","9,0,0,1,2,33,37,16,0,0,0,0","33,4,12,9,12,12,13,6,0,0,0,0","65,5,7,5,7,3,5,3,0,0,0,0","5,1,2,2,5,7,56,23,0,0,0,0","2,0,1,3,6,20,43,25,0,0,0,0","5,0,1,1,2,67,12,11,0,0,0,0","42,1,1,1,2,41,8,5,0,0,0,0","33,4,6,7,7,3,20,19,0,0,0,0","19,5,9,7,12,9,18,21,0,0,0,0","69,0,0,0,0,26,2,2,0,0,0,0","36,1,0,1,1,41,13,7,0,0,0,0","82,3,2,3,1,4,3,2,0,0,0,0","59,1,2,2,3,21,8,6,0,0,0,0","85,2,0,4,0,5,1,2,0,0,0,0","78,1,0,1,1,10,5,5,0,0,0,0","38,4,5,6,7,13,15,12,0,0,0,0","6,4,4,5,6,5,28,43,0,0,0,0","74,1,3,5,2,9,3,2,0,0,0,0","63,3,5,3,5,9,6,5,0,0,0,0","91,1,1,0,1,3,2,0,0,0,0,0","0,0,0,0,0,0,100,0,0,0,0,0","60,3,19,4,7,0,0,6,0,0,0,0","39,0,60,0,0,0,0,0,0,0,0,0","29,1,1,1,9,15,35,9,0,0,0,0","47,7,6,4,6,9,13,9,0,0,0,0","54,2,1,1,1,7,23,10,0,0,0,0","24,0,75,0,0,0,0,0,0,0,0,0","45,0,0,0,0,2,48,4,0,0,0,0","98,0,0,0,0,0,1,0,0,0,0,0","69,0,26,0,2,0,1,1,0,0,0,0","48,8,7,6,7,11,8,5,0,0,0,0","64,10,5,3,2,8,2,5,0,0,0,0","56,8,3,3,4,4,13,9,0,0,0,0","29,3,3,2,4,40,14,5,0,0,0,0","76,4,2,1,2,10,2,4,0,0,0,0","90,2,1,1,1,2,2,0,0,0,0,0","56,7,10,7,9,4,5,3,0,0,0,0","52,5,8,7,7,6,7,9,0,0,0,0","65,6,2,2,2,5,8,11,0,0,0,0","62,7,4,5,5,3,4,11,0,0,0,0","49,8,10,7,9,3,8,6,0,0,0,0","7,0,0,0,2,11,70,9,0,0,0,0","15,0,84,0,0,0,0,0,0,0,0,0","75,5,5,4,2,1,1,6,0,0,0,0","85,2,1,1,1,4,5,2,0,0,0,0","33,1,1,0,1,10,43,10,0,0,0,0","68,3,9,6,5,5,3,2,0,0,0,0","84,3,12,0,0,0,0,1,0,0,0,0","61,5,4,4,4,11,5,5,0,0,0,0","94,1,0,0,0,2,2,1,0,0,0,0","73,4,7,2,4,6,4,1,0,0,0,0","34,7,12,9,7,11,5,15,0,0,0,0","62,8,8,12,5,2,2,2,0,0,0,0","29,5,3,1,2,8,32,20,0,0,0,0","88,3,2,1,1,1,2,2,0,0,0,0","18,3,77,0,1,0,0,0,0,0,0,0","84,2,6,1,1,1,0,6,0,0,0,0","84,3,2,2,2,2,2,3,0,0,0,0","57,6,32,1,2,0,0,1,0,0,0,0","84,2,3,2,2,2,2,2,0,0,0,0","92,2,1,1,1,1,1,0,0,0,0,0","97,1,0,0,0,1,0,0,0,0,0,0","51,4,6,3,9,8,16,4,0,0,0,0","60,7,6,5,2,13,1,5,0,0,0,0","37,2,4,3,6,11,33,5,0,0,0,0","61,6,16,5,5,2,3,2,0,0,0,0","88,2,4,1,2,1,1,1,0,0,0,0","72,5,5,3,4,2,4,5,0,0,0,0","92,2,2,1,1,2,1,1,0,0,0,0","87,2,3,1,2,2,2,1,0,0,0,0","90,2,4,1,0,1,0,1,0,0,0,0","94,1,1,1,1,1,1,0,0,0,0,0","37,5,5,5,13,5,26,4,0,0,0,0","91,1,1,1,1,1,3,0,0,0,0,0","86,2,2,2,1,1,2,4,0,0,0,0","87,2,6,1,1,1,1,1,0,0,0,0","73,6,5,5,4,2,1,4,0,0,0,0","97,0,0,0,0,1,0,0,0,0,0,0","39,10,30,5,6,3,3,4,0,0,0,0","94,1,1,1,1,1,1,1,0,0,0,0","78,5,5,6,1,2,0,2,0,0,0,0","85,1,3,0,3,3,3,1,0,0,0,0","42,5,38,2,7,1,4,2,0,0,0,0","59,8,13,5,4,4,4,4,0,0,0,0","82,2,8,1,3,2,2,1,0,0,0,0","56,10,6,8,4,9,5,2,0,0,0,0","78,4,3,3,1,2,6,4,0,0,0,0","86,2,6,1,2,1,2,1,0,0,0,0","46,2,33,1,7,8,3,1,0,0,0,0","61,5,6,5,2,12,4,6,0,0,0,0","89,1,1,1,1,2,2,2,0,0,0,0","65,4,16,2,4,2,5,2,0,0,0,0","85,2,5,3,2,1,1,1,0,0,0,0","5,20,16,18,12,13,10,6,0,0,0,0","87,3,3,2,2,2,2,1,0,0,0,0","83,3,3,1,2,3,3,1,0,0,0,0","53,12,5,7,5,5,8,4,0,0,0,0","62,9,8,8,3,6,2,2,0,0,0,0","76,5,4,4,4,3,2,1,0,0,0,0","78,4,6,2,3,2,3,2,0,0,0,0","78,3,6,4,4,3,2,1,0,0,0,0","0,12,16,10,8,9,27,18,0,0,0,0","73,3,10,2,4,4,4,1,0,0,0,0","50,6,13,5,10,10,4,2,0,0,0,0","51,8,4,4,4,21,6,2,0,0,0,0"] },
    ];

    var si = 0, mode = 0, sel = 5 * 12 + 5;

    function d() { return SEQ[si]; }
    function score(k) { return (mode ? d().prev : d().ind)[k]; }
    function row(k) { return d().rows[k].split(",").map(Number); }
    function best(arr) {
      var b = 0, i;
      for (i = 0; i < arr.length; i++) if (arr[i] > arr[b]) b = i;
      return b;
    }
    function nm(k) { return "L" + Math.floor(k / 12) + " H" + (k % 12); }
    function show(s) { return s.replace(/ /g, "·"); }

    var svg = S("svg", { viewBox: "0 0 760 430", width: "100%",
      role: "img", "aria-label": "144 heads scored, and the one you picked, read token by token" }, f.body);

    function render() {
      while (svg.firstChild) svg.removeChild(svg.firstChild);
      var D = d(), t = D.toks, n = t.length, i, L2, H, k;
      var qi = D.q, tgt = qi - D.T + 1, r = row(sel);

      T(svg, 8, 14, "GPT-2 small, all 144 heads · " + D.lab, { anchor: "start", size: 11, fill: C.teal });

      /* ---- the sequence, with the query and its induction target marked --- */
      var cw = Math.floor(600 / n), tx = 8;
      for (i = 0; i < n; i++) {
        var isQ = i === qi, isT = i === tgt, isP = i === qi - 1;
        rect(svg, tx, 30, cw - 3, 22, { rx: 3, op: isQ || isT ? 1 : 0.5,
          fill: isQ ? C.blue : isT ? C.teal : isP ? C.orange : "none",
          stroke: i >= D.T ? C.line : C.faint, sw: 1 });
        T(svg, tx + (cw - 3) / 2, 41, show(t[i]).slice(0, 5),
          { size: 9, fill: isQ || isT || isP ? C.card : C.dim });
        tx += cw;
      }
      T(svg, 8, 66, "query " + show(t[qi]) + " (second time) · its induction target is " +
        show(t[tgt]) + " · one step back is " + show(t[qi - 1]),
        { anchor: "start", size: 9.5, fill: C.faint });

      /* ---- 144 heads, scored ---- */
      var GX = 44, GY = 108, CS = 20;
      T(svg, 8, 82, mode ? "previous-token score, by layer and head"
                         : "induction score, by layer and head",
        { anchor: "start", size: 10, fill: mode ? C.orange : C.teal });
      for (H = 0; H < 12; H++)
        T(svg, GX + H * CS + CS / 2, GY - 10, String(H), { size: 8, fill: C.faint });
      for (L2 = 0; L2 < 12; L2++) {
        T(svg, GX - 8, GY + L2 * CS + CS / 2, "L" + L2, { anchor: "end", size: 8, fill: C.faint });
        for (H = 0; H < 12; H++) {
          k = L2 * 12 + H;
          var v = score(k);
          var c = rect(svg, GX + H * CS + 1, GY + L2 * CS + 1, CS - 2, CS - 2,
            { rx: 2, fill: mode ? C.orange : C.teal, stroke: "none", op: 0.06 + v * 0.94 });
          if (k === sel) rect(svg, GX + H * CS, GY + L2 * CS, CS, CS,
            { rx: 3, fill: "none", stroke: C.text, sw: 2 });
          (function (kk) {
            c.style.cursor = "pointer";
            c.addEventListener("click", function () { sel = kk; render(); say(); });
          })(k);
          tipOn(c, nm(k), "induction " + D.ind[k].toFixed(3) +
            "<br>previous-token " + D.prev[k].toFixed(3));
        }
      }
      T(svg, GX, GY + 12 * CS + 16, "click a cell · darker is a higher score",
        { anchor: "start", size: 9, fill: C.faint });

      /* ---- the head you picked, at that one query ---- */
      var RX = 330;
      T(svg, RX, 82, nm(sel) + " at query " + show(t[qi]),
        { anchor: "start", size: 11, fill: C.text });
      T(svg, 752, 82, "induction " + D.ind[sel].toFixed(3) + " · previous-token " +
        D.prev[sel].toFixed(3), { anchor: "end", size: 9.5, fill: C.faint });
      var by = 112, bh = 18;
      for (i = 0; i < n; i++) {
        var hit = i === tgt, back = i === qi - 1;
        T(svg, RX + 46, by + 9, show(t[i]).slice(0, 6), { anchor: "end", size: 9,
          fill: hit ? C.teal : back ? C.orange : C.faint });
        rect(svg, RX + 54, by + 2, Math.max(r[i] ? 1.5 : 0, r[i] / 100 * 300), bh - 4,
          { rx: 2, stroke: "none", op: 0.75,
            fill: hit ? C.teal : back ? C.orange : i === 0 ? C.purple : C.blue });
        if (r[i] >= 2) T(svg, RX + 60 + r[i] / 100 * 300, by + 9, r[i] + "%",
          { anchor: "start", size: 9, fill: C.dim });
        by += bh;
        if (i > qi) break;
      }
      if (r[0] >= 5) T(svg, RX, by + 16, "position 0 takes " + r[0] +
        "% — Chapter 6's attention sink.", { anchor: "start", size: 9.5, fill: C.purple });

      /* ---- what it is doing ---- */
      var bi = best(mode ? D.prev : D.ind), msg, tone;
      if (D.ind[sel] > 0.4) {
        msg = nm(sel) + " is an induction head: at the second " + show(t[qi]) + " it puts " +
          r[tgt] + "% on " + show(t[tgt]) + ", the token that followed the first one.";
        tone = C.teal;
      } else if (D.prev[sel] > 0.4) {
        msg = nm(sel) + " is a previous-token head: " + r[qi - 1] + "% on " + show(t[qi - 1]) +
          ", one step back. That is the note the induction head reads.";
        tone = C.orange;
      } else {
        msg = nm(sel) + " does neither: induction " + D.ind[sel].toFixed(3) +
          ", previous-token " + D.prev[sel].toFixed(3) + ". Most of the 144 are like this.";
        tone = C.faint;
      }
      line(svg, 8, 372, 752, 372, { stroke: C.line, sw: 1 });
      T(svg, 8, 390, msg, { anchor: "start", size: 10.5, fill: tone });
      T(svg, 8, 412, "The best " + (mode ? "previous-token" : "induction") + " head here is " +
        nm(bi) + " at " + score(bi).toFixed(3) +
        ". Neither half of the circuit predicts anything alone.",
        { anchor: "start", size: 10, fill: C.faint });
    }

    function say() {
      var D = d();
      f.say(nm(sel) + " on " + D.lab + ": induction " + D.ind[sel].toFixed(3) +
        ", previous-token " + D.prev[sel].toFixed(3) + ".");
    }

    /* ---- controls ------------------------------------------------------ */
    var tS = tabs(f.controls, ["said twice", "nonsense words", "digits"], 0, function (i) {
      si = i; render(); say();
    });
    var tM = tabs(f.controls, ["induction", "previous-token"], 0, function (i) {
      mode = i; render();
      f.say(i ? "Previous-token score: the weight on position i-1. One head has it at 0.998."
              : "Induction score: the weight on whatever followed this token last time.");
    });
    f.btn("best of each", function () {
      sel = best(mode ? d().prev : d().ind); render();
      f.say("The strongest " + (mode ? "previous-token" : "induction") + " head is " + nm(sel) +
        ". Switch the score and press again for the other half of the circuit.");
    });
    f.btn("reset", function () {
      si = 0; mode = 0; sel = 5 * 12 + 5; tS.sync(0); tM.sync(0); render();
      f.say("Find the head that fires only on a repeated token. L5 H5 is already selected.");
    });

    render();
    f.say("Find the head that fires only on a repeated token. L5 H5 is already selected.");
  };



  /* ========================================================================
     26. llmCorpusPipeline — CH 12 — Stepper

     A thousand documents, generated to order from a seed so the same corpus
     comes back every time, and six filters that measure them rather than
     consult the label that made them. Every number on screen is counted from
     the text: word counts, the fraction of lines that are prose, alphabetic
     fraction, bullet fraction, and MinHash-64 signatures over five-word
     shingles with LSH banding, which is the actual algorithm of section 4
     rather than a stand-in for it.

     The discovery the blueprint asks for is there and is worse than it
     sounds: 400 of the 1,000 documents are the same licence, differing only
     in a year and a project name. At the default 0.8 threshold 371 of them
     go, which leaves 29 copies of the licence in the "clean" corpus. Drop
     the threshold to 0.7 and 399 go. That cliff is section 4's warning about
     the cutoff, and it is on a slider rather than in a sentence.

     The two licence copies the machine compares also land where section 4's
     measurement landed: true Jaccard 0.774 against a MinHash estimate of
     0.781, from a 64-number signature. The section reported 0.750 and 0.773
     on its own pair of sentences. Different sentences, same regime, same
     conclusion — the estimate is good, and it still cannot see paraphrase.
     ======================================================================== */
  VIZ.llmCorpusPipeline = function (el) {
    var f = frame(el);

    var POOL = ("the a of and to in that is was for with as on by at from an it this which " +
      "river valley bridge signal engine harvest cotton furnace ledger parish treaty canal " +
      "measure sample record season pattern current pressure surface distance mineral timber " +
      "printed carried opened reported argued studied traded settled charted drained " +
      "northern southern coastal inland early later common careful ordinary steady " +
      "council company society committee register survey account journal notice report " +
      "market harbour station quarry mill orchard pasture terrace foundry workshop").split(/\s+/);
    var NAVW = "home about contact privacy terms login register search sitemap help faq news blog shop cart account".split(" ");
    var FORW = "der die das und mit von einer wurde zwischen jahren stadt fluss wasser bericht gesellschaft".split(" ");
    var QS = ["Which planet in the solar system has the shortest day and how long is that",
      "In which year did the first crewed mission land on the surface of the Moon and who was the commander of it"];

    function sent(r, n) {
      var o = [], i;
      for (i = 0; i < n; i++) o.push(POOL[Math.floor(r() * POOL.length)]);
      return o.join(" ");
    }

    function build() {
      var r = mulberry(11), docs = [], i, j, k, lines;
      function push(kind, title, text, conf) {
        docs.push({ kind: kind, title: title, text: text, conf: conf });
      }
      for (i = 0; i < 140; i++) {
        lines = []; k = 4 + Math.floor(r() * 10);
        for (j = 0; j < k; j++) lines.push(sent(r, 12 + Math.floor(r() * 14)));
        push("article", "A note on the " + POOL[20 + Math.floor(r() * 40)],
          lines.join("\n"), 0.86 + r() * 0.13);
      }
      for (i = 0; i < 400; i++)
        push("licence", "Terms of use",
          "Permission is hereby granted free of charge to any person obtaining a copy of this " +
          "software and associated documentation files to deal in the software without restriction " +
          "including without limitation the rights to use copy modify merge publish distribute " +
          "sublicense and sell copies of the software subject to the following conditions.\n" +
          "Copyright " + (1998 + (i % 26)) + " the " + POOL[30 + (i % 30)] + " project. All rights reserved.",
          0.9 + r() * 0.09);
      for (i = 0; i < 120; i++) {
        lines = [];
        for (j = 0; j < 10 + Math.floor(r() * 8); j++)
          lines.push(NAVW[Math.floor(r() * NAVW.length)] + " | " + NAVW[Math.floor(r() * NAVW.length)]);
        push("nav", "Untitled page", lines.join("\n"), 0.7 + r() * 0.2);
      }
      for (i = 0; i < 90; i++)
        push("catalogue", "Product listing",
          "This item ships within two working days and is covered by our standard returns policy " +
          "for thirty days from the date of delivery. Please check the size guide carefully before " +
          "ordering and contact the support team if anything at all is unclear about the fit, the " +
          "finish or the care instructions. Bulk orders are handled by the trade desk and quoted " +
          "separately.\nItem code " + (4000 + i) + ".", 0.88 + r() * 0.1);
      for (i = 0; i < 80; i++)
        push("stub", "Short entry", sent(r, 9 + Math.floor(r() * 14)), 0.8 + r() * 0.18);
      for (i = 0; i < 70; i++) {
        lines = [];
        for (j = 0; j < 5 + Math.floor(r() * 5); j++) {
          var s = []; for (k = 0; k < 12; k++) s.push(FORW[Math.floor(r() * FORW.length)]);
          lines.push(s.join(" "));
        }
        push("foreign", "Bericht", lines.join("\n"), 0.18 + r() * 0.42);
      }
      for (i = 0; i < 50; i++) {
        lines = [];
        for (j = 0; j < 14 + Math.floor(r() * 10); j++) lines.push("- " + sent(r, 4 + Math.floor(r() * 4)));
        push("bullets", "Checklist", lines.join("\n"), 0.82 + r() * 0.15);
      }
      for (i = 0; i < 40; i++) {
        lines = ["Figures for the quarter are set out in the table below.",
                 "Revisions to the previous three quarters are marked with an asterisk.",
                 "All values are given in thousands and rounded to the nearest unit."];
        for (j = 0; j < 12 + Math.floor(r() * 10); j++)
          lines.push((1000 + Math.floor(r() * 9000)) + " | " + (r() * 100).toFixed(2) + " | " +
                     (r() * 10).toFixed(3) + " | " + Math.floor(r() * 500));
        push("symbols", "Table 4", lines.join("\n"), 0.7 + r() * 0.2);
      }
      for (i = 0; i < 10; i++)
        push("benchmark", "Quiz answers, part " + (i + 1),
          sent(r, 20) + "\n" + QS[i % 2] + "\n" + sent(r, 18), 0.9 + r() * 0.08);
      return docs;
    }

    /* Every metric a filter reads is computed here, from the text. */
    function measure(d) {
      var lines = d.text.split("\n").filter(function (l) { return l.trim(); });
      var w = d.text.toLowerCase().replace(/[^a-z0-9 ]/g, " ").split(/\s+/).filter(Boolean);
      var alpha = 0, len = 0, i;
      for (i = 0; i < w.length; i++) { if (/[a-z]/.test(w[i])) alpha++; len += w[i].length; }
      var bul = 0, prose = 0, seen = {}, rep = 0;
      lines.forEach(function (l) {
        if (/^\s*[-*]/.test(l)) bul++;
        if (l.trim().split(/\s+/).length >= 6 && l.indexOf("|") < 0) prose++;
        var key = l.trim(); if (seen[key]) rep++; seen[key] = 1;
      });
      d.w = w; d.nw = w.length; d.tok = Math.round(w.length * 1.32);
      d.meanLen = len / Math.max(1, w.length);
      d.alphaFrac = alpha / Math.max(1, w.length);
      d.bulFrac = bul / Math.max(1, lines.length);
      d.proseFrac = prose / Math.max(1, lines.length);
      d.repFrac = rep / Math.max(1, lines.length);
      d.symFrac = (d.text.match(/[^A-Za-z0-9\s]/g) || []).length / Math.max(1, d.text.length);
    }

    /* MinHash-64 over five-word shingles, then LSH in 16 bands of 4. Each
       document is compared only with the first document it shares a band
       with, which is what makes this linear instead of half a million
       comparisons. */
    var NH = 64, HA = [], HB = [];
    (function () {
      var r = mulberry(5), i;
      for (i = 0; i < NH; i++) {
        HA.push((Math.floor(r() * 2147483647) * 2 + 1) >>> 0);
        HB.push(Math.floor(r() * 4294967295) >>> 0);
      }
    })();
    function signature(w) {
      var s = new Array(NH).fill(0xFFFFFFFF), i, k;
      for (i = 0; i + 5 <= w.length; i++) {
        var b = hash32(w.slice(i, i + 5).join(" "));
        for (k = 0; k < NH; k++) {
          var v = ((Math.imul(b, HA[k]) >>> 0) ^ HB[k]) >>> 0;
          if (v < s[k]) s[k] = v;
        }
      }
      return s;
    }
    function agree(a, b) { var c = 0, k; for (k = 0; k < NH; k++) if (a[k] === b[k]) c++; return c / NH; }
    function trueJaccard(a, b) {
      var A = {}, B = {}, i, n = 0, u = 0, k;
      for (i = 0; i + 5 <= a.length; i++) A[a.slice(i, i + 5).join(" ")] = 1;
      for (i = 0; i + 5 <= b.length; i++) B[b.slice(i, i + 5).join(" ")] = 1;
      for (k in A) { u++; if (B[k]) n++; }
      for (k in B) if (!A[k]) u++;
      return n / u;
    }
    function grams(w, n) { var o = [], i; for (i = 0; i + n <= w.length; i++) o.push(w.slice(i, i + n).join(" ")); return o; }

    var DOCS = build(), EV = {}, i;
    DOCS.forEach(measure);
    QS.forEach(function (q) {
      grams(q.toLowerCase().split(" "), 13).forEach(function (g) { EV[g] = 1; });
    });
    (function () {
      var buckets = {}, b, key;
      DOCS.forEach(function (d, i2) {
        d.sig = signature(d.w); d.dupEst = 0; d.dupOf = -1;
        d.hit = grams(d.w, 13).some(function (g) { return EV[g]; });
        for (b = 0; b < 16; b++) {
          key = b + ":" + d.sig.slice(b * 4, b * 4 + 4).join(",");
          if (buckets[key] !== undefined) {
            var e = agree(d.sig, DOCS[buckets[key]].sig);
            if (e > d.dupEst) { d.dupEst = e; d.dupOf = buckets[key]; }
          } else buckets[key] = i2;
        }
      });
    })();
    var RAWTOK = DOCS.reduce(function (s, d) { return s + d.tok; }, 0);
    var LIC = DOCS.filter(function (d) { return d.kind === "licence"; });
    var JTRUE = trueJaccard(LIC[0].w, LIC[1].w), JEST = agree(LIC[0].sig, LIC[1].sig);

    /* ---- the six filters, each a predicate on the measurements ---- */
    var ST = [
      { n: "extraction", th: 0.15, lo: 0.05, hi: 0.6, step: 0.05, on: true,
        tl: "main content must be this much of the page",
        f: function (d, t) { return d.proseFrac >= t; } },
      { n: "language id", th: 0.65, lo: 0.3, hi: 0.95, step: 0.05, on: true,
        tl: "minimum language confidence",
        f: function (d, t) { return d.conf >= t; } },
      { n: "basic cleaning", th: 50, lo: 10, hi: 200, step: 10, on: true,
        tl: "minimum words",
        f: function (d, t) { return d.nw >= t && d.alphaFrac >= 0.8 && d.repFrac <= 0.5; } },
      { n: "quality heuristics", th: 0.9, lo: 0.3, hi: 1, step: 0.05, on: true,
        tl: "maximum fraction of lines that may be bullets",
        f: function (d, t) { return d.bulFrac <= t && d.meanLen >= 3 && d.meanLen <= 10; } },
      { n: "deduplication", th: 0.8, lo: 0.5, hi: 0.95, step: 0.05, on: true,
        tl: "MinHash similarity at which a document is a duplicate",
        f: function (d, t) { return d.dupEst < t; } },
      { n: "decontamination", th: 13, lo: 6, hi: 24, step: 1, on: true,
        tl: "n-gram size checked against the evaluation set",
        f: function (d) { return !d.hit; } }
    ];
    var sel = 4;

    /* Run the whole pipeline and record what each stage removed. */
    function run() {
      var alive = DOCS.slice(), out = [{ docs: DOCS.length, tok: RAWTOK }], s;
      for (s = 0; s < ST.length; s++) {
        var killed = [], next = [];
        if (ST[s].on) {
          alive.forEach(function (d) { (ST[s].f(d, ST[s].th) ? next : killed).push(d); });
        } else next = alive;
        alive = next;
        out.push({ docs: alive.length, tok: alive.reduce(function (a, d) { return a + d.tok; }, 0),
                   killed: killed });
      }
      return out;
    }

    var svg = S("svg", { viewBox: "0 0 760 444", width: "100%",
      role: "img", "aria-label": "a thousand documents through six filters" }, f.body);

    function commas(v) { return Math.round(v).toLocaleString("en-US"); }

    function render() {
      var R = run(), i2, s;
      while (svg.firstChild) svg.removeChild(svg.firstChild);

      T(svg, 8, 14, "1,000 documents, generated from a seed · " + commas(RAWTOK) + " tokens raw",
        { anchor: "start", size: 11, fill: C.faint });
      T(svg, 752, 14, commas(R[6].docs) + " survive · " + commas(R[6].tok) + " tokens",
        { anchor: "end", size: 11, fill: C.teal });

      /* ---- the funnel ---- */
      var y = 44, BX = 118, BW = 190;
      T(svg, 8, 32, "stage", { anchor: "start", size: 9, fill: C.faint });
      T(svg, BX + BW + 44, 32, "documents", { anchor: "end", size: 9, fill: C.faint });
      T(svg, 430, 32, "tokens", { anchor: "end", size: 9, fill: C.faint });
      T(svg, 8, y, "raw", { anchor: "start", size: 10, fill: C.dim });
      rect(svg, BX, y - 7, BW, 14, { rx: 3, fill: C.blue, stroke: "none", op: 0.35 });
      T(svg, BX + BW + 44, y, "1,000", { anchor: "end", size: 10, fill: C.dim });
      T(svg, 430, y, commas(RAWTOK), { anchor: "end", size: 10, fill: C.dim });
      y += 24;
      for (s = 0; s < ST.length; s++) {
        var st = ST[s], cur = R[s + 1], gone = R[s].docs - cur.docs;
        if (s === sel) rect(svg, 4, y - 11, 430, 22, { rx: 4, fill: C.panel, stroke: "none", op: 0.9 });
        T(svg, 8, y, st.n, { anchor: "start", size: 10,
          fill: !st.on ? C.faint : s === sel ? C.text : C.dim });
        rect(svg, BX, y - 7, cur.docs / 1000 * BW, 14,
          { rx: 3, fill: s === sel ? C.teal : C.blue, stroke: "none", op: 0.6 });
        if (gone) rect(svg, BX + cur.docs / 1000 * BW, y - 7, gone / 1000 * BW, 14,
          { rx: 3, fill: C.pink, stroke: "none", op: 0.3 });
        T(svg, BX + BW + 44, y, st.on ? commas(cur.docs) + "  −" + commas(gone) : "off",
          { anchor: "end", size: 10, fill: st.on ? (gone ? C.pink : C.dim) : C.faint });
        T(svg, 430, y, commas(cur.tok), { anchor: "end", size: 10, fill: C.dim });
        y += 24;
      }

      /* ---- the stage you are standing on ---- */
      var st2 = ST[sel], kill = R[sel + 1].killed || [], RX = 454;
      T(svg, RX, 32, "stage " + (sel + 1) + " of 6 · " + st2.n,
        { anchor: "start", size: 11, fill: C.teal });
      T(svg, RX, 52, st2.tl, { anchor: "start", size: 9.5, fill: C.faint });
      T(svg, RX, 72, st2.on ? commas(kill.length) + " documents removed here" : "this filter is switched off",
        { anchor: "start", size: 11, fill: st2.on && kill.length ? C.pink : C.faint });

      var by = {}, ord = [];
      kill.forEach(function (d) {
        if (by[d.kind] === undefined) { by[d.kind] = 0; ord.push(d.kind); }
        by[d.kind]++;
      });
      ord.sort(function (a, b) { return by[b] - by[a]; });
      var ky = 96;
      ord.slice(0, 5).forEach(function (k) {
        T(svg, RX, ky, k, { anchor: "start", size: 10, fill: C.dim });
        rect(svg, RX + 104, ky - 5, by[k] / 1000 * 120, 10, { rx: 2, fill: C.pink, stroke: "none", op: 0.5 });
        T(svg, 752, ky, commas(by[k]), { anchor: "end", size: 10, fill: C.text });
        ky += 19;
      });
      if (!ord.length) T(svg, RX, ky, "nothing", { anchor: "start", size: 10, fill: C.faint });

      /* ---- what it actually threw away ---- */
      var sy = 212;
      line(svg, 8, sy - 14, 752, sy - 14, { stroke: C.line, sw: 1 });
      T(svg, 8, sy, st2.on && kill.length ? "three of them, as they were written"
                                          : "switch the filter on to read what it removes",
        { anchor: "start", size: 9.5, fill: C.faint });
      sy += 18;
      var picks = [];
      for (i2 = 0; i2 < kill.length && picks.length < 3; i2 += Math.max(1, Math.floor(kill.length / 3)))
        picks.push(kill[i2]);
      picks.forEach(function (d) {
        if (sy > 330) return;                  // keep clear of the closing lines
        T(svg, 8, sy, d.title, { anchor: "start", size: 10, fill: C.orange });
        T(svg, 752, sy, d.nw + " words · " + d.tok + " tokens · lang " + d.conf.toFixed(2) +
          (sel === 4 ? " · similarity " + d.dupEst.toFixed(3) : ""),
          { anchor: "end", size: 9, fill: C.faint });
        sy += 15;
        sy = wrapT(svg, 8, sy, 126, 13, d.text.replace(/\n/g, " ⏎ ").slice(0, 248),
          { size: 9.5, fill: C.dim, max: 2 }) + 9;
      });

      /* ---- the licence, and the cliff ---- */
      var licGone = kill.filter(function (d) { return d.kind === "licence"; }).length;
      var msg = sel === 4
        ? "400 of 1,000 are the same licence with a different year. At " +
          st2.th.toFixed(2) + " this removes " + commas(licGone) + ", leaving " +
          commas(400 - licGone) + " copies."
        : "Every number here is measured from the text, not read off the label that generated it.";
      line(svg, 8, 380, 752, 380, { stroke: C.line, sw: 1 });
      wrapT(svg, 8, 400, 110, 16, msg, { size: 10.5, fill: sel === 4 ? C.pink : C.faint });
      T(svg, 8, 426, "Two licence copies: true Jaccard " + JTRUE.toFixed(3) + ", MinHash-64 estimate " +
        JEST.toFixed(3) + " — accurate about what it sees, blind to paraphrase.",
        { anchor: "start", size: 10, fill: C.faint });
    }

    function say() {
      var R = run();
      f.say(commas(R[6].docs) + " documents and " + commas(R[6].tok) + " tokens survive, from 1,000 and " +
        commas(RAWTOK) + ". Stage " + (sel + 1) + ", " + ST[sel].n + ", removed " +
        commas((R[sel + 1].killed || []).length) + ".");
    }

    /* ---- controls ------------------------------------------------------ */
    var tS = tabs(f.controls, ST.map(function (s) { return s.n.split(" ")[0]; }), 4, function (i2) {
      sel = i2; sTh.el.querySelector("span");
      sTh.input.min = ST[sel].lo; sTh.input.max = ST[sel].hi; sTh.input.step = ST[sel].step;
      sTh.set(ST[sel].th); tgF.set(ST[sel].on); render(); say();
    });
    var tgF = toggle(f.controls, "filter on", true, function (v) {
      ST[sel].on = v; render();
      f.say(v ? ST[sel].n + " is back on." : ST[sel].n + " is off: everything it was removing now " +
        "flows downstream, where a later filter may or may not catch it.");
    });
    var sTh = slider(f.controls, "threshold", 0.5, 0.95, 0.8, 0.05,
      function (v) { return sel === 2 ? String(Math.round(v)) : sel === 5 ? "n=" + Math.round(v) : v.toFixed(2); },
      function (v) { ST[sel].th = v; render(); say(); });
    f.btn("reset", function () {
      sel = 4;
      ST[0].th = 0.15; ST[1].th = 0.65; ST[2].th = 50; ST[3].th = 0.9; ST[4].th = 0.8; ST[5].th = 13;
      ST.forEach(function (s) { s.on = true; });
      tS.sync(4); tgF.set(true);
      sTh.input.min = ST[4].lo; sTh.input.max = ST[4].hi; sTh.input.step = ST[4].step; sTh.set(0.8);
      render();
      f.say("Step the pipeline. Look at what each filter throws away.");
    });

    render();
    f.say("Step the pipeline. Look at what each filter throws away.");
  };


  /* ========================================================================
     27. llmContamination — CH 12 — Playground

     Section 5's table, reproduced by counting rather than quoted. Eight
     evaluation questions, eight documents, and the overlap computed live on
     whitespace-split lowercase n-grams.

     The section's pair is question 1 against "Quiz night: planet facts",
     which share a fifteen-word run. Fifteen words contain eight 8-grams,
     three 13-grams and no 20-gram, so the table comes back exactly:

         n = 8    8 shared    flagged
         n = 13   3 shared    flagged
         n = 20   0 shared    missed

     The score panel is the part the section argues about. Three questions
     the model actually knows, three leaked verbatim, two leaked only as
     paraphrase. Reported with nothing removed: 8 of 8. True ability: 3 of 8.
     The best decontamination setting on offer, n = 8, gets to 5 of 8 — and
     it cannot go lower, because the two paraphrased leaks are invisible to
     every n. That floor is the section's closing point, and it is the number
     the machine is really for.
     ======================================================================== */
  VIZ.llmContamination = function (el) {
    var f = frame(el);

    var EV = [
      { q: "Which planet in the solar system has the shortest day, and how long is that day?", known: false },
      { q: "What is the capital city of the country that borders both France and Portugal?", known: true },
      { q: "In which year did the first crewed mission land on the surface of the Moon, and who was the commander of it?", known: false },
      { q: "Explain why the boiling point of water decreases as altitude above sea level increases.", known: false },
      { q: "Who wrote the novel that begins with the line Call me Ishmael?", known: true },
      { q: "What is the chemical symbol for the element with atomic number seventy-nine?", known: false },
      { q: "Describe the difference between a comet and an asteroid in terms of composition.", known: false },
      { q: "How many bones are there in the adult human body, and how many at birth?", known: true }
    ];
    var DC = [
      { t: "Quiz night: planet facts", x: "Pub quiz hosts keep coming back to the same one. Which planet in the solar system has the shortest day and how long is that worth arguing about at the table? The answer is Jupiter, at a little under ten hours." },
      { t: "eval_set_v2.jsonl, pasted to a forum", x: "Someone dumped the whole file into the thread again. In which year did the first crewed mission land on the surface of the Moon, and who was the commander of it? Answer: 1969, Neil Armstrong. Please stop posting these." },
      { t: "Gold price and jewellery marks", x: "Hallmarks tell you the metal. Buyers ask about the symbol for the element with atomic number seventy-nine constantly, and it is Au, from aurum." },
      { t: "Cooking at altitude", x: "Up a mountain your kettle boils sooner and your pasta stays hard. Lower air pressure means water turns to vapour at a lower temperature, so the boil happens earlier and cooks less." },
      { t: "Small bodies of the solar system", x: "The short version is that one is dirty ice and the other is rock and metal, which is why only one of them grows a tail when it comes close to the Sun." },
      { t: "A history of railway signalling", x: "Semaphore arms gave way to colour lights over sixty years, and the interlocking frame is the part most people never see." },
      { t: "Iberian travel notes", x: "The train from the border takes four hours and the food is better than the guidebooks say." },
      { t: "Bones, a reader question", x: "People ask about the skeleton constantly and the numbers surprise them, because a newborn has far more of them than an adult does." }
    ];
    /* Which questions a paraphrase leaks, with no shared n-gram at any n. */
    var PARA = { 3: 3, 6: 4 };

    var n = 13, thr = 1, decon = true;

    function words(s) { return s.toLowerCase().replace(/[^a-z0-9 ]/g, " ").split(/\s+/).filter(Boolean); }
    function grams(w, k) { var o = [], i; for (i = 0; i + k <= w.length; i++) o.push(w.slice(i, i + k).join(" ")); return o; }
    var QW = EV.map(function (e) { return words(e.q); });
    var DW = DC.map(function (d) { return words(d.x); });
    function overlap(qi, di, k) {
      var b = {}, seen = {}, c = 0;
      grams(DW[di], k).forEach(function (g) { b[g] = 1; });
      grams(QW[qi], k).forEach(function (g) { if (b[g] && !seen[g]) { seen[g] = 1; c++; } });
      return c;
    }
    function bestFor(qi, k) {
      var b = { c: 0, d: -1 }, i;
      for (i = 0; i < DC.length; i++) { var c = overlap(qi, i, k); if (c > b.c) b = { c: c, d: i }; }
      return b;
    }
    function scores() {
      var rep = 0, after = 0, tru = 0, i;
      for (i = 0; i < EV.length; i++) {
        var leak = PARA[i] !== undefined || bestFor(i, 4).c > 0;
        var caught = decon && bestFor(i, n).c >= thr;
        if (EV[i].known) tru++;
        if (EV[i].known || leak) rep++;
        if (EV[i].known || (leak && !caught)) after++;
      }
      return { rep: rep, after: after, tru: tru, n: EV.length };
    }

    var svg = S("svg", { viewBox: "0 0 760 428", width: "100%",
      role: "img", "aria-label": "benchmark questions found in the training corpus" }, f.body);

    function clip(s, k) { return s.length > k ? s.slice(0, k - 1) + "…" : s; }

    function render() {
      while (svg.firstChild) svg.removeChild(svg.firstChild);
      var i, S2 = scores();

      T(svg, 8, 14, EV.length + " evaluation questions · " + DC.length + " corpus documents · n = " + n +
        " · flag at " + thr + "+ shared n-gram" + (thr > 1 ? "s" : "") +
        (decon ? "" : " · decontamination off"),
        { anchor: "start", size: 11, fill: decon ? C.teal : C.orange });

      /* ---- every question, and where it leaked ---- */
      var y = 42;
      T(svg, 8, y, "question", { anchor: "start", size: 9, fill: C.faint });
      T(svg, 372, y, "shared", { anchor: "end", size: 9, fill: C.faint });
      T(svg, 452, y, "verdict", { anchor: "end", size: 9, fill: C.faint });
      y += 20;
      for (i = 0; i < EV.length; i++) {
        var b = bestFor(i, n), para = PARA[i] !== undefined;
        var leak = para || bestFor(i, 4).c > 0;
        var caught = decon && b.c >= thr;
        var tone = caught ? C.green : leak ? C.pink : C.faint;
        T(svg, 8, y, "Q" + (i + 1), { anchor: "start", size: 9.5, fill: C.faint });
        T(svg, 36, y, clip(EV[i].q, 50), { anchor: "start", size: 10,
          fill: leak ? C.text : C.dim });
        T(svg, 372, y, b.c ? String(b.c) : "—", { anchor: "end", size: 10, fill: b.c ? C.text : C.faint });
        T(svg, 452, y, caught ? "flagged" : para ? "paraphrase" : leak ? "missed" : "clean",
          { anchor: "end", size: 9.5, fill: tone });
        if (leak) T(svg, 468, y, clip(para ? DC[PARA[i]].t : DC[b.d >= 0 ? b.d : bestFor(i, 4).d].t, 34),
          { anchor: "start", size: 9, fill: C.faint });
        y += 21;
      }

      /* ---- the section's own pair, at three settings ---- */
      var ty = 232;
      line(svg, 8, ty - 16, 452, ty - 16, { stroke: C.line, sw: 1 });
      T(svg, 8, ty, "Q1 against “" + DC[0].t + "”, which share a fifteen-word run",
        { anchor: "start", size: 9.5, fill: C.faint });
      ty += 20;
      T(svg, 8, ty, "n-gram size", { anchor: "start", size: 9, fill: C.faint });
      T(svg, 240, ty, "overlapping n-grams found", { anchor: "end", size: 9, fill: C.faint });
      T(svg, 340, ty, "verdict", { anchor: "end", size: 9, fill: C.faint });
      ty += 19;
      [8, 13, 20].forEach(function (k) {
        var c = overlap(0, 0, k), hot = k === n;
        T(svg, 8, ty, String(k), { anchor: "start", size: 10.5, fill: hot ? C.text : C.dim });
        T(svg, 240, ty, String(c), { anchor: "end", size: 10.5, fill: hot ? C.text : C.dim });
        T(svg, 340, ty, c >= thr ? "flagged" : "missed",
          { anchor: "end", size: 10.5, fill: c >= thr ? C.green : C.pink });
        ty += 19;
      });
      T(svg, 8, ty + 6, "The document is identical at every setting. What changes is whether you notice.",
        { anchor: "start", size: 10, fill: C.faint });

      /* ---- what the benchmark reports ---- */
      var RX = 490, BW = 168;
      T(svg, RX, 232, "what the benchmark reports", { anchor: "start", size: 10, fill: C.faint });
      var by = 256;
      [["reported, nothing removed", S2.rep, C.pink],
       ["after decontamination", S2.after, C.orange],
       ["what it actually knows", S2.tru, C.green]].forEach(function (r) {
        T(svg, RX, by, r[0], { anchor: "start", size: 9.5, fill: C.faint });
        rect(svg, RX, by + 8, r[1] / S2.n * BW, 14, { rx: 3, fill: r[2], stroke: "none", op: 0.65 });
        T(svg, 752, by + 15, r[1] + " / " + S2.n + "  " + Math.round(r[1] / S2.n * 100) + "%",
          { anchor: "end", size: 10, fill: r[2] });
        by += 44;
      });

      /* ---- the floor ---- */
      var nPara = Object.keys(PARA).length;
      line(svg, 8, 376, 752, 376, { stroke: C.line, sw: 1 });
      T(svg, 8, 394, "Reported " + S2.rep + " of " + S2.n + ", true ability " + S2.tru + " of " + S2.n +
        ". At n = " + n + " the pass recovers " + (S2.rep - S2.after) +
        " of the " + (S2.rep - S2.tru) + " leaked questions.",
        { anchor: "start", size: 10.5, fill: S2.after > S2.tru ? C.orange : C.green });
      T(svg, 8, 414, nPara + " of them were only ever paraphrased, so no n catches them: " +
        (S2.tru + nPara) + " of " + S2.n + " is the floor this method can reach.",
        { anchor: "start", size: 10, fill: C.faint });
    }

    function say() {
      var S2 = scores();
      f.say("n = " + n + ", flag at " + thr + ": the benchmark reports " + S2.after + " of " + S2.n +
        " after decontamination, against " + S2.tru + " of " + S2.n + " actually known.");
    }

    /* ---- controls ------------------------------------------------------ */
    var sN = slider(f.controls, "n-gram size", 5, 24, 13, 1,
      function (v) { return String(v); },
      function (v) { n = v; render(); say(); });
    var sT = slider(f.controls, "flag at", 1, 6, 1, 1,
      function (v) { return v + "+"; },
      function (v) { thr = v; render(); say(); });
    var tgD = toggle(f.controls, "decontaminate", true, function (v) {
      decon = v; render();
      f.say(v ? "Decontamination on: flagged documents are dropped and their questions stop being free."
              : "No decontamination at all. Every leaked question is answered from memory.");
    });
    f.btn("reset", function () {
      n = 13; thr = 1; decon = true; sN.set(13); sT.set(1); tgD.set(true); render();
      f.say("Set n to 8 and find the benchmark questions sitting in the corpus.");
    });

    render();
    f.say("Set n to 8 and find the benchmark questions sitting in the corpus.");
  };



  /* ========================================================================
     28. llmLossStep — CH 13 — Stepper

     Real per-token cross-entropy from GPT-2 small, measured 12 September
     2026: log_softmax of the logits, indexed at the true next token. Nothing
     on the batch tab is generated.

     The blueprint's discovery is that the token costing most is almost
     always a rare proper noun. Measured, that is nearly but not quite right,
     and the machine says which. " Analy" (Analytical) costs 10.59, " Kru"
     (Kruger) 12.19, " Se" (Seine) 7.37 — but the single most expensive token
     in the four sentences is " boils" at 12.79, a common verb sitting in
     position 2 where there is no context to predict it from. The rule is
     really "the token the context does not predict", and proper nouns are
     the largest family of those rather than the whole of it.

     The second tab carries the section's own arithmetic: the six-token
     example at 1.5923, the three anchors, and the loss-to-perplexity table,
     all computed here rather than quoted.
     ======================================================================== */
  VIZ.llmLossStep = function (el) {
    var f = frame(el);
    var BATCH = [
      { first: "The", toks: [" capital", " of", " France", " is", " Paris", ",", " and", " the", " river", " running", " through", " it", " is", " the", " Se", "ine", "."],
        loss: [9.07, 1.807, 5.03, 2.107, 3.434, 0.797, 1.641, 1.82, 8.22, 7.306, 0.565, 0.95, 0.904, 1.718, 7.374, 0.005, 0.613],
        top: [[["\n",0.0136],[" the",0.01],[" \"",0.0082],[",",0.0063],[" a",0.0052]],[[" of",0.1642],[",",0.1192],[" city",0.1078],[" has",0.0723],["'s",0.071]],[[" the",0.2387],[" a",0.0192],[" Israel",0.0168],[" Russia",0.014],[" Iran",0.0115]],[[",",0.3749],[" is",0.1216],[" has",0.0674],[" and",0.0657],[".",0.0656]],[[" the",0.0846],[" now",0.0479],[" a",0.0462],[" France",0.0324],[" Paris",0.0322]],[[",",0.4505],[".",0.2612],[" and",0.1217],[".\"",0.0153],[" but",0.0111]],[[" and",0.1938],[" which",0.1015],[" the",0.0984],[" where",0.0865],[" but",0.0585]],[[" the",0.1621],[" its",0.0876],[" it",0.0737],[" is",0.0344],[" in",0.0236]],[[" capital",0.209],[" city",0.1227],[" French",0.0479],[" country",0.0286],[" largest",0.0074]],[[" is",0.1037],[" Paris",0.028],[" Le",0.0267],[",",0.0239],[" of",0.021]],[[" through",0.5681],[" from",0.1557],[" between",0.031],[" along",0.0291],[" down",0.0184]],[[" it",0.3869],[" the",0.2968],[" its",0.0708],[" Paris",0.0462],[" that",0.0333]],[[" is",0.405],[",",0.049],[" flows",0.0474],[" has",0.0439],[" runs",0.0437]],[[" the",0.1794],[" called",0.0998],[" known",0.0653],[" a",0.0426],[" one",0.0255]],[[" city",0.0509],[" capital",0.0467],[" most",0.0277],[" French",0.0242],[" main",0.0196]],[["ine",0.995],["ville",0.0006],["le",0.0005],["ines",0.0003],["y",0.0003]],[[".",0.5418],[",",0.2285],[" River",0.0249],[" and",0.022],[" (",0.0138]]] },
      { first: "Ad", toks: ["a", " Lo", "vel", "ace", " wrote", " the", " first", " algorithm", " for", " the", " Analy", "tical", " Engine", " in", " 18", "43", "."],
        loss: [5.348, 6.34, 2.104, 0.064, 6.03, 3.676, 3.329, 9.176, 1.021, 1.797, 10.589, 1.318, 4.996, 2.746, 4.956, 4.576, 0.863],
        top: [[["\n",0.0266],[".",0.0222],["-",0.0174],[",",0.0123],[" and",0.0065]],[["ption",0.1379],[",",0.0206],["'s",0.018],["ad",0.0143],[" said",0.0133]],[["vel",0.122],["z",0.099],["eb",0.0897],["vers",0.0455],["a",0.0338]],[["ace",0.9384],["ess",0.0323],["ock",0.0118],["ady",0.0022],["ier",0.001]],[[",",0.1922],["\n",0.0757],[" is",0.0528],[" (",0.0397],[" and",0.0384]],[[":",0.3189],[" in",0.1161],[" a",0.0695],[",",0.0663],[" that",0.0591]],[[" following",0.1608],[" book",0.0529],[" story",0.0377],[" first",0.0358],[" script",0.019]],[[" draft",0.0947],[" chapter",0.0839],[" of",0.0608],[" book",0.0347],[" part",0.023]],[[" for",0.3604],[" that",0.0663],[" to",0.0642],[",",0.0622],[" in",0.0587]],[[" the",0.1658],[" this",0.0655],[" a",0.0563],[" an",0.0103],[" generating",0.0064]],[[" algorithm",0.0192],[" first",0.0112],[" new",0.0098],[" \"",0.0097],[" game",0.0078]],[["tical",0.2676],["tic",0.2198],["ze",0.184],["zer",0.152],["zing",0.0381]],[[" Analysis",0.0308],[" Model",0.029],[" Analy",0.0159],[" Data",0.0148],[" Method",0.012]],[[".",0.1607],[",",0.1562],[" in",0.0642],[" for",0.054],[" and",0.0424]],[[" the",0.0485],[" 1998",0.0289],[" 1997",0.0254],[" 2003",0.0228],[" 1989",0.0207]],[["94",0.032],["85",0.0312],["92",0.0284],["78",0.0245],["87",0.0244]],[[".",0.4219],[",",0.2622],[" and",0.1019],[":",0.0179],[" (",0.0156]]] },
      { first: "Water", toks: [" boils", " at", " one", " hundred", " degrees", " Celsius", " at", " standard", " atmospheric", " pressure", "."],
        loss: [12.79, 3.039, 6.412, 3.671, 0.737, 1.795, 4.44, 8.643, 2.288, 0.546, 1.046],
        top: [[[",",0.0491],[".",0.0437],["\n",0.0283],[" and",0.0263],["-",0.0211]],[[" down",0.0722],[" in",0.0703],[",",0.0605],[" up",0.0564],[".",0.0552]],[[" about",0.0735],[" a",0.0593],[" around",0.0305],[" the",0.0295],[" 100",0.0246]],[[" point",0.259],[" end",0.1103],[" of",0.0455],[" time",0.0382],[" temperature",0.0359]],[[" degrees",0.4786],[" and",0.2346],[" thousand",0.0372],[" times",0.0155],[" percent",0.0153]],[[" Fahrenheit",0.2202],[" Celsius",0.1661],[" C",0.1295],[" F",0.088],[".",0.0805]],[[".",0.2425],[",",0.1949],[" (",0.1917],[" and",0.1053],[" for",0.0251]],[[" the",0.1423],[" a",0.0583],[" room",0.0338],[" its",0.0265],[" one",0.0206]],[[" ambient",0.1707],[" temperatures",0.1167],[" temperature",0.103],[" atmospheric",0.1014],[" pressure",0.038]],[[" pressure",0.5795],[" temperatures",0.1683],[" pressures",0.0871],[" temperature",0.0639],[" conditions",0.0278]],[[".",0.3514],[",",0.224],[" (",0.1119],[" and",0.0758],[" of",0.033]]] },
      { first: "The", toks: [" quarterly", " report", " from", " Zurich", " mentioned", " Kru", "ger", ",", " Bat", "avia", " and", " the", " new", " tariff", "."],
        loss: [11.668, 1.701, 2.965, 9.114, 9.039, 12.188, 0.406, 2.762, 9.718, 4.086, 1.12, 2.789, 5.608, 11.595, 3.484],
        top: [[["\n",0.0136],[" the",0.01],[" \"",0.0082],[",",0.0063],[" a",0.0052]],[[" report",0.1825],[" results",0.0324],[" reports",0.0306],[" survey",0.028],[" data",0.0272]],[[" on",0.1032],[",",0.0857],[" also",0.0665],[" from",0.0516],[" of",0.0487]],[[" the",0.3419],[" Moody",0.0149],[" Goldman",0.0132],[" Thomson",0.0108],[" U",0.0107]],[["'s",0.0944],[",",0.0707],["-",0.0509],[" said",0.0423],[" showed",0.0387]],[[" that",0.3201],[" the",0.0926],[" a",0.0531],[" in",0.0399],[" \"",0.025]],[["ger",0.6661],["se",0.0619],["pp",0.039],["k",0.0209],["ll",0.0126]],[["'s",0.2899],[" as",0.0917],[",",0.0632],[" and",0.0479],[" was",0.0298]],[[" who",0.2891],[" a",0.0781],[" the",0.0654],[" whose",0.028],[" which",0.0163]],[["ty",0.1458],["eman",0.0657],["ista",0.0636],["che",0.0595],["ail",0.0473]],[[",",0.3541],[" and",0.3262],["'s",0.1357],["-",0.0152],[" &",0.0076]],[[" the",0.0615],[" other",0.0409],[" B",0.0142],[" St",0.0132],[" L",0.0096]],[[" city",0.0547],[" Netherlands",0.0238],[" other",0.0183],[" University",0.013],[" Swiss",0.0124]],[[" city",0.0219],[" airport",0.013],[" headquarters",0.0098],[" town",0.0077],[" \"",0.0073]],[[" of",0.0398],["-",0.0334],[" rate",0.0333],[" on",0.0313],[".",0.0307]]] },
    ];

    var VOCAB = 128256;
    var TOY = [["Paris", 2.10, 1], ["the", 0.40, 0], ["banana", -1.20, 0],
               ["London", 3.30, 0], ["a", 0.90, 0], ["xylophone", -0.50, 0]];
    var STAGE = ["forward", "loss", "backward", "clip", "update"];
    var STAGEW = [
      "logits come out of the final projection: (4, T, 128256) numbers.",
      "cross-entropy indexes the true token and takes -ln of its probability.",
      "the gradient at the logits is (p - onehot) — one subtraction per position.",
      "the global gradient norm is scaled back to 1.0 if it exceeds it.",
      "the optimizer applies the update; the next step reads a different batch."
    ];

    var stg = 0, sel = { s: 0, i: 0 }, tab = 0;

    var all = [];
    BATCH.forEach(function (b, s) { b.loss.forEach(function (v, i) { all.push({ s: s, i: i, v: v }); }); });
    var MEAN = all.reduce(function (a, x) { return a + x.v; }, 0) / all.length;
    var WORST = all.slice().sort(function (a, b) { return b.v - a.v; });

    function softmax(z) {
      var m = Math.max.apply(null, z), e = z.map(function (v) { return Math.exp(v - m); });
      var s = e.reduce(function (a, b) { return a + b; }, 0);
      return e.map(function (v) { return v / s; });
    }
    function show(t) { return t.replace(/ /g, "·"); }
    function heat(v) { return Math.min(1, v / 10); }

    var svg = S("svg", { viewBox: "0 0 760 436", width: "100%",
      role: "img", "aria-label": "one training step, and what each position cost" }, f.body);

    function renderBatch() {
      var i, s, y = 82;
      T(svg, 8, 14, "GPT-2 small, measured · 4 sequences · " + all.length +
        " positions · mean loss " + MEAN.toFixed(3) + " nats",
        { anchor: "start", size: 11, fill: C.teal });
      T(svg, 752, 14, "perplexity " + Math.exp(MEAN).toFixed(1) + " · " +
        (MEAN / Math.LN2).toFixed(2) + " bits/token", { anchor: "end", size: 11, fill: C.faint });

      /* stage chips */
      var cx = 8;
      for (i = 0; i < STAGE.length; i++) {
        rect(svg, cx, 28, 82, 20, { rx: 4, fill: i === stg ? C.blue : "none",
          stroke: i === stg ? "none" : C.line, sw: 1, op: i === stg ? 0.75 : 1 });
        T(svg, cx + 41, 38, STAGE[i], { size: 9.5, fill: i === stg ? C.card : C.faint });
        cx += 88;
      }
      T(svg, 8, 60, STAGEW[stg], { anchor: "start", size: 9.5, fill: C.dim });

      /* the batch, every position coloured by what it cost */
      for (s = 0; s < BATCH.length; s++) {
        var b = BATCH[s], n = b.toks.length, cw = Math.floor(700 / 18);
        T(svg, 8, y, "seq " + s, { anchor: "start", size: 9, fill: C.faint });
        var x = 52;
        for (i = 0; i < n; i++) {
          var on = sel.s === s && sel.i === i;
          var r0 = rect(svg, x, y - 10, cw - 3, 20, { rx: 3, fill: C.pink,
            stroke: on ? C.text : "none", sw: 2, op: 0.1 + heat(b.loss[i]) * 0.7 });
          T(svg, x + (cw - 3) / 2, y, show(b.toks[i]).slice(0, 5),
            { size: 8.5, fill: heat(b.loss[i]) > 0.6 ? C.card : C.dim });
          (function (ss, ii) {
            r0.style.cursor = "pointer";
            r0.addEventListener("click", function () { sel = { s: ss, i: ii }; render(); say(); });
          })(s, i);
          tipOn(r0, show(b.toks[i]), "loss " + b.loss[i].toFixed(3) + " nats");
          x += cw;
        }
        T(svg, 752, y, (b.loss.reduce(function (a, v) { return a + v; }, 0) / n).toFixed(2),
          { anchor: "end", size: 9, fill: C.faint });
        y += 30;
      }
      T(svg, 8, y - 8, "darker is more expensive · the number on the right is that sequence's mean",
        { anchor: "start", size: 9, fill: C.faint });

      /* the position you picked */
      var b2 = BATCH[sel.s], p = b2.loss[sel.i], top = b2.top[sel.i];
      var ptrue = Math.exp(-p);
      T(svg, 8, 208, "position " + (sel.i + 1) + " of sequence " + sel.s + " · true token " +
        show(b2.toks[sel.i]), { anchor: "start", size: 11, fill: C.text });
      T(svg, 752, 208, "p = " + ptrue.toFixed(5) + " · -ln p = " + p.toFixed(3),
        { anchor: "end", size: 11, fill: p > 6 ? C.pink : C.green });
      var ty = 234, found = false;
      top.forEach(function (r, k) {
        var isT = r[0] === b2.toks[sel.i];
        if (isT) found = true;
        T(svg, 8, ty, (k + 1) + ".", { anchor: "start", size: 9, fill: C.faint });
        T(svg, 30, ty, show(r[0]).slice(0, 16), { anchor: "start", size: 10,
          fill: isT ? C.green : C.dim });
        rect(svg, 180, ty - 6, r[1] * 300, 12, { rx: 2, stroke: "none", op: 0.6,
          fill: isT ? C.green : C.blue });
        T(svg, 500, ty, r[1].toFixed(4), { anchor: "end", size: 9.5, fill: C.dim });
        if (stg === 2) T(svg, 600, ty, "dL/dz = " + (r[1] - (isT ? 1 : 0)).toFixed(4),
          { anchor: "end", size: 9.5, fill: isT ? C.orange : C.faint });
        ty += 19;
      });
      if (!found) T(svg, 30, ty, "the true token is not in the top five, at p = " + ptrue.toFixed(5),
        { anchor: "start", size: 9.5, fill: C.pink });

      /* the discovery */
      line(svg, 8, 348, 752, 348, { stroke: C.line, sw: 1 });
      T(svg, 8, 366, "most expensive: " +
        WORST.slice(0, 4).map(function (w) {
          return show(BATCH[w.s].toks[w.i]) + " " + w.v.toFixed(2);
        }).join(" · "), { anchor: "start", size: 10.5, fill: C.pink });
      wrapT(svg, 8, 388, 120, 17, "Three of the four are rare proper nouns. The fourth, ·boils, is a " +
        "common verb in position 2 with no context to predict it from — the rule is really " +
        "“whatever the context does not predict”, and proper nouns are its largest family.",
        { size: 10, fill: C.faint, max: 3 });
    }

    function renderAnchors() {
      var i, z = TOY.map(function (t) { return t[1]; }), p = softmax(z);
      T(svg, 8, 14, "the section's own arithmetic, computed here", { anchor: "start", size: 11, fill: C.teal });

      T(svg, 8, 40, "a toy vocabulary of six, and a model that is confidently wrong",
        { anchor: "start", size: 9.5, fill: C.faint });
      var y = 62;
      T(svg, 8, y, "token", { anchor: "start", size: 9, fill: C.faint });
      T(svg, 200, y, "logit", { anchor: "end", size: 9, fill: C.faint });
      T(svg, 290, y, "probability", { anchor: "end", size: 9, fill: C.faint });
      y += 20;
      for (i = 0; i < TOY.length; i++) {
        var tone = TOY[i][2] ? C.green : p[i] === Math.max.apply(null, p) ? C.pink : C.dim;
        T(svg, 8, y, TOY[i][0], { anchor: "start", size: 10.5, fill: tone });
        T(svg, 200, y, TOY[i][1].toFixed(2), { anchor: "end", size: 10.5, fill: tone });
        T(svg, 290, y, p[i].toFixed(4), { anchor: "end", size: 10.5, fill: tone });
        rect(svg, 306, y - 6, p[i] * 120, 12, { rx: 2, fill: tone, stroke: "none", op: 0.5 });
        y += 19;
      }
      T(svg, 8, y + 8, "loss = -ln(" + p[0].toFixed(4) + ") = " + (-Math.log(p[0])).toFixed(4),
        { anchor: "start", size: 11, fill: C.orange });
      T(svg, 8, y + 28, "green is the true token; pink is what the model prefers.",
        { anchor: "start", size: 9.5, fill: C.faint });

      T(svg, 8, 236, "three anchors, for a 128,256-token vocabulary",
        { anchor: "start", size: 9.5, fill: C.faint });
      y = 258;
      [["a uniform guess over the vocabulary", Math.log(VOCAB), "where an untrained model starts", C.dim],
       ["the true token at p = 0.94", -Math.log(0.94), "confident and right", C.green],
       ["the true token at p = 1e-6", -Math.log(1e-6), "confident and wrong", C.pink]].forEach(function (r) {
        T(svg, 8, y, r[0], { anchor: "start", size: 10.5, fill: r[3] });
        T(svg, 300, y, r[1].toFixed(3), { anchor: "end", size: 10.5, fill: r[3] });
        T(svg, 320, y, r[2], { anchor: "start", size: 9.5, fill: C.faint });
        y += 20;
      });
      T(svg, 8, y + 6, "Being confidently wrong costs 13.816, more than knowing nothing at 11.762.",
        { anchor: "start", size: 10, fill: C.faint });

      var RX = 470;
      T(svg, RX, 40, "loss, bits and perplexity", { anchor: "start", size: 9.5, fill: C.faint });
      y = 62;
      T(svg, RX, y, "loss", { anchor: "start", size: 9, fill: C.faint });
      T(svg, RX + 110, y, "bits/tok", { anchor: "end", size: 9, fill: C.faint });
      T(svg, 752, y, "perplexity", { anchor: "end", size: 9, fill: C.faint });
      y += 20;
      [[Math.log(VOCAB), "untrained: the whole vocabulary"], [6, ""], [4, ""], [3, ""], [2, ""],
       [1.7, "a good model on held-out web text"]].forEach(function (r) {
        var L = r[0], ppl = Math.exp(L);
        T(svg, RX, y, L.toFixed(2), { anchor: "start", size: 10.5, fill: r[1] ? C.teal : C.dim });
        T(svg, RX + 110, y, (L / Math.LN2).toFixed(2), { anchor: "end", size: 10.5, fill: C.dim });
        T(svg, 752, y, ppl >= 1000 ? Math.round(ppl).toLocaleString("en-US")
                                   : ppl >= 10 ? ppl.toFixed(0) : ppl.toFixed(1),
          { anchor: "end", size: 10.5, fill: r[1] ? C.teal : C.text });
        y += 20;
        if (r[1]) { T(svg, RX, y - 8, r[1], { anchor: "start", size: 8.5, fill: C.faint }); y += 10; }
      });
      wrapT(svg, RX, 330, 44, 16, "perplexity = exp(loss): how many equally likely " +
        "options it is effectively choosing between.", { size: 10, fill: C.faint });
    }

    function render() {
      while (svg.firstChild) svg.removeChild(svg.firstChild);
      if (tab === 0) renderBatch(); else renderAnchors();
    }
    function say() {
      if (tab) { f.say("Six logits in, one loss out: 1.5923 nats, because the true token got 0.2035."); return; }
      var b = BATCH[sel.s];
      f.say(STAGE[stg] + " · " + show(b.toks[sel.i]) + " cost " + b.loss[sel.i].toFixed(3) +
        " nats, p = " + Math.exp(-b.loss[sel.i]).toFixed(5) + ". Batch mean " + MEAN.toFixed(3) + ".");
    }

    f.btn("step", function () { stg = (stg + 1) % STAGE.length; tab = 0; tT.sync(0); render(); say(); });
    f.btn("worst token", function () {
      sel = { s: WORST[0].s, i: WORST[0].i }; tab = 0; tT.sync(0); render();
      f.say("The most expensive token in the batch is " + show(BATCH[sel.s].toks[sel.i]) +
        " at " + WORST[0].v.toFixed(2) + " nats — p = " + Math.exp(-WORST[0].v).toFixed(6) + ".");
    });
    var tT = tabs(f.controls, ["a real batch", "the section's arithmetic"], 0, function (i) {
      tab = i; render(); say();
    });
    f.btn("reset", function () {
      stg = 0; sel = { s: 0, i: 0 }; tab = 0; tT.sync(0); render();
      f.say("Step one training step. Click a position to see what the model got wrong.");
    });

    render();
    f.say("Step one training step. Click a position to see what the model got wrong.");
  };


  /* ========================================================================
     29. llmLossCurves — CH 13 — Comparator

     Six shapes, each generated from one healthy curve plus the single fault
     the section describes, so the difference on screen is the fault and
     nothing else. The healthy curve is drawn faint behind every panel for
     exactly that reason: the diagnosis is in the departure, not the level.

     The healthy curve is anchored at the section's own numbers — 11.76 at
     step 1, through 6-ish in the first few hundred steps, to a little over 2
     by twenty thousand — so the early collapse a reader sees is the unigram
     frequencies being learned, which is what the section says it is.

     Row two, middle, is the one the section singles out: a small bump that
     is a discovery about the model rather than about the run, and Chapter 11
     has already shown the reader what forms there.
     ======================================================================== */
  VIZ.llmLossCurves = function (el) {
    var f = frame(el);

    var T0 = 20000;
    function healthy(t) { return 1.7 + 11.9 / (1 + Math.sqrt(t / 30)); }

    var CURVES = [
      { n: "spike, then recovery", d: "A difficult batch. With gradient clipping on this is normal and needs no action.",
        act: "no action", tone: 1,
        f: function (t) { return healthy(t) + (t >= 3000 && t < 3400 ? 2.6 * Math.exp(-(t - 3000) / 90) : 0); } },
      { n: "spike, no recovery", d: "The update was large enough to move the parameters somewhere useless. Restore the last checkpoint, skip the batches that caused it, continue. PaLM and OPT both documented doing this repeatedly.",
        act: "restore a checkpoint", tone: 2,
        f: function (t) { return t < 3000 ? healthy(t) : healthy(t) + 3.1 - 0.00004 * (t - 3000); } },
      { n: "step change downward", d: "Not a bug: something changed. A learning-rate schedule transition, a data-mixture change, or an annealing phase.",
        act: "no action", tone: 1,
        f: function (t) { return healthy(t) - (t >= 12000 ? 0.45 : 0); } },
      { n: "a long plateau", d: "Either the learning rate has decayed to nearly zero, which the schedule will tell you, or it collapsed early, which is a bug. Check the actual learning rate before touching anything else.",
        act: "read the learning rate first", tone: 2,
        f: function (t) { return t < 800 ? healthy(t) : healthy(800) - 0.00002 * (t - 800); } },
      { n: "a small bump, early", d: "The interesting one. This is where the induction heads of Chapter 11 form: the circuit reorganizes, the loss briefly worsens, and when it resolves the model can do in-context learning.",
        act: "nothing — that is the model learning", tone: 0,
        f: function (t) { return healthy(t) + (t > 400 && t < 1400 ? 0.30 * Math.sin(Math.PI * (t - 400) / 1000) : 0) - (t >= 1400 ? 0.12 : 0); } },
      { n: "validation rising", d: "Overfitting — and during pretraining that is almost always a bug rather than a limit, because a model seeing trillions of mostly-unique tokens should not be able to overfit. Suspect a corpus far smaller than intended, or a validation split that overlaps the training data.",
        act: "check the corpus size and the split", tone: 2,
        f: function (t) { return healthy(t); },
        g: function (t) { return t < 4000 ? healthy(t) : healthy(4000) + 0.00012 * (t - 4000); } }
    ];

    var sel = 4, shown = false;

    var svg = S("svg", { viewBox: "0 0 760 430", width: "100%",
      role: "img", "aria-label": "six loss curves, waiting to be diagnosed" }, f.body);
      svg.setAttribute("viewBox", "0 0 760 470");

    function render() {
      while (svg.firstChild) svg.removeChild(svg.firstChild);
      var i, r, c;

      T(svg, 8, 14, "six runs, same model, same data · log steps on x, loss in nats on y",
        { anchor: "start", size: 11, fill: C.faint });
      T(svg, 752, 14, shown ? "diagnoses shown" : "commit before you reveal",
        { anchor: "end", size: 11, fill: shown ? C.faint : C.orange });

      var PW = 236, PH = 116, GX = 16, GY = 44;
      function px(p, t) { return p.x + Math.log(Math.max(1, t)) / Math.log(T0) * (PW - 42); }
      function py(p, v) { return p.y + PH - 26 - Math.min(1, Math.max(0, (v - 1.4) / 11.2)) * (PH - 40); }

      for (i = 0; i < 6; i++) {
        r = Math.floor(i / 3); c = i % 3;
        var p = { x: GX + c * (PW + 8) + 30, y: GY + r * (PH + 68) };
        var cur = CURVES[i], on = i === sel;
        if (on) rect(svg, p.x - 28, p.y - 14, PW + 6, PH + 4,
          { rx: 5, fill: C.panel, stroke: "none", op: 0.9 });
        /* axes */
        line(svg, p.x, p.y + PH - 26, p.x + PW - 42, p.y + PH - 26, { stroke: C.line, sw: 1 });
        line(svg, p.x, p.y - 8, p.x, p.y + PH - 26, { stroke: C.line, sw: 1 });
        /* healthy, faint, behind */
        var hp = [], gp = [], fp = [], t;
        for (t = 1; t <= T0; t = Math.max(t + 1, Math.round(t * 1.10))) {
          hp.push(px(p, t) + "," + py(p, healthy(t)));
          fp.push(px(p, t) + "," + py(p, cur.f(t)));
          if (cur.g) gp.push(px(p, t) + "," + py(p, cur.g(t)));
        }
        S("polyline", { points: hp.join(" "), fill: "none", stroke: C.faint,
          "stroke-width": 1, "stroke-dasharray": "3 3", opacity: 0.5 }, svg);
        S("polyline", { points: fp.join(" "), fill: "none",
          stroke: on ? C.teal : C.blue, "stroke-width": on ? 2 : 1.5 }, svg);
        if (cur.g) S("polyline", { points: gp.join(" "), fill: "none",
          stroke: C.pink, "stroke-width": on ? 2 : 1.5 }, svg);
        T(svg, p.x - 6, p.y - 2, "11.8", { anchor: "end", size: 8, fill: C.faint });
        T(svg, p.x - 6, p.y + PH - 30, "1.4", { anchor: "end", size: 8, fill: C.faint });
        T(svg, p.x, p.y + PH - 14, "1", { anchor: "start", size: 8, fill: C.faint });
        T(svg, p.x + PW - 42, p.y + PH - 14, "20k", { anchor: "end", size: 8, fill: C.faint });
        var lab = T(svg, p.x - 28, p.y + PH + 2, (i + 1) + ". " + (shown ? cur.n : "curve " + (i + 1)),
          { anchor: "start", size: 10, fill: on ? C.text : C.dim });
        lab.style.cursor = "pointer";
        (function (k) { lab.addEventListener("click", function () { sel = k; render(); say(); }); })(i);
        if (cur.g) T(svg, p.x + PW - 42, p.y + PH + 18, "train · validation",
          { anchor: "end", size: 8, fill: C.pink });
      }

      /* the one you are looking at */
      var cu = CURVES[sel];
      line(svg, 8, 372, 752, 372, { stroke: C.line, sw: 1 });
      T(svg, 8, 390, "curve " + (sel + 1) + (shown ? " — " + cu.n : ""),
        { anchor: "start", size: 11, fill: shown ? [C.teal, C.dim, C.pink][cu.tone] : C.text });
      if (shown) {
        var yy = wrapT(svg, 8, 410, 120, 16, cu.d, { size: 10, fill: C.faint, max: 3 });
        T(svg, 8, yy + 4, "what to do: " + cu.act, { anchor: "start", size: 10.5,
          fill: cu.tone === 2 ? C.orange : C.green });
      } else {
        wrapT(svg, 8, 410, 120, 17, "Decide what this one is before you press reveal. The faint " +
          "dashed line behind it is a healthy run on the same axes. Getting the spike-that-recovers " +
          "wrong is common and harmless; getting the plateau wrong costs a week.",
          { size: 10, fill: C.faint, max: 3 });
      }
    }

    function say() {
      f.say(shown ? "Curve " + (sel + 1) + ": " + CURVES[sel].n + " — " + CURVES[sel].act + "."
                  : "Curve " + (sel + 1) + " selected. Commit to a diagnosis, then reveal.");
    }

    var tC = tabs(f.controls, ["1", "2", "3", "4", "5", "6"], 4, function (i) { sel = i; render(); say(); });
    var tgR = toggle(f.controls, "reveal", false, function (v) {
      shown = v; render();
      f.say(v ? "Five of the six need no action or a known action. Only curve 5 is a discovery " +
                "about the model rather than about the run."
              : "Hidden again. Diagnose each curve before you reveal the answer.");
    });
    f.btn("reset", function () {
      sel = 4; shown = false; tC.sync(4); tgR.set(false); render();
      f.say("Diagnose each curve before you reveal the answer.");
    });

    render();
    f.say("Diagnose each curve before you reveal the answer.");
  };



  /* ========================================================================
     30. llmOptimizer — CH 14 — Simulator

     Four optimizers, written out exactly as section 1 writes them, run on an
     ill-conditioned surface with a quartic wall so that instability actually
     diverges instead of merely oscillating.

     The blueprint's discovery lands on SGD at a learning rate of 0.25: with
     no warmup it blows up at step 18, and with fifty steps of warmup the
     same learning rate converges. Nothing else changed.

     Adam does not diverge here at any learning rate on offer, and that is
     worth seeing rather than hiding. Its update is m/sqrt(v), which is
     bounded near the learning rate whatever the gradient does, so on a
     surface like this it oscillates rather than explodes. What warmup buys
     Adam is elsewhere and the machine shows it: at step 1 the second moment
     is a single sample, so |update| is lr in every coordinate regardless of
     how small that coordinate's gradient was. The update-size trace makes
     that first step visible, which is what section 2 means by "Adam's
     moments need data before they are trusted".
     ======================================================================== */
  VIZ.llmOptimizer = function (el) {
    var f = frame(el);

    var KIND = ["SGD", "momentum", "Adam", "AdamW"], SCHED = ["constant", "cosine", "wsd"];
    var N = 300, X0 = -5.0, Y0 = 1.4;
    var kind = 0, lr = 0.25, warm = 0, sch = 0;

    function loss(x, y) { return 0.5 * (x * x / 8 + 8 * y * y) + 0.02 * (x * x * x * x + y * y * y * y); }
    function grad(x, y) { return [x / 8 + 0.08 * x * x * x, 8 * y + 0.08 * y * y * y]; }

    function lrAt(t) {
      var w = warm ? Math.min(1, t / warm) : 1, frac, base = 1;
      if (sch === 1) {                                   // cosine to a tenth
        frac = Math.max(0, (t - warm) / Math.max(1, N - warm));
        base = 0.1 + 0.9 * 0.5 * (1 + Math.cos(Math.PI * frac));
      } else if (sch === 2) {                            // warmup-stable-decay
        frac = (t - warm) / Math.max(1, N - warm);
        base = frac < 0.8 ? 1 : 0.1 + 0.9 * (1 - (frac - 0.8) / 0.2);
      }
      return lr * w * base;
    }

    function run() {
      var x = X0, y = Y0, mx = 0, my = 0, vx = 0, vy = 0, t, div = -1;
      var path = [[x, y]], L = [loss(x, y)], U = [0], wd = kind === 3 ? 0.02 : 0;
      for (t = 1; t <= N; t++) {
        var g = grad(x, y), l = lrAt(t), ux, uy;
        if (!isFinite(g[0]) || !isFinite(g[1]) || Math.abs(x) > 60 || Math.abs(y) > 60) { div = t; break; }
        if (kind === 0) { ux = l * g[0]; uy = l * g[1]; }
        else if (kind === 1) {
          mx = 0.9 * mx + g[0]; my = 0.9 * my + g[1];
          ux = l * mx; uy = l * my;
        } else {
          mx = 0.9 * mx + 0.1 * g[0]; my = 0.9 * my + 0.1 * g[1];
          vx = 0.95 * vx + 0.05 * g[0] * g[0]; vy = 0.95 * vy + 0.05 * g[1] * g[1];
          var bm = 1 - Math.pow(0.9, t), bv = 1 - Math.pow(0.95, t);
          ux = l * (mx / bm) / (Math.sqrt(vx / bv) + 1e-8);
          uy = l * (my / bm) / (Math.sqrt(vy / bv) + 1e-8);
        }
        x -= ux + wd * l * x; y -= uy + wd * l * y;      // AdamW: decay applied apart
        path.push([x, y]); L.push(loss(x, y));
        U.push(Math.sqrt(ux * ux + uy * uy));
      }
      return { path: path, L: L, U: U, div: div };
    }

    var svg = S("svg", { viewBox: "0 0 760 424", width: "100%",
      role: "img", "aria-label": "an optimizer's path down an ill-conditioned valley" }, f.body);

    var MX0 = 8, MY0 = 44, MW = 396, MH = 176, XR = 7, YR = 2.1;
    function sx(x) { return MX0 + (x + XR) / (2 * XR) * MW; }
    function sy(y) { return MY0 + (YR - y) / (2 * YR) * MH; }

    function render() {
      while (svg.firstChild) svg.removeChild(svg.firstChild);
      var R = run(), i;

      T(svg, 8, 14, KIND[kind] + " · lr " + lr.toFixed(3) + " · warmup " + warm +
        " steps · " + SCHED[sch] + " schedule", { anchor: "start", size: 11, fill: C.teal });
      T(svg, 752, 14, R.div > 0 ? "diverged at step " + R.div
                                : "final loss " + R.L[R.L.length - 1].toExponential(2),
        { anchor: "end", size: 11, fill: R.div > 0 ? C.pink : C.green });

      /* the surface, as a coarse heat map */
      T(svg, 8, 32, "loss surface: a narrow valley with a quartic wall",
        { anchor: "start", size: 9, fill: C.faint });
      var NX = 48, NY = 22, cw = MW / NX, chh = MH / NY, r2, c2;
      for (c2 = 0; c2 < NX; c2++) for (r2 = 0; r2 < NY; r2++) {
        var gx = -XR + (c2 + 0.5) / NX * 2 * XR, gy = YR - (r2 + 0.5) / NY * 2 * YR;
        var v = Math.min(1, Math.log(1 + loss(gx, gy)) / Math.log(1 + 70));
        rect(svg, MX0 + c2 * cw, MY0 + r2 * chh, cw + 0.6, chh + 0.6,
          { rx: 0, fill: C.blue, stroke: "none", op: 0.06 + v * 0.34 });
      }
      /* the path */
      var pts = [];
      for (i = 0; i < R.path.length; i++) {
        var p = R.path[i];
        if (Math.abs(p[0]) > XR * 1.6 || Math.abs(p[1]) > YR * 1.6) break;
        pts.push(sx(Math.max(-XR, Math.min(XR, p[0]))) + "," + sy(Math.max(-YR, Math.min(YR, p[1]))));
      }
      S("polyline", { points: pts.join(" "), fill: "none",
        stroke: R.div > 0 ? C.pink : C.orange, "stroke-width": 1.6 }, svg);
      S("circle", { cx: sx(X0), cy: sy(Y0), r: 3.5, fill: C.text }, svg);
      S("circle", { cx: sx(0), cy: sy(0), r: 3, fill: "none", stroke: C.green, "stroke-width": 2 }, svg);
      T(svg, sx(X0), sy(Y0) - 10, "start", { size: 8.5, fill: C.faint });
      T(svg, sx(0) + 26, sy(0) - 8, "minimum", { size: 8.5, fill: C.green });

      /* loss and update size */
      var PX = 444, PW = 308, PY = 44, PH = 80;
      function lx(i2) { return PX + i2 / N * PW; }
      function ly(v) { return PY + PH - Math.min(1, Math.max(0, (Math.log10(Math.max(1e-8, v)) + 8) / 10)) * PH; }
      T(svg, PX, 32, "loss, log scale", { anchor: "start", size: 9, fill: C.faint });
      line(svg, PX, PY + PH, PX + PW, PY + PH, { stroke: C.line, sw: 1 });
      pts = [];
      for (i = 0; i < R.L.length; i++) pts.push(lx(i) + "," + ly(R.L[i]));
      S("polyline", { points: pts.join(" "), fill: "none",
        stroke: R.div > 0 ? C.pink : C.teal, "stroke-width": 1.6 }, svg);

      var UY = 158, UH = 66;
      function uy2(v) { return UY + UH - Math.min(1, Math.max(0, (Math.log10(Math.max(1e-6, v)) + 6) / 7)) * UH; }
      T(svg, PX, 146, "size of each update, log scale", { anchor: "start", size: 9, fill: C.faint });
      line(svg, PX, UY + UH, PX + PW, UY + UH, { stroke: C.line, sw: 1 });
      pts = [];
      for (i = 1; i < R.U.length; i++) pts.push(lx(i) + "," + uy2(R.U[i]));
      S("polyline", { points: pts.join(" "), fill: "none", stroke: C.orange, "stroke-width": 1.6 }, svg);
      if (R.U.length > 1) {
        T(svg, PX, 238, "first update " + R.U[1].toExponential(2),
          { anchor: "start", size: 9.5, fill: kind >= 2 && !warm ? C.orange : C.faint });
        if (kind >= 2 && !warm)
          T(svg, PX, 253, "that is lr, whatever the gradient was",
            { anchor: "start", size: 9.5, fill: C.orange });
      }

      /* the rule being applied */
      var code = kind === 0 ? ["update = lr * g"]
        : kind === 1 ? ["m = 0.9*m + g", "update = lr * m"]
        : ["m = b1*m + (1-b1)*g", "v = b2*v + (1-b2)*g*g",
           "update = lr * m / (sqrt(v) + eps)"].concat(kind === 3 ? ["w -= lr * 0.02 * w   (decoupled)"] : []);
      var cy2 = 262;
      T(svg, 8, cy2, "the update rule, as section 1 writes it", { anchor: "start", size: 9, fill: C.faint });
      code.forEach(function (c3) { cy2 += 17; T(svg, 8, cy2, c3, { anchor: "start", size: 10, fill: C.dim }); });

      /* what just happened */
      var alt = run.call(null), msg;
      line(svg, 8, 344, 752, 344, { stroke: C.line, sw: 1 });
      if (R.div > 0)
        msg = KIND[kind] + " at lr " + lr.toFixed(3) + " diverged at step " + R.div +
          (warm ? ", even with " + warm + " steps of warmup." : ". Turn warmup up and run it again.");
      else if (kind === 0 && lr >= 0.22 && warm)
        msg = "Converged — at a learning rate that diverges at step 18 with no warmup. " +
          "Only the first " + warm + " steps changed.";
      else msg = KIND[kind] + " reached " + R.L[R.L.length - 1].toExponential(2) + " in " +
          (R.L.length - 1) + " steps.";
      T(svg, 8, 364, msg, { anchor: "start", size: 10.5, fill: R.div > 0 ? C.pink : C.green });
      wrapT(svg, 8, 386, 120, 17, kind >= 2
        ? "Adam's update is m/sqrt(v), which stays near lr whatever the gradient does, so it does not " +
          "explode here. Its warmup argument is the first update above: at step 1 the second moment is " +
          "one sample."
        : "SGD and momentum scale the raw gradient, so a step size past 2/curvature leaves the valley " +
          "and the quartic wall does the rest. Warmup gives the trajectory time to reach a flatter place " +
          "first.", { size: 10, fill: C.faint, max: 3 });
    }

    function say() {
      var R = run();
      f.say(KIND[kind] + " at lr " + lr.toFixed(3) + (warm ? " with " + warm + " warmup steps" : ", no warmup") +
        ": " + (R.div > 0 ? "diverged at step " + R.div + "." : "final loss " + R.L[R.L.length - 1].toExponential(2) + "."));
    }

    var tK = tabs(f.controls, KIND, 0, function (i) { kind = i; render(); say(); });
    var sL = slider(f.controls, "lr", 0.01, 1.2, 0.25, 0.01,
      function (v) { return v.toFixed(2); }, function (v) { lr = v; render(); say(); });
    var sW = slider(f.controls, "warmup", 0, 120, 0, 10,
      function (v) { return String(Math.round(v)); }, function (v) { warm = Math.round(v); render(); say(); });
    var tS = tabs(f.controls, SCHED, 0, function (i) { sch = i; render(); say(); });
    f.btn("reset", function () {
      kind = 0; lr = 0.25; warm = 0; sch = 0;
      tK.sync(0); tS.sync(0); sL.set(0.25); sW.set(0); render();
      f.say("Raise the learning rate until it diverges. Then turn warmup on.");
    });

    render();
    f.say("Raise the learning rate until it diverges. Then turn warmup on.");
  };


  /* ========================================================================
     31. llmPrecision — CH 14 — Comparator

     Real round-to-nearest-even encoders for fp16, bf16 and fp8 e4m3, so the
     values on screen are what the hardware would store. The format table is
     derived from the bit layouts rather than typed in, and comes out as
     section 3 printed it: fp32 3.40e+38 / 1.18e-38 / 6.9 digits, fp16 65,504
     / 6.10e-05 / 3.0, bf16 3.39e+38 / 1.18e-38 / 2.1.

     Both of the section's measurements reproduce. A gradient of 1e-8 becomes
     exactly zero in fp16, because the smallest fp16 subnormal is 2^-24 =
     5.96e-8; multiply by 1,024 and it lands at 1.024e-5, comfortably
     representable, which is loss scaling in one line. And an update of 1e-4
     added to a weight of 1.0 returns exactly 1.0 in bf16, because the gap
     between representables there is 2^-7 and anything under half of it —
     0.0039 — rounds away. That single fact is the argument for fp32 master
     weights, and the machine performs it rather than asserting it.
     ======================================================================== */
  VIZ.llmPrecision = function (el) {
    var f = frame(el);

    /* (name, exponent bits, mantissa bits, bias) */
    var FMT = [["fp32", 8, 23], ["fp16", 5, 10], ["bf16", 8, 7], ["fp8 e4m3", 4, 3]];
    function bias(e) { return (1 << (e - 1)) - 1; }
    function maxOf(e, m) {
      return (2 - Math.pow(2, -m)) * Math.pow(2, (1 << e) - 2 - bias(e));
    }
    function minNormal(e) { return Math.pow(2, 1 - bias(e)); }
    function digits(m) { return m * Math.LN2 / Math.LN10; }

    /* round-to-nearest-even into (e, m), with subnormals and overflow */
    function quant(x, e, m) {
      if (x === 0 || !isFinite(x)) return x;
      var s = x < 0 ? -1 : 1, a = Math.abs(x), B = bias(e);
      var emax = (1 << e) - 2 - B, emin = 1 - B;
      var q, sub = Math.pow(2, emin - m);
      if (a < Math.pow(2, emin)) {                       // subnormal range
        q = Math.round(a / sub);
        return s * q * sub;
      }
      var ex = Math.floor(Math.log(a) / Math.LN2);
      var scale = Math.pow(2, ex - m);
      q = Math.round(a / scale);
      if (q === Math.pow(2, m + 1)) { q = Math.pow(2, m); ex += 1; scale = Math.pow(2, ex - m); }
      if (ex > emax) return s * Infinity;
      return s * q * scale;
    }

    var CASE = ["a gradient", "an activation", "a weight plus an update"];
    var ex = -8, scaled = false, cs = 0;

    function value() { return Math.pow(10, ex) * (scaled ? 1024 : 1); }

    var svg = S("svg", { viewBox: "0 0 760 424", width: "100%",
      role: "img", "aria-label": "one number, stored four ways" }, f.body);

    function fmtNum(v) {
      if (v === 0) return "0";
      if (!isFinite(v)) return v > 0 ? "inf" : "-inf";
      var a = Math.abs(v);
      return (a >= 1e-4 && a < 1e6) ? String(Number(v.toPrecision(8))) : v.toExponential(3);
    }

    function render() {
      while (svg.firstChild) svg.removeChild(svg.firstChild);
      var i, y;

      T(svg, 8, 14, "bit layouts, and one number put through each of them",
        { anchor: "start", size: 11, fill: C.teal });

      /* the table, derived */
      y = 42;
      T(svg, 8, y, "format", { anchor: "start", size: 9, fill: C.faint });
      T(svg, 170, y, "bits", { anchor: "end", size: 9, fill: C.faint });
      T(svg, 290, y, "max value", { anchor: "end", size: 9, fill: C.faint });
      T(svg, 400, y, "min normal", { anchor: "end", size: 9, fill: C.faint });
      T(svg, 490, y, "decimal digits", { anchor: "end", size: 9, fill: C.faint });
      y += 20;
      FMT.forEach(function (F) {
        var e = F[1], m = F[2], tone = F[0] === "bf16" ? C.teal : F[0] === "fp16" ? C.orange : C.dim;
        T(svg, 8, y, F[0], { anchor: "start", size: 10.5, fill: tone });
        T(svg, 170, y, "1+" + e + "+" + m, { anchor: "end", size: 10.5, fill: C.dim });
        T(svg, 290, y, maxOf(e, m) > 1e5 ? maxOf(e, m).toExponential(2)
                                         : Math.round(maxOf(e, m)).toLocaleString("en-US"),
          { anchor: "end", size: 10.5, fill: C.text });
        T(svg, 400, y, minNormal(e).toExponential(2), { anchor: "end", size: 10.5, fill: C.text });
        T(svg, 490, y, digits(m).toFixed(1), { anchor: "end", size: 10.5, fill: C.text });
        y += 20;
      });
      T(svg, 8, y + 6, "bf16 keeps fp32's exponent and spends the saved bits on nothing: same range, fewer digits.",
        { anchor: "start", size: 9.5, fill: C.faint });

      /* the value under test */
      var v = value();
      T(svg, 8, 168, CASE[cs] + " of " + fmtNum(Math.pow(10, ex)) +
        (scaled ? ", scaled by 1,024 to " + fmtNum(v) : ""),
        { anchor: "start", size: 11, fill: C.text });
      y = 194;
      T(svg, 8, y, "stored as", { anchor: "start", size: 9, fill: C.faint });
      T(svg, 330, y, "relative error", { anchor: "end", size: 9, fill: C.faint });
      y += 20;
      FMT.forEach(function (F) {
        var q = quant(v, F[1], F[2]), lost = q === 0 && v !== 0, over = !isFinite(q);
        var tone = lost || over ? C.pink : C.text;
        T(svg, 8, y, F[0], { anchor: "start", size: 10.5, fill: C.dim });
        T(svg, 210, y, fmtNum(q), { anchor: "end", size: 10.5, fill: tone });
        T(svg, 330, y, v === 0 ? "—" : over ? "overflow"
          : ((Math.abs(q - v) / Math.abs(v)) * 100).toFixed(q === 0 ? 0 : 3) + "%",
          { anchor: "end", size: 10.5, fill: tone });
        T(svg, 346, y, lost ? "underflowed to zero — no update, and no warning"
                    : over ? "became infinity" : "", { anchor: "start", size: 9.5, fill: C.pink });
        y += 20;
      });

      /* the two facts the section measures */
      var RX = 8;
      line(svg, 8, 292, 752, 292, { stroke: C.line, sw: 1 });
      var g1 = quant(1e-8, 5, 10), g2 = quant(1e-8 * 1024, 5, 10);
      T(svg, RX, 312, "loss scaling, in one line", { anchor: "start", size: 9.5, fill: C.faint });
      T(svg, RX, 332, "a gradient of 1e-8 in fp16 is " + fmtNum(g1) +
        "; multiplied by 1,024 first it is " + (1e-8 * 1024).toExponential(2) +
        ", which fp16 keeps as " + g2.toExponential(3) + ".",
        { anchor: "start", size: 10.5, fill: C.orange });
      var w1 = quant(1.0 + 1e-4, 8, 7), gap = Math.pow(2, -7);
      T(svg, RX, 358, "why fp32 master weights exist", { anchor: "start", size: 9.5, fill: C.faint });
      T(svg, RX, 378, "1.0 + 1e-4 in bf16 is " + fmtNum(w1) + ". The gap between bf16 values near 1.0 is " +
        gap.toFixed(7) + ",", { anchor: "start", size: 10.5, fill: C.pink });
      T(svg, RX, 398, "so anything under half of it — " + (gap / 2).toFixed(4) +
        " — rounds away. Late in training most updates are that size.",
        { anchor: "start", size: 10.5, fill: C.pink });
    }

    function say() {
      var v = value(), q16 = quant(v, 5, 10), qb = quant(v, 8, 7);
      f.say(fmtNum(v) + ": fp16 stores " + fmtNum(q16) + ", bf16 stores " + fmtNum(qb) +
        (q16 === 0 && v !== 0 ? " — fp16 has lost it entirely." :
         !isFinite(q16) ? " — fp16 has overflowed." : "."));
    }

    var sE = slider(f.controls, "magnitude", -12, 12, -8, 1,
      function (v) { return "1e" + Math.round(v); },
      function (v) { ex = Math.round(v); render(); say(); });
    var tgS = toggle(f.controls, "loss scaling x1024", false, function (v) {
      scaled = v; render();
      f.say(v ? "Scaled by 1,024 before the backward pass, and divided back before the step: the " +
                "mathematics is unchanged and the gradient survives fp16."
              : "Unscaled. Anything below 6e-8 is gone in fp16.");
    });
    var tC = tabs(f.controls, ["gradient", "activation", "weight + update"], 0, function (i) {
      cs = i; ex = [-8, 4, 0][i]; sE.set(ex); render(); say();
    });
    f.btn("reset", function () {
      ex = -8; scaled = false; cs = 0; sE.set(-8); tgS.set(false); tC.sync(0); render();
      f.say("Push the values up. Watch fp16 overflow before bf16 loses precision.");
    });

    render();
    f.say("Push the values up. Watch fp16 overflow before bf16 loses precision.");
  };


  /* ========================================================================
     32. llmMemoryLevers — CH 14 — Tuner

     A 0.65B model at 8,192 tokens against a 16 GB card, priced with Chapter
     9's arithmetic so the two halves of the course agree: bf16 weights,
     fp32 master copy, fp32 gradients, and whatever the optimizer keeps.

     The levers do what section 5 says and nothing more. Accumulation raises
     the effective batch at no memory cost and multiplies the step time by
     exactly the accumulation count. Checkpointing keeps only the block
     boundaries, which at this sequence length cuts activations by about 78x
     and costs 30% of the step.

     The published tokens-per-step table falls out of the sliders: micro 4 x
     accumulate 8 x 1 device at 8,192 is 262,144 tokens per step, and the
     same micro-batch on 64 devices is 16,777,216.

     Blue is fixed by Chapter 9 and nothing here moves it. Only the red block
     answers to these two levers, which is the whole point of the section.
     ======================================================================== */
  VIZ.llmMemoryLevers = function (el) {
    var f = frame(el);

    var d = 1536, L = 24, ff = 4096, V = 32000, heads = 12, kvh = 4, hd = 128, SEQ = 8192;
    var CARD = 16 * 1e9, TFLOPS = 200e12;
    var Np = L * (d * heads * hd * 2 + d * kvh * hd * 2 + 3 * d * ff + 2 * d) + V * d + d;

    /* per-parameter bytes: weights + master + grads + optimizer state */
    var OPT = [["AdamW, fp32 state", 8], ["8-bit Adam", 2], ["SGD + momentum", 4]];
    var micro = 1, accum = 8, dev = 1, ckpt = true, oi = 0;

    function actPerToken() {
      var keep = 6 * d + 2 * kvh * hd + 3 * ff;          // what a backward pass must hold
      var probs = heads * SEQ;                           // the only term that grows with length
      return ckpt ? d * 2 * L : (keep + probs) * 2 * L;
    }
    function mem() {
      var fixed = Np * (2 + 4 + 4 + OPT[oi][1]);
      var acts = actPerToken() * SEQ * micro;
      return { fixed: fixed, acts: acts, total: fixed + acts };
    }
    function tokens() { return micro * accum * dev * SEQ; }
    function stepTime() {
      var flops = 6 * Np * tokens();
      return flops / (dev * TFLOPS) * (ckpt ? 1.3 : 1);
    }
    function commas(v) { return Math.round(v).toLocaleString("en-US"); }
    function gb(b) { return (b / 1e9).toFixed(2) + " GB"; }

    var svg = S("svg", { viewBox: "0 0 760 420", width: "100%",
      role: "img", "aria-label": "what fills a 16 GB card, and what the levers move" }, f.body);

    function render() {
      while (svg.firstChild) svg.removeChild(svg.firstChild);
      var M = mem(), fits = M.total <= CARD;

      T(svg, 8, 14, commas(Np / 1e6) + "M parameters · " + commas(SEQ) + " tokens per sequence · " +
        OPT[oi][0], { anchor: "start", size: 11, fill: C.teal });
      T(svg, 752, 14, fits ? "fits in 16 GB" : "does not fit",
        { anchor: "end", size: 11, fill: fits ? C.green : C.pink });

      /* the stack, against the card */
      var BX = 8, BW = 600, BY = 46, BH = 34, scale = Math.max(CARD, M.total) * 1.04;
      T(svg, 8, 30, "memory on one device", { anchor: "start", size: 9, fill: C.faint });
      var segs = [[Np * 2, C.blue, "weights, bf16"], [Np * 4, C.blue, "master copy, fp32"],
                  [Np * 4, C.blue, "gradients, fp32"], [Np * OPT[oi][1], C.sky, "optimizer state"],
                  [M.acts, C.pink, "activations"]];
      var x = BX;
      segs.forEach(function (s) {
        var w = s[0] / scale * BW;
        if (w > 0.5) rect(svg, x, BY, Math.max(1, w - 1), BH, { rx: 3, fill: s[1], stroke: "none", op: 0.72 });
        x += w;
      });
      var cx = BX + CARD / scale * BW;
      line(svg, cx, BY - 4, cx, BY + BH + 4, { stroke: C.pink, sw: 2, dash: "4 3" });
      T(svg, cx, BY + BH + 16, "16 GB", { size: 9, fill: C.pink });
      T(svg, 752, BY + BH / 2, gb(M.total), { anchor: "end", size: 12, fill: fits ? C.green : C.pink });

      var ly = 108;
      segs.forEach(function (s) {
        T(svg, 8, ly, s[2], { anchor: "start", size: 10, fill: C.dim });
        rect(svg, 168, ly - 5, s[0] / scale * 300, 10, { rx: 2, fill: s[1], stroke: "none", op: 0.6 });
        T(svg, 498, ly, gb(s[0]), { anchor: "end", size: 10, fill: C.text });
        T(svg, 560, ly, (s[0] / M.total * 100).toFixed(1) + "%", { anchor: "end", size: 9.5, fill: C.faint });
        ly += 19;
      });
      T(svg, 8, ly + 4, "Blue and sky are fixed by Chapter 9's arithmetic. Only the red block answers to these levers.",
        { anchor: "start", size: 9.5, fill: C.faint });

      /* the batch arithmetic */
      var RX = 600;
      T(svg, RX, 108, "effective batch", { anchor: "start", size: 9, fill: C.faint });
      T(svg, 752, 128, commas(micro * accum * dev), { anchor: "end", size: 16, fill: C.orange });
      T(svg, RX, 148, micro + " x " + accum + " x " + dev, { anchor: "start", size: 9.5, fill: C.faint });
      T(svg, RX, 174, "tokens per step", { anchor: "start", size: 9, fill: C.faint });
      T(svg, 752, 194, commas(tokens()), { anchor: "end", size: 14, fill: C.teal });

      /* time */
      var TY = 240;
      line(svg, 8, TY - 14, 752, TY - 14, { stroke: C.line, sw: 1 });
      T(svg, 8, TY, "one optimizer step", { anchor: "start", size: 9, fill: C.faint });
      var base = 6 * Np * micro * dev * SEQ / (dev * TFLOPS);
      var rows = [["one micro-batch, forward and backward", base, C.blue],
                  [accum + " of them, accumulated", base * accum, C.teal],
                  ["with checkpointing's 30%", stepTime(), ckpt ? C.orange : C.faint]];
      var ty = TY + 20, mx = stepTime();
      rows.forEach(function (r) {
        T(svg, 8, ty, r[0], { anchor: "start", size: 10, fill: C.dim });
        rect(svg, 300, ty - 5, r[1] / mx * 300, 10, { rx: 2, fill: r[2], stroke: "none", op: 0.6 });
        T(svg, 640, ty, r[1].toFixed(2) + " s", { anchor: "end", size: 10, fill: C.text });
        ty += 19;
      });
      T(svg, 8, ty + 4, "6ND FLOPs at 200 TFLOP/s effective per device. Nothing in this section makes anything faster.",
        { anchor: "start", size: 9.5, fill: C.faint });

      /* the verdict */
      var noCkpt = actPerToken.call(null), ratio;
      ckpt = !ckpt; ratio = actPerToken(); ckpt = !ckpt;
      line(svg, 8, 356, 752, 356, { stroke: C.line, sw: 1 });
      T(svg, 8, 376, fits
          ? "Fits, at " + gb(M.total) + " of 16 GB, and one step takes " + stepTime().toFixed(2) + " s."
          : "Over the card by " + gb(M.total - CARD) + ". Turn checkpointing on, or drop the micro-batch.",
        { anchor: "start", size: 10.5, fill: fits ? C.green : C.pink });
      T(svg, 8, 398, ckpt
          ? "Checkpointing keeps only the block boundaries: " + (ratio / actPerToken()).toFixed(0) +
            "x less activation memory, for 30% more time."
          : "Every intermediate is being kept. Checkpointing would cut that by " +
            (actPerToken() / ratio).toFixed(0) + "x.",
        { anchor: "start", size: 10, fill: C.faint });
    }

    function say() {
      var M = mem();
      f.say("micro " + micro + " x accumulate " + accum + " x " + dev + " device" + (dev > 1 ? "s" : "") +
        " = effective batch " + commas(micro * accum * dev) + ", " + commas(tokens()) + " tokens per step, " +
        gb(M.total) + (M.total <= CARD ? " — fits." : " — does not fit."));
    }

    var sM = slider(f.controls, "micro-batch", 1, 8, 1, 1,
      function (v) { return String(v); }, function (v) { micro = v; render(); say(); });
    var sA = slider(f.controls, "accumulate", 1, 32, 8, 1,
      function (v) { return String(v); }, function (v) { accum = v; render(); say(); });
    var sD = slider(f.controls, "devices", 1, 64, 1, 1,
      function (v) { return String(v); }, function (v) { dev = v; render(); say(); });
    var tgC = toggle(f.controls, "checkpointing", true, function (v) {
      ckpt = v; render();
      f.say(v ? "Only the block boundaries are kept; the rest is recomputed in the backward pass."
              : "Every intermediate is kept. This is where the card goes.");
    });
    var tO = tabs(f.controls, ["AdamW", "8-bit Adam", "SGD+mom"], 0, function (i) { oi = i; render(); say(); });
    f.btn("reset", function () {
      micro = 1; accum = 8; dev = 1; ckpt = true; oi = 0;
      sM.set(1); sA.set(8); sD.set(1); tgC.set(true); tO.sync(0); render();
      f.say("Fit a run that did not fit, and pay for it in wall-clock.");
    });

    render();
    f.say("Fit a run that did not fit, and pay for it in wall-clock.");
  };



  /* ========================================================================
     33. llmScalingLaw — CH 15 — Tuner

     The Chinchilla form L = E + A/N^a + B/D^b, with a = b so that the
     compute-optimal ratio is scale-free, and B/A set so that ratio is 20
     tokens per parameter — the chapter's rule.

     That choice is deliberate and worth recording. Hoffmann et al.'s
     published coefficients (A 406.4, a 0.34, B 410.7, b 0.28) do not
     reproduce their own 20:1 conclusion: minimizing under them gives about
     92 tokens per parameter, an inconsistency later replications have
     pointed out. The fit here keeps E = 1.69, A = 406.4 and a = 0.34 and
     solves B for the ratio the chapter uses, and it then lands on the
     published numbers from two different directions:

       C = 5.88e23  ->  69.98B parameters, 1.400T tokens   (Chinchilla, 70B/1.4T)
       C = 7.227e23 ->  77.62B parameters, 1.552T tokens   (section 4's 77.6B/1.55T)

     Kaplan is the 2020 allocation, N proportional to C^0.73, anchored on
     GPT-3 at 175B parameters and 300B tokens. Inference-aware is Sardana's:
     the budget has to cover 6ND of training and 2N of every token the model
     will ever serve, and the optimum moves sharply toward smaller models.
     ======================================================================== */
  VIZ.llmScalingLaw = function (el) {
    var f = frame(el);

    var E = 1.69, A = 406.4, AL = 0.34;
    var B = A * Math.pow(20, AL);                      // solves for 20 tokens/parameter
    var KAP = 1.22e-6;                                 // N = KAP * C^0.73, anchored on GPT-3
    var LAW = ["Kaplan 2020", "Chinchilla 2022", "inference-aware"];
    var EFF = 200e12;                                  // FLOPs/s per device, effective

    var logC = Math.log(7.227e23) / Math.LN10, ratio = 20, law = 1, logS = 12.7;

    function loss(N, D) { return E + A / Math.pow(N, AL) + B / Math.pow(D, AL); }
    function C() { return Math.pow(10, logC); }
    function served() { return Math.pow(10, logS); }
    function fromRatio(r, c) {                          // 6ND = c and D/N = r
      var N = Math.sqrt(c / (6 * r));
      return { N: N, D: r * N };
    }
    function optFor(k, c) {
      var i, best = null;
      if (k === 0) { var N = KAP * Math.pow(c, 0.73); return { N: N, D: c / (6 * N) }; }
      if (k === 1) return fromRatio(20, c);
      for (i = 0; i < 600; i++) {                       // budget pays for training and serving
        var n = Math.pow(10, 8 + i / 600 * 5);
        var d = (c - 2 * n * served()) / (6 * n);
        if (d < 1e9) continue;
        var L = loss(n, d);
        if (!best || L < best.L) best = { N: n, D: d, L: L };
      }
      return best || fromRatio(20, c);
    }
    function commas(v) { return Math.round(v).toLocaleString("en-US"); }
    function bn(v) { return v >= 1e12 ? (v / 1e12).toFixed(2) + "T" : (v / 1e9).toFixed(2) + "B"; }

    var svg = S("svg", { viewBox: "0 0 760 428", width: "100%",
      role: "img", "aria-label": "one compute budget, split several ways" }, f.body);

    function render() {
      while (svg.firstChild) svg.removeChild(svg.firstChild);
      var c = C(), cur = fromRatio(ratio, c), i;

      T(svg, 8, 14, "budget " + c.toExponential(3) + " FLOPs · " +
        commas(c / (EFF * 3600)) + " GPU-hours at 200 TFLOP/s",
        { anchor: "start", size: 11, fill: C.teal });
      T(svg, 752, 32, "law: " + LAW[law], { anchor: "end", size: 10, fill: C.orange });

      /* the isoFLOP curve: loss against model size at this fixed budget */
      var PX = 8, PY = 46, PW = 440, PH = 180;
      var lo = 8.2, hi = 12.4;
      function px(n) { return PX + (Math.log(n) / Math.LN10 - lo) / (hi - lo) * PW; }
      var Ls = [], mn = 1e9, mx = -1e9;
      for (i = 0; i <= 200; i++) {
        var n = Math.pow(10, lo + i / 200 * (hi - lo)), d = c / (6 * n);
        var v = d > 1e8 ? loss(n, d) : NaN;
        Ls.push([n, v]);
        if (isFinite(v)) { if (v < mn) mn = v; if (v > mx) mx = v; }
      }
      mx = Math.min(mx, mn + 0.55);
      function py(v) { return PY + PH - (1 - Math.min(1, Math.max(0, (v - mn) / (mx - mn)))) * PH; }
      T(svg, PX, 34, "loss against model size · orange is " + LAW[law] + ", teal is yours",
        { anchor: "start", size: 9, fill: C.faint });
      line(svg, PX, PY + PH, PX + PW, PY + PH, { stroke: C.line, sw: 1 });
      var pts = [];
      Ls.forEach(function (p) { if (isFinite(p[1])) pts.push(px(p[0]) + "," + py(p[1])); });
      S("polyline", { points: pts.join(" "), fill: "none", stroke: C.blue, "stroke-width": 2 }, svg);

      /* each law's optimum on the same axis */
      [0, 1, 2].forEach(function (k) {
        var o = optFor(k, c);
        if (!o || o.D <= 0 || o.N < Math.pow(10, lo) || o.N > Math.pow(10, hi)) return;
        var x = px(o.N), y = py(loss(o.N, o.D));
        var col = k === law ? C.orange : C.faint;
        /* a guide, not a rule: faint on purpose so a label may cross it */
        S("line", { x1: x, y1: PY, x2: x, y2: PY + PH, stroke: col,
          "stroke-width": k === law ? 1.5 : 1, "stroke-dasharray": "3 3", opacity: 0.45 }, svg);
        S("circle", { cx: x, cy: y, r: k === law ? 4 : 2.5, fill: col }, svg);
        /* no label: the panel on the right names the law and its pick, and a
           label here collides with whichever guide happens to share its x. */
      });
      var cx2 = px(cur.N);
      if (cur.N >= Math.pow(10, lo) && cur.N <= Math.pow(10, hi)) {
        line(svg, cx2, PY, cx2, PY + PH, { stroke: C.teal, sw: 2 });
        S("circle", { cx: cx2, cy: py(loss(cur.N, cur.D)), r: 4, fill: C.teal }, svg);
      }
      T(svg, PX, PY + PH + 14, "1e" + lo.toFixed(0) + " parameters",
        { anchor: "start", size: 8.5, fill: C.faint });
      T(svg, PX + PW, PY + PH + 14, "1e" + hi.toFixed(0),
        { anchor: "end", size: 8.5, fill: C.faint });

      /* what this split buys */
      var RX = 476, y = 46;
      function row(k, v, tone) {
        T(svg, RX, y, k, { anchor: "start", size: 10, fill: C.faint });
        T(svg, 752, y, v, { anchor: "end", size: 10.5, fill: tone || C.text });
        y += 19;
      }
      T(svg, RX, 34, "your split", { anchor: "start", size: 9, fill: C.faint });
      row("tokens per parameter", ratio.toFixed(1), C.teal);
      row("parameters", bn(cur.N));
      row("training tokens", bn(cur.D));
      row("predicted loss", loss(cur.N, cur.D).toFixed(4), C.teal);
      row("FLOPs per served token", (2 * cur.N / 1e9).toFixed(2) + " G", C.orange);
      y += 10;
      var o2 = optFor(law, c);
      T(svg, RX, y, LAW[law] + " would pick", { anchor: "start", size: 9, fill: C.faint });
      y += 16;
      row("parameters", bn(o2.N), C.orange);
      row("training tokens", bn(o2.D), C.orange);
      row("tokens per parameter", (o2.D / o2.N).toFixed(1), C.orange);
      row("its loss", loss(o2.N, o2.D).toFixed(4), C.orange);
      if (law === 2) row("tokens you will serve", bn(served()), C.faint);

      /* the two runs that settled it */
      var ty = 262;
      line(svg, 8, ty - 14, 448, ty - 14, { stroke: C.line, sw: 1 });
      T(svg, 8, ty, "the two runs that settled it, 6ND computed here",
        { anchor: "start", size: 9, fill: C.faint });
      ty += 20;
      T(svg, 8, ty, "model", { anchor: "start", size: 9, fill: C.faint });
      T(svg, 180, ty, "parameters", { anchor: "end", size: 9, fill: C.faint });
      T(svg, 250, ty, "tokens", { anchor: "end", size: 9, fill: C.faint });
      T(svg, 310, ty, "D/N", { anchor: "end", size: 9, fill: C.faint });
      T(svg, 420, ty, "compute", { anchor: "end", size: 9, fill: C.faint });
      ty += 19;
      [["Gopher", 280e9, 300e9], ["Chinchilla", 70e9, 1.4e12]].forEach(function (m) {
        T(svg, 8, ty, m[0], { anchor: "start", size: 10.5, fill: C.dim });
        T(svg, 180, ty, bn(m[1]), { anchor: "end", size: 10.5, fill: C.text });
        T(svg, 250, ty, bn(m[2]), { anchor: "end", size: 10.5, fill: C.text });
        T(svg, 310, ty, (m[2] / m[1]).toFixed(1), { anchor: "end", size: 10.5, fill: C.text });
        T(svg, 420, ty, (6 * m[1] * m[2]).toExponential(2), { anchor: "end", size: 10.5, fill: C.text });
        ty += 19;
      });
      T(svg, 8, ty + 4, "Nearly the same compute. Chinchilla beat Gopher on the split alone.",
        { anchor: "start", size: 9.5, fill: C.faint });

      /* the verdict */
      line(svg, 8, 362, 752, 362, { stroke: C.line, sw: 1 });
      var kap = optFor(0, c), chi = optFor(1, c);
      T(svg, 8, 382, "Kaplan picks " + bn(kap.N) + " and Chinchilla " + bn(chi.N) + " for the same " +
        c.toExponential(2) + " FLOPs — a factor of " + (kap.N / chi.N).toFixed(1) + ".",
        { anchor: "start", size: 10.5, fill: C.orange });
      wrapT(svg, 8, 404, 122, 16, law === 2
        ? "Inference-aware puts serving in the objective: the budget must cover 6ND once and 2N on " +
          "every token the model ever emits, which pushes the optimum smaller still."
        : "a = b here, so the optimum is a scale-free 20 tokens per parameter — the chapter's rule, " +
          "and the ratio Hoffmann's own published coefficients famously fail to reproduce.",
        { size: 10, fill: C.faint, max: 2 });
    }

    function say() {
      var c = C(), cur = fromRatio(ratio, c), o = optFor(law, c);
      f.say(ratio.toFixed(1) + " tokens per parameter is " + bn(cur.N) + " on " + bn(cur.D) +
        ", loss " + loss(cur.N, cur.D).toFixed(4) + ". " + LAW[law] + " would pick " + bn(o.N) + ".");
    }

    var sC = slider(f.controls, "budget", 21, 26, 23.859, 0.01,
      function (v) { return "1e" + v.toFixed(2); },
      function (v) { logC = v; render(); say(); });
    var sR = slider(f.controls, "tokens/param", 0.3, 2.4, 1.301, 0.02,
      function (v) { return Math.pow(10, v).toFixed(1); },
      function (v) { ratio = Math.pow(10, v); render(); say(); });
    var sS = slider(f.controls, "served tokens", 10, 14, 12.7, 0.1,
      function (v) { return "1e" + v.toFixed(1); },
      function (v) { logS = v; render(); say(); });
    var tL = tabs(f.controls, LAW, 1, function (i) {
      law = i; render();
      f.say(i === 0 ? "Kaplan 2020: N grows as C^0.73, so nearly all of a bigger budget goes into parameters."
          : i === 1 ? "Chinchilla 2022: 20 tokens per parameter, at every budget."
          : "Inference-aware: the budget covers 6ND of training and 2N of every token you will ever serve.");
    });
    f.btn("reset", function () {
      logC = Math.log(7.227e23) / Math.LN10; ratio = 20; law = 1; logS = 12.7;
      sC.set(logC); sR.set(1.301); sS.set(12.7); tL.sync(1); render();
      f.say("Fix the budget. Find the best split. Then change the law.");
    });

    render();
    f.say("Fix the budget. Find the best split. Then change the law.");
  };


  /* ========================================================================
     34. llmEmergence — CH 15 — Comparator

     This machine sits in section 4, which is about inference-aware scaling,
     and its own title is about metrics and emergence, which is section 6.
     Rather than pick one, it does both, because the two tabs are small and
     the reader arrives from either direction.

     The bill tab reproduces section 4 exactly, by arithmetic: Corvid-8B on
     15T tokens is 7.227e23 FLOPs; spent the compute-optimal way that is
     77.6B on 1.55T; 2N per served token is 16.06 G against 155.21 G; and
     the crossover, training cost divided by the per-token saving, is
     5.19 trillion served tokens.

     The jump tab is section 6's deflation, performed. One smooth per-digit
     accuracy curve, scored three ways. Exact match over five digits is that
     curve raised to the fifth power, which is near zero until it is not.
     Nothing about the model changes between the three charts — only the
     ruler does, which is the methodological rule that outlives the debate.
     ======================================================================== */
  VIZ.llmEmergence = function (el) {
    var f = frame(el);

    var N0 = 8.03e9, D0 = 15e12;
    var CTRAIN = 6 * N0 * D0;
    var RATIO = 20;
    var NOPT = Math.sqrt(CTRAIN / (6 * RATIO)), DOPT = RATIO * NOPT;
    var SAVE = 2 * NOPT - 2 * N0;
    var BREAK = CTRAIN / SAVE;

    var METRIC = ["exact match", "per-digit partial credit", "log-likelihood"];
    var DIGITS = 5;
    var tab = 0, met = 0, logS = Math.log(BREAK) / Math.LN10;

    function pdigit(logN) { return 1 / (1 + Math.exp(-(logN - 10.2) / 0.28)); }
    function score(logN, m) {
      var p = pdigit(logN);
      if (m === 0) return Math.pow(p, DIGITS);
      if (m === 1) return p;
      return Math.max(0, 1 + Math.log(Math.max(1e-6, p)) / 12);   // scaled log-likelihood
    }
    function bn(v) { return v >= 1e12 ? (v / 1e12).toFixed(2) + "T" : (v / 1e9).toFixed(2) + "B"; }

    var svg = S("svg", { viewBox: "0 0 760 424", width: "100%",
      role: "img", "aria-label": "the inference bill, and a jump that is a ruler" }, f.body);

    function renderBill() {
      var i, y;
      T(svg, 8, 14, "Corvid-8B on 15T tokens, and the same compute spent the compute-optimal way",
        { anchor: "start", size: 11, fill: C.teal });

      y = 44;
      T(svg, 8, y, "", { anchor: "start", size: 9, fill: C.faint });
      T(svg, 260, y, "parameters", { anchor: "end", size: 9, fill: C.faint });
      T(svg, 360, y, "tokens", { anchor: "end", size: 9, fill: C.faint });
      T(svg, 520, y, "FLOPs per served token", { anchor: "end", size: 9, fill: C.faint });
      y += 22;
      [["what the field ships", N0, D0, C.teal], ["Chinchilla-optimal", NOPT, DOPT, C.orange]].forEach(function (r) {
        T(svg, 8, y, r[0], { anchor: "start", size: 10.5, fill: r[3] });
        T(svg, 260, y, bn(r[1]), { anchor: "end", size: 10.5, fill: C.text });
        T(svg, 360, y, bn(r[2]), { anchor: "end", size: 10.5, fill: C.text });
        T(svg, 520, y, (2 * r[1] / 1e9).toFixed(2) + " G", { anchor: "end", size: 10.5, fill: r[3] });
        y += 20;
      });
      T(svg, 8, y + 6, "Both cost " + CTRAIN.toExponential(3) + " FLOPs to train. The compute-optimal one is " +
        (NOPT / N0).toFixed(1) + "x more expensive on every token, forever.",
        { anchor: "start", size: 10, fill: C.faint });

      /* lifetime cost, both ways */
      var PX = 8, PY = 142, PW = 560, PH = 150, Smax = Math.pow(10, 13.4);
      function sx(s) { return PX + s / Smax * PW; }
      function sy(v) { return PY + PH - v / (CTRAIN + 2 * NOPT * Smax) * PH; }
      T(svg, PX, 124, "total FLOPs spent, training plus serving",
        { anchor: "start", size: 9, fill: C.faint });
      line(svg, PX, PY + PH, PX + PW, PY + PH, { stroke: C.line, sw: 1 });
      [[N0, C.teal, "8.03B, overtrained"], [NOPT, C.orange, "77.6B, compute-optimal"]].forEach(function (m) {
        var pts = [];
        for (i = 0; i <= 60; i++) {
          var s = i / 60 * Smax;
          pts.push(sx(s) + "," + sy(CTRAIN + 2 * m[0] * s));
        }
        S("polyline", { points: pts.join(" "), fill: "none", stroke: m[1], "stroke-width": 2 }, svg);
      });
      var bx = sx(BREAK);
      line(svg, bx, PY, bx, PY + PH, { stroke: C.pink, sw: 1.5, dash: "3 3" });
      T(svg, bx, PY - 6, "break-even", { size: 9, fill: C.pink });
      T(svg, PX, PY + PH + 14, "0 served tokens", { anchor: "start", size: 8.5, fill: C.faint });
      T(svg, PX + PW, PY + PH + 14, bn(Smax) + " served", { anchor: "end", size: 8.5, fill: C.faint });
      T(svg, PX + PW - 4, PY + 10, "8.03B, overtrained", { anchor: "end", size: 9, fill: C.teal });
      T(svg, PX + PW - 4, PY + 24, "77.6B, compute-optimal", { anchor: "end", size: 9, fill: C.orange });

      /* where you are */
      var s0 = Math.pow(10, logS), RX = 590;
      T(svg, RX, 142, "at " + bn(s0) + " served", { anchor: "start", size: 9, fill: C.faint });
      var rows = [["overtrained, total", CTRAIN + 2 * N0 * s0, C.teal],
                  ["compute-optimal, total", CTRAIN + 2 * NOPT * s0, C.orange],
                  ["difference", 2 * (NOPT - N0) * s0 - 0, C.pink]];
      y = 166;
      rows.forEach(function (r) {
        T(svg, RX, y, r[0], { anchor: "start", size: 9.5, fill: C.faint });
        T(svg, 752, y + 16, r[1].toExponential(3), { anchor: "end", size: 11, fill: r[2] });
        y += 40;
      });

      line(svg, 8, 328, 752, 328, { stroke: C.line, sw: 1 });
      T(svg, 8, 348, "Break-even at " + (BREAK / 1e12).toFixed(2) +
        " trillion served tokens: training cost " + CTRAIN.toExponential(3) + " divided by the " +
        (SAVE / 1e9).toFixed(2) + " GFLOP saved per token.",
        { anchor: "start", size: 10.5, fill: C.pink });
      wrapT(svg, 8, 372, 122, 17, "Past that point the smaller, overtrained model is not merely cheaper " +
        "to serve — it has saved more than it cost to make. Chinchilla answered its question correctly, " +
        "and almost nobody has that question.", { size: 10, fill: C.faint, max: 2 });
    }

    function renderJump() {
      var i, m;
      T(svg, 8, 14, "five-digit arithmetic, one model series, three rulers",
        { anchor: "start", size: 11, fill: C.teal });
      T(svg, 752, 14, "scoring with " + METRIC[met], { anchor: "end", size: 11, fill: C.orange });

      var PX = 48, PY = 46, PW = 440, PH = 210, lo = 8.5, hi = 12;
      function px(l) { return PX + (l - lo) / (hi - lo) * PW; }
      function py(v) { return PY + PH - v * PH; }
      line(svg, PX, PY + PH, PX + PW, PY + PH, { stroke: C.line, sw: 1 });
      line(svg, PX, PY, PX, PY + PH, { stroke: C.line, sw: 1 });
      [0, 0.5, 1].forEach(function (v) {
        T(svg, PX - 8, py(v), v.toFixed(1), { anchor: "end", size: 8.5, fill: C.faint });
      });
      [9, 10, 11, 12].forEach(function (l) {
        T(svg, px(l), PY + PH + 14, "1e" + l, { size: 8.5, fill: C.faint });
      });
      for (m = 0; m < 3; m++) {
        var pts = [];
        for (i = 0; i <= 160; i++) {
          var l = lo + i / 160 * (hi - lo);
          pts.push(px(l) + "," + py(score(l, m)));
        }
        S("polyline", { points: pts.join(" "), fill: "none",
          stroke: m === met ? C.orange : C.faint,
          "stroke-width": m === met ? 2.4 : 1, opacity: m === met ? 1 : 0.45 }, svg);
      }
      T(svg, PX + PW, PY + PH + 30, "parameters", { anchor: "end", size: 9, fill: C.faint });

      /* the numbers, at five sizes */
      var RX = 520, y = 46;
      T(svg, RX, y, "parameters", { anchor: "start", size: 9, fill: C.faint });
      T(svg, 752, y, "score", { anchor: "end", size: 9, fill: C.faint });
      y += 20;
      [9, 9.6, 10.2, 10.8, 11.6].forEach(function (l) {
        var v = score(l, met);
        T(svg, RX, y, "1e" + l.toFixed(1), { anchor: "start", size: 10.5, fill: C.dim });
        rect(svg, RX + 64, y - 6, v * 110, 12, { rx: 2, fill: C.orange, stroke: "none", op: 0.55 });
        T(svg, 752, y, (v * 100).toFixed(1) + "%", { anchor: "end", size: 10.5, fill: C.text });
        y += 22;
      });
      T(svg, RX, y + 8, "per-digit accuracy is the same curve", { anchor: "start", size: 9, fill: C.faint });
      T(svg, RX, y + 24, "in all three charts.", { anchor: "start", size: 9, fill: C.faint });

      var jump = score(10.5, 0) - score(9.9, 0), smooth = score(10.5, 1) - score(9.9, 1);
      line(svg, 8, 318, 752, 318, { stroke: C.line, sw: 1 });
      T(svg, 8, 338, "From 1e9.9 to 1e10.5 parameters: exact match moves " + (jump * 100).toFixed(0) +
        " points, partial credit " + (smooth * 100).toFixed(0) + ".",
        { anchor: "start", size: 10.5, fill: C.orange });
      wrapT(svg, 8, 362, 122, 17, "Exact match over five digits is the per-digit curve raised to the " +
        "fifth power: near zero until nearly every digit is right, then a leap. The capability improved " +
        "smoothly throughout. A sharp jump in a discontinuous metric is not evidence of a sharp change " +
        "in the model.", { size: 10, fill: C.faint, max: 3 });
    }

    function render() {
      while (svg.firstChild) svg.removeChild(svg.firstChild);
      if (tab === 0) renderBill(); else renderJump();
    }
    function say() {
      if (tab === 0) f.say("Break-even at " + (BREAK / 1e12).toFixed(2) + " trillion served tokens. " +
        "The compute-optimal model costs " + (NOPT / N0).toFixed(1) + "x more on every token it ever emits.");
      else f.say(METRIC[met] + ": 1e9.9 scores " + (score(9.9, met) * 100).toFixed(1) + "%, 1e10.5 scores " +
        (score(10.5, met) * 100).toFixed(1) + "%.");
    }

    var tT = tabs(f.controls, ["the inference bill", "the emergent jump"], 0, function (i) {
      tab = i; render(); say();
    });
    var sS = slider(f.controls, "served tokens", 11, 13.4, Math.log(BREAK) / Math.LN10, 0.1,
      function (v) { return "1e" + v.toFixed(1); },
      function (v) { logS = v; tab = 0; tT.sync(0); render(); say(); });
    var tM = tabs(f.controls, METRIC, 0, function (i) {
      met = i; tab = 1; tT.sync(1); render();
      f.say(i === 0 ? "Exact match: the answer is right or it is not, and five digits must all land."
          : i === 1 ? "Partial credit per digit: the same outputs, scored continuously. The jump is gone."
          : "Log-likelihood of the correct answer: continuous too, and equally smooth.");
    });
    f.btn("reset", function () {
      tab = 0; met = 0; logS = Math.log(BREAK) / Math.LN10;
      tT.sync(0); tM.sync(0); sS.set(Math.log(BREAK) / Math.LN10); render();
      f.say("Look at the jump. Now change the metric.");
    });

    render();
    f.say("Look at the jump. Now change the metric.");
  };


})();
