/* eslint-disable no-undef */
/// Service worker for the offline shell.
///
/// IMPORTANT: everything under public/ is served VERBATIM — no transpile
/// step exists — so this file must be plain JavaScript. It was previously
/// written in TypeScript (`declare const self`, type annotations,
/// `export {}`), which made the browser throw a SyntaxError while parsing
/// the script and no service worker ever installed, silently killing
/// offline support.

const CACHE_NAME = "bayan-bartar-v3";
const STATIC_ASSETS = [
  "/",
  "/offline",
  "/manifest.webmanifest",
  "/logo.png",
  "/og/default.png",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(STATIC_ASSETS).catch(() => undefined))
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k))
      )
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  const { request } = event;

  // Only handle same-origin GET requests; everything else (API, dashboard,
  // cross-origin, non-GET) goes straight to the network.
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  // Network-first for API and dashboard
  if (url.pathname.startsWith("/api/") || url.pathname.startsWith("/dashboard")) {
    return;
  }

  if (request.mode === "navigate") {
    // Network-first for HTML pages, falling back to cache then "/" shell.
    event.respondWith(
      fetch(request)
        .then((response) => {
          const copy = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
          return response;
        })
        .catch(() =>
          caches
            .match(request)
            .then((cached) => cached || caches.match("/offline") || caches.match("/"))
        )
    );
    return;
  }

  // Cache-first for static assets.
  event.respondWith(
    caches.match(request).then(
      (cached) =>
        cached ||
        fetch(request).then((response) => {
          if (!response || response.status !== 200) return response;
          const copy = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
          return response;
        })
    )
  );
});
