import { z } from "zod";

export const tradingModeSchema = z.enum([
  "read_only",
  "paper_enabled",
  "live_locked",
  "live_enabled",
]);

export const alpacaEnvSchema = z.enum(["paper", "live"]);

const booleanFromEnv = z
  .enum(["true", "false"])
  .default("false")
  .transform((value) => value === "true");

const optionalSecret = z.string().optional().default("");

export const serverEnvSchema = z.object({
  ALPACA_API_KEY: z.string().min(1),
  ALPACA_API_SECRET: z.string().min(1),
  ALPACA_ENV: alpacaEnvSchema.default("paper"),
  ALPACA_DATA_FEED: z.enum(["iex", "sip", "delayed_sip"]).default("iex"),
  TRADING_MODE: tradingModeSchema.default("read_only"),
  AUTH_SECRET: z.string().min(32),
  ADMIN_EMAIL: z.string().email(),
  ADMIN_PASSWORD_HASH: z.string().min(1),
  ALLOWED_EMAILS: z.string().min(1),
  DATABASE_URL: z.string().url().optional(),
  CRON_SECRET: optionalSecret,
  RISK_MAX_POSITION_PCT: z.coerce.number().positive().default(25),
  RISK_MAX_TOTAL_EXPOSURE_PCT: z.coerce.number().positive().default(100),
  RISK_MAX_RISK_PER_TRADE_PCT: z.coerce.number().positive().default(0.5),
  RISK_MAX_DAILY_LOSS_PCT: z.coerce.number().positive().default(2),
  RISK_MAX_OPEN_POSITIONS: z.coerce.number().int().positive().default(8),
  RISK_ALLOW_SHORTS: booleanFromEnv,
  RISK_ALLOW_OPTIONS: booleanFromEnv,
  RISK_ALLOW_CRYPTO: booleanFromEnv,
  RISK_ALLOW_EXTENDED_HOURS: booleanFromEnv,
  RISK_ALLOW_OVERNIGHT: booleanFromEnv,
  ENABLE_TRADING: booleanFromEnv,
  ENABLE_LIVE_VIEW: booleanFromEnv,
  ENABLE_LIVE_TRADING: booleanFromEnv,
  ENABLE_REALTIME_WORKER: booleanFromEnv,
  ENABLE_NEWS: booleanFromEnv,
  ENABLE_SCREENERS: booleanFromEnv,
  ENABLE_JOURNAL: booleanFromEnv,
  ENABLE_EODHD: booleanFromEnv,
  ENABLE_TELEGRAM: booleanFromEnv,
  ENABLE_OPTIONS: booleanFromEnv,
  ENABLE_CRYPTO: booleanFromEnv,
  ENABLE_SHORTS: booleanFromEnv,
  ENABLE_EXTENDED_HOURS: booleanFromEnv,
  ENABLE_STRATEGY_LAB: booleanFromEnv,
  TELEGRAM_BOT_TOKEN: optionalSecret,
  TELEGRAM_CHAT_ID: optionalSecret,
  EODHD_API_KEY: optionalSecret,
});

export type ServerEnv = z.infer<typeof serverEnvSchema>;
export type TradingMode = z.infer<typeof tradingModeSchema>;
export type AlpacaEnv = z.infer<typeof alpacaEnvSchema>;

export function parseServerEnv(
  input: Record<string, string | undefined>,
): ServerEnv {
  const parsed = serverEnvSchema.safeParse(input);

  if (!parsed.success) {
    const issues = parsed.error.issues
      .map((issue) => issue.path.join("."))
      .join(", ");
    throw new Error(`Invalid server environment: ${issues}`);
  }

  const env = parsed.data;

  if (env.ENABLE_LIVE_TRADING || env.TRADING_MODE === "live_enabled") {
    throw new Error(
      "Live trading is not implemented or allowed in this release.",
    );
  }

  if (env.ALPACA_ENV === "live" && env.TRADING_MODE !== "live_locked") {
    throw new Error(
      "Live account visibility requires TRADING_MODE=live_locked.",
    );
  }

  if (env.ENABLE_TRADING && env.TRADING_MODE === "read_only") {
    throw new Error(
      "ENABLE_TRADING cannot be true while TRADING_MODE=read_only.",
    );
  }

  return env;
}
