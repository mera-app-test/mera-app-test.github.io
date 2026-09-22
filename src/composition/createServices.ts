// COMPOSITION ROOT — jedino mesto gde se biraju implementacije portova (ARCHITECTURE.md §6.1, §12.1).
// Prelazak na server menja samo ovaj fajl i infrastructure/, ne UI ni domain.
import type { AppServices, BuildInfo } from "../application";

export function createServices(): AppServices {
  const build: BuildInfo = {
    env: __MERA_ENV__,
    version: __APP_VERSION__,
    sha: __BUILD_SHA__,
    builtAt: __BUILT_AT__,
  };

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

  return { build, loadDiagnostics };
}
