# Runbook

## Local readiness

1. Confirm Node 22+ and pnpm 10+.
2. Run `pnpm install`.
3. Fill `.env.local`.
4. Keep `TRADING_MODE=read_only`.
5. Run `pnpm dev`.
6. Check `/api/health/live` and `/api/health/ready`.

## Alpaca outage

- Dashboard should show recoverable read error.
- Do not retry financial mutations blindly.
- Keep last known good snapshots once persistence is enabled.

## Live protection

If `ENABLE_LIVE_TRADING` is accidentally set, app startup must fail.
