import { lazy, StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { App } from "../ui/App";
import { StartupError } from "../ui/screens/StartupError";
import { createServices } from "./createServices";
import "../ui/styles.css";

const rootEl = document.getElementById("root");
if (!rootEl) throw new Error("Nedostaje #root element");
const root = createRoot(rootEl);

// U produkciji je __MERA_ENV__ === "prod": bundler izbacuje ekran provere uređaja iz build-a.
const DiagnosticsScreen =
  __MERA_ENV__ !== "prod" ? lazy(() => import("../ui/screens/DiagnosticsScreen")) : null;

createServices().then(
  (services) =>
    root.render(
      <StrictMode>
        <App services={services} DiagnosticsScreen={DiagnosticsScreen} />
      </StrictMode>,
    ),
  (err: unknown) => root.render(<StartupError message={err instanceof Error ? err.message : String(err)} />),
);
