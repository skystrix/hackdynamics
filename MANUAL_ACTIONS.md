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
2. **Site URL**: `https://www.hackdynamics.com` — **with the `www.`**. The apex
   308-redirects to `www`, so `www` is the host browsers actually sit on.
3. **Redirect URLs**: add all three, wildcards included:
   - `https://www.hackdynamics.com/**`
   - `https://hackdynamics.com/**`
   - `http://localhost:8643/**`

   Remove anything you don't recognize.

> **This list is what makes password-reset and confirmation links work.** Auth
> links carry `redirect_to=https://www.hackdynamics.com/login.html`; if that URL
> isn't matched here, GoTrue *silently drops it* and sends the user to the Site
> URL instead — they land on the homepage with the recovery token stranded in the
> URL hash and no way to set a password. Symptom: "the reset link just goes to
> hackdynamics.com". Cause: `www` missing from this list.

### A4. Custom SMTP — REQUIRED before launch (fixes the signup 429s)

Symptom: `POST /auth/v1/signup` returns **429** and the page says *"email rate
limit exceeded"*. Nothing is wrong with the code. Supabase's built-in email
sender is a shared sandbox capped at **2 emails per hour for the entire
project** — not per user. With "Confirm email" ON, every signup sends one, so
the third person to sign up in an hour is blocked. It is meant for development
only and Supabase will never raise it.

Fix = bring your own SMTP, then raise the rate limit.

1. Get SMTP credentials from any transactional provider. Cheapest sane options:
   **Resend** (3k emails/month free), **Brevo**, **Postmark**, or **Amazon SES**.
   Verify your sending domain (`hackdynamics.com`) in their dashboard and add the
   DKIM/SPF DNS records they give you — without this your mail lands in spam.
2. Supabase → **Authentication → Emails → SMTP Settings** → enable **Custom SMTP**:
   - Sender email: `no-reply@hackdynamics.com` (must be on the verified domain)
   - Sender name: `HackDynamics`
   - Host / Port / Username / Password: from the provider (usually port `587`)
3. Supabase → **Authentication → Rate Limits** → **"Rate limit for sending emails"**.
   It is stuck at 2/hour until custom SMTP is on; afterwards set it to **100 per
   hour** (raise later if signups justify it). While you're there, leave
   "Rate limit for sign ups and sign ins" at its default — that one is per-IP and
   is genuine abuse protection.
4. Test: sign up with a fresh address and confirm the mail arrives from your own
   domain, and that a second and third signup in the same minute also work.

Also confirm `https://www.hackdynamics.com/login.html` is in **Authentication →
URL Configuration → Redirect URLs** (with the `www.`) — the signup call in the
logs uses that exact `redirect_to`, and an unlisted URL is silently dropped.

Interim workaround only, if you need signups working this minute: turn
**Authentication → Providers → Email → "Confirm email" OFF**. No email is sent,
so no 429 — but anyone can register with an address they don't own. Turn it back
on the moment SMTP is configured.

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
cd hackdynamics
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
4. **Active Events**: check exactly these three:
   - **`payment.captured`** — the ₹1999 one-time payment.
   - **`subscription.charged`** — the ₹299 subscription. Fires on the first
     charge **and on every monthly renewal**; each one extends the member's
     access. Without this, subscribers lose access after one month.
   - **`order.paid`** (optional, a second belt for the one-time plan).

   Leave everything else unchecked. You do **not** need
   `subscription.cancelled` / `subscription.halted`: access is stored as an
   expiry date, so a cancelled subscription simply stops being extended and
   lapses on its own at the end of the period the member already paid for.
5. Save.

### C3. Get your API key ID and put it in the config
1. Dashboard → **Settings → API Keys → Generate Key** (Test mode first).
2. Copy the **Key ID** (`rzp_test_...` / later `rzp_live_...`). This is the only
   Razorpay value that goes in browser code — it's safe to expose.
