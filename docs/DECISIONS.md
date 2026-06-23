# Decisions

## ADR-001: Monorepo pnpm

Decision: usar monorepo `pnpm` con `apps/web` y paquetes internos.

Rationale: el prompt exige separacion entre UI, cliente Alpaca, dominio y configuracion. `pnpm` ofrece workspaces simples y despliegue compatible con Vercel.

## ADR-002: Fase inicial Vercel puro

Decision: la primera arquitectura funcional usa Next.js App Router en Vercel, REST bajo demanda y polling/manual refresh posterior.

Rationale: Alpaca WebSocket real requiere worker persistente. Vercel Functions tienen duracion maxima por request y devuelven 504 al superar el limite configurado, por lo que no son el lugar adecuado para streams permanentes.

Source: https://vercel.com/docs/functions/limitations

## ADR-003: Paper-first y read-only por defecto

Decision: `ALPACA_ENV=paper` y `TRADING_MODE=read_only` son defaults. No existen rutas de create/cancel/replace order en esta fase.

Rationale: reduce riesgo operativo y satisface el objetivo private + paper-first + long-only sin ejecucion accidental.

## ADR-004: Drizzle sobre Prisma

Decision: Drizzle ORM para fases con persistencia.

Rationale: menor capa runtime, buen encaje con SQL explicito, migraciones revisables y uso serverless con Postgres/Neon. Para Fase 0 se deja SQL inicial y dependencia preparada; la conexion se activa cuando exista `DATABASE_URL` real.

## ADR-005: Lightweight Charts solo en cliente

Decision: usar Lightweight Charts para velas y series financieras en componentes cliente cargados bajo demanda.

Rationale: su documentacion indica que es una libreria client-side y no esta disenada para servidor; por eso no se renderiza desde Server Components.

Source: https://tradingview.github.io/lightweight-charts/docs
