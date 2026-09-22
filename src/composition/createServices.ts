// COMPOSITION ROOT — jedino mesto gde se biraju implementacije portova (ARCHITECTURE.md §6.1, §12.1).
// Prelazak na server menja samo ovaj fajl i infrastructure/, ne UI ni domain.
import { createBackupService, type AppServices, type BuildInfo } from "../application";
import { createLocalDataProvider } from "../infrastructure/data-local";
import {
  createBrowserClock,
  createBrowserFileExporter,
  createBrowserHasher,
  createBrowserIdGenerator,
  createBrowserStoragePersistence,
} from "../infrastructure/platform/browserPlatform";

export async function createServices(): Promise<AppServices> {
  const build: BuildInfo = {
    env: __MERA_ENV__,
    version: __APP_VERSION__,
    sha: __BUILD_SHA__,
    builtAt: __BUILT_AT__,
  };
  const clock = createBrowserClock();
  const ids = createBrowserIdGenerator();

  const data = await createLocalDataProvider({
    now: () => clock.nowIso(),
    newId: () => ids.newId(),
    // Druga kartica je otvorila noviju verziju baze: ova kartica se osvežava na novu verziju aplikacije.
    onVersionChange: () => location.reload(),
  });

  const backup = createBackupService({
    data,
    clock,
    ids,
    hasher: createBrowserHasher(),
    files: createBrowserFileExporter(),
    persistence: createBrowserStoragePersistence(),
    appVersion: `${build.version}+${build.sha}`,
  });

  // U produkciji je __MERA_ENV__ === "prod", pa bundler izbacuje ceo dijagnostički kod.
  const loadDiagnostics =
    __MERA_ENV__ !== "prod"
      ? async () => {
          const [{ createBrowserProbe }, { createDiagnosticsService }] = await Promise.all([
            import("../infrastructure/platform/browserProbe"),
            import("../application/diagnostics/diagnostics"),
          ]);
          return createDiagnosticsService(createBrowserProbe(), build);
        }
      : null;

  return { build, backup, loadDiagnostics };
}
