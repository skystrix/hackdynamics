# RAG In Depth — Phase 3 Deliverable: Course Blueprint

**Status:** Phase 3 complete, awaiting owner approval. On approval, chapter numbers are frozen.
**Date:** 2026-09-03. Gap Matrix (Phase 2) approved 2026-09-03.

**Shape:** 5 parts, 36 chapters, 42 machines, ~95 static figures, 6-chapter capstone (PocketRAG, Python + TypeScript), 3 free chapters (1, 5, 11). Estimated body total ≈ 105,000 words.

**Course-wide conventions**
- **Recurring corpus:** *Larkspur Airlines*, a fictional carrier: 40 policy pages (baggage, refunds, pets, medical), 12 PDF contracts with partner airports, a fares CSV, 300 support tickets, 6 incident post-mortems. Small enough to index by hand in the machines, rich enough for every retriever type.
- **Recurring queries:** Q1 *"Can I bring my cello in the cabin?"* (rare exact term; lexical beats dense); Q2 *"How do I get my money back if my flight is cancelled?"* (paraphrase; dense beats lexical); Q3 *"How many refund tickets were opened in March?"* (needs SQL, not vectors); Q4 *"Which baggage policy changed after incident INC-2042?"* (multi-hop; needs graph or iteration); Q5 *"What is Larkspur's policy on emotional-support peacocks?"* (not in corpus; must refuse).
- **Recurring deployment:** one API node, one Postgres + pgvector node, one embedding/reranker node; a 1 M-chunk scale target for every cost and latency discussion.
- **Recurring vectors:** worked examples use 4-dimensional toy vectors so cosine, dot and quantization can be done by hand.
- **Machine keys** are prefixed to stay unique across the site (`window.VIZ` is shared with Databases in Depth).
- **Chapter word counts** are body only (excluding terms, quiz, exercises).

---

## 1. Parts

| # | Title | Description (house voice, as in `PARTS`) |
|---|---|---|
| I | **The Machine and Why It Exists** | A language model is a closed book that answers anyway. This part opens the machine that sits between a question and a grounded answer, names its six stages, and settles the first argument: when retrieval, when fine-tuning, when a bigger context window, and why. |
| II | **From Documents to an Index** | Nothing in this part touches a language model. It is the search engine: how text becomes chunks, chunks become vectors and postings, and how a graph of neighbours or a codebook of centroids finds the right ones in microseconds. This is where most real RAG systems are won or lost. |
| III | **From Question to Answer** | The query flow, stage by stage: rewriting the question, fusing keyword and vector results, reranking, packing a context window that the model will actually read, generating with citations or refusing, and then letting the pipeline loop, call tools, and walk a graph when one pass is not enough. |
| IV | **Making It Real** | Measurement, money, and adversaries. How to know retrieval is working, how to know the answer is faithful and when to distrust the judge, where the milliseconds and the dollars go, how a poisoned document takes over an agent, and a field guide to the stores and frameworks you will actually choose between. |
| V | **Build It: PocketRAG** | Six chapters, one working retrieval engine in Python and TypeScript: an idempotent ingest pipeline, an inverted index with BM25, HNSW from scratch, hybrid retrieval with reranking and cited answers, an evaluation harness with an honest benchmark against pgvector, and finally an agent loop and a small GraphRAG index over the same corpus. |

---

## 2. Chapters

Format per chapter: title · archetype · blurb · sections · machines (spec per §7.5) · figures · outcomes · Topic Universe rows · prerequisites · words.

---

### Part I — The Machine and Why It Exists

#### Chapter 1 — The Machine Between the Question and the Answer *(Orientation, FREE)*

**Blurb.** Every RAG system, from a weekend script to a bank's assistant, is the same six-stage machine: load, chunk, embed and index, retrieve, assemble, generate. You will hover each stage, watch a real question flow through it, and see exactly where a wrong answer can enter. You will meet the three questions that explain most of this subject: words or meaning, once or many times, chunks or structure. And you will learn how this course works: machines beside the text, a quiz per chapter, exercises you can check yourself, and a build-it capstone where you write the engine.

**Sections.**
1. A question goes in, an answer comes out: the six stages, with Larkspur Q1 traced through them.
2. The ingest flow and the query flow, and why they are two different programs with one shared contract (the embedding model).
3. Three questions that explain the subject: words or meaning; once or a loop; flat chunks or structure.
4. Where answers go wrong: the four failure classes (missing data, weak retrieval, unfaithful generation, bad prompt) as a debugging map you will refine in Chapter 29.
5. The story of this course: what each part does, in order.
6. How to use this course: machines, quizzes, exercises, PocketRAG, and what to install (Python 3.12, Postgres 16 + pgvector 0.8, Node 22, an LLM key or Ollama).
7. Exercises.

**Machines.**
- `ragAnatomy` · Inspector · State: the six stages and the two flows, one active stage · Controls: hover/click a stage; "trace Q1" button advances a token through the pipeline · Discovery: the same embedding model box appears in both flows; change it in one and the other breaks (the machine shows the broken link) · Initial note: "Hover a stage to read what it does. Click *trace* to push a question through." · Layout: two horizontal lanes (ingest above, query below) sharing the embedding-model box in the middle.

**Figures.** F1.1 the six stages; F1.2 ingest vs query flow with the shared model; F1.3 the three-question decision tree; F1.4 four failure classes on the pipeline.

**Outcomes.** E1 (intro), A3 (intro). **Rows.** A6, A2 (intro), M9 (intro). **Prereqs.** none. **Words.** 2,600.

---

#### Chapter 2 — Why Models Don't Know: Parametric Knowledge and the Decision to Retrieve *(Mechanism)*

**Blurb.** A language model is a next-token predictor whose "knowledge" is the shape of its weights. That one fact explains the knowledge cutoff, the confident wrong citation, and why fine-tuning on your wiki does not make the model know your wiki. You will watch a model choose the next token, see where a fabricated case law comes from, and then work the decision every team faces: retrieval, fine-tuning, a longer prompt, or some of each. By the end you can defend the choice with numbers on freshness, cost, traceability, and access control.

**Sections.**
1. The closed book: what a next-token predictor stores and does not store (with the Womanlight/WikiData example redrawn on Larkspur data).
2. Four ways to be wrong: cutoff, staleness, fabrication, private data; hallucination as a spectrum, not a bit.
3. What training does and does not do: the four stages in one page, and the Ovadia 2023 vs Tian 2023 disagreement on fine-tuning for facts (sources differ note).
4. The context window as a budget: tokens, attention cost, price per million tokens, and why "stuff everything in" stops at a size.
5. The decision: RAG vs fine-tuning vs prompting vs long context on five axes (freshness, traceability, access control, style, cost), with the decision procedure.
6. In the real world: how ChatGPT's web search, enterprise assistants, and coding agents each chose.
7. Exercises.

**Machines.**
- `contextBudget` · Tuner · State: corpus size, model context length, price per 1 M tokens, queries/day · Controls: four sliders · Output: tokens per query, monthly cost, attention cost curve, a "fits / does not fit" marker · Discovery: find the corpus size where stuffing the whole corpus costs more per month than a retrieval stack (a fixed-cost line is drawn) · Initial note: "Drag corpus size until the whole corpus no longer fits a 200K context. Then watch the bill."
- `ragOrTune` · Comparator · State: five requirement toggles (fresh daily, must cite, per-user permissions, house style, tiny budget) · Output: recommended strategy with the axis that decided it · Discovery: turn on "per-user permissions" alone and see fine-tuning become impossible · Initial note: "Flip requirements. The verdict explains itself."

**Figures.** F2.1 next-token prediction over weights; F2.2 the four failure kinds on a timeline; F2.3 training stages; F2.4 the five-axis decision matrix; F2.5 cost vs corpus size curves.

**Outcomes.** E1, A6, A8. **Rows.** A1, A2, A3, A4, A7. **Prereqs.** 1. **Words.** 3,400.

---

#### Chapter 3 — Naive, Advanced, Modular: A Short History of RAG *(Mechanism, history)*

**Blurb.** RAG has a birth certificate: a 2020 paper from Meta that bolted a dense retriever onto a generator and trained them together. Since then the field moved from a fixed retrieve-then-read pipeline to pipelines with pre- and post-retrieval stages, and then to modules that can be rearranged, looped, and skipped. You will step through each paradigm on the same query, see which failure each one was invented to fix, and learn the names (RETRO, in-context RALM, Self-RAG, DSPy) you will meet in papers and job descriptions.

**Sections.**
1. Before LLMs: open-domain QA, DPR, and the retriever-reader pattern.
2. Lewis et al. 2020: RAG-Sequence and RAG-Token, and what "training the retriever with the generator" meant.
3. Retrieval inside the model: RETRO's chunked cross-attention, and why almost nobody ships it.
4. Naive RAG and its three failures; Advanced RAG's pre- and post-retrieval stages; Modular RAG's modules and patterns.
5. Compound AI systems: pipelines as programs (DSPy), and why this course teaches stages rather than a framework.
6. Exercises.

**Machines.**
- `ragParadigms` · Stepper · State: paradigm (naive / advanced / modular) and step index · Controls: paradigm tabs; step / back / reset · Output: the flow diagram lights up stage by stage on Larkspur Q2; a side panel names the failure each added stage removes · Discovery: in naive mode Q2 retrieves the wrong policy page (paraphrase miss); in advanced mode the rewrite stage fixes it · Initial note: "Step Q2 through naive RAG first. Watch it fetch the wrong page."

**Figures.** F3.1 retriever-reader; F3.2 RAG-Sequence vs RAG-Token marginalization; F3.3 RETRO chunked cross-attention; F3.4 the three paradigms side by side (redrawn); F3.5 timeline 2019–2026.

**Outcomes.** E14. **Rows.** A5, A8. **Prereqs.** 2. **Words.** 2,600.

---

### Part II — From Documents to an Index

#### Chapter 4 — Documents In: Loading, Parsing, and Metadata *(Mechanism)*

**Blurb.** Most retrieval failures are ingestion failures wearing a disguise. A two-column PDF read in the wrong order, a table flattened to word soup, a header repeated on every page, a chunk that says "it" with no antecedent: none of these are fixed by a better embedding model. You will partition real documents into typed elements, decide what to do with tables and images, design the metadata that later filters will depend on, and make the pipeline idempotent so re-running it never duplicates a chunk.

