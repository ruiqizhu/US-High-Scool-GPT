/* 每个版本保持完整的本地资源包；用户确认前不接管旧页面。 */
const CACHE = "yuanxing-v2.0.0";
const CORE = [
  "./",
  "./index.html",
  "./styles.css",
  "./content.js",
  "./enrichment.js",
  "./core.js",
  "./app.js",
  "./manifest.webmanifest",
  "./assets/photo-index.js",
  "./assets/icon.svg",
  "./assets/icon-192.png",
  "./assets/icon-512.png",
  "./assets/photo-fallback.svg",
  "./assets/photos/campus.jpg",
  "./assets/photos/andover.jpg",
  "./assets/photos/library.jpg",
  "./assets/photos/students.jpg",
  "./assets/photos/sports.jpg",
  "./assets/photos/study.jpg",
];
self.addEventListener("install", (event) =>
  event.waitUntil(caches.open(CACHE).then((cache) => cache.addAll(CORE))),
);
self.addEventListener("message", (event) => {
  if (event.data?.type === "ACTIVATE_UPDATE") self.skipWaiting();
});
self.addEventListener("activate", (event) =>
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((k) => k.startsWith("yuanxing-") && k !== CACHE)
            .map((k) => caches.delete(k)),
        ),
      )
      .then(() => self.clients.claim()),
  ),
);
self.addEventListener("fetch", (event) => {
  if (
    event.request.method !== "GET" ||
    new URL(event.request.url).origin !== self.location.origin
  )
    return;
  event.respondWith(
    (async () => {
      const cache = await caches.open(CACHE);
      const cached = await cache.match(event.request);
      if (cached) return cached;
      if (event.request.mode === "navigate") {
        const page = await cache.match("./index.html");
        if (page) return page;
      }
      const controller = new AbortController(),
        timer = setTimeout(() => controller.abort(), 5000);
      try {
        const response = await fetch(event.request, {
          signal: controller.signal,
        });
        if (response.ok) await cache.put(event.request, response.clone());
        return response;
      } catch {
        return Response.error();
      } finally {
        clearTimeout(timer);
      }
    })(),
  );
});
