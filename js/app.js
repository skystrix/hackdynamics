/* ==========================================================================
   app.js — SPA engine
   Hash-based router (#/ = journey map, #/ch/N = chapter N), TOC sidebar,
   progress tracking (localStorage), lazy viz mounting,
   and the ambient particle background. No dependencies.
   ========================================================================== */

(function () {
  "use strict";

  var $ = function (sel, root) { return (root || document).querySelector(sel); };
  var app = $("#app");

  // Which course this shell page is. Set by the page (window.HD_COURSE);
  // "db" is the original Databases in Depth page, which predates the field.
  var COURSE = window.HD_COURSE || {};
  var COURSE_KEY = COURSE.key || "db";
  // Chapter numbers restart per course, so progress must be keyed per course.
  // The db course keeps its original key so existing progress survives.
  var PROGRESS_KEY = COURSE_KEY === "db" ? "dbi-progress-v3" : "hd-progress-" + COURSE_KEY;

  /* ---------- persistent progress (localStorage, no login needed) ---------- */
  var store = {
    read: function () {
      try { return JSON.parse(localStorage.getItem(PROGRESS_KEY)) || {}; }
      catch (e) { return {}; }
    },
    write: function (p) { localStorage.setItem(PROGRESS_KEY, JSON.stringify(p)); }
  };
  var progress = store.read();           // { visited: {chNum: true}, quiz: {chNum: score} }
  progress.visited = progress.visited || {};
  progress.quiz = progress.quiz || {};

  function saveProgress() { store.write(progress); updateProgressBar(); renderTOC(); }

  // Overall progress = half for visiting a chapter, half for passing its quiz.
  // Optional chapters are extra reading, so they neither add to nor block 100%.
  function updateProgressBar() {
    var core = CHAPTERS.filter(function (ch) { return !ch.optional; });
    var total = core.length * 2, done = 0;
    core.forEach(function (ch) {
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
      var chs = CHAPTERS.filter(function (c) { return c.part === part.num; });
      if (!chs.length) return;   // a part whose chapters aren't written yet
      html += '<div class="toc-part">Part ' + part.num + " · " + part.title + "</div>";
      chs.forEach(function (ch) {
        var cls = [];
        if (location.hash === "#/ch/" + ch.num) cls.push("active");
        if (progress.quiz[ch.num] !== undefined) cls.push("done");
        if (ch.locked) cls.push("locked");
        html += '<a href="#/ch/' + ch.num + '" class="' + cls.join(" ") + '">' +
                '<span class="n">' + ch.num + "</span>" + ch.title +
                (ch.optional ? ' <span class="toc-opt">optional</span>' : "") +
                (ch.locked ? ' <span class="toc-lock">locked</span>' : "") + "</a>";
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

  // The bar steps out of the way while you read down and returns on the way up.
  var lastY = 0;
  addEventListener("scroll", function () {
    var y = scrollY;
    document.body.classList.toggle("bar-away", y > lastY && y > 160);
    lastY = y;
  }, { passive: true });

  // Chapter titles run from 9 to 90 characters; size the poster title by
  // length so every one stays on two or three lines.
  function titleClass(t) { return t.length > 44 ? "xlong" : t.length > 24 ? "long" : ""; }

  /* ---------- lazy visualization mounting ---------- */
  // Mount a machine only when it approaches the viewport (keeps heavy
  // canvases from running off-screen). Section entrances are pure CSS.
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
      "<h1>" + (COURSE.heroTitle || "Journey Into the Machine") + "</h1>" +
      '<p class="sub">' + (COURSE.heroSub ||
        "How databases really work — storage engines, B-Trees, log-structured storage, " +
        "transactions, replication, and consensus — explained with living, interactive machinery. " +
        "No login. No server. Just you and the internals.") + "</p>" +
      '<a class="cta" href="#/ch/1">' + (COURSE.heroCta || "Begin the descent ↓") + "</a>" +
      heroMachine() +
      "</div>";

    PARTS.forEach(function (part) {
      var chs = CHAPTERS.filter(function (c) { return c.part === part.num; });
      if (!chs.length) return;   // a part whose chapters aren't written yet
      html += '<h2 class="part-head">Part ' + part.num + ": " + part.title + "</h2>" +
              '<p class="part-desc">' + part.desc + "</p>" +
              '<div class="journey">';
      chs.forEach(function (ch) {
        // Locked chapters arrive as metadata stubs (no sections/quiz), carrying
        // vizCount/quizCount instead — use those so the card still shows badges.
        // Machines live in the course shell's viz scripts; a course that
        // ships none (window.VIZ absent) shows no interactive badge.
        var vizCount = !window.VIZ ? 0
          : ch.locked ? (ch.vizNames ? ch.vizNames.filter(function (n) { return VIZ[n]; }).length : (ch.vizCount || 0))
          : ch.sections.filter(function (s) { return s.viz && VIZ[s.viz]; }).length;
        var quizCount = ch.locked ? (ch.quizCount || 0) : ch.quiz.length;
        var quizDone = progress.quiz[ch.num] !== undefined;
        html += '<a class="ch-card' + (progress.visited[ch.num] ? " visited" : "") +
                (ch.locked ? " locked" : "") + '" href="#/ch/' + ch.num + '">' +
                '<span class="num">' + ch.num + "</span>" +
                "<h3>" + ch.title + "</h3>" +
                "<p>" + ch.blurb + "</p>" +
                '<div class="badges">' +
                (ch.optional ? '<span class="badge optional">Optional</span>' : "") +
                (vizCount ? '<span class="badge machines">' + vizCount + (vizCount === 1 ? " machine" : " machines") + "</span>" : "") +
                (quizDone ? '<span class="badge quiz-done">Quiz ' + progress.quiz[ch.num] + " of " + quizCount + "</span>"
                          : '<span class="badge">' + quizCount + " questions</span>") +
                (ch.locked ? '<span class="badge locked">Sign in to read</span>' : "") +
                "</div></a>";
      });
      html += "</div>";
    });
    app.innerHTML = html;
    app.querySelectorAll(".viz[data-viz]").forEach(function (el) { vizObs.observe(el); });
  }

  // The course map opens with one live machine from the course, the same one
  // the home page pictures for it. Its title and chapter come from the data.
  function heroMachine() {
    var name = { db: "hashring", rag: "hnswSearch", llm: "llmAttention", dsa: "dsaTwoPointers" }[COURSE_KEY];
    if (!name || !window.VIZ || !VIZ[name]) return "";
    var hit;
    CHAPTERS.some(function (c) {
      return (c.sections || []).some(function (s) { if (s.viz === name) { hit = { ch: c, sec: s }; return true; } });
    });
    if (!hit) return "";
    return '<div class="viz" data-ui data-viz="' + name + '"><div class="viz-head">' + hit.sec.vizTitle + "</div>" +
           '<div class="viz-mount"></div></div>' +
           '<p class="hero-cap">From chapter ' + hit.ch.num + ', <a href="#/ch/' + hit.ch.num + '">' + hit.ch.title + "</a>.</p>";
  }

  function chapterView(num) {
    var ch = CHAPTERS.find(function (c) { return c.num === num; });
    if (!ch) { location.hash = "#/"; return; }
    var part = PARTS.find(function (p) { return p.num === ch.part; });

    // Locked chapter: only its metadata was served. Show the hero + a sign-in
    // sign-in card (drawn by gate.js) in place of the body/quiz, plus prev/next nav.
    if (ch.locked) {
      var lhtml =
        '<div class="ch-hero">' +
        '<p class="ch-meta">Chapter ' + ch.num + " · Part " + part.num + ", " + part.title + "</p>" +
        "<h1 class=\"" + titleClass(ch.title) + "\">" + ch.title + "</h1>" +
        '<p class="intro">' + ch.blurb + "</p>" +
        (ch.optional ? '<p class="optional-note">Optional, advanced reading. Interviews rarely go this deep, so skip it on a first pass and come back when you want the depth.</p>' : "") +
        "</div>" +
        '<div id="chapter-login"></div>';
      var lprev = CHAPTERS.find(function (c) { return c.num === num - 1; });
      var lnext = CHAPTERS.find(function (c) { return c.num === num + 1; });
      lhtml += '<div class="ch-nav">' +
        (lprev ? '<a href="#/ch/' + lprev.num + '"><span class="dir">← Previous chapter</span><span class="t">' + lprev.title + "</span></a>" : "<span></span>") +
        (lnext ? '<a class="next" href="#/ch/' + lnext.num + '"><span class="dir">Next chapter →</span><span class="t">' + lnext.title + "</span></a>" : "<span></span>") +
        "</div>";
      app.innerHTML = lhtml;
      if (window.HDGate) HDGate.renderLogin($("#chapter-login"));
      return;
    }

    progress.visited[num] = true;
    saveProgress();

    var html =
      '<div class="ch-hero">' +
      '<p class="ch-meta">Chapter ' + ch.num + " · Part " + part.num + ", " + part.title + "</p>" +
      '<h1 class="' + titleClass(ch.title) + '">' + ch.title + "</h1>" +
      '<p class="intro">' + ch.blurb + "</p>" +
      (ch.optional ? '<p class="optional-note">Optional, advanced reading. Interviews rarely go this deep, so skip it on a first pass and come back when you want the depth.</p>' : "") +
      "</div>";

    ch.sections.forEach(function (sec, i) {
      html += '<section class="block">' +
              "<h2>" + sec.title + "</h2>" +
              sec.html +
              // A chapter may name a machine this course hasn't built yet;
              // draw the frame only when the machine is registered.
              (sec.viz && window.VIZ && VIZ[sec.viz]
                ? '<div class="viz" data-ui data-viz="' + sec.viz + '">' +
                  '<div class="viz-head">' + (sec.vizTitle || sec.viz) + "</div>" +
                  '<div class="viz-mount"></div></div>'
                : "") +
              "</section>";
    });

    // Key terms (tap-to-reveal flashcards)
    if (ch.terms && ch.terms.length) {
      html += '<section class="block"><h2>Key terms</h2><div class="terms">' +
        ch.terms.map(function (t) {
          return '<div class="term"><b>' + t.t + "</b><span>" + t.d + "</span></div>";
        }).join("") + "</div></section>";
    }

    // Quiz
    html += '<section class="block"><h2>Check yourself</h2><div class="quiz" id="quiz-root"></div></section>';

    // Prev / next navigation
    var prev = CHAPTERS.find(function (c) { return c.num === num - 1; });
    var next = CHAPTERS.find(function (c) { return c.num === num + 1; });
    html += '<div class="ch-nav">' +
      (prev ? '<a href="#/ch/' + prev.num + '"><span class="dir">← Previous chapter</span><span class="t">' + prev.title + "</span></a>" : "<span></span>") +
      (next ? '<a class="next" href="#/ch/' + next.num + '"><span class="dir">Next chapter →</span><span class="t">' + next.title + "</span></a>"
            : '<a class="next" href="#/"><span class="dir">Finished →</span><span class="t">Back to the map</span></a>') +
      "</div>";

    app.innerHTML = html;

    // Wire up lazy viz, terms, quiz
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

  // Course content is fetched by gate.js from the course-content Edge
  // Function. It hands us PARTS + CHAPTERS and calls this to render.
  window.HDApp = {
    boot: function () {
      CHAPTERS.sort(function (a, b) { return a.num - b.num; });
      updateProgressBar();
      route();
    }
  };
})();
