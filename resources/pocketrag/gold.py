"""PocketRAG, layer 5a: the gold set.  Chapter 36.

120 queries over the 56-passage Larkspur corpus with graded judgments, written
by reading the passages and not by reading PocketRAG's output. That order
matters: labels made from a system's own ranking can only ever confirm it.

Grades follow Chapter 25: 2 means the passage answers the question, 1 means it
is about the right subject without answering, 0 means the passage is not
listed. A query with no grade-2 passage is answerable only in part; a query
with no judgments at all is unanswerable, and the right behaviour is a refusal.

Passages are named by their leading title rather than by chunk id, so the set
survives a reingest that changes the hashes.

    python3 gold.py <db>          check every title resolves, print the shape
"""
import sqlite3, sys

# Query, {passage title: grade}, class.  Empty judgments mean "refuse".
GOLD = [
    # ---------------------------------------------------------- keyword
    ("Can I bring my cello in the cabin?", {"Musical instruments": 2}, "keyword"),
    ("lithium batteries above 100 Wh", {"Dangerous goods": 2}, "keyword"),
    ("property irregularity report", {"Delayed baggage": 2}, "keyword"),
    ("SEPA direct debit", {"Payment methods": 2}, "keyword"),
    ("A320neo Wi-Fi price", {"Wi-Fi and power": 2, "Fleet": 1}, "keyword"),
    ("EU Regulation 261/2004 downgrade",
     {"Involuntary downgrade": 2, "Denied boarding compensation": 1}, "keyword"),
    ("unaccompanied minor service charge", {"Unaccompanied minors": 2}, "keyword"),
    ("INC-2042", {"Incident INC-2042 post-mortem": 2}, "keyword"),
    ("INC-1987 check-in outage", {"Incident INC-1987 post-mortem": 2}, "keyword"),
    ("chargeback acquiring bank", {"Credit card chargebacks": 2}, "keyword"),
    ("Palermo base", {"Route network": 2}, "keyword"),
    ("golf bags and skis", {"Sports equipment": 2}, "keyword"),
    ("cabin bag 55 x 40 x 20 cm", {"Baggage allowance, cabin": 2}, "keyword"),
    ("fare classes Y B M H Q L K T", {"Fare classes": 2}, "keyword"),
    ("nut-free cabin", {"Meals and allergies": 2}, "keyword"),
    ("airport bag drop closing time", {"Check-in deadlines": 2}, "keyword"),
    ("gift voucher validity", {"Gift vouchers": 2}, "keyword"),
    ("wheelchair assistance 48 hours", {"Special assistance": 2}, "keyword"),
    ("Larkspur Club points expiry", {"Larkspur Club": 2}, "keyword"),

    # ------------------------------------------------------- paraphrase
    # The FAQ page restates this question and answers nothing, so it is not
    # listed. That absence is what lets a metric see the chapter-35 failure.
    ("I couldn't take my flight, how do I get my money back?",
     {"Fare rules and cancellation": 2, "No-show policy": 2,
      "Travel credit terms": 1, "Taxes and charges": 1}, "paraphrase"),
    ("Can I bring my emotional support peacock in the cabin?",
     {"Pets in the cabin": 2}, "paraphrase"),
    ("My dog, can he fly with me in the cabin?", {"Pets in the cabin": 2}, "paraphrase"),
    ("Do I have to pay for a suitcase?",
     {"Checked baggage charges": 2, "Baggage allowance, cabin": 1}, "paraphrase"),
    ("What happens if you cancel my flight?",
     {"Cancellation by Larkspur": 2, "Weather disruption": 1}, "paraphrase"),
    ("The airline moved my flight by five hours, what are my rights?",
     {"Schedule changes": 2}, "paraphrase"),
    ("How long before departure do I need to be at the airport?",
     {"Check-in deadlines": 2}, "paraphrase"),
    ("Is my ticket refundable?",
     {"Fare rules and cancellation": 2, "Flexible fares": 2, "Fare classes": 1}, "paraphrase"),
    ("Can somebody else use my ticket?", {"Name changes": 2}, "paraphrase"),
    ("I spelled my name wrong on the booking", {"Name changes": 2}, "paraphrase"),
    ("Will I get the airport taxes back if I don't fly?",
     {"Taxes and charges": 2, "No-show policy": 1}, "paraphrase"),
    ("What if I just don't show up for the flight?", {"No-show policy": 2}, "paraphrase"),
    ("Can I pay in cash at the ticket desk?", {"Payment methods": 2}, "paraphrase"),
    ("Is there a plug for my laptop on board?", {"Wi-Fi and power": 2}, "paraphrase"),
    ("How much for a bag over 23 kilos?", {"Checked baggage charges": 2}, "paraphrase"),
    ("My bag never arrived at the carousel", {"Delayed baggage": 2}, "paraphrase"),
    ("Can my baby sit on my lap?", {"Infants": 2}, "paraphrase"),
    ("Travelling with a group of twenty people", {"Group bookings": 2}, "paraphrase"),
    ("Do you arrange a taxi from the airport?", {"Airport transfers": 2}, "paraphrase"),
    ("I was bumped off an overbooked flight",
     {"Denied boarding compensation": 2}, "paraphrase"),
    ("They put me in economy but I paid for business",
     {"Involuntary downgrade": 2}, "paraphrase"),
    ("How long is my credit good for?",
     {"Travel credit terms": 2, "Fare rules and cancellation": 1}, "paraphrase"),
    ("Do I get money back for the seat I paid extra for?",
     {"Refund of ancillary services": 2, "Seat selection fees": 2}, "paraphrase"),
    ("Who is responsible if the partner airline loses my bag?",
     {"Codeshare flights": 2}, "paraphrase"),
    ("A snowstorm cancelled my flight, do I get compensation?",
     {"Weather disruption": 2, "Cancellation by Larkspur": 1}, "paraphrase"),
    ("Do you keep my personal data forever?", {"Data protection": 2}, "paraphrase"),
    ("Which aircraft types do you fly?", {"Fleet": 2}, "paraphrase"),
    ("Where does Larkspur fly from?", {"Route network": 2}, "paraphrase"),
    ("Who gets to board first?", {"Boarding priority": 2}, "paraphrase"),
    ("Can my eight year old fly alone?", {"Unaccompanied minors": 2}, "paraphrase"),

    # ---------------------------------------------------------- multihop
    ("Which baggage policy changed after incident INC-2042?",
     {"Incident INC-2042 post-mortem": 2, "Fare rules and cancellation": 2}, "multihop"),
    ("Which policy changed after incident INC-2042?",
     {"Incident INC-2042 post-mortem": 2, "Fare rules and cancellation": 2}, "multihop"),
    ("What was fixed after the check-in outage?",
     {"Incident INC-1987 post-mortem": 2, "Check-in deadlines": 1}, "multihop"),
    ("Which incident caused the cooling-off clause?",
     {"Incident INC-2042 post-mortem": 2, "Fare rules and cancellation": 1}, "multihop"),
    ("If I cancel a non-refundable fare, what do I receive and how long is it valid?",
     {"Fare rules and cancellation": 2, "Travel credit terms": 2}, "multihop"),
    ("I bought priority boarding and Larkspur cancelled the flight, what comes back?",
     {"Refund of ancillary services": 2, "Cancellation by Larkspur": 2}, "multihop"),
    ("Who handles bags in Lisbon and how quickly?",
     {"Partner airport contract, Lisbon": 2}, "multihop"),
    ("What happens to my booking while a card dispute is open?",
     {"Credit card chargebacks": 2}, "multihop"),
    ("Which fare classes can I cancel and how fast is the money returned?",
     {"Flexible fares": 2, "Fare classes": 1}, "multihop"),

    # ------------------------------------------------------------ ticket
    ("support ticket 9104", {"Support ticket 9104": 2}, "ticket"),
    ("ticket about a seat fee refund",
     {"Support ticket 9455": 2, "Refund of ancillary services": 1}, "ticket"),
    ("customer missed a connection and got a goodwill voucher",
     {"Support ticket 8812": 2}, "ticket"),
    ("how long does a refund take to reach my card",
     {"Support ticket 9611": 2, "Support ticket 9210": 1, "Flexible fares": 1}, "ticket"),
    ("passenger cancelled by mistake the day after booking",
     {"Support ticket 9502": 2, "Fare rules and cancellation": 1}, "ticket"),
    ("who pays for my second ticket after a late connection",
     {"Support ticket 9677": 2, "Support ticket 8812": 1}, "ticket"),
    ("charged twice for a bag", {"Support ticket 9702": 2}, "ticket"),
    ("I want to move my flight instead of losing the money",
     {"Support ticket 9755": 2, "Fare rules and cancellation": 1,
      "Travel credit terms": 1}, "ticket"),
    ("you cancelled the flight, not me, I want my money back",
     {"Support ticket 9560": 2, "Cancellation by Larkspur": 2}, "ticket"),
    ("third time asking about my refund", {"Support ticket 9401": 2}, "ticket"),
    ("I was ill and could not fly",
     {"Support ticket 9104": 2, "No-show policy": 1}, "ticket"),
    ("money back for an unused ticket",
     {"Support ticket 9333": 2, "No-show policy": 1}, "ticket"),
    ("missed my flight and want a refund",
     {"Support ticket 9210": 2, "No-show policy": 2}, "ticket"),
    ("agent explained the fare rules and issued the credit",
     {"Support ticket 9104": 2}, "ticket"),

    # ----------------------------------------------------------- numeric
    ("how much is the first checked bag online", {"Checked baggage charges": 2}, "numeric"),
    ("cost of carrying a bicycle", {"Sports equipment": 2}, "numeric"),
    ("price of a pet in the cabin", {"Pets in the cabin": 2}, "numeric"),
    ("administration fee for returning taxes", {"Taxes and charges": 2}, "numeric"),
    ("how much is denied boarding compensation",
     {"Denied boarding compensation": 2}, "numeric"),
    ("reimbursement percentage for a downgrade", {"Involuntary downgrade": 2}, "numeric"),
    ("how many routes does Larkspur fly", {"Route network": 2}, "numeric"),
    ("average age of the fleet", {"Fleet": 2}, "numeric"),
    ("how long is booking data kept", {"Data protection": 2}, "numeric"),
    ("deposit for a group booking", {"Group bookings": 2}, "numeric"),
    ("cost for an infant per sector", {"Infants": 2}, "numeric"),
    ("seat selection starting price", {"Seat selection fees": 2}, "numeric"),
    ("essential purchases limit for a delayed bag", {"Delayed baggage": 2}, "numeric"),
    ("how many days to answer a written claim", {"Contact channels": 2}, "numeric"),
    ("support line opening hours", {"Contact channels": 2}, "numeric"),
    ("how long does a flexible fare refund take", {"Flexible fares": 2}, "numeric"),
    ("how long is a travel credit valid",
     {"Travel credit terms": 2, "Fare rules and cancellation": 1}, "numeric"),
    ("which rows have seat power", {"Wi-Fi and power": 2}, "numeric"),

    # ------------------------------------------------------ unanswerable
    ("How many refund tickets were opened in March?", {}, "unanswerable"),
    ("What is the chief executive's salary?", {}, "unanswerable"),
    ("Does Larkspur fly to New York?", {}, "unanswerable"),
    ("What is the Wi-Fi password on board?", {}, "unanswerable"),
    ("How many passengers did Larkspur carry last year?", {}, "unanswerable"),
    ("Who is the ground handler in Porto?", {}, "unanswerable"),
    ("What was the root cause of incident INC-3100?", {}, "unanswerable"),
    ("What is the baggage allowance on partner airline SkyIberia?", {}, "unanswerable"),
    ("How much does a Larkspur Club Gold card cost?", {}, "unanswerable"),
    ("Is there a crew rest area on the A321neo?", {}, "unanswerable"),
    ("What is Larkspur's on-time performance?", {}, "unanswerable"),
    ("Which travel insurance does Larkspur recommend?", {}, "unanswerable"),
    ("How do I book a hotel through Larkspur?", {}, "unanswerable"),
    ("What is the smoking policy on board?", {}, "unanswerable"),
    ("Does the aircraft have a first class cabin?", {}, "unanswerable"),

    # ------------------------------------------------------------ partial
    ("Can I bring a surfboard?", {"Sports equipment": 1}, "partial"),
    ("Can I pay with Bitcoin?", {"Payment methods": 1}, "partial"),
    ("Is there a vegetarian meal?", {"Meals and allergies": 1}, "partial"),
    ("Can I bring a parrot in the cabin?", {"Pets in the cabin": 1}, "partial"),
    ("Do you have airport lounges?", {"Refund of ancillary services": 1}, "partial"),
    ("Can I take a violin on board?",
     {"Musical instruments": 1, "Baggage allowance, cabin": 1}, "partial"),
    ("How long until a found bag is returned to me?", {"Delayed baggage": 1}, "partial"),
    ("Is there a fee to change the date of my flight?",
     {"Fare rules and cancellation": 1, "Schedule changes": 1,
      "Travel credit terms": 1}, "partial"),

    # -------------------------------------------------------------- short
    ("refund",
     {"Fare rules and cancellation": 2, "Refund of ancillary services": 1,
      "Flexible fares": 1}, "short"),
    ("baggage",
     {"Checked baggage charges": 2, "Baggage allowance, cabin": 2,
      "Delayed baggage": 1, "Sports equipment": 1}, "short"),
    ("cello", {"Musical instruments": 2}, "short"),
    ("peacock", {"Pets in the cabin": 1}, "short"),
    ("cooling-off clause",
     {"Fare rules and cancellation": 1, "Incident INC-2042 post-mortem": 1}, "short"),
    ("taxes", {"Taxes and charges": 2}, "short"),
    ("no-show", {"No-show policy": 2}, "short"),
]


