MERA

Master Specification

Version 1.0 — Initial Product Definition

---

1. Osnovna ideja

Mera je sistem za personalizovano upravljanje telesnom masom i telesnom kompozicijom kroz ishranu.

Osnovna svrha sistema je jednostavna:

«Prikupiti relevantne i pouzdane informacije o korisniku, njegovom cilju, načinu života, ishrani i rezultatima, a zatim te informacije pretvoriti u kvalitetan, praktičan i prilagodljiv plan ishrane koji korisniku olakšava ostvarivanje cilja.»

Mera nije zamišljena kao običan kalkulator kalorija, chatbot ili aplikacija sa velikim brojem nepovezanih funkcija.

Sve funkcije postoje samo ako doprinose ovom cilju.

---

2. Ciljevi

Mera treba da podrži različite ciljeve povezane sa telesnom masom i kompozicijom, uključujući:

- smanjenje telesne mase
- održavanje telesne mase
- povećanje telesne mase
- promenu telesne kompozicije
- očuvanje mišićne mase tokom promene telesne mase
- druge opravdane ciljeve koji mogu biti podržani odgovarajućim nutricionističkim pristupom

Cilj se određuje prema korisniku, njegovim podacima i njegovim željama.

---

3. Osnovni princip

Mera treba da radi približno ono što bi radio veoma kvalitetan nutricionista:

1. prikupi relevantne podatke
2. proceni početno stanje
3. utvrdi cilj
4. izračuna energetske i nutritivne potrebe
5. napravi početni plan
6. prati rezultate
7. analizira rezultate kroz vreme
8. predloži korekcije
9. proveri bezbednost i kvalitet
10. nastavi da prilagođava plan

Početni proračun je početna procena, a ne konačna istina.

Stvarni rezultati korisnika kroz vreme predstavljaju važan izvor informacija za dalju personalizaciju.

---

4. Korisnik ne mora da bude nutricionista

Korisnik ne treba da poznaje:

- BMR
- TDEE
- energetski deficit
- makronutrijente
- formule
- nutritivne baze
- naučne izvore
- metodologiju planiranja ishrane

Sistem te stvari obrađuje u pozadini.

Korisniku treba prikazati ono što mu je potrebno za donošenje odluke i praktično korišćenje plana.

Primer:

- konkretan obrok
- količina
- kalorijska vrednost
- recept
- zamena
- dnevni plan
- napredak

Stručni detalji treba da budu dostupni na zahtev, ali ne smeju opterećivati osnovni interfejs.

---

5. Glavni princip UX-a

Jednostavno korisniku, složeno u pozadini.

Mera može imati veoma složenu internu arhitekturu, ali korisničko iskustvo mora ostati jednostavno.

Korisnik treba da može prirodnim jezikom da kaže:

- „Promeni večeru.“
- „Nemam piletinu.“
- „Ovo mi je preskupo.“
- „Nemam vremena da kuvam.“
- „Ne volim ribu.“
- „Danas imam samo 15 minuta.“
- „Napravi mi plan za sedam dana.“

Korisnik ne treba da uči posebne komande.

---

6. AI kao interfejs, ne kao izvor istine

AI je centralni interfejs za komunikaciju sa korisnikom, ali AI nije autoritet za nutritivne činjenice.

AI može:

- razumeti korisnikov zahtev
- postavljati potrebna pitanja
- personalizovati komunikaciju
- predlagati obroke
- prilagođavati recepte
- povezivati korisničke preference sa dostupnim podacima
- objašnjavati preporuke
- pomagati u donošenju odluka

AI ne sme samostalno izmišljati:

- nutritivne vrednosti
- kalorije
- naučne izvore
- proizvode
- sastojke
- zdravstvene činjenice
- rezultate proračuna

Kritični podaci i proračuni moraju dolaziti iz odgovarajućih izvora i determinističkih sistema.

---

7. Prikupljanje podataka

Mera treba da prikupi sve relevantne podatke koji mogu značajno poboljšati kvalitet plana.

Podaci mogu obuhvatiti:

Osnovne podatke

- godine
- pol
- visinu
- telesnu masu
- cilj
- relevantne telesne mere, kada ih korisnik želi dati

Životni stil

- fizičku aktivnost
- posao i fizičku zahtevnost posla
- trening
- hodanje
- druge aktivnosti
- navike povezane sa ishranom

Ishrana

- broj obroka
- preferencije
- omiljene namirnice
- namirnice koje korisnik ne voli
- alergije i intolerancije
- ograničenja u ishrani
- vreme za pripremu
- nivo spremnosti za kuvanje
- budžet
- dostupnost hrane
- lokalne navike i kuhinju

