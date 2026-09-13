# Bluo

Bluo is a low-data, social-first connections app for colleges. V1 launches at Peter Symonds College and is designed around the question: **who is free, nearby, and ready to connect?**

## V1 principles

- Friends get precise location; non-friends get approximate location.
- Location sharing defaults to college hours (PSC: 09:00–16:40) and can be customised.
- Adaptive networking automatically moves between Full and Low data; Ultra Low can be enabled in Settings.
- Cached-first UI remains useful during weak/no connectivity.
- Timetable availability, friends, groups, chat, privacy controls and custom 2D Bluo avatars are first-class.
- PSC membership is intended to be verified with `@students.psc.ac.uk`.

## Stack

- Next.js App Router + TypeScript
- PWA service worker + browser persistence foundation
- Supabase Auth/Postgres/Realtime for production data
- Vercel for the web app
- No server-local state is required for core UX

## Run locally

```bash
npm install
cp .env.example .env.local
npm run dev
```

The app intentionally runs in local/demo mode when Supabase variables are absent so the UX can be tested immediately.

## Production configuration

Create a Supabase project and run `supabase/schema.sql`. Set the public Supabase URL/key in Vercel. Pushes to `main` can then be connected to Vercel for automatic deployments.

## Data architecture

The client treats local cached state as the primary read model. The server is the source of truth for identity, relationships and privacy rules. Location writes are tiny and rate-limited. Realtime is reserved for useful events rather than high-frequency location streaming.

## Safety

Exact coordinates are never directly readable from the `locations` table. Clients use the `get_visible_locations()` RPC, which applies friendship, block, visibility and school-hours rules before returning exact or coarsened coordinates.