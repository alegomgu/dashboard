import { createAlpacaReadOnlyClient } from "@command-center/alpaca-client";
import { evaluateReadOnlyPolicy } from "@command-center/trading-domain";
import {
  getSelectedAccountServerEnv,
  getSelectedAlpacaAccount,
  type SafeAlpacaAccount,
} from "./alpaca-accounts";
import { createCorrelationId } from "./correlation";

export type DashboardSnapshot = {
  mode: {
    alpacaEnv: string;
    tradingMode: string;
    dataFeed: string;
    readOnlyPassed: boolean;
  };
  selectedAccount: SafeAlpacaAccount;
  account: {
    status: string;
    equity: string;
    cash: string;
    buyingPower: string;
    portfolioValue: string;
    longMarketValue: string;
    shortMarketValue: string;
    dayTradeCount: string;
  } | null;
  clock: {
    timestamp: string;
    isOpen: boolean;
    nextOpen: string;
    nextClose: string;
  } | null;
  counts: {
    positions: number;
    openOrders: number;
  };
  positions: Array<{
    symbol: string;
    side: string;
    qty: string;
    marketValue: string;
    costBasis: string;
    unrealizedPl: string;
    unrealizedPlpc: string;
    currentPrice: string;
    changeToday: string;
  }>;
  openOrders: Array<{
    id: string;
    clientOrderId: string;
    symbol: string;
    side: string;
    type: string;
    timeInForce: string;
    qty: string;
    filledQty: string;
    status: string;
    limitPrice: string;
    stopPrice: string;
    submittedAt: string;
  }>;
  freshness: {
    generatedAtUtc: string;
    correlationId: string;
  };
  error: string | null;
};

export async function getDashboardSnapshot(
  accountId?: string | string[] | null,
): Promise<DashboardSnapshot> {
  const selectedAccount = getSelectedAlpacaAccount(accountId);
  const env = getSelectedAccountServerEnv(selectedAccount);
  const correlationId = createCorrelationId("dashboard");
  const readOnlyPolicy = evaluateReadOnlyPolicy(env);
  const client = createAlpacaReadOnlyClient(env, {
    baseUrl: selectedAccount.baseUrl,
  });
  const generatedAtUtc = new Date().toISOString();

  try {
    const [account, clock, positions, orders] = await Promise.all([
      client.getAccount(correlationId),
      client.getClock(correlationId),
      client.getPositions(correlationId),
      client.getOrders(correlationId),
    ]);

    return {
      mode: {
        alpacaEnv: env.ALPACA_ENV,
        tradingMode: env.TRADING_MODE,
        dataFeed: env.ALPACA_DATA_FEED,
        readOnlyPassed: readOnlyPolicy.passed,
      },
      selectedAccount: {
        id: selectedAccount.id,
        name: selectedAccount.name,
        baseUrl: selectedAccount.baseUrl,
        isDefault: selectedAccount.isDefault,
      },
      account: {
        status: account.status,
        equity: account.equity,
        cash: account.cash,
        buyingPower: account.buying_power,
        portfolioValue: account.portfolio_value,
        longMarketValue: account.long_market_value,
        shortMarketValue: account.short_market_value,
        dayTradeCount: String(account.daytrade_count ?? 0),
      },
      clock: {
        timestamp: clock.timestamp,
        isOpen: clock.is_open,
        nextOpen: clock.next_open,
        nextClose: clock.next_close,
      },
      counts: {
        positions: positions.length,
        openOrders: orders.length,
      },
      positions: positions.slice(0, 8).map((position) => ({
        symbol: position.symbol,
        side: position.side,
        qty: position.qty,
        marketValue: position.market_value,
        costBasis: position.cost_basis,
        unrealizedPl: position.unrealized_pl,
        unrealizedPlpc: position.unrealized_plpc,
        currentPrice: position.current_price ?? "0",
        changeToday: position.change_today ?? "0",
      })),
      openOrders: orders.slice(0, 8).map((order) => ({
        id: order.id,
        clientOrderId: order.client_order_id,
        symbol: order.symbol,
        side: order.side,
        type: order.type,
        timeInForce: order.time_in_force,
        qty: order.qty ?? "0",
        filledQty: order.filled_qty,
        status: order.status,
        limitPrice: order.limit_price ?? "",
        stopPrice: order.stop_price ?? "",
        submittedAt: order.submitted_at ?? order.created_at,
      })),
      freshness: {
        generatedAtUtc,
        correlationId,
      },
      error: null,
    };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unknown dashboard error";

    return {
      mode: {
        alpacaEnv: env.ALPACA_ENV,
        tradingMode: env.TRADING_MODE,
        dataFeed: env.ALPACA_DATA_FEED,
        readOnlyPassed: readOnlyPolicy.passed,
      },
      selectedAccount: {
        id: selectedAccount.id,
        name: selectedAccount.name,
        baseUrl: selectedAccount.baseUrl,
        isDefault: selectedAccount.isDefault,
      },
      account: null,
      clock: null,
      counts: {
        positions: 0,
        openOrders: 0,
      },
      positions: [],
      openOrders: [],
      freshness: {
        generatedAtUtc,
        correlationId,
      },
      error: message,
    };
  }
}
