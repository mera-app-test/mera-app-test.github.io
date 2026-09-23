// Zlatni slučajevi i svojstva nutritivnog proračuna (NUTRITION_ENGINE.md N4-A, P1–P3; ARCHITECTURE §16).
import { describe, expect, it } from "vitest";
import fc from "fast-check";
import { DisplayRuleSetSchema, EnergyFormulaSetSchema, FoodsFileSchema, type Food } from "../../src/schemas";
import {
  availableCarbohydrateForAmount,
  displayEnergy,
  displayGrams,
  displaySalt,
  energyForAmount,
  energyPer100g,
  levelForValue,
  matchesQuery,
  nutrientsForAmount,
  saltGramsFromSodiumMg,
  sumItems,
  weakest,
} from "../../src/domain";
import foodsRaw from "../../reference-data/foods/foods-1.0.0.json";
import energyRaw from "../../reference-data/formulas/energy-label-1.0.0.json";
import displayRaw from "../../reference-data/formulas/display-1.0.0.json";
// @ts-expect-error — .mjs alat za uvoz nema tipove; koristi se samo za proveru slaganja.
import { energyKcal as toolEnergy } from "../../scripts/fdc/energy.mjs";

const file = FoodsFileSchema.parse(foodsRaw);
const energy = EnergyFormulaSetSchema.parse(energyRaw);
const display = DisplayRuleSetSchema.parse(displayRaw);
const food = (id: string): Food => {
  const f = file.foods.find((x) => x.id === id);
  if (!f) throw new Error(id);
  return f;
};

describe("referentni fajl namirnica", () => {
  it("prolazi šemu, ima 96 namirnica sa jedinstvenim ID-jem i čeka odobrenje", () => {
    expect(file.foods).toHaveLength(96);
    expect(new Set(file.foods.map((f) => f.id)).size).toBe(96);
    expect(file.status).toBe("CEKA_ODOBRENJE");
  });
  it("svaka namirnica ima izvor iz FDC i ćirilični naziv", () => {
    for (const f of file.foods) {
      expect(f.source.fdcId).toMatch(/^\d+$/);
      expect(f.names.srCyrl).toMatch(/[\u0400-\u04FF]/);
    }
  });
});

describe("energija po Prilogu 13 — ručno izračunati slučajevi", () => {
  // Ručni proračun: 4·P + 4·(UH − vlakna) + 9·M + 2·vlakna, vrednosti iz izveštaja uvoza 1.0.0.
  it("pirinač beli, kuvan: 4·2,69 + 4·27,77 + 9·0,28 + 2·0,4 = 125,16", () => {
    const e = energyPer100g(food("pirinac-beli-kuvan"), energy);
    expect(e.ok && e.kcal).toBeCloseTo(125.16, 6);
  });
  it("jaje: 4·12,4 + 4·0,96 + 9·9,96 + 0 = 143,08", () => {
    const e = energyPer100g(food("jaje"), energy);
    expect(e.ok && e.kcal).toBeCloseTo(143.08, 6);
  });
  it("ovsene pahuljice (vlakna dopunjena iz SR): 360,426", () => {
    const e = energyPer100g(food("ovsene-pahuljice"), energy);
    expect(e.ok && e.kcal).toBeCloseTo(360.426, 6);
    expect(e.ok && e.level).toBe("DOBRO_POTVRDJENO");
  });
  it("alat za uvoz i aplikacija daju istu energiju za sve namirnice", () => {
    for (const f of file.foods) {
      const plain = Object.fromEntries(Object.entries(f.values).map(([k, v]) => [k, v?.value]));
      const t = toolEnergy(plain, energy.kcalPerGram) as { ok: boolean; kcal?: number };
      const d = energyPer100g(f, energy);
      expect(d.ok, f.id).toBe(t.ok);
      if (d.ok && t.ok) expect(d.kcal, f.id).toBeCloseTo(t.kcal!, 9);
    }
  });
});

describe("nepoznato nije nula", () => {
  it("sočivo (Foundation bez vlakana): energija se ne računa", () => {
    const e = energyPer100g(food("sociva"), energy);
    expect(e).toEqual({ ok: false, reason: "missing", missing: ["fiber"] });
    expect(nutrientsForAmount(food("sociva"), 100).fiber.value).toBeNull();
  });
  it("zbir sa jednom nepoznatom vrednošću je nepotpun", () => {
    const a = { nutrients: nutrientsForAmount(food("sociva"), 50), energy: energyForAmount(food("sociva"), energy, 50) };
    const b = { nutrients: nutrientsForAmount(food("jaje"), 50), energy: energyForAmount(food("jaje"), energy, 50) };
    const s = sumItems([a, b]);
    expect(s.nutrients.fiber.complete).toBe(false);
    expect(s.energy.complete).toBe(false);
    expect(s.nutrients.protein.complete).toBe(true);
  });
  it("vlakna veća od UH po razlici → nekonzistentno, ne negativan broj", () => {
    const base = food("jaje");
    const bad: Food = { ...base, values: { ...base.values, carbohydrateByDifference: { value: 1, nutrientId: "1005", origin: "PRIMARY" }, fiber: { value: 2, nutrientId: "1079", origin: "PRIMARY" } } };
    expect(energyPer100g(bad, energy)).toMatchObject({ ok: false, reason: "inconsistent" });
    expect(availableCarbohydrateForAmount(bad, 100)).toMatchObject({ value: null, inconsistent: true });
  });
});

