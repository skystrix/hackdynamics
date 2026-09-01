/* HMAC-SHA256 helpers for Razorpay Checkout (Web Crypto, no deps).

   ponytail: razorpay-webhook/verify.ts has the same primitives, but each
   Edge Function deploys as its own self-contained bundle — a cross-function
   relative import is not guaranteed to bundle. 20 duplicated lines beats a
   deploy that breaks in production. Move both to functions/_shared/ if a
   third consumer ever appears. */

async function hmacHex(message: string, secret: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const mac = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(message));
  return [...new Uint8Array(mac)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

// Constant-time hex compare — avoids leaking the signature via timing.
function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

/* Checkout's signature covers "<order_id>|<payment_id>" — NOT the raw body
   the webhook verifies. Same algorithm, different message. */
export async function verifyPaymentSignature(
  orderId: string,
  paymentId: string,
  signature: string,
  secret: string,
): Promise<boolean> {
  if (!signature) return false;
  const expected = await hmacHex(`${orderId}|${paymentId}`, secret);
  return timingSafeEqual(expected, signature);
}
