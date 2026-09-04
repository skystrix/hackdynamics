# Hack Dynamics — 90-Day Marketing Plan & Growth Strategy

Prepared 2026-09-03. Written for a founder-led team that will execute directly.

## Assumptions (state them, then move on)

| Item | Assumption | Source |
|---|---|---|
| Live product | One course: **Databases in Depth** — 32 chapters, 28 interactive machines, ~160 quiz questions, PocketDB build-your-own-database capstone | repo |
| Roadmap | Networking in Depth (in progress), then PostgreSQL Internals, Redis Internals, Build Your Own DB, SQL Performance, Analytical DBs | `COURSE_PLAN.md`, `pdfs/` |
| Pricing | ₹299/month or ₹1999 lifetime, Razorpay checkout | `pricing.html` |
| Site | hackdynamics.com, static, Supabase auth, all 32 chapters behind the paywall | repo |
| Team | Founder alone (writes, records, posts) using templates in Figma/CapCut. Hire a part-time designer only when revenue passes ₹30k/month. | assumed |
| Audience today | < 500 combined followers, no email list | assumed |
| Ad budget | **₹4,000/month**, growing with revenue: each month's budget = ₹4,000 + 30% of the previous month's revenue (see §7) | user |
| Primary geo | India first (INR pricing), English-speaking global second | pricing currency |
| Unit economics | Lifetime ₹1999 → target CAC ≤ ₹700. Monthly ₹299 × assumed 4-month retention ≈ ₹1200 LTV → target CAC ≤ ₹400. Blended target CAC **≤ ₹600**. | assumed |

**One product change this plan depends on:** make chapters 1, 5 and 8 (Introduction, B-Tree Basics, Transactions & Recovery) free without login. Right now everything is gated, which means every social post links to a wall. A free sample is the single highest-leverage conversion asset an education brand has. The `index.html` meta already says "free" — make it true for three chapters.

---

## 1. Executive Summary & Positioning

**Positioning statement**

> For engineers who are tired of tutorials that show the controls but never open the machine, Hack Dynamics is the interactive computer-science course platform that teaches databases, networks, and systems from first principles — with simulations you drive and quizzes that push back — so you can debug what others only google.

**The one-line version (bio, ad headline):** *Computer science, taught from the inside.*

**Core differentiators (rank-ordered, use in this order in copy)**

1. **Depth from first principles.** A B-Tree split isn't described; you watch it split. ARIES recovery isn't a bullet point; you crash the database and replay the log.
2. **Interactive machines, not videos.** 28 hand-built simulations. Text you can read at your speed, diagrams you can drive.
3. **Quizzes that push back.** 160 questions with a *why* for every answer. Mastery, not completion.
4. **Build it yourself.** The course ends with PocketDB: pager, slotted pages, B⁺-tree, WAL, MVCC, SQL — from an empty file.
5. **Price of a pizza.** ₹1999 once. No ₹40,000 bootcamp.

**Brand voice**

- **Confident, precise, slightly irreverent.** The site already talks like this: "Most courses show you the controls. Ours hand you a screwdriver." Keep that register.
- **Specific over grand.** Never "master databases." Always "understand why VACUUM exists."
- **Show the mechanism.** Every post should contain one concrete mechanism (a number, a diagram, a line of a log). No post is pure opinion.
- **No fear-mongering.** We don't say "you'll fail your interview." We say "here's the question, here's why the answer is what it is."
- **Vocabulary:** internals, machine, first principles, from bytes up, descend, mechanism, the why. Avoid: master, crack, hack (yes, despite the name), guru, ultimate, roadmap.

**Messaging guidelines by depth**

| Layer | Message | Where |
|---|---|---|
| Hook | One surprising mechanism | Post first line, ad headline |
| Proof | A diagram / simulation clip / quiz question | Post body, ad creative |
| Bridge | "This is chapter N of Databases in Depth" | Post CTA |
| Offer | Free chapter → ₹1999 lifetime | Landing page, retargeting |

---

## 2. Target Audience Personas

### Persona A — "Aarav", CS student (3rd/4th year, tier-2 college, India)

| | |
|---|---|
| Goals | Internship at a product company; understand what DBMS class glossed over; something impressive on the résumé |
| Pain points | College teaches syntax, not systems. YouTube is fragmented. Doesn't know what "good" depth looks like. Budget-constrained. |
| Objections | "Is this needed for placements?" "₹1999 is a lot for a student." "Will I finish it?" |
| Platforms | Instagram (primary, reels), X (follows tech accounts), LinkedIn (résumé mode), YouTube |
| Consumption | Mobile, short-form, evenings. Saves posts. Shares carousels to friends' groups. |
| Messaging angle | **"Be the one in your batch who actually knows how it works."** PocketDB as a résumé project. Student pricing via monthly plan (₹299 = one month of a real course). |
| JTBD | *When placement season is 6 months away, help me stand out with real understanding, so I can answer the follow-up question interviewers ask.* |

### Persona B — "Priya", recent grad / job seeker (0–2 YOE, interviewing)

| | |
|---|---|
| Goals | Clear system design + DBMS rounds; move from service company to product company; stop memorising |
| Pain points | Has done LeetCode. Freezes on "how does an index actually work?" Interview-prep sites are lists without the why. |
| Objections | "I have 4 weeks — is this too deep?" "Is this interview-relevant or academic?" |
| Platforms | LinkedIn (primary; job-hunt mode), X, Instagram |
| Consumption | Desktop during the day, mobile at night. Reads long LinkedIn posts. Bookmarks threads. |
| Messaging angle | **"The interviewer's follow-up question is always about internals."** Map chapters to interview rounds. 30-day plan. |
| JTBD | *When I'm preparing for a product-company interview, help me answer the "why" behind every DB/system design question, so I stop getting rejected in round 3.* |

### Persona C — "Rahul", working engineer (3–8 YOE, backend/SRE)

