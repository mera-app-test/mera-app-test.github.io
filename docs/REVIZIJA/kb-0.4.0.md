# Nezavisna provera baze znanja Mere — verzija 0.4.0

## Uputstvo za recenzenta (AI sistem)
Ti si nezavisni recenzent. Za SVAKU stavku ispod proveri:
1. Da li navedeni izvori (otvori URL/DOI; ne oslanjaj se na sećanje) zaista potvrđuju tvrdnju i brojeve — tačno onako kako piše.
2. Da li je tvrdnja opšte prihvaćena u struci (zvanična smernica ili bar dva nezavisna pouzdana izvora: zvanične ustanove, stručne smernice, sistematski pregledi).
3. Da li postoji novija ili važnija smernica koja kaže drugačije.
4. Da li je bezbednosno pravilo dovoljno oprezno.
Ne koristi forume, blogove, sajtove sa kalkulatorima ni Wikipediju kao dokaz. Ako nešto ne možeš da proveriš u izvoru, napiši to — ne pretpostavljaj.

**Format odgovora (za svaku stavku):**
`ID — POTVRĐENO` ili `ID — PRIMEDBE: <šta tačno nije u redu, uz izvor>`

## E-001 — Potrošnja energije u mirovanju (Mifflin-St Jeor)

**Tvrdnja:** Potrošnja u mirovanju računa se formulom Mifflin-St Jeor: 10 × masa (kg) + 6,25 × visina (cm) − 5 × godine, plus 5 za muškarce ili minus 161 za žene. To je početna procena; stvarni trend mase je kasnije ispravlja.

**Proračun:** Potrošnja u mirovanju = add(mul(10, Telesna masa), mul(6.25, Visina), mul(-5, Godine), [Pol: m=5, z=-161])

**Izvori:**
- (nivo 3, original pročitan) Mifflin MD, St Jeor ST, Hill LA, Scott BJ, Daugherty SA, Koh YO. A new predictive equation for resting energy expenditure in healthy individuals. Am J Clin Nutr 1990;51(2):241–247. https://ajcn.nutrition.org/article/S0002-9165(23)16698-6/fulltext doi:10.1093/ajcn/51.2.241
  - potkrepljuje: Sažetak (original, izdavač): pojednostavljena formula po polu — muškarci 10·kg + 6,25·cm − 5·god + 5; žene … − 161; izvedena na 498 zdravih osoba od 19 do 78 godina, normalne mase i gojaznih.
- (nivo 2, original pročitan) Frankenfield D, Roth-Yousey L, Compher C. Comparison of predictive equations for resting metabolic rate in healthy nonobese and obese adults: a systematic review. J Am Diet Assoc 2005;105(5):775–789. https://www.jandonline.org/article/S0002-8223(05)00149-5/abstract doi:10.1016/j.jada.2005.02.005
  - potkrepljuje: Mifflin-St Jeor je od često korišćenih formula najčešće u granici ±10 % od izmerenog; greške kod pojedinca postoje (pročitan sažetak na stranici izdavača).

**Napomena autora:** Formula je izvedena na odraslima 19–78 godina (Mifflin 1990). Kriterijum po DECISIONS/0015: kredibilan izvor (sistematski pregled Frankenfield 2005, nivo 2, original) i nema značajnog stručnog neslaganja. Otvoreno, neblokirajuće: drugi izvor nivoa 1–2 (npr. stručna smernica).

## E-002 — Nivo fizičke aktivnosti (PAL)

**Tvrdnja:** Kretanje se prevodi u faktor aktivnosti prema primerima FAO/WHO/UNU (2004): mahom sedim 1,53; dosta na nogama ili redovno vežbam 1,76; težak fizički posao ili mnogo sporta 2,25.

**Proračun:** Nivo aktivnosti (PAL) = [Kretanje: sedi=1.53, aktivan=1.76, tezak=2.25]

