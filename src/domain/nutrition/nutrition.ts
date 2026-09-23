// Nutritivni proračuni (MS §22; NUTRITION_ENGINE.md N3, N4, P1). Čiste funkcije.
import type { EnergyFormulaSet, Food, NutrientKey } from "../../schemas";
import { weakest, levelForValue, type ConfidenceLevel } from "../confidence/confidence";

export const DISPLAY_NUTRIENTS = ["protein", "fat", "saturatedFat", "carbohydrateByDifference", "sugars", "fiber", "sodium"] as const satisfies readonly NutrientKey[];
export type DisplayNutrient = (typeof DISPLAY_NUTRIENTS)[number];

export interface NutrientAmount {
  /** null = nepoznato (nikad se ne računa kao 0). */
  readonly value: number | null;
  readonly level: ConfidenceLevel | null;
  readonly origin: "PRIMARY" | "SR_FILL" | null;
}

export type EnergyResult =
  | { readonly ok: true; readonly kcal: number; readonly availableCarbohydrate: number; readonly level: ConfidenceLevel }
  | { readonly ok: false; readonly reason: "missing" | "inconsistent"; readonly missing: readonly NutrientKey[] };

/** N4-A: kcal = 4·P + 4·(UH po razlici − vlakna) + 9·M + 2·vlakna. Na 100 g namirnice. */
export function energyPer100g(food: Food, formula: EnergyFormulaSet): EnergyResult {
  const need: NutrientKey[] = ["protein", "fat", "carbohydrateByDifference", "fiber"];
  const missing = need.filter((k) => food.values[k] === undefined);
  if (missing.length) return { ok: false, reason: "missing", missing };
  const v = (k: NutrientKey) => food.values[k]!.value;
  const available = v("carbohydrateByDifference") - v("fiber");
  if (available < 0) return { ok: false, reason: "inconsistent", missing: [] };
  const f = formula.kcalPerGram;
  const kcal = f.protein * v("protein") + f.carbohydrate * available + f.fat * v("fat") + f.fiber * v("fiber");
  // P1: izračunata energija je najviše DOBRO POTVRĐENO.
  const level = weakest([...need.map((k) => levelForValue(food.mapping, food.values[k]!.origin)), "DOBRO_POTVRDJENO"]);
  return { ok: true, kcal, availableCarbohydrate: available, level };
}

/** Vrednosti za datu količinu (g). Linearno skaliranje; nepoznato ostaje nepoznato. */
export function nutrientsForAmount(food: Food, grams: number): Record<DisplayNutrient, NutrientAmount> {
  const out = {} as Record<DisplayNutrient, NutrientAmount>;
  for (const k of DISPLAY_NUTRIENTS) {
    const nv = food.values[k];
    out[k] = nv
      ? { value: (nv.value * grams) / 100, level: levelForValue(food.mapping, nv.origin), origin: nv.origin }
      : { value: null, level: null, origin: null };
  }
  return out;
}

export function energyForAmount(food: Food, formula: EnergyFormulaSet, grams: number): EnergyResult {
  const e = energyPer100g(food, formula);
  return e.ok ? { ...e, kcal: (e.kcal * grams) / 100, availableCarbohydrate: (e.availableCarbohydrate * grams) / 100 } : e;
}

export interface SumItem {
  readonly nutrients: Record<DisplayNutrient, NutrientAmount>;
  readonly energy: EnergyResult;
}
export interface SumResult {
  readonly nutrients: Record<DisplayNutrient, { value: number; complete: boolean; level: ConfidenceLevel | null }>;
  readonly energy: { value: number; complete: boolean; level: ConfidenceLevel | null };
}

/** Zbir (obrok, dan). Nivo = najslabija stavka (P1); nedostajuća vrednost čini zbir nepotpunim. */
export function sumItems(items: readonly SumItem[]): SumResult {
  const nutrients = {} as SumResult["nutrients"];
  for (const k of DISPLAY_NUTRIENTS) {
    const parts = items.map((i) => i.nutrients[k]);
    const known = parts.filter((p) => p.value !== null);
    nutrients[k] = {
      value: known.reduce((s, p) => s + (p.value as number), 0),
      complete: known.length === parts.length,
      level: known.length ? weakest(known.map((p) => p.level as ConfidenceLevel)) : null,
    };
  }
  const okE = items.map((i) => i.energy).filter((e): e is Extract<EnergyResult, { ok: true }> => e.ok);
  return {
    nutrients,
    energy: {
      value: okE.reduce((s, e) => s + e.kcal, 0),
      complete: okE.length === items.length,
      level: okE.length ? weakest(okE.map((e) => e.level)) : null,
    },
  };
}

/** So (g) iz natrijuma (mg): Pravilnik čl. 2 t. 28. */
export function saltGramsFromSodiumMg(sodiumMg: number, formula: EnergyFormulaSet): number {
  return (sodiumMg / 1000) * formula.saltPerSodium;
}

/** Iskoristivi ugljeni hidrati (kao na deklaraciji, N4-A): UH po razlici − vlakna. Nepoznato ako fali bilo koji deo. */
export function availableCarbohydrateForAmount(food: Food, grams: number): NutrientAmount & { readonly inconsistent: boolean } {
  const c = food.values.carbohydrateByDifference;
  const fi = food.values.fiber;
  if (!c || !fi) return { value: null, level: null, origin: null, inconsistent: false };
  const per100 = c.value - fi.value;
  if (per100 < 0) return { value: null, level: null, origin: null, inconsistent: true };
  const origin = c.origin === "SR_FILL" || fi.origin === "SR_FILL" ? "SR_FILL" : "PRIMARY";
  return {
    value: (per100 * grams) / 100,
    level: weakest([levelForValue(food.mapping, c.origin), levelForValue(food.mapping, fi.origin), "DOBRO_POTVRDJENO"]),
    origin,
    inconsistent: false,
  };
}
