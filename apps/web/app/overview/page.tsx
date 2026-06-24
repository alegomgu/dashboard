import {
  CalendarClock,
  RefreshCcw,
  ShieldCheck,
} from "lucide-react";
import { createAlpacaReadOnlyClient } from "@command-center/alpaca-client";
import { StatusBadge } from "@/components/status-badge";
import {
  getSafeAlpacaAccounts,
  getSelectedAccountServerEnv,
  getSelectedAlpacaAccount,
} from "@/lib/alpaca-accounts";
import { createCorrelationId } from "@/lib/correlation";
import { getPortfolioOverview, type PortfolioAccountRow } from "@/lib/portfolio";

export const dynamic = "force-dynamic";

type RebalanceInfo = {
  label: string;
  next: string;
  detail: string;
};

type BenchmarkCard = {
  price: number;
  dayReturn: number | null;
  totalReturn: number | null;
  drawdown: number | null;
  startDate: string;
  points: number;
  error: string | null;
};

function money(value: number | null | undefined) {
  if (value === null || value === undefined || Number.isNaN(value)) {
    return "n/a";
  }

  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 2,
  }).format(value);
}

function pct(value: number | null | undefined, digits = 1) {
  if (value === null || value === undefined || Number.isNaN(value)) {
    return "n/a";
  }

  return `${(value * 100).toFixed(digits)}%`;
}

function pctValue(value: number | null | undefined, digits = 1) {
  if (value === null || value === undefined || Number.isNaN(value)) {
    return "n/a";
  }

  return `${value.toFixed(digits)}%`;
}

function valueToneClass(value: number | null | undefined) {
  if (value === null || value === undefined || Number.isNaN(value) || value === 0) {
    return "text-ink";
  }

  return value > 0 ? "text-positive" : "text-danger";
}

function dateTime(value: string) {
  return new Intl.DateTimeFormat("es-ES", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Europe/Madrid",
  }).format(new Date(value));
}

function dateOnly(value: Date) {
  return new Intl.DateTimeFormat("es-ES", {
    weekday: "short",
    day: "2-digit",
    month: "short",
    timeZone: "America/New_York",
  }).format(value);
}

function isBusinessDay(value: Date) {
  const day = value.getUTCDay();
  return day !== 0 && day !== 6;
}

function nextBusinessDay(from: Date, offset = 1) {
  const value = new Date(from);
  value.setUTCDate(value.getUTCDate() + offset);
  while (!isBusinessDay(value)) {
    value.setUTCDate(value.getUTCDate() + 1);
  }
  return value;
}

function nextMonday(from: Date) {
  const value = new Date(from);
  const day = value.getUTCDay();
  const daysUntilMonday = (8 - day) % 7 || 7;
  value.setUTCDate(value.getUTCDate() + daysUntilMonday);
  return value;
}

function firstBusinessDayOfMonth(year: number, month: number) {
  const value = new Date(Date.UTC(year, month, 1, 14, 30, 0));
  while (!isBusinessDay(value)) {
    value.setUTCDate(value.getUTCDate() + 1);
  }
  return value;
}

function nextQuarterlyRebalance(from: Date) {
  const months = [0, 3, 6, 9];
  const year = from.getUTCFullYear();
  const candidates = [
    ...months.map((month) => firstBusinessDayOfMonth(year, month)),
    firstBusinessDayOfMonth(year + 1, 0),
  ];
  return candidates.find((candidate) => candidate > from) ?? candidates.at(-1)!;
}

function rebalanceInfo(slug: string): RebalanceInfo {
  const now = new Date();
  if (slug === "regime-core") {
    return {
      label: "Semanal",
      next: `${dateOnly(nextMonday(now))} · tras apertura NY`,
      detail: "Revisa QQQ/SOXX/SPY contra SMA200; entra sólo en ETFs 3x risk-on.",
    };
  }

  if (slug === "momentum-legar") {
    return {
      label: "Trimestral",
      next: `${dateOnly(nextQuarterlyRebalance(now))} · si LEGAR >= +0.05`,
      detail: "Primer día hábil de enero, abril, julio y octubre; mantiene cartera entre rebalanceos.",
    };
  }

  return {
    label: "Diaria / semanal",
    next: `${dateOnly(nextBusinessDay(now))} · próxima sesión`,
    detail: "Salidas diarias por pérdida de momentum; entradas frescas semanales según señal.",
  };
}

