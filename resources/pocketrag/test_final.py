"""The test Chapter 36 ends with, and the last test in the course.

Five claims, one per layer plus the two the earlier chapters could not make:

  1. the gold set resolves and has the shape the chapter claims;
  2. reranking beats every retriever it is built from, on nDCG@10;
  3. the refusal threshold's two score distributions overlap, so no threshold
     separates them, which is the finding chapter 35 could not see;
  4. the agent answers Q3 and Q4 inside the step budget;
  5. the graph answers Q4 a second way, through an edge rather than a ranking.

    python3 test_final.py <db>
"""
import shutil, sqlite3, sys, tempfile, os

import gold


def check(label, ok, detail=""):
    print(f"  {'PASS' if ok else 'FAIL'}  {label}{detail}")
    assert ok, label


def main(dbpath):
    # The agent and graph layers write tables, so work on a copy.
    tmp = os.path.join(tempfile.mkdtemp(), "final.db")
    shutil.copy(dbpath, tmp)
    db = sqlite3.connect(tmp)

    print("PocketRAG, chapter 36")

    # ------------------------------------------------------------ 1. gold
    g = gold.load(db)
    unans = [q for q, j, _ in g if not j]
    check("the gold set resolves", len(g) == 120,
          f" ({len(g)} queries, {sum(len(j) for _, j, _ in g)} judgments)")
    check("it contains unanswerable queries", len(unans) == 15,
          f" ({len(unans)} of them)")

    from sentence_transformers import SentenceTransformer, CrossEncoder
    from hnsw import HNSW, load_vectors
    from embed import MODEL
    import evaluate
    from answer import allowed

    model = SentenceTransformer(MODEL)
    ce = CrossEncoder("cross-encoder/ms-marco-MiniLM-L-6-v2")
    graph = HNSW.load(db, load_vectors(db))
    runs = evaluate.run_retrieval(db, model, ce, graph, g, allowed(db, "staff"))

    # ------------------------------------------------------- 2. reranking
    scores = {s: evaluate.score(runs, s)["ndcg@10"]
              for s in ("bm25", "vector", "rrf", "rerank")}
    check("reranking beats every retriever under it",
          scores["rerank"] > max(scores[s] for s in ("bm25", "vector", "rrf")),
          "  " + "  ".join(f"{s}={v:.3f}" for s, v in scores.items()))

    # -------------------------------------------------------- 3. the line
    sw = evaluate.sweep(runs)
    lo, hi = sw["overlap"]
    check("no refusal threshold separates the two classes", lo < hi,
          f" (answerable reach down to {lo:+.2f}, unanswerable up to {hi:+.2f})")
    check("the score is still an informative signal", sw["auc"] > 0.7,
          f" (AUC {sw['auc']:.3f}, and 0.5 would be a coin flip)")

    # ---------------------------------------------------------- 4. agent
    import agent
    agent.build_tables(db)
    q3 = agent.run(db, "How many refund tickets were opened in March?",
                   model, graph, ce)
    check("the agent answers Q3 from the table",
          q3["tool"] == "sql" and q3["answer"][1][0][0] == 12,
          f" ({q3['answer'][1][0][0]} refund tickets, {q3['steps']} step)")
    q4 = agent.run(db, "Which baggage policy changed after incident INC-2042?",
                   model, graph, ce)
    top4 = q4["answer"][0][0] if q4["answer"] else None
    want = gold.titles(db)["Fare rules and cancellation"]
    check("the agent answers Q4 within the step budget",
          top4 == want and q4["steps"] <= agent.STEP_BUDGET,
          f" ({q4['steps']} steps, budget {agent.STEP_BUDGET})")

    # ---------------------------------------------------------- 5. graph
    import graph as kg
    kg.build(db); kg.cluster(db); kg.report(db)
    seeds, chunks = kg.local_search(
        db, "Which baggage policy changed after incident INC-2042?")
    check("the graph answers Q4 through an edge", chunks and chunks[0] == want,
          f" (seeded on {[n for _, _, n in seeds]}, one hop)")

    print("\n  all checks passed")


if __name__ == "__main__":
    main(sys.argv[1])
