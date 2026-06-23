import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import type { StrategyComparisonRow } from "./strategies";
import { getSql, hasDatabaseUrl } from "./database";

export type AccountHistoryPoint = {
  timestamp: string;
  strategySlug: string;
  strategyTitle: string;
  accountId: string;
  accountName: string;
  equity: number;
  cash: number;
  portfolioValue: number;
  grossExposure: number;
  positions: number;
  openOrders: number;
  dayPl: number | null;
  totalPl: number | null;
};

type AccountHistoryFile = {
  version: 1;
  points: AccountHistoryPoint[];
  storage: "postgres" | "json";
};

const historyPath = path.join(process.cwd(), "data", "account-history.json");

async function ensureHistoryTable() {
  const sql = getSql();
  await sql`
    create table if not exists account_history_snapshots (
      snapshot_bucket timestamptz not null,
      timestamp timestamptz not null,
      strategy_slug text not null,
      strategy_title text not null,
      account_id text not null,
      account_name text not null,
      equity double precision not null,
      cash double precision not null,
      portfolio_value double precision not null,
      gross_exposure double precision not null,
      positions integer not null,
      open_orders integer not null,
      day_pl double precision,
      total_pl double precision,
      created_at timestamptz not null default now(),
      primary key (strategy_slug, snapshot_bucket)
    )
  `;
}

async function readDbHistoryFile(): Promise<AccountHistoryFile> {
  await ensureHistoryTable();
  const sql = getSql();
  const rows = await sql`
    select
      timestamp,
      strategy_slug,
      strategy_title,
      account_id,
      account_name,
      equity,
      cash,
      portfolio_value,
      gross_exposure,
      positions,
      open_orders,
      day_pl,
      total_pl
    from account_history_snapshots
    order by timestamp asc
    limit 5000
  `;

  return {
    version: 1,
    storage: "postgres",
    points: rows.map((row): AccountHistoryPoint => ({
      timestamp: new Date(row.timestamp as string | Date).toISOString(),
      strategySlug: String(row.strategy_slug),
      strategyTitle: String(row.strategy_title),
      accountId: String(row.account_id),
      accountName: String(row.account_name),
      equity: Number(row.equity),
      cash: Number(row.cash),
      portfolioValue: Number(row.portfolio_value),
      grossExposure: Number(row.gross_exposure),
      positions: Number(row.positions),
      openOrders: Number(row.open_orders),
      dayPl: row.day_pl === null ? null : Number(row.day_pl),
      totalPl: row.total_pl === null ? null : Number(row.total_pl),
    })),
  };
}

export async function readHistoryFile(): Promise<AccountHistoryFile> {
  if (hasDatabaseUrl()) {
    return readDbHistoryFile();
  }

  try {
    const raw = await readFile(historyPath, "utf8");
    const parsed = JSON.parse(raw) as Partial<AccountHistoryFile>;
    return {
      version: 1,
      storage: "json",
      points: Array.isArray(parsed.points) ? parsed.points : [],
    };
  } catch (error) {
    if (error instanceof Error && "code" in error && error.code === "ENOENT") {
      return { version: 1, storage: "json", points: [] };
    }
    throw error;
  }
}

async function writeHistoryFile(history: AccountHistoryFile) {
  if (history.storage === "postgres") {
    return;
  }

  await mkdir(path.dirname(historyPath), { recursive: true });
  await writeFile(historyPath, `${JSON.stringify(history, null, 2)}\n`, "utf8");
}

function snapshotBucket(timestamp: string) {
  const date = new Date(timestamp);
  date.setUTCSeconds(0, 0);
  return date.toISOString();
}

function pointKey(point: Pick<AccountHistoryPoint, "timestamp" | "strategySlug">) {
  return `${point.strategySlug}:${snapshotBucket(point.timestamp)}`;
}

