# MERA — Procena pristupa: lokalni podaci u V1, server kasnije

**Verzija dokumenta:** 0.1 (analiza, nije odobreno)
**Odnosi se na:** MERA_TEHNICKI_PREDLOG v0.1 (predlog serverske V1)
**Predlog vlasnika:** Mera V1 je lično testirana aplikacija na telefonu vlasnika, bez obaveznog servera. Arhitektura mora biti modularna, sa jasnom granicom između UI-ja, domenske logike, AI sloja, validacije/Safety Engine-a i data sloja, tako da se LocalDataProvider kasnije može zameniti ServerDataProvider-om (PostgreSQL) bez prepravke cele aplikacije.

Oznaka **[PROVERITI]** znači da tvrdnju treba potvrditi u zvaničnoj dokumentaciji pre odluke.

---

## Zaključak

Predlog vlasnika je bolji od prvobitnog predloga za ovu fazu. Tvrdnja iz v0.1 da je server „nužan" u V1 bila je prejaka. Za ličnu upotrebu na jednom telefonu, server donosi troškove i složenost bez srazmerne koristi, što je suprotno MS §37. Uz nekoliko odluka koje se moraju doneti odmah, kasniji prelazak na server ostaje ograničen na data sloj.

---

## 1. Da li je arhitektura tehnički dobra?

Da. To je standardni obrazac: domenska logika definiše interfejse (repozitorijume) koje data sloj implementira. UI, AI sloj, validacija i Safety Engine razgovaraju samo sa tim interfejsima.

Jedan uslov odlučuje da li će ovo zaista raditi: interfejs mora biti dizajniran prema zahtevima servera, a ne prema tome kako se najlakše radi lokalno. Ako se lokalna implementacija piše „prirodno" (sinhroni pozivi, pretpostavka da operacija uvek uspe, filtriranje podataka u UI-ju), apstrakcija postoji samo na papiru i prelazak postaje rekonstrukcija.

Dodatna prednost: deterministički moduli (nutrition, energy, trend, safety), pisani kao čiste funkcije, mogu se kasnije bez izmene pokrenuti i na serveru. Za njih lokacija izvršavanja nije bitna.

---

## 2. Šta bi realno zahtevao prelazak LocalDataProvider → ServerDataProvider?

Pod uslovom da se poštuju odluke iz tačke 3:

- **Menja se:** implementacija repozitorijuma (nova klasa umesto postojeće) i alat za jednokratnu migraciju lokalnih podataka na server.
- **Ne menja se:** UI, domenska logika, validacija, Safety Engine, AI orkestracija.
- **Dodaje se kao nova funkcionalnost, nezavisno od arhitekture:** prijava korisnika, sigurnost pristupa, eventualno offline rad sa sinhronizacijom i rešavanje konflikata između uređaja.

Poslednju stavku ne treba potceniti. Zamena providera pokriva čuvanje podataka. Nalozi i sinhronizacija na više uređaja su novi posao koji nijedna apstrakcija ne može unapred uštedeti. V1 samo ne sme ništa uraditi što bi taj posao onemogućilo.

Grubo: prelazak je veći posao na data sloju, ali ne i prepravka aplikacije. Tačnija procena nije moguća bez postojećeg koda.

---

## 3. Odluke koje moraju biti donete sada

