// Use case-ovi rezervne kopije (ARCHITECTURE.md §11).
import { backupFileName, buildBackupText, isBackupDue, parseBackupText, type ParsedBackup, type ParseError } from "../../backup";
import type { DataProvider } from "../../ports/data";
import type { Clock, FileExporter, Hasher, IdGenerator, StoragePersistence } from "../../ports/platform";
import { auditEvent } from "../records";

export interface BackupStatus {
  readonly lastExportAt: string | null;
  readonly due: boolean;
  readonly activeMeasurements: number;
  readonly persisted: boolean | null;
}

export type ExportResult = { readonly ok: true; readonly fileName: string } | { readonly ok: false; readonly message: string };
export type PreviewResult = { readonly ok: true; readonly backup: ParsedBackup } | { readonly ok: false; readonly error: ParseError };

export interface BackupService {
  status(): Promise<BackupStatus>;
  exportNow(): Promise<ExportResult>;
  previewImport(text: string): Promise<PreviewResult>;
  /** Zamenjuje sve korisničke podatke podacima iz kopije; pre toga pravi zaštitnu kopiju. */
  confirmImport(backup: ParsedBackup): Promise<void>;
}

export interface BackupDeps {
  readonly data: DataProvider;
  readonly clock: Clock;
  readonly ids: IdGenerator;
  readonly hasher: Hasher;
  readonly files: FileExporter;
  readonly persistence: StoragePersistence;
  readonly appVersion: string;
}

export function createBackupService(d: BackupDeps): BackupService {
  const hash = (t: string) => d.hasher.sha256Hex(t);
  return {
    async status() {
      const [settings, activeMeasurements, persisted] = await Promise.all([
        d.data.settings.getAll(),
        d.data.measurements.countActive(),
        d.persistence.isPersisted(),
      ]);
      return {
        lastExportAt: settings.lastExportAt,
        due: isBackupDue(settings.lastExportAt, d.clock.nowIso(), activeMeasurements),
        activeMeasurements,
        persisted,
      };
    },

    async exportNow() {
      const [data, info] = await Promise.all([d.data.backup.readAllUserData(), d.data.backup.info()]);
      const exportedAt = d.clock.nowIso();
      const text = await buildBackupText(data, { appVersion: d.appVersion, exportedAt, userId: info.userId, referenceDataVersion: null }, hash);
      const fileName = backupFileName(exportedAt);
      const saved = await d.files.saveTextFile(fileName, text, "application/json");
      if (!saved) return { ok: false, message: "Pregledač nije pokrenuo preuzimanje fajla." };
      // lastExportAt se upisuje tek posle uspešno pokrenutog preuzimanja (§11.2).
      await d.data.settings.set("lastExportAt", exportedAt);
      return { ok: true, fileName };
    },

    async previewImport(text) {
      const r = await parseBackupText(text, hash);
      return r.ok ? { ok: true, backup: r.backup } : { ok: false, error: r.error };
    },

    async confirmImport(backup) {
      await d.data.backup.saveSafetySnapshot("pre-import");
      const info = await d.data.backup.info();
      const ctx = { userId: info.userId, nowIso: d.clock.nowIso(), newId: () => d.ids.newId(), appVersion: d.appVersion };
      const importAudit = auditEvent(ctx, {
        actor: "user",
        useCase: "importBackup",
        entityRefs: [],
        summary: `Uvoz rezervne kopije od ${backup.exportedAt} (šema ${backup.originalSchemaVersion}); merenja: ${backup.counts.measurements}.`,
      });
      await d.data.backup.replaceAllUserData({
        measurements: backup.data.measurements,
        audit_events: [...backup.data.audit_events, importAudit],
      });
    },
  };
}
