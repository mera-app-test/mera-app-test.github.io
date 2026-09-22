// DATA PORTOVI (ARCHITECTURE.md §7). Implementacije: infrastructure/data-local (V1), kasnije server.
import type { AuditRepository, MeasurementRepository, SecretStore, SettingsRepository } from "./repositories";
import type { UnitOfWork } from "./changeSet";
import type { BackupStore } from "./backupStore";

export * from "./errors";
export type * from "./changeSet";
export type * from "./repositories";
export type * from "./backupStore";

export interface DataProvider {
  readonly measurements: MeasurementRepository;
  readonly audit: AuditRepository;
  readonly settings: SettingsRepository;
  readonly secrets: SecretStore;
  readonly unitOfWork: UnitOfWork;
  readonly backup: BackupStore;
  close(): void;
}
