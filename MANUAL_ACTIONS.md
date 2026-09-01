# Manual Actions — things only you can do

Code I can write for you lives in the repo. This file is the list of things that
require **your** logins, dashboards, secrets, and card — I can't and shouldn't do
these. Do them top to bottom. Each step says exactly where to click.

Your project reference is `gfmeewpztjxhuemrymzi` throughout.

---

## PART A — Security check (do this first, 5 minutes)

### A1. Confirm no service_role key is committed
The `service_role` key bypasses all security. It must NEVER be in the repo.

Run in the project folder:
```bash
grep -rn "service_role" . --exclude-dir=.git
```
- Expected: matches only inside `supabase/functions/razorpay-webhook/` comments/code
  that *reference the name* (e.g. `SUPABASE_SERVICE_ROLE_KEY`), never an actual key
  value (a long `eyJ...` string).
- If you see an actual JWT value assigned to it anywhere → **stop**, delete it,
  and rotate the key in Supabase (Settings → API → "Reset service_role key").

The `anon` key already in `js/supabase-config.js` is fine — it's meant to be public.

### A2. Confirm Row Level Security is ON
1. Go to <https://supabase.com/dashboard/project/gfmeewpztjxhuemrymzi>
2. Left sidebar → **Table Editor** → select the `profiles` table.
3. Top of the table view, confirm it says **"RLS enabled"** (a green shield / lock).
   - If it says RLS is *disabled*, go to **Authentication → Policies**, find
     `profiles`, and click **Enable RLS**.
4. Left sidebar → **Authentication → Policies** → under `profiles` you should see
   exactly one policy: **"read own profile"** (SELECT). There should be **no**
   INSERT/UPDATE policy for regular users — that's what stops someone giving
   themselves premium from the browser. Leave it that way.

### A3. Lock down redirect URLs
1. **Authentication → URL Configuration**.
2. **Site URL**: set to your real deployed site (e.g. `https://hackdynamics.com`).
3. **Redirect URLs**: add your production URL **and** `http://localhost:8643`
   (the local preview port). Remove anything you don't recognize.

---

## ⚠️ DEPLOY SAFETY — the one rule that keeps the course paid

The chapter text now lives in `supabase/functions/course-content/_data/` and is
served only by the Edge Function. That protection holds **only if your static
host does not also serve the `supabase/` folder.** If your live site serves the
whole repo, anyone can open
`https://yoursite.com/supabase/functions/course-content/_data/bookData-part1.js`
and read everything — right back to square one.

You're deploying on **Vercel**. Two separate leak vectors to close:

**1. Vercel must not serve the `supabase/` folder.** By default Vercel serves
every file in the repo from the root, which *would* expose the chapter files.
The `.vercelignore` file in this repo prevents that — it stops `supabase/`, the
source PDF, and the internal docs from ever being uploaded to Vercel. Don't
delete it. (The Supabase CLI ignores `.vercelignore`, so your Edge Functions
still deploy fine.)

**2. Your GitHub repo must be private.** The content is committed to git. If the
repo backing your Vercel project is **public on GitHub**, anyone can read
`supabase/functions/course-content/_data/bookData-*.js` straight from GitHub —
`.vercelignore` does nothing about that. Keep the repo **Private**
(GitHub → repo → Settings → Danger Zone → Change visibility).

**After the first deploy, verify both are closed:**
```bash
# Must return 404 (Vercel isn't serving the content):
curl -I https://YOUR-VERCEL-DOMAIN/supabase/functions/course-content/_data/bookData-part1.js

# The content endpoint must reject anonymous callers with 401 (not the JSON):
curl -i https://gfmeewpztjxhuemrymzi.supabase.co/functions/v1/course-content
```
If the first returns 200, the `.vercelignore` didn't apply — stop and fix it
before announcing the site.

---

## PART B — Deploy the Edge Functions

There are three functions in `supabase/functions/`:
- **`course-content`** — serves the paid chapter text to premium users only.
  **Deploy this before you go live** — it's what stops the course from being
  freely downloadable. It needs no secret.
- **`razorpay-checkout`** — creates the order and verifies the payment signature
  (the checkout the browser talks to). Needs `RAZORPAY_KEY_ID` +
  `RAZORPAY_KEY_SECRET` — see PART D1.
- **`razorpay-webhook`** — the server-to-server backstop that grants premium even
  if the browser closes mid-payment. Needs `RAZORPAY_WEBHOOK_SECRET` (PART C2).

You need **both** Razorpay functions: `razorpay-checkout` unlocks the course
instantly after payment, and `razorpay-webhook` catches the cases where the
browser never made it back.

