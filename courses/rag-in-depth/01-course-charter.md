# RAG In Depth — Phase 1 Deliverable: Course Charter

**Status:** Phase 1 complete, awaiting owner approval of audience, outcomes, prerequisites.
**Date:** 2026-09-03. Source Map (Phase 0) approved 2026-09-03.

---

## 1. Title and one-line promise

**Title:** *RAG In Depth*

**Promise (house voice):** Open the machine between a question and a grounded answer: how text becomes vectors, how a vector index finds neighbours in microseconds, why keyword search still wins on rare terms, what a reranker actually computes, where hallucinations enter even with perfect retrieval, and how to measure all of it. Then build the whole pipeline yourself, from a folder of PDFs to a cited answer, and benchmark it honestly against the tools people pay for.

**Positioning sentence for the landing card:** Most RAG tutorials teach you to call a framework. This course teaches you what the framework is doing, so you can make it fast, correct, and cheap when the tutorial's example stops working on your data.

---

## 2. Who it is for

The three Hack Dynamics personas from `marketing/PLAN.md`, re-cut for this subject. Weighting for content decisions: C 45%, B 35%, A 20%, same as the marketing plan.

### Persona C — "Rahul", working engineer (3–8 YOE, backend / platform / SRE)
- **Knows now:** Has shipped a RAG feature with LangChain or LlamaIndex and a hosted vector DB. It worked in the demo. In production answers are sometimes wrong, sometimes slow, and nobody can say why. Has heard of HNSW, BM25, rerankers, RAGAS; could not explain any of them at a whiteboard.
- **Goal:** Own the retrieval quality problem end to end. Choose chunking, embeddings, index, hybrid, reranking and evaluation from mechanism, not from blog posts. Cut cost and p95 latency with reasons. Be the engineer the team asks when the AI feature misbehaves.
- **JTBD:** *When the assistant confidently cites the wrong contract at 2am, help me trace which stage failed and fix that stage, so I stop re-prompting and praying.*

### Persona B — "Priya", recent grad / job seeker (0–2 YOE, interviewing for AI-engineer or backend roles)
- **Knows now:** Has done a "build a chatbot over your PDFs" tutorial. Can describe RAG in one sentence. Freezes on "how does a vector index actually find the nearest neighbour?" or "why would you still use BM25?".
- **Goal:** Clear the AI-engineering interview loop (system design of a RAG service, retrieval trade-offs, evaluation) and the take-home. Have a real, benchmarked project on the résumé.
- **JTBD:** *When the interviewer asks the follow-up question, help me answer from the mechanism, so I get past round three.*

### Persona A — "Aarav", CS student (3rd/4th year)
- **Knows now:** Linear algebra, data structures, a Python course, maybe an NLP elective. Has used ChatGPT daily. Has never seen an inverted index or a k-NN graph.
- **Goal:** Understand the systems layer under "AI apps" that college does not teach; ship the capstone as a placement project.
- **JTBD:** *When placement season is six months away, help me build and explain one real system that uses an LLM correctly, so I stand out from the batch that only prompts.*

---

## 3. Prerequisites (honest and minimal)

| You need | Because | Where to get it if missing |
|---|---|---|
| Comfortable programming in Python; able to read TypeScript | All examples are Python; the capstone is delivered in Python and TypeScript (decided in the Blueprint) | Any intro course; the official Python tutorial; the TypeScript handbook |
| Undergraduate data structures and Big-O | Inverted indexes, heaps for top-k, graphs for HNSW, hashing | CLRS chapters 1–3, 6, 11; or the first weeks of MIT 6.006 |
| Linear algebra at the level of dot products, norms, cosine, matrix multiply | Embeddings, similarity, quantization | 3Blue1Brown *Essence of Linear Algebra*; Gilbert Strang MIT 18.06 lectures 1–3 |
| Basic probability and statistics: mean, variance, percentiles, precision/recall | Evaluation metrics, tail latency, A/B tests | Khan Academy statistics; any intro stats course |
| SQL and a working Postgres install | pgvector is the reference vector store; metadata filtering is SQL | Chapters 1–3 of *Databases in Depth* or the Postgres tutorial |
| Having called an LLM API once and having an API key or a local model | Every chapter after Part I runs a model | The OpenAI, Anthropic, or Ollama quick-start |
| Not required: deep learning, transformer internals, machine-learning training | The course teaches the transformer only as far as context windows and attention cost; embedding models are used and fine-tuned, not designed | Pointer given in Chapter 1 to *How LLMs Work* for readers who want more |
| Not required: *Databases in Depth* | This course explains what it needs about B-trees, pages and indexes in place, and points to the database course for depth | — |

