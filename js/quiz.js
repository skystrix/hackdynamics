/* ==========================================================================
   quiz.js — knowledge-check engine
   Question types:
     mc    — multiple choice           {type:"mc", q, opts:[...], a:index, why}
     blank — fill in the blank         {type:"blank", q, a:"answer" | [answers], why}
     order — click items in sequence   {type:"order", q, items:[in correct order], why}
   Instant feedback per question, score summary, confetti on a strong score.
   ========================================================================== */

(function () {
  "use strict";

  var Quiz = {};

  /* Render a quiz into `root`. onDone(score) fires when all questions answered. */
  Quiz.mount = function (root, questions, onDone) {
    var answered = 0, score = 0;

    function questionDone(correct) {
      answered++;
      if (correct) score++;
      if (answered === questions.length) finish();
    }

    function finish() {
      var pct = score / questions.length;
      var msg = pct === 1 ? "Every one right."
              : pct >= 0.7 ? "Most of it is in. Read the explanations on the ones you missed."
              : "Worth a second read of this chapter, then try again.";
      var div = document.createElement("div");
      div.className = "result";
      div.innerHTML = "<b>" + score + " / " + questions.length + "</b><br>" + msg;
      root.appendChild(div);
      div.scrollIntoView({ behavior: "smooth", block: "nearest" });
      if (pct >= 0.7) confetti();
      if (onDone) onDone(score);
    }

    questions.forEach(function (q, i) {
      var card = document.createElement("div");
      card.className = "q-card";
      card.innerHTML = '<div class="q-num">Question ' + (i + 1) + " of " + questions.length + "</div>" +
                       '<div class="q-text">' + q.q + "</div>";
      var why = document.createElement("div");
      why.className = "why";
      why.textContent = q.why || "";

      var type = q.type || "mc";
      if (type === "mc") mountMC(card, q, why, questionDone);
      else if (type === "blank") mountBlank(card, q, why, questionDone);
      else if (type === "order") mountOrder(card, q, why, questionDone);

      card.appendChild(why);
      root.appendChild(card);
    });
  };

  /* --- multiple choice: click an option, see right/wrong immediately --- */
  function mountMC(card, q, why, done) {
    var wrap = document.createElement("div");
    wrap.className = "opts";
    q.opts.forEach(function (opt, idx) {
      var b = document.createElement("button");
      b.className = "opt";
      b.textContent = opt;
      b.addEventListener("click", function () {
        wrap.querySelectorAll(".opt").forEach(function (o, j) {
          o.disabled = true;
          if (j === q.a) o.classList.add("correct");
        });
        if (idx !== q.a) b.classList.add("wrong");
        why.classList.add("show");
        done(idx === q.a);
      });
      wrap.appendChild(b);
    });
    card.appendChild(wrap);
  }

  /* --- fill in the blank: free text, case/whitespace-insensitive match --- */
  function mountBlank(card, q, why, done) {
    var answers = Array.isArray(q.a) ? q.a : [q.a];
    var input = document.createElement("input");
    input.className = "blank-input";
    input.type = "text";
    input.placeholder = "type your answer…";
    var btn = document.createElement("button");
    btn.textContent = "Check";
    btn.style.marginLeft = "8px";
    function check() {
      var v = input.value.trim().toLowerCase().replace(/[\s_-]+/g, " ");
      var ok = answers.some(function (a) {
        return v === a.toLowerCase().replace(/[\s_-]+/g, " ");
      });
      input.disabled = true; btn.disabled = true;
      input.style.borderColor = ok ? "var(--green)" : "var(--red)";
      if (!ok) why.textContent = "Answer: “" + answers[0] + "”. " + (q.why || "");
      why.classList.add("show");
      done(ok);
    }
    btn.addEventListener("click", check);
    input.addEventListener("keydown", function (e) { if (e.key === "Enter") check(); });
    card.appendChild(input);
    card.appendChild(btn);
  }

  /* --- ordering: items shown shuffled; click them in the correct sequence --- */
  function mountOrder(card, q, why, done) {
    var correct = q.items;                      // items[] given in correct order
    var shuffled = correct.slice();
    do {                                        // shuffle until actually reordered
      for (var i = shuffled.length - 1; i > 0; i--) {
        var j = Math.floor(Math.random() * (i + 1));
        var t = shuffled[i]; shuffled[i] = shuffled[j]; shuffled[j] = t;
      }
    } while (shuffled.join() === correct.join() && correct.length > 1);

    var picked = [];
    var hint = document.createElement("div");
    hint.className = "q-num";
    hint.textContent = "Tap the steps in order, first to last.";
    card.appendChild(hint);

    shuffled.forEach(function (item) {
      var b = document.createElement("button");
      b.className = "order-item";
      b.innerHTML = '<span class="seq"></span>' + item;
      b.addEventListener("click", function () {
        if (b.classList.contains("picked")) return;
        picked.push(item);
        b.classList.add("picked");
        b.querySelector(".seq").textContent = picked.length + ".";
        if (picked.length === correct.length) {
          var ok = picked.join() === correct.join();
          card.querySelectorAll(".order-item").forEach(function (o, k) {
            o.disabled = true;
            o.style.borderColor = ok ? "var(--green)" : "var(--red)";
          });
          if (!ok) why.textContent = "Correct order: " + correct.join(" → ") + ". " + (q.why || "");
          why.classList.add("show");
          done(ok);
        }
      });
      card.appendChild(b);
    });
  }

  /* --- confetti: short celebratory burst on a canvas overlay --- */
  function confetti() {
    var cv = document.createElement("canvas");
    cv.id = "confetti";
    cv.width = innerWidth; cv.height = innerHeight;
    document.body.appendChild(cv);
    var ctx = cv.getContext("2d");
    // sticker palette (DESIGN-notion.md) — confetti is exactly what it's for
    var colors = ["#0075de", "#ff64c8", "#dd5b00", "#2a9d99", "#1aae39", "#d6b6f6", "#62aef0"];
    var parts = [];
    for (var i = 0; i < 130; i++) {
      parts.push({
        x: innerWidth / 2, y: innerHeight * 0.35,
        vx: (Math.random() - 0.5) * 13,
        vy: Math.random() * -11 - 3,
        s: Math.random() * 6 + 3,
        c: colors[i % colors.length],
        r: Math.random() * Math.PI
      });
    }
    var frames = 0;
    (function tick() {
      ctx.clearRect(0, 0, cv.width, cv.height);
      parts.forEach(function (p) {
        p.x += p.vx; p.y += p.vy; p.vy += 0.32; p.r += 0.1;
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.r);
        ctx.fillStyle = p.c;
        ctx.fillRect(-p.s / 2, -p.s / 2, p.s, p.s * 0.6);
        ctx.restore();
      });
      if (++frames < 110) requestAnimationFrame(tick);
      else cv.remove();
    })();
  }

  window.Quiz = Quiz;
})();