| | |
|---|---|
| Goals | Stop being scared of production DBs; get promoted to senior/staff; make architectural decisions with confidence |
| Pain points | Debugged a lock contention issue by trial and error. Doesn't know what EXPLAIN is telling him. Has read DDIA but it didn't stick. |
| Objections | "I've already read DDIA." "I don't have time." "Text course? I'd rather watch." |
| Platforms | X (primary), LinkedIn, Hacker News, engineering newsletters |
| Consumption | Reads long-form. Values diagrams. Hates fluff. Will pay ₹1999 without blinking if convinced of depth. |
| Messaging angle | **"DDIA tells you what. This shows you how."** Production war-story hooks. Simulations as the differentiator vs reading. |
| JTBD | *When something breaks in production at 2am, help me reason from the internals instead of restarting and praying, so I'm the engineer people call.* |

**Persona weighting for spend:** C gets 45% of effort (highest LTV, buys lifetime, shares with team), B 35%, A 20% (volume via organic reels; low ad spend).

---

## 3. Competitive Differentiation

| Competitor | What they are | Price | Their strength | Our angle against them |
|---|---|---|---|---|
| **AlgoExpert / SystemsExpert** | Video interview prep | $99–$199/yr | Interview framing, polish | "They teach you the answer. We teach you the machine, so you can derive any answer." |
| **ByteByteGo** | System design newsletter + course | $60–$100/yr | Beautiful diagrams, huge audience | "ByteByteGo shows you the architecture diagram. We show you what's inside each box — and let you drive it." (Note: emulate their diagram quality; it's the bar.) |
| **Educative** | Text-based, interactive, broad catalog | $60/mo | Text + interactivity (closest format) | "Educative has 1000 courses. We have one, and it goes 32 chapters deep. Breadth vs depth." |
| **Udemy** | Video marketplace | ₹500–₹3000 | Cheap, everything | "Udemy's DB courses stop at CRUD and normalisation. Ours starts where they stop." |
| **Frontend Masters** | Video workshops | $39/mo | Top instructors, production quality | Not a direct competitor (frontend). Borrow: instructor-as-brand. |
| **DDIA (the book)** | The reference | ₹3000 | Authority | Not a competitor — an ally. "The interactive companion to DDIA." Explicitly position as *what to do after DDIA*. |
| **CMU 15-445 / YouTube lectures** | Free, deep | Free | Depth, authority | "Free and deep, but 50 hours of video and no feedback. We compress it into text you can read at 3× speed, with quizzes that tell you what you missed." |

**Positioning against interview-prep tools:** *interview prep is a side effect of understanding.* Every chapter ends with quiz questions that are, functionally, interview questions with explanations. Say this in one line: "160 interview questions, each with the *why*, disguised as a course."

**Positioning against shallow tutorials:** never attack "tutorials" generically. Attack a specific shallow explanation and correct it. Example: "Every tutorial says 'B-Trees are balanced trees for disk.' Here's the actual reason: fanout. A 4KB page holds ~250 keys. log₂₅₀(1 billion) ≈ 3.7 → four disk reads to find any row in a billion. That's the entire point." This is the *first principles* differentiator in action: correct the textbook, show the number.

---

## 4. Channel Strategy

### 4.1 X / Twitter — the depth channel (Persona C + B)

**Role:** credibility and reach among engineers. Where the "deep internals" positioning is proven daily.

**Content pillars (X)** — Database Internals 40%, Distributed Systems 20%, First-principles corrections 15%, Build-in-public 15%, Career/interview 10%.

**Cadence:** 2 standalone posts/day + 1 thread/week + 15 replies/day. Post at 8:30 am IST (catches India morning + US evening) and 8:30 pm IST (India evening + US morning). Thread on Tuesday or Wednesday 8:30 pm IST.

**Formats and how to use them**

- **Single-image posts** (the workhorse): one diagram from a chapter, 1–2 sentence explanation, no link. Diagrams are 1600×900, brand style (§4.3). These get bookmarks; bookmarks drive the algorithm.
- **Threads:** 7–12 tweets, one diagram every 3 tweets, no link until the last tweet. First tweet has the hook + the image. Last tweet: "This is chapter N of Databases in Depth — first 3 chapters free: hackdynamics.com"
- **Polls (1/week):** turn a quiz question into a poll. "N=5, W=2, R=2. A read right after a write returns the OLD value. Is the system broken?" Post the answer + *why* as a reply 4 hours later. Polls get 3–5× the reach of a normal post because of the vote interaction.
- **Code snippets:** screenshots (Carbon / ray.so) of 8–15 lines from PocketDB with one arrow. "This is the entire fsync policy of a database that survives kill -9."
- **Quote tweets:** when a big account posts a simplification, QT with the precise mechanism. Respectful, never "well actually." Formula: "Great thread. One layer deeper: [mechanism]. [diagram]"
- **Simulation clips (2/week):** 10–20s screen recording of a viz (B-Tree split, LSM compaction, Raft election). These are the unfair advantage — no competitor has drivable simulations. Add a 1-line caption and the chapter name.

**Engagement strategy**

- **Reply list (build once, use daily):** 30 accounts. Suggested seed list by category — DB people (Andy Pavlo, Franck Pachot, Kelly Sommers, Marc Brooker, Murat Demirbas, Alex Xu, Phil Eaton, Jamie Brandon), Indian tech (Arpit Bhayani, Gaurav Sen, Kunal Kushwaha, Hitesh Choudhary, Piyush Garg, Striver), systems/infra (Gergely Orosz, Charity Majors, Tanel Poder, Hussein Nasser). Reply within 15 minutes of their posts with a mechanism-level addition (not "great post"). 15 replies/day, 20 minutes total.
- **Build in public:** weekly "what I built this week" with a viz clip. Networking-in-Depth progress. Subscriber count milestones (honest numbers).
- **Community threads:** monthly "What's the DB internals concept that finally clicked for you, and what made it click?" — replies become content ideas and social proof.
- **Consistency beats virality.** X rewards accounts that post daily for 90 days. Don't skip.

**Algorithm notes:** replies from you within the first hour on your own post extend its life; posts with images get ~2× reach vs text; external links in the first tweet suppress reach (put links in the last tweet or a reply); bookmarks are weighted higher than likes — write things people will want to come back to (reference diagrams, cheat sheets).

**Five thread outlines**

1. **"Why does every database use a B-Tree and not a binary search tree?"**
   Hook: "A binary search tree on disk would need 30 disk reads to find one row in a billion. A B-Tree needs 4. Here's the arithmetic every DBMS is built on 🧵"
   Structure: (1) the 30 vs 4 claim + diagram. (2) disk pages are 4–16KB; a node is a page. (3) fanout: 4KB/16B ≈ 250 keys per node. (4) height = log₂₅₀(N). (5) the top levels are always in cache → ~1 real read. (6) why leaves are linked (range scans). (7) what a split looks like [sim clip]. (8) why this makes INSERT slower than you think. (9) CTA.

2. **"Your database acknowledged the commit. Then the power went out. Why is your data still there?"**
   Hook: "The pages with your data were never written to disk. The database still didn't lose it. This is the most important idea in storage engines 🧵"
   Structure: write-ahead log → sequential vs random I/O → fsync → redo on restart → why ARIES redoes even losers → "repeat history" → what kill -9 actually does → PocketDB's 40-line WAL [snippet] → CTA.

3. **"N=5, W=2, R=2. You wrote, then read — and got the old value. Not a bug."**
   Hook: the poll itself, then the thread as the explanation. Quorum intersection, R+W>N, why Dynamo lets you tune it, sloppy quorums, why "eventually consistent" means something precise. Diagram of overlapping sets.

4. **"I built a database from an empty file. Here's what surprised me at every layer."**
   Hook: "6 chapters, ~2000 lines, survives kill -9. The things I got wrong before I got them right 🧵"
   Structure: pager → slotted pages (why not fixed-size records) → B⁺-tree split → WAL → MVCC ("transactions that don't wait") → SQL parser. One surprise per layer. Build-in-public tone. Ends: "this is the capstone of Databases in Depth."

5. **"The optimizer estimated 40 rows. It got 2.1 million. Everything above it went wrong."**
   Hook: "Most slow queries aren't slow because of the query. They're slow because the planner *guessed wrong* 🧵"
   Structure: cardinality estimation → independence assumption → stale stats → how the misestimate flips a join order → nested loop vs hash join on 2.1M rows → reading EXPLAIN ANALYZE rows vs estimate → the one-line fix (ANALYZE) and when it isn't → CTA to chapter 12.

### 4.2 LinkedIn — the career channel (Persona B + C)

**Role:** conversion. LinkedIn users are in career mode and click pricing pages. Lower reach ceiling than X but 3–5× the conversion rate to email.

**Personal profile vs company page:** post 90% from the founder's personal profile. Company pages get ~10% of the reach. Create the company page (for the "works at" link and ad account), post once a week there by resharing. Founder profile headline: *"Building Hack Dynamics — interactive CS courses taught from the inside. Databases in Depth is live."*

**Content adaptation:** same mechanisms as X, reframed around *career consequence*. X says "here's how the WAL works." LinkedIn says "the question that separates senior from mid-level candidates in DB rounds is about the WAL. Here's the answer."

**Formats**

- **Text-only posts (3/wk):** 150–250 words, one idea, first line is the hook (only ~2 lines show before "see more"). Short lines. One question at the end to trigger comments.
- **Document/carousel posts (1/wk):** 8–12 page PDF, one concept per page, big text, one diagram per page. These get the most saves and shares. Reuse Instagram carousels (same 1080×1350 files).
- **Simulation video (1/wk):** native upload, 20–40s, captions burned in, square or 4:5.
- **Thought leadership (1/wk):** a stance. "Interview prep sites are teaching the wrong thing" / "Text courses beat video for systems topics — here's why."

**Cadence:** 5 posts/week (Mon–Fri), 9:00 am IST. Comment on 10 posts/day from the reply list (LinkedIn version: Arpit Bhayani, Gaurav Sen, Alex Xu, Neo Kim, Raul Junco, Nikki Siapno, Sahn Lam, Ashish Pratap Singh, Shrivu Shankar). Reply to every comment on your own posts within 2 hours.

**Five LinkedIn post outlines**

1. **"The follow-up question."**
   Hook: "The DB round isn't about the question. It's about the follow-up."
   Body: Question: "What is an index?" Everyone answers. Follow-up: "Why is INSERT slower with more indexes?" Half the room stops. Second follow-up: "What happens inside the B-Tree on that INSERT?" Now it's one person. That person gets the offer. → the mechanism (page split, propagate up) in 4 lines → "I made a course that only teaches the follow-ups." CTA: link in comments.

2. **"I read DDIA twice. It didn't stick until I built one."**
   Hook: "DDIA is the best book on databases. It's also why most engineers *think* they understand replication."
   Body: reading vs doing → what changed when I implemented a WAL → the specific moment (fsync only on commit) → learning from first principles means building the mental model, not memorising the summary → CTA.

3. **"A 30-day plan for the DBMS + system design rounds"** (document post)
   12 pages: Week 1 storage engines (ch 5–8), Week 2 query & indexing (ch 11–12), Week 3 distributed (ch 15–20), Week 4 scaling & real DBs (ch 21–25). Each page: chapter, the interview question it answers, time needed. Last page: free chapters link.

4. **"Text beats video for systems. Here's why I bet a company on it."** (thought leadership)
   Hook: "Unpopular in edtech: video is the wrong medium for database internals."
   Body: you can't ctrl-F a video → you read at your speed, not the instructor's → a diagram you can *drive* beats a diagram someone narrates → quizzes that block progress until you get it → "if you disagree, tell me what video did for you that text couldn't."

5. **"The 2am debugging story"** (Persona C)
   Hook: "We restarted the database three times before someone asked what a lock queue actually looks like."
   Body: hot row, lock modes, the queue behind a long transaction, SKIP LOCKED — what we would have done if we'd known → "internals aren't academic. They're what you wish you'd known at 2am." → CTA.

### 4.3 Instagram — the volume channel (Persona A + B)

**Role:** top of funnel. Reels reach cold audiences at near-zero cost; carousels get saves and shares among students.

**Visual style (system):**
- Paper-white or near-black backgrounds (match the site's Notion-style tokens: `#f6f5f4` canvas, `#0075de` structural blue, sticker accents teal `#2a9d99` / orange `#dd5b00`). Inter for text, monospace for anything that's code or a log line.
- One diagram per frame, big type (≥ 48px on 1080 canvas), max 20 words per slide.
- Simulations recorded from the site in dark theme, cropped 4:5 or 9:16, with a 3-word caption overlay.
- Consistent first-slide template: eyebrow "DATABASE INTERNALS · CH 08", headline, a single diagram. Brand mark bottom-left.

**Formats and cadence**
- **Reels 4/wk:** screen-recorded simulations with voiceover or captions; "explain this in 30 seconds"; quiz-question reels (question → 3-second countdown → answer + why).
- **Carousels 2/wk:** 8–10 slides, deep concept. Cross-posted to LinkedIn as document.
- **Static 1/wk:** a single diagram or a quote-card ("Durability is owed at commit, not before.").
- **Stories daily:** quiz sticker (the built-in quiz sticker — actual quiz questions from the course), polls, behind-the-scenes, reshares of every post.

**Converting followers to the site/email:** Instagram doesn't allow links in captions. So: (1) link in bio goes to the **quiz challenge page** (`/quiz-challenge.html`, built — see §6), not the homepage; (2) every reel CTA is "take the 8-question challenge, link in bio"; (3) Stories with link sticker daily; (4) a keyword auto-DM ("comment WAL and I'll DM you the chapter") using ManyChat once follower count > 2k; (5) carousels end with "Save this. Full chapter free at hackdynamics.com" — the URL is typed out, people do type it.

**Three Reel scripts**

**Reel 1 — "The database that survives kill -9"** (25s)
| Time | Visual | Overlay / VO |
|---|---|---|
| 0–3s | Terminal: `INSERT ... COMMIT` then `kill -9` mid-write; screen goes black | "I killed a database mid-write" |
| 3–8s | Restart; log lines scroll "replaying WAL… 3 records… done" | "It lost nothing. Here's why." |
| 8–16s | WAL/ARIES viz from ch 8: write goes to log first, then page | "Before touching the data page, it appends the change to a log. Sequential. Fsync'd. *Then* it says 'committed'." |
| 16–22s | Crash simulator replays the log into the page | "On restart it replays the log. Repeat history, then undo losers." |
| 22–25s | Card: "Chapter 8 · Transactions & Recovery · free" | "Take the 8-question challenge. Link in bio." |

**Reel 2 — "Why your read returned the old value (and it's not a bug)"** (30s)
| Time | Visual | Overlay / VO |
|---|---|---|
| 0–3s | 5 circles (replicas), write lands on 2, big "✓ SUCCESS" | "5 replicas. Write to 2. Success." |
| 3–7s | Read from 2 *other* circles → returns old value | "Read from 2. Old value. Is the system broken?" |
| 7–10s | Countdown 3-2-1 | "Guess." |
| 10–22s | Quorum viz from ch 17: sets overlap only when R+W > N | "No. 2+2 = 4 ≤ 5. The read set and write set never had to overlap. Set W=3, R=3 and they must." |
| 22–27s | Formula card: `R + W > N` | "That's the entire quorum rule. Dynamo, Cassandra, Riak — all this." |
| 27–30s | End card | "Chapter 17. 8-question challenge in bio." |

**Reel 3 — "Every tutorial gets B-Trees wrong"** (28s)
| Time | Visual | Overlay / VO |
|---|---|---|
| 0–3s | Text on screen: "B-Trees are balanced trees for disk" with a red strike | "This explanation is useless." |
| 3–9s | 4KB page graphic, keys filling it, counter climbs to 250 | "A page is 4KB. That's ~250 keys per node." |
| 9–16s | log₂ vs log₂₅₀ side by side: 30 levels vs 4 | "Binary tree: 30 levels for a billion rows. B-Tree: 4." |
| 16–23s | B-Tree split simulation from ch 5, root splits, tree grows one level | "And it only grows at the *root*. That's why every leaf is the same depth." |
| 23–28s | End card | "Chapter 5, free. Challenge in bio." |

**Three carousel outlines**

1. **"How a SELECT becomes bytes: the 6 layers"** — Slide 1 hook: "Your query passes through 6 layers before it touches disk." Slides 2–7: transport → parser → optimizer → execution engine → access methods (B-Tree) → buffer manager, one diagram each, one sentence each. Slide 8: "The storage engine is where the course lives." Slide 9: chapter 1 free, URL.
2. **"LSM-Trees: how Cassandra and RocksDB write so fast"** — Hook: "They never update a file. Ever." Memtable → flush → SSTable → tombstones (delete = write) → compaction → Bloom filters ("all-ones means *probably*") → the read-amplification tax → when to pick LSM vs B-Tree. Chapter 10.
3. **"5 interview questions with the *why* (databases)"** — each slide is one quiz question from the course, next slide the answer + why. Questions: B-Tree fanout, WAL before ack, tombstones, R+W>N, Raft one-leader-per-term. Last slide: "155 more in the course."

---

## 5. Content Strategy & Calendar

**Six pillars**

| Pillar | Share | Source | Signature format |
|---|---|---|---|
| Database internals | 35% | ch 1–13 | Simulation clips, diagram posts, threads |
| Distributed systems | 20% | ch 14–20 | Polls (quorum, consensus), threads |
| Build-your-own (PocketDB) | 15% | ch 27–32 | Code snippets, build-in-public |
| First-principles corrections | 10% | any | "Every tutorial says X. Actually Y. Here's the number." |
| Career & interviews | 10% | quizzes | LinkedIn posts, question reels |
| Coming next: networking / OS | 10% | roadmap | Teasers, "which internals next?" polls, waitlist |

**30-day calendar:** see `marketing/calendar.csv` (100 rows: day, platform, format, pillar, topic, hook, CTA). Structure per weekday:

| | X | LinkedIn | Instagram |
|---|---|---|---|
| Mon | diagram post + poll | text post (career) | reel |
| Tue | diagram post + **thread** | carousel/document | carousel |
| Wed | sim clip + diagram | text post (mechanism) | reel |
| Thu | diagram post + poll answer | sim video | quiz reel |
| Fri | build-in-public + diagram | thought leadership | carousel |
| Sat | sim clip | — | reel |
| Sun | community question | — | static quote card |

**Repurposing workflow — one chapter → 12+ posts (automated)**

`node marketing/repurpose.mjs 8` reads chapter 8 from the real course data, strips HTML/SVG, and asks Claude to draft, in brand voice and with the chapter's actual quiz questions: 1 X thread, 3 standalone X posts, 1 X poll (from a quiz question), 2 LinkedIn posts, 1 carousel outline, 1 reel script, 2 Instagram quiz-story questions, 1 email snippet. Output lands in `marketing/drafts/ch08.md`. The founder edits (never posts raw), the founder builds the visuals from the Figma/CapCut templates, everything goes into the scheduler. Run it once per chapter: 32 chapters × 12 = ~380 drafts, i.e. 4 months of content from the existing course before writing anything new.

Manual layer on top: every viz gets one 15s screen recording (28 clips = 7 weeks of sim posts). Record all 28 in one afternoon with the site in dark theme at 1080×1350.

---

## 6. Lead Magnets & Conversion Funnel

**Lead magnets (build in this order)**

1. **The 8-Question Database Internals Challenge** — `quiz-challenge.html` (built, uses the course's own quiz engine and real questions). Score → email capture → "here's which chapters to read for what you missed." This is the Instagram link-in-bio and the primary ad landing page. Interactive beats PDF: people share their score.
2. **Free chapters 1, 5, 8** — no email required (friction kills the sample). Email prompt at the end of chapter 8: "Get the rest of the storage-engine chapters as they'd appear in your inbox — one concept a week."
3. **"The Database Internals Cheat Sheet"** — one-page PDF: B-Tree math, WAL rules, R+W>N, isolation levels, LSM vs B-Tree table. Gated behind email. Made from existing diagrams.
4. **"30-day DB interview plan"** — Notion template mapping chapters to interview questions (also the LinkedIn document post).
5. **Networking in Depth waitlist** — "first 500 get lifetime pricing at launch." Builds the list for course 2 before it exists.

**Email capture stack:** Buttondown (₹0 to 100 subs, then ~$9/mo; simple HTML form POST, no JS) — set the form action in `quiz-challenge.html`. Tag by source (`quiz`, `chapter8`, `cheatsheet`, `waitlist`).

**5-email nurture sequence** (full copy in `marketing/nurture-emails.md`)

| # | Send | Subject | Job |
|---|---|---|---|
| 1 | Immediately | "Your score, and what it means" | Deliver the promise: per-question *why*, map misses to free chapters. |
| 2 | Day 2 | "The 4-disk-read trick" | Pure value: B-Tree fanout arithmetic. Link to ch 5 (free). |
| 3 | Day 4 | "I killed a database mid-write" | Pure value: WAL story + sim link to ch 8 (free). Soft mention of the full course. |
| 4 | Day 7 | "What's behind the wall" | The offer: 32 chapters, 28 machines, PocketDB. ₹1999 lifetime. One testimonial. |
| 5 | Day 10 | "The chapter people quit at (and why it's the important one)" | Objection handling ("will I finish?"), the monthly plan as low-commitment entry, last CTA. |

Then a weekly newsletter: one mechanism, one diagram, one quiz question. Same content as the best social post of the week.

**Conversion path**

```
Social post (mechanism) → quiz challenge / free chapter → email (5-email sequence)
      → paid (₹1999 lifetime, or ₹299 monthly as the low-commitment entry)
      → member shares score / PocketDB repo → social
```

Target conversion rates (90-day): social → site 1.5% of impressions; site → email 25% on the quiz page, 8% on free chapters; email → paid 4% within 14 days.

**Quizzes as interactive lead magnets:** the course has 160 questions with explanations. They are the lead magnet. Use them (a) as the challenge page, (b) as X polls, (c) as Instagram quiz stickers, (d) as a "question of the day" email, (e) as retargeting ad creative ("You got 5/8. Here's the chapter for the 3 you missed.").

---

## 7. Paid Advertising Strategy

**Budget: ₹4,000/month (≈ ₹130/day), growing with revenue.** Reinvestment rule: month N budget = ₹4,000 + 30% × month N−1 revenue. Twenty lifetime sales in a month (₹40k) makes the next month's budget ₹16k.

At ₹4k there is no platform split. One platform, one campaign, one objective. Splitting ₹4k four ways puts every platform below its learning threshold and teaches you nothing. What ₹4k honestly buys: 30–50k impressions, 40–60 emails, 1–3 paid members a month. **In the first 90 days paid is a measurement line, not a growth channel.** Organic and the email list do the growing; paid's job is to establish a known cost per lead so that every rupee reinvested later has a predictable return.

| Stage | Trigger | Where the money goes | Why |
|---|---|---|---|
| Months 1–2 | day 15 (once 2 weeks of organic content exist) | **Meta only**, Instagram placement, one Leads campaign: the best organic reel → quiz page | Cheapest CPM in India (₹80–150); the only platform where ₹130/day clears the daily minimum and still reaches thousands |
| Month 3+ | site > 1,500 sessions/month | **Meta retargeting only**: site visitors (30d) → pricing page | Retargeting converts 5–10× cold. Once organic supplies visitors, cold spend is the worst use of ₹4k |
| ≥ ₹15k/month | revenue reinvestment | Add **Google Search**, exact-match mechanism keywords (`keywords.md`) | Search needs ~₹10k/month to reach the 30 conversions smart bidding wants |
| ≥ ₹30k/month | revenue reinvestment | Full split: Meta 50 / Google 25 / X 15 / LinkedIn 10 | X and LinkedIn ads only make sense with warm audiences and budget to spare |

**Audience targeting**

- *Meta cold (the ₹4k campaign):* **India only** (US/UK CPMs are 5–8× higher; add them at ≥ ₹30k); age 20–35; interests: PostgreSQL, MySQL, MongoDB, Redis, distributed systems, system design, LeetCode, GeeksforGeeks, "Designing Data-Intensive Applications", Educative, ByteByteGo; job titles: software engineer, backend developer, SRE, data engineer; behaviours: engaged with technology content. Exclude existing customers (Supabase email list upload).
- *Meta lookalike:* 1% LAL of email subscribers once list > 1,000; 1% LAL of purchasers once > 100.
- *Meta retargeting:* site visitors 30d (quiz page, free chapters) → pricing ad; pricing-page visitors 14d who didn't buy → objection ad; video viewers 50%+ → quiz page ad.
- *Google Search:* exact/phrase match on 25 keywords (list in `marketing/keywords.md`); negatives: "free", "pdf", "download", "jobs", "salary".
- *X:* follower lookalikes of @andy_pavlo, @alexxubyte, @arpit_bhayani, @gergelyorosz, @hnasr, @franckpachot; keyword targeting "B-Tree", "postgres internals", "system design interview".
- *LinkedIn:* matched audiences (site retargeting), job titles SWE/backend/SRE 2–10 YOE, skills PostgreSQL/distributed systems; India + US.

**Creative angles (at ₹4k, test one angle per two weeks, in this order; the full five-way test starts at ≥ ₹15k)**

1. **Pain (2am):** "You restarted the database three times. Nobody knew what the lock queue looked like."
2. **Deep knowledge:** "DDIA tells you what. This shows you how — with 28 simulations you can drive."
3. **Interview:** "The DB round is decided by the follow-up question. We only teach the follow-ups."
4. **First principles:** "A B-Tree finds any row in a billion in 4 disk reads. Here's the arithmetic." (the math *is* the ad)
5. **Time savings / price:** "CMU's database course is 50 hours of video. This is 32 chapters of text you can read at your speed, for ₹1999. Once."

**Five ad copies**

| # | Platform | Headline | Primary text | Description / CTA |
|---|---|---|---|---|
| 1 | Meta reel ad (angle 4) | **4 disk reads for a billion rows** | "Every tutorial says 'B-Trees are balanced trees for disk.' Useless. The real reason: a 4KB page holds 250 keys, so height = log₂₅₀(N). That's 4 reads for a billion rows. Watch the tree split, then take the 8-question challenge." | "Take the challenge" → quiz page |
| 2 | Google Search (angle 2) | **Database Internals Course — Interactive** / *Storage engines to consensus. 32 chapters.* | "B-Trees, WAL, MVCC, LSM, Raft — with 28 simulations you can drive and 160 quizzes with the why. First 3 chapters free. ₹1999 lifetime." | Sitelinks: Free chapters · Pricing · PocketDB capstone |
| 3 | Meta retargeting (angle 3) | **You scored 5/8** | "The three you missed are chapters 8, 10 and 17. They're also the three most common follow-up questions in DB interviews. All 32 chapters, 28 machines, and the build-your-own-database capstone: ₹1999 once." | "Unlock all 32 chapters" → pricing |
| 4 | X promoted (angle 1) | (thread 2 promoted, first tweet) | "Your database acknowledged the commit. Then the power went out. The data pages were never written. You lost nothing. Here's why 🧵" | none (native thread) |
| 5 | LinkedIn thought-leader (angle 5) | (founder's post promoted) | "Unpopular in edtech: video is the wrong medium for database internals. You can't ctrl-F a lecture. Here's why I bet a company on text you can drive." | "Learn more" → free chapter 1 |

**A/B testing plan**

- *Weeks 3–4 (₹1,800):* angle 4, the B-Tree arithmetic reel → quiz page, optimise for Leads. Goal: a first CPL number.
- *Weeks 5–6 (₹1,800):* angle 3, the interview follow-up reel, same landing page. Compare CPL.
- *Weeks 7–8 (₹2,000):* winning angle; landing page test, quiz challenge vs free chapter 1 (expect quiz to win on CPL, chapter on paid conversion; measure both).
- *Weeks 9–12:* if site traffic > 1,500 sessions/month, switch the whole budget to retargeting (site 30d → pricing). Otherwise keep the winner running. Reinvested money above ₹4k goes to the next stage in the table above.
- One variable per test, two weeks minimum, ₹1,800 minimum per cell. Small budgets need longer tests, not more of them.

**Funnel structure**

```
TOF  Organic (X, LinkedIn, IG) + one Meta reel campaign  →  quiz challenge / free chapter   (optimise: leads, CPL ≤ ₹100)
MOF  Email sequence                                      →  pricing page                    (optimise: pricing views)
BOF  Email 4/5 + Meta retargeting from month 3           →  purchase                        (optimise: purchases, CAC ≤ ₹800)
```

Tracking: Meta Pixel + Conversions API via Razorpay webhook (already have the webhook function — add a server-side purchase event), Google Ads conversion on the Razorpay success callback once Search starts, UTM on every link (`utm_source=ig|x|li|google`, `utm_medium=organic|paid|email`, `utm_campaign=<pillar>-<chapter>`, `utm_content=<hook-id>`).

---

## 8. Community & Partnerships

**Discord (not Slack — students live on Discord)**

- Launch in week 5 once > 50 paying members exist; an empty Discord is worse than none.
- Channels: `#chapter-discussion` (one thread per chapter), `#pocketdb-builds` (members post their repo), `#prod-war-stories`, `#interview-debrief`, `#networking-in-depth-preview` (paid members only; early access = retention lever).
- Rituals: weekly "quiz night" (founder posts 5 questions live, 20 minutes), monthly "internals office hour" voice call, "diagram of the week" pinned.
- Members-only, invite in the post-purchase email. Keeps quality high and makes membership feel like membership.

**Creators & influencers (tiered)**

| Tier | Who | Deal | Ask |
|---|---|---|---|
| Ally | Arpit Bhayani, Gaurav Sen, Hussein Nasser, Franck Pachot, Phil Eaton | Free lifetime access, no strings | Honest feedback; if they like it they mention it |
| Micro (5–50k) | 10 CS-Twitter/LinkedIn creators posting system design/DB content | 40% affiliate for 90 days + free access | One thread/post each with their honest take; one sim clip they can use |
| YouTube | 3 channels (Indian CS ed, 50–300k subs) | Affiliate-only (40%) + free access; paid segments (₹15–40k) only after revenue > ₹30k/month | "I tried Hack Dynamics' build-your-own-database capstone" video |
| Newsletter | Quastor, Pointer, TLDR (dev), Hacker Newsletter, The Pragmatic Engineer (classifieds), ByteByteGo | No sponsorships at this budget. Pitch a free guest piece (one mechanism + simulation link) or a link swap with your newsletter | When revenue > ₹30k/month: sponsor the quiz challenge, not the course — a challenge converts cold readers |
| Podcasts | Software Engineering Daily, Ship It, Backend Banter, Indian dev podcasts | Guest appearance (free) | "How to build a database from an empty file" |

Outreach rule: lead with something useful (a clip, a diagram they can use, a correction with a mechanism), never a pitch. 5 outreach DMs/week, tracked in a sheet.

**Affiliate / referral program**

- *Affiliates (creators):* 40% of first purchase, 90-day cookie, Razorpay payment link per affiliate (`?ref=<name>` captured into Supabase profile at signup). Paid monthly. Simple enough to run from a spreadsheet at this scale.
- *Member referral:* "Give a month, get a month." Referrer and referee both get one free month on the monthly plan; lifetime members get a ₹500 Amazon voucher per 3 referrals. Referral link on the member's progress page.
- Track: referrals/member/month; target 0.15 by day 90.

---

## 9. KPIs & Metrics

**North star: new paying members per week.** (Not followers, not impressions.) Secondary north star once the product loop matters: weekly active learners completing ≥1 chapter.

**Pirate metrics with 90-day targets**

| Stage | Metric | Week 4 | Week 8 | Week 12 |
|---|---|---|---|---|
| Acquisition | Impressions/week (all 3 platforms) | 100k | 250k | 500k |
| | Followers (X / LI / IG) | 600 / 400 / 800 | 1,500 / 900 / 2,000 | 3,000 / 1,800 / 4,000 |
| | Site sessions/week | 800 | 2,500 | 5,000 |
| Activation | Email subscribers (cumulative) | 200 | 700 | 1,800 |
| | Quiz challenge completions/week | 80 | 250 | 500 |
| | Free-chapter readers/week | 250 | 800 | 1,600 |
| Revenue | New paying members/week | 3 | 8 | 15 |
| | Revenue/month (₹) | 15k | 35k | 65k |
| | Ad budget that revenue unlocks next month (₹) | 8.5k | 14.5k | 23.5k |
| | CAC (paid only; noisy at this spend) | ≤ ₹1,500 | ≤ ₹1,000 | ≤ ₹800 |
| | CPL (quiz email) | ≤ ₹150 | ≤ ₹110 | ≤ ₹90 |
| Retention | Monthly-plan month-2 retention | — | 60% | 65% |
| | Chapter-completion rate (paid) | 30% | 35% | 40% |
| Referral | Referrals per member / month | — | 0.05 | 0.15 |

**Weekly review (Friday, 30 minutes):** top 3 posts by bookmarks/saves → what hook pattern? Bottom 3 → kill the pattern. CPL and CAC by campaign → reallocate 20% from the worst to the best. Email sequence open/click per email → rewrite the worst subject line.

**Tools for tracking:** GA4 or Umami Cloud free tier (works on a static site, UTM reports), Supabase SQL for signups → paid (one saved query, run weekly), Meta/Google/X/LinkedIn native dashboards, Buttondown analytics, a single Google Sheet "Weekly Scorecard" with the table above as rows.

---

## 10. Tools & Resources

| Need | Tool | Cost/mo | Note |
|---|---|---|---|
| Drafting | `marketing/repurpose.mjs` (built) | API usage (~₹40/chapter) | Chapter → 12 drafts |
| Scheduling | Typefully free tier (X + LinkedIn) + Meta Business Suite (IG) | ₹0 | Upgrade (₹1,000) only when the free tier's scheduling limit bites |
| Diagrams | Excalidraw (brand library) + Figma free plan for carousel templates | ₹0 | Build one Figma carousel template, reuse forever |
| Screen recording | macOS built-in (⌘⇧5) | ₹0 | Record the site in dark theme at 1080×1350; crop in CapCut |
| Video editing | CapCut (captions, 9:16) | ₹0 | Auto-captions are good enough |
| Code images | ray.so | ₹0 | PocketDB snippets |
| Email | Buttondown | ₹0 to 100 subscribers, then ₹750 | The one tool worth paying for; it holds the asset |
| Analytics | GA4 or Umami Cloud free tier | ₹0 | UTM + goals on a static site |
| Ads | Meta Ads Manager only for now | spend only | Server-side purchase events from the Razorpay webhook |
| Link/UTM | A sheet + `?utm_...` convention | ₹0 | No link shortener needed; long UTM links are fine in bios |
| Community | Discord | ₹0 | |
| Auto-DM | Instagram's built-in keyword auto-replies | ₹0 | ManyChat (₹1,300) only after 2k followers and revenue to cover it |
| Affiliate tracking | Supabase `ref` column + sheet | ₹0 | |

Total tooling: **₹0/month until 100 email subscribers, then ₹750**, plus the ₹4,000 ad budget. The only other cost is Claude API usage for the draft generator, roughly ₹40 per chapter.

---

## 11. Risks & Mitigations

| Risk | Signal | Mitigation |
|---|---|---|
| **Ad fatigue** | Frequency > 3, CTR drops 30% week-over-week | 3 new creatives every 2 weeks from the repurpose pipeline; rotate angles; cap frequency at 2.5 on retargeting |
| **Algorithm changes** | Reach drop on one platform | Email list is the asset; never let any platform be > 50% of traffic; cross-post everything |
| **Content saturation** ("system design" is crowded) | Low engagement on generic topics | Go where others can't: simulations, PocketDB code, first-principles corrections with numbers. Never post a generic architecture diagram. |
| **High CPL / CAC** | CPL > ₹200 for two weeks, or a month of spend with zero paid conversions | Pause the campaign, fix the funnel step with the worst conversion (usually quiz → email or email → pricing), then restart. Never "spend more to find out" at this budget |
| **Budget too small to learn** | Meta reports "learning limited" | Expected. Optimise for Leads (cheap event, more signal), not Purchases. Judge on two-week windows, not daily. |
| **Single-course catalog** | "Only databases?" objection | Position as *the database track*; ship Networking teasers; waitlist |
| **Paywall kills sharing** | Social traffic bounces at the gate | Free chapters 1, 5, 8 (the product change above). Non-negotiable. |
| **Founder burnout** | Missed posting days | Batch: record all sims in one day, generate 4 chapters of drafts at once, schedule 2 weeks ahead. Minimum viable week: 5 X posts, 2 LI, 2 IG. |
| **Copyright of source material** | Course draws on Petrov's *Database Internals* | All course text is original (README). Never quote the book in marketing; cite it as recommended reading. |
| **Razorpay/international payments** | Non-India buyers can't pay | Enable international cards in Razorpay; add USD display price ($24 lifetime) on pricing page |

---

## 12. 90-Day Execution Timeline

**Phase 0 — Foundations (Week 1)**
- Make chapters 1, 5, 8 free. Deploy `quiz-challenge.html` with the Buttondown form action set. Install GA4 or Umami (free). Add Meta Pixel + Google tag. Add server-side purchase event to the Razorpay webhook.
- Set up: Typefully, Buttondown (5-email sequence loaded from `nurture-emails.md`), Meta/Google/X ad accounts, company LinkedIn page, Instagram business account.
- Record all 28 simulation clips (one afternoon, macOS screen recorder). Build the Figma carousel template.
- Run `repurpose.mjs` on chapters 1, 5, 8, 10, 17, 20 → 70+ drafts. Edit and schedule weeks 1–2.

**Phase 1 — Organic engine (Weeks 2–4)**
- Week 2: full posting cadence starts (X 2/day, LI 5/wk, IG 4 reels + 2 carousels). Reply routine daily. Thread 1 (B-Tree).
- Week 3: Meta Leads campaign live, angle 4 reel → quiz page, ₹130/day, India only. Thread 2 (WAL). Cheat-sheet lead magnet live.
- Week 4: first weekly scorecard. First CPL number. Thread 3 (quorum poll). First creator outreach batch (5 allies get free access). **Target: 200 emails, 12 paying members.**

**Phase 2 — Paid + partnerships (Weeks 5–8)**
- Week 5: Switch the Meta campaign to angle 3 (interview). Discord launched once there are 50 members; otherwise a members-only email thread. Thread 4 (PocketDB build). LinkedIn 30-day-plan document post.
- Week 6: Micro-creator affiliate batch (10, affiliate-only). Newsletter guest-piece pitches (3). Apply month-1 revenue to month-2 budget (30% rule).
- Week 7: Winning angle + landing page test (quiz vs free chapter). Networking-in-Depth waitlist page + teaser posts start. Thread 5 (optimizer).
- Week 8: Second scorecard review. Podcast outreach (3). **Target: 700 emails, 45 paying members, CPL ≤ ₹110.**

**Phase 3 — Scale what works (Weeks 9–12)**
- Week 9: If site traffic > 1,500 sessions/month, move the whole Meta budget to retargeting (site 30d → pricing). Member referral program live. YouTube creator video #1 (affiliate).
- Week 10: Community thread ("what clicked?"). Repurpose chapters 21–32 (second wave of drafts). Instagram keyword auto-replies if IG > 2k.
- Week 11: Monthly-vs-lifetime messaging test in retargeting. If reinvested budget ≥ ₹15k, start Google Search (exact match, mechanism keywords). Networking launch-pricing announcement to waitlist.
- Week 12: 90-day review against §9 table. Decide: keep the 30% reinvestment rule, raise it to 50%, or fix the funnel first. Plan Q2: Networking in Depth launch campaign (waitlist → launch week → creators). **Target: 1,800 emails, 120 paying members, CPL ≤ ₹90.**

---

## Long-term growth strategy (months 4–12)

1. **The course launch flywheel.** Every new course (Networking, Postgres, Redis…) is a launch: waitlist → early-bird → creators → retargeting to existing members ("bundle"). Each launch grows the list by 30–50%. Existing members are the cheapest acquisition channel: a *track* subscription (all courses, ₹4999 lifetime) becomes the anchor offer.
2. **SEO as the compounding channel.** Each chapter's free excerpt becomes a public page with a simulation embed ("How B-Trees work — interactive"). 32 chapters × 5 courses = 160 indexable, genuinely-best-on-the-web pages. This overtakes paid by month 9 if started in month 4.
3. **Founder as the brand.** The personal profile is the distribution. Grow to 25k X / 15k LinkedIn by month 12 with the same daily routine.
4. **Cohort layer (optional, high margin).** Quarterly 4-week "Build PocketDB together" cohort at ₹9,999 with live office hours. 30 seats = ₹3L/quarter, and it produces the best testimonials and repos.
5. **B2B.** Teams of 5+ at ₹1499/seat; sell to engineering managers via LinkedIn. Companies buy databases training.
6. **Content moat.** The simulations are the moat. Open-source one or two (embed-able B-Tree viz) with attribution → backlinks + brand.

---

## What's built in this repo

| File | What it does |
|---|---|
| `marketing/PLAN.md` | This plan |
| `marketing/calendar.csv` | 30-day content calendar, 100 posts (day, platform, format, pillar, topic, hook, CTA) |
| `marketing/repurpose.mjs` | Chapter → 12 post drafts via Claude, from the real course data (`node marketing/repurpose.mjs 8`) |
| `marketing/nurture-emails.md` | Full copy for the 5-email sequence |
| `marketing/keywords.md` | Google Search keyword list + negatives |
| `quiz-challenge.html` | The 8-question lead-magnet quiz, reuses `js/quiz.js`, email capture |