---

## 4. Outcomes ("after this course you can…"), each testable

Each outcome maps to at least one chapter in the Blueprint and at least one quiz question or exercise in Phase 6.

### Explain (mechanism from first principles)
- **E1.** Explain why an LLM hallucinates and why retrieval reduces but does not remove it, distinguishing parametric from non-parametric knowledge, with the Lewis 2020 origin.
- **E2.** Explain what a text embedding is, how a bi-encoder is trained with contrastive loss and negatives, and why the same model must be used at index and query time.
- **E3.** Explain cosine, dot product and Euclidean similarity, when they differ, and what normalization does.
- **E4.** Explain how an inverted index and BM25 score a document, including the role of term frequency saturation and document length.
- **E5.** Explain how HNSW finds approximate nearest neighbours: layers, the greedy search, `M` and `ef`, and why recall is not 100%.
- **E6.** Explain IVF and product quantization: coarse centroids, `nprobe`, sub-vector codebooks, and the memory–recall trade.
- **E7.** Explain what a cross-encoder reranker computes that a bi-encoder cannot, and what late interaction (ColBERT) gives up and gains.
- **E8.** Explain Reciprocal Rank Fusion and why score-normalized fusion is fragile.
- **E9.** Explain why chunk size, overlap and chunk boundaries change retrieval quality, and the parent-document / small-to-big pattern.
- **E10.** Explain the query–document gap and how HyDE, step-back, multi-query and hypothetical questions each attack it.
- **E11.** Explain the "lost in the middle" effect and why context ordering and compression matter.
- **E12.** Explain the GraphRAG pipeline: entity extraction, summarization, community detection, and why global search is map-reduce over community reports.
- **E13.** Explain the RAG evaluation triad (context relevance, faithfulness, answer relevance), the retrieval metrics (precision@k, recall@k, MRR, nDCG), and the limits of an LLM judge.
- **E14.** Explain the three RAG paradigms (naive, advanced, modular) and the adaptive-retrieval family (FLARE, Self-RAG, CRAG) as a history with named papers.

### Analyze (reason about trade-offs on given inputs)
- **A1.** Given a corpus and a query mix, choose a chunking strategy and defend it with the failure it avoids.
- **A2.** Given a dataset size, latency budget and memory budget, choose between flat, HNSW, IVF-PQ or DiskANN-style indexes and set their parameters.
- **A3.** Given a set of failed answers, attribute each to one of the four failure classes (missing data, weak retrieval, generation hallucination, prompt) using traces and metrics.
- **A4.** Given a hybrid retrieval result list, compute RRF by hand and explain a rank change.
- **A5.** Given filter selectivity, decide between pre-filtering, post-filtering and filtered-HNSW, and predict the recall cliff.
- **A6.** Decide between long-context stuffing and retrieval for a given corpus size, cost and traceability requirement, with numbers.
- **A7.** Decide when a knowledge graph or text-to-SQL/Cypher retriever is required (aggregation, multi-hop, document boundaries) and when vectors suffice.
- **A8.** Decide between RAG, fine-tuning, and both, for a given data-freshness, style and access-control requirement.