Zdravstveno relevantni podaci

Samo podaci koji su relevantni za bezbednost i personalizaciju ishrane, uz odgovarajuću zaštitu privatnosti.

Sistem mora razlikovati opšte nutricionističke preporuke od medicinskih pitanja.

---

8. Prikupljanje podataka kroz vreme

Ne treba zahtevati da korisnik popuni ogroman formular pre prve korisne preporuke.

Početni onboarding treba da prikupi minimum potreban za bezbedan i kvalitetan početak.

Ostali podaci mogu se postepeno prikupljati kroz:

- razgovor
- korišćenje aplikacije
- prijavljivanje hrane
- promene preferencija
- rezultate
- korisničke povratne informacije

Mera treba da pamti korisne dugoročne informacije.

Korisnik mora moći da vidi, izmeni ili obriše podatke koje sistem pamti o njemu.

---

9. Personalizacija

Personalizacija treba da bude duboka, ali korisnik bira nivo učešća.

Predviđeni nivoi mogu biti:

- osnovni
- detaljni
- napredni

Viši nivo znači više dostupnih podataka za personalizaciju.

Ne znači različite standarde bezbednosti ili kvaliteta.

---

10. Početni plan

Kada Mera prikupi dovoljno podataka, sistem sam formira početni plan.

Korisnik ne bira ručno:

- kalorijski cilj
- proteine
- masti
- ugljene hidrate
- deficit
- druge stručne parametre

osim ako želi da ih vidi ili direktno učestvuje u njima.

Sistem koristi naučno prihvaćene metode i formule kao početnu tačku.

---

11. Energetski model

Početna procena energetskih potreba treba da koristi odgovarajuće naučno prihvaćene formule i relevantne podatke korisnika.

U obzir se uzimaju, kada su dostupni i relevantni:

- godine
- pol
- visina
- telesna masa
- fizička aktivnost
- trening
- životni stil
- cilj
- relevantni zdravstveni faktori

Početni rezultat se tretira kao procena.

Sistem kasnije koristi stvarne podatke korisnika za proveru i eventualno prilagođavanje modela.

Promene se ne smeju zasnivati na jednoj dnevnoj promeni telesne mase.

---

12. Praćenje rezultata

Mera razlikuje:

PLANNED — šta je aplikacija preporučila

REPORTED — šta korisnik kaže da je uradio/pojeo

MEASURED — šta je stvarno izmereno

ESTIMATED — šta sistem procenjuje

Sistem nikada ne sme automatski pretpostaviti da je korisnik pojeo preporučeni obrok samo zato što je bio u planu.

---

13. Trend telesne mase

Dnevna telesna masa može značajno varirati.

Zbog toga sistem mora koristiti odgovarajuću analizu trenda, a ne donositi zaključke na osnovu jednog merenja.

Mogu se koristiti:

- dnevne vrednosti
- 7-dnevni prosek
- 14-dnevni trend
- 28-dnevni trend
- stopa promene

Korekcija plana zahteva dovoljan broj relevantnih podataka.

---

14. Adaptacija plana

Mera treba aktivno da prati rezultate i u odgovarajućim kontrolnim tačkama predlaže promene.

Sistem ne treba da reaguje impulsivno na svaku dnevnu promenu.

Promena plana može biti:

- bez promene
- mala korekcija
- veća korekcija

Pre promene treba uzeti u obzir:

- trend telesne mase
- prijavljeni unos
- pridržavanje plana
- fizičku aktivnost
- relevantne promene u životu
- glad/sitost ako korisnik prati
- druge relevantne podatke

Mera može predložiti promenu.

Konačnu odluku donosi korisnik.

---

15. Glavni ekran

Glavni ekran treba da bude jednostavan.

Primer:

DANAS

Doručak
slika + naziv
420 kcal
[zameni]

Ručak
slika + naziv
650 kcal
[zameni]

Večera
slika + naziv
530 kcal
[zameni]

Ukupno: 1.600 kcal

Na dnu centralno:

Glasovni razgovor

Detalji se otvaraju klikom.

---

16. Glas i tekst

Korisnik može prirodno da razgovara sa aplikacijom glasom ili tekstom.

Ne treba zahtevati formalne komande.

Sistem treba da razume kontekst prethodnog razgovora.

Ako korisnik kaže:

«„Promeni večeru.“»

Mera koristi postojeći kontekst.

Ne postavlja ponovo pitanja na koja već ima odgovor.

Ako nedostaje podatak koji je važan za bezbednost ili kvalitet rezultata, sistem postavlja samo potrebno pitanje.

---

17. Unos hrane

