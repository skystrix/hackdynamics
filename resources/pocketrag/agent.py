"""PocketRAG, layer 5d: the agent.  Chapter 36.

Chapters 20 and 21 turned the straight line into a loop; Chapter 22 sent a
question to a table instead of a corpus. This puts both behind one entry point:
three tools, a router that picks one, a critic that decides whether the result
is good enough, and a step budget so the loop cannot run forever.

  keyword(q)   BM25 over the chunk index          (chapter 33)
  vector(q)    the HNSW graph                     (chapter 34)
  sql(q)       a count over the Larkspur tables   (chapter 22)

The two questions the flat pipeline could not answer are the test: Q3 needs a
table, Q4 needs two hops. Neither is reachable by retrieving once.

The router and the critic are deterministic. A deployed agent asks a model to
choose the tool and to judge the result; here the choosing is a set of rules
over the question and the judging is a set of rules over the result, so the
control flow is visible and reproducible and costs nothing. What that
substitution hides is measured at the end of the chapter, not papered over.

    python3 agent.py <db> "a question"
    python3 agent.py <db> --tables      build the relational half and stop
"""
import re, sqlite3, sys

STEP_BUDGET = 6

# Chapter 22's Larkspur tables, reproduced here so PocketRAG stays
# self-contained. Same schema and the same rows, so the count agrees.
SCHEMA = """
CREATE TABLE IF NOT EXISTS passengers (
  passenger_id INTEGER PRIMARY KEY,
  full_name    TEXT NOT NULL,
  club_tier    TEXT);
CREATE TABLE IF NOT EXISTS bookings (
  booking_ref  TEXT PRIMARY KEY,
  passenger_id INTEGER REFERENCES passengers(passenger_id),
  fare_class   TEXT NOT NULL,
  booked_at    TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS tickets (
  ticket_id    INTEGER PRIMARY KEY,
  booking_ref  TEXT REFERENCES bookings(booking_ref),
  opened_at    TEXT NOT NULL,
  category     TEXT NOT NULL CHECK (category IN
                 ('refund','baggage','booking','assistance')),
  status       TEXT NOT NULL);
"""

# Month, category, count. March 2025 exists so that a query which forgets the
# year is wrong by a plausible amount rather than by an obvious one.
TICKET_PLAN = [
    ("2026-03", "refund", 12), ("2026-03", "baggage", 7), ("2026-03", "booking", 4),
    ("2026-02", "refund", 9), ("2026-01", "refund", 6), ("2026-04", "refund", 5),
    ("2025-03", "refund", 8), ("2025-03", "baggage", 3), ("2026-02", "assistance", 2),
]

MONTHS = {m: i + 1 for i, m in enumerate(
    ["january", "february", "march", "april", "may", "june", "july",
     "august", "september", "october", "november", "december"])}


def build_tables(db: sqlite3.Connection) -> None:
    """The structured half of the Larkspur corpus. Chapter 32's loaders read
    text, so nothing so far has put a table in the database; a counting
    question has had nowhere to land."""
    db.executescript(SCHEMA)
    if db.execute("SELECT COUNT(*) FROM tickets").fetchone()[0]:
        return
    passengers = [(i, f"Passenger {i:02d}", "Club" if i % 4 == 0 else None)
                  for i in range(1, 21)]
    bookings = [(f"LK{1000+i}", (i % 20) + 1, "YBMHQLKT"[i % 8],
                 f"2026-0{1+(i%3)}-{(i%27)+1:02d}") for i in range(1, 41)]
    tickets, tid = [], 8800
    for month, cat, n in TICKET_PLAN:
        for k in range(n):
            tid += 1
            tickets.append((tid, bookings[(tid + k) % len(bookings)][0],
                            f"{month}-{(k % 27)+1:02d}", cat, "closed" if k % 3 else "open"))
    with db:
        db.executemany("INSERT INTO passengers VALUES (?,?,?)", passengers)
        db.executemany("INSERT INTO bookings VALUES (?,?,?,?)", bookings)
        db.executemany("INSERT INTO tickets VALUES (?,?,?,?,?)", tickets)


