import { z } from 'zod'

// Schemas mirror @fit3x/workout-engine v1.3.0 — input/output contract v3.0.0
// (json_contracts/json-input-output/{input,output}_contract.json in Fit3xGen).
// Input schemas are the API's own contract with its clients; output schemas
// assert what the engine hands back before any of it reaches a client.

export const SupportedLocaleSchema = z.enum(['en', 'es', 'pt-BR', 'fr'])
export type SupportedLocale = z.infer<typeof SupportedLocaleSchema>

export const LocaleQuerySchema = z.object({
  locale: SupportedLocaleSchema.default('en'),
})
export type LocaleQuery = z.infer<typeof LocaleQuerySchema>

// ─── Shared v3 vocabularies ──────────────────────────────────────────────────

export const GenerationScopeSchema = z.enum([
  'single_session',
  'week_sessions',
  'month_sessions',
  'program_sessions',
])
export type GenerationScope = z.infer<typeof GenerationScopeSchema>

/** v3 collapsed the 16-goal v2 vocabulary to the 4 the template catalog covers. */
export const UserGoalSchema = z.enum([
  'get_stronger',
  'build_muscle',
  'lose_fat',
  'improve_general_fitness',
])

export const BiologicalSexSchema = z.enum(['male', 'female'])

export const ExperienceLevelSchema = z.enum([
  'beginner',
  'novice',
  'intermediate',
  'advanced',
  'elite',
])

/** Same vocabulary as a session's target_intensity. */
export const DesiredIntensitySchema = z.enum([
  'light',
  'moderate',
  'hard',
  'very_hard',
])

export const StrengthLevelSchema = z.enum([
  'very_weak',
  'weak',
  'slightly_weak',
  'average',
  'slightly_strong',
  'strong',
  'very_strong',
])

export const RestReductionSchema = z.union([
  z.literal(0),
  z.literal(10),
  z.literal(25),
  z.literal(50),
  z.literal(75),
])

/** 25 items — v3 added `bench`. */
export const EquipmentItemSchema = z.enum([
  'band',
  'barbell',
  'battling_rope',
  'bench',
  'body_weight',
  'bosu_ball',
  'cable',
  'dumbbell',
  'ez_barbell',
  'kettlebell',
  'leverage_machine',
  'medicine_ball',
  'olympic_barbell',
  'power_sled',
  'resistance_band',
  'roll',
  'rope',
  'sled_machine',
  'smith_machine',
  'stability_ball',
  'stick',
  'suspension',
  'trap_bar',
  'weighted',
  'wheel_roller',
])

export const MovementPatternIdSchema = z.enum([
  'adduction',
  'calf_raise_or_ankle_work',
  'carry',
  'core_flexion_or_extension',
  'core_lateral_flexion',
  'hinge',
  'horizontal_pull',
  'horizontal_push',
  'jump_and_plyometric',
  'lunge',
  'rotation',
  'sprint',
  'squat',
  'throw_or_slam',
  'vertical_pull',
  'vertical_push',
])

/** The 10-value body-part vocabulary — v3's `constraints.body_parts`. This
 *  replaced v2's `target_muscle_groups` / `required_body_parts`. */
export const BodyPartIdSchema = z.enum([
  'abs',
  'back',
  'biceps',
  'cardio',
  'chest',
  'forearms',
  'legs',
  'plyometrics',
  'shoulders',
  'triceps',
])

export const InjuryConditionSchema = z.enum([
  'lower_back',
  'knee',
  'shoulder_impingement',
  'rotator_cuff',
  'elbow_tendonitis',
  'wrist_or_carpal',
  'cervical_spine',
  'hernia_or_abdominal',
  'hip_labral',
  'ankle_sprain_or_instability',
  'achilles_tendonitis',
  'plantar_fasciitis',
  'acl_or_mcl',
  'osteoporosis_or_low_bmd',
  'pregnancy',
  'hypertension',
])

export const InjurySeveritySchema = z.enum(['mild', 'moderate', 'severe'])

export const AgeBandSchema = z.enum([
  '13_15',
  '16_17',
  '18_24',
  '25_30',
  '31_39',
  '40_49',
  '50_59',
  '60_69',
])

export const BodyMassProfileSchema = z.enum([
  'light_frame',
  'standard_frame',
  'high_body_mass',
  'very_high_body_mass',
])

