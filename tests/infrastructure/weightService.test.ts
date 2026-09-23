import "fake-indexeddb/auto";
import { IDBFactory } from "fake-indexeddb";
import { beforeEach, describe, expect, it } from "vitest";
import { createWeightService } from "../../src/application";
import { createLocalDataProvider } from "../../src/infrastructure/data-local";
import { seqIds } from "../support/fixtures";
import { loadTrendFormulaSet } from "../../src/infrastructure/reference-static/formulaSets";

beforeEach(() => {
  globalThis.indexedDB = new IDBFactory();
});

async function setup(opts: { persistThrows?: boolean } = {}) {
  let now = "2026-09-23T05:30:00.000Z";
  const ids = seqIds("w");
  const data = await createLocalDataProvider({ now: () => now, newId: ids });
  let persistRequests = 0;
  const svc = createWeightService({
    data,
    clock: {
      nowIso: () => now,
      localDate: () => now.slice(0, 10),
      timeZone: () => "Europe/Belgrade",
      isoAtLocalDate: (d) => `${d}${now.slice(10)}`,
    },
    ids: { newId: ids },
    persistence: {
      isPersisted: async () => false,
      requestPersist: async () => {
        persistRequests += 1;
        if (opts.persistThrows) throw new Error("pregledač odbio");
        return true;
      },
    },
    appVersion: "0.3.0+test",
    trendFormulas: loadTrendFormulaSet(),
  });
  return { data, svc, setNow: (v: string) => (now = v), persistRequests: () => persistRequests };
}

describe("telesna masa (use case nad LocalDataProvider-om)", () => {
  it("unos sa zarezom se čuva nezaokružen, sa auditom, i postaje poslednje merenje", async () => {
    const t = await setup();
    const r = await t.svc.log({ valueText: "92,45" });
    expect(r.ok).toBe(true);
    const o = await t.svc.overview();
    expect(o.latest?.valueKg).toBe(92.45);
    expect(o.latest?.localDate).toBe("2026-09-23");
    expect(o.latest?.timeKnown).toBe(true);
    expect(o.yesterday).toBe("2026-09-22");
    const audit = await t.data.audit.listForEntity({ entity: "measurements", id: o.latest!.id });
    expect(audit.map((a) => a.useCase)).toEqual(["logWeight"]);
  });

  it("neispravan unos ne upisuje ništa i vraća poruku", async () => {
    const t = await setup();
    const r = await t.svc.log({ valueText: "92,4,1" });
    expect(r).toEqual({ ok: false, message: expect.any(String) });
    expect(await t.data.measurements.countActive()).toBe(0);
    expect(t.persistRequests()).toBe(0);
  });

  it("budući dan i neispravan datum se odbijaju", async () => {
    const t = await setup();
    expect((await t.svc.log({ valueText: "90", localDate: "2026-09-24" })).ok).toBe(false);
    expect((await t.svc.log({ valueText: "90", localDate: "2026-02-30" })).ok).toBe(false);
    expect(await t.data.measurements.countActive()).toBe(0);
  });

  it("naknadni unos za raniji dan: ispravan datum, vreme se ne prikazuje, poslednje merenje ostaje najnovije", async () => {
    const t = await setup();
    await t.svc.log({ valueText: "92,0" });
    const back = await t.svc.log({ valueText: "93,1", localDate: "2026-09-20" });
    expect(back.ok && back.entry.timeKnown).toBe(false);
    expect(back.ok && back.entry.localDate).toBe("2026-09-20");
    expect((await t.svc.overview()).latest?.valueKg).toBe(92);
  });

  it("lista: najnovije prvo, samo zadati broj dana", async () => {
    const t = await setup();
    await t.svc.log({ valueText: "95", localDate: "2026-08-01" });
    await t.svc.log({ valueText: "93", localDate: "2026-09-21" });
    await t.svc.log({ valueText: "92" });
    const list = await t.svc.listRecent(7);
    expect(list.map((m) => m.valueKg)).toEqual([92, 93]);
  });

  it("brisanje je meko, sa auditom; drugo brisanje istog zapisa daje poruku", async () => {
    const t = await setup();
    const r = await t.svc.log({ valueText: "92,4" });
    if (!r.ok) throw new Error("unos nije uspeo");
    expect(await t.svc.remove(r.entry.id)).toEqual({ ok: true });
    expect((await t.svc.overview()).latest).toBeNull();
    expect(await t.svc.listRecent(7)).toEqual([]);
    const audit = await t.data.audit.listForEntity({ entity: "measurements", id: r.entry.id });
    expect(audit.map((a) => a.useCase)).toEqual(["logWeight", "deleteWeight"]);
    expect((await t.svc.remove(r.entry.id)).ok).toBe(false);
  });

  it("trajno skladište se traži jednom, posle prvog uspešnog upisa", async () => {
    const t = await setup();
    expect(t.persistRequests()).toBe(0);
    await t.svc.log({ valueText: "92" });
    await t.svc.log({ valueText: "91,8" });
    expect(t.persistRequests()).toBe(1);
    expect((await t.data.settings.getAll()).persistGranted).toBe(true);
  });

  it("greška pri zahtevu za trajno skladište ne poništava sačuvano merenje", async () => {
    const t = await setup({ persistThrows: true });
    const r = await t.svc.log({ valueText: "92" });
    expect(r.ok).toBe(true);
    expect(await t.data.measurements.countActive()).toBe(1);
  });
});

describe("T5 i trend kroz use case", () => {
  it("924 kg traži potvrdu i ne upisuje; posle potvrde se upisuje", async () => {
    const t = await setup();
    const r = await t.svc.log({ valueText: "924" });
    expect(r).toMatchObject({ ok: false, needsConfirmation: true, valueKg: 924 });
    expect(await t.data.measurements.countActive()).toBe(0);
    expect((await t.svc.log({ valueText: "924", confirmed: true })).ok).toBe(true);
    expect(await t.data.measurements.countActive()).toBe(1);
  });

  it("trend koristi odobreni skup i merenja iz baze", async () => {
    const t = await setup();
    for (const [d, v] of [["2026-09-17", "93"], ["2026-09-19", "92,8"], ["2026-09-21", "92,6"], ["2026-09-22", "92,5"]] as const) {
      await t.svc.log({ valueText: v, localDate: d });
    }
    await t.svc.log({ valueText: "92,4" });
    const a = await t.svc.trend();
    expect(a.formulaSetVersion).toBe("1.0.0");
    expect(a.average).toMatchObject({ ok: true, days: 5 });
    expect(a.average.ok && a.average.averageKg).toBeCloseTo((93 + 92.8 + 92.6 + 92.5 + 92.4) / 5, 10);
  });
});
