// Verzionisani skupovi formula i parametara (ARCHITECTURE.md §8.4 FormulaSet, §13).
// Vrednosti dolaze iz reference-data/, nikad kao konstante u kodu. Odobrava ih vlasnik (MS §39).
import { z } from "zod";

const WindowSchema = z.object({
  windowDays: z.number().int().min(2),
  minDays: z.number().int().min(2),
  edgeDays: z.number().int().min(1),
});

export const TrendFormulaSetSchema = z
  .object({
    id: z.literal("trend"),
    version: z.string().regex(/^\d+\.\d+\.\d+$/),
    approvedAt: z.iso.date(),
    approvedBy: z.string().min(1),
    document: z.string().min(1),
    sources: z.array(z.string().min(1)).min(1),
    /** T1: dan sa poznatim vremenima → prvo merenje; dan sa bar jednim naknadnim unosom → prosek. */
    dailyValue: z.object({ knownTime: z.literal("first"), unknownTime: z.literal("mean") }),
    /** T2 */
    average: z.object({ windowDays: z.number().int().min(1), minDays: z.number().int().min(1) }),
    /** T3 */
    slopes: z.array(WindowSchema).min(1),
    /** T4: prozor čiji se nagib koristi kao stopa promene. */
    rateWindowDays: z.number().int(),
    /** T5: izvan ovog opsega traži se potvrda pre čuvanja. */
    inputConfirm: z.object({ belowKg: z.number().positive(), aboveKg: z.number().positive() }),
    /** T6 */
    outlierRemoval: z.literal("none"),
  })
  .refine((f) => f.slopes.some((s) => s.windowDays === f.rateWindowDays), "rateWindowDays mora postojati u slopes")
  .refine((f) => f.slopes.every((s) => s.minDays <= s.windowDays && 2 * s.edgeDays <= s.windowDays), "neispravan prozor")
  .refine((f) => f.average.minDays <= f.average.windowDays && f.inputConfirm.belowKg < f.inputConfirm.aboveKg, "neispravni parametri");

export type TrendFormulaSet = z.infer<typeof TrendFormulaSetSchema>;
