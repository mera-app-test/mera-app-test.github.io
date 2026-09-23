# 0005 — Način rada: prvo napravi, pa koriguj

**Datum:** 2026-09-23 · **Donosilac:** vlasnik projekta

Za izgled i tok korišćenja (UI/UX) AI agent ne traži odobrenje unapred. Pravi rešenje kako ga je zamislio, objavljuje ga na test adresu, a vlasnik ga pregleda na telefonu i traži korekcije.

## Ne važi za (i dalje traži obrazloženje, izvore i odobrenje pre implementacije)
- formule, pragove i parametre (energija, trend, adaptacija, tolerancije);
- bezbednosna pravila (SAFETY_RULES.md);
- izvore nutritivnih podataka;
- promene odobrene arhitekture i ključne projektne odluke.

Obrazloženje: kod UI-ja je pogled na gotov ekran brži i pouzdaniji od opisa. Kod brojeva i pravila „napravi pa vidi" bi značilo ugraditi neproverene vrednosti, što je suprotno MS §6, §9 i §32.

Sve izmene idu prvo na test adresu; produkcija tek posle odobrenja vlasnika.
