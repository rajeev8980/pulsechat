import { NextResponse } from "next/server";
import { readSession } from "@/server/session";
import { gatewaySend } from "@/server/gateway";

/** Common messaging API — Platform A → Gateway → Platform B */
export async function POST(req: Request) {
  const session = await readSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await req.json().catch(() => null)) as {
    contactId?: string;
    text?: string;
  } | null;

  if (!body?.contactId || typeof body.text !== "string") {
    return NextResponse.json(
      { error: "contactId and text are required" },
      { status: 400 },
    );
  }

  const result = await gatewaySend({
    ownerEmail: session.user.email,
    contactId: body.contactId,
    text: body.text,
  });

  if (!result.ok) {
    return NextResponse.json(
      {
        error: result.error,
        message: result.message,
        route: result.route,
      },
      { status: result.message ? 422 : 400 },
    );
  }

  return NextResponse.json({
    message: result.message,
    contact: result.contact,
    route: result.route,
    invitationSent: result.invitationSent,
    autoReplyPending: false,
    needsClientHandoff: result.needsClientHandoff,
    pulseDelivered: result.pulseDelivered,
    whatsappCloudConfigured: result.whatsappCloudConfigured,
    cloudError: result.cloudError,
    gateway: {
      from: "Platform A · PulseChat",
      hub: "Common messaging server / API",
      to: `Platform B · ${result.contact.platformName}`,
      status: result.route.status,
    },
  });
}
