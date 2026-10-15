/**
 * Optional Meta WhatsApp Cloud API delivery.
 * Set WHATSAPP_ACCESS_TOKEN + WHATSAPP_PHONE_NUMBER_ID to enable server-side send.
 * Without these, the client opens wa.me so the user sends from their WhatsApp app.
 */

export function isWhatsAppCloudConfigured(): boolean {
  return Boolean(
    process.env.WHATSAPP_ACCESS_TOKEN?.trim() &&
      process.env.WHATSAPP_PHONE_NUMBER_ID?.trim(),
  );
}

export type CloudSendResult =
  | { ok: true; messageId: string }
  | { ok: false; error: string; missingConfig?: boolean };

export async function sendWhatsAppCloudMessage(
  toPhoneDigits: string,
  text: string,
): Promise<CloudSendResult> {
  const token = process.env.WHATSAPP_ACCESS_TOKEN?.trim();
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID?.trim();
  const apiVersion = process.env.WHATSAPP_API_VERSION?.trim() || "v21.0";

  if (!token || !phoneNumberId) {
    return {
      ok: false,
      missingConfig: true,
      error:
        "WhatsApp Cloud API not configured. Opening WhatsApp on your phone instead.",
    };
  }

  const to = toPhoneDigits.replace(/\D/g, "");
  if (to.length < 10) {
    return { ok: false, error: "Invalid WhatsApp phone number" };
  }

  try {
    const res = await fetch(
      `https://graph.facebook.com/${apiVersion}/${phoneNumberId}/messages`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messaging_product: "whatsapp",
          recipient_type: "individual",
          to,
          type: "text",
          text: { preview_url: false, body: text },
        }),
      },
    );

    const data = (await res.json().catch(() => ({}))) as {
      messages?: { id?: string }[];
      error?: { message?: string };
    };

    if (!res.ok) {
      return {
        ok: false,
        error:
          data.error?.message ||
          `WhatsApp API error (${res.status}). Check token / phone number ID.`,
      };
    }

    return {
      ok: true,
      messageId: data.messages?.[0]?.id || "wa-cloud",
    };
  } catch (e) {
    return {
      ok: false,
      error: e instanceof Error ? e.message : "WhatsApp API request failed",
    };
  }
}
