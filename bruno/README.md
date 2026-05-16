# Fit3xAPI — Bruno collection

End-to-end manual testing of the API. Companion to the Vitest suite —
Vitest covers the code paths; this collection drives real HTTP against a
running Worker (local `pnpm dev`, staging, or production).

## One-time setup

1. Install Bruno: `brew install bruno` (or download from https://www.usebruno.com)
2. Open Bruno → "Open Collection" → point at this `bruno/` folder
3. In the environment picker (top-right), pick `local`, `staging`, or `production`
4. Open the environment for editing and fill in:
   - `supabaseUrl` — your Supabase project URL (e.g. `https://xxx.supabase.co`).
     Local and staging may share the same project; production typically
     points at a separate Supabase project once you create it.
   - `supabaseAnonKey` — from the Supabase dashboard → Settings → API →
     Project API keys → `anon` `public`. Designed to be exposed to clients.
   - `userEmail` / `userPassword` — credentials for any user in that
     Supabase project (create a test user in the dashboard if needed)
   - Leave `jwt` empty — the **Sign In** request fills it automatically

Save (Cmd+S) — these values stick in your local copy of the env files.
**Do not commit env files with real credentials filled in.**

## Each session

1. Run **Sign In** (seq 0). On 200, its post-response script writes
   `access_token` into the env's `jwt` field for you.
2. Run any other request — they all read `{{jwt}}` from the env.
3. Supabase access tokens last ~1 hour. When they expire, just rerun
   **Sign In**.

## Requests

| Order | Name              | Endpoint                                                                | Auth |
|-------|-------------------|-------------------------------------------------------------------------|------|
| 0     | Sign In           | `POST {{supabaseUrl}}/auth/v1/token?grant_type=password` (auto-captures JWT) | none |
| 1     | Health            | `GET /v1/health`                                                        | none |
| 2     | Me                | `GET /v1/me`                                                            | JWT  |
| 3     | Engine Version    | `GET /v1/engine/version`                                                | JWT  |
| 4     | Options           | `GET /v1/options?locale=en`                                             | JWT  |
| 5     | Programs          | `GET /v1/programs`                                                      | JWT  |
| 6     | Sessions Generate | `POST /v1/sessions/generate`                                            | JWT  |

The Sessions Generate body uses the minimal valid `SessionInput` documented
in the engine's `generateWorkout` JSDoc. Edit it to exercise other scopes
(`week_sessions`, `month_sessions`, `program_sessions`) or richer customer
profiles.

## Smoke test order

1. **Sign In** — should be 200 and `jwt` should populate
2. **Health** — 200 unauthenticated (sanity check the env's baseUrl)
3. **Engine Version** — 200, proves auth wiring
4. **Sessions Generate** — 200 with `workout_sessions` populated, proves
   auth + Zod input + engine + Zod output all work end-to-end

## Running against `pnpm dev`

```
pnpm dev
```

Wrangler starts on `http://localhost:8787` (matches `bruno/environments/local.bru`).
Even locally, the Worker verifies JWTs against the **real** Supabase JWKS,
so you need a real user in your dev/staging Supabase project to sign in.

## Avoiding credential leaks

The env files are committed with empty placeholders, but once you paste
your credentials in, edits to those files become risky. Belt-and-suspenders:

```
git update-index --skip-worktree bruno/environments/local.bru
git update-index --skip-worktree bruno/environments/staging.bru
git update-index --skip-worktree bruno/environments/production.bru
```

…makes git ignore subsequent local edits to those files. Reverse with
`--no-skip-worktree` if you ever need to update the committed structure.
