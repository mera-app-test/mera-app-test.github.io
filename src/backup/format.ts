// JSON backup format (ARCHITECTURE.md §11.1). Čiste funkcije; heš se prosleđuje spolja.
import { z } from "zod";
import {
  CURRENT_SCHEMA_VERSION,
  IsoDateTimeSchema,
  MigrationError,
  migrateUserData,
  UserDataSchema,
  USER_STORE_NAMES,
  UuidSchema,
  type UserData,
} from "../schemas";

export const BACKUP_FORMAT = "mera-backup" as const;
export const BACKUP_FORMAT_VERSION = 1 as const;

export type HashFn = (text: string) => Promise<string>;

const EnvelopeSchema = z.object({
  format: z.literal(BACKUP_FORMAT),
  formatVersion: z.literal(BACKUP_FORMAT_VERSION),
  schemaVersion: z.number().int().min(1),
  appVersion: z.string().min(1),
  exportedAt: IsoDateTimeSchema,
  userId: UuidSchema,
  referenceDataVersion: z.string().nullable(),
  stores: z.record(z.string(), z.array(z.unknown())),
  checksum: z.string().regex(/^[0-9a-f]{64}$/),
});

export interface BackupMeta {
  readonly appVersion: string;
  readonly exportedAt: string;
  readonly userId: string;
  readonly referenceDataVersion: string | null;
}

/** Deterministička serijalizacija: ključevi objekata sortirani, bez razmaka. */
export function canonicalJson(value: unknown): string {
  if (value === null || typeof value !== "object") return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map(canonicalJson).join(",")}]`;
  const obj = value as Record<string, unknown>;
  const keys = Object.keys(obj).filter((k) => obj[k] !== undefined).sort();
  return `{${keys.map((k) => `${JSON.stringify(k)}:${canonicalJson(obj[k])}`).join(",")}}`;
}

export async function buildBackupText(data: UserData, meta: BackupMeta, hash: HashFn): Promise<string> {
  const stores: Record<string, unknown[]> = {};
  for (const name of USER_STORE_NAMES) stores[name] = data[name];
  const checksum = await hash(canonicalJson(stores));
  const doc = {
    format: BACKUP_FORMAT,
    formatVersion: BACKUP_FORMAT_VERSION,
    schemaVersion: CURRENT_SCHEMA_VERSION,
    appVersion: meta.appVersion,
    exportedAt: meta.exportedAt,
    userId: meta.userId,
    referenceDataVersion: meta.referenceDataVersion,
    stores,
    checksum,
  };
  return JSON.stringify(doc, null, 1);
}

export function backupFileName(exportedAtIso: string): string {
  return `mera-backup-${exportedAtIso.slice(0, 10)}.json`;
}

export type ParseError =
  | { readonly code: "NOT_JSON"; readonly message: string }
  | { readonly code: "NOT_MERA_BACKUP"; readonly message: string }
  | { readonly code: "CHECKSUM_MISMATCH"; readonly message: string }
  | { readonly code: "NEWER_SCHEMA"; readonly message: string }
  | { readonly code: "MIGRATION_FAILED"; readonly message: string }
  | { readonly code: "INVALID_RECORDS"; readonly message: string };

export interface ParsedBackup {
  readonly exportedAt: string;
  readonly appVersion: string;
  readonly userId: string;
  readonly originalSchemaVersion: number;
  readonly data: UserData;
  readonly counts: Readonly<Record<keyof UserData, number>>;
}

export type ParseResult = { readonly ok: true; readonly backup: ParsedBackup } | { readonly ok: false; readonly error: ParseError };

export async function parseBackupText(text: string, hash: HashFn): Promise<ParseResult> {
  let json: unknown;
  try {
    json = JSON.parse(text);
  } catch {
    return { ok: false, error: { code: "NOT_JSON", message: "Fajl nije ispravan JSON." } };
  }
  const env = EnvelopeSchema.safeParse(json);
  if (!env.success) {
    return { ok: false, error: { code: "NOT_MERA_BACKUP", message: "Fajl nije rezervna kopija Mere ili je oštećen." } };
  }
  const e = env.data;
  const actual = await hash(canonicalJson(e.stores));
  if (actual !== e.checksum) {
    return { ok: false, error: { code: "CHECKSUM_MISMATCH", message: "Kontrolni zbir ne odgovara — fajl je izmenjen ili oštećen." } };
  }
  if (e.schemaVersion > CURRENT_SCHEMA_VERSION) {
    return { ok: false, error: { code: "NEWER_SCHEMA", message: `Kopija je napravljena novijom verzijom Mere (šema ${e.schemaVersion}). Ažuriraj aplikaciju pa pokušaj ponovo.` } };
  }
  let migrated;
  try {
    migrated = migrateUserData(e.stores, e.schemaVersion);
  } catch (err) {
    const msg = err instanceof MigrationError ? err.message : String(err);
    return { ok: false, error: { code: "MIGRATION_FAILED", message: msg } };
  }
  const data = UserDataSchema.safeParse(migrated);
  if (!data.success) {
    const first = data.error.issues[0];
    const where = first ? `${first.path.join(".")}: ${first.message}` : "nepoznato";
    return { ok: false, error: { code: "INVALID_RECORDS", message: `Neispravan zapis u kopiji (${where}).` } };
  }
  const counts = Object.fromEntries(USER_STORE_NAMES.map((n) => [n, data.data[n].length])) as Record<keyof UserData, number>;
  return {
    ok: true,
    backup: {
      exportedAt: e.exportedAt,
      appVersion: e.appVersion,
      userId: e.userId,
      originalSchemaVersion: e.schemaVersion,
      data: data.data,
      counts,
    },
  };
}
