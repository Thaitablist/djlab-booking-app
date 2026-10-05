// DJ LAB SIAM — Service Worker
// Version: 6.0.0 — the old booking app page (DJ_LAB_SIAM_BookingApp.html) was retired on 5 Oct 2569 and
// is now a tiny redirect page to desk.html#booking. Bumped so devices drop the cached old app and the
// offline fallback no longer points at a page that redirects (an uncached desk.html would loop).

const CACHE_NAME = 'djlab-booking-v6';
const ASSETS = [
  './DJ_LAB_SIAM_BookingApp.html',
  './book.html',
  './manifest.json',
  './icon-192.png',
  './icon-512.png'
];

// ---- Install: cache all assets ----
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache =>
      Promise.all(ASSETS.map(url => cache.add(url).catch(() => {})))
    ).catch(() => {})
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

function offlinePage() {
  return new Response(
    '<!doctype html><html lang="th"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">' +
    '<title>DJ LAB SIAM</title><body style="font:18px/1.6 system-ui,sans-serif;padding:32px;max-width:520px;margin:auto">' +
    '<h1 style="font-size:22px">ตอนนี้ไม่มีอินเทอร์เน็ต</h1>' +
    '<p>คอนโซลร้าน DJ LAB SIAM ต้องใช้อินเทอร์เน็ต ลองใหม่เมื่อมีสัญญาณ</p>',
    { status: 503, headers: { 'Content-Type': 'text/html; charset=utf-8' } }
  );
}

self.addEventListener('fetch', event => {
  // Skip non-GET and cross-origin
  if (event.request.method !== 'GET') return;
  if (!event.request.url.startsWith(self.location.origin)) return;

  const isDocument = event.request.mode === 'navigate' ||
                     event.request.destination === 'document';

  // ---- HTML: network-first so app updates always land ----
  if (isDocument) {
    event.respondWith(
      fetch(event.request).then(response => {
        if (response && response.status === 200) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
        }
        return response;
      }).catch(() =>
        // Offline: the page itself if cached → the console (desk.html) if cached → a plain notice.
        // NEVER fall back to DJ_LAB_SIAM_BookingApp.html here: it only redirects to desk.html, so an
        // uncached desk.html would send the browser round in circles.
        caches.match(event.request)
          .then(cached => cached || caches.match('./desk.html'))
          .then(cached => cached || offlinePage())
      )
    );
    return;
  }

  // ---- Other assets: cache-first ----
  event.respondWith(
    caches.match(event.request).then(cached => {
      if (cached) return cached;
      return fetch(event.request).then(response => {
        if (response && response.status === 200) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
        }
        return response;
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
    clients.openWindow('./desk.html#booking')
  );
});
