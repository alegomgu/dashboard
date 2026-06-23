import {
  AlertTriangle,
  ArrowDownRight,
  ArrowUpRight,
  BriefcaseBusiness,
  CircleDollarSign,
  Layers3,
  PieChart,
  RefreshCcw,
  ShieldCheck,
} from "lucide-react";
import { StatusBadge } from "@/components/status-badge";
import { getPortfolioOverview } from "@/lib/portfolio";

export const dynamic = "force-dynamic";

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

function pct(value: number | null | undefined, alreadyPercent = false) {
  if (value === null || value === undefined || Number.isNaN(value)) {
    return "n/a";
  }

  return `${(alreadyPercent ? value : value * 100).toFixed(1)}%`;
}

function dateTime(value: string) {
  return new Intl.DateTimeFormat("es-ES", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Europe/Madrid",
  }).format(new Date(value));
}

function Metric({
  label,
  value,
  detail,
  icon: Icon,
  tone = "neutral",
}: {
  label: string;
  value: string;
  detail: string;
  icon: typeof BriefcaseBusiness;
  tone?: "neutral" | "positive" | "warning" | "danger";
}) {
  const toneClass = {
    neutral: "bg-info/10 text-info",
    positive: "bg-positive/10 text-positive",
    warning: "bg-warning/10 text-warning",
    danger: "bg-danger/10 text-danger",
  }[tone];

  return (
    <section className="min-h-[150px] rounded-2xl border border-line bg-panel p-5 shadow-panel">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase text-muted">{label}</p>
          <p className="mt-3 text-2xl font-semibold tracking-normal md:text-3xl">
            {value}
          </p>
        </div>
        <div
          className={`flex size-11 shrink-0 items-center justify-center rounded-xl ${toneClass}`}
        >
          <Icon size={18} aria-hidden="true" />
        </div>
      </div>
      <p className="mt-4 text-sm text-muted">{detail}</p>
    </section>
  );
}

function EquityCurve({
  points,
}: {
  points: Array<{ timestamp: number; equity: number; normalized: number }>;
}) {
  if (points.length < 2) {
    return (
      <div className="flex min-h-[280px] items-center justify-center rounded-2xl border border-dashed border-line bg-panelSoft px-4 text-center text-sm text-muted">
        Aún falta histórico local suficiente. Al entrar en Portfolio y
        Estrategias se irán acumulando snapshots.
      </div>
    );
  }

  const width = 900;
  const height = 300;
  const padding = { left: 58, right: 20, top: 18, bottom: 34 };
  const innerW = width - padding.left - padding.right;
  const innerH = height - padding.top - padding.bottom;
  const min = Math.min(...points.map((point) => point.normalized), 0);
  const max = Math.max(...points.map((point) => point.normalized), 0);
  const span = Math.max(max - min, 0.01);
  const firstTs = points.at(0)?.timestamp ?? 0;
  const lastTs = points.at(-1)?.timestamp ?? firstTs + 1;
  const tsSpan = Math.max(lastTs - firstTs, 1);
  const path = points
    .map((point, index) => {
      const x = padding.left + ((point.timestamp - firstTs) / tsSpan) * innerW;
      const y = padding.top + ((max - point.normalized) / span) * innerH;
      return `${index === 0 ? "M" : "L"} ${x.toFixed(1)} ${y.toFixed(1)}`;
    })
    .join(" ");

  return (
    <div className="rounded-2xl border border-line bg-panel p-4 shadow-panel">
      <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h3 className="text-base font-semibold">Equity agregada local</h3>
          <p className="mt-1 text-sm text-muted">
            Suma de snapshots propios por minuto, normalizada desde el primer
            punto común disponible.
          </p>
        </div>
        <StatusBadge label={`${points.length} puntos`} tone="neutral" />
      </div>
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="h-auto w-full"
        role="img"
        aria-label="Curva de equity agregada del portfolio"
      >
        {[0, 0.25, 0.5, 0.75, 1].map((ratio) => {
          const value = max - ratio * span;
          const y = padding.top + ratio * innerH;
          return (
            <g key={ratio}>
              <line
                x1={padding.left}
                x2={width - padding.right}
                y1={y}
                y2={y}
                stroke="#e2e8f0"
                strokeWidth="1"
              />
              <text x={8} y={y + 4} className="fill-slate-500 text-[11px]">
                {(value * 100).toFixed(1)}%
              </text>
            </g>
          );
        })}
        <line
          x1={padding.left}
          x2={width - padding.right}
          y1={padding.top + (max / span) * innerH}
          y2={padding.top + (max / span) * innerH}
          stroke="#94a3b8"
          strokeDasharray="4 4"
          strokeWidth="1"
        />
        <path
          d={path}
          fill="none"
          stroke="#0f766e"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="3"
        />
      </svg>
    </div>
  );
}

