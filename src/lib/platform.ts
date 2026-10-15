import type { Platform } from "./types";

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

export function getPlatformDeliveryTag(platform: Platform): string {
  switch (platform) {
    case "whatsapp":
      return "Delivered via WhatsApp ✓✓";
    case "telegram":
      return "Delivered via Telegram ✓✓";
    case "instagram":
      return "Delivered via Instagram DM";
    case "messenger":
      return "Delivered via Messenger";
    case "sms":
      return "Sent via Carrier SMS";
    default:
      return "Delivered via Pulse Encrypted ✓✓";
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
