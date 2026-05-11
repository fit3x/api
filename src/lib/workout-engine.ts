import {
  DATA,
  VERSION,
  generateWorkout,
  getBiologicalSexOptions,
  getBlockTypeOptions,
  getBodyPartOptions,
  getCanonicalGoalOptions,
  getConditionOptions,
  getEquipmentAccessOptions,
  getEquipmentOptions,
  getExcludableBlockOptions,
  getExperienceLevelOptions,
  getGoalOptions,
  getInjuryOptions,
  getMovementPatternOptions,
  getMuscleOptions,
  getSetTypeOptions,
  getWorkoutPrograms,
  loadLocale,
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
  canonicalGoals: getCanonicalGoalOptions(locale),
  conditions: getConditionOptions(locale),
  equipment: getEquipmentOptions(locale),
  equipmentAccess: getEquipmentAccessOptions(locale),
  excludableBlocks: getExcludableBlockOptions(locale),
  experienceLevels: getExperienceLevelOptions(locale),
  goals: getGoalOptions(locale),
  injuries: getInjuryOptions(locale),
  movementPatterns: getMovementPatternOptions(locale),
  muscles: getMuscleOptions(locale),
  setTypes: getSetTypeOptions(locale),
})

export const getProgramsCatalog = () => getWorkoutPrograms({ data: DATA })

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
