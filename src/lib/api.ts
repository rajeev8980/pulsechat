import type { Contact, Message, User } from "./types";

async function request<T>(
  path: string,
  init?: RequestInit,
): Promise<T> {
  const res = await fetch(path, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers || {}),
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
}

export const api = {
  me: () => request<{ user: User | null }>("/api/auth/me"),
  login: (body: { name: string; email: string; avatar: string }) =>
    request<{ user: User }>("/api/auth/login", {
      method: "POST",
      body: JSON.stringify(body),
    }),
  logout: () =>
    request<{ ok: boolean }>("/api/auth/logout", { method: "POST" }),
  contacts: () => request<{ contacts: Contact[] }>("/api/contacts"),
  resync: () =>
    request<{ contacts: Contact[] }>("/api/contacts/resync", {
      method: "POST",
    }),
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
    }>(`/api/messages/${contactId}`, {
      method: "POST",
      body: JSON.stringify({ text }),
    }),
  retryMessage: (contactId: string, messageId: string) =>
    request<{ message: Message; contact: Contact; autoReplyPending?: boolean }>(
      `/api/messages/${contactId}/retry`,
      {
        method: "POST",
        body: JSON.stringify({ messageId }),
      },
    ),
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
