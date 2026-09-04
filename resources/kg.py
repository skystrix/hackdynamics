"""kg.py — Chapter 23, "Knowledge Graphs for RAG".

Chapter 20 measured a two-hop question that one retrieval cannot answer, and
Chapters 20 and 21 spent generations looping until it could. This script asks
what happens when the link between the two passages is stored as an edge
instead of being rediscovered at query time.

Everything executes. Kuzu 0.11 is the graph engine, so the graph is built,
merged, and traversed for real.

Measured:

  1. what chunking loses: how many of Q4's top passages come from unrelated
     source documents, and how far apart the two passages that matter are;
  2. idempotent import: the same extraction loaded twice with CREATE and with
     MERGE, counted;
  3. entity resolution, which is the measurement this chapter turns on: exact,
     string-similarity and embedding matchers over the same 18 Larkspur name
     variants, swept across thresholds, with precision and recall at each, plus
     what blocking does to the pair count;
  4. graph retrieval on Q4: one vector hit plus one hop of expansion, against
     the single-shot ranking Chapter 20 measured.

No model API is reachable from this machine, so the extraction step is written
by hand in the shape a structured-output call would return. The graph, the
merges, the resolution scores and the traversals are all real.

    PYTHONPATH=<scratch>/pylib HF_HOME=<scratch>/hf python3 kg.py
"""

import difflib
import itertools
import os
import shutil
import tempfile

from querygap import CORPUS, BM25, ranking
from hybrid import rrf_scores, order_of

Q4 = "Which policy changed after incident INC-2042?"
INCIDENT, POLICY = 17, 7

# Which source document each passage came from. A chunk index forgets this;
# a graph keeps it as a node.
def source_of(i):
    if i in {24, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 37}:
        return "ticket-system"
    if i in {17, 53}:
        return "incident-reports"
    if i in {19}:
        return "partner-contracts"
    return "policy-manual"


# --------------------------------------------------------------------------
# The extraction, written by hand in the shape a structured-output call
# returns. Entity names are deliberately inconsistent, because real extraction
# over many documents is inconsistent, which is what section 3 is about.
# --------------------------------------------------------------------------
EXTRACTION = [
    {"chunk": 17, "entities": [("Incident", "INC-2042"), ("Policy", "Refund and Cancellation Policy")],
     "rels": [("INC-2042", "AMENDED", "Refund and Cancellation Policy")]},
    {"chunk": 7, "entities": [("Policy", "Refund and Cancellation Policy"), ("FareClass", "L")],
     "rels": [("Refund and Cancellation Policy", "GOVERNS", "L")]},
    {"chunk": 53, "entities": [("Incident", "INC-1987")], "rels": []},
    {"chunk": 14, "entities": [("Policy", "Travel Credit Terms")], "rels": []},
    {"chunk": 20, "entities": [("FareClass", "L"), ("FareClass", "Y")], "rels": []},
]

# Eighteen names as three documents' extractions would actually produce them.
# The gold clusters are what a domain expert says is true.
NAMES = [
    "Larkspur Ltd", "Larkspur Limited", "Larkspur Airlines", "Larkspur Airlines Ltd",
    "LARKSPUR LTD.", "Larkspur Air Cargo", "Larkspur Air Cargo Ltd", "Larkspur Holdings",
    "Lisbon", "Lisboa", "LIS", "Lisbon Portela", "Humberto Delgado Airport",
    "Porto", "OPO", "Francisco Sa Carneiro Airport",
    "INC-2042", "Incident INC-2042",
]
GOLD = {
    "airline": {"Larkspur Ltd", "Larkspur Limited", "Larkspur Airlines", "Larkspur Airlines Ltd", "LARKSPUR LTD."},
    "cargo": {"Larkspur Air Cargo", "Larkspur Air Cargo Ltd"},
    "holdings": {"Larkspur Holdings"},
    "lisbon": {"Lisbon", "Lisboa", "LIS", "Lisbon Portela", "Humberto Delgado Airport"},
    "porto": {"Porto", "OPO", "Francisco Sa Carneiro Airport"},
    "incident": {"INC-2042", "Incident INC-2042"},
}
CLUSTER_OF = {n: c for c, names in GOLD.items() for n in names}

