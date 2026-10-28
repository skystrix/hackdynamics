/* ==========================================================================
   course-content — serves a course's text.

   The chapter content lives in _data/, packed into _packed.ts by
   tools/pack-content.mjs and bundled with this function.

   Two payloads are built per course at cold start:
     • FULL    — every chapter with its full sections/quiz/terms.
     • PREVIEW — free chapters (free: true) keep full content; every other
                 chapter is reduced to metadata and marked locked: true.
   HackDynamics is free and open, so every caller currently gets FULL. PREVIEW
   is kept for login-only chapters later (signed-out callers would get it).

   Which course: `?course=<key>` (default `db`), a key in tools/pack-content.mjs.
   ========================================================================== */

import packed from "./_packed.ts";

export type Chapter = {
  num: number; part: number; title: string; blurb: string; free?: boolean; optional?: boolean;
  sections?: { viz?: string }[]; quiz?: unknown[]; terms?: unknown[];
};

// Free chapters pass through whole; every other chapter is reduced to the
// metadata the journey map / TOC needs and marked locked — its
// sections/quiz/terms are DROPPED.
export function toPreview(chapters: Chapter[]): unknown[] {
  return chapters.map((ch) =>
    ch.free ? ch : {
      num: ch.num, part: ch.part, title: ch.title, blurb: ch.blurb, optional: ch.optional,
      locked: true,
      vizCount: (ch.sections ?? []).filter((s) => s.viz).length,
      // Names, not bodies: lets the page badge only the machines it has built.
      vizNames: (ch.sections ?? []).filter((s) => s.viz).map((s) => s.viz),
      quizCount: (ch.quiz ?? []).length,
    }
  );
}

// Course text arrives pre-evaluated from tools/pack-content.mjs (which holds the
// course list): base64(gzip(JSON)) per course, so the upload stays small.
async function build(b64: string) {
  const gz = Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));
  const json = await new Response(new Blob([gz]).stream().pipeThrough(new DecompressionStream("gzip"))).text();
  const course = JSON.parse(json) as { PARTS: unknown[]; CHAPTERS: Chapter[] };
  return {
    full: json,
    preview: JSON.stringify({ PARTS: course.PARTS, CHAPTERS: toPreview(course.CHAPTERS) }),
  };
}

// Built once per warm instance; each payload is identical for every caller, so we build the strings at cold start and reuse them.
const COURSES: Record<string, { full: string; preview: string }> = Object.fromEntries(
  await Promise.all(Object.entries(packed).map(async ([key, b64]) => [key, await build(b64)])),
);

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
};

function deny(status: number, msg: string) {
  return new Response(JSON.stringify({ error: msg }), {
    status,
    headers: { ...CORS, "Content-Type": "application/json" },
  });
}

// import.meta.main is false when a test imports this module, so importing
// toPreview for a unit test doesn't spin up a listener.
if (import.meta.main) Deno.serve(handler);

function handler(req: Request): Response {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });
  if (req.method !== "GET") return deny(405, "Method Not Allowed");

  const course = COURSES[new URL(req.url).searchParams.get("course") ?? "db"];
  if (!course) return deny(404, "Unknown course");

  // ponytail: everything is public for now, so every caller gets FULL. To bring
  // back login-only chapters, check the caller's token and serve course.preview
  // to anyone without a valid one.
  return new Response(course.full, {
    headers: { ...CORS, "Content-Type": "application/json", "Cache-Control": "public, max-age=300" },
  });
}
