import { NextResponse } from "next/server";

export function GET() {
  return NextResponse.json({
    ok: true,
    service: "web",
    check: "live",
    timestamp: new Date().toISOString(),
  });
}
