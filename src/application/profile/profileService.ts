// Upitnik osnovnog nivoa i dnevni cilj (DECISIONS/0012 tačka 2, 0016; MS §7, §8, §10, §11, §30–§32, §44).
// Pitanja, proračun i bezbednost dolaze isključivo iz baze znanja (ODOBRENO). Ovde se samo spajaju sa podacima korisnika.
//
// Ugovor sa bazom znanja: ovaj servis zna za ključeve činjenica ispod (masa, cilj, rezultat). Ako ih nova verzija
// baze preimenuje, testovi nad pravim fajlom baze padaju pre objave.
import {
  deriveQuestions,
  displayEnergy,
  evaluate,
  isValidLocalDate,
  needsInputConfirmation,
  type Display,
  type Evaluation,
  type FactValue,
  type Facts,
} from "../../domain";
import { parseNumberAnswer } from "../../validation";
import type { DisplayRuleSet, FactDef, KnowledgeFile, Measurement, ProfileResult, ProfileSnapshot, TrendFormulaSet } from "../../schemas";
import { isDataError, type ChangeOperation, type ChangeSet, type DataProvider, type ReferenceDataProvider } from "../../ports/data";
import type { Clock, IdGenerator, StoragePersistence } from "../../ports/platform";
import { auditEvent, newBase, softDeleted, type RecordContext } from "../records";
import { ensurePersistentStorageAfterSave } from "../storage/persistence";

const LEVEL = "osnovni" as const;
const APPROVED = ["ODOBRENO"] as const;

/** Ključevi činjenica iz baze znanja koje ovaj servis koristi po imenu. */
export const KB_KEYS = {
  mass: "massKg",
  goal: "goal",
  target: "targetKcal",
  tdee: "tdeeKcal",
  deficit: "deficitKcal",
  weeklyLoss: "weeklyLossKg",
} as const;

/** ITM se koristi samo za bezbednosnu proveru (E-006, E-011) — ne prikazuje se korisniku kao ocena. */
const HIDDEN_IN_WHY = new Set(["bmi", "targetBmi"]);
/** Stavke koje u „Zašto?" idu na kraj, ovim redom (ostale zadržavaju redosled proračuna; indexOf = −1). */
const WHY_TAIL: readonly string[] = [KB_KEYS.target, KB_KEYS.weeklyLoss];
/** Objašnjenja iz baze koja se prikazuju uz dnevni cilj (X-002 opisuje načine zadavanja cilja — nije za „Zašto?"). */
const WHY_EXPLANATIONS: readonly string[] = ["X-001"];

export interface QuestionOption {
  readonly value: FactValue;
  readonly label: string;
}

export interface QuestionView {
  readonly key: string;
  readonly text: string;
  readonly type: "number" | "enum" | "boolean";
  readonly unit: string | null;
  readonly options: readonly QuestionOption[];
  readonly optional: boolean;
  /** Odgovor je isti podatak kao merenja mase (MS §12): predlaže se poslednje merenje, čuva se kao merenje. */
  readonly isBodyMass: boolean;
  /** Stavke baze znanja koje koriste odgovor (razlog zašto pitanje postoji). */
  readonly usedBy: readonly string[];
}

export interface WhyItem {
  readonly key: string;
  readonly label: string;
  readonly unit: string | null;
  readonly display: Display;
  readonly entryId: string;
  readonly version: string;
  readonly title: string;
  readonly statement: string;
  /** Konačni rezultat računa (dnevni cilj). */
  readonly total: boolean;
}

export interface SafetyNotice {
  readonly entryId: string;
  readonly status: "CAUTION" | "REQUIRES_CLINICAL_REVIEW" | "BLOCKED";
  readonly message: string;
}

export interface ProfileResultView {
  /** cilj = postoji dnevni cilj; bez-plana = bezbednosno pravilo ne dozvoljava plan; nepotpuno = fali odgovor. */
  readonly outcome: "cilj" | "bez-plana" | "nepotpuno";
  readonly target: Display | null;
  readonly goalLabel: string | null;
  readonly deficit: Display | null;
  readonly weeklyLoss: Display | null;
  /** Cilj je podignut na donju granicu unosa (E-005). */
  readonly floorApplied: boolean;
  readonly notices: readonly SafetyNotice[];
  readonly missing: readonly string[];
  readonly why: readonly WhyItem[];
  readonly explanations: readonly { readonly entryId: string; readonly title: string; readonly statement: string }[];
  readonly knowledgeVersion: string;
  readonly massKg: number | null;
}