export const SetTypeSchema = z.enum([
  'straight_sets',
  'pyramid_set',
  'reverse_pyramid',
  'drop_set',
  'rest_pause',
  'superset',
  'bi_set',
  'tri_set',
  'giant_set',
  'circuit',
  'cluster_set',
  'tempo_set',
  'amrap',
  'emom',
])

export const SetRoleSchema = z.enum([
  'working',
  'warm_up',
  'feeder',
  'back_off',
  'drop',
  'failure',
])

export const ExerciseRoleSchema = z.enum([
  'primary',
  'secondary',
  'accessory',
  'prehab',
  'warm_up',
  'cool_down',
  'conditioning',
])

export const SideSchema = z.enum(['left', 'right'])

export const SessionStatusSchema = z.enum([
  'draft',
  'scheduled',
  'available',
  'in_progress',
  'completed',
  'skipped',
  'cancelled',
])

export const TrainingDayTypeSchema = z.enum([
  'resistance',
  'conditioning',
  'hybrid',
  'active_recovery',
])

export const TemplateDifficultySchema = z.enum([
  'beginner',
  'intermediate',
  'advanced',
])

export const EngineVersionResponseSchema = z.object({
  apiVersion: z.string(),
  engineVersion: z.string(),
  requestId: z.string(),
})
export type EngineVersionResponse = z.infer<typeof EngineVersionResponseSchema>

// ─── Options bundle ──────────────────────────────────────────────────────────

const InputOptionSchema = z.object({
  value: z.string(),
  label: z.string(),
})

const MuscleOptionSchema = z.object({
  value: z.string(),
  label: z.string(),
  simple_label: z.string(),
})

/** v1.3.0 dropped getBlockTypeOptions / getExcludableBlockOptions (v3 has no
 *  session blocks) and added getIntensityOptions. */
export const OptionsBundleResponseSchema = z.object({
  biologicalSexes: z.array(InputOptionSchema),
  bodyParts: z.array(InputOptionSchema),
  conditions: z.array(InputOptionSchema),
  equipment: z.array(InputOptionSchema),
  experienceLevels: z.array(InputOptionSchema),
  goals: z.array(InputOptionSchema),
  injuries: z.array(InputOptionSchema),
  intensities: z.array(InputOptionSchema),
  movementPatterns: z.array(InputOptionSchema),
  muscles: z.array(MuscleOptionSchema),
  setTypes: z.array(InputOptionSchema),
  requestId: z.string(),
})
export type OptionsBundleResponse = z.infer<typeof OptionsBundleResponseSchema>

// ─── Programs catalog (getPrograms) ──────────────────────────────────────────

export const ProgramListEntrySchema = z.object({
  id: z.string(),
  program_template_id: z.string(),
  gender: BiologicalSexSchema,
  name: z.string(),
  description: z.string(),
  goals: z.array(UserGoalSchema),
  difficulty_level: TemplateDifficultySchema,
  min_days_per_week: z.number().int(),
  max_days_per_week: z.number().int(),
  min_session_duration_minutes: z.number().int(),
  max_session_duration_minutes: z.number().int(),
  required_equipment: z.array(EquipmentItemSchema),
  focus_body_parts: z.array(BodyPartIdSchema),
  duration_weeks: z.number().int(),
  days_per_week: z.number().int(),
})
export type ProgramListEntryDTO = z.infer<typeof ProgramListEntrySchema>

export const WorkoutProgramsResponseSchema = z.object({
  version: z.string(),
  count: z.number().int(),
  programs: z.array(ProgramListEntrySchema),
  requestId: z.string(),
})
export type WorkoutProgramsResponse = z.infer<
  typeof WorkoutProgramsResponseSchema
>

/**
 * Repeatable comma-or-multi query params, e.g. ?goals=build_muscle,lose_fat
 *
 * Bounded on purpose: these values are echoed into the ETag, so an unbounded
 * list would let a client force an oversized response header. No real filter
 * needs more entries than its vocabulary has members.
 */
const MAX_FILTER_ITEMS = 64

const csvOf = <T extends z.ZodType<unknown, string>>(inner: T) =>
  z
    .union([z.string(), z.array(z.string()).max(MAX_FILTER_ITEMS)])
    .transform((v) => (Array.isArray(v) ? v : v.split(',')))
    .transform((v) => v.map((s) => s.trim()).filter((s) => s.length > 0))
    .pipe(z.array(inner).max(MAX_FILTER_ITEMS))

