# CHANGELOG

## 0.1.0 — korak 1 (nije objavljeno)
- Struktura slojeva prema ARCHITECTURE.md §5; prazni moduli označeni za kasnije korake.
- Automatska provera granica slojeva (dependency-cruiser + scripts/check-layers.mjs).
- TypeScript 6.0.3 umesto 7.x (dependency-cruiser ne podržava TS 7 — vidi PROVERE_V1.md #16).
- PWA ljuska: manifest, service worker (vite-plugin-pwa, autoUpdate), privremene ikone.
- Glavni ekran „Danas" sa praznim stanjem; standardni dijalog za izlaz na „nazad".
- Ekran „Provera uređaja" samo u test/dev build-u; produkcijski build proverava scripts/assert-prod-bundle.mjs.
- GitHub Actions: provera (tipovi, granice, testovi) → build → objava; okruženje po organizaciji.
- 5 automatskih testova.

## 0.1.1 — odluke posle provera
- Upisane odluke vlasnika (docs/DECISIONS/0002): §9 trajno skladište pri prvom čuvanju; USDA FDC primarni izvor (docs/DATA_SOURCES.md); AI ključ lokalno samo u V1.
- Dodata samoprovera pravila granica (`npm run lint:layers:selftest`), deo `npm run check` i CI.

## 0.2.0 — korak 2: podaci i rezervna kopija (nije objavljeno)
- Zod šeme (šema podataka v1): zajednička polja, merenje mase, audit događaj, podešavanja.
- Data portovi: repozitorijumi, ChangeSet/UnitOfWork sa optimističkom kontrolom verzije, BackupStore, tipizirane greške.
- LocalDataProvider nad IndexedDB (`idb` 8.0.3, ISC); tajne u posebnoj bazi; zaštitne kopije u posebnoj bazi (najviše 3).
- Migracioni okvir: strukturni koraci + čiste transformacije; zaštitna kopija pre migracije, provera posle, vraćanje pri neuspehu.
- JSON izvoz/uvoz: kanonski JSON, SHA-256 kontrolni zbir, provera šeme, migracija starijih kopija, zamena svih podataka uz zaštitnu kopiju i audit.
- Nedeljni podsetnik na glavnom ekranu; ekran „Rezervna kopija".
- Trajno skladište: funkcija za zahtev posle prvog stvarnog čuvanja (povezuje se sa unosom mase u koraku 3).
- Testovi: 45 (ugovorni testovi porta, migracije sa probnim v2, backup format, use case-ovi). Ugovorni testovi provereni namernim kvarom implementacije.
- Tehničke napomene: docs/DECISIONS/0003.
