/* ==========================================================================
   razorpay-webhook — grants and RENEWS premium after a verified Razorpay event.

   Razorpay calls this URL server-to-server. We NEVER trust the browser for
   "payment succeeded" — this webhook is the authoritative grant, and only after
   verifying Razorpay's HMAC signature.

   Two products arrive here:
     payment.captured / order.paid  → the ONE-YEAR plan (₹2499). Grants
       is_premium with premium_until one year out.
     subscription.charged           → the MONTHLY plan (₹499). Fires on the
       first charge AND on every renewal; each time we push premium_until out
       to the new period end. Miss a renewal and access lapses on its own —
       which is exactly what we want, so subscription.cancelled/halted need no
       handling at all.

   Flow:
     1. Checkout runs in the browser with notes.user_id = <supabase uid>.
     2. Razorpay POSTs the event here with an x-razorpay-signature.
     3. We verify HMAC-SHA256(rawBody, RAZORPAY_WEBHOOK_SECRET) == that header.
     4. We PATCH profiles (service_role, bypasses RLS).

   Env (set with `supabase secrets set`):
     RAZORPAY_WEBHOOK_SECRET   — Dashboard → Settings → Webhooks → your secret
   Auto-injected by Supabase:
     SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
   ========================================================================== */

import { verifySignature } from "./verify.ts";

const WEBHOOK_SECRET = Deno.env.get("RAZORPAY_WEBHOOK_SECRET") ?? "";
const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

// How long one yearly payment buys. Must match YEAR_MS in razorpay-checkout —
// both paths grant it, whichever arrives first.
const YEAR_MS = 365 * 86400_000;

// Same 3-day grace as razorpay-checkout: absorbs a retried renewal charge.
function periodEnd(currentEnd: unknown): string {
  const secs = Number(currentEnd);
  const base = Number.isFinite(secs) && secs > 0
    ? secs * 1000
    : Date.now() + 31 * 86400_000;
  return new Date(base + 3 * 86400_000).toISOString();
}

async function grantPremium(
  match: { by: "id" | "email"; value: string },
  premiumUntil: string | null,
) {
  const q = `${match.by}=eq.${encodeURIComponent(match.value)}`;
  const res = await fetch(`${SUPABASE_URL}/rest/v1/profiles?${q}`, {
    method: "PATCH",
    headers: {
      apikey: SERVICE_ROLE,
      Authorization: `Bearer ${SERVICE_ROLE}`,
      "Content-Type": "application/json",
      Prefer: "return=representation", // so we can tell if a row actually matched
    },
    body: JSON.stringify({ is_premium: true, premium_until: premiumUntil }),
  });
  const rows = await res.json().catch(() => null);
  if (!res.ok) throw new Error(`profiles PATCH failed (${res.status})`);
  return Array.isArray(rows) ? rows.length : 0;
}

Deno.serve(async (req) => {
  if (req.method !== "POST") return new Response("Method Not Allowed", { status: 405 });
  if (!WEBHOOK_SECRET) return new Response("Server not configured", { status: 500 });

  // Verify against the RAW body bytes — parsing first would break the HMAC.
  const raw = await req.text();
  const sig = req.headers.get("x-razorpay-signature") ?? "";
  const ok = await verifySignature(raw, sig, WEBHOOK_SECRET);
  if (!ok) return new Response("Invalid signature", { status: 400 });

  let event: any;
  try { event = JSON.parse(raw); } catch { return new Response("Bad JSON", { status: 400 }); }

  const payload = event?.payload ?? {};
  const name = event?.event;

  // Which entity carries the notes, and how long access should last.
  let entity: any;
  let premiumUntil: string | null;

  if (name === "subscription.charged") {
    entity = payload.subscription?.entity ?? {};
    premiumUntil = periodEnd(entity.current_end);
  } else if (name === "payment.captured" || name === "order.paid") {
    entity = payload.payment?.entity ?? payload.order?.entity ?? {};
    // A subscription's own charge ALSO emits payment.captured. Granting the
    // one-year plan here would hand a ₹499/month member twelve months for one
    // month's money — so anything billed through an invoice is skipped and
    // left to subscription.charged above.
    if (entity.invoice_id || entity.notes?.plan === "monthly") {
      return new Response("subscription payment — handled by subscription.charged", { status: 200 });
    }
    premiumUntil = new Date(Date.now() + YEAR_MS).toISOString(); // one-time plan: one year
  } else {
    // Not an event we grant on — ack so Razorpay stops retrying.
    return new Response("ignored", { status: 200 });
  }

  const notes = entity.notes ?? {};

  // Prefer the Supabase uid we stamped into notes at checkout; fall back to email.
  const match = notes.user_id
    ? { by: "id" as const, value: String(notes.user_id) }
    : (notes.email || entity.email)
    ? { by: "email" as const, value: String(notes.email || entity.email) }
    : null;

  if (!match) return new Response("no user reference in payment", { status: 422 });

  const updated = await grantPremium(match, premiumUntil);
  if (updated === 0) return new Response("no matching profile", { status: 404 });

  return new Response("premium granted", { status: 200 });
});
