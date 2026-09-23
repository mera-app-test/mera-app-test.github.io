// Energija po Prilogu 13 (NUTRITION_ENGINE.md N4-A). Ista formula kao src/domain/nutrition;
// test proverava da se alat i aplikacija slažu. Faktori dolaze iz reference-data/formulas/energy-*.json.
export function energyKcal(v, f) {
  if ([v.protein, v.fat, v.carbohydrateByDifference, v.fiber].some((x) => x == null)) return { ok: false, reason: "nedostaje" };
  const available = v.carbohydrateByDifference - v.fiber;
  if (available < 0) return { ok: false, reason: "vlakna veća od UH po razlici" };
  return { ok: true, kcal: f.protein * v.protein + f.carbohydrate * available + f.fat * v.fat + f.fiber * v.fiber, availableCarbohydrate: available };
}
