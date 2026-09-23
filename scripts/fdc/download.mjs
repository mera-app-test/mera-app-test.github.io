// Preuzimanje zvaničnih FDC CSV arhiva. Adrese se čitaju sa zvanične stranice za preuzimanje,
// ne pogađaju se. Beleže se adresa, veličina i SHA-256 svake arhive.
import { createHash } from "node:crypto";
import { writeFileSync, mkdirSync, readdirSync, statSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { join } from "node:path";

const PAGE = "https://fdc.nal.usda.gov/download-datasets";
const PATTERNS = {
  foundation: /href="([^"]*foundation_food_csv[^"]*\.zip)"/i,
  srLegacy: /href="([^"]*sr_legacy_food_csv[^"]*\.zip)"/i,
};

function findFile(dir, name) {
  for (const e of readdirSync(dir)) {
    const p = join(dir, e);
    if (statSync(p).isDirectory()) { const r = findFile(p, name); if (r) return r; }
    else if (e === name) return p;
  }
  return null;
}

export async function downloadAll(workDir) {
  mkdirSync(workDir, { recursive: true });
  const html = await (await fetch(PAGE)).text();
  const out = {};
  for (const [key, re] of Object.entries(PATTERNS)) {
    const m = html.match(re);
    if (!m) throw new Error(`Na ${PAGE} nije nađena arhiva za ${key}`);
    const url = new URL(m[1], PAGE).toString();
    const res = await fetch(url);
    if (!res.ok) throw new Error(`${url}: HTTP ${res.status}`);
    const buf = Buffer.from(await res.arrayBuffer());
    const zip = join(workDir, `${key}.zip`);
    writeFileSync(zip, buf);
    const dir = join(workDir, key);
    mkdirSync(dir, { recursive: true });
    execFileSync("unzip", ["-q", "-o", zip, "-d", dir]);
    const foodCsv = findFile(dir, "food.csv");
    if (!foodCsv) throw new Error(`${key}: food.csv nije nađen u arhivi`);
    out[key] = {
      url,
      bytes: buf.length,
      sha256: createHash("sha256").update(buf).digest("hex"),
      dir: foodCsv.slice(0, -"food.csv".length),
    };
  }
  return out;
}
