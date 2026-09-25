// LocalDataProvider — implementacija data portova nad IndexedDB (ARCHITECTURE.md §7, §9).
// Jedino mesto (uz snapshots/openDatabase) koje zna za IndexedDB.
import { openDB } from "idb";
import {
  AuditEventSchema,
  CURRENT_SCHEMA_VERSION,
  DEFAULT_SETTINGS,
  MeasurementSchema,
  ProfileSnapshotSchema,
  SettingsSchema,
  USER_STORE_NAMES,
  UserDataSchema,
  type AuditEvent,
  type EntityRef,
  type Measurement,
  type MeasurementType,
  type ProfileSnapshot,
  type SettingKey,
  type Settings,
  type UserData,
} from "../../schemas";
import {
  DataError,
  type AuditRepository,
  type BackupStore,
  type ChangeSet,
  type CommitResult,
  type DataProvider,
  type MeasurementRepository,
  type ProfileRepository,
  type SecretStore,
  type SettingsRepository,
  type UnitOfWork,
} from "../../ports/data";
import { openMeraDatabase, type MeraDb, type OpenOptions } from "./openDatabase";
import { listSnapshots, saveSnapshotRaw } from "./snapshots";
import { SECRETS_DB_NAME } from "./structure";

function parseOrThrow<T>(schema: { safeParse(v: unknown): { success: true; data: T } | { success: false; error: { issues: { path: PropertyKey[]; message: string }[] } } }, value: unknown, what: string): T {
  const r = schema.safeParse(value);
  if (!r.success) {
    const i = r.error.issues[0];
    throw new DataError("ValidationFailed", `Neispravan zapis (${what}): ${i ? `${i.path.join(".")}: ${i.message}` : "nepoznato"}`, r.error);
  }
  return r.data;
}

function mapIdbError(e: unknown): never {
  if (e instanceof DataError) throw e;
  if (e instanceof DOMException && e.name === "QuotaExceededError") throw new DataError("StorageFull", "Nema dovoljno prostora na uređaju.", e);
  throw new DataError("Unavailable", `Greška skladišta: ${e instanceof Error ? e.message : String(e)}`, e);
}

class LocalMeasurements implements MeasurementRepository {
  constructor(private readonly db: MeraDb) {}

  async get(id: string): Promise<Measurement> {
    const raw = await this.db.get("measurements", id).catch(mapIdbError);
    if (!raw) throw new DataError("NotFound", `Merenje ${id} ne postoji.`);
    const m = parseOrThrow(MeasurementSchema, raw, "measurements");
    if (m.deletedAt !== null) throw new DataError("NotFound", `Merenje ${id} je obrisano.`);
    return m;
  }

  async listRange(type: MeasurementType, fromLocalDate: string, toLocalDate: string): Promise<Measurement[]> {
    // Opseg po localDate preko indeksa; tip i brisanje filtriraju se ovde, u repozitorijumu.
    const byDate = await this.db.getAllFromIndex("measurements", "localDate", IDBKeyRange.bound(fromLocalDate, toLocalDate)).catch(mapIdbError);
    return byDate
      .map((r) => parseOrThrow(MeasurementSchema, r, "measurements"))
      .filter((m) => m.type === type && m.deletedAt === null)
      .sort((a, b) => a.measuredAt.localeCompare(b.measuredAt));
  }

  async latest(type: MeasurementType): Promise<Measurement | null> {
    const tx = this.db.transaction("measurements", "readonly");
    const range = IDBKeyRange.bound([type, ""], [type, "\uffff"]);
    let cursor = await tx.store.index("type_measuredAt").openCursor(range, "prev").catch(mapIdbError);
    while (cursor) {
      const m = parseOrThrow(MeasurementSchema, cursor.value, "measurements");
      if (m.deletedAt === null) {
        await tx.done;
        return m;
      }
      cursor = await cursor.continue();
    }
    await tx.done;
    return null;
  }

  async countActive(): Promise<number> {
    const all = await this.db.getAll("measurements").catch(mapIdbError);
    return all.filter((r) => (r as { deletedAt: string | null }).deletedAt === null).length;
  }
}

