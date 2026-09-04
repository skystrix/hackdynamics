# RAG In Depth — Phase 6 Deliverable: Outcome → Assessment Map

**Status:** Phase 6 complete, awaiting owner approval.
**Date:** 2026-09-05. Phases 0–3 approved 2026-09-03. Phase 4 (36 chapters) and Phase 5
(42 machines) complete and on `main`.

Scope: every Charter outcome checked against every quiz question, exercise and key-term
list in the 36 chapters, plus the §8.1 / §8.2 / §8.3 assessment standard and the §11.3
definition of done.

---

## 1. What was measured

Chapters were loaded from `supabase/functions/course-content/_data/bookData-rag-part{1..4}.js`
and every `quiz` entry, exercise block and `terms` list extracted mechanically, then read
against the Charter's outcome list.

| | Count |
|---|---|
| Chapters | 36 |
| Quiz questions | 402 (302 `mc`, 64 `blank`, 36 `order`) |
| Exercises | 225 (Trace / Investigate / Build, plus one optional in most Part IV and V chapters) |
| Key terms | 596 |
| Charter outcomes | 39 (E1–E14, A1–A8, O1–O9, B1–B8) |

The Charter's §8 self-check says "30 outcomes"; the list itself contains 39. The list is
authoritative and all 39 are mapped below. The Charter line is a miscount, not a missing
outcome — worth a one-word fix at Phase 8 integration.

---

## 2. The map

Chapter numbers are the course's own. `Qn` is the nth quiz question of that chapter;
`Exn` the nth exercise. **Bold** marks the primary assessment for that outcome — the one
that would be cited if only one could be kept.

### Explain

| # | Outcome | Quiz | Exercises | Verdict |
|---|---|---|---|---|
| E1 | Hallucination, parametric vs non-parametric, Lewis 2020 | **1 Q5, Q6**, 2 Q1, Q2, Q4, 3 Q1, 18 Q1 | 1 Ex3, 2 Ex3 | Covered |
| E2 | Embeddings, bi-encoder, contrastive loss, same model both sides | **8 Q1–Q3, Q6**, 1 Q1, 7 Q10 | 8 Ex1, Ex4, Ex5 | Covered |
| E3 | Cosine / dot / Euclidean, normalization | **7 Q2, Q3**, 7 Q1 | **7 Ex1** | Covered |
| E4 | Inverted index, BM25, saturation, length | **9 Q3–Q5**, 33 Q4, Q11 | **9 Ex1, Ex2**, 33 Ex2 | Covered |
| E5 | HNSW: layers, greedy search, M, ef, recall < 1 | **11 Q1, Q3, Q4, Q6**, 34 Q4, Q10 | 11 Ex1, Ex2, 34 Ex2, Ex3 | Covered |
| E6 | IVF and PQ: centroids, nprobe, codebooks, memory trade | **12 Q1–Q7**, 13 Q10 | 12 Ex1, Ex2 | Covered |
| E7 | Cross-encoder vs bi-encoder; ColBERT late interaction | **16 Q2, Q3, Q6**, 31 Q8 | 16 Ex2 | Covered |
| E8 | RRF; why score-normalized fusion is fragile | **15 Q2, Q3, Q5**, 35 Q1, Q10 | **15 Ex1, Ex2** | Covered |
| E9 | Chunk size, overlap, boundaries; small-to-big | **5 Q1, Q3, Q6**, 6 Q1, Q8 | 5 Ex1, 6 Ex1 | Covered |
| E10 | Query–document gap: HyDE, step-back, multi-query, hypothetical questions | **14 Q1–Q5**, 6 Q4 | 14 Ex1, Ex5 | Covered |
| E11 | Lost in the middle; ordering and compression | **17 Q1, Q3, Q4**, 2 Q10 | 17 Ex2, Ex4 | Covered |
| E12 | GraphRAG: extraction, summarization, communities, global search | **24 Q2–Q4, Q6–Q8** | 24 Ex5 | Covered |
| E13 | The triad, retrieval metrics, LLM-judge limits | **25 Q1–Q9, 26 Q2–Q6** | 25 Ex1, 26 Ex2 | Covered |
| E14 | Three paradigms; FLARE, Self-RAG, CRAG as history | **3 Q4, Q5, Q7**, 20 Q5–Q7 | 3 Ex1 | Covered |

### Analyze