function dayMetrics(
  account: PortfolioAccountRow,
  positions: ReturnType<typeof positionsForAccount>,
) {
  const dayPl = positions.reduce(
    (sum, position) => sum + position.marketValue * position.changeToday,
    0,
  );
  const dayReturnBase = account.equity - dayPl;
  return {
    dayPl,
    dayReturn: dayReturnBase > 0 ? dayPl / dayReturnBase : null,
  };
}

function totalReturn(account: PortfolioAccountRow) {
  const base = account.equity - account.unrealizedPl;
  return base > 0 ? account.unrealizedPl / base : null;
}

function positionsForAccount(
  account: PortfolioAccountRow,
  allPositions: Awaited<ReturnType<typeof getPortfolioOverview>>["positions"],
) {
  return allPositions
    .filter((position) => position.accountId === account.account.id)
    .sort((left, right) => right.marketValue - left.marketValue);
}

async function getSpyBenchmarkCard(
  startTimestamp: number | null,
): Promise<BenchmarkCard> {
  const accountId = getSafeAlpacaAccounts().at(0)?.id;
  if (!accountId) {
    return {
      price: 0,
      dayReturn: null,
      totalReturn: null,
      drawdown: null,
      startDate: "n/a",
      points: 0,
      error: "Sin cuenta Alpaca configurada para leer SPY.",
    };
  }

  const now = Math.floor(Date.now() / 1000);
  const fallbackStart = now - 31 * 24 * 60 * 60;
  const start = startTimestamp ?? fallbackStart;
  const shortWindow = now - start <= 3 * 24 * 60 * 60;

  try {
    const account = getSelectedAlpacaAccount(accountId);
    const env = getSelectedAccountServerEnv(account);
    const client = createAlpacaReadOnlyClient(env, {
      baseUrl: account.baseUrl,
    });
    const [periodBars, dailyBars] = await Promise.all([
      client.getStockBars(createCorrelationId("overview-spy-period"), {
        symbol: "SPY",
        timeframe: shortWindow ? "5Min" : "1Day",
        start: new Date(start * 1000).toISOString(),
        adjustment: "all",
      }),
      client.getStockBars(createCorrelationId("overview-spy-day"), {
        symbol: "SPY",
        timeframe: "1Day",
        start: new Date((now - 10 * 24 * 60 * 60) * 1000).toISOString(),
        adjustment: "all",
      }),
    ]);
    const closes = periodBars
      .map((bar) => ({
        timestamp: Math.floor(new Date(bar.t).getTime() / 1000),
        close: bar.c,
      }))
      .filter((point) => point.close > 0)
      .sort((left, right) => left.timestamp - right.timestamp);
    const dailyCloses = dailyBars
      .map((bar) => ({
        timestamp: Math.floor(new Date(bar.t).getTime() / 1000),
        close: bar.c,
      }))
      .filter((point) => point.close > 0)
      .sort((left, right) => left.timestamp - right.timestamp);
    const first = closes.at(0);
    const last = closes.at(-1);
    const previousDaily = dailyCloses.at(-2);
    const lastDaily = dailyCloses.at(-1);
    const maxClose = closes.reduce(
      (max, point) => Math.max(max, point.close),
      first?.close ?? 0,
    );

    return {
      price: lastDaily?.close ?? last?.close ?? 0,
      dayReturn:
        previousDaily && lastDaily ? lastDaily.close / previousDaily.close - 1 : null,
      totalReturn:
        first && last ? last.close / first.close - 1 : null,
      drawdown:
        last && maxClose > 0 ? last.close / maxClose - 1 : null,
      startDate: first
        ? new Date(first.timestamp * 1000).toISOString()
        : new Date(start * 1000).toISOString(),
      points: closes.length,
      error: null,
    };
  } catch (error) {
    return {
      price: 0,
      dayReturn: null,
      totalReturn: null,
      drawdown: null,
      startDate: new Date(start * 1000).toISOString(),
      points: 0,
      error: error instanceof Error ? error.message : "No se pudo leer SPY.",
    };
  }
}

