// Zlatni slučajevi trenda (ARCHITECTURE §16). Očekivane vrednosti su izračunate ručno (postupak u komentarima).
import { describe, expect, it } from "vitest";
import fc from "fast-check";
import { addDays, analyzeTrend, averageInWindow, dailyValues, needsInputConfirmation, slopeInWindow, type MassPoint } from "../../src/domain";
import { TrendFormulaSetSchema } from "../../src/schemas";
import { loadTrendFormulaSet } from "../../src/infrastructure/reference-static/formulaSets";

const F = loadTrendFormulaSet();
const TODAY = "2026-09-28";
const pt = (localDate: string, valueKg: number, time = "06:00", timeKnown = true): MassPoint => ({
  localDate,
  valueKg,
  timeKnown,
  measuredAt: `${localDate}T${time}:00.000Z`,
});
const day = (offset: number) => addDays(TODAY, -offset);

describe("odobreni skup parametara trend-1.0.0", () => {
  it("fajl prolazi šemu i sadrži odobrene vrednosti T1–T6", () => {
    expect(F.version).toBe("1.0.0");
    expect(F.average).toEqual({ windowDays: 7, minDays: 4 });
    expect(F.slopes).toEqual([
      { windowDays: 14, minDays: 8, edgeDays: 4 },
      { windowDays: 28, minDays: 14, edgeDays: 7 },
    ]);
    expect(F.rateWindowDays).toBe(28);
    expect(F.inputConfirm).toEqual({ belowKg: 30, aboveKg: 300 });
  });

  it("šema odbija nemoguće parametre", () => {
    expect(TrendFormulaSetSchema.safeParse({ ...F, average: { windowDays: 7, minDays: 8 } }).success).toBe(false);
    expect(TrendFormulaSetSchema.safeParse({ ...F, rateWindowDays: 21 }).success).toBe(false);
    expect(TrendFormulaSetSchema.safeParse({ ...F, inputConfirm: { belowKg: 300, aboveKg: 30 } }).success).toBe(false);
  });
});

describe("T1 — dnevna vrednost", () => {
  it("dan sa poznatim vremenima: prvo merenje; dan sa naknadnim unosom: prosek", () => {
    const d = dailyValues([
      pt(day(0), 92.5, "15:51"),
      pt(day(0), 92.6, "15:48"),
      pt(day(1), 92.4, "16:00", false),
      pt(day(1), 93.1, "16:05", false),
    ]);
    expect(d).toEqual([
      { localDate: day(1), valueKg: (92.4 + 93.1) / 2, method: "mean", count: 2 },
      { localDate: day(0), valueKg: 92.6, method: "first", count: 2 },
    ]);
  });
});

describe("T2 — 7-dnevni prosek", () => {
  it("4 dana (92, 93, 94, 95) → 93,5", () => {
    const d = dailyValues([pt(day(0), 92), pt(day(2), 93), pt(day(4), 94), pt(day(6), 95), pt(day(7), 200)]);
    expect(averageInWindow(d, TODAY, F.average)).toEqual({ ok: true, windowDays: 7, days: 4, averageKg: 93.5 });
  });
  it("3 dana → nedostaje 1; dan 8 unazad ne ulazi u prozor", () => {
    const d = dailyValues([pt(day(0), 92), pt(day(1), 93), pt(day(6), 94), pt(day(7), 95)]);
    expect(averageInWindow(d, TODAY, F.average)).toEqual({ ok: false, windowDays: 7, days: 3, missingDays: 1 });
  });
});

