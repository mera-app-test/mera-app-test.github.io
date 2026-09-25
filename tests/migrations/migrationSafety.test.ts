// Zaštitni tok migracije (ARCHITECTURE.md §10.3) sa PROBNIM migracijama trenutna → trenutna + 1,
// i stvarna migracija v1 → v2 (profile_snapshots, DECISIONS/0016) nad bazom kakva je na telefonu vlasnika.
import "fake-indexeddb/auto";
import { IDBFactory } from "fake-indexeddb";
import { openDB } from "idb";
import { beforeEach, describe, expect, it } from "vitest";
import { createLocalDataProvider, DB_NAME } from "../../src/infrastructure/data-local";
import { DEFAULT_SCHEMA, MigrationValidationError, type SchemaDefinition } from "../../src/infrastructure/data-local/openDatabase";
import { STRUCTURE_STEPS } from "../../src/infrastructure/data-local/structure";
import { isDataError } from "../../src/ports/data";
import { CURRENT_SCHEMA_VERSION, DATA_MIGRATIONS, type Measurement } from "../../src/schemas";
import { ctx, mass, putNew, seqIds } from "../support/fixtures";

beforeEach(() => {
  globalThis.indexedDB = new IDBFactory();
});

const opts = () => ({ now: () => "2026-09-23T10:00:00.000Z", newId: seqIds("t") });

const NEXT = CURRENT_SCHEMA_VERSION + 1;

async function seedCurrent(): Promise<Measurement> {
  const dp = await createLocalDataProvider(opts());
  const { userId } = await dp.backup.info();
  const c = ctx("2026-09-20T06:00:00.000Z", seqIds("v"), userId);
  const m = mass(c, 92.4, "2026-09-20T06:00:00.000Z", "2026-09-20");
  await dp.unitOfWork.commit(putNew(c, m));
  dp.close();
  return m;
}

function probe(transform: (m: Record<string, unknown>) => Record<string, unknown>, extraStore = true): SchemaDefinition {
  return {
    ...DEFAULT_SCHEMA,
    version: NEXT,
    structure: [
      ...STRUCTURE_STEPS,
      { toVersion: NEXT, apply: (db) => { if (extraStore) db.createObjectStore("probna", { keyPath: "id" }); } },
    ],
    dataMigrations: [
      ...DATA_MIGRATIONS,
      {
        toVersion: NEXT,
        description: "probna migracija",
        transform: (d) => ({ ...d, measurements: (d.measurements ?? []).map((r) => transform(r as Record<string, unknown>)) }),
      },
    ],
  };
}

async function dbVersion(): Promise<number> {
  const list = await indexedDB.databases();
  return list.find((d) => d.name === DB_NAME)?.version ?? 0;
}

describe("zaštitni tok migracije", () => {
  it("uspešna migracija: podaci transformisani, pravi se zaštitna kopija", async () => {
    const m = await seedCurrent();
    const dp = await createLocalDataProvider({ ...opts(), schema: probe((r) => ({ ...r, note: "migrirano" })) });
    expect(dp.migratedFrom).toBe(CURRENT_SCHEMA_VERSION);
    expect(await dbVersion()).toBe(NEXT);
    expect((await dp.measurements.get(m.id)).note).toBe("migrirano");
    const snaps = await dp.backup.listSafetySnapshots();
    expect(snaps.map((s) => [s.reason, s.schemaVersion])).toEqual([["pre-migration", CURRENT_SCHEMA_VERSION]]);
  });

  it("migracija čiji rezultat ne prolazi proveru → vraćanje iz zaštitne kopije", async () => {
    const m = await seedCurrent();
    const err = await createLocalDataProvider({ ...opts(), schema: probe((r) => ({ ...r, value: -1 })) }).catch((e: unknown) => e);
    expect(err).toBeInstanceOf(MigrationValidationError);
    expect(await dbVersion()).toBe(CURRENT_SCHEMA_VERSION);
    // Stara aplikacija i dalje vidi netaknute podatke.
    const dp = await createLocalDataProvider(opts());
    expect(await dp.measurements.get(m.id)).toEqual(m);
  });

  it("transformacija koja baci grešku prekida nadogradnju; baza ostaje na staroj verziji", async () => {
    const m = await seedCurrent();
    const err = await createLocalDataProvider({ ...opts(), schema: probe(() => { throw new Error("greška u migraciji"); }) }).catch((e: unknown) => e);
    expect(isDataError(err, "Unavailable")).toBe(true);
    expect(await dbVersion()).toBe(CURRENT_SCHEMA_VERSION);
    const dp = await createLocalDataProvider(opts());
    expect(await dp.measurements.get(m.id)).toEqual(m);
  });
});

describe("baza bez korisnika u meta skladištu", () => {
  it("dobija korisnika pri otvaranju", async () => {
    const db = await openDB(DB_NAME, 1, { upgrade: (d, _o, _n, tx) => STRUCTURE_STEPS[0]!.apply(d, tx) });
    db.close();
    const dp = await createLocalDataProvider(opts());
    expect((await dp.backup.info()).userId).toMatch(/^[0-9a-f-]{36}$/);
  });
});

describe("stvarna migracija v1 → v2 (odgovori na upitnik)", () => {
  it("baza v1 sa merenjima i auditom: podaci ostaju isti, dodaje se prazno skladište profila, pravi se zaštitna kopija", async () => {
    // Baza tačno kakva je bila u verziji 0.5.4 (šema 1).
    const db = await openDB(DB_NAME, 1, { upgrade: (d, _o, _n, tx) => STRUCTURE_STEPS[0]!.apply(d, tx) });
    const userId = "00000000-0000-4000-8000-0000000000aa";
    const c = ctx("2026-09-20T06:00:00.000Z", seqIds("m"), userId);
    const m = mass(c, 92.4, "2026-09-20T06:00:00.000Z", "2026-09-20");
    const cs = putNew(c, m);
    await db.put("meta", { key: "userId", value: userId });
    await db.put("measurements", m);
    await db.put("audit_events", cs.audit);
    db.close();

    const dp = await createLocalDataProvider(opts());
    expect(dp.migratedFrom).toBe(1);
    expect(await dbVersion()).toBe(2);
    expect((await dp.backup.info()).userId).toBe(userId);
    expect(await dp.measurements.get(m.id)).toEqual(m);
    const all = await dp.backup.readAllUserData();
    expect(all.audit_events).toEqual([cs.audit]);
    expect(all.profile_snapshots).toEqual([]);
    expect(await dp.profiles.current()).toBeNull();
    const snaps = await dp.backup.listSafetySnapshots();
    expect(snaps.map((s) => [s.reason, s.schemaVersion])).toEqual([["pre-migration", 1]]);
  });
});
