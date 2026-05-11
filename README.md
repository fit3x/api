# Fit3xAPI

Backend API for the Fit3x ecosystem. See `CLAUDE.md` for architecture and conventions.

## Local development

```bash
pnpm install
cp .dev.vars.example .dev.vars  # then fill in secret values
pnpm dev
```

Server boots at `http://localhost:8787`.

## Scripts

- `pnpm dev` — local Wrangler dev server with hot reload
- `pnpm deploy` — deploy to Cloudflare (default env)
- `pnpm test` — run Vitest suite (added in later commits)

## Stack

Hono · Cloudflare Workers · TypeScript · Zod · Supabase · Unkey
