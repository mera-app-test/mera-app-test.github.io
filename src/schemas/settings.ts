// Podešavanja i metapodaci (ARCHITECTURE.md §7.2 tačka 4 — upis mimo UnitOfWork-a dozvoljen).
import { z } from "zod";
import { IsoDateTimeSchema } from "./common";

export const SettingsSchema = z.object({
  lastExportAt: IsoDateTimeSchema.nullable(),
  persistRequestedAt: IsoDateTimeSchema.nullable(),
  persistGranted: z.boolean().nullable(),
});
export type Settings = z.infer<typeof SettingsSchema>;
export type SettingKey = keyof Settings;

export const DEFAULT_SETTINGS: Settings = {
  lastExportAt: null,
  persistRequestedAt: null,
  persistGranted: null,
};
