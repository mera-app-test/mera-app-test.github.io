import { describe, expect, it } from "vitest";
import { formatVersionLabel, isTestEnvironment, type BuildInfo } from "../../src/application";

const base: BuildInfo = { env: "prod", version: "0.1.0", sha: "abc1234", builtAt: "2026-09-23T10:00:00.000Z" };

describe("buildInfo", () => {
  it("formatira oznaku verzije", () => {
    expect(formatVersionLabel(base)).toBe("0.1.0 (abc1234)");
  });

  it("produkcija nije test okruženje", () => {
    expect(isTestEnvironment(base)).toBe(false);
  });

  it("test i dev jesu test okruženja", () => {
    expect(isTestEnvironment({ ...base, env: "test" })).toBe(true);
    expect(isTestEnvironment({ ...base, env: "dev" })).toBe(true);
  });
});
