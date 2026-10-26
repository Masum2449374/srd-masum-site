// SRD Masum service worker: caches the app shell only. Audio (mp3, jsDelivr) is never cached.
const VERSION = "srd-v25";
const SHELL = ["/", "/manifest.webmanifest", "/icons/icon-192.png", "/icons/icon-512.png", "/images/avatar.webp"];

self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(VERSION).then((c) => c.addAll(SHELL)).then(() => self.skipWaiting()));
});
self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== VERSION).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});
self.addEventListener("fetch", (e) => {
  const req = e.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  // Never touch audio, range requests or other origins (jsDelivr, YouTube, Spotify).
  if (url.origin !== self.location.origin) return;
  if (url.pathname.startsWith("/api/")) return; // live data (visitor counter): never cached
  if (url.pathname.startsWith("/cdn-cgi/")) return; // Cloudflare analytics/internals
  if (url.pathname.startsWith("/ads/")) return; // ad pages: always straight from the network
  if (req.headers.has("range") || /\.(mp3|m4a|ogg|wav|aac)$/i.test(url.pathname) || req.destination === "audio") return;

  if (req.mode === "navigate") {
    // Network first for pages so new deploys show up; cached shell when offline.
    e.respondWith(
      fetch(req).then((res) => {
        const copy = res.clone();
        caches.open(VERSION).then((c) => c.put("/", copy)).catch(() => {});
        return res;
      }).catch(() => caches.match(req).then((r) => r || caches.match("/")))
    );
    return;
  }
  // Hashed build assets, fonts, images: cache first, fill on miss.
  if (/^\/(assets|icons|images)\//.test(url.pathname)) {
    e.respondWith(
      caches.match(req).then((hit) => hit || fetch(req).then((res) => {
        if (res.ok) { const copy = res.clone(); caches.open(VERSION).then((c) => c.put(req, copy)); }
        return res;
      }))
    );
  }
});
