# RAG In Depth — Phase 0 Deliverable: Source Map

**Status:** Phase 0 complete, awaiting owner gate ("nothing in the books is missing from the map").
**Date:** 2026-09-03
**Sources read end to end (4):**

| # | Source | Kind | Tier (§3.1) | Completeness |
|---|---|---|---|---|
| S1 | *Hands-On RAG for Production*, Ofer Mendelevitch & Forrest Bao (O'Reilly, early release 2025-05-07, 1st ed. planned June 2026) | Book, PDF | 1 | **Only 2 of 10 chapters exist**: Ch 1 (Introduction) and Ch 4 (Deploying to Production; labelled "Chapter 2" in the PDF). Chapters 2, 3, 5–10 are unavailable. |
| S2 | *RAG with Python Cookbook*, Dominik Polzer (O'Reilly, early release 2025-03-11, 1st ed. planned April 2026) | Book, EPUB | 1 | **Only 2 of 11 chapters exist**: Ch 1 (Loading Data) and Ch 2 (Data Preparation). Chapters 3–11 are unavailable. Many "[Link to Come]" forward references. |
| S3 | *Essential GraphRAG: Knowledge Graph-Enhanced RAG*, Tomaž Bratanič & Oskar Hane (Manning, 2025, ISBN 9781633436268) | Book, PDF | 1 | **Complete**: 8 chapters + appendix + references. |
| S4 | *Retrieval-Augmented Generation for Large Language Models: A Survey*, Gao et al. (Tongji/Fudan), arXiv 2312.10997 **v5, 27 Mar 2024** | Survey paper, PDF | 2 (primary literature) | Complete: 8 sections, 182 references. Added at owner's request; it is the field's standard reference survey and gives us the citation graph. |

> **Owner note on source thinness.** The two O'Reilly books are early releases with four chapters between them. Together with S3 (Neo4j-centric) and S4 (academic survey), the provided material covers: RAG motivation and enterprise framing, document loading and chunking, basic vector + hybrid retrieval, query rewriting, parent-document retrieval, text-to-Cypher, agentic RAG basics, knowledge-graph construction, Microsoft GraphRAG, RAGAS evaluation, production concerns, and the academic taxonomy. It does **not** explain, at mechanism depth, the things a "no other material needed" RAG course must: how embeddings are trained, how approximate-nearest-neighbour indexes work (HNSW, IVF, PQ), BM25 and sparse/learned-sparse retrieval, cross-encoder and late-interaction rerankers, fusion (RRF), evaluation metric mathematics, prompt/context engineering, long-context vs RAG, caching, observability, security. Phase 2 will source these from primary papers and system docs (§3.3). The §6 list at the end of this map is the candidate gap list. Source books are in `resources/RAG_In_Depth/`, not `pdfs/rag-in-depth/` as §10.4 prescribes; move or symlink at integration.

---

## 1. Per-source tables (§3.2 granularity)

### S1 — *Hands-On RAG for Production* (Mendelevitch & Bao)

Authors are Vectara founders; the book's framing is enterprise / turnkey-platform, and this bias should be noted when using its recommendations.

| Section | Topics | Named ideas (origin) | Concrete numbers (date/condition) | Exercises | Figures (one line each) |
|---|---|---|---|---|---|
| Ch 1 · How does RAG work | Two steps R and G; RAG prompt template; open-book vs closed-book analogy; parametric knowledge | RAG (Lewis et al., Meta, NeurIPS 2020, "34th NeurIPS"); "parametric knowledge" | — | none | Fig 1-1 basic RAG architecture (query → retrieve → generate) |
| Ch 1 · Blueprint of a RAG stack | Ingest flow (extract → chunk → embed → store text + vector); query flow (embed query → similarity search → prompt → LLM → guardrails); index/dataset/corpus synonyms; citations; hallucination detection as a guardrail | semantic search; hybrid search and reranking (forward pointer); guardrails: hallucination, bias, toxicity | — | none | Fig 1-2 the RAG stack with ingest and query flows |
| Ch 1 · RAG vs other approaches | vs "chat with PDF" (stuff everything in the prompt): cost, latency, accuracy; vs fine-tuning: expertise, cost, refresh cadence, access control ("Borg effect"); fine-tuned LLM inside RAG is fine | — | Context windows of 128K or 1M tokens (2025); "10s or 100s of PDFs" fit | none | none |
| Ch 1 · Key benefits | Scalable and efficient; reduces hallucinations; explainability via citations; instant add/remove of knowledge; access controls via permission metadata + query-time filtering | Claim: search scales linearly in documents, LLM attention quadratically (**sloppy; treat as intuition, not fact**) | — | none | none |
| Ch 1 · Use cases | Virtual assistants (airline), education tutor/examiner, enterprise knowledge management, content creation, personalized ads, question answering / RFP response, medical, legal & compliance | — | — | none | Fig 1-3 RAG tutoring platform (ingest, tutor mode, examiner mode); Fig 1-4 ad-generation pipeline |
| Ch 1 · Advanced RAG preview | Agentic RAG (iterative multi-step retrieval, tool integration, decomposition/planning); multimodal RAG (convert-to-text vs native VLM/MLLM; page-level embedding); GraphRAG (entities + relationships, multi-hop, "popularized by Microsoft") | Agentic RAG; VLM/MLLM; GraphRAG | — | none | none |
| Ch 4 · Challenges in production: response quality | Four causes of bad answers: (1) no relevant data, (2) weak retrieval pipeline at scale, (3) LLM hallucination even with perfect retrieval ("spectrum of factuality"), (4) prompt design ("say I don't know") | "garbage-in-garbage-out"; the improved RAG prompt (partially lost in the PDF) | — | none | none |
| Ch 4 · Latency | Prototype vs production thresholds; data growth; tail latency; mitigations: parallelization, alternative models, acceleration, autoscaling, indexing, caching, adaptive query processing; continuous monitoring | p95 tail latency | "a few seconds" like ChatGPT; p95 | none | none |
| Ch 4 · Data security & privacy | Three attack surfaces: ingestion, vector store, generation; encryption in transit/at rest; PII/PHI redaction vs quality; ISO 27001 hash-based lineage; RBAC; GDPR minimum-necessary; data leakage to external LLM providers; on-prem/open-source LLMs; guardrails (content filtering, compliance audits); prompt injection mitigations (prompt design, input sanitization, monitoring/tracing/logging, user feedback) | prompt injection; RBAC; defense in depth | — | none | none |
| Ch 4 · Vendor chaos, team, TCO | Component list (extraction, parsing, advanced retrieval, QA/hallucination models, security); multi-vendor SLA coordination; team skills (ML eng, data eng, DevOps/MLOps, security); TCO direct vs indirect; turnkey argument | "one throat to choke" | Large financial institutions: 400–500 GenAI use cases; typical enterprise 30–50 in first two years; DIY cost overruns 3–5× (authors' claim, no citation) | none | none |
| Ch 4 · RAG evaluation (preview) | Retrieval metrics, generation metrics, end-to-end quality; "can't fix what you can't measure" | — | — | none | none |
| Ch 4 · POC → production | POC report questions; goals & KPIs; hardware, dev process, data connectivity, governance (SOC-2, HIPAA, GDPR), monitoring, budget; launch, first two weeks, usage drop-off as a signal, upgrades (new embedding model requires re-index, A/B test), plan-test-deploy-monitor loop | Context Precision, Context Recall, Hallucination rate, Answer Relevance as KPIs | **Table 2-1 sample KPIs**: latency mean 7.5 s / median 8.5 s (POC) → 4.5 / 4 (prod), measured over 50 queries; uptime ≥ 99.99%; CP ≥ 0.9, CR ≥ 0.8, hallucination ≤ 0.05, AR ≥ 0.9; refresh daily; file types PDF/DOCX/PPTX/HTML; sources web, S3, Snowflake, Notion; retrieval: vector, hybrid, relevance rerank, diversity rerank; chunking fixed + semantic; LLMs GPT-4o, Claude, Llama 3.3 70B, DeepSeek-R1; embeddings HF, OpenAI, Cohere; query volume peaks then drops after 2–3 weeks; example 5% quality gain from a new embedding model | none | Table 2-1 |

**S1 "subtle / commonly misunderstood" remarks to keep as callouts:** hallucination is a spectrum, not binary; irrelevant-but-retrieved facts get used confidently; fine-tuning cannot forget; access control is the killer argument for RAG over fine-tuning; usage drop-off after launch is a quality signal.

### S2 — *RAG with Python Cookbook* (Polzer)

Recipe format (Problem / Solution / Prerequisites / Steps / Discussion / See also). Code is early-release and contains bugs (e.g. `text.append` on a string in Ex 1-1; PDF recipe pointing at a `.docx` path). Do not copy code; only the ideas.

| Recipe | Topics | Named ideas (origin) | Concrete numbers | Exercises | Figures |
|---|---|---|---|---|---|
| Ch 1 intro | Enterprise data is mostly unstructured; foundation models incl. embedding models; context-size limit; latency vs search engines; the two-phase RAG pipeline (load → split → embed → store; embed question → search → answer); warning about LangChain/LlamaIndex churn | — | "around 80% of information is unstructured" (uncited) | — | Fig 1-1 data distribution in companies; Fig 1-2 RAG components |
| 1.1 Word files | `python-docx` vs `unstructured` partition into typed elements (Title, NarrativeText, ListItem) with metadata; structure-aware retrieval (find chapter first) | element typing | — | — | Fig 1-3 loading Word |
| 1.2 PDF | PyPDF2 page-by-page with page-number metadata; "convert everything to PDF" strategy | — | — | — | Fig 1-4 PDF loading |
| 1.3 CSV/Excel | Three options: row → sentence; whole table in prompt as Markdown; text-to-SQL for aggregation | TabLLM (few-shot tabular classification); Vanna AI | census-income dataset: 15 columns, 48,000 rows | — | Figs 1-5, 1-6, 1-7 |
| 1.4 PostgreSQL | SQLAlchemy + psycopg2; pgvector as vector store (forward pointer) | pgvector | — | — | none |
| 1.5 Audio | Speech-to-text (Whisper via API or self-hosted); sensitive data → self-host | Whisper (`whisper-1`) | — | — | none |
| 1.6 OCR | Tesseract; pdf2image; OCR vs multimodal trade-off (fast/cheap/local vs flexible) | Tesseract, Cloud Vision, Textract, Azure AI Vision | — | — | Fig 1-8 |
| 1.7 Multimodal text extraction | Prompt a VLM (GPT-4o) with base64 image | — | — | — | Fig 1-9 |
| 1.8 Image summaries | Two routes: image embedding model (CLIP) vs summarize-then-text-embed | CLIP | "use a multimodal model when handling only a few hundred images" | — | Figs 1-10, 1-11 |
| 1.9 Table summaries | `unstructured` `hi_res` partition; summarize table with LLM; **store link to original table and inject the raw table at generation time** | — | — | — | Fig 1-12 |
| 1.10 Multimodal PDF | Partition → summarize images/tables → embed text + summaries → store with metadata | LangChain multimodal / semi-structured RAG notebooks | — | — | Fig 1-13 |
| 1.11 Video | Frame extraction at timestamps + audio segments → summarize + transcribe → embed; link back with timestamps | moviepy | frame every 10 s in code; slides change ~every 30 s in the sample | — | Figs 1-14 to 1-17 |
| Ch 2 intro | Pipeline: clean → metadata → split; chunking taxonomy (character, recursive, document-aware, semantic, agentic) | — | — | — | Fig 2-1 |
| 2.1 Metadata | Three sources: document metadata (PDF XML), derived (size, pages, path), LLM-extracted (Pydantic structured output); **metadata filtering narrows search and removes semantically-similar-but-wrong chunks** | OpenAI Structured Outputs; Pydantic | — | — | Figs 2-2, 2-3, 2-4 (antioxidant doctor vs engineer) |
| 2.2 Abbreviations / self-contained chunks | Replace abbreviations via dictionary regex; LLM rewrite for context; rules: contextual sentences, no pronouns, full entity names, no ambiguous words | — | — | — | Fig 2-5 |
| 2.3 Hypothetical questions | Generate N questions per chunk, embed the questions, map back to the chunk; "semantic alignment problem" between question and passage embeddings | (this is "Reverse HyDE" in S4's terms) | 5 questions per chunk | — | Figs 2-6, 2-7 |
| 2.4 Character splitting | Fixed window; ok for logs/streams; loses structure | LangChain `CharacterTextSplitter`; chunkviz | typical chunk 1,000–2,000 tokens ≈ 4,000–8,000 chars; 1 token ≈ 4 chars English; `text-embedding-3-small` context 8,191 tokens | — | Fig 2-8 |
| 2.5 Recursive splitting | Separator hierarchy `\n\n`, `\n`, space, `.`; CJK caveat; one idea per chunk | LangChain `RecursiveCharacterTextSplitter` | example chunk_size 200 | — | Figs 2-9, 2-10 |
| 2.6 Document-aware splitting | Markdown/HTML/LaTeX/Python splitters by syntax | LangChain header/code splitters | chunk 500 / overlap 50 | — | Fig 2-11 |
| 2.7 Semantic chunking | Sentence embeddings; break where consecutive similarity drops below threshold (percentile / std-dev / gradient) | LangChain experimental `SemanticChunker`; Greg Kamradt "5 Levels of Text Splitting"; LlamaIndex semantic splitter | 90th percentile threshold | — | Fig 2-12 |
| 2.8 Agentic chunking | Propositions (atomic, self-contained, pronoun-free statements, including implied ones); then LLM decides whether each proposition joins an existing chunk or starts a new one | *Dense X Retrieval* (Chen et al., 2023) proposition prompt (`wfh/proposal-indexing`); Kamradt | — | — | Fig 2-13 |

**S2 "subtle" remarks:** retrieval must see something question-shaped (hypothetical questions); semantically similar ≠ relevant (metadata); chunks must be self-explanatory in isolation; frameworks churn, prefer the underlying libraries.

### S3 — *Essential GraphRAG* (Bratanič & Hane)

Neo4j-centric throughout (both authors work at Neo4j). Code repo: github.com/tomasonjo/kg-rag.

| Section | Topics | Named ideas (origin) | Concrete numbers | Exercises | Figures |
|---|---|---|---|---|---|
| 1.1–1.2 LLMs and limits | Next-token prediction; instruction following; four limits: knowledge cutoff, outdated info, pure hallucination, lack of private info; other limits (bias, no understanding, prompt injection, inconsistency) | Transformer (Vaswani 2017); GPT-4 report; Karpathy "strange and imperfect knowledge base" | ChatGPT cutoff Oct 2023 at time of writing; WikiData Q152232 is *Womanlight* not the Mavericks | — | Figs 1.1–1.8 (LLM as next-word predictor, chat screenshots) |
| 1.3 Overcoming limits | Four training stages (pretraining, SFT, reward modeling, RL); why SFT for facts is unreliable; RAG two stages (retrieval, augmented generation); prompt template; ChatGPT web search as RAG | Lewis et al. 2020; Tian et al. 2023 (FT for factuality) vs Ovadia et al. 2023 (FT struggles to learn facts) — **sources differ** | pretraining "more than a trillion tokens" | — | Figs 1.9–1.13 |
| 1.4 KGs as RAG storage | KG = nodes + relationships + properties; structured (filter/count/aggregate) vs unstructured (fuzzy) questions; link entities in text to graph nodes | knowledge graph | — | — | Fig 1.14 mixed structured/unstructured graph |
| 2.1 Retriever & generator | Vector index = ANN, speed/accuracy trade-off; similarity functions (cosine vs Euclidean); embedding dimension cost; same model at index and query time; chunking questions; retriever pipeline; generator can be a smaller model | ANN; cosine similarity "between 0 and 1" (**imprecise: cosine ∈ [−1, 1]; Neo4j normalizes**) | — | — | none |
| 2.2 Vector-search RAG | Whitespace-respecting sliding-window chunker; OpenAI embeddings; Neo4j `CREATE VECTOR INDEX`; `db.index.vector.queryNodes`; system + user prompt; streaming | `text-embedding-3-small`; `all-MiniLM-L12-v2` (Sentence Transformers) | chunk 500 chars, overlap 40 → 89 chunks of "Einstein's Patents and Inventions" (arXiv 1709.00666); 1,536 dimensions; top-2 scores 0.8185 / 0.7907 | — | Figs 2.1–2.3 |
| 2.3 Hybrid search | Full-text (exact keyword) index; UNION vector + fulltext; **score normalization by dividing by each list's max**; dedupe by node, keep max | Neo4j fulltext (Lucene) | k = 4 | — | none |
| 3 intro | Query–document embedding mismatch; query rewriting (HyDE, step-back); alternative embedding strategies (hypothetical questions, parent document); sidebar: fine-tune embeddings (must re-embed everything), reranking, metadata filtering, hybrid | HyDE (Gao et al. 2022); Step-back (Zheng et al. 2023) | — | — | Figs 3.1–3.2 |
| 3.1 Step-back prompting | Zero-shot vs few-shot; the paper's system prompt; broader query improves recall | Step-back paper's Thierry Audel example | 2–5 few-shot examples typical | Ex 3.1 vary prompts | Fig 3.3 |
| 3.2 Parent document retriever | PDF → sections (regex on numbered titles) → parents → children; child embeddings, return parent; over-fetch k×4 then dedupe parents | Small-to-big pattern (S4 calls it Small2Big) | parent 2,000 chars; child 500 chars, overlap 20; section token counts 154…4,186; tiktoken | Ex 3.2 token counts, drop < 20-token segments | Figs 3.4, 3.5 |
| 3.3 Complete pipeline | step-back → parent retrieval → generate; retrieval uses rewritten query, generation uses original | — | — | Ex 3.3 ablate step-back | — |
| 4 Text2Cypher | Natural language → Cypher; why vector search cannot aggregate ("top three highest-rated Spielberg movies"); prompt = schema + terminology mapping + few-shot + format instructions; schema inference via APOC `apoc.meta.data`; catch-all retriever; fine-tuned text2cypher models (Neo4j HF datasets, Gemma2/Llama 3.1) | text2cypher; in-context learning; few-shot | — | — | Fig 4.1 |
| 5 Agentic RAG | Retriever agents (tools), retriever router (LLM tool calling), answer critic (blocking, generates follow-up questions, exit criteria); OpenAI tools format; `answer_given` tool; sequential question handling with query updater; single critique round | ReAct (Yao et al. 2023); function calling | — | — | Fig 5.1 |
| 6 KG construction with LLMs | Why chunk-and-retrieve fails on multi-contract legal questions; information extraction history; Structured Outputs with Pydantic (types, Optional to avoid hallucinated values, enum, descriptions, nesting depth); system message; CUAD dataset; graph modeling; unique constraints; non-idempotent import (`randomUUID`); entity resolution (string matching, clustering, ML, domain rules, SME loops); add chunks to graph; clause-based chunking for contracts | CUAD (Hendrycks et al. 2021); entity resolution | `gpt-4o-2024-08-06`, temperature 0 | Ex 6.1 other contract models | Figs 6.1–6.6 |
| 7 Microsoft GraphRAG | Two-stage indexing: extract + summarize entities/relationships, then community detection + community reports; entity types are configurable; chunk size vs entity recall; self-reflection ("gleaning") passes; extraction prompt (tuple/record delimiters, relationship strength); description summarization; super-node ranking problem; Louvain (Leiden in paper), hierarchy skipped; community report prompt (title, summary, impact severity 0–10, findings); **global search** = map (key points with 0–100 importance from each community report) + reduce; **local search** = entity vector search → connected chunks, relationships, communities, summaries, ranked and capped | Edge et al. 2024 (MS GraphRAG); Louvain; Leiden; GDS | Odyssey: 24 books, avg 6,515 tokens, min 4,459, max 10,760; chunk 1,000 words / overlap 40; chunk-size experiment 600 / 1,200 / 2,400 tokens, 0–3 reflection iterations, 600 best; book 1 → 66 entities, 182 relationships; Telemachus–Minerva 14 relationships; 9 communities of 2–13 nodes; rating threshold 5 | Ex 7.1 entity types; 7.2 global queries; 7.3 local queries | Figs 7.1–7.5 (pipeline, chunk-size chart, communities, global, local) |
| 8 Evaluation | Evaluate per stage (tool selection, context relevance, generation, end-to-end); benchmark design (tool selection, entity/value mapping, multi-step, edge cases, conversational); **Cypher as executable ground truth**; RAGAS metrics: context recall, faithfulness (statement decomposition + verdicts), answer correctness (TP/FP/FN); latency capture; LLM-as-judge inconsistency | RAGAS | 17 benchmark examples; results answer_correctness 0.7774, context_recall 0.7941, faithfulness 0.9657; text2cypher queries slower (extra LLM call) | — | Figs 8.1–8.3, Tables 8.1–8.5 |
| Appendix | Neo4j, Cypher, openCypher, ISO GQL; APOC; GDS; Desktop/Docker/Aura (GDS needs AuraDS); Movies dataset | GQL standard (Deutsch et al. 2022) | Neo4j ≥ 5.9.0; docker `neo4j:5.26.0` | — | Figs A.1–A.10 |

**S3 "subtle" remarks:** change the embedding model → rebuild the index; chunks from different documents get mixed at top-k; Optional fields stop the LLM inventing values; import queries must be idempotent; Louvain is non-deterministic; LLM-as-judge scores are inconsistent; super nodes break summarization prompts.

### S4 — Gao et al., *RAG for LLMs: A Survey* (arXiv 2312.10997 v5)

| Section | Topics | Named ideas (origin) | Concrete numbers | Figures |
|---|---|---|---|---|
| I–II Overview | Motivation (hallucination, outdated, untraceable); technology tree by stage (pre-training, fine-tuning, inference); **three paradigms**: Naive (Retrieve-Read: index, retrieve, generate; failures in retrieval precision/recall, generation hallucination, augmentation redundancy), Advanced (pre-retrieval: index + query optimization; post-retrieval: rerank + compress), Modular (new modules: Search, RAG-Fusion, Memory, Routing, Predict, Task Adapter; new patterns: Rewrite-Retrieve-Read, Generate-Read, Recite-Read, hybrid, sub-queries, HyDE, DSP, ITER-RETGEN, FLARE, Self-RAG); RAG vs fine-tuning vs prompt engineering quadrant; Ovadia 2023: RAG beats unsupervised FT, LLMs struggle to learn facts by FT | Lewis 2020; RETRO (Borgeaud 2022); RRR (Ma 2023); GenRead (Yu 2022); RECITE (Sun 2022); RAG-Fusion (Raudaschl 2023 blog); Selfmem; DSP (Khattab 2022); ITER-RETGEN (Shao 2023); FLARE (Jiang 2023); Self-RAG (Asai 2023); RA-DIT (Lin 2023) | "over 100 RAG studies" | Figs 1–4 |
| III Retrieval | Sources: unstructured (Wikipedia dumps), semi-structured (PDF/tables; text-2-SQL, TableGPT), structured (KG; KnowledGPT, G-Retriever with PCST), LLM-generated content (SKR, GenRead, Selfmem); **granularity ladder** token → phrase → sentence → proposition → chunk → document; KG granularity entity/triplet/subgraph; **indexing optimization**: chunking (fixed tokens, recursive, sliding window, Small2Big), metadata (page, file, author, timestamp; time-aware weighting; synthetic metadata: summaries, hypothetical questions = "Reverse HyDE"), structural index (hierarchical, KG index, KGP); **query optimization**: expansion (multi-query, sub-query/least-to-most, Chain-of-Verification), transformation (rewrite, RRR, BEQUE at Taobao, HyDE, step-back), routing (metadata router, semantic router, hybrid); **embedding**: sparse (BM25) vs dense (BERT-family), AngIE/Voyage/BGE, MTEB, hybrid sparse+dense, fine-tuning embeddings (domain jargon; LM-supervised retriever, Promptagator, LLM-Embedder, REPLUG KL-divergence, RL from LM feedback); **adapters** (UPRISE, AAR, PRCA, BGM bridge model, PKG) | DenseX propositions (Chen 2023); Small2Big (Yang 2023 blog); KGP (Wang 2023); least-to-most (Zhou 2022); CoVe (Dhuliawala 2023); HyDE (Gao 2022); Step-back (Zheng 2023); BEQUE (Peng 2023); Semantic Router (aurelio-labs); MTEB | Table I: ~80 methods by source/granularity/stage/process; fixed chunk sizes 100/256/512 tokens; MTEB 8 tasks, 58 datasets; C-MTEB 6 tasks, 35 datasets; HotpotQA Wikipedia dump 1 Oct 2017; DPR dump 20 Dec 2018 | Table I |
| IV Generation | **Context curation**: reranking (rule-based: diversity, relevance, MRR; model-based: BERT-family encoders, Cohere rerank, bge-reranker-large, LLM rerankers), selection/compression ((Long)LLMLingua token pruning with small LMs, PRCA, RECOMP contrastive condenser, Filter-Reranker SLM+LLM, LLM critique as in Chatlaw); **LLM fine-tuning** (domain data, format/style, SANTA, RLHF-style alignment, distillation, RA-DIT retriever–generator alignment) | Lost in the Middle (Liu 2023); LLMLingua / LongLLMLingua (Jiang 2023); RECOMP (Xu 2023); DPR (Karpukhin 2020) | RECOMP training: 1 positive, 5 negatives | — |
| V Augmentation process | **Iterative** (ITER-RETGEN), **recursive** (IRCoT chain-of-thought-guided; ToC clarification tree; hierarchical summary-then-retrieve; multi-hop on graphs, CoK), **adaptive** (FLARE triggers on low token probability; Self-RAG reflection tokens "retrieve"/"critic", segment-level beam search; SKR; WebGPT RL with special tokens; agents: AutoGPT, Toolformer, Graph-Toolformer) | IRCoT (Trivedi 2022); ToC (Kim 2023); FLARE; Self-RAG; WebGPT (Nakano 2021); Toolformer (Schick 2023) | — | Fig 5 |
| VI Tasks & evaluation | Downstream tasks (QA single/multi-hop/long-form/domain/multiple-choice, dialog, IE, reasoning, fact checking, summarization, code search, recommendation…); **evaluation targets**: retrieval quality (Hit Rate, MRR, NDCG) and generation quality (EM, F1, Accuracy, BLEU, ROUGE); **three quality scores**: context relevance, answer faithfulness, answer relevance; **four abilities**: noise robustness, negative rejection, information integration, counterfactual robustness; benchmarks RGB, RECALL, CRUD; tools RAGAS, ARES, TruLens (RAG triad) | RAGAS (Es 2023); ARES (Saad-Falcon 2023); RGB (Chen 2023); RECALL (Liu 2023); CRUD-RAG (Lyu 2024); RALLE | 26 tasks, ~50 datasets (Table II); Table III metric × aspect matrix; Table IV frameworks | Tables II–IV |
| VII Discussion | RAG vs long context (>200K tokens; RAG still wins on speed, traceability; new opportunity for summary-type questions); robustness ("misinformation worse than no information"; Cuconasu 2024: adding irrelevant documents raised accuracy >30%); hybrid RAG+FT, CRAG's lightweight retrieval evaluator; scaling laws of RAG, RETRO++, inverse scaling; production-ready RAG (efficiency, recall at scale, security incl. metadata leakage); ecosystem (LangChain, LlamaIndex, Flowise, Haystack, Meltano, Cohere Coral, Verba, Kendra); trends customization / simplification / specialization; multimodal RAG (RA-CM3, BLIP-2, "Visualize before you write", GSS, UEOP, Vid2Seq, RBPS code, CoK) | The Power of Noise (Cuconasu 2024); CRAG (Yan 2024); RAFT (Zhang 2024); MemGPT; attention sinks | contexts "exceeding 200,000 tokens" (Kimi, early 2024) | Fig 6 ecosystem |

---

## 2. Merged, deduplicated topic list with coverage depth

Depth key: **D** = definitive (mechanism + example + code or proof), **T** = thorough (mechanism explained, no worked depth), **S** = survey (named, a paragraph or less), — = absent.

| # | Topic | S1 | S2 | S3 | S4 | Notes |
|---|---|---|---|---|---|---|
| **A. Motivation and framing** |
| A1 | LLM limits: cutoff, outdated, hallucination, private data | T | S | D | T | S3 has the best concrete demonstrations |
| A2 | Parametric vs non-parametric knowledge; open-book analogy | T | — | T | T | |
| A3 | RAG vs fine-tuning vs prompt engineering vs long context | T | — | T | T | S4 §II.D quadrant and §VII.A; Ovadia 2023 |
| A4 | LLM training stages (pretrain, SFT, RM, RL) | — | — | T | S | |
| A5 | RAG history: Lewis 2020, RETRO, in-context RALM, paradigms Naive/Advanced/Modular | S | — | S | D | |
| A6 | Enterprise use cases | T | — | S | S | S1 ch1 |
| A7 | Access control as a RAG advantage | T | — | — | S | |
| **B. Ingestion and parsing** |
| B1 | Loaders: DOCX, PDF, CSV/Excel, SQL, audio, OCR, images, video | — | D | — | — | S2 ch1 |
| B2 | Element-typed partitioning (`unstructured`) | — | T | — | — | |
| B3 | Tables: row-to-text, table-in-prompt, text-to-SQL; summary + raw table injection | — | T | S | S | S4: TableGPT |
| B4 | Multimodal: OCR vs VLM; image summaries vs CLIP embeddings | S | T | — | S | |
| B5 | Metadata: extracted, derived, LLM-generated; time-aware weighting | — | T | S | T | |
| B6 | Text cleaning: abbreviations, self-contained chunks, pronouns | — | T | — | — | |
| **C. Chunking / indexing** |
| C1 | Fixed / character chunking; chunk size and overlap trade-offs | — | T | T | T | **Sources differ** on typical size: S2 says 1,000–2,000 tokens; S3 uses 500 chars (~125 tokens); S4 cites 100/256/512 tokens; MS GraphRAG best at 600 tokens for entity recall |
| C2 | Recursive and document-aware (Markdown/HTML/code) splitting | — | D | — | S | |
| C3 | Semantic chunking (embedding similarity breakpoints) | — | D | — | — | |
| C4 | Propositions / agentic chunking (Dense X) | — | T | — | T | |
| C5 | Hypothetical questions (Reverse HyDE) | — | T | T | S | |
| C6 | Parent-document / Small2Big / hierarchical index | — | — | D | T | |
| C7 | Structural / KG index, RAPTOR-style summary trees | — | — | S | S | RAPTOR only named in S4 Table I |
| C8 | Token counting (tiktoken), token≈4 chars | — | S | T | — | |
| **D. Embeddings and similarity** |
| D1 | What an embedding is; dimension; same model at index and query | — | S | T | S | No source explains training (contrastive, bi-encoder) |
| D2 | Cosine vs Euclidean vs dot product | — | S | T | S | S3's range claim imprecise |
| D3 | Embedding model landscape, MTEB, BGE, Voyage, OpenAI, MiniLM | — | S | S | T | |
| D4 | Fine-tuning embeddings; LM-supervised retrievers; adapters | — | — | S | T | |
| D5 | Vector index = ANN; speed vs accuracy | — | — | S | — | **Gap**: no HNSW/IVF/PQ mechanism anywhere |
| D6 | Vector databases: Neo4j vector index, pgvector | — | S | D | S | |
| **E. Retrieval** |
| E1 | Dense top-k retrieval pipeline | S | S | D | T | |
| E2 | Full-text / keyword / BM25 (sparse) | — | — | T | S | **Gap**: no BM25 mechanism |
| E3 | Hybrid search and score fusion | S | — | D | T | S3 fuses by max-normalization; RRF not mentioned anywhere |
| E4 | Query rewriting: HyDE, step-back, RRR, multi-query, sub-query, CoVe | — | — | D | T | |
| E5 | Query routing (metadata, semantic) | — | — | S | T | |
| E6 | Metadata filtering at query time; permission filtering | T | T | S | T | |
| E7 | Reranking (rule, cross-encoder, Cohere/bge, LLM) | S | — | S | T | **Gap**: no cross-encoder / ColBERT mechanism |
| E8 | Context compression / selection (LLMLingua, RECOMP, Filter-Reranker) | — | — | — | T | |
| E9 | Lost in the middle; context ordering | — | — | — | T | |
| E10 | Iterative / recursive / adaptive retrieval (ITER-RETGEN, IRCoT, FLARE, Self-RAG, CRAG) | S | — | — | T | |
| E11 | Retrieval granularity ladder | — | — | — | T | |
| E12 | Text-to-Cypher / text-to-SQL as retrievers | — | S | D | S | |
| E13 | Cypher-template (parameterized) retrievers | — | — | D | — | |
| **F. Generation** |
| F1 | RAG prompt template; "say I don't know"; citations | T | — | T | S | |
| F2 | System vs user message; streaming; structured outputs | — | T | D | — | |
| F3 | Generator model choice; smaller models suffice | S | — | T | S | |
| F4 | LLM fine-tuning for RAG (RA-DIT, RAFT, distillation) | S | — | — | T | |
| F5 | Hallucination detection / faithfulness guardrails | T | — | — | S | S1 hints at Vectara-style detector models without naming one |
| **G. Agentic RAG** |
| G1 | Tools/function calling; retriever router; answer critic; query updater | S | S | D | S | |
| G2 | ReAct, Toolformer, WebGPT, planning, multi-agent | S | — | S | T | |
| **H. GraphRAG / knowledge graphs** |
| H1 | Knowledge graphs, Cypher, property graph model | — | — | D | S | |
| H2 | LLM structured extraction to KG; entity resolution; idempotent import | — | — | D | S | |
| H3 | Microsoft GraphRAG: extraction, summarization, communities (Louvain/Leiden), global map-reduce, local search | S | — | D | S | |
| H4 | Mixed structured + unstructured graph; linking chunks to entities | — | — | D | S | |
| H5 | Other KG-RAG: KnowledGPT, G-Retriever, RoG, KGP, CoK, HyKGE | — | — | — | S | |
| **I. Evaluation** |
| I1 | Why evaluate; per-stage evaluation | T | — | D | T | |
| I2 | Retrieval metrics: hit rate, MRR, NDCG, precision/recall | S | — | — | S | **Gap**: no definitions or math |
| I3 | Generation metrics: EM, F1, BLEU, ROUGE, accuracy | — | — | — | S | |
| I4 | RAGAS triad: context relevance/recall, faithfulness, answer relevance/correctness; LLM-as-judge | T | — | D | T | |
| I5 | Four abilities: noise robustness, negative rejection, integration, counterfactual | — | — | — | T | |
| I6 | Benchmarks and datasets (NQ, HotpotQA, MS MARCO, BEIR, RGB, CRUD…) | — | — | — | T | |
| I7 | Benchmark design; executable ground truth; regression over time | S | — | D | — | |
| **J. Production / operations** |
| J1 | Four causes of bad answers | D | — | — | S | |
| J2 | Latency, tail latency, mitigations, caching | T | S | S | S | |
| J3 | Security: attack surfaces, encryption, PII/PHI, RBAC, data leakage to providers, prompt injection | T | — | S | S | |
| J4 | TCO, vendors, team skills, turnkey vs DIY | T | — | — | S | Vendor bias |
| J5 | POC→production KPIs, monitoring, launch, upgrades and re-indexing | D | — | — | — | |
| J6 | Frameworks and ecosystem (LangChain, LlamaIndex, Haystack, Flowise…) | S | T | S | T | |
| **K. Multimodal RAG** |
| K1 | Convert-to-text vs native VLM; page-level embedding | T | T | — | S | |
| K2 | Image/audio/video/code retrieval research (RA-CM3, BLIP-2, Vid2Seq, RBPS) | — | — | — | S | |

---

## 3. Every paper, spec, dataset and system cited (reading list for Phase 4)

### 3.1 Papers (chronological within group)

**Foundations**
- Vaswani et al. 2017, *Attention Is All You Need* — the transformer; needed once to explain context windows and quadratic attention.
- Lewis et al. 2020, *Retrieval-Augmented Generation for Knowledge-Intensive NLP Tasks* (NeurIPS) — the RAG paper; origin of the name, DPR retriever + BART generator, RAG-Sequence vs RAG-Token.
- Karpukhin et al. 2020, *Dense Passage Retrieval* — bi-encoder dense retrieval with in-batch negatives; origin of the dense retriever used by RAG.
- Borgeaud et al. 2022, *RETRO* — retrieval during pre-training from trillions of tokens; chunked cross-attention.
- Izacard et al. 2022, *Atlas* — few-shot learning with retrieval-augmented LMs.
- Ram et al. 2023, *In-Context RALM* — retrieval in the prompt with frozen LMs.
- Shi et al. 2023, *REPLUG* — black-box LM, retriever trained by KL to LM likelihood.
- Ovadia et al. 2023, *Fine-Tuning or Retrieval?* — RAG beats unsupervised FT for knowledge injection.
- Tian et al. 2023, *Fine-Tuning Language Models for Factuality* — the counter-evidence S3 cites.
- Kandpal et al. 2023, *LLMs Struggle to Learn Long-Tail Knowledge* — why retrieval is needed for rare facts.
- Ouyang et al. 2022, *InstructGPT* — RLHF; context for the training-stage story.
- Kaplan et al. 2020, *Scaling Laws* — referenced for "scaling laws of RAG" question.

**Indexing and granularity**
- Chen et al. 2023, *Dense X Retrieval: What Retrieval Granularity Should We Use?* — propositions as retrieval units; the agentic-chunking prompt.
- Sarthi et al. 2024, *RAPTOR* — recursive summary tree index.
- Wang et al. 2023, *Knowledge Graph Prompting (KGP)* — KG over multi-document structure.
- Teja 2023 (LlamaIndex blog), *Evaluating the Ideal Chunk Size* — chunk-size experiment.
- Yang 2023 (blog), *Small-to-Big Retrieval* — parent-document pattern.

**Query optimization**
- Gao et al. 2022, *HyDE: Precise Zero-Shot Dense Retrieval without Relevance Labels*.
- Zheng et al. 2023, *Take a Step Back* — step-back prompting.
- Ma et al. 2023, *Query Rewriting for RAG (Rewrite-Retrieve-Read)*.
- Peng et al. 2023, *BEQUE* — long-tail query rewriting at Taobao.
- Zhou et al. 2022, *Least-to-Most Prompting* — sub-question decomposition.
- Dhuliawala et al. 2023, *Chain-of-Verification*.
- Raudaschl 2023 (blog), *RAG-Fusion* — multi-query + reciprocal rank fusion.
- Kim et al. 2023, *Tree of Clarifications*.

**Embeddings and retrievers**
- Li & Li 2023, *AnglE* — angle-optimized embeddings.
- BAAI *FlagEmbedding / BGE* (GitHub); Voyage AI docs — embedding models.
- Dai et al. 2022, *Promptagator* — few-shot synthetic queries to train retrievers.
- Zhang et al. 2023, *LLM-Embedder* — reward-tuned universal retriever.
- Cheng et al. 2023, *UPRISE*; Yu et al. 2023, *AAR*; Yang et al. 2023, *PRCA*; Ke et al. 2024, *BGM* — adapters between retriever and LLM.
- Li et al. 2023, *SANTA* — structure-aware pretraining for structured-data retrieval.
- MTEB leaderboard (Hugging Face) — embedding benchmark.

**Generation-side curation**
- Liu et al. 2023, *Lost in the Middle* — position sensitivity in long contexts.
- Jiang et al. 2023, *LongLLMLingua* — prompt compression.
- Xu et al. 2023, *RECOMP* — compressing retrieved documents.
- Wang et al. 2023, *FILCO* — learning to filter context.
- Ma et al. 2023, *Filter-Reranker* — SLM filter + LLM reranker.
- Zhuang et al. 2023, *Open-source LLMs as zero-shot query likelihood rerankers*.
- Yu et al. 2023, *Chain-of-Note* — robustness to irrelevant/no retrieval.
- Yoran et al. 2023, *Making RALMs Robust to Irrelevant Context*.
- Cuconasu et al. 2024, *The Power of Noise* — irrelevant docs can help.
- Shi et al. 2023, *LLMs Can Be Easily Distracted by Irrelevant Context*.

**Augmentation flows and agents**
- Shao et al. 2023, *ITER-RETGEN*; Trivedi et al. 2022, *IRCoT*; Jiang et al. 2023, *FLARE (Active RAG)*; Asai et al. 2023, *Self-RAG*; Yan et al. 2024, *CRAG (Corrective RAG)*; Wang et al. 2023, *SKR*; Yu et al. 2022, *Generate rather than Retrieve*; Sun et al. 2022, *Recitation-Augmented LMs*; Khattab et al. 2022, *DSP*; Cheng et al. 2023, *Selfmem*; Xu et al. 2023, *Search-in-the-Chain*; Lála et al. 2023, *PaperQA*.
- Nakano et al. 2021, *WebGPT*; Schick et al. 2023, *Toolformer*; Yao et al. 2023, *ReAct*; Zhang 2023, *Graph-Toolformer*; Yang et al. 2023, *AutoGPT benchmark*.
- Lin et al. 2023, *RA-DIT* — dual instruction tuning of retriever and LLM.
- Zhang et al. 2024, *RAFT* — adapting LMs to domain RAG.
- Xu et al. 2023, *Retrieval Meets Long Context LLMs*; Packer et al. 2023, *MemGPT*; Xiao et al. 2023, *Attention Sinks* — the long-context debate.

**Knowledge graphs and GraphRAG**
- Edge et al. 2024, *From Local to Global: A Graph RAG Approach to Query-Focused Summarization* (Microsoft GraphRAG) — the paper S3 ch7 implements; prompts in its appendix.
- Hendrycks et al. 2021, *CUAD* — legal contract dataset used in S3 ch6.
- Wang et al. 2023, *KnowledGPT*; He et al. 2024, *G-Retriever* (PCST subgraph retrieval); Luo et al. 2023, *Reasoning on Graphs*; Li et al. 2023, *Chain of Knowledge*; Jiang et al. 2023, *HyKGE*; Baek et al. 2023, *KALMV*; Kang et al. 2023, *SURGE*.
- Deutsch et al. 2022, *Graph Pattern Matching in GQL and SQL/PGQ* — the ISO GQL standard.
- Blondel et al. 2008 (Louvain) and Traag et al. 2019 (Leiden) — community detection; **not cited by name in any source but required to explain S3 ch7** (mark as tier-2 to fetch).

**Multimodal and other modalities**
- Yasunaga et al. 2022, *RA-CM3*; Li et al. 2023, *BLIP-2*; Zhu et al. 2022, *Visualize Before You Write*; Zhao et al. 2022 (GSS); Chan et al. 2023 (UEOP); Yang et al. 2023, *Vid2Seq*; Nashid et al. 2023, *RBPS* (code); Radford et al. 2021, *CLIP* (S2); Hegselmann et al., *TabLLM* (S2); Zha et al. 2023, *TableGPT*.

**Evaluation**
- Es et al. 2023, *RAGAS*; Saad-Falcon et al. 2023, *ARES*; TruLens RAG triad (docs); Chen et al. 2023, *Benchmarking LLMs in RAG (RGB)*; Liu et al. 2023, *RECALL*; Lyu et al. 2024, *CRUD-RAG*; Hoshi et al. 2023, *RALLE*; Thakur et al. 2023, *NoMIRACL*; Mallen et al. 2022, *PopQA / When Not to Trust LMs*; Ren et al. 2023, *Factual Knowledge Boundary*.
- Datasets: Natural Questions, TriviaQA, SQuAD, WebQuestions, PopQA, MS MARCO, HotpotQA, 2WikiMultiHopQA, MuSiQue, ELI5, NarrativeQA, ASQA, QMSum, Qasper, COVID-QA, QuALITY, ARC, CommonsenseQA, FEVER, PubHealth, WikiText-103, StrategyQA, GSM8K, CodeSearchNet, BEIR (via Promptagator).

### 3.2 Systems, libraries and services

| System | Where cited | Why it matters to the course |
|---|---|---|
| Neo4j (vector index, fulltext index, Cypher, APOC, GDS, Aura/AuraDS) | S3 throughout | Reference graph + vector store; all S3 code; Louvain/Leiden via GDS |
| pgvector / PostgreSQL | S2 1.4 | The "vector search inside the database you already have" option; ties to the Databases track |
| LangChain (text splitters, SemanticChunker, hub), LlamaIndex, Haystack | S2, S4 | Framework layer; churn warning; DiversityRanker / LostInTheMiddleRanker in Haystack |
| `unstructured`, PyPDF2/pypdf, python-docx, pdf2image, Tesseract, moviepy | S2 | Ingestion tooling |
| OpenAI: `text-embedding-3-small` (1,536-d, 8,191-token input), GPT-4o, Structured Outputs, function calling, Whisper | S2, S3 | Reference APIs used in all code |
| Sentence Transformers `all-MiniLM-L12-v2`; BGE; Voyage; Cohere embeddings and rerank; bge-reranker-large | S3, S4 | Local/open embedding and reranker options |
| tiktoken | S3 | Token counting |
| Pydantic | S2, S3 | Schema for structured extraction |
| RAGAS, ARES, TruLens | S3, S4 | Evaluation frameworks |
| Microsoft GraphRAG (github.com/microsoft/graphrag) | S3 | Reference implementation of ch7 |
| Semantic Router (aurelio-labs) | S4 | Query routing |
| LLMLingua | S4 | Prompt compression |
| Vanna AI | S2 | Text-to-SQL |
| Flowise, Verba (Weaviate), Amazon Kendra, Meltano, Cohere Coral | S4 | Ecosystem survey |
| Vectara | S1 (authors' employer) | Turnkey-platform viewpoint; hallucination-detection model (HHEM) implied |
| Project Gutenberg (Odyssey #1727), arXiv 1709.00666 (Einstein patents), CUAD, Neo4j Movies dataset, census-income | S3, S2 | Worked-example corpora |

---

## 4. Concrete numbers worth carrying into the course (with conditions)

| Number | Source | Condition / date |
|---|---|---|
| 1 token ≈ 4 English characters | S2 | rule of thumb |
| `text-embedding-3-small`: 1,536 dims, 8,191-token max input | S2, S3 | OpenAI, 2024–25 |
| Typical chunk sizes: 100 / 256 / 512 tokens (research); 500 chars (S3 demo); 1,000–2,000 tokens (S2 advice); 600 tokens best for entity extraction (MS GraphRAG) | S4, S3, S2 | **conflicting; teach as a tunable with an experiment** |
| Parent 2,000 chars / child 500 chars; over-fetch k×4 before parent dedupe | S3 | Einstein paper demo |
| Hybrid demo: vector top-1 0.8185 vs normalized 1.0 | S3 | shows why normalization is needed |
| MS GraphRAG book-1 Odyssey: 66 entities, 182 relationships, 9 communities (2–13 nodes) | S3 | GPT-4o, non-deterministic |
| RAGAS on 17-question movie benchmark: correctness 0.777, context recall 0.794, faithfulness 0.966 | S3 | GPT-4o agent, LLM-judge |
| Production KPI targets: mean latency 4.5 s, uptime 99.99%, CP ≥ 0.9, CR ≥ 0.8, hallucination ≤ 0.05, AR ≥ 0.9 | S1 | Vectara customer samples, illustrative |
| DIY cost overruns 3–5×; 30–50 use cases in two years; 400–500 at large banks | S1 | authors' claims, uncited |
| Irrelevant documents raised accuracy by >30% | S4 citing Cuconasu 2024 | specific setup; teach as a robustness surprise |
| LLM contexts >200K tokens; 128K–1M | S4, S1 | 2024–25 |
| MTEB: 8 tasks, 58 datasets; C-MTEB 6 tasks, 35 datasets | S4 | 2023 version of the leaderboard |
| ChatGPT knowledge cutoff Oct 2023; Neo4j ≥ 5.9 for vector index; docker `neo4j:5.26.0` | S3 | 2024–25 |

---

## 5. Where sources disagree or are wrong (to surface, not hide)

1. **Chunk size** (see table above). Four different recommendations; the course must teach the trade-off and run the experiment.
2. **Fine-tuning for facts**: Tian 2023 (helps) vs Ovadia 2023 (LLMs struggle). S3 and S4 both cite Ovadia; present both.
3. **Cosine similarity range**: S3 says 0–1; mathematically −1 to 1; Neo4j's vector index rescales. State precisely.
4. **Hybrid fusion**: S3 normalizes by max score; the wider field (RAG-Fusion in S4, most vector DBs) uses Reciprocal Rank Fusion. Teach both, explain why RRF is scale-free.
5. **"Search scales linearly, LLM quadratically"** (S1): attention is quadratic in *sequence length*, search cost depends on the index (ANN is sub-linear). Correct it.
6. **S1's turnkey bias and uncited cost figures**: hedge every number from S1 ch4 as "one vendor's field experience".
7. **S2 code errors** and S3's non-idempotent import: teach idempotent ingestion explicitly.
8. **Louvain vs Leiden**: S3 uses Louvain and notes the paper uses Leiden; Leiden fixes Louvain's badly-connected communities (Traag 2019). Say so.
9. **Naming drift**: "hypothetical questions" (S2, S3) = "Reverse HyDE" (S4); "parent document retriever" (S3) = "Small2Big" (S4); "step-back" ≠ HyDE though both are query rewrites. Glossary must carry aliases.
10. **Karpathy's first name** is Andrej (S3 writes "Andrew"). Trivial but do not propagate.

---

## 6. Topics mentioned but not explained (candidate gaps for Phase 2)

Grouped by how badly a university final or senior interview would punish their absence.

**Must be built from primary sources (no source explains the mechanism):**
- Approximate nearest neighbour indexes: HNSW (Malkov & Yashunin 2016), IVF/IVF-PQ (Jégou 2011, FAISS), ScaNN, DiskANN; recall vs latency vs memory; `ef`, `M`, `nprobe`; filtered ANN (pre- vs post-filter).
- BM25 (Robertson & Zaragoza 2009) and inverted indexes; TF-IDF; why lexical still wins on rare terms.
- Learned sparse retrieval (SPLADE) and late interaction (ColBERT v1/v2, PLAID) — never mentioned in any source.
- Embedding model training: bi-encoders, contrastive loss, in-batch and hard negatives (DPR, Sentence-BERT, E5/BGE recipes), Matryoshka embeddings, quantization (int8, binary), dimension reduction.
- Cross-encoder rerankers: architecture, why they are accurate and slow, cascade design (retrieve k=100, rerank to 10).
- Reciprocal Rank Fusion (Cormack, Clarke & Büttcher 2009) and other fusion methods.
- Retrieval metric definitions and math: precision@k, recall@k, MRR, nDCG, hit rate; how to build a labelled retrieval test set.
- Prompt / context engineering for RAG: citation formats, refusal instructions, ordering, few-shot, system-prompt hardening; long-context "needle" behaviour.
- Semantic caching, KV-cache / prompt caching, cost and latency budgets per stage.
- Observability and tracing for RAG pipelines (spans per stage, feedback loops); online vs offline evaluation; A/B testing an embedding-model swap.
- Security mechanisms in depth: prompt injection via retrieved documents (indirect injection), document-level ACL enforcement at query time (filter push-down), PII redaction, tenant isolation, provider data-retention policies.
- Hallucination / faithfulness detectors (NLI-based models such as Vectara HHEM, AlignScore); LLM-as-judge biases and calibration.
- Conversation / multi-turn RAG: query rewriting with history, memory, follow-up resolution (S3 only shows a single-turn query updater).
- Multimodal retrieval mechanics: CLIP-style joint embeddings, ColPali-style page-image retrieval, table-aware retrieval.
- Text-to-SQL as a retriever (parallel to S3's text2cypher) and its failure modes.
- Leiden algorithm and modularity (to explain S3 ch7 properly); community hierarchy levels in MS GraphRAG; token cost of GraphRAG indexing.
- Entity resolution techniques (blocking, string similarity, embedding clustering) beyond S3's paragraph.
- Long-context vs RAG decision procedure with current model limits and pricing (2026).
- Agentic RAG beyond one router: planning, parallel tool calls, loops with budgets, MCP-style tool protocols, guardrails on tool output.
- Vector database landscape and internals as a field guide: pgvector (HNSW/IVFFlat), Qdrant, Weaviate, Milvus, Pinecone, Elasticsearch/OpenSearch (kNN + BM25), Vespa, LanceDB, Chroma, FAISS; filtering, multi-tenancy, updates and deletes, hybrid support.

**Mentioned once, needs a section or callout:**
- RAPTOR summary trees; KG-index (KGP); RAG-Fusion; Chain-of-Verification; Chain-of-Note; CRAG's retrieval evaluator; Self-RAG reflection tokens; FLARE confidence triggers; RETRO chunked cross-attention; RA-DIT / RAFT fine-tuning; LLMLingua compression; time-aware retrieval weighting; diversity reranking (MMR, DiversityRanker); "answer_given" tool; executable ground truth; the four robustness abilities; RGB/CRUD benchmark structure; inverse scaling question; GQL standard.

**Named only, one-paragraph orientation with pointer is enough:**
- Toolformer, WebGPT, AutoGPT, DSP, Selfmem, Recite-Read, Generate-Read, PaperQA, Search-in-the-Chain, KnowledGPT, G-Retriever, RoG, HyKGE, KALMV, SURGE, RA-CM3, BLIP-2, Vid2Seq, RBPS, MemGPT, attention sinks, TableGPT, TabLLM, UPRISE/AAR/PRCA/BGM adapters, SANTA, Promptagator, LLM-Embedder, Flowise/Verba/Kendra/Coral.

---

## 7. Gate checklist for the owner

- [ ] Every chapter of S1 (2 available), S2 (2 available), S3 (8 + appendix) and every section of S4 appears in §1.
- [ ] The merged list in §2 has no topic from §1 missing.
- [ ] §3 lists every paper/system named in the sources (S4's 182 references are covered by name for every one the survey discusses in prose; pure table-only entries are grouped under their family).
- [ ] The owner accepts that the provided books are thin and that Phase 2 must draw heavily on §6 gaps from primary literature and system docs.
- [ ] Decision needed: keep Neo4j as the reference graph store (S3's choice) or add a second, non-vendor path (e.g. Postgres + pgvector + a lightweight graph) for the capstone. Recommendation: teach the mechanism vendor-neutrally, use pgvector + Postgres for the capstone (ties to the Databases track), show Neo4j only in the GraphRAG field-guide chapter.

Next phase on approval: **Phase 1 — Course Charter** (personas, prerequisites, 15–30 outcomes, track position, title and promise).
