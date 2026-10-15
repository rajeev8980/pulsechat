import { NextResponse } from "next/server";
import { readSession } from "@/server/session";
import { resyncContacts } from "@/server/store";

export async function POST() {
  const session = await readSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await new Promise((r) => setTimeout(r, 400));
  const result = resyncContacts(session.user.email);
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 503 });
  }
  return NextResponse.json({ contacts: result.contacts });
}
