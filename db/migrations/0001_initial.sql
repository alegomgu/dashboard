CREATE TABLE account_snapshots (
  id BIGSERIAL PRIMARY KEY,
  captured_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  alpaca_account_id TEXT NOT NULL,
  status TEXT NOT NULL,
  currency TEXT NOT NULL,
  cash NUMERIC(20, 6) NOT NULL,
  equity NUMERIC(20, 6) NOT NULL,
  portfolio_value NUMERIC(20, 6) NOT NULL,
  buying_power NUMERIC(20, 6) NOT NULL,
  long_market_value NUMERIC(20, 6) NOT NULL,
  short_market_value NUMERIC(20, 6) NOT NULL,
  raw JSONB NOT NULL
);

CREATE TABLE audit_events (
  id BIGSERIAL PRIMARY KEY,
  occurred_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  actor_email TEXT NOT NULL,
  action TEXT NOT NULL,
  correlation_id TEXT NOT NULL,
  severity TEXT NOT NULL,
  payload JSONB NOT NULL
);

CREATE TABLE local_watchlists (
  id BIGSERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE local_watchlist_items (
  id BIGSERIAL PRIMARY KEY,
  watchlist_id BIGINT NOT NULL REFERENCES local_watchlists(id) ON DELETE CASCADE,
  symbol TEXT NOT NULL,
  notes TEXT NOT NULL DEFAULT '',
  sort_order INTEGER NOT NULL DEFAULT 0,
  UNIQUE (watchlist_id, symbol)
);
