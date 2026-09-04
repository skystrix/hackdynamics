"""querygap.py — Chapter 14, "The Query Gap".

Measures how far a user's question sits from the passage that answers it, and
how much five rewriting strategies close that distance. Two retrievers are
measured over the same 56-passage Larkspur corpus:

  * BM25 (the Chapter 9 scorer, k1=1.2, b=0.75) — the lexical view of the gap.
  * A real sentence embedding model (all-MiniLM-L6-v2, 384-d, mean pooled and
    L2 normalized) — the dense view. Skipped with a message if
    sentence-transformers is not installed.

Every "rewrite" below is a fixed string standing in for what a language model
would produce; they were written once, by hand, in the shape the cited papers
prescribe, so the experiment is deterministic and costs nothing to re-run.

    python3 querygap.py
"""

import math
import re
from collections import Counter

# --------------------------------------------------------------------------
# The corpus: 56 Larkspur Airlines passages, statement-shaped, as a chunker
# would leave them. Index 7 is the gold passage for Q2.
# --------------------------------------------------------------------------
CORPUS = [
    # 0
    "Baggage allowance, cabin. One personal item and one cabin bag not exceeding "
    "55 x 40 x 20 cm and 8 kg are carried without charge on all Larkspur fares.",
    # 1
    "Musical instruments. A cello, double bass or guitar may be carried in the "
    "cabin if an extra seat is purchased at the applicable adult fare. The "
    "instrument must be secured in the seat with the supplied strap.",
    # 2
    "Checked baggage charges. The first checked bag is 25 EUR when purchased "
    "online and 40 EUR at the airport. Bags above 23 kg attract a heavy bag fee.",
    # 3
    "Payment methods. Larkspur accepts Visa, Mastercard, American Express and "
    "SEPA direct debit. Cash is not accepted at ticket desks.",
    # 4
    "Delayed baggage. If your bag does not arrive, file a property irregularity "
    "report before leaving the arrivals hall. Larkspur reimburses reasonable "
    "essential purchases up to 150 EUR against receipts.",
    # 5
    "Seat selection fees. Seat selection is optional and is charged from 6 EUR. "
    "Seat fees are not refunded when a passenger changes flight voluntarily.",
    # 6
    "Denied boarding compensation. Where boarding is denied against a "
    "passenger's will on a flight departing the European Union, compensation of "
    "250 to 600 EUR is payable depending on distance.",
    # 7  <-- GOLD for Q2
    "Fare rules and cancellation. Tickets in fare classes L, K and T are "
    "non-refundable. Where a booking is cancelled by the passenger more than 24 "
    "hours after purchase, the fare is retained and issued as a travel credit "
    "valid for twelve months from the date of issue. Government taxes and "
    "airport charges are returned to the original form of payment on request.",
    # 8
    "Flexible fares. Tickets in fare classes Y and B may be cancelled at any "
    "time before departure and the fare returned to the original form of "
    "payment within seven working days.",
    # 9
    "Cancellation by Larkspur. If Larkspur cancels a flight, the passenger may "
    "choose rerouting on the next available service or reimbursement of the "
    "ticket at the price paid within seven days.",
    # 10
    "Name changes. A name correction of up to three characters is free. A "
    "transfer of a booking to a different passenger is treated as a "
    "cancellation and a new booking.",
    # 11
    "Pets in the cabin. Cats and small dogs travel in an approved carrier under "
    "the seat in front for 55 EUR per sector. Larkspur does not carry emotional "
    "support animals; only trained assistance dogs are accepted.",
    # 12
    "Check-in deadlines. Online check-in opens 30 hours and closes 2 hours "
    "before departure. Airport bag drop closes 45 minutes before departure.",
    # 13
    "No-show policy. A passenger who does not present for a flight and has not "
    "cancelled in advance forfeits the value of that sector, including on "
    "flexible fares.",
    # 14
    "Travel credit terms. A travel credit is held against the booking "
    "reference, may be used for any Larkspur flight, may be used in parts, and "
    "expires twelve months after issue. Credit cannot be exchanged for cash.",
    # 15
    "Group bookings. Bookings of ten or more passengers are held under a group "
    "contract with a deposit of 20 percent, balance due 30 days before travel.",
    # 16
    "Special assistance. Requests for wheelchair assistance must reach Larkspur "
    "at least 48 hours before departure through the manage-booking page.",
    # 17
    "Incident INC-2042 post-mortem. On 14 January a fare-loading error priced "
    "Lisbon routes at zero for 40 minutes. Actions: the refund and cancellation "
    "policy was amended on 2 February to add the 24-hour cooling-off clause.",
    # 18
    "Refund of ancillary services. Paid extras such as priority boarding, "
    "lounge access and excess baggage are refundable only where the flight "
    "itself was cancelled by Larkspur.",
    # 19
    "Partner airport contract, Lisbon. Ground handling is provided by the "
    "airport operator under a three-year contract with service levels for bag "
    "delivery of 20 minutes for the first bag.",
    # 20
    "Fare classes. Larkspur sells fare classes Y, B, M, H, Q, L, K and T in "
    "descending order of flexibility and price. The class appears on the "
    "boarding pass next to the flight number.",
    # 21
    "Credit card chargebacks. Where a chargeback is raised, the booking is "
    "suspended until the dispute is resolved by the acquiring bank.",
    # 22
    "Taxes and charges. Air passenger duty and airport charges are collected on "
    "behalf of authorities and are returned when a flight is not flown, on "
    "request, less an administration fee of 15 EUR per passenger.",
    # 23
    "Schedule changes. Where a departure time moves by more than three hours, "
    "the passenger may rebook without charge or claim reimbursement.",
    # 24
    "Support ticket 8812. Customer wrote asking to get money back after missing "
    "a connection; agent explained the missed-connection rules and offered a "
    "goodwill voucher.",
    # 25
    "Contact channels. The support line is open 06:00 to 23:00 CET. Written "
    "claims are answered within 14 days under the airline's service commitment.",
    # ----------------------------------------------------------------------
    # Support tickets. Written in the customer's voice, which is the same
    # register as the query: this is the half of a real corpus that competes
    # with the policy passage for a question-shaped query.
    # ----------------------------------------------------------------------
    # 26
    "Support ticket 9104. I could not take my flight last week because I was "
    "ill. How do I get my money back? Agent: explained the fare rules and "
    "issued the credit.",
    # 27
    "Support ticket 9210. Hi, I missed my flight and I want a refund please. "
    "Can you tell me how long it takes to get the money back onto my card?",
    # 28
    "Support ticket 9333. My flight was fine but I could not travel, is there "
    "any way to get money back for the ticket I did not use?",
    # 29
    "Support ticket 9401. I did not fly, do I get my money back or not? Nobody "
    "has answered me. This is the third time I am asking.",
    # 30
    "Support ticket 9455. How do I get a refund for the seat I paid for when I "
    "could not take the flight? The seat fee was 12 EUR.",
    # 31
    "Support ticket 9502. Can I get my money back if I cancel a flight I "
    "booked yesterday by mistake?",
    # 32
    "Support ticket 9560. I want my money back for a cancelled flight. The "
    "flight was cancelled by you, not by me.",
    # 33
    "Support ticket 9611. How long does a refund take? I cancelled two weeks "
    "ago and there is nothing on my statement.",
    # 34
    "Support ticket 9677. I could not take my flight because my connection was "
    "late. Who pays me back for the second ticket?",
    # 35
    "Support ticket 9702. Question about baggage: how do I get money back for a "
    "bag fee I paid twice by accident?",
    # 36
    "Frequently asked questions, money. How do I get my money back? What "
    "happens if I cannot take my flight? Can I change the name on a ticket? "
    "See the linked policy pages for each answer.",
    # 37
    "Support ticket 9755. I cannot travel on the date I booked. Is there any "
    "way to move the flight instead of losing the money?",
    # ----------------------------------------------------------------------
    # More policy pages, so the corpus is not all refunds.
    # ----------------------------------------------------------------------
    # 38
    "Unaccompanied minors. Children aged 5 to 11 travelling alone are accepted "
    "on direct flights only, for a service charge of 45 EUR per sector.",
    # 39
    "Dangerous goods. Spare lithium batteries above 100 Wh are carried in the "
    "cabin only with prior approval and must be individually protected.",
    # 40
    "Boarding priority. Passengers holding a Larkspur Club card, families with "
    "infants and passengers requiring assistance board before general boarding.",
    # 41
    "Meals and allergies. Larkspur does not serve hot meals on flights under "
    "two hours and cannot guarantee a nut-free cabin.",
    # 42
    "Sports equipment. Skis, golf bags and bicycles are carried as checked "
    "baggage for 45 EUR per item, subject to space, and must be pre-booked.",
    # 43
    "Wi-Fi and power. Wi-Fi is available on the A320neo fleet at 4.90 EUR per "
    "flight. Seat power is fitted in rows 1 to 12 only.",
    # 44
    "Travel documents. Passengers are responsible for holding valid travel "
    "documents. Larkspur is not liable for costs arising from a refused entry.",
    # 45
    "Larkspur Club. Points are earned at one point per euro of fare, excluding "
    "taxes, and expire after 24 months of account inactivity.",
    # 46
    "Infants. Infants under two travel on a parent's lap for 20 EUR per sector "
    "and are not entitled to a baggage allowance or a seat.",
    # 47
    "Involuntary downgrade. Where a passenger is moved to a lower class of "
    "service, reimbursement of 30 to 75 percent of the ticket price is payable "
    "under EU Regulation 261/2004.",
    # 48
    "Weather disruption. Larkspur is not liable for compensation where a "
    "cancellation is caused by extraordinary circumstances, but the duty of "
    "care for meals and accommodation still applies.",
    # 49
    "Codeshare flights. Where a Larkspur code is carried on a partner's "
    "aircraft, the operating carrier's baggage rules apply to the whole journey.",
    # 50
    "Data protection. Booking data is retained for seven years for tax and "
    "audit purposes and is not sold to third parties.",
    # 51
    "Gift vouchers. A Larkspur gift voucher is valid for 24 months, may be used "
    "for fares and ancillary services, and is not exchangeable for cash.",
    # 52
    "Airport transfers. Larkspur does not sell airport transfers and is not "
    "responsible for missed departures caused by ground transport.",
    # 53
    "Incident INC-1987 post-mortem. A check-in outage on 3 November delayed 14 "
    "departures. Actions: added a queue-depth alert and a manual bag-drop "
    "fallback procedure.",
    # 54
    "Fleet. Larkspur operates 22 Airbus A320neo and 6 A321neo aircraft with an "
    "average age of 4.2 years.",
    # 55
    "Route network. Larkspur flies 61 routes from four bases: Lisbon, Porto, "
    "Bordeaux and Palermo.",
]
GOLD = 7

