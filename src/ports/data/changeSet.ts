// ChangeSet — jedna atomska poruka upisa (ARCHITECTURE.md §7.1).
// Lokalno: jedna IndexedDB transakcija. Kasnije: jedan API poziv koji server izvršava transakciono.
import type { AuditEvent, Measurement, ProfileSnapshot } from "../../schemas";

export type ChangeRecord =
  | { readonly entity: "measurements"; readonly record: Measurement }
  | { readonly entity: "profile_snapshots"; readonly record: ProfileSnapshot };

export type ChangeOperation = ChangeRecord & {
  /** put: upis nove verzije; softDelete: nova verzija sa postavljenim deletedAt.
   *  Brisanje na zahtev korisnika (§8.2) za profil = softDelete zapisa bez sadržaja (DECISIONS/0016). */
  readonly op: "put" | "softDelete";
  /** Očekivana trenutna verzija u skladištu; null = zapis ne sme postojati. */
  readonly expectedRev: number | null;
};

export interface ChangeSet {
  readonly id: string;
  readonly createdAt: string;
  readonly operations: readonly ChangeOperation[];
  /** Uvek prisutan: nema promene bez audit zapisa. */
  readonly audit: AuditEvent;
}

export interface CommitResult {
  readonly changeSetId: string;
  readonly committedAt: string;
}

export interface UnitOfWork {
  /** Sve ili ništa. Neslaganje verzije → DataError("Conflict"), ništa se ne menja. */
  commit(changeSet: ChangeSet): Promise<CommitResult>;
}
