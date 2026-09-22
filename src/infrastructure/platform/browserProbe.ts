// Implementacija PlatformProbe porta za pregledač.
// Jedino mesto u koraku 1 koje direktno koristi IndexedDB, Storage, Web Crypto, Web Share,
// Web Speech, BarcodeDetector i fetch ka Open Food Facts.
import type { ImportedFile, PlatformProbe, ProbeResult } from "../../ports/platform/PlatformProbe";

const DIAG_DB = "mera_diag"; // zasebna probna baza; nikad baza "mera"
const TEST_FILE_MARKER = "mera-diag-test-file";
const SHA256_ABC = "ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad";

function r(id: string, naziv: string, status: ProbeResult["status"], detalji: string): ProbeResult {
  return { id, naziv, status, detalji };
}

function errText(e: unknown): string {
  if (e instanceof DOMException) return `${e.name}: ${e.message}`;
  if (e instanceof Error) return `${e.name}: ${e.message}`;
  return String(e);
}

function probeFileContent(): string {
  return JSON.stringify({ marker: TEST_FILE_MARKER, createdAt: new Date().toISOString(), note: "Probni fajl Mera. Može se obrisati." }, null, 2);
}

function probeFileName(): string {
  return `mera-proba-${new Date().toISOString().slice(0, 10)}.json`;
}

async function checkSecureContext(): Promise<ProbeResult> {
  return window.isSecureContext
    ? r("secure", "Bezbedan kontekst (HTTPS)", "ok", "isSecureContext = true")
    : r("secure", "Bezbedan kontekst (HTTPS)", "greska", "isSecureContext = false — Web Crypto i PWA neće raditi");
}

async function checkRandomUUID(): Promise<ProbeResult> {
  const naziv = "crypto.randomUUID()";
  if (typeof crypto?.randomUUID !== "function") return r("uuid", naziv, "nije_podrzano", "funkcija ne postoji");
  try {
    const id = crypto.randomUUID();
    const valid = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/.test(id);
    return r("uuid", naziv, valid ? "ok" : "greska", valid ? `primer: ${id}` : `neispravan format: ${id}`);
  } catch (e) {
    return r("uuid", naziv, "greska", errText(e));
  }
}

async function checkSha256(): Promise<ProbeResult> {
  const naziv = "Web Crypto SHA-256";
  if (!crypto?.subtle?.digest) return r("sha256", naziv, "nije_podrzano", "crypto.subtle.digest ne postoji");
  try {
    const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode("abc"));
    const hex = Array.from(new Uint8Array(buf), (b) => b.toString(16).padStart(2, "0")).join("");
    return hex === SHA256_ABC
      ? r("sha256", naziv, "ok", "rezultat odgovara standardnom test vektoru")
      : r("sha256", naziv, "greska", `neočekivan rezultat: ${hex}`);
  } catch (e) {
    return r("sha256", naziv, "greska", errText(e));
  }
}