class LocalProfiles implements ProfileRepository {
  constructor(private readonly db: MeraDb) {}

  async listActive(): Promise<ProfileSnapshot[]> {
    const all = await this.db.getAllFromIndex("profile_snapshots", "createdAt").catch(mapIdbError);
    return all
      .map((r) => parseOrThrow(ProfileSnapshotSchema, r, "profile_snapshots"))
      .filter((p) => p.deletedAt === null)
      .sort((a, b) => a.createdAt.localeCompare(b.createdAt));
  }

  async current(): Promise<ProfileSnapshot | null> {
    const list = await this.listActive();
    return list.at(-1) ?? null;
  }
}

/** Šema zapisa po skladištu — svaki upis kroz UnitOfWork prolazi šemu svog entiteta. */
const RECORD_SCHEMAS = { measurements: MeasurementSchema, profile_snapshots: ProfileSnapshotSchema } as const;

class LocalAudit implements AuditRepository {
  constructor(private readonly db: MeraDb) {}

  async listForEntity(ref: EntityRef): Promise<AuditEvent[]> {
    const all = await this.db.getAllFromIndex("audit_events", "at").catch(mapIdbError);
    return all
      .map((r) => parseOrThrow(AuditEventSchema, r, "audit_events"))
      .filter((e) => e.entityRefs.some((x) => x.entity === ref.entity && x.id === ref.id));
  }

  async listRange(fromIso: string, toIso: string): Promise<AuditEvent[]> {
    const all = await this.db.getAllFromIndex("audit_events", "at", IDBKeyRange.bound(fromIso, toIso)).catch(mapIdbError);
    return all.map((r) => parseOrThrow(AuditEventSchema, r, "audit_events"));
  }
}

class LocalSettings implements SettingsRepository {
  constructor(private readonly db: MeraDb) {}

  async getAll(): Promise<Settings> {
    const rec = (await this.db.get("settings", "settings").catch(mapIdbError)) as { value: unknown } | undefined;
    if (!rec) return { ...DEFAULT_SETTINGS };
    return parseOrThrow(SettingsSchema, { ...DEFAULT_SETTINGS, ...(rec.value as object) }, "settings");
  }

  async set<K extends SettingKey>(key: K, value: Settings[K]): Promise<void> {
    const tx = this.db.transaction("settings", "readwrite");
    const rec = (await tx.store.get("settings")) as { value: Settings } | undefined;
    const next = parseOrThrow(SettingsSchema, { ...DEFAULT_SETTINGS, ...(rec?.value ?? {}), [key]: value }, "settings");
    await tx.store.put({ key: "settings", value: next });
    await tx.done.catch(mapIdbError);
  }
}

class LocalSecrets implements SecretStore {
  private open() {
    return openDB(SECRETS_DB_NAME, 1, { upgrade: (db) => void db.createObjectStore("secrets") });
  }
  async get(name: "ai_api_key"): Promise<string | null> {
    const db = await this.open();
    const v = (await db.get("secrets", name)) as string | undefined;
    db.close();
    return v ?? null;
  }
  async set(name: "ai_api_key", value: string): Promise<void> {
    const db = await this.open();
    await db.put("secrets", value, name);
    db.close();
  }
  async clear(name: "ai_api_key"): Promise<void> {
    const db = await this.open();
    await db.delete("secrets", name);
    db.close();
  }
}

class LocalUnitOfWork implements UnitOfWork {
  constructor(
    private readonly db: MeraDb,
    private readonly userId: string,
  ) {}

