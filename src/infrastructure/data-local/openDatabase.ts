// Otvaranje baze sa zaštitom pri migraciji (ARCHITECTURE.md §10.3).
import { deleteDB, openDB, type IDBPDatabase } from "idb";
import {
  CURRENT_SCHEMA_VERSION,
  DATA_MIGRATIONS,
  USER_STORE_NAMES,
  UserDataSchema,
  type RawUserData,
} from "../../schemas";
import { DataError } from "../../ports/data";
import { DB_NAME, STRUCTURE_STEPS, type StructureStep } from "./structure";
import type { DataMigration } from "../../schemas";
import { readSnapshot, saveSnapshotRaw } from "./snapshots";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type MeraDb = IDBPDatabase<any>;

/** Definicija šeme; podrazumevano stvarna. Testovi ubacuju probne migracije da provere zaštitni tok. */
export interface SchemaDefinition {
  readonly version: number;
  readonly structure: readonly StructureStep[];
  readonly dataMigrations: readonly DataMigration[];
  readonly validate: (raw: RawUserData) => { ok: true } | { ok: false; detail: string };
}

export const DEFAULT_SCHEMA: SchemaDefinition = {
  version: CURRENT_SCHEMA_VERSION,
  structure: STRUCTURE_STEPS,
  dataMigrations: DATA_MIGRATIONS,
  validate: (raw) => {
    const r = UserDataSchema.safeParse(raw);
    if (r.success) return { ok: true };
    const i = r.error.issues[0];
    return { ok: false, detail: i ? `${i.path.join(".")}: ${i.message}` : "nepoznato" };
  },
};

export interface OpenOptions {
  /** Samo za testove. */
  schema?: SchemaDefinition;
  /** Poziva se kada druga kartica traži novu verziju baze; baza je već zatvorena. */
  onVersionChange?: () => void;
  now: () => string;
  newId: () => string;
}

export interface OpenResult {
  readonly db: MeraDb;
  readonly userId: string;
  readonly migratedFrom: number | null;
}

async function existingVersion(name: string): Promise<number | null> {
  if (typeof indexedDB.databases === "function") {
    const list = await indexedDB.databases();
    const found = list.find((d) => d.name === name);
    return found?.version ?? null;
  }
  throw new DataError("Unavailable", "indexedDB.databases() nije dostupan; ne mogu bezbedno utvrditi verziju baze.");
}

async function openAt(version: number, opts: OpenOptions): Promise<MeraDb> {
  const schema = opts.schema ?? DEFAULT_SCHEMA;
  const db = await openDB(DB_NAME, version, {
    upgrade(database, oldVersion, newVersion, tx) {
      // Prekid nadogradnje prijavljuje openDB; ovde samo sprečavamo neobrađeno odbijanje tx.done.
      tx.done.catch(() => undefined);
      const target = newVersion ?? version;
      for (let v = oldVersion + 1; v <= target; v++) {
        const step = schema.structure.find((s) => s.toVersion === v);
        if (!step) throw new Error(`Nedostaje strukturni korak za verziju ${v}`);
        step.apply(database, tx);
        const dataMigration = schema.dataMigrations.find((m) => m.toVersion === v);
        if (dataMigration && oldVersion > 0) {
          // Transformacija podataka unutar iste versionchange transakcije: samo IDB zahtevi se čekaju.
          // Greška u transformaciji prekida celu nadogradnju (tx.abort) — baza ostaje na staroj verziji.
          void (async () => {
            const raw: RawUserData = {};
            for (const s of USER_STORE_NAMES) raw[s] = await tx.objectStore(s).getAll();
            const out = dataMigration.transform(raw);
            for (const s of USER_STORE_NAMES) {
              const store = tx.objectStore(s);
              await store.clear();
              for (const rec of out[s] ?? []) await store.put(rec);
            }
          })().catch(() => {
            try { tx.abort(); } catch { /* već završeno */ }
          });
        }
      }
    },
    blocked() {
      // Druga kartica drži staru verziju otvorenom.
    },
  });
  db.addEventListener("versionchange", () => {
    db.close();
    opts.onVersionChange?.();
  });
  return db;
}

