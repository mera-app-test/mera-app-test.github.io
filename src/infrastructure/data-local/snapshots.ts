// Zaštitne kopije pre migracije i importa (ARCHITECTURE.md §9, §10.3, §11.3).
// Posebna baza; čuvaju se poslednje 3.
import { openDB } from "idb";
import type { RawUserData } from "../../schemas";
import type { SafetySnapshotInfo } from "../../ports/data";
import { SNAPSHOTS_DB_NAME } from "./structure";

export const MAX_SNAPSHOTS = 3;

interface SnapshotRecord extends SafetySnapshotInfo {
  readonly data: RawUserData;
  readonly userId: string | null;
}

function openSnapshots() {
  return openDB(SNAPSHOTS_DB_NAME, 1, {
    upgrade(db) {
      const s = db.createObjectStore("snapshots", { keyPath: "id" });
      s.createIndex("createdAt", "createdAt");
    },
  });
}

export async function saveSnapshotRaw(
  input: { reason: SafetySnapshotInfo["reason"]; schemaVersion: number; data: RawUserData; userId: string | null },
  opts: { now: () => string; newId: () => string },
): Promise<SafetySnapshotInfo> {
  const rec: SnapshotRecord = { id: opts.newId(), createdAt: opts.now(), ...input };
  const db = await openSnapshots();
  const tx = db.transaction("snapshots", "readwrite");
  await tx.store.put(rec);
  const all = (await tx.store.index("createdAt").getAll()) as SnapshotRecord[];
  for (const old of all.slice(0, Math.max(0, all.length - MAX_SNAPSHOTS))) await tx.store.delete(old.id);
  await tx.done;
  db.close();
  return { id: rec.id, createdAt: rec.createdAt, reason: rec.reason, schemaVersion: rec.schemaVersion };
}

export async function readSnapshot(id: string): Promise<SnapshotRecord | undefined> {
  const db = await openSnapshots();
  const rec = (await db.get("snapshots", id)) as SnapshotRecord | undefined;
  db.close();
  return rec;
}

export async function listSnapshots(): Promise<SafetySnapshotInfo[]> {
  const db = await openSnapshots();
  const all = (await db.getAllFromIndex("snapshots", "createdAt")) as SnapshotRecord[];
  db.close();
  return all.map(({ id, createdAt, reason, schemaVersion }) => ({ id, createdAt, reason, schemaVersion }));
}
