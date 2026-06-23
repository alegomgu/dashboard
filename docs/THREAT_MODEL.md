# Threat Model

## Assets

- Alpaca API key and secret.
- Account state and portfolio data.
- Session cookie.
- Audit trail.
- Order intent payloads in future phases.

## Threats and mitigations

| Threat                        | Mitigation                                                                  |
| ----------------------------- | --------------------------------------------------------------------------- |
| Credential theft from browser | No secrets in client bundle, no `NEXT_PUBLIC_*`, server-only Alpaca client. |
| Secrets committed to Git      | `.env*` ignored, `.env.example` dummy only, CI should add secret scanning.  |
| XSS                           | CSP, React escaping, avoid rendering raw provider HTML.                     |
| CSRF                          | SameSite cookies and origin checks before any mutation.                     |
| Session hijack                | `httpOnly`, `secure`, expiry, admin allowlist.                              |
| Live trading by mistake       | Env validation blocks `live_enabled` and `ENABLE_LIVE_TRADING`.             |
| Replay or double order        | Future idempotent `client_order_id`, reconciliation before retry.           |
| Stale data used for trading   | Freshness timestamps, stale banners, block paper trading on stale quote.    |
| Dependency compromise         | Lockfile, Dependabot/Renovate, audit, small dependency surface.             |
| Unauthorized WebSocket        | Future ephemeral signed token, no Alpaca credentials in browser.            |
