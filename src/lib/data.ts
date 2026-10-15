import type { Contact, Message, Platform, User } from "./types";

/** Placeholder until the real user signs in — not a demo person. */
export const GUEST_USER: User = {
  name: "Guest",
  email: "",
  avatar: "/icons/icon-192.png",
};

/** @deprecated use GUEST_USER */
export const DEFAULT_USER = GUEST_USER;

/** No pre-seeded fake Google accounts. */
export const GOOGLE_ACCOUNTS: User[] = [];

/** Start empty — users add their own contacts. */
export const INITIAL_CONTACTS: Contact[] = [];

export function createInitialMessages(): Record<string, Message[]> {
  return {};
}

export const PLATFORM_META: Record<
  Platform,
  { platformName: string; status: string }
> = {
  pulse: { platformName: "Native Pulse", status: "Pulse • Peer chat" },
  whatsapp: { platformName: "WhatsApp", status: "WhatsApp • Invite Ready" },
  telegram: {
    platformName: "Telegram",
    status: "Telegram • Opens on your phone",
  },
  instagram: {
    platformName: "Instagram Direct",
    status: "Instagram Direct • Invite Ready",
  },
  messenger: { platformName: "Messenger", status: "Messenger • Invite Ready" },
  sms: { platformName: "Carrier SMS", status: "Carrier SMS • Ready" },
};

/** Landing marketing preview only (not signed-in users). */
export const PREVIEW_FEED = [
  {
    name: "Friend on WhatsApp",
    platform: "WhatsApp Bridge",
    platformKey: "whatsapp" as const,
    text: '"Tapped your 1-click notification and bridged instantly from WhatsApp!"',
  },
  {
    name: "Friend on Instagram",
    platform: "Instagram Direct",
    platformKey: "instagram" as const,
    text: '"Accepted your message request in IG DM! Love how fast this synced."',
  },
  {
    name: "Friend on Telegram",
    platform: "Telegram Relay",
    platformKey: "telegram" as const,
    text: '"Received via Telegram bot relay without having to download PulseChat."',
  },
  {
    name: "Family on SMS",
    platform: "Carrier SMS",
    platformKey: "sms" as const,
    text: '"Got your text message straight on my phone!"',
  },
];