Prereq: the Supabase CLI is already installed on your machine (`supabase --version`
should print a number). If not: `brew install supabase/tap/supabase`.

### B1. Log in and link the project
```bash
cd /Users/santanudas/Developer/skystrix/hackdynamics
supabase login          # opens a browser to authorize the CLI
supabase link --project-ref gfmeewpztjxhuemrymzi
```
`supabase link` will ask for your **database password**. If you don't remember it:
Dashboard → **Settings → Database → Reset database password**, then use the new one.

### B2. Deploy the content function (do this now)
```bash
supabase functions deploy course-content
```
- `SUPABASE_URL` and `SUPABASE_ANON_KEY` are injected automatically — set nothing.
- Verify it's up: Dashboard → **Edge Functions** → `course-content` should be listed.
- Quick check it's gating correctly (should return **401**, not the content):
  ```bash
  curl -i https://gfmeewpztjxhuemrymzi.supabase.co/functions/v1/course-content
  ```
  A logged-in premium browser gets the JSON; an anonymous `curl` must not.

### B3. Get your Razorpay webhook secret (needed for the next step)
See PART C step C2 below — it's created in the Razorpay dashboard. Come back here
with that secret value (it looks like a random string you choose or Razorpay shows).

### B4. Set the secret and deploy the webhook
```bash
supabase secrets set RAZORPAY_WEBHOOK_SECRET=paste_your_secret_here
supabase functions deploy razorpay-webhook
```
- `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` are injected automatically by
  Supabase — do **not** set those yourself.
- After deploy, your function is live at:
  ```
  https://gfmeewpztjxhuemrymzi.supabase.co/functions/v1/razorpay-webhook
  ```
- Verify it's up: Dashboard → **Edge Functions** → `razorpay-webhook` should be
  listed with a recent deploy time.

---

## PART B2 — Deploy the site to Vercel

Do this after the `course-content` function is live (B2). No build step — it's a
plain static site; Vercel serves it as-is.

### Push to a PRIVATE GitHub repo
1. Create a **Private** repo on GitHub (Private matters — see DEPLOY SAFETY;
   a public repo exposes the committed content regardless of Vercel).
2. Push this project to it:
   ```bash
   git add -A && git commit -m "Gate course content behind Edge Function"
   git push
   ```

### Import into Vercel
1. <https://vercel.com> → **Add New… → Project** → import your GitHub repo.
2. **Framework Preset**: **Other**. **Build Command**: leave empty.
   **Output Directory**: leave empty (serves the repo root). **Root Directory**: `./`.
3. **Deploy**. You'll get a URL like `https://hackdynamics.vercel.app`.
4. The `.vercelignore` in this repo automatically keeps `supabase/`, the PDF, and
   the internal docs out of the deployment — don't remove it.

### Point Supabase at the live domain
Now that you have the Vercel URL, finish **PART A3**:
- **Authentication → URL Configuration → Site URL** = your Vercel URL.
- **Redirect URLs**: add your Vercel URL (keep `http://localhost:8643` for local).

### Verify the deploy is safe (run both)
```bash
# Content files must NOT be served by Vercel → expect 404:
curl -I https://YOUR-VERCEL-DOMAIN/supabase/functions/course-content/_data/bookData-part1.js
# Content endpoint must reject anonymous callers → expect 401:
curl -i https://gfmeewpztjxhuemrymzi.supabase.co/functions/v1/course-content
```
Then open the site, sign in with a premium account (grant one via the SQL at the
bottom of this file), and confirm the chapters load.

---

## PART C — Razorpay account setup

### C1. Create / access your Razorpay account
1. Sign up or log in at <https://dashboard.razorpay.com>.
2. Complete **KYC / account activation** if you haven't — you cannot accept live
   payments until Razorpay approves your business. This can take a day or two, so
   start it early.
3. While waiting, you can build and test everything in **Test Mode** (toggle at the
   top-left of the dashboard). Test mode gives you `rzp_test_...` keys.

### C2. Create the webhook
1. Dashboard → **Settings → Webhooks → + Add New Webhook**.
2. **Webhook URL**: paste the function URL (shown after deploy in step B4):
   `https://gfmeewpztjxhuemrymzi.supabase.co/functions/v1/razorpay-webhook`
3. **Secret**: type a strong random string of your choice (e.g. from a password
   manager). **This exact value is what you set as `RAZORPAY_WEBHOOK_SECRET` in
   step B4** — they must match character-for-character.
4. **Active Events**: check **`payment.captured`** (and optionally `order.paid`).
   Leave everything else unchecked.
5. Save.

