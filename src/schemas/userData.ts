// Skup svih korisničkih podataka po skladištima — jedinica za backup i import (ARCHITECTURE.md §11).
import { z } from "zod";
import { AuditEventSchema } from "./audit";
import { MeasurementSchema } from "./measurement";
import { ProfileSnapshotSchema } from "./profile";

export const UserDataSchema = z.object({
  measurements: z.array(MeasurementSchema),
  audit_events: z.array(AuditEventSchema),
  profile_snapshots: z.array(ProfileSnapshotSchema),
});
export type UserData = z.infer<typeof UserDataSchema>;
export type UserStoreName = keyof UserData;
export const USER_STORE_NAMES = ["measurements", "audit_events", "profile_snapshots"] as const satisfies readonly UserStoreName[];

export function emptyUserData(): UserData {
  return { measurements: [], audit_events: [], profile_snapshots: [] };
}
