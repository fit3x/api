import { z } from 'zod'

export const SupportedLocaleSchema = z.enum(['en', 'es', 'pt-BR', 'fr'])
export type SupportedLocale = z.infer<typeof SupportedLocaleSchema>

export const LocaleQuerySchema = z.object({
  locale: SupportedLocaleSchema.default('en'),
})
export type LocaleQuery = z.infer<typeof LocaleQuerySchema>

export const ExperienceLevelSchema = z.enum([
  'beginner',
  'novice',
  'intermediate',
  'advanced',
  'elite',
])

export const EquipmentAccessProfileSchema = z.enum([
  'full_gym',
  'home_basic',
  'home_advanced',
  'bodyweight_only',
  'hotel_gym',
  'outdoor',
])

export const SplitTypeSchema = z.enum([
  'full_body',
  'upper_lower',
  'push_pull_legs',
  'muscle_group_split',
  'hybrid_athletic',
  'movement_pattern',
])

export const CanonicalGoalSchema = z.enum([
  'hypertrophy',
  'strength',
  'power',
  'endurance',
  'fat_loss',
  'general_fitness',
  'sport_specific',
  'rehabilitation',
])

export const UserGoalSchema = z.enum([
  'get_stronger',
  'build_muscle',
  'lose_fat',
  'improve_general_fitness',
  'tone_and_recompose',
  'improve_functional_fitness',
  'boost_energy_and_performance',
  'improve_mobility',
  'strengthen_core',
  'build_glutes',
  'improve_conditioning',
  'train_at_home',
  'healthy_aging',
  'improve_balance',
  'low_impact_fitness',
  'support_mental_wellbeing',
])

export const BiologicalSexSchema = z.enum(['male', 'female'])

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

export const MovementCompetencySchema = z.enum([
  'learning',
  'competent',
  'proficient',
  'advanced',
])

export const TargetMuscleGroupSchema = z.enum([
  'chest',
  'back',
  'shoulders',
  'upper_arms',
  'forearms',
  'waist',
  'hips',
  'thighs',
  'calves',
  'neck',
])

export const EquipmentItemSchema = z.enum([
  'band',
  'barbell',
  'battling_rope',
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

export const SetSchemePreferenceSchema = z.enum([
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

export const ExcludableBlockTypeSchema = z.enum([
  'warm_up',
  'activation',
  'cardio',
  'conditioning',
  'core',
  'mobility',
  'skill',
  'recovery',
  'cool_down',
])

export const SleepQualitySchema = z.enum(['poor', 'fair', 'good', 'excellent'])

export const TrainingDayTypeSchema = z.enum([
  'resistance',
  'conditioning',
  'hybrid',
  'active_recovery',
])

export const SetRoleSchema = z.enum([
  'working',
  'warm_up',
  'feeder',
  'back_off',
  'drop',
  'failure',
])

export const ExerciseRoleInSessionSchema = z.enum([
  'primary',
  'secondary',
  'accessory',
  'prehab',
  'warm_up',
  'cool_down',
])

export const OverallDifficultySchema = z.enum([
  'too_easy',
  'easy',
  'just_right',
  'hard',
  'too_hard',
])

export const EnergyPostSessionSchema = z.enum([
  'depleted',
  'tired',
  'moderate',
  'energized',
])

export const PumpQualitySchema = z.enum(['none', 'mild', 'good', 'great'])

export const MesocyclePhaseSchema = z.enum([
  'accumulation',
  'intensification',
  'realization',
  'deload',
  'transition',
])

export const PeriodizationModelSchema = z.enum([
  'linear',
  'undulating_daily',
  'undulating_weekly',
  'block',
  'conjugate',
  'hybrid',
])

export const DayOfWeekSchema = z.enum([
  'mon',
  'tue',
  'wed',
  'thu',
  'fri',
  'sat',
  'sun',
])

export const SlotTypeSchema = z.enum([
  'resistance',
  'conditioning',
  'hybrid',
  'active_recovery',
  'rest',
])

export const GenerationScopeSchema = z.enum([
  'single_session',
  'week_sessions',
  'month_sessions',
  'program_sessions',
])

export const EngineVersionResponseSchema = z.object({
  apiVersion: z.string(),
  engineVersion: z.string(),
  requestId: z.string(),
})
export type EngineVersionResponse = z.infer<typeof EngineVersionResponseSchema>

const InputOptionSchema = z.object({
  value: z.string(),
  label: z.string(),
})

const MuscleOptionSchema = z.object({
  value: z.string(),
  label: z.string(),
  simple_label: z.string(),
})

export const OptionsBundleResponseSchema = z.object({
  biologicalSexes: z.array(InputOptionSchema),
  blockTypes: z.array(InputOptionSchema),
  bodyParts: z.array(InputOptionSchema),
  canonicalGoals: z.array(InputOptionSchema),
  conditions: z.array(InputOptionSchema),
  equipment: z.array(InputOptionSchema),
  equipmentAccess: z.array(InputOptionSchema),
  excludableBlocks: z.array(InputOptionSchema),
  experienceLevels: z.array(InputOptionSchema),
  goals: z.array(InputOptionSchema),
  injuries: z.array(InputOptionSchema),
  movementPatterns: z.array(InputOptionSchema),
  muscles: z.array(MuscleOptionSchema),
  setTypes: z.array(InputOptionSchema),
  requestId: z.string(),
})
export type OptionsBundleResponse = z.infer<typeof OptionsBundleResponseSchema>

const BlockRefSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string(),
})

const SetTypeRefSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string(),
})