### C3. Get your API key ID and put it in the config
1. Dashboard → **Settings → API Keys → Generate Key** (Test mode first).
2. Copy the **Key ID** (`rzp_test_...` / later `rzp_live_...`). This is the only
   Razorpay value that goes in browser code — it's safe to expose.
3. Paste it into **`js/supabase-config.js`**, replacing the placeholder:
   ```js
   RAZORPAY_KEY_ID: "rzp_test_YOUR_KEY_ID",   // ← your Key ID from step 2
   PRICE_PAISE: 49900,                        // ₹499.00 per month
   PRICE_LABEL: "₹499 / month"                // shown on the upgrade wall
   ```
   Keep all three in this one file — the pricing page, the upgrade wall, and the
   checkout button read them from here, so the price lives in exactly one place.
4. The **Key Secret** shown here is NOT the webhook secret and must never go in the
   browser or the repo. You only need it later if you add server-side order creation.

### Where each Razorpay value goes — quick reference

| Value | Where it goes | Public? |
|---|---|---|
| **Key ID** (`rzp_test_…` / `rzp_live_…`) | `js/supabase-config.js` → `RAZORPAY_KEY_ID` | Yes, safe in the browser |
| **Key Secret** | Nowhere yet (only needed for server-side orders, PART F) | **No — never commit** |
| **Webhook Secret** (you invent it in C2) | `supabase secrets set RAZORPAY_WEBHOOK_SECRET=…` (step B4) | **No — never commit** |

---

## PART D — Checkout (already wired — you just deploy it)

**Status: written and in the repo.** Standard Web Checkout is integrated end to
end. You don't have to edit any code — you only need to push the secrets and
deploy the function below.

What's in place:
- `supabase/functions/razorpay-checkout/` — one function, two endpoints:
  - `POST …/razorpay-checkout/create-order` → creates the Razorpay order
  - `POST …/razorpay-checkout/verify-payment` → verifies the HMAC signature and
    flips `is_premium`
- `js/gate.js` — opens the Razorpay modal from the upgrade wall, handles cancel,
  `payment.failed`, and confirmation errors.
- `databases-in-depth.html` — loads `checkout.js`.
- `js/supabase-config.js` — holds your **Key ID** (public).

**The price is server-side.** `create-order` ignores anything the browser sends
and uses `PRICE_PAISE` in
`supabase/functions/razorpay-checkout/index.ts` (49900 = ₹499). Nobody can edit
the amount in devtools and buy the course for ₹1. `PRICE_PAISE` in
`js/supabase-config.js` is display-only — change both together.

### D1. Push the Razorpay keys as Supabase secrets and deploy
```bash
supabase secrets set RAZORPAY_KEY_ID=rzp_test_TWpsPg24h4cp4b
supabase secrets set RAZORPAY_KEY_SECRET=your_key_secret_here
supabase functions deploy razorpay-checkout
```
- The **Key Secret** lives only here and in your local `.env` (gitignored and
  vercelignored). It must never appear in `js/` or any HTML page.
- `SUPABASE_URL`, `SUPABASE_ANON_KEY` and `SUPABASE_SERVICE_ROLE_KEY` are
  injected automatically — don't set them.
- `supabase/config.toml` already sets `verify_jwt = false` for this function; it
  authenticates callers itself. Deploy from the repo root so that's picked up.

### ⚠️ D2. "₹499 / month" is advertised, but the backend charges once

`pricing.html` and the upgrade wall say **₹499 per month**. What's actually built
today is a **one-time payment**: checkout creates a normal Razorpay *order*, and
both `verify-payment` and the `payment.captured` webhook set `is_premium = true`
**permanently** — nothing ever bills again or expires.

So right now a member pays ₹499 once and keeps access forever. Pick one before you
take real money:

- **(a) Sell it as one-time.** Change the pricing page to "₹499 one-time" and drop
  "Cancel anytime". Zero new code — what's built is already correct for this.
- **(b) Make it genuinely monthly.** Razorpay **Subscriptions**, not orders:
  1. Dashboard → **Subscriptions → Plans → Create Plan**: ₹499, billing cycle
     *monthly*. Copy the **Plan ID** (`plan_…`).
  2. `create-order` returns a `subscription_id` instead of an order, and checkout
     opens with that.
  3. Add `subscription.charged` (renewal) and `subscription.cancelled` /
     `subscription.halted` to the webhook's events, and add an `expires_at` column
     to `profiles` so lapsed members lose access.

Until you choose, keep Razorpay in **Test Mode**. Selling "per month" while the
system only ever charges once is the kind of thing that causes chargebacks.

### ⚠️ D2. "₹499 / month" is advertised, but the backend charges once

