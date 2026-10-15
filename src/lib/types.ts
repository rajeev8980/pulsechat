export type Platform =
  | "pulse"
  | "whatsapp"
  | "telegram"
  | "instagram"
  | "messenger"
  | "sms";

export type Screen = "landing" | "discovery" | "chat";

export type SidebarFilter = "all" | "pulse" | "wa_tg" | "ig_fb" | "sms";

export interface User {
  name: string;
  email: string;
  avatar: string;
}

export interface Contact {
  id: string;
  name: string;
  platform: Platform;
  handle: string;
  /** E.164-ish phone when known (WhatsApp / SMS / synced) */
  phone: string;
  /** Email when known (Pulse peer or synced phonebook) */
  email?: string;
  avatar: string;
  status: string;
  bridgeConnected: boolean;
  invitationSent: boolean;
  platformName: string;
  /** Pulse↔Pulse peer account email */
  peerEmail?: string;
}

/** How the outbound message was (or will be) delivered. */
export type DeliveryStatus =
  | "local"
  | "pulse"
  | "whatsapp_handoff"
  | "whatsapp_api"
  | "sms_handoff"
  | "simulated";

export interface Message {
  id: string;
  sender: "me" | "them";
  text: string;
  time: string;
  failed?: boolean;
  /** Outbound delivery truth — never claim platform delivery without this. */
  delivery?: DeliveryStatus;
}
