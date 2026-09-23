// Nutrijenti V1 (NUTRITION_ENGINE.md N3, odobreno DECISIONS/0008).
// Za svaki ID proverava se naziv i jedinica u nutrient.csv iz preuzete arhive; neslaganje zaustavlja uvoz.
export const TRACKED = [
  { key: "protein", ids: ["1003"], name: /^Protein$/, unit: "G" },
  { key: "fat", ids: ["1004"], name: /^Total lipid \(fat\)$/, unit: "G" },
  { key: "saturatedFat", ids: ["1258"], name: /^Fatty acids, total saturated$/, unit: "G" },
  { key: "carbohydrateByDifference", ids: ["1005"], name: /^Carbohydrate, by difference$/, unit: "G" },
  { key: "sugars", ids: ["2000", "1063"], name: /^(Sugars, total including NLEA|Total Sugars|Sugars, Total( NLEA)?)$/i, unit: "G" },
  { key: "fiber", ids: ["1079"], name: /^Fiber, total dietary$/, unit: "G" },
  { key: "sodium", ids: ["1093"], name: /^Sodium, Na$/, unit: "MG" },
  { key: "water", ids: ["1051"], name: /^Water$/, unit: "G" },
];
export const FDC_ENERGY = [
  { key: "energyAtwaterSpecific", id: "2048" },
  { key: "energyAtwaterGeneral", id: "2047" },
  { key: "energy", id: "1008" },
];
/** Nutrijenti potrebni za energiju po Prilogu 13 (N4-A). */
export const REQUIRED = ["protein", "fat", "saturatedFat", "carbohydrateByDifference", "sugars", "fiber", "sodium"];

export function verifyNutrientTable(ds) {
  const errors = [];
  for (const t of TRACKED) {
    for (const id of t.ids) {
      const n = ds.nutrients.get(id);
      if (!n) continue; // ID ne mora postojati u oba skupa (npr. 1063 samo u Foundation)
      if (!t.name.test(n.name) || n.unit_name.toUpperCase() !== t.unit) {
        errors.push(`${ds.key}: ID ${id} je "${n.name}" [${n.unit_name}], očekivano ${t.name} [${t.unit}]`);
      }
    }
    if (!t.ids.some((id) => ds.nutrients.has(id))) errors.push(`${ds.key}: nijedan ID za ${t.key} ne postoji`);
  }
  return errors;
}

/** Vrednost praćenog nutrijenta za jednu namirnicu: prvi ID koji ima vrednost. */
export function pick(ds, fdcId, t) {
  const m = ds.values.get(fdcId);
  if (!m) return null;
  for (const id of t.ids) {
    const v = m.get(id);
    if (v && v.amount !== "") return { nutrientId: id, row: v };
  }
  return null;
}
