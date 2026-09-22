// Rezervna kopija: ručni izvoz i uvoz (ARCHITECTURE.md §11).
import { useCallback, useEffect, useRef, useState, type ChangeEvent } from "react";
import type { BackupStatus, ParsedBackup } from "../../application";
import { useServices } from "../ServicesContext";
import { formatDateTime } from "../format";

type Notice = { kind: "ok" | "error"; text: string } | null;

export function BackupScreen({ onClose }: { onClose: () => void }) {
  const { backup } = useServices();
  const [status, setStatus] = useState<BackupStatus | null>(null);
  const [notice, setNotice] = useState<Notice>(null);
  const [preview, setPreview] = useState<ParsedBackup | null>(null);
  const [busy, setBusy] = useState(false);
  const fileInput = useRef<HTMLInputElement>(null);

  const refresh = useCallback(async () => setStatus(await backup.status()), [backup]);
  useEffect(() => {
    void refresh();
  }, [refresh]);

  const doExport = async () => {
    setBusy(true);
    setNotice(null);
    const r = await backup.exportNow();
    setNotice(r.ok ? { kind: "ok", text: `Kopija je sačuvana kao ${r.fileName}. Nalazi se u Preuzimanjima.` } : { kind: "error", text: r.message });
    await refresh();
    setBusy(false);
  };

  const onFile = async (e: ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    e.target.value = "";
    if (!f) return;
    setBusy(true);
    setNotice(null);
    const r = await backup.previewImport(await f.text());
    if (r.ok) setPreview(r.backup);
    else setNotice({ kind: "error", text: r.error.message });
    setBusy(false);
  };

  const doImport = async () => {
    if (!preview) return;
    setBusy(true);
    try {
      await backup.confirmImport(preview);
      setNotice({ kind: "ok", text: "Podaci su vraćeni iz kopije." });
      setPreview(null);
      await refresh();
    } catch (err) {
      setNotice({ kind: "error", text: `Uvoz nije uspeo: ${err instanceof Error ? err.message : String(err)}. Trenutni podaci nisu promenjeni.` });
    }
    setBusy(false);
  };

  return (
    <section className="backup" aria-labelledby="backup-title">
      <h1 id="backup-title" className="section-title">Rezervna kopija</h1>

      <dl className="facts">
        <div>
          <dt>Poslednja kopija</dt>
          <dd>{status ? (status.lastExportAt ? formatDateTime(status.lastExportAt) : "još nije napravljena") : "…"}</dd>
        </div>
        <div>
          <dt>Zaštita od automatskog brisanja</dt>
          <dd>{status ? (status.persisted === true ? "uključena" : status.persisted === false ? "nije uključena" : "pregledač ne podržava") : "…"}</dd>
        </div>
      </dl>

      <p className="muted">Kopija čuva sve tvoje podatke u jednom fajlu na telefonu. Pravi je jednom nedeljno.</p>
      <button type="button" className="btn btn-primary block" disabled={busy} onClick={doExport}>
        Sačuvaj rezervnu kopiju
      </button>

      {notice && <p className={notice.kind === "ok" ? "notice-ok" : "error-text"}>{notice.text}</p>}

      <h2 className="subsection-title">Vrati podatke iz kopije</h2>
      {!preview && (
        <>
          <p className="muted">Uvoz zamenjuje sve trenutne podatke podacima iz izabranog fajla.</p>
          <button type="button" className="btn btn-secondary block" disabled={busy} onClick={() => fileInput.current?.click()}>
            Izaberi fajl kopije
          </button>
          <input ref={fileInput} type="file" accept="application/json,.json" hidden onChange={onFile} />
        </>
      )}
      {preview && (
        <div className="confirm-box">
          <p>
            Kopija od <strong>{formatDateTime(preview.exportedAt)}</strong>, merenja: <strong>{preview.counts.measurements}</strong>.
          </p>
          <p className="muted">Trenutni podaci biće zamenjeni. Pre zamene Mera ih sama sačuva na telefonu.</p>
          <div className="row">
            <button type="button" className="btn btn-secondary" disabled={busy} onClick={() => setPreview(null)}>
              Otkaži
            </button>
            <button type="button" className="btn btn-primary" disabled={busy} onClick={doImport}>
              Zameni podatke
            </button>
          </div>
        </div>
      )}

      <button type="button" className="btn btn-secondary block back" onClick={onClose}>
        Nazad na Danas
      </button>
    </section>
  );
}
