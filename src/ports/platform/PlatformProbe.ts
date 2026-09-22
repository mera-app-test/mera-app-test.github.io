// Port za proveru mogućnosti uređaja/pregledača.
// Svrha: stavke [PROVERITI] iz ARCHITECTURE.md koje se mogu potvrditi samo na telefonu vlasnika.
// Koristi se isključivo u TEST verziji (ekran „Provera uređaja"). Nije deo produkcije.

export type ProbeStatus = "ok" | "upozorenje" | "greska" | "nije_podrzano" | "info";

export interface ProbeResult {
  /** Stabilan identifikator provere, npr. "indexeddb". */
  readonly id: string;
  /** Naziv za prikaz. */
  readonly naziv: string;
  readonly status: ProbeStatus;
  /** Konkretan nalaz: vrednosti, poruke grešaka. */
  readonly detalji: string;
}

export interface ImportedFile {
  readonly name: string;
  readonly size: number;
  readonly text: string;
}

export interface PlatformProbe {
  /** Provere koje ne traže akciju korisnika. */
  runAutomatic(): Promise<ProbeResult[]>;
  /** Zahtev za trajno skladište — pozvati iz korisničke akcije. */
  requestPersistentStorage(): Promise<ProbeResult>;
  /** Preuzimanje probnog JSON fajla. */
  testFileDownload(): Promise<ProbeResult>;
  /** Deljenje probnog JSON fajla preko sistemskog menija za deljenje. */
  testFileShare(): Promise<ProbeResult>;
  /** Provera da je izabrani fajl probni fajl iz testFileDownload/testFileShare. */
  verifyImportedFile(file: ImportedFile): Promise<ProbeResult>;
  /** Dostupnost prepoznavanja govora isključivo na uređaju (bez slanja zvuka na server). */
  checkSpeechOnDevice(lang: string): Promise<ProbeResult>;
  /** Jedno prepoznavanje govora na zadatom jeziku. */
  testSpeech(lang: string): Promise<ProbeResult>;
  /** Upit ka Open Food Facts za zadati barkod. */
  testOpenFoodFacts(barcode: string): Promise<ProbeResult>;
  /** Kopiranje teksta u međuspremnik. */
  copyText(text: string): Promise<boolean>;
  /** Opis pregledača (user agent). */
  describeClient(): string;
}
