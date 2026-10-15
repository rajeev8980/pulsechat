/**
 * PulseChat Common Messaging Server / API
 * Platform A (PulseChat) ↔ Gateway ↔ Platform B (Pulse / WhatsApp / Telegram / …)
 */

import type { Contact, DeliveryStatus, Message, Platform } from "@/lib/types";
import {
  getContact,
  sendMessage,
} from "@/server/store";
import {
  isWhatsAppCloudConfigured,
  sendWhatsAppCloudMessage,
} from "@/server/whatsapp-cloud";
import { toWhatsAppPhone } from "@/lib/whatsapp";
import fs from "fs";
import path from "path";

export type RouteStatus =
  | "delivered_pulse"
  | "handoff_whatsapp"
  | "handoff_telegram"
  | "handoff_sms"
  | "api_whatsapp"
  | "queued_local"
  | "failed";

export interface GatewayRouteEvent {
  id: string;
  createdAt: number;
  fromEmail: string;
  fromPlatform: "pulse";
  toPlatform: Platform;
  contactId: string;
  contactName: string;
  text: string;
  status: RouteStatus;
  messageId?: string;
  detail?: string;
}

interface GatewayState {
  events: GatewayRouteEvent[];
}

declare global {
  // eslint-disable-next-line no-var
  var __pulseGateway: GatewayState | undefined;
}

const PERSIST = path.join("/tmp", "pulsechat-gateway.json");

function load(): GatewayState {
  if (globalThis.__pulseGateway) return globalThis.__pulseGateway;
  try {
    if (fs.existsSync(PERSIST)) {
      const raw = JSON.parse(fs.readFileSync(PERSIST, "utf8")) as GatewayState;
      globalThis.__pulseGateway = {
        events: Array.isArray(raw.events) ? raw.events : [],
      };
      return globalThis.__pulseGateway;
    }
  } catch {
    // ignore
  }
  globalThis.__pulseGateway = { events: [] };
  return globalThis.__pulseGateway;
}

function persist() {
  try {
    fs.writeFileSync(PERSIST, JSON.stringify(load()), "utf8");
  } catch {
    // ignore
  }
}

function uid() {
  return `gw-${Math.random().toString(36).slice(2, 10)}`;
}

function statusFromDelivery(
  platform: Platform,
  delivery?: DeliveryStatus,
  pulseDelivered?: boolean,
): RouteStatus {
  if (pulseDelivered || delivery === "pulse") return "delivered_pulse";
  if (delivery === "whatsapp_api") return "api_whatsapp";
  if (delivery === "whatsapp_handoff") return "handoff_whatsapp";
  if (delivery === "telegram_handoff") return "handoff_telegram";
  if (delivery === "sms_handoff") return "handoff_sms";
  if (platform === "whatsapp") return "handoff_whatsapp";
  if (platform === "telegram") return "handoff_telegram";
  if (platform === "sms") return "handoff_sms";
  return "queued_local";
}

export function gatewayStatus() {
  const g = load();
  return {
    service: "pulsechat-gateway",
    role: "Common messaging server / API",
    description: "Receives, stores, and routes messages between platforms.",
    platforms: {
      platformA: "PulseChat (web / Android PWA)",
      platformB: [
        "pulse",
        "whatsapp",
        "telegram",
        "instagram",
        "messenger",
        "sms",
      ],
    },
    whatsappCloudConfigured: isWhatsAppCloudConfigured(),
    routedLastHour: g.events.filter((e) => Date.now() - e.createdAt < 3600_000)
      .length,
    totalRouted: g.events.length,
    ok: true,
  };
}

export function listGatewayEvents(ownerEmail: string, limit = 40) {
  const email = ownerEmail.trim().toLowerCase();
  return load()
    .events.filter((e) => e.fromEmail === email)
    .slice(-limit)
    .reverse();
}

export async function gatewaySend(input: {
  ownerEmail: string;
  contactId: string;
  text: string;
}): Promise<
  | {
      ok: true;
      message: Message;
      contact: Contact;
      route: GatewayRouteEvent;
      needsClientHandoff?: "whatsapp" | "sms" | "telegram" | null;
      pulseDelivered?: boolean;
      whatsappCloudConfigured?: boolean;
      cloudError?: string;
      invitationSent?: boolean;
      autoReplyPending: false;
    }
  | {
      ok: false;
      error: string;
      message?: Message;
      route?: GatewayRouteEvent;
    }
