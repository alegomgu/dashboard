import {
  AlertTriangle,
  CheckCircle2,
  Clock3,
  ListChecks,
  ShieldCheck,
  XCircle,
} from "lucide-react";
import { StatusBadge } from "@/components/status-badge";
import { getOrdersSnapshot } from "@/lib/read-only-snapshots";

export const dynamic = "force-dynamic";

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat("es-ES", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Europe/Madrid",
  }).format(new Date(value));
}

function displayPrice(value: string) {
  return value ? `$${Number(value).toFixed(2)}` : "—";
}

function Stat({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: string;
  icon: typeof ListChecks;
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

export default async function OrdersPage({
  searchParams,
}: {
  searchParams: Promise<{ account?: string }>;
}) {
  const { account: accountId } = await searchParams;
  const snapshot = await getOrdersSnapshot(accountId);

  return (
    <div className="w-full px-4 py-4 sm:px-6 lg:px-8 lg:py-7">
      <header className="rounded-3xl border border-line bg-panel p-5 shadow-panel lg:p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <div className="flex items-center gap-3">
              <div className="flex size-12 items-center justify-center rounded-2xl bg-accentSoft text-accent">
                <ListChecks size={21} aria-hidden="true" />
              </div>
              <div>
                <p className="text-xs font-semibold uppercase text-muted">
                  Orders
                </p>
                <h2 className="mt-1 text-2xl font-semibold tracking-normal sm:text-3xl">
                  Órdenes y ejecuciones
                </h2>
              </div>
            </div>
            <p className="mt-4 max-w-3xl text-sm leading-6 text-muted">
              {snapshot.selectedAccount.name} · Consulta read-only de órdenes
              recientes. Cancelar, reemplazar o crear órdenes no existe en esta
              fase.
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
            No se pudieron leer órdenes: {snapshot.error}. No se ha intentado
            ninguna mutación financiera.
          </p>
        </section>
      ) : null}

      <section className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <Stat
          label="Total"
          value={String(snapshot.counts.all)}
          icon={ListChecks}
        />
        <Stat label="Open" value={String(snapshot.counts.open)} icon={Clock3} />
        <Stat
          label="Filled"
          value={String(snapshot.counts.filled)}
          icon={CheckCircle2}
        />
        <Stat
          label="Canceled"
          value={String(snapshot.counts.canceled)}
          icon={XCircle}
        />
        <Stat
          label="Rejected"
          value={String(snapshot.counts.rejected)}
          icon={ShieldCheck}
        />
      </section>

      <section className="mt-4 rounded-2xl border border-line bg-panel p-5 shadow-panel">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <h3 className="text-base font-semibold">Últimas órdenes</h3>
            <p className="mt-1 text-sm text-muted">
              Última lectura: {formatDateTime(snapshot.generatedAtUtc)}
            </p>
          </div>
          <StatusBadge label={`${snapshot.rows.length} filas`} tone="neutral" />
        </div>

        <div className="mt-4 overflow-x-auto">
          {snapshot.rows.length > 0 ? (
            <table className="w-full min-w-[1100px] border-collapse text-sm">
              <thead>
                <tr className="border-b border-line text-left text-xs uppercase text-muted">
                  <th className="py-3 font-semibold">Hora</th>
                  <th className="py-3 font-semibold">Símbolo</th>
                  <th className="py-3 font-semibold">Side</th>
                  <th className="py-3 font-semibold">Tipo</th>
                  <th className="py-3 font-semibold">TIF</th>
                  <th className="py-3 text-right font-semibold">Qty</th>
                  <th className="py-3 text-right font-semibold">Filled</th>
                  <th className="py-3 text-right font-semibold">Limit</th>
                  <th className="py-3 text-right font-semibold">Stop</th>
                  <th className="py-3 font-semibold">Estado</th>
                  <th className="py-3 font-semibold">Ext.</th>
                  <th className="py-3 font-semibold">Client order ID</th>
                </tr>
              </thead>
              <tbody>
                {snapshot.rows.map((order) => (
                  <tr
                    key={order.id}
                    className="border-b border-line/70 last:border-b-0"
                  >
                    <td className="py-3 text-muted">
                      {formatDateTime(order.submittedAt)}
                    </td>
                    <td className="py-3 font-semibold">{order.symbol}</td>
                    <td className="py-3 uppercase text-muted">{order.side}</td>
                    <td className="py-3 uppercase">{order.type}</td>
                    <td className="py-3 uppercase text-muted">
                      {order.timeInForce}
                    </td>
                    <td className="py-3 text-right">{order.qty}</td>
                    <td className="py-3 text-right">{order.filledQty}</td>
                    <td className="py-3 text-right">
                      {displayPrice(order.limitPrice)}
                    </td>
                    <td className="py-3 text-right">
                      {displayPrice(order.stopPrice)}
                    </td>
                    <td className="py-3">
                      <span className="rounded-full border border-line bg-panelSoft px-2.5 py-1 text-xs font-semibold uppercase">
                        {order.status}
                      </span>
                    </td>
                    <td className="py-3">
                      {order.extendedHours ? "Sí" : "No"}
                    </td>
                    <td className="max-w-[240px] truncate py-3 text-muted">
                      {order.clientOrderId}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="flex min-h-[220px] items-center justify-center rounded-xl border border-dashed border-line bg-panelSoft px-4 text-center text-sm text-muted">
              Sin órdenes para mostrar o conexión Alpaca pendiente.
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
