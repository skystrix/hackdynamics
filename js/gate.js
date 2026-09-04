/* ==========================================================================
   gate.js — course loader + upgrade flow.

   The course page is now open to everyone: we always fetch from the
   course-content Edge Function (with the signed-in user's token when there is
   one, without it otherwise) and reveal the page. What comes back is already
   gated server-side — premium members get every chapter, everyone else gets
   the free chapters in full plus locked stubs for the rest. So there is no
   whole-page paywall here anymore; the lock lives on individual chapters, and
   app.js calls HDGate.renderUpgrade() to draw the upgrade CTA inside a locked
   chapter. (Real protection is the Edge Function — see its header.)
   ========================================================================== */
(function () {
  "use strict";

  var gate = document.getElementById("auth-gate");
  var cfg = window.HD_CONFIG;
  // Which course this shell page serves (see js/app.js). "db" is the original
  // Databases in Depth page, which predates the field.
  var COURSE = window.HD_COURSE || {};
  var COURSE_KEY = COURSE.key || "db";
  var COURSE_TITLE = COURSE.title || "Databases in Depth";
  var UNLOCK_LINE = COURSE.unlockLine ||
    "all 32 chapters, every interactive machine, and the full " +
    "build-your-own-database capstone";
  var STATUS = null; // resolved auth status, shared with app.js via HDGate

  function show(html) { if (gate) gate.innerHTML = html; }

  function reveal(status) {
    if (gate && gate.parentNode) gate.parentNode.removeChild(gate);
    document.body.classList.remove("gated");
    accountChip(status);
  }

  // Top-bar account chip: log-in link for guests, email + log-out otherwise,
  // with a ✦ premium marker for members.
  function accountChip(status) {
    var slot = document.getElementById("account");
    if (!slot) return;
    if (!status || !status.session) {
      slot.innerHTML = '<a href="' + loginHref() + '">Log in</a>';
      return;
    }
    var email = (status.profile && status.profile.email) ||
      (status.session.user && status.session.user.email) || "";
    slot.innerHTML =
      (status.isPremium ? '<span title="' + escapeHtml(email) + '">✦ premium</span>' : "") +
      '<button id="account-logout">Log out</button>';
    var out = document.getElementById("account-logout");
    if (out) out.addEventListener("click", function () {
      HDAuth.signOut().then(function () { location.reload(); });
    });
  }

  // Fetch the course text. Passes the token when signed in so premium members
  // get the full payload; a guest request goes tokenless and gets the preview.
  function loadCourse(session) {
    var headers = session ? { "Authorization": "Bearer " + session.access_token } : {};
    return fetch(cfg.SUPABASE_URL + "/functions/v1/course-content?course=" +
      encodeURIComponent(COURSE_KEY), { headers: headers })
      .then(function (res) {
        if (!res.ok) throw new Error("Could not load course content (" + res.status + ").");
        return res.json();
      }).then(function (data) {
        window.PARTS = data.PARTS;
        window.CHAPTERS = data.CHAPTERS;
      });
  }

  function loginHref(nextHash) {
    return cfg.LOGIN_URL + "?next=" +
      encodeURIComponent(location.pathname.split("/").pop() + (nextHash || location.hash));
  }

  // Not wired up yet: tell the developer, don't pretend to work.
  if (!window.HDAuth || !HDAuth.isConfigured()) {
    show(
      '<div class="gate-card">' +
        '<div class="gate-brand">HACK<b>DYNAMICS</b></div>' +
        '<h1>Almost there</h1>' +
        '<p>Sign-in isn\'t configured yet. Add your Supabase keys in ' +
        '<code>js/supabase-config.js</code> and run the SQL in ' +
        '<code>SUPABASE_SETUP.md</code>, then reload.</p>' +
      '</div>'
    );
    return;
  }

  show('<div class="gate-card"><div class="gate-spinner"></div><p>Loading the course…</p></div>');

  HDAuth.status().then(function (st) {
    STATUS = st;
    return loadCourse(st.session).then(function () {
      reveal(st);
      window.HDApp.boot();
    });
  }).catch(function (err) {
    show(
      '<div class="gate-card"><h1>Couldn\'t load the course</h1>' +
      '<p>' + escapeHtml(err.message || "Please try again.") + '</p>' +
      '<div class="gate-links"><a href="#" id="gate-retry">Retry</a>' +
      '<a href="index.html">Home</a></div></div>'
    );
    var r = document.getElementById("gate-retry");
    if (r) r.addEventListener("click", function (e) { e.preventDefault(); location.reload(); });
  });

  /* ---------- upgrade CTA for a locked chapter (called by app.js) ---------- */
  // Renders into `container`. Guests are pointed to log in first (checkout needs
  // an account); signed-in non-members get the two plan buttons + Razorpay.
  function renderUpgrade(container) {
    if (!container) return;
    var st = STATUS;
    var plans = (cfg.PLANS) || {};
    var monthly = plans.monthly || { label: "₹499 / month" };
    var yearly = plans.yearly || { label: "₹2499 for 1 year" };

    if (!st || !st.session) {
      container.innerHTML =
        '<div class="gate-card gate-inline">' +
          '<span class="gate-tag">PREMIUM CHAPTER</span>' +
          '<h1>This chapter is for members</h1>' +
          '<p>Some chapters are free. Log in or create a free account to ' +
          'unlock ' + UNLOCK_LINE + '.</p>' +
          '<a class="gate-btn" href="' + loginHref("#/") + '">Log in to unlock</a>' +
          '<div class="gate-links"><a href="' + (cfg.PRICING_URL || "pricing.html") + '">Compare plans</a></div>' +
        '</div>';
      return;
    }

    var email = (st.profile && st.profile.email) || (st.session.user && st.session.user.email) || "";
    container.innerHTML =
      '<div class="gate-card gate-inline">' +
        '<span class="gate-tag">PREMIUM CHAPTER</span>' +
        '<h1>Unlock the full course</h1>' +
        '<p>You\'re signed in as <strong>' + escapeHtml(email) + '</strong>. ' +
        'Either plan unlocks every course on HackDynamics, including ' +
        UNLOCK_LINE + '.</p>' +
        '<button class="gate-btn" data-plan="monthly">Subscribe — ' + escapeHtml(monthly.label) + '</button>' +
        '<button class="gate-btn gate-btn-alt" data-plan="yearly">Best value — ' + escapeHtml(yearly.label) + '</button>' +
        '<p class="gate-fine" id="gate-pay-msg"></p>' +
        '<div class="gate-links"><a href="' + (cfg.PRICING_URL || "pricing.html") + '">Compare plans</a></div>' +
      '</div>';
    container.querySelectorAll("[data-plan]").forEach(function (b) {
      b.addEventListener("click", function () {
        startCheckout(st, container, b, b.getAttribute("data-plan"));
      });
    });
  }

  window.HDGate = { renderUpgrade: renderUpgrade, status: function () { return STATUS; } };

  /* ---------- Razorpay Standard Checkout ----------------------------------
     The browser names the PLAN, never the price or the payer: create-order
     derives both from the caller's Supabase token server-side. It returns
     either an order (one-time) or a subscription (monthly); we open the modal
     with whichever came back and hand the signed result back for verification.
     The razorpay-webhook is the backstop if the browser dies mid-payment, and
     the only thing that extends a subscription on renewal. */
  function startCheckout(st, container, btn, plan) {
    var msg = container.querySelector("#gate-pay-msg");
    var buttons = [].slice.call(container.querySelectorAll("[data-plan]"));
    function say(text) { if (msg) msg.textContent = text || ""; }
    // Disable BOTH plan buttons while one checkout is in flight — two open
    // Razorpay modals would race to grant the same account two products.
    function busy(on) { buttons.forEach(function (b) { b.disabled = on; }); }
    function reset(text) { busy(false); btn.textContent = label; say(text); }

    var label = btn.textContent;
    if (typeof Razorpay === "undefined") {
      say("Checkout didn't load. Check your connection and reload.");
      return;
    }

    busy(true);
    btn.textContent = "Starting checkout…";
    say("");

    api("create-order", st.session.access_token, { plan: plan }).then(function (order) {
      btn.textContent = label;
      // A subscription opens with subscription_id and no amount (the Razorpay
      // plan carries that); a one-time buy opens with order_id + amount.
      var opts = order.subscription_id
        ? { subscription_id: order.subscription_id }
        : { order_id: order.order_id, amount: order.amount, currency: order.currency };
      opts.key = order.key_id || cfg.RAZORPAY_KEY_ID;
      opts.name = "HackDynamics";
      opts.description = COURSE_TITLE +
        (order.subscription_id ? " — monthly membership" : " — 1 year access");
      opts.prefill = { email: (st.profile && st.profile.email) ||
        (st.session.user && st.session.user.email) || "" };
      opts.modal = {
        ondismiss: function () { reset("Payment cancelled — nothing was charged."); }
      };
      opts.handler = function (res) {
        busy(true);
        btn.textContent = "Confirming payment…";
        say("");
        api("verify-payment", st.session.access_token, {
          razorpay_order_id: res.razorpay_order_id,
          razorpay_subscription_id: res.razorpay_subscription_id,
          razorpay_payment_id: res.razorpay_payment_id,
          razorpay_signature: res.razorpay_signature
        }).then(function () {
          btn.textContent = "Unlocked — loading your course…";
          location.reload(); // reloads with a premium token → full payload
        }).catch(function (err) {
          // Payment went through; only our confirmation failed. The webhook
          // still grants premium, so tell them to reload rather than re-pay.
          reset((err.message || "Could not confirm the payment.") +
            " Your payment may still have gone through — reload in a moment " +
            "before trying again.");
        });
      };

      var rzp = new Razorpay(opts);
      rzp.on("payment.failed", function (e) {
        var d = (e && e.error && e.error.description) || "The payment failed.";
        reset(d + " Nothing was charged.");
      });
      rzp.open();
    }).catch(function (err) {
      reset(err.message || "Could not start checkout. Please try again.");
    });
  }

  function api(path, token, body) {
    return fetch(cfg.SUPABASE_URL + "/functions/v1/razorpay-checkout/" + path, {
      method: "POST",
      headers: {
        "Authorization": "Bearer " + token,
        "Content-Type": "application/json"
      },
      body: JSON.stringify(body || {})
    }).then(function (res) {
      return res.json().catch(function () { return {}; }).then(function (data) {
        if (!res.ok) throw new Error(data.error || ("Request failed (" + res.status + ")"));
        return data;
      });
    });
  }

  function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }
})();
