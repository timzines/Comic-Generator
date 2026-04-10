# Key Facts & Decisions

## Models
- **Grok**: `grok-3` via OpenAI SDK, baseURL `https://api.x.ai/v1`. For Live Search use `search_parameters: { mode: 'auto' }` as a top-level field (cast `// @ts-expect-error`). Do NOT use `tools: [{type:'web_search'}]` — that's the OpenAI shape, xAI rejects it.
- **fal generate**: `fal-ai/flux/dev` (landscape_16_9, 28 steps, guidance 3.5). Optional IP adapter from first reference image.
- **fal edit**: `fal-ai/flux-pro/kontext`. Accepts mask_url + reference_image_url. Input shape varies by version — cast input as `as never`.

## Database (Supabase)
- Tables: `profiles`, `comics`, `story_options`, `panels`, `reference_images`
- Enums: `comic_status` (drafting|generating|done|error), `panel_status` (pending|generating|done|error)
- `comics` holds `character_bible`, `style`, `custom_style`, `panel_count`, `status`
- `story_options`: 3 per comic, one gets `selected=true`; `act_breakdown` is jsonb array of {act, desc}
- `panels`: `panel_index`, `prompt`, `image_url`, `storage_path`, `status`
- RLS on all tables. story_options/panels/reference_images policies join through comics.user_id.
- Trigger `handle_new_user` on auth.users INSERT auto-creates a profiles row. Wrap body in EXCEPTION WHEN OTHERS to never block auth (otherwise login fails with "Database error querying schema").
- Triggers: updated_at on comics + panels.
- Storage buckets (private): `comic-panels`, `reference-images`

## API routes
- `/api/auth/callback` (GET) — exchangeCodeForSession
- `/api/comic/create` (POST) — server-side comic insert (used by wizard to bypass client RLS issues)
- `/api/story/research` — Grok + Live Search → {inspirations[5], themes[3]}
- `/api/story/options` — Grok → 3 story options, insert to DB
- `/api/story/select` — Grok → character_bible, mark option selected, status=generating
- `/api/story/panels` — Grok → N panel prompts, bulk insert
- `/api/image/generate` — single panel via fal
- `/api/image/generate-all` (GET, SSE) — sequential batch
- `/api/image/edit` — fal kontext with optional mask + reference
- `/api/image/upload-reference` (FormData) — store + insert row
- `/api/fal/proxy` (GET/POST/PUT) — `@fal-ai/server-proxy/nextjs` route export
- `/api/export` (GET) — stub, returns "coming soon"

## Page routes
- (auth): /login. /signup redirects to /login (disabled).
- (dashboard): /dashboard, /library, /new, /comic/[id]/storyboard, /comic/[id]/read, /comic/[id]/edit/[panelId]

## Env vars (Cloudflare quirks)
| Variable | Build var? | Runtime var? | Type on CF |
|---|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | yes | yes | Plaintext |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | yes | yes | Plaintext |
| `NEXT_PUBLIC_APP_URL` | yes | yes | Plaintext |
| `SUPABASE_SERVICE_ROLE_KEY` | no | yes | Secret |
| `XAI_API_KEY` | no | yes | Secret |
| `FAL_KEY` | no | yes | Secret |

**Critical:** Cloudflare Workers distinguishes Secret (runtime-only) vs Plaintext (build + runtime). `NEXT_PUBLIC_*` MUST be Plaintext or they get baked into the client bundle as `undefined`. Vercel does not have this distinction.

`next.config.js` has hardcoded fallbacks for `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `NEXT_PUBLIC_APP_URL` — these are public values (anon key is meant to be in client code) and act as a safety net if the build env vars are misconfigured.

## Cloudflare-specific code patterns
- `await createClient()` for server Supabase (Next 15 makes `cookies()` async)
- `params: Promise<{...}>` then `await params` in dynamic page components (Next 15)
- Use `Uint8Array(await arrayBuffer())` instead of `Buffer.from(...)` where possible (works in both Node and edge)
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