const intQuery = (min: number, max: number) =>
  z.coerce.number().int().min(min).max(max)

export const ProgramsQuerySchema = z.object({
  locale: SupportedLocaleSchema.default('en'),
  /** Required: the catalog is gender-partitioned, and returning both halves
   *  ships the whole 240-entry index when a client can only use half of it. */
  gender: BiologicalSexSchema,
  goals: csvOf(UserGoalSchema).optional(),
  days_per_week: intQuery(1, 7).optional(),
  session_duration_minutes: intQuery(10, 180).optional(),
  available_equipment: csvOf(EquipmentItemSchema).optional(),
  difficulty_level: TemplateDifficultySchema.optional(),
  focus_body_parts: csvOf(BodyPartIdSchema).optional(),
})
export type ProgramsQuery = z.infer<typeof ProgramsQuerySchema>

// ─── Sessions catalog (getSessions / getSessionCoverage) ─────────────────────

export const SessionListEntrySchema = z.object({
  id: z.string(),
  session_template_id: z.string(),
  gender: BiologicalSexSchema,
  name: z.string(),
  duration_minutes: z.number(),
  total_working_rounds: z.number().int(),
  focus_muscles: z.array(z.string()),
  focus_body_parts: z.array(BodyPartIdSchema),
  focus_patterns: z.array(MovementPatternIdSchema),
  required_equipment: z.array(EquipmentItemSchema),
  set_types: z.array(SetTypeSchema),
  total_sets: z.number().int(),
  total_unique_exercises: z.number().int(),
})
export type SessionListEntryDTO = z.infer<typeof SessionListEntrySchema>

export const SessionCatalogResponseSchema = z.object({
  version: z.string(),
  count: z.number().int(),
  sessions: z.array(SessionListEntrySchema),
  requestId: z.string(),
})
export type SessionCatalogResponse = z.infer<
  typeof SessionCatalogResponseSchema
>

export const SessionsQuerySchema = z.object({
  locale: SupportedLocaleSchema.default('en'),
  gender: BiologicalSexSchema.optional(),
  focus_body_parts: csvOf(BodyPartIdSchema).optional(),
  focus_body_parts_match: z.enum(['subset', 'contains']).optional(),
  // Free-form (muscle ids are data, not a closed enum) — length-capped so it
  // cannot be used to inflate the ETag.
  focus_muscles: csvOf(z.string().max(64)).optional(),
  focus_patterns: csvOf(MovementPatternIdSchema).optional(),
  available_equipment: csvOf(EquipmentItemSchema).optional(),
  session_duration_minutes: intQuery(10, 180).optional(),
  set_types: csvOf(SetTypeSchema).optional(),
  min_total_sets: z.coerce.number().int().min(0).optional(),
  max_total_sets: z.coerce.number().int().min(0).optional(),
})
export type SessionsQuery = z.infer<typeof SessionsQuerySchema>

const SessionCoverageCountsSchema = z.object({
  eligible: z.number().int(),
  full: z.number().int(),
})

export const SessionCoverageResponseSchema = z.object({
  version: z.string(),
  max_combination_size: z.number().int(),
  by_gender: z.record(
    BiologicalSexSchema,
    z.record(z.string(), SessionCoverageCountsSchema),
  ),
  requestId: z.string(),
})
export type SessionCoverageResponse = z.infer<
  typeof SessionCoverageResponseSchema
>

// ─── Generation input (contract v3.0.0) ──────────────────────────────────────

const GenerationRequestSchema = z
  .object({
    scope: GenerationScopeSchema,
    locale: SupportedLocaleSchema.optional(),
    /** The contract sets only a lower bound, but session_count drives how many
     *  sessions are materialized — an unbounded value is a self-inflicted
     *  memory/response-size problem, so cap it at a year of daily training. */
    session_count: z.number().int().min(1).max(366).nullable().optional(),
    seed: z.number().int().min(0).nullable().optional(),
    id_only: z.boolean().optional(),
    previous_session_refs: z
      .array(z.string())
      .max(50)
      .nullable()
      .optional(),
    /** Caller-pinned program: a getPrograms() `programs[].id`, NOT a
     *  program_template_id. Rejected on single_session. */
    program_id: z.string().min(1).nullable().optional(),
  })
  .strict()

