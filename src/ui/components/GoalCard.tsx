// Dnevni cilj na ekranu Danas (MS §10, §15, §30, §31). Broj dolazi iz baze znanja preko application sloja;
// ovde se samo prikazuje. „Zašto?" pokazuje račun korak po korak, sa pravilom i verzijom za svaki broj.
import { useEffect, useState } from "react";
import type { ProfileResultView, ProfileState } from "../../application";
import { useServices } from "../ServicesContext";
import { formatAnswerNumber, formatDateTime, formatDisplay, formatDisplayNumber } from "../format";

export function GoalCard({ onOpenQuestionnaire }: { onOpenQuestionnaire: () => void }) {
  const { profile } = useServices();
  const [state, setState] = useState<ProfileState | null>(null);
  const [showWhy, setShowWhy] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    void profile.current().then((s) => alive && setState(s)).catch((e: unknown) => alive && setError(e instanceof Error ? e.message : String(e)));
    return () => {
      alive = false;
    };
  }, [profile]);

  const recompute = async () => {
    setBusy(true);
    const r = await profile.recompute();
    if (!r.ok) setError(r.message);
    setState(await profile.current());
    setBusy(false);
  };

  if (error) return <p className="error-text">Dnevni cilj nije moguće prikazati: {error}</p>;
  if (state === null) return <section className="goal" aria-busy="true"><p className="muted">…</p></section>;

  if (state.kind === "none") {
    return (
      <section className="goal" aria-labelledby="goal-title">
        <h2 id="goal-title" className="goal-title">Tvoj dnevni cilj</h2>
        <p className="goal-lead">Odgovori na nekoliko kratkih pitanja i Mera će izračunati koliko kalorija ti treba dnevno.</p>
        <button type="button" className="btn btn-primary block" onClick={onOpenQuestionnaire}>
          Počni
        </button>
      </section>
    );
  }

  const v = state.view;
  return (
    <section className="goal" aria-labelledby="goal-title">
      <h2 id="goal-title" className="goal-title">Tvoj dnevni cilj</h2>
      {v.outcome === "cilj" && v.target ? (
        <>
          <p className="goal-number">
            {formatDisplayNumber(v.target)}
            <span className="goal-unit">kcal</span>
          </p>
          <GoalContext view={v} />
          {state.stale && (
            <div className="goal-stale">
              <p>Pravila po kojima je cilj računat su u međuvremenu dopunjena.</p>
              <button type="button" className="btn btn-secondary" onClick={() => void recompute()} disabled={busy}>
                Preračunaj
              </button>
            </div>
          )}
          <div className="goal-actions">
            <button type="button" className="btn btn-secondary" aria-expanded={showWhy} onClick={() => setShowWhy((x) => !x)}>
              {showWhy ? "Sakrij" : "Zašto?"}
            </button>
            <button type="button" className="btn btn-secondary" onClick={onOpenQuestionnaire}>
              Izmeni
            </button>
          </div>
          {showWhy && <Why view={v} savedAt={state.savedAt} />}
          <p className="goal-next">Jelovnik prema ovom cilju dolazi u sledećem koraku razvoja.</p>
        </>
      ) : v.outcome === "bez-plana" ? (
        <>
          <div className="goal-stop" role="status">
            {v.notices.map((n) => (
              <p key={n.entryId}>{n.message}</p>
            ))}
          </div>
          <p className="goal-lead">Zato Mera ne računa cilj i ne pravi plan ishrane.</p>
          <button type="button" className="btn btn-secondary block" onClick={onOpenQuestionnaire}>
            Izmeni odgovore
          </button>
        </>
      ) : (
        <>
          <p className="goal-lead">Nedostaje odgovor na {v.missing.length === 1 ? "jedno pitanje" : "nekoliko pitanja"}, pa cilj još nije izračunat.</p>
          <button type="button" className="btn btn-primary block" onClick={onOpenQuestionnaire}>
            Dopuni odgovore
          </button>
        </>
      )}
    </section>
  );
}

function GoalContext({ view }: { view: ProfileResultView }) {
  return (
    <div className="goal-context">
      {view.goalLabel && <p>Cilj: {view.goalLabel}</p>}
      {view.deficit && view.weeklyLoss && (
        <p>
          {formatDisplay(view.deficit, "kcal")} dnevno manje od potrošnje, na početku {formatDisplay(view.weeklyLoss, "kg")} nedeljno
        </p>
      )}
      {view.floorApplied && <p>Cilj je podignut na najniži unos koji Mera predlaže.</p>}
    </div>
  );
}

function Why({ view, savedAt }: { view: ProfileResultView; savedAt: string }) {
  const [open, setOpen] = useState<string | null>(null);
  return (
    <div className="why goal-why">
      <h3 className="why-title">Kako je izračunato</h3>
      <ul className="ledger">
        {view.why.map((w) => (
          <li key={w.key} className={w.total ? "ledger-item total" : "ledger-item"}>
            <button type="button" className="ledger-row" aria-expanded={open === w.key} onClick={() => setOpen(open === w.key ? null : w.key)}>
              <span className="ledger-label">{w.label}</span>
              <span className="ledger-value">{formatDisplay(w.display, w.unit ?? "")}</span>
            </button>
            {open === w.key && (
              <div className="ledger-detail">
                <p>{w.statement}</p>
                <p className="ledger-rule">
                  Pravilo {w.entryId}, verzija {w.version}
                </p>
              </div>
            )}
          </li>
        ))}
      </ul>
      <p className="ledger-hint">Dodirni red da vidiš pravilo po kome je broj izračunat.</p>
      {view.explanations.map((e) => (
        <p key={e.entryId} className="goal-explain">
          {e.statement}
        </p>
      ))}
      <dl className="facts why-meta">
        {view.massKg !== null && (
          <div>
            <dt>Računato za masu</dt>
            <dd>{formatAnswerNumber(view.massKg)} kg</dd>
          </div>
        )}
        <div>
          <dt>Bezbednosne provere</dt>
          <dd>{view.notices.length === 0 ? "bez prepreka" : view.notices.map((n) => n.message).join(" ")}</dd>
        </div>
        <div>
          <dt>Baza znanja</dt>
          <dd>verzija {view.knowledgeVersion}, sačuvano {formatDateTime(savedAt)}</dd>
        </div>
      </dl>
    </div>
  );
}
