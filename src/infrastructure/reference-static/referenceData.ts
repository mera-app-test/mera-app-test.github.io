// Statička implementacija ReferenceDataProvider-a: fajlovi iz reference-data/, provera šemom pri učitavanju.
// Neispravan fajl zaustavlja pokretanje umesto tihe greške.
import { DisplayRuleSetSchema, EnergyFormulaSetSchema, FoodsFileSchema, KnowledgeFileSchema, type Food } from "../../schemas";
import { validateKnowledge } from "../../domain";
import type { ReferenceDataProvider } from "../../ports/data";
import foodsRaw from "../../../reference-data/foods/foods-1.1.0.json";
import energyRaw from "../../../reference-data/formulas/energy-label-1.0.0.json";
import displayRaw from "../../../reference-data/formulas/display-1.0.0.json";
import knowledgeRaw from "../../../reference-data/knowledge/knowledge-0.4.0.json";

export function createStaticReferenceData(): ReferenceDataProvider {
  const foodsFile = FoodsFileSchema.parse(foodsRaw);
  const energy = EnergyFormulaSetSchema.parse(energyRaw);
  const display = DisplayRuleSetSchema.parse(displayRaw);
  const knowledge = KnowledgeFileSchema.parse(knowledgeRaw);
  const kbErrors = validateKnowledge(knowledge);
  if (kbErrors.length) throw new Error(`Baza znanja nije ispravna: ${kbErrors.join("; ")}`);
  const byId = new Map<string, Food>(foodsFile.foods.map((f) => [f.id, f]));
  if (byId.size !== foodsFile.foods.length) throw new Error("Referentni podaci: ID namirnice nije jedinstven");
  return {
    info: async () => ({
      foodsVersion: foodsFile.version,
      foodsStatus: foodsFile.status,
      attribution: foodsFile.attribution,
      sources: foodsFile.sources,
    }),
    listFoods: async () => foodsFile.foods,
    getFood: async (id) => byId.get(id) ?? null,
    getEnergyFormula: async () => energy,
    getDisplayRules: async () => display,
    getKnowledge: async () => knowledge,
  };
}
