# MERA — Tehnički predlog za početak razvoja

**Verzija dokumenta:** 0.1 (predlog, nije odobreno)
**Osnova:** MASTER_SPECIFICATION v1.0
**Autor:** razvojni AI agent (Claude)
**Status:** analiza i predlog — bez implementacije. Sve odluke u ovom dokumentu su predlozi; konačnu odluku donosi vlasnik projekta (MS §39).

**Napomena o pouzdanosti ovog dokumenta:** tvrdnje o licencama, uslovima korišćenja i mogućnostima spoljnih servisa navedene su prema mom trenutnom saznanju i **moraju biti proverene u zvaničnoj dokumentaciji** pre nego što se na njima zasnuje odluka. Gde god je to slučaj, označeno je sa **[PROVERITI]**. Nijedna numerička granica za bezbednost ili ishranu nije predložena kao činjenica — sve takve vrednosti moraju doći iz izvora koje vlasnik odobri.

---

## 0. Kontekst razvoja koji utiče na arhitekturu

Ovo nisu zahtevi iz specifikacije, već okolnosti koje direktno utiču na izbor tehnologija:

- Vlasnik projekta razvoj i testiranje obavlja **isključivo sa Android telefona (Chrome)**, bez računara. Posledica: ne postoji lokalno razvojno okruženje kod vlasnika. Build, testovi i deploy moraju se izvršavati u oblaku (npr. GitHub Actions), a vlasnik mora dobiti **test verziju preko linka** pre objavljivanja na produkciju.
- Vlasnik nije programer, ali ima jako iskustvo u dizajnu proizvoda. Posledica: dokumentacija, snapshot-ovi i izveštaji moraju biti razumljivi bez čitanja koda.
- Prethodne aplikacije vlasnika su statične PWA na GitHub Pages sa podacima u `localStorage`. Iskustvo je pokazalo da je to rizično (brisanje podataka sajta obrisalo je podatke više aplikacija na istom domenu). **Za Meru to nije prihvatljivo**: podaci o merenjima, ciljevima i zdravlju moraju biti na serveru, sa rezervnim kopijama.
- Ustaljeni radni dogovori sa vlasnikom (potvrda razumevanja pre izmene, test verzija pre objave, standardni dijalog za izlaz na „nazad") važe i ovde.

---

## 1. Razumevanje cilja i glavne funkcije

Mera je **sistem za odlučivanje o ishrani**, a ne aplikacija za beleženje. Njen jedini proizvod je: *„šta da jedem danas, u kojoj količini, i da li plan treba menjati"* — uz dokaz zašto.

Suština je zatvorena petlja:

```
podaci o korisniku → procena potreba → plan → stvarni rezultati → analiza trenda → predlog korekcije → (odluka korisnika) → novi plan
```

Tri stvari čine Meru drugačijom od kalkulatora kalorija:

1. **Adaptacija na osnovu stvarnih rezultata.** Formula je samo početna pretpostavka; posle nekoliko nedelja, trend mase i prijavljeni unos postaju važniji od formule.
2. **Stroga podela uloga:** AI razume jezik i predlaže; deterministički sistemi računaju, proveravaju i odlučuju o bezbednosti. AI nikada nije izvor broja.
3. **Iskrenost o nesigurnosti:** svaki broj nosi poreklo i nivo pouzdanosti; lažna preciznost je greška, ne kozmetički problem.

Korisnički gledano, Mera je jedan ekran („DANAS") + razgovor (glas/tekst). Sve ostalo je u pozadini.

---

## 2. Predlog celokupne arhitekture

### 2.1 Osnovni stav: modularni monolit, ne mikroservisi

Specifikacija (§33) navodi 13 slojeva. Predlažem da to budu **logički moduli unutar jedne serverske aplikacije** sa jasno definisanim interfejsima, a ne zasebni servisi. Razlog: §37 („ne uvoditi nepotrebnu kompleksnost"), jedan vlasnik, faza ličnog testiranja. Moduli se kasnije mogu izdvojiti ako za to postoji stvaran razlog.

### 2.2 Slojevi i tok podataka

```
┌──────────────────────────────────────────────────────────┐
│  KLIJENT (PWA, mobilni Chrome)                           │
│  - prikaz plana, unos, glas, barkod skener, "Zašto?"     │
│  - NE sadrži poslovnu logiku ni API ključeve             │
└───────────────────────┬──────────────────────────────────┘
                        │ HTTPS (autentifikovano)
┌───────────────────────▼──────────────────────────────────┐
│  API SLOJ (tanak: autentifikacija, validacija ulaza)     │
└───────────────────────┬──────────────────────────────────┘
                        │
┌───────────────────────▼──────────────────────────────────┐
│  AI ORKESTRACIJA                                          │
│  - model adapter (§47)  - kontrolisani alati (§34)        │
│  - upravljanje kontekstom razgovora                       │
│  AI poziva ISKLJUČIVO alate ispod; ne piše u bazu direktno│
└───────────────────────┬──────────────────────────────────┘
                        │ pozivi alata (tipizirani, validirani)
┌───────────────────────▼──────────────────────────────────┐
│  DOMENSKI MODULI (deterministički, bez AI)               │
│  Profile │ Food&Product │ Nutrition Engine │ Energy Engine│
│  Recipe Engine │ Meal Planning │ Trend │ Adaptation      │
└───────────────────────┬──────────────────────────────────┘
                        │ svaki izlaz prolazi kroz ↓
┌───────────────────────▼──────────────────────────────────┐
│  VALIDATION  →  SAFETY ENGINE (nezavisan, poslednja reč) │
└───────────────────────┬──────────────────────────────────┘
                        │
┌───────────────────────▼──────────────────────────────────┐
│  PODACI: operativna baza │ referentni podaci (verzionisani)│
│  AUDIT LOG (append-only) │ rezervne kopije               │
└──────────────────────────────────────────────────────────┘
```

### 2.3 Ključna arhitektonska pravila

1. **Jedan smer autoriteta:** AI → alat → domenski modul → validacija → safety → rezultat. Nikada obrnuto, nikada zaobilaznica.
2. **Safety Engine je poslednji korak pre prikaza ili upisa** svakog plana, recepta, cilja i korekcije. On ne zna da postoji AI — prima strukturirane podatke i vraća status.
3. **Referentni podaci (baza hrane, formule, pravila) su nepromenljivi po verziji.** Nova verzija = novi zapis; stara ostaje radi reproduktivnosti (§43, §44).
4. **Korisnički podaci i referentni podaci su strogo razdvojeni.** Korisnik može dodati proizvod (npr. preko deklaracije), ali to je zaseban izvor sa svojim nivoom pouzdanosti, ne izmena referentne baze.
5. **Sva logika je na serveru.** Klijent prikazuje i prikuplja. To je nužno zbog API ključeva, zaštite zdravstvenih podataka, audita i determinističkih proračuna.

---

## 3. Predlog tehnologija i obrazloženje

Predlažem dve varijante backend-a. Obe koriste isti jezik (TypeScript) i istu bazu (PostgreSQL), tako da prelazak iz jedne u drugu nije katastrofalan.

### 3.1 Zajedničke odluke (predlog)

| Oblast | Predlog | Obrazloženje |
|---|---|---|
| Jezik | **TypeScript** (klijent i server) | Jedan jezik za ceo sistem; statički tipovi hvataju veliki deo grešaka pre pokretanja; deljeni tipovi između klijenta, servera i AI alata. |
| Klijent | **PWA**: React + Vite (ili Preact radi manje veličine) | Mobile-first, instalira se na početni ekran, ne zahteva prodavnicu aplikacija, vlasnik testira preko linka. Native aplikacija u ovoj fazi nije opravdana (§37). |
| Validacija šema | **Zod** (ili ekvivalent) | Ista šema validira korisnički unos, AI strukturirane izlaze i API ugovore. Jedan izvor istine za oblik podataka. |
| Baza | **PostgreSQL** | Relaciona struktura odgovara domenu (hrana–nutrijenti–izvori–verzije); transakcije; zrelo; podrška za JSON gde je potrebno; full-text pretraga. |
| Brojevi | Skladištenje u osnovnim jedinicama (g, mg, µg, kcal/kJ) kao decimalni tipovi; zaokruživanje **samo pri prikazu** | Sprečava akumulaciju grešaka zaokruživanja u zbirnim vrednostima. |
| Testovi | **Vitest** (unit/integration), **fast-check** (property-based), **Playwright** (E2E, mobilna emulacija) | Pokreću se u GitHub Actions bez računara kod vlasnika. |
| CI/CD | **GitHub Actions** | Vlasnik već koristi GitHub; build i testovi u oblaku; automatski preview deploy za odobrenje. |
| AI | Model adapter + inicijalno jedan provajder | Vidi §6. |

### 3.2 Backend — varijanta A (preporuka za fazu 1): upravljani BaaS (npr. Supabase)

- Postgres + autentifikacija + serverske funkcije + Row Level Security u jednom servisu.
- Manje operativnog posla za projekat bez DevOps osobe.
- **[PROVERITI]:** dostupnost EU regiona za skladištenje podataka, uslovi besplatnog/plaćenog nivoa, ograničenja serverskih funkcija (trajanje izvršavanja je bitno za AI pozive sa više koraka), način pravljenja rezervnih kopija na nivou plana, uslovi obrade podataka (DPA).
- Rizik: vezivanje za platformu. Ublažavanje: domenska logika se piše kao čist TypeScript bez zavisnosti od platforme; platforma je samo „hosting + baza".

### 3.3 Backend — varijanta B: sopstveni Node.js servis + upravljani Postgres

- Više kontrole (dugotrajni AI tokovi, sopstveni raspored poslova za kontrolne tačke adaptacije).
- Više održavanja (hosting, ažuriranja, monitoring).
- Razumna kada/ako varijanta A pokaže konkretna ograničenja.

**Moj predlog:** početi sa A, uz pravilo da nijedan domenski modul ne zavisi od A-specifičnih API-ja. Konačna odluka — vlasnik.

### 3.4 Šta NE predlažem u ovoj fazi

- Native Android/iOS aplikaciju.
- Mikroservise, message queue, Kubernetes.
- Vektorsku bazu / RAG nad naučnom literaturom (vidi §11 — `search_evidence`).
- Sopstveni ML model.

---

## 4. Struktura projekta i glavne komponente

Predlog monorepo strukture (`mera`):

```
mera/
├── docs/                     # Source of truth (§42)
│   ├── MASTER_SPECIFICATION.md
│   ├── ARCHITECTURE.md
│   ├── DATA_SOURCES.md
│   ├── NUTRITION_ENGINE.md
│   ├── AI_RULES.md
│   ├── SAFETY_RULES.md
│   ├── UI_SPEC.md
│   ├── TEST_PLAN.md
│   ├── AI_COLLABORATION.md
│   ├── CHANGELOG.md
│   ├── DECISIONS/            # ADR — jedna odluka = jedan fajl
│   └── SNAPSHOTS/            # kontrolni snapshot-ovi (§40)
│
├── packages/
│   ├── domain/               # čista logika, BEZ I/O, BEZ AI
│   │   ├── units/            # jedinice, konverzije, gustine
│   │   ├── nutrition/        # zbir nutrijenata, sirovo/kuvano, prinosi
│   │   ├── energy/           # BMR/TDEE formule (verzionisane)
│   │   ├── trend/            # analiza trenda mase
│   │   ├── adaptation/       # predlog korekcija
│   │   ├── planning/         # sastavljanje dnevnog plana
│   │   ├── validation/       # validatori recepata i planova
│   │   └── safety/           # Safety Engine (pravila kao podaci + evaluator)
│   ├── schemas/              # Zod šeme, deljeni tipovi
│   ├── ai/                   # model adapter, alati, promptovi (verzionisani)
│   └── data-import/          # uvoz i normalizacija izvora hrane
│
├── apps/
│   ├── api/                  # API sloj, autentifikacija, orkestracija poziva
│   └── web/                  # PWA klijent
│
├── reference-data/           # verzionisani snapshot-ovi referentnih podataka
│                             # (ili skripte koje ih reprodukuju, zavisno od licence)
└── tests/
    ├── golden/               # zlatni slučajevi (ručno provereni rezultati)
    ├── ai-evals/             # evaluacije AI ponašanja i red-team (§46)
    └── e2e/
```

Ključno pravilo: **`packages/domain` nema pristup mreži, bazi ni AI-ju.** Svaka funkcija prima podatke i vraća rezultat. To omogućava da se kritični proračuni testiraju izolovano i reprodukuju za audit.

---

## 5. Model podataka i najvažniji entiteti

Prikazano konceptualno (ne kao konačna šema baze).

### 5.1 Korisnik i profil

| Entitet | Svrha | Napomena |
|---|---|---|
| `User` | nalog | minimalni identitet |
| `ProfileSnapshot` | godine, pol, visina, nivo aktivnosti, posao… | **verzionisan**: svaka promena = novi snapshot; proračuni referenciraju tačan snapshot |
| `HealthProfile` | zdravstveno relevantni podaci | **zasebna tabela, pojačana zaštita pristupa**, šifrovanje na nivou polja razmotriti; nikad se ne šalje AI-ju u celosti, samo izvedene zastavice (npr. `needs_clinical_review: true`) |
| `Goal` | tip cilja, ciljna vrednost, tempo, status | verzionisan; promena cilja je audit događaj |
| `Preference` | preferencije sa **tipom** (vidi ispod) | razdvaja trajno/privremeno/dostupnost/budžet (§26) |
| `Allergy` / `Intolerance` | tvrda ograničenja | vezano na alergene u bazi hrane, ne na slobodan tekst |
| `MemoryItem` | dugoročne informacije koje korisnik može videti/izmeniti/obrisati (§8, §35) | svaki zapis ima poreklo (koja poruka) i datum |

`Preference.kind` (predlog):
`DISLIKE_PERMANENT | LIKE | AVOID_TODAY | NOT_AVAILABLE | TOO_EXPENSIVE | TIME_LIMIT_PERMANENT | TIME_LIMIT_TODAY | DIETARY_RULE`
uz `valid_from`, `valid_until`, `source_message_id`, `confidence`.

### 5.2 Hrana, proizvodi, izvori

| Entitet | Svrha |
|---|---|
| `Source` | izvor podataka (naziv, izdavač, licenca, URL, uslovi atribucije) |
| `SourceVersion` | konkretno izdanje izvora (verzija, datum, hash uvezenog fajla) |
| `Food` | generička namirnica (jedinstven ID, nazivi na sr-Latn/sr-Cyrl, kasnije drugi jezici) |
| `FoodForm` | stanje/oblik: sirovo, kuvano, pečeno, prženo, oceđeno, suvo, jestivi deo… (§20) |
| `Nutrient` | definicija nutrijenta i jedinice |
| `NutrientValue` | vrednost po 100 g za `FoodForm` ili `Product`: `value`, `unit`, `source_version_id`, `derivation` (izmereno / izračunato / pozajmljeno iz srodne namirnice / procenjeno), `confidence` |
| `PortionUnit` | „kašika", „šolja", „srednja jabuka" → grami, sa izvorom i pouzdanošću |
| `YieldFactor` / `RetentionFactor` | promena mase i nutrijenata pri pripremi (sirovo → kuvano), sa izvorom |
| `Product` | konkretan proizvod (barkod/GTIN, proizvođač, naziv, veličina pakovanja) |
| `ProductNutritionRecord` | nutritivni podaci proizvoda sa poreklom: `LABEL_USER_CONFIRMED`, `EXTERNAL_DB`, `MANUFACTURER`… + datum + pouzdanost |
| `Allergen` + veze na `Food`/`Product` | eksplicitne veze, ne tekstualna pretraga |

### 5.3 Recepti i planovi

| Entitet | Svrha |
|---|---|
| `Recipe` / `RecipeVersion` | recept; svaka izmena = nova verzija; poreklo: `CURATED`, `ADAPTED_FROM(recipe_version)`, `AI_GENERATED` |
| `RecipeIngredient` | `food_form_id` ili `product_id` + grami (uvek u gramima interno) + opcioni prikaz u kućnim merama |
| `RecipeNutritionResult` | **izračunat** rezultat, sa verzijom nutrition engine-a i izvora; nikad unet ručno |
| `ValidationResult` | ishod validacije recepta/plana (prošlo/palo, lista provera) |
| `MealPlan` / `PlannedMeal` | **PLANNED** (§12): šta je predloženo, za koji dan, koji obrok, koja porcija |

### 5.4 Stvarni podaci (§12)

| Kategorija | Entitet | Napomena |
|---|---|---|
| PLANNED | `PlannedMeal` | nikad se automatski ne pretvara u REPORTED |
| REPORTED | `FoodLogEntry` | šta korisnik kaže da je pojeo; `input_method` (tekst/glas/barkod/deklaracija/„pojeo sam kako je planirano" – eksplicitna potvrda), `quantity_confidence` |
| MEASURED | `Measurement` | masa, obimi…; `measured_at`, uslovi (jutro/natašte ako korisnik navede), uređaj opciono |
| ESTIMATED | `Estimate` | procene sistema (npr. stvarni TDEE iz trenda), uvek sa metodom, verzijom i intervalom nesigurnosti |

### 5.5 Adaptacija, bezbednost, audit

| Entitet | Svrha |
|---|---|
| `Checkpoint` | zakazana kontrolna tačka adaptacije |
| `AdaptationProposal` | predlog: `NO_CHANGE / SMALL / LARGE`, obrazloženje, ulazni podaci, status `PROPOSED / ACCEPTED / REJECTED / BLOCKED_BY_SAFETY` |
| `SafetyEvaluation` | status (SAFE / CAUTION / REQUIRES_CLINICAL_REVIEW / BLOCKED), aktivirana pravila, verzija pravila |
| `RuleSetVersion` / `FormulaVersion` / `PromptVersion` / `ValidatorVersion` | verzije (§43) |
| `AuditEvent` | append-only: vreme, akter (korisnik/sistem/AI), ulazi (referencama), verzije, pozvani alati, rezultat validacije i safety provere, konačni rezultat (§44) |
| `AIInteraction` | model, verzija prompta, alati, trajanje, trošak; sadržaj poruka čuvati samo koliko je potrebno (privatnost) |

---

## 6. AI sloj i komunikacija sa AI modelima

### 6.1 Uloga AI-ja

AI je **prevodilac namere u pozive alata** i **prevodilac rezultata u prirodan jezik**. Ne računa, ne izmišlja podatke, ne donosi bezbednosne odluke.

### 6.2 Model adapter (§47)

Interni interfejs (koncept):

```
ModelAdapter
  complete(messages, tools, output_schema, options) → { text?, tool_calls?, structured_output?, usage, model_id }
```

- Jedna implementacija po provajderu. Aplikacija zna samo za adapter.
- Svaki zadatak ima **zadatak-profil** (npr. `intent_parsing`, `food_log_parsing`, `recipe_proposal`, `explanation`), sa definisanim modelom, promptom i šemom izlaza. Različiti zadaci mogu koristiti različite modele ako testovi to opravdaju.
- Promptovi su fajlovi u repozitorijumu, verzionisani; `PromptVersion` se beleži u audit.

**[PROVERITI]:** konkretne mogućnosti izabranog provajdera (tool use, garantovani strukturirani izlaz, ograničenja, cene, uslovi čuvanja podataka i da li se podaci koriste za treniranje, dostupnost DPA). Vlasnik je ranije koristio Gemini API u drugom projektu; izbor provajdera za Meru treba doneti na osnovu evaluacije na srpskom jeziku (vidi §9.4), ne unapred.

### 6.3 Kontrolisani alati (§34) — predlog preciziranja

Svaki alat ima: ulaznu šemu, izlaznu šemu, nivo dozvole (čitanje / predlog / upis uz potvrdu).

| Alat | Tip | Napomena |
|---|---|---|
| `get_user_profile` | čitanje | vraća samo polja potrebna za zadatak; zdravstveni detalji samo kao izvedene zastavice |
| `update_user_preference` | **predlog** → korisnik potvrđuje kod trajnih promena | AI predlaže tip preferencije; sistem ga prikazuje na potvrdu kada je dvosmisleno |
| `search_food` | čitanje | vraća kandidate sa ID-jem; AI **mora** koristiti ID iz rezultata |
| `get_product` | čitanje | ako nije pronađen → eksplicitno `NOT_FOUND`, nikad procena |
| `calculate_nutrition` | deterministički | prima `[{food_form_id, grams}]` |
| `calculate_energy_needs` | deterministički | AI ga retko poziva direktno; koristi ga planer |
| `get_weight_trend` | deterministički | |
| `propose_recipe` (umesto `generate_recipe`) | predlog | AI vraća strukturu: sastojci kao ID-jevi iz baze + grami + koraci; sistem računa i validira |
| `validate_recipe`, `validate_meal_plan` | deterministički | poziva ih sistem **uvek**, ne AI po izboru |
| `generate_meal_plan` | deterministički planer + AI izbor kandidata | vidi §8.3 |
| `search_evidence` | **predlažem odlaganje** | vidi §12 |
| `log_food` | predlog → potvrda | AI parsira „pojeo sam tanjir pasulja", sistem prikazuje tumačenje i nesigurnost količine |

Pravilo implementacije: **validacija i safety provera nisu alati koje AI bira da pozove — one su obavezni koraci u toku koje orkestrator izvršava automatski.** Tako AI ne može „zaboraviti" ili zaobići proveru.

### 6.4 Kontekst razgovora (§16)

- Kontekst po zahtevu se sastavlja iz: aktivnog plana za danas, relevantnih preferencija, poslednjih N poruka, sažetka ranijeg razgovora. Ne šalje se cela istorija.
- „Promeni večeru" se rešava iz strukturiranog stanja (koji je današnji plan), ne iz AI pamćenja.
- Pitanja se postavljaju samo za podatke koji nedostaju i koji su označeni kao potrebni za bezbednost ili kvalitet (lista takvih podataka je deo `AI_RULES.md`).

### 6.5 Ponašanje kod neuspeha

- Nevalidan strukturirani izlaz → ponovni pokušaj sa porukom o grešci (ograničen broj) → ako ne uspe, korisniku se kaže da zahtev nije mogao biti obrađen; **nikad se ne prikazuje neprovereni rezultat** (§24).
- Nedostupan AI servis → osnovne funkcije (prikaz plana, ručna zamena klikom iz ponuđenih alternativa, unos mase) moraju raditi bez AI-ja.

---

## 7. Nutritivni podaci, izvori, verzionisanje i kvalitet

### 7.1 Strategija izvora (predlog, zahteva proveru licenci)

| Uloga | Kandidat | Napomena |
|---|---|---|
| Lokalne generičke namirnice | **Srpska baza sastava namirnica** (razvijana pri Institutu za medicinska istraživanja, Univerzitet u Beogradu, u okviru EuroFIR saradnje) | Najrelevantnija za lokalnu hranu i jela. **[PROVERITI]**: način pristupa, obuhvat, licenca, dozvola komercijalne upotrebe i redistribucije. Moguće da zahteva direktan dogovor sa institucijom. |
| Opšta generička baza (široka pokrivenost) | **USDA FoodData Central** | Prema mom saznanju podaci su javno dostupni sa vrlo liberalnim uslovima korišćenja **[PROVERITI tačnu licencu i zahtev za atribuciju]**. Mana: američke namirnice i nazivi; potrebno mapiranje. |
| Evropske alternative | npr. francuska CIQUAL, britanska CoFID | **[PROVERITI licence]**; korisne kao dopuna za evropske namirnice. |
| Proizvodi sa barkodom | **Open Food Facts** | Otvorena baza koju uređuje zajednica. **[PROVERITI]**: licenca baze (prema mom saznanju ODbL — ima *share-alike* obavezu za izvedene baze, što može imati posledice za komercijalni proizvod), licenca slika, pravila za API korišćenje. Kvalitet podataka je promenljiv — tretirati kao srednju pouzdanost. |
| Deklaracija sa proizvoda | korisnik (fotografija + potvrda) | Najbolji izvor za konkretan proizvod koji korisnik ima. |
| Referentne vrednosti unosa | npr. EFSA referentne vrednosti | **[PROVERITI]** koji skup referentnih vrednosti vlasnik želi kao osnovu. |

**Predlog principa:** jedna namirnica u Meri ima **jednu primarnu vrednost po nutrijentu**, izabranu prema definisanom prioritetu izvora, a ostali izvori služe za proveru konzistentnosti (ako se primarni i sekundarni izvor značajno razlikuju → zastavica za ručnu proveru).

### 7.2 Uvoz podataka

- Uvoz je skripta (`packages/data-import`), deterministička i ponovljiva: isti ulazni fajl → isti rezultat.
- Svaki uvoz pravi novu `SourceVersion` sa hash-om ulaznog fajla.
- Uvoz uključuje **normalizaciju**: jedinice, oznake nutrijenata (npr. da li je „ugljeni hidrati" ukupni ili raspoloživi — različite baze to različito definišu), način računanja energije.
- **Mapiranje na srpske nazive** i lokalne namirnice je ručno kurirano za početni skup (vidi §13). AI može predložiti mapiranje, ali čovek potvrđuje.

### 7.3 Nivoi pouzdanosti (preciziranje §30)

Predlog četiri nivoa sa definicijama koje se mogu programski odrediti:

| Nivo | Primer | Prikaz |
|---|---|---|
| `RELIABLE` | referentna baza, izmerena vrednost, tačna gramaža | `500 kcal` |
| `CONFIRMED` | deklaracija potvrđena od korisnika | `500 kcal` |
| `ESTIMATED` | izračunato uz faktore pripreme, kućne mere, pozajmljene vrednosti | `≈500 kcal` |
| `LOW_CONFIDENCE` | nepoznata porcija, slaba podudarnost namirnice | `480–530 kcal` |

Pouzdanost zbira = najslabija pouzdanost značajnog sastojka (pravilo treba formalno definisati u `NUTRITION_ENGINE.md`).

Napomena: čak i deklaracija ima dozvoljena odstupanja od stvarne vrednosti prema propisima o označavanju hrane, pa „pouzdano" nikad ne znači „apsolutno tačno". To treba da stoji u objašnjenju „Zašto?".

### 7.4 Sirovo/kuvano

Najčešći izvor sistemske greške u aplikacijama za ishranu. Predlog:
- Recepti se interno uvek računaju iz **sirovih težina sastojaka**, a gotovo jelo dobija težinu preko faktora prinosa.
- Ako korisnik prijavi „150 g kuvanog pirinča", sistem mora koristiti vrednost za kuvani oblik ili konverziju faktorom — nikad sirove vrednosti.
- AI kod parsiranja unosa mora izričito odrediti oblik; ako je dvosmisleno i značajno utiče na rezultat → pitanje ili `LOW_CONFIDENCE`.

---

## 8. Proračuni, validacija i Safety Engine

### 8.1 Energy Engine

- Formula za procenu bazalnog metabolizma: kandidat je **Mifflin–St Jeor** kao podrazumevana za opštu populaciju; formula zasnovana na bezmasnoj masi (npr. Katch–McArdle) samo ako postoji pouzdana procena telesne kompozicije. **Izbor formule, faktori aktivnosti i pravila za cilj moraju biti dokumentovani u `NUTRITION_ENGINE.md` sa izvorima i odobreni od vlasnika** (idealno uz konsultaciju nutricioniste).
- Faktori aktivnosti su tabela podataka sa verzijom, ne konstante u kodu.
- Izlaz: vrednost + interval nesigurnosti + verzija formule + ulazni `ProfileSnapshot`.

### 8.2 Trend i adaptacija

- **Trend mase:** predlog eksponencijalno ponderisanog proseka za prikaz „stvarne" mase i linearne regresije na prozorima od 14 i 28 dana za stopu promene. Rukovanje nedostajućim danima i ekstremnim vrednostima (npr. greška unosa) mora biti eksplicitno.
- **Minimalni uslovi za predlog korekcije** (broj merenja, broj dana, pokrivenost prijavljenog unosa) su parametri pravila, ne hardkodovano.
- **Procena stvarnog energetskog utroška iz podataka:** princip energetskog balansa (prosečan prijavljeni unos minus energetski ekvivalent promene mase po danu). Važne ograničenja koja sistem mora poštovati:
  - koeficijent energetskog ekvivalenta promene mase je aproksimacija (široko korišćeno pravilo ~7700 kcal/kg poznato je kao pojednostavljenje) — koeficijent mora biti izvorno potkrepljen i verzionisan;
  - prijavljeni unos je sistematski nepouzdan (poznato je da ljudi često potcenjuju unos) — zato se procena koristi uz interval nesigurnosti i konzervativno.
- **Adaptation Engine vraća samo predlog** (`NO_CHANGE / SMALL / LARGE`) sa obrazloženjem. Primenjuje se tek posle potvrde korisnika **i** safety provere.

### 8.3 Planiranje obroka

Predlog hibrida:
1. Deterministički planer određuje **dnevne ciljeve** (energija, proteini, raspon ostalih makronutrijenata) i raspodelu po obrocima.
2. AI (ili pravila za preferencije) bira **kandidate recepata** iz baze prema ukusu, vremenu, budžetu i dostupnosti.
3. Deterministički planer **skalira porcije** i kombinuje kandidate da bi pogodio ciljeve u definisanim tolerancijama.
4. Validacija + safety.

Tako AI utiče na *šta* se jede, a sistem garantuje *koliko*. Za korak 3 u prvoj verziji je dovoljna jednostavna heuristika skaliranja porcija; optimizacija (npr. linearno programiranje) tek ako heuristika pokaže nedostatke u testovima.

### 8.4 Validacija (§24)

Validator recepta — provere redom, svaka sa jasnim kodom greške:
1. svi sastojci postoje u bazi (ID), oblik je naveden;
2. količine su u realnom opsegu za taj sastojak;
3. nutritivni proračun uspešan, bez nepoznatih vrednosti za ključne nutrijente (ili je pouzdanost adekvatno spuštena);
4. usklađenost sa ciljevima obroka (tolerancije kao parametri);
5. alergeni i ograničenja — **tvrda provera preko veza u bazi**;
6. vreme pripreme u odnosu na ograničenje korisnika;
7. unutrašnja konzistentnost (npr. sastojak naveden u koracima postoji u listi i obrnuto; broj porcija i gramaža usklađeni).

Ako validacija ne prođe: najviše N pokušaja popravke preko AI-ja sa listom grešaka, zatim odbacivanje.

### 8.5 Safety Engine (§32)

- **Pravila su podaci** (verzionisan skup pravila u `SAFETY_RULES`), evaluator je mali, dobro testiran kod bez AI-ja.
- Ulaz: strukturirani predlog (cilj, plan, korekcija) + relevantne zastavice profila. Izlaz: status + lista aktiviranih pravila + poruka za korisnika.
- Pravila se primenjuju na **vrednosti**, ne na tekst zahteva — zato preformulisanje zahteva ne može zaobići pravilo (§32).
- Kategorije pravila koje treba definisati (vrednosti mora odrediti/odobriti vlasnik, uz stručni izvor):
  - donja granica dnevnog energetskog unosa;
  - maksimalna stopa promene mase;
  - ciljna masa ispod definisane granice (npr. prema indeksu telesne mase) → BLOCKED;
  - maloletnici, trudnoća, dojenje, poznata medicinska stanja → REQUIRES_CLINICAL_REVIEW ili BLOCKED;
  - znaci poremećaja ishrane u razgovoru → poseban tok (ne nastavljati sa restriktivnim savetima, ponuditi stručnu pomoć);
  - alergije → BLOCKED za bilo koji plan koji sadrži alergen;
  - ekstremno velike korekcije u jednom koraku.
- **Konačna odluka korisnika (§14) ne može nadjačati BLOCKED.** Ovo treba eksplicitno upisati u specifikaciju (vidi §12).

---

## 9. Testiranje

### 9.1 Deterministički moduli
- **Zlatni slučajevi:** ručno provereni primeri (npr. poznati ulazi za formulu i očekivani izlaz izračunat nezavisno), čuvani kao fajlovi. Svaka promena formule mora ili zadržati rezultate ili eksplicitno ažurirati zlatne slučajeve uz zapis u CHANGELOG.
- **Property-based testovi** za jedinice i zbirove (npr. zbir recepta = zbir sastojaka; konverzija tamo-nazad vraća istu vrednost; skaliranje porcije linearno skalira nutrijente).
- **Granični slučajevi:** nula, negativne vrednosti, nedostajući nutrijenti, ekstremne visine/mase, nedostajući dani merenja.

### 9.2 Integracioni testovi
- Tok: zahtev → AI (mock adapter sa unapred snimljenim odgovorima) → alati → validacija → safety → rezultat.
- Mock adapter omogućava determinističko testiranje orkestracije bez troška i nestabilnosti pravog modela.

### 9.3 Safety testovi
- Tabela scenarija: za svaki ulaz očekivani status. Pokreće se u CI na svaku promenu.

### 9.4 AI evaluacije i red-team (§45, §46)
- Zaseban skup (`tests/ai-evals`) koji se pokreće na pravom modelu, periodično i pre promene modela/prompta.
- Kategorije: izmišljanje nutritivne vrednosti, nepostojeći sastojak, nepoznat proizvod kao poznat, pogrešan oblik (sirovo/kuvano), pogrešno tumačenje alergije, pokušaj zaobilaženja safety pravila, pogrešna klasifikacija preferencije („ne volim" vs „nemam"), srpski jezik latinica/ćirilica, dijalektalni i razgovorni izrazi, lokalna jela.
- Metrika: stopa uspeha po kategoriji; kriterijum prihvatanja definiše vlasnik.
- Ključno: većina red-team scenarija treba da bude **zaustavljena arhitekturom** (AI nema kako da upiše izmišljenu vrednost), a evaluacija proverava da AI i u razgovoru ne tvrdi netačno.

### 9.5 UI i mobilni uređaj
- Playwright sa emulacijom mobilnog uređaja u CI za regresije.
- **Konačna potvrda: stvarni prikaz na vlasnikovom telefonu u Chrome-u** preko preview linka. Emulacija nije zamena.
- Poznati problemi Android tastature (Gboard) sa unosom u polja treba uzeti u obzir pri dizajnu formi od početka.

---

## 10. Spoljni servisi, API-ji i biblioteke — šta proveriti

| Stavka | Namena | Šta proveriti |
|---|---|---|
| AI provajder (1 ili više) | razgovor, parsiranje, predlozi | cena, tool use, strukturirani izlaz, čuvanje podataka, korišćenje za trening, DPA, kvalitet na srpskom |
| Backend platforma (npr. Supabase) ili hosting + Postgres | baza, auth, funkcije | EU region, rezervne kopije, ograničenja izvršavanja, cena na rast, DPA |
| Hosting klijenta (GitHub Pages / Cloudflare Pages / platforma iz reda iznad) | PWA | HTTPS, preview okruženja za odobrenje |
| Srpska baza sastava namirnica | lokalna hrana | pristup, licenca, komercijalna upotreba, redistribucija |
| USDA FoodData Central | generička baza | tačna licenca, atribucija |
| CIQUAL / CoFID (opciono) | dopuna | licence |
| Open Food Facts | barkod | licenca baze i slika (share-alike posledice), pravila API-ja, zahtevi za identifikaciju aplikacije |
| Skeniranje barkoda u pregledaču | barkod | podrška za Barcode Detection API u Chrome-u na Androidu na ciljanom uređaju; rezervna JS biblioteka (npr. iz ZXing porodice) — licenca |
| Prepoznavanje govora | glas | Web Speech API u Chrome-u (kvalitet za srpski, gde se obrađuje zvuk, privatnost) naspram serverskog STT servisa (cena, licenca, kvalitet za srpski) |
| OCR deklaracije | deklaracija | klasičan OCR (npr. Tesseract — licenca, kvalitet za srpski/ćirilicu) naspram multimodalnog AI modela (vidi §12, stavka 6) |
| Izvor cena u Srbiji | budžet (§27) | ne postoji definisan izvor — vidi §12 |
| Zakonski okvir | zaštita podataka | Zakon o zaštiti podataka o ličnosti (Srbija) — zdravstveni podaci su posebna kategorija; GDPR ako se ciljaju korisnici u EU; pravila o medicinskim tvrdnjama za kasniju komercijalnu fazu |

---

## 11. Tehnički problemi i rizici

| # | Rizik | Posledica | Ublažavanje |
|---|---|---|---|
| 1 | **Pokrivenost lokalne hrane** | Plan sa pogrešnim ili nedostajućim podacima za srpska jela | Početi sa kuriranim skupom najčešćih namirnica i jela; merljiva pokrivenost kao cilj faze |
| 2 | **Nepouzdan prijavljeni unos** | Adaptacija zasnovana na pogrešnim podacima | Intervali nesigurnosti; konzervativne korekcije; trend mase ima veću težinu od prijave |
| 3 | **Procena porcija iz teksta/glasa** | Ista nesigurnost zbog koje je fotografija tanjira isključena | Eksplicitna pouzdanost po unosu; pitanja samo kad utiču značajno (vidi §12) |
| 4 | AI mapira „pasulj" na pogrešnu namirnicu/oblik | Tiha greška u kalorijama | Prikaz tumačenja korisniku; evaluacije; oblik kao obavezno polje |
| 5 | **Licence izvora** | Nemogućnost komercijalizacije ili obaveza otvaranja izvedene baze | Pravna/licencna provera pre uvoza; `Source` sa licencom; izbegavati mešanje share-alike podataka u osnovnu bazu bez odluke |
| 6 | Zdravstveni podaci kod AI provajdera | Privatnosni i zakonski rizik | Minimizacija: AI dobija samo izvedene zastavice; DPA; EU region |
| 7 | **Rizik od štete kod mršavljenja** (poremećaji ishrane, prebrzi gubitak) | Stvarna šteta korisniku | Nezavisan Safety Engine; stručno odobrena pravila; poseban tok za znake poremećaja ishrane |
| 8 | Kvalitet prepoznavanja govora na srpskom | Loše iskustvo glavnog interfejsa | Rana evaluacija na vlasnikovom telefonu; tekst kao ravnopravan kanal |
| 9 | Troškovi AI poziva | Neodrživo pri rastu | Keširanje; manji modeli za jednostavne zadatke; deterministički putevi bez AI-ja gde je moguće |
| 10 | Latinica/ćirilica i pretraga | Neuspešna pretraga hrane | Interno jedno pismo za ključeve + transliteracija pri unosu i pretrazi; normalizacija dijakritika (npr. „cevapi" = „ćevapi") |
| 11 | Razvoj bez računara | Teže otklanjanje grešaka, nema lokalnog pokretanja | Sve u CI; preview deploy; vidljiv dijagnostički panel u test verziji |
| 12 | **Obim projekta** | Nikad završen MVP | Striktan redosled (§13); §48 kao filter za svaku funkciju |
| 13 | Zavisnost od konteksta AI sesija u razvoju | Gubitak kontinuiteta između sesija i AI sistema | `docs/`, ADR, snapshot-ovi (§40) kao obavezni artefakti |
| 14 | Nejasna granica „ishrana vs medicina" | Pravni i bezbednosni rizik | Definisati listu stanja koja isključuju automatsko planiranje |

---

## 12. Kontradikcije, nedorečenosti i predlozi za preciziranje specifikacije

Ništa od ovoga nije promena specifikacije — to su pitanja i predlozi za odluku vlasnika.

1. **Konačna odluka korisnika vs. Safety Engine (§14, §32, §39).** Specifikacija kaže da korisnik donosi konačnu odluku o korekciji. Treba eksplicitno navesti: *korisnik bira između bezbednih opcija; BLOCKED ne može biti nadjačan*. Isto za §28 (broj obroka) i ciljeve.

2. **AI generisani recepti vs. „AI ne sme izmišljati sastojke" (§6, §23).** Predlog preciziranja: AI sme predložiti recept samo od sastojaka koji postoje u bazi (ID-jevi); količine i nutritivne vrednosti uvek računa sistem.

3. **Fotografija tanjira isključena zbog nesigurnosti (§17), ali unos tekstom/glasom („pojeo sam tanjir pasulja") ima sličnu nesigurnost količine.** Treba definisati kako se tretira nesigurnost porcije kod tekstualnog unosa: podrazumevane porcije sa izvorom, obavezno pitanje, ili raspon.

4. **Glavni ekran prikazuje tri obroka (§15), a broj obroka bira korisnik (§28).** Predlog: ekran je dinamičan; primer u §15 je ilustracija, ne zahtev.

5. **Nivoi personalizacije (osnovni/detaljni/napredni, §9)** nisu definisani — koji podaci pripadaju kom nivou i šta je minimalni onboarding (§8)? Predlažem da se definiše **minimalni skup podataka za bezbedan početak** kao prvi konkretan dokument.

6. **OCR deklaracije (§19):** ko radi OCR? Ako se koristi multimodalni AI model, to je u tenziji sa §6 (AI nije izvor nutritivne činjenice). Predlog: dozvoljeno, jer je AI tu *čitač teksta*, a ne izvor, **pod uslovom** da korisnik potvrdi svaku vrednost i da postoje provere konzistentnosti (npr. energija iz makronutrijenata približno odgovara deklarisanoj energiji). Potrebna eksplicitna odluka.

7. **Budžet, cene, otpad (§27):** ne postoji definisan izvor cena u Srbiji. Opcije: korisnik unosi cene koje plaća; približne kategorije (jeftino/srednje/skupo) kurirane ručno; kasnija integracija. Predlažem da se u prvoj verziji budžet tretira samo kao **kategorija**, bez cena u dinarima.

8. **Promena telesne kompozicije (§2)** — nije definisano kako se meri. Kućne vage sa procenom procenta masti imaju veliku nesigurnost. Predlog: obimi (struk i sl.) i trend mase kao primarni signali; procenat masti samo kao podatak niske pouzdanosti ako ga korisnik unese.

9. **„Druge opravdane ciljeve" (§2)** — potrebna zatvorena lista ciljeva za v1.

10. **Starosna granica, trudnoća, dojenje, medicinska stanja** — nisu navedeni. Potrebna odluka: ko je van obuhvata automatskog planiranja.

11. **`search_evidence` (§34)** — nije jasno šta je izvor „dokaza" i kako se sprečava izmišljanje studija. Predlog: umesto pretrage literature u realnom vremenu, **kurirana, verzionisana tabela referenci** (Reference/Evidence Layer) na koju se pozivaju formule i pravila; AI citira samo iz te tabele.

12. **Adaptacija bez unosa hrane:** ako korisnik ne beleži hranu, šta adaptacija koristi? Predlog: definisati dva režima — (a) samo trend mase + pridržavanje plana po izjavi korisnika, (b) trend + prijavljeni unos; sa različitim pouzdanostima.

13. **„Značajna promena" (§25)** — kriterijum za automatski predlog prilagođavanja ostatka dana i za obaveznu potvrdu nije definisan (predlog: parametar u pravilima).

14. **Latinica/ćirilica (§36)** — koje je podrazumevano pismo, i da li korisnik bira pismo prikaza? Da li se glasovni odgovor daje na srpskom (i koji glas)?

15. **Glasovni razgovor (§15, §16)** — da li Mera odgovara i glasom (sinteza govora) ili samo tekstom? Utiče na izbor servisa i cenu.

16. **Offline rad** — nije pomenut. Predlog: prikaz današnjeg plana i unos mase rade offline i sinhronizuju se kasnije; AI zahteva mrežu.

17. **Obim arhitekture (§33) vs. §37** — predlažem da se 13 slojeva eksplicitno tumači kao logički moduli (vidi §2.1).

18. **Kontrolne tačke adaptacije (§14)** — učestalost nije definisana (nedeljno? na 14 dana?). Takođe: kako se korisnik obaveštava (push notifikacije u PWA zahtevaju dozvolu i dodatnu infrastrukturu).

19. **Pravo na brisanje (§8, §35) vs. audit trail (§44)** — ako korisnik obriše podatke, šta se dešava sa audit zapisima koji ih referenciraju? Potrebna politika (npr. anonimizacija).

20. **Stručni nadzor** — specifikacija traži „kvalitet nutricioniste", ali ne predviđa da stvarni stručnjak pregleda formule, pravila i kurirane recepte. Preporučujem da se bar safety pravila i izbor formula stručno pregledaju pre upotrebe od strane bilo koga osim vlasnika.

---

## 13. Predlog redosleda razvoja

Princip: **prvo temelj koji daje tačne brojeve, pa tek onda interfejs i AI koji ih koriste.** Svaka faza se završava testovima i kontrolnim snapshot-om.

### Faza 0 — Odluke i dokumentacija (bez koda aplikacije)
- Odgovori vlasnika na pitanja iz §12 (bar 1, 2, 5, 7, 9, 10, 12).
- Provera licenci izvora hrane; izbor primarnog izvora.
- Izbor backend varijante i AI provajdera (uz kratku evaluaciju srpskog jezika).
- Nacrti: `ARCHITECTURE.md`, `DATA_SOURCES.md`, `NUTRITION_ENGINE.md` (formule sa izvorima), `SAFETY_RULES.md` (kategorije + vrednosti koje odobri vlasnik).
- Postavljanje repozitorijuma, CI, preview deploy procesa.

### Faza 1 — Deterministički temelj
- Jedinice, `Food`/`FoodForm`/`NutrientValue`, uvoz prvog izvora, kuriran početni skup lokalnih namirnica.
- Nutrition Engine (zbir, sirovo/kuvano, pouzdanost).
- Energy Engine.
- Safety Engine (evaluator + prva pravila).
- Kompletni testovi (zlatni slučajevi, property-based).
- *Rezultat:* još nema UI-ja za korisnika, ali su brojevi proverljivi.

### Faza 2 — Minimalna korisna petlja bez AI-ja
- Nalog, minimalni onboarding (forma), profil, cilj.
- **Unos telesne mase + prikaz trenda** — korisno odmah i počinje prikupljanje podataka koji će adaptaciji trebati tek za nekoliko nedelja.
- Kuriran skup recepata (lokalna jela) + validator.
- Deterministički planer + glavni ekran „DANAS" + zamena obroka klikom (iz validiranih alternativa).
- *Rezultat:* vlasnik može početi lično testiranje sa pravim planom.

### Faza 3 — AI sloj
- Model adapter, alati, orkestracija sa obaveznom validacijom/safety.
- Tekstualni razgovor: „promeni večeru", „nemam piletinu", preferencije sa tipovima, memorija sa pregledom/brisanjem.
- AI evaluacije i red-team skup.

### Faza 4 — Beleženje stvarnog unosa
- Unos hrane tekstom, zatim glasom.
- Barkod (proizvodi).
- REPORTED vs PLANNED razdvojeno u prikazu.

### Faza 5 — Adaptacija
- Kontrolne tačke, procena stvarnog utroška, predlozi korekcija sa potvrdom.
- Ima smisla tek kada postoje nedelje stvarnih podataka iz faza 2–4 — zato dolazi ovde.

### Faza 6 — Kasnije
- Fotografija deklaracije (OCR) sa potvrdom.
- Recepti koje AI generiše (posle stabilnog validatora i evaluacija).
- Budžet/otpad/ostaci.
- „Zašto?" u punom obimu (osnovni oblik se uvodi ranije, uz svaki broj).
- Offline režim, notifikacije, drugi jezici i valute, priprema za komercijalnu fazu (pravna usklađenost).

### Šta je namerno odloženo i zašto
- **AI generisani recepti** — najveći rizik halucinacija; kuriran skup je dovoljan za početak.
- **OCR** — zahteva stabilan tok potvrde i provere konzistentnosti.
- **Cene u dinarima** — nema izvora.
- **`search_evidence` nad literaturom** — zamenjeno kuriranom tabelom referenci.

---

## 14. Otvorena pitanja za vlasnika (sažetak)

1. Varijanta backend-a: upravljana platforma (A) ili sopstveni servis (B)?
2. Koji izvor je primarni za generičke namirnice (nakon provere licenci)?
3. Da li je stručni pregled (nutricionista/lekar) safety pravila i formula deo plana pre šire upotrebe?
4. Ko je van obuhvata automatskog planiranja (starost, trudnoća, stanja)?
5. Da li AI sme da čita deklaracije sa fotografije uz obaveznu potvrdu korisnika?
6. Budžet u v1: kategorije ili cene?
7. Kako se tretira nesigurnost količine kod tekstualnog/glasovnog unosa?
8. Podrazumevano pismo (latinica/ćirilica) i da li Mera odgovara glasom?
9. Učestalost kontrolnih tačaka adaptacije.
10. Zatvorena lista ciljeva za v1.

---

*Kraj dokumenta. Predlog namenjen nezavisnoj reviziji (MS §41). Ne menja specifikaciju.*
