# Contributing to HackDynamics

Thanks for helping. Corrections are the most valuable contribution: a wrong fact, a
broken machine, a quiz with two right answers, a typo.

## Quick fixes

1. Open an issue, or go straight to a pull request for small fixes.
2. Chapter text lives in `supabase/functions/course-content/_data/bookData-*.js`.
   Machines live in `js/viz*.js`.
3. Run the checks on any chapter you touched (see "Working on a chapter" in the
   [README](README.md)):
   `node tools/chapcheck.js <file> <chapter>` and `node tools/figcheck.js <file> <chapter>`.
4. Say in the PR what was wrong and how you know (a source, a test, a screenshot).

## Writing content

- **Write it yourself.** Teach ideas in your own words. Never paste text, figures or
  code from books, papers, courses or other sites, even with credit. Cite a source when a
  fact needs one.
- Match the existing chapters: explain the mechanism, not just the definition. Short
  paragraphs, concrete numbers, one idea per section.
- Code samples should run. DSA chapters show Python and Java; check new practice
  problems with `python3 tools/practice.py check <file>`.
- Quizzes: one clearly correct answer, and wrong answers that are plausible, not jokes.
  Keep the right answer from always being the longest option.
- A new chapter or course is a bigger change: open an issue first, and read
  [`COURSE_CREATION_GUIDE.md`](COURSE_CREATION_GUIDE.md).

## Code

- No build step and no runtime dependencies for the site. Plain HTML, CSS and JavaScript.
- Test in light and dark mode and at phone width.
- The Supabase functions have Deno tests: `deno test supabase/functions/`.

## License

By contributing you agree that your code is licensed under [MIT](LICENSE) and your
course content under [CC BY-SA 4.0](LICENSE-CONTENT), the same as the rest of the
project.
