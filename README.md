# Bluo

Bluo is a low-data, social-first connections app for colleges. V1 launches at Peter Symonds College and is designed around the question: **who is free, nearby, and ready to connect?**

Canonical domain: **Bluo.app**.

## V1 principles

- Friends get precise location; non-friends get approximate location.
- Location sharing defaults to college hours (PSC: 09:00–16:40) and can be customised.
- Adaptive networking automatically moves between Full and Low data; Ultra Low can be enabled in Settings.
- Cached-first UI remains useful during weak/no connectivity.
- Timetable availability, friends, groups, chat, privacy controls and custom 2D Bluo avatars are first-class.
- PSC membership is verified server-side with `@students.psc.ac.uk`.

## Stack

- Next.js App Router + TypeScript
- PWA service worker + browser persistence foundation
- Supabase Auth/Postgres for production data
- Vercel for the web app
- No server-local state is required for core UX

## Make the database live

1. Create a Supabase project.
2. Open the Supabase SQL Editor.
3. Run **all** of `supabase/schema.sql`.
4. Run `supabase/migrations/002_security_hardening.sql`.
5. In Supabase Auth, enable Email provider + email confirmation.
6. Add these Auth redirect URLs:
   - `https://bluo.app/auth/callback`
   - your current Vercel preview `/auth/callback` while testing
7. Configure production SMTP before inviting the whole college. The default Supabase SMTP service is intended for testing and is heavily limited.

The database deliberately keeps raw coordinates behind RPCs. Do not create a public SELECT policy on `locations`.

## Vercel environment

Add these variables to the Vercel project for Preview and Production:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

The Supabase publishable/anon key is intended for browser use; database security comes from RLS. **Never put a Supabase service-role/secret key in `NEXT_PUBLIC_*` variables or the browser.**

After changing Vercel environment variables, redeploy the project.

## Domain

Use `bluo.app` as the canonical production domain. The other owned Bluo domains can redirect to it later.

## Run locally

```bash
npm install
cp .env.example .env.local
npm run dev
```

The app intentionally runs in local/demo mode when Supabase variables are absent so the UX can still be tested.

## Live functionality already wired

- Supabase magic-link authentication
- Server-side PSC email-domain enforcement through the Auth trigger
- Profile persistence
- Follows / mutual-friend relationships
- Privacy-aware location writes and reads
- School-hours location visibility
- Block-aware location visibility
- Timetable persistence and current availability calculation
- Direct messages with low-frequency polling
- PSC groups and group creation
- Custom Bluo avatars
- Adaptive Full / Low / optional Ultra Low data mode
- PWA service worker

## Safety

Exact coordinates are never directly readable from the `locations` table. Clients use `get_visible_locations()`, which applies friendship, block, visibility and school-hours rules before returning exact or coarsened coordinates.

Before public launch, test with multiple fake accounts and verify: blocked users cannot see each other, non-mutual users only receive approximate coordinates, hidden users return no location, and a signed-out user cannot access any app data.
