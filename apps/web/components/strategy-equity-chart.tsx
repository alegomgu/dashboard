import type { BenchmarkSeries, StrategyComparisonRow } from "@/lib/strategies";

const colors = ["#0f766e", "#2563eb", "#d97706"];
const benchmarkColor = "#111827";

type StrategyEquityChartProps = {
  rows: StrategyComparisonRow[];
  mode?: "local" | "alpaca";
  title?: string;
  description?: string;
  benchmark?: BenchmarkSeries | null;
};

function pathFor(points: Array<{ x: number; y: number }>) {
  return points
    .map((point, index) => `${index === 0 ? "M" : "L"} ${point.x.toFixed(1)} ${point.y.toFixed(1)}`)
    .join(" ");
}

export function StrategyEquityChart({
  rows,
  mode = "local",
  title = "Evolución normalizada",
  description,
  benchmark,
}: StrategyEquityChartProps) {
  const series = rows
    .map((row, index) => ({
      row,
      key: row.meta.slug,
      label: row.meta.title,
      color: colors[index % colors.length],
      points:
        mode === "alpaca" ? row.alpacaHistory : row.history,
      source:
        mode === "alpaca"
          ? `alpaca ${row.alpacaHistoryPeriod}/${row.alpacaHistoryTimeframe}`
          : row.historySource,
    }))
    .filter((item) => item.points.length >= 2);
  const benchmarkItem =
    benchmark && benchmark.history.length >= 2
      ? {
          key: "benchmark-spy",
          label: benchmark.label,
          color: benchmarkColor,
          points: benchmark.history,
          source: benchmark.source,
          dashed: true,
          benchmark: true,
        }
      : null;
  const chartSeries = benchmarkItem ? [...series, benchmarkItem] : series;

  if (!chartSeries.length) {
    return (
      <div className="flex min-h-[280px] items-center justify-center rounded-2xl border border-dashed border-line bg-panelSoft px-4 text-center text-sm text-muted">
        Sin histórico suficiente todavía. La curva aparecerá cuando Alpaca devuelva portfolio history o se acumulen snapshots.
      </div>
    );
  }

  const allValues = chartSeries.flatMap((item) =>
    item.points.map((point) => point.normalized),
  );
  const allTimestamps = chartSeries.flatMap((item) =>
    item.points.map((point) => point.timestamp),
  );
  const min = Math.min(...allValues, 0);
  const max = Math.max(...allValues, 0);
  const span = Math.max(max - min, 0.01);
  const firstTs = Math.min(...allTimestamps);
  const lastTs = Math.max(...allTimestamps);
  const tsSpan = Math.max(lastTs - firstTs, 1);
  const width = 900;
  const height = 300;
  const padding = { left: 54, right: 18, top: 18, bottom: 34 };
  const innerW = width - padding.left - padding.right;
  const innerH = height - padding.top - padding.bottom;

  return (
    <div className="rounded-2xl border border-line bg-panel p-4 shadow-panel">
      <div className="mb-3">
        <h3 className="text-base font-semibold">{title}</h3>
        {description ? (
          <p className="mt-1 text-sm text-muted">{description}</p>
        ) : null}
      </div>
      <svg viewBox={`0 0 ${width} ${height}`} className="h-auto w-full" role="img" aria-label="Comparativa normalizada de estrategias">
        <line
          x1={padding.left}
          x2={width - padding.right}
          y1={padding.top + (max / span) * innerH}
          y2={padding.top + (max / span) * innerH}
          stroke="#94a3b8"
          strokeDasharray="4 4"
          strokeWidth="1"
        />
        {[0, 0.25, 0.5, 0.75, 1].map((ratio) => {
          const value = max - ratio * span;
          const y = padding.top + ratio * innerH;
          return (
            <g key={ratio}>
              <line x1={padding.left} x2={width - padding.right} y1={y} y2={y} stroke="#e2e8f0" strokeWidth="1" />
              <text x={8} y={y + 4} className="fill-slate-500 text-[11px]">
                {(value * 100).toFixed(1)}%
              </text>
            </g>
          );
        })}
        {chartSeries.map((item) => {
          const points = item.points.map((point) => ({
            x: padding.left + ((point.timestamp - firstTs) / tsSpan) * innerW,
            y: padding.top + ((max - point.normalized) / span) * innerH,
          }));
          return (
            <path
              key={item.key}
              d={pathFor(points)}
              fill="none"
              stroke={item.color}
              strokeWidth={"benchmark" in item && item.benchmark ? "4" : "3"}
              strokeDasharray={"dashed" in item && item.dashed ? "8 6" : undefined}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          );
        })}
      </svg>
      <div className="mt-3 flex flex-wrap gap-3 text-sm">
        {chartSeries.map((item) => (
          <div key={item.key} className="flex items-center gap-2">
            <span
              className={
                "size-3 rounded-full " +
                ("benchmark" in item && item.benchmark
                  ? "ring-2 ring-ink/20"
                  : "")
              }
              style={{ backgroundColor: item.color }}
            />
            <span className="font-medium">{item.label}</span>
            <span className="rounded-full border border-line bg-panelSoft px-2 py-0.5 text-xs uppercase text-muted">
              {item.source}
            </span>
            {"benchmark" in item && item.benchmark ? (
              <span className="rounded-full border border-ink/20 bg-ink px-2 py-0.5 text-xs uppercase text-panel">
                benchmark
              </span>
            ) : null}
          </div>
        ))}
      </div>
    </div>
  );
}
