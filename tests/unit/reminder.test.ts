import { describe, expect, it } from "vitest";
import { isBackupDue } from "../../src/backup";

const now = "2026-09-23T10:00:00.000Z";
describe("nedeljni podsetnik", () => {
  it("bez podataka nema podsetnika", () => expect(isBackupDue(null, now, 0)).toBe(false));
  it("ima podataka, kopija nikad → podsetnik", () => expect(isBackupDue(null, now, 1)).toBe(true));
  it("pre 6 dana i 23 h → nema", () => expect(isBackupDue("2026-09-16T11:00:00.000Z", now, 3)).toBe(false));
  it("tačno 7 dana → podsetnik", () => expect(isBackupDue("2026-09-16T10:00:00.000Z", now, 3)).toBe(true));
});
