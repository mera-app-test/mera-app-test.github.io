// APPLICATION — use case-ovi. Jedino mesto gde se spajaju domain, validation, safety i portovi.
export type { BuildInfo, MeraEnv } from "./buildInfo";
export { formatVersionLabel, isTestEnvironment } from "./buildInfo";
export type { DiagnosticsService } from "./diagnostics/diagnostics";
export { createDiagnosticsService, formatReport } from "./diagnostics/diagnostics";
export type { ProbeResult, ProbeStatus, ImportedFile } from "../ports/platform/PlatformProbe";
export type { AppServices } from "./services";
