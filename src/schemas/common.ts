// Zajednička polja i osnovni tipovi (ARCHITECTURE.md §8.1).
import { z } from "zod";

export const UuidSchema = z.uuid();
export const IsoDateTimeSchema = z.iso.datetime({ offset: false });
/** Lokalni kalendarski datum korisnika, YYYY-MM-DD. */
export const LocalDateSchema = z.iso.date();

/** Trenutna verzija šeme korisničkih podataka. Menja se isključivo uz novu migraciju. */
export const CURRENT_SCHEMA_VERSION = 2 as const;

export const BaseRecordSchema = z.object({
  id: UuidSchema,
  userId: UuidSchema,
  rev: z.number().int().min(1),
  createdAt: IsoDateTimeSchema,
  updatedAt: IsoDateTimeSchema,
  deletedAt: IsoDateTimeSchema.nullable(),
  schemaVersion: z.number().int().min(1),
});
export type BaseRecord = z.infer<typeof BaseRecordSchema>;
