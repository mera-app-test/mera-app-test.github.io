# Kontrolni snapshot — 2026-09-23 (kraj koraka 2)

**Verzija:** 0.2.1 · **Objavljeno:** https://mera-app-test.github.io/ (test) · **Produkcija:** još nije objavljena (org `mera-ishrana`, repozitorijum se pravi pri prvoj objavi)

## Završeno i testirano
- Korak 1 (§17): repo, CI (tipovi, granice slojeva + samoprovera, testovi), test okruženje na zasebnom origin-u, PWA ljuska, standardni dijalog za izlaz.
- Korak 2: Zod šeme v1, data portovi, LocalDataProvider (IndexedDB), ChangeSet/UnitOfWork, migracioni okvir sa zaštitnom kopijom, JSON izvoz/uvoz, nedeljni podsetnik, ekran „Rezervna kopija".
- Provere na uređaju vlasnika: docs/PROVERE_V1.md (sve potrebno za V1 radi; deljenje fajla ne radi i ne koristi se).
- 45 automatskih testova.

## Sledeće: korak 3 — unos telesne mase
Predlog UI čeka potvrdu vlasnika:
- na ekranu „Danas", ispod dela za plan: kartica „Masa" (poslednje merenje + dugme „Unesi masu");
- unos: jedno polje, brojčana tastatura, prihvata zarez (npr. 92,4), dugme „Sačuvaj";
- lista poslednjih merenja sa brisanjem pogrešnog unosa;
- posle prvog uspešnog upisa: zahtev za trajno skladište (DECISIONS/0002);
- trend se NE prikazuje dok vlasnik ne odobri metod i parametre (nacrt u NUTRITION_ENGINE.md, sa izvorima).

## Otvorena pitanja (nisu hitna)
- Govor na srpskom radi samo preko Google servisa (nema prepoznavanja na uređaju) — privatnost, odlučiti pre glasovnog unosa hrane.
- Izbor AI provajdera — pre koraka 7.
- Vrednosti za SAFETY_RULES.md i NUTRITION_ENGINE.md — pre koraka 5.
- Open Food Facts: licenca (ODbL) i identifikacija aplikacije — pre koraka 8.
- Kontakt sa Institutom za medicinska istraživanja (srpska baza) — paralelno.

## Način rada (dogovoreno)
- Vlasnik radi samo sa telefona; objave i sav rad na GitHub-u radi AI agent.
- Svaka izmena prvo na test adresu; produkcija tek posle odobrenja vlasnika.
- Linkovi se šalju kao običan tekst sa `?v=N`.
- Token (fine-grained, org `mera-app-test`, samo repo `mera-app-test.github.io`, važi do 22.12.2026) vlasnik šalje u svakom novom razgovoru; ne čuva se u memoriji ni u repozitorijumu.
