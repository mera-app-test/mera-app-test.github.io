// Strukturni koraci IndexedDB šeme po verziji (ARCHITECTURE.md §9, §10.2).
// Verzija baze = verzija šeme korisničkih podataka. Objavljen korak se nikad ne menja.
import type { IDBPDatabase, IDBPTransaction } from "idb";

export const DB_NAME = "mera";
export const SECRETS_DB_NAME = "mera_secrets";
export const SNAPSHOTS_DB_NAME = "mera_safety_snapshots";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyDb = IDBPDatabase<any>;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyTx = IDBPTransaction<any, any, "versionchange">;

export interface StructureStep {
  readonly toVersion: number;
  apply(db: AnyDb, tx: AnyTx): void;
}

export const STRUCTURE_STEPS: readonly StructureStep[] = [
  {
    toVersion: 1,
    apply(db) {
      db.createObjectStore("meta", { keyPath: "key" });
      db.createObjectStore("settings", { keyPath: "key" });
      const m = db.createObjectStore("measurements", { keyPath: "id" });
      m.createIndex("type_measuredAt", ["type", "measuredAt"]);
      m.createIndex("localDate", "localDate");
      const a = db.createObjectStore("audit_events", { keyPath: "id" });
      a.createIndex("at", "at");
    },
  },
];
