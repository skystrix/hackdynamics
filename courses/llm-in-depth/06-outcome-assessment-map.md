# LLM In Depth — Phase 6 Deliverable: Outcome → Assessment Map

**Status:** Phase 6 complete, awaiting owner approval.
**Date:** 2026-09-13. Phases 0–3 approved. Phase 4 (41 chapters), Phase 5 (81 machines) and
Phase 8 integration are on `main`, and the course-content function serves `llm` live.

Scope: every Charter outcome checked against every quiz question, exercise and key-term list
in the 41 chapters, plus the §8.1 / §8.2 / §8.3 assessment standard and the §11.3 definition
of done.

---

## 1. What was measured

All 41 chapters load from one file,
`supabase/functions/course-content/_data/bookData-llm-part1.js`. Every `quiz` entry, every
exercise and every `terms` list was extracted mechanically, then read in full against the
Charter's outcome list.

| | Count (after this pass) |
|---|---|
| Chapters | 41 |
| Quiz questions | 462 (364 `mc`, 57 `blank`, 41 `order`); 460 before §4 added two |
| Exercises | 230 (Trace / Investigate / Build; 5 per chapter in 1–16, 6 in 17–41) |
| Key terms | 655 |
| Charter outcomes | 41 (E1–E27, A1–A10, O1–O10, B1–B9) |

The Charter lists 40 outcomes. E27 (constrained decoding) was proposed by Phase 2 and
adopted by the Blueprint, which delivers it in Chapter 19. All 41 are mapped below.

The site's landing cards (`courses.html`, `index.html`) say "403 quiz questions". The real
figure was 460 before this pass and is 462 after it. Corrected in Phase 7.

---

## 2. The map

`Qn` is the nth quiz question of the chapter, `Exn` the nth exercise. **Bold** marks the
primary assessment, the one to keep if only one could be kept.

### Explain