**Sections.**
1. What is in an enterprise corpus and why 80% of it is unstructured (with the Larkspur inventory).
2. Element-typed parsing: titles, paragraphs, lists, tables, figures; PDF layout, reading order, OCR vs vision models.
3. Tables and images: three strategies for tables, two for images, and the rule "summarize to retrieve, inject the original to answer".
4. Metadata by design: extracted, derived, generated; the filter schema (tenant, ACL, doc type, date, section) decided before the first embedding.
5. Cleaning for retrieval: boilerplate, abbreviations, self-contained chunks, contextual headers; near-duplicate detection with shingles and MinHash.
6. Ingestion as a pipeline: content hashes, idempotent upserts, deletes and tombstones, incremental re-index, freshness SLAs.
7. Exercises.

**Machines.**
- `docPartition` · Inspector · State: a rendered Larkspur policy PDF page with regions · Controls: click a region; toggle "reading order" overlay; toggle "naive text extraction" · Output: element type, text, metadata; naive extraction shows the two-column interleave bug · Discovery: switch to naive extraction and find the sentence that gets split across columns · Initial note: "Click any region of the page. Then toggle *naive extraction* and read the paragraph again."
- `dedupeMinhash` · Playground · State: two editable texts · Controls: shingle size, number of hashes · Output: Jaccard estimate vs exact · Discovery: change one word in a 200-word page and watch the estimate stay above 0.9 · Initial note: "Edit the right-hand text. The estimate tracks the true Jaccard."

**Figures.** F4.1 corpus inventory; F4.2 PDF page → elements; F4.3 table strategies; F4.4 metadata schema; F4.5 idempotent upsert state machine (new / changed / unchanged / deleted).

**Outcomes.** B1, O7 (intro). **Rows.** B1, B2, B3, B5, B6, B7, B8, B9. **Prereqs.** 1. **Words.** 3,600.

---

#### Chapter 5 — Chunking: Where to Cut Text and Why It Decides Everything *(Mechanism, keystone, FREE)*

**Blurb.** A chunk is the unit the retriever can return, so a bad cut is a fact the system can never find. You will cut the same Larkspur page five ways, fixed, recursive, document-aware, semantic, and proposition-based, and watch where each strategy splits a sentence, strands a heading, or merges two policies. Then you will run the experiment every team eventually runs, recall against chunk size, and discover that the answer is a curve with a knee, not a number from a blog post.

**Sections.**
1. The problem: embedding dilution and the granularity ladder (token, sentence, proposition, chunk, section, document).
2. Fixed and sliding windows: size, overlap, and the four different sizes the books recommend (sources differ note).
3. Recursive and document-aware splitting: separator hierarchies, Markdown/HTML/code splitters, CJK caveat.
4. Semantic chunking: sentence embeddings, breakpoint thresholds, cost.
5. Propositions and agentic chunking: Dense X Retrieval, pronoun-free atomic statements, when the cost pays.
6. The chunk-size experiment: recall@5 vs size on Larkspur with a fixed embedding model, and how to run it on your corpus.
7. Token budgets: counting with the right tokenizer; the same text is a different size to every model.
8. Exercises.

**Machines.**
- `chunker` · Playground · State: sample text, strategy, size, overlap, separator list · Controls: strategy tabs; size and overlap sliders; editable text · Output: coloured chunk boundaries over the text, chunk count, tokens per chunk histogram · Discovery: at fixed size 200 the baggage policy sentence about cellos is split mid-sentence; recursive at 200 keeps it whole · Initial note: "Drag the size slider to 200 on *fixed*. Find the sentence that got cut in half."
- `chunkSizeCurve` · Tuner · State: a canned experiment table (recall@5, latency, cost for sizes 64…2048 tokens, three overlaps) · Controls: overlap selector; metric selector · Output: the curve with the knee marked · Discovery: overlap helps below the knee and does nothing above it · Initial note: "Pick a metric. Find the knee. Then change the overlap."

**Figures.** F5.1 granularity ladder; F5.2 dilution: one embedding for a two-topic chunk; F5.3 recursive separator hierarchy; F5.4 semantic breakpoints; F5.5 propositions from a paragraph; F5.6 recall vs chunk size (redrawn from our experiment).

**Outcomes.** E9, A1. **Rows.** C1, C2, C3, C6, C7. **Prereqs.** 4. **Words.** 4,200.

---

#### Chapter 6 — Small to Big: Parent Documents, Windows, and Synthetic Index Entries *(Mechanism)*

**Blurb.** The thing you match on and the thing you hand the model do not have to be the same text. Match on a sentence, return the paragraph; match on a question the passage could answer, return the passage; match on a summary, return the section. This chapter builds the parent–child index, the sentence window, hypothetical-question entries, and the RAPTOR summary tree, and shows with the machine why over-fetching and deduplicating parents is required, not optional.

**Sections.**
1. The problem: precise matching wants small units, faithful answering wants context.
2. Parent-document retrieval: child embeddings, parent return, k×n over-fetch, dedupe by parent.
3. Sentence windows and contextual headers: the cheap versions.
4. Synthetic entries: hypothetical questions (Reverse HyDE), summaries, and keeping the link to the original.
5. Trees: RAPTOR's recursive summaries and when a summary tree beats a flat index.
6. Late chunking and long-context embedding models: the newest answer to the same question.
7. Exercises.

**Machines.**
- `parentChild` · Builder · State: a Larkspur section split into parents and children with embeddings (toy 4-d) · Controls: child size, k, over-fetch multiplier; "query" box with Q2 preset · Output: matched children highlighted, parents returned, duplicates struck through · Discovery: with multiplier 1, three of the top-4 children share one parent and the answer set collapses to two parents · Initial note: "Run Q2 with over-fetch ×1. Count the distinct parents."

**Figures.** F6.1 parent–child graph; F6.2 over-fetch and dedupe; F6.3 hypothetical questions in embedding space; F6.4 RAPTOR tree.

**Outcomes.** E9, B1. **Rows.** C4, C5, C7. **Prereqs.** 5. **Words.** 2,600.

---

#### Chapter 7 — Embeddings: Text as Geometry *(Mechanism, keystone)*

**Blurb.** An embedding turns a sentence into a point, and retrieval becomes geometry: nearby points mean similar meaning, and "nearby" has three definitions that agree only when vectors are normalized. You will place sentences in a space, compute cosine, dot product and Euclidean distance by hand on four-dimensional vectors, see where they disagree, and learn why raw transformer outputs cluster in a narrow cone. Then you will shrink vectors, with Matryoshka truncation and with scalar, binary and product quantization, and measure what each costs in recall.

**Sections.**
1. From one-hot to dense: word vectors, sentence embeddings, and what a dimension is not.
2. Three similarities: cosine, dot, L2; normalization; when the ranking differs (worked 4-d example).
3. The shape of the space: anisotropy, hubness, and why "0.8 similarity" means nothing across models.
4. Dimension and its cost: memory per million vectors, Matryoshka embeddings, truncation experiments.
5. Quantization: scalar int8, binary with Hamming, product quantization preview (full treatment Chapter 12); halfvec in Postgres.
6. In the real world: OpenAI text-embedding-3, BGE, E5, Cohere; dimensions, context lengths, prices (dated table).
7. Exercises.

**Machines.**
- `vectorSpace` · Playground · State: ~30 Larkspur sentences with precomputed 2-D projections and hidden full vectors; a query box with presets · Controls: similarity metric selector; normalize toggle; type a query (canned embedding lookup for presets, nearest preset otherwise) · Output: points, query point, top-5 ranked with scores · Discovery: with normalize off, dot product and cosine rank Q1's neighbours differently; normalize on, they agree · Initial note: "Select *dot product*, turn normalization off, and compare the top-5 to cosine."
- `quantizeVec` · Tuner · State: a 64-d vector set · Controls: precision (float32 / float16 / int8 / binary), Matryoshka truncation length · Output: bytes per vector, recall@10 vs exact, a bar of memory for 1 M vectors · Discovery: binary vectors cut memory 32× and keep recall above 0.9 only after rescoring with full vectors (toggle) · Initial note: "Switch to binary. Watch recall fall. Turn on rescoring."

**Figures.** F7.1 sentences as points; F7.2 cosine vs dot vs L2 on the same pair; F7.3 the anisotropy cone; F7.4 Matryoshka nesting; F7.5 quantization ladder with bytes per vector.

**Outcomes.** E2 (part), E3. **Rows.** D1, D4, D8. **Prereqs.** 5. **Words.** 3,600.

---

#### Chapter 8 — How Embedding Models Learn: Bi-Encoders, Contrastive Loss, and Choosing One *(Mechanism, keystone)*

**Blurb.** The model that made your vectors was trained to pull a question toward its answer and push it away from everything else in the batch. Knowing that explains why in-batch negatives matter, why hard negatives make or break a domain model, why instruction prefixes exist, and why an embedding model is not a language model. You will train a toy bi-encoder in the machine, watch points move under contrastive loss, then choose a model for Larkspur the way a senior engineer does: not from a leaderboard, but from a labelled set of your own queries.

**Sections.**
1. The problem: a general model does not know that "PNR" and "booking reference" are the same thing.
2. The bi-encoder and the contrastive objective: InfoNCE, temperature, in-batch negatives, hard negatives (DPR, Sentence-BERT).
3. Recipes that matter: E5 and BGE multi-stage training, instruction prefixes ("query:", "passage:"), pooling choices.
4. Choosing: MTEB and its limits; building a 200-query labelled set; comparing two models on recall@10 and MRR on your corpus.
5. Fine-tuning on your domain: synthetic pairs (Promptagator), a training loop, when the gain is worth the re-index.
6. Upgrading the model in production: dual-write, backfill, cut-over, and the test that proves parity.
7. Exercises.

**Machines.**
- `contrastiveTrain` · Simulator · State: 2-D points for 12 query/passage pairs, learning rate, temperature, batch size, hard-negative toggle · Controls: step / run / pause / reset; sliders · Output: points moving, loss curve, recall@1 on a held-out pair set · Discovery: with hard negatives off, the two "refund" passages never separate; turn hard negatives on and they do within 40 steps · Initial note: "Press *run*. Watch the refund pair fail to separate. Then enable hard negatives."

**Figures.** F8.1 bi-encoder vs cross-encoder; F8.2 InfoNCE with a batch matrix; F8.3 hard vs random negatives; F8.4 model comparison table on a labelled set; F8.5 dual-write cut-over timeline.

