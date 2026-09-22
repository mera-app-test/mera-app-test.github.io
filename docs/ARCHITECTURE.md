> **STATUS: ODOBRENO** — vlasnik projekta je odobrio V1 arhitekturu, uključujući sve tri stavke iz sekcije ZA ODOBRENJE (TypeScript + Vite + React + GitHub Actions; zaseban origin za test `mera-app-test`; obuhvat V1 iz §2).
> Dalje izmene samo kroz `docs/DECISIONS/` i `docs/CHANGELOG.md`. Rezultati provera: `docs/PROVERE_V1.md`.

# MERA — V1 tehnička arhitektura

**Verzija dokumenta:** 1.0 (odobreno)
**Osnova:** MASTER_SPECIFICATION v1.0 (u daljem tekstu MS), MERA_TEHNICKI_PREDLOG v0.1, MERA_PROCENA_LOKALNI_PRISTUP v0.1
**Status:** odobreno; implementacija u toku prema §17.

Oznake u dokumentu:
- **[POTVRĐENO]** — provereno u zvaničnoj dokumentaciji tokom izrade ovog dokumenta.
- **[PROVERITI]** — mora se proveriti u zvaničnoj dokumentaciji pre implementacije tog dela.

---

## 0. Zatvaranje prethodne analize

Analiza „lokalni podaci u V1, server kasnije" je zatvorena. Vlasnik je odlučio:

1. AI API ključ se u V1 čuva lokalno na telefonu — DA.
2. Zaseban origin za Meru — DA (rešenje u §3).
3. Backup — ručni JSON export/import uz nedeljni podsetnik.
4. Automatski cloud backup — NE u V1; ostaje za server/komercijalnu fazu.

Ovaj dokument definiše V1 arhitekturu na osnovu tih odluka. Tamo gde se razlikuje od v0.1 (serverska V1), važi ovaj dokument.

---

## 1. Principi V1 arhitekture

1. **Lokalno sada, server kasnije, bez prepravke.** Svi delovi osim data sloja i AI transporta ne znaju gde su podaci.
2. **Jedan smer zavisnosti.** Unutrašnji slojevi (domain) ne znaju za spoljne (UI, IndexedDB, AI provajder).
3. **Deterministička jezgra.** Svi kritični proračuni (MS §9, §22) su čiste funkcije bez I/O, bez vremena, bez slučajnosti.
4. **Validacija i Safety nisu opcioni.** Izvršavaju se u aplikacionom sloju za svaku operaciju koja proizvodi plan, cilj ili korekciju — bez obzira da li je zahtev došao klikom ili preko AI-ja.
5. **Sve važno je sledljivo.** Svaki izračunat rezultat nosi poreklo (verzije engine-a, pravila, izvora podataka).
6. **Samo ono što MS traži.** Nijedna komponenta ne postoji bez jasne svrhe u MS.

---

## 2. Obuhvat V1

Predlog obuhvata (deo ZA ODOBRENJE, stavka 3):

| Funkcija (MS) | V1 | Napomena |
|---|---|---|
| Minimalni onboarding (§7, §8) | DA | forma, bez AI-ja |
| Energetski model (§10, §11) | DA | deterministički |
| Početni plan + glavni ekran „DANAS" (§10, §15) | DA | iz kuriranih recepata |
| Zamena obroka klikom (§25) | DA | iz validiranih alternativa |
| Unos mase + trend (§12, §13) | DA | počinje odmah, jer adaptaciji trebaju nedelje podataka |
| Razgovor tekstom (§5, §16, §26) | DA | AI sloj |
| Razgovor glasom (§16) | DA, ako prođe proveru | Web Speech API — [PROVERITI] |
| Unos hrane tekstom/glasom (§17) | DA | uz potvrdu tumačenja |
| Barkod (§18) | DA | Open Food Facts — [PROVERITI] |
| Adaptacija (§14) | DA | predlog + potvrda korisnika |
| „Zašto?" (§31) | osnovni oblik | poreklo i pouzdanost svakog broja |
| Memorija sa pregledom/izmenom/brisanjem (§8, §35) | DA | |
| Fotografija deklaracije / OCR (§19) | NE | predviđeno mesto u arhitekturi |
| AI generisani novi recepti (§23 tačka 3) | NE | predviđeno mesto; V1 koristi kurirane i prilagođene recepte |
| Cene u RSD, otpad, ostaci (§27) | NE | nema izvora cena; budžet u V1 samo kao kategorija preferencije |
| Više jezika i valuta (§36) | NE | arhitektura ih omogućava (ključevi prevoda, valuta kao polje) |
| Server, nalozi, više uređaja | NE | vidi §12 |

---

## 3. Hosting i zaseban origin

### 3.1 Problem
Postojeće aplikacije vlasnika su project sajtovi na `zoki02122.github.io/<repo>`. Svi dele isti origin, pa brisanje podataka sajta za jednu aplikaciju briše podatke svih.

### 3.2 Rešenje: GitHub organizacija sa organizacijskim Pages sajtom
- Kreira se nova GitHub organizacija (predlog imena: `mera-app`; dostupnost imena se proverava pri kreiranju).
- Produkcija: repozitorijum `mera-app.github.io` → adresa `https://mera-app.github.io/`.
- To je zaseban host, dakle zaseban origin, nezavisan od `zoki02122.github.io`.

**[POTVRĐENO]** (GitHub Docs):
- Organizacijski sajt mora biti u repozitorijumu nazvanom `<owner>.github.io` i objavljuje se na `http(s)://<owner>.github.io`; dozvoljen je jedan takav sajt po nalogu/organizaciji.
- Kreiranje organizacije se radi iz podešavanja naloga (Settings → Organizations → New organization).
- Za build procese koji nisu Jekyll, podržan je sopstveni GitHub Actions workflow za build i objavljivanje.

