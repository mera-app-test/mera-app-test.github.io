// Provera granica slojeva. Pada ako postoji kršenje ILI ako dependency-cruiser nije
// analizirao nijedan modul (npr. nekompatibilna verzija TypeScript-a — desilo se sa TS 7).
import { execFileSync } from "node:child_process";

let out;
try {
  out = execFileSync("npx", ["depcruise", "src", "--config", ".dependency-cruiser.cjs", "--output-type", "json"], {
    encoding: "utf8",
    maxBuffer: 64 * 1024 * 1024,
  });
} catch (e) {
  out = e.stdout;
  if (!out) throw e;
}
const result = JSON.parse(out);
const { totalCruised, violations, error } = result.summary;
const MIN_MODULES = 10;
if (totalCruised < MIN_MODULES) {
  console.error(`✘ Analizirano samo ${totalCruised} modula (očekivano ≥ ${MIN_MODULES}). Provera granica nije validna.`);
  process.exit(1);
}
if (error > 0) {
  for (const v of violations) console.error(`✘ ${v.rule.name}: ${v.from} → ${v.to}`);
  process.exit(1);
}
console.log(`✔ Granice slojeva ispravne (${totalCruised} modula).`);
