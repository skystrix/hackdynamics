"""text2query.py — Chapter 22, "Structured Retrievers".

Larkspur's Q3, "How many refund tickets were opened in March?", has no chunk
that answers it. It has a table. This script builds that table, runs the
queries a model would write, and measures what goes wrong.

Everything here executes. SQLite is the relational engine and Kuzu is the
graph engine, so both the SQL and the Cypher halves produce real answers
rather than illustrative ones.

Measured:

  1. the gap: what retrieval returns for a counting question, next to what
     the database returns;
  2. the schema gap: how far the words in the question sit from the table and
     column names that answer it, which is Chapter 14's query gap moved onto
     the schema;
  3. what a schema costs in the prompt, and what retrieving the schema saves
     (LlamaIndex's ObjectIndex shape, measured with tiktoken);
  4. the two failure classes: queries that raise, and queries that run and
     return a confident wrong number;
  5. read-only execution, demonstrated against the engine rather than asserted
     in a prompt;
  6. the same question in Cypher, on a real graph.

No model API is reachable from this machine, so every "generated" query below
is written by hand in the shape the named failure produces. The queries are
real, their results are real, and the generation step is the part that is
stood in for.

    PYTHONPATH=<scratch>/pylib HF_HOME=<scratch>/hf python3 text2query.py
"""

import os
import shutil
import sqlite3
import tempfile

Q3 = "How many refund tickets were opened in March?"

SCHEMA = """
CREATE TABLE passengers (
  passenger_id INTEGER PRIMARY KEY,
  full_name    TEXT NOT NULL,
  club_tier    TEXT
);
CREATE TABLE bookings (
  booking_ref  TEXT PRIMARY KEY,
  passenger_id INTEGER REFERENCES passengers(passenger_id),
  fare_class   TEXT NOT NULL,
  booked_at    TEXT NOT NULL
);
CREATE TABLE segments (
  booking_ref  TEXT REFERENCES bookings(booking_ref),
  segment_no   INTEGER,
  flight_no    TEXT NOT NULL,
  dep_date     TEXT NOT NULL,
  PRIMARY KEY (booking_ref, segment_no)
);
CREATE TABLE tickets (
  ticket_id    INTEGER PRIMARY KEY,
  booking_ref  TEXT REFERENCES bookings(booking_ref),
  opened_at    TEXT NOT NULL,
  category     TEXT NOT NULL CHECK (category IN
                 ('refund','baggage','booking','assistance')),
  status       TEXT NOT NULL
);
"""

# Eight more tables, named and described only, standing in for the rest of an
# airline's schema. Used for the prompt-cost and schema-retrieval measurement.
OTHER_TABLES = {
    "flights": "Scheduled flights: flight_no, origin, destination, std, sta, aircraft_reg.",
    "aircraft": "Fleet register: aircraft_reg, type, seats, delivered_on.",
    "fares": "Published fares: fare_class, route, price_eur, refundable, valid_from.",
    "payments": "Payments taken: payment_id, booking_ref, amount_eur, method, taken_at.",
    "refund_lines": "Money actually returned: refund_id, ticket_id, amount_eur, settled_at, instrument.",
    "baggage": "Checked bags: bag_tag, booking_ref, weight_kg, status, last_seen_at.",
    "crew_roster": "Crew duty assignments: crew_id, flight_no, duty_date, role.",
    "airports": "Airport reference: iata, name, country, timezone.",
}

TABLE_DESCRIPTIONS = {
    "passengers": "People who fly: passenger_id, full_name, club_tier.",
    "bookings": "A purchase: booking_ref, passenger_id, fare_class, booked_at.",
    "segments": "The individual flights inside a booking: booking_ref, segment_no, flight_no, dep_date.",
    "tickets": "Customer support cases, one row per case: ticket_id, booking_ref, opened_at, "
               "category (refund, baggage, booking or assistance), status.",
    **OTHER_TABLES,
}

