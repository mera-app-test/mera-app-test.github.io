# 0011 — AI se vezuje za proverenu bazu znanja, ne obučava se na njoj

**Datum:** 2026-09-23 · **Donosilac:** vlasnik projekta

- AI u Meri se **ne obučava** (fine-tuning) na podacima Mere. Obučavanje uči obrasce, ne garantuje činjenice i gubi trag odakle je tvrdnja.
- Umesto toga, pre svakog odgovora AI dobija tačno one stavke iz proverene baze znanja i baze namirnica/recepata koje se odnose na pitanje; odgovara samo iz njih; uz odgovor se beleži koje su stavke korišćene („Zašto?", MS §31, §44).
- Brojeve daju deterministički alati (MS §9, §22). Ako baza nema odgovor — „ne znam" / lekar (AI_RULES.md §2).
- Ispravka baze odmah važi, bez ponovnog obučavanja; svaka verzija baze je verzionisana (MS §43).
- Granica: AI sa bazom pokriva ono što je u bazi; bolesti, lekovi i poremećaji ishrane idu stručnjaku (Safety).
- Predlog za kasnije: pre komercijalne faze sadržaj baze pregleda diplomirani nutricionista-dijetetičar.
