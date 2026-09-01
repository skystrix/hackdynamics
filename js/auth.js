/* ==========================================================================
   auth.js — a tiny Supabase Auth client, hand-rolled on fetch (no SDK, no CDN).

   Supabase Auth (GoTrue) and the database are plain REST APIs, so all we need
   is fetch(). Exposes window.HDAuth with promise-based methods. The session
   (access + refresh tokens) is persisted in localStorage and auto-refreshed.

   IMPORTANT (read me): this gates the course UI and checks a server-enforced
   `is_premium` flag, but the course CONTENT is static JS files that anyone can
   fetch directly. Real content protection means serving chapters from a
   backend that checks entitlement — the natural next step with payments.
   ========================================================================== */
(function () {
  "use strict";

  var SESSION_KEY = "hd-session";

  function cfg() { return window.HD_CONFIG; }
  function authUrl(path) { return cfg().SUPABASE_URL + "/auth/v1" + path; }
  function restUrl(path) { return cfg().SUPABASE_URL + "/rest/v1" + path; }

  function readSession() {
    try { return JSON.parse(localStorage.getItem(SESSION_KEY)) || null; }
    catch (e) { return null; }
  }
  function writeSession(s) {
    if (s) localStorage.setItem(SESSION_KEY, JSON.stringify(s));
    else localStorage.removeItem(SESSION_KEY);
  }

  // Normalize GoTrue's session shape and stamp an absolute expiry (seconds).
  function normalize(data) {
    if (!data || !data.access_token) return null;
    var expiresAt = data.expires_at ||
      (Math.floor(Date.now() / 1000) + (data.expires_in || 3600));
    return {
      access_token: data.access_token,
      refresh_token: data.refresh_token,
      expires_at: expiresAt,
      user: data.user || (data.user === null ? null : data.user)
    };
  }

  // Shared fetch wrapper: attaches apikey, parses JSON, throws readable errors.
  function api(url, opts, bearer) {
    opts = opts || {};
    var headers = Object.assign({
      "apikey": cfg().SUPABASE_ANON_KEY,
      "Content-Type": "application/json"
    }, opts.headers || {});
    if (bearer) headers["Authorization"] = "Bearer " + bearer;
    return fetch(url, Object.assign({}, opts, { headers: headers }))
      .then(function (res) {
        return res.text().then(function (text) {
          var body = text ? JSON.parse(text) : null;
          if (!res.ok) {
            var msg = (body && (body.error_description || body.msg ||
              body.message || body.error)) || ("Request failed (" + res.status + ")");
            var err = new Error(msg); err.status = res.status; throw err;
          }
          return body;
        });
      });
  }

  var HDAuth = {
    isConfigured: function () { return cfg() && cfg().isConfigured(); },

    /** Create an account. Returns { session, needsEmailConfirm }. */
    signUp: function (email, password) {
      return api(authUrl("/signup"), {
        method: "POST",
        body: JSON.stringify({ email: email, password: password })
      }).then(function (data) {
        var session = normalize(data);
        if (session) { writeSession(session); return { session: session, needsEmailConfirm: false }; }
        // No session back ⇒ email confirmation is required for this project.
        return { session: null, needsEmailConfirm: true };
      });
    },

    /** Log in with email + password. Returns the session. */
    signIn: function (email, password) {
      return api(authUrl("/token?grant_type=password"), {
        method: "POST",
        body: JSON.stringify({ email: email, password: password })
      }).then(function (data) {
        var session = normalize(data);
        writeSession(session);
        return session;
      });
    },

    /** Email a password-reset link. The link returns to `redirectTo` (this page)
        with a recovery access_token in the URL hash. */
    requestPasswordReset: function (email, redirectTo) {
      var q = redirectTo ? "?redirect_to=" + encodeURIComponent(redirectTo) : "";
      return api(authUrl("/recover" + q), {
        method: "POST",
        body: JSON.stringify({ email: email })
      });
    },

    /** Set a new password. Pass the recovery token from the reset link's hash;
        falls back to the current session for a logged-in user. */
    updatePassword: function (newPassword, recoveryToken) {
      var run = recoveryToken
        ? Promise.resolve(recoveryToken)
        : HDAuth.getSession().then(function (s) { return s && s.access_token; });
      return run.then(function (token) {
        if (!token) throw new Error("Your reset link has expired. Request a new one.");
        return api(authUrl("/user"), {
          method: "PUT",
          body: JSON.stringify({ password: newPassword })
        }, token);
      });
    },

    signOut: function () {
      var s = readSession();
      writeSession(null);
      if (!s) return Promise.resolve();
      return api(authUrl("/logout"), { method: "POST" }, s.access_token)
        .catch(function () { /* local logout already happened; ignore */ });
    },

    /** Refresh an expired access token using the stored refresh token. */
    refresh: function () {
      var s = readSession();
      if (!s || !s.refresh_token) return Promise.resolve(null);
      return api(authUrl("/token?grant_type=refresh_token"), {
        method: "POST",
        body: JSON.stringify({ refresh_token: s.refresh_token })
      }).then(function (data) {
        var session = normalize(data);
        writeSession(session);
        return session;
      }).catch(function () { writeSession(null); return null; });
    },

    /** A valid session (refreshing if near expiry), or null. */
    getSession: function () {
      var s = readSession();
      if (!s) return Promise.resolve(null);
      var now = Math.floor(Date.now() / 1000);
      if (s.expires_at && s.expires_at - now < 60) return HDAuth.refresh();
      return Promise.resolve(s);
    },

    /** Read the signed-in user's profile row (id, email, is_premium). */
    getProfile: function () {
      return HDAuth.getSession().then(function (s) {
        if (!s) return null;
        var uid = s.user && s.user.id;
        var q = "/profiles?select=id,email,is_premium" + (uid ? "&id=eq." + uid : "") + "&limit=1";
        return api(restUrl(q), { method: "GET" }, s.access_token)
          .then(function (rows) { return (rows && rows[0]) || null; });
      });
    },

    /** Resolve to { session, profile, isPremium } — the one call gates use. */
    status: function () {
      return HDAuth.getSession().then(function (session) {
        if (!session) return { session: null, profile: null, isPremium: false };
        return HDAuth.getProfile().then(function (profile) {
          return { session: session, profile: profile, isPremium: !!(profile && profile.is_premium) };
        }).catch(function () {
          return { session: session, profile: null, isPremium: false };
        });
      });
    }
  };

  window.HDAuth = HDAuth;
})();
