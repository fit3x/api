# Fit3x API — Public Integration Guide

Backend HTTP API for the Fit3x ecosystem. It serves the Fit3x mobile app and
exposes Fit3xGen workout generation. The service is **stateless** and all routes
are **versioned under `/v1`**.

> Copy this file into any project that consumes the Fit3x API. It is the
> canonical reference for the public endpoints, their request/response
> contracts, authentication, and error format.

---

## Base URLs

| Environment | Base URL |
| ----------- | -------- |
| Local dev   | `http://localhost:8787` |
| Staging     | `https://api.staging.app.fit3x.com` |
| Production  | `https://api.app.fit3x.com` |

All paths below are relative to the base URL. Every endpoint lives under `/v1`.

---

## Authentication

Every endpoint **except `GET /v1/health`** requires a **Supabase end-user JWT**
sent as a bearer token:

```
Authorization: Bearer <supabase_jwt>
```

- Tokens are verified server-side against the Supabase project's JWKS
  (`{SUPABASE_PROJECT_URL}/auth/v1/.well-known/jwks.json`).
- Required token claims: `iss` = `{SUPABASE_PROJECT_URL}/auth/v1`,
  `aud` = `authenticated`, and a string `sub` (the user ID).
- Tokens are never decoded without verification.

**Failure → `401 unauthorized`:**

```json
{
  "error": { "code": "unauthorized", "message": "Authentication required" },
  "requestId": "req_..."
}
```

A missing/malformed `Authorization` header, an empty token, or an invalid /
expired token all return the same `401`.

The JWT comes from Supabase, not from this API. Obtain it with your Supabase
client and forward it on every request.

---

## Conventions

- **Content type:** send `Content-Type: application/json` on any request with a
  body. All responses are JSON.
- **Request ID:** every response carries a `requestId` field and an
  `X-Request-Id` response header. Log it — it is the key to correlate a request
  with server logs/support.
- **Caching:** several `GET` endpoints are cacheable via `ETag` /
  `If-None-Match` and return `304 Not Modified` on a match (see each endpoint).
- **Versioning:** only `/v1` exists today. A breaking contract change ships as a
  new version path (`/v2/...`); `/v1` does not change shape underneath you.
- **Engine version:** content endpoints return an `engineVersion` and use it in
  their `ETag`. Pair it with `GET /v1/engine/version` to detect stale caches.

---

## Error format

All errors from the API's own handlers use this envelope. Stack traces and
upstream/internal details are never returned.

```json
{
  "error": {
    "code": "string",
    "message": "human-readable summary"
  },
  "requestId": "req_..."
}
```

Validation errors add an `issues` array:

```json
{
  "error": {
    "code": "bad_request",
    "message": "Invalid request body",
    "issues": [{ "path": ["customer_profile", "demographics", "age"], "message": "Required" }]
  },
  "requestId": "req_..."
}
```

| HTTP | `error.code`           | When |
| ---- | ---------------------- | ---- |
| 400  | `bad_request`          | Malformed JSON or schema validation failure |
| 401  | `unauthorized`         | Missing/invalid/expired token |
| 404  | `not_found`            | Unknown route or resource |
| 422  | `unprocessable_entity` | Engine could not satisfy a valid request |
| 500  | `internal_error`       | Unexpected server / engine-contract error |

---

## Endpoint summary

| Method | Path | Auth | Notes |
| ------ | ---- | ---- | ----- |
| GET  | `/v1/health` | Public | Liveness check |
| GET  | `/v1/me` | JWT | Current user from token claims |
| GET  | `/v1/exercises` | JWT | Full exercise catalog (ETag) |
| GET  | `/v1/exercises/:id` | JWT | Single exercise (ETag) |
| GET  | `/v1/programs` | JWT | Workout program catalog (ETag) |
| GET  | `/v1/options` | JWT | Localized option bundle (ETag) |
| GET  | `/v1/engine/version` | JWT | API + engine version |
| POST | `/v1/sessions/generate` | JWT | Generate workout session(s) — primary endpoint |

---

## Endpoints

### `GET /v1/health` — Public

Liveness check. No authentication.

**`200 OK`**

```json
{
  "status": "ok",
  "timestamp": "2026-05-30T12:00:00.000Z",
  "version": "v1",
  "requestId": "req_..."
}
```

