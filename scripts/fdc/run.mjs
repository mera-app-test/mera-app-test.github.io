// Ulaz alata za uvoz FDC podataka (NUTRITION_ENGINE.md N6). Pokreće se u GitHub Actions.
//   node scripts/fdc/run.mjs kandidati <izlazni-dir>
//   node scripts/fdc/run.mjs uvoz <izlazni-dir>
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { join } from "node:path";
import { downloadAll } from "./download.mjs";
import { loadDataset } from "./load.mjs";
import { verifyNutrientTable } from "./nutrients.mjs";
import { findCandidates, candidatesMarkdown } from "./candidates.mjs";
import { buildFoods } from "./build.mjs";

const [stage, outDir] = process.argv.slice(2);
if (!["kandidati", "uvoz"].includes(stage) || !outDir) {
  console.error("Upotreba: run.mjs kandidati|uvoz <izlazni-dir>");
  process.exit(2);
}
mkdirSync(outDir, { recursive: true });
const here = new URL(".", import.meta.url).pathname;
const sources = await downloadAll("/tmp/fdc");
const datasets = [loadDataset("foundation", sources.foundation.dir), loadDataset("srLegacy", sources.srLegacy.dir)];
const errors = datasets.flatMap(verifyNutrientTable);
const meta = Object.fromEntries(Object.entries(sources).map(([k, v]) => [k, { url: v.url, bytes: v.bytes, sha256: v.sha256 }]));
writeFileSync(join(outDir, "izvori.json"), JSON.stringify({ sources: meta, nutrientTableErrors: errors }, null, 2));
if (errors.length) { console.error(errors.join("\n")); process.exit(1); }

if (stage === "kandidati") {
  const queries = JSON.parse(readFileSync(join(here, "queries.json"), "utf8"));
  writeFileSync(join(outDir, "kandidati.md"), candidatesMarkdown(findCandidates(datasets, queries), meta));
} else {
  const selection = JSON.parse(readFileSync(join(here, "selection.json"), "utf8"));
  const { file, report } = buildFoods(datasets, selection, meta);
  writeFileSync(join(outDir, `foods-${selection.version}.json`), JSON.stringify(file, null, 1));
  writeFileSync(join(outDir, `izvestaj-${selection.version}.md`), report);
}
console.log("Gotovo:", stage);
