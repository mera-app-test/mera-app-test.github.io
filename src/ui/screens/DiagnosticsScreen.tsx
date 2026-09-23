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
  const resultFor = (ids: readonly string[]) => results.filter((r) => ids.includes(r.id));

  interface Step {
    key: string;
    title: string;
    hint: string;
    label: string;
    resultIds: readonly string[];
    act: () => void;
  }
  const steps: Step[] = svc
    ? [
        { key: "persist", title: "Trajno skladište", hint: "Dodirni dugme. Rezultat se pojavljuje odmah ispod.", label: "Zatraži trajno skladište", resultIds: ["persist"], act: () => void run("persist", svc.requestPersistentStorage) },
        { key: "download", title: "Preuzimanje fajla", hint: "Dodirni dugme. Chrome treba da javi da je fajl preuzet.", label: "Preuzmi probni fajl", resultIds: ["download"], act: () => void run("download", svc.testFileDownload) },
        { key: "import", title: "Uvoz fajla", hint: "Dodirni dugme i u Preuzimanjima izaberi fajl „mera-proba-….json”.", label: "Izaberi probni fajl za uvoz", resultIds: ["import"], act: () => fileInput.current?.click() },
        { key: "share", title: "Deljenje fajla", hint: "Dodirni dugme. Treba da se otvori meni za deljenje; možeš ga zatvoriti.", label: "Podeli probni fajl", resultIds: ["share"], act: () => void run("share", svc.testFileShare) },
        { key: "speech", title: "Govor na srpskom", hint: "Dodirni dugme, pa kada piše „Slušam” izgovori rečenicu, npr. „Danas sam doručkovao dva jaja”.", label: "Proveri govor na srpskom", resultIds: ["speech"], act: () => void run("speech", svc.testSpeech) },
        { key: "speech-local", title: "Govor bez servera", hint: "Dodirni dugme. Proverava da li telefon prepoznaje srpski bez slanja zvuka na internet.", label: "Proveri govor bez servera", resultIds: ["speech-available-local"], act: () => void run("speech-local", svc.checkSpeechOnDevice) },
        { key: "off", title: "Baza proizvoda (barkod)", hint: "Dodirni dugme. Proverava da li Mera može da pita Open Food Facts za proizvod.", label: "Proveri Open Food Facts", resultIds: ["off"], act: () => void run("off", svc.testOpenFoodFacts) },
      ]
    : [];
  const autoIds = new Set(steps.flatMap((st) => st.resultIds));
  const autoResults = results.filter((r) => !autoIds.has(r.id));

  const renderResult = (r: ProbeResult) => (
    <div key={r.id} className={`diag-item status-${r.status}`} role="status">
      <span className="diag-status">{STATUS_TEXT[r.status]}</span>
      <span className="diag-name">{r.naziv}</span>
      <span className="diag-detail">{r.detalji}</span>
    </div>
  );

  return (
    <section className="diag" aria-labelledby="diag-title">
      <header className="diag-head">
        <h1 id="diag-title" className="diag-title">Provera uređaja</h1>
        <p className="muted">Idi redom od 1 do {steps.length || 7}. Ispod svakog dugmeta se pojavi rezultat. Na kraju dodirni „Kopiraj izveštaj”.</p>
      </header>

      {!svc && <p className="muted">Učitavam proveru…</p>}

      <ol className="diag-steps">
        {steps.map((st, i) => (
          <li key={st.key} className="diag-step">
            <h2 className="diag-step-title">{i + 1}. {st.title}</h2>
            <p className="diag-step-hint">{st.hint}</p>
            <button type="button" className="btn btn-secondary block" disabled={disabled} onClick={st.act}>
              {st.label}
            </button>
            {busy === st.key && (
              <p className={st.key === "speech" ? "diag-busy diag-listening" : "diag-busy"} role="status">
                {st.key === "speech" ? "🎤 Slušam… govori sada" : "Proveravam…"}
              </p>
            )}
            {busy !== st.key && resultFor(st.resultIds).map(renderResult)}
          </li>
        ))}
      </ol>
      <input ref={fileInput} type="file" accept="application/json,.json,text/plain" hidden onChange={onFile} />

      <h2 className="diag-step-title">Automatske provere</h2>
      <p className="diag-step-hint">Ovo se proveri samo. Ne moraš ništa da radiš.</p>
      {busy === "auto" && <p className="diag-busy">Proveravam…</p>}
      <div className="diag-list">{autoResults.map(renderResult)}</div>

      <div className="diag-footer">
        <button type="button" className="btn btn-primary" disabled={disabled || results.length === 0} onClick={copy}>
          Kopiraj izveštaj
        </button>
        {copied === "da" && <p className="notice-ok">Izveštaj je kopiran. Nalepi ga u razgovor.</p>}
        {copied === "ne" && <p className="error-text">Kopiranje nije uspelo. Napravi snimak ekrana.</p>}
        <button type="button" className="btn btn-secondary" onClick={onClose}>
          Nazad na Danas
        </button>
      </div>
    </section>
  );
}