| # | Outcome | Quiz | Exercises | Verdict |
|---|---|---|---|---|
| E1 | Next-token distribution; chain rule | **1 Q1, Q9**, 1 Q2, 13 Q3 | **1 Ex1**, 1 Ex5 | Covered |
| E2 | BPE training, encode/decode, byte fallback, vocab trade | **2 Q1, Q4, Q8**, 2 Q5, Q6, Q10, 35 Q1, Q11 | **2 Ex1**, 2 Ex5, 35 Ex1 | Covered |
| E3 | Tokenizer failures: numbers, whitespace, languages, trailing space | **3 Q1, Q2, Q9**, 3 Q4, 2 Q9 | **3 Ex1**, 3 Ex2, Ex4 | Covered |
| E4 | Embeddings, residual stream, weight tying | **4 Q1, Q7**, 4 Q5, Q10, 11 Q1, 37 Q2 | **4 Ex2**, 4 Ex3 | Covered |
| E5 | Learned, sinusoidal, RoPE, ALiBi; extrapolation | **7 Q3, Q4, Q10**, 7 Q1, Q2, Q5, Q7 | **7 Ex1, Ex2**, 7 Ex5 | Covered |
| E6 | Scaled dot-product attention, √d_k, causal mask | **5 Q3, Q4, Q2**, 5 Q1, Q7, 36 Q1, Q3 | **5 Ex1, Ex2**, 5 Ex5 | Covered |
| E7 | Multi-head as reshape; heads; MQA/GQA and KV bytes | **6 Q1, Q3**, 6 Q2, Q6, 26 Q5, 36 Q2 | **6 Ex1, Ex2**, 6 Ex5 | Covered |
| E8 | Block: residuals, pre-LN, RMSNorm, FFN width, SwiGLU; count params | **8 Q1, Q3, Q9**, 8 Q5–Q7, 9 Q9 | **8 Ex2, 9 Ex1**, 8 Ex5 | Covered |
| E9 | MoE: routing, top-k, balancing loss, capacity, active vs total | **10 Q1–Q4**, 10 Q5–Q10 | **10 Ex1**, 10 Ex5 | Covered |
| E10 | Teacher forcing, CE, perplexity; corpus, dedup, decontamination | **13 Q2, Q4, 12 Q1, Q3**, 13 Q1, Q5, Q6 | **13 Ex1, 12 Ex1**, 12 Ex2, Ex5 | Covered |
| E11 | AdamW, warmup, cosine/WSD, clipping, precision, accumulation, checkpointing | **14 Q2, Q3, Q9, Q11 (new)**, 14 Q1, Q4–Q6 | **14 Ex1, Ex2**, 14 Ex5 | Covered — see §4.1 |
| E12 | Kaplan → Chinchilla, 6ND, serving pushes past optimal | **15 Q1, Q2**, 15 Q3, Q6, 9 Q3, Q5 | **15 Ex1, Ex2** | Covered |
| E13 | DP, TP, PP, ZeRO; which one a bottleneck calls for | **17 Q1–Q3, Q10**, 17 Q4–Q12 | **17 Ex1**, 17 Ex2–Ex6 | Covered |
| E14 | Greedy, beam, temperature, top-k/p, min-p, penalties | **18 Q2–Q4, Q7**, 18 Q1, Q6, Q8, Q12 | **18 Ex2, Ex3**, 18 Ex1, Ex6 | Covered |
| E15 | CPT, SFT, LoRA/QLoRA details, forgetting | **21 Q2, Q6, Q7, 20 Q12**, 20 Q7, Q8, 21 Q3, 40 Q3 | **21 Ex2, Ex3**, 20 Ex5, 21 Ex1 | Covered |
| E16 | Chat templates and special tokens as contract | **3 Q3, Q6**, 3 Q5, 20 Q4, 25 Q4 | **3 Ex3** | Covered |
| E17 | Reward model, RLHF/PPO, DPO derivation, GRPO, reward hacking | **23 Q2, 22 Q5, 23 Q5**, 22 Q3, Q4, Q7, 23 Q1, Q3, Q6 | **23 Ex1**, 22 Ex2, Ex6, 23 Ex6 | Covered |
| E18 | Distillation, logit and sequence-level | **21 Q12** | none | **Thin — see §4.5** |
| E19 | Prefill vs decode, arithmetic intensity | **26 Q1–Q3**, 16 Q1–Q3, 26 Q4 | **26 Ex1, 16 Ex1**, 26 Ex2, Ex4 | Covered |
| E20 | KV cache bytes, binding constraint, PagedAttention | **6 Q3, 27 Q4**, 6 Q5, 26 Q7, 27 Q3, Q5 | **6 Ex1, 27 Ex2**, 26 Ex3, 27 Ex6 | Covered |
| E21 | FlashAttention as I/O-aware tiling; speculative decoding, Medusa | **28 Q1–Q3, Q5, Q6**, 28 Q7, Q8, Q11 | **28 Ex1–Ex3**, 28 Ex6 | Covered |
| E22 | int8, 4-bit, NF4, GPTQ, AWQ, GGUF k-quants | **29 Q2, Q3, Q5, Q6**, 29 Q7, 21 Q6 | **29 Ex1, Ex2** | Covered |
| E23 | Benchmarks, contamination, judge biases and calibration | **32 Q3, Q6, Q7**, 32 Q1, Q5, Q8, Q9 | **32 Ex5**, 32 Ex3, Ex4 | Covered |
| E24 | Reasoning models, PRM vs ORM, cost of thinking | **24 Q1, Q6, Q7**, 24 Q2–Q5, Q8–Q12 | **24 Ex1, Ex2**, 24 Ex3–Ex6 | Covered |
| E25 | CLIP, ViT patches, projector vs Q-Former | **31 Q3, Q5, Q6**, 31 Q2, Q4, Q7 | **31 Ex1, Ex3**, 31 Ex2 | Covered |
| E26 | Jailbreaks, indirect injection, guardrails, watermarking, extraction | **33 Q2, Q3, Q8, Q9**, 33 Q1, Q4–Q6 | **33 Ex1**, 33 Ex2, Ex6 | Covered |
| E27 | Constrained decoding and its cost | **19 Q2, Q3**, 19 Q1, Q4 | **19 Ex1, Ex2**, 19 Ex4 | Covered |

### Analyze

