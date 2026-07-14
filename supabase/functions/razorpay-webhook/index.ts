/* ==========================================================================
   razorpay-webhook — grants premium after a verified Razorpay payment.

   Razorpay calls this URL server-to-server after checkout. We NEVER trust the
   browser for "payment succeeded" — this webhook is the only thing that flips
   is_premium = true, and only after verifying Razorpay's HMAC signature.

   Flow:
     1. Razorpay Checkout runs in the browser with notes.user_id = <supabase uid>.
     2. On capture, Razorpay POSTs the event here with an x-razorpay-signature.
     3. We verify HMAC-SHA256(rawBody, RAZORPAY_WEBHOOK_SECRET) == that header.
     4. We PATCH profiles.is_premium = true (service_role, bypasses RLS).

   Env (set with `supabase secrets set`):
     RAZORPAY_WEBHOOK_SECRET   — Dashboard → Settings → Webhooks → your secret
   Auto-injected by Supabase:
     SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
   ========================================================================== */

import { verifySignature } from "./verify.ts";

const WEBHOOK_SECRET = Deno.env.get("RAZORPAY_WEBHOOK_SECRET") ?? "";
const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

// We grant on capture. order.paid works too; captured is the money-in-hand event.
const GRANT_EVENTS = new Set(["payment.captured", "order.paid"]);

async function grantPremium(match: { by: "id" | "email"; value: string }) {
  const q = `${match.by}=eq.${encodeURIComponent(match.value)}`;
  const res = await fetch(`${SUPABASE_URL}/rest/v1/profiles?${q}`, {
    method: "PATCH",
    headers: {
      apikey: SERVICE_ROLE,
      Authorization: `Bearer ${SERVICE_ROLE}`,
      "Content-Type": "application/json",
      Prefer: "return=representation", // so we can tell if a row actually matched
    },
    body: JSON.stringify({ is_premium: true }),
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

  // Not a payment event we care about — ack so Razorpay stops retrying.
  if (!GRANT_EVENTS.has(event?.event)) return new Response("ignored", { status: 200 });

  const entity =
    event?.payload?.payment?.entity ?? event?.payload?.order?.entity ?? {};
  const notes = entity.notes ?? {};

  // Prefer the Supabase uid we stamped into notes at checkout; fall back to email.
  const match = notes.user_id
    ? { by: "id" as const, value: String(notes.user_id) }
    : (notes.email || entity.email)
    ? { by: "email" as const, value: String(notes.email || entity.email) }
    : null;

  if (!match) return new Response("no user reference in payment", { status: 422 });

  const updated = await grantPremium(match);
  if (updated === 0) return new Response("no matching profile", { status: 404 });

  return new Response("premium granted", { status: 200 });
});
