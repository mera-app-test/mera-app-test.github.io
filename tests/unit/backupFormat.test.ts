import { createBrowserHasher } from "../../src/infrastructure/platform/browserPlatform";
import { describe, expect, it } from "vitest";
import { buildBackupText, canonicalJson, parseBackupText, backupFileName } from "../../src/backup";
import { CURRENT_SCHEMA_VERSION, type UserData } from "../../src/schemas";
import { ctx, mass, putNew, seqIds, USER } from "../support/fixtures";

const hasher = createBrowserHasher();
const hash = (t: string) => hasher.sha256Hex(t);
const meta = { appVersion: "0.1.0+test", exportedAt: "2026-09-23T10:00:00.000Z", userId: USER, referenceDataVersion: null };

function sampleData(): UserData {
  const c = ctx("2026-09-20T06:00:00.000Z", seqIds("b"));
  const m = mass(c, 92.4, "2026-09-20T06:00:00.000Z", "2026-09-20");
  return { measurements: [m], audit_events: [putNew(c, m).audit], profile_snapshots: [] };
}

describe("canonicalJson", () => {
  it("ne zavisi od redosleda ključeva", () => {
    expect(canonicalJson({ b: 1, a: [{ d: 2, c: 3 }] })).toBe(canonicalJson({ a: [{ c: 3, d: 2 }], b: 1 }));
  });
});

describe("backup format", () => {
  it("izvoz pa uvoz daje identične podatke", async () => {
    const data = sampleData();
    const text = await buildBackupText(data, meta, hash);
    const r = await parseBackupText(text, hash);
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.backup.data).toEqual(data);
    expect(r.backup.counts).toEqual({ measurements: 1, audit_events: 1, profile_snapshots: 0 });
    expect(r.backup.originalSchemaVersion).toBe(CURRENT_SCHEMA_VERSION);
  });

  it("izmenjen sadržaj → CHECKSUM_MISMATCH", async () => {
    const text = await buildBackupText(sampleData(), meta, hash);
    const tampered = text.replace("92.4", "82.4");
    const r = await parseBackupText(tampered, hash);
    expect(r.ok ? null : r.error.code).toBe("CHECKSUM_MISMATCH");
  });

  it("nije JSON → NOT_JSON", async () => {
    const r = await parseBackupText("ovo nije json", hash);
    expect(r.ok ? null : r.error.code).toBe("NOT_JSON");
  });

  it("drugi JSON → NOT_MERA_BACKUP", async () => {
    const r = await parseBackupText(JSON.stringify({ marker: "mera-diag-test-file" }), hash);
    expect(r.ok ? null : r.error.code).toBe("NOT_MERA_BACKUP");
  });

  it("novija šema → NEWER_SCHEMA", async () => {
    const doc = JSON.parse(await buildBackupText(sampleData(), meta, hash));
    doc.schemaVersion = CURRENT_SCHEMA_VERSION + 1;
    const r = await parseBackupText(JSON.stringify(doc), hash);
    expect(r.ok ? null : r.error.code).toBe("NEWER_SCHEMA");
  });

  it("neispravan zapis sa ispravnim kontrolnim zbirom → INVALID_RECORDS", async () => {
    const data = sampleData();
    const broken = { ...data, measurements: [{ ...data.measurements[0]!, value: -1 }] };
    const r = await parseBackupText(await buildBackupText(broken as UserData, meta, hash), hash);
    expect(r.ok ? null : r.error.code).toBe("INVALID_RECORDS");
  });

  it("kopija iz šeme 1 (pre upitnika) se uvozi: migracija dodaje prazne odgovore", async () => {
    const data = sampleData();
    const oldStores = { measurements: data.measurements, audit_events: data.audit_events };
    const doc = JSON.parse(await buildBackupText(data, meta, hash));
    doc.schemaVersion = 1;
    doc.stores = oldStores;
    doc.checksum = await hash(canonicalJson(oldStores));
    const r = await parseBackupText(JSON.stringify(doc), hash);
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.backup.originalSchemaVersion).toBe(1);
    expect(r.backup.data).toEqual({ ...oldStores, profile_snapshots: [] });
  });

  it("ime fajla sadrži datum izvoza", () => {
    expect(backupFileName("2026-09-23T10:00:00.000Z")).toBe("mera-backup-2026-09-23.json");
  });
});