1. **Svi pozivi data sloja su asinhroni**, čak i kada lokalna implementacija ne mora da bude. Ovo je najskuplja greška ako se propusti.
2. **Repozitorijumi po domenskom entitetu** (npr. `MeasurementRepository`, `MealPlanRepository`), a ne generičko „sačuvaj ključ". Upiti se izražavaju domenski („merenja od–do"), ne preko mehanizma skladišta.
3. **Definisane greške u interfejsu** (nije pronađeno, konflikt, nedostupno). Lokalno se retko javljaju, ali UI i orkestracija moraju ih već obrađivati.
4. **UUID kao identifikator**, generisan na klijentu. Nikada redni brojevi.
5. **Polja potrebna budućem serveru u svakom zapisu**, iako sada nisu korišćena: `userId`, `createdAt`/`updatedAt` (UTC), verzija zapisa i meko brisanje umesto fizičkog.
6. **Verzija šeme i migracije od prvog dana.** Svaka promena strukture podataka ide kroz numerisanu migraciju.
7. **IndexedDB, ne localStorage.** Kapacitet, asinhroni rad i struktura odgovaraju budućem serveru.
8. **Referentni podaci (baza hrane, formule, pravila) odvojeni od korisničkih.** Isporučuju se kao verzionisani fajlovi uz aplikaciju, samo za čitanje. Na serveru kasnije postaju tabele, bez uticaja na ostatak sistema.
9. **Svaki proračun beleži verziju aplikacije i engine-a.** Lokalno postoji rizik da keširana stara verzija aplikacije nešto izračuna, pa audit mora to pokazati.
10. **Izvoz i uvoz svih podataka u JSON.** To je istovremeno rezervna kopija i gotov alat za kasniju migraciju na server.
11. **Zaseban origin za Meru.** Postojeće aplikacije vlasnika na `zoki02122.github.io` dele isti origin, a IndexedDB i localStorage vezani su za origin. Brisanje podataka sajta zbog druge aplikacije obrisalo bi i Meru — to se već desilo sa dve ranije aplikacije. Rešenje: poseban domen ili hosting koji svakom projektu daje poseban poddomen. **[PROVERITI]** konkretnu opciju pre odluke.

---

## 4. Šta ipak serverski u V1?

Ništa nije striktno neophodno. Dve stvari zahtevaju svesnu odluku.

**AI API ključ.**
- Ključ u klijentskom kodu na javnom GitHub repozitorijumu je stvaran rizik i ne sme se koristiti.
- Ključ koji vlasnik unese u podešavanja aplikacije i koji se čuva lokalno na njegovom telefonu je prihvatljiv rizik za jednog korisnika.
- Mali proxy (serverless funkcija na besplatnom nivou) je bezbednija opcija, ali nije obavezna za V1. Za komercijalnu fazu postaje obavezna.

**Rezervna kopija podataka.** Ovo je najveći realni rizik lokalnog pristupa. Bez servera predlažu se tri mere:
- zahtev pregledaču za trajno skladište (`navigator.storage.persist()`) — **[PROVERITI]** ponašanje u Chrome-u na ciljnom uređaju;
- zaseban origin (tačka 3.11);
- redovan izvoz u fajl uz podsetnik u aplikaciji.

Automatski backup na cloud (npr. Google Drive) moguć je bez sopstvenog servera, ali zahteva OAuth. Predlog: ostaviti za kasnije.

**Barkod:** upit ka Open Food Facts moguć je direktno iz pregledača ako njihov API to dozvoljava — **[PROVERITI]** CORS i uslove korišćenja. Ako ne, to je prvi kandidat za mali proxy.

---

## 5. Šta gubimo u odnosu na serversku V1?

- **Automatski backup i rad na više uređaja.** Delimično nadoknađeno izvozom; za jednog korisnika sa jednim telefonom prihvatljivo.
- **Zaštita AI ključa.** Prihvatljivo za lično korišćenje (tačka 4).
- **Neizmenljiv audit.** Lokalni audit se tehnički može izmeniti. Za ličnu fazu nije problem; važnost dolazi sa drugim korisnicima.
- **Zakazane kontrolne tačke.** Bez servera nema pozadinskih poslova, ali adaptacija se može proveriti pri otvaranju aplikacije. Za nedeljni ritam to je dovoljno.

**Dobici lokalnog pristupa:**
- zdravstveni podaci ostaju na telefonu vlasnika (osim onoga što se šalje AI-ju);
- nema troškova ni održavanja servera;
- aplikacija radi bez mreže, osim AI dela.

Ništa što je ključno za suštinu Mere — tačni proračuni, validacija, Safety Engine, adaptacija — ne zavisi od servera. Sve to je deterministička logika koja radi jednako na telefonu.

---

## Otvorena pitanja za vlasnika

1. Da li se prihvata čuvanje AI ključa lokalno na telefonu u V1, ili se odmah pravi mali proxy?
2. Koja opcija za zaseban origin (poseban domen ili drugi hosting)?
3. Koliko često podsetnik za izvoz rezervne kopije?
4. Da li automatski cloud backup ulazi u V1 ili kasnije?

*Kraj dokumenta. Analiza namenjena nezavisnoj reviziji (MS §41). Ne menja specifikaciju.*
