// Use case-ovi za telesnu masu (ARCHITECTURE.md §6.2 `logWeight`, MS §12 MEASURED, §13).
// Trend: domain/trend sa odobrenim skupom parametara (docs/NUTRITION_ENGINE.md deo T, reference-data/formulas).
import { addDays, analyzeTrend, isValidLocalDate, needsInputConfirmation, trendLookbackDays, type TrendAnalysis } from "../../domain";
import { BODY_MASS_INPUT_MESSAGES, parseBodyMassInput } from "../../validation";
import type { Measurement, TrendFormulaSet } from "../../schemas";
import { isDataError, type ChangeSet, type DataProvider } from "../../ports/data";
import type { Clock, IdGenerator, StoragePersistence } from "../../ports/platform";
import { auditEvent, newBase, softDeleted, type RecordContext } from "../records";
import { ensurePersistentStorageAfterSave } from "../storage/persistence";

export interface WeightEntryView {
  readonly id: string;
  readonly valueKg: number;
  readonly measuredAt: string;
  readonly localDate: string;
  /** Unos je napravljen istog dana kao merenje, pa je vreme merenja poznato. Za naknadni unos vreme se ne prikazuje. */
  readonly timeKnown: boolean;
}

export interface WeightOverview {
  readonly latest: WeightEntryView | null;
  readonly today: string;
  readonly yesterday: string;
}

export type LogWeightResult =
  | { readonly ok: true; readonly entry: WeightEntryView }
  | { readonly ok: false; readonly message: string; readonly needsConfirmation?: false }
  /** T5: vrednost je izvan uobičajenog opsega; čuva se tek kada korisnik potvrdi (`confirmed: true`). */
  | { readonly ok: false; readonly message: string; readonly needsConfirmation: true; readonly valueKg: number };

export type RemoveWeightResult = { readonly ok: true } | { readonly ok: false; readonly message: string };

export interface WeightService {
  overview(): Promise<WeightOverview>;
  /** Merenja za poslednjih `days` dana (uključujući danas), najnovije prvo. */
  listRecent(days: number): Promise<WeightEntryView[]>;
  /** `localDate` izostavljen = danas. Čuva samo ono što prođe proveru oblika broja i datuma. */
  log(input: { readonly valueText: string; readonly localDate?: string; readonly confirmed?: boolean }): Promise<LogWeightResult>;
  /** 7-dnevni prosek, 14/28-dnevni trend i stopa promene (MS §13). */
  trend(): Promise<TrendAnalysis>;
  remove(id: string): Promise<RemoveWeightResult>;
}

export interface WeightDeps {
  readonly data: DataProvider;
  readonly clock: Clock;
  readonly ids: IdGenerator;
  readonly persistence: StoragePersistence;
  readonly appVersion: string;
  readonly trendFormulas: TrendFormulaSet;
}

const toView = (m: Measurement): WeightEntryView => ({
  id: m.id,
  valueKg: m.value,
  measuredAt: m.measuredAt,
  localDate: m.localDate,
  timeKnown: m.measuredAt === m.createdAt,
});

export function createWeightService(d: WeightDeps): WeightService {
  const context = async (): Promise<RecordContext> => {
    const { userId } = await d.data.backup.info();
    return { userId, nowIso: d.clock.nowIso(), newId: () => d.ids.newId(), appVersion: d.appVersion };
  };

  return {
    async overview() {
      const latest = await d.data.measurements.latest("body_mass");
      const today = d.clock.localDate();
      return { latest: latest ? toView(latest) : null, today, yesterday: addDays(today, -1) };
    },

    async listRecent(days) {
      const today = d.clock.localDate();
      const list = await d.data.measurements.listRange("body_mass", addDays(today, -(days - 1)), today);
      return list.map(toView).reverse();
    },

    async log(input) {
      const parsed = parseBodyMassInput(input.valueText);
      if (!parsed.ok) return { ok: false, message: BODY_MASS_INPUT_MESSAGES[parsed.error] };

      if (!input.confirmed && needsInputConfirmation(parsed.valueKg, d.trendFormulas)) {
        return { ok: false, needsConfirmation: true, valueKg: parsed.valueKg, message: "Vrednost je neuobičajena. Proveri da li je tačno upisana." };
      }

      const today = d.clock.localDate();
      const localDate = input.localDate ?? today;
      if (!isValidLocalDate(localDate)) return { ok: false, message: "Datum nije ispravan." };
      if (localDate > today) return { ok: false, message: "Ne može se uneti masa za budući dan." };

      const c = await context();
      const measuredAt = localDate === today ? c.nowIso : d.clock.isoAtLocalDate(localDate);
      const record: Measurement = {
        ...newBase(c),
        type: "body_mass",
        value: parsed.valueKg,
        unit: "kg",
        measuredAt,
        localDate,
        timeZone: d.clock.timeZone(),
        note: null,
      };
      const cs: ChangeSet = {
        id: c.newId(),
        createdAt: c.nowIso,
        operations: [{ entity: "measurements", op: "put", record, expectedRev: null }],
        audit: auditEvent(c, {
          actor: "user",
          useCase: "logWeight",
          entityRefs: [{ entity: "measurements", id: record.id }],
          summary: `Unos mase ${parsed.valueKg} kg za ${localDate}.`,
        }),
      };
      await d.data.unitOfWork.commit(cs);

      // Posle prvog stvarnog čuvanja: zahtev za trajno skladište (ARCHITECTURE §9, DECISIONS/0002).
      // Neuspeh ovog zahteva ne sme poništiti već sačuvano merenje.
      try {
        await ensurePersistentStorageAfterSave(d.data.settings, d.persistence, d.clock);
      } catch {
        /* rezultat se vidi na ekranu „Rezervna kopija" */
      }
      return { ok: true, entry: toView(record) };
    },

    async trend() {
      const today = d.clock.localDate();
      const from = addDays(today, -(trendLookbackDays(d.trendFormulas) - 1));
      const list = await d.data.measurements.listRange("body_mass", from, today);
      return analyzeTrend(list.map(toView), today, d.trendFormulas);
    },

    async remove(id) {
      try {
        const prev = await d.data.measurements.get(id);
        const c = await context();
        const cs: ChangeSet = {
          id: c.newId(),
          createdAt: c.nowIso,
          operations: [{ entity: "measurements", op: "softDelete", record: softDeleted(prev, c.nowIso), expectedRev: prev.rev }],
          audit: auditEvent(c, {
            actor: "user",
            useCase: "deleteWeight",
            entityRefs: [{ entity: "measurements", id }],
            summary: `Brisanje merenja ${prev.value} kg od ${prev.localDate}.`,
          }),
        };
        await d.data.unitOfWork.commit(cs);
        return { ok: true };
      } catch (e) {
        if (isDataError(e, "NotFound")) return { ok: false, message: "Merenje je već obrisano." };
        if (isDataError(e, "Conflict")) return { ok: false, message: "Merenje je u međuvremenu promenjeno. Pokušaj ponovo." };
        throw e;
      }
    },
  };
}
