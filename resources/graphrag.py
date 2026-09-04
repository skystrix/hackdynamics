"""graphrag.py — Chapter 24, "GraphRAG: Communities, Summaries, and Global Search".

Chapter 23 built a graph so a two-hop question could be answered in one hop.
This script asks the question that no hop answers at all: what is this whole
corpus about?

Everything executes. The entity graph is extracted deterministically from the
56-passage Larkspur corpus, communities come from real Leiden and Louvain
runs (leidenalg 0.12, networkx 3.6), and every token count is tiktoken over
real strings.

Measured:

  1. why top-k fails on a global question: how much of the corpus a window
     actually reads, and how far two phrasings of the same global question
     disagree about which passages to read;
  2. the graph, and community detection: Leiden against Louvain, run
     repeatedly, counting partitions and checking the property Leiden was
     invented to guarantee;
  3. the hierarchy: recursive Leiden, communities and sizes per level;
  4. the token bill: what global search costs at each level, against stuffing
     the corpus, which is the whole trade.

No model API is reachable from this machine, so the community reports are
stood in for by an extractive summary of each community's entities and
passages. Their token counts are real, because the reports are real strings;
what a model would write instead is longer and better. The text says so.

    PYTHONPATH=<scratch>/pylib HF_HOME=<scratch>/hf python3 graphrag.py
"""

import itertools
import re
from collections import Counter, defaultdict

from querygap import CORPUS, BM25, ranking

# Two phrasings of the same global question, plus a local one for contrast.
GLOBAL_A = "What kinds of problems do Larkspur's customers actually have?"
GLOBAL_B = "What are the main themes across Larkspur's support and policy documents?"
LOCAL_Q = "Can I bring my cello in the cabin?"

# A deterministic extractor. Real GraphRAG uses a model; this uses patterns and
# a lexicon, so the graph is reproducible and costs nothing to rebuild.
PATTERNS = [
    ("Incident", r"INC-\d+"),
    ("Ticket", r"[Ss]upport ticket (\d+)"),
    ("FareClass", r"fare class(?:es)? ([A-Z](?:, [A-Z])*(?: and [A-Z])?)"),
    ("Money", r"(\d+) EUR"),
    ("Airport", r"\b(Lisbon|Porto|Bordeaux|Palermo)\b"),
    ("Aircraft", r"\b(A320neo|A321neo)\b"),
]

LEXICON = {
    "Topic": [
        "refund", "cancellation", "travel credit", "baggage", "checked bag",
        "cabin bag", "seat selection", "check-in", "no-show", "compensation",
        "chargeback", "taxes", "name change", "special assistance", "pets",
        "musical instrument", "delay", "schedule change", "fare rules",
        "group booking", "unaccompanied minor", "dangerous goods", "wi-fi",
        "meals", "sports equipment", "travel documents", "infants", "downgrade",
        "weather", "codeshare", "data protection", "gift voucher", "loyalty",
    ],
}


def extract(text):
    """Entities in one passage. Deterministic, so the graph is reproducible."""
    found = set()
    for kind, pat in PATTERNS:
        for m in re.finditer(pat, text):
            val = m.group(1) if m.groups() else m.group(0)
            if kind == "FareClass":
                for c in re.findall(r"[A-Z]", val):
                    found.add(("FareClass", c))
            else:
                found.add((kind, val))
    low = text.lower()
    for kind, terms in LEXICON.items():
        for t in terms:
            if t in low:
                found.add((kind, t))
    return found


def build():
    """Entity nodes, co-occurrence edges, and the chunks each entity appears in."""
    mentions = defaultdict(set)   # entity -> chunk ids
    per_chunk = {}
    for i, text in enumerate(CORPUS):
        ents = extract(text)
        per_chunk[i] = ents
        for e in ents:
            mentions[e].add(i)
    edges = Counter()
    for i, ents in per_chunk.items():
        for a, b in itertools.combinations(sorted(ents), 2):
            edges[(a, b)] += 1
    return mentions, per_chunk, edges


def jaccard(a, b):
    return len(a & b) / len(a | b) if a | b else 1.0