### Operate (run, measure, debug, secure the real thing)
- **O1.** Build a labelled retrieval test set and compute recall@k, MRR and nDCG for a pipeline; detect a regression when the embedding model changes.
- **O2.** Run a RAGAS-style evaluation with an LLM judge, read the three scores per stage, and know which score to distrust.
- **O3.** Trace a single request across ingest, retrieve, rerank and generate with spans, and read a p95 latency breakdown.
- **O4.** Tune pgvector (HNSW `m`, `ef_construction`, `ef_search`; IVFFlat `lists`, `probes`) and show the recall/latency curve on your own machine.
- **O5.** Enforce document-level access control at query time and prove with a test that a user cannot retrieve a forbidden chunk.
- **O6.** Defend against indirect prompt injection carried in retrieved documents and against data exfiltration through citations.
- **O7.** Re-index safely when the embedding model changes (dual-write, backfill, cut-over) without downtime.
- **O8.** Add semantic and prompt caching and measure the hit rate and cost saved.
- **O9.** Operate a multi-turn assistant: rewrite follow-up queries with history and bound the conversation memory.

### Build (the capstone)
- **B1.** Implement an ingestion pipeline from PDF/Markdown/HTML to clean, metadata-tagged, structure-aware chunks with idempotent upserts.
- **B2.** Implement an inverted index with BM25 scoring from scratch and validate it against a reference implementation.
- **B3.** Implement HNSW from scratch, measure recall against brute force, and plot recall vs `ef`.
- **B4.** Implement hybrid retrieval with RRF and a cross-encoder reranking cascade.
- **B5.** Implement query rewriting, grounded generation with citations, and a refusal path when context is insufficient.
- **B6.** Implement an evaluation harness (retrieval metrics + LLM-judged faithfulness) and a benchmark that compares your engine with pgvector and a hosted vector database on the same corpus, with conditions stated.
- **B7.** Implement a tool-routing agent over your retrievers (vector, keyword, SQL) with an answer critic and a step budget.
- **B8.** Extend the pipeline with a minimal GraphRAG index (entity extraction, communities, local and global search) over the same corpus.

---

## 5. Track position

`COURSE_PLAN.md` describes a **Database track** (Databases in Depth → Postgres → Redis → Build Your Own DB → SQL Performance → Analytical DBs). RAG In Depth does not belong to that track. It opens a second track, **AI Engineering**, and this Charter proposes the entry:

- **Assumes from earlier courses:** nothing. It explains B-tree and index basics, pages, and SQL filtering in place when needed and points to *Databases in Depth* for depth.
- **Shares with the Database track:** Postgres + pgvector is the reference vector store, so Chapters on filtered ANN and re-indexing connect directly to *PostgreSQL Internals in Depth* (course 02) and *SQL Performance in Depth* (course 05). Recurring example (the same `docs` table, the same three-node deployment) is reused across both tracks where possible.
- **Later courses will assume from this one:** embeddings and similarity search, evaluation discipline, the agent/tool-calling pattern. Candidate successors (to be added to `COURSE_PLAN.md` at integration, not decided here): *LLM Inference In Depth* (serving, KV cache, batching), *AI Agents In Depth*, *Search & Ranking In Depth* (learning to rank, the IR side this course only opens).
- **Action at Phase 8:** add an "AI Engineering track" section to `COURSE_PLAN.md` with RAG In Depth as course 01.

---

## 6. Where the course rests on primary literature rather than on the provided books (per guide §3.6)

