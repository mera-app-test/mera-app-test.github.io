# 0003 — Korak 2: manje tehničke odluke (bez promene arhitekture)

**Datum:** 2026-09-23 · **Donosilac:** razvojni agent (manje tehničke odluke, dozvoljeno pravilima projekta)

1. **Skladišta se uvode postepeno.** Tabela u ARCHITECTURE §9 je ciljna struktura. Šema verzije 1 pravi samo `meta`, `settings`, `measurements`, `audit_events`. Ostala skladišta dodaju se numerisanim migracijama u koraku u kome se njihov entitet prvi put koristi (§10.2). Razlog: struktura entiteta (npr. profil, ciljevi) zavisi od još neodobrenih NUTRITION_ENGINE.md i SAFETY_RULES.md.
2. **`measurements` u šemi 1 ima samo tip `body_mass` (kg).** Obim struka i ostale mere dodaju se migracijom kada uđu u obuhvat.
3. **Operacija `purge` (§8.2)** uvodi se zajedno sa prvim entitetom koji je traži (MemoryItem). Do tada ChangeSet podržava `put` i `softDelete`.
4. **UnitOfWork odbija zapise drugog korisnika.** Lokalno je uvek isti korisnik, ali je provera deo ugovora koji će važiti i za server.
5. **`AuditRepository.listForEntity`** u V1 čita sve događaje i filtrira (dovoljno za jednog korisnika). Indeks se dodaje migracijom ako zatreba.
6. **Druga kartica sa novijom verzijom baze:** ova kartica zatvara bazu i osvežava se na novu verziju aplikacije.
7. **Otvaranje baze prima definiciju šeme kao parametar** (podrazumevano stvarna). Koriste je samo testovi, da provere zaštitni tok migracije probnim migracijama pre prve stvarne.
8. **Podsetnik za rezervnu kopiju prikazuje se samo kada postoje korisnički podaci** (bez podataka nema šta da se čuva).
9. **Zaštitne kopije pre migracije i uvoza** čuvaju se u posebnoj bazi `mera_safety_snapshots`, najviše 3. Deo su istog origin-a, pa ne štite od brisanja podataka sajta — od toga štiti ručni JSON izvoz.
