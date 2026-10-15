import { NextResponse } from "next/server";
import { readSession } from "@/server/session";
import { listGatewayEvents } from "@/server/gateway";

export async function GET() {
  const session = await readSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  return NextResponse.json({
    events: listGatewayEvents(session.user.email),
  });
}
