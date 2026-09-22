// UGOVORNI TESTOVI data portova (ARCHITECTURE.md §12.4).
// Isti skup se danas pokreće nad LocalDataProvider-om, a kasnije nad ServerDataProvider-om.
import { describe, expect, it } from "vitest";
import type { DataProvider } from "../../src/ports/data";
import { isDataError } from "../../src/ports/data";
import { ctx, deleteOf, mass, putNew, putUpdate, seqIds } from "../support/fixtures";

export function runDataProviderContract(name: string, factory: () => Promise<DataProvider>) {
  describe(`DataProvider ugovor — ${name}`, () => {
    const setup = async () => {
      const dp = await factory();
      const { userId } = await dp.backup.info();
      const ids = seqIds("m");
      const at = (iso: string) => ctx(iso, ids, userId);
      return { dp, userId, at };
    };

    it("upis novog merenja pa čitanje daje isti zapis", async () => {
      const { dp, at } = await setup();
      const c = at("2026-09-20T06:00:00.000Z");
      const m = mass(c, 92.4, "2026-09-20T06:00:00.000Z", "2026-09-20");
      await dp.unitOfWork.commit(putNew(c, m));
      expect(await dp.measurements.get(m.id)).toEqual(m);
      expect(await dp.measurements.countActive()).toBe(1);
    });

    it("listRange filtrira po opsegu datuma i sortira po vremenu merenja", async () => {
      const { dp, at } = await setup();
      const c1 = at("2026-09-21T06:00:00.000Z");
      const late = mass(c1, 92.0, "2026-09-21T06:00:00.000Z", "2026-09-21");
      const c2 = at("2026-09-22T06:00:00.000Z");
      const early = mass(c2, 92.6, "2026-09-19T06:00:00.000Z", "2026-09-19");
      const c3 = at("2026-09-22T06:05:00.000Z");
      const outside = mass(c3, 91.0, "2026-09-10T06:00:00.000Z", "2026-09-10");
      for (const [c, m] of [[c1, late], [c2, early], [c3, outside]] as const) await dp.unitOfWork.commit(putNew(c, m));
      const list = await dp.measurements.listRange("body_mass", "2026-09-15", "2026-09-30");
      expect(list.map((m) => m.id)).toEqual([early.id, late.id]);
      expect((await dp.measurements.latest("body_mass"))?.id).toBe(late.id);
    });

    it("izmena sa ispravnom verzijom povećava rev", async () => {
      const { dp, at } = await setup();
      const c = at("2026-09-20T06:00:00.000Z");
      const m = mass(c, 92.4, "2026-09-20T06:00:00.000Z", "2026-09-20");
      await dp.unitOfWork.commit(putNew(c, m));
      const { cs, next } = putUpdate(at("2026-09-20T07:00:00.000Z"), m, 92.1);
      await dp.unitOfWork.commit(cs);
      const got = await dp.measurements.get(m.id);
      expect(got.rev).toBe(2);
      expect(got.value).toBe(92.1);
      expect(got).toEqual(next);
    });

    it("pogrešna očekivana verzija → Conflict i ništa se ne menja (ni audit)", async () => {
      const { dp, at } = await setup();
      const c = at("2026-09-20T06:00:00.000Z");
      const m = mass(c, 92.4, "2026-09-20T06:00:00.000Z", "2026-09-20");
      await dp.unitOfWork.commit(putNew(c, m));
      const first = putUpdate(at("2026-09-20T07:00:00.000Z"), m, 92.1);
      await dp.unitOfWork.commit(first.cs);
      const stale = putUpdate(at("2026-09-20T08:00:00.000Z"), m, 99); // zasniva se na rev 1
      const err = await dp.unitOfWork.commit(stale.cs).catch((e: unknown) => e);
      expect(isDataError(err, "Conflict")).toBe(true);
      expect((await dp.measurements.get(m.id)).value).toBe(92.1);
      const events = await dp.audit.listForEntity({ entity: "measurements", id: m.id });
      expect(events.map((e) => e.useCase)).toEqual(["logWeight", "editWeight"]);
    });

    it("upis zapisa koji već postoji kao nov → Conflict", async () => {
      const { dp, at } = await setup();
      const c = at("2026-09-20T06:00:00.000Z");
      const m = mass(c, 92.4, "2026-09-20T06:00:00.000Z", "2026-09-20");
      await dp.unitOfWork.commit(putNew(c, m));
      const again = putNew(at("2026-09-20T06:01:00.000Z"), m);
      const err = await dp.unitOfWork.commit(again).catch((e: unknown) => e);
      expect(isDataError(err, "Conflict")).toBe(true);
    });

    it("brisanje: zapis nestaje iz čitanja, audit ostaje", async () => {
      const { dp, at } = await setup();
      const c = at("2026-09-20T06:00:00.000Z");
      const m = mass(c, 92.4, "2026-09-20T06:00:00.000Z", "2026-09-20");
      await dp.unitOfWork.commit(putNew(c, m));
      await dp.unitOfWork.commit(deleteOf(at("2026-09-20T09:00:00.000Z"), m));
      expect(isDataError(await dp.measurements.get(m.id).catch((e: unknown) => e), "NotFound")).toBe(true);
      expect(await dp.measurements.latest("body_mass")).toBeNull();
      expect(await dp.measurements.listRange("body_mass", "2026-09-01", "2026-09-30")).toEqual([]);
      expect(await dp.measurements.countActive()).toBe(0);
      expect((await dp.audit.listForEntity({ entity: "measurements", id: m.id })).length).toBe(2);
    });

    it("neispravan zapis → ValidationFailed, ništa nije upisano", async () => {
      const { dp, at } = await setup();
      const c = at("2026-09-20T06:00:00.000Z");
      const bad = { ...mass(c, -5, "2026-09-20T06:00:00.000Z", "2026-09-20") };
      const err = await dp.unitOfWork.commit(putNew(c, bad)).catch((e: unknown) => e);
      expect(isDataError(err, "ValidationFailed")).toBe(true);
      expect(await dp.measurements.countActive()).toBe(0);
      expect((await dp.backup.readAllUserData()).audit_events).toEqual([]);
    });

    it("zapis drugog korisnika se odbija", async () => {
      const { dp } = await setup();
      const c = ctx("2026-09-20T06:00:00.000Z", seqIds("x"), "00000000-0000-4000-8000-00000000abcd");
      const err = await dp.unitOfWork.commit(putNew(c, mass(c, 90, "2026-09-20T06:00:00.000Z", "2026-09-20"))).catch((e: unknown) => e);
      expect(isDataError(err, "ValidationFailed")).toBe(true);
    });

    it("podešavanja: podrazumevane vrednosti i upis", async () => {
      const { dp } = await setup();
      expect(await dp.settings.getAll()).toEqual({ lastExportAt: null, persistRequestedAt: null, persistGranted: null });
      await dp.settings.set("lastExportAt", "2026-09-20T10:00:00.000Z");
      expect((await dp.settings.getAll()).lastExportAt).toBe("2026-09-20T10:00:00.000Z");
    });

    it("backup: čitanje svega i zamena svega; podešavanja ostaju", async () => {
      const { dp, at } = await setup();
      const c = at("2026-09-20T06:00:00.000Z");
      const m = mass(c, 92.4, "2026-09-20T06:00:00.000Z", "2026-09-20");
      await dp.unitOfWork.commit(putNew(c, m));
      await dp.settings.set("lastExportAt", "2026-09-20T10:00:00.000Z");
      const snapshot = await dp.backup.readAllUserData();
      expect(snapshot.measurements.length).toBe(1);
      expect(snapshot.audit_events.length).toBe(1);
      await dp.backup.replaceAllUserData({ measurements: [], audit_events: [] });
      expect(await dp.measurements.countActive()).toBe(0);
      await dp.backup.replaceAllUserData(snapshot);
      expect(await dp.backup.readAllUserData()).toEqual(snapshot);
      expect((await dp.settings.getAll()).lastExportAt).toBe("2026-09-20T10:00:00.000Z");
    });

    it("zaštitne kopije: čuvaju se najviše 3", async () => {
      const { dp } = await setup();
      for (let i = 0; i < 5; i++) await dp.backup.saveSafetySnapshot("pre-import");
      expect((await dp.backup.listSafetySnapshots()).length).toBe(3);
    });

    it("tajne: upis, čitanje, brisanje; nisu deo korisničkih podataka", async () => {
      const { dp } = await setup();
      await dp.secrets.set("ai_api_key", "kljuc-123");
      expect(await dp.secrets.get("ai_api_key")).toBe("kljuc-123");
      expect(JSON.stringify(await dp.backup.readAllUserData())).not.toContain("kljuc-123");
      await dp.secrets.clear("ai_api_key");
      expect(await dp.secrets.get("ai_api_key")).toBeNull();
    });
  });
}