| # | Outcome | Quiz | Exercises | Verdict |
|---|---|---|---|---|
| A1 | Choose a chunking strategy and defend it | **5 Q9**, 5 Q2, 31 Q3 | **5 Ex5**, 31 Ex1 | Covered |
| A2 | Choose an index and set its parameters for a budget | **10 Q2, 12 Q9, Q10**, 11 Q7, 30 Q8 | 10 Ex1, 12 Ex1, 30 Ex1 | Covered |
| A3 | Attribute a failure to one of the four classes from traces | **1 Q6, Q8, 29 Q6, Q7**, 4 Q1 | **29 Ex1**, 20 Ex6 | Covered |
| A4 | Compute RRF by hand, explain a rank change | **15 Q4** | **15 Ex1**, 35 Ex1 | Covered |
| A5 | Pre- vs post- vs filtered ANN; predict the recall cliff | **13 Q1, Q3, Q4** | **13 Ex1, Ex2** | Covered |
| A6 | Long context vs retrieval, with numbers | **2 Q5, Q9**, 1 Q9 | **2 Ex2** | Covered |
| A7 | When a graph or a SQL/Cypher retriever is required | **22 Q1, Q12, 23 Q12, 24 Q11**, 1 Q3 | 24 Ex1, 22 Ex2 | Covered |
| A8 | RAG vs fine-tuning vs both | **2 Q3, Q6, Q8** | 2 Ex1 | Covered |

### Operate

| # | Outcome | Quiz | Exercises | Verdict |
|---|---|---|---|---|
| O1 | Labelled set, recall@k / MRR / nDCG, catch a model regression | **25 Q1, Q9, Q12**, 29 Q4, Q5 | **25 Ex5**, 25 Ex1, Ex3, 29 Ex5 | Covered |
| O2 | RAGAS-style judged evaluation; which score to distrust | **26 Q3, Q4, Q6, Q10** | **26 Ex6**, 26 Ex2, Ex4 | Covered |
| O3 | Trace a request end to end; read a p95 breakdown | **27 Q1, Q2, Q9**, 29 Q1 | **27 Ex5**, 27 Ex3, 29 Ex4 | Covered |
| O4 | Tune pgvector and show the recall/latency curve | **13 Q10 (new)**, 11 Q10, 13 Q6, Q7 | **13 Ex3 (extended)**, 11 Ex3, 30 Ex3 | Covered — see §4.1 |
| O5 | Document-level access control, proven by a test | **28 Q1, Q2, Q10**, 35 Q2 | **28 Ex5**, 32 Ex5 | Covered |
| O6 | Indirect prompt injection and exfiltration | **28 Q3–Q5, Q9, Q11, Q12** | **28 Ex6**, 28 Ex2 | Covered — see §4.2 |
| O7 | Re-index safely: dual-write, backfill, cut-over | **8 Q10, Q11, 29 Q2, Q3, Q12** | **29 Ex6**, 30 Ex6 | Covered |
| O8 | Semantic and prompt caching; hit rate and cost | **27 Q5–Q8**, 19 Q7, Q8 | **27 Ex4**, 27 Ex2, 17 Ex5 | Covered |
| O9 | Multi-turn: rewrite follow-ups, bound memory | **19 Q2, Q4, Q5, Q10** | **19 Ex5**, 19 Ex6, 35 Ex7 | Covered |

### Build (capstone)

| # | Outcome | Quiz | Exercises | Verdict |
|---|---|---|---|---|
| B1 | Ingest to clean, tagged, structure-aware chunks, idempotent | **32 Q2, Q6, Q8, Q12**, 4 Q5–Q7 | **4 Ex5**, 32 Ex5–Ex7 | Covered |
| B2 | Inverted index and BM25 from scratch, validated | **33 Q4, Q5, Q7** | **9 Ex5**, 33 Ex4–Ex7 | Covered |
| B3 | HNSW from scratch, recall vs brute force, recall vs ef | **34 Q5, Q6, Q12**, 11 Q4 | **11 Ex5, Ex6**, 34 Ex1, Ex4, Ex6 | Covered |
| B4 | Hybrid + RRF + cross-encoder cascade | **35 Q1, Q3, Q5, Q12**, 16 Q4 | **15 Ex5, 16 Ex5**, 35 Ex5 | Covered |
| B5 | Query rewriting, cited generation, refusal | **35 Q4, Q8, Q9**, 18 Q7, Q9 | **18 Ex5, Ex6**, 14 Ex6, 35 Ex6 | Covered |
| B6 | Evaluation harness + honest benchmark against a real store | **36 Q1, Q2, Q6, Q12** | **36 Ex1, Ex5, Ex8**, 30 Ex5 | Covered — see §4.3 |
| B7 | Tool-routing agent with a critic and a step budget | **21 Q5–Q9, Q12**, 36 Q7, Q8 | **21 Ex5, Ex6**, 22 Ex5 | Covered |
| B8 | Minimal GraphRAG index over the same corpus | **23 Q9, 24 Q7, 36 Q9** | **23 Ex5, Ex6, 24 Ex5** | Covered |