describe("T3 — nagib linearne regresije", () => {
  it("ručni primer: x = 0,1,2,3; y = 4,3,5,2 → nagib −0,4 kg/dan = −2,8 kg nedeljno", () => {
    // x̄ = 1,5; ȳ = 3,5; Σdx·dy = −2; Σdx² = 5 → −0,4 kg/dan.
    const d = dailyValues([pt(day(3), 4), pt(day(2), 3), pt(day(1), 5), pt(day(0), 2)]);
    const r = slopeInWindow(d, TODAY, { windowDays: 4, minDays: 4, edgeDays: 1 });
    expect(r.ok && r.kgPerWeek).toBeCloseTo(-2.8, 12);
  });

  it("pad od 0,1 kg dnevno, merenje svaki dan kroz 28 dana → −0,7 kg nedeljno; stopa u %", () => {
    // masa = 90 + 0,1 × (broj dana unazad): starije je teže, pa je nagib −0,1 kg/dan = −0,7 kg nedeljno.
    const pts = Array.from({ length: 28 }, (_, i) => pt(day(i), 90 + 0.1 * i));
    const a = analyzeTrend(pts, TODAY, F);
    const s28 = a.slopes.find((s) => s.windowDays === 28)!;
    expect(s28.ok && s28.kgPerWeek).toBeCloseTo(-0.7, 10);
    expect(a.average).toMatchObject({ ok: true, days: 7 });
    expect(a.average.ok && a.average.averageKg).toBeCloseTo(90.3, 10); // (90,0 + … + 90,6) / 7
    const avg = a.average.ok ? a.average.averageKg : NaN;
    expect(a.rate?.kgPerWeek).toBeCloseTo(-0.7, 10);
    expect(a.rate?.percentPerWeek).toBeCloseTo((-0.7 / avg) * 100, 10);
    expect(a.formulaSetVersion).toBe("1.0.0");
  });

  it("dovoljno merenja, ali nijedno na početku prozora → trend se ne prikazuje", () => {
    const pts = Array.from({ length: 16 }, (_, i) => pt(day(i), 90));
    const s28 = analyzeTrend(pts, TODAY, F).slopes.find((s) => s.windowDays === 28)!;
    expect(s28).toMatchObject({ ok: false, missingStart: true, missingEnd: false, missingDays: 0 });
  });

  it("premalo dana → broj koji nedostaje", () => {
    const pts = [pt(day(13), 90), pt(day(10), 90), pt(day(3), 90), pt(day(0), 90)];
    const s14 = analyzeTrend(pts, TODAY, F).slopes.find((s) => s.windowDays === 14)!;
    expect(s14).toMatchObject({ ok: false, days: 4, missingDays: 4 });
  });

  it("bez 7-dnevnog proseka nema stope u %", () => {
    const pts = Array.from({ length: 14 }, (_, i) => pt(day(27 - i), 90));
    expect(analyzeTrend(pts, TODAY, F).rate).toBeNull();
  });

  it("property: dodavanje konstante svim vrednostima ne menja nagib; ravna linija daje 0", () => {
    fc.assert(
      fc.property(fc.array(fc.double({ min: 60, max: 150, noNaN: true }), { minLength: 28, maxLength: 28 }), fc.double({ min: -20, max: 20, noNaN: true }), (vals, c) => {
        const a = analyzeTrend(vals.map((v, i) => pt(day(i), v)), TODAY, F).slopes[1]!;
        const b = analyzeTrend(vals.map((v, i) => pt(day(i), v + c)), TODAY, F).slopes[1]!;
        expect(a.ok && b.ok).toBe(true);
        if (a.ok && b.ok) expect(b.kgPerWeek).toBeCloseTo(a.kgPerWeek, 6);
      }),
    );
    const flat = analyzeTrend(Array.from({ length: 28 }, (_, i) => pt(day(i), 88.8)), TODAY, F).slopes[1]!;
    expect(flat.ok && flat.kgPerWeek).toBeCloseTo(0, 12);
  });
});

describe("T5 — potvrda neuobičajenog unosa", () => {
  it("ispod 30 i iznad 300 kg traži potvrdu; granice same ne", () => {
    expect(needsInputConfirmation(29.9, F)).toBe(true);
    expect(needsInputConfirmation(30, F)).toBe(false);
    expect(needsInputConfirmation(300, F)).toBe(false);
    expect(needsInputConfirmation(924, F)).toBe(true);
  });
});
