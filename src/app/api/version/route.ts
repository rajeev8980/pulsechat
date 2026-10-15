import { connection } from "next/server";
import { NextResponse } from "next/server";
import { APP_VERSION, BUILD_ID } from "@/lib/build-id";

export async function GET() {
  // Opt into request-time rendering under cacheComponents
  await connection();

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
