import { describe, expect, it } from "vitest";
import fc from "fast-check";
import { parseBodyMassInput } from "../../src/validation";

describe("unos telesne mase — oblik broja", () => {
  it.each([
    ["92,4", 92.4],
    ["92.4", 92.4],
    [" 92 ", 92],
    ["92,45", 92.45],
    ["92,4 kg", 92.4],
    ["0,5", 0.5],
  ])("prihvata %j → %d", (text, kg) => {
    expect(parseBodyMassInput(text)).toEqual({ ok: true, valueKg: kg });
  });

  it.each([
    ["", "EMPTY"],
    ["   ", "EMPTY"],
    ["abc", "NOT_A_NUMBER"],
    ["92,4,1", "NOT_A_NUMBER"],
    ["-92", "NOT_A_NUMBER"],
    ["1.092,4", "NOT_A_NUMBER"],
    [",5", "NOT_A_NUMBER"],
    ["92,", "NOT_A_NUMBER"],
    ["0", "NOT_POSITIVE"],
    ["0,00", "NOT_POSITIVE"],
    ["92,456", "TOO_MANY_DECIMALS"],
  ])("odbija %j (%s)", (text, error) => {
    expect(parseBodyMassInput(text)).toEqual({ ok: false, error });
  });

  it("zarez i tačka daju istu vrednost (property)", () => {
    fc.assert(
      fc.property(fc.integer({ min: 1, max: 999 }), fc.integer({ min: 0, max: 99 }), (whole, frac) => {
        const f = String(frac).padStart(2, "0");
        const a = parseBodyMassInput(`${whole},${f}`);
        const b = parseBodyMassInput(`${whole}.${f}`);
        expect(a).toEqual(b);
        expect(a.ok && a.valueKg).toBe(Number(`${whole}.${f}`));
      }),
    );
  });
});
