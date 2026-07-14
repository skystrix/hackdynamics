# razorpay-webhook

Grants premium after a Razorpay payment, verified server-side. This is the
**only** thing that sets `is_premium = true` — the browser is never trusted.

## Deploy

```bash
supabase login
supabase link --project-ref gfmeewpztjxhuemrymzi   # your project ref

# Secret: Razorpay Dashboard → Settings → Webhooks → (your webhook's secret)
supabase secrets set RAZORPAY_WEBHOOK_SECRET=whsec_xxx
# SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are injected automatically.

supabase functions deploy razorpay-webhook
```

Function URL:
`https://gfmeewpztjxhuemrymzi.supabase.co/functions/v1/razorpay-webhook`

## Register the webhook in Razorpay

Dashboard → Settings → Webhooks → **Add New Webhook**
- **URL**: the function URL above
- **Secret**: the same value you set as `RAZORPAY_WEBHOOK_SECRET`
- **Active events**: `payment.captured` (and optionally `order.paid`)

## Wire the user into checkout (frontend — the missing half)

The webhook needs to know *which* user paid. When you open Razorpay Checkout
from the upgrade wall in `js/gate.js`, stamp the Supabase user id into `notes`:

```js
const status = await HDAuth.status();
const rzp = new Razorpay({
  key: "rzp_live_xxx",              // Razorpay key_id (public, safe in browser)
  amount: 49900,                    // paise; better: create an order server-side
  currency: "INR",
  name: "HackDynamics — Databases in Depth",
  notes: {
    user_id: status.session.user.id,        // ← webhook reads this
    email: status.profile?.email || "",     // fallback match
  },
  handler() { location.reload(); },          // webhook flips the flag; reload re-gates
});
rzp.open();
```

The webhook matches `notes.user_id` against `profiles.id` (falls back to email),
so a tampered browser can't grant premium to anyone — a real verified payment is
required, and the id/email are just a lookup, not the authorization.

> Harden later: create the Razorpay **order** in a second Edge Function so the
> amount can't be edited client-side. Not required to take payments today.

## Test locally

```bash
cd supabase/functions/razorpay-webhook
deno test          # signature verification self-check
```

Or hit the live function with a signed payload (bad signature → 400, good → 200).
