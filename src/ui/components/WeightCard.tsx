// Kartica „Masa" na ekranu Danas: poslednje merenje i ulaz u unos (MS §12, §15).
import { useEffect, useState } from "react";
import type { WeightOverview } from "../../application";
import { useServices } from "../ServicesContext";
import { formatDay, formatKg, formatTime } from "../format";

export function WeightCard({ onEnter, onOpenList }: { onEnter: () => void; onOpenList: () => void }) {
  const { weight } = useServices();
  const [overview, setOverview] = useState<WeightOverview | null>(null);

  useEffect(() => {
    let alive = true;
    void weight.overview().then((o) => alive && setOverview(o));
    return () => {
      alive = false;
    };
  }, [weight]);

  const latest = overview?.latest ?? null;

  return (
    <section className="weight-card" aria-labelledby="weight-card-title">
      <h2 id="weight-card-title" className="weight-card-title">Masa</h2>
      {overview === null ? (
        <p className="muted">…</p>
      ) : latest ? (
        <button type="button" className="weight-latest" onClick={onOpenList} aria-label="Otvori sva merenja">
          <span className="weight-value">
            {formatKg(latest.valueKg)}
            <span className="weight-unit"> kg</span>
          </span>
          <span className="weight-when">
            {formatDay(latest.localDate, overview.today, overview.yesterday)}
            {latest.timeKnown ? ` u ${formatTime(latest.measuredAt)}` : ""}
          </span>
        </button>
      ) : (
        <p className="weight-empty">Upiši prvu masu. Iz merenja kroz vreme Mera će pratiti tvoj napredak.</p>
      )}
      <button type="button" className="btn btn-primary block" onClick={onEnter}>
        Unesi masu
      </button>
      {latest && (
        <button type="button" className="link-btn weight-all" onClick={onOpenList}>
          Sva merenja
        </button>
      )}
    </section>
  );
}
