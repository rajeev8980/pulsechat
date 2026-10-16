import { NextResponse } from "next/server";
import { readSession, writeSessionCookie } from "@/server/session";

export async function GET() {
  const session = await readSession();
  if (!session) {
    return NextResponse.json({ user: null });
  }
  // Sliding persistence — refresh cookie so login lasts until logout
  try {
    await writeSessionCookie(session);
  } catch {
    // ignore cookie write failures on edge cases
  }
  return NextResponse.json({ user: session.user });
}