function idbRequest<T>(req: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function checkIndexedDB(): Promise<ProbeResult> {
  const naziv = "IndexedDB (upis, čitanje, nadogradnja verzije, brisanje)";
  if (!("indexedDB" in window)) return r("indexeddb", naziv, "nije_podrzano", "indexedDB ne postoji");
  try {
    await idbRequest(indexedDB.deleteDatabase(DIAG_DB));
    // v1: kreiranje skladišta u upgradeneeded
    const db1 = await new Promise<IDBDatabase>((resolve, reject) => {
      const req = indexedDB.open(DIAG_DB, 1);
      req.onupgradeneeded = () => req.result.createObjectStore("proba", { keyPath: "id" });
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
      req.onblocked = () => reject(new Error("open blokiran"));
    });
    const id = crypto.randomUUID();
    await new Promise<void>((resolve, reject) => {
      const tx = db1.transaction("proba", "readwrite");
      tx.objectStore("proba").put({ id, value: 42 });
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
      tx.onabort = () => reject(tx.error ?? new Error("transakcija prekinuta"));
    });
    db1.close();
    // v2: nadogradnja sa novim indeksom (put migracije)
    let upgradeSeen = false;
    const db2 = await new Promise<IDBDatabase>((resolve, reject) => {
      const req = indexedDB.open(DIAG_DB, 2);
      req.onupgradeneeded = () => {
        upgradeSeen = true;
        const tx = req.transaction;
        if (tx) tx.objectStore("proba").createIndex("byValue", "value");
      };
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
      req.onblocked = () => reject(new Error("nadogradnja blokirana"));
    });
    const read = await new Promise<{ id: string; value: number } | undefined>((resolve, reject) => {
      const tx = db2.transaction("proba", "readonly");
      const req = tx.objectStore("proba").get(id);
      req.onsuccess = () => resolve(req.result as { id: string; value: number } | undefined);
      req.onerror = () => reject(req.error);
    });
    db2.close();
    await idbRequest(indexedDB.deleteDatabase(DIAG_DB));
    if (!upgradeSeen) return r("indexeddb", naziv, "greska", "upgradeneeded za v2 nije izvršen");
    if (read?.value !== 42) return r("indexeddb", naziv, "greska", "pročitana vrednost ne odgovara upisanoj");
    return r("indexeddb", naziv, "ok", "upis, čitanje posle ponovnog otvaranja, nadogradnja v1→v2 i brisanje uspešni");
  } catch (e) {
    return r("indexeddb", naziv, "greska", errText(e));
  }
}

async function checkStorageEstimate(): Promise<ProbeResult> {
  const naziv = "Kvota skladišta";
  if (!navigator.storage?.estimate) return r("estimate", naziv, "nije_podrzano", "navigator.storage.estimate ne postoji");
  try {
    const { quota, usage } = await navigator.storage.estimate();
    const mb = (n?: number) => (n === undefined ? "?" : `${(n / 1024 / 1024).toFixed(1)} MB`);
    return r("estimate", naziv, "info", `zauzeto ${mb(usage)} od ${mb(quota)}`);
  } catch (e) {
    return r("estimate", naziv, "greska", errText(e));
  }
}

async function checkPersisted(): Promise<ProbeResult> {
  const naziv = "Trajno skladište (trenutno stanje)";
  if (!navigator.storage?.persisted) return r("persisted", naziv, "nije_podrzano", "navigator.storage.persisted ne postoji");
  try {
    const p = await navigator.storage.persisted();
    return r("persisted", naziv, p ? "ok" : "upozorenje", p ? "odobreno" : "nije odobreno (pokušaj dugmetom ispod, posle instalacije aplikacije)");
  } catch (e) {
    return r("persisted", naziv, "greska", errText(e));
  }
}

async function checkDisplayMode(): Promise<ProbeResult> {
  const standalone = window.matchMedia("(display-mode: standalone)").matches;
  return r("display", "Način prikaza", "info", standalone ? "instalirana aplikacija (standalone)" : "kartica pregledača");
}

async function checkShareSupport(): Promise<ProbeResult> {
  const naziv = "Deljenje fajla (podrška)";
  if (typeof navigator.share !== "function" || typeof navigator.canShare !== "function") {
    return r("share-support", naziv, "nije_podrzano", "navigator.share ili navigator.canShare ne postoji");
  }
  const content = probeFileContent();
  const json = new File([content], "proba.json", { type: "application/json" });
  const txt = new File([content], "proba.json", { type: "text/plain" });
  let canJson = false;
  let canTxt = false;
  try { canJson = navigator.canShare({ files: [json] }); } catch { canJson = false; }
  try { canTxt = navigator.canShare({ files: [txt] }); } catch { canTxt = false; }
  const status = canJson || canTxt ? "ok" : "upozorenje";
  return r("share-support", naziv, status, `application/json: ${canJson ? "da" : "ne"}; text/plain: ${canTxt ? "da" : "ne"}`);
}

type SpeechAvailability = "available" | "downloadable" | "downloading" | "unavailable";
interface SpeechRecognitionStatic {
  new (): SpeechRecognitionLike;
  available?: (opts: { langs: string[]; processLocally?: boolean }) => Promise<SpeechAvailability>;
}
interface SpeechRecognitionLike {
  lang: string;
  interimResults: boolean;
  maxAlternatives: number;
  onresult: ((ev: { results: ArrayLike<ArrayLike<{ transcript: string; confidence: number }>> }) => void) | null;
  onerror: ((ev: { error: string; message?: string }) => void) | null;
  onend: (() => void) | null;
  start(): void;
  abort(): void;
}

function getSpeechCtor(): SpeechRecognitionStatic | undefined {
  const w = window as unknown as { SpeechRecognition?: SpeechRecognitionStatic; webkitSpeechRecognition?: SpeechRecognitionStatic };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition;
}

async function checkSpeechSupport(): Promise<ProbeResult[]> {
  const Ctor = getSpeechCtor();
  if (!Ctor) return [r("speech-support", "Prepoznavanje govora (API)", "nije_podrzano", "SpeechRecognition ne postoji")];
  const out: ProbeResult[] = [r("speech-support", "Prepoznavanje govora (API)", "ok", "SpeechRecognition postoji")];
  if (typeof Ctor.available !== "function") {
    out.push(r("speech-available", "Srpski (sr-RS) — dostupnost", "info", "SpeechRecognition.available() ne postoji u ovoj verziji; proveri dugmetom ispod"));
    return out;
  }
  // Samo provera „bilo gde". Provera „samo na uređaju" (processLocally:true) je odvojena ručna
  // provera: u headless Chromium 141 ruši karticu, pa ne sme da prekine automatske provere.
  try {
    const a = await Ctor.available({ langs: ["sr-RS"], processLocally: false });
    out.push(r("speech-available-any", "Srpski (sr-RS) — dostupnost (uređaj ili server)", a === "available" ? "ok" : a === "unavailable" ? "upozorenje" : "info", a));
  } catch (e) {
    out.push(r("speech-available-any", "Srpski (sr-RS) — dostupnost (uređaj ili server)", "greska", errText(e)));
  }
  return out;
}

async function checkBarcodeDetector(): Promise<ProbeResult> {
  const naziv = "Skeniranje barkoda (BarcodeDetector)";
  const BD = (window as unknown as { BarcodeDetector?: { getSupportedFormats?: () => Promise<string[]> } }).BarcodeDetector;
  if (!BD) return r("barcode", naziv, "nije_podrzano", "BarcodeDetector ne postoji — potrebna rezervna biblioteka");
  try {
    const formats = BD.getSupportedFormats ? await BD.getSupportedFormats() : [];
    const ean = formats.includes("ean_13");
    return r("barcode", naziv, ean ? "ok" : "upozorenje", `formati: ${formats.join(", ") || "(prazno)"}`);
  } catch (e) {
    return r("barcode", naziv, "greska", errText(e));
  }
}

export function createBrowserProbe(): PlatformProbe {
  return {
    async runAutomatic() {
      const results: ProbeResult[] = [];
      results.push(await checkSecureContext());
      results.push(await checkRandomUUID());
      results.push(await checkSha256());
      results.push(await checkIndexedDB());
      results.push(await checkStorageEstimate());
      results.push(await checkPersisted());
      results.push(await checkDisplayMode());
      results.push(await checkShareSupport());
      results.push(...(await checkSpeechSupport()));
      results.push(await checkBarcodeDetector());
      results.push(r("online", "Mreža", navigator.onLine ? "info" : "upozorenje", navigator.onLine ? "povezano" : "bez mreže"));
      return results;
    },

    async requestPersistentStorage() {
      const naziv = "Zahtev za trajno skladište";
      if (!navigator.storage?.persist) return r("persist", naziv, "nije_podrzano", "navigator.storage.persist ne postoji");
      try {
        const granted = await navigator.storage.persist();
        return r("persist", naziv, granted ? "ok" : "upozorenje", granted ? "odobreno" : "odbijeno (Chrome odlučuje sam; obično pomaže instalacija aplikacije)");
      } catch (e) {
        return r("persist", naziv, "greska", errText(e));
      }
    },

    async testFileDownload() {
      const naziv = "Preuzimanje fajla";
      try {
        const blob = new Blob([probeFileContent()], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = probeFileName();
        document.body.appendChild(a);
        a.click();
        a.remove();
        setTimeout(() => URL.revokeObjectURL(url), 10_000);
        return r("download", naziv, "info", `preuzimanje pokrenuto (${a.download}); potvrdi da se fajl pojavio u Preuzimanjima, pa ga izaberi u proveri uvoza`);
      } catch (e) {
        return r("download", naziv, "greska", errText(e));
      }
    },

    async testFileShare() {
      const naziv = "Deljenje fajla";
      if (typeof navigator.share !== "function") return r("share", naziv, "nije_podrzano", "navigator.share ne postoji");
      const content = probeFileContent();
      const candidates = [
        new File([content], probeFileName(), { type: "application/json" }),
        new File([content], probeFileName(), { type: "text/plain" }),
      ];
      const file = candidates.find((f) => {
        try { return navigator.canShare?.({ files: [f] }) ?? false; } catch { return false; }
      });
      if (!file) return r("share", naziv, "nije_podrzano", "sistem ne prihvata deljenje ovog tipa fajla");
      try {
        await navigator.share({ files: [file], title: "Mera — probni fajl" });
        return r("share", naziv, "ok", `podeljeno kao ${file.type}`);
      } catch (e) {
        if (e instanceof DOMException && e.name === "AbortError") return r("share", naziv, "info", "deljenje otkazano");
        return r("share", naziv, "greska", errText(e));
      }
    },

    async verifyImportedFile(file: ImportedFile) {
      const naziv = "Uvoz fajla";
      try {
        const parsed = JSON.parse(file.text) as { marker?: unknown };
        return parsed.marker === TEST_FILE_MARKER
          ? r("import", naziv, "ok", `pročitan ${file.name} (${file.size} B), sadržaj ispravan`)
          : r("import", naziv, "upozorenje", `${file.name} je JSON, ali nije probni fajl Mere`);
      } catch (e) {
        return r("import", naziv, "greska", `${file.name}: nije ispravan JSON (${errText(e)})`);
      }
    },

    async checkSpeechOnDevice(lang: string) {
      const naziv = `Govor (${lang}) samo na uređaju, bez servera`;
      const Ctor = getSpeechCtor();
      if (!Ctor) return r("speech-available-local", naziv, "nije_podrzano", "SpeechRecognition ne postoji");
      if (typeof Ctor.available !== "function") return r("speech-available-local", naziv, "nije_podrzano", "SpeechRecognition.available() ne postoji");
      try {
        const a = await Ctor.available({ langs: [lang], processLocally: true });
        return r("speech-available-local", naziv, a === "available" ? "ok" : a === "unavailable" ? "upozorenje" : "info", a);
      } catch (e) {
        return r("speech-available-local", naziv, "greska", errText(e));
      }
    },

    testSpeech(lang: string) {
      const naziv = `Prepoznavanje govora (${lang})`;
      const Ctor = getSpeechCtor();
      if (!Ctor) return Promise.resolve(r("speech", naziv, "nije_podrzano", "SpeechRecognition ne postoji"));
      return new Promise<ProbeResult>((resolve) => {
        let done = false;
        const finish = (res: ProbeResult) => { if (!done) { done = true; resolve(res); } };
        try {
          const rec = new Ctor();
          rec.lang = lang;
          rec.interimResults = false;
          rec.maxAlternatives = 1;
          rec.onresult = (ev) => {
            const alt = ev.results[0]?.[0];
            finish(alt
              ? r("speech", naziv, "ok", `prepoznato: „${alt.transcript}" (pouzdanost ${alt.confidence.toFixed(2)})`)
              : r("speech", naziv, "upozorenje", "rezultat bez teksta"));
          };
          rec.onerror = (ev) => finish(r("speech", naziv, "greska", `${ev.error}${ev.message ? `: ${ev.message}` : ""}`));
          rec.onend = () => finish(r("speech", naziv, "upozorenje", "završeno bez rezultata"));
          rec.start();
          setTimeout(() => { if (!done) { rec.abort(); finish(r("speech", naziv, "upozorenje", "isteklo vreme (15 s)")); } }, 15_000);
        } catch (e) {
          finish(r("speech", naziv, "greska", errText(e)));
        }
      });
    },

    async testOpenFoodFacts(barcode: string) {
      const naziv = "Open Food Facts (poziv iz pregledača)";
      const url = `https://world.openfoodfacts.org/api/v2/product/${encodeURIComponent(barcode)}.json?fields=product_name,nutriments`;
      const started = performance.now();
      try {
        const res = await fetch(url, { method: "GET" });
        const ms = Math.round(performance.now() - started);
        if (!res.ok) return r("off", naziv, "greska", `HTTP ${res.status} (${ms} ms)`);
        const data = (await res.json()) as { status?: number; product?: { product_name?: string; nutriments?: Record<string, unknown> } };
        if (data.status !== 1 || !data.product) return r("off", naziv, "upozorenje", `odgovor stigao (${ms} ms), proizvod nije pronađen`);
        const kcal = data.product.nutriments?.["energy-kcal_100g"];
        return r("off", naziv, "ok", `CORS radi; ${data.product.product_name ?? "(bez naziva)"}; energy-kcal_100g=${String(kcal)} (${ms} ms)`);
      } catch (e) {
        return r("off", naziv, "greska", `${errText(e)} — moguća CORS blokada ili nema mreže`);
      }
    },

    async copyText(text: string) {
      try {
        await navigator.clipboard.writeText(text);
        return true;
      } catch {
        return false;
      }
    },

    describeClient() {
      return navigator.userAgent;
    },
  };
}