3. Paste it into **`js/supabase-config.js`**, replacing the placeholder:
   ```js
   RAZORPAY_KEY_ID: "rzp_test_YOUR_KEY_ID",   // ← your Key ID from step 2
   PLANS: {
     monthly:  { label: "₹299 / month",   price: "₹299",  per: "/ month" },
     lifetime: { label: "₹1999 one-time", price: "₹1999", per: "one-time" }
   }
   ```
   The `PLANS` labels are **display only** — the pricing page and the upgrade
   wall read them so the wording lives in one place. The amounts actually
   charged come from the server (the Razorpay plan for monthly, `LIFETIME_PAISE`
   in the Edge Function for one-time), so editing these in devtools changes the
   words, never the price.
4. The **Key Secret** shown here is NOT the webhook secret and must never go in the
   browser or the repo. You only need it later if you add server-side order creation.

### Where each Razorpay value goes — quick reference

| Value | Where it goes | Public? |
|---|---|---|
| **Key ID** (`rzp_test_…` / `rzp_live_…`) | `js/supabase-config.js` → `RAZORPAY_KEY_ID` | Yes, safe in the browser |
| **Key Secret** | `supabase secrets set RAZORPAY_KEY_SECRET=…` (step D1) | **No — never commit** |
| **Webhook Secret** (you invent it in C2) | `supabase secrets set RAZORPAY_WEBHOOK_SECRET=…` (step B4) | **No — never commit** |
| **Monthly Plan ID** (`plan_…`, created in C4) | `supabase secrets set RAZORPAY_PLAN_ID_MONTHLY=…` (step D1) | Not secret, but keep it server-side |

### C4. Create the ₹299 monthly plan (needed for the subscription)

A Razorpay **Plan** is the recurring price. You create it once in the dashboard;
the code never creates plans, it only starts subscriptions against this one.

1. Dashboard → **Subscriptions → Plans → + Create Plan**.
   (If you don't see "Subscriptions" in the sidebar, the feature isn't enabled on
   your account yet: **Account & Settings → Configuration → Subscriptions**, or
   ask Razorpay support to enable it. Test Mode usually has it on by default.)
2. Fill in:
   - **Plan name**: `HackDynamics Monthly`
   - **Billing frequency / period**: **Monthly**, interval **1**
   - **Amount**: **299** INR (enter rupees here; the API talks in paise, the
     dashboard does not)
   - **Plan description**: `Databases in Depth — monthly membership`
   - Leave **trial period** and **add-ons** empty.
3. **Create Plan**, then copy the **Plan ID** — it looks like `plan_NxxxxxxxxxxxxX`.
4. You'll paste it into step **D1** as `RAZORPAY_PLAN_ID_MONTHLY`.

> **Test vs Live plans are different objects.** A `plan_…` created in Test Mode
> does not exist in Live Mode. When you flip to live (PART F) you must create the
> plan again in Live Mode and re-run `supabase secrets set` with the new ID.

> **Changing the price later**: Razorpay plans are immutable. To move off ₹299
> you create a *new* plan and point `RAZORPAY_PLAN_ID_MONTHLY` at it. Existing
> subscribers stay on the old plan until they cancel and resubscribe — which is
> the honest behaviour anyway.

### C5. Enable e-mandate / UPI Autopay methods (subscriptions only)

A subscription needs a payment method that supports recurring debits. In
Razorpay → **Account & Settings → Configuration → Payment Methods**, make sure at
least **Cards (recurring)** and **UPI Autopay** are enabled. Netbanking e-mandate
is optional. If none are on, the subscription checkout will open but no payment
method will be selectable, and customers just see an empty modal.

---

## PART D — Checkout (already wired — you just deploy it)

**Status: written and in the repo.** Standard Web Checkout is integrated end to
end. You don't have to edit any code — you only need to push the secrets and
deploy the function below.

**Two plans are wired end to end:**

| Plan | ₹ | Razorpay object | `profiles.premium_until` |
|---|---|---|---|
| Monthly | 299 / month | **Subscription** on the plan from C4 | period end, extended on every `subscription.charged` |
| One-time | 1999 once | **Order** (a normal payment) | `null` — never expires |

