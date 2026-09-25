import { Suspense, useCallback, useRef, useState, type ComponentType } from "react";
import type { AppServices } from "../application";
import { formatVersionLabel, isTestEnvironment } from "../application";
import { ServicesContext } from "./ServicesContext";
import { ExitGuard } from "./components/ExitGuard";
import { TodayScreen } from "./screens/TodayScreen";
import { BackupScreen } from "./screens/BackupScreen";
import { WeightScreen } from "./screens/WeightScreen";
import { FoodsScreen } from "./screens/FoodsScreen";
import { KnowledgeScreen } from "./screens/KnowledgeScreen";
import { ProfileScreen } from "./screens/ProfileScreen";

/** Ekran provere uređaja postoji samo u test/dev build-u; composition root ga predaje ili ne. */
export type DiagnosticsScreenComponent = ComponentType<{ onClose: () => void }>;

type Screen = "today" | "backup" | "diagnostics" | "weight-entry" | "weight-list" | "foods" | "knowledge" | "profile";

interface AppProps {
  services: AppServices;
  DiagnosticsScreen: DiagnosticsScreenComponent | null;
}

export function App({ services, DiagnosticsScreen }: AppProps) {
  const [screen, setScreen] = useState<Screen>("today");
  const showTest = isTestEnvironment(services.build);

  /** Ekran sa unutrašnjim koracima (npr. detalj namirnice) prvo sam obrađuje „nazad". */
  const innerBack = useRef<(() => boolean) | null>(null);

  const handleBack = useCallback((): boolean => {
    if (innerBack.current?.()) return true;
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
        {showTest && screen === "today" && (
          <div style={{ padding: "12px 16px 0" }}>
            <a className="btn btn-primary" style={{ display: "flex", alignItems: "center", justifyContent: "center", width: "100%", boxSizing: "border-box", textDecoration: "none" }} href="/prototip.html">
              Pogledaj predlog izgleda
            </a>
          </div>
        )}
        <main className="main">
          {screen === "today" && (
            <TodayScreen
              onOpenBackup={() => setScreen("backup")}
              onEnterWeight={() => setScreen("weight-entry")}
              onOpenWeights={() => setScreen("weight-list")}
              onOpenFoods={() => setScreen("foods")}
              onOpenProfile={() => setScreen("profile")}
            />
          )}
          {(screen === "weight-entry" || screen === "weight-list") && (
            <WeightScreen focusInput={screen === "weight-entry"} onClose={() => setScreen("today")} />
          )}
          {screen === "profile" && <ProfileScreen onClose={() => setScreen("today")} innerBack={innerBack} />}
          {screen === "foods" && <FoodsScreen onClose={() => setScreen("today")} innerBack={innerBack} />}
          {screen === "knowledge" && <KnowledgeScreen onClose={() => setScreen("today")} />}
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
              {showTest && (
                <button type="button" className="link-btn" onClick={() => setScreen("knowledge")}>
                  Baza znanja
                </button>
              )}
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
