// GVC Patrimonio — service worker (app shell cache)
const CACHE = "patrimonio-v1";
const SHELL = ["./", "./index.html", "./manifest.json", "./icon-192.png", "./icon-512.png"];

self.addEventListener("install", e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", e => {
  e.waitUntil(
    caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", e => {
  const url = new URL(e.request.url);
  // Nunca cachear llamadas a Supabase ni APIs de datos (siempre red)
  if (url.hostname.includes("supabase.co") || url.hostname.includes("datos.gov.co") || url.hostname.includes("er-api.com")) {
    return; // deja pasar a la red normal
  }
  // App shell y CDNs: cache-first con actualización en segundo plano
  e.respondWith(
    caches.match(e.request).then(cached => {
      const net = fetch(e.request).then(res => {
        if (res && res.status === 200 && (e.request.method === "GET")) {
          const copy = res.clone();
          caches.open(CACHE).then(c => c.put(e.request, copy)).catch(() => {});
        }
        return res;
      }).catch(() => cached);
      return cached || net;
    })
  );
});
