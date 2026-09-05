# LLM In Depth — Phase 3 Deliverable: Course Blueprint

**Status:** Phase 3 complete, awaiting owner approval. On approval, chapter numbers are frozen (the platform keys progress and links on them).
**Date:** 2026-09-05. Gap Matrix (Phase 2) approved 2026-09-05.

**Shape:** 6 parts · **41 chapters** (34 teaching + 7 capstone) · 46 machines · ~110 static figures · capstone *PocketLM* in Python with the inference engine in C · 3 free chapters (1, 2, 5). Estimated body total ≈ 118,000 words.

**On the chapter count.** Guide §2 targets 24–36 and *RAG In Depth* shipped 36. Phase 2 measured 108 Core rows and projected 28–34 teaching chapters plus a 5–6 chapter capstone; this lands at 34 teaching and 7 capstone. The seventh capstone chapter (§9 permits 5–8) exists because the evaluation harness cannot share a chapter with the C engine without one of them becoming a summary. Declared here rather than quietly exceeded, same as the 41 outcomes.

---

## Course-wide conventions

- **The reference model: `Corvid-7B`.** Every piece of arithmetic in the course — parameters, FLOPs, activation memory, KV-cache bytes, quantized footprint, tokens per second — is done on one fictional but entirely realistic open-weights model: 32 layers, `d_model` 4096, 32 query heads and 8 KV heads (GQA), `d_ff` 14336 with SwiGLU, vocab 128,256, RoPE, 8,192 context, bf16. `Corvid-70B` (80 layers, `d_model` 8192) appears wherever scale changes the answer. Real models are named whenever their behaviour differs from Corvid's.
- **The 16 GB budget.** One 16 GB GPU and a 16 GB laptop. Every "does it fit?" in the course is answered against that machine, so the answer is checkable by the reader on the hardware the Charter promised.
- **The recurring corpus: *The Almanac*.** ~50 MB assembled from public-domain sources: English prose, a Python and C source tree, a Hindi and a Tamil subset, a table-heavy statistical appendix, and 2,000 instruction pairs derived from the same text. One corpus serves tokenizer training, pretraining, fine-tuning, preference data and evaluation, so every measurement in the course is comparable with every other.
- **The five recurring prompts.** **P1** `3478 × 29 = ?` (tokenization and numeracy) · **P2** "Rewrite this refund notice in plain English" (style, SFT) · **P3** "Extract the parties, dates and amounts as JSON" (structured output) · **P4** a needle placed at 5%, 50% and 95% of a 100K-token document (long context) · **P5** a layered jailbreak attempt (safety). Each is traced through every stage of the course, so the reader watches one prompt's fate change as the machine changes.
- **Machine keys** are prefixed `llm` — `window.VIZ` is shared with *Databases in Depth* and *RAG In Depth*.
- **Chapter word counts** are body only, excluding terms, quiz and exercises.
- **Every arithmetic claim is reproducible.** Where a number appears in prose, the chapter shows the calculation or the command that produced it.

---

## 1. Parts

| # | Title | Description (house voice, as in `PARTS`) |
|---|---|---|
| I | **What a Language Model Is** | Before the architecture, the object: a function that returns a probability for every possible next token. This part takes text apart into the pieces the machine actually sees, shows why the tokenizer causes bugs no one blames it for, and turns those pieces into the geometry every later chapter operates on. |
| II | **Inside the Block** | One transformer block, opened completely: the weighted sum that is attention, the heads that split it, the rotation that tells it about order, the residual stream everything writes into, and the arithmetic that tells you what a model will cost before you download it. By the end you can read any model card and say what the architecture is. |
| III | **Making a Model** | Where weights come from. A corpus is filtered, deduplicated and decontaminated; a loss is minimized with an optimizer whose every knob exists to fix a specific failure; a scaling law decides how big and how long; and a GPU decides how fast. This part is why the models you use look the way they do. |
| IV | **Making It Useful** | A pretrained model is a text continuer, not an assistant. This part is the distance between them: choosing the next token, forcing the output into a schema, calling tools, fine-tuning on a job, adapting on one GPU, learning from preferences, and buying accuracy with thinking time. |
| V | **Making It Fast, Correct and Safe** | The engineering half. Why the first token is slow and the rest are fast, why decode is limited by memory bandwidth and not arithmetic, what a batch really costs, what quantization takes away, how to tell whether a model actually got better, what an attacker does to it, and what to watch at 3am. |
| VI | **Build It: PocketLM** | Seven chapters, one working language model: a BPE tokenizer, attention and a block from scratch, a pretraining run on *The Almanac*, modern components ablated one at a time, real open weights loaded into your own code and matched logit for logit, LoRA and DPO written from the loss up, an inference engine in C, and an honest benchmark against `llama.cpp` and vLLM. |

---

## 2. Chapters

Format per chapter: title · archetype · blurb · sections · machines (spec per §7.5) · figures · outcomes · Topic Universe rows (Phase 2 §3 section letters) · prerequisites · words.

---

### Part I — What a Language Model Is

#### Chapter 1 — The Machine That Guesses the Next Token *(Orientation, FREE)*

**Blurb.** Everything in this course is machinery around one function: given some text, return a probability for every token that could come next. Chat, code, translation and refusal are all that function called in a loop. You will watch a real model produce a distribution over its whole vocabulary, see the top ten candidates and their probabilities change as you edit the prompt, and learn the three questions that explain most of the subject. You will also meet Corvid-7B, the reference model whose arithmetic runs through every chapter, and find out how this course works: machines beside the text, a quiz per chapter, and a capstone where you build the whole thing.

**Sections.**
1. One function, called in a loop: the next-token distribution, and a document's probability as the chain rule over it.
2. What "training" produced: pretraining, post-training and serving as three different machines, drawn as the map of this course.
3. Three questions that explain the subject: what is a token; what does a block do to a vector; and what does one more token cost.
4. What this course does not cover, and where it goes instead — retrieval and vector search belong to *RAG In Depth*, and the boundary is drawn explicitly.
5. The reference model, the corpus and the five prompts you will follow to the end.
6. How to use this course: machines, quizzes, exercises, PocketLM, and what to install (Python 3.12, PyTorch 2.x, a C toolchain, Ollama or an API key; the 16 GB budget).
7. Exercises.

**Machines.**
- `llmNextToken` · Playground · State: a prompt, the model's top-k distribution · Controls: edit the prompt; toggle the full-vocabulary view · Output: top 10 tokens with probabilities as bars, entropy of the distribution · Discovery: type "The capital of France is" and see one token at 0.94; delete "of France" and watch the distribution flatten — the model's confidence is a property of the context, not of its knowledge · Initial note: "Edit the prompt. Watch which tokens the model thinks could come next, and how sure it is." · Layout: prompt box on top, ranked bar list below, entropy readout at the right.
- `llmCourseMap` · Inspector · State: the six parts and the pipeline stage each owns · Controls: hover or click a stage · Discovery: the same block diagram appears in training and in serving with different costs attached — the reader sees that Part III and Part V are the same machine run in two directions · Initial note: "Hover a stage to see which chapters open it."

**Figures.** F1.1 the next-token function; F1.2 the three-machine map (pretrain → post-train → serve); F1.3 the token loop; F1.4 the LLM/RAG boundary; F1.5 Corvid-7B's spec card.

**Outcomes.** E1 (full), A10 (intro). **Rows.** §3.A rows 1, 3, 7. **Prereqs.** none. **Words.** 2,800.

---

#### Chapter 2 — Tokens: How Text Becomes Numbers *(Mechanism, keystone, FREE)*

**Blurb.** A model never sees text. It sees integers, and the map from one to the other was itself learned — from a corpus, by an algorithm you can run by hand. You will build a byte-pair merge table on a few sentences with a pencil, then watch the same algorithm run on *The Almanac* and produce a vocabulary that looks eerily like English morphology. You will see why the vocabulary size is a trade rather than a preference, why modern tokenizers work on bytes instead of characters, and why the tokenizer is the one component you cannot change after training without throwing the model away.

**Sections.**
1. Why not characters, why not words: sequence length against vocabulary size, with the arithmetic.
2. BPE, trained: counting adjacent pairs, merging the most frequent, and repeating — worked by hand on six sentences.
3. BPE, applied: encoding with a merge table, and why encoding is not just a dictionary lookup.
4. Bytes underneath: byte-level BPE, byte fallback, and why an emoji costs four tokens.
5. The other two: WordPiece's likelihood criterion and Unigram/SentencePiece's pruning, and what each does differently.
6. The vocabulary size decision: embedding parameters, softmax cost, sequence length, multilingual fairness — Corvid's 128,256 explained.
7. What real tokenizers look like: GPT-2, Llama 3, Qwen, and reading a `tokenizer.json`.
8. Exercises.

**Machines.**
- `llmBpeTrainer` · Builder · State: a training corpus, the merge table so far, the current vocabulary · Controls: step one merge; run 50; reset; edit the corpus · Output: the merge chosen, its count, and the vocabulary growing · Discovery: run 200 merges on English and find that " the", "ing" and "tion" appear without anyone teaching the algorithm morphology · Initial note: "Press *merge* and watch the most common pair become one token. Do it 30 times."
- `llmTokenizerCompare` · Comparator · State: an input string, three tokenizers · Controls: type text; switch tokenizer; toggle byte view · Output: coloured token boundaries and a token count per tokenizer · Discovery: paste the same paragraph in English and in Hindi and watch the token count triple on the same meaning · Initial note: "Type a sentence. Then type it in another language."
- `llmVocabTradeoff` · Tuner · State: vocabulary size, corpus, model dims · Controls: vocab-size slider · Output: embedding-table parameters, average tokens per word, softmax FLOPs per step · Discovery: find the vocab size where the embedding table costs more than four transformer blocks.

**Figures.** F2.1 text → tokens → ids → vectors; F2.2 a merge table being built; F2.3 byte-level fallback on an emoji; F2.4 BPE vs WordPiece vs Unigram; F2.5 token count by language on the same paragraph.

**Outcomes.** E2, E3 (partial), B1 (foundation). **Rows.** §3.B rows 1–5, 8, 9. **Prereqs.** 1. **Words.** 4,200.

---

#### Chapter 3 — Where Tokenizers Betray You *(Mechanism + practitioner)*

**Blurb.** A model that can write a sonnet fails at 3478 × 29, insists your Python is misindented, and answers a different question when your prompt ends in a space. None of these are reasoning failures. They are tokenization artifacts, and once you can see the token boundaries you can predict them before they happen. You will reproduce each failure on a real tokenizer, then learn the part of the contract that breaks silently in production: special tokens and the chat template, which is where more fine-tunes are ruined than by any hyperparameter.

**Sections.**
1. Numbers: why digits split unevenly, and what that does to arithmetic (P1 traced end to end).
2. Whitespace and code: leading spaces as part of the token, indentation, and the tab that costs eight tokens.
3. The trailing-space bug: why a prompt ending in " " gets a worse answer, with the distribution shown.
4. Non-English text: token inflation, its cost consequence and its fairness consequence.
5. Special tokens: BOS, EOS, padding, and the ones that are not in the tokenizer's vocabulary until someone adds them.
6. **The chat template**: roles as text, why the template is part of the model's contract, and what a mismatched template does to output quality — measured, not asserted.
7. The practitioner's checklist: verifying a template, counting tokens before paying for them, and the three things to check when a fine-tune "does nothing".
8. Exercises.

**Machines.**
- `llmTokenBoundaries` · Playground · State: input text, tokenizer, highlight mode · Controls: type; toggle "show whitespace"; switch tokenizer · Output: tokens with ids, and a red flag on the classic traps · Discovery: type `1234567` then `1,234,567` and watch the token split change completely, then predict which one the model does arithmetic on better · Initial note: "Type a big number. Then type it with commas."
- `llmChatTemplate` · Stepper · State: a conversation, a template, the rendered string · Controls: pick a model's template; add turns; introduce a deliberate mismatch · Output: the exact string the model receives, with special tokens visible · Discovery: apply Llama's template to a Qwen-style conversation and watch the assistant turn start inside the user's message · Initial note: "Watch a conversation become one flat string. Then break the template on purpose."

**Figures.** F3.1 digit splits across three tokenizers; F3.2 code indentation tokenized; F3.3 the trailing-space distribution shift; F3.4 token inflation by language; F3.5 a chat template rendered with special tokens marked.

**Outcomes.** E3, E16, A6 (partial), O2 (partial). **Rows.** §3.B rows 6–8; §3.J chat templates. **Prereqs.** 2. **Words.** 3,000.

---

#### Chapter 4 — Embeddings: Meaning as Geometry *(Mechanism, keystone)*

**Blurb.** A token id is looked up in a table and becomes a vector, and from that moment on the model is doing geometry. You will see what the embedding table is, why the same word gets a different vector in a different sentence, and what "similar" means once similarity is a number. Then you will meet the other use of the same idea — the embedding *model*, trained with contrastive loss so that a question and its answer land near each other — which is the exact object *RAG In Depth* builds on, and the one place these two courses touch.