**Unmapped outcomes: none.** Every one of the 39 is tested by at least one quiz question
*and* at least one exercise. Three were thin enough to act on; see §4.

---

## 3. The finding that matters: 98% of multiple-choice keys are the longest option

Measured across all 301 `mc` questions as they stood before this pass (302 after §4.1's addition, which brings the rate to 97.7%):

| Measure | Value |
|---|---|
| Questions where the correct option is the longest | **295 of 301 (98.0%)** |
| Mean length, correct option | 145 characters |
| Mean length, distractors | 50 characters |
| Median margin (key minus longest distractor) | 81 characters |
| Questions where the key is >30 characters longer than every distractor | 270 of 301 |
| Chapters where the key is the longest in *every* mc question | 32 of 36 |

A learner who has read nothing can score about 98% on every multiple-choice question in
this course by choosing the longest option. That is a harder failure than the one §11.3
guards against ("no question is answerable by keyword matching the chapter text"): these
are answerable without the chapter at all.

The cause is uniform and visible in every chapter. The key is written as the full
mechanism — a clause, a reason, and often a measured number — while the distractors are
written as terse wrong claims. From Chapter 25 Q1, lengths 88 / 61 / 63 / **156**:

> - The smaller model is worse, since recall is the more reliable metric
> - The metrics are miscomputed, since they disagree in direction
> - The smaller model is better, since MRR weights the top result
> - **The models are indistinguishable on this eval set, and any story about the difference is a story about which metric was reported** ← key

The question is excellent. The formatting gives it away.

**The fix is to lengthen the distractors, not to shorten the keys.** The key carries the
teaching; §8.1 makes `why` the most important text in the question and the key is what
`why` elaborates. Cutting keys to 50 characters would flatten every question in the
course. Each distractor instead needs the same shape as the key: a wrong claim *with its
own reason attached*, the reason a person holding that specific misconception would give.
That also satisfies §8.1's "each wrong option is what someone with a specific
misconception would pick" more fully than the current terse forms do.

Chapter 25 Q1's second distractor, rewritten to the same shape:

> The metrics are miscomputed: recall and MRR are both computed from the same ranked list,
> so a change that moves one up and the other down indicates a bug in the harness rather
> than a real result.

Same length class as the key, and wrong for a reason a real engineer would hold.

**Cost.** 295 questions × 3 distractors is roughly 885 rewrites, spread across four data
files. As a batched pass in chapter order, comparable in size to two or three Phase 5
batches. The target is not zero — chance is 25% for a four-option question — but under
about 35%, with no chapter at 100%.

**This is not applied.** It rewrites assessment content across all 36 chapters and belongs
behind its own gate, so it is put to the owner in §6 rather than done unilaterally.

---

## 4. Thin spots, and what was done

### 4.1 O4 — pgvector tuning (fixed)

O4 asks for HNSW `m` / `ef_construction` / `ef_search` **and** IVFFlat `lists` / `probes`,
with a recall/latency curve from the learner's own machine. The HNSW half was well
covered: Chapter 13 §7 "Try It on Your Machine" walks the whole HNSW path against a local
Postgres, and Chapter 11 Ex3 sweeps `ef_search` from 10 to 320 and plots recall against
latency. The IVFFlat half appeared only in prose and in one distractor — no question or
exercise asked the learner to set `lists` or `probes` or to measure what they buy.

Applied:

- **New Chapter 13 Q10** (`bookData-rag-part2.js`): a 4M-row table on `lists = sqrt(rows)`
  measuring recall 0.42, asking what to change first and what it costs. The key is raising
  `ivfflat.probes` from its default of 1 toward `sqrt(lists)`; the distractors are the
  inverted `rows / 1000` rule, the wrong parameter family (`hnsw.ef_search`), and the
  belief that exact rescoring repairs a cell-boundary miss. `why` ties it back to Chapter
  12's measured 0.798 at `nprobe = 1` against 0.995 at `nprobe = 4`.
  Written to the §3 standard: the key is **not** the longest option.
- **Chapter 13 Ex3 extended**: after the five Section 7 steps, build the same table with
  an IVFFlat index at `lists = sqrt(rows)`, sweep `probes` from 1 to `sqrt(lists)`, and
  plot recall@10 against p95 with Chapter 10's harness. Self-check states what they should
  see: recall at the default `probes = 1` far below what the same vectors reach under
  HNSW, and the curve — not any documented default — deciding the setting.

Chapter 13 now has 11 quiz questions (§8.1 allows 8–12) and 6 exercises (§8.3 allows 3–6).

### 4.2 O6 — exfiltration through a rendered URL (noted, no change)

O6 is mapped: Chapter 28 Q3–Q5 cover what it takes for a payload to be retrieved, Q9 asks
which change reduces the *damage* rather than the probability, Q11 is the lethal trifecta,
Q12 orders the whole attack chain, and Ex6 builds a per-turn tool allow-list.

The thin part is the exfiltration channel specifically. The chapter measures it — the
payload that leaves through a fetched URL is one of the two that beats both detectors at
zero false positives — but no question makes the learner reason about the channel itself
(a rendered image, a citation link, a tool that takes a URL). Chapter 28 already has 12
questions, the §8.1 ceiling, so nothing was added: closing this properly means replacing
a weaker question, which is a content judgement for the owner.

Recommended if approved: replace Q6 (the semantic-cache leak, which repeats Q1's
placement lesson with a different prop) with a question on the outbound channel.

### 4.3 B6 — the benchmark's missing rows (noted, no change)

B6 asks for a benchmark "that compares your engine with pgvector and a hosted vector
database on the same corpus, with conditions stated". Chapter 36 delivers the harness,
the conditions and the comparison against hnswlib and FAISS (flat and IVFPQ), and states
plainly that the pgvector and hosted rows are missing because neither was reachable on the
machine the chapter was written on. The learner-facing version of those rows exists as
Chapter 36's optional Build exercise and, graded, as Chapter 30 Ex5 (build the same index
in hnswlib and in your candidate database; compare build time, memory and recall@10).