Predviđeni načini:

- tekst
- glas
- barkod
- fotografija deklaracije

Fotografija gotovog tanjira nije deo osnovnog sistema za procenu količine i kalorija.

Razlog: procena nutritivnih vrednosti samo na osnovu fotografije hrane može imati previsoku nesigurnost za osnovnu metodologiju proizvoda.

---

18. Barkod

Tok:

barkod → pronalaženje proizvoda → provera → nutritivni podaci → prikaz izvora

Ako proizvod nije pouzdano identifikovan, sistem ne sme izmišljati podatke.

---

19. Fotografija deklaracije

Tok:

fotografija → OCR → strukturirani podaci → validacija → potvrda korisnika → proizvod

Podatak mora imati informaciju o poreklu i nivou pouzdanosti.

---

20. Baza hrane

Za generičke namirnice koristi se glavni autoritativni izvor.

Za specifične proizvode koriste se odgovarajući izvori, naročito deklaracija proizvođača kada je dostupna.

AI nikada nije izvor nutritivne činjenice.

Podaci moraju razlikovati, kada je relevantno:

- sirovo
- kuvano
- pečeno
- prženo
- oceđeno
- suvo
- jestivi deo
- pripremljeni proizvod

---

21. Izvori i licenciranje

Svaki spoljašnji izvor mora biti procenjen u pogledu:

- kvaliteta
- relevantnosti
- komercijalne upotrebe
- licence
- mogućnosti redistribucije
- atribucije
- API uslova
- verzije podataka

Izvori moraju biti evidentirani.

Ne koristiti nasumično web scraping kao osnovu sistema kada postoji pouzdaniji zvanični izvor.

---

22. Nutritivni proračuni

Nutritivni proračuni moraju biti deterministički.

AI može predložiti sastojke i količine.

Sistem izračunava:

- energiju
- proteine
- masti
- zasićene masti
- ugljene hidrate
- šećere
- vlakna
- natrijum
- relevantne mikronutrijente

prema dostupnosti podataka i relevantnosti za cilj.

---

23. Recepti

Mera koristi kombinaciju:

1. proverenih postojećih recepata
2. prilagođavanja postojećih recepata
3. AI generisanja novih recepata kada nema odgovarajućeg postojećeg recepta

Recept mora sadržati:

- sastojke
- količine
- način pripreme
- vreme pripreme
- broj porcija
- nutritivne vrednosti
- relevantne alergene
- nivo pouzdanosti kada postoji značajna neizvesnost

---

24. Validacija recepata

Pre prikaza korisniku recept mora proći automatsku proveru.

Proverava se:

- postojanje sastojaka
- validnost količina
- nutritivni proračun
- cilj kalorija
- proteinski cilj
- alergije
- zdravstvena ograničenja
- praktičnost
- unutrašnja konzistentnost

Ako recept ne prođe validaciju:

AI ga popravlja ili se recept odbacuje.

Ne prikazivati neproveren rezultat samo zato što ga je AI generisao.

---

25. Zamena obroka

Korisnik može zameniti obrok:

- klikom
- tekstom
- glasom

Zamena treba da uzme u obzir ostatak dnevnog plana.

Ako nova zamena značajno promeni dnevni balans, sistem može automatski predložiti prilagođavanje drugih obroka.

Korisnik potvrđuje značajne promene.

---

26. Učenje preferencija

Sistem treba da razlikuje:

„Ne volim ovo.“
→ dugoročna preferencija

„Neću ovo danas.“
→ privremena preferencija

„Nemam ovo kod kuće.“
→ dostupnost, ne odbojnost prema namirnici

„Ovo mi je preskupo.“
→ budžetsko ograničenje

Ove informacije ne smeju biti pogrešno interpretirane.

---

27. Hrana, budžet i otpad

Planiranje treba da uzima u obzir:

- cenu
- dostupnost
- pakovanja
- ostatke hrane
- mogućnost iskorišćavanja ostataka u narednim obrocima
- bacanje hrane

Ako je moguće dobiti isti nutritivni rezultat sa praktičnijom i jeftinijom namirnicom, sistem može ponuditi zamenu.

---

28. Broj obroka

Korisnik bira broj obroka koji mu odgovara.

Sistem može predložiti drugačiji raspored ako za to postoji razlog, ali korisnik odlučuje.

---

29. Vreme i zahtevnost pripreme

Mera treba da poznaje uobičajeno vreme i spremnost korisnika za kuvanje.

Korisnik može imati trajnu preferenciju:

«„Ne želim da kuvam duže od 20 minuta.“»

Ali može privremeno reći:

«„Danas imam vremena, napravi nešto komplikovanije.“»

