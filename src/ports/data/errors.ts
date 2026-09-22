// Tipizirane greške data sloja (ARCHITECTURE.md §7.1). Iste za lokalnu i buduću serversku implementaciju.
export type DataErrorCode = "NotFound" | "Conflict" | "ValidationFailed" | "Unavailable" | "StorageFull";

export class DataError extends Error {
  constructor(
    readonly code: DataErrorCode,
    message: string,
    readonly details?: unknown,
  ) {
    super(message);
    this.name = `DataError(${code})`;
  }
}

export function isDataError(e: unknown, code?: DataErrorCode): e is DataError {
  return e instanceof DataError && (code === undefined || e.code === code);
}
