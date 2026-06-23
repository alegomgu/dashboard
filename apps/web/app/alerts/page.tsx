import {
  Activity,
  AlertTriangle,
  Bell,
  CheckCircle2,
  Clock3,
  Database,
  ShieldAlert,
} from "lucide-react";
import { StatusBadge } from "@/components/status-badge";
import { getHistoryHealth, readHistoryFile } from "@/lib/account-history";
import { getStrategyComparison, type StrategyComparisonRow } from "@/lib/strategies";

export const dynamic = "force-dynamic";

type AlertSeverity = "critical" | "warning" | "info";

type AlertItem = {
  severity: AlertSeverity;
  title: string;
  detail: string;
  strategy?: string;
  account?: string;
};

const severityMeta: Record<
  AlertSeverity,
  {
    label: string;
    tone: "neutral" | "success" | "warning" | "danger";
    icon: typeof AlertTriangle;
    className: string;
  }
> = {
  critical: {
    label: "Crítico",
    tone: "danger",
    icon: ShieldAlert,
    className: "border-danger/30 bg-danger/10 text-danger",
  },
  warning: {
    label: "Revisar",
    tone: "warning",
    icon: AlertTriangle,
    className: "border-warning/30 bg-warning/10 text-warning",
  },
  info: {
    label: "Info",
    tone: "neutral",
    icon: Bell,
    className: "border-line bg-panelSoft text-muted",
  },
};

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

function dateTime(value: string | null) {
  if (!value) {
    return "n/a";
  }
  return new Intl.DateTimeFormat("es-ES", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Europe/Madrid",
  }).format(new Date(value));
}

function buildAlerts(
  rows: StrategyComparisonRow[],
  historyHealth: ReturnType<typeof getHistoryHealth>,
) {
  const alerts: AlertItem[] = [];

  if (!historyHealth.latestSnapshotUtc) {
    alerts.push({
      severity: "critical",
      title: "Sin histórico local",
      detail:
        "Todavía no hay snapshots propios del dashboard. La comparación temporal queda incompleta.",
    });
  } else if (
    historyHealth.latestAgeMinutes !== null &&
    historyHealth.latestAgeMinutes > 360
  ) {
    alerts.push({
      severity: "critical",
      title: "Snapshots muy antiguos",
      detail: `El último snapshot tiene ${historyHealth.latestAgeMinutes} minutos. Revisa cron, Vercel o conectividad.`,
    });
  } else if (
    historyHealth.latestAgeMinutes !== null &&
    historyHealth.latestAgeMinutes > 120
  ) {
    alerts.push({
      severity: "warning",
      title: "Snapshot retrasado",
      detail: `El último snapshot tiene ${historyHealth.latestAgeMinutes} minutos. Debería refrescarse de forma periódica.`,
    });
  }

  if (historyHealth.storage === "json") {
    alerts.push({
      severity: "warning",
      title: "Histórico en JSON local",
      detail:
        "Para Vercel conviene usar DATABASE_URL/Postgres; el almacenamiento local no es durable en producción.",
    });
  }

  if (historyHealth.strategyCount < 3) {
    alerts.push({
      severity: "warning",
      title: "Falta histórico por estrategia",
      detail: `Hay histórico para ${historyHealth.strategyCount} de 3 estrategias.`,
    });
  }

  for (const row of rows) {
    if (row.error) {
      alerts.push({
        severity: "critical",
        title: "Error leyendo cuenta",
        detail: row.error,
        strategy: row.meta.title,
        account: row.accountName,
      });
      continue;
    }

    if (row.openOrders > 0) {
      alerts.push({
        severity: "warning",
        title: "Órdenes abiertas",
        detail: `${row.openOrders} órdenes siguen abiertas. Es informativo, pero conviene vigilar si quedan colgadas.`,
        strategy: row.meta.title,
        account: row.accountName,
      });
    }

    if (row.grossExposure !== null && row.grossExposure > 1.7) {
      alerts.push({
        severity: "warning",
        title: "Gross exposure elevada",
        detail: `La cuenta marca ${pct(row.grossExposure)} de exposición bruta.`,
        strategy: row.meta.title,
        account: row.accountName,
      });
    }

    if (row.localDrawdown !== null && row.localDrawdown <= -0.05) {
      alerts.push({
        severity: "warning",
        title: "Drawdown local relevante",
        detail: `La cuenta está a ${pct(row.localDrawdown)} desde su máximo local capturado por el dashboard.`,
        strategy: row.meta.title,
        account: row.accountName,
      });
    }

    if (row.localSnapshots > 0 && row.localSnapshots < 3) {
      alerts.push({
        severity: "info",
        title: "Histórico aún corto",
        detail: `Solo hay ${row.localSnapshots} snapshots locales. La curva comparada todavía es poco representativa.`,
        strategy: row.meta.title,
        account: row.accountName,
      });
    }

    if (row.positions === 0 && row.openOrders === 0) {
      alerts.push({
        severity: "info",
        title: "Cuenta sin posiciones",
        detail:
          "La cuenta está en cash o pendiente de nueva señal. Esto puede ser normal según la estrategia.",
        strategy: row.meta.title,
        account: row.accountName,
      });
    }
  }

  return alerts;
}