**Sections.**
1. The embedding table: `vocab × d_model`, and what a row is.
2. The residual stream, introduced: a vector per position that every block reads and writes.
3. Static vs contextual: why "bank" has one row in the table but many positions in the stream.
4. Similarity as arithmetic: dot product, cosine, Euclidean, and when they disagree.
5. Training an embedding model: bi-encoders (BERT-shaped, and where masked language models still live), contrastive loss, and where the negatives come from.
6. Pooling, normalization, and Matryoshka truncation.
7. Choosing one: what MTEB measures and what it hides — and the handoff to *RAG In Depth*.
8. Weight tying: why the output projection is often the embedding table transposed.
9. Exercises.

**Machines.**
- `llmEmbeddingSpace` · Playground · State: a set of words/sentences projected to 2-D · Controls: add text; switch similarity metric; toggle normalization · Output: the projection plus a live similarity matrix · Discovery: find two sentences whose cosine similarity is high and whose dot product ranking flips when normalization is turned off · Initial note: "Add two sentences that mean the same thing. Then add one that only shares words."
- `llmContrastive` · Stepper · State: a batch of anchor/positive/negative triples, the loss · Controls: step training; drag a negative closer; switch to in-batch negatives · Output: the embedding cloud moving, the InfoNCE loss falling · Discovery: make a "hard negative" and watch it do more work than ten random ones · Initial note: "Step the training. Watch positives pull together and negatives push apart."

**Figures.** F4.1 lookup table → vector; F4.2 the residual stream as a highway; F4.3 cosine vs dot on unnormalized vectors; F4.4 contrastive pull/push; F4.5 weight tying.

**Outcomes.** E4, E2 (embedding half). **Rows.** §3.C all rows; §3.A row 4. **Prereqs.** 2. **Words.** 3,400.

---

### Part II — Inside the Block

#### Chapter 5 — Attention: The Weighted Sum That Changed Everything *(Mechanism, keystone, FREE)*

**Blurb.** Attention is a weighted average, and every mystery about it dissolves once you see which three projections produce the weights. You will build it from the bottom: a query asking a question, keys advertising what each position offers, values carrying what gets copied, a dot product scoring the match, a softmax turning scores into a distribution, and a mask that stops the model reading its own future. You will derive the √d_k divisor rather than accept it, watch the attention matrix light up on a real sentence, and see exactly why a sequence twice as long costs four times as much.

**Sections.**
1. The problem attention solves: n-grams, then RNNs and their fixed-size bottleneck, then "look back at everything" — and what that would cost.
2. Q, K, V as three projections of the same vector — and the library metaphor, used once and then dropped for the arithmetic.
3. Scores, softmax, and the weighted sum, computed by hand on a four-token sentence.
4. **Why √d_k**: the variance of a dot product of d-dimensional random vectors, derived, and what softmax does without it.
5. The causal mask: −∞ before softmax, and why masking makes every position's loss computable in one pass.
6. What it costs: n² scores, n² memory, and the curve that governs the rest of the course.
7. What real implementations do differently (a forward pointer to Chapter 28).
8. Exercises.

**Machines.**
- `llmAttention` · Inspector · State: a sentence, one attention head, the score matrix · Controls: click a query position; toggle mask; toggle the √d_k divisor; edit the sentence · Output: the n×n heatmap, the softmax row for the selected query, and the resulting weighted value · Discovery: turn off √d_k and watch the softmax row collapse to one-hot — the divisor is what keeps gradients alive · Initial note: "Click a word to see what it attends to. Then switch off the scaling and watch the distribution die." · Layout: sentence across the top, heatmap centre, selected-row bars at the right.
- `llmCausalMask` · Stepper · State: the mask matrix and the generation position · Controls: step generation; toggle mask off · Discovery: turn the mask off during generation and watch the model trivially "predict" the next token by reading it · Initial note: "Step a generation. Then remove the mask and see the model cheat."
- `llmAttentionCost` · Tuner · State: sequence length, `d_model`, batch · Controls: sliders · Output: score-matrix memory in MB and FLOPs, against the 16 GB budget · Discovery: find the sequence length where the attention matrix alone exceeds the GPU.

**Figures.** F5.1 Q/K/V projections; F5.2 the score matrix with the softmax row; F5.3 the causal mask; F5.4 variance with and without the divisor; F5.5 n² cost curve.

**Outcomes.** E6, E5 (cost half), B2 (foundation). **Rows.** §3.D rows 1–5; §3.A rows 2, 5. **Prereqs.** 4. **Words.** 4,600.

---

#### Chapter 6 — Many Heads, and Making Them Cheap *(Mechanism, keystone)*

**Blurb.** One head can only average one way at a time. Multi-head attention runs several in parallel — and it is a reshape, not a loop, which is why it costs nothing extra. You will see what different heads specialize in on real text, then follow the modern pressure that reshaped them: the KV cache. When keys and values must be stored for every position, every layer and every head, the head count becomes a memory bill, and grouped-query attention is the field's answer. This chapter is where architecture starts being decided by serving cost.

**Sections.**
1. Splitting `d_model` into heads: the reshape, and why total compute is unchanged.
2. What heads do: positional heads, delimiter heads, and induction heads seen on real text.
3. The output projection, and why concatenation alone would not work.
4. The KV cache, introduced early because it is the reason for everything that follows: what must be stored per token, per layer, per head.
5. **MQA and GQA**: one KV head, or a few, shared across query heads — with Corvid's 32:8 ratio costed in bytes.
6. Sliding-window and local attention; attention sinks and why the first token matters.
7. Choosing a configuration for a serving constraint (the decision procedure).
8. Exercises.

**Machines.**
- `llmMultiHead` · Inspector · State: 8 heads on one sentence · Controls: select head; overlay all; switch sentence · Discovery: find the head that attends to the previous token in every sentence, and the one that attends to the matching quotation mark · Initial note: "Click through the heads. Two of them are doing something obvious."
- `llmKvBudget` · Tuner · State: model config, context length, batch size, precision, KV head count · Controls: sliders and an MHA/GQA/MQA switch · Output: KV-cache bytes, and how many concurrent requests fit in 16 GB · Discovery: switch Corvid from 32 KV heads to 8 and watch concurrent capacity quadruple with no change to quality · Initial note: "Set MHA. Now switch to GQA. Watch how many users fit."

**Figures.** F6.1 the reshape into heads; F6.2 three heads' patterns on one sentence; F6.3 MHA vs GQA vs MQA key/value sharing; F6.4 KV bytes per token, per layer; F6.5 the sliding window.

**Outcomes.** E7, E20 (introduced), A9, A1 (partial). **Rows.** §3.D row 4; §3.E rows 1, 4, 5. **Prereqs.** 5. **Words.** 3,800.

---

#### Chapter 7 — Position: Order in a Permutation-Blind Machine *(Mechanism, keystone)*

**Blurb.** Shuffle the words of a sentence and attention returns the same answer — the mechanism has no idea what order anything came in. Every transformer therefore injects position by hand, and the method chosen decides what happens when the model meets a document longer than anything it was trained on. You will prove the permutation-blindness in the machine, then walk the four families in the order the field discovered them, ending at RoPE — a rotation applied to each pair of dimensions, which is far simpler than its reputation and explains why context extension works at all.

**Sections.**
1. The proof: permute the input, permute the output, nothing else changes.
2. Learned absolute positions: simple, and hard-capped at training length.
3. Sinusoidal encodings: the original trick and the extrapolation it promised but did not deliver.
4. **RoPE**: rotating each 2-D subspace by an angle proportional to position, so that attention sees relative distance — derived, then drawn.
5. ALiBi and the relative-bias family.
6. **Making context longer**: position interpolation, NTK-aware scaling, YaRN — and what actually degrades when you stretch.
7. Measuring long context honestly: needle-in-a-haystack (P4), RULER, and why "supports 1M tokens" is a marketing claim until tested.
8. Exercises.

**Machines.**
- `llmRope` · Inspector · State: a 2-D subspace, two positions, the rotation · Controls: drag position m and n; change the base frequency θ · Output: the rotated vectors and their dot product against distance · Discovery: change only the *distance* between two positions and watch the dot product stay the same wherever the pair sits in the sequence — that is the whole point of RoPE · Initial note: "Drag both positions while keeping the gap fixed. The score does not move."
- `llmContextStretch` · Tuner · State: trained context, target context, scaling method · Controls: method (none / PI / NTK / YaRN), target length · Output: an attention-quality proxy against position, with the cliff drawn · Discovery: find where naive extension falls off a cliff and where interpolation merely sags · Initial note: "Push the target context past the training length with no scaling. Then turn scaling on."
- `llmNeedle` · Playground · State: a long document, needle depth, model context · Controls: depth slider; document length · Output: retrieval success heatmap (the standard needle chart), P4 traced · Discovery: find the depth band where recall drops — the middle.

**Figures.** F7.1 permutation invariance; F7.2 sinusoidal encodings; F7.3 the RoPE rotation per subspace; F7.4 relative distance from absolute rotation; F7.5 the needle heatmap.

**Outcomes.** E5, A8. **Rows.** §3.D rows 6–9; §3.E row 6. **Prereqs.** 5. **Words.** 4,000.

---

#### Chapter 8 — The Block: Residual Stream, Norms, and the Feed-Forward *(Mechanism, keystone)*

**Blurb.** Attention is half a block. The other half is a two-layer network applied to every position independently, and around both sits the residual stream — the running vector that each sub-layer reads, modifies and writes back. You will assemble the whole block, then work through the three choices that separate a 2017 transformer from a 2026 one: where the normalization goes, which normalization it is, and which activation the feed-forward uses. Each of these was a real experiment with a real result, and each is a one-line change you will make in the capstone.

**Sections.**
1. The residual stream as the object of interest: read, modify, write back — and why residuals make deep stacks trainable.
2. The feed-forward network: up-project ×4, non-linearity, down-project, and why it holds most of the parameters.
3. GELU, and **SwiGLU**: the gate, the ×2/3 width correction, and what the ablation actually showed.
4. LayerNorm: what it normalizes and why.
5. **RMSNorm**: dropping the mean subtraction, and the speed it buys.
6. **Pre-LN vs post-LN**: the gradient argument, the warmup requirement post-LN created, and why every modern model is pre-LN.
7. Dropout, and why pretraining largely abandoned it.
8. The complete block, assembled and drawn, with Corvid's exact configuration.
9. Exercises.

**Machines.**
- `llmBlock` · Inspector · State: one block, a vector flowing through it · Controls: click a sub-layer; toggle residual connections off; switch pre-LN/post-LN · Output: the vector's norm at each stage, and the gradient magnitude at each depth · Discovery: turn the residual connections off and watch the gradient at layer 1 vanish; switch post-LN and watch it need warmup · Initial note: "Follow one vector through the block. Then remove the residual connections."
- `llmActivations` · Comparator · State: ReLU, GELU, SwiGLU on the same input · Controls: switch activation; adjust FFN width · Output: the curve, the parameter count, and a small ablation result · Discovery: match SwiGLU's parameter count to GELU's and find that the ×2/3 width rule is what makes the comparison fair.

**Figures.** F8.1 the block, complete; F8.2 the residual stream through 32 layers; F8.3 pre-LN vs post-LN gradient paths; F8.4 LayerNorm vs RMSNorm arithmetic; F8.5 GELU vs SwiGLU.

**Outcomes.** E8, E4 (residual stream). **Rows.** §3.D rows 10–14, 16. **Prereqs.** 5, 6. **Words.** 4,400.

---

#### Chapter 9 — Counting the Machine: Parameters, FLOPs, and Bytes *(Mechanism)*

**Blurb.** Almost every practical question about a model — will it fit, what will it cost to train, how many users can I serve, why did I get an out-of-memory error at batch 9 — is arithmetic you can do on paper in two minutes. This chapter teaches that arithmetic once, carefully, and then the rest of the course uses it constantly. You will count Corvid-7B's parameters block by block until the total matches, compute the FLOPs of one forward pass, work out where activation memory actually goes during training, and then read an unfamiliar `config.json` and say what the model is before downloading a byte of it.

**Sections.**
1. Counting parameters: embeddings, attention projections, FFN, norms — a table that sums to Corvid's total.
2. FLOPs per token, forward: the 2N rule and where it comes from.
3. Training FLOPs: the 6ND estimate, forward plus backward, derived.
4. Memory during inference: weights + KV cache + activations, in bytes, at three precisions.
5. Memory during training: weights + gradients + optimizer states + activations — the 16× rule for AdamW in mixed precision, and why fine-tuning a 7B model in full precision does not fit on any consumer GPU.
6. Reading a `config.json`: mapping every field to a mechanism from Chapters 5–8, on three real models.
7. The estimation habit: five questions to ask before you download a model.
8. Exercises.

