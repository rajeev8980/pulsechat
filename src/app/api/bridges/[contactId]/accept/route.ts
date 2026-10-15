import { NextResponse } from "next/server";
import { readSession } from "@/server/session";
import { acceptBridge } from "@/server/store";

type Params = { params: Promise<{ contactId: string }> };

export async function POST(_req: Request, { params }: Params) {
  const session = await readSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { contactId } = await params;
  const contact = acceptBridge(session.user.email, contactId);
  if (!contact) {
    return NextResponse.json({ error: "Contact not found" }, { status: 404 });
  }

  return NextResponse.json({ contact });
}
