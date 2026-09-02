/* ==========================================================================
   gate.js — the course paywall. Runs on the course page, decides whether to
   reveal the content, send the visitor to log in, or show an upgrade wall.

   Reveals content ONLY for a signed-in user whose server-side profile has
   is_premium = true. (Remember: this gates the UI; the static JS content is
   still directly fetchable — see auth.js for why real protection is a backend
   concern for the payments step.)
   ========================================================================== */
(function () {
  "use strict";

  var gate = document.getElementById("auth-gate");
  var cfg = window.HD_CONFIG;

  function show(html) { if (gate) gate.innerHTML = html; }

  function reveal(status) {
    if (gate) gate.parentNode.removeChild(gate);
    document.body.classList.remove("gated");
    // Populate the top-bar account chip with a log-out control.
    var slot = document.getElementById("account");
    if (slot && status) {
      var email = (status.profile && status.profile.email) ||
        (status.session && status.session.user && status.session.user.email) || "";
      slot.innerHTML = '<span title="' + escapeHtml(email) + '">✦ premium</span>' +
        '<button id="account-logout">Log out</button>';
      var out = document.getElementById("account-logout");
      if (out) out.addEventListener("click", function () {
        HDAuth.signOut().then(function () { location.replace(cfg.LOGIN_URL); });
      });
    }
  }

  // Fetch the paid course text from the course-content Edge Function using the
  // signed-in user's token, and hand it to app.js. The server returns it only
  // for premium members, so this is also where a lapsed/forged session fails.
  function loadCourse(session) {
    return fetch(cfg.SUPABASE_URL + "/functions/v1/course-content", {
      headers: { "Authorization": "Bearer " + session.access_token }
    }).then(function (res) {
      if (!res.ok) throw new Error("Could not load course content (" + res.status + ").");
      return res.json();
    }).then(function (data) {
      window.PARTS = data.PARTS;
      window.CHAPTERS = data.CHAPTERS;
    });
  }

  function loginBtn(label) {
    return '<a class="gate-btn" href="' + cfg.LOGIN_URL +
      '?next=' + encodeURIComponent(location.pathname.split("/").pop() + location.hash) +
      '">' + (label || "Log in") + '</a>';
  }

  // Not wired up yet: tell the developer, don't pretend to be secure.
  if (!window.HDAuth || !HDAuth.isConfigured()) {
    show(
      '<div class="gate-card">' +
        '<div class="gate-brand">HACK<b>DYNAMICS</b></div>' +
        '<h1>Almost there</h1>' +
        '<p>Sign-in isn\'t configured yet. Add your Supabase keys in ' +
        '<code>js/supabase-config.js</code> and run the SQL in ' +
        '<code>SUPABASE_SETUP.md</code>, then reload.</p>' +
        '<p class="gate-fine">Until then the paywall stays closed.</p>' +
      '</div>'
    );
    return;
  }

  show('<div class="gate-card"><div class="gate-spinner"></div><p>Checking your access…</p></div>');

  HDAuth.status().then(function (st) {
    if (!st.session) {
      // Not logged in → straight to the login page, remembering where to return.
      location.replace(cfg.LOGIN_URL +
        "?next=" + encodeURIComponent(location.pathname.split("/").pop() + location.hash));
      return;
    }
    if (st.isPremium) {
      show('<div class="gate-card"><div class="gate-spinner"></div><p>Unlocking the course…</p></div>');
      loadCourse(st.session).then(function () {
        reveal(st);
        window.HDApp.boot();
      }).catch(function (err) {
        show('<div class="gate-card"><h1>Couldn\'t load the course</h1>' +
          '<p>' + escapeHtml(err.message || "Please try again.") + '</p>' +
          '<div class="gate-links"><a href="#" id="gate-retry">Retry</a>' +
          '<a href="index.html">Home</a></div></div>');
        var r = document.getElementById("gate-retry");
        if (r) r.addEventListener("click", function (e) { e.preventDefault(); location.reload(); });
      });
      return;
    }

    // Logged in, but hasn't paid — the upgrade wall. Two plans, one button each.
    var email = (st.profile && st.profile.email) || (st.session.user && st.session.user.email) || "";
    var plans = (cfg.PLANS) || {};
    var monthly = plans.monthly || { label: "\u20b9299 / month" };
    var lifetime = plans.lifetime || { label: "\u20b91999 one-time" };
    show(
      '<div class="gate-card">' +
        '<div class="gate-brand">HACK<b>DYNAMICS</b></div>' +
        '<span class="gate-tag">PREMIUM COURSE</span>' +
        '<h1>Databases in Depth</h1>' +
        '<p>You\'re signed in as <strong>' + escapeHtml(email) + '</strong>, but this ' +
        'course is for premium members. Either plan unlocks all 32 chapters, every ' +
        'interactive machine, and the full build-your-own-database capstone.</p>' +
        '<button class="gate-btn" id="gate-monthly" data-plan="monthly">Subscribe — ' +
        escapeHtml(monthly.label) + '</button>' +
        '<button class="gate-btn gate-btn-alt" id="gate-lifetime" data-plan="lifetime">Buy once — ' +
        escapeHtml(lifetime.label) + '</button>' +
        '<p class="gate-fine" id="gate-pay-msg"></p>' +
        '<div class="gate-links"><a href="' + (cfg.PRICING_URL || "pricing.html") + '">Compare plans</a>' +
        '<a href="#" id="gate-logout">Log out</a></div>' +
      '</div>'
    );
    ["gate-monthly", "gate-lifetime"].forEach(function (id) {
      var b = document.getElementById(id);
      if (b) b.addEventListener("click", function () {
        startCheckout(st, b, b.getAttribute("data-plan"));
      });
    });
    var out = document.getElementById("gate-logout");
    if (out) out.addEventListener("click", function (e) {
      e.preventDefault();
      HDAuth.signOut().then(function () { location.replace(cfg.LOGIN_URL); });
    });
  }).catch(function (err) {
    show(
      '<div class="gate-card"><h1>Something went wrong</h1>' +
      '<p>' + escapeHtml(err.message || "Could not verify your access.") + '</p>' +
      '<div class="gate-links">' + loginBtn("Try logging in") +
      '<a href="index.html">Home</a></div></div>'
    );
  });

  /* ---------- Razorpay Standard Checkout ----------------------------------
     The browser names the PLAN, never the price or the payer: create-order
     derives both from the caller's Supabase token server-side. It returns
     either an order (one-time) or a subscription (monthly); we open the modal
     with whichever came back and hand the signed result back for verification.
     The razorpay-webhook is the backstop if the browser dies mid-payment, and
     the only thing that extends a subscription on renewal. */
  function startCheckout(st, btn, plan) {
    var msg = document.getElementById("gate-pay-msg");
    var buttons = [].slice.call(document.querySelectorAll("[data-plan]"));
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
      opts.description = order.subscription_id
        ? "Databases in Depth — monthly membership"
        : "Databases in Depth — lifetime access";
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
          location.reload(); // gate re-runs and now sees an active membership
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
