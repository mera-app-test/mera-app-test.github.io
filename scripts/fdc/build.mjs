// Faza 2 uvoza: pravi fajl namirnica i izveštaj za vlasnika (NUTRITION_ENGINE.md N6).
import { readFileSync } from "node:fs";
import { TRACKED, FDC_ENERGY, pick } from "./nutrients.mjs";
import { toCyrillic, stripDiacritics } from "./translit.mjs";
import { energyKcal } from "./energy.mjs";

const ENERGY_INPUTS = ["protein", "fat", "carbohydrateByDifference", "fiber"];

const energyFactors = JSON.parse(readFileSync(new URL("../../reference-data/formulas/energy-label-1.0.0.json", import.meta.url), "utf8")).kcalPerGram;

function record(dsByKey, ref) {
  const ds = dsByKey[ref.dataset];
  const f = ds.foods.find((x) => x.fdc_id === ref.fdcId);
  if (!f) throw new Error(`${ref.dataset} ${ref.fdcId}: zapis ne postoji u ovom izdanju`);
  return { ds, food: f, ndb: ds.ndb.get(ref.fdcId) ?? null };
}

function values(dsByKey, ref) {
  const { ds, food, ndb } = record(dsByKey, ref);
  let fill = null;
  if (ds.key === "foundation" && ndb) {
    const sr = dsByKey.srLegacy;
    const srId = [...sr.ndb.entries()].find(([, n]) => n === ndb)?.[0];
    if (srId) fill = { ds: sr, food: sr.foods.find((x) => x.fdc_id === srId), ndb };
  }
  const out = {};
  for (const t of TRACKED) {
    const p = pick(ds, food.fdc_id, t);
    if (p) { out[t.key] = { value: Number(p.row.amount), nutrientId: p.nutrientId, origin: "PRIMARY" }; continue; }
    const q = fill && pick(fill.ds, fill.food.fdc_id, t);
    if (q) out[t.key] = { value: Number(q.row.amount), nutrientId: q.nutrientId, origin: "SR_FILL" };
  }
  const fdcEnergy = {};
  for (const e of FDC_ENERGY) {
    const v = ds.values.get(food.fdc_id)?.get(e.id);
    if (v && v.amount !== "") fdcEnergy[e.key] = Number(v.amount);
  }
  const portions = (ds.portions.get(food.fdc_id) ?? []).map((p) => ({
    amount: p.amount ? Number(p.amount) : null,
    description: [p.portion_description, p.modifier].filter(Boolean).join(" ").trim(),
    gramWeight: Number(p.gram_weight),
  })).filter((p) => p.gramWeight > 0);
  return {
    source: { dataset: ds.key, fdcId: food.fdc_id, ndb, description: food.description, published: food.publication_date ?? null },
    fill: fill ? { dataset: "srLegacy", fdcId: fill.food.fdc_id, ndb, description: fill.food.description } : null,
    values: out,
    missing: TRACKED.filter((t) => t.key !== "water" && !out[t.key]).map((t) => t.key),
    fdcEnergy,
    portions,
  };
}

const plain = (v) => Object.fromEntries(Object.entries(v).map(([k, x]) => [k, x.value]));
const r1 = (x) => (Math.round(x * 10) / 10).toString().replace(".", ",");

export function buildFoods(datasets, selection, meta) {
  const dsByKey = Object.fromEntries(datasets.map((d) => [d.key, d]));
  const foods = [];
  const lines = [
    `# Izveštaj uvoza namirnica ${selection.version}`, "",
    "Vrednosti na 100 g jestivog dela, preuzete iz zvaničnih FDC arhiva (nijedan broj nije prekucan).",
    "Energija A = Prilog 13 (4·P + 4·(UH−vlakna) + 9·M + 2·vlakna); FDC = energija koju objavljuje USDA (2048 → 1008 → 2047).",
    "Oznaka * = vrednost dopunjena iz SR Legacy po istom NDB broju (N2). R1 = korišćen SR Legacy zapis jer novi nije imao podatke za energiju. „—\" = nepoznato.", "",
    `Izvori: ${JSON.stringify(meta)}`, "",
  ];
  let group = "";
  for (const item of selection.items) {
    // R1 (DECISIONS/0009): ako izabrani zapis posle dopune nema podatke za energiju, uzima se SR Legacy zapis iste namirnice.
    let v = values(dsByKey, item.primary);
    let r1Applied = false;
    if (item.alternativeR1 && ENERGY_INPUTS.some((k) => !v.values[k])) {
      v = values(dsByKey, item.alternativeR1);
      r1Applied = true;
    }
    const food = {
      id: item.id,
      names: { srLatn: item.srLatn, srCyrl: toCyrillic(item.srLatn), aliases: item.aliases, searchKeys: [...new Set([item.srLatn, ...item.aliases].map((s) => stripDiacritics(s).toLowerCase()))] },
      group: item.group, form: item.form, mapping: item.mapping,
      ...v,
      values: v.values,
      note: item.note || undefined,
      ...(r1Applied ? { r1: true } : {}),
    };
    foods.push(food);
    if (item.group !== group) {
      group = item.group;
      lines.push(`## ${group}`, "", "| namirnica | FDC (skup, ID, opis) | kcal A | kcal FDC | P | M | zas. | UH | šeć. | vl. | Na mg | nedostaje |", "|---|---|---|---|---|---|---|---|---|---|---|---|");
    }
    const x = v.values;
    const cell = (k) => (x[k] ? `${r1(x[k].value)}${x[k].origin === "SR_FILL" ? "*" : ""}` : "—");
    const e = energyKcal(plain(x), energyFactors);
    const fdcE = v.fdcEnergy.energyAtwaterSpecific ?? v.fdcEnergy.energy ?? v.fdcEnergy.energyAtwaterGeneral;
    lines.push(`| ${item.srLatn}${item.form ? `, ${item.form}` : ""} (${item.mapping === "TACNO" ? "T" : "B"})${r1Applied ? " R1" : ""} | ${v.source.dataset} ${v.source.fdcId} ${v.source.description} | ${e.ok ? Math.round(e.kcal) : e.reason} | ${fdcE != null ? Math.round(fdcE) : "—"} | ${cell("protein")} | ${cell("fat")} | ${cell("saturatedFat")} | ${cell("carbohydrateByDifference")} | ${cell("sugars")} | ${cell("fiber")} | ${x.sodium ? Math.round(x.sodium.value) + (x.sodium.origin === "SR_FILL" ? "*" : "") : "—"} | ${v.missing.join(", ") || "—"} |`);
  }
  lines.push("", "## Ćirilica (ručna provera)", "", ...selection.items.map((i) => `- ${i.srLatn} → ${toCyrillic(i.srLatn)}`));
  const file = {
    id: "foods", version: selection.version, status: "ODOBRENO",
    document: "docs/NUTRITION_ENGINE.md delovi N, P, K; DECISIONS/0008, 0009",
    attribution: "U.S. Department of Agriculture, Agricultural Research Service. FoodData Central (Foundation Foods, SR Legacy). fdc.nal.usda.gov. CC0 1.0.",
    sources: meta,
    foods,
  };
  return { file, report: lines.join("\n") };
}
