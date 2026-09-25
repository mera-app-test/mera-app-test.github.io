# 0016 — Upitnik osnovnog nivoa i dnevni cilj: manje tehničke odluke

**Datum:** 2026-09-24 · **Donosilac:** razvojni agent (manje tehničke odluke u okviru odobrene arhitekture; vlasnik može da promeni)

1. **Novo skladište `profile_snapshots`, šema podataka 2.** Strukturni korak + migracija podataka (dodaje prazan niz; postojeći podaci se ne menjaju). Stariji backup (šema 1) se uvozi preko iste migracije. Ispravljena greška mehanizma: pre migracije čita se samo skladište koje postoji u staroj verziji baze (inače bi pokretanje na telefonu palo).
2. **ProfileSnapshot = odgovori po ključu činjenice iz baze znanja** + rezultat proračuna u trenutku čuvanja (verzija baze, bezbednosni status, trag stavki i verzija, cilj). Svaka izmena = nov snapshot; važeći je poslednji. Stari rezultati zadržavaju verziju po kojoj su nastali (ARCHITECTURE §10.4); kada se baza promeni, Danas nudi „Preračunaj".
3. **Masa iz upitnika i merenja su isti podatak.** Upitnik predlaže poslednje merenje; ista vrednost → snapshot pokazuje na to merenje; drugačija → isti ChangeSet upisuje merenje za danas. Cilj se računa po masi potvrđenoj u upitniku i **ne menja se sam od sebe** posle svakog merenja (MS §11); promena ide kroz izmenu odgovora, kasnije kroz adaptaciju.
4. **Brisanje odgovora (MS §8)** = softDelete svih snapshot-ova sa uklonjenim sadržajem (odgovori, rezultat, veza na merenje). Merenja mase ostaju. Ovim je pokriven „purge" iz ARCHITECTURE §8.2 za ovaj entitet.
5. **HealthProfile (ARCHITECTURE §8.4) se izdvaja u koraku AI razgovora.** Do tada zdravstveni odgovor (trudnoća/dojenje) stoji u snapshot-u; čita ga samo deterministički evaluator. Kada AI dobije pristup profilu, dobija samo izvedene oznake.
6. **Godine se čuvaju kako su unete** (ne datum rođenja); zastarevanje za godinu dana je u OTVORENA_PITANJA.
7. **Prikaz:** potrošnja i cilj su procene → „≈" i zaokruženo na 10 kcal (display 1.0.0); izabrani manjak je tačan broj. ITM se ne prikazuje (E-006, E-011: samo bezbednosna provera). U „Zašto?" od objašnjenja samo X-001.
8. **Bezbednost u toku upitnika:** čim se aktivira BLOCKED ili REQUIRES_CLINICAL_REVIEW, upitnik prelazi na pregled sa porukom iz baze; takvi odgovori mogu da se sačuvaju (Danas prikazuje poruku, nema cilja). Bez prepreke, čuvanje traži sve obavezne odgovore.
9. **Application sloj zna ključeve činjenica** `massKg, goal, targetKcal, tdeeKcal, deficitKcal, weeklyLossKg` (profileService `KB_KEYS`); testovi nad pravim fajlom baze padaju ako ih nova verzija baze promeni.
