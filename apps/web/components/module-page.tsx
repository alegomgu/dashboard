import type { LucideIcon } from "lucide-react";
import { LockKeyhole, ShieldCheck } from "lucide-react";
import { StatusBadge } from "./status-badge";

type ModulePageProps = {
  eyebrow: string;
  title: string;
  description: string;
  icon: LucideIcon;
  items: string[];
  status?: string;
};

export function ModulePage({
  eyebrow,
  title,
  description,
  icon: Icon,
  items,
  status = "Read only",
}: ModulePageProps) {
  return (
    <div className="w-full px-4 py-4 sm:px-6 lg:px-8 lg:py-7">
      <section className="rounded-3xl border border-line bg-panel p-5 shadow-panel lg:p-6">
        <div className="flex flex-col gap-5 md:flex-row md:items-start md:justify-between">
          <div className="min-w-0">
            <div className="flex items-center gap-3">
              <div className="flex size-12 items-center justify-center rounded-2xl bg-accentSoft text-accent">
                <Icon size={20} aria-hidden="true" />
              </div>
              <div>
                <p className="text-xs font-semibold uppercase text-muted">
                  {eyebrow}
                </p>
                <h2 className="mt-1 text-2xl font-semibold tracking-normal sm:text-3xl">
                  {title}
                </h2>
              </div>
            </div>
            <p className="mt-4 max-w-3xl text-sm leading-6 text-muted">
              {description}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <StatusBadge label={status} tone="success" />
            <StatusBadge label="Paper" tone="success" />
          </div>
        </div>
      </section>

      <section className="mt-4 grid gap-4 lg:grid-cols-[minmax(0,1fr)_340px]">
        <div className="rounded-2xl border border-line bg-panel p-5 shadow-panel">
          <h3 className="text-base font-semibold">Alcance de la fase</h3>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {items.map((item) => (
              <div
                key={item}
                className="flex min-h-[84px] items-start gap-3 rounded-xl border border-line bg-panelSoft p-4"
              >
                <ShieldCheck
                  size={17}
                  className="mt-0.5 shrink-0 text-positive"
                  aria-hidden="true"
                />
                <p className="text-sm leading-5">{item}</p>
              </div>
            ))}
          </div>
        </div>
        <aside className="rounded-2xl border border-line bg-panel p-5 shadow-panel">
          <div className="flex items-center gap-3">
            <LockKeyhole size={18} className="text-muted" aria-hidden="true" />
            <h3 className="text-base font-semibold">Guardrails</h3>
          </div>
          <dl className="mt-4 grid gap-3 text-sm">
            <div className="flex justify-between gap-4 border-b border-line pb-2">
              <dt className="text-muted">Trading</dt>
              <dd className="font-semibold">Bloqueado</dd>
            </div>
            <div className="flex justify-between gap-4 border-b border-line pb-2">
              <dt className="text-muted">Live</dt>
              <dd className="font-semibold">No implementado</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-muted">Credenciales</dt>
              <dd className="font-semibold">Servidor</dd>
            </div>
          </dl>
        </aside>
      </section>
    </div>
  );
}
