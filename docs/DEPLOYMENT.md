# Deployment

## Target

- Web: Vercel.
- Database: Neon Postgres through Vercel Marketplace.
- Worker: later phase on Railway, Render, Fly.io or equivalent.

## Vercel notes

- Environment variables are configured outside source code and encrypted at rest on Vercel.
- Changes to environment variables apply to new deployments only.
- Configure `DATABASE_URL` with a serverless Postgres provider such as Neon via Vercel Marketplace.
- Without `DATABASE_URL`, the app falls back to `apps/web/data/account-history.json`, which is only useful for local development. Vercel filesystem writes are not durable storage for this dashboard.
- Snapshot capture does not depend on Vercel Cron in the default deployment. The `Evolución comparada` and `Alertas` pages capture a fresh read-only snapshot when they load, and the UI exposes an `Actualizar snapshot` button.
- The snapshot endpoint remains read-only against Alpaca: it reads account, positions, orders and portfolio history, then writes dashboard history to Postgres.
- `CRON_SECRET` is optional. Use it only if a future deployment enables an external scheduled HTTP GET against `/api/snapshots/capture`.

## Required production environment

Minimum Vercel production variables:

```text
ALPACA_API_KEY
ALPACA_API_SECRET
ALPACA_ENV=paper
ALPACA_DATA_FEED=iex
TRADING_MODE=read_only
ALPACA_DEFAULT_ACCOUNT=alpaca_1
ALPACA_1_NAME
ALPACA_1_API_KEY_ID
ALPACA_1_API_SECRET_KEY
ALPACA_1_BASE_URL=https://paper-api.alpaca.markets
ALPACA_2_NAME
ALPACA_2_API_KEY_ID
ALPACA_2_API_SECRET_KEY
ALPACA_2_BASE_URL=https://paper-api.alpaca.markets
ALPACA_3_NAME
ALPACA_3_API_KEY_ID
ALPACA_3_API_SECRET_KEY
ALPACA_3_BASE_URL=https://paper-api.alpaca.markets
AUTH_SECRET
ADMIN_EMAIL
ADMIN_PASSWORD_HASH
ALLOWED_EMAILS
DATABASE_URL
ENABLE_TRADING=false
ENABLE_LIVE_TRADING=false
```

Optional automation variable:

```text
CRON_SECRET
```

Sources:

- https://vercel.com/docs/environment-variables
- https://vercel.com/docs/postgres
