# 0007 — Odobren metod trenda telesne mase (NUTRITION_ENGINE.md deo T)

**Datum:** 2026-09-23 · **Donosilac:** vlasnik projekta

Odobreno T1–T6 kako je predloženo, uz dopunu T1:
- T1: dnevna vrednost = prvo merenje u danu; ako je bar jedno merenje tog dana uneto naknadno (vreme nepoznato) → prosek merenja tog dana.
- T2: 7-dnevni prosek, najmanje 4 dnevne vrednosti.
- T3: linearna regresija, kg nedeljno; 14 dana / najmanje 8, krajevi 4 dana; 28 dana / najmanje 14, krajevi 7 dana.
- T4: stopa = 28-dnevni nagib u kg nedeljno i kao % 7-dnevnog proseka.
- T5: ispod 30 kg ili iznad 300 kg — potvrda pre čuvanja, bez blokiranja.
- T6: bez automatskog izbacivanja merenja u V1.

Vrednosti su u `reference-data/formulas/trend-1.0.0.json` (verzija 1.0.0), provereno šemom pri učitavanju. Svaka izmena broja = nova verzija fajla i nova odluka.
Napomena: izvori (Turicchi 2020, Orsama 2014) potkrepljuju izbor nedeljnih prozora; konkretni pragovi su statistička procena, odobrena kao takva.
