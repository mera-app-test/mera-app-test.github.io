// Referentni podaci o namirnicama (ARCHITECTURE.md §8.4 Food/NutrientValue; NUTRITION_ENGINE.md delovi N, K).
// Fajl nastaje alatom za uvoz (scripts/fdc) i proverava se ovom šemom pri učitavanju.
import { z } from "zod";

export const NUTRIENT_KEYS = [
  "protein",
  "fat",
  "saturatedFat",
  "carbohydrateByDifference",
  "sugars",
  "fiber",
  "sodium",
  "water",
] as const;
export type NutrientKey = (typeof NUTRIENT_KEYS)[number];

const NutrientValueSchema = z.object({
  value: z.number().nonnegative(),
  nutrientId: z.string().regex(/^\d+$/),
  /** PRIMARY = iz izabranog FDC zapisa; SR_FILL = dopunjeno iz SR Legacy po istom NDB broju (N2). */
  origin: z.enum(["PRIMARY", "SR_FILL"]),
});

const SourceRefSchema = z.object({
  dataset: z.enum(["foundation", "srLegacy"]),
  fdcId: z.string().regex(/^\d+$/),
  ndb: z.string().nullable(),
  description: z.string().min(1),
  published: z.string().nullable().optional(),
});

const ValuesSchema = z.object(Object.fromEntries(NUTRIENT_KEYS.map((k) => [k, NutrientValueSchema.optional()])) as Record<NutrientKey, z.ZodOptional<typeof NutrientValueSchema>>);

const FoodCoreSchema = z.object({
  source: SourceRefSchema,
  fill: SourceRefSchema.nullable(),
  values: ValuesSchema,
  missing: z.array(z.enum(NUTRIENT_KEYS)),
  fdcEnergy: z.object({
    energyAtwaterSpecific: z.number().optional(),
    energyAtwaterGeneral: z.number().optional(),
    energy: z.number().optional(),
  }),
  portions: z.array(z.object({ amount: z.number().nullable(), description: z.string(), gramWeight: z.number().positive() })),
});

export const FoodSchema = FoodCoreSchema.extend({
  id: z.string().regex(/^[a-z0-9-]+$/),
  names: z.object({
    srLatn: z.string().min(1),
    srCyrl: z.string().min(1),
    aliases: z.array(z.string()),
    searchKeys: z.array(z.string()),
  }),
  group: z.string().min(1),
  /** Oblik je deo identiteta namirnice (K1). Prazno = oblik nije relevantan (npr. ulje). */
  form: z.string(),
  mapping: z.enum(["TACNO", "BLISKO"]),
  note: z.string().optional(),
  /** R1 (DECISIONS/0009): korišćen SR Legacy zapis jer noviji Foundation zapis nije imao podatke za energiju. */
  r1: z.literal(true).optional(),
});
export type Food = z.infer<typeof FoodSchema>;

export const FoodsFileSchema = z.object({
  id: z.literal("foods"),
  version: z.string().regex(/^\d+\.\d+\.\d+$/),
  /** CEKA_ODOBRENJE: sme samo na test adresu (produkcijski build pada). */
  status: z.enum(["CEKA_ODOBRENJE", "ODOBRENO"]),
  document: z.string(),
  attribution: z.string().min(1),
  sources: z.record(z.string(), z.object({ url: z.string().url(), bytes: z.number(), sha256: z.string().regex(/^[0-9a-f]{64}$/) })),
  foods: z.array(FoodSchema).min(1),
});
export type FoodsFile = z.infer<typeof FoodsFileSchema>;

/** Energija po Prilogu 13 (N4-A). */
export const EnergyFormulaSetSchema = z.object({
  id: z.literal("energy-label"),
  version: z.string().regex(/^\d+\.\d+\.\d+$/),
  approvedAt: z.iso.date(),
  approvedBy: z.string().min(1),
  document: z.string().min(1),
  sources: z.array(z.string().min(1)).min(1),
  availableCarbohydrate: z.literal("carbohydrateByDifference - fiber"),
  kcalPerGram: z.object({ protein: z.number(), carbohydrate: z.number(), fat: z.number(), fiber: z.number(), alcohol: z.number() }),
  saltPerSodium: z.number().positive(),
  saltSource: z.string().min(1),
});
export type EnergyFormulaSet = z.infer<typeof EnergyFormulaSetSchema>;

/** Pravila prikaza i zaokruživanja (P2, P3). */
export const DisplayRuleSetSchema = z.object({
  id: z.literal("display"),
  version: z.string().regex(/^\d+\.\d+\.\d+$/),
  approvedAt: z.iso.date(),
  approvedBy: z.string().min(1),
  document: z.string().min(1),
  energy: z.object({ exactStepKcal: z.number().positive(), approxStepKcal: z.number().positive() }),
  grams: z.object({ wholeFromG: z.number().positive(), decimalsBelow: z.number().int().min(0), traceBelowG: z.number().positive() }),
  sodium: z.object({ stepMg: z.number().positive() }),
  salt: z.object({ decimals: z.number().int().min(0) }),
});
export type DisplayRuleSet = z.infer<typeof DisplayRuleSetSchema>;
