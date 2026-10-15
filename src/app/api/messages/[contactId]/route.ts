import { NextResponse } from "next/server";
import { toWhatsAppPhone } from "@/lib/whatsapp";
import { readSession } from "@/server/session";
import {
  getContact,
  getMessages,
  sendMessage,
  updateMessageDelivery,
} from "@/server/store";
import {
  isWhatsAppCloudConfigured,
  sendWhatsAppCloudMessage,
} from "@/server/whatsapp-cloud";

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

export async function POST(req: Request, { params }: Params) {
  const session = await readSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const owner = session.user.email;
  const { contactId } = await params;
  const body = (await req.json().catch(() => null)) as { text?: string } | null;
  const text = body?.text ?? "";

  const contact = getContact(owner, contactId);
  if (!contact) {
    return NextResponse.json({ error: "Contact not found" }, { status: 404 });
  }

  if (contact.platform === "whatsapp" && isWhatsAppCloudConfigured()) {
    const phone = toWhatsAppPhone(contact.phone || contact.handle);
    if (!phone) {
      return NextResponse.json(
        {
          error:
            "WhatsApp number must include country code (e.g. +919334803286).",
        },
        { status: 400 },
      );
    }

    const cloud = await sendWhatsAppCloudMessage(phone, text.trim());
    if (!cloud.ok) {
      const result = sendMessage(owner, contactId, text, {
        delivery: "whatsapp_handoff",
      });
      if (!result.ok) {
        return NextResponse.json(
          { error: result.error, message: result.message },
          { status: result.message ? 422 : 400 },
        );
      }
      return NextResponse.json({
        message: result.message,
        contact: result.contact,
        invitationSent: result.invitationSent,
        autoReplyPending: false,
        needsClientHandoff: "whatsapp" as const,
        cloudError: cloud.error,
        whatsappCloudConfigured: true,
      });
    }

    const result = sendMessage(owner, contactId, text, {
      delivery: "whatsapp_api",
    });
    if (!result.ok) {
      return NextResponse.json(
        { error: result.error, message: result.message },
        { status: result.message ? 422 : 400 },
      );
    }
    return NextResponse.json({
      message: result.message,
      contact: result.contact,
      invitationSent: result.invitationSent,
      autoReplyPending: false,
      needsClientHandoff: null,
      whatsappCloudConfigured: true,
      cloudMessageId: cloud.messageId,
    });
  }

  const result = sendMessage(owner, contactId, text);
  if (!result.ok) {
    return NextResponse.json(
      { error: result.error, message: result.message },
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
    whatsappCloudConfigured: isWhatsAppCloudConfigured(),
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