**Outcomes.** E2, O1, O7. **Rows.** D2, D3, D5, D6. **Prereqs.** 7. **Words.** 4,000.

---

#### Chapter 9 — The Inverted Index and BM25: Why Keywords Still Win *(Mechanism, keystone)*

**Blurb.** Dense retrieval misses "cello" because the model never saw enough cellos. A forty-year-old data structure does not: the inverted index maps every term to the documents that contain it, and BM25 scores them with two ideas, rarity and saturation, that fit on an index card. You will build an index by typing documents, watch postings lists grow, tune k1 and b and see rankings flip, then meet the modern descendants, learned sparse models like SPLADE and ELSER, that keep the index and learn the terms.

**Sections.**
1. The problem: exact terms, identifiers, and rare words; Larkspur Q1 through a dense retriever.
2. The inverted index: tokenization, stemming, stopwords, dictionary and postings, construction and updates.
3. Scoring: TF-IDF and the vector space model; BM25's saturation (k1) and length normalization (b); BM25F for fields.
4. Serving it fast: postings compression, top-k with WAND and block-max, why this is sub-linear.
5. Query-side help: expansion, relevance feedback, spelling, phrase and prefix matching, multilingual tokenizers.
6. Learned sparse retrieval: SPLADE and ELSER expand terms with a model and keep the inverted index.
7. In the real world: Lucene/Elasticsearch, Postgres `tsvector`, Tantivy; what each implements and defaults for k1 and b.
8. Exercises.

**Machines.**
- `invertedIndex` · Builder · State: editable document list, tokenizer options, resulting dictionary and postings · Controls: add/remove/edit documents; stemming and stopword toggles; query box · Output: postings lists, matched docs, per-term contributions · Discovery: add "cellos" to a document and see it match Q1 only with stemming on · Initial note: "Add a document containing the word *cellos*. Search *cello*. Toggle stemming."
- `bm25Tuner` · Tuner · State: five Larkspur documents, a query, k1, b · Controls: sliders for k1 (0–3) and b (0–1) · Output: per-document score bars with the TF, IDF and length terms broken out; ranking · Discovery: set b to 0 and the long policy page overtakes the short FAQ answer · Initial note: "Slide b to 0. Watch the long page climb."

**Figures.** F9.1 dictionary and postings; F9.2 BM25 term-frequency saturation curve for three k1; F9.3 length normalization; F9.4 WAND skipping; F9.5 SPLADE term expansion.

**Outcomes.** E4, B2. **Rows.** E1, E2, E3, E4, E5, E6, E7. **Prereqs.** 4. **Words.** 4,200.

---

#### Chapter 10 — Nearest Neighbours: The Problem, the Triangle, and the Curse *(Mechanism)*

**Blurb.** Finding the closest vector among a million is a scan of a million dot products, and that scan is the whole reason approximate indexes exist. This short chapter states the problem precisely, measures brute force on your laptop, introduces the recall–latency–memory triangle you will trade inside for the next three chapters, and explains why high dimensions make everything both easier and harder. It ends with the benchmark harness, ann-benchmarks style, that every index chapter reports against.

**Sections.**
1. Exact k-NN: the scan, its cost, and SIMD; when flat is the right index.
2. The triangle: recall@k vs queries per second vs bytes; how to read an ann-benchmarks plot.
3. The curse of dimensionality: distance concentration, and why tree indexes died at ~20 dimensions.
4. The historical alternative: locality-sensitive hashing in one page.
5. The harness: a labelled ground truth from brute force, recall@10 measurement, latency percentiles.
6. Exercises.

**Machines.**
- `bruteForce` · Tuner · State: N vectors, d dimensions, hardware profile · Controls: sliders N (1K–100 M), d (64–3072), profile (laptop / server / GPU) · Output: scan time per query, memory, queries per second; a marker where p95 crosses 100 ms · Discovery: at 1 M × 1536 float32 the index alone is 6 GB and a scan is tens of milliseconds; halve d and watch both halve · Initial note: "Set N to one million and d to 1536. Read the memory bar."

**Figures.** F10.1 the scan; F10.2 the triangle; F10.3 distance concentration histogram; F10.4 an ann-benchmarks plot, annotated.

**Outcomes.** A2 (intro), O4 (intro). **Rows.** F1, F6, N6 (paragraph). **Prereqs.** 7. **Words.** 2,200.

---

#### Chapter 11 — HNSW: A Graph That Finds Neighbours in Microseconds *(Mechanism, keystone, FREE)*

**Blurb.** The index inside pgvector, Qdrant, Elasticsearch, Weaviate, and Milvus is the same idea: a graph where every vector links to a few neighbours, stacked in layers so a search can take long hops first and short hops last. You will build one point by point, watch the greedy search descend, turn the two knobs that matter, M and ef, and measure recall against brute force as you turn them. You will also see the ugly parts: what a delete does, why the graph is huge in memory, and where recall quietly drops.

**Sections.**
1. The problem: sub-linear search without a tree; navigable small worlds (Malkov 2014) and the six-degrees intuition.
2. The structure: layers with exponentially fewer nodes, entry point, M links per node, the heuristic neighbour selection.
3. Search: greedy descent through layers, the candidate list of size ef, why ef bounds recall.
4. Insertion: level assignment, ef_construction, pruning; build time and its cost.
5. Deletes, updates, and the graph's memory footprint; why pgvector builds in `maintenance_work_mem`.
6. Parameters in the wild: pgvector (m=16, ef_construction=64, ef_search=40), Qdrant (m=16, ef_construct=100), Lucene; what to change first.
7. Exercises.

**Machines.**
- `hnswSearch` · Simulator · State: 2-D points, layered graph, M, ef_construction, ef_search, a query point · Controls: "insert 50 points", "insert one" (click to place), M and ef sliders, step / run search, reset · Output: layers drawn as stacked planes, visited nodes highlighted in order, candidate list, recall@10 vs brute force, distance computations counted · Discovery: at ef_search=10 the search misses one of the true top-10 on the default set; raise ef to 40 and it is found, with roughly 3× the distance computations · Initial note: "Click *insert 50*, then *run search*. Read the recall. Now raise ef."

**Figures.** F11.1 layers and the descent; F11.2 greedy search with candidate list; F11.3 insertion and neighbour pruning; F11.4 recall vs ef and vs M (redrawn from our harness); F11.5 memory per vector for the graph.

**Outcomes.** E5, A2, B3. **Rows.** F2. **Prereqs.** 10. **Words.** 4,400.

---

#### Chapter 12 — IVF and Product Quantization: Trading Memory for Recall *(Mechanism, keystone)*

**Blurb.** When a billion vectors will not fit in RAM, you stop storing vectors. Inverted-file indexes partition space into cells and search a few of them; product quantization replaces each vector with a handful of one-byte codebook indices and computes distances from a lookup table. You will build both on a toy set, set nlist and nprobe, watch recall move, and compress a 1536-dimensional vector to 96 bytes and see what that does to the ranking. Then you will see how DiskANN keeps a graph on SSD, and when GPUs change the answer.

**Sections.**
1. The problem: 1 M × 1536 float32 is 6 GB; a billion is a data centre.
2. IVF: k-means centroids, cells, nlist and nprobe, the recall cliff at cell boundaries; IVFFlat in pgvector.
3. Product quantization: sub-vectors, codebooks, asymmetric distance computation, the distance table; IVFPQ.
4. Refinement: re-rank the candidates with exact distances; OPQ in one paragraph.
5. Disk and GPU: DiskANN/Vamana graphs on SSD, ScaNN, GPU-built HNSW in Elasticsearch.
6. Choosing an index: a decision table by N, d, memory, update rate, filter needs.
7. Exercises.

**Machines.**
- `ivfCells` · Builder · State: 2-D points, nlist centroids, nprobe, query · Controls: nlist and nprobe sliders, "train", click to query · Output: Voronoi cells, probed cells shaded, true top-k vs found, recall · Discovery: a query near a cell boundary loses its nearest neighbour at nprobe=1 and finds it at 2 · Initial note: "Train with 8 cells. Click just inside a cell edge. Raise nprobe."
- `pqCodebook` · Playground · State: a 16-d vector set, m sub-vectors, k centroids per sub-space · Controls: m and k selectors; pick a vector · Output: the vector's codes, its reconstruction, bytes before/after, distance error vs exact · Discovery: m=4,k=256 turns 64 bytes into 4 with a visible but small ranking change; m=2 wrecks it · Initial note: "Choose m=4, k=256. Compare the reconstruction to the original."

**Figures.** F12.1 IVF cells and probes; F12.2 PQ sub-vector split and codebooks; F12.3 asymmetric distance table; F12.4 the index decision table; F12.5 DiskANN graph on SSD.

**Outcomes.** E6, A2. **Rows.** F3, F4. **Prereqs.** 11. **Words.** 4,000.

---

#### Chapter 13 — Filters Meet Vectors: Pre-, Post-, Filtered ANN, and pgvector From the Inside *(Mechanism + practitioner, keystone)*

**Blurb.** "Nearest neighbours where tenant = 42 and date > March" is the query every production system runs, and it is where vector indexes break. Filter first and the graph loses its links; filter after and a selective filter returns nothing. You will watch recall collapse as you tighten a filter, see how filterable HNSW and ACORN repair the graph, and learn pgvector's iterative scans. Then you will open pgvector itself: the types, the operators, the two indexes, and how to read EXPLAIN on a vector query you wrote.

**Sections.**
1. The problem: the selectivity cliff, with Larkspur's per-airport contracts.
2. Pre-filtering, post-filtering, and in-graph filtering; where each wins by selectivity.
3. Filterable HNSW, ACORN, payload indexes, tenant and principal indexes in Qdrant; Elasticsearch's filtered kNN.
4. pgvector's answer: `hnsw.iterative_scan`, `max_scan_tuples`, partial indexes, partitioning by tenant.
5. pgvector from the inside: `vector`, `halfvec`, `bit`, `sparsevec`; operators; HNSW and IVFFlat build and search parameters; `maintenance_work_mem`.
6. Reading EXPLAIN on a vector query; what the planner does and does not know about distance (pointer to *PostgreSQL Internals in Depth*, course 02, and *Databases in Depth* Chapter 5 for B-trees).
7. Try it on your machine: the exact commands and the expected output.
8. Exercises.

