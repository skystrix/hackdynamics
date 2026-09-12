/* ==========================================================================
   viz-llm1.js — LLM In Depth machines, batch 1: chapters 1–5.

     llmNextToken   ch1  Playground real measured distributions; confidence is context
     llmBpeTrainer  ch2  Builder    byte-pair encoding, trained live, merge by merge
     llmVocabTradeoff ch2 Tuner     three costs that move against each other
     llmTokenizerCompare ch2 Comparator one text, three real encodings, measured
     llmChatTemplate ch3 Stepper    a conversation flattened, then broken on purpose
     llmTokenBoundaries ch3 Playground tokens with ids, and the classic traps flagged
     llmEmbeddingSpace ch4 Playground real GPT-2 rows, three metrics, one Gram matrix
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
    function hash32(s) {
      var h = 2166136261 >>> 0;
      for (var i = 0; i < s.length; i++) {
        h ^= s.charCodeAt(i); h = Math.imul(h, 16777619) >>> 0;
      }
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
    function gauss(r) {           // Box-Muller: unit-variance components
      var u = 1 - r(), v = r();
      return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
    }
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

    function hash32(s) {
      var h = 2166136261 >>> 0;
      for (var i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619) >>> 0; }
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
    function gauss(r) { var u = 1 - r(), v = r(); return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v); }
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

})();
