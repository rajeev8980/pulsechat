import { cookies } from "next/headers";
import { destroySession, getSession, type Session } from "./store";

export const SESSION_COOKIE = "pulsechat_session";

export async function readSession(): Promise<Session | null> {
  const jar = await cookies();
  const id = jar.get(SESSION_COOKIE)?.value;
  return getSession(id);
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
  const id = jar.get(SESSION_COOKIE)?.value;
  destroySession(id);
  jar.delete(SESSION_COOKIE);
}
