/* ==========================================================================
   viz-llm1.js — LLM In Depth machines, batch 1: chapters 1–5.

     llmAttention   ch5  Inspector  one head, clickable queries, the divisor toggle

   Helpers come from js/viz-rag-kit.js, which must load first. The kit is
   course-neutral (SVG builders and a theme-following palette), so this course
   reads it rather than shipping a second copy under a different name.
   ========================================================================== */

(function () {
  "use strict";
  window.VIZ = window.VIZ || {};
  var K = window.RAGKIT;
  var C = K.C, S = K.S, T = K.T, rect = K.rect, line = K.line,
      frame = K.frame, toggle = K.toggle, tipOn = K.tipOn;

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
})();
