// Repozitorijumi: čitanje po domenskim upitima (ARCHITECTURE.md §7.1, §7.2).
// Filtriranje i sortiranje radi repozitorijum, ne UI. Svi metodi su asinhroni.
import type { AuditEvent, EntityRef, Measurement, MeasurementType, ProfileSnapshot, SettingKey, Settings } from "../../schemas";

export interface MeasurementRepository {
  get(id: string): Promise<Measurement>; // NotFound ako ne postoji ili je obrisan
  /** Neobrisana merenja datog tipa sa localDate u [fromLocalDate, toLocalDate], sortirano po measuredAt rastuće. */
  listRange(type: MeasurementType, fromLocalDate: string, toLocalDate: string): Promise<Measurement[]>;
  /** Poslednje neobrisano merenje po measuredAt, ili null. */
  latest(type: MeasurementType): Promise<Measurement | null>;
  /** Broj neobrisanih merenja (za podsetnik o rezervnoj kopiji). */
  countActive(): Promise<number>;
}

/** Odgovori na upitnik (DECISIONS/0016). Važeći = poslednji neobrisani snapshot po createdAt. */
export interface ProfileRepository {
  current(): Promise<ProfileSnapshot | null>;
  /** Svi neobrisani snapshot-ovi (istorija), sortirano po createdAt rastuće. */
  listActive(): Promise<ProfileSnapshot[]>;
}

export interface AuditRepository {
  listForEntity(ref: EntityRef): Promise<AuditEvent[]>;
  /** Sortirano po vremenu rastuće. */
  listRange(fromIso: string, toIso: string): Promise<AuditEvent[]>;
}

export interface SettingsRepository {
  getAll(): Promise<Settings>;
  set<K extends SettingKey>(key: K, value: Settings[K]): Promise<void>;
}

export interface SecretStore {
  get(name: "ai_api_key"): Promise<string | null>;
  set(name: "ai_api_key", value: string): Promise<void>;
  clear(name: "ai_api_key"): Promise<void>;
}
