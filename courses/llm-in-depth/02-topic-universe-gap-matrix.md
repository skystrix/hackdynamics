# LLM In Depth — Phase 2 Deliverable: Topic Universe and Gap Matrix

**Status:** Phase 2 complete, awaiting owner approval of what is in and what is deliberately out.
**Date:** 2026-09-05. Phase 0 delivered 2026-09-05; Phase 1 (Charter) approved 2026-09-05 with 40 outcomes and the C-for-the-engine capstone decision.

This is the phase that makes "no other course, book or tutorial" (§1) a checkable claim rather than a slogan. The Source Map said what the five books contain. This says what the *subject* contains, by merging the books with what four universities teach, what two textbooks contain, what the three systems people actually run document, and what interviewers actually ask — and then rules every row in or out.

---

## 1. Sources merged (guide §4 Phase 2 requires at least three syllabi, two textbooks, one skill list, two interview banks, and the docs of the key systems)

| Code | Source | Why this one |
|---|---|---|
| **S1–S5** | The five provided books | From the Source Map; S1 (Raschka) and S3 (Iusztin & Labonne) carry the spine |
| **U1** | **Stanford CS336, *Language Modeling from Scratch*, Spring 2025** (Liang, Hashimoto) — tokenization; PyTorch and resource accounting; architectures and hyperparameters; MoE; GPUs; kernels and Triton; parallelism ×2; scaling laws ×2; inference; evaluation; data ×2; alignment SFT/RLHF; alignment RL ×2 | The closest course in the world to this one — build-it-yourself, systems-first. Its five assignments (basics, systems, scaling, data, alignment) are the closest external benchmark for our capstone |
| **U2** | **Princeton COS 597R, *Deep Dive into Large Language Models*, Fall 2024** (Chen, Arora) — pretraining ×2; scaling laws; emergent behavior; data curation; instruction tuning; learning from preferences; alignment; constitutional AI; metacognition; long-context; advanced alignment; reasoning ×2; small models; retrieval-augmented LMs ×2; agents; hardware-aware algorithms; visual grounding | The research-depth view. Supplies the topics a "survey the literature" course insists on: emergence, long context, small models, metacognition |
| **U3** | **CMU 11-667 / 11-766, *Large Language Models: Methods and Applications* → *LLM Applications*, Spring 2026** (Ippolito et al.) — origins; NLU vs NLG; the science of prompting; when and how to finetune efficiently; representations and embeddings; retrieval ×3; deep research; dialogue; tool use and personas; writing assistants; LLMs for evaluation and synthetic data; multi-agent; harms; attacking LLMs; code assistants; image generation; non-English languages; world models; numbers; embodied AI; deployment | The applications and harms view, and the source of several rows nobody else raises: non-English tokenization cost, numeracy, synthetic data, attacks |
| **U4** | **MIT 6.5940, *TinyML and Efficient Deep Learning Computing*, Fall 2024** (Han) — pruning ×2; quantization ×2; NAS ×2; knowledge distillation; TinyEngine; transformer and LLM; efficient LLM deployment; LLM post-training; long-context LLM; distributed training ×2; on-device training | The efficiency and systems view. The only syllabus that gives quantization and distillation two lectures each — and both are Source Map gaps |
| **T1** | **Jurafsky & Martin, *Speech and Language Processing*, 3rd ed. (Aug 19, 2026 draft)** — Vol I: introduction; words and tokens; n-gram LMs; logistic regression; embeddings; neural networks; transformers and pretraining; post-training. Vol II: masked LMs; interpretability; IR and RAG; agents; MT; RNNs and LSTMs; speech | The academic canon, and the reason interpretability and masked models are in this matrix at all |
| **T2** | **Chip Huyen, *AI Engineering* (O'Reilly, 2025)** — foundation models; evaluation methodology; evaluating AI systems; prompt engineering; RAG and agents; finetuning; dataset engineering; inference optimization; architecture and user feedback | The practitioner canon. Its two evaluation chapters and its dataset-engineering chapter are more rigorous than anything in S1–S5 |
| **D1** | **vLLM documentation** — features; deployment; parallelism (context, data, expert); design documents (attention backends, KV-cache management, PagedAttention, automatic prefix caching, CUDA graphs, MoE and attention kernels, torch.compile); benchmarking; quantization schemes | The serving reference. Its *design documents* section is effectively a syllabus for inference internals |
| **D2** | **Hugging Face `transformers` docs + TRL/PEFT + the HF LLM Course** — pipeline, `Trainer` (mixed precision, `torch.compile`, FlashAttention, distributed), `generate` and decoding strategies, quantization backends | The library every learner will actually type. Names the interop surface: Axolotl, Unsloth, DeepSpeed, FSDP, vLLM, SGLang, TGI, llama.cpp, MLX |
| **D3** | **`llama.cpp` documentation** — build and backends; `completions`; `function-calling`; `llguidance` (constrained decoding); `speculative`; `multimodal`; `multi-gpu`; `ops`; model/preset management | The local-inference reference, and independent confirmation that constrained decoding and speculative decoding are production features, not research curiosities |
| **I1** | **Interview bank 1 — `amitshekhariitbhu/ai-engineering-interview-questions`** (15 sections: must-know; LLM fundamentals; prompting; RAG; agents; fine-tuning; embeddings and vector DBs; AI system design; LLMOps; evaluation; safety and ethics; multimodal; infrastructure and scalability; coding; behavioural) | Written explicitly against the AI Engineer / LLM Engineer job description, so it doubles as the job-description skill list §4 asks for |
| **I2** | **Interview bank 2 — InterviewBit, *LLM Interview Questions*** (5 blocks: basics — architecture, attention, tokenization, embeddings, context windows, encoder/decoder families, perplexity, sampling, pretrain vs finetune; GenAI — shot learning, CoT, hallucination, RLHF, agents, function calling, ethics; fine-tuning — data prep, quantization, DPO vs RLHF, catastrophic forgetting, LoRA, QLoRA, PEFT, instruction tuning; RAG; system design — scaling, inference optimization, cost, streaming, KV cache, observability, gateways, guardrails) | The volume bank. Persona B is graded against something very close to this list |

**Certification lists: considered and rejected as a source.** The **Databricks Certified Generative AI Engineer Associate** and the NVIDIA generative-AI associate credential are the two live options. The Databricks exam guide is organized around Databricks products — Vector Search, Model Serving, MLflow, Unity Catalog — so its rows are platform skills, not subject topics, and every subject topic it does contain is already supplied by I1 and I2. Naming it and moving on is the honest handling; §3.7 says a vendor product does not outrank the open standard of the field.

---

## 2. The ruling scale

| Ruling | What it means for Phases 3–4 |
|---|---|
| **Core** | Owns a chapter or a major numbered section. Taught from the mechanism, with a machine, key terms, quiz coverage and an exercise. |
| **Supporting** | Taught properly, but inside another chapter — a section of a mechanism chapter, or a row in a field-guide or practitioner-handbook chapter. |
| **Mentioned** | One or two sentences where it naturally arises, plus a pointer, so the reader recognizes the word in a paper or a model card and knows it was a choice not to go further. |
| **Out** | Deliberately excluded. Every Out row below carries its reason and where the reader should go instead. |

**Books column** uses the Source Map's scale: **D** definitive · **T** taught · **S** surface · **—** absent.

---

## 3. The Topic Universe

### A. Foundations and orientation

| Topic | Books | External demand | Ruling | Spine if not the books |
|---|---|---|---|---|
| What a language model computes: next-token distribution, chain rule over a document | S1 T, T1 | U1, U3, T1, I2 | **Core** | Books |
| From n-grams to neural LMs to transformers: the short history and what each fixed | S1 S, T1 | U3, T1 | **Core** | T1 ch3 |
| Encoder-only, decoder-only, encoder–decoder: three families and what each is for | S1 T, S2 T | T1, I2 | **Core** | Books |
| Masked language models (BERT family) and why they still matter for embeddings and classification | S2 T | T1 ch9, U3 | **Supporting** | T1 |
| RNNs and LSTMs as the thing attention replaced | S1 S | T1 ch14 | **Mentioned** | T1 |
| Emergent abilities, and the argument that they are an artifact of metric choice | — | U2 | **Supporting** | Wei et al. 2022; Schaeffer et al. 2023 |
| The pretraining → post-training → serving lifecycle as the course's map | S3 D, S4 T | U1, T2 | **Core** | Books |
| Open-weights vs API models; licence families and what "open" means | S3 T, S5 T | T2, I1 | **Supporting** | Model licences read directly |

### B. Tokenization

| Topic | Books | External demand | Ruling | Spine if not the books |
|---|---|---|---|---|
| Why tokens exist; characters vs words vs subwords | S1 D, S2 D | U1, T1, I2 | **Core** | Books |
| BPE **training** as an algorithm (merge table construction), not just encoding | S1 T, S2 S | U1 (assignment 1), T1 | **Core** | Sennrich et al. 2016; `tokenizers` docs |
| WordPiece, Unigram/SentencePiece, and how they differ from BPE | S2 T | T1, I2 | **Supporting** | Kudo & Richardson 2018 |
| Byte-level BPE and byte fallback; why GPT-2 tokenizes bytes | S1 T | U1, D2 | **Core** | tiktoken source |
| Vocabulary size as a trade: sequence length vs embedding-table parameters | S1 S, S2 T | U1 | **Core** | U1 lecture 1 |
| Special tokens, and the chat template as part of the model's contract | S3 T | D2, T2 | **Core** | D2 chat-template docs |
| Tokenizer failure modes: numbers and arithmetic, whitespace and code, trailing-space bugs | S2 T | U3 (numbers), I2 | **Core** | U3; measured on real tokenizers |
| Non-English token inflation and its cost and fairness consequences | S2 S | U3 | **Supporting** | Ahia et al. 2023; Petrov et al. 2023 |
| Tokenizer-free and byte-level models | — | U1 | **Mentioned** | Yu et al. 2023 (MegaByte) |

### C. Embeddings and the representation layer

| Topic | Books | External demand | Ruling | Spine if not the books |
|---|---|---|---|---|
| The token embedding matrix; what a vector "means"; the residual stream | S1 D | U1, T1, I2 | **Core** | Books |
| Static vs contextual embeddings | S2 D, T1 | U3, T1, I2 | **Core** | Books |
| Weight tying between input and output embeddings | S1 T | U1 | **Supporting** | Press & Wolf 2017 |
| Bi-encoders and contrastive training (InfoNCE, negatives) | S2 D | U3, I1 | **Core** | S2 ch7 + Reimers & Gurevych 2019 |
| Pooling strategies and normalization | S2 T | I1 | **Supporting** | Books |
| Matryoshka and truncatable embeddings | — | I1 | **Mentioned** | Kusupati et al. 2022 |
| Choosing an embedding model; MTEB and its limits | S2 T | I1 | **Supporting** | MTEB paper |
| Vector similarity: cosine, dot, Euclidean, and when they differ | S2 T | I2 | **Supporting** | Books — *RAG In Depth* owns the retrieval use |

### D. Transformer internals — the keystone

| Topic | Books | External demand | Ruling | Spine if not the books |
|---|---|---|---|---|
| Scaled dot-product attention: Q, K, V as projections; the weighted sum | S1 D | U1, T1, I1, I2 | **Core** | Books |
| Why divide by √d_k — the variance argument, derived | S1 T | I2 | **Core** | Books + Vaswani et al. 2017 |
| Causal masking and why it makes the loss parallel over positions | S1 D | U1, T1 | **Core** | Books |
| Multi-head attention as a reshape, not a loop | S1 D | U1, T1, I2 | **Core** | Books |
| What attention costs: O(n²) time and memory in sequence length | S1 T | U1, U2, U4 | **Core** | Books |
| Positional information: why order must be injected at all | S1 D, T1 | U1, T1 | **Core** | Books |
| Learned absolute and sinusoidal encodings | S1 T | T1 | **Core** | Books |
| **RoPE** as a rotation per 2-D subspace, and why it extrapolates better | — | U1, U2, T1, I1 | **Core** | Su et al. 2021 |
| ALiBi and relative-position schemes | — | U1 | **Supporting** | Press et al. 2021 |
| LayerNorm, and **RMSNorm** as what modern models use instead | S1 D / — | U1, T1 | **Core** | Zhang & Sennrich 2019 |
| Pre-LN vs post-LN and why the field moved | S1 T | U1 | **Core** | Xiong et al. 2020 |
| The feed-forward network, ×4 width, GELU | S1 D | U1, T1 | **Core** | Books |
| **SwiGLU** and gated FFNs | — | U1 | **Core** | Shazeer 2020 |
| Residual connections and the block as a read–modify–write on the stream | S1 D | U1, T1 | **Core** | Books |
| Parameter counting for a given config, by hand | S1 T | U1 (resource accounting) | **Core** | Books + U1 lecture 2 |
| Dropout, and why modern pretraining largely drops it | S1 T | — | **Mentioned** | Books |

### E. Modern architecture variants

| Topic | Books | External demand | Ruling | Spine if not the books |
|---|---|---|---|---|
| **MQA and GQA**, motivated by KV-cache bytes | — | U1, D1, I1 | **Core** | Shazeer 2019; Ainslie et al. 2023 |
| **Mixture of experts**: routing, top-k gating, load-balancing loss, capacity | S5 S (with an unusable statistic) | U1 (a whole lecture), D1 | **Core** | Shazeer 2017; Fedus et al. 2021; Mixtral; DeepSeek-V3 report |
| Active vs total parameters, and what each costs | S5 S | U1, D1 | **Core** | Same |
| Sliding-window, sparse and local attention | — | U1, U2 | **Supporting** | Beltagy et al. 2020; Mistral docs |
| Attention sinks and StreamingLLM | — | U2 | **Mentioned** | Xiao et al. 2023 |
| **Long-context methods**: position interpolation, YaRN, and what actually degrades | — | U2, U4 (a whole lecture), I1 | **Core** | Chen et al. 2023; Peng et al. 2023; RULER |
| Multi-token prediction and other decoding-head variants | — | U1 | **Mentioned** | Gloeckle et al. 2024 |
| State-space models and linear attention (Mamba, RWKV) as the live alternative | S1 S | U2 | **Supporting** | Gu & Dao 2023 |
| Reading an unfamiliar `config.json` and inferring the architecture | — | D2, I1 | **Core** | HF model configs read directly |

### F. Pretraining: the data

| Topic | Books | External demand | Ruling | Spine if not the books |
|---|---|---|---|---|
| What a pretraining corpus is made of; Common Crawl to a token stream | S1 T | U1 (two lectures), U2, T2 | **Core** | Dolma, FineWeb, The Pile papers |
| Filtering, quality classifiers, and language identification | S1 S | U1, U2 | **Core** | FineWeb; Dolma |
| Deduplication (exact, near, MinHash) and what duplicates do to a model | — | U1, U2 | **Core** | Lee et al. 2021 |
| **Decontamination** against evaluation sets | — | U1, U2, T2 | **Core** | U1; contamination literature |
| Data mixtures, curricula and mid-training | — | U1, U2 | **Supporting** | DoReMi; Llama/OLMo reports |
| Synthetic pretraining data, and model collapse as the counter-argument | — | U1, U3 | **Supporting** | Shumailov et al. 2024 |
| Licensing, copyright and consent in training corpora | S4 S, S5 S | U3, T2 | **Supporting** | Public model-card disclosures |
| The data pipeline as engineering: sharding, streaming, formats | S3 T | U1, T2 | **Supporting** | Books + `datasets` docs |

### G. Pretraining: optimization and dynamics

| Topic | Books | External demand | Ruling | Spine if not the books |
|---|---|---|---|---|
| Teacher forcing; cross-entropy over the next token | S1 D | U1, T1 | **Core** | Books |
| Perplexity: definition, and exactly what it fails to measure | S1 D | U1, T1, I2 | **Core** | Books + T2 ch3 |
| Backprop through the block, at the level needed to debug it | S1 T | T1 | **Supporting** | Books |
| AdamW and decoupled weight decay | S1 T | U1 | **Core** | Loshchilov & Hutter 2017 |
| Warmup, cosine, and WSD schedules | S1 T | U1 | **Core** | Hu et al. 2024 (MiniCPM/WSD) |
| Gradient clipping, and the loss spike it exists for | S1 T | U1 | **Core** | Books + PaLM report |
| Mixed precision: fp16, bf16, fp8, and loss scaling | S1 S | U1, U4, D2 | **Core** | Micikevicius et al. 2017; NVIDIA fp8 docs |
| Gradient accumulation and activation checkpointing | S1 T | U1, U4 | **Core** | Chen et al. 2016 |
| Batch size, critical batch size, and the tokens-per-step trade | — | U1 | **Supporting** | McCandlish et al. 2018 |
| μP and hyperparameter transfer across scale | — | U1 | **Mentioned** | Yang et al. 2021 |
| Numerical stability at scale: z-loss, divergence signatures, restarts | — | U1 | **Supporting** | PaLM and OLMo reports |
| Optimizers past AdamW (Shampoo, Muon) | — | U1 | **Mentioned** | Recent reports |
| Reading a loss curve: divergence, LR too high, overfitting, a bad shard | S1 T | U1 | **Core** | Books + measured in the capstone |

### H. Scale: laws, hardware, parallelism

| Topic | Books | External demand | Ruling | Spine if not the books |
|---|---|---|---|---|
| **Scaling laws**: Kaplan, then Chinchilla and compute-optimal allocation | — | U1 (two lectures), U2 | **Core** | Kaplan et al. 2020; Hoffmann et al. 2022 |
| The 6ND FLOP estimate and back-of-envelope training cost | — | U1 | **Core** | U1 resource accounting |
| Inference-aware scaling: why real models are trained past compute-optimal | — | U1 | **Core** | Sardana et al. 2023 |
| The GPU as a machine: SMs, memory hierarchy, HBM bandwidth, the roofline | — | U1 (a whole lecture), U4 | **Core** | Williams et al. 2009; NVIDIA architecture whitepapers |
| Kernels and fusion; Triton as the readable way to write one | — | U1, D1 | **Supporting** | Triton docs; FlashAttention |
| Data parallelism and ZeRO/FSDP stages | S3 S, S5 S | U1 (two lectures), U4, D2 | **Core** | Rajbhandari et al. 2020; FSDP docs |
| Tensor and pipeline parallelism; expert and context parallelism | S5 S | U1, U4, D1 | **Core** | Shoeybi et al. 2019; Huang et al. 2019; D1 |
| Choosing a parallelism strategy from the bottleneck | — | U1, D1 | **Supporting** | D1 deployment docs |
| Communication cost, interconnect, and why topology shows up in the bill | — | U1 | **Mentioned** | Vendor docs |

### I. Decoding and generation control

| Topic | Books | External demand | Ruling | Spine if not the books |
|---|---|---|---|---|
| Greedy decoding and why it is not obviously right | S1 D | T1, I2 | **Core** | Books |
| Temperature, top-k, top-p, min-p; the failure each creates when pushed | S1 D, S2 T | U1, D2, I2 | **Core** | Books + Holtzman et al. 2019 |
| Beam search, and why chat models rarely use it | S1 S, T1 | T1 | **Supporting** | T1 |
| Repetition, presence and frequency penalties | S2 T | D2 | **Supporting** | D2 generation docs |
| Stopping criteria, EOS handling and truncation bugs | S1 T | D2, D3 | **Supporting** | Books + docs |
| Seeds, determinism, and why "same prompt, different answer" is normal | S3 S | D1 | **Supporting** | D1 |
| **Structured output: constrained decoding, grammars, JSON mode** | S4 S | D3 (`llguidance`), D1, T2, I1 | **Core** | `llama.cpp` GBNF; Outlines; vLLM guided decoding |
| Streaming token-by-token, and what it does to a product's latency story | S3 T | I2, D1 | **Supporting** | Books + D1 |
| Logprobs: reading them, and using them for confidence and routing | S2 T | T2 | **Supporting** | Provider docs |

### J. Adaptation: SFT and parameter-efficient fine-tuning

| Topic | Books | External demand | Ruling | Spine if not the books |
|---|---|---|---|---|
| The decision: prompt, RAG, SFT, alignment, or continued pretraining | S3 D, T2 | U3, T2, I1, I2 | **Core** | S3 ch5 + T2 ch7 |
| Supervised fine-tuning: loss masking, packing, epochs | S1 D, S3 D | U1, U2, U4 | **Core** | Books |
| Instruction datasets: sourcing, synthesis, dedup, decontamination | S3 T | U1, U2, T2 ch8 | **Core** | T2 ch8; Alpaca/LIMA/UltraChat/Magpie |
| Chat templates, roles, and what breaks when they are wrong | S3 T | D2 | **Core** | D2 |
| **LoRA**: the low-rank hypothesis, rank, alpha, target modules | S1 D (App. E), S3 D | U3, U4, I1, I2 | **Core** | Hu et al. 2021 + books |
| **QLoRA**: NF4, double quantization, paged optimizers | S3 T | U4, I2 | **Core** | Dettmers et al. 2023 |
| Other PEFT: adapters, prefix/prompt tuning, IA³, DoRA | S3 S | I2 | **Supporting** | PEFT docs |
| Catastrophic forgetting, measured rather than asserted | S3 S | I2 | **Core** | Measured in the course |
| Fine-tuning and hallucination: teaching new facts backfires | S3 T | U2 | **Supporting** | Gekhman et al. 2024 |
| Merging: model soups, SLERP, TIES, DARE | S3 T | — | **Supporting** | S3 + mergekit |
| **Knowledge distillation**: logit-level and sequence-level | S3 S, S4 S | U4 (a whole lecture), U2 (small models) | **Core** | Hinton et al. 2015; Gu et al. 2023 |
| Continued pretraining and domain adaptation | S3 T | U2 | **Supporting** | Books |
| Fine-tuning frameworks: Axolotl, Unsloth, TRL | S3 T | D2 | **Supporting** (field guide) | Docs |

### K. Alignment: learning from preferences

| Topic | Books | External demand | Ruling | Spine if not the books |
|---|---|---|---|---|
| What alignment is trying to fix, and what it cannot | S3 T | U1, U2, T1 ch8 | **Core** | Books |
| Preference data: collection, annotator agreement, cost | S3 T | U2, T2 | **Core** | Books + InstructGPT |
| Reward models: what they are, how they are trained, how they fail | S3 T | U1, U2 | **Core** | Christiano et al. 2017; Ouyang et al. 2022 |
| **RLHF with PPO**: the loop, the KL penalty, why it is fiddly | S3 T | U1 (two lectures), U2, I2 | **Core** | Ouyang et al. 2022 |
| **DPO, derived** from the RLHF objective rather than quoted | S3 T | U1, U2, I2 | **Core** | Rafailov et al. 2023 |
| **GRPO** and group-relative advantage | — | U1 (alignment RL) | **Core** | Shao et al. 2024 |
| Rejection sampling and best-of-n as the cheap baselines | — | U1, U2 | **Supporting** | Books + literature |
| Constitutional AI and RLAIF | S4 S | U2 (a whole lecture) | **Supporting** | Bai et al. 2022 |
| Reward hacking, sycophancy, and length bias, made measurable | — | U1, U2 | **Core** | Measured in the course |
| Alignment tax: what gets worse when a model gets aligned | — | U2 | **Supporting** | InstructGPT |

### L. Reasoning and test-time compute

| Topic | Books | External demand | Ruling | Spine if not the books |
|---|---|---|---|---|
| Chain-of-thought as a prompting result | S2 D, S4 T | U2 (two lectures), U3, I2 | **Core** | Books + Wei et al. 2022 |
| Self-consistency, tree-of-thought and the search family | S2 T, S4 T | U2 | **Supporting** | Books |
| **Reasoning models**: RL on verifiable rewards, long CoT | — | U1, U2 | **Core** | o1 system card; DeepSeek-R1 |
| Process vs outcome reward models | — | U2 | **Core** | Lightman et al. 2023 |
| **Test-time compute** as a scaling axis, and what an answer now costs | — | U1, U2 | **Core** | Snell et al. 2024 |
| Reasoning-model failure modes: overthinking, truncated traces, cost blowouts | — | — | **Supporting** | Measured in the course |
| Metacognition and calibrated uncertainty | — | U2 (a whole lecture) | **Supporting** | U2 reading list |

### M. Evaluation

| Topic | Books | External demand | Ruling | Spine if not the books |
|---|---|---|---|---|
| Why evaluating a generative model is structurally hard | S3 T, T2 | U1, T2 ch3 | **Core** | T2 ch3 |
| Perplexity and likelihood metrics as the floor | S1 D | U1, T1 | **Core** | Books |
| Multiple-choice benchmarks: MMLU, ARC, HellaSwag — and what they measure | S3 T | U1, T2, I1 | **Core** | Hendrycks et al. 2020 |
| Instruction-following and generation benchmarks: IFEval, GSM8K, HumanEval | S3 T | U1, T2 | **Core** | Zhou et al. 2023 |
| Prompt sensitivity and answer-order effects in benchmark scores | — | U1, T2 | **Core** | T2 ch3 |
| **Contamination**: how it happens, how it is detected | — | U1, U2, T2 | **Core** | Contamination literature |
| **LLM-as-a-judge**: position, verbosity and self-preference bias; calibration against humans | S3 T | U3 (a whole lecture), T2 (two chapters), I1 | **Core** | Zheng et al. 2023 |
| Arena and comparative evaluation; Elo and its assumptions | S3 S | T2 | **Supporting** | Chiang et al. 2024 |
| Statistical significance and confidence intervals on scores | — | T2 | **Core** | T2 ch3 |
| Building a task-specific evaluation set and rubric | S3 T | T2 ch4, I1 | **Core** | T2 ch4 |
| Harnesses: `lm-evaluation-harness` and what "reproducing a number" requires | S3 S | U1 | **Supporting** | Harness docs |
| Regression evaluation in CI for a model-backed product | S3 T | T2, I1 | **Supporting** | Books + T2 |

### N. Inference mechanics and optimization

| Topic | Books | External demand | Ruling | Spine if not the books |
|---|---|---|---|---|
| **Prefill vs decode as two different machines** | S3 S | U1, D1, U4 | **Core** | Pope et al. 2022 |
| **The KV cache**: what it stores, its size in bytes, why it bounds batch size | S3 T | U1, D1, U4, I1, I2 | **Core** | Books + D1 design docs |
| **Arithmetic intensity, and why decode is memory-bandwidth-bound** | — (absent from all five) | U1, U4 | **Core** | Williams et al. 2009; Pope et al. 2022 |
| Latency vocabulary: TTFT, TPOT, ITL, throughput, goodput | S3 T, S5 T | D1, T2, I2 | **Core** | D1 benchmarking |
| Static, dynamic and **continuous batching** | S3 T | D1, T2 | **Core** | Yu et al. 2022 (Orca); D1 |
| **PagedAttention** and KV-cache fragmentation | S3 S, S5 T | D1 (design doc), U1 | **Core** | Kwon et al. 2023 |
| **Automatic prefix caching** and prompt caching economics | — | D1, T2 | **Core** | D1; provider caching docs |
| **FlashAttention** as I/O-aware tiling | S3 S | U1, D1, D2 | **Core** | Dao et al. 2022; Dao 2023 |
| **Speculative decoding**, draft models, Medusa, EAGLE | S3 S | D1, D3, U1 | **Core** | Leviathan et al. 2022; Cai et al. 2024 |
| **Quantization**: int8, LLM.int8, GPTQ, AWQ, NF4, GGUF k-quants | S3 T, S5 T | U4 (two lectures), D1, D3, I2 | **Core** | Dettmers 2022/2023; Frantar 2022; Lin 2023 |
| Where quantization error lands, and outlier features | — | U4 | **Core** | Dettmers et al. 2022 |
| KV-cache quantization and eviction | — | D1, U4 | **Supporting** | D1 |
| CUDA graphs, `torch.compile` and kernel fusion at serve time | — | D1, D2 | **Supporting** | D1 design docs |
| Weight/activation sparsity and pruning for LLMs | S4 S | U4 (two lectures) | **Mentioned** | Frantar & Alistarh 2023 (SparseGPT) |
| Neural architecture search | — | U4 (two lectures) | **Out** | — |

### O. Serving, deployment and the field guide

| Topic | Books | External demand | Ruling | Spine if not the books |
|---|---|---|---|---|
| The serving-engine field guide: vLLM, SGLang, TGI, TensorRT-LLM, llama.cpp/Ollama, MLX | S5 D, S3 T | D1, D2, D3 | **Core** (field guide) | Engine docs + S5 ch10 (labelled as the book's own numbers) |
| Deployment shapes: real-time, batch, streaming, on-device | S3 D | U3, U4, T2 | **Core** | S3 ch10 |
| Hardware sizing: which GPU for which model, and the arithmetic that decides | S5 T | U1, U4 | **Core** | Vendor specs + course arithmetic |
| Autoscaling, cold starts and load balancing for token workloads | S3 T | D1, I1 | **Supporting** | Books + D1 |
| Model routing and gateways; cascades from cheap to expensive | S5 T | I2, T2 | **Supporting** | T2 |
| On-device and edge inference; quantized local models | S5 T | U4, D3 | **Supporting** | D3 |
| Multi-GPU serving in practice | S5 S | D1, D3 | **Supporting** | D1, D3 |
| Benchmarking a serving setup honestly | S3 T, S5 T | D1 benchmarking | **Core** | D1 + the capstone |

### P. Agents, tools and protocols

| Topic | Books | External demand | Ruling | Spine if not the books |
|---|---|---|---|---|
| **Function/tool calling**: the wire format and what the model actually emits | S3 S, S4 T | D3 (`function-calling`), T2, U3, I1, I2 | **Core** | Provider tool-use docs + D3 |
| The ReAct loop, and agents as a control loop around a model | S2 T, S4 T | U2, U3, T2 | **Core** | Yao et al. 2022 |
| **MCP and agent-protocol standards** | — | I1, T2 | **Core** | The MCP specification |
| Memory for agents: short-term, long-term, and what it costs | S3 T | U3, T2 | **Supporting** | T2 ch6 |
| Multi-agent systems, and the honest case against them | S4 T, S5 T | U2, U3 | **Supporting** | U2 critical-look reading |
| Agent evaluation beyond task success | — | U2, T2 | **Supporting** | GAIA; τ-bench |
| Sandboxing and permissioning for tool-using models | S4 T | U3, I1 | **Supporting** | OWASP LLM Top 10 |

### Q. Multimodality

| Topic | Books | External demand | Ruling | Spine if not the books |
|---|---|---|---|---|
| CLIP and contrastive image–text training | S2 D | U2, U3 | **Core** | Radford et al. 2021 |
| ViT: images as patch tokens | S2 T | U4 (a whole lecture) | **Core** | Dosovitskiy et al. 2020 |
| Attaching a vision encoder to a decoder: projector and Q-Former | S2 T, S5 T | U2, U3 | **Core** | BLIP-2; LLaVA |
| Multimodal serving in practice | S5 T | D3 (`multimodal`) | **Supporting** | D3 |
| Speech: ASR and TTS as the same trick on another modality | S5 S | T1 ch15–17 | **Mentioned** | Whisper |
| Image *generation* (diffusion) | S5 S | U3, U4 | **Out** | Not a language-model mechanism |

### R. Interpretability

| Topic | Books | External demand | Ruling | Spine if not the books |
|---|---|---|---|---|
| Reading the residual stream: logit lens and probing | — | T1 ch10, U2 | **Supporting** | T1 ch10 |
| Attention heads with identifiable jobs; induction heads | — | T1, U2 | **Supporting** | Olsson et al. 2022 |
| Features, superposition and sparse autoencoders | — | T1 | **Mentioned** | Anthropic interpretability papers |
| Why interpretability is in this course at all: debugging, not philosophy | — | T1, U2 | **Supporting** | — |

### S. Safety and security

| Topic | Books | External demand | Ruling | Spine if not the books |
|---|---|---|---|---|
| **Jailbreak taxonomy with mechanisms**, not a list of tricks | S4 T, S5 T | U3 (a whole lecture), I1 | **Core** | Zou et al. 2023; Wei et al. 2023 |
| **Prompt injection**, direct and indirect | S4 T | U3, I1, T2 | **Core** | Greshake et al. 2023; OWASP LLM Top 10 |
| Guardrails: classifier models, moderation APIs, and their false-positive cost | S3 T, S4 T | I1, I2, T2 | **Core** | Llama Guard; provider docs |
| Data exfiltration and tool-abuse paths in agentic systems | S4 T | I1 | **Supporting** | OWASP |
| Training-data extraction and memorization | — | U3 | **Supporting** | Carlini et al. 2021 |
| Membership inference and privacy | S5 S | U3 | **Mentioned** | Literature |
| Watermarking and provenance | — | U3 | **Mentioned** | Kirchenbauer et al. 2023 |
| Bias, harms and representational failures | S4 T, S5 T | U3 (a whole lecture), T1, I1 | **Supporting** | U3 reading list |
| Regulation and compliance: EU AI Act, model cards, disclosure | S4 T, S5 T | I1 | **Supporting** | Primary regulatory text |

### T. LLMOps, cost and the practitioner handbook

| Topic | Books | External demand | Ruling | Spine if not the books |
|---|---|---|---|---|
| Cost accounting per request: tokens in, tokens out, cache hits | S3 T, S5 T | T2, I2 | **Core** | Books + provider pricing (dated) |
| Observability: traces, token and latency percentiles, OpenTelemetry GenAI conventions | S3 T | T2, I1, I2 | **Core** | OTel semantic conventions |
| Drift: input drift, output drift, and detecting a silent model change | S3 T, S5 T | T2, I1 | **Supporting** | Books |
| User feedback loops and turning them into evaluation data | S3 S | T2 ch10, U3 | **Supporting** | T2 ch10 |
| Experiment tracking and reproducibility for training runs | S3 T | U1 | **Supporting** | Books |
| Model and prompt versioning; rollback | S3 T, S4 T | I1 | **Supporting** | Books |
| The FTI (feature/training/inference) architecture as one way to organize it | S3 D | — | **Supporting** | S3 ch1 |
| Incident patterns: the 2am failures and what each points at | — | — | **Core** (handbook) | Written from the course's own mechanisms |

---

## 4. Deliberately out, with the reason

| Topic | Why out | Where the reader goes instead |
|---|---|---|
| Retrieval mechanics: chunking, inverted indexes, BM25, HNSW, IVF-PQ, rerankers, fusion, GraphRAG, vector databases | Owned by *RAG In Depth*, which teaches all of it at keystone depth. Duplicating it would make two courses that disagree | *RAG In Depth*, named in Chapter 1 and at every boundary |
| Deep research, task-oriented dialogue, writing assistants, code assistants, world models, embodied AI, music, biology (U3's second half) | Applications of the machine, not the machine. The course's bar is mechanism | U3's own reading list, pointed to in the closing chapter |
| Pruning, sparsity and neural architecture search (U4's first half) | Real efficiency techniques, but they are model-compression research that almost no LLM practitioner applies to an LLM in 2026; quantization and distillation are where the field actually went | U4 lectures 3–8, named in the quantization chapter |
| Diffusion models, GANs, point clouds, video (U4, U3) | Different generative family; nothing in the course's spine depends on them | Named once in the multimodal chapter |
| Machine translation, parsing, coreference, discourse, semantic role labelling, sentiment lexicons (T1 Vol III) | Classical NLP. The transformer chapters need none of it | T1 Volume III |
| Speech recognition and text-to-speech as subjects (T1 ch15–17) | One modality too far; the *mechanism* of attaching a modality is taught with vision, and speech is the same trick | Whisper paper, named in the multimodal chapter |
| Quantum machine learning (U4 lectures 22–23) | Not related | — |
| Databricks/Unity Catalog/MLflow-specific workflows | Vendor platform skills; §3.7 puts the open standard first | The Databricks certification, named in §1 |
| Prompt-engineering-as-a-discipline (a chapter of tips) | Prompting is taught where it is mechanism — decoding parameters, chat templates, CoT, structured output, defensive prompting. A tips chapter dates in months | T2 ch5, named in the prompting sections |
| Building a RAG application end to end | Same handoff as row 1 | *RAG In Depth* |

---

## 5. The gap ledger: rows the books cannot carry

**37 Core rows** carry no **D** or **T** from the five books. Grouped by the source that becomes their spine, they collapse into the **32 entries** below — several rows share one spine (the 6ND estimate and inference-aware scaling both sit under scaling laws; data, tensor and pipeline parallelism under one group). Two of the 32 are judgment calls rather than mechanical ones: **the DPO derivation** and **continuous batching** are graded **T** in S3, but S3 gives the recipe and not the mathematics, and the course needs the mathematics. Two of the 37 rows are not in this ledger at all because no external source can supply them — **the incident-pattern handbook** and **reward hacking made measurable** are course-original and get written from our own mechanisms and measurements.

This is the §3.6 list Phase 3 must assign to chapters, and it is the reason this course cannot be an adaptation of five books.

| # | Core topic the books do not carry | Spine |
|---|---|---|
| 1 | RoPE and positional extrapolation | Su et al. 2021; Chen et al. 2023; Peng et al. 2023 |
| 2 | RMSNorm | Zhang & Sennrich 2019 |
| 3 | SwiGLU and gated FFNs | Shazeer 2020 |
| 4 | Pre-LN vs post-LN as a decision | Xiong et al. 2020 |
| 5 | MQA and GQA | Shazeer 2019; Ainslie et al. 2023 |
| 6 | MoE routing, load balancing, capacity | Shazeer 2017; Fedus 2021; Mixtral; DeepSeek-V3 |
| 7 | Long-context extension and what degrades | Chen 2023; Peng 2023; RULER |
| 8 | Scaling laws and compute-optimal training | Kaplan 2020; Hoffmann 2022; Sardana 2023 |
| 9 | The GPU model and the roofline | Williams 2009; vendor whitepapers |
| 10 | Parallelism: ZeRO/FSDP, tensor, pipeline, expert | Rajbhandari 2020; Shoeybi 2019; Huang 2019; D1 |
| 11 | Deduplication and decontamination of pretraining data | Lee et al. 2021; FineWeb; Dolma |
| 12 | Mixed precision including fp8 | Micikevicius 2017; vendor fp8 docs |
| 13 | BPE training as an algorithm | Sennrich 2016; `tokenizers` docs |
| 14 | Constrained decoding and grammars | `llama.cpp` GBNF; Outlines; D1 guided decoding |
| 15 | The DPO derivation | Rafailov et al. 2023 |
| 16 | GRPO | Shao et al. 2024 |
| 17 | Reward hacking as a measurable phenomenon | Course-original measurement |
| 18 | Reasoning models and test-time compute | o1 system card; DeepSeek-R1; Snell 2024; Lightman 2023 |
| 19 | Knowledge distillation | Hinton 2015; Gu 2023 |
| 20 | Arithmetic intensity; why decode is memory-bandwidth-bound | Williams 2009; Pope et al. 2022 |
| 21 | Continuous batching | Yu et al. 2022 (Orca); D1 |
| 22 | PagedAttention | Kwon et al. 2023 |
| 23 | Prefix/prompt caching | D1; provider caching docs |
| 24 | FlashAttention | Dao et al. 2022; Dao 2023 |
| 25 | Speculative decoding | Leviathan 2022; Cai 2024 |
| 26 | Quantization error and outlier features | Dettmers 2022; Frantar 2022; Lin 2023 |
| 27 | Contamination detection | Contamination literature |
| 28 | Statistical significance on benchmark scores | T2 ch3 |
| 29 | LLM-judge bias and calibration | Zheng et al. 2023 |
| 30 | MCP and tool-calling protocols | The MCP specification; provider docs |
| 31 | Jailbreak mechanisms | Zou 2023; Wei 2023; OWASP |
| 32 | Prompt injection | Greshake 2023; OWASP |

**32 first-class non-book spines for the Core rows alone** — the Charter estimated 20–30, so the estimate held, narrowly. The supporting and mentioned rows add roughly 40 more citations, all already listed in Source Map §3.

---

## 6. Counts, and what they imply for Phase 3

| | Count |
|---|---|
| Topic rows in the universe | 188 |
| **Core** | 108 |
| **Supporting** | 64 |
| **Mentioned** | 14 |
| **Out** | 2 rows here + the 10 exclusions in §4 |
| Core rows the five books cannot carry | 37, grouped into 32 spines (§5) |

108 Core rows, at the roughly 3–4 core rows per chapter that *RAG In Depth* settled into, gives **about 28–34 teaching chapters plus a 5–6 chapter capstone** — inside guide §2's 24–36 range and close to *RAG In Depth*'s 36. Sections D (transformer internals), N (inference) and K (alignment) are the three densest and will need two to three chapters each; D and N are the keystone candidates.

Two structural observations for the Blueprint:

- **Section N is the course's differentiator.** Eleven of its fifteen rows are Core, and seven of those eleven are book-gaps. No competing book teaches inference from arithmetic intensity up, and it is the section Persona C is paying for.
- **Section H forces a decision Phase 3 must make explicitly.** The GPU/roofline row is Core because the bandwidth argument in N is unprovable without it — but it is the one place the course teaches hardware rather than language models. It should be one tightly scoped chapter placed immediately before the inference part, not a systems detour early on.

---

## 7. Coverage check: every Charter outcome has topic rows

| Outcomes | Covered by |
|---|---|
| E1–E5 | A (rows 1–3), B (all), C (rows 1–3), D (positional rows) |
| E6–E9 | D (all), E (MQA/GQA, MoE) |
| E10–E11 | F (all), G (all) |
| E12–E13 | H (scaling rows, parallelism rows) |
| E14 | I (all) |
| E15–E16 | J (SFT, LoRA, QLoRA, chat templates, forgetting) |
| E17–E18 | K (all), J (distillation) |
| E19–E22 | N (prefill/decode, KV cache, arithmetic intensity, FlashAttention, speculative, quantization) |
| E23 | M (all) |
| E24 | L (all) |
| E25 | Q (CLIP, ViT, projector) |
| E26 | S (all) |
| A1 | D (parameter counting), N (KV-cache bytes), O (hardware sizing) |
| A2 | H (scaling laws, inference-aware scaling) |
| A3 | J (the decision row) |
| A4 | J (LoRA, QLoRA) |
| A5 | N (all), O (engines, sizing) |
| A6 | B (failure modes), I (decoding), J (chat templates), M |
| A7 | M (prompt sensitivity, contamination, significance) |
| A8 | E (long context), N (KV cache), and the RAG handoff |
| A9 | E (all) |
| A10 | E (reading a config), O (hardware sizing) |
| O1 | G (loss curves), F |
| O2 | J (instruction datasets, chat templates) |
| O3 | J (LoRA/QLoRA, forgetting) |
| O4 | K (DPO, reward hacking) |
| O5 | N (batching, KV cache), O (benchmarking) |
| O6 | N (quantization, error) |
| O7 | M (harnesses, judge, significance, contamination) |
| O8 | T (cost, observability, drift) |
| O9 | S (jailbreaks, injection, guardrails) |
| O10 | O (deployment shapes, engines), T (the handbook) |
| B1 | B (BPE training, byte fallback) |
| B2 | D (all) |
| B3 | G (all), F (data) |
| B4 | D, E (RoPE, RMSNorm, SwiGLU, GQA) |
| B5 | E (reading a config), D |
| B6 | J (LoRA) |
| B7 | K (DPO) |
| B8 | N (all), H (GPU model), O (benchmarking) |
| B9 | M (all) |

No outcome is uncovered, and no Core row is orphaned from an outcome — the two lists were reconciled row by row, which moved **structured output / constrained decoding** from nowhere into Core. It is demanded by `llama.cpp`, vLLM, Huyen and both interview banks, is absent from the Charter's outcomes, and Phase 3 should add an outcome for it rather than teach something no outcome tests. **Proposed addition: E27 — "Explain how constrained decoding forces a model's output to satisfy a grammar or schema, and what it costs."**

---

## 8. Self-check against guide §4 Phase 2

- Merged the five books with **four university syllabi** (three required), **two textbook tables of contents**, **one certification list** (named and rejected, with the reason), **two interview banks**, and the documentation of **three systems** (vLLM, Hugging Face, `llama.cpp`).
- Every row carries a ruling; every **Out** carries a reason and a destination.
- Every **Core** row that the books cannot carry has a named spine — 32 of them, §5.
- Coverage reconciled against all 40 Charter outcomes, and the one gap found is proposed as E27 rather than smuggled in.

**Gate:** owner approves what is in and what is deliberately out — in particular the RAG handoff in §4 row 1, the exclusion of pruning and NAS, the inclusion of a GPU/roofline chapter, and the addition of outcome E27. Next: **Phase 3 — the Course Blueprint** (parts, chapters, sections, machine specs, capstone), which locks numbering.
