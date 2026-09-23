# Kontrolni snapshot — 2026-09-23 (kraj koraka 3)

**Verzija:** 0.3.1 · **Objavljeno:** https://mera-app-test.github.io/ (test) · **Produkcija:** još nije objavljena

## Završeno i testirano
- Koraci 1 i 2 (vidi snapshot kraj-koraka-2).
- Korak 3: unos mase (zarez/tačka, raniji dan, potvrda neuobičajene vrednosti), lista 90 dana, meko brisanje uz audit, zahtev za trajno skladište posle prvog unosa, trend po odobrenom metodu (NUTRITION_ENGINE.md deo T, DECISIONS/0007).
- 88 automatskih testova (uključujući zlatne slučajeve trenda).
- Provereno na telefonu vlasnika: unos, lista, naknadni unos (0.3.0). Trend (0.3.1): čeka pregled vlasnika.

## Odstupanja i napomene
- Parametri trenda se učitavaju iz statičkog fajla u `infrastructure/reference-static`; pun `ReferenceDataProvider` port nastaje u koraku 4 i preuzima ovo učitavanje.
- Lista merenja za dan sa više naknadnih unosa ređa ih po trenutku unosa (stvarno vreme nije poznato); trend za takav dan koristi prosek (T1).

## Sledeće: korak 4 — referentni podaci + nutrition engine
Pre implementacije predložiti vlasniku: početni skup namirnica iz USDA FDC (koje namirnice, koji nutrijenti), mapiranje na srpske nazive, pravila pouzdanosti i sirovo/kuvano (NUTRITION_ENGINE.md, novi delovi) — sa izvorima.

## Otvorena pitanja (iz ranijih snapshot-a)
- Govor na srpskom samo preko Google servisa — pre glasovnog unosa.
- Izbor AI provajdera — pre koraka 7.
- SAFETY_RULES.md i energetski deo NUTRITION_ENGINE.md — pre koraka 5.
- Open Food Facts licenca i identifikacija — pre koraka 8.
- Institut za medicinska istraživanja — paralelno.
