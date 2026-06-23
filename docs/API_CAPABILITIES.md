# API Capabilities

Fuentes revisadas: documentacion oficial Alpaca US y paginas Markdown enlazadas desde `https://docs.alpaca.markets/llms.txt`.

## Trading API read-only inicial

| Capability                  | Endpoint                            | Fase | Cache                 | Notas                                                                             |
| --------------------------- | ----------------------------------- | ---- | --------------------- | --------------------------------------------------------------------------------- |
| Account                     | `GET /v2/account`                   | 1    | no-store inicialmente | Fuente de verdad de equity, cash, buying power y estado.                          |
| Market clock                | `GET /v2/clock`                     | 1    | 15-60s posterior      | Muestra mercado abierto/cerrado y proximas aperturas/cierres.                     |
| Positions                   | `GET /v2/positions`                 | 1/2  | 15-60s posterior      | Solo lectura.                                                                     |
| Orders                      | `GET /v2/orders?status=open`        | 1/2  | 15-60s posterior      | Solo lectura.                                                                     |
| Account activities          | `GET /v2/account/activities`        | 2    | paginado              | La doc indica paginacion con `page_token`, `page_size` y direccion.               |
| Assets                      | `GET /v2/assets`                    | 3    | diaria                | Validacion de `tradable`, `fractionable`, `shortable` solo informativa al inicio. |
| Portfolio history           | `GET /v2/account/portfolio/history` | 2    | por rango             | No mezclar con depositos/retiros como retorno.                                    |
| Create/replace/cancel order | `POST/PATCH/DELETE /v2/orders`      | 4    | nunca cache           | No implementado en Fase 1. Requiere `paper_enabled`, idempotencia y auditoria.    |

## Market Data

| Capability              | Endpoint/stream                                     | Fase | Feed                                    |
| ----------------------- | --------------------------------------------------- | ---- | --------------------------------------- |
| Historical bars         | `/v2/stocks/bars` y single symbol                   | 3    | `iex`, `sip` o `delayed_sip` segun plan |
| Latest bars             | `/v2/stocks/bars/latest`                            | 3    | depende de plan                         |
| Trades/quotes/snapshots | endpoints stocks v2                                 | 3    | depende de plan                         |
| News                    | news API                                            | 3/7  | plan-dependent                          |
| Movers/most active      | screeners Alpaca                                    | 3    | plan-dependent                          |
| Corporate actions       | corporate actions API                               | 3/7  | puede tener retrasos de proveedor       |
| Stock stream            | `wss://stream.data.alpaca.markets/{version}/{feed}` | 6    | `v2/iex`, `v2/sip`, `v2/delayed_sip`    |

Notas oficiales relevantes:

- Paper trading es gratis y disponible para usuarios Alpaca; es un entorno de simulacion en tiempo real.
- El stream de stock usa `wss://stream.data.alpaca.markets/{version}/{feed}` y autenticacion falla si el feed no esta en la suscripcion.
- Feeds documentados incluyen `v2/sip`, `v2/iex`, `v2/delayed_sip`, BOATS y overnight.

Sources:

- https://docs.alpaca.markets/us/docs/trading-api
- https://docs.alpaca.markets/us/docs/real-time-stock-pricing-data
- https://docs.alpaca.markets/us/docs/paper-trading.md
