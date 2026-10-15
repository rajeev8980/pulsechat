"use client";

import { useState } from "react";
import { ChevronRight, X } from "lucide-react";
import { GOOGLE_ACCOUNTS } from "@/lib/data";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { usePulse } from "./pulse-context";

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

export function GoogleModal() {
  const {
    googleModalOpen,
    googleIntent,
    closeGoogleModal,
    login,
    loginCustom,
    isLoggingIn,
  } = usePulse();
  const [customEmail, setCustomEmail] = useState("");

  if (!googleModalOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
      <div
        className="glass-panel w-full max-w-sm rounded-3xl p-6 border border-white/15 shadow-2xl relative text-slate-100"
        role="dialog"
        aria-modal="true"
        aria-labelledby="google-modal-title"
      >
        <button
          type="button"
          onClick={closeGoogleModal}
          className="absolute top-4 right-4 text-slate-400 hover:text-white p-1"
          aria-label="Close"
        >
          <X className="size-4" />
        </button>

        <div className="flex items-center gap-3 mb-5">
          <GoogleMark className="w-7 h-7" />
          <div>
            <h3
              id="google-modal-title"
              className="text-base font-bold text-white leading-tight"
            >
              {googleIntent === "signup"
                ? "Sign up with Google"
                : "Sign in with Google"}
            </h3>
            <p className="text-[11px] text-slate-400">
              to continue to{" "}
              <strong className="text-indigo-400">PulseChat</strong>
            </p>
          </div>
        </div>

        {isLoggingIn ? (
          <div className="py-10 text-center space-y-3">
            <div className="mx-auto w-8 h-8 rounded-full border-2 border-indigo-400 border-t-transparent animate-spin" />
            <p className="text-sm text-slate-300">Syncing Gmail contacts…</p>
            <p className="text-[11px] text-slate-500 font-mono">
              Matching 6 platform bridges
            </p>
          </div>
        ) : (
          <>
            <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-3 font-mono">
              Choose an active account
            </p>
            <div className="space-y-2.5">
              {GOOGLE_ACCOUNTS.map((account, i) => (
                <button
                  key={account.email}
                  type="button"
                  onClick={() => login(account)}
                  className="w-full p-3 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 cursor-pointer flex items-center justify-between transition group text-left"
                >
                  <div className="flex items-center gap-3">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={account.avatar}
                      alt=""
                      className="w-9 h-9 rounded-full object-cover"
                    />
                    <div>
                      <p className="text-xs font-bold text-white group-hover:text-indigo-300 transition">
                        {account.name}
                      </p>
                      <p className="text-[11px] text-slate-400 font-mono">
                        {account.email}
                      </p>
                    </div>
                  </div>
                  {i === 0 ? (
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300">
                      Default
                    </span>
                  ) : (
                    <ChevronRight className="size-3 text-slate-500 group-hover:text-white transition" />
                  )}
                </button>
              ))}
            </div>

            <div className="mt-4 pt-3.5 border-t border-white/10">
              <label className="text-[11px] text-slate-400 block mb-1.5">
                Or enter another Gmail account:
              </label>
              <div className="flex gap-2">
                <Input
                  type="email"
                  value={customEmail}
                  onChange={(e) => setCustomEmail(e.target.value)}
                  placeholder="name@gmail.com"
                  className="flex-1 glass-card text-xs rounded-xl px-3 py-2 h-auto text-white border-white/10 bg-transparent"
                  onKeyDown={(e) => {
                    if (e.key === "Enter") loginCustom(customEmail);
                  }}
                />
                <Button
                  type="button"
                  onClick={() => loginCustom(customEmail)}
                  className="bg-indigo-600 hover:bg-indigo-500 text-xs px-3.5 py-2 h-auto rounded-xl text-white font-bold"
                >
                  Next
                </Button>
              </div>
            </div>

            <div className="mt-4 text-[10px] text-slate-500 text-center">
              By connecting, PulseChat automatically syncs your omnichannel
              contact directory.
            </div>
          </>
        )}
      </div>
    </div>
  );
}
