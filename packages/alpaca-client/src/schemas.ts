import { z } from "zod";

export const accountSchema = z.object({
  id: z.string(),
  account_number: z.string().optional(),
  status: z.string(),
  currency: z.string(),
  cash: z.string(),
  portfolio_value: z.string(),
  equity: z.string(),
  buying_power: z.string(),
  long_market_value: z.string(),
  short_market_value: z.string(),
  daytrade_count: z.number().optional(),
  pattern_day_trader: z.boolean().optional(),
  trading_blocked: z.boolean().optional(),
  transfers_blocked: z.boolean().optional(),
  account_blocked: z.boolean().optional(),
  created_at: z.string().optional(),
});

export const clockSchema = z.object({
  timestamp: z.string(),
  is_open: z.boolean(),
  next_open: z.string(),
  next_close: z.string(),
});

export const positionSchema = z.object({
  asset_id: z.string(),
  symbol: z.string(),
  exchange: z.string(),
  asset_class: z.string(),
  qty: z.string(),
  side: z.string(),
  market_value: z.string(),
  cost_basis: z.string(),
  unrealized_pl: z.string(),
  unrealized_plpc: z.string(),
  current_price: z.string().optional(),
  lastday_price: z.string().optional(),
  change_today: z.string().optional(),
});

export const orderSchema = z.object({
  id: z.string(),
  client_order_id: z.string(),
  created_at: z.string(),
  updated_at: z.string().nullable().optional(),
  submitted_at: z.string().nullable().optional(),
  filled_at: z.string().nullable().optional(),
  canceled_at: z.string().nullable().optional(),
  expired_at: z.string().nullable().optional(),
  symbol: z.string(),
  asset_class: z.string().optional(),
  qty: z.string().nullable().optional(),
  filled_qty: z.string(),
  type: z.string(),
  side: z.string(),
  time_in_force: z.string(),
  limit_price: z.string().nullable().optional(),
  stop_price: z.string().nullable().optional(),
  status: z.string(),
  extended_hours: z.boolean().optional(),
});

export const portfolioHistorySchema = z.object({
  timestamp: z.array(z.number()).optional(),
  equity: z.array(z.number()).optional(),
  profit_loss: z.array(z.number()).optional(),
  profit_loss_pct: z.array(z.number()).optional(),
  base_value: z.number().optional(),
  timeframe: z.string().optional(),
});

export const stockBarSchema = z.object({
  t: z.string(),
  o: z.number(),
  h: z.number(),
  l: z.number(),
  c: z.number(),
  v: z.number().optional(),
  vw: z.number().optional(),
  n: z.number().optional(),
});

export const stockBarsResponseSchema = z.object({
  bars: z.array(stockBarSchema).optional(),
  next_page_token: z.string().nullable().optional(),
});

export type AlpacaAccountDto = z.infer<typeof accountSchema>;
export type AlpacaClockDto = z.infer<typeof clockSchema>;
export type AlpacaPositionDto = z.infer<typeof positionSchema>;
export type AlpacaOrderDto = z.infer<typeof orderSchema>;
export type AlpacaPortfolioHistoryDto = z.infer<typeof portfolioHistorySchema>;
export type AlpacaStockBarDto = z.infer<typeof stockBarSchema>;
