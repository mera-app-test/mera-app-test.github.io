# 0017 — Ciljni izgled prihvaćen; bez prisilnog upitnika; početni ekran samo jelovnik

**Datum:** 2026-09-26 · **Donosilac:** vlasnik projekta (odluke o proizvodu i izgledu)

1. **Sve iz prototipa ulazi u aplikaciju** (docs/UI_SPEC.md), uključujući listu za kupovinu (bez cena) i kuvanje korak po korak. Time se dopunjuje obuhvat V1 iz ARCHITECTURE §2.
2. **Prvi susret:** kratka dobrodošlica i odmah početni ekran. Nema reklama, prijave ni pitanja pre ulaska. Upitnik je opcija koju korisnik sam pokreće sa početnog ekrana („Prilagodi meni“) ili iz „Ja“; može da se prekine.
3. **Početni ekran:** zaglavlje u dva reda (dan i profil; dnevni cilj ili poziv na prilagođavanje), ispod samo predlog ishrane. Masa, nedeljni pregled i ostalo su na drugim ekranima (Napredak ima oznaku kad je pregled spreman). Donja traka ostaje; konačno rešenje kasnije.
4. **Bez mikrofona u aplikaciji.** Iskustvo iz ranijih aplikacija vlasnika: ugrađeno prepoznavanje govora radi loše, Google tastatura mnogo bolje. Razgovor je tekstualno polje; govor ide preko mikrofona tastature. Detalji kasnije.
5. Vlasnik će naknadno dodati nove zahteve.

## Posledica koju treba rešiti pri ugradnji (napomena agenta)
Pre upitnika Mera ne zna ništa o korisniku, pa jelovnik ne može biti lični. Prikazuje se kao **primer dana** i tako je jasno označen; lični cilj i bezbednosne provere (baza znanja) važe tek posle upitnika. Sadržaj primera dana (koji obroci, koje kalorije) odlučuje se u razgovoru o hrani i receptima.

## Dopuna (isti dan): obrazac početnog ekrana kao u Troškovima i Kućnoj apoteci
Vlasnik je pokazao početne ekrane svojih aplikacija kao uzor. Mera preuzima isti raspored:
- **Red 1:** naziv „Mera“ + četiri dugmeta-ikonice: nedelja, kupovina, napredak (tačka kad je nedeljni pregled spreman), podešavanja.
- **Red 2:** zbir dana (pojedeno od ≈ cilja, broj obroka) ili, pre upitnika, „primer dana — Prilagodi meni“.
- **Lista:** obroci kao kartice (tanjir, naziv, obrok i vreme, oznaka sa kalorijama desno; zelena sa ✓ kad je pojedeno). Dodir otvara recept sa „Pojeo sam“, „Zameni“ i „Kuvaj korak po korak“.
- **Dno:** polje „ukucaj ili koristi mikrofon na tastaturi…“ + red: razgovor, pošalji, dodaj (pojeo sam nešto drugo, masa, barkod).
- **Donja traka sa karticama se ukida.** Nedelja, kupovina, napredak i podešavanja su posebni ekrani sa strelicom nazad; podešavanja su lista stavki sa ikonicom i strelicom.
