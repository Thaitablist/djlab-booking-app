// service worker ของตัวพาไป — ถอนตัวเองทันที (ระบบร้านย้ายไป https://console.djlabsiam.com/)
self.addEventListener('install', function () { self.skipWaiting(); });
self.addEventListener('activate', function (event) {
  event.waitUntil((async function () {
    try { var keys = await caches.keys(); await Promise.all(keys.map(function (k) { return caches.delete(k); })); } catch (e) {}
    try { await self.registration.unregister(); } catch (e) {}
    try {
      var list = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
      list.forEach(function (c) { try { c.navigate(c.url); } catch (e) {} });
    } catch (e) {}
  })());
});
