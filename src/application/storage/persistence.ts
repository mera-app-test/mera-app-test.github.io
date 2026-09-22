// Zahtev za trajno skladište pri prvom stvarnom čuvanju korisničkih podataka (ARCHITECTURE.md §9, DECISIONS/0002).
import type { SettingsRepository } from "../../ports/data";
import type { Clock, StoragePersistence } from "../../ports/platform";

/**
 * Poziva se POSLE uspešnog upisa korisničkih podataka (npr. prvog unosa mase), kao posledica korisnikove akcije.
 * Traži samo jednom; odbijanje se pamti i ne ponavlja se odmah (preporuka web.dev).
 */
export async function ensurePersistentStorageAfterSave(
  settings: SettingsRepository,
  persistence: StoragePersistence,
  clock: Clock,
): Promise<boolean | null> {
  const s = await settings.getAll();
  if (s.persistGranted === true) return true;
  if (s.persistRequestedAt !== null) return s.persistGranted;
  const already = await persistence.isPersisted();
  if (already === true) {
    await settings.set("persistGranted", true);
    return true;
  }
  const granted = await persistence.requestPersist();
  await settings.set("persistRequestedAt", clock.nowIso());
  await settings.set("persistGranted", granted);
  return granted;
}
