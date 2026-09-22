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