export default async function PortfolioPage() {
  const overview = await getPortfolioOverview();
  const hasErrors = overview.totals.accountsWithError > 0;
  const grossTone =
    overview.totals.grossExposure >= 1.35
      ? "warning"
      : overview.totals.grossExposure >= 1
        ? "positive"
        : "neutral";
  const plTone = overview.totals.unrealizedPl >= 0 ? "positive" : "danger";

  return (
    <div className="w-full px-4 py-4 sm:px-6 lg:px-8 lg:py-7">
      <header className="rounded-3xl border border-line bg-panel p-5 shadow-panel lg:p-6">
        <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
          <div>
            <div className="flex items-center gap-3">
              <div className="flex size-12 items-center justify-center rounded-2xl bg-accentSoft text-accent">
                <BriefcaseBusiness size={21} aria-hidden="true" />
              </div>
              <div>
                <p className="text-xs font-semibold uppercase text-muted">
                  Portfolio
                </p>
                <h2 className="mt-1 text-2xl font-semibold tracking-normal sm:text-3xl">
                  Rendimiento y exposición global
                </h2>
              </div>
            </div>
            <p className="mt-4 max-w-3xl text-sm leading-6 text-muted">
              Vista agregada read-only de las cuentas Alpaca configuradas:
              equity, cash, gross, P&L, concentración y evolución local. Al
              cargar esta pantalla se refresca un snapshot propio para alimentar
              el histórico.
            </p>
          </div>
          <div className="grid gap-2 text-sm sm:grid-cols-2 xl:min-w-[420px]">
            <div className="rounded-2xl border border-line bg-panelSoft p-3">
              <p className="flex items-center gap-2 text-xs font-semibold uppercase text-muted">
                <RefreshCcw size={14} aria-hidden="true" />
                Actualizado
              </p>
              <p className="mt-2 font-semibold">
                {dateTime(overview.generatedAtUtc)}
              </p>
            </div>
            <div className="rounded-2xl border border-line bg-panelSoft p-3">
              <p className="text-xs font-semibold uppercase text-muted">
                Histórico
              </p>
              <p className="mt-2 font-semibold uppercase">{overview.storage}</p>
            </div>
          </div>
        </div>
      </header>

      {hasErrors ? (
        <section className="mt-4 flex items-start gap-3 rounded-2xl border border-warning/30 bg-warning/10 p-4 text-sm text-warning">
          <AlertTriangle
            className="mt-0.5 shrink-0"
            size={18}
            aria-hidden="true"
          />
          <p>
            Hay {overview.totals.accountsWithError} cuenta(s) con lectura
            degradada. La página mantiene modo solo lectura y muestra el resto
            de cuentas disponibles.
          </p>
        </section>
      ) : null}

      <section className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Metric
          label="Equity agregado"
          value={money(overview.totals.equity)}
          detail={`${overview.totals.accountsOk} cuenta(s) operativas.`}
          icon={BriefcaseBusiness}
          tone="positive"
        />
        <Metric
          label="Cash agregado"
          value={money(overview.totals.cash)}
          detail={`${money(overview.totals.buyingPower)} buying power total.`}
          icon={CircleDollarSign}
          tone={overview.totals.cash < 0 ? "warning" : "neutral"}
        />
        <Metric
          label="Gross exposure"
          value={pct(overview.totals.grossExposure)}
          detail={`${money(overview.totals.longMarketValue)} long market value.`}
          icon={PieChart}
          tone={grossTone}
        />
        <Metric
          label="P&L no realizado"
          value={money(overview.totals.unrealizedPl)}
          detail={`${overview.totals.positions} posiciones, ${overview.totals.openOrders} órdenes abiertas.`}
          icon={overview.totals.unrealizedPl >= 0 ? ArrowUpRight : ArrowDownRight}
          tone={plTone}
        />
      </section>

      <section className="mt-4 grid gap-4 lg:grid-cols-[minmax(0,1fr)_360px]">
        <EquityCurve points={overview.aggregateHistory} />

        <aside className="grid gap-4">
          <section className="rounded-2xl border border-line bg-panel p-5 shadow-panel">
            <div className="flex items-center justify-between gap-4">
              <h3 className="text-base font-semibold">Concentración</h3>
              <Layers3 size={18} className="text-muted" aria-hidden="true" />
            </div>
            <dl className="mt-4 grid gap-3 text-sm">
              <div className="flex justify-between gap-4 border-b border-line/70 pb-2">
                <dt className="text-muted">Top 1 posición</dt>
                <dd className="font-semibold">
                  {pct(overview.totals.top1WeightPct, true)}
                </dd>
              </div>
              <div className="flex justify-between gap-4 border-b border-line/70 pb-2">
                <dt className="text-muted">Top 3 posiciones</dt>
                <dd className="font-semibold">
                  {pct(overview.totals.top3WeightPct, true)}
                </dd>
              </div>
              <div className="flex justify-between gap-4 border-b border-line/70 pb-2">
                <dt className="text-muted">Top 5 posiciones</dt>
                <dd className="font-semibold">
                  {pct(overview.totals.top5WeightPct, true)}
                </dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-muted">Short market value</dt>
                <dd className="font-semibold">
                  {money(overview.totals.shortMarketValue)}
                </dd>
              </div>
            </dl>
          </section>

          <section className="rounded-2xl border border-line bg-panel p-5 shadow-panel">
            <div className="flex items-center justify-between gap-4">
              <h3 className="text-base font-semibold">Seguridad</h3>
              <ShieldCheck
                size={18}
                className="text-positive"
                aria-hidden="true"
              />
            </div>
            <dl className="mt-4 grid gap-3 text-sm">
              <div className="flex justify-between gap-4 border-b border-line/70 pb-2">
                <dt className="text-muted">Modo</dt>
                <dd className="font-semibold">Read only</dd>
              </div>
              <div className="flex justify-between gap-4 border-b border-line/70 pb-2">
                <dt className="text-muted">Trading live</dt>
                <dd className="font-semibold">No implementado</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-muted">Mutaciones</dt>
                <dd className="font-semibold">Bloqueadas</dd>
              </div>
            </dl>
          </section>
        </aside>
      </section>

      <section className="mt-4 rounded-2xl border border-line bg-panel p-5 shadow-panel">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 className="text-base font-semibold">Cuentas y estrategias</h3>
            <p className="mt-1 text-sm text-muted">
              Resumen por cuenta Alpaca, incluyendo snapshots locales y estado
              de conexión.
            </p>
          </div>
          <StatusBadge label={`${overview.accounts.length} cuentas`} tone="neutral" />
        </div>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[1160px] border-collapse text-sm">
            <thead>
              <tr className="border-b border-line text-left text-xs uppercase text-muted">
                <th className="py-2 font-semibold">Cuenta</th>
                <th className="py-2 font-semibold">Estrategia</th>
                <th className="py-2 text-right font-semibold">Equity</th>
                <th className="py-2 text-right font-semibold">Cash</th>
                <th className="py-2 text-right font-semibold">Gross</th>
                <th className="py-2 text-right font-semibold">Pos.</th>
                <th className="py-2 text-right font-semibold">P&L</th>
                <th className="py-2 text-right font-semibold">Ret. local</th>
                <th className="py-2 text-right font-semibold">DD local</th>
                <th className="py-2 text-right font-semibold">Snap.</th>
                <th className="py-2 font-semibold">Estado</th>
              </tr>
            </thead>
            <tbody>
              {overview.accounts.map((row) => {
                const plToneClass =
                  row.unrealizedPl >= 0 ? "text-positive" : "text-danger";
                return (
                  <tr
                    key={row.account.id}
                    className="border-b border-line/70 last:border-b-0"
                  >
                    <td className="py-3 font-semibold">{row.account.name}</td>
                    <td className="py-3 text-muted">
                      {row.strategy?.title ?? "Sin estrategia asignada"}
                    </td>
                    <td className="py-3 text-right">{money(row.equity)}</td>
                    <td className="py-3 text-right">{money(row.cash)}</td>
                    <td className="py-3 text-right">{pct(row.grossExposure)}</td>
                    <td className="py-3 text-right">{row.positions}</td>
                    <td className={`py-3 text-right font-semibold ${plToneClass}`}>
                      {money(row.unrealizedPl)}
                    </td>
                    <td className="py-3 text-right">{pct(row.localReturn)}</td>
                    <td className="py-3 text-right">{pct(row.localDrawdown)}</td>
                    <td className="py-3 text-right">{row.localSnapshots}</td>
                    <td className="max-w-[240px] py-3 text-muted">
                      {row.error ?? row.status}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      <section className="mt-4 rounded-2xl border border-line bg-panel p-5 shadow-panel">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 className="text-base font-semibold">Posiciones agregadas</h3>
            <p className="mt-1 text-sm text-muted">
              Ranking por market value para detectar concentración entre
              estrategias.
            </p>
          </div>
          <StatusBadge
            label={`${overview.positions.length} posiciones`}
            tone="neutral"
          />
        </div>
        <div className="mt-4 overflow-x-auto">
          {overview.positions.length > 0 ? (
            <table className="w-full min-w-[1180px] border-collapse text-sm">
              <thead>
                <tr className="border-b border-line text-left text-xs uppercase text-muted">
                  <th className="py-2 font-semibold">Ticker</th>
                  <th className="py-2 font-semibold">Cuenta</th>
                  <th className="py-2 font-semibold">Estrategia</th>
                  <th className="py-2 text-right font-semibold">Qty</th>
                  <th className="py-2 text-right font-semibold">Último</th>
                  <th className="py-2 text-right font-semibold">Market value</th>
                  <th className="py-2 text-right font-semibold">Peso cuenta</th>
                  <th className="py-2 text-right font-semibold">P&L</th>
                  <th className="py-2 text-right font-semibold">P&L %</th>
                  <th className="py-2 text-right font-semibold">Hoy</th>
                </tr>
              </thead>
              <tbody>
                {overview.positions.slice(0, 30).map((position) => {
                  const color =
                    position.unrealizedPl >= 0 ? "text-positive" : "text-danger";
                  return (
                    <tr
                      key={`${position.accountId}-${position.symbol}`}
                      className="border-b border-line/70 last:border-b-0"
                    >
                      <td className="py-3 font-semibold">{position.symbol}</td>
                      <td className="py-3 text-muted">{position.accountName}</td>
                      <td className="py-3 text-muted">
                        {position.strategyTitle}
                      </td>
                      <td className="py-3 text-right">{position.qty}</td>
                      <td className="py-3 text-right">
                        {money(position.currentPrice)}
                      </td>
                      <td className="py-3 text-right">
                        {money(position.marketValue)}
                      </td>
                      <td className="py-3 text-right">
                        {pct(position.weightPct, true)}
                      </td>
                      <td className={`py-3 text-right font-semibold ${color}`}>
                        {money(position.unrealizedPl)}
                      </td>
                      <td className={`py-3 text-right font-semibold ${color}`}>
                        {pct(position.unrealizedPlpc)}
                      </td>
                      <td className="py-3 text-right">
                        {pct(position.changeToday)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          ) : (
            <div className="flex min-h-[220px] items-center justify-center rounded-xl border border-dashed border-line bg-panelSoft px-4 text-center text-sm text-muted">
              Sin posiciones agregadas para mostrar.
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
