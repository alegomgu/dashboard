import { BookOpen } from "lucide-react";
import { ModulePage } from "@/components/module-page";

export default function JournalPage() {
  return (
    <ModulePage
      eyebrow="Journal"
      title="Diario de trading"
      description="Reconstrucción FIFO de operaciones desde fills, notas, setups, tags, MFE, MAE y exportación."
      icon={BookOpen}
      items={[
        "Agrupación de fills en trades.",
        "Metodología FIFO documentada.",
        "Tags, notas y lecciones aprendidas.",
        "Métricas por setup cuando haya muestra suficiente.",
      ]}
    />
  );
}
