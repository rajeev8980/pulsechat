import { NextResponse } from "next/server";
import { APP_VERSION, BUILD_ID } from "@/lib/build-id";

export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json(
    {
      ok: true,
      version: APP_VERSION,
      buildId: BUILD_ID,
      service: "pulsechat-api",
      ts: Date.now(),
    },
    {
      headers: {
        "Cache-Control": "no-store, no-cache, must-revalidate",
      },
    },
  );
}
