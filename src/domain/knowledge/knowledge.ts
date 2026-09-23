// Rad sa bazom znanja (DECISIONS/0011, 0012). Čiste funkcije: provera baze, proračun, izvođenje upitnika, pretraga.
import type { Condition, Expr, FactDef, KnowledgeEntry, KnowledgeFile } from "../../schemas";
import { matchesQuery } from "../text/search";

export type FactValue = number | string | boolean;
export type Facts = Readonly<Record<string, FactValue>>;
export type Status = KnowledgeEntry["status"];

// ---------- Provera baze (pokreće se u testovima nad pravim fajlom) ----------

function exprFacts(e: Expr, out: Set<string>): Set<string> {
  if ("fact" in e) out.add(e.fact);
  else if ("byFact" in e) out.add(e.byFact.fact);
  else if ("op" in e) e.args.forEach((a) => exprFacts(a, out));
  return out;
}
function condFacts(c: Condition, out: Set<string>): Set<string> {
  if ("all" in c) c.all.forEach((x) => condFacts(x, out));
  else if ("any" in c) c.any.forEach((x) => condFacts(x, out));
  else out.add(c.fact);
  return out;
}

/** Vraća listu grešaka; prazna lista = baza je ispravna. */
export function validateKnowledge(kb: KnowledgeFile): string[] {
  const errors: string[] = [];
  const facts = new Map(kb.facts.map((f) => [f.key, f]));
  const ids = new Set<string>();
  if (facts.size !== kb.facts.length) errors.push("ključ činjenice nije jedinstven");
  for (const e of kb.entries) {
    if (ids.has(e.id)) errors.push(`${e.id}: ID nije jedinstven`);
    ids.add(e.id);
    const inputs = new Set(e.inputs);
    for (const k of inputs) if (!facts.has(k)) errors.push(`${e.id}: nepoznata ulazna činjenica „${k}"`);
    const used = new Set<string>();
    if (e.expr) exprFacts(e.expr, used);
    if (e.appliesWhen) condFacts(e.appliesWhen, used);
    if (e.safety) condFacts(e.safety.when, used);
    for (const k of used) if (!inputs.has(k)) errors.push(`${e.id}: koristi „${k}" koji nije naveden u inputs`);
    if (e.kind === "calculation") {
      if (!e.output || !e.expr) errors.push(`${e.id}: proračun mora imati output i expr`);
      else if (facts.get(e.output)?.question !== null) errors.push(`${e.id}: output „${e.output}" mora biti izvedena činjenica (question: null)`);
    }
    if (e.kind === "safety" && !e.safety) errors.push(`${e.id}: bezbednosna stavka mora imati safety`);
    if (e.status === "ODOBRENO") {
      if (!e.approved) errors.push(`${e.id}: ODOBRENO bez podatka o odobrenju`);
      if (!e.sources.some((s) => s.tier <= 2 && s.checkedOriginal))
        errors.push(`${e.id}: ODOBRENO traži bar jedan izvor nivoa 1 ili 2 proveren u originalu (AI_RULES §1)`);
    }
    if (e.kind !== "explanation" && e.sources.length === 0) errors.push(`${e.id}: nema izvora`);
  }
  // Pitanje sme da postoji samo ako ga koristi bar jedna stavka (nema „praznih" pitanja).
  const usedAnywhere = new Set(kb.entries.filter((e) => e.status !== "POVUCENO").flatMap((e) => e.inputs));
  for (const f of kb.facts) {
    if (f.question && !usedAnywhere.has(f.key)) errors.push(`pitanje „${f.key}" ne koristi nijedna stavka — ne sme postojati`);
    if (f.question?.askWhen) for (const k of condFacts(f.question.askWhen, new Set())) if (!facts.has(k)) errors.push(`pitanje „${f.key}": askWhen koristi nepoznato „${k}"`);
    if (f.question === null && !kb.entries.some((e) => e.output === f.key)) errors.push(`izvedena činjenica „${f.key}" nema stavku koja je računa`);
  }
  // Bez kružnih zavisnosti.
  const producers = new Map<string, KnowledgeEntry[]>();
  for (const e of kb.entries) if (e.output) producers.set(e.output, [...(producers.get(e.output) ?? []), e]);
  const visiting = new Set<string>();
  const done = new Set<string>();
  const visit = (key: string, path: string[]) => {
    if (done.has(key)) return;
    if (visiting.has(key)) { errors.push(`kružna zavisnost: ${[...path, key].join(" → ")}`); return; }
    visiting.add(key);
    for (const p of producers.get(key) ?? []) for (const i of p.inputs) visit(i, [...path, key]);
    visiting.delete(key);
    done.add(key);
  };
  for (const k of producers.keys()) visit(k, []);
  return errors;
}

