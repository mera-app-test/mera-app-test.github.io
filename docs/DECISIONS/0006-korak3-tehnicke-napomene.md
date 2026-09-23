# 0006 — Korak 3 (unos mase): manje tehničke odluke

**Datum:** 2026-09-23 · **Donosilac:** razvojni agent (manje tehničke odluke, bez promene arhitekture)

1. **Clock port dobija `isoAtLocalDate(localDate)`** — za unos mase za raniji dan. Vreme dana je trenutno vreme, pa se za naknadne unose vreme ne prikazuje (`timeKnown: false`). Tačno vreme se ne izmišlja.
2. **Budući dan se odbija**; raniji dan je dozvoljen (upis starijih merenja sa vage).
3. **Više merenja u jednom danu se čuva**; koje se koristi za trend odlučuje NUTRITION_ENGINE.md T1.
4. **Brisanje merenja je meko** (ARCHITECTURE §8.2), preko ChangeSet-a sa audit zapisom, uz potvrdu u aplikaciji.
5. **Provera unosa bez opsega** dok vlasnik ne odobri NUTRITION_ENGINE.md T5. Proverava se samo oblik broja: zarez ili tačka, najviše 2 decimale, > 0.
6. **Lokalni datumi** (`domain/time`) — čiste funkcije za računanje dana; biće potrebne i trendu.
7. **Lista na ekranu „Masa" prikazuje 90 dana** — samo prikaz, ne utiče na proračune.
8. **fast-check 4.10.2 (MIT)** dodat u razvojne zavisnosti — predviđen u ARCHITECTURE §4, prvi put korišćen ovde.
