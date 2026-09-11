/* ==========================================================================
   viz-llm1.js — LLM In Depth machines, batch 1: chapters 1–5.

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
      T(svg, PX1, PY1 + 32, "sequence length n", { anchor: "end", size: 10, fill: C.faint });

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
        line(svg, px(ce), by, px(ce), PY1, { stroke: C.orange, sw: 0.9, dash: "3 3" });
        T(svg, px(ce), PY1 - 8, "n = " + commas(Math.round(cx)),
          { size: 9.5, fill: C.orange });
      }

      /* --- the learner's current point --- */
      var cxp = px(eN), cyp = py(gb(b));
      S("circle", { cx: cxp, cy: cyp, r: 5.5, fill: over ? C.pink : C.blue }, svg);
      // Beside the point, never above it: above puts the label on the 16 GB
      // dashed line exactly when the reading matters most.
      var right = cxp > PX1 - 90;
      T(svg, right ? cxp - 11 : cxp + 11, cyp, fmtBytes(b),
        { size: 10.5, anchor: right ? "end" : "start", fill: over ? C.pink : C.blue });

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
})();
