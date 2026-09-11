/* ==========================================================================
   viz-llm1.js — LLM In Depth machines, batch 1: chapters 1–5.

     llmNextToken   ch1  Playground real measured distributions; confidence is context
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
      frame = K.frame, toggle = K.toggle, tipOn = K.tipOn, slider = K.slider;

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
})();
