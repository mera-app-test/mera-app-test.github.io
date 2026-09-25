// Transformacije podataka između verzija šeme (ARCHITECTURE.md §10.2).
// Čiste funkcije; iste se koriste za migraciju IndexedDB-a i za uvoz starijeg backup-a.
// Pravilo: objavljena migracija se nikad ne menja; ispravka = nova migracija.
import { CURRENT_SCHEMA_VERSION } from "./common";

/** Sirovi podaci po skladištima, pre validacije. */
export type RawUserData = Record<string, unknown[]>;

export interface DataMigration {
  /** Verzija šeme posle ove migracije (from = toVersion - 1). */
  readonly toVersion: number;
  readonly description: string;
  readonly transform: (data: RawUserData) => RawUserData;
}

/** Verzija 1 je početna šema i nema transformaciju. Nove migracije se dodaju na kraj. */
export const DATA_MIGRATIONS: readonly DataMigration[] = [
  {
    toVersion: 2,
    description: "Odgovori na upitnik (profile_snapshots); postojeći podaci se ne menjaju.",
    transform: (d) => ({ ...d, profile_snapshots: d.profile_snapshots ?? [] }),
  },
];

export class MigrationError extends Error {}

/** Podiže podatke sa fromVersion na targetVersion (podrazumevano: trenutna verzija). */
export function migrateUserData(
  data: RawUserData,
  fromVersion: number,
  migrations: readonly DataMigration[] = DATA_MIGRATIONS,
  targetVersion: number = CURRENT_SCHEMA_VERSION,
): RawUserData {
  if (!Number.isInteger(fromVersion) || fromVersion < 1) throw new MigrationError(`Neispravna verzija šeme: ${fromVersion}`);
  if (fromVersion > targetVersion) {
    throw new MigrationError(`Podaci su iz novije verzije šeme (${fromVersion}) od ove aplikacije (${targetVersion}).`);
  }
  let out = data;
  for (let v = fromVersion + 1; v <= targetVersion; v++) {
    const m = migrations.find((x) => x.toVersion === v);
    if (!m) throw new MigrationError(`Nedostaje migracija na verziju ${v}.`);
    out = m.transform(out);
  }
  return out;
}