**Machines.**
- `llmParamCounter` · Builder · State: a model config · Controls: edit layers, `d_model`, heads, KV heads, `d_ff`, vocab · Output: a live parameter breakdown by component, total, and file size at fp32/bf16/int8/4-bit · Discovery: double `d_model` and watch parameters quadruple, not double · Initial note: "Build Corvid-7B. Then try to make a 3B model with the same context."
- `llmMemoryFit` · Tuner · State: config, batch, sequence length, precision, training or inference · Controls: sliders and a mode switch · Output: a stacked memory bar against the 16 GB line · Discovery: find the batch size where activations, not weights, cause the OOM · Initial note: "Set training mode. Watch what actually fills the card."

**Figures.** F9.1 the parameter table; F9.2 the 6ND derivation; F9.3 stacked inference memory; F9.4 stacked training memory; F9.5 an annotated `config.json`.

**Outcomes.** E8 (counting), A1, A10, E12 (6ND half). **Rows.** §3.D row 15; §3.E row 9; §3.H rows 2. **Prereqs.** 8. **Words.** 3,600.

---

#### Chapter 10 — Mixture of Experts: Paying for Part of a Model *(Mechanism, keystone)*

**Blurb.** A mixture-of-experts model has 400 billion parameters and does the arithmetic of a 30 billion one. The trick is a router that sends each token to two of many feed-forward networks, and almost everything hard about MoE follows from one consequence: routing is a scheduling problem, and schedulers can be unbalanced. You will route tokens by hand, watch one expert collapse into taking everything, add the auxiliary loss that prevents it, and then price the result honestly — because active parameters buy you speed while total parameters still have to live in memory.

**Sections.**
1. The idea: replace one FFN with N, and pick a few per token.
2. The router: a linear layer, top-k gating, and the softmax over experts.
3. **Load balancing**: why routing collapses, the auxiliary loss, and expert capacity with token dropping.
4. Active vs total parameters: two different bills, one for compute and one for memory.
5. What MoE costs in serving: expert parallelism, all-to-all communication, and why MoE is a systems decision.
6. Real MoE models: Switch, Mixtral, DeepSeek-V3's shared experts and fine-grained routing.
7. When not to use MoE.
8. Exercises.

**Machines.**
- `llmMoeRouter` · Simulator · State: a token stream, N experts, router weights, per-expert load · Controls: step tokens; toggle the balancing loss; set top-k and capacity · Output: live per-expert load bars and dropped-token count · Discovery: turn the auxiliary loss off and watch one expert take 60% of traffic within 200 tokens · Initial note: "Run 200 tokens with balancing off. Watch one expert eat the model."
- `llmActiveVsTotal` · Comparator · State: a dense model and an MoE model matched on one axis · Controls: match on active params, or on total, or on quality · Output: memory, FLOPs per token, and tokens/second · Discovery: matched on FLOPs, the MoE model needs five times the memory.

**Figures.** F10.1 dense FFN vs MoE layer; F10.2 the router and top-k; F10.3 load collapse with and without the auxiliary loss; F10.4 capacity and dropped tokens; F10.5 active vs total parameters for four real models.

**Outcomes.** E9, A9. **Rows.** §3.E rows 2, 3. **Prereqs.** 8, 9. **Words.** 3,800.

---

#### Chapter 11 — Reading the Machine: What the Layers Learned *(Mechanism, interpretability)*

**Blurb.** You have built the block; now look at what a trained one contains. Interpretability is in this course for a practical reason, not a philosophical one: when a model behaves strangely, the residual stream is the only place the evidence lives. You will project intermediate layers straight into vocabulary space and watch a prediction form, find heads that copy a token they saw earlier, probe for a concept with a linear classifier, and meet the superposition problem that explains why a neuron rarely means one thing.

**Sections.**
1. The logit lens: applying the output projection at layer k, and watching the answer appear.
2. Induction heads: the two-head circuit that copies a repeated pattern, found on real text.
3. Probing: training a linear classifier on activations, and what a positive result does and does not prove.
4. Superposition and features: why neurons are polysemantic, and what a sparse autoencoder tries to fix.
5. What this buys a working engineer: three debugging questions the residual stream can answer.
6. Exercises.

**Machines.**
- `llmLogitLens` · Stepper · State: a prompt, a per-layer projection to vocabulary · Controls: step through layers; change the prompt · Output: top-5 predicted tokens at every layer · Discovery: find the layer where the correct answer overtakes the plausible-but-wrong one — usually two thirds of the way up · Initial note: "Step up the layers. Watch the model change its mind."
- `llmInductionHead` · Inspector · State: a sequence with a repeated pattern · Controls: select head; change the repeated string · Discovery: find the head that fires only on the second occurrence of a repeated token.

**Figures.** F11.1 the logit lens; F11.2 the induction circuit; F11.3 a probe's accuracy by layer; F11.4 superposition drawn in 2-D.

**Outcomes.** E4 (deepened), A6 (evidence). **Rows.** §3.R all rows. **Prereqs.** 8. **Words.** 2,600.

---

### Part III — Making a Model

#### Chapter 12 — What a Model Reads: Building a Pretraining Corpus *(Mechanism)*

**Blurb.** The most consequential decisions in a model are made before training starts, by whoever chose the data. You will follow a web dump through the pipeline that turns it into a token stream: extraction, language identification, quality filtering, deduplication, and the one step nobody notices until a benchmark score is embarrassing — decontamination. Then the harder question: what mixture of web, code, books and maths, in what order, and what happens when a model trains on another model's output.

**Sections.**
1. Where tokens come from: Common Crawl, code, books, maths, and what each contributes.
2. Extraction and cleaning: boilerplate, encoding, and the long tail of garbage.
3. Quality filtering: heuristics, classifier-based filtering, and what FineWeb's ablations showed.
4. **Deduplication**: exact, near-duplicate and MinHash — and what duplicates do to memorization and loss.
5. **Decontamination**: n-gram overlap against evaluation sets, why it is done badly, and how it is verified.
6. Mixtures and curricula: domain weights, mid-training, and annealing on high-quality data.
7. Synthetic data, and model collapse as the counter-argument.
8. Licensing, consent and what model cards actually disclose.
9. Exercises.

**Machines.**
- `llmCorpusPipeline` · Stepper · State: 1,000 raw documents moving through six filters · Controls: step a stage; toggle each filter; adjust thresholds · Output: documents surviving, tokens remaining, and a sample of what each filter killed · Discovery: read the documents that dedup removed and find near-identical licence boilerplate repeated 400 times · Initial note: "Step the pipeline. Look at what each filter throws away."
- `llmContamination` · Playground · State: a corpus and an evaluation set · Controls: n-gram size, overlap threshold · Output: contaminated documents and the resulting score inflation · Discovery: set n=8 and find benchmark questions verbatim in the "clean" corpus.

**Figures.** F12.1 the ingestion pipeline; F12.2 survival rate by filter; F12.3 MinHash bucketing; F12.4 contamination overlap; F12.5 a real model's data mixture.

**Outcomes.** E10 (data half), O2 (partial). **Rows.** §3.F all rows. **Prereqs.** 2. **Words.** 3,400.

---

#### Chapter 13 — Learning to Predict: The Training Loop *(Mechanism, keystone)*

**Blurb.** Training a language model is one loop with four lines in it, and every one of those lines is worth understanding exactly. You will see how a batch of token ids becomes a loss, why the labels are just the inputs shifted by one, what teacher forcing means and what it costs at inference time, and how perplexity — the metric everyone quotes — is nothing more than the exponential of that loss. Then you will read loss curves the way a doctor reads a chart, because most of debugging a training run is knowing what a shape means.

**Sections.**
1. The data loader: sequences, packing, and the shift-by-one label trick.
2. Cross-entropy over the vocabulary, computed for one position by hand.
3. Teacher forcing: what it makes easy in training and what it leaves unsolved at generation.
4. **Perplexity**: definition, intuition as "effective branching factor", and the four things it fails to measure.
5. Backward pass through a block, at the depth needed to debug — not to re-derive autograd.
6. A real training step, line by line, with shapes annotated.
7. Reading loss curves: healthy descent, divergence, a bad shard, overfitting, and the plateau that means the learning rate died.
8. Exercises.

**Machines.**
- `llmLossStep` · Stepper · State: a batch, logits, loss · Controls: step forward, backward, update; select a position · Output: the distribution at that position, the true token, and its contribution to the loss · Discovery: find the token contributing most to the batch loss and see that it is almost always a rare proper noun · Initial note: "Step one training step. Click a position to see what the model got wrong."
- `llmLossCurves` · Comparator · State: six labelled loss curves · Controls: pick a curve; reveal the diagnosis · Discovery: match the spike-and-recover curve to gradient clipping, and the spike-and-never-recover to its absence · Initial note: "Diagnose each curve before you reveal the answer."

**Figures.** F13.1 inputs and shifted labels; F13.2 one position's cross-entropy; F13.3 the loop with shapes; F13.4 perplexity vs loss; F13.5 the loss-curve pathology gallery.

**Outcomes.** E10, O1 (diagnosis), B3 (foundation). **Rows.** §3.G rows 1–3, 13. **Prereqs.** 8, 12. **Words.** 4,000.

---

#### Chapter 14 — Making It Converge: Optimizers, Schedules, and Precision *(Mechanism, keystone)*

**Blurb.** Every knob in a training config exists because a specific run failed without it. You will meet them in that order — the optimizer that adapts per-parameter step sizes, the warmup that stops the first hundred steps destroying the model, the cosine decay that squeezes out the last of the loss, the clip that survives a bad batch, and the precision choice that halves memory while introducing a new way to get NaN. By the end you can read a training config and say what each line is defending against.

**Sections.**
1. SGD to Adam to **AdamW**: momentum, second moments, why decoupled weight decay was a real bug fix — and where Shampoo and Muon sit at the end of that lineage.
2. Learning-rate schedules: warmup, cosine, and the WSD schedule that lets you stop anywhere.
3. **Gradient clipping** and the loss spike it exists for, with a real spike shown.
4. **Mixed precision**: fp16 and its loss-scaling requirement, bf16 and why it won, fp8 and where it is now.
5. Gradient accumulation: a large batch on a small card, and what it does not fix.
6. Activation checkpointing: recompute instead of store, and the 30% time for 60% memory trade.
7. Batch size, critical batch size, and tokens per step.
8. Instability at scale: z-loss, divergence signatures, and the restart discipline real labs use.
9. Exercises.

**Machines.**
- `llmOptimizer` · Simulator · State: a 2-D loss surface, an optimizer trajectory · Controls: optimizer (SGD / momentum / Adam / AdamW), LR, warmup, schedule · Output: the path, the loss, and a divergence flag · Discovery: set the LR just past stability with and without warmup, and find that warmup alone saves the run · Initial note: "Raise the learning rate until it diverges. Then turn warmup on."
- `llmPrecision` · Comparator · State: a tensor of activations at fp32/fp16/bf16/fp8 · Controls: precision; toggle loss scaling · Output: representable range, relative error, memory · Discovery: find the activation magnitude where fp16 silently becomes zero and bf16 does not · Initial note: "Push the values up. Watch fp16 overflow before bf16 loses precision."
- `llmMemoryLevers` · Tuner · State: the training memory budget · Controls: batch, accumulation steps, checkpointing on/off, optimizer choice · Output: memory and step time against the 16 GB line · Discovery: fit a run that did not fit, and pay for it in wall-clock.

**Figures.** F14.1 optimizer trajectories; F14.2 the three schedules; F14.3 a clipped spike; F14.4 fp16/bf16/fp8 ranges; F14.5 memory before and after checkpointing.

**Outcomes.** E11, O1. **Rows.** §3.G rows 4–12. **Prereqs.** 13. **Words.** 4,400.

---

#### Chapter 15 — How Big, How Long: Scaling Laws *(Mechanism, keystone)*

**Blurb.** Given a fixed pile of compute, how large should the model be and how many tokens should it see? For three years the field answered this wrong, and the correction — Chinchilla — reshaped every model released afterwards. You will fit a scaling law on small runs, use it to predict a larger one, and then work through the twist that governs 2026: if a model will serve billions of tokens after training, the compute-optimal answer is not the cost-optimal answer, which is why every model you can download is trained far past Chinchilla.

**Sections.**
1. The empirical law: loss as a power law in parameters, data and compute.
2. Kaplan et al. 2020, and the conclusion the field acted on for two years.
3. **Chinchilla**: the corrected exponents, the ~20 tokens per parameter rule of thumb, and the experiment that produced it.
4. Using a law: fit on small runs, extrapolate, and the honest error bars on that extrapolation.
5. **Inference-aware scaling**: adding serving cost to the objective, and why Llama-class models see trillions of tokens.
6. Emergence: the abilities that appear suddenly, and the argument that they are an artifact of discontinuous metrics.
7. What scaling laws do not predict.
8. Exercises.

