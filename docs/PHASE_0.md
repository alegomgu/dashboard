# Phase 0 - Discovery and Design

## Contract

FASE: 0 - Discovery y diseno.

OBJETIVO: definir una arquitectura segura y verificable para un dashboard Alpaca Paper privado, single-user y read-only por defecto.

ARCHIVOS A INSPECCIONAR: `prompt_maestro_alpaca_trading_dashboard.md`, documentacion oficial Alpaca, Vercel, Next.js App Router y Lightweight Charts.

CAMBIOS PROPUESTOS: documentacion base, monorepo scaffold, env validation, cliente Alpaca read-only, health checks y dashboard minimo, sin mutaciones financieras.

RIESGOS: entorno local sin Node/pnpm; versiones de paquetes deben instalarse y validarse; Auth.js todavia no esta implementado; no se han probado credenciales reales.

PRUEBAS: inspeccion de repo, comprobacion de herramientas, validacion JSON, busqueda de rutas de mutacion. Lint/typecheck/tests/build quedan bloqueados por falta de Node.

CRITERIO DE CIERRE: decisiones registradas, endpoints mapeados, variables definidas, amenazas identificadas y base de Fase 1 lista para instalar dependencias.

## Repository inspection

Estado inicial: solo existia `prompt_maestro_alpaca_trading_dashboard.md`; no habia `.git` inicializado en este directorio y no habia aplicacion previa.

Herramientas comprobadas:

- `node`: no disponible en `PATH`.
- `npm`: no disponible en `PATH`.
- `pnpm`: no disponible en `PATH`.
- `python3`: disponible para validacion JSON.

## Official documentation reviewed

- Alpaca Trading API: `https://docs.alpaca.markets/us/docs/trading-api`
- Alpaca Paper Trading: `https://docs.alpaca.markets/us/docs/paper-trading.md`
- Alpaca Market Data and streams: `https://docs.alpaca.markets/us/docs/real-time-stock-pricing-data`
- Alpaca docs index for agents: `https://docs.alpaca.markets/llms.txt`
- Vercel Functions limits: `https://vercel.com/docs/functions/limitations`
- Vercel Cron Jobs: `https://vercel.com/docs/cron-jobs`
- Vercel Environment Variables: `https://vercel.com/docs/environment-variables`
- Next.js App Router: `https://nextjs.org/docs/app`
- Lightweight Charts: `https://tradingview.github.io/lightweight-charts/docs`

## Definitive architecture for the first operating version

```text
Browser
  -> Next.js App Router on Vercel
  -> Server-side env validation
  -> Alpaca read-only client
  -> Zod DTO validation
  -> domain/view model
  -> dashboard UI
```

The first realtime model is not continuous streaming. It is Vercel REST plus manual refresh and later controlled polling. True WebSockets move to a persistent worker in Phase 6.

## Folder tree

```text
/
├─ apps/web
├─ packages/alpaca-client
├─ packages/trading-domain
├─ packages/shared
├─ packages/config
├─ db/migrations
├─ docs
├─ tests
└─ .github/workflows
```

## Dependencies and justification

| Dependency             | Reason                                                                       |
| ---------------------- | ---------------------------------------------------------------------------- |
| Next.js                | App Router, Vercel-native deployment, route handlers and server components.  |
| React                  | UI runtime required by Next.js.                                              |
| TypeScript             | Strict contracts for financial and API boundaries.                           |
| Zod                    | Runtime validation for env and Alpaca DTOs.                                  |
| decimal.js             | Avoid naive monetary arithmetic with `number`.                               |
| Tailwind CSS           | Fast, consistent layout styling without a heavier component framework yet.   |
| Auth.js / next-auth    | Planned single-admin authentication. Not fully wired in this first scaffold. |
| Drizzle ORM + postgres | Serverless-friendly Postgres access and explicit SQL migrations.             |
| TanStack Query         | Later client-side caching/polling for interactive read-only screens.         |
| TanStack Table         | Later positions/orders tables with sorting/filtering.                        |
| Lightweight Charts     | Financial charts; client-only per official guidance.                         |
| Recharts               | Non-financial analytics charts later.                                        |
| Vitest                 | Unit tests for env, mappers, money and risk.                                 |
| Playwright             | E2E tests later.                                                             |
| ESLint/Prettier        | Code quality and formatting.                                                 |

## Environment variables

Required for first Alpaca read:

- `ALPACA_API_KEY`
- `ALPACA_API_SECRET`
- `ALPACA_ENV=paper`
- `ALPACA_DATA_FEED=iex`
- `TRADING_MODE=read_only`
- `AUTH_SECRET`
- `ADMIN_EMAIL`
- `ADMIN_PASSWORD_HASH`
- `ALLOWED_EMAILS`

Optional or later:

- `DATABASE_URL`
- `CRON_SECRET`
- `TELEGRAM_BOT_TOKEN`
- `TELEGRAM_CHAT_ID`
- `EODHD_API_KEY`
- feature flags in `.env.example`

## Initial data model

Tables introduced in `db/migrations/0001_initial.sql`:

- `account_snapshots`
- `audit_events`
- `local_watchlists`
- `local_watchlist_items`

The database is not the source of truth for Alpaca account/order state. It stores snapshots, local metadata and audit records.

## Endpoint map

Internal:

- `GET /api/health/live`
- `GET /api/health/ready`

External Alpaca read-only used in Phase 1 scaffold:

- `GET /v2/account`
- `GET /v2/clock`
- `GET /v2/positions`
- `GET /v2/orders?status=open`

External Alpaca planned:

- account activities, portfolio history, assets, market data bars, snapshots, news, movers, corporate actions, watchlists and streams.

## Textual wireframe

Dashboard:

- Permanent status badges: PAPER/LIVE, READ ONLY/TRADING ENABLED, feed, market state.
- Main metrics: equity, cash, buying power, portfolio value.
- Account panel: status, long/short market value, day trade count.
- Market panel: current timestamp, next open, next close.
- Activity panel: positions, open orders, freshness timestamp.

## Phase plan

1. Foundation: install dependencies, auth, database adapter, CI, health checks, Alpaca connection.
2. Portfolio/positions/orders read-only.
3. Market workspace and charts.
4. Protected paper trading.
5. Analytics and journal.
6. Hybrid realtime worker.
7. Alerts and optional providers.
8. Hardening and production.
9. Live readiness without activation.
10. Strategy lab only after the core is stable.

## Risks

- Runtime not validated until Node/pnpm are installed.
- Auth is dependency-planned but not wired yet.
- Vercel preview cannot be proven from this local environment.
- Alpaca plan restrictions for feed/news/screeners must be checked against the actual account.
- Package versions may need small adjustment after real install.

## Close criteria

- Docs present and coherent.
- No secrets committed.
- No order mutation route present.
- Read-only defaults enforced at env validation.
- Next app scaffold exists.
- Health routes exist.
- Dashboard can attempt server-side Alpaca reads once dependencies and env are available.