**Machines.**
- `filteredAnn` · Tuner · State: 2-D points with a categorical attribute, HNSW graph, filter selectivity, strategy · Controls: selectivity slider (100% → 0.1%), strategy tabs (pre / post / filtered-HNSW / iterative) · Output: recall@10, distance computations, an animation of the search on the filtered graph · Discovery: post-filtering returns fewer than 10 results below 5% selectivity; pre-filtering's recall stays high but its cost line climbs toward brute force · Initial note: "Tighten the filter to 2%. Watch each strategy in turn."
- `pgvectorExplain` · Inspector · State: a canned `EXPLAIN ANALYZE` tree for four query variants (flat, HNSW, HNSW + WHERE, iterative) · Controls: variant tabs; hover nodes · Output: node meaning, rows, timing, which setting changed the plan · Discovery: the `WHERE` variant shows the index scan followed by a filter that drops rows, and the iterative variant shows rows recovered · Initial note: "Open the *HNSW + WHERE* plan. Find the node that throws rows away."

**Figures.** F13.1 the selectivity cliff; F13.2 pre vs post vs in-graph; F13.3 ACORN's extra edges; F13.4 pgvector type and operator table (SVG table); F13.5 an annotated EXPLAIN tree.

**Outcomes.** A5, O4, B3 (part). **Rows.** F5, F7 (part), F8, B5 (query side), N7, N8 (pointers). **Prereqs.** 11, 12. **Words.** 4,800.

---

### Part III — From Question to Answer

#### Chapter 14 — The Query Gap: Rewriting, Expansion, and Routing *(Mechanism, keystone)*

**Blurb.** Users ask questions; documents state facts; the embedding space puts them in different places. You will measure that gap on Larkspur Q2, then close it five ways: generate a hypothetical answer and search with that (HyDE), abstract the question first (step-back), ask several variants (multi-query), decompose (sub-questions), or train a small rewriter. Then you will route: decide which index, which filter, which retriever a question should go to, and when to ask the user back.

**Sections.**
1. The problem: question-shaped queries vs statement-shaped passages; the gap measured.
2. Rewriting with a model: HyDE, step-back, Rewrite-Retrieve-Read; prompt, cost, latency, when each fails.
3. Expansion: multi-query and RAG-Fusion, sub-questions (least-to-most), chain-of-verification.
4. Routing: metadata routers, semantic routers, LLM classifiers; index and retriever selection; entity and value mapping to database values.
5. Ambiguity: clarification trees, and the product decision to ask back.
6. Multilingual and cross-lingual queries.
7. Exercises.

**Machines.**
- `queryRewrite` · Stepper · State: Larkspur Q2, rewriting strategy, canned rewrites and retrieval results · Controls: strategy tabs; step through rewrite → retrieve → compare · Output: the rewritten query, top-5 with the gold passage marked, rank of the gold passage per strategy · Discovery: the raw query ranks the gold passage 7th; HyDE and step-back both bring it to 1st but retrieve different second results · Initial note: "Step the raw query first. Note the gold rank. Then try HyDE."

**Figures.** F14.1 the gap in embedding space; F14.2 HyDE flow; F14.3 step-back flow; F14.4 multi-query fan-out and merge; F14.5 router decision.

**Outcomes.** E10. **Rows.** H1, H2, H4, H5, H6. **Prereqs.** 7, 9. **Words.** 3,800.

---

#### Chapter 15 — Hybrid Retrieval and Rank Fusion *(Mechanism, keystone)*

**Blurb.** Keyword search finds "cello" and misses "get my money back"; dense search does the reverse. Production systems run both and merge. This chapter is about the merge: why raw scores from two systems cannot be added, why normalizing by the maximum is fragile, and why Reciprocal Rank Fusion, three lines of arithmetic, is the default in Elasticsearch, Qdrant, Weaviate and Azure AI Search. You will fuse two lists by hand, change one rank, and watch the merged order move.

**Sections.**
1. The problem: complementary failure modes, measured on Q1 and Q2.
2. Score fusion: min-max, z-score, convex combination with a weight; why scales lie.
3. Reciprocal Rank Fusion: the formula, the constant k, worked example, properties.
4. Beyond two lists: fusing multi-query results, weighting sources, deduplication.
5. In the real world: how Elasticsearch retrievers, Qdrant's fusion, pgvector's SQL-level union, and Vespa's rank profiles implement it.
6. Exercises.

**Machines.**
- `rrfFusion` · Playground · State: two editable ranked lists of 8 documents, k · Controls: drag to reorder either list; k slider (1–100); method tabs (RRF / max-norm / z-score) with editable raw scores · Output: fused ranking with per-document contributions · Discovery: move one document from rank 3 to rank 1 in the sparse list and see how far it rises under RRF vs max-norm; raise k and watch the lists' influence flatten · Initial note: "Drag a document up in the left list. Compare RRF with max-normalization."

**Figures.** F15.1 sparse and dense misses; F15.2 score distributions that cannot be added; F15.3 RRF worked table; F15.4 fusion in a pipeline.

**Outcomes.** E8, A4, B4. **Rows.** G1, G2, E7 (part). **Prereqs.** 9, 11. **Words.** 2,800.

---

#### Chapter 16 — Reranking: Cross-Encoders, Late Interaction, and Learning to Rank *(Mechanism, keystone)*

**Blurb.** A bi-encoder scores a query and a passage without ever letting them see each other. A cross-encoder reads them together, attends across both, and is far more accurate and far too slow to run on a million passages. The answer is a cascade: retrieve a hundred cheaply, rerank ten expensively. You will tune the cascade and watch nDCG and latency trade, look inside ColBERT's token-level MaxSim to see the middle ground, and place LLM rerankers and learning-to-rank in the same picture.

**Sections.**
1. The problem: top-100 has the answer, top-5 does not.
2. Cross-encoders: architecture, why they are accurate, cost per pair; bge-reranker, Cohere Rerank, monoT5.
3. The cascade: choosing k1 and k2, latency budget, batching; measuring the gain with nDCG@10.
4. Late interaction: ColBERT token vectors, MaxSim, PLAID; storage cost vs accuracy.
5. Learning to rank: pointwise, pairwise, listwise; features; where LLM-as-reranker fits and what it costs.
6. Diversity and time: MMR, result deduplication, recency weighting.
7. Exercises.

**Machines.**
- `rerankCascade` · Tuner · State: a canned candidate set with bi-encoder scores, cross-encoder scores, gold labels; k1, k2, reranker choice (small / large / LLM) · Controls: k1 and k2 sliders; reranker tabs · Output: nDCG@10, recall@k2, p95 latency, cost per query · Discovery: nDCG rises steeply from k1=10 to 50 and flattens after; the large reranker at k1=100 costs more latency than it returns in nDCG · Initial note: "Set k1 to 10, then 50, then 100. Watch nDCG and latency."
- `colbertMaxSim` · Inspector · State: query tokens × passage tokens similarity matrix for Q1 and two passages · Controls: hover a cell; toggle passage · Output: per-query-token max highlighted, MaxSim sum · Discovery: the token "cello" drives the whole score for the right passage and finds nothing in the wrong one · Initial note: "Hover the *cello* row. See which passage token it locks onto."

**Figures.** F16.1 bi- vs cross-encoder attention; F16.2 the cascade with counts and latency; F16.3 ColBERT MaxSim; F16.4 nDCG vs k1 curve; F16.5 LTR feature table.

**Outcomes.** E7, B4. **Rows.** G3, G4, G5, G6. **Prereqs.** 8, 15. **Words.** 4,000.

---

#### Chapter 17 — Assembling the Context Window *(Mechanism, keystone)*

**Blurb.** You have ten good passages and a model that will read the first and the last and skim the middle. Where you put the best one changes the answer. This chapter is about the last step before generation: ordering, budgeting, compressing, and deciding what to drop. You will move a gold passage through the window and watch accuracy dip in the middle, compress a context with a small model and see what survived, and learn why a little irrelevant noise sometimes helps and a lot always hurts.

**Sections.**
1. The problem: "lost in the middle" measured; position-aware ordering.
2. Budgets: token accounting per stage, reserving room for the answer, truncation policies.
3. Compression: LLMLingua-style token pruning, RECOMP summaries, selective augmentation; what each destroys.
4. Noise and contradiction: the "power of noise" result, contradictory documents, negative rejection.
5. Prompt caching: putting the static prefix first so providers can cache it; what it saves.
6. Exercises.

**Machines.**
- `lostInMiddle` · Tuner · State: a canned accuracy-vs-position curve for three context sizes; a window of 10 slots · Controls: drag the gold passage to a slot; context size tabs · Output: predicted accuracy, the curve with the slot marked · Discovery: at 20 passages the middle dips below the "no retrieval" baseline · Initial note: "Drag the gold passage to slot 10 of 20. Compare with slot 1."
- `contextPacker` · Builder · State: candidate passages with tokens and scores; budget; ordering policy; compression toggle · Controls: budget slider; policy tabs (by score / ends-first / diversity); compression on/off · Output: the packed window, tokens used, passages dropped, cache-prefix marker · Discovery: ends-first ordering keeps both top passages inside the model's attention sweet spots at the same budget · Initial note: "Set the budget to 2,000 tokens. Switch ordering to *ends-first*."

**Figures.** F17.1 lost-in-the-middle curve (redrawn); F17.2 token budget breakdown; F17.3 compression before/after; F17.4 prompt-cache prefix layout.

**Outcomes.** E11, O8 (part). **Rows.** G7, G8, I7, C6 (query side). **Prereqs.** 16. **Words.** 3,200.

---

#### Chapter 18 — Grounded Generation: Prompts, Citations, and Refusal *(Mechanism, keystone)*

**Blurb.** Perfect retrieval does not guarantee a faithful answer; the model can still add, blend, or invent. This chapter is the generation stage done properly: a prompt that binds the model to the context, a citation format that can be verified, a refusal path for Q5's peacock policy, and a detector that checks each claim against the passages after the fact. You will run claims through a faithfulness checker, watch a plausible sentence fail, and learn where the remaining hallucinations come from.

**Sections.**
1. The problem: fabrication with the right context in the window; the faithfulness spectrum.
2. The grounded prompt: roles, instructions, delimiters, few-shot, structured outputs; what "say I don't know" does and does not fix.
3. Citations: inline markers, span attribution, verifying citations post-hoc, presenting sources.
4. Refusal and abstention: negative rejection, confidence signals, product wording.
5. Detectors: claim decomposition and NLI-style entailment (the RAGAS faithfulness idea, Vectara HHEM, AlignScore); cost and blind spots.
6. Choosing the generator: size, context, latency, price; local vs hosted; response synthesis modes (refine, tree, map-reduce) and streaming.
7. Fine-tuning the generator for RAG (RAFT, RA-DIT) in one page.
8. Exercises.

