// Provera uređaja — samo TEST verzija. Služi za potvrdu stavki [PROVERITI] na telefonu vlasnika.
import { useEffect, useRef, useState, type ChangeEvent } from "react";
import type { DiagnosticsService, ProbeResult } from "../../application";
import { useServices } from "../ServicesContext";

const STATUS_TEXT: Record<ProbeResult["status"], string> = {
  ok: "Radi",
  upozorenje: "Upozorenje",
  greska: "Greška",
  nije_podrzano: "Nije podržano",
  info: "Info",
};

function upsert(list: ProbeResult[], item: ProbeResult): ProbeResult[] {
  const i = list.findIndex((x) => x.id === item.id);
  if (i === -1) return [...list, item];
  const copy = list.slice();
  copy[i] = item;
  return copy;
}

export default function DiagnosticsScreen({ onClose }: { onClose: () => void }) {
  const { loadDiagnostics } = useServices();
  const [svc, setSvc] = useState<DiagnosticsService | null>(null);
  const [results, setResults] = useState<ProbeResult[]>([]);
  const [busy, setBusy] = useState<string | null>("auto");
  const [copied, setCopied] = useState<"da" | "ne" | null>(null);
  const fileInput = useRef<HTMLInputElement>(null);

  useEffect(() => {
    let alive = true;
    if (!loadDiagnostics) return;
    void (async () => {
      const s = await loadDiagnostics();
      if (!alive) return;
      setSvc(s);
      const auto = await s.runAutomatic();
      if (!alive) return;
      setResults(auto);
      setBusy(null);
    })();
    return () => {
      alive = false;
    };
  }, [loadDiagnostics]);

  const run = async (key: string, fn: () => Promise<ProbeResult>) => {
    setBusy(key);
    setCopied(null);
    const res = await fn();
    setResults((prev) => upsert(prev, res));
    setBusy(null);
  };

  const onFile = async (e: ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    e.target.value = "";
    if (!f || !svc) return;
    await run("import", async () => svc.verifyImportedFile({ name: f.name, size: f.size, text: await f.text() }));
  };

  const copy = async () => {
    if (!svc) return;
    const ok = await svc.copyReport(svc.buildReport(results, new Date().toISOString()));
    setCopied(ok ? "da" : "ne");
  };

  const disabled = busy !== null || !svc;

  return (
    <section className="diag" aria-labelledby="diag-title">
      <header className="diag-head">
        <h1 id="diag-title" className="diag-title">Provera uređaja</h1>
        <p className="muted">Proverava da li telefon podržava ono što Mera koristi. Ne dira tvoje podatke.</p>
      </header>

      <div className="diag-actions">
        <button type="button" className="btn btn-secondary" disabled={disabled} onClick={() => svc && run("persist", svc.requestPersistentStorage)}>
          Zatraži trajno skladište
        </button>
        <button type="button" className="btn btn-secondary" disabled={disabled} onClick={() => svc && run("download", svc.testFileDownload)}>
          Preuzmi probni fajl
        </button>
        <button type="button" className="btn btn-secondary" disabled={disabled} onClick={() => svc && run("share", svc.testFileShare)}>
          Podeli probni fajl
        </button>
        <button type="button" className="btn btn-secondary" disabled={disabled} onClick={() => fileInput.current?.click()}>
          Izaberi probni fajl za uvoz
        </button>
        <input ref={fileInput} type="file" accept="application/json,.json,text/plain" hidden onChange={onFile} />
        <button type="button" className="btn btn-secondary" disabled={disabled} onClick={() => svc && run("speech", svc.testSpeech)}>
          {busy === "speech" ? "Slušam… izgovori rečenicu" : "Proveri govor na srpskom"}
        </button>
        <button type="button" className="btn btn-secondary" disabled={disabled} onClick={() => svc && run("speech-local", svc.checkSpeechOnDevice)}>
          Proveri govor bez servera
        </button>
        <button type="button" className="btn btn-secondary" disabled={disabled} onClick={() => svc && run("off", svc.testOpenFoodFacts)}>
          Proveri Open Food Facts
        </button>
      </div>

      {busy === "auto" && <p className="muted">Pokrećem automatske provere…</p>}

      <ul className="diag-list">
        {results.map((r) => (
          <li key={r.id} className={`diag-item status-${r.status}`}>
            <span className="diag-status">{STATUS_TEXT[r.status]}</span>
            <span className="diag-name">{r.naziv}</span>
            <span className="diag-detail">{r.detalji}</span>
          </li>
        ))}
      </ul>

      <div className="diag-footer">
        <button type="button" className="btn btn-primary" disabled={disabled || results.length === 0} onClick={copy}>
          Kopiraj izveštaj
        </button>
        {copied === "da" && <p className="muted">Izveštaj je kopiran. Nalepi ga u razgovor.</p>}
        {copied === "ne" && <p className="error-text">Kopiranje nije uspelo. Napravi snimak ekrana.</p>}
        <button type="button" className="btn btn-secondary" onClick={onClose}>
          Nazad na Danas
        </button>
      </div>
    </section>
  );
}
