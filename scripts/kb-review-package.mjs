// Pravi paket za nezavisnu proveru baze znanja drugim AI sistemom (sloj 3, DECISIONS/0013).
//   node scripts/kb-review-package.mjs reference-data/knowledge/knowledge-X.json > docs/REVIZIJA/kb-X.md
import { readFileSync } from "node:fs";

const kb = JSON.parse(readFileSync(process.argv[2], "utf8"));
const facts = Object.fromEntries(kb.facts.map((f) => [f.key, f.label]));
const expr = (e) =>
  "const" in e ? String(e.const)
  : "fact" in e ? facts[e.fact] ?? e.fact
  : "byFact" in e ? `[${facts[e.byFact.fact] ?? e.byFact.fact}: ${Object.entries(e.byFact.values).map(([k, v]) => `${k}=${v}`).join(", ")}]`
  : `${e.op}(${e.args.map(expr).join(", ")})`;
const cond = (c) => ("all" in c ? `(${c.all.map(cond).join(" I ")})` : "any" in c ? `(${c.any.map(cond).join(" ILI ")})` : `${facts[c.fact] ?? c.fact} ${c.op} ${JSON.stringify(c.value)}`);

const out = [
  `# Nezavisna provera baze znanja Mere — verzija ${kb.version}`,
  "",
  "## Uputstvo za recenzenta (AI sistem)",
  "Ti si nezavisni recenzent. Za SVAKU stavku ispod proveri:",
  "1. Da li navedeni izvori (otvori URL/DOI; ne oslanjaj se na sećanje) zaista potvrđuju tvrdnju i brojeve — tačno onako kako piše.",
  "2. Da li je tvrdnja opšte prihvaćena u struci (zvanična smernica ili bar dva nezavisna pouzdana izvora: zvanične ustanove, stručne smernice, sistematski pregledi).",
  "3. Da li postoji novija ili važnija smernica koja kaže drugačije.",
  "4. Da li je bezbednosno pravilo dovoljno oprezno.",
  "Ne koristi forume, blogove, sajtove sa kalkulatorima ni Wikipediju kao dokaz. Ako nešto ne možeš da proveriš u izvoru, napiši to — ne pretpostavljaj.",
  "",
  "**Format odgovora (za svaku stavku):**",
  "`ID — POTVRĐENO` ili `ID — PRIMEDBE: <šta tačno nije u redu, uz izvor>`",
  "",
];
for (const e of kb.entries) {
  out.push(`## ${e.id} — ${e.title}`, "", `**Tvrdnja:** ${e.statement}`, "");
  if (e.appliesWhen) out.push(`**Važi kada:** ${cond(e.appliesWhen)}`, "");
  if (e.expr) out.push(`**Proračun:** ${facts[e.output] ?? e.output} = ${expr(e.expr)}`, "");
  if (e.safety) out.push(`**Bezbednost:** kada ${cond(e.safety.when)} → ${e.safety.status}. Poruka: „${e.safety.message}"`, "");
  out.push("**Izvori:**");
  for (const s of e.sources)
    out.push(`- (nivo ${s.tier}${s.checkedOriginal ? ", original pročitan" : ", NIJE pročitan original"}) ${s.citation}${s.url ? ` ${s.url}` : ""}${s.doi ? ` doi:${s.doi}` : ""}`, `  - potkrepljuje: ${s.supports}`);
  if (e.sources.length === 0) out.push("- (objašnjenje, bez izvora)");
  if (e.notes) out.push("", `**Napomena autora:** ${e.notes}`);
  out.push("");
}
console.log(out.join("\n"));
