// Nedeljni podsetnik za rezervnu kopiju (ARCHITECTURE.md §11.4, odluka vlasnika).
export const BACKUP_REMINDER_DAYS = 7;

/**
 * Podsetnik je potreban kada postoje korisnički podaci i kopija nikad nije napravljena
 * ili je od poslednje prošlo 7 ili više dana. Bez podataka nema šta da se čuva.
 */
export function isBackupDue(lastExportAt: string | null, nowIso: string, activeUserRecords: number): boolean {
  if (activeUserRecords <= 0) return false;
  if (lastExportAt === null) return true;
  const elapsedMs = Date.parse(nowIso) - Date.parse(lastExportAt);
  return elapsedMs >= BACKUP_REMINDER_DAYS * 24 * 60 * 60 * 1000;
}
