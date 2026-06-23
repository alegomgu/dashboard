import {
  AlertTriangle,
  ArrowDownRight,
  ArrowUpRight,
  Clock3,
  Layers3,
  PieChart,
  WalletCards,
} from "lucide-react";
import { StatusBadge } from "@/components/status-badge";
import { getPositionsSnapshot } from "@/lib/read-only-snapshots";

export const dynamic = "force-dynamic";

function formatCurrency(value: string) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 2,
  }).format(Number(value));
}

function formatPercent(value: string) {
  return `${Number(value).toFixed(2)}%`;
}

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat("es-ES", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Europe/Madrid",
  }).format(new Date(value));
}

function SummaryCard({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: string;
  icon: typeof WalletCards;
}) {
  return (
    <section className="rounded-2xl border border-line bg-panel p-5 shadow-panel">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase text-muted">{label}</p>
          <p className="mt-3 text-2xl font-semibold tracking-normal">{value}</p>
        </div>
        <div className="flex size-11 items-center justify-center rounded-xl bg-accentSoft text-accent">
          <Icon size={18} aria-hidden="true" />
        </div>
      </div>
    </section>
  );
}

export default async function PositionsPage({
  searchParams,
}: {
  searchParams: Promise<{ account?: string }>;
}) {
  const { account: accountId } = await searchParams;
  const snapshot = await getPositionsSnapshot(accountId);

  return (
    <div className="w-full px-4 py-4 sm:px-6 lg:px-8 lg:py-7">
      <header className="rounded-3xl border border-line bg-panel p-5 shadow-panel lg:p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <div className="flex items-center gap-3">
              <div className="flex size-12 items-center justify-center rounded-2xl bg-accentSoft text-accent">
                <WalletCards size={21} aria-hidden="true" />
              </div>
              <div>
                <p className="text-xs font-semibold uppercase text-muted">
                  Positions
                </p>
                <h2 className="mt-1 text-2xl font-semibold tracking-normal sm:text-3xl">
                  Posiciones read-only
                </h2>
              </div>
            </div>
            <p className="mt-4 max-w-3xl text-sm leading-6 text-muted">
              {snapshot.selectedAccount.name} · Exposición, coste, último precio
              y P&L no realizado. No hay acciones de cierre, cancelación ni
              reemplazo en esta fase.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <StatusBadge label="Paper" tone="success" />
            <StatusBadge label="Read only" tone="success" />
          </div>
        </div>
      </header>

      {snapshot.error ? (
        <section className="mt-4 flex items-start gap-3 rounded-2xl border border-warning/30 bg-warning/10 p-4 text-sm text-warning">
          <AlertTriangle
            className="mt-0.5 shrink-0"
            size={18}
            aria-hidden="true"
          />
          <p>
            No se pudieron leer posiciones: {snapshot.error}. La pantalla
            permanece en modo seguro de solo lectura.
          </p>
        </section>
      ) : null}

      <section className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <SummaryCard
          label="Posiciones"
          value={String(snapshot.totals.count)}
          icon={Layers3}
        />
        <SummaryCard
          label="Market value"
          value={formatCurrency(snapshot.totals.marketValue)}
          icon={WalletCards}
        />
        <SummaryCard
          label="P&L no realizado"
          value={formatCurrency(snapshot.totals.unrealizedPl)}
          icon={
            snapshot.totals.unrealizedPl.startsWith("-")
              ? ArrowDownRight
              : ArrowUpRight
          }
        />
        <SummaryCard
          label="Exposición"
          value={formatPercent(snapshot.totals.exposurePct)}
          icon={PieChart}
        />
      </section>

      <section className="mt-4 rounded-2xl border border-line bg-panel p-5 shadow-panel">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <h3 className="text-base font-semibold">Tabla de posiciones</h3>
            <p className="mt-1 text-sm text-muted">
              Última lectura: {formatDateTime(snapshot.generatedAtUtc)}
            </p>
          </div>
          <StatusBadge label={`${snapshot.rows.length} filas`} tone="neutral" />
        </div>

        <div className="mt-4 overflow-x-auto">
          {snapshot.rows.length > 0 ? (
            <table className="w-full min-w-[980px] border-collapse text-sm">
              <thead>
                <tr className="border-b border-line text-left text-xs uppercase text-muted">
                  <th className="py-3 font-semibold">Símbolo</th>
                  <th className="py-3 font-semibold">Exchange</th>
                  <th className="py-3 font-semibold">Asset</th>
                  <th className="py-3 font-semibold">Side</th>
                  <th className="py-3 text-right font-semibold">Qty</th>
                  <th className="py-3 text-right font-semibold">Último</th>
                  <th className="py-3 text-right font-semibold">Cost basis</th>
                  <th className="py-3 text-right font-semibold">
                    Market value
                  </th>
                  <th className="py-3 text-right font-semibold">Peso</th>
                  <th className="py-3 text-right font-semibold">P&L</th>
                  <th className="py-3 text-right font-semibold">P&L %</th>
                  <th className="py-3 text-right font-semibold">Hoy</th>
                </tr>
              </thead>
              <tbody>
                {snapshot.rows.map((row) => {
                  const pl = Number(row.unrealizedPl);
                  const plColor = pl >= 0 ? "text-positive" : "text-danger";
                  const Icon = pl >= 0 ? ArrowUpRight : ArrowDownRight;

                  return (
                    <tr
                      key={row.symbol}
                      className="border-b border-line/70 last:border-b-0"
                    >
                      <td className="py-3 font-semibold">{row.symbol}</td>
                      <td className="py-3 text-muted">{row.exchange}</td>
                      <td className="py-3 text-muted">{row.assetClass}</td>
                      <td className="py-3 uppercase text-muted">{row.side}</td>
                      <td className="py-3 text-right">{row.qty}</td>
                      <td className="py-3 text-right">
                        {formatCurrency(row.currentPrice)}
                      </td>
                      <td className="py-3 text-right">
                        {formatCurrency(row.costBasis)}
                      </td>
                      <td className="py-3 text-right">
                        {formatCurrency(row.marketValue)}
                      </td>
                      <td className="py-3 text-right">
                        {formatPercent(row.weightPct)}
                      </td>
                      <td
                        className={`py-3 text-right font-semibold ${plColor}`}
                      >
                        <span className="inline-flex items-center justify-end gap-1">
                          <Icon size={14} aria-hidden="true" />
                          {formatCurrency(row.unrealizedPl)}
                        </span>
                      </td>
                      <td
                        className={`py-3 text-right font-semibold ${plColor}`}
                      >
                        {(Number(row.unrealizedPlpc) * 100).toFixed(2)}%
                      </td>
                      <td className="py-3 text-right">
                        {(Number(row.changeToday) * 100).toFixed(2)}%
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          ) : (
            <div className="flex min-h-[220px] items-center justify-center rounded-xl border border-dashed border-line bg-panelSoft px-4 text-center text-sm text-muted">
              Sin posiciones para mostrar o conexión Alpaca pendiente.
            </div>
          )}
        </div>
      </section>

      <section className="mt-4 rounded-2xl border border-line bg-panel p-5 shadow-panel">
        <div className="flex items-center gap-3 text-sm text-muted">
          <Clock3 size={17} aria-hidden="true" />
          <p>
            Datos server-side, sin secretos en el navegador. Cualquier acción de
            cierre queda bloqueada hasta la fase de paper trading protegido.
          </p>
        </div>
      </section>
    </div>
  );
}
