import {
  Activity,
  AlertTriangle,
  ArrowDownRight,
  ArrowUpRight,
  Clock3,
  DollarSign,
  Landmark,
  Power,
  RefreshCcw,
  ShieldCheck,
  WalletCards,
} from "lucide-react";
import { StatusBadge } from "@/components/status-badge";
import { getDashboardSnapshot } from "@/lib/dashboard";

export const dynamic = "force-dynamic";

function formatDateTime(value: string | null, timeZone = "Europe/Madrid") {
  if (!value) {
    return "No disponible";
  }

  return new Intl.DateTimeFormat("es-ES", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone,
  }).format(new Date(value));
}

function formatCurrency(value: string | null | undefined) {
  if (!value) {
    return "Pendiente";
  }

  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 2,
  }).format(Number(value));
}

function formatPercent(value: string | null | undefined) {
  if (!value) {
    return "0.00%";
  }

  return `${(Number(value) * 100).toFixed(2)}%`;
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
  icon: typeof DollarSign;
  tone?: "neutral" | "positive" | "warning" | "danger";
}) {
  const toneClass = {
    neutral: "bg-info/10 text-info",
    positive: "bg-positive/10 text-positive",
    warning: "bg-warning/10 text-warning",
    danger: "bg-danger/10 text-danger",
  }[tone];

  return (
    <section className="min-h-[148px] rounded-2xl border border-line bg-panel p-5 shadow-panel">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase text-muted">{label}</p>
          <p className="mt-3 text-2xl font-semibold tracking-normal md:text-3xl">
            {value}
          </p>
        </div>
        <div
          className={`flex size-11 items-center justify-center rounded-xl ${toneClass}`}
        >
          <Icon size={18} aria-hidden="true" />
        </div>
      </div>
      <p className="mt-4 text-sm text-muted">{detail}</p>
    </section>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-line/70 py-2.5 last:border-b-0">
      <dt className="text-muted">{label}</dt>
      <dd className="text-right font-medium">{value}</dd>
    </div>
  );
}