# -------------------------------------------------------------------- tools
# Each retrieval tool proposes candidates; the agent reranks them before
# judging, so the number the critic reads is the same cross-encoder logit
# chapter 35 refused on. One score, two jobs: ordering and stopping.
def tool_keyword(db, q: str, seen: set[str], k: int = 20):
    from bm25 import search
    return [cid for cid, _ in search(db, q, k=None) if cid not in seen][:k]


def tool_vector(db, q: str, seen: set[str], model, graph, k: int = 20):
    import array
    qv = array.array("f", model.encode([q], normalize_embeddings=True)[0].tolist())
    return [cid for cid, _ in graph.search(qv, k=k * 2, ef=128) if cid not in seen][:k]


def tool_sql(db, q: str):
    """Text to SQL for one family of question: how many <category> tickets in
    <month> [<year>]. Chapter 22 has a model write arbitrary SQL; this reads
    the question against the schema's own vocabulary, which is enough to show
    the agent's control flow and honest about being a fraction of the job.

    Returns (sql, rows, note). The note carries the ambiguity, because a
    question that does not name a year has two defensible answers."""
    low = q.lower()
    cats = [c for c in ("refund", "baggage", "booking", "assistance") if c in low]
    months = [m for m in MONTHS if m in low]
    if "how many" not in low and "count" not in low:
        return None, None, "not a counting question"
    if not cats or not months:
        return None, None, "no category or no month found in the schema's vocabulary"
    mm = f"{MONTHS[months[0]]:02d}"
    years = re.findall(r"\b(20\d{2})\b", q)
    if years:
        sql = ("SELECT COUNT(*) FROM tickets WHERE category = ? "
               "AND opened_at >= ? AND opened_at < ?")
        lo = f"{years[0]}-{mm}-01"
        hi = f"{int(years[0]) + (mm == '12')}-{int(mm) % 12 + 1:02d}-01"
        rows = db.execute(sql, (cats[0], lo, hi)).fetchall()
        return sql, rows, f"year {years[0]} taken from the question"
    # No year. Report both readings rather than picking one silently.
    every = db.execute(
        "SELECT COUNT(*) FROM tickets WHERE category = ? AND strftime('%m', opened_at) = ?",
        (cats[0], mm)).fetchall()
    latest = db.execute(
        "SELECT COUNT(*) FROM tickets WHERE category = ? AND opened_at >= ? "
        "AND opened_at < ?", (cats[0], f"2026-{mm}-01",
                              f"2026-{int(mm) % 12 + 1:02d}-01")).fetchall()
    return ("SELECT COUNT(*) FROM tickets WHERE category = ? "
            "AND opened_at >= ? AND opened_at < ?"), latest, (
        f"no year given: {latest[0][0]} in the most recent year, "
        f"{every[0][0]} across every year")


# ------------------------------------------------------------------- router
def route(q: str, tried: set[str]) -> str:
    """Which tool to try next. Counting questions go to the table because no
    chunk holds a count; everything else starts with the two retrievers."""
    low = q.lower()
    if ("how many" in low or "count" in low) and "sql" not in tried:
        return "sql"
    if "keyword" not in tried:
        return "keyword"
    if "vector" not in tried:
        return "vector"
    return "stop"


# ------------------------------------------------------------------- critic
FOLLOW_UP = re.compile(r"\b(?:the\s+)?([a-z][a-z -]{3,40}?)\s+(policy|clause|procedure)\b")

ACCEPT_ABOVE = 2.0        # the chapter-35 threshold, reused as a stop signal


