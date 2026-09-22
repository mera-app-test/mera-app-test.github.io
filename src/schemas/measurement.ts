// MEASURED podaci (MS §12, ARCHITECTURE.md §8.4). V1 šema 1: telesna masa.
// Ostale mere (npr. obim struka) dodaju se kroz migraciju kada budu u obuhvatu.
import { z } from "zod";
import { BaseRecordSchema, IsoDateTimeSchema, LocalDateSchema } from "./common";

export const MeasurementTypeSchema = z.enum(["body_mass"]);
export type MeasurementType = z.infer<typeof MeasurementTypeSchema>;

export const MeasurementSchema = BaseRecordSchema.extend({
  type: MeasurementTypeSchema,
  /** Vrednost u osnovnoj jedinici tipa (body_mass: kg). Bez zaokruživanja. */
  value: z.number().positive().finite(),
  unit: z.literal("kg"),
  measuredAt: IsoDateTimeSchema,
  localDate: LocalDateSchema,
  timeZone: z.string().min(1),
  note: z.string().max(500).nullable(),
});
export type Measurement = z.infer<typeof MeasurementSchema>;
