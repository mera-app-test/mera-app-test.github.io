# UI_SPEC — ciljni izgled i tok Mere

**Status:** prihvaćeno uz izmene (DECISIONS/0017), prototip 0.6.4. Prototip: `public/prototip.html` → https://mera-app-test.github.io/prototip.html
Prototip je samo izgled i tok. Svi brojevi, jela i merenja u njemu su izmišljeni primeri (piše na vrhu ekrana). Ne koristi kod ni podatke aplikacije. **Ukloniti pre prve objave na produkciju.**

## Zašto
Vlasnik (2026-09-25): delovi aplikacije ne čine celinu; pre testiranja pojedinačnih ekrana treba videti kako Mera izgleda na kraju. Zato prvo celovit prototip, pa se prava aplikacija preslaže prema njemu.

## Struktura
Donja traka: **Danas · Nedelja · [mikrofon] · Kupovina · Napredak**. Profil („Ja“) preko inicijala gore desno.
- **Dobrodošlica:** jedna rečenica i „Uđi“ → odmah Danas. Bez prijave i pitanja.
- **Upitnik (opcija, pokreće ga korisnik: „Prilagodi meni“ na Danas ili iz „Ja“; 6 koraka, može da se prekine):** cilj → pol, godine, visina, masa (trudnoća samo za žene) → kretanje → tempo i željena masa → broj obroka, šta ne jede, vreme za kuvanje → rezultat sa „Zašto?“.
- **Danas:** zaglavlje u dva reda — (1) „Danas“, datum, profil; (2) „pojedeno od ≈ cilj“ sa trakom, a pre upitnika „Ovo je primer dana. Prilagodi meni“. Ispod samo obroci kao tanjiri (naziv, kcal), kvačica „pojeo sam“ (PLANNED ≠ REPORTED, MS §12) i „Zameni“.
- **Recept (list odozdo):** tanjir, vreme, kcal i makronutrijenti, sastojci u gramima, koraci, „Kuvaj korak po korak“, „Zašto?“.
- **Zamena:** 3 opcije koje se uklapaju u dan + brzi filteri + glas.
- **Nedelja:** 7 dana, ostaci se koriste sledeći dan, nova nedelja jednim dodirom.
- **Kupovina:** lista iz jelovnika po odeljcima prodavnice, zaokruženo na pakovanja, čekiranje.
- **Napredak:** dnevna merenja + linija trenda, 3 broja, nedeljni pregled sa predlogom (korisnik prihvata).
- **Razgovor:** dugme u sredini donje trake; tekstualno polje, govor preko mikrofona tastature (bez ugrađenog prepoznavanja govora); predlozi rečenica; odgovor uvek kao konkretan predlog sa „Prihvati“.
- **Ja:** cilj, šta Mera pamti (vrsta: trajno / samo danas / navika) sa brisanjem, rezervna kopija, AI ključ, izvori.

## Šta je uzeto od koga (izvor: zvanične stranice i prodavnice aplikacija)
| Radnja | Uzor | Šta preuzimamo |
|---|---|---|
| Nedeljni pregled i prilagođavanje cilja | MacroFactor (help.macrofactorapp.com, App Store) | posle nedelje podataka pregled sa predlogom; procena potrošnje iz trenda mase i unosa; bez obaveze savršenog pridržavanja |
| Automatski jelovnik, zamena jednog obroka | Eat This Much (Google Play, App Store) | ceo dan/nedelja se pravi sam; pojedinačan obrok se menja jednim dodirom |
| Lista za kupovinu, režim kuvanja | Mealime (mealime.com, Google Play) | lista iz jelovnika po odeljcima prodavnice; kuvanje korak po korak |
| Namerno izostavljeno | — | kvizovi, motivaciona pitanja, bedževi, reklame, fotografija tanjira (MS §17) |

## Dizajn
Boje: bor zelena #1F4A40 (ista kao do sada), svetla podloga #F3F6F4, šafran #F0B23E za jedno važno dugme. Font Onest (latinica i ćirilica). Tanjiri u pastelnim bojama kao prepoznatljiv znak. Kontrole najmanje 44–54 px.

## Obuhvat
Lista za kupovinu i kuvanje korak po korak ulaze u V1 (DECISIONS/0017). Nedeljni pregled: oblik je UI; kada i koliko se cilj menja su pravila adaptacije (odobrava se posebno, DECISIONS/0005).