**Izvori:**
- (nivo 1, original pročitan) FAO/WHO/UNU. Human energy requirements. Report of a Joint FAO/WHO/UNU Expert Consultation. Rome: FAO; 2004. Poglavlje 5, tabela 5.1. https://www.fao.org/4/y5686e/y5686e07.htm
  - potkrepljuje: Primeri PAL: sedeći/lak 1,53; aktivan/umereno aktivan 1,76; veoma aktivan 2,25; opsezi 1,40–1,69 / 1,70–1,99 / 2,00–2,40.

## E-003 — Dnevna potrošnja energije

**Tvrdnja:** Dnevna potrošnja = potrošnja u mirovanju × faktor aktivnosti (FAO/WHO/UNU 2004).

**Važi kada:** Poznata dnevna potrošnja missing undefined

**Proračun:** Dnevna potrošnja = mul(Potrošnja u mirovanju, Nivo aktivnosti (PAL))

**Izvori:**
- (nivo 1, original pročitan) FAO/WHO/UNU. Human energy requirements. Report of a Joint FAO/WHO/UNU Expert Consultation. Rome: FAO; 2004. Poglavlje 5, tabela 5.1. https://www.fao.org/4/y5686e/y5686e07.htm
  - potkrepljuje: Primeri PAL: sedeći/lak 1,53; aktivan/umereno aktivan 1,76; veoma aktivan 2,25; opsezi 1,40–1,69 / 1,70–1,99 / 2,00–2,40.

## E-004 — Dnevni cilj za održavanje mase

**Tvrdnja:** Za održavanje mase dnevni cilj je jednak dnevnoj potrošnji.

**Važi kada:** Cilj eq "odrzavanje"

**Proračun:** Dnevni cilj = Dnevna potrošnja

**Izvori:**
- (nivo 1, original pročitan) FAO/WHO/UNU. Human energy requirements. Report of a Joint FAO/WHO/UNU Expert Consultation. Rome: FAO; 2004. Poglavlje 5, tabela 5.1. https://www.fao.org/4/y5686e/y5686e07.htm
  - potkrepljuje: Primeri PAL: sedeći/lak 1,53; aktivan/umereno aktivan 1,76; veoma aktivan 2,25; opsezi 1,40–1,69 / 1,70–1,99 / 2,00–2,40.

## E-005 — Dnevni cilj za mršavljenje

**Tvrdnja:** Za mršavljenje dnevni cilj je dnevna potrošnja umanjena za izabrani manjak. Mera ne ide ispod 1200 kcal za žene i 1500 kcal za muškarce: to su donje vrednosti opsega unosa koji smernica navodi kao jedan od načina, a Mera ih koristi kao oprezno dno. Unos ispod 800 kcal dnevno smernica dozvoljava samo uz medicinski nadzor.

**Važi kada:** Cilj eq "mrsavljenje"

**Proračun:** Dnevni cilj = max(sub(Dnevna potrošnja, Dnevni manjak), [Pol: m=1500, z=1200])

**Izvori:**
- (nivo 1, original pročitan) NHLBI Obesity Education Initiative Expert Panel. Clinical Guidelines on the Identification, Evaluation, and Treatment of Overweight and Obesity in Adults: The Evidence Report. NIH Publication 98-4083; 1998. https://www.ncbi.nlm.nih.gov/books/NBK2009/
  - potkrepljuje: Manjak od 500–1000 kcal/dan kao deo programa mršavljenja; oko 0,5–1 kg nedeljno.
