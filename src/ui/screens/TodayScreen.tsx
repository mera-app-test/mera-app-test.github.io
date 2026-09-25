// Glavni ekran „DANAS" (MS §15): dnevni cilj iz upitnika, kartica „Masa", namirnice i podsetnik za rezervnu kopiju. Jelovnik još ne postoji.
import { useEffect, useState } from "react";
import type { BackupStatus } from "../../application";
import { useServices } from "../ServicesContext";
import { WeightCard } from "../components/WeightCard";
import { GoalCard } from "../components/GoalCard";

const dateFormatter = new Intl.DateTimeFormat("sr-Latn-RS", { weekday: "long", day: "numeric", month: "long" });

interface TodayProps {
  onOpenBackup: () => void;
  onEnterWeight: () => void;
  onOpenWeights: () => void;
  onOpenFoods: () => void;
  onOpenProfile: () => void;
}

export function TodayScreen({ onOpenBackup, onEnterWeight, onOpenWeights, onOpenFoods, onOpenProfile }: TodayProps) {
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
      <GoalCard onOpenQuestionnaire={onOpenProfile} />
      <WeightCard onEnter={onEnterWeight} onOpenList={onOpenWeights} />
      <section className="weight-card food-entry" aria-labelledby="foods-card-title">
        <h2 id="foods-card-title" className="weight-card-title">Namirnice</h2>
        <p className="weight-empty">Kalorije i sastav namirnica, sa izvorom svakog broja.</p>
        <button type="button" className="btn btn-secondary block" onClick={onOpenFoods}>
          Otvori namirnice
        </button>
      </section>
    </section>
  );
}
