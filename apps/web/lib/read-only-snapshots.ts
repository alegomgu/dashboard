import Decimal from "decimal.js";
import { createAlpacaReadOnlyClient } from "@command-center/alpaca-client";
import {
  getSelectedAccountServerEnv,
  getSelectedAlpacaAccount,
  type SafeAlpacaAccount,
} from "./alpaca-accounts";
import { createCorrelationId } from "./correlation";

function safeDecimal(value: string | null | undefined) {
  try {
    return new Decimal(value ?? "0");
  } catch {
    return new Decimal(0);
  }
}

function decimalString(value: Decimal, fractionDigits = 2) {
  return value.toFixed(fractionDigits);
}

export type PositionRow = {
  symbol: string;
  exchange: string;
  assetClass: string;
  side: string;
  qty: string;
  currentPrice: string;
  costBasis: string;
  marketValue: string;
  unrealizedPl: string;
  unrealizedPlpc: string;
  changeToday: string;
  weightPct: string;
};

export type PositionsSnapshot = {
  selectedAccount: SafeAlpacaAccount;
  generatedAtUtc: string;
  correlationId: string;
  rows: PositionRow[];
  totals: {
    count: number;
    marketValue: string;
    costBasis: string;
    unrealizedPl: string;
    exposurePct: string;
  };
  error: string | null;
};

export async function getPositionsSnapshot(
  accountId?: string | string[] | null,
): Promise<PositionsSnapshot> {
  const selectedAccount = getSelectedAlpacaAccount(accountId);
  const env = getSelectedAccountServerEnv(selectedAccount);
  const client = createAlpacaReadOnlyClient(env, {
    baseUrl: selectedAccount.baseUrl,
  });
  const correlationId = createCorrelationId("positions");
  const generatedAtUtc = new Date().toISOString();

  try {
    const [account, positions] = await Promise.all([
      client.getAccount(correlationId),
      client.getPositions(correlationId),
    ]);

    const portfolioValue = safeDecimal(account.portfolio_value);
    const rows = positions
      .map((position): PositionRow => {
        const marketValue = safeDecimal(position.market_value);
        const weightPct = portfolioValue.isZero()
          ? new Decimal(0)
          : marketValue.div(portfolioValue).mul(100);

        return {
          symbol: position.symbol,
          exchange: position.exchange,
          assetClass: position.asset_class,
          side: position.side,
          qty: position.qty,
          currentPrice: position.current_price ?? "0",
          costBasis: position.cost_basis,
          marketValue: position.market_value,
          unrealizedPl: position.unrealized_pl,
          unrealizedPlpc: position.unrealized_plpc,
          changeToday: position.change_today ?? "0",
          weightPct: decimalString(weightPct),
        };
      })
      .sort((left, right) =>
        safeDecimal(right.marketValue).cmp(safeDecimal(left.marketValue)),
      );

    const marketValue = rows.reduce(
      (sum, row) => sum.add(safeDecimal(row.marketValue)),
      new Decimal(0),
    );
    const costBasis = rows.reduce(
      (sum, row) => sum.add(safeDecimal(row.costBasis)),
      new Decimal(0),
    );
    const unrealizedPl = rows.reduce(
      (sum, row) => sum.add(safeDecimal(row.unrealizedPl)),
      new Decimal(0),
    );
    const exposurePct = portfolioValue.isZero()
      ? new Decimal(0)
      : safeDecimal(account.long_market_value).div(portfolioValue).mul(100);

    return {
      generatedAtUtc,
      correlationId,
      selectedAccount: {
        id: selectedAccount.id,
        name: selectedAccount.name,
        baseUrl: selectedAccount.baseUrl,
        isDefault: selectedAccount.isDefault,
      },
      rows,
      totals: {
        count: rows.length,
        marketValue: decimalString(marketValue),
        costBasis: decimalString(costBasis),
        unrealizedPl: decimalString(unrealizedPl),
        exposurePct: decimalString(exposurePct),
      },
      error: null,
    };
  } catch (error) {
    return {
      generatedAtUtc,
      correlationId,
      selectedAccount: {
        id: selectedAccount.id,
        name: selectedAccount.name,
        baseUrl: selectedAccount.baseUrl,
        isDefault: selectedAccount.isDefault,
      },
      rows: [],
      totals: {
        count: 0,
        marketValue: "0.00",
        costBasis: "0.00",
        unrealizedPl: "0.00",
        exposurePct: "0.00",
      },
      error: error instanceof Error ? error.message : "Unknown positions error",
    };
  }
}

export type OrderRow = {
  id: string;
  clientOrderId: string;
  symbol: string;
  assetClass: string;
  side: string;
  type: string;
  timeInForce: string;
  qty: string;
  filledQty: string;
  status: string;
  limitPrice: string;
  stopPrice: string;
  extendedHours: boolean;
  submittedAt: string;
};

export type OrdersSnapshot = {
  selectedAccount: SafeAlpacaAccount;
  generatedAtUtc: string;
  correlationId: string;
  rows: OrderRow[];
  counts: {
    all: number;
    open: number;
    filled: number;
    canceled: number;
    rejected: number;
  };
  error: string | null;
};

export async function getOrdersSnapshot(
  accountId?: string | string[] | null,
): Promise<OrdersSnapshot> {
  const selectedAccount = getSelectedAlpacaAccount(accountId);
  const env = getSelectedAccountServerEnv(selectedAccount);
  const client = createAlpacaReadOnlyClient(env, {
    baseUrl: selectedAccount.baseUrl,
  });
  const correlationId = createCorrelationId("orders");
  const generatedAtUtc = new Date().toISOString();

  try {
    const orders = await client.getOrders(correlationId, {
      status: "all",
      limit: 100,
    });
    const rows = orders.map(
      (order): OrderRow => ({
        id: order.id,
        clientOrderId: order.client_order_id,
        symbol: order.symbol,
        assetClass: order.asset_class ?? "us_equity",
        side: order.side,
        type: order.type,
        timeInForce: order.time_in_force,
        qty: order.qty ?? "0",
        filledQty: order.filled_qty,
        status: order.status,
        limitPrice: order.limit_price ?? "",
        stopPrice: order.stop_price ?? "",
        extendedHours: order.extended_hours ?? false,
        submittedAt: order.submitted_at ?? order.created_at,
      }),
    );

    return {
      generatedAtUtc,
      correlationId,
      selectedAccount: {
        id: selectedAccount.id,
        name: selectedAccount.name,
        baseUrl: selectedAccount.baseUrl,
        isDefault: selectedAccount.isDefault,
      },
      rows,
      counts: {
        all: rows.length,
        open: rows.filter((order) => order.status === "open").length,
        filled: rows.filter((order) => order.status === "filled").length,
        canceled: rows.filter((order) => order.status === "canceled").length,
        rejected: rows.filter((order) => order.status === "rejected").length,
      },
      error: null,
    };
  } catch (error) {
    return {
      generatedAtUtc,
      correlationId,
      selectedAccount: {
        id: selectedAccount.id,
        name: selectedAccount.name,
        baseUrl: selectedAccount.baseUrl,
        isDefault: selectedAccount.isDefault,
      },
      rows: [],
      counts: {
        all: 0,
        open: 0,
        filled: 0,
        canceled: 0,
        rejected: 0,
      },
      error: error instanceof Error ? error.message : "Unknown orders error",
    };
  }
}