What's in place:
- `supabase/functions/razorpay-checkout/` — one function, two endpoints:
  - `POST …/razorpay-checkout/create-order` → takes `{"plan":"monthly"}` or
    `{"plan":"lifetime"}` and creates a Razorpay **subscription** or **order**
  - `POST …/razorpay-checkout/verify-payment` → verifies the HMAC signature
    (different message format for each) and grants access
- `supabase/functions/razorpay-webhook/` — grants the one-time plan and, more
  importantly, **extends the subscription every month** on `subscription.charged`.
- `js/gate.js` — the upgrade wall now has two buttons; handles cancel,
  `payment.failed`, and confirmation errors.
- `pricing.html` — two plan cards.
- `js/supabase-config.js` — your **Key ID** (public) and the display labels.

**The price is server-side.** `create-order` reads only *which plan* from the
browser, never an amount. Monthly's price lives in the Razorpay plan
(`RAZORPAY_PLAN_ID_MONTHLY`); one-time's lives in `LIFETIME_PAISE` in
`supabase/functions/razorpay-checkout/index.ts` (199900 = ₹1999). Nobody can edit
the amount in devtools and buy the course for ₹1. The `PLANS` labels in
`js/supabase-config.js` are display-only — change them together with the server
values.

### D0. Add the `premium_until` column (do this before deploying)

Supabase → **SQL Editor → New query**, run:

```sql
alter table public.profiles add column if not exists premium_until timestamptz;
```

Existing premium members keep `premium_until = null`, which means "never
expires" — nobody loses access. This is idempotent, safe to re-run.

### D1. Push the Razorpay keys as Supabase secrets and deploy
```bash
supabase secrets set RAZORPAY_KEY_ID=rzp_test_TWpsPg24h4cp4b
supabase secrets set RAZORPAY_KEY_SECRET=your_key_secret_here
supabase secrets set RAZORPAY_PLAN_ID_MONTHLY=plan_YOUR_PLAN_ID_FROM_C4
supabase functions deploy razorpay-checkout
supabase functions deploy razorpay-webhook   # re-deploy: it now handles renewals
```

If `RAZORPAY_PLAN_ID_MONTHLY` is missing, the one-time plan still works and the
monthly button returns a clear "Monthly plan is not configured yet" instead of
a crash.
- The **Key Secret** lives only here and in your local `.env` (gitignored and
  vercelignored). It must never appear in `js/` or any HTML page.
- `SUPABASE_URL`, `SUPABASE_ANON_KEY` and `SUPABASE_SERVICE_ROLE_KEY` are
  injected automatically — don't set them.
- `supabase/config.toml` already sets `verify_jwt = false` for this function; it
  authenticates callers itself. Deploy from the repo root so that's picked up.

### D2. How access is granted and expires

This is the bit worth understanding before you take real money.

`profiles.premium_until` is the single source of truth for *when* access ends:

- **`null`** → never expires. Set by the one-time ₹1999 purchase.
- **a timestamp** → the end of the current subscription period, plus 3 days of
  grace so a retried renewal charge doesn't lock someone out mid-retry.

Both `js/auth.js` (the UI) and the `course-content` Edge Function (the real
gate) treat `is_premium = true` **and** a past `premium_until` as *not* premium.

The monthly renewal loop is entirely webhook-driven: Razorpay charges the card,
sends `subscription.charged`, and the webhook pushes `premium_until` to the new
period end. **If you forget to tick `subscription.charged` in C2, subscribers
pay every month and lose access after the first one.** That is the single most
important checkbox in this file.

Cancellations need no code: a cancelled subscription stops sending
`subscription.charged`, so `premium_until` stops moving and access ends when the
already-paid period does — which is exactly what the pricing page promises.

One subtlety already handled: a subscription charge *also* emits
`payment.captured`. The webhook skips any payment carrying an `invoice_id`
(every subscription charge has one) so a ₹299 subscriber is never accidentally
granted the never-expiring one-time plan.

### D3. Cancelling a subscription

