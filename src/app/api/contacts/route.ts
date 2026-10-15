import { NextResponse } from "next/server";
import type { Platform } from "@/lib/types";
import { readSession } from "@/server/session";
import { addContact, listContacts } from "@/server/store";

const PLATFORMS: Platform[] = [
  "pulse",
  "whatsapp",
  "telegram",
  "instagram",
  "messenger",
  "sms",
];

export async function GET() {
  const session = await readSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  return NextResponse.json({ contacts: listContacts(session.user.email) });
}

export async function POST(req: Request) {
  const session = await readSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await req.json().catch(() => null)) as {
    name?: string;
    platform?: string;
    handle?: string;
    phone?: string;
    email?: string;
  } | null;

  const platform = body?.platform as Platform | undefined;
  if (platform && !PLATFORMS.includes(platform)) {
    return NextResponse.json(
      { error: "Choose a valid platform" },
      { status: 400 },
    );
  }

  const result = addContact(session.user.email, {
    name: body?.name || "",
    platform,
    handle: body?.handle,
    phone: body?.phone,
    email: body?.email,
  });

  if ("error" in result) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }

  return NextResponse.json({ contact: result }, { status: 201 });
}
