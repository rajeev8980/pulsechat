import { NextResponse } from "next/server";
import type { Platform } from "@/lib/types";
import { readSession } from "@/server/session";
import { importContacts } from "@/server/store";

export async function POST(req: Request) {
  const session = await readSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await req.json().catch(() => null)) as {
    contacts?: Array<{
      name?: string;
      email?: string;
      phone?: string;
      platform?: Platform;
    }>;
  } | null;

  const items = body?.contacts;
  if (!Array.isArray(items) || items.length === 0) {
    return NextResponse.json(
      { error: "Send a contacts array with name + email and/or phone" },
      { status: 400 },
    );
  }

  if (items.length > 500) {
    return NextResponse.json(
      { error: "Max 500 contacts per sync" },
      { status: 400 },
    );
  }

  const result = importContacts(session.user.email, items);
  return NextResponse.json(result);
}
