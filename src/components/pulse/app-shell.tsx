"use client";

import { AmbientGlow } from "./ambient";
import { AndroidInstallBanner } from "./android-install-banner";
import { ChatWorkspace } from "./chat-workspace";
import { ContactFetchModal } from "./contact-fetch-modal";
import { DeviceSimulator } from "./device-simulator";
import { DiscoveryScreen } from "./discovery-screen";
import { GoogleModal } from "./google-modal";
import { LandingScreen } from "./landing-screen";
import { PulseProvider, usePulse } from "./pulse-context";
import { Toast } from "./toast";

function Screens() {
  const { screen, isBooting, apiError } = usePulse();

  if (isBooting) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center gap-4 px-6 bg-[#0b141a]">
        <div className="w-12 h-12 rounded-full bg-[#00a884] flex items-center justify-center shadow-lg shadow-emerald-900/40 animate-pulse">
          <span className="text-[#0b141a] text-xl font-black">P</span>
        </div>
        <p className="text-sm text-slate-300 font-semibold">Opening chats…</p>
        <button
          type="button"
          className="mt-2 text-xs font-semibold text-[#00a884] underline"
          onClick={() => window.location.reload()}
        >
          Tap to retry / refresh
        </button>
      </div>
    );
  }

  return (
    <>
      {apiError && screen === "landing" && (
        <div className="mx-auto mt-4 max-w-7xl w-full px-4 sm:px-6 lg:px-12">
          <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-xs text-amber-100 space-y-1">
            <p>{apiError}</p>
            <p className="text-amber-200/80">
              If you installed an older icon, delete it and open the latest live
              link in Chrome, then Install again. Host:{" "}
              <span className="font-mono">
                {typeof window !== "undefined" ? window.location.host : "…"}
              </span>
            </p>
          </div>
        </div>
      )}
      {screen === "landing" && (
        <>
          <AmbientGlow />
          <LandingScreen />
        </>
      )}
      {screen === "discovery" && <DiscoveryScreen />}
      {screen === "chat" && <ChatWorkspace />}
      <ContactFetchModal />
      <GoogleModal />
      <DeviceSimulator />
      <AndroidInstallBanner />
      <Toast />
    </>
  );
}

export function PulseApp() {
  return (
    <PulseProvider>
      <div className="bg-[#0b141a] text-slate-100 font-sans antialiased min-h-dvh selection:bg-[#00a884]/40 selection:text-white flex flex-col justify-between overflow-x-hidden relative pb-[env(safe-area-inset-bottom)] pt-[env(safe-area-inset-top)]">
        <div className="relative z-10 flex-1 flex flex-col w-full min-h-0">
          <Screens />
        </div>
      </div>
    </PulseProvider>
  );
}
