// Baza znanja (DECISIONS/0011, 0012; docs/KNOWLEDGE_BASE.md). Podaci, ne kod: pravila, izvori, verzije.
// AI i aplikacija rade SAMO sa ovim sadržajem; brojeve računa deterministički evaluator (domain/knowledge).
import { z } from "zod";

const FactKey = z.string().regex(/^[a-z][a-zA-Z0-9]*$/);
const EntryId = z.string().regex(/^[A-Z]{1,4}-[0-9]{3}$/);

/** Uslov: čista struktura podataka, bez izvršnog koda. */
export type Condition =
  | { all: Condition[] }
  | { any: Condition[] }
  | { fact: string; op: "eq" | "ne" | "lt" | "lte" | "gt" | "gte" | "in"; value: number | string | boolean | (number | string)[] };
export const ConditionSchema: z.ZodType<Condition> = z.lazy(() =>
  z.union([
    z.object({ all: z.array(ConditionSchema).min(1) }).strict(),
    z.object({ any: z.array(ConditionSchema).min(1) }).strict(),
    z
      .object({
        fact: FactKey,
        op: z.enum(["eq", "ne", "lt", "lte", "gt", "gte", "in"]),
        value: z.union([z.number(), z.string(), z.boolean(), z.array(z.union([z.number(), z.string()]))]),
      })
      .strict(),
  ]),
);

/** Izraz za proračun: mali AST (bez eval-a). */
export type Expr =
  | { const: number }
  | { fact: string }
  | { byFact: { fact: string; values: Record<string, number> } }
  | { op: "add" | "sub" | "mul" | "div" | "pow" | "min" | "max"; args: Expr[] };
export const ExprSchema: z.ZodType<Expr> = z.lazy(() =>
  z.union([
    z.object({ const: z.number() }).strict(),
    z.object({ fact: FactKey }).strict(),
    z.object({ byFact: z.object({ fact: FactKey, values: z.record(z.string(), z.number()) }).strict() }).strict(),
    z.object({ op: z.enum(["add", "sub", "mul", "div", "pow", "min", "max"]), args: z.array(ExprSchema).min(1) }).strict(),
  ]),
);

export const SourceSchema = z
  .object({
    /** 1 = zvanična ustanova/propis; 2 = smernice, sistematski pregled; 3 = pojedinačna recenzirana studija (AI_RULES §1). */
    tier: z.union([z.literal(1), z.literal(2), z.literal(3)]),
    citation: z.string().min(5),
    url: z.string().url().optional(),
    doi: z.string().optional(),
    /** true = pročitan original; false = viđen samo kao navod u drugom tekstu. */
    checkedOriginal: z.boolean(),
    accessed: z.iso.date(),
    /** Šta tačno ovaj izvor potkrepljuje u stavci. */
    supports: z.string().min(5),
  })
  .strict();

export const FactDefSchema = z
  .object({
    key: FactKey,
    label: z.string().min(1),
    type: z.enum(["number", "enum", "boolean"]),
    unit: z.string().optional(),
    min: z.number().optional(),
    max: z.number().optional(),
    options: z.array(z.object({ value: z.string(), label: z.string() })).optional(),
    /** Pitanje za korisnika. null = izvedena vrednost (računa je stavka baze). */
    question: z
      .object({
        text: z.string().min(3),
        level: z.enum(["osnovni", "detaljni", "napredni"]),
        askWhen: ConditionSchema.optional(),
      })
      .strict()
      .nullable(),
  })
  .strict();

export const EntrySchema = z
  .object({
    id: EntryId,
    area: z.string().min(1),
    title: z.string().min(3),
    kind: z.enum(["calculation", "safety", "explanation"]),
    status: z.enum(["PREDLOG", "ODOBRENO", "POVUCENO"]),
    version: z.string().regex(/^\d+\.\d+\.\d+$/),
    /** Tvrdnja jasnim jezikom — ovo AI sme da kaže i ovo „Zašto?" prikazuje. */
    statement: z.string().min(10),
    tags: z.array(z.string()).default([]),
    appliesWhen: ConditionSchema.optional(),
    inputs: z.array(FactKey),
    /** calculation: vrednost koju stavka izračunava. */
    output: FactKey.optional(),
    expr: ExprSchema.optional(),
    /** safety: kada se aktivira i sa kojim statusom (MS §32). */
    safety: z
      .object({
        when: ConditionSchema,
        status: z.enum(["CAUTION", "REQUIRES_CLINICAL_REVIEW", "BLOCKED"]),
        message: z.string().min(5),
      })
      .strict()
      .optional(),
    sources: z.array(SourceSchema),
    approved: z.object({ by: z.string(), date: z.iso.date(), decision: z.string() }).strict().optional(),
    /** Slojevi provere (DECISIONS/0013). */
    review: z
      .object({
        /** Sloj 2: kriterijumi primenjeni (izvori, originali, opšta prihvaćenost). */
        criteria: z.object({ by: z.string(), date: z.iso.date(), consensus: z.enum(["SMERNICA", "DVA_IZVORA"]) }).strict().optional(),
        /** Sloj 3: nezavisna provera drugog AI sistema. */
        independentAi: z.object({ system: z.string(), date: z.iso.date(), result: z.enum(["POTVRDJENO", "PRIMEDBE"]), notes: z.string().optional() }).strict().optional(),
        /** Sloj 4: diplomirani nutricionista-dijetetičar. */
        expert: z.object({ name: z.string(), date: z.iso.date(), result: z.enum(["POTVRDJENO", "PRIMEDBE"]) }).strict().optional(),
      })
      .strict()
      .optional(),
    notes: z.string().optional(),
  })
  .strict();

export const KnowledgeFileSchema = z
  .object({
    id: z.literal("knowledge"),
    version: z.string().regex(/^\d+\.\d+\.\d+$/),
    document: z.string(),
    facts: z.array(FactDefSchema),
    entries: z.array(EntrySchema),
  })
  .strict();

export type SourceRef = z.infer<typeof SourceSchema>;
export type FactDef = z.infer<typeof FactDefSchema>;
export type KnowledgeEntry = z.infer<typeof EntrySchema>;
export type KnowledgeFile = z.infer<typeof KnowledgeFileSchema>;
