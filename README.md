# Bluo

Bluo is a low-data social connections app for colleges. V1 launches at Peter Symonds College and is designed around one question: **who is free, nearby, and ready to connect?**

Canonical domain: **bluo.app**.

## V1 principles

- Friends can receive precise location; non-friends receive only approximate location when the user allows it.
- Location sharing defaults to college hours (PSC: 09:00–16:40) and can be hidden.
- Lock In / DND suppresses location visibility and quiets notifications.
- Adaptive networking moves between Full and Low data; Ultra Low can be enabled in Settings.
- Timetable availability, friends, groups, chat, privacy controls and custom 2D Bluo avatars are first-class.
- PSC access is restricted server-side to `@students.psc.ac.uk` accounts plus the private launch code.
- The launch code is an access gate, not proof of student identity.

## Stack

- Next.js 16 App Router + TypeScript
- PWA service worker
- Supabase Auth/Postgres for production data
- Vercel for the web app
- No server-local state is required for core UX

## Production database setup

Run these in order in the Supabase SQL Editor:

1. `supabase/schema.sql`
2. `supabase/migrations/002_security_hardening.sql`
3. `supabase/migrations/003_launch_hardening.sql`
4. `supabase/migrations/004_graduation_year_and_launch_access.sql`
5. `supabase/migrations/005_production_policy_hardening.sql`
6. `supabase/migrations/008_fix_launch_code_digest_schema.sql`
7. `supabase/migrations/009_grant_launch_code_service_role.sql`
8. `supabase/migrations/010_enforce_launch_code_in_trigger.sql`

Then create the private launch-code hash using `extensions.digest(...)`. Never commit the plaintext launch code.

The database deliberately keeps raw coordinates behind RPCs. Do not create a public SELECT policy on `locations`.

## Vercel environment

Set these variables for Preview and Production:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` (preferred)
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` (legacy fallback)
- `SUPABASE_SERVICE_ROLE_KEY` — required server-side for signup and username login; the app returns "Authentication is not configured." on those routes without it
- `NEXT_PUBLIC_VAPID_PUBLIC_KEY` when web push is enabled
- `VAPID_PRIVATE_KEY` and `VAPID_SUBJECT` only on trusted server-side code

Never put a Supabase service-role/secret key in a `NEXT_PUBLIC_*` variable or browser bundle.

## Auth and launch

Bluo uses email + password authentication for the initial PSC rollout. Signup requires:

- a `@students.psc.ac.uk` address
- real name
- expected graduation year
- the private PSC launch code
- a password of at least 8 characters

Configure the production SMTP provider and Auth redirect URLs in Supabase before onboarding users. Supabase recommends custom SMTP for production email delivery. CAPTCHA should be enabled before opening the launch code beyond a small trusted cohort.

## Run locally

```bash
npm install
cp .env.example .env.local
npm run dev
```

The production application does **not** fall back to demo users or fake location data when Supabase is unavailable.

## Live functionality

- Supabase email/password authentication
- Server-side PSC email-domain enforcement
- Graduation-year profiles
- Follows and mutual-friend relationships
- Privacy-aware location writes and reads
- School-hours location visibility
- Block-aware location visibility
- Lock In / DND location suppression
- Timetable persistence and availability calculation
- Direct messages
- PSC groups and group creation
- Custom Bluo avatars
- Adaptive Full / Low / optional Ultra Low data mode
- PWA service worker

## Safety and privacy

Exact coordinates are never directly readable from the `locations` table. Clients use `get_visible_locations()`, which applies friendship, block, visibility, DND and school-hours rules before returning exact or coarsened coordinates.

Because Bluo is intended for students, keep exact-location access strictly limited to the mutual-friend relationship and never expose raw coordinates through a public API, page, analytics event or client-side seed.
