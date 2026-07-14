/* ==========================================================================
   bookData-additions3.js — the classic CS-curriculum chapters
   Chapter 3 — Relational Design: ER Diagrams, Dependencies & Normal Forms
   Chapter 4 — Speaking to the Database: Relational Algebra & SQL
   Original explanatory writing; same schema as the other bookData files.
   ========================================================================== */

/* ======================= CHAPTER 3 ======================= */
CHAPTERS.push({
  num: 3, part: 1, title: "Relational Design: ER Diagrams, Dependencies & Normal Forms",
  blurb: "Before you store anything, you have to decide how to organize it into tables, and there's a well-worn theory for doing that well. This chapter covers how to sketch your data as things (entities) and the relationships between them, how to turn that sketch into tables, and the step-by-step rules (the normal forms) for splitting tables so no fact is ever stored in two places. You'll also see exactly what goes wrong when you don't, so the rules feel like plain common sense rather than ceremony.",
  sections: [
    { title: "Entity-Relationship Modeling",
      html: "<p>Design starts a level above tables. An <strong>ER model</strong> describes the world in three vocabularies:</p>" +
      "<ul><li><strong>Entities</strong> — the things (Student, Course, Invoice), each with <strong>attributes</strong>: <em>simple</em> (name), <em>composite</em> (address = street + city + zip), <em>multivalued</em> (phone numbers — drawn with a double oval), and <em>derived</em> (age, computable from birth date — store the source, derive the rest).</li>" +
      "<li><strong>Relationships</strong> — how things connect (Student <em>enrolls in</em> Course), possibly with their own attributes (enrollment date lives on the relationship, not on either entity).</li>" +
      "<li><strong>Constraints</strong> — <strong>cardinality</strong> (1:1, 1:N, M:N) and <strong>participation</strong> (must every student enroll in something? total vs partial participation).</li></ul>" +
      "<p><strong>Weak entities</strong> deserve their special double-rectangle: an OrderLine has no identity without its Order — its key is the owner's key plus a <em>partial key</em> (line number), and it lives and dies with its owner.</p>" +
      "<h3>Mapping ER to Relations</h3>" +
      "<p>The translation rules are mechanical, which is the point:</p>" +
      "<ul><li>Entity → table; composite attributes flatten into columns; multivalued attributes split into their <em>own</em> table (foreshadowing 1NF).</li>" +
      "<li>1:N relationship → foreign key on the N side (each Course row carries its department's key).</li>" +
      "<li>M:N relationship → a <strong>junction table</strong> holding both foreign keys (Enrollment(student_id, course_id, date)) — its primary key is usually the pair.</li>" +
      "<li>1:1 → a foreign key on either side (choose the side with total participation, and make it UNIQUE).</li>" +
      "<li>Weak entity → table whose primary key is (owner's key, partial key), with a cascading foreign key.</li></ul>" +
      "<div class='fig'><svg viewBox='0 0 760 250' xmlns='http://www.w3.org/2000/svg' font-family='Menlo,monospace'>" +
      "<text x='190' y='24' text-anchor='middle' fill='#2de2ff' font-size='12.5'>ER diagram</text>" +
      "<rect x='60' y='55' width='120' height='44' rx='4' fill='#111a2e' stroke='#4f7cff' stroke-width='2'/>" +
      "<text x='120' y='82' text-anchor='middle' fill='#c9d6ea' font-size='11.5'>Student</text>" +
      "<path d='M 255 77 L 300 50 L 345 77 L 300 104 Z' fill='#111a2e' stroke='#ffd166' stroke-width='2'/>" +
      "<text x='300' y='81' text-anchor='middle' fill='#ffd166' font-size='10.5'>enrolls</text>" +
      "<rect x='420' y='55' width='120' height='44' rx='4' fill='#111a2e' stroke='#4f7cff' stroke-width='2'/>" +
      "<text x='480' y='82' text-anchor='middle' fill='#c9d6ea' font-size='11.5'>Course</text>" +
      "<line x1='180' y1='77' x2='255' y2='77' stroke='#1c2a45' stroke-width='2'/><text x='217' y='68' text-anchor='middle' fill='#7d8fb0' font-size='10'>M</text>" +
      "<line x1='345' y1='77' x2='420' y2='77' stroke='#1c2a45' stroke-width='2'/><text x='382' y='68' text-anchor='middle' fill='#7d8fb0' font-size='10'>N</text>" +
      "<ellipse cx='300' cy='140' rx='48' ry='17' fill='#111a2e' stroke='#3ddc97' stroke-width='1.5'/>" +
      "<text x='300' y='145' text-anchor='middle' fill='#3ddc97' font-size='9.5'>date</text>" +
      "<line x1='300' y1='104' x2='300' y2='123' stroke='#1c2a45' stroke-width='1.5'/>" +
      "<text x='300' y='178' text-anchor='middle' fill='#7d8fb0' font-size='9.5'>an attribute ON the relationship —</text>" +
      "<text x='300' y='192' text-anchor='middle' fill='#7d8fb0' font-size='9.5'>it belongs to neither entity alone</text>" +
      "<line x1='575' y1='40' x2='575' y2='230' stroke='#1c2a45' stroke-width='1.5' stroke-dasharray='4 5'/>" +
      "<text x='665' y='24' text-anchor='middle' fill='#ffd166' font-size='12.5'>→ relations</text>" +
      "<rect x='600' y='45' width='135' height='34' rx='6' fill='#111a2e' stroke='#4f7cff' stroke-width='1.5'/>" +
      "<text x='667' y='61' text-anchor='middle' fill='#c9d6ea' font-size='9.5'>student(id, name)</text>" +
      "<text x='667' y='73' text-anchor='middle' fill='#7d8fb0' font-size='8.5'>PK: id</text>" +
      "<rect x='600' y='95' width='135' height='34' rx='6' fill='#111a2e' stroke='#4f7cff' stroke-width='1.5'/>" +
      "<text x='667' y='111' text-anchor='middle' fill='#c9d6ea' font-size='9.5'>course(id, title)</text>" +
      "<text x='667' y='123' text-anchor='middle' fill='#7d8fb0' font-size='8.5'>PK: id</text>" +
      "<rect x='600' y='150' width='135' height='48' rx='6' fill='#111a2e' stroke='#ffd166' stroke-width='2'/>" +
      "<text x='667' y='167' text-anchor='middle' fill='#ffd166' font-size='9.5'>enrollment(</text>" +
      "<text x='667' y='179' text-anchor='middle' fill='#c9d6ea' font-size='9.5'>student_id, course_id,</text>" +
      "<text x='667' y='191' text-anchor='middle' fill='#c9d6ea' font-size='9.5'>date) PK: the pair</text>" +
      "<text x='667' y='222' text-anchor='middle' fill='#7d8fb0' font-size='9'>M:N ⇒ junction table</text>" +
      "</svg><div class='fig-cap'>Left, the ER vocabulary: rectangles are entities, the diamond is a relationship carrying its own attribute (the enrollment date), M:N its cardinality. Right, the mechanical translation: each entity becomes a table, and the M:N relationship becomes a junction table whose primary key is the pair of foreign keys — with the relationship's attribute riding along.</div></div>" },

    { title: "Functional Dependencies & Armstrong's Axioms",
      html: "<p>Normalization needs a formal instrument, and this is it. A <strong>functional dependency</strong> X → Y holds when any two rows agreeing on the attributes X must agree on Y — \"X determines Y.\" <code>student_id → name</code>; <code>(student_id, course_id) → grade</code>. FDs come from the <em>business rules</em>, not from inspecting today's data — data can only disprove an FD, never prove one.</p>" +
      "<p><strong>Armstrong's axioms</strong> generate every implied FD from a given set — sound (nothing false) and complete (nothing missed):</p>" +
      "<ul><li><strong>Reflexivity</strong> — if Y ⊆ X, then X → Y (trivially, a row agreeing on (a,b) agrees on a).</li>" +
      "<li><strong>Augmentation</strong> — X → Y implies XZ → YZ (adding baggage to both sides changes nothing).</li>" +
      "<li><strong>Transitivity</strong> — X → Y and Y → Z imply X → Z.</li></ul>" +
      "<p>The workhorse derived from them is the <strong>attribute closure</strong> X⁺: everything X determines, computed by starting with X and repeatedly applying FDs whose left side you already cover. Closure answers the two exam-and-real-life questions in one move: <em>does X → Y hold?</em> (is Y ⊆ X⁺?) and <em>is X a key?</em> (is X⁺ every attribute?).</p>" +
      "<p>Key vocabulary that follows: a <strong>superkey</strong> determines everything; a <strong>candidate key</strong> is a minimal superkey (drop any attribute and it stops working); the <strong>primary key</strong> is the candidate you crowned; a <strong>prime attribute</strong> appears in some candidate key. Finding all candidate keys is closure-hunting: attributes appearing on no FD's right side must be in every key — start there.</p>" },

    { title: "The Normal Forms", viz: "normalize", vizTitle: "Normalize a messy table, step by step",
      html: "<p>Each normal form eliminates a specific disease. The patient: one big table and its three anomalies — <strong>update</strong> (change a fact stored in many rows, miss one, contradict yourself), <strong>insertion</strong> (can't record a course until someone enrolls), <strong>deletion</strong> (the last enrollment leaves, and the course's existence vanishes with it).</p>" +
      "<ul><li><strong>1NF</strong> — atomic values only: no lists in cells, no repeating column groups (phone1, phone2, phone3…). Multivalued data moves to its own table. This is the price of admission to the relational model itself.</li>" +
      "<li><strong>2NF</strong> — no <em>partial dependencies</em>: with a composite key (student_id, course_id), an attribute like student_name depending on <em>only part</em> of the key must move out. Every non-prime attribute depends on the <em>whole</em> key.</li>" +
      "<li><strong>3NF</strong> — no <em>transitive dependencies</em>: student_id → dept_id → dept_building means dept_building doesn't belong here; it describes the department, not the student. Non-prime attributes depend on keys <em>directly</em>. (The catechism: \"the key, the whole key, and nothing but the key.\")</li>" +
      "<li><strong>BCNF</strong> — the clean generalization: for <em>every</em> nontrivial FD X → Y, X must be a superkey. 3NF-but-not-BCNF cases are the subtle ones where a non-key attribute determines part of a key (a tutor teaches only one subject: (student, subject) is the key, but tutor → subject lurks).</li></ul>" +
      "<p><strong>Decomposition</strong> has two quality bars: <strong>lossless join</strong> (rejoining the pieces reconstructs exactly the original — guaranteed when the shared attributes form a key of one piece; non-negotiable) and <strong>dependency preservation</strong> (every FD checkable within a single table, no joins needed to enforce a rule — desirable). The famous tension: BCNF can always be reached losslessly but sometimes only by sacrificing dependency preservation; 3NF (via the <em>synthesis algorithm</em>) guarantees both. That's why 3NF, not BCNF, is the standard practical target.</p>" +
      "<div class='callout'>Walk the visualization above: one anomaly-ridden table decomposed step by step — watch each normal form remove a specific redundancy, and check that the pieces rejoin losslessly.</div>" },

    { title: "Higher Normal Forms & Design Judgment",
      html: "<h3>4NF: Multivalued Dependencies</h3>" +
      "<p>A table of (instructor, skill, language) where skills and languages vary <em>independently</em> must store their full cross-product — pure combinatorial redundancy with no FD in sight. That independence is a <strong>multivalued dependency</strong> (instructor ↠ skill), and <strong>4NF</strong> demands such independent facts live in separate tables: (instructor, skill) and (instructor, language).</p>" +
      "<h3>5NF and Beyond</h3>" +
      "<p><strong>5NF</strong> (project-join normal form) handles the exotic endgame: tables that can only be reconstructed losslessly by joining <em>three or more</em> projections (join dependencies). Rare in practice, examined in theory. <strong>6NF</strong> — decomposition down to (key, single attribute) — resurfaces in temporal databases and, amusingly, in column stores: Chapter 13's layout is 6NF wearing a performance costume.</p>" +
      "<h3>Judgment</h3>" +
      "<p>The mature position: normalize to 3NF/BCNF as the <em>default</em> for transactional schemas — anomalies are real bugs that page real engineers — and denormalize <em>selectively, later, measurably</em>, when a join is provably the bottleneck (Chapter 2's discipline). Analytics schemas (Chapter 13's star schema) denormalize by design because their data is append-only history: no updates, no update anomalies, no guilt.</p>" }
  ],
  terms: [
    { t: "entity / relationship", d: "ER modeling's nouns and verbs; relationships can carry their own attributes." },
    { t: "cardinality (1:1, 1:N, M:N)", d: "How many of each side may participate; M:N maps to a junction table." },
    { t: "weak entity", d: "An entity with no independent identity — keyed by its owner's key plus a partial key." },
    { t: "functional dependency", d: "X → Y: rows agreeing on X must agree on Y. The formal unit of design theory." },
    { t: "Armstrong's axioms", d: "Reflexivity, augmentation, transitivity — sound and complete rules generating all implied FDs." },
    { t: "attribute closure X⁺", d: "Everything X determines; the tool for testing FDs and finding keys." },
    { t: "candidate key", d: "A minimal superkey; attributes never appearing on an FD's right side belong to every one." },
    { t: "partial dependency (2NF)", d: "A non-prime attribute depending on part of a composite key." },
    { t: "transitive dependency (3NF)", d: "Key → A → B: B describes A's entity, not this one." },
    { t: "BCNF", d: "Every nontrivial FD's left side is a superkey — the clean generalization of 3NF." },
    { t: "lossless join", d: "Rejoining decomposed tables reproduces exactly the original — the non-negotiable property." },
    { t: "multivalued dependency (4NF)", d: "Independent multivalued facts forced into a cross-product; 4NF separates them." }
  ],
  quiz: [
    { type: "mc", q: "R(A,B,C,D) with FDs A→B and B→C. What is A⁺?",
      opts: ["{A, B}", "{A, B, C}", "{A, B, C, D}", "{B, C}"], a: 1,
      why: "Start {A}; A→B adds B; B→C adds C; nothing determines D. A⁺ = {A,B,C}, so A is not a key — every candidate key must include D." },
    { type: "mc", q: "Enrollment(student_id, course_id, grade, student_name) with key (student_id, course_id). Which normal form does student_name violate?",
      opts: ["1NF", "2NF — it depends on only part of the composite key", "3NF — it's a transitive dependency", "BCNF only"], a: 1,
      why: "student_id → student_name is a partial dependency: student_name depends on half the key. It moves to a Student table — that's the 2NF step." },
    { type: "mc", q: "employee(id, dept_id, dept_name) with id → dept_id and dept_id → dept_name. The dept_name column is…",
      opts: ["fine — it depends on the key", "a partial dependency (2NF violation)", "a transitive dependency (3NF violation)", "a multivalued dependency"], a: 2,
      why: "id → dept_id → dept_name: dept_name describes the department, reached transitively. 3NF splits out dept(dept_id, dept_name)." },
    { type: "mc", q: "Why is 3NF (not BCNF) the standard practical target?",
      opts: ["BCNF is impossible to compute", "3NF synthesis guarantees BOTH lossless join and dependency preservation; BCNF sometimes forces giving up dependency preservation", "3NF compresses better", "BCNF forbids foreign keys"], a: 1,
      why: "Some schemas can't be BCNF-decomposed without making an FD uncheckable within one table; 3NF never has that problem." },
    { type: "order", q: "Order the anomaly-elimination ladder:",
      items: ["1NF — atomic values, no repeating groups", "2NF — no partial dependencies on a composite key", "3NF — no transitive dependencies", "BCNF — every determinant is a superkey"],
      why: "Each form assumes the previous and removes one more specific redundancy disease." }
  ]
});

