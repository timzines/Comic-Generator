# Restart Notes

## Status
Deployed to Cloudflare Workers at `https://comicgenerator.timzines.workers.dev`. Login-only auth. Code complete for all features.

## Stack snapshot
- Next.js 15.5 + React 19
- @opennextjs/cloudflare (NOT @cloudflare/next-on-pages, NOT Vercel)
- wrangler.jsonc + open-next.config.ts at project root
- Supabase project ref: `ueqjubtrnxyudszdlzxj`
- Worker name: `comicgenerator`

## Last completed
- Migrated from Vercel target to Cloudflare Workers via @opennextjs/cloudflare.
- Bumped Next 14 → 15, React 18 → 19. Made `cookies()` and dynamic `params` async-compatible.
- Hardcoded `NEXT_PUBLIC_SUPABASE_URL` / `_ANON_KEY` / `_APP_URL` fallbacks in `next.config.js` because Cloudflare's build env handling for `NEXT_PUBLIC_*` was unreliable when set as Secrets.
- Disabled signups in middleware (`/signup` → `/login`).
- Login-only flow active. Admin user `timzines@gmail.com` created via Supabase dashboard.
- Character Prompt Generator at `/character-prompt` — Grok vision → CharacterSheet. Output locked to waist-up / pure-white-bg / natural-standing-pose reference card for consistent generations.
- Character library: save/load/delete with thumbnails in `localStorage` (`characterLibrary` key), helpers in `src/lib/character/library.ts`.
- Scene Composer at `/compose`: pick 1–4 library characters, structured setting/camera/lighting form, deterministic `assembleScenePrompt()` (no LLM), 6 scene presets, saved-scene persistence (`sceneLibrary` key).
- **Phase 1 (mass-production track): Seedream 4.5 migration** — replaced `fal-ai/flux/dev` + `fal-ai/flux-pro/kontext` with `fal-ai/bytedance/seedream/v4.5/text-to-image` + `/v4.5/edit`. `generate-panel.ts` routes refs through edit endpoint via `image_urls`. Edit route rewritten for Seedream shape; mask inpainting dropped; `EditCanvas.tsx` deleted; `EditImageRequest.maskImage` removed.
- **Phase 2: Viral story engine** — `src/lib/story/archetypes.ts` with 4 yonkoma archetypes (dark-surreal, oh-no, technical-reframe, wholesome-twist). `/api/story/options` + `/api/story/panels` accept optional `archetype` param → switch to 4-panel kishōtenketsu prompt. New `/api/story/score` endpoint self-rates options 0–10. `src/lib/schemas/story.ts` loosened to support both yonkoma (1×4) and long-form. Wizard StepDescribe has an archetype picker.
- **Phase 3: Reddit trend harvester** — `supabase/migration_003_reddit_trends.sql` adds `tracked_subreddits` + `reddit_posts` + `reddit_rankings` (seeded with `manga`, `MangaArt`). `src/lib/reddit/client.ts` handles OAuth app-only token. `src/lib/reddit/scrape.ts` fetches `rising` + `top?t=day` + `top?t=week` per sub. Routes: `/api/trends/subreddits` (GET/POST/DELETE), `/api/trends/posts`, `/api/trends/refresh` (user-auth), `/api/cron/reddit-scrape` (secret-auth). `/trends` admin UI with chips, window tabs, post grid, and "Seed comic" button that routes to `/new?title=...&description=...`. Nav gained "Trends" link.
- **Phase 4: Autopilot + factory** — `supabase/migration_004_autopilot.sql` adds `comics.archetype` column + extends `comic_status` enum with `pending_review`. New `src/lib/story/orchestrator.ts` is the single source of truth for all Grok story prompts; the 5 existing `/api/story/*` routes became thin wrappers. `/api/comic/autopilot` (SSE) chains create → research → 3 options → score each in parallel → pick highest → select → panels → Seedream images → `pending_review`. `/api/comic/approve` + `/reject` + `/pending-review`. `/factory` UI with batch launcher (1–5), live SSE log, review queue cards. Nav link added.
- All four phases: `tsc --noEmit` clean, `next build` clean (36 routes).

## Where I stopped
All four phases coded and building locally. **Not yet deployed.** Migrations 003 + 004 not yet run against Supabase. Reddit OAuth creds + CRON_SECRET not yet set on Cloudflare.

## Next step — REQUIRED manual setup before production works
1. Run `supabase/migration_003_reddit_trends.sql` in Supabase SQL editor. ✓
2. Run `supabase/migration_004_autopilot.sql` in Supabase SQL editor. ✓
3. Add Cloudflare env vars (Workers & Pages → `comicgenerator` → Settings → Variables):
   - `REDDIT_USER_AGENT` (Plaintext) — e.g. `comic-studio/0.1 (by u/timzines)`
   - `CRON_SECRET` (Secret) — any long random string
4. Configure an external cron service (cron-job.org free tier) to POST `https://comicgenerator.timzines.workers.dev/api/cron/reddit-scrape` every 6h with header `X-Cron-Secret: <CRON_SECRET>`.
5. Deploy: `npx opennextjs-cloudflare build && npx wrangler deploy`.
6. Verify end-to-end:
   - `/trends` → add a sub, Refresh, confirm posts load. If Cloudflare egress gets rate-limited by Reddit, fall back to a paid scraper (Apify/ScrapFly free tier).
   - `/factory` → launch 1 `oh-no` yonkoma, watch SSE log, confirm it lands in review queue
   - Approve → confirm it shows in `/library`

Note: Reddit OAuth app creation now requires application review (gated behind Responsible Builder Policy). We skipped it — the code uses public `.json` endpoints which don't require keys. Only `REDDIT_USER_AGENT` and `CRON_SECRET` env vars are needed.

## Known follow-ups (not blockers)
- Benchmark Seedream v5 Lite ($0.035) as a draft tier vs v4.5
- Try `v4/edit-sequential` for one-call multi-panel generation (could replace the sequential loop inside autopilot)
- Real Export ZIP endpoint (currently stub)
- Persisted edit history (`panel_edits` table)
- Scene Composer v2 (video/motion)

## Known traps (do not relearn the hard way)
- `NEXT_PUBLIC_*` Cloudflare vars must be **Plaintext**, not Secret. Otherwise the client bundle has `undefined`.
- Server-only secrets (`SUPABASE_SERVICE_ROLE_KEY`, `XAI_API_KEY`, `FAL_KEY`) live as runtime Secrets — they don't need to be build vars.
- Don't add `export const runtime = 'edge'` anywhere — OpenNext uses Node runtime via `nodejs_compat`.
- Never insert into `auth.users` via SQL — use Supabase Dashboard "Add user" or login breaks.
- Grok Live Search uses `search_parameters: { mode: 'auto' }`, NOT OpenAI's `tools: [{type:'web_search'}]`.
- The `handle_new_user` trigger must wrap its body in `EXCEPTION WHEN OTHERS THEN RETURN NEW` so a profile insert failure can never block login.
