# LLM In Depth — Phase 1 Deliverable: Course Charter

**Status:** Phase 1 complete, awaiting owner approval of audience, outcomes, prerequisites, and the track proposal.
**Date:** 2026-09-05. Source Map (Phase 0) delivered 2026-09-05.

**Two Phase 0 questions were not answered separately before this phase started. This Charter proceeds on the recommendations already in the Source Map, and every downstream phase inherits them until the owner says otherwise:**

1. **S4 (*LLM Design Patterns*) and S5 (*LLMs in Enterprise*) are scaffolding, not authority.** They supply topic maps, pattern vocabulary and structure. No code, API detail, or statistic from either enters the course text unless independently re-sourced. S5's Chapter 10 engine benchmarks may be used only when labelled as the book's own measurements.
2. **Track position confirmed as the owner's original brief:** LLM In Depth is the prerequisite for RAG In Depth. §5 makes the boundary explicit in both directions.

---

## 1. Title and one-line promise

**Title:** *LLM In Depth*

**Promise (house voice):** Open the machine that turns a prompt into the next token: how text becomes tokens and tokens become vectors, what attention actually computes and why it is divided by the square root of anything, why the same model costs a fortune to serve and a rounding error to train on one more example, how fine-tuning and preference alignment change a model's behaviour without changing what it knows, and why decoding a token is limited by memory bandwidth rather than arithmetic. Then build one yourself — tokenizer, attention, training loop, LoRA, DPO, and a serving engine in a second language — and benchmark it honestly against the engines people deploy.

**Positioning sentence for the landing card:** Every model card you read assumes you know what RoPE, GQA, RMSNorm and a KV cache are. This course is where you learn them from the mechanism up, by building the model that uses them.

---

## 2. Who it is for

The three Hack Dynamics personas from `marketing/PLAN.md`, re-cut for this subject. Weighting for content decisions: C 45%, B 35%, A 20%, same as the marketing plan.

### Persona C — "Rahul", working engineer (3–8 YOE, backend / platform / SRE / ML-adjacent)
- **Knows now:** Ships features against an LLM API, and possibly runs an open-weights model behind vLLM or Ollama because of cost or data residency. Reads model cards but skips the architecture line. Has heard "quantize it" and "increase the batch size" as folk remedies. Cannot say why the first token is slow and the rest are fast, or why a 7B model in fp16 will not fit in the GPU he was given.
- **Goal:** Own the model layer the way he owns the database layer. Choose a model, a fine-tuning strategy, a quantization and a serving configuration from mechanism and arithmetic, not from benchmarks on someone's blog. Explain the bill.
- **JTBD:** *When the inference bill triples and p95 doubles after a "small" prompt change, help me find which stage of the machine got more expensive, so I can fix that stage instead of buying a bigger GPU.*

### Persona B — "Priya", recent grad / job seeker (0–2 YOE, interviewing for AI-engineer, ML-engineer or backend roles)
- **Knows now:** Has fine-tuned something with a notebook she did not write, and can draw the transformer diagram from memory without being able to say what the arrows carry. Freezes on "why √d_k?", "what does the KV cache store, exactly?", "derive the DPO loss", "what does Chinchilla say?".
- **Goal:** Clear the AI-engineering loop — architecture questions, training and alignment questions, serving and cost design — and carry one real, benchmarked artifact into the interview.
- **JTBD:** *When the interviewer follows up on my answer, help me answer from the mechanism, so I get past round three.*

### Persona A — "Aarav", CS student (3rd/4th year)
- **Knows now:** Linear algebra, some probability, Python, maybe one ML elective in which he trained a CNN. Uses an LLM every day and has never seen inside one.
- **Goal:** Understand the systems and mathematics under "AI" that a placement interview will actually probe; ship the capstone as the project that separates him from the batch that only prompts.
- **JTBD:** *When placement season is six months away, help me build one real thing I can explain end to end, so I stand out.*

---

## 3. Prerequisites (honest and minimal)

