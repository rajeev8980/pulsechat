"use client";

import { FormEvent, type ReactNode, useMemo, useState } from "react";
import {
  BookUser,
  Loader2,
  MessageSquareText,
  Plus,
  RefreshCw,
  Search,
  Smartphone,
  Users,
} from "lucide-react";
import { FaFacebookMessenger, FaInstagram, FaTelegram, FaWhatsapp } from "react-icons/fa6";
import { MdSms } from "react-icons/md";
import type { Platform } from "@/lib/types";
import {
  canPickDeviceContacts,
  parseContactPaste,
} from "@/lib/device-contacts";
import { PlatformBadge } from "./platform-icon";
import { usePulse } from "./pulse-context";
import { cn } from "@/lib/utils";

const FILTERS: { key: Platform | "all"; label: string; icon?: ReactNode }[] =
  [
    { key: "all", label: "All" },
    {
      key: "pulse",
      label: "Native Pulse",
      icon: <span className="w-2 h-2 rounded-full bg-indigo-400" />,
    },
    {
      key: "whatsapp",
      label: "WhatsApp",
      icon: <FaWhatsapp className="text-emerald-400" />,
    },
    {
      key: "telegram",
      label: "Telegram",
      icon: <FaTelegram className="text-sky-400" />,
    },
    {
      key: "instagram",
      label: "Instagram Direct",
      icon: <FaInstagram className="text-pink-400" />,
    },
    {
      key: "messenger",
      label: "Messenger",
      icon: <FaFacebookMessenger className="text-blue-400" />,
    },
    {
      key: "sms",
      label: "Carrier SMS",
      icon: <MdSms className="text-teal-400" />,
    },
  ];

const PLATFORM_OPTIONS: { value: Platform | "auto"; label: string }[] = [
  { value: "auto", label: "Auto (email→Pulse, phone→WhatsApp)" },
  { value: "pulse", label: "Native Pulse" },
  { value: "whatsapp", label: "WhatsApp" },
  { value: "telegram", label: "Telegram" },
  { value: "instagram", label: "Instagram Direct" },
  { value: "messenger", label: "Messenger" },
  { value: "sms", label: "Carrier SMS" },
];