const IntegerRangeSchema = z.object({
  min: z.number().int(),
  max: z.number().int(),
})

const TemplateInfoSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string(),
  split_type: SplitTypeSchema,
  days_per_week: IntegerRangeSchema,
  session_duration_minutes: IntegerRangeSchema,
  suitable_experience_levels: z.array(ExperienceLevelSchema),
  canonical_goal_ids: z.array(CanonicalGoalSchema),
  default_blocks: z.array(BlockRefSchema),
  default_set_types: z.array(SetTypeRefSchema),
  equipment_access_ids: z.array(EquipmentAccessProfileSchema),
})

const SessionInputDefaultsSchema = z.object({
  days_per_week: z.number().int(),
  session_duration_minutes: z.number().int(),
  recommended_experience_level: ExperienceLevelSchema,
  recommended_equipment_access: EquipmentAccessProfileSchema,
})

const WorkoutProgramEntrySchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string(),
  impact_statement: z.string().nullable(),
  goals: z.array(UserGoalSchema),
  canonical_goals: z.array(CanonicalGoalSchema),
  program_template_id: z.string(),
  template: TemplateInfoSchema,
  session_input_defaults: SessionInputDefaultsSchema,
})

export const WorkoutProgramsResponseSchema = z.object({
  version: z.string(),
  generated_at: z.string(),
  programs: z.array(WorkoutProgramEntrySchema),
  lookups: z.record(z.string(), z.unknown()),
  requestId: z.string(),
})
export type WorkoutProgramsResponse = z.infer<typeof WorkoutProgramsResponseSchema>

const GenerationRequestSchema = z.object({
  scope: GenerationScopeSchema,
  locale: SupportedLocaleSchema.optional(),
  session_count: z.number().int().nullable().optional(),
  replace_existing_future_sessions: z.boolean().optional(),
  seed: z.number().int().nullable().optional(),
})

const DemographicsSchema = z.object({
  age: z.number(),
  biological_sex: BiologicalSexSchema,
  height_cm: z.number().optional(),
  weight_kg: z.number().optional(),
  body_fat_percentage: z.number().nullable().optional(),
})

const DerivedProfileSchema = z.object({
  age_band: AgeBandSchema.nullable().optional(),
  body_mass_profile: BodyMassProfileSchema.nullable().optional(),
  canonical_goals: z.array(CanonicalGoalSchema).optional(),
})

const MovementCompetencyMapSchema = z.object({
  horizontal_push: MovementCompetencySchema.optional(),
  horizontal_pull: MovementCompetencySchema.optional(),
  vertical_push: MovementCompetencySchema.optional(),
  vertical_pull: MovementCompetencySchema.optional(),
  squat: MovementCompetencySchema.optional(),
  hinge: MovementCompetencySchema.optional(),
  lunge: MovementCompetencySchema.optional(),
  core: MovementCompetencySchema.optional(),
  carry: MovementCompetencySchema.optional(),
})

const TrainingBackgroundSchema = z.object({
  experience_level: ExperienceLevelSchema,
  training_age_years: z.number().optional(),
  estimated_1rms: z.record(z.string(), z.number()).optional(),
  movement_competency: MovementCompetencyMapSchema.optional(),
})

const GoalsSchema = z.object({
  primary_goal: UserGoalSchema,
  secondary_goal: UserGoalSchema.nullable().optional(),
  goal_priority_weight: z.number().optional(),
  target_muscle_groups: z.array(TargetMuscleGroupSchema).optional(),
})

const InjurySchema = z.object({
  condition: InjuryConditionSchema,
  severity: InjurySeveritySchema,
  notes: z.string().optional(),
})

