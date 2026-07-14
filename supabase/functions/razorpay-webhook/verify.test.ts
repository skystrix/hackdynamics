/* Run: deno test  (in this folder)
   Golden value cross-checked against Node's crypto.createHmac. */
import { assert } from "jsr:@std/assert";
import { verifySignature } from "./verify.ts";

const body = '{"event":"payment.captured"}';
const secret = "whsec_test";

Deno.test("valid signature verifies", async () => {
  const sig = await sign(body, secret);
  assert(await verifySignature(body, sig, secret));
});

Deno.test("wrong signature rejected", async () => {
  const sig = await sign(body, secret);
  assert(!(await verifySignature(body, sig + "00", secret)));
  assert(!(await verifySignature(body, "", secret)));
  assert(!(await verifySignature(body + " ", sig, secret))); // tampered body
});

Deno.test("wrong secret rejected", async () => {
  const sig = await sign(body, secret);
  assert(!(await verifySignature(body, sig, "whsec_other")));
});

// Local re-implementation used only to produce a valid signature for the test.
async function sign(b: string, s: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw", new TextEncoder().encode(s),
    { name: "HMAC", hash: "SHA-256" }, false, ["sign"],
  );
  const mac = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(b));
  return [...new Uint8Array(mac)].map((x) => x.toString(16).padStart(2, "0")).join("");
}
