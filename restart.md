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

## Where I stopped
Waiting on first end-to-end test of the deployed worker (login → wizard → generate). Last issue was env var confusion on Cloudflare; resolved by hardcoding public values.

## Next step
1. Hard-refresh `comicgenerator.timzines.workers.dev/login` and verify login works.
2. Test the new comic wizard end-to-end: describe → research → story → panels → generate.
3. If anything fails, check Cloudflare → Workers & Pages → comicgenerator → Logs (Begin log stream) for the actual error.

## Known traps (do not relearn the hard way)
- `NEXT_PUBLIC_*` Cloudflare vars must be **Plaintext**, not Secret. Otherwise the client bundle has `undefined`.
- Server-only secrets (`SUPABASE_SERVICE_ROLE_KEY`, `XAI_API_KEY`, `FAL_KEY`) live as runtime Secrets — they don't need to be build vars.
- Don't add `export const runtime = 'edge'` anywhere — OpenNext uses Node runtime via `nodejs_compat`.
- Never insert into `auth.users` via SQL — use Supabase Dashboard "Add user" or login breaks.
- Grok Live Search uses `search_parameters: { mode: 'auto' }`, NOT OpenAI's `tools: [{type:'web_search'}]`.
- The `handle_new_user` trigger must wrap its body in `EXCEPTION WHEN OTHERS THEN RETURN NEW` so a profile insert failure can never block login.
