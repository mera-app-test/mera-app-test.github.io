// Upitnik osnovnog nivoa i dnevni cilj (DECISIONS/0012 t. 2, 0016) nad LocalDataProvider-om i pravom bazom znanja.
// Očekivane vrednosti izračunate ručno po stavkama baze znanja 0.4.0 (E-001…E-011, S-001…S-004).
import "fake-indexeddb/auto";
import { IDBFactory } from "fake-indexeddb";
import { beforeEach, describe, expect, it } from "vitest";
import { createProfileService, createWeightService, type Facts } from "../../src/application";
import { createLocalDataProvider } from "../../src/infrastructure/data-local";
import { createStaticReferenceData } from "../../src/infrastructure/reference-static/referenceData";
import { loadTrendFormulaSet } from "../../src/infrastructure/reference-static/formulaSets";
import { seqIds } from "../support/fixtures";

beforeEach(() => {
  globalThis.indexedDB = new IDBFactory();
});

async function setup() {
  let now = "2026-09-24T06:00:00.000Z";
  const ids = seqIds("p");
  const data = await createLocalDataProvider({ now: () => now, newId: ids });
  const clock = {
    nowIso: () => now,
    localDate: () => now.slice(0, 10),
    timeZone: () => "Europe/Belgrade",
    isoAtLocalDate: (d: string) => `${d}${now.slice(10)}`,
  };
  const persistence = { isPersisted: async () => false, requestPersist: async () => true };
  const deps = { data, clock, ids: { newId: ids }, persistence, appVersion: "0.6.0+test", trendFormulas: loadTrendFormulaSet() };
  const profile = createProfileService({ ...deps, reference: createStaticReferenceData() });
  const weight = createWeightService(deps);
  return { data, profile, weight, setNow: (v: string) => (now = v) };
}

// Muškarac 40 god, 180 cm, 90 kg, mahom sedi, mršavljenje umereno, željena masa 80 kg.
// E-001: 10·90 + 6,25·180 − 5·40 + 5 = 1830; E-002: 1,53; E-003: 1830·1,53 = 2799,9; E-008: 500; E-005: 2299,9 → prikaz ≈2300.
const MAN: Facts = { sex: "m", ageYears: 40, heightCm: 180, massKg: 90, activity: "sedi", goal: "mrsavljenje", targetMassKg: 80, pace: "umereno" };

describe("upitnik: pitanja iz baze znanja", () => {
  it("osnovni nivo, redosled iz baze; uslovna pitanja se pojavljuju tek kad važe", async () => {
    const { profile } = await setup();
    const keys = async (a: Facts) => (await profile.questions(a)).questions.map((q) => q.key);
    expect(await keys({})).toEqual(["sex", "ageYears", "heightCm", "massKg", "activity", "goal"]);
    expect(await keys({ sex: "z" })).toContain("pregnantOrLactating");
    expect(await keys({ goal: "mrsavljenje" })).toEqual(expect.arrayContaining(["targetMassKg", "pace"]));
    expect(await keys({ goal: "mrsavljenje", pace: "sam" })).toContain("customDeficitKcal");
    expect(await keys({})).not.toContain("knownTdeeKcal"); // napredni nivo
  });

  it("odgovori koji više ne važe se uklanjaju (promena cilja briše tempo i željenu masu)", async () => {
    const { profile } = await setup();
    const r = await profile.questions({ ...MAN, pace: "sam", customDeficitKcal: 300, goal: "odrzavanje" });
    expect(Object.keys(r.answers).sort()).toEqual(["activity", "ageYears", "goal", "heightCm", "massKg", "sex"]);
  });

  it("brojčani odgovori: zarez, opseg iz baze, potvrda neuobičajene mase (T5)", async () => {
    const { profile } = await setup();
    expect(await profile.parseAnswer("massKg", "92,4")).toEqual({ ok: true, value: 92.4 });
    expect(await profile.parseAnswer("ageYears", "130")).toMatchObject({ ok: false });
    expect(await profile.parseAnswer("heightCm", "abc")).toMatchObject({ ok: false });
    expect(await profile.parseAnswer("massKg", "25")).toMatchObject({ ok: false, needsConfirmation: true, value: 25 });
    expect(await profile.parseAnswer("massKg", "25", true)).toEqual({ ok: true, value: 25 });
  });
});

