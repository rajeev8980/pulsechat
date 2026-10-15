/** Digits only, no +. Empty if invalid. */
export function normalizePhoneDigits(raw: string): string {
  const digits = raw.replace(/\D/g, "");
  return digits;
}

/** E.164-ish digits for wa.me (country code required, no +). */
export function toWhatsAppPhone(raw: string): string | null {
  const digits = normalizePhoneDigits(raw);
  // Need country code: at least 10 digits (many markets), prefer 11–15
  if (digits.length < 10 || digits.length > 15) return null;
  return digits;
}

export function buildWhatsAppUrl(phoneRaw: string, text: string): string | null {
  const phone = toWhatsAppPhone(phoneRaw);
  if (!phone) return null;
  const q = text.trim()
    ? `?text=${encodeURIComponent(text.trim())}`
    : "";
  return `https://wa.me/${phone}${q}`;
}

export function buildSmsUrl(phoneRaw: string, text: string): string | null {
  const digits = normalizePhoneDigits(phoneRaw);
  if (digits.length < 7) return null;
  const body = text.trim()
    ? `?body=${encodeURIComponent(text.trim())}`
    : "";
  return `sms:${digits}${body}`;
}

/** Open the system WhatsApp / SMS app from a user gesture. */
export function openExternalChat(
  platform: "whatsapp" | "sms",
  phoneRaw: string,
  text: string,
): { ok: true; url: string } | { ok: false; error: string } {
  const url =
    platform === "whatsapp"
      ? buildWhatsAppUrl(phoneRaw, text)
      : buildSmsUrl(phoneRaw, text);

  if (!url) {
    return {
      ok: false,
      error:
        platform === "whatsapp"
          ? "Add a full phone number with country code (e.g. +919334803286)."
          : "Add a valid phone number for SMS.",
    };
  }

  // Prefer a new tab/window so the PWA stays open; fall back to navigation.
  const win = window.open(url, "_blank", "noopener,noreferrer");
  if (!win) {
    window.location.assign(url);
  }
  return { ok: true, url };
}