**[POTVRĐENO]** (javno dokumentovano): `github.io` je na Public Suffix List kao privatni sufiks, pa pregledači tretiraju `zoki02122.github.io` i `mera-app.github.io` kao zasebne sajtove (važno za „brisanje podataka sajta" koje pregledač grupiše po sajtu). Provera direktno u fajlu liste na publicsuffix.org je navedena u [PROVERITI] radi potpunosti.

Zašto ovo, a ne alternative:
- Ostaje ceo postojeći tok rada vlasnika (GitHub, isti nalog, isti način objave).
- Bez troška (ne treba kupovati domen).
- Bez novog provajdera hostinga.

### 3.3 Test okruženje (deo ZA ODOBRENJE, stavka 2)
Test verzija ne sme deliti origin sa produkcijom: neispravna migracija u test verziji oštetila bi stvarne podatke. Predlog: druga organizacija `mera-app-test` → `https://mera-app-test.github.io/`. Podaci se u test prenose preko JSON exporta/importa.

Tok objave: kod se prvo objavljuje na test adresu → vlasnik testira na telefonu → posle odobrenja isti build ide na produkciju.

---

## 4. Tehnološki stek V1

(Deo ZA ODOBRENJE, stavka 1 — menja način testiranja u odnosu na ranije aplikacije.)

| Oblast | Izbor | Svrha |
|---|---|---|
| Jezik | TypeScript | tipovi hvataju greške pre pokretanja; isti tipovi za UI, domain, data i AI alate |
| Build | Vite | pravi statičke fajlove za GitHub Pages; build se izvršava u GitHub Actions (vlasnik nema računar) |
| UI | React (ili Preact kao lakša alternativa sa istim API-jem) | komponentni UI; mobile-first |
| PWA | Service worker + manifest (npr. vite-plugin-pwa) | instalacija na početni ekran, rad bez mreže osim AI-ja |
| Šeme | Zod | jedna šema za validaciju unosa, AI izlaza, IndexedDB zapisa i JSON backup-a |
| IndexedDB | tanak omotač `idb` | Promise API nad IndexedDB; bez sopstvenog „ORM-a" |
| Testovi | Vitest, fast-check, fake-indexeddb, Playwright | vidi §13 |
| Granice slojeva | automatska provera importa u CI (npr. dependency-cruiser) | sprečava da UI ili domain direktno uvezu IndexedDB/AI |

Razlika u radu u odnosu na ranije aplikacije: nema jednog HTML fajla za preuzimanje. Vlasnik testira preko test adrese iz §3.3. Linkovi se šalju kao običan tekst sa `?v=` oznakom verzije.

---

## 5. Struktura projekta

Jedan repozitorijum za kod (npr. `mera-app/mera`), sa workflow-ima koji objavljuju u test i produkcijski Pages repozitorijum.

```
mera/
├── docs/                         # source of truth (MS §42)
│   ├── MASTER_SPECIFICATION.md
│   ├── ARCHITECTURE.md           # ovaj dokument posle odobrenja
│   ├── DATA_SOURCES.md
│   ├── NUTRITION_ENGINE.md
│   ├── AI_RULES.md
│   ├── SAFETY_RULES.md
│   ├── UI_SPEC.md
│   ├── TEST_PLAN.md
│   ├── AI_COLLABORATION.md
│   ├── CHANGELOG.md
│   ├── DECISIONS/                # jedna odluka = jedan fajl (ADR)
│   └── SNAPSHOTS/                # kontrolni snapshot-ovi (MS §40)
│
├── src/
│   ├── domain/                   # ČISTE FUNKCIJE. Ne uvozi ništa izvan domain/ i schemas/
│   │   ├── units/
│   │   ├── nutrition/
│   │   ├── energy/
│   │   ├── targets/
│   │   ├── trend/
│   │   ├── adaptation/
│   │   ├── planning/
│   │   ├── preferences/
│   │   ├── confidence/
│   │   └── versions.ts           # verzije engine-a/pravila (generisano pri build-u)
│   │
│   ├── validation/               # čisti validatori recepata, planova, unosa
│   ├── safety/                   # Safety Engine: evaluator + pravila kao podaci
│   ├── schemas/                  # Zod šeme svih entiteta i poruka
│   │
│   ├── ports/                    # INTERFEJSI prema spoljnom svetu (bez implementacije)
│   │   ├── data/                 # repozitorijumi, UnitOfWork, ReferenceDataProvider
│   │   ├── ai/                   # ModelAdapter
│   │   ├── platform/             # Clock, IdGenerator, FileExporter, SpeechInput
│   │   └── external/             # ProductLookup (barkod)
│   │
│   ├── application/              # USE CASE-ovi: jedina mesta gde se spajaju domain,
│   │                             # validation, safety i ports; ovde se sastavlja ChangeSet
│   │
│   ├── ai/                       # AI orkestracija: alati → application use case-ovi
│   │   ├── tools/
│   │   ├── prompts/              # verzionisani promptovi
│   │   └── orchestrator/
│   │
│   ├── infrastructure/           # IMPLEMENTACIJE portova
│   │   ├── data-local/           # LocalDataProvider (IndexedDB) + migracije
│   │   ├── ai-providers/         # adapter za izabranog AI provajdera
│   │   ├── reference-static/     # učitavanje referentnih podataka iz statičkih fajlova
│   │   ├── product-lookup/       # Open Food Facts klijent
│   │   └── platform/             # sat, UUID, preuzimanje fajla, govor
│   │
│   ├── backup/                   # export/import (serijalizacija je čista funkcija)
│   ├── ui/                       # React komponente, ekrani; poziva SAMO application/
│   └── composition/              # jedino mesto gde se biraju implementacije portova
│
├── reference-data/               # verzionisani referentni podaci (hrana, recepti, pravila)
│   └── <verzija>/
│
└── tests/
    ├── golden/                   # ručno provereni slučajevi proračuna
    ├── contracts/                # ugovorni testovi repozitorijuma (§12)
    ├── migrations/               # fixture za svaku verziju šeme
    ├── safety/                   # tabele scenarija
    ├── ai/                       # mock adapter + snimljeni odgovori
    └── e2e/
```

---

## 6. Slojevi, odgovornosti i granice

### 6.1 Pravilo zavisnosti

```
ui ─────────────┐
ai (orchestr.) ─┼──► application ──► domain, validation, safety, schemas
                │         │
                │         └──► ports (samo interfejsi)
                │
composition ────┴──► infrastructure ──► ports (implementira ih)
```

- `domain`, `validation`, `safety`: ne uvoze ništa osim `schemas` i sebe. Bez `Date.now()`, bez `Math.random()`, bez mreže, bez IndexedDB.
- `application`: koristi domain/validation/safety i portove. Ne zna da li je port lokalni ili serverski.
- `ui`: poziva samo `application`. Ne sme uvoziti `infrastructure`, `domain` direktno za upis, ni IndexedDB.
- `ai`: alati pozivaju `application` use case-ove, iste koje poziva UI. AI nema svoj put do podataka.
- `infrastructure`: implementira portove. Jedino mesto gde postoje IndexedDB, `fetch` ka AI/OFF, Web Speech API.
- `composition`: pri pokretanju aplikacije bira implementacije (danas lokalne, sutra serverske).

Ova pravila proverava CI automatski (§4). Kršenje granice = neuspešan build.

### 6.2 Odgovornosti modula

| Modul | Odgovornost | MS |
|---|---|---|
| `domain/units` | jedinice, konverzije, kućne mere → grami | §20, §45 |
| `domain/nutrition` | zbir nutrijenata, sirovo/kuvano preko faktora prinosa | §20, §22 |
| `domain/confidence` | nivoi pouzdanosti, propagacija kroz zbir, format prikaza (`500`, `≈500`, `480–530`) | §30 |
| `domain/energy` | BMR/TDEE prema verzionisanom skupu formula | §11 |
| `domain/targets` | dnevni ciljevi iz energije i cilja korisnika | §10 |
| `domain/trend` | prosek, 7/14/28-dnevni trend, stopa promene | §13 |
| `domain/adaptation` | predlog `NO_CHANGE / SMALL / LARGE` sa obrazloženjem | §14 |
| `domain/planning` | izbor iz kandidata + skaliranje porcija do ciljeva | §10, §25, §28 |
| `domain/preferences` | životni ciklus preferencija (trajna/privremena/dostupnost/budžet/vreme) | §26, §29 |
| `validation` | provere recepta, plana, unosa | §24 |
| `safety` | status SAFE / CAUTION / REQUIRES_CLINICAL_REVIEW / BLOCKED | §32 |
| `application` | use case-ovi (npr. `createInitialPlan`, `swapMeal`, `logWeight`, `logFood`, `proposeAdaptation`, `acceptAdaptation`, `updatePreference`, `exportBackup`, `importBackup`) | — |
| `ai/orchestrator` | razumevanje zahteva, pozivi alata, formulisanje odgovora | §6, §16, §34 |
| `backup` | export/import JSON | odluka vlasnika |

### 6.3 Obavezni tok za svaku operaciju koja menja plan, cilj ili korekciju

```
use case (application)
  1. učitaj potrebne podatke preko portova
  2. pozovi čiste domenske funkcije → predlog
  3. validation(predlog)            → ako ne prođe: greška ili ponovni pokušaj (AI popravka)
  4. safety(predlog, zastavice)     → BLOCKED: ništa se ne upisuje
  5. sastavi ChangeSet: promene + AuditEvent + SafetyEvaluation + poreklo
  6. UnitOfWork.commit(ChangeSet)   → sve ili ništa
```

Koraci 3 i 4 su u use case-u, ne u AI-ju. Zato AI ne može da ih preskoči ili „zaboravi" (MS §24, §32).

Konačna odluka korisnika (MS §14) primenjuje se samo na opcije koje nisu BLOCKED.

---

## 7. Data Layer

### 7.1 Portovi (interfejsi)

Svi metodi su asinhroni. Greške su tipizirane: `NotFound`, `Conflict`, `ValidationFailed`, `Unavailable`, `StorageFull`.

**Repozitorijumi (čitanje i jednostavni upisi po entitetu):**

| Repozitorijum | Glavne operacije (koncept) |
|---|---|
| `ProfileRepository` | `getCurrent()`, `getSnapshot(id)`, `listSnapshots()` |
| `HealthProfileRepository` | `get()` — pristup samo iz use case-ova koji ga zahtevaju |
| `GoalRepository` | `getActive()`, `listHistory()` |
| `PreferenceRepository` | `listActive(onDate)`, `listAll()` |
| `MemoryItemRepository` | `list()`, `get(id)` |
| `MeasurementRepository` | `listRange(from, to, type)`, `latest(type)` |
| `FoodLogRepository` | `listByDay(localDate)`, `listRange(from, to)` |
| `MealPlanRepository` | `getForDay(localDate)`, `listRange(from, to)` |
| `AdaptationRepository` | `listProposals(status)`, `get(id)` |
| `UserProductRepository` | `getByBarcode(gtin)`, `list()` |
| `AuditRepository` | `listForEntity(ref)`, `listRange(from, to)` — samo čitanje |
| `SettingsRepository` | podešavanja i metapodaci (npr. datum poslednjeg exporta) |
| `SecretStore` | AI ključ; odvojen od ostalih podataka |

**UnitOfWork (svi upisi koji menjaju više entiteta):**

```
commit(changeSet) → Promise<CommitResult>

ChangeSet = {
  id, createdAt,
  operations: [ { entity, op: put | softDelete | purge, record, expectedRev? } ],
  audit: AuditEvent,          // uvek prisutan
}
```

- Lokalno: jedna IndexedDB transakcija nad svim pogođenim skladištima.
- Na serveru kasnije: jedan API poziv koji server izvršava u jednoj transakciji.
- `expectedRev` (optimistička kontrola konkurentnosti): lokalno se retko aktivira (npr. dve otvorene kartice), ali je ugovor isti kao što će trebati serveru. Neslaganje → `Conflict`.
- Audit je deo istog ChangeSet-a, pa nikad ne postoji promena bez audit zapisa.

Zašto ChangeSet umesto slobodnih transakcija preko više repozitorijuma: transakcija koja se proteže preko više poziva ne može se preneti na server bez prepravke. ChangeSet je jedna poruka i radi isto lokalno i na serveru.

**ReferenceDataProvider (samo čitanje):**
`getFood(id)`, `searchFood(query, script)`, `getRecipe(id)`, `listRecipeCandidates(filter)`, `getRuleSet(version)`, `getFormulaSet(version)`, `getSourceInfo(id)`.
V1: statički verzionisani fajlovi iz `reference-data/`. Kasnije: server API.

**Ostali portovi:** `ModelAdapter`, `ProductLookup`, `Clock`, `IdGenerator`, `FileExporter`, `SpeechInput`.

### 7.2 Pravila koja važe za svaku implementaciju

1. Filtriranje, sortiranje i ograničenja opsega izvršava repozitorijum, ne UI.
2. Nijedan repozitorijum ne vraća objekat koji je vezan za IndexedDB (kursore, transakcije).
3. Svaki zapis pri čitanju prolazi Zod validaciju. Neispravan zapis se prijavljuje, ne ignoriše tiho.
4. Upis mimo UnitOfWork-a je dozvoljen samo za `SettingsRepository` i `SecretStore` (ne utiču na proračune).

---

## 8. Modeli podataka

### 8.1 Zajednička polja svakog korisničkog zapisa

| Polje | Svrha |
|---|---|
| `id` | UUID, generiše `IdGenerator` |
| `userId` | UUID lokalnog korisnika (jedan u V1); na serveru se mapira na nalog |
| `rev` | ceo broj, raste pri svakoj izmeni |
| `createdAt`, `updatedAt` | UTC, ISO 8601 |
| `deletedAt` | meko brisanje (tombstone) |
| `schemaVersion` | verzija šeme po kojoj je zapis napisan |

Zapisi vezani za dan dodatno imaju `localDate` (`YYYY-MM-DD`) i `timeZone`. „Današnji plan" se određuje po lokalnom datumu, ne po UTC-u.

Brojevi se čuvaju u osnovnim jedinicama (g, mg, µg, kcal), bez zaokruživanja. Zaokruživanje se radi samo pri prikazu, u `domain/confidence`.

### 8.2 Brisanje i pravo korisnika na brisanje (MS §8, §35)
- Uobičajeno brisanje je meko (`deletedAt`), zbog audita i buduće sinhronizacije.
- Kada korisnik izričito traži brisanje zapamćenog podatka, sadržaj se uklanja (`purge`): ostaje samo tombstone (`id`, `deletedAt`), bez sadržaja. Audit beleži da je brisanje izvršeno, ne i obrisani sadržaj.

### 8.3 Poreklo izračunatih rezultata (`Provenance`)

Svaki izračunat rezultat (energija, plan, nutritivni zbir, predlog adaptacije) nosi:

```
{ appVersion, nutritionEngine, energyFormulaSet, safetyRuleSet,
  validatorSet, promptSet?, referenceDataVersion, inputRefs[] }
```

`inputRefs` pokazuje na tačne zapise korišćene kao ulaz (npr. `ProfileSnapshot`).

### 8.4 Entiteti

**Korisnički podaci (IndexedDB, u backup-u):**

| Entitet | Ključna polja | MS |
|---|---|---|
| `ProfileSnapshot` | godine ili datum rođenja, pol, visina, aktivnost, posao, trening, broj obroka, vreme za kuvanje | §7, §28, §29 |
| `HealthProfile` | zdravstveno relevantni podaci; AI dobija samo izvedene zastavice | §7, §32 |
| `Goal` | tip, ciljna vrednost, tempo, status, `provenance` | §2, §10 |
| `Preference` | `kind`, `subjectRef` (namirnica/jelo/kategorija), `validFrom`, `validUntil`, `sourceMessageId`, `confirmedByUser` | §26, §29 |
| `MemoryItem` | tekst za prikaz, strukturirana vrednost, izvor, datum | §8, §35 |
| `Measurement` | `type` (masa, obim struka…), vrednost, `measuredAt`, `localDate`, napomena | §12 MEASURED |
| `FoodLogEntry` | stavke (`foodRef` + grami + oblik), `inputMethod`, `quantityConfidence`, `confirmedByUser`, veza na `PlannedMeal` ako postoji | §12 REPORTED, §17 |
| `MealPlan` / `PlannedMeal` | `localDate`, obrok, recept + porcija, nutritivni zbir, `provenance` | §12 PLANNED, §15 |
| `AdaptationProposal` | tip, obrazloženje, ulazi, status `PROPOSED / ACCEPTED / REJECTED / BLOCKED`, `provenance` | §14 |
| `SafetyEvaluation` | status, aktivirana pravila, verzija pravila | §32 |
| `UserProduct` | GTIN, naziv, nutritivni podaci po 100 g, `origin` (OFF / korisnik), `confidence`, datum | §18, §20 |
| `AuditEvent` | vreme, akter (korisnik/sistem/AI), use case, ulazi, verzije, pozvani alati, rezultat validacije i safety provere, rezultat | §44 |
| `AIInteractionMeta` | model, verzija prompta, alati, trajanje; bez punog teksta osim ako je potrebno | §43, §44 |

Pravilo iz MS §12 u modelu: `PlannedMeal` se nikad automatski ne pretvara u `FoodLogEntry`. Korisnik može jednim dodirom potvrditi „pojeo sam kako je planirano", i to se beleži kao eksplicitna prijava (`inputMethod: CONFIRMED_PLANNED`).

**Referentni podaci (statički, verzionisani, NISU u backup-u — backup čuva samo njihove verzije):**

| Entitet | Ključna polja |
|---|---|
| `Source` / `SourceVersion` | naziv, licenca, atribucija, verzija, datum, hash |
| `Food` / `FoodForm` | nazivi (sr-Latn, sr-Cyrl), oblik (sirovo, kuvano…) |
| `NutrientValue` | vrednost po 100 g, jedinica, izvor, `derivation`, `confidence` |
| `PortionUnit` | kućna mera → grami, izvor |
| `YieldFactor` | promena mase pri pripremi, izvor |
| `Allergen` + veze | eksplicitne veze na namirnice |
| `Recipe` / `RecipeVersion` | sastojci (ref + grami + oblik), koraci, vreme, porcije, poreklo (`CURATED` / `ADAPTED`) |
| `RuleSet`, `FormulaSet` | safety pravila i formule kao podaci, sa izvorima |

Prilagođeni recepti koje napravi korisnik ili AI (MS §23 tačka 2) su korisnički podaci (`UserRecipe`, isti oblik kao `RecipeVersion`) i idu u backup.

---

## 9. IndexedDB struktura

Baza: `mera`, verzija baze = `schemaVersion` aplikacije.

| Object store | keyPath | Indeksi |
|---|---|---|
| `meta` | `key` | — (schemaVersion, userId, installId, verzija referentnih podataka) |
| `profile_snapshots` | `id` | `createdAt` |
| `health_profile` | `id` | — |
| `goals` | `id` | `status` |
| `preferences` | `id` | `kind`, `validUntil` |
| `memory_items` | `id` | `updatedAt` |
| `measurements` | `id` | `[type, measuredAt]`, `localDate` |
| `food_log` | `id` | `localDate` |
| `meal_plans` | `id` | `localDate` |
| `planned_meals` | `id` | `localDate`, `mealPlanId` |
| `user_recipes` | `id` | `updatedAt` |
| `user_products` | `id` | `gtin` (jedinstven) |
| `adaptation_proposals` | `id` | `status`, `createdAt` |
| `safety_evaluations` | `id` | `subjectRef` |
| `audit_events` | `id` | `at`, `entityRef` |
| `ai_interactions` | `id` | `at` |
| `settings` | `key` | — |

Posebna baza: `mera_secrets` sa jednim skladištem za AI ključ. Razlog: nikad se ne izvozi, nikad ne ulazi u ChangeSet, ne loguje se.

Posebna baza: `mera_safety_snapshots` — automatska kopija podataka pre migracije ili importa (§10.3, §11.3). Čuvaju se poslednje 2–3 kopije.

Zahtev `navigator.storage.persist()` šalje se pri prvom stvarnom čuvanju korisničkih podataka (npr. posle prvog unosa telesne mase), kao posledica korisnikove akcije — ne pri otvaranju aplikacije. Rezultat se čuva u `settings` i prikazuje u podešavanjima. *(Izmenjeno 2026-09-23, odluka vlasnika — docs/DECISIONS/0002.)*
**[POTVRĐENO]** (MDN): podrazumevano je skladištenje „best-effort"; sa trajnim skladištem podaci se brišu samo kada korisnik to izabere u podešavanjima pregledača, a pregledač ne mora odobriti zahtev. Zato trajno skladište ne zamenjuje zaseban origin ni backup, već ih dopunjuje.

---

## 10. Verzionisanje i migracije

### 10.1 Šta se verzioniše (MS §43)

| Stvar | Gde | Kako |
|---|---|---|
| Aplikacija | build | `appVersion` = verzija + git commit |
| Šema korisničkih podataka | `meta.schemaVersion` | ceo broj, raste pri promeni strukture |
| Nutrition engine, formule, safety pravila, validatori, promptovi | `domain/versions.ts`, `reference-data/` | semantička verzija; promena = zapis u CHANGELOG |
| Referentni podaci | `reference-data/<verzija>/` | nepromenljivi po verziji |
| Backup format | zaglavlje fajla | `formatVersion` |

### 10.2 Migracije šeme
- Svaka migracija je numerisan korak `N → N+1` sa dva dela:
  - strukturni deo (nova skladišta i indeksi) — izvršava se u IndexedDB `upgradeneeded` događaju;
  - transformacija podataka — **čista funkcija** `migrateRecord(record) → record`, testabilna bez IndexedDB.
- Iste transformacione funkcije se koriste za migraciju starog JSON backup-a pri importu.
- Migracije se nikad ne menjaju posle objave. Ispravka greške = nova migracija.
- Na serveru kasnije: iste transformacije služe za uvoz, a šema baze ima svoje SQL migracije.

### 10.3 Zaštita pri migraciji
1. Aplikacija otvori bazu bez podizanja verzije i utvrdi trenutnu `schemaVersion`.
2. Ako je potrebna migracija: kompletna kopija podataka ide u `mera_safety_snapshots`.
3. Tek tada se baza otvara sa novom verzijom i izvršava migracija.
4. Posle migracije: validacija svih zapisa Zod šemom. Ako ne prođe → vraćanje iz snapshot-a i jasna poruka korisniku.
5. Rukovanje drugom otvorenom karticom (`blocked` / `versionchange` događaji): stara kartica se zatvara uz poruku.

### 10.4 Referentni podaci i stari rezultati
Nova verzija referentnih podataka ne menja stare rezultate. Stari plan čuva svoj `referenceDataVersion`. Ponovni proračun je nova operacija sa novim poreklom.

---

## 11. JSON export/import i backup

### 11.1 Format fajla

```
mera-backup-YYYY-MM-DD.json
{
  "format": "mera-backup",
  "formatVersion": 1,
  "schemaVersion": N,
  "appVersion": "...",
  "exportedAt": "UTC ISO",
  "userId": "...",
  "referenceDataVersion": "...",
  "stores": { "<ime skladišta>": [ ...zapisi ] },
  "checksum": "SHA-256 nad sadržajem 'stores'"
}
```

- Sadrži sve korisničke podatke, uključujući tombstone zapise.
- Ne sadrži: AI ključ, referentne podatke, `mera_safety_snapshots`.
- Serijalizacija, provera i deserijalizacija su čiste funkcije u `backup/`.

### 11.2 Export
- Dugme u podešavanjima → fajl se preuzima na telefon.
- `settings.lastExportAt` se ažurira tek posle uspešnog kreiranja fajla.
- Mehanizam preuzimanja na Android Chrome-u (preuzimanje Blob-a ili deljenje fajla) — [PROVERITI].

### 11.3 Import
1. Izbor fajla.
2. Provera: `format`, checksum, Zod validacija svih zapisa.
3. Ako je `schemaVersion` stariji → iste migracione funkcije kao u §10.2. Ako je noviji od aplikacije → odbijanje uz poruku.
4. Pregled pre potvrde: datum backup-a, broj merenja, broj dana sa planom i slično.
5. Automatska kopija trenutnog stanja u `mera_safety_snapshots`.
6. V1: import **zamenjuje** sve korisničke podatke. Spajanje (merge) se ne radi u V1, jer je to problem sinhronizacije koji pripada serverskoj fazi.
7. Audit događaj o importu.

### 11.4 Nedeljni podsetnik
- Pri otvaranju aplikacije: ako je od `lastExportAt` prošlo 7 ili više dana, ili export nikad nije rađen, prikazuje se nenametljiva traka na glavnom ekranu sa dugmetom „Sačuvaj rezervnu kopiju".
- Bez push notifikacija (zahtevale bi dodatnu infrastrukturu koju MS ne traži za ovu fazu).

---

## 12. Prelazak LocalDataProvider → ServerDataProvider

### 12.1 Šta se menja

| Deo | Lokalno (V1) | Server (kasnije) |
|---|---|---|
| Repozitorijumi | IndexedDB | HTTP API |
| UnitOfWork | jedna IndexedDB transakcija | jedan API poziv, transakcija u PostgreSQL |
| ReferenceDataProvider | statički fajlovi | API ili isti statički fajlovi |
| SecretStore / AI | ključ na telefonu, direktan poziv provajdera | proxy na serveru, ključ se ne nalazi na klijentu |
| `composition` | bira lokalne implementacije | bira serverske |
| Nalog | lokalni `userId` | prijava; lokalni `userId` se povezuje sa nalogom |

### 12.2 Šta se ne menja
`domain`, `validation`, `safety`, `schemas`, `application`, `ai/orchestrator`, `ui`.

### 12.3 Migracija podataka
Korisnik napravi JSON export → server ga prima kroz isti import kod (čiste funkcije iz `backup/` i migracija). Ne pravi se poseban alat.

### 12.4 Garancija: ugovorni testovi
Svaki port ima skup testova koji opisuju ugovor (npr. „`listRange` vraća merenja sortirana po vremenu", „`commit` sa pogrešnim `expectedRev` vraća `Conflict` i ne menja ništa"). Isti skup se danas pokreće nad LocalDataProvider-om, a kasnije nad ServerDataProvider-om. Kada serverska implementacija prođe iste testove, zamena je bezbedna.

### 12.5 Šta ostaje novi posao pri prelasku
Prijava i nalozi, autorizacija na serveru, rad na više uređaja i sinhronizacija, serverski backup. Nijedna odluka u V1 ne blokira te stvari.

---

## 13. Čiste/determinističke funkcije

Implementiraju se kao čiste funkcije (isti ulaz → isti izlaz, bez I/O, vreme i ID-jevi dolaze kao argumenti):

1. Konverzije jedinica i kućnih mera u grame.
2. Nutritivni zbir recepta, obroka i dana.
3. Sirovo ↔ kuvano preko faktora prinosa.
4. Propagacija pouzdanosti i format prikaza (`500`, `≈500`, `480–530`).
5. BMR/TDEE prema verzionisanom skupu formula.
6. Dnevni ciljevi (energija, proteini, rasponi ostalih makronutrijenata).
7. Analiza trenda mase (prosek, 7/14/28 dana, stopa promene, rukovanje nedostajućim danima i ekstremima).
8. Procena stvarnog utroška iz trenda i prijavljenog unosa, sa intervalom nesigurnosti.
9. Predlog adaptacije.
10. Izbor i skaliranje porcija u planu.
11. Uticaj zamene obroka na ostatak dana.
12. Životni ciklus preferencija (šta važi na dati dan).
13. Svi validatori.
14. Safety evaluator.
15. Migracione transformacije zapisa.
16. Serijalizacija, provera i deserijalizacija backup-a.
17. Sastavljanje ChangeSet-a i audit događaja.

Nijedna numerička granica (safety pragovi, tolerancije, koeficijenti) nije u kodu kao konstanta — sve dolazi iz verzionisanih `RuleSet`/`FormulaSet` podataka sa navedenim izvorom. Vrednosti odobrava vlasnik (MS §39); to je deo izrade `SAFETY_RULES.md` i `NUTRITION_ENGINE.md` pre implementacije tih modula.

---

## 14. AI sloj u V1

- `ModelAdapter` je port; implementacija za izabranog provajdera je u `infrastructure/ai-providers` (MS §47).
- Ključ se čita iz `SecretStore` samo u adapteru. UI i orkestrator ga ne vide.
- **Ovo je rešenje samo za V1 (lična/testna faza).** U serverskoj/komercijalnoj verziji AI ključ se seli na server/proxy i ne postoji na klijentu (§12.1). *(Dopunjeno 2026-09-23, odluka vlasnika — docs/DECISIONS/0002.)*
- Poziv ide direktno iz pregledača ka provajderu. Da li provajder to dozvoljava (CORS) i pod kojim uslovima — [PROVERITI] za izabranog provajdera.
- Alati (MS §34) pozivaju `application` use case-ove. Pisanje ide samo kroz use case → validacija → safety → ChangeSet.
- Strukturirani izlazi AI-ja se validiraju Zod šemama pre bilo kakve upotrebe. Nevalidan izlaz → ograničen broj ponovnih pokušaja → poruka korisniku. Neprovereni rezultat se nikad ne prikazuje (MS §24).
- AI dobija minimalan kontekst: današnji plan, relevantne preferencije, poslednje poruke, izvedene zdravstvene zastavice. Nikad ceo `HealthProfile`.
- Bez mreže ili bez AI-ja rade: prikaz plana, zamena klikom, unos mase i trend, export/import.

---

## 15. UI sloj u V1

- Mobile-first, projektovano za Android Chrome; stvarni prikaz na telefonu vlasnika ima prednost nad emulacijom.
- Glavni ekran „DANAS" prema MS §15, sa brojem obroka koji je izabrao korisnik (MS §28).
- Dugme za glasovni/tekstualni razgovor na dnu, centralno.
- Detalji i „Zašto?" otvaraju se klikom.
- Standard vlasnika za sve aplikacije: dijalog za potvrdu izlaza na dugme/gest „nazad", u vizuelnom stilu aplikacije, planiran od početka.
- UI ne računa ništa što ima veze sa ishranom. Prikazuje ono što vrati `application`.

---

## 16. Test strategija za V1

| Nivo | Šta | Alat | Gde |
|---|---|---|---|
| Zlatni slučajevi | energija, nutritivni zbir, sirovo/kuvano, trend; očekivani rezultati izračunati nezavisno i ručno provereni | Vitest | CI |
| Property-based | konverzije tamo-nazad, zbir = zbir delova, linearno skaliranje porcija, monotonost trenda | fast-check | CI |
| Validacija | svaki validator: ispravan i neispravan slučaj po svakoj proveri | Vitest | CI |
| Safety | tabela scenarija ulaz → očekivani status, uključujući pokušaje preformulisanja zahteva | Vitest | CI |
| Ugovori portova | isti skup nad LocalDataProvider-om (sada) i ServerDataProvider-om (kasnije) | Vitest + fake-indexeddb | CI |
| Migracije | fixture podataka za svaku verziju šeme → migracija → Zod validacija | Vitest | CI |
| Backup | export → import → identični podaci; oštećen fajl; noviji `schemaVersion`; pogrešan checksum | Vitest | CI |
| Use case-ovi | tok sa mock portovima, uključujući BLOCKED (ništa se ne upisuje) | Vitest | CI |
| AI orkestracija | mock adapter sa snimljenim odgovorima; nevalidan AI izlaz; pokušaj upisa izmišljene vrednosti | Vitest | CI |
| AI evaluacije i red-team (MS §46) | pravi model, srpski jezik, lokalna jela, klasifikacija preferencija | poseban skup | ručno, pre promene modela/prompta |
| Granice slojeva | zabranjeni importi | dependency-cruiser | CI |
| E2E | glavni tokovi u emulaciji mobilnog uređaja | Playwright | CI |
| Stvarni uređaj | svaka verzija pre produkcije, na telefonu vlasnika | test origin | ručno |

Pravilo: build koji ne prolazi testove se ne objavljuje ni na test adresu.

---

## 17. Redosled implementacije V1 (posle odobrenja)

1. Repozitorijum, CI, test i produkcijska organizacija, provera granica slojeva, prazan PWA koji se instalira sa test adrese.
2. `schemas`, portovi, LocalDataProvider, ugovorni testovi, migracioni okvir, export/import, nedeljni podsetnik. Podaci su zaštićeni pre nego što postoje.
3. Unos mase + trend (prvi koristan deo; počinje prikupljanje podataka).
4. Referentni podaci (početni kurirani skup) + nutrition engine + testovi.
5. Energy engine + Safety Engine (posle odobrenja `NUTRITION_ENGINE.md` i `SAFETY_RULES.md`).
6. Kurirani recepti + validator + planer + glavni ekran + zamena klikom.
7. AI sloj: tekst, preferencije, memorija.
8. Unos hrane tekstom/glasom, barkod.
9. Adaptacija.

---

## USVOJENO

1. V1 nema obavezan server; lično testiranje na telefonu vlasnika.
2. Modularna arhitektura sa jasnom granicom UI / domain / AI / validation+safety / data; ostali delovi ne zavise od toga da li su podaci lokalni ili na serveru.
3. Kasniji prelazak na server i PostgreSQL kroz zamenu implementacija portova (LocalDataProvider → ServerDataProvider).
4. AI API ključ se u V1 čuva lokalno na telefonu.
5. Zaseban origin za Meru.
6. Backup: ručni JSON export/import uz nedeljni podsetnik.
7. Automatski cloud backup nije deo V1.
8. IndexedDB (ne localStorage) za korisničke podatke.
9. Asinhroni portovi sa tipiziranim greškama; UUID; `userId`, `rev`, `createdAt/updatedAt` (UTC), meko brisanje i `schemaVersion` u svakom zapisu.
10. Verzionisanje šeme i migracije od prvog dana.
11. Referentni podaci odvojeni od korisničkih, verzionisani, samo za čitanje.
12. Svaki proračun beleži verzije koje su ga proizvele.

---

## [PROVERITI]

Pre implementacije odgovarajućeg dela:

1. Direktan unos `github.io` u fajlu Public Suffix List na publicsuffix.org (potvrda iz sekundarnog izvora već postoji).
2. Da li je ime organizacije `mera-app` (i `mera-app-test`) dostupno; da li besplatni plan organizacije pokriva javne repozitorijume sa GitHub Pages i GitHub Actions.
3. GitHub Pages: tačan postupak objave iz Actions workflow-a u organizacijski `<org>.github.io` repozitorijum iz drugog repozitorijuma (ili build u samom Pages repozitorijumu); ograničenja veličine i broja objava.
4. Ponašanje `navigator.storage.persist()` u Chrome-u na telefonu vlasnika (da li se odobrava za instaliranu PWA).
5. IndexedDB: ponašanje `upgradeneeded`, `blocked` i `versionchange` u Chrome-u; ograničenja u trajanju transakcije kada se unutar nje čeka asinhroni rad.
6. Licence i održavanost biblioteka: React (ili Preact), Vite, vite-plugin-pwa/Workbox, Zod, `idb`, Vitest, fast-check, fake-indexeddb (i njena usklađenost sa pravim IndexedDB-om), Playwright, dependency-cruiser.
7. Preuzimanje generisanog fajla i izbor fajla za import u Android Chrome-u, i u instaliranoj PWA (preuzimanje Blob-a naspram Web Share API sa fajlovima).
8. `crypto.randomUUID()` i Web Crypto SHA-256 dostupnost u ciljnom Chrome-u (zahtevaju bezbedan kontekst — HTTPS).
9. Izabrani AI provajder: da li dozvoljava pozive direktno iz pregledača (CORS i eventualni poseban zaglavlje/uslov), uslovi korišćenja, čuvanje podataka, cene, strukturirani izlaz i alati.
10. Web Speech API (prepoznavanje govora) u Chrome-u na Androidu: podrška za srpski, gde se obrađuje zvuk, rad u instaliranoj PWA.
11. Open Food Facts API: CORS iz pregledača, uslovi korišćenja, zahtev za identifikacijom aplikacije, licenca baze (ODbL — posledice za kasniju komercijalnu fazu), licenca slika.
12. Barcode Detection API u Chrome-u na telefonu vlasnika; rezervna biblioteka i njena licenca.
13. Licence izvora nutritivnih podataka pre izbora primarnog izvora (srpska baza sastava namirnica, USDA FoodData Central, evropske baze) — iz v0.1, i dalje otvoreno.

---

## ZA ODOBRENJE

Tri nove arhitektonske odluke zahtevaju odluku vlasnika:

**1. Tehnološki stek sa build korakom (§4).**
TypeScript + Vite + React, build u GitHub Actions. Posledica: umesto preuzimanja jednog HTML fajla, vlasnik testira preko test adrese. Preporuka: DA — veličina i kritičnost proračuna u Meri opravdavaju tipove i automatske testove, koji bez build koraka nisu praktični.

**2. Zaseban origin i za test verziju (§3.3).**
Druga organizacija `mera-app-test`, da neispravna test verzija nikad ne dodirne stvarne podatke. Podaci se u test prenose exportom/importom. Preporuka: DA.

**3. Obuhvat V1 (§2).**
Šta ulazi u V1, a šta ima samo predviđeno mesto u arhitekturi (OCR, AI generisani recepti, cene/otpad, drugi jezici). Preporuka: prihvatiti tabelu iz §2.

Odluke koje ne blokiraju odobrenje arhitekture, ali moraju biti donete pre odgovarajuće faze:
- izbor AI provajdera — pre koraka 7 iz §17;
- primarni izvor nutritivnih podataka — posle provere licenci, pre koraka 4;
- vrednosti u `SAFETY_RULES.md` i `NUTRITION_ENGINE.md` — pre koraka 5.

Ako se tri stavke iznad odobre, arhitektura je spremna za odobrenje i početak implementacije prema §17.

---

*Kraj dokumenta. Namenjen odobrenju vlasnika i nezavisnoj reviziji (MS §41). Ne menja MASTER_SPECIFICATION.*
