# Backlog

## Done
- [x] PHASE 0 — Scaffold Next.js app (later upgraded to Next 15 + React 19)
- [x] PHASE 1 — supabase/schema.sql, database.ts, api.ts
- [x] PHASE 2 — Supabase server/client/admin, middleware, login, signup→redirect, auth callback
- [x] PHASE 3 — Grok routes (research, options, select, panels)
- [x] PHASE 4 — fal.ai routes (generate, generate-all SSE, edit, upload-reference, proxy)
- [x] PHASE 5 — UI primitives, Nav, dashboard, library, new wizard (4 steps), storyboard, edit, reader
- [x] PHASE 6 — loading/error/not-found, UserContext, real Supabase queries, SSE wiring, no `any`
- [x] PHASE 7 — Initial deploy
- [x] Disable signups (login-only)
- [x] Migrate hosting from Vercel target → Cloudflare Workers (OpenNext adapter)
- [x] Bump Next 14 → 15, React 18 → 19, async cookies() and params
- [x] Lazy-init Supabase admin client and Grok client to survive build without env
- [x] Hardcode public NEXT_PUBLIC_* fallbacks in next.config.js
- [x] Fix handle_new_user trigger to swallow exceptions (don't block login)
- [x] Server-side `/api/comic/create` route (bypasses client RLS during wizard)

## Manual setup still required (user)
- [x] Create Supabase project, run schema.sql
- [x] Create storage buckets `comic-panels` + `reference-images` (private)
- [x] Get xAI + fal keys
- [x] Add Cloudflare env vars (Plaintext for NEXT_PUBLIC_*, Secret for the rest)
- [x] Add Supabase auth redirect URL pointing to Cloudflare worker
- [x] Create admin user via Supabase Dashboard (timzines@gmail.com)
- [ ] **End-to-end smoke test on production** — refresh login, sign in, run new comic wizard, verify panel generation
- [ ] Disable signups in Supabase Dashboard → Authentication → Providers → Email (so API path is also blocked, not just UI)

## Future / nice to have
- [ ] Real Export ZIP endpoint (currently stub)
- [ ] Persisted edit history (new table `panel_edits`)
- [ ] Mobile hamburger menu (basic only at the moment)
- [ ] Reference image delete button in wizard
- [ ] Skeleton state per panel during generation
- [ ] Rate-limit handling / retry backoff for fal batch generation
- [ ] Replace `@ts-expect-error` casts on Grok `search_parameters` and fal Kontext input once typings catch up
- [ ] Consider migrating back to Vercel if Cloudflare keeps creating friction (this app was designed for Vercel and the platform fights back)
