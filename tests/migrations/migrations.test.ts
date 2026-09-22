import "fake-indexeddb/auto";
import { IDBFactory } from "fake-indexeddb";
import { openDB } from "idb";
import { beforeEach, describe, expect, it } from "vitest";
import { CURRENT_SCHEMA_VERSION, migrateUserData, MigrationError } from "../../src/schemas";
import { createLocalDataProvider, DB_NAME } from "../../src/infrastructure/data-local";
import { isDataError } from "../../src/ports/data";
import { seqIds } from "../support/fixtures";

beforeEach(() => {
  globalThis.indexedDB = new IDBFactory();
});

describe("migracije podataka (čiste funkcije)", () => {
  it("podaci trenutne verzije prolaze nepromenjeni", () => {
    const data = { measurements: [], audit_events: [] };
    expect(migrateUserData(data, CURRENT_SCHEMA_VERSION)).toBe(data);
  });
  it("novija verzija od aplikacije se odbija", () => {
    expect(() => migrateUserData({}, CURRENT_SCHEMA_VERSION + 1)).toThrow(MigrationError);
  });
  it("neispravna verzija se odbija", () => {
    expect(() => migrateUserData({}, 0)).toThrow(MigrationError);
  });
});

describe("otvaranje baze", () => {
  it("nova instalacija pravi bazu trenutne verzije i korisnika", async () => {
    const dp = await createLocalDataProvider({ now: () => "2026-09-23T10:00:00.000Z", newId: seqIds("o") });
    const info = await dp.backup.info();
    expect(info.schemaVersion).toBe(CURRENT_SCHEMA_VERSION);
    dp.close();
    const again = await createLocalDataProvider({ now: () => "2026-09-23T11:00:00.000Z", newId: seqIds("q") });
    expect((await again.backup.info()).userId).toBe(info.userId); // isti korisnik posle ponovnog otvaranja
    expect(again.migratedFrom).toBeNull();
  });

  it("baza novije verzije od aplikacije se ne otvara", async () => {
    const db = await openDB(DB_NAME, CURRENT_SCHEMA_VERSION + 1, { upgrade: (d) => void d.createObjectStore("meta", { keyPath: "key" }) });
    db.close();
    const err = await createLocalDataProvider({ now: () => "2026-09-23T10:00:00.000Z", newId: seqIds("n") }).catch((e: unknown) => e);
    expect(isDataError(err, "Unavailable")).toBe(true);
  });
});