| # | Outcome | Quiz | Exercises | Verdict |
|---|---|---|---|---|
| A1 | Config → params, KV bytes, peak memory, fits the GPU | **9 Q7, Q10**, 9 Q1, 6 Q3 | **9 Ex1, Ex2**, 6 Ex1, 25 Ex1, 30 Ex1 | Covered |
| A2 | Chinchilla sizing and justified deviation | **15 Q2**, 15 Q1, Q6 | **15 Ex2**, 15 Ex1 | Covered |
| A3 | Prompting vs RAG vs SFT vs preference vs CPT | **20 Q1, Q2, Q9**, 1 Q7 | **20 Ex1** | Covered |
| A4 | Rank, alpha, targets, quantization for a memory budget | **21 Q4**, 21 Q1, 40 Q3 | **21 Ex2**, 21 Ex4, 40 Ex1 | Covered |
| A5 | Engine, batching, quantization, hardware for targets | **26 Q3, 27 Q8, 29 Q1**, 26 Q12, 28 Q9, 30 Q4, Q11 | **29 Ex3**, 27 Ex3, 30 Ex1 | Covered |
| A6 | Attribute a bad generation to its layer | **3 Q8**, 3 Q10, 11 Q8, 18 Q9, 25 Q4 | 3 Ex3, 34 Ex3 | Covered, dispersed |
| A7 | Is a benchmark difference real? | **32 Q11, 38 Q9**, 32 Q3, Q4, Q10, 22 Q7, 23 Q11 | **32 Ex2**, 32 Ex1, 38 Ex3, Ex5 | Covered |
| A8 | Long-context model vs RoPE scaling vs retrieval, with cost | **7 Q11 (new)**, 7 Q4, Q9, 25 Q12 | 7 Ex2, Ex3, 25 Ex2 | Covered — see §4.2 |
| A9 | MHA/MQA/GQA/sliding window/MoE against a serving constraint | **6 Q10, 10 Q9**, 6 Q3, 25 Q8, Q9 | **6 Ex3**, 10 Ex4, 25 Ex3 | Covered |
| A10 | Read a model card or config.json | **25 Q1, Q12**, 25 Q2, 1 Q4 | **25 Ex1**, 1 Ex3, 9 Ex3, 25 Ex6, 31 Ex4 | Covered |

### Operate

| # | Outcome | Quiz | Exercises | Verdict |
|---|---|---|---|---|
| O1 | Train a small GPT; diagnose divergence, high LR, overfitting | **13 Q9, 14 Q10**, 8 Q9, 37 Q1, Q5, Q10 | **13 Ex5, 14 Ex5**, 13 Ex3, 37 Ex2 | Covered |
| O2 | Build an instruction dataset through the template | **20 Q3, Q6, Q11**, 20 Q4 | **20 Ex6**, 20 Ex4, 3 Ex3 | Covered |
| O3 | LoRA/QLoRA fine-tune; before/after and regression elsewhere | **20 Q8, 21 Q9**, 40 Q10 | **20 Ex5, 40 Ex4**, 21 Ex4, Ex5 | Covered |
| O4 | Run DPO; detect reward hacking and degradation | **23 Q3, 40 Q8**, 23 Q11, 40 Q9, Q12 | **23 Ex4**, 40 Ex5 | Covered |
| O5 | vLLM + one alternative; TTFT/TPOT/tok/s curve with KV limit visible | **27 Q8, Q12**, 26 Q9, Q11, 41 Q7 | **27 Ex4 (extended)**, 26 Ex4 | Covered — see §4.3 |
| O6 | 4-bit: quality, memory and latency deltas | **29 Q8, Q10**, 29 Q11, 41 Q3 | **29 Ex4**, 29 Ex3, Ex5, 30 Ex4 | Covered |
| O7 | lm-evaluation-harness + judge, intervals, contamination test | **32 Q6, Q10, Q11**, 32 Q7 | **32 Ex4 (extended), Ex5, Ex6** | Covered — see §4.4 |
| O8 | Token and cost accounting, percentiles, refusals, drift | **34 Q2, Q4, Q9**, 34 Q1, Q7 | **34 Ex4**, 34 Ex1, Ex5 | Covered |
| O9 | Red-team, add guardrails, re-measure | **33 Q5, Q6, Q12** | **33 Ex5**, 33 Ex3, Ex6 | Covered |
| O10 | Hub → running monitored local endpoint, decisions documented | **25 Q10, 30 Q5** | 25 Ex6, 30 Ex4, 34 Ex4, Ex6 | Covered, dispersed — see §4.6 |

### Build (capstone)

