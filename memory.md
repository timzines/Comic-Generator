# Key Facts & Decisions

## Models
- Grok: `grok-3` via OpenAI SDK, baseURL `https://api.x.ai/v1`. Web search tool enabled for research step only.
- fal generate: `fal-ai/flux/dev` (landscape_16_9, 28 steps, guidance 3.5). Optional IP adapter from first reference image.
- fal edit: `fal-ai/flux-pro/kontext`. Accepts mask_url + reference_image_url.

## Database (Supabase)
Tables: `profiles`, `comics`, `story_options`, `panels`, `reference_images`
Enums: `comic_status` (drafting|generating|done|error), `panel_status` (pending|generating|done|error)
- `comics` holds `character_bible`, `style`, `custom_style`, `panel_count`, `status`
- `story_options`: 3 per comic, one gets `selected=true`; `act_breakdown` is jsonb array of {act, desc}
- `panels`: `panel_index`, `prompt`, `image_url`, `storage_path`, `status`
- RLS on all tables. story_options/panels/reference_images policies join through comics.user_id.
- Triggers: auto-create profile on auth.users insert; updated_at on comics + panels.
- Storage buckets (private): `comic-panels`, `reference-images`

## API routes (all POST unless noted)
- `/api/auth/callback` (GET) — exchangeCodeForSession
- `/api/story/research` — Grok + web_search → {inspirations[5], themes[3]}
- `/api/story/options` — Grok → 3 story options, insert to DB
- `/api/story/select` — Grok → character_bible, mark option selected, status=generating
- `/api/story/panels` — Grok → N panel prompts, bulk insert
- `/api/image/generate` — single panel via fal
- `/api/image/generate-all` (GET, SSE) — sequential batch
- `/api/image/edit` — fal kontext with optional mask + reference
- `/api/image/upload-reference` (FormData) — store + insert row
- `/api/fal/proxy` (GET/POST/PUT) — `@fal-ai/client/nextjs` route export

## Page routes
- (auth): /login, /signup
- (dashboard): /dashboard, /library, /new, /new/story, /new/panels, /comic/[id]/storyboard, /comic/[id]/read, /comic/[id]/edit/[panelId]

## Env vars
NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY, XAI_API_KEY, FAL_KEY, NEXT_PUBLIC_APP_URL

## Decisions
- Use `@supabase/ssr` (not legacy auth-helpers).
- Middleware matcher excludes `_next/static|_next/image|favicon.ico|api/auth`.
- Generate-all processes panels sequentially to avoid fal rate limits.
- Every panel prompt must include character_bible verbatim for consistency.
- Strip markdown code fences from Grok JSON responses before parsing; validate with Zod.