**Machines.**
- `llmScalingLaw` · Tuner · State: compute budget C, allocation between N and D · Controls: budget slider, allocation slider, law selector (Kaplan / Chinchilla / inference-aware) · Output: predicted loss, the optimum marked, and the training cost in GPU-hours · Discovery: hold the budget fixed and find the allocation Kaplan recommends, then switch laws and watch the optimum move to a much smaller model · Initial note: "Fix the budget. Find the best split. Then change the law."
- `llmEmergence` · Comparator · State: a capability's score against scale · Controls: metric (exact match / log-likelihood / partial credit) · Discovery: switch from exact match to partial credit and watch the "emergent jump" become a smooth curve · Initial note: "Look at the jump. Now change the metric."

**Figures.** F15.1 loss vs compute power law; F15.2 Kaplan vs Chinchilla allocation; F15.3 the isoFLOP curves; F15.4 training vs lifetime inference cost; F15.5 emergence under two metrics.

**Outcomes.** E12, A2. **Rows.** §3.H rows 1–3; §3.A row 6. **Prereqs.** 9, 14. **Words.** 3,800.

---

#### Chapter 16 — The GPU: Where the Time Actually Goes *(Mechanism)*

**Blurb.** This is the one chapter about hardware, and it is here because the most important fact in Part V cannot be proved without it. A GPU is thousands of arithmetic units attached to memory that cannot feed them fast enough. Whether an operation is limited by arithmetic or by memory traffic is decided by a single number — arithmetic intensity — and once you can compute it you can predict which optimizations will help before trying them. You will place real operations on a roofline, and discover that a matrix multiply and a matrix–vector multiply live in different worlds.

**Sections.**
1. The machine: SMs, warps, registers, shared memory, L2, HBM — and the bandwidth numbers that matter.
2. Arithmetic intensity: FLOPs per byte moved, computed for three real operations.
3. **The roofline**: the compute ceiling, the bandwidth slope, and where a kernel sits.
4. Why matmul is compute-bound and matrix–vector is memory-bound — the fact Part V is built on.
5. Kernel fusion: why LayerNorm + GELU as one kernel beats two.
6. Writing one: a Triton kernel read line by line, at survey depth.
7. Measuring: what a profiler shows, and the three numbers to look at first.
8. Exercises.

**Machines.**
- `llmRoofline` · Playground · State: a roofline chart for a chosen GPU · Controls: pick an operation (matmul, matvec, softmax, layernorm, attention), set shapes; switch GPU · Output: the point plotted, with achievable and achieved FLOPs · Discovery: plot the same matmul at batch 64 and batch 1 and watch it cross from the compute roof to the bandwidth slope — this is the whole prefill/decode story, one chapter early · Initial note: "Plot a matmul at batch 64. Then set batch to 1."
- `llmFusion` · Comparator · State: two kernels vs one fused kernel · Controls: sequence length; toggle fusion · Output: bytes moved and time · Discovery: find the size where fusion stops mattering because the operation became compute-bound.

**Figures.** F16.1 the GPU memory hierarchy with bandwidths; F16.2 arithmetic intensity worked three ways; F16.3 the roofline with operations plotted; F16.4 fused vs unfused traffic; F16.5 an annotated profiler trace.

**Outcomes.** E19 (foundation), A5 (foundation), B8 (foundation). **Rows.** §3.H rows 4, 5, 9. **Prereqs.** 9. **Words.** 3,600.

---

#### Chapter 17 — Spreading a Training Run: Data, Tensor, Pipeline, Expert *(Mechanism)*

**Blurb.** One GPU cannot hold a frontier model, and the ways of splitting a model across many are not interchangeable — each cuts along a different axis and pays a different communication bill. You will split the same training step four ways, watch what crosses the network in each, and learn to pick from the bottleneck rather than from fashion. This is also the chapter that makes a DeepSpeed or FSDP config readable, which is the practical outcome most engineers actually need.

**Sections.**
1. Data parallelism, and the all-reduce that makes it work.
2. **ZeRO/FSDP stages 1–3**: sharding optimizer states, then gradients, then parameters — with memory saved per stage.
3. **Tensor parallelism**: splitting a matmul across devices, and the two all-reduces per block.
4. **Pipeline parallelism**: stages, micro-batches, and the bubble.
5. Expert and context parallelism, for MoE and long sequences.
6. Combining them: 3-D parallelism, and the order the axes are usually nested.
7. Choosing from the bottleneck: a decision procedure, plus what interconnect topology does to the bill.
8. Reading a real config: FSDP and DeepSpeed side by side.
9. Exercises.

**Machines.**
- `llmParallelism` · Simulator · State: a model, a device mesh, a strategy · Controls: strategy (DP / ZeRO-1,2,3 / TP / PP / hybrid), device count, model size · Output: per-device memory, bytes communicated per step, and the pipeline bubble drawn on a timeline · Discovery: add devices under pure data parallelism and watch memory per device not fall at all, then switch to ZeRO-3 and watch it collapse · Initial note: "Add GPUs with plain data parallelism. Notice memory never drops."

**Figures.** F17.1 the four axes; F17.2 ZeRO stages; F17.3 a tensor-parallel matmul; F17.4 the pipeline bubble; F17.5 a 3-D parallel mesh.

**Outcomes.** E13, A5 (training side). **Rows.** §3.H rows 6–8. **Prereqs.** 14, 16. **Words.** 3,600.

---

### Part IV — Making It Useful

#### Chapter 18 — Decoding: Turning a Distribution Into Text *(Mechanism, keystone)*

**Blurb.** The model hands you a probability for every token in the vocabulary. Everything after that is a choice, and those choices are why the same model can be a careful assistant or a confident liar. You will sample from a real distribution under every strategy in the field, watch temperature stretch and flatten the curve, find the exact point where top-p starts admitting nonsense, and learn why greedy decoding — the obvious choice — produces text that loops. Then the practical layer: stopping criteria, penalties, determinism, and reading logprobs as a confidence signal.

**Sections.**
1. Greedy decoding, and the repetition it walks into.
2. **Temperature**: dividing the logits, and what it does to the tail.
3. **Top-k, top-p and min-p**: truncating the distribution, and the failure each one prevents.
4. Beam search: what it optimizes, why translation loves it and chat does not.
5. Repetition, presence and frequency penalties, and when they damage output.
6. Stopping: EOS, stop strings, max tokens, and the truncation bugs each causes.
7. Determinism: seeds, batching non-determinism, and why "same prompt, different answer" is expected.
8. Logprobs in practice: confidence, routing, and detecting a model that is guessing.
9. Exercises.

**Machines.**
- `llmSampler` · Playground · State: one real next-token distribution · Controls: temperature, top-k, top-p, min-p, penalties; sample repeatedly · Output: the surviving candidate set drawn on the distribution, and 20 sampled continuations · Discovery: set temperature 0.7 with top-p 0.95, then raise temperature to 1.5 and find the exact token where the tail starts producing garbage · Initial note: "Sample twenty times at temperature 0. Then at 1.5." · Layout: distribution bars with the truncation line drawn across them, samples listed beneath.
- `llmGreedyLoop` · Stepper · State: a generation under greedy decoding · Controls: step; switch to sampling mid-generation · Discovery: watch greedy decoding enter a repeating cycle, then break it by switching strategy at that exact token.

**Figures.** F18.1 logits → softmax → sample; F18.2 temperature on one distribution; F18.3 top-k vs top-p vs min-p truncation; F18.4 a beam-search tree; F18.5 the repetition loop.

**Outcomes.** E14, A6 (decoding half). **Rows.** §3.I rows 1–6, 9. **Prereqs.** 13. **Words.** 3,800.

---

#### Chapter 19 — Making the Model Act: Structured Output, Tools, and Agents *(Mechanism, keystone)*

**Blurb.** A model that emits free text cannot be wired into a program. Two mechanisms fix that, and they are the same mechanism: constrain which tokens are legal at each step, and you get JSON that always parses; describe your functions in that JSON and loop the output back in, and you get tool calling. You will mask a vocabulary against a grammar token by token, then build the loop that turns a text predictor into something that queries a database — and see honestly where the loop fails, because most agent demos are one retry away from collapse.

**Sections.**
1. Why free text breaks programs, and the two bad fixes (regex, retries) before the good one.
2. **Constrained decoding**: a grammar or schema compiled to a state machine, masking illegal tokens before the softmax (P3 traced).
3. What it costs: mask construction, the tokenizer-alignment problem, and the quality effect of forbidding the model's preferred token.
4. Function calling on the wire: the tool schema, the model's emitted call, and the result fed back — with the provider formats compared.
5. The agent loop: ReAct, the step budget, and termination.
6. **MCP** and agent protocols: what is standardized, what is not, and what a server actually exposes.
7. Memory: what an agent carries between steps, and what it costs per turn.
8. Multi-agent systems, and the honest case against them.
9. Evaluating an agent: task success is not enough — cost, steps, and recoverability.
10. Sandboxing and permissions: an agent with tools is an attack surface (forward pointer to Chapter 33).
11. Exercises.

**Machines.**
- `llmGrammarMask` · Stepper · State: a JSON schema compiled to an automaton, the current state, the legal token mask · Controls: step generation; edit the schema; toggle constraint off · Output: the vocabulary with illegal tokens greyed, the emitted string · Discovery: turn the constraint off and watch a valid-looking object miss a closing brace; turn it on and watch the brace become the only legal token · Initial note: "Generate with the schema off, then on. Watch the mask close in."
- `llmAgentLoop` · Simulator · State: a task, a tool set, a transcript, a step budget · Controls: run; step; break a tool; change the budget · Output: the reason/act/observe transcript with cost per step · Discovery: make one tool return an error and watch the agent either recover or loop until the budget dies · Initial note: "Run the task. Then break the search tool and run it again."

**Figures.** F19.1 schema → automaton → token mask; F19.2 the tool-call round trip; F19.3 the ReAct loop; F19.4 an MCP client/server exchange; F19.5 cost per step across an agent run.

**Outcomes.** **E27**, E14 (constrained half), O9 (partial). **Rows.** §3.I row 7; §3.P all rows. **Prereqs.** 18. **Words.** 4,600.

---

#### Chapter 20 — Supervised Fine-Tuning: Teaching a Model a Job *(Mechanism, keystone)*

**Blurb.** A pretrained model continues text; an assistant answers questions. Supervised fine-tuning is the step between, and it is mostly a data problem wearing a training-loop costume. You will make the decision first — prompt, retrieve, fine-tune, or align — with the five axes that actually decide it, then build the dataset, mask the loss so the model learns the answer and not the question, and measure what the fine-tune broke elsewhere. Because it always breaks something, and the engineers who know that measure it.

**Sections.**
1. **The decision**: prompting vs RAG vs SFT vs preference alignment vs continued pretraining, on freshness, style, access control, capability and cost — with the handoff to *RAG In Depth* stated.
2. What SFT actually changes, and the finding that fine-tuning on new facts increases hallucination.
3. **Instruction data**: sourcing, human vs synthetic, the Alpaca/LIMA/UltraChat/Magpie lineage, and why 1,000 good examples beat 50,000 mediocre ones.
4. Building the set: deduplication, decontamination against your own eval, and the held-out split you must keep.
5. Formatting: chat templates again, and **loss masking** so the prompt tokens are not trained on.
6. Packing, epochs, and the hyperparameters that actually matter for SFT.
7. **Catastrophic forgetting**, measured: the benchmark that drops while your task metric rises.
8. Continued pretraining and domain adaptation: when the answer is more pretraining, not more instructions.
9. Exercises.

**Machines.**
- `llmTuneDecision` · Comparator · State: six requirement toggles (fresh daily, must cite, per-user permissions, fixed output shape, house style, tiny budget) · Output: the recommended approach and the axis that decided it · Discovery: turn on "per-user permissions" alone and watch fine-tuning become impossible · Initial note: "Flip requirements. The verdict explains itself."
- `llmLossMask` · Inspector · State: a formatted training example · Controls: toggle prompt masking; change the template · Output: per-token loss contribution, coloured · Discovery: train on the prompt tokens and watch the model learn to generate questions instead of answers · Initial note: "Turn masking off. Look at which tokens are now being learned."
- `llmForgetting` · Tuner · State: task metric and three general benchmarks against fine-tuning steps · Controls: steps, LR, dataset size, LoRA on/off · Discovery: find the step count where the task keeps improving and general ability starts falling.

**Figures.** F20.1 the five-axis decision matrix; F20.2 a formatted example with the loss mask; F20.3 packing; F20.4 forgetting curves; F20.5 data quality vs quantity.

**Outcomes.** E15 (SFT half), A3, O2, O3 (partial). **Rows.** §3.J rows 1–4, 8, 9, 12. **Prereqs.** 3, 13, 14. **Words.** 4,800.

---

#### Chapter 21 — LoRA, QLoRA, and the Rest of Adaptation *(Mechanism, keystone)*

