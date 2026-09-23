// Platformski portovi (ARCHITECTURE.md §7.1): sat, ID-jevi, fajlovi, trajno skladište, heš.
export interface Clock {
  /** UTC ISO 8601 sa sufiksom Z. */
  nowIso(): string;
  /** Lokalni datum korisnika YYYY-MM-DD. */
  localDate(): string;
  timeZone(): string;
  /** Trenutno vreme dana, ali na dati lokalni datum, kao UTC ISO (za unos merenja za raniji dan). */
  isoAtLocalDate(localDate: string): string;
}

export interface IdGenerator {
  newId(): string;
}

export interface FileExporter {
  /** Nudi fajl korisniku (preuzimanje). Vraća false ako pregledač to nije omogućio. */
  saveTextFile(fileName: string, text: string, mimeType: string): Promise<boolean>;
}

export interface StoragePersistence {
  isPersisted(): Promise<boolean | null>; // null = API ne postoji
  requestPersist(): Promise<boolean | null>;
}

export interface Hasher {
  /** SHA-256 kao hex string. */
  sha256Hex(text: string): Promise<string>;
}

export type * from "./PlatformProbe";
