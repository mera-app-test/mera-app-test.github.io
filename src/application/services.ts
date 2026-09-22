// Skup servisa koje composition root predaje UI-ju. UI ne zna koje su implementacije iza njih.
import type { BuildInfo } from "./buildInfo";
import type { DiagnosticsService } from "./diagnostics/diagnostics";
import type { BackupService } from "./backup/backupService";

export interface AppServices {
  readonly build: BuildInfo;
  readonly backup: BackupService;
  /** Postoji samo u test/dev okruženju; u produkciji je null i kod se ne uključuje u build. */
  readonly loadDiagnostics: (() => Promise<DiagnosticsService>) | null;
}