- (nivo 2, original pročitan) Jensen MD i sar. 2013 AHA/ACC/TOS Guideline for the Management of Overweight and Obesity in Adults. Circulation 2014;129(25 Suppl 2):S102–S138. https://pmc.ncbi.nlm.nih.gov/articles/PMC5819889/ doi:10.1161/01.cir.0000437739.71477.ee
  - potkrepljuje: Preporuka 3a (NHLBI ocena A): za smanjenje unosa može se koristiti bilo koji od načina — 1200–1500 kcal/dan žene i 1500–1800 kcal/dan muškarci (prilagođeno masi), ILI manjak od 500 ili 750 kcal/dan (u tekstu dokaza i 30 % manjka), ILI određeni tipovi dijeta. Dijete ispod 800 kcal/dan samo uz medicinski nadzor. Smernica je za odrasle.

**Napomena autora:** 1200/1500 u smernici nisu propisani minimum, već donja granica jednog od tri ravnopravna načina; kao dno ih koristimo po kriterijumu 3 (opreznija varijanta).

## E-006 — Indeks telesne mase (ITM)

**Tvrdnja:** ITM = masa (kg) / visina (m)². Koristi se samo za bezbednosnu proveru, ne kao ocena korisnika.

**Proračun:** Indeks telesne mase = div(Telesna masa, pow(div(Visina, 100), 2))

**Izvori:**
- (nivo 1, original pročitan) WHO. Nutrition Landscape Information System (NLiS) — Body mass index: moderate and severe thinness, underweight, overweight, obesity. https://apps.who.int/nutrition/landscape/help.aspx?menu=0&helpid=420
  - potkrepljuje: ITM = kg/m²; ITM < 18,5 pothranjenost; < 17 mršavost (umereni rizik); < 16 znatno povećan rizik. Vrednosti važe za odrasle, oba pola.

## S-001 — Mlađi od 18 godina

**Tvrdnja:** Mera ne pravi plan za osobe mlađe od 18 godina: formula za potrošnju izvedena je na odraslima (19–78 godina), a smernice za mršavljenje odnose se na odrasle. Za mlađe je potreban pedijatar ili nutricionista.

**Bezbednost:** kada Godine lt 18 → BLOCKED. Poruka: „Mera je namenjena odraslima. Za plan ishrane mlađih od 18 godina obrati se pedijatru ili nutricionisti."

**Izvori:**
- (nivo 3, original pročitan) Mifflin MD, St Jeor ST, Hill LA, Scott BJ, Daugherty SA, Koh YO. A new predictive equation for resting energy expenditure in healthy individuals. Am J Clin Nutr 1990;51(2):241–247. https://ajcn.nutrition.org/article/S0002-9165(23)16698-6/fulltext doi:10.1093/ajcn/51.2.241
  - potkrepljuje: Sažetak (original, izdavač): pojednostavljena formula po polu — muškarci 10·kg + 6,25·cm − 5·god + 5; žene … − 161; izvedena na 498 zdravih osoba od 19 do 78 godina, normalne mase i gojaznih.
- (nivo 2, original pročitan) Jensen MD i sar. 2013 AHA/ACC/TOS Guideline for the Management of Overweight and Obesity in Adults. Circulation 2014;129(25 Suppl 2):S102–S138. https://pmc.ncbi.nlm.nih.gov/articles/PMC5819889/ doi:10.1161/01.cir.0000437739.71477.ee
  - potkrepljuje: Preporuka 3a (NHLBI ocena A): za smanjenje unosa može se koristiti bilo koji od načina — 1200–1500 kcal/dan žene i 1500–1800 kcal/dan muškarci (prilagođeno masi), ILI manjak od 500 ili 750 kcal/dan (u tekstu dokaza i 30 % manjka), ILI određeni tipovi dijeta. Dijete ispod 800 kcal/dan samo uz medicinski nadzor. Smernica je za odrasle.
- (nivo 1, original pročitan) NHLBI Obesity Education Initiative Expert Panel. Clinical Guidelines on the Identification, Evaluation, and Treatment of Overweight and Obesity in Adults: The Evidence Report. NIH Publication 98-4083; 1998. https://www.ncbi.nlm.nih.gov/books/NBK2009/
  - potkrepljuje: Manjak od 500–1000 kcal/dan kao deo programa mršavljenja; oko 0,5–1 kg nedeljno.

