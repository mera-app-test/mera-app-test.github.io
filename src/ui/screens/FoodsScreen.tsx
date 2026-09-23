// Namirnice (ARCHITECTURE §17 korak 4): pretraga, detalj za izabranu količinu i „Zašto?" (MS §20, §30, §31).
// Brojeve računa application/domain; ovde je samo prikaz.
import { useEffect, useMemo, useRef, useState, type MutableRefObject } from "react";
import type { ConfidenceLevel, FoodDetail, FoodListItem } from "../../application";
import { useServices } from "../ServicesContext";
import { formatDisplay } from "../format";

const GROUPS: Record<string, string> = {
  zitarice: "Žitarice",
  mahunarke: "Mahunarke",
  povrce: "Povrće",
  voce: "Voće",
  "meso-riba-jaja": "Meso, riba, jaja",
  mlecni: "Mleko i mlečni proizvodi",
  "masti-orasasto": "Masti, orašasti plodovi, semenke",
  ostalo: "Ostalo",
};

const ROW_LABEL: Record<string, string> = {
  fat: "Masti",
  saturatedFat: "zasićene masne kiseline",
  availableCarbohydrate: "Ugljeni hidrati",
  sugars: "šećeri",
  fiber: "Vlakna",
  protein: "Proteini",
  salt: "So",
  sodium: "natrijum",
};

const LEVEL_LABEL: Record<ConfidenceLevel, string> = {
  POUZDANO: "pouzdano",
  DOBRO_POTVRDJENO: "dobro potvrđeno",
  PROCENJENO: "procenjeno",
  NEDOVOLJNO_POUZDANO: "nedovoljno pouzdano",
};

function PendingNote({ pending }: { pending: boolean }) {
  if (!pending) return null;
  return (
    <p className="food-pending" role="note">
      Vrednosti su uvezene iz USDA baze i čekaju tvoje odobrenje. Dok ih ne odobriš, postoje samo u test verziji.
    </p>
  );
}

