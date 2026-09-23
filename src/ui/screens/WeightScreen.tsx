// Unos telesne mase i pregled poslednjih merenja sa brisanjem pogrešnog unosa (MS §12, §13; ARCHITECTURE §17 korak 3).
// Trend po odobrenom skupu parametara (docs/NUTRITION_ENGINE.md deo T).
import { useCallback, useEffect, useRef, useState, type FormEvent } from "react";
import type { TrendAnalysis, WeightEntryView, WeightOverview } from "../../application";
import { TrendSummary } from "../components/TrendSummary";
import { useServices } from "../ServicesContext";
import { formatDay, formatKg, formatTime } from "../format";

/** Koliko dana unazad se prikazuje u listi (samo prikaz; ne utiče na proračune). */
const LIST_DAYS = 90;

type Notice = { kind: "ok" | "error"; text: string } | null;

export function WeightScreen({ focusInput, onClose }: { focusInput: boolean; onClose: () => void }) {
  const { weight } = useServices();
  const [overview, setOverview] = useState<WeightOverview | null>(null);
  const [entries, setEntries] = useState<WeightEntryView[] | null>(null);
  const [value, setValue] = useState("");
  const [date, setDate] = useState<string | null>(null); // null = danas
  const [pickingDate, setPickingDate] = useState(false);
  const [notice, setNotice] = useState<Notice>(null);
  const [busy, setBusy] = useState(false);
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const [freshId, setFreshId] = useState<string | null>(null);
  const [trend, setTrend] = useState<TrendAnalysis | null>(null);
  /** T5: vrednost izvan uobičajenog opsega čeka potvrdu korisnika. */
  const [pendingConfirm, setPendingConfirm] = useState<number | null>(null);
  const input = useRef<HTMLInputElement>(null);

  const refresh = useCallback(async () => {
    const [o, list, t] = await Promise.all([weight.overview(), weight.listRecent(LIST_DAYS), weight.trend()]);
    setOverview(o);
    setEntries(list);
    setTrend(t);
  }, [weight]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  useEffect(() => {
    if (focusInput) input.current?.focus();
  }, [focusInput]);

  const save = async (e: FormEvent) => {
    e.preventDefault();
    await submit(false);
  };

  const submit = async (confirmed: boolean) => {
    if (busy) return;
    setBusy(true);
    setNotice(null);
    setPendingConfirm(null);
    try {
      const r = await weight.log({ valueText: value, ...(date ? { localDate: date } : {}), ...(confirmed ? { confirmed: true } : {}) });
      if (!r.ok && r.needsConfirmation) {
        setPendingConfirm(r.valueKg);
      } else if (r.ok) {
        setValue("");
        setFreshId(r.entry.id);
        setNotice({ kind: "ok", text: `Sačuvano: ${formatKg(r.entry.valueKg)} kg.` });
        await refresh();
      } else {
        setNotice({ kind: "error", text: r.message });
        input.current?.focus();
      }
    } catch (err) {
      setNotice({ kind: "error", text: `Čuvanje nije uspelo: ${err instanceof Error ? err.message : String(err)}` });
    }
    setBusy(false);
  };

  const remove = async (id: string) => {
    setBusy(true);
    try {
      const r = await weight.remove(id);
      setNotice(r.ok ? { kind: "ok", text: "Merenje je obrisano." } : { kind: "error", text: r.message });
      setConfirmId(null);
      await refresh();
    } catch (err) {
      setNotice({ kind: "error", text: `Brisanje nije uspelo: ${err instanceof Error ? err.message : String(err)}` });
    }
    setBusy(false);
  };

  const today = overview?.today ?? "";
  const yesterday = overview?.yesterday ?? "";
  const dayLabel = date && overview ? formatDay(date, today, yesterday) : "danas";

  return (
    <section className="weight" aria-labelledby="weight-title">
      <h1 id="weight-title" className="section-title">Masa</h1>

      <form className="weight-form" onSubmit={save} noValidate>
        <label htmlFor="weight-input" className="weight-label">
          Tvoja masa
        </label>
        <div className="weight-input-row">
          <input
            ref={input}
            id="weight-input"
            className="weight-input"
            type="text"
            inputMode="decimal"
            autoComplete="off"
            enterKeyHint="done"
            placeholder="0,0"
            value={value}
            onChange={(e) => {
              setValue(e.target.value);
              setPendingConfirm(null);
            }}
            aria-describedby="weight-notice"
          />
          <span className="weight-input-unit" aria-hidden="true">kg</span>
        </div>

        <div className="weight-date">
          {!pickingDate ? (
            <>
              <span>
                Za: <strong>{dayLabel}</strong>
              </span>
              <button type="button" className="link-btn" onClick={() => setPickingDate(true)} disabled={!overview}>
                Drugi dan
              </button>
            </>
          ) : (
            <>
              <label htmlFor="weight-date-input" className="weight-date-label">Dan merenja</label>
              <input
                id="weight-date-input"
                className="weight-date-input"
                type="date"
                max={today}
                value={date ?? today}
                onChange={(e) => setDate(e.target.value === "" || e.target.value === today ? null : e.target.value)}
              />
              <button
                type="button"
                className="link-btn"
                onClick={() => {
                  setDate(null);
                  setPickingDate(false);
                }}
              >
                Danas
              </button>
            </>
          )}
        </div>

        {pendingConfirm === null ? (
          <button type="submit" className="btn btn-primary block" disabled={busy}>
            Sačuvaj
          </button>
        ) : (
          <div className="confirm-box" role="alertdialog" aria-labelledby="weight-confirm-q">
            <p id="weight-confirm-q">
              Da li je <strong>{formatKg(pendingConfirm)} kg</strong> tačno?
            </p>
            <div className="row">
              <button
                type="button"
                className="btn btn-secondary"
                disabled={busy}
                onClick={() => {
                  setPendingConfirm(null);
                  input.current?.focus();
                }}
              >
                Ispravi
              </button>
              <button type="button" className="btn btn-primary" disabled={busy} onClick={() => void submit(true)}>
                Da, sačuvaj
              </button>
            </div>
          </div>
        )}
        <p id="weight-notice" className={notice?.kind === "error" ? "error-text weight-notice" : "notice-ok weight-notice"} role="status">
          {notice?.text ?? ""}
        </p>
      </form>

      {trend && entries && entries.length > 0 && (
        <>
          <h2 className="subsection-title">Trend</h2>
          <TrendSummary trend={trend} />
        </>
      )}

      <h2 className="subsection-title">Merenja</h2>
      {entries === null ? (
        <p className="muted">…</p>
      ) : entries.length === 0 ? (
        <p className="muted">Još nema merenja u poslednjih {LIST_DAYS} dana.</p>
      ) : (
        <ul className="weight-list">
          {entries.map((m) => (
            <li key={m.id} className={m.id === freshId ? "weight-row fresh" : "weight-row"}>
              {confirmId === m.id ? (
                <div className="weight-confirm">
                  <p>
                    Obrisati <strong>{formatKg(m.valueKg)} kg</strong> ({formatDay(m.localDate, today, yesterday)})?
                  </p>
                  <div className="row">
                    <button type="button" className="btn btn-secondary" disabled={busy} onClick={() => setConfirmId(null)}>
                      Otkaži
                    </button>
                    <button type="button" className="btn btn-danger" disabled={busy} onClick={() => void remove(m.id)}>
                      Obriši
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <span className="weight-row-main">
                    <span className="weight-row-value">{formatKg(m.valueKg)} kg</span>
                    <span className="weight-row-when">
                      {formatDay(m.localDate, today, yesterday)}
                      {m.timeKnown ? `, ${formatTime(m.measuredAt)}` : ""}
                    </span>
                  </span>
                  <button type="button" className="btn btn-quiet" onClick={() => setConfirmId(m.id)} aria-label={`Obriši ${formatKg(m.valueKg)} kg`}>
                    Obriši
                  </button>
                </>
              )}
            </li>
          ))}
        </ul>
      )}

      <button type="button" className="btn btn-secondary block back" onClick={onClose}>
        Nazad na Danas
      </button>
    </section>
  );
}
