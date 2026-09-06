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
