# Comic Studio — Project Rules

## What we're building
Comic Studio: a Next.js 14 web app where users describe a comic, Grok researches + writes the story, and fal.ai generates/edits the panels. Supabase for auth, DB, storage.

## Stack (locked)
- Next.js 14 (App Router, TypeScript, Tailwind, src/ dir)
- Supabase (@supabase/ssr) — auth, Postgres, Storage
- Grok (xAI, via OpenAI SDK with baseURL https://api.x.ai/v1, model `grok-3`) — research, story options, character bible, panel prompts
- fal.ai (@fal-ai/client) — `fal-ai/flux/dev` for generate, `fal-ai/flux-pro/kontext` for edit. Always via server-side `/api/fal/proxy`.
- Zustand for client state, Zod for validation, react-dropzone for uploads
- Deployed to Vercel

## How we work
- Build in phases (0 → 7) as laid out in backlog.md. One phase at a time; don't jump ahead.
- Before each phase, read restart.md to see where we stopped.
- After finishing a phase/prompt, update restart.md + backlog.md + memory.md as needed.
- Don't invent features outside the spec. If something's ambiguous, ask.
- No `any` types. Run `npx tsc --noEmit` before calling a phase done.

## Conventions
- Colors: bg `#0a0a0f`, surface `#111118`, surface2 `#18181f`, accent `#c8ff00`, muted `#ffffff40`
- Font: Syne (next/font/google), weights 400–800
- All API routes auth via server Supabase client; verify comic ownership before any mutation
- Server-side only for Grok + fal keys. Never ship keys to client.
- Storage paths: `{userId}/{comicId}/...` in buckets `comic-panels` and `reference-images` (both private)
- SSE for batch panel generation (sequential, not parallel — rate limits)
