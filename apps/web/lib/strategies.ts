import { readFile } from "node:fs/promises";
import path from "node:path";
import { createAlpacaReadOnlyClient } from "@command-center/alpaca-client";
import {
  getSelectedAccountServerEnv,
  getSelectedAlpacaAccount,
  getSafeAlpacaAccounts,
} from "./alpaca-accounts";
import {
  appendStrategyHistory,
  historyForStrategy,
  localHistoryStats,
  normalizeLocalHistory,
} from "./account-history";
import { createCorrelationId } from "./correlation";

export type StrategySlug =
  | "regime-core"
  | "momentum-legar"
  | "aggressive-ai-momentum";

export type StrategyMeta = {
  slug: StrategySlug;
  title: string;
  shortName: string;
  fileName: string;
  accountId: string;
  tone: "teal" | "blue" | "amber";
  summary: string;
};

export const alpacaPeriodOptions = [
  "1D",
  "1W",
  "1M",
  "3M",
  "1A",
  "1Y",
  "all",
] as const;
export const alpacaTimeframeOptions = [
  "1Min",
  "5Min",
  "15Min",
  "1H",
  "1D",
] as const;

export type AlpacaHistoryPeriod = (typeof alpacaPeriodOptions)[number];
export type AlpacaHistoryTimeframe = (typeof alpacaTimeframeOptions)[number];

export type NormalizedHistoryPoint = {
  timestamp: number;
  equity: number;
  normalized: number;
};

export type BenchmarkSeries = {
  label: string;
  source: string;
  history: NormalizedHistoryPoint[];
  totalReturn: number | null;
  currentDrawdown: number | null;
};

export type StrategyComparisonOptions = {
  alpacaPeriod?: string | string[] | null | undefined;
  alpacaTimeframe?: string | string[] | null | undefined;
};

export type StrategyDoc = StrategyMeta & {
  markdown: string;
  sections: Array<{ title: string; body: string }>;
};

export const strategyMetas: StrategyMeta[] = [
  {
    slug: "regime-core",
    title: "Regime CORE",
    shortName: "CORE",
    fileName: "ESTRATEGIA_CORE.md",
    accountId: "alpaca_3",
    tone: "teal",
    summary:
      "Timing de régimen sobre ETFs apalancados 3x de tech, semis y mercado amplio.",
  },
  {
    slug: "momentum-legar",
    title: "Momentum 12-1 LEGAR-gated",
    shortName: "LEGAR",
    fileName: "STRATEGY_CARD_MOMENTUM_LEGAR.md",
    accountId: "alpaca_1",
    tone: "blue",
    summary:
      "Momentum transversal S&P 500 point-in-time, top 10 trimestral, gross 1.6x y gate LEGAR.",
  },
  {
    slug: "aggressive-ai-momentum",
    title: "Aggressive AI Momentum",
    shortName: "AI Mom",
    fileName: "STRATEGY_CARD_aggressive_ai_momentum.md",
    accountId: "alpaca_2",
    tone: "amber",
    summary:
      "Momentum explosivo concentrado en líderes growth/IA/semis con ranking multi-feature.",
  },
];

const strategiesDir = path.join(process.cwd(), "content", "strategies");

export async function getStrategyDocs(): Promise<StrategyDoc[]> {
  return Promise.all(strategyMetas.map(getStrategyDoc));
}

export async function getStrategyDoc(meta: StrategyMeta): Promise<StrategyDoc> {
  const markdown = await readFile(path.join(strategiesDir, meta.fileName), "utf8");
  return {
    ...meta,
    markdown,
    sections: splitSections(markdown),
  };
}

function splitSections(markdown: string) {
  const lines = markdown.split(/\r?\n/);
  const sections: Array<{ title: string; body: string }> = [];
  let title = "Resumen";
  let body: string[] = [];

  for (const line of lines) {
    const match = /^##\s+(.+)$/.exec(line);
    if (match) {
      if (body.join("\n").trim()) {
        sections.push({ title, body: body.join("\n").trim() });
      }
      title = match[1] ?? "Sección";
      body = [];
    } else if (!line.startsWith("# ")) {
      body.push(line);
    }
  }

  if (body.join("\n").trim()) {
    sections.push({ title, body: body.join("\n").trim() });
  }
  return sections;
}

export type StrategyComparisonRow = {
  meta: StrategyMeta;
  accountName: string;
  equity: number | null;
  cash: number | null;
  portfolioValue: number | null;
  grossExposure: number | null;
  positions: number;
  openOrders: number;
  dayPl: number | null;
  totalPl: number | null;
  history: NormalizedHistoryPoint[];
  historySource: "local" | "alpaca" | "none";
  alpacaHistory: NormalizedHistoryPoint[];
  alpacaHistoryReturn: number | null;
  alpacaHistoryDrawdown: number | null;
  alpacaHistoryPeriod: AlpacaHistoryPeriod;
  alpacaHistoryTimeframe: AlpacaHistoryTimeframe;
  localSnapshots: number;
  localReturn: number | null;
  localDrawdown: number | null;
  localMaxEquity: number | null;
  error: string | null;
};