const DemographicsSchema = z.object({
  age: z.number().int().min(13).max(60),
  biological_sex: BiologicalSexSchema,
  height_cm: z.number().min(100).max(250).nullable().optional(),
  weight_kg: z.number().min(30).max(250).nullable().optional(),
})

const DerivedProfileSchema = z.object({
  age_band: AgeBandSchema.nullable().optional(),
  body_mass_profile: BodyMassProfileSchema.nullable().optional(),
})

const TrainingBackgroundSchema = z.object({
  experience_level: ExperienceLevelSchema,
  estimated_1rms: z.record(z.string(), z.number().min(0)).optional(),
})

/** The contract marks goals / available_equipment / body_parts
 *  `uniqueItems: true`, and the engine's ajv enforces it. Checking it here
 *  keeps a duplicate a 400 with a path rather than an opaque 422. */
const uniqueItems = <T extends z.ZodType<unknown[], unknown>>(
  schema: T,
  label: string,
) =>
  schema.refine(
    (items) => new Set(items as unknown[]).size === (items as unknown[]).length,
    { message: `${label} must not contain duplicate values` },
  )

const GoalsSchema = z.object({
  goals: uniqueItems(z.array(UserGoalSchema).min(1), 'goals'),
})

const InjurySchema = z.object({
  condition: InjuryConditionSchema,
  severity: InjurySeveritySchema,
})

const ConstraintsSchema = z.object({
  available_days_per_week: z.number().int().min(1).max(7),
  /** v2's session_duration_max_minutes, renamed. */
  session_duration_minutes: z.number().int().min(10).max(180),
  available_equipment: uniqueItems(
    z.array(EquipmentItemSchema).min(1),
    'available_equipment',
  ),
  body_parts: uniqueItems(
    z.array(BodyPartIdSchema).min(1),
    'body_parts',
  ).optional(),
  injuries: z.array(InjurySchema).optional(),
})

const PreferencesSchema = z
  .object({
    disliked_exercises: z.array(z.string()).optional(),
    excluded_exercises: z.array(z.string()).optional(),
    avoid_movement_patterns: z.array(MovementPatternIdSchema).optional(),
    include_cross_gender_exercises: z.boolean().optional(),
  })
  .strict()

const CustomerProfileSchema = z.object({
  user_id: z.string(),
  demographics: DemographicsSchema,
  derived_profile: DerivedProfileSchema.optional(),
  training_background: TrainingBackgroundSchema,
  goals: GoalsSchema,
  constraints: ConstraintsSchema,
  preferences: PreferencesSchema.optional(),
  desired_intensity: DesiredIntensitySchema.nullable().optional(),
  strength_level: StrengthLevelSchema.nullable().optional(),
  rest_reduction: RestReductionSchema.nullable().optional(),
})

/** Fields v2 clients still send that v3 removed. The engine rejects each with
 *  a hard error; naming them here turns that 422 into an actionable 400. */
const REMOVED_V2_FIELDS: readonly {
  readonly path: readonly string[]
  readonly hint: string
}[] = [
  {
    path: ['previous_sessions'],
    hint: 'removed in contract v3 — use generation_request.previous_session_refs',
  },
  {
    path: ['program_context'],
    hint: 'removed in contract v3 — the engine derives everything from the profile',
  },
  {
    path: ['generation_request', 'session_focus'],
    hint: 'removed in contract v3 — muscle-focused mode no longer exists',
  },
  {
    path: ['customer_profile', 'readiness'],
    hint: 'removed in contract v3 — use customer_profile.desired_intensity',
  },
  {
    path: ['customer_profile', 'constraints', 'session_duration_max_minutes'],
    hint: 'renamed in contract v3 to constraints.session_duration_minutes',
  },
  {
    path: ['customer_profile', 'goals', 'target_muscle_groups'],
    hint: 'removed in contract v3 — use constraints.body_parts',
  },
  {
    path: ['customer_profile', 'preferences', 'excluded_blocks'],
    hint: 'removed in contract v3 — session blocks no longer exist',
  },
  {
    path: ['customer_profile', 'preferences', 'liked_exercises'],
    hint: 'removed in contract v3 — only disliked/excluded influence replacement',
  },
  {
    path: ['customer_profile', 'preferences', 'preferred_set_schemes'],
    hint: 'removed in contract v3 — set schemes are authored into templates',
  },
  {
    path: ['customer_profile', 'preferences', 'required_muscles'],
    hint: 'removed in contract v3 — use constraints.body_parts',
  },
  {
    path: ['customer_profile', 'preferences', 'required_body_parts'],
    hint: 'removed in contract v3 — use constraints.body_parts',
  },
  {
    path: ['customer_profile', 'preferences', 'target_body_parts'],
    hint: 'removed in contract v3 — use constraints.body_parts',
  },
]