export type ProfileState =
  | { readonly kind: "none" }
  | {
      readonly kind: "saved";
      readonly savedAt: string;
      readonly view: ProfileResultView;
      /** Rezultat je napravljen po starijoj verziji baze znanja od trenutne. */
      readonly stale: boolean;
    };

export interface QuestionnaireStart {
  readonly answers: Facts;
  readonly hasProfile: boolean;
  /** Poslednje merenje mase (odgovor „Trenutna masa" je isti podatak). */
  readonly latestMassKg: number | null;
}

export type ParseAnswerResult =
  | { readonly ok: true; readonly value: FactValue }
  | { readonly ok: false; readonly message: string; readonly needsConfirmation?: false }
  /** T5: masa izvan uobičajenog opsega — važi tek kad korisnik potvrdi. */
  | { readonly ok: false; readonly message: string; readonly needsConfirmation: true; readonly value: number };

export interface Preview {
  readonly view: ProfileResultView;
  /** Čuvanjem se upisuje i novo merenje mase za danas (masa se razlikuje od poslednjeg merenja). */
  readonly logsNewMass: boolean;
  readonly canSave: boolean;
}

export type SaveResult = { readonly ok: true } | { readonly ok: false; readonly message: string };

export interface ProfileService {
  current(): Promise<ProfileState>;
  start(): Promise<QuestionnaireStart>;
  /** Pitanja za date odgovore i odgovori bez onih koji više ne važe (npr. promenjen cilj). */
  questions(answers: Facts): Promise<{ readonly questions: readonly QuestionView[]; readonly answers: Facts }>;
  parseAnswer(key: string, text: string, confirmed?: boolean): Promise<ParseAnswerResult>;
  preview(answers: Facts): Promise<Preview>;
  save(answers: Facts): Promise<SaveResult>;
  /** Ponovni proračun sačuvanih odgovora po trenutnoj bazi znanja (nova operacija, novo poreklo). */
  recompute(): Promise<SaveResult>;
  /** Brisanje svih odgovora (MS §8). Merenja mase ostaju. */
  clear(): Promise<void>;
}

export interface ProfileDeps {
  readonly data: DataProvider;
  readonly reference: ReferenceDataProvider;
  readonly clock: Clock;
  readonly ids: IdGenerator;
  readonly persistence: StoragePersistence;
  readonly appVersion: string;
  readonly trendFormulas: TrendFormulaSet;
}

// ---------- čiste pomoćne funkcije ----------

function questionViews(kb: KnowledgeFile, answers: Facts): QuestionView[] {
  return deriveQuestions(kb, LEVEL, answers, APPROVED).map((q) => ({
    key: q.fact.key,
    text: q.fact.question!.text,
    type: q.fact.type,
    unit: q.fact.unit ?? null,
    options:
      q.fact.type === "boolean"
        ? [
            { value: true, label: "Da" },
            { value: false, label: "Ne" },
          ]
        : (q.fact.options ?? []).map((o) => ({ value: o.value, label: o.label })),
    optional: q.optional,
    isBodyMass: q.fact.key === KB_KEYS.mass,
    usedBy: q.usedBy,
  }));
}

/** Uklanja odgovore na pitanja koja više ne važe; ponavlja dok se ne ustali (uklanjanje može sakriti druga pitanja). */
export function pruneAnswers(kb: KnowledgeFile, answers: Facts): { questions: QuestionView[]; answers: Facts } {
  let current: Record<string, FactValue> = { ...answers };
  for (let i = 0; i < 10; i++) {
    const qs = questionViews(kb, current);
    const keys = new Set(qs.map((q) => q.key));
    const next = Object.fromEntries(Object.entries(current).filter(([k]) => keys.has(k)));
    if (Object.keys(next).length === Object.keys(current).length) return { questions: qs, answers: next };
    current = next;
  }
  return { questions: questionViews(kb, current), answers: current };
}

/** Tip i opseg svakog odgovora prema definiciji činjenice; vraća poruku o prvoj grešci ili null. */
export function checkAnswerTypes(kb: KnowledgeFile, answers: Facts): string | null {
  const defs = new Map(kb.facts.map((f) => [f.key, f]));
  for (const [k, v] of Object.entries(answers)) {
    const f = defs.get(k);
    if (!f) return `Nepoznato pitanje: ${k}`;
    if (f.type === "number") {
      if (typeof v !== "number" || !Number.isFinite(v)) return `${f.label}: nije broj.`;
      if ((f.min !== undefined && v < f.min) || (f.max !== undefined && v > f.max)) return `${f.label}: izvan opsega.`;
    } else if (f.type === "boolean") {
      if (typeof v !== "boolean") return `${f.label}: očekuje se da ili ne.`;
    } else if (typeof v !== "string" || !(f.options ?? []).some((o) => o.value === v)) return `${f.label}: nepoznat izbor.`;
  }
  return null;
}

