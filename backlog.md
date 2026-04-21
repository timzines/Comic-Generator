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
- [x] Character Prompt Generator (v1) — upload image → Grok vision → structured CharacterSheet + master_prompt
- [x] Character Prompt Generator — lock output to waist-up / white bg / natural pose reference card
- [x] Character library (localStorage) — save / load / delete saved character sheets with thumbnails
- [x] Scene Composer (v1) at `/compose` — pick 1–4 library characters, structured scene form, deterministic assembler, scene presets, saved-scene persistence
- [x] **Phase 1 — Seedream 4.5 migration** (fal.ts, generate-panel.ts, edit route, EditStudioClient). Dropped Flux, dropped mask support, deleted EditCanvas. tsc + next build pass.

## Manual setup still required (user)
- [x] Create Supabase project, run schema.sql
- [x] Create storage buckets `comic-panels` + `reference-images` (private)
- [x] Get xAI + fal keys
- [x] Add Cloudflare env vars (Plaintext for NEXT_PUBLIC_*, Secret for the rest)
- [x] Add Supabase auth redirect URL pointing to Cloudflare worker
- [x] Create admin user via Supabase Dashboard (timzines@gmail.com)
- [ ] **End-to-end smoke test on production** — refresh login, sign in, run new comic wizard, verify panel generation
- [ ] Disable signups in Supabase Dashboard → Authentication → Providers → Email (so API path is also blocked, not just UI)

## Mass-production track (comic factory)
- [x] Phase 1 — Seedream 4.5 migration
- [x] **Phase 2 — Viral story engine**: 4 yonkoma archetypes (`src/lib/story/archetypes.ts`), archetype-aware `/options` + `/panels`, new `/score` endpoint, loosened OptionsSchema, wizard archetype picker.
- [x] **Phase 3 — Reddit trend harvester**: migration 003, OAuth client, scrape lib, trends API routes, `/trends` admin UI, Nav link. **Manual setup pending (see restart.md):** run migration, create Reddit app, set 4 env vars on Cloudflare, configure external cron to hit `/api/cron/reddit-scrape` every 6h.
- [x] **Phase 4 — Autopilot + factory UI**: migration 004, orchestrator extracted as single source of truth, autopilot SSE endpoint chains research→options→score→pick→select→panels→images, `/factory` UI with launcher + live log + review queue (approve/reject), Nav link.

## Future / nice to have
- [ ] Try Seedream v4 sequence mode (`/v4/edit-sequential`) for one-call multi-panel generation — replaces the SSE loop for full-strip consistency
- [ ] Benchmark v5 Lite ($0.035) as a draft tier before committing final to v4.5 ($0.04)
- [ ] Scene Composer v2: video/motion mode (Grok's 7-part video stack), scene series/storyboards, optional LLM scene enhancement, reference-image attachment
- [ ] Migrate character/scene library from localStorage to Supabase once multi-device usage is needed
- [ ] Real Export ZIP endpoint (currently stub)
- [ ] Persisted edit history (new table `panel_edits`)
- [ ] Mobile hamburger menu (basic only at the moment)
- [ ] Reference image delete button in wizard
- [ ] Skeleton state per panel during generation
- [ ] Rate-limit handling / retry backoff for fal batch generation
- [ ] Replace `@ts-expect-error` casts on Grok `search_parameters` and fal Seedream input once typings catch up
- [ ] Consider migrating back to Vercel if Cloudflare keeps creating friction (this app was designed for Vercel and the platform fights back)