export function DiscoveryScreen() {
  const {
    user,
    contacts,
    discoveryFilter,
    setDiscoveryFilter,
    discoverySearch,
    setDiscoverySearch,
    setScreen,
    startChat,
    resyncContacts,
    importPhonebook,
    isSyncing,
    syncError,
    clearSyncError,
    addContact,
    isAddingContact,
  } = usePulse();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [platform, setPlatform] = useState<Platform | "auto">("auto");
  const [formOpen, setFormOpen] = useState(false);
  const [pasteOpen, setPasteOpen] = useState(false);
  const [pasteText, setPasteText] = useState("");
  const [showAvailableOnly, setShowAvailableOnly] = useState(false);

  const deviceSync = useMemo(() => canPickDeviceContacts(), []);
  const availableCount = useMemo(
    () => contacts.filter((c) => c.onPulse).length,
    [contacts],
  );
  const mobileSyncedCount = useMemo(
    () =>
      contacts.filter(
        (c) => (c.mobile || c.phone) && !(c.phone || "").includes("@"),
      ).length,
    [contacts],
  );

  const filtered = contacts.filter((c) => {
    const matchesFilter =
      discoveryFilter === "all" || c.platform === discoveryFilter;
    const matchesAvail = !showAvailableOnly || Boolean(c.onPulse);
    const q = discoverySearch.toLowerCase().trim();
    const matchesSearch =
      !q ||
      c.name.toLowerCase().includes(q) ||
      c.handle.toLowerCase().includes(q) ||
      (c.email || "").toLowerCase().includes(q) ||
      (c.mobile || c.phone || "").toLowerCase().includes(q) ||
      c.platformName.toLowerCase().includes(q);
    return matchesFilter && matchesAvail && matchesSearch;
  });

  async function onAdd(e: FormEvent) {
    e.preventDefault();
    if (!email.trim() && !phone.trim()) return;
    const contact = await addContact({
      name,
      platform: platform === "auto" ? undefined : platform,
      email: email.trim() || undefined,
      phone: phone.trim() || undefined,
      handle: email.trim() || phone.trim() || undefined,
    });
    if (contact) {
      setName("");
      setEmail("");
      setPhone("");
      setFormOpen(false);
    }
  }

  async function onPasteImport() {
    const drafts = parseContactPaste(pasteText);
    if (drafts.length === 0) return;
    await importPhonebook(drafts);
    setPasteText("");
    setPasteOpen(false);
  }

  return (
    <section className="flex-1 max-w-6xl mx-auto w-full px-3 sm:px-6 py-4 sm:py-6 flex flex-col space-y-4 sm:space-y-6 animate-in fade-in duration-300 min-h-0">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 p-5 glass-panel rounded-3xl shadow-xl">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl pulse-grad flex items-center justify-center text-white text-xl shadow-lg shadow-indigo-600/30">
            <BookUser className="size-6" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-xl sm:text-2xl font-extrabold text-white">
                Your Contacts
              </h2>
              <span className="text-xs bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 px-2.5 py-0.5 rounded-full font-bold font-mono">
                {filtered.length}
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Fetch mobiles from your phonebook — we match numbers to people
              already on PulseChat
              {user.phone ? (
                <>
                  {" "}
                  · your mobile{" "}
                  <strong className="text-slate-300 font-mono">
                    {user.phone}
                  </strong>
                </>
              ) : null}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto flex-wrap">
          <button
            type="button"
            onClick={resyncContacts}
            disabled={isSyncing}
            className="flex-1 md:flex-initial px-3.5 py-2.5 min-h-11 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition shadow-md shadow-emerald-600/20 flex items-center justify-center gap-2 disabled:opacity-60 touch-manipulation"
          >
            {isSyncing ? (
              <Loader2 className="size-3.5 animate-spin" />
            ) : (
              <Smartphone className="size-3.5" />
            )}
            <span>
              {deviceSync ? "Fetch mobiles from phone" : "Fetch mobiles"}
            </span>
          </button>
          <button
            type="button"
            onClick={() => setPasteOpen((v) => !v)}
            className="px-3.5 py-2.5 min-h-11 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 text-xs font-semibold border border-white/10 transition flex items-center gap-2 touch-manipulation"
          >
            <RefreshCw className="size-3.5" />
            <span>Paste import</span>
          </button>
          <button
            type="button"
            onClick={() => setFormOpen((v) => !v)}
            className="px-3.5 py-2.5 min-h-11 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 text-xs font-semibold border border-white/10 transition flex items-center gap-2 touch-manipulation"
          >
            <Plus className="size-3.5" />
            <span>{formOpen ? "Hide" : "Add one"}</span>
          </button>
          <button
            type="button"
            onClick={() => setScreen("chat")}
            className="flex-1 md:flex-initial px-4 py-2.5 min-h-11 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition shadow-md shadow-indigo-600/30 flex items-center justify-center gap-2 touch-manipulation"
          >
            <MessageSquareText className="size-3.5" />
            <span>Open Chat</span>
          </button>
        </div>
      </div>

      <div className="glass-panel rounded-3xl p-4 sm:p-5 border border-emerald-500/25 bg-emerald-500/5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="min-w-0">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <Smartphone className="size-4 text-emerald-400 shrink-0" />
            Auto-fetch mobiles · see who is on PulseChat
          </h3>
          <p className="text-[11px] text-slate-400 mt-1">
            {deviceSync
              ? "Chrome asks you to pick contacts — we pull every mobile + email, then highlight who already signed up."
              : "On desktop, paste Name, email, phone lines. On Android Chrome (HTTPS) the phone picker can auto-fetch mobiles."}
          </p>
          <p className="text-[11px] text-emerald-300/90 mt-1.5 font-mono">
            {mobileSyncedCount} mobile
            {mobileSyncedCount === 1 ? "" : "s"} synced · {availableCount}{" "}
            available on PulseChat
          </p>
        </div>
        <div className="flex flex-wrap gap-2 shrink-0">
          <button
            type="button"
            onClick={resyncContacts}
            disabled={isSyncing}
            className="px-4 py-2.5 min-h-11 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-60 text-white text-xs font-bold flex items-center gap-2"
          >
            {isSyncing ? (
              <Loader2 className="size-3.5 animate-spin" />
            ) : (
              <Smartphone className="size-3.5" />
            )}
            Fetch mobiles now
          </button>
          <button
            type="button"
            onClick={() => setShowAvailableOnly((v) => !v)}
            className={cn(
              "px-3.5 py-2.5 min-h-11 rounded-xl text-xs font-semibold border transition",
              showAvailableOnly
                ? "bg-indigo-600 text-white border-indigo-500"
                : "bg-slate-800/80 text-slate-300 border-white/10 hover:bg-slate-700",
            )}
          >
            {showAvailableOnly ? "Showing available" : "Available only"}
          </button>
        </div>
      </div>

      {pasteOpen && (
        <div className="glass-panel rounded-3xl p-4 sm:p-5 border border-white/10 space-y-3">
          <h3 className="text-sm font-bold text-white">
            Paste contacts (email and/or phone)
          </h3>
          <p className="text-[11px] text-slate-500">
            One per line:{" "}
            <code className="text-slate-400">Name, email, phone</code> — e.g.{" "}
            <code className="text-slate-400">
              Raushan, raushan@email.com, +919334803286
            </code>
          </p>
          <textarea
            value={pasteText}
            onChange={(e) => setPasteText(e.target.value)}
            rows={5}
            placeholder={"Raushan, friend@email.com, +919334803286\nAlex, alex@mail.com\nSam, , +15551234567"}
            className="w-full glass-card text-sm rounded-xl px-3 py-2.5 text-white border border-white/10 bg-transparent placeholder-slate-500 focus:outline-none focus:border-indigo-500 font-mono"
          />
          <button
            type="button"
            disabled={isSyncing || !pasteText.trim()}
            onClick={() => void onPasteImport()}
            className="px-4 py-2.5 min-h-11 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-60 text-white text-xs font-bold"
          >
            Import pasted contacts
          </button>
        </div>
      )}

      {(formOpen || contacts.length === 0) && (
        <form
          onSubmit={onAdd}
          className="glass-panel rounded-3xl p-4 sm:p-5 border border-white/10 space-y-3"
        >
          <div className="flex items-center justify-between gap-2">
            <h3 className="text-sm font-bold text-white">Add a contact</h3>
            <p className="text-[11px] text-slate-500">
              Fill email and/or phone
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <div>
              <label className="text-[11px] text-slate-400 block mb-1.5">
                Name
              </label>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                placeholder="Friend's name"
                className="w-full glass-card text-sm rounded-xl px-3 py-2.5 min-h-11 text-white border border-white/10 bg-transparent placeholder-slate-500 focus:outline-none focus:border-indigo-500"
              />
            </div>
            <div>
              <label className="text-[11px] text-slate-400 block mb-1.5">
                Email
              </label>
              <input
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                type="email"
                placeholder="friend@email.com"
                autoComplete="email"
                className="w-full glass-card text-sm rounded-xl px-3 py-2.5 min-h-11 text-white border border-white/10 bg-transparent placeholder-slate-500 focus:outline-none focus:border-indigo-500"
              />
            </div>
            <div>
              <label className="text-[11px] text-slate-400 block mb-1.5">
                {platform === "telegram"
                  ? "Telegram @username or phone"
                  : "Phone"}
              </label>
              <input
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                type={platform === "telegram" ? "text" : "tel"}
                inputMode={platform === "telegram" ? "text" : "tel"}
                placeholder={
                  platform === "telegram"
                    ? "@rajeev or +9198…"
                    : "+919334803286"
                }
                className="w-full glass-card text-sm rounded-xl px-3 py-2.5 min-h-11 text-white border border-white/10 bg-transparent placeholder-slate-500 focus:outline-none focus:border-indigo-500"
              />
            </div>
            <div>
              <label className="text-[11px] text-slate-400 block mb-1.5">
                Platform
              </label>
              <select
                value={platform}
                onChange={(e) =>
                  setPlatform(e.target.value as Platform | "auto")
                }
                className="w-full glass-card text-sm rounded-xl px-3 py-2.5 min-h-11 text-white border border-white/10 bg-[#0b101d] focus:outline-none focus:border-indigo-500"
              >
                {PLATFORM_OPTIONS.map((p) => (
                  <option key={p.value} value={p.value}>
                    {p.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <button
            type="submit"
            disabled={
              isAddingContact ||
              !name.trim() ||
              (!email.trim() && !phone.trim())
            }
            className="w-full sm:w-auto px-4 py-2.5 min-h-11 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-60 text-white text-xs font-bold transition flex items-center justify-center gap-2"
          >
            {isAddingContact ? (
              <Loader2 className="size-3.5 animate-spin" />
            ) : (
              <Plus className="size-3.5" />
            )}
            Add to contacts
          </button>
        </form>
      )}

      {syncError && (
        <div className="rounded-2xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-sm text-rose-100">
          <p>{syncError}</p>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={clearSyncError}
              className="px-3 py-1.5 rounded-xl text-xs border border-white/10 hover:bg-white/5"
            >
              Dismiss
            </button>
            <button
              type="button"
              onClick={resyncContacts}
              className="px-3 py-1.5 rounded-xl text-xs bg-rose-500/30 hover:bg-rose-500/40 font-semibold"
            >
              Retry sync
            </button>
          </div>
        </div>
      )}

      <div className="space-y-3">
        <div className="relative w-full">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 size-3.5" />
          <input
            value={discoverySearch}
            onChange={(e) => setDiscoverySearch(e.target.value)}
            type="text"
            placeholder="Search by name, email, phone, or network..."
            className="w-full glass-card pl-11 pr-4 py-3 rounded-2xl text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 border border-white/10 transition"
          />
        </div>

        <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs no-scrollbar">
          {FILTERS.map((f) => {
            const count =
              f.key === "all"
                ? contacts.length
                : contacts.filter((c) => c.platform === f.key).length;
            const active = discoveryFilter === f.key;
            return (
              <button
                key={f.key}
                type="button"
                onClick={() => setDiscoveryFilter(f.key)}
                className={cn(
                  "px-3.5 py-2 rounded-xl whitespace-nowrap transition flex items-center gap-1.5",
                  active
                    ? "bg-indigo-600 text-white font-bold"
                    : "bg-slate-800/60 hover:bg-slate-800 text-slate-400 hover:text-white font-medium border border-white/5",
                )}
              >
                {f.icon}
                {f.key === "all" ? `All (${count})` : f.label}
              </button>
            );
          })}
        </div>
      </div>

      {isSyncing ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pb-12">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="glass-card rounded-2xl p-5 h-44 animate-pulse border border-white/10"
            >
              <div className="w-12 h-12 rounded-xl bg-slate-700/50 mb-4" />
              <div className="h-3 w-1/2 bg-slate-700/50 rounded mb-2" />
              <div className="h-2 w-2/3 bg-slate-700/40 rounded" />
            </div>
          ))}
          <div className="col-span-full flex items-center justify-center gap-2 text-sm text-indigo-300 py-2">
            <Loader2 className="size-4 animate-spin" />
            Syncing email &amp; phone from your phonebook…
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pb-16 sm:pb-12 overflow-y-auto max-h-[min(60dvh,32rem)] pr-1">
          {filtered.length === 0 ? (
            <div className="col-span-1 md:col-span-2 lg:col-span-3 text-center py-12 text-slate-500 text-sm glass-card rounded-3xl space-y-3">
              <Users className="size-8 mb-2 text-slate-600 mx-auto block" />
              <p>
                {contacts.length === 0
                  ? "No contacts yet. Sync your phonebook or add email/phone above."
                  : "No contacts match your current filter or search."}
              </p>
              {contacts.length === 0 && (
                <button
                  type="button"
                  onClick={resyncContacts}
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold"
                >
                  <Smartphone className="size-3.5" />
                  Sync phone contacts
                </button>
              )}
            </div>
          ) : (
            filtered.map((c) => {
              let bridgeBadge: ReactNode;
              if (c.onPulse || c.platform === "pulse") {
                bridgeBadge = (
                  <span className="text-[10px] bg-indigo-500/25 text-indigo-200 px-2 py-0.5 rounded-full border border-indigo-400/40 font-semibold">
                    Available on PulseChat
                  </span>
                );
              } else if (c.platform === "whatsapp") {
                bridgeBadge = (
                  <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded-full border border-emerald-500/30 font-semibold">
                    Mobile · WhatsApp
                  </span>
                );
              } else {
                bridgeBadge = (
                  <span className="text-[10px] bg-amber-500/20 text-amber-300 px-2 py-0.5 rounded-full border border-amber-500/30 font-semibold">
                    {c.platformName}
                  </span>
                );
              }

              const email =
                c.email ||
                c.peerEmail ||
                (c.handle.includes("@") ? c.handle : "");
              const mobile =
                c.mobile ||
                (c.phone && !c.phone.includes("@") ? c.phone : "");

              return (
                <div
                  key={c.id}
                  className={cn(
                    "glass-card glass-card-hover p-4 sm:p-5 rounded-2xl flex flex-col justify-between border",
                    c.onPulse
                      ? "border-indigo-500/40 ring-1 ring-indigo-500/20"
                      : "border-white/10",
                  )}
                >
                  <div>
                    <div className="flex items-start justify-between mb-3 gap-2">
                      <div className="relative">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={c.avatar}
                          alt=""
                          className="w-12 h-12 rounded-xl object-cover ring-2 ring-white/10"
                        />
                        <div className="absolute -bottom-1 -right-1">
                          <PlatformBadge platform={c.platform} size="md" />
                        </div>
                      </div>
                      {bridgeBadge}
                    </div>
                    <h4 className="font-bold text-sm text-white">{c.name}</h4>
                    {mobile ? (
                      <p className="text-xs text-emerald-300/90 font-mono mt-1 truncate">
                        ☎ {mobile}
                      </p>
                    ) : null}
                    {email ? (
                      <p className="text-[11px] text-slate-400 font-mono mt-0.5 truncate">
                        ✉ {email}
                      </p>
                    ) : null}
                    {!email && !mobile ? (
                      <p className="text-xs text-slate-500 font-mono mt-0.5 truncate">
                        {c.handle}
                      </p>
                    ) : null}
                    {c.onPulse ? (
                      <p className="text-[11px] text-indigo-300 mt-1.5">
                        Already on PulseChat — chat natively
                      </p>
                    ) : null}
                  </div>
                  <div className="mt-4 pt-3 border-t border-white/5 flex items-center justify-between">
                    <span className="text-[11px] text-slate-400 font-medium">
                      {c.onPulse ? "Native Pulse" : c.platformName}
                    </span>
                    <button
                      type="button"
                      onClick={() => startChat(c.id)}
                      className="px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-md shadow-indigo-600/30 transition active:scale-95"
                    >
                      Chat Now
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}
    </section>
  );
}
