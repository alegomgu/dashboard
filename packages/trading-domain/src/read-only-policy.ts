import type { ServerEnv } from "@command-center/shared";
import type { RiskCheck } from "@command-center/shared";

export function evaluateReadOnlyPolicy(
  env: Pick<ServerEnv, "TRADING_MODE" | "ENABLE_TRADING">,
): RiskCheck {
  const passed = env.TRADING_MODE === "read_only" && !env.ENABLE_TRADING;

  return {
    code: "TRADING_MODE_READ_ONLY",
    severity: passed ? "info" : "block",
    passed,
    message: passed
      ? "Trading mutations are unavailable in read-only mode."
      : "Trading cannot be enabled until the paper trading hardening phase.",
    value: env.TRADING_MODE,
    limit: "read_only",
  };
}
