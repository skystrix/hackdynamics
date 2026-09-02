/* ==========================================================================
   course-content — serves the paid course text to PREMIUM users only.

   The chapter content (js/bookData-*.js) used to be static files anyone could
   fetch. It now lives here, bundled with this function and NOT in the public
   site. The browser must present a valid Supabase access token belonging to a
   profile with is_premium = true, or it gets nothing but 401/403.

   How the gate works: we query `profiles?select=is_premium,premium_until` with
   the CALLER's token. Supabase RLS returns their own row only, and only if the
   token is valid — so this one call both authenticates the user and reads their
   entitlement. No service_role key is used or needed here.

   `premium_until` is null for the one-time plan (never expires) and a period
   end for the monthly subscription — a past date means the membership lapsed.

   The content JSON is assembled once at cold start (the imports below populate
   window.PARTS / window.CHAPTERS) and reused for every request.
   ========================================================================== */

import "./_data/_shim.js";
import "./_data/bookData-part1.js";
import "./_data/bookData-part2.js";
import "./_data/bookData-additions1.js";
import "./_data/bookData-additions2.js";
import "./_data/bookData-additions3.js";
import "./_data/bookData-part5.js";

const g = globalThis as unknown as { PARTS: unknown[]; CHAPTERS: unknown[] };
// Built once per warm instance; the payload is identical for every premium user.
const COURSE_JSON = JSON.stringify({ PARTS: g.PARTS, CHAPTERS: g.CHAPTERS });

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
const ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY") ?? "";

const CORS = {
  "Access-Control-Allow-Origin": "*", // gated by bearer token, not cookies — safe
  "Access-Control-Allow-Headers": "authorization, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
};

function deny(status: number, msg: string) {
  return new Response(JSON.stringify({ error: msg }), {
    status,
    headers: { ...CORS, "Content-Type": "application/json" },
  });
}

async function isPremium(token: string): Promise<boolean> {
  const res = await fetch(
    `${SUPABASE_URL}/rest/v1/profiles?select=is_premium,premium_until&limit=1`,
    { headers: { apikey: ANON_KEY, Authorization: `Bearer ${token}` } },
  );
  if (!res.ok) return false; // invalid/expired token → PostgREST returns 401
  const rows = await res.json().catch(() => null);
  const row = Array.isArray(rows) ? rows[0] : null;
  if (row?.is_premium !== true) return false;
  // null = one-time plan, never expires. Otherwise the subscription period end.
  return !row.premium_until || Date.parse(row.premium_until) > Date.now();
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });
  if (req.method !== "GET") return deny(405, "Method Not Allowed");

  // Expect "Authorization: Bearer <user access token>".
  const auth = req.headers.get("Authorization") ?? "";
  const token = auth.startsWith("Bearer ") ? auth.slice(7) : "";
  if (!token) return deny(401, "Sign in required");

  if (!(await isPremium(token))) return deny(403, "Premium membership required");

  return new Response(COURSE_JSON, {
    headers: {
      ...CORS,
      "Content-Type": "application/json",
      "Cache-Control": "private, no-store", // never let a shared cache hold paid content
    },
  });
});
