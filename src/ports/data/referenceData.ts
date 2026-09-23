// ReferenceDataProvider (ARCHITECTURE.md §7.1): samo čitanje. V1 = statički verzionisani fajlovi; kasnije server.
import type { DisplayRuleSet, EnergyFormulaSet, Food } from "../../schemas";

export interface ReferenceDataInfo {
  readonly foodsVersion: string;
  readonly foodsStatus: "CEKA_ODOBRENJE" | "ODOBRENO";
  readonly attribution: string;
  readonly sources: Readonly<Record<string, { url: string; sha256: string }>>;
}

export interface ReferenceDataProvider {
  info(): Promise<ReferenceDataInfo>;
  listFoods(): Promise<readonly Food[]>;
  getFood(id: string): Promise<Food | null>;
  getEnergyFormula(): Promise<EnergyFormulaSet>;
  getDisplayRules(): Promise<DisplayRuleSet>;
}