---

### `GET /v1/me`

Returns the authenticated user, derived directly from the JWT claims.

**`200 OK`**

```json
{
  "id": "user-uuid",
  "email": "user@example.com",
  "role": "authenticated",
  "requestId": "req_..."
}
```

| Field   | Type             | Source claim |
| ------- | ---------------- | ------------ |
| `id`    | string           | `sub` |
| `email` | string \| null   | `email` |
| `role`  | string           | `role` |

---

### `GET /v1/exercises`

Full exercise catalog. Cacheable.

- `ETag: "exercises-{engineVersion}"`, `Cache-Control: public, max-age=3600`.
- Send `If-None-Match` to get `304 Not Modified` when unchanged.

**`200 OK`**

```json
{
  "engineVersion": "string",
  "exercises": [ { "id": "string", "name": "string", "...": "see Exercise object" } ],
  "requestId": "req_..."
}
```

**Exercise object** (key fields; full schema is the authoritative source):

| Field | Type | Notes |
| ----- | ---- | ----- |
| `id` | string | Exercise ID |
| `name` | string | Display name |
| `type` | string | Exercise type |
| `gender` | string | Target gender |
| `primary_muscle_id` | string \| null | |
| `secondary_muscle_ids` | string[] | |
| `body_part_ids` | string[] | |
| `equipment_ids` | string[] | |
| `movement_pattern_ids` | string[] | |
| `condition_restriction_ids` / `condition_indication_ids` | string[] | Injury/condition tagging |
| `substitution_ids` | string[] | Suggested substitutions |
| `*_score` (priority, fatigue, technical, etc.) | number \| null | Engine scoring metadata |
| `disabled` | boolean \| null | |

> The full per-exercise schema (scores, cooldowns, grips, ROM, spinal load,
> etc.) is defined by the Zod `ExerciseSchema` in
> `src/types/workout-engine.ts`. Treat that schema as the source of truth.

---

### `GET /v1/exercises/:id`

Single exercise by ID. Cacheable.

- Path param `id` (string).
- `ETag: "exercise-{id}-{engineVersion}"`, `Cache-Control: public, max-age=3600`.

**`200 OK`**

```json
{
  "engineVersion": "string",
  "exercise": { "id": "string", "name": "string", "...": "Exercise object" },
  "requestId": "req_..."
}
```

**`404 not_found`** when the exercise ID does not exist.

---

### `GET /v1/programs`

Workout program catalog (templates + session-input defaults). Cacheable.

- `ETag: "programs-{engineVersion}-{locale}-{filters}"`,
  `Cache-Control: private, max-age=3600`.

**Query parameters**

| Param | Required | Values |
| --- | --- | --- |
| `gender` | **yes** | `male` \| `female` |
| `locale` | no (default `en`) | `en` \| `es` \| `pt-BR` \| `fr` |
| `goals` | no | CSV of `get_stronger`, `build_muscle`, `lose_fat`, `improve_general_fitness` |
| `days_per_week` | no | int 1–7 |
| `session_duration_minutes` | no | int 10–180 |
| `available_equipment` | no | CSV of equipment IDs |
| `difficulty_level` | no | `beginner` \| `intermediate` \| `advanced` |
| `focus_body_parts` | no | CSV of body-part IDs |

`gender` is required: the catalog is gender-partitioned, so an unfiltered call
would return the entire index. Omitting it returns `400 bad_request` with
`error.issues[].path = ["gender"]`. List filters accept at most 64 entries.

**`200 OK`**

```json
{
  "version": "string",
  "generated_at": "ISO-8601",
  "programs": [
    {
      "id": "string",
      "name": "string",
      "description": "string",
      "impact_statement": "string | null",
      "goals": ["build_muscle", "get_stronger"],
      "program_template_id": "string",
      "template": {
        "split_type": "full_body | upper_lower | push_pull_legs | muscle_group_split | hybrid_athletic | movement_pattern",
        "days_per_week": { "min": 3, "max": 5 },
        "session_duration_minutes": { "min": 30, "max": 75 },
        "suitable_experience_levels": ["beginner", "intermediate"],
        "required_equipment": ["dumbbell", "barbell"],
        "default_blocks": [{ "id": "string", "name": "string", "description": "string" }],
        "default_set_types": [{ "id": "string", "name": "string", "description": "string" }]
      },
      "session_input_defaults": {
        "days_per_week": 4,
        "session_duration_minutes": 60,
        "recommended_experience_level": "intermediate",
        "recommended_equipment": ["dumbbell"]
      }
    }
  ],
  "lookups": { "...": "label lookups for IDs" },
  "requestId": "req_..."
}
```