So the outcome is mapped, and the chapter's honesty about the gap is itself the course's
voice working correctly. Two options for the owner: leave it, or promote Chapter 36's
optional exercise to a graded Build exercise. Left alone for now, since promoting it makes
a chapter that already carries eight exercises heavier still.

### 4.4 Chapter 14 Q9 — answer readable off the stem (fixed)

"Mapping the user's word 'Lisbon' onto the **value** LIS that the column actually stores …
is called ____ normalization", accepting `value` / `entity value`. The stem contained its
own answer. Changed "the value LIS" to "the code LIS"; the accepted answers are unchanged.
This was the only true instance of the fault across all 64 `blank` questions.

---

## 5. §11.3 definition of done

- [x] **Outcome → assessment map has no unmapped outcome.** 39 of 39 mapped, each to at
      least one quiz question and at least one exercise.
- [ ] **No question is answerable by keyword matching the chapter text.** No keyword-match
      failures found, and the one stem leak is fixed — but 98% of `mc` keys are the longest
      option, which is a stronger form of the same fault. Open pending §6.
- [x] **Every `why` teaches.** All 402 questions carry a `why`; none is shorter than 40
      characters; spot-reading across all four files found none that restates the key
      instead of re-teaching the mechanism, and most add a measured number the question
      itself did not give.

Structural conformance to §8.1–§8.3, checked mechanically over all 36 chapters:

| Rule | Result |
|---|---|
| 8–12 quiz questions per chapter | Pass (all 36) |
| At least one `order` per chapter | Pass (36 across 36) |
| At least one `blank` per chapter | Pass (64 across 36) |
| Correct answer position distributed | Pass — 76 / 69 / 79 / 77 across indices 0–3 |
| Every `mc` has four plausible options | Pass structurally; see §3 on plausibility |
| `why` present on every question | Pass (402 of 402) |
| 10–20 key terms per chapter | 35 of 36 pass; Chapter 9 has 21 |
| 3–6 exercises, three grades labelled | Chapters 1–20 pass (4–6 each); Chapters 21–36 carry 6 graded plus 1–2 explicitly "Optional, harder" |
| Every exercise states what should be found | Pass — every one ends in a "what you should find" or "self-check" sentence |

The two rows that are not clean passes are both deliberate-looking and neither is worth an
edit: Chapter 9's 21st term is the BM25F/field-weighting alias, and the optional exercises
in Part IV and V are labelled as extras rather than presented as required work. Recorded
here so Phase 7 does not rediscover them as defects.

---

## 6. Gate

Phase 6's deliverable is this map. Two decisions belong to the owner before Phase 7:

1. **The option-length pass (§3).** ~885 distractor rewrites across 36 chapters, in
   batches, targeting under 35% longest-is-correct with no chapter at 100%. This is the
   largest remaining quality item in the course and the only one that makes every quiz
   gameable. Recommended.
2. **The two thin spots (§4.2, §4.3).** Swap Chapter 28 Q6 for an exfiltration-channel
   question; promote Chapter 36's optional benchmark exercise. Both are small and both
   change shipped chapter content, so neither was applied.

Also carried forward from Phase 5, still undecided: the shipped free chapters are 1–4,
while the Blueprint chose 1, 5 and 11 for their showpiece machines. Those machines now
exist. That is a Phase 8 decision, noted here so it is not lost.

Next: **Phase 7 — whole-course QA**, a front-to-back read as a learner against §11.4, with
every machine run in a browser, every quiz taken to completion, and every capstone test
executed.
