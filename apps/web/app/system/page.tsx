import { getServerEnv } from "@/lib/env";

export const dynamic = "force-dynamic";

export default function SystemPage() {
  const env = getServerEnv();

  return (
    <div className="mx-auto max-w-5xl px-5 py-6">
      <p className="text-sm font-semibold uppercase text-muted">System</p>
      <h2 className="mt-1 text-3xl font-semibold">Estado del sistema</h2>
      <section className="mt-5 border border-line bg-panel p-4">
        <dl className="grid gap-3 text-sm md:grid-cols-2">
          <div>
            <dt className="text-muted">Alpaca env</dt>
            <dd>{env.ALPACA_ENV}</dd>
          </div>
          <div>
            <dt className="text-muted">Trading mode</dt>
            <dd>{env.TRADING_MODE}</dd>
          </div>
          <div>
            <dt className="text-muted">Data feed</dt>
            <dd>{env.ALPACA_DATA_FEED}</dd>
          </div>
          <div>
            <dt className="text-muted">Live trading</dt>
            <dd>
              {env.ENABLE_LIVE_TRADING
                ? "bloqueado por arranque seguro"
                : "desactivado"}
            </dd>
          </div>
        </dl>
      </section>
    </div>
  );
}
