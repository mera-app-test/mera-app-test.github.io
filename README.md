# Mera

Personalizovano upravljanje telesnom masom kroz ishranu. V1: lična upotreba, podaci lokalno na telefonu.

- Specifikacija: `docs/MASTER_SPECIFICATION.md`
- Arhitektura (odobrena): `docs/ARCHITECTURE.md`
- Provere pre implementacije: `docs/PROVERE_V1.md`
- Izmene: `docs/CHANGELOG.md`

## Okruženja
| Okruženje | Adresa | Repozitorijum |
|---|---|---|
| Test | https://mera-app-test.github.io/ | mera-app-test/mera-app-test.github.io |
| Produkcija | https://mera-ishrana.github.io/ | mera-ishrana/mera-ishrana.github.io |

Tok: izmena ide u test → vlasnik proveri na telefonu → isti commit ide u produkciju.

## Komande
- `npm run check` — tipovi, granice slojeva, testovi
- `MERA_ENV=test npm run build` / `MERA_ENV=prod npm run build`
