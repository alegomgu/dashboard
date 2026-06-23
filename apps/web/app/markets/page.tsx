import { CandlestickChart } from "lucide-react";
import { ModulePage } from "@/components/module-page";

export default function MarketsPage() {
  return (
    <ModulePage
      eyebrow="Markets"
      title="Mercado y símbolos"
      description="Workspace para reloj de mercado, movers, most active, noticias, screener y gráficos con Lightweight Charts."
      icon={CandlestickChart}
      items={[
        "Market clock y principales benchmarks.",
        "Top gainers, losers y most active según plan.",
        "Detalle de símbolo con candles e indicadores.",
        "Feed y frescura visibles en cada bloque.",
      ]}
    />
  );
}
