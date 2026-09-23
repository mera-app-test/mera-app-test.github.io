// Faza 1 uvoza: za svaki upit iz queries.json lista FDC zapisa koji odgovaraju, sa podacima
// potrebnim za izbor (skup, opis, NDB broj, koji praćeni nutrijenti nedostaju).
import { TRACKED, REQUIRED, pick } from "./nutrients.mjs";

function matches(desc, q) {
  const d = desc.toLowerCase();
  return q.terms.every((t) => d.includes(t.toLowerCase())) && !q.exclude.some((t) => d.includes(t.toLowerCase()));
}

export function findCandidates(datasets, queries, limit = 15) {
  return queries.map((q) => {
    const hits = [];
    for (const ds of datasets) {
      for (const f of ds.foods) {
        if (!matches(f.description, q)) continue;
        const missing = TRACKED.filter((t) => REQUIRED.includes(t.key) && !pick(ds, f.fdc_id, t)).map((t) => t.key);
        hits.push({ dataset: ds.key, fdcId: f.fdc_id, description: f.description, published: f.publication_date ?? "", ndb: ds.ndb.get(f.fdc_id) ?? "", missing });
      }
    }
    hits.sort((a, b) =>
      a.missing.length - b.missing.length ||
      (a.dataset === b.dataset ? 0 : a.dataset === "foundation" ? -1 : 1) ||
      a.description.length - b.description.length);
    return { query: q, total: hits.length, hits: hits.slice(0, limit) };
  });
}

export function candidatesMarkdown(results, meta) {
  const lines = ["# Uvoz FDC — kandidati (faza 1)", "", `Izvori: ${JSON.stringify(meta)}`, ""];
  for (const r of results) {
    lines.push(`## ${r.query.id} — ${r.query.sr}${r.query.form ? ` (${r.query.form})` : ""} · pogodaka: ${r.total}`);
    if (r.hits.length === 0) { lines.push("", "_nema pogodaka_", ""); continue; }
    lines.push("", "| FDC ID | skup | opis | NDB | objavljeno | nedostaje |", "|---|---|---|---|---|---|");
    for (const h of r.hits) lines.push(`| ${h.fdcId} | ${h.dataset} | ${h.description} | ${h.ndb} | ${h.published} | ${h.missing.join(", ") || "—"} |`);
    lines.push("");
  }
  return lines.join("\n");
}