## S-002 — Trudnoća i dojenje

**Tvrdnja:** U trudnoći se ne mršavi: smernica NICE ne preporučuje programe mršavljenja u trudnoći. Tokom dojenja Mera za sada takođe ne pravi manjak kalorija (oprezna varijanta dok se izvor za dojenje ne proveri u originalu). Plan ishrane u oba slučaja dogovoriti sa lekarom.

**Važi kada:** Pol eq "z"

**Bezbednost:** kada Trudnoća ili dojenje eq true → REQUIRES_CLINICAL_REVIEW. Poruka: „U trudnoći i dojenju plan ishrane dogovori sa lekarom. Mera ne pravi manjak kalorija."

**Izvori:**
- (nivo 1, original pročitan) NICE. Weight management before, during and after pregnancy. Public health guideline PH27 (2010). https://www.nice.org.uk/guidance/ph27/chapter/Recommendations
  - potkrepljuje: Programi mršavljenja se ne preporučuju u trudnoći jer mogu da naškode detetu. (Proveriti da li je PH27 zamenjen novom smernicom NG247 iz 2025.)
- (nivo 1, NIJE pročitan original) NICE PH27 — preporuka o dojenju (navedeno u: Clinical guidelines for the management of weight during pregnancy, PMC10007759).
  - potkrepljuje: Zdrava ishrana, umerena aktivnost i postepen gubitak mase ne utiču loše na dojenje. VIĐENO SAMO KAO NAVOD — proveriti u originalu.

**Napomena autora:** Po NICE (navod), postepeno mršavljenje tokom dojenja nije štetno — kada se potvrdi u originalu, dojenje se može odvojiti od trudnoće (novo pitanje) ili ostati oprezno. Odluka o proizvodu.

## S-003 — Pothranjenost i mršavljenje

**Tvrdnja:** Ako je ITM ispod 18,5, Mera ne pravi plan za mršavljenje.

**Važi kada:** Cilj eq "mrsavljenje"

**Bezbednost:** kada Indeks telesne mase lt 18.5 → BLOCKED. Poruka: „Tvoja masa je već ispod preporučenog opsega (ITM ispod 18,5), pa Mera ne pravi plan za mršavljenje. Posavetuj se sa lekarom."

**Izvori:**
- (nivo 1, original pročitan) WHO. Nutrition Landscape Information System (NLiS) — Body mass index: moderate and severe thinness, underweight, overweight, obesity. https://apps.who.int/nutrition/landscape/help.aspx?menu=0&helpid=420
  - potkrepljuje: ITM = kg/m²; ITM < 18,5 pothranjenost; < 17 mršavost (umereni rizik); < 16 znatno povećan rizik. Vrednosti važe za odrasle, oba pola.

## X-001 — Početni broj je procena

**Tvrdnja:** Dnevni cilj iz formule je početna procena. Kod pojedinca formula može da pogreši, pa Mera posle nekoliko nedelja poredi plan sa stvarnim trendom mase i predlaže korekciju.

**Izvori:**
- (nivo 2, original pročitan) Frankenfield D, Roth-Yousey L, Compher C. Comparison of predictive equations for resting metabolic rate in healthy nonobese and obese adults: a systematic review. J Am Diet Assoc 2005;105(5):775–789. https://www.jandonline.org/article/S0002-8223(05)00149-5/abstract doi:10.1016/j.jada.2005.02.005
  - potkrepljuje: Mifflin-St Jeor je od često korišćenih formula najčešće u granici ±10 % od izmerenog; greške kod pojedinca postoje (pročitan sažetak na stranici izdavača).

## E-007 — Dnevna potrošnja koju korisnik zna

**Tvrdnja:** Ako korisnik zna svoju dnevnu potrošnju (npr. od nutricioniste ili merenja), Mera koristi taj broj umesto formule. Stvarni trend mase ga kasnije proverava kao i svaku procenu.

