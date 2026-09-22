import { Suspense, useCallback, useState, type ComponentType } from "react";
import type { AppServices } from "../application";
import { formatVersionLabel, isTestEnvironment } from "../application";
import { ServicesContext } from "./ServicesContext";
import { ExitGuard } from "./components/ExitGuard";
import { TodayScreen } from "./screens/TodayScreen";
import { BackupScreen } from "./screens/BackupScreen";

/** Ekran provere uređaja postoji samo u test/dev build-u; composition root ga predaje ili ne. */
export type DiagnosticsScreenComponent = ComponentType<{ onClose: () => void }>;

type Screen = "today" | "backup" | "diagnostics";

interface AppProps {
  services: AppServices;
  DiagnosticsScreen: DiagnosticsScreenComponent | null;
}

export function App({ services, DiagnosticsScreen }: AppProps) {
  const [screen, setScreen] = useState<Screen>("today");
  const showTest = isTestEnvironment(services.build);

  const handleBack = useCallback((): boolean => {
    if (screen !== "today") {
      setScreen("today");
      return true;
    }
    return false;
  }, [screen]);

  return (
    <ServicesContext.Provider value={services}>
      <div className="app">
        {showTest && (
          <div className="env-strip" role="note">
            TEST verzija. Podaci su odvojeni od prave aplikacije.
          </div>
        )}
        <main className="main">
          {screen === "today" && <TodayScreen onOpenBackup={() => setScreen("backup")} />}
          {screen === "backup" && <BackupScreen onClose={() => setScreen("today")} />}
          {screen === "diagnostics" && DiagnosticsScreen && (
            <Suspense fallback={<p className="muted">Učitavam proveru…</p>}>
              <DiagnosticsScreen onClose={() => setScreen("today")} />
            </Suspense>
          )}
        </main>
        <footer className="footer">
          <span className="muted">Verzija {formatVersionLabel(services.build)}</span>
          {screen === "today" && (
            <span className="footer-links">
              <button type="button" className="link-btn" onClick={() => setScreen("backup")}>
                Rezervna kopija
              </button>
              {showTest && DiagnosticsScreen && (
                <button type="button" className="link-btn" onClick={() => setScreen("diagnostics")}>
                  Provera uređaja
                </button>
              )}
            </span>
          )}
        </footer>
        <ExitGuard onBack={handleBack} />
      </div>
    </ServicesContext.Provider>
  );
}