| You need | Because | Where to get it if missing |
|---|---|---|
| Comfortable programming in Python | Every example and the primary capstone are Python | Any intro course; the official Python tutorial |
| Willing to read a second systems language (Rust or C) for the serving capstone | §9 of the guide requires two languages; the inference engine is where the memory story becomes visible | The Rust Book chapters 1–10, or K&R chapters 1–6; the capstone teaches what it uses |
| Undergraduate data structures and Big-O | Tokenizer merges, attention cost in n², cache and batching arithmetic | CLRS chapters 1–3; the first weeks of MIT 6.006 |
| Linear algebra: matrix multiply, dot product, norms, softmax, what a projection is | Attention is three projections and a weighted sum; nothing in this course is harder than that, but nothing is easier either | 3Blue1Brown *Essence of Linear Algebra*; Strang MIT 18.06 lectures 1–3 |
| Calculus to the level of a partial derivative and the chain rule | Backpropagation, gradient clipping, why loss spikes | Any single-variable calculus course; 3Blue1Brown *Essence of Calculus* |
| Probability: distributions, expectation, sampling, log-likelihood | Next-token distributions, cross-entropy, perplexity, temperature and top-p | Khan Academy probability; any intro stats course |
| A machine that can run a small model — 8 GB RAM minimum; a 12–16 GB GPU or a free Colab/Kaggle tier for the fine-tuning chapters | The course is run, not watched. Every training chapter is sized to complete on that hardware | Colab free tier, Kaggle T4, or any consumer GPU; CPU-only paths given for the from-scratch chapters |
| **Not required:** PyTorch experience | The course teaches the ~15 PyTorch constructs it uses, where it uses them | Appendix chapter: PyTorch in one sitting |
| **Not required:** a deep-learning course, or having trained a neural network before | Backprop, optimizers and training dynamics are taught in place, at the depth this subject needs and no further | Pointer given in Chapter 1 for readers who want the general ML story |
| **Not required:** *RAG In Depth* or *Databases in Depth* | This course is the earlier one in the track; it explains what it needs about vector similarity in place | — |

---

## 4. Outcomes ("after this course you can…"), each testable

Each outcome maps to at least one chapter in the Blueprint and at least one quiz question or exercise in Phase 6.

### Explain (mechanism from first principles)

- **E1.** Explain what a language model computes — a distribution over the next token, and a document's probability as the chain rule over that distribution — and why everything else in the course is machinery for that one function.
- **E2.** Explain byte-pair encoding: how a tokenizer is *trained*, how it encodes and decodes, what byte fallback is for, and why vocabulary size trades sequence length against embedding-table size.
- **E3.** Predict and explain the classic tokenizer failures — arithmetic on multi-token numbers, whitespace and code indentation, non-English text costing 2–4× the tokens, the trailing-space prompt bug.
- **E4.** Explain the embedding layer and the residual stream: what a token vector is, what each block adds to it, and why weight tying between input and output embeddings works.
- **E5.** Explain why order must be injected and how: learned absolute, sinusoidal, RoPE (as a rotation in each 2-D subspace), ALiBi — and what each one does when the sequence is longer than anything seen in training.
- **E6.** Explain scaled dot-product attention from first principles: queries, keys and values as three projections of the same vector, why the scores are divided by √d_k, what softmax does to them, and what the causal mask enforces.
- **E7.** Explain multi-head attention as a reshape rather than a loop, what different heads specialize in, and why MQA and GQA exist — naming KV-cache bytes as the reason.
- **E8.** Explain the transformer block end to end: residuals, pre-LN vs post-LN and why the field moved, LayerNorm vs RMSNorm, the ×4 feed-forward width, GELU and SwiGLU — and count the parameters of a given configuration by hand.
- **E9.** Explain mixture-of-experts: routing, top-k gating, load-balancing loss, expert capacity, and why active parameters and total parameters are different numbers with different costs.
- **E10.** Explain pretraining: teacher forcing, cross-entropy loss, perplexity and exactly what it does and does not measure, and how a pretraining corpus is built, deduplicated and decontaminated.
- **E11.** Explain the optimization machinery and what each part fixes: AdamW and decoupled weight decay, warmup, cosine and WSD schedules, gradient clipping, mixed precision, gradient accumulation, activation checkpointing.
- **E12.** Explain scaling laws and compute-optimal training: Kaplan to Chinchilla, the 6ND FLOP estimate, and why serving cost pushes real models past the compute-optimal token count.
- **E13.** Explain distributed training well enough to read a config: data, tensor and pipeline parallelism, ZeRO stages, and which one a given bottleneck calls for.
- **E14.** Explain decoding: greedy, beam, temperature, top-k, top-p, min-p, repetition and presence penalties — and which failure mode each parameter creates when pushed.
- **E15.** Explain the fine-tuning family and where each belongs: continued pretraining, supervised fine-tuning, LoRA and QLoRA (rank, alpha, target modules, NF4 and double quantization), and catastrophic forgetting as an observable effect.
- **E16.** Explain why chat templates and special tokens are part of the model's contract, and what breaks when they are wrong.
- **E17.** Explain preference alignment: what a reward model is, the RLHF/PPO loop, the DPO derivation from that loop, GRPO and group-relative advantage, and reward hacking as a measurable phenomenon.
- **E18.** Explain knowledge distillation — logit and sequence-level — and why most small "good" models are distilled rather than trained small.
- **E19.** Explain inference as two different machines: prefill (compute-bound, parallel) and decode (memory-bandwidth-bound, one token at a time), with the arithmetic-intensity argument that proves it.
- **E20.** Explain the KV cache: what it stores, its size in bytes for a given model and context, why it is the binding constraint on batch size, and what PagedAttention does about fragmentation.
- **E21.** Explain FlashAttention as an I/O-aware tiling of the same mathematics, and speculative decoding (draft model, Medusa heads) as trading arithmetic for bandwidth.
- **E22.** Explain quantization: int8, 4-bit, NF4, GPTQ, AWQ, and the GGUF k-quant family — what error each introduces, where in the network it hurts, and what it buys in memory and latency.
- **E23.** Explain evaluation: what MMLU, IFEval, GSM8K, HumanEval and Chatbot Arena each actually measure, how contamination happens, and the known biases of an LLM judge (position, verbosity, self-preference) with the calibration methods for each.
- **E24.** Explain reasoning models and test-time compute: long chain-of-thought, process vs outcome reward models, and what "thinking longer" costs per answer.
- **E25.** Explain how a vision encoder is attached to a decoder — CLIP's contrastive training, ViT patches, a projector or Q-Former — and why that is the same trick every modality reuses.
- **E26.** Explain the safety layer honestly: the jailbreak taxonomy with mechanisms, indirect prompt injection, guardrail models, watermarking, and training-data extraction.