export async function getStrategyComparison(
  options?: StrategyComparisonOptions,
): Promise<{
  generatedAtUtc: string;
  alpacaPeriod: AlpacaHistoryPeriod;
  alpacaTimeframe: AlpacaHistoryTimeframe;
  benchmark: BenchmarkSeries | null;
  rows: StrategyComparisonRow[];
}> {
  const generatedAtUtc = new Date().toISOString();
  const alpacaPeriod = normalizePeriod(options?.alpacaPeriod);
  const alpacaTimeframe = normalizeTimeframe(options?.alpacaTimeframe);
  const alpacaPortfolioPeriod = toAlpacaPortfolioPeriod(alpacaPeriod);
  const accounts = getSafeAlpacaAccounts();
  const brokerRows = await Promise.all(
    strategyMetas.map(async (meta): Promise<StrategyComparisonRow> => {
      const safeAccount =
        accounts.find((account) => account.id === meta.accountId) ??
        accounts.find((account) =>
          account.name.toLowerCase().includes(meta.shortName.toLowerCase()),
        );
      if (!safeAccount) {
        return emptyRow(
          meta,
          `Cuenta no configurada para ${meta.accountId}`,
          alpacaPeriod,
          alpacaTimeframe,
        );
      }

      try {
        const account = getSelectedAlpacaAccount(safeAccount.id);
        const env = getSelectedAccountServerEnv(account);
        const client = createAlpacaReadOnlyClient(env, {
          baseUrl: account.baseUrl,
        });
        const correlationId = createCorrelationId(`strategy-${meta.slug}`);
        const [
          alpacaAccount,
          positions,
          orders,
          dailyHistory,
          selectedAlpacaHistory,
        ] = await Promise.all([
          client.getAccount(correlationId),
          client.getPositions(correlationId),
          client.getOrders(correlationId, { status: "open", limit: 100 }),
          client.getPortfolioHistory(correlationId, {
            period: "1M",
            timeframe: "1D",
          }),
          client.getPortfolioHistory(correlationId, {
            period: alpacaPortfolioPeriod,
            timeframe: alpacaTimeframe,
          }),
        ]);
        const equity = Number(alpacaAccount.equity);
        const portfolioValue = Number(alpacaAccount.portfolio_value);
        const longMarketValue = Number(alpacaAccount.long_market_value);
        const shortMarketValue = Math.abs(
          Number(alpacaAccount.short_market_value),
        );
        const grossExposure =
          equity > 0 ? (longMarketValue + shortMarketValue) / equity : 0;
        const dayPl = positions.reduce(
          (sum, position) =>
            sum +
            Number(position.change_today ?? 0) * Number(position.market_value),
          0,
        );
        const totalPl = positions.reduce(
          (sum, position) => sum + Number(position.unrealized_pl),
          0,
        );
        const historyPoints = normalizeHistory(
          dailyHistory.timestamp ?? [],
          dailyHistory.equity ?? [],
        );
        const alpacaHistory = normalizeHistory(
          selectedAlpacaHistory.timestamp ?? [],
          selectedAlpacaHistory.equity ?? [],
        );
        const alpacaStats = historyStats(alpacaHistory);

        return {
          meta,
          accountName: account.name,
          equity,
          cash: Number(alpacaAccount.cash),
          portfolioValue,
          grossExposure,
          positions: positions.length,
          openOrders: orders.length,
          dayPl,
          totalPl,
          history: historyPoints,
          historySource: historyPoints.length >= 2 ? "alpaca" : "none",
          alpacaHistory,
          alpacaHistoryReturn: alpacaStats.totalReturn,
          alpacaHistoryDrawdown: alpacaStats.currentDrawdown,
          alpacaHistoryPeriod: alpacaPeriod,
          alpacaHistoryTimeframe: alpacaTimeframe,
          localSnapshots: 0,
          localReturn: null,
          localDrawdown: null,
          localMaxEquity: null,
          error: null,
        };
      } catch (error) {
        return emptyRow(
          meta,
          error instanceof Error ? error.message : "Error desconocido",
          alpacaPeriod,
          alpacaTimeframe,
        );
      }
    }),
  );

  const persistedHistory = await appendStrategyHistory(brokerRows, generatedAtUtc);
  const rows = brokerRows.map((row): StrategyComparisonRow => {
    const localPoints = historyForStrategy(
      persistedHistory,
      row.meta.slug,
      row.meta.accountId,
    );
    const localHistory = normalizeLocalHistory(localPoints);
    const stats = localHistoryStats(localPoints);
    const useLocal = localHistory.length >= 2;

    return {
      ...row,
      history: useLocal ? localHistory : row.history,
      historySource: useLocal
        ? "local"
        : row.history.length >= 2
          ? "alpaca"
          : "none",
      localSnapshots: stats.snapshotCount,
      localReturn: stats.localReturn,
      localDrawdown: stats.localDrawdown,
      localMaxEquity: stats.maxEquity,
    };
  });

  const benchmark = await getSpyBenchmark(rows, alpacaTimeframe);

  return { generatedAtUtc, alpacaPeriod, alpacaTimeframe, benchmark, rows };
}

