// Pomoćne funkcije za testove: deterministički sat i ID-jevi, pravljenje zapisa.
import { auditEvent, newBase, nextRevision, softDeleted, type RecordContext } from "../../src/application";
import type { Measurement } from "../../src/schemas";
import type { ChangeSet } from "../../src/ports/data";

export const USER = "00000000-0000-4000-8000-000000000001";

export function seqIds(prefix = "a"): () => string {
  let n = 0;
  return () => {
    n += 1;
    const hex = n.toString(16).padStart(12, "0");
    const p = prefix.charCodeAt(0).toString(16).padStart(8, "0").slice(-8);
    return `${p}-0000-4000-8000-${hex}`;
  };
}

export function ctx(nowIso: string, newId: () => string, userId = USER): RecordContext {
  return { userId, nowIso, newId, appVersion: "test" };
}

export function mass(c: RecordContext, value: number, measuredAt: string, localDate: string): Measurement {
  return { ...newBase(c), type: "body_mass", value, unit: "kg", measuredAt, localDate, timeZone: "Europe/Belgrade", note: null };
}

export function putNew(c: RecordContext, m: Measurement): ChangeSet {
  return {
    id: c.newId(),
    createdAt: c.nowIso,
    operations: [{ entity: "measurements", op: "put", record: m, expectedRev: null }],
    audit: auditEvent(c, { actor: "user", useCase: "logWeight", entityRefs: [{ entity: "measurements", id: m.id }], summary: "unos mase" }),
  };
}

export function putUpdate(c: RecordContext, prev: Measurement, value: number): { cs: ChangeSet; next: Measurement } {
  const next = nextRevision(prev, { value }, c.nowIso);
  return {
    next,
    cs: {
      id: c.newId(),
      createdAt: c.nowIso,
      operations: [{ entity: "measurements", op: "put", record: next, expectedRev: prev.rev }],
      audit: auditEvent(c, { actor: "user", useCase: "editWeight", entityRefs: [{ entity: "measurements", id: prev.id }], summary: "izmena mase" }),
    },
  };
}

export function deleteOf(c: RecordContext, prev: Measurement): ChangeSet {
  return {
    id: c.newId(),
    createdAt: c.nowIso,
    operations: [{ entity: "measurements", op: "softDelete", record: softDeleted(prev, c.nowIso), expectedRev: prev.rev }],
    audit: auditEvent(c, { actor: "user", useCase: "deleteWeight", entityRefs: [{ entity: "measurements", id: prev.id }], summary: "brisanje mase" }),
  };
}
