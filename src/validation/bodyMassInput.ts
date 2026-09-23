// Provera teksta koji korisnik unese kao telesnu masu (MS §12 MEASURED, ARCHITECTURE.md §13 tačka 13).
// Čista funkcija: prihvata zarez ili tačku kao decimalni znak (npr. „92,4" ili „92.4").
//
// NAMERNO BEZ OPSEGA (npr. „od X do Y kg"): opseg je prag i čeka odobrenje vlasnika
// (DECISIONS/0005, predlog u docs/NUTRITION_ENGINE.md §T5). Do tada se proverava samo oblik broja.

export type BodyMassInputError = "EMPTY" | "NOT_A_NUMBER" | "NOT_POSITIVE" | "TOO_MANY_DECIMALS";

export type BodyMassInputResult =
  | { readonly ok: true; readonly valueKg: number }
  | { readonly ok: false; readonly error: BodyMassInputError };

/** Najviše dve decimale: kućne vage prikazuju 0,1 ili 0,05 kg; više decimala je gotovo sigurno greška u kucanju. */
const MAX_DECIMALS = 2;
const NUMBER_PATTERN = /^\d+(?:[.,](\d+))?$/;

export function parseBodyMassInput(text: string): BodyMassInputResult {
  const t = text.trim().replace(/\s*kg$/i, "");
  if (t === "") return { ok: false, error: "EMPTY" };
  const m = NUMBER_PATTERN.exec(t);
  if (!m) return { ok: false, error: "NOT_A_NUMBER" };
  if ((m[1]?.length ?? 0) > MAX_DECIMALS) return { ok: false, error: "TOO_MANY_DECIMALS" };
  const value = Number(t.replace(",", "."));
  if (!Number.isFinite(value)) return { ok: false, error: "NOT_A_NUMBER" };
  if (value <= 0) return { ok: false, error: "NOT_POSITIVE" };
  return { ok: true, valueKg: value };
}

export const BODY_MASS_INPUT_MESSAGES: Record<BodyMassInputError, string> = {
  EMPTY: "Upiši masu, na primer 92,4.",
  NOT_A_NUMBER: "To nije broj. Upiši masu, na primer 92,4.",
  NOT_POSITIVE: "Masa mora biti veća od nule.",
  TOO_MANY_DECIMALS: "Najviše dve decimale, na primer 92,45.",
};