### Analyze (reason about trade-offs on given inputs)

- **A1.** Given a model config (layers, d_model, heads, vocab, context) compute parameter count, per-token KV-cache bytes, and peak memory at a given batch and precision — and say whether it fits the GPU you were given.
- **A2.** Given a training compute budget, choose model size and token count per Chinchilla, then justify deviating from it for an inference-heavy deployment.
- **A3.** Given a task, a data volume and a freshness requirement, choose between prompting, RAG, SFT, preference alignment and continued pretraining — and name the failure each alternative would have produced.
- **A4.** Given a fine-tuning job and a memory budget, choose rank, alpha, target modules and quantization, and predict the memory and quality consequences before running it.
- **A5.** Given latency, throughput and cost targets, choose engine, batching policy, quantization and hardware — and predict where the bottleneck moves next.
- **A6.** Given a bad generation, attribute it to tokenizer, chat template, decoding parameters, context handling, model capability or alignment, using evidence rather than intuition.
- **A7.** Given two benchmark results, decide whether the difference is real — contamination, sample size, prompt sensitivity, judge bias, or a genuine effect.
- **A8.** Given a long-context requirement, decide between a longer-context model, RoPE scaling, retrieval, or fine-tuning, with the cost arithmetic for each.
- **A9.** Compare attention and architecture variants (MHA, MQA, GQA, sliding-window, MoE) against a stated serving constraint and defend the choice.
- **A10.** Read an unfamiliar model card or `config.json` and state what the architecture is, what it will cost to serve, and what it was probably trained for.

### Operate (run, measure, debug, secure the real thing)

