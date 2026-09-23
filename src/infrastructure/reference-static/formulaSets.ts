// Učitavanje verzionisanih skupova formula iz reference-data/ (ARCHITECTURE.md §7.1 ReferenceDataProvider, V1: statički fajlovi).
// Fajl se proverava šemom pri učitavanju; neispravan fajl zaustavlja pokretanje umesto tihe greške.
import { TrendFormulaSetSchema, type TrendFormulaSet } from "../../schemas";
import trendRaw from "../../../reference-data/formulas/trend-1.0.0.json";

export function loadTrendFormulaSet(): TrendFormulaSet {
  return TrendFormulaSetSchema.parse(trendRaw);
}
