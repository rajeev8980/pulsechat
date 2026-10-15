/** Digits only, no +. Empty if invalid. */
export function normalizePhoneDigits(raw: string): string {
  const digits = raw.replace(/\D/g, "");
  return digits;
}

/** E.164-ish digits for wa.me (country code required, no +). */
export function toWhatsAppPhone(raw: string): string | null {
  const digits = normalizePhoneDigits(raw);
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

/** @username or public Telegram username (not a phone). */
export function toTelegramUsername(raw: string): string | null {
  const u = raw.trim().replace(/^@/, "");
  if (!/^[A-Za-z]\w{3,31}$/.test(u)) return null;
  if (/^\d+$/.test(u)) return null;
  return u;
}

/**
 * Open Telegram chat by username (t.me) or phone (tg://resolve).
 * Prefill is best-effort — message is also copied to the clipboard when possible.
 */
export function buildTelegramUrl(
  handleOrPhone: string,
  text: string,
): string | null {
  const username = toTelegramUsername(handleOrPhone);
  if (username) {
    // Opens the peer chat in Telegram / Telegram Web
    return `https://t.me/${username}`;
  }
  const digits = normalizePhoneDigits(handleOrPhone);
  if (digits.length >= 10 && digits.length <= 15) {
    return `tg://resolve?phone=${digits}`;
  }
  return null;
}

export type HandoffPlatform = "whatsapp" | "sms" | "telegram";

function openUrl(url: string) {
  const win = window.open(url, "_blank", "noopener,noreferrer");
  if (!win) {
    window.location.assign(url);
  }
}

async function copyText(text: string) {
  const t = text.trim();
  if (!t || typeof navigator === "undefined" || !navigator.clipboard) return;
  try {
    await navigator.clipboard.writeText(t);
  } catch {
    // ignore — handoff still opens the app
  }
}

/** Open WhatsApp / Telegram / SMS from a user gesture. */
export function openExternalChat(
  platform: HandoffPlatform,
  targetRaw: string,
  text: string,
): { ok: true; url: string } | { ok: false; error: string } {
  let url: string | null = null;
  if (platform === "whatsapp") url = buildWhatsAppUrl(targetRaw, text);
  else if (platform === "sms") url = buildSmsUrl(targetRaw, text);
  else url = buildTelegramUrl(targetRaw, text);

  if (!url) {
    return {
      ok: false,
      error:
        platform === "whatsapp"
          ? "Add a full phone number with country code (e.g. +919334803286)."
          : platform === "telegram"
            ? "Add a Telegram @username or phone with country code."
            : "Add a valid phone number for SMS.",
    };
  }

  if (platform === "telegram" && text.trim()) {
    void copyText(text);
  }

  openUrl(url);

  // WhatsApp already has ?text=; for Telegram open chat then paste
  if (platform === "telegram" && text.trim() && toTelegramUsername(targetRaw)) {
    // Also try share URL as secondary path on some devices
    // (primary already opened t.me/user)
  }

  return { ok: true, url };
}
