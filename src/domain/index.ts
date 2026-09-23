// DOMAIN — čiste, determinističke funkcije (ARCHITECTURE.md §6, §13).
// Pravilo: ne uvozi ništa osim src/domain i src/schemas. Bez I/O, bez vremena, bez slučajnosti.
export { addDays, daysBetween, isValidLocalDate } from "./time/localDate";
export {
  analyzeTrend,
  averageInWindow,
  dailyValues,
  needsInputConfirmation,
  slopeInWindow,
  trendLookbackDays,
  type AverageResult,
  type DailyValue,
  type MassPoint,
  type SlopeResult,
  type TrendAnalysis,
} from "./trend/trend";
export {
  DISPLAY_NUTRIENTS,
  availableCarbohydrateForAmount,
  energyForAmount,
  energyPer100g,
  nutrientsForAmount,
  saltGramsFromSodiumMg,
  sumItems,
  type DisplayNutrient,
  type EnergyResult,
  type NutrientAmount,
  type SumItem,
  type SumResult,
} from "./nutrition/nutrition";
export {
  LEVELS,
  displayEnergy,
  displayGrams,
  displayMg,
  displaySalt,
  levelForValue,
  weakest,
  type ConfidenceLevel,
  type Display,
} from "./confidence/confidence";
export { matchesQuery, normalizeForSearch } from "./text/search";
export {
  deriveQuestions,
  evaluate,
  searchKnowledge,
  testCondition,
  validateKnowledge,
  type DerivedQuestion,
  type Evaluation,
  type FactValue,
  type Facts,
} from "./knowledge/knowledge";
