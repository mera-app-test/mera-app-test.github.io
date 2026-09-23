// Normalizacija teksta za pretragu namirnica: ćirilica → latinica, bez dijakritika, mala slova (N5).
const CYR: Record<string, string> = {
  а: "a", б: "b", в: "v", г: "g", д: "d", ђ: "dj", е: "e", ж: "z", з: "z", и: "i", ј: "j", к: "k", л: "l", љ: "lj", м: "m",
  н: "n", њ: "nj", о: "o", п: "p", р: "r", с: "s", т: "t", ћ: "c", у: "u", ф: "f", х: "h", ц: "c", ч: "c", џ: "dz", ш: "s",
};
const LAT: Record<string, string> = { č: "c", ć: "c", š: "s", ž: "z", đ: "dj" };

export function normalizeForSearch(s: string): string {
  return [...s.toLowerCase()].map((c) => CYR[c] ?? LAT[c] ?? c).join("").replace(/\s+/g, " ").trim();
}

/** Svaka reč upita mora biti početak neke reči u nekom od ključeva. */
export function matchesQuery(keys: readonly string[], query: string): boolean {
  const words = normalizeForSearch(query).split(" ").filter(Boolean);
  if (words.length === 0) return true;
  const hay = keys.map(normalizeForSearch);
  return words.every((w) => hay.some((k) => k.split(/[\s,()/-]+/).some((part) => part.startsWith(w))));
}
