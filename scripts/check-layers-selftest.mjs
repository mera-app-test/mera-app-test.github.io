// SAMOPROVERA PRAVILA GRANICA (odobreno 2026-09-23, docs/DECISIONS/0002).
// U privremenu kopiju src/ ubacuje NAMERNA kršenja i proverava da ih dependency-cruiser prijavi.
// Ako neko pravilo prestane da hvata svoje kršenje, ova provera pada.
// Namerna kršenja postoje SAMO ovde, nikad u src/.
import { cpSync, mkdtempSync, readFileSync, rmSync, writeFileSync, appendFileSync, symlinkSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { execFileSync } from "node:child_process";

const VIOLATIONS = [
  { rule: "domain-granica", file: "src/domain/index.ts", code: 'import "../infrastructure/platform/browserProbe";\n' },
  { rule: "ui-granica", file: "src/ui/App.tsx", code: 'import "../infrastructure/platform/browserProbe";\n' },
  { rule: "ui-granica", file: "src/ui/screens/TodayScreen.tsx", code: 'import type { PlatformProbe } from "../../ports/platform/PlatformProbe";\nexport type _X = PlatformProbe;\n' },
  { rule: "react-samo-u-ui", file: "src/application/buildInfo.ts", code: 'import "react";\n' },
  { rule: "application-granica", file: "src/application/buildInfo.ts", code: 'import "../infrastructure/platform/browserProbe";\n' },
];

const root = process.cwd();
const tmp = mkdtempSync(join(tmpdir(), "mera-layers-"));
let failed = false;
try {
  for (const f of ["src", ".dependency-cruiser.cjs", "tsconfig.json", "package.json"]) cpSync(join(root, f), join(tmp, f), { recursive: true });
  symlinkSync(join(root, "node_modules"), join(tmp, "node_modules"), "dir");
  for (const v of VIOLATIONS) {
    const p = join(tmp, v.file);
    writeFileSync(p, v.code + readFileSync(p, "utf8"));
  }
  let out;
  try {
    out = execFileSync(join(root, "node_modules/.bin/depcruise"), ["src", "--config", ".dependency-cruiser.cjs", "--output-type", "json"], { cwd: tmp, encoding: "utf8", maxBuffer: 64 * 1024 * 1024 });
  } catch (e) {
    out = e.stdout;
  }
  const found = JSON.parse(out).summary.violations.map((x) => `${x.rule.name}|${x.from}`);
  for (const v of VIOLATIONS) {
    const ok = found.includes(`${v.rule}|${v.file}`);
    console.log(`${ok ? "✔" : "✘"} ${v.rule} uhvaćeno u ${v.file}`);
    if (!ok) failed = true;
  }
} finally {
  rmSync(tmp, { recursive: true, force: true });
}
if (failed) {
  console.error("✘ Neko pravilo granica ne hvata svoje namerno kršenje.");
  process.exit(1);
}
console.log("✔ Samoprovera pravila granica prošla.");
