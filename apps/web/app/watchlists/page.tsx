import { Radar } from "lucide-react";
import { ModulePage } from "@/components/module-page";

export default function WatchlistsPage() {
  return (
    <ModulePage
      eyebrow="Watchlists"
      title="Watchlists locales y Alpaca"
      description="Gestión de listas, símbolos, notas, tags, alertas y columnas configurables con datos de mercado."
      icon={Radar}
      items={[
        "Sincronización con watchlists Alpaca.",
        "Watchlists locales con metadata adicional.",
        "Sparklines y noticias por símbolo.",
        "Alertas no realtime antes del worker.",
      ]}
    />
  );
}
