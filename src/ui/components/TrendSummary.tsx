// Prikaz trenda mase (MS §13, §30; NUTRITION_ENGINE.md T2–T4, T7). Brojeve računa domain/trend; ovde je samo prikaz.
import type { AverageResult, SlopeResult, TrendAnalysis } from "../../application";
import { formatApproxKg, formatKgPerWeek, formatPercent } from "../format";

const merenja = (n: number) => (n === 1 ? "potrebno još 1 merenje" : `potrebno još ${n} merenja`);

function averageText(a: AverageResult): string {
  return a.ok ? formatApproxKg(a.averageKg) : merenja(a.missingDays);
}

function slopeText(s: SlopeResult, rate: TrendAnalysis["rate"]): string {
  if (s.ok) {
    const pct = rate && rate.windowDays === s.windowDays ? ` (${formatPercent(rate.percentPerWeek)})` : "";
    return `${formatKgPerWeek(s.kgPerWeek)}${pct}`;
  }
  if (s.missingDays > 0) return merenja(s.missingDays);
  if (s.missingStart) return "nema merenja sa početka perioda";
  return "nema merenja iz poslednjih dana";
}

export function TrendSummary({ trend }: { trend: TrendAnalysis }) {
  return (
    <dl className="trend">
      <div className={trend.average.ok ? "trend-row" : "trend-row pending"}>
        <dt>Prosek {trend.average.windowDays} dana</dt>
        <dd>{averageText(trend.average)}</dd>
      </div>
      {trend.slopes.map((s) => (
        <div key={s.windowDays} className={s.ok ? "trend-row" : "trend-row pending"}>
          <dt>Trend {s.windowDays} dana</dt>
          <dd>{slopeText(s, trend.rate)}</dd>
        </div>
      ))}
    </dl>
  );
}