function EmptyState({ label }: { label: string }) {
  return (
    <div className="flex min-h-[132px] items-center justify-center rounded-xl border border-dashed border-line bg-panelSoft px-4 text-center text-sm text-muted">
      {label}
    </div>
  );
}

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ account?: string }>;
}) {
  const { account: accountId } = await searchParams;
  const snapshot = await getDashboardSnapshot(accountId);
  const account = snapshot.account;
  const clock = snapshot.clock;

  const invested =
    account && Number(account.portfolioValue) > 0
      ? (
          (Number(account.longMarketValue) / Number(account.portfolioValue)) *
          100
        ).toFixed(1)
      : "0.0";

  return (
    <div className="w-full px-4 py-4 sm:px-6 lg:px-8 lg:py-7">
      <header className="rounded-3xl border border-line bg-panel p-5 shadow-panel lg:p-6">
        <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <StatusBadge
                label={snapshot.mode.alpacaEnv}
                tone={
                  snapshot.mode.alpacaEnv === "paper" ? "success" : "danger"
                }
              />
              <StatusBadge
                label={snapshot.mode.tradingMode.replace("_", " ")}
                tone={snapshot.mode.readOnlyPassed ? "success" : "danger"}
              />
              <StatusBadge
                label={`feed ${snapshot.mode.dataFeed}`}
                tone="neutral"
              />
              <StatusBadge
                label={clock?.isOpen ? "mercado abierto" : "mercado cerrado"}
                tone={clock?.isOpen ? "success" : "warning"}
              />
            </div>
            <h2 className="mt-4 text-2xl font-semibold tracking-normal sm:text-3xl">
              Trading Command Center
            </h2>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-muted">
              {snapshot.selectedAccount.name} · Cuenta Alpaca Paper en modo
              lectura. Estado operativo, cartera, órdenes y frescura de datos en
              una sola vista.
            </p>
          </div>
          <div className="grid gap-2 text-sm sm:grid-cols-2 xl:min-w-[460px]">
            <div className="rounded-2xl border border-line bg-panelSoft p-3">
              <p className="flex items-center gap-2 text-xs font-semibold uppercase text-muted">
                <Clock3 size={14} aria-hidden="true" />
                Nueva York
              </p>
              <p className="mt-2 font-semibold">
                {formatDateTime(clock?.timestamp ?? null, "America/New_York")}
              </p>
            </div>
            <div className="rounded-2xl border border-line bg-panelSoft p-3">
              <p className="flex items-center gap-2 text-xs font-semibold uppercase text-muted">
                <RefreshCcw size={14} aria-hidden="true" />
                Actualizado
              </p>
              <p className="mt-2 font-semibold">
                {formatDateTime(snapshot.freshness.generatedAtUtc)}
              </p>
            </div>
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
            No se pudo leer Alpaca todavía: {snapshot.error}. El modo read-only
            sigue activo y no hay rutas de órdenes disponibles.
          </p>
        </section>
      ) : null}

      <section className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Metric
          label="Equity"
          value={formatCurrency(account?.equity)}
          detail="Valor total de cuenta reportado por Alpaca."
          icon={Landmark}
          tone="positive"
        />
        <Metric
          label="Cash"
          value={formatCurrency(account?.cash)}
          detail="Efectivo disponible, separado de market value."
          icon={DollarSign}
        />
        <Metric
          label="Buying power"
          value={formatCurrency(account?.buyingPower)}
          detail="Capacidad de compra informativa en modo lectura."
          icon={Power}
          tone="warning"
        />
        <Metric
          label="Exposición long"
          value={`${invested}%`}
          detail={`${formatCurrency(account?.longMarketValue)} en posiciones long.`}
          icon={WalletCards}
        />
      </section>

      <section className="mt-4 grid gap-4 xl:grid-cols-[minmax(0,1fr)_420px]">
        <div className="rounded-2xl border border-line bg-panel p-5 shadow-panel">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h3 className="text-base font-semibold">
                Posiciones principales
              </h3>
              <p className="mt-1 text-sm text-muted">
                P&L no realizado y exposición por símbolo.
              </p>
            </div>
            <StatusBadge
              label={`${snapshot.counts.positions} posiciones`}
              tone="neutral"
            />
          </div>
          <div className="mt-4 overflow-x-auto">
            {snapshot.positions.length > 0 ? (
              <table className="w-full min-w-[720px] border-collapse text-sm">
                <thead>
                  <tr className="border-b border-line text-left text-xs uppercase text-muted">
                    <th className="py-2 font-semibold">Símbolo</th>
                    <th className="py-2 font-semibold">Side</th>
                    <th className="py-2 text-right font-semibold">Qty</th>
                    <th className="py-2 text-right font-semibold">Último</th>
                    <th className="py-2 text-right font-semibold">
                      Market value
                    </th>
                    <th className="py-2 text-right font-semibold">P&L</th>
                    <th className="py-2 text-right font-semibold">P&L %</th>
                  </tr>
                </thead>
                <tbody>
                  {snapshot.positions.map((position) => {
                    const pl = Number(position.unrealizedPl);
                    const Icon = pl >= 0 ? ArrowUpRight : ArrowDownRight;
                    const color = pl >= 0 ? "text-positive" : "text-danger";

                    return (
                      <tr
                        key={position.symbol}
                        className="border-b border-line/70 last:border-b-0"
                      >
                        <td className="py-3 font-semibold">
                          {position.symbol}
                        </td>
                        <td className="py-3 uppercase text-muted">
                          {position.side}
                        </td>
                        <td className="py-3 text-right">{position.qty}</td>
                        <td className="py-3 text-right">
                          {formatCurrency(position.currentPrice)}
                        </td>
                        <td className="py-3 text-right">
                          {formatCurrency(position.marketValue)}
                        </td>
                        <td
                          className={`py-3 text-right font-semibold ${color}`}
                        >
                          <span className="inline-flex items-center justify-end gap-1">
                            <Icon size={14} aria-hidden="true" />
                            {formatCurrency(position.unrealizedPl)}
                          </span>
                        </td>
                        <td
                          className={`py-3 text-right font-semibold ${color}`}
                        >
                          {formatPercent(position.unrealizedPlpc)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            ) : (
              <EmptyState label="Sin posiciones para mostrar o conexión Alpaca pendiente." />
            )}
          </div>
        </div>

        <aside className="grid gap-4">
          <section className="rounded-2xl border border-line bg-panel p-5 shadow-panel">
            <div className="flex items-center justify-between gap-4">
              <h3 className="text-base font-semibold">Mercado</h3>
              <Activity size={18} className="text-muted" aria-hidden="true" />
            </div>
            <dl className="mt-3 text-sm">
              <InfoRow
                label="Siguiente apertura"
                value={formatDateTime(
                  clock?.nextOpen ?? null,
                  "America/New_York",
                )}
              />
              <InfoRow
                label="Siguiente cierre"
                value={formatDateTime(
                  clock?.nextClose ?? null,
                  "America/New_York",
                )}
              />
              <InfoRow
                label="Madrid"
                value={formatDateTime(clock?.timestamp ?? null)}
              />
              <InfoRow
                label="REST"
                value={snapshot.error ? "Degradado" : "Operativo"}
              />
            </dl>
          </section>

          <section className="rounded-2xl border border-line bg-panel p-5 shadow-panel">
            <div className="flex items-center justify-between gap-4">
              <h3 className="text-base font-semibold">Riesgo operativo</h3>
              <ShieldCheck
                size={18}
                className="text-positive"
                aria-hidden="true"
              />
            </div>
            <dl className="mt-3 text-sm">
              <InfoRow label="Trading" value="Bloqueado" />
              <InfoRow label="Live" value="No implementado" />
              <InfoRow label="Shorts" value="Desactivados" />
              <InfoRow
                label="Órdenes abiertas"
                value={String(snapshot.counts.openOrders)}
              />
            </dl>
          </section>
        </aside>
      </section>

      <section className="mt-4 rounded-2xl border border-line bg-panel p-5 shadow-panel">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 className="text-base font-semibold">Órdenes abiertas</h3>
            <p className="mt-1 text-sm text-muted">
              Vista read-only de las últimas órdenes abiertas.
            </p>
          </div>
          <StatusBadge
            label={`${snapshot.counts.openOrders} abiertas`}
            tone="neutral"
          />
        </div>
        <div className="mt-4 overflow-x-auto">
          {snapshot.openOrders.length > 0 ? (
            <table className="w-full min-w-[760px] border-collapse text-sm">
              <thead>
                <tr className="border-b border-line text-left text-xs uppercase text-muted">
                  <th className="py-2 font-semibold">Símbolo</th>
                  <th className="py-2 font-semibold">Side</th>
                  <th className="py-2 font-semibold">Tipo</th>
                  <th className="py-2 font-semibold">TIF</th>
                  <th className="py-2 text-right font-semibold">Qty</th>
                  <th className="py-2 text-right font-semibold">Filled</th>
                  <th className="py-2 font-semibold">Estado</th>
                  <th className="py-2 text-right font-semibold">Submit</th>
                </tr>
              </thead>
              <tbody>
                {snapshot.openOrders.map((order) => (
                  <tr
                    key={order.id}
                    className="border-b border-line/70 last:border-b-0"
                  >
                    <td className="py-3 font-semibold">{order.symbol}</td>
                    <td className="py-3 uppercase text-muted">{order.side}</td>
                    <td className="py-3 uppercase">{order.type}</td>
                    <td className="py-3 uppercase text-muted">
                      {order.timeInForce}
                    </td>
                    <td className="py-3 text-right">{order.qty}</td>
                    <td className="py-3 text-right">{order.filledQty}</td>
                    <td className="py-3">{order.status}</td>
                    <td className="py-3 text-right">
                      {formatDateTime(order.submittedAt, "America/New_York")}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <EmptyState label="Sin órdenes abiertas para mostrar o conexión Alpaca pendiente." />
          )}
        </div>
      </section>
    </div>
  );
}