# --------------------------------------------------------------------------
# Q2 and its rewrites. Each rewrite is what the named strategy asks a model to
# produce, written by hand so the run is deterministic.
# --------------------------------------------------------------------------
RAW = "I couldn't take my flight, how do I get my money back?"

HYDE = (
    "If you cancel your booking you may be entitled to money back. Tickets sold "
    "in the cheaper fare classes are non-refundable, and instead of a payment "
    "the value of the fare is issued as a travel credit that can be used for a "
    "later flight. Taxes and airport charges can be returned to the card used "
    "for the booking."
)

STEPBACK = "What is the airline's cancellation and refund policy for a ticket the passenger does not fly?"

MULTI = [
    "cancellation policy refund non-refundable fare",
    "what happens to the fare if I cancel my booking",
    "travel credit instead of a refund after cancelling",
]

SUBQ = [
    "which fare classes are non-refundable",
    "is a travel credit issued when a booking is cancelled",
    "are taxes and airport charges returned",
]

# --------------------------------------------------------------------------
# BM25 (Robertson/Sparck Jones, as taught in Chapter 9)
# --------------------------------------------------------------------------
def tok(s):
    return re.findall(r"[a-z0-9]+", s.lower())


class BM25:
    def __init__(self, docs, k1=1.2, b=0.75):
        self.k1, self.b = k1, b
        self.docs = [tok(d) for d in docs]
        self.len = [len(d) for d in self.docs]
        self.avg = sum(self.len) / len(self.len)
        self.tf = [Counter(d) for d in self.docs]
        df = Counter()
        for d in self.docs:
            df.update(set(d))
        n = len(self.docs)
        self.idf = {t: math.log(1 + (n - c + 0.5) / (c + 0.5)) for t, c in df.items()}

    def score(self, query):
        out = []
        for i, tf in enumerate(self.tf):
            s = 0.0
            for t in tok(query):
                f = tf.get(t, 0)
                if not f:
                    continue
                den = f + self.k1 * (1 - self.b + self.b * self.len[i] / self.avg)
                s += self.idf[t] * f * (self.k1 + 1) / den
            out.append(s)
        return out


