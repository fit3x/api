import {
  DATA,
  EXERCISE_BY_ID,
  PROGRAM_INDEX_BY_ID,
  VERSION,
  generateWorkout,
  getBiologicalSexOptions,
  getBodyPartOptions,
  getConditionOptions,
  getEquipmentOptions,
  getExercises,
  getExperienceLevelOptions,
  getGoalOptions,
  getInjuryOptions,
  getIntensityOptions,
  getMovementPatternOptions,
  getMuscleOptions,
  getPrograms,
  getSessionCoverage,
  getSessions,
  getSetTypeOptions,
  type ExerciseCatalogEntry,
  type GetProgramsFilters,
  type GetSessionsFilters,
  type ProgramListOutput,
  type SessionCoverageOutput,
  type SessionInput,
  type SessionListOutput,
  type SupportedLocale,
  type WorkoutGenerationOutput,
} from '@fit3x/workout-engine'

export const getEngineVersion = (): string => VERSION

/** v1.3.0 removed block types and excludable blocks (v3 has no session blocks)
 *  and added desired-intensity options. */
export const getOptionsBundle = (locale: SupportedLocale) => ({
  biologicalSexes: getBiologicalSexOptions(locale),
  bodyParts: getBodyPartOptions(locale),
  conditions: getConditionOptions(locale),
  equipment: getEquipmentOptions(locale),
  experienceLevels: getExperienceLevelOptions(locale),
  goals: getGoalOptions(locale),
  injuries: getInjuryOptions(locale),
  intensities: getIntensityOptions(locale),
  movementPatterns: getMovementPatternOptions(locale),
  muscles: getMuscleOptions(locale),
  setTypes: getSetTypeOptions(locale),
})

export const getProgramsCatalog = (
  locale: SupportedLocale,
  filters?: GetProgramsFilters,
): ProgramListOutput => getPrograms({ locale, filters })

export const getSessionsCatalog = (
  locale: SupportedLocale,
  filters?: GetSessionsFilters,
): SessionListOutput => getSessions({ locale, filters })

export const getSessionCoverageMap = (): SessionCoverageOutput =>
  getSessionCoverage()

/** `generation_request.program_id` is a program-catalog id. Checking it here
 *  turns an engine throw into a 404 the client can act on. */
export const programExists = (programId: string): boolean =>
  PROGRAM_INDEX_BY_ID.has(programId)

export const getAllExercises = (): readonly ExerciseCatalogEntry[] =>
  getExercises()

export const getExerciseById = (
  id: string,
): ExerciseCatalogEntry | undefined => EXERCISE_BY_ID.get(id)

/** Muscle ids are catalog data, not a closed enum, so the sessions-catalog
 *  filter is validated against the live set rather than a Zod enum. */
const MUSCLE_IDS: ReadonlySet<string> = new Set(DATA.muscles.map((m) => m.id))

export const unknownMuscleIds = (ids: readonly string[]): readonly string[] =>
  ids.filter((id) => !MUSCLE_IDS.has(id))

/** v1.3.0 signature: generateWorkout(input, options?). The locale now comes
 *  from input.generation_request.locale — it is no longer an option, and the
 *  engine loads the bundle itself. */
export const generateSession = (
  input: SessionInput,
): WorkoutGenerationOutput => generateWorkout(input)
