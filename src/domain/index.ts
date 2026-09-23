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
