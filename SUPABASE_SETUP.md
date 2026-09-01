# HackDynamics — Supabase auth & paywall setup

Email/password sign-in with a server-enforced **premium** flag. No SDK, no build
step — the site talks to Supabase's REST API directly with `fetch`.

> **What this protects.**
> Sign-in checks a real, server-side `is_premium` flag users cannot set
> themselves, **and** the course content is now served by the `course-content`
> Edge Function to premium users only — the chapter text moved out of the public
> site into `supabase/functions/course-content/_data/`, so it can no longer be
> fetched directly. See `supabase/functions/course-content/` and the DEPLOY
> SAFETY section of `MANUAL_ACTIONS.md` (the content stays protected only if your
> host does not serve the `supabase/` folder).

---

## 1. Create the project

1. Sign up at <https://supabase.com> and create a project.
2. **Project Settings → API**. Copy two values:
   - **Project URL** (e.g. `https://abcdxyz.supabase.co`)
   - **anon / public** key (the long JWT). This one is safe in the browser — it's
     designed for client use and is protected by Row Level Security below.

## 2. Paste your keys

Open `js/supabase-config.js` and replace the two placeholders:

```js
SUPABASE_URL: "https://abcdxyz.supabase.co",
SUPABASE_ANON_KEY: "eyJhbGciOi...your-anon-key...",
```

## 3. Create the profiles table + policies

**SQL Editor → New query**, paste this, and run it:

```sql
-- One profile row per user, holding the premium flag.
create table public.profiles (
  id         uuid primary key references auth.users (id) on delete cascade,
  email      text,
  is_premium boolean not null default false,
  created_at timestamptz not null default now()
);

-- Row Level Security: a user may READ only their own row, and may NOT write it
-- (so no one can grant themselves premium from the browser).
alter table public.profiles enable row level security;

create policy "read own profile"
  on public.profiles for select
  using (auth.uid() = id);

-- Auto-create a profile whenever someone signs up.
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, email) values (new.id, new.email);
  return new;
end; $$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
```

## 4. Auth settings (for smooth local testing)

**Authentication → Providers → Email** is on by default. During development you
may want **Authentication → Sign In / Providers → "Confirm email" = OFF** so a new
account can log in immediately. Turn it back on before launch — the login page
already handles the "check your email to confirm" case when it's on.

**Authentication → URL Configuration** decides where confirmation and reset
links land. Out of the box **Site URL** is `http://localhost:3000`, which is why
a confirmation email dumps you on a dead localhost page. Set:

- **Site URL**: `https://hackdynamics.com`
- **Redirect URLs**: `https://hackdynamics.com/*` and `http://localhost:8643/*`
  for local testing.

The login page now passes its own URL as `redirect_to` on signup, so links come
back to whichever origin you signed up from — but only if that origin is in the
Redirect URLs list. Anything not on the list silently falls back to Site URL.

## 5. Grant yourself premium (until Razorpay is wired)

Payments aren't connected yet, so premium is granted by hand. After you've signed
up once, run this in the SQL Editor:

```sql
update public.profiles set is_premium = true
where email = 'you@example.com';
```

Reload the course page and the content unlocks.

---

## How it behaves

| Visitor state                    | Course page (`databases-in-depth.html`)     |
| -------------------------------- | ------------------------------------------- |
| Not signed in                    | Redirected to `login.html`                  |
| Signed in, `is_premium = false`  | "Upgrade" wall (checkout coming soon)       |
| Signed in, `is_premium = true`   | Full course + a "Log out" chip in the top bar |
| Keys not filled in yet           | A friendly "not configured" notice          |

## Files involved

- `js/supabase-config.js` — your URL + anon key (the only file you edit).
- `js/auth.js` — the fetch-based Supabase auth client (`window.HDAuth`).
- `js/gate.js` — the course paywall logic.
- `login.html` — the sign-up / log-in page.
- `index.html`, `databases-in-depth.html` — wired to the above.

## When you add Razorpay (later)

1. Add a Razorpay checkout button on the upgrade wall in `js/gate.js`.
2. Handle the payment **webhook** in a Supabase Edge Function and set
   `is_premium = true` there (server-side — never trust the browser for this).
   *(Already scaffolded: `supabase/functions/razorpay-webhook/`.)*
3. Real content protection is **done**: `bookData-*.js` now lives behind the
   `course-content` Edge Function, which returns chapter data only when the
   caller's JWT maps to a premium profile.
