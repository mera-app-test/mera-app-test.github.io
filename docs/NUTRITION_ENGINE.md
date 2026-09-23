# NUTRITION_ENGINE — metode i parametri proračuna

**Status:** deo T ODOBREN (DECISIONS/0007); delovi N, P i K ODOBRENI (DECISIONS/0008); vrednosti namirnica 1.1.0 odobrene (DECISIONS/0009); deo E (energija i cilj) je PREDLOG; energetski deo (korak 5) još ne postoji. Nijedna vrednost nije ugrađena u kod pre odobrenja vlasnika (DECISIONS/0005, MS §39).
Posle odobrenja vrednosti idu u verzionisan `FormulaSet` (ARCHITECTURE §13), ne kao konstante u kodu.

Oznake: **[IZVOR]** — tvrdnja potkrepljena navedenim izvorom · **[PROCENA]** — statistička ili praktična odluka bez naučnog izvora za tačan broj; obrazložena, ali to je izbor, ne činjenica.

---

## Deo T — Trend telesne mase (MS §13; ARCHITECTURE §13 tačka 7)

Status: **ODOBRENO** 2026-09-23 (DECISIONS/0007). Parametri: `reference-data/formulas/trend-1.0.0.json`; kod: `src/domain/trend/`.

### Zašto se ne gleda jedno merenje
- Telesna masa ima nedeljni obrazac: raste preko vikenda i opada radnim danima. **[IZVOR]** Turicchi J. i sar. (2020), *Weekly, seasonal and holiday body weight fluctuation patterns among individuals engaged in a European multi-centre behavioural weight loss maintenance intervention*, PLOS ONE 15(4): e0232152, doi:10.1371/journal.pone.0232152 (otvoren pristup, PMC7192384). Isti obrazac ranije: Orsama A-L. i sar. (2014), *Weight rhythms: weight increases during weekends and decreases during weekdays*, Obesity Facts 7(1):36–47.
- Posledica za Meru: poređenje ponedeljka sa petkom može pokazati „promenu" koja je samo deo nedeljnog ciklusa. Zato su osnovne jedinice poređenja prozori od celih nedelja (7, 14, 28 dana).

### T1. Dnevna vrednost
Odobreno: ako u jednom danu postoji više merenja, dnevna vrednost je **prvo merenje tog dana** (po vremenu merenja).
**Dopuna (odobrena):** ako je bar jedno merenje tog dana uneto naknadno (vreme merenja nije poznato), dnevna vrednost je **prosek svih merenja tog dana**, jer se ne zna koje je bilo prvo.
Obrazloženje **[PROCENA]**: uporediva merenja iz sličnih uslova su korisnija od proseka merenja iz različitih delova dana.
Alternativa: prosek svih merenja u danu (jednostavniji, ali meša jutarnje i večernje vrednosti).

### T2. 7-dnevni prosek
Predlog: aritmetička sredina dnevnih vrednosti u poslednjih 7 kalendarskih dana (uključujući danas).
Prikazuje se samo ako postoje **najmanje 4** dnevne vrednosti u tom prozoru.
- Prozor od 7 dana obuhvata ceo nedeljni ciklus **[IZVOR: Turicchi 2020]**.
- Broj 4 (većina dana) je **[PROCENA]**: sa manje merenja jedan dan (npr. posle vikenda) nosi preveliku težinu.

### T3. 14- i 28-dnevni trend
Predlog: nagib prave linearne regresije (metod najmanjih kvadrata) kroz dnevne vrednosti u prozoru, izražen kao **kg nedeljno**.
Uslovi da bi se trend prikazao **[PROCENA]**:

| Prozor | Najmanje dnevnih vrednosti | Pokrivenost krajeva prozora |
|---|---|---|
| 14 dana | 8 | bar jedno merenje u prvih 4 i u poslednjih 4 dana |
| 28 dana | 14 | bar jedno merenje u prvih 7 i u poslednjih 7 dana |

Uslov krajeva sprečava da se nagib računa iz merenja zbijenih u jedan deo prozora.
Nedostajući dani se ne popunjavaju izmišljenim vrednostima; regresija koristi samo stvarne dane.
Alternativa: eksponencijalno ponderisan prosek. Nije predložen jer MS §13 izričito navodi 7-dnevni prosek i 14/28-dnevne trendove, a nagib u kg nedeljno je lakše objasniti u „Zašto?".

