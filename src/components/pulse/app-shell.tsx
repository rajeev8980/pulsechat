"use client";

import { AmbientGlow } from "./ambient";
import { ChatWorkspace } from "./chat-workspace";
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
      <div className="flex-1 flex flex-col items-center justify-center gap-4 px-6">
        <div className="w-12 h-12 rounded-2xl pulse-grad flex items-center justify-center shadow-lg shadow-indigo-500/30 animate-pulse">
          <span className="text-white text-xl font-black">P</span>
        </div>
        <p className="text-sm text-slate-300 font-semibold">
          Connecting to PulseChat API…
        </p>
        <p className="text-[11px] text-slate-500 font-mono">
          Restoring session & platform routers
        </p>
      </div>
    );
  }

  return (
    <>
      {apiError && screen === "landing" && (
        <div className="mx-auto mt-4 max-w-7xl w-full px-4 sm:px-6 lg:px-12">
          <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-xs text-amber-100">
            {apiError} You can still sign in — the API will retry on login.
          </div>
        </div>
      )}
      {screen === "landing" && <LandingScreen />}
      {screen === "discovery" && <DiscoveryScreen />}
      {screen === "chat" && <ChatWorkspace />}
      <GoogleModal />
      <DeviceSimulator />
      <Toast />
    </>
  );
}

export function PulseApp() {
  return (
    <PulseProvider>
      <div className="bg-[#070b14] text-slate-100 font-sans antialiased min-h-screen selection:bg-indigo-500 selection:text-white flex flex-col justify-between overflow-x-hidden relative">
        <AmbientGlow />
        <div className="relative z-10 flex-1 flex flex-col w-full">
          <Screens />
        </div>
      </div>
    </PulseProvider>
  );
}