| # | Outcome | Quiz | Exercises | Verdict |
|---|---|---|---|---|
| B1 | BPE tokenizer validated against a reference | **35 Q3, Q8**, 35 Q1–Q7, Q9–Q11 | **35 Ex1, Ex5**, 35 Ex2–Ex4, Ex6, 2 Ex5 | Covered |
| B2 | Attention, MHA with KV cache, block, verified numerically | **36 Q4, Q7, Q12**, 36 Q1–Q3, Q5, Q8 | **36 Ex3, Ex4**, 36 Ex1, Ex2, Ex5, Ex6 | Covered |
| B3 | Pretrain, reproduce target loss, sample | **37 Q1, Q8, Q12**, 37 Q3–Q5, Q7, Q9 | **37 Ex2, Ex5**, 37 Ex1, Ex3, Ex4, Ex6 | Covered |
| B4 | RoPE, RMSNorm, SwiGLU, GQA, each ablated | **38 Q6, Q8, Q9**, 38 Q3–Q5 | **38 Ex4**, 38 Ex1, Ex2 | Covered |
| B5 | Load open weights and match reference logits | **39 Q3, Q5, Q7**, 39 Q1, Q2, Q4, Q8, Q9 | **39 Ex1, Ex2**, 39 Ex3–Ex6 | Covered |
| B6 | LoRA the layer, and instruction-tune with it | **40 Q1, Q2, Q4**, 40 Q3, Q5 | **21 Ex6**, 40 Ex1, Ex2, Ex6 | Covered |
| B7 | DPO from the loss, evaluated against SFT | **40 Q6, Q8**, 40 Q7, Q9, Q12 | **23 Ex6**, 40 Ex3, Ex5 | Covered |
| B8 | C engine; honest benchmark against llama.cpp and vLLM | **41 Q1, Q3, Q8**, 41 Q2, Q5–Q7, Q10–Q12 | **41 Ex5**, 41 Ex1–Ex4, Ex6 | Covered — vLLM row blank by design, see §4.7 |
| B9 | Harness: perplexity, benchmark subset, judge, intervals | **38 Q1, Q2, Q10**, 32 Q10 | **38 Ex3**, 38 Ex6, 32 Ex6 | Covered, judge half outside the capstone — see §4.7 |

**Unmapped outcomes: none.** 40 of 41 are tested by at least one quiz question *and* at least
one exercise. E18 has a quiz question and no exercise; §4.5 puts the fix to the owner.

---

## 3. The finding that matters: 95% of multiple-choice keys are the longest option

The same defect Phase 6 found in *RAG In Depth*, measured the same way over this course's
362 `mc` questions as they stood before this pass:

| Measure | Value |
|---|---|
| Questions where the correct option is the longest | **346 of 362 (95.6%)** |
| Mean length, correct option | 121 characters |
| Mean length, distractors | 53 characters |
| Chapters where the key is the longest in *every* mc question | 30 of 41 (29 after §4.2) |
| Only chapter under 50% | Chapter 1 (43%) |

A learner who has read nothing scores about 95% on the multiple-choice questions by picking
the longest option. Chapter 7 Q10 shows the pattern, lengths 29 / 39 / **123** / 26:

> - The ability to use a KV cache
> - Compatibility with multi-head attention
> - **The model's freedom to decide that a distant token matters more than a nearby one,
>   since the penalty is fixed and monotonic** ← key
> - Support for causal masking

The question is good; the formatting gives the answer away.

The fix is the one recommended for RAG: **lengthen the distractors, do not shorten the keys.**
Each distractor becomes a wrong claim with the reason someone holding that misconception
would give. The two questions added in §4 are written that way; neither key is the longest
option (Chapter 7 Q11: key 172 against distractors of 177, 170, 172; Chapter 14 Q11: key 124
against 156, 139, 142).

**Cost.** About 1,040 distractor rewrites across 41 chapters, in one file. Target under 35%
longest-is-correct, no chapter at 100%.

**Not applied.** It rewrites shipped assessment content in every chapter and belongs behind
its own gate. The RAG pass recommended on 2026-09-05 has not been applied either (RAG still
measures 294 of 302), so the owner decides both together. Running them as one batched pass
across both courses is the cheapest way to do it.

---

## 4. Thin spots, and what was done

### 4.1 E11 — activation checkpointing (fixed)

Chapter 14 teaches activation checkpointing in "Bigger Batches Than Fit" (Chen et al. 2016,
roughly 30% more step time). No question or exercise touched it. WSD, by contrast, was
already carried by Q9's `why`.

