// Use case-ovi za namirnice (ARCHITECTURE §17 korak 4): pretraga i detalj sa proračunom i poreklom („Zašto?", MS §31).
import type { ReferenceDataProvider, ReferenceDataInfo } from "../../ports/data";
import type { DisplayRuleSet, EnergyFormulaSet, Food } from "../../schemas";
import {
  DISPLAY_NUTRIENTS,
  availableCarbohydrateForAmount,
  displayEnergy,
  displayGrams,
  displayMg,
  displaySalt,
  energyForAmount,
  matchesQuery,
  nutrientsForAmount,
  saltGramsFromSodiumMg,
  type ConfidenceLevel,
  type Display,
  type DisplayNutrient,
} from "../../domain";

export interface FoodListItem {
  readonly id: string;
  readonly name: string;
  readonly form: string;
  readonly group: string;
  readonly kcalPer100g: Display;
  readonly incomplete: boolean;
}

export type RowKey = "fat" | "saturatedFat" | "availableCarbohydrate" | "sugars" | "fiber" | "protein" | "salt" | "sodium";

export interface NutrientRow {
  readonly key: RowKey;
  /** Podred („od toga") kao na deklaraciji (Prilog 14). */
  readonly sub: boolean;
  readonly display: Display;
  readonly unit: "g" | "mg";
  readonly level: ConfidenceLevel | null;
  readonly filled: boolean;
}

export interface FoodDetail {
  readonly id: string;
  readonly name: string;
  readonly nameCyrl: string;
  readonly form: string;
  readonly otherForms: readonly { id: string; form: string }[];
  readonly grams: number;
  readonly energy: Display;
  readonly energyLevel: ConfidenceLevel | null;
  readonly energyProblem: "missing" | "inconsistent" | null;
  readonly rows: readonly NutrientRow[];
  readonly portions: readonly { description: string; grams: number }[];
  readonly why: {
    readonly mapping: "TACNO" | "BLISKO";
    readonly source: Food["source"];
    readonly fill: Food["fill"];
    readonly filledNutrients: readonly DisplayNutrient[];
    readonly missing: readonly string[];
    readonly energyMethod: string;
    readonly energyFormulaVersion: string;
    readonly fdcEnergyKcal: number | null;
    readonly note: string | null;
    readonly foodsVersion: string;
    readonly attribution: string;
    readonly sourceFile: { url: string; sha256: string } | null;
  };
}

export interface FoodService {
  info(): Promise<ReferenceDataInfo>;
  search(query: string): Promise<readonly FoodListItem[]>;
  detail(id: string, grams: number): Promise<FoodDetail | null>;
}

export function createFoodService(ref: ReferenceDataProvider): FoodService {
  let cache: { foods: readonly Food[]; energy: EnergyFormulaSet; display: DisplayRuleSet; info: ReferenceDataInfo } | null = null;
  const load = async () =>
    (cache ??= {
      foods: await ref.listFoods(),
      energy: await ref.getEnergyFormula(),
      display: await ref.getDisplayRules(),
      info: await ref.info(),
    });

  return {
    info: async () => (await load()).info,

    async search(query) {
      const { foods, energy, display } = await load();
      return foods
        .filter((f) => matchesQuery([f.names.srLatn, f.names.srCyrl, ...f.names.aliases, ...f.names.searchKeys, f.form], query))
        .map((f) => {
          const e = energyForAmount(f, energy, 100);
          return {
            id: f.id,
            name: f.names.srLatn,
            form: f.form,
            group: f.group,
            kcalPer100g: e.ok ? displayEnergy(e.kcal, e.level, display) : ({ kind: "unknown" } as const),
            incomplete: f.missing.some((k) => k !== "water"),
          };
        });
    },

    async detail(id, grams) {
      const { foods, energy, display, info } = await load();
      const f = foods.find((x) => x.id === id);
      if (!f) return null;
      const n = nutrientsForAmount(f, grams);
      const e = energyForAmount(f, energy, grams);
      const row = (key: RowKey, sub: boolean, v: { value: number | null; level: ConfidenceLevel | null; origin: string | null }, unit: "g" | "mg"): NutrientRow => ({
        key,
        sub,
        display: unit === "mg" ? displayMg(v.value, v.level, display) : displayGrams(v.value, v.level, display),
        unit,
        level: v.level,
        filled: v.origin === "SR_FILL",
      });
      const na = n.sodium;
      const salt = { ...na, value: na.value === null ? null : saltGramsFromSodiumMg(na.value, energy) };
      // Redosled kao na srpskoj deklaraciji (Prilog 14): masti, zasićene, UH, šećeri, vlakna, proteini, so.
      const rows: NutrientRow[] = [
        row("fat", false, n.fat, "g"),
        row("saturatedFat", true, n.saturatedFat, "g"),
        row("availableCarbohydrate", false, availableCarbohydrateForAmount(f, grams), "g"),
        row("sugars", true, n.sugars, "g"),
        row("fiber", false, n.fiber, "g"),
        row("protein", false, n.protein, "g"),
        { ...row("salt", false, salt, "g"), display: displaySalt(salt.value, salt.level, display) },
        row("sodium", true, na, "mg"),
      ];
      const fdcE = f.fdcEnergy.energyAtwaterSpecific ?? f.fdcEnergy.energy ?? f.fdcEnergy.energyAtwaterGeneral ?? null;
      return {
        id: f.id,
        name: f.names.srLatn,
        nameCyrl: f.names.srCyrl,
        form: f.form,
        otherForms: foods.filter((x) => x.names.srLatn === f.names.srLatn && x.id !== f.id).map((x) => ({ id: x.id, form: x.form })),
        grams,
        energy: e.ok ? displayEnergy(e.kcal, e.level, display) : { kind: "unknown" },
        energyLevel: e.ok ? e.level : null,
        energyProblem: e.ok ? null : e.reason,
        rows,
        portions: f.portions.map((p) => ({ description: p.description, grams: p.gramWeight })),
        why: {
          mapping: f.mapping,
          source: f.source,
          fill: f.fill,
          filledNutrients: DISPLAY_NUTRIENTS.filter((k) => f.values[k]?.origin === "SR_FILL"),
          missing: f.missing.filter((k) => k !== "water"),
          energyMethod: "Prilog 13 Pravilnika o deklarisanju: 4·proteini + 4·(UH − vlakna) + 9·masti + 2·vlakna",
          energyFormulaVersion: energy.version,
          fdcEnergyKcal: fdcE === null ? null : (fdcE * grams) / 100,
          note: f.note ?? null,
          foodsVersion: info.foodsVersion,
          attribution: info.attribution,
          sourceFile: info.sources[f.source.dataset] ?? null,
        },
      };
    },
  };
}
