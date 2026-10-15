import { NextResponse } from "next/server";
import { SESSION_COOKIE } from "@/server/session";
import { createSession } from "@/server/store";

export async function POST(req: Request) {
  const body = (await req.json().catch(() => null)) as {
    name?: string;
    email?: string;
    avatar?: string;
    phone?: string;
  } | null;

  const email = body?.email?.trim();
  if (!email || !email.includes("@")) {
    return NextResponse.json(
      { error: "Please enter a valid email address" },
      { status: 400 },
    );
  }

  const name =
    body?.name?.trim() ||
    email.split("@")[0].replace(/[._]/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

  const avatar =
    body?.avatar?.trim() ||
    `https://api.dicebear.com/9.x/initials/svg?seed=${encodeURIComponent(name)}&backgroundColor=4f46e5`;

  const phone = body?.phone?.trim() || undefined;

  const session = createSession({ name, email, avatar, phone });
  const res = NextResponse.json({ user: session.user });
  res.cookies.set(SESSION_COOKIE, session.id, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });
  return res;
}