// ---------- Proračun ----------

export function testCondition(c: Condition, facts: Facts): boolean | undefined {
  if ("all" in c) {
    const r = c.all.map((x) => testCondition(x, facts));
    return r.includes(false) ? false : r.includes(undefined) ? undefined : true;
  }
  if ("any" in c) {
    const r = c.any.map((x) => testCondition(x, facts));
    return r.includes(true) ? true : r.includes(undefined) ? undefined : false;
  }
  const v = facts[c.fact];
  if (v === undefined) return undefined; // nepoznato ≠ netačno
  switch (c.op) {
    case "eq": return v === c.value;
    case "ne": return v !== c.value;
    case "in": return Array.isArray(c.value) && (c.value as (string | number)[]).includes(v as string | number);
    default: {
      if (typeof v !== "number" || typeof c.value !== "number") return undefined;
      return c.op === "lt" ? v < c.value : c.op === "lte" ? v <= c.value : c.op === "gt" ? v > c.value : v >= c.value;
    }
  }
}

function evalExpr(e: Expr, facts: Facts): number | undefined {
  if ("const" in e) return e.const;
  if ("fact" in e) { const v = facts[e.fact]; return typeof v === "number" ? v : undefined; }
  if ("byFact" in e) { const v = facts[e.byFact.fact]; return v === undefined ? undefined : e.byFact.values[String(v)]; }
  const a = e.args.map((x) => evalExpr(x, facts));
  if (a.some((x) => x === undefined)) return undefined;
  const n = a as number[];
  switch (e.op) {
    case "add": return n.reduce((s, x) => s + x, 0);
    case "sub": return n.slice(1).reduce((s, x) => s - x, n[0]!);
    case "mul": return n.reduce((s, x) => s * x, 1);
    case "div": return n.slice(1).reduce((s, x) => s / x, n[0]!);
    case "pow": return n[0]! ** n[1]!;
    case "min": return Math.min(...n);
    case "max": return Math.max(...n);
  }
}

export interface Evaluation {
  readonly facts: Facts;
  /** Za svaku izračunatu vrednost: koja stavka i koja verzija ju je dala (MS §44). */
  readonly trace: readonly { output: string; entryId: string; version: string; value: number }[];
  readonly safety: readonly { entryId: string; status: "CAUTION" | "REQUIRES_CLINICAL_REVIEW" | "BLOCKED"; message: string }[];
  /** Najstroži aktivni status; SAFE ako nijedno pravilo nije aktivno. */
  readonly safetyStatus: "SAFE" | "CAUTION" | "REQUIRES_CLINICAL_REVIEW" | "BLOCKED";
  /** Bezbednosna pravila koja nisu mogla da se provere jer fali odgovor — plan se tada ne pravi. */
  readonly undecidedSafety: readonly string[];
  readonly errors: readonly string[];
}

const SEVERITY = ["SAFE", "CAUTION", "REQUIRES_CLINICAL_REVIEW", "BLOCKED"] as const;

