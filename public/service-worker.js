/**
 * Service Worker - caches app shell for offline support
 * and handles update detection.
 *
 * Strategy:
 * - Cache-first for app shell (HTML, JS, CSS, icons)
 * - Network-first for dynamic content
 * - Sends SWUPDATEAVAILABLE message when new version is installed
 */

const CACHE_NAME = 'survivors-v1';
const APP_SHELL = [
  '/',
  '/index.html',
  '/dist/bundle.js',
  '/manifest.json',
  '/icons/icon-192.svg',
  '/icons/icon-512.svg',
];

// Install: cache app shell
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(APP_SHELL);
    })
  );
});

// Activate: clean old caches and claim clients
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((names) => {
      return Promise.all(
        names
          .filter((name) => name !== CACHE_NAME)
          .map((name) => caches.delete(name))
      );
    }).then(() => {
      return self.clients.claim();
    })
  );

  // Notify all clients that update is available
  self.clients.matchAll().then((clients) => {
    clients.forEach((client) => {
      client.postMessage({ type: 'SWUPDATEAVAILABLE' });
    });
  });
});

// Fetch: cache-first for app shell, network-first for others
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // App shell: cache-first
  const isAppShell = APP_SHELL.some(
    (path) => url.pathname === path || url.pathname.endsWith(path)
  );

  if (isAppShell) {
    event.respondWith(
      caches.match(event.request).then((cached) => {
        return cached || fetch(event.request).then((response) => {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, clone);
          });
          return response;
        });
      })
    );
  } else {
    // Dynamic content: network-first with cache fallback
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          // Cache successful GET responses
          if (event.request.method === 'GET' && response.status === 200) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(event.request, clone);
            });
          }
          return response;
        })
        .catch(() => {
          return caches.match(event.request);
        })
    );
  }
});

// Listen for skip waiting message
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIPWAITING') {
    self.skipWaiting();
  }
});
