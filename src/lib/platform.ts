import type { Contact, DeliveryStatus, Platform } from "./types";

/** Short label: which app this contact is available to chat on. */
export function getChatAvailability(contact: Contact): {
  app: string;
  short: string;
  detail: string;
  tone: "pulse" | "whatsapp" | "telegram" | "sms" | "other";
} {
  if (contact.onPulse || contact.platform === "pulse") {
    return {
      app: "PulseChat",
      short: "PulseChat",
      detail: "Available on PulseChat",
      tone: "pulse",
    };
  }
  switch (contact.platform) {
    case "whatsapp":
      return {
        app: "WhatsApp",
        short: "WhatsApp",
        detail: "Chat on WhatsApp",
        tone: "whatsapp",
      };
    case "telegram":
      return {
        app: "Telegram",
        short: "Telegram",
        detail: "Chat on Telegram",
        tone: "telegram",
      };
    case "sms":
      return {
        app: "SMS",
        short: "SMS",
        detail: "Chat via SMS",
        tone: "sms",
      };
    case "instagram":
      return {
        app: "Instagram",
        short: "Instagram",
        detail: "Chat on Instagram",
        tone: "other",
      };
    case "messenger":
      return {
        app: "Messenger",
        short: "Messenger",
        detail: "Chat on Messenger",
        tone: "other",
      };
    default:
      return {
        app: contact.platformName || "PulseChat",
        short: contact.platformName || "Chat",
        detail: `Chat on ${contact.platformName || "app"}`,
        tone: "other",
      };
  }
}

export function getAvailabilityChipClass(
  tone: ReturnType<typeof getChatAvailability>["tone"],
): string {
  switch (tone) {
    case "pulse":
      return "bg-[#00a884]/20 text-[#00a884] border-[#00a884]/35";
    case "whatsapp":
      return "bg-emerald-500/20 text-emerald-300 border-emerald-500/35";
    case "telegram":
      return "bg-sky-500/20 text-sky-300 border-sky-500/35";
    case "sms":
      return "bg-teal-500/20 text-teal-300 border-teal-500/35";
    default:
      return "bg-slate-500/20 text-slate-300 border-slate-500/35";
  }
}

export function getPlatformBadgeClass(platform: Platform): string {
  switch (platform) {
    case "whatsapp":
      return "wa-grad";
    case "telegram":
      return "tg-grad";
    case "instagram":
      return "ig-grad";
    case "messenger":
      return "fb-grad";
    case "sms":
      return "sms-grad";
    default:
      return "pulse-grad";
  }
}

export function getPlatformTagStyles(platform: Platform): string {
  switch (platform) {
    case "whatsapp":
      return "bg-emerald-500/15 text-emerald-400 border-emerald-500/30";
    case "telegram":
      return "bg-sky-500/15 text-sky-400 border-sky-500/30";
    case "instagram":
      return "bg-pink-500/15 text-pink-400 border-pink-500/30";
    case "messenger":
      return "bg-blue-500/15 text-blue-400 border-blue-500/30";
    case "sms":
      return "bg-teal-500/15 text-teal-400 border-teal-500/30";
    default:
      return "bg-indigo-500/15 text-indigo-400 border-indigo-500/30";
  }
}

export function getPlatformDeliveryTag(
  platform: Platform,
  delivery?: DeliveryStatus,
): string {
  if (delivery === "pulse") return "Delivered on Pulse ✓✓";
  if (delivery === "whatsapp_api") return "Sent via WhatsApp Cloud API ✓✓";
  if (delivery === "whatsapp_handoff")
    return "Opened in WhatsApp — tap Send there to deliver";
  if (delivery === "telegram_handoff")
    return "Opened Telegram — paste/send there to deliver";
  if (delivery === "sms_handoff")
    return "Opened SMS app — tap Send to deliver";
  if (delivery === "simulated") return "Simulated in PulseChat only";
  if (delivery === "local" && platform === "pulse")
    return "Saved in PulseChat ✓✓";

  switch (platform) {
    case "whatsapp":
      return "Not sent to WhatsApp yet — use Send to open WhatsApp";
    case "telegram":
      return "Not sent to Telegram yet — use Send to open Telegram";
    case "instagram":
      return "Saved in PulseChat (Instagram API not connected)";
    case "messenger":
      return "Saved in PulseChat (Messenger API not connected)";
    case "sms":
      return "Not sent via SMS yet — use Send to open Messages";
    default:
      return "Saved in PulseChat ✓✓";
  }
}

export function getAutoReply(platform: Platform): string {
  switch (platform) {
    case "whatsapp":
      return "Got your message on WhatsApp! This cross-platform bridge works fast.";
    case "telegram":
      return "Replying through Telegram bot bridge! 🚀";
    case "instagram":
      return "Saw this right in my Instagram Direct requests! Approved!";
    case "messenger":
      return "Messenger notification came through instantly!";
    case "sms":
      return "Carrier SMS received. Replying from my cell tower.";
    default:
      return "PulseChat native room is super fast and encrypted.";
  }
}

export function getBorderAccent(platform: Platform): string {
  switch (platform) {
    case "whatsapp":
      return "border-emerald-500/20";
    case "telegram":
      return "border-sky-500/20";
    case "instagram":
      return "border-pink-500/20";
    case "messenger":
      return "border-blue-500/20";
    case "sms":
      return "border-teal-500/20";
    default:
      return "border-indigo-500/20";
  }
}

export function getPlatformTextColor(platform: Platform): string {
  switch (platform) {
    case "whatsapp":
      return "text-emerald-400";
    case "telegram":
      return "text-sky-400";
    case "instagram":
      return "text-pink-400";
    case "messenger":
      return "text-blue-400";
    case "sms":
      return "text-teal-400";
    default:
      return "text-indigo-400";
  }
}
