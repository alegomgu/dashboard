import { afterEach, describe, expect, it, vi } from "vitest";
import type { ServerEnv } from "@command-center/shared";
import { createAlpacaReadOnlyClient } from "./client";

const env: ServerEnv = {
  ALPACA_API_KEY: "key",
  ALPACA_API_SECRET: "secret",
  ALPACA_ENV: "paper",
  ALPACA_DATA_FEED: "iex",
  TRADING_MODE: "read_only",
  AUTH_SECRET: "01234567890123456789012345678901",
  ADMIN_EMAIL: "admin@example.com",
  ADMIN_PASSWORD_HASH: "hash",
  ALLOWED_EMAILS: "admin@example.com",
  CRON_SECRET: "",
  RISK_MAX_POSITION_PCT: 25,
  RISK_MAX_TOTAL_EXPOSURE_PCT: 100,
  RISK_MAX_RISK_PER_TRADE_PCT: 0.5,
  RISK_MAX_DAILY_LOSS_PCT: 2,
  RISK_MAX_OPEN_POSITIONS: 8,
  RISK_ALLOW_SHORTS: false,
  RISK_ALLOW_OPTIONS: false,
  RISK_ALLOW_CRYPTO: false,
  RISK_ALLOW_EXTENDED_HOURS: false,
  RISK_ALLOW_OVERNIGHT: false,
  ENABLE_TRADING: false,
  ENABLE_LIVE_VIEW: false,
  ENABLE_LIVE_TRADING: false,
  ENABLE_REALTIME_WORKER: false,
  ENABLE_NEWS: false,
  ENABLE_SCREENERS: false,
  ENABLE_JOURNAL: false,
  ENABLE_EODHD: false,
  ENABLE_TELEGRAM: false,
  ENABLE_OPTIONS: false,
  ENABLE_CRYPTO: false,
  ENABLE_SHORTS: false,
  ENABLE_EXTENDED_HOURS: false,
  ENABLE_STRATEGY_LAB: false,
  TELEGRAM_BOT_TOKEN: "",
  TELEGRAM_CHAT_ID: "",
  EODHD_API_KEY: "",
};

describe("createAlpacaReadOnlyClient", () => {
  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it("fetches orders with the requested read-only status and limit", async () => {
    const fetchMock = vi.fn(async () => Response.json([]));
    vi.stubGlobal("fetch", fetchMock);

    const client = createAlpacaReadOnlyClient(env);
    await client.getOrders("corr_1", { status: "all", limit: 100 });

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const call = fetchMock.mock.calls.at(0);
    if (!call) {
      throw new Error("Expected fetch to be called");
    }

    const [url, init] = call as unknown as [URL, RequestInit];
    expect(url.toString()).toBe(
      "https://paper-api.alpaca.markets/v2/orders?status=all&limit=100&direction=desc",
    );
    expect(init.method).toBe("GET");
  });
});
