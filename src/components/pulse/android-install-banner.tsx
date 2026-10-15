"use client";

import { useEffect, useState } from "react";
import { Download, Share2, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

function isStandalone() {
  if (typeof window === "undefined") return false;
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    // @ts-expect-error iOS legacy
    Boolean(window.navigator.standalone)
  );
}

function isAndroid() {
  if (typeof navigator === "undefined") return false;
  return /Android/i.test(navigator.userAgent);
}

export function AndroidInstallBanner() {
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(
    null,
  );
  const [visible, setVisible] = useState(false);
  const [hintMode, setHintMode] = useState<"chrome" | "manual" | null>(null);

  useEffect(() => {
    if (isStandalone()) return;
    const dismissed = sessionStorage.getItem("pulse-install-dismissed");
    if (dismissed) return;

    const onBip = (e: Event) => {
      e.preventDefault();
      setDeferred(e as BeforeInstallPromptEvent);
      setHintMode("chrome");
      setVisible(true);
    };
    window.addEventListener("beforeinstallprompt", onBip);

    // Android browsers without BIP still get a soft install tip
    const t = window.setTimeout(() => {
      if (!isStandalone() && isAndroid() && !sessionStorage.getItem("pulse-install-dismissed")) {
        setHintMode((m) => m ?? "manual");
        setVisible(true);
      }
    }, 2500);

    return () => {
      window.removeEventListener("beforeinstallprompt", onBip);
      window.clearTimeout(t);
    };
  }, []);

  if (!visible || !hintMode) return null;

  async function install() {
    if (!deferred) return;
    await deferred.prompt();
    await deferred.userChoice;
    setVisible(false);
    setDeferred(null);
  }

  function dismiss() {
    sessionStorage.setItem("pulse-install-dismissed", "1");
    setVisible(false);
  }

  return (
    <div
      className={cn(
        "fixed z-40 left-3 right-3 sm:left-auto sm:right-4 sm:max-w-sm",
        "bottom-[max(0.75rem,env(safe-area-inset-bottom))]",
        "glass-panel rounded-2xl border border-indigo-500/30 p-3.5 shadow-2xl",
        "animate-in slide-in-from-bottom-4 fade-in duration-300",
      )}
      role="dialog"
      aria-label="Install PulseChat"
    >
      <div className="flex items-start gap-3">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/icons/icon-192.png"
          alt=""
          className="w-11 h-11 rounded-xl shrink-0 shadow-md"
        />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold text-white leading-tight">
            Install PulseChat on Android
          </p>
          <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
            {hintMode === "chrome"
              ? "Add to your home screen for a full-screen messenger experience."
              : "In Chrome: menu → Install app / Add to Home screen."}
          </p>
          <div className="flex items-center gap-2 mt-3">
            {hintMode === "chrome" && deferred ? (
              <button
                type="button"
                onClick={() => void install()}
                className="flex items-center gap-1.5 text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white px-3 py-2 rounded-xl min-h-10"
              >
                <Download className="size-3.5" />
                Install app
              </button>
            ) : (
              <span className="flex items-center gap-1.5 text-[11px] font-semibold text-indigo-300 px-2 py-1">
                <Share2 className="size-3.5" />
                Add to Home screen
              </span>
            )}
            <button
              type="button"
              onClick={dismiss}
              className="text-[11px] text-slate-400 hover:text-white px-2 py-2 min-h-10"
            >
              Not now
            </button>
          </div>
        </div>
        <button
          type="button"
          onClick={dismiss}
          className="p-2 text-slate-400 hover:text-white rounded-lg min-h-10 min-w-10 flex items-center justify-center"
          aria-label="Dismiss"
        >
          <X className="size-4" />
        </button>
      </div>
    </div>
  );
}
