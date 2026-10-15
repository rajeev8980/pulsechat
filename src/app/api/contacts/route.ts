import { NextResponse } from "next/server";
import { readSession } from "@/server/session";
import { listContacts } from "@/server/store";

export async function GET() {
  const session = await readSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  return NextResponse.json({ contacts: listContacts() });
}
