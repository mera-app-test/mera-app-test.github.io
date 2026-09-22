import { describe, expect, it } from "vitest";
import { formatReport, createDiagnosticsService, type BuildInfo, type ProbeResult } from "../../src/application";
import type { PlatformProbe } from "../../src/ports/platform/PlatformProbe";

const build: BuildInfo = { env: "test", version: "0.1.0", sha: "abc1234", builtAt: "2026-09-23T10:00:00.000Z" };
const results: ProbeResult[] = [
  { id: "indexeddb", naziv: "IndexedDB", status: "ok", detalji: "radi" },
  { id: "speech", naziv: "Govor", status: "nije_podrzano", detalji: "nema API" },
];

describe("formatReport", () => {
  it("je determinističan i sadrži sve rezultate", () => {
    const a = formatReport(results, build, "UA", "2026-09-23T10:00:00.000Z");
    const b = formatReport(results, build, "UA", "2026-09-23T10:00:00.000Z");
    expect(a).toBe(b);
    expect(a).toContain("[OK] IndexedDB: radi");
    expect(a).toContain("[NIJE PODRŽANO] Govor: nema API");
    expect(a).toContain("0.1.0 (abc1234) [test]");
  });
});

describe("createDiagnosticsService", () => {
  it("prosleđuje srpski jezik i test barkod portu", async () => {
    const calls: string[] = [];
    const fake: PlatformProbe = {
      runAutomatic: async () => [],
      requestPersistentStorage: async () => results[0]!,
      testFileDownload: async () => results[0]!,
      testFileShare: async () => results[0]!,
      verifyImportedFile: async () => results[0]!,
      testSpeech: async (lang) => { calls.push(`speech:${lang}`); return results[0]!; },
      checkSpeechOnDevice: async (lang) => { calls.push(`speech-local:${lang}`); return results[0]!; },
      testOpenFoodFacts: async (code) => { calls.push(`off:${code}`); return results[0]!; },
      copyText: async () => true,
      describeClient: () => "UA",
    };
    const svc = createDiagnosticsService(fake, build);
    await svc.testSpeech();
    await svc.checkSpeechOnDevice();
    await svc.testOpenFoodFacts();
    expect(calls).toEqual(["speech:sr-RS", "speech-local:sr-RS", "off:3017624010701"]);
  });
});
