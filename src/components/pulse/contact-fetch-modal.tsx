"use client";

import { useMemo, useState } from "react";
import { Loader2, Smartphone, X } from "lucide-react";
import { canPickDeviceContacts } from "@/lib/device-contacts";
import { usePulse } from "./pulse-context";

export function ContactFetchModal() {
  const {
    contactFetchPrompt,
    dismissContactFetchPrompt,
    resyncContacts,
    isSyncing,
    setScreen,
  } = usePulse();
  const deviceSync = useMemo(() => canPickDeviceContacts(), []);
  const [openingPaste, setOpeningPaste] = useState(false);

  if (!contactFetchPrompt) return null;

  async function onFetch() {
    if (!deviceSync) {
      dismissContactFetchPrompt();
      setOpeningPaste(true);
      setScreen("discovery");
      return;
    }
    dismissContactFetchPrompt();
    await resyncContacts();
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div
        className="w-full max-w-md rounded-3xl p-6 border border-emerald-700/40 shadow-2xl relative bg-[#1f2c34]"
        role="dialog"
        aria-modal="true"
        aria-labelledby="contact-fetch-title"
      >
        <button
          type="button"
          onClick={dismissContactFetchPrompt}
          className="absolute top-4 right-4 text-slate-400 hover:text-white p-1"
          aria-label="Close"
        >
          <X className="size-4" />
        </button>
        <div className="w-14 h-14 rounded-2xl bg-emerald-600/20 border border-emerald-500/40 flex items-center justify-center mb-4">
          <Smartphone className="size-7 text-emerald-400" />
        </div>
            <h3
              id="contact-fetch-title"
              className="text-xl font-extrabold text-white"
            >
              Load all contacts into PulseChat
            </h3>
            <p className="text-sm text-slate-400 mt-2">
              {deviceSync
                ? "One step: phonebook opens — tap Select all (or multi-select), then Confirm. Contacts stay in PulseChat; no manual sync later."
                : "Use Chrome on Android for one-tap phonebook load, or paste contacts."}
            </p>
            <button
              type="button"
              disabled={isSyncing || openingPaste}
              onClick={() => void onFetch()}
              className="mt-5 w-full px-4 py-3.5 min-h-12 rounded-xl bg-[#00a884] hover:bg-[#06cf9c] disabled:opacity-60 text-[#0b141a] text-sm font-bold flex items-center justify-center gap-2"
            >
              {isSyncing ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Smartphone className="size-4" />
              )}
              {deviceSync ? "Load all contacts" : "Open contacts"}
            </button>
      </div>
    </div>
  );
}
