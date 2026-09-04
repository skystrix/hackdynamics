/* ==========================================================================
   viz-rag-kit.js — shared helpers for the RAG In Depth machines.

   The older js/viz*.js files each carry their own copy of these; this course
   has 42 machines across several files, so they live here once and every
   viz-rag*.js reads them off window.RAGKIT.

   The important difference from the older files: COLOURS ARE CSS CUSTOM
   PROPERTIES, not baked hex. They are applied through style rather than as
   presentation attributes (see S), so every machine follows the page between
   light and dark instead of assuming a dark background.
   ========================================================================== */

(function () {
  "use strict";

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

  window.RAGKIT = {
    NS: NS, C: C, S: S, T: T, rect: rect, line: line, defsArrow: defsArrow,
    div: div, frame: frame, slider: slider, tabs: tabs, toggle: toggle,
    tipOn: tipOn, money: money, toks: toks
  };
})();
