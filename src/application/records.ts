// Pravljenje zapisa i audit događaja — čiste funkcije (ARCHITECTURE.md §8.1, §13 tačka 17).
import { CURRENT_SCHEMA_VERSION, type AuditEvent, type BaseRecord, type EntityRef } from "../schemas";

export interface RecordContext {
  readonly userId: string;
  readonly nowIso: string;
  readonly newId: () => string;
  readonly appVersion: string;
}

export function newBase(ctx: RecordContext): BaseRecord {
  return {
    id: ctx.newId(),
    userId: ctx.userId,
    rev: 1,
    createdAt: ctx.nowIso,
    updatedAt: ctx.nowIso,
    deletedAt: null,
    schemaVersion: CURRENT_SCHEMA_VERSION,
  };
}

/** Nova verzija postojećeg zapisa: rev + 1, updatedAt = sada. */
export function nextRevision<T extends BaseRecord>(prev: T, changes: Partial<Omit<T, keyof BaseRecord>>, nowIso: string): T {
  return { ...prev, ...changes, rev: prev.rev + 1, updatedAt: nowIso, schemaVersion: CURRENT_SCHEMA_VERSION };
}

export function softDeleted<T extends BaseRecord>(prev: T, nowIso: string): T {
  return { ...prev, rev: prev.rev + 1, updatedAt: nowIso, deletedAt: nowIso };
}

export function auditEvent(
  ctx: RecordContext,
  input: { actor: AuditEvent["actor"]; useCase: string; entityRefs: EntityRef[]; summary: string },
): AuditEvent {
  return {
    ...newBase(ctx),
    at: ctx.nowIso,
    actor: input.actor,
    useCase: input.useCase,
    entityRefs: input.entityRefs,
    summary: input.summary,
    provenance: { appVersion: ctx.appVersion, schemaVersion: CURRENT_SCHEMA_VERSION },
  };
}
