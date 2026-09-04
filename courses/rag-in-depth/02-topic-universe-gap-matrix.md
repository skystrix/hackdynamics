# RAG In Depth — Phase 2 Deliverable: Topic Universe and Gap Matrix

**Status:** Phase 2 complete, awaiting owner approval of the decision column.
**Date:** 2026-09-03. Charter (Phase 1) approved 2026-09-03.

---

## 1. Inputs merged (all fetched 2026-09-03 unless noted)

| Code | Input | What it contributed |
|---|---|---|
| **B** | Provided books + survey, via the Source Map (S1–S4) | Baseline topic list and depth |
| **U1** | Stanford **CS276** Information Retrieval and Web Search (course page, lecture list) | Inverted indexes, index construction and compression, spelling correction, vector space model, BM25/BM25F, evaluation and nDCG, efficient scoring, classification/clustering, word representations for IR, learning to rank, link analysis, crawling, QA, personalization |
| **U2** | Stanford **CS224N** NLP with Deep Learning (Winter 2026 schedule) | Word vectors, transformers, pretraining, post-training, prompting/PEFT, **Agents, Tool Use, and RAG** lecture, benchmarking and evaluation, reasoning, multimodality |
| **U3** | UC Berkeley **CS294-196 Large Language Model Agents** (Fall 2024 MOOC syllabus) | LLM reasoning, agent history, agent frameworks, multimodal knowledge assistant (LlamaIndex), compound AI systems and DSPy, software agents, enterprise workflows, agent evaluation, safety |
| **T1** | Manning, Raghavan & Schütze, *Introduction to Information Retrieval* (2008), TOC | Chapters 1–9, 11–12, 18–21: the classical IR spine |
| **T2** | Jurafsky & Martin, *Speech and Language Processing* 3rd ed. draft, TOC | Ch 5 Embeddings; **Ch 11 Information Retrieval and RAG**; Ch 12 Agents (unwritten); Ch 21 Information Extraction; Ch 24 Entity Linking |
| **T3** | Chip Huyen, *AI Engineering* (O'Reilly 2025) — **TOC from memory; fetch returned 403; verify at Phase 4** | Evaluation methodology, prompt engineering, RAG and agents chapter (retrieval algorithms, term-based vs embedding-based, hybrid, query rewriting, agents, memory), finetuning, dataset engineering, inference optimization, architecture and user feedback |
| **C1** | Databricks Certified Generative AI Engineer Associate exam domains (2026) | Design (prompting, multi-stage pipelines, model selection); data preparation (chunking, document storage); application development (chaining, RAG); deployment; governance; evaluation and monitoring; vector search; agent framework; MCP tool servers; AI gateway |
| **C2** | Job-description scans for "RAG engineer / AI engineer" (2026) | Owns embeddings, index tuning, retrieval evaluation with a labelled set, prompt orchestration, guardrails, latency budgets, the API service; hybrid BM25 + vector as the default stack; comparing two embedding models on own corpus |
| **I1** | Analytics Vidhya "40 RAG interview questions" (Feb 2026), topics only | Sparse/dense/hybrid, BM25 scenarios, chunk size, retrieval and answer metrics, reranking, when agentic RAG is wrong, multi-turn, latency, ambiguous queries, contradictory documents, KB versioning, retrieval vs generation failure attribution, privacy, long documents, monitoring, citations, multilingual |
| **I2** | gitgood.dev "Complete guide to RAG interview questions 2026", topics only | Naive RAG limits, code vs prose chunking, Matryoshka embeddings, embedding drift and model updates, HNSW/IVF/PQ/flat, metadata filtering, scaling, RRF-style merging, cross-encoders, contextual retrieval, multi-hop, Self-RAG, Corrective RAG, GraphRAG vs vector, evaluation datasets, cost, LLM-as-judge pitfalls, long-context vs RAG, "default production stack" |
| **D1** | pgvector README | HNSW (`m` 16, `ef_construction` 64, `hnsw.ef_search` 40, iterative scans, `max_scan_tuples` 20,000), IVFFlat (`lists`, `probes` 1), filtering, multitenancy, halfvec/bit/sparsevec types, binary quantization, hybrid search, subvector indexing, performance, scaling, monitoring |
| **D2** | Qdrant docs, Indexing | Payload indexes (keyword, integer, float, bool, geo, datetime, text, uuid), tenant and principal indexes, full-text tokenizers/stemming/stopwords/phrase, HNSW (`m` 16, `ef_construct` 100, `full_scan_threshold`), **filterable HNSW and the ACORN algorithm**, sparse vector index, quantization (separate page) |
| **D3** | Elastic docs, Vector search | dense_vector / sparse_vector / semantic_text fields, retrievers for combining strategies, ES|QL, storage optimization and quantization, index modes, embedding models, chunking, multimodal search, kNN, bring-your-own vectors, GPU indexing, ELSER sparse retrieval, hybrid search |
| **D4** | LlamaIndex module guides | Models (LLMs, embeddings, multimodal, prompts); loading (documents/nodes, connectors, node parsers, ingestion pipeline); indexing (vector store index, property graph index); storing (vector, document, index, chat, KV stores); querying (query engines, chat engines, retrieval, response synthesis, node postprocessors, routers, structured outputs); agents (memory, tools); workflows; evaluation (LlamaDatasets); observability (instrumentation, callbacks) |

Coverage of the required minimum: books ✓, three syllabi ✓, two textbooks ✓ (plus T3 unverified), certification + JD ✓, two interview banks ✓, docs of three or more systems ✓.

---

## 2. Topic Universe and Gap Matrix

Columns: **B** books/survey, **U** syllabi, **T** textbooks, **C** cert/JD, **I** interview banks, **D** system docs. ✓ = covered or examined; · = not present.
Decision: **core** (full §5.2 treatment to §5.3 rung 9), **supporting** (a section or callout), **mentioned** (one paragraph with a pointer), **out** (reason given). Rows marked ★ are keystone (examined by both a university final and a senior interview).

### A. Why RAG: LLM limits and the design space

| # | Topic | B | U | T | C | I | D | Decision |
|---|---|---|---|---|---|---|---|---|
| A1 ★ | Parametric vs non-parametric knowledge; cutoff, staleness, private data, hallucination as next-token prediction | ✓ | ✓ | ✓ | ✓ | ✓ | · | core |
| A2 | Transformer only as far as needed: context window, attention cost O(n²), tokens | ✓ | ✓ | ✓ | · | ✓ | · | supporting |
| A3 ★ | RAG vs fine-tuning vs prompting vs long context: the decision procedure | ✓ | ✓ | ✓ | ✓ | ✓ | · | core |
| A4 | LLM training stages (pretrain, SFT, RM, RL) as background for "why fine-tuning does not add facts" | ✓ | ✓ | ✓ | · | · | · | mentioned |
| A5 | History and paradigms: Lewis 2020, RETRO, in-context RALM, naive → advanced → modular | ✓ | · | ✓ | · | ✓ | · | supporting |
| A6 | The anatomy: ingest flow vs query flow; the six stages and what can fail at each | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | core (orientation chapter) |
| A7 | Enterprise use cases and the access-control argument | ✓ | · | · | ✓ | ✓ | · | supporting |
| A8 | Compound AI systems view (DSPy, pipelines as programs) | · | ✓ | · | ✓ | · | ✓ | mentioned |

### B. Ingestion and document understanding

| # | Topic | B | U | T | C | I | D | Decision |
|---|---|---|---|---|---|---|---|---|
| B1 | Loaders for PDF, DOCX, HTML, Markdown, code; element-typed partitioning | ✓ | · | · | ✓ | ✓ | ✓ | core |
| B2 | PDF is hard: layout, columns, headers/footers, scanned pages, OCR vs VLM | ✓ | · | · | ✓ | · | · | supporting |
| B3 | Tables: row-to-text, table-in-prompt, text-to-SQL, summary + raw injection | ✓ | · | · | ✓ | · | · | supporting |
| B4 | Images, audio, video → text; when to embed natively (CLIP / ColPali) | ✓ | ✓ | · | · | · | ✓ | supporting (multimodal chapter) |
| B5 | Metadata: extracted, derived, LLM-generated; schema design for filters | ✓ | · | · | ✓ | ✓ | ✓ | core |
| B6 | Cleaning: boilerplate removal, abbreviation expansion, self-contained chunks, contextual chunk headers ("contextual retrieval") | ✓ | · | · | · | ✓ | · | supporting |
| B7 | Deduplication and near-duplicate detection (shingling, MinHash) | · | ✓ | ✓ | · | · | · | supporting |
| B8 | Ingestion as a pipeline: idempotent upserts, versioning, deletes, incremental re-index, freshness | ✓ | · | · | ✓ | ✓ | ✓ | core |
| B9 | Structured data: SQL tables and knowledge graphs as sources | ✓ | · | · | ✓ | · | ✓ | supporting |
| B10 | Web crawling, robots, politeness | · | ✓ | ✓ | · | · | · | out: web-search engineering, outside the subject; one pointer to IIR ch 20 |

### C. Chunking and index structure

| # | Topic | B | U | T | C | I | D | Decision |
|---|---|---|---|---|---|---|---|---|
| C1 ★ | Why chunk: embedding dilution, context limits, retrieval granularity ladder (token → proposition → chunk → document) | ✓ | · | ✓ | ✓ | ✓ | ✓ | core |
| C2 ★ | Fixed, recursive, document-aware, semantic, proposition (agentic) chunking; size and overlap as tunables; the experiment | ✓ | · | · | ✓ | ✓ | ✓ | core |
| C3 | Code vs prose chunking; Markdown/HTML/LaTeX splitters | ✓ | · | · | · | ✓ | ✓ | supporting |
| C4 | Parent-document / small-to-big; sentence-window; hierarchical index; RAPTOR summary trees | ✓ | · | · | · | ✓ | ✓ | core |
| C5 | Hypothetical questions (Reverse HyDE); document summaries as index entries | ✓ | · | · | · | ✓ | ✓ | supporting |
| C6 | Token counting and budgets; tokenizer differences across models | ✓ | ✓ | ✓ | · | · | · | supporting |
| C7 | Late chunking and long-context embedding models | · | · | · | · | ✓ | ✓ | mentioned |

### D. Embeddings

| # | Topic | B | U | T | C | I | D | Decision |
|---|---|---|---|---|---|---|---|---|
| D1 ★ | What an embedding is; from word vectors to sentence embeddings; the geometry (norm, cosine, dot, L2) and when they differ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | core |
| D2 ★ | How embedding models are trained: bi-encoder, contrastive loss, in-batch and hard negatives, instruction prefixes (DPR, Sentence-BERT, E5, BGE) | · | ✓ | ✓ | · | ✓ | · | core |
| D3 | Choosing a model: MTEB and its limits, domain, language, dimension, cost, context length; evaluating two models on your own labelled set | ✓ | · | · | ✓ | ✓ | ✓ | core |
| D4 | Dimension reduction and Matryoshka embeddings; scalar, binary and product quantization of vectors; halfvec | · | · | · | · | ✓ | ✓ | supporting |
| D5 | Fine-tuning an embedding model on domain pairs; synthetic query generation (Promptagator); when it pays; the re-index cost | ✓ | ✓ | · | · | ✓ | · | supporting |
| D6 | Embedding drift and model upgrades: dual-write, backfill, cut-over | ✓ | · | · | ✓ | ✓ | · | core (operate) |
| D7 | Multimodal embeddings (CLIP, ColPali) | ✓ | ✓ | · | · | · | ✓ | supporting |
| D8 | Anisotropy, hubness and why cosine on raw transformer outputs misbehaves | · | · | ✓ | · | · | · | mentioned |

### E. Lexical retrieval

| # | Topic | B | U | T | C | I | D | Decision |
|---|---|---|---|---|---|---|---|---|
| E1 ★ | Inverted index: dictionary, postings, tokenization, stemming, stopwords; index construction | ✓ | ✓ | ✓ | · | ✓ | ✓ | core |
| E2 ★ | TF-IDF, vector space model, BM25 (k1, b, saturation, length normalization), BM25F | · | ✓ | ✓ | · | ✓ | ✓ | core |
| E3 | Postings compression and top-k evaluation (WAND, block-max) | · | ✓ | ✓ | · | · | · | supporting |
| E4 | Learned sparse retrieval (SPLADE, ELSER) | · | · | · | · | · | ✓ | supporting |
| E5 | Query expansion, relevance feedback, spelling correction | · | ✓ | ✓ | · | ✓ | · | supporting |
| E6 | Phrase, prefix and fuzzy matching; tokenizers for CJK and multilingual | ✓ | ✓ | ✓ | · | ✓ | ✓ | supporting |
| E7 | Postgres full-text search vs Lucene/Elasticsearch vs Tantivy: what each implements | ✓ | · | · | · | ✓ | ✓ | supporting (field guide) |

### F. Vector indexes and approximate nearest neighbour search

| # | Topic | B | U | T | C | I | D | Decision |
|---|---|---|---|---|---|---|---|---|
| F1 ★ | Exact k-NN and why it does not scale; the recall/latency/memory triangle; ann-benchmarks | ✓ | · | · | ✓ | ✓ | ✓ | core |
| F2 ★ | HNSW: navigable small worlds, layers, greedy search, `M`, `ef_construction`, `ef_search`, insert and delete behaviour | · | · | · | · | ✓ | ✓ | core |
| F3 ★ | IVF and product quantization: coarse quantizer, `nlist`/`nprobe`, sub-vector codebooks, asymmetric distance; IVFFlat vs IVFPQ | · | · | · | · | ✓ | ✓ | core |
| F4 | Disk-resident graphs (DiskANN/Vamana) and GPU indexing; ScaNN | · | · | · | · | · | ✓ | supporting |
| F5 ★ | Filtered ANN: pre-filter, post-filter, filterable HNSW, ACORN; the selectivity cliff | · | · | · | · | ✓ | ✓ | core |
| F6 | Locality-sensitive hashing as the historical alternative | · | ✓ | ✓ | · | · | · | mentioned |
| F7 | Vector database internals: segments, WAL, compaction, replication, sharding, multitenancy, payload indexes | ✓ | · | · | ✓ | ✓ | ✓ | supporting (field guide) |
| F8 | pgvector in depth: types, operators, HNSW/IVFFlat parameters, iterative scans, `EXPLAIN` on a vector query | ✓ | · | · | · | ✓ | ✓ | core (operate) |

### G. Hybrid retrieval, reranking and context curation

| # | Topic | B | U | T | C | I | D | Decision |
|---|---|---|---|---|---|---|---|---|
| G1 ★ | Sparse vs dense: complementary failure modes (rare terms, IDs, paraphrase) | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | core |
| G2 ★ | Fusion: Reciprocal Rank Fusion, score normalization, convex combination; why RRF is scale-free | ✓ | · | · | · | ✓ | ✓ | core |
| G3 ★ | Cross-encoder rerankers: architecture, cost, cascade design (retrieve 100, rerank to 10) | ✓ | ✓ | ✓ | · | ✓ | ✓ | core |
| G4 | Late interaction (ColBERT, PLAID) and multi-vector retrieval | · | · | ✓ | · | · | ✓ | supporting |
| G5 | Learning to rank: pointwise/pairwise/listwise; where LLM rerankers fit | · | ✓ | ✓ | · | · | · | supporting |
| G6 | Diversity (MMR), deduplication of results, time-decay weighting | ✓ | · | · | · | ✓ | ✓ | supporting |
| G7 ★ | Context window assembly: ordering, "lost in the middle", compression (LLMLingua, RECOMP), token budgets | ✓ | ✓ | · | ✓ | ✓ | ✓ | core |
| G8 | Contradictory and noisy documents; the "power of noise" result; robustness abilities | ✓ | · | · | · | ✓ | · | supporting |

### H. Query understanding and routing

| # | Topic | B | U | T | C | I | D | Decision |
|---|---|---|---|---|---|---|---|---|
| H1 ★ | The query–document gap; rewriting: HyDE, step-back, multi-query, sub-queries (least-to-most), RRR | ✓ | · | ✓ | ✓ | ✓ | ✓ | core |
| H2 | Query routing: metadata, semantic router, LLM classifier; index selection | ✓ | · | · | ✓ | ✓ | ✓ | supporting |
| H3 ★ | Multi-turn: condensing follow-ups with history, memory stores, bounding context | ✓ | · | · | ✓ | ✓ | ✓ | core |
| H4 | Ambiguity and clarification (Tree of Clarifications); when to ask back | ✓ | · | · | · | ✓ | · | supporting |
| H5 | Entity and value mapping from user text to database values | ✓ | · | ✓ | · | · | · | supporting |
| H6 | Multilingual and cross-lingual retrieval | ✓ | ✓ | · | · | ✓ | ✓ | supporting |

### I. Generation and grounding

| # | Topic | B | U | T | C | I | D | Decision |
|---|---|---|---|---|---|---|---|---|
| I1 ★ | The grounded prompt: system/user roles, instruction to refuse, citation format, few-shot; structured outputs | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | core |
| I2 ★ | Hallucination with perfect retrieval: the faithfulness spectrum; NLI-style detectors; abstention | ✓ | ✓ | · | ✓ | ✓ | · | core |
| I3 | Citation mechanics: span attribution, inline markers, verifying citations post-hoc | ✓ | · | · | · | ✓ | · | supporting |
| I4 | Model choice for generation: size, context, cost, latency; local vs hosted | ✓ | ✓ | · | ✓ | ✓ | ✓ | supporting |
| I5 | Fine-tuning the generator for RAG (RAFT, RA-DIT); distillation | ✓ | ✓ | · | · | ✓ | · | mentioned |
| I6 | Streaming, response synthesis modes (refine, tree-summarize, map-reduce) | ✓ | · | · | · | · | ✓ | supporting |
| I7 | Prompt caching and KV-cache reuse for the static prefix | · | · | · | ✓ | ✓ | · | supporting |

### J. Adaptive, iterative and agentic RAG

| # | Topic | B | U | T | C | I | D | Decision |
|---|---|---|---|---|---|---|---|---|
| J1 ★ | Iterative and recursive retrieval: ITER-RETGEN, IRCoT, multi-hop questions | ✓ | ✓ | ✓ | · | ✓ | · | core |
| J2 ★ | Adaptive retrieval: FLARE, Self-RAG reflection tokens, CRAG retrieval evaluator, SKR | ✓ | · | · | · | ✓ | · | core |
| J3 ★ | Tool calling, ReAct, retriever router, answer critic, step budgets; retrieval as a tool in an agent loop | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | core |
| J4 | Agent memory (short and long term), MemGPT-style paging | ✓ | ✓ | ✓ | · | · | ✓ | supporting |
| J5 | Multi-agent and workflow orchestration; MCP-style tool protocols | · | ✓ | · | ✓ | · | ✓ | mentioned |
| J6 | When agentic RAG is the wrong answer: cost, latency, control | ✓ | · | · | · | ✓ | · | supporting |
| J7 | Text-to-SQL and text-to-Cypher as retrievers; schema in the prompt; few-shot; failure modes | ✓ | · | · | ✓ | ✓ | ✓ | core |

### K. Knowledge graphs and GraphRAG

| # | Topic | B | U | T | C | I | D | Decision |
|---|---|---|---|---|---|---|---|---|
| K1 | Property graphs, Cypher/GQL basics; when a graph beats chunks (aggregation, boundaries, multi-hop) | ✓ | · | · | · | ✓ | ✓ | core |
| K2 ★ | LLM-based information extraction to a graph: schema design, structured outputs, entity resolution, idempotent import | ✓ | · | ✓ | · | ✓ | ✓ | core |
| K3 ★ | Microsoft GraphRAG: extraction, summarization, Leiden communities, community reports, global (map-reduce) and local search; indexing cost | ✓ | · | · | · | ✓ | · | core |
| K4 | Other KG-RAG (KGP, G-Retriever, RoG, HippoRAG) and property-graph indexes in frameworks | ✓ | · | · | · | · | ✓ | mentioned |
| K5 | Entity linking to a KG from text (SLP3 ch 24) | · | · | ✓ | · | · | · | supporting |

### L. Evaluation

| # | Topic | B | U | T | C | I | D | Decision |
|---|---|---|---|---|---|---|---|---|
| L1 ★ | Retrieval metrics: precision@k, recall@k, hit rate, MRR, MAP, nDCG; building a labelled set; pooling | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | core |
| L2 ★ | Generation metrics: EM/F1, ROUGE/BLEU and why they fail for RAG; LLM-judged faithfulness, answer relevance, correctness (RAGAS/ARES triad) | ✓ | ✓ | · | ✓ | ✓ | ✓ | core |
| L3 ★ | LLM-as-judge: biases (position, verbosity, self-preference), calibration against humans, cost | ✓ | ✓ | · | ✓ | ✓ | · | core |
| L4 | Synthetic test-set generation; executable ground truth; regression suites; benchmark datasets (BEIR, MS MARCO, NQ, HotpotQA, RGB, CRUD) | ✓ | ✓ | · | ✓ | ✓ | ✓ | core |
| L5 | Robustness abilities: noise, negative rejection, integration, counterfactual | ✓ | · | · | · | ✓ | · | supporting |
| L6 | Online evaluation: user feedback, A/B tests, guardrail metrics, drift | ✓ | · | · | ✓ | ✓ | ✓ | supporting |
| L7 | Evaluating agents and tool selection | ✓ | ✓ | · | ✓ | ✓ | ✓ | supporting |

### M. Production: performance, cost, security, operations

| # | Topic | B | U | T | C | I | D | Decision |
|---|---|---|---|---|---|---|---|---|
| M1 ★ | Latency budget per stage; p50/p95/p99; parallelism; what dominates (embedding call, ANN, rerank, LLM) | ✓ | · | · | ✓ | ✓ | ✓ | core |
| M2 | Caching: embedding cache, semantic cache, prompt cache, result cache; invalidation | ✓ | · | · | ✓ | ✓ | · | core |
| M3 | Cost model: tokens per stage, index memory, GPU vs CPU, hosted vs self-hosted | ✓ | · | · | ✓ | ✓ | · | core |
| M4 ★ | Observability: tracing spans per stage (OpenTelemetry GenAI conventions), logging retrieved context, feedback loops | ✓ | · | · | ✓ | ✓ | ✓ | core |
| M5 ★ | Security: document-level ACL at query time, tenant isolation, PII redaction, data retention with providers, encryption | ✓ | · | · | ✓ | ✓ | ✓ | core |
| M6 ★ | Prompt injection via retrieved content (indirect injection), exfiltration through citations/links, tool-call abuse; OWASP LLM Top 10 | ✓ | ✓ | · | ✓ | ✓ | · | core |
| M7 | Governance: audit trails, content filtering, compliance regimes | ✓ | · | · | ✓ | ✓ | · | supporting |
| M8 | Scaling: sharding and replication of indexes, throughput, batching embedding jobs, GPU indexing | ✓ | · | · | ✓ | ✓ | ✓ | supporting |
| M9 | The four failure classes and a debugging procedure; POC-to-production checklist; usage drop-off as a signal | ✓ | · | · | ✓ | ✓ | · | core (handbook) |
| M10 | Serving: the API service, streaming, timeouts, retries, rate limits, model gateways | · | · | · | ✓ | ✓ | · | supporting |
| M11 | Frameworks and platforms as a field guide: LangChain, LlamaIndex, Haystack, DSPy, managed RAG (Bedrock KBs, Vertex, Azure AI Search, Databricks, Vectara) | ✓ | ✓ | · | ✓ | ✓ | ✓ | supporting (field guide) |
| M12 | Vector store field guide: pgvector, Elasticsearch/OpenSearch, Qdrant, Weaviate, Milvus, Pinecone, Vespa, LanceDB, Chroma, FAISS/hnswlib | ✓ | · | · | ✓ | ✓ | ✓ | core (field guide) |

### N. Adjacent and out-of-scope

| # | Topic | B | U | T | C | I | D | Decision and reason |
|---|---|---|---|---|---|---|---|---|
| N1 | Web search: link analysis, PageRank, crawling, near-duplicate web pages | · | ✓ | ✓ | · | · | · | out: web-search engineering; one pointer to IIR ch 19–21 |
| N2 | Text classification, Naive Bayes, SVMs, clustering, LSI | · | ✓ | ✓ | · | · | · | out: classical ML on documents; clustering appears only inside GraphRAG communities (K3) and semantic chunking (C2) |
| N3 | XML retrieval | · | · | ✓ | · | · | · | out: obsolete for this subject |
| N4 | Transformer internals, pretraining, RLHF/DPO, PEFT/LoRA mechanics | · | ✓ | ✓ | · | · | · | out: belongs to a future *LLM Internals* course (not yet in COURSE_PLAN.md); A2 and A4 give the orientation paragraph; D5/I5 name LoRA where fine-tuning is used |
| N5 | Speech recognition, machine translation, parsing, coreference | · | · | ✓ | · | · | · | out: NLP subjects unrelated to retrieval; B4 uses ASR as a black box |
| N6 | Recommender systems and personalization | · | ✓ | · | · | · | · | mentioned: same ANN machinery, one paragraph in F1 |
| N7 | B-tree and page internals, buffer pool, WAL | ✓ | · | · | · | · | · | out: belongs to *Databases in Depth* (course 01 in COURSE_PLAN.md); F8 gives one orientation paragraph and the forward pointer |
| N8 | Postgres planner, `EXPLAIN` in depth, index selection | ✓ | · | · | · | · | ✓ | out: belongs to *PostgreSQL Internals in Depth* (course 02); F8 shows `EXPLAIN` on one vector query only |
| N9 | Databricks-specific tooling (Delta, MLflow, Mosaic Agent Framework, Agent Bricks) | · | · | · | ✓ | · | · | out: vendor-specific certification content; M11 names managed platforms |
| N10 | Robotics, GR00T, AI policy (from U3) | · | ✓ | · | · | · | · | out: outside the subject |
| N11 | LLM reasoning techniques (CoT, self-consistency) beyond what retrieval needs | · | ✓ | · | · | · | · | mentioned: named where IRCoT and agents use them (J1, J3) |
| N12 | Ad generation and marketing use cases (S1) | ✓ | · | · | · | · | · | out: not a mechanism; A7 keeps one sentence |

---

## 3. Decision summary

| Decision | Rows | Notes |
|---|---|---|
| core | 46 | 27 keystone (★) |
| supporting | 42 | |
| mentioned | 8 | A4, A8, C7, D8, F6, I5, J5, K4 (+ N6, N11) |
| out | 10 | N1–N5, N7–N10, N12; each with reason; N7 and N8 point to courses that exist in COURSE_PLAN.md |

Rule check (§4 Phase 2): every row examined by a syllabus or textbook that is *about retrieval or RAG* is core or supporting; every row in an interview bank is core or supporting; history rows (A5) are in. The out rows are all either another subject (web search, classical text ML, NLP subfields, LLM training, robotics), vendor-specific certification content, or database internals owned by named courses in the plan.

---

## 4. What Phase 3 must guarantee

- Every **core** row lands in a chapter's topic list; every **supporting** row in a named section or callout; every **mentioned** row gets its paragraph and pointer. The Blueprint prints the orphan list and it must be empty.
- Keystone rows (★) reach §5.3 rung 9 and get the machines: expected keystone chapters are chunking (C1–C2), embeddings (D1–D2), BM25 (E1–E2), HNSW (F2), IVF-PQ (F3), filtered ANN (F5), hybrid + rerank (G1–G3), context assembly (G7), query rewriting (H1), multi-turn (H3), grounding (I1–I2), adaptive/agentic (J1–J3), GraphRAG (K2–K3), evaluation (L1–L3), production (M1, M4–M6).
- Rows whose spine is primary literature rather than the books (Charter §6): D2, D4, E2–E4, F2–F5, G2–G5, I2, I7, L1, L3, M2, M4–M6. The Blueprint names the paper or doc per chapter.

**Gate:** owner approves the decision column (especially the ten *out* rows and the eight *mentioned* rows). Next: **Phase 3 — Course Blueprint** (parts, numbered chapters with sections, machine specs, figures, outcomes and rows covered, capstone plan, free chapters, reading map, orphan check).
