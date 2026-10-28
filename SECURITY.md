# Security policy

## Reporting a vulnerability

Please don't open a public issue for security problems.

Report them privately through GitHub:
[**Security → Report a vulnerability**](https://github.com/skystrix/hackdynamics/security/advisories/new).

Include what you found, how to reproduce it, and what an attacker could do with it.
You'll get a reply within a week. Once a fix is live, we'll credit you in the advisory
unless you'd rather stay anonymous.

## Scope

- The site at [hackdynamics.com](https://hackdynamics.com) and the code in this repo
- The Supabase edge functions in `supabase/functions/`
- Sign-in, account and payment flows

Out of scope: the Supabase anon key and Razorpay key ID in `js/supabase-config.js`
(both are public by design), missing security headers with no working exploit, and
denial-of-service or spam.
