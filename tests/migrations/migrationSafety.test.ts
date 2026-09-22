// Zaštitni tok migracije (ARCHITECTURE.md §10.3) sa PROBNIM migracijama v1 → v2.
// Stvarna šema nema migracija; ovde se proverava mehanizam pre nego što prva stvarna migracija zatreba.
import "fake-indexeddb/auto";
import { IDBFactory } from "fake-indexeddb";
import { openDB } from "idb";
import { beforeEach, describe, expect, it } from "vitest";
import { createLocalDataProvider, DB_NAME } from "../../src/infrastructure/data-local";
import { DEFAULT_SCHEMA, MigrationValidationError, type SchemaDefinition } from "../../src/infrastructure/data-local/openDatabase";
import { STRUCTURE_STEPS } from "../../src/infrastructure/data-local/structure";
import { isDataError } from "../../src/ports/data";
import type { Measurement } from "../../src/schemas";
import { ctx, mass, putNew, seqIds } from "../support/fixtures";

beforeEach(() => {
  globalThis.indexedDB = new IDBFactory();
});

const opts = () => ({ now: () => "2026-09-23T10:00:00.000Z", newId: seqIds("t") });

async function seedV1(): Promise<Measurement> {
  const dp = await createLocalDataProvider(opts());
  const { userId } = await dp.backup.info();
  const c = ctx("2026-09-20T06:00:00.000Z", seqIds("v"), userId);
  const m = mass(c, 92.4, "2026-09-20T06:00:00.000Z", "2026-09-20");
  await dp.unitOfWork.commit(putNew(c, m));
  dp.close();
  return m;
}

function v2(transform: (m: Record<string, unknown>) => Record<string, unknown>, extraStore = true): SchemaDefinition {
  return {
    ...DEFAULT_SCHEMA,
    version: 2,
    structure: [
      ...STRUCTURE_STEPS,
      { toVersion: 2, apply: (db) => { if (extraStore) db.createObjectStore("probna_v2", { keyPath: "id" }); } },
    ],
    dataMigrations: [
      {
        toVersion: 2,
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
    const m = await seedV1();
    const dp = await createLocalDataProvider({ ...opts(), schema: v2((r) => ({ ...r, note: "migrirano" })) });
    expect(dp.migratedFrom).toBe(1);
    expect(await dbVersion()).toBe(2);
    expect((await dp.measurements.get(m.id)).note).toBe("migrirano");
    const snaps = await dp.backup.listSafetySnapshots();
    expect(snaps.map((s) => [s.reason, s.schemaVersion])).toEqual([["pre-migration", 1]]);
  });

  it("migracija čiji rezultat ne prolazi proveru → vraćanje iz zaštitne kopije", async () => {
    const m = await seedV1();
    const err = await createLocalDataProvider({ ...opts(), schema: v2((r) => ({ ...r, value: -1 })) }).catch((e: unknown) => e);
    expect(err).toBeInstanceOf(MigrationValidationError);
    expect(await dbVersion()).toBe(1);
    // Stara aplikacija (v1) i dalje vidi netaknute podatke.
    const dp = await createLocalDataProvider(opts());
    expect(await dp.measurements.get(m.id)).toEqual(m);
  });

  it("transformacija koja baci grešku prekida nadogradnju; baza ostaje v1", async () => {
    const m = await seedV1();
    const err = await createLocalDataProvider({ ...opts(), schema: v2(() => { throw new Error("greška u migraciji"); }) }).catch((e: unknown) => e);
    expect(isDataError(err, "Unavailable")).toBe(true);
    expect(await dbVersion()).toBe(1);
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