Applied: **new Chapter 14 Q11.** A run out of memory on activations turns checkpointing on;
what did it buy and cost? The key is activation memory for roughly 30% more step time. The
distractors are the belief that less memory traffic makes the step faster, the confusion
with optimizer offload, and the confusion with checkpoint *files*, which the name invites.
Chapter 14 now has 11 questions.

### 4.2 A8 — the retrieval branch of the long-context decision (fixed)

A8 asks for a choice between a longer-context model, RoPE scaling, retrieval and
fine-tuning, *with the cost arithmetic*. Chapter 7 covered the mechanism side well (Q4, Q9,
Ex2, Ex3). Nothing made the learner price a long prompt or weigh retrieval against it.

Applied: **new Chapter 7 Q11.** Corvid was trained at 8,192 tokens and a team wants to
RoPE-scale it to fit a 250,000-token manual. The key prices it at Corvid's 131,072 bytes per
token: 32.8 GB of cache per request before a quadratic prefill, against 0.52 GB for 4,000
retrieved tokens. The distractors are the three misconceptions this chapter and Chapter 5
correct: that RoPE has no angle past the trained length, that interpolation costs nothing,
and that prefill cost is linear. All arithmetic uses figures already taught (Chapter 6's
cache, Chapter 9's 16.06 GB). Chapter 7 now has 11 questions.

### 4.3 O5 — the latency–throughput curve on real engines (fixed)

O5 asks for vLLM plus one alternative and a TTFT / TPOT / tokens-per-second curve against
batch size with the KV cache limit visible. The quiz side was strong: 27 Q8 is exactly the
goodput knee. No exercise asked the learner to produce the curve. 26 Ex4 sweeps prompt
length, not concurrency, and 27 Ex4 only counted preemptions.

Applied: **Chapter 27 Ex4 extended.** After the preemption experiment, sweep concurrency
1 → 256 on vLLM (where the hardware runs it) and one alternative, plot all three metrics,
and find the knee. Self-check: the knee should sit near the capacity Exercise 2's method
predicts. Exercise count unchanged at 6.

### 4.4 O7 — naming the harness, and a contamination test (fixed)

32 Ex4 ran a benchmark under two harnesses without naming `lm-evaluation-harness`, and no
exercise asked the learner to *test* a score for contamination. The quiz covered why n-gram
decontamination is weak (32 Q6), but not doing it.

Applied: **Chapter 32 Ex4 extended.** One harness must be `lm-evaluation-harness`. Then a
matched-rewrite test in miniature, from section 6's third tier: rewrite 50 items so none
shares a 13-gram with its original, score both with a paired interval. The self-check
carries section 6's caveat that a drop is evidence, not proof. Exercise count unchanged
at 6.

### 4.5 E18 — distillation has one question and no exercise (noted, owner decision)

Chapter 21's final section teaches logit-level distillation with temperature and the T²
rebalance, sequence-level distillation (Kim and Rush 2016), and forward vs reverse KL
(Gu et al. 2023). Only Q12 tests any of it, and only the sequence-level half. Chapter 21 is
at both ceilings (12 questions, 6 exercises), so closing this means replacing something.

Recommended if approved: replace **Q11** (DARE, which supports the low-rank hypothesis
Q2 already tests) with this, key at index 3:

> *A team distils a 70B teacher into a 3B student by storing the teacher's full output
> distribution at every position, at temperature 3. Why the temperature, and why multiply
> the soft loss by T²?*
> - At temperature 1 the student would copy the teacher's peak too closely, so raising T
>   adds noise that regularizes it, and T² keeps that noise from growing with the vocabulary
> - Temperature compresses the stored logits so 128,256 numbers per token fit on disk, and
>   T² undoes the compression before the loss is computed
> - Raising T sharpens the teacher so the student sees a clearer target, and T² makes up
>   for the fewer tokens that keep meaningful probability after sharpening
> - **At T = 1 the wrong answers' relative sizes are too small to learn from; softening
>   exposes them, and the soft gradients shrink as 1/T², so T² restores their weight** ← key
>
> *why:* The information a hard label discards is in the tail: that 'dog' is far more
> plausible than 'car'. At T = 1 those probabilities are too small to shape a gradient;
> dividing the logits by T flattens teacher and student alike, so the loss compares shapes
> rather than peaks. Flattening also scales the soft-target gradients down by 1/T², and
> multiplying by T² keeps the soft term from vanishing beside the hard one.
> Sequence-level distillation skips all of this by training on the teacher's generated
> text, which is why the field mostly uses it.

(Key 162 characters against distractors of 173, 140 and 155, so the key is not the longest.)

### 4.6 O10 — the end-to-end deployment is assembled, not assigned (noted, no change)

O10 has no single exercise that goes from a Hub download to a monitored local endpoint.
The pieces are all assigned, in order: the gate procedure from a config (25 Ex6), a local
engine with its bandwidth ceiling checked (30 Ex4), a canary set and noise floor (34 Ex4),
and a release identifier with a rollback (34 Ex6). A learner who does those four has done
O10. Recorded rather than changed, because a fifth exercise that repeats all four would add
bulk without adding a new task.

### 4.7 B8 and B9 — two capstone gaps the chapters already disclose (noted, no change)

- **B8's vLLM row is blank.** Chapter 41 says so and why (manylinux wheels only; a batch-1
  measurement of a concurrency engine would mislead), and Q7 tests the reasoning. The
  learner-facing measurement now exists as the extended 27 Ex4. Same shape as RAG's B6.
