# MERA — Rezultati provera [PROVERITI] pre implementacije

**Datum:** 2026-09-23
**Odnosi se na:** ARCHITECTURE.md, sekcija [PROVERITI]
**Pravilo:** odobrena arhitektura se ne menja bez odluke vlasnika. Gde je nađen problem, predložena je najmanja izmena.

Oznake: **POTVRĐENO** (zvanična dokumentacija) · **DELIMIČNO** (sekundarni izvor ili nedostaje deo) · **NA UREĐAJU** (proverava se ekranom „Provera uređaja" u test verziji) · **PROBLEM** (traži odluku).

| # | Stavka | Status | Nalaz |
|---|---|---|---|
| 1 | GitHub Pages u organizaciji, besplatno | POTVRĐENO | Pages radi u javnim repozitorijumima sa GitHub Free za organizacije; Actions je besplatan za javne repozitorijume (GitHub Docs). |
| 2 | Organizacijski sajt `<org>.github.io` | POTVRĐENO | Repozitorijum mora imati ime `<owner>.github.io`; jedan sajt po organizaciji (GitHub Docs). |
| 3 | Objava iz Actions | POTVRĐENO | Workflow preuzet iz zvanične Vite dokumentacije; SHA-ovi akcija provereni prema tagovima (checkout v7, setup-node v7, configure-pages v6, upload-pages-artifact v5, deploy-pages v5). `base: "/"` za sajt u korenu domena. |
| 4 | Tokeni za dve organizacije | POTVRĐENO | Fine-grained token pristupa resursima samo jednog vlasnika → potrebna su dva tokena. Dozvole Contents + Workflows (write): DELIMIČNO, potvrda pri prvom slanju. |
| 5 | Zaseban origin | POTVRĐENO | `github.io` je privatni sufiks na Public Suffix List; `mera-app.github.io` i `zoki02122.github.io` su zasebni sajtovi. |
| 6 | `navigator.storage.persist()` | POTVRĐENO + NA UREĐAJU | Chrome odlučuje sam, bez prozora. Preporuka web.dev: tražiti pri čuvanju važnih podataka, ne pri učitavanju. → Predlog izmene §9 (vidi ispod). |
| 7 | IndexedDB transakcije | POTVRĐENO | Transakcija se automatski završava kada nema novih zahteva (MDN). ChangeSet se sprema pre otvaranja transakcije — arhitektura već tako radi. Upis/čitanje/nadogradnja: NA UREĐAJU. |
| 8 | Web Crypto (UUID, SHA-256) | POTVRĐENO + NA UREĐAJU | Samo u bezbednom kontekstu (HTTPS) — GitHub Pages ispunjava. |
| 9 | Export/import fajla | NA UREĐAJU | Web Share je ograničeno dostupan i zavisi od tipa fajla; ekran provere testira `application/json` i `text/plain`, preuzimanje i izbor fajla. |
| 10 | AI iz pregledača — Anthropic | DELIMIČNO | Direktni pozivi rade uz zaglavlje `anthropic-dangerous-direct-browser-access: true` (uvedeno kroz zvanični TypeScript SDK); zasebna stranica API dokumentacije nije nađena. |
| 11 | AI iz pregledača — Gemini | POTVRĐENO | Tehnički moguće; Google upozorava da ključ u klijentu može biti izvučen. Gemini od septembra 2026. odbija stare Standard ključeve (potrebni auth ključevi). |
| 12 | Govor na srpskom | NA UREĐAJU | `SpeechRecognition.available()` proverava dostupnost jezika (MDN). U headless Chromium 141 poziv sa `processLocally: true` ruši karticu → izdvojen u zasebno ručno dugme. |
| 13 | Open Food Facts | POTVRĐENO (osim licence) + NA UREĐAJU | Zvanična dokumentacija: CORS podržan, čitanje bez ključa, 15 upita/min/IP za proizvode. Licenca ODbL: DELIMIČNO. Otvoreno: OFF traži identifikaciju aplikacije, a pregledač ne dozvoljava promenu User-Agent zaglavlja. |
| 14 | USDA FoodData Central | POTVRĐENO | Javno dobro, CC0 1.0; traži se navođenje izvora. |
| 15 | Srpska baza sastava namirnica | PROBLEM | Nije otvoreno dostupna; deo je DAP platforme registrovane kao intelektualna svojina. Pristup samo dogovorom sa Institutom za medicinska istraživanja. |
| 16 | dependency-cruiser + TypeScript | PROBLEM → REŠENO | Ne podržava TypeScript 7: analizirao je 0 fajlova i prijavljivao „nema kršenja". Prelazak na TypeScript 6.0.3 + skripta koja obara build ako je analizirano premalo modula. Namerna kršenja (4) uhvaćena. |

## Predlozi koji čekaju odluku vlasnika

1. **§9 — trenutak zahteva za trajno skladište:** umesto „pri prvom pokretanju", pri prvom čuvanju podataka (npr. prvi unos mase), kao odgovor na korisnikovu akciju. Razlog: preporuka web.dev. Uticaj: jedna rečenica u §9, bez uticaja na ostale delove.
2. **Primarni izvor hrane (pre koraka 4):** USDA FoodData Central (CC0) + ručno kurirane lokalne namirnice sa navedenim izvorom; paralelno kontakt sa Institutom za medicinska istraživanja za srpsku bazu.
