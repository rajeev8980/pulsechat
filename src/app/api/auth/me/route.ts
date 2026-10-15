import { NextResponse } from "next/server";
import { readSession } from "@/server/session";

export async function GET() {
  const session = await readSession();
  return NextResponse.json({ user: session?.user ?? null });
}
