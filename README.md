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

## Workout engine

The API wraps `@fit3x/workout-engine` (published from the `Fit3xGen` repo's
`ts-package/`). `/v1` currently speaks **engine 1.3.0 / contract v3.0.0**.

| Route                      | Engine call            |
|----------------------------|------------------------|
| `POST /v1/sessions/generate` | `generateWorkout`    |
| `GET /v1/programs`         | `getPrograms`          |
| `GET /v1/sessions/catalog` | `getSessions`          |
| `GET /v1/sessions/coverage`| `getSessionCoverage`   |
| `GET /v1/options`          | `get*Options`          |
| `GET /v1/exercises`        | `getExercises`         |

> **Blocked: engine 1.3.0 cannot generate on Workers as published.**
> `generateWorkout` → `validateInput` calls `ajv.compile()`, which builds a
> validator with `new Function`. Cloudflare Workers forbid runtime code
> generation, so the first generate call fails with
> `EvalError: Code generation from strings disallowed for this context`.
> Catalog routes (`/v1/programs`, `/v1/sessions/catalog`,
> `/v1/sessions/coverage`, `/v1/options`, `/v1/exercises`) are unaffected.
> Fix belongs in Fit3xGen — precompile the schema with ajv's standalone mode
> so no validator is built at runtime. See "Verifying an engine upgrade".

### Upgrading the engine

The contract is asserted at both boundaries, so an engine bump is a code
change, not a version bump alone:

1. Bump the dependency and reinstall.
2. Diff `Fit3xGen/json_contracts/json-input-output/{input,output}_contract.json`
   and `ts-package/src/types/{input,output,session}.ts` against
   `src/types/workout-engine.ts`.
3. Diff `ts-package/src/index.ts` against the imports in
   `src/lib/workout-engine.ts` — the export surface moves between versions
   (1.3.0 replaced `getWorkoutPrograms` with `getPrograms`, dropped
   `getBlockTypeOptions` / `getExcludableBlockOptions`, and changed
   `generateWorkout` to `generateWorkout(input, options?)` with the locale
   read from `generation_request.locale`).
4. `pnpm test && pnpm exec tsc --noEmit`.
5. Smoke-test generation under `wrangler dev` — see below. **Do not treat a
   green Vitest run as proof the engine works in production.**

The generation route asserts the engine's response with Zod before returning
it, so a contract drift surfaces as a logged
`sessions.generate.engine_contract_violation` and a 500 rather than a
malformed payload reaching a client.

### Verifying an engine upgrade

`@cloudflare/vitest-pool-workers` runs workerd with an `unsafeEval` binding
that production does **not** have. Anything the engine does with `eval` or
`new Function` therefore passes in Vitest and fails once deployed — which is
exactly how the ajv issue above hides.

So after any engine bump, exercise generation through a real isolate:

```bash
pnpm dev                      # wrangler dev, no unsafeEval
# then drive POST /v1/sessions/generate with a real JWT — see bruno/
```

A `Code generation from strings disallowed` error there means the engine
compiles something at runtime and needs a build-time precompile instead.

## Stack

Hono · Cloudflare Workers · TypeScript · Zod · Supabase · Unkey
