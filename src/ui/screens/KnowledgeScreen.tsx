// Pregled baze znanja i upitnika izvedenog iz nje — alat za vlasnika na test verziji (DECISIONS/0012).
import { useEffect, useMemo, useState } from "react";
import type { DerivedQuestion, Evaluation, FactValue, KnowledgeEntry, KnowledgeOverview } from "../../application";
import { useServices } from "../ServicesContext";

const STATUS_LABEL: Record<KnowledgeEntry["status"], string> = { ODOBRENO: "odobreno", PREDLOG: "predlog", POVUCENO: "povučeno" };
const SAFETY_LABEL: Record<Evaluation["safetyStatus"], string> = {
  SAFE: "bez prepreka",
  CAUTION: "oprez",
  REQUIRES_CLINICAL_REVIEW: "potreban lekar",
  BLOCKED: "plan se ne pravi",
};

export function KnowledgeScreen({ onClose }: { onClose: () => void }) {
  const { knowledge } = useServices();
  const [tab, setTab] = useState<"baza" | "upitnik">("baza");
  const [overview, setOverview] = useState<KnowledgeOverview | null>(null);

  useEffect(() => {
    void knowledge.overview().then(setOverview);
  }, [knowledge]);

  return (
    <section aria-labelledby="kb-title">
      <h1 id="kb-title" className="section-title">Baza znanja</h1>
      {overview && (
        <p className="muted">
          Verzija {overview.version} · odobreno {overview.counts.odobreno} · predlog {overview.counts.predlog}
          {overview.problems.length > 0 && <span className="error-text"> · greške: {overview.problems.length}</span>}
        </p>
      )}
      <div className="food-forms" role="tablist">
        <button type="button" role="tab" aria-selected={tab === "baza"} className={tab === "baza" ? "food-form active" : "food-form"} onClick={() => setTab("baza")}>
          Pravila
        </button>
        <button type="button" role="tab" aria-selected={tab === "upitnik"} className={tab === "upitnik" ? "food-form active" : "food-form"} onClick={() => setTab("upitnik")}>
          Upitnik iz baze
        </button>
      </div>
      {tab === "baza" && overview && <Entries entries={overview.entries} />}
      {tab === "upitnik" && overview && <Questionnaire overview={overview} />}
      <button type="button" className="btn btn-secondary block back" onClick={onClose}>
        Nazad na Danas
      </button>
    </section>
  );
}

