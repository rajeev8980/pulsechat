"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { api } from "@/lib/api";
import { GUEST_USER } from "@/lib/data";
import {
  clearContactsLocal,
  loadContactsLocal,
  saveContactsLocal,
} from "@/lib/local-cache";
import type {
  Contact,
  Message,
  Platform,
  Screen,
  SidebarFilter,
  User,
} from "@/lib/types";
import { openExternalChat } from "@/lib/whatsapp";

interface PulseContextValue {
  screen: Screen;
  setScreen: (s: Screen) => void;
  user: User;
  contacts: Contact[];
  messages: Record<string, Message[]>;
  activeContactId: string;
  setActiveContactId: (id: string) => void;
  discoveryFilter: Platform | "all";
  setDiscoveryFilter: (f: Platform | "all") => void;
  discoverySearch: string;
  setDiscoverySearch: (q: string) => void;
  sidebarFilter: SidebarFilter;
  setSidebarFilter: (f: SidebarFilter) => void;
  sidebarSearch: string;
  setSidebarSearch: (q: string) => void;
  googleModalOpen: boolean;
  googleIntent: "signin" | "signup";
  openGoogleModal: (intent?: "signin" | "signup") => void;
  closeGoogleModal: () => void;
  simulatorOpen: boolean;
  openSimulator: () => void;
  closeSimulator: () => void;
  emojiOpen: boolean;
  setEmojiOpen: (v: boolean) => void;
  mobileSidebarOpen: boolean;
  setMobileSidebarOpen: (v: boolean) => void;
  toast: string | null;
  showToast: (msg: string) => void;
  isBooting: boolean;
  isSyncing: boolean;
  isLoggingIn: boolean;
  isSending: boolean;
  isAddingContact: boolean;
  typingContactId: string | null;
  syncError: string | null;
  apiError: string | null;
  /** Shown after sign-in so one tap opens the phone contact picker */
  contactFetchPrompt: boolean;
  dismissContactFetchPrompt: () => void;
  login: (user: User) => void;
  loginCustom: (email: string) => void;
  signOut: () => void;
  resyncContacts: () => void;
  importPhonebook: (
    drafts: Array<{ name?: string; email?: string; phone?: string }>,
    meta?: { withEmail?: number; phoneOnly?: number },
  ) => Promise<void>;
  clearSyncError: () => void;
  addContact: (input: {
    name: string;
    platform?: Platform;
    handle?: string;
    phone?: string;
    email?: string;
  }) => Promise<Contact | null>;
  sendMessage: (text: string) => Promise<void>;
  retryMessage: (messageId: string) => Promise<void>;
  acceptBridge: () => void;
  simulateReply: () => void;
  startChat: (contactId: string) => void;
  activeContact: Contact | undefined;
  refreshMessages: (contactId: string) => Promise<void>;
}

const PulseContext = createContext<PulseContextValue | null>(null);

function errMessage(e: unknown, fallback: string) {
  if (e instanceof Error && e.message) return e.message;
  return fallback;
}

