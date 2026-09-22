# 0002 — Odluke posle provera [PROVERITI]

**Datum:** 2026-09-23 · **Donosilac:** vlasnik projekta · **Osnova:** docs/PROVERE_V1.md

1. **Trajno skladište (ARCHITECTURE §9).** `navigator.storage.persist()` se ne poziva pri otvaranju aplikacije, već pri prvom stvarnom čuvanju korisničkih podataka (npr. posle prvog unosa telesne mase). Razlog: preporuka web.dev.
2. **Izvori podataka o namirnicama.** Primarni izvor za V1: USDA FoodData Central (CC0 1.0), uz pravilno navođenje izvora. Lokalne/srpske namirnice: ručno kurirane vrednosti samo sa navedenim i proverljivim izvorom. Nedostupnost javne srpske baze nije blokada za V1; paralelno se istražuje pristup bazi Instituta za medicinska istraživanja. Detalji: docs/DATA_SOURCES.md.
3. **AI API ključ.** Ostaje lokalno na uređaju u V1. Dokumentovano kao V1/testno rešenje; u serverskoj/komercijalnoj verziji ključ se seli na server/proxy.
4. **Provera granica slojeva.** TypeScript 6.0.3 (dependency-cruiser ne podržava TS 7). Build pada ako je analizirano premalo modula (`scripts/check-layers.mjs`) i ako bilo koje pravilo ne uhvati svoje namerno kršenje (`scripts/check-layers-selftest.mjs`). Namerna kršenja su dokumentovana u toj skripti i postoje samo u privremenoj kopiji, nikad u `src/`.
5. **Ostale provere.** POTVRĐENO prihvaćeno; stavke NA UREĐAJU se proveravaju ekranom „Provera uređaja" u test verziji.
