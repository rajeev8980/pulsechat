import {
  createInitialMessages,
  DEFAULT_USER,
  INITIAL_CONTACTS,
} from "@/lib/data";
import { getAutoReply } from "@/lib/platform";
import type { Contact, Message, User } from "@/lib/types";

export interface Session {
  id: string;
  user: User;
  createdAt: number;
}

interface StoreState {
  sessions: Map<string, Session>;
  contacts: Contact[];
  messages: Record<string, Message[]>;
  syncFailOnce: boolean;
}

declare global {
  // eslint-disable-next-line no-var
  var __pulseStore: StoreState | undefined;
}

function createState(): StoreState {
  return {
    sessions: new Map(),
    contacts: INITIAL_CONTACTS.map((c) => ({ ...c })),
    messages: createInitialMessages(),
    syncFailOnce: false,
  };
}

export function getStore(): StoreState {
  if (!globalThis.__pulseStore) {
    globalThis.__pulseStore = createState();
  }
  return globalThis.__pulseStore;
}

function uid(prefix: string) {
  return `${prefix}-${Math.random().toString(36).slice(2, 10)}`;
}

function nowTime() {
  return new Date().toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function createSession(user: User): Session {
  const store = getStore();
  const session: Session = {
    id: uid("sess"),
    user,
    createdAt: Date.now(),
  };
  store.sessions.set(session.id, session);
  return session;
}

export function getSession(sessionId: string | undefined): Session | null {
  if (!sessionId) return null;
  return getStore().sessions.get(sessionId) ?? null;
}

export function destroySession(sessionId: string | undefined) {
  if (!sessionId) return;
  getStore().sessions.delete(sessionId);
}

export function listContacts(): Contact[] {
  return getStore().contacts.map((c) => ({ ...c }));
}

export function getContact(id: string): Contact | undefined {
  const c = getStore().contacts.find((x) => x.id === id);
  return c ? { ...c } : undefined;
}

export function resyncContacts(): { ok: true; contacts: Contact[] } | { ok: false; error: string } {
  const store = getStore();
  // Deterministic occasional failure: fail every 8th resync attempt via flip flag
  store.syncFailOnce = !store.syncFailOnce;
  if (store.syncFailOnce && Math.random() < 0.15) {
    return {
      ok: false,
      error: "Phonebook sync timed out. Check your connection and retry.",
    };
  }
  store.contacts = INITIAL_CONTACTS.map((c) => ({ ...c }));
  return { ok: true, contacts: listContacts() };
}

export function getMessages(contactId: string): Message[] {
  return [...(getStore().messages[contactId] || [])];
}

export function sendMessage(
  contactId: string,
  text: string,
):
  | { ok: true; message: Message; contact: Contact; invitationSent?: boolean }
  | { ok: false; error: string; message?: Message } {
  const store = getStore();
  const contact = store.contacts.find((c) => c.id === contactId);
  if (!contact) return { ok: false, error: "Contact not found" };

  const trimmed = text.trim();
  if (!trimmed) return { ok: false, error: "Message cannot be empty" };

  const shouldFail = trimmed.toLowerCase() === "/fail";
  const displayText = shouldFail
    ? trimmed.replace(/^\/fail\s*/i, "") || "Failed test message"
    : trimmed;

  const message: Message = {
    id: uid("msg"),
    sender: "me",
    text: displayText,
    time: nowTime(),
    failed: shouldFail || undefined,
  };

  if (!store.messages[contactId]) store.messages[contactId] = [];
  store.messages[contactId].push(message);

  if (shouldFail) {
    return {
      ok: false,
      error: "Message failed to deliver. Tap Retry to send again.",
      message,
    };
  }

  let invitationSent = false;
  if (!contact.bridgeConnected && contact.platform !== "pulse") {
    contact.invitationSent = true;
    invitationSent = true;
  }

  return {
    ok: true,
    message,
    contact: { ...contact },
    invitationSent,
  };
}

export function retryMessage(
  contactId: string,
  messageId: string,
):
  | { ok: true; message: Message; contact: Contact }
  | { ok: false; error: string } {
  const store = getStore();
  const thread = store.messages[contactId] || [];
  const failed = thread.find((m) => m.id === messageId && m.failed);
  if (!failed) return { ok: false, error: "Failed message not found" };

  store.messages[contactId] = thread.filter((m) => m.id !== messageId);
  const result = sendMessage(contactId, failed.text);
  if (!result.ok) {
    return { ok: false, error: result.error };
  }
  return { ok: true, message: result.message, contact: result.contact };
}

export function acceptBridge(contactId: string): Contact | null {
  const store = getStore();
  const contact = store.contacts.find((c) => c.id === contactId);
  if (!contact) return null;
  contact.bridgeConnected = true;
  contact.invitationSent = true;
  if (contact.platform !== "pulse" && !contact.status.includes("Connected")) {
    contact.status = `${contact.platformName} Bridge Connected`;
  }
  return { ...contact };
}

export function simulateReply(
  contactId: string,
): { contact: Contact; message: Message } | null {
  const store = getStore();
  const contact = store.contacts.find((c) => c.id === contactId);
  if (!contact) return null;
  contact.bridgeConnected = true;
  contact.invitationSent = true;

  const message: Message = {
    id: uid("msg"),
    sender: "them",
    text: getAutoReply(contact.platform),
    time: nowTime(),
  };
  if (!store.messages[contactId]) store.messages[contactId] = [];
  store.messages[contactId].push(message);
  return { contact: { ...contact }, message };
}

export function scheduleAutoReply(
  contactId: string,
  delayMs = 1900,
): Promise<Message | null> {
  return new Promise((resolve) => {
    setTimeout(() => {
      const store = getStore();
      const contact = store.contacts.find((c) => c.id === contactId);
      if (!contact || !contact.bridgeConnected) {
        resolve(null);
        return;
      }
      const message: Message = {
        id: uid("msg"),
        sender: "them",
        text: getAutoReply(contact.platform),
        time: nowTime(),
      };
      if (!store.messages[contactId]) store.messages[contactId] = [];
      store.messages[contactId].push(message);
      resolve(message);
    }, delayMs);
  });
}

export { DEFAULT_USER };