export function PulseProvider({ children }: { children: ReactNode }) {
  const [screen, setScreen] = useState<Screen>("landing");
  const [user, setUser] = useState<User>(GUEST_USER);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [messages, setMessages] = useState<Record<string, Message[]>>({});
  const [activeContactId, setActiveContactId] = useState("");
  const [discoveryFilter, setDiscoveryFilter] = useState<Platform | "all">(
    "all",
  );
  const [discoverySearch, setDiscoverySearch] = useState("");
  const [sidebarFilter, setSidebarFilter] = useState<SidebarFilter>("all");
  const [sidebarSearch, setSidebarSearch] = useState("");
  const [googleModalOpen, setGoogleModalOpen] = useState(false);
  const [googleIntent, setGoogleIntent] = useState<"signin" | "signup">(
    "signin",
  );
  const [simulatorOpen, setSimulatorOpen] = useState(false);
  const [emojiOpen, setEmojiOpen] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(true);
  const [toast, setToast] = useState<string | null>(null);
  const [isBooting, setIsBooting] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [isAddingContact, setIsAddingContact] = useState(false);
  const [typingContactId, setTypingContactId] = useState<string | null>(null);
  const [syncError, setSyncError] = useState<string | null>(null);
  const [apiError, setApiError] = useState<string | null>(null);
  const [contactFetchPrompt, setContactFetchPrompt] = useState(false);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const dismissContactFetchPrompt = useCallback(
    () => setContactFetchPrompt(false),
    [],
  );

  const showToast = useCallback((msg: string) => {
    setToast(msg);
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), 3000);
  }, []);

  const activeContact = useMemo(
    () => contacts.find((c) => c.id === activeContactId),
    [contacts, activeContactId],
  );

  const upsertContact = useCallback((contact: Contact) => {
    setContacts((prev) => {
      const idx = prev.findIndex((c) => c.id === contact.id);
      if (idx === -1) return [...prev, contact];
      const next = [...prev];
      next[idx] = contact;
      return next;
    });
  }, []);

  const loadContacts = useCallback(async (ownerEmail?: string) => {
    const data = await api.contacts();
    let list = data.contacts;
    // Serverless cold start can empty the in-memory store — restore device cache
    if (list.length === 0 && ownerEmail) {
      const cached = loadContactsLocal(ownerEmail);
      if (cached && cached.length > 0) {
        try {
          const restored = await api.importContacts(
            cached.map((c) => ({
              name: c.name,
              email: c.email || c.peerEmail,
              phone: c.mobile || c.phone,
              platform: c.platform,
            })),
          );
          list = restored.contacts;
        } catch {
          list = cached;
        }
      }
    }
    if (ownerEmail && list.length > 0) saveContactsLocal(ownerEmail, list);
    setContacts(list);
    return list;
  }, []);

  const refreshMessages = useCallback(async (contactId: string) => {
    const data = await api.messages(contactId);
    setMessages((prev) => ({ ...prev, [contactId]: data.messages }));
    upsertContact(data.contact);
  }, [upsertContact]);

  // Live Pulse↔Pulse inbox: poll while chatting with a Pulse peer
  useEffect(() => {
    if (screen !== "chat" || !activeContactId) return;
    const contact = contacts.find((c) => c.id === activeContactId);
    if (!contact || contact.platform !== "pulse") return;

    let cancelled = false;
    let lastCount = (messages[activeContactId] || []).length;

    const tick = async () => {
      if (cancelled) return;
      try {
        const data = await api.messages(activeContactId);
        if (cancelled) return;
        setMessages((prev) => ({
          ...prev,
          [activeContactId]: data.messages,
        }));
        upsertContact(data.contact);
        if (data.messages.length > lastCount) {
          const newest = data.messages[data.messages.length - 1];
          if (newest?.sender === "them") {
            showToast(`New Pulse message from ${data.contact.name}`);
          }
          lastCount = data.messages.length;
        } else {
          lastCount = data.messages.length;
        }
      } catch {
        // ignore transient poll errors
      }
    };

    const id = setInterval(tick, 2000);
    void tick();
    return () => {
      cancelled = true;
      clearInterval(id);
    };
    // messages intentionally omitted — lastCount tracks length locally
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [screen, activeContactId, contacts, showToast, upsertContact]);

  useEffect(() => {
    let cancelled = false;
    // Escape Connecting screen quickly on mobile / flaky tunnels
    const bootWatchdog = setTimeout(() => {
      if (!cancelled) {
        setIsBooting(false);
        setApiError((prev) => prev ?? "Startup took too long — you can still sign in.");
      }
    }, 2500);

    (async () => {
      try {
        const { user: sessionUser } = await api.me();
        if (cancelled) return;
        if (sessionUser) {
          setUser(sessionUser);
          try {
            const list = await loadContacts(sessionUser.email);
            if (cancelled) return;
            const first = list[0]?.id || "";
            setActiveContactId(first);
            if (first) await refreshMessages(first);
            if (!cancelled) {
              const wanted =
                typeof window !== "undefined"
                  ? new URLSearchParams(window.location.search).get("screen")
                  : null;
              setScreen(
                wanted === "chat" && first ? "chat" : "discovery",
              );
              if (wanted === "chat") setMobileSidebarOpen(true);
            }
          } catch {
            // Session exists but hydration failed — land on discovery empty rather than hang
            if (!cancelled) {
              setApiError("Signed in, but contacts failed to load. Try re-sync.");
              setScreen("discovery");
            }
          }
        }
      } catch {
        if (!cancelled) setApiError("Could not reach PulseChat API.");
      } finally {
        clearTimeout(bootWatchdog);
        if (!cancelled) setIsBooting(false);
      }
    })();
    return () => {
      cancelled = true;
      clearTimeout(bootWatchdog);
    };
  }, [loadContacts, refreshMessages]);

  const openGoogleModal = useCallback(
    (intent: "signin" | "signup" = "signin") => {
      setGoogleIntent(intent);
      setGoogleModalOpen(true);
    },
    [],
  );

  const closeGoogleModal = useCallback(() => setGoogleModalOpen(false), []);
  const openSimulator = useCallback(() => setSimulatorOpen(true), []);
  const closeSimulator = useCallback(() => setSimulatorOpen(false), []);

  const login = useCallback(
    async (next: User) => {
      setIsLoggingIn(true);
      setApiError(null);
      try {
        const { user: loggedIn } = await api.login(next);
        setUser(loggedIn);
        const list = await loadContacts(loggedIn.email);
        const first = list[0]?.id || "";
        setActiveContactId(first);
        if (first) await refreshMessages(first);
        setGoogleModalOpen(false);
        setSyncError(null);
        const onPulse = list.filter((c) => c.onPulse).length;
        showToast(
          loggedIn.phone
            ? `Signed in · mobile ${loggedIn.phone}` +
                (onPulse
                  ? ` · ${onPulse} contact${onPulse === 1 ? "" : "s"} on PulseChat`
                  : " — fetch phonebook to see who's available")
            : `Signed in — stay logged in until you sign out`,
        );
        setScreen("discovery");
        // Android/Chrome: prompt immediately so one tap auto-opens Contact Picker
        if (list.length === 0) {
          setContactFetchPrompt(true);
        }
      } catch (e) {
        showToast(errMessage(e, "Sign-in failed"));
      } finally {
        setIsLoggingIn(false);
      }
    },
    [loadContacts, refreshMessages, showToast],
  );

  const loginCustom = useCallback(
    (email: string) => {
      const trimmed = email.trim();
      if (!trimmed || !trimmed.includes("@")) {
        showToast("Please enter a valid email address");
        return;
      }
      const raw = trimmed.split("@")[0];
      const displayName = raw
        .replace(/[._]/g, " ")
        .replace(/\b\w/g, (c) => c.toUpperCase());
      void login({
        name: displayName,
        email: trimmed,
        avatar: `https://api.dicebear.com/9.x/initials/svg?seed=${encodeURIComponent(displayName)}&backgroundColor=4f46e5`,
      });
    },
    [login, showToast],
  );

  const signOut = useCallback(async () => {
    const email = user.email;
    try {
      await api.logout();
    } catch {
      // ignore
    }
    if (email) clearContactsLocal(email);
    setUser(GUEST_USER);
    setContacts([]);
    setMessages({});
    setActiveContactId("");
    setContactFetchPrompt(false);
    setScreen("landing");
    setMobileSidebarOpen(true);
    showToast("Signed out of PulseChat");
  }, [showToast, user.email]);

  const importPhonebook = useCallback(
    async (
      drafts: Array<{ name?: string; email?: string; phone?: string }>,
      meta?: { withEmail?: number; phoneOnly?: number },
    ) => {
      setIsSyncing(true);
      setSyncError(null);
      try {
        const data = await api.importContacts(drafts);
        setContacts(data.contacts);
        if (user.email) saveContactsLocal(user.email, data.contacts);
        setContactFetchPrompt(false);
        const mobiles = drafts.filter((d) => d.phone).length;
        const avail = data.availableOnPulse ?? 0;
        const emailBit =
          meta?.withEmail != null
            ? ` · ${meta.withEmail} with email`
            : "";
        showToast(
          `Fetched ${mobiles} mobile${mobiles === 1 ? "" : "s"}` +
            (avail
              ? ` · ${avail} available on PulseChat`
              : " · none on PulseChat yet") +
            ` · ${data.imported} new · ${data.updated} updated` +
            (data.skipped ? ` · ${data.skipped} skipped` : "") +
            emailBit,
        );
      } catch (e) {
        setSyncError(errMessage(e, "Phonebook sync failed"));
      } finally {
        setIsSyncing(false);
      }
    },
    [showToast, user.email],
  );

  const resyncContacts = useCallback(async () => {
    setIsSyncing(true);
    setSyncError(null);
    try {
      const { canPickDeviceContacts, pickDeviceContacts } = await import(
        "@/lib/device-contacts"
      );
      if (canPickDeviceContacts()) {
        try {
          // Must stay in the same user-gesture turn — picker opens here
          const picked = await pickDeviceContacts();
          if (picked.drafts.length === 0) {
            showToast(
              picked.selected > 0
                ? "Selected contacts had no email or phone saved on the phone"
                : "No contacts selected",
            );
            setIsSyncing(false);
            return;
          }
          setIsSyncing(false);
          await importPhonebook(picked.drafts, {
            withEmail: picked.withEmail,
            phoneOnly: picked.phoneOnly,
          });
          return;
        } catch (e) {
          const msg = errMessage(e, "");
          if (/cancel|abort/i.test(msg)) {
            setIsSyncing(false);
            return;
          }
          setSyncError(
            msg ||
              "Could not read phone contacts. Use Paste import with email lines.",
          );
          setIsSyncing(false);
          return;
        }
      }

      const data = await api.resync();
      setContacts(data.contacts);
      showToast(
        "This browser cannot open your phonebook. Use Paste import: Name, email, phone",
      );
    } catch (e) {
      setSyncError(errMessage(e, "Phonebook sync failed"));
    } finally {
      setIsSyncing(false);
    }
  }, [importPhonebook, showToast]);

  const clearSyncError = useCallback(() => setSyncError(null), []);

  const addContact = useCallback(
    async (input: {
      name: string;
      platform?: Platform;
      handle?: string;
      phone?: string;
      email?: string;
    }) => {
      setIsAddingContact(true);
      try {
        const { contact } = await api.addContact(input);
        setContacts((prev) => {
          const idx = prev.findIndex((c) => c.id === contact.id);
          const next =
            idx === -1
              ? [contact, ...prev]
              : prev.map((c, i) => (i === idx ? contact : c));
          if (user.email) saveContactsLocal(user.email, next);
          return next;
        });
        setMessages((prev) =>
          prev[contact.id] ? prev : { ...prev, [contact.id]: [] },
        );
        if (!activeContactId) setActiveContactId(contact.id);
        const bits = [
          contact.email && `email ${contact.email}`,
          contact.phone && `phone ${contact.phone}`,
        ]
          .filter(Boolean)
          .join(" · ");
        showToast(
          `Added ${contact.name}` + (bits ? ` (${bits})` : ""),
        );
        return contact;
      } catch (e) {
        showToast(errMessage(e, "Could not add contact"));
        return null;
      } finally {
        setIsAddingContact(false);
      }
    },
    [activeContactId, showToast, user.email],
  );

  const handoffToDevice = useCallback(
    (
      platform: "whatsapp" | "sms" | "telegram",
      target: string,
      text: string,
    ) => {
      const result = openExternalChat(platform, target, text);
      if (!result.ok) {
        showToast(result.error);
        return false;
      }
      showToast(
        platform === "whatsapp"
          ? "WhatsApp opened — tap Send there so they receive it"
          : platform === "telegram"
            ? "Telegram opened — message copied; paste & send there"
            : "Messages app opened — tap Send to deliver",
      );
      return true;
    },
    [showToast],
  );

  const sendMessage = useCallback(
    async (text: string) => {
      if (!activeContact) return;
      const contactId = activeContact.id;
      const phone = activeContact.phone || activeContact.handle;
      const platform = activeContact.platform;

      // Open WhatsApp / Telegram / SMS from the user gesture (real delivery).
      if (
        platform === "whatsapp" ||
        platform === "sms" ||
        platform === "telegram"
      ) {
        handoffToDevice(platform, phone, text);
      }

      setIsSending(true);
      try {
        const data = await api.sendMessage(contactId, text);
        setMessages((prev) => ({
          ...prev,
          [contactId]: [...(prev[contactId] || []), data.message],
        }));
        upsertContact(data.contact);

        if (data.pulseDelivered || data.message.delivery === "pulse") {
          showToast(
            data.gateway
              ? `Gateway → Pulse: delivered to ${data.contact.name}`
              : `Delivered to ${data.contact.name} on Pulse`,
          );
        } else if (data.message.delivery === "whatsapp_api") {
          showToast(`Gateway → WhatsApp API: sent to ${data.contact.name}`);
        } else if (
          data.needsClientHandoff === "whatsapp" ||
          data.needsClientHandoff === "sms" ||
          data.needsClientHandoff === "telegram"
        ) {
          if (data.cloudError) {
            handoffToDevice(data.needsClientHandoff, phone, text);
          }
        }
      } catch (e) {
        const err = e as Error & {
          data?: { message?: Message; error?: string };
        };
        if (err.data?.message) {
          setMessages((prev) => ({
            ...prev,
            [contactId]: [...(prev[contactId] || []), err.data!.message!],
          }));
        }
        showToast(errMessage(e, "Message failed to save"));
      } finally {
        setIsSending(false);
      }
    },
    [activeContact, handoffToDevice, showToast, upsertContact],
  );

  const retryMessage = useCallback(
    async (messageId: string) => {
      if (!activeContact) return;
      const contactId = activeContact.id;
      const failed = (messages[contactId] || []).find((m) => m.id === messageId);
      const phone = activeContact.phone || activeContact.handle;

      if (activeContact.platform === "whatsapp" && failed?.text) {
        handoffToDevice("whatsapp", phone, failed.text);
      } else if (activeContact.platform === "telegram" && failed?.text) {
        handoffToDevice("telegram", phone, failed.text);
      } else if (activeContact.platform === "sms" && failed?.text) {
        handoffToDevice("sms", phone, failed.text);
      }

      setMessages((prev) => ({
        ...prev,
        [contactId]: (prev[contactId] || []).filter((m) => m.id !== messageId),
      }));
      setIsSending(true);
      try {
        const data = await api.retryMessage(contactId, messageId);
        setMessages((prev) => ({
          ...prev,
          [contactId]: [...(prev[contactId] || []), data.message],
        }));
        upsertContact(data.contact);
      } catch (e) {
        showToast(errMessage(e, "Retry failed"));
        await refreshMessages(contactId);
      } finally {
        setIsSending(false);
      }
    },
    [
      activeContact,
      handoffToDevice,
      messages,
      refreshMessages,
      showToast,
      upsertContact,
    ],
  );

  const acceptBridge = useCallback(async () => {
    if (!activeContact) return;
    try {
      const { contact } = await api.acceptBridge(activeContact.id);
      upsertContact(contact);
      setSimulatorOpen(false);
      showToast(
        `${contact.name} accepted your bridge invitation on ${contact.platformName}!`,
      );
    } catch (e) {
      showToast(errMessage(e, "Could not accept bridge"));
    }
  }, [activeContact, showToast, upsertContact]);

  const simulateReply = useCallback(async () => {
    if (!activeContact) return;
    const contactId = activeContact.id;
    setSimulatorOpen(false);
    setTypingContactId(contactId);
    try {
      const data = await api.simulateReply(contactId);
      upsertContact(data.contact);
      setMessages((prev) => ({
        ...prev,
        [contactId]: [...(prev[contactId] || []), data.message],
      }));
      showToast(
        `New message from ${data.contact.name} via ${data.contact.platformName}`,
      );
    } catch (e) {
      showToast(errMessage(e, "Simulator reply failed"));
    } finally {
      setTypingContactId(null);
    }
  }, [activeContact, showToast, upsertContact]);

  const startChat = useCallback(
    async (contactId: string) => {
      setActiveContactId(contactId);
      setMobileSidebarOpen(false);
      setScreen("chat");
      try {
        await refreshMessages(contactId);
      } catch (e) {
        showToast(errMessage(e, "Could not load conversation"));
      }
    },
    [refreshMessages, showToast],
  );

  const selectContact = useCallback(
    async (id: string) => {
      setActiveContactId(id);
      setMobileSidebarOpen(false);
      try {
        await refreshMessages(id);
      } catch (e) {
        showToast(errMessage(e, "Could not load conversation"));
      }
    },
    [refreshMessages, showToast],
  );

  const value: PulseContextValue = {
    screen,
    setScreen,
    user,
    contacts,
    messages,
    activeContactId,
    setActiveContactId: selectContact,
    discoveryFilter,
    setDiscoveryFilter,
    discoverySearch,
    setDiscoverySearch,
    sidebarFilter,
    setSidebarFilter,
    sidebarSearch,
    setSidebarSearch,
    googleModalOpen,
    googleIntent,
    openGoogleModal,
    closeGoogleModal,
    simulatorOpen,
    openSimulator,
    closeSimulator,
    emojiOpen,
    setEmojiOpen,
    mobileSidebarOpen,
    setMobileSidebarOpen,
    toast,
    showToast,
    isBooting,
    isSyncing,
    isLoggingIn,
    isSending,
    isAddingContact,
    typingContactId,
    syncError,
    apiError,
    contactFetchPrompt,
    dismissContactFetchPrompt,
    login,
    loginCustom,
    signOut,
    resyncContacts,
    importPhonebook,
    clearSyncError,
    addContact,
    sendMessage,
    retryMessage,
    acceptBridge,
    simulateReply,
    startChat,
    activeContact,
    refreshMessages,
  };

  return (
    <PulseContext.Provider value={value}>{children}</PulseContext.Provider>
  );
}

export function usePulse() {
  const ctx = useContext(PulseContext);
  if (!ctx) throw new Error("usePulse must be used within PulseProvider");
  return ctx;
}
