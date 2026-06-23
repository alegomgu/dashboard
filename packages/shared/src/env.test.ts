import { describe, expect, it } from "vitest";
import { parseServerEnv } from "./env";

const baseEnv = {
  ALPACA_API_KEY: "key",
  ALPACA_API_SECRET: "secret",
  ALPACA_ENV: "paper",
  ALPACA_DATA_FEED: "iex",
  TRADING_MODE: "read_only",
  AUTH_SECRET: "01234567890123456789012345678901",
  ADMIN_EMAIL: "admin@example.com",
  ADMIN_PASSWORD_HASH: "argon2id:hash",
  ALLOWED_EMAILS: "admin@example.com",
};

describe("parseServerEnv", () => {
  it("accepts the paper read-only default posture", () => {
    const env = parseServerEnv(baseEnv);

    expect(env.ALPACA_ENV).toBe("paper");
    expect(env.TRADING_MODE).toBe("read_only");
    expect(env.ENABLE_LIVE_TRADING).toBe(false);
  });

  it("blocks live trading", () => {
    expect(() =>
      parseServerEnv({
        ...baseEnv,
        ENABLE_LIVE_TRADING: "true",
      }),
    ).toThrow("Live trading is not implemented");
  });
});
