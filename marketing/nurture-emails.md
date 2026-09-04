# Nurture sequence — 5 emails after the quiz challenge

Load into Buttondown as an automation triggered on the `quiz` tag. Plain text, no images except the one diagram link per email. Sender: founder's name, not "Hack Dynamics". Reply-to: the founder's real inbox — replies are the best research you'll get.

Merge fields: `{score}` (0–8), `{missed}` (comma-separated chapter numbers for wrong answers, e.g. "8, 10, 17"). The quiz page passes both as hidden form fields.

---

## Email 1 — immediately

**Subject:** Your score ({score}/8), and what it means
**Preview:** Every miss maps to one chapter. Here they are.

Hi,

You scored {score}/8 on the database internals challenge.

Here's the honest read of that number:

- 8/8: you already think from the internals up. The course will still show you things you've never *seen* move (a B-Tree split, an LSM compaction, a Raft election) — but you'll go fast.
- 5–7: you know the vocabulary and you're guessing at the mechanism. That's exactly the gap the course closes.
- 0–4: you've been taught the controls, not the machine. Good news: nothing here is hard once you see it move.

The questions you missed map to chapters {missed}. Three of the chapters are free, no login:

- Chapter 1 — how a query travels through the six layers of a DBMS
- Chapter 5 — B-Trees, and the arithmetic that makes them 4 disk reads for a billion rows
- Chapter 8 — the write-ahead log, and why a crash mid-write loses nothing

hackdynamics.com/databases-in-depth.html

Over the next ten days I'll send you the two ideas from the course that change how people read a database forever. One at a time.

— Santanu

---

## Email 2 — day 2

**Subject:** The 4-disk-read trick
**Preview:** Why every database on earth uses a B-Tree, in one line of arithmetic.

Every tutorial says "B-Trees are balanced trees optimised for disk." That sentence explains nothing.

Here's the actual reason.

A disk reads in pages: 4 KB, sometimes 8 or 16. A B-Tree node *is* a page. A 4 KB page holds roughly 250 keys.

So the tree's height is log base 250 of the number of rows:

    log₂₅₀(1,000,000,000) ≈ 3.7

Four levels. Four disk reads to find any row among a billion. And the top two levels are always in memory, so in practice it's one or two.

A binary search tree would need log₂(10⁹) ≈ 30 levels. Thirty random disk reads. That's the whole story: B-Trees exist because of fanout, and fanout exists because of page size.

The part tutorials skip: what happens when a page fills up. It splits, the middle key moves up, and if the *root* splits, the tree grows one level taller — from the top. That's why every leaf is at the same depth, always.

You can watch a split happen, key by key, in chapter 5 (free):
hackdynamics.com/databases-in-depth.html#/chapter/5

Try inserting keys in sorted order and watch which half stays full.

— Santanu

---

## Email 3 — day 4

**Subject:** I killed a database mid-write
**Preview:** The pages were never written to disk. It lost nothing. Here's the one idea behind it.

Run this experiment in your head.

You send `INSERT ... ; COMMIT`. The database replies "OK". Then, before it writes the modified pages to disk, the power goes out.

When it restarts, your row is there.

How? The data pages were never written.

Because before the database touched any data page, it appended a record describing the change to a *log* — sequential, cheap, and fsync'd to disk. Only then did it say "OK". That's the write-ahead rule: the log is durable before the acknowledgement, and the pages can be written whenever it's convenient.

On restart, recovery replays the log into the pages. In the ARIES algorithm, it replays *everything* — even the changes of transactions that were about to be rolled back — and only then undoes the losers. "Repeat history, then undo." It sounds wasteful. It's the only way to get every corner case right.

The whole thing, in PocketDB, is about 40 lines. It fsyncs only on COMMIT, never on individual writes. Losing the un-synced writes of an open transaction is *correct*: nothing was promised.

Chapter 8 has a crash simulator. You pick the moment of the crash and watch the recovery passes run:
hackdynamics.com/databases-in-depth.html#/chapter/8

(Chapter 29 is where you build it. That one's inside the course.)

— Santanu

---

## Email 4 — day 7

**Subject:** What's behind the wall
**Preview:** 32 chapters, 28 machines, one database you build from an empty file.

You've read three chapters. Here's what the other twenty-nine are.

**Part I — Storage engines** (ch 1–11): data models, normalisation done properly, relational algebra, B-Trees, file formats, transactions, B-Tree variants (copy-on-write, Bw-Trees), LSM-Trees, and every index that isn't a B-Tree.

**Part II — Query engines** (ch 12–13): how a query becomes a plan, why the optimizer guesses wrong, and why analytical engines look nothing like transactional ones.

**Part III — Distributed systems** (ch 14–20): failure detection, leader election, replication and consistency models, anti-entropy, distributed transactions, Paxos and Raft.

**Part IV — The real world** (ch 21–26): scaling patterns, running databases without losing data, modern hardware, a field guide to 13 real databases, how to choose one, and the backend engineer's handbook (connections, timeouts, retries, N+1).

**Part V — Build it** (ch 27–32): PocketDB. Pager, slotted pages, B⁺-tree, WAL that survives kill -9, MVCC, a SQL parser and executor. From an empty file.

28 interactive machines. 160 quiz questions, each with the *why*.

₹1999, once. Or ₹299 a month if you'd rather try it.

hackdynamics.com/pricing.html

One member, a backend engineer with 5 years' experience, said the thing I'd hoped someone would say: "I finally understand what EXPLAIN is telling me." That's the bar.

— Santanu

---

## Email 5 — day 10

**Subject:** The chapter people quit at (and why it's the important one)
**Preview:** It's chapter 8. Here's how to get through it.

Most people who stop, stop at chapter 8: transactions and recovery.

It's the longest chapter. It's also the one that separates "knows database words" from "can reason about a database." Isolation levels, MVCC, locking, the write-ahead log, ARIES — every 2 am production incident I've seen was a chapter-8 problem.

So here's how the course is built to get you through it:

- Every section has a simulation. You don't read about CLOCK eviction, you drive it.
- Every chapter ends with a quiz that won't let you coast. Wrong answers come with the *why*.
- Progress is saved. Twenty minutes a day works.

If ₹1999 is a decision, the monthly plan is ₹299 — one month is enough to finish Part I and know whether it's for you.

hackdynamics.com/pricing.html

If you're not going to buy, that's fine — you'll keep getting one mechanism a week from me, and I'd still like to know: what would have made you say yes? Reply and tell me. I read every one.

— Santanu

---

## Weekly newsletter template (after the sequence)

**Subject:** one mechanism, phrased as a claim ("Your read returned the old value. Not a bug.")

1. The mechanism (120–180 words, one diagram link)
2. "Try it": one simulation link
3. One quiz question. Answer below a `---` line with the *why*.
4. One line of what's being built (Networking in Depth progress)
