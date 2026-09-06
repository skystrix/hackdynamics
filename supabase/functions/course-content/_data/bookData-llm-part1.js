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
