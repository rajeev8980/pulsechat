"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import {
  AlertTriangle,
  CheckCheck,
  LogOut,
  Menu,
  MessageCircle,
  Phone,
  RefreshCw,
  Send,
  Shield,
  Smartphone,
  Smile,
  UserPlus,
} from "lucide-react";
import type { SidebarFilter } from "@/lib/types";
import {
  getPlatformDeliveryTag,
  getPlatformTagStyles,
} from "@/lib/platform";
import { openExternalChat } from "@/lib/whatsapp";
import { PlatformBadge, PlatformIcon } from "./platform-icon";
import { usePulse } from "./pulse-context";
import { cn } from "@/lib/utils";

const SIDEBAR_FILTERS: { key: SidebarFilter; label: string }[] = [
  { key: "all", label: "All" },
  { key: "pulse", label: "Native" },
  { key: "wa_tg", label: "WA / TG" },
  { key: "ig_fb", label: "IG / FB" },
  { key: "sms", label: "SMS" },
];

const EMOJIS = ["👋", "🔥", "❤️", "🚀", "🎉", "⚡", "😊", "💯"];

export function ChatWorkspace() {
  const {
    user,
    contacts,
    messages,
    activeContactId,
    setActiveContactId,
    activeContact,
    sidebarFilter,
    setSidebarFilter,
    sidebarSearch,
    setSidebarSearch,
    setScreen,
    signOut,
    openSimulator,
    showToast,
    emojiOpen,
    setEmojiOpen,
    mobileSidebarOpen,
    setMobileSidebarOpen,
    sendMessage,
    retryMessage,
    isSending,
    typingContactId,
  } = usePulse();

  const [draft, setDraft] = useState("");
  const streamRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (streamRef.current) {
      streamRef.current.scrollTop = streamRef.current.scrollHeight;
    }
  }, [messages, activeContactId, typingContactId]);

  const filtered = contacts.filter((c) => {
    let matchesChannel = true;
    if (sidebarFilter === "pulse") matchesChannel = c.platform === "pulse";
    else if (sidebarFilter === "wa_tg")
      matchesChannel =
        c.platform === "whatsapp" || c.platform === "telegram";
    else if (sidebarFilter === "ig_fb")
      matchesChannel =
        c.platform === "instagram" || c.platform === "messenger";
    else if (sidebarFilter === "sms") matchesChannel = c.platform === "sms";

    const q = sidebarSearch.toLowerCase();
    const matchesQuery =
      !q ||
      c.name.toLowerCase().includes(q) ||
      c.handle.toLowerCase().includes(q) ||
      c.platformName.toLowerCase().includes(q);
    return matchesChannel && matchesQuery;
  });

  const thread = activeContact ? messages[activeContact.id] || [] : [];

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!draft.trim() || isSending) return;
    const text = draft;
    setDraft("");
    setEmojiOpen(false);
    await sendMessage(text);
  }

  return (
    <section className="flex-1 h-[calc(100dvh-env(safe-area-inset-top)-env(safe-area-inset-bottom)-0.5rem)] max-w-7xl mx-auto w-full p-1.5 sm:p-4 animate-in fade-in duration-300 min-h-0">
      <div className="h-full w-full glass-panel rounded-2xl sm:rounded-3xl overflow-hidden flex border border-white/10 shadow-2xl relative">
        <aside
          className={cn(
            "w-full md:w-80 lg:w-96 border-r border-white/10 flex-col bg-[#0b101d]/90 backdrop-blur-2xl transition-all duration-300 min-h-0",
            mobileSidebarOpen ? "flex" : "hidden md:flex",
            !mobileSidebarOpen && "md:flex",
          )}
        >
          <div className="p-4 border-b border-white/10 flex items-center justify-between">
            <div className="flex items-center gap-3 min-w-0">
              <div className="relative shrink-0">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={user.avatar}
                  alt=""
                  className="w-10 h-10 rounded-xl object-cover ring-2 ring-indigo-500/50"
                />
                <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-400 rounded-full ring-2 ring-slate-900" />
              </div>
              <div className="min-w-0">
                <h4 className="text-xs sm:text-sm font-bold text-white truncate leading-tight">
                  {user.name}
                </h4>
                <p className="text-[10px] text-slate-400 truncate leading-tight font-mono">
                  {user.email}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => setScreen("discovery")}
                className="p-2.5 min-h-11 min-w-11 rounded-xl text-slate-400 hover:text-white hover:bg-white/5 transition flex items-center justify-center"
                title="Find Synced Contacts"
              >
                <UserPlus className="size-4" />
              </button>
              <button
                type="button"
                onClick={signOut}
                className="p-2.5 min-h-11 min-w-11 rounded-xl text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 transition flex items-center justify-center"
                title="Sign Out"
              >
                <LogOut className="size-4" />
              </button>
            </div>
          </div>

          <div className="px-3 pt-3 pb-2 flex gap-1 overflow-x-auto text-[11px] no-scrollbar">
            {SIDEBAR_FILTERS.map((f) => (
              <button
                key={f.key}
                type="button"
                onClick={() => setSidebarFilter(f.key)}
                className={cn(
                  "px-2.5 py-1 rounded-lg whitespace-nowrap transition",
                  sidebarFilter === f.key
                    ? "bg-indigo-600 text-white font-semibold"
                    : "bg-white/5 text-slate-400 hover:text-white font-medium",
                )}
              >
                {f.label}
              </button>
            ))}
          </div>

          <div className="px-3 py-2">
            <div className="relative">
              <MessageCircle className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 size-3" />
              <input
                value={sidebarSearch}
                onChange={(e) => setSidebarSearch(e.target.value)}
                type="text"
                placeholder="Filter conversations or platform..."
                className="w-full glass-card text-xs rounded-xl pl-8 pr-3 py-2 text-white placeholder-slate-500 border border-white/10 focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto divide-y divide-white/5 p-2 space-y-1">
            {filtered.length === 0 ? (
              <div className="text-center py-10 px-4 text-slate-500 text-xs space-y-3">
                <p>
                  {contacts.length === 0
                    ? "No contacts yet."
                    : "No conversations match this filter."}
                </p>
                {contacts.length === 0 && (
                  <button
                    type="button"
                    onClick={() => setScreen("discovery")}
                    className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold"
                  >
                    <UserPlus className="size-3.5" />
                    Add a contact
                  </button>
                )}
              </div>
            ) : (
              filtered.map((c) => {
                const t = messages[c.id] || [];
                const lastMsg =
                  t.length > 0
                    ? t[t.length - 1].text
                    : c.platform === "pulse"
                      ? "Start encrypted chat..."
                      : `Bridge ready for ${c.platformName}`;
                const lastTime =
                  t.length > 0 ? t[t.length - 1].time : "Bridge";
                const isActive = c.id === activeContactId;
                return (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => setActiveContactId(c.id)}
                    className={cn(
                      "w-full p-3 min-h-[4.25rem] rounded-2xl flex items-center gap-3 cursor-pointer transition text-left touch-manipulation",
                      isActive
                        ? "bg-indigo-600/20 border border-indigo-500/40 text-white"
                        : "hover:bg-white/5 active:bg-white/10 text-slate-300 border border-transparent",
                    )}
                  >
                    <div className="relative shrink-0">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={c.avatar}
                        alt=""
                        className={cn(
                          "w-10 h-10 rounded-xl object-cover ring-2",
                          isActive ? "ring-indigo-400" : "ring-white/10",
                        )}
                      />
                      <div className="absolute -bottom-1 -right-1">
                        <PlatformBadge platform={c.platform} />
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-0.5">
                        <h5
                          className={cn(
                            "text-xs font-bold truncate",
                            isActive ? "text-indigo-300" : "text-white",
                          )}
                        >
                          {c.name}
                        </h5>
                        <span className="text-[10px] text-slate-500 font-mono">
                          {lastTime}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400 truncate">
                        {lastMsg}
                      </p>
                    </div>
                  </button>
                );
              })
            )}
          </div>

          <div className="p-3 border-t border-white/10 bg-black/20 flex items-center justify-between text-[11px] text-slate-400">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              Pulse Gateway · common messaging API
            </span>
            <Shield className="size-3.5 text-indigo-400" />
          </div>
        </aside>

        <main
          className={cn(
            "flex-1 flex-col bg-[#080d1a]/80 relative overflow-hidden",
            mobileSidebarOpen ? "hidden md:flex" : "flex",
          )}
        >
          {!activeContact ? (
            <div className="flex-1 flex flex-col items-center justify-center gap-3 text-slate-500 text-sm px-6 text-center">
              <p>
                {contacts.length === 0
                  ? "Add a contact from Discovery to start messaging."
                  : "Select a conversation to start messaging."}
              </p>
              {contacts.length === 0 && (
                <button
                  type="button"
                  onClick={() => setScreen("discovery")}
                  className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold"
                >
                  <UserPlus className="size-3.5" />
                  Go to contacts
                </button>
              )}
            </div>
          ) : (
            <>
              <header className="p-3.5 border-b border-white/10 flex items-center justify-between bg-[#0e1526]/80 backdrop-blur-md z-20 shrink-0">
                <div className="flex items-center gap-3 min-w-0">
                  <button
                    type="button"
                    onClick={() => setMobileSidebarOpen(true)}
                    className="md:hidden text-slate-300 p-2.5 min-h-11 min-w-11 hover:bg-white/5 rounded-lg flex items-center justify-center"
                    aria-label="Open conversations"
                  >
                    <Menu className="size-5" />
                  </button>
                  <div className="relative shrink-0">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={activeContact.avatar}
                      alt=""
                      className="w-10 h-10 rounded-xl object-cover ring-2 ring-white/10"
                    />
                    <div className="absolute -bottom-1 -right-1">
                      <PlatformBadge platform={activeContact.platform} />
                    </div>
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-bold text-sm text-white leading-tight">
                        {activeContact.name}
                      </h3>
                      <span
                        className={cn(
                          "text-[10px] font-semibold px-2 py-0.5 rounded-full border inline-flex items-center gap-1",
                          getPlatformTagStyles(activeContact.platform),
                        )}
                      >
                        <PlatformIcon
                          platform={activeContact.platform}
                          className="size-2.5"
                        />
                        {activeContact.platformName}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-[11px] text-slate-400 mt-0.5 truncate">
                      <span className="inline-flex items-center gap-1 truncate">
                        <span className="w-2 h-2 rounded-full bg-emerald-400 inline-block" />
                        {activeContact.status}
                      </span>
                      <span className="text-slate-600">•</span>
                      <span className="font-mono text-slate-400 truncate">
                        {[
                          activeContact.email || activeContact.peerEmail,
                          activeContact.phone &&
                          !activeContact.phone.includes("@")
                            ? activeContact.phone
                            : null,
                        ]
                          .filter(Boolean)
                          .join(" · ") || activeContact.handle}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={openSimulator}
                    className="flex items-center gap-1.5 text-xs font-bold bg-gradient-to-r from-purple-600 via-indigo-600 to-cyan-600 hover:opacity-90 text-white px-3 py-2.5 min-h-11 rounded-xl shadow-lg transition active:scale-95 touch-manipulation"
                  >
                    <Smartphone className="size-3.5" />
                    <span className="hidden sm:inline">Simulate Recipient</span>
                    <span className="sm:hidden">Recipient</span>
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      showToast("Testing voice audio gateway...")
                    }
                    className="p-2.5 min-h-11 min-w-11 text-slate-400 hover:text-white hover:bg-white/5 rounded-xl transition flex items-center justify-center"
                    title="Carrier Audio Call"
                  >
                    <Phone className="size-4" />
                  </button>
                </div>
              </header>

              <BridgeBanner />

              <div
                ref={streamRef}
                className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4"
              >
                <div className="flex justify-center my-2">
                  <span className="text-[10px] font-mono px-3 py-1 rounded-full bg-slate-800/80 text-slate-400 border border-white/5">
                    {activeContact.platform === "pulse"
                      ? `Pulse↔Pulse live chat with ${activeContact.peerEmail || activeContact.handle} — they see this when signed in with that email`
                      : activeContact.platform === "whatsapp"
                        ? `Real WhatsApp: Send opens WhatsApp for ${activeContact.phone} — they only get it after you tap Send there`
                        : activeContact.platform === "telegram"
                          ? `Real Telegram: Send opens Telegram for ${activeContact.handle || activeContact.phone} — paste/send there to deliver`
                          : activeContact.platform === "sms"
                            ? `Real SMS: Send opens your Messages app for ${activeContact.phone}`
                            : `${activeContact.platformName} is saved in PulseChat only (no live API yet)`}
                  </span>
                </div>

                {thread.length === 0 && (
                  <div className="text-center py-12 text-slate-500 text-sm glass-card rounded-2xl border border-white/5">
                    No messages yet. Say hello across{" "}
                    {activeContact.platformName}.
                  </div>
                )}

                {thread.map((msg) =>
                  msg.sender === "me" ? (
                    <div
                      key={msg.id}
                      className="flex flex-col items-end max-w-xl ml-auto"
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-[10px] text-slate-500 font-mono">
                          {msg.time}
                        </span>
                        <span className="text-xs font-bold text-indigo-300">
                          You
                        </span>
                      </div>
                      <div
                        className={cn(
                          "text-white text-xs sm:text-sm p-3.5 rounded-2xl rounded-br-none shadow-md leading-relaxed",
                          msg.failed
                            ? "bg-rose-600/80 shadow-rose-600/20"
                            : "bg-indigo-600 shadow-indigo-600/20",
                        )}
                      >
                        {msg.text}
                      </div>
                      {msg.failed ? (
                        <button
                          type="button"
                          onClick={() => retryMessage(msg.id)}
                          className="flex items-center gap-1 text-[10px] text-rose-300 mt-1 font-mono hover:text-rose-200"
                        >
                          <AlertTriangle className="size-3" />
                          Failed — tap to retry
                          <RefreshCw className="size-3" />
                        </button>
                      ) : (
                        <div className="flex flex-col items-end gap-1 mt-1">
                          <div className="flex items-center gap-1 text-[10px] text-slate-400 font-mono">
                            {msg.delivery === "whatsapp_api" ||
                            msg.delivery === "pulse" ? (
                              <CheckCheck className="size-3 text-emerald-400" />
                            ) : (
                              <AlertTriangle className="size-3 text-amber-400" />
                            )}
                            <span>
                              {getPlatformDeliveryTag(
                                activeContact.platform,
                                msg.delivery,
                              )}
                            </span>
                          </div>
                          {(activeContact.platform === "whatsapp" ||
                            activeContact.platform === "telegram" ||
                            activeContact.platform === "sms") &&
                            msg.delivery !== "whatsapp_api" && (
                              <button
                                type="button"
                                onClick={() => {
                                  const plat =
                                    activeContact.platform === "sms"
                                      ? "sms"
                                      : activeContact.platform === "telegram"
                                        ? "telegram"
                                        : "whatsapp";
                                  const r = openExternalChat(
                                    plat,
                                    activeContact.phone || activeContact.handle,
                                    msg.text,
                                  );
                                  showToast(
                                    r.ok
                                      ? plat === "whatsapp"
                                        ? "WhatsApp opened — tap Send to deliver"
                                        : plat === "telegram"
                                          ? "Telegram opened — paste & send there"
                                          : "Messages opened — tap Send to deliver"
                                      : r.error,
                                  );
                                }}
                                className="text-[10px] font-bold text-emerald-300 hover:text-emerald-200 underline"
                              >
                                {activeContact.platform === "whatsapp"
                                  ? "Open in WhatsApp again"
                                  : activeContact.platform === "telegram"
                                    ? "Open in Telegram again"
                                    : "Open in Messages again"}
                              </button>
                            )}
                        </div>
                      )}
                    </div>
                  ) : (
                    <div
                      key={msg.id}
                      className="flex items-start gap-2.5 max-w-xl"
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={activeContact.avatar}
                        alt=""
                        className="w-8 h-8 rounded-full object-cover shrink-0 ring-1 ring-white/10 mt-1"
                      />
                      <div>
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <span className="text-xs font-bold text-white">
                            {activeContact.name}
                          </span>
                          <span className="text-[9px] font-semibold px-1.5 py-0.5 rounded bg-white/10 text-slate-300 font-mono">
                            via {activeContact.platformName}
                          </span>
                          <span className="text-[10px] text-slate-500 font-mono">
                            {msg.time}
                          </span>
                        </div>
                        <div className="glass-panel text-slate-200 text-xs sm:text-sm p-3.5 rounded-2xl rounded-bl-none border border-white/10 shadow-sm leading-relaxed">
                          {msg.text}
                        </div>
                      </div>
                    </div>
                  ),
                )}
              </div>

              {typingContactId === activeContact.id && (
                <div className="px-6 py-2 text-xs text-indigo-300 flex items-center gap-2 font-medium bg-[#080d1a]/50">
                  <span className="w-1.5 h-1.5 bg-indigo-400 rounded-full typing-dot" />
                  <span className="w-1.5 h-1.5 bg-indigo-400 rounded-full typing-dot" />
                  <span className="w-1.5 h-1.5 bg-indigo-400 rounded-full typing-dot" />
                  <span className="text-slate-400 ml-1">
                    {activeContact.name} ({activeContact.platformName}) is
                    typing...
                  </span>
                </div>
              )}

              {emojiOpen && (
                <div className="px-4 py-2 border-t border-white/10 bg-[#0e1526]/90 flex items-center gap-2 overflow-x-auto">
                  {EMOJIS.map((char) => (
                    <button
                      key={char}
                      type="button"
                      onClick={() => setDraft((d) => d + char)}
                      className="p-1.5 hover:bg-white/10 rounded-lg text-base"
                    >
                      {char}
                    </button>
                  ))}
                </div>
              )}

              <footer className="p-3 sm:p-3.5 border-t border-white/10 bg-[#0e1526]/80 backdrop-blur-md shrink-0 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
                <form
                  onSubmit={onSubmit}
                  className="flex items-center gap-2"
                >
                  <button
                    type="button"
                    onClick={() => setEmojiOpen(!emojiOpen)}
                    className="p-2.5 min-h-11 min-w-11 text-slate-400 hover:text-amber-400 hover:bg-white/5 rounded-xl transition flex items-center justify-center"
                    title="Insert Emoji"
                  >
                    <Smile className="size-5" />
                  </button>
                  <div className="relative flex-1">
                    <input
                      value={draft}
                      onChange={(e) => setDraft(e.target.value)}
                      type="text"
                      inputMode="text"
                      enterKeyHint="send"
                      placeholder="Type a message across platform..."
                      autoComplete="off"
                      disabled={isSending}
                      className="w-full glass-card text-base sm:text-sm rounded-xl pl-4 pr-10 py-3 min-h-11 text-white placeholder-slate-500 border border-white/10 focus:outline-none focus:border-indigo-500 disabled:opacity-60"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={isSending || !draft.trim()}
                    className="bg-indigo-600 hover:bg-indigo-500 text-white w-12 h-12 min-h-12 rounded-xl flex items-center justify-center transition shadow-lg shadow-indigo-600/30 active:scale-95 shrink-0 disabled:opacity-50 touch-manipulation"
                  >
                    {isSending ? (
                      <RefreshCw className="size-4 animate-spin" />
                    ) : (
                      <Send className="size-4" />
                    )}
                  </button>
                </form>
              </footer>
            </>
          )}
        </main>
      </div>
    </section>
  );
}

