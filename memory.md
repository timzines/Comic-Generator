# Key Facts & Decisions

## Models
- **Grok**: `grok-3` via OpenAI SDK, baseURL `https://api.x.ai/v1`. For Live Search use `search_parameters: { mode: 'auto' }` as a top-level field (cast `// @ts-expect-error`). Do NOT use `tools: [{type:'web_search'}]` — that's the OpenAI shape, xAI rejects it.
- **fal generate (Seedream 4.5)**: `fal-ai/bytedance/seedream/v4.5/text-to-image`. Params: `image_size`, `num_images`, `enable_safety_checker`, `enhance_prompt_mode`. No `num_inference_steps`/`guidance_scale`. T2I does NOT accept reference images.
- **fal generate with refs**: when reference images exist, `generate-panel.ts` routes to the edit endpoint (`fal-ai/bytedance/seedream/v4.5/edit`) with `image_urls: string[]` (up to 4 refs).
- **fal edit (Seedream 4.5)**: `fal-ai/bytedance/seedream/v4.5/edit`. Takes `image_urls` array (NOT singular `image_url`). Mask/inpainting NOT supported — Seedream edit is fully prompt-driven.

## Database (Supabase)
- Tables: `profiles`, `comics`, `story_options`, `panels`, `reference_images`, `tracked_subreddits`, `reddit_posts`, `reddit_rankings`
- Enums: `comic_status` (drafting|generating|pending_review|done|error), `panel_status` (pending|generating|done|error)
- `comics.archetype` column holds the yonkoma archetype key (nullable)
- `comics` holds `character_bible`, `style`, `custom_style`, `panel_count`, `status`
- `story_options`: 3 per comic, one gets `selected=true`; `act_breakdown` is jsonb array of {act, desc}
- `panels`: `panel_index`, `prompt`, `image_url`, `storage_path`, `status`
- RLS on all tables. story_options/panels/reference_images policies join through comics.user_id.
- Trigger `handle_new_user` on auth.users INSERT auto-creates a profiles row. Wrap body in EXCEPTION WHEN OTHERS to never block auth (otherwise login fails with "Database error querying schema").
- Triggers: updated_at on comics + panels.
- Storage buckets (private): `comic-panels`, `reference-images`

## Story orchestrator (single source of truth for Grok prompts)
`src/lib/story/orchestrator.ts` exports: `researchForDescription`, `generateStoryOptions`, `scoreStoryOption`, `selectStoryOption`, `generatePanelPrompts`, `pickBestOption`. Every `/api/story/*` route is now a thin wrapper. Autopilot uses the same helpers. **If you change a Grok prompt, change it here.** The routes have no prompt logic.

## API routes
- `/api/auth/callback` (GET) — exchangeCodeForSession
- `/api/comic/create` (POST) — server-side comic insert (used by wizard to bypass client RLS issues)
- `/api/story/research` — Grok + Live Search → {inspirations[5], themes[3]}
- `/api/story/options` — Grok → 3 story options, insert to DB. Optional `archetype` param switches to yonkoma 4-panel mode.
- `/api/story/select` — Grok → character_bible, mark option selected, status=generating
- `/api/story/panels` — Grok → N panel prompts, bulk insert. Optional `archetype` param enforces archetype tone rules.
- `/api/story/score` — Grok self-rates an option 0–10 with rationale; used for autopilot auto-pick.
- `/api/image/generate` — single panel via Seedream (T2I, or edit if refs present)
- `/api/image/generate-all` (GET, SSE) — sequential batch
- `/api/image/edit` — Seedream edit with optional reference image (no mask support)
- `/api/image/upload-reference` (FormData) — store + insert row
- `/api/fal/proxy` (GET/POST/PUT) — `@fal-ai/server-proxy/nextjs` route export
- `/api/export` (GET) — stub, returns "coming soon"
- `/api/trends/subreddits` (GET/POST/DELETE) — manage tracked subs list
- `/api/trends/posts` (GET) — latest-batch rankings + joined posts for a sub+window
- `/api/trends/refresh` (POST) — manual scrape, user-auth
- `/api/cron/reddit-scrape` (GET/POST) — cron-triggered scrape, `X-Cron-Secret` header auth
- `/api/comic/autopilot` (POST, SSE) — full chain: create → research → options → score → pick → select → panels → images → pending_review. Emits typed `AutopilotEvent`.
- `/api/comic/pending-review` (GET) — list comics awaiting approval with their panels
- `/api/comic/approve` (POST) — status → `done`
- `/api/comic/reject` (POST) — DELETE comic (cascades panels)

## Page routes
- (auth): /login. /signup redirects to /login (disabled).
- (dashboard): /dashboard, /library, /factory, /new, /trends, /comic/[id]/storyboard, /comic/[id]/read, /comic/[id]/edit/[panelId], /character-prompt, /compose

## Story engine (viral mode)
- Archetypes: `src/lib/story/archetypes.ts` defines 4 yonkoma templates with `structurePrompt` + `twistRule`. Passed through from wizard `StepDescribe` picker as `archetype` in request bodies.
- When `archetype` is set: 4-panel single-page kishōtenketsu, reused named characters, dialog capped ~40 words, twist rule enforced.
- When `archetype` is absent: original long-form (3-8 pages) behavior.
- `OptionsSchema` validates both modes — `panelCount` min 1, `estimatedPages` min 1, `actBreakdown` 1-4 items.

