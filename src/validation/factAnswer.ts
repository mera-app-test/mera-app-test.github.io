// Provera brojčanog odgovora na pitanje iz baze znanja (MS §24 — unos; DECISIONS/0016). Čista funkcija.
// Oblik broja kao kod unosa mase (zarez ili tačka, najviše 2 decimale); opseg je min/max iz definicije činjenice u bazi znanja.

export type NumberAnswerError = "EMPTY" | "NOT_A_NUMBER" | "TOO_MANY_DECIMALS" | "OUT_OF_RANGE";

export type NumberAnswerResult =
  | { readonly ok: true; readonly value: number }
  | { readonly ok: false; readonly error: NumberAnswerError; readonly message: string };

const NUMBER_PATTERN = /^\d+(?:[.,](\d+))?$/;
const MAX_DECIMALS = 2;

const fmt = (n: number) => String(n).replace(".", ",");

export function parseNumberAnswer(text: string, range: { readonly min?: number | undefined; readonly max?: number | undefined; readonly unit?: string | undefined }): NumberAnswerResult {
  const unit = range.unit ? ` ${range.unit}` : "";
  const t = text.trim();
  const rangeHint =
    range.min !== undefined && range.max !== undefined ? `od ${fmt(range.min)} do ${fmt(range.max)}${unit}` : range.min !== undefined ? `najmanje ${fmt(range.min)}${unit}` : range.max !== undefined ? `najviše ${fmt(range.max)}${unit}` : "";
  if (t === "") return { ok: false, error: "EMPTY", message: rangeHint ? `Upiši broj ${rangeHint}.` : "Upiši broj." };
  const m = NUMBER_PATTERN.exec(t);
  if (!m) return { ok: false, error: "NOT_A_NUMBER", message: "To nije broj. Upiši samo cifre, npr. 72 ili 72,5." };
  if ((m[1]?.length ?? 0) > MAX_DECIMALS) return { ok: false, error: "TOO_MANY_DECIMALS", message: "Najviše dve decimale." };
  const value = Number(t.replace(",", "."));
  if (!Number.isFinite(value)) return { ok: false, error: "NOT_A_NUMBER", message: "To nije broj." };
  if ((range.min !== undefined && value < range.min) || (range.max !== undefined && value > range.max)) {
    return { ok: false, error: "OUT_OF_RANGE", message: `Upiši broj ${rangeHint}.` };
  }
  return { ok: true, value };
}
