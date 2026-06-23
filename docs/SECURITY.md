# Security

## Credential policy

- Alpaca keys only live in server-side environment variables.
- No Alpaca key may use `NEXT_PUBLIC_*`.
- `.env*` is ignored, with `.env.example` as the only committed env file.
- Health checks expose only non-sensitive mode metadata.
- Logs must omit API keys, auth headers, cookies and raw credential payloads.

## Current guardrails

- `TRADING_MODE=read_only` default.
- `ENABLE_LIVE_TRADING=true` fails env validation.
- `TRADING_MODE=live_enabled` fails env validation.
- `ALPACA_ENV=live` is allowed only with `TRADING_MODE=live_locked`.
- No order mutation route exists in the current web app.

## Required before paper trading

- Auth.js single-admin login.
- CSRF/origin checks for mutations.
- Rate limiting on login and sensitive routes.
- Audit record for each sensitive action.
- Idempotent `client_order_id`.
- Confirmations for paper order submit/cancel/replace.
