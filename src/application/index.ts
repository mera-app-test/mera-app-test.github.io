// APPLICATION — use case-ovi. Jedino mesto gde se spajaju domain, validation, safety i portovi.
export type { BuildInfo, MeraEnv } from "./buildInfo";
export { formatVersionLabel, isTestEnvironment } from "./buildInfo";
export type { DiagnosticsService } from "./diagnostics/diagnostics";
export { createDiagnosticsService, formatReport } from "./diagnostics/diagnostics";
export type { ProbeResult, ProbeStatus, ImportedFile } from "../ports/platform/PlatformProbe";
export type { AppServices } from "./services";
export type { BackupService, BackupStatus, ExportResult, PreviewResult } from "./backup/backupService";
export { createBackupService } from "./backup/backupService";
export { ensurePersistentStorageAfterSave } from "./storage/persistence";
export { auditEvent, newBase, nextRevision, softDeleted, type RecordContext } from "./records";
export type { ParsedBackup, ParseError } from "../backup";
export type { WeightService, WeightOverview, WeightEntryView, LogWeightResult, RemoveWeightResult } from "./weight/weightService";
export { createWeightService } from "./weight/weightService";
export type { TrendAnalysis, AverageResult, SlopeResult } from "../domain";
export type { FoodService, FoodListItem, FoodDetail, NutrientRow } from "./foods/foodService";
export { createFoodService } from "./foods/foodService";
export type { Display, ConfidenceLevel, DisplayNutrient } from "../domain";
