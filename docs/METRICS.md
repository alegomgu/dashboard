# Metrics

## Financial precision

- Monetary values use strings from Alpaca DTOs and Decimal-backed helpers.
- Store raw provider values in JSONB alongside normalized numeric columns.
- UTC for storage.
- UI primary locale: `Europe/Madrid`.
- Market context: also show `America/New_York`.

## Performance metrics later

- Equity curve.
- Cash curve.
- Daily P&L.
- Realized and unrealized P&L separately.
- Drawdown and current drawdown.
- Exposure.
- Sharpe, Sortino and CAGR only when sample size is sufficient.

No metric is a guarantee of future profitability.