function BridgeBanner() {
  const { activeContact, openSimulator, showToast } = usePulse();
  if (!activeContact) return null;

  if (activeContact.platform === "pulse") {
    return (
      <div className="px-4 py-2.5 text-xs flex items-center justify-between bg-indigo-500/15 border-b border-indigo-500/25 text-indigo-100 shrink-0 gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <span className="w-2 h-2 rounded-full bg-indigo-400 animate-pulse shrink-0" />
          <span className="leading-snug">
            <strong>Pulse↔Pulse:</strong> Messages go to{" "}
            {activeContact.peerEmail || activeContact.handle}. They appear when
            that person signs into PulseChat with the same email.
          </span>
        </div>
      </div>
    );
  }

  if (activeContact.platform === "whatsapp") {
    return (
      <div className="px-4 py-2.5 text-xs flex items-center justify-between bg-emerald-500/15 border-b border-emerald-500/25 text-emerald-100 shrink-0 gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <span className="w-2 h-2 rounded-full bg-emerald-400 shrink-0" />
          <span className="leading-snug">
            <strong>Real WhatsApp:</strong> PulseChat opens WhatsApp on{" "}
            <em>your</em> phone with the message. {activeContact.name} only
            receives it after you tap <strong>Send</strong> in WhatsApp (
            {activeContact.phone}).
          </span>
        </div>
        <button
          type="button"
          onClick={() => {
            const r = openExternalChat(
              "whatsapp",
              activeContact.phone || activeContact.handle,
              "",
            );
            showToast(
              r.ok ? "Opening WhatsApp chat…" : r.error,
            );
          }}
          className="font-bold underline text-white hover:text-emerald-200 shrink-0"
        >
          Open WhatsApp
        </button>
      </div>
    );
  }

  if (activeContact.platform === "telegram") {
    return (
      <div className="px-4 py-2.5 text-xs flex items-center justify-between bg-sky-500/15 border-b border-sky-500/25 text-sky-100 shrink-0 gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <span className="w-2 h-2 rounded-full bg-sky-400 shrink-0" />
          <span className="leading-snug">
            <strong>Real Telegram:</strong> Send opens Telegram for{" "}
            {activeContact.handle || activeContact.phone}. Your text is copied —
            paste and tap Send in Telegram so they receive it. Simulator replies
            are fake.
          </span>
        </div>
        <button
          type="button"
          onClick={() => {
            const r = openExternalChat(
              "telegram",
              activeContact.phone || activeContact.handle,
              "",
            );
            showToast(r.ok ? "Opening Telegram…" : r.error);
          }}
          className="font-bold underline text-white hover:text-sky-200 shrink-0"
        >
          Open Telegram
        </button>
      </div>
    );
  }

  if (activeContact.platform === "sms") {
    return (
      <div className="px-4 py-2 text-xs flex items-center justify-between bg-teal-500/15 border-b border-teal-500/25 text-teal-200 shrink-0 gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <span className="w-2 h-2 rounded-full bg-teal-400 shrink-0" />
          <span className="truncate">
            <strong>Real SMS:</strong> Send opens your phone&apos;s Messages app
            for {activeContact.phone}. Tap Send there to deliver.
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="px-4 py-2 text-xs flex items-center justify-between bg-amber-500/15 border-b border-amber-500/25 text-amber-200 shrink-0 gap-2">
      <div className="flex items-center gap-2 min-w-0">
        <AlertTriangle className="size-3.5 text-amber-400 shrink-0" />
        <span className="truncate">
          <strong>{activeContact.platformName}:</strong> messages stay in
          PulseChat for now (no live API). Simulator replies are fake and only
          for UI demos.
        </span>
      </div>
      <button
        type="button"
        onClick={openSimulator}
        className="font-bold underline text-amber-300 hover:text-white shrink-0"
      >
        Simulator
      </button>
    </div>
  );
}
