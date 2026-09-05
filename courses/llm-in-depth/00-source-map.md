# LLM In Depth — Phase 0 Deliverable: Source Map

**Status:** Phase 0 complete, awaiting owner gate ("nothing in the books is missing from the map").
**Date:** 2026-09-05
**Guide:** `COURSE_CREATION_GUIDE.md` §4 Phase 0, §3.1–3.7.
**Track position (owner's brief):** LLM In Depth is to be built as the **prerequisite for RAG In Depth**. That framing is confirmed by the sources — every RAG chapter in every one of these books assumes embeddings, tokenization, context windows, decoding and fine-tuning already understood. Phase 1 will make the dependency explicit in both directions.

**Sources read end to end (5):**

| # | Source | Kind | Tier (§3.1) | Completeness |
|---|---|---|---|---|
| **S1** | *Build a Large Language Model (From Scratch)*, Sebastian Raschka (Manning, 2024) | Book, PDF, 370 pp | 1 | **Complete.** 7 chapters + appendices A–E. The only source in the set that reaches implementation depth. |
| **S2** | *Hands-On Large Language Models*, Jay Alammar & Maarten Grootendorst (O'Reilly) | Book, PDF, 383 pp | 1 | **Early release — 7 chapters only**, with provisional numbering (its "Chapter 1" is "the 2nd chapter of the final book"). The final book's transformer-internals, fine-tuning and quantization chapters are **not in this copy**; they are forward-referenced as Chapters 10/12/13 which do not exist here. |
| **S3** | *LLM Engineer's Handbook*, Paul Iusztin & Maxime Labonne (Packt, 2024) | Book, PDF, 523 pp | 1 | **Complete.** 11 chapters + MLOps appendix. Project-shaped around one worked product ("LLM Twin"). |
| **S4** | *LLM Design Patterns*, Ken Huang et al. (Packt, 2025) | Book, EPUB, 30 chapters | 1 | **Complete** but broad and shallow. **Reliability problems — see the owner note.** |
| **S5** | *LLMs in Enterprise*, Aditya Pandey, Sarthak Chaubey et al. (Packt, 2025) | Book, EPUB, 14 chapters | 1 | **Complete.** Strong on inference engines and multimodality; **many unverifiable statistics — see the owner note.** |

---

## Owner note: what these five books do and do not give us

**They give us, at real depth, exactly one spine: the decoder-only transformer, built and trained by hand (S1), then fine-tuned, aligned, evaluated, optimized and deployed as a production system (S3).** S1 and S3 together are an excellent backbone for roughly two thirds of the course. S2 supplies the applications and representation-model layer (classification, semantic search, clustering, tokenizer comparison, embedding-model training). S5 supplies the best concrete treatment of inference engines and multimodality. S4 supplies a vocabulary and a lifecycle checklist.

**Three things the owner must decide on, because they affect what we can claim:**

1. **S4 has code that does not work and APIs that do not exist.** Chapter 2 calls `GPT4LMHeadModel.from_pretrained("GPT4")` and `GPT4Tokenizer`; Chapter 19's `DPOTrainer` call does not match TRL's signature; there are straightforward typos ("BER" for BERT). Every mechanism S4 names is covered more accurately by S1 or S3. **Recommendation: use S4 as a topic map and a source of pattern vocabulary only, and never cite it for code, numbers or API detail.**

2. **S5 quotes many precise figures with no verifiable citation, and some attributions appear to be fabricated** — e.g. "OpenAI's 2024 technical paper revealed GPT-4's MoE activates ~28% of parameters", "Google DeepMind: modular systems achieve 2.1–3.4× better cost-performance", "IBM Watsonx: 45% cloud cost reduction", "Mayo Clinic federated diagnosis across 37 hospitals". Per §3.3 ("if a fact appears only on a blog or forum, verify it against documentation or source before using it; if it cannot be verified, do not use it"), **none of these numbers may enter the course text unless independently re-sourced.** S5's *ideas* are sound and often the best-organized in the set; its *statistics* are not usable as given. Its Chapter 10 engine benchmarks are the one place where the numbers are at least internally consistent and reproducible in principle, and even those must be marked as the book's own measurements.

3. **§3.6 applies: the provided books are thin exactly where a "no other material needed" LLM course must be deepest.** They do not explain, at mechanism depth: **RoPE and modern positional encodings, RMSNorm, SwiGLU, grouped-query and multi-query attention, MoE routing and load balancing, compute-optimal scaling (Chinchilla), the KV-cache and attention arithmetic beyond one formula, the mathematics of RLHF/DPO/GRPO, knowledge distillation, long-context methods, tokenizer training algorithms beyond "BPE merges frequent pairs", reasoning models and test-time compute, or modern tool-calling and agent protocols.** Several of these are named in passing and never opened; the rest are absent entirely. **Phase 2 must source these from primary papers and system documentation (tiers 2–3), which will then be listed in the Blueprint as first-class sources.** §6 below is the candidate gap list.

Source files live in `resources/LLM_In_Depth/`, not `pdfs/llm-in-depth/` as §10.4 prescribes; move or symlink at integration.

---

## 1. Per-source tables (§3.2 granularity)

The full working notes, with every section, named idea, number, exercise and figure captured per chapter, are reproduced below source by source.

# S1 — Raschka, *Build a Large Language Model (From Scratch)* (Manning, 2024/25). 370 pp, 7 ch + apps A–E.

## Ch 1 · Understanding large language models (p23–38)
| Section | Topics | Named ideas (origin) | Numbers (condition) | Exercises | Figures |
|---|---|---|---|---|---|
| 1.1 What is an LLM | LLM = deep NN for understanding/generating text; "large" = params + data; next-word prediction as the training task; AI ⊃ ML ⊃ DL ⊃ LLM; GenAI; DL removes manual feature extraction | generative AI / GenAI | "tens or hundreds of billions of params" | — | Fig 1.1 AI/ML/DL/LLM nesting |
| 1.2 Applications | translation, generation, sentiment, summarization, code, chatbots, knowledge retrieval in medicine/law | — | — | — | Fig 1.2 ChatGPT screenshot |
| 1.3 Stages of building/using | pretraining → fine-tuning; raw/unlabeled text; **self-supervised learning** (labels from data); base/foundation model; instruction FT vs classification FT; why custom LLMs (privacy, on-device, latency, control) | BloombergGPT (finance); InstructGPT (OpenAI, arXiv 2203.02155) | GPT-3 pretraining cost **est. $4.6M** in cloud credits | — | Fig 1.3 pretrain→finetune |
| 1.4 Transformer architecture | encoder/decoder submodules; self-attention; BERT (encoder, masked-word prediction) vs GPT (decoder, generative); zero-shot vs few-shot | **"Attention Is All You Need", Vaswani et al. 2017, arXiv 1706.03762**; BERT; GPT | original transformer repeats enc/dec blocks **6×** | — | Fig 1.4 transformer for translation; Fig 1.5 BERT vs GPT; Fig 1.6 zero/few-shot |
| 1.5 Large datasets | GPT-3 pretraining mix; token defined; Dolma as open substitute | Dolma (Soldaini et al. 2024, arXiv 2402.00159); LLaMA data (Arxiv 92 GB, StackExchange 78 GB) | **GPT-3 table 1.1**: CommonCrawl 410B tok/60%, WebText2 19B/22%, Books1 12B/8%, Books2 55B/8%, Wikipedia 3B/3%; subsets total 499B but model trained on **300B**; CommonCrawl ≈ **570 GB** | — | Table 1.1 |
| 1.6 GPT architecture | decoder-only; autoregressive; emergent behavior (translation without being trained for it) | GPT paper: Radford et al., "Improving Language Understanding by Generative Pre-Training"; emergent behavior | **GPT-3: 96 transformer layers, 175B params** | — | Fig 1.7 next-word prediction; Fig 1.8 iterative decoding |
| 1.7 Building an LLM | 3 stages: data+attention+architecture → pretrain → fine-tune (classifier / assistant) | — | — | — | Fig 1.9 the 3-stage roadmap (recurs in every chapter) |

**Sidebar worth stealing:** "Transformers vs LLMs" — not all transformers are LLMs (vision), not all LLMs are transformers (recurrent/conv variants for efficiency).
**Subtle/misunderstood:** "understand" ≠ consciousness; self-supervised ≠ unsupervised; GPT-3 trained on 300B of 499B tokens and the paper never says why.

## Ch 2 · Working with text data (p39–71)
| Section | Topics | Named ideas | Numbers | Exercises | Figures |
|---|---|---|---|---|---|
| 2.1 Word embeddings | why text must become continuous vectors; embedding = map from discrete objects to a continuous space; word vs sentence/doc embeddings (latter for RAG, declared out of scope); LLMs learn their own embedding layer instead of using Word2Vec | **Word2Vec** (predict context from word / word from context) | GPT-2 smallest (117M/125M) **d=768**; GPT-3 175B **d=12,288** | — | Fig 2.2 embedding models per modality; Fig 2.3 2-D word embedding scatter (birds cluster) |
| 2.2 Tokenizing text | regex tokenizer built up step by step; whitespace keep-or-drop trade-off (code needs indentation); case preserved so proper nouns survive | — | "The Verdict" (Edith Wharton, public domain) = **20,479 chars → 4,690 tokens** (whitespace-free regex tokenizer) | — | Fig 2.4 pipeline position; Fig 2.5 10 tokens |
| 2.3 Tokens → token IDs | vocabulary = unique tokens sorted, mapped to ints; `SimpleTokenizerV1` encode/decode; inverse vocab | — | vocab of The Verdict = **1,130** | — | Figs 2.6–2.8 vocab build, encode, encode/decode pair |
| 2.4 Special context tokens | `<\|unk\|>`, `<\|endoftext\|>`; `[BOS]`, `[EOS]`, `[PAD]`; GPT uses only `<\|endoftext\|>` (also as pad, because padding is masked anyway) | — | vocab grows 1,130 → **1,132** | — | Fig 2.9 vocab extension; Fig 2.10 endoftext between documents |
| 2.5 Byte pair encoding | BPE handles OOV by falling back to subwords/characters; builds vocab by iteratively merging frequent pairs under a frequency cutoff; uses `tiktoken` (Rust) | **BPE**; tiktoken 0.7.0 | GPT-2/3 BPE vocab **50,257**; `<\|endoftext\|>` = ID **50256**; "Akwirw ier" → 33901,86,343,86,220,959 | **Ex 2.1** BPE-encode "Akwirw ier" and decode each ID | Fig 2.11 subword fallback |
| 2.6 Sliding window sampling | input/target pairs = inputs shifted by one; `GPTDatasetV1` + `create_dataloader_v1`; stride controls overlap; stride = window ⇒ no overlap ⇒ less overfitting; `drop_last=True` prevents loss spikes | — | The Verdict = **5,145 BPE tokens**; demo context_size 4; "common to train with input sizes of at least 256" | **Ex 2.2** rerun with max_length/stride 2/2 and 8/2 | Figs 2.12–2.14 next-word targets, x/y tensors, stride 1 vs 4 |
| 2.7 Token embeddings | `nn.Embedding` = lookup of a row from a weight matrix; equivalent to one-hot × dense layer but cheaper; weights random at init, trained by backprop | — | toy: vocab 6, d=3; real: vocab 50,257, d=256 → batch 8×4×256 | — | Figs 2.15–2.17 lookup, same ID→same vector |
| 2.8 Positional embeddings | self-attention is position-agnostic; **absolute** vs **relative** positional embeddings; GPT learns absolute ones (original transformer used fixed encodings); added, not concatenated | — | pos embedding 4×256 broadcast over 8 batches | — | Figs 2.18–2.19 pos added to token emb; full input pipeline |

**Subtle/misunderstood:** the embedding layer IS one-hot + matmul; positional info must be injected because attention has no order; relative embeddings generalize to unseen lengths.

## Ch 3 · Coding attention mechanisms (p72–113) — KEYSTONE
Four variants built in order: simplified self-attention → self-attention with trainable weights → causal attention → multi-head attention (Fig 3.2 is the spine of the chapter).

| Section | Topics | Named ideas (origin) | Numbers | Exercises | Figures |
|---|---|---|---|---|---|
| 3.1 Problem with long sequences | word-by-word translation fails (German→English reordering); encoder–decoder RNN; the single hidden state as a bottleneck; decoder cannot reach back into earlier encoder states | RNN encoder–decoder | — | — | Fig 3.3 word-by-word translation is wrong; Fig 3.4 RNN hidden-state bottleneck |
| 3.2 Attention for data dependencies | attention lets the decoder selectively reach every input token; self-attention drops the RNN entirely | **Bahdanau attention, 2014**; transformer 3 years later | — | — | Fig 3.5 dotted-line widths = attention weights |
| 3.3.1 Simplified self-attention | context vector = "enriched embedding"; attention **scores** = dot products of query with every input; normalize → attention **weights** (sum 1); context vector = weighted sum of inputs; why softmax over plain /sum (positivity, extreme values, gradients) | dot product as similarity measure | toy input 6 tokens × d=3 ("Your journey starts with one step"); scores for x²: [0.9544,1.4950,1.4754,0.8434,0.7070,1.0865]; weights [0.1385,0.2379,…]; z² = [0.4419,0.6515,0.5683] | — | Figs 3.7–3.10 (score → weight → context vector), 3.11 full 6×6 weight matrix, 3.12 three steps |
| 3.3.2 All tokens at once | for-loops → `inputs @ inputs.T`; softmax `dim=-1` rows sum to 1; all context vectors = `attn_weights @ inputs` | — | 6×6 score matrix printed in full | — | Fig 3.12 |
| 3.4.1 Trainable weights | Wq/Wk/Wv project inputs into query/key/value; **scaled dot-product attention**: divide scores by √d_k; the reason: large dot products push softmax toward a step function → vanishing gradients; weight *parameters* vs attention *weights* (a real confusion); Q/K/V named after database retrieval | **scaled dot-product attention**; K/Q/V borrowed from information retrieval | d_in=3, d_out=2 demo; ω₂₂ = 1.8524; weights [0.1500,0.2264,…]; z² = [0.3061,0.8210]; "embedding dim typically >1,000 for GPT-like LLMs" | **Ex 3.1** transfer weights from SelfAttention_v2 to v1 (nn.Linear stores W transposed) | Figs 3.14–3.17 q/k/v projection, score, weight, context vector; Fig 3.18 full matrix view |
| 3.4.2 Compact class | `SelfAttention_v1` (nn.Parameter) vs `v2` (nn.Linear, better init, bias off); different outputs purely from initialization | — | — | — | — |
| 3.5.1 Causal mask | mask future tokens; two routes: (a) softmax → zero above diagonal → renormalize rows, (b) fill scores above diagonal with −inf → softmax once (e^−∞ → 0); **information-leakage sidebar**: renormalizing after masking is mathematically identical to a softmax over the unmasked subset | causal / masked attention | masked-normalized rows printed; row 2 = [0.5517,0.4483,0,…] | — | Fig 3.19 masked weight matrix; Figs 3.20, 3.21 the two routes |
| 3.5.2 Dropout on attention | dropout only during training; applied either after weights or after values (book uses after weights); surviving weights scaled by 1/(1−p) to keep the expected sum | dropout | demo rate **0.5** (scale ×2); "we will use 0.1 or 0.2 when training"; PyTorch dropout RNG differs across OSes (issue #121595) | — | Fig 3.22 dropout on top of causal mask |
| 3.5.3 CausalAttention class | batched input (b, num_tokens, d_in); `register_buffer` so the mask moves with `.to(device)`; in-place `masked_fill_` | — | batch 2×6×3 → out 2×6×2 | — | Fig 3.23 progress map |
| 3.6.1 Stacking heads | `MultiHeadAttentionWrapper` = ModuleList of CausalAttention, outputs concatenated; final dim = d_out × num_heads | multi-head attention | 2 heads × d_out 2 → 4-dim context vectors | **Ex 3.2** get 2-dim output while keeping num_heads=2 | Figs 3.24, 3.25 stacked heads and concatenation |
| 3.6.2 Weight splits | one big W per role, then `.view` + `.transpose` to (b, num_heads, num_tokens, head_dim); batched matmul does all heads at once; `out_proj` linear after concat (common, not strictly required); head_dim = d_out / num_heads, assert divisibility | — | **GPT-2 small: 12 heads, d=768, context 1,024**; **GPT-2 XL (1.5B): 25 heads, d=1,600**; in GPT d_in = d_out | **Ex 3.3** build a GPT-2-small-sized MHA (12 heads, 768 d, 1024 ctx) | Fig 3.26 one big Wq split vs two separate Wq |

**Subtle/misunderstood (callout material):** the "self" in self-attention (within one sequence vs across two sequences); weight parameters ≠ attention weights; why √d_k and not d_k; masking + renormalizing leaks nothing; dropout scaling keeps train/inference consistent; the efficient MHA is the same math as the naive one, one matmul instead of h.

## Ch 4 · Implementing a GPT model from scratch (p114–149) — KEYSTONE
Build order (Fig 4.3): GPT backbone placeholder → LayerNorm → GELU → FeedForward → shortcut connections → TransformerBlock → full GPT.

| Section | Topics | Named ideas | Numbers | Exercises | Figures |
|---|---|---|---|---|---|
| 4.1 LLM architecture | `GPT_CONFIG_124M` dict as the contract; DummyGPTModel to see the shape of the whole thing; logits = (batch, tokens, vocab) | GPT-2 paper: **Radford et al., "Language Models Are Unsupervised Multitask Learners"** (117M in the paper was later corrected to 124M) | **vocab 50,257 · ctx 1,024 · d 768 · 12 heads · 12 layers · dropout 0.1 · qkv_bias False**; other GPT-2 sizes 345/762/1,542M; a 2,048×2,048 layer = 4,194,304 params; **GPT-3 = same architecture, 175B params**; Lambda Labs: **355 years to train GPT-3 on one V100, 665 on an RTX 8000** | — | Fig 4.2 GPT top-down; Fig 4.3 build order; Fig 4.4 data in/out |
| 4.2 Layer normalization | mean 0 / variance 1 across the **feature** dimension; trainable `scale` and `shift`; eps against divide-by-zero; `dim=-1` explained; **biased variance (unbiased=False)** for GPT-2/TensorFlow compatibility; **LayerNorm vs BatchNorm**: LN is independent of batch size, so it survives small batches and distributed training | layer normalization; Bessel's correction | eps 1e-5; toy 2×5 input; normalized mean ≈ −5.96e-08 (float32 reality) | — | Fig 4.5 before/after normalization; Fig 4.6 the `dim` argument |
| 4.3 GELU + FeedForward | ReLU vs **GELU** (smooth, non-zero gradient for negatives except ≈ −0.75); exact GELU = x·Φ(x), GPT-2 uses the tanh curve-fit approximation; FFN = Linear(d→4d) → GELU → Linear(4d→d); why expand-then-contract; same in/out dim so blocks stack | **GELU** (Gaussian error linear unit); **SwiGLU** (Swish-gated linear unit) named as the modern alternative | 768 → **3,072** → 768 (×4 expansion); approximation constant 0.044715 | — | Fig 4.8 GELU vs ReLU plot; Figs 4.9, 4.10 expansion/contraction |
| 4.4 Shortcut connections | vanishing gradients demonstrated numerically on a 5-layer net; shortcut = add input to output; from ResNets in vision | residual / skip / shortcut connections (residual networks) | **without shortcuts** layer grads 0.0002 → 0.0050 (early layers vanish); **with** 0.22, 0.21, 0.33, 0.27, 1.33 | — | Fig 4.12 side-by-side gradient values |
| 4.5 Transformer block | MHA + FFN, each wrapped in LayerNorm → sublayer → dropout → residual add; **Pre-LayerNorm** (GPT-2, better dynamics) vs **Post-LayerNorm** (original transformer); attention mixes across positions, FFN transforms each position independently; shape preserved in = out | Pre-LN vs Post-LN | in 2×4×768 → out 2×4×768 | — | Fig 4.13 the block, annotated |
| 4.6 Coding the GPT model | assemble: tok_emb + pos_emb → dropout → 12 blocks → final LayerNorm → linear head to vocab; parameter counting with `numel()`; **weight tying** (GPT-2 reuses the token-embedding matrix as the output head) | **weight tying** | **163,009,536 params** as built; **124,412,160** with weight tying (= "GPT-2 small"); tok_emb and out_head both 50,257×768; **621.83 MB** at fp32 (4 bytes/param); largest GPT-2 repeats the block **48×** | **Ex 4.1** compare param counts of FFN vs MHA; **Ex 4.2** configure GPT-2 medium (1024 d, 24 layers, 16 heads), large (1280, 36, 20), XL (1600, 48, 25) and count params | Fig 4.15 the full architecture |
| 4.7 Generating text | the autoregressive loop: crop to context → forward → take last position's logits → softmax → argmax → append; **greedy decoding**; softmax before argmax is mathematically redundant (monotonic) but shown for intuition; untrained model emits gibberish | greedy decoding | "Hello, I am" → [15496,11,314,716]; 6 new tokens; output "Hello, I am Featureiman Byeswickattribute argue" (untrained) | **Ex 4.3** separate dropout rates for embedding / shortcut / attention | Figs 4.16–4.18 the generation loop, one step in detail, six iterations |

**Subtle/misunderstood:** 163M vs 124M is entirely weight tying; author notes untied layers train better in his experience, and modern LLMs untie; softmax→argmax is redundant; layer norm normalizes features not batch; Pre-LN vs Post-LN is a real historical fork.

## Ch 5 · Pretraining on unlabeled data (p150–189) — KEYSTONE
Seven steps (Fig 5.2): text generation → text evaluation → train/val losses → training loop → decoding strategies → save/load → load OpenAI weights.

| Section | Topics | Named ideas | Numbers | Exercises | Figures |
|---|---|---|---|---|---|
| 5.1.1 Generate text | `text_to_token_ids` / `token_ids_to_text`; context shortened 1,024 → **256** so the whole chapter runs on a laptop | — | untrained output: "Every effort moves you rentingetic wasn? refres RexMeCHicular stren" | — | Fig 5.3 encode → logits → decode |
| 5.1.2 Text-generation loss | probability of the *target* token as the thing to maximize; log probabilities → average → negate = **cross entropy**; PyTorch `cross_entropy` does all six steps; flatten (b,t,v)→(b·t,v); **perplexity = exp(loss)**, read as "the model is unsure among N tokens" | cross entropy loss; backpropagation; **perplexity** | untrained target probabilities ≈ 7.45e-05 …; log probs ≈ −9.5…−12.3; mean −10.7940 → **loss 10.7940**; **perplexity 48,725.82** (vocab 50,257 → random ≈ 1/50,257 ≈ 0.00002) | — | Figs 5.4, 5.6, 5.7 (the six-step loss ladder) |
| 5.1.3 Train/val losses | 90/10 split; `calc_loss_batch` / `calc_loss_loader`; `num_batches` to sample a subset; device handling; **cost sidebar** | — | The Verdict 20,479 chars / **5,145 tokens**; batch 2 × 256; **9 training batches, 1 validation batch**; initial train loss **10.99**, val **10.98**; "batch sizes of 1,024 or larger are not uncommon"; **Llama 2 7B: 184,320 A100-GPU-hours over 2T tokens ≈ $690,000** at ~$30/h for 8×A100 | — | Figs 5.8, 5.9 (split → tokenize → chunk → batch) |
| 5.2 Training an LLM | the 8-step PyTorch loop (epoch → batch → zero_grad → loss → backward → step → evaluate → sample); `evaluate_model` toggles `.eval()`/`.train()`; **AdamW** and decoupled weight decay; overfitting made visible; memorization verified by grepping the source text | **AdamW**; epoch; overfitting | lr **0.0004**, weight_decay **0.1**, 10 epochs, eval_freq 5; **~5 minutes on a MacBook Air**; train loss 9.781 → **0.391**, val 9.933 → **6.452** (diverges after **epoch 2**); Project Gutenberg alternative: **60,000+ public-domain books** | — | Fig 5.11 the training loop; Fig 5.12 train/val divergence |
| 5.3 Decoding strategies | greedy decoding is deterministic; `torch.multinomial` samples proportionally; **temperature scaling** = divide logits by T (T<1 sharpens, T>1 flattens); **top-k** masks all but k logits to −inf before softmax (same trick as the causal mask); combined `generate()` with `eos_id` early stop | temperature scaling; top-k sampling; greedy decoding | 9-token toy vocab; logits [4.51,0.89,−1.90,6.75,…]; 1,000 samples → forward 582, toward 343, closer 73, inches 2; T = 0.1 ≈ argmax, T = 5 gives "pizza" ≈ 4%; top-k=3 → probs [0.0615, 0.5775, 0.3610]; final demo top_k=25, T=1.4 | **5.1** sampling frequency of "pizza" at each temperature; **5.2** when do low vs high T/top-k suit an application; **5.3** which settings make `generate` deterministic | Fig 5.14 temperature bars; Fig 5.15 top-k masking |
| 5.4 Save/load weights | `state_dict` + `torch.save`; `.eval()` disables dropout for inference; **save the optimizer state too** — AdamW carries per-parameter history and resetting it can break convergence | — | — | **5.4** reload model+optimizer in a new session and train one more epoch | Fig 5.16 |
| 5.5 Loading OpenAI weights | download GPT-2 checkpoints (TensorFlow format); `settings`/`params` dicts; `assign()` guards shape mismatches; `np.split` unpacks the fused `c_attn` QKV matrix; OpenAI **used qkv bias** (modern LLMs don't) and **weight tying** (`out_head.weight = wte`); a single wrong mapping shows up as incoherent text | weight tying (again) | GPT-2 sizes **124M / 355M / 774M / 1558M**; layers 12/24/36/48, heads 12/16/20/25, d 768/1024/1280/1600; checkpoint download 498 MB; settings {n_vocab 50257, n_ctx 1024, n_embd 768, n_head 12, n_layer 12}; wte shape (50257, 768); output with real weights: "Every effort moves you toward finding an ideal new way to practice something!" | **5.5** compute train/val loss with the pretrained weights; **5.6** compare 124M vs 1558M output | Fig 5.17 the four GPT-2 sizes on one diagram |

**Subtle/misunderstood:** "cross entropy" and "negative average log probability" are the same thing here; perplexity is the interpretable form; validation loss rising while training loss falls is the definition of overfitting; greedy decoding memorizes, sampling does not; the optimizer state is part of a checkpoint.

## Ch 6 · Fine-tuning for classification (p191–224)
Three stages (Fig 6.4): dataset prep (1–3) → model setup (4–7) → fine-tune and use (8–10).

| Section | Topics | Named ideas | Numbers | Exercises | Figures |
|---|---|---|---|---|---|
| 6.1 Categories of fine-tuning | **instruction** vs **classification** fine-tuning; a classifier can only emit classes it saw; choosing between them (versatility vs data/compute cost) | — | — | — | Figs 6.2, 6.3 |
| 6.2 Preparing the dataset | UCI SMS Spam Collection; class imbalance handled by **undersampling** to a balanced set; label mapping ham/spam → 0/1; 70/10/20 split | — | **5,572 rows**; ham **4,825** vs spam **747** → balanced **747 + 747**; splits 70 % / 10 % / 20 % | — | Fig 6.5 |
| 6.3 Data loaders | variable-length messages: truncate-to-shortest vs **pad-to-longest** (chosen); pad token = `<\|endoftext\|>` = **50256**; val/test padded to the *training* max length | padding token | longest training message **120 tokens**; batch 8 → (8, 120) inputs and (8,) labels; **130 / 19 / 38 batches** | **6.1** pad to the model's full context and see the effect | Figs 6.6, 6.7 |
| 6.4 Init with pretrained weights | reuse `download_and_load_gpt2`, BASE_CONFIG with **qkv_bias True**, drop_rate 0.0; sanity-check by generating text; **the base model cannot follow a "is this spam?" instruction** — it just repeats the prompt | — | gpt2-small 124M chosen; four sizes tabulated again | — | Fig 6.8 |
| 6.5 Classification head | freeze everything (`requires_grad=False`), replace `out_head` 768→**2**, then unfreeze the **last transformer block + final LayerNorm** as well; why not one output node; **which layers to fine-tune** (lower layers = general language, upper = task-specific) | — | output tensor becomes (1, 4, **2**) instead of (1, 4, 50257) | **6.2** fine-tune the whole model instead; **6.3** fine-tune the *first* token instead of the last | Figs 6.9, 6.10 |
| 6.5 (cont.) Why the last token | causal masking means the **last token is the only position that has attended to every other token**, so it carries the most information — that is why the classification head reads position −1 | — | last-token logits [−3.5983, 3.9902] | — | Figs 6.11, 6.12 |
| 6.6 Loss and accuracy | accuracy is not differentiable, so **cross entropy is the optimized proxy**; `calc_loss_batch` changes only by slicing `[:, -1, :]`; softmax before argmax is again optional | — | before fine-tuning: train acc **46.25 %**, val 45.00 %, test 48.75 % (chance = 50 %); initial losses 2.453 / 2.583 / 2.322 | — | Figs 6.13, 6.14 |
| 6.7 Fine-tuning | same training loop as pretraining, but tracks **examples seen** and computes accuracy per epoch; **choosing the number of epochs** (5 as a default starting point, read the loss curves) | AdamW again | lr **5e-5**, weight_decay 0.1, 5 epochs, eval_freq 50, eval_iter 5; **5.65 min on an M3 MacBook Air**, "<½ minute on a V100/A100"; final **train 97.21 %, val 97.32 %, test 95.67 %** | — | Figs 6.15–6.17 loss and accuracy curves |
| 6.8 Using the classifier | `classify_review()` end to end (truncate → pad → last-token logits → argmax → label); save/load `state_dict` | — | both example messages classified correctly | — | Fig 6.18 |

**Subtle/misunderstood:** why position −1 and not position 0 (causal mask); accuracy vs loss (proxy); validation accuracy usually beats test accuracy because hyperparameters were tuned on validation; a pretrained-only model cannot follow instructions.

## Ch 7 · Fine-tuning to follow instructions (p226–271)
Three stages (Fig 7.3): prepare dataset (1–3) → fine-tune (4–6) → evaluate (7–9).

| Section | Topics | Named ideas | Numbers | Exercises | Figures |
|---|---|---|---|---|---|
| 7.1 Intro | pretrained = text completion; instruction (supervised) fine-tuning teaches "fix the grammar", "convert to passive" | supervised instruction fine-tuning | — | — | Figs 7.1, 7.2 |
| 7.2 Dataset | JSON instruction/input/output triples; `input` may be empty; **prompt styles: Alpaca vs Phi-3** (`<\|user\|>` / `<\|assistant\|>`); 85/5/10 split | **Alpaca** (Stanford, first to publish its instruction-tuning process); **Phi-3** (Microsoft) | **1,100 entries, 204 KB**; splits **935 / 55 / 110** | **7.1** redo with the Phi-3 prompt style | Fig 7.4 the two prompt styles side by side |
| 7.3 Batching | why a **custom collate function**; pad per batch, not per dataset (less wasted compute); targets = inputs shifted by 1 + one appended `<\|endoftext\|>`; **replace all but the first padding token with −100** because PyTorch's `cross_entropy(..., ignore_index=-100)` skips them; **optionally mask the instruction tokens too** — and the field disagrees about whether that helps | `ignore_index=-100`; instruction masking | pad id **50256**; loss demo: 2 tokens → 1.1269, 3 tokens → 0.7936, third replaced by −100 → **1.1269 again** (proof the token is ignored) | **7.2** mask instruction+input with −100 and measure the effect | Figs 7.6–7.13 (the five substeps, per-batch padding, target shift, −100 replacement, instruction masking) |
| 7.3 (sources differ) | **Shi et al. 2024, "Instruction Tuning With Loss Over Instructions" (arXiv 2405.14394)** finds NOT masking instructions helps; the book therefore does not mask | — | — | — | — |
| 7.4 Data loaders | `functools.partial` to prefill device and `allowed_max_length=1024`; moving tensors to device inside the collate fn keeps it off the training loop; batches genuinely differ in length | — | batch 8; observed batch shapes 8×61, 8×76, 8×73, 8×74, 8×69 | — | Fig 7.14 |
| 7.5 Loading the model | uses **gpt2-medium (355M)** because 124M "lacks the capacity" for instruction following; baseline response just parrots the instruction back | — | download **1.42 GB** (≈3× the small model) | — | Fig 7.15 |
| 7.6 Fine-tuning | reuse `train_model_simple` unchanged; 2 epochs is enough, more risks overfitting; **hardware table** | AdamW | lr **5e-5**, wd 0.1, 2 epochs; initial train loss **3.826**, val 3.762 → train 0.300, val 0.657; **run times: 355M CPU M3 Air 15.78 min / L4 1.83 / A100 0.86; 124M 5.74 / 0.69 / 0.39 min** | **7.3** fine-tune on the real **Alpaca dataset (52,002 entries)**, reduce batch size / max length if OOM | Fig 7.17 loss curves |
| 7.7 Extracting responses | slice the prompt off `generate`'s output; save `instruction-data-with-response.json`; **three ways instruction models are evaluated**: MMLU-style benchmarks, human preference arenas, LLM-as-judge | **MMLU (arXiv 2009.03300)**; **LMSYS Chatbot Arena**; **AlpacaEval** | 110 test responses in **~1 min on A100, ~6 min on M3 Air** | — | Fig 7.18 |
| 7.8 Evaluating | **LLM-as-a-judge** with a local **Llama 3 8B via Ollama** (wrapper around llama.cpp); REST API at `localhost:11434/api/chat`, `temperature 0`, `seed 123`, `num_ctx 2048`; prompt asks for 0–100 given the reference answer; "Respond with the integer number only" for aggregation; Ollama is not fully deterministic → repeat and average | Ollama; llama.cpp; LLM-as-a-judge | llama3 8B download **4.7 GB**, needs **~16 GB RAM**; phi3 3.8B needs ~8 GB; **fine-tuned GPT-2 medium average score 50.32**; for reference **Llama 3 8B base 58.51, Llama 3 8B instruct 82.6**; example scores 85 (simile), 40 (cumulus vs cumulonimbus), 95 | — | Figs 7.19, 7.20 |
| 7.9 Conclusions | **preference fine-tuning / DPO** named as the optional next step; ways to improve (hyperparameters, more/diverse data, prompt format, bigger base model); tools: Axolotl, LitGPT; r/LocalLLaMA | **DPO (direct preference optimization)** | — | **7.4** redo the fine-tuning with **LoRA** (appendix E) and compare time and quality | Fig 7.21 |

**Subtle/misunderstood:** −100 is not magic, it is `cross_entropy`'s default `ignore_index`; keep exactly one EOS in the target so the model learns to stop; per-batch padding beats per-dataset padding; a judge LLM scoring its own family is a bias worth naming; 124M is genuinely too small for instruction following.

## Appendices (referenced by the course, worth mining)
- **App A** — PyTorch primer: tensors, autograd, `nn.Module`, DataLoader, training loop, GPU/multi-GPU (DDP). Exercises A.1–A.4.
- **App B** — per-chapter references and further reading (this is the citation graph for everything above).
- **App C** — exercise solutions.
- **App D** — **training refinements: learning-rate warmup, cosine decay, gradient clipping**, and the modified training function. Directly relevant to a "how training really works" chapter.
- **App E** — **LoRA (low-rank adaptation)**: introduction, dataset, model init, and parameter-efficient fine-tuning end to end.

## Appendix D · Bells and whistles for the training loop (p335–343) — read in full
| Section | Topics | Numbers |
|---|---|---|
| D.1 Learning-rate warmup | ramp lr linearly from `initial_lr` to `peak_lr` so early updates cannot destabilize the model; warmup steps set as a fraction of total steps | initial 0.0001 → peak 0.01; **warmup is usually 0.1 %–20 % of total steps**; 20 % of the demo's total = 27 steps |
| D.2 Cosine decay | after warmup, decay the lr along a half-cosine to near zero, to avoid overshooting the minimum late in training | `lr = min_lr + (peak−min)·0.5·(1+cos(π·progress))`; min_lr = 0.1 × initial |
| D.3 Gradient clipping | clip the **L2 norm** of all gradients to `max_norm`; worked example with a 2×2 matrix (‖G‖₂ = 5, scale 1/5) | `clip_grad_norm_(..., max_norm=1.0)`; largest gradient **0.0411 → 0.0185** after clipping |
| D.4 Modified `train_model` | all three combined; clipping applied only **after** the warmup phase | peak_lr 5e-4, 15 epochs, ~5 min on a MacBook Air; ends train loss 0.041, val 6.915 (still overfits, tiny dataset) |
Figures D.1 (warmup only) and D.2 (warmup + cosine decay) are the two plots.

## Appendix E · Parameter-efficient fine-tuning with LoRA (p344–358) — read in full
| Topic | Content | Numbers |
|---|---|---|
| E.1 What LoRA is | ΔW ≈ **A·B** with inner dimension r ≪ d; distributive law lets you keep W frozen and add the LoRA branch at inference: `x·W + x·A·B`; **keeping the adapters separate means one base model + many small adapters** instead of many full copies | **Hu et al., arXiv 2106.09685** |
| E.4 Implementation | `LoRALayer` (A kaiming-uniform, **B initialized to zeros** so the adapter starts as a no-op), `LinearWithLoRA` wrapping an existing `nn.Linear`, `replace_linear_with_lora` recursing through `named_children`; applied to Q/K/V, out_proj, both FFN layers and the output head | rank **16**, alpha **16**; "alpha is usually half, double, or equal to the rank" |
| Effect | freeze everything → 0 trainable; add LoRA → **2,666,528 trainable of 124,441,346 (~47× fewer)**; accuracy before fine-tuning is *identical* to chapter 6 precisely because B = 0 | final **train 100 %, val 96.64 %, test 98.00 %**; **12.10 min on an M3 MacBook Air** — *slower* than full fine-tuning here because the extra forward-pass branch costs more than the saved backward work at this size, but faster for large models |
Figures E.1 (ΔW vs A·B), E.2 (the LoRA layer), E.3 (adapter added to a linear layer), E.4 (which GPT layers get wrapped), E.5 (loss curves).

**Subtle/misunderstood:** B = 0 at init is what makes LoRA a no-op at step 0; LoRA is not automatically faster on small models; alpha is a scale on the adapter output, not a learning rate.

## Appendix B · The citation graph (p311–321) — S1's own reading list, captured in full
**Architecture & origins:** Attention Is All You Need (Vaswani 2017, 1706.03762) · BERT (Devlin 2018, 1810.04805) · GPT-2 "Language Models Are Unsupervised Multitask Learners" (Radford 2019) · GPT-3 "Language Models are Few-Shot Learners" (Brown 2020, 2005.14165) · InstructGPT (Ouyang 2022, 2203.02155) · ViT (Dosovitskiy 2020, 2010.11929) · Llama 2 (Touvron 2023, 2307.09288).
**Non-transformer LLMs:** RWKV (Peng 2023, 2305.13048) · Hyena (Poli 2023, 2302.10866) · **Mamba / SSM (Gu & Dao 2023, 2312.00752)**.
**Tokenization:** BPE for NMT (Sennrich 2015, 1508.07909) · SentencePiece (Kudo & Richardson 2018) · Fast WordPiece (Song 2020, 2012.15524) · OpenAI gpt-2 `encoder.py` · OpenAI tokenizer web UI · Karpathy **minbpe**.
**Attention internals:** Bahdanau attention (Bahdanau, Cho, Bengio 2014, 1409.0473) · **FlashAttention (Dao 2022, 2205.14135)** and **FlashAttention-2 (2023, 2307.08691)** · PyTorch `scaled_dot_product_attention` and `MultiHeadAttention` docs · Dropout (Srivastava 2014, JMLR) · Simplifying Transformer Blocks (He & Hofmann 2023, 2311.01906).
**Normalization & activations:** Layer Normalization (Ba, Kiros, Hinton 2016, 1607.06450) · On Layer Normalization in the Transformer Architecture (Xiong 2020, 2002.04745) · ResiDual (Tie 2023, 2304.14802) · **RMSNorm (Zhang & Sennrich 2019, 1910.07467)** · GELU (Hendrycks & Gimpel 2016, 1606.08415).
**Pretraining data & practice:** The Pile (Gao 2020, 2101.00027) · Dolma (Soldaini 2024, 2402.00159) · RefinedWeb/Falcon (Penedo 2023, 2306.01116) · RedPajama · **FineWeb (15T tokens)** · Pythia (Biderman 2023, 2304.01373) · OLMo (Groeneveld 2024, 2402.00838) · Continual pretraining (Ibrahim 2024, 2403.08763) · GaLore (Zhao 2024, 2403.03507) · nanoGPT (Karpathy) · "In the Long (Context) Run", Harm de Vries — **most compute is in the FFN, not attention, below ~32k context**.
**Decoding:** top-k = Hierarchical Neural Story Generation (Fan 2018, 1805.04833) · **top-p / nucleus** · **beam search / diverse beam search (Vijayakumar 2016, 1610.02424)**.
**Classification fine-tuning:** RoBERTa (Liu 2019, 1907.11692) · Label Supervised LLaMA Finetuning (Li 2023, 2310.01208) · **LLM2Vec (BehnamGhader 2024, 2404.05961)** — removing the causal mask helps classification · imbalanced-learn guide.
**Instruction tuning & evaluation:** Stanford Alpaca (52k pairs) · LIMA (Zhou 2023, 2305.11206) · UltraChat (805k, Ding 2023, 2305.14233) · Alpaca-GPT4 · Phi-3 (Abdin 2024, 2404.14219) · Magpie (Xu 2024, 2406.08464) · Instruction Tuning with Loss Over Instructions (Shi 2024, 2405.14394) · Prometheus (Kim 2023, 2310.08491) and Prometheus 2 (2405.01535) · PHUDGE (2405.08029) · **Does Fine-Tuning LLMs on New Knowledge Encourage Hallucinations? (Gekhman 2024, 2405.05904)** — facts come from pretraining; new facts learned in fine-tuning increase hallucination.
**Domain models:** BloombergGPT (Wu 2023, 2303.17564) · Med-PaLM-style medical QA (Singhal 2023, 2305.09617).
**Preference tuning:** RLHF and its alternatives; reward-model tips (Raschka blog) — DPO folder in the repo.
**Training infrastructure:** gradient accumulation · PyTorch **DDP** and **FSDP**.

# S2 — Alammar & Grootendorst, *Hands-On Large Language Models* (O'Reilly). **EARLY RELEASE, 383 pp, 7 chapters only**, and the chapter numbering is provisional (ch1 here is "the 2nd chapter of the final book"). No transformer-internals chapter, no fine-tuning chapter (repeatedly forward-referenced as "Chapter 10"/"Chapter 13" which do not exist in this copy). Treat as an *applications* source, not a mechanisms source.

## Ch 1 · Categorizing Text (p8–54)
| Section | Topics | Named ideas | Numbers | Figures |
|---|---|---|---|---|
| Supervised text classification | the two-step pipeline: feature extraction → classifier; **freezing vs unfreezing layers**; encoder (BERT) = specialist vs GPT = generalist; model-choice as a real skill | BERT, **RoBERTa, DistilBERT, ALBERT, DeBERTa, BERT-tiny**; XGBoost; TF-IDF + LogisticRegression named as the baseline you must beat | rotten_tomatoes ≈ **5k pos / 5k neg**; **F1 0.85** with a bert-base-cased classification head | 1-1 to 1-6; **1-3 timeline of LLM releases** |
| Pre-trained embeddings | fully separate feature extraction from classification: SBERT embeddings + LogisticRegression | **SBERT / sentence-transformers**, `all-mpnet-base-v2` | 768-dim embeddings; **F1 0.85** with a far smaller model | 1-7 to 1-9 |
| Zero-shot via embeddings | embed *label descriptions* and use **cosine similarity** to the document; wording of the label matters | cosine similarity | "A negative/positive review" → **F1 0.81**; "A very negative/positive movie review" → **F1 0.83** (prompt wording alone) | 1-10 to 1-13 |
| Zero-shot via NLI | premise/hypothesis framing: entailment = label applies | **NLI**, `facebook/bart-large-mnli` (400k+ pairs), `cross-encoder/nli-deberta-base` | **F1 0.81**, no training | 1-14, 1-15 |
| Generative classification | prompt engineering; **in-context learning** (the model follows examples, it does not learn); zero-shot vs few-shot prompts; forcing terse outputs ("say only 0 or 1"); rate limits and **exponential backoff** (tenacity) | in-context learning; "Language Models are Few-Shot Learners" (Brown 2020) | GPT-3.5-turbo zero-shot **F1 0.91**, few-shot (2 examples/class) **F1 0.92**; 300 API requests to evaluate | 1-16 |
| NER | token classification vs sequence classification; spaCy + `spacy.NER.v1` with an OpenAI backend, custom labels with no training | spaCy; NER | custom labels DATE, AGE, LOCATION, DISEASE, SYMPTOM | 1-17, 1-18 |
**Subtle:** fine-tuning still generally beats in-context learning, especially on domain-specific data; "learning" in in-context learning is a misnomer — nothing is updated.

## Ch 2 · Semantic Search (p55–95)
| Section | Topics | Named ideas | Numbers | Figures |
|---|---|---|---|---|
| Three categories | **dense retrieval**, **reranking**, **generative search**; Google used BERT in Search ("one of the biggest leaps forward"); Bing likewise | — | — | 2-1, 2-2, 2-3 |
| Dense retrieval | embeddings as points; embed the query into the same space, take nearest neighbours; worked Interstellar-Wikipedia example with Cohere + **Annoy**; keyword-free matches ("How much did the film make?" hits the gross sentence) | Cohere embed; Annoy | 15 sentences × **4096-dim** vectors; example distances 0.87–1.24 | 2-4, 2-5 |
| Caveats | irrelevant results still come back with a distance → **set a relevance threshold**; exact-match needs keywords → **hybrid search**; **out-of-domain failure** (train on web, deploy on legal); answers spanning several sentences force the chunking question | hybrid search | — | — |
| Chunking | one vector per document (title-only, or averaged chunks — lossy) vs **multiple vectors per document**; sentence / paragraph / 4–8 sentences; add the title to each chunk; **overlapping chunks** | — | "every 4–8 sentences" | 2-6, 2-7, 2-8 |
| ANN vs vector DBs | brute-force NumPy fine at 10⁴; **Annoy / FAISS** at 10⁶+; **vector databases (Weaviate, Pinecone)** add insert/delete without a rebuild plus filtering | — | "thousands or tens of thousands" vs "millions" | — |
| Fine-tuning embedders | positive and negative (query, document) pairs pull relevant queries closer and push irrelevant ones away | contrastive fine-tuning | — | 2-9, 2-10 |
| Reranking | second stage over a shortlist; **cross-encoder** sees query and document together (vs bi-encoder); relevance scoring as classification | **monoBERT / "Multi-Stage Document Ranking with BERT"**; *Pretrained Transformers for Text Ranking: BERT and Beyond*; Cohere `rerank-english-02` | scores 0.92 vs 0.11 vs 0.03 on the same three documents | 2-11 |
| Generative search | summarize-and-cite at the end of the pipeline; **hallucination** as the reason citations exist | **RAG, RETRO, Atlas**; Bing AI, Bard | — | 2-12 |
| Other uses | synthetic query generation to fine-tune retrievers; query decomposition | **GenQ, InPars-v2**; **Demonstrate-Search-Predict (DSP)** | — | — |
| Evaluation | IR metrics need archive + queries + **relevance judgements**; precision at each position → **Average Precision** → **MAP**; **nDCG** named | MAP, nDCG | worked example: AP **0.61** vs 0.1 for two systems with one relevant hit at different ranks | 2-13 to 2-18 |
**Subtle:** a query and its best answer are not always semantically similar — that is why retrievers are trained on question/answer pairs; position matters, so accuracy-style counting is the wrong metric.

## Ch 3 · Text Clustering and Topic Modeling (p96–163)
| Section | Topics | Named ideas | Numbers | Figures |
|---|---|---|---|---|
| Text clustering | the three-step pipeline **embed → reduce dimensionality → cluster**; the honest problem of evaluating unsupervised output ("what does correct even mean?"); use cases: recurring support issues, duplicate content, trend detection, faster labeling | sentence-transformers (Reimers 2019) | `all-MiniLM…` embeddings "at least 384 values" | 3-1 to 3-6 |
| Dimensionality reduction | the **curse of dimensionality**: distance loses meaning as dimensions grow, clusters get diffuse; **PCA vs UMAP** (UMAP handles non-linear structure better); reduction always loses information | **UMAP** (McInnes 2018); PCA | `n_neighbors=15, n_components=5, metric='cosine'` | 3-4 |
| Clustering | **HDBSCAN** as a good default: density-based, finds the number of clusters itself, and **labels outliers instead of forcing them into a cluster**; k-Means / agglomerative as alternatives | **HDBSCAN** (McInnes 2017); DBSCAN | `min_cluster_size=15` | 3-5, 3-6 |
| Topic modeling | **LDA** as the classical baseline (topic = distribution over words, document = mixture of topics); embedded and contextualized topic models; **BERTopic** = clustering + **c-TF-IDF** | **LDA (Blei 2003)**; BERTopic | — | 3-7 |
| c-TF-IDF | concatenate every document in a cluster into one document, then weight terms **between clusters** rather than between documents: log(1 + A/f_x) where A is the average words per cluster; **it uses no LLM at all** — a cheap first ranking before expensive models | **c-TF-IDF** (class-based TF-IDF) | 321 topics on the ArXiv NLP corpus; topic −1 = outliers, **11,648 documents** | 3-8, 3-9, 3-10 |
| Modularity | every stage is a swappable "lego block": embedder, reducer, clusterer, vectorizer, weighting, representation model; clustering assigns one topic per document but `approximate_distribution` recovers a per-token topic mixture | — | — | 3-11 to 3-16 |
| Representation models | **KeyBERTInspired** (re-rank candidate keywords by similarity to an averaged topic embedding built from ~500 sampled documents); **PartOfSpeech** (spaCy, keep nouns); **MMR** (diversity parameter λ removes "embedding"/"embeddings" duplicates); **text generation** (Flan-T5, OpenAI, Cohere, LangChain) to name topics | KeyBERT; MMR; **Flan-T5 and instruction tuning** | generating labels per **topic** not per document cuts API calls "from millions to a couple of hundred" | 3-17 to 3-21 |
**Subtle:** the visualization is a lossy 2-D approximation — human inspection of clusters is mandatory; embedding-based keyword re-ranking can throw away good acronyms ("qa", "amr").

## Ch 4 · Text Generation with GPT Models (p164–219) — the prompting/reasoning chapter
| Section | Topics | Named ideas | Numbers | Figures |
|---|---|---|---|---|
| Choosing a model | proprietary vs open; start **small and recent**, scaling up is nicer than scaling down; VRAM as the practical limit | **Llama 2, Mistral 7B, Zephyr 7B-beta** (fine-tuned Mistral) | — | 4-1 foundation-model map |
| Loading | HF `pipeline`; **every model has its own chat template** — system/user/assistant turns via `apply_chat_template`; the system prompt | — | `bfloat16`, `device_map="auto"` | 4-2 the Zephyr template |
| Controlling output | next-token likelihoods; **temperature** (0 = deterministic, higher = flatter); **top_p / nucleus sampling** (cumulative-probability cutoff); **top_k** (fixed count); the creative↔predictable dial | nucleus sampling | example call `temperature=0.1, top_p=0.95`; "0.8 diverse vs 0.2 deterministic" | 4-3 to 4-6 |
| Prompt basics | instruction + data + **output indicator**; **specificity** is the highest-value lever; ask for "I don't know" to suppress hallucination; **order matters — primacy and recency effects, the middle is forgotten** | hallucination; primacy/recency | — | 4-7 to 4-11 |
| Advanced prompting | the modular prompt: **persona, instruction, context, format, audience (ELI5), tone, data**; iterate component by component; prompts are model-specific | — | — | 4-12, 4-13 |
| In-context learning | zero-/one-/few-shot; roles must alternate user/assistant or "it looks like you are talking to yourself"; worked example with the invented words *Gigamuru* / *screeg* | — | — | 4-14 |
| Chain prompting | split the task **between** prompts, feeding output to input (name → slogan → sales pitch); each call can use different parameters; also used for response validation, parallel prompts, long-form writing | — | — | 4-15 |
| Reasoning | **System 1 vs System 2** framing; **chain-of-thought** (the Roger's tennis balls / cafeteria apples examples — standard prompt gets 26, wrong; CoT gets it right); **zero-shot CoT: "Let's think step-by-step"** and its variants; **self-consistency** (sample n paths, majority vote, n× slower); **tree-of-thought**, and its cheap emulation as "imagine three experts arguing" | CoT; zero-shot CoT; self-consistency; **tree-of-thought** | — | 4-16 to 4-19 |
| Output verification | four reasons to verify: structure, validity, ethics/PII, accuracy; three levers: **examples, grammar (constrained sampling), fine-tuning**; few-shot fixes the JSON shape but the model can still deviate; **constrained decoding restricts the token set itself** | **Guidance, Guardrails, LMQL**; **llama-cpp-python + GBNF grammar**, GGUF quantized model | zephyr-7b-beta **Q4_K_M.gguf** | 4-20 to 4-22 |
**Subtle:** temperature/top_p still apply under a grammar; self-consistency trades latency for accuracy linearly; CoT works because the model can condition on its own generated reasoning.

## Ch 5 · Multimodal Large Language Models (p220–267)
| Section | Topics | Named ideas | Numbers | Figures |
|---|---|---|---|---|
| Transformers for vision | **ViT**: cut the image into patches, **linearly embed each patch**, feed them to the encoder exactly as if they were text tokens; patches cannot get IDs because they never recur like vocabulary | **ViT (Dosovitskiy 2020, 2010.11929)**; CNNs as the prior default | original ViT uses **16×16 patches** ("an image is worth 16×16 words"); figures use 3×3 for legibility | 5-1 to 5-4 |
| Multimodal embeddings | one shared vector space for text and images → zero-shot classification, clustering, cross-modal search, and conditioning image generation | **CLIP (Radford 2021)**; OpenCLIP; `clip-ViT-B-32` in sentence-transformers | text and image embeddings both **512-dim**; images resized to **224×224×3**; example cosine similarity **0.33** (high, relative to the other pairs in the matrix) | 5-5 to 5-13 |
| How CLIP trains | image encoder + text encoder, cosine similarity between the pair, **maximize matched pairs and minimize mismatched ones** — contrastive learning; negatives are essential | contrastive learning | — | 5-7 to 5-10 |
| BLIP-2 | training a multimodal model from scratch is infeasible, so **freeze a ViT and freeze an LLM and train only a bridge**: the **Q-Former**, with an image transformer and a text transformer sharing attention layers; stage 1 = representation learning on three objectives (**image-text contrastive, image-text matching, image-grounded text generation**), stage 2 = project the learned queries through a linear layer into the LLM as a **soft visual prompt** | **BLIP-2**; Q-Former; soft prompt | `Salesforce/blip2-opt-2.7b`; the model's own tokenizer is a **GPT2TokenizerFast**; `Ġ` = space shifted by 256 code points to stay printable | 5-15 to 5-19 |
| Use cases | captioning; **visual question answering**; chat-style follow-ups by concatenating the Q/A history into the prompt; failure on domain-specific or imaginary images | — | supercar → "an orange supercar driving on the road at sunset"; Rorschach inkblot → "a black and white ink drawing of a bat" | 5-20 to 5-22 |
**Subtle:** the moment patch embeddings enter the encoder there is no difference between image and text processing; the projection layer exists purely to match shapes; wide/tall images are distorted into squares by preprocessing.

## Ch 6 · Tokens & Token Embeddings (p268–322) — the tokenizer chapter
| Section | Topics | Named ideas | Numbers | Figures |
|---|---|---|---|---|
| What a tokenizer does | text → token IDs → (model) → token ID → text; a pretrained model is **married to its tokenizer**; partial tokens carry a hidden marker for the preceding space | — | prompt tokenized into `<s> Write an email apolog izing …` | 6-2, 6-3, 6-4 |
| Four granularities | **word** (OOV problem, wastes vocabulary on apology/apologize/apologetic), **subword** (the default; ~3 characters per token so ~3× more text fits a context window than characters), **character** (easy to tokenize, harder to model — "p-l-a-y"), **byte** / tokenization-free | **CANINE**; **ByT5**; GPT-2 and RoBERTa keep bytes only as a fallback | "three times as much text" at 1024 context | 6-5 |
| Trained-tokenizer tour | the same test string through **bert-base-uncased / bert-base-cased / gpt2 / flan-t5-xxl / GPT-4 / starcoder / galactica / Llama-2** — what each one destroys or preserves (newlines, case, emoji, CJK, whitespace runs, digits) | WordPiece (BERT), BPE (GPT), SentencePiece (Llama, T5) | **vocab sizes: BERT-uncased 30,522; BERT-cased 28,996; GPT-2 50,257; flan-T5 32,100; GPT-4 ~100,000; starcoder ~50,000; galactica 50,000**; GPT-4 has a token for every whitespace run **up to 83 spaces**, and `elif` is one token; **starcoder gives every digit its own token** (GPT-2: 870 is one token but 871 is two) | 6-5, side-by-side recap table |
| Special tokens | `[CLS]` (classification), `[SEP]` (separator, used to join query and document in rerankers), `[UNK]`, `[PAD]`, `[MASK]`, `<\|endoftext\|>`; **fill-in-the-middle** tokens (`<\|fim_prefix\|>/middle/suffix`); starcoder's `<filename>`, `<reponame>`, `<gh_stars>`, `<issue_start>`, `<jupyter_start>`; **galactica's `[START_REF]`/`[END_REF]` and `<work>` for chain-of-thought** | **Efficient Training of Language Models to Fill in the Middle**; **StarCoder**; **Galactica** | — | — |
| Three design axes | **method** (BPE/WordPiece/SentencePiece) · **parameters** (vocabulary size 30K/50K/100K, special tokens, capitalization) · **the tokenizer's training dataset** — a code-trained tokenizer indents in one token | — | — | — |
| Model embeddings | the model stores **one embedding vector per vocabulary token**, randomly initialized then learned; **contextualized** token embeddings (per occurrence) vs static ones; used for NER, extractive summarization, span classification, and to condition Dall-E / Midjourney / Stable Diffusion | **DeBERTa v3** ("DeBERTaV3: … ELECTRA-Style Pre-Training") | "Hello world" → 4 tokens (`[CLS] Hello world [SEP]`) × **384** dims | 6-6, 6-7, 6-8 |
| word2vec | GloVe/FastText/word2vec still useful; **skipgram** sliding window generates (center, neighbour) positives, **negative sampling** adds random non-neighbours, and a classifier predicts "are these two neighbours?" — the ancestor of all contrastive training | **word2vec ("Efficient Estimation of Word Representations in Vector Space")**; **noise-contrastive estimation**; GloVe; FastText | `glove-wiki-gigaword-50` (66 MB); nearest neighbours of "king" → prince 0.824, queen 0.784 … | 6-9 to 6-14 |
| Embeddings for recommendation | treat a **playlist as a sentence and a song as a token**, train word2vec on playlists, recommend by nearest neighbour | Shuo Chen playlist dataset (Cornell) | `Word2Vec(playlists, vector_size=32, window=…)`; Billie Jean → Prince/Madonna/more MJ; Metallica → Van Halen, Dio, Judas Priest | 6-15 |
**Subtle:** whitespace and digit tokenization are *the* reason models are good or bad at code and arithmetic; a token is not a word; the tokenizer is trained before the model and on a possibly different dataset.

## Ch 7 · Creating Text Embedding Models (p323–381) — the contrastive-learning chapter
| Section | Topics | Named ideas | Numbers | Figures |
|---|---|---|---|---|
| What embedding models are for | similarity is whatever you train it to be — semantic similarity **or sentiment similarity**; the training pairs decide | — | — | 7-1 to 7-3 |
| Contrastive learning | learn similarity by showing similar and dissimilar pairs; the **contrastive-explanation** framing ("why P rather than Q?" — the bank robber anecdote, the dog-vs-cat features) | Garfinkel 1981; **Tim Miller, "Contrastive explanation"** (2021); word2vec named as NLP's first big contrastive win | — | 7-4, 7-5 |
| SBERT | **cross-encoder** (both sentences in at once, outputs a score, no embedding) vs **bi-encoder / siamese network with tied weights + mean pooling**; naive BERT [CLS] or averaged output is *worse than averaging GloVe vectors* | **SBERT / sentence-transformers**; GloVe (Pennington 2014) | finding the best pair among 10,000 sentences with a cross-encoder = **n(n−1)/2 = 49,995,000 inferences** | 7-6, 7-7 |
| Generating pairs | **NLI datasets give you both**: entailment = positive, contradiction = negative; SetFit builds pairs within/between classes | **GLUE**, **MNLI**, **STSB** | MNLI labels 0 entailment / 1 neutral / 2 contradiction; STSB scores 1–5, rescaled to 0–1 | 7-8 |
| Training from scratch | `models.Transformer` + `models.Pooling` (mean pooling default); all layers trainable by default and **freezing is generally not advised**; multi-task via a list of train objectives | `microsoft/mpnet-base` as a strong base | one epoch ≈ **1 hour on a V100**; STSB score **baseline 0.615 → 0.738** with SoftmaxLoss | — |
| Evaluation | STSB alone is not enough; **MTEB** unifies it | **MTEB (Muennighoff 2022, 2210.07316)** and its leaderboard | MTEB = **8 tasks, 58 datasets, 112 languages**; Banking77 accuracy 0.783, and it records **evaluation time** because latency matters | — |
| Loss functions | **CosineSimilarityLoss** (graded 0–1 similarity) and **Multiple Negatives Ranking loss = InfoNCE = NTXent** (positive pairs only, negatives are **in-batch negatives**, cross-entropy over similarities); larger batches make MNR harder and better; dot product instead of cosine helps long texts but hurts clustering; **hard negatives** ("More than a million people live in Utrecht, more than Amsterdam" for "How many people live in Amsterdam?") beat easy in-batch negatives — pass a third text to `InputExample` | **InfoNCE (van den Oord 2018)**; **NTXent / SimCLR (Chen & Hinton 2020)**; smart-reply loss (Henderson 2017); MarginMSE for cross-encoders | Cosine loss **0.848**; MNR **0.818** vs Softmax 0.738 | 7-9, 7-10, 7-11 |
| Fine-tuning | start from `all-mpnet-base-v2` instead of raw BERT; **MLM on in-domain text first** as domain adaptation; the hard part is data, especially hard negatives | — | — | — |
| Augmented SBERT | small **gold** set → fine-tune a cross-encoder → generate candidate pairs (random, or better: top-k by semantic search) → label them into a **silver** set → train the bi-encoder on gold+silver | **Augmented SBERT (Thakur 2020, 2010.08240)** | gold only **0.804** → gold+silver **0.830** | 7-12 |
| Unsupervised | **TSDAE**: delete a fraction of words, encode the damaged sentence, decode the original; uses **CLS pooling** (mean pooling loses positional information); the decoder is thrown away | **TSDAE (Wang 2021, 2104.06979)**; SimCSE (Gao 2021, 2104.08821); Contrastive Tension (Janson 2021) | TSDAE reaches **0.74 with no labels at all** | 7-13 |
| Domain adaptation | **adaptive pre-training** (unsupervised on target domain, then supervised) vs **adaptive fine-tuning**; **GPL**: (1) generate queries per passage with T5, (2) mine negatives with a retriever, (3) **score every pair with a cross-encoder** so accidental false negatives become graded rather than wrong → triplets | **GPL (Wang 2021, 2112.07577)**; `BeIR/query-gen-msmarco-t5-base-v1`, `msmarco-distilbert-base-v3`, `cross-encoder/ms-marco-MiniLM…` | GPL ~**1 day on a V100** for the authors; here 10,000 steps → **0.825 with no labels** | 7-14 to 7-18 |
**Subtle:** MNR's "easy" negatives make the task too easy; scoring beats binary labeling because some mined negatives are actually positives; unsupervised methods trail supervised ones but close much of the gap.

## S2 reference list (from the chapter footnotes)
Wei et al. 2022 **Emergent abilities of LLMs** (2206.07682) · Dosovitskiy 2020 ViT · Radford 2021 CLIP · Pennington 2014 GloVe · Muennighoff 2022 MTEB · Henderson 2017 smart reply · van den Oord 2018 **InfoNCE / CPC** · Chen & Hinton 2020 **SimCLR** · Thakur 2020 Augmented SBERT · Gao 2021 SimCSE · Janson 2021 Contrastive Tension · Wang 2021 TSDAE · Wang 2021 GPL · plus in-text: BERT, GPT-3 few-shot, monoBERT multi-stage ranking, *Pretrained Transformers for Text Ranking*, RAG/RETRO/Atlas, GenQ, InPars-v2, DSP, CANINE, ByT5, FIM, StarCoder, Galactica, DeBERTaV3, BLIP-2, LDA (Blei 2003), UMAP, HDBSCAN, word2vec, NCE.

# S3 — Iusztin & Labonne, *LLM Engineer's Handbook* (Packt, 2024). 523 pp, 11 chapters + MLOps appendix. **Complete.** Project-shaped: everything is built around one worked product, the "LLM Twin".

## Ch 1 · The LLM Twin concept and architecture (p30–53)
| Section | Topics | Named ideas | Numbers | Figures |
|---|---|---|---|---|
| The concept | an LLM fine-tuned on *your* writing = **style transfer** applied to a persona; co-pilot vs twin; why a raw chatbot fails (generic voice, hallucination, un-reproducible manual prompting) | style transfer | — | — |
| MVP planning | scope discipline: what a **minimum viable product** is and why "viable" is the load-bearing word | MVP | team of 3, laptops, personal funding | — |
| **FTI architecture** | the chapter's real content: the **monolithic batch pipeline** (solves training–serving skew but blocks reuse, scaling, streaming, language changes) and the **stateless real-time** design (client must ship the whole state — an antipattern) → the **feature / training / inference** split, each with a fixed interface: feature pipeline → **feature store**; training pipeline → **model registry**; inference pipeline reads both. Layers may contain many services; the interfaces must not change | **FTI pipelines (Jim Dowling, Hopsworks)**; **training–serving skew**; feature store; model registry; artifact; **continuous training (CT)** | — | 1.1 Google's "hidden technical debt" component map; 1.2 monolithic batch; 1.3 stateless real-time; 1.4 Google's CT architecture; 1.5 FTI; 1.6 LLM Twin architecture |
| Applying FTI | four components because the **data collection ETL** is owned by data engineering; data binned by **category (articles / posts / code)** not by source, so chunking and processing differ per category; a **logical feature store** (vector DB + versioned artifacts) instead of a dedicated one; compute profile per pipeline (CPU for data, GPU for training, latency-bound for inference); horizontal vs vertical scaling per pipeline | ETL; DAG | fine-tune sizes **7B / 14B / 30B / 70B** named as requirements | — |

## Ch 2 · Tooling and installation (p54–83) — tooling only, low mechanism content
`pyenv` (Python **3.11.8**) · **Poetry 1.8.3** (pyproject.toml vs the exact-pin poetry.lock; alternatives venv/conda/Pipenv/**uv**) · **Poe the Poet** as the CLI façade · **Hugging Face as model registry** (TwinLlama-3.1-8B and -DPO published) · **ZenML** as orchestrator with `@pipeline`/`@step`, **stacks** (SageMaker + S3 + ECR, swappable, no vendor lock-in), **artifacts + metadata** (dataset size, split ratio, samples per category, retrievable by UUID); alternatives Airflow, Prefect, Metaflow, Dagster, Argo, Kubeflow · **Comet ML** experiment tracker (train/eval loss, gradient norm, GPU/CPU/memory); alternatives W&B, MLflow, Neptune · **Opik** prompt monitoring — *why plain logs fail: prompts form chained **traces**, not lines*; alternatives Langfuse, Galileo, LangSmith · **MongoDB** (NoSQL warehouse for raw text) · **Qdrant** (vector DB; alternatives Milvus, Redis, Weaviate, Pinecone, Chroma, **pgvector**; Superlinked's Vector DB Comparison) · **AWS**: IAM keys, CLI, **SageMaker vs Bedrock** (managed serverless + fixed model list + per-call pricing vs full customization + pay-for-idle-endpoints; EKS/ECS if you want everything) · Docker 27.1.1 for local infra.
**Cost note worth quoting:** running the book's SageMaker work costs the reader **$50–$100**; Bedrock at the time supported only Mistral, Flan, Llama 2, Llama 3.

## Ch 3 · Data Engineering (p84–127) — **implementation-heavy; read for structure, not mechanism**
A ZenML ETL that crawls the authors' own Medium/Substack/LinkedIn/GitHub content: `CrawlerDispatcher` picking a crawler per domain, base crawler classes, **GitHubCrawler / CustomArticleCrawler / MediumCrawler**, Selenium troubleshooting, and a **NoSQL data warehouse layer built on the ODM pattern** (ORM vs **ODM**, a hand-written ODM base class over MongoDB, user/document classes per data category). The transferable ideas: dispatcher-per-source so new platforms plug in; **store by data category, not by source**; standardize at ingest; back up the crawled data so readers can skip crawling.

## Ch 4 · RAG Feature Pipeline (p128–205) — theory half read in full, implementation half skimmed
| Section | Topics | Named ideas | Numbers |
|---|---|---|---|
| Understanding RAG | R-A-G decomposed; **parameterized knowledge** vs external data; the two problems RAG solves — **hallucination** and **old/private data** (private data you may not train on, new data arrives continuously, training is too expensive to repeat); with RAG the LLM becomes the **reasoning engine** and the retrieved context the single source of truth, which also makes the answer *checkable* | — | GPT-4o's training cutoff **October 2023** used as the worked example |
| Vanilla RAG | three independent modules: **ingestion** (extract → clean → chunk → embed → load), **retrieval** (embed the query into the *same* space, top-K by distance), **generation** (system + prompt template + context); **cosine distance = 1 − cosθ**, range −1…1; Euclidean and Manhattan named; **the query must be preprocessed with the same functions/models/hyperparameters — otherwise it is training–serving skew again**; prompt templates must be versioned (Git, DB, or LangFuse) | training–serving skew | — |
| Embeddings | why not **one-hot** (curse of dimensionality: 10,000-token vocabulary × N tokens) and why not **feature hashing** (collisions, uninterpretable, loses semantics); embeddings condense meaning into a controllable dimension; created by word2vec/GloVe or **encoder-only transformers (BERT, RoBERTa)**; images via CNN/ResNet, audio via **spectrogram → image model**, cross-modal via **CLIP** | UMAP vs **t-SNE** (t-SNE more stochastic, does not preserve topology) | typical embedding dims **64–2048**; `all-MiniLM-L6-v2` → 384; `clip-ViT-B-32` → 512; worked cosine values 1.0 / −0.039 / 0.269 and image-text 0.307 / 0.330 / 0.172 |
| Applications | categorical encoding, recommenders, clustering and outlier detection, visualization, classification, **zero-shot by class-embedding comparison**, agent long-term memory | **MTEB** for picking a model (accuracy vs memory footprint) | — |
| Vector DBs | why a DB and not just an index (FAISS lacks CRUD, metadata filtering, replication, backups, security); **ANN over exact NN** because exact is too slow and approximation is empirically good enough; index algorithms **HNSW, random projection, PQ, LSH**; metadata filtering **before or after** the vector search, each with trade-offs; sharding/replication, monitoring, access control, backups | ANN; HNSW; PQ; LSH | — |
| Advanced RAG | the three stages (**pre-retrieval, retrieval, post-retrieval**). **Pre-retrieval — data indexing**: sliding-window/overlapping chunks, data granularity, metadata tags, index structure, **small-to-big** (embed a small span, keep a wider window in metadata). **Pre-retrieval — query optimization**: **query routing** (an if/else written in natural language — vector DB vs SQL vs web, or choosing a prompt template), **query rewriting** (paraphrase, synonyms, sub-queries), **HyDE**, **query expansion**, **self-query** (extract entities into metadata filters). **Retrieval**: fine-tune the embedding model, or use **instructor models** (`hkunlp/instructor-xl`) instead; **hybrid search** with an **alpha** weight between keyword and vector; **filtered vector search**. **Post-retrieval**: **prompt compression** and **re-ranking with a cross-encoder** (too expensive to run first, so retrieve cheap then re-rank) | HyDE; instructor embeddings; bi-encoder vs cross-encoder | instructor-base → 768 dims |
| Feature-pipeline design | **batch vs streaming** table (schedule, efficiency, complexity, use cases, system complexity); streaming stack = **Kafka/Redpanda + Flink/Bytewax**, or RabbitMQ to simplify; TikTok-style recommenders, fraud detection and HFT need streaming, nightly recommenders and ETL do not; **batch wastes compute on predictions nobody consumes**; advice: **start batch, move to streaming when cost and UX demand it**; the LLM Twin uses batch because thousands (not billions) of records and a one-minute lag is fine | change data capture (CDC) named for the sync problem | — |
| Feature-store subtlety | strings are not features — **tokens are**; the book tokenizes at runtime anyway and says so out loud: *don't be rigid about FTI* | — | — |
| Implementation | ZenML pipeline/steps, Pydantic domain entities, a **dispatcher layer** with cleaning / chunking / embedding **handlers** per data category, `SentenceTransformersTokenTextSplitter`, an `EmbeddingModelSingleton` | — | — |

## Ch 5 · Supervised Fine-Tuning (p206–257) — **the single best chapter in this source**
| Section | Topics | Named ideas | Numbers |
|---|---|---|---|
| What SFT is for | two purposes: teach the **chat format** (turn a base model into a conversational agent) and **adapt knowledge to a task/domain**; SFT refocuses existing pretraining knowledge — it does **not** add distant new knowledge well; **fine-tuning on new knowledge increases hallucination**; **catastrophic forgetting** | — | — |
| Instruction-dataset framework | pairs of instruction/answer; optional **system** and **input** subfields; train on answers only or on both; the three quality dimensions **accuracy, diversity, complexity** | Alpaca fields; **SlimOrca** worked example | — |
| Data quantity | how many samples: big models need fewer; small models need enough just to learn the template | **LIMA** ("less is more for alignment") | **1,000 high-quality samples can suffice at ~70B**; **Yi < 10,000**; **Llama 3: 10 million** across all post-training; OpenHermes/Dolphin ~1M; recommendation: **≥1M for a general-purpose instruct model**; **task-specific 100–100,000** samples and usually **<8B** parameters; domain-specific varies with how well the domain was represented in pretraining |
| Rule-based filtering | **length filtering**, **keyword exclusion**, **format checking**; fast, consistent, auditable, automatable — but binary, blunt, can delete valid oddities and can encode bias | — | — |
| Deduplication | why duplicates hurt: overfitting, biased performance, wasted training, **inflated eval metrics**; **exact** (normalize → MD5/SHA-256 hash → drop) vs **fuzzy (MinHash: shingles → hash functions → min-value signatures → Jaccard)** vs **semantic** (embed and cluster with K-means/DBSCAN/hierarchical, keep one per cluster) | MinHash; Jaccard | — |
| **Decontamination** | remove training samples identical or near-identical to the **evaluation set**; exact match, MinHash/n-gram near-match, provenance tracking; **practical trick: add the eval set into the dedup stage and only delete from the training side** | — | — |
| Data-quality evaluation | **LLM-as-a-judge** with its three named biases — **position bias** (fix: randomize A/B order), **length bias** (fix: length normalization), **intra-model favoritism** (fix: a *jury* of several models, ideally smaller ones — cheaper and less biased); **comparative beats absolute scoring**; aim for ~**80% agreement with human evaluators**. **Reward models**: a linear head on a decoder, scoring instruction+answer, sometimes multi-dimensional (helpfulness, correctness, coherence, complexity, verbosity). **Classifiers**: encoder-only quality filters — fast enough for millions of samples, weaker on nuance | **ArmoRM-Llama3-8B** (arXiv 2406.12845); **RewardBench** (allenai); **fineweb-edu-classifier** | fineweb-edu-classifier = head on `snowflake-arctic-embed-m`, **20 epochs on 450,000 samples labeled by Llama 3 70B Instruct** |
| Data exploration | manual inspection is unavoidable (stratified sampling, criteria checklists, multiple reviewers); statistical analysis (NLTK/spaCy, histograms, word clouds); **topic clustering** to check coverage per topic and sub-topic | **Argilla**; HF `text-clustering` (sentence-transformers + UMAP + DBSCAN + LLM labeling); **Nomic Atlas**, BunkaTopics, Lilac | — |
| Data generation | **synthetic generation** from seed prompts / a taxonomy (the five original Alpaca seeds are reproduced); multi-step pipelines with a validation model; control complexity, length, tone, topic; **structured generation (Outlines, OpenAI JSON mode)**; risks: inherited bias, too-simple data | Alpaca seed prompts | — |
| Data augmentation | **Evol-Instruct**: **in-depth evolving** (constraints, deepening, concretizing, more reasoning steps, complicating the input format) and **in-breadth evolving** (new long-tail instructions); the full **AutoEvol** rewriting prompt is reproduced; **UltraFeedback** evolves *answers* instead, scoring them on instruction-following, truthfulness, honesty, helpfulness | Evol-Instruct; **AutoEvol (Zeng 2024, 2406.00770)**; UltraFeedback | rewrite "can only add 10 to 20 words" |
| Building the book's dataset | **backtranslation** (generate the instruction from the answer) + **rephrasing** to fix messy raw text; chunk to **1,000–2,000 characters**; 3–5 instruction/answer pairs per chunk to multiply samples; GPT-4o-mini with **JSON mode** | — | 3,000 samples produced |
| Dataset formats | **Alpaca** (single-turn, optional `input`), **ShareGPT** / **OpenAI** (`conversations` list → multi-turn), **OASST**, and **raw text — which is just continual pre-training** | — | — |
| **Chat templates** | base models have **no** template so you may pick any; an instruct model must keep its own or performance degrades; **ChatML** (`<\|im_start\|>` / `<\|im_end\|>`), **Llama 3** (`<\|begin_of_text\|>`, `<\|start_header_id\|>`, `<\|eot_id\|>`), **Phi-3**, **Gemma**, **Alpaca**; at inference you append the assistant header to force an answer rather than a completion; **every whitespace and line break matters — use Jinja templates, not string concatenation** | ChatML; Jinja `add_generation_prompt` | — |
| **Memory arithmetic** | memory = parameters + gradients + optimizer states + activations; **params 4 B/param (FP32) or 2 (FP16/BF16), gradients 4, Adam optimizer states 8** → **16 bytes/param baseline** | — | **7B → 112 GB VRAM; 70B → 1,120 GB**; mixed precision + model parallelism ≈ **14–15 bytes/param** |
| Full fine-tuning | best quality, same next-token objective as pretraining, **destructive** (catastrophic forgetting) | model parallelism, gradient accumulation, 8-bit Adam, activation checkpointing | — |
| LoRA | W′ = W + BA with rank r; frozen base, swappable adapters, non-destructive, multi-task by swapping weights; **rank 8 as a start, up to 256**; **alpha commonly 2r** because the update is scaled α/r; dropout 0–0.1; target modules beyond Q and V — **K, O, MLP/feed-forward, linear output** | **LoRA (Hu 2021, 2106.09685)**; **LoRAX**, TGI, NVIDIA NIM for multi-adapter serving | 7B fine-tunable in **14–18 GB VRAM**; Llama 3 8B, rank 16, all modules → **42M trainable = 0.5196%** |
| QLoRA | 4-bit **NF4** base weights + LoRA adapters, **double quantization**, **paged optimizers** on NVIDIA unified memory | **QLoRA (Dettmers 2023, 2305.14314)** | peak memory −**75%** in the paper; 7B init 14 → **9.1 GB** (−35%), training 15.6 → **9.3 GB** (−40%); **~30% slower than LoRA**, quality nearly identical |
| Training parameters | **learning rate** (1e-6…1e-3, ~1e-5 typical start; 3e-4 used here) and **scheduler** (linear vs cosine, ~5% warmup, "both give the same performance"); **batch size 1–32** and **gradient accumulation** → *effective batch = batch × GPUs × accumulation steps*; **max sequence length** (512–4,096, up to 128k) and **packing** (needs attention masks so packed samples cannot attend to each other); **epochs 1–10, usually 2–5**, watch validation and early-stop; **optimizers**: AdamW, **adamw_8bit** (same quality, less memory, no speed gain), **AdaFactor**, **paged AdamW 8-bit**; **weight decay 0.01–0.1**; **gradient checkpointing** (recompute activations to save memory) | — | worked config: lr 3e-4 linear, batch 2 × accum 8 = **effective 16**, 3 epochs, max_seq 2048, adamw_8bit, wd 0.01, warmup 10 |
| Practice | choosing a model by **license, budget, performance**; **Llama 3.1 8B**; tooling **TRL** (HF, most current, FSDP/DeepSpeed), **Axolotl** (YAML configs), **Unsloth** (custom kernels, **2–5× faster, up to 80% less memory**, single-GPU only); upsampling a small custom set with a filtered general set so the template is learned; add the **EOS token** or the model never stops | Unsloth `FastLanguageModel`; TRL `SFTTrainer` | 3,000 llmtwin + **10,000 FineTome** samples; 95/5 split; **~50 minutes on an A100** |
| Reading the curves | **training loss** (fast drop then plateau; spikes ⇒ data/tokenizer/lr problems), **validation loss** (small gap is normal; rising eval while train falls = overfitting; both flat and high = underfitting), **gradient norm** (large or growing ⇒ instability; **gradient clipping** as the remedy) | — | — |

## Ch 6 · Fine-Tuning with Preference Alignment (p258–289) — **the DPO/RLHF chapter**
| Section | Topics | Named ideas | Numbers |
|---|---|---|---|
| Why preference alignment | SFT cannot capture **the long tail and the subjective**; the rejected answer is what carries the information — without it you just have an instruction set; use cases where preferences beat SFT: **chatbots, content moderation, summarization, code quality, creative writing, translation** (BLEU measures accuracy, not what a native speaker prefers) | — | — |
| Preference data | triple (instruction, **chosen**, **rejected**); **no standard format** unlike Alpaca/ShareGPT; multi-turn is rare and mostly unsupported by libraries | `mlabonne/orpo-dpo-mix-40k` example | **general-purpose alignment: millions of pairs** (Nvidia and Meta converging on multi-round pipelines with heavy synthetic data); **open-source community 10,000–100,000**; **task-specific 100–10,000**; "say you weren't trained by OpenAI" needs only **200–500 pairs**; **DPO is less destructive than SFT** and also used to *heal* models after merging/pruning |
| Generating preferences | the **2×2 of who generates and who evaluates**: human/human (best, unscalable, big labs only), human/LLM (rarely worth it), **LLM/human (the sweet spot — humans judge better than they write)**, LLM/LLM (scalable, needs prompt care, inherits the generator's bias); product feedback (like/dislike) as a preference source; **preferences can come free from the generation process** — a strong model for chosen and a weak/flawed model for rejected (how `Intel/orca_dpo_pairs` was built), or **human-written vs model-written** to copy a style | Anthropic **HH-RLHF**; OpenAI **Summarize from Human Feedback**; `argilla/Capybara-Preferences` (GPT-4 + open models) | — |
| Generation tips | prompt for diversity (ask for concise / detailed / key-points variants); **temperature as the diversity dial** — low for code, high for prose; **use several LLMs**, not one | — | — |
| Evaluating preferences | **pairwise ranking beats absolute scoring** and matches how humans compare; improve it with a **ground-truth answer** and **chain-of-thought reasoning**; when there is no ground truth, have the judge write a **grading note** (an expected-answer description) *before* judging; the same three biases as Ch 5 — **position, length, family/intra-model** — with the same three fixes (randomize order, few-shot calibration examples, a jury) | Databricks "grading notes" | — |
| The book's dataset | chosen = **verbatim extract from the human article**, rejected = **GPT-4o-mini generated answer** — so no judge is needed at all; two heuristic filters (**minimum length 100 chars**, must start uppercase and end in `.`/`!`/`?`) | — | **2,970 generated → 1,467 kept** after filtering |
| RLHF | history: **preference-based RL (Akrour 2011; Cheng 2011)** → **Christiano 2017** (learned reward models match hand-engineered rewards with far less human effort) → the term RLHF ~2021-22 → **InstructGPT (Ouyang 2022)**; the loop: **reward model** (Bradley-Terry over pairwise preferences) → **policy optimization (PPO)** → iterate; the reward model exists so humans don't have to be in every step; **PPO's reward is regularized by a KL-divergence term against the frozen model** so the token distribution cannot drift | **PPO (Schulman 2017, 1707.06347)**; Bradley-Terry; KL divergence; **RLHF survey (Kaufmann 2023, 2312.14925)** | — |
| **DPO** | the closed-form insight: solve the RLHF objective (max reward subject to a KL constraint) directly for the optimal policy, so preference learning becomes **a binary cross-entropy loss on the model's own log-probabilities** — no reward model, no RL, no sampling during training; **beta ∈ [0,1] controls how much the frozen reference matters** (0 = ignore the reference entirely; **0.1 is the usual default**); with LoRA/QLoRA the **reference model is just the adapter-free base**, so you load one model instead of two | **DPO (Rafailov 2023, 2305.18290)** — "Your Language Model is Secretly a Reward Model" | — |
| DPO vs RLHF | DPO: simpler, cheaper, more stable, less hyperparameter-sensitive, and usually matches RLHF; **PPO-style methods still have a higher ceiling at million-sample scale**; DPO still needs paired data and lacks RL's theoretical guarantees | — | — |
| Implementation | `DPOTrainer` + `DPOConfig` (TRL, patched by Unsloth); **only the prompt gets the chat template — chosen and rejected just get the EOS token**; `max_seq_length` splits into **max_prompt_length** and **max_length** | — | **beta raised to 0.5** (0.1 made the model too formal), **lr 2e-6** (vs 3e-4 for SFT), **1 epoch** (vs 3), r=32/alpha=32, batch 2 × accum 8; **over 20 models trained** to find these |
| **DPO's own failure mode** | *DPO makes models more verbose and more formal* — partly because chosen answers usually are — so imitating a casual voice means fighting the algorithm: low lr, few epochs, high beta | — | — |
| Metrics to watch | training/validation loss (**loss can crash to zero, meaning learning has stopped — watch it**), gradient norm, **chosen and rejected rewards** (mean log-prob difference vs the reference) and their **margin** (should rise then plateau), and **accuracy** — *100%, especially early, means the preference dataset is too easy* | — | — |
| Automating style evaluation | compare the **word distribution** of SFT vs DPO output against the ground-truth corpus — the SFT model overuses GPT-4o-mini tells like "delve into" | — | — |

## Ch 7 · Evaluating LLMs (p290–317)
| Section | Topics | Named ideas | Numbers |
|---|---|---|---|
| ML vs LLM evaluation | three structural differences: **numerical metrics** (one task, one metric vs many tasks, no shared metric), **feature engineering** (gone), **interpretability** (lost, partly recovered by asking the model to explain) | — | — |
| During pretraining | training loss, validation loss, **perplexity = exp(cross-entropy)** ("how surprised the model is"), gradient norm; running benchmarks this early risks **overfitting the evaluation** | — | — |
| After pretraining | **MMLU** (knowledge, 57 subjects), **HellaSwag** (plausible continuation), **ARC-C**, **Winogrande** (pronoun resolution), **PIQA** (physical common sense); for fine-tunes, watch the **delta** vs the base model — *a 10-point MMLU jump from fine-tuning is a contamination signal, not a win* | MMLU (Hendrycks 2020, 2009.03300) | — |
| After fine-tuning | **IFEval** (instruction following under constraints), **Chatbot Arena** (human head-to-head), **AlpacaEval** (automatic, correlates with the Arena), **MT-Bench** (multi-turn), **GAIA** (agentic, tools, browsing) | IFEval (2311.07911); **Length-Controlled AlpacaEval (2404.04475)**; GAIA (2311.12983); MT-Bench/Arena (2306.05685) | — |
| Benchmark honesty | public benchmarks can be gamed by training on test-like data; **human evaluation is itself biased toward long, confident, nicely formatted (Markdown) answers**; private sets are less scrutinized; **treat benchmarks as signals, not truth — trust agreement across several** | — | — |
| Domain-specific | pick per domain, often reusing translated general benchmarks plus native ones; three design principles: **complex, diverse, practical to run** | **Open Medical-LLM Leaderboard** (MedQA 1,273 / PubMedQA 500 / MedMCQA 4,183 / MMLU-medical 1,089 across 9 metrics), **BigCodeBench** (Complete vs Instruct, Pass@1 + Elo), **Hallucinations Leaderboard** (16 tasks, 5 categories: QA, reading comprehension, summarization, dialogue, fact checking — TruthfulQA, SQuADv2, TriviaQA, RACE, HaluEval, XSum, CNN/DM, FaithDial, MemoTrap, SelfCheckGPT, FEVER), **Enterprise Scenarios** (FinanceBench, LegalBench confidentiality, writing prompts, customer support, toxic prompts, enterprise PII — partly closed-source to prevent gaming), OpenKo / Open Portuguese / Open Arabic leaderboards; harnesses: **lm-evaluation-harness (EleutherAI)** and **lighteval (HF)** | — |
| Task-specific | narrow tasks map back to classic ML metrics — **ROUGE** for summarization, accuracy/precision/recall/F1 for classification and NER; otherwise build a **multiple-choice benchmark**; two ways to score it: **text generation** (model emits "B") vs **log-likelihood** over the full answer strings — the book **recommends generation**, because it mimics test-taking and **weak models over-perform on probability-based scoring** | — | MMLU abstract-algebra example reproduced |
| LLM-as-a-judge | for open-ended tasks; give ground truth if available, otherwise define explicit dimensions; use a **large** judge, iterate on the prompt, read the explanations, force structure (Outlines / JSON mode); biases: assertive and verbose answers, missing domain expertise, inconsistency, style preference → **combine metrics, use multiple judges, design the prompt against the bias** | HF cookbook LLM-judge; LangChain "aligning LLM-as-a-judge with human preferences" | 1–4 scale prompt reproduced |
| RAG evaluation | the system, not the model: **retrieval accuracy**, **integration quality** (compare answers with and without the context), **factuality and relevance** | — | worked customer-support example |
| **Ragas** | metrics-driven development; synthetically generates test sets using an **Evol-Instruct-style evolution** (reasoning complexity, conditionals, multi-context) and conversational samples; four metrics: **faithfulness** (decompose the answer into claims, check each against the context), **answer relevancy** (generate questions *from the answer*, mean cosine similarity back to the original question), **context precision** (are relevant items ranked high), **context recall** (is every ground-truth claim attributable to the retrieved context); plus production monitoring | **Ragas (Es 2023, 2309.15217)** | — |
| **ARES** | three stages — synthetic data generation (default `google/flan-t5-xxl`), **training high-precision classifiers** (default `microsoft/deberta-v3-large`), then evaluation with **confidence intervals**; vLLM for local runs; cheaper and more consistent than judges once trained | **ARES (Saad-Falcon 2023, 2311.09476)** | — |
| The book's own evaluation | generate with **vLLM** (much faster than transformers for batch generation), then judge with GPT-4o-mini on **accuracy** and **style**, each on a **3-point Likert scale with the levels spelled out** and **two worked style examples** in the prompt; parse JSON best-effort with None fallbacks; parallel batches; push intermediate results so failures don't cost the run | — | 334 test prompts; sampling `temperature 0.8, top_p 0.95, min_p 0.05, max 4096`; **results — accuracy: SFT 2.45, DPO 2.46, Llama-3.1-8B-Instruct 2.62; style: DPO 2.12, SFT 2.04, Instruct 1.86**; the Instruct model's accuracy edge attributed to **10M post-training samples vs 13,000** |
**The lesson in the numbers:** the fine-tune *lost* on accuracy and *won* on style — exactly the trade the project intended, and only visible because the rubric had two axes.

## Ch 8 · Inference Optimization (p318–345) — **the other outstanding chapter**
| Section | Topics | Named ideas | Numbers |
|---|---|---|---|
| The core problem | decoder-only inference in three steps: tokenize+embed, **compute K/V for every input token (parallel, saturates the GPU)**, then **generate tokens one at a time (inherently sequential, wastes the hardware)**; the metrics that matter: **latency (time to first token), throughput (tokens/s), memory footprint** | — | claims of **2–4× speedups** from combining the techniques |
| **KV cache** | cache the per-token key/value pairs instead of recomputing the whole prefix each step; **size = 2 · n_tokens · n_layers · n_heads · dim_head · bytes**; the cache is dynamic, which **blocks `torch.compile`** → **static KV cache** pre-allocates the maximum and unlocks compilation | `generation_config.cache_implementation = "static"` + `torch.compile(mode="reduce-overhead", fullgraph=True)` | **>2 GB for a 7B model at 16-bit beyond 2,048 tokens**; static cache + compile ⇒ **up to 4× faster forward pass**; not supported by every architecture |
| Continuous batching | naive batching waits for the **longest** request in the batch; **continuous / in-flight batching** evicts a finished sequence and admits a new one immediately; needs periodic pauses to run **prefill** for waiting requests — tuned by a **waiting-served ratio** | — | native in TGI, vLLM, TensorRT-LLM |
| **Speculative decoding** | a small draft model proposes **5–10 tokens in parallel**, the big model **verifies in one pass**, keep the longest matching prefix; **both models must share a tokenizer**; **prompt lookup decoding** substitutes n-grams from the prompt for the draft model (great for summarization); **Medusa** adds speculation heads to the model itself (Medusa-1 trains heads only, Medusa-2 trains both) | Leviathan et al.; **Medusa (Cai 2024)**; `assistant_model=` and `prompt_lookup_num_tokens=` in `generate()` | a **90% draft match ⇒ 3–4× speedup**; demo uses Qwen1.5 1.8B main + 0.5B draft; Medusa lets a 70M model approximate a 7B one |
| **PagedAttention** | attention is **quadratic in sequence length** and the KV cache blows up; borrow **virtual memory paging from operating systems**: split the KV cache into fixed-size blocks, no contiguous allocation, and **share blocks across sequences from the same prompt** (parallel sampling, beam search) | **PagedAttention (Kwon, Li et al. 2023)**, first in **vLLM** | **memory overhead −55%, throughput +2.2×** |
| **FlashAttention-2** | tile the matrices so blocks fit in **on-chip SRAM** instead of HBM; **online softmax** with a running max and running sum removes the need to materialize the full score matrix; recomputation in the backward pass turns memory from **quadratic to linear** in sequence length | **FlashAttention-2 (Tri Dao 2023)**; `attn_implementation="flash_attention_2"` | — |
| Data parallelism | replicate the model, split the data; good for concurrent requests; **useless once the model doesn't fit one GPU**, and replication eats the memory that batches need | — | — |
| **Pipeline parallelism** | split the model **by layer** across GPUs; biggest memory saving; introduces **pipeline bubbles** (idle GPUs waiting for activations) → **micro-batching** keeps them busy | **GPipe (Huang 2019)**; Megatron-LM, DeepSpeed/ZeRO, **PiPPy** | only some inference engines support it (TensorRT-LLM) |
| **Tensor parallelism** | split the **weight matrices inside a layer**; inputs broadcast, partial results combined by **all-reduce**; especially natural for attention heads; **LayerNorm and Dropout can't be split this way** → replicate, or use **sequence parallelism** on the sequence dimension; **needs fast interconnects**, so it doesn't cross nodes well | **Megatron-LM (Shoeybi 2019)** | — |
| Combining | the three are **orthogonal**: pipeline for memory, tensor for latency; in practice split depth-wise into a few pipeline stages with tensor parallelism inside each | — | — |
| Quantization basics | **PTQ vs QAT**; the anatomy of a float (**sign, exponent = range, significand = precision**), value = (−1)^sign × base^exponent × significand; **FP32 vs FP16 vs BF16 — networks prefer range over precision, which is why BF16 wins where hardware supports it** (Ampere yes, Turing no); **absmax** quantization (symmetric, scale 127/max\|X\|) and **zero-point** quantization (asymmetric, scale 255/range plus an offset), both with worked arithmetic and PyTorch code | — | worked example: 0.1 in [−3.0, 3.2] → **absmax 4** (dequantizes to 0.1008, error 0.0008) vs **zero-point −1**; **a >30B model quantized to 2–3 bits can beat a 7–13B model at the same memory footprint** |
| Outliers and LLM.int8() | naive quantization breaks on **outlier features — ~0.1% of values** that cannot be discarded; **LLM.int8()** splits the matmul: outlier columns in **FP16**, the rest in **INT8**, then recombines | **LLM.int8() (Dettmers 2022)**; **NF4** (Dettmers 2023) via bitsandbytes | memory ≈ **2× smaller**, degradation **<1%**, but **~20% slower** inference |
| **GGUF / llama.cpp** | runs on CPUs and phones, offloads layers to GPU, works with FlashAttention-2 and speculative decoding; **block-wise quantization**: Q4_0 (32 values/block, scale from the block max), Q4_1 (adds the block minimum), **Q4_K (super-blocks of 8 blocks × 32 values, scales and minima themselves quantized to 6 bits)**, **i-quants (IQ4_XS) inspired by QuIP#** with E8-lattice magnitudes | Georgi Gerganov, **llama.cpp**; LM Studio, Text Generation Web UI, llama-cpp-python | the full ladder **IQ1 → Q8_0** with quality labels; conversion to FP16 first, then quantize (**~1 hour on a T4**) |
| **GPTQ / EXL2** | GPU-only, faster than llama.cpp; GPTQ refines **OBQ** with a **Cholesky decomposition of the inverse Hessian** and **lazy batch updates**; **EXL2 mixes precisions per layer** to hit an arbitrary target bitrate (2.3, 3.5, 6.0 bits/weight), choosing per-matrix by measured quantization error against a **calibration set (WikiText-103)** | **GPTQ (Frantar 2023)**; **ExLlamaV2** | GPTQ is 4-bit only; **EXL2 runs a 70B model on one 24 GB GPU at 2.55 bits** |
| Other | **AWQ** protects salient weights chosen by **activation magnitude, not weight magnitude**, with per-channel scaling and no backprop, so it can't overfit the calibration set; **QuIP#** and **HQQ** for the 1–2 bit regime | **AWQ (Lin 2023)** | — |
| Engine comparison (Table 8.1) | continuous batching: all three · **speculative decoding: TGI only** · FlashAttention-2, PagedAttention, tensor parallelism: all three · **pipeline parallelism: TensorRT-LLM only** · GPTQ: vLLM + TensorRT-LLM · **EXL2: none of them** · AWQ: all three | TGI, vLLM, TensorRT-LLM | — |

## Ch 9 · RAG Inference Pipeline (p346–383) — skimmed (RAG-course territory)
Implements the retrieval half of the RAG system: **query expansion** (generate N paraphrases and search with each), **self-querying** (extract metadata like author name from the query and filter on it), a **CrossEncoderModelSingleton** for re-ranking, an `EmbeddedQuery` type, the retrieval module, and the assembled inference RAG flow.

## Ch 10 · Inference Pipeline Deployment (p384–429)
| Section | Topics | Numbers |
|---|---|---|
| The four requirements | **throughput, latency, data, infrastructure** — and they trade against each other; latency = network I/O + (de)serialization + model inference; **without batching, lower latency ⇒ higher throughput (100 ms → 10 RPS; 10 ms → 100 RPS); with batching the relationship inverts** (20 requests in 100 ms = 200 RPS; 60 in 200 ms = 300 RPS at *worse* latency); optimizing hard for latency leaves the GPU idle, which raises cost per request | Google 2016: **53% of mobile visits are abandoned past 3 seconds** |
| The three deployment types | **online real-time** (REST — accessible but JSON-slow, public-facing; **gRPC/protobuf** — faster, compiled, internal; WebSockets to stream tokens), **asynchronous** (queue + polling or push; absorbs spikes without scaling the fleet — 10 RPS → 100 RPS handled by the same two VMs, just later; right for jobs over ~5 minutes), **offline batch transform** (pull from S3/BigQuery, process, write back; cheapest and simplest; the delay between computing and consuming a prediction is the whole question — fine for a nightly film recommender, fatal for a social feed) | — |
| Monolith vs microservices | monolith is simpler but **forces one machine to be good at both GPU and CPU work and locks every component to one tech stack**; microservices let the **GPU service scale independently of the CPU business logic**, each in its own stack, at the cost of deployment complexity and network hops; **start monolithic but keep the modules genuinely separate (two Python modules or two packages glued at a service layer) or the migration means a rewrite** | A10G for an 8B quantized model, A100 for 30B |
| The book's choice | online real-time + microservices: **FastAPI business service** (RAG retrieval and augmentation, prompt template, prompt-monitoring emit) + **SageMaker LLM microservice** (generation only, via **Hugging Face Deep Learning Containers**) | training the model costs up to **$100** |
| SageMaker anatomy | **endpoint** (the hosted API), **model** (weights + logic artifact), **endpoint configuration** (instance type and count), **inference component** (binds model+config to an endpoint; several models per endpoint, each with its own resources) | — |
| Training vs inference pipeline | training reads **offline, batched, versioned** data and emits weights to the registry; inference reads an **online low-latency store** and emits predictions to users; training needs maximum GPU/VRAM, inference needs latency; **the preprocessing must be identical in both or you get training–serving skew** | — |
| Autoscaling | GPU replicas idle = money burned, and spikes are exactly when new users arrive; an **Application Load Balancer** (round-robin by default) fronts the replicas so scaling is invisible to clients; **register a scalable target** (resource ID, namespace, dimension, **MinCapacity ≥ 1** and MaxCapacity) then **create a scaling policy** (**TargetTrackingScaling** on a metric like `SageMakerInferenceComponentInvocationsPerCopy` or GPU utilization ~70%, with **cooldown periods** to stop thrashing) — AWS manages the CloudWatch alarms for you; the two failure modes are **over-scaling (cost)** and **under-scaling (user experience)**, so tune it like a hyperparameter under stress tests; **and always delete the endpoint when you're done** | example targets: 1 replica idle, 2 at 10 RPS, 20 at 100 RPS |

## Ch 11 · MLOps and LLMOps (p430–489) + Appendix (p490–505)
| Section | Topics | Numbers |
|---|---|---|
| DevOps → MLOps | in DevOps everything is triggered by **code**; in ML a build can be triggered by **code, data, or model** changing independently; definition used: **"MLOps is the extension of DevOps that makes data and models first-class citizens while preserving the DevOps methodology"** | — |
| MLOps components | **model registry**, **feature store** (Hopsworks, Tecton, Featureform), **ML metadata store**, **pipeline orchestrator** — plus source control and CI/CD | — |
| **The six MLOps principles** | **automation/operationalization** (manual → **CT** → CI/CD), **versioning** (Git for code; **semantic versioning + a registry for models**; **DVC or artifacts for data**, harder because it depends on structure and scale), **experiment tracking**, **testing**, **monitoring**, **reproducibility** (*seed everything — training and inference are non-deterministic*) | — |
| Roles | **DS builds the model → ML engineer builds the layer that makes it modular, stateful and exposed → MLOps engineer puts that on infrastructure**; the middle layer is what separates a proof of concept from a product; in small teams one person wears all three hats | — |
| LLMOps = MLOps at scale | what changes: **massive data** (GPT-4 ≈ **13 trillion tokens ≈ 10 trillion words**), parameter management, **multi-GPU training (data/model/tensor parallelism) because the model doesn't fit one GPU**, and cost (**GPT-4 training ≈ $100M** per Altman) — which is precisely why **almost nobody trains from scratch** and the field runs on **foundation model + prompt engineering / fine-tuning / RAG / distillation** | — |
| Human feedback | the thumbs-up/down button *is* a preference-data collection pipeline → RLHF/DPO | — |
| **Guardrails** | **input guardrails**: leaking private data to external APIs, **jailbreaking / prompt injection**, violent or unethical requests. **output guardrails**: malformed output (broken JSON/YAML), toxicity, hallucination, and **sensitive information leaking out of the model's memorized training data or your RAG store** (Copilot emitting AWS keys is the cited example); the 2023 "adopt a bad persona" ChatGPT jailbreak is quoted; tools: **Galileo Protect, OpenAI Moderation API**; **guardrails cost latency — a retry doubles response time, so run generations in parallel and pick one instead** | — |
| **Prompt monitoring** | a prompt is a new first-class entity to log: user input, prompt template, input variables, response, token counts, latency; the **latency vocabulary — TTFT (time to first token), TBT (time between tokens), TPS (tokens per second), TPOT (time per output token), total latency**; log **full traces** (every intermediate step, retrieved documents, final prompt, with tokens/latency/cost per step) so a failure can be pinned to a step; tools **Opik, W&B, Langfuse** | — |
| Cloud deployment | serverless MongoDB + Qdrant + **ZenML cloud** spinning up **ECR (images) + S3 (artifacts) + SageMaker orchestrator**; Docker image → ECR → trigger pipelines; **CI (GitHub Actions: formatting, linting, tests) → CD → CT** pipelines, plus alerting | — |
| **Appendix — testing** | six kinds: **unit, integration, system, acceptance (UAT), regression, stress** — with the sharp observation that **regression testing is not a phase, it runs inside all the others**; test **data, model and code**; pytest | — |
| **Appendix — monitoring** | **system metrics** (latency, throughput, error rate, CPU/GPU, memory) vs **model metrics** (accuracy/precision/F1 plus business metrics like ROI and click rate); **compute metrics over sliding windows, not cumulatively, or history hides the incident**; when ground truth is late or absent, use a **proxy metric** | — |
| **Appendix — drift** | **data drift** P(X) ≠ P_ref(X) (covariate shift — can also be a pipeline bug or schema change, not just the world changing), **target drift** P(y) ≠ P_ref(y) (sometimes fixable by changing the head instead of retraining), **concept drift** P(y\|X) ≠ P_ref(y\|X) — **gradual, sudden, or periodic** (the American-vs-European car-size example); detect with a **reference window vs test window** and a hypothesis test: **Kolmogorov–Smirnov for continuous, chi-squared for categorical**, univariate per feature; **text embeddings need a multivariate test**; `alibi_detect.cd.KSDrift` | — |

# S4 — Ken Huang et al., *LLM Design Patterns: A Practical Guide to Building Robust and Efficient AI Systems* (Packt, 2025). EPUB, **30 chapters in 5 parts**. Complete.

**How this source was read and how far to trust it.** Full heading tree extracted for all 30 chapters; chapters 1, 2, 12, 16, 17, 18, 19, 22, 23, 25, 30 read in full; the rest read at section granularity with targeted passages. **Reliability caveat (must be stated in the Charter):** this book is broad but shallow, and several code listings are wrong or non-existent as APIs — e.g. Ch 2 calls `GPT4LMHeadModel.from_pretrained("GPT4")` and `GPT4Tokenizer`, which do not exist; Ch 19's `DPOTrainer` call signature does not match TRL; typos like "BER" for BERT. **Use it as a topic map and a vocabulary source, never as a source of code, numbers, or API detail.** Almost every mechanism it names is covered more accurately by S1 (Raschka) or S3 (the Handbook).

## The catalogue (its real value: 29 named patterns over the whole lifecycle)
| Part | Chapters | Patterns |
|---|---|---|
| 1 · Data foundation | 2–6 | **data cleaning** (quality issues incl. PII; preprocessing; multilingual and **code-mixed / code-switching** data with token-level language ID; deduplication via exact match, **shingling**, **LSH**; automated pipelines; validation) · **data augmentation** (synonym replacement, **back-translation** and **cross-lingual back-translation**, T5/mT5 generation, LLM-generated data, semantic preservation via sentence embeddings, quality filtering, human-in-the-loop; evaluated with **perplexity, task metrics, diversity metrics**) · **handling large datasets** (sampling, distributed processing, sharding, storage formats, streaming, memory-efficient loading) · **data versioning** · **dataset annotation** (strategies per task, platforms, quality management, crowdsourcing, semi-automated labeling, annotation bias) |
| 2 · Training and optimization | 7–13 | **training pipeline** · **hyperparameter tuning** (manual vs grid/random, **Bayesian optimization**, **population-based**, **multi-objective**) · **regularization** (L2, dropout, layer-wise adaptive, gradient clipping and noise injection, regularization when fine-tuning, plus **stochastic weight averaging, sharpness-aware minimization, differential-privacy regularization, FGSM, Lookahead**) · **checkpointing and recovery** (frequency vs storage, formats, distributed checkpointing, versioning) · **fine-tuning** (freezing/unfreezing, LR scheduling, domain-specific, few/zero-shot, **continual fine-tuning and catastrophic forgetting**) · **pruning** · **quantization** |
| 3 · Evaluation and interpretation | 14–19 | **evaluation metrics** (MMLU, SuperGLUE, TruthfulQA, ARC, GSM8K, coding, conversational, commonsense; custom benchmarks) · **cross-validation** (pretraining vs fine-tuning splits, **stratified sampling**, **time-based splitting**, oversampling/weighting, few- and zero-shot evaluation, domain and task generalization, continual-learning evaluation) · **interpretability** · **fairness and bias** · **adversarial robustness** · **RLHF** |
| 4 · Advanced prompting | 20–25 | **chain-of-thought** · **tree-of-thoughts** (search strategies, pruning and evaluation) · **ReAct** (LangChain implementation, document store, LCEL agents, `ReActSingleInputOutputParser`, `AgentExecutor`) · **ReWOO — Reasoning WithOut Observation** (LangGraph) · **reflection** (self-reflection prompts, iterative refinement, error correction) · **ART — automatic multi-step reasoning and tool use** (task decomposition, tool integration, automatic tool selection) |
| 5 · Retrieval and knowledge | 26–29 | **RAG** · **graph-based RAG** (graph knowledge representation, graph embeddings, query expansion over graph structure) · **advanced RAG** (multi-step/iterative retrieval, **adaptive retrieval by context and task**, **meta-learning for retrieval**, ambiguity and uncertainty, scaling to very large knowledge bases) · **evaluating RAG** |
| — · Agentic | 30 | **agentic patterns** |

## Chapters read in full — what is actually worth taking
| Chapter | Content | Named ideas |
|---|---|---|
| **12 Pruning** | **magnitude-based pruning** (L1, `prune.l1_unstructured`, mask + forward pre-hook so sparsity survives updates); **unstructured** (fine-grained but produces sparse matrices *hardware doesn't like*) vs **structured** (whole neurons/channels/heads — worse immediate accuracy, **real speedups on real hardware**); **iterative pruning** (10% every 10 epochs so the model can "heal"); **during training vs post-training**; fine-tune afterwards at a **lower learning rate**; metrics to watch: parameter reduction, inference speed, memory, **perplexity change**, task performance; combining with **quantization** and **knowledge distillation** (prune the student, distill from the unpruned teacher) | L1/L2 norms; `ln_structured` |
| **16 Interpretability** | **attention visualization** — and the honest caveat that **attention maps are not explanations**: they can be diffuse, misleading, or *manipulated without changing behaviour*; **probing** (train a small classifier on internal representations) with the layer hierarchy — **lower layers syntax and token identity, middle grammar and structure, upper semantics/reasoning/factual recall**; **attribution** via **integrated gradients** (integrate gradients along a path from a baseline to the input) with the caveat that gradient methods are **noisy and inconsistent across runs**; **mechanistic interpretability** — reverse-engineering circuits, **activation patching**, causal intervention on neurons, studying how capabilities like **induction** or negation are implemented; the **compression ↔ interpretability trade-off** (pruning/quantization obscure internal representations; LoRA preserves the base weights and so preserves some interpretability) | integrated gradients; activation patching; circuit analysis; DistilBERT distillation |
| **17 Fairness and bias** | a genuinely useful **taxonomy of bias**: **representation, linguistic** ("assertive" vs "aggressive" for the same behaviour), **allocation, quality of service** (translation quality by language), **stereotypical**, **explicit vs implicit**, **hidden**; metrics **demographic parity difference**, **equal opportunity difference**, equalized odds; detection via **gender direction in word embeddings**, sentiment-by-group, **coreference/occupation association**; mitigation via **counterfactual data augmentation (gender swapping)**, bias fine-tuning, **fairness-aware training with a penalty term weighted by λ**; ethics: diverse teams, contextual deployment, auditing, and the warning that **feedback loops compound bias over time** | — |
| **18 Adversarial robustness** | attack levels **character / word / sentence**, plus **universal adversarial triggers** (a fixed nonsense phrase like "invisible carpet notebook" that flips predictions across many inputs); **adversarial training** with **FGSM** perturbations in embedding space, loss = ½(clean + adversarial); evaluate with **clean vs adversarial accuracy and F1** side by side; the three trade-offs (compute cost, **clean accuracy can drop**, robustness may not transfer to unseen attacks); deployment practice: input attack detection, output post-processing, logging, **red teaming** | FGSM; universal triggers |
| **19 RLHF** | the three components — **base model, reward model, policy optimization**; the reward model as a **learnable proxy for human judgement** trained on pairwise comparisons; **PPO** and what "proximal" means (**a clipped objective so no single update moves the policy too far**); **DPO** as the simpler alternative (no reward model, no RL loop, better with limited preference data, avoids reward-model confounds); **scaling RLHF** via distributed training, **gradient checkpointing**, **mixed precision with an FP32 master copy and dynamic loss scaling**; limitations — **reward hacking**, limited feedback coverage, local optima, cost of human feedback; a **constrained PPO step** that *skips the update entirely* when a separate constraint model flags the output, keeping the safety signal decoupled from the reward | PPO; DPO; DeepSpeed, Megatron-LM; NVIDIA Apex |
| **30 Agentic patterns + the closing "future directions"** | the agent built up in layers: base agent (goal, memory, perceive/think/decide/act) → **hierarchical goals with a goal stack and generated plans** (with the warning that **LLM plans need validation — rule-based checks, simulation, human review, formal verification, API/type validation**) → **episodic memory with embeddings and cosine-similarity retrieval** (capacity-bounded; quality depends entirely on the embeddings) → **action scoring on relevance × success probability × impact** → **Q-learning over state-action pairs with explore/exploit** → **ethical constraints as check functions that veto actions**; future: multi-agent collaboration, lifelong memory, robotics, meta-learning, explainability, **sandboxing and simulation environments (E2B)**. **The most current material in the whole source:** **MoE with a routing network activating sparse experts (DeepSeek)**, **GRPO** — group-relative policy optimization: sample several responses per prompt, average their reward as the baseline, **no value network**, KL penalty for stability (DeepSeek) — **SPCT** (self-principled critique tuning: the model critiques its own outputs against stated principles), **scalable alignment using data from smaller models to align larger ones**, **OpenAI's Preparedness Framework** (pre-deployment evaluation for disallowed content, jailbreak robustness, hallucination, bias, CBRN, persuasion, cyber, autonomy; red teaming and third-party audits), and **instruction hierarchy** — training the model to prioritize the system message over conflicting user instructions as a defence against prompt injection | **MoE**, **GRPO**, **SPCT**, Preparedness Framework, instruction hierarchy |

**Cited works worth keeping:** Attention Is All You Need · **Scaling Laws for Neural Language Models (2001.08361)** · Jurafsky & Martin, *Speech and Language Processing* (free, updated) · Gamma et al., *Design Patterns* (the Gang of Four) · OpenAI Preparedness Framework.

# S5 — Aditya Pandey, Sarthak Chaubey et al., *LLMs in Enterprise: Design strategies, patterns, and best practices* (Packt, 2025). EPUB, **14 chapters in 3 parts**. Complete.

**How this source was read and how far to trust it.** Full heading tree for all 14 chapters; chapters 1, 10, 11, 14 read in full prose; 12 and 13 read at section granularity. **Reliability caveat for the Charter:** this book quotes a very large number of precise figures attributed to named institutions ("OpenAI's 2024 technical paper revealed GPT-4's MoE activates 28% of parameters", "Google DeepMind: modular systems achieve 2.1–3.4× better cost-performance", "IBM Watsonx: 45% cloud cost reduction", "Mayo Clinic federated diagnosis across 37 hospitals") **without verifiable citations, and several of these papers do not appear to exist publicly.** Treat every enterprise statistic in this source as *unverified* — use the ideas, re-source the numbers, or drop them. Its genuinely strong chapter is **Ch 10 on inference engines**, which is the most concrete engine comparison across all five sources.

## Part 1 — Foundations
| Chapter | Content worth keeping | Numbers |
|---|---|---|
| **1 Introduction to LLMs** | history from **n-grams → rule-based (70s–80s) → HMMs and decision trees (90s–2000s) → RNN/LSTM → transformer (2017)**; the "OpenAI invented language models" misconception named and corrected; embeddings lineage **Word2Vec / GloVe / FastText**; **the LLM evolutionary tree**; DALL-E as GPT-3 extended to images. **MoE**: sparse MoE layers replace dense feed-forward blocks, a **gate/router network** sends each token to a subset of experts — traced back to **Jacobs et al. 1991, "Adaptive Mixture of Local Experts"**, and popularized by **Mixtral 8x7B**. **The four-stage GPT assistant recipe** (base model → SFT → reward modeling → RL) with the pretraining details: corpus assembly (CommonCrawl, Wikipedia, books, GitHub, StackExchange), **BPE tokenization then integer mapping**, and the **hyperparameters that define a model — vocabulary size, context length, number of layers, number of heads, layer width**; the autoregressive loop explained token by token | vocabulary "tens of thousands", worked example **50,257**; context "2,000 to 1,000,000" — **Gemini 1.5 Pro is the first with a 1,000,000-token window**; pretraining = "thousands of GPUs for weeks, often several million dollars" |
| **2 LLMs in enterprise** | application areas (financial services, healthcare, retail, education) and the **challenge taxonomy**: memory requirements and management, pruning and quantization, parallelism, model reliability, continuous updates, infrastructure, **data privacy and security, regulatory compliance, cost (initial vs ongoing vs ROI)**, bias, and employment impact | — |
| **3 Advanced fine-tuning** | the same pretraining → SFT → **reward modeling → RL** ladder, then the three integration routes for a business: **pre-built APIs, in-context/K-shot prompting, and fine-tuning**; a Llama fine-tuning walkthrough; strategies for data selection, tuning, and monitoring; RAG as the fourth route | — |

## Part 2 — Advanced patterns
| Chapter | Content worth keeping | Numbers |
|---|---|---|
| **4 RAG pattern** | unusually good on the **information-retrieval foundations**: history of IR, **inverted indexes**, **ANN search**, **hybrid term+embedding retrieval**, precision/recall/relevance, **semantic vs lexical similarity**, dimensionality and vector spaces, **domain adaptation of embeddings**, **vector quantization and HNSW graphs**, chunking strategies | — |
| **5 Customizing contextual LLMs** | external memory for context; RAG by industry (legal, healthcare, finance, customer service, education, real estate); the four enterprise pain points — **integration complexity, latency, cost, factual incorrectness**; **hybrid search = BM25 keyword + vector**, implemented with LangChain + LanceDB | — |
| **6 Prompt engineering** | the prompt as **a control mechanism and an interface to model capabilities**; **the economics of prompt engineering** and the cost of getting it wrong (healthcare case study); structured prompt development and measurement; **structure as a lever — hierarchical organization, delimiters, numbered lists, keyword optimization, domain terminology** | — |
| **7 Evaluating LLM applications** | evaluation patterns for accuracy, **response variability and robustness**, coherence/fluency/UX, ethics and bias, **longitudinal and adaptive evaluation**; enterprise-specific problems: **scalability of evaluation, emergent abilities defeating fixed benchmarks, model updates moving the target, interaction with real tasks**; building novel benchmarks; **interactive and multi-agent evaluation**; **BERTScore** for dialogue; bridging automated and human evaluation | — |
| **8 The data blueprint** | acquisition, preprocessing, augmentation, **governance**; scalability, quality variability, ethical and legal constraints; **synthetic data generation** and tools; duplicate detection, noise reduction, missing data; **DeepSeek's data strategy** as the case study | — |
| **9 Managing deployments** | latency requirements and the levers: **high-performance hardware, efficient model design, edge computing, caching — with a KV-cache implementation walked through**; throughput optimization and the speed/accuracy balance; **compliance and governance** (data-privacy law, industry regulation, security protocols, **performance and compliance auditing, transparent reporting**, feedback mechanisms); forex-analysis case study | — |
| **10 Accelerated and optimized inferencing** ⭐ | **the best engine-by-engine comparison in the whole source set.** Constraints named precisely: **VRAM (Llama-70B in FP16 > 140 GB)**, **quadratic attention**, **KV cache growing linearly with sequence length**, inefficient parameter utilization. Techniques: FP16, INT8, **GPTQ, AWQ, GGUF**, KV-cache optimization, **dynamic batching**. **vLLM** — PagedAttention as OS-style paging (virtual-memory abstraction, non-contiguous allocation, block mapping) + continuous batching. **TensorRT-LLM** — graph capture via TorchScript, **operator fusion**, **kernel auto-tuning per GPU architecture**, mixed precision, PTQ and QAT with INT8 calibration. **Triton Inference Server** — multi-framework backends (TorchScript, torch.fx, SavedModel, ONNX, TensorRT), model repository with versioning and hot reload, dynamic batching, **ensemble scheduling for model pipelines**, streaming API. **MLC/TVM** — JIT and AOT compilation targeting **CUDA, ARM NEON, AVX, Metal**, plus a **WebAssembly backend for in-browser inference**. **Distributed**: tensor + pipeline parallelism, **NVIDIA Dynamo's disaggregated compute/memory pools**. **Hybrid**: quantization + KV caching; **speculative decoding** (and the vendor names for it — **OpenAI "Predicted Outputs", Medusa**). **Operational reality**: **TGI's licence moved off Apache 2.0**, pushing users to MIT-licensed vLLM; cost management by precision, batching strategy, and dynamic routing | **vLLM vs PyTorch on Llama-2 70B: TTFT 152 ms vs 261 ms (−42%), inter-token 35 ms vs 54 ms (−35%), 2–5× throughput**; **TensorRT-LLM on Llama-2 7B/A100: 12 ms vs 42 ms at batch 1 (3.5×), 2,300 vs 800 tok/s, INT8 3,100 tok/s, INT8 accuracy loss ~0.8–1%**; **Triton ~40% more throughput than vLLM on uniform batches, vLLM 25–30% more on variable-length streams**; **MLC on Android Llama-7B ~140 ms vs CTranslate2 220 ms, 30–50% less memory**; **GPTQ 4-bit ≈1–2% perplexity cost**; speculative decoding **2–3×** with a draft model **10–20% the size**; test hardware **A100 80 GB / A6000 48 GB / T4 16 GB** |
| **11 Connected LLMs** | why monolithic models fail (the **generalist efficiency paradox**) and why RAG alone fails (**shallow integration, conflicting retrieved sources**); **hierarchical pipelines: gatekeeper → router → domain expert**; **routing logic** — learned policies beat rules, **embedding/vector-similarity routing (FAISS)**, **semantic routers clustering by intent**, **RL-based routing**; MoE as the in-model version of the same idea; **agentic workflows** (AutoGPT, BabyAGI, Microsoft Autogen) with the honest failure list — **hallucination compounding over long workflows, overplanning, getting stuck**; **human-in-the-loop checkpoints** (LangChain checkpoints, CrewAI audit trails); **distributed LLM networks**, cross-model knowledge sharing, **federated learning** (Flower framework, differential privacy, JPMorgan and Mayo Clinic examples); **orchestration** — LangChain/LlamaIndex, and **DSPy's learnable, programmable pipelines** that optimize their own prompts and coordination; **shared KV caches across models** and distributed vector DBs for context passing | (all figures unverified — see caveat) |

## Part 3 — GenAI in the enterprise
| Chapter | Content worth keeping |
|---|---|
| **12 Monitoring LLMs in production** | **LLM observability**; key metrics; tools; **failure modes and fallbacks, testing strategies, redundancy architectures**; security — **data-leakage prevention, adversarial threats, auditability**; cost drivers and scaling architectures; global deployment |
| **13 Responsible AI** | the four pillars **fairness, transparency, accountability, safety**; why LLMs are ethically distinctive; **the regulatory landscape**; a three-phase implementation framework — **fairness by design → transparency instrumentation → continuous compliance**; mitigation at three points: **pre-processing (data sanitization), in-process (adversarial debiasing), post hoc (calibrated output filtering)**; **differential privacy** and **federated learning** for sensitive domains; a **jailbreaking attack taxonomy** and real-time moderation; explainability tools, model documentation, **decision-traceability architecture** |
| **14 Emerging trends and multimodality** | why multimodality matters (the radiologist analogy: images *plus* history *plus* labs); the landscape by pair — **text+image (CLIP, Flamingo)**, **text+audio (Whisper, AudioLM/SoundStream)**, **text+video (Phenaki's C-ViViT, VideoPoet treating video as "another language")**; architecture in three parts — **unified embedding spaces** ("an intermodal Rosetta Stone"), **cross-modal attention** (Flamingo's **gated cross-attention**), **modality-specific encoders/decoders**; training paradigms — **contrastive learning** (self-supervised, no labels needed) vs **joint pretraining (Gemini) vs modular fine-tuning (Flamingo)** and the hybrid middle; **emergent multimodal properties** (GPT-4V reading charts, following pointing gestures, explaining visual jokes); **fusion techniques: Q-Former and Perceiver Resampler**; tokenization across modalities; a medical multimodal use case. Numbers cited: **Whisper trained on 680,000 hours of multilingual audio**; Gemini claimed **58% better cross-modal QA than PaLM-E and Flamingo** (unverified) |

**Verifiable references this source supplies:** CLIP (Radford 2021) · **Flamingo (Alayrac 2022, 2204.14198)** · **Whisper (Radford 2023)** · **AudioLM (Borsos 2022)** · GPT-3 few-shot (Brown 2020) · **Jacobs et al. 1991, Adaptive Mixture of Local Experts** · DSPy (Khattab) · LlamaIndex (Liu 2023).

---

## 2. Merged topic list, deduplicated, with coverage depth per source

**Legend.** **D** = definitive (built, derived, or worked end to end) · **T** = thorough (mechanism explained, not just named) · **S** = survey (named, defined in a paragraph or less) · **—** = absent.
The final column is the Phase 2 input: whether the provided books alone can carry the topic to the depth §1 demands.

### A. Foundations and history
| Topic | S1 | S2 | S3 | S4 | S5 | Books sufficient? |
|---|---|---|---|---|---|---|
| What an LLM is; AI ⊃ ML ⊃ DL ⊃ LLM; GenAI | T | S | S | T | T | Yes |
| History: n-grams → rule-based → HMM/decision trees → RNN/LSTM → transformer | S | S | — | T | **T** | Yes (S5 best) |
| Why RNN/LSTM fail on long dependencies (the hidden-state bottleneck) | **D** | — | — | S | S | Yes |
| Encoder-only vs decoder-only vs encoder-decoder (BERT / GPT / T5) | T | T | S | S | S | Yes |
| Emergent behavior; zero-shot and few-shot as emergent | T | T | — | T | S | Partly — no mechanism anywhere |
| Scaling laws | — | — | — | **S (one line + link)** | S | **No** |
| Compute-optimal training (Chinchilla), data-vs-parameter trade-off | — | — | — | — | — | **No — absent entirely** |

### B. Tokenization
| Topic | S1 | S2 | S3 | S4 | S5 | Books sufficient? |
|---|---|---|---|---|---|---|
| Why text must become integers; vocabulary construction | **D** | T | — | S | T | Yes |
| Special tokens (`<\|endoftext\|>`, BOS/EOS/PAD/UNK/CLS/SEP/MASK) | **D** | **T** | S | — | S | Yes |
| BPE — what it does | T | T | — | S | T | Yes |
| BPE / WordPiece / SentencePiece / Unigram — *how they are trained and how they differ* | S | S | — | S | S | **No** |
| Word vs subword vs character vs byte tokenization; tokenization-free models | — | **T** | — | — | — | Partly (S2 only) |
| Comparative tokenizer behaviour (case, newlines, emoji, CJK, whitespace runs, digits) | — | **D** | — | — | — | Yes (S2 is excellent here) |
| Why tokenization decides code and arithmetic ability | S | **T** | — | — | — | Yes |
| Fill-in-the-middle and domain special tokens (StarCoder, Galactica) | — | **T** | — | — | — | Yes |

### C. Embeddings and representation
| Topic | S1 | S2 | S3 | S4 | S5 | Books sufficient? |
|---|---|---|---|---|---|---|
| Embedding layer as a lookup ≡ one-hot × matmul | **D** | T | T | — | S | Yes |
| word2vec: skipgram + negative sampling | — | **T** | S | — | S | Yes |
| Static vs contextualized embeddings | S | **T** | S | — | S | Yes |
| Text-embedding models; bi-encoder vs cross-encoder | — | **D** | T | — | T | Yes |
| Contrastive learning; InfoNCE / MNR loss; hard negatives | — | **D** | S | — | T | Yes |
| Unsupervised and domain-adapted embeddings (TSDAE, GPL, Augmented SBERT) | — | **D** | S | — | S | Yes |
| MTEB and embedding evaluation | — | **T** | S | — | — | Yes |
| Dimensionality reduction for inspection (PCA/UMAP/t-SNE) | — | T | T | — | — | Yes |

### D. Transformer internals — *the course's keystone*
| Topic | S1 | S2 | S3 | S4 | S5 | Books sufficient? |
|---|---|---|---|---|---|---|
| Attention as similarity; dot product; context vectors | **D** | — | — | S | S | Yes |
| Q/K/V projections; scaled dot-product attention and *why* √d_k | **D** | — | — | S | S | Yes |
| Causal masking; the −inf trick; why masking leaks nothing | **D** | — | — | — | — | Yes |
| Dropout inside attention | **D** | — | — | T | — | Yes |
| Multi-head attention, naive and weight-split implementations | **D** | S | — | T | S | Yes |
| **Grouped-query / multi-query attention** | — | — | — | — | — | **No — absent entirely** |
| LayerNorm; biased variance; LN vs BatchNorm; Pre-LN vs Post-LN | **D** | — | — | S | — | Yes |
| **RMSNorm** | **S (references only)** | — | — | — | — | **No** |
| GELU vs ReLU; the FFN expand/contract (×4) | **D** | — | — | — | — | Yes |
| **SwiGLU / gated FFNs** | **S (named once)** | — | — | — | — | **No** |
| Residual/shortcut connections and the vanishing-gradient demo | **D** | — | — | T | — | Yes |
| Transformer block assembly; shape preservation | **D** | — | — | S | S | Yes |
| Absolute learned positional embeddings | **D** | — | — | — | S | Yes |
| **RoPE, ALiBi, relative position encodings, long-context extension** | **S (relative named, never explained)** | — | — | — | — | **No** |
| Weight tying | **D** | — | — | — | — | Yes |
| Parameter and memory arithmetic for a given config | **T** | — | **D** | — | S | Yes |
| **FlashAttention / IO-aware attention** | S (refs) | — | **T** | — | T | Partly — no derivation |
| **Mixture of Experts: sparse layers, router, load balancing** | — | — | — | **S** | **T** | **No — concept only, no mechanism** |
| **State-space models (Mamba), RWKV, Hyena** | **S (refs only)** | — | — | — | — | **No** |

### E. Pretraining
| Topic | S1 | S2 | S3 | S4 | S5 | Books sufficient? |
|---|---|---|---|---|---|---|
| Next-token prediction as self-supervision | **D** | S | S | S | **T** | Yes |
| Sliding-window input/target pairs; stride; dataloaders | **D** | — | — | S | S | Yes |
| Cross-entropy loss derived step by step; perplexity | **D** | — | T | T | S | Yes |
| The training loop; AdamW; epochs; overfitting and memorization | **D** | — | T | T | S | Yes |
| LR warmup, cosine decay, gradient clipping | **D (App. D)** | — | **T** | T | — | Yes |
| Gradient checkpointing, mixed precision, gradient accumulation | S | — | **T** | T | S | Yes |
| Pretraining corpora and their composition | T | — | S | S | T | Yes |
| Data cleaning, dedup (exact / MinHash / semantic), **decontamination** | — | — | **D** | **T** | T | Yes |
| Loading published weights into your own implementation | **D** | — | T | — | — | Yes |
| Distributed training: DDP/FSDP, data/tensor/pipeline parallelism | S | — | **T** | T | T | Yes |
| Cost of pretraining (real figures) | **T** | — | T | — | T | Yes |

### F. Decoding and generation
| Topic | S1 | S2 | S3 | S4 | S5 | Books sufficient? |
|---|---|---|---|---|---|---|
| The autoregressive loop; greedy decoding | **D** | T | S | S | T | Yes |
| Temperature; top-k; top-p/nucleus; min-p | **D** (T, top-k) | **T** (T, top-p, top-k) | S | — | S | Yes |
| Beam search | S (refs) | — | — | — | — | **No** |
| Constrained/structured decoding (grammars, JSON mode, Outlines) | — | **T** | T | — | — | Yes |
| Chat templates and their tokenization fragility | — | T | **D** | — | — | Yes |
| Streaming, and the latency vocabulary (TTFT/TBT/TPS/TPOT) | — | — | **T** | — | **T** | Yes |

### G. Fine-tuning and alignment
| Topic | S1 | S2 | S3 | S4 | S5 | Books sufficient? |
|---|---|---|---|---|---|---|
| Classification fine-tuning (head swap, freezing, last-token logits) | **D** | T | — | T | — | Yes |
| Instruction fine-tuning end to end | **D** | — | **D** | T | T | Yes |
| Instruction-dataset construction, quality, quantity, formats | S | — | **D** | T | T | Yes |
| Synthetic data; Evol-Instruct; UltraFeedback; backtranslation | — | — | **D** | T | T | Yes |
| LLM-as-a-judge and its three biases (position/length/family) | S | — | **D** | S | T | Yes |
| Reward models; RewardBench; quality classifiers | — | — | **T** | T | S | Yes |
| Full fine-tuning; memory arithmetic; catastrophic forgetting | S | — | **D** | T | S | Yes |
| **LoRA** | **D (App. E)** | — | **D** | S | S | Yes |
| **QLoRA / NF4 / double quantization / paged optimizers** | — | — | **T** | S | S | Yes |
| RLHF: reward model + PPO + KL penalty | S (refs) | — | **T** | **T** | T | Partly — no mathematics |
| **DPO** | S (refs) | — | **D** | T | S | Partly — no derivation |
| **GRPO, SPCT, and 2025-era alignment** | — | — | — | **S** | — | **No** |
| Preference-data construction and evaluation | — | — | **D** | S | S | Yes |
| **Knowledge distillation** | — | — | S | **S** | S | **No — named five times, explained nowhere** |
| Model pruning (magnitude, structured vs unstructured, iterative) | — | — | — | **T** | T | Yes (S4 only — verify independently) |

### H. Evaluation
| Topic | S1 | S2 | S3 | S4 | S5 | Books sufficient? |
|---|---|---|---|---|---|---|
| Loss / perplexity / gradient norm as training-time signals | **D** | — | **T** | T | S | Yes |
| Benchmarks: MMLU, HellaSwag, ARC, Winogrande, PIQA, GSM8K, TruthfulQA, SuperGLUE | S | — | **T** | **T** | T | Yes |
| Instruct benchmarks: IFEval, MT-Bench, AlpacaEval, Chatbot Arena, GAIA | S | — | **T** | S | S | Yes |
| Generation vs log-likelihood scoring of multiple choice | — | — | **T** | — | — | Yes |
| Benchmark contamination and gaming | — | — | **T** | S | T | Yes |
| Domain and task-specific benchmark construction | — | — | **T** | T | **T** | Yes |
| Classic metrics: ROUGE, BLEU, F1, BERTScore | — | **T** (IR: MAP/nDCG) | T | T | T | Yes |
| RAG evaluation (Ragas, ARES; faithfulness, context precision/recall) | — | S | **T** | **T** | T | Yes |
| Human evaluation and its biases | — | — | T | S | T | Yes |

### I. Inference optimization and serving
| Topic | S1 | S2 | S3 | S4 | S5 | Books sufficient? |
|---|---|---|---|---|---|---|
| KV cache; size formula; static cache + `torch.compile` | — | — | **D** | — | **T** | Yes |
| Continuous / in-flight batching; dynamic batching | — | — | **T** | — | **T** | Yes |
| Speculative decoding; prompt-lookup; Medusa | — | — | **T** | — | **T** | Yes |
| PagedAttention | — | — | **T** | — | **T** | Yes |
| Quantization theory: PTQ/QAT, FP32/FP16/BF16, absmax, zero-point, outliers | — | S | **D** | **T** | **T** | Yes |
| LLM.int8(), NF4, GGUF/llama.cpp, GPTQ, EXL2, AWQ, QuIP#, HQQ | — | S | **D** | T | **T** | Yes |
| Engines compared: TGI / vLLM / TensorRT-LLM / Triton / MLC / CTranslate2 | — | — | **T** | — | **D** | Yes |
| Model parallelism for inference (data / pipeline / tensor / sequence) | — | — | **D** | S | T | Yes |
| Deployment types: real-time / async / batch; monolith vs microservice | — | — | **D** | — | T | Yes |
| Autoscaling, load balancing, cooldowns, cost per request | — | — | **D** | — | T | Yes |
| Edge and on-device inference; WASM | — | — | S | — | **T** | Yes |

### J. LLMOps
| Topic | S1 | S2 | S3 | S4 | S5 | Books sufficient? |
|---|---|---|---|---|---|---|
| DevOps → MLOps → LLMOps; the six principles | — | — | **D** | S | T | Yes |
| FTI (feature/training/inference) architecture | — | — | **D** | — | — | Yes |
| Experiment tracking, model registry, artifacts, data versioning | — | — | **D** | **T** | T | Yes |
| CI/CD/CT; orchestration; testing types incl. regression as a cross-cut | — | — | **D** | T | T | Yes |
| Prompt monitoring and full-trace logging | — | — | **T** | — | **T** | Yes |
| Drift: data / target / concept; KS and chi-squared tests; windows | — | — | **T** | — | S | Yes |
| Guardrails (input and output), moderation, PII leakage | — | S | **T** | T | **T** | Yes |

### K. Prompting, reasoning and agents
| Topic | S1 | S2 | S3 | S4 | S5 | Books sufficient? |
|---|---|---|---|---|---|---|
| Prompt anatomy: persona/instruction/context/format/audience/tone/data | — | **D** | S | T | **T** | Yes |
| In-context learning; zero/one/few-shot | T | **D** | S | T | T | Yes |
| Chain-of-thought; zero-shot CoT; self-consistency; tree-of-thoughts | — | **D** | — | **T** | S | Yes |
| ReAct; ReWOO; Reflection; ART (tool use) | — | S | — | **T** | T | Yes (S4 only — verify) |
| Prompt chaining and decomposition | — | **T** | — | T | T | Yes |
| Agents: planning, memory, tool selection, action scoring | — | — | S | **T** | **T** | Partly |
| Multi-agent, routing, gatekeeper→router→expert pipelines | — | — | — | S | **T** | Partly |
| **Modern tool-calling / function-calling protocols; MCP** | — | — | — | — | — | **No — absent entirely** |
| **Reasoning models, test-time compute, long CoT (o1/R1 style)** | — | — | — | **S (GRPO only)** | — | **No** |

### L. Multimodality
| Topic | S1 | S2 | S3 | S4 | S5 | Books sufficient? |
|---|---|---|---|---|---|---|
| ViT: patches as tokens | — | **T** | — | — | S | Yes |
| CLIP and contrastive image-text training | — | **T** | — | — | **T** | Yes |
| BLIP-2 / Q-Former / soft visual prompts | — | **D** | — | — | S | Yes |
| Cross-modal attention; unified embedding spaces; modality encoders | — | S | — | — | **T** | Yes |
| Audio (Whisper, AudioLM) and video (Phenaki, VideoPoet) | — | — | — | — | **T** | Yes |
| Joint pretraining vs modular fine-tuning | — | S | — | — | **T** | Yes |

### M. Safety, security, ethics
| Topic | S1 | S2 | S3 | S4 | S5 | Books sufficient? |
|---|---|---|---|---|---|---|
| Hallucination: causes and mitigations | S | T | **T** | T | T | Yes |
| Prompt injection and jailbreaking; instruction hierarchy | — | — | T | **S** | **T** | Partly |
| Adversarial attacks (character/word/sentence, universal triggers), adversarial training | — | — | — | **T** | S | Yes (S4 only — verify) |
| Bias taxonomy, fairness metrics, debiasing | — | S | S | **T** | **T** | Yes |
| Privacy: PII memorization, differential privacy, federated learning | — | — | S | T | **T** | Partly |
| Interpretability: attention maps, probing, attribution, mechanistic | — | — | — | **T** | S | Partly — no depth anywhere |
| Governance, auditing, regulation, model documentation | — | — | T | S | **T** | Yes |

### N. Data engineering for LLMs
| Topic | S1 | S2 | S3 | S4 | S5 | Books sufficient? |
|---|---|---|---|---|---|---|
| Corpus acquisition, cleaning, filtering, augmentation, governance | — | — | **T** | **T** | **T** | Yes |
| Deduplication algorithms (hashing, shingling, LSH, MinHash) | — | — | **T** | **T** | T | Yes |
| Annotation, crowdsourcing, annotation bias | — | — | S | **T** | T | Yes |
| Streaming, sharding, storage formats, memory-efficient loading | — | — | T | **T** | S | Yes |
| Data versioning (DVC, artifacts) | — | — | **T** | **T** | S | Yes |

---

## 3. Every paper, system and resource the sources cite, with why it matters

This is the Phase 4 reading list. Items marked ★ are ones the sources *rely on* rather than merely mention; items marked ⚠ are cited by S4/S5 without a verifiable reference and must be confirmed before use.

### Architecture and origins
- ★ **Attention Is All You Need** (Vaswani 2017, 1706.03762) — the architecture the whole course descends from. Cited by all five sources.
- ★ **BERT** (Devlin 2018, 1810.04805) — the encoder branch; needed to explain why classification and retrieval models differ from generative ones.
- ★ **GPT-2, "Language Models Are Unsupervised Multitask Learners"** (Radford 2019) — the exact model S1 rebuilds; the source of the 124M/355M/774M/1558M configurations.
- ★ **GPT-3, "Language Models are Few-Shot Learners"** (Brown 2020, 2005.14165) — few-shot as an emergent capability; the 175B/96-layer/12,288-dim numbers.
- **GPT, "Improving Language Understanding by Generative Pre-Training"** (Radford 2018) — where decoder-only pretraining starts.
- **ViT, "An Image is Worth 16x16 Words"** (Dosovitskiy 2020, 2010.11929) — patches as tokens; the bridge to multimodality.
- **Llama 2** (Touvron 2023, 2307.09288) — the open-weights reference point; source of the 184,320 A100-hour figure.
- **RWKV** (2305.13048), **Hyena** (2302.10866), **Mamba** (Gu & Dao 2023, 2312.00752) — the "not all LLMs are transformers" branch.
- **Jacobs et al. 1991, Adaptive Mixture of Local Experts** — MoE's actual origin, three decades before Mixtral.
- ⚠ **Scaling Laws for Neural Language Models** (Kaplan 2001.08361) — cited once by S4 as a link only; must be read properly for Phase 2.

### Tokenization
- ★ **Neural Machine Translation of Rare Words with Subword Units** (Sennrich 2015, 1508.07909) — BPE.
- **SentencePiece** (Kudo & Richardson 2018) · **Fast WordPiece** (Song 2020, 2012.15524) — the two other families every learner will meet.
- **CANINE** and **ByT5** — tokenization-free encoding.
- **Efficient Training of Language Models to Fill in the Middle** — the FIM tokens in GPT-4 and StarCoder.
- **StarCoder** and **Galactica** — tokenizers designed for a domain (code, science) with special tokens like `<work>` and `[START_REF]`.
- OpenAI `gpt-2/src/encoder.py`, the OpenAI tokenizer web UI, and Karpathy's **minbpe** — three runnable ways to see BPE work.

### Attention and efficiency
- ★ **Bahdanau attention** (Bahdanau, Cho, Bengio 2014, 1409.0473) — attention before transformers; S1 uses it to motivate self-attention.
- ★ **FlashAttention** (Dao 2022, 2205.14135) and **FlashAttention-2** (2307.08691) — tiling into SRAM and online softmax.
- ★ **PagedAttention / vLLM** (Kwon, Li et al. 2023) — OS paging applied to the KV cache.
- **Speculative decoding** (Leviathan et al.) and **Medusa** (Cai 2024) — parallel drafting.
- **GPipe** (Huang 2019) — pipeline parallelism and bubbles. **Megatron-LM** (Shoeybi 2019) — tensor parallelism.
- PyTorch `scaled_dot_product_attention`, `MultiHeadAttention`, **DDP**, **FSDP**, **PiPPy**; **DeepSpeed/ZeRO**.
- **Dropout** (Srivastava 2014, JMLR) · **Simplifying Transformer Blocks** (He & Hofmann 2023, 2311.01906).

### Normalization and activations
- ★ **Layer Normalization** (Ba, Kiros, Hinton 2016, 1607.06450).
- **On Layer Normalization in the Transformer Architecture** (Xiong 2020, 2002.04745) — Pre-LN vs Post-LN, with evidence.
- **RMSNorm** (Zhang & Sennrich 2019, 1910.07467) — what modern models actually use.
- **GELU** (Hendrycks & Gimpel 2016, 1606.08415).

### Pretraining data and practice
- **The Pile** (2101.00027) · **Dolma** (2402.00159) · **RefinedWeb/Falcon** (2306.01116) · **RedPajama** · **FineWeb** (15T tokens) — the open corpora, needed to make "trillions of tokens" concrete.
- **Pythia** (2304.01373) and **OLMo** (2402.00838) — the two suites that publish everything, so a learner can inspect a real training run.
- **Continual pretraining** (Ibrahim 2024, 2403.08763) · **GaLore** (2403.03507) · **nanoGPT** (Karpathy).
- "In the Long (Context) Run", Harm de Vries — **most compute below ~32k context is in the FFN, not attention**; a good myth-buster.

### Fine-tuning and alignment
- ★ **LoRA** (Hu 2021, 2106.09685) · ★ **QLoRA** (Dettmers 2023, 2305.14314).
- ★ **InstructGPT** (Ouyang 2022, 2203.02155) — the paper that made instruction-following the default.
- ★ **DPO** (Rafailov 2023, 2305.18290) — "your language model is secretly a reward model".
- ★ **PPO** (Schulman 2017, 1707.06347) · **Deep RL from Human Preferences** (Christiano 2017, 1706.03741) · preference-based RL (Akrour 2011; Cheng 2011) · **RLHF survey** (Kaufmann 2023, 2312.14925).
- **LIMA** (2305.11206) — 1,000 samples can be enough. **Alpaca** (Stanford, 52k) · **UltraChat** (2305.14233) · **Alpaca-GPT4** · **Magpie** (2406.08464).
- **Evol-Instruct / AutoEvol** (Zeng 2024, 2406.00770) · **Instruction Tuning with Loss Over Instructions** (Shi 2024, 2405.14394) — the "should you mask the instruction?" disagreement, which §3.5 says we must teach as a debate.
- ★ **Does Fine-Tuning LLMs on New Knowledge Encourage Hallucinations?** (Gekhman 2024, 2405.05904) — facts come from pretraining; teaching new facts in fine-tuning *increases* hallucination. This reframes the whole fine-tuning-vs-RAG decision.
- **ArmoRM** (2406.12845) · **RewardBench** · **fineweb-edu-classifier** — three ways to score data at scale.
- ⚠ **GRPO** and **SPCT** (attributed to DeepSeek by S4, no citation given) — must be sourced from the DeepSeek papers directly.

### Quantization and compression
- ★ **LLM.int8()** (Dettmers 2022) — the outlier-feature problem. ★ **GPTQ** (Frantar 2023). ★ **AWQ** (Lin 2023).
- **llama.cpp / GGUF** (Gerganov) · **ExLlamaV2 / EXL2** (turboderp) · **QuIP#** · **HQQ**.

### Evaluation
- ★ **MMLU** (Hendrycks 2020, 2009.03300) · **IFEval** (2311.07911) · **Length-Controlled AlpacaEval** (2404.04475) · **GAIA** (2311.12983) · **MT-Bench / Chatbot Arena** (Zheng 2306.05685).
- **Hallucinations Leaderboard** (2404.05904) · Open Medical-LLM · BigCodeBench · Enterprise Scenarios · OpenKo / Open Portuguese / Open Arabic leaderboards.
- ★ **Ragas** (2309.15217) and **ARES** (2311.09476) — the two RAG-evaluation designs, one LLM-judged, one classifier-based.
- **lm-evaluation-harness** (EleutherAI) and **lighteval** (Hugging Face) — the harnesses we should teach against.
- **Prometheus** (2310.08491), **Prometheus 2** (2405.01535), **PHUDGE** (2405.08029) — open judge models.

### Embeddings and retrieval
- ★ **word2vec** (Mikolov) and **noise-contrastive estimation** · **GloVe** (Pennington 2014) · FastText.
- ★ **SBERT / sentence-transformers** (Reimers 2019) · **MTEB** (Muennighoff 2022, 2210.07316).
- **InfoNCE / CPC** (van den Oord 2018) · **SimCLR** (Chen & Hinton 2020) · **Augmented SBERT** (2010.08240) · **SimCSE** (2104.08821) · **TSDAE** (2104.06979) · **GPL** (2112.07577).
- **monoBERT / Multi-Stage Document Ranking with BERT** and *Pretrained Transformers for Text Ranking* — reranking.
- **UMAP** (McInnes 2018) · **HDBSCAN** (McInnes 2017) · **LDA** (Blei 2003) · **BERTopic**.
- **RAG** (Lewis 2020), **RETRO**, **Atlas**; **GenQ**, **InPars-v2**, **DSP (Demonstrate-Search-Predict)**.

### Multimodal
- ★ **CLIP** (Radford 2021) · ★ **BLIP-2** (Q-Former) · **Flamingo** (Alayrac 2022, 2204.14198, gated cross-attention) · **Whisper** (Radford 2023, 680k hours) · **AudioLM/SoundStream** (Borsos 2022) · **Phenaki (C-ViViT)** · **VideoPoet** · **DeBERTaV3**.

### Safety, interpretability, governance
- **Emergent abilities of LLMs** (Wei 2022, 2206.07682) · **OpenAI Preparedness Framework** · **instruction hierarchy** · **integrated gradients** · activation patching and circuit analysis (mechanistic interpretability) · **Tim Miller, "Contrastive explanation"** (2021) — the philosophical grounding for contrastive learning, and a genuinely good callout.

### Systems, tools and docs the course should name
Hugging Face `transformers`, `datasets`, `tiktoken`, **TRL**, **PEFT**, **Axolotl**, **Unsloth**, **bitsandbytes** · **vLLM**, **TGI**, **TensorRT-LLM**, **Triton Inference Server**, **MLC/TVM**, **CTranslate2**, **llama.cpp**, **Ollama**, **LoRAX**, **NVIDIA NIM**, **NVIDIA Dynamo** · **ZenML**, **Comet ML**, **Opik**, **Langfuse**, **W&B**, **MLflow**, **DVC**, **Argilla**, **Nomic Atlas** · **MongoDB**, **Qdrant**, **pgvector**, FAISS, Annoy · **LangChain**, **LlamaIndex**, **DSPy**, **Guidance**, **Guardrails**, **LMQL**, **Outlines** · **PyTorch**, `torch.compile`, `alibi-detect`.

---

## 4. Topics the sources *mention but do not explain* (the candidate gap list)

These are the §3.6 gaps: named in at least one book, never opened. Phase 2 must decide core/supporting/out for each, and Phase 3 must assign a primary source to every one kept.

**Architecture**: RoPE and rotary embeddings · ALiBi and relative position schemes · long-context extension (position interpolation, YaRN) · RMSNorm · SwiGLU and gated FFNs · grouped-query and multi-query attention · MoE routing, load-balancing losses, expert capacity · sliding-window and sparse attention · state-space models (Mamba) and RWKV · tied vs untied embeddings in modern models.

**Training**: scaling laws and compute-optimal allocation (Chinchilla) · learning-rate schedules beyond linear/cosine (WSD) · batch-size scaling and critical batch size · data mixtures, curricula and mid-training · μP and hyperparameter transfer · numerical stability at scale (loss spikes, z-loss) · tokenizer training as an optimization problem.

**Alignment**: the DPO derivation itself · GRPO and group-relative methods · rejection sampling / best-of-n · constitutional AI and RLAIF · reward hacking as a measurable phenomenon · **knowledge distillation** (named by four sources, explained by none).

**Inference**: the attention and KV-cache arithmetic (FLOPs, bytes, arithmetic intensity) · prefill vs decode as different compute regimes · **why decode is memory-bandwidth-bound** — the single most load-bearing fact in inference optimization, and absent from all five books · prompt/prefix caching · batching mathematics · quantization error analysis beyond worked examples.

**Reasoning and agents**: reasoning models and test-time compute (o1/R1-style long chain-of-thought) · process vs outcome reward models · modern tool-calling and function-calling formats · **MCP and agent-protocol standards** · agent evaluation beyond task success.

**Evaluation**: contamination detection methods · statistical significance and confidence intervals on benchmark scores · rubric design as a discipline · judge calibration against human raters.

**Safety**: a systematic jailbreak taxonomy with mechanisms · watermarking and provenance · membership inference and training-data extraction · model autonomy evaluations.

---

## 5. Coverage check against §1 ("no other material needed")

| §1 requirement | Can the five books alone deliver it? |
|---|---|
| Explain every core mechanism from first principles | **Almost.** S1 delivers attention, the block, pretraining, decoding and fine-tuning definitively. The gaps are RoPE, RMSNorm, SwiGLU, GQA and MoE — all of them things a 2026 learner will meet in the first model card they open. |
| Recognize the vocabulary in any paper or codebase | **Yes**, with S4 as the vocabulary map and the citation list above as the reading map. |
| Reason about trade-offs, not recite them | **Yes** — S3 is unusually good at this (batch vs streaming, monolith vs microservice, LoRA vs QLoRA, DPO vs PPO, latency vs throughput under batching). |
| Answer any interview question, including tricky ones | **Partly.** "Why is decoding memory-bound?", "What is GQA for?", "Derive the DPO loss", "What does Chinchilla say?" cannot be answered from these books. |
| Operate, debug and tune real systems | **Yes** — S3 Ch 8/10/11 and S5 Ch 10/12 cover this better than most courses do. |
| Build a working version of the thing | **Yes** — S1 is a complete capstone spine, and the guide's §9 two-language requirement is a straightforward extension of it. |
| Read the primary literature afterwards | **Yes**, using §3 above. |
| Pass a university final | **Not yet** — scaling laws, positional encodings and modern attention variants are all examinable and all missing. |

**Conclusion for the gate: the provided books are a strong but incomplete spine.** They are sufficient for perhaps 70% of the course at the depth §1 requires, and Phase 2 will need to pull roughly 20–30 primary papers and system docs in as first-class sources — which §3.6 explicitly permits, and which the RAG In Depth course already did.

---

## 6. What Phase 1 will need from the owner

1. **Approval that nothing in the books is missing from this map** (the Phase 0 gate).
2. A decision on the two reliability caveats above — specifically, whether S4 and S5 may be cited at all in the finished text, or only used as scaffolding.
3. Confirmation of the track position: **LLM In Depth as a prerequisite for RAG In Depth**, which implies the LLM course owns tokenization, embeddings, decoding, context windows and fine-tuning, and *hands off* chunking, vector indexes, retrieval quality and GraphRAG to the RAG course rather than duplicating them.
