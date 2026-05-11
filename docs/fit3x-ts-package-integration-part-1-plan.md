## Goal

Expose the public methods of the Fit3xGen project (sibling folder at
`../Fit3xGen`) as HTTP API endpoints in Fit3xAPI. The API is the only
thing clients (Fit3x mobile app, future web app, internal tools) ever
talk to — Fit3xGen itself stays internal.

This task is structured in THREE phases with explicit review gates.
DO NOT advance past a phase without my approval.

## Important: Fit3xGen layout

`../Fit3xGen` is a multi-artifact repo. The TypeScript package that
Fit3xAPI will integrate with lives at:

```
../Fit3xGen/ts-package/
```

Treat that subfolder as the integration target. The rest of
`../Fit3xGen` (root README, schemas, docs, any other language packages)
is supporting context — read it to understand intent, but do not try
to import from anywhere outside `ts-package/`.

When the prompt below says "read Fit3xGen" or "look at Fit3xGen," it
means:

- `../Fit3xGen/ts-package/` for code, manifest, exports, dependencies,
  build configuration, tests
- `../Fit3xGen/` (root) for README, contract docs, schemas, anything
  that documents intent across packages

## Read first

Before anything else, read:

1. `CLAUDE.md` (this repo) — architecture rules, security rules, folder
   conventions
2. `src/middleware/auth.ts` (this repo) — auth pattern to apply to
   protected routes
3. `src/app.ts` and `src/env.ts` (this repo) — wiring patterns
4. `../Fit3x/docs/fit3xgen-integration.md` IF IT EXISTS — this is the
   pre-agreed consumer-side contract between the mobile app and Fit3xGen.
   It's the authoritative description of what the API surface should look
   like from the client's point of view. If it doesn't exist, note that
   and proceed using the Fit3xGen repo as the only source of truth.

The Fit3xGen folder is READ-ONLY context. DO NOT modify, build, or write
into `../Fit3xGen` for any reason. If a change to Fit3xGen seems necessary,
surface it as an open question — do not make it.

---

## Phase 1 — Discovery (NO CODE, NO COMMITS)

Explore `../Fit3xGen` and produce a written discovery report. The report
must answer all of these:

1. **Language and runtime.** What is Fit3xGen written in? Read its
   `package.json`, `pyproject.toml`, `Cargo.toml`, `go.mod`, or whatever
   manifest it uses. Identify version, module system (ESM / CJS / etc.),
   and any build step.

1a. **Package shape.** Inspect `../Fit3xGen/ts-package/`: - Is it a source-only package (no `dist/`, consumers run TS directly)
or pre-built (has `dist/` and `package.json` `main`/`exports`
pointing at it)? - Is it published to npm (check `name`, `version`, and try
`npm view <name>`), or local-only? - What does `package.json` `exports` / `main` / `types` declare?
List every public entry point. - What's its module system — ESM (`"type": "module"`), CJS,
or dual? Workers strongly prefer ESM. - Are there sibling packages under `../Fit3xGen/` (Python, Rust,
etc.)? Just enumerate them; don't go deep. Useful context for
future-me, not part of this integration.

2. **Public surface inventory.** List every exported / public method,
   class, or function intended to be called by consumers. For each:
   - Name and file path
   - Input type / schema (link to the source)
   - Output type / schema (link to the source)
   - Side effects (does it do I/O? network? read files?) — be explicit
   - Whether it's deterministic given the same inputs (seeded?)

3. **Existing contract docs.** Does Fit3xGen have a README, OpenAPI
   spec, JSON Schema, TypeBox/Zod schemas, or any other published
   contract artifact? If so, summarize what each describes.

4. **Test coverage.** Are there tests in `../Fit3xGen`? What do they
   tell us about expected inputs and outputs? Note any edge cases the
   tests cover (e.g., injuries handling, seed determinism).

5. **Invocation options from Workers.** Based on the language:
   - If TypeScript / JavaScript: can it be imported directly? Is it
     published to npm, or would we use a pnpm workspace / file: dependency
     / git URL? Are its dependencies Workers-compatible (no Node-only
     APIs like `fs`, `child_process`, native modules)?
   - If Python / Rust / Go / other: it cannot run inside Workers
     directly. Identify the realistic options (separate service,
     WASM compile, etc.) and the trade-offs.