/** Računa sve izvedene vrednosti iz odgovora korisnika, samo iz stavki sa dozvoljenim statusom. */
export function evaluate(kb: KnowledgeFile, answers: Facts, allowed: readonly Status[] = ["ODOBRENO"]): Evaluation {
  const entries = kb.entries.filter((e) => allowed.includes(e.status));
  const facts: Record<string, FactValue> = { ...answers };
  const trace: { output: string; entryId: string; version: string; value: number }[] = [];
  const errors: string[] = [];
  const calcs = entries.filter((e) => e.kind === "calculation");
  let progress = true;
  const pending = new Set(calcs.map((e) => e.id));
  while (progress) {
    progress = false;
    for (const e of calcs) {
      if (!pending.has(e.id)) continue;
      if (!e.inputs.every((k) => facts[k] !== undefined)) continue;
      pending.delete(e.id);
      progress = true;
      if (e.appliesWhen && testCondition(e.appliesWhen, facts) !== true) continue;
      if (facts[e.output!] !== undefined && trace.some((t) => t.output === e.output)) {
        errors.push(`${e.output}: više stavki se primenjuje istovremeno (${e.id})`);
        continue;
      }
      const v = evalExpr(e.expr!, facts);
      if (v === undefined || !Number.isFinite(v)) { errors.push(`${e.id}: proračun nije moguć`); continue; }
      facts[e.output!] = v;
      trace.push({ output: e.output!, entryId: e.id, version: e.version, value: v });
    }
  }
  const safety: Evaluation["safety"][number][] = [];
  const undecided: string[] = [];
  for (const e of entries.filter((x) => x.kind === "safety")) {
    const applies = e.appliesWhen ? testCondition(e.appliesWhen, facts) : true;
    if (applies === false) continue;
    const r = testCondition(e.safety!.when, facts);
    if (r === true && applies === true) safety.push({ entryId: e.id, status: e.safety!.status, message: e.safety!.message });
    else if (r === undefined || applies === undefined) undecided.push(e.id);
  }
  const worst = safety.reduce((w, s) => (SEVERITY.indexOf(s.status) > SEVERITY.indexOf(w) ? s.status : w), "SAFE" as Evaluation["safetyStatus"]);
  return { facts, trace, safety, safetyStatus: worst, undecidedSafety: undecided, errors };
}

// ---------- Upitnik izveden iz baze ----------

export interface DerivedQuestion {
  readonly fact: FactDef;
  /** Stavke koje koriste ovaj odgovor — razlog zašto pitanje postoji. */
  readonly usedBy: readonly string[];
}

const LEVEL_ORDER = ["osnovni", "detaljni", "napredni"] as const;

/**
 * Pitanja za dati nivo: samo činjenice koje stvarno koristi bar jedna stavka sa dozvoljenim statusom.
 * Pitanje sa askWhen se postavlja tek kad uslov važi (npr. trudnoća samo ženama).
 */
export function deriveQuestions(
  kb: KnowledgeFile,
  level: (typeof LEVEL_ORDER)[number],
  answers: Facts,
  allowed: readonly Status[] = ["ODOBRENO"],
): DerivedQuestion[] {
  const maxLevel = LEVEL_ORDER.indexOf(level);
  const entries = kb.entries.filter((e) => allowed.includes(e.status));
  // Uključi i ulaze stavki koje računaju izvedene vrednosti potrebne drugim stavkama (lanac do pitanja).
  const usedBy = new Map<string, Set<string>>();
  for (const e of entries) for (const k of e.inputs) usedBy.set(k, (usedBy.get(k) ?? new Set()).add(e.id));
  return kb.facts
    .filter((f) => f.question && LEVEL_ORDER.indexOf(f.question.level) <= maxLevel && usedBy.has(f.key))
    .filter((f) => !f.question!.askWhen || testCondition(f.question!.askWhen, answers) === true)
    .map((f) => ({ fact: f, usedBy: [...usedBy.get(f.key)!].sort() }));
}

// ---------- Pretraga (AI dobija stavke pre odgovora — DECISIONS/0011) ----------

export function searchKnowledge(kb: KnowledgeFile, query: string, allowed: readonly Status[] = ["ODOBRENO"]): KnowledgeEntry[] {
  return kb.entries.filter((e) => allowed.includes(e.status) && matchesQuery([e.title, e.area, e.statement, ...e.tags], query));
}