---

### `GET /v1/options`

Localized bundle of selectable options (goals, equipment, muscles, injuries,
etc.) for building UI. Cacheable.

**Query parameters**

| Param | Type | Default | Allowed |
| ----- | ---- | ------- | ------- |
| `locale` | string | `en` | `en`, `es`, `pt-BR`, `fr` |

- `ETag: "options-{engineVersion}-{locale}"`, `Cache-Control: private, max-age=3600`.

**`200 OK`** — each field is an array of `{ value, label }` (muscles also include
`simple_label`):

```json
{
  "biologicalSexes": [{ "value": "male", "label": "Male" }],
  "blockTypes": [{ "value": "warm_up", "label": "Warm Up" }],
  "bodyParts": [{ "value": "chest", "label": "Chest" }],
  "conditions": [{ "value": "lower_back", "label": "Lower Back" }],
  "equipment": [{ "value": "dumbbell", "label": "Dumbbell" }],
  "excludableBlocks": [{ "value": "cardio", "label": "Cardio" }],
  "experienceLevels": [{ "value": "beginner", "label": "Beginner" }],
  "goals": [{ "value": "build_muscle", "label": "Build Muscle" }],
  "injuries": [{ "value": "knee", "label": "Knee" }],
  "movementPatterns": [{ "value": "squat", "label": "Squat" }],
  "muscles": [{ "value": "biceps", "label": "Biceps Brachii", "simple_label": "Biceps" }],
  "setTypes": [{ "value": "straight_sets", "label": "Straight Sets" }],
  "requestId": "req_..."
}
```

**`400 bad_request`** for an unsupported `locale`.

---

### `GET /v1/engine/version`

Returns the API version and the underlying Fit3xGen engine version. Use the
engine version to invalidate caches of `/exercises`, `/programs`, `/options`.

**`200 OK`**

```json
{
  "apiVersion": "v1",
  "engineVersion": "string",
  "requestId": "req_..."
}
```

---

### `POST /v1/sessions/generate` — primary endpoint

Generates one or more workout sessions via Fit3xGen, given the user's profile,
goals, constraints, preferences, readiness, and (optionally) prior-session
history and program context.

This is a large, rich contract. The summary below covers the top-level shape and
the required fields; the **authoritative source is the Zod `SessionInputSchema`
/ output schema in `src/types/workout-engine.ts`**.

#### Request body (`application/json`)

Top-level shape:

```json
{
  "version": "string",
  "generation_request": { "...": "what to generate" },
  "customer_profile": { "...": "who it's for (required)" },
  "previous_sessions": [ { "...": "optional history" } ],
  "program_context": { "...": "optional periodization context" }
}
```

**`generation_request`**

| Field | Type | Required |
| ----- | ---- | -------- |
| `scope` | `single_session` \| `week_sessions` \| `month_sessions` \| `program_sessions` | yes |
| `locale` | `en` \| `es` \| `pt-BR` \| `fr` | no |
| `session_count` | integer \| null | no |
| `replace_existing_future_sessions` | boolean | no |
| `seed` | integer \| null | no — set for deterministic output |
| `id_only` | boolean | no — return references instead of full sessions |

**`customer_profile`** (required) — key sub-objects:

- `user_id` (string, required)
- `demographics`: `age` (number, required), `biological_sex` (`male`\|`female`,
  required), optional `height_cm`, `weight_kg`, `body_fat_percentage`.
- `training_background`: `experience_level`
  (`beginner`\|`novice`\|`intermediate`\|`advanced`\|`elite`, required),
  optional `training_age_years`, `estimated_1rms`, per-pattern
  `movement_competency`.
- `goals`: `goals[]` (at least one of the goal enum — e.g. `build_muscle`,
  `get_stronger`, `lose_fat`, `improve_mobility`, …), optional
  `target_muscle_groups[]`.
- `constraints`: `available_days_per_week` (number, required),
  `session_duration_max_minutes` (number, required), `available_equipment[]`
  (equipment enum, required), optional `injuries[]`
  (`{ condition, severity, notes? }`).
