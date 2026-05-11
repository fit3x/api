# Fit3xAPI

Backend HTTP API for the Fit3x ecosystem. Serves the Fit3x mobile app and
exposes Fit3xGen session generation. Stateless, versioned at `/v1`.

## Tech stack

- Hono on Cloudflare Workers (TypeScript strict mode)
- Zod for input/output validation
- @hono/zod-openapi for auto-generated OpenAPI spec
- Supabase JWT for end-user authentication (verified server-side via JWKS)
- Unkey for machine-to-machine API keys
- Sentry for error tracking, Axiom (or Better Stack) for structured logs
- Vitest for tests, deployed via Wrangler

## Architecture rules

- **Stateless.** No in-memory state between requests. Persistent state
  lives in Supabase (Postgres) or Cloudflare KV/D1/R2.
- **Versioned routes always.** `/v1/sessions/generate`, never `/api/...`
  or unversioned. A new major contract = new version path.
- **Validate at every boundary.** Every route validates input with Zod
  AND asserts output with Zod before returning. Never trust upstream
  contracts (including Fit3xGen's).
- **Documented endpoints.** Every endpoint is registered via
  @hono/zod-openapi. The OpenAPI spec is generated from code, never
  hand-written.
- **Typed errors.** Errors surface as
  `{ error: { code, message, traceId } }`. Never expose stack traces,
  internal messages, or upstream error details to clients.

## Folder structure

```
src/
├── index.ts          entry — exports default { fetch: app.fetch }
├── app.ts            Hono app factory + middleware wiring
├── env.ts            typed Bindings (env vars + secrets)
├── routes/           one file per resource, mounted in app.ts
├── middleware/       cross-cutting concerns (auth, logging, errors)
├── lib/              pure functions; no Hono types in this folder
└── types/            shared TS types and Zod schemas
```

## Coding rules

- Plan before implementing any change touching more than 2 files.
- TypeScript strict mode. No `any`. Use `unknown` and narrow with Zod.
- No `console.log` in production code paths. Use `lib/logger.ts`.
- Env vars and secrets accessed only via the typed `Env` binding,
  never via `globalThis`, `process.env`, or string keys.
- Tests live next to the file they test as `*.test.ts`.
- Match existing patterns — read neighboring code before proposing
  structure.

## Security rules

- All input is untrusted, including from authenticated clients.
- JWTs are verified against Supabase's JWKS on every protected route,
  never `jwt.decode()`-without-verify.
- API keys (M2M) are verified via Unkey on every call to admin/internal
  routes.
- Secrets managed via `wrangler secret put` (prod/staging) and
  `.dev.vars` (local, gitignored). Never commit either.
- No sensitive data in logs. Redact tokens, passwords, request bodies
  containing PII.

## Deployment

- Local dev: `pnpm dev`
- Staging: `pnpm deploy --env staging`
- Production: `pnpm deploy --env production`
- Secrets: `wrangler secret put NAME --env <env>`

Each environment has its own Worker, its own secrets, its own
observability stream.

## Implementation rules

- Each commit does one thing. No mixed "fix bug + refactor + add feature".
- Don't add a dependency without justifying it in the commit message.
- When in doubt, ask before generating. Don't invent contracts.