async function readRaw(db: MeraDb): Promise<RawUserData> {
  const tx = db.transaction([...USER_STORE_NAMES], "readonly");
  const raw: RawUserData = {};
  for (const s of USER_STORE_NAMES) raw[s] = await tx.objectStore(s).getAll();
  await tx.done;
  return raw;
}

async function ensureUserId(db: MeraDb, opts: OpenOptions): Promise<string> {
  const tx = db.transaction("meta", "readwrite");
  const existing = (await tx.store.get("userId")) as { key: string; value: string } | undefined;
  if (existing) {
    await tx.done;
    return existing.value;
  }
  const userId = opts.newId();
  await tx.store.put({ key: "userId", value: userId });
  await tx.store.put({ key: "createdAt", value: opts.now() });
  await tx.done;
  return userId;
}

/** Vraćanje iz zaštitne kopije: baza se briše i gradi ponovo na verziji iz kopije. */
export async function restoreFromSnapshot(snapshotId: string, opts: OpenOptions): Promise<void> {
  const snap = await readSnapshot(snapshotId);
  if (!snap) throw new DataError("NotFound", `Zaštitna kopija ${snapshotId} ne postoji.`);
  await deleteDB(DB_NAME);
  const db = await openAt(snap.schemaVersion, opts);
  const stores = Object.keys(snap.data);
  const tx = db.transaction([...stores, "meta"], "readwrite");
  for (const s of stores) for (const rec of snap.data[s] ?? []) await tx.objectStore(s).put(rec);
  if (snap.userId) await tx.objectStore("meta").put({ key: "userId", value: snap.userId });
  await tx.done;
  db.close();
}

export class MigrationValidationError extends Error {
  constructor(readonly fromVersion: number, readonly snapshotId: string, detail: string) {
    super(`Migracija sa verzije ${fromVersion} nije prošla proveru (${detail}). Podaci su vraćeni iz zaštitne kopije.`);
  }
}

export async function openMeraDatabase(opts: OpenOptions): Promise<OpenResult> {
  const schema = opts.schema ?? DEFAULT_SCHEMA;
  const current = await existingVersion(DB_NAME);
  if (current !== null && current > schema.version) {
    throw new DataError("Unavailable", `Baza je iz novije verzije Mere (${current}). Ažuriraj aplikaciju.`);
  }

  if (current === null || current === schema.version) {
    const db = await openAt(schema.version, opts);
    return { db, userId: await ensureUserId(db, opts), migratedFrom: null };
  }

  // Potrebna migracija: prvo zaštitna kopija starog stanja.
  const old = await openAt(current, opts);
  const oldRaw = await readRaw(old);
  const oldUser = (await old.get("meta", "userId")) as { value: string } | undefined;
  old.close();
  const snap = await saveSnapshotRaw({ reason: "pre-migration", schemaVersion: current, data: oldRaw, userId: oldUser?.value ?? null }, opts);

  let db: MeraDb;
  try {
    db = await openAt(schema.version, opts);
  } catch (e) {
    // Nadogradnja prekinuta (npr. greška u transformaciji): baza je ostala na staroj verziji.
    throw new DataError("Unavailable", `Nadogradnja podataka nije uspela: ${e instanceof Error ? e.message : String(e)}. Podaci su ostali na staroj verziji.`, e);
  }
  const check = schema.validate(await readRaw(db));
  if (!check.ok) {
    db.close();
    await restoreFromSnapshot(snap.id, opts);
    throw new MigrationValidationError(current, snap.id, check.detail);
  }
  return { db, userId: await ensureUserId(db, opts), migratedFrom: current };
}
