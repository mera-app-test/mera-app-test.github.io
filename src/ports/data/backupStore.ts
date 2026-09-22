// Pristup celokupnim korisničkim podacima za backup/import i zaštitne kopije (ARCHITECTURE.md §9–§11).
import type { UserData } from "../../schemas";

export interface DataInfo {
  readonly userId: string;
  readonly schemaVersion: number;
}

export interface SafetySnapshotInfo {
  readonly id: string;
  readonly createdAt: string;
  readonly reason: "pre-import" | "pre-migration";
  readonly schemaVersion: number;
}

export interface BackupStore {
  info(): Promise<DataInfo>;
  readAllUserData(): Promise<UserData>;
  /** Zamenjuje SVE korisničke podatke u jednoj transakciji. Podešavanja i tajne ostaju. */
  replaceAllUserData(data: UserData): Promise<void>;
  /** Zaštitna kopija trenutnog stanja; čuvaju se poslednje 3. */
  saveSafetySnapshot(reason: SafetySnapshotInfo["reason"]): Promise<SafetySnapshotInfo>;
  listSafetySnapshots(): Promise<SafetySnapshotInfo[]>;
}
