import type { Display } from "../application";
// Formatiranje za prikaz (samo prezentacija; bez poslovne logike).
const dateTime = new Intl.DateTimeFormat("sr-Latn-RS", { day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit" });

export function formatDateTime(iso: string): string {
  return dateTime.format(new Date(iso));
}

const kgFormat = new Intl.NumberFormat("sr-Latn-RS", { minimumFractionDigits: 1, maximumFractionDigits: 2 });
const timeFormat = new Intl.DateTimeFormat("sr-Latn-RS", { hour: "2-digit", minute: "2-digit" });
const dayFormat = new Intl.DateTimeFormat("sr-Latn-RS", { weekday: "long", day: "numeric", month: "long", timeZone: "UTC" });

/** 92.4 → „92,4"; 92.45 → „92,45". Samo prikaz; vrednost se čuva nezaokružena. */
export function formatKg(value: number): string {
  return kgFormat.format(value);
}

export function formatTime(iso: string): string {
  return timeFormat.format(new Date(iso));
}

/** „danas", „juče" ili „sreda, 16. septembar". localDate je YYYY-MM-DD. */
export function formatDay(localDate: string, today: string, yesterday: string): string {
  if (localDate === today) return "danas";
  if (localDate === yesterday) return "juče";
  return dayFormat.format(new Date(`${localDate}T12:00:00Z`));
}

const signed2 = new Intl.NumberFormat("sr-Latn-RS", { minimumFractionDigits: 2, maximumFractionDigits: 2, signDisplay: "exceptZero" });
const signed1 = new Intl.NumberFormat("sr-Latn-RS", { minimumFractionDigits: 1, maximumFractionDigits: 1, signDisplay: "exceptZero" });
const one = new Intl.NumberFormat("sr-Latn-RS", { minimumFractionDigits: 1, maximumFractionDigits: 1 });

/** Procena: prikazuje se sa „≈" (MS §30). */
export function formatApproxKg(value: number): string {
  return `≈ ${one.format(value)} kg`;
}
export function formatKgPerWeek(value: number): string {
  return `≈ ${signed2.format(value).replace("-", "−")} kg nedeljno`;
}
export function formatPercent(value: number): string {
  return `${signed1.format(value).replace("-", "−")} %`;
}

// Prikaz vrednosti prema pravilima iz domain/confidence (P2): broj, „≈", raspon, „< 0,5", nepoznato.

const numberFormats = new Map<number, Intl.NumberFormat>();
function num(value: number, decimals: number): string {
  let f = numberFormats.get(decimals);
  if (!f) numberFormats.set(decimals, (f = new Intl.NumberFormat("sr-Latn-RS", { minimumFractionDigits: decimals, maximumFractionDigits: decimals })));
  return f.format(value);
}

export function formatDisplay(d: Display, unit: string): string {
  switch (d.kind) {
    case "exact":
      return `${num(d.value, d.decimals)} ${unit}`;
    case "approx":
      return `≈${num(d.value, d.decimals)} ${unit}`;
    case "range":
      return `${num(d.low, d.decimals)}–${num(d.high, d.decimals)} ${unit}`;
    case "trace":
      return `< ${num(d.below, 1)} ${unit}`;
    case "unknown":
      return "nepoznato";
  }
}