export async function appendStrategyHistory(
  rows: StrategyComparisonRow[],
  timestamp: string,
) {
  const validPoints = rows.flatMap((row): AccountHistoryPoint[] => {
    if (
      row.error ||
      row.equity === null ||
      row.cash === null ||
      row.portfolioValue === null ||
      row.grossExposure === null
    ) {
      return [];
    }

    return [
      {
        timestamp,
        strategySlug: row.meta.slug,
        strategyTitle: row.meta.title,
        accountId: row.meta.accountId,
        accountName: row.accountName,
        equity: row.equity,
        cash: row.cash,
        portfolioValue: row.portfolioValue,
        grossExposure: row.grossExposure,
        positions: row.positions,
        openOrders: row.openOrders,
        dayPl: row.dayPl,
        totalPl: row.totalPl,
      },
    ];
  });

  if (!validPoints.length) {
    return readHistoryFile();
  }

  if (hasDatabaseUrl()) {
    await ensureHistoryTable();
    const sql = getSql();
    for (const point of validPoints) {
      await sql`
        insert into account_history_snapshots (
          snapshot_bucket,
          timestamp,
          strategy_slug,
          strategy_title,
          account_id,
          account_name,
          equity,
          cash,
          portfolio_value,
          gross_exposure,
          positions,
          open_orders,
          day_pl,
          total_pl
        )
        values (
          ${snapshotBucket(point.timestamp)},
          ${point.timestamp},
          ${point.strategySlug},
          ${point.strategyTitle},
          ${point.accountId},
          ${point.accountName},
          ${point.equity},
          ${point.cash},
          ${point.portfolioValue},
          ${point.grossExposure},
          ${point.positions},
          ${point.openOrders},
          ${point.dayPl},
          ${point.totalPl}
        )
        on conflict (strategy_slug, snapshot_bucket)
        do update set
          timestamp = excluded.timestamp,
          strategy_title = excluded.strategy_title,
          account_id = excluded.account_id,
          account_name = excluded.account_name,
          equity = excluded.equity,
          cash = excluded.cash,
          portfolio_value = excluded.portfolio_value,
          gross_exposure = excluded.gross_exposure,
          positions = excluded.positions,
          open_orders = excluded.open_orders,
          day_pl = excluded.day_pl,
          total_pl = excluded.total_pl
      `;
    }
    return readDbHistoryFile();
  }

  const history = await readHistoryFile();
  const byKey = new Map(history.points.map((point) => [pointKey(point), point]));

  for (const point of validPoints) {
    byKey.set(pointKey(point), point);
  }

  const points = [...byKey.values()]
    .sort((left, right) => left.timestamp.localeCompare(right.timestamp))
    .slice(-5000);
  const nextHistory: AccountHistoryFile = { version: 1, storage: "json", points };
  await writeHistoryFile(nextHistory);
  return nextHistory;
}

export function historyForStrategy(
  history: AccountHistoryFile,
  strategySlug: string,
  accountId?: string,
) {
  return history.points.filter(
    (point) =>
      point.strategySlug === strategySlug &&
      (!accountId || point.accountId === accountId),
  );
}

export function normalizeLocalHistory(points: AccountHistoryPoint[]) {
  const valid = points
    .filter((point) => point.equity > 0)
    .map((point) => ({
      timestamp: Math.floor(new Date(point.timestamp).getTime() / 1000),
      equity: point.equity,
    }));
  const base = valid.at(0)?.equity ?? 0;
  return valid.map((point) => ({
    ...point,
    normalized: base > 0 ? point.equity / base - 1 : 0,
  }));
}

export function localHistoryStats(points: AccountHistoryPoint[]) {
  const valid = points.filter((point) => point.equity > 0);
  const first = valid.at(0)?.equity ?? null;
  const last = valid.at(-1)?.equity ?? null;
  const maxEquity = valid.reduce(
    (max, point) => Math.max(max, point.equity),
    first ?? 0,
  );
  const localReturn =
    first && last ? last / first - 1 : null;
  const localDrawdown =
    last && maxEquity > 0 ? last / maxEquity - 1 : null;

  return {
    snapshotCount: valid.length,
    firstEquity: first,
    lastEquity: last,
    maxEquity: maxEquity || null,
    localReturn,
    localDrawdown,
  };
}

export function getHistoryHealth(history: AccountHistoryFile) {
  const now = Date.now();
  const today = new Date();
  const todayKey = today.toISOString().slice(0, 10);
  const latestPoint = history.points.at(-1) ?? null;
  const latestSnapshotUtc = latestPoint?.timestamp ?? null;
  const latestAgeMinutes = latestSnapshotUtc
    ? Math.floor((now - new Date(latestSnapshotUtc).getTime()) / 60000)
    : null;
  const snapshotsToday = history.points.filter((point) =>
    point.timestamp.startsWith(todayKey),
  ).length;
  const strategyCount = new Set(history.points.map((point) => point.strategySlug)).size;
  const latestByStrategy = new Map<string, AccountHistoryPoint>();

  for (const point of history.points) {
    latestByStrategy.set(point.strategySlug, point);
  }

  const warnings: string[] = [];
  if (!latestSnapshotUtc) {
    warnings.push("No hay snapshots locales todavía.");
  } else if (latestAgeMinutes !== null && latestAgeMinutes > 120) {
    warnings.push("El último snapshot local tiene más de 2 horas.");
  }
  if (strategyCount < 3) {
    warnings.push("No hay histórico local para las 3 estrategias.");
  }

  for (const point of latestByStrategy.values()) {
    if (point.openOrders > 0) {
      warnings.push(`${point.accountName} tiene ${point.openOrders} órdenes abiertas.`);
    }
    if (point.grossExposure > 1.7) {
      warnings.push(`${point.accountName} supera 170% de gross exposure.`);
    }
  }

  return {
    latestSnapshotUtc,
    latestAgeMinutes,
    snapshotsToday,
    totalSnapshots: history.points.length,
    strategyCount,
    storage: history.storage,
    warnings,
  };
}