### T4. Stopa promene
Predlog: 28-dnevni nagib (kg nedeljno) i isti nagib kao procenat 7-dnevnog proseka mase.
Procenat je potreban kasnije za Safety pravila (npr. prebrz gubitak) — **pragove za to predlaže SAFETY_RULES.md, ne ovaj dokument**.

### T5. Provera unetog broja
Trenutno (implementirano): proverava se samo oblik broja (zarez ili tačka, najviše 2 decimale, veće od nule).
Predlog: ako je uneta vrednost **manja od 30 kg ili veća od 300 kg**, Mera pita „Da li je X kg tačno?" i čuva tek posle potvrde. Ne blokira.
Obrazloženje **[PROCENA]**: cilj je hvatanje greške u kucanju (npr. 924 umesto 92,4), ne medicinska granica; potvrda umesto zabrane da se ne odbije stvarna vrednost.

### T6. Ekstremne vrednosti
Predlog za V1: **nema automatskog izbacivanja** merenja iz trenda. Pogrešan unos korisnik briše (već radi).
Obrazloženje **[PROCENA]**: automatsko izbacivanje može sakriti stvarnu promenu; za jednog korisnika ručno brisanje je dovoljno i proverljivo. Poznato ograničenje: linearna regresija je osetljiva na jednu jako pogrešnu vrednost — zato T5.

### T7. Prikaz
Trend je procena, pa se prikazuje sa „≈" (MS §30), npr. „≈ −0,4 kg nedeljno (28 dana)". Kada uslovi iz T2/T3 nisu ispunjeni: „Za trend je potrebno još N merenja" umesto broja.

### Odobreno (2026-09-23)
1. T1 — prvo merenje u danu; za dan sa naknadnim unosom prosek dana.
2. T2 — 7 dana, najmanje 4 vrednosti.
3. T3 — linearna regresija; 14 dana/8 vrednosti, 28 dana/14 vrednosti, uslov krajeva.
4. T4 — kg nedeljno + procenat.
5. T5 — potvrda ispod 30 i iznad 300 kg.
6. T6 — bez automatskog izbacivanja u V1.

---

## Deo N — Namirnice i nutrijenti (MS §20, §22) — ODOBRENO (DECISIONS/0008)

Kod: `src/domain/nutrition`, `src/domain/confidence`; podaci: `reference-data/foods/foods-1.0.0.json` (status CEKA_ODOBRENJE); izveštaj: `docs/UVOZ/izvestaj-foods-1.0.0.md`.

### N1. Koje skupove iz FoodData Central (FDC) koristimo
**[IZVOR]** FDC ima pet tipova podataka; za generičke namirnice relevantna su dva (FDC Foundation Foods Documentation, fdc.nal.usda.gov/Foundation_Foods_Documentation):
- **Foundation Foods** — analitički podaci sa metapodacima o uzorcima; aktivno se dopunjuje (na dan provere stranica za preuzimanje navodi izdanje 12/2025). Uglavnom sirove namirnice; novije namirnice nemaju sve nutrijente.
- **SR Legacy** — poslednje izdanje 04/2018, više se ne ažurira; širok obuhvat, uključujući **kuvane oblike** (kuvan pirinač, pečena piletina…).

Predlog:
1. Za svaku namirnicu prvo Foundation; SR Legacy kada Foundation nema tu namirnicu ili taj oblik (npr. kuvano).
2. **Ne koristimo** Branded Foods (američki proizvodi) ni FNDDS (američka složena jela; recepti se ne poklapaju sa lokalnim).
3. Licenca: CC0 1.0, navođenje izvora (DATA_SOURCES.md, već odobreno).

### N2. Nedostajući nutrijent u Foundation zapisu
**[IZVOR]** USDA u FNDDS 2019–2020 popunjava nedostajuće Foundation vrednosti iz SR Legacy zapisa sa **istim NDB brojem** (FNDDS 2019–2020 dokumentacija, ARS).
Predlog: isto pravilo, samo za isti NDB broj; vrednost nosi oznaku „dopunjeno iz SR Legacy" i nivo najviše DOBRO POTVRĐENO (deo P). Bez istog NDB broja → nutrijent ostaje **nepoznat**, nikad 0.