/* ======================= CHAPTER 4 ======================= */
CHAPTERS.push({
  num: 4, part: 1, title: "Speaking to the Database: Relational Algebra & SQL",
  blurb: "This chapter is about actually asking the database for what you want. We'll start with the small set of basic operations (filter rows, pick columns, combine tables) that every query is really built from, then dig into SQL itself: the different kinds of joins, subqueries, grouping and totals, window functions, and views. We'll also spend real time on NULL, SQL's stand-in for 'unknown', because its rules surprise almost everyone at least once and quietly cause bugs.",
  sections: [
    { title: "Relational Algebra: The Engine's Native Tongue",
      html: "<p>Before SQL, learn what SQL compiles into. Relational algebra is a closed set of operators — each takes relations, returns a relation, so they compose into trees. The core six:</p>" +
      "<ul><li><strong>Selection σ</strong> — filter rows: σ<sub>salary&gt;50k</sub>(Emp). SQL's WHERE.</li>" +
      "<li><strong>Projection π</strong> — keep columns: π<sub>name,dept</sub>(Emp). SQL's SELECT list (with duplicate elimination, in the pure algebra).</li>" +
      "<li><strong>Cartesian product ×</strong> — every pairing of rows from two relations; rarely wanted raw, always lurking under joins.</li>" +
      "<li><strong>Union ∪, difference −</strong> (and derived intersection ∩) — set operations over union-compatible relations.</li>" +
      "<li><strong>Rename ρ</strong> — relabel relations/attributes, enabling self-joins.</li></ul>" +
      "<p>The stars are derived: <strong>join ⋈</strong> is a product followed by a selection (Emp ⋈<sub>dept_id</sub> Dept ≡ σ<sub>Emp.dept_id=Dept.id</sub>(Emp × Dept)) — the <em>natural join</em> matches all same-named attributes. <strong>Division ÷</strong> answers \"for all\" questions (students enrolled in <em>every</em> course) — awkward in SQL, elegant in algebra. Aggregation γ extends the classical set for GROUP BY.</p>" +
      "<div class='callout'>Why bother? Chapter 12's optimizer is an algebra engine: every EXPLAIN plan is an operator tree, and every optimization is an algebraic identity — σ pushed below ⋈, π pruning columns early, join reordering by associativity. Learn the algebra and query plans stop being hieroglyphics.</div>" +
      "<p>(The theory twin, <em>relational calculus</em>, specifies results by logical formula rather than operator recipe — declarative like SQL itself; Codd proved the two exactly equivalent in power, which is why a declarative language can always be compiled to an operator tree.)</p>" },

    { title: "Defining Data: DDL & Constraints",
      html: "<p>The schema is executable documentation, and constraints are its teeth — invariants enforced by the engine no matter which application misbehaves (Chapter 1's rung: DB constraint over app code):</p>" +
      "<ul><li><strong>PRIMARY KEY</strong> — identity: unique and non-null, usually the clustering anchor (Chapter 24's InnoDB lesson).</li>" +
      "<li><strong>FOREIGN KEY</strong> — referential integrity: the row you point at must exist. Its <em>referential actions</em> decide what happens on delete/update of the parent: <code>RESTRICT</code> (refuse), <code>CASCADE</code> (propagate — deleting a customer deletes their orders; type it with a steady hand), <code>SET NULL</code>.</li>" +
      "<li><strong>UNIQUE</strong>, <strong>NOT NULL</strong>, <strong>CHECK</strong> (arbitrary row predicates: price ≥ 0), <strong>DEFAULT</strong>.</li></ul>" +
      "<p>Types matter more than they look: numeric exactness (NEVER floats for money — <code>DECIMAL</code> exists for a reason), <code>TIMESTAMP WITH TIME ZONE</code> vs the naive kind (a classic production bug factory), and TEXT vs VARCHAR(n) debates that mostly evaporate in modern engines.</p>" },

    { title: "Querying: The Logical Pipeline", viz: "sqlpipeline", vizTitle: "How a SELECT actually evaluates",
      html: "<p>SQL's biggest teaching failure is its clause order: you <em>write</em> SELECT first, but the query <em>evaluates</em> in a different order entirely:</p>" +
      "<ol><li><strong>FROM + JOIN</strong> — assemble the working set.</li>" +
      "<li><strong>WHERE</strong> — filter <em>rows</em> (no aggregates allowed here — they don't exist yet).</li>" +
      "<li><strong>GROUP BY</strong> — collapse rows into groups.</li>" +
      "<li><strong>HAVING</strong> — filter <em>groups</em> (aggregates now legal).</li>" +
      "<li><strong>SELECT</strong> — compute output expressions (this is why WHERE can't see column aliases!).</li>" +
      "<li><strong>ORDER BY / LIMIT</strong> — sort, then cut.</li></ol>" +
      "<p>Hold that pipeline and the classic confusions dissolve: WHERE-vs-HAVING, alias visibility, why aggregates can't appear in WHERE. Step through it above on a live table.</p>" +
      "<h3>The Join Family</h3>" +
      "<p><strong>INNER</strong> keeps only matches; <strong>LEFT/RIGHT OUTER</strong> keep all rows of one side, NULL-padding the other (find-customers-with-no-orders = LEFT JOIN … WHERE right side IS NULL — the anti-join idiom); <strong>FULL OUTER</strong> keeps both sides; <strong>CROSS</strong> is the raw product; a <strong>self-join</strong> joins a table to itself via aliases (employees to their managers). Semi-joins (EXISTS) return left rows with at least one match — without duplicating them per match, the subtle bug hiding in many INNER JOINs used for existence tests.</p>" +
      "<h3>Subqueries & Set Operations</h3>" +
      "<p>Subqueries nest anywhere a value or table can appear: scalar subqueries, IN (...), and <strong>correlated</strong> subqueries that reference the outer row (elegant, and re-executed per row unless the optimizer decorrelates — Chapter 12). <strong>EXISTS vs IN</strong>: near-equivalent for existence, but <code>NOT IN</code> with a NULL in the list matches <em>nothing</em> (three-valued logic strikes) — prefer <code>NOT EXISTS</code>. Set operations UNION (deduplicates!) vs UNION ALL (doesn't, and is cheaper), INTERSECT, EXCEPT round out the algebra.</p>" },

    { title: "Aggregation & Window Functions",
      html: "<p><strong>GROUP BY</strong> partitions rows and collapses each group to one output row; every SELECT column must be either grouped or aggregated (COUNT, SUM, AVG, MIN, MAX — mind COUNT(*) vs COUNT(col): the latter skips NULLs). HAVING filters the groups the aggregates describe.</p>" +
      "<p><strong>Window functions</strong> are the modern superpower: aggregates that <em>don't collapse rows</em>. <code>OVER (PARTITION BY dept ORDER BY salary)</code> gives every row a view over its neighborhood:</p>" +
      "<ul><li>Rankings — <code>ROW_NUMBER()</code>, <code>RANK()</code> (\"top 3 per department\" without self-join gymnastics).</li>" +
      "<li>Offsets — <code>LAG()/LEAD()</code> (compare each row to the previous: day-over-day deltas).</li>" +
      "<li>Running frames — <code>SUM(x) OVER (ORDER BY date ROWS UNBOUNDED PRECEDING)</code>: cumulative totals, moving averages.</li></ul>" +
      "<p>They evaluate after HAVING, alongside SELECT — one more stop on the pipeline. Most reporting SQL written before window functions existed can be rewritten shorter, clearer, and faster with them.</p>" },

    { title: "Views, Triggers & the Truth About NULL",
      html: "<h3>Views & Materialization</h3>" +
      "<p>A <strong>view</strong> is a stored query worn as a table — abstraction, security boundary (expose the view, hide the table), zero storage; the optimizer inlines it. Chapter 13's <strong>materialized views</strong> are the precomputed cousin: stored results traded against staleness.</p>" +
      "<h3>Triggers & Stored Procedures</h3>" +
      "<p><strong>Triggers</strong> run code on data events (BEFORE/AFTER INSERT/UPDATE/DELETE) — right for last-line invariants and audit trails, wrong for business logic (invisible control flow that surprises every new engineer; cascading triggers can surprise the old ones too). <strong>Stored procedures</strong> put multi-statement logic server-side: fewer round trips and one authoritative implementation, versus code that's harder to test, version, and deploy than the application beside it. Modern practice keeps both on a short leash.</p>" +
      "<h3>Three-Valued Logic</h3>" +
      "<p>NULL means <em>unknown</em>, and SQL logic is three-valued: TRUE, FALSE, UNKNOWN. Hence the traps every engineer hits once: <code>NULL = NULL</code> is UNKNOWN (use <code>IS NULL</code>); a WHERE clause keeps only TRUE rows, silently dropping UNKNOWN; <code>NOT IN</code> with a NULL matches nothing; aggregates skip NULLs; and two NULLs are <em>distinct</em> to a UNIQUE constraint (usually). When a query \"loses\" rows mysteriously, interrogate the NULLs first.</p>" }
  ],
  terms: [
    { t: "selection σ / projection π", d: "Filter rows / keep columns — WHERE and the SELECT list, in algebra dress." },
    { t: "natural join ⋈", d: "Product + match on shared attributes; the operator under every JOIN keyword." },
    { t: "division ÷", d: "The 'for all' operator: rows related to EVERY member of another set." },
    { t: "referential action", d: "ON DELETE/UPDATE behavior of a foreign key: RESTRICT, CASCADE, SET NULL." },
    { t: "logical evaluation order", d: "FROM → WHERE → GROUP BY → HAVING → SELECT → ORDER BY — not the order you write." },
    { t: "outer join", d: "Keeps unmatched rows from one (or both) sides, NULL-padded — basis of the anti-join idiom." },
    { t: "correlated subquery", d: "A subquery referencing the outer row — conceptually re-run per row until decorrelated." },
    { t: "window function", d: "An aggregate over a row's neighborhood (OVER/PARTITION BY) that doesn't collapse rows." },
    { t: "view", d: "A stored query used as a table: abstraction and access control with no storage." },
    { t: "three-valued logic", d: "TRUE / FALSE / UNKNOWN: NULL comparisons yield UNKNOWN, and WHERE keeps only TRUE." },
    { t: "trigger", d: "Code fired by data events — powerful for invariants and audit, dangerous as hidden business logic." }
  ],
  quiz: [
    { type: "mc", q: "Why can't you write `WHERE COUNT(*) > 5`?",
      opts: ["COUNT is not allowed in SQL", "WHERE runs before GROUP BY — no groups (and no aggregates) exist yet; that filter belongs in HAVING", "COUNT only works in ORDER BY", "You can — it's valid"], a: 1,
      why: "The logical pipeline: WHERE filters rows pre-grouping, HAVING filters groups post-aggregation. Same reason SELECT aliases are invisible to WHERE." },
    { type: "mc", q: "customers LEFT JOIN orders … WHERE orders.id IS NULL returns…",
      opts: ["customers with the most orders", "all customers and all orders", "exactly the customers with NO orders — the anti-join idiom", "a syntax error"], a: 2,
      why: "LEFT JOIN keeps customers without matches, NULL-padding the order side; the IS NULL filter then keeps only those unmatched rows." },
    { type: "mc", q: "`WHERE id NOT IN (SELECT ref FROM t)` returns zero rows unexpectedly. The classic cause?",
      opts: ["The index is missing", "The subquery returned a NULL — NOT IN with NULL evaluates to UNKNOWN for every row; use NOT EXISTS", "IN is limited to 1000 items", "id must be a string"], a: 1,
      why: "x NOT IN (1, NULL) means x≠1 AND x≠NULL — the second test is UNKNOWN, poisoning the whole predicate. Three-valued logic's favorite ambush." },
    { type: "mc", q: "\"Top 3 earners in each department\" is cleanest with…",
      opts: ["GROUP BY dept LIMIT 3", "a trigger", "ROW_NUMBER() OVER (PARTITION BY dept ORDER BY salary DESC), then filter ≤ 3", "three self-joins"], a: 2,
      why: "Window functions rank within partitions without collapsing rows — the exact shape of per-group top-N questions." },
    { type: "order", q: "Order SQL's logical evaluation pipeline:",
      items: ["FROM + JOIN", "WHERE", "GROUP BY", "HAVING", "SELECT", "ORDER BY / LIMIT"],
      why: "Assemble, filter rows, group, filter groups, compute outputs, then sort and cut." }
  ]
});