## Reddit harvester
- Tables in `supabase/migration_003_reddit_trends.sql`: `tracked_subreddits` (user-managed), `reddit_posts` (upsert by id), `reddit_rankings` (composite pk on post_id+window+scraped_at, append-only for trend history).
- `src/lib/reddit/client.ts`: unauth fetch to `www.reddit.com/.../.json` with descriptive User-Agent. OAuth was tried but Reddit's dev app creation now requires application review — for ~12 req/day volume, public endpoints suffice.
- `src/lib/reddit/scrape.ts`: fetches rising + top/day + top/week per active sub, skips stickied/mod/crosspost/removed, computes `velocity = score / age_hours^1.5 * upvote_ratio`.
- Cron: external service (cron-job.org etc) hits `/api/cron/reddit-scrape` with `X-Cron-Secret` header every 6h. Cloudflare Cron Triggers don't cleanly integrate with OpenNext's Next.js runtime.
- UI `/trends`: sub chips + Rising/Today/Week tabs + post grid + "Seed comic →" button that routes to `/new?title=...&description=...`.

## Character + Scene prompt system (standalone tools, no Supabase)
- `/character-prompt`: upload image → Grok vision (`grok-4.20-reasoning`, `XAI_MODEL` override) → `CharacterSheet` (Zod). Assembler rebuilds `master_prompt` locally to lock output to waist-up / pure white bg (#FFFFFF) / relaxed natural standing pose. `default_pose_expression` is NOT included in master_prompt (causes reference-image reproduction).
- Character library: localStorage key `characterLibrary`, entries are `{id, savedAt, name, thumbnail (dataURL), sheet}`. Helpers in `src/lib/character/library.ts`.
- `/compose`: picks 1–4 saved characters, builds `SceneInput`, deterministic `assembleScenePrompt` (no LLM call). Multi-character uses the condenser with word budgets (1: full, 2: 40w, 3: 25w, 4: 15w) + spatial anchoring ("On the left, ..."). Scene library at localStorage key `sceneLibrary`.
- Scene presets: 6 presets in `src/lib/scene/presets.ts` prefill camera/lighting/mood fields.

## Env vars (Cloudflare quirks)
| Variable | Build var? | Runtime var? | Type on CF |
|---|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | yes | yes | Plaintext |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | yes | yes | Plaintext |
| `NEXT_PUBLIC_APP_URL` | yes | yes | Plaintext |
| `SUPABASE_SERVICE_ROLE_KEY` | no | yes | Secret |
| `XAI_API_KEY` | no | yes | Secret |
| `FAL_KEY` | no | yes | Secret |
| `REDDIT_USER_AGENT` | no | yes | Plaintext |
| `CRON_SECRET` | no | yes | Secret |

**Critical:** Cloudflare Workers distinguishes Secret (runtime-only) vs Plaintext (build + runtime). `NEXT_PUBLIC_*` MUST be Plaintext or they get baked into the client bundle as `undefined`. Vercel does not have this distinction.

`next.config.js` has hardcoded fallbacks for `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `NEXT_PUBLIC_APP_URL` — these are public values (anon key is meant to be in client code) and act as a safety net if the build env vars are misconfigured.

## Cloudflare-specific code patterns
- `await createClient()` for server Supabase (Next 15 makes `cookies()` async)
- `params: Promise<{...}>` then `await params` in dynamic page components (Next 15)
- Use `Uint8Array(await arrayBuffer())` instead of `Buffer.from(...)` where possible (works in both Node and edge)
- Seedream edit input takes `image_urls: string[]`, not `image_url: string`. Cast input `as never` because fal SDK types don't cover Seedream shape yet.
- Use global `crypto.randomUUID()` instead of `import { randomUUID } from 'crypto'`
- `supabaseAdmin` is a lazy Proxy in `src/lib/supabase/admin.ts` — defer construction so `next build` doesn't crash without env
- `grok` client in `src/lib/grok.ts` is also a lazy Proxy for the same reason
- Client components (`'use client'`) cannot export `runtime` or `dynamic` — those go in the parent server layout
- `(auth)/layout.tsx` has `export const dynamic = 'force-dynamic'` to prevent prerender crashes when build env is missing

## Decisions
- Use `@supabase/ssr` (not legacy auth-helpers).
- Middleware matcher excludes `_next/static|_next/image|favicon.ico|api/auth|api/fal`.
- Generate-all processes panels sequentially to avoid fal rate limits.
- Every panel prompt must include character_bible verbatim for consistency.
- Strip markdown code fences from Grok JSON responses before parsing; validate with Zod.
- Auth: login-only. Signups disabled in middleware (redirect /signup → /login). Also disable in Supabase dashboard → Authentication → Providers → Email.
- `.npmrc` has `legacy-peer-deps=true` because some Cloudflare/OpenNext deps have peer conflicts.

## Things that wasted time and you must not repeat
- Trying `@cloudflare/next-on-pages` — DEPRECATED. Use `@opennextjs/cloudflare`.
- Trying to deploy as a Pages project — this app is configured as a **Worker**, not Pages.
- Setting `NEXT_PUBLIC_*` vars as Secrets on Cloudflare — they won't reach the build.
- Using edge runtime (`export const runtime = 'edge'`) — not needed with OpenNext + nodejs_compat. Removes Buffer/crypto restrictions.
- Setting `tools: [{type:'web_search'}]` for Grok — wrong shape for xAI. Use `search_parameters`.
- Inserting `auth.users` rows directly via SQL — use Supabase Dashboard "Add user" instead, otherwise identities table breaks login.
- Passing Flux params (`num_inference_steps`, `guidance_scale`) to Seedream — ignored at best, may error. Seedream uses `enhance_prompt_mode` + `enable_safety_checker` instead.
- Expecting mask/inpainting to work on Seedream edit — it doesn't. Seedream edit is prompt-driven; for masking you need a different pipeline.
- Naming a SQL column `window` — reserved word in Postgres, errors on CREATE TABLE. `reddit_rankings` uses `time_window` instead; `/api/trends/posts` maps `time_window → window` in the API response so the client-facing shape stays clean.
