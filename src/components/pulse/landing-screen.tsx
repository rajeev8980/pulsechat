"use client";

import { ArrowRight, Bolt, Lock } from "lucide-react";
import { FaBolt, FaFacebookMessenger, FaInstagram, FaTelegram, FaWhatsapp } from "react-icons/fa6";
import { MdSms } from "react-icons/md";
import { PREVIEW_FEED } from "@/lib/data";
import { getBorderAccent, getPlatformTextColor } from "@/lib/platform";
import { PlatformBadge } from "./platform-icon";
import { usePulse } from "./pulse-context";
import { cn } from "@/lib/utils";

function GoogleMark({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden>
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
      />
    </svg>
  );
}

export function LandingScreen() {
  const { openGoogleModal } = usePulse();

  return (
    <section className="flex-1 flex flex-col justify-between px-3 sm:px-6 lg:px-12 py-3 sm:py-5 max-w-7xl mx-auto w-full animate-in fade-in duration-300">
      <nav className="flex items-center justify-between py-2.5 sm:py-3 glass-panel px-3 sm:px-6 rounded-2xl shadow-xl gap-2">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl pulse-grad flex items-center justify-center shadow-lg shadow-indigo-500/30">
            <FaBolt className="text-white text-lg" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-xl font-extrabold tracking-tight text-white">
              Pulse<span className="text-indigo-400">Chat</span>
            </span>
            <span className="hidden sm:inline-block text-[10px] font-semibold tracking-wider uppercase px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 font-mono">
              Omnichannel v3.0
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          <button
            type="button"
            onClick={() => openGoogleModal("signin")}
            className="text-xs sm:text-sm font-semibold text-slate-300 hover:text-white px-3 sm:px-3.5 py-2.5 min-h-11 rounded-xl transition hover:bg-white/5 border border-white/10 touch-manipulation"
          >
            Sign in
          </button>
          <button
            type="button"
            onClick={() => openGoogleModal("signup")}
            className="text-xs sm:text-sm font-semibold bg-indigo-600 hover:bg-indigo-500 text-white px-3 sm:px-4 py-2.5 min-h-11 rounded-xl transition shadow-md shadow-indigo-600/30 flex items-center gap-2 touch-manipulation"
          >
            <span className="hidden xs:inline sm:inline">Create account</span>
            <span className="sm:hidden">Signup</span>
            <ArrowRight className="size-3" />
          </button>
        </div>
      </nav>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center my-auto py-10 lg:py-16">
        <div className="lg:col-span-7 space-y-6 text-center lg:text-left">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full glass-card text-xs font-semibold text-indigo-300 border border-indigo-500/30">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            Seamless Message Bridges Across 5 Major Platforms + SMS
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight leading-[1.12] text-white">
            One Inbox for <br />
            <span className="bg-gradient-to-r from-indigo-300 via-purple-300 to-pink-300 bg-clip-text text-transparent">
              Every Messaging App.
            </span>
          </h1>

          <p className="text-slate-400 text-base sm:text-lg max-w-xl mx-auto lg:mx-0 font-normal leading-relaxed">
            Message directly from PulseChat. Your friends receive an instant
            one-tap push notification inside{" "}
            <strong className="text-emerald-400">WhatsApp</strong>,{" "}
            <strong className="text-sky-400">Telegram</strong>,{" "}
            <strong className="text-pink-400">Instagram Direct</strong>,{" "}
            <strong className="text-blue-400">Messenger</strong>, or{" "}
            <strong className="text-teal-400">Carrier SMS</strong> to chat right
            back. No new apps required for them!
          </p>

          <div className="glass-card p-6 rounded-3xl max-w-md mx-auto lg:mx-0 shadow-2xl border border-white/10 space-y-4">
            <button
              type="button"
              onClick={() => openGoogleModal("signin")}
              className="w-full flex items-center justify-center gap-3 bg-white hover:bg-slate-100 text-slate-800 font-bold py-3.5 px-6 min-h-12 rounded-2xl transition duration-200 shadow-lg active:scale-[0.99] group touch-manipulation text-sm sm:text-base"
            >
              <GoogleMark className="w-5 h-5 transition-transform group-hover:scale-110" />
              <span>Continue with email</span>
            </button>

            <div className="flex items-center gap-3">
              <div className="flex-1 h-px bg-slate-700/60" />
              <span className="text-[11px] text-slate-400 uppercase tracking-wider font-semibold font-mono">
                Your inbox, your contacts
              </span>
              <div className="flex-1 h-px bg-slate-700/60" />
            </div>

            <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-400">
              <div className="flex items-center gap-1.5">
                <Lock className="size-3 text-emerald-400" /> No demo accounts
              </div>
              <div className="flex items-center gap-1.5">
                <Bolt className="size-3 text-indigo-400" /> Add people yourself
              </div>
            </div>
          </div>

          <div className="pt-2 flex flex-wrap items-center justify-center lg:justify-start gap-2 text-xs">
            <span className="px-2.5 py-1 rounded-xl bg-indigo-500/10 border border-indigo-500/30 text-indigo-300 flex items-center gap-1.5 font-medium">
              <FaBolt className="text-sm" /> Pulse Native
            </span>
            <span className="px-2.5 py-1 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex items-center gap-1.5 font-medium">
              <FaWhatsapp className="text-sm" /> WhatsApp
            </span>
            <span className="px-2.5 py-1 rounded-xl bg-sky-500/10 border border-sky-500/30 text-sky-400 flex items-center gap-1.5 font-medium">
              <FaTelegram className="text-sm" /> Telegram
            </span>
            <span className="px-2.5 py-1 rounded-xl bg-pink-500/10 border border-pink-500/30 text-pink-400 flex items-center gap-1.5 font-medium">
              <FaInstagram className="text-sm" /> Instagram Direct
            </span>
            <span className="px-2.5 py-1 rounded-xl bg-blue-500/10 border border-blue-500/30 text-blue-400 flex items-center gap-1.5 font-medium">
              <FaFacebookMessenger className="text-sm" /> Messenger
            </span>
            <span className="px-2.5 py-1 rounded-xl bg-teal-500/10 border border-teal-500/30 text-teal-400 flex items-center gap-1.5 font-medium">
              <MdSms className="text-sm" /> Carrier SMS
            </span>
          </div>
        </div>

        <div className="lg:col-span-5 relative">
          <div className="glass-panel p-5 rounded-3xl border border-white/15 shadow-2xl relative">
            <div className="flex items-center justify-between pb-3 mb-4 border-b border-white/10">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-rose-500 inline-block" />
                <span className="w-3 h-3 rounded-full bg-amber-500 inline-block" />
                <span className="w-3 h-3 rounded-full bg-emerald-500 inline-block" />
              </div>
              <span className="text-xs font-mono text-slate-400">
                Pulse Omnichannel Bridge
              </span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                Active
              </span>
            </div>

            <div className="space-y-3.5 text-xs">
              {PREVIEW_FEED.map((item) => (
                <div
                  key={item.name}
                  className={cn(
                    "flex items-start gap-2.5 p-2.5 rounded-2xl bg-slate-900/60 border",
                    getBorderAccent(item.platformKey),
                  )}
                >
                  <PlatformBadge
                    platform={item.platformKey}
                    size="md"
                    className="w-8 h-8 text-xs rounded-full"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-bold text-white text-xs">
                        {item.name}
                      </span>
                      <span
                        className={cn(
                          "text-[10px] font-mono shrink-0",
                          getPlatformTextColor(item.platformKey),
                        )}
                      >
                        {item.platform}
                      </span>
                    </div>
                    <p className="text-slate-300 text-[11px] mt-0.5">
                      {item.text}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-4 pt-3 border-t border-white/10 flex items-center justify-between text-[11px] text-slate-400">
              <span>Ready to test the live bridge?</span>
              <button
                type="button"
                onClick={() => openGoogleModal("signin")}
                className="text-indigo-400 hover:text-indigo-300 font-bold flex items-center gap-1 transition"
              >
                <span>Sign in with email</span>
                <ArrowRight className="size-2.5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      <footer className="py-4 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-2">
        <div>&copy; 2026 PulseChat Platform • Omnichannel Bridge Protocol</div>
        <div className="flex items-center gap-4">
          <span>End-to-End Encryption</span>
          <span>Zero-Knowledge Relay</span>
          <span>Carrier Gateways</span>
        </div>
      </footer>
    </section>
  );
}
