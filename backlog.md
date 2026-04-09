# Backlog

## PHASE 0 — Scaffold
- [ ] 0.1 Create Next.js 14 app `comic-studio` (App Router, TS, Tailwind, src/), install deps (@supabase/supabase-js, @supabase/ssr, @fal-ai/client, openai, zod, zustand, react-dropzone), create full folder tree with placeholder pages
- [ ] 0.2 .env.local, next.config.js remotePatterns (*.fal.run, *.supabase.co, fal.media), tailwind theme (Syne font + color palette), layout.tsx with Syne, globals.css (scrollbar, .grid-bg, CSS vars)

## PHASE 1 — Supabase DB
- [ ] 1.1 supabase/schema.sql: extensions, 5 tables, 2 enums, RLS policies, profile trigger, updated_at triggers, storage bucket notes
- [ ] 1.2 src/types/database.ts + src/types/api.ts

## PHASE 2 — Auth
- [ ] 2.1 supabase/{server,client,admin}.ts + src/middleware.ts
- [ ] 2.2 /api/auth/callback, /login, /signup, (auth)/layout.tsx

## PHASE 3 — Grok routes
- [ ] 3.1 src/lib/grok.ts + /api/story/research (with web_search tool)
- [ ] 3.2 /api/story/options (3 options, insert to DB)
- [ ] 3.3 /api/story/select (character bible, mark selected, status=generating)
- [ ] 3.4 /api/story/panels (N panel prompts, bulk insert)

## PHASE 4 — fal.ai routes
- [ ] 4.1 src/lib/fal.ts + /api/fal/proxy
- [ ] 4.2 /api/image/generate (single panel, upload to storage)
- [ ] 4.3 /api/image/generate-all (SSE, sequential)
- [ ] 4.4 /api/image/edit (kontext, mask + reference)
- [ ] 4.5 /api/image/upload-reference (FormData)

## PHASE 5 — Frontend
- [ ] 5.1 UI primitives: Button, Input, Badge, Card, Modal, Toast, Spinner, PlaceholderImage, index
- [ ] 5.2 (dashboard)/layout.tsx, Nav, ComicCard, zustand comicStore
- [ ] 5.3 Dashboard page + DashboardClient (hero, stats, recent grid)
- [ ] 5.4 Library page + LibraryClient (search/filter/sort/delete)
- [ ] 5.5 New Comic wizard: shell + StepDescribe + StepResearch + StepStory + StepPanels
- [ ] 5.6 Storyboard page + PanelCard + SSE generation + useSSE hook
- [ ] 5.7 Edit Studio: EditCanvas (brush/eraser/mask export), EditSidebar
- [ ] 5.8 Reader page + /api/export stub

## PHASE 6 — Polish
- [ ] 6.1 UserContext, Nav wiring, loading.tsx, error.tsx, not-found.tsx, responsive pass
- [ ] 6.2 Replace mocks with real Supabase queries; wire SSE, edit POST, reference uploads; zero `any` types

## PHASE 7 — Deploy
- [ ] 7.1 .gitignore, `tsc --noEmit`, `next build`, vercel.json, middleware excludes /api/fal/proxy
- [ ] 7.2 Push to GitHub, import to Vercel, env vars, Supabase redirect URLs, create storage buckets, run schema.sql, prod smoke test

## Troubleshooting playbook (on-demand)
- Auth redirect loop → middleware matcher + cookie pattern
- fal CORS → proxy route + proxyUrl config
- SSE not updating → EventSource URL, onmessage, store update, headers
- RLS errors → re-check policies (joins through comics for child tables)
- TS errors → run tsc, fix all, no `any`