- **O1.** Train a small GPT to a target loss on modest hardware, read the loss curve, and diagnose divergence, a learning rate that is too high, and overfitting from their signatures.
- **O2.** Build an instruction dataset: source, deduplicate, decontaminate, format to the model's chat template, and demonstrate that the template choice changes the result.
- **O3.** Fine-tune with LoRA and QLoRA on a real dataset and measure before/after on a fixed harness, including the regression the fine-tune caused elsewhere.
- **O4.** Run DPO on a preference set, and detect reward hacking and degradation rather than trusting the reward curve.
- **O5.** Serve a model with vLLM (and one alternative), and produce the latency–throughput curve: TTFT, TPOT, tokens/second against batch size, with the KV-cache limit visible in the data.
- **O6.** Quantize a model to 4-bit and report the measured quality delta on a fixed evaluation alongside the memory and latency deltas.
- **O7.** Run `lm-evaluation-harness` plus an LLM-judge evaluation, report with confidence intervals, and test for contamination.
- **O8.** Instrument an LLM service: token and cost accounting per request, latency percentiles, refusal and error rates, and drift detection on inputs and outputs.
- **O9.** Red-team your own deployment with a jailbreak and injection suite, add guardrails, and re-measure — reporting what still gets through.
- **O10.** Take an open-weights model from Hugging Face to a running, monitored endpoint on your own machine, and document every decision with its number.

### Build (the capstone)

- **B1.** Implement a BPE tokenizer — training, encoding, decoding, byte fallback — and validate it against a reference implementation on the same corpus.
- **B2.** Implement scaled dot-product attention, multi-head attention with a KV cache, and a complete transformer block, verified numerically against a reference.
- **B3.** Assemble a GPT and pretrain it on a real corpus, reproducing a target loss and perplexity, and sample from it.
- **B4.** Upgrade the model to modern components — RoPE, RMSNorm, SwiGLU, GQA — and ablate each one with a measured result.
- **B5.** Load open weights (a small Llama- or Qwen-class model) into your own implementation and match the reference logits, which proves the implementation is correct rather than merely plausible.
- **B6.** Implement LoRA yourself — the layer, not the library call — and instruction-tune the model with it.
- **B7.** Implement DPO from the loss up and align the model, then evaluate the result against the SFT checkpoint.
- **B8.** Implement an inference engine in the second language: tokenizer, weight loading, quantized matmul, KV cache, sampling — then benchmark it honestly against `llama.cpp` and vLLM with conditions stated.
- **B9.** Implement the evaluation harness that judges all of the above: perplexity, a benchmark subset, an LLM judge, and confidence intervals.

**40 outcomes.** §4 of the guide asks for 15–30; *RAG In Depth* shipped 39 for the same reason this course ships 40 — §1's "no other course, book or tutorial" bar over a subject that spans tokenizer algorithms, transformer mathematics, training dynamics, alignment theory, inference systems and evaluation methodology. Cutting to 30 would mean cutting testable claims, not consolidating them. Flagged here for the gate rather than quietly exceeded.

---

## 5. Track position

`COURSE_PLAN.md` describes the **Database track** (Databases in Depth → Postgres → Redis → Build Your Own DB → SQL Performance → Analytical DBs). *RAG In Depth* opened a second track, **AI Engineering**, and proposed itself as course 01. This Charter revises that: **LLM In Depth becomes AI Engineering 01, and RAG In Depth becomes 02.**

- **Assumes from earlier courses:** nothing. This is the entry point of the track.
- **Later courses assume from it:** tokenization, embeddings, context windows, decoding parameters, fine-tuning, and inference cost arithmetic.

### The boundary with RAG In Depth, in both directions

*RAG In Depth* is already published and its Charter states it assumes nothing. That stays true: **LLM In Depth is a recommended, not required, prerequisite.** The two courses must therefore agree on who owns each shared topic, so that the overlap is a pointer rather than a contradiction.

| Shared topic | Owned by | The other course does |
|---|---|---|
| Tokenization, BPE, token costs | **LLM** | RAG uses token budgets; points back for the algorithm |
| What an embedding is; contrastive training of a bi-encoder | **LLM** (representation and training) | RAG owns *retrieval* use: choosing a model, fine-tuning it on your corpus, MTEB |
| Vector similarity (cosine, dot, Euclidean) | Both, briefly | Neither goes deep; RAG owns it in the retrieval context |
| Chunking, inverted indexes, BM25, HNSW, IVF-PQ, rerankers, fusion, GraphRAG | **RAG** | LLM does not teach these at all; Chapter 1 points to the RAG course |
| Context window: what fits, "lost in the middle", ordering | **LLM** owns the mechanism and the cost; **RAG** owns context assembly from retrieved chunks | Each names the other |
| Hallucination | **LLM** (parametric knowledge, why the mechanism produces it) | RAG owns grounding, citation and refusal |
| Prompt injection | **LLM** (attack mechanism and guardrails) | RAG owns injection carried in retrieved documents |
| Fine-tuning vs RAG as a decision | **LLM** (A3) | RAG restates the decision from the retrieval side (its A8) |
| KV cache, serving, batching, quantization | **LLM** | RAG treats generation latency as a budget line |
| LLM-as-judge and evaluation methodology | **LLM** (judge biases, calibration, benchmarks) | RAG owns the RAG-specific triad and retrieval metrics |
| Agents, tool calling, MCP | **LLM** (the protocol and the mechanism) | RAG owns agentic *retrieval* |

