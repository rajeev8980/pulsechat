import { NextResponse } from "next/server";
import { readSession } from "@/server/session";
import { simulateReply } from "@/server/store";

type Params = { params: Promise<{ contactId: string }> };

export async function POST(_req: Request, { params }: Params) {
  const session = await readSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { contactId } = await params;

  // Simulate typing delay on server
  await new Promise((r) => setTimeout(r, 900));
  const result = simulateReply(contactId);
  if (!result) {
    return NextResponse.json({ error: "Contact not found" }, { status: 404 });
  }

  return NextResponse.json(result);
}
