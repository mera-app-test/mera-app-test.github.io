# AI_RULES — pravila za AI (razvoj i aplikacija)

**Status:** odobreno 2026-09-23 (DECISIONS/0010). Važi za svaki AI sistem koji radi na Meri i za AI unutar aplikacije.

## 1. Izvori za ishranu, zdravlje i bezbednost (razvoj)
Dozvoljeni, po redu pouzdanosti:
1. Zvanične ustanove i propisi: SZO/WHO, FAO, EFSA, NIH, USDA, propisi Republike Srbije.
2. Kliničke smernice stručnih udruženja; sistematski pregledi i meta-analize u recenziranim časopisima.
3. Pojedinačne recenzirane studije — samo kao dopuna, nikad jedini oslonac za pravilo ili broj.

Isključeno: forumi, blogovi, sajtovi sa kalkulatorima, Wikipedia, prodajni i „wellness" sajtovi, AI generisani tekstovi. Mogu pomoći da se pronađe primarni izvor, ali se nikad ne navode kao osnova.

Obaveze:
- Uz svaku tvrdnju: izvor i da li je pročitan **original** ili samo tekst koji ga citira. Sekundarni navod se proverava u originalu pre ugradnje.
- Ako postoje samo isključeni izvori: tvrdnja se ne predstavlja kao činjenica — piše se „pouzdan izvor nije nađen".
- Ništa se ne izmišlja: podatak, izvor, naslov, broj, rezultat.
- Razumna preciznost (DECISIONS/0009) i praktična naučna utemeljenost (DECISIONS/0015): za uobičajenu preporuku dovoljan je jedan kredibilan izvor ako nema značajnog neslaganja; strože (smernica ili dva izvora) samo kod stvarnog rizika po zdravlje, neizvesnosti koja menja preporuku ili ozbiljnog neslaganja. Neblokirajuća pitanja se evidentiraju u docs/OTVORENA_PITANJA.md i razvoj ide dalje.

## 2. AI unutar aplikacije (korisnik)
- **Ne pretražuje internet.** Odgovara samo iz proverenih podataka i pravila Mere (baza namirnica, formule, bezbednosna pravila, proverena objašnjenja sa izvorom) — MS §6, §33, §34.
- Pitanje koje nije pokriveno: „ne znam". Zdravstveno pitanje van pokrivenog: upućuje na lekara.
- Brojeve (kalorije, nutrijenti, ciljevi) nikad ne računa ni ne navodi sam — dobija ih od determinističkih alata.
- Korisniku postavlja samo pitanja bez kojih plan nije tačan ili bezbedan (DECISIONS/0009).
