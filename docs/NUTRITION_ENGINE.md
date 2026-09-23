# NUTRITION_ENGINE — metode i parametri proračuna

**Status:** NACRT. Nijedna vrednost iz ovog dokumenta nije ugrađena u kod dok je vlasnik ne odobri (DECISIONS/0005, MS §39).
Posle odobrenja vrednosti idu u verzionisan `FormulaSet` (ARCHITECTURE §13), ne kao konstante u kodu.

Oznake: **[IZVOR]** — tvrdnja potkrepljena navedenim izvorom · **[PROCENA]** — statistička ili praktična odluka bez naučnog izvora za tačan broj; obrazložena, ali to je izbor, ne činjenica.

---

## Deo T — Trend telesne mase (MS §13; ARCHITECTURE §13 tačka 7)

Status: **PREDLOG, čeka odobrenje** (korak 3 iz §17). Unos i lista merenja već rade; trend se ne prikazuje.

### Zašto se ne gleda jedno merenje
- Telesna masa ima nedeljni obrazac: raste preko vikenda i opada radnim danima. **[IZVOR]** Turicchi J. i sar. (2020), *Weekly, seasonal and holiday body weight fluctuation patterns among individuals engaged in a European multi-centre behavioural weight loss maintenance intervention*, PLOS ONE 15(4): e0232152, doi:10.1371/journal.pone.0232152 (otvoren pristup, PMC7192384). Isti obrazac ranije: Orsama A-L. i sar. (2014), *Weight rhythms: weight increases during weekends and decreases during weekdays*, Obesity Facts 7(1):36–47.
- Posledica za Meru: poređenje ponedeljka sa petkom može pokazati „promenu" koja je samo deo nedeljnog ciklusa. Zato su osnovne jedinice poređenja prozori od celih nedelja (7, 14, 28 dana).

### T1. Dnevna vrednost
Predlog: ako u jednom danu postoji više merenja, dnevna vrednost je **prvo merenje tog dana** (po vremenu merenja).
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

### Šta treba odobriti
1. T1 — prvo merenje u danu (ili prosek dana).
2. T2 — 7 dana, najmanje 4 vrednosti.
3. T3 — linearna regresija; 14 dana/8 vrednosti, 28 dana/14 vrednosti, uslov krajeva.
4. T4 — kg nedeljno + procenat.
5. T5 — potvrda ispod 30 i iznad 300 kg.
6. T6 — bez automatskog izbacivanja u V1.
