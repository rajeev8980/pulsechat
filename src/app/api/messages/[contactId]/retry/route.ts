import { NextResponse } from "next/server";
import { readSession } from "@/server/session";
import { getContact, retryMessage } from "@/server/store";
import { isWhatsAppCloudConfigured } from "@/server/whatsapp-cloud";

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

  const contact = getContact(contactId);
  const result = retryMessage(contactId, body.messageId);
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }

  const needsClientHandoff =
    contact?.platform === "whatsapp"
      ? ("whatsapp" as const)
      : contact?.platform === "sms"
        ? ("sms" as const)
        : null;

  return NextResponse.json({
    message: result.message,
    contact: result.contact,
    autoReplyPending: false,
    needsClientHandoff,
    whatsappCloudConfigured: isWhatsAppCloudConfigured(),
  });
}