def main():
    import networkx as nx
    import igraph as ig
    import leidenalg
    import tiktoken

    enc = tiktoken.get_encoding("cl100k_base")
    ntok = lambda s: len(enc.encode(s))

    # ---------------------------------------------------------------- 1
    print("=" * 74)
    print("1. WHY TOP-K CANNOT ANSWER A GLOBAL QUESTION")
    print("=" * 74)
    bm = BM25(CORPUS)
    corpus_tokens = sum(ntok(c) for c in CORPUS)
    print(f"\n  corpus: {len(CORPUS)} passages, {corpus_tokens} tokens")
    for label, q in (("phrasing A", GLOBAL_A), ("phrasing B", GLOBAL_B)):
        top = ranking(bm.score(q))[:5]
        read = sum(ntok(CORPUS[i]) for i in top)
        print(f"\n  {label}: {q}")
        print(f"    reads passages {top}")
        print(f"    {len(top)}/{len(CORPUS)} passages = {len(top)/len(CORPUS):.0%} of the corpus, "
              f"{read}/{corpus_tokens} tokens = {read/corpus_tokens:.0%}")
    a = set(ranking(bm.score(GLOBAL_A))[:5])
    b = set(ranking(bm.score(GLOBAL_B))[:5])
    print(f"\n  overlap between the two windows: {sorted(a & b)}  "
          f"Jaccard {jaccard(a, b):.2f}")
    print("  Two ways of asking the same global question read almost different")
    print("  corpora. Whatever answer comes out is a property of the retrieval,")
    print("  not of the corpus.")
    top_local = ranking(bm.score(LOCAL_Q))[:5]
    print(f"\n  contrast, a local question: {LOCAL_Q}")
    print(f"    reads {top_local}; the answer is entirely inside passage {top_local[0]}")
    print("    Top-k is correct here. One passage holds the whole answer.")

    # ---------------------------------------------------------------- 2
    print()
    print("=" * 74)
    print("2. THE GRAPH, AND WHO DETECTS ITS COMMUNITIES")
    print("=" * 74)
    mentions, per_chunk, edges = build()
    G = nx.Graph()
    for (u, v), w in edges.items():
        G.add_edge(u, v, weight=w)
    print(f"\n  extracted {len(mentions)} entities, {G.number_of_edges()} co-occurrence edges")
    print(f"  entity kinds: {dict(Counter(k for k, _ in mentions))}")
    print(f"  graph density {nx.density(G):.4f}, "
          f"connected components {nx.number_connected_components(G)}")

    print("\n  Louvain, run 10 times on the same graph:")
    partitions = set()
    mods = []
    for seed in range(10):
        comms = nx.community.louvain_communities(G, seed=seed, weight="weight")
        partitions.add(frozenset(frozenset(c) for c in comms))
        mods.append(nx.community.modularity(G, comms, weight="weight"))
    print(f"    distinct partitions found: {len(partitions)} out of 10 runs")
    print(f"    modularity range: {min(mods):.4f} to {max(mods):.4f}")
    print("    Louvain is not deterministic: the same graph gives different")
    print("    communities between runs, so a community id is not a stable key.")

    # The property Leiden was created to guarantee.
    bad = 0
    for comms in [nx.community.louvain_communities(G, seed=s, weight="weight") for s in range(10)]:
        for c in comms:
            if len(c) > 1 and not nx.is_connected(G.subgraph(c)):
                bad += 1
    print(f"\n    internally DISCONNECTED Louvain communities across 10 runs: {bad}")
    print("    Leiden was introduced because Louvain can produce a community whose")
    print("    members are not connected to each other. On a graph this small the")
    print("    defect did not appear, so this is a guarantee that matters at scale,")
    print("    not a bug you will see on a toy.")

    nodes = list(G.nodes())
    idx = {n: i for i, n in enumerate(nodes)}
    g = ig.Graph(n=len(nodes), edges=[(idx[u], idx[v]) for u, v in G.edges()])
    g.es["weight"] = [G[u][v]["weight"] for u, v in G.edges()]

    print("\n  Leiden, run 10 times on the same graph:")
    lparts, lmods = set(), []
    for seed in range(10):
        part = leidenalg.find_partition(g, leidenalg.ModularityVertexPartition,
                                        weights="weight", seed=seed)
        lparts.add(frozenset(frozenset(nodes[i] for i in c) for c in part))
        lmods.append(part.modularity)
        bad_l = sum(1 for c in part if len(c) > 1 and not g.subgraph(c).is_connected())
    print(f"    distinct partitions: {len(lparts)} out of 10 runs")
    print(f"    modularity range: {min(lmods):.4f} to {max(lmods):.4f}")
    print(f"    internally disconnected communities in the last run: {bad_l}   <- guaranteed by construction")
    print("\n    Note what this does NOT show. Leiden produced MORE distinct")
    print("    partitions than Louvain here, not fewer. Both are stochastic; what")
    print("    Leiden guarantees is the quality of each community, not stability")
    print("    between runs. Neither gives you a community id you can store.")

    # ---------------------------------------------------------------- 3
    print()
    print("=" * 74)
    print("3. THE HIERARCHY: RECURSIVE LEIDEN")
    print("=" * 74)
    level0 = leidenalg.find_partition(g, leidenalg.ModularityVertexPartition,
                                      weights="weight", seed=7)
    l0 = [[nodes[i] for i in c] for c in level0]
    print(f"\n  level 0: {len(l0)} communities, sizes {sorted((len(c) for c in l0), reverse=True)}")

    l1 = []
    for c in l0:
        if len(c) < 4:
            l1.append(c)
            continue
        sub = G.subgraph(c)
        sn = list(sub.nodes())
        si = {n: i for i, n in enumerate(sn)}
        sg = ig.Graph(n=len(sn), edges=[(si[u], si[v]) for u, v in sub.edges()])
        sg.es["weight"] = [sub[u][v]["weight"] for u, v in sub.edges()]
        p = leidenalg.find_partition(sg, leidenalg.ModularityVertexPartition,
                                     weights="weight", seed=7)
        for part in p:
            l1.append([sn[i] for i in part])
    print(f"  level 1: {len(l1)} communities, sizes {sorted((len(c) for c in l1), reverse=True)}")

    def report(comm):
        """An extractive stand-in for what a model would write per community."""
        chunks = set()
        for e in comm:
            chunks |= mentions[e]
        named = [v for k, v in sorted(comm) if k == "Topic"] or [v for _, v in sorted(comm)]
        title = ", ".join(named[:4])
        ents = "; ".join(f"{k}:{v}" for k, v in sorted(comm))
        body = " ".join(CORPUS[i][:110] for i in sorted(chunks)[:6])
        return f"TITLE: {title}\nENTITIES: {ents}\nFINDINGS: {body}", chunks

    print("\n  what a level-0 community actually contains:")
    biggest = max(l0, key=len)
    txt, chunks = report(biggest)
    print(f"    {len(biggest)} entities spanning {len(chunks)} passages")
    print(f"    title line: {txt.splitlines()[0][:96]}")
    print("    A community is a THEME, and its passages are scattered across the")
    print("    corpus, which is exactly what a top-5 window cannot assemble.")

    # ---------------------------------------------------------------- 4
    print()
    print("=" * 74)
    print("4. THE TOKEN BILL FOR A GLOBAL ANSWER")
    print("=" * 74)
    r0 = [report(c)[0] for c in l0]
    r1 = [report(c)[0] for c in l1]
    t0, t1 = sum(ntok(r) for r in r0), sum(ntok(r) for r in r1)
    print(f"\n  {'strategy':<36}{'units':>7}{'tokens':>10}{'% of corpus':>13}{'map calls':>11}")
    print(f"  {'-'*77}")
    print(f"  {'stuff the whole corpus':<36}{len(CORPUS):>7}{corpus_tokens:>10}"
          f"{100:>12.0f}%{1:>11}")
    print(f"  {'level 1 reports (fine)':<36}{len(r1):>7}{t1:>10}"
          f"{t1/corpus_tokens*100:>12.0f}%{len(r1):>11}")
    print(f"  {'level 0 reports (coarse)':<36}{len(r0):>7}{t0:>10}"
          f"{t0/corpus_tokens*100:>12.0f}%{len(r0):>11}")
    print(f"  {'top-5 vector window':<36}{5:>7}"
          f"{sum(ntok(CORPUS[i]) for i in ranking(bm.score(GLOBAL_A))[:5]):>10}"
          f"{sum(ntok(CORPUS[i]) for i in ranking(bm.score(GLOBAL_A))[:5])/corpus_tokens*100:>12.0f}%"
          f"{1:>11}")
    print("\n  The top-5 row is the cheapest and it is the one that cannot answer")
    print("  the question. Cost is not the axis that separates these; coverage is.")
    print(f"\n  Coverage, the number that matters for a global question:")
    for label, units in (("level 0 reports", l0), ("level 1 reports", l1)):
        cov = set()
        for c in units:
            for e in c:
                cov |= mentions[e]
        print(f"    {label:<22} touch {len(cov)}/{len(CORPUS)} passages = {len(cov)/len(CORPUS):.0%}")
    print(f"    {'top-5 window':<22} touches 5/{len(CORPUS)} passages = {5/len(CORPUS):.0%}")
    orphans = [i for i in range(len(CORPUS)) if not per_chunk[i]]
    print(f"\n    Both levels cover the same passages, because the hierarchy")
    print(f"    repartitions the same entities. What caps coverage is EXTRACTION:")
    print(f"    {len(orphans)} passages yielded no entity at all, so no community can")
    print(f"    ever reach them. Extraction recall is the ceiling on global search.")

    print("\n  Reduce step: the map outputs, not the reports, are what gets summarised.")
    keypoints = 3
    per_point = 40
    for label, units in (("level 0", r0), ("level 1", r1)):
        red = len(units) * keypoints * per_point
        print(f"    {label}: {len(units)} map calls -> {len(units)*keypoints} key points "
              f"~= {red} tokens into one reduce call")

    print("\n  Local search, for contrast, on the local question:")
    local2 = "Which fare classes are non-refundable and what happens to the fare?"
    top2 = ranking(bm.score(local2))[0]
    print(f"    question: {local2}")
    print(f"    top passage: {top2}  ({CORPUS[top2][:52]}...)")
    seeds = extract(CORPUS[top2])
    nbrs = set()
    for e in seeds:
        if e in G:
            nbrs |= set(G.neighbors(e))
    local_chunks = set()
    for e in seeds | nbrs:
        local_chunks |= mentions.get(e, set())
    print(f"    seed entities from the top passage: {sorted(v for _, v in seeds)}")
    print(f"    one-hop neighbourhood: {len(nbrs)} entities, "
          f"reaching {len(local_chunks)} passages")
    print("    Local search widens a good hit. Global search never had one.")


if __name__ == "__main__":
    main()
