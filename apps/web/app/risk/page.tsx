import { ShieldCheck } from "lucide-react";
import { ModulePage } from "@/components/module-page";

export default function RiskPage() {
  return (
    <ModulePage
      eyebrow="Risk"
      title="Risk Center"
      description="Centro de exposición, límites, cash buffer, drawdown, daily loss, kill switch y validaciones pre-trade."
      icon={ShieldCheck}
      items={[
        "Exposición bruta y neta.",
        "Utilización de límites configurados.",
        "Riesgo estimado por posición y total.",
        "Kill switch sin liquidación automática por defecto.",
      ]}
    />
  );
}
