import "fake-indexeddb/auto";
import { IDBFactory } from "fake-indexeddb";
import { beforeEach } from "vitest";
import { createLocalDataProvider } from "../../src/infrastructure/data-local";
import { runDataProviderContract } from "./dataProviderContract";
import { seqIds } from "../support/fixtures";

beforeEach(() => {
  globalThis.indexedDB = new IDBFactory();
});

runDataProviderContract("LocalDataProvider (IndexedDB)", () =>
  createLocalDataProvider({ now: () => "2026-09-20T05:00:00.000Z", newId: seqIds("p") }),
);