**Machines.**
- `faithfulnessCheck` · Playground · State: a context of three passages, an editable answer, canned claim decompositions and entailment verdicts for preset answers · Controls: pick a preset answer or edit within presets; "decompose", "verify" · Output: claims list, each supported / unsupported / contradicted with the passage highlighted · Discovery: the fluent answer that merges two policies passes on relevance and fails on one claim · Initial note: "Load the *plausible* answer. Decompose it. Find the unsupported claim."

**Figures.** F18.1 the grounded prompt anatomy; F18.2 citation span attribution; F18.3 claim → NLI pipeline; F18.4 refusal decision; F18.5 synthesis modes.

**Outcomes.** E1, O2 (part), B5. **Rows.** I1, I2, I3, I4, I5, I6. **Prereqs.** 17. **Words.** 4,200.

---

#### Chapter 19 — Conversations: Multi-Turn RAG and Memory *(Mechanism, keystone)*

**Blurb.** "And for my return flight?" retrieves nothing on its own. Multi-turn RAG must rewrite the follow-up into a standalone question, decide what of the history to keep, and stop the context from growing without bound. You will step a four-turn Larkspur conversation through the condense-question pattern, see a rewrite go wrong when history is ambiguous, and build the memory ladder: window, summary, entity memory, and long-term stores paged in on demand.

**Sections.**
1. The problem: follow-ups, pronouns, and topic shifts.
2. Condense-question: rewriting with history, prompts, failure cases.
3. Memory: window, rolling summary, entity/fact memory, vector memory, MemGPT-style paging.
4. Bounding cost: per-turn budgets, history truncation, caching the prefix.
5. Chat engines in frameworks and what they hide.
6. Exercises.

**Machines.**
- `condenseTurns` · Stepper · State: a four-turn conversation, memory policy, canned rewrites and retrievals · Controls: step turns; memory policy tabs (none / window 2 / summary / entity) · Output: the standalone question generated, what was retrieved, context tokens used · Discovery: with no memory, turn 3 retrieves the outbound baggage page; with entity memory it correctly retrieves the return-flight rules · Initial note: "Step to turn 3 with memory *none*. Read the rewritten question."

**Figures.** F19.1 condense-question flow; F19.2 the memory ladder; F19.3 token growth per turn under each policy.

**Outcomes.** O9. **Rows.** H3, J4. **Prereqs.** 14, 18. **Words.** 2,600.

---

#### Chapter 20 — Retrieval That Thinks: Iterative, Adaptive, and Corrective RAG *(Mechanism, keystone)*

**Blurb.** One retrieval cannot answer Q4: which policy changed after an incident needs the incident first, then the policy. This chapter makes the pipeline loop. You will run iterative retrieval that feeds each answer draft back as a query, chain-of-thought-guided retrieval for multi-hop questions, and the adaptive family that decides *whether* to retrieve at all: FLARE's confidence trigger, Self-RAG's reflection tokens, CRAG's retrieval evaluator with a web-search fallback. The machine lets you set the thresholds and watch calls, cost and accuracy move together.

**Sections.**
1. The problem: multi-hop and the single-shot ceiling.
2. Iterative retrieval: ITER-RETGEN; recursive retrieval with chain-of-thought (IRCoT); stopping rules.
3. Adaptive retrieval: FLARE's token-probability trigger; Self-RAG's retrieve/critic tokens and segment scoring; SKR.
4. Corrective retrieval: CRAG's evaluator, correct/ambiguous/incorrect actions, knowledge refinement.
5. Costs: calls per question, latency, and when a loop is worse than a better index.
6. Exercises.

**Machines.**
- `adaptiveLoop` · Simulator · State: Q4 with canned hop results; mode (single / iterative / FLARE / Self-RAG / CRAG); thresholds · Controls: mode tabs; confidence threshold slider; max-hops; run / step / reset · Output: the loop trace (retrieve, draft, decide), hops taken, LLM calls, tokens, whether the final answer is correct · Discovery: FLARE at a low threshold never retrieves and answers Q4 wrong; at a high threshold it retrieves every sentence and triples the cost; the knee is visible · Initial note: "Run Q4 in *single* mode. Then *iterative*. Count the hops."

**Figures.** F20.1 single vs iterative vs recursive vs adaptive (redrawn); F20.2 IRCoT interleaving; F20.3 Self-RAG reflection tokens; F20.4 CRAG's three actions; F20.5 cost vs accuracy per mode.

**Outcomes.** E14, A3 (part). **Rows.** J1, J2, N11. **Prereqs.** 18. **Words.** 3,800.

---

#### Chapter 21 — Agentic RAG: Tools, Routers, and Critics *(Mechanism, keystone)*

**Blurb.** Once retrieval is a tool the model can call, the pipeline becomes a loop with a budget. This chapter builds that loop from parts: tool definitions the model can read, a router that picks the retriever, a critic that decides whether the answer is complete, and the exit rules that stop it running forever. You will inject failures, a tool that errors, a retriever that returns junk, a critic that never approves, and watch a bounded agent degrade gracefully and an unbounded one burn money.

**Sections.**
1. The problem: several retrievers, one question, and no fixed pipeline that fits all of them.
2. Tool calling: function schemas, ReAct, how the model "calls" a tool it cannot run.
3. The retriever router and the answer critic; query updating between sub-questions; the `answer_given` shortcut.
4. Budgets and exits: max steps, cost caps, timeouts, fallbacks; observability hooks.
5. Multi-agent and workflow orchestration; tool protocols (MCP-style) in one page; when agentic RAG is the wrong answer.
6. Exercises.

**Machines.**
- `agentLoop` · Simulator · State: tools (vector, keyword, SQL, answer_given), router, critic, step budget, failure injection flags · Controls: pick Q1–Q5; budget slider; inject "SQL tool errors", "vector returns junk", "critic never satisfied"; run / step / reset · Output: the step trace with tool calls, arguments, results, critic verdicts, cost meter; final answer or graceful failure · Discovery: with the critic stuck and no budget the loop never ends (the machine caps at 30 and flags it); with a budget of 6 it returns a partial answer with a stated gap · Initial note: "Run Q3. Watch the router pick SQL. Then inject *SQL tool errors*."

**Figures.** F21.1 the agent loop; F21.2 tool schema anatomy; F21.3 router + critic data flow; F21.4 failure and exit table.

**Outcomes.** B7, A3 (part). **Rows.** J3, J5, J6, L7 (intro). **Prereqs.** 20. **Words.** 3,800.

---

#### Chapter 22 — Structured Retrievers: Text-to-SQL and Text-to-Cypher *(Mechanism)*

**Blurb.** "How many refund tickets were opened in March?" has no similar chunk; it has a table. This chapter turns natural language into a database query safely: schema in the prompt, terminology mapping, few-shot examples, format constraints, read-only execution, and the failure modes (wrong join, hallucinated column, runaway query). You will step a question into SQL and into Cypher, inject a schema the model misreads, and fix it with one example. Then you will decide when a parameterized template beats generated queries.

**Sections.**
1. The problem: aggregation, filtering and counting are not similarity.
2. The prompt: schema inference and formatting, terminology mapping, few-shot, format instructions.
3. Execution: read-only roles, timeouts, row limits, result summarization back into the answer.
4. Failure modes and repairs: error-feedback loops, self-consistency, fine-tuned small models.
5. Templates vs generation: parameterized retrievers as tools; text-to-query as the catch-all.
6. Exercises.

**Machines.**
- `text2query` · Stepper · State: Q3, a Larkspur schema (tables or graph), prompt parts, canned generations and results · Controls: SQL / Cypher tabs; toggle each prompt part (schema, mapping, few-shot); step generate → execute → summarize; inject "column renamed" · Output: the prompt, the generated query, the execution result or error, the final sentence · Discovery: with terminology mapping off, the model queries a non-existent `refunds` table; one few-shot example fixes it · Initial note: "Turn off *terminology mapping* and step. Read the error."

**Figures.** F22.1 prompt anatomy for text-to-query; F22.2 execution sandbox; F22.3 error-feedback loop; F22.4 template vs generated decision.

**Outcomes.** A7, B7 (part). **Rows.** J7, H5, B9, K1 (intro). **Prereqs.** 21. **Words.** 3,000.

---

#### Chapter 23 — Knowledge Graphs for RAG: Extraction, Resolution, and Graph Retrieval *(Mechanism, keystone)*

**Blurb.** Chunks lose the boundaries between documents and the links between facts; a graph keeps both. You will extract entities and relationships from Larkspur contracts with structured outputs, design a graph schema, watch three spellings of one airport collapse into one node, and store the original chunks beside the entities they mention. Then you will retrieve from the graph: entity lookup, neighbourhood expansion, and the hybrid path from a vector hit to its graph context.

**Sections.**
1. The problem: document boundaries, multi-hop, and aggregation over chunks.
2. Property graphs in one page: nodes, relationships, properties, Cypher and GQL; when a graph beats a table.
3. Extraction with structured outputs: schema design, optional fields, enums, descriptions; prompt; idempotent import.
4. Entity resolution: blocking, string similarity, embedding clustering, rules, human loops.
5. Mixed graphs: chunks linked to entities; retrieval paths (entity → chunks, chunk → neighbours); entity linking from text.
6. Other KG-RAG families (KGP, G-Retriever, HippoRAG) in a paragraph each.
7. Exercises.

**Machines.**
- `kgExtract` · Builder · State: a contract paragraph, an editable extraction schema, canned extractions, resolution threshold · Controls: schema field toggles (optional / enum); "extract"; resolution threshold slider; "merge" · Output: the graph drawn, duplicate candidates with similarity, merged nodes · Discovery: with the threshold at 0.95 "Larkspur Ltd" and "Larkspur Limited" stay separate; at 0.85 they merge and "Larkspur Air Cargo" wrongly joins them at 0.7 · Initial note: "Press *extract*. Slide the threshold down until the duplicates merge, then further until it goes wrong."

**Figures.** F23.1 chunks vs graph on Q4; F23.2 property graph model for contracts; F23.3 structured-output schema; F23.4 entity resolution pipeline; F23.5 mixed graph with chunk links.

**Outcomes.** E12 (part), A7, B8 (part). **Rows.** K1, K2, K4, K5. **Prereqs.** 22. **Words.** 3,800.

