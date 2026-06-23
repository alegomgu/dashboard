import { describe, expect, it } from "vitest";
import { evaluateReadOnlyPolicy } from "./read-only-policy";

describe("evaluateReadOnlyPolicy", () => {
  it("passes when trading mode is read-only and trading flag is disabled", () => {
    const result = evaluateReadOnlyPolicy({
      TRADING_MODE: "read_only",
      ENABLE_TRADING: false,
    });

    expect(result.passed).toBe(true);
    expect(result.severity).toBe("info");
  });

  it("blocks when trading is enabled before the hardening phase", () => {
    const result = evaluateReadOnlyPolicy({
      TRADING_MODE: "paper_enabled",
      ENABLE_TRADING: true,
    });

    expect(result.passed).toBe(false);
    expect(result.severity).toBe("block");
  });
});
