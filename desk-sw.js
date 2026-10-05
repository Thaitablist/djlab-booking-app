// DJ LAB SIAM — service worker ของคอนโซล (desk.html): หน้าที่เดียวคือรับ Web Push แจ้งเตือนงาน ("งานของฉัน")
//
// ลงทะเบียนจาก desk.html ด้วย scope './desk.html' — แคบกว่า sw.js (scope './') จึงเป็นตัวที่คุมหน้า desk · หน้าอื่นไม่เปลี่ยน
// ⚠️ ไม่มี fetch handler โดยตั้งใจ: ไม่แคชอะไรเลย → ไม่ผูกกับเลข CACHE_NAME ของ sw.js และไม่เสี่ยงค้างหน้า desk เก่า
// ⚠️ ทุก push ต้องแสดงแจ้งเตือนเสมอ — iOS/Safari เพิกถอน subscription ที่รับ push แล้วไม่แสดงอะไร
//    จึงห้ามมีทางที่ throw / return ก่อน showNotification (payload ว่าง พัง ไม่ใช่ JSON ก็ต้องขึ้นป้าย)
// payload จากบอท: { title, body, tag, url } — title = ชนิดเหตุการณ์ · body = หัวข้อใบงาน (คำขอ = ข้อความกลาง ๆ ไม่มีเนื้อ)
//    tag = dedupe_key (ซ้ำ = แทนที่ป้ายเดิม ไม่ขึ้นสองอัน) · url = ลิงก์เข้า desk.html (ตรวจ origin/พาธทุกครั้ง)

const DEFAULT_URL = './desk.html#tasks';

self.addEventListener('install', () => { self.skipWaiting(); });
self.addEventListener('activate', event => { event.waitUntil(self.clients.claim()); });

// อ่าน payload แบบไม่มีวันล้ม: JSON → ใช้ · ข้อความธรรมดา → เป็น body · ว่าง/พัง → {}
function readPayload(event) {
  try {
    if (!event.data) return {};
    try { const j = event.data.json(); return j && typeof j === 'object' ? j : {}; }
    catch (e) { const t = event.data.text(); return t ? { body: t } : {}; }
  } catch (e) { return {}; }
}
function clip(s, n) { return typeof s === 'string' ? s.slice(0, n) : ''; }

// ลิงก์ที่ยอมให้เปิด: ต้องเป็น desk.html ของ origin เดียวกับ SW นี้เท่านั้น (hash ได้) · นอกนั้นใช้ค่าตั้งต้น
function safeUrl(u) {
  try {
    const base = new URL('./desk.html', self.location.href);
    const x = new URL(u, base);                                   // ว่าง/ไม่ใช่ข้อความ → กลายเป็นพาธอื่นหรือ desk.html เฉย ๆ (ไม่ตรงกติกา/ได้ #tasks) → ไม่มีทางหลุดออกนอก desk.html
    if (x.origin === base.origin && x.pathname === base.pathname) {
      if (!x.hash) x.hash = '#tasks';                              // แจ้งเตือนเรื่องงาน → ไปหมวด "งานของฉัน" เสมอ
      return x.href;
    }
  } catch (e) { /* ใช้ค่าตั้งต้น */ }
  return new URL(DEFAULT_URL, self.location.href).href;
}

self.addEventListener('push', event => {
  const d = readPayload(event);
  const title = clip(d.title, 120) || 'DJ LAB SIAM';
  const options = {
    body: clip(d.body, 240) || 'มีเรื่องใหม่ในงานของฉัน',
    icon: './icon-192.png', badge: './icon-192.png',
    data: { url: safeUrl(d.url) },
  };
  const tag = clip(d.tag, 120);
  if (tag) { options.tag = tag; options.renotify = true; }       // renotify ต้องมี tag ไม่งั้นบางเบราว์เซอร์โยน error
  event.waitUntil(
    self.registration.showNotification(title, options)
      .catch(() => self.registration.showNotification('DJ LAB SIAM'))   // ตัวเลือกใดถูกปฏิเสธ → ขึ้นป้ายเปล่าแทน ห้ามไม่ขึ้นเลย
  );
});

self.addEventListener('notificationclick', event => {
  event.notification.close();
  const url = safeUrl(event.notification.data && event.notification.data.url);
  event.waitUntil((async () => {
    const target = new URL(url);                                  // safeUrl การันตีว่า parse ได้แล้ว: hash มีเสมอ (ไม่มีให้เติม #tasks)
    let desk = null;
    try {
      const wins = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
      desk = wins.find(c => { try { return new URL(c.url).pathname === target.pathname; } catch (e) { return false; } }) || null;
    } catch (e) { /* หาหน้าที่เปิดอยู่ไม่ได้ → เปิดหน้าต่างใหม่แทน */ }
    if (desk) {                                                   // มีหน้า desk เปิดอยู่แล้ว → โฟกัสแล้วให้ไปหมวด "งานของฉัน" (ไม่เปิดซ้ำ ไม่โหลดใหม่)
      try { await desk.focus(); } catch (e) { /* บางแพลตฟอร์มห้าม focus */ }
      try { desk.postMessage({ type: 'djlab-notification-click', hash: target.hash }); } catch (e) { /* หน้านั้นเพิ่งปิด */ }
      return;
    }
    try { await self.clients.openWindow(url); } catch (e) { /* เปิดหน้าไม่ได้ (iOS จำกัด) — ป้ายถูกปิดแล้ว ไม่มีอะไรให้ทำต่อ */ }
  })());
});

// เบราว์เซอร์หมุน/ยกเลิก subscription เอง: SW ไม่มี session เข้าฐาน → บอกหน้า desk ที่เปิดอยู่ให้ตรวจ/สมัครใหม่ (ไม่มีหน้าเปิด = ตรวจตอนล็อกอินครั้งหน้า)
self.addEventListener('pushsubscriptionchange', event => {
  event.waitUntil((async () => {
    try {
      const wins = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
      wins.forEach(c => c.postMessage({ type: 'djlab-push-resubscribe' }));
    } catch (e) { /* ไม่มีอะไรให้ทำ */ }
  })());
});
