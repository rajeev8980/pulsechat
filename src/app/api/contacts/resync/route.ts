import { NextResponse } from "next/server";
import { readSession } from "@/server/session";
import { refreshPulseAvailability, resyncContacts } from "@/server/store";

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
  const avail = refreshPulseAvailability(session.user.email);
  return NextResponse.json({
    contacts: avail.contacts,
    availableOnPulse: avail.availableOnPulse,
  });
}
