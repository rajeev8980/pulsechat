import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    ok: true,
    service: "pulsechat-api",
    version: "1.1.0",
  });
}
