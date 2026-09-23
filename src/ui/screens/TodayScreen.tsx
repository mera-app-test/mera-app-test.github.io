// Glavni ekran „DANAS" (MS §15). Plan još ne postoji — prazno stanje, kartica „Masa" i podsetnik za rezervnu kopiju.
import { useEffect, useState } from "react";
import type { BackupStatus } from "../../application";
import { useServices } from "../ServicesContext";
import { WeightCard } from "../components/WeightCard";

const dateFormatter = new Intl.DateTimeFormat("sr-Latn-RS", { weekday: "long", day: "numeric", month: "long" });

interface TodayProps {
  onOpenBackup: () => void;
  onEnterWeight: () => void;
  onOpenWeights: () => void;
}

export function TodayScreen({ onOpenBackup, onEnterWeight, onOpenWeights }: TodayProps) {
  const { backup } = useServices();
  const [status, setStatus] = useState<BackupStatus | null>(null);
  const today = dateFormatter.format(new Date());

  useEffect(() => {
    let alive = true;
    void backup.status().then((s) => alive && setStatus(s));
    return () => {
      alive = false;
    };
  }, [backup]);

  return (
    <section className="today" aria-labelledby="today-title">
      {status?.due && (
        <div className="reminder" role="status">
          <p>{status.lastExportAt === null ? "Još nema rezervne kopije tvojih podataka." : "Prošlo je 7 dana od poslednje rezervne kopije."}</p>
          <button type="button" className="btn btn-primary" onClick={onOpenBackup}>
            Sačuvaj rezervnu kopiju
          </button>
        </div>
      )}
      <header className="today-head">
        <h1 id="today-title" className="today-title">Danas</h1>
        <p className="today-date">{today}</p>
      </header>
      <div className="empty">
        <p className="empty-lead">Plan za danas još ne postoji.</p>
        <p className="empty-body">
          Mera je u izradi. Ovde će stajati obroci za danas, sa količinama i kalorijama.
        </p>
      </div>
      <WeightCard onEnter={onEnterWeight} onOpenList={onOpenWeights} />
    </section>
  );
}
