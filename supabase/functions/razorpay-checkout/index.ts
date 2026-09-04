/* ==========================================================================
   razorpay-checkout — starts a purchase and verifies the payment that comes
   back. Two endpoints in one deployable function:

     POST /functions/v1/razorpay-checkout/create-order
     POST /functions/v1/razorpay-checkout/verify-payment

   Two plans (the browser picks WHICH, never the price):
     monthly  — a Razorpay SUBSCRIPTION on a plan you create in the dashboard
                (₹499/month). Access is granted until the period end and
                extended by the subscription.charged webhook on every renewal.
     yearly   — a one-time Razorpay ORDER for YEARLY_PAISE (₹2499). Access is
                granted for one year from the payment; it lapses on its own.

   Both require the caller's Supabase access token. That token is what tells us
   WHICH user is paying, so the browser never gets to name the user — or the
   amount. Monthly's amount lives in the Razorpay plan; yearly's lives in the
   constant below. A tampered browser can't buy the course for ₹1.

   Two independent paths grant premium, and both are safe:
     - this function's verify-payment  → instant unlock after checkout
     - razorpay-webhook → the authoritative server-to-server confirmation, the
       fallback if the browser closes mid-redirect, AND the only thing that
       extends a subscription on renewal.
   Both write the same fields, so running both is idempotent.

   Env (set with `supabase secrets set`):
     RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET, RAZORPAY_PLAN_ID_MONTHLY
   Auto-injected by Supabase:
     SUPABASE_URL, SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY
   ========================================================================== */

import { verifyPaymentSignature, verifySubscriptionSignature } from "./verify.ts";

const KEY_ID = Deno.env.get("RAZORPAY_KEY_ID") ?? "";
const KEY_SECRET = Deno.env.get("RAZORPAY_KEY_SECRET") ?? "";
const MONTHLY_PLAN_ID = Deno.env.get("RAZORPAY_PLAN_ID_MONTHLY") ?? "";
const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
const ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY") ?? "";
const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

// The one-time price lives HERE, not in the browser. Keep in sync with
// PLANS.yearly in js/supabase-config.js (that copy is only for display).
const YEARLY_PAISE = 249900; // ₹2499.00
const CURRENCY = "INR";
// How long one yearly payment buys. Must match the same constant in
// razorpay-webhook — both paths grant it, whichever arrives first.
const YEAR_MS = 365 * 86400_000;
// 120 months ≈ 10 years. Razorpay requires a finite count; the member cancels
// long before this, and renewals just keep extending premium_until.
const MONTHLY_TOTAL_COUNT = 120;

const RZP_AUTH = () => `Basic ${btoa(`${KEY_ID}:${KEY_SECRET}`)}`;

const CORS = {
  "Access-Control-Allow-Origin": "*", // gated by bearer token, not cookies — safe
  "Access-Control-Allow-Headers": "authorization, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function json(status: number, body: unknown) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS, "Content-Type": "application/json" },
  });
}

/* Identify the caller from their Supabase token. RLS means this returns their
   own row and only for a valid token, so it authenticates and identifies in
   one call — the same trick course-content uses. */
async function currentUser(token: string): Promise<{ id: string; email: string } | null> {
  const res = await fetch(`${SUPABASE_URL}/auth/v1/user`, {
    headers: { apikey: ANON_KEY, Authorization: `Bearer ${token}` },
  });
  if (!res.ok) return null;
  const u = await res.json().catch(() => null);
  return u?.id ? { id: String(u.id), email: String(u.email ?? "") } : null;
}

/* premiumUntil: an ISO timestamp — the end of a subscription period, or a year
   out for the one-time yearly plan. (Older lifetime buyers still hold null,
   which means "never expires".) Readers must treat a past premium_until as
   "not premium" — see js/auth.js and course-content. */
async function grantPremium(userId: string, premiumUntil: string | null): Promise<number> {
  const res = await fetch(
    `${SUPABASE_URL}/rest/v1/profiles?id=eq.${encodeURIComponent(userId)}`,
    {
      method: "PATCH",
      headers: {
        apikey: SERVICE_ROLE,
        Authorization: `Bearer ${SERVICE_ROLE}`,
        "Content-Type": "application/json",
        Prefer: "return=representation",
      },
      body: JSON.stringify({ is_premium: true, premium_until: premiumUntil }),
    },
  );
  if (!res.ok) throw new Error(`profiles PATCH failed (${res.status})`);
  const rows = await res.json().catch(() => null);
  return Array.isArray(rows) ? rows.length : 0;
}

