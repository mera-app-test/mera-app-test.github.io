# DATA_SOURCES — izvori nutritivnih podataka

**Status:** odobreno za V1 (docs/DECISIONS/0002). Uvoz podataka počinje u koraku 4 (ARCHITECTURE §17).

## Pravila
- Hijerarhija i isključeni izvori: docs/AI_RULES.md §1 (DECISIONS/0010).
- AI nikad nije izvor nutritivne vrednosti (MS §6, §20).
- Svaka vrednost ima izvor, verziju izvora, datum i nivo pouzdanosti (ARCHITECTURE §8.4).
- Vrednost bez navedenog i proverljivog izvora se ne unosi.

## Izvori

| Izvor | Uloga u V1 | Licenca | Obaveze | Status |
|---|---|---|---|---|
| USDA FoodData Central | primarni izvor za generičke namirnice | CC0 1.0 (javno dobro) | navesti FoodData Central kao izvor; preporučeno obavestiti USDA o upotrebi | odobreno |
| Ručno kurirane lokalne namirnice | dopuna za srpske namirnice/jela | zavisi od izvora | za svaku vrednost naveden i proverljiv izvor (npr. deklaracija proizvođača, objavljena studija) | odobreno uz uslov |
| Srpska baza sastava namirnica (Institut za medicinska istraživanja) | nije u V1 | nije javno licencirana (deo DAP platforme) | pristup samo dogovorom | istražuje se paralelno |
| Open Food Facts | proizvodi po barkodu (korak 8) | ODbL (potvrditi na zvaničnom sajtu) | atribucija; share-alike za izvedene baze | provera licence pre koraka 8 |

## Dodatni izvori (korak 4 — odobreno, DECISIONS/0008)

| Izvor | Uloga | Licenca | Status |
|---|---|---|---|
| FDC Foundation Foods + SR Legacy (unutar FDC) | Foundation prvo, SR Legacy za kuvane oblike i dopunu po istom NDB broju | CC0 1.0 | odobreno; uvezeno Foundation 2026-04-30 + SR Legacy 2018-04 |
| USDA Table of Cooking Yields for Meat and Poultry, Release 2 (2014), doi:10.15482/USDA.ADC/1409031 | faktori prinosa za meso i živinu | javno dobro (američka državna publikacija) | odobreno; još nije korišćen |
| Bognár A. (2002), BFE-R--02-03, Bundesforschungsanstalt für Ernährung | faktori prinosa za ostale grupe | nije navedena; u V1 pojedinačni faktori uz citat, proveriti pre komercijalne faze | odobreno; još nije korišćen |
| Pravilnik o deklarisanju, označavanju i reklamiranju hrane (RS), Prilog 13 | faktori za izračunavanje energije (isti kao EU 1169/2011) | propis | odobreno (N4-A); tekst proveren 2026-09-23 |

## Otvoreno
- Kontakt sa Institutom za medicinska istraživanja (CENM) — uslovi pristupa i licenca.
- Open Food Facts: način identifikacije aplikacije iz pregledača (User-Agent se ne može postaviti).
