"use client";

import { useState } from "react";
import { X } from "lucide-react";
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
    isLoggingIn,
  } = usePulse();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");

  if (!googleModalOpen) return null;

  function submit() {
    const trimmedEmail = email.trim();
    const trimmedName = name.trim();
    const trimmedPhone = phone.trim();
    if (!trimmedEmail.includes("@")) return;
    const display =
      trimmedName ||
      trimmedEmail
        .split("@")[0]
        .replace(/[._]/g, " ")
        .replace(/\b\w/g, (c) => c.toUpperCase());
    login({
      name: display,
      email: trimmedEmail,
      phone: trimmedPhone || undefined,
      avatar: `https://api.dicebear.com/9.x/initials/svg?seed=${encodeURIComponent(display)}&backgroundColor=4f46e5`,
    });
  }

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
              {googleIntent === "signup" ? "Create your account" : "Sign in"}
            </h3>
            <p className="text-[11px] text-slate-400">
              Continue to{" "}
              <strong className="text-indigo-400">PulseChat</strong> — email +
              mobile so friends can find you
            </p>
          </div>
        </div>

        {isLoggingIn ? (
          <div className="py-10 text-center space-y-3">
            <div className="mx-auto w-8 h-8 rounded-full border-2 border-indigo-400 border-t-transparent animate-spin" />
            <p className="text-sm text-slate-300">Setting up your inbox…</p>
          </div>
        ) : (
          <form
            className="space-y-3"
            onSubmit={(e) => {
              e.preventDefault();
              submit();
            }}
          >
            <div>
              <label className="text-[11px] text-slate-400 block mb-1.5">
                Your name
              </label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your name"
                autoComplete="name"
                className="w-full glass-card text-sm rounded-xl px-3 py-2.5 h-auto min-h-11 text-white border-white/10 bg-transparent"
              />
            </div>
            <div>
              <label className="text-[11px] text-slate-400 block mb-1.5">
                Email
              </label>
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@email.com"
                autoComplete="email"
                required
                className="w-full glass-card text-sm rounded-xl px-3 py-2.5 h-auto min-h-11 text-white border-white/10 bg-transparent"
              />
            </div>
            <div>
              <label className="text-[11px] text-slate-400 block mb-1.5">
                Mobile number{" "}
                <span className="text-slate-500">(so contacts find you)</span>
              </label>
              <Input
                type="tel"
                inputMode="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+919334803286"
                autoComplete="tel"
                className="w-full glass-card text-sm rounded-xl px-3 py-2.5 h-auto min-h-11 text-white border-white/10 bg-transparent"
              />
            </div>
            <Button
              type="submit"
              className="w-full bg-indigo-600 hover:bg-indigo-500 text-sm py-3 h-auto min-h-11 rounded-xl text-white font-bold"
            >
              Continue
            </Button>
            <p className="text-[10px] text-slate-500 text-center">
              After sign-in, fetch mobiles from your phonebook — we highlight who
              is already on PulseChat.
            </p>
          </form>
        )}
      </div>
    </div>
  );
}