- **Candidate successors** (to be added to `COURSE_PLAN.md` at integration, not decided here): *AI Agents In Depth*, *LLM Inference & Serving In Depth* if the serving material outgrows its chapters here, *Search & Ranking In Depth*.
- **Action at Phase 8:** add the AI Engineering track to `COURSE_PLAN.md` with LLM as 01 and RAG as 02; add the prerequisite line to the RAG landing copy and the "next course" line to this one; add the card to `courses.html` and, if it belongs there, `index.html`.

---

## 6. Where the course rests on primary literature rather than on the provided books (per guide §3.6)

From the Source Map §4 gap list. Roughly a third of the mechanism chapters take their spine from papers and system documentation; each such chapter names its sources in its header comment.

| Area | Provided books | Course will rely on |
|---|---|---|
| Positional encoding: RoPE, ALiBi, long-context extension | Absolute/learned only | Su et al. 2021 (RoFormer); Press et al. 2021 (ALiBi); Chen et al. 2023 (position interpolation); Peng et al. 2023 (YaRN) |
| RMSNorm, SwiGLU, modern block design | Not explained | Zhang & Sennrich 2019; Shazeer 2020 (GLU variants); Touvron et al. 2023 (Llama); Xiong et al. 2020 (Pre-LN) |
| MQA / GQA | Named only | Shazeer 2019 (MQA); Ainslie et al. 2023 (GQA) |
| Mixture of experts | Named only, with an unverifiable statistic (S5) | Shazeer et al. 2017; Fedus et al. 2021 (Switch); Jiang et al. 2024 (Mixtral); DeepSeek-V3 technical report |
| Scaling laws, compute-optimal training | Absent | Kaplan et al. 2020; Hoffmann et al. 2022 (Chinchilla); Sardana et al. 2023 (inference-aware scaling) |
| Distributed training | Named only | Rajbhandari et al. 2020 (ZeRO); Shoeybi et al. 2019 (Megatron-LM); Huang et al. 2019 (GPipe); the DeepSpeed and FSDP docs |
| Tokenizer training as an algorithm | "BPE merges frequent pairs" | Sennrich et al. 2016; Kudo & Richardson 2018 (SentencePiece); the `tokenizers` library docs; the tiktoken repository |
| RLHF, DPO derivation, GRPO | Recipes, not mathematics (S3 is the best of them) | Christiano et al. 2017; Ouyang et al. 2022 (InstructGPT); Rafailov et al. 2023 (DPO); Shao et al. 2024 (GRPO); Bai et al. 2022 (Constitutional AI) |
| Knowledge distillation | Named by four sources, explained by none | Hinton et al. 2015; Gu et al. 2023 (MiniLLM); the Gemma and Llama distillation reports |
| Inference arithmetic; why decode is memory-bandwidth-bound | **Absent from all five books** | Williams et al. 2009 (roofline); Pope et al. 2022 (efficiently scaling inference); Kwon et al. 2023 (PagedAttention); Dao 2023 (FlashAttention-2); vendor bandwidth specifications |
| Speculative decoding | One paragraph | Leviathan et al. 2022; Chen et al. 2023; Cai et al. 2024 (Medusa) |
| Quantization | Worked examples, no error analysis | Dettmers et al. 2022 (LLM.int8), 2023 (QLoRA); Frantar et al. 2022 (GPTQ); Lin et al. 2023 (AWQ); the `llama.cpp` k-quant documentation |
| Evaluation methodology, contamination, judge bias | Benchmarks named, methodology thin | Zheng et al. 2023 (LLM-as-a-judge / MT-Bench); Hendrycks et al. 2020 (MMLU); Zhou et al. 2023 (IFEval); Chiang et al. 2024 (Arena); contamination-detection literature |
| Reasoning models, test-time compute | Absent | The o1 system card; DeepSeek-R1; Snell et al. 2024; Lightman et al. 2023 (process supervision) |
| Tool calling, MCP, agent protocols | Framework recipes | The MCP specification; provider tool-use documentation; Yao et al. 2022 (ReAct) |
| Safety: jailbreak mechanisms, injection, extraction | Lists without mechanisms | OWASP Top 10 for LLM Applications; Zou et al. 2023 (universal adversarial attacks); Greshake et al. 2023; Carlini et al. 2021 (extraction) |

