import type { Contact, Message, User } from "./types";

export const DEFAULT_USER: User = {
  name: "Alex Morgan",
  email: "alex.morgan.dev@gmail.com",
  avatar:
    "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=96&h=96&fit=crop&crop=faces",
};

export const GOOGLE_ACCOUNTS: User[] = [
  DEFAULT_USER,
  {
    name: "Marcus Chen",
    email: "marcus.chen@gmail.com",
    avatar:
      "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=96&h=96&fit=crop&crop=faces",
  },
];

export const INITIAL_CONTACTS: Contact[] = [
  {
    id: "c1",
    name: "Elena Rostova",
    platform: "pulse",
    handle: "@elena_pulse",
    phone: "+1 (555) 019-2831",
    avatar:
      "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=96&h=96&fit=crop&crop=faces",
    status: "Online • Tokyo Studio",
    bridgeConnected: true,
    invitationSent: true,
    platformName: "Native Pulse",
  },
  {
    id: "c2",
    name: "Devon Vance",
    platform: "pulse",
    handle: "@devon_v",
    phone: "+1 (555) 441-9872",
    avatar:
      "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=96&h=96&fit=crop&crop=faces",
    status: "Online • Deploying v3.0",
    bridgeConnected: true,
    invitationSent: true,
    platformName: "Native Pulse",
  },
  {
    id: "c3",
    name: "Liam Cooper",
    platform: "whatsapp",
    handle: "+1 (555) 732-9011",
    phone: "+1 (555) 732-9011",
    avatar:
      "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=96&h=96&fit=crop&crop=faces",
    status: "WhatsApp • Invite Ready",
    bridgeConnected: false,
    invitationSent: false,
    platformName: "WhatsApp",
  },
  {
    id: "c4",
    name: "Priya Sharma",
    platform: "whatsapp",
    handle: "+91 98350-12345",
    phone: "+91 98350-12345",
    avatar:
      "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=96&h=96&fit=crop&crop=faces",
    status: "WhatsApp Bridge Connected",
    bridgeConnected: true,
    invitationSent: true,
    platformName: "WhatsApp",
  },
  {
    id: "c5",
    name: "Sophia Vance",
    platform: "telegram",
    handle: "@sophia_tg",
    phone: "+1 (555) 882-1928",
    avatar:
      "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=96&h=96&fit=crop&crop=faces",
    status: "Telegram Bridge Active",
    bridgeConnected: true,
    invitationSent: true,
    platformName: "Telegram",
  },
  {
    id: "c6",
    name: "Alexei Voronov",
    platform: "telegram",
    handle: "@alexei_v",
    phone: "+1 (555) 998-3321",
    avatar:
      "https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=96&h=96&fit=crop&crop=faces",
    status: "Telegram • 1-Tap Invite Ready",
    bridgeConnected: false,
    invitationSent: false,
    platformName: "Telegram",
  },
  {
    id: "c7",
    name: "Mia Rodriguez",
    platform: "instagram",
    handle: "@mia_artistry",
    phone: "+1 (555) 438-1920",
    avatar:
      "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=96&h=96&fit=crop&crop=faces",
    status: "Instagram Direct • Invite Ready",
    bridgeConnected: false,
    invitationSent: false,
    platformName: "Instagram Direct",
  },
  {
    id: "c8",
    name: "Jordan Blake",
    platform: "instagram",
    handle: "@jordan_vibes",
    phone: "+1 (555) 302-9912",
    avatar:
      "https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=96&h=96&fit=crop&crop=faces",
    status: "Instagram Direct Connected",
    bridgeConnected: true,
    invitationSent: true,
    platformName: "Instagram Direct",
  },
  {
    id: "c9",
    name: "David Miller",
    platform: "messenger",
    handle: "fb.com/david.miller.98",
    phone: "+1 (555) 629-4401",
    avatar:
      "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=96&h=96&fit=crop&crop=faces",
    status: "Messenger • 1-Tap Invite Ready",
    bridgeConnected: false,
    invitationSent: false,
    platformName: "Messenger",
  },
  {
    id: "c10",
    name: "Grandma Miller",
    platform: "sms",
    handle: "+1 (555) 901-2299",
    phone: "+1 (555) 901-2299",
    avatar:
      "https://images.unsplash.com/photo-1544717305-2782549b5136?w=96&h=96&fit=crop&crop=faces",
    status: "Carrier Cellular Active",
    bridgeConnected: true,
    invitationSent: true,
    platformName: "Carrier SMS",
  },
  {
    id: "c11",
    name: "Uncle Bob",
    platform: "sms",
    handle: "+1 (555) 441-8977",
    phone: "+1 (555) 441-8977",
    avatar:
      "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=96&h=96&fit=crop&crop=faces",
    status: "Carrier SMS • Ready to transmit",
    bridgeConnected: false,
    invitationSent: false,
    platformName: "Carrier SMS",
  },
];

