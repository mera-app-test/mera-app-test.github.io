// Audit događaj — append-only (MS §44, ARCHITECTURE.md §8.4).
import { z } from "zod";
import { BaseRecordSchema, IsoDateTimeSchema, UuidSchema } from "./common";

export const EntityNameSchema = z.enum(["measurements", "audit_events"]);
export type EntityName = z.infer<typeof EntityNameSchema>;

export const EntityRefSchema = z.object({ entity: EntityNameSchema, id: UuidSchema });
export type EntityRef = z.infer<typeof EntityRefSchema>;

export const ProvenanceSchema = z.object({
  appVersion: z.string().min(1),
  schemaVersion: z.number().int().min(1),
});
export type Provenance = z.infer<typeof ProvenanceSchema>;

export const AuditEventSchema = BaseRecordSchema.extend({
  at: IsoDateTimeSchema,
  actor: z.enum(["user", "system", "ai"]),
  useCase: z.string().min(1),
  entityRefs: z.array(EntityRefSchema),
  summary: z.string().max(500),
  provenance: ProvenanceSchema,
});
export type AuditEvent = z.infer<typeof AuditEventSchema>;
