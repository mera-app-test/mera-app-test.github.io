// DOMAIN — čiste, determinističke funkcije (ARCHITECTURE.md §6, §13).
// Pravilo: ne uvozi ništa osim src/domain i src/schemas. Bez I/O, bez vremena, bez slučajnosti.
export { addDays, daysBetween, isValidLocalDate } from "./time/localDate";