const ConstraintsSchema = z.object({
  available_days_per_week: z.number(),
  session_duration_max_minutes: z.number(),
  equipment_access: EquipmentAccessProfileSchema,
  available_equipment: z.array(EquipmentItemSchema).optional(),
  injuries: z.array(InjurySchema).optional(),
})

const PreferencesSchema = z.object({
  liked_exercises: z.array(z.string()).optional(),
  disliked_exercises: z.array(z.string()).optional(),
  preferred_set_schemes: z.array(SetSchemePreferenceSchema).optional(),
  avoid_movement_patterns: z.array(MovementPatternIdSchema).optional(),
  excluded_blocks: z.array(ExcludableBlockTypeSchema).optional(),
})

const ReadinessSchema = z.object({
  sleep_hours: z.number().optional(),
  sleep_quality: SleepQualitySchema.optional(),
  energy_level: z.number().optional(),
  soreness_level: z.number().optional(),
  stress_level: z.number().optional(),
  resting_heart_rate_bpm: z.number().nullable().optional(),
})

const PerformedSetSchema = z.object({
  set_index: z.number().int().optional(),
  set_type: SetRoleSchema.optional(),
  prescribed_reps: z.number().nullable().optional(),
  actual_reps: z.number().nullable().optional(),
  prescribed_load_kg: z.number().nullable().optional(),
  actual_load_kg: z.number().nullable().optional(),
  prescribed_duration_seconds: z.number().nullable().optional(),
  actual_duration_seconds: z.number().nullable().optional(),
  rpe_actual: z.number().nullable().optional(),
  rir_actual: z.number().nullable().optional(),
  tempo_used: z.string().nullable().optional(),
  completed: z.boolean().optional(),
})

const PerformedExerciseSchema = z.object({
  exercise_id: z.string(),
  exercise_name: z.string().optional(),
  role: ExerciseRoleInSessionSchema.optional(),
  sets: z.array(PerformedSetSchema),
  pain_reported: z.boolean().optional(),
  pain_location: z.string().nullable().optional(),
  notes: z.string().nullable().optional(),
})

const SessionFeedbackSchema = z.object({
  overall_difficulty: OverallDifficultySchema.optional(),
  enjoyment: z.number().optional(),
  pump_quality: PumpQualitySchema.optional(),
  energy_post_session: EnergyPostSessionSchema.optional(),
  would_repeat: z.boolean().optional(),
  free_text: z.string().nullable().optional(),
})

const PreviousSessionSchema = z.object({
  session_id: z.string(),
  date: z.string(),
  session_label: z.string().optional(),
  training_day_type: TrainingDayTypeSchema.optional(),
  session_rpe_actual: z.number().nullable().optional(),
  session_duration_minutes: z.number().nullable().optional(),
  completion_rate: z.number().nullable().optional(),
  exercises_performed: z.array(PerformedExerciseSchema),
  session_feedback: SessionFeedbackSchema.optional(),
})

const VolumeLandmarkSchema = z.object({
  mv: z.number().optional(),
  mev: z.number().optional(),
  mav: z.number().optional(),
  mrv: z.number().optional(),
})

const TrainingDaySlotSchema = z.object({
  day_of_week: DayOfWeekSchema.optional(),
  slot_type: SlotTypeSchema.optional(),
  session_template: z.string().nullable().optional(),
})

const ProgramContextSchema = z.object({
  program_id: z.string().nullable().optional(),
  mesocycle_phase: MesocyclePhaseSchema.nullable().optional(),
  mesocycle_week: z.number().nullable().optional(),
  mesocycle_total_weeks: z.number().nullable().optional(),
  periodization_model: PeriodizationModelSchema.nullable().optional(),
  split_type: SplitTypeSchema.nullable().optional(),
  training_day_slot: TrainingDaySlotSchema.optional(),
  volume_landmarks: z.record(z.string(), VolumeLandmarkSchema).optional(),
  current_weekly_volume: z.record(z.string(), z.number()).optional(),
})

const CustomerProfileSchema = z.object({
  user_id: z.string(),
  demographics: DemographicsSchema,
  derived_profile: DerivedProfileSchema.optional(),
  training_background: TrainingBackgroundSchema,
  goals: GoalsSchema,
  constraints: ConstraintsSchema,
  preferences: PreferencesSchema.optional(),
  readiness: ReadinessSchema.optional(),
})

export const SessionInputSchema = z.object({
  version: z.string(),
  generation_request: GenerationRequestSchema,
  customer_profile: CustomerProfileSchema,
  previous_sessions: z.array(PreviousSessionSchema).optional(),
  program_context: ProgramContextSchema.optional(),
})
export type SessionInputBody = z.infer<typeof SessionInputSchema>

