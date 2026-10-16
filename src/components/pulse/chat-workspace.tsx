"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import {
  AlertTriangle,
  ArrowLeft,
  CheckCheck,
  LogOut,
  MessageCircle,
  MoreVertical,
  Phone,
  Plus,
  RefreshCw,
  Search,
  Send,
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
  { key: "pulse", label: "Pulse" },
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
      (c.mobile || c.phone || "").toLowerCase().includes(q) ||
      c.platformName.toLowerCase().includes(q);
    return matchesChannel && matchesQuery;
  });

  // Sort like WhatsApp: conversations with recent messages first
  const sorted = [...filtered].sort((a, b) => {
    const ta = (messages[a.id] || []).at(-1);
    const tb = (messages[b.id] || []).at(-1);
    if (ta && !tb) return -1;
    if (!ta && tb) return 1;
    return a.name.localeCompare(b.name);
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
    <section className="flex-1 h-[100dvh] max-h-[100dvh] w-full animate-in fade-in duration-300 min-h-0">
      <div className="h-full w-full overflow-hidden flex relative bg-[#0b141a]">
        {/* ===== CHATS LIST (WhatsApp-style) ===== */}
        <aside
          className={cn(
            "w-full md:w-[380px] lg:w-[420px] border-r border-[#222d34] flex-col bg-[#111b21] transition-all duration-200 min-h-0 relative",
            mobileSidebarOpen ? "flex" : "hidden md:flex",
          )}
        >
          <header className="px-4 py-3 bg-[#202c33] flex items-center justify-between shrink-0">
            <div className="flex items-center gap-3 min-w-0">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={user.avatar}
                alt=""
                className="w-10 h-10 rounded-full object-cover"
              />
              <div className="min-w-0">
                <h1 className="text-[22px] font-semibold text-[#e9edef] leading-tight tracking-tight">
                  Chats
                </h1>
                <p className="text-[11px] text-[#8696a0] truncate">
                  {user.name}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => setScreen("discovery")}
                className="p-2.5 min-h-11 min-w-11 rounded-full text-[#aebac1] hover:bg-white/5 flex items-center justify-center"
                title="New chat"
              >
                <UserPlus className="size-5" />
              </button>
              <button
                type="button"
                onClick={signOut}
                className="p-2.5 min-h-11 min-w-11 rounded-full text-[#aebac1] hover:bg-white/5 flex items-center justify-center"
                title="Sign out"
              >
                <LogOut className="size-5" />
              </button>
            </div>
          </header>

          <div className="px-3 py-2 bg-[#111b21]">
            <div className="relative">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#8696a0] size-4" />
              <input
                value={sidebarSearch}
                onChange={(e) => setSidebarSearch(e.target.value)}
                type="search"
                placeholder="Search or start a new chat"
                className="w-full bg-[#202c33] text-sm rounded-lg pl-10 pr-3 py-2.5 min-h-11 text-[#e9edef] placeholder-[#8696a0] border-0 focus:outline-none focus:ring-1 focus:ring-[#00a884]/50"
              />
            </div>
          </div>

          <div className="px-2 pb-1 flex gap-1.5 overflow-x-auto text-[12px] no-scrollbar">
            {SIDEBAR_FILTERS.map((f) => (
              <button
                key={f.key}
                type="button"
                onClick={() => setSidebarFilter(f.key)}
                className={cn(
                  "px-3 py-1.5 rounded-full whitespace-nowrap transition font-medium",
                  sidebarFilter === f.key
                    ? "bg-[#00a884]/20 text-[#00a884]"
                    : "bg-[#202c33] text-[#8696a0] hover:text-[#e9edef]",
                )}
              >
                {f.label}
              </button>
            ))}
          </div>

          <div className="flex-1 overflow-y-auto">
            {sorted.length === 0 ? (
              <div className="text-center py-16 px-6 text-[#8696a0] text-sm space-y-4">
                <MessageCircle className="size-12 mx-auto text-[#3b4a54]" />
                <p>
                  {contacts.length === 0
                    ? "No chats yet. Fetch contacts or start a new chat."
                    : "No chats match this filter."}
                </p>
                <button
                  type="button"
                  onClick={() => setScreen("discovery")}
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-full bg-[#00a884] hover:bg-[#06cf9c] text-[#111b21] text-sm font-bold"
                >
                  <Plus className="size-4" />
                  New chat
                </button>
              </div>
            ) : (
              sorted.map((c) => {
                const t = messages[c.id] || [];
                const mobile =
                  c.mobile ||
                  (c.phone && !c.phone.includes("@") ? c.phone : "");
                const lastMsg =
                  t.length > 0
                    ? t[t.length - 1].text
                    : c.onPulse
                      ? "Tap to chat on PulseChat"
                      : mobile
                        ? mobile
                        : `Chat on ${c.platformName}`;
                const lastTime =
                  t.length > 0 ? t[t.length - 1].time : "";
                const isActive = c.id === activeContactId;
                return (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => setActiveContactId(c.id)}
                    className={cn(
                      "w-full px-3 py-3 flex items-center gap-3 cursor-pointer transition text-left touch-manipulation border-b border-[#222d34]/80",
                      isActive
                        ? "bg-[#2a3942]"
                        : "hover:bg-[#202c33] active:bg-[#2a3942]",
                    )}
                  >
                    <div className="relative shrink-0">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={c.avatar}
                        alt=""
                        className="w-12 h-12 rounded-full object-cover"
                      />
                      <div className="absolute -bottom-0.5 -right-0.5">
                        <PlatformBadge platform={c.platform} />
                      </div>
                    </div>
                    <div className="flex-1 min-w-0 py-0.5">
                      <div className="flex items-center justify-between gap-2">
                        <h5 className="text-[16px] font-normal text-[#e9edef] truncate">
                          {c.name}
                        </h5>
                        <span className="text-[11px] text-[#8696a0] shrink-0">
                          {lastTime}
                        </span>
                      </div>
                      <p className="text-[13px] text-[#8696a0] truncate mt-0.5">
                        {c.onPulse ? (
                          <span className="text-[#00a884] font-medium mr-1">
                            ·
                          </span>
                        ) : null}
                        {lastMsg}
                      </p>
                    </div>
                  </button>
                );
              })
            )}
          </div>

          {/* FAB — new chat */}
          <button
            type="button"
            onClick={() => setScreen("discovery")}
            className="absolute bottom-6 right-5 w-14 h-14 rounded-2xl bg-[#00a884] hover:bg-[#06cf9c] text-[#111b21] shadow-xl flex items-center justify-center touch-manipulation"
            aria-label="New chat"
          >
            <Plus className="size-7" strokeWidth={2.5} />
          </button>
        </aside>

        {/* ===== CONVERSATION ===== */}
        <main
          className={cn(
            "flex-1 flex-col relative overflow-hidden min-h-0",
            mobileSidebarOpen ? "hidden md:flex" : "flex",
          )}
          style={{
            backgroundColor: "#0b141a",
            backgroundImage:
              "radial-gradient(ellipse at top, rgba(0,168,132,0.06), transparent 55%)",
          }}
        >
          {!activeContact ? (
            <div className="flex-1 flex flex-col items-center justify-center gap-3 text-[#8696a0] text-sm px-6 text-center bg-[#222e35]">
              <MessageCircle className="size-16 text-[#3b4a54]" />
              <h2 className="text-2xl font-light text-[#e9edef]">
                PulseChat
              </h2>
              <p className="max-w-sm">
                Select a chat to start messaging — just like WhatsApp.
              </p>
            </div>
          ) : (
            <>
              <header className="px-2 sm:px-3 py-2 bg-[#202c33] flex items-center justify-between z-20 shrink-0 gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  <button
                    type="button"
                    onClick={() => setMobileSidebarOpen(true)}
                    className="md:hidden text-[#aebac1] p-2 min-h-11 min-w-11 hover:bg-white/5 rounded-full flex items-center justify-center"
                    aria-label="Back to chats"
                  >
                    <ArrowLeft className="size-5" />
                  </button>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={activeContact.avatar}
                    alt=""
                    className="w-10 h-10 rounded-full object-cover shrink-0"
                  />
                  <div className="min-w-0">
                    <h3 className="font-medium text-[16px] text-[#e9edef] leading-tight truncate">
                      {activeContact.name}
                    </h3>
                    <p className="text-[12px] text-[#8696a0] truncate">
                      {activeContact.onPulse
                        ? "online · PulseChat"
                        : activeContact.status}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-0.5 shrink-0">
                  <span
                    className={cn(
                      "hidden sm:inline-flex text-[10px] font-semibold px-2 py-0.5 rounded-full border items-center gap-1 mr-1",
                      getPlatformTagStyles(activeContact.platform),
                    )}
                  >
                    <PlatformIcon
                      platform={activeContact.platform}
                      className="size-2.5"
                    />
                    {activeContact.platformName}
                  </span>
                  <button
                    type="button"
                    onClick={() =>
                      showToast("Voice calls coming soon on Pulse gateway")
                    }
                    className="p-2.5 min-h-11 min-w-11 text-[#aebac1] hover:bg-white/5 rounded-full flex items-center justify-center"
                  >
                    <Phone className="size-5" />
                  </button>
                  <button
                    type="button"
                    onClick={openSimulator}
                    className="p-2.5 min-h-11 min-w-11 text-[#aebac1] hover:bg-white/5 rounded-full flex items-center justify-center"
                    title="More"
                  >
                    <MoreVertical className="size-5" />
                  </button>
                </div>
              </header>

              <BridgeBanner />

              <div
                ref={streamRef}
                className="flex-1 overflow-y-auto px-3 sm:px-8 py-3 space-y-1.5"
              >
                {thread.length === 0 && (
                  <div className="flex justify-center my-8">
                    <div className="max-w-xs text-center text-[12px] text-[#8696a0] bg-[#182229] px-4 py-3 rounded-lg border border-[#222d34]">
                      Messages are end-to-end on Pulse when both sides use
                      PulseChat. Say hello to {activeContact.name}.
                    </div>
                  </div>
                )}

                {thread.map((msg) =>
                  msg.sender === "me" ? (
                    <div
                      key={msg.id}
                      className="flex flex-col items-end max-w-[85%] sm:max-w-md ml-auto"
                    >
                      <div
                        className={cn(
                          "text-[#e9edef] text-[14.2px] px-2.5 py-1.5 rounded-lg rounded-tr-none shadow-sm leading-relaxed relative",
                          msg.failed ? "bg-rose-800/90" : "bg-[#005c4b]",
                        )}
                      >
                        <span className="pr-12 whitespace-pre-wrap break-words">
                          {msg.text}
                        </span>
                        <span className="absolute bottom-1 right-2 flex items-center gap-0.5 text-[10px] text-[#ffffff99]">
                          {msg.time}
                          {!msg.failed &&
                            (msg.delivery === "whatsapp_api" ||
                            msg.delivery === "pulse" ? (
                              <CheckCheck className="size-3.5 text-[#53bdeb]" />
                            ) : (
                              <CheckCheck className="size-3.5 text-[#ffffff99]" />
                            ))}
                        </span>
                      </div>
                      {msg.failed ? (
                        <button
                          type="button"
                          onClick={() => retryMessage(msg.id)}
                          className="flex items-center gap-1 text-[10px] text-rose-300 mt-1 font-mono"
                        >
                          <AlertTriangle className="size-3" />
                          Failed — tap to retry
                          <RefreshCw className="size-3" />
                        </button>
                      ) : (
                        <span className="text-[10px] text-[#8696a0] mt-0.5 px-1">
                          {getPlatformDeliveryTag(
                            activeContact.platform,
                            msg.delivery,
                          )}
                        </span>
                      )}
                      {(activeContact.platform === "whatsapp" ||
                        activeContact.platform === "telegram" ||
                        activeContact.platform === "sms") &&
                        !msg.failed &&
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
                                  ? "App opened — tap Send to deliver"
                                  : r.error,
                              );
                            }}
                            className="text-[10px] font-bold text-[#00a884] underline mt-0.5"
                          >
                            Open again to send
                          </button>
                        )}
                    </div>
                  ) : (
                    <div
                      key={msg.id}
                      className="flex flex-col items-start max-w-[85%] sm:max-w-md"
                    >
                      <div className="bg-[#202c33] text-[#e9edef] text-[14.2px] px-2.5 py-1.5 rounded-lg rounded-tl-none shadow-sm leading-relaxed relative">
                        <span className="pr-10 whitespace-pre-wrap break-words">
                          {msg.text}
                        </span>
                        <span className="absolute bottom-1 right-2 text-[10px] text-[#ffffff99]">
                          {msg.time}
                        </span>
                      </div>
                    </div>
                  ),
                )}
              </div>

              {typingContactId === activeContact.id && (
                <div className="px-4 py-1 text-xs text-[#00a884] flex items-center gap-2">
                  <span className="w-1.5 h-1.5 bg-[#00a884] rounded-full typing-dot" />
                  <span className="w-1.5 h-1.5 bg-[#00a884] rounded-full typing-dot" />
                  <span className="w-1.5 h-1.5 bg-[#00a884] rounded-full typing-dot" />
                  <span>{activeContact.name} is typing…</span>
                </div>
              )}

              {emojiOpen && (
                <div className="px-3 py-2 bg-[#202c33] flex items-center gap-2 overflow-x-auto border-t border-[#222d34]">
                  {EMOJIS.map((char) => (
                    <button
                      key={char}
                      type="button"
                      onClick={() => setDraft((d) => d + char)}
                      className="p-1.5 hover:bg-white/10 rounded-lg text-lg"
                    >
                      {char}
                    </button>
                  ))}
                </div>
              )}

              <footer className="px-2 py-2 bg-[#202c33] shrink-0 pb-[max(0.5rem,env(safe-area-inset-bottom))]">
                <form
                  onSubmit={onSubmit}
                  className="flex items-end gap-2"
                >
                  <button
                    type="button"
                    onClick={() => setEmojiOpen(!emojiOpen)}
                    className="p-2.5 min-h-11 min-w-11 text-[#8696a0] hover:text-[#e9edef] rounded-full flex items-center justify-center"
                  >
                    <Smile className="size-6" />
                  </button>
                  <input
                    value={draft}
                    onChange={(e) => setDraft(e.target.value)}
                    type="text"
                    inputMode="text"
                    enterKeyHint="send"
                    placeholder="Type a message"
                    autoComplete="off"
                    disabled={isSending}
                    className="flex-1 bg-[#2a3942] text-[15px] rounded-lg px-3 py-2.5 min-h-11 text-[#e9edef] placeholder-[#8696a0] border-0 focus:outline-none disabled:opacity-60"
                  />
                  <button
                    type="submit"
                    disabled={isSending || !draft.trim()}
                    className="bg-[#00a884] hover:bg-[#06cf9c] text-[#111b21] w-12 h-12 min-h-12 rounded-full flex items-center justify-center transition active:scale-95 shrink-0 disabled:opacity-40 touch-manipulation"
                  >
                    {isSending ? (
                      <RefreshCw className="size-5 animate-spin" />
                    ) : (
                      <Send className="size-5" />
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
      <div className="px-3 py-1.5 text-[11px] flex items-center justify-center bg-[#182229] border-b border-[#222d34] text-[#8696a0] shrink-0">
        <span>
          Pulse↔Pulse with{" "}
          <strong className="text-[#e9edef]">
            {activeContact.peerEmail || activeContact.handle}
          </strong>
        </span>
      </div>
    );
  }

  if (activeContact.platform === "whatsapp") {
    return (
      <div className="px-3 py-1.5 text-[11px] flex items-center justify-between gap-2 bg-[#182229] border-b border-[#222d34] text-[#8696a0] shrink-0">
        <span className="truncate">
          Opens WhatsApp for {activeContact.phone} — tap Send there
        </span>
        <button
          type="button"
          onClick={() => {
            const r = openExternalChat(
              "whatsapp",
              activeContact.phone || activeContact.handle,
              "",
            );
            showToast(r.ok ? "Opening WhatsApp…" : r.error);
          }}
          className="font-bold text-[#00a884] shrink-0"
        >
          Open
        </button>
      </div>
    );
  }

  if (activeContact.platform === "telegram") {
    return (
      <div className="px-3 py-1.5 text-[11px] flex items-center justify-between gap-2 bg-[#182229] border-b border-[#222d34] text-[#8696a0] shrink-0">
        <span className="truncate">Opens Telegram to deliver</span>
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
          className="font-bold text-[#00a884] shrink-0"
        >
          Open
        </button>
      </div>
    );
  }

  if (activeContact.platform === "sms") {
    return (
      <div className="px-3 py-1.5 text-[11px] text-center bg-[#182229] border-b border-[#222d34] text-[#8696a0] shrink-0">
        Opens Messages for {activeContact.phone}
      </div>
    );
  }

  return (
    <div className="px-3 py-1.5 text-[11px] flex items-center justify-between gap-2 bg-[#182229] border-b border-[#222d34] text-[#8696a0] shrink-0">
      <span className="truncate">{activeContact.platformName} · saved in Pulse</span>
      <button
        type="button"
        onClick={openSimulator}
        className="font-bold text-[#00a884] shrink-0"
      >
        Demo
      </button>
    </div>
  );
}
