// Service Worker untuk Cache Management
const VERSION = '1.0.1'; // Increment this version
const CACHE_NAME = `jaja-dashboard-v${VERSION}`;
const STATIC_CACHE_NAME = `jaja-static-v${VERSION}`;

// Files yang akan di-cache secara pre-cache (hanya yang benar-core)
// Hindari caching main bundle jika hash-nya berubah tiap build tapi SW tidak update
const STATIC_FILES = [
  '/',
  '/index.html',
  // Jangan cache file src/ langsung karena di production tidak ada
];

// Install event - cache static files
self.addEventListener('install', (event) => {
  console.log('[SW] Installing version:', VERSION);
  event.waitUntil(
    caches.open(STATIC_CACHE_NAME)
      .then((cache) => {
        return cache.addAll(STATIC_FILES);
      })
      .then(() => self.skipWaiting())
  );
});

// Activate event - clean up ALL old caches
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating version:', VERSION);
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME && cacheName !== STATIC_CACHE_NAME) {
            console.log('[SW] Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch event - Robust strategy
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // Skip non-GET requests
  if (event.request.method !== 'GET') return;

  // Skip non-http requests
  if (!url.protocol.startsWith('http')) return;

  // STRATEGY: Network First for HTML / Navigation
  if (event.request.mode === 'navigate' || 
      event.request.destination === 'document' ||
      url.pathname.endsWith('.html') ||
      url.pathname === '/') {
    
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          // Cache the latest version of HTML
          const responseClone = response.clone();
          caches.open(STATIC_CACHE_NAME).then(cache => {
            cache.put(event.request, responseClone);
          });
          return response;
        })
        .catch(() => {
          // Fallback to cache if network fails
          return caches.match(event.request);
        })
    );
    return;
  }

  // STRATEGY: Cache First for assets with hashes (images, styles, compiled js)
  // Vite assets have hashes, so they are safe to cache-first
  const isAsset = url.pathname.includes('/assets/') || 
                  url.pathname.includes('/img/') ||
                  url.pathname.endsWith('.js') || 
                  url.pathname.endsWith('.css');

  if (isAsset) {
    event.respondWith(
      caches.match(event.request).then((response) => {
        return response || fetch(event.request).then((networkResponse) => {
          if (!networkResponse || networkResponse.status !== 200) return networkResponse;
          
          const responseClone = networkResponse.clone();
          caches.open(CACHE_NAME).then(cache => {
            cache.put(event.request, responseClone);
          });
          return networkResponse;
        });
      })
    );
    return;
  }

  // Default: Network with Cache Fallback
  event.respondWith(
    fetch(event.request)
      .catch(() => caches.match(event.request))
  );
});

// Message event
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'CLEAR_CACHE') {
    caches.keys().then((cacheNames) => {
      return Promise.all(cacheNames.map(name => caches.delete(name)));
    }).then(() => {
      if (event.ports && event.ports[0]) {
        event.ports[0].postMessage({ success: true });
      }
    });
  }
  
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});


