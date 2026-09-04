"""agentic.py — Chapter 21, "Agentic RAG: Tools, Routers, and Critics".

Once retrieval is a tool a model can call, three things stop being prose and
start being measurable: which tool gets picked, when the loop is allowed to
stop, and what the loop costs while it runs.

Measured here, over the Chapter 14 Larkspur corpus:

  1. tool selection by description — the same four tools described twice, once
     in one terse line each and once to the 3-4 sentence standard Anthropic's
     tool-definition docs ask for, routed by embedding similarity over a
     labelled question set;
  2. selection ambiguity — what adding one overlapping tool does to the margin
     between the winning tool and the runner-up;
  3. the critic — Chapter 16's cross-encoder scoring whether the evidence set
     answers each sub-question, measured at hop 1 and hop 2 of Chapter 20's Q4,
     which is where an exit threshold comes from;
  4. what the loop costs — real token counts (tiktoken, cl100k_base) for the
     tool block and for a transcript that is re-sent in full on every step,
     which is the arithmetic behind a step budget.

No model API is reachable from this machine, so the routing decision is made
by embedding similarity rather than by a generator reading the schemas. That
substitutes a weaker router for a stronger one: it measures whether the
description carries the signal, not whether a model can follow it. The text
says so.

    PYTHONPATH=<scratch>/pylib HF_HOME=<scratch>/hf python3 agentic.py
"""

import json

from querygap import CORPUS, BM25, ranking
from hybrid import rrf_scores, order_of

TICKETS = {24, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 37}
POLICIES = [i for i in range(len(CORPUS)) if i not in TICKETS]

# --------------------------------------------------------------------------
# The same four tools, described two ways. TERSE is the shape the docs call a
# poor description: a name restated. DETAILED follows the published guidance —
# what it does, when to use it and when not to, what each parameter means,
# what it does not return.
# --------------------------------------------------------------------------
TERSE = {
    "search_policy_pages": "Searches policy pages.",
    "search_support_tickets": "Searches support tickets.",
    "count_tickets": "Counts tickets.",
    "answer_given": "Answers the question.",
}

DETAILED = {
    "search_policy_pages":
        "Searches Larkspur's published policy and operations pages: fare "
        "rules, cancellation and refund terms, baggage allowances, pets, "
        "special assistance, incident post-mortems and partner contracts. "
        "Use this for any question about what the airline's rules actually "
        "say, and for any question whose answer is a rule rather than an "
        "example. It returns passages of policy text. It does not return "
        "customer correspondence, and it cannot count or aggregate anything.",
    "search_support_tickets":
        "Searches the free-text body of customer support tickets, written in "
        "the customer's own words. Use this to find out how passengers "
        "describe a problem, to find precedent for how a case was handled, or "
        "to quote a real complaint. Do not use it to establish what a policy "
        "says, because a ticket records what a customer asked, not what the "
        "rule is. It returns ticket text only, never counts or totals.",
    "count_tickets":
        "Runs a counting query over the support ticket table, whose columns "
        "are ticket_id, opened_at (a date), category (one of refund, baggage, "
        "booking, assistance) and status. Use it for any question asking how "
        "many, how often, a total, a rate or a trend over time, which no "
        "passage of text can answer. Arguments are a category and a date "
        "range. It returns a single number and no text.",
    "answer_given":
        "Ends the loop and returns the final answer to the user. Call this "
        "only when the evidence already gathered answers every part of the "
        "question, or when it is clear that no available tool can answer it "
        "and the answer must be a refusal. It performs no retrieval.",
}

OVERLAP = {
    "search_refund_policy":
        "Searches Larkspur's refund and cancellation policy: which fare "
        "classes are refundable, when a travel credit is issued instead of "
        "money, and how taxes are treated. Use it for questions about getting "
        "money back. It returns policy text about refunds.",
}

