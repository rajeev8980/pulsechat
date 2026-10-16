import crypto from "crypto";
import { cookies } from "next/headers";
import type { NextResponse } from "next/server";
import type { User } from "@/lib/types";
import {
  destroySession,
  getSession,
  restoreSession,
  type Session,
} from "./store";

export const SESSION_COOKIE = "pulsechat_session";

/** Stay signed in until explicit logout (~browser max cookie lifetime). */
export const SESSION_MAX_AGE_SEC = 60 * 60 * 24 * 400;

type CookiePayload = {
  v: 1;
  sid: string;
  user: User;
  createdAt: number;
};

function sessionSecret() {
  return (
    process.env.PULSECHAT_SESSION_SECRET ||
    process.env.VERCEL_OIDC_TOKEN ||
    "pulsechat-local-dev-secret-v1"
  );
}

function cookieOptions() {
  const secure =
    process.env.VERCEL === "1" || process.env.NODE_ENV === "production";
  return {
    httpOnly: true as const,
    sameSite: "lax" as const,
    path: "/",
    maxAge: SESSION_MAX_AGE_SEC,
    secure,
  };
}

function signPayload(payload: CookiePayload): string {
  const body = Buffer.from(JSON.stringify(payload), "utf8").toString(
    "base64url",
  );
  const sig = crypto
    .createHmac("sha256", sessionSecret())
    .update(body)
    .digest("base64url");
  return `${body}.${sig}`;
}

function verifyToken(token: string): CookiePayload | null {
  const i = token.lastIndexOf(".");
  if (i <= 0) return null;
  const body = token.slice(0, i);
  const sig = token.slice(i + 1);
  const expect = crypto
    .createHmac("sha256", sessionSecret())
    .update(body)
    .digest("base64url");
  try {
    const a = Buffer.from(sig);
    const b = Buffer.from(expect);
    if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null;
    const data = JSON.parse(
      Buffer.from(body, "base64url").toString("utf8"),
    ) as CookiePayload;
    if (data?.v !== 1 || !data.sid || !data.user?.email?.includes("@")) {
      return null;
    }
    return data;
  } catch {
    return null;
  }
}

function tokenForSession(session: Session): string {
  return signPayload({
    v: 1,
    sid: session.id,
    user: session.user,
    createdAt: session.createdAt,
  });
}

/** Set signed session cookie on a Route Handler response. */
export function applySessionCookie(res: NextResponse, session: Session) {
  res.cookies.set(SESSION_COOKIE, tokenForSession(session), cookieOptions());
}

/** Refresh / set cookie via next/headers (e.g. /api/auth/me). */
export async function writeSessionCookie(session: Session) {
  const jar = await cookies();
  jar.set(SESSION_COOKIE, tokenForSession(session), cookieOptions());
}

/**
 * Resolve the current user session from the signed cookie.
 * Survives Vercel cold starts — cookie is the source of truth until logout.
 */
export async function readSession(): Promise<Session | null> {
  const jar = await cookies();
  const raw = jar.get(SESSION_COOKIE)?.value;
  if (!raw) return null;

  // Legacy plain session id (pre-signed cookies)
  if (!raw.includes(".")) {
    return getSession(raw);
  }

  const payload = verifyToken(raw);
  if (!payload) return null;

  return restoreSession({
    id: payload.sid,
    user: payload.user,
    createdAt: payload.createdAt,
  });
}

export async function requireSession(): Promise<Session> {
  const session = await readSession();
  if (!session) {
    throw new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }
  return session;
}

export async function clearSessionCookie() {
  const jar = await cookies();
  const raw = jar.get(SESSION_COOKIE)?.value;
  if (raw) {
    if (!raw.includes(".")) {
      destroySession(raw);
    } else {
      const payload = verifyToken(raw);
      if (payload) destroySession(payload.sid);
    }
  }
  jar.set(SESSION_COOKIE, "", {
    ...cookieOptions(),
    maxAge: 0,
  });
}
