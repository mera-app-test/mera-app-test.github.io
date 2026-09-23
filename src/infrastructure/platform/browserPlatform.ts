// Implementacije platformskih portova za pregledač (ARCHITECTURE.md §7.1).
import type { Clock, FileExporter, Hasher, IdGenerator, StoragePersistence } from "../../ports/platform";

export function createBrowserClock(): Clock {
  return {
    nowIso: () => new Date().toISOString(),
    timeZone: () => Intl.DateTimeFormat().resolvedOptions().timeZone,
    isoAtLocalDate: (localDate) => {
      const [y, m, d] = localDate.split("-").map(Number);
      const t = new Date();
      t.setFullYear(y!, m! - 1, d!);
      return t.toISOString();
    },
    localDate: () => {
      // en-CA daje oblik YYYY-MM-DD; vremenska zona je zona uređaja.
      return new Intl.DateTimeFormat("en-CA", { year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date());
    },
  };
}

export function createBrowserIdGenerator(): IdGenerator {
  return { newId: () => crypto.randomUUID() };
}

export function createBrowserHasher(): Hasher {
  return {
    async sha256Hex(text) {
      const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text));
      return Array.from(new Uint8Array(buf), (b) => b.toString(16).padStart(2, "0")).join("");
    },
  };
}

export function createBrowserFileExporter(): FileExporter {
  return {
    async saveTextFile(fileName, text, mimeType) {
      try {
        const url = URL.createObjectURL(new Blob([text], { type: mimeType }));
        const a = document.createElement("a");
        a.href = url;
        a.download = fileName;
        document.body.appendChild(a);
        a.click();
        a.remove();
        setTimeout(() => URL.revokeObjectURL(url), 10_000);
        return true;
      } catch {
        return false;
      }
    },
  };
}

export function createBrowserStoragePersistence(): StoragePersistence {
  return {
    async isPersisted() {
      return navigator.storage?.persisted ? navigator.storage.persisted() : null;
    },
    async requestPersist() {
      return navigator.storage?.persist ? navigator.storage.persist() : null;
    },
  };
}
