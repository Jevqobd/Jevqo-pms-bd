/**
 * Sportswear OS Enterprise ERP - Advanced Multi-Tier Service Worker
 * Strategies:
 * 1. App Shell Pre-Caching (instant boot offline)
 * 2. Cache-First for Google Fonts & Immutable Vendor Assets
 * 3. Network-First for Application Source & Scripts (ensuring live updates with offline fallback)
 */

const SHELL_CACHE = 'sportswear-erp-shell-v4';
const ASSETS_CACHE = 'sportswear-erp-assets-v4';
const IMAGES_CACHE = 'sportswear-erp-images-v4';
const FONTS_CACHE = 'sportswear-erp-fonts-v4';

const ALL_CACHES = [SHELL_CACHE, ASSETS_CACHE, IMAGES_CACHE, FONTS_CACHE];

const PRECACHE_URLS = [
  '/',
  '/index.html',
  '/manifest.webmanifest',
  '/icon.svg',
  '/icon-maskable.svg',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(SHELL_CACHE).then((cache) => {
      return cache.addAll(PRECACHE_URLS);
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (!ALL_CACHES.includes(cacheName)) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

// Helper: Stale-While-Revalidate (for static images/icons)
async function staleWhileRevalidate(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cachedResponse = await cache.match(request);

  const networkFetch = fetch(request)
    .then((response) => {
      if (response && (response.status === 200 || response.type === 'opaque')) {
        cache.put(request, response.clone());
      }
      return response;
    })
    .catch(() => cachedResponse);

  return cachedResponse || networkFetch;
}

// Helper: Cache-First with Network Fallback (for immutable fonts)
async function cacheFirst(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cachedResponse = await cache.match(request);
  if (cachedResponse) {
    return cachedResponse;
  }
  try {
    const networkResponse = await fetch(request);
    if (networkResponse && (networkResponse.status === 200 || networkResponse.type === 'opaque')) {
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  } catch (err) {
    return caches.match('/');
  }
}

// Helper: Network-First with Offline Fallback (always fresh when online, cached when offline)
async function networkFirst(request, cacheName) {
  const cache = await caches.open(cacheName);
  try {
    const networkResponse = await fetch(request);
    if (networkResponse && networkResponse.status === 200) {
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  } catch (err) {
    const cachedResponse = await cache.match(request);
    if (cachedResponse) return cachedResponse;
    if (request.mode === 'navigate') {
      return cache.match('/index.html') || cache.match('/');
    }
    throw err;
  }
}

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;

  const url = new URL(event.request.url);

  // Skip WebSockets, Firestore live streams, and API mutations
  if (
    url.protocol === 'ws:' ||
    url.protocol === 'wss:' ||
    url.pathname.startsWith('/api/') ||
    url.hostname.includes('firestore.googleapis.com') ||
    url.hostname.includes('identitytoolkit.googleapis.com')
  ) {
    return;
  }

  // 1. Google Fonts -> Cache First
  if (
    url.hostname.includes('fonts.googleapis.com') ||
    url.hostname.includes('fonts.gstatic.com')
  ) {
    event.respondWith(cacheFirst(event.request, FONTS_CACHE));
    return;
  }

  // 2. Images -> Stale-While-Revalidate
  if (
    event.request.destination === 'image' ||
    url.hostname.includes('images.unsplash.com') ||
    /\.(png|jpg|jpeg|svg|gif|webp|ico)$/i.test(url.pathname)
  ) {
    event.respondWith(staleWhileRevalidate(event.request, IMAGES_CACHE));
    return;
  }

  // 3. Scripts, Styles & Navigation -> Network-First with Offline Cache Fallback
  event.respondWith(networkFirst(event.request, ASSETS_CACHE));
});