function Entries({ entries }: { entries: readonly KnowledgeEntry[] }) {
  const [open, setOpen] = useState<string | null>(null);
  const areas = useMemo(() => [...new Set(entries.map((e) => e.area))], [entries]);
  return (
    <>
      {areas.map((area) => (
        <div key={area} className="food-group">
          <h2 className="food-group-title">{area}</h2>
          <ul className="food-list">
            {entries.filter((e) => e.area === area).map((e) => (
              <li key={e.id}>
                <button type="button" className="food-row" aria-expanded={open === e.id} onClick={() => setOpen(open === e.id ? null : e.id)}>
                  <span className="food-row-main">
                    <span className="food-row-name">{e.title}</span>
                    <span className="food-row-form">{e.id} · v{e.version}</span>
                  </span>
                  <span className={`kb-status kb-${e.status.toLowerCase()}`}>{STATUS_LABEL[e.status]}</span>
                </button>
                {open === e.id && (
                  <div className="kb-detail">
                    <p>{e.statement}</p>
                    {e.safety && <p className="muted">Poruka korisniku: „{e.safety.message}"</p>}
                    <h3 className="kb-h">Provera (DECISIONS/0013)</h3>
                    <ul className="kb-sources">
                      <li><span className={e.review?.criteria ? "kb-orig ok" : "kb-orig no"}>{e.review?.criteria ? `✓ kriterijumi ispunjeni (${e.review.criteria.consensus === "SMERNICA" ? "smernica" : "dva izvora"})` : "✗ kriterijumi još nisu ispunjeni"}</span></li>
                      <li><span className={e.review?.independentAi?.result === "POTVRDJENO" ? "kb-orig ok" : "kb-orig no"}>{e.review?.independentAi ? `nezavisna AI provera: ${e.review.independentAi.result === "POTVRDJENO" ? "✓ potvrđeno" : "primedbe"}` : "✗ nezavisna AI provera nije urađena"}</span></li>
                      <li><span className={e.review?.expert?.result === "POTVRDJENO" ? "kb-orig ok" : "kb-orig no"}>{e.review?.expert ? `nutricionista: ${e.review.expert.result === "POTVRDJENO" ? "✓ potvrđeno" : "primedbe"}` : "✗ nutricionista nije pregledao (obavezno pre drugih korisnika)"}</span></li>
                    </ul>
                    <h3 className="kb-h">Izvori</h3>
                    <ul className="kb-sources">
                      {e.sources.map((s, i) => (
                        <li key={i}>
                          <span className={s.checkedOriginal ? "kb-orig ok" : "kb-orig no"}>{s.checkedOriginal ? "original proveren" : "NIJE proveren u originalu"}</span>
                          <span className="kb-tier"> · nivo {s.tier}</span>
                          <p className="kb-cit">{s.citation}</p>
                          <p className="muted">{s.supports}</p>
                        </li>
                      ))}
                      {e.sources.length === 0 && <li className="muted">bez izvora (objašnjenje)</li>}
                    </ul>
                    {e.notes && <p className="kb-note">{e.notes}</p>}
                  </div>
                )}
              </li>
            ))}
          </ul>
        </div>
      ))}
    </>
  );
}

function Questionnaire({ overview }: { overview: KnowledgeOverview }) {
  const { knowledge } = useServices();
  const [answers, setAnswers] = useState<Record<string, FactValue>>({});
  const [level, setLevel] = useState<"osnovni" | "detaljni" | "napredni">("osnovni");
  const [questions, setQuestions] = useState<readonly DerivedQuestion[]>([]);
  const [result, setResult] = useState<Evaluation | null>(null);

  useEffect(() => {
    void knowledge.questions(level, answers, "sa-predlozima").then((qs) => {
      setQuestions(qs);
      // Odgovor na pitanje koje više ne važi (npr. promenjen cilj) ne sme da utiče na račun.
      const keys = new Set(qs.map((q) => q.fact.key));
      const stale = Object.keys(answers).filter((k) => !keys.has(k));
      if (stale.length) setAnswers((a) => Object.fromEntries(Object.entries(a).filter(([k]) => keys.has(k))));
    });
    void knowledge.evaluate(answers, "sa-predlozima").then(setResult);
  }, [knowledge, answers, level]);

  const set = (key: string, v: FactValue | undefined) =>
    setAnswers((a) => {
      const n = { ...a };
      if (v === undefined) delete n[key];
      else n[key] = v;
      return n;
    });

  const complete = questions.every((q) => q.optional || answers[q.fact.key] !== undefined);

  return (
    <div>
      <p className="food-pending">Pregled: pitanja i računica iz stavki sa statusom „predlog". Aplikacija ih ne koristi dok ih ne odobriš.</p>
      <div className="food-forms" role="group" aria-label="Nivo">
        {(["osnovni", "detaljni", "napredni"] as const).map((l) => (
          <button key={l} type="button" className={level === l ? "food-form active" : "food-form"} onClick={() => setLevel(l)}>
            {l}
          </button>
        ))}
      </div>
      <p className="muted">{questions.length} pitanja. Ispod svakog piše koje pravilo ga koristi.</p>
      <div className="kb-form">
        {questions.map((q) => (
          <div key={q.fact.key} className="kb-q">
            <label className="kb-q-text" htmlFor={`q-${q.fact.key}`}>{q.fact.question!.text}</label>
            {q.fact.type === "number" ? (
              <div className="weight-input-row">
                <input
                  id={`q-${q.fact.key}`}
                  className="food-search kb-num"
                  inputMode="decimal"
                  value={answers[q.fact.key] === undefined ? "" : String(answers[q.fact.key]).replace(".", ",")}
                  onChange={(e) => {
                    const t = e.target.value.replace(",", ".");
                    const n = Number(t);
                    set(q.fact.key, t === "" || !Number.isFinite(n) ? undefined : n);
                  }}
                />
                {q.fact.unit && <span className="weight-input-unit">{q.fact.unit}</span>}
              </div>
            ) : (
              <div className="food-forms kb-options">
                {(q.fact.type === "boolean" ? [{ value: "true", label: "da" }, { value: "false", label: "ne" }] : q.fact.options ?? []).map((o) => {
                  const v: FactValue = q.fact.type === "boolean" ? o.value === "true" : o.value;
                  const sel = answers[q.fact.key] === v;
                  return (
                    <button key={o.value} type="button" className={sel ? "food-form active" : "food-form"} onClick={() => set(q.fact.key, v)}>
                      {o.label}
                    </button>
                  );
                })}
              </div>
            )}
            <span className="kb-used">koristi: {q.usedBy.join(", ")}{q.optional ? " · može da se preskoči" : ""}</span>
          </div>
        ))}
      </div>
      {result && (
        <div className="why">
          <h2 className="why-title">Rezultat</h2>
          <p>
            Bezbednost: <strong>{complete && result.undecidedSafety.length === 0 ? SAFETY_LABEL[result.safetyStatus] : "nisu odgovorena sva pitanja"}</strong>
          </p>
          {result.safety.map((s) => (
            <p key={s.entryId} className="kb-note">{s.entryId}: {s.message}</p>
          ))}
          {result.safetyStatus !== "BLOCKED" && result.safetyStatus !== "REQUIRES_CLINICAL_REVIEW" &&
            result.trace.map((t) => (
              <p key={t.output} className="kb-trace">
                {overview.facts.find((f) => f.key === t.output)?.label ?? t.output}: <strong>{new Intl.NumberFormat("sr-Latn-RS", { maximumFractionDigits: 2 }).format(t.value)}</strong>{" "}
                {overview.facts.find((f) => f.key === t.output)?.unit ?? ""} <span className="muted">({t.entryId})</span>
              </p>
            ))}
        </div>
      )}
    </div>
  );
}
