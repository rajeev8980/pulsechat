import { NextResponse } from "next/server";
import { SESSION_COOKIE } from "@/server/session";
import { createSession } from "@/server/store";

export async function POST(req: Request) {
  const body = (await req.json().catch(() => null)) as {
    name?: string;
    email?: string;
    avatar?: string;
  } | null;

  const email = body?.email?.trim();
  if (!email || !email.includes("@")) {
    return NextResponse.json(
      { error: "Please enter a valid Gmail address" },
      { status: 400 },
    );
  }

  const name =
    body?.name?.trim() ||
    email.split("@")[0].replace(/[._]/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

  const avatar =
    body?.avatar?.trim() ||
    "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=96&h=96&fit=crop&crop=faces";

  // Simulate sync latency
  await new Promise((r) => setTimeout(r, 500));

  const session = createSession({ name, email, avatar });
  const res = NextResponse.json({ user: session.user });
  res.cookies.set(SESSION_COOKIE, session.id, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });
  return res;
}