const readPath = (value: unknown, path: readonly string[]): unknown => {
  let cursor: unknown = value
  for (const key of path) {
    if (cursor === null || typeof cursor !== 'object') return undefined
    cursor = (cursor as Record<string, unknown>)[key]
  }
  return cursor
}

export const SessionInputSchema = z
  .object({
    version: z.string(),
    generation_request: GenerationRequestSchema,
    customer_profile: CustomerProfileSchema,
  })
  // input_contract.json sets additionalProperties:false at the root; without
  // this a misplaced key (e.g. constraints at the top level) is silently
  // dropped and the caller never learns their payload was ignored.
  .strict()
  .superRefine((input, ctx) => {
    const { scope, program_id } = input.generation_request

    // The engine rejects both of these outright; catching them here keeps the
    // failure a client error with a usable path instead of an opaque 422.
    if (scope === 'single_session' && program_id != null) {
      ctx.addIssue({
        code: 'custom',
        path: ['generation_request', 'program_id'],
        message:
          'program_id is not valid with scope "single_session" — use "week_sessions" with session_count 1 to generate from a specific program',
      })
    }

    if (scope === 'single_session' && input.customer_profile.constraints.body_parts == null) {
      ctx.addIssue({
        code: 'custom',
        path: ['customer_profile', 'constraints', 'body_parts'],
        message:
          'body_parts is required when scope is "single_session" — see /v1/sessions/coverage for combinations with coverage',
      })
    }
  })
export type SessionInputBody = z.infer<typeof SessionInputSchema>

/** Runs before SessionInputSchema so stale v2 payloads get a precise message
 *  rather than a pile of "unrecognized key" issues. */
export const findRemovedV2Fields = (
  body: unknown,
): readonly { readonly path: readonly string[]; readonly message: string }[] =>
  REMOVED_V2_FIELDS.filter(
    (field) => readPath(body, field.path) !== undefined,
  ).map((field) => ({
    path: field.path,
    message: `${field.path.join('.')} ${field.hint}`,
  }))

// ─── Generation output (contract v3.0.0) ─────────────────────────────────────

// The engine types these as `string | undefined`, but earlier builds emitted
// explicit nulls here. Accepting null costs nothing and avoids turning a
// cosmetic field into a 500 on the whole response.
const SubstitutionOptionSchema = z.object({
  exercise_id: z.string(),
  name: z.string().nullable().optional(),
  reason: z.string().nullable().optional(),
})

const ExerciseRefSchema = z.object({
  exercise_id: z.string(),
})

const RepsRangeSchema = z.object({
  min: z.number(),
  max: z.number(),
})

const PrescribedExerciseSchema = z.object({
  id: z.string(),
  role: ExerciseRoleSchema.nullable().optional(),
  order_index: z.number().nullable().optional(),
  side: SideSchema.nullable().optional(),
  exercise_ref: ExerciseRefSchema,
  reps: z.number().nullable().optional(),
  reps_range: RepsRangeSchema.nullable().optional(),
  duration_seconds: z.number().nullable().optional(),
  distance: z.number().nullable().optional(),
  distance_unit: z.string().nullable().optional(),
  weight: z.number().nullable().optional(),
  load_percentage_1rm: z.number().nullable().optional(),
  rpe_target: z.number().nullable().optional(),
  rir_target: z.number().nullable().optional(),
  tempo: z.string().nullable().optional(),
  tempo_eccentric_seconds: z.number().nullable().optional(),
  tempo_concentric_seconds: z.number().nullable().optional(),
  rest_seconds: z.number().nullable().optional(),
  rest_pause_seconds: z.number().nullable().optional(),
  coaching_cues: z.array(z.string()).nullable().optional(),
  substitution_options: z.array(SubstitutionOptionSchema).nullable().optional(),
})

/** v3 dropped `block_type`: sets are flat and ordered by set_number, with
 *  set_role as the only phase signal. */
