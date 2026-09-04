/* ==========================================================================
   viz-rag1.js — RAG In Depth machines, batch 1: the free chapters (1–4).

     ragAnatomy     ch1  Inspector   the six stages and the shared model
     contextBudget  ch2  Tuner       price a corpus against a context window
     ragOrTune      ch2  Comparator  five requirements, one verdict
     ragParadigms   ch3  Stepper     naive / advanced / modular on one question
     docPartition   ch4  Inspector   a two-column page, parsed and mis-parsed
     dedupeMinhash  ch4  Playground  MinHash estimate against exact Jaccard

   Same registry and contract as js/viz*.js: one IIFE, one function per
   machine on window.VIZ, mounted by app.js when the frame scrolls into view.

   Unlike the older viz files, colours here are CSS custom properties rather
   than baked hex, so every machine follows the page between light and dark.
   ========================================================================== */

(function () {
  "use strict";
  window.VIZ = window.VIZ || {};

  var NS = "http://www.w3.org/2000/svg";

  /* Theme-following palette. These are CSS values, not colours, so they are
     applied through style rather than as attributes (see S below). */
  var C = {
    text: "var(--text)", dim: "var(--text-dim)", faint: "var(--text-faint)",
    line: "var(--line)", panel: "var(--bg-3)", card: "var(--bg-2)",
    blue: "var(--primary)", teal: "var(--teal)", orange: "var(--orange)",
    green: "var(--green)", pink: "var(--pink)", sky: "var(--sky)",
    purple: "var(--purple)"
  };
  var PAINT = { fill: 1, stroke: 1, color: 1 };

  function S(tag, attrs, parent) {
    var e = document.createElementNS(NS, tag);
    for (var k in attrs) {
      var v = attrs[k];
      // var(--x) is not valid in a presentation attribute everywhere; style is.
      if (PAINT[k] && typeof v === "string" && v.indexOf("var(") === 0) e.style[k] = v;
      else e.setAttribute(k, v);
    }
    if (parent) parent.appendChild(e);
    return e;
  }
  function T(parent, x, y, str, opts) {
    opts = opts || {};
    var t = S("text", {
      x: x, y: y, fill: opts.fill || C.text,
      "font-size": opts.size || 12,
      "font-family": opts.mono === false ? "var(--sans)" : "ui-monospace,Menlo,monospace",
      "font-weight": opts.weight || 400,
      "text-anchor": opts.anchor || "middle",
      "dominant-baseline": opts.baseline || "middle"
    }, parent);
    t.textContent = str;
    return t;
  }
  function rect(parent, x, y, w, h, o) {
    o = o || {};
    return S("rect", {
      x: x, y: y, width: Math.max(0, w), height: Math.max(0, h), rx: o.rx == null ? 6 : o.rx,
      fill: o.fill || "none", stroke: o.stroke || C.line,
      "stroke-width": o.sw == null ? 1.5 : o.sw,
      "stroke-dasharray": o.dash || "none", opacity: o.op == null ? 1 : o.op
    }, parent);
  }
  function line(parent, x1, y1, x2, y2, o) {
    o = o || {};
    return S("line", { x1: x1, y1: y1, x2: x2, y2: y2, stroke: o.stroke || C.line,
      "stroke-width": o.sw || 1.5, "stroke-dasharray": o.dash || "none",
      "marker-end": o.arrow ? "url(#ragArrow)" : "" }, parent);
  }
  function defsArrow(svg, color) {
    var d = S("defs", {}, svg);
    var m = S("marker", { id: "ragArrow", viewBox: "0 0 10 10", refX: 9, refY: 5,
      markerWidth: 6, markerHeight: 6, orient: "auto-start-reverse" }, d);
    S("path", { d: "M 0 0 L 10 5 L 0 10 z", fill: color || C.faint }, m);
  }

  function div(cls, html) {
    var d = document.createElement("div");
    d.className = cls || "";
    if (html) d.innerHTML = html;
    return d;
  }

  function frame(el) {
    var mount = el.querySelector(".viz-mount");
    var body = div("viz-body"), controls = div("viz-controls"), note = div("viz-note");
    mount.appendChild(body); mount.appendChild(controls); mount.appendChild(note);
    return {
      body: body, controls: controls, note: note,
      btn: function (label, fn) {
        var b = document.createElement("button");
        b.type = "button"; b.textContent = label;
        b.addEventListener("click", fn);
        controls.appendChild(b);
        return b;
      },
      say: function (msg) { note.textContent = msg; }
    };
  }

  /* A labelled range control. Returns the <label> so callers can read/update. */
  function slider(parent, label, min, max, val, step, fmt, fn) {
    var l = document.createElement("label");
    l.style.cssText = "display:inline-flex;align-items:center;gap:6px;font:13px var(--mono, ui-monospace);color:var(--text-dim)";
    var span = document.createElement("span");
    span.textContent = label + " " + fmt(val);
    var s = document.createElement("input");
    s.type = "range"; s.min = min; s.max = max; s.step = step; s.value = val;
    s.setAttribute("aria-label", label);
    s.addEventListener("input", function () {
      span.textContent = label + " " + fmt(+s.value);
      fn(+s.value);
    });
    l.appendChild(span); l.appendChild(s);
    parent.appendChild(l);
    return { el: l, input: s, set: function (v) { s.value = v; span.textContent = label + " " + fmt(v); } };
  }

  /* A group of mutually exclusive buttons. */
  function tabs(parent, labels, active, fn) {
    var btns = labels.map(function (lab, i) {
      var b = document.createElement("button");
      b.type = "button"; b.textContent = lab;
      b.setAttribute("aria-pressed", i === active ? "true" : "false");
      b.addEventListener("click", function () {
        btns.forEach(function (o, j) { o.setAttribute("aria-pressed", j === i ? "true" : "false"); });
        fn(i);
      });
      parent.appendChild(b);
      return b;
    });
    var sync = function (i) {
      btns.forEach(function (o, j) { o.setAttribute("aria-pressed", j === i ? "true" : "false"); });
    };
    return { buttons: btns, sync: sync };
  }

  /* An on/off control with a visible state. */
  function toggle(parent, label, on, fn) {
    var b = document.createElement("button");
    b.type = "button";
    function paint() {
      b.textContent = (on ? "■ " : "□ ") + label;
      b.setAttribute("aria-pressed", on ? "true" : "false");
    }
    b.addEventListener("click", function () { on = !on; paint(); fn(on); });
    paint(); parent.appendChild(b);
    return { get: function () { return on; },
             set: function (v) { on = v; paint(); } };
  }

  function tipOn(node, title, bodyHtml) {
    if (!window.vizTip) return;
    function show(e) {
      var p = e.touches ? e.touches[0] : e;
      window.vizTip.show(p.clientX, p.clientY, title, bodyHtml);
    }
    node.addEventListener("mousemove", show);
    node.addEventListener("mouseleave", window.vizTip.hide);
    node.addEventListener("touchstart", function (e) { show(e); e.stopPropagation(); }, { passive: true });
    document.addEventListener("touchstart", window.vizTip.hide, { passive: true });
    node.style.cursor = "pointer";
  }

  function money(n) {
    if (n >= 1e6) return "$" + (n / 1e6).toFixed(2) + "M";
    if (n >= 1e3) return "$" + (n / 1e3).toFixed(1) + "k";
    if (n >= 10) return "$" + n.toFixed(0);
    return "$" + n.toFixed(2);
  }
  function toks(n) {
    if (n >= 1e6) return (n / 1e6).toFixed(2).replace(/\.?0+$/, "") + "M";
    if (n >= 1e3) return Math.round(n / 1e3) + "k";
    return String(n);
  }

  /* ========================================================================
     1. ragAnatomy — CH 1 — Inspector
     Two lanes sharing one embedding model. Hover a stage; trace Q1; then
     break the contract by changing the model on the query side only.
     ======================================================================== */
  VIZ.ragAnatomy = function (el) {
    var f = frame(el);
    var svg = S("svg", { viewBox: "0 0 720 360", role: "img" }, f.body);
    defsArrow(svg);

    var INGEST = [
      { k: "Load", c: C.teal,
        tip: ["Load", "<b>Consumes</b> files: PDF, HTML, Markdown, tickets, database rows.<br><b>Produces</b> clean text plus metadata: which document, which page, which section, who may read it."] },
      { k: "Chunk", c: C.teal,
        tip: ["Chunk", "<b>Consumes</b> clean text.<br><b>Produces</b> pieces small enough to match precisely and large enough to answer with. Where you cut decides what can be found."] },
      { k: "Embed & Index", c: C.teal,
        tip: ["Embed and index", "<b>Consumes</b> chunks.<br><b>Produces</b> a vector per chunk in a vector index, and usually the words in an inverted index too."] }
    ];
    var QUERY = [
      { k: "Retrieve", c: C.blue,
        tip: ["Retrieve", "<b>Consumes</b> the question as a vector.<br><b>Produces</b> the k most similar chunks, optionally merged with keyword matches and reranked."] },
      { k: "Assemble", c: C.blue,
        tip: ["Assemble", "<b>Consumes</b> the retrieved chunks.<br><b>Produces</b> one prompt: the chunks that fit the context window, in an order, with instructions and citation markers."] },
      { k: "Generate", c: C.blue,
        tip: ["Generate", "<b>Consumes</b> the assembled prompt.<br><b>Produces</b> an answer that should rest on the chunks, cite them, and refuse when they do not contain the answer."] }
    ];

    var RIGHT = [
      "Musical instruments — a cello may be carried in the cabin if an extra seat is purchased",
      "Baggage allowance, cabin — one personal item and one cabin bag",
      "Pets in the cabin — cats and small dogs in an approved carrier"
    ];
    var WRONG = [
      "Fleet — 22 Airbus A320neo and 6 A321neo, average age 4.2 years",
      "Route network — 61 routes from four bases",
      "Payment methods — Visa, Mastercard, American Express, SEPA"
    ];

    var step = 0, sameModel = true;      // step 0 = idle, 1..5 = trace stages
    var MAXSTEP = 5;

    function render() {
      svg.innerHTML = ""; defsArrow(svg);
      var bx = 30, bw = 176, gap = 22;

      T(svg, 30, 20, "INGEST — runs when documents change, nobody is waiting",
        { anchor: "start", size: 11, fill: C.teal });

      INGEST.forEach(function (s, i) {
        var x = bx + i * (bw + gap);
        var lit = step >= 1 && step <= MAXSTEP;   // ingest is always "done"
        var g = S("g", {}, svg);
        rect(g, x, 34, bw, 46, { fill: C.card, stroke: s.c, sw: 2, op: lit ? 1 : 0.9 });
        T(g, x + bw / 2, 57, s.k, { size: 13, fill: C.text, weight: 600 });
        tipOn(g, s.tip[0], s.tip[1]);
        if (i < 2) line(svg, x + bw, 57, x + bw + gap - 4, 57, { arrow: true, stroke: C.faint });
      });

      // the shared artifact
      var mx = 250, mw = 220;
      var modelName = sameModel ? "embedding model  M" : "M  (ingest)   ≠   M′ (query)";
      var g2 = S("g", {}, svg);
      rect(g2, mx, 152, mw, 44, {
        fill: C.card, stroke: sameModel ? C.orange : C.pink, sw: 2.5
      });
      T(g2, mx + mw / 2, 168, modelName, { size: 12, fill: sameModel ? C.orange : C.pink, weight: 600 });
      T(g2, mx + mw / 2, 184, sameModel ? "click to change the query side" : "click to restore the contract",
        { size: 9.5, fill: C.faint });
      g2.style.cursor = "pointer";
      g2.addEventListener("click", function () { sameModel = !sameModel; render(); update(); });
      tipOn(g2, "The contract",
        "Similarity between vectors only means anything when both came from the same model. The model that wrote the index is the only model that can read it.");

      // links from the shared model up into indexing and down into retrieval
      line(svg, mx + mw / 2, 152, mx + mw / 2, 80, { stroke: C.orange, sw: 2, dash: "4 4" });
      line(svg, mx + mw / 2, 196, mx + mw / 2, 246, {
        stroke: sameModel ? C.orange : C.pink, sw: 2, dash: "4 4"
      });
      if (!sameModel) {
        T(svg, mx + mw / 2 + 96, 214, "✘ contract broken", { size: 10, fill: C.pink });
      }

      T(svg, 30, 236, "QUERY — runs once per question, someone is watching a spinner",
        { anchor: "start", size: 11, fill: C.blue });

      QUERY.forEach(function (s, i) {
        var x = bx + i * (bw + gap);
        var active = step === i + 3;
        var done = step > i + 3;
        var g = S("g", {}, svg);
        rect(g, x, 250, bw, 46, {
          fill: active ? "var(--tint-primary)" : C.card,
          stroke: active ? C.blue : (done ? C.blue : C.line),
          sw: active ? 3 : (done ? 2 : 1.5)
        });
        T(g, x + bw / 2, 273, s.k, { size: 13, weight: active ? 700 : 600 });
        tipOn(g, s.tip[0], s.tip[1]);
        if (i < 2) line(svg, x + bw, 273, x + bw + gap - 4, 273, { arrow: true, stroke: C.faint });
      });

      // the moving question
      if (step >= 1) {
        var labels = [
          "“Can I bring my cello in the cabin?”",
          "→ a vector from " + (sameModel ? "M" : "M′"),
          "→ 3 chunks",
          "→ one prompt",
          "→ an answer with a citation"
        ];
        T(svg, 30, 320, labels[step - 1], { anchor: "start", size: 12, fill: C.text, weight: 600 });
      }
      if (step >= 3) {
        var list = sameModel ? RIGHT : WRONG;
        list.forEach(function (t, i) {
          T(svg, 30, 336 + i * 13, "[" + (i + 1) + "] " + t,
            { anchor: "start", size: 9.5, fill: sameModel ? C.green : C.pink });
        });
        svg.setAttribute("viewBox", "0 0 720 392");
      } else {
        svg.setAttribute("viewBox", "0 0 720 360");
      }
    }

    function update() {
      if (step === 0) {
        f.say(sameModel
          ? "Hover a stage to read what it consumes and produces. Press trace Q1 to push a question through."
          : "The query side now uses a different model. Press trace Q1: nothing will report an error.");
        return;
      }
      if (step < 3) { f.say("The question is being turned into a vector by the model on the query side."); return; }
      if (step === 3) {
        f.say(sameModel
          ? "Retrieve found the three chunks nearest the question. The first one answers it."
          : "Retrieve ran, returned three chunks, and reported success. They are about the fleet, the route network and payment. The cello page is not among them.");
        return;
      }
      if (step === 4) { f.say("Assemble chose which chunks fit the window, in what order, and numbered them for citation."); return; }
      f.say(sameModel
        ? "Generate answered from chunk [1] and cited it. Now click the model box and run the trace again."
        : "Generate produced a fluent, cited, wrong answer. Nothing crashed. Only the metrics of Chapter 25 would catch this.");
    }

    f.btn("trace Q1 ▸", function () { step = Math.min(MAXSTEP, step + 1); render(); update(); });
    f.btn("◂ back", function () { step = Math.max(0, step - 1); render(); update(); });
    f.btn("reset", function () { step = 0; sameModel = true; render(); update(); });
    render(); update();
  };

  /* ========================================================================
     2. contextBudget — CH 2 — Tuner
     Stuffing the whole corpus against running a retrieval stack, per month.
     ======================================================================== */
  VIZ.contextBudget = function (el) {
    var f = frame(el);
    var svg = S("svg", { viewBox: "0 0 720 344", role: "img" }, f.body);

    var corpus = 600000, ctx = 1000000, price = 2, qday = 10000;
    var RETRIEVED = 4000;        // tokens of chunks a retrieval stack sends
    var INFRA = 200;             // $/month for the index: the fixed line

    function stuffMonthly(c) { return (c / 1e6) * price * qday * 30; }
    function ragMonthly() { return INFRA + (RETRIEVED / 1e6) * price * qday * 30; }
    function crossover() {
      // corpus where stuffing/month equals retrieval/month
      var perTok = (price * qday * 30) / 1e6;
      return (INFRA + (RETRIEVED / 1e6) * price * qday * 30) / perTok;
    }

    function render() {
      svg.innerHTML = "";
      var fits = corpus <= ctx;
      var sM = stuffMonthly(corpus), rM = ragMonthly(), xo = crossover();

      // ---- the cost curve, log x
      var X0 = 60, X1 = 690, Y0 = 44, Y1 = 192;
      var loMin = Math.log10(1e4), loMax = Math.log10(4e6);
      function px(c) { return X0 + (Math.log10(c) - loMin) / (loMax - loMin) * (X1 - X0); }
      var top = Math.max(stuffMonthly(4e6), rM * 3, 1);
      function py(v) { return Y1 - Math.min(1, v / top) * (Y1 - Y0); }

      T(svg, 30, 16, "monthly bill against corpus size, at " + qday.toLocaleString() +
        " questions a day and " + money(price) + " per million input tokens",
        { anchor: "start", size: 11, fill: C.dim });
      // legend, so the curves need no inline labels to collide with
      rect(svg, 30, 24, 12, 3, { fill: C.orange, stroke: "none", rx: 1 });
      T(svg, 48, 26, "stuff the whole corpus", { anchor: "start", size: 9.5, fill: C.orange });
      rect(svg, 196, 24, 12, 3, { fill: C.green, stroke: "none", rx: 1 });
      T(svg, 214, 26, "retrieval stack, " + money(rM) + "/mo", { anchor: "start", size: 9.5, fill: C.green });
      rect(svg, 372, 21, 2, 9, { fill: C.pink, stroke: "none", rx: 0 });
      T(svg, 382, 26, "context window", { anchor: "start", size: 9.5, fill: C.pink });

      rect(svg, X0, Y0, X1 - X0, Y1 - Y0, { fill: "none", stroke: C.line, rx: 4 });

      // context-window wall
      if (ctx <= 4e6) {
        var wx = px(ctx);
        line(svg, wx, Y0, wx, Y1, { stroke: C.pink, sw: 2, dash: "5 4" });
        rect(svg, wx, Y0, X1 - wx, Y1 - Y0, { fill: "var(--tint-pink, rgba(255,100,200,.08))", stroke: "none", rx: 0 });
      }

      // stuffing line
      var d = "";
      for (var i = 0; i <= 60; i++) {
        var c = Math.pow(10, loMin + (loMax - loMin) * (i / 60));
        d += (i ? " L " : "M ") + px(c).toFixed(1) + " " + py(stuffMonthly(c)).toFixed(1);
      }
      S("path", { d: d, fill: "none", stroke: C.orange, "stroke-width": 2.5 }, svg);
      // retrieval fixed line
      line(svg, X0, py(rM), X1, py(rM), { stroke: C.green, sw: 2.5 });

      // crossover
      if (xo > 1e4 && xo < 4e6) {
        var cx = px(xo);
        S("circle", { cx: cx, cy: py(rM), r: 4, fill: C.blue }, svg);
        T(svg, cx, py(rM) - 11, "crossover " + toks(xo), { size: 9.5, fill: C.blue });
      } else if (xo <= 1e4) {
        // At this traffic the fixed cost of the index is rounding error, so the
        // crossover falls off the left edge: retrieval wins at every corpus size.
        S("circle", { cx: X0, cy: py(rM), r: 4, fill: C.blue }, svg);
        T(svg, X0 + 10, py(rM) - 11, "crossover is off the left edge at " +
          qday.toLocaleString() + " q/day: drop the traffic to bring it into view",
          { anchor: "start", size: 9.5, fill: C.blue });
      }
      // current position
      var curx = px(corpus);
      S("circle", { cx: curx, cy: py(sM), r: 5, fill: fits ? C.orange : C.pink }, svg);
      line(svg, curx, py(sM), curx, Y1, { stroke: C.faint, sw: 1, dash: "2 3" });

      [1e4, 1e5, 1e6, 4e6].forEach(function (c) {
        T(svg, px(c), Y1 + 14, toks(c), { size: 9.5, fill: C.faint });
      });

      // ---- the readout
      var y = 234;
      rect(svg, 30, y - 18, 660, 96, { fill: C.panel, stroke: C.line });
      T(svg, 46, y, fits ? "✓ the corpus fits the context window" :
        "✘ the corpus does not fit — stuffing is not available at any price",
        { anchor: "start", size: 12, fill: fits ? C.green : C.pink, weight: 700 });

      var rows = [
        ["stuff", toks(corpus) + " tokens/question",
          money((corpus / 1e6) * price) + "/question", money(sM) + "/month", fits],
        ["retrieve", toks(RETRIEVED) + " tokens/question",
          money((RETRIEVED / 1e6) * price) + "/question", money(rM) + "/month", true]
      ];
      rows.forEach(function (r, i) {
        var ry = y + 26 + i * 24;
        T(svg, 46, ry, r[0], { anchor: "start", size: 11.5, fill: r[4] ? C.text : C.faint, weight: 600 });
        T(svg, 150, ry, r[1], { anchor: "start", size: 11, fill: r[4] ? C.dim : C.faint });
        T(svg, 330, ry, r[2], { anchor: "start", size: 11, fill: r[4] ? C.dim : C.faint });
        T(svg, 480, ry, r[3], { anchor: "start", size: 12,
          fill: !r[4] ? C.faint : (i === 0 && sM > rM ? C.orange : C.green), weight: 700 });
      });
      var ratio = sM / rM;
      T(svg, 46, y + 76, fits
        ? "stuffing is " + (ratio >= 1 ? ratio.toFixed(1) + "× the retrieval bill"
                                      : (1 / ratio).toFixed(1) + "× cheaper than retrieval here")
        : "past the window the only options are retrieval or a bigger model",
        { anchor: "start", size: 11, fill: C.dim });
    }

    function say() {
      if (corpus > ctx) {
        f.say("The corpus no longer fits. Stuffing has stopped being a strategy, not become an expensive one.");
      } else if (stuffMonthly(corpus) > ragMonthly()) {
        f.say(crossover() <= 1e4
          ? "Stuffing costs more at every corpus size on this chart. Drop q/day to 100 and the crossover walks back into view."
          : "Stuffing costs more than the retrieval stack here. Drag the corpus down to find the crossover.");
      } else {
        f.say("Below the crossover, stuffing is cheaper and you should not build an index. Drag the corpus up.");
      }
    }
    function upd() { render(); say(); }

    function build() {
      slider(f.controls, "corpus", 10000, 4000000, corpus, 10000, toks, function (v) { corpus = v; upd(); });
      slider(f.controls, "context", 8000, 2000000, ctx, 8000, toks, function (v) { ctx = v; upd(); });
      slider(f.controls, "$/M", 0.25, 15, price, 0.25, function (v) { return "$" + v.toFixed(2); },
        function (v) { price = v; upd(); });
      slider(f.controls, "q/day", 100, 100000, qday, 100,
        function (v) { return v >= 1000 ? Math.round(v / 1000) + "k" : String(v); },
        function (v) { qday = v; upd(); });
      f.btn("reset", function () {
        corpus = 600000; ctx = 1000000; price = 2; qday = 10000;
        f.controls.innerHTML = ""; build(); upd();
      });
      upd();
    }
    build();
    f.say("Set the corpus to 600k and the context to 1M: it fits. Now raise questions per day and watch the bill.");
  };

  /* ========================================================================
     3. ragOrTune — CH 2 — Comparator
     Five requirements; the verdict names the axis that decided it.
     ======================================================================== */
  VIZ.ragOrTune = function (el) {
    var f = frame(el);
    var svg = S("svg", { viewBox: "0 0 720 300", role: "img" }, f.body);

    var req = { fresh: false, cite: false, perms: false, style: false, cheap: false };

    // The procedure from the chapter, in order. First match wins.
    function verdict() {
      if (req.perms) return {
        axis: "Access control", tool: "Retrieval",
        why: "Fine-tuning pours every document into one set of weights that every user queries. There is no per-user view into a weight, so this axis alone rules fine-tuning out.",
        kills: "fine-tune" };
      if (req.cite) return {
        axis: "Traceability", tool: "Retrieval",
        why: "Only retrieval has a document in hand to cite. A fine-tuned model can be trained to emit citation-shaped text, which is worse than none.",
        kills: "fine-tune" };
      if (req.fresh) return {
        axis: "Freshness", tool: "Retrieval",
        why: "The index can be updated without touching the model. Fine-tuning is a training run, and a nightly one is a budget most teams do not have.",
        kills: "fine-tune" };
      if (req.style) return {
        axis: "Style and format", tool: "Fine-tuning, plus retrieval for facts",
        why: "You cannot retrieve a tone. Fine-tune for the voice or the schema and keep retrieving for the facts; the two are not exclusive.",
        kills: null };
      if (req.cheap) return {
        axis: "Cost", tool: "Stuff the prompt",
        why: "The corpus is small and static, nobody needs a citation, and everyone sees the same documents. Do not build an index for this.",
        kills: null };
      return {
        axis: "—", tool: "Stuff the prompt",
        why: "Nothing here forces a choice. With no constraints, the simplest thing that works is the prompt itself.",
        kills: null };
    }

    var AXES = [
      ["Freshness", "fresh", "changes daily"],
      ["Traceability", "cite", "must cite a source"],
      ["Access control", "perms", "per-user permissions"],
      ["Style / format", "style", "house voice or schema"],
      ["Cost", "cheap", "tiny budget, small corpus"]
    ];
    var TOOLS = ["Retrieval", "Fine-tuning", "Stuffing"];
    // can each tool satisfy each axis?
    var CAN = {
      Freshness:        [true, false, true],
      Traceability:     [true, false, true],
      "Access control": [true, false, false],
      "Style / format": [false, true, false],
      Cost:             [true, false, false]
    };

    function render() {
      svg.innerHTML = "";
      var v = verdict();
      var x0 = 190, cw = 150, y0 = 54, rh = 34;

      T(svg, 30, 22, "five axes, three tools — a filled cell is a requirement the tool can meet",
        { anchor: "start", size: 11, fill: C.dim });

      TOOLS.forEach(function (t, j) {
        T(svg, x0 + j * cw + cw / 2, 42, t, { size: 12, weight: 700,
          fill: v.tool.indexOf(t) === 0 ? C.green : C.dim });
      });

      AXES.forEach(function (a, i) {
        var y = y0 + i * rh, on = req[a[1]], deciding = on && v.axis === a[0];
        if (deciding) rect(svg, 28, y - 1, 662, rh, { fill: "var(--tint-primary)", stroke: C.blue, sw: 2 });
        T(svg, 34, y + rh / 2 - 5, a[0], { anchor: "start", size: 11.5,
          fill: on ? C.text : C.faint, weight: on ? 700 : 400 });
        T(svg, 34, y + rh / 2 + 9, a[2], { anchor: "start", size: 9, fill: C.faint });

        TOOLS.forEach(function (t, j) {
          var ok = CAN[a[0]][j];
          var cx = x0 + j * cw + cw / 2;
          if (ok) {
            S("circle", { cx: cx, cy: y + rh / 2, r: on ? 8 : 5,
              fill: on ? C.green : C.line }, svg);
          } else {
            T(svg, cx, y + rh / 2, "✘", { size: on ? 15 : 12, fill: on ? C.pink : C.faint });
          }
        });
      });

      var vy = y0 + AXES.length * rh + 14;
      rect(svg, 28, vy, 662, 66, { fill: C.panel, stroke: C.line });
      T(svg, 44, vy + 20, "verdict: " + v.tool, { anchor: "start", size: 14, weight: 700, fill: C.green });
      T(svg, 44, vy + 40, v.axis === "—" ? "no axis forces anything" : "decided by: " + v.axis,
        { anchor: "start", size: 11, fill: C.blue, weight: 600 });
      // wrap the reason
      var words = v.why.split(" "), lines = [""], max = 92;
      words.forEach(function (w) {
        var last = lines[lines.length - 1];
        if ((last + " " + w).trim().length > max) lines.push(w);
        else lines[lines.length - 1] = (last + " " + w).trim();
      });
      lines.slice(0, 2).forEach(function (ln, i) {
        T(svg, 44, vy + 56 + i * 12, ln, { anchor: "start", size: 9.5, fill: C.dim });
      });
      svg.setAttribute("viewBox", "0 0 720 " + (vy + 92));
    }

    function say() {
      var v = verdict();
      if (req.perms && !req.cite && !req.fresh && !req.style && !req.cheap) {
        f.say("Access control alone. Fine-tuning is not expensive here, it is impossible: there is no per-user view into a weight.");
      } else if (v.axis === "—") {
        f.say("Nothing is switched on, so nothing is forced. Turn on per-user permissions by itself and watch a whole column die.");
      } else {
        f.say("Decided by " + v.axis + ". The verdict changes only when a higher axis in the procedure turns on.");
      }
    }

    function buildControls() {
      AXES.forEach(function (a) {
        toggle(f.controls, a[2], req[a[1]], function (on) { req[a[1]] = on; render(); say(); });
      });
      f.btn("reset", function () {
        for (var k in req) req[k] = false;
        f.controls.innerHTML = ""; buildControls(); render(); say();
      });
    }
    buildControls();
    render();
    f.say("Flip requirements. The verdict explains itself. Start with per-user permissions, alone.");
  };

  /* ========================================================================
     4. ragParadigms — CH 3 — Stepper
     One question through three generations of pipeline.
     ======================================================================== */
  VIZ.ragParadigms = function (el) {
    var f = frame(el);
    var svg = S("svg", { viewBox: "0 0 720 320", role: "img" }, f.body);

    var QUESTIONS = [
      { id: "Q2", text: "I couldn't take my flight, how do I get my money back?",
        kind: "paraphrase" },
      { id: "Q3", text: "How many refund tickets were opened in March?", kind: "count" }
    ];
    var qi = 0, mode = 0, step = 0;

    // stage lists per paradigm; `added` marks what that generation introduced
    function stages() {
      var q = QUESTIONS[qi];
      if (mode === 0) return [
        { k: "Retrieve", added: false,
          out: q.kind === "paraphrase"
            ? "top chunk: FAQ, “money back guarantees” on ancillary purchases"
            : "top chunk: a ticket that mentions March",
          bad: true,
          note: "Naive RAG is index, retrieve, generate. Retrieval has poor precision and recall: it fetches what looks like the question." },
        { k: "Generate", added: false,
          out: q.kind === "paraphrase"
            ? "a fluent answer about ancillary refunds — wrong policy"
            : "a number invented from three sampled tickets",
          bad: true,
          note: "Generation hallucinates over the chunks it was given. Nothing in the pipeline can notice." }
      ];
      if (mode === 1) return [
        { k: "Rewrite", added: true,
          out: q.kind === "paraphrase"
            ? "“refund and cancellation policy, non-refundable fare”"
            : "“count of refund tickets opened in March”",
          bad: false,
          note: "Pre-retrieval. The query is turned into the vocabulary of the document instead of the vocabulary of the user." },
        { k: "Retrieve", added: false,
          out: q.kind === "paraphrase"
            ? "the fare rules page is now in the candidate set"
            : "still only tickets: no chunk holds a count",
          bad: q.kind === "count",
          note: "The same retriever, given a better query." },
        { k: "Rerank", added: true,
          out: q.kind === "paraphrase"
            ? "fare rules and cancellation → rank 1"
            : "a ticket → rank 1, and it still answers nothing",
          bad: q.kind === "count",
          note: "Post-retrieval. Reorder so the best chunks sit where the model reads them, and drop near-duplicates." },
        { k: "Generate", added: false,
          out: q.kind === "paraphrase"
            ? "the right policy, cited"
            : "a confident wrong number",
          bad: q.kind === "count",
          note: q.kind === "paraphrase"
            ? "Advanced RAG fixed the paraphrase miss. It is still a straight line."
            : "A longer straight line cannot answer a question whose answer is not in any chunk." }
      ];
      return [
        { k: "Route", added: true,
          out: q.kind === "paraphrase" ? "→ the text retriever" : "→ the SQL module, not the index",
          bad: false,
          note: "Modular RAG makes the line a graph. A router sends the question to the module that can answer it." },
        { k: q.kind === "paraphrase" ? "Rewrite + Retrieve" : "Text to SQL", added: q.kind === "count",
          out: q.kind === "paraphrase"
            ? "fare rules and cancellation → rank 1"
            : "SELECT COUNT(*) FROM tickets WHERE category='refund' AND …",
          bad: false,
          note: q.kind === "paraphrase"
            ? "The same advanced pipeline, chosen for this question."
            : "The right machine writes a query. Retrieving similar-looking chunks and asking a model to count them was the wrong machine." },
        { k: "Generate", added: false,
          out: q.kind === "paraphrase" ? "the right policy, cited" : "12, from the table",
          bad: false,
          note: "Both questions answered, by different routes. This is where Part III ends up." }
      ];
    }

    function render() {
      svg.innerHTML = ""; defsArrow(svg);
      var st = stages(), n = st.length;
      var q = QUESTIONS[qi];

      T(svg, 30, 20, q.id + ": “" + q.text + "”",
        { anchor: "start", size: 12, fill: C.text, weight: 600 });
      T(svg, 30, 38, ["naive — retrieve, read", "advanced — a stage before and a stage after",
        "modular — the line becomes a graph"][mode],
        { anchor: "start", size: 10.5, fill: C.dim });

      var bw = Math.min(160, (660 - (n - 1) * 18) / n), gap = 18;
      var totalW = n * bw + (n - 1) * gap, x0 = (720 - totalW) / 2;

      st.forEach(function (s, i) {
        var x = x0 + i * (bw + gap), active = step === i + 1, done = step > i + 1;
        var col = s.added ? C.orange : C.blue;
        var g = S("g", {}, svg);
        rect(g, x, 58, bw, 44, {
          fill: active ? "var(--tint-primary)" : C.card,
          stroke: active || done ? col : C.line, sw: active ? 3 : (done ? 2 : 1.5)
        });
        T(g, x + bw / 2, 74, s.k, { size: 12, weight: 700, fill: active || done ? C.text : C.dim });
        if (s.added) T(g, x + bw / 2, 91, "added here", { size: 8.5, fill: C.orange });
        if (i < n - 1) line(svg, x + bw, 80, x + bw + gap - 4, 80, { arrow: true, stroke: C.faint });
      });

      if (step >= 1) {
        var s = st[step - 1];
        rect(svg, 30, 122, 660, 76, {
          fill: C.panel, stroke: s.bad ? C.pink : C.green, sw: 2
        });
        T(svg, 46, 144, (s.bad ? "✘ " : "✓ ") + s.k,
          { anchor: "start", size: 12.5, weight: 700, fill: s.bad ? C.pink : C.green });
        T(svg, 46, 164, s.out, { anchor: "start", size: 11, fill: C.text });
        var words = s.note.split(" "), lines = [""], max = 96;
        words.forEach(function (w) {
          var last = lines[lines.length - 1];
          if ((last + " " + w).trim().length > max) lines.push(w); else lines[lines.length - 1] = (last + " " + w).trim();
        });
        lines.slice(0, 2).forEach(function (ln, i) {
          T(svg, 46, 182 + i * 12, ln, { anchor: "start", size: 9.5, fill: C.dim });
        });
      } else {
        T(svg, 360, 160, "press step to run " + q.id + " through this pipeline",
          { size: 11, fill: C.faint });
      }
      svg.setAttribute("viewBox", "0 0 720 " + (step >= 1 ? 212 : 190));
    }

    function say() {
      var st = stages();
      if (step === 0) { f.say("Step " + QUESTIONS[qi].id + " through this paradigm one stage at a time."); return; }
      if (step >= st.length) {
        if (mode === 0) f.say("Naive RAG fetched what looked like the question and answered from it. Switch to advanced.");
        else if (mode === 1 && qi === 1) f.say("Advanced RAG is a longer straight line. No stage on it can count. Switch to modular.");
        else if (mode === 1) f.say("The rewrite fixed the paraphrase miss and the reranker put the policy first. Now try Q3.");
        else f.say("The router chose the module that could answer. That routing decision is where Part III ends up.");
        return;
      }
      f.say(st[step - 1].k + ": " + (st[step - 1].bad ? "this stage did not help." : "this stage moved the answer closer."));
    }

    var qTabs, mTabs;
    function controls() {
      f.controls.innerHTML = "";
      mTabs = tabs(f.controls, ["naive", "advanced", "modular"], mode, function (i) {
        mode = i; step = 0; render(); say();
      });
      var sep = document.createElement("span");
      sep.style.cssText = "width:10px;display:inline-block";
      f.controls.appendChild(sep);
      qTabs = tabs(f.controls, ["Q2 refund", "Q3 count"], qi, function (i) {
        qi = i; step = 0; render(); say();
      });
      f.btn("step ▸", function () { step = Math.min(stages().length, step + 1); render(); say(); });
      f.btn("◂ back", function () { step = Math.max(0, step - 1); render(); say(); });
      f.btn("reset", function () { mode = 0; qi = 0; step = 0; controls(); render(); say(); });
    }
    controls(); render();
    f.say("Step Q2 through naive RAG first. Watch it fetch the wrong page.");
  };

  /* ========================================================================
     5. docPartition — CH 4 — Inspector
     A two-column page: parsed into elements, or flattened line by line.
     ======================================================================== */
  VIZ.docPartition = function (el) {
    var f = frame(el);
    var svg = S("svg", { viewBox: "0 0 720 430", role: "img" }, f.body);

    // The page. Left and right columns are line-aligned, which is what makes
    // naive extraction interleave them.
    var LEFT = [
      "Musical instruments. A cello,",
      "double bass or guitar may be",
      "carried in the cabin if an extra",
      "seat is purchased at the",
      "applicable adult fare."
    ];
    var RIGHT = [
      "Dangerous goods. Spare lithium",
      "batteries above 100 Wh are",
      "carried in the cabin only with",
      "prior approval and must be",
      "individually protected."
    ];
    var REGIONS = [
      { id: "header", type: "Header", x: 40, y: 40, w: 300, h: 18,
        text: "Larkspur Airlines · Confidential",
        meta: "page 12 · repeated on every page · drop before chunking" },
      { id: "title", type: "Title", x: 40, y: 64, w: 300, h: 24,
        text: "Conditions of Carriage — Cabin Baggage",
        meta: "page 12 · parent of every element below it" },
      { id: "left", type: "NarrativeText", x: 38, y: 96, w: 152, h: 84,
        text: LEFT.join(" "), meta: "page 12 · column 1 · parent: the Title above" },
      { id: "right", type: "NarrativeText", x: 194, y: 96, w: 152, h: 84,
        text: RIGHT.join(" "), meta: "page 12 · column 2 · parent: the Title above" },
      { id: "table", type: "Table", x: 40, y: 188, w: 300, h: 44,
        text: "instrument | cabin | hold\ncello | extra seat | yes\nguitar | extra seat | yes",
        meta: "page 12 · keep as a table, not as flattened prose (chapter 4)" },
      { id: "pageno", type: "PageNumber", x: 40, y: 240, w: 300, h: 16,
        text: "12", meta: "page 12 · boilerplate · drop before chunking" }
    ];

    var naive = false, order = false, sel = "left";

    function render() {
      svg.innerHTML = "";
      T(svg, 30, 20, naive ? "naive extraction — one pass, line by line, across the whole page width"
                           : "element-typed parsing — regions with a type, a parent, and metadata",
        { anchor: "start", size: 11, fill: naive ? C.pink : C.teal, weight: 600 });

      // the page
      rect(svg, 30, 32, 320, 232, { fill: C.card, stroke: C.line, rx: 4 });
      REGIONS.forEach(function (r, i) {
        var isSel = sel === r.id;
        var g = S("g", {}, svg);
        rect(g, r.x, r.y, r.w, r.h, {
          fill: isSel ? "var(--tint-primary)" : "none",
          stroke: naive ? C.faint : (isSel ? C.blue : C.teal),
          sw: isSel ? 2.5 : 1.2, dash: naive ? "3 3" : "none", rx: 3
        });
        var lines = r.id === "left" ? LEFT : r.id === "right" ? RIGHT
          : r.id === "table" ? r.text.split("\n") : [r.text];
        lines.forEach(function (ln, k) {
          T(g, r.x + 4, r.y + 10 + k * (r.id === "left" || r.id === "right" ? 16 : 13), ln,
            { anchor: "start", size: r.id === "title" ? 10 : 7.5,
              fill: r.id === "header" || r.id === "pageno" ? C.faint : C.text,
              weight: r.id === "title" ? 700 : 400 });
        });
        if (order && !naive) {
          S("circle", { cx: r.x - 8, cy: r.y + 8, r: 8, fill: C.orange }, svg);
          T(svg, r.x - 8, r.y + 8, String(i + 1), { size: 9, fill: "var(--on-primary)", weight: 700 });
        }
        g.style.cursor = "pointer";
        g.addEventListener("click", function () { sel = r.id; render(); saySel(); });
      });

      // the readout
      var r = REGIONS.filter(function (x) { return x.id === sel; })[0];
      rect(svg, 366, 32, 324, 232, { fill: C.panel, stroke: C.line });
      T(svg, 380, 52, naive ? "there are no elements in naive mode" : r.type,
        { anchor: "start", size: 13, weight: 700, fill: naive ? C.pink : C.teal });
      if (!naive) {
        var words = r.text.replace(/\n/g, " · ").split(" "), lines = [""], max = 44;
        words.forEach(function (w) {
          var last = lines[lines.length - 1];
          if ((last + " " + w).trim().length > max) lines.push(w); else lines[lines.length - 1] = (last + " " + w).trim();
        });
        lines.slice(0, 6).forEach(function (ln, i) {
          T(svg, 380, 74 + i * 14, ln, { anchor: "start", size: 10, fill: C.text });
        });
        T(svg, 380, 180, "metadata", { anchor: "start", size: 10, fill: C.faint, weight: 700 });
        T(svg, 380, 196, r.meta, { anchor: "start", size: 9, fill: C.dim });
        T(svg, 380, 232, "click another region of the page", { anchor: "start", size: 9.5, fill: C.faint });
      } else {
        T(svg, 380, 74, "A naive extractor reads glyphs in the order the",
          { anchor: "start", size: 10, fill: C.dim });
        T(svg, 380, 88, "PDF drew them, left to right across the whole",
          { anchor: "start", size: 10, fill: C.dim });
        T(svg, 380, 102, "page. There is no column object to respect.",
          { anchor: "start", size: 10, fill: C.dim });
        T(svg, 380, 130, "Read the output below.", { anchor: "start", size: 10, fill: C.pink, weight: 700 });
      }

      // the extracted text
      var oy = 280;
      T(svg, 30, oy - 8, "what reaches the chunker", { anchor: "start", size: 10.5, fill: C.faint, weight: 700 });
      rect(svg, 30, oy, 660, 132, { fill: C.panel, stroke: naive ? C.pink : C.teal, sw: 1.5 });
      if (!naive) {
        T(svg, 44, oy + 20, "✓ Musical instruments. A cello, double bass or guitar may be carried in the",
          { anchor: "start", size: 10.5, fill: C.green });
        T(svg, 44, oy + 36, "   cabin if an extra seat is purchased at the applicable adult fare.",
          { anchor: "start", size: 10.5, fill: C.green });
        T(svg, 44, oy + 60, "One element, one sentence, intact. This is Larkspur Q1's answer, and it is",
          { anchor: "start", size: 10, fill: C.dim });
        T(svg, 44, oy + 74, "findable because it survived as a sentence.", { anchor: "start", size: 10, fill: C.dim });
        T(svg, 44, oy + 100, "Now switch on naive extraction and read this box again.",
          { anchor: "start", size: 10, fill: C.orange, weight: 600 });
      } else {
        LEFT.forEach(function (ln, i) {
          T(svg, 44, oy + 18 + i * 15, ln + "  " + RIGHT[i],
            { anchor: "start", size: 9.5, fill: C.text });
        });
        T(svg, 44, oy + 104, "The cello sentence no longer exists. Every line of column 1 is glued to a line",
          { anchor: "start", size: 10, fill: C.pink });
        T(svg, 44, oy + 118, "of column 2, about lithium batteries. No retriever in this course can find it.",
          { anchor: "start", size: 10, fill: C.pink });
      }
    }

    function saySel() {
      if (naive) { f.say("In naive mode there are no regions to inspect: the page is one stream of lines."); return; }
      var r = REGIONS.filter(function (x) { return x.id === sel; })[0];
      f.say(r.type + ". " + (r.id === "header" || r.id === "pageno"
        ? "Boilerplate: drop it by element type before chunking, or every chunk starts with it."
        : r.id === "table" ? "A table stays a table. Flattened into prose it answers nothing."
        : "Narrative text, with a parent title, so the chunk knows which section it sits under."));
    }

    function build() {
      f.controls.innerHTML = "";
      toggle(f.controls, "naive extraction", naive, function (v) {
        naive = v; render();
        f.say(v ? "Read the output box. Find the sentence that was cut across the two columns."
                : "Elements are back. Each region carries a type, a parent and metadata.");
      });
      toggle(f.controls, "reading order", order, function (v) { order = v; render(); });
      f.btn("reset", function () { naive = false; order = false; sel = "left"; build(); render(); init(); });
    }
    function init() {
      f.say("Click any region of the page. Then toggle naive extraction and read the cello paragraph again.");
    }
    build(); render(); init();
  };

  /* ========================================================================
     6. dedupeMinhash — CH 4 — Playground
     MinHash against exact Jaccard on word shingles.
     ======================================================================== */
  VIZ.dedupeMinhash = function (el) {
    var f = frame(el);
    var wrap = div("");
    wrap.style.cssText = "display:flex;gap:10px;flex-wrap:wrap;margin-bottom:10px";
    f.body.appendChild(wrap);

    // ~200 words. The length matters: on a short page a one-word edit moves the
    // Jaccard a long way, and the chapter's discovery (stays above 0.9) needs a
    // document long enough that five broken shingles are a small fraction.
    var BASE = "Fare rules and cancellation. Tickets in fare classes L, K and T are " +
      "non-refundable. Where a booking is cancelled by the passenger more than twenty four " +
      "hours after purchase, the fare is retained and issued as a travel credit valid for " +
      "twelve months from the date of issue. Government taxes and airport charges are " +
      "returned to the original form of payment on request, less an administration fee of " +
      "fifteen euro per passenger. A travel credit is held against the booking reference, " +
      "may be used for any Larkspur flight, may be used in parts, and cannot be exchanged " +
      "for cash. Tickets in fare classes Y and B may be cancelled at any time before " +
      "departure and the fare returned to the original form of payment within seven working " +
      "days. A passenger who does not present for a flight and has not cancelled in advance " +
      "forfeits the value of that sector, including on flexible fares. Paid extras such as " +
      "priority boarding, lounge access and excess baggage are refundable only where the " +
      "flight itself was cancelled by Larkspur. Where Larkspur cancels a flight, the " +
      "passenger may choose rerouting on the next available service or reimbursement of the " +
      "ticket at the price paid within seven days.";
    var a = BASE, b = BASE;
    var k = 5, hashes = 100;

    function mkArea(val, onInput, label) {
      var box = document.createElement("div");
      box.style.cssText = "flex:1 1 260px;min-width:220px";
      var lab = document.createElement("div");
      lab.textContent = label;
      lab.style.cssText = "font:11px var(--mono,ui-monospace);color:var(--text-faint);margin-bottom:4px";
      var ta = document.createElement("textarea");
      ta.value = val; ta.rows = 5;
      ta.setAttribute("aria-label", label);
      ta.style.cssText = "width:100%;box-sizing:border-box;font:12px/1.5 var(--mono,ui-monospace);" +
        "background:var(--bg-3);color:var(--text);border:1px solid var(--line);border-radius:6px;padding:8px;resize:vertical";
      ta.addEventListener("input", function () { onInput(ta.value); });
      box.appendChild(lab); box.appendChild(ta);
      wrap.appendChild(box);
      return ta;
    }
    var taA = mkArea(a, function (v) { a = v; render(); }, "document A (the copy already indexed)");
    var taB = mkArea(b, function (v) { b = v; render(); }, "document B (edit me)");

    var svg = S("svg", { viewBox: "0 0 720 206", role: "img" }, f.body);

    function shingles(text, size) {
      var w = text.toLowerCase().replace(/[^a-z0-9\s]/g, " ").split(/\s+/).filter(Boolean);
      var out = {};
      for (var i = 0; i + size <= w.length; i++) out[w.slice(i, i + size).join(" ")] = 1;
      return Object.keys(out);
    }
    // A small deterministic string hash, then h independent variants of it.
    function h32(s, seed) {
      var x = seed >>> 0;
      for (var i = 0; i < s.length; i++) {
        x ^= s.charCodeAt(i);
        x = Math.imul(x, 16777619) >>> 0;
      }
      x ^= x >>> 13; x = Math.imul(x, 2246822507) >>> 0; x ^= x >>> 16;
      return x >>> 0;
    }
    function signature(sh, n) {
      var sig = new Array(n).fill(0xFFFFFFFF);
      for (var j = 0; j < n; j++) {
        var seed = 2166136261 + j * 0x9E3779B1;
        for (var i = 0; i < sh.length; i++) {
          var v = h32(sh[i], seed);
          if (v < sig[j]) sig[j] = v;
        }
      }
      return sig;
    }
    function exactJaccard(A, B) {
      if (!A.length && !B.length) return 1;
      var sa = {}; A.forEach(function (x) { sa[x] = 1; });
      var inter = 0, sb = {};
      B.forEach(function (x) { sb[x] = 1; if (sa[x]) inter++; });
      var uni = Object.keys(sa).length + Object.keys(sb).length - inter;
      return uni ? inter / uni : 1;
    }

    function render() {
      svg.innerHTML = "";
      var A = shingles(a, k), B = shingles(b, k);
      var exact = exactJaccard(A, B);
      var sigA = signature(A, hashes), sigB = signature(B, hashes);
      var agree = 0;
      for (var i = 0; i < hashes; i++) if (sigA[i] === sigB[i]) agree++;
      var est = hashes ? agree / hashes : 0;
      var err = Math.abs(est - exact);

      T(svg, 30, 18, "k = " + k + " word shingles · " + hashes + " hash functions · " +
        A.length + " and " + B.length + " shingles",
        { anchor: "start", size: 11, fill: C.dim });

      // two bars
      var X0 = 150, W = 470;
      [["exact Jaccard", exact, C.teal, 48], ["MinHash estimate", est, C.orange, 84]].forEach(function (r) {
        T(svg, 34, r[3] + 9, r[0], { anchor: "start", size: 11, fill: C.text });
        rect(svg, X0, r[3], W, 18, { fill: C.panel, stroke: C.line, rx: 4 });
        rect(svg, X0, r[3], W * r[1], 18, { fill: r[2], stroke: "none", rx: 4 });
        T(svg, X0 + W + 34, r[3] + 9, r[1].toFixed(3), { size: 12, fill: r[2], weight: 700 });
      });

      T(svg, 34, 122, "error", { anchor: "start", size: 11, fill: C.text });
      T(svg, X0, 122, err.toFixed(3) + (hashes < 40 ? "   — few hashes, noisy estimate" : ""),
        { anchor: "start", size: 11, fill: err > 0.08 ? C.pink : C.green, weight: 600 });

      // the signature strip: which positions agree
      T(svg, 34, 150, "signature", { anchor: "start", size: 11, fill: C.text });
      var sw = Math.min(6, W / hashes);
      for (var j = 0; j < hashes; j++) {
        rect(svg, X0 + j * (W / hashes), 143, Math.max(1.5, sw - 1), 14, {
          fill: sigA[j] === sigB[j] ? C.green : C.pink, stroke: "none", rx: 1
        });
      }
      T(svg, X0 + W + 34, 150, agree + "/" + hashes, { size: 11, fill: C.dim });
      T(svg, 34, 178, "Each green column is a hash function whose minimum matched.",
        { anchor: "start", size: 9.5, fill: C.faint });
      T(svg, 34, 192, "The fraction that match is the estimate, with no pairwise comparison of shingles at all.",
        { anchor: "start", size: 9.5, fill: C.faint });

      // Noise first: at a small signature size that is the thing to notice,
      // whatever the documents happen to be.
      if (hashes < 40) {
        f.say("With only " + hashes + " hashes the estimate is off by " + err.toFixed(3) +
          ". Fewer hash functions, noisier estimate: that is the trade the signature size makes.");
      } else if (exact > 0.9 && exact < 1) {
        f.say("Still above 0.9. A one-word edit barely moves the Jaccard of a long document, which is why near-duplicates need a threshold and not equality.");
      } else if (exact === 1) {
        f.say("Identical. Edit the right-hand text: change one word first, then a whole sentence.");
      } else {
        f.say("Jaccard " + exact.toFixed(2) + ". The estimate tracks it without ever comparing the two shingle sets.");
      }
    }

    function build() {
      f.controls.innerHTML = "";
      slider(f.controls, "k", 2, 9, k, 1, String, function (v) { k = v; render(); });
      slider(f.controls, "hashes", 10, 200, hashes, 10, String, function (v) { hashes = v; render(); });
      f.btn("one-word edit", function () {
        b = BASE.replace("twelve months", "eighteen months");
        taB.value = b; render();
      });
      f.btn("one-sentence edit", function () {
        b = BASE.replace(
          "A passenger who does not present for a flight and has not cancelled in advance " +
          "forfeits the value of that sector, including on flexible fares.",
          "Passengers who miss a flight may request a partial credit at the discretion of " +
          "the airline, subject to a review of the booking and any applicable service fee.");
        taB.value = b; render();
      });
      f.btn("reset", function () {
        a = b = BASE; k = 5; hashes = 100;
        taA.value = a; taB.value = b; build(); render();
      });
    }
    build(); render();
    f.say("Edit the right-hand text. The estimate tracks the true Jaccard. Start with a one-word edit.");
  };
})();
