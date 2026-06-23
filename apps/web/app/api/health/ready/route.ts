import { NextResponse } from "next/server";
import { getServerEnv } from "@/lib/env";

export const dynamic = "force-dynamic";

export function GET() {
  const env = getServerEnv();

  return NextResponse.json({
    ok: true,
    service: "web",
    check: "ready",
    alpacaEnv: env.ALPACA_ENV,
    tradingMode: env.TRADING_MODE,
    dataFeed: env.ALPACA_DATA_FEED,
    timestamp: new Date().toISOString(),
  });
}
