/* ==========================================================================
   app.js — SPA engine
   Hash-based router (#/ = journey map, #/ch/N = chapter N), TOC sidebar,
   progress tracking (localStorage), scroll-reveal, lazy viz mounting,
   and the ambient particle background. No dependencies.
   ========================================================================== */

(function () {
  "use strict";

  var $ = function (sel, root) { return (root || document).querySelector(sel); };
  var app = $("#app");

  /* ---------- persistent progress (localStorage, no login needed) ---------- */
  var store = {
    read: function () {
      try { return JSON.parse(localStorage.getItem("dbi-progress-v3")) || {}; }
      catch (e) { return {}; }
    },
    write: function (p) { localStorage.setItem("dbi-progress-v3", JSON.stringify(p)); }
  };
  var progress = store.read();           // { visited: {chNum: true}, quiz: {chNum: score} }
  progress.visited = progress.visited || {};
  progress.quiz = progress.quiz || {};

  function saveProgress() { store.write(progress); updateProgressBar(); renderTOC(); }

  // Overall progress = half for visiting a chapter, half for passing its quiz.
  function updateProgressBar() {
    var total = CHAPTERS.length * 2, done = 0;
    CHAPTERS.forEach(function (ch) {
      if (progress.visited[ch.num]) done++;
      if (progress.quiz[ch.num] !== undefined) done++;
    });
    var pct = Math.round((done / total) * 100);
    $("#progress-fill").style.width = pct + "%";
    $("#progress-label").textContent = pct + "%";
  }

  /* ---------- table of contents sidebar ---------- */
  function renderTOC() {
    var html = "";
    PARTS.forEach(function (part) {
      html += '<div class="toc-part">Part ' + part.num + " · " + part.title + "</div>";
      CHAPTERS.filter(function (c) { return c.part === part.num; }).forEach(function (ch) {
        var cls = [];
        if (location.hash === "#/ch/" + ch.num) cls.push("active");
        if (progress.quiz[ch.num] !== undefined) cls.push("done");
        html += '<a href="#/ch/' + ch.num + '" class="' + cls.join(" ") + '">' +
                '<span class="n">' + ch.num + "</span>" + ch.title + "</a>";
      });
    });
    $("#toc-inner").innerHTML = html;
  }

  // Sidebar: docked and present by default on wide screens, overlay on narrow.
  // One class on <body> flips whichever default the CSS breakpoint sets.
  function wideLayout() { return matchMedia("(min-width: 1024px)").matches; }
  $("#toc-toggle").addEventListener("click", function () {
    document.body.classList.toggle("sidebar-toggled");
  });
  $("#toc-backdrop").addEventListener("click", function () {
    document.body.classList.remove("sidebar-toggled");
  });
  $("#toc").addEventListener("click", function (e) {
    // On narrow (overlay) screens, close after navigating; on wide it stays docked.
    if (e.target.closest("a") && !wideLayout()) document.body.classList.remove("sidebar-toggled");
  });

  // Java ⇄ Go tabs on Part V code examples (the .code-tabs markup ships
  // with the course content; one delegated listener covers all of them).
  document.addEventListener("click", function (e) {
    var btn = e.target.closest(".code-tab");
    if (!btn) return;
    var tabs = btn.closest(".code-tabs");
    tabs.querySelectorAll(".code-tab").forEach(function (b) {
      b.classList.toggle("active", b === btn);
    });
    tabs.querySelectorAll("pre[data-lang]").forEach(function (p) {
      p.hidden = p.dataset.lang !== btn.dataset.lang;
    });
  });

  /* ---------- scroll-reveal + lazy visualization mounting ---------- */
  // One observer reveals .block sections; another mounts a viz only when it
  // approaches the viewport (keeps heavy canvases from running off-screen).
  var revealObs = new IntersectionObserver(function (entries) {
    entries.forEach(function (en) {
      if (en.isIntersecting) { en.target.classList.add("revealed"); revealObs.unobserve(en.target); }
    });
  }, { threshold: 0.08 });

  var vizObs = new IntersectionObserver(function (entries) {
    entries.forEach(function (en) {
      if (!en.isIntersecting) return;
      var el = en.target, name = el.dataset.viz;
      vizObs.unobserve(el);
      // idempotence guard: never mount into a frame that's already populated
      var m = el.querySelector(".viz-mount");
      if (m && m.childElementCount) return;
      if (window.VIZ && VIZ[name]) {
        try { VIZ[name](el); }
        catch (err) { el.innerHTML = '<div class="viz-note">visualization failed: ' + err.message + "</div>"; }
      }
    });
  }, { rootMargin: "200px" });

  /* ---------- views ---------- */

  function homeView() {
    var html =
      '<div class="hero">' +
      "<h1>Journey Into the Machine</h1>" +
      '<p class="sub">How databases really work — storage engines, B-Trees, log-structured storage, ' +
      "transactions, replication, and consensus — explained with living, interactive machinery. " +
      "No login. No server. Just you and the internals.</p>" +
      '<a class="cta" href="#/ch/1">Begin the descent ↓</a>' +
      "</div>";

    PARTS.forEach(function (part) {
      html += '<div class="part-head">Part ' + part.num + " — " + part.title + "</div>" +
              '<p class="part-desc">' + part.desc + "</p>" +
              '<div class="journey">';
      CHAPTERS.filter(function (c) { return c.part === part.num; }).forEach(function (ch) {
        var vizCount = ch.sections.filter(function (s) { return s.viz; }).length;
        var quizDone = progress.quiz[ch.num] !== undefined;
        html += '<a class="ch-card' + (progress.visited[ch.num] ? " visited" : "") + '" href="#/ch/' + ch.num + '">' +
                '<span class="num">CHAPTER ' + ch.num + "</span>" +
                "<h3>" + ch.title + "</h3>" +
                "<p>" + ch.blurb + "</p>" +
                '<div class="badges">' +
                (vizCount ? '<span class="badge viz">⚡ ' + vizCount + " interactive</span>" : "") +
                '<span class="badge">' + ch.quiz.length + " quiz questions</span>" +
                (quizDone ? '<span class="badge quiz-done">✓ quiz ' + progress.quiz[ch.num] + "/" + ch.quiz.length + "</span>" : "") +
                "</div></a>";
      });
      html += "</div>";
    });
    app.innerHTML = html;
  }

  function chapterView(num) {
    var ch = CHAPTERS.find(function (c) { return c.num === num; });
    if (!ch) { location.hash = "#/"; return; }
    progress.visited[num] = true;
    saveProgress();

    var part = PARTS.find(function (p) { return p.num === ch.part; });
    var html =
      '<div class="ch-hero">' +
      '<div class="kicker">PART ' + part.num + " · " + part.title.toUpperCase() + " · CHAPTER " + ch.num + "</div>" +
      "<h1>" + ch.title + "</h1>" +
      '<p class="intro">' + ch.blurb + "</p>" +
      "</div>";

    ch.sections.forEach(function (sec, i) {
      html += '<section class="block">' +
              "<h2>" + sec.title + "</h2>" +
              sec.html +
              (sec.viz
                ? '<div class="viz" data-viz="' + sec.viz + '">' +
                  '<div class="viz-head">INTERACTIVE — ' + (sec.vizTitle || sec.viz) + "</div>" +
                  '<div class="viz-mount"></div></div>'
                : "") +
              "</section>";
    });

    // Key terms (tap-to-reveal flashcards)
    if (ch.terms && ch.terms.length) {
      html += '<section class="block"><h2>Key Terms</h2><div class="terms">' +
        ch.terms.map(function (t) {
          return '<div class="term"><b>' + t.t + "</b><span>" + t.d + "</span></div>";
        }).join("") + "</div></section>";
    }

    // Quiz
    html += '<section class="block"><h2>Knowledge Check</h2><div class="quiz" id="quiz-root"></div></section>';

    // Prev / next navigation
    var prev = CHAPTERS.find(function (c) { return c.num === num - 1; });
    var next = CHAPTERS.find(function (c) { return c.num === num + 1; });
    html += '<div class="ch-nav">' +
      (prev ? '<a href="#/ch/' + prev.num + '"><span class="dir">← PREVIOUS</span><span class="t">' + prev.title + "</span></a>" : "<span></span>") +
      (next ? '<a class="next" href="#/ch/' + next.num + '"><span class="dir">NEXT →</span><span class="t">' + next.title + "</span></a>"
            : '<a class="next" href="#/"><span class="dir">FINISH →</span><span class="t">Back to the map</span></a>') +
      "</div>";

    app.innerHTML = html;

    // Wire up reveals, lazy viz, terms, quiz
    app.querySelectorAll("section.block").forEach(function (el) { revealObs.observe(el); });
    app.querySelectorAll(".viz[data-viz]").forEach(function (el) { vizObs.observe(el); });
    app.querySelectorAll(".term").forEach(function (el) {
      el.addEventListener("click", function () { el.classList.toggle("open"); });
    });
    Quiz.mount($("#quiz-root"), ch.quiz, function (score) {
      progress.quiz[num] = score;
      saveProgress();
    });
  }

  /* ---------- router ---------- */
  function route() {
    var m = location.hash.match(/^#\/ch\/(\d+)/);
    // jump (not smooth-scroll) to top on navigation — new page, fresh viewport
    window.scrollTo({ top: 0, behavior: "instant" });
    if (m) chapterView(parseInt(m[1], 10));
    else homeView();
    renderTOC();
  }
  window.addEventListener("hashchange", route);

  /* ---------- ambient particle background ---------- */
  // Slow-falling "data bits" — cheap to draw, capped particle count, paused
  // when the tab is hidden. Purely decorative.
  (function particles() {
    var cv = $("#bg-particles"), ctx = cv.getContext("2d");
    var pts = [], N = 70, raf;
    function resize() {
      cv.width = innerWidth; cv.height = innerHeight;
    }
    function spawn() {
      return {
        x: Math.random() * cv.width,
        y: Math.random() * cv.height,
        s: Math.random() * 1.6 + 0.4,          // size
        v: Math.random() * 0.35 + 0.08,        // fall speed
        c: Math.random() < 0.12 ? "#ffd166" : (Math.random() < 0.5 ? "#2de2ff" : "#4f7cff"),
        a: Math.random() * 0.5 + 0.12          // alpha
      };
    }
    function tick() {
      ctx.clearRect(0, 0, cv.width, cv.height);
      pts.forEach(function (p) {
        p.y += p.v;
        if (p.y > cv.height + 4) { p.y = -4; p.x = Math.random() * cv.width; }
        ctx.globalAlpha = p.a;
        ctx.fillStyle = p.c;
        ctx.fillRect(p.x, p.y, p.s, p.s * 2.2);
      });
      ctx.globalAlpha = 1;
      raf = requestAnimationFrame(tick);
    }
    resize();
    for (var i = 0; i < N; i++) pts.push(spawn());
    window.addEventListener("resize", resize);
    document.addEventListener("visibilitychange", function () {
      if (document.hidden) cancelAnimationFrame(raf); else tick();
    });
    if (!matchMedia("(prefers-reduced-motion: reduce)").matches) tick();
  })();

  /* ---------- shared tooltip for visualizations ---------- */
  // viz.js positions this near hovered/tapped diagram elements.
  var tip = document.createElement("div");
  tip.id = "viz-tip";
  document.body.appendChild(tip);
  window.vizTip = {
    show: function (x, y, title, body) {
      tip.innerHTML = "<b>" + title + "</b>" + body;
      tip.classList.add("show");
      // keep on screen
      var w = Math.min(280, innerWidth - 20);
      tip.style.left = Math.min(x + 14, innerWidth - w - 10) + "px";
      tip.style.top = Math.min(y + 14, innerHeight - 120) + "px";
    },
    hide: function () { tip.classList.remove("show"); }
  };

  // Course content is paid material, fetched by gate.js from the course-content
  // Edge Function only after premium is verified. It hands us PARTS + CHAPTERS
  // and calls this to render. (The particle background above runs regardless.)
  window.HDApp = {
    boot: function () {
      CHAPTERS.sort(function (a, b) { return a.num - b.num; });
      updateProgressBar();
      route();
    }
  };
})();
