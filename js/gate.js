/* ==========================================================================
   gate.js — course loader.

   Fetches the course from the course-content Edge Function (with the
   signed-in user's token when there is one) and reveals the page. Today every
   caller gets every chapter. If login-only chapters come back, they arrive as
   locked stubs and app.js calls HDGate.renderLogin() inside them.
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

  // Top-bar account chip: log-in link for guests, email + log-out otherwise.
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
      '<span>' + escapeHtml(email) + '</span>' +
      '<button id="account-logout">Log out</button>';
    var out = document.getElementById("account-logout");
    if (out) out.addEventListener("click", function () {
      HDAuth.signOut().then(function () { location.reload(); });
    });
  }

  // Fetch the course text. Passes the token when signed in, so login-only
  // chapters can be served later; today everyone gets every chapter.
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
        '<div class="gate-brand">HackDynamics</div>' +
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

  /* ---------- sign-in card for a locked chapter (called by app.js) ---------- */
  // Nothing is locked while everything is public; this is for login-only
  // chapters later, which course-content would send to signed-out callers.
  function renderLogin(container) {
    if (!container) return;
    container.innerHTML =
      '<div class="gate-card gate-inline">' +
        '<span class="gate-tag">Sign-in chapter</span>' +
        '<h1>Sign in to read this chapter</h1>' +
        '<p>Create a free account or log in to read ' + UNLOCK_LINE + '.</p>' +
        '<a class="gate-btn" href="' + loginHref("#/") + '">Log in</a>' +
      '</div>';
  }

  window.HDGate = { renderLogin: renderLogin, status: function () { return STATUS; } };

  /* ---------- Razorpay Standard Checkout ----------------------------------
     Not wired to any button right now: kept for the donations page.
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