6. **Risks and unknowns.** Anything that looks like it'll break,
   slow us down, or needs a product decision. Examples:
   - Methods that aren't deterministic and would complicate caching
   - Methods that do filesystem I/O (don't work on Workers)
   - Heavy startup cost (large data loads at module init)
   - Versioning gaps (no semantic versioning, no changelog)
   - Type definitions missing or incomplete

7. **Open questions for the human.** A short list of things YOU NEED
   ME TO ANSWER before designing the API. Example:
   - "Should `generateSession` and `generateWeek` be separate endpoints
     or one endpoint with a `scope` parameter?"
   - "Should the catalog-programs method be exposed at all, or kept
     internal?"

### Phase 1 output format

A single markdown document, written to chat (not committed, not saved
to a file). Use the section numbers above. Keep it crisp — facts and
links, not prose padding.

**STOP after Phase 1 and wait for my approval.** Do not propose endpoints,
do not write Zod schemas, do not touch the implementation.

---

## Phase 2 — Architectural plan (after I approve Phase 1)

Once I've reviewed the discovery report, produce a SECOND written plan
covering:

1. **Invocation model.** How Fit3xAPI will call Fit3xGen. Concrete:
   pnpm workspace, file: dependency, git URL, separate service URL,
   etc. Justify the choice against the alternatives from Phase 1.

2. **Endpoint inventory.** Propose the HTTP API surface. For each
   endpoint:
   - HTTP method + path (versioned at `/v1/...`)
   - Brief description
   - Auth requirement (Supabase JWT? unauthenticated? M2M only?)
   - Idempotency expectations
   - Rate-limit class (cheap / moderate / expensive)

3. **Zod schema strategy.** For each endpoint, name the Zod schemas
   for input and output. Two schemas per endpoint minimum:
   - Request schema (validates client input)
   - Response schema (validates Fit3xGen output before returning)
     Per CLAUDE.md: never trust upstream contracts, including Fit3xGen's.

4. **Error mapping.** How Fit3xGen errors / thrown exceptions / invalid
   states will be translated into the standard
   `{ error: { code, message } }` shape. Specifically: which errors are
   400 (client input bad) vs 500 (Fit3xGen failed) vs 422 (input was
   valid but Fit3xGen rejected it for domain reasons, e.g., impossible
   constraints).

5. **File structure plan.** Which files will be created or modified.
   Match the existing folder conventions from CLAUDE.md:
   - `src/routes/sessions.ts` (or per-resource)
   - `src/lib/fit3xgen.ts` — the adapter layer
   - `src/types/fit3xgen.ts` — shared schemas
   - tests next to each

6. **Open questions.** Anything still unresolved.

### Phase 2 output format

Markdown plan in chat. Same rule: STOP and wait for my approval. Do not
write code yet.

---

## Phase 3 — Implementation (after I approve Phase 2)

Build it. Rules:

1. **One endpoint at a time, smallest first.** If the plan has 4
   endpoints, implement them in 4 commits, not 1. Start with the
   cheapest / simplest one as a vertical slice that proves the whole
   path works end-to-end.

2. **Validation at both boundaries.** Every endpoint:
   - Parses request body with Zod → 400 on failure
   - Calls the Fit3xGen adapter
   - Parses Fit3xGen response with Zod → 500 on failure (this is a
     contract violation by Fit3xGen; we want to know about it)
   - Returns validated response

3. **Auth.** Apply `requireSupabaseAuth` to every endpoint unless we
   explicitly decided in Phase 2 that one is public or M2M-only.

4. **Errors.** Use the existing error response shape. Never leak
   Fit3xGen internals (file paths, stack traces, internal exception
   classes) to clients. Log full details server-side; return generic
   messages.

5. **Tests.** For each endpoint, Vitest tests covering:
   - Happy path (valid input → 200 with validated response)
   - Invalid input → 400 with the right error code
   - Unauthorized (no token) → 401
   - Fit3xGen contract violation (mock Fit3xGen to return malformed
     output) → 500 with generic error and a server-side log

6. **No commits.** Stage all changes, run `pnpm test`, report the
   output, but DO NOT commit. I'll review the diff and commit each
   slice myself.

---

## Things NOT to do (across all phases)

- Do not modify, build, or write into `../Fit3xGen`. It is read-only.
- Do not reimplement any Fit3xGen logic in Fit3xAPI. Call it; don't
  duplicate it. If a method seems redundant, surface it as a question.
- Do not skip output validation because "we wrote Fit3xGen and trust it."
  CLAUDE.md says validate both boundaries; that rule has no exceptions.
- Do not expose endpoints without auth unless Phase 2 explicitly
  approves a public surface.
- Do not bring in new heavyweight dependencies without justifying them
  in the plan and the commit message.
- Do not assume the language — discover it. If `../Fit3xGen` turns out
  to be Python or any non-JS language, stop at Phase 1 and surface the
  invocation problem; do not attempt to call across language boundaries
  without my decision on the integration model.
- Do not collapse the phases. If Phase 1 looks "obvious," still produce
  the written report. The report is the artifact future-me uses to
  understand the surface; skipping it costs us later.

---

## Output expectation for THIS turn

Phase 1 only. Discovery report in chat. No code. No file edits. No
commits. Then stop.
