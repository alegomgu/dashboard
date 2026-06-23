import { NextResponse } from "next/server";
import { getSafeAlpacaAccounts } from "@/lib/alpaca-accounts";

export const dynamic = "force-dynamic";

export function GET() {
  return NextResponse.json({
    accounts: getSafeAlpacaAccounts().map(({ id, name, isDefault }) => ({
      id,
      name,
      isDefault,
    })),
  });
}