# Questions for the schema-retrieval measurement, labelled with the tables a
# correct query has to touch.
SCHEMA_QUESTIONS = [
    (Q3, {"tickets"}),
    ("Which passengers opened a refund ticket and also lost a bag?", {"tickets", "bookings", "passengers", "baggage"}),
    ("How much money did we return last quarter?", {"refund_lines"}),
    ("What is the average price of a refundable fare to Palermo?", {"fares"}),
    ("Which aircraft flew the most segments in March?", {"segments", "flights", "aircraft"}),
    ("How many Club members hold a booking in fare class Y?", {"passengers", "bookings"}),
]


def build(path):
    """A small, honest Larkspur database. Multi-segment bookings are the point."""
    db = sqlite3.connect(path)
    db.executescript(SCHEMA)
    passengers = [(i, f"Passenger {i:02d}", "Club" if i % 4 == 0 else None) for i in range(1, 21)]
    db.executemany("INSERT INTO passengers VALUES (?,?,?)", passengers)

    bookings, segments = [], []
    for i in range(1, 41):
        ref = f"LK{1000+i}"
        bookings.append((ref, (i % 20) + 1, "YBMHQLKT"[i % 8], f"2026-0{1+(i%3)}-{(i%27)+1:02d}"))
        # Half the bookings are return trips, and a few are multi-leg. This is
        # the fan-out that makes a wrong join silently over-count.
        legs = 1 if i % 3 == 0 else (2 if i % 5 else 3)
        for s in range(1, legs + 1):
            segments.append((ref, s, f"LK{200+((i+s) % 60)}", f"2026-0{1+((i+s) % 3)}-{((i*s) % 27)+1:02d}"))
    db.executemany("INSERT INTO bookings VALUES (?,?,?,?)", bookings)
    db.executemany("INSERT INTO segments VALUES (?,?,?,?)", segments)

    # Tickets. March 2026 is the month the question asks about. There are also
    # March 2025 tickets, which is the trap in the second wrong query.
    tickets = []
    tid = 8800
    plan = [
        ("2026-03", "refund", 12), ("2026-03", "baggage", 7), ("2026-03", "booking", 4),
        ("2026-02", "refund", 9), ("2026-01", "refund", 6), ("2026-04", "refund", 5),
        ("2025-03", "refund", 8), ("2025-03", "baggage", 3), ("2026-02", "assistance", 2),
    ]
    for month, cat, n in plan:
        for k in range(n):
            tid += 1
            ref = bookings[(tid + k) % len(bookings)][0]
            tickets.append((tid, ref, f"{month}-{(k % 27)+1:02d}", cat, "closed" if k % 3 else "open"))
    db.executemany("INSERT INTO tickets VALUES (?,?,?,?,?)", tickets)
    db.commit()
    return db


def show(db, label, sql):
    print(f"\n  {label}")
    for line in sql.strip().split("\n"):
        print(f"    | {line}")
    try:
        rows = db.execute(sql).fetchall()
        print(f"    -> {rows}")
        return rows
    except Exception as e:
        print(f"    -> {type(e).__name__}: {e}")
        return None


