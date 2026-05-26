import {
  DATA,
  EXERCISE_BY_ID,
  VERSION,
  generateWorkout,
  getBiologicalSexOptions,
  getBlockTypeOptions,
  getBodyPartOptions,
  getConditionOptions,
  getEquipmentOptions,
  getExcludableBlockOptions,
  getExercises,
  getExperienceLevelOptions,
  getGoalOptions,
  getInjuryOptions,
  getMovementPatternOptions,
  getMuscleOptions,
  getSetTypeOptions,
  getWorkoutPrograms,
  loadLocale,
  type ExerciseCatalogEntry,
  type LocaleBundle,
  type SessionInput,
  type SupportedLocale,
  type WorkoutGenerationOutput,
} from '@fit3x/workout-engine'

export const getEngineVersion = (): string => VERSION

export const getOptionsBundle = (locale: SupportedLocale) => ({
  biologicalSexes: getBiologicalSexOptions(locale),
  blockTypes: getBlockTypeOptions(locale),
  bodyParts: getBodyPartOptions(locale),
  conditions: getConditionOptions(locale),
  equipment: getEquipmentOptions(locale),
  excludableBlocks: getExcludableBlockOptions(locale),
  experienceLevels: getExperienceLevelOptions(locale),
  goals: getGoalOptions(locale),
  injuries: getInjuryOptions(locale),
  movementPatterns: getMovementPatternOptions(locale),
  muscles: getMuscleOptions(locale),
  setTypes: getSetTypeOptions(locale),
})

export const getProgramsCatalog = () => getWorkoutPrograms({ data: DATA })

export const getAllExercises = (): readonly ExerciseCatalogEntry[] =>
  getExercises()

export const getExerciseById = (
  id: string,
): ExerciseCatalogEntry | undefined => EXERCISE_BY_ID.get(id)

const localeCache = new Map<SupportedLocale, LocaleBundle>()
const getLocaleBundle = (locale: SupportedLocale): LocaleBundle => {
  const cached = localeCache.get(locale)
  if (cached) return cached
  const bundle = loadLocale(locale)
  localeCache.set(locale, bundle)
  return bundle
}

export const generateSession = (
  input: SessionInput,
): WorkoutGenerationOutput => {
  const locale = input.generation_request.locale ?? 'en'
  return generateWorkout({
    data: DATA,
    input,
    locale: getLocaleBundle(locale),
  })
}
