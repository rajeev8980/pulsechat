/* PulseChat SW — auto-updates Android / installed PWA */
const CACHE = "pulsechat-shell-v11";
const PRECACHE = ["/manifest.webmanifest", "/icons/icon-192.png", "/icons/icon-512.png"];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE)
      .then((cache) => cache.addAll(PRECACHE))
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))),
      )
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("message", (event) => {
  if (event.data && event.data.type === "SKIP_WAITING") {
    self.skipWaiting();
  }
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  // API + Next bundles + version: always network (never stale)
  if (
    url.pathname.startsWith("/api/") ||
    url.pathname.startsWith("/_next/") ||
    url.pathname === "/sw.js"
  ) {
    event.respondWith(
      fetch(request).catch(() => {
        if (url.pathname.startsWith("/api/")) {
          return new Response(
            JSON.stringify({ error: "Offline — API unavailable" }),
            { status: 503, headers: { "Content-Type": "application/json" } },
          );
        }
        return Response.error();
      }),
    );
    return;
  }

  // Navigations: network-first so deploys show up immediately
  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request)
        .then((res) => {
          const copy = res.clone();
          caches.open(CACHE).then((cache) => cache.put(request, copy));
          return res;
        })
        .catch(() => caches.match(request).then((c) => c || caches.match("/"))),
    );
    return;
  }

  // Other static: network-first, cache fallback
  event.respondWith(
    fetch(request)
      .then((res) => {
        if (res.ok) {
          const copy = res.clone();
          caches.open(CACHE).then((cache) => cache.put(request, copy));
        }
        return res;
      })
      .catch(() => caches.match(request)),
  );
});
