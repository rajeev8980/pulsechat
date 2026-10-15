"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import {
  createInitialMessages,
  DEFAULT_USER,
  INITIAL_CONTACTS,
} from "@/lib/data";
import { getAutoReply } from "@/lib/platform";
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
  isSyncing: boolean;
  isLoggingIn: boolean;
  isSending: boolean;
  typingContactId: string | null;
  syncError: string | null;
  login: (user: User) => void;
  loginCustom: (email: string) => void;
  signOut: () => void;
  resyncContacts: () => void;
  clearSyncError: () => void;
  sendMessage: (text: string) => Promise<void>;
  retryMessage: (messageId: string) => Promise<void>;
  acceptBridge: () => void;
  simulateReply: () => void;
  startChat: (contactId: string) => void;
  activeContact: Contact | undefined;
}

const PulseContext = createContext<PulseContextValue | null>(null);

function nowTime() {
  return new Date().toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function uid(prefix: string) {
  return `${prefix}-${Math.random().toString(36).slice(2, 9)}`;
}

export function PulseProvider({ children }: { children: ReactNode }) {
  const [screen, setScreen] = useState<Screen>("landing");
  const [user, setUser] = useState<User>(DEFAULT_USER);
  const [contacts, setContacts] = useState<Contact[]>(() =>
    INITIAL_CONTACTS.map((c) => ({ ...c })),
  );
  const [messages, setMessages] = useState<Record<string, Message[]>>(
    createInitialMessages,
  );
  const [activeContactId, setActiveContactId] = useState("c3");
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
  const [isSyncing, setIsSyncing] = useState(false);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [typingContactId, setTypingContactId] = useState<string | null>(null);
  const [syncError, setSyncError] = useState<string | null>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const failNextSend = useRef(false);

  const showToast = useCallback((msg: string) => {
    setToast(msg);
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), 3000);
  }, []);

  const activeContact = useMemo(
    () => contacts.find((c) => c.id === activeContactId),
    [contacts, activeContactId],
  );

  const openGoogleModal = useCallback((intent: "signin" | "signup" = "signin") => {
    setGoogleIntent(intent);
    setGoogleModalOpen(true);
  }, []);

  const closeGoogleModal = useCallback(() => setGoogleModalOpen(false), []);
  const openSimulator = useCallback(() => setSimulatorOpen(true), []);
  const closeSimulator = useCallback(() => setSimulatorOpen(false), []);

  const login = useCallback(
    (next: User) => {
      setIsLoggingIn(true);
      setTimeout(() => {
        setUser(next);
        setIsLoggingIn(false);
        setGoogleModalOpen(false);
        setSyncError(null);
        showToast(`Signed in as ${next.email}`);
        setScreen("discovery");
      }, 700);
    },
    [showToast],
  );

  const loginCustom = useCallback(
    (email: string) => {
      const trimmed = email.trim();
      if (!trimmed || !trimmed.includes("@")) {
        showToast("Please enter a valid Gmail address");
        return;
      }
      const raw = trimmed.split("@")[0];
      const displayName = raw.charAt(0).toUpperCase() + raw.slice(1);
      login({
        name: displayName,
        email: trimmed,
        avatar:
          "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=96&h=96&fit=crop&crop=faces",
      });
    },
    [login, showToast],
  );

  const signOut = useCallback(() => {
    showToast("Signed out of PulseChat");
    setScreen("landing");
    setMobileSidebarOpen(true);
  }, [showToast]);

  const resyncContacts = useCallback(() => {
    setIsSyncing(true);
    setSyncError(null);
    setTimeout(() => {
      // Occasional mock failure for error-state coverage
      if (Math.random() < 0.12) {
        setIsSyncing(false);
        setSyncError("Phonebook sync timed out. Check your connection and retry.");
        return;
      }
      setContacts(INITIAL_CONTACTS.map((c) => ({ ...c })));
      setIsSyncing(false);
      showToast("11 contacts synced from Gmail & external phonebook!");
    }, 800);
  }, [showToast]);

  const clearSyncError = useCallback(() => setSyncError(null), []);

  const runAutoReply = useCallback(
    (contact: Contact) => {
      setTypingContactId(contact.id);
      setTimeout(() => {
        setTypingContactId(null);
        const reply: Message = {
          id: uid("msg"),
          sender: "them",
          text: getAutoReply(contact.platform),
          time: nowTime(),
        };
        setMessages((prev) => ({
          ...prev,
          [contact.id]: [...(prev[contact.id] || []), reply],
        }));
        showToast(`New message from ${contact.name} via ${contact.platformName}`);
      }, 1900);
    },
    [showToast],
  );

  const sendMessage = useCallback(
    async (text: string) => {
      const trimmed = text.trim();
      if (!trimmed || !activeContact) return;

      setIsSending(true);
      const contact = activeContact;
      const messageId = uid("msg");
      const shouldFail = failNextSend.current || trimmed.toLowerCase() === "/fail";
      failNextSend.current = false;

      await new Promise((r) => setTimeout(r, 350));

      if (shouldFail) {
        const failed: Message = {
          id: messageId,
          sender: "me",
          text: trimmed.replace(/^\/fail\s*/i, "") || trimmed,
          time: nowTime(),
          failed: true,
        };
        setMessages((prev) => ({
          ...prev,
          [contact.id]: [...(prev[contact.id] || []), failed],
        }));
        setIsSending(false);
        showToast("Message failed to deliver. Tap Retry to send again.");
        return;
      }

      const msg: Message = {
        id: messageId,
        sender: "me",
        text: trimmed,
        time: nowTime(),
      };
      setMessages((prev) => ({
        ...prev,
        [contact.id]: [...(prev[contact.id] || []), msg],
      }));

      if (!contact.bridgeConnected && contact.platform !== "pulse") {
        setContacts((prev) =>
          prev.map((c) =>
            c.id === contact.id ? { ...c, invitationSent: true } : c,
          ),
        );
        showToast(
          `1-Tap notification delivered to ${contact.name}'s ${contact.platformName}!`,
        );
      }

      setIsSending(false);

      if (contact.bridgeConnected) {
        runAutoReply(contact);
      }
    },
    [activeContact, runAutoReply, showToast],
  );

  const retryMessage = useCallback(
    async (messageId: string) => {
      if (!activeContact) return;
      const thread = messages[activeContact.id] || [];
      const failed = thread.find((m) => m.id === messageId && m.failed);
      if (!failed) return;
      setMessages((prev) => ({
        ...prev,
        [activeContact.id]: (prev[activeContact.id] || []).filter(
          (m) => m.id !== messageId,
        ),
      }));
      await sendMessage(failed.text);
    },
    [activeContact, messages, sendMessage],
  );

  const acceptBridge = useCallback(() => {
    if (!activeContact) return;
    setContacts((prev) =>
      prev.map((c) =>
        c.id === activeContact.id
          ? { ...c, bridgeConnected: true, invitationSent: true }
          : c,
      ),
    );
    setSimulatorOpen(false);
    showToast(
      `${activeContact.name} accepted your bridge invitation on ${activeContact.platformName}!`,
    );
  }, [activeContact, showToast]);

  const simulateReply = useCallback(() => {
    if (!activeContact) return;
    setContacts((prev) =>
      prev.map((c) =>
        c.id === activeContact.id
          ? { ...c, bridgeConnected: true, invitationSent: true }
          : c,
      ),
    );
    setSimulatorOpen(false);
    runAutoReply({ ...activeContact, bridgeConnected: true });
  }, [activeContact, runAutoReply]);

  const startChat = useCallback((contactId: string) => {
    setActiveContactId(contactId);
    setMobileSidebarOpen(false);
    setScreen("chat");
  }, []);

  const value: PulseContextValue = {
    screen,
    setScreen,
    user,
    contacts,
    messages,
    activeContactId,
    setActiveContactId: (id) => {
      setActiveContactId(id);
      setMobileSidebarOpen(false);
    },
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
    isSyncing,
    isLoggingIn,
    isSending,
    typingContactId,
    syncError,
    login,
    loginCustom,
    signOut,
    resyncContacts,
    clearSyncError,
    sendMessage,
    retryMessage,
    acceptBridge,
    simulateReply,
    startChat,
    activeContact,
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
