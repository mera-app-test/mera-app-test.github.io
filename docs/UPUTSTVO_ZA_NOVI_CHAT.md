# Uputstvo za nastavak rada na Meri u novom chat-u

Za razvojnog AI agenta. Vlasnik projekta: Zoran. Radi na telefonu (mobilni Chrome); nije programer — odlučuje o proizvodu i izgledu.

## 1. Pre bilo kakvog rada
1. Kloniraj: `git clone https://github.com/mera-app-test/mera-app-test.github.io mera`
2. Pročitaj redom:
   - `docs/UPUTSTVO_ZA_NOVI_CHAT.md` (ovaj fajl)
   - `docs/SNAPSHOTS/2026-09-24-baza-znanja.md` — gde smo stali
   - `/mnt/project/MASTER_SPECIFICATION` (knowledge fajl projekta) i `docs/ARCHITECTURE.md` (§17 zamenjen redosledom iz DECISIONS/0012)
   - **sve u `docs/DECISIONS/`**, obavezno 0005, 0009–0015
   - `docs/AI_RULES.md`, `docs/KNOWLEDGE_BASE.md`, `docs/NUTRITION_ENGINE.md`, `docs/DATA_SOURCES.md`, `docs/OTVORENA_PITANJA.md`, `docs/CHANGELOG.md`
3. `npm ci` pa `npm run check` — mora proći pre izmena.

## 2. Pravila rada (sažetak odluka — odluke imaju prednost)
- **Brutalno jednostavno za korisnika**, jedan cilj (masa / sastav tela). Nema pitanja koja ne koristi nijedno pravilo baze znanja (build to proverava). Bez kvizova, motivacionih pitanja, „igraonice". (0009, 0012)
- **Ništa se ne izmišlja.** Brojevi iz determinističkog koda i verzionisanih podataka; AI nije izvor istine. (MS §6, 0011)
- **Izvori** (0010, AI_RULES): zvanične ustanove i propisi → smernice i sistematski pregledi → pojedinačne recenzirane studije. Isključeno: forumi, blogovi, kalkulatori, Wikipedia. Uz svaki izvor: original pročitan ili samo navod.
- **Praktična naučna utemeljenost** (0015): za uobičajenu preporuku dovoljan jedan kredibilan izvor ako nema značajnog neslaganja; strože samo kod stvarnog rizika. Ne zaustavljati razvoj zbog zanemarljivih nedoumica — evidentirati u `docs/OTVORENA_PITANJA.md` i nastaviti.
- **Ko šta odlučuje** (0009, 0013): vlasnik postavlja kriterijume i odlučuje o pitanjima proizvoda i izgledu. **Ne traži od njega da proverava stručni sadržaj.** Sitne izbore agent rešava sam, zapiše i kratko javi.
- **Slojevi provere** (0013, 0015): kriterijumi → agent (izvori u originalu) → nezavisni AI (ne blokira) → nutricionista-dijetetičar (obavezno pre drugih korisnika).
- **AI u aplikaciji** ne pretražuje internet i ne obučava se; vezan je za bazu znanja i odgovara samo iz nje. (0010, 0011)
- **UI** (0005, 0013): agent pravi i objavljuje na test, vlasnik pregleda na telefonu i odlučuje. Mobile-first, velike kontrole, srpski latinica.
- Značajne arhitektonske izmene: prvo predlog i obrazloženje. Male izmene: direktno.
- Izveštaj: prvo zaključak, kratko, bez žargona; razlikuj urađeno / delimično / nije urađeno / nije testirano.

## 3. Komunikacija sa vlasnikom
- Srpski, latinica, direktno i iskreno; bez ulepšavanja.
- Linkove slati kao **običan tekst sa verzijom na kraju**, npr. `https://mera-app-test.github.io/?v=055` (zbog keša u Chrome-u).
- Kod grešaka: prvo proveri svoj kod; ne izmišljaj spoljne uzroke; njegove snimke ekrana tretiraj kao činjenicu.
- Kad nešto treba da iskopira (npr. za drugi AI), daj mu dugme u aplikaciji ili tekst koji se lako kopira.

## 4. Objava (agent radi sam)
- Token: knowledge fajl projekta `/mnt/project/Token_git_kup`. Nikad ga ne ispisuj u odgovoru ni u logu.
  ```
  TOKEN=$(tr -d ' \n\r' < /mnt/project/Token_git_kup)
  git -c user.name="Mera razvojni agent" -c user.email="agent@mera.invalid" commit -m "…"
  timeout 60 git push -q "https://x-access-token:${TOKEN}@github.com/mera-app-test/mera-app-test.github.io.git" main 2>&1 | sed "s/${TOKEN}/***/g"
  ```
- Push na `main` pokreće CI (provera + objava na test). Status: GitHub API `actions/runs?branch=main&per_page=1` sa tokenom. **Petlja čekanja mora imati ograničen broj pokušaja** (jedna komanda sme najviše 300 s).
- Pre objave: podigni verziju u `package.json` i `package-lock.json` (prva dva pojavljivanja), upiši `docs/CHANGELOG.md`, `timeout 200 npm run check`, `MERA_ENV=prod npx vite build && node scripts/assert-prod-bundle.mjs`.
- Test adresa `mera-app-test.github.io` **nije dostupna iz okruženja agenta**; provera izgleda: `MERA_ENV=test npx vite build`, pa u ISTOJ komandi pokreni `npx vite preview --port 41xx &` i Playwright (Python) snimak 390×844. Ne koristi `pkill -f "vite preview"` (ubija sopstvenu komandu).

## 5. Gde je šta
- `reference-data/foods/foods-1.1.0.json` — namirnice (uvoz: `scripts/fdc/`, workflow `uvoz-fdc.yml`, grana `uvoz/zahtev`, rezultat na `uvoz/rezultat`).
- `reference-data/knowledge/knowledge-0.4.0.json` — baza znanja; šema `src/schemas/knowledge.ts`; logika `src/domain/knowledge/`; servis `src/application/knowledge/`.
- Nova verzija baze: novi fajl `knowledge-X.json`, stari `git rm`, zameni putanje u `src`/`tests`, regeneriši paket: `node scripts/kb-review-package.mjs reference-data/knowledge/knowledge-X.json > docs/REVIZIJA/kb-X.md` i putanju u `src/ui/screens/KnowledgeScreen.tsx`.
- Formule i pravila prikaza: `reference-data/formulas/`.

## 6. Sledeći korak (DECISIONS/0012, tačka 2)
**Upitnik osnovnog nivoa u pravom toku + dnevni cilj na ekranu Danas.**
- Prvo pokretanje: pitanja iz `knowledge.questions("osnovni", …, "odobreno")`, jedno ekran-po-ekran ili kratka forma — predloži izgled, objavi na test, vlasnik odlučuje.
- Odgovori se čuvaju lokalno (postojeći sloj podataka), mogu da se izmene i obrišu (MS §8).
- Na ekranu Danas: dnevni cilj u kcal („≈", MS §30), sa „Zašto?" (stavke i verzije iz `evaluate().trace`).
- Bezbednost: BLOCKED / REQUIRES_CLINICAL_REVIEW → nema plana, jasna poruka iz baze; neodlučena bezbednosna pravila → nema plana dok se ne odgovori.
- Masa iz upitnika i unosi mase (koraci 2–3) treba da budu isti podatak — utvrdi u postojećem kodu kako.
- Posle toga: razgovor o hrani i receptima (vlasnik želi poseban razgovor), pa planer.