**Blurb.** Full fine-tuning of a 7B model needs roughly 100 GB. LoRA does the same job in 12, and the reason is a hypothesis you can test: the update a fine-tune makes is low-rank, so you can learn it as two thin matrices and leave the original weights frozen. You will decompose an update and watch its rank, choose which matrices to target and see the quality change, then add 4-bit quantization of the frozen base — QLoRA — and fit a 7B fine-tune on the 16 GB budget. The chapter ends with the other members of the family, including the one that makes small models good: distillation.

**Sections.**
1. The memory problem, restated in bytes from Chapter 9.
2. **The low-rank hypothesis**, and a decomposition shown on a real fine-tune's weight delta.
3. LoRA: the two matrices, the scaling α/r, initialization, and where it plugs in.
4. Choosing rank and target modules: what changes when you add the MLP, with measured results.
5. **QLoRA**: NF4, double quantization, paged optimizers — and the 16 GB fit demonstrated.
6. Serving adapters: merging, hot-swapping, and multi-tenant adapter serving.
7. The rest of PEFT: adapters, prefix and prompt tuning, IA³, DoRA — what each trades; and a field-guide callout on the frameworks that wrap all of it (TRL, PEFT, Axolotl, Unsloth).
8. Model merging: soups, SLERP, TIES, DARE.
9. **Knowledge distillation**: logit-level and sequence-level, and why most good small models are distilled rather than trained small.
10. Exercises.

**Machines.**
- `llmLoraRank` · Tuner · State: a weight matrix, its low-rank approximation · Controls: rank slider, α, target-module checkboxes · Output: trainable-parameter count, memory, reconstruction error, and a quality proxy · Discovery: find the rank where quality stops improving but memory keeps growing — usually far lower than people set · Initial note: "Raise the rank until quality stops improving. Note the number."
- `llmQuantBase` · Inspector · State: a weight tensor in fp16, NF4 and int4 · Controls: precision; toggle double quantization; show error histogram · Discovery: see that NF4's non-uniform levels put more resolution where weights actually cluster.
- `llmDistill` · Comparator · State: teacher, student, hard labels vs soft logits · Controls: temperature, loss mixture · Discovery: find the temperature where the teacher's "wrong" answers teach the student most.

**Figures.** F21.1 the LoRA decomposition; F21.2 memory: full vs LoRA vs QLoRA; F21.3 NF4 quantization levels; F21.4 adapter merging and serving; F21.5 distillation loss.

**Outcomes.** E15, A4, O3. **Rows.** §3.J rows 5–7, 10, 11, 13 (frameworks). **Prereqs.** 9, 20. **Words.** 4,600.

---

#### Chapter 22 — Preferences: Reward Models and RLHF *(Mechanism, keystone)*

**Blurb.** Supervised fine-tuning teaches a model to imitate one good answer. It cannot teach the model that this answer is better than that one, and "better" is most of what makes an assistant usable. Reinforcement learning from human feedback solves it in three moves: collect comparisons, train a model that scores them, then optimize the language model against that score while a leash keeps it from drifting into nonsense. You will run the loop, tighten and loosen the leash, and watch the model discover that the reward model can be fooled.

**Sections.**
1. What SFT cannot express, and why comparisons are easier to collect than demonstrations.
2. Preference data: pairwise comparisons, annotator agreement, and what it costs.
3. **The reward model**: the Bradley–Terry objective, training it, and reading its scores.
4. **PPO for language models**: the policy, the rollout, the advantage, and why the setup is fiddly.
5. **The KL penalty**: the leash to the reference model, and what happens at each end of it.
6. The full InstructGPT pipeline, drawn end to end.
7. The alignment tax: what measurably gets worse.
8. Why almost nobody runs this loop in 2026 — a pointer into Chapter 23.
9. Exercises.

**Machines.**
- `llmRewardModel` · Playground · State: response pairs and a reward model's scores · Controls: pick a pair; edit a response; toggle a length-bias probe · Output: scores and the preference prediction · Discovery: make a response longer without making it better and watch the reward rise · Initial note: "Add three sentences of padding. Watch the score."
- `llmRlhfLoop` · Simulator · State: policy, reference, reward, KL · Controls: KL coefficient, steps · Output: reward curve, KL curve, and sample outputs at each stage · Discovery: set the KL coefficient near zero and watch reward soar while the samples become gibberish — reward hacking, live · Initial note: "Drop the KL penalty to 0.001. Watch the reward go up and the text fall apart."

**Figures.** F22.1 the three-stage pipeline; F22.2 Bradley–Terry; F22.3 the PPO loop; F22.4 reward vs KL trajectories; F22.5 the alignment tax.

**Outcomes.** E17 (RLHF half), O4 (partial). **Rows.** §3.K rows 1–5, 10. **Prereqs.** 20. **Words.** 4,400.

---

#### Chapter 23 — DPO and What Came After *(Mechanism, keystone)*

**Blurb.** In 2023 someone noticed that the RLHF objective has a closed-form optimal policy, and that substituting it back turns the whole reinforcement-learning apparatus into a classification loss you can train with a normal optimizer. That is DPO, and this chapter derives it rather than quoting it — five lines of algebra that removed a reward model and a rollout loop from most pipelines. Then the successors: GRPO, which brought RL back for reasoning models, and the cheap baselines that beat both more often than anyone admits.

**Sections.**
1. The RLHF objective, restated, and its closed-form optimum.
2. **The DPO derivation**: substituting the optimum, cancelling the partition function, and arriving at the loss — step by step.
3. Reading the DPO loss: what the implicit reward is, and what β does.
4. Running it: data, β, the reference model, and the failure where both chosen and rejected likelihoods fall.
5. **GRPO**: group-relative advantage without a value network, and why reasoning training uses it.
6. The cheap baselines: rejection sampling and best-of-n, and when they win.
7. RLAIF and Constitutional AI: replacing the human labeller with a rubric.
8. **Reward hacking, sycophancy and length bias** — measured on your own model, not asserted.
9. Choosing among them: a decision procedure.
10. Exercises.

**Machines.**
- `llmDpoDerive` · Stepper · State: the derivation, one algebraic step per press · Controls: step forward/back; hover a term for its meaning · Discovery: watch the partition function cancel — the step that removes the reward model · Initial note: "Step through the algebra. Watch Z(x) disappear."
- `llmDpoBeta` · Tuner · State: chosen/rejected log-probabilities during training · Controls: β, steps, dataset noise · Output: implicit reward margin, and both likelihoods over time · Discovery: find the β where the margin grows while *both* likelihoods fall — the model learned to dislike everything · Initial note: "Lower β until the margin looks great. Then look at the absolute likelihoods."
- `llmObjectiveCompare` · Comparator · State: PPO, DPO, GRPO, best-of-n on one task · Controls: pick a constraint (compute, data, no reward model) · Discovery: find the setting where best-of-n beats all three.

**Figures.** F23.1 the derivation on one page; F23.2 the implicit reward; F23.3 GRPO's group advantage; F23.4 likelihood collapse; F23.5 the four-objective comparison.

**Outcomes.** E17, O4. **Rows.** §3.K rows 6–9. **Prereqs.** 22. **Words.** 4,600.

---

#### Chapter 24 — Thinking Longer: Reasoning Models and Test-Time Compute *(Mechanism, keystone)*

**Blurb.** For a decade, more capability meant a bigger model. Then a second axis appeared: let the model produce more tokens before answering, and reward it for the ones that led to a correct result. That is what separates a reasoning model from a chat model, and it changes the economics of every deployment because a hard question now costs ten times a simple one. You will watch chain-of-thought change a distribution, train on verifiable rewards in miniature, compare process and outcome supervision, and price an answer honestly.

**Sections.**
1. Chain-of-thought as a prompting result, and what it does to the token distribution.
2. Self-consistency and the search family: sampling many paths and voting.
3. **RL on verifiable rewards**: maths and code as domains where the reward is a checker, not a model.
4. What a long chain of thought looks like inside: backtracking, self-correction, and the tokens nobody sees.
5. **Process vs outcome reward models**: supervising the steps or the answer, and what each buys.
6. **Test-time compute as a scaling axis**: accuracy against tokens spent, with a real curve.
7. Failure modes: overthinking simple questions, truncated traces, and cost blowouts in production.
8. Deciding when a reasoning model is worth it.
9. Exercises.

**Machines.**
- `llmTestTimeCompute` · Tuner · State: accuracy against thinking-token budget, per task difficulty · Controls: budget, strategy (single / self-consistency n / long CoT), difficulty · Output: accuracy, tokens, and cost per correct answer · Discovery: find the difficulty below which extra thinking loses money · Initial note: "Raise the budget on an easy question. Watch cost per correct answer get worse."
- `llmPrmVsOrm` · Comparator · State: a solution trace with per-step and final scores · Controls: switch supervision; introduce a wrong step that reaches a right answer · Discovery: find the trace an outcome model rewards and a process model rejects.

**Figures.** F24.1 CoT's effect on the distribution; F24.2 self-consistency voting; F24.3 the RLVR loop; F24.4 accuracy vs thinking tokens; F24.5 process vs outcome supervision.

**Outcomes.** E24, A2 (test-time axis). **Rows.** §3.L all rows. **Prereqs.** 23. **Words.** 4,000.

---

#### Chapter 25 — A Field Guide to Open-Weights Models *(Engineering reality)*

**Blurb.** You now know every design decision a model makes. This chapter reads them off the real ones. For each major family you will map its architecture onto the mechanisms of Part II, name what it was trained for, state its licence in plain language, and give the one operational fact that bites people who deploy it. Then a decision procedure: given a task, a budget and a piece of hardware, which model do you actually pick, and what would make you change your mind.

**Sections.**
1. How to read a model release: the card, the config, the paper, and the parts that are marketing.
2. The families: Llama, Qwen, Gemma, Mistral/Mixtral, DeepSeek, Phi, OLMo — lineage, architecture choices, sweet spot, known failure modes, one operational fact each.
3. Dense vs MoE in the wild: what the field actually ships and why.
4. Reasoning variants and instruct variants: what changed between the checkpoints.
5. Licences that are not open source, and what the restrictions mean for a business.
6. Fully open models (OLMo and friends) and why they matter even if you never deploy one.
7. Not transformers: Mamba, RWKV and hybrid stacks — what the alternatives actually offer, and why almost nothing you can deploy uses them yet.
8. **Choosing**: a decision procedure on capability, licence, hardware, latency and cost.
9. Exercises.

**Machines.**
- `llmModelPicker` · Comparator · State: model catalogue with architecture, size, licence, benchmark and hardware fit · Controls: task, hardware (the 16 GB budget or larger), licence constraint, latency target · Output: ranked shortlist with the constraint that eliminated each rejected model · Discovery: add "commercial use, under 16 GB, sub-second first token" and watch the list collapse to two · Initial note: "Set your hardware and licence constraints first. Then look at what is left."

**Figures.** F25.1 an annotated model card; F25.2 architecture choices across seven families; F25.3 the licence spectrum; F25.4 the release timeline; F25.5 the decision procedure.

**Outcomes.** A10, A9 (applied), A5 (model choice). **Rows.** §3.A row 8; §3.E rows 8, 9 (applied). **Prereqs.** 10, 15, 21. **Words.** 3,600.

---

### Part V — Making It Fast, Correct and Safe

#### Chapter 26 — Two Machines: Prefill and Decode *(Mechanism, keystone)*

**Blurb.** Ask a model a question and the first token takes 400 ms while the next hundred take 8 ms each. That is not a warm-up: prefill and decode are different computations running against different limits, and every serving decision follows from telling them apart. Using the roofline from Chapter 16, you will show that generating one token moves the entire model's weights through memory to do a trivial amount of arithmetic — which is why decode is limited by bandwidth, why batching is free until it isn't, and why a faster GPU with the same memory barely helps. This is the chapter no book in the field's current shelf contains.

**Sections.**
1. Two phases, measured: TTFT and TPOT on a real request, with the shapes that produce each.
2. Prefill: a matrix–matrix multiply over the whole prompt, compute-bound, parallel.
3. Decode: a matrix–vector multiply for one token, and its arithmetic intensity computed.
4. **Why decode is memory-bandwidth-bound**: bytes moved per token against FLOPs performed, with Corvid's numbers and the GPU's bandwidth.
5. The KV cache in bytes, exactly: per token, per layer, per head, per precision — and the capacity it eats.
6. What follows: batching raises intensity, quantization cuts bytes, speculation amortizes passes — the map of the next three chapters.
7. Latency vocabulary used correctly: TTFT, TPOT, ITL, throughput, goodput.
8. Exercises.

**Machines.**
- `llmPrefillDecode` · Simulator · State: a request through both phases · Controls: prompt length, generated length, batch size · Output: a timeline with prefill and decode blocks, TTFT, TPOT, and the utilization of compute vs bandwidth in each · Discovery: raise the prompt from 100 to 4,000 tokens and watch TTFT grow while TPOT does not move at all · Initial note: "Lengthen the prompt. Watch which number changes." · Layout: timeline on top, roofline position of each phase below.
- `llmDecodeArithmetic` · Tuner · State: model size, precision, batch size, GPU bandwidth · Controls: sliders · Output: bytes per token, arithmetic intensity, the roofline position, and predicted tokens/second — with the measured value overlaid · Discovery: raise batch size and watch the point walk up the bandwidth slope toward the compute roof; find the batch where it arrives · Initial note: "Batch size 1. Look at the arithmetic intensity. Now raise the batch."

