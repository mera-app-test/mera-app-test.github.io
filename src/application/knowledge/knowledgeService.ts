// Pregled baze znanja i upitnika izvedenog iz nje (DECISIONS/0011, 0012).
// Isti use case-ovi kasnije služe AI alatima (pretraga, proračun) — AI nema svoj put do podataka.
import type { ReferenceDataProvider } from "../../ports/data";
import type { FactDef, KnowledgeEntry, KnowledgeFile } from "../../schemas";
import { deriveQuestions, evaluate, searchKnowledge, validateKnowledge, type DerivedQuestion, type Evaluation, type Facts } from "../../domain";

export type KnowledgeScope = "odobreno" | "sa-predlozima";
const statuses = (s: KnowledgeScope) => (s === "odobreno" ? (["ODOBRENO"] as const) : (["ODOBRENO", "PREDLOG"] as const));

export interface KnowledgeOverview {
  readonly version: string;
  readonly counts: { readonly odobreno: number; readonly predlog: number; readonly povuceno: number };
  readonly entries: readonly KnowledgeEntry[];
  readonly facts: readonly FactDef[];
  readonly problems: readonly string[];
}

export interface KnowledgeService {
  overview(): Promise<KnowledgeOverview>;
  questions(level: "osnovni" | "detaljni" | "napredni", answers: Facts, scope: KnowledgeScope): Promise<readonly DerivedQuestion[]>;
  evaluate(answers: Facts, scope: KnowledgeScope): Promise<Evaluation>;
  search(query: string, scope: KnowledgeScope): Promise<readonly KnowledgeEntry[]>;
}

export function createKnowledgeService(ref: ReferenceDataProvider): KnowledgeService {
  let kb: KnowledgeFile | null = null;
  const load = async () => (kb ??= await ref.getKnowledge());
  return {
    async overview() {
      const k = await load();
      const n = (s: KnowledgeEntry["status"]) => k.entries.filter((e) => e.status === s).length;
      return { version: k.version, counts: { odobreno: n("ODOBRENO"), predlog: n("PREDLOG"), povuceno: n("POVUCENO") }, entries: k.entries, facts: k.facts, problems: validateKnowledge(k) };
    },
    questions: async (level, answers, scope) => deriveQuestions(await load(), level, answers, statuses(scope)),
    evaluate: async (answers, scope) => evaluate(await load(), answers, statuses(scope)),
    search: async (query, scope) => searchKnowledge(await load(), query, statuses(scope)),
  };
}