# Labelled routing set. The label is the tool the pipeline must reach first.
ROUTING_SET = [
    ("Can I bring my cello in the cabin?", "search_policy_pages"),
    ("I couldn't take my flight, how do I get my money back?", "search_policy_pages"),
    ("How many refund tickets were opened in March?", "count_tickets"),
    ("Which policy changed after incident INC-2042?", "search_policy_pages"),
    ("Can I bring my emotional support peacock in the cabin?", "search_policy_pages"),
    ("What is the checked bag fee?", "search_policy_pages"),
    ("How do customers usually describe a missed connection?", "search_support_tickets"),
    ("Show me a complaint about a delayed refund.", "search_support_tickets"),
    ("How many baggage tickets did we open last quarter?", "count_tickets"),
    ("What share of tickets are about refunds?", "count_tickets"),
    ("Find the ticket where someone asked about a name change.", "search_support_tickets"),
    ("What are the check-in deadlines?", "search_policy_pages"),
]

# Chapter 20's Q4, decomposed. The critic scores each sub-question against the
# evidence set the loop holds at that point.
Q4 = "Which policy changed after incident INC-2042?"
HOP2_QUERY = "refund and cancellation policy 24-hour cooling-off clause"

# The second sub-question, written three ways. All three mean the same thing to
# a reader. The critic is asked whether the evidence answers each of them.
SUBQUESTIONS = [
    "What does the refund and cancellation policy say?",
    "Which clause was added to the refund and cancellation policy?",
    "What happens to the fare when a booking is cancelled?",
]


def retrieve(query, k=5, pool=None):
    """The Chapter 15 hybrid pipeline, restricted to a document pool."""
    docs = range(len(CORPUS)) if pool is None else pool
    sub = [CORPUS[i] for i in docs]
    idx = list(docs)
    bm_scores = BM25(sub).score(query)
    dn_scores = DENSE.score(query, idx)
    a = order_of({idx[j]: bm_scores[j] for j in range(len(sub))})
    b = order_of({idx[j]: dn_scores[j] for j in range(len(sub))})
    fused = rrf_scores(a, b)
    return order_of(fused)[:k]


class Dense:
    def __init__(self, model):
        self.model = model
        self.emb = model.encode(CORPUS, normalize_embeddings=True)

    def score(self, query, idx):
        q = self.model.encode([query], normalize_embeddings=True)[0]
        return [float(q @ self.emb[i]) for i in idx]


DENSE = None


def route(model, question, descriptions, pooling="whole"):
    """Pick a tool by cosine between the question and each description.

    Two ways to compare against a multi-sentence description:

      "whole"    embed the description as one string, which is what a naive
                 semantic router does;
      "sentence" embed each sentence and keep the best, which is Chapter 16's
                 late-interaction idea applied to the description.

    A generator reading the schemas would do better than either. This measures
    whether the description carries the signal at all, and how much of it a
    single pooled vector throws away.
    """
    names = list(descriptions)
    q = model.encode([question], normalize_embeddings=True)[0]
    scored = []
    for name in names:
        text = descriptions[name]
        if pooling == "whole":
            parts = [text]
        else:
            parts = [s.strip() for s in text.split(". ") if len(s.strip()) > 15]
        e = model.encode(parts, normalize_embeddings=True)
        scored.append((max(float(q @ v) for v in e), name))
    return sorted(scored, reverse=True)


def toolblock(descriptions):
    """The JSON a tool definition actually sends, so the token count is real."""
    schemas = []
    for name, desc in descriptions.items():
        props = {"query": {"type": "string", "description": "The search query."}}
        req = ["query"]
        if name == "count_tickets":
            props = {
                "category": {"type": "string", "enum": ["refund", "baggage", "booking", "assistance"],
                             "description": "The ticket category to count."},
                "start_date": {"type": "string", "description": "Inclusive ISO date."},
                "end_date": {"type": "string", "description": "Exclusive ISO date."},
            }
            req = ["category", "start_date", "end_date"]
        elif name == "answer_given":
            props = {"answer": {"type": "string", "description": "The final answer."},
                     "citations": {"type": "array", "items": {"type": "string"},
                                   "description": "Passage ids supporting the answer."}}
            req = ["answer", "citations"]
        schemas.append({"name": name, "description": desc,
                        "input_schema": {"type": "object", "properties": props, "required": req}})
    return json.dumps(schemas)


