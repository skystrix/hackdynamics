/* ==========================================================================
   viz4.js — visualizations for the classic CS-curriculum chapters
   normalize   — decompose an anomaly-ridden table through 1NF→2NF→3NF
   sqlpipeline — step a SELECT through its LOGICAL evaluation order
   schedgraph  — build a precedence graph from a schedule, test for cycles
   Same conventions as the other viz files.
   ========================================================================== */

(function () {
  "use strict";
  window.VIZ = window.VIZ || {};

  var NS = "http://www.w3.org/2000/svg";
  var C = { cyan: "#2de2ff", blue: "#4f7cff", gold: "#ffd166", red: "#ff5d73",
            green: "#3ddc97", dim: "#7d8fb0", line: "#1c2a45", bg: "#0c1220", text: "#c9d6ea" };

  function S(tag, attrs, parent) {
    var e = document.createElementNS(NS, tag);
    for (var k in attrs) e.setAttribute(k, attrs[k]);
    if (parent) parent.appendChild(e);
    return e;
  }
  function T(parent, x, y, str, opts) {
    opts = opts || {};
    var t = S("text", { x: x, y: y, fill: opts.fill || C.text, "font-size": opts.size || 13,
      "font-family": "ui-monospace,Menlo,monospace", "text-anchor": opts.anchor || "middle",
      "dominant-baseline": "middle" }, parent);
    t.textContent = str;
    return t;
  }
  function div(cls) { var d = document.createElement("div"); d.className = cls || ""; return d; }
  function frame(el) {
    var mount = el.querySelector(".viz-mount");
    var body = div("viz-body"), controls = div("viz-controls"), note = div("viz-note");
    mount.appendChild(body); mount.appendChild(controls); mount.appendChild(note);
    return {
      body: body, controls: controls, note: note,
      btn: function (label, fn) {
        var b = document.createElement("button");
        b.textContent = label; b.addEventListener("click", fn);
        controls.appendChild(b); return b;
      },
      say: function (m) { note.textContent = m; }
    };
  }
  function wrap(s, n) {
    var words = s.split(" "), out = [], line = "";
    words.forEach(function (w) {
      if ((line + " " + w).length > n) { out.push(line); line = w; } else line = line ? line + " " + w : w;
    });
    if (line) out.push(line);
    return out;
  }
  // draw a small table: cols = header names, rows = arrays, at (x, y)
  function table(svg, x, y, title, cols, rows, opts) {
    opts = opts || {};
    var cw = opts.cw || 78, rh = 19;
    var w = cols.length * cw;
    T(svg, x + w / 2, y - 10, title, { fill: opts.titleColor || C.gold, size: 11 });
    S("rect", { x: x, y: y, width: w, height: rh * (rows.length + 1), rx: 6,
      fill: C.bg, stroke: opts.stroke || C.blue, "stroke-width": 1.3 }, svg);
    cols.forEach(function (c, j) {
      var key = opts.keys && opts.keys.indexOf(c) !== -1;
      T(svg, x + j * cw + cw / 2, y + rh / 2, (key ? "🔑" : "") + c,
        { size: 9.5, fill: key ? C.gold : C.cyan });
    });
    S("line", { x1: x, y1: y + rh, x2: x + w, y2: y + rh, stroke: C.line }, svg);
    rows.forEach(function (r, i) {
      r.forEach(function (v, j) {
        var hot = opts.hot && opts.hot(i, j, v);
        if (hot) S("rect", { x: x + j * cw + 1, y: y + rh * (i + 1) + 1, width: cw - 2, height: rh - 2,
          fill: "rgba(255,93,115,.14)" }, svg);
        T(svg, x + j * cw + cw / 2, y + rh * (i + 1) + rh / 2, v, { size: 9, fill: hot ? C.red : C.text });
      });
    });
    return { w: w, h: rh * (rows.length + 1) };
  }

  /* ========================================================================
     25. NORMALIZATION STEPPER — one messy table → 1NF → 2NF → 3NF
     ======================================================================== */
  VIZ.normalize = function (el) {
    var f = frame(el);
    var svg = S("svg", { viewBox: "0 0 700 330" }, f.body);
    var stage = 0;
    var msgs = [
      "The patient: one table holding everything about enrollments. The red cells are duplicated facts — every one is a future update anomaly. Also note the multi-valued 'phones' cell.",
      "1NF — atomic values only. The phone list becomes its own table, one row per value. But duplication of names and departments remains…",
      "2NF — the key is (student, course). name and dept depend on student ALONE (partial dependency) → split out a Student table. Course fee depends on course alone → Course table.",
      "3NF — inside Student, dept_building depends on dept, not on the student (transitive: student → dept → building) → split out Department. Every fact now lives exactly once.",
      "Check: joining Student ⋈ Department ⋈ Enrollment ⋈ Course reproduces the original — lossless. Changing a building or a fee is now a ONE-row update. The anomalies are gone."
    ];
    function render() {
      svg.innerHTML = "";
      if (stage === 0) {
        table(svg, 30, 30, "enrollment (unnormalized)",
          ["student", "name", "phones", "dept", "building", "course", "fee", "grade"],
          [["s1", "Ada", "111,222", "CS", "Bld-7", "db101", "500", "A"],
           ["s1", "Ada", "111,222", "CS", "Bld-7", "os201", "450", "B"],
           ["s2", "Bo", "333", "EE", "Bld-2", "db101", "500", "A"]],
          { cw: 80, hot: function (i, j) { return (i === 1 && (j === 1 || j === 2 || j === 3 || j === 4)) || (i === 2 && j === 6); } });
        T(svg, 350, 145, "red = the same fact stored again (update anomaly bait)", { size: 10.5, fill: C.red });
      } else if (stage === 1) {
        table(svg, 30, 30, "enrollment (1NF)",
          ["student", "name", "dept", "building", "course", "fee", "grade"],
          [["s1", "Ada", "CS", "Bld-7", "db101", "500", "A"],
           ["s1", "Ada", "CS", "Bld-7", "os201", "450", "B"],
           ["s2", "Bo", "EE", "Bld-2", "db101", "500", "A"]],
          { cw: 78, keys: ["student", "course"],
            hot: function (i, j) { return i === 1 && j <= 3; } });
        table(svg, 30, 190, "student_phone (1NF)", ["student", "phone"],
          [["s1", "111"], ["s1", "222"], ["s2", "333"]], { cw: 78, keys: ["student", "phone"], stroke: C.green });
      } else if (stage === 2) {
        table(svg, 20, 30, "enrollment (2NF)", ["student", "course", "grade"],
          [["s1", "db101", "A"], ["s1", "os201", "B"], ["s2", "db101", "A"]],
          { cw: 66, keys: ["student", "course"], stroke: C.green });
        table(svg, 250, 30, "student (2NF…)", ["student", "name", "dept", "building"],
          [["s1", "Ada", "CS", "Bld-7"], ["s2", "Bo", "EE", "Bld-2"]],
          { cw: 66, keys: ["student"], hot: function (i, j) { return j === 3; } });
        table(svg, 540, 30, "course (2NF)", ["course", "fee"],
          [["db101", "500"], ["os201", "450"]], { cw: 66, keys: ["course"], stroke: C.green });
        T(svg, 350, 145, "building still rides along with every student — a transitive dependency", { size: 10.5, fill: C.red });
      } else {
        table(svg, 20, 30, "enrollment", ["student", "course", "grade"],
          [["s1", "db101", "A"], ["s1", "os201", "B"], ["s2", "db101", "A"]],
          { cw: 62, keys: ["student", "course"], stroke: C.green });
        table(svg, 230, 30, "student (3NF)", ["student", "name", "dept"],
          [["s1", "Ada", "CS"], ["s2", "Bo", "EE"]],
          { cw: 62, keys: ["student"], stroke: C.green });
        table(svg, 445, 30, "department", ["dept", "building"],
          [["CS", "Bld-7"], ["EE", "Bld-2"]], { cw: 62, keys: ["dept"], stroke: C.green });
        table(svg, 590, 30, "course", ["course", "fee"],
          [["db101", "500"], ["os201", "450"]], { cw: 52, keys: ["course"], stroke: C.green });
        if (stage >= 4) {
          T(svg, 350, 150, "student ⋈ department ⋈ enrollment ⋈ course  =  the original table ✓ (lossless)",
            { size: 11, fill: C.green });
        }
        // FK arrows
        S("path", { d: "M 230 60 C 210 60, 205 60, 190 60", stroke: C.cyan, fill: "none", opacity: 0.5 }, svg);
        S("path", { d: "M 445 60 C 425 60, 420 60, 410 60", stroke: C.cyan, fill: "none", opacity: 0.5 }, svg);
      }
      wrap(msgs[stage], 92).forEach(function (l, i) { T(svg, 350, 250 + i * 15, l, { size: 11.5, fill: C.gold }); });
      T(svg, 350, 320, ["UNNORMALIZED", "1NF", "2NF", "3NF", "3NF ✓ verified"][stage], { size: 12, fill: C.cyan });
    }
    f.btn("◂ back", function () { stage = Math.max(0, stage - 1); render(); });
    f.btn("normalize ▸", function () { stage = Math.min(4, stage + 1); render(); });
    render();
    f.say("Step through the decomposition — each normal form removes one specific disease.");
  };

  /* ========================================================================
     26. SQL PIPELINE — logical evaluation order on a live table
     ======================================================================== */
  VIZ.sqlpipeline = function (el) {
    var f = frame(el);
    var svg = S("svg", { viewBox: "0 0 700 330" }, f.body);
    // the query being explained
    var rows = [ // dept, employee, salary
      ["CS", "Ada", 90], ["CS", "Cy", 60], ["EE", "Bo", 80],
      ["EE", "Dee", 40], ["CS", "Eli", 75], ["EE", "Fay", 85]
    ];
    var stage = 0;
    var stages = [
      { clause: "— the query —", msg: "SELECT dept, AVG(salary) FROM emp WHERE salary > 50 GROUP BY dept HAVING COUNT(*) > 1 ORDER BY 2 DESC — but that is NOT the order it runs. Step through the real pipeline." },
      { clause: "1. FROM emp", msg: "Assemble the working set: all six rows of emp enter the pipeline." },
      { clause: "2. WHERE salary > 50", msg: "Filter ROWS. Dee (40) is dropped. Note: no aggregates may appear here — groups don't exist yet." },
      { clause: "3. GROUP BY dept", msg: "Collapse surviving rows into groups: CS = {Ada, Cy, Eli}, EE = {Bo, Fay}." },
      { clause: "4. HAVING COUNT(*) > 1", msg: "Filter GROUPS. Both groups have ≥2 members — both survive. (Had EE lost Fay to the WHERE, HAVING would kill it here.)" },
      { clause: "5. SELECT dept, AVG(salary)", msg: "Compute output expressions per group: CS → 75, EE → 82.5. Only NOW do SELECT aliases come into existence." },
      { clause: "6. ORDER BY avg DESC", msg: "Sort the results: EE (82.5) before CS (75). LIMIT would cut here. Pipeline complete." }
    ];
    function render() {
      svg.innerHTML = "";
      var st = stages[stage];
      // pipeline rail
      var labels = ["FROM", "WHERE", "GROUP BY", "HAVING", "SELECT", "ORDER BY"];
      labels.forEach(function (l, i) {
        var on = stage === i + 1, done = stage > i + 1;
        S("rect", { x: 20 + i * 112, y: 12, width: 104, height: 26, rx: 13,
          fill: on ? "rgba(45,226,255,.15)" : C.bg,
          stroke: on ? C.cyan : done ? C.green : C.line }, svg);
        T(svg, 72 + i * 112, 25, l, { size: 10, fill: on ? C.cyan : done ? C.green : C.dim });
      });
      T(svg, 350, 58, st.clause, { size: 13, fill: C.gold });

      if (stage <= 2) {
        // row view
        rows.forEach(function (r, i) {
          var dropped = stage >= 2 && r[2] <= 50;
          var g = S("g", { opacity: dropped ? 0.3 : 1 }, svg);
          S("rect", { x: 200, y: 76 + i * 27, width: 300, height: 22, rx: 5,
            fill: C.bg, stroke: dropped ? C.red : (stage >= 1 ? C.cyan : C.line) }, g);
          T(g, 350, 87 + i * 27, r[0] + " │ " + r[1] + " │ " + r[2] + (dropped ? "   ✕" : ""),
            { size: 10.5, fill: dropped ? C.red : C.text });
        });
      } else if (stage <= 4) {
        // grouped view
        var groups = { CS: rows.filter(function (r) { return r[0] === "CS" && r[2] > 50; }),
                       EE: rows.filter(function (r) { return r[0] === "EE" && r[2] > 50; }) };
        Object.keys(groups).forEach(function (dept, gi) {
          var g = groups[dept];
          S("rect", { x: 120 + gi * 250, y: 80, width: 220, height: 40 + g.length * 24, rx: 9,
            fill: "rgba(61,220,151,.05)", stroke: C.green }, svg);
          T(svg, 230 + gi * 250, 96, dept + "  (COUNT = " + g.length + ")", { size: 11, fill: C.green });
          g.forEach(function (r, i) {
            T(svg, 230 + gi * 250, 118 + i * 24, r[1] + " · " + r[2], { size: 10, fill: C.text });
          });
        });
      } else {
        // result view
        var res = [["EE", "82.5"], ["CS", "75.0"]];
        if (stage === 5) res = [["CS", "75.0"], ["EE", "82.5"]]; // pre-sort order
        T(svg, 350, 86, "dept │ avg_salary", { size: 11, fill: C.cyan });
        res.forEach(function (r, i) {
          S("rect", { x: 240, y: 100 + i * 30, width: 220, height: 24, rx: 5,
            fill: "rgba(45,226,255,.06)", stroke: C.cyan }, svg);
          T(svg, 350, 112 + i * 30, r[0] + "  │  " + r[1], { size: 11 });
        });
        if (stage === 6) T(svg, 350, 175, "sorted ✓", { size: 10.5, fill: C.green });
      }
      wrap(st.msg, 90).forEach(function (l, i) { T(svg, 350, 270 + i * 15, l, { size: 11.5, fill: C.gold }); });
    }
    f.btn("◂ back", function () { stage = Math.max(0, stage - 1); render(); });
    f.btn("step ▸", function () { stage = Math.min(stages.length - 1, stage + 1); render(); });
    render();
    f.say("You WRITE SELECT first; the engine RUNS it fifth. Step through to see why WHERE can't see aliases or aggregates.");
  };

  /* ========================================================================
     27. PRECEDENCE GRAPH — schedules, conflicts, and the cycle test
     ======================================================================== */
  VIZ.schedgraph = function (el) {
    var f = frame(el);
    var svg = S("svg", { viewBox: "0 0 700 300" }, f.body);
    // two example schedules over items A, B: one serializable, one not
    var schedules = {
      serializable: [["T1", "R", "A"], ["T2", "R", "B"], ["T1", "W", "A"], ["T2", "W", "B"], ["T1", "R", "B"], ["T2", "R", "A"]],
      cyclic: [["T1", "R", "A"], ["T2", "W", "A"], ["T2", "R", "B"], ["T1", "W", "B"]]
    };
    var current = "serializable", cursor = 0, edges = [], msg = "";

    function conflictsBefore(idx) { // edges created by op idx against EARLIER ops
      var found = [];
      var op = schedules[current][idx];
      for (var i = 0; i < idx; i++) {
        var prev = schedules[current][i];
        if (prev[0] !== op[0] && prev[2] === op[2] && (prev[1] === "W" || op[1] === "W")) {
          found.push([prev[0], op[0], prev[1] + prev[2] + "→" + op[1] + op[2]]);
        }
      }
      return found;
    }
    function hasCycle() { // tiny 2-node cycle check (works for T1/T2 demos)
      var f12 = edges.some(function (e) { return e[0] === "T1" && e[1] === "T2"; });
      var f21 = edges.some(function (e) { return e[0] === "T2" && e[1] === "T1"; });
      return f12 && f21;
    }
    function step() {
      var sched = schedules[current];
      if (cursor >= sched.length) {
        msg = hasCycle()
          ? "CYCLE T1⇄T2 — NOT conflict serializable: T1 must precede AND follow T2. No serial order exists; a serializable engine would have blocked or aborted one of them."
          : "Schedule complete, graph acyclic ✓ — conflict serializable. Equivalent serial order: " +
            (edges.some(function (e) { return e[0] === "T1"; }) ? "T1 then T2" : "T2 then T1 (or either, if no edges)") + ".";
        render(); return;
      }
      var op = sched[cursor];
      var newEdges = conflictsBefore(cursor).filter(function (e) {
        return !edges.some(function (x) { return x[0] === e[0] && x[1] === e[1]; });
      });
      edges = edges.concat(newEdges);
      msg = op[0] + " " + (op[1] === "R" ? "reads" : "writes") + " " + op[2] +
        (newEdges.length ? " — CONFLICT with earlier " + newEdges[0][2].slice(0, 2) + " ⇒ edge " + newEdges[0][0] + " → " + newEdges[0][1]
                         : conflictsBefore(cursor).length ? " — conflict already recorded" : " — no conflict with earlier ops");
      cursor++;
      render();
    }
    function reset(name) {
      current = name; cursor = 0; edges = [];
      msg = name === "serializable"
        ? "Schedule 1: interleaved, but are the conflicts consistent? Step through each operation."
        : "Schedule 2: only four operations… step through and watch the trap close.";
      render();
    }
    function render() {
      svg.innerHTML = "";
      var sched = schedules[current];
      // the schedule as two swimlanes
      ["T1", "T2"].forEach(function (tx, r) {
        T(svg, 30, 40 + r * 44, tx, { size: 12, fill: r === 0 ? C.cyan : C.gold, anchor: "start" });
        S("line", { x1: 60, y1: 40 + r * 44, x2: 480, y2: 40 + r * 44, stroke: C.line, "stroke-dasharray": "3 4" }, svg);
      });
      sched.forEach(function (op, i) {
        var r = op[0] === "T1" ? 0 : 1;
        var x = 80 + i * (390 / sched.length);
        var done = i < cursor, active = i === cursor - 1;
        S("rect", { x: x - 22, y: 26 + r * 44, width: 44, height: 28, rx: 7,
          fill: active ? "rgba(255,209,102,.18)" : C.bg,
          stroke: active ? C.gold : done ? (op[0] === "T1" ? C.cyan : C.gold) : C.line,
          "stroke-width": active ? 2 : 1.2 }, svg);
        T(svg, x, 40 + r * 44, op[1] + "(" + op[2] + ")", { size: 10, fill: done || active ? C.text : C.dim });
      });
      T(svg, 260, 130, "time →", { size: 9.5, fill: C.dim });

      // precedence graph
      T(svg, 590, 26, "precedence graph", { size: 10.5, fill: C.dim });
      var n1 = { x: 545, y: 80 }, n2 = { x: 655, y: 80 };
      var cyc = hasCycle() && cursor >= sched.length;
      [[n1, "T1", C.cyan], [n2, "T2", C.gold]].forEach(function (n) {
        S("circle", { cx: n[0].x, cy: n[0].y, r: 24, fill: C.bg, stroke: cyc ? C.red : n[2], "stroke-width": 2 }, svg);
        T(svg, n[0].x, n[0].y, n[1], { size: 12, fill: cyc ? C.red : n[2] });
      });
      edges.forEach(function (e) {
        var a = e[0] === "T1" ? n1 : n2, b = e[1] === "T1" ? n1 : n2;
        var up = e[0] === "T1"; // curve T1→T2 above, T2→T1 below
        var midY = 80 + (up ? -34 : 34);
        S("path", { d: "M " + (a.x + (up ? 14 : -14)) + " " + (a.y + (up ? -18 : 18)) +
          " Q 600 " + midY + " " + (b.x + (up ? -14 : 14)) + " " + (b.y + (up ? -18 : 18)),
          stroke: cyc ? C.red : C.green, fill: "none", "stroke-width": 2 }, svg);
        S("circle", { cx: b.x + (up ? -14 : 14), cy: b.y + (up ? -18 : 18), r: 3.5, fill: cyc ? C.red : C.green }, svg);
      });
      if (cyc) T(svg, 600, 140, "⟳ CYCLE", { size: 12, fill: C.red });

      wrap(msg, 90).forEach(function (l, i) { T(svg, 350, 235 + i * 15, l, { size: 11.5, fill: C.gold }); });
      T(svg, 350, 285, "conflict = same item, different transactions, at least one write", { size: 9.5, fill: C.dim });
    }
    f.btn("step ▸", step);
    f.btn("schedule 1 (safe)", function () { reset("serializable"); });
    f.btn("schedule 2 (trap)", function () { reset("cyclic"); });
    reset("serializable");
  };

  /* ========================================================================
     28. CONNECTION POOL — borrow/return, queueing, exhaustion, leaks
     ======================================================================== */
  VIZ.pool = function (el) {
    var f = frame(el);
    var svg = S("svg", { viewBox: "0 0 700 300" }, f.body);
    var SIZE = 6, QUEUE_TIMEOUT = 40;         // ticks a request may wait (~4s)
    var slots, queue, served, timedOut, leaked, steady, tick, timer;

    function reset() {
      slots = []; for (var i = 0; i < SIZE; i++) slots.push(null); // null = free, {left:n} = busy, "leak" = leaked
      queue = []; served = 0; timedOut = 0; leaked = 0; steady = false; tick = 0;
      render(); f.say("Fire requests at a pool of " + SIZE + " connections. Each request borrows one for a moment, then returns it.");
    }
    function arrive(n) { for (var i = 0; i < n; i++) queue.push({ waited: 0 }); }
    function step() {
      // self-clean when the chapter unmounts, so navigations don't stack timers
      if (!document.body.contains(svg)) { clearInterval(timer); timer = null; return; }
      tick++;
      if (steady && tick % 3 === 0) arrive(1 + (Math.random() < 0.4 ? 1 : 0));
      // finish work
      slots.forEach(function (s, i) {
        if (s && s !== "leak" && --s.left <= 0) { slots[i] = null; served++; }
      });
      // seat waiting requests
      for (var i = 0; i < slots.length && queue.length; i++) {
        if (!slots[i]) slots[i] = { left: 4 + Math.floor(Math.random() * 12) }; // 0.4–1.6s of work
        else continue;
        queue.shift();
      }
      // age the queue
      queue = queue.filter(function (q) {
        if (++q.waited > QUEUE_TIMEOUT) { timedOut++; return false; }
        return true;
      });
      render();
    }
    function render() {
      svg.innerHTML = "";
      T(svg, 350, 22, "the pool — " + SIZE + " connections to the database", { size: 11.5, fill: C.dim });
      slots.forEach(function (s, i) {
        var x = 130 + i * 78;
        var col = s === "leak" ? C.red : s ? C.gold : C.green;
        S("rect", { x: x - 30, y: 45, width: 60, height: 66, rx: 9, fill: C.bg,
          stroke: col, "stroke-width": 2, opacity: s === "leak" ? 0.9 : 1 }, svg);
        T(svg, x, 70, s === "leak" ? "LEAKED" : s ? "busy" : "free", { size: 9.5, fill: col });
        if (s && s !== "leak")
          S("rect", { x: x - 22, y: 88, width: 44 * Math.min(1, s.left / 16), height: 8, rx: 3, fill: C.gold }, svg);
        if (s === "leak") T(svg, x, 95, "never returned", { size: 7.5, fill: C.red });
      });
      // waiting queue
      T(svg, 60, 150, "waiting:", { size: 10.5, fill: C.dim, anchor: "start" });
      queue.slice(0, 18).forEach(function (q, i) {
        var hot = q.waited > QUEUE_TIMEOUT * 0.6;
        S("circle", { cx: 145 + i * 26, cy: 150, r: 8, fill: C.bg,
          stroke: hot ? C.red : C.cyan, "stroke-width": 2 }, svg);
      });
      if (queue.length > 18) T(svg, 640, 150, "+" + (queue.length - 18), { size: 10, fill: C.red });
      // scoreboard
      T(svg, 175, 205, "served: " + served, { size: 12, fill: C.green });
      T(svg, 350, 205, "waiting: " + queue.length, { size: 12, fill: queue.length ? C.cyan : C.dim });
      T(svg, 525, 205, "timed out: " + timedOut, { size: 12, fill: timedOut ? C.red : C.dim });
      var free = slots.filter(function (s) { return !s; }).length;
      var msg = leaked >= SIZE ? "Every connection leaked — the pool is dead. Every request now waits, then times out. This is what a missing finally-block does at 3 a.m. Reset to recover."
        : leaked ? leaked + " connection(s) leaked: capacity is now " + (SIZE - leaked) + ", so the same load queues deeper and times out sooner."
        : queue.length > 10 ? "The queue is outrunning the pool — requests age toward timeout. More connections? Or faster queries? (Usually: faster queries.)"
        : steady ? "Steady load: arrivals ≈ service rate. Watch the queue breathe."
        : free === SIZE && !queue.length ? "Idle. Fire a burst or switch on steady load." : "";
      if (msg) wrap(msg, 88).forEach(function (l, i) { T(svg, 350, 240 + i * 15, l, { size: 11, fill: C.gold }); });
    }
    f.btn("burst ×10", function () { arrive(10); render(); });
    f.btn("steady load", function () { steady = !steady; });
    f.btn("leak a connection", function () {
      for (var i = 0; i < slots.length; i++) if (slots[i] !== "leak") { slots[i] = "leak"; leaked++; break; }
      render();
    });
    f.btn("reset", reset);
    reset();
    timer = setInterval(step, 100);
    // stop simulating when the tab hides (matches the other animated sims)
    document.addEventListener("visibilitychange", function () {
      if (document.hidden) { clearInterval(timer); timer = null; }
      else if (!timer) timer = setInterval(step, 100);
    });
  };

})();