---

#### Chapter 24 — GraphRAG: Communities, Summaries, and Global Search *(Mechanism, keystone)*

**Blurb.** "What are the main themes across all incident reports?" has no chunk that answers it. Microsoft's GraphRAG answers it by building a graph, clustering it into communities, writing a report per community, and answering global questions by map-reduce over the reports. You will run the pipeline on Larkspur's post-mortems: extraction with gleaning passes, description summarization, Leiden communities at two levels, reports, then global and local search. The machine shows the token bill at every stage, because the bill is the trade.

**Sections.**
1. The problem: query-focused summarization over a corpus.
2. Indexing: chunking for extraction (the 600-token result), extraction and gleaning, description summarization, super-nodes.
3. Communities: modularity, Louvain vs Leiden, hierarchy levels; community reports with ratings.
4. Global search: map (key points with importance) and reduce; choosing the level; cost.
5. Local search: entity vector search, neighbourhood, chunks, reports, ranking and caps.
6. When GraphRAG pays and when it does not: indexing cost, freshness, corpus type; lighter variants.
7. Exercises.

**Machines.**
- `graphragPipeline` · Stepper · State: six post-mortem chunks, canned entities/relations/descriptions/communities/reports, level, query mode · Controls: step through extract → summarize → community → report → search; gleaning passes (0–2); level (0/1); global / local tabs · Output: the graph growing, communities coloured, reports, the map-reduce table, running token cost · Discovery: one gleaning pass adds ~15% entities for ~2× extraction cost; level-1 global search answers the theme question with a third of the map calls of level 0 · Initial note: "Step through the pipeline once. Then set gleaning to 1 and watch the entity count and the cost."

**Figures.** F24.1 the GraphRAG pipeline (redrawn); F24.2 chunk size vs entity references (redrawn from Edge 2024); F24.3 Leiden hierarchy; F24.4 global search map-reduce; F24.5 local search context assembly; F24.6 token cost per stage.

**Outcomes.** E12, A7, B8. **Rows.** K3, K4. **Prereqs.** 23. **Words.** 4,200.

---

### Part IV — Making It Real

#### Chapter 25 — Measuring Retrieval: Recall, MRR, and nDCG *(Mechanism, keystone)*

**Blurb.** You cannot tune what you cannot score, and most teams tune retrieval by vibes. This chapter builds the retrieval test set and the five metrics that read it: precision@k, recall@k, hit rate, MRR, and nDCG with graded relevance. You will label a ranked list by dragging relevance grades and watch each metric recompute, learn which metric answers which question, and set up the regression suite that catches an embedding-model swap that quietly lost 6 points of recall.

**Sections.**
1. The problem: "it seems better" and the swap that broke Q1.
2. Building the labelled set: query sampling, pooling, grading, inter-annotator agreement; synthetic queries and their bias.
3. The metrics: precision@k, recall@k, hit rate, MRR, MAP, nDCG; formulas, worked example, which question each answers.
4. Public benchmarks and what they measure: BEIR, MS MARCO, NQ, HotpotQA; why your corpus differs.
5. The regression suite: thresholds, per-query diffs, CI gating.
6. Exercises.

**Machines.**
- `rankMetrics` · Playground · State: a ranked list of 10 results with editable relevance grades (0–3), k · Controls: drag results to reorder; click to set grade; k slider · Output: P@k, R@k, hit, MRR, nDCG@k with the formula terms shown live · Discovery: moving the only relevant result from rank 1 to rank 2 halves MRR and barely touches recall@10 · Initial note: "Drag the relevant result from rank 1 to rank 2. Watch which metrics move."

**Figures.** F25.1 pooling for labels; F25.2 metric formulas as a table (SVG); F25.3 nDCG discount curve; F25.4 regression diff report.

**Outcomes.** E13, O1. **Rows.** L1, L4. **Prereqs.** 16. **Words.** 3,400.

---

#### Chapter 26 — Measuring Answers: Faithfulness, Relevance, and the Judge *(Mechanism, keystone)*

**Blurb.** Retrieval metrics stop at the context window; the answer needs its own scoreboard. This chapter builds it: the RAG triad of context relevance, faithfulness and answer relevance, answer correctness against ground truth, and the four robustness abilities. Because most of these are scored by a language model, you will also learn to distrust the judge: position bias, verbosity bias, self-preference, and how to calibrate it against a hundred human labels before you believe a decimal.

**Sections.**
1. The problem: the string metrics (EM, F1, ROUGE) and why they fail on free-form answers.
2. The triad: context relevance, faithfulness (claim decomposition), answer relevance; answer correctness with TP/FP/FN; RAGAS and ARES implementations.
3. Robustness: noise, negative rejection, information integration, counterfactual; RGB and CRUD benchmarks.
4. The judge: biases, calibration against humans, cost, prompt design, pairwise vs pointwise.
5. Evaluating agents: tool-selection accuracy, trajectory scoring; executable ground truth.
6. Online: feedback, A/B tests, guardrail metrics, drift.
7. Exercises.

**Machines.**
- `ragTriad` · Stepper · State: a Q/context/answer triple, canned judge prompts and verdicts · Controls: step through the three scores; pick one of four answers (good / unfaithful / irrelevant / verbose) · Output: each score with the judge's reasoning, the triad radar · Discovery: the verbose answer scores highest on relevance and lowest on faithfulness · Initial note: "Score the *good* answer. Then load *verbose* and score again."
- `judgeBias` · Tuner · State: a canned experiment of judge verdicts vs human labels under swaps · Controls: toggle position swap, length padding, same-model-as-judge · Output: agreement with humans, win-rate shift · Discovery: swapping answer order changes the winner in 18% of pairs until you average both orders · Initial note: "Toggle *position swap*. Read the agreement line."

**Figures.** F26.1 the triad on the pipeline; F26.2 claim decomposition and verdicts; F26.3 answer-correctness TP/FP/FN; F26.4 judge bias table; F26.5 online evaluation loop.

**Outcomes.** E13, O2. **Rows.** L2, L3, L5, L6, L7. **Prereqs.** 25. **Words.** 3,800.

---

#### Chapter 27 — Latency, Cost, and Caching *(Mechanism, keystone)*

**Blurb.** A RAG request is five network calls and a model, and the model is not always the slow part. You will build the latency budget stage by stage, see where p95 comes from, parallelize what can be parallel, and put caches where they pay: embedding cache, semantic cache with its false-hit risk, prompt cache for the static prefix, result cache with invalidation. Then the bill: tokens per stage, index memory, GPU hours, and the three changes that usually cut cost by half.

**Sections.**
1. The problem: a 4-second p95 nobody can explain.
2. The budget: stage timings, serial vs parallel, tail amplification, timeouts and hedged requests.
3. Caches: embedding, semantic (threshold and false hits), prompt/KV prefix, result; invalidation on re-index.
4. Cost: token accounting, index memory, batch vs online embedding, hosted vs self-hosted, the three big levers.
5. Scaling: sharding and replicas for indexes, throughput, GPU indexing, batching.
6. Serving: the API service, streaming, retries, rate limits, model gateways.
7. Exercises.

**Machines.**
- `latencyBudget` · Tuner · State: stage latency distributions (embed, ANN, rerank, LLM first-token, LLM completion), parallel flags, cache hit rates, QPS · Controls: sliders per stage; parallel toggles; cache hit-rate sliders; "run 1,000 requests" · Output: p50/p95/p99 waterfall, cost per 1,000 requests, cache savings · Discovery: parallelizing embed and keyword search saves p50 but not p95 until the reranker is shrunk; a 30% semantic-cache hit rate cuts cost more than any index change · Initial note: "Run 1,000 requests. Find the stage that owns p95."

**Figures.** F27.1 request waterfall; F27.2 serial vs parallel; F27.3 cache placement map; F27.4 cost breakdown per 1,000 requests; F27.5 sharded index topology.

**Outcomes.** O3, O8, A2 (part). **Rows.** M1, M2, M3, M8, M10, I7 (part). **Prereqs.** 16, 18. **Words.** 3,800.

---

#### Chapter 28 — Security: Access Control, Injection, and Leakage *(Mechanism, keystone)*

**Blurb.** A retrieved document is untrusted input to the model, and the model has tools. That sentence is the whole threat model. You will plant one poisoned paragraph in the Larkspur corpus, watch it hijack an agent into calling a tool, then add the defences one at a time and see which ones actually stop it. You will enforce document-level permissions at query time and prove with a test that a filtered chunk cannot leak, redact PII before it is embedded, and read the provider retention policy you agreed to.

**Sections.**
1. The threat model: three surfaces (ingest, store, generation) plus tools; OWASP LLM Top 10 mapped to the pipeline.
2. Access control: ACL metadata, filter push-down, tenant isolation, the leak tests; why "the model will respect the rule" is not a control.
3. Indirect prompt injection: attack anatomy, exfiltration through links and citations, tool-call abuse; defences (privilege separation, output constraints, allow-lists, human approval, detectors) and their limits.
4. Data protection: PII/PHI redaction vs quality, encryption, provider data retention and residency, on-prem models.
5. Governance: audit trails, content filtering, compliance regimes in one page.
6. Exercises.

**Machines.**
- `injectionSim` · Simulator · State: corpus with one poisoned document, an agent with tools (search, send_email, fetch_url), defence toggles · Controls: pick a user query; toggle defences (tool allow-list, no-tool-from-context rule, output URL filter, approval step, detector); run · Output: the trace showing whether the injected instruction reached a tool call, what leaked, which defence caught it · Discovery: the detector alone misses the paraphrased payload; the allow-list stops the exfiltration regardless · Initial note: "Run with all defences off. Watch the email go out. Then enable one defence at a time."
- `aclFilter` · Inspector · State: chunks with ACL tags, three users, a query · Controls: pick user; toggle "filter in retriever" vs "filter in prompt" · Output: what each user's retrieval returns; the leak test result · Discovery: with the filter in the prompt only, the forbidden chunk is retrieved and merely "asked" not to be used, and the test fails · Initial note: "Select the contractor user. Move the filter into the prompt. Run the leak test."

**Figures.** F28.1 threat surfaces on the pipeline; F28.2 filter push-down vs prompt-level rule; F28.3 injection attack chain; F28.4 defence matrix; F28.5 data flow to a hosted provider.

**Outcomes.** O5, O6. **Rows.** M5, M6, M7. **Prereqs.** 21. **Words.** 3,800.

