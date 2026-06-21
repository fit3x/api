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
- `pnpm deploy:staging` — deploy the `staging` Worker (`api.staging.app.fit3x.com`)
- `pnpm deploy:production` — deploy the `production` Worker (`api.app.fit3x.com`)
- `pnpm test` — run the Vitest suite

## Publishing a new version

Each environment is its own Cloudflare Worker with its own secrets and
observability stream. Promote a release through staging before production.

1. **Verify locally.** Run the full suite and the type check; both must be
   green before deploying.

   ```bash
   pnpm test
   pnpm exec tsc --noEmit
   ```

2. **Sync secrets (only if they changed).** Secrets are never committed —
   set them per environment with Wrangler:

   ```bash
   wrangler secret put SECRET_NAME --env staging
   wrangler secret put SECRET_NAME --env production
   ```

3. **Deploy to staging and smoke-test.**

   ```bash
   pnpm deploy:staging
   curl https://api.staging.app.fit3x.com/v1/health
   ```

4. **Deploy to production** once staging looks good.

   ```bash
   pnpm deploy:production
   curl https://api.app.fit3x.com/v1/health
   ```

Wrangler prints the new version ID on each deploy. To roll back, redeploy
from the previous commit (`git checkout <sha> -- . && pnpm deploy:production`)
or use `wrangler rollback --env production`.

> **API contract versioning is separate from deploys.** Routes are versioned
> in the path (`/v1/...`). A backwards-incompatible contract change ships as a
> new version path (`/v2/...`) alongside the old one — it is not a Worker
> redeploy of `/v1`. See `CLAUDE.md`.

## Stack

Hono · Cloudflare Workers · TypeScript · Zod · Supabase · Unkey