**Važi kada:** Poznata dnevna potrošnja exists undefined

**Proračun:** Dnevna potrošnja = Poznata dnevna potrošnja

**Izvori:**
- (objašnjenje, bez izvora)

**Napomena autora:** Podatak korisnika, ne tvrdnja iz struke; bezbednosne granice (E-005, E-008) važe isto.

## E-008 — Dnevni manjak kalorija prema tempu

**Tvrdnja:** Umeren tempo je 500 kcal dnevno manje od potrošnje, brži 750 kcal — to su vrednosti iz smernice za lečenje gojaznosti odraslih. Korisnik može sam da izabere manji manjak (npr. 300 kcal); veći od 750 kcal Mera ne predlaže.

**Važi kada:** Tempo in ["umereno","brze"]

**Proračun:** Dnevni manjak = [Tempo: umereno=500, brze=750]

**Izvori:**
- (nivo 2, original pročitan) Jensen MD i sar. 2013 AHA/ACC/TOS Guideline for the Management of Overweight and Obesity in Adults. Circulation 2014;129(25 Suppl 2):S102–S138. https://pmc.ncbi.nlm.nih.gov/articles/PMC5819889/ doi:10.1161/01.cir.0000437739.71477.ee
  - potkrepljuje: Preporuka 3a (NHLBI ocena A): za smanjenje unosa može se koristiti bilo koji od načina — 1200–1500 kcal/dan žene i 1500–1800 kcal/dan muškarci (prilagođeno masi), ILI manjak od 500 ili 750 kcal/dan (u tekstu dokaza i 30 % manjka), ILI određeni tipovi dijeta. Dijete ispod 800 kcal/dan samo uz medicinski nadzor. Smernica je za odrasle.
- (nivo 1, original pročitan) NHLBI Obesity Education Initiative Expert Panel. Clinical Guidelines on the Identification, Evaluation, and Treatment of Overweight and Obesity in Adults: The Evidence Report. NIH Publication 98-4083; 1998. https://www.ncbi.nlm.nih.gov/books/NBK2009/
  - potkrepljuje: Manjak od 500–1000 kcal/dan kao deo programa mršavljenja; oko 0,5–1 kg nedeljno.

## E-009 — Manjak koji korisnik sam bira

**Tvrdnja:** Kada korisnik sam bira manjak, Mera prihvata svaki manjak do 750 kcal dnevno; veći se svodi na 750 kcal (gornja vrednost iz smernice). Donja granica unosa (E-005) važi i ovde.

**Važi kada:** Tempo eq "sam"

**Proračun:** Dnevni manjak = min(Manjak koji biraš, 750)

**Izvori:**
- (nivo 2, original pročitan) Jensen MD i sar. 2013 AHA/ACC/TOS Guideline for the Management of Overweight and Obesity in Adults. Circulation 2014;129(25 Suppl 2):S102–S138. https://pmc.ncbi.nlm.nih.gov/articles/PMC5819889/ doi:10.1161/01.cir.0000437739.71477.ee
  - potkrepljuje: Preporuka 3a (NHLBI ocena A): za smanjenje unosa može se koristiti bilo koji od načina — 1200–1500 kcal/dan žene i 1500–1800 kcal/dan muškarci (prilagođeno masi), ILI manjak od 500 ili 750 kcal/dan (u tekstu dokaza i 30 % manjka), ILI određeni tipovi dijeta. Dijete ispod 800 kcal/dan samo uz medicinski nadzor. Smernica je za odrasle.

**Napomena autora:** Manji manjak od 500 kcal je blaži od smernice (opreznija varijanta, kriterijum 3).

## E-010 — Početni tempo mršavljenja

**Tvrdnja:** Na početku, oko 500 kcal dnevnog manjka daje oko pola kilograma nedeljno (1000 kcal oko 1 kg). Mršavljenje se vremenom usporava jer se organizam prilagođava, pa Mera ne obećava datum — prati stvarni trend mase i predlaže korekciju.