function normalizePeriod(value?: string | string[] | null): AlpacaHistoryPeriod {
  const raw = Array.isArray(value) ? value.at(0) : value;
  return alpacaPeriodOptions.includes(raw as AlpacaHistoryPeriod)
    ? (raw as AlpacaHistoryPeriod)
    : "1D";
}

function normalizeTimeframe(
  value?: string | string[] | null,
): AlpacaHistoryTimeframe {
  const raw = Array.isArray(value) ? value.at(0) : value;
  return alpacaTimeframeOptions.includes(raw as AlpacaHistoryTimeframe)
    ? (raw as AlpacaHistoryTimeframe)
    : "5Min";
}

function toAlpacaPortfolioPeriod(period: AlpacaHistoryPeriod) {
  return period === "1Y" ? "1A" : period;
}

function toMarketDataTimeframe(timeframe: AlpacaHistoryTimeframe) {
  if (timeframe === "1H") {
    return "1Hour";
  }
  if (timeframe === "1D") {
    return "1Day";
  }
  return timeframe;
}

function normalizeHistory(
  timestamps: number[],
  equity: number[],
): NormalizedHistoryPoint[] {
  const pairs = timestamps
    .map((timestamp, index) => ({
      timestamp,
      equity: Number(equity[index] ?? 0),
    }))
    .filter((point) => point.timestamp > 0 && point.equity > 0);
  const base = pairs.at(0)?.equity ?? 0;
  return pairs.map((point) => ({
    ...point,
    normalized: base > 0 ? point.equity / base - 1 : 0,
  }));
}

function historyStats(points: Array<{ equity: number }>) {
  const first = points.at(0)?.equity ?? null;
  const last = points.at(-1)?.equity ?? null;
  const maxEquity = points.reduce(
    (max, point) => Math.max(max, point.equity),
    first ?? 0,
  );

  return {
    totalReturn: first && last ? last / first - 1 : null,
    currentDrawdown: last && maxEquity > 0 ? last / maxEquity - 1 : null,
  };
}

async function getSpyBenchmark(
  rows: StrategyComparisonRow[],
  timeframe: AlpacaHistoryTimeframe,
): Promise<BenchmarkSeries | null> {
  const firstRowWithHistory = rows.find(
    (row) => row.alpacaHistory.length >= 2,
  );
  if (!firstRowWithHistory) {
    return null;
  }

  try {
    const account = getSelectedAlpacaAccount(firstRowWithHistory.meta.accountId);
    const env = getSelectedAccountServerEnv(account);
    const client = createAlpacaReadOnlyClient(env, {
      baseUrl: account.baseUrl,
    });
    const allTimestamps = rows.flatMap((row) =>
      row.alpacaHistory.map((point) => point.timestamp),
    );
    const startTimestamp = Math.min(...allTimestamps);
    const endTimestamp = Math.max(...allTimestamps);
    const bars = await client.getStockBars(createCorrelationId("benchmark-spy"), {
      symbol: "SPY",
      timeframe: toMarketDataTimeframe(timeframe),
      start: new Date(startTimestamp * 1000).toISOString(),
      end: new Date((endTimestamp + 60) * 1000).toISOString(),
    });
    const history = normalizeHistory(
      bars.map((bar) => Math.floor(new Date(bar.t).getTime() / 1000)),
      bars.map((bar) => bar.c),
    );
    const stats = historyStats(history);

    return {
      label: "S&P 500 proxy",
      source: "SPY",
      history,
      totalReturn: stats.totalReturn,
      currentDrawdown: stats.currentDrawdown,
    };
  } catch {
    return null;
  }
}

function emptyRow(
  meta: StrategyMeta,
  error: string,
  alpacaHistoryPeriod: AlpacaHistoryPeriod = "1D",
  alpacaHistoryTimeframe: AlpacaHistoryTimeframe = "5Min",
): StrategyComparisonRow {
  return {
    meta,
    accountName: meta.accountId,
    equity: null,
    cash: null,
    portfolioValue: null,
    grossExposure: null,
    positions: 0,
    openOrders: 0,
    dayPl: null,
    totalPl: null,
    history: [],
    historySource: "none",
    alpacaHistory: [],
    alpacaHistoryReturn: null,
    alpacaHistoryDrawdown: null,
    alpacaHistoryPeriod,
    alpacaHistoryTimeframe,
    localSnapshots: 0,
    localReturn: null,
    localDrawdown: null,
    localMaxEquity: null,
    error,
  };
}
