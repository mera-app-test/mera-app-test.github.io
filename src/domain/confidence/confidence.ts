// Nivoi pouzdanosti i prikaz brojeva (MS §30; NUTRITION_ENGINE.md P1–P3). Čiste funkcije.
import type { DisplayRuleSet } from "../../schemas";

export const LEVELS = ["POUZDANO", "DOBRO_POTVRDJENO", "PROCENJENO", "NEDOVOLJNO_POUZDANO"] as const;
export type ConfidenceLevel = (typeof LEVELS)[number];

/** P1: slabija ocena pobeđuje. */
export function weakest(levels: readonly ConfidenceLevel[]): ConfidenceLevel {
  let idx = 0;
  for (const l of levels) idx = Math.max(idx, LEVELS.indexOf(l));
  return LEVELS[idx]!;
}

/** P1, kolona „vrednost": TAČNO mapiranje + vrednost iz izabranog zapisa → POUZDANO; BLISKO ili dopuna → DOBRO POTVRĐENO. */
export function levelForValue(mapping: "TACNO" | "BLISKO", origin: "PRIMARY" | "SR_FILL"): ConfidenceLevel {
  return mapping === "TACNO" && origin === "PRIMARY" ? "POUZDANO" : "DOBRO_POTVRDJENO";
}

export type Display =
  | { readonly kind: "exact"; readonly value: number; readonly decimals: number }
  | { readonly kind: "approx"; readonly value: number; readonly decimals: number }
  | { readonly kind: "range"; readonly low: number; readonly high: number; readonly decimals: number }
  | { readonly kind: "trace"; readonly below: number }
  | { readonly kind: "unknown" };

const roundTo = (x: number, step: number) => Math.round(x / step) * step;

/** P2 + P3 za energiju. interval = izričit interval ulaza (samo tada raspon). */
export function displayEnergy(kcal: number | null, level: ConfidenceLevel | null, rules: DisplayRuleSet, interval?: readonly [number, number]): Display {
  if (kcal === null || level === null) return { kind: "unknown" };
  if (interval) return { kind: "range", low: roundTo(interval[0], rules.energy.approxStepKcal), high: roundTo(interval[1], rules.energy.approxStepKcal), decimals: 0 };
  if (level === "POUZDANO" || level === "DOBRO_POTVRDJENO") return { kind: "exact", value: roundTo(kcal, rules.energy.exactStepKcal), decimals: 0 };
  return { kind: "approx", value: roundTo(kcal, rules.energy.approxStepKcal), decimals: 0 };
}

/** P3 za grame: ≥ 10 g ceo broj; < 10 g jedna decimala; 0 < x < 0,5 g „< 0,5 g". */
export function displayGrams(g: number | null, level: ConfidenceLevel | null, rules: DisplayRuleSet): Display {
  if (g === null || level === null) return { kind: "unknown" };
  if (g > 0 && g < rules.grams.traceBelowG) return { kind: "trace", below: rules.grams.traceBelowG };
  const decimals = g >= rules.grams.wholeFromG ? 0 : rules.grams.decimalsBelow;
  const f = 10 ** decimals;
  const value = Math.round(g * f) / f;
  return level === "PROCENJENO" || level === "NEDOVOLJNO_POUZDANO" ? { kind: "approx", value, decimals } : { kind: "exact", value, decimals };
}

export function displayMg(mg: number | null, level: ConfidenceLevel | null, rules: DisplayRuleSet): Display {
  if (mg === null || level === null) return { kind: "unknown" };
  const value = roundTo(mg, rules.sodium.stepMg);
  return level === "PROCENJENO" || level === "NEDOVOLJNO_POUZDANO" ? { kind: "approx", value, decimals: 0 } : { kind: "exact", value, decimals: 0 };
}

export function displaySalt(g: number | null, level: ConfidenceLevel | null, rules: DisplayRuleSet): Display {
  if (g === null || level === null) return { kind: "unknown" };
  const f = 10 ** rules.salt.decimals;
  const value = Math.round(g * f) / f;
  return level === "PROCENJENO" || level === "NEDOVOLJNO_POUZDANO" ? { kind: "approx", value, decimals: rules.salt.decimals } : { kind: "exact", value, decimals: rules.salt.decimals };
}
