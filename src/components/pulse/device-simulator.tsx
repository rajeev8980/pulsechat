"use client";

import { Check, Link2, Reply } from "lucide-react";
import { usePulse } from "./pulse-context";
import { PlatformIcon } from "./platform-icon";
import { getPlatformBadgeClass } from "@/lib/platform";
import { cn } from "@/lib/utils";

export function DeviceSimulator() {
  const {
    simulatorOpen,
    closeSimulator,
    activeContact,
    messages,
    user,
    acceptBridge,
    simulateReply,
  } = usePulse();

  if (!simulatorOpen || !activeContact) return null;

  const thread = messages[activeContact.id] || [];
  const excerpt =
    thread.length > 0
      ? thread[thread.length - 1].text
      : "Hey! Testing the cross-platform bridge.";
  const time = new Date().toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
      <div className="relative w-full max-w-sm bg-[#0a0f1d] rounded-[44px] border-[5px] border-slate-700 shadow-2xl p-4 overflow-hidden text-slate-100 flex flex-col justify-between">
        <div className="w-28 h-4 bg-slate-900 rounded-full mx-auto mb-3 flex items-center justify-center">
          <div className="w-2 h-2 rounded-full bg-slate-950 mr-2" />
          <div className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
        </div>

        <div className="flex items-center justify-between text-xs text-slate-400 px-3 mb-2 font-mono">
          <span className="font-bold text-white text-[11px]">{time}</span>
          <div className="flex items-center gap-1.5 text-[10px]">
            <span>●●●</span>
            <span className="text-emerald-400">▮</span>
          </div>
        </div>

        <div className="text-center py-1">
          <h4 className="text-xs font-extrabold text-white uppercase tracking-wider">
            {activeContact.name}&apos;s Phone Screen
          </h4>
          <p className="text-[10px] text-slate-400">
            {activeContact.platformName} Lock Screen Push
          </p>
        </div>

        <div className="my-3 p-4 rounded-2xl glass-panel border border-white/10 shadow-xl space-y-2.5">
          <div className="flex items-start gap-3">
            <div
              className={cn(
                "w-9 h-9 rounded-xl flex items-center justify-center text-white text-sm shadow-md shrink-0",
                getPlatformBadgeClass(activeContact.platform),
              )}
            >
              <PlatformIcon platform={activeContact.platform} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-white">
                  {activeContact.platformName} Notification
                </span>
                <span className="text-[10px] text-slate-400 font-mono">now</span>
              </div>
              <p className="text-xs font-bold text-indigo-300 mt-1">
                {user.name} via PulseChat
              </p>
              <p className="text-[11px] text-slate-200 mt-0.5 leading-snug">
                &ldquo;{excerpt}&rdquo;
              </p>
            </div>
          </div>
        </div>

        <div className="space-y-2 pt-2">
          {activeContact.bridgeConnected ? (
            <div className="w-full py-2.5 text-xs font-bold rounded-xl bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center justify-center gap-2">
              <Check className="size-3.5" /> Connection Already Bridged
            </div>
          ) : (
            <button
              type="button"
              onClick={acceptBridge}
              className="w-full py-2.5 text-xs font-bold rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 transition flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/25"
            >
              <Link2 className="size-3.5" />
              Accept & Bridge Connection
            </button>
          )}

          <button
            type="button"
            onClick={simulateReply}
            className="w-full py-2 text-xs font-semibold rounded-xl bg-white/10 hover:bg-white/15 text-slate-200 transition flex items-center justify-center gap-2"
          >
            <Reply className="size-3.5" />
            Send Simulated Reply Back
          </button>

          <button
            type="button"
            onClick={closeSimulator}
            className="w-full py-1.5 text-xs text-slate-400 hover:text-white transition"
          >
            Dismiss Simulator
          </button>
        </div>

        <div className="w-24 h-1 bg-slate-600 rounded-full mx-auto mt-3" />
      </div>
    </div>
  );
}
