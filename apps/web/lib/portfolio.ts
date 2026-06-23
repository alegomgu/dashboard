import Decimal from "decimal.js";
import {
  createAlpacaReadOnlyClient,
  type AlpacaPositionDto,
} from "@command-center/alpaca-client";
import {
  historyForStrategy,
  localHistoryStats,
  normalizeLocalHistory,
  readHistoryFile,
  type AccountHistoryPoint,
} from "./account-history";
import {
  getSafeAlpacaAccounts,
  getSelectedAccountServerEnv,
  getSelectedAlpacaAccount,
  type SafeAlpacaAccount,
} from "./alpaca-accounts";
import { createCorrelationId } from "./correlation";
import {
  getStrategyComparison,
  strategyMetas,
  type StrategyMeta,
} from "./strategies";

function toNumber(value: string | number | null | undefined) {
  const number = Number(value ?? 0);
  return Number.isFinite(number) ? number : 0;
}

function decimal(value: string | number | null | undefined) {
  try {
    return new Decimal(value ?? 0);
  } catch {
    return new Decimal(0);
  }
}

function moneyString(value: Decimal) {
  return value.toFixed(2);
}

export type PortfolioPosition = {
  accountId: string;
  accountName: string;
  strategyTitle: string;
  symbol: string;
  side: string;
  qty: number;
  marketValue: number;
  costBasis: number;
  currentPrice: number;
  unrealizedPl: number;
  unrealizedPlpc: number;
  changeToday: number;
  weightPct: number;
};

export type PortfolioAccountRow = {
  account: SafeAlpacaAccount;
  strategy: Pick<StrategyMeta, "slug" | "title" | "shortName" | "tone"> | null;
  status: string;
  equity: number;
  cash: number;
  buyingPower: number;
  portfolioValue: number;
  longMarketValue: number;
  shortMarketValue: number;
  grossExposure: number;
  positions: number;
  openOrders: number;
  unrealizedPl: number;
  localSnapshots: number;
  localReturn: number | null;
  localDrawdown: number | null;
  history: Array<{ timestamp: number; equity: number; normalized: number }>;
  error: string | null;
};

export type PortfolioOverview = {
  generatedAtUtc: string;
  storage: "postgres" | "json";
  accounts: PortfolioAccountRow[];
  positions: PortfolioPosition[];
  totals: {
    equity: number;
    cash: number;
    buyingPower: number;
    portfolioValue: number;
    longMarketValue: number;
    shortMarketValue: number;
    grossExposure: number;
    unrealizedPl: number;
    positions: number;
    openOrders: number;
    accountsOk: number;
    accountsWithError: number;
    top1WeightPct: number;
    top3WeightPct: number;
    top5WeightPct: number;
  };
  aggregateHistory: Array<{
    timestamp: number;
    equity: number;
    normalized: number;
  }>;
};

export async function getPortfolioOverview(): Promise<PortfolioOverview> {
  const generatedAtUtc = new Date().toISOString();
  await getStrategyComparison({
    alpacaPeriod: "1D",
    alpacaTimeframe: "5Min",
  }).catch(() => null);

  const [history, accountRows] = await Promise.all([
    readHistoryFile(),
    Promise.all(getSafeAlpacaAccounts().map(readAccountRow)),
  ]);

  const accounts = accountRows.map((row) => {
    const strategyPoints = row.strategy
      ? historyForStrategy(history, row.strategy.slug, row.account.id)
      : history.points.filter((point) => point.accountId === row.account.id);
    const stats = localHistoryStats(strategyPoints);

    return {
      ...row,
      history: normalizeLocalHistory(strategyPoints),
      localSnapshots: stats.snapshotCount,
      localReturn: stats.localReturn,
      localDrawdown: stats.localDrawdown,
    };
  });
  const positions = accounts
    .flatMap((account) => accountPositionsWithWeights(account))
    .sort((left, right) => right.marketValue - left.marketValue);
  const totals = portfolioTotals(accounts, positions);
  const aggregateHistory = normalizeAggregateHistory(history.points);

  return {
    generatedAtUtc,
    storage: history.storage,
    accounts,
    positions,
    totals,
    aggregateHistory,
  };
}

async function readAccountRow(
  safeAccount: SafeAlpacaAccount,
): Promise<
  PortfolioAccountRow & {
    rawPositions: AlpacaPositionDto[];
  }
