# Architecture

## Fase 1 target

```text
apps/web
  Next.js App Router on Vercel
  Route handlers for health/read-only APIs
  Server Components for account snapshot
packages/alpaca-client
  Typed REST client, Zod validation, no mutations initially
packages/trading-domain
  Risk policies, money-safe calculations, FIFO later
packages/shared
  Env schema, money helpers, common types
packages/ui
  Shared UI primitives later; app-local components until reuse emerges
db
  SQL migrations for snapshots, audit, local watchlists
docs
  Operational and risk documentation
apps/stream-worker
  Phase 6 persistent WebSocket worker placeholder
```

## Runtime flow

```text
Browser
  -> Next.js server route/page
  -> env validation
  -> Alpaca read-only client
  -> Zod DTO validation
  -> internal view model
  -> dashboard UI
```

## Real-time later

Mode A ships first: Vercel + REST + controlled polling. Mode B adds a persistent worker on Railway/Render/Fly for Alpaca WebSockets, tokenized browser access and sanitized events.
