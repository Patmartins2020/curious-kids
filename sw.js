// Name your cache – update the version when you change files
const CACHE_NAME = "curiouskids-v2";

// All the files we want available offline
const OFFLINE_ASSETS = [
  "/",                 // root
  "/index.html",
  "/ask.html",
  "/forum.html",
  "/store.html",
  "/questions.html",
  "/admin.html",
  "/legal.html",
  "/icons/icon-192.png",
  "/icons/icon-512.png",
  "/manifest.webmanifest"
];

// Install: cache all core assets
self.addEventListener("install", event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return cache.addAll(OFFLINE_ASSETS);
    })
  );
  self.skipWaiting();
});

// Activate: clean up old caches
self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys().then(keys => {
      return Promise.all(
        keys
          .filter(key => key !== CACHE_NAME)
          .map(key => caches.delete(key))
      );
    })
  );
  self.clients.claim();
});

// Fetch: offline support
self.addEventListener("fetch", event => {
  const request = event.request;

  // Only handle GET requests
  if (request.method !== "GET") {
    return;
  }

  // For navigation (HTML pages) – network first, then cache fallback
  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request)
        .then(response => {
          const copy = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(request, copy));
          return response;
        })
        .catch(() => {
          // If offline, show cached index.html as a fallback
          return caches.match("/index.html");
        })
    );
    return;
  }

  // For everything else – cache first, then network
  event.respondWith(
    caches.match(request).then(cached => {
      if (cached) {
        return cached;
      }
      return fetch(request)
        .then(response => {
          const copy = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(request, copy));
          return response;
        })
        .catch(() => {
          // If it’s not in cache and network fails, just fail silently
          return cached;
        });
    })
  );
});