const PrescribedSetSchema = z.object({
  id: z.string(),
  set_number: z.number(),
  set_type: SetTypeSchema,
  rounds: z.number(),
  set_role: SetRoleSchema.nullable().optional(),
  rest_seconds: z.number().nullable().optional(),
  exercises: z.array(PrescribedExerciseSchema),
  is_completed: z.boolean(),
  created_at: z.string(),
  updated_at: z.string(),
})

const SessionGenerationMetadataSchema = z.object({
  engine_version: z.string().nullable().optional(),
  input_contract_version: z.string().nullable().optional(),
  generated_at: z.string().nullable().optional(),
  template_session_ref: z.string().nullable().optional(),
})

const WorkoutSessionSchema = z.object({
  id: z.string(),
  name: z.string(),
  session_number: z.number(),
  week_number: z.number(),
  mesocycle_index: z.number().nullable().optional(),
  mesocycle_week: z.number().nullable().optional(),
  order_index: z.number(),
  duration_minutes: z.number(),
  level: ExperienceLevelSchema,
  total_sets: z.number(),
  total_unique_exercises: z.number(),
  status: SessionStatusSchema,
  training_day_type: TrainingDayTypeSchema.nullable().optional(),
  focus_muscles: z.array(z.string()),
  focus_patterns: z.array(z.string()),
  target_intensity: DesiredIntensitySchema.nullable().optional(),
  session_rpe_target: z.number().nullable().optional(),
  coach_notes: z.string().nullable().optional(),
  sets: z.array(PrescribedSetSchema),
  generation_metadata: SessionGenerationMetadataSchema.optional(),
  created_at: z.string(),
  updated_at: z.string(),
})

const ExerciseDefinitionSchema = z.object({
  exercise_id: z.string(),
  name: z.string(),
  type: z.string(),
  primary_muscle_id: z.string().nullable().optional(),
  secondary_muscle_ids: z.array(z.string()).optional(),
  equipment_ids: z.array(z.string()).optional(),
  body_part_ids: z.array(z.string()).optional(),
  movement_pattern_ids: z.array(z.string()).optional(),
  lateralization_id: z.string().nullable().optional(),
  default_coaching_cues: z.array(z.string()).optional(),
  substitution_options: z.array(SubstitutionOptionSchema).optional(),
})

const ProgramInstanceStatusSchema = z.enum([
  'draft',
  'active',
  'paused',
  'completed',
  'archived',
  'cancelled',
])

const WorkoutProgramInstanceSchema = z.object({
  id: z.string(),
  catalog_program_id: z.string(),
  program_template_id: z.string(),
  personal_id: z.string(),
  name: z.string().nullable().optional(),
  goals: z.array(UserGoalSchema).optional(),
  difficulty_level: ExperienceLevelSchema.nullable().optional(),
  days_per_week: z.number().nullable().optional(),
  duration_weeks: z.number().nullable().optional(),
  session_duration_minutes: z.number().nullable().optional(),
  available_equipment: z.array(EquipmentItemSchema).optional(),
  status: ProgramInstanceStatusSchema,
  is_active: z.boolean(),
  created_at: z.string(),
  updated_at: z.string(),
})

const SelectedProgramMetaSchema = z.object({
  id: z.string(),
  program_template_id: z.string(),
  name: z.string(),
  gender: BiologicalSexSchema,
  /** Null when `selected` is "pinned" — no score was computed. */
  score: z.number().nullable(),
  rank: z.number().int().nullable(),
  selected: z.enum(['scored', 'pinned']).optional(),
  source: z.enum(['program_catalog', 'session_catalog']).optional(),
})

const SelectionFallbackSchema = z.object({
  step: z.enum([
    'relaxed_duration',
    'relaxed_days',
    'relaxed_equipment',
    'relaxed_goals',
    'cross_gender',
    'program_retry',
    'session_retry',
    'partial_body_parts',
  ]),
  detail: z.string().nullable().optional(),
})

const ReplacementRecordSchema = z.object({
  session_ref: z.string(),
  set_number: z.number().nullable().optional(),
  order_index: z.number().nullable().optional(),
  original_exercise_id: z.string(),
  replacement_exercise_id: z.string().nullable(),
  reason: z.enum([
    'equipment',
    'condition',
    'excluded',
    'disliked',
    'gender',
    'skill_level',
  ]),
  method: z.enum(['substitution_ids', 'scored_search', 'dropped']),
  detail: z.string().nullable().optional(),
})