> {
  const strategy =
    strategyMetas.find((meta) => meta.accountId === safeAccount.id) ?? null;

  try {
    const account = getSelectedAlpacaAccount(safeAccount.id);
    const env = getSelectedAccountServerEnv(account);
    const client = createAlpacaReadOnlyClient(env, {
      baseUrl: account.baseUrl,
    });
    const correlationId = createCorrelationId(`portfolio-${safeAccount.id}`);
    const [alpacaAccount, positions, orders] = await Promise.all([
      client.getAccount(correlationId),
      client.getPositions(correlationId),
      client.getOrders(correlationId, { status: "open", limit: 100 }),
    ]);
    const equity = toNumber(alpacaAccount.equity);
    const longMarketValue = toNumber(alpacaAccount.long_market_value);
    const shortMarketValue = Math.abs(
      toNumber(alpacaAccount.short_market_value),
    );
    const unrealizedPl = positions.reduce(
      (sum, position) => sum + toNumber(position.unrealized_pl),
      0,
    );

    return {
      account: safeAccount,
      strategy,
      status: alpacaAccount.status,
      equity,
      cash: toNumber(alpacaAccount.cash),
      buyingPower: toNumber(alpacaAccount.buying_power),
      portfolioValue: toNumber(alpacaAccount.portfolio_value),
      longMarketValue,
      shortMarketValue,
      grossExposure:
        equity > 0 ? (longMarketValue + shortMarketValue) / equity : 0,
      positions: positions.length,
      openOrders: orders.length,
      unrealizedPl,
      localSnapshots: 0,
      localReturn: null,
      localDrawdown: null,
      history: [],
      rawPositions: positions,
      error: null,
    };
  } catch (error) {
    return {
      account: safeAccount,
      strategy,
      status: "error",
      equity: 0,
      cash: 0,
      buyingPower: 0,
      portfolioValue: 0,
      longMarketValue: 0,
      shortMarketValue: 0,
      grossExposure: 0,
      positions: 0,
      openOrders: 0,
      unrealizedPl: 0,
      localSnapshots: 0,
      localReturn: null,
      localDrawdown: null,
      history: [],
      rawPositions: [],
      error: error instanceof Error ? error.message : "Unknown portfolio error",
    };
  }
}

function accountPositionsWithWeights(
  account: PortfolioAccountRow & {
    rawPositions?: AlpacaPositionDto[];
  },
): PortfolioPosition[] {
  return (account.rawPositions ?? []).map((position) => {
    const marketValue = toNumber(position.market_value);
    return {
      accountId: account.account.id,
      accountName: account.account.name,
      strategyTitle: account.strategy?.title ?? "Sin estrategia asignada",
      symbol: position.symbol,
      side: position.side,
      qty: toNumber(position.qty),
      marketValue,
      costBasis: toNumber(position.cost_basis),
      currentPrice: toNumber(position.current_price),
      unrealizedPl: toNumber(position.unrealized_pl),
      unrealizedPlpc: toNumber(position.unrealized_plpc),
      changeToday: toNumber(position.change_today),
      weightPct: account.equity > 0 ? (marketValue / account.equity) * 100 : 0,
    };
  });
}

function portfolioTotals(
  accounts: PortfolioAccountRow[],
  positions: PortfolioPosition[],
) {
  const equity = accounts.reduce(
    (sum, row) => sum.add(decimal(row.equity)),
    new Decimal(0),
  );
  const longMarketValue = accounts.reduce(
    (sum, row) => sum.add(decimal(row.longMarketValue)),
    new Decimal(0),
  );
  const shortMarketValue = accounts.reduce(
    (sum, row) => sum.add(decimal(row.shortMarketValue)),
    new Decimal(0),
  );
  const sortedWeights = positions
    .map((position) =>
      equity.gt(0)
        ? decimal(position.marketValue).div(equity).mul(100)
        : new Decimal(0),
    )
    .sort((left, right) => right.cmp(left));
  const concentration = (count: number) =>
    sortedWeights
      .slice(0, count)
      .reduce((sum, value) => sum.add(value), new Decimal(0))
      .toNumber();

  return {
    equity: equity.toNumber(),
    cash: accounts.reduce((sum, row) => sum + row.cash, 0),
    buyingPower: accounts.reduce((sum, row) => sum + row.buyingPower, 0),
    portfolioValue: accounts.reduce((sum, row) => sum + row.portfolioValue, 0),
    longMarketValue: longMarketValue.toNumber(),
    shortMarketValue: shortMarketValue.toNumber(),
    grossExposure: equity.gt(0)
      ? longMarketValue.add(shortMarketValue).div(equity).toNumber()
      : 0,
    unrealizedPl: accounts.reduce((sum, row) => sum + row.unrealizedPl, 0),
    positions: positions.length,
    openOrders: accounts.reduce((sum, row) => sum + row.openOrders, 0),
    accountsOk: accounts.filter((row) => !row.error).length,
    accountsWithError: accounts.filter((row) => row.error).length,
    top1WeightPct: concentration(1),
    top3WeightPct: concentration(3),
    top5WeightPct: concentration(5),
  };
}

function normalizeAggregateHistory(points: AccountHistoryPoint[]) {
  const buckets = new Map<string, Decimal>();

  for (const point of points) {
    const timestamp = new Date(point.timestamp);
    timestamp.setUTCSeconds(0, 0);
    const key = timestamp.toISOString();
    buckets.set(
      key,
      (buckets.get(key) ?? new Decimal(0)).add(decimal(point.equity)),
    );
  }

  const values = [...buckets.entries()]
    .map(([timestamp, equity]) => ({
      timestamp: Math.floor(new Date(timestamp).getTime() / 1000),
      equity: Number(moneyString(equity)),
    }))
    .filter((point) => point.equity > 0)
    .sort((left, right) => left.timestamp - right.timestamp);
  const base = values.at(0)?.equity ?? 0;

  return values.map((point) => ({
    ...point,
    normalized: base > 0 ? point.equity / base - 1 : 0,
  }));
}