def ranking(scores):
    return sorted(range(len(scores)), key=lambda i: -scores[i])


def rank_of(order, doc=GOLD):
    return order.index(doc) + 1


def rrf(orders, k=60):
    """Reciprocal rank fusion, the Chapter 15 merge, used here for multi-query."""
    agg = Counter()
    for o in orders:
        for r, d in enumerate(o, start=1):
            agg[d] += 1.0 / (k + r)
    return [d for d, _ in agg.most_common()]


def report(name, order, scores=None):
    r = rank_of(order)
    top = ", ".join(str(d) for d in order[:5])
    gap = ""
    if scores is not None:
        gap = "   gold=%.3f top=%.3f" % (scores[GOLD], scores[order[0]])
    print("  %-22s gold rank %2d   top5: [%s]%s" % (name, r, top, gap))
    return r


# --------------------------------------------------------------------------
def run_bm25():
    print("BM25 (k1=1.2, b=0.75), %d passages, gold = %d" % (len(CORPUS), GOLD))
    bm = BM25(CORPUS)
    ranks = {}
    for name, q in [("raw question", RAW), ("HyDE", HYDE), ("step-back", STEPBACK)]:
        sc = bm.score(q)
        ranks[name] = report(name, ranking(sc), sc)
    ranks["multi-query (RRF)"] = report(
        "multi-query (RRF)", rrf([ranking(bm.score(q)) for q in MULTI])
    )
    ranks["sub-questions (RRF)"] = report(
        "sub-questions (RRF)", rrf([ranking(bm.score(q)) for q in SUBQ])
    )
    # How much of the raw question is even a content word present in the gold?
    q, g = set(tok(RAW)), set(tok(CORPUS[GOLD]))
    print("  raw query terms present in gold passage: %s" % sorted(q & g))
    return ranks


