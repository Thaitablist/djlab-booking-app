// DJ LAB SIAM — Service Worker
// Version: 1.0.0

const CACHE_NAME = 'djlab-booking-v1';
const ASSETS = [
  './DJ_LAB_SIAM_BookingApp.html',
  './manifest.json',
  './icon.svg',
  './icon-192.png',
  './icon-512.png'
];

// ---- Install: cache all assets ----
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return cache.addAll(ASSETS.filter(async url => {
        try { await fetch(url, { method: 'HEAD' }); return true; }
        catch { return false; }
      }));
    }).catch(() => {})
  );
  self.skipWaiting();
});

// ---- Activate: clean old caches ----
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k))
      )
    )
  );
  self.clients.claim();
});

// ---- Fetch: cache-first strategy ----
self.addEventListener('fetch', event => {
  // Skip non-GET and cross-origin
  if (event.request.method !== 'GET') return;
  if (!event.request.url.startsWith(self.location.origin)) return;

  event.respondWith(
    caches.match(event.request).then(cached => {
      if (cached) return cached;
      return fetch(event.request).then(response => {
        // Cache successful responses
        if (response && response.status === 200) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
        }
        return response;
      }).catch(() => {
        // Offline fallback: return the main app
        if (event.request.destination === 'document') {
          return caches.match('./DJ_LAB_SIAM_BookingApp.html');
        }
      });
    })
  );
});

// ---- Push Notifications ----
self.addEventListener('push', event => {
  const data = event.data ? event.data.json() : {};
  event.waitUntil(
    self.registration.showNotification(data.title || 'DJ LAB SIAM', {
      body: data.body || 'แจ้งเตือนจากระบบจองห้องซ้อม',
      icon: './icon-192.png',
      badge: './icon-192.png',
      vibrate: [200, 100, 200],
      data: data
    })
  );
});

self.addEventListener('notificationclick', event => {
  event.notification.close();
  event.waitUntil(
    clients.openWindow('./DJ_LAB_SIAM_BookingApp.html')
  );
});
