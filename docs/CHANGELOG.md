# Changelog

## 0.1.0

- Added Fase 0 documentation.
- Added monorepo foundation for Fase 1.
- Added read-only Alpaca REST client scaffold.
- Added Next.js dashboard and health checks.
- Redesigned the web shell and dashboard with a responsive command-center layout.
- Added navigable module pages for portfolio, positions, orders, markets, watchlists, risk, alerts and journal.
- Added Playwright dependency and verified desktop/mobile screenshots against localhost.
- Added real read-only Positions and Orders screens backed by the Alpaca client.
- Added order query option coverage for `status=all` and custom limits.
- Added four-account Alpaca Paper configuration and safe account switching across the app.
- Updated CSP headers so the Next.js app hydrates while keeping paper/read-only guardrails.
