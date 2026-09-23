# 0013 — Kriterijumi za bazu znanja i slojevi provere

**Datum:** 2026-09-23 · **Donosilac:** vlasnik projekta

Vlasnik postavlja kriterijume i odlučuje o proizvodu; ne proverava stručni sadržaj pojedinačnih pravila. Cilj: što veća i referentnija baza.

## Kriterijumi (važe za svako pravilo)
1. Samo dozvoljeni izvori, pročitani u originalu (AI_RULES §1, DECISIONS/0010).
2. Opšte prihvaćeno: pravilo potvrđuje zvanična smernica **ili** bar dva nezavisna pouzdana izvora (nivo 1–2). Jedna studija nije dovoljna.
3. Kad se izvori ne slažu — opreznija varijanta, uz zapis zašto.
4. Bezbednost ima prednost; u sumnji plan se ne pravi.
5. Razumna preciznost (DECISIONS/0009).

## Slojevi provere
1. **Kriterijumi** — odobreni ovom odlukom.
2. **Razvojni agent** primenjuje kriterijume (izvori, originali, šta koji izvor potvrđuje); automatske provere u build-u.
3. **Nezavisna provera drugog AI sistema** (MS §38, §41): da li izvori zaista potvrđuju pravilo.
4. **Diplomirani nutricionista-dijetetičar** — pregled i potpis pre nego što Meru koristi iko osim vlasnika.

Pravila koja prođu slojeve 1–3 smeju se koristiti u ličnoj fazi (samo vlasnik). Za druge korisnike obavezan je sloj 4 (produkcijski build to proverava kada se uvedu korisnici van vlasnika).

## Odobravanje
Vlasnik ne odobrava sadržaj pravila; dobija kratak izveštaj (šta ispunjava kriterijume, rezultat nezavisne provere, šta je otvoreno) i odlučuje samo o pitanjima proizvoda (npr. da li korisnik bira brzinu mršavljenja).

## Izgled i tokovi
O izgledu i tokovima odlučuje vlasnik, uz predloge i savete razvojnog agenta (dopuna DECISIONS/0005: agent i dalje pravi i objavljuje na test, vlasnik odlučuje).
