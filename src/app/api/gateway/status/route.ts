import { NextResponse } from "next/server";
import { gatewayStatus } from "@/server/gateway";

export async function GET() {
  return NextResponse.json(gatewayStatus());
}