---

## 7. Tool and system decisions proposed for the Blueprint (guide §3.7)

Mechanisms are taught vendor-neutrally. Where the learner runs something:

| Role | Choice | Why |
|---|---|---|
| Language for examples and the primary capstone | Python + PyTorch | Where every model in the field is actually written; the reference for numerical verification |
| Second capstone language | **Rust** (with a C track noted for readers who prefer it) | The serving capstone is about memory and bandwidth; a language without a garbage collector makes that visible. Rust over C for tooling and safety, and because `llama.cpp`-equivalent Rust projects exist to compare against |
| Model family for the from-scratch chapters | GPT-2 small (124M) weights for verification, then a Llama/Qwen-class small model | GPT-2 is the only architecture whose weights everyone can load and check against; the modern model shows what changed and why |
| Models to fine-tune | A 1B–8B open-weights instruct model (Llama, Qwen or Gemma class), sized so QLoRA completes on a 16 GB GPU or a free Colab tier | The prerequisite hardware line has to stay true |
| Tokenizers | `tiktoken` and Hugging Face `tokenizers` for comparison; ours from scratch in the capstone | Build the mechanism, then meet the two implementations in the field |
| Training and fine-tuning libraries | `transformers`, `datasets`, `peft`, `trl`, `bitsandbytes`; Axolotl and Unsloth shown in the field guide | The default stack; the field guide names the wrappers rather than teaching through them |
| Serving | vLLM as the reference; `llama.cpp`/Ollama for local and quantized; TGI and TensorRT-LLM in the field guide | vLLM is where PagedAttention and continuous batching are legible; `llama.cpp` is what people actually run at home |
| Quantization | `bitsandbytes` (NF4), GPTQ and AWQ via their libraries, GGUF via `llama.cpp` | One per family, so the trade-offs are measured rather than described |
| Evaluation | `lm-evaluation-harness` for benchmarks; our own judge harness; Arena and MT-Bench discussed, not run | The de-facto standard, plus the 100 lines everyone should be able to write |
| Experiment tracking | Plain CSV plus one hosted viewer shown (Weights & Biases or MLflow) | The mechanism first; the tool is a convenience |
| Observability in production | OpenTelemetry GenAI semantic conventions; one hosted viewer shown | Vendor-neutral standard first, same as the RAG course |
| Hosted APIs | A provider-agnostic thin client; examples run against Claude and against a local model via Ollama | Same policy as *RAG In Depth*; no single-vendor lock-in in course code |
| Hardware assumption | One consumer GPU or a free notebook tier; CPU-only path for the from-scratch chapters | Persona A and B must be able to run every chapter |

Final choices lock in the Blueprint (Phase 3).

---

## 8. Charter self-check against §11

- 40 outcomes, grouped explain / analyze / operate / build, each an observable action; the overrun on the 15–30 guidance is declared in §4 with its reason.
- Prerequisites minimal, each with a pointer; no earlier course assumed; the hardware prerequisite is stated in numbers because half the outcomes require running something.
- Track position stated, and the two-way boundary with the published *RAG In Depth* written out topic by topic so neither course contradicts the other.
- Primary-literature reliance disclosed per §3.6; tool choices justified per §3.7; the S4/S5 reliability limits carried forward from Phase 0 as a standing constraint.

**Gate:** owner approves audience, outcomes, prerequisites, and the track revision (LLM as AI Engineering 01, RAG as 02). Next: **Phase 2 — Topic Universe and Gap Matrix** (merge the Source Map with at least three named university syllabi, two textbook tables of contents, the documentation of the key systems, and two interview banks; decide core / supporting / mentioned / out per row).
