// Srpska latinica → ćirilica (1:1, dvoslovi lj, nj, dž). Ručna provera ostaje obavezna (N5),
// jer dvoslov na granici morfema (npr. „nadživeti") nije jedan glas.
const DIGRAPHS = { "Lj": "Љ", "LJ": "Љ", "lj": "љ", "Nj": "Њ", "NJ": "Њ", "nj": "њ", "Dž": "Џ", "DŽ": "Џ", "dž": "џ" };
const SINGLE = {
  A: "А", B: "Б", V: "В", G: "Г", D: "Д", Đ: "Ђ", E: "Е", Ž: "Ж", Z: "З", I: "И", J: "Ј", K: "К", L: "Л", M: "М",
  N: "Н", O: "О", P: "П", R: "Р", S: "С", T: "Т", Ć: "Ћ", U: "У", F: "Ф", H: "Х", C: "Ц", Č: "Ч", Š: "Ш",
};
export function toCyrillic(s) {
  let out = "";
  for (let i = 0; i < s.length; i++) {
    const two = s.slice(i, i + 2);
    if (DIGRAPHS[two]) { out += DIGRAPHS[two]; i++; continue; }
    const c = s[i];
    const up = SINGLE[c];
    const low = SINGLE[c.toUpperCase()];
    out += up ?? (low ? low.toLowerCase() : c);
  }
  return out;
}
export function stripDiacritics(s) {
  return s.replace(/[čć]/g, "c").replace(/[ČĆ]/g, "C").replace(/š/g, "s").replace(/Š/g, "S")
    .replace(/ž/g, "z").replace(/Ž/g, "Z").replace(/đ/g, "dj").replace(/Đ/g, "Dj");
}