const ExerciseRoleSchema = z.enum([
  'primary',
  'secondary',
  'accessory',
  'prehab',
  'warm_up',
  'cool_down',
  'conditioning',
])

const MindMuscleConnectionSchema = z.enum(['none', 'weak', 'moderate', 'strong'])

const SetTypeSchema = z.enum([
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

const SkipReasonSchema = z.enum([
  'pain',
  'fatigue',
  'time',
  'equipment_unavailable',
  'other',
])

const BlockTypeSchema = z.enum([
  'warm_up',
  'activation',
  'strength',
  'hypertrophy',
  'power',
  'conditioning',
  'cardio',
  'core',
  'mobility',
  'skill',
  'recovery',
  'cool_down',
])

const SessionStatusSchema = z.enum([
  'draft',
  'scheduled',
  'available',
  'in_progress',
  'completed',
  'skipped',
  'cancelled',
])

const TargetIntensitySchema = z.enum(['light', 'moderate', 'hard', 'very_hard'])

const UserFeedbackSchema = z.object({
  like: z.union([z.literal(0), z.literal(1)]).optional(),
  stars: z.number().optional(),
  effort_level: z.number().optional(),
})

const ExerciseSnapshotSchema = z.object({
  name: z.string(),
  type: z.string(),
  primary_muscle_id: z.string().nullable().optional(),
  equipment_ids: z.array(z.string()).optional(),
  body_part_ids: z.array(z.string()).optional(),
})

const ExerciseRefSchema = z.object({
  exercise_id: z.string(),
  exercise_snapshot: ExerciseSnapshotSchema.nullable().optional(),
})

const ExerciseActualsSchema = z.object({
  id: z.string(),
  reps: z.number().nullable().optional(),
  duration_seconds: z.number().nullable().optional(),
  distance: z.number().nullable().optional(),
  rest_seconds: z.number().nullable().optional(),
  weight: z.number().nullable().optional(),
  user_feedback: UserFeedbackSchema.optional(),
})

const SubstitutionOptionSchema = z.object({
  exercise_id: z.string(),
  name: z.string().nullable().optional(),
  reason: z.string().nullable().optional(),
})

const ExerciseTrackingSchema = z.object({
  mind_muscle_connection: MindMuscleConnectionSchema.nullable().optional(),
  exercise_enjoyment: z.number().nullable().optional(),
  would_repeat: z.boolean().nullable().optional(),
  substitution_used: z.string().nullable().optional(),
  pain_reported: z.boolean().nullable().optional(),
  pain_location: z.string().nullable().optional(),
  notes: z.string().nullable().optional(),
})

const PrescribedExerciseSchema = z.object({
  id: z.string(),
  role: ExerciseRoleSchema.nullable().optional(),
  order_index: z.number().nullable().optional(),
  reps: z.number().nullable().optional(),
  duration_seconds: z.number().nullable().optional(),
  distance: z.number().nullable().optional(),
  rest_seconds: z.number().nullable().optional(),
  tempo_eccentric_seconds: z.number().nullable().optional(),
  tempo_concentric_seconds: z.number().nullable().optional(),
  rest_pause_seconds: z.number().nullable().optional(),
  weight: z.number().nullable().optional(),
  coaching_cues: z.array(z.string()).optional(),
  substitution_options: z.array(SubstitutionOptionSchema).optional(),
  exercise_ref: ExerciseRefSchema,
  exercise_actuals: ExerciseActualsSchema.optional(),
  exercise_tracking: ExerciseTrackingSchema.optional(),
})

const RepsRangeSchema = z.object({
  min: z.number(),
  max: z.number(),
})

const SetTrackingSchema = z.object({
  actual_reps: z.number().nullable().optional(),
  actual_load_kg: z.number().nullable().optional(),
  actual_duration_seconds: z.number().nullable().optional(),
  actual_rpe: z.number().nullable().optional(),
  actual_rir: z.number().nullable().optional(),
  completed: z.boolean().nullable().optional(),
  skipped: z.boolean().optional(),
  skip_reason: SkipReasonSchema.nullable().optional(),
  pain_during_set: z.boolean().optional(),
  pain_location: z.string().nullable().optional(),
  pain_severity: z.number().nullable().optional(),
  notes: z.string().nullable().optional(),
})

const PrescribedSetSchema = z.object({
  id: z.string(),
  set_number: z.number(),
  set_type: SetTypeSchema,
  set_role: SetRoleSchema.nullable().optional(),
  reps: z.number().nullable().optional(),
  reps_range: RepsRangeSchema.nullable().optional(),
  duration_seconds: z.number().nullable().optional(),
  distance: z.number().nullable().optional(),
  distance_unit: z.string().nullable().optional(),
  rest_seconds: z.number().nullable().optional(),
  load_kg: z.number().nullable().optional(),
  load_percentage_1rm: z.number().nullable().optional(),
  rpe_target: z.number().nullable().optional(),
  rir_target: z.number().nullable().optional(),
  tempo: z.string().nullable().optional(),
  exercises: z.array(PrescribedExerciseSchema),
  is_completed: z.boolean(),
  tracking: SetTrackingSchema.optional(),
  created_at: z.string(),
  updated_at: z.string(),
})

const BlockTrackingSchema = z.object({
  actual_duration_minutes: z.number().nullable().optional(),
  notes: z.string().nullable().optional(),
})

const SessionBlockSchema = z.object({
  id: z.string(),
  block_type: BlockTypeSchema,
  block_label: z.string().nullable().optional(),
  order_index: z.number(),
  estimated_duration_minutes: z.number().nullable().optional(),
  rest_seconds: z.number().nullable().optional(),
  sets: z.array(PrescribedSetSchema),
  block_tracking: BlockTrackingSchema.optional(),
  created_at: z.string(),
  updated_at: z.string(),
})

const SessionTrackingSchema = z.object({
  actual_duration_minutes: z.number().nullable().optional(),
  session_rpe_actual: z.number().nullable().optional(),
  overall_difficulty: OverallDifficultySchema.nullable().optional(),
  enjoyment: z.number().nullable().optional(),
  energy_post_session: EnergyPostSessionSchema.nullable().optional(),
  would_repeat_session: z.boolean().nullable().optional(),
  completion_rate: z.number().nullable().optional(),
  free_text_feedback: z.string().nullable().optional(),
})

const SessionGenerationMetadataSchema = z.object({
  engine_version: z.string().nullable().optional(),
  input_contract_version: z.string().nullable().optional(),
  generated_at: z.string().nullable().optional(),
})

const WorkoutSessionSchema = z.object({
  id: z.string(),
  name: z.string(),
  session_number: z.number(),
  week_number: z.number(),
  order_index: z.number(),
  duration_minutes: z.number(),
  status: SessionStatusSchema,
  training_day_type: TrainingDayTypeSchema.nullable().optional(),
  focus_muscles: z.array(z.string()).optional(),
  focus_patterns: z.array(z.string()).optional(),
  target_intensity: TargetIntensitySchema.nullable().optional(),
  session_rpe_target: z.number().nullable().optional(),
  coach_notes: z.string().nullable().optional(),
  blocks: z.array(SessionBlockSchema),
  started_at: z.string().nullable().optional(),
  completed_at: z.string().nullable().optional(),
  session_tracking: SessionTrackingSchema.optional(),
  generation_metadata: SessionGenerationMetadataSchema.optional(),
  created_at: z.string(),
  updated_at: z.string(),
})

const WorkoutProgramInstanceSchema = z.object({
  id: z.string(),
  catalog_program_id: z.string(),
  program_template_id: z.string(),
  personal_id: z.string(),
  name: z.string().nullable(),
  goals: z.array(z.string()),
  canonical_goals: z.array(z.string()),
  difficulty_level: z.string().nullable(),
  days_per_week: z.number().nullable(),
  duration_weeks: z.number().nullable(),
  session_duration_minutes: z.number().nullable(),
  equipment_access_id: z.string().nullable(),
  status: z.string(),
  is_active: z.boolean(),
  sessions: z.array(WorkoutSessionSchema),
  created_at: z.string(),
  updated_at: z.string(),
  started_at: z.string().nullable(),
  completed_at: z.string().nullable(),
  expiration_date: z.string().nullable(),
})

export const WorkoutGenerationResponseSchema = z.object({
  version: z.string(),
  workout_program: z.object({
    mode: z.enum(['existing_reference', 'full']),
    id: z.string(),
    program_instance: WorkoutProgramInstanceSchema.nullable(),
  }),
  workout_sessions: z.array(WorkoutSessionSchema),
  generation_scope: z.string(),
  generation_metadata: z.object({
    engine_version: z.string(),
    input_contract_version: z.string(),
    generated_at: z.string(),
    notes: z.string().nullable(),
  }),
  requestId: z.string(),
})
export type WorkoutGenerationResponse = z.infer<
  typeof WorkoutGenerationResponseSchema
>