- **B9's judge is not in the PocketLM harness.** Chapter 38's harness gives per-sequence
  perplexity with paired intervals, and Chapter 40 adds exact-answer and format scores (a
  benchmark subset in miniature). The LLM judge is built and bias-tested in 32 Ex5 and
  32 Ex6, outside the capstone. Two options: leave it, or add "wire the judge from 32 Ex5
  into the harness and score SFT against DPO" to Chapter 40. That chapter is at 6 exercises,
  so it would replace one. Left for the owner.

### 4.8 Chapter 7 Q6 — answer readable off the stem (fixed)

"…sags in the **middle** is called lost in the ____", accepting `middle`. Changed to "sags
between them". This was the only one of the 57 `blank` questions whose answer appears in
its own stem, checked mechanically.

---

## 5. §11.3 definition of done

- [x] **Outcome → assessment map has no unmapped outcome.** 41 of 41 mapped; 40 to both a
      question and an exercise, E18 to a question only (§4.5).
- [ ] **No question is answerable by keyword matching the chapter text.** The one stem leak
      is fixed, but 95.6% of `mc` keys are the longest option, which is worse: the questions
      can be answered without the chapter. Open pending §6.
- [x] **Every `why` teaches.** All 462 carry one and none is under 40 characters. A full read
      found none that just repeats the key, and most add a number the question left out.

Structural conformance to §8.1–§8.3, checked mechanically over all 41 chapters:

| Rule | Result |
|---|---|
| 8–12 quiz questions per chapter | Pass (10–12 in all 41) |
| At least one `order` per chapter | Pass (41 across 41) |
| At least one `blank` per chapter | Pass (57 across 41; 2 per chapter in 1–16, 1 in 17–41) |
| Correct answer position distributed | Pass: 86 / 88 / 102 / 88 across indices 0–3 after §4 |
| Every `mc` has four options and a valid index | Pass (364 of 364) |
| `why` present on every question | Pass (462 of 462) |
| 10–20 key terms per chapter | 40 of 41 pass; Chapter 21 has 21 |
| Every term appears in its chapter's body | Pass (655 of 655, by string match on the head term) |
| 3–6 exercises, grades labelled | Pass (5 or 6 in every chapter, every one labelled) |
| Every exercise self-checkable | Pass. Each states a result ("you should see…", a number to reproduce, or a named failure to observe) |

Chapter 21's 21st term is not worth an edit; recorded so Phase 7 does not flag it again.

---

## 6. Gate

Phase 6's deliverable is this map. Three decisions belong to the owner:

1. **The option-length pass (§3)**, for both courses together. About 1,040 rewrites here and
   about 885 in RAG. It is the biggest quality problem left in either course, and the only
   one that makes every quiz gameable. Recommended.
2. **E18 (§4.5).** Swap Chapter 21 Q11 for the drafted distillation question. Recommended.
3. **B9 (§4.7).** Leave the judge outside the capstone, or trade a Chapter 40 exercise for it.

Applied in this pass, all inside §8's limits: Chapter 7 Q11 and Chapter 14 Q11 (new),
Chapter 27 Ex4 and Chapter 32 Ex4 (extended), Chapter 7 Q6 (stem leak).

Next: **Phase 7, whole-course QA** (`07-qa-report.md`).