describe("svojstva", () => {
  const ids = file.foods.map((f) => f.id);
  it("energija i nutrijenti se linearno skaliraju sa količinom", () => {
    fc.assert(
      fc.property(fc.constantFrom(...ids), fc.double({ min: 1, max: 1000, noNaN: true }), (id, g) => {
        const f = food(id);
        const e100 = energyForAmount(f, energy, 100);
        const eg = energyForAmount(f, energy, g);
        if (e100.ok && eg.ok) expect(eg.kcal).toBeCloseTo((e100.kcal * g) / 100, 6);
        const p100 = nutrientsForAmount(f, 100).protein.value;
        const pg = nutrientsForAmount(f, g).protein.value;
        if (p100 !== null) expect(pg).toBeCloseTo((p100 * g) / 100, 9);
      }),
    );
  });
  it("zbir je jednak zbiru delova", () => {
    fc.assert(
      fc.property(fc.array(fc.tuple(fc.constantFrom(...ids), fc.double({ min: 1, max: 500, noNaN: true })), { minLength: 1, maxLength: 6 }), (parts) => {
        const items = parts.map(([id, g]) => ({ nutrients: nutrientsForAmount(food(id), g), energy: energyForAmount(food(id), energy, g) }));
        const s = sumItems(items);
        const expected = items.reduce((acc, i) => acc + (i.nutrients.fat.value ?? 0), 0);
        expect(s.nutrients.fat.value).toBeCloseTo(expected, 9);
      }),
    );
  });
});

describe("pouzdanost (P1)", () => {
  it("TAČNO + izabrani zapis → pouzdano; dopuna ili BLISKO → dobro potvrđeno", () => {
    expect(levelForValue("TACNO", "PRIMARY")).toBe("POUZDANO");
    expect(levelForValue("TACNO", "SR_FILL")).toBe("DOBRO_POTVRDJENO");
    expect(levelForValue("BLISKO", "PRIMARY")).toBe("DOBRO_POTVRDJENO");
  });
  it("najslabija karika", () => {
    expect(weakest(["POUZDANO", "PROCENJENO", "DOBRO_POTVRDJENO"])).toBe("PROCENJENO");
  });
});

describe("prikaz (P2, P3)", () => {
  it("energija: pouzdano → ceo broj; procenjeno → ≈ na 10; interval → raspon", () => {
    expect(displayEnergy(125.16, "DOBRO_POTVRDJENO", display)).toEqual({ kind: "exact", value: 125, decimals: 0 });
    expect(displayEnergy(496, "PROCENJENO", display)).toEqual({ kind: "approx", value: 500, decimals: 0 });
    expect(displayEnergy(500, "PROCENJENO", display, [478, 532])).toEqual({ kind: "range", low: 480, high: 530, decimals: 0 });
    expect(displayEnergy(null, null, display)).toEqual({ kind: "unknown" });
  });
  it("grami: ≥10 ceo broj, <10 jedna decimala, 0<x<0,5 „< 0,5\", 0 je 0", () => {
    expect(displayGrams(22.46, "POUZDANO", display)).toEqual({ kind: "exact", value: 22, decimals: 0 });
    expect(displayGrams(2.69, "POUZDANO", display)).toEqual({ kind: "exact", value: 2.7, decimals: 1 });
    expect(displayGrams(0.28, "POUZDANO", display)).toEqual({ kind: "trace", below: 0.5 });
    expect(displayGrams(0, "POUZDANO", display)).toEqual({ kind: "exact", value: 0, decimals: 1 });
  });
  it("so = natrijum × 2,5 (Pravilnik čl. 2 t. 28)", () => {
    expect(saltGramsFromSodiumMg(400, energy)).toBeCloseTo(1, 12);
    expect(displaySalt(1.04, "POUZDANO", display)).toEqual({ kind: "exact", value: 1, decimals: 1 });
  });
});

describe("pretraga (N5)", () => {
  const keys = (id: string) => {
    const f = food(id);
    return [f.names.srLatn, f.names.srCyrl, ...f.names.aliases];
  };
  it("latinica, ćirilica, bez dijakritika i sinonimi", () => {
    expect(matchesQuery(keys("sociva"), "сочиво")).toBe(true);
    expect(matchesQuery(keys("sargarepa"), "sargarepa")).toBe(true);
    expect(matchesQuery(keys("sargarepa"), "mrkva")).toBe(true);
    expect(matchesQuery(keys("pirinac-beli"), "riza")).toBe(true);
    expect(matchesQuery(keys("piletina-belo"), "pil file")).toBe(true);
    expect(matchesQuery(keys("jaje"), "sir")).toBe(false);
  });
});
