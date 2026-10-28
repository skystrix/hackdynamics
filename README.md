# HackDynamics

Free, open-source computer science courses that go all the way down. Each course is
long-form text with interactive "machines" you can drive, a quiz per chapter, and a
build-it-yourself capstone. Live at **[hackdynamics.com](https://www.hackdynamics.com)**.

No paywall, no card, no sign-up needed to read.

## The courses

| Course | Page | Chapters | Machines | Quiz questions |
|---|---|---|---|---|
| Databases in Depth | [`databases-in-depth.html`](databases-in-depth.html) | 32 | 28 | 165 |
| RAG In Depth | [`rag-in-depth.html`](rag-in-depth.html) | 36 | 42 | 402 |
| LLM In Depth | [`llm-in-depth.html`](llm-in-depth.html) | 41 | 81 | 462 |
| DSA By Patterns | [`dsa-by-patterns.html`](dsa-by-patterns.html) | 49 | 88 | 492 |

## Run it locally

No build step and no dependencies for the site itself:

```sh
python3 -m http.server 8000
```

Then open http://localhost:8000. Course pages load their chapter text from the
production `course-content` function (see below), so this shows the live content. Your
progress is kept in your browser's `localStorage`.

## How it fits together

| Path | What it is |
|---|---|
| `index.html`, `courses.html` | Home page and course catalogue |
| `databases-in-depth.html` … `dsa-by-patterns.html` | One page per course. Each sets `window.HD_COURSE` and shares the same shell |
| `js/app.js` | The course shell: journey map, chapter renderer, progress, lazy machine mounting |
| `js/gate.js` | Fetches the course text, then boots `app.js` |
| `js/quiz.js` | Quiz engine: multiple choice, fill-in-the-blank, tap-in-order |
| `js/viz*.js` | The interactive machines, one set of files per course (`viz-rag-kit.js` holds shared helpers) |
| `js/auth.js`, `login.html` | Optional email sign-in (Supabase) |
| `supabase/functions/course-content/_data/` | **The chapter text, quizzes, terms and figures** (`bookData-*.js`) |
| `supabase/functions/course-content/` | Edge Function that serves a course as JSON (`?course=db\|rag\|llm\|dsa`) |
| `supabase/functions/razorpay-*` | Payment functions, not used right now (kept for a future donations page) |
| `courses/<course>/` | Design documents per course: source map, charter, blueprint, QA report; DSA practice problems |
| `resources/` | Runnable scripts behind the RAG course's measurements, and the PocketRAG capstone |
| `tools/` | Authoring and deploy tools (below) |

Chapter text is served by a function rather than as static files so that login-only
chapters stay possible later. Today every chapter is public.

## Working on a chapter

The chapter files are plain JavaScript that push to `CHAPTERS`. After editing one:

```sh
# Counts, banned words, quiz-answer balance, broken refs for chapter N
node tools/chapcheck.js supabase/functions/course-content/_data/bookData-part1.js 1

# Overlapping or out-of-bounds shapes in a chapter's SVG figures
node tools/figcheck.js supabase/functions/course-content/_data/bookData-part1.js 1

# Render every chapter in a file to one static HTML page (text and figures, no machines)
node tools/render-chapter.js "$PWD/supabase/functions/course-content/_data/bookData-part1.js" /tmp/preview.html
```

To see edited chapters in the real course page, run Supabase locally (needs Docker):
`supabase start`, `node tools/pack-content.mjs`, `supabase functions serve course-content`,
then point `SUPABASE_URL` in `js/supabase-config.js` at the API URL `supabase start`
printed. Don't commit that change.

Other tools:

- `tools/practice.py check courses/dsa-by-patterns/practice/ch08.py`: fuzzes each DSA
  practice solution against a brute force, in Python and Java.
- `tools/extract-code.js <bookData.js> <chapter>`: writes a chapter's code blocks to files
  so you can run them.
- `tools/chapter_asm.py`: helper for assembling a new chapter's `CHAPTERS.push({...})` block.
- `tools/deploy-content.sh`: packs the course data and deploys `course-content`
  (maintainers only).

Writing a whole new course follows [`COURSE_CREATION_GUIDE.md`](COURSE_CREATION_GUIDE.md).

## Self-hosting

The site is static: any static host works (production runs on Vercel, see
`vercel.json` and `.vercelignore`). Sign-in and course content need a Supabase project:
[`SUPABASE_SETUP.md`](SUPABASE_SETUP.md) has the table and policy SQL, and
`js/supabase-config.js` holds the public project URL and anon key.

## Contributing

Fixes, corrections and new chapters are welcome. See [`CONTRIBUTING.md`](CONTRIBUTING.md).

## License

- **Code** (site, machines, functions, tools, `resources/`): [MIT](LICENSE).
- **Course content** (chapter text, quizzes, figures, course documents):
  [CC BY-SA 4.0](LICENSE-CONTENT). Code samples inside chapters may also be used under MIT.
