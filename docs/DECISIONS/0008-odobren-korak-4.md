# 0008 — Odobren predlog koraka 4 (namirnice, nutrijenti, pouzdanost, sirovo/kuvano)

**Datum:** 2026-09-23 · **Donosilac:** vlasnik projekta („Odobreno, nastavi")

Odobreni su delovi N, P i K u NUTRITION_ENGINE.md i spisak u NAMIRNICE_V1.md, sa preporukama iz predloga:
- **N4 — varijanta A:** energija po Prilogu 13 Pravilnika o deklarisanju (4/4/9, vlakna 2), UH = UH po razlici − vlakna. `reference-data/formulas/energy-label-1.0.0.json`.
- **Hleb i kisela pavlaka:** ne uvoze se iz USDA; kasnije preko deklaracije ili kuriranog izvora.
- **P3 zaokruživanje:** kako je predloženo. `reference-data/formulas/display-1.0.0.json`.

## Provereno posle odobrenja
- So = natrijum × 2,5 — Pravilnik o deklarisanju, označavanju i reklamiranju hrane, član 2 tačka 28 (tekst sa izmenama zaključno sa „Sl. glasnik RS" 48/2026). **POTVRĐENO.**
- Prilog 13 u istom tekstu — faktori kao u predlogu. **POTVRĐENO.**
- EU smernice o zaokruživanju (2012) — i dalje nije provereno u originalu; važi odobreni predlog P3 dok se ne proveri.

## Rezultat uvoza (izveštaj: docs/UVOZ/izvestaj-foods-1.0.0.md)
- Izvori: Foundation Foods izdanje 2026-04-30, SR Legacy 2018-04 (adrese i SHA-256 u docs/UVOZ/izvori-foods-1.0.0.json).
- 96 namirnica. Vrednosti **čekaju odobrenje izveštaja** (N6): u fajlu je `status: CEKA_ODOBRENJE`; produkcijski build pada dok status nije `ODOBRENO` (scripts/assert-prod-bundle.mjs). Na test adresi se prikazuju sa napomenom, radi pregleda na telefonu.

## Otvoreno — traži odluku vlasnika
1. **R1 (nije odobreno, nije primenjeno).** 12 namirnica ostaje nepotpuno po odobrenom pravilu, jer noviji Foundation zapis nema vlakna ili masti, a nema SR par sa istim NDB brojem: sirovo sočivo, sirova leblebija, sirov krompir, praziluk, lubenica, sirova piletina (belo meso, karabatak), junetina but, svinjski file, bakalar, obrani jogurt, suncokretovo ulje. Predlog R1: tada koristiti SR Legacy zapis iste namirnice. Za sirov krompir bez ljuske SR zapis ne postoji.
2. **Mapiranje „opšti naziv → generički SR zapis"**: gde Foundation ima samo užu sortu (jabuka gala/fuji, paradajz roma, šljiva crna), izabran je generički SR zapis. Deo mapiranja koje vlasnik odobrava kroz izveštaj.
3. **Razlika metoda energije**: za orašaste plodove i kakao Prilog 13 daje više od USDA (npr. kakao 359 prema 228 kcal/100 g), jer USDA za njih koristi specifične faktore. Deklaracije u Srbiji koriste Prilog 13, pa je ovo u skladu sa odlukom N4-A; navedeno radi informacije.

## Manje tehničke odluke (razvojni agent)
- Alat za uvoz radi u GitHub Actions (`.github/workflows/uvoz-fdc.yml`, `scripts/fdc/`): adrese arhiva čita sa zvanične stranice, beleži SHA-256, proverava naziv i jedinicu svakog ID-ja nutrijenta. Provera je uhvatila da se ID 2000 u aktuelnoj tabeli zove „Total Sugars" — isti nutrijent, prihvaćen i novi naziv.
- Ugljeni hidrati se prikazuju kao na deklaraciji (UH po razlici − vlakna); redosled redova kao u Prilogu 14.
- Kućne mere iz FDC (američke šolje, kašike) se ne prikazuju u V1.