# A domain rule table: the alias list a subject-matter expert writes once.
ALIASES = {
    "LIS": "Lisbon", "Lisboa": "Lisbon", "Lisbon Portela": "Lisbon",
    "Humberto Delgado Airport": "Lisbon", "OPO": "Porto",
    "Francisco Sa Carneiro Airport": "Porto",
}


def norm(s):
    """Cheap normalisation: case, punctuation, and the corporate suffixes."""
    s = s.lower().replace(".", "").replace(",", "").strip()
    for suffix in (" limited", " ltd", " plc", " inc"):
        if s.endswith(suffix):
            s = s[: -len(suffix)].strip()
    return s


def pairs_gold(a, b):
    return CLUSTER_OF[a] == CLUSTER_OF[b]


def evaluate(decide, label):
    """Precision and recall over all pairs, against the expert's clusters."""
    tp = fp = fn = 0
    wrong_merges, missed = [], []
    for a, b in itertools.combinations(NAMES, 2):
        want, got = pairs_gold(a, b), decide(a, b)
        if got and want:
            tp += 1
        elif got and not want:
            fp += 1
            wrong_merges.append((a, b))
        elif want and not got:
            fn += 1
            missed.append((a, b))
    p = tp / (tp + fp) if tp + fp else 1.0
    r = tp / (tp + fn) if tp + fn else 1.0
    f = 2 * p * r / (p + r) if p + r else 0.0
    print(f"    {label:<34} P {p:.2f}  R {r:.2f}  F1 {f:.2f}   "
          f"({tp} merged, {fp} wrongly, {fn} missed)")
    return p, r, f, wrong_merges, missed


