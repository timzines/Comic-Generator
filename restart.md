# Restart Notes

## Status
All 7 phases complete. App scaffolded, builds cleanly (`next build`), `tsc --noEmit` clean. Pushed to github.com/timzines/Comic-Generator.

## Last completed
- Phase 0–7: scaffolding through build prep + typecheck + successful production build.
- Fal client uses `@fal-ai/server-proxy/nextjs` (client package no longer bundles nextjs route).
- `supabaseAdmin` is lazy-proxied so build doesn't crash without real env vars.

## Where I stopped
Code complete. User still needs to do the manual cloud setup before the app can function.

## Next step (user, manual)
1. Create Supabase project → copy URL + anon + service-role keys into `.env.local`.
2. Run `supabase/schema.sql` in the Supabase SQL editor.
3. Create private storage buckets `comic-panels` and `reference-images` + storage RLS.
4. Create fal.ai + xAI (Grok) accounts, copy keys into `.env.local`.
5. Push repo to Vercel, add all env vars, add redirect URLs in Supabase auth settings.
6. Smoke test: signup → new comic wizard → generate panels → edit.

## Known deferrals
- Export ZIP is stubbed (`/api/export` returns "coming soon").
- Edit version history is in-memory only (no persisted edit log table).
- `fal.subscribe` input types loosely cast via `as never` in edit route because Flux Kontext typings vary by version.
