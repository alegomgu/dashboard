# Alpaca Trading Command Center

Dashboard privado, paper-first y single-user para Alpaca. La primera base queda orientada a modo `read_only`: consulta cuenta, reloj de mercado, posiciones y ordenes abiertas desde servidor, sin rutas de mutacion financiera.

## Estado

- Fase 0 documentada.
- Base de Fase 1 preparada en monorepo `pnpm`.
- Toolchain local creado en `.tools/` con Node 22.23.0 y pnpm 10.13.1.
- `.venv/` creado para tooling Python y futuro worker.
- `format`, `lint`, `typecheck`, `test` y `build` verificados en local.

## Arranque local previsto

1. Usa Node 22+ y pnpm 10+. En este workspace ya existe Node local:
   `export PATH="$PWD/.tools/node-v22.23.0-darwin-arm64/bin:$PATH"`
2. Ejecuta `pnpm install`.
3. Copia `.env.example` a `.env.local` y rellena valores reales server-side.
4. Mantén `ALPACA_ENV=paper` y `TRADING_MODE=read_only`.
5. Ejecuta `pnpm dev`.
6. Abre `http://localhost:3000/dashboard`.

## Scripts

- `pnpm lint`
- `pnpm typecheck`
- `pnpm test`
- `pnpm build`
- `pnpm format`

## Seguridad

Nunca uses variables `NEXT_PUBLIC_*` para credenciales Alpaca. `.env*` esta ignorado salvo `.env.example`. La validacion de entorno bloquea `live_enabled` y `ENABLE_LIVE_TRADING` en esta release.
