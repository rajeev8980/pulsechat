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
import type {
  Contact,
  Message,
  Platform,
  Screen,
  SidebarFilter,
  User,
} from "@/lib/types";

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
  login: (user: User) => void;
  loginCustom: (email: string) => void;
  signOut: () => void;
  resyncContacts: () => void;
  clearSyncError: () => void;
  addContact: (input: {
    name: string;
    platform: Platform;
    handle?: string;
    phone?: string;
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
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pollTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

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

  const loadContacts = useCallback(async () => {
    const data = await api.contacts();
    setContacts(data.contacts);
    return data.contacts;
  }, []);

  const refreshMessages = useCallback(async (contactId: string) => {
    const data = await api.messages(contactId);
    setMessages((prev) => ({ ...prev, [contactId]: data.messages }));
    upsertContact(data.contact);
  }, [upsertContact]);

  const waitForAutoReply = useCallback(
    async (contactId: string, baselineCount: number) => {
      setTypingContactId(contactId);
      if (pollTimer.current) clearTimeout(pollTimer.current);

      const started = Date.now();
      const poll = async () => {
        try {
          const data = await api.messages(contactId);
          setMessages((prev) => ({ ...prev, [contactId]: data.messages }));
          upsertContact(data.contact);
          const hasNewThem =
            data.messages.length > baselineCount &&
            data.messages[data.messages.length - 1]?.sender === "them";
          if (hasNewThem) {
            setTypingContactId(null);
            showToast(
              `New message from ${data.contact.name} via ${data.contact.platformName}`,
            );
            return;
          }
        } catch {
          // keep polling briefly
        }
        if (Date.now() - started > 6000) {
          setTypingContactId(null);
          return;
        }
        pollTimer.current = setTimeout(poll, 400);
      };

      pollTimer.current = setTimeout(poll, 500);
    },
    [showToast, upsertContact],
  );

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
            const list = await loadContacts();
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
      if (pollTimer.current) clearTimeout(pollTimer.current);
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
        const list = await loadContacts();
        const first = list[0]?.id || "";
        setActiveContactId(first);
        if (first) await refreshMessages(first);
        setGoogleModalOpen(false);
        setSyncError(null);
        showToast(
          list.length
            ? `Signed in as ${loggedIn.email}`
            : `Signed in as ${loggedIn.email} — add a contact to start chatting`,
        );
        setScreen("discovery");
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
    try {
      await api.logout();
    } catch {
      // ignore
    }
    setUser(GUEST_USER);
    setContacts([]);
    setMessages({});
    setActiveContactId("");
    setScreen("landing");
    setMobileSidebarOpen(true);
    showToast("Signed out of PulseChat");
  }, [showToast]);

  const resyncContacts = useCallback(async () => {
    setIsSyncing(true);
    setSyncError(null);
    try {
      const data = await api.resync();
      setContacts(data.contacts);
      const n = data.contacts.length;
      showToast(
        n
          ? `Phonebook refreshed — ${n} contact${n === 1 ? "" : "s"}`
          : "Phonebook empty — add someone to get started",
      );
    } catch (e) {
      setSyncError(errMessage(e, "Phonebook sync failed"));
    } finally {
      setIsSyncing(false);
    }
  }, [showToast]);

  const clearSyncError = useCallback(() => setSyncError(null), []);

  const addContact = useCallback(
    async (input: {
      name: string;
      platform: Platform;
      handle?: string;
      phone?: string;
    }) => {
      setIsAddingContact(true);
      try {
        const { contact } = await api.addContact(input);
        setContacts((prev) => {
          if (prev.some((c) => c.id === contact.id)) return prev;
          return [contact, ...prev];
        });
        setMessages((prev) =>
          prev[contact.id] ? prev : { ...prev, [contact.id]: [] },
        );
        if (!activeContactId) setActiveContactId(contact.id);
        showToast(`Added ${contact.name} on ${contact.platformName}`);
        return contact;
      } catch (e) {
        showToast(errMessage(e, "Could not add contact"));
        return null;
      } finally {
        setIsAddingContact(false);
      }
    },
    [activeContactId, showToast],
  );

  const sendMessage = useCallback(
    async (text: string) => {
      if (!activeContact) return;
      const contactId = activeContact.id;
      const baseline = (messages[contactId] || []).length;
      setIsSending(true);
      try {
        const data = await api.sendMessage(contactId, text);
        setMessages((prev) => ({
          ...prev,
          [contactId]: [...(prev[contactId] || []), data.message],
        }));
        upsertContact(data.contact);
        if (data.invitationSent) {
          showToast(
            `1-Tap notification delivered to ${data.contact.name}'s ${data.contact.platformName}!`,
          );
        }
        if (data.autoReplyPending) {
          void waitForAutoReply(contactId, baseline + 1);
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
        showToast(errMessage(e, "Message failed to deliver"));
      } finally {
        setIsSending(false);
      }
    },
    [activeContact, messages, showToast, upsertContact, waitForAutoReply],
  );

  const retryMessage = useCallback(
    async (messageId: string) => {
      if (!activeContact) return;
      const contactId = activeContact.id;
      const baseline = (messages[contactId] || []).filter(
        (m) => m.id !== messageId,
      ).length;
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
        if (data.autoReplyPending) {
          void waitForAutoReply(contactId, baseline + 1);
        }
      } catch (e) {
        showToast(errMessage(e, "Retry failed"));
        await refreshMessages(contactId);
      } finally {
        setIsSending(false);
      }
    },
    [
      activeContact,
      messages,
      refreshMessages,
      showToast,
      upsertContact,
      waitForAutoReply,
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
    login,
    loginCustom,
    signOut,
    resyncContacts,
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
