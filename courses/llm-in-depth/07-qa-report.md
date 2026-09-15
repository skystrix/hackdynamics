# LLM In Depth — Phase 7 Deliverable: Whole-Course QA Report

**Status:** Phase 7 complete. **Not release-clean:** two §11.4 items stay open (§2.4 and §2.8), and one needs the owner (§4).
**Date:** 2026-09-16. Phase 6 map: `06-outcome-assessment-map.md`.

Scope: guide §4 Phase 7. I read the whole course in order as a learner, checked it against every §11.4 item with evidence, ran every machine and every quiz in a browser, and ran the capstone tests I could rebuild. Every fix made is listed in §3.

---

## 1. What was done

- **Read front to back.** All 41 chapters, about 127,000 words of section prose (figures and code stripped out for reading, then checked separately), plus all 462 questions and 230 exercises from Phase 6. Every figure the prose states was re-derived where the arithmetic is on the page, and every "section N" or "Chapter N" pointer was checked against its target.
- **Mechanical passes over the text.**
  - Every `Chapter N` reference was checked for out-of-range numbers and forward references.
  - Topic keywords were checked against each cited chapter number (about 25 topic families).
  - Corvid-8B's recurring figures were checked across chapters.
  - Every "Author et al. / and colleagues … year" citation was compared with the reading map.
  - The Blueprint's nine orphan placements were checked in the delivered text.
- **Browser.** The real reader page ran with the edited data file stubbed in for the Edge Function. For each of the 41 chapters it mounted every machine and answered every quiz question with its own key. This was done in light at desktop width and in dark at 375 px, then again after all Phase 7 edits.
- **Gate.**
  - The live function was queried anonymously.
  - `toPreview` was replayed over the LLM data file to confirm paid text is absent.
  - The locked-stub page was rendered.
- **Capstone.** The capstone code was rebuilt from the chapters' own excerpts in a scratch venv (torch 2.x, transformers, safetensors) and the chapters' tests were run against the cached GPT-2 and SmolLM2-135M weights. Details and limits are in §2.4.

---

## 2. §11.4 course definition of done, with evidence

### 2.1 Gap Matrix: every core and supporting row lands in a chapter — **Pass**

The Blueprint's coverage check (§6) placed nine first-pass orphans. All nine are present in the delivered text:

- n-grams (Ch 5)
- BERT-family masked LMs (Ch 4)
- RNNs/LSTMs (Ch 5)
- multi-token prediction (Ch 28)
- state-space models (Ch 25)
- Shampoo/Muon (Ch 14)
- streaming (Ch 30)
- Axolotl/Unsloth/TRL (Ch 21)
- `torch.compile`/CUDA graphs (Ch 16, Ch 30)

Outcome coverage is in the Phase 6 map: 41 of 41.

### 2.2 Reads front to back as one story; recurring examples consistent; numbering consistent — **Pass after fixes**

The arc holds: one function (Part I), the block (II), making a model (III), making it useful (IV), making it fast, correct and safe (V), then building it (VI). The recurring devices stay stable:

- **Corvid-8B:** 8.03B, 16.06 GB, 128 KB/token, 8,192 context, H100 ridge point 295, KV crossover 122,528. These agree across Chapters 1, 2, 4, 6, 7, 9, 16, 21, 26, 27 and 29.
- **The 16 GB budget.**
- **Prompts P1–P5.**
- **The Almanac.**

The read found **48 defects**, all fixed and listed in §3:

- 18 wrong numbers or internal contradictions
- 3 places where the prose contradicted its own machine
- 23 cross-references to the wrong chapter or section
- 4 wording or count slips

None was visible to Phase 5's per-machine checks or Phase 6's assessment read, which is the case for doing this pass.

Shape notes that are not defects:

- **Chapter 21 has 21 terms** (guide: 10–20).
- **Some chapters exceed 8 teaching sections.** The Blueprint declared this for 19, 29, 30, 32, 33 and 41; Chapters 21, 23, 37 and 40 also run to 9, undeclared.

Both are recorded so nobody rediscovers them.

### 2.3 Three free chapters show at least two machines and the voice — **Pass**

`free: true` is set on Chapters 1, 2 and 5, as the Blueprint specified. Their machines:

- **Chapter 1:** `llmNextToken`, `llmCourseMap`
- **Chapter 2:** `llmBpeTrainer`, `llmVocabTradeoff`, `llmTokenizerCompare`
- **Chapter 5:** `llmAttention`, `llmCausalMask`, `llmAttentionCost`

That is 8 machines before the paywall. The live function's anonymous payload returns exactly these three in full.

### 2.4 Capstone: every layer's test passes; benchmark reproduced; confession table complete — **Partial. Open.**

**The blocker.** The capstone chapters show the PocketLM code as excerpts (11 to 23 blocks per chapter), not as complete programs, and the full source that produced every number in Part VI is not in the repository. It lived in an earlier session's scratchpad, which has since been cleaned. Likewise *The Almanac*, the corpus Chapters 35, 37, 40 and 41 train and evaluate on, is not in the repo and not offered to learners.

Two consequences:

1. A learner cannot reproduce the capstone's published numbers.
2. This QA pass could not re-run the long tests byte-for-byte.

Guide §9 asks for code "complete enough to compile as shown … no hidden helper files". The excerpts are faithful, but they are not complete.

**What was re-executed, from the chapters' own lines plus minimal glue:**

| Chapter | Claim in the text | Rebuilt result | Verdict |
|---|---|---|---|
| 35 | Fuzz: 100,000 random byte strings, 0 failures | 0 failures | Pass |
| 35 | Lossless round-trip; streaming decoder equals whole decode on Tamil | Both true | Pass |
| 35 | A user cannot type a special token | No special id produced | Pass |
| 35 | Ex1: `train("low low lower lowest", 262)` gives six merges | **Three**: the chapter's own `freq < 2` rule stops it | **Defect, fixed** (§3) |
| 36 | Attention equals `F.scaled_dot_product_attention` (< 1e-5) | 1.8e-07 (float32) | Pass |
| 36 | Cached path equals uncached; not bit-identical in float32 | 1.3e-06, `torch.equal` False | Pass |
| 36 | Q4: `tril()` without the offset leaves a row True only at position 0 | `[True, False, False, False, False, False]` | Pass |
| 36 | Model total 23,375,872 "is `sum(p.numel())`" | 23,376,896: the final norm's 1,024 was left out | **Defect, fixed** |
| 37 | Step-0 loss 8.83 against ln(8,256) = 9.019 | 8.82 | Pass |
| 37 | `lr_at` gives every logged learning rate | 1.53e-04 @50, 2.82e-04 @250, 1.88e-04 @500, 3.00e-05 @999, 2.60e-04 @150 of 300 | Pass; also proves the crash log is a 300-step run (**defect, fixed**) |
| 38 | RoPE score depends only on the gap | dot(5,3) = dot(105,103) to 1e-6 | Pass |
| 38 | GQA 8→2 KV heads removes 12.5% of a block; SwiGLU width 1,365 | 393,216 (12.5%); 1,365 | Pass |
| 39 | GPT-2: 160 tensors, 124,439,808 params, logits < 1e-10 in float64 | 160; 124,439,808; **2.3e-13** | Pass |
| 39 | GPT-2 greedy text; cached path identical | Identical text to the chapter; identical tokens | Pass |
| 39 | Ex2: guard `endswith('attn.bias')` drops 12 QKV biases; Ex1: untransposed `c_proj` passes the shape check | 12 missing, `h.0.qkv.bias`…; passes shapes, logit error 115 | Pass |
| 39 | SmolLM2: 134,515,008 params; 5.74e-05 before matching the reference's float32 RMSNorm cast, then ~8e-06; tolerance 1e-4 | 134,515,008; **5.744e-05** before; **1.0e-05** after | Pass (five prompts, not the chapter's 100) |
| 39 | SmolLM2 greedy text; cached identical | Identical to the chapter; identical | Pass |
| 40 | Freeze-then-wrap: 60 modules, 460,800 trainable of 134,975,808; without the freeze 121,704,768 (90.168%) | Exactly those four numbers | Pass |
| 40 | Adapter at init is the identity (max\|d\| = 0) | 0.00e+00 | Pass |
| 40 | Merge exact in float64, 1.97e-04 in float32 | 1.1e-13 and 9.0e-05 with random B | Pass in kind; see note |
| 40 | DPO step-0 loss is ln 2 | 0.6931 | Pass |

