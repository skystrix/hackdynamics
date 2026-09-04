"""multiturn.py — Chapter 19, "Conversations: Multi-Turn RAG and Memory".

A four-turn Larkspur conversation, measured. The rewrites are written by hand
(no model API is reachable from this machine), but every retrieval below is
real: BM25 plus all-MiniLM-L6-v2 over the Chapter 14 corpus, fused with RRF.

  1. four ways to turn a follow-up into a query, scored by where the correct
     passage lands: raw follow-up, follow-up glued to the history, a condensed
     standalone question, and a condensed question carrying the entities;
  2. token growth per turn under five memory policies;
  3. what fraction of each turn's prompt is a cacheable stable prefix.

    PYTHONPATH=<scratch>/pylib HF_HOME=<scratch>/hf python3 multiturn.py
"""

import tiktoken

from querygap import CORPUS, BM25, ranking
from hybrid import rrf_scores, order_of

ENC = tiktoken.get_encoding("cl100k_base")
n_tok = lambda s: len(ENC.encode(s))

# The conversation. Each turn: what the user typed, the correct passage, the
# hand-written condensed question, and the same with entities carried forward.
TURNS = [
    dict(user="I'm flying Lisbon to Bordeaux next month on a class L ticket. "
              "How much is a checked bag?",
         gold=2,
         condensed="How much does a checked bag cost?",
         with_entities="How much does a checked bag cost on a Lisbon to "
                       "Bordeaux flight in a class L fare?"),
    dict(user="And if it's over 23 kg?",
         gold=2,
         condensed="What does a checked bag over 23 kg cost?",
         with_entities="What does a checked bag over 23 kg cost on a class L "
                       "Lisbon to Bordeaux booking?"),
    dict(user="What if I can't take the flight?",
         gold=7,
         condensed="What happens if the passenger cannot take the flight?",
         with_entities="What happens to a class L ticket if the passenger "
                       "cancels and cannot take the flight?"),
    dict(user="Do I get the taxes back?",
         gold=22,
         condensed="Are taxes refunded when a flight is not flown?",
         with_entities="Are government taxes and airport charges returned on a "
                       "cancelled class L ticket?"),
]

# Rolling summaries a small model would produce after each turn, by hand.
SUMMARIES = [
    "User is flying Lisbon to Bordeaux next month on a class L fare and asked "
    "about checked bag cost.",
    "User is flying Lisbon to Bordeaux next month on a class L fare; asked "
    "about checked bag cost and the fee for bags over 23 kg.",
    "User has a class L Lisbon to Bordeaux booking; asked about bag fees and "
    "what happens if they cannot take the flight.",
    "User has a class L Lisbon to Bordeaux booking; asked about bag fees, "
    "cancellation, and whether taxes are refunded.",
]
# Entity memory: the facts worth carrying, as a compact block.
ENTITIES = "route=LIS-BOD; fare_class=L; travel=next month; topic=bags,refund"

SYSTEM = 128  # tokens of stable instruction block, from Chapter 17


def main():
    from sentence_transformers import SentenceTransformer

    bm = BM25(CORPUS)
    bi = SentenceTransformer("sentence-transformers/all-MiniLM-L6-v2")
    E = bi.encode(CORPUS, normalize_embeddings=True)

    def rank_of_gold(query, gold):
        lex = bm.score(query)
        den = (E @ bi.encode([query], normalize_embeddings=True)[0]).tolist()
        order = order_of(rrf_scores(ranking(lex), ranking(den), 60, 50))
        return (order.index(gold) + 1 if gold in order else 999), order[:3]

    print("=" * 78)
    print("1. Four ways to build the query for each turn (rank of the correct passage)")
    print("%-34s %6s %6s %6s %6s" % ("turn", "raw", "+hist", "cond.", "+ent"))
    history = ""
    totals = [0, 0, 0, 0]
    for i, t in enumerate(TURNS, 1):
        glued = (history + " " + t["user"]).strip()
        r_raw, top_raw = rank_of_gold(t["user"], t["gold"])
        r_hist, _ = rank_of_gold(glued, t["gold"])
        r_cond, _ = rank_of_gold(t["condensed"], t["gold"])
        r_ent, _ = rank_of_gold(t["with_entities"], t["gold"])
        for j, r in enumerate((r_raw, r_hist, r_cond, r_ent)):
            totals[j] += 1.0 / r
        print("%-34s %6d %6d %6d %6d" % (t["user"][:34], r_raw, r_hist, r_cond, r_ent))
        if i == 3:
            print("      turn 3 raw top-3: %s  (gold is 7)" % top_raw)
        history = glued
    print("%-34s %6.2f %6.2f %6.2f %6.2f"
          % ("MRR", *[x / len(TURNS) for x in totals]))

    print("=" * 78)
    print("2. Token growth per turn, by memory policy")
    policies = ("none", "full buffer", "window 2", "rolling summary", "entity")
    print("%-18s %8s %8s %8s %8s" % ("policy", "turn 1", "turn 2", "turn 3", "turn 4"))
    rows = {p: [] for p in policies}
    for i, t in enumerate(TURNS):
        turn_texts = [x["user"] for x in TURNS[: i + 1]]
        # each earlier turn also cost an answer; assume 90 tokens of reply
        replies = 90 * i
        rows["none"].append(n_tok(t["user"]))
        rows["full buffer"].append(sum(n_tok(x) for x in turn_texts) + replies)
        win = turn_texts[-2:]
        rows["window 2"].append(sum(n_tok(x) for x in win) + 90 * min(i, 1))
        rows["rolling summary"].append(n_tok(SUMMARIES[i]) + n_tok(t["user"]))
        rows["entity"].append(n_tok(ENTITIES) + n_tok(t["user"]))
    for p in policies:
        print("%-18s %8d %8d %8d %8d" % (p, *rows[p]))
    print("  growth from turn 1 to turn 4: full buffer x%.1f, summary x%.1f, entity x%.1f"
          % (rows["full buffer"][3] / rows["full buffer"][0],
             rows["rolling summary"][3] / rows["rolling summary"][0],
             rows["entity"][3] / rows["entity"][0]))

    print("=" * 78)
    print("3. The cacheable prefix, per turn (Chapter 17's rule applied to a chat)")
    passages = 5 * 285  # five packed chunks at Chapter 17's measured cost
    for i in range(4):
        hist = rows["full buffer"][i]
        prompt = SYSTEM + hist + passages + n_tok(TURNS[i]["user"])
        print("  turn %d: prompt %d tokens; stable prefix (instructions only) %d = %.0f%%"
              % (i + 1, prompt, SYSTEM, 100 * SYSTEM / prompt))
    print("  history is stable once written, but it sits AFTER the instructions and")
    print("  BEFORE the passages, so a breakpoint after the history caches both:")
    for i in range(4):
        hist = rows["full buffer"][i]
        prompt = SYSTEM + hist + passages + n_tok(TURNS[i]["user"])
        print("    turn %d: breakpoint after history caches %d of %d = %.0f%%"
              % (i + 1, SYSTEM + hist, prompt, 100 * (SYSTEM + hist) / prompt))

    # The check: condensing must not lose ground against the raw follow-up.
    for t in TURNS:
        r_raw, _ = rank_of_gold(t["user"], t["gold"])
        r_ent, _ = rank_of_gold(t["with_entities"], t["gold"])
        assert r_ent <= r_raw, "entity rewrite lost ground on %r" % t["user"]
    print("\nok")


if __name__ == "__main__":
    main()
