/* Self-check for the two Razorpay signature formats. Run it after touching
   verify.ts — the order/subscription messages are REVERSED relative to each
   other, and getting one wrong either rejects every real payment or (worse)
   accepts a forged one.

     node --experimental-strip-types supabase/functions/razorpay-checkout/verify.test.ts

   ponytail: no test framework — assert + a hand-rolled reference HMAC is the
   whole check. Add a runner when there is a second test file. */

import { createHmac } from "node:crypto";
import assert from "node:assert/strict";
import { verifyPaymentSignature, verifySubscriptionSignature } from "./verify.ts";

const SECRET = "test_secret";
// Independent reference implementation — if this and verify.ts agree, the
// message format is right; a copy of verify.ts's own hmacHex would prove nothing.
const sign = (msg: string) => createHmac("sha256", SECRET).update(msg).digest("hex");

const order = "order_ABC123";
const sub = "sub_XYZ789";
const payment = "pay_QQQ111";

// Razorpay signs "<order_id>|<payment_id>" for a one-time order…
assert.equal(await verifyPaymentSignature(order, payment, sign(`${order}|${payment}`), SECRET), true);
// …and "<payment_id>|<subscription_id>" for a subscription. Note the flip.
assert.equal(await verifySubscriptionSignature(payment, sub, sign(`${payment}|${sub}`), SECRET), true);

// The flipped message must NOT verify — this is the bug the two functions exist to prevent.
assert.equal(await verifyPaymentSignature(order, payment, sign(`${payment}|${order}`), SECRET), false);
assert.equal(await verifySubscriptionSignature(payment, sub, sign(`${sub}|${payment}`), SECRET), false);

// Forgeries and empties are rejected.
assert.equal(await verifyPaymentSignature(order, payment, sign(`${order}|${payment}`), "wrong_secret"), false);
assert.equal(await verifyPaymentSignature(order, payment, "", SECRET), false);
assert.equal(await verifySubscriptionSignature(payment, sub, "", SECRET), false);
assert.equal(await verifySubscriptionSignature(payment, sub, "deadbeef", SECRET), false);

console.log("verify.ts OK");