**Figures.** F26.1 the two phases on a timeline; F26.2 matmul vs matvec shapes; F26.3 bytes vs FLOPs per decoded token; F26.4 the roofline with both phases plotted; F26.5 KV-cache bytes for four models.

**Outcomes.** E19, E20, A1, A5. **Rows.** §3.N rows 1–4. **Prereqs.** 6, 9, 16. **Words.** 4,800.

---

#### Chapter 27 — Serving Many at Once: Batching, Paging, and Prefix Caching *(Mechanism, keystone)*

**Blurb.** One user leaves a GPU almost idle. The whole art of serving is filling it without making anyone wait, and three mechanisms do the work. Continuous batching stops short requests waiting behind long ones. PagedAttention borrows an idea from operating systems so the KV cache stops wasting half its memory to fragmentation. Prefix caching notices that a thousand requests share the same system prompt and refuses to compute it a thousand times. You will run a scheduler, fragment a cache and fix it, and price a shared prefix.

**Sections.**
1. Static batching and the head-of-line problem it creates.
2. **Continuous batching**: iteration-level scheduling, joining and leaving mid-flight.
3. Where the KV cache fragments: variable lengths, over-reservation, and the memory actually wasted.
4. **PagedAttention**: blocks, a block table, and copy-on-write for shared prefixes.
5. **Prefix caching**: automatic reuse, hit rates, and the economics of a long system prompt.
6. Scheduling policy: throughput against fairness, preemption, and chunked prefill.
7. Goodput under a latency SLO, and the batch size that maximizes it.
8. KV-cache quantization and eviction, briefly.
9. Exercises.

**Machines.**
- `llmScheduler` · Simulator · State: an arriving request stream, GPU slots, a queue · Controls: policy (static / dynamic / continuous), batch cap, request-length mix; inject a burst · Output: live timeline, TTFT distribution, throughput, idle fraction · Discovery: with static batching, put one 4,000-token request in a batch of short ones and watch every short request wait for it; switch to continuous and watch the tail collapse · Initial note: "Run static batching with mixed lengths. Look at the p99."
- `llmPagedCache` · Builder · State: KV memory as blocks · Controls: add/remove requests; toggle paging; share a prefix · Output: allocated vs used memory, fragmentation percentage, concurrent capacity · Discovery: without paging, find the point where 40% of the cache is reserved and unused · Initial note: "Add requests of different lengths. Watch the gaps appear."
- `llmPrefixCache` · Tuner · State: a shared system prompt and N requests · Controls: prompt length, hit rate, request rate · Output: prefill FLOPs saved, TTFT change, cost per 1,000 requests · Discovery: find the system-prompt length where caching pays for its own memory.

**Figures.** F27.1 static vs continuous batching timelines; F27.2 cache fragmentation; F27.3 blocks and the block table; F27.4 copy-on-write for a shared prefix; F27.5 goodput vs batch size under an SLO.

**Outcomes.** E20 (paging), A5, O5. **Rows.** §3.N rows 5–7, 12. **Prereqs.** 26. **Words.** 4,600.

---

#### Chapter 28 — Faster Attention, Fewer Forward Passes *(Mechanism, keystone)*

**Blurb.** Two optimizations changed what is possible without changing what is computed. FlashAttention never writes the n×n score matrix to memory at all — it tiles the computation so the whole thing stays in fast on-chip memory, which is why long contexts became affordable. Speculative decoding attacks the other end: since decode wastes a compute-capable GPU on one token at a time, let a small model guess several and verify them all in one pass. You will trace both, and confirm that neither changes the output distribution.

**Sections.**
1. Standard attention's memory traffic: what actually gets written to HBM and read back.
2. **FlashAttention**: tiling, the online softmax, and recomputation in the backward pass.
3. FlashAttention-2 and -3: better work partitioning, and what changed for the hardware.
4. Why this is an I/O optimization and not an approximation — the output is identical.
5. **Speculative decoding**: a draft model proposes k tokens, the target verifies in one forward pass, and the accept/reject rule that keeps the distribution exact.
6. Acceptance rate: what drives it, and where speculation stops paying.
7. Self-speculation, multi-token prediction heads, and Medusa/EAGLE: dropping the separate draft model.
8. Choosing: which of these to reach for, given the bottleneck from Chapter 26.
9. Exercises.

**Machines.**
- `llmFlashTiling` · Stepper · State: the attention computation, tile by tile · Controls: step a tile; set tile size; toggle standard vs flash · Output: HBM bytes read/written, on-chip occupancy, and a running total · Discovery: compare total HBM traffic at sequence length 8,192 and find the ~10× reduction with identical output · Initial note: "Step through both versions. Watch the memory traffic counter."
- `llmSpeculative` · Simulator · State: a draft model, a target model, a generation · Controls: draft length k, draft quality, temperature · Output: proposed tokens with accepted/rejected marks, effective speedup · Discovery: raise k too far and watch the speedup fall as rejections waste the verification pass · Initial note: "Set k=4. Then k=12. Find where it stops helping."

**Figures.** F28.1 standard attention's HBM traffic; F28.2 flash tiling with the online softmax; F28.3 memory traffic compared; F28.4 the speculative accept/reject walk; F28.5 speedup against acceptance rate.

**Outcomes.** E21, A5. **Rows.** §3.N rows 8, 9; §3.E row 7. **Prereqs.** 16, 26. **Words.** 4,200.

---

#### Chapter 29 — Quantization: Smaller Weights, Same Model? *(Mechanism, keystone)*

**Blurb.** Quantization is the highest-leverage optimization available: 4-bit weights cut memory by four and, because decode is bandwidth-bound, cut latency by nearly as much. It is also the one where people accept quality loss they never measured. You will quantize a tensor by hand, find the outlier features that break naive schemes, walk the four families the field actually uses, and then do the thing most teams skip — measure what it cost on a fixed evaluation before shipping it.

**Sections.**
1. The idea: fewer bits per weight, and the memory and bandwidth it buys (linked to Chapter 26).
2. Quantizing by hand: scale, zero-point, symmetric vs asymmetric, per-tensor vs per-channel vs per-group.
3. **Outlier features**, and why they break naive int8 — the LLM.int8() finding.
4. **NF4**: non-uniform levels matched to a normal distribution, and double quantization.
5. **GPTQ and AWQ**: calibration-based post-training quantization, and what each optimizes.
6. **GGUF k-quants and i-quants**: the format people actually run locally, and what the suffixes mean.
7. Activation and KV-cache quantization: a different problem with a different error profile.
8. **Measuring the damage**: perplexity, a benchmark subset, and a task evaluation — and which of the three lies to you.
9. Choosing a scheme for a deployment.
10. Exercises.

**Machines.**
- `llmQuantize` · Playground · State: a real weight distribution · Controls: bits, scheme (int8 / int4 / NF4), granularity, outlier handling · Output: quantized values, error histogram, worst-case error, and memory saved · Discovery: introduce one outlier 20× larger than the rest and watch per-tensor int8 destroy every other weight in the row; then switch to per-group and watch it recover · Initial note: "Quantize per-tensor. Then add an outlier."
- `llmQuantQuality` · Comparator · State: one model at five quantization levels · Controls: scheme; metric (perplexity / benchmark / task eval) · Output: quality against memory and tokens per second · Discovery: find the scheme where perplexity barely moves but the task evaluation falls off a cliff · Initial note: "Judge by perplexity first. Then switch to the task evaluation."

**Figures.** F29.1 fp16 → int4 on a real distribution; F29.2 outlier features; F29.3 NF4 levels; F29.4 the GGUF k-quant family; F29.5 quality vs memory vs speed for five schemes.

**Outcomes.** E22, A5, O6. **Rows.** §3.N rows 10, 11, 14 (mentioned). **Prereqs.** 26. **Words.** 4,400.

---

#### Chapter 30 — Serving Engines: A Field Guide *(Engineering reality)*

**Blurb.** Six engines, one job, and genuinely different answers. For each you will map its design onto the mechanisms of Chapters 26–29 — how it batches, how it manages the cache, which quantizations it accepts, what hardware it targets — then name its sweet spot, its known failure modes, and the one operational fact that surprises people. Then the decision procedure: given a model, a latency target, a hardware budget and a team, which engine, and what would make you switch.

**Sections.**
1. What an engine does: the loop between an HTTP request and a streamed token, and what streaming does to a product's latency story.
2. **vLLM**: PagedAttention's home, continuous batching, prefix caching, the quantization matrix, and its operational facts.
3. **SGLang**: RadixAttention and structured-output performance.
4. **TGI** and **TensorRT-LLM**: the Hugging Face and NVIDIA paths, and what compilation buys and costs — CUDA graphs and `torch.compile` at serve time.
5. **`llama.cpp` and Ollama**: GGUF, CPU and Apple Silicon, and why local inference is a different design.
6. **MLX** and the on-device story.
7. Deployment shapes: real-time, batch, streaming, on-device — and hardware sizing arithmetic for each.
8. Routing and gateways: cascades from cheap to expensive, and where the router itself becomes the bottleneck.
9. Autoscaling token workloads: why request-count autoscaling is wrong and what to scale on instead.
10. **Choosing**: the decision procedure.
11. Exercises.

**Machines.**
- `llmEngineCompare` · Comparator · State: six engines across ten dimensions from Chapters 26–29 · Controls: pick model, hardware, latency target, quantization requirement · Output: ranked engines with the disqualifying constraint named for each rejection · Discovery: require Apple Silicon and 4-bit and watch the list reduce to two · Initial note: "Choose your hardware first. Half the table disappears."
- `llmServingSizing` · Tuner · State: model, GPU, target QPS, SLO · Controls: sliders · Output: replicas needed, cost per million tokens, and the binding constraint (memory, bandwidth or compute) · Discovery: find the QPS where adding a replica is cheaper than a bigger GPU.

**Figures.** F30.1 the engine request loop; F30.2 the six engines on the course's dimensions; F30.3 deployment shapes; F30.4 a routing cascade; F30.5 the sizing worksheet.

**Outcomes.** A5, O5, O10. **Rows.** §3.O all rows; §3.I row 8; §3.N row 13. **Prereqs.** 27, 28, 29. **Words.** 3,800.

---

#### Chapter 31 — One More Modality: Vision-Language Models *(Mechanism)*

**Blurb.** A language model takes a sequence of vectors and does not care where they came from. That single fact is the whole of multimodality: cut an image into patches, embed each patch, project it into the same space the text tokens live in, and the decoder you already understand can read pictures. You will follow that path, see how CLIP learned a shared space in the first place, and compare the two ways of bridging encoder and decoder — a simple linear projector or a Q-Former — and why the field mostly chose the simple one.

**Sections.**
1. The claim: the decoder does not know what a token is.
2. **CLIP**: contrastive image–text training, and the shared space it produces.
3. **ViT**: patches as tokens, and the position problem again.
4. Bridging: a linear or MLP projector (LLaVA) vs a Q-Former (BLIP-2), and what each costs.
5. Training a VLM: the stages, and what is frozen when.
6. Image tokens are expensive: how many tokens a picture actually costs, and what that does to context and price.
7. Serving multimodal models, and where engines differ.
8. Beyond vision, in one page: audio and the same trick.
9. Exercises.

**Machines.**
- `llmPatchTokens` · Inspector · State: an image cut into patches, each embedded · Controls: patch size, resolution; hover a patch to see its token · Output: token count and the context cost in text-token equivalents · Discovery: double the resolution and watch the token cost quadruple · Initial note: "Raise the resolution. Watch the token bill."
- `llmClipSpace` · Playground · State: images and captions in one embedding space · Controls: add a caption; toggle the contrastive training steps · Discovery: find a caption that matches the wrong image and see why the negative mattered.

**Figures.** F31.1 patches → tokens → the same stream; F31.2 CLIP's contrastive matrix; F31.3 projector vs Q-Former; F31.4 VLM training stages; F31.5 image token cost by resolution.

**Outcomes.** E25. **Rows.** §3.Q rows 1–4. **Prereqs.** 4, 7. **Words.** 3,200.

---

#### Chapter 32 — Measuring a Model *(Mechanism, keystone)*

**Blurb.** Every claim in this course has been backed by a number, and this is the chapter about whether the number means anything. Evaluating a generative model is structurally harder than evaluating a classifier, and the field's standard practices contain several traps that produce confident, published, wrong conclusions. You will reproduce a benchmark score and fail to reproduce it, find a benchmark question inside a training corpus, catch an LLM judge preferring the longer answer regardless of quality, and then build the evaluation that actually matters: a small, task-specific set with confidence intervals.

