// Računanje sa lokalnim kalendarskim datumima oblika YYYY-MM-DD. Čiste funkcije, bez vremenske zone:
// datum se tretira kao oznaka dana, pa se aritmetika radi u UTC-u gde nema pomeranja sata.
const PATTERN = /^(\d{4})-(\d{2})-(\d{2})$/;

export function isValidLocalDate(s: string): boolean {
  const m = PATTERN.exec(s);
  if (!m) return false;
  const d = new Date(Date.UTC(Number(m[1]), Number(m[2]) - 1, Number(m[3])));
  return d.getUTCFullYear() === Number(m[1]) && d.getUTCMonth() === Number(m[2]) - 1 && d.getUTCDate() === Number(m[3]);
}

export function addDays(localDate: string, days: number): string {
  const m = PATTERN.exec(localDate);
  if (!m) throw new Error(`Neispravan datum: ${localDate}`);
  const d = new Date(Date.UTC(Number(m[1]), Number(m[2]) - 1, Number(m[3]) + days));
  return d.toISOString().slice(0, 10);
}

/** Broj dana od a do b (b − a). */
export function daysBetween(a: string, b: string): number {
  const ms = Date.parse(`${b}T00:00:00Z`) - Date.parse(`${a}T00:00:00Z`);
  return Math.round(ms / 86_400_000);
}
