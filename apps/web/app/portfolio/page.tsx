import { BriefcaseBusiness } from "lucide-react";
import { ModulePage } from "@/components/module-page";

export default function PortfolioPage() {
  return (
    <ModulePage
      eyebrow="Portfolio"
      title="Rendimiento y exposición"
      description="Vista preparada para equity curve, cash, benchmarks, drawdown y retornos ajustados por flujos externos."
      icon={BriefcaseBusiness}
      items={[
        "Curva de equity y cash por rangos.",
        "Drawdown actual y máximo documentado.",
        "Distribución por símbolo y concentración top 1/3/5.",
        "Exportación CSV sin mezclar depósitos con rentabilidad.",
      ]}
    />
  );
}