> {
  const contact = getContact(input.ownerEmail, input.contactId);
  if (!contact) {
    return { ok: false, error: "Contact not found" };
  }

  // Optional WhatsApp Cloud API path through the hub
  if (contact.platform === "whatsapp" && isWhatsAppCloudConfigured()) {
    const phone = toWhatsAppPhone(contact.phone || contact.handle);
    if (phone) {
      const cloud = await sendWhatsAppCloudMessage(phone, input.text.trim());
      if (cloud.ok) {
        const result = sendMessage(input.ownerEmail, input.contactId, input.text, {
          delivery: "whatsapp_api",
        });
        if (!result.ok) {
          return { ok: false, error: result.error, message: result.message };
        }
        const route = recordRoute({
          fromEmail: input.ownerEmail,
          contact,
          text: input.text,
          status: "api_whatsapp",
          messageId: result.message.id,
          detail: `Cloud message ${cloud.messageId}`,
        });
        return {
          ok: true,
          message: result.message,
          contact: result.contact,
          route,
          needsClientHandoff: null,
          whatsappCloudConfigured: true,
          invitationSent: result.invitationSent,
          autoReplyPending: false,
        };
      }
      // fall through to handoff with cloud error
      const result = sendMessage(input.ownerEmail, input.contactId, input.text, {
        delivery: "whatsapp_handoff",
      });
      if (!result.ok) {
        return { ok: false, error: result.error, message: result.message };
      }
      const route = recordRoute({
        fromEmail: input.ownerEmail,
        contact,
        text: input.text,
        status: "handoff_whatsapp",
        messageId: result.message.id,
        detail: cloud.error,
      });
      return {
        ok: true,
        message: result.message,
        contact: result.contact,
        route,
        needsClientHandoff: "whatsapp",
        cloudError: cloud.error,
        whatsappCloudConfigured: true,
        invitationSent: result.invitationSent,
        autoReplyPending: false,
      };
    }
  }

  const result = sendMessage(input.ownerEmail, input.contactId, input.text);
  if (!result.ok) {
    const route = recordRoute({
      fromEmail: input.ownerEmail,
      contact,
      text: input.text,
      status: "failed",
      messageId: result.message?.id,
      detail: result.error,
    });
    return {
      ok: false,
      error: result.error,
      message: result.message,
      route,
    };
  }

  const status = statusFromDelivery(
    contact.platform,
    result.message.delivery,
    result.pulseDelivered,
  );
  const route = recordRoute({
    fromEmail: input.ownerEmail,
    contact,
    text: input.text,
    status,
    messageId: result.message.id,
    detail: detailForStatus(status, contact),
  });

  return {
    ok: true,
    message: result.message,
    contact: result.contact,
    route,
    needsClientHandoff: result.needsClientHandoff ?? null,
    pulseDelivered: result.pulseDelivered,
    invitationSent: result.invitationSent,
    autoReplyPending: false,
    whatsappCloudConfigured: isWhatsAppCloudConfigured(),
  };
}

function detailForStatus(status: RouteStatus, contact: Contact): string {
  switch (status) {
    case "delivered_pulse":
      return `Routed Pulse→Pulse to ${contact.peerEmail || contact.email || contact.handle}`;
    case "handoff_whatsapp":
      return `Routed to WhatsApp handoff (${contact.phone}) — user confirms Send on device`;
    case "handoff_telegram":
      return `Routed to Telegram handoff (${contact.handle || contact.phone})`;
    case "handoff_sms":
      return `Routed to SMS handoff (${contact.phone})`;
    case "api_whatsapp":
      return `Routed via WhatsApp Cloud API to ${contact.phone}`;
    case "queued_local":
      return `Stored on gateway for ${contact.platformName} (no live egress API)`;
    default:
      return "Routing failed";
  }
}

function recordRoute(input: {
  fromEmail: string;
  contact: Contact;
  text: string;
  status: RouteStatus;
  messageId?: string;
  detail?: string;
}): GatewayRouteEvent {
  const event: GatewayRouteEvent = {
    id: uid(),
    createdAt: Date.now(),
    fromEmail: input.fromEmail.trim().toLowerCase(),
    fromPlatform: "pulse",
    toPlatform: input.contact.platform,
    contactId: input.contact.id,
    contactName: input.contact.name,
    text: input.text.trim().slice(0, 500),
    status: input.status,
    messageId: input.messageId,
    detail: input.detail,
  };
  const g = load();
  g.events.push(event);
  if (g.events.length > 2000) g.events = g.events.slice(-1500);
  persist();
  return event;
}
