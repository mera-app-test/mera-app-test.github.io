# KNOWLEDGE_BASE — baza znanja Mere

**Status:** mehanizam implementiran (0.5.0, DECISIONS/0012); slojevi provere (0.5.1, DECISIONS/0013). Sadržaj: verzija 0.2.0 — sve stavke su PREDLOG.
**Fajl:** `reference-data/knowledge/knowledge-<verzija>.json` · **Šema:** `src/schemas/knowledge.ts` · **Kod:** `src/domain/knowledge/`

## Zašto ovako
Mera ima dve baze: znanje (telesna masa, ishrana, medicina) i recepte. AI se ne obučava na njima, već se veže za njih (DECISIONS/0011): pre odgovora dobija tačno one stavke koje se odnose na pitanje, odgovara samo iz njih, a brojeve računa evaluator. Upitnik se ne piše ručno — izvodi se iz baze.

## Šta je u bazi
**Činjenice (`facts`)** — sve što sistem zna o korisniku.
- Pitanje (`question`): tekst, nivo (osnovni / detaljni / napredni), uslov kada se postavlja (`askWhen`, npr. trudnoća samo ženama).
- Izvedena vrednost (`question: null`): računa je neka stavka (npr. dnevna potrošnja).

**Stavke (`entries`)** — jedno pravilo po stavci:
- `id` (npr. E-001), oblast, naslov, **tvrdnja jasnim jezikom** (to AI sme da kaže i to „Zašto?" prikazuje), oznake za pretragu;
- vrsta: `calculation` (računa jednu vrednost), `safety` (bezbednosni status MS §32), `explanation` (objašnjenje);
- `inputs` (koje činjenice koristi), `appliesWhen` (kada važi), proračun kao struktura podataka (`expr` — sabiranje, množenje, vrednost po izboru, min/max; bez izvršnog koda);
- izvori: nivo 1–3 (AI_RULES §1), tačan navod, **da li je pročitan original**, šta tačno potkrepljuje;
- status: PREDLOG / ODOBRENO / POVUČENO; verzija; ko je i kada odobrio.

## Automatske provere (svaki build — `validateKnowledge`)
- Pitanje koje ne koristi nijedna stavka **ne sme da postoji** (nema pitanja tipa „šta te motivisalo").
- ODOBRENO traži bar jedan izvor nivoa 1 ili 2 **proveren u originalu** i zapis o odobrenju.
- Stavka ne sme da koristi činjenicu koju nije navela; bez nepoznatih činjenica; bez kružnih zavisnosti; svaka izvedena vrednost ima stavku koja je računa.
- Neispravna baza zaustavlja pokretanje aplikacije i build.

## Kako se koristi
- **Proračun** (`evaluate`): iz odgovora korisnika računa izvedene vrednosti redom zavisnosti; uz svaku vrednost beleži stavku i verziju (MS §44). Bezbednosna pravila koja ne mogu da se provere jer fali odgovor ostaju „neodlučena" — plan se tada ne pravi.
- **Upitnik** (`deriveQuestions`): za izabrani nivo daje samo pitanja koja koristi bar jedna važeća stavka; uz svako pitanje piše koje ga stavke koriste.
- **AI** (korak 5 novog redosleda): alati `pretraga baze`, `stavka po ID`, `proračun` — isti use case-ovi kao za UI. AI citira ID stavki; odgovor bez stavke = „ne znam".
- Aplikacija koristi **samo ODOBRENO**. PREDLOG se vidi samo na test ekranu „Baza znanja" (pregled i probni upitnik).

## Kako se dodaje ili menja pravilo
1. Stavka se upisuje kao PREDLOG sa izvorima (original / navod).
2. Vlasnik odobrava (DECISIONS/0009 — ono što menja ishod ili bezbednost).
3. Status ODOBRENO + zapis o odobrenju; nova verzija fajla. Stari rezultati zadržavaju verziju po kojoj su nastali (MS §43).

## Slojevi provere (DECISIONS/0013)
Svaka stavka nosi `review`: sloj 2 (kriterijumi primenjeni: smernica ili dva izvora nivoa 1–2 pročitana u originalu), sloj 3 (nezavisna AI provera), sloj 4 (nutricionista-dijetetičar). Build odbija ODOBRENO bez slojeva 2 i 3 i proverava da „dva izvora" zaista postoje.
Paket za nezavisnu proveru: `node scripts/kb-review-package.mjs reference-data/knowledge/knowledge-<verzija>.json > docs/REVIZIJA/kb-<verzija>.md` — sadrži uputstvo za recenzenta i format odgovora.
