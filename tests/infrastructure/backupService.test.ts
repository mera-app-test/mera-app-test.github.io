import "fake-indexeddb/auto";
import { IDBFactory } from "fake-indexeddb";
import { createBrowserHasher } from "../../src/infrastructure/platform/browserPlatform";
import { beforeEach, describe, expect, it } from "vitest";
import { createBackupService } from "../../src/application";
import { createLocalDataProvider } from "../../src/infrastructure/data-local";
import { ctx, mass, putNew, seqIds } from "../support/fixtures";

beforeEach(() => {
  globalThis.indexedDB = new IDBFactory();
});

async function setup(saveWorks = true) {
  let now = "2026-09-23T10:00:00.000Z";
  const ids = seqIds("s");
  const data = await createLocalDataProvider({ now: () => now, newId: ids });
  const saved: { name: string; text: string }[] = [];
  const svc = createBackupService({
    data,
    clock: { nowIso: () => now, localDate: () => now.slice(0, 10), timeZone: () => "Europe/Belgrade", isoAtLocalDate: (d: string) => `${d}T10:00:00.000Z` },
    ids: { newId: ids },
    hasher: createBrowserHasher(),
    files: { saveTextFile: async (name, text) => { if (saveWorks) saved.push({ name, text }); return saveWorks; } },
    persistence: { isPersisted: async () => false, requestPersist: async () => false },
    appVersion: "0.1.0+test",
  });
  const { userId } = await data.backup.info();
  const addMass = async (value: number) => {
    const c = ctx(now, ids, userId);
    await data.unitOfWork.commit(putNew(c, mass(c, value, now, now.slice(0, 10))));
  };
  return { data, svc, saved, addMass, setNow: (v: string) => { now = v; } };
}

describe("rezervna kopija (use case nad LocalDataProvider-om)", () => {
  it("izvoz upisuje lastExportAt samo posle uspeha; podsetnik nestaje", async () => {
    const t = await setup();
    await t.addMass(92.4);
    expect((await t.svc.status()).due).toBe(true);
    const r = await t.svc.exportNow();
    expect(r.ok).toBe(true);
    expect(t.saved[0]?.name).toBe("mera-backup-2026-09-23.json");
    const st = await t.svc.status();
    expect(st.lastExportAt).toBe("2026-09-23T10:00:00.000Z");
    expect(st.due).toBe(false);
  });

  it("neuspelo preuzimanje ne menja lastExportAt", async () => {
    const t = await setup(false);
    await t.addMass(92.4);
    const r = await t.svc.exportNow();
    expect(r.ok).toBe(false);
    expect((await t.svc.status()).lastExportAt).toBeNull();
  });

  it("uvoz: pregled, zaštitna kopija, zamena podataka i audit o uvozu", async () => {
    const t = await setup();
    await t.addMass(92.4);
    await t.svc.exportNow();
    const text = t.saved[0]!.text;
    t.setNow("2026-09-24T10:00:00.000Z");
    await t.addMass(91.0); // posle izvoza
    expect(await t.data.measurements.countActive()).toBe(2);

    const p = await t.svc.previewImport(text);
    expect(p.ok).toBe(true);
    if (!p.ok) return;
    expect(p.backup.counts.measurements).toBe(1);
    await t.svc.confirmImport(p.backup);

    expect(await t.data.measurements.countActive()).toBe(1);
    const snaps = await t.data.backup.listSafetySnapshots();
    expect(snaps.map((s) => s.reason)).toEqual(["pre-import"]);
    const all = await t.data.backup.readAllUserData();
    expect(all.audit_events.some((e) => e.useCase === "importBackup")).toBe(true);
  });

  it("oštećen fajl se ne uvozi i podaci ostaju", async () => {
    const t = await setup();
    await t.addMass(92.4);
    const p = await t.svc.previewImport("{}");
    expect(p.ok).toBe(false);
    expect(await t.data.measurements.countActive()).toBe(1);
  });
});
