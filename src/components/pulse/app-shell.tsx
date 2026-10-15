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
  const { screen } = usePulse();
  return (
    <>
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