describe("dnevni cilj", () => {
  it("čuvanje: cilj ≈2300 kcal, „Zašto?\" sa stavkama i verzijama, masa upisana kao merenje, audit", async () => {
    const { profile, data } = await setup();
    expect((await profile.current()).kind).toBe("none");
    const prev = await profile.preview(MAN);
    expect(prev.canSave).toBe(true);
    expect(prev.logsNewMass).toBe(true);
    expect(await profile.save(MAN)).toEqual({ ok: true });

    const s = await profile.current();
    if (s.kind !== "saved") throw new Error("nema profila");
    expect(s.stale).toBe(false);
    expect(s.view.outcome).toBe("cilj");
    expect(s.view.target).toEqual({ kind: "approx", value: 2300, decimals: 0 });
    expect(s.view.deficit).toEqual({ kind: "exact", value: 500, decimals: 0 });
    expect(s.view.weeklyLoss).toEqual({ kind: "approx", value: 0.5, decimals: 1 });
    expect(s.view.floorApplied).toBe(false);
    expect(s.view.goalLabel).toBe("smršati");
    expect(s.view.why.map((w) => [w.key, w.entryId])).toEqual([
      ["rmrKcal", "E-001"],
      ["pal", "E-002"],
      ["tdeeKcal", "E-003"],
      ["deficitKcal", "E-008"],
      ["targetKcal", "E-005"],
      ["weeklyLossKg", "E-010"],
    ]); // ITM (E-006, E-011) se ne prikazuje
    expect(s.view.why.find((w) => w.key === "tdeeKcal")!.display).toEqual({ kind: "approx", value: 2800, decimals: 0 });
    expect(s.view.why.every((w) => /^\d+\.\d+\.\d+$/.test(w.version) && w.statement.length > 0)).toBe(true);
    expect(s.view.explanations.map((e) => e.entryId)).toEqual(["X-001"]);

    const snap = (await data.profiles.current())!;
    expect(snap.result!.targetKcal).toBeCloseTo(2299.9, 6);
    expect(snap.result!.knowledgeVersion).toBe("0.4.0");
    const m = await data.measurements.get(snap.massMeasurementId!);
    expect([m.value, m.localDate]).toEqual([90, "2026-09-24"]);
    const audit = await data.audit.listForEntity({ entity: "profile_snapshots", id: snap.id });
    expect(audit.map((a) => [a.useCase, a.entityRefs.length])).toEqual([["saveProfile", 2]]);
  });

  it("masa iz upitnika i merenja su isti podatak: ista vrednost kao poslednje merenje → bez novog merenja", async () => {
    const { profile, weight, data } = await setup();
    await weight.log({ valueText: "90" });
    const latest = (await data.measurements.latest("body_mass"))!;
    expect((await profile.start()).answers.massKg).toBe(90); // predlog iz poslednjeg merenja
    expect((await profile.preview(MAN)).logsNewMass).toBe(false);
    await profile.save(MAN);
    expect((await data.profiles.current())!.massMeasurementId).toBe(latest.id);
    expect(await data.measurements.countActive()).toBe(1);
  });

  it("nova merenja ne menjaju cilj sama od sebe (MS §11); izmena odgovora predlaže poslednju masu", async () => {
    const { profile, weight, setNow } = await setup();
    await profile.save(MAN);
    setNow("2026-09-25T06:00:00.000Z");
    await weight.log({ valueText: "89" });
    const s = await profile.current();
    expect(s.kind === "saved" && s.view.massKg).toBe(90);
    expect(s.kind === "saved" && s.view.target).toEqual({ kind: "approx", value: 2300, decimals: 0 });
    expect((await profile.start()).answers.massKg).toBe(89);
  });

  it("ponovni proračun koristi isto merenje, ne pravi novo", async () => {
    const { profile, weight, data, setNow } = await setup();
    await profile.save(MAN);
    const first = (await data.profiles.current())!;
    setNow("2026-09-25T06:00:00.000Z");
    await weight.log({ valueText: "89" });
    expect(await profile.recompute()).toEqual({ ok: true });
    const second = (await data.profiles.current())!;
    expect(second.id).not.toBe(first.id);
    expect(second.massMeasurementId).toBe(first.massMeasurementId);
    expect(await data.measurements.countActive()).toBe(2);
    expect((await data.profiles.listActive()).length).toBe(2); // istorija ostaje
  });

  it("održavanje: cilj = dnevna potrošnja ≈2800 kcal, bez manjka i tempa", async () => {
    const { profile } = await setup();
    await profile.save({ sex: "m", ageYears: 40, heightCm: 180, massKg: 90, activity: "sedi", goal: "odrzavanje" });
    const s = await profile.current();
    if (s.kind !== "saved") throw new Error();
    expect(s.view.target).toEqual({ kind: "approx", value: 2800, decimals: 0 });
    expect([s.view.deficit, s.view.weeklyLoss]).toEqual([null, null]);
  });

  it("donja granica (E-005): žena 60 god, 155 cm, 55 kg, brže → 868 kcal se podiže na 1200", async () => {
    // E-001: 550 + 968,75 − 300 − 161 = 1057,75; ×1,53 = 1618,36; −750 = 868,36 → max(…, 1200) = 1200.
    const { profile } = await setup();
    await profile.save({ sex: "z", ageYears: 60, heightCm: 155, massKg: 55, activity: "sedi", goal: "mrsavljenje", targetMassKg: 50, pace: "brze", pregnantOrLactating: false });
    const s = await profile.current();
    if (s.kind !== "saved") throw new Error();
    expect(s.view.target).toEqual({ kind: "approx", value: 1200, decimals: 0 });
    expect(s.view.floorApplied).toBe(true);
  });

  it("nepotpuni odgovori bez bezbednosne prepreke se ne čuvaju", async () => {
    const { profile, data } = await setup();
    const { goal: _g, ...partial } = MAN;
    expect((await profile.preview(partial)).canSave).toBe(false);
    expect(await profile.save(partial)).toMatchObject({ ok: false });
    expect(await data.profiles.current()).toBeNull();
    expect(await data.measurements.countActive()).toBe(0);
  });
});

