import { NextResponse } from "next/server";
import { readSession } from "@/server/session";
import {
  getContact,
  getMessages,
  scheduleAutoReply,
  sendMessage,
} from "@/server/store";

type Params = { params: Promise<{ contactId: string }> };

export async function GET(req: Request, { params }: Params) {
  const session = await readSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { contactId } = await params;
  const contact = getContact(contactId);
  if (!contact) {
    return NextResponse.json({ error: "Contact not found" }, { status: 404 });
  }

  const { searchParams } = new URL(req.url);
  const after = searchParams.get("after");
  let messages = getMessages(contactId);
  if (after) {
    const idx = messages.findIndex((m) => m.id === after);
    messages = idx >= 0 ? messages.slice(idx + 1) : messages;
  }

  return NextResponse.json({ contact, messages });
}

export async function POST(req: Request, { params }: Params) {
  const session = await readSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { contactId } = await params;
  const body = (await req.json().catch(() => null)) as { text?: string } | null;
  const text = body?.text ?? "";

  await new Promise((r) => setTimeout(r, 280));
  const result = sendMessage(contactId, text);

  if (!result.ok) {
    return NextResponse.json(
      { error: result.error, message: result.message },
      { status: result.message ? 422 : 400 },
    );
  }

  const autoReplyPending = Boolean(result.contact.bridgeConnected);
  if (autoReplyPending) {
    // Fire-and-forget reply into store; client polls
    void scheduleAutoReply(contactId);
  }

  return NextResponse.json({
    message: result.message,
    contact: result.contact,
    invitationSent: result.invitationSent,
    autoReplyPending,
  });
}
