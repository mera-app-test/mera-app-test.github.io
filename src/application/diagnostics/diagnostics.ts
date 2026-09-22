// Use case: provera uređaja za stavke [PROVERITI]. Samo TEST okruženje.
import type { ImportedFile, PlatformProbe, ProbeResult } from "../../ports/platform/PlatformProbe";
import type { BuildInfo } from "../buildInfo";
import { formatVersionLabel } from "../buildInfo";

export interface DiagnosticsService {
  runAutomatic(): Promise<ProbeResult[]>;
  requestPersistentStorage(): Promise<ProbeResult>;
  testFileDownload(): Promise<ProbeResult>;
  testFileShare(): Promise<ProbeResult>;
  verifyImportedFile(file: ImportedFile): Promise<ProbeResult>;
  testSpeech(): Promise<ProbeResult>;
  checkSpeechOnDevice(): Promise<ProbeResult>;
  testOpenFoodFacts(): Promise<ProbeResult>;
  buildReport(results: readonly ProbeResult[], nowIso: string): string;
  copyReport(report: string): Promise<boolean>;
}

/** Jezik koji Mera treba da prepoznaje (MS §36). */
export const SPEECH_LANG = "sr-RS";
/** Poznat barkod iz zvanične Open Food Facts dokumentacije (tutorial). */
export const OFF_TEST_BARCODE = "3017624010701";

const STATUS_LABEL: Record<ProbeResult["status"], string> = {
  ok: "OK",
  upozorenje: "UPOZORENJE",
  greska: "GREŠKA",
  nije_podrzano: "NIJE PODRŽANO",
  info: "INFO",
};

/** Čista funkcija: tekstualni izveštaj za slanje razvojnom agentu. */
export function formatReport(
  results: readonly ProbeResult[],
  build: BuildInfo,
  client: string,
  nowIso: string,
): string {
  const lines = [
    "MERA — izveštaj provere uređaja",
    `Vreme: ${nowIso}`,
    `Verzija: ${formatVersionLabel(build)} [${build.env}]`,
    `Pregledač: ${client}`,
    "",
  ];
  for (const r of results) {
    lines.push(`[${STATUS_LABEL[r.status]}] ${r.naziv}: ${r.detalji}`);
  }
  return lines.join("\n");
}

export function createDiagnosticsService(probe: PlatformProbe, build: BuildInfo): DiagnosticsService {
  return {
    runAutomatic: () => probe.runAutomatic(),
    requestPersistentStorage: () => probe.requestPersistentStorage(),
    testFileDownload: () => probe.testFileDownload(),
    testFileShare: () => probe.testFileShare(),
    verifyImportedFile: (file) => probe.verifyImportedFile(file),
    testSpeech: () => probe.testSpeech(SPEECH_LANG),
    checkSpeechOnDevice: () => probe.checkSpeechOnDevice(SPEECH_LANG),
    testOpenFoodFacts: () => probe.testOpenFoodFacts(OFF_TEST_BARCODE),
    buildReport: (results, nowIso) => formatReport(results, build, probe.describeClient(), nowIso),
    copyReport: (report) => probe.copyText(report),
  };
}
