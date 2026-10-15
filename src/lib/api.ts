import type { Contact, Message, Platform, User } from "./types";

const DEFAULT_TIMEOUT_MS = 8000;

async function request<T>(
  path: string,
  init?: RequestInit & { timeoutMs?: number },
): Promise<T> {
  const { timeoutMs = DEFAULT_TIMEOUT_MS, ...rest } = init || {};
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const res = await fetch(path, {
      ...rest,
      signal: rest.signal ?? controller.signal,
      headers: {
        "Content-Type": "application/json",
        ...(rest.headers || {}),
      },
      credentials: "same-origin",
    });

    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      const err = new Error(
        (data as { error?: string }).error || `Request failed (${res.status})`,
      ) as Error & { status?: number; data?: unknown };
      err.status = res.status;
      err.data = data;
      throw err;
    }
    return data as T;
  } catch (e) {
    if (e instanceof DOMException && e.name === "AbortError") {
      throw new Error("Request timed out — check your connection and retry.");
    }
    if (e instanceof TypeError) {
      // Browser "Failed to fetch" — usually offline or stale installed PWA URL
      throw new Error(
        "Can't reach PulseChat server. Open the latest live link in Chrome (not an old home-screen icon) and try again.",
      );
    }
    throw e;
  } finally {
    clearTimeout(timer);
  }
}

export const api = {
  me: () =>
    request<{ user: User | null }>("/api/auth/me", { timeoutMs: 2500 }),
  version: () =>
    request<{ version: string; buildId: string }>("/api/version", {
      timeoutMs: 3000,
    }),
  login: (body: {
    name: string;
    email: string;
    avatar: string;
    phone?: string;
  }) =>
    request<{ user: User }>("/api/auth/login", {
      method: "POST",
      body: JSON.stringify(body),
      timeoutMs: 15_000,
    }),
  logout: () =>
    request<{ ok: boolean }>("/api/auth/logout", { method: "POST" }),
  contacts: () => request<{ contacts: Contact[] }>("/api/contacts"),
  addContact: (body: {
    name: string;
    platform?: Platform;
    handle?: string;
    phone?: string;
    email?: string;
  }) =>
    request<{ contact: Contact }>("/api/contacts", {
      method: "POST",
      body: JSON.stringify(body),
    }),
  importContacts: (
    contacts: Array<{
      name?: string;
      email?: string;
      phone?: string;
      platform?: Platform;
    }>,
  ) =>
    request<{
      imported: number;
      updated: number;
      skipped: number;
      availableOnPulse: number;
      contacts: Contact[];
    }>("/api/contacts/import", {
      method: "POST",
      body: JSON.stringify({ contacts }),
    }),
  resync: () =>
    request<{ contacts: Contact[]; availableOnPulse?: number }>(
      "/api/contacts/resync",
      { method: "POST" },
    ),
  messages: (contactId: string) =>
    request<{ messages: Message[]; contact: Contact }>(
      `/api/messages/${contactId}`,
    ),
  sendMessage: (contactId: string, text: string) =>
    request<{
      message: Message;
      contact: Contact;
      invitationSent?: boolean;
      autoReplyPending?: boolean;
      needsClientHandoff?: "whatsapp" | "sms" | "telegram" | null;
      cloudError?: string;
      whatsappCloudConfigured?: boolean;
      pulseDelivered?: boolean;
      route?: {
        id: string;
        status: string;
        toPlatform: string;
        detail?: string;
      };
      gateway?: {
        from: string;
        hub: string;
        to: string;
        status: string;
      };
    }>(`/api/gateway/send`, {
      method: "POST",
      body: JSON.stringify({ contactId, text }),
    }),
  gatewayStatus: () =>
    request<{
      ok: boolean;
      service: string;
      role: string;
      totalRouted: number;
      whatsappCloudConfigured: boolean;
    }>("/api/gateway/status", { timeoutMs: 3000 }),
  retryMessage: (contactId: string, messageId: string) =>
    request<{
      message: Message;
      contact: Contact;
      autoReplyPending?: boolean;
      needsClientHandoff?: "whatsapp" | "sms" | "telegram" | null;
    }>(`/api/messages/${contactId}/retry`, {
      method: "POST",
      body: JSON.stringify({ messageId }),
    }),
  pollMessages: (contactId: string, afterId?: string) =>
    request<{ messages: Message[]; contact: Contact }>(
      `/api/messages/${contactId}${afterId ? `?after=${afterId}` : ""}`,
    ),
  acceptBridge: (contactId: string) =>
    request<{ contact: Contact }>(`/api/bridges/${contactId}/accept`, {
      method: "POST",
    }),
  simulateReply: (contactId: string) =>
    request<{ contact: Contact; message: Message }>(
      `/api/bridges/${contactId}/simulate-reply`,
      { method: "POST" },
    ),
};