**Sections.**
1. Why generation is hard to score: many right answers, and no exact match.
2. Perplexity and likelihood metrics as the floor, and their blind spots.
3. Multiple-choice benchmarks: MMLU, ARC, HellaSwag — and how the answer is actually scored.
4. **Prompt sensitivity**: the same model, the same benchmark, five point swings from formatting.
5. Generation benchmarks: GSM8K, HumanEval, IFEval, and what each really tests.
6. **Contamination**: how it enters, how it is detected, and the scores it has inflated.
7. **LLM-as-a-judge**: position bias, verbosity bias, self-preference — measured, then corrected by calibration against human labels.
8. Arena-style comparison and Elo's assumptions.
9. **Statistical significance**: sample size, variance, and the confidence interval that should accompany every reported score.
10. Building your own evaluation: the rubric, the set, the split, and the CI harness.
11. Exercises.

**Machines.**
- `llmJudgeBias` · Playground · State: response pairs and a judge · Controls: swap order; pad one response; make the judge the author of one response · Output: the judge's verdict and its flip rate · Discovery: swap the order of two identical-quality answers and find the judge changes its mind more than 20% of the time · Initial note: "Judge a pair. Then swap their order and judge again."
- `llmBenchmarkCI` · Tuner · State: a benchmark score with n samples · Controls: sample size, model difference, prompt variant · Output: the score, its confidence interval, and a "significant?" verdict · Discovery: find the sample size where a 2-point difference stops being distinguishable from noise · Initial note: "Two models, two points apart. Now look at the interval."
- `llmContaminationCheck` · Playground · Reused from Chapter 12 with the evaluation framing.

**Figures.** F32.1 the scoring paths for one MMLU question; F32.2 prompt-sensitivity spread; F32.3 contamination pipeline; F32.4 judge bias measurements; F32.5 scores with confidence intervals.

**Outcomes.** E23, A7, O7. **Rows.** §3.M all rows. **Prereqs.** 13, 24. **Words.** 4,600.

---

#### Chapter 33 — Adversaries: Jailbreaks, Injection, and Guardrails *(Mechanism)*

**Blurb.** A model that follows instructions cannot tell whose instructions they are. That single design fact generates the entire security surface: a jailbreak is an instruction that outranks the system prompt, and an injection is an instruction that arrived inside data. You will build both from their mechanisms rather than collecting tricks, then defend — with guardrail models, privilege separation and output filtering — and measure honestly what still gets through, because a defence you have not attacked is a hope.

**Sections.**
1. Why the instruction/data boundary does not exist inside a transformer.
2. **A jailbreak taxonomy with mechanisms**: role-play framing, competing objectives, low-resource languages, encoding, and gradient-found suffixes.
3. **Prompt injection**: direct and indirect, with the agent from Chapter 19 as the victim (P5 traced).
4. Exfiltration paths: tool arguments, markdown image URLs, and the citation channel.
5. **Guardrails**: input and output classifiers, what they cost in latency and false positives, and where to place them.
6. Privilege separation for agents: capability scoping, human confirmation, and the actions that never get automated.
7. Memorization and training-data extraction; membership inference in one page.
8. Watermarking and provenance, briefly.
9. Bias and representational harms: what the mechanism explains and what it does not.
10. Regulation in practice: model cards, disclosure, and the EU AI Act's shape.
11. Red-teaming your own deployment: the suite, the metric, the report.
12. Exercises.

**Machines.**
- `llmInjection` · Simulator · State: an agent with tools, a retrieved document containing an injected instruction · Controls: injection style; guardrail on/off; privilege scope · Output: the agent's transcript, and whether the exfiltration succeeded · Discovery: turn on the output guardrail and find the encoding that still gets past it · Initial note: "Run it undefended first. Watch the agent email your data."
- `llmGuardrailCost` · Tuner · State: a guardrail classifier's threshold · Controls: threshold; traffic mix · Output: attacks blocked, legitimate requests blocked, added latency · Discovery: find the threshold where you block 95% of attacks and 8% of real users, and decide.

**Figures.** F33.1 instruction and data in one stream; F33.2 the jailbreak taxonomy; F33.3 an indirect-injection path; F33.4 guardrail placement; F33.5 the ROC of a guardrail.

**Outcomes.** E26, O9. **Rows.** §3.S all rows; §3.P row 7. **Prereqs.** 19. **Words.** 4,000.

---

#### Chapter 34 — Running It: The LLM Engineer's Handbook *(Practitioner handbook)*

**Blurb.** Everything in this course, rewritten as what you actually do on a Tuesday — and at 3am. What to log, what to alert on, how to account for cost per request when the unit is a token, how to notice that a provider silently changed a model under you, how to version prompts and adapters, and what each of the classic production symptoms actually points at. Every recommendation here is traced back to the mechanism that justifies it, so it is a handbook and not a list of tips.

**Sections.**
1. **Cost accounting**: tokens in, tokens out, cached prefix, thinking tokens — the unit economics of one request, worked.
2. **Observability**: OpenTelemetry GenAI conventions, the spans worth having, and the four numbers on the dashboard.
3. **Drift**: input drift, output drift, and detecting a silently changed model with a canary set.
4. Versioning: prompts, adapters, model checkpoints, and rollback that actually works.
5. Feedback loops: turning thumbs-down into evaluation data without poisoning it.
6. The FTI architecture, and when the boring three-service split is right.
7. **The incident table**: twelve production symptoms — slow first token, throughput collapse at peak, gibberish after a deploy, rising refusals, the bill doubling overnight, a fine-tune that "did nothing", OOM at batch 9, degraded output only for one language, an agent looping, JSON that stopped parsing, a benchmark that fell after quantization, answers that changed with no deploy — each mapped to the chapter that explains it and the command that confirms it.
8. The on-call runbook.
9. Exercises.

**Machines.**
- `llmCostModel` · Tuner · State: a deployment's traffic profile · Controls: QPS, prompt/output lengths, cache hit rate, model choice, quantization, reasoning on/off · Output: cost per 1,000 requests, per month, and the line item that dominates · Discovery: turn reasoning on for 5% of traffic and watch it become 60% of the bill · Initial note: "Set a 2,000-token system prompt. Now turn prefix caching on."
- `llmIncidentTriage` · Comparator · State: twelve symptoms and their evidence · Controls: pick a symptom; reveal the diagnosis and the confirming command · Discovery: diagnose "throughput collapsed at peak" as KV-cache exhaustion rather than a compute limit, from the metrics alone · Initial note: "Read the symptom. Guess the cause before revealing it."

**Figures.** F34.1 the unit economics of one request; F34.2 the span tree of a served request; F34.3 a drift canary over time; F34.4 the FTI split; F34.5 the incident table.

**Outcomes.** O8, O10, A6. **Rows.** §3.T all rows. **Prereqs.** 26, 27, 29, 30, 32, 33. **Words.** 4,200.

---

### Part VI — Build It: PocketLM

Seven chapters, one working language model. Python and PyTorch for Chapters 35–40; **C** for the inference engine in Chapter 41, per the Charter §7 deviation from guide §9 — a parallel Rust or Go track through the training chapters would teach a second framework's API rather than a second view of the machine, while the engine's whole lesson is memory traffic, which Python hides inside BLAS.

Every chapter adds one layer and ends with a test the learner runs. Every design decision is made out loud, names the "real" option it did not take, and points at the chapter that explains it.

#### Chapter 35 — PocketLM: The Tokenizer *(Build it)*

**Builds.** A byte-level BPE tokenizer: merge-table training, encoding, decoding, special tokens, and a chat template renderer.
**Sections.** 1 The design decisions (byte-level, no regex pre-tokenizer at first, then one added and measured). 2 Training the merge table on *The Almanac*. 3 Encoding efficiently: the priority-queue merge loop. 4 Decoding and the invalid-UTF-8 case. 5 Special tokens and the template. 6 What we simplified.
**The test.** A round-trip fuzz over 100,000 random byte strings (decode(encode(x)) == x for every one), plus a merge-table comparison against Hugging Face `tokenizers` trained on the same corpus with the same vocabulary size — the first 500 merges must match.
**Machine.** `llmPocketTokenizer` · Builder · trains on a pasted corpus and shows the learner's own merge table growing beside the reference implementation's.
**Outcomes.** B1. **Prereqs.** 2, 3. **Words.** 3,000.

#### Chapter 36 — PocketLM: Attention and the Block *(Build it)*

**Builds.** Scaled dot-product attention, multi-head attention with a KV cache, the feed-forward network, normalization, and the complete block.
**Sections.** 1 Tensors and shapes, stated once so every later shape is checkable. 2 Single-head attention. 3 Multi-head as a reshape. 4 The causal mask. 5 The KV cache, written now because retro-fitting one is painful. 6 The block assembled. 7 What we simplified.
**The test.** Numerical equivalence against `torch.nn.functional.scaled_dot_product_attention` and a reference block to within 1e-5 on random inputs, including with the cache warm — the cached path must produce identical logits to the uncached path.
**Machine.** `llmPocketShapes` · Inspector · every tensor in the block with its shape, live, as the learner changes the config.
**Outcomes.** B2. **Prereqs.** 5, 6, 8, 35. **Words.** 3,600.

#### Chapter 37 — PocketLM: Pretraining *(Build it)*

**Builds.** The full GPT: embeddings, a stack of blocks, weight tying, the training loop, AdamW, warmup and cosine, gradient clipping, bf16, checkpointing, and sampling.
**Sections.** 1 The model class. 2 The data loader with packing and shift-by-one. 3 The training step. 4 The optimizer and schedule. 5 Checkpointing and resuming (with a deliberate crash and resume). 6 Sampling from your own model. 7 Reading your loss curve. 8 What we simplified.
**The test.** A 24M-parameter model reaches a stated validation loss on *The Almanac* within a stated wall-clock budget on the 16 GB budget machine (and a CPU-only path with a smaller target); the run is resumable — kill it at step 500, resume, and the loss curve must be continuous.
**Machine.** `llmPocketTraining` · Simulator · the learner's own logged run replayed, with the loss-curve gallery from Chapter 13 overlaid for comparison.
**Outcomes.** B3, O1. **Prereqs.** 13, 14, 36. **Words.** 4,000.

#### Chapter 38 — PocketLM: Modern Parts, and the Harness That Judges Them *(Build it)*

**Builds.** RoPE, RMSNorm, SwiGLU and GQA as drop-in replacements — plus the evaluation harness needed to say whether they helped: perplexity on a held-out split, a small benchmark subset, and bootstrap confidence intervals.
**Sections.** 1 Why an ablation without an interval is an anecdote — the harness comes first. 2 RoPE, replacing learned positions. 3 RMSNorm, replacing LayerNorm. 4 SwiGLU, with the ×2/3 width correction so the comparison is parameter-matched. 5 GQA, and the KV bytes it saves measured on your own model. 6 The ablation table, with intervals. 7 What we simplified.
**The test.** Each component can be switched on and off by a config flag; the harness reports every combination with a confidence interval, and the learner must state which differences are real. A component that fails to beat its baseline is reported as such — the chapter's honesty rule.
**Machine.** `llmPocketAblation` · Comparator · the learner's own ablation table against the reference results, with intervals drawn.
**Outcomes.** B4, B9 (harness), A7. **Prereqs.** 7, 8, 32, 37. **Words.** 4,000.

#### Chapter 39 — PocketLM: Loading Real Weights *(Build it)*

**Builds.** A weight loader that maps Hugging Face checkpoints onto PocketLM's modules — GPT-2 124M first, then a small Llama-class model — and proves correctness by matching logits.
**Sections.** 1 What is in a `safetensors` file. 2 The name mapping, and the four transposes that will catch you. 3 Loading GPT-2 and matching logits. 4 The modern model: RoPE parameters, GQA head grouping, tied vs untied embeddings. 5 When the numbers do not match: a debugging procedure that bisects by layer. 6 Generating from real weights with your own code. 7 What we simplified.
**The test.** Maximum absolute logit deviation from the reference implementation below a stated tolerance across 100 prompts, for both models. This is the chapter that proves the implementation is correct rather than merely plausible.
**Machine.** `llmPocketDiff` · Inspector · per-layer activation deviation between the learner's model and the reference, so a mismatch is located rather than hunted.
**Outcomes.** B5, A10. **Prereqs.** 9, 38. **Words.** 3,600.

#### Chapter 40 — PocketLM: LoRA, SFT and DPO From the Loss Up *(Build it)*

**Builds.** The LoRA layer itself, supervised fine-tuning with loss masking, and DPO implemented from its loss function — no `peft`, no `trl`.
**Sections.** 1 The LoRA layer: two matrices, the scaling, the injection points. 2 Freezing the base and counting what is trainable. 3 SFT on *The Almanac*'s instruction pairs, with the loss mask from Chapter 20. 4 Merging the adapter, and proving the merge is equivalent. 5 Preference pairs and the DPO loss, written from Chapter 23's derivation. 6 Training, and reading the margin against both likelihoods. 7 Evaluating with the Chapter 38 harness. 8 What we simplified.
**The test.** Three assertions the learner runs: the merged model produces identical logits to the base-plus-adapter model; SFT measurably improves the instruction-following score on a held-out split with an interval; DPO increases the implicit reward margin on held-out pairs **without** both likelihoods falling — the failure mode from Chapter 23, now guarded by a test.
**Machine.** `llmPocketDpo` · Tuner · the learner's own DPO run, β on a slider, margin and likelihoods plotted together.
**Outcomes.** B6, B7, O3, O4. **Prereqs.** 21, 23, 39. **Words.** 4,200.

