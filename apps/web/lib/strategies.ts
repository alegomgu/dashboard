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
    accountId: "alpaca_1",
    tone: "teal",
    summary:
      "Timing de régimen sobre ETFs apalancados 3x de tech, semis y mercado amplio.",
  },
  {
    slug: "momentum-legar",
    title: "Momentum 12-1 LEGAR-gated",
    shortName: "LEGAR",
    fileName: "STRATEGY_CARD_MOMENTUM_LEGAR.md",
    accountId: "alpaca_2",
    tone: "blue",
    summary:
      "Momentum transversal S&P 500 point-in-time, top 10 trimestral, gross 1.6x y gate LEGAR.",
  },
  {
    slug: "aggressive-ai-momentum",
    title: "Aggressive AI Momentum",
    shortName: "AI Mom",
    fileName: "STRATEGY_CARD_aggressive_ai_momentum.md",
    accountId: "alpaca_3",
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
  history: Array<{ timestamp: number; equity: number; normalized: number }>;
  historySource: "local" | "alpaca" | "none";
  alpacaIntradayHistory: Array<{ timestamp: number; equity: number; normalized: number }>;
  alpacaIntradayReturn: number | null;
  alpacaIntradayDrawdown: number | null;
  localSnapshots: number;
  localReturn: number | null;
  localDrawdown: number | null;
  localMaxEquity: number | null;
  error: string | null;
};

export async function getStrategyComparison(): Promise<{
  generatedAtUtc: string;
  rows: StrategyComparisonRow[];
}> {
  const generatedAtUtc = new Date().toISOString();
  const accounts = getSafeAlpacaAccounts();
  const brokerRows = await Promise.all(
    strategyMetas.map(async (meta): Promise<StrategyComparisonRow> => {
      const safeAccount =
        accounts.find((account) => account.id === meta.accountId) ??
        accounts.find((account) =>
          account.name.toLowerCase().includes(meta.shortName.toLowerCase()),
        );
      if (!safeAccount) {
        return emptyRow(meta, `Cuenta no configurada para ${meta.accountId}`);
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
          intradayHistory,
        ] = await Promise.all([
          client.getAccount(correlationId),
          client.getPositions(correlationId),
          client.getOrders(correlationId, { status: "open", limit: 100 }),
          client.getPortfolioHistory(correlationId, {
            period: "1M",
            timeframe: "1D",
          }),
          client.getPortfolioHistory(correlationId, {
            period: "1D",
            timeframe: "5Min",
          }),
        ]);
        const equity = Number(alpacaAccount.equity);
        const portfolioValue = Number(alpacaAccount.portfolio_value);
        const longMarketValue = Number(alpacaAccount.long_market_value);
        const shortMarketValue = Math.abs(Number(alpacaAccount.short_market_value));
        const grossExposure =
          equity > 0 ? (longMarketValue + shortMarketValue) / equity : 0;
        const dayPl = positions.reduce(
          (sum, position) => sum + Number(position.change_today ?? 0) * Number(position.market_value),
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
        const alpacaIntradayHistory = normalizeHistory(
          intradayHistory.timestamp ?? [],
          intradayHistory.equity ?? [],
        );
        const intradayStats = historyStats(alpacaIntradayHistory);

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
          alpacaIntradayHistory,
          alpacaIntradayReturn: intradayStats.totalReturn,
          alpacaIntradayDrawdown: intradayStats.currentDrawdown,
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
        );
      }
    }),
  );

  const persistedHistory = await appendStrategyHistory(brokerRows, generatedAtUtc);
  const rows = brokerRows.map((row): StrategyComparisonRow => {
    const localPoints = historyForStrategy(persistedHistory, row.meta.slug);
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

  return { generatedAtUtc, rows };
}

function normalizeHistory(timestamps: number[], equity: number[]) {
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

function emptyRow(meta: StrategyMeta, error: string): StrategyComparisonRow {
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
    alpacaIntradayHistory: [],
    alpacaIntradayReturn: null,
    alpacaIntradayDrawdown: null,
    localSnapshots: 0,
    localReturn: null,
    localDrawdown: null,
    localMaxEquity: null,
    error,
  };
}