| Area | Provided books | Course will rely on |
|---|---|---|
| ANN indexes (HNSW, IVF, PQ, DiskANN), filtered ANN | Not explained | Malkov & Yashunin 2016; Jégou et al. 2011; Subramanya et al. 2019 (DiskANN); FAISS wiki; pgvector, Qdrant, Weaviate, Elasticsearch docs; ann-benchmarks |
| BM25, inverted indexes, SPLADE, ColBERT | Not explained | Robertson & Zaragoza 2009; Formal et al. 2021 (SPLADE); Khattab & Zaharia 2020 (ColBERT), Santhanam 2022 (v2/PLAID); Lucene/Elasticsearch docs |
| Embedding training | Not explained | Reimers & Gurevych 2019 (Sentence-BERT); Karpukhin 2020 (DPR); Wang et al. 2022 (E5); Xiao et al. 2023 (BGE); Kusupati 2022 (Matryoshka); MTEB paper |
| Cross-encoders, fusion | Named only | Nogueira & Cho 2019 (BERT reranker); Cormack, Clarke & Büttcher 2009 (RRF) |
| Evaluation metric math, LLM-judge limits | Named only | Manning, Raghavan & Schütze *IIR* ch. 8; RAGAS, ARES papers; Zheng et al. 2023 (LLM-as-judge) |
| Security | One book section | OWASP Top 10 for LLM Applications; Greshake et al. 2023 (indirect prompt injection); provider data-retention docs |
| Caching, observability, serving | Sentences | Provider prompt-caching docs; OpenTelemetry GenAI semantic conventions; GPTCache / vendor semantic-cache docs |
| Long context vs RAG | One survey section | Liu et al. 2023; Xu et al. 2023; current model context and pricing tables (dated) |
| Multimodal retrieval | One recipe | Radford 2021 (CLIP); Faysse et al. 2024 (ColPali) |
| GraphRAG | Complete (S3) plus Edge et al. 2024 | Book + paper + Microsoft GraphRAG repo; Traag 2019 (Leiden) |

Roughly half of the mechanism chapters therefore draw their spine from papers and system documentation. Every such chapter names its sources in the header comment (§4 Phase 4).

---

## 7. Tool and system decisions proposed for the Blueprint (guide §3.7)

Mechanisms are taught vendor-neutrally. Where the learner runs something:

| Role | Choice | Why (popular, widely used, best fit) |
|---|---|---|
| Language for examples and capstone | Python (primary) + TypeScript (second capstone language) | The two languages RAG is actually built in; both have first-class SDKs for every model provider |
| Relational + vector store | PostgreSQL with pgvector | Most engineers already run Postgres; exposes HNSW and IVFFlat parameters directly; ties to the Database track |
| Keyword search | Postgres full-text for the small case; Elasticsearch/OpenSearch in the field guide; our own BM25 in the capstone | The learner builds the mechanism, then sees it in the two most-deployed engines |
| Embeddings | `sentence-transformers` locally (BGE / E5 / MiniLM families) plus one hosted API (OpenAI `text-embedding-3`) | Local for reproducible experiments and fine-tuning; hosted for what production teams actually use |
| Rerankers | `bge-reranker` (local cross-encoder) plus one hosted (Cohere Rerank) | Same reasoning as embeddings |
| LLM | Provider-agnostic thin client; examples run on Claude and on a local model via Ollama | Avoids single-vendor lock-in in code; per guide §3.3 current versions named when behaviour differs |
| Frameworks | Not used in course code; LangChain and LlamaIndex covered in the field guide as what they wrap | Learner should see the mechanism, not the wrapper |
| Evaluation | RAGAS for the judged metrics; our own harness for retrieval metrics | RAGAS is the de-facto standard; retrieval metrics are 30 lines and should be understood |
| Graph store | Neo4j, only in the GraphRAG chapters | Neo4j is where GraphRAG tooling lives; the capstone GraphRAG layer uses plain Postgres tables so no new install is required |
| Observability | OpenTelemetry spans; one hosted viewer shown (e.g., Langfuse or Phoenix) | Vendor-neutral standard first |
| ANN experiments | FAISS and hnswlib for the recall/latency curves | The reference implementations everyone benchmarks against |

Final choices are locked in the Blueprint (Phase 3).

---

## 8. Charter self-check against §11

- 30 outcomes, grouped explain / analyze / operate / build, each phrased as an observable action.
- Prerequisites minimal, each with a pointer; the previous course is not assumed.
- Track position stated; a new track is proposed rather than forcing RAG into the database track.
- Primary-literature reliance disclosed per §3.6; tool choices justified per §3.7.

**Gate:** owner approves audience, outcomes, prerequisites, and the track proposal. Next: **Phase 2 — Topic Universe and Gap Matrix** (merge the Source Map with at least three named university syllabi, two textbooks, the docs of the key systems, and two interview banks; decide core / supporting / mentioned / out per row).
