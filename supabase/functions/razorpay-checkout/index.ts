/* ==========================================================================
   razorpay-checkout — creates Razorpay orders and verifies the payment that
   comes back. Two endpoints in one deployable function:

     POST /functions/v1/razorpay-checkout/create-order
     POST /functions/v1/razorpay-checkout/verify-payment

   Both require the caller's Supabase access token. That token is what tells us
   WHICH user is paying, so the browser never gets to name the user — or the
   price. The amount is the PRICE_PAISE constant below, server-side only; a
   tampered browser can't buy the course for ₹1.

   Two independent paths grant premium, and both are safe:
     - this function's verify-payment  → instant unlock after checkout
     - razorpay-webhook (payment.captured) → the authoritative server-to-server
       confirmation, and the fallback if the browser closes mid-redirect
   Both just set is_premium = true, so running both is idempotent.

   Env (set with `supabase secrets set`):
     RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET
   Auto-injected by Supabase:
     SUPABASE_URL, SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY
   ========================================================================== */

import { verifyPaymentSignature } from "./verify.ts";

const KEY_ID = Deno.env.get("RAZORPAY_KEY_ID") ?? "";
const KEY_SECRET = Deno.env.get("RAZORPAY_KEY_SECRET") ?? "";
const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
const ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY") ?? "";
const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

// The price lives HERE, not in the browser. Keep in sync with PRICE_PAISE in
// js/supabase-config.js (that copy is only for display).
const PRICE_PAISE = 49900; // ₹499.00
const CURRENCY = "INR";

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

async function grantPremium(userId: string): Promise<number> {
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
      body: JSON.stringify({ is_premium: true }),
    },
  );
  if (!res.ok) throw new Error(`profiles PATCH failed (${res.status})`);
  const rows = await res.json().catch(() => null);
  return Array.isArray(rows) ? rows.length : 0;
}

async function createOrder(user: { id: string; email: string }) {
  if (PRICE_PAISE < 100) throw new Error("amount below Razorpay minimum (100 paise)");

  // Receipt is capped at 40 chars by Razorpay.
  const receipt = `hd_${user.id.replace(/-/g, "").slice(0, 24)}_${Date.now() % 100000}`;

  const res = await fetch("https://api.razorpay.com/v1/orders", {
    method: "POST",
    headers: {
      Authorization: `Basic ${btoa(`${KEY_ID}:${KEY_SECRET}`)}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      amount: PRICE_PAISE,
      currency: CURRENCY,
      receipt,
      // The webhook reads these to know who paid if the browser never returns.
      notes: { user_id: user.id, email: user.email },
    }),
  });

  const order = await res.json().catch(() => null);
  if (!res.ok) {
    const msg = order?.error?.description ?? `Razorpay order failed (${res.status})`;
    // 401 from Razorpay means our keys are wrong — surface that distinctly.
    throw Object.assign(new Error(msg), { status: res.status === 401 ? 401 : 500 });
  }
  return order;
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

  try {
    if (action === "create-order") {
      const order = await createOrder(user);
      return json(200, {
        order_id: order.id,
        amount: order.amount,
        currency: order.currency,
        key_id: KEY_ID, // public, but saves the frontend hardcoding it twice
      });
    }

    if (action === "verify-payment") {
      const body = await req.json().catch(() => ({}));
      const orderId = body.razorpay_order_id;
      const paymentId = body.razorpay_payment_id;
      const signature = body.razorpay_signature;
      if (!orderId || !paymentId || !signature) {
        return json(400, { error: "Missing payment fields" });
      }

      const ok = await verifyPaymentSignature(orderId, paymentId, signature, KEY_SECRET);
      // Signature mismatch → forged or tampered. Never grant.
      if (!ok) return json(400, { error: "Payment signature verification failed" });

      const updated = await grantPremium(user.id);
      if (updated === 0) return json(404, { error: "No profile found for your account" });
      return json(200, { verified: true });
    }

    return json(404, { error: "Unknown endpoint" });
  } catch (err) {
    const status = (err as { status?: number }).status ?? 500;
    return json(status, { error: (err as Error).message ?? "Payment error" });
  }
});
