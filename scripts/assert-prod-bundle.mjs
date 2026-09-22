// Proverava da produkcijski build ne sadrži kod za proveru uređaja (samo TEST verzija).
// Pokreće se u CI posle build-a kada je MERA_ENV=prod.
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";

const FORBIDDEN = ["mera_diag", "openfoodfacts", "mera-diag-test-file", "SpeechRecognition"];

function walk(dir) {
  return readdirSync(dir).flatMap((name) => {
    const p = join(dir, name);
    return statSync(p).isDirectory() ? walk(p) : [p];
  });
}

const files = walk("dist").filter((f) => /\.(js|html|css|webmanifest)$/.test(f));
const hits = [];
for (const f of files) {
  const text = readFileSync(f, "utf8");
  for (const word of FORBIDDEN) if (text.includes(word)) hits.push(`${f}: "${word}"`);
  if (/browserProbe|DiagnosticsScreen-/.test(f)) hits.push(`${f}: nedozvoljen fajl`);
}
const manifest = JSON.parse(readFileSync("dist/manifest.webmanifest", "utf8"));
if (manifest.name !== "Mera") hits.push(`manifest.name = "${manifest.name}" (očekivano "Mera")`);

if (hits.length) {
  console.error("✘ Produkcijski build sadrži test kod:\n  " + hits.join("\n  "));
  process.exit(1);
}
console.log(`✔ Produkcijski build čist (${files.length} fajlova provereno).`);
