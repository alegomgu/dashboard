import { z } from "zod";
import type { ServerEnv } from "@command-center/shared";
import {
  accountSchema,
  clockSchema,
  orderSchema,
  positionSchema,
  portfolioHistorySchema,
  type AlpacaAccountDto,
  type AlpacaClockDto,
  type AlpacaOrderDto,
  type AlpacaPortfolioHistoryDto,
  type AlpacaPositionDto,
} from "./schemas";

export class AlpacaClientError extends Error {
  readonly status: number;
  readonly correlationId: string;

  constructor(message: string, status: number, correlationId: string) {
    super(message);
    this.name = "AlpacaClientError";
    this.status = status;
    this.correlationId = correlationId;
  }
}

export type AlpacaReadOnlyClient = {
  getAccount(correlationId: string): Promise<AlpacaAccountDto>;
  getClock(correlationId: string): Promise<AlpacaClockDto>;
  getPositions(correlationId: string): Promise<AlpacaPositionDto[]>;
  getOrders(
    correlationId: string,
    options?: { status?: "open" | "closed" | "all"; limit?: number },
  ): Promise<AlpacaOrderDto[]>;
  getPortfolioHistory(
    correlationId: string,
    options?: { period?: string; timeframe?: string; intradayReporting?: string },
  ): Promise<AlpacaPortfolioHistoryDto>;
};

export function createAlpacaReadOnlyClient(
  env: ServerEnv,
  options?: { baseUrl?: string },
): AlpacaReadOnlyClient {
  const baseUrl =
    options?.baseUrl ??
    (env.ALPACA_ENV === "paper"
      ? "https://paper-api.alpaca.markets"
      : "https://api.alpaca.markets");

  async function request<T>(
    path: string,
    schema: z.ZodType<T>,
    correlationId: string,
    query?: URLSearchParams,
  ): Promise<T> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);
    const url = new URL(path, baseUrl);

    if (query) {
      url.search = query.toString();
    }

    try {
      const response = await fetch(url, {
        method: "GET",
        headers: {
          "APCA-API-KEY-ID": env.ALPACA_API_KEY,
          "APCA-API-SECRET-KEY": env.ALPACA_API_SECRET,
          "X-Correlation-ID": correlationId,
          Accept: "application/json",
        },
        cache: "no-store",
        signal: controller.signal,
      });

      if (!response.ok) {
        throw new AlpacaClientError(
          "Alpaca request failed",
          response.status,
          correlationId,
        );
      }

      const json = (await response.json()) as unknown;
      return schema.parse(json);
    } finally {
      clearTimeout(timeout);
    }
  }

  return {
    getAccount: (correlationId) =>
      request("/v2/account", accountSchema, correlationId),
    getClock: (correlationId) =>
      request("/v2/clock", clockSchema, correlationId),
    getPositions: (correlationId) =>
      request("/v2/positions", z.array(positionSchema), correlationId),
    getOrders: (correlationId, options) => {
      const query = new URLSearchParams({
        status: options?.status ?? "open",
        limit: String(options?.limit ?? 50),
        direction: "desc",
      });
      return request("/v2/orders", z.array(orderSchema), correlationId, query);
    },
    getPortfolioHistory: async (correlationId, options) => {
      const query = new URLSearchParams({
        period: options?.period ?? "1M",
        timeframe: options?.timeframe ?? "1D",
        intraday_reporting: options?.intradayReporting ?? "market_hours",
      });
      const history = await request(
        "/v2/account/portfolio/history",
        portfolioHistorySchema,
        correlationId,
        query,
      );
      return {
        timestamp: history.timestamp ?? [],
        equity: history.equity ?? [],
        profit_loss: history.profit_loss ?? [],
        profit_loss_pct: history.profit_loss_pct ?? [],
        base_value: history.base_value,
        timeframe: history.timeframe,
      };
    },
  };
}