function MetricPill({
  label,
  value,
  detail,
  toneValue,
}: {
  label: string;
  value: string;
  detail: string;
  toneValue?: number | null;
}) {
  return (
    <div className="rounded-xl border border-line bg-panelSoft p-3">
      <p className="text-[11px] font-semibold uppercase text-muted">{label}</p>
      <p className={`mt-2 text-lg font-semibold tracking-normal ${valueToneClass(toneValue)}`}>
        {value}
      </p>
      <p className="mt-1 text-xs leading-5 text-muted">{detail}</p>
    </div>
  );
}

function StrategyCard({
  account,
  positions,
}: {
  account: PortfolioAccountRow;
  positions: Awaited<ReturnType<typeof getPortfolioOverview>>["positions"];
}) {
  const strategy = account.strategy;
  const strategyPositions = positionsForAccount(account, positions);
  const today = dayMetrics(account, strategyPositions);
  const rebalance = rebalanceInfo(strategy?.slug ?? "");
  const plTone = account.unrealizedPl >= 0 ? "success" : "danger";
  const dayTone = today.dayPl >= 0 ? "success" : "danger";

  return (
    <article className="rounded-2xl border border-line bg-panel p-5 shadow-panel">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <StatusBadge label={account.account.name} tone="neutral" />
            <StatusBadge label={account.status} tone={account.error ? "danger" : "success"} />
            <StatusBadge label={`${account.positions} pos.`} tone="neutral" />
          </div>
          <h3 className="mt-3 text-xl font-semibold tracking-normal">
            {strategy?.title ?? "Sin estrategia asignada"}
          </h3>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-muted">
            {strategy?.shortName ?? account.account.id} · métricas read-only desde Alpaca y snapshots propios.
          </p>
        </div>
        <div className="rounded-xl border border-line bg-panelSoft p-3 xl:min-w-[300px]">
          <p className="flex items-center gap-2 text-[11px] font-semibold uppercase text-muted">
            <CalendarClock size={14} aria-hidden="true" />
            Rebalanceo
          </p>
          <p className="mt-2 font-semibold">{rebalance.label}</p>
          <p className="mt-1 text-sm text-muted">{rebalance.next}</p>
          <p className="mt-2 text-xs leading-5 text-muted">{rebalance.detail}</p>
        </div>
      </div>

      {account.error ? (
        <div className="mt-4 rounded-xl border border-danger/30 bg-danger/10 p-3 text-sm text-danger">
          {account.error}
        </div>
      ) : null}

      <section className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <MetricPill
          label="Hoy P&L"
          value={money(today.dayPl)}
          detail={`Retorno día aprox. ${pct(today.dayReturn, 2)}`}
          toneValue={today.dayPl}
        />
        <MetricPill
          label="Equity"
          value={money(account.equity)}
          detail={`Cash ${money(account.cash)}`}
        />
        <MetricPill
          label="P&L total"
          value={money(account.unrealizedPl)}
          detail={`Retorno total aprox. ${pct(totalReturn(account), 2)}`}
          toneValue={account.unrealizedPl}
        />
        <MetricPill
          label="Riesgo"
          value={pct(account.grossExposure, 1)}
          detail={`DD local ${pct(account.localDrawdown, 2)} · ${account.localSnapshots} snapshots`}
        />
      </section>

      <section className="mt-4 grid gap-4">
        <div className="overflow-hidden rounded-xl border border-line">
          <table className="w-full min-w-[820px] text-sm">
            <thead className="bg-panelSoft text-left text-xs uppercase text-muted">
              <tr>
                <th className="px-3 py-2 font-semibold">Ticker</th>
                <th className="px-3 py-2 text-right font-semibold">Qty</th>
                <th className="px-3 py-2 text-right font-semibold">Valor</th>
                <th className="px-3 py-2 text-right font-semibold">Peso</th>
                <th className="px-3 py-2 text-right font-semibold">Hoy %</th>
                <th className="px-3 py-2 text-right font-semibold">P&L día</th>
                <th className="px-3 py-2 text-right font-semibold">Total %</th>
                <th className="px-3 py-2 text-right font-semibold">P&L total</th>
              </tr>
            </thead>
            <tbody>
              {strategyPositions.length ? (
                strategyPositions.map((position) => {
                  const dayPl = position.marketValue * position.changeToday;
                  return (
                    <tr key={position.symbol} className="border-t border-line/70">
                      <td className="px-3 py-2 font-semibold">{position.symbol}</td>
                      <td className="px-3 py-2 text-right">{position.qty.toFixed(4)}</td>
                      <td className="px-3 py-2 text-right">{money(position.marketValue)}</td>
                      <td className="px-3 py-2 text-right">{pctValue(position.weightPct, 1)}</td>
                      <td className={`px-3 py-2 text-right font-medium ${valueToneClass(position.changeToday)}`}>
                        {pct(position.changeToday, 2)}
                      </td>
                      <td className={`px-3 py-2 text-right font-medium ${valueToneClass(dayPl)}`}>
                        {money(dayPl)}
                      </td>
                      <td className={`px-3 py-2 text-right font-medium ${valueToneClass(position.unrealizedPlpc)}`}>
                        {pct(position.unrealizedPlpc, 2)}
                      </td>
                      <td className={`px-3 py-2 text-right font-medium ${valueToneClass(position.unrealizedPl)}`}>
                        {money(position.unrealizedPl)}
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={8} className="px-3 py-8 text-center text-muted">
                    Sin posiciones abiertas.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="grid gap-3 md:grid-cols-2">
          <div className="rounded-xl border border-line bg-panelSoft p-3">
            <p className="text-[11px] font-semibold uppercase text-muted">Estado diario</p>
            <div className="mt-3 flex items-center justify-between gap-3">
              <span className="text-sm text-muted">P&L día</span>
              <StatusBadge label={money(today.dayPl)} tone={dayTone} />
            </div>
            <div className="mt-3 flex items-center justify-between gap-3">
              <span className="text-sm text-muted">Retorno día</span>
              <span className={`font-semibold ${valueToneClass(today.dayReturn)}`}>
                {pct(today.dayReturn, 2)}
              </span>
            </div>
          </div>
          <div className="rounded-xl border border-line bg-panelSoft p-3">
            <p className="text-[11px] font-semibold uppercase text-muted">Estado total</p>
            <div className="mt-3 flex items-center justify-between gap-3">
              <span className="text-sm text-muted">P&L total</span>
              <StatusBadge label={money(account.unrealizedPl)} tone={plTone} />
            </div>
            <div className="mt-3 flex items-center justify-between gap-3">
              <span className="text-sm text-muted">Retorno local</span>
              <span className={`font-semibold ${valueToneClass(account.localReturn)}`}>
                {pct(account.localReturn, 2)}
              </span>
            </div>
          </div>
        </div>
      </section>
    </article>
  );
}

function SpyBenchmarkCard({ benchmark }: { benchmark: BenchmarkCard }) {
  const baseNotional = 10000;
  const benchmarkEquity =
    benchmark.totalReturn === null
      ? null
      : baseNotional * (1 + benchmark.totalReturn);
  const dayPl =
    benchmark.dayReturn === null ? null : baseNotional * benchmark.dayReturn;
  const totalPl =
    benchmark.totalReturn === null
      ? null
      : baseNotional * benchmark.totalReturn;
  const dayTone = (benchmark.dayReturn ?? 0) >= 0 ? "success" : "danger";
  const totalTone = (benchmark.totalReturn ?? 0) >= 0 ? "success" : "danger";

  return (
    <article className="rounded-2xl border border-line bg-panel p-5 shadow-panel">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <StatusBadge label="benchmark" tone="neutral" />
            <StatusBadge label="SPY" tone="neutral" />
            <StatusBadge label={`${benchmark.points} puntos`} tone="neutral" />
          </div>
          <h3 className="mt-3 text-xl font-semibold tracking-normal">
            S&P 500 proxy
          </h3>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-muted">
            Comparativa contra SPY con base hipotética de $10,000 desde el primer snapshot disponible.
          </p>
        </div>
        <div className="rounded-xl border border-line bg-panelSoft p-3 xl:min-w-[300px]">
          <p className="flex items-center gap-2 text-[11px] font-semibold uppercase text-muted">
            <CalendarClock size={14} aria-hidden="true" />
            Rebalanceo
          </p>
          <p className="mt-2 font-semibold">Buy & hold</p>
          <p className="mt-1 text-sm text-muted">Sin rebalanceo operativo</p>
          <p className="mt-2 text-xs leading-5 text-muted">
            Benchmark pasivo para comparar el periodo observado por el dashboard.
          </p>
        </div>
      </div>

      {benchmark.error ? (
        <div className="mt-4 rounded-xl border border-danger/30 bg-danger/10 p-3 text-sm text-danger">
          {benchmark.error}
        </div>
      ) : null}

      <section className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <MetricPill
          label="Hoy P&L"
          value={money(dayPl)}
          detail={`Retorno día ${pct(benchmark.dayReturn, 2)}`}
          toneValue={dayPl}
        />
        <MetricPill
          label="Equity"
          value={money(benchmarkEquity)}
          detail={`Base comparativa ${money(baseNotional)}`}
        />
        <MetricPill
          label="P&L total"
          value={money(totalPl)}
          detail={`Retorno total ${pct(benchmark.totalReturn, 2)}`}
          toneValue={totalPl}
        />
        <MetricPill
          label="Riesgo"
          value="100.0%"
          detail={`DD SPY ${pct(benchmark.drawdown, 2)} · desde ${dateTime(benchmark.startDate)}`}
        />
      </section>

      <section className="mt-4 grid gap-4">
        <div className="overflow-hidden rounded-xl border border-line">
          <table className="w-full min-w-[820px] text-sm">
            <thead className="bg-panelSoft text-left text-xs uppercase text-muted">
              <tr>
                <th className="px-3 py-2 font-semibold">Ticker</th>
                <th className="px-3 py-2 text-right font-semibold">Qty</th>
                <th className="px-3 py-2 text-right font-semibold">Valor</th>
                <th className="px-3 py-2 text-right font-semibold">Peso</th>
                <th className="px-3 py-2 text-right font-semibold">Hoy %</th>
                <th className="px-3 py-2 text-right font-semibold">P&L día</th>
                <th className="px-3 py-2 text-right font-semibold">Total %</th>
                <th className="px-3 py-2 text-right font-semibold">P&L total</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-t border-line/70">
                <td className="px-3 py-2 font-semibold">SPY</td>
                <td className="px-3 py-2 text-right">benchmark</td>
                <td className="px-3 py-2 text-right">{money(benchmarkEquity)}</td>
                <td className="px-3 py-2 text-right">100.0%</td>
                <td className={`px-3 py-2 text-right font-medium ${valueToneClass(benchmark.dayReturn)}`}>
                  {pct(benchmark.dayReturn, 2)}
                </td>
                <td className={`px-3 py-2 text-right font-medium ${valueToneClass(dayPl)}`}>
                  {money(dayPl)}
                </td>
                <td className={`px-3 py-2 text-right font-medium ${valueToneClass(benchmark.totalReturn)}`}>
                  {pct(benchmark.totalReturn, 2)}
                </td>
                <td className={`px-3 py-2 text-right font-medium ${valueToneClass(totalPl)}`}>
                  {money(totalPl)}
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <div className="grid gap-3 md:grid-cols-2">
          <div className="rounded-xl border border-line bg-panelSoft p-3">
            <p className="text-[11px] font-semibold uppercase text-muted">Estado diario</p>
            <div className="mt-3 flex items-center justify-between gap-3">
              <span className="text-sm text-muted">P&L día</span>
              <StatusBadge label={money(dayPl)} tone={dayTone} />
            </div>
            <div className="mt-3 flex items-center justify-between gap-3">
              <span className="text-sm text-muted">Retorno día</span>
              <span className={`font-semibold ${valueToneClass(benchmark.dayReturn)}`}>
                {pct(benchmark.dayReturn, 2)}
              </span>
            </div>
          </div>
          <div className="rounded-xl border border-line bg-panelSoft p-3">
            <p className="text-[11px] font-semibold uppercase text-muted">Estado total</p>
            <div className="mt-3 flex items-center justify-between gap-3">
              <span className="text-sm text-muted">P&L total</span>
              <StatusBadge label={money(totalPl)} tone={totalTone} />
            </div>
            <div className="mt-3 flex items-center justify-between gap-3">
              <span className="text-sm text-muted">Retorno total</span>
              <span className={`font-semibold ${valueToneClass(benchmark.totalReturn)}`}>
                {pct(benchmark.totalReturn, 2)}
              </span>
            </div>
          </div>
        </div>
      </section>
    </article>
  );
}

export default async function OverviewPage() {
  const overview = await getPortfolioOverview();
  const firstSnapshotTimestamp =
    overview.aggregateHistory.at(0)?.timestamp ?? null;
  const spyBenchmark = await getSpyBenchmarkCard(firstSnapshotTimestamp);

  return (
    <div className="w-full px-4 py-4 sm:px-6 lg:px-8 lg:py-7">
      <header className="rounded-3xl border border-line bg-panel p-5 shadow-panel lg:p-6">
        <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <StatusBadge label="read only" tone="success" />
              <StatusBadge label={overview.storage} tone="neutral" />
              <StatusBadge label={`${overview.accounts.length} estrategias`} tone="neutral" />
            </div>
            <h2 className="mt-4 text-2xl font-semibold tracking-normal sm:text-3xl">
              Resumen operativo de estrategias
            </h2>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-muted">
              La portada concentra lo que importa cada día: rendimiento del día, métricas totales,
              posiciones abiertas y próxima ventana de rebalanceo para cada estrategia.
            </p>
          </div>
          <div className="grid gap-2 text-sm sm:grid-cols-2 xl:min-w-[430px]">
            <div className="rounded-2xl border border-line bg-panelSoft p-3">
              <p className="flex items-center gap-2 text-xs font-semibold uppercase text-muted">
                <RefreshCcw size={14} aria-hidden="true" />
                Actualizado
              </p>
              <p className="mt-2 font-semibold">{dateTime(overview.generatedAtUtc)}</p>
            </div>
            <div className="rounded-2xl border border-line bg-panelSoft p-3">
              <p className="flex items-center gap-2 text-xs font-semibold uppercase text-muted">
                <ShieldCheck size={14} aria-hidden="true" />
                Estado
              </p>
              <p className="mt-2 font-semibold">
                {overview.totals.accountsWithError ? "Revisar errores" : "OK"}
              </p>
            </div>
          </div>
        </div>
      </header>

      <section className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricPill
          label="Equity total"
          value={money(overview.totals.equity)}
          detail={`${overview.totals.accountsOk} cuentas leídas correctamente`}
        />
        <MetricPill
          label="P&L total"
          value={money(overview.totals.unrealizedPl)}
          detail="Suma de P&L no realizado por posiciones"
        />
        <MetricPill
          label="Gross total"
          value={pct(overview.totals.grossExposure)}
          detail={`${overview.totals.positions} posiciones abiertas`}
        />
        <MetricPill
          label="Cash total"
          value={money(overview.totals.cash)}
          detail={`${overview.totals.openOrders} órdenes abiertas`}
        />
      </section>

      <section className="mt-4 grid gap-4">
        {overview.accounts
          .filter((account) => account.strategy)
          .map((account) => (
            <StrategyCard
              key={account.account.id}
              account={account}
              positions={overview.positions}
            />
          ))}
        <SpyBenchmarkCard benchmark={spyBenchmark} />
      </section>
    </div>
  );
}
