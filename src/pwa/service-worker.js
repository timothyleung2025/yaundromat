/* Build substitutes the version and exact asset URLs below. */
const CACHE_PREFIX = "yaundromat-pwa-";
const CACHE_NAME = CACHE_PREFIX + __BUILD_VERSION__;
const PRECACHE = __PRECACHE_URLS__;
const ASSETS = new Set(PRECACHE.filter((url) => url !== "/"));

self.addEventListener("install", (event) => {
  // An incomplete download must never replace a working offline version.
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) =>
        cache.addAll(
          PRECACHE.map((url) => new Request(url, { cache: "reload" })),
        ),
      ),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const names = await caches.keys();
      await Promise.all(
        names
          .filter(
            (name) => name.startsWith(CACHE_PREFIX) && name !== CACHE_NAME,
          )
          .map((name) => caches.delete(name)),
      );
      await self.clients.claim();
    })(),
  );
});

self.addEventListener("message", (event) => {
  if (event.data?.type === "ACTIVATE_UPDATE") {
    event.waitUntil(self.skipWaiting());
  }
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);
  if (request.method !== "GET" || url.origin !== self.location.origin) return;

  // Cache only this local prototype's shell and build assets. Never intercept
  // API calls, Next RSC responses, other routes, or external requests.
  const home = request.mode === "navigate" && url.pathname === "/";
  if (!home && !ASSETS.has(url.pathname)) return;
  event.respondWith(
    (async () => {
      const cache = await caches.open(CACHE_NAME);
      const key = home ? "/" : url.pathname;
      const cached = await cache.match(key);
      if (cached) return cached;
      // Keep HTML and chunks pinned to the same build until an update is accepted.
      // Fetch only as a recovery path if browser storage was partially evicted.
      return fetch(request);
    })(),
  );
});
