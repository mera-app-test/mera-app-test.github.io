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
