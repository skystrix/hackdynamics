/* ==========================================================================
   bookData-llm-part1.js — LLM In Depth, Part I chapters (1–4)
   Original explanatory writing. Sources consulted for Chapter 1: Shannon 1948
   (A Mathematical Theory of Communication) and Shannon 1951 (Prediction and
   Entropy of Printed English); Vaswani et al. 2017 (Attention Is All You Need,
   NeurIPS); Radford et al. 2019 (Language Models are Unsupervised Multitask
   Learners, GPT-2); Ouyang et al. 2022 (InstructGPT); Raschka, Build a Large
   Language Model (From Scratch), ch. 1; Iusztin & Labonne, LLM Engineer's
   Handbook, ch. 1. Versions checked 2026-09-06: PyTorch 2.14.0 (released
   2026-09-02), vLLM 0.28.0, llama.cpp b0.4.0, Python 3.13/3.14 in bugfix
   status per devguide.python.org (3.12 is security-only).

   Sources consulted for Chapter 2: Gage 1994 (A New Algorithm for Data
   Compression, C Users Journal); Sennrich, Haddow & Birch 2016 (Neural Machine
   Translation of Rare Words with Subword Units, ACL); Schuster & Nakajima 2012
   (Japanese and Korean Voice Search, ICASSP); Kudo 2018 (Subword
   Regularization, ACL); Kudo & Richardson 2018 (SentencePiece, EMNLP); Radford
   et al. 2019 (GPT-2, byte-level BPE); Ahia et al. 2023 and Petrov et al. 2023
   (tokenization cost across languages).

   Every token count in Chapter 2 was measured on 2026-09-06 with tiktoken
   0.14.0 (encodings gpt2, cl100k_base, o200k_base) and reproduced by the
   scripts described in the exercises; the merge table in section 2 is the
   literal output of the trainer written for that section. Vocabulary sizes
   read from each model's config.json on the Hugging Face Hub the same day:
   GPT-2 50,257; Mistral-7B-v0.3 32,768; Llama-3-8B 128,256; Qwen2.5-7B
   152,064; Gemma-2-9B 256,000.

   Sources consulted for Chapter 3: the tokenizer.json and
   tokenizer_config.json of Meta-Llama-3-8B-Instruct (via the ungated
   NousResearch mirror) and Qwen2.5-7B-Instruct, downloaded 2026-09-06;
   tiktoken 0.14.0; the Hugging Face chat-templating documentation. Every
   token count, every rendered template and the 20-vs-67 mismatch figure in
   section 6 were produced by running those real tokenizers and rendering
   their real Jinja templates, not by recalling their formats.

   Sources consulted for Chapter 4: Mikolov et al. 2013 (word2vec);
   Pennington et al. 2014 (GloVe); Peters et al. 2018 (ELMo); Devlin et al.
   2019 (BERT); Press & Wolf 2017 (weight tying); van den Oord et al. 2018
   (InfoNCE); Reimers & Gurevych 2019 (Sentence-BERT); Karpukhin et al. 2020
   (DPR); Kusupati et al. 2022 (Matryoshka); Muennighoff et al. 2022 (MTEB).
   The weight-tying table in section 8 was read from each model's config.json
   on the Hugging Face Hub on 2026-09-06: GPT-2 (768/50,257), Llama-3-8B
   (4,096/128,256, untied), Llama-3.2-1B (2,048/128,256, tied), Qwen2.5-7B
   (3,584/152,064, untied), Qwen2.5-0.5B (896/151,936, tied), Mistral-7B-v0.3
   (4,096/32,768, untied), Gemma-2-9B (3,584/256,000).

   Sources consulted for Chapter 5: Vaswani et al. 2017 (Attention Is All You
   Need, NeurIPS), including its footnote 4 on the scaling factor; Bahdanau et
   al. 2014 (additive attention for NMT); Luong et al. 2015 (multiplicative
   attention); Dao et al. 2022 (FlashAttention) for the forward pointer in
   section 7. The variance measurements, the softmax-collapse comparison, the
   four-token worked example and the score-matrix memory table in this chapter
   were all computed on 2026-09-06 rather than quoted: dot products of
   independent unit-normal vectors were sampled 20,000 times at d_k = 4, 64,
   128 and 1024, giving variances of 3.9, 63.5, 129.3 and 1025.9.

   Sources consulted for Chapter 6: Vaswani et al. 2017 (multi-head
   attention); Shazeer 2019 (multi-query attention); Ainslie et al. 2023
   (grouped-query attention); Beltagy et al. 2020 (Longformer, sliding
   window); Xiao et al. 2023 (StreamingLLM, attention sinks); Olsson et al.
   2022 (induction heads); Elhage et al. 2021 (a mathematical framework for
   transformer circuits). Head configurations read from config.json on the Hub
   on 2026-09-06: Llama-3-8B 32 query / 8 KV heads, head_dim 128, 32 layers;
   Qwen2.5-7B 28 / 4, head_dim 128, 28 layers; Mistral-7B-v0.3 32 / 8;
   Gemma-2-9B 16 / 8 with head_dim 256 and a 4,096-token sliding window;
   Llama-3.2-1B 32 / 8, head_dim 64. All KV-cache figures in this chapter were
   computed from those values rather than quoted.

   Sources consulted for Chapter 7: Vaswani et al. 2017 (sinusoidal
   encodings); Shaw et al. 2018 (relative position representations); Su et al.
   2021 (RoFormer, RoPE); Press et al. 2021 (ALiBi); Chen et al. 2023
   (position interpolation); Peng et al. 2023 (YaRN); Liu et al. 2023 (Lost in
   the Middle); Hsieh et al. 2024 (RULER); Kamradt 2023 (needle in a
   haystack). Read from config.json on the Hub on 2026-09-06: GPT-2 learned
   positions capped at 1,024; Llama-3-8B rope_theta 500,000 with an 8,192
   context; Llama-3.2-1B the same theta with a live rope_scaling block of
   factor 32 taking 8,192 to 131,072; Qwen2.5-7B and Mistral-7B-v0.3
   rope_theta 1,000,000. The relative-distance demonstration in section 5 and
   the wavelength table in section 7 were computed the same day.

   Sources consulted for Chapter 8: He et al. 2015 (residual connections);
   Ba et al. 2016 (layer normalization); Hendrycks & Gimpel 2016 (GELU);
   Vaswani et al. 2017 (the original post-LN block); Zhang & Sennrich 2019
   (RMSNorm); Shazeer 2020 (GLU Variants Improve Transformer); Xiong et al.
   2020 (On Layer Normalization in the Transformer Architecture); Elhage et
   al. 2021 (the residual stream framing). Feed-forward ratios read from
   config.json on the Hub on 2026-09-06 and used in section 3: GPT-2 4.000x
   with GELU and LayerNorm; Llama-2-7B 2.688x; Llama-3-8B 3.500x;
   Mistral-7B-v0.3 3.500x; Gemma-2-9B 4.000x with GELU; Qwen2.5-7B 5.286x;
   every model but GPT-2 using RMSNorm. The block composition in section 8
   was computed from Corvid's configuration the same day.

   Sources consulted for Chapter 9: Kaplan et al. 2020 and Hoffmann et al.
   2022 (the 6ND compute estimate); Micikevicius et al. 2017 (mixed
   precision); Rajbhandari et al. 2020 (ZeRO, for the optimizer-state
   accounting); Korthikanti et al. 2022 (activation memory); the Hugging Face
   transformers model-configuration reference. Every number in this chapter
   was computed from Corvid's configuration on 2026-09-06 rather than quoted:
   8,030,261,248 parameters of which 86.92% are the 32 blocks; 16.06 GFLOPs
   per token forward under the 2N rule, with attention adding 1.7% at 512
   tokens and 107% at 32,768; 7.227e23 FLOPs to train on 15T tokens; 144.5 GB
   of training state at 18 bytes per parameter.

   Sources consulted for Chapter 10: Shazeer et al. 2017 (sparsely-gated
   mixture-of-experts); Lepikhin et al. 2020 (GShard, expert capacity);
   Fedus et al. 2021 (Switch Transformer, top-1 routing); Jiang et al. 2024
   (Mixtral of Experts); the DeepSeek-V3 technical report (shared and
   fine-grained experts); Zoph et al. 2022 (ST-MoE, router z-loss). Read from
   config.json on the Hub on 2026-09-06: Mixtral-8x7B 8 experts with top-2
   routing and an expert width of 14,336; Qwen3-30B-A3B 128 experts with
   top-8 and a moe_intermediate_size of 768 against a dense 6,144;
   DeepSeek-V3 256 routed experts plus 1 shared, top-8, moe_intermediate_size
   2,048 against a dense 18,432. Mixtral's 46.7B total and 12.9B active were
   recomputed from its configuration and match the published figures.

   Sources consulted for Chapter 11: nostalgebraist 2020 (the logit lens);
   Belrose et al. 2023 (Eliciting Latent Predictions with the Tuned Lens, and
   its finding that the logit lens fails on some model families); Elhage et
   al. 2021 (A Mathematical Framework for Transformer Circuits); Olsson et al.
   2022 (In-context Learning and Induction Heads); Alain & Bengio 2016
   (linear classifier probes); Hewitt & Liang 2019 (control tasks, on why a
   probe needs a baseline); Elhage et al. 2022 (Toy Models of Superposition);
   Bricken et al. 2023 (Towards Monosemanticity) and Templeton et al. 2024
   (Scaling Monosemanticity) on sparse autoencoders. This chapter reports
   qualitative findings from that literature rather than measurements of my
   own, and says so where the field disagrees.

   Sources consulted for Chapter 12: Raffel et al. 2020 (C4); Gao et al. 2020
   (The Pile); Broder 1997 (MinHash); Lee et al. 2021 (Deduplicating Training
   Data Makes Language Models Better); Rae et al. 2021 (Gopher, quality
   heuristics); Penedo et al. 2023 (RefinedWeb) and 2024 (FineWeb and its
   filter ablations); Soldaini et al. 2024 (Dolma); Shumailov et al. 2024
   (model collapse, Nature); Carlini et al. 2021 (training-data extraction).
   Licences read from the Hugging Face dataset pages on 2026-09-06: FineWeb,
   FineWeb-Edu and Dolma are all ODC-BY. The shingling, MinHash and n-gram
   contamination figures in sections 4 and 5 were computed on 2026-09-06: a
   near-duplicate pair scores 0.750 true Jaccard and 0.773 under 128-permutation
   MinHash, while a genuine paraphrase of the same sentence scores 0.000.

   Sources consulted for Chapter 13: Shannon 1948 (entropy and cross-entropy);
   Bengio et al. 2003 (neural language models and perplexity); Williams &
   Zipser 1989 (teacher forcing); Rumelhart, Hinton & Williams 1986
   (backpropagation); Raffel et al. 2020 (sequence packing); Olsson et al.
   2022 (the induction-head bump in the loss curve); Chowdhery et al. 2022
   (PaLM) and Zhang et al. 2022 (OPT) for published accounts of loss spikes
   and restarts during real runs. Every loss and perplexity figure in this
   chapter was computed on 2026-09-06: a randomly initialized Corvid scores
   ln(128,256) = 11.762 nats, or 16.97 bits per token, with a perplexity
   equal to its vocabulary size; the worked position scores 1.5923; and a
   confidently wrong prediction at p = 1e-6 scores 13.8155.

   Sources consulted for Chapter 14: Kingma & Ba 2014 (Adam); Loshchilov &
   Hutter 2017 (decoupled weight decay, AdamW); Micikevicius et al. 2017
   (mixed precision and loss scaling); Chen et al. 2016 (activation
   checkpointing); Pascanu et al. 2013 (gradient clipping); McCandlish et al.
   2018 (critical batch size); Hu et al. 2024 (the warmup-stable-decay
   schedule); Chowdhery et al. 2022 (PaLM) and Zhang et al. 2022 (OPT) on loss
   spikes, z-loss and restart discipline; Gupta et al. 2018 (Shampoo) and
   Jordan et al. 2024 (Muon). Float-format figures computed on 2026-09-06 from
   the bit layouts: fp32 1+8+23 with about 6.9 decimal digits, fp16 1+5+10
   with 3.0 digits and a maximum of 65,504, bf16 1+8+7 with 2.1 digits and
   fp32's full exponent range. bf16's relative resolution near 1.0 is 2^-8 =
   0.0039, which is why an update of 1e-4 is lost without master weights.

   Sources consulted for Chapter 15: Hestness et al. 2017 (early empirical
   scaling); Kaplan et al. 2020 (Scaling Laws for Neural Language Models);
   Hoffmann et al. 2022 (Training Compute-Optimal Language Models, the
   Chinchilla result); Rae et al. 2021 (Gopher); Sardana et al. 2023
   (inference-aware scaling); Wei et al. 2022 (emergent abilities) and
   Schaeffer et al. 2023 (Are Emergent Abilities a Mirage?); Muennighoff et
   al. 2023 (data-constrained scaling). Published model figures are Gopher at
   280B parameters on 300B tokens and Chinchilla at 70B on 1.4T. Every
   allocation and cost figure was recomputed on 2026-09-08: those two runs
   cost 5.040e23 and 5.880e23 FLOPs; Corvid-8B's compute-optimal budget is
   160.6B tokens, so a 15T-token run is 93x that; the same compute spent
   compute-optimally would give 77.6B parameters on 1.55T tokens, costing
   155.21 GFLOPs per token against 16.06; and the inference saving repays the
   whole training run after 5.194e12 served tokens.

   Sources consulted for Chapter 16: Williams, Waterman & Patterson 2009 (the
   roofline model); the NVIDIA H100 and A100 architecture whitepapers for the
   published bf16 throughput and HBM bandwidth figures used below; the CUDA
   C++ Programming Guide on the memory hierarchy; the Triton language
   documentation; Dao et al. 2022 (FlashAttention) as the worked example of an
   I/O-bound kernel. Every intensity, ridge point and timing in this chapter
   was computed on 2026-09-08 from those published specifications: H100 at
   989 TFLOP/s bf16 over 3.35 TB/s gives a ridge point of 295 FLOPs per byte,
   A100 at 312 TFLOP/s over 2.039 TB/s gives 153. One Corvid FFN matrix has an
   arithmetic intensity of 1.0 at decode and 2,293.8 at an 8,192-token
   prefill; whole-model decode reads 16.06 GB per token, which is 4.79 ms and
   a 209 tokens/s ceiling on an H100 from bandwidth alone.
   Structure: window.PARTS + window.CHAPTERS.
   ========================================================================== */

window.PARTS = [
  { num: 1, title: "What a Language Model Is",
    desc: "Before the architecture, the object: a function that returns a probability for every possible next token. This part takes text apart into the pieces the machine actually sees, shows why the tokenizer causes bugs no one blames it for, and turns those pieces into the geometry every later chapter operates on." },
  { num: 2, title: "Inside the Block",
    desc: "One transformer block, opened completely: the weighted sum that is attention, the heads that split it, the rotation that tells it about order, the residual stream everything writes into, and the arithmetic that tells you what a model will cost before you download it. By the end you can read any model card and say what the architecture is." },
  { num: 3, title: "Making a Model",
    desc: "Where weights come from. A corpus is filtered, deduplicated and decontaminated; a loss is minimized with an optimizer whose every knob exists to fix a specific failure; a scaling law decides how big and how long; and a GPU decides how fast. This part is why the models you use look the way they do." },
  { num: 4, title: "Making It Useful",
    desc: "A pretrained model is a text continuer, not an assistant. This part is the distance between them: choosing the next token, forcing the output into a schema, calling tools, fine-tuning on a job, adapting on one GPU, learning from preferences, and buying accuracy with thinking time." },
  { num: 5, title: "Making It Fast, Correct and Safe",
    desc: "The engineering half. Why the first token is slow and the rest are fast, why decode is limited by memory bandwidth and not arithmetic, what a batch really costs, what quantization takes away, how to tell whether a model actually got better, what an attacker does to it, and what to watch at 3am." },
  { num: 6, title: "Build It: PocketLM",
    desc: "Seven chapters, one working language model: a BPE tokenizer, attention and a block from scratch, a pretraining run, modern components ablated one at a time, real open weights loaded into your own code and matched logit for logit, LoRA and DPO written from the loss up, and an inference engine in C benchmarked honestly against llama.cpp and vLLM." }
];

window.CHAPTERS = [];

/* ======================= CHAPTER 1 ======================= */
CHAPTERS.push({
  num: 1, part: 1, free: true, title: "The Machine That Guesses the Next Token",
  blurb: "Everything in this course is machinery around one function: given some text, return a probability for every token that could come next. Chat, code, translation and refusal are all that function called in a loop. You will watch a real model produce that distribution, see the top candidates shift as you edit the prompt, and meet the three questions that explain most of the subject. You will also meet Corvid-8B, the reference model whose arithmetic runs through every chapter, and learn how this course works: machines beside the text, a quiz per chapter, and a capstone where you build the whole thing yourself.",
  sections: [
    { title: "One Function, Called in a Loop", viz: "llmNextToken", vizTitle: "Edit the prompt; watch the next-token distribution move",
      html: "<p>Type a half-finished sentence into a chat window and something remarkable appears to happen: the machine understands you. It does not. What it does is narrower, stranger, and far more interesting, and you can state it in one line. Given a sequence of tokens, a <strong>language model</strong> returns a number for every token in its vocabulary: the probability that this token comes next. That is the whole function. Everything else in this course is machinery built around it.</p>" +
      "<p>Corvid-8B, the model this course does its arithmetic on, has a vocabulary of 128,256 tokens. So its output is not a word. It is a list of 128,256 numbers that sum to 1, and that list is the model&#8217;s <strong>next-token distribution</strong>. Feed it <code>The capital of France is</code> and one of those numbers, the one belonging to the token <code> Paris</code>, is around 0.94. The rest of the probability mass is scattered across <code> the</code>, <code> a</code>, <code> located</code>, and a long tail of tokens with probabilities in the millionths.</p>" +
      "<div class='fig'><svg viewBox='0 0 760 232' xmlns='http://www.w3.org/2000/svg' font-family='Menlo,monospace'>" +
      "<text x='95' y='20' text-anchor='middle' fill='#2de2ff' font-size='12'>tokens in</text>" +
      "<rect x='20' y='32' width='60' height='28' rx='8' fill='#111a2e' stroke='#4f7cff' stroke-width='2'/><text x='50' y='51' text-anchor='middle' fill='#c9d6ea' font-size='11'>The</text>" +
      "<rect x='86' y='32' width='72' height='28' rx='8' fill='#111a2e' stroke='#4f7cff' stroke-width='2'/><text x='122' y='51' text-anchor='middle' fill='#c9d6ea' font-size='11'>capital</text>" +
      "<rect x='20' y='68' width='60' height='28' rx='8' fill='#111a2e' stroke='#4f7cff' stroke-width='2'/><text x='50' y='87' text-anchor='middle' fill='#c9d6ea' font-size='11'>of</text>" +
      "<rect x='86' y='68' width='72' height='28' rx='8' fill='#111a2e' stroke='#4f7cff' stroke-width='2'/><text x='122' y='87' text-anchor='middle' fill='#c9d6ea' font-size='11'>France</text>" +
      "<rect x='20' y='104' width='60' height='28' rx='8' fill='#111a2e' stroke='#4f7cff' stroke-width='2'/><text x='50' y='123' text-anchor='middle' fill='#c9d6ea' font-size='11'>is</text>" +
      "<line x1='165' y1='82' x2='219' y2='82' stroke='#4f7cff' stroke-width='2'/><polygon points='226,82 214,76 214,88' fill='#4f7cff'/>" +
      "<rect x='230' y='44' width='150' height='76' rx='8' fill='#111a2e' stroke='#ffd166' stroke-width='2.5'/>" +
      "<text x='305' y='75' text-anchor='middle' fill='#ffd166' font-size='12'>the model</text>" +
      "<text x='305' y='94' text-anchor='middle' fill='#7d8fb0' font-size='10'>8.03B parameters</text>" +
      "<line x1='386' y1='82' x2='434' y2='82' stroke='#ffd166' stroke-width='2'/><polygon points='441,82 429,76 429,88' fill='#ffd166'/>" +
      "<text x='594' y='20' text-anchor='middle' fill='#2de2ff' font-size='11'>one probability per vocabulary entry</text>" +
      "<rect x='450' y='32' width='268' height='16' rx='4' fill='#3ddc97'/><text x='728' y='45' fill='#3ddc97' font-size='10'>.94</text><text x='455' y='45' fill='#0b1120' font-size='10'>Paris</text>" +
      "<rect x='450' y='54' width='17' height='16' rx='4' fill='#4f7cff'/><text x='474' y='67' fill='#7d8fb0' font-size='10'>the &#160;.06</text>" +
      "<rect x='450' y='76' width='6' height='16' rx='4' fill='#4f7cff'/><text x='463' y='89' fill='#7d8fb0' font-size='10'>a &#160;.02</text>" +
      "<rect x='450' y='98' width='3' height='16' rx='4' fill='#4f7cff'/><text x='460' y='111' fill='#7d8fb0' font-size='10'>located &#160;.01</text>" +
      "<rect x='450' y='120' width='2' height='16' rx='4' fill='#4f7cff'/><text x='459' y='133' fill='#7d8fb0' font-size='10'>now &#160;.004</text>" +
      "<text x='450' y='156' fill='#7d8fb0' font-size='10'>&#8942; 128,251 more, summing to the remainder</text>" +
      "<line x1='20' y1='176' x2='740' y2='176' stroke='#1c2a45' stroke-width='2'/>" +
      "<text x='20' y='198' fill='#c9d6ea' font-size='11'>P(next = Paris | The capital of France is) = 0.94</text>" +
      "<text x='20' y='218' fill='#7d8fb0' font-size='10.5'>The model has no answer. It has a distribution, and 0.94 of it happens to sit on one token.</text>" +
      "</svg><div class='fig-cap'>The function, complete. Tokens go in, one probability per vocabulary entry comes out. Nothing in the machine is shaped like an answer.</div></div>" +
      "<p>Now use the machine above. Type <code>The capital of France is</code> and look at the bars. Then delete <code>of France</code> and look again. The top candidate collapses from near-certainty into a spread of plausible continuations, and the entropy readout on the right roughly triples. Notice what that means: the model's confidence is a property of the context you gave it, not of anything it knows. The same weights are producing both distributions.</p>" +
      "<p>To get a paragraph out of a function that only predicts one token, you call it repeatedly. Take the distribution, choose a token from it, append that token to the input, and run the whole thing again. This is <strong>autoregressive generation</strong>, and it is why a model rereads its own output on every step. Sixty tokens of reply means sixty full passes through 8.03 billion parameters.</p>" +
      "<div class='fig'><svg viewBox='0 0 760 168' xmlns='http://www.w3.org/2000/svg' font-family='Menlo,monospace'>" +
      "<rect x='20' y='30' width='150' height='34' rx='8' fill='#111a2e' stroke='#4f7cff' stroke-width='2'/><text x='95' y='52' text-anchor='middle' fill='#c9d6ea' font-size='11'>context so far</text>" +
      "<line x1='176' y1='47' x2='214' y2='47' stroke='#4f7cff' stroke-width='2'/><polygon points='221,47 209,41 209,53' fill='#4f7cff'/>" +
      "<rect x='226' y='30' width='140' height='34' rx='8' fill='#111a2e' stroke='#ffd166' stroke-width='2.5'/><text x='296' y='52' text-anchor='middle' fill='#ffd166' font-size='11'>forward pass</text>" +
      "<line x1='372' y1='47' x2='410' y2='47' stroke='#ffd166' stroke-width='2'/><polygon points='417,47 405,41 405,53' fill='#ffd166'/>" +
      "<rect x='422' y='30' width='140' height='34' rx='8' fill='#111a2e' stroke='#4f7cff' stroke-width='2'/><text x='492' y='52' text-anchor='middle' fill='#c9d6ea' font-size='11'>distribution</text>" +
      "<line x1='568' y1='47' x2='606' y2='47' stroke='#4f7cff' stroke-width='2'/><polygon points='613,47 601,41 601,53' fill='#4f7cff'/>" +
      "<rect x='618' y='30' width='122' height='34' rx='8' fill='#111a2e' stroke='#3ddc97' stroke-width='2'/><text x='679' y='52' text-anchor='middle' fill='#3ddc97' font-size='11'>pick one</text>" +
      "<path d='M679 68 L679 104 L95 104 L95 70' fill='none' stroke='#3ddc97' stroke-width='2' stroke-dasharray='5 4'/><polygon points='95,64 89,76 101,76' fill='#3ddc97'/>" +
      "<text x='390' y='122' text-anchor='middle' fill='#3ddc97' font-size='10.5'>append the chosen token and run the whole thing again</text>" +
      "<text x='390' y='150' text-anchor='middle' fill='#7d8fb0' font-size='10.5'>one loop per token: a 300-token answer is 300 passes through every parameter</text>" +
      "</svg><div class='fig-cap'>The loop. Chapter 18 is about the &#8220;pick one&#8221; box, and Chapter 26 is about what the dashed line costs.</div></div>" +
      "<p>None of this is new in spirit. In 1948 Claude Shannon defined the information content of English by asking how well the next letter could be predicted from the preceding ones, and in a 1951 follow-up he had human subjects guess letter by letter to estimate the entropy of printed English at roughly one bit per character. Shannon built the framing: language as a source, prediction as the measure of understanding it. What the last few years supplied was not the idea but the machinery, an architecture from a 2017 paper by Vaswani and colleagues that made the prediction learnable at scale, which is the machine you will open in Part II.</p>" +
      "<div class='callout'><strong>The misconception to drop now.</strong> A model does not look anything up. There is no table of facts inside it, and no step where it decides whether it knows something. When it produces a wrong citation with total fluency it is not lying and it is not broken. It is doing exactly what it does for correct answers: returning the tokens its parameters make probable. Chapter 32 is where you learn to measure this, and it is the reason <em>RAG In Depth</em> exists as a separate course.</div>" },

    { title: "Three Machines, Not One", viz: "llmCourseMap", vizTitle: "Hover a stage to see which chapters open it",
      html: "<p>The function from the last section is one thing. Producing it, shaping it, and running it for users are three different engineering problems with different hardware, different costs, and different teams. Most confusion about this field comes from mixing them up, so this course keeps them apart and gives each one a part.</p>" +
      "<p><strong>Pretraining</strong> is where the parameters come from. A corpus of trillions of tokens is filtered and deduplicated, and the model is trained to predict the next token in it, over and over. The result is a machine that continues text convincingly and will happily continue your question with three more questions, because that is what documents look like. It costs millions of dollars and months of GPU time, and almost nobody reading this will do it at full scale. You will do it at small scale, on your own machine, in Chapter 37.</p>" +
      "<p><strong>Post-training</strong> is where a text continuer becomes an assistant. Supervised fine-tuning shows it thousands of examples of the behaviour you want. Preference alignment shows it pairs of responses and which one a human preferred, so it can learn a quality signal that examples alone cannot express. This is the stage that produced the difference between GPT-2 in 2019, which continued text, and the assistants of 2022 onward, which answer. The technique that made it work at scale was published by Ouyang and colleagues in 2022 as InstructGPT. It costs thousands of dollars, not millions, and you will do all of it in Chapter 40.</p>" +
      "<p><strong>Inference</strong> is where the model earns or loses money. Every user request runs the forward pass, and it runs it once per output token. This is the stage that decides your latency, your bill, and how many people you can serve on one GPU, and it is the stage that is least understood by the engineers who pay for it. Part V is about nothing else.</p>" +
      "<div class='fig'><svg viewBox='0 0 760 216' xmlns='http://www.w3.org/2000/svg' font-family='Menlo,monospace'>" +
      "<rect x='16' y='34' width='224' height='96' rx='8' fill='#111a2e' stroke='#4f7cff' stroke-width='2'/>" +
      "<text x='128' y='58' text-anchor='middle' fill='#2de2ff' font-size='12'>pretraining</text>" +
      "<text x='128' y='78' text-anchor='middle' fill='#c9d6ea' font-size='10.5'>trillions of tokens in</text>" +
      "<text x='128' y='95' text-anchor='middle' fill='#c9d6ea' font-size='10.5'>a text continuer out</text>" +
      "<text x='128' y='117' text-anchor='middle' fill='#7d8fb0' font-size='10'>Part III &#183; months &#183; $millions</text>" +
      "<line x1='246' y1='82' x2='262' y2='82' stroke='#4f7cff' stroke-width='2'/><polygon points='269,82 257,76 257,88' fill='#4f7cff'/>" +
      "<rect x='274' y='34' width='212' height='96' rx='8' fill='#111a2e' stroke='#4f7cff' stroke-width='2'/>" +
      "<text x='380' y='58' text-anchor='middle' fill='#2de2ff' font-size='12'>post-training</text>" +
      "<text x='380' y='78' text-anchor='middle' fill='#c9d6ea' font-size='10.5'>examples and preferences in</text>" +
      "<text x='380' y='95' text-anchor='middle' fill='#c9d6ea' font-size='10.5'>an assistant out</text>" +
      "<text x='380' y='117' text-anchor='middle' fill='#7d8fb0' font-size='10'>Part IV &#183; days &#183; $thousands</text>" +
      "<line x1='492' y1='82' x2='508' y2='82' stroke='#4f7cff' stroke-width='2'/><polygon points='515,82 503,76 503,88' fill='#4f7cff'/>" +
      "<rect x='520' y='34' width='224' height='96' rx='8' fill='#111a2e' stroke='#ffd166' stroke-width='2.5'/>" +
      "<text x='632' y='58' text-anchor='middle' fill='#ffd166' font-size='12'>inference</text>" +
      "<text x='632' y='78' text-anchor='middle' fill='#c9d6ea' font-size='10.5'>one request in</text>" +
      "<text x='632' y='95' text-anchor='middle' fill='#c9d6ea' font-size='10.5'>one token out, repeatedly</text>" +
      "<text x='632' y='117' text-anchor='middle' fill='#7d8fb0' font-size='10'>Part V &#183; milliseconds &#183; every day</text>" +
      "<line x1='16' y1='150' x2='744' y2='150' stroke='#1c2a45' stroke-width='2'/>" +
      "<text x='16' y='172' fill='#c9d6ea' font-size='11'>Part II sits under all three: the same block runs in every one of them.</text>" +
      "<text x='16' y='194' fill='#7d8fb0' font-size='10.5'>The cost per pass is identical in training and serving. What differs is how many passes, and who is waiting.</text>" +
      "</svg><div class='fig-cap'>Three machines, one architecture. When a chapter confuses you, ask which of these three boxes it is standing in.</div></div>" +
      "<p>Hover the stages in the machine beside this section. Each one names the chapters that open it. Notice that Part II appears under all three: the transformer block you build in Chapters 5 to 11 is the same block in a training run and in a served request. That is why this course teaches the block before it teaches either.</p>" },

    { title: "Three Questions That Explain the Subject",
      html: "<p>Every subject has a small number of questions that, once you can answer them precisely, make the rest of the field readable. For databases it is sorted or not, in place or append, one node or many. For this subject it is these three, and they map onto the parts of this course.</p>" +
      "<p><strong>What is a token?</strong> The model does not see characters and does not see words. It sees pieces produced by an algorithm that was itself trained on a corpus, and those pieces are uneven: common words are one token, rare names are five, a number may split in a way that has nothing to do with its digits. Almost every strange behaviour that gets blamed on reasoning turns out, on inspection, to be a boundary in the wrong place. Chapters 2 and 3.</p>" +
      "<p><strong>What does a block do to a vector?</strong> Each token becomes a vector, and then a stack of identical blocks each read that vector, mix in information from other positions, and write something back. Attention is the mixing. The feed-forward network is the thinking. Everything else in the architecture, and every acronym in every model card, is a variation on how those two are arranged. Chapters 5 to 11.</p>" +
      "<p><strong>What does one more token cost?</strong> In time, in memory, and in money. Once you can answer this, you can size hardware, predict a bill, explain a latency graph, and tell which optimizations will help before you try them. It is also the question this field answers worst in public: the arithmetic is simple, and almost nobody does it. Chapters 9, 16 and 26.</p>" +
      "<div class='callout'><strong>Interview lens.</strong> The third question is the one that separates candidates. &#8220;Why is the first token slow and the rest fast?&#8221; has a precise answer involving two different computations against two different hardware limits, and it is answered from arithmetic, not from experience. Chapter 26 derives it. If you only take one chapter from this course into an interview, take that one.</div>" },

    { title: "Where This Course Stops",
      html: "<p>A course that claims you need nothing else has to say what it is not covering, or the claim is dishonest. This one stops at a clean line: <strong>this course is about the model, and <em>RAG In Depth</em> is about the search engine you put in front of it.</strong></p>" +
      "<p>The two subjects touch, and where they touch this course owns the mechanism and the other owns the application. Tokenization, embeddings as a representation, the context window and what it costs, decoding, fine-tuning, and the reason a model produces confident fabrications in the first place: those are here. Chunking documents, inverted indexes and BM25, approximate nearest-neighbour indexes such as HNSW, rerankers, rank fusion, and knowledge graphs: those are there, taught to the same depth, and this course does not duplicate them.</p>" +
      "<div class='fig'><svg viewBox='0 0 760 236' xmlns='http://www.w3.org/2000/svg' font-family='Menlo,monospace'>" +
      "<rect x='16' y='30' width='348' height='186' rx='8' fill='#111a2e' stroke='#2de2ff' stroke-width='2.5'/>" +
      "<text x='190' y='54' text-anchor='middle' fill='#2de2ff' font-size='12'>this course owns</text>" +
      "<text x='34' y='80' fill='#c9d6ea' font-size='10.5'>tokenization and the tokenizer's failures</text>" +
      "<text x='34' y='100' fill='#c9d6ea' font-size='10.5'>embeddings as representation, and how they train</text>" +
      "<text x='34' y='120' fill='#c9d6ea' font-size='10.5'>attention, the block, positions, MoE</text>" +
      "<text x='34' y='140' fill='#c9d6ea' font-size='10.5'>pretraining, scaling laws, fine-tuning, alignment</text>" +
      "<text x='34' y='160' fill='#c9d6ea' font-size='10.5'>decoding, structured output, tool calling</text>" +
      "<text x='34' y='180' fill='#c9d6ea' font-size='10.5'>KV cache, batching, quantization, serving</text>" +
      "<text x='34' y='200' fill='#c9d6ea' font-size='10.5'>evaluation, judges, jailbreaks, cost</text>" +
      "<rect x='396' y='30' width='348' height='186' rx='8' fill='#111a2e' stroke='#7d8fb0' stroke-width='2'/>" +
      "<text x='570' y='54' text-anchor='middle' fill='#7d8fb0' font-size='12'>RAG In Depth owns</text>" +
      "<text x='414' y='80' fill='#7d8fb0' font-size='10.5'>chunking, and where to cut a document</text>" +
      "<text x='414' y='100' fill='#7d8fb0' font-size='10.5'>inverted indexes and BM25</text>" +
      "<text x='414' y='120' fill='#7d8fb0' font-size='10.5'>HNSW, IVF, product quantization</text>" +
      "<text x='414' y='140' fill='#7d8fb0' font-size='10.5'>hybrid retrieval, rank fusion, rerankers</text>" +
      "<text x='414' y='160' fill='#7d8fb0' font-size='10.5'>grounded generation, citations, refusal</text>" +
      "<text x='414' y='180' fill='#7d8fb0' font-size='10.5'>retrieval metrics and the RAG triad</text>" +
      "<text x='414' y='200' fill='#7d8fb0' font-size='10.5'>knowledge graphs and GraphRAG</text>" +
      "<line x1='380' y1='40' x2='380' y2='206' stroke='#ffd166' stroke-width='2' stroke-dasharray='5 4'/>" +
      "</svg><div class='fig-cap'>The boundary, drawn once. Neither course assumes the other; each points across the line where the other goes deeper.</div></div>" +
      "<p>You do not need <em>RAG In Depth</em> to finish this course, and you did not need this one to finish that. Taking this one first is easier, which is why it is numbered first in the track. When a chapter here reaches the line, it says so and names the chapter over there.</p>" },

    { title: "The Model, the Corpus, and the Five Prompts",
      html: "<p>Courses that change their example every chapter make numbers incomparable. This one fixes four things at the start and uses them to the end, so that a memory figure in Chapter 9 and a latency figure in Chapter 27 are talking about the same machine.</p>" +
      "<p><strong>The model is Corvid-8B.</strong> It is fictional, and it is a realistic configuration rather than an invented one: 32 layers, a model dimension of 4,096, 32 query heads sharing 8 key-value heads, an arrangement called <strong>grouped-query attention</strong>, a feed-forward dimension of 14,336, a vocabulary of 128,256, rotary position embeddings, an 8,192-token context, weights in bfloat16. Every acronym in that sentence is opened in Part II. The name says 8B because those numbers total 8.03 billion parameters, and you will count them yourself in Chapter 9. Real models named 7B are usually not exactly 7 billion either; the number in a model's name is arithmetic you can check, and Chapter 9 teaches the check.</p>" +
      "<div class='fig'><svg viewBox='0 0 760 250' xmlns='http://www.w3.org/2000/svg' font-family='Menlo,monospace'>" +
      "<rect x='16' y='24' width='728' height='204' rx='8' fill='#111a2e' stroke='#ffd166' stroke-width='2.5'/>" +
      "<text x='36' y='50' fill='#ffd166' font-size='13'>Corvid-8B</text>" +
      "<text x='150' y='50' fill='#7d8fb0' font-size='10.5'>the reference model for every calculation in this course</text>" +
      "<line x1='36' y1='62' x2='724' y2='62' stroke='#1c2a45' stroke-width='2'/>" +
      "<text x='36' y='86' fill='#7d8fb0' font-size='10.5'>layers</text><text x='196' y='86' fill='#c9d6ea' font-size='11'>32</text>" +
      "<text x='396' y='86' fill='#7d8fb0' font-size='10.5'>vocabulary</text><text x='576' y='86' fill='#c9d6ea' font-size='11'>128,256 tokens</text>" +
      "<text x='36' y='110' fill='#7d8fb0' font-size='10.5'>model dimension</text><text x='196' y='110' fill='#c9d6ea' font-size='11'>4,096</text>" +
      "<text x='396' y='110' fill='#7d8fb0' font-size='10.5'>context length</text><text x='576' y='110' fill='#c9d6ea' font-size='11'>8,192 tokens</text>" +
      "<text x='36' y='134' fill='#7d8fb0' font-size='10.5'>query heads</text><text x='196' y='134' fill='#c9d6ea' font-size='11'>32</text>" +
      "<text x='396' y='134' fill='#7d8fb0' font-size='10.5'>positions</text><text x='576' y='134' fill='#c9d6ea' font-size='11'>rotary (RoPE)</text>" +
      "<text x='36' y='158' fill='#7d8fb0' font-size='10.5'>key-value heads</text><text x='196' y='158' fill='#ffd166' font-size='11'>8 &#160;(grouped-query)</text>" +
      "<text x='396' y='158' fill='#7d8fb0' font-size='10.5'>precision</text><text x='576' y='158' fill='#c9d6ea' font-size='11'>bfloat16</text>" +
      "<text x='36' y='182' fill='#7d8fb0' font-size='10.5'>feed-forward dim</text><text x='196' y='182' fill='#c9d6ea' font-size='11'>14,336 &#160;(SwiGLU)</text>" +
      "<text x='396' y='182' fill='#7d8fb0' font-size='10.5'>parameters</text><text x='576' y='182' fill='#3ddc97' font-size='11'>8.03 billion</text>" +
      "<line x1='36' y1='196' x2='724' y2='196' stroke='#1c2a45' stroke-width='2'/>" +
      "<text x='36' y='212' fill='#7d8fb0' font-size='10'>Every field on this card is a decision, not a magic number.</text>" +
      "<text x='36' y='226' fill='#7d8fb0' font-size='10'>Part II is the chapter list for the left column. Chapter 9 is where you verify the right.</text>" +
      "</svg><div class='fig-cap'>The spec card you will return to. Nothing here is a magic number; each one was chosen against a cost.</div></div>" +
      "<p><strong>The hardware is the 16 GB budget.</strong> One graphics card with 16 GB of memory, or a laptop with 16 GB of system memory. Every question of the form &#8220;does this fit?&#8221; in this course is answered against that machine, because it is the machine the exercises assume you have. Where something genuinely needs more, the text says so and gives you the smaller version that does fit.</p>" +
      "<p><strong>The corpus is <em>The Almanac</em>.</strong> Roughly 50 MB assembled from public-domain sources: English prose, a Python and C source tree, Hindi and Tamil text, a statistical appendix full of tables and numbers, and two thousand instruction pairs derived from the same material. One corpus trains your tokenizer in Chapter 35, pretrains your model in Chapter 37, fine-tunes it in Chapter 40, and evaluates it throughout, so every measurement you take is comparable with every other.</p>" +
      "<p><strong>The five prompts follow you through the whole course.</strong> P1 is <code>3478 x 29 = ?</code>, which fails for reasons you will find in Chapter 3. P2 asks for a refund notice rewritten in plain English, and is the fine-tuning target in Chapter 20. P3 asks for parties, dates and amounts as JSON, and is the structured-output case in Chapter 19. P4 hides a fact at three depths in a 100,000-token document, and is the long-context probe in Chapter 7. P5 is a layered attempt to talk the model out of its instructions, and it is defended in Chapter 33. Watching one prompt's fate change as the machine around it changes is the fastest way to feel what each mechanism actually does.</p>" },

    { title: "How to Use This Course",
      html: "<p>Each chapter has the same shape. Prose that teaches a mechanism, machines beside the prose that let you operate it, figures where a picture is faster than a paragraph, a list of terms that stand alone, a quiz that tests understanding rather than recall, and exercises you can check yourself.</p>" +
      "<p><strong>The machines are not decoration, and they are not videos.</strong> Each one exists because there is something in the mechanism you cannot learn from a static picture. The text tells you what to do with it and what you will find, in that order. In this chapter it was: delete two words and watch the distribution flatten. Do that before reading on. The habit of stopping and operating the machine is what separates finishing this course from having read it.</p>" +
      "<p><strong>The exercises come in three kinds.</strong> A <em>trace</em> asks you to follow a mechanism by hand on small values, which is how you find out whether you actually understood it. An <em>investigate</em> sends you to a real model, a real config file or real documentation to check a claim. A <em>build</em> adds a piece of code. The build exercises accumulate: by Chapter 41 they are a working language model and an inference engine.</p>" +
      "<p><strong>The capstone is PocketLM</strong>, seven chapters at the end where you write the whole machine. A byte-pair tokenizer, attention and a transformer block, a pretraining run, the modern components ablated one at a time against a harness with confidence intervals, real open weights from Hugging Face loaded into your own code and matched logit for logit, LoRA and DPO implemented from their loss functions, and finally an inference engine in C benchmarked honestly against llama.cpp and vLLM. Python and PyTorch throughout except that last chapter; the engine is in C because its entire lesson is memory traffic, and Python hides memory traffic inside a library.</p>" +
      "<h3>What to install</h3>" +
      "<p>Nothing until Chapter 2, and everything runs on the 16 GB budget. Versions below were current on 6 September 2026; newer point releases are fine.</p>" +
      "<ul>" +
      "<li><strong>Python 3.13 or 3.14.</strong> Both are in active bugfix support; 3.12 still runs everything here but receives security fixes only.</li>" +
      "<li><strong>PyTorch 2.14.</strong> Released 2 September 2026. The CPU build is enough for Chapters 2 to 11; the training chapters want a GPU build or a free notebook tier.</li>" +
      "<li><strong>A C toolchain</strong>, for Chapter 41 only. Clang or GCC, whatever your system already has.</li>" +
      "<li><strong>A model to poke at.</strong> Either Ollama with a small instruct model pulled, or an API key. The course is written so that no chapter depends on one provider.</li>" +
      "<li><strong>Later, and only when their chapter arrives:</strong> Hugging Face transformers and datasets (Chapter 20), vLLM 0.28 (Chapter 27), llama.cpp (Chapters 29 and 41).</li>" +
      "</ul>" +
      "<div class='callout'><strong>If you are here for one thing.</strong> Reading for interviews: Chapters 5 to 9, 26, and 32 carry most of the questions. Paying an inference bill you do not understand: start at Chapter 26, then 27 and 29, and come back for Part II when the arithmetic stops making sense. Fine-tuning something next week: Chapters 3, 20 and 21, in that order, and do not skip 3.</div>" },

    { title: "Exercises",
      html: "<ol>" +
      "<li><strong>Trace.</strong> Take the sentence <code>The cat sat on the</code>. Write down five tokens you think the model puts in its top five, and guess a probability for each so that your five sum to no more than 1. Then open the machine in the first section, type the sentence, and compare. You are not checking whether you were right about the ordering; you are checking whether you were right about how much probability mass sits outside your five guesses.</li>" +
      "<li><strong>Trace.</strong> A model generates a 300-token answer to a 1,200-token prompt. Using only this chapter, state how many times the forward pass runs. Then state what would change if the answer were 600 tokens instead, and what would change if the prompt were 2,400 tokens instead. One of those two doubles the work in a different place than the other, and Chapter 26 is about why.</li>" +
      "<li><strong>Investigate.</strong> Open any open-weights model on Hugging Face and find its <code>config.json</code>. Write down the values corresponding to Corvid-8B's spec card: layers, model dimension, query heads, key-value heads, feed-forward dimension, vocabulary, context length. Note which fields you cannot map onto anything yet. Keep the list. Chapter 9 ends with you being able to explain all of them, and it is a better exercise if you have your own file to explain.</li>" +
      "<li><strong>Investigate.</strong> Find the model card or technical report for the model you use most, and locate two claims: the size of the training corpus, and the context length. Then find whether the card states how the context length was evaluated. Most do not. Chapter 7 explains why that omission matters more than the number.</li>" +
      "<li><strong>Build.</strong> Write ten lines of Python that call a model, ask for the log-probabilities of the top five next tokens for a prompt of your choice, and print them as a sorted list. Use whichever provider or local runtime you installed. This is the smallest possible version of this chapter's machine, and every later chapter that talks about distributions assumes you have seen your own.</li>" +
      "</ol>" }
  ],
  terms: [
    { t: "language model", d: "A function that takes a sequence of tokens and returns a probability for every token in its vocabulary as the next one." },
    { t: "token", d: "The unit a model actually reads: a piece of text produced by a tokenizer, usually smaller than a word and larger than a character." },
    { t: "vocabulary", d: "The fixed, finite set of tokens a model can read and produce; Corvid-8B's holds 128,256 of them." },
    { t: "next-token distribution", d: "The model's output for one position: one probability per vocabulary entry, summing to 1." },
    { t: "autoregressive generation", d: "Producing text by sampling one token from the distribution, appending it to the input, and running the model again." },
    { t: "forward pass", d: "One complete run of the input through every layer of the model, producing one next-token distribution." },
    { t: "parameters", d: "The learned numbers inside a model, sometimes called weights; Corvid-8B has 8.03 billion of them." },
    { t: "context window", d: "The maximum number of tokens the model can attend to at once, 8,192 for Corvid-8B." },
    { t: "pretraining", d: "Training a model from random initialization to predict the next token on a very large corpus, producing a text continuer." },
    { t: "post-training", d: "Everything done to a pretrained model to make it behave as an assistant, including supervised fine-tuning and preference alignment." },
    { t: "supervised fine-tuning", d: "Post-training on examples of the input and the desired output, so the model imitates the behaviour shown." },
    { t: "preference alignment", d: "Post-training on pairs of responses labelled with which one a human preferred, teaching a quality signal that examples alone cannot express." },
    { t: "inference", d: "Running a trained model to serve a request; the stage that decides latency and cost." },
    { t: "open weights", d: "A model whose trained parameters can be downloaded and run on your own hardware, which may still carry licence restrictions." },
    { t: "entropy", d: "A measure of how uncertain a distribution is; a flat next-token distribution has high entropy, a confident one has low entropy." },
    { t: "grouped-query attention", d: "An attention arrangement in which several query heads share one set of key and value heads, reducing the memory that serving a request needs." }
  ],
  quiz: [
    { type: "mc", q: "A model is given the prompt 'The capital of France is' and assigns 0.94 probability to the token ' Paris'. What does the 0.94 describe?", opts: ["The model's confidence that its stored fact about France is correct", "The fraction of training documents in which Paris followed that phrase", "The probability mass this distribution places on one of 128,256 vocabulary entries", "The similarity between the prompt and the model's closest memorized sentence"], a: 2,
      why: "The output of a forward pass is a distribution over the whole vocabulary, and 0.94 is one entry in it. There is no stored fact, no lookup, and no similarity search anywhere in the mechanism. The number is a property of this distribution given this context, which is why deleting two words from the prompt changes it." },
    { type: "mc", q: "You send a 1,200-token prompt and receive a 300-token answer. How many times does the model run a forward pass over the network?", opts: ["Once, because the prompt is processed in a single pass", "1,500 times, once per token in prompt and answer", "Twice: once for the prompt and once for the answer", "300 times, once per generated token"], a: 3,
      why: "Generation is a loop: pick a token, append it, run again. The prompt is consumed in the first pass, and then each of the 300 output tokens costs one more pass. That the prompt's pass and the per-token passes are very different computations against different hardware limits is exactly the subject of Chapter 26." },
    { type: "mc", q: "Which of these belongs to RAG In Depth rather than to this course?", opts: ["How HNSW finds approximate nearest neighbours", "Why a model produces a confident fabrication", "How an embedding model is trained with contrastive loss", "What the context window costs in memory"], a: 0,
      why: "The boundary is mechanism versus retrieval application. This course owns why fabrication happens, what an embedding is and how one is trained, and what context costs. Approximate nearest-neighbour indexes are the search engine's internals, and they are taught to keystone depth in the other course rather than summarized here." },
    { type: "mc", q: "Corvid-8B is described as having 32 query heads and 8 key-value heads. Without knowing anything yet about attention, what does the mismatch most likely exist to reduce?", opts: ["The number of parameters that must be trained", "The memory needed while serving a request", "The number of tokens the tokenizer produces", "The time taken by a single training step"], a: 1,
      why: "Sharing key-value heads across query heads is a serving decision. Keys and values must be stored for every position of every request, so cutting them from 32 sets to 8 cuts that stored memory to a quarter. It is a small parameter saving and almost no training-speed saving; the payoff is how many concurrent users fit on one card. Chapter 6 does the arithmetic." },
    { type: "blank", q: "Producing text by sampling a token, appending it to the input, and running the model again is called ____ generation.", a: ["autoregressive", "auto-regressive", "auto regressive"],
      why: "The word means the model regresses on its own prior output: each new token becomes part of the input that produces the next one. It is the reason output length costs so much more than prompt length, and the reason a model cannot revise a token once it has committed to it." },
    { type: "blank", q: "The fixed, finite set of tokens a model can read and produce is called its ____.", a: ["vocabulary", "vocab"],
      why: "Its size is a design decision with costs on both sides: a larger vocabulary means shorter sequences but a bigger embedding table and a more expensive output layer. Chapter 2 makes you set the slider yourself and find where the trade turns." },
    { type: "mc", q: "Which stage does the most to turn a model that continues your question with three more questions into one that answers it?", opts: ["Pretraining on a larger corpus", "Quantization", "Increasing the context window", "Post-training"], a: 3,
      why: "A pretrained model imitates documents, and in documents a question is often followed by more questions. Post-training, through supervised fine-tuning and then preference alignment, is what shapes that continuer into an assistant. This is the InstructGPT result from 2022, and it is Part IV of this course." },
    { type: "order", q: "Order these by when they happen in a model's life:", items: ["pretraining on a large corpus", "supervised fine-tuning on examples", "preference alignment on comparisons", "serving a user request"],
      why: "Parameters are produced first, then shaped by examples, then shaped again by a quality signal that examples cannot carry, and only then run for users. Each stage has a different cost scale, a different failure mode and a different chapter: Part III, then Part IV, then Part V." },
    { type: "mc", q: "You delete two words from a prompt and the top token's probability falls from 0.94 to 0.31 while the entropy roughly triples. What changed?", opts: ["Nothing in the model changed; the distribution is a function of the context", "The model's parameters adapted to the shorter input", "The tokenizer produced a different vocabulary", "The model switched to a lower-confidence internal mode"], a: 0,
      why: "The same weights produced both distributions. Confidence is not something a model has, it is something a context produces, which is why the same model can be near-certain and near-uniform seconds apart. Any explanation that involves the model changing state between the two calls is wrong." },
    { type: "mc", q: "An engineer says an inference bill tripled after a prompt change that added a 2,000-token system prompt, but latency per output token did not move. Which is the most consistent explanation?", opts: ["The model got slower per parameter", "The vocabulary grew, making each token more expensive", "The work added lands in the prompt-processing pass, not in the per-token loop", "Post-training was invalidated by the longer prompt"], a: 2,
      why: "Prompt tokens and output tokens are charged and computed differently. A longer prompt inflates the pass that consumes it while leaving the per-output-token loop untouched, which is exactly the shape of these symptoms. Chapter 26 derives why those two are separate machines, and Chapter 27 shows the caching that makes a repeated system prompt nearly free." }
  ]
});

/* ======================= CHAPTER 2 ======================= */
CHAPTERS.push({
  num: 2, part: 1, free: true, title: "Tokens: How Text Becomes Numbers",
  blurb: "A model never sees text. It sees integers, and the map from one to the other was itself learned from a corpus by an algorithm you can run by hand. You will build a byte-pair merge table on a small corpus with a pencil, watch the same algorithm produce something that looks like English morphology without being told any grammar, and find out why the vocabulary size is a trade rather than a preference. Every number in this chapter was measured, and the exercises tell you how to reproduce them.",
  sections: [
    { title: "Why Not Characters, Why Not Words",
      html: "<p>The model from Chapter 1 takes a sequence of integers and returns a distribution over its vocabulary. Before any of that can happen, something has to turn your text into those integers. That something is the <strong>tokenizer</strong>, and it is the only part of the machine that is not a neural network. It is an algorithm with a lookup table, and the table was built by a training run of its own, before the model existed.</p>" +
      "<p>Start with the two obvious designs, because both fail in instructive ways.</p>" +
      "<p><strong>One token per character.</strong> The vocabulary is tiny, a hundred or so entries, and nothing is ever unknown. But English runs about four and a half characters per word, so a 500-word prompt becomes roughly 2,800 tokens instead of 600. Chapter 1 told you that generation costs one full forward pass per token, and Chapter 5 will tell you that attention costs grow with the square of the sequence length. Characters make every sequence four times longer, which makes attention sixteen times more expensive. The model also has to spend its early layers learning that <code>c</code>, <code>a</code>, <code>t</code> in that order is a thing, work it would rather not do.</p>" +
      "<p><strong>One token per word.</strong> Now sequences are short, but the vocabulary is unbounded. English has hundreds of thousands of word forms, and that is before names, identifiers, typos, URLs and every other language. You must cap the vocabulary somewhere and map everything past the cap to a single unknown token, which means the model literally cannot read the words that matter most: the rare ones. And every unknown is unrecoverable, because you cannot generate a word that has no id.</p>" +
      "<p>The answer used by every model in production is in between. Split text into <strong>subwords</strong>: common words stay whole, rare words break into pieces that are themselves common. <code>tokenization</code> is not frequent enough to earn its own entry in most vocabularies, so it arrives as two pieces. Measured on OpenAI&#8217;s cl100k_base encoding, the sentence <em>Understanding tokenization prevents a surprising number of production incidents.</em> is nine words and eleven tokens, and the two extra tokens both come from splitting one word:</p>" +
      "<pre><code>['Understanding', ' token', 'ization', ' prevents', ' a',\n ' surprising', ' number', ' of', ' production', ' incidents', '.']</code></pre>" +
      "<p>Notice the leading spaces. In this family of tokenizers the space is part of the following token, so <code> token</code> and <code>token</code> are two different entries with two different ids. Hold that thought; it causes a real bug in Chapter 3.</p>" +
      "<div class='fig'><svg viewBox='0 0 760 190' xmlns='http://www.w3.org/2000/svg' font-family='Menlo,monospace'>" +
      "<text x='20' y='20' fill='#2de2ff' font-size='11'>your text</text>" +
      "<rect x='20' y='30' width='300' height='30' rx='8' fill='#111a2e' stroke='#4f7cff' stroke-width='2'/>" +
      "<text x='170' y='50' text-anchor='middle' fill='#c9d6ea' font-size='11'>Understanding tokenization</text>" +
      "<text x='20' y='82' fill='#2de2ff' font-size='11'>tokens (the tokenizer decides these boundaries)</text>" +
      "<rect x='20' y='92' width='118' height='26' rx='6' fill='#111a2e' stroke='#ffd166' stroke-width='2'/><text x='79' y='110' text-anchor='middle' fill='#ffd166' font-size='10.5'>Understanding</text>" +
      "<rect x='144' y='92' width='60' height='26' rx='6' fill='#111a2e' stroke='#ffd166' stroke-width='2'/><text x='174' y='110' text-anchor='middle' fill='#ffd166' font-size='10.5'>&#183;token</text>" +
      "<rect x='210' y='92' width='68' height='26' rx='6' fill='#111a2e' stroke='#ffd166' stroke-width='2'/><text x='244' y='110' text-anchor='middle' fill='#ffd166' font-size='10.5'>ization</text>" +
      "<text x='20' y='142' fill='#2de2ff' font-size='11'>ids (a row number in the vocabulary)</text>" +
      "<text x='20' y='162' fill='#c9d6ea' font-size='11'>16995</text><text x='144' y='162' fill='#c9d6ea' font-size='11'>4037</text><text x='210' y='162' fill='#c9d6ea' font-size='11'>2065</text>" +
      "<line x1='400' y1='40' x2='400' y2='170' stroke='#1c2a45' stroke-width='2' stroke-dasharray='4 4'/>" +
      "<text x='430' y='60' fill='#7d8fb0' font-size='10.5'>everything left of this line is a lookup table</text>" +
      "<text x='430' y='80' fill='#7d8fb0' font-size='10.5'>and a merge algorithm. No neural network</text>" +
      "<text x='430' y='100' fill='#7d8fb0' font-size='10.5'>is involved, and nothing here is learned</text>" +
      "<text x='430' y='120' fill='#7d8fb0' font-size='10.5'>at model-training time.</text>" +
      "<text x='430' y='150' fill='#ffd166' font-size='10.5'>The ids become vectors in Chapter 4.</text>" +
      "<text x='20' y='182' fill='#7d8fb0' font-size='10'>The middle dot marks a leading space that belongs to the token.</text>" +
      "</svg><div class='fig-cap'>The whole pipeline in front of the model. Change the tokenizer and every id changes, which is why you cannot swap one into a trained model.</div></div>" },

    { title: "Training a Merge Table", viz: "llmBpeTrainer", vizTitle: "Press merge and watch the vocabulary build itself",
      html: "<p>So where do the pieces come from? Nobody chose them. They are the output of an algorithm called <strong>byte-pair encoding</strong>, and it is short enough to state in four lines.</p>" +
      "<ol><li>Split every word in a corpus into its individual characters.</li>" +
      "<li>Count every adjacent pair of symbols across the whole corpus, weighted by how often each word occurs.</li>" +
      "<li>Take the most frequent pair and merge it into one new symbol. Record the merge.</li>" +
      "<li>Repeat until you have as many merges as you wanted.</li></ol>" +
      "<p>The vocabulary is the starting alphabet plus one entry per merge, and the ordered list of merges is the entire trained artifact. The algorithm has no notion of a word, a prefix, or a language. It counts pairs.</p>" +
      "<p>Its origin is not linguistics. Philip Gage published it in 1994 as a <em>data compression</em> technique: replace the most common byte pair with an unused byte, repeat. Rico Sennrich, Barry Haddow and Alexandra Birch brought it to language in 2016 to solve the rare-word problem in machine translation, and the field has used it ever since.</p>" +
      "<h3>Run it by hand</h3>" +
      "<p>Here is a corpus of nineteen words, chosen so the merges are visible: <code>the lower newer wider tower flower power lower newer wider slower newest widest lowest towered flowered powered</code>. Each word is split into characters with an end-of-word marker <code>&lt;/w&gt;</code> so the algorithm can tell a word-final <code>er</code> from one in the middle. These are the first twelve merges it produces, with the count that won each round:</p>" +
      "<pre><code> 1.  'w' + 'e'        -> 'we'          count 13\n 2.  'we' + 'r'       -> 'wer'         count 11\n 3.  'o' + 'wer'      -> 'ower'        count  9\n 4.  'ower' + '&lt;/w&gt;'  -> 'ower&lt;/w&gt;'    count  6\n 5.  'l' + 'ower&lt;/w&gt;' -> 'lower&lt;/w&gt;'   count  4\n 6.  'n' + 'e'        -> 'ne'          count  3\n 7.  'w' + 'i'        -> 'wi'          count  3\n 8.  'wi' + 'd'       -> 'wid'         count  3\n 9.  'wid' + 'e'      -> 'wide'        count  3\n10.  's' + 't'        -> 'st'          count  3\n11.  'st' + '&lt;/w&gt;'    -> 'st&lt;/w&gt;'      count  3\n12.  'ower' + 'e'     -> 'owere'       count  3</code></pre>" +
      "<p>Read what happened. The first merge is <code>we</code>, which is not a word and not a morpheme; it is simply the pair that occurred most. By merge 3 the algorithm has assembled <code>ower</code>, a chunk shared by <em>lower</em>, <em>tower</em>, <em>flower</em>, <em>power</em> and <em>slower</em>. By merge 5, <code>lower</code> as a complete word is a single token. By merge 11 it has discovered <code>st</code> at the end of a word, which is the superlative ending in <em>newest</em>, <em>widest</em> and <em>lowest</em>.</p>" +
      "<p>Nobody told it about superlatives. It found a suffix because suffixes are, by definition, character sequences that repeat. This is the whole reason subword tokenization works: the statistics of a language put its morphology in the frequency counts, and a pair counter walks straight into it.</p>" +
      "<div class='fig'><svg viewBox='0 0 760 218' xmlns='http://www.w3.org/2000/svg' font-family='Menlo,monospace'>" +
      "<text x='20' y='20' fill='#2de2ff' font-size='11'>the word 'lower' as merges accumulate</text>" +
      "<text x='20' y='48' fill='#7d8fb0' font-size='10.5'>start</text>" +
      "<rect x='120' y='34' width='34' height='22' rx='5' fill='#111a2e' stroke='#4f7cff' stroke-width='2'/><text x='137' y='49' text-anchor='middle' fill='#c9d6ea' font-size='10.5'>l</text>" +
      "<rect x='158' y='34' width='34' height='22' rx='5' fill='#111a2e' stroke='#4f7cff' stroke-width='2'/><text x='175' y='49' text-anchor='middle' fill='#c9d6ea' font-size='10.5'>o</text>" +
      "<rect x='196' y='34' width='34' height='22' rx='5' fill='#111a2e' stroke='#4f7cff' stroke-width='2'/><text x='213' y='49' text-anchor='middle' fill='#c9d6ea' font-size='10.5'>w</text>" +
      "<rect x='234' y='34' width='34' height='22' rx='5' fill='#111a2e' stroke='#4f7cff' stroke-width='2'/><text x='251' y='49' text-anchor='middle' fill='#c9d6ea' font-size='10.5'>e</text>" +
      "<rect x='272' y='34' width='34' height='22' rx='5' fill='#111a2e' stroke='#4f7cff' stroke-width='2'/><text x='289' y='49' text-anchor='middle' fill='#c9d6ea' font-size='10.5'>r</text>" +
      "<rect x='310' y='34' width='46' height='22' rx='5' fill='#111a2e' stroke='#7d8fb0' stroke-width='2'/><text x='333' y='49' text-anchor='middle' fill='#7d8fb0' font-size='10'>&#60;/w&#62;</text>" +
      "<text x='20' y='86' fill='#7d8fb0' font-size='10.5'>after merge 1</text>" +
      "<rect x='120' y='72' width='34' height='22' rx='5' fill='#111a2e' stroke='#4f7cff' stroke-width='2'/><text x='137' y='87' text-anchor='middle' fill='#c9d6ea' font-size='10.5'>l</text>" +
      "<rect x='158' y='72' width='34' height='22' rx='5' fill='#111a2e' stroke='#4f7cff' stroke-width='2'/><text x='175' y='87' text-anchor='middle' fill='#c9d6ea' font-size='10.5'>o</text>" +
      "<rect x='196' y='72' width='72' height='22' rx='5' fill='#111a2e' stroke='#ffd166' stroke-width='2.5'/><text x='232' y='87' text-anchor='middle' fill='#ffd166' font-size='10.5'>we</text>" +
      "<rect x='272' y='72' width='34' height='22' rx='5' fill='#111a2e' stroke='#4f7cff' stroke-width='2'/><text x='289' y='87' text-anchor='middle' fill='#c9d6ea' font-size='10.5'>r</text>" +
      "<rect x='310' y='72' width='46' height='22' rx='5' fill='#111a2e' stroke='#7d8fb0' stroke-width='2'/><text x='333' y='87' text-anchor='middle' fill='#7d8fb0' font-size='10'>&#60;/w&#62;</text>" +
      "<text x='20' y='124' fill='#7d8fb0' font-size='10.5'>after merge 3</text>" +
      "<rect x='120' y='110' width='34' height='22' rx='5' fill='#111a2e' stroke='#4f7cff' stroke-width='2'/><text x='137' y='125' text-anchor='middle' fill='#c9d6ea' font-size='10.5'>l</text>" +
      "<rect x='158' y='110' width='148' height='22' rx='5' fill='#111a2e' stroke='#ffd166' stroke-width='2.5'/><text x='232' y='125' text-anchor='middle' fill='#ffd166' font-size='10.5'>ower</text>" +
      "<rect x='310' y='110' width='46' height='22' rx='5' fill='#111a2e' stroke='#7d8fb0' stroke-width='2'/><text x='333' y='125' text-anchor='middle' fill='#7d8fb0' font-size='10'>&#60;/w&#62;</text>" +
      "<text x='20' y='162' fill='#7d8fb0' font-size='10.5'>after merge 5</text>" +
      "<rect x='120' y='148' width='236' height='22' rx='5' fill='#111a2e' stroke='#3ddc97' stroke-width='2.5'/><text x='238' y='163' text-anchor='middle' fill='#3ddc97' font-size='10.5'>lower&#60;/w&#62;</text>" +
      "<text x='400' y='49' fill='#7d8fb0' font-size='10'>6 symbols</text>" +
      "<text x='400' y='87' fill='#7d8fb0' font-size='10'>5 symbols</text>" +
      "<text x='400' y='125' fill='#7d8fb0' font-size='10'>3 symbols</text>" +
      "<text x='400' y='163' fill='#3ddc97' font-size='10'>1 symbol: a whole word, earned</text>" +
      "<text x='20' y='196' fill='#7d8fb0' font-size='10.5'>Frequency alone produced a word boundary. No grammar, no dictionary, no linguist.</text>" +
      "</svg><div class='fig-cap'>Five merges turn six symbols into one. The corpus decides which words are cheap, which is why a tokenizer trained on English makes other languages expensive.</div></div>" +
      "<p>Use the machine beside this section now. Press <em>merge</em> thirty times on the default corpus and watch the vocabulary grow. Then paste in a paragraph of your own writing and run 200 merges. Look for <code> the</code>, <code>ing</code> and <code>tion</code> appearing without you doing anything. That is the discovery: an algorithm that only counts pairs reconstructs a chunk of English morphology, and it does the same for the structure of Python, or of Tamil, or of whatever you paste in.</p>" +
      "<div class='callout'><strong>The edge.</strong> Twelve merges is not many. Ask that trainer to encode <code>lowest</code> and it returns four pieces, <code>l o we st&lt;/w&gt;</code>, even though <em>lowest</em> is in its training corpus. A tokenizer is only as good as its merge budget, and every real one runs tens of thousands of merges. GPT-2 ran roughly 50,000.</div>" },

    { title: "Encoding Is Not a Lookup",
      html: "<p>Training produced an ordered list of merges. Encoding new text applies that list, and the order is the point.</p>" +
      "<p>The naive implementation would be a dictionary: look up the longest matching entry, take it, move on. That is not what BPE does, and the difference shows up on text the tokenizer has never seen. Encoding starts from characters and replays the merge list <em>in training order</em>, applying each merge everywhere it fits before considering the next one. A merge learned at step 5 is applied before one learned at step 900, whether or not the later one would have produced a longer piece.</p>" +
      "<p>This matters because it makes encoding deterministic and reproducible from the merge list alone. Two implementations that replay the same merges in the same order produce identical ids, which is what lets you load someone else&#8217;s weights and get their behaviour. It also means encoding is not free: a naive replay is quadratic in the length of the word, and fast tokenizers use a priority queue keyed by merge rank to get it down. You will write both in Chapter 35 and measure the difference.</p>" +
      "<p>One consequence is worth internalizing now: <strong>a tokenizer cannot be swapped.</strong> The ids are row numbers into an embedding table that was trained alongside them. Change the merge list and id 4037 stops meaning <code> token</code> and starts meaning something else, while the model&#8217;s weights still expect the old meaning. There is no gradual failure here and no error message. The model produces confident nonsense.</p>" },

    { title: "Bytes Underneath",
      html: "<p>Every tokenizer so far has an alphabet problem. If the base symbols are Unicode characters, the base vocabulary must include every character the model might ever see, and there are about 150,000 of them. If you cap the alphabet, then any text using a character outside it is unrepresentable, and you are back to the unknown token.</p>" +
      "<p>GPT-2 solved this in 2019 with a move that is obvious in hindsight: <strong>run BPE over bytes rather than characters</strong>. There are exactly 256 possible bytes, so the base alphabet is 256 entries and it is complete. Any text in any language, any emoji, any corrupted file, any binary blob, encodes to UTF-8 bytes and therefore has a representation. Nothing is ever unknown. This is <strong>byte-level BPE</strong>, and it is what almost every current model uses.</p>" +
      "<p>The floor is the byte count. Merges then buy it back down, and how far down depends entirely on whether that byte sequence was frequent in the tokenizer&#8217;s training corpus. Measured on 6 September 2026 across three OpenAI encodings:</p>" +
      "<ul>" +
      "<li><strong>&#127866; slightly smiling face</strong> &#8212; 4 UTF-8 bytes. GPT-2: 2 tokens. cl100k_base: 2 tokens. o200k_base: <strong>1 token</strong>.</li>" +
      "<li><strong>melting face</strong>, a newer emoji &#8212; 4 UTF-8 bytes. All three encodings: 3 tokens.</li>" +
      "<li><strong>an astronaut with a skin-tone and profession sequence</strong> &#8212; 11 UTF-8 bytes joined by zero-width joiners. GPT-2 and cl100k_base: 8 tokens. o200k_base: 6 tokens.</li>" +
      "</ul>" +
      "<p>So the honest statement is not that an emoji costs four tokens. It is that an emoji costs between one and eight tokens depending on how popular it was when the tokenizer was trained, and you cannot know which without measuring. That single character costing eight tokens is also eight positions of context and eight steps of generation.</p>" +
      "<p>SentencePiece-based tokenizers, which work over characters, get the same guarantee a different way: <strong>byte fallback</strong>. Any character with no entry in the vocabulary is emitted as its raw UTF-8 bytes, each of which does have an entry. The completeness is the same; the cost profile differs.</p>" +
      "<div class='fig'><svg viewBox='0 0 760 206' xmlns='http://www.w3.org/2000/svg' font-family='Menlo,monospace'>" +
      "<text x='20' y='20' fill='#2de2ff' font-size='11'>one character, three tokenizers</text>" +
      "<text x='20' y='48' fill='#c9d6ea' font-size='11'>character</text>" +
      "<rect x='130' y='32' width='60' height='24' rx='6' fill='#111a2e' stroke='#4f7cff' stroke-width='2'/><text x='160' y='49' text-anchor='middle' fill='#c9d6ea' font-size='12'>&#127866;</text>" +
      "<text x='20' y='84' fill='#c9d6ea' font-size='11'>UTF-8 bytes</text>" +
      "<rect x='130' y='68' width='52' height='24' rx='6' fill='#111a2e' stroke='#7d8fb0' stroke-width='2'/><text x='156' y='85' text-anchor='middle' fill='#7d8fb0' font-size='10.5'>F0</text>" +
      "<rect x='186' y='68' width='52' height='24' rx='6' fill='#111a2e' stroke='#7d8fb0' stroke-width='2'/><text x='212' y='85' text-anchor='middle' fill='#7d8fb0' font-size='10.5'>9F</text>" +
      "<rect x='242' y='68' width='52' height='24' rx='6' fill='#111a2e' stroke='#7d8fb0' stroke-width='2'/><text x='268' y='85' text-anchor='middle' fill='#7d8fb0' font-size='10.5'>99</text>" +
      "<rect x='298' y='68' width='52' height='24' rx='6' fill='#111a2e' stroke='#7d8fb0' stroke-width='2'/><text x='324' y='85' text-anchor='middle' fill='#7d8fb0' font-size='10.5'>82</text>" +
      "<text x='366' y='85' fill='#7d8fb0' font-size='10'>the floor: 4 symbols, always representable</text>" +
      "<text x='20' y='122' fill='#c9d6ea' font-size='11'>GPT-2 / cl100k</text>" +
      "<rect x='130' y='106' width='108' height='24' rx='6' fill='#111a2e' stroke='#ffd166' stroke-width='2.5'/><text x='184' y='123' text-anchor='middle' fill='#ffd166' font-size='10.5'>merged pair</text>" +
      "<rect x='242' y='106' width='108' height='24' rx='6' fill='#111a2e' stroke='#ffd166' stroke-width='2.5'/><text x='296' y='123' text-anchor='middle' fill='#ffd166' font-size='10.5'>merged pair</text>" +
      "<text x='366' y='123' fill='#7d8fb0' font-size='10'>2 tokens: merges learned this emoji is common</text>" +
      "<text x='20' y='160' fill='#c9d6ea' font-size='11'>o200k</text>" +
      "<rect x='130' y='144' width='220' height='24' rx='6' fill='#111a2e' stroke='#3ddc97' stroke-width='2.5'/><text x='240' y='161' text-anchor='middle' fill='#3ddc97' font-size='10.5'>one token</text>" +
      "<text x='366' y='161' fill='#7d8fb0' font-size='10'>1 token: a bigger vocabulary bought the whole thing</text>" +
      "<text x='20' y='192' fill='#7d8fb0' font-size='10.5'>Measured with tiktoken 0.14.0 on 2026-09-06. A newer emoji costs 3 tokens in all three.</text>" +
      "</svg><div class='fig-cap'>Bytes are the floor and merges are the discount. What you actually pay is a fact about the tokenizer&#8217;s training corpus, not about the character.</div></div>" },

    { title: "The Other Two Algorithms",
      html: "<p>BPE is the most common but not the only choice, and you will meet the other two in model cards and config files. All three produce subwords; they differ in the criterion for which piece to add next.</p>" +
      "<p><strong>WordPiece</strong> came out of Google in 2012, from Mike Schuster and Kaisuke Nakajima working on Japanese and Korean voice search, and it is what BERT uses. It is BPE with one change: instead of merging the most <em>frequent</em> pair, it merges the pair that most increases the likelihood of the training corpus under a unigram language model. In practice that means it prefers merging pieces that are surprising together, dividing the pair&#8217;s count by the product of its parts&#8217; counts rather than taking the raw count. WordPiece marks continuation pieces with <code>##</code>, so <em>tokenization</em> appears as <code>token</code> <code>##ization</code>.</p>" +
      "<p><strong>Unigram</strong> works backwards, and it is Taku Kudo&#8217;s 2018 contribution. Start with a deliberately oversized candidate vocabulary, then repeatedly compute how much the corpus likelihood would drop if each piece were removed, and delete the least useful few percent. Prune until you hit the target size. Because it keeps a probability for every piece, it can also produce <em>several</em> valid segmentations of the same word with probabilities attached, which is what makes subword regularization possible: train on a different segmentation each epoch and the model becomes robust to how a word is cut.</p>" +
      "<p><strong>SentencePiece</strong> is not a fourth algorithm and this trips people up constantly. It is a library, from Kudo and John Richardson in 2018, that implements both BPE and Unigram and adds one important idea: treat the input as a raw stream including spaces, encoding the space itself as a visible symbol, so that detokenizing is exactly reversible and no language-specific pre-tokenizer is needed. That last property is why it dominates in languages that do not put spaces between words.</p>" +
      "<div class='fig'><svg viewBox='0 0 760 200' xmlns='http://www.w3.org/2000/svg' font-family='Menlo,monospace'>" +
      "<rect x='16' y='26' width='232' height='150' rx='8' fill='#111a2e' stroke='#4f7cff' stroke-width='2'/>" +
      "<text x='132' y='50' text-anchor='middle' fill='#2de2ff' font-size='12'>BPE</text>" +
      "<text x='34' y='76' fill='#c9d6ea' font-size='10.5'>builds up from characters</text>" +
      "<text x='34' y='96' fill='#c9d6ea' font-size='10.5'>criterion: most frequent pair</text>" +
      "<text x='34' y='116' fill='#c9d6ea' font-size='10.5'>artifact: ordered merge list</text>" +
      "<text x='34' y='140' fill='#7d8fb0' font-size='10'>Gage 1994, Sennrich 2016</text>" +
      "<text x='34' y='160' fill='#ffd166' font-size='10'>GPT-2, GPT-4, Llama, Qwen</text>" +
      "<rect x='264' y='26' width='232' height='150' rx='8' fill='#111a2e' stroke='#4f7cff' stroke-width='2'/>" +
      "<text x='380' y='50' text-anchor='middle' fill='#2de2ff' font-size='12'>WordPiece</text>" +
      "<text x='282' y='76' fill='#c9d6ea' font-size='10.5'>builds up from characters</text>" +
      "<text x='282' y='96' fill='#c9d6ea' font-size='10.5'>criterion: likelihood gain</text>" +
      "<text x='282' y='116' fill='#c9d6ea' font-size='10.5'>artifact: vocabulary with ##</text>" +
      "<text x='282' y='140' fill='#7d8fb0' font-size='10'>Schuster &amp; Nakajima 2012</text>" +
      "<text x='282' y='160' fill='#ffd166' font-size='10'>BERT and its descendants</text>" +
      "<rect x='512' y='26' width='232' height='150' rx='8' fill='#111a2e' stroke='#4f7cff' stroke-width='2'/>" +
      "<text x='628' y='50' text-anchor='middle' fill='#2de2ff' font-size='12'>Unigram</text>" +
      "<text x='530' y='76' fill='#c9d6ea' font-size='10.5'>prunes down from many</text>" +
      "<text x='530' y='96' fill='#c9d6ea' font-size='10.5'>criterion: likelihood loss</text>" +
      "<text x='530' y='116' fill='#c9d6ea' font-size='10.5'>artifact: pieces with probs</text>" +
      "<text x='530' y='140' fill='#7d8fb0' font-size='10'>Kudo 2018</text>" +
      "<text x='530' y='160' fill='#ffd166' font-size='10'>T5, Gemma, many others</text>" +
      "</svg><div class='fig-cap'>Same goal, three criteria. BPE asks what is common, WordPiece asks what is informative, Unigram asks what can be spared.</div></div>" },

    { title: "Choosing a Vocabulary Size", viz: "llmVocabTradeoff", vizTitle: "Move the vocabulary slider and watch three costs move against each other",
      html: "<p>The merge budget is a hyperparameter, and it is one of the few in this field where the trade is fully visible in arithmetic. Three quantities move when you change it, and two of them move the wrong way.</p>" +
      "<p><strong>Sequence length falls.</strong> More merges means more whole words in the vocabulary, so the same text becomes fewer tokens. Fewer tokens means cheaper attention, more text per context window, and fewer forward passes per answer. This is the reason to make the vocabulary big.</p>" +
      "<p><strong>The embedding table grows, linearly.</strong> Every entry needs a row of <code>d_model</code> numbers. At Corvid-8B&#8217;s dimension of 4,096, each vocabulary entry costs 4,096 parameters in the input embedding, and another 4,096 in the output projection if the two are not tied. Run the numbers on real models:</p>" +
      "<ul>" +
      "<li><strong>Mistral-7B-v0.3</strong>, vocabulary 32,768: an embedding table of 134 million parameters at <code>d_model</code> 4,096.</li>" +
      "<li><strong>Llama-3-8B</strong>, vocabulary 128,256: 525 million.</li>" +
      "<li><strong>Qwen2.5-7B</strong>, vocabulary 152,064: 623 million.</li>" +
      "<li><strong>Gemma-2-9B</strong>, vocabulary 256,000: 1.05 <em>billion</em> parameters, before the model has a single transformer block.</li>" +
      "</ul>" +
      "<p>Those five figures are read from each model&#8217;s published configuration, and the spread is the argument: a factor of eight in vocabulary between Mistral and Gemma is a real design disagreement, not a rounding difference.</p>" +
      "<p><strong>The output layer grows too.</strong> Chapter 1&#8217;s distribution has one entry per vocabulary token, and producing it means multiplying the final hidden vector by the full output matrix on every single generated token. Doubling the vocabulary doubles that multiply, and it happens once per token forever, in every deployment, for the life of the model.</p>" +
      "<p><strong>And rare-language cost falls.</strong> This is the argument that has moved the field most recently, and it is not primarily an efficiency argument. It is a fairness one.</p>" +
      "<h3>Measure it</h3>" +
      "<p>One sentence, four languages, three encodings, measured on 6 September 2026. Every version says the same thing: <em>the library closes at six in the evening on weekdays</em>.</p>" +
      "<pre><code>                   chars   gpt2   cl100k   o200k\nEnglish              53     12       11      11\nFrench               51     20       16      11\nHindi                56     85       56      17\nTamil                49    133       69      17</code></pre>" +
      "<p>Read the gpt2 column first. The Tamil sentence is <em>shorter</em> than the English one in characters and costs eleven times as many tokens. At 133 tokens for 49 characters, that tokenizer is spending more than two tokens per character, which is worse than if it had given up and used one token per character. Then read across to o200k_base: 17 tokens, a 7.8&#215; improvement, achieved by nothing except a larger vocabulary trained on more multilingual text.</p>" +
      "<p>The effect has a name, <strong>token inflation</strong>, and it is easiest to feel with a price on it. If you are billed per token, the Tamil speaker pays five times more than the English speaker for the same request on cl100k_base. They also get one fifth of the effective context window, and their sequences are five times longer, which by Chapter 5&#8217;s n&#178; cost is twenty-five times the attention work. This is what Ahia and colleagues, and separately Petrov and colleagues, documented in 2023, and it is the strongest single reason vocabularies grew from 32,000 to 256,000 in three years.</p>" +
      "<div class='fig'><svg viewBox='0 0 760 216' xmlns='http://www.w3.org/2000/svg' font-family='Menlo,monospace'>" +
      "<text x='20' y='18' fill='#2de2ff' font-size='11'>tokens for the same sentence (measured, 2026-09-06)</text>" +
      "<text x='20' y='44' fill='#7d8fb0' font-size='10.5'>English</text>" +
      "<rect x='110' y='32' width='36' height='14' rx='3' fill='#3ddc97'/><text x='154' y='43' fill='#7d8fb0' font-size='10'>12</text>" +
      "<rect x='110' y='50' width='33' height='14' rx='3' fill='#4f7cff'/><text x='154' y='61' fill='#7d8fb0' font-size='10'>11</text>" +
      "<text x='20' y='90' fill='#7d8fb0' font-size='10.5'>French</text>" +
      "<rect x='110' y='78' width='60' height='14' rx='3' fill='#3ddc97'/><text x='178' y='89' fill='#7d8fb0' font-size='10'>20</text>" +
      "<rect x='110' y='96' width='48' height='14' rx='3' fill='#4f7cff'/><text x='178' y='107' fill='#7d8fb0' font-size='10'>16</text>" +
      "<text x='20' y='136' fill='#7d8fb0' font-size='10.5'>Hindi</text>" +
      "<rect x='110' y='124' width='255' height='14' rx='3' fill='#3ddc97'/><text x='373' y='135' fill='#7d8fb0' font-size='10'>85</text>" +
      "<rect x='110' y='142' width='168' height='14' rx='3' fill='#4f7cff'/><text x='373' y='153' fill='#7d8fb0' font-size='10'>56</text>" +
      "<text x='20' y='182' fill='#7d8fb0' font-size='10.5'>Tamil</text>" +
      "<rect x='110' y='170' width='399' height='14' rx='3' fill='#ff5d73'/><text x='517' y='181' fill='#ff5d73' font-size='10'>133</text>" +
      "<rect x='110' y='188' width='207' height='14' rx='3' fill='#4f7cff'/><text x='517' y='199' fill='#7d8fb0' font-size='10'>69</text>" +
      "<rect x='560' y='30' width='14' height='10' rx='2' fill='#3ddc97'/><text x='582' y='39' fill='#7d8fb0' font-size='10'>gpt2 (50,257)</text>" +
      "<rect x='560' y='48' width='14' height='10' rx='2' fill='#4f7cff'/><text x='582' y='57' fill='#7d8fb0' font-size='10'>cl100k (100,277)</text>" +
      "<text x='560' y='84' fill='#ffd166' font-size='10'>o200k (200,019) puts all four</text>" +
      "<text x='560' y='100' fill='#ffd166' font-size='10'>between 11 and 17 tokens.</text>" +
      "<text x='560' y='128' fill='#7d8fb0' font-size='10'>The Tamil sentence is shorter</text>" +
      "<text x='560' y='144' fill='#7d8fb0' font-size='10'>than the English one in</text>" +
      "<text x='560' y='160' fill='#7d8fb0' font-size='10'>characters, and costs 11x</text>" +
      "<text x='560' y='176' fill='#7d8fb0' font-size='10'>more under gpt2.</text>" +
      "</svg><div class='fig-cap'>The same meaning, priced four ways. A tokenizer trained mostly on English makes every other language a paying customer.</div></div>" +
      "<p>Take the vocabulary slider in the machine and find the point where the embedding table exceeds the parameter count of four transformer blocks. Then find the point where making the vocabulary bigger stops shortening English text meaningfully. The gap between those two points is the whole design space, and every model named above sits somewhere inside it.</p>" +
      "<div class='callout'><strong>Interview lens.</strong> &#8220;Why did vocabulary sizes grow from 32k to 256k?&#8221; is a question with three correct halves: shorter sequences and therefore cheaper attention, better coverage of non-English text, and a bigger multilingual training mix that made the larger vocabulary worth its embedding cost. An answer that only says &#8220;bigger is better&#8221; misses that it costs a billion parameters and a slower output layer on every token, forever.</div>" },

    { title: "Real Tokenizers, Read", viz: "llmTokenizerCompare", vizTitle: "Type text and compare three tokenizers side by side",
      html: "<p>Enough theory to read a real one. A Hugging Face <code>tokenizer.json</code> has four parts that map directly onto this chapter.</p>" +
      "<ul>" +
      "<li><strong>normalizer</strong> &#8212; what happens to the raw string first: Unicode normalization, lowercasing on older models, nothing at all on most modern ones.</li>" +
      "<li><strong>pre_tokenizer</strong> &#8212; how the text is chopped before BPE sees it, usually a regular expression that keeps punctuation, digits and leading spaces in predictable groups. This is where the leading-space convention from section 1 lives.</li>" +
      "<li><strong>model</strong> &#8212; the type (<code>BPE</code>, <code>WordPiece</code>, <code>Unigram</code>), the vocabulary, and for BPE the ordered merge list. This is the trained artifact.</li>" +
      "<li><strong>post_processor</strong> and <strong>added_tokens</strong> &#8212; the special tokens bolted on afterwards, which is Chapter 3&#8217;s subject and the source of more production bugs than the rest of the file combined.</li>" +
      "</ul>" +
      "<p>Corvid-8B&#8217;s 128,256 can now be explained rather than asserted. It is byte-level BPE, so 256 of those entries are the raw bytes and nothing is ever unknown. The remainder is roughly 128,000 merges, which is enough to cover English, code and the major world languages at a few tokens per word. At <code>d_model</code> 4,096 it costs 525 million parameters in the embedding table, about 6.5% of the model&#8217;s 8.03 billion, and Chapter 9 will make you check that figure yourself. It is the same size Llama 3 chose, and it sits between Mistral&#8217;s 32,768 and Gemma&#8217;s 256,000 because that is where the trade currently lands for a model of this size.</p>" +
      "<p>Use the comparison machine now, and do two things with it. First, paste an English paragraph and switch encodings; the counts will differ by ten or twenty percent, which is unremarkable. Then paste the same paragraph translated into a language written in a non-Latin script and switch again. The counts will differ by a factor of five or more. That is the discovery, and it is the one fact from this chapter that will change a decision you make.</p>" },

    { title: "Exercises",
      html: "<ol>" +
      "<li><strong>Trace.</strong> Run byte-pair encoding by hand on the corpus <code>low low lower lowest slow slower</code>, with an end-of-word marker. Do six merges, writing down the pair counts each round before you pick a winner. Then encode the word <code>slowest</code> with your merge list, applying merges in the order you learned them. Count the tokens. Now encode it again by greedily taking the longest matching piece at each step. If the two answers differ, you have found exactly why section 3 says encoding is not a lookup.</li>" +
      "<li><strong>Trace.</strong> Corvid-8B has a vocabulary of 128,256 and a model dimension of 4,096. Compute the size of its input embedding table in parameters, then in bytes at bfloat16. Then do the same for a hypothetical variant with Gemma-2&#8217;s 256,000-entry vocabulary. State how many transformer blocks that difference would buy, given that Chapter 9 will show each block is about 218 million parameters. You now have the argument that section 6 is making, in numbers you produced.</li>" +
      "<li><strong>Investigate.</strong> Install <code>tiktoken</code> and reproduce the multilingual table in section 6. Take one sentence, translate it into three languages including one in a non-Latin script, and count tokens under <code>gpt2</code>, <code>cl100k_base</code> and <code>o200k_base</code>. Your absolute numbers will differ from the ones printed here because your sentences differ; the ratios should not. If a ratio in your table is wildly different from the ones here, work out whether it is the script, the sentence length, or the encoding that explains it.</li>" +
      "<li><strong>Investigate.</strong> Open the <code>tokenizer.json</code> of any open-weights model and find the four parts named in section 7. Read the <code>pre_tokenizer</code> regular expression and work out what it does with a run of four spaces, with a number like <code>1234567</code>, and with an apostrophe in <code>don't</code>. Write down your prediction for each, then check it by encoding those exact strings. At least one of the three will surprise you, and Chapter 3 is about the family of bugs that surprise belongs to.</li>" +
      "<li><strong>Build.</strong> Write a BPE trainer in about forty lines of Python: read a text file, split into words, count pairs, merge the most frequent, repeat for a configurable number of merges, and print the merge list. Run it on a corpus of your own with 200 merges and read the list from top to bottom. Note which merge number first produces a complete common word, and which first produces a recognizable suffix. Keep this code. Chapter 35 turns it into a real tokenizer with encoding, decoding and byte-level handling, and it is the first layer of PocketLM.</li>" +
      "</ol>" }
  ],
  terms: [
    { t: "tokenizer", d: "The algorithm and lookup table that convert text into the integer ids a model reads, and back again; the only part of the pipeline that is not a neural network." },
    { t: "token", d: "One entry in the vocabulary: usually a subword, sometimes a whole word, sometimes a single byte." },
    { t: "subword", d: "A piece smaller than a word and larger than a character, chosen so that common words stay whole and rare words break into common pieces." },
    { t: "byte-pair encoding", d: "A tokenizer training algorithm that repeatedly merges the most frequent adjacent pair of symbols, producing an ordered merge list." },
    { t: "merge list", d: "The ordered record of every merge BPE learned during training; replaying it in order is what encoding means." },
    { t: "merge rank", d: "A merge's position in that ordered list, used by fast encoders to decide which merge to apply next." },
    { t: "byte-level BPE", d: "Running BPE over the 256 possible bytes rather than over characters, so that every possible input has a representation and nothing is ever unknown." },
    { t: "byte fallback", d: "The equivalent guarantee in character-based tokenizers: any character absent from the vocabulary is emitted as its raw UTF-8 bytes." },
    { t: "unknown token", d: "The single id a word-level tokenizer must fall back to for anything outside its vocabulary; byte-level tokenizers do not need one." },
    { t: "WordPiece", d: "A subword algorithm that merges the pair which most increases corpus likelihood rather than the most frequent pair, and marks continuations with a double hash." },
    { t: "Unigram", d: "A subword algorithm that starts from an oversized candidate vocabulary and prunes the least useful pieces, keeping a probability for each survivor." },
    { t: "SentencePiece", d: "A library implementing BPE and Unigram that treats the input as a raw stream including spaces, making detokenization exactly reversible without a language-specific pre-tokenizer." },
    { t: "pre-tokenizer", d: "The rule, usually a regular expression, that chops raw text into chunks before the subword algorithm runs; it decides how spaces, digits and punctuation group." },
    { t: "vocabulary size", d: "The number of entries in the tokenizer's table, and a hyperparameter that trades sequence length against embedding and output-layer cost." },
    { t: "embedding table", d: "The matrix with one row per vocabulary entry and one column per model dimension; 525 million parameters for Corvid-8B." },
    { t: "token inflation", d: "The effect where text in an under-represented language costs several times more tokens than an equivalent English sentence, with matching cost and context consequences." },
    { t: "subword regularization", d: "Training on different valid segmentations of the same word across epochs, made possible by Unigram's probabilities, to make a model robust to how words are cut." }
  ],
  quiz: [
    { type: "mc", q: "A tokenizer is trained with 12 merges on a corpus containing the word 'lowest', and then asked to encode 'lowest'. It returns four tokens. What does that tell you?", opts: ["The merge budget was too small to buy that word a shorter encoding", "The word was not in the training corpus", "The tokenizer fell back to bytes because of an unknown character", "The pre-tokenizer split the word before BPE ran"], a: 0,
      why: "Appearing in the corpus is not enough. A word only becomes a short encoding if merges reach it, and merges are spent in frequency order. With 12 merges the algorithm had bought 'ower' and 'st' but had not yet worked up to the whole word. Real tokenizers run tens of thousands of merges for exactly this reason." },
    { type: "mc", q: "Why can you not swap a different tokenizer into a trained model?", opts: ["The new tokenizer would produce a different number of tokens, exceeding the context window", "Tokenizers and models are compiled together into one binary", "Token ids are row numbers into an embedding table trained alongside those exact ids", "The new tokenizer would lack the special tokens the model requires"], a: 2,
      why: "The id is not a name, it is an address. Id 4037 means ' token' only because the embedding table's row 4037 was trained while that id meant ' token'. Change the merge list and every address points at the wrong row. Nothing crashes and no error appears; the model simply produces confident nonsense, which is the worst failure mode there is." },
    { type: "mc", q: "The same sentence in Tamil costs 133 tokens under GPT-2's encoding and 17 under o200k_base. What changed?", opts: ["o200k_base uses byte fallback while GPT-2 does not", "Tamil is compressed more efficiently in UTF-8 by newer encodings", "GPT-2 emitted unknown tokens for characters outside its alphabet", "o200k_base has a larger vocabulary trained on more multilingual text, so merges cover Tamil sequences"], a: 3,
      why: "Both are byte-level BPE, so both can represent Tamil and neither needs an unknown token. The UTF-8 bytes are identical. The only difference is how many merges were spent on Tamil byte sequences, which is a fact about each tokenizer's training corpus and vocabulary budget. Bytes are the floor; merges are the discount." },
    { type: "mc", q: "You double a model's vocabulary from 128k to 256k at d_model 4,096. Which cost is paid on every single generated token, forever?", opts: ["The larger embedding table's memory footprint", "The output projection multiply that produces the distribution", "The longer merge list at encoding time", "The pre-tokenizer's regular expression"], a: 1,
      why: "The embedding table is a lookup, so its size costs memory but not per-token work. Encoding happens once per prompt. The output projection is different: producing the next-token distribution means multiplying the final hidden vector by the full output matrix, once per generated token, in every request for the life of the model. Doubling the vocabulary doubles that multiply." },
    { type: "blank", q: "Running the merge algorithm over the 256 possible bytes rather than over characters, so that nothing is ever unknown, is called ____ BPE.", a: ["byte-level", "byte level", "bytelevel"],
      why: "GPT-2 introduced it in 2019. Because there are exactly 256 bytes and every text in every language encodes to UTF-8, the base alphabet is complete and finite at the same time, which removes the unknown token entirely. The cost is that a rare character starts at several symbols and only merges buy it back down." },
    { type: "blank", q: "The ordered record of every pair BPE combined during training, which encoding replays in order, is called the ____ list.", a: ["merge", "merges"],
      why: "It is the entire trained artifact of a BPE tokenizer. Two implementations that replay the same merges in the same order produce identical ids, which is what makes it possible to load someone else's weights and reproduce their behaviour exactly." },
    { type: "mc", q: "Which statement about WordPiece is correct?", opts: ["It prunes an oversized vocabulary down to a target size", "It is a library rather than an algorithm", "It operates on bytes rather than characters", "It merges the pair that most increases the training corpus likelihood, not the most frequent pair"], a: 3,
      why: "WordPiece is BPE with a different criterion: it favours pairs that are informative together rather than merely common, effectively dividing a pair's count by the product of its parts' counts. Pruning from an oversized vocabulary is Unigram. Being a library rather than an algorithm is SentencePiece, which implements BPE and Unigram but is not itself a third algorithm." },
    { type: "order", q: "Order the steps of one round of BPE training:", items: ["count every adjacent pair of symbols across the corpus", "select the pair with the highest count", "replace that pair with a single new symbol everywhere it occurs", "append the merge to the ordered list"],
      why: "Every round is count, select, replace, record. The recording is the part people forget, and it is the part that matters: the vocabulary can be reconstructed from the merge list, but the merge list cannot be reconstructed from the vocabulary, because the order is what encoding needs." },
    { type: "mc", q: "Your product bills users per token. A user writing in Hindi complains that identical requests cost far more than a colleague's English ones. Using this chapter, what is the most accurate diagnosis?", opts: ["The tokenizer's merges cover English sequences far better than Devanagari ones, so the same meaning costs several times more tokens", "Hindi text is larger in UTF-8, so more bytes are billed", "The model processes non-English text more slowly, and the bill reflects time", "The context window is smaller for non-Latin scripts"], a: 0,
      why: "Billing is per token, not per byte or per second, and the token count is decided entirely by how much of the merge budget was spent on that script. Measured on cl100k_base, the Hindi sentence in this chapter costs 5.1 times the English one. The consequences compound: five times the cost, one fifth of the usable context, and by Chapter 5's n-squared attention cost, far more than five times the work." },
    { type: "mc", q: "An engineer proposes a character-level tokenizer to avoid all subword problems. What is the strongest objection from this chapter?", opts: ["Characters cannot represent emoji or non-Latin scripts", "The vocabulary would be too large to train", "Sequences become roughly four times longer, and attention cost grows with the square of sequence length", "Character-level models cannot be fine-tuned"], a: 2,
      why: "The vocabulary would be small, not large, and Unicode characters can represent anything. The real objection is cost: English runs about four and a half characters per word, so every sequence lengthens by roughly four times, every generation needs four times as many forward passes, and the quadratic term in attention makes the memory and compute roughly sixteen times worse. The idea is not absurd, and byte-level models are researched, but this is the price." }
  ]
});

/* ======================= CHAPTER 3 ======================= */
CHAPTERS.push({
  num: 3, part: 1, title: "Where Tokenizers Betray You",
  blurb: "A model that writes a decent sonnet fails at 3478 times 29, argues with your Python indentation, and gives a worse answer when your prompt ends in a space. None of these are reasoning failures. They are tokenization artifacts, and once you can see the boundaries you can predict them before they happen. Then the part that breaks silently in production: special tokens and the chat template, which ruin more fine-tunes than any hyperparameter. Everything here was measured on real tokenizers, and the numbers are reproducible.",
  sections: [
    { title: "Numbers, and the Arithmetic That Is Not There", viz: "llmTokenBoundaries", vizTitle: "Type text and watch the boundaries, with traps flagged",
      html: "<p>Prompt P1 from Chapter 1 is <code>3478 * 29</code>. Models get this class of problem wrong at a rate that seems impossible for a machine that can explain the Riemann hypothesis. The reason is visible the moment you look at the boundaries.</p>" +
      "<p>Here is <code>3478 * 29</code> through four real tokenizers, measured on 6 September 2026:</p>" +
      "<pre><code>gpt2        4 tokens   ['34', '78', ' *', ' 29']\ncl100k      5 tokens   ['347', '8', ' *', ' ', '29']\nLlama 3     5 tokens   ['347', '8', ' *', ' ', '29']\nQwen 2.5    8 tokens   ['3', '4', '7', '8', ' *', ' ', '2', '9']</code></pre>" +
      "<p>Look at what GPT-2 did to 3478. It split it into <code>34</code> and <code>78</code>, two chunks that have nothing to do with the number&#8217;s place value. The model is not being asked to multiply three thousand four hundred and seventy-eight by twenty-nine. It is being asked to predict what tokens follow the symbols <code>34</code>, <code>78</code>, <code> *</code>, <code> 29</code>. To get the right answer it has to internally reconstruct the magnitude from pieces that were cut on frequency, not on arithmetic, and then produce a result in pieces cut the same way.</p>" +
      "<p>Now look at Llama 3: <code>347</code> then <code>8</code>. A different wrong split. And then Qwen 2.5, which splits every digit into its own token.</p>" +
      "<h3>Why one of these is deliberate</h3>" +
      "<p>Qwen&#8217;s <strong>single-digit tokenization</strong> is not an accident of frequency; it is a design decision, and several model families have made the same one. If every digit is its own token, the model sees numbers in a positional form that matches how arithmetic actually works, and the correspondence between a digit and its place is learnable rather than accidental. The cost is length: <code>1234567</code> becomes seven tokens instead of three, and any document heavy with figures becomes proportionally more expensive.</p>" +
      "<pre><code>                  '1234567'                    tokens\ngpt2         ['123', '45', '67']                  3\ncl100k       ['123', '456', '7']                  3\nLlama 3      ['123', '456', '7']                  3\nQwen 2.5     ['1','2','3','4','5','6','7']        7</code></pre>" +
      "<p>Then there is the formatting trap. Add the thousands separators a human would write and every tokenizer gets <em>worse</em>, not better:</p>" +
      "<pre><code>                  '1,234,567'                  tokens\ngpt2         ['1', ',', '234', ',', '5', '67']    6\ncl100k       ['1', ',', '234', ',', '567']        5\nLlama 3      ['1', ',', '234', ',', '567']        5\nQwen 2.5     ['1',',','2','3','4',',','5','6','7'] 9</code></pre>" +
      "<p>The comma-formatted number costs roughly twice the tokens of the bare one and fragments differently. If you are building anything that feeds a model financial figures, that is a decision you now get to make on purpose.</p>" +
      "<div class='fig'><svg viewBox='0 0 760 208' xmlns='http://www.w3.org/2000/svg' font-family='Menlo,monospace'>" +
      "<text x='20' y='18' fill='#2de2ff' font-size='11'>the number 3478, cut four ways (measured 2026-09-06)</text>" +
      "<text x='20' y='48' fill='#7d8fb0' font-size='10.5'>gpt2</text>" +
      "<rect x='120' y='34' width='86' height='24' rx='6' fill='#111a2e' stroke='#ff5d73' stroke-width='2'/><text x='163' y='51' text-anchor='middle' fill='#ff5d73' font-size='11'>34</text>" +
      "<rect x='210' y='34' width='86' height='24' rx='6' fill='#111a2e' stroke='#ff5d73' stroke-width='2'/><text x='253' y='51' text-anchor='middle' fill='#ff5d73' font-size='11'>78</text>" +
      "<text x='320' y='51' fill='#7d8fb0' font-size='10'>two halves, neither a place value</text>" +
      "<text x='20' y='92' fill='#7d8fb0' font-size='10.5'>cl100k / Llama 3</text>" +
      "<rect x='120' y='78' width='130' height='24' rx='6' fill='#111a2e' stroke='#ffd166' stroke-width='2'/><text x='185' y='95' text-anchor='middle' fill='#ffd166' font-size='11'>347</text>" +
      "<rect x='254' y='78' width='42' height='24' rx='6' fill='#111a2e' stroke='#ffd166' stroke-width='2'/><text x='275' y='95' text-anchor='middle' fill='#ffd166' font-size='11'>8</text>" +
      "<text x='320' y='95' fill='#7d8fb0' font-size='10'>a different wrong split: 347 and 8</text>" +
      "<text x='20' y='136' fill='#7d8fb0' font-size='10.5'>Qwen 2.5</text>" +
      "<rect x='120' y='122' width='40' height='24' rx='6' fill='#111a2e' stroke='#3ddc97' stroke-width='2'/><text x='140' y='139' text-anchor='middle' fill='#3ddc97' font-size='11'>3</text>" +
      "<rect x='164' y='122' width='40' height='24' rx='6' fill='#111a2e' stroke='#3ddc97' stroke-width='2'/><text x='184' y='139' text-anchor='middle' fill='#3ddc97' font-size='11'>4</text>" +
      "<rect x='208' y='122' width='40' height='24' rx='6' fill='#111a2e' stroke='#3ddc97' stroke-width='2'/><text x='228' y='139' text-anchor='middle' fill='#3ddc97' font-size='11'>7</text>" +
      "<rect x='252' y='122' width='40' height='24' rx='6' fill='#111a2e' stroke='#3ddc97' stroke-width='2'/><text x='272' y='139' text-anchor='middle' fill='#3ddc97' font-size='11'>8</text>" +
      "<text x='320' y='139' fill='#3ddc97' font-size='10'>one token per digit: chosen on purpose, costs length</text>" +
      "<line x1='20' y1='162' x2='740' y2='162' stroke='#1c2a45' stroke-width='2'/>" +
      "<text x='20' y='184' fill='#7d8fb0' font-size='10.5'>The model never sees 3478. It sees whichever of these four rows its tokenizer produced,</text>" +
      "<text x='20' y='200' fill='#7d8fb0' font-size='10.5'>and has to rebuild the magnitude from pieces cut on frequency rather than on place value.</text>" +
      "</svg><div class='fig-cap'>Four tokenizers, one number, four different problems handed to the model. Single-digit splitting is the only row where token boundaries and place value agree.</div></div>" +
      "<p>Open the machine beside this section and type a large number. Then type it with commas. Then type it as currency. The token count and the boundaries change every time, and the model&#8217;s arithmetic accuracy changes with them. That is the discovery: <strong>the format of a number in your prompt is a modelling decision, not a presentation one.</strong></p>" },

    { title: "Whitespace, Indentation, and Code",
      html: "<p>The same effect governs code, where it decides how expensive your repository is to send and how reliably a model can produce a language whose syntax is whitespace.</p>" +
      "<p>Take one indented Python line, <code>    return x</code>, with four leading spaces:</p>" +
      "<pre><code>gpt2        5 tokens   [' ', ' ', ' ', ' return', ' x']\ncl100k      3 tokens   ['   ', ' return', ' x']\nLlama 3     3 tokens   ['   ', ' return', ' x']\nQwen 2.5    3 tokens   ['   ', ' return', ' x']</code></pre>" +
      "<p>GPT-2 spends a separate token on each of the first three spaces. Newer tokenizers include multi-space runs in their vocabulary because their training corpora contained a great deal of code, so the same line costs three tokens instead of five. Across a large Python file, at four levels of nesting, that difference alone is tens of percent of the bill.</p>" +
      "<p>Tabs behave differently again. <code>\\treturn x</code> is three tokens under GPT-2 and <strong>two</strong> under all three modern tokenizers, which merge the tab into the following word: the single token <code>\\treturn</code> exists in their vocabularies. A tab-indented file and a space-indented file of identical content do not cost the same, and neither do they present the model with the same symbols.</p>" +
      "<div class='fig'><svg viewBox='0 0 760 176' xmlns='http://www.w3.org/2000/svg' font-family='Menlo,monospace'>" +
      "<text x='20' y='18' fill='#2de2ff' font-size='11'>one indented line of Python: '    return x'</text>" +
      "<text x='20' y='46' fill='#7d8fb0' font-size='10.5'>gpt2</text>" +
      "<rect x='96' y='32' width='30' height='22' rx='5' fill='#111a2e' stroke='#ff5d73' stroke-width='2'/><text x='111' y='47' text-anchor='middle' fill='#ff5d73' font-size='10'>&#183;</text>" +
      "<rect x='130' y='32' width='30' height='22' rx='5' fill='#111a2e' stroke='#ff5d73' stroke-width='2'/><text x='145' y='47' text-anchor='middle' fill='#ff5d73' font-size='10'>&#183;</text>" +
      "<rect x='164' y='32' width='30' height='22' rx='5' fill='#111a2e' stroke='#ff5d73' stroke-width='2'/><text x='179' y='47' text-anchor='middle' fill='#ff5d73' font-size='10'>&#183;</text>" +
      "<rect x='198' y='32' width='84' height='22' rx='5' fill='#111a2e' stroke='#4f7cff' stroke-width='2'/><text x='240' y='47' text-anchor='middle' fill='#c9d6ea' font-size='10'>&#183;return</text>" +
      "<rect x='286' y='32' width='44' height='22' rx='5' fill='#111a2e' stroke='#4f7cff' stroke-width='2'/><text x='308' y='47' text-anchor='middle' fill='#c9d6ea' font-size='10'>&#183;x</text>" +
      "<text x='350' y='47' fill='#ff5d73' font-size='10.5'>5 tokens: three of them are a single space each</text>" +
      "<text x='20' y='90' fill='#7d8fb0' font-size='10.5'>cl100k, Llama 3, Qwen 2.5</text>" +
      "<rect x='96' y='76' width='98' height='22' rx='5' fill='#111a2e' stroke='#3ddc97' stroke-width='2'/><text x='145' y='91' text-anchor='middle' fill='#3ddc97' font-size='10'>&#183;&#183;&#183;</text>" +
      "<rect x='198' y='76' width='84' height='22' rx='5' fill='#111a2e' stroke='#4f7cff' stroke-width='2'/><text x='240' y='91' text-anchor='middle' fill='#c9d6ea' font-size='10'>&#183;return</text>" +
      "<rect x='286' y='76' width='44' height='22' rx='5' fill='#111a2e' stroke='#4f7cff' stroke-width='2'/><text x='308' y='91' text-anchor='middle' fill='#c9d6ea' font-size='10'>&#183;x</text>" +
      "<text x='350' y='91' fill='#3ddc97' font-size='10.5'>3 tokens: a three-space run is one vocabulary entry</text>" +
      "<line x1='20' y1='112' x2='740' y2='112' stroke='#1c2a45' stroke-width='2'/>" +
      "<text x='20' y='134' fill='#c9d6ea' font-size='10.5'>The same line with a tab instead: 3 tokens under gpt2, 2 under the others,</text>" +
      "<text x='20' y='152' fill='#c9d6ea' font-size='10.5'>because they hold the single token '\\treturn'.</text>" +
      "<text x='20' y='170' fill='#7d8fb0' font-size='10'>Middle dots mark spaces. Tabs and spaces are different symbols to the model, not just to your linter.</text>" +
      "</svg><div class='fig-cap'>Indentation is not free and it is not uniform. A tokenizer trained on more code buys whitespace runs their own entries.</div></div>" },

    { title: "The Trailing Space",
      html: "<p>This is the smallest bug in the chapter and the one that catches the most people, because the symptom is a quality regression with no error anywhere.</p>" +
      "<p>Chapter 2 established the <strong>leading-space convention</strong>: in byte-level BPE the leading space belongs to the following token. So <code>hello</code> and <code> hello</code> are two different vocabulary entries with two different ids. Measured under cl100k_base: <code>hello</code> is id 15339, <code> hello</code> is id 24748. Not adjacent, not related, two unrelated rows of the embedding table.</p>" +
      "<p>Now consider two prompts that look identical in a text box:</p>" +
      "<pre><code>'The capital of France is'      5 tokens, last token ' is'\n'The capital of France is '     6 tokens, last token ' '</code></pre>" +
      "<p>In the first, the model&#8217;s next token is naturally <code> Paris</code>, complete with its leading space, and that token is common and well trained. In the second, you have already supplied the space. The model must now produce <code>Paris</code> without a leading space, a rarer token in a context where almost all of its training saw the space-prefixed form. You have pushed it slightly off the distribution it knows best, and you did it by pressing the space bar.</p>" +
      "<p>This is the <strong>trailing-space bug</strong>, and its effect is usually small and occasionally not. It is worst in completion-style prompting, few-shot templates that end with a colon and a space, and any prompt assembled by string concatenation where a trailing space sneaks in from a join. It is one reason completion-style prompts have a reputation for fragility that chat-formatted ones do not.</p>" +
      "<div class='fig'><svg viewBox='0 0 760 220' xmlns='http://www.w3.org/2000/svg' font-family='Menlo,monospace'>" +
      "<text x='20' y='18' fill='#2de2ff' font-size='11'>one space, two different jobs for the model</text>" +
      "<rect x='20' y='30' width='352' height='176' rx='8' fill='#111a2e' stroke='#3ddc97' stroke-width='2'/>" +
      "<text x='38' y='52' fill='#3ddc97' font-size='11'>...France is</text>" +
      "<text x='38' y='72' fill='#7d8fb0' font-size='10'>5 tokens, last one is ' is'</text>" +
      "<text x='38' y='100' fill='#c9d6ea' font-size='10.5'>next token must be:</text>" +
      "<rect x='38' y='110' width='120' height='24' rx='6' fill='#111a2e' stroke='#3ddc97' stroke-width='2'/><text x='98' y='127' text-anchor='middle' fill='#3ddc97' font-size='10.5'>&#183;Paris</text>" +
      "<text x='170' y='127' fill='#7d8fb0' font-size='10'>space-prefixed:</text>" +
      "<text x='170' y='142' fill='#7d8fb0' font-size='10'>the common form</text>" +
      "<text x='38' y='176' fill='#7d8fb0' font-size='10'>the form almost all of its</text>" +
      "<text x='38' y='192' fill='#7d8fb0' font-size='10'>training saw after ordinary text</text>" +
      "<rect x='388' y='30' width='352' height='176' rx='8' fill='#111a2e' stroke='#ff5d73' stroke-width='2'/>" +
      "<text x='406' y='52' fill='#ff5d73' font-size='11'>...France is&#183;</text>" +
      "<text x='406' y='72' fill='#7d8fb0' font-size='10'>6 tokens, last one is the bare space</text>" +
      "<text x='406' y='100' fill='#c9d6ea' font-size='10.5'>next token must be:</text>" +
      "<rect x='406' y='110' width='120' height='24' rx='6' fill='#111a2e' stroke='#ff5d73' stroke-width='2'/><text x='466' y='127' text-anchor='middle' fill='#ff5d73' font-size='10.5'>Paris</text>" +
      "<text x='538' y='127' fill='#7d8fb0' font-size='10'>no prefix:</text>" +
      "<text x='538' y='142' fill='#7d8fb0' font-size='10'>a different, rarer id</text>" +
      "<text x='406' y='176' fill='#7d8fb0' font-size='10'>you supplied the space, so the model</text>" +
      "<text x='406' y='192' fill='#7d8fb0' font-size='10'>is pushed off the distribution it knows</text>" +
      "</svg><div class='fig-cap'>The same split applies to every word: under cl100k_base &#8216; hello&#8217; is id 24748 and &#8216;hello&#8217; is 15339, two unrelated rows of the embedding table. Pressing the space bar chose the right-hand column.</div></div>" +
      "<div class='callout'><strong>The edge.</strong> The fix is to never end a prompt with whitespace, and to let the model produce the space as part of its first token. If you are building prompts programmatically, strip trailing whitespace at the boundary rather than trusting every call site. A test that asserts your assembled prompt does not end in whitespace costs one line and catches a class of quality regressions that are otherwise invisible.</div>" },

    { title: "Special Tokens, and Where They Come From",
      html: "<p>Everything so far concerns tokens learned from text. Models also need symbols that could never appear in text, because they mark structure rather than content: where a document begins, where a turn ends, where padding starts. These are <strong>special tokens</strong>, and they are added to the vocabulary after training rather than learned by merging.</p>" +
      "<p>The usual set:</p>" +
      "<ul>" +
      "<li><strong>BOS token</strong>, the beginning of sequence. Llama 3 uses <code>&lt;|begin_of_text|&gt;</code>. Qwen 2.5 has none at all, which is the first thing that surprises people porting code between them.</li>" +
      "<li><strong>EOS token</strong>, the end of sequence: the token whose generation means stop. Llama 3&#8217;s instruct model uses <code>&lt;|eot_id|&gt;</code>, Qwen uses <code>&lt;|im_end|&gt;</code>.</li>" +
      "<li><strong>PAD</strong>, the <strong>padding token</strong>, used to make a batch rectangular. Llama 3 defines none, so every training framework picks one for you, and it picking badly is a real source of silent corruption.</li>" +
      "<li><strong>Role and structure markers</strong>, which are the subject of the next section.</li>" +
      "</ul>" +
      "<p>Two facts about special tokens cause most of the trouble. First, they are <em>single</em> tokens: <code>&lt;|eot_id|&gt;</code> is one id, not eleven characters. Second, whether a tokenizer treats a piece of text as a special token or as literal characters depends on a flag, and different libraries default that flag differently. Text that contains <code>&lt;|im_end|&gt;</code> typed by a user is either a control signal or eight tokens of punctuation, and which one you get is a configuration question with security consequences that Chapter 33 returns to.</p>" +
      "<div class='callout'><strong>The config trap.</strong> Qwen2.5-7B-Instruct&#8217;s tokenizer holds 151,665 entries, but its <code>config.json</code> declares <code>vocab_size</code> 152,064. Both numbers are correct. This is <strong>vocabulary padding</strong>: the embedding table is deliberately grown to a round multiple for hardware efficiency, leaving hundreds of rows that no token will ever index. When you compute parameter counts in Chapter 9, use the config&#8217;s padded number, because that is what occupies memory. When you reason about what the model can express, use the tokenizer&#8217;s.</div>" },

    { title: "The Chat Template Is Part of the Contract", viz: "llmChatTemplate", vizTitle: "Watch a conversation become one flat string, then break it",
      html: "<p>Here is the fact that surprises people who have only used a chat API: <strong>the model has no concept of a conversation.</strong> It takes one flat sequence of tokens, exactly as in Chapter 1. Roles, turns, system prompts and multi-turn history are a convention rendered into that flat sequence by a template, and the template is chosen by whoever trained the model.</p>" +
      "<p>Modern tokenizers ship the template with the weights, as a Jinja string in <code>tokenizer_config.json</code>. Here is Llama-3-8B-Instruct&#8217;s, rendered on a two-message conversation:</p>" +
      "<pre><code>&lt;|begin_of_text|&gt;&lt;|start_header_id|&gt;system&lt;|end_header_id|&gt;\n\nYou are terse.&lt;|eot_id|&gt;&lt;|start_header_id|&gt;user&lt;|end_header_id|&gt;\n\nHi&lt;|eot_id|&gt;&lt;|start_header_id|&gt;assistant&lt;|end_header_id|&gt;\n\n</code></pre>" +
      "<p>And Qwen2.5-7B-Instruct&#8217;s, on the identical conversation:</p>" +
      "<pre><code>&lt;|im_start|&gt;system\nYou are terse.&lt;|im_end|&gt;\n&lt;|im_start|&gt;user\nHi&lt;|im_end|&gt;\n&lt;|im_start|&gt;assistant\n</code></pre>" +
      "<p>Different markers, different newline placement, different notion of where a header ends. Both render to about the same length in tokens, 20 for Llama and 18 for Qwen, because those markers are single tokens in their own vocabularies.</p>" +
      "<div class='fig'><svg viewBox='0 0 760 236' xmlns='http://www.w3.org/2000/svg' font-family='Menlo,monospace'>" +
      "<text x='20' y='18' fill='#2de2ff' font-size='11'>the same two-message conversation, rendered by each model's own template</text>" +
      "<rect x='16' y='30' width='360' height='192' rx='8' fill='#111a2e' stroke='#4f7cff' stroke-width='2'/>" +
      "<text x='34' y='52' fill='#2de2ff' font-size='11'>Llama 3 &#8212; 20 tokens</text>" +
      "<rect x='34' y='62' width='150' height='20' rx='4' fill='#111a2e' stroke='#ffd166' stroke-width='2'/><text x='109' y='76' text-anchor='middle' fill='#ffd166' font-size='9.5'>&#60;|begin_of_text|&#62;</text>" +
      "<rect x='34' y='88' width='150' height='20' rx='4' fill='#111a2e' stroke='#ffd166' stroke-width='2'/><text x='109' y='102' text-anchor='middle' fill='#ffd166' font-size='9.5'>&#60;|start_header_id|&#62;</text>" +
      "<rect x='190' y='88' width='58' height='20' rx='4' fill='#111a2e' stroke='#4f7cff' stroke-width='2'/><text x='219' y='102' text-anchor='middle' fill='#c9d6ea' font-size='9.5'>system</text>" +
      "<rect x='254' y='88' width='108' height='20' rx='4' fill='#111a2e' stroke='#ffd166' stroke-width='2'/><text x='308' y='102' text-anchor='middle' fill='#ffd166' font-size='9.5'>&#60;|end_header_id|&#62;</text>" +
      "<text x='34' y='128' fill='#c9d6ea' font-size='10'>You are terse.</text>" +
      "<rect x='34' y='138' width='70' height='20' rx='4' fill='#111a2e' stroke='#ff5d73' stroke-width='2'/><text x='69' y='152' text-anchor='middle' fill='#ff5d73' font-size='9.5'>&#60;|eot_id|&#62;</text>" +
      "<text x='34' y='180' fill='#7d8fb0' font-size='10'>...user turn...</text>" +
      "<rect x='34' y='190' width='230' height='20' rx='4' fill='#111a2e' stroke='#3ddc97' stroke-width='2.5'/><text x='149' y='204' text-anchor='middle' fill='#3ddc97' font-size='9.5'>&#60;|start_header_id|&#62;assistant...</text>" +
      "<rect x='384' y='30' width='360' height='192' rx='8' fill='#111a2e' stroke='#4f7cff' stroke-width='2'/>" +
      "<text x='402' y='52' fill='#2de2ff' font-size='11'>Qwen 2.5 &#8212; 18 tokens</text>" +
      "<rect x='402' y='62' width='108' height='20' rx='4' fill='#111a2e' stroke='#ffd166' stroke-width='2'/><text x='456' y='76' text-anchor='middle' fill='#ffd166' font-size='9.5'>&#60;|im_start|&#62;</text>" +
      "<rect x='516' y='62' width='58' height='20' rx='4' fill='#111a2e' stroke='#4f7cff' stroke-width='2'/><text x='545' y='76' text-anchor='middle' fill='#c9d6ea' font-size='9.5'>system</text>" +
      "<text x='402' y='104' fill='#7d8fb0' font-size='10'>no BOS token at all</text>" +
      "<text x='402' y='128' fill='#c9d6ea' font-size='10'>You are terse.</text>" +
      "<rect x='402' y='138' width='92' height='20' rx='4' fill='#111a2e' stroke='#ff5d73' stroke-width='2'/><text x='448' y='152' text-anchor='middle' fill='#ff5d73' font-size='9.5'>&#60;|im_end|&#62;</text>" +
      "<text x='402' y='180' fill='#7d8fb0' font-size='10'>...user turn...</text>" +
      "<rect x='402' y='190' width='196' height='20' rx='4' fill='#111a2e' stroke='#3ddc97' stroke-width='2.5'/><text x='500' y='204' text-anchor='middle' fill='#3ddc97' font-size='9.5'>&#60;|im_start|&#62;assistant</text>" +
      "</svg><div class='fig-cap'>Gold marks a structure token, red an end-of-turn token, green the generation prompt. Every one of these is a single id in its own vocabulary and literal punctuation in the other's.</div></div>" +
      "<p>Notice the last line of each. Both end with the assistant header and nothing after it. That trailing fragment is the <strong>generation prompt</strong>, and it is what puts the model in the position of speaking next. Forget it and the model, quite reasonably, continues writing the user&#8217;s turn.</p>" },

    { title: "What a Wrong Template Does, Measured",
      html: "<p>The failure mode is not an exception. It is a quality collapse with no signal, and it is worth seeing in numbers.</p>" +
      "<p>Take the Llama-formatted string from the previous section and hand it to Qwen&#8217;s tokenizer, which is exactly what happens when a serving stack, a fine-tuning script or a hand-rolled prompt builder applies the wrong template. Measured:</p>" +
      "<pre><code>Llama template through Llama's tokenizer:  20 tokens\nLlama template through Qwen's tokenizer:   67 tokens</code></pre>" +
      "<p>More than three times the length, for text that has not changed. The reason is visible in the first few tokens Qwen produces:</p>" +
      "<pre><code>['&lt;', '|', 'begin', '_of', '_text', '|', '&gt;&lt;', '|', 'start',\n '_header', '_id', '|', '&gt;', 'system', '&lt;', '|', 'end', ... ]</code></pre>" +
      "<p><code>&lt;|begin_of_text|&gt;</code> is one control token to Llama and seven tokens of literal punctuation to Qwen. The structure that was supposed to tell the model where a turn begins has become noise sitting in the middle of the conversation. The model still answers. It answers worse, in ways that look like a capability problem, and no error is raised anywhere in the stack.</p>" +
      "<div class='fig'><svg viewBox='0 0 760 214' xmlns='http://www.w3.org/2000/svg' font-family='Menlo,monospace'>" +
      "<text x='20' y='18' fill='#2de2ff' font-size='11'>the same string, two tokenizers (measured 2026-09-06)</text>" +
      "<text x='20' y='44' fill='#7d8fb0' font-size='10.5'>right tokenizer</text>" +
      "<rect x='150' y='30' width='150' height='24' rx='6' fill='#111a2e' stroke='#3ddc97' stroke-width='2.5'/><text x='225' y='47' text-anchor='middle' fill='#3ddc97' font-size='10.5'>&#60;|begin_of_text|&#62;</text>" +
      "<text x='314' y='47' fill='#3ddc97' font-size='10.5'>1 token &#8212; a control signal</text>" +
      "<text x='20' y='88' fill='#7d8fb0' font-size='10.5'>wrong tokenizer</text>" +
      "<rect x='150' y='74' width='26' height='24' rx='5' fill='#111a2e' stroke='#ff5d73' stroke-width='2'/><text x='163' y='91' text-anchor='middle' fill='#ff5d73' font-size='10'>&#60;</text>" +
      "<rect x='180' y='74' width='26' height='24' rx='5' fill='#111a2e' stroke='#ff5d73' stroke-width='2'/><text x='193' y='91' text-anchor='middle' fill='#ff5d73' font-size='10'>|</text>" +
      "<rect x='210' y='74' width='54' height='24' rx='5' fill='#111a2e' stroke='#ff5d73' stroke-width='2'/><text x='237' y='91' text-anchor='middle' fill='#ff5d73' font-size='10'>begin</text>" +
      "<rect x='268' y='74' width='40' height='24' rx='5' fill='#111a2e' stroke='#ff5d73' stroke-width='2'/><text x='288' y='91' text-anchor='middle' fill='#ff5d73' font-size='10'>_of</text>" +
      "<rect x='312' y='74' width='52' height='24' rx='5' fill='#111a2e' stroke='#ff5d73' stroke-width='2'/><text x='338' y='91' text-anchor='middle' fill='#ff5d73' font-size='10'>_text</text>" +
      "<rect x='368' y='74' width='26' height='24' rx='5' fill='#111a2e' stroke='#ff5d73' stroke-width='2'/><text x='381' y='91' text-anchor='middle' fill='#ff5d73' font-size='10'>|</text>" +
      "<rect x='398' y='74' width='34' height='24' rx='5' fill='#111a2e' stroke='#ff5d73' stroke-width='2'/><text x='415' y='91' text-anchor='middle' fill='#ff5d73' font-size='10'>&#62;&#60;</text>" +
      "<text x='446' y='91' fill='#ff5d73' font-size='10.5'>7 tokens &#8212; punctuation in the text</text>" +
      "<line x1='20' y1='114' x2='740' y2='114' stroke='#1c2a45' stroke-width='2'/>" +
      "<text x='20' y='140' fill='#c9d6ea' font-size='11'>whole prompt</text>" +
      "<rect x='150' y='128' width='100' height='16' rx='4' fill='#3ddc97'/><text x='262' y='141' fill='#3ddc97' font-size='10.5'>20 tokens, correct</text>" +
      "<rect x='150' y='152' width='335' height='16' rx='4' fill='#ff5d73'/><text x='497' y='165' fill='#ff5d73' font-size='10.5'>67 tokens, structure gone</text>" +
      "<text x='20' y='194' fill='#7d8fb0' font-size='10.5'>No exception is raised. No log line appears. The model answers, and it answers worse.</text>" +
      "</svg><div class='fig-cap'>The most expensive silent bug in applied language modelling: a template mismatch reads as a capability problem.</div></div>" +
      "<p>Use the template machine now. Render a conversation with the correct template, then deliberately apply a different model&#8217;s. Watch the assistant header land inside the user&#8217;s message and the special tokens shatter into punctuation. That is what &#8220;the fine-tune did nothing&#8221; looks like from the inside.</p>" },

    { title: "The Practitioner's Checklist",
      html: "<p>Every item here traces back to a mechanism in this chapter or the last one. The build exercise turns the first three into a <strong>prompt linter</strong> you run before a prompt ever leaves your process.</p>" +
      "<h3>Before you ship a prompt</h3>" +
      "<ul>" +
      "<li><strong>Assert no trailing whitespace.</strong> One line of code, catches an invisible quality regression. Section 3.</li>" +
      "<li><strong>Count tokens before you pay for them.</strong> Set a <strong>token budget</strong> per request and enforce it by running your actual prompt through your actual tokenizer, not an estimate of four characters per token. That heuristic is roughly right for English prose and badly wrong for code, numbers and any non-Latin script, where Chapter 2 measured up to eleven times the cost.</li>" +
      "<li><strong>Decide your number format on purpose.</strong> Bare digits, comma-separated and currency-formatted all tokenize differently. Section 1.</li>" +
      "</ul>" +
      "<h3>When a fine-tune appears to have done nothing</h3>" +
      "<p>Check these three before touching the learning rate, because they are the common causes and they are all free to check.</p>" +
      "<ul>" +
      "<li><strong>Is the template the model&#8217;s own?</strong> Render one training example exactly as the trainer will and print the string. Compare it, character for character, to the template in <code>tokenizer_config.json</code>. Section 6.</li>" +
      "<li><strong>Are the special tokens single tokens?</strong> Encode a rendered example and confirm <code>&lt;|eot_id|&gt;</code> or its equivalent appears as one id and not as a run of punctuation.</li>" +
      "<li><strong>Is the model learning the answer or the question?</strong> That is loss masking, and Chapter 20 covers it, but it presents identically to a template bug from the outside.</li>" +
      "</ul>" +
      "<h3>Try it on your machine</h3>" +
      "<pre><code>pip install transformers\npython - &lt;&lt;'PY'\nfrom transformers import AutoTokenizer\nt = AutoTokenizer.from_pretrained(\"Qwen/Qwen2.5-7B-Instruct\")\nmsgs = [{\"role\": \"user\", \"content\": \"Hi\"}]\ns = t.apply_chat_template(msgs, tokenize=False, add_generation_prompt=True)\nprint(repr(s))\nprint(t.encode(s))\nPY</code></pre>" +
      "<p>Expect a string ending in the assistant header with nothing after it, and an id list whose first and last entries are the special tokens rather than fragments of punctuation. If either is untrue, you have found your bug before it reached production.</p>" +
      "<div class='callout'><strong>Interview lens.</strong> &#8220;A team fine-tuned a model, the loss went down, and the deployed model got worse. What do you check first?&#8221; The expected answer is not a hyperparameter. It is whether the template used in training matches the template used in serving, and whether the special tokens survived tokenization as single ids in both. This is the most common real bug in applied fine-tuning, and it is asked because it separates people who have deployed from people who have read.</div>" },

    { title: "Exercises",
      html: "<ol>" +
      "<li><strong>Trace.</strong> Predict, before measuring, how many tokens each of these costs under a modern tokenizer: <code>42</code>, <code>4200</code>, <code>4,200</code>, <code>$4,200.00</code>, <code>4.2e3</code>. Write your five predictions down. Then measure. Score yourself. The point is not the score; it is that you now expect the format to matter, which you did not before this chapter.</li>" +
      "<li><strong>Trace.</strong> A prompt template ends with <code>Answer:</code> followed by a space. Using section 3, explain in two sentences what that space does to the first generated token, and why the effect is larger for a completion-style prompt than for a chat-formatted one.</li>" +
      "<li><strong>Investigate.</strong> Download the <code>tokenizer_config.json</code> of two instruct models from different families. Extract both chat templates and render the same two-message conversation through each. Then encode each rendered string with the <em>other</em> model&#8217;s tokenizer and record the token counts. You should see something close to the 20-versus-67 result in section 6. Write down the ratio you get, and which special token fragmented worst.</li>" +
      "<li><strong>Investigate.</strong> Take a real source file from your own work, in a whitespace-sensitive language, and count its tokens under two tokenizers. Then convert the indentation from spaces to tabs and count again. Report the four numbers and say which combination you would choose if you were sending this file to a model a thousand times a day.</li>" +
      "<li><strong>Build.</strong> Write a prompt-linter: a function that takes an assembled prompt string and returns a list of warnings. Check for trailing whitespace, for special-token markup appearing in user-supplied content, for a token count over a configured budget, and for a number written with thousands separators. Fifty lines, and it belongs in the same module as everything else you build in this course. Chapter 33 adds one more check to it, for a reason you will not like.</li>" +
      "</ol>" }
  ],
  terms: [
    { t: "special token", d: "A vocabulary entry added after tokenizer training to mark structure rather than content, such as the beginning of a sequence or the end of a turn." },
    { t: "BOS token", d: "The beginning-of-sequence marker; Llama 3 uses one and Qwen 2.5 does not, which is a common porting bug." },
    { t: "EOS token", d: "The end-of-sequence marker whose generation tells the runtime to stop producing tokens." },
    { t: "padding token", d: "A filler id used to make a batch of unequal sequences rectangular; a model that defines none leaves the choice to the training framework." },
    { t: "chat template", d: "The Jinja string shipped with a model that renders a list of role-tagged messages into the single flat sequence the model actually reads." },
    { t: "generation prompt", d: "The trailing fragment of a rendered template, ending with the assistant's header, that puts the model in the position of speaking next." },
    { t: "template mismatch", d: "Serving or fine-tuning a model with a different template than it was trained on; it raises no error and degrades quality in a way that resembles a capability problem." },
    { t: "leading-space convention", d: "The rule in byte-level BPE that a space belongs to the token that follows it, making 'hello' and ' hello' different ids." },
    { t: "trailing-space bug", d: "Ending a prompt with whitespace, which forces the model to produce a rarer unprefixed token and measurably degrades the completion." },
    { t: "single-digit tokenization", d: "A deliberate design choice, used by Qwen among others, that gives every digit its own token so that token boundaries agree with place value." },
    { t: "place value", d: "The positional meaning of a digit in a number, which frequency-based token boundaries do not respect and the model must reconstruct." },
    { t: "vocabulary padding", d: "Declaring a model vocab_size larger than the tokenizer's entry count so the embedding table is a hardware-friendly multiple; the extra rows are never indexed." },
    { t: "prompt linter", d: "A check run over an assembled prompt before it is sent, catching trailing whitespace, injected markup, budget overruns and formatting traps." },
    { t: "token budget", d: "The number of tokens a request is allowed to consume, measured with the real tokenizer rather than estimated from character count." }
  ],
  quiz: [
    { type: "mc", q: "GPT-2 tokenizes 3478 as ['34', '78']. Why does this make arithmetic harder for the model?", opts: ["The token boundaries do not align with place value, so magnitude must be reconstructed from pieces cut on frequency", "Two tokens carry less information than four digits", "The model cannot perform multiplication on any tokenized input", "The tokens are rare, so their embeddings are poorly trained"], a: 0,
      why: "The pieces were chosen because '34' and '78' are frequent character pairs in the training corpus, not because they mean anything numerically. The model must learn that this particular pair of symbols, in this order, denotes a magnitude near three and a half thousand, and it must do that separately for every possible split. Single-digit tokenization exists precisely to remove this problem." },
    { type: "mc", q: "Under cl100k_base, the string 'hello' is id 15339 and ' hello' is id 24748. What follows from that?", opts: ["The tokenizer stores two copies of every word, doubling the vocabulary", "Spaces are stripped before encoding, so the ids are equivalent", "The embedding table averages the two rows at inference time", "A prompt ending in a space forces the model to produce the rarer unprefixed form of the next word"], a: 3,
      why: "They are two unrelated rows of the embedding table. Almost all of the model's training saw the space-prefixed form following ordinary text, so supplying the space yourself pushes the next prediction onto a token it has seen far less often. The effect is usually small and occasionally not, and it is invisible because nothing errors." },
    { type: "mc", q: "A Llama-formatted prompt of 20 tokens becomes 67 tokens under Qwen's tokenizer. What has gone wrong?", opts: ["Qwen has a smaller vocabulary, so everything costs more", "The text was corrupted during transfer between tokenizers", "Qwen's tokenizer does not hold Llama's special tokens, so each one fragments into literal punctuation", "The generation prompt was applied twice"], a: 2,
      why: "'<|begin_of_text|>' is one control token in Llama's vocabulary and seven tokens of punctuation in Qwen's, because Qwen never added it. The structure that marks where a turn begins has become noise inside the conversation. Qwen's vocabulary is in fact larger than Llama's, which rules out the first option and is a useful reminder that vocabulary size does not predict this failure." },
    { type: "mc", q: "Qwen 2.5 gives every digit its own token, costing 7 tokens for '1234567' where Llama 3 costs 3. What is the trade being made?", opts: ["Smaller vocabulary in exchange for longer sequences", "Token boundaries that agree with place value, in exchange for longer sequences on numeric text", "Faster encoding in exchange for slower decoding", "Better multilingual coverage in exchange for worse code handling"], a: 1,
      why: "It is a deliberate design decision, not an artifact. Making each digit its own token means the correspondence between a digit and its position is consistent and learnable rather than dependent on which multi-digit chunks happened to be frequent. The cost is paid in length on every document containing figures, which for a finance or analytics workload is a real bill." },
    { type: "blank", q: "The trailing fragment of a rendered chat template, ending with the assistant's header and nothing after it, is called the ____ prompt.", a: ["generation", "generation prompt"],
      why: "It is what puts the model in the position of speaking next. Omit it and the model continues from wherever the string ended, which usually means writing more of the user's turn, because that is what the text in front of it looks like." },
    { type: "blank", q: "Serving or fine-tuning a model with a different chat template than it was trained on is a template ____.", a: ["mismatch", "mismatch bug"],
      why: "It is the most common real bug in applied fine-tuning and the hardest to see, because no exception is raised, no log line appears, and the degraded output reads as a capability limitation rather than a formatting error. Rendering one training example and printing the string catches it in seconds." },
    { type: "mc", q: "Qwen2.5-7B-Instruct's tokenizer holds 151,665 entries but its config declares vocab_size 152,064. Which is correct?", opts: ["The tokenizer file is out of date and should be regenerated", "The config counts special tokens that the tokenizer excludes", "The difference is the number of merges, which are stored separately", "Both: the embedding table is padded to a hardware-friendly multiple, leaving rows no token indexes"], a: 3,
      why: "Padding the vocabulary to a round multiple makes the matrix multiplies that touch the embedding and output layers land on friendlier shapes. The extra rows exist, occupy memory and are never indexed by any token. Use the config's number when counting parameters in Chapter 9, and the tokenizer's when reasoning about what the model can express." },
    { type: "order", q: "Order these checks when a fine-tune trained cleanly but the deployed model got worse:", items: ["render one training example exactly as the trainer did and print the string", "confirm the special tokens encode as single ids, not punctuation runs", "confirm the loss was masked to the answer and not the prompt", "start adjusting the learning rate"],
      why: "The first three are free, take a minute each, and account for most real occurrences of this symptom. Hyperparameters come last because changing them without ruling out a formatting bug means you are tuning around a defect rather than fixing it, and any improvement you find will be fragile." },
    { type: "mc", q: "Your service estimates cost with the rule 'four characters per token'. For which workload is that estimate most dangerous?", opts: ["Tamil or Hindi user content, and heavily indented source code", "Short English chat messages", "Long English prose documents", "Prompts containing many proper nouns"], a: 0,
      why: "The heuristic was derived from English prose and holds roughly there. Chapter 2 measured a Tamil sentence at eleven times its English equivalent under GPT-2's encoding, and this chapter measured GPT-2 spending five tokens on a single indented line of Python. Both blow past a four-characters-per-token estimate, and both are exactly the workloads where an underestimated bill becomes a production incident." },
    { type: "mc", q: "Which of these is NOT explained by tokenization?", opts: ["A model miscounts the letters in a word", "A model's answers degrade after a system prompt is moved to a different position in the context", "A model's answer changes when a trailing space is added", "The same number costs twice as many tokens when written with commas"], a: 1,
      why: "The first, second and fourth are all boundary effects: the model cannot see inside a token, the space changes which token comes next, and separators change the split. Position effects within a long context are a different mechanism entirely, belonging to attention and positional encoding, and they are Chapter 7's subject. Blaming everything on the tokenizer is as wrong as blaming nothing on it." }
  ]
});

/* ======================= CHAPTER 4 ======================= */
CHAPTERS.push({
  num: 4, part: 1, title: "Embeddings: Meaning as Geometry",
  blurb: "A token id is a row number. Look it up in a table and it becomes a vector, and from that moment on the model is doing geometry. You will see what that table is, what a row means, and why the same word gets a different vector in a different sentence. Then similarity as arithmetic: dot product, cosine and Euclidean distance, and the case where two of them disagree about which document is closest. The chapter ends where this course hands off to RAG In Depth, and at a design decision you can read off any config file.",
  sections: [
    { title: "The Table, and What a Row Is",
      html: "<p>Chapter 2 ended with an id. Chapter 5 needs a vector. The step between them is the shortest in the whole architecture: index into a matrix.</p>" +
      "<p>The <strong>embedding table</strong> is a matrix with one row per vocabulary entry and one column per model dimension. For Corvid-8B that is 128,256 rows and 4,096 columns. Token id 4037 means row 4037. There is no computation, no lookup cost worth measuring, and no cleverness. It is an array access.</p>" +
      "<p>What makes it interesting is that the table is <em>learned</em>. Those 128,256 &#215; 4,096 = 525,336,576 numbers start random and are updated by the same gradient descent that trains everything else. Nobody assigns meaning to a dimension. The table ends up wherever the loss pushed it, and where the loss pushed it turns out to be a space in which geometric relationships correspond to linguistic ones.</p>" +
      "<p>Two consequences follow immediately, and both matter more than they look.</p>" +
      "<p>First, <strong>the table is enormous</strong>. At bfloat16, Corvid&#8217;s embedding table alone is 1.05 GB, and that is 6.5% of the model before a single transformer block exists. Chapter 2 promised this number would be checkable; you can now check it.</p>" +
      "<p>Second, <strong>a row means nothing on its own</strong>. It only means something relative to the other rows, because the loss only ever compared them. That is why you cannot take one model&#8217;s embedding row for a token and put it into another model, and why the vector for a token in an English-trained model has no relationship to the vector for the same token in a different model. The space is arbitrary; only the geometry inside it is meaningful.</p>" +
      "<div class='fig'><svg viewBox='0 0 760 208' xmlns='http://www.w3.org/2000/svg' font-family='Menlo,monospace'>" +
      "<text x='20' y='18' fill='#2de2ff' font-size='11'>the embedding table: 128,256 rows x 4,096 columns</text>" +
      "<rect x='20' y='30' width='300' height='150' rx='8' fill='#0e1626' stroke='#4f7cff' stroke-width='2'/>" +
      "<text x='34' y='50' fill='#7d8fb0' font-size='10'>row 0</text><line x1='90' y1='46' x2='306' y2='46' stroke='#1c2a45' stroke-width='6'/>" +
      "<text x='34' y='70' fill='#7d8fb0' font-size='10'>row 1</text><line x1='90' y1='66' x2='306' y2='66' stroke='#1c2a45' stroke-width='6'/>" +
      "<text x='34' y='94' fill='#7d8fb0' font-size='10'>...</text>" +
      "<text x='34' y='118' fill='#ffd166' font-size='10'>row 4037</text><line x1='90' y1='114' x2='306' y2='114' stroke='#ffd166' stroke-width='7'/>" +
      "<text x='34' y='142' fill='#7d8fb0' font-size='10'>...</text>" +
      "<text x='34' y='166' fill='#7d8fb0' font-size='10'>row 128255</text><line x1='104' y1='162' x2='306' y2='162' stroke='#1c2a45' stroke-width='6'/>" +
      "<line x1='330' y1='114' x2='372' y2='114' stroke='#ffd166' stroke-width='2'/><polygon points='379,114 367,108 367,120' fill='#ffd166'/>" +
      "<rect x='386' y='100' width='330' height='28' rx='6' fill='#111a2e' stroke='#ffd166' stroke-width='2.5'/>" +
      "<text x='551' y='118' text-anchor='middle' fill='#ffd166' font-size='10.5'>[ 0.021, -0.114, 0.307, ... , 0.049 ]</text>" +
      "<text x='386' y='146' fill='#7d8fb0' font-size='10'>4,096 numbers. This is the token ' token'.</text>" +
      "<text x='386' y='166' fill='#7d8fb0' font-size='10'>Not because anyone said so, but because</text>" +
      "<text x='386' y='182' fill='#7d8fb0' font-size='10'>gradient descent put it here.</text>" +
      "<text x='20' y='200' fill='#7d8fb0' font-size='10'>525,336,576 parameters. 1.05 GB at bfloat16. 6.5% of Corvid-8B, before any block exists.</text>" +
      "</svg><div class='fig-cap'>The entire mechanism of turning an id into a vector. Everything expensive happens after this point.</div></div>" },

    { title: "The Residual Stream",
      html: "<p>That vector now begins a journey, and the shape of the journey is the single most useful mental model in this course.</p>" +
      "<p>Each position in the sequence carries one vector. A transformer block reads it, computes something, and <em>adds</em> the result back to it. The next block does the same. Thirty-two times for Corvid. The vector is never replaced, only added to, which means it accumulates: what arrives at the top is the embedding plus every contribution every block chose to make.</p>" +
      "<p>That running vector is the <strong>residual stream</strong>, and calling it a stream rather than a value is deliberate. It behaves like a shared channel that every component reads from and writes to. Attention writes information gathered from other positions. The feed-forward network writes whatever it computes from the position itself. Nothing overwrites; everything adds.</p>" +
      "<p>Hold onto this, because it explains several things that otherwise look arbitrary. It is why the model dimension is constant through the whole stack rather than expanding and contracting like a convolutional network. It is why residual connections make very deep stacks trainable at all, which Chapter 8 derives. It is why you can read intermediate layers as partial predictions, which is Chapter 11. And it is why the final vector at the last position can be multiplied by a matrix to produce a distribution over the vocabulary, which is where Chapter 1 came in.</p>" +
      "<div class='fig'><svg viewBox='0 0 760 196' xmlns='http://www.w3.org/2000/svg' font-family='Menlo,monospace'>" +
      "<text x='20' y='18' fill='#2de2ff' font-size='11'>one position's vector, travelling up the stack</text>" +
      "<line x1='60' y1='40' x2='60' y2='168' stroke='#ffd166' stroke-width='8'/>" +
      "<text x='20' y='44' fill='#7d8fb0' font-size='10'>top</text>" +
      "<text x='20' y='168' fill='#7d8fb0' font-size='10'>in</text>" +
      "<rect x='120' y='142' width='190' height='26' rx='6' fill='#111a2e' stroke='#4f7cff' stroke-width='2'/><text x='215' y='159' text-anchor='middle' fill='#c9d6ea' font-size='10.5'>embedding row (Chapter 4)</text>" +
      "<line x1='116' y1='155' x2='70' y2='155' stroke='#4f7cff' stroke-width='2'/><polygon points='62,155 74,149 74,161' fill='#4f7cff'/>" +
      "<rect x='120' y='106' width='190' height='26' rx='6' fill='#111a2e' stroke='#4f7cff' stroke-width='2'/><text x='215' y='123' text-anchor='middle' fill='#c9d6ea' font-size='10.5'>attention adds (Chapter 5)</text>" +
      "<line x1='116' y1='119' x2='70' y2='119' stroke='#4f7cff' stroke-width='2'/><polygon points='62,119 74,113 74,125' fill='#4f7cff'/>" +
      "<rect x='120' y='70' width='190' height='26' rx='6' fill='#111a2e' stroke='#4f7cff' stroke-width='2'/><text x='215' y='87' text-anchor='middle' fill='#c9d6ea' font-size='10.5'>feed-forward adds (Chapter 8)</text>" +
      "<line x1='116' y1='83' x2='70' y2='83' stroke='#4f7cff' stroke-width='2'/><polygon points='62,83 74,77 74,89' fill='#4f7cff'/>" +
      "<text x='120' y='50' fill='#7d8fb0' font-size='10'>... 32 blocks, each adding ...</text>" +
      "<line x1='340' y1='40' x2='340' y2='176' stroke='#1c2a45' stroke-width='2'/>" +
      "<text x='366' y='58' fill='#c9d6ea' font-size='10.5'>Nothing is ever replaced. The stream at</text>" +
      "<text x='366' y='76' fill='#c9d6ea' font-size='10.5'>layer k is the embedding plus every</text>" +
      "<text x='366' y='94' fill='#c9d6ea' font-size='10.5'>contribution made so far.</text>" +
      "<text x='366' y='124' fill='#ffd166' font-size='10.5'>Width stays 4,096 the whole way up.</text>" +
      "<text x='366' y='150' fill='#7d8fb0' font-size='10'>That constancy is what lets Chapter 11 read</text>" +
      "<text x='366' y='166' fill='#7d8fb0' font-size='10'>a half-finished prediction out of layer 20.</text>" +
      "</svg><div class='fig-cap'>The residual stream. Every mechanism in Part II is a thing that reads this channel and adds to it.</div></div>" },

    { title: "One Row, Many Meanings",
      html: "<p>The table has exactly one row for <code>bank</code>. Yet a model handles <em>the bank of the river</em> and <em>the bank refused the loan</em> without confusion. Where does the second meaning live?</p>" +
      "<p>Not in the table. The row is the <strong>static embedding</strong>: the same vector every time, independent of context. It is the starting point, and by itself it is closer to a dictionary entry that lists all senses than to a choice between them.</p>" +
      "<p>The disambiguation happens in the stream. By layer 3 or 4, attention has pulled in information from <code>river</code> or from <code>loan</code>, added it to that position&#8217;s vector, and moved it. The vector at layer 20 for <em>bank</em> in a river sentence is somewhere quite different from the vector at layer 20 for <em>bank</em> in a finance sentence, even though both started at the same row. That layer-20 vector is a <strong>contextual embedding</strong>.</p>" +
      "<p>This distinction is a decade of research compressed into two paragraphs, and the names are worth knowing because you will meet them constantly. Word2vec in 2013 and GloVe in 2014 produced static embeddings, one vector per word type, and they were a genuine breakthrough. ELMo in 2018 made them contextual by running a recurrent network over the sentence. BERT in 2019 did it with transformers and made contextual embeddings the default. Everything since assumes it.</p>" +
      "<div class='callout'><strong>The misconception.</strong> People say &#8220;the embedding of a word&#8221; as if it were one thing. In a transformer there are at least two, and usually thirty-three: the table row, and the state of the residual stream at every layer. When someone says they are using embeddings from a model, the useful question is <em>from which layer</em>, and the answer changes what those vectors are good for.</div>" },

    { title: "Similarity Is Arithmetic", viz: "llmEmbeddingSpace", vizTitle: "Add text, switch metric, and watch the ranking change",
      html: "<p>Once meaning is geometry, &#8220;similar&#8221; has to become a number. Three functions do that job, and knowing when they disagree is what separates using them from cargo-culting them.</p>" +
      "<p>The <strong>dot product</strong> multiplies matching components and sums: for vectors a and b it is a&#8321;b&#8321; + a&#8322;b&#8322; + ... It rewards both alignment and magnitude. Long vectors score higher against everything.</p>" +
      "<p><strong>Cosine similarity</strong> is the dot product divided by both lengths, which cancels magnitude entirely and measures only the angle. It runs from &#8722;1 to 1.</p>" +
      "<p><strong>Euclidean distance</strong> is the straight-line distance between the two points, and unlike the other two it is a distance: smaller means more similar.</p>" +
      "<h3>Where they disagree</h3>" +
      "<p>Work it by hand in two dimensions. Query <strong>q</strong> = (1, 0). Two candidates: <strong>d&#8321;</strong> = (0.9, 0.1) and <strong>d&#8322;</strong> = (2.0, 1.5).</p>" +
      "<pre><code>dot(q, d1) = 1(0.9) + 0(0.1) = 0.90\ndot(q, d2) = 1(2.0) + 0(1.5) = 2.00      -> d2 wins\n\n|d1| = sqrt(0.81 + 0.01) = 0.906\n|d2| = sqrt(4.00 + 2.25) = 2.500\n\ncos(q, d1) = 0.90 / (1 x 0.906) = 0.994\ncos(q, d2) = 2.00 / (1 x 2.500) = 0.800  -> d1 wins</code></pre>" +
      "<p>The two metrics return <em>opposite</em> rankings on the same pair. Nothing is broken. The dot product prefers d&#8322; because d&#8322; is a longer vector, and cosine prefers d&#8321; because d&#8321; points more nearly the same way. In an embedding space, vector length often tracks something incidental like text length or how confidently the encoder represented the input, so a dot-product ranking can be dominated by a property you did not intend to rank on.</p>" +
      "<h3>The identity worth memorizing</h3>" +
      "<p>If every vector is <strong>normalized</strong> to unit length, all three collapse into one. The dot product becomes the cosine, because the denominator is 1. And squared Euclidean distance becomes 2 &#8722; 2cos, because expanding the square gives |a|&#178; + |b|&#178; &#8722; 2a&#183;b = 1 + 1 &#8722; 2cos. Since 2 &#8722; 2cos decreases exactly as cos increases, Euclidean and cosine produce <em>identical</em> rankings on unit vectors.</p>" +
      "<p>That is why so much retrieval code normalizes and then uses a plain dot product: it is the cheapest of the three and, once normalized, it is the same answer. It is also why the question &#8220;should I use cosine or dot product?&#8221; has the answer &#8220;are your vectors normalized?&#8221; rather than a preference.</p>" +
      "<div class='fig'><svg viewBox='0 0 760 244' xmlns='http://www.w3.org/2000/svg' font-family='Menlo,monospace'>" +
      "<line x1='60' y1='180' x2='400' y2='180' stroke='#1c2a45' stroke-width='2'/>" +
      "<line x1='60' y1='180' x2='60' y2='30' stroke='#1c2a45' stroke-width='2'/>" +
      "<line x1='60' y1='180' x2='200' y2='180' stroke='#2de2ff' stroke-width='3'/><polygon points='208,180 196,175 196,185' fill='#2de2ff'/>" +
      "<text x='214' y='184' fill='#2de2ff' font-size='10.5'>q</text>" +
      "<line x1='60' y1='180' x2='186' y2='166' stroke='#3ddc97' stroke-width='3'/><polygon points='194,165 182,161 183,171' fill='#3ddc97'/>" +
      "<text x='202' y='163' fill='#3ddc97' font-size='10.5'>d1</text>" +
      "<line x1='60' y1='180' x2='340' y2='75' stroke='#ff5d73' stroke-width='3'/><polygon points='348,72 335,70 340,80' fill='#ff5d73'/>" +
      "<text x='356' y='72' fill='#ff5d73' font-size='10.5'>d2</text>" +
      "<line x1='430' y1='30' x2='430' y2='200' stroke='#1c2a45' stroke-width='2'/>" +
      "<text x='456' y='52' fill='#c9d6ea' font-size='11'>dot product ranks:</text>" +
      "<text x='476' y='72' fill='#ff5d73' font-size='10.5'>d2 (2.00) &#62; d1 (0.90)</text>" +
      "<text x='456' y='100' fill='#c9d6ea' font-size='11'>cosine ranks:</text>" +
      "<text x='476' y='120' fill='#3ddc97' font-size='10.5'>d1 (0.994) &#62; d2 (0.800)</text>" +
      "<text x='456' y='152' fill='#ffd166' font-size='10.5'>Same vectors. Opposite answers.</text>" +
      "<text x='456' y='176' fill='#7d8fb0' font-size='10'>Normalize everything and the</text>" +
      "<text x='456' y='192' fill='#7d8fb0' font-size='10'>disagreement cannot happen.</text>" +
      "<text x='60' y='210' fill='#2de2ff' font-size='10'>q = (1, 0)</text>" +
      "<text x='160' y='210' fill='#3ddc97' font-size='10'>d1 = (0.9, 0.1) short, aligned</text>" +
      "<text x='60' y='228' fill='#ff5d73' font-size='10'>d2 = (2.0, 1.5) long, angled away</text>" +
      "</svg><div class='fig-cap'>The only case that matters: a long vector pointing the wrong way beats a short vector pointing the right way, if you rank by dot product.</div></div>" +
      "<p>Use the machine now. Add two sentences that mean the same thing and one that merely shares words with them, then switch the metric and watch the ranking. Then turn normalization off and find a pair where dot and cosine disagree. That pair is the bug that a retrieval system ships when nobody checked whether the encoder normalizes.</p>" },

    { title: "Training a Model to Place Things Well", viz: "llmContrastive", vizTitle: "Step the training and watch positives pull, negatives push",
      html: "<p>Everything so far concerns the embeddings inside a language model. There is a second, related object: a model whose entire purpose is to produce one vector for a whole piece of text, so that similar texts land near each other. This is an <strong>embedding model</strong>, and it is trained differently from everything else in this course.</p>" +
      "<p>The architecture is a <strong>bi-encoder</strong>: one network, run separately on each piece of text, producing one vector each. Separately is the important word. The query and the document never see each other, which is what makes the whole thing useful, because you can encode a million documents in advance and only encode the query at request time.</p>" +
      "<p>The training signal is not next-token prediction. It is <strong>contrastive learning</strong>: given an anchor, a matching positive, and some non-matching negatives, move the positive closer and the negatives further away. The loss that does this is <strong>InfoNCE</strong>, which is a softmax over similarities where the positive should get the mass. Minimizing it is exactly maximizing the probability that the positive beats every negative.</p>" +
      "<p>Two details decide whether this works.</p>" +
      "<p><strong>Where the negatives come from.</strong> The cheap trick is in-batch negatives: for each anchor, treat every other document in the batch as a negative. Free, and effective because a large batch supplies many of them. But random negatives are easy; a random document is obviously unrelated, and the model learns to reject it without learning anything subtle. <strong>Hard negatives</strong> are documents that look right and are not, mined by running an earlier version of the model and taking its wrong answers. One good hard negative teaches more than dozens of random ones, and mining them is most of the craft in training a retrieval model.</p>" +
      "<p><strong>How a sequence of vectors becomes one.</strong> The encoder produces one vector per token; something must reduce them. Mean pooling averages them, which is the common default. CLS pooling takes the vector at a designated first position. Last-token pooling suits decoder-style encoders. The choice is part of the model&#8217;s contract: pool differently at query time than the model was trained with and the vectors are subtly wrong in a way nothing reports.</p>" +
      "<div class='fig'><svg viewBox='0 0 760 210' xmlns='http://www.w3.org/2000/svg' font-family='Menlo,monospace'>" +
      "<text x='20' y='18' fill='#2de2ff' font-size='11'>one contrastive step</text>" +
      "<circle cx='170' cy='110' r='7' fill='#2de2ff'/><text x='150' y='134' fill='#2de2ff' font-size='10'>anchor</text>" +
      "<circle cx='250' cy='72' r='7' fill='#3ddc97'/><text x='266' y='70' fill='#3ddc97' font-size='10'>positive</text>" +
      "<line x1='240' y1='79' x2='196' y2='102' stroke='#3ddc97' stroke-width='2' stroke-dasharray='4 3'/><polygon points='190,106 202,104 197,95' fill='#3ddc97'/>" +
      "<circle cx='120' cy='54' r='7' fill='#ff5d73'/><text x='60' y='46' fill='#ff5d73' font-size='10'>hard negative</text>" +
      "<line x1='128' y1='63' x2='104' y2='34' stroke='#ff5d73' stroke-width='2' stroke-dasharray='4 3'/><polygon points='100,28 104,40 112,32' fill='#ff5d73'/>" +
      "<circle cx='296' cy='158' r='6' fill='#7d8fb0'/><text x='310' y='162' fill='#7d8fb0' font-size='10'>random negative (already far; teaches little)</text>" +
      "<line x1='430' y1='26' x2='430' y2='190' stroke='#1c2a45' stroke-width='2'/>" +
      "<text x='456' y='48' fill='#c9d6ea' font-size='10.5'>InfoNCE: a softmax over similarities</text>" +
      "<text x='456' y='68' fill='#c9d6ea' font-size='10.5'>in which the positive should take</text>" +
      "<text x='456' y='88' fill='#c9d6ea' font-size='10.5'>the probability mass.</text>" +
      "<text x='456' y='118' fill='#ffd166' font-size='10.5'>The gradient does two things at once:</text>" +
      "<text x='476' y='138' fill='#3ddc97' font-size='10.5'>pull the positive in</text>" +
      "<text x='476' y='156' fill='#ff5d73' font-size='10.5'>push the negatives out</text>" +
      "<text x='456' y='182' fill='#7d8fb0' font-size='10'>A negative already far away contributes</text>" +
      "<text x='456' y='198' fill='#7d8fb0' font-size='10'>almost no gradient. Hence hard negatives.</text>" +
      "</svg><div class='fig-cap'>Why mining hard negatives is most of the work: an easy negative is already correct, so it produces almost no learning signal.</div></div>" +
      "<p>Step the machine and watch a batch move. Then drag one negative close to the anchor to make it hard, and watch the gradient it produces grow. That is the discovery, and it is the reason a retrieval model trained on random negatives plateaus.</p>" },

    { title: "Shorter Vectors on Purpose",
      html: "<p>Two refinements you will meet in every embedding-model card.</p>" +
      "<p><strong>Normalization</strong> rescales each output vector to unit length. After the previous section you know why: it makes dot product, cosine and Euclidean agree, and it removes text length as an accidental ranking signal. Most modern embedding models normalize by default, and their documentation says so in one line that is easy to miss and expensive to assume.</p>" +
      "<p><strong>Matryoshka embeddings</strong> attack a different problem. A 4,096-dimensional vector is expensive to store and to compare across millions of documents, but truncating an ordinary embedding to its first 256 dimensions destroys it, because nothing made the early dimensions more important than the late ones. Matryoshka training, introduced by Kusupati and colleagues in 2022, applies the contrastive loss at several prefix lengths at once, so the model is explicitly trained so that the first 64, 128, 256 and 512 dimensions are each a usable embedding on their own. You then choose your storage budget at deployment time by slicing, with no retraining. The name is the Russian nesting doll, and it is the rare piece of jargon that describes the mechanism exactly.</p>" },

    { title: "Choosing One, and Where This Course Stops",
      html: "<p>Which embedding model should you use? The honest short answer is that this course is not the place that answers it, and saying so precisely is more useful than an answer that goes stale.</p>" +
      "<p><strong>MTEB</strong>, the Massive Text Embedding Benchmark, is the standard comparison: dozens of tasks across retrieval, classification, clustering and reranking, with a public leaderboard. It is genuinely useful and it has the failure mode every public leaderboard has. Models are tuned against it, the retrieval subset may not resemble your corpus, and a two-point average difference between two models frequently reverses on your own data. Treat it as a shortlist generator, never as a decision.</p>" +
      "<p>Everything past that point &#8212; building a labelled set from your own corpus, measuring recall@k and nDCG, fine-tuning an encoder on your domain, choosing an index, and deciding whether you needed dense retrieval at all &#8212; belongs to <em>RAG In Depth</em>, which teaches it at the depth this course gives to attention. This is the boundary Chapter 1 drew, arriving exactly where it said it would.</p>" +
      "<p>What you take forward from here is the mechanism, which does not go stale: an embedding is a learned position in a space, similarity is arithmetic on that position, the arithmetic has a metric choice with a real consequence, and the model that produced the position was trained by pulling matched pairs together and pushing mismatched pairs apart.</p>" },

    { title: "Weight Tying, and What Config Files Confess",
      html: "<p>One loose end from Chapter 1. The model turns a vector back into a distribution over the vocabulary by multiplying it by a matrix of shape 4,096 &#215; 128,256. That matrix has exactly the dimensions of the embedding table, transposed. Should it be the same matrix?</p>" +
      "<p>Making it the same is <strong>weight tying</strong>, proposed by Ofir Press and Lior Wolf in 2017. The argument is that both matrices are doing the same job in opposite directions: one maps a token to a place in the space, the other asks which token a place corresponds to. Tying them halves the parameters spent on vocabulary and, in their experiments, improved perplexity rather than hurting it.</p>" +
      "<p>So why does anyone untie? Because the two jobs are not identical. Reading a token and predicting one are related but distinguishable, and a model with parameters to spare can afford to learn them separately. The decision therefore comes down to what fraction of your parameter budget the vocabulary is eating, and that fraction depends almost entirely on model size. Read from each model&#8217;s own configuration on 6 September 2026:</p>" +
      "<pre><code>model              d_model   vocab      embedding params   tied?\nQwen2.5-0.5B          896   151,936      136,134,656       yes\nLlama-3.2-1B        2,048   128,256      262,668,288       yes\nMistral-7B-v0.3     4,096    32,768      134,217,728       no\nQwen2.5-7B          3,584   152,064      544,997,376       no\nLlama-3-8B          4,096   128,256      525,336,576       no</code></pre>" +
      "<p>The pattern is not subtle once you see it. Qwen&#8217;s half-billion-parameter model spends 136 million on its embedding table: more than a quarter of everything it has. Untying would take that past half, spent on a lookup table. It ties. Llama&#8217;s 8B model spends 525 million out of roughly eight billion, about 6.5%, and can afford a second copy for the extra freedom. It unties. Mistral took the other route to the same place, keeping a small 32,768-entry vocabulary so that even at 7B the table costs only 134 million.</p>" +
      "<p><strong>Small models tie. Large models untie. Vocabulary size decides where the line falls.</strong> That sentence is a complete explanation of a config field, derived from arithmetic you can do, and it is the kind of thing this course exists to make ordinary.</p>" +
      "<div class='fig'><svg viewBox='0 0 760 210' xmlns='http://www.w3.org/2000/svg' font-family='Menlo,monospace'>" +
      "<text x='20' y='18' fill='#2de2ff' font-size='11'>share of the parameter budget spent on the embedding table</text>" +
      "<text x='20' y='46' fill='#7d8fb0' font-size='10.5'>Qwen2.5-0.5B</text>" +
      "<rect x='150' y='34' width='420' height='16' rx='4' fill='#1c2a45'/><rect x='150' y='34' width='116' height='16' rx='4' fill='#ff5d73'/>" +
      "<text x='584' y='47' fill='#ff5d73' font-size='10'>136M &#183; 28% &#183; ties</text>" +
      "<text x='20' y='82' fill='#7d8fb0' font-size='10.5'>Llama-3.2-1B</text>" +
      "<rect x='150' y='70' width='420' height='16' rx='4' fill='#1c2a45'/><rect x='150' y='70' width='89' height='16' rx='4' fill='#ffd166'/>" +
      "<text x='584' y='83' fill='#ffd166' font-size='10'>263M &#183; 21% &#183; ties</text>" +
      "<text x='20' y='118' fill='#7d8fb0' font-size='10.5'>Llama-3-8B</text>" +
      "<rect x='150' y='106' width='420' height='16' rx='4' fill='#1c2a45'/><rect x='150' y='106' width='27' height='16' rx='4' fill='#3ddc97'/>" +
      "<text x='584' y='119' fill='#3ddc97' font-size='10'>525M &#183; 6.5% &#183; unties</text>" +
      "<text x='20' y='154' fill='#7d8fb0' font-size='10.5'>Mistral-7B-v0.3</text>" +
      "<rect x='150' y='142' width='420' height='16' rx='4' fill='#1c2a45'/><rect x='150' y='142' width='8' height='16' rx='4' fill='#3ddc97'/>" +
      "<text x='584' y='155' fill='#3ddc97' font-size='10'>134M &#183; 1.9% &#183; unties</text>" +
      "<line x1='20' y1='176' x2='740' y2='176' stroke='#1c2a45' stroke-width='2'/>" +
      "<text x='20' y='198' fill='#7d8fb0' font-size='10.5'>The bar is the vocabulary's share. When it is large, a model cannot afford two copies, so it ties.</text>" +
      "</svg><div class='fig-cap'>A config field with a derivation. Shares are computed against each model&#8217;s nominal size; the embedding counts are exact.</div></div>" },

    { title: "Exercises",
      html: "<ol>" +
      "<li><strong>Trace.</strong> Take q = (1, 0), d&#8321; = (0.9, 0.1) and d&#8322; = (2.0, 1.5) from section 4. Compute the Euclidean distance from q to each. Which candidate wins on Euclidean, and does it agree with dot product or with cosine? Then normalize d&#8321; and d&#8322; to unit length, recompute all three metrics, and confirm that all three now agree. You have just proved the identity in the same section without algebra.</li>" +
      "<li><strong>Trace.</strong> Corvid-8B has 128,256 vocabulary entries and a model dimension of 4,096. Compute the embedding table's parameters and its size in bytes at bfloat16. Now suppose you tie the output projection. State how many parameters you save, and what percentage of the model's 8.03 billion that is. Then repeat the calculation for a hypothetical 0.5B model with the same vocabulary and a model dimension of 896, and explain in one sentence why the two answers lead to different design decisions.</li>" +
      "<li><strong>Investigate.</strong> Open the <code>config.json</code> of four open-weights models spanning a wide size range, including at least one under 2B parameters. Record <code>hidden_size</code>, <code>vocab_size</code> and <code>tie_word_embeddings</code> for each, and compute the embedding parameters. Does the pattern in section 8 hold on your four? Find one that breaks it if you can, and work out what the model's designers were optimizing for instead.</li>" +
      "<li><strong>Investigate.</strong> Pick any embedding model on the Hugging Face Hub and answer three questions from its card and config alone: does it normalize its output, what pooling does it use, and does it support Matryoshka truncation. Then find where its documentation says so. If you cannot determine one of the three in five minutes, that is a real finding about that model's documentation, and it is the sort of thing that produces a silent retrieval bug six months later.</li>" +
      "<li><strong>Build.</strong> Write a function that takes a list of vectors and a query vector and returns the top-k by each of the three metrics, plus a flag when dot product and cosine disagree on the top result. Feed it random vectors with deliberately varied magnitudes and count how often they disagree. Then normalize the inputs and confirm the disagreement rate falls to zero. Thirty lines, and it is a test you can keep pointing at any retrieval code you inherit.</li>" +
      "</ol>" }
  ],
  terms: [
    { t: "embedding table", d: "The learned matrix with one row per vocabulary entry and one column per model dimension; 525 million parameters for Corvid-8B." },
    { t: "residual stream", d: "The running vector at each position that every block reads from and adds to, never replacing, carrying the accumulated result up the stack." },
    { t: "static embedding", d: "The table row for a token: the same vector every time, independent of surrounding context." },
    { t: "contextual embedding", d: "The state of the residual stream at a given layer, which differs for the same token in different sentences." },
    { t: "dot product", d: "The sum of products of matching components; rewards both alignment and magnitude." },
    { t: "cosine similarity", d: "The dot product divided by both vector lengths, measuring angle alone and ignoring magnitude." },
    { t: "Euclidean distance", d: "Straight-line distance between two points; smaller means more similar, and on unit vectors it ranks identically to cosine." },
    { t: "normalization", d: "Rescaling a vector to unit length, which makes dot product, cosine and Euclidean produce the same ranking." },
    { t: "embedding model", d: "A model whose purpose is to produce one vector for a whole piece of text so that similar texts land near each other." },
    { t: "bi-encoder", d: "An architecture that encodes each piece of text separately, so documents can be embedded in advance and only the query is encoded at request time." },
    { t: "contrastive learning", d: "Training that pulls matched pairs together and pushes mismatched pairs apart, rather than predicting a next token." },
    { t: "InfoNCE", d: "The contrastive loss used to do that: a softmax over similarities in which the positive should take the probability mass." },
    { t: "in-batch negatives", d: "Treating every other document in the training batch as a negative for a given anchor; free, and mostly easy." },
    { t: "hard negative", d: "A document that looks correct and is not, usually mined from an earlier model's mistakes; it produces far more gradient than a random one." },
    { t: "pooling", d: "Reducing the encoder's per-token vectors to one vector per text, by mean, by a designated position, or by the last token." },
    { t: "Matryoshka embeddings", d: "Embeddings trained with the loss applied at several prefix lengths, so the vector can be truncated to a shorter one without retraining." },
    { t: "weight tying", d: "Using the embedding table transposed as the output projection, halving vocabulary parameters; standard in small models and usually dropped in large ones." },
    { t: "MTEB", d: "The Massive Text Embedding Benchmark, the standard public comparison for embedding models and a shortlist generator rather than a decision." }
  ],
  quiz: [
    { type: "mc", q: "Where does the difference between 'bank' in a river sentence and 'bank' in a finance sentence live?", opts: ["In two separate rows of the embedding table", "In the tokenizer, which emits different ids for different senses", "In the output projection, which disambiguates at the final layer", "In the residual stream, after attention has mixed in nearby context"], a: 3,
      why: "There is exactly one table row for the token. Both sentences start from it. Attention then pulls information from 'river' or 'loan' into that position and adds it to the stream, so by the middle layers the two vectors are far apart. That is the whole distinction between a static and a contextual embedding, and it is why asking which layer an embedding came from is a meaningful question." },
    { type: "mc", q: "For q = (1,0), d1 = (0.9,0.1) and d2 = (2.0,1.5), dot product ranks d2 first and cosine ranks d1 first. What causes the disagreement?", opts: ["A rounding error in the cosine denominator", "d2 has a larger magnitude, which the dot product rewards and cosine cancels", "d1 and d2 have different dimensionality", "Cosine is defined only for normalized vectors"], a: 1,
      why: "The dot product measures alignment multiplied by length, so a long vector scores well against everything. Cosine divides both lengths out and measures the angle alone. In embedding spaces magnitude often tracks something incidental, such as text length or encoder confidence, so ranking by dot product on unnormalized vectors can rank on a property nobody intended." },
    { type: "mc", q: "Why does so much retrieval code normalize vectors and then use a plain dot product?", opts: ["Normalization improves the quality of the underlying embeddings", "Dot product is the only metric supported by vector indexes", "On unit vectors the dot product equals the cosine, and it is the cheapest of the three to compute", "Euclidean distance is undefined in high dimensions"], a: 2,
      why: "Once every vector has length 1 the cosine denominator is 1, so the dot product is the cosine. Squared Euclidean becomes 2 minus twice the cosine, which ranks identically. All three agree, so you take the cheapest. This is why 'cosine or dot product?' is really the question 'are your vectors normalized?'." },
    { type: "mc", q: "In contrastive training, why does a randomly chosen negative teach the model much less than a mined hard negative?", opts: ["The random negative is already far from the anchor, so it produces almost no gradient", "Random negatives are often mislabelled", "Hard negatives are used with a larger learning rate", "Random negatives cannot be used with InfoNCE"], a: 0,
      why: "The loss only pushes when the model is getting something wrong. A document that is obviously unrelated is already scored low, the loss on it is near zero, and so is its gradient. A document that looks right and is not is exactly where the model is wrong, so it carries the signal. Mining those is most of the craft in training a retrieval encoder." },
    { type: "blank", q: "The running vector at each position that every block reads from and adds to, never replacing, is called the residual ____.", a: ["stream"],
      why: "Calling it a stream rather than a value is deliberate: it behaves like a shared channel. Attention writes information from other positions into it, the feed-forward network writes what it computed from this position, and the width stays constant the whole way up, which is what lets Chapter 11 read a half-formed prediction out of a middle layer." },
    { type: "blank", q: "Training an embedding model so that its first 64, 128 or 256 dimensions are each usable on their own, allowing truncation without retraining, produces ____ embeddings.", a: ["matryoshka", "matryoshka embeddings", "nested"],
      why: "The loss is applied at several prefix lengths at once, so importance is forced toward the early dimensions rather than spread evenly. Truncating an ordinary embedding destroys it, because nothing made the first 256 dimensions more informative than the last 256. The nesting-doll name describes the mechanism exactly." },
    { type: "mc", q: "Qwen2.5-0.5B ties its embedding and output matrices; Llama-3-8B does not. What best explains the difference?", opts: ["The smaller model has a larger vocabulary in absolute terms", "Tying is required for models under one billion parameters", "The larger model uses a different tokenizer algorithm", "The vocabulary consumes over a quarter of the small model's budget and only about 6.5% of the large one's"], a: 3,
      why: "Qwen's 0.5B model spends 136 million parameters on its embedding table, more than a quarter of everything it has, so a second untied copy would push vocabulary past half the model. Llama-3-8B spends 525 million out of roughly eight billion and can afford the extra freedom. Small models tie, large models untie, and vocabulary size decides where the line falls." },
    { type: "order", q: "Order what happens to one token on its way to a prediction:", items: ["the tokenizer maps text to an id", "the id indexes a row of the embedding table", "blocks add their contributions to the residual stream", "the final vector is multiplied by the output projection"],
      why: "Four steps, and only the third is expensive. The first is a merge replay, the second is an array access, and the fourth is one matrix multiply per generated token. Everything Part II opens sits inside step three, and everything Part V optimizes is the cost of repeating steps three and four once per token." },
    { type: "mc", q: "A team picks an embedding model because it leads MTEB by two points, and retrieval quality on their corpus gets worse. What is the most likely explanation?", opts: ["A small average gap on a broad public benchmark frequently reverses on a specific corpus", "They failed to normalize the new model's output", "MTEB scores are not comparable across model sizes", "The new model requires a different similarity metric"], a: 0,
      why: "MTEB averages dozens of tasks, models are tuned against it, and its retrieval subset may look nothing like your documents. A two-point average difference is well inside the range that reverses on a particular corpus. It is a shortlist generator. Building a labelled set from your own data and measuring on it is the actual decision procedure, and it belongs to RAG In Depth." },
    { type: "mc", q: "Which statement about the embedding table is true?", opts: ["Its rows are assigned meanings during tokenizer training", "A row is meaningful on its own and can be transferred between models", "Its rows are meaningful only relative to each other, because the loss only ever compared them", "It is computed at inference time from the token's characters"], a: 2,
      why: "The table starts random and is moved by gradient descent, which only ever expresses preferences between rows. Nothing anchors the space to anything absolute, so a row carries no meaning outside the arrangement it sits in. That is why you cannot lift one model's embedding row into another model, and why the same token in two models has unrelated vectors." }
  ]
});

/* ======================= CHAPTER 5 ======================= */
CHAPTERS.push({
  num: 5, part: 2, free: true, title: "Attention: The Weighted Sum That Changed Everything",
  blurb: "Attention is a weighted average, and every mystery about it dissolves once you see which three projections produce the weights. You will build it from the bottom: a query asking a question, keys advertising what each position offers, values carrying what gets copied, a dot product scoring the match, a softmax turning scores into a distribution, and a mask that stops the model reading its own future. You will derive the square-root divisor rather than accept it, watch the softmax collapse without it, and see exactly why a sequence twice as long costs four times as much.",
  sections: [
    { title: "The Problem Attention Solves",
      html: "<p>Chapter 4 left every position holding its own vector, disambiguated by nothing. <em>Bank</em> in a river sentence and <em>bank</em> in a finance sentence are still the same table row. Something has to let a position look at other positions. This section is about why that turned out to be hard.</p>" +
      "<p><strong>The naive attempt: count what came before.</strong> An n-gram model predicts the next word from the previous two or three, by counting. It works startlingly well for its size and it hits a wall you can state exactly: the number of possible contexts grows exponentially with the window, so a five-word window is already mostly unseen combinations. You cannot count your way to long context.</p>" +
      "<p><strong>The better attempt: carry a summary.</strong> Recurrent networks, and then LSTMs, read the sequence one token at a time and maintain a hidden state, a fixed-size vector meant to summarize everything so far. This is a real improvement and it has two problems that killed it. The first is the <strong>bottleneck</strong>: everything the model knows about a 500-word document has to fit in one vector, and information from the beginning is repeatedly overwritten by information from the end. The second is worse for engineering: the computation is inherently sequential. Position 400 cannot be computed until position 399 is done, so you cannot use a machine built to do thousands of things at once.</p>" +
      "<p><strong>The idea.</strong> Stop summarizing. Let every position look directly at every other position and take what it needs. No compression, no fixed-size state, and no sequential dependency, because every position can do its looking at the same time.</p>" +
      "<p>Attention as a mechanism arrived in 2014, from Dzmitry Bahdanau and colleagues, as an addition to a recurrent translation model: instead of forcing the decoder to work from one summary vector, let it look back at all the encoder's positions and weight them. Minh-Thang Luong and colleagues simplified the scoring to a dot product in 2015. The 2017 paper by Ashish Vaswani and colleagues took the obvious next step, whose title is the argument: remove the recurrence and keep only the attention.</p>" +
      "<div class='callout'><strong>What was actually new in 2017.</strong> Not attention, which was three years old. The claim was that attention alone was <em>sufficient</em>, and the payoff was less about accuracy than about hardware: with recurrence gone, an entire sequence trains in parallel. Everything in Part III about training at scale exists because of that one property.</div>" },

    { title: "Three Projections of the Same Vector", viz: "llmAttention", vizTitle: "Click a word to see what it attends to; switch off the scaling",
      html: "<p>Here is the whole mechanism in one sentence, which will not make sense yet: each position produces a query, every position produces a key and a value, each query is scored against every key, the scores become weights, and the output is the weighted sum of the values.</p>" +
      "<p>The three names are unfortunate. They come from a database metaphor, and the metaphor is worth exactly one paragraph before we drop it for the arithmetic. A <strong>query</strong> is what this position is looking for. A <strong>key</strong> is what each position advertises about itself. A <strong>value</strong> is what actually gets copied if a position is selected. Unlike a database, nothing matches exactly and nothing is retrieved singly: every position contributes, weighted by how well its key matched.</p>" +
      "<p>Now the arithmetic, which is simpler than the metaphor. Take the vector x at one position. Multiply it by three learned matrices:</p>" +
      "<pre><code>q = x W_Q      k = x W_K      v = x W_V</code></pre>" +
      "<p>That is all a query, key and value are: three different linear projections of the same vector. The vector does not know what it is looking for. The matrix W_Q, learned by gradient descent, decides what part of that vector constitutes a question, W_K decides what part constitutes an advertisement, and W_V decides what part is worth copying. Three views of one thing, and the model learns all three.</p>" +
      "<h3>Why a dot product, and why project at all</h3>" +
      "<p>Two design choices are hiding in that line, and both are load-bearing.</p>" +
      "<p><strong>Why score with a dot product.</strong> Any similarity function would do mathematically. Bahdanau&#8217;s original used a small neural network to score each pair, which is called additive attention and works fine. The dot product won because of what it is on hardware: scoring every query against every key becomes a single matrix multiplication, which is the one operation a GPU does better than anything else. Chapter 16 makes that preference precise. This is a recurring pattern worth naming early: several choices in this architecture were made because they map onto a matrix multiply, not because they were the most expressive option available.</p>" +
      "<p><strong>Why project instead of dotting the vectors directly.</strong> This one matters more than it looks. If you scored x against x, attention could only ever find positions that are <em>similar</em> to each other. But the useful relationships in language are mostly between things that are not similar at all: a verb wants its subject, a pronoun wants its antecedent, a closing bracket wants its opening one. Because W_Q and W_K are separate learned matrices, the model can project a verb&#8217;s vector and a noun&#8217;s vector into a space where they align, without those two vectors resembling each other anywhere else. The projections are what let attention express &#8220;this kind of thing looks for that kind of thing&#8221;, and a single shared projection could not.</p>" +
      "<p>For Corvid-8B each of these projections maps 4,096 dimensions down to a <strong>head dimension</strong> of 128, and Chapter 6 explains why 128 and not 4,096. Take 128 as given for now; it is the number the next section needs.</p>" +
      "<div class='fig'><svg viewBox='0 0 760 210' xmlns='http://www.w3.org/2000/svg' font-family='Menlo,monospace'>" +
      "<text x='20' y='18' fill='#2de2ff' font-size='11'>one position's vector becomes three things</text>" +
      "<rect x='20' y='80' width='120' height='34' rx='8' fill='#111a2e' stroke='#ffd166' stroke-width='2.5'/>" +
      "<text x='80' y='102' text-anchor='middle' fill='#ffd166' font-size='11'>x (4,096)</text>" +
      "<text x='20' y='134' fill='#7d8fb0' font-size='10'>from the residual</text>" +
      "<text x='20' y='148' fill='#7d8fb0' font-size='10'>stream, Chapter 4</text>" +
      "<line x1='146' y1='90' x2='196' y2='54' stroke='#4f7cff' stroke-width='2'/><polygon points='203,50 191,50 196,60' fill='#4f7cff'/>" +
      "<line x1='146' y1='97' x2='196' y2='97' stroke='#4f7cff' stroke-width='2'/><polygon points='203,97 191,91 191,103' fill='#4f7cff'/>" +
      "<line x1='146' y1='104' x2='196' y2='140' stroke='#4f7cff' stroke-width='2'/><polygon points='203,144 191,144 196,134' fill='#4f7cff'/>" +
      "<rect x='208' y='36' width='96' height='30' rx='6' fill='#111a2e' stroke='#4f7cff' stroke-width='2'/><text x='256' y='56' text-anchor='middle' fill='#c9d6ea' font-size='10.5'>x W_Q</text>" +
      "<rect x='208' y='82' width='96' height='30' rx='6' fill='#111a2e' stroke='#4f7cff' stroke-width='2'/><text x='256' y='102' text-anchor='middle' fill='#c9d6ea' font-size='10.5'>x W_K</text>" +
      "<rect x='208' y='128' width='96' height='30' rx='6' fill='#111a2e' stroke='#4f7cff' stroke-width='2'/><text x='256' y='148' text-anchor='middle' fill='#c9d6ea' font-size='10.5'>x W_V</text>" +
      "<line x1='310' y1='51' x2='352' y2='51' stroke='#4f7cff' stroke-width='2'/><polygon points='359,51 347,45 347,57' fill='#4f7cff'/>" +
      "<line x1='310' y1='97' x2='352' y2='97' stroke='#4f7cff' stroke-width='2'/><polygon points='359,97 347,91 347,103' fill='#4f7cff'/>" +
      "<line x1='310' y1='143' x2='352' y2='143' stroke='#4f7cff' stroke-width='2'/><polygon points='359,143 347,137 347,149' fill='#4f7cff'/>" +
      "<rect x='364' y='36' width='120' height='30' rx='6' fill='#111a2e' stroke='#2de2ff' stroke-width='2'/><text x='424' y='56' text-anchor='middle' fill='#2de2ff' font-size='10.5'>q (128)</text>" +
      "<rect x='364' y='82' width='120' height='30' rx='6' fill='#111a2e' stroke='#3ddc97' stroke-width='2'/><text x='424' y='102' text-anchor='middle' fill='#3ddc97' font-size='10.5'>k (128)</text>" +
      "<rect x='364' y='128' width='120' height='30' rx='6' fill='#111a2e' stroke='#ffd166' stroke-width='2'/><text x='424' y='148' text-anchor='middle' fill='#ffd166' font-size='10.5'>v (128)</text>" +
      "<text x='500' y='56' fill='#2de2ff' font-size='10'>what am I looking for</text>" +
      "<text x='500' y='102' fill='#3ddc97' font-size='10'>what do I advertise</text>" +
      "<text x='500' y='148' fill='#ffd166' font-size='10'>what gets copied from me</text>" +
      "<line x1='20' y1='176' x2='740' y2='176' stroke='#1c2a45' stroke-width='2'/>" +
      "<text x='20' y='198' fill='#7d8fb0' font-size='10.5'>Nothing distinguishes the three but the learned matrix. The roles are a consequence of training, not of design.</text>" +
      "</svg><div class='fig-cap'>Query, key and value are three linear projections of one vector. The names describe the jobs the matrices learn, not anything structural.</div></div>" },

    { title: "Score, Normalize, Average", viz: "llmCausalMask", vizTitle: "Step a generation; then remove the mask and watch it cheat",
      html: "<p>Work it by hand. Four tokens, <em>the cat sat down</em>, and a head dimension of 4 so the numbers fit on a line. These are the projections after the matrices have done their work:</p>" +
      "<pre><code>          k                  v\nthe     [1,0,1,0]          [1,0,0,0]\ncat     [1,1,0,0]          [0,2,0,0]\nsat     [0,1,1,0]          [0,0,3,0]\ndown    [1,0,0,1]          [0,0,0,4]\n\nquery from 'sat':  q = [1,1,0,1]</code></pre>" +
      "<p><strong>Step one, score.</strong> Each dot product of one query with one key is an <strong>attention score</strong>. Dot the query against every key. The dot product is high when two vectors point the same way, which is the whole reason it is the scoring function: it asks how much this key looks like what the query wants.</p>" +
      "<pre><code>q . k_the  = 1(1)+1(0)+0(1)+1(0) = 1\nq . k_cat  = 1(1)+1(1)+0(0)+1(0) = 2\nq . k_sat  = 1(0)+1(1)+0(1)+1(0) = 1\nq . k_down = 1(1)+1(0)+0(0)+1(1) = 2</code></pre>" +
      "<p><strong>Step two, scale.</strong> Divide every score by the square root of the head dimension, here the square root of 4, which is 2. That divisor is the <strong>scaling factor</strong>. The scores become 0.5, 1.0, 0.5, 1.0. The next section is entirely about why this step exists.</p>" +
      "<p><strong>Step three, normalize.</strong> Push the scaled scores through a softmax, which exponentiates each and divides by the total, producing numbers that are positive and sum to 1:</p>" +
      "<pre><code>weights = [0.189, 0.311, 0.189, 0.311]</code></pre>" +
      "<p>The query attends most to <em>cat</em> and <em>down</em>, which are the two keys it scored 2 against, and less to the other two. Nothing is selected and nothing is discarded; every position contributes something.</p>" +
      "<p><strong>Step four, average.</strong> Multiply each value vector by its weight and add them up:</p>" +
      "<pre><code>0.189[1,0,0,0] + 0.311[0,2,0,0] + 0.189[0,0,3,0] + 0.311[0,0,0,4]\n  = [0.189, 0.622, 0.566, 1.245]</code></pre>" +
      "<p>That vector is the output of attention for the position <em>sat</em>. It gets added back into the residual stream, and the block moves on. <strong>Attention is a weighted average of value vectors, where the weights came from dot products of queries against keys.</strong> Everything else in this chapter is a detail of that sentence.</p>" +
      "<h3>The mask</h3>" +
      "<p>One problem. The model is trained to predict the next token, and we just let position 3 attend to position 4. If a position can see its own future, predicting the future is trivial and the model learns nothing.</p>" +
      "<p>The fix is one line: before the softmax, set every score for a future position to negative infinity. Exponentiating negative infinity gives zero, so those positions receive exactly zero weight and contribute nothing. This is the <strong>causal mask</strong>, and a transformer masked this way throughout is a <strong>decoder-only model</strong>.</p>" +
      "<p>The mask does something subtler that is easy to miss and worth pausing on. Because every position is masked to its own prefix, one forward pass over a sequence of length n computes n different predictions, each correctly conditioned on only what came before it. Training gets n training examples for the price of one pass. That efficiency is a direct gift of the mask, and Chapter 13 depends on it entirely.</p>" +
      "<div class='fig'><svg viewBox='0 0 760 236' xmlns='http://www.w3.org/2000/svg' font-family='Menlo,monospace'>" +
      "<text x='20' y='18' fill='#2de2ff' font-size='11'>the score matrix, before and after masking</text>" +
      "<text x='96' y='42' fill='#7d8fb0' font-size='9.5'>the</text><text x='142' y='42' fill='#7d8fb0' font-size='9.5'>cat</text><text x='188' y='42' fill='#7d8fb0' font-size='9.5'>sat</text><text x='230' y='42' fill='#7d8fb0' font-size='9.5'>down</text>" +
      "<text x='40' y='62' fill='#7d8fb0' font-size='9.5'>the</text>" +
      "<rect x='90' y='50' width='38' height='16' rx='3' fill='#4f7cff'/><rect x='136' y='50' width='38' height='16' rx='3' fill='#1c2a45'/><rect x='182' y='50' width='38' height='16' rx='3' fill='#1c2a45'/><rect x='228' y='50' width='38' height='16' rx='3' fill='#1c2a45'/>" +
      "<text x='40' y='84' fill='#7d8fb0' font-size='9.5'>cat</text>" +
      "<rect x='90' y='72' width='38' height='16' rx='3' fill='#4f7cff'/><rect x='136' y='72' width='38' height='16' rx='3' fill='#4f7cff'/><rect x='182' y='72' width='38' height='16' rx='3' fill='#1c2a45'/><rect x='228' y='72' width='38' height='16' rx='3' fill='#1c2a45'/>" +
      "<text x='40' y='106' fill='#ffd166' font-size='9.5'>sat</text>" +
      "<rect x='90' y='94' width='38' height='16' rx='3' fill='#ffd166'/><rect x='136' y='94' width='38' height='16' rx='3' fill='#ffd166'/><rect x='182' y='94' width='38' height='16' rx='3' fill='#ffd166'/><rect x='228' y='94' width='38' height='16' rx='3' fill='#1c2a45'/>" +
      "<text x='40' y='128' fill='#7d8fb0' font-size='9.5'>down</text>" +
      "<rect x='90' y='116' width='38' height='16' rx='3' fill='#4f7cff'/><rect x='136' y='116' width='38' height='16' rx='3' fill='#4f7cff'/><rect x='182' y='116' width='38' height='16' rx='3' fill='#4f7cff'/><rect x='228' y='116' width='38' height='16' rx='3' fill='#4f7cff'/>" +
      "<text x='60' y='152' fill='#7d8fb0' font-size='10'>blue: allowed &#183; dark: masked to -infinity</text>" +
      "<text x='330' y='42' fill='#2de2ff' font-size='11'>the row for 'sat', after softmax</text>" +
      "<rect x='330' y='52' width='53' height='16' rx='3' fill='#4f7cff'/><text x='392' y='65' fill='#7d8fb0' font-size='10'>the  0.189</text>" +
      "<rect x='330' y='74' width='87' height='16' rx='3' fill='#3ddc97'/><text x='426' y='87' fill='#3ddc97' font-size='10'>cat  0.311</text>" +
      "<rect x='330' y='96' width='53' height='16' rx='3' fill='#4f7cff'/><text x='392' y='109' fill='#7d8fb0' font-size='10'>sat  0.189</text>" +
      "<rect x='330' y='118' width='87' height='16' rx='3' fill='#3ddc97'/><text x='426' y='131' fill='#3ddc97' font-size='10'>down 0.311  &#8592; masked in training</text>" +
      "<text x='330' y='156' fill='#7d8fb0' font-size='10'>Every weight is positive and they sum to 1.</text>" +
      "<line x1='20' y1='176' x2='740' y2='176' stroke='#1c2a45' stroke-width='2'/>" +
      "<text x='20' y='198' fill='#c9d6ea' font-size='10.5'>The mask is why one forward pass over n tokens yields n separate training examples:</text>" +
      "<text x='20' y='216' fill='#c9d6ea' font-size='10.5'>each row is a prediction conditioned on exactly its own prefix.</text>" +
      "</svg><div class='fig-cap'>Row i holds the weights position i places on every other position. Masking the upper triangle is the entire difference between a model that can generate and one that cannot.</div></div>" +
      "<p>Use the mask machine now. Step a generation with the mask on and watch each position attend only backwards. Then switch the mask off mid-generation and watch the model predict the next token perfectly, because it can read it. That is the discovery, and it is what a subtly broken mask looks like: a training loss that falls beautifully and a model that cannot generate.</p>" },

    { title: "Why the Square Root",
      html: "<p>Almost every explanation of attention states the divisor and moves on. It is worth two pages, because the argument is short, it is checkable, and it is the classic interview question about this mechanism.</p>" +
      "<p><strong>The problem.</strong> The scores go into a softmax, and softmax is sensitive to the <em>scale</em> of its inputs, not just their order. Feed it [1, 2, 1, 2] and it returns a gentle spread. Feed it [10, 20, 10, 20] and it returns something almost one-hot: nearly all the mass on the two large entries. Same ranking, different distribution.</p>" +
      "<p>A near one-hot softmax is a disaster for training, because the gradient of the softmax is proportional to p(1&#8722;p) for each entry. When p is 0.999 or 0.0001, that product is nearly zero, and nearly zero gradient means the weights barely move. The mechanism stops learning while looking perfectly healthy in the forward pass.</p>" +
      "<p><strong>So how large do the scores get?</strong> A score is a dot product of two d-dimensional vectors. If the components are independent with mean 0 and variance 1, then each product term has mean 0 and variance 1, and the dot product is a sum of d such terms. Variances of independent terms add. So the dot product has variance d, and therefore a standard deviation of the square root of d.</p>" +
      "<p>That is the whole derivation. Dividing by the square root of d rescales the scores to unit variance, independent of head dimension, which keeps the softmax in the range where it has gradient.</p>" +
      "<h3>Check it</h3>" +
      "<p>Sampling 20,000 pairs of independent unit-normal vectors at four head dimensions, on 6 September 2026:</p>" +
      "<pre><code>d_k      measured variance   measured sd    sqrt(d_k)\n   4                  3.9          1.99         2.00\n  64                 63.5          7.97         8.00\n 128                129.3         11.37        11.31\n1024               1025.9         32.03        32.00</code></pre>" +
      "<p>The variance tracks d_k. The prediction was not approximate.</p>" +
      "<p>Now the consequence at Corvid's actual head dimension of 128. Six random keys, one random query, scores computed both ways:</p>" +
      "<pre><code>raw scores        [-16.65, -16.09, 17.54, 12.38, -7.81, -0.35]\nsoftmax unscaled  [ 0.0000,  0.0000, 0.9942, 0.0058, 0.0000, 0.0000]\nsoftmax scaled    [ 0.0238,  0.0250, 0.4886, 0.3099, 0.0520, 0.1006]</code></pre>" +
      "<p>Unscaled, one position takes 99.4% of the weight and everything else is numerically zero. This is attention that has collapsed into a hard lookup before training has taught it anything, with almost no gradient to escape. Scaled, the same scores give a distribution that still prefers the same position but leaves the others alive.</p>" +
      "<div class='fig'><svg viewBox='0 0 760 224' xmlns='http://www.w3.org/2000/svg' font-family='Menlo,monospace'>" +
      "<text x='20' y='18' fill='#2de2ff' font-size='11'>the same six scores at d_k = 128, through softmax (measured)</text>" +
      "<text x='20' y='44' fill='#ff5d73' font-size='10.5'>unscaled</text>" +
      "<rect x='110' y='32' width='2' height='14' rx='2' fill='#1c2a45'/><rect x='150' y='32' width='2' height='14' rx='2' fill='#1c2a45'/>" +
      "<rect x='190' y='32' width='298' height='14' rx='3' fill='#ff5d73'/><rect x='494' y='32' width='2' height='14' rx='2' fill='#1c2a45'/>" +
      "<text x='512' y='44' fill='#ff5d73' font-size='10'>0.9942 on one position</text>" +
      "<text x='20' y='72' fill='#7d8fb0' font-size='10'>gradient here is proportional to p(1-p) = 0.006</text>" +
      "<text x='20' y='112' fill='#3ddc97' font-size='10.5'>scaled</text>" +
      "<rect x='110' y='100' width='14' height='14' rx='3' fill='#4f7cff'/><rect x='150' y='100' width='15' height='14' rx='3' fill='#4f7cff'/>" +
      "<rect x='190' y='100' width='147' height='14' rx='3' fill='#3ddc97'/><rect x='360' y='100' width='93' height='14' rx='3' fill='#3ddc97'/>" +
      "<rect x='480' y='100' width='16' height='14' rx='3' fill='#4f7cff'/><rect x='520' y='100' width='30' height='14' rx='3' fill='#4f7cff'/>" +
      "<text x='560' y='112' fill='#3ddc97' font-size='10'>0.489 / 0.310 / others alive</text>" +
      "<text x='20' y='140' fill='#7d8fb0' font-size='10'>gradient here is proportional to p(1-p) = 0.250, forty times larger</text>" +
      "<line x1='20' y1='160' x2='740' y2='160' stroke='#1c2a45' stroke-width='2'/>" +
      "<text x='20' y='182' fill='#c9d6ea' font-size='10.5'>Measured variance of a dot product: 3.9 at d_k=4, 63.5 at 64, 129.3 at 128, 1025.9 at 1024.</text>" +
      "<text x='20' y='202' fill='#c9d6ea' font-size='10.5'>Variance equals d_k, so standard deviation is sqrt(d_k), so dividing by sqrt(d_k) gives unit variance.</text>" +
      "<text x='20' y='220' fill='#7d8fb0' font-size='10'>Same ranking either way. The divisor changes the distribution's sharpness, never its order.</text>" +
      "</svg><div class='fig-cap'>The divisor is not a fudge factor. It is the one number that makes the softmax's input scale independent of how wide you made the head.</div></div>" +
      "<p>Now go to the attention machine and switch the scaling off. Watch the selected row collapse onto a single position. Then turn it back on. That is the discovery, and it is the answer to the interview question in a form you will not forget.</p>" +
      "<div class='callout'><strong>Interview lens.</strong> &#8220;Why divide by the square root of d_k?&#8221; A weak answer says it stabilizes training. A complete answer says: scores are dot products of d-dimensional vectors, so their variance grows as d, so at large d the softmax saturates and its gradient, proportional to p(1&#8722;p), vanishes; dividing by the standard deviation restores unit variance and keeps the gradient alive. The follow-up is usually &#8220;why not divide by d?&#8221; and the answer is that d over-corrects, shrinking the scores toward zero and flattening the distribution until the mechanism cannot express a preference at all.</div>" },

    { title: "What It Costs", viz: "llmAttentionCost", vizTitle: "Find the sequence length where the scores alone exceed the GPU",
      html: "<p>Every query is scored against every key. That sentence contains the cost of the entire field.</p>" +
      "<p>For a sequence of n tokens the score matrix has n rows and n columns, so attention performs n&#178; dot products and must hold n&#178; numbers. Double the sequence length and you quadruple both. This is <strong>quadratic cost</strong>, and it is the reason context windows were 512 tokens in 2018 and the reason long context is still expensive in 2026.</p>" +
      "<p>Put Corvid's numbers on it. One head, one sequence, scores in fp16:</p>" +
      "<pre><code>     n     scores per head       one head     all 32 heads\n   512             262,144         0.5 MB          0.02 GB\n 2,048           4,194,304         8.4 MB          0.27 GB\n 8,192          67,108,864       134.2 MB          4.29 GB\n32,768       1,073,741,824     2,147.5 MB         68.72 GB</code></pre>" +
      "<p>Read the third row. At Corvid's full 8,192-token context, the score matrices alone are 4.29 GB, for one sequence, before the weights, the activations, or anything else. On the 16 GB budget this course assumes, attention has taken a quarter of the card just to hold intermediate numbers nobody wants to keep.</p>" +
      "<p>Read the fourth row and the situation is absurd: 68.72 GB for a 32,768-token sequence, which no single consumer card can hold.</p>" +
      "<p>And yet models with 128,000-token contexts exist and run on modest hardware. Something in that table is wrong, and what is wrong is the assumption that the score matrix is ever written down at all. Chapter 28 shows the fix, which computes exactly the same output while never materializing the matrix, and the reason it works is a hardware fact from Chapter 16 rather than a mathematical one.</p>" +
      "<p>Take the cost machine and find the sequence length where the score matrices exceed 16 GB. Then note that number, because Chapter 28 will ask you to compare it with what actually runs.</p>" +
      "<div class='fig'><svg viewBox='0 0 760 216' xmlns='http://www.w3.org/2000/svg' font-family='Menlo,monospace'>" +
      "<text x='20' y='18' fill='#2de2ff' font-size='11'>score-matrix memory, 32 heads, fp16 (measured arithmetic)</text>" +
      "<line x1='70' y1='170' x2='700' y2='170' stroke='#1c2a45' stroke-width='2'/>" +
      "<line x1='70' y1='40' x2='70' y2='170' stroke='#1c2a45' stroke-width='2'/>" +
      "<line x1='70' y1='96' x2='700' y2='96' stroke='#ff5d73' stroke-width='2' stroke-dasharray='5 4'/>" +
      "<text x='560' y='90' fill='#ff5d73' font-size='10'>the 16 GB budget</text>" +
      "<rect x='110' y='168' width='40' height='2' rx='1' fill='#3ddc97'/><text x='104' y='186' fill='#7d8fb0' font-size='10'>512</text>" +
      "<rect x='240' y='166' width='40' height='4' rx='1' fill='#3ddc97'/><text x='230' y='186' fill='#7d8fb0' font-size='10'>2,048</text>" +
      "<rect x='370' y='131' width='40' height='39' rx='2' fill='#ffd166'/><text x='360' y='186' fill='#ffd166' font-size='10'>8,192</text>" +
      "<text x='356' y='124' fill='#ffd166' font-size='10'>4.29 GB</text>" +
      "<rect x='500' y='44' width='40' height='126' rx='2' fill='#ff5d73'/><text x='486' y='186' fill='#ff5d73' font-size='10'>32,768</text>" +
      "<text x='476' y='38' fill='#ff5d73' font-size='10'>68.72 GB</text>" +
      "<text x='596' y='130' fill='#7d8fb0' font-size='10'>4x the tokens,</text>" +
      "<text x='596' y='146' fill='#7d8fb0' font-size='10'>16x the memory</text>" +
      "<text x='20' y='208' fill='#7d8fb0' font-size='10.5'>Chapter 28 computes the identical output without ever writing this matrix down.</text>" +
      "</svg><div class='fig-cap'>The quadratic term, in gigabytes. Every long-context technique in this course is a response to this one chart.</div></div>" },

    { title: "What Real Implementations Do Differently",
      html: "<p>Four gaps between the mechanism you just built and the code that runs in production. Each is named here so the vocabulary is familiar when its chapter arrives.</p>" +
      "<p><strong>Heads.</strong> Nothing above explains why the projection went from 4,096 down to 128. Real attention runs many of these in parallel, each with its own three matrices, so one position can attend several ways at once. That is Chapter 6, and it is a reshape rather than a loop, which is why it costs nothing extra.</p>" +
      "<p><strong>Position.</strong> Look again at the worked example and notice something missing: nothing in it referred to the order of the tokens. Permute the input and the same weighted sums come out attached to permuted positions. Attention is blind to order, and every transformer injects position by hand. That is Chapter 7, and the omission here was deliberate.</p>" +
      "<div class='fig'><svg viewBox='0 0 760 200' xmlns='http://www.w3.org/2000/svg' font-family='Menlo,monospace'>" +
      "<text x='20' y='18' fill='#2de2ff' font-size='11'>attention is blind to order</text>" +
      "<text x='20' y='46' fill='#7d8fb0' font-size='10.5'>input</text>" +
      "<rect x='96' y='32' width='68' height='24' rx='6' fill='#111a2e' stroke='#4f7cff' stroke-width='2'/><text x='130' y='49' text-anchor='middle' fill='#c9d6ea' font-size='10.5'>the</text>" +
      "<rect x='170' y='32' width='68' height='24' rx='6' fill='#111a2e' stroke='#4f7cff' stroke-width='2'/><text x='204' y='49' text-anchor='middle' fill='#c9d6ea' font-size='10.5'>cat</text>" +
      "<rect x='244' y='32' width='68' height='24' rx='6' fill='#111a2e' stroke='#4f7cff' stroke-width='2'/><text x='278' y='49' text-anchor='middle' fill='#c9d6ea' font-size='10.5'>sat</text>" +
      "<text x='20' y='96' fill='#7d8fb0' font-size='10.5'>shuffled</text>" +
      "<rect x='96' y='82' width='68' height='24' rx='6' fill='#111a2e' stroke='#ff5d73' stroke-width='2'/><text x='130' y='99' text-anchor='middle' fill='#ff5d73' font-size='10.5'>sat</text>" +
      "<rect x='170' y='82' width='68' height='24' rx='6' fill='#111a2e' stroke='#ff5d73' stroke-width='2'/><text x='204' y='99' text-anchor='middle' fill='#ff5d73' font-size='10.5'>the</text>" +
      "<rect x='244' y='82' width='68' height='24' rx='6' fill='#111a2e' stroke='#ff5d73' stroke-width='2'/><text x='278' y='99' text-anchor='middle' fill='#ff5d73' font-size='10.5'>cat</text>" +
      "<line x1='340' y1='68' x2='390' y2='68' stroke='#ffd166' stroke-width='2'/><polygon points='397,68 385,62 385,74' fill='#ffd166'/>" +
      "<text x='410' y='46' fill='#ffd166' font-size='10.5'>Each token's output is identical.</text>" +
      "<text x='410' y='66' fill='#ffd166' font-size='10.5'>It simply arrives at a different slot.</text>" +
      "<text x='410' y='94' fill='#7d8fb0' font-size='10'>Score, scale, softmax and weighted sum</text>" +
      "<text x='410' y='110' fill='#7d8fb0' font-size='10'>never once refer to an index.</text>" +
      "<line x1='20' y1='134' x2='740' y2='134' stroke='#1c2a45' stroke-width='2'/>" +
      "<text x='20' y='158' fill='#c9d6ea' font-size='10.5'>So 'the cat sat' and 'sat the cat' are the same input to this mechanism.</text>" +
      "<text x='20' y='178' fill='#c9d6ea' font-size='10.5'>Every transformer therefore injects position by hand, which is Chapter 7.</text>" +
      "</svg><div class='fig-cap'>The gap the worked example left on purpose. Nothing you computed in section 3 used a position index anywhere.</div></div>" +
      "<p><strong>The cache.</strong> During generation, position 400's keys and values are recomputed on every step even though they have not changed. Real implementations store them. That store is the KV cache, it dominates serving memory, and Chapters 6, 26 and 27 are increasingly about it.</p>" +
      "<p><strong>The matrix is never written.</strong> As section 5 said, FlashAttention computes the same output tile by tile without materializing n&#178; scores in main memory. It is not an approximation and the output is identical. Chapter 28.</p>" },

    { title: "Exercises",
      html: "<ol>" +
      "<li><strong>Trace.</strong> Using the four keys and values from section 3, compute the attention output for the query from <em>down</em>, q = [0,0,1,1]. Do all four steps: score, scale by the square root of 4, softmax, weighted sum. Then apply the causal mask for position 4 and note which entries change. One of them will not change at all, and you should be able to say why before you compute it.</li>" +
      "<li><strong>Trace.</strong> A model has a head dimension of 64. Its scores have a standard deviation of about 8, as section 4 predicts. Someone proposes dividing by d_k rather than its square root, so by 64. Compute what the six scores from section 4 would become under that divisor, push them through a softmax, and describe the resulting distribution in one sentence. You have just answered the standard follow-up interview question.</li>" +
      "<li><strong>Investigate.</strong> Find the scaled dot-product attention implementation in any open-source model, in PyTorch or in a C inference engine. Locate the four steps from section 3 in the code, and find where the mask is applied. Confirm it is applied before the softmax and not after, then write down what would break if it were applied after. This is a real bug people ship.</li>" +
      "<li><strong>Investigate.</strong> Take a model you use and find its context length and head dimension. Compute the score-matrix memory at full context for one sequence, as in section 5. Then find out how much memory the model actually needs to serve one request at that context. The gap between your number and the real one is what Chapter 28 is worth, in gigabytes.</li>" +
      "<li><strong>Build.</strong> Write scaled dot-product attention in about fifteen lines, with no framework: take Q, K and V as lists of lists, produce the output. Include the scaling and an optional causal mask. Test it against the worked example in section 3, which must produce [0.189, 0.622, 0.566, 1.245] for the query from <em>sat</em>. Then run it twice at head dimension 128 with random inputs, once with scaling and once without, and print the maximum softmax weight in each. You should see roughly 0.49 against 0.99. Keep this code; Chapter 36 turns it into PocketLM's attention.</li>" +
      "</ol>" }
  ],
  terms: [
    { t: "attention", d: "A mechanism that lets each position compute a weighted average of information from every position, with weights derived from learned similarity." },
    { t: "query", d: "A linear projection of a position's vector representing what that position is looking for." },
    { t: "key", d: "A linear projection representing what a position advertises about itself, scored against queries." },
    { t: "value", d: "A linear projection carrying what actually gets copied from a position when it is attended to." },
    { t: "head dimension", d: "The width of the query, key and value projections; 128 for Corvid-8B, and the d_k in the scaling factor." },
    { t: "attention score", d: "The dot product of one query with one key, before scaling and normalization." },
    { t: "score matrix", d: "The n by n array of all query-key scores for a sequence; the source of attention's quadratic cost." },
    { t: "softmax", d: "The function that turns arbitrary real scores into positive weights summing to one, sensitive to the scale of its inputs and not only their order." },
    { t: "scaling factor", d: "Division by the square root of the head dimension, which restores unit variance to the scores so the softmax retains gradient." },
    { t: "causal mask", d: "Setting scores for future positions to negative infinity before the softmax, so a position can only attend to itself and earlier positions." },
    { t: "decoder-only model", d: "A transformer whose attention is causally masked throughout, which is what makes autoregressive generation possible." },
    { t: "quadratic cost", d: "The n-squared growth in attention's compute and memory with sequence length: twice the tokens, four times the work." },
    { t: "bottleneck", d: "The failure of recurrent models to carry a long sequence's information through one fixed-size hidden state." },
    { t: "KV cache", d: "The stored keys and values of earlier positions, kept during generation so they are not recomputed on every step." }
  ],
  quiz: [
    { type: "mc", q: "What are the query, key and value at a given position?", opts: ["Three separate vectors read from three lookup tables", "Three slices of the position's vector, split into thirds", "Three different learned linear projections of the same vector", "The vectors of the previous, current and next positions"], a: 2,
      why: "One vector x is multiplied by three learned matrices. Nothing structural distinguishes the three; the roles emerge because gradient descent found it useful for W_Q to extract what a position is looking for and W_K to extract what it advertises. The database metaphor names the learned jobs, not any property of the arithmetic." },
    { type: "mc", q: "Why is the causal mask applied before the softmax rather than after?", opts: ["Applying it before is faster on a GPU", "Zeroing weights after the softmax would leave them not summing to one, and the masked positions would still have influenced the normalization", "The softmax cannot process negative numbers", "It makes no difference; both orders are used in practice"], a: 1,
      why: "Setting a score to negative infinity before exponentiation makes that term exactly zero and excludes it from the denominator, so the surviving weights renormalize correctly among themselves. Zeroing afterwards leaves a distribution that does not sum to one and that was already shaped by the future tokens you meant to hide. This is a real bug people ship." },
    { type: "mc", q: "Scores are dot products of d-dimensional vectors with unit-variance components. What is the variance of a score?", opts: ["1, because each component has variance 1", "The square root of d", "d squared", "d, because the variances of d independent product terms add"], a: 3,
      why: "A dot product is a sum of d products. Each product of two independent unit-variance terms has variance 1, and variances of independent terms add, so the sum has variance d and standard deviation the square root of d. Measured at 20,000 samples: 3.9 at d=4, 63.5 at 64, 129.3 at 128, 1025.9 at 1024. The prediction is not approximate." },
    { type: "mc", q: "At head dimension 128, an unscaled softmax put 0.9942 of the weight on one position. Why is that bad for training?", opts: ["The gradient of the softmax is proportional to p(1-p), which is near zero at both extremes, so the weights barely move", "The model attends to the wrong position", "The output vector is no longer a valid probability distribution", "Attention becomes non-deterministic"], a: 0,
      why: "The ranking is unaffected and the distribution is perfectly valid. The damage is to learning: at p near 0.994 or near 0, the product p(1-p) is about 0.006, forty times smaller than the 0.25 the scaled version gives. The mechanism has saturated into a hard lookup before training taught it anything, with almost no gradient to escape." },
    { type: "blank", q: "Setting the attention scores for future positions to negative infinity before the softmax is called the ____ mask.", a: ["causal", "causal mask"],
      why: "It is what makes the model decoder-only and what makes generation meaningful. It also buys a large efficiency: because every row is restricted to its own prefix, one forward pass over n tokens produces n correctly conditioned predictions, so training gets n examples for the price of one pass." },
    { type: "blank", q: "Attention's compute and memory grow with the ____ of the sequence length, which is why doubling context quadruples the cost.", a: ["square", "square of", "n squared", "quadratic"],
      why: "Every query is scored against every key, so the score matrix is n by n. At Corvid's 8,192-token context that is 4.29 GB of scores across 32 heads in fp16, before weights or activations. Every long-context technique in this course is a response to that number." },
    { type: "order", q: "Order the four steps of scaled dot-product attention:", items: ["dot each query with every key to get scores", "divide the scores by the square root of the head dimension", "apply softmax to turn scores into weights that sum to one", "sum the value vectors weighted by those weights"], 
      why: "Score, scale, normalize, average. The causal mask slots between steps two and three, because it must act on scores rather than on weights. Every attention implementation you will ever read is these four steps with the matrix multiplications batched differently." },
    { type: "mc", q: "What did the 2017 transformer paper actually contribute, given that attention was published in 2014?", opts: ["The dot-product scoring function", "The softmax normalization of attention weights", "The idea of learning separate query and key projections", "The claim that attention alone suffices, which removed recurrence and let a whole sequence train in parallel"], a: 3,
      why: "Bahdanau and colleagues introduced attention in 2014 as an addition to a recurrent model, and Luong and colleagues simplified the scoring to a dot product in 2015. The 2017 contribution was removing the recurrence entirely. The payoff was less about accuracy than about hardware: without a sequential dependency between positions, an entire sequence trains at once, which is what made scale possible." },
    { type: "mc", q: "You permute the words of a sentence and the attention output for each word is unchanged apart from following its word. What does that show?", opts: ["The mask was not applied", "The scaling factor was omitted", "Attention has no notion of position, which must be injected separately", "The value projection is degenerate"], a: 2,
      why: "Nothing in score, scale, softmax or weighted sum refers to where a token sits. Attention is permutation-equivariant by construction, which is why every transformer adds positional information by hand. Chapter 7 covers the four families of ways to do it, and the omission in this chapter was deliberate so you would notice it here." },
    { type: "mc", q: "The score matrices for a 32,768-token sequence would need 68.72 GB, yet models with far longer contexts run on single cards. What resolves the contradiction?", opts: ["The score matrix is never written to main memory; it is computed in tiles that stay in fast on-chip memory", "The scores are stored in a lower precision than fp16", "Long-context models replace attention with a cheaper approximation", "Those models use fewer attention heads"], a: 0,
      why: "FlashAttention computes exactly the same output without materializing the n-by-n matrix, by tiling the computation so intermediate scores never leave on-chip memory. It is an input/output optimization, not an approximation, and the output is bit-comparable. It is Chapter 28, and it only makes sense after the hardware facts in Chapter 16." }
  ]
});

/* ======================= CHAPTER 6 ======================= */
CHAPTERS.push({
  num: 6, part: 2, title: "Many Heads, and Making Them Cheap",
  blurb: "One head can only average one way at a time. Multi-head attention runs several in parallel, and it is a reshape rather than a loop, which is why it costs nothing extra. You will see what different heads specialize in, then follow the pressure that reshaped them: the KV cache. Once keys and values must be stored for every position, every layer and every head, the head count becomes a memory bill, and grouped-query attention is the field's answer. This is where architecture starts being decided by serving cost rather than by accuracy.",
  sections: [
    { title: "One Head Is Not Enough", viz: "llmMultiHead", vizTitle: "Click through the heads; two of them are doing something obvious",
      html: "<p>Chapter 5's attention produces one weighted average per position. That is one relationship, computed once. But a position usually needs several things at once: the verb wants its subject, the pronoun wants its antecedent, and the closing bracket wants its opening one, all at the same position, in the same layer.</p>" +
      "<p>With one head you cannot have all three. The softmax produces a single distribution, and spending weight on the subject means not spending it on the bracket. The mechanism is forced to compromise.</p>" +
      "<p><strong>The fix is to run several attentions in parallel</strong>, each with its own W_Q, W_K and W_V, and let each learn a different relationship. These are <strong>heads</strong>. Corvid-8B has 32 of them in every layer.</p>" +
      "<h3>Why this is free</h3>" +
      "<p>The obvious objection is that 32 heads should cost 32 times as much. They do not, and the reason is the one design decision that made the idea practical: <strong>the head dimension shrinks to match.</strong></p>" +
      "<p>Corvid's model dimension is 4,096. Rather than 32 heads each projecting to 4,096, each head projects to 4,096 &#247; 32 = 128, the head dimension you met in Chapter 5. The total width across all heads is 32 &#215; 128 = 4,096, exactly what one full-width head would have used.</p>" +
      "<p>So multi-head attention is not a loop over 32 attentions. It is <em>one</em> projection to 4,096 dimensions, reinterpreted as 32 separate 128-dimensional vectors, with the attention arithmetic run on the last axis. In code it is a reshape and a transpose. The matrix multiplications are the same size they would have been with a single head, which is why a model can have 32 heads and pay for one.</p>" +
      "<div class='fig'><svg viewBox='0 0 760 212' xmlns='http://www.w3.org/2000/svg' font-family='Menlo,monospace'>" +
      "<text x='20' y='18' fill='#2de2ff' font-size='11'>multi-head attention is a reshape, not a loop</text>" +
      "<text x='20' y='48' fill='#7d8fb0' font-size='10.5'>one projection</text>" +
      "<rect x='140' y='34' width='560' height='24' rx='6' fill='#111a2e' stroke='#ffd166' stroke-width='2.5'/>" +
      "<text x='420' y='51' text-anchor='middle' fill='#ffd166' font-size='10.5'>q for this position: 4,096 numbers</text>" +
      "<line x1='420' y1='62' x2='420' y2='78' stroke='#7d8fb0' stroke-width='2'/><polygon points='420,85 414,73 426,73' fill='#7d8fb0'/>" +
      "<text x='20' y='108' fill='#7d8fb0' font-size='10.5'>read as 32</text>" +
      "<rect x='140' y='94' width='64' height='24' rx='4' fill='#111a2e' stroke='#4f7cff' stroke-width='2'/><text x='172' y='111' text-anchor='middle' fill='#c9d6ea' font-size='9.5'>head 0</text>" +
      "<rect x='208' y='94' width='64' height='24' rx='4' fill='#111a2e' stroke='#4f7cff' stroke-width='2'/><text x='240' y='111' text-anchor='middle' fill='#c9d6ea' font-size='9.5'>head 1</text>" +
      "<rect x='276' y='94' width='64' height='24' rx='4' fill='#111a2e' stroke='#4f7cff' stroke-width='2'/><text x='308' y='111' text-anchor='middle' fill='#c9d6ea' font-size='9.5'>head 2</text>" +
      "<rect x='344' y='94' width='64' height='24' rx='4' fill='#111a2e' stroke='#4f7cff' stroke-width='2'/><text x='376' y='111' text-anchor='middle' fill='#c9d6ea' font-size='9.5'>head 3</text>" +
      "<text x='424' y='111' fill='#7d8fb0' font-size='10'>. . .</text>" +
      "<rect x='636' y='94' width='64' height='24' rx='4' fill='#111a2e' stroke='#4f7cff' stroke-width='2'/><text x='668' y='111' text-anchor='middle' fill='#c9d6ea' font-size='9.5'>head 31</text>" +
      "<text x='140' y='134' fill='#7d8fb0' font-size='10'>128 numbers each &#183; 32 x 128 = 4,096</text>" +
      "<line x1='20' y1='152' x2='740' y2='152' stroke='#1c2a45' stroke-width='2'/>" +
      "<text x='20' y='174' fill='#c9d6ea' font-size='10.5'>The same numbers, grouped differently. No extra multiplication happens.</text>" +
      "<text x='20' y='196' fill='#7d8fb0' font-size='10.5'>Each head then runs Chapter 5's four steps on its own 128-wide slice, independently and in parallel.</text>" +
      "</svg><div class='fig-cap'>Why 32 heads cost what one head costs: the width was divided, not multiplied.</div></div>" },

    { title: "What Heads Learn",
      html: "<p>Nothing tells head 7 to track quotation marks. Heads differentiate because they start at different random values and gradient descent has no reason to make them redundant. What they settle into is remarkably legible, and three kinds show up in almost every model people have examined.</p>" +
      "<p><strong>Positional heads.</strong> The simplest: a head that attends to the previous token, or the one two back, almost regardless of content. Dull, and clearly useful, because a great deal of language structure is local.</p>" +
      "<p><strong>Delimiter and syntactic heads.</strong> Heads that attend to sentence boundaries, to the matching opening bracket, to the opening quotation mark. These are the ones that look most like parsing, and finding one is the fastest way to convince yourself the model is doing something structured.</p>" +
      "<p><strong>Induction heads.</strong> The interesting case, described by Catherine Olsson and colleagues in 2022. The pattern is: if the sequence contains <code>...A B ... A</code>, attend from the second A to the token that followed the first A, and predict B. That is copying from context, and it is a circuit built from <em>two</em> heads in different layers working together: one head writes information about the previous token into the stream, and a second head reads it to find the match. It is the clearest known mechanism behind in-context learning, which is the ability to pick up a pattern from the prompt without any weight update.</p>" +
      "<p>That last point is worth sitting with. Few-shot prompting works, at least in part, because gradient descent independently discovered a copying circuit and built it out of two attention heads. Nobody designed it.</p>" +
      "<div class='fig'><svg viewBox='0 0 760 194' xmlns='http://www.w3.org/2000/svg' font-family='Menlo,monospace'>" +
      "<text x='20' y='18' fill='#2de2ff' font-size='11'>three heads, one sentence: where each one looks</text>" +
      "<text x='20' y='46' fill='#7d8fb0' font-size='10'>head A</text><text x='84' y='46' fill='#7d8fb0' font-size='10'>previous token</text>" +
      "<rect x='210' y='32' width='60' height='20' rx='4' fill='#111a2e' stroke='#1c2a45' stroke-width='1.5'/><text x='240' y='46' text-anchor='middle' fill='#7d8fb0' font-size='9.5'>she</text>" +
      "<rect x='276' y='32' width='60' height='20' rx='4' fill='#111a2e' stroke='#3ddc97' stroke-width='2.5'/><text x='306' y='46' text-anchor='middle' fill='#3ddc97' font-size='9.5'>said</text>" +
      "<rect x='342' y='32' width='72' height='20' rx='4' fill='#111a2e' stroke='#ffd166' stroke-width='2.5'/><text x='378' y='46' text-anchor='middle' fill='#ffd166' font-size='9.5'>&#8220;</text>" +
      "<rect x='420' y='32' width='60' height='20' rx='4' fill='#111a2e' stroke='#1c2a45' stroke-width='1.5'/><text x='450' y='46' text-anchor='middle' fill='#7d8fb0' font-size='9.5'>wait</text>" +
      "<rect x='486' y='32' width='72' height='20' rx='4' fill='#111a2e' stroke='#2de2ff' stroke-width='2.5'/><text x='522' y='46' text-anchor='middle' fill='#2de2ff' font-size='9.5'>&#8221;</text>" +
      "<path d='M522 56 Q450 78 382 56' fill='none' stroke='#ffd166' stroke-width='2'/><polygon points='378,52 388,60 384,49' fill='#ffd166'/>" +
      "<text x='576' y='46' fill='#7d8fb0' font-size='10'>the sentence</text>" +
      "<text x='20' y='86' fill='#7d8fb0' font-size='10'>head B</text><text x='84' y='86' fill='#ffd166' font-size='10'>matching quotation mark (the gold arc)</text>" +
      "<text x='20' y='118' fill='#7d8fb0' font-size='10'>head C</text><text x='84' y='118' fill='#7d8fb0' font-size='10'>induction: ... A B ... A -&#62; predict B</text>" +
      "<rect x='210' y='104' width='44' height='20' rx='4' fill='#111a2e' stroke='#ff5d73' stroke-width='2'/><text x='232' y='118' text-anchor='middle' fill='#ff5d73' font-size='9.5'>Ada</text>" +
      "<rect x='260' y='104' width='60' height='20' rx='4' fill='#111a2e' stroke='#3ddc97' stroke-width='2'/><text x='290' y='118' text-anchor='middle' fill='#3ddc97' font-size='9.5'>Lovelace</text>" +
      "<text x='330' y='118' fill='#7d8fb0' font-size='9.5'>... wrote ...</text>" +
      "<rect x='420' y='104' width='44' height='20' rx='4' fill='#111a2e' stroke='#ff5d73' stroke-width='2'/><text x='442' y='118' text-anchor='middle' fill='#ff5d73' font-size='9.5'>Ada</text>" +
      "<rect x='470' y='104' width='60' height='20' rx='4' fill='#111a2e' stroke='#1c2a45' stroke-width='1.5' stroke-dasharray='4 3'/><text x='500' y='118' text-anchor='middle' fill='#7d8fb0' font-size='9.5'>?</text>" +
      "<path d='M442 102 Q350 84 262 102' fill='none' stroke='#ff5d73' stroke-width='2'/><polygon points='258,106 268,98 264,109' fill='#ff5d73'/>" +
      "<text x='548' y='118' fill='#3ddc97' font-size='10'>copy 'Lovelace'</text>" +
      "<line x1='20' y1='142' x2='740' y2='142' stroke='#1c2a45' stroke-width='2'/>" +
      "<text x='20' y='164' fill='#c9d6ea' font-size='10.5'>Head C is a two-head circuit spanning layers, and it is the clearest known mechanism</text>" +
      "<text x='20' y='184' fill='#c9d6ea' font-size='10.5'>behind in-context learning: few-shot prompting works partly because this circuit exists.</text>" +
      "</svg><div class='fig-cap'>Nobody specified any of these. Heads differentiate because they start at different random values and redundancy is not rewarded.</div></div>" +
      "<p>Open the machine and click through the heads on a sentence. At least two will be obvious within a minute: one looking steadily one token back, one locking onto punctuation. Then paste text containing a repeated name and hunt for the head that fires only on the second occurrence. That is an induction head, and finding one yourself is worth more than reading three papers about them.</p>" },

    { title: "Putting the Heads Back Together",
      html: "<p>Thirty-two heads produce 32 output vectors of 128 dimensions each. The residual stream expects one vector of 4,096. Concatenating gives 4,096 numbers, so it looks like the job is done.</p>" +
      "<p>It is not, and the reason is worth stating precisely. A bare concatenation would write head 0's output into dimensions 0 to 127 of the residual stream, head 1's into 128 to 255, and so on, permanently. Each head would own a fixed, private slice of the stream, and no head's output could ever be combined with another's. The layer could not produce anything that depends on two heads at once.</p> " +
      "<p>So concatenation is followed by a fourth learned matrix, W_O, mapping 4,096 back to 4,096. This is the <strong>output projection</strong>, and it is what lets the layer mix heads: any output dimension can be a combination of all 32 heads' results. The induction circuit from the last section needs exactly this, because it depends on two heads composing.</p>" +
      "<p>Counting the four matrices per layer, at 4,096 &#215; 4,096 each, gives 67.1 million parameters of attention per layer for a model with full-size keys and values. Chapter 9 does this arithmetic properly, including what changes when the key and value projections shrink, which is the next section.</p>" },

    { title: "The Cache That Changes Everything",
      html: "<p>Now the part that reshaped the architecture, and it comes from generation rather than from training.</p>" +
      "<p>Chapter 1 established that generating text means running the model once per token. Consider what happens at step 400. The model computes a query for position 400, and scores it against the keys of positions 1 through 400. But positions 1 through 399 have not changed since the last step. Their keys and values are exactly what they were. Recomputing them is pure waste, and it makes each generation step cost more than the last.</p>" +
      "<p>So implementations store them. That store is the <strong>KV cache</strong>, and it converts generation from quadratic work to linear: each new token computes one query, one key and one value, appends the key and value to the cache, and attends over everything stored.</p>" +
      "<p>It is a clear win and it has a price, which is memory, and the price is larger than people expect. What must be stored, per token:</p>" +
      "<pre><code>2 (a key and a value)\n  x  number of layers\n  x  number of KV heads\n  x  head dimension\n  x  bytes per number</code></pre>" +
      "<p>Corvid-8B has 32 layers and a head dimension of 128, in bfloat16. If every one of its 32 heads had its own keys and values, that is:</p>" +
      "<pre><code>2 x 32 x 32 x 128 x 2 bytes = 524,288 bytes = 512 KB per token</code></pre>" +
      "<p>Half a megabyte per token. At Corvid's full 8,192-token context that is <strong>4.29 GB for a single request</strong>, and it is per request: ten concurrent users need ten of them. The cache is not a small optimization detail. For a serving system it is frequently larger than the model weights.</p>" +
      "<div class='callout'><strong>Where the 16 GB budget breaks.</strong> Corvid-8B at bfloat16 is 8.03 billion parameters &#215; 2 bytes = 16.06 GB of weights, which does not fit the 16 GB budget before a single token is cached. This is not a flaw in the example; it is the situation every engineer running a model of this size on consumer hardware is actually in, and it is why Chapter 29 on quantization is not optional. At 4-bit the weights are 4.01 GB, leaving 11.98 GB for cache, and the rest of this chapter uses that as its budget.</div>" },

    { title: "Sharing Keys and Values", viz: "llmKvBudget", vizTitle: "Switch MHA to GQA and watch how many users fit",
      html: "<p>Look again at the cache formula and ask which term to attack. Layers and head dimension are fixed by the architecture. Precision is Chapter 29's business. That leaves the number of KV heads, and here is the observation that made the field move: <strong>there is no rule that the number of key-value heads must equal the number of query heads.</strong></p>" +
      "<p>Noam Shazeer proposed the extreme version in 2019: <strong>multi-query attention</strong>, in which all 32 query heads share a single set of keys and values. The cache falls by a factor of 32. Each head still asks its own question, because each has its own W_Q, but they all consult the same advertisement.</p>" +
      "<p>It works, and it degrades quality slightly, and the degradation gets worse as models grow. So in 2023 Joshua Ainslie and colleagues published the compromise that is now standard: <strong>grouped-query attention</strong>, where query heads are divided into groups and each group shares one set of keys and values. Corvid uses 32 query heads and 8 KV heads, so four query heads share each KV head.</p>" +
      "<p>Priced on Corvid, per token and at full context:</p>" +
      "<pre><code>scheme   KV heads   bytes/token   at 8,192 ctx   full-context requests\n                                                in 11.98 GB\nMHA            32       512.0 KB       4.295 GB          3\nGQA             8       128.0 KB       1.074 GB         11\nMQA             1        16.0 KB       0.134 GB         89</code></pre>" +
      "<p>Read the last column. Moving from full multi-head attention to Corvid's 4:1 grouping takes a card from serving three concurrent full-context requests to eleven, on identical hardware, for a quality cost that is small enough that every major model family accepted it. That is not a tuning improvement. It is the difference between a deployment being viable and not.</p>" +
      "<p>The pattern is universal in current models. Read from their configurations: Llama-3-8B uses 32 query heads and 8 KV heads. Mistral-7B-v0.3 uses 32 and 8. Qwen2.5-7B uses 28 and 4, a 7:1 ratio, more aggressive than Corvid. Gemma-2-9B uses 16 and 8, only 2:1, but with a head dimension of 256 rather than 128, which is a different trade in the same equation.</p>" +
      "<div class='fig'><svg viewBox='0 0 760 244' xmlns='http://www.w3.org/2000/svg' font-family='Menlo,monospace'>" +
      "<text x='20' y='18' fill='#2de2ff' font-size='11'>who shares keys and values</text>" +
      "<text x='30' y='42' fill='#c9d6ea' font-size='10.5'>MHA</text>" +
      "<rect x='30' y='50' width='26' height='18' rx='3' fill='#111a2e' stroke='#2de2ff' stroke-width='1.5'/>" +
      "<rect x='60' y='50' width='26' height='18' rx='3' fill='#111a2e' stroke='#2de2ff' stroke-width='1.5'/>" +
      "<rect x='90' y='50' width='26' height='18' rx='3' fill='#111a2e' stroke='#2de2ff' stroke-width='1.5'/>" +
      "<rect x='120' y='50' width='26' height='18' rx='3' fill='#111a2e' stroke='#2de2ff' stroke-width='1.5'/>" +
      "<rect x='30' y='78' width='26' height='18' rx='3' fill='#111a2e' stroke='#ff5d73' stroke-width='2'/>" +
      "<rect x='60' y='78' width='26' height='18' rx='3' fill='#111a2e' stroke='#ff5d73' stroke-width='2'/>" +
      "<rect x='90' y='78' width='26' height='18' rx='3' fill='#111a2e' stroke='#ff5d73' stroke-width='2'/>" +
      "<rect x='120' y='78' width='26' height='18' rx='3' fill='#111a2e' stroke='#ff5d73' stroke-width='2'/>" +
      "<text x='30' y='114' fill='#ff5d73' font-size='9.5'>4 queries, 4 KV</text>" +
      "<text x='270' y='42' fill='#c9d6ea' font-size='10.5'>GQA</text>" +
      "<rect x='270' y='50' width='26' height='18' rx='3' fill='#111a2e' stroke='#2de2ff' stroke-width='1.5'/>" +
      "<rect x='300' y='50' width='26' height='18' rx='3' fill='#111a2e' stroke='#2de2ff' stroke-width='1.5'/>" +
      "<rect x='330' y='50' width='26' height='18' rx='3' fill='#111a2e' stroke='#2de2ff' stroke-width='1.5'/>" +
      "<rect x='360' y='50' width='26' height='18' rx='3' fill='#111a2e' stroke='#2de2ff' stroke-width='1.5'/>" +
      "<rect x='285' y='78' width='26' height='18' rx='3' fill='#111a2e' stroke='#ffd166' stroke-width='2'/>" +
      "<rect x='345' y='78' width='26' height='18' rx='3' fill='#111a2e' stroke='#ffd166' stroke-width='2'/>" +
      "<line x1='283' y1='70' x2='296' y2='78' stroke='#7d8fb0' stroke-width='1.5'/><line x1='313' y1='70' x2='300' y2='78' stroke='#7d8fb0' stroke-width='1.5'/>" +
      "<line x1='343' y1='70' x2='356' y2='78' stroke='#7d8fb0' stroke-width='1.5'/><line x1='373' y1='70' x2='360' y2='78' stroke='#7d8fb0' stroke-width='1.5'/>" +
      "<text x='270' y='114' fill='#ffd166' font-size='9.5'>4 queries, 2 KV</text>" +
      "<text x='510' y='42' fill='#c9d6ea' font-size='10.5'>MQA</text>" +
      "<rect x='510' y='50' width='26' height='18' rx='3' fill='#111a2e' stroke='#2de2ff' stroke-width='1.5'/>" +
      "<rect x='540' y='50' width='26' height='18' rx='3' fill='#111a2e' stroke='#2de2ff' stroke-width='1.5'/>" +
      "<rect x='570' y='50' width='26' height='18' rx='3' fill='#111a2e' stroke='#2de2ff' stroke-width='1.5'/>" +
      "<rect x='600' y='50' width='26' height='18' rx='3' fill='#111a2e' stroke='#2de2ff' stroke-width='1.5'/>" +
      "<rect x='555' y='78' width='26' height='18' rx='3' fill='#111a2e' stroke='#3ddc97' stroke-width='2'/>" +
      "<line x1='523' y1='70' x2='566' y2='78' stroke='#7d8fb0' stroke-width='1.5'/><line x1='553' y1='70' x2='568' y2='78' stroke='#7d8fb0' stroke-width='1.5'/>" +
      "<line x1='583' y1='70' x2='570' y2='78' stroke='#7d8fb0' stroke-width='1.5'/><line x1='613' y1='70' x2='574' y2='78' stroke='#7d8fb0' stroke-width='1.5'/>" +
      "<text x='510' y='114' fill='#3ddc97' font-size='9.5'>4 queries, 1 KV</text>" +
      "<text x='20' y='146' fill='#2de2ff' font-size='11'>cache per token on Corvid-8B, and requests that fit in 11.98 GB</text>" +
      "<text x='30' y='172' fill='#7d8fb0' font-size='10'>MHA</text>" +
      "<rect x='110' y='160' width='400' height='14' rx='3' fill='#ff5d73'/><text x='524' y='172' fill='#ff5d73' font-size='10'>512 KB/token &#183; 3 requests</text>" +
      "<text x='30' y='198' fill='#7d8fb0' font-size='10'>GQA 4:1</text>" +
      "<rect x='110' y='186' width='100' height='14' rx='3' fill='#ffd166'/><text x='524' y='198' fill='#ffd166' font-size='10'>128 KB/token &#183; 11 requests</text>" +
      "<text x='30' y='224' fill='#7d8fb0' font-size='10'>MQA</text>" +
      "<rect x='110' y='212' width='13' height='14' rx='3' fill='#3ddc97'/><text x='524' y='224' fill='#3ddc97' font-size='10'>16 KB/token &#183; 89 requests</text>" +
      "</svg><div class='fig-cap'>Blue is a query head, coloured boxes are the keys and values it consults. The bars are the same architecture priced per token at 8,192 context.</div></div>" +
      "<p>Set the machine to MHA and note the concurrent capacity. Switch to GQA at 4:1 and watch it roughly quadruple with no change to the query heads and no change to what the model can express per head. That is the discovery, and it explains a config field you will now find in every model you open.</p>" },

    { title: "Not Attending to Everything",
      html: "<p>A second way to shrink the cache: stop keeping all of it.</p> " +
      "<p><strong>Sliding-window attention</strong> restricts each position to the last w tokens rather than the whole prefix. The cache then holds w tokens instead of n, so its size stops growing with the conversation. Gemma-2-9B uses a 4,096-token window, and it alternates: some layers see the window, others see everything. Information still travels further than w, because a position at the top of a stack of 42 layers has been influenced by positions influenced by positions, so the effective receptive field grows with depth even though each individual layer looks locally.</p>" +
      "<p>The cost is real. Anything that genuinely requires attending to a specific token 30,000 positions back, in a windowed layer, cannot. Mistral shipped a 4,096-token window in v0.1 and removed it by v0.3, which is a useful piece of evidence about how the trade landed in practice.</p>" +
      "<p><strong>Attention sinks</strong> are the strangest result in this chapter. Guangxuan Xiao and colleagues found in 2023 that if you simply evict the oldest tokens from a full cache, quality collapses immediately, far worse than the lost information could explain. The cause turned out to be the first few tokens of the sequence. Models place a large share of attention weight on them almost regardless of content, apparently using them as a place to dump weight when a head has nothing it wants: softmax must sum to one, so a head that wants nothing has to put its mass somewhere. Remove those tokens and every head's distribution is disturbed.</p>" +
      "<p>The fix is almost comically cheap. Keep the first four tokens forever, evict from the middle, and quality holds over sequences far longer than the model was trained on. Four tokens.</p>" +
      "<div class='fig'><svg viewBox='0 0 760 186' xmlns='http://www.w3.org/2000/svg' font-family='Menlo,monospace'>" +
      "<text x='20' y='18' fill='#2de2ff' font-size='11'>what a position can attend to</text>" +
      "<text x='20' y='46' fill='#7d8fb0' font-size='10'>full causal</text>" +
      "<rect x='120' y='34' width='500' height='16' rx='3' fill='#4f7cff'/>" +
      "<rect x='624' y='34' width='24' height='16' rx='3' fill='#ffd166'/>" +
      "<text x='660' y='47' fill='#7d8fb0' font-size='10'>grows forever</text>" +
      "<text x='20' y='84' fill='#7d8fb0' font-size='10'>sliding window</text>" +
      "<rect x='120' y='72' width='380' height='16' rx='3' fill='#1c2a45'/>" +
      "<rect x='504' y='72' width='116' height='16' rx='3' fill='#3ddc97'/>" +
      "<rect x='624' y='72' width='24' height='16' rx='3' fill='#ffd166'/>" +
      "<text x='660' y='85' fill='#3ddc97' font-size='10'>capped at w</text>" +
      "<text x='20' y='122' fill='#7d8fb0' font-size='10'>window + sinks</text>" +
      "<rect x='120' y='110' width='30' height='16' rx='3' fill='#ff5d73'/>" +
      "<rect x='154' y='110' width='346' height='16' rx='3' fill='#1c2a45'/>" +
      "<rect x='504' y='110' width='116' height='16' rx='3' fill='#3ddc97'/>" +
      "<rect x='624' y='110' width='24' height='16' rx='3' fill='#ffd166'/>" +
      "<text x='660' y='123' fill='#ff5d73' font-size='10'>keep first 4</text>" +
      "<text x='120' y='146' fill='#7d8fb0' font-size='9.5'>oldest</text><text x='596' y='146' fill='#7d8fb0' font-size='9.5'>current</text>" +
      "<text x='20' y='176' fill='#c9d6ea' font-size='10.5'>Evicting the first few tokens collapses quality: heads park unwanted attention weight there.</text>" +
      "</svg><div class='fig-cap'>Gold is the position doing the attending. The four red tokens cost almost nothing and are the difference between a windowed cache working and not.</div></div>" },

    { title: "Choosing a Configuration",
      html: "<p>You can now read the attention half of any model card, and make the decision yourself. The procedure, in order, because the order is what makes it a procedure rather than a list.</p>" +
      "<ol>" +
      "<li><strong>Start from the serving constraint, not the architecture.</strong> How much memory, how long a context, how many concurrent requests. Those three numbers determine your cache budget before any architectural choice is made.</li>" +
      "<li><strong>Compute the cache per token</strong> with the formula from section 4. Multiply by context length and by concurrency. If it does not fit, nothing else in this list matters yet.</li>" +
      "<li><strong>Set the KV head count to fit.</strong> This is the largest lever with the smallest quality cost. A 4:1 grouping is the current default because it is close to free; 8:1 needs measuring on your workload; full MQA needs measuring and is usually reserved for cases where concurrency dominates everything.</li>" +
      "<li><strong>Consider a window only if your context is genuinely long and genuinely local.</strong> Summarization of long documents suffers. Chat with a rolling history does not, much. If you window, keep sinks.</li>" +
      "<li><strong>Leave the query head count alone.</strong> It costs almost nothing in cache and it is what gives the layer its expressiveness. Nothing in this chapter is an argument for fewer query heads.</li>" +
      "</ol>" +
      "<div class='callout'><strong>Interview lens.</strong> &#8220;Why did models move from multi-head to grouped-query attention?&#8221; The answer is not &#8220;it is faster&#8221;. It is that generation requires caching keys and values for every position, layer and head; that cache is often larger than the weights; the query heads are what give attention its expressiveness while the KV heads are what fill memory; so sharing KV heads across groups of query heads buys a large multiple in concurrent capacity for a small, measurable quality cost. Numbers make the answer: on an 8B model at 8,192 context, 512 KB per token becomes 128 KB.</div>" },

    { title: "Exercises",
      html: "<ol>" +
      "<li><strong>Trace.</strong> A model has 40 layers, 40 query heads, 8 KV heads and a head dimension of 128, served in bfloat16. Compute its KV cache in bytes per token, then at a 32,768-token context, then for 20 concurrent requests at that context. Compare the total against an 80 GB card and say how much is left for weights. Then redo the first calculation as if the model used full multi-head attention, and state the factor.</li>" +
      "<li><strong>Trace.</strong> Corvid has 32 query heads and a head dimension of 128. Explain in two sentences why moving to 8 KV heads shrinks the cache by a factor of four but shrinks the parameter count by much less. Name which of the four attention matrices change size and which do not.</li>" +
      "<li><strong>Investigate.</strong> Open the configs of four models from different families and record <code>num_attention_heads</code>, <code>num_key_value_heads</code>, <code>head_dim</code> or the implied one, <code>num_hidden_layers</code> and any <code>sliding_window</code>. Compute cache bytes per token for each. Rank them by cache cost and check whether the ranking matches their parameter counts. It will not, and the mismatch is the point of this chapter.</li>" +
      "<li><strong>Investigate.</strong> Find a model whose head dimension is not simply its hidden size divided by its head count. Gemma-2-9B is one: 3,584 hidden, 16 heads, head dimension 256. Work out what that decoupling buys and what it costs, in cache bytes and in attention parameters. Then decide whether you would have made the same call.</li>" +
      "<li><strong>Build.</strong> Extend the attention function you wrote in Chapter 5 to multi-head, as a reshape rather than a loop: project once to the full width, view the result as h heads of size d_head, run attention on the last axis, then concatenate and apply an output projection. Assert that with h = 1 it reproduces your Chapter 5 output exactly. Then add a <code>n_kv_heads</code> parameter that repeats each KV head across its group, and assert that setting it equal to the query head count reproduces the multi-head result. You have just written the difference between MHA, GQA and MQA in about five lines, which is genuinely all it is.</li>" +
      "</ol>" }
  ],
  terms: [
    { t: "head", d: "One of several parallel attentions in a layer, each with its own query, key and value projections, learning a different relationship." },
    { t: "multi-head attention", d: "Running several heads in parallel over slices of the same projection, so the layer can express several relationships at once." },
    { t: "head dimension", d: "The width of one head's projections; the model dimension divided by the head count in most models, though not all." },
    { t: "output projection", d: "The fourth learned matrix, applied after concatenating head outputs, which lets the layer mix information across heads." },
    { t: "positional head", d: "A head that attends to a fixed relative offset, such as the previous token, largely regardless of content." },
    { t: "induction head", d: "A two-head circuit that finds an earlier occurrence of the current token and copies what followed it; the clearest known mechanism behind in-context learning." },
    { t: "in-context learning", d: "Picking up a pattern from the prompt without any weight update, which few-shot prompting relies on." },
    { t: "KV cache", d: "The stored keys and values of all previous positions, kept during generation so they are not recomputed at every step." },
    { t: "multi-query attention", d: "Sharing a single set of keys and values across all query heads, cutting the cache by the head count at some cost to quality." },
    { t: "grouped-query attention", d: "Dividing query heads into groups that each share one set of keys and values; the current default, with Corvid at four query heads per KV head." },
    { t: "KV heads", d: "The number of distinct key and value projections in a layer, which sets the cache size and need not equal the query head count." },
    { t: "sliding-window attention", d: "Restricting each position to the last w tokens, capping the cache at w rather than letting it grow with the sequence." },
    { t: "attention sink", d: "An early token that heads place large attention weight on regardless of content, apparently to absorb weight they do not wish to spend; evicting one collapses quality." },
    { t: "receptive field", d: "How far back a position's information can reach; in a windowed model it grows with depth even though each layer looks only locally." }
  ],
  quiz: [
    { type: "mc", q: "Why does a model with 32 heads cost roughly the same as a model with one head?", opts: ["The heads are computed sequentially and reuse the same buffers", "Most heads are pruned after training", "The head dimension shrinks so that 32 heads of width 128 total the same 4,096 as one full-width head", "Heads share their query, key and value matrices"], a: 2,
      why: "Multi-head attention is a reshape, not a loop. One projection to 4,096 dimensions is reinterpreted as 32 vectors of 128, and the attention arithmetic runs on the last axis. The matrix multiplications are the size they would have been anyway, which is exactly why the idea was practical enough to become universal." },
    { type: "mc", q: "Why is an output projection needed after concatenating the heads?", opts: ["To restore the vector to unit length before it rejoins the residual stream", "Without it each head would own a fixed private slice of the residual stream and no output could depend on two heads at once", "To reduce 32 times 128 dimensions back down to 4,096", "To apply the causal mask across heads"], a: 1,
      why: "Concatenation already gives 4,096 numbers, so the dimensions work out without it. The problem is structural: a bare concatenation permanently assigns head 0 to dimensions 0 to 127, so nothing downstream could combine two heads. The induction circuit needs exactly that combination, since it is built from two heads composing." },
    { type: "mc", q: "Corvid-8B stores 128 KB of KV cache per token. Which change would reduce that the most, for the least quality cost?", opts: ["Halving the number of query heads", "Halving the model's layer count", "Reducing the head dimension from 128 to 64", "Reducing the KV head count from 8 to 4"], a: 3,
      why: "Query head count does not appear in the cache formula at all, so halving it saves nothing while costing expressiveness. Halving layers or head dimension changes the model fundamentally. KV head count is the one term that can be cut with a small, measurable quality cost, which is precisely why grouped-query attention became standard." },
    { type: "mc", q: "On the 16 GB budget with 4-bit weights, Corvid serves 3 full-context requests under MHA and 11 under 4:1 GQA. What changed about the model's expressiveness?", opts: ["Nothing about the query heads; each still has its own query projection and asks its own question", "Each query head now attends to a quarter as many positions", "The model lost three quarters of its attention parameters", "The head dimension was reduced to a quarter"], a: 0,
      why: "All 32 query heads survive with their own W_Q, so each still forms its own question and its own attention distribution. What is shared is the advertisement: four query heads consult one set of keys and values. That is a genuine loss, but a much smaller one than the head count suggests, and the measured trade is what made every major family adopt it." },
    { type: "blank", q: "Storing the keys and values of previous positions during generation, so they are not recomputed at every step, is called the ____ cache.", a: ["kv", "kv cache", "key-value", "key value"],
      why: "It converts generation from quadratic to linear work, and it introduces the memory cost that reshaped attention. In a serving system it is frequently larger than the model weights: 4.29 GB for one 8,192-token request on an 8B model with full multi-head attention." },
    { type: "blank", q: "A two-head circuit that finds an earlier occurrence of the current token and copies whatever followed it is called an ____ head.", a: ["induction", "induction head"],
      why: "It spans two layers: one head writes previous-token information into the residual stream, a second head reads it to find the match. Nobody designed it, and it is the clearest known mechanism behind in-context learning, which means few-shot prompting works partly because gradient descent independently invented a copying circuit." },
    { type: "mc", q: "Evicting the four oldest tokens from a full KV cache collapses quality far more than the lost information explains. Why?", opts: ["Those tokens carry the positional encoding for the whole sequence", "The first tokens contain the system prompt in most deployments", "Cache eviction corrupts the block table", "Heads place large weight on early tokens as somewhere to put mass they do not want to spend, so removing them disturbs every distribution"], a: 3,
      why: "Softmax weights must sum to one, so a head with nothing it wants to attend to still has to put its mass somewhere, and early tokens serve as that sink almost regardless of content. Remove them and every head's distribution is disturbed at once. The fix is to keep the first four tokens permanently and evict from the middle, which is close to free." },
    { type: "order", q: "Order the steps of multi-head attention within one layer:", items: ["project the input once to full width for queries, keys and values", "view each projection as h heads of the head dimension", "run score, scale, mask, softmax and weighted sum per head", "concatenate the head outputs and apply the output projection"],
      why: "Project, reshape, attend, mix. Only the third step is Chapter 5's mechanism; the first, second and fourth are what turn one attention into many without paying for many. Writing it in this order is also what makes the implementation a reshape rather than a loop." },
    { type: "mc", q: "Gemma-2-9B has hidden size 3,584 and 16 heads, but a head dimension of 256 rather than the 224 that division would give. What does that show?", opts: ["Head dimension is an independent choice, not necessarily the hidden size divided by the head count", "The config file contains an error", "Gemma uses multi-query attention", "The model pads its hidden size at runtime"], a: 0,
      why: "Nothing requires head dimension times head count to equal the model dimension; the output projection maps whatever width results back to the residual stream. Decoupling them buys a wider head, which costs more in attention parameters and more cache per KV head, and models make this call deliberately. Reading it off a config is the sort of thing this course exists to make ordinary." },
    { type: "mc", q: "A team wants to serve a long-context summarization product and is considering sliding-window attention to cap cache growth. What is the strongest objection?", opts: ["Sliding windows are incompatible with grouped-query attention", "Windowed models cannot use a KV cache at all", "Summarization genuinely needs to attend to specific distant tokens, which is the case a window breaks", "Attention sinks make windows unnecessary"], a: 2,
      why: "Windows work well when the useful context is local, as in rolling chat history. Summarizing a long document is the opposite: the model must reach specific facts anywhere in the input. Depth extends the effective receptive field, but it does not restore the ability to attend to one exact token 30,000 positions back in a windowed layer. Mistral shipping a window in v0.1 and removing it by v0.3 is evidence about how this trade lands." }
  ]
});

/* ======================= CHAPTER 7 ======================= */
CHAPTERS.push({
  num: 7, part: 2, title: "Position: Order in a Permutation-Blind Machine",
  blurb: "Shuffle the words of a sentence and attention returns the same answer. The mechanism has no idea what order anything came in, so every transformer injects position by hand, and the method chosen decides what happens when the model meets a document longer than anything it was trained on. You will walk the four families in the order the field discovered them, ending at RoPE, which is a rotation applied to pairs of dimensions and far simpler than its reputation. Then the part that pays your bills: how context gets extended, and how to tell whether it worked.",
  sections: [
    { title: "A Mechanism With No Sense of Order",
      html: "<p>Go back to the worked example in Chapter 5 and look for a position index. There is not one. Scores are dot products of projected vectors, the softmax normalizes them, the output is a weighted sum. At no point does the arithmetic consult where a token sits.</p>" +
      "<p>The consequence is exact: permute the input tokens and you get the same set of outputs, permuted the same way. Attention is <strong>permutation-equivariant</strong>. To the mechanism, <em>the cat sat</em> and <em>sat the cat</em> are the same input.</p>" +
      "<p>That is fatal for language, where order carries most of the grammar. <em>The dog bit the man</em> and <em>the man bit the dog</em> contain identical tokens. So every transformer adds positional information deliberately, and the interesting part is that there is no obvious right way to do it. Four families have been tried, each fixing the previous one's failure, and the one that won is the one that made long context possible.</p>" +
      "<div class='callout'><strong>Why this is not obvious.</strong> Recurrent networks never needed a positional scheme, because order was implicit in the order of computation: position 5 was processed after position 4 and that was that. Removing recurrence for the parallelism win in Chapter 5 threw away the free ordering along with it. Positional encoding is the bill for that trade.</div>" },

    { title: "Just Learn a Vector Per Position",
      html: "<p>The most direct fix: keep a second table, with one learned vector per position, and add row <em>i</em> to the token at position <em>i</em> before the first block. This is a <strong>learned absolute position embedding</strong>, and it is what GPT-2 and BERT used.</p>" +
      "<p>It works. It is trivially simple. And it has one failure that ended it, visible in GPT-2's own configuration: <code>n_positions</code> is 1,024. That is not a soft limit or a recommendation. There is no row 1,025 in the table, so a sequence of 1,025 tokens has no representation for its last position. The model cannot be run past its training length at all, and there is no principled way to invent the missing rows.</p>" +
      "<p>The second, subtler problem: the model must learn every position independently. Position 700's vector is trained only by examples that reached position 700, so the far end of the table is trained on the least data, exactly where you would want the most reliability.</p>" },

    { title: "Sinusoids, and a Promise Not Kept",
      html: "<p>The 2017 transformer paper proposed a formula instead of a table. Each position gets a <strong>sinusoidal encoding</strong>: a vector whose dimensions are sines and cosines of the position, evaluated at geometrically spaced frequencies.</p>" +
      "<pre><code>dimension 2i    :  sin( pos / 10000^(2i/d) )\ndimension 2i+1  :  cos( pos / 10000^(2i/d) )</code></pre>" +
      "<p>The exponent is what makes it work. At i = 0 the divisor is 1, so the value oscillates once every few positions. At the far end of the vector the divisor approaches 10,000, so the value barely changes across thousands of positions. Reading the vector top to bottom is like reading a number in a strange base: the fast dimensions give the fine digits, the slow ones the coarse. Two positions far apart differ in the slow dimensions; two adjacent positions differ only in the fast ones. Nothing is learned, so a vector exists for any position you like, including ones never seen in training.</p>" +
      "<p>The argument in the paper was that this ought to extrapolate, and there is a genuinely elegant reason to hope so: because of the angle-addition identities, the encoding of position m+k is a fixed linear function of the encoding of position m, so relative offsets are in principle expressible.</p>" +
      "<p>In practice it did not <strong>extrapolate</strong>. Models trained at 512 tokens degraded badly at 1,024, because although a vector exists for position 1,000, the model never learned what to do with one. Having a representation and having trained on it are different things, and this is the first place in the course where that distinction bites. It will not be the last. Running a model past its training length is called <strong>extrapolation</strong>, and every technique in section 6 exists because naive extrapolation does not work.</p>" +
      "<div class='fig'><svg viewBox='0 0 760 226' xmlns='http://www.w3.org/2000/svg' font-family='Menlo,monospace'>" +
      "<text x='20' y='18' fill='#2de2ff' font-size='11'>four ways to tell a transformer where it is</text>" +
      "<rect x='16' y='30' width='176' height='142' rx='8' fill='#111a2e' stroke='#ff5d73' stroke-width='2'/>" +
      "<text x='104' y='52' text-anchor='middle' fill='#ff5d73' font-size='11'>learned absolute</text>" +
      "<text x='30' y='76' fill='#c9d6ea' font-size='9.5'>a table, one row per</text>" +
      "<text x='30' y='92' fill='#c9d6ea' font-size='9.5'>position, added to input</text>" +
      "<text x='30' y='116' fill='#7d8fb0' font-size='9.5'>GPT-2, BERT</text>" +
      "<text x='30' y='140' fill='#ff5d73' font-size='9.5'>hard cap: no row</text>" +
      "<text x='30' y='156' fill='#ff5d73' font-size='9.5'>beyond training length</text>" +
      "<rect x='200' y='30' width='176' height='142' rx='8' fill='#111a2e' stroke='#ffd166' stroke-width='2'/>" +
      "<text x='288' y='52' text-anchor='middle' fill='#ffd166' font-size='11'>sinusoidal</text>" +
      "<text x='214' y='76' fill='#c9d6ea' font-size='9.5'>a formula, added to</text>" +
      "<text x='214' y='92' fill='#c9d6ea' font-size='9.5'>the input</text>" +
      "<text x='214' y='116' fill='#7d8fb0' font-size='9.5'>the 2017 paper</text>" +
      "<text x='214' y='140' fill='#ffd166' font-size='9.5'>defined everywhere,</text>" +
      "<text x='214' y='156' fill='#ffd166' font-size='9.5'>but does not extrapolate</text>" +
      "<rect x='384' y='30' width='176' height='142' rx='8' fill='#111a2e' stroke='#3ddc97' stroke-width='2.5'/>" +
      "<text x='472' y='52' text-anchor='middle' fill='#3ddc97' font-size='11'>RoPE</text>" +
      "<text x='398' y='76' fill='#c9d6ea' font-size='9.5'>a rotation applied to</text>" +
      "<text x='398' y='92' fill='#c9d6ea' font-size='9.5'>q and k, inside attention</text>" +
      "<text x='398' y='116' fill='#7d8fb0' font-size='9.5'>Llama, Qwen, Mistral,</text>" +
      "<text x='398' y='132' fill='#7d8fb0' font-size='9.5'>Gemma, Corvid</text>" +
      "<text x='398' y='156' fill='#3ddc97' font-size='9.5'>relative by construction</text>" +
      "<rect x='568' y='30' width='176' height='142' rx='8' fill='#111a2e' stroke='#4f7cff' stroke-width='2'/>" +
      "<text x='656' y='52' text-anchor='middle' fill='#4f7cff' font-size='11'>ALiBi</text>" +
      "<text x='582' y='76' fill='#c9d6ea' font-size='9.5'>a distance penalty</text>" +
      "<text x='582' y='92' fill='#c9d6ea' font-size='9.5'>added to the scores</text>" +
      "<text x='582' y='116' fill='#7d8fb0' font-size='9.5'>BLOOM, MPT</text>" +
      "<text x='582' y='140' fill='#4f7cff' font-size='9.5'>extrapolates, at the</text>" +
      "<text x='582' y='156' fill='#4f7cff' font-size='9.5'>cost of a fixed bias</text>" +
      "<line x1='16' y1='188' x2='744' y2='188' stroke='#1c2a45' stroke-width='2'/>" +
      "<text x='16' y='210' fill='#7d8fb0' font-size='10.5'>The first two add position to the input once. The last two act inside attention, on every layer.</text>" +
      "</svg><div class='fig-cap'>Where each family injects position is the design decision. Adding to the input means the information must survive 32 blocks; acting inside attention means it is reapplied at every one.</div></div>" },

    { title: "Rotate Instead of Add", viz: "llmRope", vizTitle: "Drag two positions while keeping the gap fixed; the score does not move",
      html: "<p>Rotary position embedding, published by Jianlin Su and colleagues in 2021, is the method almost every current model uses, and its reputation for difficulty is undeserved. Here is the whole idea.</p>" +
      "<p>Take the query vector at position m. Chop its 128 dimensions into 64 consecutive pairs, and treat each pair as a point in a plane. Now <strong>rotate each pair by an angle proportional to m</strong>. Do the same to every key, by its own position. Then run attention exactly as Chapter 5 described, unchanged.</p>" +
      "<p>Different pairs rotate at different rates. The first pair spins fast, completing a full turn every few positions; the last pair spins so slowly it barely moves across the whole sequence. Fast pairs distinguish neighbours, slow pairs distinguish regions.</p>" +
      "<h3>Why rotation and not addition</h3>" +
      "<p>Here is the property that makes the whole thing work, and it is one line of trigonometry. Rotating a vector by angle A and another by angle B, then taking their dot product, gives the same answer as rotating one by A&#8722;B and leaving the other alone. Rotation preserves lengths and angles, so <strong>the score depends only on the difference of the two positions, never on where either sits absolutely.</strong></p>" +
      "<p>Absolute rotations in, relative distance out. That is the trick, and it is why RoPE is applied to q and k rather than added to the input: it has to be inside the dot product to have this effect.</p>" +
      "<h3>Check it</h3>" +
      "<p>One query, one key, one 2-D pair, rotated to four different pairs of positions that all have a gap of 2, computed on 6 September 2026:</p>" +
      "<pre><code>positions m=    1  n=    3   gap 2   score = -0.815615\npositions m=    5  n=    7   gap 2   score = -0.815615\npositions m=   50  n=   52   gap 2   score = -0.815615\npositions m= 1000  n= 1002   gap 2   score = -0.815615</code></pre>" +
      "<p>Identical to six decimal places, whether the pair sits at the start of the sequence or a thousand tokens in. Change the gap and the score changes: gap 1 gives &#8722;0.033, gap 3 gives &#8722;0.848, gap 8 gives &#8722;0.648. The mechanism sees distance and is blind to absolute location, which is exactly what language needs.</p>" +
      "<div class='fig'><svg viewBox='0 0 760 236' xmlns='http://www.w3.org/2000/svg' font-family='Menlo,monospace'>" +
      "<text x='20' y='18' fill='#2de2ff' font-size='11'>one pair of dimensions, rotated by position</text>" +
      "<line x1='40' y1='150' x2='250' y2='150' stroke='#1c2a45' stroke-width='2'/>" +
      "<line x1='145' y1='45' x2='145' y2='215' stroke='#1c2a45' stroke-width='2'/>" +
      "<line x1='145' y1='150' x2='225' y2='110' stroke='#2de2ff' stroke-width='3'/><polygon points='232,106 219,105 224,116' fill='#2de2ff'/>" +
      "<text x='236' y='104' fill='#2de2ff' font-size='10'>q at m=1</text>" +
      "<line x1='145' y1='150' x2='170' y2='62' stroke='#3ddc97' stroke-width='3'/><polygon points='172,55 163,64 175,67' fill='#3ddc97'/>" +
      "<text x='180' y='58' fill='#3ddc97' font-size='10'>q at m=5</text>" +
      "<path d='M205 130 A 70 70 0 0 0 163 79' fill='none' stroke='#ffd166' stroke-width='1.5' stroke-dasharray='3 3'/>" +
      "<text x='36' y='84' fill='#ffd166' font-size='9.5'>angle = m x theta</text>" +
      "<text x='40' y='196' fill='#7d8fb0' font-size='9.5'>same vector, different position,</text>" +
      "<text x='40' y='212' fill='#7d8fb0' font-size='9.5'>rotated by a multiple of theta</text>" +
      "<line x1='290' y1='40' x2='290' y2='220' stroke='#1c2a45' stroke-width='2'/>" +
      "<text x='316' y='58' fill='#c9d6ea' font-size='10.5'>measured, gap of 2 throughout:</text>" +
      "<text x='336' y='82' fill='#7d8fb0' font-size='10'>m=1, n=3</text><text x='540' y='82' fill='#3ddc97' font-size='10'>-0.815615</text>" +
      "<text x='336' y='102' fill='#7d8fb0' font-size='10'>m=5, n=7</text><text x='540' y='102' fill='#3ddc97' font-size='10'>-0.815615</text>" +
      "<text x='336' y='122' fill='#7d8fb0' font-size='10'>m=50, n=52</text><text x='540' y='122' fill='#3ddc97' font-size='10'>-0.815615</text>" +
      "<text x='336' y='142' fill='#7d8fb0' font-size='10'>m=1000, n=1002</text><text x='540' y='142' fill='#3ddc97' font-size='10'>-0.815615</text>" +
      "<text x='316' y='170' fill='#ffd166' font-size='10.5'>change the gap and it moves:</text>" +
      "<text x='336' y='190' fill='#7d8fb0' font-size='10'>gap 1</text><text x='440' y='190' fill='#ffd166' font-size='10'>-0.033</text>" +
      "<text x='336' y='206' fill='#7d8fb0' font-size='10'>gap 3</text><text x='440' y='206' fill='#ffd166' font-size='10'>-0.848</text>" +
      "<text x='336' y='222' fill='#7d8fb0' font-size='10'>gap 8</text><text x='440' y='222' fill='#ffd166' font-size='10'>-0.648</text>" +
      "</svg><div class='fig-cap'>Absolute rotations go in and relative distance comes out. This is the entire reason RoPE displaced everything before it.</div></div>" +
      "<p>Take the machine and drag both positions while holding the gap fixed. The score will not move. Then change the gap by one and watch it jump. That is the discovery, and it is RoPE in a sentence.</p>" },

    { title: "Penalize Distance Directly",
      html: "<p>One more family, because you will meet it and because it makes a different trade.</p>" +
      "<p><strong>ALiBi</strong>, from Ofir Press and colleagues in 2021, skips encoding position into vectors entirely. It adds a penalty to the attention score itself, proportional to how far apart the two positions are, with a different slope per head. Nearby tokens are penalized little, distant ones a lot. Some heads get a steep slope and stay local, others get a shallow one and see far.</p>" +
      "<p>It is the simplest thing in this chapter and it extrapolates unusually well: a model trained at 1,024 tokens can run at 2,048 with modest degradation, because the penalty formula is defined at any distance and its shape does not change.</p>" +
      "<p>The cost is that the bias is fixed and monotonic. The model cannot learn that for some heads a token 400 back matters more than one 4 back, because the penalty forbids it. RoPE imposes no such shape. That is broadly why the field went to RoPE while ALiBi stayed in specific models such as BLOOM and MPT.</p>" },

    { title: "Making the Window Longer", viz: "llmContextStretch", vizTitle: "Push the target context past the training length, with and without scaling",
      html: "<p>Now the practical part. A model was trained at 8,192 tokens and you want 128,000. RoPE defines a rotation for any position, so nothing crashes. But the model has never seen a rotation angle that large, and at positions past training length the slow-rotating pairs enter angular territory that is, to the model, meaningless. Quality does not degrade gently. It falls off a cliff.</p>" +
      "<p>Three techniques fix it, and they are all variations on one idea: make position 100,000 <em>look like</em> a position the model was trained on.</p>" +
      "<p><strong>Position interpolation</strong>, from Shouyuan Chen and colleagues in 2023, is the blunt version. Divide every position index by a factor. To go from 8,192 to 32,768, divide by 4, so position 32,000 is presented as position 8,000. Every angle now lands in familiar range. The cost is resolution: adjacent tokens are now a quarter of a step apart instead of a full one, so the fast pairs that distinguished neighbours are squeezed, and fine local detail blurs. A short fine-tune usually recovers most of it.</p>" +
      "<p><strong>NTK-aware scaling</strong> observes that treating all frequencies the same is wasteful. The fast pairs were never the problem, because their angles wrap around constantly and the model has seen every value. Only the slow pairs run off the end. So interpolate the slow ones and leave the fast ones alone. In practice this is done by raising the base frequency rather than by dividing positions, and it often works with no fine-tuning at all.</p>" +
      "<p><strong>YaRN</strong>, from Bowen Peng and colleagues in 2023, combines the two with a temperature correction on attention, and is the method most current long-context releases use.</p>" +
      "<h3>Read it in a config</h3>" +
      "<p>This is not theory you will only encounter in papers. Llama-3.2-1B ships with exactly this, and you can read it:</p>" +
      "<pre><code>\"rope_theta\": 500000.0,\n\"max_position_embeddings\": 131072,\n\"rope_scaling\": {\n    \"rope_type\": \"llama3\",\n    \"factor\": 32.0,\n    \"original_max_position_embeddings\": 8192,\n    \"low_freq_factor\": 1.0,\n    \"high_freq_factor\": 4.0\n}</code></pre>" +
      "<p>Every field is now readable. The model was really trained at 8,192. A factor of 32 takes it to 131,072. And <code>low_freq_factor</code> and <code>high_freq_factor</code> differ, which is the NTK-aware idea in the file: the slow frequencies are scaled differently from the fast ones.</p>" +
      "<p>The base frequency itself is the other lever, and it is why <code>rope_theta</code> varies so much between models. Measured wavelengths for the slowest pair at head dimension 128:</p>" +
      "<pre><code>rope_theta       fastest pair      slowest pair (wavelength in tokens)\n    10,000                  6                                54,410\n   500,000                  6                             2,559,196</code></pre>" +
      "<p>Raising theta from 10,000 to 500,000 leaves the fast pairs untouched and stretches the slowest pair's wavelength by a factor of 47. The slowest pair must complete less than one turn across your whole context, or distant positions start aliasing onto each other. That single requirement is why Llama 3 uses 500,000 where Llama 2 used 10,000, and why Qwen and Mistral use 1,000,000.</p>" +
      "<div class='fig'><svg viewBox='0 0 760 200' xmlns='http://www.w3.org/2000/svg' font-family='Menlo,monospace'>" +
      "<text x='20' y='18' fill='#2de2ff' font-size='11'>why rope_theta grew: the slowest pair must outlast your context</text>" +
      "<text x='20' y='48' fill='#7d8fb0' font-size='10'>theta = 10,000</text>" +
      "<rect x='150' y='36' width='11' height='16' rx='3' fill='#3ddc97'/><text x='172' y='49' fill='#7d8fb0' font-size='9.5'>fastest pair: 6 tokens</text>" +
      "<rect x='150' y='58' width='115' height='16' rx='3' fill='#ffd166'/><text x='278' y='71' fill='#ffd166' font-size='9.5'>slowest pair: 54,410 tokens</text>" +
      "<text x='20' y='108' fill='#7d8fb0' font-size='10'>theta = 500,000</text>" +
      "<rect x='150' y='96' width='11' height='16' rx='3' fill='#3ddc97'/><text x='172' y='109' fill='#7d8fb0' font-size='9.5'>fastest pair: 6 tokens (unchanged)</text>" +
      "<rect x='150' y='118' width='460' height='16' rx='3' fill='#2de2ff'/><text x='622' y='131' fill='#2de2ff' font-size='9.5'>2,559,196 tokens</text>" +
      "<line x1='20' y1='152' x2='740' y2='152' stroke='#1c2a45' stroke-width='2'/>" +
      "<text x='20' y='174' fill='#c9d6ea' font-size='10.5'>Raising theta stretches only the slow end. Llama 3 uses 500,000; Qwen and Mistral use 1,000,000.</text>" +
      "<text x='20' y='192' fill='#7d8fb0' font-size='10'>Measured at head dimension 128 on 2026-09-06.</text>" +
      "</svg><div class='fig-cap'>A config field with a reason. If the slowest pair turns more than once across your context, distant positions become indistinguishable.</div></div>" },

    { title: "Does the Long Context Work?", viz: "llmNeedle", vizTitle: "Move the needle's depth and find where recall drops",
      html: "<p>A model advertising 128,000 tokens has made a claim about a config field. Whether it can <em>use</em> those tokens is a separate question, and the gap between the two is where a lot of disappointment lives.</p>" +
      "<p><strong>Needle in a haystack</strong>, popularized by Greg Kamradt in 2023, is the standard first test: hide one specific fact at a known depth in a long document, ask for it, and vary both the document length and the depth. The result is a heatmap, and a healthy model is green everywhere.</p>" +
      "<p>It is a floor, not a ceiling. Finding one verbatim sentence is close to keyword matching, and a model can pass it convincingly while being unable to do anything harder with the same context.</p>" +
      "<p><strong>Lost in the middle</strong> is the classic failure it does reveal. Nelson Liu and colleagues showed in 2023 that accuracy is highest when the relevant information sits at the beginning or the end of the context and sags in the middle, producing a U-shaped curve. If you are packing retrieved documents into a prompt, that is an ordering decision with a measurable consequence, and it is the point where this chapter touches <em>RAG In Depth</em>.</p>" +
      "<p><strong>RULER</strong>, from Cheng-Ping Hsieh and colleagues in 2024, is the harder test: multiple needles, needles that require aggregation, variable tracking, and questions whose answer is not a span you can copy. Its finding is the one to carry away. Models that pass needle retrieval at their full advertised length routinely fail RULER at a fraction of it, so the honest usable context is often far below the number on the box.</p>" +
      "<div class='fig'><svg viewBox='0 0 760 216' xmlns='http://www.w3.org/2000/svg' font-family='Menlo,monospace'>" +
      "<text x='20' y='18' fill='#2de2ff' font-size='11'>retrieval accuracy by needle depth (the shape to expect)</text>" +
      "<text x='20' y='44' fill='#7d8fb0' font-size='10'>start</text>" +
      "<rect x='90' y='32' width='420' height='16' rx='3' fill='#3ddc97'/><text x='524' y='45' fill='#3ddc97' font-size='10'>reliable</text>" +
      "<text x='20' y='76' fill='#7d8fb0' font-size='10'>25%</text>" +
      "<rect x='90' y='64' width='340' height='16' rx='3' fill='#3ddc97'/><text x='524' y='77' fill='#7d8fb0' font-size='10'>still good</text>" +
      "<text x='20' y='108' fill='#7d8fb0' font-size='10'>50%</text>" +
      "<rect x='90' y='96' width='190' height='16' rx='3' fill='#ff5d73'/><text x='524' y='109' fill='#ff5d73' font-size='10'>the sag: lost in the middle</text>" +
      "<text x='20' y='140' fill='#7d8fb0' font-size='10'>75%</text>" +
      "<rect x='90' y='128' width='330' height='16' rx='3' fill='#3ddc97'/><text x='524' y='141' fill='#7d8fb0' font-size='10'>recovering</text>" +
      "<text x='20' y='172' fill='#7d8fb0' font-size='10'>end</text>" +
      "<rect x='90' y='160' width='440' height='16' rx='3' fill='#3ddc97'/><text x='546' y='173' fill='#3ddc97' font-size='10'>most reliable</text>" +
      "<text x='20' y='202' fill='#c9d6ea' font-size='10.5'>If you pack retrieved documents into a prompt, order them with this curve in mind.</text>" +
      "</svg><div class='fig-cap'>The U shape is robust across models. Passing this test is a floor; RULER asks the questions that actually separate them.</div></div>" +
      "<p>Use the needle machine, sweep the depth, and find the band where recall drops. Note the number. Then remember that a model passing this at 128,000 tokens has demonstrated it can find a sentence, not that it can reason over a book.</p>" +
      "<div class='callout'><strong>Interview lens.</strong> &#8220;How would you extend a model's context from 8K to 128K?&#8221; The expected shape: RoPE defines rotations at any position, so nothing breaks mechanically, but the model has never seen those angles, so quality collapses; interpolate positions or raise the base frequency so the angles fall in trained range, ideally scaling low and high frequencies differently; fine-tune briefly to recover local resolution; then verify with something harder than needle retrieval, because needle-in-a-haystack passes long before the context is genuinely usable.</div>" },

    { title: "Exercises",
      html: "<ol>" +
      "<li><strong>Trace.</strong> Take the 2-D vectors q = (0.8, 0.6) and k = (0.3, 0.9) and a rotation angle of 1 radian per position. Rotate q to position 2 and k to position 5, then compute their dot product. Now rotate q to position 12 and k to position 15 and compute again. The two answers should match. Then do position 2 and position 6 and confirm it differs. You have just reproduced section 4's measurement by hand.</li>" +
      "<li><strong>Trace.</strong> A model trained at 4,096 tokens is extended to 32,768 by position interpolation. State the scaling factor, state what position index 30,000 is presented to the model as, and describe in one sentence what happens to the model's ability to distinguish two adjacent tokens. Then say why NTK-aware scaling is designed to avoid that particular cost.</li>" +
      "<li><strong>Investigate.</strong> Open the configs of three models with different advertised context lengths. Record <code>rope_theta</code>, <code>max_position_embeddings</code> and any <code>rope_scaling</code> block. For each, work out whether the long context was trained natively or extended after the fact, and say which field told you. At least one will have been extended, and its config says so plainly once you can read it.</li>" +
      "<li><strong>Investigate.</strong> Find a published needle-in-a-haystack chart and a RULER score for the same model. Compare the length at which needle retrieval stays green with the length at which RULER holds up. Write down both numbers and the ratio. That ratio is the gap between the context a model advertises and the context you can rely on.</li>" +
      "<li><strong>Build.</strong> Write a RoPE implementation in about twenty lines: given a tensor of shape (positions, head_dim) and a base frequency, split the last axis into pairs, compute the angle for each pair and position, and rotate. Assert the relative-distance property directly, that the dot product of a rotated query and a rotated key depends only on the difference of positions, by testing several pairs with equal gaps. Then vary the base frequency and print the wavelength of the slowest pair, checking it against the table in section 6. This is the code Chapter 38 drops into PocketLM to replace learned positions.</li>" +
      "</ol>" }
  ],
  terms: [
    { t: "permutation-equivariant", d: "The property that permuting the input permutes the output identically and changes nothing else; true of attention, and the reason position must be injected." },
    { t: "positional encoding", d: "Any scheme that tells a transformer where each token sits, since the attention mechanism itself has no notion of order." },
    { t: "learned absolute position embedding", d: "A second lookup table with one trained vector per position, added to the input; simple, and hard-capped at the training length." },
    { t: "sinusoidal encoding", d: "Position vectors built from sines and cosines at geometrically spaced frequencies, defined at any position but poor at extrapolating." },
    { t: "RoPE", d: "Rotary position embedding: rotating each pair of dimensions of the query and key by an angle proportional to position, so scores depend only on relative distance." },
    { t: "base frequency", d: "The rope_theta value that sets how fast each pair rotates; raising it stretches the slowest pair's wavelength and is one way to support longer context." },
    { t: "wavelength", d: "How many positions a given rotary pair takes to complete one full turn; the slowest pair's wavelength must exceed the context length." },
    { t: "ALiBi", d: "Attention with linear biases: a per-head penalty added directly to attention scores in proportion to distance, which extrapolates well but fixes the shape of the bias." },
    { t: "extrapolation", d: "Running a model at sequence lengths longer than it was trained on; having a representation for a position is not the same as having trained on it." },
    { t: "position interpolation", d: "Dividing position indices by a factor so that long positions map into the range the model was trained on, at the cost of local resolution." },
    { t: "NTK-aware scaling", d: "Scaling low and high rotary frequencies differently, on the grounds that only the slow pairs run past trained territory." },
    { t: "YaRN", d: "A method combining interpolation and frequency-aware scaling with an attention temperature correction; common in current long-context releases." },
    { t: "needle in a haystack", d: "A test that hides one fact at a known depth in a long document and asks for it; a floor for long-context ability, not a ceiling." },
    { t: "lost in the middle", d: "The measured U-shaped curve in which accuracy is highest for information at the start or end of a context and sags in the middle." },
    { t: "RULER", d: "A harder long-context benchmark using multiple needles, aggregation and variable tracking; models routinely fail it well below their advertised length." }
  ],
  quiz: [
    { type: "mc", q: "Why does a transformer need a positional encoding at all, when a recurrent network did not?", opts: ["Transformers process longer sequences, where order matters more", "Recurrence made order implicit in the order of computation; removing it for parallelism removed the ordering too", "The softmax destroys positional information", "Token embeddings are shared across positions"], a: 1,
      why: "In a recurrent network position 5 was processed after position 4, so order came free from the computation itself. Chapter 5 removed recurrence to gain parallelism, and positional encoding is the bill for that trade. Nothing in score, scale, softmax or weighted sum refers to an index." },
    { type: "mc", q: "GPT-2's config sets n_positions to 1,024. What does that number represent?", opts: ["A recommended maximum beyond which quality degrades", "The size of its KV cache in tokens", "The longest document in its training corpus", "The number of rows in its learned position table, past which no representation exists"], a: 3,
      why: "It is a hard structural limit, not a guideline. A learned absolute scheme stores one trained vector per position, so there is simply no row 1,025 and no principled way to invent one. This is the failure that ended the approach, and it is why later families compute position from a formula instead of storing it." },
    { type: "mc", q: "RoPE rotates queries and keys by angles proportional to their absolute positions. Why does the resulting score depend only on relative distance?", opts: ["The rotations are small enough that absolute position cancels approximately", "The softmax normalizes absolute position away", "Rotating one vector by A and another by B gives the same dot product as rotating one by A minus B, since rotation preserves lengths and angles", "The model learns to ignore absolute position during training"], a: 2,
      why: "It is exact, not approximate, and it is a property of rotation rather than something learned. Measured: a query and key with a gap of 2 give a score of -0.815615 at positions 1 and 3, at 5 and 7, at 50 and 52, and at 1000 and 1002. Absolute rotations go in and relative distance comes out, which is why RoPE is applied inside the dot product rather than added to the input." },
    { type: "mc", q: "A model trained at 8,192 tokens is run at 100,000 with no modification. RoPE defines a rotation for every position, so why does quality collapse?", opts: ["The model has never been trained on angles in that range, and having a representation is not the same as having learned to use one", "The KV cache runs out of memory first", "The rotation angles overflow in floating point", "The causal mask breaks past the training length"], a: 0,
      why: "Nothing crashes; the formula is defined everywhere. The slow-rotating pairs simply enter angular territory the model never saw during training, so it has no learned behaviour for it. This is the same distinction that defeated sinusoidal extrapolation in 2017: a representation existing and a model knowing what to do with it are different things." },
    { type: "blank", q: "Dividing position indices by a factor so long positions land in the range the model was trained on is called position ____.", a: ["interpolation"],
      why: "To reach 32,768 from 8,192 you divide by 4, so position 32,000 is presented as 8,000. Every angle falls back into familiar range. The cost is local resolution: adjacent tokens are now a quarter of a step apart, so the fast pairs that distinguished neighbours get squeezed. A short fine-tune usually recovers most of it." },
    { type: "blank", q: "The measured U-shaped curve where accuracy is highest at the start and end of a long context and sags in the middle is called lost in the ____.", a: ["middle"],
      why: "Documented by Liu and colleagues in 2023 and robust across models. It is directly actionable: if you are packing retrieved documents into a prompt, their order is a decision with a measurable effect on whether the model uses them, which is where this chapter touches RAG In Depth." },
    { type: "mc", q: "Llama 3 uses rope_theta 500,000 where Llama 2 used 10,000. What does raising the base frequency do?", opts: ["It makes all pairs rotate more slowly, uniformly", "It stretches the slowest pair's wavelength, leaving the fast pairs unchanged", "It increases the number of rotary pairs", "It reduces the KV cache size"], a: 1,
      why: "Measured at head dimension 128, the fastest pair's wavelength stays at about 6 tokens under both, while the slowest pair goes from 54,410 tokens to 2,559,196. The requirement is that the slowest pair complete less than one turn across your whole context, or distant positions begin aliasing onto each other. That single constraint explains why theta grew as contexts did." },
    { type: "order", q: "Order these positional schemes by when the field adopted them:", items: ["learned absolute position tables", "sinusoidal encodings", "ALiBi and relative bias schemes", "rotary embeddings with frequency-aware context extension"],
      why: "Each fixed the previous one's failure. Tables hard-capped at training length; sinusoids were defined everywhere but did not extrapolate; ALiBi extrapolated but froze the shape of the bias; RoPE gave relative distance with no imposed shape, and then interpolation and NTK-aware scaling let it stretch. Reading the sequence as a chain of fixes is how the design space makes sense." },
    { type: "mc", q: "A vendor advertises a 128K context. Their needle-in-a-haystack chart is green throughout. What have they demonstrated?", opts: ["That the model can reason over 128K tokens of input", "That the model's rope_scaling is correctly configured", "That the model will not degrade on summarization at that length", "That the model can locate one verbatim fact in 128K tokens, which is close to keyword matching"], a: 3,
      why: "Needle retrieval is a floor. Finding one planted sentence is a much easier task than aggregating across the context, tracking a variable through it, or answering something with no copyable span. RULER tests those, and models that stay green on needles at their full advertised length routinely fail RULER at a fraction of it." },
    { type: "mc", q: "What does ALiBi trade away in exchange for its good extrapolation?", opts: ["The ability to use a KV cache", "Compatibility with multi-head attention", "The model's freedom to decide that a distant token matters more than a nearby one, since the penalty is fixed and monotonic", "Support for causal masking"], a: 2,
      why: "ALiBi adds a fixed distance penalty to the scores, with a different slope per head. That shape is imposed rather than learned, so a head cannot conclude that a token 400 positions back deserves more weight than one 4 back. RoPE imposes no such shape, which is broadly why the field moved to it while ALiBi remained in specific models such as BLOOM and MPT." }
  ]
});

/* ======================= CHAPTER 8 ======================= */
CHAPTERS.push({
  num: 8, part: 2, title: "The Block: Residual Stream, Norms, and the Feed-Forward",
  blurb: "Attention is half a block. The other half is a two-layer network applied to every position independently, and it holds four fifths of the parameters. Around both sits the residual stream, the running vector each sub-layer reads, modifies and writes back. You will assemble the whole block, then work through the three choices that separate a 2017 transformer from a 2026 one: where the normalization goes, which normalization it is, and which activation the feed-forward uses. Each was a real experiment with a real result, and each is a one-line change you will make in the capstone.",
  sections: [
    { title: "The Stream Everything Writes To", viz: "llmBlock", vizTitle: "Follow one vector through the block; then remove the residual connections",
      html: "<p>Chapter 4 introduced the residual stream in a paragraph. It earns a section here, because it is the object every other mechanism in this course operates on.</p>" +
      "<p>A sub-layer does not transform its input into its output. It computes something <em>from</em> its input and adds it back:</p>" +
      "<pre><code>x = x + attention(x)\nx = x + feedforward(x)</code></pre>" +
      "<p>Two lines. That is a transformer block, and everything else is detail about what goes inside those two functions. Because the operation is addition rather than replacement, the vector arriving at layer 32 is the original embedding plus 64 contributions, each written by a sub-layer that chose to write it.</p>" +
      "<h3>Why addition and not replacement</h3>" +
      "<p>The naive design replaces: each layer's output is the next layer's input, full stop. Stack 32 of those and training fails, for a reason that is easiest to see from the gradient's point of view.</p>" +
      "<p>Backpropagation multiplies gradients layer by layer on the way down. Thirty-two multiplications by numbers slightly below one drives the gradient to nothing before it reaches layer 1, so the early layers receive almost no signal and never learn. Slightly above one and it explodes instead. Getting 32 layers to sit exactly on the knife edge is not something you can arrange.</p>" +
      "<p>The residual connection changes the arithmetic. Because the output is <code>x + f(x)</code>, the derivative with respect to x is <code>1 + f'(x)</code>. There is now a path of constant 1 running from the loss all the way to the embedding, with each sub-layer's contribution added alongside rather than multiplied through. The gradient reaching layer 1 is undiminished by depth.</p>" +
      "<p>This is Kaiming He and colleagues' 2015 result, invented for image networks and inherited by transformers wholesale. It is the reason deep stacks are trainable at all, and it is why residual connections are the one component in this chapter that has never been revised.</p>" +
      "<h3>What the framing buys you</h3>" +
      "<p>Once you see the stream as a shared channel rather than a value being transformed, several later chapters stop being surprising.</p>" +
      "<ul>" +
      "<li>The width is constant, 4,096 for Corvid, from embedding to final layer. Nothing expands or contracts, because every sub-layer must write back into the same channel.</li>" +
      "<li>Sub-layers communicate by writing to it and reading from it, which is how the two-head induction circuit in Chapter 6 works across layers.</li>" +
      "<li>The stream at layer 20 is a partial answer, and can be projected into vocabulary space to see what the model believes so far. That is Chapter 11.</li>" +
      "<li>The final vector is the accumulated sum, and multiplying it by the output projection gives Chapter 1's distribution.</li>" +
      "</ul>" +
      "<div class='fig'><svg viewBox='0 0 760 218' xmlns='http://www.w3.org/2000/svg' font-family='Menlo,monospace'>" +
      "<text x='20' y='18' fill='#2de2ff' font-size='11'>replacement versus addition, seen by the gradient</text>" +
      "<text x='30' y='44' fill='#ff5d73' font-size='10.5'>replace: x = f(x)</text>" +
      "<rect x='30' y='54' width='60' height='22' rx='5' fill='#111a2e' stroke='#ff5d73' stroke-width='2'/><text x='60' y='69' text-anchor='middle' fill='#ff5d73' font-size='9.5'>layer 1</text>" +
      "<rect x='100' y='54' width='60' height='22' rx='5' fill='#111a2e' stroke='#ff5d73' stroke-width='2'/><text x='130' y='69' text-anchor='middle' fill='#ff5d73' font-size='9.5'>layer 2</text>" +
      "<text x='168' y='69' fill='#7d8fb0' font-size='9.5'>...</text>" +
      "<rect x='196' y='54' width='68' height='22' rx='5' fill='#111a2e' stroke='#ff5d73' stroke-width='2'/><text x='230' y='69' text-anchor='middle' fill='#ff5d73' font-size='9.5'>layer 32</text>" +
      "<text x='30' y='98' fill='#7d8fb0' font-size='9.5'>gradient multiplies through all 32:</text>" +
      "<text x='30' y='114' fill='#ff5d73' font-size='9.5'>0.9^32 = 0.034, and layer 1 learns nothing</text>" +
      "<text x='400' y='44' fill='#3ddc97' font-size='10.5'>add: x = x + f(x)</text>" +
      "<line x1='400' y1='65' x2='700' y2='65' stroke='#3ddc97' stroke-width='4'/>" +
      "<rect x='420' y='54' width='60' height='22' rx='5' fill='#111a2e' stroke='#4f7cff' stroke-width='2'/><text x='450' y='69' text-anchor='middle' fill='#c9d6ea' font-size='9.5'>f</text>" +
      "<rect x='500' y='54' width='60' height='22' rx='5' fill='#111a2e' stroke='#4f7cff' stroke-width='2'/><text x='530' y='69' text-anchor='middle' fill='#c9d6ea' font-size='9.5'>f</text>" +
      "<rect x='600' y='54' width='60' height='22' rx='5' fill='#111a2e' stroke='#4f7cff' stroke-width='2'/><text x='630' y='69' text-anchor='middle' fill='#c9d6ea' font-size='9.5'>f</text>" +
      "<text x='400' y='98' fill='#7d8fb0' font-size='9.5'>derivative is 1 + f'(x): a path of constant 1</text>" +
      "<text x='400' y='114' fill='#3ddc97' font-size='9.5'>runs from the loss to the embedding, undiminished</text>" +
      "<line x1='20' y1='134' x2='740' y2='134' stroke='#1c2a45' stroke-width='2'/>" +
      "<text x='20' y='158' fill='#c9d6ea' font-size='10.5'>The green line is the residual stream. Sub-layers write onto it; they do not replace it.</text>" +
      "<text x='20' y='180' fill='#c9d6ea' font-size='10.5'>Its width is constant at 4,096 the whole way up, because every sub-layer writes back to the same channel.</text>" +
      "<text x='20' y='204' fill='#7d8fb0' font-size='10'>He et al. 2015, invented for image networks. It is the one component in this chapter nobody has revised.</text>" +
      "</svg><div class='fig-cap'>Why 32 layers train at all. Take the green line away and the gradient dies before it reaches the bottom.</div></div>" +
      "<p>Use the machine and follow one vector up the block, watching its norm grow as contributions accumulate. Then switch the residual connections off and look at the gradient magnitude at layer 1. It falls to roughly nothing, which is the whole argument in one control.</p>" },

    { title: "The Other Half of the Block",
      html: "<p>Attention moves information <em>between</em> positions. Something has to process the information once it arrives, and that is the <strong>feed-forward network</strong>: a two-layer perceptron applied to each position independently, with no communication between positions at all.</p>" +
      "<pre><code>h = activation( x W_up )     # 4,096 -> 14,336\ny =             h W_down      # 14,336 -> 4,096</code></pre>" +
      "<p>Widen, apply a non-linearity, narrow back. That is the whole thing, and it is the same computation at every position, which is why it parallelizes perfectly.</p>" +
      "<p>Two questions follow immediately.</p>" +
      "<p><strong>Why widen at all?</strong> Without the expansion the two matrices would collapse: a linear map followed by a linear map is a linear map, so the non-linearity is doing the work, and it needs room. The wider intermediate gives the layer somewhere to compute in. The 2017 paper used four times the model dimension, and that <strong>expansion ratio</strong> stuck for years.</p>" +
      "<p><strong>Why is it so large?</strong> Count Corvid's block:</p>" +
      "<pre><code>attention (4 matrices, with GQA)     41,943,040   19.2%\nfeed-forward (3 matrices)           176,160,768   80.8%\nthe two norms                             8,192   0.004%\n                                    -----------\nper block                           218,112,000\nx 32 layers                       6,979,584,000</code></pre>" +
      "<p>The feed-forward network is <strong>four fifths of every block</strong>. Attention gets the attention, and the FFN gets the parameters. That single fact explains why mixture-of-experts in Chapter 10 replaces the FFN and not the attention, and why quantization in Chapter 29 cares most about these three matrices.</p>" +
      "<p>The norms, meanwhile, are 0.004% of the block. Everything in sections 4 through 6 concerns components that are numerically free and decide whether the model trains at all.</p>" +
      "<div class='callout'><strong>What is it doing?</strong> The honest answer is that this is less well understood than attention. The most useful working picture, from the interpretability literature, is a key-value memory: the up-projection's rows act as pattern detectors that fire on particular inputs, and the down-projection's columns are what gets written to the residual stream when they do. Chapter 11 makes this concrete. Treat it as a hypothesis with evidence, not a settled fact.</div>" },

    { title: "Gates, and the Rule That Stopped Applying", viz: "llmActivations", vizTitle: "Compare activations at matched parameter counts",
      html: "<p>The non-linearity has been revised twice, and the second revision changed the shape of the network.</p>" +
      "<p><strong>ReLU</strong> zeroes negatives and passes positives. Cheap, and it has a dead zone: a unit whose input is always negative receives zero gradient forever.</p>" +
      "<p><strong>GELU</strong>, from Dan Hendrycks and Kevin Gimpel in 2016, softens the corner: instead of a hard cut at zero it scales each input by roughly the probability that a standard normal falls below it. Small negatives pass through slightly rather than being annihilated, so there is no dead zone. GPT-2, BERT and GPT-3 use it, and Gemma-2 still does.</p>" +
      "<p><strong>SwiGLU</strong>, from Noam Shazeer in 2020, is a different shape rather than a different curve. It adds a third matrix and multiplies two projections together:</p>" +
      "<pre><code>y = ( silu(x W_gate) * (x W_up) ) W_down</code></pre>" +
      "<p>One branch is a <strong>gate</strong>: its output multiplies the other branch elementwise, so the network can learn to suppress a dimension based on the input rather than by a fixed curve. That multiplicative interaction is what a plain activation cannot express.</p>" +
      "<h3>The correction, and why it matters</h3>" +
      "<p>Three matrices instead of two means 50% more parameters at the same width, so a naive comparison of SwiGLU against GELU is not a comparison of activations, it is a comparison of a larger network against a smaller one. Shazeer's paper handles this by shrinking the intermediate width to two thirds, making the parameter counts equal.</p>" +
      "<p>Check the arithmetic on Corvid's dimension. A two-matrix FFN at 4&#215; costs 2 &#215; 4,096 &#215; 16,384 = 134,217,728 parameters. Matching that with three matrices needs an intermediate of 134,217,728 &#247; (3 &#215; 4,096) = 10,923, which is 2.667&#215; the model dimension. Four times two thirds. That is where the rule comes from, and with it the comparison is fair: SwiGLU wins on equal parameters, which is the result that made it standard.</p>" +
      "<h3>And then the field stopped following it</h3>" +
      "<p>Here is where a textbook would stop and a config file disagrees. Feed-forward ratios read from real models on 6 September 2026:</p>" +
      "<pre><code>model                hidden    FFN     ratio   activation\nGPT-2                   768   3,072   4.000x  GELU\nLlama-2-7B            4,096  11,008   2.688x  SwiGLU\nLlama-3-8B            4,096  14,336   3.500x  SwiGLU\nMistral-7B-v0.3       4,096  14,336   3.500x  SwiGLU\nGemma-2-9B            3,584  14,336   4.000x  GELU\nQwen2.5-7B            3,584  18,944   5.286x  SwiGLU</code></pre>" +
      "<p>Llama-2 sits at 2.688&#215;, which is the two-thirds rule almost exactly. Llama-3 abandoned it for 3.5&#215;. Qwen2.5 went to 5.286&#215;, nearly double the rule. Gemma-2 kept 4&#215; and kept GELU.</p>" +
      "<p>The two-thirds correction was a device for making a fair experimental comparison, not a law about how wide an FFN should be. Once SwiGLU had won that comparison, teams went back to choosing the width from their own scaling experiments, and they did not agree. If you carry one thing from this section, carry that distinction: the rule tells you how to run the ablation, not how to build the model.</p>" +
      "<div class='fig'><svg viewBox='0 0 760 226' xmlns='http://www.w3.org/2000/svg' font-family='Menlo,monospace'>" +
      "<text x='20' y='18' fill='#2de2ff' font-size='11'>feed-forward width as a multiple of model dimension (measured 2026-09-06)</text>" +
      "<line x1='230' y1='30' x2='230' y2='176' stroke='#ffd166' stroke-width='2' stroke-dasharray='4 4'/>" +
      "<text x='166' y='196' fill='#ffd166' font-size='9.5'>2.667x: the rule</text>" +
      "<line x1='394' y1='30' x2='394' y2='176' stroke='#7d8fb0' stroke-width='1.5' stroke-dasharray='3 4'/>" +
      "<text x='356' y='196' fill='#7d8fb0' font-size='9.5'>4.0x: the 2017 default</text>" +
      "<text x='20' y='48' fill='#7d8fb0' font-size='10'>GPT-2</text>" +
      "<rect x='150' y='36' width='244' height='14' rx='3' fill='#4f7cff'/><text x='404' y='48' fill='#7d8fb0' font-size='9.5'>4.000x  GELU</text>" +
      "<text x='20' y='76' fill='#7d8fb0' font-size='10'>Llama-2-7B</text>" +
      "<rect x='150' y='64' width='82' height='14' rx='3' fill='#ffd166'/><text x='404' y='76' fill='#ffd166' font-size='9.5'>2.688x  SwiGLU, on the rule</text>" +
      "<text x='20' y='104' fill='#7d8fb0' font-size='10'>Llama-3-8B</text>" +
      "<rect x='150' y='92' width='188' height='14' rx='3' fill='#3ddc97'/><text x='404' y='104' fill='#3ddc97' font-size='9.5'>3.500x  SwiGLU</text>" +
      "<text x='20' y='132' fill='#7d8fb0' font-size='10'>Gemma-2-9B</text>" +
      "<rect x='150' y='120' width='244' height='14' rx='3' fill='#4f7cff'/><text x='404' y='132' fill='#7d8fb0' font-size='9.5'>4.000x  GELU</text>" +
      "<text x='20' y='160' fill='#7d8fb0' font-size='10'>Qwen2.5-7B</text>" +
      "<rect x='150' y='148' width='330' height='14' rx='3' fill='#ff5d73'/><text x='492' y='160' fill='#ff5d73' font-size='9.5'>5.286x  SwiGLU</text>" +
      "<text x='20' y='218' fill='#c9d6ea' font-size='10.5'>The two-thirds rule made the ablation fair. It was never a rule about how wide to build.</text>" +
      "</svg><div class='fig-cap'>Only Llama-2 sits on the textbook ratio. Everything since chose its own width from its own scaling runs, and they disagree by a factor of two.</div></div>" },

    { title: "Normalizing, and Then Normalizing Less",
      html: "<p>Activations drift. Some dimensions grow large, others shrink, and a layer whose inputs vary wildly in scale trains badly. Normalization fixes the scale, and which fix you choose is one of the three things that changed since 2017.</p>" +
      "<p><strong>LayerNorm</strong>, from Jimmy Lei Ba and colleagues in 2016, works across the features of a single position. For each position it computes the mean and the variance of that position's 4,096 numbers, subtracts the mean, divides by the standard deviation, then applies a learned scale and a learned shift:</p>" +
      "<pre><code>y = ( (x - mean(x)) / sqrt(var(x) + eps) ) * gain + bias</code></pre>" +
      "<p>Note what it does not do: it never looks at other positions or other examples in the batch. That independence is the point. Batch normalization, the older alternative, computes statistics across the batch, which makes the result depend on which other sequences happened to be batched together, and breaks entirely at batch size one. For sequence models with variable lengths, LayerNorm is the only sensible member of the family.</p>" +
      "<p><strong>RMSNorm</strong>, from Biao Zhang and Rico Sennrich in 2019, asks whether the mean subtraction was doing anything. Their answer, empirically, was no. So it drops the mean and the bias entirely and rescales by the root mean square alone:</p>" +
      "<pre><code>y = ( x / sqrt(mean(x^2) + eps) ) * gain</code></pre>" +
      "<p>One pass over the vector instead of two, no subtraction, no bias to store. It is a few percent of end-to-end training time, which sounds trivial until you multiply it by 64 sub-layers and a training run measured in months. Quality was unchanged in their experiments and in everyone else's since.</p>" +
      "<p>The verdict is unusually clean, and the config table from the last section shows it: every model in it except GPT-2 uses RMSNorm. This is the rare case where the field simply agreed.</p>" +
      "<div class='fig'><svg viewBox='0 0 760 196' xmlns='http://www.w3.org/2000/svg' font-family='Menlo,monospace'>" +
      "<text x='20' y='18' fill='#2de2ff' font-size='11'>two normalizations over one position's 4,096 numbers</text>" +
      "<rect x='16' y='30' width='356' height='134' rx='8' fill='#111a2e' stroke='#7d8fb0' stroke-width='2'/>" +
      "<text x='194' y='52' text-anchor='middle' fill='#7d8fb0' font-size='11'>LayerNorm (2016)</text>" +
      "<text x='34' y='78' fill='#c9d6ea' font-size='10'>1. compute the mean</text>" +
      "<text x='34' y='96' fill='#c9d6ea' font-size='10'>2. subtract it</text>" +
      "<text x='34' y='114' fill='#c9d6ea' font-size='10'>3. divide by the standard deviation</text>" +
      "<text x='34' y='132' fill='#c9d6ea' font-size='10'>4. apply a learned gain and bias</text>" +
      "<text x='34' y='154' fill='#7d8fb0' font-size='9.5'>two passes, two learned vectors</text>" +
      "<rect x='388' y='30' width='356' height='134' rx='8' fill='#111a2e' stroke='#3ddc97' stroke-width='2.5'/>" +
      "<text x='566' y='52' text-anchor='middle' fill='#3ddc97' font-size='11'>RMSNorm (2019)</text>" +
      "<text x='406' y='78' fill='#7d8fb0' font-size='10' text-decoration='line-through'>1. compute the mean</text>" +
      "<text x='406' y='96' fill='#7d8fb0' font-size='10' text-decoration='line-through'>2. subtract it</text>" +
      "<text x='406' y='114' fill='#c9d6ea' font-size='10'>3. divide by the root mean square</text>" +
      "<text x='406' y='132' fill='#c9d6ea' font-size='10'>4. apply a learned gain</text>" +
      "<text x='406' y='154' fill='#3ddc97' font-size='9.5'>one pass, one learned vector, same quality</text>" +
      "<text x='20' y='188' fill='#c9d6ea' font-size='10.5'>Every model in this chapter's table except GPT-2 uses RMSNorm. The field agreed, which is rare.</text>" +
      "</svg><div class='fig-cap'>The centring step turned out to be doing nothing. Removing it costs no quality and saves a pass over 4,096 numbers, 64 times per token.</div></div>" },

    { title: "Where the Norm Goes",
      html: "<p>Now the choice that mattered most, and it is not which normalization but <em>where</em> it sits relative to the residual connection.</p>" +
      "<p>The 2017 paper put it after: compute the sub-layer, add to the stream, then normalize the result. This is <strong>post-LN</strong>.</p>" +
      "<pre><code>post-LN:   x = norm( x + attention(x) )\npre-LN:    x = x +  attention( norm(x) )</code></pre>" +
      "<p>The difference looks cosmetic and is not. In post-LN, the normalization sits <em>on</em> the residual path, so every backward pass through a layer traverses it. Thirty-two of those in series and the clean gradient highway from section 1 is no longer clean: it has 32 normalizations in the way, each scaling the gradient by something.</p>" +
      "<p>In pre-LN, the norm is inside the branch. The residual path from the loss to the embedding passes through nothing but additions. The highway stays a highway.</p>" +
      "<p>The practical consequence was documented by Ruibin Xiong and colleagues in 2020, and anyone who trained a transformer before then had already met it. Post-LN models have very large gradients in the early layers at the start of training, and diverge if you begin at full learning rate. The workaround was a warmup period, ramping the learning rate up over thousands of steps, and it was treated as an unavoidable fact of training transformers. It was not. It was a consequence of where the norm sat.</p>" +
      "<p>Pre-LN trains stably from step one without warmup. Every model in this course's config table uses it, and warmup survives for different reasons that Chapter 14 explains.</p>" +
      "<div class='fig'><svg viewBox='0 0 760 214' xmlns='http://www.w3.org/2000/svg' font-family='Menlo,monospace'>" +
      "<text x='20' y='18' fill='#2de2ff' font-size='11'>what the gradient travels through on its way down</text>" +
      "<text x='20' y='46' fill='#ff5d73' font-size='10.5'>post-LN (2017)</text>" +
      "<line x1='150' y1='62' x2='700' y2='62' stroke='#ff5d73' stroke-width='3'/>" +
      "<rect x='200' y='52' width='40' height='20' rx='4' fill='#111a2e' stroke='#ff5d73' stroke-width='2'/><text x='220' y='66' text-anchor='middle' fill='#ff5d73' font-size='9'>norm</text>" +
      "<rect x='320' y='52' width='40' height='20' rx='4' fill='#111a2e' stroke='#ff5d73' stroke-width='2'/><text x='340' y='66' text-anchor='middle' fill='#ff5d73' font-size='9'>norm</text>" +
      "<rect x='440' y='52' width='40' height='20' rx='4' fill='#111a2e' stroke='#ff5d73' stroke-width='2'/><text x='460' y='66' text-anchor='middle' fill='#ff5d73' font-size='9'>norm</text>" +
      "<rect x='560' y='52' width='40' height='20' rx='4' fill='#111a2e' stroke='#ff5d73' stroke-width='2'/><text x='580' y='66' text-anchor='middle' fill='#ff5d73' font-size='9'>norm</text>" +
      "<text x='150' y='92' fill='#ff5d73' font-size='10'>32 normalizations sit on the residual path. Needs warmup or it diverges.</text>" +
      "<text x='20' y='134' fill='#3ddc97' font-size='10.5'>pre-LN (2020 on)</text>" +
      "<line x1='150' y1='150' x2='700' y2='150' stroke='#3ddc97' stroke-width='4'/>" +
      "<path d='M200 150 L200 124 L260 124 L260 150' fill='none' stroke='#4f7cff' stroke-width='2'/>" +
      "<rect x='210' y='114' width='40' height='20' rx='4' fill='#111a2e' stroke='#4f7cff' stroke-width='2'/><text x='230' y='128' text-anchor='middle' fill='#c9d6ea' font-size='9'>norm</text>" +
      "<path d='M400 150 L400 124 L460 124 L460 150' fill='none' stroke='#4f7cff' stroke-width='2'/>" +
      "<rect x='410' y='114' width='40' height='20' rx='4' fill='#111a2e' stroke='#4f7cff' stroke-width='2'/><text x='430' y='128' text-anchor='middle' fill='#c9d6ea' font-size='9'>norm</text>" +
      "<path d='M600 150 L600 124 L660 124 L660 150' fill='none' stroke='#4f7cff' stroke-width='2'/>" +
      "<rect x='610' y='114' width='40' height='20' rx='4' fill='#111a2e' stroke='#4f7cff' stroke-width='2'/><text x='630' y='128' text-anchor='middle' fill='#c9d6ea' font-size='9'>norm</text>" +
      "<text x='150' y='180' fill='#3ddc97' font-size='10'>the norm moved into the branch. The residual path is nothing but additions.</text>" +
      "<text x='20' y='206' fill='#7d8fb0' font-size='10'>Warmup was treated as a fact about transformers for three years. It was a fact about where the norm sat.</text>" +
      "</svg><div class='fig-cap'>Two lines of code apart, and the difference between a run that needs careful babysitting and one that does not.</div></div>" },

    { title: "The Component That Left",
      html: "<p>One deletion worth noting, because its absence surprises people arriving from other areas of deep learning.</p>" +
      "<p><strong>Dropout</strong> randomly zeroes a fraction of activations during training, forcing the network not to depend on any single unit. It was standard in 2017 and the original transformer used it throughout.</p>" +
      "<p>Large-scale pretraining largely abandoned it, and the reason is a change in circumstances rather than a discovery about dropout. It is a regularizer, and regularizers exist to prevent overfitting. A model trained on trillions of tokens, seeing most of them once, is not overfitting; it is underfitting, and deliberately damaging its activations only slows learning. Most current pretraining configurations set dropout to zero.</p>" +
      "<p>It returns during fine-tuning, where the setting is the classic one: a small dataset, many epochs, real overfitting risk. Chapter 20 turns it back on and says why.</p>" },

    { title: "The Block, Assembled",
      html: "<p>Every piece is now on the table. Corvid's block in full:</p>" +
      "<pre><code>x = x + attention( rmsnorm(x) )        # 32 query heads, 8 KV heads, RoPE\nx = x + swiglu_ffn( rmsnorm(x) )      # 4,096 -> 14,336 -> 4,096</code></pre>" +
      "<p>Two lines, four sub-components, repeated 32 times, and one final normalization before the output projection. That is the entire architecture of a modern language model. Everything in Part II has been an explanation of one of those symbols.</p>" +
      "<p>Read the block against 2017 and the changes are exactly three, each a one-line edit:</p>" +
      "<ul>" +
      "<li><strong>Where the norm sits</strong>: inside the branch rather than on the residual path. Fixes the need for warmup.</li>" +
      "<li><strong>Which norm</strong>: RMSNorm rather than LayerNorm. Same quality, one pass instead of two.</li>" +
      "<li><strong>Which activation</strong>: a gated SwiGLU rather than a plain GELU, with the width chosen by experiment rather than by the parameter-matching rule.</li>" +
      "</ul>" +
      "<p>Positional encoding moved too, from an addition at the input to a rotation inside attention, which was Chapter 7. Four changes in nine years, and the skeleton is untouched.</p>" +
      "<div class='fig'><svg viewBox='0 0 760 238' xmlns='http://www.w3.org/2000/svg' font-family='Menlo,monospace'>" +
      "<text x='20' y='18' fill='#2de2ff' font-size='11'>one Corvid-8B block, complete</text>" +
      "<line x1='60' y1='34' x2='60' y2='206' stroke='#ffd166' stroke-width='6'/>" +
      "<text x='20' y='42' fill='#7d8fb0' font-size='9'>out</text><text x='20' y='206' fill='#7d8fb0' font-size='9'>in</text>" +
      "<circle cx='60' cy='170' r='9' fill='#111a2e' stroke='#ffd166' stroke-width='2'/><text x='60' y='174' text-anchor='middle' fill='#ffd166' font-size='11'>+</text>" +
      "<path d='M60 194 L120 194 L120 146 L60 146' fill='none' stroke='#4f7cff' stroke-width='2'/>" +
      "<rect x='130' y='182' width='96' height='24' rx='5' fill='#111a2e' stroke='#3ddc97' stroke-width='2'/><text x='178' y='198' text-anchor='middle' fill='#3ddc97' font-size='9.5'>RMSNorm</text>" +
      "<rect x='240' y='182' width='230' height='24' rx='5' fill='#111a2e' stroke='#4f7cff' stroke-width='2'/><text x='355' y='198' text-anchor='middle' fill='#c9d6ea' font-size='9.5'>attention: 32 q heads, 8 KV, RoPE</text>" +
      "<text x='486' y='198' fill='#7d8fb0' font-size='9'>41.9M params &#183; 19.2%</text>" +
      "<circle cx='60' cy='76' r='9' fill='#111a2e' stroke='#ffd166' stroke-width='2'/><text x='60' y='80' text-anchor='middle' fill='#ffd166' font-size='11'>+</text>" +
      "<path d='M60 100 L120 100 L120 52 L60 52' fill='none' stroke='#4f7cff' stroke-width='2'/>" +
      "<rect x='130' y='88' width='96' height='24' rx='5' fill='#111a2e' stroke='#3ddc97' stroke-width='2'/><text x='178' y='104' text-anchor='middle' fill='#3ddc97' font-size='9.5'>RMSNorm</text>" +
      "<rect x='240' y='88' width='230' height='24' rx='5' fill='#111a2e' stroke='#ff5d73' stroke-width='2.5'/><text x='355' y='104' text-anchor='middle' fill='#ff5d73' font-size='9.5'>SwiGLU: 4,096 - 14,336 - 4,096</text>" +
      "<text x='486' y='104' fill='#ff5d73' font-size='9'>176.2M params &#183; 80.8%</text>" +
      "<text x='130' y='140' fill='#7d8fb0' font-size='9.5'>the norms together: 8,192 params, 0.004% of the block</text>" +
      "<line x1='20' y1='218' x2='740' y2='218' stroke='#1c2a45' stroke-width='2'/>" +
      "<text x='20' y='234' fill='#c9d6ea' font-size='10.5'>218,112,000 parameters per block, 32 blocks, 6.98 billion before embeddings.</text>" +
      "</svg><div class='fig-cap'>Gold is the residual stream, green the normalizations that cost nothing and decide everything, red the four fifths of the parameters.</div></div>" +
      "<div class='callout'><strong>Interview lens.</strong> &#8220;Walk me through a transformer block.&#8221; The answer that lands is two lines of pseudocode, then the three deltas from 2017 with the reason for each: pre-norm because the residual path must stay clean or you need warmup; RMSNorm because centring did nothing; SwiGLU because a multiplicative gate beats a fixed curve at matched parameters. Adding that the feed-forward holds four fifths of the block, and the norms four thousandths, shows you have counted rather than read.</div>" },

    { title: "Exercises",
      html: "<ol>" +
      "<li><strong>Trace.</strong> A 32-layer network without residual connections has a gradient multiplied by 0.9 at each layer. Compute what fraction of the gradient reaches layer 1. Repeat for 1.1 per layer. Then state, in one sentence, what <code>x + f(x)</code> changes about that calculation, and why the answer no longer depends on the depth.</li>" +
      "<li><strong>Trace.</strong> Corvid uses d_model 4,096 and an FFN width of 14,336 with three matrices. Compute the FFN's parameters. Now compute what a two-matrix GELU network at 4&#215; would cost, and what a three-matrix SwiGLU network would need as its width to match that exactly. Confirm you get 2.667&#215;. Then look up one model in section 3's table that ignores this ratio and say by how much.</li>" +
      "<li><strong>Investigate.</strong> Open the configs of four models and record <code>hidden_size</code>, <code>intermediate_size</code>, <code>hidden_act</code> and whether the norm is RMSNorm. Compute each FFN ratio. You should find no agreement on width and near-total agreement on the norm. Write one sentence on why those two components landed so differently.</li>" +
      "<li><strong>Investigate.</strong> Find a model that still uses GELU rather than SwiGLU, and one that still uses LayerNorm rather than RMSNorm. For each, find out when it was released. The dates are the argument: these are not live disagreements so much as snapshots of when a design was frozen.</li>" +
      "<li><strong>Build.</strong> Write a transformer block in about thirty lines, taking the attention you built in Chapter 6: RMSNorm, the attention sub-layer, the residual add, RMSNorm again, a SwiGLU feed-forward, another residual add. Add a config flag switching pre-norm and post-norm, and one switching RMSNorm and LayerNorm. Assert the block preserves its input shape. Then run twenty steps of training on random data at a deliberately high learning rate, once with pre-norm and once with post-norm, and print the loss for each. The post-norm run should misbehave. Keep this code; it is PocketLM's block, and Chapter 38 turns those two flags into a measured ablation.</li>" +
      "</ol>" }
  ],
  terms: [
    { t: "residual connection", d: "Adding a sub-layer's output back to its input rather than replacing it, which creates a gradient path of constant 1 from the loss to the embedding." },
    { t: "residual stream", d: "The running vector at each position that every sub-layer reads from and adds to; constant in width through the whole stack." },
    { t: "sub-layer", d: "One of the two components inside a block, attention or the feed-forward network, each wrapped in a normalization and a residual add." },
    { t: "feed-forward network", d: "A two-layer perceptron applied to each position independently, holding roughly four fifths of a block's parameters." },
    { t: "expansion ratio", d: "The feed-forward width as a multiple of the model dimension; 4x in 2017 and anywhere from 2.7x to 5.3x in current models." },
    { t: "GELU", d: "An activation that scales each input by roughly the probability a standard normal falls below it, softening ReLU's corner and removing its dead zone." },
    { t: "SwiGLU", d: "A gated feed-forward variant using three matrices, where one branch multiplies the other elementwise, allowing input-dependent suppression." },
    { t: "gate", d: "The branch of a gated network whose output multiplies the other branch, expressing a multiplicative interaction a plain activation cannot." },
    { t: "LayerNorm", d: "Normalizing across the features of a single position by subtracting the mean and dividing by the standard deviation, then applying a learned gain and bias." },
    { t: "RMSNorm", d: "LayerNorm without the mean subtraction or bias, rescaling by the root mean square alone; same quality, one pass instead of two." },
    { t: "post-LN", d: "The 2017 arrangement placing normalization after the residual add, which puts 32 normalizations on the gradient path and requires warmup." },
    { t: "pre-LN", d: "Placing normalization inside the sub-layer branch so the residual path is nothing but additions; trains stably without warmup and is now universal." },
    { t: "warmup", d: "Ramping the learning rate up over the first thousands of steps, originally a workaround for post-LN instability." },
    { t: "dropout", d: "Randomly zeroing activations during training to prevent overfitting; largely set to zero in large-scale pretraining, and reinstated for fine-tuning." }
  ],
  quiz: [
    { type: "mc", q: "Why do residual connections make a 32-layer stack trainable?", opts: ["They reduce the number of parameters the gradient must pass through", "They normalize the activations at each layer", "They allow layers to be computed in parallel", "The derivative of x + f(x) is 1 + f'(x), giving a path of constant 1 from the loss to the embedding"], a: 3,
      why: "Without them the gradient is multiplied layer by layer, and 0.9 raised to the 32nd power is 0.034, so layer 1 receives almost nothing. With them there is an additive path whose derivative is 1, undiminished by depth, and each sub-layer's contribution is added alongside rather than multiplied through. This is He and colleagues' 2015 result, inherited from image networks." },
    { type: "mc", q: "In a Corvid block, which component holds the most parameters?", opts: ["The attention projections", "The feed-forward network, at about four fifths of the block", "The normalizations", "They are roughly equal"], a: 1,
      why: "Measured on Corvid's configuration: attention 41.9 million, feed-forward 176.2 million, norms 8,192. That is 19.2%, 80.8% and 0.004%. It explains why mixture-of-experts in Chapter 10 replaces the feed-forward rather than the attention, and why quantization cares most about those three matrices." },
    { type: "mc", q: "SwiGLU uses three matrices where GELU uses two. Why did Shazeer shrink the intermediate width to two thirds when comparing them?", opts: ["Because three matrices are slower and the width compensates for time", "Because gating requires a narrower intermediate to be stable", "So the two networks have equal parameter counts, making it a comparison of activations rather than of sizes", "To fit the model on the available hardware"], a: 2,
      why: "Without the correction you are comparing a 50% larger network against a smaller one, and any win is uninterpretable. Four times two thirds is 2.667, and on Corvid's dimension that is an intermediate of 10,923 against the 16,384 a two-matrix network would use. With counts matched, SwiGLU wins, which is the result that made it standard." },
    { type: "mc", q: "Llama-2-7B has an FFN ratio of 2.688x, Llama-3-8B 3.5x, and Qwen2.5-7B 5.286x. What does that spread show?", opts: ["Qwen2.5 does not use SwiGLU", "The two-thirds rule was a device for a fair ablation, not a prescription for how wide to build", "Larger models need proportionally wider feed-forward networks", "The configs report the combined width of all three matrices"], a: 1,
      why: "Llama-2 sits almost exactly on the rule; everything since chose its own width from its own scaling experiments and they disagree by nearly a factor of two. Qwen2.5 does use SwiGLU, and the models here are all roughly the same size, so neither of the first two explanations holds. The rule tells you how to run the experiment, not how to build the model." },
    { type: "blank", q: "Normalizing by the root mean square alone, with no mean subtraction and no bias, is called ____.", a: ["rmsnorm", "rms norm", "rms normalization"],
      why: "Zhang and Sennrich found in 2019 that the centring step in LayerNorm was doing nothing measurable. Dropping it saves a pass over 4,096 numbers, 64 times per token, for no quality cost. Every model in this chapter's table except GPT-2 uses it, which makes it the rare component the field simply agreed on." },
    { type: "blank", q: "Placing the normalization inside the sub-layer branch, so the residual path contains only additions, is called ____-LN.", a: ["pre", "pre-ln", "preln"],
      why: "The 2017 paper did the opposite, putting the norm after the residual add, which stacks 32 normalizations directly on the gradient path. Xiong and colleagues showed in 2020 that this was the cause of the early-training instability everyone had been working around with warmup." },
    { type: "order", q: "Order the operations in one pre-LN transformer block:", items: ["normalize the residual stream", "compute attention over the normalized vector", "add the attention output back to the stream", "normalize again, run the feed-forward, and add that back too"],
      why: "Normalize, attend, add, then repeat the pattern for the feed-forward. The order is the whole difference between pre-LN and post-LN: moving the first step to the end of each pair gives you the 2017 block and its warmup requirement back." },
    { type: "mc", q: "Why is dropout usually set to zero during large-scale pretraining but reinstated for fine-tuning?", opts: ["Dropout is incompatible with the residual stream", "Dropout was found to damage attention specifically", "Modern optimizers make it unnecessary in both settings", "Pretraining underfits on trillions of mostly-unrepeated tokens, so a regularizer only slows learning; fine-tuning on a small set for many epochs genuinely overfits"], a: 3,
      why: "It is a change in circumstances, not a discovery about dropout. Regularizers prevent overfitting, and a model that sees most of its trillions of tokens once is not overfitting. Deliberately damaging its activations only costs it learning. Fine-tuning is the classic overfitting setting, and Chapter 20 turns dropout back on." },
    { type: "mc", q: "A team trains a 32-layer transformer that diverges in the first few hundred steps unless they ramp the learning rate up slowly. Which architectural choice would you check first?", opts: ["Whether they are using RMSNorm or LayerNorm", "The feed-forward expansion ratio", "The activation function", "Whether the normalization sits on the residual path rather than inside the branch"], a: 3,
      why: "This is the exact signature of post-LN. With 32 normalizations on the residual path, early-training gradients in the first layers are very large and a full learning rate diverges. Warmup was the workaround the field used for three years before Xiong and colleagues identified the cause. The choice of which norm, how wide, or which activation does not produce this failure." },
    { type: "mc", q: "What stayed the same between a 2017 transformer block and Corvid's?", opts: ["The residual connections and the two-sub-layer skeleton", "The normalization function", "The activation function", "The position encoding scheme"], a: 0,
      why: "Four things changed in nine years: where the norm sits, which norm, which activation, and how position is injected. The skeleton did not. Attention then a feed-forward, each wrapped in a normalization and a residual add, repeated N times, is the same shape it was in the original paper, and residual connections are the one component nobody has revised." }
  ]
});

/* ======================= CHAPTER 9 ======================= */
CHAPTERS.push({
  num: 9, part: 2, title: "Counting the Machine: Parameters, FLOPs, and Bytes",
  blurb: "Almost every practical question about a model is arithmetic you can do on paper in two minutes. Will it fit, what will training cost, how many users can I serve, why did it run out of memory at batch 9. This chapter teaches that arithmetic once, carefully, and the rest of the course uses it constantly. You will count Corvid-8B block by block until the total matches, work out the FLOPs of a forward pass and find where the famous shortcut stops being true, and then read an unfamiliar config and say what a model will cost before downloading a byte of it.",
  sections: [
    { title: "Counting Parameters", viz: "llmParamCounter", vizTitle: "Edit a config and watch the parameter breakdown move",
      html: "<p>Every parameter in a transformer lives in one of four places. Chapters 4 through 8 built all four, so this is bookkeeping rather than new machinery, but doing it once properly is what makes the rest of the course's numbers checkable.</p>" +
      "<p><strong>The token embeddings.</strong> One row per vocabulary entry, one column per model dimension: <code>V &#215; d</code>. For Corvid, 128,256 &#215; 4,096 = 525,336,576.</p>" +
      "<p><strong>The blocks.</strong> Per block, four attention matrices and three feed-forward matrices, plus two normalization vectors. With grouped-query attention the key and value projections are smaller than the query and output ones:</p>" +
      "<pre><code>W_Q     d x (n_heads x d_head)     4,096 x 4,096   =  16,777,216\nW_K     d x (n_kv    x d_head)     4,096 x 1,024   =   4,194,304\nW_V     d x (n_kv    x d_head)     4,096 x 1,024   =   4,194,304\nW_O     (n_heads x d_head) x d     4,096 x 4,096   =  16,777,216\n                                                     -----------\nattention                                             41,943,040\n\nW_gate  d x ff                     4,096 x 14,336  =  58,720,256\nW_up    d x ff                     4,096 x 14,336  =  58,720,256\nW_down  ff x d                    14,336 x 4,096   =  58,720,256\n                                                     -----------\nfeed-forward                                         176,160,768\n\ntwo RMSNorm gains                  2 x 4,096       =       8,192\n                                                     -----------\nper block                                            218,112,000</code></pre>" +
      "<p><strong>The final normalization.</strong> One more gain vector, 4,096 numbers.</p>" +
      "<p><strong>The output projection.</strong> Another <code>d &#215; V</code>, another 525,336,576, because Corvid does not tie its embeddings. Chapter 4 explained when a model would.</p>" +
      "<p>Sum it:</p>" +
      "<pre><code>token embeddings         525,336,576    6.54%\n32 blocks              6,979,584,000   86.92%\nfinal norm                     4,096    0.00%\noutput projection        525,336,576    6.54%\n                       -------------\ntotal                  8,030,261,248</code></pre>" +
      "<p>8.03 billion, which is where the name came from. Two things are worth noticing before moving on.</p>" +
      "<p>The blocks are <strong>87% of the model</strong>, and everything to do with the vocabulary is 13%. That ratio is a strong function of scale: Chapter 4 showed that on a half-billion-parameter model the vocabulary eats more than a quarter of the budget, which is why small models tie their embeddings and this one does not.</p>" +
      "<p>And the norms, at 8,192 parameters per block, are 0.004% of it. Chapter 8's argument that the components deciding whether the model trains are numerically free is now a number you have produced.</p>" +
      "<div class='fig'><svg viewBox='0 0 760 178' xmlns='http://www.w3.org/2000/svg' font-family='Menlo,monospace'>" +
      "<text x='20' y='18' fill='#2de2ff' font-size='11'>where Corvid-8B's 8,030,261,248 parameters live</text>" +
      "<rect x='20' y='34' width='47' height='30' rx='4' fill='#4f7cff'/>" +
      "<rect x='69' y='34' width='626' height='30' rx='4' fill='#ff5d73'/>" +
      "<rect x='697' y='34' width='47' height='30' rx='4' fill='#4f7cff'/>" +
      "<text x='43' y='84' text-anchor='middle' fill='#4f7cff' font-size='9'>embed</text>" +
      "<text x='43' y='96' text-anchor='middle' fill='#4f7cff' font-size='9'>6.5%</text>" +
      "<text x='382' y='84' text-anchor='middle' fill='#ff5d73' font-size='10'>32 transformer blocks &#183; 6,979,584,000 &#183; 86.9%</text>" +
      "<text x='720' y='84' text-anchor='middle' fill='#4f7cff' font-size='9'>head</text>" +
      "<text x='720' y='96' text-anchor='middle' fill='#4f7cff' font-size='9'>6.5%</text>" +
      "<line x1='20' y1='112' x2='740' y2='112' stroke='#1c2a45' stroke-width='2'/>" +
      "<text x='20' y='134' fill='#c9d6ea' font-size='10.5'>Inside one block: feed-forward 80.8%, attention 19.2%, the two norms 0.004%.</text>" +
      "<text x='20' y='156' fill='#7d8fb0' font-size='10.5'>On a 0.5B model the vocabulary share is over 25%, which is why small models tie their embeddings (Chapter 4).</text>" +
      "</svg><div class='fig-cap'>The shape of a model, to scale. Almost everything is blocks, and almost all of a block is the feed-forward network.</div></div>" },

    { title: "The 2N Rule, and Where It Breaks",
      html: "<p>How much arithmetic does one token cost?</p>" +
      "<p>Nearly all of it happens in matrix multiplications against the weights, and every parameter participates in exactly one multiply and one add per token. A multiply-accumulate is two floating-point operations. So:</p>" +
      "<pre><code>forward FLOPs per token = 2N</code></pre>" +
      "<p>For Corvid, 2 &#215; 8.03 billion = <strong>16.06 GFLOPs to produce one token</strong>. That is the single most useful number in inference planning, and it is why Chapter 26 can predict throughput from a GPU's specification sheet.</p>" +
      "<p>One warning to carry forward. FLOPs are not time. Two operations with identical FLOP counts can differ by an order of magnitude in wall-clock, because one moves far more bytes through memory than the other. The ratio of arithmetic to bytes moved is called <strong>arithmetic intensity</strong>, Chapter 16 derives it, and Chapter 26 uses it to explain why the first token of a reply is slow and the rest are fast. For now, count FLOPs and remember they are an upper bound on what the hardware can be doing usefully.</p>" +
      "<h3>What the rule leaves out</h3>" +
      "<p>The 2N rule counts weights. Attention also multiplies queries by keys and weights by values, and those operations involve no parameters at all, so they are invisible to it. Chapter 5 showed that work grows with the square of the sequence length, so whether it matters depends entirely on context length. Computed for Corvid:</p>" +
      "<pre><code>context      attention FLOPs/token    on top of the 16.06 GFLOPs\n    512               0.27 GFLOPs                       1.7%\n  2,048               1.07 GFLOPs                       6.7%\n  8,192               4.29 GFLOPs                      26.7%\n 32,768              17.18 GFLOPs                     107.0%</code></pre>" +
      "<p>At 512 tokens the rule is accurate to within two percent and you should use it without hesitation. At Corvid's full 8,192-token context it is understating the work by a quarter. At 32,768 tokens <strong>attention costs more than every weight in the model combined</strong>, and anyone still quoting 2N is out by more than a factor of two.</p>" +
      "<p>This is the honest version of a rule most sources give without its domain. Use 2N for short contexts, add the attention term for long ones, and know which regime you are in.</p>" +
      "<div class='fig'><svg viewBox='0 0 760 200' xmlns='http://www.w3.org/2000/svg' font-family='Menlo,monospace'>" +
      "<text x='20' y='18' fill='#2de2ff' font-size='11'>FLOPs to produce one token: weights versus attention</text>" +
      "<text x='20' y='48' fill='#7d8fb0' font-size='10'>n = 512</text>" +
      "<rect x='120' y='36' width='300' height='16' rx='3' fill='#4f7cff'/><rect x='420' y='36' width='5' height='16' rx='2' fill='#ffd166'/>" +
      "<text x='440' y='49' fill='#7d8fb0' font-size='9.5'>+1.7%</text>" +
      "<text x='20' y='80' fill='#7d8fb0' font-size='10'>n = 2,048</text>" +
      "<rect x='120' y='68' width='300' height='16' rx='3' fill='#4f7cff'/><rect x='420' y='68' width='20' height='16' rx='2' fill='#ffd166'/>" +
      "<text x='456' y='81' fill='#7d8fb0' font-size='9.5'>+6.7%</text>" +
      "<text x='20' y='112' fill='#7d8fb0' font-size='10'>n = 8,192</text>" +
      "<rect x='120' y='100' width='300' height='16' rx='3' fill='#4f7cff'/><rect x='420' y='100' width='80' height='16' rx='2' fill='#ffd166'/>" +
      "<text x='516' y='113' fill='#ffd166' font-size='9.5'>+26.7%</text>" +
      "<text x='20' y='144' fill='#7d8fb0' font-size='10'>n = 32,768</text>" +
      "<rect x='120' y='132' width='300' height='16' rx='3' fill='#4f7cff'/><rect x='420' y='132' width='321' height='16' rx='2' fill='#ff5d73'/>" +
      "<text x='560' y='145' fill='#ff5d73' font-size='9.5'>+107%: exceeds the weights</text>" +
      "<rect x='120' y='164' width='14' height='10' rx='2' fill='#4f7cff'/><text x='142' y='173' fill='#7d8fb0' font-size='9.5'>2N = 16.06 GFLOPs, constant</text>" +
      "<rect x='320' y='164' width='14' height='10' rx='2' fill='#ffd166'/><text x='342' y='173' fill='#7d8fb0' font-size='9.5'>attention, grows with context</text>" +
      "<text x='20' y='194' fill='#c9d6ea' font-size='10.5'>The 2N rule is a short-context rule. Most sources omit that.</text>" +
      "</svg><div class='fig-cap'>The blue bar never moves; the gold one squares. Knowing which regime you are in is the difference between a good estimate and a wrong one.</div></div>" },

    { title: "What a Training Run Costs",
      html: "<p>Training adds a backward pass, and the backward pass costs about twice the forward one. The reason is countable: for each layer the backward pass computes two gradients rather than one, the gradient with respect to the layer's input so the chain can continue, and the gradient with respect to the layer's weights so they can be updated. Each is a matrix multiplication of comparable size to the forward one.</p>" +
      "<p>So a full training step is roughly 2N forward plus 4N backward:</p>" +
      "<pre><code>training FLOPs = 6 x N x D</code></pre>" +
      "<p>where N is parameters and D is training tokens. This is the estimate behind every scaling-law calculation in Chapter 15, and it is accurate to within about ten percent for real runs.</p>" +
      "<p>Put it to work. Training Corvid on 15 trillion tokens, a plausible modern budget:</p>" +
      "<pre><code>6 x 8.03e9 x 15e12 = 7.227e23 FLOPs</code></pre>" +
      "<p>An H100 delivers roughly 400 teraFLOPs per second of useful bf16 throughput once you account for the fraction of peak a real run achieves. Dividing:</p>" +
      "<pre><code>7.227e23 / 4e14 = 1.8e9 seconds = 20,912 GPU-days\n                              = about 21 days on 1,000 GPUs</code></pre>" +
      "<p>Those two lines are why frontier pretraining is done by organizations with thousands of GPUs, and they are also why the number is not mysterious. It is one multiplication and one division from numbers on a spec sheet.</p>" +
      "<div class='callout'><strong>Interview lens.</strong> &#8220;Estimate the cost of training a 70B model on 2 trillion tokens.&#8221; The expected move is 6ND: 6 &#215; 7e10 &#215; 2e12 = 8.4e23 FLOPs, divide by realistic per-GPU throughput, convert to GPU-days, multiply by an hourly rate. The point is not the answer, which depends on assumptions you should state. It is that you reach for an estimate rather than a search engine, and that you name the efficiency assumption instead of using peak FLOPs.</div>" },

    { title: "Will It Fit: Inference", viz: "llmMemoryFit", vizTitle: "Set training or inference mode and watch what fills the card",
      html: "<p>Three things occupy memory when serving. Two of them you can now compute exactly.</p>" +
      "<p><strong>Weights</strong> are N times the bytes per parameter. <strong>The KV cache</strong> is Chapter 6's formula, 128 KB per token for Corvid, times context times concurrency. <strong>Activation memory</strong> during inference is small, because nothing needs to be kept for a backward pass: one token's intermediate values at a time, a few megabytes.</p>" +
      "<p>Corvid at 8,192 tokens of context, one request:</p>" +
      "<pre><code>precision   weights     KV cache    total\nbf16        16.06 GB    1.07 GB     17.13 GB\nint8         8.03 GB    1.07 GB      9.10 GB\n4-bit        4.02 GB    1.07 GB      5.09 GB</code></pre>" +
      "<p>Read the first row against the 16 GB budget. It does not fit. An 8-billion-parameter model at its native precision cannot be served on a 16 GB card at all, and this is the arithmetic behind the callout in Chapter 6 rather than an assertion.</p>" +
      "<p>Read the third row and the picture inverts: at 4-bit, weights and a full-context cache together take under a third of the card, leaving room for the concurrency Chapter 6 measured. Quantization is not a micro-optimization for this model on this hardware. It is the difference between running and not running, which is why Chapter 29 is a keystone.</p>" },

    { title: "Will It Fit: Training",
      html: "<p>Training holds far more than weights, and the multiplier surprises people who have only served models.</p>" +
      "<p>A standard mixed-precision AdamW setup keeps five things per parameter:</p>" +
      "<pre><code>bf16 weights, used for the forward pass          2 bytes\nfp32 master weights, so tiny updates survive     4 bytes\nfp32 gradients                                   4 bytes\nAdam's first moment                              4 bytes\nAdam's second moment                             4 bytes\n                                                --------\n                                                18 bytes per parameter</code></pre>" +
      "<p>Chapter 14 explains why each exists. For counting purposes what matters is the total: <strong>18 bytes per parameter</strong>, before a single activation is stored.</p>" +
      "<pre><code>18 x 8.03e9 = 144.5 GB</code></pre>" +
      "<p>An 80 GB H100, the largest single accelerator most teams can rent, holds 80. Full fine-tuning of an 8B model does not fit on one, by a factor of 1.8, and that is before activations, which for a reasonable batch and sequence length add tens of gigabytes more.</p>" +
      "<p>Two escape routes follow directly, and both get their own chapter. Split the state across many GPUs so each holds a shard, which is Chapter 17. Or do not train most of the parameters at all: freeze the model and train a small adapter, so the 16 bytes of optimizer state apply to a few million parameters instead of eight billion. That is LoRA, in Chapter 21, and this arithmetic is precisely why it exists.</p>" +
      "<div class='fig'><svg viewBox='0 0 760 214' xmlns='http://www.w3.org/2000/svg' font-family='Menlo,monospace'>" +
      "<text x='20' y='18' fill='#2de2ff' font-size='11'>memory for Corvid-8B: serving versus training</text>" +
      "<line x1='300' y1='30' x2='300' y2='150' stroke='#ff5d73' stroke-width='2' stroke-dasharray='5 4'/>" +
      "<text x='236' y='168' fill='#ff5d73' font-size='9.5'>16 GB budget</text>" +
      "<line x1='560' y1='30' x2='560' y2='150' stroke='#ffd166' stroke-width='2' stroke-dasharray='5 4'/>" +
      "<text x='520' y='168' fill='#ffd166' font-size='9.5'>80 GB H100</text>" +
      "<text x='20' y='48' fill='#7d8fb0' font-size='10'>serve, 4-bit</text>" +
      "<rect x='150' y='36' width='24' height='16' rx='3' fill='#3ddc97'/><rect x='174' y='36' width='7' height='16' rx='3' fill='#2de2ff'/>" +
      "<text x='196' y='49' fill='#3ddc97' font-size='9.5'>5.09 GB</text>" +
      "<text x='20' y='80' fill='#7d8fb0' font-size='10'>serve, int8</text>" +
      "<rect x='150' y='68' width='48' height='16' rx='3' fill='#3ddc97'/><rect x='198' y='68' width='7' height='16' rx='3' fill='#2de2ff'/>" +
      "<text x='220' y='81' fill='#3ddc97' font-size='9.5'>9.10 GB</text>" +
      "<text x='20' y='112' fill='#7d8fb0' font-size='10'>serve, bf16</text>" +
      "<rect x='150' y='100' width='96' height='16' rx='3' fill='#ffd166'/><rect x='246' y='100' width='7' height='16' rx='3' fill='#2de2ff'/>" +
      "<text x='268' y='113' fill='#ffd166' font-size='9.5'>17.13 GB &#183; over the budget</text>" +
      "<text x='20' y='144' fill='#7d8fb0' font-size='10'>full fine-tune</text>" +
      "<rect x='150' y='132' width='590' height='16' rx='3' fill='#ff5d73'/><polygon points='740,132 752,140 740,148' fill='#ff5d73'/>" +
      "<text x='150' y='190' fill='#ff5d73' font-size='10'>144.5 GB at 18 bytes per parameter, before activations: 1.8x an H100</text>" +
      "<rect x='150' y='198' width='14' height='10' rx='2' fill='#3ddc97'/><text x='172' y='207' fill='#7d8fb0' font-size='9'>weights</text>" +
      "<rect x='250' y='198' width='14' height='10' rx='2' fill='#2de2ff'/><text x='272' y='207' fill='#7d8fb0' font-size='9'>KV cache at 8,192 tokens</text>" +
      "<rect x='470' y='198' width='14' height='10' rx='2' fill='#ff5d73'/><text x='492' y='207' fill='#7d8fb0' font-size='9'>optimizer state and gradients</text>" +
      "</svg><div class='fig-cap'>The red bar runs off the chart, which is the point. Chapters 17 and 21 exist because of this one comparison.</div></div>" },

    { title: "Reading an Unfamiliar Config",
      html: "<p>You can now open a model you have never seen and say what it will cost. Every field in a modern config maps onto a mechanism from Part II.</p>" +
      "<ul>" +
      "<li><code>hidden_size</code> &#8212; the residual stream width, Chapter 8. Corvid: 4,096.</li>" +
      "<li><code>num_hidden_layers</code> &#8212; how many blocks. Multiply block parameters by this.</li>" +
      "<li><code>num_attention_heads</code> and <code>num_key_value_heads</code> &#8212; Chapter 6. The second sets the KV cache; the first does not.</li>" +
      "<li><code>head_dim</code>, when present, and not always <code>hidden_size</code> divided by the head count.</li>" +
      "<li><code>intermediate_size</code> &#8212; the feed-forward width, Chapter 8. Multiply by three for a gated activation, two otherwise.</li>" +
      "<li><code>hidden_act</code> &#8212; <code>silu</code> means a gated SwiGLU with three matrices; <code>gelu</code> usually means two.</li>" +
      "<li><code>vocab_size</code> &#8212; Chapter 2, and possibly padded above the tokenizer's real count.</li>" +
      "<li><code>tie_word_embeddings</code> &#8212; Chapter 4. If true, count the vocabulary matrix once.</li>" +
      "<li><code>max_position_embeddings</code>, <code>rope_theta</code>, <code>rope_scaling</code> &#8212; Chapter 7, and whether the long context was trained or bolted on.</li>" +
      "<li><code>torch_dtype</code> &#8212; bytes per parameter for the download size.</li>" +
      "</ul>" +
      "<div class='fig'><svg viewBox='0 0 760 244' xmlns='http://www.w3.org/2000/svg' font-family='Menlo,monospace'>" +
      "<text x='20' y='18' fill='#2de2ff' font-size='11'>every field, and the chapter that explains it</text>" +
      "<rect x='16' y='28' width='400' height='204' rx='8' fill='#0e1626' stroke='#1c2a45' stroke-width='2'/>" +
      "<text x='34' y='50' fill='#c9d6ea' font-size='10'>&#123;</text>" +
      "<text x='46' y='68' fill='#ffd166' font-size='10'>\"hidden_size\"</text><text x='196' y='68' fill='#c9d6ea' font-size='10'>: 4096,</text>" +
      "<text x='46' y='86' fill='#ffd166' font-size='10'>\"num_hidden_layers\"</text><text x='240' y='86' fill='#c9d6ea' font-size='10'>: 32,</text>" +
      "<text x='46' y='104' fill='#ffd166' font-size='10'>\"num_attention_heads\"</text><text x='262' y='104' fill='#c9d6ea' font-size='10'>: 32,</text>" +
      "<text x='46' y='122' fill='#3ddc97' font-size='10'>\"num_key_value_heads\"</text><text x='262' y='122' fill='#c9d6ea' font-size='10'>: 8,</text>" +
      "<text x='46' y='140' fill='#ff5d73' font-size='10'>\"intermediate_size\"</text><text x='240' y='140' fill='#c9d6ea' font-size='10'>: 14336,</text>" +
      "<text x='46' y='158' fill='#ff5d73' font-size='10'>\"hidden_act\"</text><text x='184' y='158' fill='#c9d6ea' font-size='10'>: \"silu\",</text>" +
      "<text x='46' y='176' fill='#4f7cff' font-size='10'>\"vocab_size\"</text><text x='184' y='176' fill='#c9d6ea' font-size='10'>: 128256,</text>" +
      "<text x='46' y='194' fill='#4f7cff' font-size='10'>\"tie_word_embeddings\"</text><text x='262' y='194' fill='#c9d6ea' font-size='10'>: false,</text>" +
      "<text x='46' y='212' fill='#2de2ff' font-size='10'>\"rope_theta\"</text><text x='184' y='212' fill='#c9d6ea' font-size='10'>: 500000.0</text>" +
      "<text x='34' y='228' fill='#c9d6ea' font-size='10'>&#125;</text>" +
      "<text x='436' y='68' fill='#7d8fb0' font-size='9.5'>residual stream width &#183; ch 8</text>" +
      "<text x='436' y='86' fill='#7d8fb0' font-size='9.5'>multiply block params by this</text>" +
      "<text x='436' y='104' fill='#7d8fb0' font-size='9.5'>expressiveness, not cache &#183; ch 6</text>" +
      "<text x='436' y='122' fill='#3ddc97' font-size='9.5'>this one sets the KV cache &#183; ch 6</text>" +
      "<text x='436' y='140' fill='#ff5d73' font-size='9.5'>x3 matrices, 80.8% of a block &#183; ch 8</text>" +
      "<text x='436' y='158' fill='#ff5d73' font-size='9.5'>silu means gated: three, not two</text>" +
      "<text x='436' y='176' fill='#4f7cff' font-size='9.5'>may be padded above the tokenizer</text>" +
      "<text x='436' y='194' fill='#4f7cff' font-size='9.5'>false: count the matrix twice &#183; ch 4</text>" +
      "<text x='436' y='212' fill='#2de2ff' font-size='9.5'>slowest pair's wavelength &#183; ch 7</text>" +
      "</svg><div class='fig-cap'>Nine fields, nine mechanisms. Two of them, num_key_value_heads and tie_word_embeddings, change the cost far more than their prominence suggests.</div></div>" +
      "<p>Three real models, read this way:</p>" +
      "<pre><code>                    Llama-3-8B     Qwen2.5-7B     Gemma-2-9B\nhidden                   4,096          3,584          3,584\nlayers                      32             28             42\nq / kv heads             32 / 8         28 / 4         16 / 8\nhead_dim                   128            128            256\nFFN width               14,336         18,944         14,336\nactivation              SwiGLU         SwiGLU           GELU\nvocab                  128,256        152,064        256,000\ntied                        no             no            yes</code></pre>" +
      "<p>Gemma-2 is the interesting one. Its head dimension of 256 is larger than its hidden size divided by its head count would give, its vocabulary is twice Llama's, and it ties its embeddings, which for a 256,000-entry vocabulary saves 917 million parameters. Three unusual decisions, all readable, all with consequences you can now compute.</p>" },

    { title: "The Estimation Habit",
      html: "<p>The <strong>estimation habit</strong> is five questions, in order, answered before you download anything. Each takes under a minute with the arithmetic from this chapter.</p>" +
      "<ol>" +
      "<li><strong>What is N?</strong> From the config, not the name. Names round and sometimes mislead.</li>" +
      "<li><strong>Will the weights fit, at what precision?</strong> N times bytes per parameter, against your card. If the answer is no at bf16, you are in Chapter 29's territory before you start.</li>" +
      "<li><strong>What does the KV cache cost per token, and per concurrent user?</strong> Chapter 6's formula. On a serving deployment this frequently dominates.</li>" +
      "<li><strong>What is 2N, and am I in a regime where it is enough?</strong> Short context, use it; long context, add the attention term.</li>" +
      "<li><strong>If I want to train it, is it 18 bytes per parameter or an adapter?</strong> The answer decides whether you need Chapter 17's sharding or Chapter 21's LoRA.</li>" +
      "</ol>" +
      "<p>None of this requires a benchmark, a trial deployment, or a vendor. It requires a config file and two minutes, and the habit of doing it before rather than after is most of what separates engineers who are surprised by their infrastructure bill from engineers who are not.</p>" },

    { title: "Exercises",
      html: "<ol>" +
      "<li><strong>Trace.</strong> Count a model with 24 layers, hidden size 2,048, 16 query heads and 4 KV heads of dimension 128, a feed-forward width of 5,632 with a gated activation, a vocabulary of 32,000 and tied embeddings. Produce the four-line summary from section 1 and a total. Then state what fraction of it the vocabulary is, and whether tying was the right call at that size.</li>" +
      "<li><strong>Trace.</strong> That model is trained on 3 trillion tokens. Compute the training FLOPs with 6ND, then the GPU-days at 400 teraFLOPs per second of effective throughput. Then compute its inference memory at bf16 and at 4-bit, and its KV cache per token. State whether it fits the 16 GB budget in each case.</li>" +
      "<li><strong>Investigate.</strong> Pick an open-weights model you have never counted. Compute its parameters from its config alone, then compare your total with the published figure. If you are out by more than one percent, find the discrepancy: the usual culprits are tied embeddings, a padded vocabulary, a head dimension that is not hidden size over head count, or a gated activation you counted as two matrices instead of three.</li>" +
      "<li><strong>Investigate.</strong> Take the same model and find the context length at which attention's FLOPs exceed the 2N term. Then check whether that length is inside or outside its advertised context window. For several current models the crossover sits well inside the window, which means the commonly quoted cost model is wrong for the way they are actually used.</li>" +
      "<li><strong>Build.</strong> Write a function that takes a Hugging Face <code>config.json</code> and returns a report: total parameters broken down four ways, model size in bytes at four precisions, KV cache bytes per token, forward FLOPs per token under 2N, the attention FLOPs at the model's full context, and the training-state size at 18 bytes per parameter. Run it on five models and sort them by cost to serve rather than by parameter count. The two orderings will differ, and the difference is this chapter's payoff.</li>" +
      "</ol>" }
  ],
  terms: [
    { t: "parameter count", d: "The total number of learned numbers in a model, computed from its configuration rather than read from its name." },
    { t: "the 2N rule", d: "The estimate that a forward pass costs two floating-point operations per parameter per token, accurate at short context and increasingly wrong at long context." },
    { t: "6ND", d: "The estimate that training costs six FLOPs per parameter per token, being 2N forward plus roughly 4N backward." },
    { t: "FLOPs", d: "Floating-point operations, the unit of arithmetic work; a multiply-accumulate counts as two." },
    { t: "effective throughput", d: "The fraction of a GPU's peak FLOPs a real training run achieves, and the number to use in estimates rather than the spec-sheet peak." },
    { t: "GPU-day", d: "One accelerator running for one day; the natural unit for quoting training cost before converting to money." },
    { t: "master weights", d: "The fp32 copy of the parameters kept during mixed-precision training so that updates too small to change a bf16 value are not lost." },
    { t: "optimizer state", d: "The per-parameter values an optimizer maintains between steps; AdamW keeps two, which is eight bytes per parameter in fp32." },
    { t: "activation memory", d: "Intermediate values kept during training for the backward pass; small during inference, and often tens of gigabytes during training." },
    { t: "bytes per parameter", d: "The multiplier converting a parameter count into memory: 2 at bf16, 1 at int8, 0.5 at 4-bit, and 18 for a full AdamW training state." },
    { t: "arithmetic intensity", d: "FLOPs performed per byte moved from memory; introduced here as the reason two operations with equal FLOPs can differ wildly in speed, and derived in Chapter 16." },
    { t: "config.json", d: "The file declaring a model's architecture, from which every number in this chapter can be computed before downloading any weights." },
    { t: "padded vocabulary", d: "A declared vocab_size larger than the tokenizer's entry count, rounded up for hardware efficiency; use it for parameter counts." },
    { t: "estimation habit", d: "Answering the five sizing questions from a config before downloading a model, rather than discovering the answers from an infrastructure bill." }
  ],
  quiz: [
    { type: "mc", q: "Corvid-8B has 8.03 billion parameters. What is the forward cost of producing one token at a short context?", opts: ["8.03 GFLOPs, one operation per parameter", "16.06 GFLOPs, two operations per parameter", "4.02 GFLOPs, since half the parameters are inactive", "It cannot be estimated without knowing the batch size"], a: 1,
      why: "Every parameter takes part in one multiply and one add per token, and a multiply-accumulate is two floating-point operations. Hence 2N. Batch size multiplies the total work but not the per-token cost, and no parameters are inactive in a dense model, which is exactly the distinction mixture-of-experts breaks in Chapter 10." },
    { type: "mc", q: "At a context of 32,768 tokens, attention adds 107% on top of Corvid's 2N cost. What does that mean for the 2N rule?", opts: ["The rule is wrong and should not be used", "The rule applies only to training, not inference", "Attention parameters were double-counted", "The rule is a short-context approximation; at long context the parameter-free attention work exceeds every weight in the model"], a: 3,
      why: "The 2N rule counts weights, and attention's query-key and weight-value multiplications involve no parameters at all, so they are invisible to it. That work grows with the square of context: 1.7% on top at 512 tokens, 26.7% at 8,192, and 107% at 32,768. The rule is excellent in one regime and badly wrong in another, and most sources quote it without saying which." },
    { type: "mc", q: "Why is the training estimate 6ND rather than 2ND?", opts: ["The backward pass computes gradients with respect to both the layer's input and its weights, costing about twice the forward pass", "It includes the optimizer's update step, which costs 4N", "It accounts for gradient accumulation across microbatches", "Training runs each token through the model three times"], a: 0,
      why: "Forward is 2N. Backward must produce two gradients per layer, one to continue the chain down to the previous layer and one to update the weights, each a matrix multiplication of comparable size, so it is roughly 4N. Two plus four is six. The optimizer update is a cheap elementwise operation and does not change the estimate." },
    { type: "mc", q: "A full AdamW mixed-precision training state costs 18 bytes per parameter. Which item is the largest single contributor?", opts: ["The bf16 weights used for the forward pass", "The fp32 master weights alone", "Adam's two moments together, at eight bytes", "The activation memory"], a: 2,
      why: "Two bytes of bf16 weights, four of fp32 master weights, four of fp32 gradients, and four each for Adam's first and second moments. The two moments together are eight of the eighteen, which is why optimizer state is the first thing ZeRO shards in Chapter 17 and why freezing the base model in Chapter 21 saves so much: the sixteen bytes of gradient and optimizer state then apply to a few million parameters instead of eight billion." },
    { type: "blank", q: "The estimate that training a model costs six floating-point operations per parameter per token is written as ____.", a: ["6nd", "6 n d", "6*n*d"],
      why: "Six FLOPs per parameter per token, times parameters, times tokens. Corvid on 15 trillion tokens comes to 7.227e23 FLOPs, or about 21 days on a thousand GPUs at realistic throughput. It is one multiplication and one division from a spec sheet, which is why every scaling-law argument in Chapter 15 rests on it." },
    { type: "blank", q: "The fp32 copy of the parameters kept during mixed-precision training, so that updates too small to change a bf16 value survive, is called the ____ weights.", a: ["master", "master weights", "fp32 master"],
      why: "A bf16 number has about three decimal digits of precision, so a small update added to a large weight can round away entirely and be lost. Keeping a full-precision copy for the update, and casting down for the forward pass, is what makes mixed precision safe. Chapter 14 covers the rest of that machinery." },
    { type: "mc", q: "Corvid at bf16 needs 17.13 GB to serve one full-context request. What follows for the 16 GB budget?", opts: ["It fits, with 1 GB to spare", "It does not fit at bf16, and quantization is a precondition rather than an optimization", "It fits only if the KV cache is disabled", "It fits at a shorter context, which is the usual fix"], a: 1,
      why: "16.06 GB of weights plus 1.07 GB of cache exceeds the card before any concurrency. Shortening the context helps only slightly, because the weights alone are already 16.06 GB. At 4-bit the same request needs 5.09 GB, which is why Chapter 29 is a keystone rather than a footnote: for this model on this hardware, quantization is what makes it run at all." },
    { type: "order", q: "Order the five sizing questions from the estimation habit:", items: ["what is N, from the config rather than the name", "will the weights fit, at what precision", "what does the KV cache cost per token and per user", "is training 18 bytes per parameter, or an adapter"],
      why: "Parameters first because everything else is derived from them, then weights because if they do not fit nothing else matters, then the cache because on a serving deployment it frequently dominates, then the training question because it decides between sharding and an adapter. Two minutes and a config file, before any download." },
    { type: "mc", q: "You count a model from its config and get 4% more parameters than the published figure. What is the most likely cause?", opts: ["The published figure excludes normalization parameters", "You used the tokenizer's vocabulary rather than the padded config value", "Attention was counted with full-size key and value projections", "The model ties its embeddings and you counted the vocabulary matrix twice"], a: 3,
      why: "Tying is the classic discrepancy, because the vocabulary matrix is often several percent of a model and it is easy to count both the embedding and the output projection when only one exists. Norms are 0.004% and could not produce a 4% gap. Using the tokenizer's smaller vocabulary would make you count too few, not too many, as would shrinking the key and value projections." },
    { type: "mc", q: "Two models have identical parameter counts, but one costs far more to serve. What most likely differs?", opts: ["The number of query heads", "The activation function", "The number of KV heads, the head dimension or the context length, which set the cache", "The vocabulary size"], a: 2,
      why: "Parameter count sets the weight memory and the 2N cost, and says nothing about the KV cache. Chapter 6's formula depends on layers, KV heads, head dimension and precision, none of which is visible in a parameter total. Ranking models by serving cost rather than by size reorders the list, which is the payoff of this chapter's build exercise." }
  ]
});

/* ======================= CHAPTER 10 ======================= */
CHAPTERS.push({
  num: 10, part: 2, title: "Mixture of Experts: Paying for Part of a Model",
  blurb: "A mixture-of-experts model can hold 671 billion parameters and do the arithmetic of 37 billion. The trick is a router that sends each token to a few of many feed-forward networks, and almost everything hard about it follows from one consequence: routing is a scheduling problem, and schedulers can be unbalanced. You will route tokens by hand, watch one expert collapse into taking everything, add the loss that prevents it, and then price the result honestly, because active parameters buy you speed while total parameters still have to live in memory.",
  sections: [
    { title: "Replace One Network With Many",
      html: "<p>Chapter 9 established that the feed-forward network is 80.8% of a block. Chapter 15 will establish that more parameters mean lower loss. Put those together and you get an uncomfortable conclusion: the cheapest way to a better model is a wider feed-forward network, and you pay for every parameter of it on every token.</p>" +
      "<p>Mixture of experts asks whether you have to. The observation is that a given token probably does not need all of that width. Code tokens and poetry tokens may want quite different processing, and a single network has to serve both by being a compromise.</p>" +
      "<p>So: replace the one feed-forward network with several, called <strong>experts</strong>, and add a small <strong>router</strong> that picks a few per token. Every other part of the block is untouched. Attention still runs over all positions with all its parameters; only the feed-forward half becomes conditional.</p>" +
      "<p>The consequence is the point of the whole design. A model with 8 experts holds 8 times the feed-forward parameters, but if the router picks 2, each token's arithmetic touches only 2 of them. Capacity grows with the number of experts; compute grows with the number selected. Those are now two different numbers, and separating them is the entire idea.</p>" +
      "<p>The lineage is older than transformers. Noam Shazeer and colleagues built sparsely-gated mixtures into recurrent networks in 2017, the same year the transformer paper appeared. Google's Switch Transformer made it work at scale in 2021 with the most aggressive possible choice, one expert per token. Mixtral brought it to open weights in 2024, and by 2025 the largest open models were nearly all sparse.</p>" +
      "<div class='fig'><svg viewBox='0 0 760 214' xmlns='http://www.w3.org/2000/svg' font-family='Menlo,monospace'>" +
      "<text x='20' y='18' fill='#2de2ff' font-size='11'>the feed-forward half of a block, dense and sparse</text>" +
      "<rect x='16' y='30' width='340' height='150' rx='8' fill='#111a2e' stroke='#4f7cff' stroke-width='2'/>" +
      "<text x='186' y='52' text-anchor='middle' fill='#4f7cff' font-size='11'>dense</text>" +
      "<rect x='140' y='66' width='92' height='84' rx='6' fill='#111a2e' stroke='#ff5d73' stroke-width='2.5'/>" +
      "<text x='186' y='104' text-anchor='middle' fill='#ff5d73' font-size='10'>one FFN</text>" +
      "<text x='186' y='122' text-anchor='middle' fill='#7d8fb0' font-size='9'>176M params</text>" +
      "<text x='40' y='168' fill='#7d8fb0' font-size='9.5'>every token pays for all of it</text>" +
      "<rect x='388' y='30' width='356' height='150' rx='8' fill='#111a2e' stroke='#3ddc97' stroke-width='2.5'/>" +
      "<text x='566' y='52' text-anchor='middle' fill='#3ddc97' font-size='11'>sparse: 8 experts, top-2</text>" +
      "<rect x='406' y='64' width='40' height='30' rx='4' fill='#111a2e' stroke='#1c2a45' stroke-width='2'/>" +
      "<rect x='450' y='64' width='40' height='30' rx='4' fill='#111a2e' stroke='#ffd166' stroke-width='2.5'/>" +
      "<rect x='494' y='64' width='40' height='30' rx='4' fill='#111a2e' stroke='#1c2a45' stroke-width='2'/>" +
      "<rect x='538' y='64' width='40' height='30' rx='4' fill='#111a2e' stroke='#1c2a45' stroke-width='2'/>" +
      "<rect x='406' y='100' width='40' height='30' rx='4' fill='#111a2e' stroke='#1c2a45' stroke-width='2'/>" +
      "<rect x='450' y='100' width='40' height='30' rx='4' fill='#111a2e' stroke='#1c2a45' stroke-width='2'/>" +
      "<rect x='494' y='100' width='40' height='30' rx='4' fill='#111a2e' stroke='#ffd166' stroke-width='2.5'/>" +
      "<rect x='538' y='100' width='40' height='30' rx='4' fill='#111a2e' stroke='#1c2a45' stroke-width='2'/>" +
      "<text x='600' y='84' fill='#ffd166' font-size='9.5'>gold: chosen for this</text>" +
      "<text x='600' y='118' fill='#7d8fb0' font-size='9.5'>grey: held in memory, idle</text>" +
      "<text x='406' y='152' fill='#3ddc97' font-size='9.5'>1,409M held &#183; 352M used per token</text>" +
      "<text x='406' y='168' fill='#7d8fb0' font-size='9.5'>capacity from the count, compute from the choice</text>" +
      "<text x='20' y='202' fill='#c9d6ea' font-size='10.5'>Attention is unchanged. Only the feed-forward half becomes conditional, because that is where the parameters are.</text>" +
      "</svg><div class='fig-cap'>Measured on Mixtral's configuration: eight experts of 176M each, two selected. The grey boxes are the reason the memory bill does not fall.</div></div>" },

    { title: "The Router", viz: "llmMoeRouter", vizTitle: "Run 200 tokens with balancing off and watch one expert eat the model",
      html: "<p>The router is smaller than everything it controls. For each token it takes the residual stream vector, multiplies it by one matrix of shape <code>d &#215; num_experts</code>, and gets one score per expert.</p>" +
      "<pre><code>scores  = x W_router          # 4,096 -> 8\nchosen  = top_k(scores, k=2)\nweights = softmax(scores[chosen])\noutput  = sum( weights[i] * expert_i(x) for i in chosen )</code></pre>" +
      "<p>Four lines, and the selection step is what names the scheme: <strong>top-k routing</strong>. The router for Mixtral is 4,096 &#215; 8 = 32,768 parameters, controlling 1.4 billion per layer. A rounding error decides where four fifths of the model's capacity gets spent.</p>" +
      "<p>Two details in those lines matter more than they look.</p>" +
      "<p><strong>The softmax is over the chosen experts, not all of them.</strong> Selecting first and normalizing second means the weights on the two picked experts sum to one, so the output magnitude does not depend on how many experts existed.</p>" +
      "<p><strong>The choice is discrete, and discrete choices have no gradient.</strong> Top-k is a hard selection: you cannot differentiate through &#8220;expert 3 was chosen and expert 5 was not&#8221;. What saves it is that the router's weights <em>are</em> in the output as multipliers, so gradient flows to the router through the weight it assigned to each expert it picked. The router learns to raise the weight on experts that helped and lower it on those that did not. It never receives a gradient telling it about an expert it did not choose, and that asymmetry causes the problem in the next section.</p>" },

    { title: "Why Routing Collapses",
      html: "<p>Here is the failure mode, and it is not a bug in an implementation. It is a property of the objective.</p>" +
      "<p>Suppose that early in training, by pure chance, expert 3 is slightly better than the others. The router notices and sends it slightly more tokens. More tokens means more gradient updates, so expert 3 improves faster. Being better, it is chosen more often. The other experts, chosen rarely, receive little gradient and stay near their initialization, which makes them worse relative to expert 3, which makes them chosen even less.</p>" +
      "<p>This is a rich-get-richer loop with nothing opposing it, and it runs to completion quickly. The end state is <strong>routing collapse</strong>: one or two experts handle most traffic and the rest are dead weight. You have paid for eight experts, you are holding eight in memory, and you have trained two.</p>" +
      "<h3>The fix, and what it costs</h3>" +
      "<p>The standard remedy is an <strong>auxiliary load-balancing loss</strong> added to the training objective, which is minimized when tokens are spread evenly across experts. It is a second term alongside the cross-entropy of Chapter 13, with a small coefficient, and the coefficient is a real trade: too small and collapse happens anyway, too large and the router is pushed to balance rather than to route well, which costs quality.</p>" +
      "<p>Note what this means. The model is being explicitly penalized for routing tokens where they would do the most good, in order to keep the parameters it paid for alive. That tension has no clean resolution and it is the central difficulty of training an MoE.</p>" +
      "<p>A second mechanism, from GShard in 2020, handles the same problem at the batch level. Each expert is given a <strong>capacity</strong>, a maximum number of tokens it may accept in one batch. Tokens routed to an expert that is already full suffer <strong>token dropping</strong>: they skip the feed-forward layer entirely and pass through on the residual connection alone. It bounds the memory and compute per expert, which matters enormously for the distributed implementation in section 5, and it means some tokens genuinely get less processing than others. The capacity factor is a tuning knob, and setting it too tight silently degrades quality on exactly the tokens the router thought were most in need of a particular expert.</p>" +
      "<div class='fig'><svg viewBox='0 0 760 218' xmlns='http://www.w3.org/2000/svg' font-family='Menlo,monospace'>" +
      "<text x='20' y='18' fill='#2de2ff' font-size='11'>tokens received by each of 8 experts, after 200 tokens</text>" +
      "<text x='20' y='44' fill='#ff5d73' font-size='10.5'>no balancing loss</text>" +
      "<rect x='150' y='32' width='16' height='16' rx='3' fill='#1c2a45'/>" +
      "<rect x='172' y='32' width='10' height='16' rx='3' fill='#1c2a45'/>" +
      "<rect x='188' y='32' width='300' height='16' rx='3' fill='#ff5d73'/>" +
      "<rect x='494' y='32' width='120' height='16' rx='3' fill='#ffd166'/>" +
      "<rect x='620' y='32' width='8' height='16' rx='3' fill='#1c2a45'/>" +
      "<rect x='634' y='32' width='6' height='16' rx='3' fill='#1c2a45'/>" +
      "<rect x='646' y='32' width='5' height='16' rx='3' fill='#1c2a45'/>" +
      "<rect x='657' y='32' width='4' height='16' rx='3' fill='#1c2a45'/>" +
      "<text x='150' y='68' fill='#ff5d73' font-size='9.5'>two experts take most of the traffic; six are barely trained</text>" +
      "<text x='20' y='108' fill='#3ddc97' font-size='10.5'>with balancing loss</text>" +
      "<rect x='150' y='96' width='62' height='16' rx='3' fill='#3ddc97'/>" +
      "<rect x='218' y='96' width='66' height='16' rx='3' fill='#3ddc97'/>" +
      "<rect x='290' y='96' width='60' height='16' rx='3' fill='#3ddc97'/>" +
      "<rect x='356' y='96' width='68' height='16' rx='3' fill='#3ddc97'/>" +
      "<rect x='430' y='96' width='58' height='16' rx='3' fill='#3ddc97'/>" +
      "<rect x='494' y='96' width='64' height='16' rx='3' fill='#3ddc97'/>" +
      "<rect x='564' y='96' width='62' height='16' rx='3' fill='#3ddc97'/>" +
      "<rect x='632' y='96' width='60' height='16' rx='3' fill='#3ddc97'/>" +
      "<text x='150' y='132' fill='#3ddc97' font-size='9.5'>all eight experts stay alive and keep learning</text>" +
      "<line x1='20' y1='152' x2='740' y2='152' stroke='#1c2a45' stroke-width='2'/>" +
      "<text x='20' y='176' fill='#c9d6ea' font-size='10.5'>The loop is self-reinforcing: chosen more, trained more, therefore better, therefore chosen more.</text>" +
      "<text x='20' y='198' fill='#7d8fb0' font-size='10.5'>The balancing loss opposes it by penalizing the router for routing where it wants to.</text>" +
      "</svg><div class='fig-cap'>Turn the auxiliary loss off in the machine and this is what you get within a couple of hundred tokens.</div></div>" +
      "<p>Run the router machine with balancing off and watch the bars diverge. Then turn it on and run again. That is the discovery, and it is why the coefficient of a term that appears nowhere in the model's forward pass is one of the more consequential hyperparameters in training an MoE.</p>" },

    { title: "Two Bills", viz: "llmActiveVsTotal", vizTitle: "Match a dense and a sparse model on one axis and watch the other diverge",
      html: "<p>Now the honest accounting, because this is where MoE is most often mis-sold.</p>" +
      "<p>Count Mixtral-8x7B from its configuration, using Chapter 9's method. Hidden size 4,096, 32 layers, expert width 14,336, eight experts, top-2 routing, vocabulary 32,000:</p>" +
      "<pre><code>one expert                        176,160,768\neight experts, per layer        1,409,286,144\n\nTOTAL parameters               46,701,744,128   = 46.7B\nACTIVE parameters per token    12,878,876,672   = 12.9B\nratio                                   3.63x</code></pre>" +
      "<p>Those totals match the published figures, which is a good check that the method from Chapter 9 works on an architecture it was not derived for.</p>" +
      "<p>Now convert each into the cost it actually drives:</p>" +
      "<pre><code>what you must hold in memory:  46.7B x 2 bytes  =  93.4 GB\nwhat you pay per token:        2 x 12.9B        =  25.8 GFLOPs</code></pre>" +
      "<p>A dense model with the same per-token arithmetic would have 12.9 billion parameters and need 25.8 GB. Mixtral needs <strong>3.6 times the memory for the same speed</strong>. That is the trade, stated plainly: MoE buys quality per FLOP and pays for it in bytes.</p>" +
      "<p>Which bill matters depends entirely on your situation. If you are compute-bound in training, or latency-bound in serving with plenty of memory, MoE is close to free capacity. If you are memory-bound, which is the normal case on a single card and the reason Chapter 26 exists, MoE is actively the wrong direction: you are holding 93 GB to get the speed of a model that would fit in 26.</p>" +
      "<div class='callout'><strong>How to read a model name.</strong> Qwen3-30B-A3B says it directly: 30 billion total, 3 billion active. Where a name does not, the config does. Two fields give it away: an expert count (<code>num_local_experts</code>, <code>num_experts</code> or <code>n_routed_experts</code>) and <code>num_experts_per_tok</code>. If both are present, the parameter count in the model's name is the memory bill, not the speed.</div>" },

    { title: "The Serving Problem",
      html: "<p>A dense model's weights sit on the GPU and every token uses all of them. An MoE's do not fit that pattern, and the difference shows up as a systems problem rather than a modelling one.</p>" +
      "<p>At frontier scale the experts of a single layer are too large for one device, so they are spread across many. This is <strong>expert parallelism</strong>, and it introduces a communication step that dense models do not have. Each device holds a few experts. A token arriving on device 0 may be routed to an expert on device 5, so before the feed-forward layer every device must send its tokens to wherever their experts live, and afterwards send the results back. That is an <strong>all-to-all</strong> exchange, twice per MoE layer, and it is the dominant cost in a distributed MoE.</p>" +
      "<p>Three consequences follow.</p>" +
      "<p><strong>Interconnect quality decides throughput.</strong> On a machine with fast intra-node links, all-to-all is tolerable. Across slower links between nodes it dominates, and an MoE that trains efficiently on one cluster can be badly inefficient on another with the same total FLOPs.</p>" +
      "<p><strong>Load imbalance costs wall-clock, not just quality.</strong> Every device waits for the slowest. If one expert receives three times its share, its device runs three times as long and everything else idles. This is why expert capacity exists at all: bounding the work per expert bounds the wait.</p>" +
      "<p><strong>Batching behaves differently.</strong> In a dense model, a larger batch reuses the same weights across more tokens, which Chapter 26 shows is exactly what makes batching profitable. In an MoE, a larger batch spreads across more experts, so each expert's matrix multiplication stays small while more of the model gets touched. The efficiency gain from batching is real but weaker, and it is one reason MoE serving stacks are more specialized than dense ones.</p>" },

    { title: "How the Design Changed",
      html: "<p>Three generations of MoE are visible in configuration files, and reading them side by side shows what the field learned.</p>" +
      "<p><strong>Switch Transformer, 2021: fewer choices.</strong> Google went to top-1 routing, one expert per token, on the grounds that it halves the communication and the quality cost is small. It made large MoE training practical and established the auxiliary loss and capacity machinery everything else uses.</p>" +
      "<p><strong>Mixtral, 2024: full-size experts.</strong> Eight experts per layer, top-2, and each expert is a complete feed-forward network at the model's normal width of 14,336. Simple, and it works. The weakness is granularity: with eight coarse experts, the router's choice is blunt, and two experts must between them cover whatever a token needs.</p>" +
      "<p><strong>DeepSeek-V3 and Qwen3, 2024 onward: many small experts, plus a shared one.</strong> Two changes at once, both readable in the configs.</p>" +
      "<p>The first is <strong>fine-grained experts</strong>. DeepSeek-V3 has 256 routed experts with a width of 2,048 against a dense feed-forward width of 18,432; Qwen3-30B-A3B has 128 experts of width 768 against a dense 6,144. The experts are roughly a ninth and an eighth of full size, and eight are selected rather than two. Same active parameters, far more combinations: choosing 8 of 128 gives astronomically more distinct routings than 2 of 8, so specialization can be much finer.</p>" +
      "<p>The second is a <strong>shared expert</strong>: one network every token passes through, in addition to whichever are routed. DeepSeek-V3 has one. The reasoning is that some processing is useful for every token regardless of type, and without a shared expert each specialist has to learn that common part redundantly. Factoring it out lets the routed experts spend their capacity on what actually differs.</p>" +
      "<pre><code>                  experts   top-k   expert width   dense width\nMixtral-8x7B            8       2         14,336        14,336\nQwen3-30B-A3B         128       8            768         6,144\nDeepSeek-V3      256 + 1        8          2,048        18,432</code></pre>" +
      "<div class='fig'><svg viewBox='0 0 760 210' xmlns='http://www.w3.org/2000/svg' font-family='Menlo,monospace'>" +
      "<text x='20' y='18' fill='#2de2ff' font-size='11'>from a few big experts to many small ones (read from configs)</text>" +
      "<text x='20' y='48' fill='#7d8fb0' font-size='10'>Mixtral</text>" +
      "<rect x='120' y='34' width='60' height='18' rx='3' fill='#1c2a45'/><rect x='184' y='34' width='60' height='18' rx='3' fill='#ffd166'/>" +
      "<rect x='248' y='34' width='60' height='18' rx='3' fill='#1c2a45'/><rect x='312' y='34' width='60' height='18' rx='3' fill='#1c2a45'/>" +
      "<rect x='376' y='34' width='60' height='18' rx='3' fill='#ffd166'/><rect x='440' y='34' width='60' height='18' rx='3' fill='#1c2a45'/>" +
      "<rect x='504' y='34' width='60' height='18' rx='3' fill='#1c2a45'/><rect x='568' y='34' width='60' height='18' rx='3' fill='#1c2a45'/>" +
      "<text x='644' y='47' fill='#7d8fb0' font-size='9.5'>8 experts, pick 2</text>" +
      "<text x='20' y='100' fill='#7d8fb0' font-size='10'>Qwen3 / DeepSeek</text>" +
      "<rect x='120' y='86' width='9' height='18' rx='2' fill='#1c2a45'/><rect x='133' y='86' width='9' height='18' rx='2' fill='#ffd166'/>" +
      "<rect x='146' y='86' width='9' height='18' rx='2' fill='#1c2a45'/><rect x='159' y='86' width='9' height='18' rx='2' fill='#1c2a45'/>" +
      "<rect x='172' y='86' width='9' height='18' rx='2' fill='#ffd166'/><rect x='185' y='86' width='9' height='18' rx='2' fill='#1c2a45'/>" +
      "<rect x='198' y='86' width='9' height='18' rx='2' fill='#ffd166'/><rect x='211' y='86' width='9' height='18' rx='2' fill='#1c2a45'/>" +
      "<rect x='224' y='86' width='9' height='18' rx='2' fill='#1c2a45'/><rect x='237' y='86' width='9' height='18' rx='2' fill='#ffd166'/>" +
      "<rect x='250' y='86' width='9' height='18' rx='2' fill='#1c2a45'/><rect x='263' y='86' width='9' height='18' rx='2' fill='#1c2a45'/>" +
      "<rect x='276' y='86' width='9' height='18' rx='2' fill='#ffd166'/><rect x='289' y='86' width='9' height='18' rx='2' fill='#1c2a45'/>" +
      "<rect x='302' y='86' width='9' height='18' rx='2' fill='#1c2a45'/><rect x='315' y='86' width='9' height='18' rx='2' fill='#ffd166'/>" +
      "<text x='340' y='99' fill='#7d8fb0' font-size='9.5'>... 128 or 256 of them, pick 8</text>" +
      "<rect x='120' y='120' width='80' height='18' rx='3' fill='#3ddc97'/>" +
      "<text x='214' y='133' fill='#3ddc97' font-size='9.5'>plus a shared expert every token passes through (DeepSeek-V3)</text>" +
      "<line x1='20' y1='156' x2='740' y2='156' stroke='#1c2a45' stroke-width='2'/>" +
      "<text x='20' y='178' fill='#c9d6ea' font-size='10.5'>Same active parameters either way. Choosing 8 of 128 gives vastly more distinct routings than 2 of 8,</text>" +
      "<text x='20' y='198' fill='#c9d6ea' font-size='10.5'>so specialization can be finer, and a shared expert stops every specialist relearning the common part.</text>" +
      "</svg><div class='fig-cap'>The direction of travel is smaller experts, more of them, more selected, plus something always on. All four numbers are in the config files.</div></div>" },

    { title: "When Not To",
      html: "<p>MoE is not a free upgrade, and four situations argue against it.</p>" +
      "<p><strong>You are memory-bound.</strong> The most common case, and the one section 4 priced. If your constraint is fitting the model at all, a sparse model is strictly worse than a dense one of the same speed. Chapter 26 shows that single-stream decoding is bandwidth-bound, and an MoE moves more bytes for the same output.</p>" +
      "<p><strong>You are fine-tuning.</strong> MoE models are harder to fine-tune well. The router was trained on the pretraining distribution and your data is not that distribution, so it may route badly, and a small dataset gives some experts very few examples. Chapter 21's adapters work, but the literature is thinner and the failure modes are less charted.</p>" +
      "<p><strong>Your serving stack is not built for it.</strong> Expert parallelism, all-to-all, capacity handling and expert-aware batching are real engineering. Chapter 30 covers which engines do it well; if yours does not, measured throughput will not resemble the FLOP count.</p>" +
      "<p><strong>You are small.</strong> The benefit comes from holding capacity you do not pay for per token, and that is only attractive when total capacity is the binding constraint on quality. Below a few billion parameters it usually is not, and the added complexity buys little.</p>" +
      "<div class='callout'><strong>Interview lens.</strong> &#8220;A model advertises 671B parameters and 37B active. What does that tell you about deploying it?&#8221; The complete answer separates the two bills: you must hold 671B worth of weights in memory, roughly 1.3 TB at bf16 and so certainly multi-GPU, while each token costs the arithmetic of a 37B model, so throughput resembles a much smaller model. The follow-up is usually about all-to-all communication, and the thing to say is that expert parallelism makes interconnect bandwidth a first-order concern rather than a detail.</div>" },

    { title: "Exercises",
      html: "<ol>" +
      "<li><strong>Trace.</strong> A model has 32 layers, hidden size 4,096, 16 experts of width 8,192 with top-2 routing, and attention identical to Corvid's. Compute its total parameters and its active parameters, then the ratio. Compute the memory at bf16 and the FLOPs per token. Then state the size of the dense model that would have the same per-token cost, and how much less memory it would need.</li>" +
      "<li><strong>Trace.</strong> The router for that model is a single matrix. Compute its parameter count, and express it as a fraction of the expert parameters it controls. Then explain in two sentences why a component that small can determine most of the model's quality, and why it receives no gradient about experts it did not choose.</li>" +
      "<li><strong>Investigate.</strong> Find three MoE models on the Hub and record the expert count, experts per token, expert width and the dense feed-forward width of a comparable dense model. Compute the ratio of expert width to dense width for each. Order them by release date. You should see the fine-graining trend from section 6 directly in the numbers.</li>" +
      "<li><strong>Investigate.</strong> Take an MoE model and its dense counterpart of similar active-parameter count. Find published benchmark scores for both, and find their memory requirements. Then answer the question a deployment actually poses: at your memory budget, would you rather have the sparse model or a dense model of the size that budget affords? The answer is not the same for every budget, and finding where it flips is the exercise.</li>" +
      "<li><strong>Build.</strong> Implement an MoE feed-forward layer in about forty lines: a router matrix, top-k selection, a softmax over the chosen experts, and a weighted sum of their outputs. Add an auxiliary load-balancing loss and a switch to disable it. Run 500 random tokens through it with the loss off and print the per-expert token counts; you should see collapse. Turn it on and repeat. Then add a capacity limit and count dropped tokens. Assert that with k equal to the expert count and balancing off, the layer reproduces a dense layer's output to within numerical tolerance, because that is what it reduces to.</li>" +
      "</ol>" }
  ],
  terms: [
    { t: "mixture of experts", d: "An architecture replacing a block's single feed-forward network with several, of which a router selects a few per token." },
    { t: "expert", d: "One of the parallel feed-forward networks in an MoE layer; full-width in Mixtral, roughly an eighth of full width in current fine-grained designs." },
    { t: "router", d: "A single small matrix producing one score per expert from the residual stream vector, deciding where each token's computation goes." },
    { t: "top-k routing", d: "Selecting the k highest-scoring experts for a token; k is 1 in Switch, 2 in Mixtral, 8 in DeepSeek-V3 and Qwen3." },
    { t: "active parameters", d: "The parameters a single token's forward pass actually touches, which sets the FLOP cost and the speed." },
    { t: "total parameters", d: "Every parameter the model contains, which sets the memory bill regardless of how few are used per token." },
    { t: "routing collapse", d: "The self-reinforcing failure in which a few experts receive most tokens, are trained most, become best, and are chosen still more." },
    { t: "auxiliary load-balancing loss", d: "An extra training term minimized when tokens spread evenly across experts, opposing collapse at some cost to routing quality." },
    { t: "expert capacity", d: "A per-batch cap on how many tokens one expert may accept, which bounds memory and wait time in a distributed implementation." },
    { t: "token dropping", d: "What happens to a token routed to an expert already at capacity: it skips the feed-forward layer and passes through on the residual connection alone." },
    { t: "expert parallelism", d: "Spreading a layer's experts across devices, which requires sending tokens to wherever their expert lives and back again." },
    { t: "all-to-all", d: "The communication pattern that exchange requires, performed twice per MoE layer and usually the dominant cost in distributed MoE." },
    { t: "fine-grained experts", d: "Using many narrow experts and selecting more of them, which keeps active parameters constant while multiplying the number of distinct routings." },
    { t: "shared expert", d: "An expert every token passes through in addition to the routed ones, so specialists need not each relearn the processing common to all tokens." }
  ],
  quiz: [
    { type: "mc", q: "Mixtral-8x7B has 46.7B total parameters and 12.9B active. What does each number govern?", opts: ["Total governs quality, active governs training cost", "Total governs the memory you must hold, active governs the FLOPs per token", "Total is the untrained count, active is the trained count", "Total governs the download size, active governs the KV cache"], a: 1,
      why: "Every parameter must live in memory whether or not a given token uses it, so total sets the 93.4 GB footprint at bf16. Only the selected experts do arithmetic, so active sets the 25.8 GFLOPs per token. A dense model with the same speed would need 25.8 GB, so Mixtral pays 3.6 times the memory for that speed. The KV cache is set by attention, which MoE does not change." },
    { type: "mc", q: "Why does routing collapse happen without an explicit countermeasure?", opts: ["The router matrix is too small to distinguish experts", "The softmax over experts is numerically unstable", "Experts are initialized identically and cannot differentiate", "An expert chosen slightly more often is trained more, becomes better, and is therefore chosen more; nothing opposes the loop"], a: 3,
      why: "It is a property of the objective, not a bug. A small initial advantage compounds through training, and an expert that is rarely chosen receives little gradient and stays near its initialization. The end state is a model that holds eight experts and has trained two. Experts are initialized differently, which is what supplies the initial random advantage in the first place." },
    { type: "mc", q: "What is uncomfortable about the auxiliary load-balancing loss?", opts: ["It penalizes the router for sending tokens where they would help most, in order to keep paid-for parameters alive", "It is expensive to compute", "It only works with top-1 routing", "It requires a second backward pass"], a: 0,
      why: "The balancing term is minimized by even spreading, and even spreading is not the same as good routing. The model is explicitly pushed away from its best routing decisions so that the experts it holds do not die. The coefficient is a direct trade between the two, with no clean resolution, which is why it is one of the more consequential hyperparameters in MoE training." },
    { type: "mc", q: "A token is routed to an expert already at its capacity for this batch. What happens?", opts: ["The batch is rejected and retried", "It is sent to the next-best expert instead", "It skips the feed-forward layer and passes through on the residual connection alone", "Capacity is expanded dynamically"], a: 2,
      why: "The token is dropped from that layer, which the residual stream makes survivable: it still carries its value forward, having simply received no feed-forward processing at that layer. Capacity exists to bound memory and wait time in a distributed implementation, since every device waits for the slowest. Setting it too tight silently degrades exactly the tokens the router thought most needed a particular expert." },
    { type: "blank", q: "The communication pattern where every device sends tokens to wherever their chosen experts live, performed twice per MoE layer, is called ____.", a: ["all-to-all", "all to all", "alltoall"],
      why: "It is the dominant cost in distributed MoE and the reason interconnect bandwidth becomes a first-order concern rather than a detail. A mixture-of-experts model that trains efficiently on a cluster with fast intra-node links can be badly inefficient on one with slower links between nodes, at identical total FLOPs." },
    { type: "blank", q: "An expert that every token passes through, in addition to whichever experts are routed to it, is called a ____ expert.", a: ["shared"],
      why: "DeepSeek-V3 uses one. The reasoning is that some processing helps every token regardless of type, and without a shared expert each specialist must learn that common part redundantly. Factoring it out lets the routed experts spend their capacity on what actually differs between tokens." },
    { type: "order", q: "Order what happens to one token in an MoE layer:", items: ["the router scores every expert from the token's vector", "the top k experts are selected", "a softmax over just those k produces their weights", "the weighted sum of their outputs is added to the residual stream"],
      why: "Score, select, normalize, combine. Normalizing after selection rather than before is what keeps the output magnitude independent of how many experts exist. The selection itself is discrete and has no gradient, so the router learns only through the weights it assigned to experts it actually chose, which is the asymmetry that causes collapse." },
    { type: "mc", q: "Qwen3 uses 128 experts of width 768 where Mixtral uses 8 of width 14,336, both at similar active parameter counts. What does the change buy?", opts: ["Lower memory, since the experts are smaller", "Elimination of the need for a balancing loss", "Faster all-to-all communication", "Far more distinct routing combinations, so specialization can be much finer"], a: 3,
      why: "Total capacity and active parameters are roughly matched, so memory and speed are not the gain. Choosing 8 of 128 gives astronomically more distinct expert combinations than 2 of 8, letting the model specialize at a much finer grain. Balancing remains necessary, and more experts spread across devices generally makes the communication pattern harder rather than easier." },
    { type: "mc", q: "You are serving on a single 24 GB card and are choosing between a 46.7B MoE with 12.9B active and a dense 13B model. Which consideration dominates?", opts: ["The MoE's better quality per FLOP", "Neither MoE weights nor its cache fit in 24 GB, so the dense model is the only option that runs", "The MoE's router adds unacceptable latency", "The dense model cannot use grouped-query attention"], a: 1,
      why: "The MoE needs 93.4 GB at bf16 for weights alone, so quality per FLOP is irrelevant: it does not run. This is the memory-bound case from section 7, and it is the most common one on a single card. MoE is attractive when compute is the binding constraint and memory is plentiful, which is the opposite of this situation." },
    { type: "mc", q: "Which part of a transformer block does mixture-of-experts replace, and why that part?", opts: ["Attention, because it is the most expensive operation", "The normalization, because it is cheapest to duplicate", "The feed-forward network, because it holds about four fifths of the block's parameters", "The residual connection, because it carries the most information"], a: 2,
      why: "Chapter 9 counted it: the feed-forward network is 80.8% of a block and attention is 19.2%. Making the largest parameter store conditional is where the capacity gain is, and attention must still run over all positions for the mechanism to work at all. The norms are 0.004% of the block, so duplicating them would buy nothing." }
  ]
});

/* ======================= CHAPTER 11 ======================= */
CHAPTERS.push({
  num: 11, part: 2, title: "Reading the Machine: What the Layers Learned",
  blurb: "You have built the block. Now look at what a trained one contains. Interpretability is in this course for a practical reason rather than a philosophical one: when a model behaves strangely, the residual stream is the only place the evidence lives. You will project intermediate layers straight into vocabulary space and watch a prediction form, trace the two-head circuit that copies a repeated pattern, probe for a concept with a linear classifier, and meet the reason a single neuron almost never means one thing.",
  sections: [
    { title: "Asking a Middle Layer What It Thinks", viz: "llmLogitLens", vizTitle: "Step up the layers and watch the model change its mind",
      html: "<p>Chapter 8 established that the residual stream has constant width, 4,096 for Corvid, from the embedding to the final layer. Chapter 4 established that the output projection turns a 4,096-dimensional vector into a distribution over the vocabulary.</p>" +
      "<p>Put those two facts together and something becomes available that is not obvious: the output projection can be applied to the stream at <em>any</em> layer, not just the last. Nothing stops you. The shapes match.</p>" +
      "<p>That is the <strong>logit lens</strong>, described by the pseudonymous researcher nostalgebraist in 2020, and it is the cheapest interpretability tool that exists. Take the stream at layer 12, normalize it, multiply by the output matrix, read the top few tokens. You are asking the model what it would predict if it had to answer now.</p>" +
      "<p>The reported pattern is consistent enough to be worth expecting. Early layers produce near-noise, or tokens related to the input rather than to any answer. Somewhere in the middle the correct answer appears in the top few candidates but not first. Around two thirds of the way up it takes the lead, and the remaining layers sharpen the distribution rather than change its winner.</p>" +
      "<p>The useful consequence is that a prediction is not made at the end. It is assembled gradually, and by the time the last few layers run, the answer is usually settled and they are adjusting confidence.</p>" +
      "<div class='callout'><strong>Sources differ.</strong> The logit lens does not work equally well everywhere. Nora Belrose and colleagues showed in 2023 that on several model families it produces near-nonsense at intermediate layers, because those models' residual streams are not in a basis the final output projection can read until late. Their fix, the tuned lens, learns a small per-layer transformation first. Treat a clean logit-lens result as informative and a messy one as inconclusive rather than as evidence about the model.</div>" +
      "<div class='fig'><svg viewBox='0 0 760 218' xmlns='http://www.w3.org/2000/svg' font-family='Menlo,monospace'>" +
      "<text x='20' y='18' fill='#2de2ff' font-size='11'>top prediction at each layer, for a prompt whose answer is 'Paris'</text>" +
      "<text x='20' y='46' fill='#7d8fb0' font-size='10'>layer 4</text>" +
      "<rect x='110' y='34' width='120' height='16' rx='3' fill='#1c2a45'/><text x='240' y='47' fill='#7d8fb0' font-size='9.5'>fragments of the prompt; no answer yet</text>" +
      "<text x='20' y='78' fill='#7d8fb0' font-size='10'>layer 12</text>" +
      "<rect x='110' y='66' width='120' height='16' rx='3' fill='#1c2a45'/><text x='240' y='79' fill='#7d8fb0' font-size='9.5'>'France', 'the', 'a' &#8212; topic, not answer</text>" +
      "<text x='20' y='110' fill='#ffd166' font-size='10'>layer 20</text>" +
      "<rect x='110' y='98' width='120' height='16' rx='3' fill='#ffd166'/><text x='240' y='111' fill='#ffd166' font-size='9.5'>'Paris' enters the top five, ranked third</text>" +
      "<text x='20' y='142' fill='#3ddc97' font-size='10'>layer 24</text>" +
      "<rect x='110' y='130' width='120' height='16' rx='3' fill='#3ddc97'/><text x='240' y='143' fill='#3ddc97' font-size='9.5'>'Paris' takes the lead &#8212; about two thirds up</text>" +
      "<text x='20' y='174' fill='#3ddc97' font-size='10'>layer 32</text>" +
      "<rect x='110' y='162' width='120' height='16' rx='3' fill='#3ddc97'/><text x='240' y='175' fill='#3ddc97' font-size='9.5'>same answer, now at 0.94 &#8212; confidence, not choice</text>" +
      "<text x='20' y='206' fill='#c9d6ea' font-size='10.5'>The prediction is assembled gradually. The last layers mostly sharpen a decision already made.</text>" +
      "</svg><div class='fig-cap'>The shape to expect, not a specific measurement. Where the crossover sits varies by model and prompt, and on some families the lens is unreadable at all.</div></div>" +
      "<p>Step the machine up the layers on a factual prompt and find the layer where the correct token overtakes the plausible-but-wrong one. Then try a prompt the model gets wrong, and look at whether the right answer was ever in the running. Sometimes it was, and lost, which is a different kind of failure from never having been considered.</p>" },

    { title: "A Circuit Built From Two Heads", viz: "llmInductionHead", vizTitle: "Find the head that fires only on a repeated token",
      html: "<p>Chapter 6 named induction heads and showed what they do. Here is how the mechanism actually works, because it is the best-understood circuit in a language model and it is built from parts you have already assembled.</p>" +
      "<p>The behaviour to explain: given <code>... Ada Lovelace ... Ada</code>, predict <code>Lovelace</code>. Copy what followed the previous occurrence.</p>" +
      "<p>One attention head cannot do this. To find the earlier <code>Ada</code>, a head would have to match the current token against previous tokens, which it can do. But then it needs the token <em>after</em> that match, and attention returns the value at the position it attended to, not the one following it. The information is one position off.</p>" +
      "<p>The solution the model finds uses two heads in different layers, and it is genuinely clever.</p>" +
      "<p><strong>The previous-token head</strong>, in an early layer, does something dull: at every position it attends one step back and writes the previous token's identity into the residual stream. After it runs, every position's vector carries a note saying what came immediately before it.</p>" +
      "<p><strong>The induction head</strong>, in a later layer, reads that note. Its query, formed at the second <code>Ada</code>, is matched against keys that were built from those notes, so it attends to the position whose <em>predecessor</em> was <code>Ada</code>. That position is <code>Lovelace</code>. It copies it.</p>" +
      "<p>Notice what made this possible: the first head wrote into the shared channel and the second head read it. That is the residual stream from Chapter 8 acting as a communication bus between layers, and it is why the framing matters rather than being decoration.</p>" +
      "<h3>The phase change</h3>" +
      "<p>Catherine Olsson and colleagues reported something in 2022 that makes this more than a curiosity. Induction heads do not appear gradually. They form in a narrow window during training, and that window coincides with a visible bump in the loss curve and with the model's sudden acquisition of in-context learning, the ability to pick up a pattern from the prompt with no weight update.</p>" +
      "<p>Few-shot prompting works, at least substantially, because gradient descent independently discovered a copying circuit and built it out of two attention heads. Nobody designed it, and Chapter 13 will show you the loss-curve bump where it happened.</p>" +
      "<div class='fig'><svg viewBox='0 0 760 222' xmlns='http://www.w3.org/2000/svg' font-family='Menlo,monospace'>" +
      "<text x='20' y='18' fill='#2de2ff' font-size='11'>the induction circuit: two heads, two layers, one shared channel</text>" +
      "<rect x='60' y='34' width='60' height='22' rx='4' fill='#111a2e' stroke='#ff5d73' stroke-width='2'/><text x='90' y='49' text-anchor='middle' fill='#ff5d73' font-size='9.5'>Ada</text>" +
      "<rect x='126' y='34' width='84' height='22' rx='4' fill='#111a2e' stroke='#3ddc97' stroke-width='2'/><text x='168' y='49' text-anchor='middle' fill='#3ddc97' font-size='9.5'>Lovelace</text>" +
      "<text x='224' y='49' fill='#7d8fb0' font-size='9.5'>... wrote the first algorithm ...</text>" +
      "<rect x='470' y='34' width='60' height='22' rx='4' fill='#111a2e' stroke='#ff5d73' stroke-width='2'/><text x='500' y='49' text-anchor='middle' fill='#ff5d73' font-size='9.5'>Ada</text>" +
      "<rect x='536' y='34' width='60' height='22' rx='4' fill='#111a2e' stroke='#1c2a45' stroke-width='2' stroke-dasharray='4 3'/><text x='566' y='49' text-anchor='middle' fill='#7d8fb0' font-size='9.5'>?</text>" +
      "<text x='20' y='96' fill='#ff5d73' font-size='10'>early layer</text>" +
      "<text x='120' y='96' fill='#c9d6ea' font-size='10'>previous-token head: every position notes what came before it</text>" +
      "<path d='M168 60 L168 74 L96 74 L96 60' fill='none' stroke='#ff5d73' stroke-width='2'/><polygon points='90,58 96,70 102,70' fill='#ff5d73'/>" +
      "<text x='120' y='114' fill='#7d8fb0' font-size='9.5'>so 'Lovelace' now carries a note: my predecessor was 'Ada'</text>" +
      "<text x='20' y='150' fill='#2de2ff' font-size='10'>later layer</text>" +
      "<text x='120' y='150' fill='#c9d6ea' font-size='10'>induction head: attends to whichever position's note says 'Ada'</text>" +
      "<path d='M500 62 Q340 20 176 32' fill='none' stroke='#2de2ff' stroke-width='2'/><polygon points='170,34 180,26 180,38' fill='#2de2ff'/>" +
      "<text x='120' y='168' fill='#3ddc97' font-size='9.5'>and copies it: the prediction is 'Lovelace'</text>" +
      "<line x1='20' y1='186' x2='740' y2='186' stroke='#1c2a45' stroke-width='2'/>" +
      "<text x='20' y='210' fill='#c9d6ea' font-size='10.5'>Head one wrote into the residual stream; head two read it. That is the stream working as a bus between layers.</text>" +
      "</svg><div class='fig-cap'>Neither head can do this alone: attention returns the value at the position it attended to, not the one after it. The note is what closes the gap.</div></div>" },

    { title: "Asking Whether a Concept Is There",
      html: "<p>A different question: does the model represent some property at all? Not which token it will predict, but whether the information is present somewhere in the stream.</p>" +
      "<p>The standard tool is a <strong>probe</strong>, and it is deliberately unimpressive. Collect the residual stream vectors at some layer for many inputs, label each input with the property you care about, and train a linear classifier to predict the label from the vector. If it succeeds well above the label's base rate, the information was linearly available at that layer.</p>" +
      "<p>Probes have found a great deal: part of speech, syntactic depth, sentiment, whether a statement is true, the colour of an object under discussion. Running the same probe at every layer gives an accuracy curve, and the layer where accuracy rises tells you where the model computed it.</p>" +
      "<h3>What a probe does not prove</h3>" +
      "<p>Two failures are worth naming, because the technique is easy to over-read.</p>" +
      "<p><strong>A successful probe does not show the model uses the information.</strong> It shows the information is decodable. Those are different claims, and the second does not follow. The property may be an incidental correlate that no downstream component reads.</p>" +
      "<p><strong>A sufficiently powerful probe can find anything.</strong> John Hewitt and Percy Liang made this precise in 2019 with control tasks: take your probe, apply it to <em>random</em> labels, and see how well it does. A probe that can fit random labels is memorizing rather than reading, and its success on your real labels means nothing. The remedy is to keep the probe as weak as possible, usually linear, and to report the control-task baseline alongside the result.</p>" +
      "<p>The general rule is one to carry beyond this chapter: a method that can find structure in noise has not found structure.</p>" +
      "<div class='fig'><svg viewBox='0 0 760 200' xmlns='http://www.w3.org/2000/svg' font-family='Menlo,monospace'>" +
      "<text x='20' y='18' fill='#2de2ff' font-size='11'>probe accuracy by layer, with its control-task baseline</text>" +
      "<line x1='70' y1='150' x2='700' y2='150' stroke='#1c2a45' stroke-width='2'/>" +
      "<line x1='70' y1='36' x2='70' y2='150' stroke='#1c2a45' stroke-width='2'/>" +
      "<text x='30' y='42' fill='#7d8fb0' font-size='9'>100%</text><text x='34' y='154' fill='#7d8fb0' font-size='9'>50%</text>" +
      "<path d='M90 138 L200 130 L310 96 L420 58 L530 50 L640 52' fill='none' stroke='#3ddc97' stroke-width='3'/>" +
      "<text x='560' y='40' fill='#3ddc97' font-size='9.5'>the probe</text>" +
      "<path d='M90 146 L200 145 L310 144 L420 145 L530 143 L640 145' fill='none' stroke='#ff5d73' stroke-width='2.5' stroke-dasharray='5 4'/>" +
      "<text x='430' y='138' fill='#ff5d73' font-size='9.5'>the same probe, random labels</text>" +
      "<text x='84' y='166' fill='#7d8fb0' font-size='9'>layer 4</text><text x='300' y='166' fill='#7d8fb0' font-size='9'>layer 16</text>" +
      "<text x='612' y='166' fill='#7d8fb0' font-size='9'>layer 32</text>" +
      "<text x='20' y='192' fill='#c9d6ea' font-size='10.5'>The gap between the lines is the result. Without the red line, the green one is uninterpretable.</text>" +
      "</svg><div class='fig-cap'>Where accuracy rises tells you where the model computed the property. A control line that also rises means your probe is memorizing.</div></div>" },

    { title: "Why a Neuron Means Several Things",
      html: "<p>The obvious way to understand a network is to look at individual neurons. Find the dimension that fires on French text, and you have found the French dimension.</p>" +
      "<p>It does not work. Inspect neurons in a real model and most fire on collections of things with no evident relationship: a neuron responds to legal citations, to a species of bird, and to a particular punctuation pattern. This is <strong>polysemanticity</strong>, and for years it was treated as a nuisance.</p> " +
      "<p>The explanation, developed by Nelson Elhage and colleagues in 2022, is a counting argument. A model has 4,096 dimensions per position and needs to represent far more than 4,096 distinct things about language. If features had to be orthogonal, 4,096 would be the hard ceiling.</p>" +
      "<p>They do not have to be orthogonal, only <em>nearly</em> so. In a high-dimensional space you can pack far more than d almost-orthogonal directions, and the interference between them is small enough to tolerate, especially since only a few features are active at once. So the model stores more features than it has dimensions, at the cost of slight crosstalk. That is <strong>superposition</strong>, and once you see it, polysemantic neurons stop being a puzzle: a neuron is not a feature, it is a coordinate that several features happen to project onto.</p>" +
      "<h3>Undoing it</h3>" +
      "<p>If features are directions in a space rather than individual neurons, the task is to recover the directions. The current approach is a <strong>sparse autoencoder</strong>: train a small network to reconstruct the residual stream through a much wider intermediate layer with a strong sparsity penalty, so only a few of its units may be active for any input. Those units, being forced to be sparse, tend to land on individual interpretable features rather than mixtures.</p>" +
      "<p>The work here has been striking, with millions of interpretable features recovered from production models, and it is genuinely early. Reconstruction is imperfect, features vary with the training run, and how much of the model any feature set explains is an open question. Treat it as an active research direction rather than a solved tool.</p>" +
      "<div class='fig'><svg viewBox='0 0 760 196' xmlns='http://www.w3.org/2000/svg' font-family='Menlo,monospace'>" +
      "<text x='20' y='18' fill='#2de2ff' font-size='11'>more features than dimensions, drawn in 2-D</text>" +
      "<line x1='40' y1='150' x2='240' y2='150' stroke='#1c2a45' stroke-width='2'/>" +
      "<line x1='140' y1='50' x2='140' y2='170' stroke='#1c2a45' stroke-width='2'/>" +
      "<line x1='140' y1='150' x2='220' y2='150' stroke='#3ddc97' stroke-width='3'/>" +
      "<line x1='140' y1='150' x2='140' y2='70' stroke='#3ddc97' stroke-width='3'/>" +
      "<text x='40' y='184' fill='#3ddc97' font-size='9.5'>2 orthogonal directions: the hard limit</text>" +
      "<line x1='420' y1='150' x2='620' y2='150' stroke='#1c2a45' stroke-width='2'/>" +
      "<line x1='520' y1='50' x2='520' y2='170' stroke='#1c2a45' stroke-width='2'/>" +
      "<line x1='520' y1='150' x2='600' y2='150' stroke='#ffd166' stroke-width='2.5'/>" +
      "<line x1='520' y1='150' x2='590' y2='112' stroke='#ffd166' stroke-width='2.5'/>" +
      "<line x1='520' y1='150' x2='560' y2='82' stroke='#ffd166' stroke-width='2.5'/>" +
      "<line x1='520' y1='150' x2='520' y2='70' stroke='#ffd166' stroke-width='2.5'/>" +
      "<line x1='520' y1='150' x2='478' y2='82' stroke='#ffd166' stroke-width='2.5'/>" +
      "<line x1='520' y1='150' x2='450' y2='112' stroke='#ffd166' stroke-width='2.5'/>" +
      "<text x='420' y='184' fill='#ffd166' font-size='9.5'>6 nearly-orthogonal: small interference</text>" +
      "<text x='300' y='104' fill='#7d8fb0' font-size='10'>a neuron is a</text>" +
      "<text x='300' y='120' fill='#7d8fb0' font-size='10'>coordinate axis,</text>" +
      "<text x='300' y='136' fill='#7d8fb0' font-size='10'>not a feature</text>" +
      "</svg><div class='fig-cap'>Only a few features are active at once, so the crosstalk between overlapping directions rarely matters. Polysemantic neurons are the visible symptom of this packing.</div></div>" },

    { title: "What This Buys You on a Tuesday",
      html: "<p>None of this is required to ship a product, and most of it is a research field rather than a toolkit. Three things from it are directly useful when something is wrong, and they share a premise: the residual stream is the only place the evidence lives.</p>" +
      "<p><strong>Did the model ever consider the right answer?</strong> The logit lens separates two failures that look identical from outside. If the correct token was ranked highly at layer 20 and lost by layer 32, something later in the stack suppressed it, and prompt changes or a decoding change may recover it. If it never appeared at any layer, the model does not have the knowledge and no amount of prompting will conjure it. That is a retrieval or fine-tuning problem, and the distinction decides which chapter you go to next.</p>" +
      "<p><strong>Is the model copying or reasoning?</strong> Induction heads copy from context. When a model gets a few-shot task right, checking whether attention at the answer position is dominated by the matching example tells you whether you have taught it a pattern or merely handed it something to copy. The two behave very differently when the input drifts away from the examples.</p>" +
      "<p><strong>Is the information present but unused?</strong> A probe that succeeds where behaviour fails means the model encoded what you need and the later layers did not act on it. That is a promising fine-tuning target, because you are teaching the model to use something it already computes rather than to compute something new, and the first is much cheaper than the second.</p>" +
      "<div class='callout'><strong>Interview lens.</strong> &#8220;How would you find out why a model gives a wrong answer?&#8221; Most candidates describe prompt variations. A stronger answer adds evidence from inside: apply the output projection at intermediate layers to see whether the correct token was ever a candidate, and check what the final position attends to. It separates &#8220;knew and lost it&#8221; from &#8220;never knew&#8221;, which are different bugs with different fixes.</div>" },

    { title: "Exercises",
      html: "<ol>" +
      "<li><strong>Trace.</strong> Explain, in four sentences, why a single attention head cannot implement induction. Say precisely what it can find, what it needs next, and why attention's output makes the second unavailable. Then state what the previous-token head writes into the residual stream that closes the gap.</li>" +
      "<li><strong>Trace.</strong> A model has 4,096 dimensions. Someone claims it can represent at most 4,096 distinct features. State the assumption behind that claim, say why it fails, and give the two conditions that make superposition workable. Then explain what a polysemantic neuron is, in terms of coordinates and directions.</li>" +
      "<li><strong>Investigate.</strong> Take any open model you can run and implement the logit lens: hook the residual stream at each layer, apply the final normalization and the output projection, and print the top five tokens per layer for a factual prompt. Find the layer where the correct answer first enters the top five and the layer where it takes the lead. Then repeat on a prompt the model gets wrong, and record whether the correct token ever appeared.</li>" +
      "<li><strong>Investigate.</strong> Train a linear probe on that model's layer-16 activations for a binary property of your choosing, using a few hundred labelled examples. Report its accuracy. Then run the identical probe against randomly shuffled labels and report that accuracy too. If the second number is not near the base rate, your probe is too powerful and the first number means nothing.</li>" +
      "<li><strong>Build.</strong> Write a residual-stream inspector in about sixty lines: given a model and a prompt, return per layer the top five logit-lens tokens, the norm of the stream, and the attention pattern of a chosen head at the final position. Use it on three prompts, one the model answers well, one it answers wrongly, and one that is ambiguous. Write down what differs between them. This is the debugging tool section 5 describes, and it is worth having before you need it.</li>" +
      "</ol>" }
  ],
  terms: [
    { t: "interpretability", d: "The study of what a trained network computes internally, as opposed to what it outputs." },
    { t: "logit lens", d: "Applying the model's output projection to the residual stream at an intermediate layer, to see what it would predict if it had to answer there." },
    { t: "tuned lens", d: "A refinement that learns a small per-layer transformation first, for models whose intermediate streams the raw logit lens cannot read." },
    { t: "previous-token head", d: "An early-layer head that attends one position back and writes the preceding token's identity into the residual stream." },
    { t: "induction head", d: "A later-layer head that reads those notes to find where the current token appeared before, and copies what followed it." },
    { t: "circuit", d: "A set of components across layers that together implement one behaviour, communicating through the residual stream." },
    { t: "phase change", d: "The abrupt formation of induction heads during a narrow window of training, coinciding with a bump in the loss curve and the arrival of in-context learning." },
    { t: "probe", d: "A small classifier trained on intermediate activations to test whether some property is linearly decodable at that layer." },
    { t: "control task", d: "Running the same probe against random labels to check it is reading rather than memorizing; a probe that fits noise proves nothing on real labels." },
    { t: "polysemanticity", d: "The observation that a single neuron typically fires on several unrelated things rather than one coherent concept." },
    { t: "superposition", d: "Storing more features than there are dimensions by using nearly-orthogonal directions, accepting slight interference because few features are active at once." },
    { t: "feature", d: "A direction in activation space corresponding to a concept, which is generally not aligned with any single neuron." },
    { t: "sparse autoencoder", d: "A wide, heavily sparsity-penalized network trained to reconstruct activations, whose units tend to land on individual interpretable features." }
  ],
  quiz: [
    { type: "mc", q: "What makes the logit lens possible at all?", opts: ["Intermediate layers are trained with an auxiliary output loss", "The residual stream has constant width, so the output projection's shapes match at every layer", "Each layer keeps a copy of the final layer's weights", "The model normalizes activations identically at every depth"], a: 1,
      why: "Chapter 8's constant-width residual stream is what makes it work: the output projection expects a 4,096-dimensional vector and every layer's stream is one. No auxiliary training is involved, and nothing about the model was designed to permit this. It is a consequence of the architecture that happens to be useful." },
    { type: "mc", q: "Why can a single attention head not implement induction?", opts: ["A single head lacks enough parameters", "The causal mask prevents attending to earlier positions", "Softmax cannot represent exact matching", "It can find the earlier occurrence of the current token, but attention returns the value at the attended position rather than the one after it"], a: 3,
      why: "Finding the earlier 'Ada' is straightforward. The problem is that the useful token is the one after it, and attention hands back the value at the position it attended to. The previous-token head closes the gap by writing each position's predecessor into the residual stream, so the induction head can attend to whichever position's note says 'Ada' and land on 'Lovelace'." },
    { type: "mc", q: "A probe achieves 92% accuracy predicting a property from layer-16 activations. What have you shown?", opts: ["The property is linearly decodable at layer 16, which does not establish that anything downstream reads it", "The model uses that property when producing its output", "The property is computed at layer 16 specifically", "The model would fail at its task without that property"], a: 0,
      why: "Decodable and used are different claims, and the second does not follow from the first. The property might be an incidental correlate no later component consults. Running the probe at every layer tells you where it becomes decodable, and only an intervention, such as removing the direction and observing the behaviour change, supports a claim about use." },
    { type: "mc", q: "Why must a probe be reported alongside a control task?", opts: ["To measure the probe's inference latency", "To establish statistical significance of the accuracy figure", "Because a sufficiently powerful probe can fit random labels, in which case its success on real labels means nothing", "Because activations differ between training and inference"], a: 2,
      why: "Hewitt and Liang's 2019 point: take the identical probe, give it randomly shuffled labels, and see how well it does. If it can fit noise it is memorizing rather than reading the representation, and its performance on your real labels carries no information about the model. Keeping the probe linear and reporting the control baseline is the standard remedy." },
    { type: "blank", q: "Storing more features than there are dimensions, using nearly-orthogonal directions and tolerating slight interference, is called ____.", a: ["superposition"],
      why: "A model has 4,096 dimensions and far more than 4,096 things to represent. Strict orthogonality would cap it at 4,096, but near-orthogonality does not, and because only a few features are active at once the crosstalk rarely matters. This is why individual neurons are polysemantic: a neuron is a coordinate axis that several feature directions project onto." },
    { type: "blank", q: "Applying the model's output projection to the residual stream at an intermediate layer is called the logit ____.", a: ["lens"],
      why: "Described by nostalgebraist in 2020, and the cheapest interpretability tool there is. It shows that a prediction is assembled gradually rather than decided at the end: the correct token typically takes the lead around two thirds of the way up, and the remaining layers sharpen confidence rather than change the winner." },
    { type: "order", q: "Order the steps of the induction circuit:", items: ["an early head attends one position back and writes each token's predecessor into the stream", "a later head forms a query at the repeated token", "that query matches the position whose recorded predecessor is the repeated token", "the value at that position, the continuation, is copied"],
      why: "Write the note, form the query, match on the note, copy the continuation. The circuit only works because the first head's output travels to the second through the residual stream, which is Chapter 8's shared channel being used as a bus between layers rather than as a metaphor." },
    { type: "mc", q: "A model answers a factual question wrongly. The logit lens shows the correct token ranked second at layer 22 and absent from the top ten at layer 32. What does that suggest?", opts: ["The model lacks the knowledge and needs fine-tuning or retrieval", "The tokenizer split the answer badly", "The probe was too powerful", "The model had the answer and something in the later layers suppressed it"], a: 3,
      why: "The correct token was a live candidate mid-stack and lost afterwards, which is a different failure from never having appeared. It suggests a prompt change or a decoding change might recover it. Had the token been absent at every layer, the diagnosis would be the opposite and no amount of prompting would help. Separating these two is the main practical value of the technique." },
    { type: "mc", q: "What did Olsson and colleagues find about when induction heads form?", opts: ["They are present from initialization and merely sharpen", "They form gradually across the whole training run", "They form in a narrow window that coincides with a bump in the loss curve and the arrival of in-context learning", "They only form during fine-tuning"], a: 2,
      why: "The formation is abrupt rather than gradual, and it lines up with a visible feature of the loss curve and with the model suddenly being able to pick up patterns from its prompt without any weight update. It is the strongest available evidence that few-shot prompting works because gradient descent independently discovered a copying circuit." },
    { type: "mc", q: "Why does a sparse autoencoder use a much wider hidden layer than the activations it reconstructs?", opts: ["Because there are more features in superposition than there are dimensions, so recovering them needs more units than the original width", "To improve reconstruction accuracy through redundancy", "To match the feed-forward expansion ratio of the model", "Because sparsity penalties require overparameterization to converge"], a: 0,
      why: "The premise of superposition is that the model packs more features than dimensions. Recovering them one per unit therefore requires more units than the model has dimensions, and the sparsity penalty is what pushes each unit onto a single feature rather than a mixture. The work is genuinely early: reconstruction is imperfect and feature sets vary between training runs." }
  ]
});

/* ======================= CHAPTER 12 ======================= */
CHAPTERS.push({
  num: 12, part: 3, title: "What a Model Reads: Building a Pretraining Corpus",
  blurb: "The most consequential decisions in a model are made before training starts, by whoever chose the data. You will follow a web dump through the pipeline that turns it into a token stream: extraction, language identification, quality filtering, deduplication, and the step nobody notices until a benchmark score is embarrassing. Then the harder questions. What mixture of web, code, books and mathematics, in what order, and what happens when a model trains on text that another model wrote.",
  sections: [
    { title: "Where Trillions of Tokens Come From",
      html: "<p>Chapter 15 will show that a model of Corvid's size wants something like fifteen trillion training tokens. It is worth pausing on how much text that is. Every English book ever published is a small fraction of it. There is exactly one source at that scale, and it is the web.</p>" +
      "<p><strong>Common Crawl</strong> is the starting point for nearly every open corpus: a non-profit that has crawled the web monthly since 2008 and publishes the results. It is enormous, free, and mostly garbage. Navigation menus, cookie banners, spam, machine translation, template boilerplate repeated across a million pages. The work is not obtaining it but surviving it.</p>" +
      "<p>Four other sources are added deliberately, each for a specific capability.</p>" +
      "<ul>" +
      "<li><strong>Code</strong>, usually from public repositories. It buys more than the ability to write code: code is highly structured, unambiguous and full of long-range dependencies, and models trained with more of it tend to do better at reasoning tasks that involve no code at all.</li>" +
      "<li><strong>Books</strong>, for long-form coherence. A book sustains an argument across hundreds of pages, which almost nothing on the web does, and it is where a model learns what a sustained structure looks like. This is also the legally hardest category, which section 8 returns to.</li>" +
      "<li><strong>Mathematics and scientific papers</strong>, for symbolic manipulation and formal argument.</li>" +
      "<li><strong>Reference and encyclopedic text</strong>, small in volume and heavily upweighted, because its density of factual statements per token is unmatched.</li>" +
      "</ul>" +
      "<p>The open corpora worth knowing by name, because you will meet them constantly: <strong>C4</strong>, the cleaned crawl behind T5, which established the heuristic-filtering approach; <strong>The Pile</strong>, 825 gibibytes across 22 deliberately chosen sub-corpora, which established that a curated mixture beats raw web; <strong>RefinedWeb</strong>, which argued that aggressively filtered web alone can match curated mixtures; <strong>Dolma</strong> and <strong>FineWeb</strong>, which are the current large open corpora and, unusually, publish their filtering decisions and the ablations behind them.</p>" +
      "<p>That last point matters more than it sounds. For most frontier models the data mixture is the least disclosed part of the system. FineWeb and Dolma are valuable partly as datasets and partly as the only public record of what the choices actually cost.</p>" },

    { title: "From HTML to Text", viz: "llmCorpusPipeline", vizTitle: "Step the pipeline and look at what each filter throws away",
      html: "<p>The first stage is unglamorous and decides more than it should.</p>" +
      "<p><strong>Extraction</strong> pulls the text out of the markup. A naive strip-the-tags approach yields navigation, footers, cookie notices and the same legal boilerplate on every page of a site. Purpose-built extractors try to find the main content block, and they are imperfect in ways that leak downstream: a page whose article is split across several divs may lose half of it, and a comment section may be kept as if it were the article.</p>" +
      "<p><strong>Language identification</strong> assigns a language and a confidence to each document. Anything below a threshold is dropped. This is where multilingual capability is quietly decided: a threshold tuned for high-resource languages discards a disproportionate share of the low-resource text it is least able to identify, which compounds the tokenizer inflation Chapter 2 measured.</p>" +
      "<p><strong>Basic cleaning</strong> then removes documents that are too short to carry anything, that are mostly punctuation or numbers, that have broken encoding, or that consist mostly of a repeated line.</p>" +
      "<p>None of this is interesting, and all of it is load-bearing. The single most common cause of a bad small model is not the architecture; it is that the corpus was 40% navigation menus.</p>" },

    { title: "Filtering for Quality",
      html: "<p>What survives extraction is still mostly not worth training on. Two families of filter reduce it, and they make opposite trades.</p>" +
      "<p><strong>Heuristic filters</strong> are hand-written rules, most of them descended from the Gopher paper's list: a document must have between 50 and 100,000 words; its mean word length must fall in a plausible range; fewer than 90% of lines may start with a bullet; at least 80% of words must contain an alphabetic character; a stop-word check must pass. Each rule targets a specific kind of junk, they are cheap, and they are auditable, which matters when you have to explain what your corpus is.</p>" +
      "<p><strong>Classifier filters</strong> train a small model to score documents, usually against a reference set treated as high quality. FineWeb-Edu is the best-documented example: a classifier scores each page for educational value and only the high scorers are kept. The result is a much smaller corpus that trains better models per token.</p>" +
      "<p>The trade is real. Heuristics are transparent and blunt. Classifiers are effective and opaque, and they impose whatever the reference set considered good, which is a value judgement wearing a statistical costume. A classifier trained to prefer textbook prose will quietly discard forum discussions, dialect, and technical writing that does not resemble a textbook, and nothing in the pipeline reports that it did.</p>" +
      "<p>What FineWeb's published ablations demonstrated is that these decisions are worth more than they look: filtering choices alone moved downstream benchmark scores by margins comparable to substantial changes in model size. Data work is not preparation for the real work. It is the highest-leverage work available.</p>" +
      "<div class='fig'><svg viewBox='0 0 760 214' xmlns='http://www.w3.org/2000/svg' font-family='Menlo,monospace'>" +
      "<text x='20' y='18' fill='#2de2ff' font-size='11'>what survives each stage (the shape of a real pipeline)</text>" +
      "<rect x='60' y='32' width='640' height='20' rx='3' fill='#4f7cff'/><text x='60' y='68' fill='#7d8fb0' font-size='9.5'>raw crawl</text>" +
      "<rect x='60' y='72' width='384' height='20' rx='3' fill='#4f7cff'/><text x='60' y='108' fill='#7d8fb0' font-size='9.5'>after extraction and language ID</text>" +
      "<rect x='60' y='112' width='230' height='20' rx='3' fill='#ffd166'/><text x='60' y='148' fill='#7d8fb0' font-size='9.5'>after quality filtering</text>" +
      "<rect x='60' y='152' width='138' height='20' rx='3' fill='#3ddc97'/><text x='60' y='188' fill='#7d8fb0' font-size='9.5'>after deduplication</text>" +
      "<text x='470' y='47' fill='#7d8fb0' font-size='9.5'>menus, boilerplate, spam</text>" +
      "<text x='470' y='87' fill='#7d8fb0' font-size='9.5'>wrong language, too short, broken</text>" +
      "<text x='330' y='127' fill='#ffd166' font-size='9.5'>fails the heuristics or the classifier</text>" +
      "<text x='240' y='167' fill='#3ddc97' font-size='9.5'>seen before, often hundreds of times</text>" +
      "<text x='20' y='206' fill='#c9d6ea' font-size='10.5'>Proportions vary by pipeline; the shape does not. Most of the web does not survive, and that is the intent.</text>" +
      "</svg><div class='fig-cap'>Each bar is what remains. The interesting question at every stage is not what survived but what was discarded, and whether you would agree with the choice.</div></div>" },

    { title: "Removing What You Have Already Read",
      html: "<p>The web repeats itself relentlessly. The same article is syndicated across fifty sites, the same licence text appears on a million pages, the same product description is generated for every item in a catalogue.</p>" +
      "<p>Duplication is not a tidiness problem. Katherine Lee and colleagues showed in 2021 that removing duplicates makes models measurably better: they memorize less, they emit training data verbatim less often, and they reach the same loss in fewer steps. Duplicated text is effectively upweighted, so a model trained on an undeduplicated corpus spends its capacity memorizing boilerplate.</p>" +
      "<p><strong>Exact deduplication</strong> is easy: hash each document, keep one per hash. It catches almost nothing, because near-identical documents differ by a timestamp or a single word.</p>" +
      "<p><strong>Near-duplicate detection</strong> is the real work. Cut each document into overlapping word sequences called shingles, and measure the Jaccard similarity of the shingle sets, which is the size of their intersection over the size of their union. Comparing every pair is impossible at trillions of documents, so <strong>MinHash</strong>, from Andrei Broder in 1997, estimates that similarity from a short signature: hash the shingles many times, keep the minimum each time, and the fraction of matching signature entries estimates the Jaccard similarity.</p>" +
      "<h3>Measure it, and find the limit</h3>" +
      "<p>Three sentences, computed on 6 September 2026. The first is a refund policy. The second is the same sentence with one word changed. The third says the same thing in different words.</p>" +
      "<pre><code>                        true Jaccard    MinHash-128 estimate\none word changed               0.750                   0.773\na genuine paraphrase           0.000                   0.000\nan unrelated sentence          0.000                   0.000</code></pre>" +
      "<p>Two things follow, and the second is the one that gets missed.</p>" +
      "<p>MinHash works: 0.773 against a true 0.750, from a 128-number signature instead of a full comparison. That is the whole reason the technique scales.</p>" +
      "<p>And near-duplicate detection <strong>cannot see paraphrase at all</strong>. A sentence restating the same content in different words scores exactly zero, indistinguishable from a sentence about railway history. Every deduplication pipeline in production has this property. Your corpus may contain the same fact ten thousand times, in ten thousand phrasings, and the deduplicator will report it as ten thousand distinct documents.</p>" +
      "<p>The threshold is the other trap. A cutoff of 0.7 removes the one-word variant; a cutoff of 0.8 keeps it. Nothing in the pipeline tells you which side of the line your near-duplicates fell on, and published corpora differ in this choice.</p>" +
      "<div class='fig'><svg viewBox='0 0 760 208' xmlns='http://www.w3.org/2000/svg' font-family='Menlo,monospace'>" +
      "<text x='20' y='18' fill='#2de2ff' font-size='11'>similarity to the original sentence (measured 2026-09-06)</text>" +
      "<line x1='300' y1='30' x2='300' y2='150' stroke='#7d8fb0' stroke-width='2' stroke-dasharray='4 4'/>" +
      "<text x='252' y='168' fill='#7d8fb0' font-size='9'>0.7 cutoff</text>" +
      "<line x1='356' y1='30' x2='356' y2='150' stroke='#ffd166' stroke-width='2' stroke-dasharray='4 4'/>" +
      "<text x='366' y='168' fill='#ffd166' font-size='9'>0.8 cutoff</text>" +
      "<text x='20' y='52' fill='#7d8fb0' font-size='10'>one word changed</text>" +
      "<rect x='160' y='40' width='150' height='16' rx='3' fill='#ffd166'/><text x='430' y='53' fill='#ffd166' font-size='9.5'>0.750 &#183; removed at 0.7, kept at 0.8</text>" +
      "<text x='20' y='88' fill='#7d8fb0' font-size='10'>a paraphrase</text>" +
      "<rect x='160' y='76' width='2' height='16' rx='1' fill='#ff5d73'/><text x='430' y='89' fill='#ff5d73' font-size='9.5'>0.000 &#183; kept at every threshold</text>" +
      "<text x='20' y='124' fill='#7d8fb0' font-size='10'>an unrelated sentence</text>" +
      "<rect x='160' y='112' width='2' height='16' rx='1' fill='#1c2a45'/><text x='430' y='125' fill='#7d8fb0' font-size='9.5'>0.000 &#183; kept, correctly</text>" +
      "<line x1='20' y1='184' x2='740' y2='184' stroke='#1c2a45' stroke-width='2'/>" +
      "<text x='20' y='202' fill='#c9d6ea' font-size='10.5'>The paraphrase and the unrelated sentence are indistinguishable on this measure. That is the limit, not a bug.</text>" +
      "</svg><div class='fig-cap'>MinHash-128 estimated 0.773 against the true 0.750. It is accurate about what it can see, and blind to meaning.</div></div>" },

    { title: "The Step Nobody Notices", viz: "llmContamination", vizTitle: "Set the n-gram size and watch benchmark questions appear in the clean corpus",
      html: "<p>Now the failure that produces published, confident, wrong results.</p>" +
      "<p>Benchmarks live on the web. Their questions appear in papers, in blog posts explaining them, in leaderboard repositories, in forum threads where someone pastes the whole set. So a corpus scraped from the web contains the evaluation sets people will use to judge the model trained on it. That is <strong>contamination</strong>, and the resulting score measures memorization rather than capability.</p>" +
      "<p><strong>Decontamination</strong> is the pass that removes it: take each evaluation set, and drop any training document sharing a long enough n-gram with it. The mechanism is simple. The parameter is not.</p>" +
      "<h3>The parameter is the whole method</h3>" +
      "<p>One benchmark-style question, one trivia page that contains it, and three choices of n, computed on 6 September 2026:</p>" +
      "<pre><code>n-gram size    overlapping n-grams found    verdict\n         8                            8    flagged\n        13                            3    flagged\n        20                            0    missed</code></pre>" +
      "<p>The contaminated document is identical at every setting. What changes is whether you notice. A 20-gram check on this document returns clean, and a pipeline reporting that result is not lying: it genuinely found no 20-gram overlap. It simply asked a question too specific to catch the thing that was there.</p>" +
      "<p>Now consider the direction of the incentives. Contamination inflates scores. Decontamination is done by the same team that reports the scores. A looser check finds more contamination and requires discarding more data. Nobody has to act in bad faith for this to go wrong systematically, which is why Chapter 32 treats a benchmark number without a decontamination protocol as an unverified claim.</p>" +
      "<p>And a real limit: none of this catches paraphrased contamination, for exactly the reason in the last section. A benchmark question reworded in a blog post is invisible to every n-gram check, and it teaches the model the answer just as effectively.</p>" +
      "<div class='fig'><svg viewBox='0 0 760 196' xmlns='http://www.w3.org/2000/svg' font-family='Menlo,monospace'>" +
      "<text x='20' y='18' fill='#2de2ff' font-size='11'>the same contaminated document, three decontamination settings</text>" +
      "<text x='20' y='48' fill='#3ddc97' font-size='10'>n = 8</text>" +
      "<rect x='110' y='36' width='300' height='16' rx='3' fill='#3ddc97'/><text x='424' y='49' fill='#3ddc97' font-size='9.5'>8 overlaps &#183; flagged and removed</text>" +
      "<text x='20' y='80' fill='#ffd166' font-size='10'>n = 13</text>" +
      "<rect x='110' y='68' width='113' height='16' rx='3' fill='#ffd166'/><text x='424' y='81' fill='#ffd166' font-size='9.5'>3 overlaps &#183; flagged and removed</text>" +
      "<text x='20' y='112' fill='#ff5d73' font-size='10'>n = 20</text>" +
      "<rect x='110' y='100' width='3' height='16' rx='2' fill='#ff5d73'/><text x='424' y='113' fill='#ff5d73' font-size='9.5'>0 overlaps &#183; reported clean</text>" +
      "<line x1='20' y1='134' x2='740' y2='134' stroke='#1c2a45' stroke-width='2'/>" +
      "<text x='20' y='158' fill='#c9d6ea' font-size='10.5'>The document did not change. Only the question did. A stricter check reports a cleaner corpus,</text>" +
      "<text x='20' y='178' fill='#c9d6ea' font-size='10.5'>and the team choosing the check is the team reporting the score.</text>" +
      "</svg><div class='fig-cap'>Decontamination is not a step that either happens or does not. It is a threshold, chosen by someone with an interest in the answer.</div></div>" },

    { title: "Mixtures and Order",
      html: "<p>You now have several cleaned pools. How much of each, and in what order?</p>" +
      "<p><strong>Domain weights</strong> decide the proportions, and they are not the natural proportions. Web text dominates by volume and is downweighted; reference text is a rounding error by volume and heavily upweighted; code is included far above its share of human writing because of what it does for reasoning. The weights are usually tuned by training small models on candidate mixtures and comparing, which is affordable at small scale and is how most published mixtures were found.</p>" +
      "<p><strong>Order</strong> turns out to matter too, and this is more recent. The naive approach shuffles everything uniformly. The current practice does not: many runs finish with an <strong>annealing</strong> phase, where the last few percent of training uses a much higher proportion of high-quality data, at a decaying learning rate. The reasoning is that late training does refinement rather than bulk learning, so the final tokens should be the best ones you have.</p>" +
      "<p><strong>Mid-training</strong> is the same idea applied to a capability: a distinct phase between pretraining and fine-tuning that injects a large amount of one domain, such as mathematics or long documents, to install an ability the general mixture would not produce. It is where most long-context capability now comes from, which connects directly to Chapter 7's scaling machinery: extending the position encoding provides the mechanism, and a mid-training phase on long documents provides the ability to use it.</p>" +
      "<div class='fig'><svg viewBox='0 0 760 220' xmlns='http://www.w3.org/2000/svg' font-family='Menlo,monospace'>" +
      "<text x='20' y='18' fill='#2de2ff' font-size='11'>natural volume versus mixture weight (the shape, not one model's numbers)</text>" +
      "<text x='20' y='46' fill='#7d8fb0' font-size='10'>web</text>" +
      "<rect x='130' y='34' width='500' height='14' rx='3' fill='#4f7cff'/>" +
      "<rect x='130' y='52' width='300' height='14' rx='3' fill='#3ddc97'/><text x='646' y='46' fill='#7d8fb0' font-size='9'>downweighted</text>" +
      "<text x='20' y='94' fill='#7d8fb0' font-size='10'>code</text>" +
      "<rect x='130' y='82' width='40' height='14' rx='3' fill='#4f7cff'/>" +
      "<rect x='130' y='100' width='150' height='14' rx='3' fill='#3ddc97'/><text x='300' y='112' fill='#3ddc97' font-size='9'>upweighted for reasoning</text>" +
      "<text x='20' y='142' fill='#7d8fb0' font-size='10'>books, papers</text>" +
      "<rect x='130' y='130' width='24' height='14' rx='3' fill='#4f7cff'/>" +
      "<rect x='130' y='148' width='90' height='14' rx='3' fill='#3ddc97'/><text x='240' y='160' fill='#3ddc97' font-size='9'>upweighted for long-form structure</text>" +
      "<text x='20' y='190' fill='#7d8fb0' font-size='10'>reference</text>" +
      "<rect x='130' y='178' width='5' height='14' rx='2' fill='#4f7cff'/>" +
      "<rect x='130' y='196' width='46' height='14' rx='3' fill='#3ddc97'/><text x='196' y='208' fill='#3ddc97' font-size='9'>heavily upweighted: facts per token</text>" +
      "<rect x='560' y='176' width='12' height='9' rx='2' fill='#4f7cff'/><text x='578' y='184' fill='#7d8fb0' font-size='9'>share of the raw pool</text>" +
      "<rect x='560' y='192' width='12' height='9' rx='2' fill='#3ddc97'/><text x='578' y='200' fill='#7d8fb0' font-size='9'>share of training tokens</text>" +
      "</svg><div class='fig-cap'>The mixture is never the natural proportions. Weights are usually found by training small models on candidate mixtures and comparing.</div></div>" },

    { title: "Text Written by Models",
      html: "<p>An obvious idea, given how expensive good data is: generate more with a model.</p>" +
      "<p>It works, in specific and bounded ways. <strong>Synthetic data</strong> is now standard for instruction tuning, where Chapter 20 covers it, and for domains where a verifier exists: generate mathematical problems and keep the ones whose solutions check out, generate code and keep what passes its tests. The verifier is what makes it sound, because it breaks the circularity by supplying information the generator did not have.</p>" +
      "<p>Without a verifier the picture is worse. Ilia Shumailov and colleagues published a result in Nature in 2024 on <strong>model collapse</strong>: train a model on the output of a previous model, repeat, and the distribution degrades in a specific pattern. The tails go first. Rare constructions, unusual facts and minority phrasings vanish, because a generator samples from the high-probability region and its output under-represents the tails. Trained on that output, the next model's tails are thinner still. After several generations the model produces fluent, plausible, narrow text and has forgotten the long tail of what language contains.</p>" +
      "<p>The practical consequence is now unavoidable rather than hypothetical: the web after 2023 contains a growing and unlabelled share of model-generated text. Every corpus scraped from it is partly synthetic whether or not its builders intended that, and nobody has a reliable detector. This is one of the genuinely open problems in the field, and any claim to have solved it should be read carefully.</p>" +
      "<div class='callout'><strong>Interview lens.</strong> &#8220;Can we just generate more training data?&#8221; The answer that lands distinguishes the two cases. With a verifier, yes, and it is standard practice, because the checker adds information the generator lacked. Without one you are resampling your own distribution, which sharpens the head and erodes the tail, and repeating it collapses the model onto its own most probable outputs. The follow-up is what happens when the web is already partly synthetic, and the honest answer is that nobody knows yet.</div>" },

    { title: "Whose Text Is It",
      html: "<p>Pretraining corpora are assembled from text written by people who were not asked. That is the situation, stated plainly, and it produces three distinct problems that are often muddled together.</p>" +
      "<p><strong>Copyright.</strong> Whether training on copyrighted work is permitted is unsettled and is being litigated in several jurisdictions with different answers so far. Books are the sharpest case, because they are the most valuable category per token and the most clearly owned. A practical consequence: some widely used corpora contain material whose status is contested, and building on them carries a risk that is neither zero nor quantified.</p>" +
      "<p><strong>Consent and control.</strong> Separate from ownership. A site may permit copying and still object to being training data, and the mechanisms for expressing that are weak: robots.txt was designed for search crawlers and is honoured inconsistently for training crawls, and no reliable mechanism exists at all for text already collected.</p>" +
      "<p><strong>Personal data.</strong> Crawled text contains names, addresses, medical details and credentials, and Nicholas Carlini and colleagues showed in 2021 that models can be induced to emit training data verbatim. Deduplication reduces this substantially, which is one of the strongest practical arguments for it, and does not eliminate it.</p>" +
      "<p>What is checkable is licensing of the corpus itself, and it is worth doing. Read from the Hugging Face dataset pages on 6 September 2026: FineWeb, FineWeb-Edu and Dolma are all published under ODC-BY. That governs the collection, not the underlying documents, and the distinction is the thing to be precise about when someone asks whether a corpus is safe to use.</p>" +
      "<p>Model cards are where this is supposed to be disclosed. Most say very little. When a card describes a corpus as &#8220;a diverse mixture of publicly available data&#8221;, that sentence carries no information, and reading it as reassurance is a mistake.</p>" },

    { title: "Exercises",
      html: "<ol>" +
      "<li><strong>Trace.</strong> Take two sentences that differ by one word, and compute their 5-word shingle sets by hand, then their Jaccard similarity. Then rewrite one sentence as a paraphrase with no shared 5-word run and compute again. State what score a near-duplicate pipeline assigns to each, and what that implies about how much genuinely redundant content survives deduplication.</li>" +
      "<li><strong>Trace.</strong> A team reports that their corpus is decontaminated against a benchmark using 20-gram matching. Using section 5, write three sentences on what that guarantees and what it does not, and name two ways a benchmark question could still be in the corpus.</li>" +
      "<li><strong>Investigate.</strong> Open the FineWeb or Dolma documentation and find the filter list. Pick three filters and, for each, write down what junk it targets and what legitimate text it would also remove. Then find whether the publishers report an ablation for it. Most pipelines do not, and knowing which decisions are evidence-backed and which are inherited convention is the point.</li>" +
      "<li><strong>Investigate.</strong> Take three model cards from different organizations and record exactly what each says about training data: sources, sizes, filtering, decontamination, licences. Rank them by how much a reader could act on. Then check whether the least informative card belongs to the strongest model, which will tell you something about the relationship between disclosure and capability.</li>" +
      "<li><strong>Build.</strong> Write a miniature corpus pipeline in about eighty lines over a few thousand documents: strip markup, drop documents outside a length range, apply two heuristic quality rules, then deduplicate with 5-word shingles and MinHash. Report survival rate at each stage and print twenty documents each stage removed. Then add an n-gram decontamination pass against a small evaluation set of your own, run it at n = 8, 13 and 20, and report how many documents each setting removes. You should reproduce the shape of both measured tables in this chapter.</li>" +
      "</ol>" }
  ],
  terms: [
    { t: "Common Crawl", d: "The non-profit monthly web crawl that is the starting point for nearly every open pretraining corpus." },
    { t: "extraction", d: "Recovering the main text from a web page's markup, discarding navigation, footers and boilerplate; imperfect in ways that leak downstream." },
    { t: "language identification", d: "Assigning a language and confidence to each document; the threshold quietly decides how multilingual the model will be." },
    { t: "heuristic filter", d: "A hand-written rule about length, word statistics or line structure, cheap and auditable, most of them descended from the Gopher paper's list." },
    { t: "classifier filter", d: "A small model scoring documents against a reference set treated as high quality; effective, opaque, and a value judgement in statistical form." },
    { t: "shingle", d: "An overlapping fixed-length word sequence cut from a document, used as the unit of near-duplicate comparison." },
    { t: "Jaccard similarity", d: "The size of the intersection over the size of the union of two shingle sets; the standard near-duplicate measure." },
    { t: "MinHash", d: "Estimating Jaccard similarity from a short signature of minimum hash values, which is what makes deduplication feasible at web scale." },
    { t: "near-duplicate detection", d: "Removing documents that are almost identical; it catches word-level copies and scores a genuine paraphrase at zero." },
    { t: "contamination", d: "Evaluation data present in the training corpus, which turns a benchmark score into a measurement of memorization." },
    { t: "decontamination", d: "Removing training documents that share a long enough n-gram with an evaluation set; the choice of n determines what is found." },
    { t: "domain weights", d: "The proportions of each source in the final mixture, deliberately different from their natural volumes and usually tuned on small models." },
    { t: "annealing", d: "Finishing a training run with a high proportion of high-quality data at a decaying learning rate, on the reasoning that late training refines." },
    { t: "mid-training", d: "A distinct phase between pretraining and fine-tuning that injects one domain heavily to install a capability, and where most long-context ability now comes from." },
    { t: "synthetic data", d: "Training text generated by a model; sound where a verifier can check it, and circular where none exists." },
    { t: "model collapse", d: "The degradation from repeatedly training on model output, in which the distribution's tails thin first and rare constructions disappear." }
  ],
  quiz: [
    { type: "mc", q: "Why does deduplication make a model better rather than merely smaller?", opts: ["It removes low-quality documents, which are usually the duplicated ones", "Duplicated text is effectively upweighted, so the model spends capacity memorizing boilerplate and emits training data verbatim more often", "It improves the tokenizer's merge table", "It reduces the vocabulary size needed"], a: 1,
      why: "Lee and colleagues measured it in 2021: deduplicated models memorize less, reproduce training text less often, and reach the same loss in fewer steps. A document appearing five hundred times is five hundred gradient updates toward reproducing it, regardless of its quality. Deduplication is also one of the strongest practical mitigations for training-data extraction." },
    { type: "mc", q: "A near-duplicate pipeline scores a one-word-changed sentence at 0.750 Jaccard and a genuine paraphrase at 0.000. What follows?", opts: ["The paraphrase detector needs a lower threshold", "MinHash is estimating the similarity incorrectly", "Deduplication removes copies, not restatements, so semantically redundant content survives in unknown quantity", "The shingle length should be increased"], a: 2,
      why: "Zero is the true Jaccard similarity, not an estimation error: the paraphrase shares no 5-word run with the original, so it is formally as different as a sentence about railway history. No threshold can distinguish it from unrelated text on this measure. Every production deduplication pipeline has this property, and it means a corpus may contain the same fact ten thousand times in ten thousand phrasings and report ten thousand distinct documents." },
    { type: "mc", q: "The same contaminated document is flagged at n=8 and n=13 but reported clean at n=20. What does that show?", opts: ["The document was only partially contaminated", "20-gram matching is more accurate and the earlier flags were false positives", "The evaluation set was too short to match", "The choice of n determines what is found, and a stricter check reports a cleaner corpus without the corpus being cleaner"], a: 3,
      why: "The document did not change; only the question did. A pipeline reporting no 20-gram overlap is not lying, it asked something too specific to catch what was there. Since contamination inflates scores and the team choosing n is the team reporting the scores, the incentives point one way without anyone acting in bad faith, which is why Chapter 32 treats a benchmark number without a stated protocol as unverified." },
    { type: "mc", q: "Why is code included in pretraining mixtures far above its share of human writing?", opts: ["Because it is structured, unambiguous and full of long-range dependencies, and models trained with more of it do better on reasoning tasks involving no code", "Because most model users are programmers", "Because it is cheaper to obtain than books", "Because it tokenizes more efficiently"], a: 0,
      why: "The benefit is not confined to coding ability. Code enforces exact structure over long spans in a way prose rarely does, and the effect on general reasoning is why mixtures upweight it. Chapter 3 showed code tokenizes worse than prose, not better, so efficiency is an argument against including it rather than for." },
    { type: "blank", q: "Estimating the similarity of two documents from short signatures of minimum hash values, rather than comparing them directly, is called ____.", a: ["minhash", "min-hash", "min hash"],
      why: "Comparing every pair of documents at web scale is impossible, so Broder's 1997 technique estimates Jaccard similarity from a fixed-size signature. Measured here: a 128-permutation signature estimated 0.773 against a true similarity of 0.750, from 128 numbers rather than a full set comparison. That efficiency is what makes deduplication feasible at trillions of documents." },
    { type: "blank", q: "Finishing a training run with a much higher proportion of high-quality data at a decaying learning rate is called ____.", a: ["annealing"],
      why: "The reasoning is that late training refines rather than learns in bulk, so the last tokens a model sees should be the best available. It replaced the older assumption that the corpus should simply be shuffled uniformly, and it is closely related to mid-training, which applies the same idea to install a specific capability." },
    { type: "order", q: "Order the stages of a pretraining data pipeline:", items: ["extract text from markup and identify the language", "apply heuristic and classifier quality filters", "deduplicate near-identical documents", "remove documents overlapping the evaluation sets"],
      why: "Extract, filter, deduplicate, decontaminate. Decontamination comes last because it is the most expensive per document and there is no point running it against text you are going to discard anyway. Each stage removes a large fraction, and at every one the interesting question is what was thrown away rather than what survived." },
    { type: "mc", q: "What distinguishes synthetic data that works from synthetic data that causes model collapse?", opts: ["The size of the generating model", "Whether the data is labelled as synthetic", "The temperature used during generation", "Whether a verifier can check the generated output, supplying information the generator did not have"], a: 3,
      why: "Generating mathematical problems and keeping those whose solutions check out, or code that passes its tests, adds real information because the checker knows something the generator did not. Without a verifier you are resampling your own distribution: the head sharpens, the tails thin, and repeating it erodes exactly the rare constructions that made the original corpus valuable." },
    { type: "mc", q: "A model card describes its training data as 'a diverse mixture of publicly available sources'. What should you conclude?", opts: ["The corpus is primarily Common Crawl", "The data is licensed for commercial use", "Nothing; the sentence carries no actionable information", "The team followed standard filtering practice"], a: 2,
      why: "It names no source, no size, no filter, no decontamination protocol and no licence. Reading it as reassurance is the mistake. For most frontier models the data mixture is the least disclosed part of the system, which is part of why the open corpora that do publish their filtering decisions and ablations are valuable beyond the data itself." },
    { type: "mc", q: "A team's classifier filter keeps only text scoring highly for educational value. What is the cost they may not have measured?", opts: ["It discards forum discussion, dialect and technical writing that does not resemble a textbook, and nothing reports that it did", "The corpus becomes too small to train on", "Slower pipeline throughput", "It biases the tokenizer's merge table"], a: 0,
      why: "A classifier imposes whatever its reference set treated as good, which is a value judgement expressed statistically. The filtering is effective, which is why it is used, and it is opaque about what it removes. Heuristic filters make the opposite trade: blunt, but you can read the rule and predict what it will catch." }
  ]
});

/* ======================= CHAPTER 13 ======================= */
CHAPTERS.push({
  num: 13, part: 3, title: "Learning to Predict: The Training Loop",
  blurb: "Training a language model is one loop with four lines in it, and every one is worth understanding exactly. You will see how a batch of token ids becomes a loss, why the labels are just the inputs shifted by one, what teacher forcing makes easy and what it leaves unsolved, and how perplexity is nothing more than the exponential of that loss. Then you will read loss curves the way a doctor reads a chart, because most of debugging a training run is knowing what a shape means.",
  sections: [
    { title: "The Labels Are Already There",
      html: "<p>Supervised learning needs labels, and labelling trillions of tokens is impossible. The reason language models could be trained at all is that the labels were never needed: <strong>the next token is the label</strong>.</p>" +
      "<p>Take a sequence of token ids. The input is the sequence; the target is the same sequence shifted one position left. Position 0 predicts position 1, position 1 predicts position 2, and so on. One array, used twice, with an offset.</p>" +
      "<pre><code>ids     [ 791,  6864,   315,  9822,   374, 12366 ]\ninputs  [ 791,  6864,   315,  9822,   374 ]\ntargets [ 6864,  315,  9822,   374, 12366 ]</code></pre>" +
      "<p>This is <strong>self-supervised learning</strong>: the supervision comes from the structure of the data rather than from an annotator. Every document is simultaneously input and answer key, which is what made scale possible.</p>" +
      "<p>Two practical details shape the data loader around it.</p>" +
      "<p><strong>Packing.</strong> Documents vary in length and the model wants fixed-size sequences. Padding short documents wastes computation on padding tokens, so most pipelines concatenate documents end to end with a separator and cut the stream into equal blocks. Nothing is wasted, and the cost is that a block usually straddles a document boundary, so the model sometimes predicts the start of one document from the end of an unrelated one. At scale this is treated as acceptable noise; some pipelines mask attention across the boundary to avoid it, at some complexity.</p>" +
      "<p><strong>The last position has no target.</strong> A block of 8,192 ids yields 8,191 predictions. Off-by-one errors here are the classic first bug when writing a training loop, and Chapter 37 makes you write it.</p>" +
      "<div class='fig'><svg viewBox='0 0 760 196' xmlns='http://www.w3.org/2000/svg' font-family='Menlo,monospace'>" +
      "<text x='20' y='18' fill='#2de2ff' font-size='11'>one array, used twice, offset by one</text>" +
      "<text x='20' y='52' fill='#7d8fb0' font-size='10'>inputs</text>" +
      "<rect x='96' y='38' width='96' height='22' rx='4' fill='#111a2e' stroke='#4f7cff' stroke-width='2'/><text x='144' y='53' text-anchor='middle' fill='#c9d6ea' font-size='9.5'>The</text>" +
      "<rect x='198' y='38' width='96' height='22' rx='4' fill='#111a2e' stroke='#4f7cff' stroke-width='2'/><text x='246' y='53' text-anchor='middle' fill='#c9d6ea' font-size='9.5'>capital</text>" +
      "<rect x='300' y='38' width='96' height='22' rx='4' fill='#111a2e' stroke='#4f7cff' stroke-width='2'/><text x='348' y='53' text-anchor='middle' fill='#c9d6ea' font-size='9.5'>of</text>" +
      "<rect x='402' y='38' width='96' height='22' rx='4' fill='#111a2e' stroke='#4f7cff' stroke-width='2'/><text x='450' y='53' text-anchor='middle' fill='#c9d6ea' font-size='9.5'>France</text>" +
      "<rect x='504' y='38' width='96' height='22' rx='4' fill='#111a2e' stroke='#4f7cff' stroke-width='2'/><text x='552' y='53' text-anchor='middle' fill='#c9d6ea' font-size='9.5'>is</text>" +
      "<line x1='144' y1='64' x2='144' y2='84' stroke='#ffd166' stroke-width='2'/><polygon points='144,90 138,78 150,78' fill='#ffd166'/>" +
      "<line x1='246' y1='64' x2='246' y2='84' stroke='#ffd166' stroke-width='2'/><polygon points='246,90 240,78 252,78' fill='#ffd166'/>" +
      "<line x1='348' y1='64' x2='348' y2='84' stroke='#ffd166' stroke-width='2'/><polygon points='348,90 342,78 354,78' fill='#ffd166'/>" +
      "<line x1='450' y1='64' x2='450' y2='84' stroke='#ffd166' stroke-width='2'/><polygon points='450,90 444,78 456,78' fill='#ffd166'/>" +
      "<line x1='552' y1='64' x2='552' y2='84' stroke='#ffd166' stroke-width='2'/><polygon points='552,90 546,78 558,78' fill='#ffd166'/>" +
      "<text x='20' y='110' fill='#7d8fb0' font-size='10'>targets</text>" +
      "<rect x='96' y='96' width='96' height='22' rx='4' fill='#111a2e' stroke='#3ddc97' stroke-width='2'/><text x='144' y='111' text-anchor='middle' fill='#3ddc97' font-size='9.5'>capital</text>" +
      "<rect x='198' y='96' width='96' height='22' rx='4' fill='#111a2e' stroke='#3ddc97' stroke-width='2'/><text x='246' y='111' text-anchor='middle' fill='#3ddc97' font-size='9.5'>of</text>" +
      "<rect x='300' y='96' width='96' height='22' rx='4' fill='#111a2e' stroke='#3ddc97' stroke-width='2'/><text x='348' y='111' text-anchor='middle' fill='#3ddc97' font-size='9.5'>France</text>" +
      "<rect x='402' y='96' width='96' height='22' rx='4' fill='#111a2e' stroke='#3ddc97' stroke-width='2'/><text x='450' y='111' text-anchor='middle' fill='#3ddc97' font-size='9.5'>is</text>" +
      "<rect x='504' y='96' width='96' height='22' rx='4' fill='#111a2e' stroke='#3ddc97' stroke-width='2'/><text x='552' y='111' text-anchor='middle' fill='#3ddc97' font-size='9.5'>Paris</text>" +
      "<line x1='20' y1='140' x2='740' y2='140' stroke='#1c2a45' stroke-width='2'/>" +
      "<text x='20' y='162' fill='#c9d6ea' font-size='10.5'>Five inputs, five targets, one array. The causal mask from Chapter 5 is what makes all five</text>" +
      "<text x='20' y='182' fill='#c9d6ea' font-size='10.5'>predictions computable in a single forward pass without any of them seeing its own answer.</text>" +
      "</svg><div class='fig-cap'>Self-supervision in one picture. The labels were in the data all along, one position to the right.</div></div>" },

    { title: "One Number Per Position", viz: "llmLossStep", vizTitle: "Step a training step; click a position to see what the model got wrong",
      html: "<p>The model produces a distribution over 128,256 tokens at every position. The target is one token. Turning that into a single number is <strong>cross-entropy</strong>, and for a single correct answer it collapses to something very simple: take the probability the model assigned to the true token, and take the negative logarithm.</p>" +
      "<pre><code>loss = -ln( p[true token] )</code></pre>" +
      "<p>Nothing else in the distribution enters directly. The other 128,255 probabilities matter only because they had to come out of the same softmax. The units are worth naming: a natural logarithm gives the loss in nats, and dividing by ln 2 gives bits per token. <strong>Nats and bits</strong> both appear in the literature, and this course quotes nats unless it says otherwise.</p>" +
      "<h3>Work it</h3>" +
      "<p>A toy vocabulary of six, and a model that is confidently wrong. Logits out of the final projection, computed on 6 September 2026:</p>" +
      "<pre><code>token        logit    probability\nParis         2.10         0.2035    <- the true token\nthe           0.40         0.0372\nbanana       -1.20         0.0075\nLondon        3.30         0.6755    <- what the model prefers\na             0.90         0.0613\nxylophone    -0.50         0.0151\n\nloss = -ln(0.2035) = 1.5923</code></pre>" +
      "<p>The model put two thirds of its mass on <em>London</em> and a fifth on the correct answer. The loss of 1.59 records exactly that: not a catastrophe, since the right answer was a live candidate, but far from free.</p>" +
      "<h3>The three anchors worth memorizing</h3>" +
      "<p>Cross-entropy is easier to read once you know a few reference points, all computed for Corvid's 128,256-token vocabulary.</p>" +
      "<pre><code>situation                              loss\na uniform guess over the vocabulary   11.762   <- where an untrained model starts\nthe true token at p = 0.94             0.062   <- confident and right\nthe true token at p = 1e-6            13.816   <- confident and wrong</code></pre>" +
      "<p>Read the first and third together. <strong>Being confidently wrong is worse than knowing nothing.</strong> A model that assigns a millionth of its probability to the correct token scores 13.82, above the 11.76 of a model that has learned absolutely nothing and spreads its mass evenly. Cross-entropy punishes confident error harder than ignorance, which is exactly the behaviour you want and the reason models trained this way are cautious in unfamiliar territory rather than assertive.</p>" +
      "<p>The batch loss is the mean of these per-position values, typically over hundreds of thousands of positions at once, so the number on your dashboard is an average over an enormous number of small judgements.</p>" },

    { title: "Teacher Forcing, and the Bill It Defers",
      html: "<p>Look again at what the loss computes. At every position the model predicts the next token given <em>the true previous tokens</em>, not given what it would itself have produced. This is <strong>teacher forcing</strong>, and it is what makes the whole scheme efficient.</p>" +
      "<p>Without it, training would have to generate a token, feed it back, generate the next, and so on, which is sequential and slow, and early in training the generated prefix is garbage so the model learns to continue garbage. Teacher forcing makes every position independent given the true prefix, so the causal mask from Chapter 5 lets one forward pass compute all of them at once.</p>" +
      "<p>The bill arrives at inference. At generation time there is no true prefix. The model conditions on its own output, and it has never practised that. If it produces a slightly unusual token at step 40, step 41 is now conditioned on a prefix unlike anything in training, which makes another odd token slightly more likely. This is <strong>exposure bias</strong>, and it is a real contributor to the failure where a long generation drifts, loops, or degrades in a way the loss curve never predicted.</p>" +
      "<p>Nobody has a clean fix. Scheduled sampling, which mixes in the model's own predictions during training, has been tried repeatedly and is not standard. The practical answers live elsewhere in this course: better decoding in Chapter 18, and preference training in Chapters 22 and 23, which optimizes whole responses the model actually generated rather than single next tokens on a fixed prefix.</p>" +
      "<div class='callout'><strong>The connection worth holding.</strong> Almost every limitation in Part IV traces back to this section. The pretraining objective scores one token at a time against a true prefix. It has no way to express that a whole answer was unhelpful, that a response should have been refused, or that a chain of reasoning went wrong at step three. Everything from supervised fine-tuning to DPO exists because cross-entropy on next tokens cannot say those things.</div>" },

    { title: "Perplexity",
      html: "<p>The metric quoted everywhere, and it is the loss wearing different units. <strong>Perplexity</strong> is the exponential of the mean cross-entropy.</p>" +
      "<pre><code>perplexity = exp(loss)</code></pre>" +
      "<p>The interpretation is the useful part: perplexity is the <em>effective branching factor</em>. A perplexity of 20 means the model is about as uncertain as if it were choosing uniformly among 20 equally likely tokens at each step. Lower is better; the floor is 1, meaning certainty.</p>" +
      "<p>Computed for Corvid's vocabulary:</p>" +
      "<pre><code>loss (nats)   bits/token    perplexity\n     11.76        16.97       128,256   <- untrained: the whole vocabulary\n      6.00         8.66           403\n      4.00         5.77            55\n      3.00         4.33            20\n      2.00         2.89           7.4\n      1.70         2.45           5.5   <- a good model on held-out web text</code></pre>" +
      "<p>The first row is worth pausing on. An untrained model's loss is exactly ln(V), and its perplexity is exactly the vocabulary size, because a uniform distribution over 128,256 tokens is precisely as uncertain as a choice among 128,256 options. That is a free sanity check: <strong>if your training run does not start near 11.76, something is wrong before a single gradient step.</strong> The usual causes are a mismatched vocabulary size, an initialization scale error, or labels that are not shifted correctly.</p>" +
      "<h3>What it does not measure</h3>" +
      "<p>Four things, and they are the reason Chapter 32 exists.</p>" +
      "<ul>" +
      "<li><strong>It is not comparable across tokenizers.</strong> Perplexity is per token, and Chapter 2 showed the same text is 12 tokens under one tokenizer and 133 under another. Two models with different vocabularies cannot be compared on it, and papers that do so are making an error.</li>" +
      "<li><strong>It is not comparable across corpora.</strong> Perplexity on your own domain and on generic web text are different numbers about different things.</li>" +
      "<li><strong>It does not measure usefulness.</strong> A model can have excellent perplexity and refuse to follow instructions, because instruction-following is not what the objective rewarded.</li>" +
      "<li><strong>It is dominated by easy tokens.</strong> Most tokens in any text are predictable function words. The mean is mostly them, so a large change on the few tokens that carry the meaning barely moves it. This is why a quantization change in Chapter 29 can leave perplexity flat while a task evaluation falls off a cliff.</li>" +
      "</ul>" +
      "<p>Perplexity is an excellent instrument for one job: watching whether your own training run, on your own tokenizer and your own held-out split, is improving. Outside that, treat it as weak evidence.</p>" +
      "<div class='fig'><svg viewBox='0 0 760 210' xmlns='http://www.w3.org/2000/svg' font-family='Menlo,monospace'>" +
      "<text x='20' y='18' fill='#2de2ff' font-size='11'>loss and perplexity for a 128,256-token vocabulary (computed)</text>" +
      "<text x='20' y='44' fill='#ff5d73' font-size='10'>11.76 nats</text>" +
      "<rect x='140' y='32' width='560' height='16' rx='3' fill='#ff5d73'/><text x='150' y='45' fill='#0b1120' font-size='9.5'>perplexity 128,256 &#183; untrained: the whole vocabulary</text>" +
      "<text x='20' y='76' fill='#ffd166' font-size='10'>6.00 nats</text>" +
      "<rect x='140' y='64' width='176' height='16' rx='3' fill='#ffd166'/><text x='330' y='77' fill='#ffd166' font-size='9.5'>perplexity 403</text>" +
      "<text x='20' y='108' fill='#4f7cff' font-size='10'>3.00 nats</text>" +
      "<rect x='140' y='96' width='88' height='16' rx='3' fill='#4f7cff'/><text x='242' y='109' fill='#7d8fb0' font-size='9.5'>perplexity 20</text>" +
      "<text x='20' y='140' fill='#3ddc97' font-size='10'>1.70 nats</text>" +
      "<rect x='140' y='128' width='50' height='16' rx='3' fill='#3ddc97'/><text x='204' y='141' fill='#3ddc97' font-size='9.5'>perplexity 5.5 &#183; a good model on held-out web text</text>" +
      "<line x1='20' y1='162' x2='740' y2='162' stroke='#1c2a45' stroke-width='2'/>" +
      "<text x='20' y='184' fill='#c9d6ea' font-size='10.5'>Step zero should land on the top row. If it does not, the bug is upstream of training.</text>" +
      "<text x='20' y='202' fill='#7d8fb0' font-size='10'>Bars are the loss in nats; the perplexity beside each is its exponential.</text>" +
      "</svg><div class='fig-cap'>An untrained model's perplexity equals its vocabulary size exactly, which makes step zero a free correctness check.</div></div>" },

    { title: "What the Backward Pass Does",
      html: "<p>You do not need to re-derive automatic differentiation to debug a training run, but you do need to know what the backward pass computes and where it can go wrong.</p>" +
      "<p>The loss is one number, and every parameter has some influence on it. The backward pass computes, for each parameter, the derivative of the loss with respect to it: the direction and rate at which changing that parameter would change the loss. Gradient descent then steps every parameter a little way against its gradient.</p>" +
      "<p>Mechanically it works backwards through the computation. The gradient at the loss is trivial. From it, the chain rule gives the gradient at the final projection's inputs, and from that the gradient at layer 32's output, and so on down to the embedding. At each layer two things are computed: the gradient with respect to the layer's <em>inputs</em>, which continues the chain downward, and the gradient with respect to the layer's <em>weights</em>, which is what the optimizer uses. Two matrix multiplications of roughly the size of the forward one, which is the 4N in Chapter 9's 6ND.</p>" +
      "<p>Three consequences you will meet in practice.</p>" +
      "<p><strong>Activations must be kept.</strong> Computing a weight gradient needs the layer's input from the forward pass, so every intermediate value is held in memory until its backward pass runs. That is the activation memory of Chapter 9, and it is why memory peaks at the end of the forward pass rather than during the backward one.</p>" +
      "<p><strong>The gradient can vanish or explode with depth.</strong> Chapter 8's residual connections exist for exactly this, and the reason is now concrete: without the additive path, 32 chained multiplications drive the gradient to nothing or to infinity.</p>" +
      "<p><strong>One bad batch reaches every parameter.</strong> A single sequence of corrupted text produces a large loss, a large gradient, and an update applied to all 8 billion parameters at once. This is why a training run can be damaged by a fraction of a percent of bad data, and it is what gradient clipping in Chapter 14 defends against.</p>" },

    { title: "The Loop, With Shapes",
      html: "<p>Everything assembled. One training step, with the tensor shape at each line, for a batch of 4 sequences of 8,192 tokens on Corvid:</p>" +
      "<pre><code>batch   = next(loader)                # (4, 8193) token ids\ninputs  = batch[:, :-1]               # (4, 8192)\ntargets = batch[:, 1:]                # (4, 8192)\n\nlogits  = model(inputs)               # (4, 8192, 128256)\nloss    = cross_entropy(              # scalar\n              logits.view(-1, 128256),\n              targets.view(-1))\n\nloss.backward()                       # fills .grad on every parameter\nclip_grad_norm_(model.parameters(), 1.0)\noptimizer.step()                      # applies the update\noptimizer.zero_grad()                 # or the next step accumulates</code></pre>" +
      "<p>Nine lines. Chapter 14 is entirely about the two lines in the middle of the second block, the clip and the step, because that is where every knob in a training configuration lives.</p>" +
      "<p>One shape is worth staring at. The logits tensor is 4 &#215; 8,192 &#215; 128,256 numbers. In bfloat16 that is <strong>8.6 GB for a single batch's logits</strong>, larger than most models' weights, existing for the moment between the forward pass and the loss. This is why real implementations fuse the projection and the cross-entropy so the full logits tensor is never materialized, and it is the same insight as FlashAttention in Chapter 28: the expensive part was writing down an intermediate nobody wanted to keep.</p>" +
      "<p>And <code>zero_grad</code> is not housekeeping. <strong>Gradient accumulation</strong> is the default behaviour, which is a feature Chapter 14 uses deliberately for large effective batches, and forgetting it is a bug that trains on a growing sum of all previous batches while looking entirely normal.</p>" },

    { title: "Reading a Loss Curve", viz: "llmLossCurves", vizTitle: "Diagnose each curve before revealing the answer",
      html: "<p>Most of the skill in running a training job is knowing what a shape means. Six curves, and what each one is telling you.</p>" +
      "<p><strong>Healthy.</strong> A very fast drop in the first few hundred steps, then a long slow decline that is roughly linear on a log-scale x-axis. The early drop is not the model learning language; it is learning the unigram frequencies. Going from a uniform distribution to simply knowing which tokens are common takes the loss from 11.76 to somewhere around 6 or 7, which is nearly half the total journey, before any structure is learned at all.</p>" +
      "<p><strong>A loss spike that recovers.</strong> The loss jumps and returns within tens of steps. Usually a difficult batch. If clipping is on, this is normal and needs no action.</p>" +
      "<p><strong>A spike that does not recover.</strong> The loss jumps and settles at a much higher level, or becomes NaN. The update was large enough to move the parameters somewhere useless. The standard response, used in real frontier runs, is to restore the last checkpoint, skip the batches that caused it, and continue. Both the PaLM and OPT teams documented doing exactly this repeatedly.</p>" +
      "<p><strong>A step change downward.</strong> Not a bug: something changed. A learning-rate schedule transition, a data-mixture change, or an annealing phase from Chapter 12.</p>" +
      "<p><strong>A small bump partway through.</strong> The most interesting one. A brief rise or flattening in an otherwise healthy curve, early in training, is where the induction heads of Chapter 11 form. The circuit reorganizes, the loss briefly worsens, and when it resolves the model can do in-context learning. It is a phase change you can see on a chart.</p>" +
      "<p><strong>A plateau.</strong> Flat for thousands of steps. Either the learning rate has decayed to nearly zero, which the schedule will tell you, or it collapsed early, which is a bug. Check the actual learning rate before touching anything else.</p>" +
      "<p><strong>Validation rising while training falls.</strong> Overfitting, and during large-scale pretraining it is almost always a sign that something is wrong rather than a natural limit, because a model seeing trillions of mostly-unique tokens should not be able to overfit. Suspect a corpus far smaller than intended, or a validation split that overlaps the training data.</p>" +
      "<div class='fig'><svg viewBox='0 0 760 232' xmlns='http://www.w3.org/2000/svg' font-family='Menlo,monospace'>" +
      "<text x='20' y='18' fill='#2de2ff' font-size='11'>six loss curves and what each one means</text>" +
      "<text x='30' y='42' fill='#3ddc97' font-size='9.5'>healthy</text>" +
      "<path d='M30 96 L52 62 L82 52 L130 46 L190 42 L240 40' fill='none' stroke='#3ddc97' stroke-width='2'/>" +
      "<text x='30' y='114' fill='#7d8fb0' font-size='9'>fast drop = unigram frequencies</text>" +
      "<text x='280' y='28' fill='#ffd166' font-size='9.5'>spike, recovers</text>" +
      "<path d='M280 96 L302 62 L330 52 L356 50 L360 34 L366 52 L400 48 L470 44' fill='none' stroke='#ffd166' stroke-width='2'/>" +
      "<text x='280' y='114' fill='#7d8fb0' font-size='9'>a hard batch; clipping did its job</text>" +
      "<text x='530' y='28' fill='#ff5d73' font-size='9.5'>spike, does not</text>" +
      "<path d='M530 96 L552 62 L580 52 L606 50 L610 32 L618 36 L660 38 L720 37' fill='none' stroke='#ff5d73' stroke-width='2'/>" +
      "<text x='530' y='114' fill='#7d8fb0' font-size='9'>restore a checkpoint, skip the batch</text>" +
      "<text x='30' y='150' fill='#4f7cff' font-size='9.5'>step down</text>" +
      "<path d='M30 200 L100 190 L150 188 L152 168 L200 164 L240 162' fill='none' stroke='#4f7cff' stroke-width='2'/>" +
      "<text x='30' y='222' fill='#7d8fb0' font-size='9'>schedule or data change, not a bug</text>" +
      "<text x='280' y='150' fill='#2de2ff' font-size='9.5'>a bump</text>" +
      "<path d='M280 200 L320 176 L344 172 L356 178 L370 174 L420 166 L470 162' fill='none' stroke='#2de2ff' stroke-width='2'/>" +
      "<text x='280' y='222' fill='#2de2ff' font-size='9'>induction heads forming (Chapter 11)</text>" +
      "<text x='530' y='150' fill='#7d8fb0' font-size='9.5'>plateau</text>" +
      "<path d='M530 200 L570 180 L600 174 L640 173 L680 173 L720 173' fill='none' stroke='#7d8fb0' stroke-width='2'/>" +
      "<text x='530' y='222' fill='#7d8fb0' font-size='9'>check the learning rate first</text>" +
      "</svg><div class='fig-cap'>Five of the six need no action or a known action. Only the second row, middle, is a discovery about the model rather than about the run.</div></div>" +
      "<p>Use the machine, look at each curve, and commit to a diagnosis before revealing it. Getting the spike-that-recovers wrong is common and harmless; getting the plateau wrong costs a week.</p>" },

    { title: "Exercises",
      html: "<ol>" +
      "<li><strong>Trace.</strong> A model over a vocabulary of 50,257 is initialized randomly. Compute the loss and the perplexity you expect at step zero. Then compute both for a model that has reached a loss of 2.4. Then state what you would conclude if your run started at 4.0 instead of the expected value, and name two causes.</li>" +
      "<li><strong>Trace.</strong> Using the six-token example in section 2, recompute the loss if the true token had been 'London' rather than 'Paris'. Then compute the loss if the model had put 0.999 on 'London' and the true token were still 'Paris'. Compare that number to the untrained model's 11.762 and say in one sentence what cross-entropy is expressing about confidence.</li>" +
      "<li><strong>Investigate.</strong> Find a published training run with a loss curve, from a technical report or an open training log. Identify the early steep phase, any spikes, and any step changes. For each spike, find whether the report says what was done. Several open reports document checkpoint restores and skipped batches explicitly, and reading one is the fastest way to understand that this is routine rather than a failure.</li>" +
      "<li><strong>Investigate.</strong> Take two models with different tokenizers and find published perplexity figures for both on the same corpus. Then compute, using Chapter 2's method, how many tokens each tokenizer produces for that corpus. Explain in three sentences why the two perplexities cannot be compared, and what quantity would be comparable.</li>" +
      "<li><strong>Build.</strong> Write the training loop from section 6 against a tiny model and a few megabytes of text. Assert that the loss at step zero is within 0.05 of ln(vocab_size), which will catch a shift-by-one error, an initialization error and a vocabulary mismatch in one line. Then log the loss every ten steps for a thousand steps and plot it. You should see the steep early drop; note the loss at which it flattens and compare it with the unigram entropy of your own corpus, which you can compute directly from token frequencies. They should be close, which is the point of section 7's first paragraph.</li>" +
      "</ol>" }
  ],
  terms: [
    { t: "self-supervised learning", d: "Training where the labels come from the structure of the data itself, here by shifting the token sequence one position." },
    { t: "shift-by-one", d: "The convention that the target at each position is the input at the next, so one array serves as both input and answer key." },
    { t: "packing", d: "Concatenating documents into a continuous stream and cutting fixed-size blocks, avoiding padding at the cost of blocks that straddle document boundaries." },
    { t: "cross-entropy", d: "The training loss: the negative logarithm of the probability the model assigned to the true token." },
    { t: "nats and bits", d: "Units of loss; a natural logarithm gives nats, dividing by ln 2 gives bits per token." },
    { t: "teacher forcing", d: "Conditioning each training prediction on the true previous tokens rather than the model's own, which is what allows one forward pass to compute every position." },
    { t: "exposure bias", d: "The mismatch created by teacher forcing: at generation the model conditions on its own output, which it never practised, contributing to drift in long outputs." },
    { t: "perplexity", d: "The exponential of the mean cross-entropy, interpretable as the effective number of equally likely tokens the model is choosing among." },
    { t: "effective branching factor", d: "The intuition behind perplexity: a perplexity of 20 is as uncertain as a uniform choice among 20 options." },
    { t: "backward pass", d: "Computing the derivative of the loss with respect to every parameter, working backwards through the computation via the chain rule." },
    { t: "gradient", d: "For one parameter, the direction and rate at which changing it would change the loss; the optimizer steps against it." },
    { t: "activation memory", d: "Intermediate forward-pass values held until their backward pass needs them, which is why memory peaks at the end of the forward pass." },
    { t: "gradient accumulation", d: "The default behaviour that gradients add up across backward passes, used deliberately for large effective batches and a silent bug when forgotten." },
    { t: "loss spike", d: "A sudden jump in the loss; harmless when it recovers within tens of steps, and grounds for a checkpoint restore when it does not." },
    { t: "checkpoint restore", d: "Rolling back to a saved state and skipping the offending batches after an unrecoverable spike; routine practice in documented frontier runs." }
  ],
  quiz: [
    { type: "mc", q: "A randomly initialized model over a 128,256-token vocabulary should show what loss at step zero?", opts: ["0, since no predictions have been made", "About 11.76, the natural logarithm of the vocabulary size", "About 1.0, the uniform probability scaled", "It depends on the initialization scheme and cannot be predicted"], a: 1,
      why: "An untrained model spreads probability roughly uniformly, so the true token gets about 1/V and the loss is -ln(1/V) = ln(V) = 11.762 for this vocabulary. Its perplexity is then exactly 128,256. This is a free sanity check: a run that does not start near that number has a mismatched vocabulary, a bad initialization scale, or labels that are not shifted correctly." },
    { type: "mc", q: "A model assigns one millionth of its probability to the true token, scoring a loss of 13.82. An untrained model scores 11.76. What does the comparison show?", opts: ["The model has been damaged and should be restarted", "The loss function is numerically unstable at small probabilities", "The vocabulary size was misconfigured", "Cross-entropy punishes confident error more harshly than ignorance"], a: 3,
      why: "Being confidently wrong scores worse than knowing nothing, because the negative logarithm grows without bound as the assigned probability approaches zero. This is exactly the desired behaviour: it is what makes models trained this way hedge in unfamiliar territory rather than assert. Nothing is unstable and nothing is broken; the loss is expressing a judgement about confidence." },
    { type: "mc", q: "Why does teacher forcing let a single forward pass compute the loss at every position?", opts: ["Each position conditions on the true prefix rather than on generated text, so no position depends on another's output", "The model is run once per position in parallel across devices", "Positions after the first are masked out of the loss", "The optimizer averages the positions afterwards"], a: 0,
      why: "If each prediction depended on what the model itself had generated, the computation would be sequential. Conditioning on the true prefix makes the positions independent, and the causal mask from Chapter 5 ensures none of them sees its own answer. The cost is exposure bias: at generation there is no true prefix, and the model has never practised conditioning on its own output." },
    { type: "mc", q: "Two models report perplexities of 8.1 and 6.4 on the same corpus. What can you conclude?", opts: ["The second model is meaningfully better", "The second has a larger vocabulary", "Nothing, unless they share a tokenizer, because perplexity is per token and tokenizers differ in how many tokens a text becomes", "The comparison is valid only if both were trained on that corpus"], a: 2,
      why: "Perplexity is per token, and Chapter 2 measured the same sentence at 12 tokens under one tokenizer and 133 under another. A model whose tokenizer produces fewer, larger tokens faces a harder per-token prediction and will show a higher perplexity for identical quality. Comparing across tokenizers is a category error, and papers that do it are making one." },
    { type: "blank", q: "Conditioning each training prediction on the true previous tokens rather than on the model's own output is called teacher ____.", a: ["forcing"],
      why: "It is what makes the training scheme efficient, and it defers a cost to inference. At generation there is no true prefix, so the model conditions on its own output, a situation it never trained in. That mismatch is exposure bias, and it contributes to long generations drifting or looping in ways the loss curve never predicted." },
    { type: "blank", q: "The exponential of the mean cross-entropy, interpretable as an effective branching factor, is called ____.", a: ["perplexity"],
      why: "A perplexity of 20 means the model is about as uncertain as if choosing uniformly among 20 equally likely tokens. Its floor is 1. It is an excellent instrument for watching one run improve on one tokenizer and one held-out split, and weak evidence for almost anything else." },
    { type: "order", q: "Order one training step:", items: ["slice a batch into inputs and targets shifted by one", "run the forward pass to get logits", "compute cross-entropy against the targets", "backpropagate, clip, step the optimizer, and zero the gradients"],
      why: "Four moves, and Chapter 14 is entirely about the last one. Zeroing the gradients is not housekeeping: they accumulate by default, which is a feature used deliberately for large effective batches and a silent bug when forgotten, since the run then trains on a growing sum of all previous batches while looking normal." },
    { type: "mc", q: "The logits tensor for a batch of 4 sequences of 8,192 tokens over a 128,256-token vocabulary is 8.6 GB in bfloat16. What do real implementations do about it?", opts: ["Reduce the batch size until it fits", "Store the logits in int8", "Fuse the output projection with the cross-entropy so the full tensor is never materialized", "Compute the loss on a sampled subset of positions"], a: 2,
      why: "The full logits tensor exists only for the instant between the projection and the loss, so it need never be written down at all. Fusing the two operations computes the loss in chunks. It is the same insight as FlashAttention in Chapter 28: the expensive part was materializing an intermediate that nobody wanted to keep." },
    { type: "mc", q: "During pretraining, validation loss starts rising while training loss keeps falling. What should you suspect first?", opts: ["The corpus is far smaller than intended, or the validation split overlaps the training data", "The learning rate is too high", "The model has reached its capacity and training should stop", "The optimizer state has become corrupted"], a: 0,
      why: "A model seeing trillions of mostly-unique tokens should not be able to overfit, so the classic overfitting signature during pretraining usually means the run is not seeing what you think it is. A corpus a hundred times smaller than intended, or a validation split drawn from the same documents, both produce this shape. Chapter 12's deduplication and decontamination work is what prevents the second." },
    { type: "mc", q: "A brief bump interrupts an otherwise healthy loss curve early in training, then the curve resumes falling. What is one documented cause?", opts: ["The learning-rate warmup ending", "A corrupted data shard", "Gradient clipping engaging for the first time", "Induction heads forming, which reorganizes the circuit and briefly worsens the loss"], a: 3,
      why: "Olsson and colleagues showed the formation of induction heads is abrupt, coincides with a visible feature of the loss curve, and is when the model acquires in-context learning. It is the one shape in the gallery that is a discovery about the model rather than about the run. A corrupted shard produces a spike rather than a bump, and warmup ending produces a smooth transition." }
  ]
});

/* ======================= CHAPTER 14 ======================= */
CHAPTERS.push({
  num: 14, part: 3, title: "Making It Converge: Optimizers, Schedules, and Precision",
  blurb: "Every knob in a training config exists because a specific run failed without it. You will meet them in that order: the optimizer that adapts per-parameter step sizes, the warmup that stops the first hundred steps destroying the model, the decay that squeezes out the last of the loss, the clip that survives a bad batch, and the precision choice that halves memory while introducing a new way to get NaN. By the end you can read a training configuration and say what each line is defending against.",
  sections: [
    { title: "From One Step Size to Eight Billion", viz: "llmOptimizer", vizTitle: "Raise the learning rate until it diverges, then turn warmup on",
      html: "<p>Chapter 13 ended with <code>optimizer.step()</code>. Everything in this section is what hides behind it.</p>" +
      "<p><strong>Plain gradient descent</strong> subtracts the gradient scaled by a learning rate. One number governs every parameter. That is the problem: in a transformer, gradients for embedding rows of rare tokens are tiny and gradients for attention projections can be large, and a single step size cannot suit both. Too large and the large-gradient parameters diverge; too small and the small-gradient ones never move.</p>" +
      "<p><strong>Momentum</strong> accumulates a running average of past gradients and steps along that instead. It damps oscillation across a narrow valley and accelerates along its floor. Useful, and it still uses one global step size.</p>" +
      "<p><strong>Adam</strong>, from Diederik Kingma and Jimmy Ba in 2014, gives every parameter its own effective step size. It keeps two running averages per parameter: the first moment, an average of the gradient, and the second moment, an average of the gradient squared. The update divides the first by the square root of the second.</p>" +
      "<pre><code>m = b1*m + (1-b1)*g          # first moment: direction\nv = b2*v + (1-b2)*g*g        # second moment: recent magnitude\nupdate = lr * m / (sqrt(v) + eps)</code></pre>" +
      "<p>The division is the whole idea. A parameter whose gradients have been consistently large gets a large second moment and therefore a small step; one whose gradients are tiny gets a large step. The step size becomes <em>relative</em> to each parameter's own gradient history, which is what makes a single learning rate workable across eight billion parameters with wildly different scales.</p>" +
      "<p>This is also where Chapter 9's memory arithmetic comes from. Two running averages per parameter, in fp32, is eight bytes per parameter that exist purely so the optimizer can adapt. On Corvid that is 64 GB of the 144.5 GB training state.</p>" +
      "<h3>The W in AdamW</h3>" +
      "<p><strong>Weight decay</strong> shrinks parameters slightly toward zero each step, a regularizer that discourages large weights. The standard way to implement it was to add a term to the gradient, and Ilya Loshchilov and Frank Hutter pointed out in 2017 that this is wrong when combined with Adam.</p>" +
      "<p>The reason follows directly from the division above. A decay term added to the gradient also passes through the division by the square root of the second moment, so parameters with large gradient histories get less decay than parameters with small ones. The regularization strength ends up depending on gradient magnitude, which nobody intended and which makes the hyperparameter mean different things for different parameters.</p>" +
      "<p><strong>AdamW</strong> applies <strong>decoupled weight decay</strong>: run Adam's update, then shrink the weights separately, untouched by the second moment. It is a small change to a few lines, it made weight decay behave as documented, and it is now the default for essentially every language model. It is a good example of a bug that lived for years inside a widely used implementation because the results were merely worse rather than broken.</p>" +
      "<p>Work continues past AdamW. <strong>Shampoo</strong> and <strong>Muon</strong> use richer curvature information and have shown real speedups on some runs at the cost of more computation and memory per step. Neither has displaced AdamW as the default, and reading a config that specifies one tells you the team was optimizing training throughput deliberately.</p>" },

    { title: "The Learning Rate Is Not a Constant",
      html: "<p>A single learning rate for a whole run is wrong at both ends, for different reasons.</p>" +
      "<p><strong>At the start</strong>, the parameters are random and the gradients are large and uninformative. A full-size step here moves the model somewhere arbitrary, and Adam makes it worse: its second moments are estimated from almost no data, so the division is unreliable exactly when the steps are most damaging. The fix is <strong>warmup</strong>, raising the learning rate linearly from near zero over the first few hundred to few thousand steps.</p>" +
      "<p>Chapter 8 gave the historical version of this: with post-LN, warmup was not optional, because the gradient profile made the first steps genuinely explosive. Pre-LN removed that specific need, and warmup survived because Adam's moment estimates still need time to become meaningful. The knob outlived its original justification and acquired a second one, which is worth knowing when someone tells you warmup is a relic.</p>" +
      "<p><strong>At the end</strong>, you want small steps to settle into a minimum rather than bouncing around it. <strong>Cosine decay</strong> takes the rate smoothly down to near zero following a cosine curve, and it has been the default for years.</p>" +
      "<p>It has one real drawback: the schedule is defined by its endpoint, so you must decide the total number of steps before you start. Stop early and you stop at a high learning rate, at a point the schedule never intended as a destination, and the resulting model is measurably worse than one that reached the same step count with a schedule sized for it.</p>" +
      "<p><strong>Warmup-stable-decay</strong> answers that. Warm up, then hold a constant rate for as long as you like, then decay quickly over the last small fraction. The stable phase can be extended or truncated freely, and you decay whenever you choose to stop. It also makes intermediate checkpoints genuinely usable: decay briefly from any point in the stable phase and you have a finished model. This matters more than a scheduling convenience, because it interacts with Chapter 12's annealing: the decay phase is exactly where you feed your highest-quality data.</p>" +
      "<div class='fig'><svg viewBox='0 0 760 226' xmlns='http://www.w3.org/2000/svg' font-family='Menlo,monospace'>" +
      "<text x='20' y='18' fill='#2de2ff' font-size='11'>learning rate over a run</text>" +
      "<line x1='60' y1='150' x2='700' y2='150' stroke='#1c2a45' stroke-width='2'/>" +
      "<line x1='60' y1='36' x2='60' y2='150' stroke='#1c2a45' stroke-width='2'/>" +
      "<path d='M60 150 L110 50 L200 62 L320 88 L460 120 L600 143 L680 148' fill='none' stroke='#4f7cff' stroke-width='2.5'/>" +
      "<text x='330' y='76' fill='#4f7cff' font-size='9.5'>warmup then cosine decay</text>" +
      "<path d='M60 150 L110 50 L560 50 L620 120 L680 148' fill='none' stroke='#3ddc97' stroke-width='2.5'/>" +
      "<text x='240' y='42' fill='#3ddc97' font-size='9.5'>warmup, stable, then a short decay</text>" +
      "<line x1='110' y1='36' x2='110' y2='158' stroke='#7d8fb0' stroke-width='1.5' stroke-dasharray='3 3'/>" +
      "<text x='84' y='172' fill='#7d8fb0' font-size='9'>warmup ends</text>" +
      "<line x1='560' y1='36' x2='560' y2='158' stroke='#3ddc97' stroke-width='1.5' stroke-dasharray='3 3'/>" +
      "<text x='520' y='172' fill='#3ddc97' font-size='9'>decay begins</text>" +
      "<text x='20' y='196' fill='#c9d6ea' font-size='10.5'>Cosine must know the finish line in advance. The stable phase can be cut or extended, and every point in it</text>" +
      "<text x='20' y='214' fill='#c9d6ea' font-size='10.5'>is a checkpoint you can decay from.</text>" +
      "</svg><div class='fig-cap'>The green schedule is why current runs can stop at a step count nobody planned and still ship a finished model.</div></div>" +
      "<p>Take the machine and raise the learning rate until the run diverges. Note the value. Then turn warmup on and raise it again. The divergence point moves substantially, which is the discovery: warmup is not a small refinement, it changes what learning rates are usable at all.</p>" },

    { title: "Surviving One Bad Batch",
      html: "<p>Chapter 13 established that a single corrupted sequence produces a large loss, a large gradient, and an update applied to every parameter at once. <strong>Gradient clipping</strong> is the defence, and it is two lines.</p>" +
      "<p>Compute the norm of the entire gradient, treating all parameters as one long vector. If it exceeds a threshold, usually 1.0, scale the whole gradient down so its norm equals the threshold. Direction preserved, magnitude capped.</p>" +
      "<pre><code>total = sqrt( sum of squares of every gradient )\nif total &gt; 1.0:  scale every gradient by 1.0 / total</code></pre>" +
      "<p>Scaling everything by the same factor rather than clipping each parameter individually is the important detail. Per-parameter clipping would change the direction of the update, which is information the backward pass computed correctly and you do not want to discard. Global norm clipping says the step is too big, not that it points the wrong way.</p>" +
      "<p>The effect on a loss curve is exactly Chapter 13's spike-that-recovers: the loss jumps because the batch was hard, the gradient is clipped, the update stays bounded, and the run continues. Without it the same batch can produce a spike that never recovers, which is the shape that costs you a checkpoint restore.</p>" +
      "<p>Clipping is close to free and essentially universal. A config without it is either very small-scale or a mistake.</p>" +
      "<div class='fig'><svg viewBox='0 0 760 190' xmlns='http://www.w3.org/2000/svg' font-family='Menlo,monospace'>" +
      "<text x='20' y='18' fill='#2de2ff' font-size='11'>the same hard batch, with and without clipping</text>" +
      "<text x='30' y='42' fill='#3ddc97' font-size='9.5'>clip at 1.0</text>" +
      "<path d='M40 120 L120 96 L200 88 L236 60 L250 86 L320 84 L360 82' fill='none' stroke='#3ddc97' stroke-width='2.5'/>" +
      "<text x='40' y='146' fill='#7d8fb0' font-size='9'>spike, then straight back to the trend</text>" +
      "<text x='420' y='42' fill='#ff5d73' font-size='9.5'>no clip</text>" +
      "<path d='M430 120 L510 96 L590 88 L620 34 L640 44 L680 46 L720 45' fill='none' stroke='#ff5d73' stroke-width='2.5'/>" +
      "<text x='430' y='146' fill='#7d8fb0' font-size='9'>one update moved the parameters somewhere useless</text>" +
      "<line x1='20' y1='162' x2='740' y2='162' stroke='#1c2a45' stroke-width='2'/>" +
      "<text x='20' y='182' fill='#c9d6ea' font-size='10.5'>Two lines of code decide which of these two curves you get from an identical batch.</text>" +
      "</svg><div class='fig-cap'>The direction of the update is preserved either way. Clipping only says the step was too large.</div></div>" },

    { title: "Half the Bytes", viz: "llmPrecision", vizTitle: "Push values up and watch fp16 overflow before bf16 loses precision",
      html: "<p>Chapter 9 counted 18 bytes per parameter for training. <strong>Mixed precision</strong>, running the forward and backward passes in 16 bits while keeping higher precision where it matters, is where several of those bytes come from, and where the most confusing failure mode in training lives.</p>" +
      "<p>Computed from the bit layouts on 6 September 2026:</p>" +
      "<pre><code>format   bits            max value    min normal    decimal digits\nfp32     1+8+23           3.40e+38      1.18e-38              6.9\nfp16     1+5+10          65,504         6.10e-05              3.0\nbf16     1+8+ 7           3.39e+38      1.18e-38              2.1</code></pre>" +
      "<p>Read the exponent column and the trade is obvious. <strong>bf16 keeps fp32's exponent and spends the saved bits on nothing</strong>: it has the same enormous range and fewer significant digits than fp16. fp16 does the opposite, buying precision by shrinking the range to a maximum of 65,504.</p>" +
      "<h3>Why fp16 needed a workaround and bf16 did not</h3>" +
      "<p>fp16's narrow range breaks at both ends during training. Activations in a large model can exceed 65,504 and become infinity. More insidiously, gradients are often extremely small, and anything below about 6e-8 underflows to exactly zero, so the parameter receives no update and you are not told.</p>" +
      "<p>Measured: a gradient of 1e-8 becomes zero in fp16. Multiply the loss by 1,024 before the backward pass and that gradient becomes 1.02e-5, comfortably representable; divide the gradients by 1,024 before the optimizer step and the mathematics is unchanged. That is <strong>loss scaling</strong>, and dynamic implementations adjust the factor automatically, backing off when they detect an overflow.</p>" +
      "<p>bf16 needs none of this, because its range is fp32's. Training frameworks moved to it as soon as hardware supported it, accepting fewer significant digits in exchange for deleting an entire class of failure. That is the trade the field made, and it was the right one.</p>" +
      "<h3>Why fp32 master weights still exist</h3>" +
      "<p>bf16's cost is precision, and there is one place it bites. Near a value of 1.0, bf16's seven mantissa bits give a relative resolution of 2 to the power of &#8722;8, which is 0.0039. So adding an update of 1e-4 to a weight of 1.0 produces exactly 1.0 again. <strong>The update is not small. It is gone.</strong></p>" +
      "<p>Late in training, when the learning rate has decayed, most updates are this size. A run in pure bf16 would silently stop learning while the loss curve looked stable. Keeping an fp32 copy of the weights for the update, and casting down to bf16 for the forward pass, is what prevents it. That is the 4 bytes per parameter of master weights from Chapter 9, and its justification is a single arithmetic fact.</p>" +
      "<p><strong>fp8</strong> is where this is heading, with 8-bit formats for parts of the forward and backward pass and higher precision retained where it matters. It is in production at frontier labs and requires careful per-tensor scaling; it is not yet something you enable and forget.</p>" +
      "<div class='fig'><svg viewBox='0 0 760 218' xmlns='http://www.w3.org/2000/svg' font-family='Menlo,monospace'>" +
      "<text x='20' y='18' fill='#2de2ff' font-size='11'>range and precision (computed from the bit layouts)</text>" +
      "<text x='20' y='48' fill='#7d8fb0' font-size='10'>fp32</text>" +
      "<rect x='100' y='36' width='420' height='14' rx='3' fill='#4f7cff'/><text x='530' y='48' fill='#7d8fb0' font-size='9'>range 1e-38 to 3.4e38</text>" +
      "<rect x='100' y='54' width='276' height='10' rx='3' fill='#3ddc97'/><text x='386' y='63' fill='#3ddc97' font-size='9'>6.9 digits</text>" +
      "<text x='20' y='102' fill='#7d8fb0' font-size='10'>fp16</text>" +
      "<rect x='100' y='90' width='96' height='14' rx='3' fill='#ff5d73'/><text x='206' y='102' fill='#ff5d73' font-size='9'>range 6e-5 to 65,504 &#183; needs loss scaling</text>" +
      "<rect x='100' y='108' width='120' height='10' rx='3' fill='#3ddc97'/><text x='230' y='117' fill='#3ddc97' font-size='9'>3.0 digits</text>" +
      "<text x='20' y='156' fill='#7d8fb0' font-size='10'>bf16</text>" +
      "<rect x='100' y='144' width='420' height='14' rx='3' fill='#4f7cff'/><text x='530' y='156' fill='#4f7cff' font-size='9'>same range as fp32</text>" +
      "<rect x='100' y='162' width='84' height='10' rx='3' fill='#ffd166'/><text x='194' y='171' fill='#ffd166' font-size='9'>2.1 digits &#183; why master weights exist</text>" +
      "<line x1='20' y1='188' x2='740' y2='188' stroke='#1c2a45' stroke-width='2'/>" +
      "<text x='20' y='210' fill='#c9d6ea' font-size='10.5'>Blue is range, green and gold precision. bf16 gave up digits to delete a class of failure, and it was right.</text>" +
      "</svg><div class='fig-cap'>An update of 1e-4 added to a weight of 1.0 vanishes in bf16, because its resolution there is 0.0039. That single fact is the whole argument for fp32 master weights.</div></div>" },

    { title: "Bigger Batches Than Fit", viz: "llmMemoryLevers", vizTitle: "Fit a run that did not fit, and pay for it in wall-clock",
      html: "<p>Two techniques buy memory with time, and both are standard.</p>" +
      "<p><strong>Gradient accumulation</strong> uses the behaviour Chapter 13 warned about deliberately. Run several small forward and backward passes without zeroing the gradients between them, then step once. The gradients add up, so the optimizer sees the average of all of them, and the result is mathematically identical to one large batch.</p>" +
      "<pre><code>micro-batch 4 x accumulate 8 x 1 device   = effective batch 32\nmicro-batch 4 x accumulate 8 x 64 devices = effective batch 2,048</code></pre>" +
      "<p>What it does not buy is time. Eight accumulation steps do eight forward and backward passes, so the step takes eight times as long. It converts a memory constraint into a wall-clock cost, which is often exactly the trade you want.</p>" +
      "<p><strong>Activation checkpointing</strong> attacks the other memory consumer. Chapter 13 explained that every intermediate value is kept until its backward pass needs it. Checkpointing keeps only a few, at block boundaries, and recomputes the rest during the backward pass. Tian Qi Chen and colleagues published the technique in 2016; the memory saving is large and the cost is roughly a 30% increase in step time, since the forward pass is partly done twice.</p>" +
      "<p>Together these are what let a run happen on hardware that cannot hold it. They do not make it faster. Nothing in this section makes anything faster.</p>" +
      "<h3>How large should the batch be</h3>" +
      "<p>Larger batches give less noisy gradient estimates, so you can take larger steps. But the noise falls with the square root of the batch size while the cost rises linearly, so the benefit saturates. Sam McCandlish and colleagues formalized this in 2018 as the <strong>critical batch size</strong>: below it, doubling the batch nearly halves the steps needed; above it, doubling mostly wastes compute.</p>" +
      "<p>The useful part is that it grows during training. Early on, gradients agree and a small batch suffices; later, the remaining signal is subtle and larger batches pay off. Some runs increase batch size over the course of training for exactly this reason.</p>" +
      "<p>What you actually report is <strong>tokens per step</strong>, which is what makes runs comparable:</p>" +
      "<pre><code>effective batch    32 at 8,192 sequence  =    262,144 tokens per step\neffective batch   512                    =  4,194,304 tokens per step\neffective batch 2,048                    = 16,777,216 tokens per step</code></pre>" +
      "<div class='fig'><svg viewBox='0 0 760 196' xmlns='http://www.w3.org/2000/svg' font-family='Menlo,monospace'>" +
      "<text x='20' y='18' fill='#2de2ff' font-size='11'>two levers that buy memory with time</text>" +
      "<text x='20' y='48' fill='#7d8fb0' font-size='10'>baseline</text>" +
      "<rect x='150' y='36' width='300' height='14' rx='3' fill='#ff5d73'/><rect x='454' y='36' width='120' height='14' rx='3' fill='#4f7cff'/>" +
      "<text x='586' y='48' fill='#ff5d73' font-size='9'>does not fit</text>" +
      "<text x='20' y='86' fill='#7d8fb0' font-size='10'>+ accumulation</text>" +
      "<rect x='150' y='74' width='38' height='14' rx='3' fill='#ff5d73'/><rect x='192' y='74' width='120' height='14' rx='3' fill='#4f7cff'/>" +
      "<text x='330' y='86' fill='#3ddc97' font-size='9'>same effective batch &#183; 8x the step time</text>" +
      "<text x='20' y='124' fill='#7d8fb0' font-size='10'>+ checkpointing</text>" +
      "<rect x='150' y='112' width='10' height='14' rx='3' fill='#ff5d73'/><rect x='164' y='112' width='120' height='14' rx='3' fill='#4f7cff'/>" +
      "<text x='300' y='124' fill='#3ddc97' font-size='9'>activations recomputed &#183; 30% more time again</text>" +
      "<rect x='150' y='142' width='12' height='9' rx='2' fill='#ff5d73'/><text x='170' y='150' fill='#7d8fb0' font-size='9'>activations</text>" +
      "<rect x='290' y='142' width='12' height='9' rx='2' fill='#4f7cff'/><text x='310' y='150' fill='#7d8fb0' font-size='9'>weights, gradients, optimizer state</text>" +
      "<text x='20' y='184' fill='#c9d6ea' font-size='10.5'>Neither makes anything faster. Both convert a memory constraint into wall-clock.</text>" +
      "</svg><div class='fig-cap'>The blue block is fixed by Chapter 9's arithmetic. Only the red block responds to these two levers.</div></div>" },

    { title: "When It Breaks at Scale",
      html: "<p>Everything above assumes the run proceeds. At frontier scale it frequently does not, and the honest accounts are useful because they show that instability is routine engineering rather than a sign of incompetence.</p>" +
      "<p><strong>Loss spikes</strong> are the common event. Both the PaLM and OPT teams documented them extensively, along with what they did: restore the last checkpoint, skip the batches that preceded the spike, and continue. The OPT logbook in particular records this happening repeatedly across a single run. The discipline that makes it survivable is frequent checkpointing and enough logging to identify which batches were involved.</p>" +
      "<p><strong>The z-loss</strong> addresses a specific numerical drift. The softmax over 128,256 logits is unchanged if you add a constant to every logit, so nothing in the loss constrains their absolute magnitude, and over a long run they can drift far from zero. Large logits are numerically unpleasant in reduced precision. The z-loss adds a small penalty on the log of the softmax normalizer, which pins the scale without changing the distribution. It is a term that exists purely to keep the arithmetic well-behaved.</p>" +
      "<p><strong>Divergence signatures</strong> worth recognizing. A gradient norm that trends upward over thousands of steps predicts trouble well before the loss shows it, which is why the gradient norm belongs on your dashboard next to the loss. Attention logits growing steadily is another. Both are visible long before anything goes wrong, and both are actionable while the run is still healthy.</p>" +
      "<div class='callout'><strong>Interview lens.</strong> &#8220;Your training run diverged at step 40,000. What do you do?&#8221; The answer is a procedure, not a hyperparameter. Restore the most recent good checkpoint. Identify and skip the batches around the divergence, because bad data is the most common single cause. Check whether the gradient norm was trending up beforehand, which distinguishes a bad batch from a run that was becoming unstable anyway. Only then consider lowering the learning rate, and say that you would rather not, because it costs quality across the whole remaining run to fix a local event.</div>" },

    { title: "Reading a Training Config",
      html: "<p>Everything assembled. A representative configuration, with what each line defends against:</p>" +
      "<pre><code>optimizer: adamw            # per-parameter step sizes; decoupled decay\n  betas: [0.9, 0.95]        # 0.95 not 0.999: shorter memory, standard for LLMs\n  weight_decay: 0.1         # regularization, applied outside the Adam update\n  eps: 1.0e-8               # stops division by zero for dead parameters\n\nlr: 3.0e-4                  # peak, reached at the end of warmup\nwarmup_steps: 2000          # Adam's moments need data before they are trusted\nschedule: cosine            # or wsd, if you want to stop anywhere\nmin_lr: 3.0e-5              # decay floor, usually a tenth of peak\n\ngrad_clip: 1.0              # survive one bad batch\ndtype: bfloat16             # fp32's range, no loss scaling needed\nmaster_weights: fp32        # or updates of 1e-4 vanish\n\nmicro_batch: 4              # what fits on one device\ngrad_accum: 8               # effective batch without the memory\nactivation_checkpointing: true   # 30% slower, much less memory</code></pre>" +
      "<p>One line deserves comment because it looks like a typo. Adam's default second-moment coefficient is 0.999, and language models almost universally use 0.95. A lower value means a shorter memory of past gradient magnitudes, so the optimizer responds faster when the scale of gradients changes. In runs where the loss landscape shifts as capabilities form, that responsiveness is worth more than the smoother estimate.</p>" +
      "<p>Nothing in that file is arbitrary. Each line is a fix for a failure someone hit, and you can now name all of them.</p>" },

    { title: "Exercises",
      html: "<ol>" +
      "<li><strong>Trace.</strong> A weight has the value 1.0 and the optimizer computes an update of 3e-4. Using bf16's relative resolution of 0.0039 near 1.0, state what the new weight is if it is stored in bf16, and what it is with an fp32 master copy. Then state what a loss curve would look like for a run in pure bf16 late in training, and why it would be hard to diagnose.</li>" +
      "<li><strong>Trace.</strong> A run uses micro-batch 8, gradient accumulation 4, on 32 devices, at a sequence length of 4,096. Compute the effective batch size and the tokens per optimizer step. Then state how the step time and the memory change if you double the accumulation and halve the micro-batch, keeping the effective batch the same.</li>" +
      "<li><strong>Investigate.</strong> Find the training configuration of an open model release. Locate the optimizer, betas, learning rate, warmup, schedule, clipping and precision. For each, say what failure it defends against. Then find one setting you cannot explain, and work out what it is for; there is usually at least one, and it is usually the most interesting line in the file.</li>" +
      "<li><strong>Investigate.</strong> Find a published account of a training run that suffered loss spikes, such as the OPT logbook or the PaLM report. Record how many spikes occurred, what the team did each time, and whether they changed hyperparameters or restarted from a checkpoint. Then write one sentence on what that implies about how much of frontier training is planning versus recovery.</li>" +
      "<li><strong>Build.</strong> Extend your Chapter 13 loop with AdamW, linear warmup, cosine decay and gradient clipping. Then run a small ablation and log the loss for each: no warmup at your best learning rate; warmup on; and warmup on at double the learning rate. Report the three curves. Then add a switch for pure bf16 weights versus fp32 master weights, train for enough steps that the learning rate has decayed substantially, and compare final losses. The second experiment is the one that will surprise you.</li>" +
      "</ol>" }
  ],
  terms: [
    { t: "AdamW", d: "The standard optimizer for language models: per-parameter step sizes from two running moments, with weight decay applied outside the adaptive update." },
    { t: "first moment", d: "Adam's running average of the gradient, which supplies the direction of the update." },
    { t: "second moment", d: "Adam's running average of the squared gradient, whose square root divides the step so each parameter's rate is relative to its own history." },
    { t: "decoupled weight decay", d: "Applying weight decay separately from the gradient, so its strength does not depend on a parameter's gradient magnitude." },
    { t: "warmup", d: "Raising the learning rate from near zero over the first steps, originally for post-LN stability and now because Adam's moments need data before they can be trusted." },
    { t: "cosine decay", d: "Reducing the learning rate along a cosine curve to near zero, which requires committing to a total step count in advance." },
    { t: "warmup-stable-decay", d: "A schedule with a constant middle phase that can be cut or extended, and a short decay from any point, making intermediate checkpoints usable." },
    { t: "gradient clipping", d: "Scaling the whole gradient down when its global norm exceeds a threshold, capping the step size while preserving its direction." },
    { t: "mixed precision", d: "Running the forward and backward passes in 16-bit while keeping higher precision where it matters." },
    { t: "loss scaling", d: "Multiplying the loss before backpropagation and dividing the gradients afterwards, so small gradients do not underflow in fp16." },
    { t: "master weights", d: "An fp32 copy of the parameters used for the update, without which an update of 1e-4 on a weight of 1.0 vanishes in bf16." },
    { t: "gradient accumulation", d: "Summing gradients over several micro-batches before stepping, giving a large effective batch at small memory and proportionally more time." },
    { t: "activation checkpointing", d: "Keeping only a few intermediate values and recomputing the rest in the backward pass; large memory saving for about 30% more step time." },
    { t: "critical batch size", d: "The point beyond which increasing the batch stops buying proportionally fewer steps; it grows over the course of training." },
    { t: "tokens per step", d: "Effective batch times sequence length, the figure that makes runs on different hardware comparable." },
    { t: "z-loss", d: "A small penalty on the softmax normalizer that pins the absolute scale of the logits, which the loss otherwise leaves unconstrained." }
  ],
  quiz: [
    { type: "mc", q: "What does dividing by the square root of Adam's second moment accomplish?", opts: ["It makes each parameter's step size relative to its own gradient history, so one learning rate works across parameters of wildly different scales", "It normalizes the loss across batch sizes", "It prevents gradient explosion by capping the norm", "It compensates for reduced precision in bf16"], a: 0,
      why: "A parameter with consistently large gradients accumulates a large second moment and therefore takes small steps; one with tiny gradients takes large ones. Without that, a single global learning rate cannot suit both a rare token's embedding row and an attention projection. Capping the norm is gradient clipping, which is a different mechanism for a different failure." },
    { type: "mc", q: "Why was coupling weight decay into the gradient wrong for Adam?", opts: ["It doubled the memory needed for optimizer state", "It made the decay apply only to large weights", "The decay term passed through the division by the second moment, so regularization strength depended on gradient magnitude", "It conflicted with gradient clipping"], a: 2,
      why: "Anything added to the gradient goes through Adam's adaptive division, so parameters with large gradient histories received less decay than those with small ones. The hyperparameter therefore meant different things for different parameters, which nobody intended. AdamW applies the shrinkage separately, after the adaptive update, and it is now universal." },
    { type: "mc", q: "An update of 1e-4 is added to a weight of 1.0 stored in bf16. What happens?", opts: ["The weight becomes 1.0001", "The weight overflows", "The update is applied at reduced precision, giving about 1.00008", "The update is lost entirely, because bf16's relative resolution near 1.0 is about 0.0039"], a: 3,
      why: "Seven mantissa bits give a relative resolution of 2 to the minus 8, which is 0.0039 near 1.0, so 1.0 plus 1e-4 rounds back to exactly 1.0. Late in training, once the learning rate has decayed, most updates are this size, so a run in pure bf16 would silently stop learning while the loss curve looked stable. That is the entire justification for fp32 master weights." },
    { type: "mc", q: "Why does bf16 not need loss scaling when fp16 does?", opts: ["bf16 has more mantissa bits, so small values are represented more precisely", "bf16 keeps fp32's exponent range, so gradients do not underflow to zero", "bf16 is computed on dedicated hardware that handles underflow", "Loss scaling is needed for bf16 too, but is applied automatically"], a: 1,
      why: "bf16 has fewer mantissa bits than fp16, not more: 2.1 decimal digits against 3.0. What it has is the same exponent range as fp32, so a gradient of 1e-8 is representable rather than flushing to zero as it does in fp16 below about 6e-8. The trade was giving up precision to delete a class of failure, and the field took it as soon as hardware allowed." },
    { type: "blank", q: "Scaling the whole gradient down when its global norm exceeds a threshold, preserving direction while capping magnitude, is called gradient ____.", a: ["clipping", "clip"],
      why: "Scaling everything by one factor rather than clipping each parameter separately is the important detail: per-parameter clipping would change the update's direction, which the backward pass computed correctly. Global norm clipping says the step is too large, not that it points the wrong way, and it is what turns an unrecoverable spike into a recoverable one." },
    { type: "blank", q: "Summing gradients across several micro-batches before taking one optimizer step is called gradient ____.", a: ["accumulation"],
      why: "It is mathematically identical to one large batch and uses no extra memory for activations, because each micro-batch's are freed before the next. What it does not buy is time: eight accumulation steps run eight forward and backward passes, so the step takes eight times as long. It converts a memory constraint into a wall-clock cost." },
    { type: "order", q: "Order the operations in one optimizer step:", items: ["accumulate gradients over the micro-batches", "clip the global gradient norm", "apply the AdamW update using the fp32 master weights", "cast the updated weights back to bf16 for the next forward pass"],
      why: "Accumulate, clip, update, cast. Clipping must come after all accumulation, since it acts on the total gradient the optimizer will actually use. The update happens in fp32 because that is the only place a 1e-4 change to a 1.0 weight survives, and the cast down is what the forward pass consumes." },
    { type: "mc", q: "Why do language-model configs typically set Adam's second beta to 0.95 rather than the default 0.999?", opts: ["For a shorter memory of gradient magnitudes, so the optimizer responds faster when the scale of gradients shifts", "To reduce optimizer memory", "Because 0.999 is numerically unstable in bf16", "To compensate for gradient accumulation"], a: 0,
      why: "A lower beta discounts older squared gradients faster, so the adaptive step size tracks changes in gradient scale more closely. In runs where the loss landscape shifts as capabilities form, that responsiveness is worth more than a smoother estimate. Memory is unaffected, since both moments are stored regardless of the coefficient." },
    { type: "mc", q: "Cosine decay's main practical drawback is that:", opts: ["It decays too quickly at the start of training", "It is incompatible with warmup", "The schedule is defined by its endpoint, so stopping early leaves you at a high learning rate at a point the schedule never targeted", "It requires more optimizer memory than a constant rate"], a: 2,
      why: "You must commit to a total step count before starting. Stop at half the planned steps and the rate is still high, giving a model measurably worse than one whose schedule was sized for that length. Warmup-stable-decay removes the constraint: hold a constant rate as long as you like, decay briefly whenever you decide to stop, and every point in the stable phase is a usable checkpoint." },
    { type: "mc", q: "Your run's loss is falling normally, but the gradient norm has trended upward over several thousand steps. What does this suggest?", opts: ["Nothing; the gradient norm is expected to grow as the model learns", "The learning rate schedule has a bug", "Gradient clipping is misconfigured", "The run may be becoming unstable, and the signal appears well before the loss shows it"], a: 3,
      why: "A steadily rising gradient norm is a recognized divergence signature that precedes trouble in the loss by a long way, which is why it belongs on the dashboard beside the loss. It is also what distinguishes a run becoming unstable from a single bad batch: the first has a trend, the second does not, and the two call for different responses." }
  ]
});

/* ======================= CHAPTER 15 ======================= */
CHAPTERS.push({
  num: 15, part: 3, title: "How Big, How Long: Scaling Laws",
  blurb: "Given a fixed pile of compute, how large should the model be and how many tokens should it see? For two years the field answered this wrong, and the correction reshaped every model released afterwards. You will fit a scaling law, use it to predict a larger run, and then work through the twist that governs 2026: if a model will serve billions of tokens after training, the compute-optimal answer is not the cost-optimal answer, which is why every model you can download is trained far past the point the law recommends.",
  sections: [
    { title: "Loss Is a Power Law",
      html: "<p>Start with the empirical fact that makes the rest possible. Train a series of models of different sizes on different amounts of data, plot the loss against compute on logarithmic axes, and the points fall on a straight line.</p>" +
      "<p>A straight line on log-log axes is a <strong>power law</strong>: loss falls as compute raised to some negative exponent. It is not a theorem and nobody has derived it from first principles. It is an observation that has held across many orders of magnitude, several architectures and several modalities, which is a different and weaker kind of confidence, and worth holding as such.</p>" +
      "<p>Three things matter about the shape.</p>" +
      "<p><strong>It is smooth.</strong> No cliffs, no plateaus, no thresholds. Every doubling of compute buys the same fixed reduction in loss, forever, within the range anyone has measured.</p>" +
      "<p><strong>It has diminishing returns built in.</strong> A fixed <em>proportional</em> gain requires a fixed <em>multiplicative</em> increase in compute. Halving the distance to the floor costs the same factor every time, so progress feels linear while spending grows exponentially.</p>" +
      "<p><strong>It does not go to zero.</strong> The fitted form includes a floor called the <strong>irreducible loss</strong>: the entropy of language itself. Even a perfect model cannot predict which word a writer chose when several were equally reasonable. Scaling closes the gap to that floor and never reaches it.</p>" +
      "<p>The practical consequence is why anyone cares. If you can fit the law on runs you can afford, you can predict the loss of a run you cannot yet afford, and decide whether it is worth doing before spending the money. Pretraining is one of the few places in software where the outcome of a very expensive job can be forecast reasonably well in advance.</p>" +
      "<div class='fig'><svg viewBox='0 0 760 208' xmlns='http://www.w3.org/2000/svg' font-family='Menlo,monospace'>" +
      "<text x='20' y='18' fill='#2de2ff' font-size='11'>loss against compute, on logarithmic axes</text>" +
      "<line x1='70' y1='150' x2='700' y2='150' stroke='#1c2a45' stroke-width='2'/>" +
      "<line x1='70' y1='34' x2='70' y2='150' stroke='#1c2a45' stroke-width='2'/>" +
      "<text x='24' y='42' fill='#7d8fb0' font-size='9'>loss</text><text x='620' y='170' fill='#7d8fb0' font-size='9'>compute</text>" +
      "<line x1='70' y1='128' x2='700' y2='128' stroke='#ff5d73' stroke-width='2' stroke-dasharray='5 4'/>" +
      "<text x='90' y='144' fill='#ff5d73' font-size='9'>irreducible loss</text>" +
      "<path d='M100 52 L220 74 L340 92 L460 106 L580 116 L680 122' fill='none' stroke='#3ddc97' stroke-width='2.5'/>" +
      "<circle cx='100' cy='52' r='3.5' fill='#3ddc97'/><circle cx='220' cy='74' r='3.5' fill='#3ddc97'/>" +
      "<circle cx='340' cy='92' r='3.5' fill='#3ddc97'/><circle cx='460' cy='106' r='3.5' fill='#3ddc97'/>" +
      "<text x='300' y='62' fill='#7d8fb0' font-size='9.5'>straight on log-log: every doubling of compute</text>" +
      "<text x='300' y='78' fill='#7d8fb0' font-size='9.5'>buys the same proportional drop</text>" +
      "<text x='20' y='192' fill='#c9d6ea' font-size='10.5'>Not a theorem. An observation that has held across many orders of magnitude, which is weaker confidence.</text>" +
      "</svg><div class='fig-cap'>The curve approaches the red line and never reaches it. Scaling closes the gap to language's own entropy.</div></div>" },

    { title: "The Answer the Field Acted On", viz: "llmScalingLaw", vizTitle: "Fix a compute budget, find the best split, then change the law",
      html: "<p>Knowing loss falls with compute is not yet actionable, because compute can be spent two ways. Chapter 9's estimate says training costs about 6ND, so for a fixed budget C you may have a large model on few tokens, or a small model on many. Which?</p>" +
      "<p>Jared Kaplan and colleagues answered this in 2020, and their answer was clear: <strong>spend it on parameters</strong>. Their fitted exponents put roughly three quarters of any increase into model size and a quarter into data. Scale the model aggressively; if data becomes tight, that is a lesser problem.</p>" +
      "<p>The field acted on it, and the result is visible in the models of 2020 to 2022. GPT-3 was 175 billion parameters on 300 billion tokens. Gopher was 280 billion parameters on 300 billion tokens. Both are enormous models trained on data comparable to their own parameter count.</p>" +
      "<h3>The correction</h3>" +
      "<p>Jordan Hoffmann and colleagues re-ran the analysis in 2022 with a more careful experimental design, and got substantially different exponents. Their conclusion, now called the <strong>Chinchilla</strong> result: parameters and data should scale <em>together</em>, roughly equally. Under their fit, compute-optimal training uses about <strong>20 tokens per parameter</strong>.</p>" +
      "<p>Then they demonstrated it, which is what made the paper decisive. Recomputing the compute of both runs:</p>" +
      "<pre><code>model        parameters      tokens    D/N    compute (FLOPs)\nGopher             280B        300B    1.1          5.04e23\nChinchilla          70B        1.4T   20.0          5.88e23</code></pre>" +
      "<p>Roughly the same compute, a model four times smaller, four times the data. Chinchilla outperformed Gopher across the board. The previous two years of scaling had been building models that were too large and too undertrained, and a 70-billion-parameter model beat a 280-billion-parameter one built by the same organization on the same budget.</p>" +
      "<p>Take the machine, fix a budget, and find the allocation each law recommends. Then switch between them and watch the optimum move by a factor of several in model size for identical compute. That is the discovery, and it is what two years of the field's spending rode on.</p>" +
      "<div class='fig'><svg viewBox='0 0 760 216' xmlns='http://www.w3.org/2000/svg' font-family='Menlo,monospace'>" +
      "<text x='20' y='18' fill='#2de2ff' font-size='11'>one compute budget, two recommendations</text>" +
      "<text x='20' y='48' fill='#ff5d73' font-size='10'>Kaplan 2020</text>" +
      "<rect x='140' y='36' width='420' height='16' rx='3' fill='#ff5d73'/><text x='150' y='49' fill='#0b1120' font-size='9.5'>parameters</text>" +
      "<rect x='564' y='36' width='140' height='16' rx='3' fill='#4f7cff'/><text x='574' y='49' fill='#c9d6ea' font-size='9.5'>data</text>" +
      "<text x='140' y='70' fill='#7d8fb0' font-size='9'>spend on size; data is the lesser problem</text>" +
      "<text x='20' y='104' fill='#3ddc97' font-size='10'>Chinchilla 2022</text>" +
      "<rect x='140' y='92' width='196' height='16' rx='3' fill='#3ddc97'/><text x='150' y='105' fill='#0b1120' font-size='9.5'>parameters</text>" +
      "<rect x='340' y='92' width='364' height='16' rx='3' fill='#4f7cff'/><text x='350' y='105' fill='#c9d6ea' font-size='9.5'>data</text>" +
      "<text x='140' y='126' fill='#7d8fb0' font-size='9'>scale both together: about 20 tokens per parameter</text>" +
      "<line x1='20' y1='146' x2='740' y2='146' stroke='#1c2a45' stroke-width='2'/>" +
      "<text x='20' y='168' fill='#c9d6ea' font-size='10.5'>Gopher: 280B on 300B tokens, 5.04e23 FLOPs. Chinchilla: 70B on 1.4T tokens, 5.88e23 FLOPs.</text>" +
      "<text x='20' y='188' fill='#c9d6ea' font-size='10.5'>Same budget, quarter the size, four times the data, and the smaller model won on every measure.</text>" +
      "<text x='20' y='208' fill='#7d8fb0' font-size='10'>Compute recomputed from the published parameter and token counts.</text>" +
      "</svg><div class='fig-cap'>Two years of the field's spending followed the top bar. The bottom bar is what the same money should have bought.</div></div>" },

    { title: "Fitting One Yourself",
      html: "<p>The published laws were fitted on someone else's architecture, data and hyperparameters, and the exponents are not universal. If a scaling decision matters to you, fit your own, and the method is affordable.</p>" +
      "<p>Train a series of small models spanning maybe two orders of magnitude in compute, holding everything constant except size and token count. For each, record the final loss. Fit a power law to those points. Then extrapolate.</p>" +
      "<p>The standard experimental design is the <strong>isoFLOP</strong> sweep, and it is what Chinchilla did. Pick a compute budget. Train several models of different sizes at exactly that budget, which means larger models see proportionally fewer tokens. Plot final loss against model size and you get a U: too small underfits, too large is undertrained, and the bottom of the U is the optimum for that budget. Repeat for several budgets, and the line through the minima gives you the scaling relationship directly.</p>" +
      "<p>Three cautions, all of which have caught real teams.</p>" +
      "<p><strong>Extrapolation error is the point and the risk.</strong> A law fitted over two orders of magnitude and used to predict three beyond is doing real work, and its uncertainty grows with the distance. Report the interval, not just the estimate.</p>" +
      "<p><strong>Hyperparameters must scale too.</strong> The optimal learning rate and batch size change with model size, so if you hold them fixed across the sweep, your large models are handicapped and the fit is wrong in a direction that flatters small models. Techniques for <strong>hyperparameter transfer</strong> across scales exist for exactly this reason, and using none of them is a common error.</p>" +
      "<p><strong>The law says nothing about capabilities.</strong> It predicts loss. Whether a given loss corresponds to a model that can follow instructions, use tools or refuse appropriately is a separate question the law is silent on.</p>" +
      "<div class='fig'><svg viewBox='0 0 760 212' xmlns='http://www.w3.org/2000/svg' font-family='Menlo,monospace'>" +
      "<text x='20' y='18' fill='#2de2ff' font-size='11'>isoFLOP curves: loss against model size, at three fixed budgets</text>" +
      "<line x1='70' y1='160' x2='700' y2='160' stroke='#1c2a45' stroke-width='2'/>" +
      "<line x1='70' y1='34' x2='70' y2='160' stroke='#1c2a45' stroke-width='2'/>" +
      "<text x='30' y='40' fill='#7d8fb0' font-size='9'>loss</text><text x='620' y='178' fill='#7d8fb0' font-size='9'>model size</text>" +
      "<path d='M110 62 L170 84 L230 92 L290 86 L350 70' fill='none' stroke='#ff5d73' stroke-width='2'/>" +
      "<circle cx='230' cy='92' r='4' fill='#ff5d73'/><text x='356' y='66' fill='#ff5d73' font-size='9'>small budget</text>" +
      "<path d='M210 96 L290 116 L370 124 L450 118 L530 102' fill='none' stroke='#ffd166' stroke-width='2'/>" +
      "<circle cx='370' cy='124' r='4' fill='#ffd166'/><text x='536' y='98' fill='#ffd166' font-size='9'>medium</text>" +
      "<path d='M330 126 L420 144 L500 152 L580 146 L660 132' fill='none' stroke='#3ddc97' stroke-width='2'/>" +
      "<circle cx='500' cy='152' r='4' fill='#3ddc97'/><text x='666' y='128' fill='#3ddc97' font-size='9'>large</text>" +
      "<path d='M230 92 L370 124 L500 152' fill='none' stroke='#2de2ff' stroke-width='2' stroke-dasharray='5 4'/>" +
      "<text x='250' y='114' fill='#2de2ff' font-size='9.5'>the line through the minima is the scaling law</text>" +
      "<text x='20' y='200' fill='#c9d6ea' font-size='10.5'>Left of a minimum the model underfits; right of it, the same budget leaves it undertrained.</text>" +
      "</svg><div class='fig-cap'>Each curve is one fixed compute budget spent on models of different sizes. The dashed line is what you extrapolate.</div></div>" },

    { title: "Why Nobody Follows Chinchilla", viz: "llmEmergence", vizTitle: "Change the metric and watch the sudden jump become a smooth curve",
      html: "<p>Here is the puzzle. Chinchilla says roughly 20 tokens per parameter. Corvid-8B's compute-optimal budget is therefore 20 &#215; 8.03 billion = <strong>160.6 billion tokens</strong>. Real models of this size are trained on 15 trillion, which is <strong>93 times</strong> the compute-optimal amount.</p>" +
      "<p>Every open-weights model you can download is, by Chinchilla's standard, drastically overtrained. This is not an oversight. It is a different optimization with a different objective.</p>" +
      "<p>Chinchilla minimizes <em>training</em> compute for a given loss. It assumes training cost is what you care about, and it says nothing about what happens afterwards. But a model that is deployed is run billions of times, and Chapter 9 established that every one of those forward passes costs 2N. Parameters are a one-off cost at training and a permanent tax at inference.</p>" +
      "<h3>Price it</h3>" +
      "<p>Training Corvid-8B on 15 trillion tokens costs 7.227e23 FLOPs. Spend exactly that budget the compute-optimal way instead, and you get:</p>" +
      "<pre><code>                    parameters      tokens   FLOPs per served token\nwhat the field ships      8.03B        15T                   16.06 G\nChinchilla-optimal        77.6B      1.55T                  155.21 G</code></pre>" +
      "<p>The compute-optimal model is 9.7 times more expensive to run, on every token, for the life of the deployment. Now find where that repays the extra training. It does not take long:</p>" +
      "<pre><code>after 5.19 trillion served tokens, the inference saving\nexceeds the entire cost of the training run</code></pre>" +
      "<p>Five trillion tokens is a few months of a moderately successful product. Past that point the smaller, overtrained model is not merely cheaper to serve; it has saved more than it cost to make. Nicholas Sardana and colleagues formalized this in 2023 as <strong>inference-aware scaling</strong>: put expected serving volume into the objective and the optimum moves sharply toward smaller models trained much longer.</p>" +
      "<p>So the rule is not that Chinchilla was wrong. It answered its question correctly, and almost nobody has that question. <strong>Chinchilla is the right answer if you will train the model and never serve it.</strong> Everyone else should train smaller and longer, and the field's apparent disregard for the law is actually agreement with a better-specified version of it.</p>" +
      "<div class='fig'><svg viewBox='0 0 760 208' xmlns='http://www.w3.org/2000/svg' font-family='Menlo,monospace'>" +
      "<text x='20' y='18' fill='#2de2ff' font-size='11'>total cost over a deployment's life, same training budget</text>" +
      "<line x1='70' y1='150' x2='700' y2='150' stroke='#1c2a45' stroke-width='2'/>" +
      "<line x1='70' y1='34' x2='70' y2='150' stroke='#1c2a45' stroke-width='2'/>" +
      "<text x='560' y='170' fill='#7d8fb0' font-size='9'>tokens served</text>" +
      "<line x1='70' y1='120' x2='700' y2='58' stroke='#ff5d73' stroke-width='2.5'/>" +
      "<text x='540' y='56' fill='#ff5d73' font-size='9.5'>77.6B model: 155 GFLOPs/token</text>" +
      "<line x1='70' y1='120' x2='700' y2='114' stroke='#3ddc97' stroke-width='2.5'/>" +
      "<text x='540' y='132' fill='#3ddc97' font-size='9.5'>8.03B model: 16 GFLOPs/token</text>" +
      "<line x1='70' y1='120' x2='700' y2='120' stroke='#7d8fb0' stroke-width='1.5' stroke-dasharray='4 4'/>" +
      "<text x='76' y='134' fill='#7d8fb0' font-size='9'>identical training cost</text>" +
      "<line x1='168' y1='34' x2='168' y2='158' stroke='#ffd166' stroke-width='2' stroke-dasharray='4 4'/>" +
      "<text x='176' y='46' fill='#ffd166' font-size='9.5'>5.19T tokens: the smaller model has repaid its whole training run</text>" +
      "<text x='20' y='196' fill='#c9d6ea' font-size='10.5'>Chinchilla optimizes the y-intercept. Everyone who serves a model has to care about the slope.</text>" +
      "</svg><div class='fig-cap'>Both lines start at the same place by construction. Beyond the gold line the overtrained model is not just cheaper to run, it is cheaper overall.</div></div>" },

    { title: "When the Data Runs Out",
      html: "<p>One more constraint that the original laws did not need to consider and now bind in practice.</p>" +
      "<p>Chinchilla assumes fresh tokens are available on demand. <strong>Data-constrained scaling</strong> is what happens when they are not, and it now binds. At 15 trillion tokens a run, and with the highest-quality text a small fraction of the web, teams are now hitting the edge of what usable text exists. The scaling question becomes what to do when D cannot grow.</p>" +
      "<p>Niklas Muennighoff and colleagues studied this in 2023 and the finding is more encouraging than expected: repeating data is not free but is far from worthless. Up to about four epochs, a repeated token is worth nearly as much as a fresh one. Past that the returns fall away quickly, and by around sixteen epochs additional repetition adds essentially nothing.</p>" +
      "<p>That is a usable planning rule. If you are data-constrained, budget up to roughly four passes over your corpus before the compute is better spent elsewhere, and treat anything past that as approaching a waste. It also raises the value of Chapter 12's filtering work, since a corpus you will see four times deserves more care than one you will see once.</p>" },

    { title: "Emergence, and the Argument About It",
      html: "<p>Scaling laws describe loss, and loss is smooth. Capabilities do not always look smooth. Jason Wei and colleagues catalogued in 2022 a set of <strong>emergent abilities</strong>: tasks where models below some scale perform at chance and models above it perform well, with a sharp transition rather than a gradual improvement. Multi-step arithmetic and certain reasoning tasks are the standard examples.</p>" +
      "<p>The claim is important because it would mean capability is not predictable from loss, and so scaling laws could not tell you what a larger model will be able to do.</p>" +
      "<p>Rylan Schaeffer and colleagues offered a deflationary explanation in 2023, and it is worth understanding because it is a general lesson about measurement. Most of these tasks are scored with <strong>exact match</strong>: the answer is right or it is not. Consider multi-digit arithmetic. A model improving steadily at per-digit accuracy shows nothing at all on exact match until nearly every digit is right, at which point the score jumps from near zero to high. The underlying capability improved smoothly; the <em>metric</em> was discontinuous.</p>" +
      "<p>Score the same outputs with a continuous measure, such as per-token log-likelihood of the correct answer or partial credit per digit, and the jump usually flattens into a curve.</p>" +
      "<p>The honest position is that this explains a great deal of the phenomenon and possibly not all of it. What it definitely establishes is a methodological rule that outlives the debate: <strong>a sharp jump in a discontinuous metric is not evidence of a sharp change in the model.</strong> Chapter 32 builds on this directly.</p>" +
      "<p>Use the emergence machine, look at the jump under exact match, then switch to partial credit and watch it become a smooth line. Nothing about the model changed between those two charts.</p>" +
      "<div class='fig'><svg viewBox='0 0 760 206' xmlns='http://www.w3.org/2000/svg' font-family='Menlo,monospace'>" +
      "<text x='20' y='18' fill='#2de2ff' font-size='11'>the same models, the same outputs, two metrics</text>" +
      "<line x1='70' y1='150' x2='360' y2='150' stroke='#1c2a45' stroke-width='2'/>" +
      "<line x1='70' y1='38' x2='70' y2='150' stroke='#1c2a45' stroke-width='2'/>" +
      "<path d='M80 148 L150 148 L220 147 L250 146 L268 60 L300 48 L350 44' fill='none' stroke='#ff5d73' stroke-width='2.5'/>" +
      "<text x='84' y='34' fill='#ff5d73' font-size='9.5'>exact match: a jump</text>" +
      "<text x='84' y='170' fill='#7d8fb0' font-size='9'>model scale</text>" +
      "<line x1='420' y1='150' x2='710' y2='150' stroke='#1c2a45' stroke-width='2'/>" +
      "<line x1='420' y1='38' x2='420' y2='150' stroke='#1c2a45' stroke-width='2'/>" +
      "<path d='M430 142 L490 124 L550 104 L610 82 L660 62 L700 48' fill='none' stroke='#3ddc97' stroke-width='2.5'/>" +
      "<text x='434' y='34' fill='#3ddc97' font-size='9.5'>partial credit: a curve</text>" +
      "<text x='434' y='170' fill='#7d8fb0' font-size='9'>model scale</text>" +
      "<text x='20' y='196' fill='#c9d6ea' font-size='10.5'>A sharp jump in a discontinuous metric is not evidence of a sharp change in the model.</text>" +
      "</svg><div class='fig-cap'>Multi-digit arithmetic scores nothing on exact match until nearly every digit is right, then leaps. The capability improved smoothly throughout.</div></div>" },

    { title: "What the Laws Do Not Tell You",
      html: "<p>Scaling laws are the closest thing this field has to an engineering forecast, and their limits are as important as their content.</p>" +
      "<p><strong>They predict loss, not usefulness.</strong> A lower loss does not tell you the model follows instructions, refuses appropriately, or is safe to deploy. Everything in Part IV exists because the pretraining loss cannot express those things.</p>" +
      "<p><strong>They are fitted to a setting.</strong> Change the architecture, the data mixture, or the hyperparameter scaling and the exponents move. Chinchilla's constant was measured on Chinchilla's setup; it is a good default and not a law of nature.</p>" +
      "<p><strong>They assume the data is there.</strong> The previous section's constraint is now real for the largest runs.</p>" +
      "<p><strong>They say nothing about post-training or test-time compute.</strong> Chapter 24 covers a third axis entirely, spending more compute at inference rather than at training, on which these laws are silent.</p>" +
      "<p><strong>They do not price serving.</strong> Which was this chapter's main argument, and it is the one that changes what you actually build.</p>" +
      "<div class='callout'><strong>Interview lens.</strong> &#8220;Chinchilla says 20 tokens per parameter, so why is Llama-3-8B trained on 15 trillion?&#8221; The complete answer names the objectives: Chinchilla minimizes training compute for a target loss and is silent on inference, while a deployed model pays 2N FLOPs on every token forever. Numbers make it: the same compute spent compute-optimally would give a 77.6B model at 155 GFLOPs per token against 16, and the smaller model repays its entire training run after about five trillion served tokens. Chinchilla is right for a model you train and never serve.</div>" },

    { title: "Exercises",
      html: "<ol>" +
      "<li><strong>Trace.</strong> You have 1e23 FLOPs. Using 6ND and the 20-tokens-per-parameter rule, compute the compute-optimal parameter count and token count. Then compute what you would get if you instead fixed the model at a quarter of that size and spent the whole budget on data. State the tokens per parameter of the second option, and how many times over-trained it is by Chinchilla's standard.</li>" +
      "<li><strong>Trace.</strong> Take those two models from the previous exercise and compute the FLOPs each spends per served token. Then find the number of served tokens at which the smaller model's total cost, training plus inference, drops below the larger one's. Compare that figure with the tokens a moderately used product serves in a year, and state which model you would build.</li>" +
      "<li><strong>Investigate.</strong> Find three recent open-weights models and record their parameter counts and published training token counts. Compute D/N for each. Then compute how many times Chinchilla-optimal each one is. Plot them against release date if you have enough of them; the trend is the subject of section 4, visible in public data.</li>" +
      "<li><strong>Investigate.</strong> Find a published claim of an emergent ability. Identify the metric used to score it. Determine whether that metric is discontinuous, and whether the authors report a continuous alternative. Then write two sentences on whether the claim survives Schaeffer's objection, and say honestly if you cannot tell from what was published.</li>" +
      "<li><strong>Build.</strong> Train five small models spanning about an order of magnitude in compute, holding data, architecture and hyperparameters fixed apart from size and token count. Record the final validation loss of each and fit a power law to the points. Then use the fit to predict the loss of a sixth model at roughly three times the compute of your largest, train it, and compare. Report the prediction, the actual, and the error. That error, on a three-times extrapolation, is your honest estimate of what a hundred-times extrapolation is worth.</li>" +
      "</ol>" }
  ],
  terms: [
    { t: "scaling law", d: "An empirical power-law relationship between loss and compute, parameters or data, fitted from runs rather than derived." },
    { t: "power law", d: "A relationship appearing as a straight line on logarithmic axes, in which a fixed multiplicative increase buys a fixed proportional gain." },
    { t: "irreducible loss", d: "The floor term in a fitted scaling law, corresponding to the entropy of language itself, which no amount of scale removes." },
    { t: "compute-optimal", d: "The allocation of a fixed training budget between parameters and tokens that minimizes final loss." },
    { t: "Chinchilla", d: "The 2022 result that parameters and data should scale together, at roughly 20 tokens per parameter, correcting the previous parameter-heavy consensus." },
    { t: "tokens per parameter", d: "The ratio D/N used to describe how heavily trained a model is; about 1 for Gopher, 20 for Chinchilla, and over 1,800 for a modern 8B model." },
    { t: "isoFLOP curve", d: "Loss plotted against model size at a fixed compute budget, forming a U whose minimum is the optimum for that budget." },
    { t: "extrapolation error", d: "The growing uncertainty in a fitted law as it is used further beyond the range of runs it was fitted on." },
    { t: "hyperparameter transfer", d: "Scaling learning rate and batch size with model size, without which a scaling sweep handicaps its larger models and produces a wrong fit." },
    { t: "inference-aware scaling", d: "Including expected serving volume in the objective, which moves the optimum toward smaller models trained far longer." },
    { t: "overtrained", d: "Trained on far more tokens than the compute-optimal rule recommends; every current open-weights model is, deliberately." },
    { t: "data-constrained scaling", d: "The regime where fresh tokens run out; repeated data holds most of its value to about four epochs and little past sixteen." },
    { t: "emergent ability", d: "A capability appearing abruptly above some scale, much of which is explained by discontinuous scoring rather than by discontinuous learning." },
    { t: "exact match", d: "Scoring an answer as right or wrong with no partial credit; a discontinuous metric that can turn smooth improvement into an apparent jump." }
  ],
  quiz: [
    { type: "mc", q: "Gopher used 280B parameters on 300B tokens; Chinchilla used 70B on 1.4T at roughly the same compute, and won. What did that establish?", opts: ["That parameters and data should scale together, and the previous consensus had been building models too large and too undertrained", "That smaller models are always better", "That Gopher's training run had a bug", "That data quality matters more than data quantity"], a: 0,
      why: "Recomputing from the published figures gives 5.04e23 and 5.88e23 FLOPs, so the budgets are comparable. A model a quarter the size, trained on four times the data, beat it across the board. The lesson is about allocation, not about size: at a different budget the compute-optimal model is larger, and the same 20-tokens-per-parameter ratio still applies." },
    { type: "mc", q: "Corvid-8B's compute-optimal token budget is 160.6 billion, yet real models of that size are trained on 15 trillion. Why?", opts: ["The scaling law was found to be wrong", "Because more data always improves a model without limit", "Because Chinchilla minimizes training compute and is silent about inference, which costs 2N FLOPs on every token forever", "Because 8B models cannot reach compute-optimal loss"], a: 2,
      why: "Chinchilla answered its question correctly; almost nobody has that question. Parameters are a one-off cost at training and a permanent tax at serving. Spending the same compute compute-optimally would give a 77.6B model costing 155.21 GFLOPs per token against 16.06, and the smaller model repays its entire training run after about 5.19 trillion served tokens." },
    { type: "mc", q: "What does an isoFLOP sweep hold fixed, and what does it vary?", opts: ["Fixed model size, varying compute", "Fixed token count, varying model size", "Fixed loss target, varying architecture", "Fixed compute budget, varying model size with token count adjusted to match"], a: 3,
      why: "Each curve is one budget spent on models of different sizes, so a larger model necessarily sees fewer tokens. The result is a U: too small underfits, too large is undertrained. Repeat at several budgets and the line through the minima gives the scaling relationship directly. It is the design Chinchilla used." },
    { type: "mc", q: "A team runs a scaling sweep with a fixed learning rate across all model sizes. What is wrong with the resulting fit?", opts: ["Nothing; holding hyperparameters fixed is the correct control", "The larger models are handicapped, so the fit is biased in a direction that flatters small models", "The loss cannot be compared across sizes", "The sweep needs at least ten points to be valid"], a: 1,
      why: "The optimal learning rate and batch size change with model size, so a rate tuned for the small end leaves the large models undertrained for reasons unrelated to scale. The fit then understates the benefit of size. This is a common enough error that techniques for transferring hyperparameters across scales exist specifically to avoid it." },
    { type: "blank", q: "The floor term in a fitted scaling law, corresponding to the entropy of language itself, is called the ____ loss.", a: ["irreducible"],
      why: "Even a perfect model cannot predict which of several equally reasonable words a writer chose. Scaling closes the gap toward that floor and never reaches it, which is why the fitted form has three terms rather than two and why a loss of zero is not a meaningful target." },
    { type: "blank", q: "Including expected serving volume in the scaling objective, which moves the optimum toward smaller models trained much longer, is called ____-aware scaling.", a: ["inference"],
      why: "Formalized by Sardana and colleagues in 2023. It explains why every downloadable model is drastically overtrained by Chinchilla's standard: the field is optimizing total lifetime cost rather than training cost, and past a few trillion served tokens the smaller model is cheaper overall, not merely cheaper to run." },
    { type: "order", q: "Order the steps of fitting and using a scaling law:", items: ["train several models at each of several fixed compute budgets", "find the loss-minimizing model size within each budget", "fit a power law through those minima", "extrapolate to a larger budget and report the error bars"],
      why: "Sweep, minimize, fit, extrapolate. The last step is where the value is and where the risk is: a law fitted over two orders of magnitude and used three beyond is doing real work, and its uncertainty grows with the distance. Reporting the interval rather than the point estimate is the difference between a forecast and a guess." },
    { type: "mc", q: "A task's accuracy jumps from near zero to high at a certain model scale. What should you check before calling it emergent?", opts: ["Whether the training data contained the task", "Whether the models used the same tokenizer", "Whether the larger model was trained for more epochs", "Whether the metric is discontinuous, such as exact match, which can turn smooth improvement into an apparent jump"], a: 3,
      why: "Schaeffer and colleagues showed that a model improving steadily at per-digit accuracy scores nothing on exact-match multi-digit arithmetic until almost every digit is right, at which point the score leaps. Scoring the same outputs with partial credit usually flattens the jump into a curve. The general rule outlives the debate: a sharp jump in a discontinuous metric is not evidence of a sharp change in the model." },
    { type: "mc", q: "You are data-constrained and considering additional epochs over your corpus. What does the evidence suggest?", opts: ["Up to about four epochs a repeated token is worth nearly as much as a fresh one, with returns falling away sharply after that", "Repeating data provides no benefit and should be avoided", "Repeating data is equivalent to fresh data at any number of epochs", "Repetition helps only if the corpus is deduplicated first"], a: 0,
      why: "Muennighoff and colleagues measured this in 2023, and the answer is more encouraging than expected. The practical rule is to budget up to roughly four passes before the compute is better spent elsewhere, and to treat anything approaching sixteen as nearly wasted. It also raises the value of Chapter 12's filtering, since a corpus you will see four times deserves more care than one you see once." },
    { type: "mc", q: "Which question can a scaling law NOT answer?", opts: ["What loss a model of a given size trained on a given number of tokens will reach", "How to split a fixed compute budget between parameters and data", "Whether a model at a given loss will follow instructions or refuse appropriately", "Roughly how many GPU-days a target loss will require"], a: 2,
      why: "The law predicts loss, and loss is a statement about next-token prediction on held-out text. Instruction-following, refusal and tool use are not what the objective rewarded, which is why Part IV exists as a separate half of this course. The other three are exactly what the law is for, and are the reason pretraining is one of the few very expensive jobs whose outcome can be forecast." }
  ]
});

/* ======================= CHAPTER 16 ======================= */
CHAPTERS.push({
  num: 16, part: 3, title: "The GPU: Where the Time Actually Goes",
  blurb: "This is the one chapter about hardware, and it is here because the most important fact in Part V cannot be proved without it. A GPU is thousands of arithmetic units attached to memory that cannot feed them fast enough. Whether an operation is limited by arithmetic or by memory traffic is decided by a single number, and once you can compute it you can predict which optimizations will help before trying any of them. You will place real operations on a roofline and find that a matrix multiply and a matrix-vector multiply live in different worlds.",
  sections: [
    { title: "Arithmetic Units and a Straw",
      html: "<p>Chapter 9 counted FLOPs and warned that FLOPs are not time. This chapter is that warning, made precise.</p>" +
      "<p>A modern accelerator has two headline numbers, and the relationship between them is the whole subject. An H100 performs about <strong>989 trillion bfloat16 operations per second</strong> and moves about <strong>3.35 terabytes per second</strong> between its memory and its compute units. Divide one by the other and you get the exchange rate:</p>" +
      "<pre><code>989e12 FLOP/s / 3.35e12 byte/s = 295 FLOPs per byte</code></pre>" +
      "<p>The hardware can perform 295 arithmetic operations in the time it takes to fetch one byte. If your computation does fewer operations per byte than that, the arithmetic units sit idle waiting for data, and buying a faster GPU will not help. That ratio is called the <strong>ridge point</strong>, and it is the single most useful number about a piece of hardware.</p>" +
      "<p>It is not constant across generations, and the direction of travel matters. On an A100 the same calculation gives 312 divided by 2.039, or <strong>153 FLOPs per byte</strong>. Compute grew faster than bandwidth, so the ridge point roughly doubled, so more kernels became memory-bound rather than fewer. Hardware progress has been making this problem worse, not better, and every optimization in Part V is a response to that.</p>" +
      "<h3>The hierarchy underneath</h3>" +
      "<p>The 3.35 TB/s figure is for <strong>HBM</strong>, the large memory holding your weights, and it is the slowest level of a hierarchy that gets faster and much smaller as you go in.</p>" +
      "<ul>" +
      "<li><strong>HBM</strong>, tens of gigabytes, terabytes per second. Everything lives here and every access is expensive.</li>" +
      "<li><strong>L2 cache</strong>, tens of megabytes, several times faster, shared across the chip.</li>" +
      "<li><strong>Shared memory</strong>, on the order of a hundred kilobytes per streaming multiprocessor, roughly an order of magnitude faster than HBM, and explicitly managed by the programmer rather than automatic.</li>" +
      "<li><strong>Registers</strong>, kilobytes per thread, effectively free.</li>" +
      "</ul>" +
      "<p>That third level is the one to remember, because it is programmable. Every major kernel optimization in this course is a scheme for doing more work in shared memory and touching HBM less. FlashAttention in Chapter 28 is exactly that and nothing more.</p>" +
      "<p>The compute side is organized as <strong>streaming multiprocessors</strong>, each running many threads in lockstep groups of 32 called <strong>warps</strong>. The practical consequence for this course is just that the machine is enormously parallel and prefers regular, predictable access patterns; the details belong to a CUDA course rather than this one.</p>" +
      "<div class='fig'><svg viewBox='0 0 760 200' xmlns='http://www.w3.org/2000/svg' font-family='Menlo,monospace'>" +
      "<text x='20' y='18' fill='#2de2ff' font-size='11'>the memory hierarchy: faster and smaller as you go in</text>" +
      "<rect x='20' y='32' width='680' height='30' rx='5' fill='#111a2e' stroke='#ff5d73' stroke-width='2'/>" +
      "<text x='36' y='51' fill='#ff5d73' font-size='10'>HBM &#183; 80 GB &#183; 3.35 TB/s</text>" +
      "<text x='420' y='51' fill='#7d8fb0' font-size='9'>weights, KV cache, activations all live here</text>" +
      "<rect x='90' y='70' width='540' height='28' rx='5' fill='#111a2e' stroke='#ffd166' stroke-width='2'/>" +
      "<text x='106' y='88' fill='#ffd166' font-size='10'>L2 cache &#183; tens of MB</text>" +
      "<text x='420' y='88' fill='#7d8fb0' font-size='9'>automatic, shared across the chip</text>" +
      "<rect x='170' y='106' width='380' height='28' rx='5' fill='#111a2e' stroke='#3ddc97' stroke-width='2.5'/>" +
      "<text x='186' y='124' fill='#3ddc97' font-size='10'>shared memory &#183; ~100 KB per SM</text>" +
      "<text x='420' y='124' fill='#3ddc97' font-size='9'>you manage this one</text>" +
      "<rect x='260' y='142' width='200' height='26' rx='5' fill='#111a2e' stroke='#4f7cff' stroke-width='2'/>" +
      "<text x='276' y='159' fill='#4f7cff' font-size='10'>registers &#183; effectively free</text>" +
      "<text x='20' y='190' fill='#c9d6ea' font-size='10.5'>Every kernel optimization in this course is a scheme for staying in the green band and touching the red one less.</text>" +
      "</svg><div class='fig-cap'>Shared memory is the level that matters, because it is the one a kernel author controls. FlashAttention is entirely an exercise in using it.</div></div>" },

    { title: "One Number Decides Everything", viz: "llmRoofline", vizTitle: "Plot a matmul at batch 64, then set batch to 1",
      html: "<p>For any operation, count two things: the floating-point operations it performs, and the bytes it must move between HBM and the compute units. Divide the first by the second and you have its <strong>arithmetic intensity</strong>, in FLOPs per byte.</p>" +
      "<p>Compare it with the ridge point and you know which limit binds. Below the ridge, the operation is <strong>memory-bound</strong> and its time is bytes divided by bandwidth. Above, it is <strong>compute-bound</strong> and its time is FLOPs divided by throughput. Nothing else is needed.</p>" +
      "<h3>The comparison that matters</h3>" +
      "<p>Take one matrix from Corvid's feed-forward network, 4,096 by 14,336, in bfloat16. That matrix is 117.4 MB and must be read from HBM whatever you do with it. Now vary how many tokens you push through it, computed on 8 September 2026:</p>" +
      "<pre><code>tokens        FLOPs      bytes moved    arithmetic intensity\n     1     0.1 GFLOP       117.5 MB                     1.0\n     8     0.9 GFLOP       117.7 MB                     8.0\n    32     3.8 GFLOP       118.6 MB                    31.7\n   128    15.0 GFLOP       122.2 MB                   123.1\n 8,192   962.1 GFLOP       419.4 MB                 2,293.8</code></pre>" +
      "<p>Read the bytes column first. From one token to 128, the arithmetic grows by a factor of 128 and the traffic grows by 4%. The weights dominate the traffic and they are read once regardless. That is why the intensity climbs almost linearly with the number of tokens, and it is the entire economic argument for batching in Chapter 27.</p>" +
      "<p>Now put those on an H100, whose ridge point is 295:</p>" +
      "<pre><code>tokens    compute time    memory time      verdict\n     1        0.12 us        35.07 us      memory-bound\n    32        3.80 us        35.41 us      memory-bound\n 8,192      972.77 us       125.20 us      compute-bound</code></pre>" +
      "<p>Processing one token takes 35 microseconds, and 34.95 of them are spent waiting for memory. Processing 32 tokens takes almost exactly the same 35 microseconds. <strong>Thirty-two tokens for the price of one</strong>, because the expensive part was never the arithmetic.</p>" +
      "<p>Note also what the table does not show: even at 128 tokens the intensity is 123, still well below the H100's ridge point of 295. Batching walks you up the slope and does not necessarily get you off it.</p>" +
      "<div class='fig'><svg viewBox='0 0 760 218' xmlns='http://www.w3.org/2000/svg' font-family='Menlo,monospace'>" +
      "<text x='20' y='18' fill='#2de2ff' font-size='11'>one 4,096 x 14,336 matrix: work grows, traffic does not</text>" +
      "<text x='20' y='46' fill='#7d8fb0' font-size='10'>1 token</text>" +
      "<rect x='130' y='34' width='2' height='14' rx='1' fill='#3ddc97'/>" +
      "<rect x='130' y='52' width='300' height='14' rx='3' fill='#ff5d73'/><text x='442' y='64' fill='#7d8fb0' font-size='9'>117.5 MB &#183; AI 1.0</text>" +
      "<text x='20' y='96' fill='#7d8fb0' font-size='10'>32 tokens</text>" +
      "<rect x='130' y='84' width='12' height='14' rx='2' fill='#3ddc97'/>" +
      "<rect x='130' y='102' width='303' height='14' rx='3' fill='#ff5d73'/><text x='442' y='114' fill='#7d8fb0' font-size='9'>118.6 MB &#183; AI 31.7</text>" +
      "<text x='20' y='146' fill='#7d8fb0' font-size='10'>8,192 tokens</text>" +
      "<rect x='130' y='134' width='560' height='14' rx='3' fill='#3ddc97'/>" +
      "<rect x='130' y='152' width='330' height='14' rx='3' fill='#ff5d73'/><text x='472' y='164' fill='#3ddc97' font-size='9'>419.4 MB &#183; AI 2,293.8</text>" +
      "<rect x='130' y='180' width='12' height='9' rx='2' fill='#3ddc97'/><text x='150' y='188' fill='#7d8fb0' font-size='9'>arithmetic (log scale)</text>" +
      "<rect x='320' y='180' width='12' height='9' rx='2' fill='#ff5d73'/><text x='340' y='188' fill='#7d8fb0' font-size='9'>bytes moved (linear)</text>" +
      "<text x='20' y='210' fill='#c9d6ea' font-size='10.5'>The weights are 117.4 MB and are read once regardless. That is why intensity climbs with tokens.</text>" +
      "</svg><div class='fig-cap'>From 1 token to 128 the arithmetic grows 128-fold and the traffic grows 4%. Batching is close to free until the ridge point.</div></div>" },

    { title: "Two Operations, Two Worlds",
      html: "<p>The table above is one matrix. Do it for the whole model and you have the fact Part V is built on.</p>" +
      "<p>Generating one token requires reading every weight once. Corvid at bfloat16 is 16.06 GB of weights. On an H100 at 3.35 TB/s:</p>" +
      "<pre><code>16.06 GB / 3.35 TB/s = 4.79 ms per token\n                     = 209 tokens per second, ceiling</code></pre>" +
      "<p>And the arithmetic that token requires, from Chapter 9's 2N rule, is 16.06 GFLOPs, which at 989 TFLOP/s takes <strong>0.016 milliseconds</strong>. The memory time is 295 times the compute time, which is precisely the ridge point, because whole-model decode has an arithmetic intensity of almost exactly 1.</p>" +
      "<p>Sit with what that means. During single-stream generation, an H100 is doing useful arithmetic for roughly one three-hundredth of the time. The rest is the machine reading 16 GB of weights out of memory to perform one pass of trivial arithmetic on a single vector. You are not renting a compute device; you are renting a memory-bandwidth device with some arithmetic attached.</p>" +
      "<p>The general form is worth stating cleanly, because it is the shape of the whole field:</p>" +
      "<ul>" +
      "<li><strong>Matrix times matrix</strong> reuses each loaded value many times. Intensity is high, the operation is compute-bound, and the hardware is used well.</li>" +
      "<li><strong>Matrix times vector</strong> uses each loaded weight exactly once. Intensity is about 1, the operation is memory-bound, and almost all the hardware idles.</li>" +
      "</ul>" +
      "<p>Prefill is the first. Decode is the second. That is Chapter 26 in two lines, and it is now derived rather than asserted.</p>" +
      "<p>Every optimization in Part V is one of three moves against this: raise the intensity by processing more tokens per weight read, which is batching in Chapter 27; cut the bytes by making the weights smaller, which is quantization in Chapter 29; or get more tokens out of each pass, which is speculative decoding in Chapter 28. Knowing the intensity tells you which is worth trying.</p>" +
      "<div class='fig'><svg viewBox='0 0 760 234' xmlns='http://www.w3.org/2000/svg' font-family='Menlo,monospace'>" +
      "<text x='20' y='18' fill='#2de2ff' font-size='11'>the roofline: achievable throughput against arithmetic intensity</text>" +
      "<line x1='70' y1='170' x2='710' y2='170' stroke='#1c2a45' stroke-width='2'/>" +
      "<line x1='70' y1='34' x2='70' y2='170' stroke='#1c2a45' stroke-width='2'/>" +
      "<text x='20' y='42' fill='#7d8fb0' font-size='9'>TFLOP/s</text>" +
      "<text x='530' y='190' fill='#7d8fb0' font-size='9'>arithmetic intensity</text>" +
      "<line x1='70' y1='170' x2='330' y2='56' stroke='#ff5d73' stroke-width='2.5'/>" +
      "<line x1='330' y1='56' x2='710' y2='56' stroke='#3ddc97' stroke-width='2.5'/>" +
      "<text x='120' y='120' fill='#ff5d73' font-size='9.5'>bandwidth slope</text>" +
      "<text x='470' y='48' fill='#3ddc97' font-size='9.5'>compute ceiling: 989 TFLOP/s</text>" +
      "<line x1='330' y1='56' x2='330' y2='178' stroke='#ffd166' stroke-width='1.5' stroke-dasharray='4 4'/>" +
      "<text x='290' y='196' fill='#ffd166' font-size='9'>ridge: 295</text>" +
      "<circle cx='92' cy='161' r='5' fill='#ff5d73'/><text x='360' y='160' fill='#ff5d73' font-size='9'>decode, 1 token: AI 1.0</text>" +
      "<circle cx='140' cy='140' r='4' fill='#ffd166'/><text x='360' y='140' fill='#ffd166' font-size='9'>batch 32: AI 32</text>" +
      "<circle cx='210' cy='109' r='4' fill='#ffd166'/><text x='360' y='120' fill='#ffd166' font-size='9'>batch 128: AI 123, still on the slope</text>" +
      "<circle cx='620' cy='56' r='5' fill='#3ddc97'/><text x='360' y='100' fill='#3ddc97' font-size='9'>prefill 8,192: AI 2,294</text>" +
      "<text x='20' y='222' fill='#c9d6ea' font-size='10.5'>Same weights, same hardware. Only the tokens per weight read differ, and that moves you 2,000-fold.</text>" +
      "</svg><div class='fig-cap'>The horizontal axis is logarithmic. Everything Part V does is an attempt to move a workload to the right, or to move the red line up.</div></div>" +
      "<p>Take the roofline machine and plot a matmul at batch 64. Then set the batch to 1 and watch the point fall off the ceiling and onto the slope. That single transition is the prefill-decode story, one chapter early.</p>" },

    { title: "Doing Less Travelling", viz: "llmFusion", vizTitle: "Toggle fusion and watch the bytes moved, not the FLOPs",
      html: "<p>If bytes are the constraint, the obvious optimization is to move fewer of them, and the most common way is <strong>kernel fusion</strong>.</p>" +
      "<p>Consider a sequence you meet constantly: normalize, then apply an activation. Written as two separate operations, the GPU reads the tensor from HBM, normalizes it, writes it back, reads it again, applies the activation, writes it again. Four trips for two cheap operations.</p>" +
      "<p>Fused into one kernel, it reads once, does both, and writes once. Two trips instead of four, for identical arithmetic. Since both operations are elementwise and have an intensity near 1, they were entirely memory-bound, so halving the traffic roughly halves the time.</p>" +
      "<p>The general rule follows from the last section: <strong>fusion helps memory-bound operations and does nothing for compute-bound ones.</strong> Fusing two large matrix multiplications saves an intermediate write and changes almost nothing, because the arithmetic was the constraint. This is why fusion effort concentrates on the small elementwise operations around the big matmuls rather than on the matmuls themselves, which is counterintuitive until you have the intensity number.</p>" +
      "<p>Two related ideas you will meet in configs. <strong>Operator fusion</strong> in a compiler, such as <code>torch.compile</code>, finds these opportunities automatically and is usually worth enabling. <strong>CUDA graphs</strong> address a different overhead, the cost of launching many small kernels one at a time, by recording a whole sequence and replaying it as a unit; at decode, where each step launches hundreds of tiny kernels, this can be a substantial share of the time.</p>" +
      "<div class='fig'><svg viewBox='0 0 760 196' xmlns='http://www.w3.org/2000/svg' font-family='Menlo,monospace'>" +
      "<text x='20' y='18' fill='#2de2ff' font-size='11'>normalize then activate: trips to HBM</text>" +
      "<text x='20' y='48' fill='#ff5d73' font-size='10'>unfused</text>" +
      "<rect x='110' y='36' width='120' height='16' rx='3' fill='#ff5d73'/><text x='118' y='49' fill='#0b1120' font-size='9'>read</text>" +
      "<rect x='236' y='36' width='120' height='16' rx='3' fill='#ff5d73'/><text x='244' y='49' fill='#0b1120' font-size='9'>write</text>" +
      "<rect x='362' y='36' width='120' height='16' rx='3' fill='#ff5d73'/><text x='370' y='49' fill='#0b1120' font-size='9'>read</text>" +
      "<rect x='488' y='36' width='120' height='16' rx='3' fill='#ff5d73'/><text x='496' y='49' fill='#0b1120' font-size='9'>write</text>" +
      "<text x='622' y='49' fill='#ff5d73' font-size='9'>4 trips</text>" +
      "<text x='20' y='88' fill='#3ddc97' font-size='10'>fused</text>" +
      "<rect x='110' y='76' width='120' height='16' rx='3' fill='#3ddc97'/><text x='118' y='89' fill='#0b1120' font-size='9'>read</text>" +
      "<rect x='236' y='76' width='120' height='16' rx='3' fill='#3ddc97'/><text x='244' y='89' fill='#0b1120' font-size='9'>write</text>" +
      "<text x='378' y='89' fill='#3ddc97' font-size='9'>2 trips &#183; identical arithmetic &#183; about half the time</text>" +
      "<line x1='20' y1='112' x2='740' y2='112' stroke='#1c2a45' stroke-width='2'/>" +
      "<text x='20' y='136' fill='#c9d6ea' font-size='10.5'>This works because both operations have an intensity near 1, so time was traffic.</text>" +
      "<text x='20' y='158' fill='#c9d6ea' font-size='10.5'>Fusing two large matmuls saves one intermediate write and changes almost nothing, because they were</text>" +
      "<text x='20' y='176' fill='#c9d6ea' font-size='10.5'>compute-bound already.</text>" +
      "</svg><div class='fig-cap'>Counterintuitive until you have the intensity number: the optimization targets the cheap operations, not the expensive ones.</div></div>" },

    { title: "Writing One, at Survey Depth",
      html: "<p>You do not need to write CUDA to work with language models, and knowing what a kernel looks like changes how you read performance claims. <strong>Triton</strong> is the usual entry point: a Python-embedded language where you write the computation for one block of data and the compiler handles the rest.</p>" +
      "<p>The shape of every such kernel is the same three moves, and they map exactly onto the hierarchy from section 1.</p>" +
      "<ol>" +
      "<li><strong>Decide which block of the output this program instance computes</strong>, from its program id. The work is partitioned so each instance handles a tile.</li>" +
      "<li><strong>Load that tile's inputs from HBM into fast memory</strong>, once. This is the expensive step and the whole point of the design.</li>" +
      "<li><strong>Compute entirely in fast memory, then write the result back</strong>, once.</li>" +
      "</ol>" +
      "<p>The skill is not in the arithmetic, which is usually a few lines. It is in <strong>tiling</strong>: choosing tile sizes so that a tile fits in shared memory, so that the loads are contiguous, and so that enough instances run concurrently to keep the machine busy while some wait on memory. Those choices are where a fast kernel differs from a slow one by a factor of five.</p>" +
      "<p>FlashAttention is the famous instance. Chapter 5 showed the attention score matrix is n by n and enormous. FlashAttention never writes it to HBM: it processes the computation in tiles that stay in shared memory, keeping a running softmax so the result is exact. The arithmetic is identical to standard attention. Only the traffic changed, and that was the whole win.</p>" },

    { title: "Measuring Instead of Guessing",
      html: "<p>Everything above is a prediction. Profilers tell you what happened, and three numbers answer most questions.</p>" +
      "<p><strong>Achieved occupancy</strong> is what fraction of the machine's parallel capacity is in use. Low occupancy usually means the work was not divided into enough pieces, or each piece demanded too many registers.</p>" +
      "<p><strong>Achieved bandwidth</strong> is bytes moved per second, compared with the hardware's peak. If a kernel is running at a high fraction of peak bandwidth and its intensity is below the ridge point, it is doing as well as it can and no amount of tuning will help; the fix has to change the algorithm, not the kernel.</p>" +
      "<p><strong>Achieved FLOP/s against peak</strong> answers the same question from the other side. A matmul running at 30% of peak has a problem worth investigating; one at 80% is close to done.</p>" +
      "<p>The discipline this chapter is really teaching is to compute the intensity <em>before</em> profiling. If the arithmetic says an operation is memory-bound at intensity 1, and the profiler says it is achieving 85% of peak bandwidth, there is no optimization left at that level and you should stop looking. Engineers without the intensity number spend days tuning kernels that were already at the hardware's limit.</p>" +
      "<div class='callout'><strong>Interview lens.</strong> &#8220;You doubled your GPU's FLOP/s and generation speed barely changed. Why?&#8221; The answer is arithmetic intensity: single-stream decode reads every weight to produce one token, giving an intensity near 1 against a ridge point of 295, so it is bound by memory bandwidth and not by arithmetic. Doubling compute moves the ceiling the workload never reached. What would help is more tokens per weight read, fewer bytes per weight, or more tokens per pass, which are Chapters 27, 29 and 28.</div>" },

    { title: "Exercises",
      html: "<ol>" +
      "<li><strong>Trace.</strong> A GPU delivers 200 TFLOP/s of bf16 and 800 GB/s of bandwidth. Compute its ridge point. Then compute the arithmetic intensity of multiplying a 4,096 by 4,096 weight matrix by a single vector, and by a batch of 64 vectors, both in bf16. State which side of the ridge each falls on, and what the time for each would be.</li>" +
      "<li><strong>Trace.</strong> Corvid at 4-bit weights is 4.02 GB rather than 16.06 GB. Recompute the whole-model decode figures from section 3 at that size: bytes per token, milliseconds on an H100, and the tokens-per-second ceiling. Then state by what factor throughput improved and why quantization is a latency optimization at least as much as a memory one.</li>" +
      "<li><strong>Investigate.</strong> Find the published bf16 throughput and memory bandwidth for two accelerators a generation apart. Compute both ridge points. Then state whether the newer one makes memory-bound workloads better or worse off, and what that implies about the direction the field's optimizations have to take.</li>" +
      "<li><strong>Investigate.</strong> Profile a single matrix multiplication on any GPU you have, at batch 1 and at a batch large enough to be compute-bound. Record achieved bandwidth and achieved FLOP/s for each. Compare with your predicted intensity. If the batch-1 case is near peak bandwidth, you have confirmed by measurement that no kernel tuning would help it.</li>" +
      "<li><strong>Build.</strong> Write a function that takes an operation's shapes and dtype and returns its FLOPs, its bytes moved, its arithmetic intensity, and a verdict against a GPU's ridge point. Run it over every operation in one Corvid transformer block, at batch 1 and at batch 256, and produce two ranked lists of where the time goes. The two lists will be almost entirely different, and the difference is why prefill and decode need separate chapters.</li>" +
      "</ol>" }
  ],
  terms: [
    { t: "HBM", d: "High-bandwidth memory: the large, comparatively slow store where weights, KV cache and activations live, and every access to which is expensive." },
    { t: "shared memory", d: "A small, fast, explicitly managed store per streaming multiprocessor; the level a kernel author controls and the target of every major kernel optimization." },
    { t: "streaming multiprocessor", d: "One of the many independent compute units on a GPU, each running threads in lockstep groups called warps." },
    { t: "arithmetic intensity", d: "FLOPs performed per byte moved from memory; the single number that decides whether an operation is limited by compute or by bandwidth." },
    { t: "ridge point", d: "A hardware's throughput divided by its bandwidth, in FLOPs per byte; 295 for an H100 and 153 for an A100." },
    { t: "roofline", d: "A plot of achievable throughput against arithmetic intensity, with a bandwidth slope meeting a compute ceiling at the ridge point." },
    { t: "memory-bound", d: "Below the ridge point: the time is bytes divided by bandwidth, and faster arithmetic units change nothing." },
    { t: "compute-bound", d: "Above the ridge point: the time is FLOPs divided by throughput, and the hardware is being used as intended." },
    { t: "kernel fusion", d: "Combining consecutive operations into one kernel so a tensor is read and written once rather than repeatedly." },
    { t: "CUDA graphs", d: "Recording a sequence of kernel launches and replaying it as a unit, to remove per-launch overhead that dominates when each step launches many tiny kernels." },
    { t: "Triton", d: "A Python-embedded language for writing GPU kernels, in which you describe the computation for one tile and the compiler handles the rest." },
    { t: "tiling", d: "Partitioning a computation so each piece's data fits in fast memory, which is where most of a kernel's performance is decided." },
    { t: "achieved occupancy", d: "The fraction of a GPU's parallel capacity actually in use; low values usually mean too few pieces of work or too many registers per piece." },
    { t: "achieved bandwidth", d: "Bytes moved per second against the hardware peak; a memory-bound kernel near peak has no tuning headroom left." }
  ],
  quiz: [
    { type: "mc", q: "An H100 delivers 989 TFLOP/s of bf16 and 3.35 TB/s of bandwidth. What does 295 FLOPs per byte represent?", opts: ["The efficiency of a well-written kernel", "The ridge point: below this arithmetic intensity a workload is limited by memory rather than by compute", "The maximum useful batch size", "The number of arithmetic units per memory channel"], a: 1,
      why: "It is the exchange rate between the two headline numbers: the machine can do 295 operations in the time it takes to fetch one byte. An operation doing fewer than that per byte leaves the arithmetic units idle. It is the single most useful number about a piece of hardware, and it is a division you can do from a specification sheet." },
    { type: "mc", q: "One Corvid FFN matrix has arithmetic intensity 1.0 at one token and 2,293.8 at an 8,192-token prefill. What changed?", opts: ["The arithmetic per weight read: the 117.4 MB of weights is fetched once either way, but prefill does 8,192 times as much work with it", "The matrix is stored differently for prefill", "Prefill uses a lower precision", "The prefill path skips some layers"], a: 0,
      why: "The weight matrix must be read from HBM whatever you do with it, so the bytes barely move between the two cases: 117.5 MB against 419.4 MB. The FLOPs grow by a factor of 8,192. Intensity is FLOPs over bytes, so it climbs almost linearly with tokens processed per weight read, which is the entire economic argument for batching." },
    { type: "mc", q: "Generating one token from Corvid at bf16 takes 4.79 ms on an H100, while the arithmetic would take 0.016 ms. What follows?", opts: ["The implementation is inefficient and should be optimized", "The kernel launch overhead dominates", "During single-stream decode the GPU does useful arithmetic about one three-hundredth of the time, because the operation is bandwidth-bound", "The model should be run at a higher precision"], a: 2,
      why: "Nothing is wrong with the implementation. Producing one token requires reading all 16.06 GB of weights to do 16.06 GFLOPs of work, an arithmetic intensity of almost exactly 1 against a ridge point of 295. The ratio of the two times is therefore 295, which is the ridge point itself. You are renting a memory-bandwidth device with some arithmetic attached." },
    { type: "mc", q: "Why does fusing two elementwise operations help, while fusing two large matrix multiplications does not?", opts: ["Elementwise operations are more numerous", "Matrix multiplications cannot be fused for numerical reasons", "Fusion only works on operations of the same shape", "Elementwise operations are memory-bound, so halving their traffic halves their time; matmuls are compute-bound, so traffic was never the constraint"], a: 3,
      why: "A normalize followed by an activation reads, writes, reads and writes for two cheap operations, and both have intensity near 1. Fusing them halves the traffic and roughly halves the time. Two matmuls are already above the ridge point, so removing an intermediate write changes almost nothing. This is why fusion effort concentrates on the small operations around the big ones." },
    { type: "blank", q: "FLOPs performed per byte moved from memory is called arithmetic ____.", a: ["intensity"],
      why: "Compare it with the hardware's ridge point and you know which limit binds, and therefore which optimizations can possibly help. Computing it before profiling is the discipline this chapter teaches: engineers without the number spend days tuning kernels that were already at the hardware's limit." },
    { type: "blank", q: "Combining consecutive operations into a single kernel, so a tensor is read and written once rather than repeatedly, is called kernel ____.", a: ["fusion"],
      why: "It changes the traffic, not the arithmetic. A compiler such as torch.compile finds many of these automatically. The related but distinct trick is CUDA graphs, which removes the per-launch overhead of many small kernels rather than the memory traffic, and which matters most at decode where each step launches hundreds of tiny ones." },
    { type: "order", q: "Order the steps for deciding whether an optimization will help:", items: ["count the FLOPs and the bytes the operation moves", "divide to get its arithmetic intensity", "compare that with the hardware's ridge point", "choose an optimization that changes the side you are on"],
      why: "Count, divide, compare, act. The last step is what the number buys: if you are memory-bound, only more work per byte, fewer bytes, or more output per pass can help, which are batching, quantization and speculation. Tuning the kernel harder cannot move a workload across the ridge point." },
    { type: "mc", q: "An A100's ridge point is 153 and an H100's is 295. What does that trend mean for language-model inference?", opts: ["Newer hardware makes memory-bound workloads relatively worse off, since compute grew faster than bandwidth", "Newer hardware fixes the memory bottleneck", "The ridge point is a property of the workload, not the hardware", "Larger models are needed to use newer hardware"], a: 0,
      why: "Compute roughly tripled while bandwidth did not keep pace, so the ridge point almost doubled and more kernels fall below it. Hardware progress has been making this problem worse rather than better, which is why every optimization in Part V attacks bytes rather than arithmetic. It also explains why buying a faster GPU often does not speed up single-stream generation." },
    { type: "mc", q: "A profiler shows a kernel at 85% of peak memory bandwidth, and you compute its arithmetic intensity as 1.2 against a ridge point of 295. What should you do?", opts: ["Tune the tile sizes to improve occupancy", "Rewrite it in Triton", "Stop: the kernel is near the hardware's limit for its intensity, so the fix must change the algorithm rather than the kernel", "Increase the register budget per thread"], a: 2,
      why: "An intensity of 1.2 means the operation is firmly memory-bound, and 85% of peak bandwidth means it is already moving bytes about as fast as the machine can. There is no kernel-level headroom. The remaining options change what is computed rather than how: process more tokens per weight read, shrink the weights, or get more tokens per pass." },
    { type: "mc", q: "Batching Corvid's FFN to 128 tokens gives an arithmetic intensity of 123 on hardware whose ridge point is 295. What does that show?", opts: ["Batching has fully solved the bandwidth problem at 128", "The measurement must be wrong, since batching should exceed the ridge point", "128 is past the useful batch size", "Batching moves a workload up the bandwidth slope but does not necessarily lift it off"], a: 3,
      why: "Intensity climbs almost linearly with batch, from 1.0 at one token to 123 at 128, and 123 is still well under 295. The workload is faster but remains memory-bound. This is why serving stacks combine batching with quantization and speculation rather than relying on any one of them, and why the batch size that saturates a GPU is larger than people expect." }
  ]
});

/* ======================= CHAPTER 17 ======================= */
CHAPTERS.push({
  num: 17, part: 3, title: "Spreading a Training Run: Data, Tensor, Pipeline, Expert",
  blurb: "Chapter 9 worked out that training Corvid needs 144.5 GB of state and the largest accelerator you can rent holds 80. This is the chapter that resolves that contradiction. There are four ways to cut a training step across many devices, they are not interchangeable, and each one pays for the memory it saves with a different kind of network traffic. You will split the same step four ways, compute what crosses the wire in each, and finish able to read an FSDP or DeepSpeed configuration and say what it will cost.",
  sections: [
    { title: "Data Parallelism, and the All-Reduce That Pays for It", viz: "llmParallelism", vizTitle: "Add GPUs under plain data parallelism, then switch to ZeRO-3",
      html: "<p>Chapter 9 counted the training state of Corvid-8B at 18 bytes per parameter &#8212; bf16 weights, fp32 master weights, fp32 gradients, and Adam's two moments &#8212; which is 144.5 GB. An 80 GB H100 is the largest single accelerator most teams can rent. The run does not fit on one device, and no amount of patience fixes that.</p>" +
      "<p>Every solution splits something. There are exactly four things in a training step large enough to be worth splitting, and each of the four strategies in this chapter picks one of them.</p>" +
      "<div class='fig'><svg viewBox='0 0 760 176' xmlns='http://www.w3.org/2000/svg' font-family='Menlo,monospace'>" +
      "<text x='20' y='16' fill='#2de2ff' font-size='11'>four axes: each strategy cuts a different dimension and sends a different thing over the wire</text>" +
      "<rect x='20' y='28' width='168' height='120' rx='8' fill='#111a2e' stroke='#4f7cff' stroke-width='2'/>" +
      "<text x='34' y='48' fill='#4f7cff' font-size='11'>data</text>" +
      "<text x='34' y='68' fill='#c9d6ea' font-size='9.5'>splits: the batch</text>" +
      "<text x='34' y='84' fill='#c9d6ea' font-size='9.5'>copies: the model</text>" +
      "<text x='34' y='108' fill='#ffd166' font-size='9.5'>sends: gradients</text>" +
      "<text x='34' y='124' fill='#7d8fb0' font-size='9'>once per step</text>" +
      "<rect x='202' y='28' width='168' height='120' rx='8' fill='#111a2e' stroke='#4f7cff' stroke-width='2'/>" +
      "<text x='216' y='48' fill='#4f7cff' font-size='11'>tensor</text>" +
      "<text x='216' y='68' fill='#c9d6ea' font-size='9.5'>splits: each matrix</text>" +
      "<text x='216' y='84' fill='#c9d6ea' font-size='9.5'>copies: nothing</text>" +
      "<text x='216' y='108' fill='#ffd166' font-size='9.5'>sends: activations</text>" +
      "<text x='216' y='124' fill='#ff5d73' font-size='9'>128 times per step</text>" +
      "<rect x='384' y='28' width='168' height='120' rx='8' fill='#111a2e' stroke='#4f7cff' stroke-width='2'/>" +
      "<text x='398' y='48' fill='#4f7cff' font-size='11'>pipeline</text>" +
      "<text x='398' y='68' fill='#c9d6ea' font-size='9.5'>splits: the layers</text>" +
      "<text x='398' y='84' fill='#c9d6ea' font-size='9.5'>copies: nothing</text>" +
      "<text x='398' y='108' fill='#ffd166' font-size='9.5'>sends: one boundary</text>" +
      "<text x='398' y='124' fill='#3ddc97' font-size='9'>point-to-point, tiny</text>" +
      "<rect x='566' y='28' width='174' height='120' rx='8' fill='#111a2e' stroke='#4f7cff' stroke-width='2'/>" +
      "<text x='580' y='48' fill='#4f7cff' font-size='11'>expert</text>" +
      "<text x='580' y='68' fill='#c9d6ea' font-size='9.5'>splits: the experts</text>" +
      "<text x='580' y='84' fill='#c9d6ea' font-size='9.5'>copies: everything else</text>" +
      "<text x='580' y='108' fill='#ffd166' font-size='9.5'>sends: routed tokens</text>" +
      "<text x='580' y='124' fill='#7d8fb0' font-size='9'>all-to-all, twice per layer</text>" +
      "<text x='20' y='168' fill='#c9d6ea' font-size='10.5'>Choosing a strategy is choosing which of these four bills you can afford on the network you actually have.</text>" +
      "</svg><div class='fig-cap'>The bottom line of each box is the one that decides. Data parallelism sends a fixed amount once per step; tensor parallelism sends a small amount 128 times per step, and every one of those is a barrier.</div></div>" +
      "<h3>The simplest cut</h3>" +
      "<p><strong>Data parallelism</strong> gives every device a complete copy of the model and a different slice of the batch. Each device runs a forward and backward pass on its own tokens, producing gradients that are correct for its slice and wrong for the batch as a whole. Averaging them fixes that, and the averaging is the whole mechanism.</p>" +
      "<p>The operation that does it is an <strong>all-reduce</strong>: every device contributes a tensor, all of them are summed, and every device ends with the sum. The naive implementation sends everything to one device and broadcasts the answer back, which makes that device's link the bottleneck and gets worse as you add hardware. The implementation everyone actually uses is the <strong>ring all-reduce</strong>, popularised for deep learning by Baidu's team in 2017 and now the default inside NCCL: the devices form a ring, each sends a chunk to its neighbour, and after two passes around the ring every device holds the full sum. Each device moves</p>" +
      "<pre><code>2 &#215; (D - 1) / D &#215; M bytes</code></pre>" +
      "<p>where <code>D</code> is the device count and <code>M</code> the gradient size. The important property is that this barely depends on <code>D</code> &#8212; the factor approaches 2 and stops. Doubling the cluster does not double the traffic per device.</p>" +
      "<p>For Corvid, reducing gradients in bf16 makes <code>M</code> = 16.06 GB, so each device moves about 28.1 GB per step on 8 devices and 31.6 GB on 64. On an 8-way NVLink domain at roughly 900 GB/s that is 31 ms. A step that processes 8,192 tokens per device costs 6 &#215; 8.03e9 &#215; 8,192 = 3.95e14 FLOPs, which at 400 TFLOP/s of realistic throughput is 987 ms. The communication is 3% of the step and effectively free.</p>" +
      "<h3>What it does not fix</h3>" +
      "<p>Nothing about the memory. Every device still holds all 144.5 GB, because every device holds a complete copy. Data parallelism buys throughput and buys no capacity at all, which is the single most common surprise for people adding GPUs to a run that is out of memory.</p>" +
      "<div class='callout'><strong>Try it above.</strong> Set the strategy to plain data parallelism and raise the device count from 2 to 64. Watch bytes-per-step-per-device climb slightly and then flatten, and watch per-device memory not move by a single gigabyte. Then switch to ZeRO-3 at the same device count and watch the memory bar collapse. That contrast is the next section.</div>" +
      "<p>One more property matters later. If you cannot fit even one micro-batch, you can run several micro-batches sequentially and sum their gradients before the all-reduce &#8212; <strong>gradient accumulation</strong>, from Chapter 14. Doing this does not change the communication at all, because the traffic depends on the size of the model and not on the number of tokens. Remember that; it is half of the decision procedure in section 7.</p>" },

    { title: "ZeRO and FSDP: Sharding the Three Things", 
      html: "<p>Data parallelism replicates the training state D times, which means D - 1 copies of it are pure waste at any given instant. <strong>ZeRO</strong> (Zero Redundancy Optimizer), introduced by Rajbhandari and colleagues at Microsoft in 2020 for DeepSpeed, removes that redundancy in three stages, each one sharding a further piece and each one strictly cheaper in memory than the last.</p>" +
      "<p>Corvid's 18 bytes per parameter divide into three groups: 2 bytes of bf16 weights needed for the forward pass, 4 bytes of gradients, and 12 bytes of optimizer state (the fp32 master copy plus Adam's two moments). The stages peel them off in reverse order of how often they are needed.</p>" +
      "<ul>" +
      "<li><strong>Stage 1</strong> shards the optimizer state. Each device keeps all weights and all gradients, but only 1/D of the 12 bytes. It updates its own slice of parameters and all-gathers the updated weights.</li>" +
      "<li><strong>Stage 2</strong> also shards the gradients. A device only needs the gradients for the parameters it will update, so instead of an all-reduce it does a <strong>reduce-scatter</strong>: everyone contributes, the sums are computed, and each device receives only its own slice.</li>" +
      "<li><strong>Stage 3</strong> also shards the parameters. No device holds the whole model. Before each layer runs, its weights are <strong>all-gathered</strong> from the devices that own them, used, and thrown away again.</li>" +
      "</ul>" +
      "<pre><code>per device, Corvid-8B          8 GPUs      64 GPUs\nplain data parallel           144.5 GB    144.5 GB\nZeRO-1  (optimizer sharded)    60.2 GB     49.7 GB\nZeRO-2  (+ gradients)          32.1 GB     18.1 GB\nZeRO-3  (+ parameters)         18.1 GB      2.3 GB</code></pre>" +
      "<p>Read the ZeRO-1 row across. Going from 8 devices to 64 saves 10.5 GB, because the 12 sharded bytes were already almost gone and the 6 unsharded ones never move. That is the shape of every partial sharding scheme: it has a floor, and the floor is whatever you did not shard.</p>" +
      "<div class='fig'><svg viewBox='0 0 760 208' xmlns='http://www.w3.org/2000/svg' font-family='Menlo,monospace'>" +
      "<text x='20' y='16' fill='#2de2ff' font-size='11'>memory per device on 8 GPUs &#183; weights (blue) &#183; gradients (gold) &#183; optimizer state (red)</text>" +
      "<text x='20' y='44' fill='#c9d6ea' font-size='10'>plain DP</text>" +
      "<rect x='110' y='32' width='67' height='18' fill='#1b2a4d' stroke='#4f7cff' stroke-width='1.5'/>" +
      "<rect x='177' y='32' width='133' height='18' fill='#2a2416' stroke='#ffd166' stroke-width='1.5'/>" +
      "<rect x='310' y='32' width='400' height='18' fill='#2e1620' stroke='#ff5d73' stroke-width='1.5'/>" +
      "<text x='720' y='45' fill='#ff5d73' font-size='9.5'>144.5</text>" +
      "<text x='20' y='84' fill='#c9d6ea' font-size='10'>ZeRO-1</text>" +
      "<rect x='110' y='72' width='67' height='18' fill='#1b2a4d' stroke='#4f7cff' stroke-width='1.5'/>" +
      "<rect x='177' y='72' width='133' height='18' fill='#2a2416' stroke='#ffd166' stroke-width='1.5'/>" +
      "<rect x='310' y='72' width='50' height='18' fill='#2e1620' stroke='#ff5d73' stroke-width='1.5'/>" +
      "<text x='370' y='85' fill='#c9d6ea' font-size='9.5'>60.2</text>" +
      "<text x='20' y='124' fill='#c9d6ea' font-size='10'>ZeRO-2</text>" +
      "<rect x='110' y='112' width='67' height='18' fill='#1b2a4d' stroke='#4f7cff' stroke-width='1.5'/>" +
      "<rect x='177' y='112' width='17' height='18' fill='#2a2416' stroke='#ffd166' stroke-width='1.5'/>" +
      "<rect x='194' y='112' width='50' height='18' fill='#2e1620' stroke='#ff5d73' stroke-width='1.5'/>" +
      "<text x='254' y='125' fill='#c9d6ea' font-size='9.5'>32.1</text>" +
      "<text x='20' y='164' fill='#3ddc97' font-size='10'>ZeRO-3</text>" +
      "<rect x='110' y='152' width='9' height='18' fill='#1b2a4d' stroke='#4f7cff' stroke-width='1.5'/>" +
      "<rect x='119' y='152' width='17' height='18' fill='#2a2416' stroke='#ffd166' stroke-width='1.5'/>" +
      "<rect x='136' y='152' width='50' height='18' fill='#2e1620' stroke='#ff5d73' stroke-width='1.5'/>" +
      "<text x='196' y='165' fill='#3ddc97' font-size='9.5'>18.1 &#183; fits on one H100 with room for activations</text>" +
      "<line x1='110' y1='180' x2='710' y2='180' stroke='#1c2a45' stroke-width='1'/>" +
      "<text x='20' y='200' fill='#c9d6ea' font-size='10.5'>The optimizer state is 12 of the 18 bytes, which is why stage 1 alone removes more than half the problem.</text>" +
      "</svg><div class='fig-cap'>Each stage shards one more band. Stage 1 is the biggest single win and the cheapest; stage 3 is the one that makes the run fit.</div></div>" +
      "<h3>The part that surprises people</h3>" +
      "<p>Stages 1 and 2 are free. A ring all-reduce is internally a reduce-scatter followed by an all-gather, each moving (D-1)/D &#215; M bytes. ZeRO-2 does exactly those two operations, just with the parameter update in between rather than after. Same 28.1 GB per device per step. You get half the memory back for nothing.</p>" +
      "<p>Stage 3 is not free. Parameters now have to be gathered in the forward pass and gathered again in the backward pass, on top of the reduce-scatter for gradients, so the traffic is 3 units instead of 2 &#8212; 42.2 GB per device on 8 devices, a 50% increase.</p>" +
      "<pre><code>per device per step      traffic   NVLink 900 GB/s   400 Gb/s network\ndata parallel            28.1 GB          31 ms             562 ms\nZeRO-1 or ZeRO-2         28.1 GB          31 ms             562 ms\nZeRO-3                   42.2 GB          47 ms             843 ms\n                                    (a step is 987 ms of compute)</code></pre>" +
      "<p>The last column is the whole chapter in one number. Inside a node, ZeRO-3 costs 5% and you would be foolish not to take it. Across a 400 Gb/s network it costs 85% of the step, so nearly half of your cluster's time goes to moving weights that a different strategy would never have moved.</p>" +
      "<div class='callout'><strong>Naming.</strong> <strong>FSDP</strong> (Fully Sharded Data Parallel) is PyTorch's implementation of the same idea, upstreamed from FairScale. It exposes <code>FULL_SHARD</code> (ZeRO-3), <code>SHARD_GRAD_OP</code> (ZeRO-2), <code>NO_SHARD</code> (ordinary replication) and <code>HYBRID_SHARD</code> (shard within a node, replicate across nodes &#8212; precisely the fix for the 843 ms above). There is deliberately no stage-1 equivalent, because stage 2 costs the same to communicate and saves more.</div>" },

    { title: "Tensor Parallelism: Splitting the Matmul Itself",
      html: "<p>ZeRO-3 shards weights for storage but reassembles each layer before using it, so every device still computes the whole layer. <strong>Tensor parallelism</strong>, from Megatron-LM (Shoeybi and colleagues at NVIDIA, 2019), shards the arithmetic instead: each device computes a genuine piece of every matrix multiply and the pieces are combined once at the end of the block.</p>" +
      "<p>The trick is to alternate how you cut. Take the feed-forward network from Chapter 8, which is <code>X &#183; A</code>, an activation, then <code>&#183; B</code>. Split <code>A</code> by columns, giving device 1 the first half of <code>d_ff</code> and device 2 the second. Each device produces half the hidden vector, and because SwiGLU is elementwise it can apply the activation to its own half with no coordination at all. Now split <code>B</code> by rows to match. Each device multiplies its half of the hidden vector by its half of <code>B</code> and gets a full-width output that is a <em>partial sum</em>. Add the partial sums and you have the exact answer.</p>" +
      "<div class='fig'><svg viewBox='0 0 760 226' xmlns='http://www.w3.org/2000/svg' font-family='Menlo,monospace'>" +
      "<text x='20' y='16' fill='#2de2ff' font-size='11'>the FFN split two ways: columns, then rows, then one all-reduce</text>" +
      "<rect x='20' y='34' width='58' height='150' rx='6' fill='#111a2e' stroke='#4f7cff' stroke-width='2'/>" +
      "<text x='30' y='106' fill='#4f7cff' font-size='10'>X</text>" +
      "<text x='30' y='124' fill='#7d8fb0' font-size='9'>tokens</text>" +
      "<line x1='84' y1='70' x2='114' y2='70' stroke='#4f7cff' stroke-width='2'/><polygon points='114,66 122,70 114,74' fill='#4f7cff'/>" +
      "<line x1='84' y1='148' x2='114' y2='148' stroke='#4f7cff' stroke-width='2'/><polygon points='114,144 122,148 114,152' fill='#4f7cff'/>" +
      "<rect x='128' y='34' width='230' height='68' rx='6' fill='#111a2e' stroke='#ffd166' stroke-width='2'/>" +
      "<text x='142' y='58' fill='#ffd166' font-size='10'>GPU 0: A[:, :7168]</text>" +
      "<text x='142' y='78' fill='#c9d6ea' font-size='9.5'>half of d_ff, then SwiGLU</text>" +
      "<text x='142' y='94' fill='#7d8fb0' font-size='9'>no communication needed here</text>" +
      "<rect x='128' y='116' width='230' height='68' rx='6' fill='#111a2e' stroke='#ffd166' stroke-width='2'/>" +
      "<text x='142' y='140' fill='#ffd166' font-size='10'>GPU 1: A[:, 7168:]</text>" +
      "<text x='142' y='160' fill='#c9d6ea' font-size='9.5'>other half, then SwiGLU</text>" +
      "<text x='142' y='176' fill='#7d8fb0' font-size='9'>no communication needed here</text>" +
      "<line x1='364' y1='68' x2='394' y2='68' stroke='#ffd166' stroke-width='2'/><polygon points='394,64 402,68 394,72' fill='#ffd166'/>" +
      "<line x1='364' y1='150' x2='394' y2='150' stroke='#ffd166' stroke-width='2'/><polygon points='394,146 402,150 394,154' fill='#ffd166'/>" +
      "<rect x='408' y='34' width='168' height='68' rx='6' fill='#111a2e' stroke='#4f7cff' stroke-width='2'/>" +
      "<text x='422' y='58' fill='#4f7cff' font-size='10'>B[:7168, :]</text>" +
      "<text x='422' y='80' fill='#c9d6ea' font-size='9.5'>partial sum, full width</text>" +
      "<rect x='408' y='116' width='168' height='68' rx='6' fill='#111a2e' stroke='#4f7cff' stroke-width='2'/>" +
      "<text x='422' y='140' fill='#4f7cff' font-size='10'>B[7168:, :]</text>" +
      "<text x='422' y='162' fill='#c9d6ea' font-size='9.5'>partial sum, full width</text>" +
      "<line x1='582' y1='68' x2='612' y2='96' stroke='#ff5d73' stroke-width='2'/>" +
      "<line x1='582' y1='150' x2='612' y2='122' stroke='#ff5d73' stroke-width='2'/>" +
      "<rect x='618' y='84' width='122' height='50' rx='6' fill='#111a2e' stroke='#ff5d73' stroke-width='2.5'/>" +
      "<text x='632' y='104' fill='#ff5d73' font-size='10'>all-reduce</text>" +
      "<text x='632' y='122' fill='#ff5d73' font-size='9.5'>117.4 MB</text>" +
      "<text x='20' y='214' fill='#c9d6ea' font-size='10.5'>Column split, then row split: the only synchronisation is the final sum. Attention splits the same way, by head.</text>" +
      "</svg><div class='fig-cap'>Cutting A by columns and B by rows means the two devices never need to exchange the hidden vector &#8212; only the block's output, once.</div></div>" +
      "<p>Attention takes the same treatment along a more natural seam. Chapter 5 established that heads are independent, so give each device a subset of heads and split the output projection by rows. One all-reduce at the end of attention, one at the end of the FFN. Two per block in the forward pass, and two more in the backward pass to combine input gradients: <strong>four collectives per layer</strong>.</p>" +
      "<h3>What that costs</h3>" +
      "<p>Each collective moves an activation tensor rather than a weight tensor. For 8,192 tokens at <code>d_model</code> 4,096 in bf16 that tensor is 67.1 MB, and a ring all-reduce across 8 devices moves 2 &#215; (7/8) &#215; 67.1 = 117.4 MB per device. Across 32 layers:</p>" +
      "<pre><code>4 collectives &#215; 32 layers = 128 per step\n128 &#215; 117.4 MB          = 15.0 GB per device per step\n  on NVLink at 900 GB/s =  17 ms  (2% of the step)\n  on a 50 GB/s network  = 301 ms  (30% of the step)</code></pre>" +
      "<p>The bandwidth figure understates the problem. Those 128 collectives are 128 barriers: no device can start layer <em>n</em>+1 until every device has finished layer <em>n</em>, and there is no useful work to overlap with the wait because the next operation needs the result. Latency, not bandwidth, is what makes tensor parallelism collapse off a fast interconnect. This is why the rule in practice is absolute: <strong>tensor parallelism stays inside one node</strong>, and its degree is usually the number of GPUs on that node's NVLink domain.</p>" +
      "<p>The compensation is real. Tensor parallelism is the only strategy so far that shards <em>activations</em> as well as weights &#8212; each device holds a fraction of the hidden state, not a full copy &#8212; which is why it is the axis that rescues runs that are out of memory on activations rather than on parameters.</p>" +
      "<div class='callout'><strong>The edge.</strong> Not everything divides. Layer norms, the embedding table and the loss need care: Megatron replicates the norms (they are cheap), shards the vocabulary dimension of the output projection, and computes the cross-entropy in a distributed form so the 128,256-wide logits never have to be gathered onto one device. Gathering them would cost 8,192 &#215; 128,256 &#215; 2 bytes = 2.1 GB per step, more than everything else in the block combined.</div>" },

    { title: "Pipeline Parallelism: Stages, Micro-batches, and the Bubble",
      html: "<p><strong>Pipeline parallelism</strong> cuts along the depth of the model. With 32 layers and 4 devices, device 0 holds layers 1&#8211;8, device 1 holds 9&#8211;16, and so on. A batch flows through device 0, its output crosses to device 1, and so forth; gradients flow back the other way.</p>" +
      "<p>The communication is trivial and that is the point. Only the activations at each stage boundary cross the wire, only 3 boundaries for 4 stages, and the transfer is <strong>point-to-point</strong> rather than a collective &#8212; two devices talk, nobody else waits. A micro-batch of 1,024 tokens at <code>d_model</code> 4,096 in bf16 is 8.4 MB. Against tensor parallelism's 15 GB of collectives, this is nothing, and it is why pipeline parallelism is the axis you stretch across slow links.</p>" +
      "<p>The naive version is also catastrophically wasteful. Send one batch through: device 0 works while 1, 2 and 3 sit idle; then device 1 works while the rest sit idle. Three quarters of the cluster is idle at any moment, and the idle time is called the <strong>pipeline bubble</strong>.</p>" +
      "<h3>Micro-batches shrink it</h3>" +
      "<p><strong>GPipe</strong> (Huang and colleagues at Google, 2019) fixed this by splitting the batch into <strong>micro-batches</strong> and feeding them in one after another, so that while device 1 works on micro-batch 1, device 0 is already on micro-batch 2. Only the fill at the start and the drain at the end are wasted.</p>" +
      "<div class='fig'><svg viewBox='0 0 760 200' xmlns='http://www.w3.org/2000/svg' font-family='Menlo,monospace'>" +
      "<text x='20' y='16' fill='#2de2ff' font-size='11'>4 stages, 4 micro-batches &#183; blue = forward, green = backward, dark = bubble</text>" +
      "<text x='20' y='47' fill='#c9d6ea' font-size='9.5'>stage 0</text><text x='20' y='81' fill='#c9d6ea' font-size='9.5'>stage 1</text>" +
      "<text x='20' y='115' fill='#c9d6ea' font-size='9.5'>stage 2</text><text x='20' y='149' fill='#c9d6ea' font-size='9.5'>stage 3</text>" +
      "<rect x='86' y='32' width='588' height='20' fill='#0c1425' stroke='#1c2a45' stroke-width='1'/>" +
      "<rect x='86' y='66' width='588' height='20' fill='#0c1425' stroke='#1c2a45' stroke-width='1'/>" +
      "<rect x='86' y='100' width='588' height='20' fill='#0c1425' stroke='#1c2a45' stroke-width='1'/>" +
      "<rect x='86' y='134' width='588' height='20' fill='#0c1425' stroke='#1c2a45' stroke-width='1'/>" +
      "<rect x='86' y='32' width='168' height='20' fill='#1b2a4d' stroke='#4f7cff' stroke-width='1'/>" +
      "<rect x='128' y='66' width='168' height='20' fill='#1b2a4d' stroke='#4f7cff' stroke-width='1'/>" +
      "<rect x='170' y='100' width='168' height='20' fill='#1b2a4d' stroke='#4f7cff' stroke-width='1'/>" +
      "<rect x='212' y='134' width='168' height='20' fill='#1b2a4d' stroke='#4f7cff' stroke-width='1'/>" +
      "<rect x='380' y='134' width='168' height='20' fill='#173328' stroke='#3ddc97' stroke-width='1'/>" +
      "<rect x='422' y='100' width='168' height='20' fill='#173328' stroke='#3ddc97' stroke-width='1'/>" +
      "<rect x='464' y='66' width='168' height='20' fill='#173328' stroke='#3ddc97' stroke-width='1'/>" +
      "<rect x='506' y='32' width='168' height='20' fill='#173328' stroke='#3ddc97' stroke-width='1'/>" +
      "<text x='104' y='46' fill='#4f7cff' font-size='9'>F1 F2 F3 F4</text>" +
      "<text x='524' y='46' fill='#3ddc97' font-size='9'>B4 B3 B2 B1</text>" +
      "<line x1='86' y1='166' x2='674' y2='166' stroke='#7d8fb0' stroke-width='1'/>" +
      "<text x='300' y='182' fill='#ffd166' font-size='10'>6 of every 14 slots idle &#8212; a 42.9% bubble</text>" +
      "<text x='20' y='196' fill='#c9d6ea' font-size='10.5'>Raising micro-batches from 4 to 16 with the same 4 stages takes that to 15.8%.</text>" +
      "</svg><div class='fig-cap'>The fill and the drain are fixed at P-1 slots each; only the number of micro-batches in between can grow, which is why the bubble is a ratio and not a constant.</div></div>" +
      "<p>With <code>P</code> stages and <code>m</code> micro-batches, the fill and drain together cost <code>P - 1</code> slots against <code>m</code> slots of useful work, so the fraction of wall-clock time wasted is <code>(P - 1) / (m + P - 1)</code>:</p>" +
      "<pre><code>stages  micro-batches   bubble\n   4          4         42.9%\n   4         16         15.8%\n   8          8         46.7%\n   8         32         17.9%\n   8         64          9.9%</code></pre>" +
      "<p>The working rule that falls out is <code>m</code> &#8805; 4<code>P</code>, which keeps the bubble under about 20%.</p>" +
      "<div class='callout'><strong>Sources differ.</strong> Megatron's papers quote the bubble as <code>(P - 1) / m</code>, which is the same quantity measured against ideal compute time rather than total time &#8212; 75% rather than 42.9% for four and four. Neither is wrong; check the denominator before comparing two numbers from two papers.</div>" +
      "<h3>The memory cost nobody mentions first</h3>" +
      "<p>GPipe runs all <code>m</code> forwards before any backward, so every micro-batch's activations must be kept alive at once, and activation memory scales with <code>m</code> &#8212; exactly the quantity you wanted to raise. <strong>1F1B</strong> (one-forward-one-backward), from PipeDream (Narayanan and colleagues, 2019), fixes it by starting backward passes as soon as the pipeline is full and alternating thereafter. The bubble is identical; the number of micro-batches in flight is capped at <code>P</code> instead of <code>m</code>. Interleaving on top of that (Megatron-LM, 2021) gives each device <code>v</code> non-contiguous chunks of layers and divides the bubble by a further <code>v</code>, at the cost of <code>v</code> times the point-to-point messages.</p>" },

    { title: "Expert and Context Parallelism",
      html: "<p>Two more axes exist because two specific architectures have a dimension the first three do not know how to cut.</p>" +
      "<h3>Expert parallelism</h3>" +
      "<p>Chapter 10's mixture-of-experts layer holds many feed-forward networks and routes each token to a couple of them. <strong>Expert parallelism</strong>, introduced with GShard (Lepikhin and colleagues at Google, 2020), places different experts on different devices and moves the tokens to them.</p>" +
      "<p>That movement is an <strong>all-to-all</strong>: every device sends each other device the tokens the router assigned to its experts, and after the experts run, a second all-to-all sends the results home. Two all-to-alls per MoE layer. For 8,192 tokens with top-2 routing at <code>d_model</code> 4,096 in bf16, the dispatch moves 8,192 &#215; 2 &#215; 4,096 &#215; 2 = 134 MB, and the same comes back.</p>" +
      "<p>The failure mode is the interesting part and it is not bandwidth. An all-to-all finishes when its slowest participant finishes, so if the router sends 30% of the batch to one expert, seven devices wait for the eighth on every single MoE layer. This is the operational reason the load-balancing loss from Chapter 10 exists: it is not there to make the experts fair, it is there to stop the network from stalling.</p>" +
      "<h3>Context parallelism</h3>" +
      "<p>The other axis appears when one sequence is too long for one device. Chapter 6's arithmetic says the KV cache and the attention activations grow with sequence length, so prompt <strong>P4</strong> &#8212; the needle placed in a 100,000-token document &#8212; overflows a device that trains happily at 8,192 tokens. <strong>Context parallelism</strong> splits the sequence dimension: device 0 takes positions 1&#8211;25,000, device 1 takes 25,001&#8211;50,000, and so on.</p>" +
      "<p>Everything except attention is elementwise along the sequence and needs no communication at all. Attention is the exception, because query positions on device 3 must attend to key and value positions living on devices 0, 1 and 2. <strong>Ring Attention</strong> (Liu, Zaharia and Abbeel, 2023) solves it by passing key-value blocks around a ring while each device computes attention against the block it currently holds, using the same online-softmax accumulation that Chapter 28's FlashAttention uses to combine partial results. Because the communication of the next block overlaps with the computation on the current one, the cost is hidden almost entirely &#8212; provided the block is large enough that computing on it takes longer than fetching the next.</p>" +
      "<div class='callout'><strong>When to reach for these.</strong> Expert parallelism is not optional for a large MoE: the experts are most of the parameters and replicating them defeats the architecture. Context parallelism is the last resort for long context, after activation checkpointing and sequence-level micro-batching have already been spent.</div>" },

    { title: "Three Dimensions, and the Order They Nest",
      html: "<p>Real runs use several axes at once, which is called <strong>3-D parallelism</strong> when it is data, tensor and pipeline. The composition is a product: 8-way tensor &#215; 8-way pipeline &#215; 8-way data is 512 devices, and each device holds 1/8 of each layer's weights for 1/8 of the layers.</p>" +
      "<p>The nesting order is not a matter of taste. Each axis has a communication frequency, and the rule is to give the most talkative axis the fastest wire.</p>" +
      "<div class='fig'><svg viewBox='0 0 760 226' xmlns='http://www.w3.org/2000/svg' font-family='Menlo,monospace'>" +
      "<text x='20' y='16' fill='#2de2ff' font-size='11'>the nesting rule: chattiest axis on the fastest wire</text>" +
      "<rect x='20' y='30' width='330' height='84' rx='8' fill='#111a2e' stroke='#3ddc97' stroke-width='2.5'/>" +
      "<text x='34' y='50' fill='#3ddc97' font-size='10.5'>node 0 &#183; 8 GPUs &#183; NVLink 900 GB/s</text>" +
      "<rect x='34' y='60' width='34' height='24' rx='4' fill='#0c1425' stroke='#3ddc97' stroke-width='1'/>" +
      "<rect x='72' y='60' width='34' height='24' rx='4' fill='#0c1425' stroke='#3ddc97' stroke-width='1'/>" +
      "<rect x='110' y='60' width='34' height='24' rx='4' fill='#0c1425' stroke='#3ddc97' stroke-width='1'/>" +
      "<rect x='148' y='60' width='34' height='24' rx='4' fill='#0c1425' stroke='#3ddc97' stroke-width='1'/>" +
      "<rect x='186' y='60' width='34' height='24' rx='4' fill='#0c1425' stroke='#3ddc97' stroke-width='1'/>" +
      "<rect x='224' y='60' width='34' height='24' rx='4' fill='#0c1425' stroke='#3ddc97' stroke-width='1'/>" +
      "<rect x='262' y='60' width='34' height='24' rx='4' fill='#0c1425' stroke='#3ddc97' stroke-width='1'/>" +
      "<rect x='300' y='60' width='34' height='24' rx='4' fill='#0c1425' stroke='#3ddc97' stroke-width='1'/>" +
      "<text x='34' y='104' fill='#c9d6ea' font-size='9.5'>tensor parallel &#183; 128 collectives per step</text>" +
      "<rect x='400' y='30' width='330' height='84' rx='8' fill='#111a2e' stroke='#3ddc97' stroke-width='2.5'/>" +
      "<text x='414' y='50' fill='#3ddc97' font-size='10.5'>node 7 &#183; 8 GPUs &#183; NVLink 900 GB/s</text>" +
      "<rect x='414' y='60' width='34' height='24' rx='4' fill='#0c1425' stroke='#3ddc97' stroke-width='1'/>" +
      "<rect x='452' y='60' width='34' height='24' rx='4' fill='#0c1425' stroke='#3ddc97' stroke-width='1'/>" +
      "<rect x='490' y='60' width='34' height='24' rx='4' fill='#0c1425' stroke='#3ddc97' stroke-width='1'/>" +
      "<rect x='528' y='60' width='34' height='24' rx='4' fill='#0c1425' stroke='#3ddc97' stroke-width='1'/>" +
      "<rect x='566' y='60' width='34' height='24' rx='4' fill='#0c1425' stroke='#3ddc97' stroke-width='1'/>" +
      "<rect x='604' y='60' width='34' height='24' rx='4' fill='#0c1425' stroke='#3ddc97' stroke-width='1'/>" +
      "<rect x='642' y='60' width='34' height='24' rx='4' fill='#0c1425' stroke='#3ddc97' stroke-width='1'/>" +
      "<rect x='680' y='60' width='34' height='24' rx='4' fill='#0c1425' stroke='#3ddc97' stroke-width='1'/>" +
      "<text x='414' y='104' fill='#c9d6ea' font-size='9.5'>tensor parallel &#183; 128 collectives per step</text>" +
      "<text x='362' y='76' fill='#7d8fb0' font-size='11'>&#183; &#183; &#183;</text>" +
      "<line x1='185' y1='118' x2='185' y2='150' stroke='#ff5d73' stroke-width='2'/>" +
      "<line x1='565' y1='118' x2='565' y2='150' stroke='#ff5d73' stroke-width='2'/>" +
      "<rect x='20' y='150' width='710' height='40' rx='8' fill='#111a2e' stroke='#ff5d73' stroke-width='2'/>" +
      "<text x='34' y='166' fill='#ff5d73' font-size='10.5'>network across 8 nodes &#183; 400 Gb/s = 50 GB/s</text>" +
      "<text x='34' y='182' fill='#c9d6ea' font-size='9.5'>data parallel (or pipeline) &#183; 1 collective per step &#183; 30.6 GB &#183; 0.61 s against 8.6 s of compute</text>" +
      "<text x='20' y='214' fill='#c9d6ea' font-size='10.5'>Put tensor parallelism across nodes instead and the same run spends more time waiting than computing.</text>" +
      "</svg><div class='fig-cap'>Tensor parallelism inside the NVLink domain, data or pipeline parallelism across it. The two red links carry one collective per step; the green ones carry 128.</div></div>" +
      "<h3>Why it is worth the complexity</h3>" +
      "<p>Take a 70B model on 64 H100s arranged as 8 nodes of 8, and use the 18-bytes-per-parameter rule: the training state is 1,260 GB, and sharded 64 ways that is 19.7 GB per device. It fits. So why not run plain ZeRO-3 across all 64 and be done?</p>" +
      "<p>Because ZeRO-3 all-gathers parameters twice per step and reduce-scatters gradients once, which for 140 GB of bf16 weights is 3 &#215; (63/64) &#215; 140 = 413 GB per device per step, and most of it crosses the network:</p>" +
      "<pre><code>compute per device per step        8.60 s   (6ND at 8,192 tokens, 400 TFLOP/s)\nZeRO-3 across all 64 GPUs          8.27 s   of network traffic\nTP 8-way in node + DP across       0.61 s   of network traffic\n                                            (the TP traffic never leaves NVLink)</code></pre>" +
      "<p>The first arrangement spends 96% of its compute time again on communication and runs at roughly half speed. The second spends 7%. Same hardware, same model, same step; the difference is entirely which axis was placed on which wire.</p>" +
      "<p>The conventional nesting, from innermost to outermost, is therefore: <strong>tensor</strong> inside a node, <strong>pipeline</strong> across a small group of nodes, <strong>data</strong> or ZeRO outermost across everything, and <strong>expert</strong> or <strong>context</strong> layered in where the architecture demands it. Frameworks express this as a device mesh with one named dimension per axis, which is why a modern configuration reads as a list of degrees whose product must equal your device count.</p>" },

    { title: "Choosing From the Bottleneck",
      html: "<p>The four axes are not a menu of preferences. There is a decision procedure, and it runs in order, because each step is cheaper than the one after it.</p>" +
      "<ol>" +
      "<li><strong>Does one micro-batch of one sequence fit on one device with plain data parallelism?</strong> If yes, stop. Use data parallelism with gradient accumulation and do not read the rest of this list. Most fine-tuning runs end here.</li>" +
      "<li><strong>Is the problem the optimizer state?</strong> Turn on ZeRO-2 or <code>SHARD_GRAD_OP</code>. It is free in communication and removes 12 of the 18 bytes. Nothing else in this chapter has that ratio.</li>" +
      "<li><strong>Do the parameters themselves not fit?</strong> ZeRO-3 or <code>FULL_SHARD</code>, if your devices are on a fast interconnect. Its 50% extra traffic is 5% of a step inside a node and 85% of one across a slow network, so check which of those you have before enabling it.</li>" +
      "<li><strong>Are activations the problem, not parameters?</strong> Tensor parallelism, at exactly the degree of your NVLink domain and no more. It is the only axis that shards activations.</li>" +
      "<li><strong>Is the model too deep for any single device even sharded, or is your interconnect slow?</strong> Pipeline parallelism, with micro-batches at four times the stage count.</li>" +
      "<li><strong>Is it an MoE, or is one sequence too long?</strong> Expert or context parallelism, layered on top of whatever the answers above produced.</li>" +
      "</ol>" +
      "<p>Two facts make this procedure work, and they are worth stating on their own because they are the reason the ordering is what it is.</p>" +
      "<p><strong>Data-parallel traffic scales with the model; tensor-parallel traffic scales with the tokens.</strong> Doubling the micro-batch leaves the gradient all-reduce untouched and doubles every tensor-parallel collective. So gradient accumulation is a free way to hide data-parallel cost and does nothing whatsoever for tensor-parallel cost. If your profile shows communication dominating, which axis it is on determines whether a larger micro-batch is the fix or is irrelevant.</p>" +
      "<p><strong>Topology is in the bill.</strong> The same 42.2 GB is 47 ms or 843 ms depending only on which cable it crosses, and every cloud provider prices those cables differently. A cluster of 8-GPU nodes with NVLink inside and 400 Gb/s between them is not 64 equivalent GPUs; it is 8 fast groups with a narrow bridge, and a strategy that ignores the bridge will run at half speed on hardware whose specification sheet says otherwise. <code>HYBRID_SHARD</code> exists for exactly this shape: shard fully within the node where bandwidth is abundant, replicate across nodes where it is not, and pay one gradient all-reduce over the bridge instead of three collectives.</p>" +
      "<div class='callout'><strong>Interview lens.</strong> &#8220;You add 8 more GPUs to an out-of-memory training run and it is still out of memory. Why?&#8221; The answer is that plain data parallelism replicates the model, so per-device memory is independent of device count. What the questioner is testing is whether you know that throughput and capacity are bought with different mechanisms &#8212; and the follow-up is which ZeRO stage you would reach for and what it costs.</div>" },

    { title: "Reading a Real Configuration",
      html: "<p>Everything above is visible in two configuration files that most engineers meet before they meet the mechanisms. Here is the same setup written both ways: ZeRO-3, bf16, gradients reduced in fp32, four sequences per device with eight-step accumulation.</p>" +
      "<div class='code-tabs'><div class='code-tab-bar'><button class='code-tab active' data-lang='python'>PyTorch FSDP</button><button class='code-tab' data-lang='json'>DeepSpeed</button></div>" +
      "<pre data-lang='python'><code>from torch.distributed.fsdp import (\n    FullyShardedDataParallel as FSDP,\n    ShardingStrategy, MixedPrecision, CPUOffload,\n)\n\nmodel = FSDP(\n    model,\n    # FULL_SHARD = ZeRO-3. SHARD_GRAD_OP = ZeRO-2.\n    # HYBRID_SHARD = shard in node, replicate across nodes.\n    sharding_strategy=ShardingStrategy.FULL_SHARD,\n\n    # weights and activations in bf16; gradients reduced in\n    # fp32 so small updates survive the sum (Chapter 14).\n    mixed_precision=MixedPrecision(\n        param_dtype=torch.bfloat16,\n        reduce_dtype=torch.float32,\n    ),\n\n    # the unit that gets gathered and freed: one block.\n    # too coarse and you gather the whole model at once.\n    auto_wrap_policy=transformer_auto_wrap_policy,\n\n    # cap concurrent all-gathers so prefetching does not\n    # allocate more than it saves.\n    limit_all_gathers=True,\n    device_id=torch.cuda.current_device(),\n)\n\n# accumulation is a plain loop: 4 x 8 = 32 sequences per step.\nfor i, batch in enumerate(loader):\n    (model(batch).loss / 8).backward()\n    if (i + 1) % 8 == 0:\n        optimizer.step(); optimizer.zero_grad()</code></pre>" +
      "<pre data-lang='json' hidden><code>{\n  \"train_micro_batch_size_per_gpu\": 4,\n  \"gradient_accumulation_steps\": 8,\n\n  \"bf16\": { \"enabled\": true },\n\n  \"zero_optimization\": {\n    \"stage\": 3,\n\n    \"overlap_comm\": true,\n    \"contiguous_gradients\": true,\n\n    \"reduce_bucket_size\": 5e8,\n    \"stage3_prefetch_bucket_size\": 5e8,\n    \"stage3_param_persistence_threshold\": 1e6,\n\n    \"offload_optimizer\": {\n      \"device\": \"cpu\",\n      \"pin_memory\": true\n    }\n  }\n}</code></pre></div>" +
      "<p>Four of these fields decide performance and the rest are defaults.</p>" +
      "<ul>" +
      "<li><strong><code>stage</code> / <code>sharding_strategy</code></strong> &#8212; which of the three bands from section 2 gets sharded. This is the memory-against-traffic dial and everything else is secondary to it.</li>" +
      "<li><strong><code>overlap_comm</code> and <code>limit_all_gathers</code></strong> &#8212; whether a layer's all-gather is issued while the previous layer is still computing. Overlapping is what makes ZeRO-3's extra 50% of traffic partly invisible; the limit exists because prefetching too far ahead reintroduces the memory you were trying to shard.</li>" +
      "<li><strong><code>reduce_bucket_size</code> and <code>auto_wrap_policy</code></strong> &#8212; the granularity of communication. Too small and you pay per-collective latency hundreds of times; too large and you hold a big buffer and lose overlap. One transformer block per unit is the standard answer for both frameworks.</li>" +
      "<li><strong><code>offload_optimizer</code></strong> &#8212; move the 12 bytes of optimizer state to host memory over PCIe. This trades a bandwidth problem for a much worse one and is the correct choice only when the alternative is not running at all.</li>" +
      "</ul>" +
      "<p>What neither file shows is the topology, and the topology is what section 6 proved determines the answer. A configuration is only readable next to the machine it will run on: <code>FULL_SHARD</code> across a node is excellent engineering and <code>FULL_SHARD</code> across a slow network is the 843 ms mistake, and the file looks identical in both cases.</p>" +
      "<div class='callout'><strong>What real systems do.</strong> Megatron-LM composes tensor, pipeline, context and expert parallelism over an explicit device mesh; DeepSpeed leads with ZeRO and adds the other axes around it; PyTorch's newer <code>fully_shard</code> API rebuilds FSDP on the same mesh abstraction so the axes compose without a wrapper per strategy. The vocabulary differs and the four cuts underneath do not.</div>" },

    { title: "Exercises",
      html: "<ol>" +
      "<li><strong>Trace.</strong> A 13B-parameter model is trained at 18 bytes per parameter on 16 devices. Compute per-device memory under plain data parallelism and under each ZeRO stage. Then compute the per-device communication for each, using a bf16 reduction and the ring formula. State which stage is the best deal and why the answer is not stage 3.</li>" +
      "<li><strong>Trace.</strong> You have 8 pipeline stages and a global batch of 256 sequences. Compute the bubble fraction at micro-batch counts of 8, 32 and 128, in both the wall-clock form and the against-ideal form. Then explain why you cannot simply raise the count to 256 under GPipe, and what 1F1B changes about that limit.</li>" +
      "<li><strong>Trace.</strong> Repeat section 3's tensor-parallel arithmetic for Corvid at a micro-batch of 512 tokens instead of 8,192. Compute the bytes per collective and the total per step, then compare with the data-parallel all-reduce at the same micro-batch. State which axis just became more expensive and give the general rule that predicted it.</li>" +
      "<li><strong>Investigate.</strong> Run <code>nvidia-smi topo -m</code> on any multi-GPU machine you have access to, or find the topology diagram for an instance type your provider sells. Identify which GPU pairs share a fast link and which cross a slower one. Then state the maximum tensor-parallel degree that machine supports without crossing the slow boundary. On an 8-GPU NVLink node every pair will read <code>NV#</code> and the answer is 8; on a PCIe-attached machine the answer is usually 2 or 1.</li>" +
      "<li><strong>Investigate.</strong> Take a public training configuration from an open-weights model release and identify every parallelism degree in it. Multiply them together and check the product against the reported device count. Then state, from this chapter's rules alone, which axis they placed inside the node and whether their micro-batch count clears the 4P bar for the pipeline depth they chose.</li>" +
      "<li><strong>Build.</strong> Write a function taking parameter count, device count, devices per node, intra-node and inter-node bandwidth, and tokens per micro-batch, and returning per-device memory and per-step communication seconds for plain DP, each ZeRO stage, tensor parallelism at the node degree, and one hybrid. Rank them by total step time against a 6ND compute estimate. Run it for an 8B model on 8 GPUs and for a 70B on 64 across 8 nodes; the winner will differ between the two, and reproducing that difference is the point of the exercise.</li>" +
      "</ol>" }
  ],
  terms: [
    { t: "data parallelism", d: "Replicating the whole model on every device and giving each a different slice of the batch; it buys throughput and no memory capacity at all." },
    { t: "all-reduce", d: "A collective in which every device contributes a tensor and every device ends up holding the sum, used to average gradients across data-parallel replicas." },
    { t: "ring all-reduce", d: "The bandwidth-optimal all-reduce, in which each device moves 2(D-1)/D times the tensor size regardless of how large the cluster grows." },
    { t: "reduce-scatter", d: "A collective that sums contributions but leaves each device holding only its own slice of the result, which is the first half of an all-reduce." },
    { t: "all-gather", d: "A collective that assembles a full tensor on every device from the slices they each own; the second half of an all-reduce, and what ZeRO-3 does before every layer." },
    { t: "ZeRO", d: "The Zero Redundancy Optimizer: three stages that shard optimizer state, then gradients, then parameters across data-parallel devices, removing the replication that plain data parallelism wastes." },
    { t: "FSDP", d: "Fully Sharded Data Parallel, PyTorch's implementation of ZeRO, whose FULL_SHARD and SHARD_GRAD_OP strategies correspond to stages 3 and 2." },
    { t: "tensor parallelism", d: "Splitting each individual matrix multiply across devices, cutting one weight matrix by columns and the next by rows so that only the block's output needs combining." },
    { t: "pipeline parallelism", d: "Splitting the model by depth so each device owns a contiguous group of layers, paying only point-to-point activation transfers at the stage boundaries." },
    { t: "micro-batch", d: "One of the slices a batch is divided into so that pipeline stages can work on different slices simultaneously." },
    { t: "pipeline bubble", d: "The idle time while a pipeline fills and drains, equal to (P-1)/(m+P-1) of wall-clock time and the reason micro-batch count must exceed stage count several times over." },
    { t: "1F1B", d: "A pipeline schedule that alternates one forward with one backward once the pipeline is full, keeping the same bubble as GPipe while capping in-flight activations at the stage count." },
    { t: "expert parallelism", d: "Placing a mixture-of-experts layer's experts on different devices and routing tokens to them with two all-to-all collectives per layer." },
    { t: "all-to-all", d: "A collective in which every device sends a different message to every other device; it completes only when its slowest participant does, which is why expert load imbalance stalls the network." },
    { t: "context parallelism", d: "Splitting one sequence across devices so that long contexts fit, requiring key-value blocks to circulate during attention." },
    { t: "3-D parallelism", d: "Composing data, tensor and pipeline parallelism at once, with degrees whose product equals the device count." },
    { t: "device mesh", d: "The named multi-dimensional arrangement of devices a framework uses to express which axis of parallelism runs over which group of hardware." },
    { t: "gradient accumulation", d: "Summing gradients over several micro-batches before one optimizer step, which raises the effective batch without changing data-parallel communication at all." }
  ],
  quiz: [
    { type: "mc", q: "A training run runs out of memory on 8 GPUs under plain data parallelism. You move it to 32 GPUs, unchanged. What happens?", opts: ["It fits, because memory is now spread over four times as many devices", "It fits, because the batch per device is smaller", "It still runs out, because data parallelism replicates the full model on every device", "It fits only if the batch size is also raised"], a: 2,
      why: "Data parallelism splits the batch and replicates everything else. Per-device memory for weights, gradients and optimizer state is completely independent of device count, so adding hardware buys throughput and no capacity. Reducing the per-device batch helps only with activation memory, which is rarely the binding constraint for an 8B model at 144.5 GB of state." },
    { type: "mc", q: "Why is ZeRO-2 essentially free in communication compared with plain data parallelism?", opts: ["A ring all-reduce is already a reduce-scatter followed by an all-gather, and ZeRO-2 performs exactly those two operations with the update in between", "It compresses the gradients before sending them", "It sends gradients less often", "It overlaps communication with computation, which plain data parallelism cannot do"], a: 0,
      why: "The two halves of a ring all-reduce each move (D-1)/D times the tensor. ZeRO-2 does the reduce-scatter, updates its own slice of parameters, then all-gathers the new weights: the same two collectives and the same 28.1 GB per device for Corvid on 8 devices. Half the memory disappears for no extra traffic, which is why stage 2 is the highest-value setting in the chapter." },
    { type: "mc", q: "Corvid under ZeRO-3 moves 42.2 GB per device per step. On NVLink that is 47 ms against a 987 ms step; on a 400 Gb/s network it is 843 ms. What does the pair of numbers establish?", opts: ["ZeRO-3 is generally a poor choice", "The network measurement must be wrong, since collectives are bandwidth-optimal", "The step should be made longer to amortize the transfer", "A strategy is not good or bad on its own; the same traffic is 5% or 85% of a step depending only on which wire it crosses"], a: 3,
      why: "Nothing about the algorithm changed between the two columns. This is why the decision procedure asks what interconnect you have before it recommends a stage, and why HYBRID_SHARD exists: shard fully inside the NVLink domain and replicate across the slow bridge, paying one gradient all-reduce over it rather than three collectives." },
    { type: "mc", q: "In tensor parallelism, why is the first FFN matrix split by columns and the second by rows?", opts: ["To balance the parameter count between the two matrices", "So each device holds a contiguous region of memory", "So each device can apply the activation to its own slice without communication, and the second matmul then yields partial sums that need only one all-reduce", "Because the activation function requires the full hidden vector"], a: 2,
      why: "A column split of A gives each device a complete slice of the hidden dimension, and SwiGLU is elementwise along that dimension, so no exchange is needed mid-block. Matching that with a row split of B makes each device produce a full-width partial sum. One all-reduce at the end of the block is the entire synchronisation cost, instead of one in the middle as well." },
    { type: "mc", q: "A profile shows communication dominating a run. Which fact tells you whether doubling the micro-batch will help?", opts: ["The device count, since collective cost grows with it", "Which axis the traffic is on: data-parallel traffic scales with model size and is unchanged by micro-batch, while tensor-parallel traffic scales with tokens and doubles", "The precision, since bf16 halves every transfer", "Whether gradient accumulation is enabled"], a: 1,
      why: "The gradient all-reduce moves a fixed 2(D-1)/D times the parameter bytes whatever the batch, so a larger micro-batch amortizes it across more compute and is a genuine fix. Every tensor-parallel collective carries an activation tensor sized by tokens, so doubling the micro-batch doubles that traffic and buys nothing. Same symptom, opposite remedies." },
    { type: "mc", q: "Why does tensor parallelism collapse across a slow network in a way that pipeline parallelism does not?", opts: ["Tensor parallelism moves far more total bytes than pipeline parallelism ever does", "Pipeline parallelism compresses its transfers", "Tensor parallelism issues 128 blocking collectives per step with nothing to overlap them with, while pipeline parallelism sends a handful of point-to-point messages", "Tensor parallelism requires a collective across every device in the cluster"], a: 2,
      why: "Bandwidth is not the deciding factor: 15 GB per step is modest. The problem is that each of the 128 collectives is a barrier whose result the very next operation needs, so the latency cannot be hidden. Pipeline parallelism sends one activation tensor between two adjacent devices per micro-batch boundary, which is why it is the axis you stretch across the slow link." },
    { type: "mc", q: "A mixture-of-experts run using expert parallelism shows seven of eight GPUs idle during each MoE layer. What is the most likely cause?", opts: ["The interconnect bandwidth is saturated by the dispatch all-to-all", "Router load imbalance: an all-to-all completes only when its slowest participant does, so one overloaded expert stalls everyone", "The experts are too large for the devices holding them", "Top-2 routing is doubling the traffic"], a: 1,
      why: "The dispatch moves only 134 MB for 8,192 tokens at top-2, which no modern interconnect struggles with. What stalls is the collective's synchronisation: if the router sends a disproportionate share of tokens to one expert, every other device waits for that one on every MoE layer. This is the operational reason Chapter 10's load-balancing loss exists." },
    { type: "blank", q: "The idle time while a pipeline fills at the start of a step and drains at the end is called the pipeline ____.", a: ["bubble", "bubbles"],
      why: "It costs P-1 slots against m slots of useful work, so the wasted fraction of wall-clock time is (P-1)/(m+P-1): 42.9% for four stages and four micro-batches, and 15.8% for the same four stages with sixteen. The working rule is to keep the micro-batch count at four times the stage count or more." },
    { type: "mc", q: "70B on 64 H100s across 8 nodes: ZeRO-3 over all 64 needs 8.27 s of network traffic against 8.60 s of compute, while 8-way tensor parallelism inside each node with data parallelism across them needs 0.61 s. What changed?", opts: ["The second arrangement moves far fewer bytes in total", "The second uses a lower precision for its collectives", "The second overlaps communication with computation and the first cannot", "The chattiest traffic was moved onto NVLink, leaving one all-reduce of a 1/8 shard to cross the network"], a: 3,
      why: "Both arrangements move a great deal; the question is over which wire. ZeRO-3 gathers 140 GB of weights twice and scatters gradients once, and on a flat 64-way group all of it crosses the 50 GB/s bridge. Tensor parallelism keeps its 128 collectives per step inside the 900 GB/s domain, and the only inter-node traffic is a gradient all-reduce over a 17.5 GB shard: 30.6 GB, 0.61 s." },
    { type: "order", q: "Order the decision procedure for choosing a parallelism strategy, cheapest first:", items: ["Plain data parallelism with gradient accumulation, if one micro-batch fits", "ZeRO-2, which shards 12 of the 18 bytes for no extra communication", "ZeRO-3, if the parameters themselves do not fit and the interconnect is fast", "Tensor parallelism at the node's NVLink degree, when activations rather than parameters are the constraint", "Pipeline parallelism, when the model is too deep or the interconnect too slow for the axes above"],
      why: "The order is by cost, not by capability. Each step buys memory with a larger communication bill than the one before it, so you stop at the first that makes the run fit. Reaching for tensor or pipeline parallelism before trying ZeRO-2 is the most common way to make a run both slower and more complicated than it needed to be." },
    { type: "mc", q: "What does raising a GPipe run's micro-batch count from 4 to 32 cost, and what does 1F1B change about it?", opts: ["Nothing is stored per micro-batch, so nothing is paid; 1F1B only reduces the bubble", "It costs extra collectives; 1F1B batches them", "GPipe stores activations for all micro-batches in flight, so memory scales with the count; 1F1B keeps the same bubble but caps in-flight micro-batches at the stage count", "It costs nothing in memory but raises the bubble, which 1F1B removes"], a: 2,
      why: "GPipe runs every forward before any backward, so all 32 micro-batches' activations are alive at once, and the quantity you raised to shrink the bubble is the one inflating memory. 1F1B starts backward passes as soon as the pipeline is full and alternates, so at most P micro-batches are in flight. The bubble fraction is identical; only the peak memory differs." },
    { type: "mc", q: "Why does context parallelism need special handling for attention but not for the feed-forward network?", opts: ["Attention has more parameters to shard", "The FFN is elementwise along the sequence, so each device handles its own positions alone, while a query on one device must attend to keys and values held on the others", "The FFN can be recomputed cheaply and attention cannot", "Attention runs in a different precision"], a: 1,
      why: "Splitting a sequence across devices leaves every position-wise operation completely local, which covers norms and the whole feed-forward network. Attention is the one operation that mixes positions, so the key-value blocks must travel. Ring Attention passes them around a ring while each device computes on the block it holds, hiding the transfer behind the arithmetic when the blocks are large enough." }
  ]
});
