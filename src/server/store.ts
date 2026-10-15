import fs from "fs";
import path from "path";
import {
  GUEST_USER,
  INITIAL_CONTACTS,
  PLATFORM_META,
} from "@/lib/data";
import { getAutoReply } from "@/lib/platform";
import type {
  Contact,
  DeliveryStatus,
  Message,
  Platform,
  User,
} from "@/lib/types";

export interface Session {
  id: string;
  user: User;
  createdAt: number;
}

interface StoredMessage {
  id: string;
  fromEmail: string;
  text: string;
  time: string;
  createdAt: number;
  failed?: boolean;
  delivery?: DeliveryStatus;
}

interface UserAccount {
  email: string;
  name: string;
  avatar: string;
  contacts: Contact[];
  /** Non-Pulse threads keyed by contact id */
  localThreads: Record<string, StoredMessage[]>;
}

interface StoreState {
  sessions: Map<string, Session>;
  users: Map<string, UserAccount>;
  /** Shared Pulse↔Pulse threads keyed by sorted email pair */
  pulseThreads: Map<string, StoredMessage[]>;
  syncFailOnce: boolean;
}

declare global {
  // eslint-disable-next-line no-var
  var __pulseStore: StoreState | undefined;
  // eslint-disable-next-line no-var
  var __pulseStorePersistTimer: ReturnType<typeof setTimeout> | undefined;
}

const PERSIST_PATH = path.join("/tmp", "pulsechat-store.json");

function createState(): StoreState {
  return {
    sessions: new Map(),
    users: new Map(),
    pulseThreads: new Map(),
    syncFailOnce: false,
  };
}

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

function uid(prefix: string) {
  return `${prefix}-${Math.random().toString(36).slice(2, 10)}`;
}

function normalizeDigits(raw: string) {
  const d = raw.replace(/\D/g, "");
  return d.length >= 10 && d.length <= 15 ? d : "";
}