export function createInitialMessages(): Record<string, Message[]> {
  return {
    c1: [
      {
        id: "m1-1",
        sender: "them",
        text: "Hey Alex! All Google OAuth redirect endpoints are fully operational. 🙌",
        time: "10:14 AM",
      },
      {
        id: "m1-2",
        sender: "me",
        text: "PulseChat 6-network bridge is officially connected!",
        time: "10:15 AM",
      },
    ],
    c3: [
      {
        id: "m3-1",
        sender: "me",
        text: "Hey Liam! Sending this test message from PulseChat to your WhatsApp.",
        time: "10:12 AM",
      },
    ],
    c4: [
      {
        id: "m4-1",
        sender: "me",
        text: "Namaste Priya! Checking if the cross-gateway is active.",
        time: "4:30 PM",
      },
      {
        id: "m4-2",
        sender: "them",
        text: "Yes! Got your message instantly on WhatsApp India gateway. 🇮🇳",
        time: "4:31 PM",
      },
    ],
    c5: [
      {
        id: "m5-1",
        sender: "them",
        text: "Sophia here! Got your message through the Telegram bot bridge. 🚀",
        time: "10:15 AM",
      },
    ],
    c7: [
      {
        id: "m7-1",
        sender: "me",
        text: "Hi Mia! Reaching out through PulseChat Instagram bridge.",
        time: "09:30 AM",
      },
    ],
    c8: [
      {
        id: "m8-1",
        sender: "them",
        text: "Hey! Saw your PulseChat ping in my Instagram DM requests and accepted! 📸",
        time: "Yesterday",
      },
    ],
    c9: [
      {
        id: "m9-1",
        sender: "me",
        text: "Hi David! Let me know if this Facebook Messenger bridge test works.",
        time: "09:40 AM",
      },
    ],
    c10: [
      {
        id: "m10-1",
        sender: "them",
        text: "Hello darling! I got your text message on my phone. Sending love! ❤️",
        time: "Yesterday",
      },
    ],
  };
}

export const PREVIEW_FEED = [
  {
    name: "Liam Cooper",
    platform: "WhatsApp Bridge",
    platformKey: "whatsapp" as const,
    text: '"Tapped your 1-click notification and bridged instantly from WhatsApp!"',
  },
  {
    name: "Mia Rodriguez",
    platform: "Instagram Direct",
    platformKey: "instagram" as const,
    text: '"Accepted your message request in IG DM! Love how fast this synced."',
  },
  {
    name: "Sophia Vance",
    platform: "Telegram Relay",
    platformKey: "telegram" as const,
    text: '"Received via Telegram bot relay without having to download PulseChat."',
  },
  {
    name: "Grandma Miller",
    platform: "Carrier SMS",
    platformKey: "sms" as const,
    text: '"Hello dear! Got your text message straight on my flip phone!"',
  },
];
