import { NextResponse } from "next/server";
import {
  SESSION_COOKIE,
  SESSION_MAX_AGE_SEC,
  clearSessionCookie,
} from "@/server/session";

export async function POST() {
  await clearSessionCookie();
  const res = NextResponse.json({ ok: true });
  // Extra clear on the response for browsers that only honor Set-Cookie on the response
  res.cookies.set(SESSION_COOKIE, "", {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 0,
    secure:
      process.env.VERCEL === "1" || process.env.NODE_ENV === "production",
  });
  void SESSION_MAX_AGE_SEC;
  return res;
}
