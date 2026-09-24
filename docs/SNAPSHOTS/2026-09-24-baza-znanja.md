# Snapshot 2026-09-24 — baza znanja, verzija 0.5.4

## Stanje
| Oblast | Status |
|---|---|
| Koraci 1–3 (osnova, masa, trend) | implementirano, testirano (0.3.1) |
| Namirnice (USDA FDC, 96 namirnica, Prilog 13, pouzdanost, „Zašto?") | implementirano, testirano, podaci ODOBRENO (1.1.0) |
| Alat za uvoz FDC (GitHub Actions, grana uvoz/zahtev → uvoz/rezultat) | implementirano |
| Baza znanja — mehanizam (šema, evaluator, izveden upitnik, provere, pretraga) | implementirano, testirano |
| Baza znanja — sadržaj 0.4.0 (18 stavki: energija, cilj, fleksibilan cilj, bezbednost) | ODOBRENO po kriterijumima; sloj 3 i 4 nisu urađeni |
| Test ekran „Baza znanja" (pravila, izvori, slojevi, probni upitnik, dugme za kopiranje paketa) | implementirano (samo test) |
| Upitnik u pravom toku + dnevni cilj na ekranu Danas | **nije implementirano — sledeći korak** |
| Recepti, planer, AI razgovor, unos hrane, barkod, adaptacija | nije implementirano |

## Ključne odluke od prethodnog snapshota
0008 korak 4 · 0009 razumna preciznost, ko šta odobrava · 0010 pravila izvora i AI · 0011 AI vezan za bazu, bez obučavanja · 0012 baza znanja i novi redosled · 0013 kriterijumi i slojevi provere · 0014 fleksibilan cilj · 0015 praktična naučna utemeljenost.

## Testovi
131 prolaze (`npm run check`). Produkcijski build čist (`MERA_ENV=prod` + `scripts/assert-prod-bundle.mjs`).

## Poznati problemi / otvoreno
docs/OTVORENA_PITANJA.md (sve neblokirajuće).
