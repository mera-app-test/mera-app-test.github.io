# CHANGELOG

## 0.1.0 — korak 1 (nije objavljeno)
- Struktura slojeva prema ARCHITECTURE.md §5; prazni moduli označeni za kasnije korake.
- Automatska provera granica slojeva (dependency-cruiser + scripts/check-layers.mjs).
- TypeScript 6.0.3 umesto 7.x (dependency-cruiser ne podržava TS 7 — vidi PROVERE_V1.md #16).
- PWA ljuska: manifest, service worker (vite-plugin-pwa, autoUpdate), privremene ikone.
- Glavni ekran „Danas" sa praznim stanjem; standardni dijalog za izlaz na „nazad".
- Ekran „Provera uređaja" samo u test/dev build-u; produkcijski build proverava scripts/assert-prod-bundle.mjs.
- GitHub Actions: provera (tipovi, granice, testovi) → build → objava; okruženje po organizaciji.
- 5 automatskih testova.

## 0.1.1 — odluke posle provera
- Upisane odluke vlasnika (docs/DECISIONS/0002): §9 trajno skladište pri prvom čuvanju; USDA FDC primarni izvor (docs/DATA_SOURCES.md); AI ključ lokalno samo u V1.
- Dodata samoprovera pravila granica (`npm run lint:layers:selftest`), deo `npm run check` i CI.

## 0.2.0 — korak 2: podaci i rezervna kopija (nije objavljeno)
- Zod šeme (šema podataka v1): zajednička polja, merenje mase, audit događaj, podešavanja.
- Data portovi: repozitorijumi, ChangeSet/UnitOfWork sa optimističkom kontrolom verzije, BackupStore, tipizirane greške.
- LocalDataProvider nad IndexedDB (`idb` 8.0.3, ISC); tajne u posebnoj bazi; zaštitne kopije u posebnoj bazi (najviše 3).
- Migracioni okvir: strukturni koraci + čiste transformacije; zaštitna kopija pre migracije, provera posle, vraćanje pri neuspehu.
- JSON izvoz/uvoz: kanonski JSON, SHA-256 kontrolni zbir, provera šeme, migracija starijih kopija, zamena svih podataka uz zaštitnu kopiju i audit.
- Nedeljni podsetnik na glavnom ekranu; ekran „Rezervna kopija".
- Trajno skladište: funkcija za zahtev posle prvog stvarnog čuvanja (povezuje se sa unosom mase u koraku 3).
- Testovi: 45 (ugovorni testovi porta, migracije sa probnim v2, backup format, use case-ovi). Ugovorni testovi provereni namernim kvarom implementacije.
- Tehničke napomene: docs/DECISIONS/0003.

## 0.2.1 — ispravka ekrana „Provera uređaja" (test)
- Problem (prijavio vlasnik): posle dodira dugmeta nije se videla nikakva reakcija. Uzrok: rezultat se upisivao na dno stranice, ispod svih dugmadi — greška u dizajnu ekrana.
- Ispravka: numerisani koraci sa uputstvom; rezultat se prikazuje odmah ispod dugmeta; tokom slušanja govora vidljivo „Slušam… govori sada".

## 0.3.0 — korak 3: unos telesne mase (test)
- Ekran „Danas": kartica „Masa" — poslednje merenje, dugme „Unesi masu", „Sva merenja".
- Ekran „Masa": jedno polje sa brojčanom tastaturom (prihvata zarez i tačku), izbor ranijeg dana, lista merenja za 90 dana, brisanje uz potvrdu.
- Use case-ovi `logWeight` i `deleteWeight` preko ChangeSet-a sa audit zapisom.
- Zahtev za trajno skladište posle prvog uspešnog unosa (ARCHITECTURE §9, DECISIONS/0002); neuspeh zahteva ne poništava unos.
- Trend se NE prikazuje: metod i parametri predloženi u docs/NUTRITION_ENGINE.md (deo T), čekaju odobrenje.
- Tehničke napomene: docs/DECISIONS/0006.
- Testovi: 74 (+29: provera unosa, lokalni datumi, use case-ovi mase nad LocalDataProvider-om).

## 0.3.1 — trend telesne mase (test); korak 3 završen
- Odobren metod trenda (DECISIONS/0007); parametri kao verzionisan skup `reference-data/formulas/trend-1.0.0.json`, provera šemom pri učitavanju.
- `domain/trend`: dnevna vrednost (T1 sa dopunom za naknadne unose), 7-dnevni prosek, 14/28-dnevni nagib, stopa u kg i %. Rezultat nosi verziju skupa parametara.
- Prikaz trenda na kartici „Masa" i ekranu „Masa", sa „≈" (MS §30); kad nema dovoljno podataka piše koliko merenja nedostaje.
- T5: vrednost ispod 30 ili iznad 300 kg traži potvrdu („Ispravi" / „Da, sačuvaj").
- Testovi: 88 (+14: zlatni slučajevi trenda sa ručnim proračunom, property testovi, T5 kroz use case).

## Predlog koraka 4 (samo dokumentacija, bez promene aplikacije)
- NUTRITION_ENGINE.md: delovi N (namirnice i nutrijenti), P (pouzdanost i prikaz), K (sirovo/kuvano) — PREDLOG, čeka odobrenje.
- NAMIRNICE_V1.md: spisak kandidata (~90) i spisak namirnica koje namerno ne ulaze u V1.
- DATA_SOURCES.md: predloženi dodatni izvori (prinosi, Prilog 13).

## 0.4.0 — korak 4: namirnice i nutrition engine (test)
- Odobren predlog koraka 4 (DECISIONS/0008): energija po Prilogu 13, 8 nutrijenata, nivoi pouzdanosti, prikaz, sirovo/kuvano kao posebni zapisi.
- Alat za uvoz FDC u GitHub Actions (`scripts/fdc/`, `.github/workflows/uvoz-fdc.yml`): zvanične arhive, SHA-256, provera ID-jeva nutrijenata, dopuna po NDB broju, izveštaj. Nijedan broj nije prekucan.
- `reference-data/foods/foods-1.0.0.json`: 96 namirnica, status CEKA_ODOBRENJE; produkcijski build pada dok nisu odobrene.
- `domain/nutrition` (energija, skaliranje, zbir sa nepotpunim vrednostima, iskoristivi UH, so), `domain/confidence` (nivoi, prikaz, zaokruživanje), `domain/text` (pretraga latinica/ćirilica/bez dijakritika).
- ReferenceDataProvider port + statička implementacija; `FoodService` (pretraga, detalj, „Zašto?").
- Ekran „Namirnice": pretraga, lista sa kcal/100 g, detail sa unosom grama, prelaz sirovo/kuvano, tabela kao na deklaraciji, „Zašto?". Gest „nazad" iz detalja vraća na listu.
- Testovi: 109 (+21: zlatni slučajevi energije, slaganje alata i aplikacije za svih 96 namirnica, linearnost, zbir, nepoznato ≠ 0, prikaz, pretraga, servis).

## 0.4.1 — R1, razumna preciznost (test)
- DECISIONS/0009: način rada — opšte prihvaćeno i provereno, bez mikroskopske preciznosti; manje odluka za vlasnika.
- Uvoz namirnica 1.1.0 sa pravilom R1: svih 96 namirnica ima energiju; status ODOBRENO.
- NUTRITION_ENGINE.md deo E (dnevna energija, cilj, bezbednosne granice) — predlog za korak 5.

## 0.5.0 — baza znanja: mehanizam (test)
- DECISIONS/0010 (pravila izvora, AI_RULES.md), 0011 (AI vezan za bazu, bez obučavanja), 0012 (baza znanja i novi redosled).
- Šema baze znanja: činjenice sa pitanjima i nivoima, stavke (proračun / bezbednost / objašnjenje) sa izvorima, statusom i verzijom.
- Evaluator: izvedene vrednosti redom zavisnosti sa tragom (stavka + verzija), bezbednosni status, neodlučena pravila kad fali odgovor.
- Upitnik izveden iz baze; provera da ne postoji pitanje koje nijedno pravilo ne koristi.
- Provere baze pri build-u i pokretanju: izvori (ODOBRENO traži original), zavisnosti, kružne veze.
- Sadržaj 0.1.0: 10 stavki iz prvog predloga, sve PREDLOG; aplikacija koristi samo ODOBRENO.
- Test ekran „Baza znanja": pravila sa izvorima (original proveren ili ne) i probni upitnik sa rezultatom.
- Testovi: 123 (+13).

## 0.5.1 — kriterijumi i slojevi provere; baza znanja 0.2.0 (test)
- DECISIONS/0013: vlasnik postavlja kriterijume; provera u 4 sloja (kriterijumi, razvojni agent, nezavisni AI, nutricionista pre drugih korisnika). Build to proverava.
- Baza 0.2.0: izvori pročitani u originalu (Mifflin 1990 sažetak, AHA/ACC/TOS 2013, WHO NLiS, NICE PH27). Ispravke: 1200/1500 kcal nisu minimum iz smernice nego donja granica jednog od načina — koristi se kao oprezno dno; trudnoća po NICE. E-001 još ne ispunjava kriterijum 2 (fali drugi izvor nivoa 1–2) — uhvatila automatska provera.
- Paket za nezavisnu AI proveru: docs/REVIZIJA/kb-0.2.0.md (scripts/kb-review-package.mjs).
- Ekran „Baza znanja": status slojeva provere za svaku stavku.

## 0.5.2 — fleksibilan cilj; baza znanja 0.3.0 (test)
- DECISIONS/0014: cilj preko željene mase i tempa, ručno izabranog manjka ili poznate potrošnje; iste granice za sve načine.
- Baza 0.3.0: E-007 (poznata potrošnja), E-008/E-009 (manjak prema tempu / ručno, najviše 750), E-010 (početni tempo; Hall 2011 — bez obećanog datuma), E-011 + S-004 (željena masa ne ispod ITM 18,5), X-002.
- Mehanizam: uslovi „postoji / ne postoji odgovor", neobavezna pitanja, stavke koje samo preuzimaju podatak korisnika (userData).
- Test ekran: izbor nivoa upitnika, pitanja koja mogu da se preskoče, zastareli odgovori se brišu kad pitanje prestane da važi.
- Paket za nezavisnu proveru: docs/REVIZIJA/kb-0.3.0.md. Testovi: 131.

## 0.5.3
- Ekran „Baza znanja": dugme „Kopiraj paket za nezavisnu proveru" (clipboard; ako telefon ne dozvoli — polje za ručno kopiranje).