export function FoodsScreen({ onClose, innerBack }: { onClose: () => void; innerBack: MutableRefObject<(() => boolean) | null> }) {
  const { foods } = useServices();
  const [query, setQuery] = useState("");
  const [items, setItems] = useState<readonly FoodListItem[] | null>(null);
  const [selected, setSelected] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const scrollY = useRef(0);

  useEffect(() => {
    void foods.info().then((i) => setPending(i.foodsStatus !== "ODOBRENO"));
  }, [foods]);

  useEffect(() => {
    let alive = true;
    void foods.search(query).then((r) => alive && setItems(r));
    return () => {
      alive = false;
    };
  }, [foods, query]);

  // Gest/dugme „nazad" iz detalja vraća na listu, ne na Danas.
  useEffect(() => {
    innerBack.current = () => {
      if (selected === null) return false;
      setSelected(null);
      requestAnimationFrame(() => window.scrollTo(0, scrollY.current));
      return true;
    };
    return () => {
      innerBack.current = null;
    };
  }, [innerBack, selected]);

  const grouped = useMemo(() => {
    const m = new Map<string, FoodListItem[]>();
    for (const it of items ?? []) {
      const l = m.get(it.group) ?? [];
      l.push(it);
      m.set(it.group, l);
    }
    return [...m.entries()];
  }, [items]);

  if (selected) {
    return (
      <FoodDetailView
        id={selected}
        pending={pending}
        onSelect={setSelected}
        onBack={() => {
          setSelected(null);
          requestAnimationFrame(() => window.scrollTo(0, scrollY.current));
        }}
      />
    );
  }

  return (
    <section aria-labelledby="foods-title">
      <h1 id="foods-title" className="section-title">Namirnice</h1>
      <PendingNote pending={pending} />
      <label htmlFor="food-search" className="weight-label">Pretraga (latinica ili ćirilica)</label>
      <input
        id="food-search"
        className="food-search"
        type="search"
        inputMode="search"
        autoComplete="off"
        placeholder="npr. piletina, сочиво, sargarepa"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
      />
      <p className="muted food-count">
        {items === null ? "…" : items.length === 0 ? "Nema namirnice sa tim nazivom." : `Vrednosti na 100 g · ${items.length} namirnica`}
      </p>
      {grouped.map(([group, list]) => (
        <div key={group} className="food-group">
          <h2 className="food-group-title">{GROUPS[group] ?? group}</h2>
          <ul className="food-list">
            {list.map((it) => (
              <li key={it.id}>
                <button
                  type="button"
                  className="food-row"
                  onClick={() => {
                    scrollY.current = window.scrollY;
                    setSelected(it.id);
                    window.scrollTo(0, 0);
                  }}
                >
                  <span className="food-row-main">
                    <span className="food-row-name">{it.name}</span>
                    {it.form && <span className="food-row-form">{it.form}</span>}
                  </span>
                  <span className={it.kcalPer100g.kind === "unknown" ? "food-row-kcal incomplete" : "food-row-kcal"}>
                    {it.kcalPer100g.kind === "unknown" ? "nepotpuno" : formatDisplay(it.kcalPer100g, "kcal")}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      ))}
      <button type="button" className="btn btn-secondary block back" onClick={onClose}>
        Nazad na Danas
      </button>
    </section>
  );
}

function FoodDetailView({ id, pending, onBack, onSelect }: { id: string; pending: boolean; onBack: () => void; onSelect: (id: string) => void }) {
  const { foods } = useServices();
  const [gramsText, setGramsText] = useState("100");
  const [detail, setDetail] = useState<FoodDetail | null>(null);
  const [why, setWhy] = useState(false);

  const grams = useMemo(() => {
    const v = Number(gramsText.replace(",", "."));
    return Number.isFinite(v) && v > 0 && v <= 5000 ? v : null;
  }, [gramsText]);

  useEffect(() => {
    let alive = true;
    void foods.detail(id, grams ?? 100).then((d) => alive && setDetail(d));
    return () => {
      alive = false;
    };
  }, [foods, id, grams]);

  if (!detail) return <p className="muted">…</p>;

  return (
    <section aria-labelledby="food-title" className="food-detail">
      <button type="button" className="link-btn food-back" onClick={onBack}>
        ‹ Sve namirnice
      </button>
      <h1 id="food-title" className="food-title">{detail.name}</h1>
      <p className="muted">{detail.nameCyrl}</p>
      {(detail.form || detail.otherForms.length > 0) && (
        <div className="food-forms" role="group" aria-label="Oblik">
          <span className="food-form active" aria-current="true">{detail.form || "—"}</span>
          {detail.otherForms.map((o) => (
            <button key={o.id} type="button" className="food-form" onClick={() => onSelect(o.id)}>
              {o.form}
            </button>
          ))}
        </div>
      )}
      <PendingNote pending={pending} />

      <label htmlFor="food-grams" className="weight-label">Količina</label>
      <div className="weight-input-row">
        <input
          id="food-grams"
          className="weight-input food-grams"
          inputMode="decimal"
          enterKeyHint="done"
          autoComplete="off"
          value={gramsText}
          onChange={(e) => setGramsText(e.target.value)}
          onFocus={(e) => e.target.select()}
        />
        <span className="weight-input-unit" aria-hidden="true">g</span>
      </div>
      {grams === null && <p className="error-text">Upiši količinu u gramima (npr. 150).</p>}

      <div className="food-energy" aria-live="polite">
        {detail.energy.kind === "unknown" ? (
          <>
            <span className="food-energy-value incomplete">nepotpuno</span>
            <span className="muted">
              {detail.energyProblem === "inconsistent"
                ? "Podaci izvora nisu međusobno usklađeni, pa se energija ne računa."
                : "Izvor nema sve podatke potrebne za energiju. Pogledaj „Zašto?\"."}
            </span>
          </>
        ) : (
          <>
            <span className="food-energy-value">{formatDisplay(detail.energy, "kcal")}</span>
            <span className="muted">u {grams ?? 100} g</span>
          </>
        )}
      </div>

      <dl className="nutri">
        {detail.rows.map((r) => (
          <div key={r.key} className={r.sub ? "nutri-row sub" : "nutri-row"}>
            <dt>{ROW_LABEL[r.key]}</dt>
            <dd className={r.display.kind === "unknown" ? "incomplete" : undefined}>{formatDisplay(r.display, r.unit)}</dd>
          </div>
        ))}
      </dl>

      <button type="button" className="btn btn-secondary block" aria-expanded={why} onClick={() => setWhy((w) => !w)}>
        {why ? "Sakrij objašnjenje" : "Zašto?"}
      </button>
      {why && <Why detail={detail} />}

      <button type="button" className="btn btn-secondary block back" onClick={onBack}>
        Nazad na namirnice
      </button>
    </section>
  );
}

function Why({ detail }: { detail: FoodDetail }) {
  const w = detail.why;
  const dataset = (d: string) => (d === "foundation" ? "Foundation Foods" : "SR Legacy");
  return (
    <div className="why">
      <h2 className="why-title">Odakle su ovi brojevi</h2>
      <dl className="facts">
        <div>
          <dt>Izvor</dt>
          <dd>
            USDA FoodData Central, {dataset(w.source.dataset)} · FDC ID {w.source.fdcId}
            {w.source.published ? ` · objavljeno ${w.source.published}` : ""}
          </dd>
        </div>
        <div>
          <dt>Zapis u izvoru</dt>
          <dd lang="en">{w.source.description}</dd>
        </div>
        <div>
          <dt>Podudaranje sa srpskom namirnicom</dt>
          <dd>{w.mapping === "TACNO" ? "tačno — ista namirnica, isti oblik" : "blisko — ista vrsta, razlika u sorti ili poreklu"}</dd>
        </div>
        {w.fill && w.filledNutrients.length > 0 && (
          <div>
            <dt>Dopunjeno iz SR Legacy (isti NDB broj {w.fill.ndb})</dt>
            <dd>
              {w.filledNutrients.map((k) => ROW_LABEL[k === "carbohydrateByDifference" ? "availableCarbohydrate" : k]).join(", ")} · FDC ID {w.fill.fdcId}
            </dd>
          </div>
        )}
        {w.missing.length > 0 && (
          <div>
            <dt>Izvor nema podatak za</dt>
            <dd>{w.missing.map((k) => (k === "carbohydrateByDifference" ? "ugljene hidrate" : ROW_LABEL[k]?.toLowerCase() ?? k)).join(", ")} — ne računa se kao 0</dd>
          </div>
        )}
        <div>
          <dt>Energija</dt>
          <dd>
            {w.energyMethod}. Nivo: {detail.energyLevel ? LEVEL_LABEL[detail.energyLevel] : "—"}.
            {w.fdcEnergyKcal !== null && ` USDA za istu količinu navodi ${Math.round(w.fdcEnergyKcal)} kcal (drugi metod računanja).`}
          </dd>
        </div>
        <div>
          <dt>Ugljeni hidrati</dt>
          <dd>Kao na deklaraciji: ukupni ugljeni hidrati iz izvora umanjeni za vlakna.</dd>
        </div>
        {w.note && (
          <div>
            <dt>Napomena</dt>
            <dd>{w.note}</dd>
          </div>
        )}
        <div>
          <dt>Verzije</dt>
          <dd>
            Namirnice {w.foodsVersion} · formula energije {w.energyFormulaVersion}
            {w.sourceFile && ` · fajl izvora SHA-256 ${w.sourceFile.sha256.slice(0, 12)}…`}
          </dd>
        </div>
      </dl>
      <p className="muted why-attrib">{w.attribution}</p>
      <p className="muted">
        Vrednosti su proseci za namirnicu. Stvarna namirnica može da se razlikuje po sorti, zrelosti i načinu uzgoja.
      </p>
    </div>
  );
}