#### Chapter 41 — PocketLM-C: The Engine, the Honest Benchmark, and Graduation *(Build it, C)*

**Builds.** A single-file C inference engine for the model you trained: weight loading, a quantized matmul, the KV cache, the sampler, and a token-streaming loop — then the benchmark that compares it honestly with `llama.cpp` and vLLM.
**Sections.** 1 Why C for this layer and only this layer, restated in one paragraph. 2 The file format: your own minimal GGUF-like container, and why. 3 The forward pass in C: memory layout first, arithmetic second. 4 The KV cache as a flat buffer, and the fragmentation you are choosing to accept. 5 A quantized matmul: int8 with per-group scales, and the error measured against the fp32 path. 6 The sampler, matching Chapter 18's semantics exactly. 7 **Measuring your own engine**: tokens per second, arithmetic intensity, and where you sit on Chapter 16's roofline. 8 **The honest benchmark**: PocketLM-C against `llama.cpp` and vLLM on the same model, same hardware, same prompt set, with every condition stated and every place they are not comparable named. 9 **The confession table**: every simplification, with the chapter that holds the real machinery. 10 **Graduation**: three weekend projects — continuous batching, a Metal or CUDA kernel for the matmul, and speculative decoding with your 24M model drafting for a larger one. Ends with "this is early, not wrong".
**The test.** The C engine's output tokens match the Python implementation's greedy output exactly for 50 prompts; the quantized path's perplexity delta against fp32 is reported with an interval; the benchmark script reproduces its own numbers within a stated variance across three runs.
**Machine.** `llmPocketBench` · Comparator · the learner's measured numbers against the reference measurements and the two production engines, with the conditions attached to every bar.
**Outcomes.** B8, B9, E19 (proved by hand), O5, O6. **Prereqs.** 16, 26, 27, 29, 40. **Words.** 5,000.

---

## 3. The capstone plan (guide §9)

| | |
|---|---|
| **What is built** | *PocketLM* — a GPT you train, upgrade, load real weights into, fine-tune, align, and serve from your own C engine |
| **Languages** | Python + PyTorch (Ch 35–40); **C** (Ch 41). The deviation from §9's line-for-line two-language model is declared in the Charter §7 and restated at the head of Part VI |
| **One layer per chapter** | tokenizer → attention and block → pretraining → modern parts + harness → real weights → LoRA/SFT/DPO → C engine |
| **The proof per layer** | round-trip fuzz · numerical equivalence to a torch reference · a target loss reached and a resumable run · an ablation table with confidence intervals · logit matching against Hugging Face · merge equivalence + margin without likelihood collapse · token-for-token match with the Python path |
| **Honest benchmark** | Chapter 41 §8 — PocketLM-C against `llama.cpp` and vLLM, same model, same hardware, same prompts, conditions stated, non-comparabilities named |
| **Confession table** | Chapter 41 §9 — every simplification with the chapter holding the real machinery |
| **Graduation** | Chapter 41 §10 — continuous batching; a GPU kernel for the matmul; speculative decoding using the 24M model as the drafter |

---

## 4. Free chapters

**1, 2 and 5.**

- **Chapter 1** — the orientation, `llmNextToken` and `llmCourseMap`: a visitor sees a real distribution move as they type within thirty seconds.
- **Chapter 2** — tokens, with `llmBpeTrainer`, `llmTokenizerCompare` and `llmVocabTradeoff`: the most shareable machine in the course, and the one that makes a reader realize they did not know how tokenization worked.
- **Chapter 5** — attention, with `llmAttention`: the signature chapter. A visitor who reads this one has seen the house voice do the hardest thing the course does.

That is three chapters, seven machines, and one derivation (√d_k) before the paywall.

---

## 5. Reading map by part

- **Part I** — Vaswani et al. 2017 · Sennrich et al. 2016 (BPE) · Kudo & Richardson 2018 (SentencePiece) · Radford et al. 2019 (GPT-2) · Ahia et al. 2023 and Petrov et al. 2023 (token inflation) · Reimers & Gurevych 2019 (Sentence-BERT) · Kusupati et al. 2022 (Matryoshka) · Press & Wolf 2017 (weight tying) · the `tokenizers` and tiktoken repositories.
- **Part II** — Vaswani et al. 2017 · Su et al. 2021 (RoPE) · Press et al. 2021 (ALiBi) · Chen et al. 2023 (position interpolation) · Peng et al. 2023 (YaRN) · Hsieh et al. 2024 (RULER) · Zhang & Sennrich 2019 (RMSNorm) · Shazeer 2020 (GLU variants) · Xiong et al. 2020 (Pre-LN) · Shazeer 2019 (MQA) · Ainslie et al. 2023 (GQA) · Beltagy et al. 2020 (Longformer) · Xiao et al. 2023 (attention sinks) · Shazeer et al. 2017, Fedus et al. 2021, Jiang et al. 2024 (Mixtral), DeepSeek-V3 report · nostalgebraist (logit lens) · Olsson et al. 2022 (induction heads) · Elhage et al. 2022 (superposition).
- **Part III** — Lee et al. 2021 (deduplication) · the Dolma, The Pile and FineWeb reports · Shumailov et al. 2024 (model collapse) · Loshchilov & Hutter 2017 (AdamW) · Micikevicius et al. 2017 (mixed precision) · Chen et al. 2016 (checkpointing) · McCandlish et al. 2018 (critical batch size) · Hu et al. 2024 (WSD) · Yang et al. 2021 (μP) · Kaplan et al. 2020 · Hoffmann et al. 2022 (Chinchilla) · Sardana et al. 2023 · Wei et al. 2022 and Schaeffer et al. 2023 (emergence) · Williams et al. 2009 (roofline) · Rajbhandari et al. 2020 (ZeRO) · Shoeybi et al. 2019 (Megatron-LM) · Huang et al. 2019 (GPipe) · the FSDP, DeepSpeed and Triton documentation.
- **Part IV** — Holtzman et al. 2019 (nucleus sampling) · the `llama.cpp` GBNF and `llguidance` docs, Outlines, vLLM guided decoding · provider tool-use documentation · the MCP specification · Yao et al. 2022 (ReAct) · Zhou et al. 2023 (LIMA) · Gekhman et al. 2024 (fine-tuning and hallucination) · Hu et al. 2021 (LoRA) · Dettmers et al. 2023 (QLoRA) · Hinton et al. 2015 and Gu et al. 2023 (distillation) · Christiano et al. 2017 · Ouyang et al. 2022 (InstructGPT) · Rafailov et al. 2023 (DPO) · Shao et al. 2024 (GRPO) · Bai et al. 2022 (Constitutional AI) · Wei et al. 2022 (chain-of-thought) · Wang et al. 2022 (self-consistency) · Lightman et al. 2023 (process supervision) · Snell et al. 2024 (test-time compute) · the o1 system card and the DeepSeek-R1 report · the Llama, Qwen, Gemma, Mistral, DeepSeek, Phi and OLMo model cards and licences · Gu & Dao 2023 (Mamba).
- **Part V** — Pope et al. 2022 (efficiently scaling inference) · Kwon et al. 2023 (PagedAttention) · Yu et al. 2022 (Orca, continuous batching) · Dao et al. 2022 and Dao 2023 (FlashAttention 1 and 2) · Leviathan et al. 2022 and Chen et al. 2023 (speculative decoding) · Cai et al. 2024 (Medusa) · Dettmers et al. 2022 (LLM.int8) · Frantar et al. 2022 (GPTQ) · Lin et al. 2023 (AWQ) · the GGUF k-quant documentation · the vLLM, SGLang, TGI, TensorRT-LLM, `llama.cpp` and MLX documentation · Radford et al. 2021 (CLIP) · Dosovitskiy et al. 2020 (ViT) · Li et al. 2023 (BLIP-2) · Liu et al. 2023 (LLaVA) · Hendrycks et al. 2020 (MMLU) · Zhou et al. 2023 (IFEval) · Zheng et al. 2023 (LLM-as-a-judge) · Chiang et al. 2024 (Arena) · `lm-evaluation-harness` · Zou et al. 2023 (adversarial suffixes) · Wei et al. 2023 (jailbreak failure modes) · Greshake et al. 2023 (indirect injection) · Carlini et al. 2021 (extraction) · Kirchenbauer et al. 2023 (watermarking) · OWASP Top 10 for LLM Applications · the OpenTelemetry GenAI semantic conventions · the EU AI Act.
- **Part VI** — Karpathy's nanoGPT and `llama2.c` as the acknowledged ancestors of this capstone's shape · the `safetensors` and GGUF format specifications · `llama.cpp` and vLLM as the benchmark targets.

---

## 6. Coverage check

Every **Core** row of the Phase 2 Topic Universe appears in a chapter's **Rows** line; every **Supporting** row appears in a named section or callout of the chapter listed for its section letter.

Nine rows were orphaned on the first pass and have been placed rather than dropped:

| Orphaned row | Placed in |
|---|---|
| §3.A n-grams → neural → transformers | Ch 5 §1 (the problem attention solves) |
| §3.A masked LMs (BERT family) | Ch 4 §5 (bi-encoders are BERT-shaped) |
| §3.A RNNs and LSTMs | Ch 5 §1 (mentioned, with the pointer) |
| §3.E multi-token prediction | Ch 28 §7 (with self-speculation) |
| §3.E state-space models (Mamba, RWKV) | Ch 25 §6 (a field-guide section of its own) |
| §3.G optimizers past AdamW (Shampoo, Muon) | Ch 14 §1 (mentioned at the end of the lineage) |
| §3.I streaming responses | Ch 30 §1 (the engine request loop) |
| §3.J fine-tuning frameworks (Axolotl, Unsloth, TRL) | Ch 21 §7 (field-guide callout) |
| §3.N CUDA graphs and `torch.compile` | Ch 30 §4 (what compilation buys) |

**Orphan list after placement: empty.**

Outcome coverage: all 41 Charter outcomes (E1–E26, **E27**, A1–A10, O1–O10, B1–B9) appear in at least one chapter's **Outcomes** line. E27 — the outcome Phase 2 proposed — is delivered by Chapter 19.

---

## 7. Shape check against guide §2 and §11

| Element | Target | This course | Note |
|---|---|---|---|
| Parts | 4–6 | 6 | The capstone is its own part, as in *RAG In Depth* |
| Chapters | 24–36 | **41** (34 teaching + 7 capstone) | Declared at the head of this document, with the arithmetic from Phase 2's 108 Core rows |
| Sections per chapter | 4–8 | 5–11 | Chapters 19, 29, 30, 32, 33 and 41 exceed 8; each is a chapter the subject refuses to split cleanly, and each is flagged for the gate below |
| Words per chapter | 1,800–3,500; keystone to 5,000 | 2,600–5,000, median 4,000 | 18 keystone chapters |
| Machines | ≥1 per chapter; keystones 2–3 | **46** across 41 chapters | 5 chapters carry three |
| Static figures | ≥1 per chapter; 2–4 in mechanism chapters | ~110 | 5 per mechanism chapter |
| Free chapters | first 3, chosen to show the machines | 1, 2, 5 | Seven machines before the paywall |
| Capstone | 5–8 chapters, two languages | 7, Python + C | The two-language deviation is declared |
| Field-guide chapters | ≥2 | 2 (Ch 25 models, Ch 30 engines) | |
| Practitioner-handbook chapters | ≥1 | 1 (Ch 34) | |

**Two things the gate should decide, because both are deviations rather than judgment calls:**

1. **41 chapters against the guide's 24–36.** Phase 2 measured 108 Core rows and projected 28–34 teaching chapters; this is 34 teaching plus 7 capstone. The alternative is cutting Core rows, and the four honest candidates are Chapter 11 (interpretability), Chapter 25 (the model field guide), Chapter 31 (multimodality) and Chapter 17 (parallelism) — dropping all four would land at 37 and lose four things the Charter's outcomes currently promise.
2. **Six chapters exceed the 4–8 section range** (19, 29, 30, 32, 33, 41). Each could be split into two, which would take the course to 47. My recommendation is to keep them long rather than to fragment a mechanism across a chapter boundary, but this is the owner's call and it is cheaper to make now than after numbering freezes.

**Gate:** owner approves the parts, the chapter list and the numbering. **On approval, chapter numbers are frozen** — the platform keys progress and links on them. Next: **Phase 4 — chapter production**, one chapter per response, in syllabus order, each against §10 format and the §11.1 checklist.