There is no self-serve cancel button in the UI yet. Until there is: Razorpay
Dashboard → **Subscriptions** → find the subscription → **Cancel** → choose
**"at the end of the current cycle"**. The member keeps access to the end of the
period they paid for, then lapses automatically.

If you'd rather members cancel themselves, that's a fourth endpoint plus storing
the `sub_…` id on the profile — say the word and it's a small addition.

---

## PART E — End-to-end test (Test Mode)

Prereq: `razorpay-checkout` deployed (D1) and `razorpay-webhook` deployed (B4).

1. Make sure Razorpay is in **Test Mode** and you used `rzp_test_...` keys.
2. Open the course page, log in with a test account that is **not** premium → the
   upgrade wall should show **two** buttons: **Subscribe — ₹299 / month** and
   **Buy once — ₹1999 one-time**.

**Test the one-time plan first (simplest):**

3. Click **Buy once** → Razorpay's test checkout opens for ₹1999. Pay with a
   [Razorpay test card](https://razorpay.com/docs/payments/payments/test-card-details/)
   (e.g. card `4111 1111 1111 1111`, any future expiry, any CVV).
4. The button shows "Confirming payment…", then the page reloads and the course
   unlocks. In Table Editor → `profiles`, that user should now have
   `is_premium = true` and `premium_until = null`.

**Then the subscription:**

5. Reset the test user (`update public.profiles set is_premium = false,
   premium_until = null where email = '…';`), reload, and click
   **Subscribe — ₹299 / month**. Razorpay's subscription checkout opens — note it
   asks to *authorise* a mandate, not just a one-off payment. Use a
   [recurring-enabled test card](https://razorpay.com/docs/payments/subscriptions/test-cards/)
   (`5104 0155 5555 5558` works for recurring in test mode).
6. After it succeeds, `profiles` should show `is_premium = true` and a
   `premium_until` about a month out. Razorpay → **Subscriptions** should list it
   as **Active**.
7. Check the renewal path without waiting a month: Razorpay → **Settings →
   Webhooks → your webhook → Test webhook**, send a `subscription.charged` event
   — or just confirm the webhook's recent deliveries show a `200` for the first
   charge. A `200` means renewals will extend `premium_until` correctly.
8. Expiry check: set `premium_until` to yesterday in the SQL editor and reload
   the course page — you should be back at the upgrade wall, and
   `curl`ing `course-content` with that user's token should return **403**.
9. Also worth testing the unhappy paths:
   - **Close the modal** without paying → "Payment cancelled — nothing was
     charged", button re-enables. Nothing should change in `profiles`.
   - **Failed card** (Razorpay's failure test card) → the error description shows
     and no premium is granted.
6. If it does **not** unlock, check in this order:
   - Dashboard → **Edge Functions → razorpay-checkout → Logs**. A `401` means the
     browser's token didn't resolve; `500` with a Razorpay error usually means
     the Key ID/Secret pair is wrong or not set (re-run D1); `503` "Monthly plan
     is not configured" means `RAZORPAY_PLAN_ID_MONTHLY` is missing; a Razorpay
     error mentioning the plan means the ID belongs to the *other* mode (test
     plan with live keys, or vice versa).
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
      webhook (repeat C2/C3 with `rzp_live_...`), and **create the ₹299 plan again
      in Live Mode** (C4) — test plans do not exist in live. Update
      `RAZORPAY_KEY_ID` in `js/supabase-config.js`, then re-run
      `supabase secrets set` for `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`,
      `RAZORPAY_PLAN_ID_MONTHLY` and `RAZORPAY_WEBHOOK_SECRET`, and re-deploy both
      functions.
- [ ] Confirm the live webhook has **`subscription.charged`** ticked. Renewals
      silently stop working without it.
- [ ] **Authentication → Email**: turn **"Confirm email" back ON** for production
      (see `SUPABASE_SETUP.md` step 4).
- [ ] **Custom SMTP configured** (PART A4). Blocking — without it signups fail
      with 429 after 2 accounts per hour.
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
