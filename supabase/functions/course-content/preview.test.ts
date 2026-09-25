import { assert, assertEquals } from "jsr:@std/assert";
import { type Chapter, toPreview } from "./index.ts";

// The one thing that must never break: a locked chapter's paid body must not
// survive into the preview payload, while free chapters pass through untouched.
Deno.test("toPreview drops paid bodies from locked chapters, keeps free ones whole", () => {
  const chapters: Chapter[] = [
    { num: 1, part: 1, free: true, title: "Free one", blurb: "b1",
      sections: [{ viz: "x" }], quiz: ["q"], terms: ["t"] },
    { num: 2, part: 1, title: "Paid one", blurb: "b2",
      sections: [{ viz: "y" }, {}], quiz: ["q", "q", "q"], terms: ["t"] },
  ];

  const [free, locked] = toPreview(chapters) as Record<string, unknown>[];

  // Free chapter is returned as-is, body intact.
  assertEquals(free, chapters[0] as unknown as Record<string, unknown>);

  // Locked chapter carries metadata + counts, but NONE of the paid content.
  assertEquals(locked.locked, true);
  assertEquals(locked.title, "Paid one");
  assertEquals(locked.vizCount, 1); // one of two sections has a viz
  assertEquals(locked.vizNames, ["y"]); // names only, so the page can badge built machines
  assertEquals(locked.quizCount, 3);
  assert(!("sections" in locked), "locked chapter must not expose sections");
  assert(!("quiz" in locked), "locked chapter must not expose quiz");
  assert(!("terms" in locked), "locked chapter must not expose terms");
});