def critique(db, q: str, tool: str, result) -> tuple[bool, str | None]:
    """Stop, or say what to look up next.

    Three rules, all from earlier chapters. A SQL result that came back empty
    is a wrong query and not an absent answer. A reranked passage scoring below
    the chapter-18 threshold is not worth stopping on. And a passage that names
    a policy the question did not name is chapter 20's second hop.

    Two traps sit in that last rule. The trigger noun cannot be part of the
    comparison, because a question about a policy contains the word 'policy'
    and would match every time. And a passage that names ITSELF, as the
    no-show policy does in its own first sentence, is not pointing anywhere:
    the phrase has to name a document other than the one being read."""
    if tool == "sql":
        _, rows, _ = result
        return bool(rows) and rows[0][0] > 0, None
    if not result:
        return False, None
    top_id, top_score = result[0]
    text = db.execute("SELECT text FROM chunks WHERE chunk_id=?", (top_id,)).fetchone()[0]
    title = text.split(".")[0].lower()
    m = FOLLOW_UP.search(text.lower())
    if m:
        phrase, modifier = f"{m.group(1)} {m.group(2)}", m.group(1)
        asked = q.lower()
        points_elsewhere = phrase not in title and modifier not in asked
        if points_elsewhere:
            return False, phrase
    return top_score >= ACCEPT_ABOVE, None


# -------------------------------------------------------------------- loop
def run(db, question: str, model=None, graph=None, ce=None):
    """Route, act, critique, and stop: on an answer, on the budget, or when
    there is nothing left to try. `seen` is what earlier hops already read, and
    excluding it is what stops hop two rediscovering hop one."""
    from answer import rerank
    trace, tried, seen, q = [], set(), set(), question
    for step in range(1, STEP_BUDGET + 1):
        tool = route(q, tried)
        if tool == "stop":
            trace.append((step, "stop", q, "no tool left to try"))
            break
        tried.add(tool)
        if tool == "sql":
            result = tool_sql(db, q)
            shown = f"-> {result[1]}  ({result[2]})"
        else:
            if tool == "vector" and model is None:
                trace.append((step, "vector", q, "unavailable without a model"))
                continue
            cands = (tool_keyword(db, q, seen) if tool == "keyword"
                     else tool_vector(db, q, seen, model, graph))
            result = (rerank(db, q, cands, ce, k=len(cands)) if ce and cands
                      else [(c, 0.0) for c in cands])
            seen |= {c for c, _ in result[:3]}
            shown = "  ".join(f"{c[:8]}{s:+.2f}" for c, s in result[:3])
        ok, follow = critique(db, q, tool, result)
        trace.append((step, tool, q, shown + ("   ACCEPT" if ok else "   reject")))
        if ok:
            return {"answer": result, "tool": tool, "steps": step, "trace": trace,
                    "question": q}
        if follow:
            q, tried = follow, set()          # the new thing alone, fresh tools
            trace.append((step, "rewrite", q, "critic asked for another hop"))
    return {"answer": None, "tool": None, "steps": len(trace), "trace": trace,
            "question": q}


def main(argv):
    db = sqlite3.connect(argv[1])
    build_tables(db)
    if "--tables" in argv:
        for t in ("passengers", "bookings", "tickets"):
            n = db.execute(f"SELECT COUNT(*) FROM {t}").fetchone()[0]
            print(f"  {t:12s} {n:4d} rows")
        return
    model = graph = ce = None
    try:
        from sentence_transformers import SentenceTransformer, CrossEncoder
        from hnsw import HNSW, load_vectors
        from embed import MODEL
        model = SentenceTransformer(MODEL)
        ce = CrossEncoder("cross-encoder/ms-marco-MiniLM-L-6-v2")
        graph = HNSW.load(db, load_vectors(db))
    except Exception as e:
        print(f"  (models unavailable: {type(e).__name__})")
    res = run(db, argv[2], model, graph, ce)
    for step, tool, q, shown in res["trace"]:
        print(f"  {step}. {tool:8s} {q[:46]:46s} {shown}")
    print(f"\n  {'answered' if res['answer'] else 'no answer'} "
          f"by {res['tool']} in {res['steps']} steps")


if __name__ == "__main__":
    main(sys.argv)
