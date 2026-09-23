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
