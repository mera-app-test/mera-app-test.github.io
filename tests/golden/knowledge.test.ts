// Baza znanja: provera pravog fajla, proračun, bezbednost, izveden upitnik, pretraga (DECISIONS/0011, 0012).
import { describe, expect, it } from "vitest";
import { KnowledgeFileSchema, type KnowledgeFile } from "../../src/schemas";
import { deriveQuestions, evaluate, searchKnowledge, validateKnowledge } from "../../src/domain";
import raw from "../../reference-data/knowledge/knowledge-0.1.0.json";

const kb = KnowledgeFileSchema.parse(raw);
const ALL = ["PREDLOG", "ODOBRENO"] as const;

describe("pravi fajl baze znanja", () => {
  it("prolazi šemu i sve provere", () => {
    expect(validateKnowledge(kb)).toEqual([]);
  });
  it("aplikacija ne koristi ništa što nije ODOBRENO", () => {
    expect(evaluate(kb, { sex: "m", ageYears: 40, heightCm: 180, massKg: 90, activity: "sedi", goal: "odrzavanje" }).trace).toEqual([]);
    expect(deriveQuestions(kb, "osnovni", {})).toEqual([]);
  });
});

describe("provere hvataju greške", () => {
  const broken = (patch: (k: KnowledgeFile) => void) => {
    const k = structuredClone(kb);
    patch(k);
    return validateKnowledge(k);
  };
  it("pitanje koje ne koristi nijedna stavka ne sme postojati", () => {
    const errs = broken((k) => k.facts.push({ key: "motivacija", label: "Motivacija", type: "enum", question: { text: "Šta te motivisalo?", level: "osnovni" } }));
    expect(errs.some((e) => e.includes("motivacija"))).toBe(true);
  });
  it("ODOBRENO bez izvora proverenog u originalu se odbija", () => {
    const errs = broken((k) => {
      k.entries[0]!.status = "ODOBRENO";
      k.entries[0]!.approved = { by: "vlasnik", date: "2026-09-23", decision: "test" };
      k.entries[0]!.sources = k.entries[0]!.sources.filter((s) => !s.checkedOriginal);
    });
    expect(errs.some((e) => e.includes("E-001") && e.includes("originalu"))).toBe(true);
  });
  it("korišćenje činjenice koja nije u inputs se odbija", () => {
    const errs = broken((k) => { k.entries[0]!.inputs = ["massKg"]; });
    expect(errs.some((e) => e.includes("E-001") && e.includes("heightCm"))).toBe(true);
  });
  it("kružna zavisnost se odbija", () => {
    const errs = broken((k) => {
      const e1 = k.entries.find((e) => e.id === "E-001")!;
      e1.inputs.push("tdeeKcal");
      e1.expr = { op: "add", args: [e1.expr!, { fact: "tdeeKcal" }] };
    });
    expect(errs.some((e) => e.startsWith("kružna"))).toBe(true);
  });
});

describe("proračun (sa PREDLOG stavkama, samo radi provere mehanizma)", () => {
  it("ručno izračunat slučaj: muškarac 40 god., 180 cm, 90 kg, sedi, mršavljenje", () => {
    // 10·90 + 6,25·180 − 5·40 + 5 = 1830; × 1,53 = 2799,9; − 500 = 2299,9
    const r = evaluate(kb, { sex: "m", ageYears: 40, heightCm: 180, massKg: 90, activity: "sedi", goal: "mrsavljenje" }, ALL);
    expect(r.facts.rmrKcal).toBeCloseTo(1830, 9);
    expect(r.facts.tdeeKcal).toBeCloseTo(2799.9, 9);
    expect(r.facts.targetKcal).toBeCloseTo(2299.9, 9);
    expect(r.trace.find((t) => t.output === "targetKcal")?.entryId).toBe("E-005");
    expect(r.safetyStatus).toBe("SAFE");
    expect(r.undecidedSafety).toEqual([]);
  });
  it("donja granica: žena 60 god., 155 cm, 50 kg, sedi → cilj 1200", () => {
    // 10·50 + 6,25·155 − 5·60 − 161 = 1007,75; × 1,53 = 1541,8575; − 500 = 1041,86 → 1200
    const r = evaluate(kb, { sex: "z", ageYears: 60, heightCm: 155, massKg: 50, activity: "sedi", goal: "mrsavljenje", pregnantOrLactating: false }, ALL);
    expect(r.facts.targetKcal).toBe(1200);
  });
  it("bezbednost: maloletnik, trudnoća, pothranjenost", () => {
    expect(evaluate(kb, { ageYears: 16 }, ALL).safetyStatus).toBe("BLOCKED");
    expect(evaluate(kb, { sex: "z", pregnantOrLactating: true, ageYears: 30 }, ALL).safetyStatus).toBe("REQUIRES_CLINICAL_REVIEW");
    expect(evaluate(kb, { sex: "z", ageYears: 30, heightCm: 170, massKg: 50, goal: "mrsavljenje", pregnantOrLactating: false }, ALL).safetyStatus).toBe("BLOCKED");
  });
  it("bez odgovora bezbednosna provera nije prošla — ostaje neodlučena, ne „bezbedno\"", () => {
    const r = evaluate(kb, { sex: "z", goal: "mrsavljenje" }, ALL);
    expect(r.safetyStatus).toBe("SAFE");
    expect(r.undecidedSafety).toEqual(expect.arrayContaining(["S-001", "S-002", "S-003"]));
  });
});

describe("upitnik izveden iz baze", () => {
  it("osnovni nivo: 6 pitanja za muškarca, 7 za ženu (trudnoća samo ženama)", () => {
    expect(deriveQuestions(kb, "osnovni", { sex: "m" }, ALL).map((q) => q.fact.key)).toEqual(["sex", "ageYears", "heightCm", "massKg", "activity", "goal"]);
    expect(deriveQuestions(kb, "osnovni", { sex: "z" }, ALL).map((q) => q.fact.key)).toContain("pregnantOrLactating");
  });
  it("svako pitanje zna koje ga stavke koriste", () => {
    const q = deriveQuestions(kb, "osnovni", { sex: "m" }, ALL).find((x) => x.fact.key === "activity")!;
    expect(q.usedBy).toEqual(["E-002"]);
  });
});

describe("pretraga za AI", () => {
  it("nalazi stavke po temi, latinicom i ćirilicom", () => {
    expect(searchKnowledge(kb, "trudnoća", ALL).map((e) => e.id)).toEqual(["S-002"]);
    expect(searchKnowledge(kb, "дефицит", ALL).map((e) => e.id)).toEqual(["E-005"]);
  });
});