### N3. Nutrijenti u V1
Predlog — tačno lista iz MS §22, bez mikronutrijenata u V1:

| Nutrijent | FDC ID (nutrient id) | Jedinica |
|---|---|---|
| Proteini | 1003 | g |
| Masti ukupno | 1004 | g |
| Zasićene masne kiseline | 1258 | g |
| Ugljeni hidrati „po razlici" (uključuje vlakna) | 1005 | g |
| Šećeri ukupno | 2000 (SR Legacy) / 1063 (Foundation) | g |
| Vlakna ukupno | 1079 | g |
| Natrijum | 1093 | mg |
| Voda (samo interno, za proveru prinosa) | 1051 | g |
| Energija FDC (samo za poređenje, vidi N4) | 1008 (SR) / 2047, 2048 (Foundation) | kcal |

**[IZVOR]** ID-jevi 1003, 1004, 1005, 1008/2047, 1051, 1079, 1258, 2000/1063: tabela šifara u FNDDS 2021–2023 dokumentaciji (ARS). 1093: uvozni alat proverava naziv u `nutrient.csv` iz zvaničnog preuzimanja pre upotrebe (i za sve ostale ID-jeve) — neslaganje zaustavlja uvoz.
So na ekranu = natrijum × 2,5 **[IZVOR]** Pravilnik o deklarisanju, označavanju i reklamiranju hrane, čl. 2 t. 28.
Mikronutrijenti (MS §22 „relevantni") — predlog: ne u V1; za cilj telesne mase ne menjaju plan, a Foundation ih ima nepotpuno. Mesto u modelu postoji.

### N4. Energija — jedan metod za sve izvore
Problem **[IZVOR]**: Foundation računa energiju opštim Atwater faktorima (ID 2047), neke namirnice i specifičnim (2048); SR Legacy daje ID 1008; FDC ugljene hidrate daje „po razlici", **sa vlaknima** (Foundation Foods Documentation). Srpske deklaracije (korak 8) računaju energiju po Prilogu 13 Pravilnika o deklarisanju, označavanju i reklamiranju hrane: UH 4, proteini 4, masti 9, vlakna 2, alkohol 7 kcal/g… **[IZVOR]** (Pravilnik, Prilog 13; isti faktori kao EU Uredba 1169/2011).
Ako se ne ujednači, ista količina hrane iz FDC i sa deklaracije dobija energiju po različitim pravilima.

**Predlog (A):** Mera računa energiju sama, deterministički, po Prilogu 13, za sve izvore:
`UH (iskoristivi) = UH po razlici − vlakna`; `kcal = 4·proteini + 4·UH + 9·masti + 2·vlakna (+7·alkohol)`.
Vrednost nosi oznaku „izračunato (Prilog 13)". FDC energija se čuva i prikazuje u „Zašto?" radi poređenja; uvozni izveštaj pokazuje razliku za svaku namirnicu.
Nedostatak: izvedena vrednost, a ne ona koju USDA objavljuje; ako vlakna nedostaju, energija se ne može izračunati → namirnica je nepotpuna.
**Alternativa (B):** uzeti energiju koju objavljuje FDC (redosled 2048 → 1008 → 2047). Jednostavnije, ali različit metod od deklaracija.
Moja preporuka: **A** — jedan metod u celoj aplikaciji, proverljiv u „Zašto?".

### N5. Srpski nazivi i mapiranje
- Srpski naziv nije nutritivna činjenica, ali **izbor FDC zapisa za srpsku namirnicu jeste** — zato svako mapiranje odobrava vlasnik.
- Kvalitet mapiranja:
  - **TAČNO** — ista namirnica, isti oblik (npr. „beli luk, sirov" ↔ *Garlic, raw*).
  - **BLISKO** — ista vrsta, razlika u sorti/poreklu koja ne menja bitno sastav (npr. jabuka bez navedene sorte ↔ generička jabuka). Najviše DOBRO POTVRĐENO.
  - **Nije dozvoljeno** — druga namirnica „slična po ukusu" (npr. kajmak ↔ američka pavlaka). Takva namirnica ne ulazi u V1 dok ne postoji deklaracija ili proverljiv lokalni izvor.
- Svaka namirnica: naziv sr-Latn (odobren), sr-Cyrl (automatska transliteracija + ručna provera, jer „dž/lj/nj" na granici morfema nije uvek jedan glas), sinonimi i oblik bez dijakritika za pretragu („sargarepa", „krompir/krumpir").
- Oblik (MS §20: sirovo, kuvano, pečeno, prženo, oceđeno, suvo) je deo identiteta zapisa (deo K).

### N6. Kako vrednosti ulaze u aplikaciju (bez prepisivanja brojeva)
Predlog: uvozni skript koji se pokreće u GitHub Actions (na ručni poziv):
1. preuzima zvanične CSV arhive Foundation i SR Legacy sa fdc.nal.usda.gov, beleži SHA-256 i datum izdanja;
2. uzima samo odobrene FDC zapise, proverava nazive nutrijenata po ID-ju;
3. pravi `reference-data/foods/<verzija>.json` (vrednost, jedinica, izvor, NDB/FDC ID, poreklo, pouzdanost) i **izveštaj za vlasnika** (sve vrednosti, nedostajući nutrijenti, razlika energije A/B);
4. tek posle odobrenja izveštaja fajl ulazi u aplikaciju kao nova verzija referentnih podataka.
AI ne kuca nijedan nutritivni broj (MS §6, §20).

---

## Deo P — Nivoi pouzdanosti i prikaz (MS §30, §31) — ODOBRENO (DECISIONS/0008)

### P1. Četiri nivoa (nazivi iz MS §30)
Svaka stavka ima dve ocene; važi **slabija**:

| Nivo | Vrednost (izvor/mapiranje) | Količina |
|---|---|---|
| POUZDANO | deklaracija tačnog proizvoda; FDC TAČNO mapiranje, izmerena vrednost | izmereno vagom |
| DOBRO POTVRĐENO | FDC BLISKO mapiranje; dopuna iz SR Legacy (N2); energija izračunata po N4 iz pouzdanih makronutrijenata | komad sa masom iz izvora (npr. FDC „1 veliko jaje") |
| PROCENJENO | vrednost dobijena faktorom prinosa (deo K); recept sa pretpostavljenom retencijom | kućna mera (kašika, šolja); masa jela iz faktora prinosa |
| NEDOVOLJNO POUZDANO | nepotvrđeno tumačenje unosa; namirnica bez odobrenog mapiranja | „otprilike", bez mere |

Zbir (obrok, dan) ima nivo **najslabije** stavke koja u njega ulazi. Ako nutrijent nedostaje kod bar jedne stavke, zbir je **nepotpun** (nedostajuće se nikad ne računa kao 0).
Obrazloženje **[PROCENA]**: pravilo „najslabija karika" je jednostavno i proverljivo; ne precenjuje pouzdanost. Nedostatak: jedna procenjena kašika ulja spušta ceo dan na „procenjeno" — to je tačno, jer je ulje energetski gusto.

Napomena: i „pouzdana" vrednost je prosek uzoraka (Foundation prikazuje raspon uzoraka), a deklaracija ima zakonske tolerancije. „Pouzdano" znači „najbolji dostupan podatak za tačno tu namirnicu", ne „tačno do kalorije".

### P2. Prikaz
| Stanje | Prikaz | Primer |
|---|---|---|
| POUZDANO, DOBRO POTVRĐENO | broj | 500 kcal |
| PROCENJENO | „≈" | ≈500 kcal |
| postoji izričit interval ulaza | raspon | 480–530 kcal |
| NEDOVOLJNO POUZDANO bez intervala | broj se ne prikazuje kao tačan | „≈500 kcal · nesigurno" |
| nutrijent nedostaje | oznaka | „nepotpuno" |

**Raspon se prikazuje samo kada ulaz nosi izričit interval iz izvora ili od korisnika** (npr. USDA tabela prinosa za meso daje raspon; korisnik kaže „150–200 g"). Mera ne izmišlja procenat nesigurnosti (npr. „±10 %") — za to ne postoji izvor koji bi važio za sve namirnice.
Detalji uvek u „Zašto?": izvor, verzija, FDC ID, poreklo, nivo, osnova proračuna.

### P3. Zaokruživanje (samo prikaz; čuva se nezaokruženo — ARCHITECTURE §8.1)
Predlog **[PROCENA]**, usklađeno sa uobičajenim prikazom na deklaracijama:
- kcal: ceo broj; uz „≈" i raspon — na 10 kcal (lažna preciznost bi bila u suprotnosti sa MS §30).
- g (proteini, masti, UH, šećeri, vlakna, zasićene): ≥ 10 g ceo broj; < 10 g jedna decimala; < 0,5 g „< 0,5 g".
- natrijum mg ceo broj; so g jedna decimala.
**[PROVERITI]** pre implementacije: zvanične EU smernice o zaokruživanju za nutritivnu deklaraciju (Evropska komisija, 2012) — ako se razlikuju, predlažem da važe one.

---

## Deo K — Sirovo / kuvano (MS §20; ARCHITECTURE §6.2 `domain/nutrition`) — ODOBRENO (DECISIONS/0008)

### K1. Oblik je deo namirnice
„Pirinač, sirov" i „pirinač, kuvan" su dva zapisa sa svojim vrednostima i izvorom. Sistem nikad ne koristi vrednosti jednog oblika za drugi bez eksplicitne konverzije (MS §46: „pogrešan oblik namirnice").

### K2. Direktno izmeren kuvan oblik ima prednost
Kada FDC ima kuvan oblik (uglavnom SR Legacy: kuvan pirinač, testenina, mahunarke, pečena piletina, kuvana jaja, kuvan krompir), koristi se taj zapis. To je analitički podatak za kuvanu hranu, pouzdaniji od preračuna.
**[IZVOR]** USDA navodi da se faktori prinosa primenjuju kada analitički podaci za kuvanu hranu nisu dostupni (USDA Table of Cooking Yields for Meat and Poultry, Release 2, 2014, uvod).

### K3. Faktor prinosa (promena mase pri pripremi)
Koristi se za: preračun količine (npr. 80 g suve testenine → g kuvane) i masu gotovog jela u receptu.
`masa kuvanog = masa sirovog × prinos`; nutrijenti na 100 g kuvanog = nutrijenti sirovog / prinos (uz retenciju, K4).
Izvori po prioritetu:
1. **Meso i živina:** USDA Table of Cooking Yields for Meat and Poultry, Release 2 (2014), ARS; doi:10.15482/USDA.ADC/1409031 — prinos po komadu mesa i načinu pripreme, sa n, SD i rasponom. Javno dobro (američka državna publikacija).
2. **Ostale grupe (žitarice, mahunarke, povrće, riba):** Bognár A. (2002), *Tables on weight yield of food and retention factors of food constituents for the calculation of nutrient composition of cooked foods (dishes)*, BFE-R--02-03, Bundesforschungsanstalt für Ernährung, Karlsruhe — referenca koju koristi EuroFIR za proračun recepata. **Licenca za ponovnu upotrebu nije navedena**: u V1 samo pojedinačni faktori uz citat; pre komercijalne faze proveriti.
3. Izvođenje prinosa iz sadržaja vode sirovog i kuvanog FDC zapisa — samo kao rezervna mogućnost, sa nivoom PROCENJENO i posebnim odobrenjem po namirnici.
Svaki faktor: vrednost, izvor sa stranom/tabelom, način pripreme, raspon ako ga izvor daje. Faktori se prepisuju iz izvora u uvozni fajl sa referencom na tabelu i prolaze pregled vlasnika kao i FDC vrednosti.

### K4. Retencija nutrijenata
Predlog za V1: za N3 nutrijente retencija 1,0 (nema gubitka) **osim masti kod mesa**, gde se gubi deo masti (USDA 2014 daje i „fat change"). Zato se za meso koristi kuvan FDC oblik (K2) kad postoji; ako ne postoji, rezultat je PROCENJENO i „Zašto?" to navodi.
Retencija vitamina (USDA Table of Nutrient Retention Factors, Release 6, 2007) — nije potrebna dok mikronutrijenti nisu u V1.

### K5. Recepti (priprema za korak 6)
Nutrijenti recepta = zbir sastojaka u obliku u kome se mere (obično sirovo). Masa gotovog jela: izmerena (ako korisnik izmeri) ili iz faktora prinosa (PROCENJENO). Porcija = udeo mase gotovog jela.
**[IZVOR]** Ovo je postupak iz EuroFIR smernica za proračun recepata (EuroFIR recipe guideline; Bognár 2002 kao izvor faktora).

---

## Odluke za vlasnika (korak 4) — odobreno 2026-09-23; otvoreno: R1 (DECISIONS/0008)
1. N1–N2 — Foundation → SR Legacy; dopuna samo po istom NDB broju.
2. N3 — 8 nutrijenata iz MS §22, bez mikronutrijenata u V1.
3. N4 — energija po Prilogu 13 (A, preporuka) ili FDC energija (B).
4. N5 — pravila mapiranja; spisak kandidata `docs/NAMIRNICE_V1.md` (uključujući šta NE ulazi).
5. N6 — uvoz alatom + izveštaj na odobrenje.
6. P1–P3 — nivoi, prikaz, zaokruživanje.
7. K1–K5 — oblici, izvori prinosa, retencija.

### N7. R1 — nepotpun Foundation zapis (ODOBRENO, DECISIONS/0009)
Problem (nađen pri uvozu): noviji Foundation zapisi (NDB 100xxx) često nemaju vlakna, šećere ili masti, a nemaju SR par za dopunu po N2. Po odobrenom pravilu takva namirnica ostaje bez energije (12 namirnica — DECISIONS/0008).
Predlog: ako Foundation zapis posle N2 nema proteine, masti, UH ili vlakna, koristi se SR Legacy zapis iste namirnice i istog oblika, ako postoji.
Posledica: potpuni podaci za 11 od 12 namirnica; vrednosti iz 2018. umesto novijih analiza. Alternativa: ostaviti nepotpuno dok USDA ne dopuni zapise.

---

## Deo E — Dnevna energija i cilj — PRENETO u bazu znanja (docs/KNOWLEDGE_BASE.md, DECISIONS/0012)

Ovaj deo je istorijski zapis prvog predloga; važeći sadržaj je u `reference-data/knowledge/`.

### E1. Pitanja pri prvom pokretanju
Pol, godine, visina, masa, kretanje (3 izbora), cilj (smršati / održati). Ženama jedno bezbednosno pitanje: trudnoća ili dojenje (da/ne). Ništa više.

### E2. Energija u mirovanju — Mifflin-St Jeor
Muškarci: 10·kg + 6,25·cm − 5·godine + 5 · Žene: 10·kg + 6,25·cm − 5·godine − 161.
**[IZVOR]** Mifflin MD i sar., Am J Clin Nutr 1990;51:241–247. Sistematski pregled (Frankenfield i sar., J Am Diet Assoc 2005;105:775–789): najpouzdanija od često korišćenih formula, ali ima pojedinačnih grešaka — zato je početni broj procena, a trend mase ga kasnije koriguje (MS §3, §11).

### E3. Kretanje (PAL)
Tri izbora sa vrednostima iz primera FAO/WHO/UNU (2004), *Human energy requirements*, Tabela 5.1:
- mahom sedim (kancelarija, vožnja): 1,53
- dosta sam na nogama ili vežbam redovno: 1,76
- težak fizički posao ili mnogo sporta: 2,25
Dnevna potrošnja = energija u mirovanju × PAL.

### E4. Cilj
- **Održavanje:** dnevna potrošnja.
- **Mršavljenje:** dnevna potrošnja − 500 kcal. **[IZVOR]** 2013 AHA/ACC/TOS smernice (Jensen MD i sar., Circulation 2014;129:S102–S138): manjak od 500 ili 750 kcal/dan; NHLBI 1998: manjak 500–1000 kcal/dan, oko 0,5–1 kg nedeljno.
- **Povećanje mase / mišića:** nije u ovom koraku — predlog sa izvorom posebno.

### E5. Bezbednosne granice (SAFETY_RULES, prvi deo)
- Mlađi od 18: BLOCKED (formule i smernice su za odrasle).
- Trudnoća ili dojenje: REQUIRES_CLINICAL_REVIEW — nema manjka kalorija.
- ITM < 18,5 i cilj mršavljenje: BLOCKED (WHO: pothranjenost).
- Donja granica unosa pri mršavljenju: 1200 kcal žene, 1500 kcal muškarci (donje granice iz 2013 AHA/ACC/TOS — **viđeno samo kao sekundarni navod; proveriti u originalu**, DECISIONS/0010). Ako manjak od 500 spušta ispod granice, cilj = granica.
- Prikaz: „≈" (procena, MS §30).