Privremena instrukcija ne mora menjati trajnu preferenciju.

---

30. Kvalitet informacije

Mera nikada ne sme davati lažnu preciznost.

Kada je podatak pouzdan:

500 kcal

Kada je procena:

≈500 kcal — procena

Kada postoji veća neizvesnost:

480–530 kcal

Sistem mora jasno razlikovati:

- pouzdano
- dobro potvrđeno
- procenjeno
- nedovoljno pouzdano

Detaljno objašnjenje dostupno je kroz „Zašto?“.

---

31. „Zašto?“

Korisnik može otvoriti detaljno objašnjenje.

Tada može videti:

- izvor
- verziju izvora
- datum
- poreklo podatka
- da li je podatak deklarisan, meren ili procenjen
- osnovu proračuna
- razlog preporuke
- ograničenja
- nivo pouzdanosti

Ovo nije potrebno prikazivati na glavnom ekranu.

---

32. Bezbednost

Safety sistem mora biti nezavisan od AI-ja.

Mogući statusi:

- SAFE
- CAUTION
- REQUIRES_CLINICAL_REVIEW
- BLOCKED

AI ne sme moći da zaobiđe safety pravilo samo zato što je pronašao drugačiji način da formuliše zahtev.

Zdravstveno relevantne informacije moraju imati odgovarajući nivo zaštite i kontrole pristupa.

---

33. Arhitektura

Mera treba da bude modularna.

Osnovni slojevi:

User Profile

→ Food & Product Data

→ Reference / Evidence Layer

→ Deterministic Nutrition Engine

→ Energy & Nutrient Engine

→ Recipe Engine

→ Meal Planning Engine

→ Adaptation Engine

→ Safety Engine

→ AI Orchestration

→ Validation

→ User Interface

→ Audit & Versioning

AI ne sme direktno menjati kritične podatke baze bez kontrolisanog alata i validacije.

---

34. AI alati

AI treba da koristi kontrolisane funkcije, na primer:

- get_user_profile
- update_user_preference
- search_food
- get_product
- get_reference_value
- calculate_nutrition
- calculate_energy_needs
- search_evidence
- generate_recipe
- validate_recipe
- get_weight_trend
- generate_meal_plan
- validate_meal_plan

AI ne treba direktno da izvršava kritične proračune.

---

35. Memorija

Mera treba da pamti korisne dugoročne informacije.

Primeri:

- prehrambene preferencije
- omiljena jela
- alergije
- budžet
- uobičajeno vreme za kuvanje
- broj obroka
- dugoročni cilj

Ne treba čuvati svaku rečenicu korisnika samo zato što je izgovorena.

Korisnik mora imati kontrolu nad zapamćenim podacima.

---

36. Lokalizacija

Prva verzija je prvenstveno namenjena korisniku u Srbiji.

Treba podržati:

- srpski jezik
- latinicu
- ćirilicu
- RSD
- lokalne namirnice
- lokalne proizvode
- lokalna jela

Arhitektura mora od početka omogućiti kasnije:

- engleski
- nemački
- grčki
- druge jezike
- druge valute
- druge lokalne baze hrane

---

37. Komercijalna arhitektura

Prva faza je lično testiranje.

Ipak, arhitektura treba od početka biti dovoljno kvalitetna da se kasnije može razviti u komercijalni proizvod.

Ne uvoditi nepotrebnu kompleksnost samo zato što bi jednog dana mogla biti potrebna.

---

38. AI saradnja u razvoju

Mera se razvija uz saradnju više AI sistema.

AI sistemi imaju različite uloge i perspektive.

Nijedan AI nije automatski apsolutni autoritet.

AI može:

- predložiti
- analizirati
- kritikovati
- pronaći grešku
- ponuditi alternativu
- obrazložiti prednosti i rizike
- osporiti tuđe rešenje

Cilj nije dokazati da je jedan AI u pravu.

Cilj je pronaći najbolje rešenje za proizvod.

---

39. Konačna odluka

KONAČNU ODLUKU UVEK DONOSI KORISNIK / VLASNIK PROJEKTA.

Nijedan AI sistem nema ovlašćenje da samostalno donese konačnu odluku o projektu.

AI preporuke nisu naredbe.

Ako postoji neslaganje između AI sistema:

1. iznose se argumenti
2. proveravaju se činjenice
3. proveravaju se izvori
4. proveravaju se testovi
5. razmatraju se posledice
6. korisnik donosi konačnu odluku

---

40. Kontrola razvoja

Tokom razvoja treba periodično praviti kontrolni snapshot projekta.

Snapshot treba da sadrži najmanje:

