// Formatiranje za prikaz (samo prezentacija; bez poslovne logike).
const dateTime = new Intl.DateTimeFormat("sr-Latn-RS", { day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit" });

export function formatDateTime(iso: string): string {
  return dateTime.format(new Date(iso));
}
