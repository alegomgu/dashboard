import Link from "next/link";
import { ArrowRight, BarChart3, ScrollText } from "lucide-react";
import { MarkdownLite } from "@/components/markdown-lite";
import { StatusBadge } from "@/components/status-badge";
import { getStrategyDocs } from "@/lib/strategies";

export const dynamic = "force-dynamic";

const toneClasses = {
  teal: "border-teal-200 bg-teal-50 text-teal-800",
  blue: "border-blue-200 bg-blue-50 text-blue-800",
  amber: "border-amber-200 bg-amber-50 text-amber-900",
};

export default async function StrategiesPage() {
  const docs = await getStrategyDocs();

  return (
    <div className="min-w-0 w-full overflow-hidden px-4 py-4 sm:px-6 lg:px-8 lg:py-7">
      <header className="min-w-0 rounded-3xl border border-line bg-panel p-5 shadow-panel lg:p-6">
        <div className="flex min-w-0 flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
          <div className="min-w-0">
            <div className="flex items-center gap-3">
              <div className="flex size-12 items-center justify-center rounded-2xl bg-accentSoft text-accent">
                <ScrollText size={21} aria-hidden="true" />
              </div>
              <div>
                <p className="text-xs font-semibold uppercase text-muted">
                  Strategy Library
                </p>
                <h2 className="mt-1 text-2xl font-semibold tracking-normal sm:text-3xl">
                  Estrategias monitorizadas
                </h2>
              </div>
            </div>
            <p className="mt-4 max-w-3xl text-sm leading-6 text-muted">
              Fichas operativas autocontenidas para entender qué hace cada bot,
              qué universo usa, cómo entra/sale y qué riesgos conviene mirar.
            </p>
          </div>
          <Link
            href="/strategies/compare"
            className="inline-flex h-11 shrink-0 items-center justify-center gap-2 rounded-xl bg-ink px-4 text-sm font-semibold text-panel shadow-sm"
          >
            <BarChart3 size={17} aria-hidden="true" />
            Comparar evolución
          </Link>
        </div>
      </header>

      <section className="mt-4 grid gap-4 lg:grid-cols-3">
        {docs.map((doc) => (
          <a
            key={doc.slug}
            href={`#${doc.slug}`}
            className={`min-w-0 rounded-2xl border p-5 shadow-sm ${toneClasses[doc.tone]}`}
          >
            <p className="text-xs font-bold uppercase tracking-[0.12em] opacity-70">
              {doc.shortName}
            </p>
            <h3 className="mt-2 text-lg font-semibold">{doc.title}</h3>
            <p className="mt-3 text-sm leading-6 opacity-85">{doc.summary}</p>
            <span className="mt-4 inline-flex items-center gap-2 text-sm font-semibold">
              Ver ficha <ArrowRight size={15} aria-hidden="true" />
            </span>
          </a>
        ))}
      </section>

      <section className="mt-4 grid gap-4">
        {docs.map((doc) => (
          <article
            id={doc.slug}
            key={doc.slug}
            className="min-w-0 scroll-mt-6 overflow-hidden rounded-2xl border border-line bg-panel p-5 shadow-panel lg:p-6"
          >
            <div className="flex min-w-0 flex-col gap-3 border-b border-line pb-4 sm:flex-row sm:items-start sm:justify-between">
              <div className="min-w-0">
                <p className="text-xs font-semibold uppercase text-muted [overflow-wrap:anywhere]">
                  {doc.fileName}
                </p>
                <h3 className="mt-1 text-xl font-semibold [overflow-wrap:anywhere]">{doc.title}</h3>
              </div>
              <div className="flex shrink-0 flex-wrap gap-2">
                <StatusBadge label={doc.shortName} tone="neutral" />
                <StatusBadge label="Read only" tone="success" />
              </div>
            </div>
            <div className="mt-4 min-w-0">
              <MarkdownLite markdown={doc.markdown} />
            </div>
          </article>
        ))}
      </section>
    </div>
  );
}