- trenutnu verziju
- završene komponente
- komponente u razvoju
- nedovršene komponente
- poznate probleme
- promene u odnosu na specifikaciju
- test status
- otvorena pitanja
- značajne arhitektonske odluke

Snapshot može biti prosleđen drugom AI sistemu radi nezavisne analize.

---

41. Nezavisna revizija

Nezavisna revizija treba da proverava:

- usklađenost sa MASTER_SPECIFICATION
- arhitekturu
- poslovnu logiku
- nutritivnu metodologiju
- sigurnost
- AI ponašanje
- validaciju
- kvalitet podataka
- testove
- nepotrebna pojednostavljenja
- moguće buduće probleme

Revizija daje preporuke.

Ne menja projekat automatski.

---

42. Source of Truth

Projektna dokumentacija predstavlja osnovu projekta.

Posebno treba održavati:

- MASTER_SPECIFICATION.md
- ARCHITECTURE.md
- DATA_SOURCES.md
- NUTRITION_ENGINE.md
- AI_RULES.md
- SAFETY_RULES.md
- UI_SPEC.md
- TEST_PLAN.md
- AI_COLLABORATION.md
- CHANGELOG.md

Ako implementacija odstupa od specifikacije, odstupanje mora biti namerno i dokumentovano.

---

43. Verzije

Treba verzionisati:

- projektnu specifikaciju
- bazu hrane
- izvore
- formule
- pravila
- promptove
- AI modele
- validatore
- safety pravila
- ključne algoritme

Rezultat važnog proračuna treba da bude moguće povezati sa verzijama koje su ga proizvele.

---

44. Audit trail

Za važne odluke i rezultate sistem treba da beleži:

- vreme
- stanje korisnika
- korišćene podatke
- verziju pravila
- verziju izvora
- verziju formule
- korišćeni AI/model kada je relevantno
- pozvane alate
- rezultat validacije
- konačni rezultat

Cilj je da kasnije možemo odgovoriti na pitanje:

«„Zašto je Mera upravo ovo preporučila?“»

---

45. Testiranje

Pre ozbiljne upotrebe treba testirati:

- energetske proračune
- nutritivne proračune
- pretvaranje jedinica
- sirovo/kuvano
- recepte
- alergene
- proizvode
- barcode
- OCR
- planiranje obroka
- adaptaciju
- trend telesne mase
- safety pravila
- AI halucinacije
- pogrešne ili nepotpune podatke
- ekstremne korisničke zahteve

---

46. Red-team testovi

Posebno testirati pokušaje da AI:

- izmisli nutritivnu vrednost
- izmisli naučnu studiju
- zaobiđe safety pravilo
- koristi nepoznat proizvod kao poznat
- napravi recept sa nepostojećim sastojkom
- pogrešno protumači alergiju
- koristi pogrešan oblik namirnice
- napravi lažno precizan rezultat
- automatski promeni cilj bez dovoljnog broja podataka

---

47. AI model independence

Aplikacija ne sme biti arhitektonski vezana za jedan AI model.

Mora postojati adapter između aplikacije i AI modela.

Model može biti promenjen bez promene celog sistema.

Time Mera može koristiti različite modele u različitim zadacima ako testovi pokažu da je to korisno.

---

48. Pravilo kvaliteta

Svaka nova funkcija treba da prođe osnovno pitanje:

«Da li ova funkcija ili informacija povećava verovatnoću da korisnik uspešno ostvari svoj cilj?»

Ako odgovor nije jasan ili je negativan, funkcija ne treba da bude dodata samo zato što je tehnički zanimljiva.

---

49. Osnovna filozofija proizvoda

Mera nije napravljena da impresionira korisnika količinom tehnologije.

Mera treba da korisniku olakša ostvarivanje cilja.

Složenost treba da postoji tamo gde povećava kvalitet.

Jednostavnost treba da postoji tamo gde korisnik treba da donese odluku.

Krajnji rezultat je važniji od broja funkcija.

---

50. Konačni princip

Mera treba da bude sistem koji:

«prikuplja kvalitetne informacije → razume korisnika → koristi proverene podatke → pravi personalizovan plan → prati stvarne rezultate → uči iz njih → predlaže korekcije → korisniku daje jednostavan i praktičan način da ostvari svoj cilj.»

Sve ostalo je infrastruktura koja omogućava da ovaj proces bude što kvalitetniji, pouzdaniji i bezbedniji.

---

Radni naziv projekta

MERA

GitHub repository:

"mera"

Alternativno:

"mera-app"

Konačno komercijalno ime biće određeno naknadno i nije deo trenutne tehničke specifikacije.