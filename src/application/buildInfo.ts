// Informacije o build-u koje prikazuje UI i koje će pratiti svaki proračun (ARCHITECTURE.md §8.3, §10.1).

export type MeraEnv = "prod" | "test" | "dev";

export interface BuildInfo {
  readonly env: MeraEnv;
  readonly version: string;
  readonly sha: string;
  readonly builtAt: string;
}

/** Kratka oznaka verzije za prikaz, npr. "0.1.0 (a1b2c3d)". */
export function formatVersionLabel(info: BuildInfo): string {
  return `${info.version} (${info.sha})`;
}

/** Da li je ovo test okruženje (prikazuje oznaku TEST i proveru uređaja). */
export function isTestEnvironment(info: BuildInfo): boolean {
  return info.env === "test" || info.env === "dev";
}
