# 0012 — Baza znanja kao osnova; novi redosled rada

**Datum:** 2026-09-23 · **Donosilac:** vlasnik projekta

Suština aplikacije su dve proverene baze — znanje (telesna masa, ishrana, medicina) i recepti — povezane tako da korisniku sve bude jednostavno. Upitnik (nivoi osnovni/detaljni/napredni, MS §9) izvodi se iz baze znanja; pitanje postoji samo ako ga koristi neko pravilo.

Novi redosled (menja ARCHITECTURE §17 od koraka 5; urađeno ostaje):
1. Baza znanja — mehanizam (urađeno u 0.5.0) i prva verzija sadržaja, pravilo po pravilo.
2. Upitnik osnovnog nivoa iz baze + dnevni cilj na ekranu Danas.
3. Baza recepata + dopuna namirnica (o hrani poseban razgovor).
4. Planer: jelovnik, zamena obroka.
5. AI razgovor vezan za obe baze.
6. Unos hrane, barkod, adaptacija.

Deo E iz NUTRITION_ENGINE.md prenet je u bazu znanja 0.1.0 kao PREDLOG (E-001…E-006, S-001…S-003, X-001); otvorena pitanja iz razgovora (isti manjak za sve, mišići, brzina, izvori koji nisu provereni u originalu) rešavaju se tu, stavku po stavku.