def main():
    global DENSE
    from sentence_transformers import SentenceTransformer, CrossEncoder
    import tiktoken

    print("loading models...")
    st = SentenceTransformer("sentence-transformers/all-MiniLM-L6-v2")
    ce = CrossEncoder("cross-encoder/ms-marco-MiniLM-L-6-v2")
    enc = tiktoken.get_encoding("cl100k_base")
    DENSE = Dense(st)
    ce.predict([("warm", "up")])
    print()

    # ---------------------------------------------------------------- 1
    print("=" * 74)
    print("1. TOOL SELECTION: does the description carry the signal?")
    print("=" * 74)
    for label, descs in (("terse", TERSE), ("detailed", DETAILED)):
        for pooling in ("whole", "sentence"):
            if label == "terse" and pooling == "sentence":
                continue  # one sentence each; nothing to pool
            hits, margins, picked = 0, [], {}
            print(f"\n  {label} descriptions, compared {pooling}")
            for q, gold in ROUTING_SET:
                scored = route(st, q, descs, pooling)
                top, second = scored[0], scored[1]
                ok = top[1] == gold
                hits += ok
                margins.append(top[0] - second[0])
                picked[top[1]] = picked.get(top[1], 0) + 1
                print(f"    {'OK ' if ok else 'MISS'}  {q[:46]:<46} -> {top[1]:<22} "
                      f"({top[0]:.3f}, margin {top[0]-second[0]:+.3f})"
                      + ("" if ok else f"  want {gold}"))
            gold_dist = {}
            for _, g in ROUTING_SET:
                gold_dist[g] = gold_dist.get(g, 0) + 1
            print(f"    accuracy {hits}/{len(ROUTING_SET)} = {hits/len(ROUTING_SET):.2f}   "
                  f"mean margin {sum(margins)/len(margins):+.3f}")
            print(f"    chose: " + ", ".join(f"{k} {v}" for k, v in sorted(picked.items())))
            print(f"    gold : " + ", ".join(f"{k} {v}" for k, v in sorted(gold_dist.items())))

    # ---------------------------------------------------------------- 2
    print()
    print("=" * 74)
    print("2. SELECTION AMBIGUITY: one overlapping tool added")
    print("=" * 74)
    plus = dict(DETAILED)
    plus.update(OVERLAP)
    refund_qs = [q for q, _ in ROUTING_SET[:2]] + ["What are the check-in deadlines?"]
    for q in refund_qs:
        before = route(st, q, DETAILED, "sentence")
        after = route(st, q, plus, "sentence")
        print(f"\n  {q}")
        print(f"    4 tools: {before[0][1]:<22} {before[0][0]:.3f}  margin {before[0][0]-before[1][0]:+.3f}")
        print(f"    5 tools: {after[0][1]:<22} {after[0][0]:.3f}  margin {after[0][0]-after[1][0]:+.3f}"
              f"   runner-up {after[1][1]}")

    # ---------------------------------------------------------------- 3
    print()
    print("=" * 74)
    print("3. THE CRITIC: is the evidence set complete?")
    print("=" * 74)
    hop1 = retrieve(Q4, k=5)
    hop2 = retrieve(HOP2_QUERY, k=5)
    merged = list(dict.fromkeys(hop1 + hop2))
    print(f"\n  hop 1 query    : {Q4}")
    print(f"  hop 1 evidence : docs {hop1}   (17 = the post-mortem)")
    print(f"  hop 2 query    : {HOP2_QUERY}")
    print(f"  hop 2 evidence : docs {hop2}   merged: {merged}   (7 = the policy)")

    print("\n  The first sub-question is answered at hop 1 either way:")
    sq0 = "What happened in incident INC-2042 and which policy was changed?"
    for tag, ev in (("hop 1", hop1), ("hop 2", merged)):
        s = ce.predict([(sq0, CORPUS[i]) for i in ev])
        print(f"    {tag}  best {max(s):+7.2f} on doc {ev[list(s).index(max(s))]}")

    print("\n  The second sub-question, written three ways. Same meaning to a")
    print("  reader, same evidence, three different exit decisions:\n")
    print(f"    {'sub-question':<62}{'hop 1':>16}{'hop 2':>16}")
    for sq in SUBQUESTIONS:
        row = []
        for ev in (hop1, merged):
            s = list(ce.predict([(sq, CORPUS[i]) for i in ev]))
            row.append((max(s), ev[s.index(max(s))]))
        print(f"    {sq:<62}{row[0][0]:+8.2f} (doc {row[0][1]:>2}){row[1][0]:+8.2f} (doc {row[1][1]:>2})")

    print("\n  Per-document, for the phrasing that exits correctly:")
    sq = SUBQUESTIONS[2]
    for d in merged:
        s = ce.predict([(sq, CORPUS[d])])[0]
        mark = "  <- the policy" if d == 7 else ("  <- the post-mortem" if d == 17 else "")
        print(f"    doc {d:2d}  {s:+7.2f}{mark}")

    print("\n  The same critic on a question the corpus cannot answer:")
    unanswerable = "Can I bring my emotional support peacock in the cabin?"
    evp = [CORPUS[i] for i in retrieve(unanswerable, k=5)]
    print(f"    critic {max(ce.predict([(unanswerable, p) for p in evp])):+7.2f}   {unanswerable}")
    print("    a critic set to exit above +3.00 never approves this, and the")
    print("    step budget is the only thing that ends the loop.")

    # ---------------------------------------------------------------- 4
    print()
    print("=" * 74)
    print("4. WHAT THE LOOP COSTS")
    print("=" * 74)
    n = lambda s: len(enc.encode(s))
    terse_t, detail_t = n(toolblock(TERSE)), n(toolblock(DETAILED))
    plus_t = n(toolblock(plus))
    print(f"\n  tool block, 4 terse tools           {terse_t:6d} tokens")
    print(f"  tool block, 4 detailed tools        {detail_t:6d} tokens   "
          f"(+{detail_t-terse_t}, {detail_t/terse_t:.1f}x)")
    print(f"  tool block, 5 detailed tools        {plus_t:6d} tokens")
    print(f"  + tool-use system prompt, Opus 5       286 tokens   (documented, tool_choice auto)")
    print(f"  fixed per request, detailed set      {detail_t+286:6d} tokens, paid on every step")

    # A step: the model's tool call, plus five retrieved passages coming back.
    call = n(json.dumps({"type": "tool_use", "id": "toolu_01A09q90qw90lq917835lq9",
                         "name": "search_policy_pages", "input": {"query": HOP2_QUERY}}))
    result = n(json.dumps({"type": "tool_result", "tool_use_id": "toolu_01A09q90qw90lq917835lq9",
                           "content": "\n\n".join(CORPUS[i] for i in hop1)}))
    step = call + result
    question = n(Q4)
    fixed = detail_t + 286 + question
    print(f"\n  one tool_use block                  {call:6d} tokens")
    print(f"  one tool_result, five passages      {result:6d} tokens")
    print(f"  one step adds                       {step:6d} tokens to the transcript")

    print("\n  cumulative INPUT tokens, because every step re-sends the whole transcript:")
    print(f"    {'step':>5} {'this request':>13} {'cumulative':>11} {'vs 1 step':>10}")
    total, first = 0, None
    for s in range(1, 11):
        req = fixed + step * (s - 1)
        total += req
        if s == 1:
            first = total
        print(f"    {s:5d} {req:13d} {total:11d} {total/first:9.1f}x")
    for s in range(11, 31):
        total += fixed + step * (s - 1)
    print(f"    {30:5d} {fixed+step*29:13d} {total:11d} {total/first:9.1f}x   "
          f"<- the runaway cap")

    for budget in (3, 6, 30):
        t = sum(fixed + step * (s - 1) for s in range(1, budget + 1))
        print(f"\n  budget {budget:2d} steps: {t:7d} input tokens"
              f"   ({t/first:.1f}x a single call)")


if __name__ == "__main__":
    main()