const AdjustmentRecordSchema = z.object({
  session_ref: z.string(),
  variable: z.enum([
    'rest_seconds',
    'reps',
    'rounds',
    'sets',
    'tempo',
    'load',
    'exercise_removed',
    'warm_up',
  ]),
  reason: z.enum([
    'duration_fit',
    'caution',
    'strength_level',
    'rest_reduction',
    'experience_cap',
    'warmup_synthesis',
  ]),
  detail: z.string().nullable().optional(),
})

export const WarningCodeSchema = z.enum([
  'duration_out_of_band',
  'duration_below_target',
  'safety_exclusion',
  'stateless_repetition',
  'missing_weight',
  'unknown_session_ref',
  'below_experience_minimum',
  'cross_gender_program',
  'cross_gender_session',
  'partial_body_part_coverage',
  'pinned_program_mismatch',
  'pinned_program_degraded',
  'normalized_input',
])

const WarningRecordSchema = z.object({
  code: WarningCodeSchema,
  message: z.string(),
})

const GenerationMetadataSchema = z.object({
  engine_version: z.string(),
  input_contract_version: z.string(),
  generated_at: z.string(),
  seed: z.number().nullable(),
  selected_program: SelectedProgramMetaSchema.nullable(),
  selection_fallbacks: z.array(SelectionFallbackSchema),
  replacements: z.array(ReplacementRecordSchema),
  adjustments: z.array(AdjustmentRecordSchema),
  warnings: z.array(WarningRecordSchema),
  estimated_durations: z.record(z.string(), z.number()),
  notes: z.string().nullable().optional(),
})

export const WorkoutGenerationResponseSchema = z.object({
  version: z.string(),
  workout_program: z.object({
    mode: z.literal('full'),
    id: z.string(),
    program_instance: WorkoutProgramInstanceSchema,
  }),
  exercises_pool: z.record(z.string(), ExerciseDefinitionSchema),
  workout_sessions: z.array(WorkoutSessionSchema),
  generation_scope: GenerationScopeSchema,
  generation_metadata: GenerationMetadataSchema,
  requestId: z.string(),
})
export type WorkoutGenerationResponse = z.infer<
  typeof WorkoutGenerationResponseSchema
>

// ─── Exercise catalog ────────────────────────────────────────────────────────

export const ExerciseCatalogEntrySchema = z.object({
  id: z.string(),
  name: z.string(),
  type: z.string(),
  gender: z.string(),
  body_part_ids: z.array(z.string()),
  equipment_ids: z.array(z.string()),
  primary_muscle_id: z.string().nullable(),
  secondary_muscle_ids: z.array(z.string()),
  movement_pattern_ids: z.array(z.string()),
  condition_restriction_ids: z.array(InjuryConditionSchema),
  condition_indication_ids: z.array(z.string()),
  lateralization_ids: z.array(z.string()),
  stability_demand_id: z.string().nullable(),
  coordination_complexity_id: z.string().nullable(),
  impact_level_id: z.string().nullable(),
  rom_id: z.string().nullable(),
  spinal_load_id: z.string().nullable(),
  grip_ids: z.array(z.string()),
  variation_level_id: z.string(),
  exercise_priority_score: z.number().nullable(),
  progression_track_score: z.number().nullable(),
  fatigue_cost_score: z.number().nullable(),
  technical_difficulty_score: z.number().nullable(),
  repeat_cooldown_sessions: z.number(),
  target_repeat_freq_14d: z.number(),
  weekly_volume_tolerance: z.string().nullable(),
  novelty_weight: z.number().nullable(),
  setup_time_score: z.number().nullable(),
  /** Added in v1.3.0 — cold-start load scale vs the pattern baseline. */
  starting_load_factor: z.number(),
  substitution_ids: z.array(z.string()),
  disabled: z.boolean().nullable().optional(),
})
export type ExerciseCatalogEntryDTO = z.infer<typeof ExerciseCatalogEntrySchema>

export const ExercisesListResponseSchema = z.object({
  engineVersion: z.string(),
  exercises: z.array(ExerciseCatalogEntrySchema),
  requestId: z.string(),
})
export type ExercisesListResponse = z.infer<typeof ExercisesListResponseSchema>

export const ExerciseResponseSchema = z.object({
  engineVersion: z.string(),
  exercise: ExerciseCatalogEntrySchema,
  requestId: z.string(),
})
export type ExerciseResponse = z.infer<typeof ExerciseResponseSchema>