---

#### Chapter 29 — Running RAG in Production: The RAG Engineer's Handbook *(Practitioner handbook)*

**Blurb.** Everything before this was the mechanism; this is Monday morning. Which traces to record, how to read a span waterfall, the debugging procedure that attributes a bad answer to one of the four failure classes in under ten minutes, how to re-index without downtime, what to check in the first two weeks after launch, and the classic mistakes: one chunk size for every document type, no labelled set, a model swap without a regression run, permissions in the prompt. Every recommendation points back to the chapter that justifies it.

**Sections.**
1. Observability: spans per stage (OpenTelemetry GenAI conventions), logging retrieved context and scores, sampling, PII in logs.
2. The debugging procedure: from a bad answer to a failure class in six checks, with commands and expected output.
3. Change management: model swaps, re-indexing, chunker changes; regression gates; shadow traffic.
4. Launch and after: KPIs, the first two weeks, usage drop-off, feedback loops, on-call for a RAG service.
5. The classic mistakes, each with the chapter that explains why.
6. Exercises.

**Machines.**
- `traceViewer` · Inspector · State: three canned request traces (healthy, slow reranker, empty retrieval) · Controls: pick a trace; hover spans; "diagnose" reveals the failure class · Output: waterfall, span attributes, the six-check verdict · Discovery: the "empty retrieval" trace shows a filter that removed every candidate, invisible in the final answer · Initial note: "Open the third trace. Find the span with zero results."

**Figures.** F29.1 span model; F29.2 the six-check procedure; F29.3 re-index cut-over; F29.4 launch dashboard.

**Outcomes.** O3, O7, A3. **Rows.** M4, M9, D6, B8 (ops), L6. **Prereqs.** 27, 28. **Words.** 3,600.

---

#### Chapter 30 — The Vector Stores: A Field Guide *(Engineering reality)*

**Blurb.** Every vector store makes the same six decisions, and the differences are the decisions. This chapter surveys pgvector, Elasticsearch and OpenSearch, Qdrant, Weaviate, Milvus, Pinecone, Vespa, LanceDB, Chroma, and the libraries underneath (FAISS, hnswlib, Lucene): lineage, index types, filtering strategy, hybrid support, quantization, update and delete behaviour, multi-tenancy, consistency, and the one operational fact each will bite you with. A picker machine takes your workload and ranks them, then a choosing section gives you the procedure, not the feature list.

**Sections.**
1. The six decisions: index, filtering, hybrid, storage tier, updates, tenancy.
2. The stores, one page each on the course's dimensions.
3. The libraries: FAISS, hnswlib, Lucene, USearch; when a library beats a database.
4. Comparison on the dimensions the course taught (SVG table).
5. Choosing: a decision procedure by scale, filter selectivity, update rate, existing stack, and team.
6. Exercises.

**Machines.**
- `storePicker` · Comparator · State: workload sliders (vectors, QPS, filter selectivity, update rate, hybrid needed, multi-tenant, existing Postgres/Elastic, ops team size) · Output: ranked stores with the deciding dimension for each · Discovery: below ~5 M vectors with an existing Postgres, pgvector wins on every profile except heavy multi-tenant filters · Initial note: "Describe your workload. The verdict says which slider decided it."

**Figures.** F30.1 lineage tree; F30.2 the comparison table; F30.3 decision procedure.

**Outcomes.** A2, A5. **Rows.** M12, F7, E7. **Prereqs.** 13, 15. **Words.** 4,000.

---

#### Chapter 31 — Frameworks, Platforms, and Multimodal RAG: A Field Guide *(Engineering reality)*

**Blurb.** LangChain, LlamaIndex, Haystack and DSPy each wrap the stages you now understand; the managed platforms (Bedrock Knowledge Bases, Vertex AI Search, Azure AI Search, Databricks, Vectara) wrap the whole pipeline. This chapter maps every abstraction back to its stage so you can read any of them, decide build vs buy with a procedure, and then goes where text stops: retrieving over images, PDF pages as images (ColPali), audio and video with timestamps, and tables that stay tables.

**Sections.**
1. Frameworks mapped to stages: loaders, splitters, retrievers, postprocessors, synthesizers, agents, evaluation, observability; what each hides and where it churns.
2. Managed platforms: what you get, what you cannot change, the one-throat-to-choke argument and its price.
3. Build vs buy: a decision procedure by data sensitivity, customization, team, and cost.
4. Multimodal RAG: convert-to-text vs native embeddings; CLIP, ColPali, audio and video pipelines; evaluation.
5. Exercises.

**Machines.**
- `frameworkMap` · Inspector · State: the six-stage pipeline with framework class names layered on (LangChain / LlamaIndex / Haystack / DSPy) · Controls: framework tabs; hover a stage · Output: the classes and defaults per stage, links to the chapter that explains the mechanism · Discovery: three frameworks default to a 1,000-character recursive splitter regardless of document type · Initial note: "Pick a framework. Hover *chunk*. Read the default."

**Figures.** F31.1 frameworks on the pipeline; F31.2 build vs buy procedure; F31.3 multimodal pipeline; F31.4 ColPali page-image retrieval.

**Outcomes.** A6, A8 (part). **Rows.** M11, B4, D7, A8, J5 (platform), K4 (framework graph indexes). **Prereqs.** 21, 30. **Words.** 3,400.

---

### Part V — Build It: PocketRAG

**Capstone plan (guide §9).** PocketRAG is a retrieval engine over the Larkspur corpus, written twice with line-for-line intent parity: **Python 3.12** (stdlib + `numpy`, `sqlite3`, one local embedding model via `sentence-transformers`, one local cross-encoder, an LLM client) and **TypeScript on Node 22** (`better-sqlite3`, `@xenova/transformers` for local models, the same LLM client shape). SQLite holds documents, chunks and metadata; the inverted index and HNSW graph are PocketRAG's own code, persisted as files. Postgres + pgvector is the *comparison* system in the benchmark, not a dependency. No hidden helper files: everything appears in the chapters. Each chapter ends with a test the learner runs.

#### Chapter 32 — PocketRAG: The Ingest Pipeline *(Build it)*
**Layer:** loaders (Markdown, HTML, PDF text via a minimal extractor), element-typed cleaning, recursive chunker with token counting, metadata schema, content-hash idempotent upserts into SQLite, delete tombstones. **Design decisions out loud:** recursive chunking at 512 tokens with a 64-token overlap (Chapter 5), no semantic chunking (cost; Chapter 5), SQLite not Postgres (self-contained; Chapter 13 explains what pgvector adds). **Test:** run ingest twice and prove zero new rows; change one document and prove exactly its chunks are replaced. **Machine:** none new; `chunker` referenced. **Figures:** F32.1 PocketRAG layer map; F32.2 schema. **Outcomes:** B1. **Rows:** B1, B5, B8, C2. **Words:** 3,600 (with code).

#### Chapter 33 — PocketRAG: The Inverted Index and BM25 *(Build it)*
**Layer:** tokenizer with stemming (Porter, written out) and stopwords, dictionary and postings in SQLite tables, BM25 with k1 and b, top-k with a heap, phrase queries. **Decisions:** no postings compression and no WAND (Chapter 9 explains both; graduation project). **Test:** scores match `rank_bm25` on 50 queries to 1e-6; Q1 returns the cello page at rank 1. **Outcomes:** B2. **Rows:** E1, E2, E6. **Words:** 3,800.

#### Chapter 34 — PocketRAG: HNSW From Scratch *(Build it)*
**Layer:** embedding with a local model, the HNSW graph (levels, M, ef_construction, heuristic neighbour selection, greedy search, persistence), brute-force ground truth. **Decisions:** float32 in memory, no quantization, no deletes beyond tombstones (Chapters 7, 11, 12 hold the real machinery). **Test:** recall@10 ≥ 0.95 vs brute force at ef=64 on 20 k chunks; a recall-vs-ef curve printed; a fuzzer inserting random points and checking recall never drops below 0.9. **Outcomes:** B3, E5. **Rows:** F2, F1. **Words:** 4,600.

#### Chapter 35 — PocketRAG: Hybrid, Rerank, and Cited Answers *(Build it)*
**Layer:** RRF fusion of BM25 and HNSW lists, a cross-encoder rerank cascade (k1=50 → k2=8), metadata filter push-down with the post-filter fallback, query rewriting (multi-query), context packing (ends-first), the grounded prompt with numbered citations, refusal on low support, citation verification. **Decisions:** RRF not learned weights (Chapter 15); one rewrite strategy (Chapter 14); a refusal threshold from the reranker score (Chapter 18). **Test:** Q1–Q4 answered with citations that resolve to chunks containing the claim; Q5 refused; a filter leak test passes. **Outcomes:** B4, B5, O5. **Rows:** G2, G3, H1, G7, I1, I3, M5. **Words:** 4,400.

#### Chapter 36 — PocketRAG: Evaluation, the Honest Benchmark, Agents, Graphs, and Graduation *(Build it)*
**Layer 1, evaluation:** a 120-query labelled set for Larkspur, recall/MRR/nDCG harness, RAGAS-style faithfulness with an LLM judge, a regression runner. **Layer 2, benchmark:** the same corpus in pgvector (HNSW) and one hosted store; recall@10, p50/p95, memory, cost, indexing time, with conditions stated; explain every gap with the mechanism. **Layer 3, agent:** tool schemas for keyword, vector, SQL over the fares/tickets tables, a router, a critic, a step budget; Q3 and Q4 answered. **Layer 4, graph:** entity extraction over the six post-mortems into SQLite tables, Leiden via a small library, community reports, a global-search map-reduce; Q4 answered a second way. **Confession table:** every simplification with the chapter that holds the real machinery, ending "this is early, not wrong". **Graduation:** three weekend projects (postings compression + WAND; product quantization with rescoring; a filtered-HNSW variant with ACORN-style edges). **Tests:** the harness reproduces the benchmark table within stated variance; the agent answers Q3 within 6 steps; the graph answers Q4. **Outcomes:** B6, B7, B8, O1, O2. **Rows:** L1, L2, J3, J7, K2, K3, M12. **Words:** 5,000.

---

## 3. Free chapters

