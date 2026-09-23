// Minimalni CSV čitač (RFC 4180: navodnici, "" unutar polja, zarez kao separator).
// Koristi se samo u alatu za uvoz FDC podataka (Node, GitHub Actions), ne u aplikaciji.
import { readFileSync } from "node:fs";

export function parseCsv(text) {
  const rows = [];
  let row = [];
  let field = "";
  let inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (inQuotes) {
      if (c === '"') {
        if (text[i + 1] === '"') { field += '"'; i++; }
        else inQuotes = false;
      } else field += c;
    } else if (c === '"') inQuotes = true;
    else if (c === ",") { row.push(field); field = ""; }
    else if (c === "\n") { row.push(field); rows.push(row); row = []; field = ""; }
    else if (c === "\r") { /* ignoriše se */ }
    else field += c;
  }
  if (field !== "" || row.length > 0) { row.push(field); rows.push(row); }
  return rows;
}

/** Čita CSV sa zaglavljem; proverava da postoje tražene kolone (inače baca grešku — uvoz se zaustavlja). */
export function readTable(path, requiredColumns) {
  const rows = parseCsv(readFileSync(path, "utf8").replace(/^\uFEFF/, ""));
  const header = rows.shift();
  for (const col of requiredColumns) {
    if (!header.includes(col)) throw new Error(`${path}: nema kolone "${col}" (zaglavlje: ${header.join(",")})`);
  }
  return rows.filter((r) => r.length === header.length).map((r) => Object.fromEntries(header.map((h, i) => [h, r[i]])));
}