function countAlerts(alerts: AlertItem[], severity: AlertSeverity) {
  return alerts.filter((alert) => alert.severity === severity).length;
}

function stateForRow(row: StrategyComparisonRow) {
  if (row.error) {
    return { label: "Error", tone: "danger" as const };
  }
  if (row.openOrders > 0 || (row.grossExposure !== null && row.grossExposure > 1.7)) {
    return { label: "Revisar", tone: "warning" as const };
  }
  return { label: "OK", tone: "success" as const };
}

export default async function AlertsPage() {
  const comparison = await getStrategyComparison();
  const history = await readHistoryFile();
  const historyHealth = getHistoryHealth(history);
  const alerts = buildAlerts(comparison.rows, historyHealth);
  const criticalCount = countAlerts(alerts, "critical");
  const warningCount = countAlerts(alerts, "warning");
  const infoCount = countAlerts(alerts, "info");
  const overall =
    criticalCount > 0
      ? { label: "Crítico", tone: "danger" as const }
      : warningCount > 0
        ? { label: "Revisar", tone: "warning" as const }
        : { label: "OK", tone: "success" as const };

  return (
    <div className="w-full px-4 py-4 sm:px-6 lg:px-8 lg:py-7">
      <header className="rounded-3xl border border-line bg-panel p-5 shadow-panel lg:p-6">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
          <div>
            <div className="flex items-center gap-3">
              <div className="flex size-12 items-center justify-center rounded-2xl bg-accentSoft text-accent">
                <Bell size={21} aria-hidden="true" />
              </div>
              <div>
                <p className="text-xs font-semibold uppercase text-muted">
                  Alerts
                </p>
                <h2 className="mt-1 text-2xl font-semibold tracking-normal sm:text-3xl">
                  Alertas operativas
                </h2>
              </div>
            </div>
            <p className="mt-4 max-w-3xl text-sm leading-6 text-muted">
              Panel read-only para detectar problemas de estado: cuentas que no
              responden, snapshots antiguos, órdenes abiertas, exposición
              elevada o drawdowns locales. No envía ni cancela órdenes.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <StatusBadge label={overall.label} tone={overall.tone} />
            <StatusBadge label="Read only" tone="success" />
            <StatusBadge label={historyHealth.storage} tone="neutral" />
          </div>
        </div>
      </header>

      <section className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-2xl border border-line bg-panel p-5 shadow-panel">
          <p className="flex items-center gap-2 text-xs font-semibold uppercase text-muted">
            <ShieldAlert size={15} aria-hidden="true" />
            Críticas
          </p>
          <p className="mt-3 text-3xl font-semibold tracking-normal">
            {criticalCount}
          </p>
          <p className="mt-2 text-sm text-muted">
            Bloquean una lectura fiable del sistema.
          </p>
        </div>
        <div className="rounded-2xl border border-line bg-panel p-5 shadow-panel">
          <p className="flex items-center gap-2 text-xs font-semibold uppercase text-muted">
            <AlertTriangle size={15} aria-hidden="true" />
            A revisar
          </p>
          <p className="mt-3 text-3xl font-semibold tracking-normal">
            {warningCount}
          </p>
          <p className="mt-2 text-sm text-muted">
            Riesgos o estados que merecen vigilancia.
          </p>
        </div>
        <div className="rounded-2xl border border-line bg-panel p-5 shadow-panel">
          <p className="flex items-center gap-2 text-xs font-semibold uppercase text-muted">
            <Clock3 size={15} aria-hidden="true" />
            Último snapshot
          </p>
          <p className="mt-3 text-lg font-semibold tracking-normal">
            {dateTime(historyHealth.latestSnapshotUtc)}
          </p>
          <p className="mt-2 text-sm text-muted">
            {historyHealth.latestAgeMinutes === null
              ? "Sin edad calculable."
              : `${historyHealth.latestAgeMinutes} minutos de antigüedad.`}
          </p>
        </div>
        <div className="rounded-2xl border border-line bg-panel p-5 shadow-panel">
          <p className="flex items-center gap-2 text-xs font-semibold uppercase text-muted">
            <Database size={15} aria-hidden="true" />
            Histórico
          </p>
          <p className="mt-3 text-3xl font-semibold tracking-normal">
            {historyHealth.totalSnapshots}
          </p>
          <p className="mt-2 text-sm text-muted">
            {historyHealth.snapshotsToday} snapshots hoy · {infoCount} informativas.
          </p>
        </div>
      </section>

      <section className="mt-4 grid gap-4 xl:grid-cols-[minmax(0,1fr)_430px]">
        <div className="rounded-2xl border border-line bg-panel p-5 shadow-panel">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h3 className="text-base font-semibold">Alertas activas</h3>
              <p className="mt-1 text-sm text-muted">
                Reglas simples y explícitas sobre datos de Alpaca y snapshots
                propios.
              </p>
            </div>
            <StatusBadge label={`${alerts.length} eventos`} tone="neutral" />
          </div>

          <div className="mt-4 grid gap-3">
            {alerts.length ? (
              alerts.map((alert, index) => {
                const meta = severityMeta[alert.severity];
                const Icon = meta.icon;
                return (
                  <article
                    key={`${alert.severity}-${alert.title}-${index}`}
                    className={`rounded-2xl border p-4 ${meta.className}`}
                  >
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <div className="min-w-0">
                        <p className="flex items-center gap-2 text-sm font-semibold">
                          <Icon size={16} aria-hidden="true" />
                          {alert.title}
                        </p>
                        <p className="mt-2 text-sm leading-6">{alert.detail}</p>
                        {(alert.strategy || alert.account) && (
                          <p className="mt-2 text-xs font-semibold uppercase opacity-80">
                            {[alert.strategy, alert.account].filter(Boolean).join(" · ")}
                          </p>
                        )}
                      </div>
                      <StatusBadge label={meta.label} tone={meta.tone} />
                    </div>
                  </article>
                );
              })
            ) : (
              <div className="rounded-2xl border border-positive/25 bg-positive/10 p-5 text-positive">
                <p className="flex items-center gap-2 text-sm font-semibold">
                  <CheckCircle2 size={17} aria-hidden="true" />
                  Sin alertas con las reglas actuales
                </p>
                <p className="mt-2 text-sm">
                  Las cuentas responden, el histórico está fresco y no hay
                  órdenes abiertas ni exposición fuera de rango.
                </p>
              </div>
            )}
          </div>
        </div>

        <aside className="rounded-2xl border border-line bg-panel p-5 shadow-panel">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h3 className="text-base font-semibold">Criterios</h3>
              <p className="mt-1 text-sm text-muted">
                Umbrales actuales del dashboard.
              </p>
            </div>
            <Activity size={20} className="text-muted" aria-hidden="true" />
          </div>
          <dl className="mt-4 grid gap-3 text-sm">
            <div className="rounded-xl border border-line bg-panelSoft p-3">
              <dt className="font-semibold">Snapshot crítico</dt>
              <dd className="mt-1 text-muted">Más de 6 horas o inexistente.</dd>
            </div>
            <div className="rounded-xl border border-line bg-panelSoft p-3">
              <dt className="font-semibold">Snapshot a revisar</dt>
              <dd className="mt-1 text-muted">Más de 2 horas.</dd>
            </div>
            <div className="rounded-xl border border-line bg-panelSoft p-3">
              <dt className="font-semibold">Exposición elevada</dt>
              <dd className="mt-1 text-muted">Gross exposure superior a 170%.</dd>
            </div>
            <div className="rounded-xl border border-line bg-panelSoft p-3">
              <dt className="font-semibold">Drawdown local</dt>
              <dd className="mt-1 text-muted">Caída desde máximo local de 5% o más.</dd>
            </div>
          </dl>
        </aside>
      </section>

      <section className="mt-4 rounded-2xl border border-line bg-panel p-5 shadow-panel">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 className="text-base font-semibold">Estado por estrategia</h3>
            <p className="mt-1 text-sm text-muted">
              Lectura directa de cada cuenta Alpaca vinculada a su estrategia.
            </p>
          </div>
          <StatusBadge label="Alpaca paper" tone="success" />
        </div>

        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[980px] border-collapse text-sm">
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
                <th className="py-2 text-right font-semibold">DD local</th>
                <th className="py-2 text-right font-semibold">Snapshots</th>
                <th className="py-2 font-semibold">Estado</th>
              </tr>
            </thead>
            <tbody>
              {comparison.rows.map((row) => {
                const state = stateForRow(row);
                return (
                  <tr
                    key={row.meta.slug}
                    className="border-b border-line/70 last:border-b-0"
                  >
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
                    <td className="py-3 text-right">{pct(row.localDrawdown)}</td>
                    <td className="py-3 text-right">{row.localSnapshots}</td>
                    <td className="py-3">
                      <StatusBadge label={state.label} tone={state.tone} />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
