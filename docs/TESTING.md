# Testing

## Current status

Checks pass with local Node 22.23.0 installed in `.tools/`.

## Required checks

- `pnpm lint`
- `pnpm typecheck`
- `pnpm test`
- `pnpm build`
- `pnpm format`

## Priority unit tests

- Env validation.
- Alpaca DTO parsing.
- Money helpers.
- Read-only policy.
- Future risk engine and FIFO reconstruction.