`pricing.html` and the upgrade wall say **₹499 per month**. What's actually built
today is a **one-time payment**: `razorpay-webhook` listens for `payment.captured`
and sets `is_premium = true` **permanently** — nothing ever bills again or expires.

So right now a member pays ₹499 once and keeps access forever. Pick one before you
take real money:

- **(a) Sell it as one-time.** Change the pricing page to "₹499 one-time" and drop
  "Cancel anytime". Zero new code — the current backend is already correct for this.
- **(b) Make it genuinely monthly.** Razorpay **Subscriptions**, not orders:
  1. Dashboard → **Subscriptions → Plans → Create Plan**: ₹499, billing cycle
     *monthly*. Copy the **Plan ID** (`plan_…`).
  2. Checkout opens with `subscription_id` instead of `amount`, which needs a
     server-side call to create the subscription (a third Edge Function).
  3. Add `subscription.charged` (renewal) and `subscription.cancelled` /
     `subscription.halted` to the webhook's events, and add an `expires_at` column
     to `profiles` so lapsed members lose access.

Until you choose, keep Razorpay in **Test Mode**. Selling "per month" while the
system only ever charges once is the kind of thing that causes chargebacks.

---

## PART E — End-to-end test (Test Mode)

Prereq: `razorpay-checkout` deployed (D1) and `razorpay-webhook` deployed (B4).

1. Make sure Razorpay is in **Test Mode** and you used `rzp_test_...` keys.
2. Open the course page, log in with a test account that is **not** premium → you
   should see the upgrade wall showing **Upgrade — ₹499 / month**.
3. Click it → Razorpay's test checkout opens. Pay with a
   [Razorpay test card](https://razorpay.com/docs/payments/payments/test-card-details/)
   (e.g. card `4111 1111 1111 1111`, any future expiry, any CVV).
4. The button shows "Confirming payment…", then the page reloads and the course
   unlocks — `verify-payment` checked the signature and flipped `is_premium`.
5. Also worth testing the unhappy paths:
   - **Close the modal** without paying → "Payment cancelled — nothing was
     charged", button re-enables. Nothing should change in `profiles`.
   - **Failed card** (Razorpay's failure test card) → the error description shows
     and no premium is granted.
6. If it does **not** unlock, check in this order:
   - Dashboard → **Edge Functions → razorpay-checkout → Logs**. A `401` means the
     browser's token didn't resolve; `500` with "Razorpay order failed" usually
     means the Key ID/Secret pair is wrong or not set (re-run D1).
   - Dashboard → **Edge Functions → razorpay-webhook → Logs** for the backstop.
   - Razorpay → **Settings → Webhooks → your webhook → recent deliveries**: a `200`
     means success; `400` = signature mismatch (secret doesn't match B3/C2); `404`
     = no profile matched (the logged-in user's id wasn't in `notes`).
   - Table Editor → `profiles` → your test user's `is_premium` should be `true`.

> Local testing note: checkout calls the **deployed** Edge Function, so it works
> from `localhost` too — but the Supabase **Authentication → URL Configuration**
> redirect list must include your local origin for login to work (PART A3).

---

## PART F — Before you go live (later, not blocking)

- [ ] Switch Razorpay to **Live Mode**; regenerate **live** keys and a **live**
      webhook (repeat C2/C3 with `rzp_live_...`); update `key` in `gate.js` and
      re-run `supabase secrets set` + `functions deploy` with the live webhook secret.
- [ ] **Authentication → Email**: turn **"Confirm email" back ON** for production
      (see `SUPABASE_SETUP.md` step 4).
- [ ] **Decide one-time vs. genuinely monthly** (PART D2 above) and make the pricing
      page tell the truth. Blocking — don't take live payments until this is settled.
- [x] **Server-side order creation: DONE.** `razorpay-checkout` derives both the
      payer and the amount from the caller's Supabase token, so the price can no
      longer be edited in the browser.
- [x] **Content protection (#3): DONE.** Chapters now come from the `course-content`
      Edge Function, premium-only. Two things keep it real: deploy that function
      (PART B, step B2) and don't serve `supabase/` publicly (DEPLOY SAFETY above).
- [ ] Optional: the interactive engines (`js/viz*.js`, `js/quiz.js`) are still
      public code. They're rendering logic, not the written course, so this is
      low priority — but if you consider them premium IP too, they can move behind
      the same gate later.

---

## Manual premium grant (until checkout is wired)

To unlock the course for yourself/an account right now, without paying:
Dashboard → **SQL Editor → New query**:
```sql
update public.profiles set is_premium = true
where email = 'you@example.com';
```
Reload the course page — it unlocks.