**Chapters 1, 5, and 11.** Chapter 1 shows the orientation machine and the voice; Chapter 5 (chunking) carries two machines a visitor can play with in a minute and is the topic every practitioner has an opinion about; Chapter 11 (HNSW) is the course's showpiece simulator and the topic most often asked in interviews. Together they show three machines of three kinds (inspector, playground, simulator) and span all three parts a buyer cares about. The marketing plan's pattern for Databases in Depth (1, 5, 8) is matched in spirit. Numbering is frozen on approval, so these keys (`ragAnatomy`, `chunker`, `chunkSizeCurve`, `hnswSearch`) are implemented first in Phase 5.

---

## 4. Reading map (by part; every paper, spec and doc the chapters will name)

**Part I.** Lewis et al. 2020 (RAG); Karpukhin et al. 2020 (DPR); Borgeaud et al. 2022 (RETRO); Ram et al. 2023 (in-context RALM); Izacard et al. 2022 (Atlas); Ovadia et al. 2023 and Tian et al. 2023 (fine-tuning for facts); Kandpal et al. 2023 (long-tail knowledge); Gao et al. 2024 (the survey, arXiv 2312.10997); Khattab et al. 2022 (DSP) and the DSPy docs; Vaswani et al. 2017; provider pricing and context tables (dated).

**Part II.** Chen et al. 2023 (Dense X, propositions); Sarthi et al. 2024 (RAPTOR); Günther et al. 2024 (late chunking); Reimers & Gurevych 2019 (Sentence-BERT); Wang et al. 2022 (E5); Xiao et al. 2023 (BGE); Kusupati et al. 2022 (Matryoshka); Muennighoff et al. 2022 (MTEB); Ethayarajh 2019 (anisotropy); Dai et al. 2022 (Promptagator); Robertson & Zaragoza 2009 (BM25); Manning, Raghavan & Schütze 2008 (IIR ch 1–7, 11); Broder et al. 2003 (WAND); Ding & Suel 2011 (block-max); Formal et al. 2021 (SPLADE); Elastic ELSER docs; Malkov & Yashunin 2016 (HNSW); Malkov et al. 2014 (NSW); Jégou et al. 2011 (PQ); Ge et al. 2013 (OPQ); Subramanya et al. 2019 (DiskANN); Guo et al. 2020 (ScaNN); Indyk & Motwani 1998 (LSH); ann-benchmarks (Aumüller et al. 2020); Patel et al. 2024 (ACORN); pgvector README and source; Qdrant, Weaviate, Milvus, Elasticsearch kNN docs; FAISS wiki.

**Part III.** Gao et al. 2022 (HyDE); Zheng et al. 2023 (step-back); Ma et al. 2023 (Rewrite-Retrieve-Read); Zhou et al. 2022 (least-to-most); Dhuliawala et al. 2023 (CoVe); Kim et al. 2023 (Tree of Clarifications); Cormack, Clarke & Büttcher 2009 (RRF); Nogueira & Cho 2019 (BERT reranker); Nogueira et al. 2020 (monoT5); Khattab & Zaharia 2020 (ColBERT); Santhanam et al. 2022 (ColBERTv2, PLAID); Burges 2010 (LambdaMART); Carbonell & Goldstein 1998 (MMR); Liu et al. 2023 (lost in the middle); Jiang et al. 2023 (LongLLMLingua); Xu et al. 2023 (RECOMP); Cuconasu et al. 2024 (power of noise); Yoran et al. 2023; Yu et al. 2023 (Chain-of-Note); Es et al. 2023 (RAGAS faithfulness); Vectara HHEM model card; Zha et al. 2023 (AlignScore); Zhang et al. 2024 (RAFT); Lin et al. 2023 (RA-DIT); Packer et al. 2023 (MemGPT); Shao et al. 2023 (ITER-RETGEN); Trivedi et al. 2022 (IRCoT); Jiang et al. 2023 (FLARE); Asai et al. 2023 (Self-RAG); Yan et al. 2024 (CRAG); Wang et al. 2023 (SKR); Yao et al. 2023 (ReAct); Schick et al. 2023 (Toolformer); Nakano et al. 2021 (WebGPT); the Model Context Protocol specification; OpenAI and Anthropic tool-use docs; Neo4j text2cypher docs and datasets; Spider/BIRD text-to-SQL benchmarks; Hendrycks et al. 2021 (CUAD); Edge et al. 2024 (GraphRAG) and the Microsoft GraphRAG repository; Blondel et al. 2008 (Louvain); Traag et al. 2019 (Leiden); Gutiérrez et al. 2024 (HippoRAG); Wang et al. 2023 (KGP); He et al. 2024 (G-Retriever); the ISO GQL standard overview.

**Part IV.** IIR ch 8 (evaluation); Järvelin & Kekäläinen 2002 (nDCG); Thakur et al. 2021 (BEIR); Nguyen et al. 2016 (MS MARCO); Kwiatkowski et al. 2019 (NQ); Yang et al. 2018 (HotpotQA); Es et al. 2023 (RAGAS); Saad-Falcon et al. 2023 (ARES); TruLens RAG triad docs; Chen et al. 2023 (RGB); Lyu et al. 2024 (CRUD-RAG); Zheng et al. 2023 (LLM-as-a-judge, MT-Bench); Dean & Barroso 2013 (tail at scale); provider prompt-caching docs; GPTCache docs; OpenTelemetry GenAI semantic conventions; OWASP Top 10 for LLM Applications; Greshake et al. 2023 (indirect prompt injection); provider data-retention and residency docs; Mendelevitch & Bao 2025 (production challenges, S1); vendor docs for each store in Chapter 30 and each framework and platform in Chapter 31; Radford et al. 2021 (CLIP); Faysse et al. 2024 (ColPali).

**Part V.** `rank_bm25` and Lucene BM25 source (reference scores); hnswlib source (reference behaviour); pgvector docs; `sentence-transformers` and `transformers.js` docs; the Leiden library used (python-igraph / graphology); SQLite docs.

---

## 5. Coverage check (Topic Universe rows → chapters)

| Row | Chapter(s) | Row | Chapter(s) | Row | Chapter(s) |
|---|---|---|---|---|---|
| A1 | 2 | A2 | 1, 2 | A3 | 2 |
| A4 | 2 | A5 | 3 | A6 | 1 |
| A7 | 2 | A8 | 3, 31 | B1 | 4, 32 |
| B2 | 4 | B3 | 4 | B4 | 31 |
| B5 | 4, 13, 32 | B6 | 4 | B7 | 4 |
| B8 | 4, 29, 32 | B9 | 4, 22 | C1 | 5 |
| C2 | 5, 32 | C3 | 5 | C4 | 6 |
| C5 | 6 | C6 | 5, 17 | C7 | 5, 6 |
| D1 | 7 | D2 | 8 | D3 | 8 |
| D4 | 7 | D5 | 8 | D6 | 8, 29 |
| D7 | 31 | D8 | 7 | E1 | 9, 33 |
| E2 | 9, 33 | E3 | 9 | E4 | 9 |
| E5 | 9, 14 | E6 | 9, 33 | E7 | 9, 15, 30 |
| F1 | 10, 34 | F2 | 11, 34 | F3 | 12 |
| F4 | 12 | F5 | 13 | F6 | 10 |
| F7 | 13, 30 | F8 | 13 | G1 | 15 |
| G2 | 15, 35 | G3 | 16, 35 | G4 | 16 |
| G5 | 16 | G6 | 16 | G7 | 17, 35 |
| G8 | 17 | H1 | 14, 35 | H2 | 14 |
| H3 | 19 | H4 | 14 | H5 | 14, 22 |
| H6 | 14 | I1 | 18, 35 | I2 | 18 |
| I3 | 18, 35 | I4 | 18 | I5 | 18 |
| I6 | 18 | I7 | 17, 27 | J1 | 20 |
| J2 | 20 | J3 | 21, 36 | J4 | 19 |
| J5 | 21, 31 | J6 | 21 | J7 | 22, 36 |
| K1 | 22, 23 | K2 | 23, 36 | K3 | 24, 36 |
| K4 | 23, 24, 31 | K5 | 23 | L1 | 25, 36 |
| L2 | 26, 36 | L3 | 26 | L4 | 25 |
| L5 | 26 | L6 | 26, 29 | L7 | 21, 26 |
| M1 | 27 | M2 | 27 | M3 | 27 |
| M4 | 29 | M5 | 28, 35 | M6 | 28 |
| M7 | 28 | M8 | 27 | M9 | 1, 29 |
| M10 | 27 | M11 | 31 | M12 | 30, 36 |
| N6 | 10 | N7 | 13 | N8 | 13 |
| N11 | 20 | | | | |

**Orphan list (core, supporting, mentioned rows with no chapter): empty.**

Charter outcomes → chapters: E1 (2, 18), E2 (7, 8), E3 (7), E4 (9), E5 (11, 34), E6 (12), E7 (16), E8 (15), E9 (5, 6), E10 (14), E11 (17), E12 (23, 24), E13 (25, 26), E14 (3, 20); A1 (5), A2 (10–12, 27, 30), A3 (1, 20, 21, 29), A4 (15), A5 (13, 30), A6 (2, 31), A7 (22–24), A8 (2, 3, 31); O1 (8, 25, 36), O2 (18, 26, 36), O3 (27, 29), O4 (10, 13), O5 (28, 35), O6 (28), O7 (4, 8, 29), O8 (17, 27), O9 (19); B1 (4, 6, 32), B2 (9, 33), B3 (11, 13, 34), B4 (15, 16, 35), B5 (18, 35), B6 (36), B7 (21, 22, 36), B8 (23, 24, 36). **No unmapped outcome.**

---

## 6. Shape check against §2 and §11

| Element | Target | Blueprint |
|---|---|---|
| Parts | 4–6 | 5 |
| Chapters | 24–36 | 36 |
| Sections per chapter | 4–8 | 5–8 |
| Words, mechanism chapters | 1,800–3,500 (keystone to 5,000) | 2,200–4,800 |
| Machines | ≥ 1 per chapter avg; keystone 2–3 | 42 across 36 chapters (capstone reuses earlier ones) |
| Figures | ≥ 1 per chapter, 2–4 mechanism | ~95 |
| Free chapters | 3, showing ≥ 2 machines | 1, 5, 11: four machines |
| Capstone | 5–8 chapters, two languages | 6 chapters, Python + TypeScript |
| Archetypes | all five present | Orientation (1), Mechanism (2–28), Engineering reality (30, 31), Practitioner handbook (29, and 13 in part), Build it (32–36) |

**Gate:** owner approves the Blueprint. On approval, chapter numbers 1–36 and machine keys are frozen, and Phase 4 begins with Chapter 1.
