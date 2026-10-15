"use client";

import { useEffect, useRef } from "react";
import { BUILD_ID } from "@/lib/build-id";

const BUILD_KEY = "pulsechat-build-id";

async function checkBuildAndReload() {
  try {
    const res = await fetch(`/api/version?t=${Date.now()}`, {
      cache: "no-store",
    });
    if (!res.ok) return;
    const data = (await res.json()) as { buildId?: string };
    if (!data.buildId) return;

    const prev = localStorage.getItem(BUILD_KEY);
    if (prev === data.buildId) return;

    localStorage.setItem(BUILD_KEY, data.buildId);
    // New build on server (or first seed). Reload if we already had a previous id.
    if (prev) {
      window.location.reload();
    }
  } catch {
    // offline — ignore
  }
}

export function PwaRegister() {
  const reloading = useRef(false);

  useEffect(() => {
    if (typeof window === "undefined") return;

    // Ensure first paint seeds current bundle id
    if (!localStorage.getItem(BUILD_KEY)) {
      localStorage.setItem(BUILD_KEY, BUILD_ID);
    }

    const onControllerChange = () => {
      if (reloading.current) return;
      reloading.current = true;
      window.location.reload();
    };

    let intervalId = 0;
    let registration: ServiceWorkerRegistration | undefined;

    const onFocus = () => {
      void registration?.update();
      void checkBuildAndReload();
    };
    const onVis = () => {
      if (document.visibilityState === "visible") onFocus();
    };

    const start = async () => {
      if ("serviceWorker" in navigator) {
        try {
          registration = await navigator.serviceWorker.register("/sw.js", {
            updateViaCache: "none",
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
      intervalId = window.setInterval(onFocus, 20_000);
      window.addEventListener("focus", onFocus);
      document.addEventListener("visibilitychange", onVis);
    };

    if (document.readyState === "complete") void start();
    else window.addEventListener("load", () => void start(), { once: true });

    return () => {
      window.clearInterval(intervalId);
      window.removeEventListener("focus", onFocus);
      document.removeEventListener("visibilitychange", onVis);
      navigator.serviceWorker?.removeEventListener(
        "controllerchange",
        onControllerChange,
      );
    };
  }, []);

  return null;
}
