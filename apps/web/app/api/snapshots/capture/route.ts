import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getHistoryHealth, readHistoryFile } from "@/lib/account-history";
import { getStrategyComparison } from "@/lib/strategies";

export const dynamic = "force-dynamic";

async function captureSnapshot() {
  const comparison = await getStrategyComparison();
  const history = await readHistoryFile();
  const health = getHistoryHealth(history);

  return {
    ok: comparison.rows.every((row) => !row.error),
    mode: "read_only_snapshot_capture",
    generatedAtUtc: comparison.generatedAtUtc,
    rows: comparison.rows.map((row) => ({
      strategy: row.meta.title,
      accountId: row.meta.accountId,
      accountName: row.accountName,
      equity: row.equity,
      cash: row.cash,
      grossExposure: row.grossExposure,
      positions: row.positions,
      openOrders: row.openOrders,
      localSnapshots: row.localSnapshots,
      alpacaIntradayPoints: row.alpacaIntradayHistory.length,
      alpacaIntradayReturn: row.alpacaIntradayReturn,
      alpacaIntradayDrawdown: row.alpacaIntradayDrawdown,
      error: row.error,
    })),
    health,
  };
}

function verifyCronRequest(request: NextRequest) {
  const secret = process.env.CRON_SECRET;
  const authHeader = request.headers.get("authorization");

  if (!secret && process.env.VERCEL) {
    return false;
  }
  if (!secret) {
    return true;
  }

  return authHeader === `Bearer ${secret}`;
}

export async function GET(request: NextRequest) {
  if (!verifyCronRequest(request)) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  return NextResponse.json(await captureSnapshot());
}

export async function POST() {
  return NextResponse.json(await captureSnapshot());
}
