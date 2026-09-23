// Učitavanje jednog FDC skupa (Foundation ili SR Legacy) iz raspakovane CSV arhive.
import { existsSync } from "node:fs";
import { join } from "node:path";
import { readTable } from "./csv.mjs";

export const DATA_TYPE = { foundation: "foundation_food", srLegacy: "sr_legacy_food" };

export function loadDataset(key, dir) {
  const dataType = DATA_TYPE[key];
  const foods = readTable(join(dir, "food.csv"), ["fdc_id", "data_type", "description"])
    .filter((f) => f.data_type === dataType);
  const ids = new Set(foods.map((f) => f.fdc_id));
  const nutrients = new Map(
    readTable(join(dir, "nutrient.csv"), ["id", "name", "unit_name"]).map((n) => [n.id, n]),
  );
  const values = new Map();
  for (const v of readTable(join(dir, "food_nutrient.csv"), ["fdc_id", "nutrient_id", "amount"])) {
    if (!ids.has(v.fdc_id)) continue;
    let m = values.get(v.fdc_id);
    if (!m) values.set(v.fdc_id, (m = new Map()));
    m.set(v.nutrient_id, v);
  }
  const ndbFile = join(dir, key === "foundation" ? "foundation_food.csv" : "sr_legacy_food.csv");
  const ndb = new Map();
  if (existsSync(ndbFile)) {
    for (const r of readTable(ndbFile, ["fdc_id", "NDB_number"])) ndb.set(r.fdc_id, r.NDB_number);
  }
  const portionFile = join(dir, "food_portion.csv");
  const portions = new Map();
  if (existsSync(portionFile)) {
    for (const p of readTable(portionFile, ["fdc_id", "gram_weight"])) {
      if (!ids.has(p.fdc_id)) continue;
      const list = portions.get(p.fdc_id) ?? [];
      list.push(p);
      portions.set(p.fdc_id, list);
    }
  }
  return { key, dataType, foods, nutrients, values, ndb, portions };
}