def main():
    tmp = tempfile.mkdtemp()
    path = os.path.join(tmp, "larkspur.db")
    db = build(path)

    print("=" * 74)
    print("1. THE GAP: a counting question against a corpus and against a table")
    print("=" * 74)
    try:
        from querygap import CORPUS, BM25, ranking
        order = ranking(BM25(CORPUS).score(Q3))[:3]
        print(f"\n  question: {Q3}")
        print("  what retrieval returns from the 56-passage corpus:")
        for r, d in enumerate(order, 1):
            print(f"    {r}. doc {d:2d}  {CORPUS[d][:64]}...")
        print("  none of them contains a count. There is no chunk to find.")
    except Exception as e:
        print(f"  (corpus unavailable: {e})")

    truth = show(db, "the query that answers it", """
SELECT COUNT(*) FROM tickets
WHERE category = 'refund' AND opened_at >= '2026-03-01' AND opened_at < '2026-04-01'
""")
    gold = truth[0][0]
    print(f"\n  the answer is {gold}, and it exists nowhere in any passage.")

    # ---------------------------------------------------------------- 2
    print()
    print("=" * 74)
    print("2. THE SCHEMA GAP: the question's words against the schema's words")
    print("=" * 74)
    try:
        from sentence_transformers import SentenceTransformer
        st = SentenceTransformer("sentence-transformers/all-MiniLM-L6-v2")
        phrases = ["refund tickets", "opened in March", "how many"]
        targets = {
            "tickets (table)": "tickets",
            "category (column)": "category",
            "'refund' (a value in category)": "refund",
            "opened_at (column)": "opened_at",
            "refunds (a table that does not exist)": "refunds",
            "refund_lines (a table that does exist)": "refund_lines",
        }
        q = st.encode(phrases, normalize_embeddings=True)
        t = st.encode(list(targets.values()), normalize_embeddings=True)
        print(f"\n    {'question phrase':<22}" + "".join(f"{k[:20]:>22}" for k in targets))
        for i, p in enumerate(phrases):
            print(f"    {p:<22}" + "".join(f"{float(q[i] @ t[j]):>22.3f}" for j in range(len(targets))))
        print("\n  'refund tickets' is closest to a table that does not exist, and to")
        print("  refund_lines, which holds money rather than cases. The word that")
        print("  matters, category='refund', is a VALUE, and values are not in the DDL.")
    except Exception as e:
        print(f"  (embeddings unavailable: {e})")

    # ---------------------------------------------------------------- 3
    print()
    print("=" * 74)
    print("3. WHAT THE SCHEMA COSTS IN THE PROMPT")
    print("=" * 74)
    try:
        import tiktoken
        enc = tiktoken.get_encoding("cl100k_base")
        n = lambda s: len(enc.encode(s))
        core = n(SCHEMA)
        full_ddl = SCHEMA + "\n".join(f"CREATE TABLE {t} ( -- {d}\n);" for t, d in OTHER_TABLES.items())
        print(f"\n  the 4 core tables, as DDL              {core:6d} tokens")
        print(f"  all 12 tables                          {n(full_ddl):6d} tokens")
        print(f"  extrapolated to 200 tables             {round(n(full_ddl)/12*200):6d} tokens   "
              f"(a real airline schema is larger)")
        print(f"  Chapter 17's 4k working budget           4096 tokens")
        print("\n  Past a few dozen tables the schema stops fitting, so the schema")
        print("  itself gets retrieved. Measured, retrieving the top 3 tables per")
        print("  question by embedding the table descriptions:")
        from sentence_transformers import SentenceTransformer
        st = SentenceTransformer("sentence-transformers/all-MiniLM-L6-v2")
        names = list(TABLE_DESCRIPTIONS)
        emb = st.encode([f"{k}: {v}" for k, v in TABLE_DESCRIPTIONS.items()], normalize_embeddings=True)
        hits = 0
        for q, needed in SCHEMA_QUESTIONS:
            qv = st.encode([q], normalize_embeddings=True)[0]
            top = sorted(range(len(names)), key=lambda i: -float(qv @ emb[i]))[:3]
            got = {names[i] for i in top}
            ok = needed <= got
            hits += ok
            print(f"    {'OK  ' if ok else 'MISS'} {q[:48]:<48} -> {sorted(got)}")
            if not ok:
                print(f"         missing {sorted(needed - got)}")
        print(f"    {hits}/{len(SCHEMA_QUESTIONS)} questions had every table they needed in the top 3")
        print("    A missing table is unrecoverable: the query cannot be written at all.")
    except Exception as e:
        print(f"  (tokeniser unavailable: {e})")

    # ---------------------------------------------------------------- 4
    print()
    print("=" * 74)
    print("4. TWO FAILURE CLASSES: the loud one and the silent one")
    print("=" * 74)
    print("\n  LOUD. The engine refuses, so an error-feedback loop can repair it.")
    show(db, "hallucinated table, from the terminology gap in section 2", """
SELECT COUNT(*) FROM refunds WHERE month = 'March'
""")
    show(db, "hallucinated column on a real table", """
SELECT COUNT(*) FROM tickets WHERE ticket_type = 'refund'
""")

    print("\n  SILENT. Each of these runs, returns a number, and is wrong.")
    a = show(db, "wrong join: fans out over multi-segment bookings", """
SELECT COUNT(*) FROM tickets t
JOIN bookings b ON b.booking_ref = t.booking_ref
JOIN segments s ON s.booking_ref = b.booking_ref
WHERE t.category = 'refund'
  AND t.opened_at >= '2026-03-01' AND t.opened_at < '2026-04-01'
""")
    b = show(db, "wrong date predicate: every March, not this March", """
SELECT COUNT(*) FROM tickets
WHERE category = 'refund' AND strftime('%m', opened_at) = '03'
""")
    c = show(db, "wrong grain: counts complaining customers, not tickets", """
SELECT COUNT(DISTINCT b.passenger_id) FROM tickets t
JOIN bookings b ON b.booking_ref = t.booking_ref
WHERE t.category = 'refund'
  AND t.opened_at >= '2026-03-01' AND t.opened_at < '2026-04-01'
""")
    print(f"\n    correct answer          {gold}")
    print(f"    wrong join              {a[0][0]}   ({a[0][0]/gold:.1f}x, and it looks plausible)")
    print(f"    every March             {b[0][0]}")
    print(f"    wrong grain             {c[0][0]}")
    print("\n  All three parse, execute, and return an integer. No exception, no")
    print("  empty result, nothing for a retry loop to react to. The failure rate")
    print("  you can SEE is the loud class only.")

    # ---------------------------------------------------------------- 5
    print()
    print("=" * 74)
    print("5. READ-ONLY, ENFORCED BY THE ENGINE RATHER THAN THE PROMPT")
    print("=" * 74)
    ro = sqlite3.connect(f"file:{path}?mode=ro", uri=True)
    show(ro, "a destructive statement against a read-only connection", "DROP TABLE tickets")
    show(ro, "and the same connection still answers questions", """
SELECT COUNT(*) FROM tickets WHERE category = 'refund'
""")

    print("\n  A runaway query, and the cap that stops it:")
    show(db, "cartesian product across three tables, unbounded", """
SELECT COUNT(*) FROM tickets, bookings, segments
""")
    interrupts = {"n": 0}

    def guard():
        interrupts["n"] += 1
        return 1 if interrupts["n"] > 200 else 0

    db.set_progress_handler(guard, 1000)
    show(db, "the same query with a progress handler set to abort", """
SELECT COUNT(*) FROM tickets, bookings, segments, passengers
""")
    db.set_progress_handler(None, 0)
    print(f"    the handler fired {interrupts['n']} times before aborting the statement")

    # ---------------------------------------------------------------- 6
    print()
    print("=" * 74)
    print("6. THE SAME QUESTION IN CYPHER, ON A REAL GRAPH")
    print("=" * 74)
    try:
        import kuzu
        gpath = os.path.join(tmp, "graph")
        conn = kuzu.Connection(kuzu.Database(gpath))
        conn.execute("CREATE NODE TABLE Passenger(passenger_id INT64, full_name STRING, PRIMARY KEY(passenger_id))")
        conn.execute("CREATE NODE TABLE Booking(booking_ref STRING, fare_class STRING, PRIMARY KEY(booking_ref))")
        conn.execute("CREATE NODE TABLE Ticket(ticket_id INT64, opened_at STRING, category STRING, PRIMARY KEY(ticket_id))")
        conn.execute("CREATE NODE TABLE Segment(seg_id STRING, flight_no STRING, PRIMARY KEY(seg_id))")
        conn.execute("CREATE REL TABLE HOLDS(FROM Passenger TO Booking)")
        conn.execute("CREATE REL TABLE RAISED_ON(FROM Ticket TO Booking)")
        conn.execute("CREATE REL TABLE INCLUDES(FROM Booking TO Segment)")
        for pid, name, _ in db.execute("SELECT * FROM passengers").fetchall():
            conn.execute("CREATE (:Passenger {passenger_id: $i, full_name: $n})", {"i": pid, "n": name})
        for ref, pid, fc, _ in db.execute("SELECT * FROM bookings").fetchall():
            conn.execute("CREATE (:Booking {booking_ref: $r, fare_class: $f})", {"r": ref, "f": fc})
            conn.execute("MATCH (p:Passenger {passenger_id: $i}), (b:Booking {booking_ref: $r}) CREATE (p)-[:HOLDS]->(b)",
                         {"i": pid, "r": ref})
        for ref, sno, fno, _ in db.execute("SELECT * FROM segments").fetchall():
            sid = f"{ref}-{sno}"
            conn.execute("CREATE (:Segment {seg_id: $s, flight_no: $f})", {"s": sid, "f": fno})
            conn.execute("MATCH (b:Booking {booking_ref: $r}), (s:Segment {seg_id: $s}) CREATE (b)-[:INCLUDES]->(s)",
                         {"r": ref, "s": sid})
        for tid, ref, opened, cat, _ in db.execute("SELECT * FROM tickets").fetchall():
            conn.execute("CREATE (:Ticket {ticket_id: $t, opened_at: $o, category: $c})",
                         {"t": tid, "o": opened, "c": cat})
            conn.execute("MATCH (t:Ticket {ticket_id: $t}), (b:Booking {booking_ref: $r}) CREATE (t)-[:RAISED_ON]->(b)",
                         {"t": tid, "r": ref})

        def cypher(label, q):
            print(f"\n  {label}")
            for line in q.strip().split("\n"):
                print(f"    | {line}")
            try:
                r = conn.execute(q)
                out = []
                while r.has_next():
                    out.append(r.get_next())
                print(f"    -> {out[:6]}")
                return out
            except Exception as e:
                print(f"    -> {type(e).__name__}: {e}")
                return None

        cypher("Q3, the same count, expressed as a pattern", """
MATCH (t:Ticket)
WHERE t.category = 'refund' AND t.opened_at >= '2026-03-01' AND t.opened_at < '2026-04-01'
RETURN count(t)
""")
        cypher("the SAME fan-out bug, in Cypher: traversing to segments inflates it too", """
MATCH (t:Ticket)-[:RAISED_ON]->(b:Booking)-[:INCLUDES]->(s:Segment)
WHERE t.category = 'refund' AND t.opened_at >= '2026-03-01' AND t.opened_at < '2026-04-01'
RETURN count(t), count(DISTINCT t)
""")
        cypher("grain, made visible by the pattern: tickets against people", """
MATCH (t:Ticket)-[:RAISED_ON]->(b:Booking)<-[:HOLDS]-(p:Passenger)
WHERE t.category = 'refund' AND t.opened_at >= '2026-03-01' AND t.opened_at < '2026-04-01'
RETURN count(DISTINCT t), count(DISTINCT p)
""")
        cypher("the question SQL needs three joins for", """
MATCH (p:Passenger)-[:HOLDS]->(b:Booking)<-[:RAISED_ON]-(t:Ticket)
WHERE t.category = 'refund'
WITH p, count(t) AS n WHERE n > 1
RETURN p.full_name, n ORDER BY n DESC
""")
        cypher("a hallucinated label fails loudly, exactly as a bad table does", """
MATCH (r:Refund) RETURN count(r)
""")
    except Exception as e:
        print(f"  (kuzu unavailable: {type(e).__name__}: {e})")

    shutil.rmtree(tmp, ignore_errors=True)


if __name__ == "__main__":
    main()
