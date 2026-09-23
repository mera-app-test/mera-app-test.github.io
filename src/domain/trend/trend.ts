// Analiza trenda telesne mase (MS §13; NUTRITION_ENGINE.md deo T; ARCHITECTURE §13 tačka 7).
// Čiste funkcije: isti ulaz → isti izlaz. „Danas" i parametri dolaze kao argumenti.
import type { TrendFormulaSet } from "../../schemas";
import { addDays, daysBetween } from "../time/localDate";

export interface MassPoint {
  readonly localDate: string;
  readonly measuredAt: string;
  readonly valueKg: number;
  /** false = naknadni unos; tačno vreme merenja nije poznato. */
  readonly timeKnown: boolean;
}

export interface DailyValue {
  readonly localDate: string;
  readonly valueKg: number;
  readonly method: "first" | "mean";
  readonly count: number;
}

/** T1: jedna vrednost po danu. Sortirano po datumu rastuće. */
export function dailyValues(points: readonly MassPoint[]): DailyValue[] {
  const byDay = new Map<string, MassPoint[]>();
  for (const p of points) {
    const list = byDay.get(p.localDate);
    if (list) list.push(p);
    else byDay.set(p.localDate, [p]);
  }
  const out: DailyValue[] = [];
  for (const [localDate, list] of byDay) {
    if (list.every((p) => p.timeKnown)) {
      const first = [...list].sort((a, b) => (a.measuredAt < b.measuredAt ? -1 : a.measuredAt > b.measuredAt ? 1 : 0))[0]!;
      out.push({ localDate, valueKg: first.valueKg, method: "first", count: list.length });
    } else {
      const sum = list.reduce((s, p) => s + p.valueKg, 0);
      out.push({ localDate, valueKg: sum / list.length, method: "mean", count: list.length });
    }
  }
  return out.sort((a, b) => (a.localDate < b.localDate ? -1 : 1));
}

const inWindow = (days: readonly DailyValue[], today: string, windowDays: number) => {
  const from = addDays(today, -(windowDays - 1));
  return days.filter((d) => d.localDate >= from && d.localDate <= today);
};

export type AverageResult =
  | { readonly ok: true; readonly windowDays: number; readonly days: number; readonly averageKg: number }
  | { readonly ok: false; readonly windowDays: number; readonly days: number; readonly missingDays: number };

/** T2: aritmetička sredina dnevnih vrednosti u prozoru. */
export function averageInWindow(days: readonly DailyValue[], today: string, p: TrendFormulaSet["average"]): AverageResult {
  const w = inWindow(days, today, p.windowDays);
  if (w.length < p.minDays) return { ok: false, windowDays: p.windowDays, days: w.length, missingDays: p.minDays - w.length };
  return { ok: true, windowDays: p.windowDays, days: w.length, averageKg: w.reduce((s, d) => s + d.valueKg, 0) / w.length };
}

export type SlopeResult =
  | { readonly ok: true; readonly windowDays: number; readonly days: number; readonly kgPerWeek: number }
  | {
      readonly ok: false;
      readonly windowDays: number;
      readonly days: number;
      readonly missingDays: number;
      /** Nema merenja na početku ili na kraju prozora (T3, uslov krajeva). */
      readonly missingStart: boolean;
      readonly missingEnd: boolean;
    };

/** T3: nagib linearne regresije (najmanji kvadrati) po danu, preračunat u kg nedeljno. */
export function slopeInWindow(days: readonly DailyValue[], today: string, p: TrendFormulaSet["slopes"][number]): SlopeResult {
  const from = addDays(today, -(p.windowDays - 1));
  const w = inWindow(days, today, p.windowDays);
  const xs = w.map((d) => daysBetween(from, d.localDate));
  const missingStart = !xs.some((x) => x < p.edgeDays);
  const missingEnd = !xs.some((x) => x >= p.windowDays - p.edgeDays);
  const missingDays = Math.max(0, p.minDays - w.length);
  if (missingDays > 0 || missingStart || missingEnd) {
    return { ok: false, windowDays: p.windowDays, days: w.length, missingDays, missingStart, missingEnd };
  }
  const n = w.length;
  const mx = xs.reduce((s, x) => s + x, 0) / n;
  const my = w.reduce((s, d) => s + d.valueKg, 0) / n;
  let sxy = 0;
  let sxx = 0;
  for (let i = 0; i < n; i++) {
    const dx = xs[i]! - mx;
    sxy += dx * (w[i]!.valueKg - my);
    sxx += dx * dx;
  }
  // sxx > 0 je garantovano uslovom krajeva (bar dva različita dana).
  return { ok: true, windowDays: p.windowDays, days: n, kgPerWeek: (sxy / sxx) * 7 };
}

export interface TrendAnalysis {
  readonly formulaSetVersion: string;
  readonly today: string;
  readonly average: AverageResult;
  readonly slopes: readonly SlopeResult[];
  /** T4: nagib iz rateWindowDays i isti nagib kao procenat 7-dnevnog proseka; null ako nije izračunljivo. */
  readonly rate: { readonly kgPerWeek: number; readonly percentPerWeek: number; readonly windowDays: number } | null;
}

export function analyzeTrend(points: readonly MassPoint[], today: string, f: TrendFormulaSet): TrendAnalysis {
  const days = dailyValues(points);
  const average = averageInWindow(days, today, f.average);
  const slopes = f.slopes.map((s) => slopeInWindow(days, today, s));
  const rateSlope = slopes.find((s) => s.windowDays === f.rateWindowDays);
  const rate =
    rateSlope?.ok && average.ok
      ? { kgPerWeek: rateSlope.kgPerWeek, percentPerWeek: (rateSlope.kgPerWeek / average.averageKg) * 100, windowDays: rateSlope.windowDays }
      : null;
  return { formulaSetVersion: f.version, today, average, slopes, rate };
}

/** T5: da li unetu vrednost treba potvrditi pre čuvanja. */
export function needsInputConfirmation(valueKg: number, f: TrendFormulaSet): boolean {
  return valueKg < f.inputConfirm.belowKg || valueKg > f.inputConfirm.aboveKg;
}

/** Najduži prozor koji trend koristi (koliko dana unazad treba učitati). */
export function trendLookbackDays(f: TrendFormulaSet): number {
  return Math.max(f.average.windowDays, ...f.slopes.map((s) => s.windowDays));
}
