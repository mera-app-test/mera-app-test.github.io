import { describe, expect, it } from "vitest";
import fc from "fast-check";
import { addDays, daysBetween, isValidLocalDate } from "../../src/domain";

describe("lokalni datumi", () => {
  it("prelaz meseca, godine i prestupni dan", () => {
    expect(addDays("2026-09-30", 1)).toBe("2026-10-01");
    expect(addDays("2026-01-01", -1)).toBe("2025-12-31");
    expect(addDays("2028-02-28", 1)).toBe("2028-02-29");
    expect(addDays("2026-03-29", 1)).toBe("2026-03-30"); // promena na letnje računanje vremena u Srbiji
  });

  it("proverava ispravnost datuma", () => {
    expect(isValidLocalDate("2026-09-23")).toBe(true);
    expect(isValidLocalDate("2026-02-29")).toBe(false);
    expect(isValidLocalDate("2026-13-01")).toBe(false);
    expect(isValidLocalDate("23.09.2026")).toBe(false);
  });

  it("addDays i daysBetween su inverzne (property)", () => {
    fc.assert(
      fc.property(fc.integer({ min: -2000, max: 2000 }), (n) => {
        expect(daysBetween("2026-09-23", addDays("2026-09-23", n))).toBe(n);
      }),
    );
  });
});
