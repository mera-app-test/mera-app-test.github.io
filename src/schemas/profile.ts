// Odgovori na upitnik iz baze znanja — ProfileSnapshot (ARCHITECTURE.md §8.4; MS §7, §8; DECISIONS/0012, 0016).
// Svaka izmena odgovora = nov snapshot; stari ostaju kao istorija. Brisanje na zahtev korisnika uklanja sadržaj (§8.2).
import { z } from "zod";
import { BaseRecordSchema, UuidSchema } from "./common";

export const FactValueSchema = z.union([z.number().finite(), z.string().min(1).max(100), z.boolean()]);

const SafetyStatusSchema = z.enum(["SAFE", "CAUTION", "REQUIRES_CLINICAL_REVIEW", "BLOCKED"]);

/** Rezultat proračuna u trenutku čuvanja, sa verzijama koje su ga proizvele (MS §43, §44; ARCHITECTURE §10.4). */
export const ProfileResultSchema = z.object({
  knowledgeVersion: z.string().min(1),
  safetyStatus: SafetyStatusSchema,
  safety: z.array(z.object({ entryId: z.string(), status: SafetyStatusSchema.exclude(["SAFE"]), message: z.string() })),
  undecidedSafety: z.array(z.string()),
  trace: z.array(z.object({ output: z.string(), entryId: z.string(), version: z.string(), value: z.number().finite() })),
  errors: z.array(z.string()),
  /** Dnevni cilj u kcal, nezaokružen; null = plan se ne pravi. */
  targetKcal: z.number().finite().nullable(),
});
export type ProfileResult = z.infer<typeof ProfileResultSchema>;

export const ProfileSnapshotSchema = BaseRecordSchema.extend({
  level: z.enum(["osnovni", "detaljni", "napredni"]),
  /** Odgovori po ključu činjenice iz baze znanja (npr. sex, ageYears, massKg). */
  answers: z.record(z.string().regex(/^[a-z][a-zA-Z0-9]*$/), FactValueSchema),
  /** Merenje mase koje je isti podatak kao odgovor „Trenutna masa" (MS §12 MEASURED). */
  massMeasurementId: UuidSchema.nullable(),
  /** null samo kod obrisanog snapshot-a (sadržaj uklonjen). */
  result: ProfileResultSchema.nullable(),
});
export type ProfileSnapshot = z.infer<typeof ProfileSnapshotSchema>;