  async commit(cs: ChangeSet): Promise<CommitResult> {
    // Sve provere oblika PRE otvaranja transakcije (IndexedDB transakcija se automatski završava).
    const audit = parseOrThrow(AuditEventSchema, cs.audit, "audit_events");
    if (audit.userId !== this.userId) throw new DataError("ValidationFailed", "Audit događaj pripada drugom korisniku.");
    const ops = cs.operations.map((op) => {
      const record = parseOrThrow<{ id: string; userId: string; rev: number; deletedAt: string | null }>(RECORD_SCHEMAS[op.entity], op.record, op.entity);
      if (record.userId !== this.userId) throw new DataError("ValidationFailed", `Zapis ${record.id} pripada drugom korisniku.`);
      if (op.op === "softDelete" && record.deletedAt === null) throw new DataError("ValidationFailed", "softDelete zahteva postavljen deletedAt.");
      if (op.op === "put" && record.deletedAt !== null) throw new DataError("ValidationFailed", "put ne sme imati deletedAt; koristi softDelete.");
      const expectedNext = op.expectedRev === null ? 1 : op.expectedRev + 1;
      if (record.rev !== expectedNext) throw new DataError("ValidationFailed", `rev ${record.rev} ne odgovara očekivanom ${expectedNext}.`);
      return { ...op, record };
    });
    const stores = [...new Set([...ops.map((o) => o.entity), "audit_events"])];
    const tx = this.db.transaction(stores, "readwrite");
    try {
      for (const op of ops) {
        const current = (await tx.objectStore(op.entity).get(op.record.id)) as { rev: number } | undefined;
        const actualRev = current?.rev ?? null;
        if (actualRev !== op.expectedRev) {
          tx.abort();
          throw new DataError("Conflict", `Zapis ${op.record.id}: očekivana verzija ${String(op.expectedRev)}, u skladištu ${String(actualRev)}.`);
        }
        await tx.objectStore(op.entity).put(op.record);
      }
      if (await tx.objectStore("audit_events").get(audit.id)) {
        tx.abort();
        throw new DataError("Conflict", `Audit događaj ${audit.id} već postoji.`);
      }
      await tx.objectStore("audit_events").put(audit);
      await tx.done;
    } catch (e) {
      await tx.done.catch(() => undefined);
      mapIdbError(e);
    }
    return { changeSetId: cs.id, committedAt: audit.at };
  }
}

class LocalBackup implements BackupStore {
  constructor(
    private readonly db: MeraDb,
    private readonly userId: string,
    private readonly opts: OpenOptions,
  ) {}

  async info() {
    return { userId: this.userId, schemaVersion: CURRENT_SCHEMA_VERSION };
  }

  async readAllUserData(): Promise<UserData> {
    const tx = this.db.transaction([...USER_STORE_NAMES], "readonly");
    const raw: Record<string, unknown[]> = {};
    for (const s of USER_STORE_NAMES) raw[s] = await tx.objectStore(s).getAll();
    await tx.done.catch(mapIdbError);
    return parseOrThrow(UserDataSchema, raw, "svi podaci");
  }

  async replaceAllUserData(data: UserData): Promise<void> {
    const valid = parseOrThrow(UserDataSchema, data, "uvoz");
    const tx = this.db.transaction([...USER_STORE_NAMES], "readwrite");
    try {
      for (const s of USER_STORE_NAMES) {
        const store = tx.objectStore(s);
        await store.clear();
        for (const rec of valid[s]) await store.put(rec);
      }
      await tx.done;
    } catch (e) {
      await tx.done.catch(() => undefined);
      mapIdbError(e);
    }
  }

  async saveSafetySnapshot(reason: "pre-import" | "pre-migration") {
    const data = await this.readAllUserData();
    return saveSnapshotRaw({ reason, schemaVersion: CURRENT_SCHEMA_VERSION, data, userId: this.userId }, this.opts);
  }

  listSafetySnapshots() {
    return listSnapshots();
  }
}

export async function createLocalDataProvider(opts: OpenOptions): Promise<DataProvider & { readonly migratedFrom: number | null }> {
  const { db, userId, migratedFrom } = await openMeraDatabase(opts);
  return {
    measurements: new LocalMeasurements(db),
    profiles: new LocalProfiles(db),
    audit: new LocalAudit(db),
    settings: new LocalSettings(db),
    secrets: new LocalSecrets(),
    unitOfWork: new LocalUnitOfWork(db, userId),
    backup: new LocalBackup(db, userId, opts),
    migratedFrom,
    close: () => db.close(),
  };
}
