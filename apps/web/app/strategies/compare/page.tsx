import { BarChart3, RefreshCcw } from "lucide-react";
import { CaptureSnapshotButton } from "@/components/capture-snapshot-button";
import { StrategyEquityChart } from "@/components/strategy-equity-chart";
import { StatusBadge } from "@/components/status-badge";
import { getHistoryHealth, readHistoryFile } from "@/lib/account-history";
import { getStrategyComparison } from "@/lib/strategies";

export const dynamic = "force-dynamic";

function money(value: number | null) {
  if (value === null || Number.isNaN(value)) {
    return "n/a";
  }
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 2,
  }).format(value);
}

function pct(value: number | null) {
  if (value === null || Number.isNaN(value)) {
    return "n/a";
  }
  return `${(value * 100).toFixed(1)}%`;
}

function dateTime(value: string) {
  return new Intl.DateTimeFormat("es-ES", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Europe/Madrid",
  }).format(new Date(value));
}

export default async function StrategyComparePage() {
  const comparison = await getStrategyComparison();
  const historyHealth = getHistoryHealth(await readHistoryFile());
  const successfulRows = comparison.rows.filter((row) => !row.error);
  const totalEquity = successfulRows.reduce(
    (sum, row) => sum + (row.equity ?? 0),
    0,
  );
  const bestLocalRow = successfulRows
    .filter((row) => row.localReturn !== null)
    .sort((left, right) => (right.localReturn ?? -Infinity) - (left.localReturn ?? -Infinity))
    .at(0);
  const highestDrawdownRow = successfulRows
    .filter((row) => row.localDrawdown !== null)
    .sort((left, right) => (left.localDrawdown ?? 0) - (right.localDrawdown ?? 0))
    .at(0);
  const bestAlpacaIntradayRow = successfulRows
    .filter((row) => row.alpacaIntradayReturn !== null)
    .sort(
      (left, right) =>
        (right.alpacaIntradayReturn ?? -Infinity) -
        (left.alpacaIntradayReturn ?? -Infinity),
    )
    .at(0);

  return (
    <div className="w-full px-4 py-4 sm:px-6 lg:px-8 lg:py-7">
      <header className="rounded-3xl border border-line bg-panel p-5 shadow-panel lg:p-6">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
          <div>
            <div className="flex items-center gap-3">
              <div className="flex size-12 items-center justify-center rounded-2xl bg-accentSoft text-accent">
                <BarChart3 size={21} aria-hidden="true" />
              </div>
              <div>
                <p className="text-xs font-semibold uppercase text-muted">
                  Strategy Comparison
                </p>
                <h2 className="mt-1 text-2xl font-semibold tracking-normal sm:text-3xl">
                  Evolución comparada
                </h2>
              </div>
            </div>
            <p className="mt-4 max-w-3xl text-sm leading-6 text-muted">
              Comparativa read-only entre las tres estrategias/cuentas. La curva
              se normaliza desde el primer snapshot propio. Esta sección captura
              un nuevo punto al cargar y también permite forzar refresco manual.
            </p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row xl:flex-col">
            <CaptureSnapshotButton />
            <div className="rounded-2xl border border-line bg-panelSoft p-3 text-sm">
              <p className="flex items-center gap-2 text-xs font-semibold uppercase text-muted">
                <RefreshCcw size={14} aria-hidden="true" />
                Actualizado
              </p>
              <p className="mt-2 font-semibold">
                {dateTime(comparison.generatedAtUtc)}
              </p>
            </div>
          </div>
        </div>
      </header>

      <section className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-2xl border border-line bg-panel p-5 shadow-panel">
          <p className="text-xs font-semibold uppercase text-muted">
            Equity agregado
          </p>
          <p className="mt-3 text-2xl font-semibold tracking-normal">
            {money(totalEquity)}
          </p>
          <p className="mt-2 text-sm text-muted">
            Suma read-only de las cuentas configuradas.
          </p>
        </div>
        <div className="rounded-2xl border border-line bg-panel p-5 shadow-panel">
          <p className="text-xs font-semibold uppercase text-muted">
            Mejor desde snapshot local
          </p>
          <p className="mt-3 text-2xl font-semibold tracking-normal">
            {bestLocalRow ? pct(bestLocalRow.localReturn) : "n/a"}
          </p>
          <p className="mt-2 text-sm text-muted">
            {bestLocalRow?.meta.title ?? "Aún falta histórico propio."}
          </p>
        </div>
        <div className="rounded-2xl border border-line bg-panel p-5 shadow-panel">
          <p className="text-xs font-semibold uppercase text-muted">
            Peor drawdown local
          </p>
          <p className="mt-3 text-2xl font-semibold tracking-normal">
            {highestDrawdownRow ? pct(highestDrawdownRow.localDrawdown) : "n/a"}
          </p>
          <p className="mt-2 text-sm text-muted">
            {highestDrawdownRow?.meta.title ?? "Aún falta histórico propio."}
          </p>
        </div>
        <div className="rounded-2xl border border-line bg-panel p-5 shadow-panel">
          <p className="text-xs font-semibold uppercase text-muted">
            Mejor intradía Alpaca
          </p>
          <p className="mt-3 text-2xl font-semibold tracking-normal">
            {bestAlpacaIntradayRow
              ? pct(bestAlpacaIntradayRow.alpacaIntradayReturn)
              : "n/a"}
          </p>
          <p className="mt-2 text-sm text-muted">
            {bestAlpacaIntradayRow?.meta.title ?? "Sin curva intradía."}
          </p>
        </div>
      </section>

      <section className="mt-4 grid gap-4 lg:grid-cols-[minmax(0,1fr)_420px]">
        <div className="rounded-2xl border border-line bg-panel p-5 shadow-panel">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h3 className="text-base font-semibold">Salud del histórico local</h3>
              <p className="mt-1 text-sm text-muted">
                Memoria propia del dashboard. No muta Alpaca ni envía órdenes.
              </p>
            </div>
            <StatusBadge label={historyHealth.storage} tone="neutral" />
          </div>
          <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-xl border border-line bg-panelSoft p-3">
              <dt className="text-xs font-semibold uppercase text-muted">
                Último snapshot
              </dt>
              <dd className="mt-2 font-semibold">
                {historyHealth.latestSnapshotUtc
                  ? dateTime(historyHealth.latestSnapshotUtc)
                  : "n/a"}
              </dd>
            </div>
            <div className="rounded-xl border border-line bg-panelSoft p-3">
              <dt className="text-xs font-semibold uppercase text-muted">
                Edad
              </dt>
              <dd className="mt-2 font-semibold">
                {historyHealth.latestAgeMinutes === null
                  ? "n/a"
                  : `${historyHealth.latestAgeMinutes} min`}
              </dd>
            </div>
            <div className="rounded-xl border border-line bg-panelSoft p-3">
              <dt className="text-xs font-semibold uppercase text-muted">
                Snapshots hoy
              </dt>
              <dd className="mt-2 font-semibold">
                {historyHealth.snapshotsToday}
              </dd>
            </div>
            <div className="rounded-xl border border-line bg-panelSoft p-3">
              <dt className="text-xs font-semibold uppercase text-muted">
                Total puntos
              </dt>
              <dd className="mt-2 font-semibold">
                {historyHealth.totalSnapshots}
              </dd>
            </div>
          </dl>
        </div>

        <aside className="rounded-2xl border border-line bg-panel p-5 shadow-panel">
          <div className="flex items-center justify-between gap-3">
            <h3 className="text-base font-semibold">Alertas informativas</h3>
            <StatusBadge
              label={historyHealth.warnings.length ? "Revisar" : "OK"}
              tone={historyHealth.warnings.length ? "warning" : "success"}
            />
          </div>
          <div className="mt-4 grid gap-2">
            {historyHealth.warnings.length ? (
              historyHealth.warnings.map((warning) => (
                <p
                  key={warning}
                  className="rounded-xl border border-warning/30 bg-warning/10 px-3 py-2 text-sm text-warning"
                >
                  {warning}
                </p>
              ))
            ) : (
              <p className="rounded-xl border border-line bg-panelSoft px-3 py-2 text-sm text-muted">
                Sin alertas informativas con las reglas actuales.
              </p>
            )}
          </div>
        </aside>
      </section>

      <section className="mt-4">
        <StrategyEquityChart
          rows={comparison.rows}
          title="Evolución local"
          description="Curva construida con snapshots propios guardados en Postgres al entrar en esta sección o pulsar actualizar."
        />
      </section>

      <section className="mt-4">
        <StrategyEquityChart
          rows={comparison.rows}
          mode="alpacaIntraday"
          title="Evolución intradía Alpaca"
          description="Portfolio history de Alpaca para 1D/5Min. Útil para ver el movimiento del día con más resolución."
        />
      </section>

      <section className="mt-4 rounded-2xl border border-line bg-panel p-5 shadow-panel">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 className="text-base font-semibold">Resumen por estrategia</h3>
            <p className="mt-1 text-sm text-muted">
              Equity, exposición y P&L reportados por cada cuenta Alpaca.
            </p>
          </div>
          <StatusBadge label="Read only" tone="success" />
        </div>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[1380px] border-collapse text-sm">
            <thead>
              <tr className="border-b border-line text-left text-xs uppercase text-muted">
                <th className="py-2 font-semibold">Estrategia</th>
                <th className="py-2 font-semibold">Cuenta</th>
                <th className="py-2 text-right font-semibold">Equity</th>
                <th className="py-2 text-right font-semibold">Cash</th>
                <th className="py-2 text-right font-semibold">Gross</th>
                <th className="py-2 text-right font-semibold">Pos.</th>
                <th className="py-2 text-right font-semibold">Órdenes</th>
                <th className="py-2 text-right font-semibold">P&L total</th>
                <th className="py-2 text-right font-semibold">Ret. local</th>
                <th className="py-2 text-right font-semibold">DD local</th>
                <th className="py-2 text-right font-semibold">Ret. Alpaca 1D</th>
                <th className="py-2 text-right font-semibold">DD Alpaca 1D</th>
                <th className="py-2 text-right font-semibold">Snap.</th>
                <th className="py-2 text-right font-semibold">Curva</th>
                <th className="py-2 font-semibold">Estado</th>
              </tr>
            </thead>
            <tbody>
              {comparison.rows.map((row) => (
                <tr key={row.meta.slug} className="border-b border-line/70 last:border-b-0">
                  <td className="py-3 font-semibold">{row.meta.title}</td>
                  <td className="py-3 text-muted">{row.accountName}</td>
                  <td className="py-3 text-right">{money(row.equity)}</td>
                  <td className="py-3 text-right">{money(row.cash)}</td>
                  <td className="py-3 text-right">{pct(row.grossExposure)}</td>
                  <td className="py-3 text-right">{row.positions}</td>
                  <td className="py-3 text-right">{row.openOrders}</td>
                  <td className="py-3 text-right font-semibold">
                    {money(row.totalPl)}
                  </td>
                  <td className="py-3 text-right">{pct(row.localReturn)}</td>
                  <td className="py-3 text-right">{pct(row.localDrawdown)}</td>
                  <td className="py-3 text-right">
                    {pct(row.alpacaIntradayReturn)}
                  </td>
                  <td className="py-3 text-right">
                    {pct(row.alpacaIntradayDrawdown)}
                  </td>
                  <td className="py-3 text-right">{row.localSnapshots}</td>
                  <td className="py-3 text-right uppercase text-muted">
                    {row.historySource}
                  </td>
                  <td className="max-w-[260px] py-3 text-sm text-muted">
                    {row.error ? row.error : "OK"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