function outcomeOf(ev: Pick<Evaluation, "safetyStatus" | "undecidedSafety" | "errors" | "facts">, missing: number): ProfileResultView["outcome"] {
  if (ev.safetyStatus === "BLOCKED" || ev.safetyStatus === "REQUIRES_CLINICAL_REVIEW") return "bez-plana";
  if (missing > 0 || ev.undecidedSafety.length > 0 || ev.errors.length > 0 || typeof ev.facts[KB_KEYS.target] !== "number") return "nepotpuno";
  return "cilj";
}

function toResult(kb: KnowledgeFile, ev: Evaluation, missing: number): ProfileResult {
  const outcome = outcomeOf(ev, missing);
  return {
    knowledgeVersion: kb.version,
    safetyStatus: ev.safetyStatus,
    safety: ev.safety.map((s) => ({ ...s })),
    undecidedSafety: [...ev.undecidedSafety],
    trace: ev.trace.map((t) => ({ ...t })),
    errors: [...ev.errors],
    targetKcal: outcome === "cilj" ? (ev.facts[KB_KEYS.target] as number) : null,
  };
}

const decimalsOf = (v: number) => (Number.isInteger(v) ? 0 : Number.isInteger(Math.round(v * 100) / 10) ? 1 : 2);
const round2 = (v: number) => Math.round(v * 100) / 100;

function displayFor(key: string, unit: string | null, value: number, rules: DisplayRuleSet): Display {
  // Dnevni manjak je izabran broj (tempo ili korisnik), ne procena; ostale kcal vrednosti su procene iz formule (MS §30).
  if (unit === "kcal" && key === KB_KEYS.deficit) return { kind: "exact", value: Math.round(value), decimals: 0 };
  if (unit === "kcal") return displayEnergy(value, "PROCENJENO", rules);
  const v = round2(value);
  return key === KB_KEYS.weeklyLoss ? { kind: "approx", value: v, decimals: decimalsOf(v) } : { kind: "exact", value: v, decimals: decimalsOf(v) };
}

/** Prikaz sačuvanog ili probnog rezultata. Nazivi i tvrdnje stavki dolaze iz baze znanja. */
export function buildView(kb: KnowledgeFile, answers: Facts, result: ProfileResult, rules: DisplayRuleSet): ProfileResultView {
  const defs = new Map<string, FactDef>(kb.facts.map((f) => [f.key, f]));
  const entries = new Map(kb.entries.map((e) => [e.id, e]));
  const { questions } = pruneAnswers(kb, answers);
  const missing = questions.filter((q) => !q.optional && answers[q.key] === undefined).map((q) => q.text);
  const value = (k: string) => result.trace.find((t) => t.output === k)?.value;
  const outcome: ProfileResultView["outcome"] =
    result.safetyStatus === "BLOCKED" || result.safetyStatus === "REQUIRES_CLINICAL_REVIEW" ? "bez-plana" : result.targetKcal === null ? "nepotpuno" : "cilj";
  const goal = answers[KB_KEYS.goal];
  const goalLabel = typeof goal === "string" ? (defs.get(KB_KEYS.goal)?.options?.find((o) => o.value === goal)?.label ?? null) : null;
  const tdee = value(KB_KEYS.tdee);
  const deficit = value(KB_KEYS.deficit);
  const weekly = value(KB_KEYS.weeklyLoss);
  const floorApplied = result.targetKcal !== null && tdee !== undefined && deficit !== undefined && result.targetKcal > tdee - deficit + 0.5;
  const plan = outcome === "cilj";
  return {
    outcome,
    target: plan ? displayEnergy(result.targetKcal, "PROCENJENO", rules) : null,
    goalLabel,
    deficit: plan && deficit !== undefined ? displayFor(KB_KEYS.deficit, "kcal", deficit, rules) : null,
    weeklyLoss: plan && weekly !== undefined ? displayFor(KB_KEYS.weeklyLoss, null, weekly, rules) : null,
    floorApplied,
    notices: result.safety,
    missing,
    why: plan
      ? [...result.trace]
          .filter((t) => !HIDDEN_IN_WHY.has(t.output))
          // Redosled računa, a dnevni cilj (zaključak) i početni tempo na kraju.
          .sort((a, b) => WHY_TAIL.indexOf(a.output) - WHY_TAIL.indexOf(b.output))
          .map((t) => {
            const f = defs.get(t.output);
            const e = entries.get(t.entryId);
            const unit = f?.unit ?? null;
            return {
              key: t.output,
              label: f?.label ?? t.output,
              unit,
              display: displayFor(t.output, unit, t.value, rules),
              entryId: t.entryId,
              version: t.version,
              title: e?.title ?? t.entryId,
              statement: e?.statement ?? "",
              total: t.output === KB_KEYS.target,
            };
          })
      : [],
    explanations: plan
      ? kb.entries.filter((e) => e.kind === "explanation" && e.status === "ODOBRENO" && WHY_EXPLANATIONS.includes(e.id)).map((e) => ({ entryId: e.id, title: e.title, statement: e.statement }))
      : [],
    knowledgeVersion: result.knowledgeVersion,
    massKg: typeof answers[KB_KEYS.mass] === "number" ? (answers[KB_KEYS.mass] as number) : null,
  };
}