- `preferences` (optional): liked/disliked/excluded exercises,
  `preferred_set_schemes[]`, `avoid_movement_patterns[]`, `required_body_parts[]`,
  `required_muscles[]`, `excluded_blocks[]`, `include_cross_gender_exercises`.
- `readiness` (optional): `sleep_hours`, `sleep_quality`, `energy_level`,
  `soreness_level`, `stress_level`, `resting_heart_rate_bpm`.
- `strength_level` (optional), `rest_reduction` (optional: `0`|`10`|`25`|`50`|`75`).

**`previous_sessions[]`** (optional) — prior session history used to adapt
output: each entry has `session_id`, `date`, optional `training_day_type`,
`session_rpe_actual`, `completion_rate`, `exercises_performed[]` (with per-set
prescribed vs. actual reps/load/RPE), and `session_feedback`.

**`program_context`** (optional) — periodization: `program_id`,
`mesocycle_phase`, `mesocycle_week`, `periodization_model`, `split_type`,
`training_day_slot`, `volume_landmarks`, `current_weekly_volume`.

Minimal example:

```json
{
  "version": "1.0",
  "generation_request": { "scope": "single_session" },
  "customer_profile": {
    "user_id": "user-uuid",
    "demographics": { "age": 30, "biological_sex": "male" },
    "training_background": { "experience_level": "intermediate" },
    "goals": { "goals": ["build_muscle"] },
    "constraints": {
      "available_days_per_week": 4,
      "session_duration_max_minutes": 60,
      "available_equipment": ["dumbbell", "barbell", "body_weight"]
    }
  }
}
```

#### Success response — `200 OK`

```json
{
  "version": "string",
  "workout_program": {
    "mode": "existing_reference | full",
    "id": "string",
    "program_instance": { "...": "program + nested sessions/blocks/sets/exercises" }
  },
  "exercises_pool": { "<exercise_id>": { "exercise_id": "string", "name": "string", "...": "" } },
  "workout_sessions": [ { "...": "session objects" } ],
  "generation_scope": "string",
  "generation_metadata": {
    "engine_version": "string",
    "input_contract_version": "string",
    "generated_at": "ISO-8601"
  },
  "requestId": "req_..."
}
```

Each **session** contains ordered **blocks** (warm-up, strength, conditioning,
cool-down, …), each block contains **sets** (with set type, reps/rep-range,
load, RPE/RIR targets, rest, tempo), and each set contains **exercises**
(referencing `exercises_pool` by `exercise_id`, with coaching cues and
substitution options). Sessions, blocks, sets, and exercises all carry optional
`*_tracking` / `*_actuals` fields for logging completed workouts back.

> The complete nested response schema is large; generate your client types from
> the Zod output schema in `src/types/workout-engine.ts` rather than transcribing
> it by hand.

#### Errors

| HTTP | code | Meaning |
| ---- | ---- | ------- |
| 400 | `bad_request` | Body is not valid JSON, or fails `SessionInputSchema` validation (see `issues`) |
| 401 | `unauthorized` | Auth failure |
| 422 | `unprocessable_entity` | Valid input the engine could not satisfy (e.g. constraints too tight) |
| 500 | `internal_error` | Unexpected engine response / contract violation |

Example call:

```bash
curl -X POST "$BASE_URL/v1/sessions/generate" \
  -H "Authorization: Bearer $SUPABASE_JWT" \
  -H "Content-Type: application/json" \
  -d @session-input.json
```

---

## Integration checklist

1. Obtain a Supabase JWT for the end user and send it as `Authorization: Bearer`
   on every call except `/v1/health`.
2. Always set `Content-Type: application/json` for `POST` bodies.
3. Cache `GET /exercises`, `/exercises/:id`, `/programs`, `/options` using the
   returned `ETag`; revalidate with `If-None-Match`. Bust caches when
   `GET /v1/engine/version` reports a new `engineVersion`.
4. Build your request/response types from the Zod schemas in
   `src/types/workout-engine.ts` — they are the authoritative contract.
5. Surface and log the `requestId` from every response (and the
   `X-Request-Id` header) for support and debugging.
6. Handle the documented error codes; never depend on `error.message` wording —
   branch on `error.code` and HTTP status.
