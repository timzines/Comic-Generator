# Comic Studio — Project Rules

## What we're building
Comic Studio: Next.js 15 web app where users describe a comic, Grok researches + writes the story, fal.ai generates/edits panels. Supabase for auth, DB, storage.

## Stack (locked)
- **Next.js 15** (App Router, TypeScript, Tailwind, src/ dir, React 19)
- **Supabase** (`@supabase/ssr`) — auth, Postgres, Storage. `cookies()` is async (Next 15).
- **Grok** (xAI, OpenAI SDK with `baseURL: https://api.x.ai/v1`, model `grok-3`) — research, story options, character bible, panel prompts. Live Search via `search_parameters: { mode: 'auto' }` (NOT `tools: [{type:'web_search'}]` — that's an OpenAI shape, xAI rejects it).
- **fal.ai** (`@fal-ai/client` + `@fal-ai/server-proxy`) — `fal-ai/flux/dev` for generate, `fal-ai/flux-pro/kontext` for edit. Always via server-side `/api/fal/proxy`.
- Zustand for client state, Zod for validation, react-dropzone for uploads.

## Hosting target: Cloudflare Workers (via @opennextjs/cloudflare)
- **NOT Vercel.** App was originally built for Vercel; moved to Cloudflare Workers under duress. Many quirks — see memory.md for the gotchas.
- Adapter: `@opennextjs/cloudflare` (replaces deprecated `@cloudflare/next-on-pages`).
- Build command: `npx opennextjs-cloudflare build`
- Deploy command: `npx wrangler deploy`
- Compatibility flag: `nodejs_compat` (in wrangler.jsonc — DO NOT remove)
- `wrangler.jsonc` at project root drives the deploy.
- `open-next.config.ts` at project root configures the adapter.

## How we work
- Build in phases as tracked in backlog.md. One phase at a time.
- Before each phase, read restart.md.
- After finishing a phase, update restart.md / backlog.md / memory.md as needed.
- Don't invent features outside the spec. Ask if ambiguous.
- No `any` types. Run `npx tsc --noEmit` before calling a phase done.
- Run `npx next build` locally before pushing (Cloudflare builds are slow — fail fast locally).

## Conventions
- Colors: bg `#0a0a0f`, surface `#111118`, surface2 `#18181f`, accent `#c8ff00`, muted `#ffffff40`
- Font: Syne (next/font/google), weights 400–800
- All API routes auth via server Supabase client (`await createClient()` — async in Next 15); verify comic ownership before any mutation
- Server-side only for Grok + fal keys. Never ship secrets to client.
- Storage paths: `{userId}/{comicId}/...` in buckets `comic-panels` and `reference-images` (both private)
- SSE for batch panel generation (sequential, not parallel — rate limits)
- Login-only auth (signups disabled — `/signup` redirects to `/login`)
- Edge runtime is NOT used — OpenNext runs Node runtime via `nodejs_compat`. Buffer/crypto/etc work fine.
