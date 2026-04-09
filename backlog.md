# Backlog

## Done
- [x] PHASE 0 — Scaffold Next.js 14 app, deps, folder tree, env, tailwind, layout, globals.css
- [x] PHASE 1 — supabase/schema.sql, database.ts, api.ts
- [x] PHASE 2 — Supabase server/client/admin, middleware, login, signup, auth callback
- [x] PHASE 3 — Grok: research, options, select, panels routes
- [x] PHASE 4 — fal.ai: fal.ts, proxy, generate, generate-all (SSE), edit, upload-reference
- [x] PHASE 5 — UI primitives, Nav, dashboard, library, new wizard (4 steps), storyboard, edit studio, reader
- [x] PHASE 6 — loading/error/not-found, UserContext, real Supabase queries, SSE wiring, no `any`
- [x] PHASE 7 — .gitignore, vercel.json, tsc clean, next build passes

## Manual setup still required (user)
- [ ] Create Supabase project, paste URL + anon + service-role keys into `.env.local`
- [ ] Run `supabase/schema.sql` in Supabase SQL editor
- [ ] Create private storage buckets `comic-panels` and `reference-images` + storage RLS
- [ ] Get xAI (Grok) + fal.ai API keys
- [ ] Push repo → Vercel, set all env vars
- [ ] Add Supabase auth redirect + site URL
- [ ] End-to-end smoke test on production

## Future / nice to have
- [ ] Real Export ZIP endpoint (currently stub)
- [ ] Persisted edit history (new table `panel_edits` with prompt + prev image url)
- [ ] Mobile hamburger menu in Nav (basic only at the moment)
- [ ] Reference image delete button in wizard
- [ ] Skeleton loading state on storyboard generation for individual panels
- [ ] Rate-limit handling / retry backoff for fal batch generation
