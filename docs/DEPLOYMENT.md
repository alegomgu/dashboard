# Deployment

## Target

- Web: Vercel.
- Database: Neon Postgres through Vercel Marketplace.
- Worker: later phase on Railway, Render, Fly.io or equivalent.

## Vercel notes

- Environment variables are configured outside source code and encrypted at rest on Vercel.
- Changes to environment variables apply to new deployments only.
- Vercel Cron triggers HTTP GET requests to production deployment paths from `vercel.json`; cron timezone is UTC.
- The snapshot cron is configured in `vercel.json`:

```json
{
  "path": "/api/snapshots/capture",
  "schedule": "*/15 * * * *"
}
```

- Configure `CRON_SECRET` in Vercel. Vercel sends it as `Authorization: Bearer <CRON_SECRET>` when invoking the cron endpoint.
- Configure `DATABASE_URL` with a serverless Postgres provider such as Neon via Vercel Marketplace.
- Without `DATABASE_URL`, the app falls back to `apps/web/data/account-history.json`, which is only useful for local development. Vercel filesystem writes are not durable storage for this dashboard.
- The snapshot endpoint remains read-only against Alpaca: it reads account, positions, orders and portfolio history, then writes dashboard history to Postgres.

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
CRON_SECRET
ENABLE_TRADING=false
ENABLE_LIVE_TRADING=false
```

Sources:

- https://vercel.com/docs/environment-variables
- https://vercel.com/docs/cron-jobs
- https://vercel.com/docs/postgres
