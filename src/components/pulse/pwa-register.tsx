"use client";

import { useEffect, useRef, useState } from "react";
import { BUILD_ID } from "@/lib/build-id";

const BUILD_KEY = "pulsechat-build-id";
const POLL_MS = 12_000;

async function fetchServerBuildId(): Promise<string | null> {
  try {
    const res = await fetch(`/api/version?t=${Date.now()}`, {
      cache: "no-store",
      headers: { "Cache-Control": "no-cache" },
    });
    if (!res.ok) return null;
    const data = (await res.json()) as { buildId?: string };
    return data.buildId || null;
  } catch {
    return null;
  }
}

export function PwaRegister() {
  const reloading = useRef(false);
  const [banner, setBanner] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;

    if (!localStorage.getItem(BUILD_KEY)) {
      localStorage.setItem(BUILD_KEY, BUILD_ID);
    }

    let intervalId = 0;
    let registration: ServiceWorkerRegistration | undefined;

    const reloadSoon = (reason: string) => {
      if (reloading.current) return;
      reloading.current = true;
      setBanner(reason);
      // Brief pause so the user sees the update toast on slow phones
      window.setTimeout(() => {
        window.location.reload();
      }, 600);
    };

    const onControllerChange = () => {
      reloadSoon("Updating PulseChat…");
    };

    const checkBuildAndReload = async () => {
      const serverId = await fetchServerBuildId();
      if (!serverId) return;

      const prev = localStorage.getItem(BUILD_KEY);
      if (prev === serverId) return;

      localStorage.setItem(BUILD_KEY, serverId);
      if (prev) {
        reloadSoon("New version available — updating…");
      }
    };

    const refreshSw = async () => {
      try {
        await registration?.update();
        if (registration?.waiting) {
          registration.waiting.postMessage({ type: "SKIP_WAITING" });
        }
      } catch {
        // ignore
      }
      await checkBuildAndReload();
    };

    const onFocus = () => {
      void refreshSw();
    };
    const onVis = () => {
      if (document.visibilityState === "visible") onFocus();
    };
    const onPageShow = (e: PageTransitionEvent) => {
      if (e.persisted) onFocus();
    };

    const start = async () => {
      if ("serviceWorker" in navigator) {
        try {
          registration = await navigator.serviceWorker.register("/sw.js", {
            updateViaCache: "none",
            scope: "/",
          });
          navigator.serviceWorker.addEventListener(
            "controllerchange",
            onControllerChange,
          );

          if (registration.waiting) {
            registration.waiting.postMessage({ type: "SKIP_WAITING" });
          }

          registration.addEventListener("updatefound", () => {
            const worker = registration?.installing;
            if (!worker) return;
            worker.addEventListener("statechange", () => {
              if (
                worker.state === "installed" &&
                navigator.serviceWorker.controller
              ) {
                worker.postMessage({ type: "SKIP_WAITING" });
              }
            });
          });
        } catch {
          // SW optional
        }
      }

      onFocus();
      intervalId = window.setInterval(onFocus, POLL_MS);
      window.addEventListener("focus", onFocus);
      document.addEventListener("visibilitychange", onVis);
      window.addEventListener("pageshow", onPageShow);
      // Online again after flaky mobile data
      window.addEventListener("online", onFocus);
    };

    if (document.readyState === "complete") void start();
    else window.addEventListener("load", () => void start(), { once: true });

    return () => {
      window.clearInterval(intervalId);
      window.removeEventListener("focus", onFocus);
      document.removeEventListener("visibilitychange", onVis);
      window.removeEventListener("pageshow", onPageShow);
      window.removeEventListener("online", onFocus);
      navigator.serviceWorker?.removeEventListener(
        "controllerchange",
        onControllerChange,
      );
    };
  }, []);

  if (!banner) return null;

  return (
    <div
      className="fixed top-[max(0.75rem,env(safe-area-inset-top))] left-1/2 z-[100] -translate-x-1/2 px-4 py-2 rounded-full bg-indigo-600 text-white text-xs font-bold shadow-lg shadow-indigo-900/40 border border-white/20"
      role="status"
    >
      {banner}
    </div>
  );
}
