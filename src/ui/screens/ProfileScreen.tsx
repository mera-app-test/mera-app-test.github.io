// Upitnik osnovnog nivoa (DECISIONS/0012 t. 2, 0016): jedno pitanje po ekranu, pa pregled sa rezultatom i čuvanjem.
// Pitanja, uslovi i proračun dolaze iz baze znanja preko application sloja; ekran ne zna nijedno pravilo.
import { useCallback, useEffect, useRef, useState, type FormEvent, type MutableRefObject } from "react";
import type { FactValue, Facts, Preview, QuestionView } from "../../application";
import { useServices } from "../ServicesContext";
import { formatAnswerNumber, formatDisplayNumber } from "../format";

type Phase = "loading" | "ask" | "review";

interface Props {
  onClose: () => void;
  innerBack: MutableRefObject<(() => boolean) | null>;
}

function answerText(q: QuestionView, v: FactValue | undefined): string | null {
  if (v === undefined) return null;
  if (q.type === "number") return `${formatAnswerNumber(v as number)}${q.unit ? ` ${q.unit}` : ""}`;
  return q.options.find((o) => o.value === v)?.label ?? String(v);
}

export function ProfileScreen({ onClose, innerBack }: Props) {
  const { profile } = useServices();
  const [phase, setPhase] = useState<Phase>("loading");
  const [answers, setAnswers] = useState<Facts>({});
  const [questions, setQuestions] = useState<readonly QuestionView[]>([]);
  const [index, setIndex] = useState(0);
  /** Izmena jednog odgovora iz pregleda: posle odgovora nazad na pregled (ili na pitanje koje je tek postalo potrebno). */
  const [fromReview, setFromReview] = useState(false);
  const [hasProfile, setHasProfile] = useState(false);
  const [latestMassKg, setLatestMassKg] = useState<number | null>(null);
  const [text, setText] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pendingConfirm, setPendingConfirm] = useState<number | null>(null);
  const [preview, setPreview] = useState<Preview | null>(null);
  const [busy, setBusy] = useState(false);
  const [confirmClear, setConfirmClear] = useState(false);
  const input = useRef<HTMLInputElement>(null);

  const q = questions[index];

  useEffect(() => {
    let alive = true;
    void (async () => {
      const s = await profile.start();
      const r = await profile.questions(s.answers);
      if (!alive) return;
      setAnswers(r.answers);
      setQuestions(r.questions);
      setHasProfile(s.hasProfile);
      setLatestMassKg(s.latestMassKg);
      if (s.hasProfile) {
        setPreview(await profile.preview(r.answers));
        setPhase("review");
      } else setPhase("ask");
    })();
    return () => {
      alive = false;
    };
  }, [profile]);

  // Polje za broj pokazuje postojeći odgovor (npr. masu iz poslednjeg merenja).
  useEffect(() => {
    if (phase !== "ask" || !q) return;
    setError(null);
    setPendingConfirm(null);
    setText(q.type === "number" && typeof answers[q.key] === "number" ? formatAnswerNumber(answers[q.key] as number) : "");
    if (q.type === "number") requestAnimationFrame(() => input.current?.focus());
    window.scrollTo(0, 0);
    // Namerno samo kad se promeni pitanje, ne svaki put kad se promene odgovori.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, q?.key]);

  const goReview = useCallback(
    async (a: Facts) => {
      setPreview(await profile.preview(a));
      setFromReview(false);
      setConfirmClear(false);
      setPhase("review");
      window.scrollTo(0, 0);
    },
    [profile],
  );

  const commitAnswer = async (key: string, value: FactValue | undefined) => {
    setBusy(true);
    const next: Record<string, FactValue> = { ...answers };
    if (value === undefined) delete next[key];
    else next[key] = value;
    const r = await profile.questions(next);
    setAnswers(r.answers);
    setQuestions(r.questions);
    const p = await profile.preview(r.answers);
    // Bezbednosna prepreka: ostala pitanja nemaju smisla, odmah se prikazuje poruka.
    if (p.view.outcome === "bez-plana") {
      setPreview(p);
      setFromReview(false);
      setPhase("review");
      setBusy(false);
      window.scrollTo(0, 0);
      return;
    }
    if (fromReview) {
      const firstMissing = r.questions.findIndex((x) => !x.optional && r.answers[x.key] === undefined);
      if (firstMissing >= 0) setIndex(firstMissing);
      else await goReview(r.answers);
    } else {
      const pos = r.questions.findIndex((x) => x.key === key);
      if (pos + 1 < r.questions.length) setIndex(pos + 1);
      else await goReview(r.answers);
    }
    setBusy(false);
  };

  const submitNumber = async (e?: FormEvent, confirmed = false) => {
    e?.preventDefault();
    if (!q || busy) return;
    const r = await profile.parseAnswer(q.key, text, confirmed);
    if (r.ok) await commitAnswer(q.key, r.value);
    else if (r.needsConfirmation) setPendingConfirm(r.value);
    else {
      setError(r.message);
      input.current?.focus();
    }
  };

  const choose = (value: FactValue) => {
    if (!q || busy) return;
    setBusy(true);
    setAnswers((a) => ({ ...a, [q.key]: value })); // odmah se vidi izbor
    window.setTimeout(() => void commitAnswer(q.key, value), 160);
  };

  const back = useCallback((): boolean => {
    if (phase === "ask") {
      if (fromReview) {
        void goReview(answers);
        return true;
      }
      if (index > 0) {
        setIndex(index - 1);
        return true;
      }
      return false;
    }
    if (phase === "review") {
      if (confirmClear) {
        setConfirmClear(false);
        return true;
      }
      if (!hasProfile && questions.length > 0 && preview?.view.outcome !== "bez-plana") {
        setIndex(questions.length - 1);
        setPhase("ask");
        return true;
      }
    }
    return false;
  }, [phase, fromReview, index, confirmClear, hasProfile, questions.length, preview, answers, goReview]);

  useEffect(() => {
    innerBack.current = back;
    return () => {
      innerBack.current = null;
    };
  }, [innerBack, back]);

  const save = async () => {
    setBusy(true);
    setError(null);
    try {
      const r = await profile.save(answers);
      if (r.ok) onClose();
      else setError(r.message);
    } catch (e) {
      setError(`Čuvanje nije uspelo: ${e instanceof Error ? e.message : String(e)}`);
    }
    setBusy(false);
  };

  const clear = async () => {
    setBusy(true);
    try {
      await profile.clear();
      onClose();
    } catch (e) {
      setError(`Brisanje nije uspelo: ${e instanceof Error ? e.message : String(e)}`);
      setBusy(false);
    }
  };

  const edit = (key: string) => {
    const i = questions.findIndex((x) => x.key === key);
    if (i < 0) return;
    setIndex(i);
    setFromReview(true);
    setPhase("ask");
  };

  if (phase === "loading") return <p className="muted">…</p>;

  if (phase === "ask" && q) {
    const total = questions.length;
    const selected = answers[q.key];
    return (
      <section className="ask" aria-labelledby="q-text">
        <div className="q-top">
          <button type="button" className="link-btn q-back" onClick={() => (back() ? undefined : onClose())}>
            {index === 0 && !fromReview ? "Odustani" : "Nazad"}
          </button>
          <span className="q-count">
            {index + 1} od {total}
          </span>
        </div>
        <div className="q-progress" aria-hidden="true">
          {questions.map((x, i) => (
            <span key={x.key} className={i <= index ? "q-seg done" : "q-seg"} />
          ))}
        </div>

        {q.type === "number" ? (
          <form className="q-form" onSubmit={(e) => void submitNumber(e)} noValidate>
            <label id="q-text" htmlFor="q-input" className="q-text">
              {q.text}
            </label>
            <div className="weight-input-row">
              <input
                ref={input}
                id="q-input"
                className="weight-input"
                type="text"
                inputMode="decimal"
                autoComplete="off"
                enterKeyHint="next"
                value={text}
                onChange={(e) => {
                  setText(e.target.value);
                  setError(null);
                  setPendingConfirm(null);
                }}
                aria-describedby="q-notice"
              />
              {q.unit && <span className="weight-input-unit" aria-hidden="true">{q.unit}</span>}
            </div>
            {q.isBodyMass && latestMassKg !== null && (
              <p className="q-hint">Predlog je tvoje poslednje merenje. Isti broj važi i za merenja mase.</p>
            )}
            <p id="q-notice" className="error-text q-notice" role="alert">
              {error ?? ""}
            </p>
            {pendingConfirm !== null ? (
              <div className="confirm-box">
                <p>
                  Da li je <strong>{formatAnswerNumber(pendingConfirm)} {q.unit}</strong> tačno?
                </p>
                <div className="row">
                  <button type="button" className="btn btn-secondary" onClick={() => { setPendingConfirm(null); input.current?.focus(); }}>
                    Ispravi
                  </button>
                  <button type="button" className="btn btn-primary" onClick={() => void submitNumber(undefined, true)}>
                    Da, tačno je
                  </button>
                </div>
              </div>
            ) : (
              <button type="submit" className="btn btn-primary block q-next" disabled={busy}>
                Dalje
              </button>
            )}
          </form>
        ) : (
          <div className="q-form">
            <h1 id="q-text" className="q-text">
              {q.text}
            </h1>
            <div className="q-options" role="group" aria-labelledby="q-text">
              {q.options.map((o) => (
                <button
                  key={String(o.value)}
                  type="button"
                  className={selected === o.value ? "q-option selected" : "q-option"}
                  aria-pressed={selected === o.value}
                  onClick={() => choose(o.value)}
                  disabled={busy}
                >
                  {o.label}
                </button>
              ))}
            </div>
          </div>
        )}
        {q.optional && (
          <button type="button" className="link-btn" onClick={() => void commitAnswer(q.key, undefined)}>
            Preskoči
          </button>
        )}
      </section>
    );
  }

  // Pregled: rezultat, svi odgovori (dodir = izmena), čuvanje.
  const v = preview?.view;
  return (
    <section className="review" aria-labelledby="review-title">
      <h1 id="review-title" className="section-title">{hasProfile ? "Tvoji odgovori" : "Proveri odgovore"}</h1>

      {v?.outcome === "cilj" && v.target && (
        <div className="goal review-result">
          <p className="goal-title">Tvoj dnevni cilj</p>
          <p className="goal-number">
            {formatDisplayNumber(v.target)}
            <span className="goal-unit">kcal</span>
          </p>
          {preview?.logsNewMass && v.massKg !== null && (
            <p className="q-hint">Čuvanjem se {formatAnswerNumber(v.massKg)} kg upisuje i kao današnje merenje mase.</p>
          )}
        </div>
      )}
      {v?.outcome === "bez-plana" && (
        <div className="goal-stop" role="status">
          {v.notices.map((n) => (
            <p key={n.entryId}>{n.message}</p>
          ))}
        </div>
      )}
      {v?.outcome === "nepotpuno" && <p className="goal-lead">Odgovori na pitanja označena sa „odgovori".</p>}

      <ul className="review-list">
        {questions.map((x) => {
          const t = answerText(x, answers[x.key]);
          return (
            <li key={x.key}>
              <button type="button" className="review-row" onClick={() => edit(x.key)}>
                <span className="review-q">{x.text}</span>
                <span className={t === null ? "review-a missing" : "review-a"}>{t ?? "odgovori"}</span>
              </button>
            </li>
          );
        })}
      </ul>
      <p className="ledger-hint">Dodirni odgovor da ga promeniš.</p>

      {hasProfile && !confirmClear && (
        <button type="button" className="link-btn review-clear" onClick={() => setConfirmClear(true)}>
          Obriši moje odgovore
        </button>
      )}
      {confirmClear && (
        <div className="confirm-box review-clear">
          <p>Brišu se svi odgovori i dnevni cilj. Merenja mase ostaju.</p>
          <div className="row">
            <button type="button" className="btn btn-secondary" onClick={() => setConfirmClear(false)}>
              Ne
            </button>
            <button type="button" className="btn btn-danger" onClick={() => void clear()} disabled={busy}>
              Obriši
            </button>
          </div>
        </div>
      )}

      <div className="review-bar">
        {error && <p className="error-text">{error}</p>}
        <button type="button" className="btn btn-primary block" onClick={() => void save()} disabled={busy || !preview?.canSave}>
          Sačuvaj
        </button>
        <button type="button" className="btn btn-secondary block" onClick={onClose}>
          {hasProfile ? "Nazad bez čuvanja" : "Odustani"}
        </button>
      </div>
    </section>
  );
}