def titles(db: sqlite3.Connection) -> dict[str, str]:
    """Passage title -> chunk_id. The title is the text up to the first period,
    which is unique across the corpus and stable across a reingest."""
    return {text.split(".")[0].strip(): cid
            for cid, text in db.execute("SELECT chunk_id, text FROM chunks")}


def load(db: sqlite3.Connection):
    """[(query, {chunk_id: grade}, klass)] with every title resolved. A title
    that does not resolve is a bug in the labels, not a miss, so it raises."""
    by_title = titles(db)
    out = []
    for query, judged, klass in GOLD:
        resolved = {}
        for title, grade in judged.items():
            if title not in by_title:
                raise KeyError(f"gold label names no passage: {title!r}")
            resolved[by_title[title]] = grade
        out.append((query, resolved, klass))
    return out


def main(argv):
    db = sqlite3.connect(argv[1])
    gold = load(db)
    klasses: dict[str, int] = {}
    for _, _, k in gold:
        klasses[k] = klasses.get(k, 0) + 1
    judged = sum(len(j) for _, j, _ in gold)
    unans = sum(1 for _, j, _ in gold if not j)
    print(f"  {len(gold)} queries, {judged} judgments, {judged / len(gold):.1f} per query")
    print(f"  {unans} unanswerable, {len(gold) - unans} with at least one judged passage")
    for k, n in sorted(klasses.items(), key=lambda kv: -kv[1]):
        print(f"    {k:14s} {n:3d}")
    covered = {c for _, j, _ in gold for c in j}
    total = db.execute("SELECT COUNT(*) FROM chunks").fetchone()[0]
    print(f"  {len(covered)} of {total} passages are judged relevant to at least one query")


if __name__ == "__main__":
    main(sys.argv)