def run_dense():
    try:
        from sentence_transformers import SentenceTransformer
    except ImportError:
        print("\n(dense half skipped: pip install sentence-transformers)")
        return None
    import numpy as np

    m = SentenceTransformer("sentence-transformers/all-MiniLM-L6-v2")
    E = m.encode(CORPUS, normalize_embeddings=True)
    print("\nall-MiniLM-L6-v2, %d dims, cosine" % E.shape[1])

    def sims(text):
        v = m.encode([text], normalize_embeddings=True)[0]
        return (E @ v).tolist()

    ranks = {}
    for name, q in [("raw question", RAW), ("HyDE", HYDE), ("step-back", STEPBACK)]:
        sc = sims(q)
        ranks[name] = report(name, ranking(sc), sc)
    ranks["multi-query (RRF)"] = report(
        "multi-query (RRF)", rrf([ranking(sims(q)) for q in MULTI])
    )
    ranks["sub-questions (RRF)"] = report(
        "sub-questions (RRF)", rrf([ranking(sims(q)) for q in SUBQ])
    )

    # The gap itself: question-to-passage vs passage-to-passage distance.
    qv = m.encode([RAW], normalize_embeddings=True)[0]
    hv = m.encode([HYDE], normalize_embeddings=True)[0]
    qq = [
        "how do I get a refund",
        "can I cancel my ticket and be paid back",
        "what happens to my money if I do not fly",
    ]
    QV = m.encode(qq, normalize_embeddings=True)
    import itertools

    q_q = np.mean([float(a @ b) for a, b in itertools.combinations(QV, 2)])
    d_d = np.mean(
        [float(E[i] @ E[j]) for i, j in itertools.combinations([7, 8, 9, 14, 22], 2)]
    )
    tickets = list(range(26, 38))
    policies = [0, 2, 5, 7, 8, 9, 14, 18, 22, 23]
    t_mean = float(np.mean([qv @ E[i] for i in tickets]))
    p_mean = float(np.mean([qv @ E[i] for i in policies]))
    print(
        "  mean cos question-question %.3f | passage-passage %.3f | "
        "raw question-gold %.3f | HyDE-gold %.3f" 
        % (q_q, d_d, float(qv @ E[GOLD]), float(hv @ E[GOLD]))
    )
    print(
        "  raw question to customer-voice tickets %.3f | to policy pages %.3f "
        "(the question is closer to other questions than to its own answer)"
        % (t_mean, p_mean)
    )
    return ranks


if __name__ == "__main__":
    b = run_bm25()
    d = run_dense()
    # The check: rewriting must not make the gold passage harder to find.
    assert b["raw question"] >= b["HyDE"], "HyDE lost ground on BM25"
    if d:
        assert d["HyDE"] <= d["raw question"], "HyDE lost ground on dense"
    print("\nok")
