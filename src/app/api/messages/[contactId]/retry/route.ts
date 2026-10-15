import { NextResponse } from "next/server";
import { readSession } from "@/server/session";
import { retryMessage, scheduleAutoReply } from "@/server/store";

type Params = { params: Promise<{ contactId: string }> };

export async function POST(req: Request, { params }: Params) {
  const session = await readSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { contactId } = await params;
  const body = (await req.json().catch(() => null)) as {
    messageId?: string;
  } | null;

  if (!body?.messageId) {
    return NextResponse.json({ error: "messageId required" }, { status: 400 });
  }

  await new Promise((r) => setTimeout(r, 280));
  const result = retryMessage(contactId, body.messageId);
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }

  const autoReplyPending = Boolean(result.contact.bridgeConnected);
  if (autoReplyPending) {
    void scheduleAutoReply(contactId);
  }

  return NextResponse.json({
    message: result.message,
    contact: result.contact,
    autoReplyPending,
  });
}