Note on Chapter 40: "exactly zero in float64" is data-dependent. With random adapters float64 gives 1e-13, not 0. The chapter's claim is about its trained adapter and is not wrong, but a learner may not see a literal zero.

**Not re-executed.** Each of these needs the missing source or corpus, or hours of compute:

- **Chapter 37:** the 1,000-step pretraining run (72 minutes, needs *The Almanac*) and the crash/resume run.
- **Chapter 38:** the ablation training runs.
- **Chapter 40:** the SFT and DPO training runs and their interval tables (needs the 3,000-pair dataset).
- **Chapter 41:** the C engine itself. The chapter shows 23 excerpts of a 381-line file, and `llama.cpp` is not installed here, so neither the token-match test nor the benchmark was re-run.

The confession tables are complete in every capstone chapter. Each names its simplifications and the chapter that holds the real machinery. Chapters 37, 38, 40 and 41 are unusually candid about what was not measured.

**What closes this item.** Reconstruct PocketLM (Python and C) and a reproducible *Almanac* into a companion directory or repository, run the four long tests against it, and link it from Chapter 35. See §4.

### 2.5 Reading map complete: every paper, RFC and doc named in the text is listed — **Pass after fixes**

The citation sweep flagged 36 author-year citations missing from the Blueprint's §5 reading map. Hand-checking left 30 real omissions: the other six were co-authors of works already listed, or a later year matched beside an earlier listed work. The manual read added two more, Miller 2024 and GSM1k. All 32 are now listed under "Added at Phase 7" in `03-course-blueprint.md` §5.

The sweep's limit: it matches author-plus-year phrasing. Works named only by system (for example "the OPT logbook") are covered by the map's documentation lines rather than checked individually.

### 2.6 Every machine and quiz exercised in a browser, both themes, desktop and 375 px — **Pass**

| Pass | Theme | Width | Chapters | Machines mounted | Quizzes completed at full marks | Errors | Page overflow |
|---|---|---|---|---|---|---|---|
| 1 | light | desktop | 41 | 81 of 81 (82 frames) | 462 of 462 | 0 | none |
| 2 | dark | 375 px | 41 | 81 of 81 | 462 of 462 | 0 | none |
| 3 (after all edits) | light | desktop | 41 | 81 of 81 | 462 of 462 | 0 | — |

What these passes do and do not show:

- **Keys.** Answering every question with its own key and reaching N / N proves that every `mc` index, every `blank` first spelling (under the engine's normalisation) and every `order` sequence is consistent with how the quiz engine renders it.
- **Machine controls.** Per-control sweeps of each machine were done in Phase 5 (`.sweep.js`) and were not repeated; the passes above prove mounting and theme.
- **Machine numbers re-checked in passing:**
  - `llmBlock` reports 4.91×, 0.14× and 2.6e-10× for its three modes, matching the new Chapter 8 prose.
  - `llmPocketShapes` now lands on 23,376,896.

### 2.7 Gate: anonymous sees preview with locked stubs; premium sees full — **Anonymous verified; premium verified by construction only**

- **Live function, anonymous, 2026-09-13.**
  - `?course=llm` returns 200, 41 chapters: 38 `locked`, full content for 1, 2 and 5.
  - `?course=rag` is unchanged (200, free 1–4).
  - The owner's deploy step from Phase 8 has therefore been done.
- **Paid body absent.** Replaying `toPreview` over the data file:
  - Probe strings from Chapter 6 section text, a Chapter 40 `why` and a Chapter 41 term are absent from the preview JSON and present in the full JSON.
  - A Chapter 2 (free) probe is present in both.
  - Preview is 154 KB against 1.82 MB full.
- **Rendering.** In the reader shell with the preview payload, Chapter 6 renders as a locked stub titled "Many Heads, and Making Them Cheap 🔒" with "Log in to unlock", no section blocks and no quiz. Chapter 5 renders its 10 questions and 3 machines.
- **Premium.** Not verified end to end: that needs a premium account token, which this pass does not use. The premium path is the same `FULL` payload that rendered all 41 chapters above, and `toPreview`'s contract is covered by `preview.test.ts`.
- **Action.** The live function still serves the pre-Phase-6/7 text. Every fix in this report and in the Phase 6 map reaches learners only after `supabase functions deploy course-content` is run again.

### 2.8 README, COURSE_PLAN, landing page and marketing updated — **Partial. Open.**

- **README.md:** courses table already lists LLM In Depth. Pass.
- **COURSE_PLAN.md:** did not mention the AI Engineering track at all (neither course). **Fixed:** added the track (LLM 01, RAG 02), the ownership split, and the candidate successors, as the Charter's §5 Phase 8 action required.
- **Landing cards (`courses.html`, `index.html`):** said 403 quiz questions. **Fixed** to 462. The other stats (41 chapters, 81 machines, 174 diagrams) were re-counted from the data and are correct.
- **Marketing:** `marketing/PLAN.md` still describes one live course, Databases in Depth. It mentions neither RAG nor LLM In Depth, and there are no LLM marketing drafts. **Open.** This is the owner's marketing workstream and was not written here.

### 2.9 Could a finisher sit the university final, the interview, and the on-call rotation? — **Yes, yes, and mostly**

- **University final: yes.** It covers the mechanism of every row a graduate NLP or LLM-systems course examines: tokenization through attention, training dynamics, scaling, RLHF/DPO, inference arithmetic and evaluation methodology. It covers them with derivations (√d_k, 6ND, the DPO cancellation, arithmetic intensity) rather than assertions, and 462 questions and 230 exercises test them.
- **Interview: yes.** There are 30+ "interview lens" callouts. The questions that separate candidates (why the first token is slow, why GQA, why Chinchilla is not followed, why DPO's margin lies) are each answered from arithmetic.
- **On-call: mostly.** Chapter 34's incident table, runbook, canary set and release identifier are the right material, and Chapters 26–30 give the diagnosis arithmetic. The doubt is the one in §2.4: the operate-and-build outcomes rest on a capstone whose code and corpus a learner cannot currently obtain. Someone who read it would know what to do; someone who tried to run it would stall at Chapter 35. That is fixable and it is the owner's call.

---

## 3. Fixes applied in Phase 7

All in `supabase/functions/course-content/_data/bookData-llm-part1.js` unless noted.

### 3.1 Wrong numbers and internal contradictions (18)

| # | Where | Was | Now | Evidence |
|---|---|---|---|---|
| 1 | Ch 6 §5 table, figure, prose, Q4 | 3 full-context MHA requests fit in 11.98 GB | **2** | 11.985 / 4.295 = 2.79. `llmKvBudget` already said 2; its header comment updated in `js/viz-llm1.js` |
| 2 | Ch 13 §6 and Q8 | Logits tensor 8.6 GB | **8.4 GB** | 4 × 8,192 × 128,256 × 2 = 8.41e9 |
| 3 | Ch 19 §7 | Input at step n = 2,000 + 800n | **2,000 + 800(n − 1)** | Q7's 76,800 over 12 steps and the figure both use (n − 1) |
| 4 | Ch 26 §6, Ex4, Q8 | TPOT drift at full context 6.5% | **6.7%** | 1.0737 / 16.06 |
| 5 | Ch 29 §7 and §9 | "Quantizing the cache buys more than the weights did" | Weights remove more bytes (12.04 vs 8.39 GB); the cache buys the larger *further* speedup (1.68× vs 1.58×) | Contradicted Q9 as written |
| 6 | Ch 30 §1 and Q1 `why` | Streams faster than ~40 ms/token outrun a reader | **~200 ms/token** | 5 tokens/s is 200 ms |
| 7 | Ch 35 Ex1 | Six merges on "low low lower lowest" at vocab 262 | Three (stops at 259), then five on the extended line, three decided by tie-break | Run |
| 8 | Ch 35 §5 | Ten ids carry "Be brief." | **Eight** | The printed id list |
| 9 | Ch 36 §1; `llmPocketShapes`, `llmPocketTraining` in `js/viz-llm1.js` | 23,375,872 parameters | **23,376,896** | Chapter 38's table rows imply it; `sum(p.numel())` in the rebuild |
| 10 | Ch 36 §2 worked example | 0.21 / 0.16, and 0.55 unscaled | **0.23 / 0.15, and 0.80** | softmax computed |
| 11 | Ch 37 §5 and §8 | Crash test "at step 500 of 1,000" beside a log from step 150 of 300 | **Step 150 of a 300-step run** (three places) | `lr_at` reproduces 2.60e-04 @150 only for total = 300 |
| 12 | Ch 1 §5; Ch 35 §2 and Q9; Ch 21 §4 | The Almanac "roughly 50 MB", "two thousand instruction pairs", "millions of words", "Chapter 20's 2,000 examples" | **About 2 MB, three thousand pairs, hundreds of thousands of words** | Ch 37 measures 1,977,951 bytes; Ch 40 uses 2,550 + 450 pairs |
| 13 | Ch 38 §2 | "Two hundred positions apart" | **A hundred** | 5 vs 105 |
| 14 | Ch 39 §7 | Tolerances differ by seven orders of magnitude | **Six** | 1e-10 vs 1e-4 |
| 15 | Ch 40 §2 figure and §4 | Base 260 MB, ratio 1 to 148 | **269 MB, 1 to 146** | 134.5M × 2 bytes; 460,800 × 4 bytes |
| 16 | Ch 40 §2 | "Three targets were chosen" | **Two** (q_proj, v_proj) | `inject`'s own argument |
| 17 | Ch 41 §4 | Attention scan 61 KB at 40 tokens, 12.6 MB at 8,192, "5%" | **1.8 MB and 377 MB per token** (per-layer figures had been compared with whole-model weights); at 8,192 the cache exceeds the weights | 30 × T × 768 × 2 |
| 18 | Ch 2 §6 | "Those five figures" | **Four** | Four models listed |

### 3.2 Prose contradicting its own machine (3)

Recorded as open in the Phase 5 memory notes and closed here:

| # | Where | Was | Now |
|---|---|---|---|
| 19 | Ch 8 §1 | Turn residuals off and the layer-1 gradient "falls to roughly nothing" | Falls less than expected because the norm rescales it; remove the norm too and it vanishes (machine: 4.91× / 0.14× / 2.6e-10×) |
| 20 | Ch 8 §3, Q3 `why`, interview lens | "SwiGLU wins on equal parameters" | Scoped to Shazeer's comparison and scale; the section's own machine finds matched SwiGLU 0.0045 worse at small scale |
| 21 | Ch 11 §1, figure, next paragraph, Q6 `why` | Answer takes the lead "about two thirds of the way up"; last layers never change the winner | Late (GPT-2: block 11 of 12), and the machine has a prompt where the last block hands the lead away |

### 3.3 Cross-references to the wrong chapter or section (23)

| Where | Was → Now |
|---|---|
| Ch 3 checklist | template in `tokenizer_config.json`: Section 6 → **5** |
| Ch 12 §1 | "Chapter 15 will show a model of Corvid's size *wants* 15T tokens" → **is trained on** (Ch 15's compute-optimal figure is 160.6B) |
| Ch 17 §3 | heads are independent: Chapter 5 → **6** |
| Ch 18 §6 | the context window: Chapter 6 → **7** |
| Ch 19 §4 | "the machine two sections down" → **the next section** |
| Ch 20 §6 | gradient accumulation: Chapter 17 → **14** |
| Ch 21 §1 figure caption | "the next section but one" → **section 5's four-bit base** |
| Ch 25 §7 | prompt P4: Chapter 6 → **7** |
| Ch 30 §3 | constrained decoding: Chapter 20 → **19** |
| Ch 30 §4 | kernel fusion: Chapter 28 → **16** |
| Ch 36 §6 (×2) | the residual path and pre-norm mechanism: Chapter 14 → **8** |
| Ch 36 §7 and Q7 `why` (×2) | temperature-zero determinism: Chapter 32 → **18** (Ch 32 never discusses it) |
| Ch 37 §2 | padding arithmetic: Chapter 27 → **20** |
| Ch 37 §9 | precision: Chapter 29 → **14** |
| Ch 40 §3 | padding: Chapter 27 → **20** |
| Ch 41 §3 | the block: Chapter 6 → **8**; the causal mask: Chapter 6 → **5** |
| Ch 41 §4 | grouped-query attention: Chapter 12 → **6** |
| Ch 41 §6 | reproducibility: Chapter 31 → **18** |
| Ch 41 §10 | flash attention: Chapter 14 → **28** |
| Ch 41 §11 | speculative decoding: Chapter 19 → **28** |

### 3.4 Wording and counts (4)

- **Ch 5 §5:** the score-memory table was introduced as "one head" but reports per head and all 32 heads. The introduction now says so.
- **Ch 12 blurb:** 78 words (guide: 80–130). Extended by one clause.
- **Ch 33 §8:** a sentence began lowercase ("one evaluation").
- **Landing cards** (`courses.html`, `index.html`): 403 → 462 quiz questions.

### 3.5 Documents

- `03-course-blueprint.md` §5: 32 works added to the reading map.
- `COURSE_PLAN.md`: AI Engineering track added.
- `06-outcome-assessment-map.md`: two stale details corrected (deploy status; one distractor length).

---

## 4. Gate: what the owner decides

In order of consequence:

1. **The capstone's source and corpus (§2.4).** This is the one thing standing between the course and §11.4.
   - **Option A (recommended):** reconstruct PocketLM, both the Python for Chapters 35–40 and the C engine for 41, plus a reproducible *Almanac*, as a companion directory. Re-run the four long tests against it and link it from Chapter 35. The rebuilds in this pass cover about a third of it already (tokenizer, block, loaders, LoRA units), and they agree with the chapters wherever they overlap.
   - **Option B:** keep the capstone as read-only and say so in Chapter 35.
2. **Redeploy the content function.** Every fix in Phases 6 and 7 is in the repo and not yet live.
3. **Carried from Phase 6, still undecided:**
   - the option-length rewrite (95.6% of multiple-choice keys are the longest option, in this course and in RAG)
   - the drafted distillation question for Chapter 21
   - whether the LLM judge belongs inside the capstone harness
4. **Marketing (§2.8).** `marketing/PLAN.md` predates both AI-track courses.

Premium-path gate verification (§2.7) can be closed by anyone with a premium test account in five minutes: log in, open Chapter 6, and confirm it renders in full.