function nowTime() {
  return new Date().toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function pulseThreadKey(a: string, b: string) {
  const x = normalizeEmail(a);
  const y = normalizeEmail(b);
  return x < y ? `${x}|${y}` : `${y}|${x}`;
}

function serialize(state: StoreState) {
  return JSON.stringify({
    sessions: [...state.sessions.entries()],
    users: [...state.users.entries()],
    pulseThreads: [...state.pulseThreads.entries()],
    syncFailOnce: state.syncFailOnce,
  });
}

function hydrate(raw: string): StoreState | null {
  try {
    const data = JSON.parse(raw) as {
      sessions?: [string, Session][];
      users?: [string, UserAccount][];
      pulseThreads?: [string, StoredMessage[]][];
      syncFailOnce?: boolean;
    };
    return {
      sessions: new Map(data.sessions || []),
      users: new Map(data.users || []),
      pulseThreads: new Map(data.pulseThreads || []),
      syncFailOnce: Boolean(data.syncFailOnce),
    };
  } catch {
    return null;
  }
}

let loadedFromDisk = false;

function loadFromDiskIfNeeded() {
  if (loadedFromDisk) return;
  loadedFromDisk = true;
  try {
    if (!fs.existsSync(PERSIST_PATH)) return;
    const raw = fs.readFileSync(PERSIST_PATH, "utf8");
    const state = hydrate(raw);
    if (state) globalThis.__pulseStore = state;
  } catch {
    // no file yet / unreadable
  }
}

function schedulePersist() {
  if (globalThis.__pulseStorePersistTimer) {
    clearTimeout(globalThis.__pulseStorePersistTimer);
  }
  globalThis.__pulseStorePersistTimer = setTimeout(() => {
    const store = globalThis.__pulseStore;
    if (!store) return;
    try {
      fs.writeFileSync(PERSIST_PATH, serialize(store), "utf8");
    } catch {
      // ignore persist errors in ephemeral envs
    }
  }, 50);
}

export function getStore(): StoreState {
  loadFromDiskIfNeeded();
  if (!globalThis.__pulseStore) {
    globalThis.__pulseStore = createState();
  }
  return globalThis.__pulseStore;
}

function ensureUser(user: User): UserAccount {
  const store = getStore();
  const email = normalizeEmail(user.email);
  let account = store.users.get(email);
  if (!account) {
    account = {
      email,
      name: user.name,
      avatar: user.avatar,
      contacts: INITIAL_CONTACTS.map((c) => ({ ...c })),
      localThreads: {},
    };
    store.users.set(email, account);
  } else {
    account.name = user.name || account.name;
    account.avatar = user.avatar || account.avatar;
  }
  schedulePersist();
  return account;
}

function getAccount(ownerEmail: string): UserAccount | null {
  return getStore().users.get(normalizeEmail(ownerEmail)) ?? null;
}

function requireAccount(ownerEmail: string): UserAccount {
  const existing = getAccount(ownerEmail);
  if (existing) return existing;
  return ensureUser({
    name: ownerEmail.split("@")[0],
    email: ownerEmail,
    avatar: `https://api.dicebear.com/9.x/initials/svg?seed=${encodeURIComponent(ownerEmail)}&backgroundColor=4f46e5`,
  });
}

function toViewMessage(ownerEmail: string, m: StoredMessage): Message {
  const me = normalizeEmail(ownerEmail);
  return {
    id: m.id,
    sender: normalizeEmail(m.fromEmail) === me ? "me" : "them",
    text: m.text,
    time: m.time,
    failed: m.failed,
    delivery: m.delivery,
  };
}

export function createSession(user: User): Session {
  const store = getStore();
  const normalized = {
    ...user,
    email: normalizeEmail(user.email),
  };
  ensureUser(normalized);
  const session: Session = {
    id: uid("sess"),
    user: normalized,
    createdAt: Date.now(),
  };
  store.sessions.set(session.id, session);
  schedulePersist();
  return session;
}

export function getSession(sessionId: string | undefined): Session | null {
  if (!sessionId) return null;
  return getStore().sessions.get(sessionId) ?? null;
}

export function destroySession(sessionId: string | undefined) {
  if (!sessionId) return;
  getStore().sessions.delete(sessionId);
  schedulePersist();
}

export function listContacts(ownerEmail: string): Contact[] {
  const account = requireAccount(ownerEmail);
  return account.contacts.map((c) => ({ ...c }));
}

export function getContact(
  ownerEmail: string,
  id: string,
): Contact | undefined {
  const account = requireAccount(ownerEmail);
  const c = account.contacts.find((x) => x.id === id);
  return c ? { ...c } : undefined;
}

export function resyncContacts(
  ownerEmail: string,
): { ok: true; contacts: Contact[] } | { ok: false; error: string } {
  const store = getStore();
  store.syncFailOnce = !store.syncFailOnce;
  if (store.syncFailOnce && Math.random() < 0.08) {
    return {
      ok: false,
      error: "Phonebook sync timed out. Check your connection and retry.",
    };
  }
  schedulePersist();
  return { ok: true, contacts: listContacts(ownerEmail) };
}

function ensurePulsePeerContact(
  owner: UserAccount,
  peer: UserAccount,
  extras?: { phone?: string },
): Contact {
  const phone = extras?.phone?.trim() || "";
  const existing = owner.contacts.find(
    (c) =>
      c.platform === "pulse" &&
      c.peerEmail &&
      normalizeEmail(c.peerEmail) === peer.email,
  );
  if (existing) {
    existing.name = peer.name;
    existing.avatar = peer.avatar;
    existing.handle = peer.email;
    existing.email = peer.email;
    if (phone) existing.phone = phone;
    else if (!existing.phone || existing.phone.includes("@")) {
      existing.phone = phone;
    }
    existing.status = phone
      ? "Pulse • Online · phone synced"
      : "Pulse • Online";
    existing.bridgeConnected = true;
    existing.invitationSent = true;
    return existing;
  }

  const contact: Contact = {
    id: uid("c"),
    name: peer.name,
    platform: "pulse",
    handle: peer.email,
    email: peer.email,
    phone,
    peerEmail: peer.email,
    avatar: peer.avatar,
    status: phone ? "Pulse • Online · phone synced" : "Pulse • Online",
    bridgeConnected: true,
    invitationSent: true,
    platformName: PLATFORM_META.pulse.platformName,
  };
  owner.contacts.unshift(contact);
  return contact;
}

function findByEmail(owner: UserAccount, email: string): Contact | undefined {
  const e = normalizeEmail(email);
  return owner.contacts.find(
    (c) =>
      (c.email && normalizeEmail(c.email) === e) ||
      (c.peerEmail && normalizeEmail(c.peerEmail) === e) ||
      (c.handle.includes("@") && normalizeEmail(c.handle) === e),
  );
}

function findByPhone(owner: UserAccount, phone: string): Contact | undefined {
  const d = normalizeDigits(phone) || phone.replace(/\D/g, "");
  if (d.length < 7) return undefined;
  return owner.contacts.find((c) => {
    const cd = (c.phone || "").replace(/\D/g, "");
    return cd.length >= 7 && (cd === d || cd.endsWith(d) || d.endsWith(cd));
  });
}

export function addContact(
  ownerEmail: string,
  input: {
    name: string;
    platform?: Platform;
    handle?: string;
    phone?: string;
    email?: string;
  },
): Contact | { error: string } {
  const owner = requireAccount(ownerEmail);
  const name = input.name.trim();
  if (!name) return { error: "Name is required" };

  const emailRaw = (
    input.email ||
    (input.handle?.includes("@") ? input.handle : "") ||
    ""
  ).trim();
  const phoneRaw = (input.phone || "").trim();

  let platform = input.platform;
  if (!platform) {
    if (emailRaw.includes("@")) platform = "pulse";
    else if (phoneRaw) platform = "whatsapp";
    else return { error: "Provide an email and/or phone number" };
  }

  // Pulse ↔ Pulse: contact by peer email (+ optional phone)
  if (platform === "pulse") {
    const peerRaw = emailRaw || (input.handle || "").trim();
    if (!peerRaw.includes("@")) {
      return {
        error:
          "Pulse contacts need their PulseChat email (e.g. friend@email.com).",
      };
    }
    const peerEmail = normalizeEmail(peerRaw);
    if (peerEmail === normalizeEmail(ownerEmail)) {
      return { error: "You cannot add yourself as a Pulse contact." };
    }

    const store = getStore();
    let peer = store.users.get(peerEmail);
    if (!peer) {
      peer = {
        email: peerEmail,
        name: name,
        avatar: `https://api.dicebear.com/9.x/initials/svg?seed=${encodeURIComponent(name)}&backgroundColor=4f46e5`,
        contacts: [],
        localThreads: {},
      };
      store.users.set(peerEmail, peer);
    } else if (name && peer.name === peer.email.split("@")[0]) {
      peer.name = name;
    }

    const mine = ensurePulsePeerContact(owner, peer, { phone: phoneRaw });
    ensurePulsePeerContact(peer, owner);
    mine.name = name;
    if (phoneRaw) mine.phone = phoneRaw;
    mine.email = peerEmail;
    schedulePersist();
    return { ...mine };
  }

  const meta = PLATFORM_META[platform];
  const phone = phoneRaw || (input.handle?.trim() || "");
  const handle =
    emailRaw ||
    phone ||
    `@${name.toLowerCase().replace(/\s+/g, "_")}`;

  if (
    (platform === "whatsapp" || platform === "sms") &&
    !normalizeDigits(phone)
  ) {
    return {
      error:
        "WhatsApp/SMS contacts need a phone number with country code (e.g. +919334803286).",
    };
  }

  if (platform === "telegram") {
    const target = (phone || handle || emailRaw || "").trim();
    const isUser =
      /^@?[A-Za-z]\w{3,31}$/.test(target.replace(/^@/, "")) &&
      !/^\d+$/.test(target.replace(/^@/, ""));
    const isPhone = Boolean(normalizeDigits(target));
    if (!isUser && !isPhone) {
      return {
        error:
          "Telegram contacts need an @username or phone with country code.",
      };
    }
  }

  const existing =
    (emailRaw && findByEmail(owner, emailRaw)) ||
    (phone && findByPhone(owner, phone));
  if (existing) {
    existing.name = name || existing.name;
    if (emailRaw) existing.email = normalizeEmail(emailRaw);
    if (phone) existing.phone = phone;
    existing.handle = existing.email || existing.phone || existing.handle;
    schedulePersist();
    return { ...existing };
  }

  const contact: Contact = {
    id: uid("c"),
    name,
    platform,
    handle,
    phone,
    email: emailRaw ? normalizeEmail(emailRaw) : undefined,
    avatar: `https://api.dicebear.com/9.x/initials/svg?seed=${encodeURIComponent(name)}&backgroundColor=6366f1`,
    status:
      platform === "whatsapp"
        ? emailRaw
          ? "WhatsApp · email+phone synced"
          : "WhatsApp • Opens on your phone"
        : platform === "sms"
          ? "SMS • Opens Messages app"
          : meta.status,
    bridgeConnected: false,
    invitationSent: false,
    platformName: meta.platformName,
  };

  owner.contacts.unshift(contact);
  if (!owner.localThreads[contact.id]) owner.localThreads[contact.id] = [];
  schedulePersist();
  return contact;
}

/** Bulk import from device phonebook / paste — keeps email and phone. */
export function importContacts(
  ownerEmail: string,
  items: Array<{
    name?: string;
    email?: string;
    phone?: string;
    platform?: Platform;
  }>,
): {
  imported: number;
  updated: number;
  skipped: number;
  contacts: Contact[];
} {
  let imported = 0;
  let updated = 0;
  let skipped = 0;
  const owner = requireAccount(ownerEmail);
  const before = new Set(owner.contacts.map((c) => c.id));

  for (const item of items) {
    const email = item.email?.trim();
    const phone = item.phone?.trim();
    const name =
      item.name?.trim() ||
      (email
        ? email
            .split("@")[0]
            .replace(/[._]/g, " ")
            .replace(/\b\w/g, (c) => c.toUpperCase())
        : phone) ||
      "";

    if (!email && !phone) {
      skipped += 1;
      continue;
    }

    // Prefer Pulse when email exists so peer chat works; keep phone too.
    const platform: Platform =
      item.platform || (email?.includes("@") ? "pulse" : "whatsapp");

    const beforeIds = new Set(owner.contacts.map((c) => c.id));
    const result = addContact(ownerEmail, {
      name,
      platform,
      email,
      phone,
      handle: email || phone,
    });
    if ("error" in result) {
      skipped += 1;
      continue;
    }
    if (beforeIds.has(result.id) || before.has(result.id)) updated += 1;
    else imported += 1;
  }

  schedulePersist();
  return {
    imported,
    updated,
    skipped,
    contacts: listContacts(ownerEmail),
  };
}

export function getMessages(ownerEmail: string, contactId: string): Message[] {
  const owner = requireAccount(ownerEmail);
  const contact = owner.contacts.find((c) => c.id === contactId);
  if (!contact) return [];

  if (contact.platform === "pulse" && contact.peerEmail) {
    const key = pulseThreadKey(ownerEmail, contact.peerEmail);
    const thread = getStore().pulseThreads.get(key) || [];
    return thread.map((m) => toViewMessage(ownerEmail, m));
  }

  return (owner.localThreads[contactId] || []).map((m) =>
    toViewMessage(ownerEmail, m),
  );
}

export function sendMessage(
  ownerEmail: string,
  contactId: string,
  text: string,
  opts?: { delivery?: DeliveryStatus },
):
  | {
      ok: true;
      message: Message;
      contact: Contact;
      invitationSent?: boolean;
      needsClientHandoff?: "whatsapp" | "sms" | "telegram";
      pulseDelivered?: boolean;
    }
  | { ok: false; error: string; message?: Message } {
  const owner = requireAccount(ownerEmail);
  const contact = owner.contacts.find((c) => c.id === contactId);
  if (!contact) return { ok: false, error: "Contact not found" };

  const trimmed = text.trim();
  if (!trimmed) return { ok: false, error: "Message cannot be empty" };

  const shouldFail = trimmed.toLowerCase() === "/fail";
  const displayText = shouldFail
    ? trimmed.replace(/^\/fail\s*/i, "") || "Failed test message"
    : trimmed;

  // Pulse ↔ Pulse real delivery into shared thread
  if (contact.platform === "pulse" && contact.peerEmail && !shouldFail) {
    const store = getStore();
    const peerEmail = normalizeEmail(contact.peerEmail);
    let peer = store.users.get(peerEmail);
    if (!peer) {
      peer = {
        email: peerEmail,
        name: contact.name,
        avatar: contact.avatar,
        contacts: [],
        localThreads: {},
      };
      store.users.set(peerEmail, peer);
    }
    ensurePulsePeerContact(peer, owner);
    contact.status = "Pulse • Online";
    contact.bridgeConnected = true;

    const stored: StoredMessage = {
      id: uid("msg"),
      fromEmail: normalizeEmail(ownerEmail),
      text: displayText,
      time: nowTime(),
      createdAt: Date.now(),
      delivery: "pulse",
    };
    const key = pulseThreadKey(ownerEmail, peerEmail);
    const thread = store.pulseThreads.get(key) || [];
    thread.push(stored);
    store.pulseThreads.set(key, thread);
    schedulePersist();

    return {
      ok: true,
      message: toViewMessage(ownerEmail, stored),
      contact: { ...contact },
      pulseDelivered: true,
    };
  }

  let delivery: DeliveryStatus = opts?.delivery || "local";
  let needsClientHandoff: "whatsapp" | "sms" | "telegram" | undefined;
  if (!opts?.delivery && !shouldFail) {
    if (contact.platform === "whatsapp") {
      needsClientHandoff = "whatsapp";
      delivery = "whatsapp_handoff";
    } else if (contact.platform === "telegram") {
      needsClientHandoff = "telegram";
      delivery = "telegram_handoff";
    } else if (contact.platform === "sms") {
      needsClientHandoff = "sms";
      delivery = "sms_handoff";
    } else if (contact.platform === "pulse") {
      delivery = "local";
    }
  }

  const stored: StoredMessage = {
    id: uid("msg"),
    fromEmail: normalizeEmail(ownerEmail),
    text: displayText,
    time: nowTime(),
    createdAt: Date.now(),
    failed: shouldFail || undefined,
    delivery: shouldFail ? undefined : delivery,
  };

  if (!owner.localThreads[contactId]) owner.localThreads[contactId] = [];
  owner.localThreads[contactId].push(stored);

  if (shouldFail) {
    schedulePersist();
    return {
      ok: false,
      error: "Message failed to deliver. Tap Retry to send again.",
      message: toViewMessage(ownerEmail, stored),
    };
  }

  let invitationSent = false;
  if (!contact.bridgeConnected && contact.platform !== "pulse") {
    contact.invitationSent = true;
    invitationSent = true;
  }

  schedulePersist();
  return {
    ok: true,
    message: toViewMessage(ownerEmail, stored),
    contact: { ...contact },
    invitationSent,
    needsClientHandoff,
  };
}

export function updateMessageDelivery(
  ownerEmail: string,
  contactId: string,
  messageId: string,
  delivery: DeliveryStatus,
): Message | null {
  const owner = requireAccount(ownerEmail);
  const contact = owner.contacts.find((c) => c.id === contactId);
  if (!contact) return null;

  if (contact.platform === "pulse" && contact.peerEmail) {
    const key = pulseThreadKey(ownerEmail, contact.peerEmail);
    const thread = getStore().pulseThreads.get(key);
    const msg = thread?.find((m) => m.id === messageId);
    if (!msg) return null;
    msg.delivery = delivery;
    msg.failed = undefined;
    schedulePersist();
    return toViewMessage(ownerEmail, msg);
  }

  const thread = owner.localThreads[contactId];
  const msg = thread?.find((m) => m.id === messageId);
  if (!msg) return null;
  msg.delivery = delivery;
  msg.failed = undefined;
  schedulePersist();
  return toViewMessage(ownerEmail, msg);
}

export function retryMessage(
  ownerEmail: string,
  contactId: string,
  messageId: string,
):
  | { ok: true; message: Message; contact: Contact }
  | { ok: false; error: string } {
  const owner = requireAccount(ownerEmail);
  const contact = owner.contacts.find((c) => c.id === contactId);
  if (!contact) return { ok: false, error: "Contact not found" };

  const thread =
    contact.platform === "pulse" && contact.peerEmail
      ? getStore().pulseThreads.get(
          pulseThreadKey(ownerEmail, contact.peerEmail),
        ) || []
      : owner.localThreads[contactId] || [];

  const failed = thread.find((m) => m.id === messageId && m.failed);
  if (!failed) return { ok: false, error: "Failed message not found" };

  if (contact.platform === "pulse" && contact.peerEmail) {
    const key = pulseThreadKey(ownerEmail, contact.peerEmail);
    getStore().pulseThreads.set(
      key,
      thread.filter((m) => m.id !== messageId),
    );
  } else {
    owner.localThreads[contactId] = thread.filter((m) => m.id !== messageId);
  }

  const result = sendMessage(ownerEmail, contactId, failed.text);
  if (!result.ok) {
    return { ok: false, error: result.error };
  }
  return { ok: true, message: result.message, contact: result.contact };
}

export function acceptBridge(
  ownerEmail: string,
  contactId: string,
): Contact | null {
  const owner = requireAccount(ownerEmail);
  const contact = owner.contacts.find((c) => c.id === contactId);
  if (!contact) return null;
  contact.bridgeConnected = true;
  contact.invitationSent = true;
  if (contact.platform !== "pulse" && !contact.status.includes("Connected")) {
    contact.status = `${contact.platformName} Bridge Connected`;
  }
  schedulePersist();
  return { ...contact };
}

export function simulateReply(
  ownerEmail: string,
  contactId: string,
): { contact: Contact; message: Message } | null {
  const owner = requireAccount(ownerEmail);
  const contact = owner.contacts.find((c) => c.id === contactId);
  if (!contact) return null;
  contact.bridgeConnected = true;
  contact.invitationSent = true;

  const stored: StoredMessage = {
    id: uid("msg"),
    fromEmail: "simulator@pulsechat.local",
    text: `[Simulated] ${getAutoReply(contact.platform)}`,
    time: nowTime(),
    createdAt: Date.now(),
    delivery: "simulated",
  };

  if (contact.platform === "pulse" && contact.peerEmail) {
    // For pulse, simulate as if peer sent it
    stored.fromEmail = normalizeEmail(contact.peerEmail);
    const key = pulseThreadKey(ownerEmail, contact.peerEmail);
    const store = getStore();
    const thread = store.pulseThreads.get(key) || [];
    thread.push(stored);
    store.pulseThreads.set(key, thread);
  } else {
    if (!owner.localThreads[contactId]) owner.localThreads[contactId] = [];
    owner.localThreads[contactId].push(stored);
  }

  schedulePersist();
  return {
    contact: { ...contact },
    message: toViewMessage(ownerEmail, stored),
  };
}

export function scheduleAutoReply(
  _ownerEmail: string,
  _contactId: string,
  _delayMs = 1900,
): Promise<Message | null> {
  // Disabled — fake auto-replies looked like real delivery.
  return Promise.resolve(null);
}

/** Lookup registered Pulse users (for discovery helper). */
export function findPulseUser(email: string): User | null {
  const account = getStore().users.get(normalizeEmail(email));
  if (!account) return null;
  return {
    name: account.name,
    email: account.email,
    avatar: account.avatar,
  };
}

export { GUEST_USER };