**Proračun:** Početni tempo = div(Dnevni manjak, 1000)

**Izvori:**
- (nivo 1, original pročitan) NHLBI Obesity Education Initiative Expert Panel. Clinical Guidelines on the Identification, Evaluation, and Treatment of Overweight and Obesity in Adults: The Evidence Report. NIH Publication 98-4083; 1998. https://www.ncbi.nlm.nih.gov/books/NBK2009/
  - potkrepljuje: Manjak od 500–1000 kcal/dan kao deo programa mršavljenja; oko 0,5–1 kg nedeljno.
- (nivo 3, original pročitan) Hall KD, Sacks G, Chandramohan D i sar. Quantification of the effect of energy imbalance on bodyweight. Lancet 2011;378(9793):826–837. https://www.sciencedirect.com/science/article/abs/pii/S014067361160812X doi:10.1016/S0140-6736(11)60812-X
  - potkrepljuje: Pravilo „500 kcal dnevno = stalnih 0,5 kg nedeljno" (3500 kcal po funti) ne uzima u obzir prilagođavanje organizma i precenjuje gubitak; mršavljenje se vremenom usporava (sažetak, izdavač). Autori su istraživači NIH-a.
- (nivo 1, NIJE pročitan original) NICE. Weight management before, during and after pregnancy. PH27 (2010) — načela dobre prakse programa mršavljenja.
  - potkrepljuje: Očekivati gubitak ne veći od 0,5–1 kg nedeljno. VIĐENO u kopiji PDF-a na drugom serveru — proveriti na nice.org.uk.

## E-011 — ITM pri željenoj masi

**Tvrdnja:** ITM pri željenoj masi = željena masa (kg) / visina (m)². Koristi se samo za bezbednosnu proveru cilja.

**Proračun:** ITM pri željenoj masi = div(Željena masa, pow(div(Visina, 100), 2))

**Izvori:**
- (nivo 1, original pročitan) WHO. Nutrition Landscape Information System (NLiS) — Body mass index: moderate and severe thinness, underweight, overweight, obesity. https://apps.who.int/nutrition/landscape/help.aspx?menu=0&helpid=420
  - potkrepljuje: ITM = kg/m²; ITM < 18,5 pothranjenost; < 17 mršavost (umereni rizik); < 16 znatno povećan rizik. Vrednosti važe za odrasle, oba pola.

## S-004 — Cilj ispod zdravog opsega

**Tvrdnja:** Mera ne pravi plan ka masi pri kojoj bi ITM bio ispod 18,5 (pothranjenost po SZO).

**Važi kada:** Cilj eq "mrsavljenje"

**Bezbednost:** kada ITM pri željenoj masi lt 18.5 → BLOCKED. Poruka: „Željena masa je ispod zdravog opsega za tvoju visinu (ITM ispod 18,5). Izaberi veću željenu masu."

**Izvori:**
- (nivo 1, original pročitan) WHO. Nutrition Landscape Information System (NLiS) — Body mass index: moderate and severe thinness, underweight, overweight, obesity. https://apps.who.int/nutrition/landscape/help.aspx?menu=0&helpid=420
  - potkrepljuje: ITM = kg/m²; ITM < 18,5 pothranjenost; < 17 mršavost (umereni rizik); < 16 znatno povećan rizik. Vrednosti važe za odrasle, oba pola.

## X-002 — Više načina da se zada cilj

**Tvrdnja:** Korisnik može da kaže koliko želi da ima kilograma i izabere tempo (umereno je preporuka), ili sam da izabere koliko kalorija dnevno manje želi, ili da unese svoju poznatu potrošnju. Svi načini vode na isti proračun i iste bezbednosne granice.

**Izvori:**
- (objašnjenje, bez izvora)

