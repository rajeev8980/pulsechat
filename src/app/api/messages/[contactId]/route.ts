import { NextResponse } from "next/server";
import { readSession } from "@/server/session";
import { gatewaySend } from "@/server/gateway";
import {
  getContact,
  getMessages,
  updateMessageDelivery,
} from "@/server/store";
import { isWhatsAppCloudConfigured } from "@/server/whatsapp-cloud";

type Params = { params: Promise<{ contactId: string }> };

export async function GET(req: Request, { params }: Params) {
  const session = await readSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const owner = session.user.email;
  const { contactId } = await params;
  const contact = getContact(owner, contactId);
  if (!contact) {
    return NextResponse.json({ error: "Contact not found" }, { status: 404 });
  }

  const { searchParams } = new URL(req.url);
  const after = searchParams.get("after");
  let messages = getMessages(owner, contactId);
  if (after) {
    const idx = messages.findIndex((m) => m.id === after);
    messages = idx >= 0 ? messages.slice(idx + 1) : messages;
  }

  return NextResponse.json({
    contact,
    messages,
    whatsappCloudConfigured: isWhatsAppCloudConfigured(),
  });
}

/** Delegates to the common messaging gateway (Platform A → hub → Platform B). */
export async function POST(req: Request, { params }: Params) {
  const session = await readSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { contactId } = await params;
  const body = (await req.json().catch(() => null)) as { text?: string } | null;
  const text = body?.text ?? "";

  const result = await gatewaySend({
    ownerEmail: session.user.email,
    contactId,
    text,
  });

  if (!result.ok) {
    return NextResponse.json(
      { error: result.error, message: result.message, route: result.route },
      { status: result.message ? 422 : 400 },
    );
  }

  return NextResponse.json({
    message: result.message,
    contact: result.contact,
    invitationSent: result.invitationSent,
    autoReplyPending: false,
    needsClientHandoff: result.needsClientHandoff ?? null,
    pulseDelivered: result.pulseDelivered ?? false,
    whatsappCloudConfigured: result.whatsappCloudConfigured,
    cloudError: result.cloudError,
    route: result.route,
    gateway: {
      from: "Platform A · PulseChat",
      hub: "Common messaging server / API",
      to: `Platform B · ${result.contact.platformName}`,
      status: result.route.status,
    },
  });
}

export async function PATCH(req: Request, { params }: Params) {
  const session = await readSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const owner = session.user.email;
  const { contactId } = await params;
  const body = (await req.json().catch(() => null)) as {
    messageId?: string;
    delivery?: "whatsapp_handoff" | "sms_handoff";
  } | null;

  if (!body?.messageId || !body.delivery) {
    return NextResponse.json(
      { error: "messageId and delivery required" },
      { status: 400 },
    );
  }

  const message = updateMessageDelivery(
    owner,
    contactId,
    body.messageId,
    body.delivery,
  );
  if (!message) {
    return NextResponse.json({ error: "Message not found" }, { status: 404 });
  }
  return NextResponse.json({ message });
}
