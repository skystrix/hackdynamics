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