async function rzp(path: string, init?: RequestInit) {
  const res = await fetch(`https://api.razorpay.com/v1${path}`, {
    ...init,
    headers: { Authorization: RZP_AUTH(), "Content-Type": "application/json" },
  });
  const body = await res.json().catch(() => null);
  if (!res.ok) {
    const msg = body?.error?.description ?? `Razorpay request failed (${res.status})`;
    // 401 from Razorpay means our keys are wrong — surface that distinctly.
    throw Object.assign(new Error(msg), { status: res.status === 401 ? 401 : 500 });
  }
  return body;
}

async function createOrder(user: { id: string; email: string }) {
  if (YEARLY_PAISE < 100) throw new Error("amount below Razorpay minimum (100 paise)");

  // Receipt is capped at 40 chars by Razorpay.
  const receipt = `hd_${user.id.replace(/-/g, "").slice(0, 24)}_${Date.now() % 100000}`;

  return await rzp("/orders", {
    method: "POST",
    body: JSON.stringify({
      amount: YEARLY_PAISE,
      currency: CURRENCY,
      receipt,
      // The webhook reads these to know who paid, and that this is the
      // one-time plan, if the browser never returns.
      notes: { user_id: user.id, email: user.email, plan: "yearly" },
    }),
  });
}

async function createSubscription(user: { id: string; email: string }) {
  if (!MONTHLY_PLAN_ID) {
    throw Object.assign(
      new Error("Monthly plan is not configured yet — please use the one-time plan."),
      { status: 503 },
    );
  }
  return await rzp("/subscriptions", {
    method: "POST",
    body: JSON.stringify({
      plan_id: MONTHLY_PLAN_ID,
      total_count: MONTHLY_TOTAL_COUNT,
      customer_notify: 1,
      notes: { user_id: user.id, email: user.email, plan: "monthly" },
    }),
  });
}

/* When the current period ends, per Razorpay. A few days of grace absorbs a
   retried renewal charge so a member isn't locked out mid-retry. */
export function periodEnd(currentEnd: unknown): string {
  const secs = Number(currentEnd);
  const base = Number.isFinite(secs) && secs > 0
    ? secs * 1000
    // No current_end yet (status still "authenticated"): assume a month.
    : Date.now() + 31 * 86400_000;
  return new Date(base + 3 * 86400_000).toISOString();
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });
  if (req.method !== "POST") return json(405, { error: "Method Not Allowed" });
  if (!KEY_ID || !KEY_SECRET) return json(500, { error: "Razorpay keys not configured" });

  const token = (req.headers.get("Authorization") ?? "").replace(/^Bearer\s+/i, "");
  if (!token) return json(401, { error: "Sign in first" });
  const user = await currentUser(token);
  if (!user) return json(401, { error: "Your session expired — sign in again" });

  const action = new URL(req.url).pathname.split("/").pop();
  const body = await req.json().catch(() => ({}));

  try {
    if (action === "create-order") {
      // The browser picks the PLAN, never the price.
      const plan = body.plan === "monthly" ? "monthly" : "yearly";

      if (plan === "monthly") {
        const sub = await createSubscription(user);
        return json(200, { plan, subscription_id: sub.id, key_id: KEY_ID });
      }

      const order = await createOrder(user);
      return json(200, {
        plan,
        order_id: order.id,
        amount: order.amount,
        currency: order.currency,
        key_id: KEY_ID, // public, but saves the frontend hardcoding it twice
      });
    }

    if (action === "verify-payment") {
      const paymentId = body.razorpay_payment_id;
      const signature = body.razorpay_signature;
      const subscriptionId = body.razorpay_subscription_id;
      const orderId = body.razorpay_order_id;
      if (!paymentId || !signature || !(subscriptionId || orderId)) {
        return json(400, { error: "Missing payment fields" });
      }

      // Subscription and order checkouts sign DIFFERENT messages — see verify.ts.
      let premiumUntil: string;
      if (subscriptionId) {
        const ok = await verifySubscriptionSignature(
          paymentId, subscriptionId, signature, KEY_SECRET);
        if (!ok) return json(400, { error: "Payment signature verification failed" });
        const sub = await rzp(`/subscriptions/${encodeURIComponent(subscriptionId)}`);
        premiumUntil = periodEnd(sub?.current_end);
      } else {
        const ok = await verifyPaymentSignature(orderId, paymentId, signature, KEY_SECRET);
        // Signature mismatch → forged or tampered. Never grant.
        if (!ok) return json(400, { error: "Payment signature verification failed" });
        premiumUntil = new Date(Date.now() + YEAR_MS).toISOString();
      }

      const updated = await grantPremium(user.id, premiumUntil);
      if (updated === 0) return json(404, { error: "No profile found for your account" });
      return json(200, { verified: true, premium_until: premiumUntil });
    }

    return json(404, { error: "Unknown endpoint" });
  } catch (err) {
    const status = (err as { status?: number }).status ?? 500;
    return json(status, { error: (err as Error).message ?? "Payment error" });
  }
});
