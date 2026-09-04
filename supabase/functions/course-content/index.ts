/* ==========================================================================
   course-content — serves a course's text, gated by entitlement.

   The chapter content (js/bookData-*.js) used to be static files anyone could
   fetch. It now lives here, bundled with this function and NOT in the public
   site — so the ONLY thing protecting a paid chapter is that its text never
   leaves this function unless the caller is entitled to it.

   Two payloads are built per course at cold start:
     • FULL    — every chapter with its full sections/quiz/terms. Premium only.
     • PREVIEW — free chapters (free: true) keep full content; every other
                 chapter is reduced to metadata (num/part/title/blurb + counts)
                 and marked locked: true, with sections/quiz/terms REMOVED.
   Premium callers get FULL; everyone else — including anonymous, tokenless
   requests — gets PREVIEW. Paid chapter bodies are simply absent from PREVIEW,
   so there is nothing in the browser to unlock.

   Which course: `?course=<key>` (default `db`), matching COURSES below.

   How premium is checked: we query `profiles?select=is_premium,premium_until`
   with the CALLER's token. Supabase RLS returns their own row only, and only if
   the token is valid — so this authenticates the user and reads their
   entitlement in one call. No service_role key is used or needed here.
   Premium is one flag for the whole site: it unlocks every course.

   `premium_until` is a year out for the one-year plan, a period
   end for the monthly subscription — a past date means the membership lapsed.
   ========================================================================== */

import "./_data/_shim.js";

export type Chapter = {
  num: number; part: number; title: string; blurb: string; free?: boolean;
  sections?: { viz?: string }[]; quiz?: unknown[]; terms?: unknown[];
};

// The security boundary: free chapters pass through whole; every other chapter
// is reduced to the metadata the journey map / TOC needs and marked locked —
// its sections/quiz/terms are DROPPED, so no paid body reaches a non-member.
export function toPreview(chapters: Chapter[]): unknown[] {
  return chapters.map((ch) =>
    ch.free ? ch : {
      num: ch.num, part: ch.part, title: ch.title, blurb: ch.blurb,
      locked: true,
      vizCount: (ch.sections ?? []).filter((s) => s.viz).length,
      quizCount: (ch.quiz ?? []).length,
    }
  );
}

const g = globalThis as unknown as { PARTS: unknown[]; CHAPTERS: Chapter[] };

// Every bookData file assigns to the same window.PARTS / window.CHAPTERS, so
// courses must be loaded ONE AT A TIME and the globals snapshotted between
// them. Static imports would all run before any of this code, so the loaders
// are awaited dynamic imports — literal specifiers, so they still bundle.
async function build(loaders: (() => Promise<unknown>)[]) {
  g.PARTS = undefined as unknown as unknown[];
  g.CHAPTERS = undefined as unknown as Chapter[];
  for (const load of loaders) await load();
  const course = { PARTS: g.PARTS, CHAPTERS: g.CHAPTERS };
  return {
    full: JSON.stringify(course),
    preview: JSON.stringify({ PARTS: course.PARTS, CHAPTERS: toPreview(course.CHAPTERS) }),
  };
}

// Built once per warm instance; each payload is identical for every caller in
// its tier, so we stringify them at cold start and reuse the strings.
const COURSES: Record<string, { full: string; preview: string }> = {
  db: await build([
    () => import("./_data/bookData-part1.js"),
    () => import("./_data/bookData-part2.js"),
    () => import("./_data/bookData-additions1.js"),
    () => import("./_data/bookData-additions2.js"),
    () => import("./_data/bookData-additions3.js"),
    () => import("./_data/bookData-part5.js"),
  ]),
  rag: await build([
    () => import("./_data/bookData-rag-part1.js"),
    () => import("./_data/bookData-rag-part2.js"),
    () => import("./_data/bookData-rag-part3.js"),
    () => import("./_data/bookData-rag-part4.js"),
  ]),
};

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

// import.meta.main is false when a test imports this module, so importing
// toPreview for a unit test doesn't spin up a listener.
if (import.meta.main) Deno.serve(handler);

async function handler(req: Request): Promise<Response> {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });
  if (req.method !== "GET") return deny(405, "Method Not Allowed");

  const course = COURSES[new URL(req.url).searchParams.get("course") ?? "db"];
  if (!course) return deny(404, "Unknown course");

  // A token is optional now: anonymous callers get the free-preview payload.
  // "Authorization: Bearer <user access token>" grants FULL only if premium.
  const auth = req.headers.get("Authorization") ?? "";
  const token = auth.startsWith("Bearer ") ? auth.slice(7) : "";
  const premium = token ? await isPremium(token) : false;

  return new Response(premium ? course.full : course.preview, {
    headers: {
      ...CORS,
      "Content-Type": "application/json",
      // FULL is paid + per-user; PREVIEW is public and identical for everyone.
      "Cache-Control": premium ? "private, no-store" : "public, max-age=300",
    },
  });
}
