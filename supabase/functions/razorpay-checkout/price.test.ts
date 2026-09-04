/* Self-check that the price we CHARGE matches the price we SHOW. The two live
   in different files by design (the amount must be server-side), so nothing but
   this stops one from drifting after a price change.

     node --experimental-strip-types supabase/functions/razorpay-checkout/price.test.ts

   ponytail: regex over the two source files — no bundler, no import of browser
   globals. Add a real parse if the files ever stop being hand-edited. */

import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

const read = (rel: string) =>
  readFileSync(fileURLToPath(new URL(rel, import.meta.url)), "utf8");

const paise = Number(/const YEARLY_PAISE = (\d+)/.exec(read("./index.ts"))![1]);
const shown = /yearly:\s*\{[^}]*price:\s*"₹(\d+)"/.exec(read("../../../js/supabase-config.js"))![1];

assert.equal(paise % 100, 0, "YEARLY_PAISE is not a whole number of rupees");
assert.equal(
  paise / 100,
  Number(shown),
  `charging ₹${paise / 100} but pricing page shows ₹${shown}`,
);
assert.ok(paise >= 100, "below Razorpay's 100-paise minimum");

console.log(`ok — yearly plan charges and displays ₹${shown}`);
