import { describe, expect, it } from "vitest";
import { ensurePersistentStorageAfterSave } from "../../src/application";
import { DEFAULT_SETTINGS, type SettingKey, type Settings } from "../../src/schemas";
import type { SettingsRepository } from "../../src/ports/data";
import type { Clock, StoragePersistence } from "../../src/ports/platform";

function fakes(opts: { persisted: boolean | null; grant: boolean | null }) {
  let s: Settings = { ...DEFAULT_SETTINGS };
  let requests = 0;
  const settings: SettingsRepository = {
    getAll: async () => ({ ...s }),
    set: async <K extends SettingKey>(k: K, v: Settings[K]) => { s = { ...s, [k]: v }; },
  };
  const persistence: StoragePersistence = {
    isPersisted: async () => opts.persisted,
    requestPersist: async () => { requests += 1; return opts.grant; },
  };
  const clock: Clock = { nowIso: () => "2026-09-23T10:00:00.000Z", localDate: () => "2026-09-23", timeZone: () => "Europe/Belgrade", isoAtLocalDate: (d: string) => `${d}T10:00:00.000Z` };
  return { settings, persistence, clock, get: () => s, requests: () => requests };
}

describe("trajno skladište posle prvog čuvanja", () => {
  it("traži jednom i pamti odbijanje (ne ponavlja odmah)", async () => {
    const f = fakes({ persisted: false, grant: false });
    expect(await ensurePersistentStorageAfterSave(f.settings, f.persistence, f.clock)).toBe(false);
    expect(await ensurePersistentStorageAfterSave(f.settings, f.persistence, f.clock)).toBe(false);
    expect(f.requests()).toBe(1);
    expect(f.get().persistRequestedAt).toBe("2026-09-23T10:00:00.000Z");
  });

  it("ako je već odobreno, ne traži ponovo", async () => {
    const f = fakes({ persisted: true, grant: true });
    expect(await ensurePersistentStorageAfterSave(f.settings, f.persistence, f.clock)).toBe(true);
    expect(f.requests()).toBe(0);
  });

  it("odobreno pri zahtevu se pamti", async () => {
    const f = fakes({ persisted: false, grant: true });
    await ensurePersistentStorageAfterSave(f.settings, f.persistence, f.clock);
    expect(f.get().persistGranted).toBe(true);
  });
});
