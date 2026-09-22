import { lazy, StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { App } from "../ui/App";
import { createServices } from "./createServices";
import "../ui/styles.css";

const root = document.getElementById("root");
if (!root) throw new Error("Nedostaje #root element");

// U produkciji je __MERA_ENV__ === "prod": bundler izbacuje ekran provere uređaja iz build-a.
const DiagnosticsScreen =
  __MERA_ENV__ !== "prod" ? lazy(() => import("../ui/screens/DiagnosticsScreen")) : null;

createRoot(root).render(
  <StrictMode>
    <App services={createServices()} DiagnosticsScreen={DiagnosticsScreen} />
  </StrictMode>,
);