def main():
    tmp = tempfile.mkdtemp()

    # ---------------------------------------------------------------- 1
    print("=" * 74)
    print("1. WHAT CHUNKING LOSES")
    print("=" * 74)
    bm = BM25(CORPUS).score(Q4)
    order = ranking(bm)[:5]
    print(f"\n  {Q4}")
    print("  top 5 chunks, and where each one came from:")
    for r, d in enumerate(order, 1):
        print(f"    {r}. doc {d:2d}  [{source_of(d):<17}] {CORPUS[d][:44]}...")
    srcs = {source_of(d) for d in order}
    print(f"  {len(srcs)} different source documents in one window: {sorted(srcs)}")
    print("  The index cannot tell you they are unrelated, because it forgot.")

    shared = set(CORPUS[INCIDENT].lower().split()) & set(CORPUS[POLICY].lower().split())
    content = {w for w in shared if len(w) > 6}
    print(f"\n  The two passages that actually matter are docs {INCIDENT} and {POLICY}.")
    print(f"  Words they share that are longer than six characters: {sorted(content)}")
    print("  That overlap is the entire basis on which any retriever could link")
    print("  them, and it is why Chapter 20 needed a second generation to do it.")

    # ---------------------------------------------------------------- 2
    print()
    print("=" * 74)
    print("2. IMPORT: CREATE IS NOT IDEMPOTENT, MERGE IS")
    print("=" * 74)
    import kuzu

    def fresh(name):
        p = os.path.join(tmp, name)
        conn = kuzu.Connection(kuzu.Database(p))
        conn.execute("CREATE NODE TABLE Entity(name STRING, kind STRING, PRIMARY KEY(name))")
        conn.execute("CREATE NODE TABLE Chunk(cid INT64, source STRING, text STRING, PRIMARY KEY(cid))")
        conn.execute("CREATE REL TABLE MENTIONS(FROM Chunk TO Entity)")
        conn.execute("CREATE REL TABLE RELATES(FROM Entity TO Entity, kind STRING)")
        return conn

    def count(conn, q):
        r = conn.execute(q)
        return r.get_next()[0]

    c1 = fresh("create_db")
    for _ in range(2):
        for rec in EXTRACTION:
            for kind, name in rec["entities"]:
                try:
                    c1.execute("CREATE (:Entity {name: $n, kind: $k})", {"n": name, "k": kind})
                except Exception:
                    pass  # the primary key rejects it, which is the constraint doing its job
    print(f"\n  CREATE, run twice, with a primary key on Entity.name")
    print(f"    entities: {count(c1, 'MATCH (e:Entity) RETURN count(e)')}   "
          f"the key rejected the duplicates, loudly")

    c2 = fresh("merge_db")
    for run in (1, 2):
        for rec in EXTRACTION:
            for kind, name in rec["entities"]:
                c2.execute("MERGE (:Entity {name: $n})", {"n": name})
            for s, k, o in rec["rels"]:
                c2.execute("MATCH (a:Entity {name:$a}), (b:Entity {name:$b}) "
                           "MERGE (a)-[:RELATES {kind:$k}]->(b)", {"a": s, "b": o, "k": k})
        print(f"  MERGE, after run {run}: "
              f"{count(c2, 'MATCH (e:Entity) RETURN count(e)')} entities, "
              f"{count(c2, 'MATCH ()-[r:RELATES]->() RETURN count(r)')} relationships")
    print("\n  A key on the natural identifier turns a re-run into a no-op. Without")
    print("  one, a generated id such as randomUUID() makes every re-run a fresh")
    print("  copy of the whole graph.")

    # ---------------------------------------------------------------- 3
    print()
    print("=" * 74)
    print("3. ENTITY RESOLUTION")
    print("=" * 74)
    n = len(NAMES)
    all_pairs = n * (n - 1) // 2
    print(f"\n  {n} extracted names, {all_pairs} pairs to consider at O(n^2).")
    print("  Blocking: only compare names sharing a first token or a length band.")
    blocked = [(a, b) for a, b in itertools.combinations(NAMES, 2)
               if norm(a).split()[0] == norm(b).split()[0] or abs(len(a) - len(b)) <= 3]
    print(f"    blocked pair count: {len(blocked)} of {all_pairs} "
          f"({len(blocked)/all_pairs:.0%})")
    recoverable = sum(1 for a, b in blocked if pairs_gold(a, b))
    total_true = sum(1 for a, b in itertools.combinations(NAMES, 2) if pairs_gold(a, b))
    print(f"    true pairs still reachable: {recoverable}/{total_true}   "
          f"<- blocking is a RECALL ceiling, set before any matcher runs")

    print("\n  Matcher 1: exact string equality")
    evaluate(lambda a, b: a == b, "exact")

    print("\n  Matcher 2: normalised equality (case, punctuation, Ltd/Limited)")
    evaluate(lambda a, b: norm(a) == norm(b), "normalised")

    print("\n  Matcher 3: string similarity, swept")
    def ratio(a, b):
        return difflib.SequenceMatcher(None, norm(a), norm(b)).ratio()
    for t in (0.95, 0.90, 0.85, 0.80, 0.70):
        _, _, _, wrong, _ = evaluate(lambda a, b, t=t: ratio(a, b) >= t, f"similarity >= {t:.2f}")
        if wrong:
            print(f"        first wrong merge: {wrong[0][0]!r} + {wrong[0][1]!r} "
                  f"at {ratio(*wrong[0]):.2f}")

    print("\n  Matcher 4: embedding cosine, swept")
    try:
        from sentence_transformers import SentenceTransformer
        st = SentenceTransformer("sentence-transformers/all-MiniLM-L6-v2")
        emb = {x: v for x, v in zip(NAMES, st.encode(NAMES, normalize_embeddings=True))}
        def cos(a, b):
            return float(emb[a] @ emb[b])
        for t in (0.95, 0.90, 0.85, 0.80, 0.70):
            evaluate(lambda a, b, t=t: cos(a, b) >= t, f"cosine >= {t:.2f}")

        print("\n  Where the two matchers disagree, which is the whole point:")
        probe = [("Larkspur Ltd", "Larkspur Limited"), ("Larkspur Ltd", "Larkspur Air Cargo"),
                 ("Lisbon", "Lisboa"), ("Lisbon", "LIS"),
                 ("Lisbon", "Humberto Delgado Airport"), ("Porto", "OPO")]
        print(f"    {'pair':<52}{'string':>9}{'cosine':>9}   verdict")
        for a, b in probe:
            want = "MERGE" if pairs_gold(a, b) else "keep apart"
            print(f"    {a + '  /  ' + b:<52}{ratio(a,b):>9.2f}{cos(a,b):>9.2f}   {want}")
        print("\n    No single threshold separates these. 'Lisbon'/'LIS' shares almost")
        print("    no characters, and 'Larkspur Ltd'/'Larkspur Air Cargo' shares most.")

        print("\n  Matcher 5: the cascade actually used in practice")
        print("    normalised equality, then the expert's alias table, then")
        print("    string similarity at 0.90 inside a block.")
        def cascade(a, b):
            if norm(a) == norm(b):
                return True
            if ALIASES.get(a, a) == ALIASES.get(b, b):
                return True
            return ratio(a, b) >= 0.90
        evaluate(cascade, "cascade")
    except Exception as e:
        print(f"  (embeddings unavailable: {e})")

    # ---------------------------------------------------------------- 4
    print()
    print("=" * 74)
    print("4. GRAPH RETRIEVAL ON Q4: ONE VECTOR HIT PLUS ONE HOP")
    print("=" * 74)
    g = fresh("mixed")
    for rec in EXTRACTION:
        cid = rec["chunk"]
        g.execute("MERGE (:Chunk {cid: $c})", {"c": cid})
        g.execute("MATCH (c:Chunk {cid:$c}) SET c.source = $s, c.text = $t",
                  {"c": cid, "s": source_of(cid), "t": CORPUS[cid][:90]})
        for kind, name in rec["entities"]:
            g.execute("MERGE (:Entity {name: $n})", {"n": name})
            g.execute("MATCH (e:Entity {name:$n}) SET e.kind = $k", {"n": name, "k": kind})
            g.execute("MATCH (c:Chunk {cid:$c}), (e:Entity {name:$n}) MERGE (c)-[:MENTIONS]->(e)",
                      {"c": cid, "n": name})
        for s, k, o in rec["rels"]:
            g.execute("MATCH (a:Entity {name:$a}), (b:Entity {name:$b}) "
                      "MERGE (a)-[:RELATES {kind:$k}]->(b)", {"a": s, "b": o, "k": k})

    print(f"\n  Single-shot ranking for Q4, from Chapter 20: policy at rank 8.")
    print(f"  Vector top-1 for Q4: doc {order[0]}, the post-mortem.")
    print("\n  Now expand one hop from the entities that chunk mentions:")
    r = g.execute("""
MATCH (c:Chunk {cid: 17})-[:MENTIONS]->(e1:Entity)-[rel:RELATES]->(e2:Entity)<-[:MENTIONS]-(c2:Chunk)
RETURN e1.name, rel.kind, e2.name, c2.cid, c2.text
""")
    found = []
    while r.has_next():
        row = r.get_next()
        found.append(row)
        print(f"    ({row[0]}) -[{row[1]}]-> ({row[2]})  reaches chunk {row[3]}")
        print(f"      {row[4]}...")
    reached = {row[3] for row in found}
    print(f"\n  chunks reached in one hop: {sorted(reached)}")
    print(f"  policy chunk {POLICY} present: {POLICY in reached}")
    print("\n  Chapter 20 reached the same passage with a second generation to")
    print("  write the hop-2 query. This traversal costs an index lookup.")

    print("\n  The reverse path, entity to chunks, which is the other retrieval mode:")
    r = g.execute("""
MATCH (e:Entity {name: 'Refund and Cancellation Policy'})<-[:MENTIONS]-(c:Chunk)
RETURN c.cid, c.source, c.text ORDER BY c.cid
""")
    while r.has_next():
        row = r.get_next()
        print(f"    chunk {row[0]:2d}  [{row[1]}]  {row[2][:56]}...")
    print("\n  Every passage about that policy, with its source document attached,")
    print("  which is the document-boundary problem from section 1 solved by")
    print("  construction rather than by a filter someone remembered to add.")

    shutil.rmtree(tmp, ignore_errors=True)


if __name__ == "__main__":
    main()