describe("bezbednost (MS §32): nema plana, poruka iz baze", () => {
  it("mlađi od 18 (S-001): plan se ne pravi ni kad nisu odgovorena ostala pitanja", async () => {
    const { profile } = await setup();
    const p = await profile.preview({ sex: "m", ageYears: 16 });
    expect(p.view.outcome).toBe("bez-plana");
    expect(p.canSave).toBe(true);
    await profile.save({ sex: "m", ageYears: 16 });
    const s = await profile.current();
    if (s.kind !== "saved") throw new Error();
    expect(s.view.outcome).toBe("bez-plana");
    expect(s.view.target).toBeNull();
    expect(s.view.why).toEqual([]);
    expect(s.view.notices.map((n) => [n.entryId, n.status])).toEqual([["S-001", "BLOCKED"]]);
  });

  it("trudnoća ili dojenje (S-002): potreban lekar, bez cilja", async () => {
    const { profile } = await setup();
    const p = await profile.preview({ sex: "z", ageYears: 30, heightCm: 165, massKg: 60, activity: "sedi", goal: "odrzavanje", pregnantOrLactating: true });
    expect(p.view.outcome).toBe("bez-plana");
    expect(p.view.notices.map((n) => n.status)).toEqual(["REQUIRES_CLINICAL_REVIEW"]);
  });

  it("željena masa ispod ITM 18,5 (S-004): nema plana", async () => {
    const { profile } = await setup();
    const p = await profile.preview({ ...MAN, targetMassKg: 55 }); // 55 / 1,8² = 16,98
    expect(p.view.outcome).toBe("bez-plana");
    expect(p.view.notices.map((n) => n.entryId)).toEqual(["S-004"]);
  });

  it("neodgovoreno bezbednosno pitanje (trudnoća) → nema plana dok se ne odgovori", async () => {
    const { profile } = await setup();
    const p = await profile.preview({ sex: "z", ageYears: 30, heightCm: 165, massKg: 60, activity: "sedi", goal: "odrzavanje" });
    expect(p.view.outcome).toBe("nepotpuno");
    expect(p.canSave).toBe(false);
  });
});

describe("brisanje odgovora (MS §8)", () => {
  it("briše sadržaj svih snapshot-ova, merenja ostaju, audit beleži brisanje", async () => {
    const { profile, data } = await setup();
    await profile.save(MAN);
    await profile.save({ ...MAN, activity: "aktivan" });
    await profile.clear();
    expect((await profile.current()).kind).toBe("none");
    const all = await data.backup.readAllUserData();
    expect(all.profile_snapshots).toHaveLength(2);
    expect(all.profile_snapshots.every((p) => p.deletedAt !== null && Object.keys(p.answers).length === 0 && p.result === null && p.massMeasurementId === null)).toBe(true);
    expect(await data.measurements.countActive()).toBe(1);
    expect(all.audit_events.map((a) => a.useCase)).toContain("clearProfile");
  });
});