const sameMass = (a: number, b: number) => Math.abs(a - b) < 1e-9;

// ---------- use case-ovi ----------

export function createProfileService(d: ProfileDeps): ProfileService {
  let kbCache: KnowledgeFile | null = null;
  let rulesCache: DisplayRuleSet | null = null;
  const kb = async () => (kbCache ??= await d.reference.getKnowledge());
  const rules = async () => (rulesCache ??= await d.reference.getDisplayRules());

  const context = async (): Promise<RecordContext> => {
    const { userId } = await d.data.backup.info();
    return { userId, nowIso: d.clock.nowIso(), newId: () => d.ids.newId(), appVersion: d.appVersion };
  };

  /** Merenje koje je isti podatak kao odgovor o masi: postojeće (ako je ista vrednost) ili novo za danas. */
  const massSource = async (massKg: number): Promise<{ reuse: Measurement | null }> => {
    const prev = await d.data.profiles.current();
    if (prev?.massMeasurementId) {
      try {
        const m = await d.data.measurements.get(prev.massMeasurementId);
        if (sameMass(m.value, massKg)) return { reuse: m };
      } catch (e) {
        if (!isDataError(e, "NotFound")) throw e;
      }
    }
    const latest = await d.data.measurements.latest("body_mass");
    return { reuse: latest && sameMass(latest.value, massKg) ? latest : null };
  };

  const evaluateAnswers = async (answers: Facts) => {
    const k = await kb();
    const pruned = pruneAnswers(k, answers);
    const typeError = checkAnswerTypes(k, pruned.answers);
    const ev = evaluate(k, pruned.answers, APPROVED);
    const missing = pruned.questions.filter((q) => !q.optional && pruned.answers[q.key] === undefined).length;
    return { k, answers: pruned.answers, typeError, ev, missing, result: toResult(k, ev, missing) };
  };

  const save = async (answers: Facts): Promise<SaveResult> => {
    const { k, answers: clean, typeError, result, missing } = await evaluateAnswers(answers);
    if (typeError) return { ok: false, message: typeError };
    const blocked = result.safetyStatus === "BLOCKED" || result.safetyStatus === "REQUIRES_CLINICAL_REVIEW";
    if (!blocked && missing > 0) return { ok: false, message: "Odgovori na sva pitanja." };

    const c = await context();
    const ops: ChangeOperation[] = [];
    let massMeasurementId: string | null = null;
    const massKg = clean[KB_KEYS.mass];
    if (typeof massKg === "number") {
      const { reuse } = await massSource(massKg);
      if (reuse) massMeasurementId = reuse.id;
      else {
        const today = d.clock.localDate();
        if (!isValidLocalDate(today)) return { ok: false, message: "Datum na uređaju nije ispravan." };
        const m: Measurement = {
          ...newBase(c),
          type: "body_mass",
          value: massKg,
          unit: "kg",
          measuredAt: c.nowIso,
          localDate: today,
          timeZone: d.clock.timeZone(),
          note: null,
        };
        ops.push({ entity: "measurements", op: "put", record: m, expectedRev: null });
        massMeasurementId = m.id;
      }
    }
    const snapshot: ProfileSnapshot = { ...newBase(c), level: LEVEL, answers: { ...clean }, massMeasurementId, result };
    ops.push({ entity: "profile_snapshots", op: "put", record: snapshot, expectedRev: null });
    const summary =
      result.targetKcal !== null
        ? `Upitnik: dnevni cilj ${Math.round(result.targetKcal)} kcal (baza znanja ${k.version}).`
        : `Upitnik: bez plana — ${result.safety.map((s) => s.entryId).join(", ") || "nepotpuni odgovori"} (baza znanja ${k.version}).`;
    const cs: ChangeSet = {
      id: c.newId(),
      createdAt: c.nowIso,
      operations: ops,
      audit: auditEvent(c, {
        actor: "user",
        useCase: "saveProfile",
        entityRefs: ops.map((o) => ({ entity: o.entity, id: o.record.id })),
        summary,
      }),
    };
    await d.data.unitOfWork.commit(cs);
    try {
      await ensurePersistentStorageAfterSave(d.data.settings, d.persistence, d.clock);
    } catch {
      /* neuspeh zahteva ne poništava sačuvane odgovore */
    }
    return { ok: true };
  };

  return {
    async current() {
      const snap = await d.data.profiles.current();
      if (!snap || !snap.result) return { kind: "none" };
      const k = await kb();
      return {
        kind: "saved",
        savedAt: snap.createdAt,
        view: buildView(k, snap.answers, snap.result, await rules()),
        stale: snap.result.knowledgeVersion !== k.version,
      };
    },

    async start() {
      const [snap, latest, k] = await Promise.all([d.data.profiles.current(), d.data.measurements.latest("body_mass"), kb()]);
      const base: Record<string, FactValue> = { ...(snap?.answers ?? {}) };
      // Odgovor o masi je isti podatak kao merenja: predlaže se poslednje merenje.
      if (latest) base[KB_KEYS.mass] = latest.value;
      return { answers: pruneAnswers(k, base).answers, hasProfile: snap !== null, latestMassKg: latest?.value ?? null };
    },

    async questions(answers) {
      const r = pruneAnswers(await kb(), answers);
      return { questions: r.questions, answers: r.answers };
    },

    async parseAnswer(key, text, confirmed) {
      const f = (await kb()).facts.find((x) => x.key === key);
      if (!f || f.type !== "number") return { ok: false, message: "Ovo pitanje se ne odgovara brojem." };
      const r = parseNumberAnswer(text, { min: f.min, max: f.max, unit: f.unit });
      if (!r.ok) return { ok: false, message: r.message };
      if (key === KB_KEYS.mass && !confirmed && needsInputConfirmation(r.value, d.trendFormulas)) {
        return { ok: false, needsConfirmation: true, value: r.value, message: "Vrednost je neuobičajena. Proveri da li je tačno upisana." };
      }
      return { ok: true, value: r.value };
    },

    async preview(answers) {
      const { k, answers: clean, typeError, result, missing } = await evaluateAnswers(answers);
      const view = buildView(k, clean, result, await rules());
      const massKg = clean[KB_KEYS.mass];
      const logsNewMass = typeof massKg === "number" ? (await massSource(massKg)).reuse === null : false;
      const blocked = view.outcome === "bez-plana";
      return { view, logsNewMass, canSave: typeError === null && (blocked || missing === 0) };
    },

    save,

    async recompute() {
      const snap = await d.data.profiles.current();
      if (!snap) return { ok: false, message: "Nema sačuvanih odgovora." };
      return save(snap.answers);
    },

    async clear() {
      const active = await d.data.profiles.listActive();
      if (active.length === 0) return;
      const c = await context();
      const cs: ChangeSet = {
        id: c.newId(),
        createdAt: c.nowIso,
        // Brisanje na zahtev korisnika: ostaje samo zapis da je postojao, bez sadržaja (ARCHITECTURE §8.2, DECISIONS/0016).
        operations: active.map((p) => ({
          entity: "profile_snapshots" as const,
          op: "softDelete" as const,
          record: { ...softDeleted(p, c.nowIso), answers: {}, massMeasurementId: null, result: null },
          expectedRev: p.rev,
        })),
        audit: auditEvent(c, {
          actor: "user",
          useCase: "clearProfile",
          entityRefs: active.map((p) => ({ entity: "profile_snapshots" as const, id: p.id })),
          summary: `Brisanje odgovora na upitnik (${active.length}).`,
        }),
      };
      await d.data.unitOfWork.commit(cs);
    },
  };
}
