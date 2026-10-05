/**
 * เทสต์ service worker ของคอนโซล (desk-sw.js — รับ Web Push แจ้งเตือนงาน) — รัน: node tests/desk-sw.mjs
 *
 * ไม่ต้องใช้เบราว์เซอร์: รันไฟล์จริงใน vm ด้วยตัวแทน self / registration / clients (จดว่าถูกเรียกอะไร)
 * กติกาที่ต้องไม่หลุด: (1) ทุก push ต้องขึ้นแจ้งเตือนเสมอ — iOS เพิกถอน subscription ที่รับ push แล้วไม่แสดง
 *                      (2) ลิงก์ในแจ้งเตือนเปิดได้เฉพาะ desk.html ของ origin เดียวกัน (3) ไม่แคชอะไร (ไม่มี fetch handler)
 */
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import vm from 'node:vm';

const root = process.env.DESKSW_ROOT || join(dirname(fileURLToPath(import.meta.url)), '..');
const src = readFileSync(join(root, 'desk-sw.js'), 'utf8');
let pass = 0, fail = 0;
const ok = (name, cond, extra) => { if (cond) { pass++; console.log('  [PASS] ' + name); } else { fail++; console.log('  [FAIL] ' + name + (extra ? ' — ' + extra : '')); } };

const BASE = 'https://shop.example/djlab-booking-app/';
function load({ windows = [], failShow = false, failShowFirstOnly = false, openFails = false, matchFails = false, focusFails = false, postFails = false } = {}) {
  const listeners = {}, shown = [], opened = [], posted = [], focused = [];
  let showCalls = 0, claimed = false, skipped = false;
  // controlled: false = หน้าที่เปิดมาก่อน service worker ยึด (พบได้เฉพาะเมื่อขอ includeUncontrolled) — desk ที่เปิดค้างไว้ก่อนสมัคร push เป็นแบบนี้
  const wins = windows.map(url => ({ url, controlled: false,
    focus: async () => { if (focusFails) throw new Error('cannot focus'); focused.push(url); },
    postMessage: m => { if (postFails) throw new Error('closed'); posted.push({ url, m }); } }));
  const sandbox = {
    self: {
      addEventListener: (t, f) => { listeners[t] = f; }, location: { href: BASE + 'desk-sw.js' },
      skipWaiting() { skipped = true; },
      clients: { claim: async () => { claimed = true; }, matchAll: async () => wins, openWindow: async u => { if (openFails) throw new Error('blocked'); opened.push(u); } },
      registration: { showNotification: async (title, options) => { showCalls++; if (failShow || (failShowFirstOnly && showCalls === 1)) throw new TypeError('bad option'); shown.push({ title, options }); } },
    },
    URL, console, Promise,
  };
  sandbox.self.clients.matchAll = async o => { if (matchFails) throw new Error('matchAll blocked'); return o && o.includeUncontrolled ? wins : wins.filter(w => w.controlled); };
  vm.createContext(sandbox);
  vm.runInContext(src, sandbox);
  return { listeners, shown, opened, posted, focused, state: () => ({ claimed, skipped }) };
}
// PushMessageData จริง: json() ของข้อความที่ไม่ใช่ JSON โยน SyntaxError · text() คืนข้อความดิบ
const dataOf = o => ({ json: () => { if (o === undefined || typeof o === 'string') throw new SyntaxError('no json'); return o; }, text: () => (typeof o === 'string' ? o : '') });
async function push(sw, data) {
  let waited = null;
  sw.listeners.push({ data, waitUntil: p => { waited = p; } });
  await waited;
}
async function click(sw, notifData) {
  let closed = false, waited = null;
  sw.listeners.notificationclick({ notification: { close() { closed = true; }, data: notifData }, waitUntil: p => { waited = p; } });
  await waited;
  return closed;
}

console.log('=== desk-sw.js · push ===');
{
  const sw = load();
  await push(sw, dataOf({ title: '📌 มีงานใหม่', body: 'ตัด Short จาก Podcast EP2', tag: 'task_new:evt1:u1', url: BASE + 'desk.html#tasks' }));
  const n = sw.shown[0];
  ok('push ปกติ: ขึ้นแจ้งเตือน 1 ป้าย ชื่อเรื่อง/เนื้อหาตาม payload', sw.shown.length === 1 && n.title === '📌 มีงานใหม่' && n.options.body === 'ตัด Short จาก Podcast EP2', JSON.stringify(n));
  ok('tag = ของบอท (dedupe_key) + renotify (เหตุการณ์ซ้ำแทนป้ายเดิม ไม่ขึ้นสองอัน)', n.options.tag === 'task_new:evt1:u1' && n.options.renotify === true);
  ok('ไอคอน/badge + data.url เป็นลิงก์ desk.html#tasks', n.options.icon === './icon-192.png' && n.options.badge === './icon-192.png' && n.options.data.url === BASE + 'desk.html#tasks');
  await push(sw, dataOf({ title: 'ไม่มี tag', body: 'x' }));
  ok('ไม่มี tag: ไม่ตั้ง renotify (ตั้งโดยไม่มี tag แล้วบางเบราว์เซอร์โยน error)', sw.shown[1] && !('tag' in sw.shown[1].options) && !('renotify' in sw.shown[1].options), JSON.stringify(sw.shown[1] && sw.shown[1].options));
  await push(sw, dataOf({ title: 'ก'.repeat(500), body: 'ข'.repeat(900), tag: 't'.repeat(500) }));
  const big = sw.shown[2];
  ok('ข้อความ/tag ยาวผิดปกติถูกตัด (ชื่อ 120 · เนื้อ 240 · tag 120)', big.title.length === 120 && big.options.body.length === 240 && big.options.tag.length === 120, [big.title.length, big.options.body.length, big.options.tag.length].join());
}
console.log('=== push ที่ payload เพี้ยน — ต้องขึ้นแจ้งเตือนเสมอ ===');
{
  const sw = load();
  await push(sw, null);
  ok('ไม่มีข้อมูล (event.data = null): ขึ้นแจ้งเตือนทั่วไป', sw.shown.length === 1 && sw.shown[0].title === 'DJ LAB SIAM' && sw.shown[0].options.body.length > 0, JSON.stringify(sw.shown[0]));
  await push(sw, dataOf('ข้อความธรรมดา ไม่ใช่ JSON'));
  ok('ข้อมูลเป็นข้อความธรรมดา (JSON พัง): เอาเป็นเนื้อหา', sw.shown.length === 2 && sw.shown[1].options.body === 'ข้อความธรรมดา ไม่ใช่ JSON', JSON.stringify(sw.shown[1]));
  await push(sw, dataOf(undefined));
  ok('ทั้ง json() และ text() ได้ว่าง: ยังขึ้นแจ้งเตือนทั่วไป', sw.shown.length === 3 && sw.shown[2].title === 'DJ LAB SIAM');
  await push(sw, { json() { throw new Error('boom'); }, text() { throw new Error('boom2'); } });
  ok('อ่านข้อมูลโยน error ทั้งสองทาง: ยังขึ้นแจ้งเตือนทั่วไป (ไม่ปล่อยให้ push เงียบ)', sw.shown.length === 4);
  await push(sw, dataOf(null));
  ok('payload เป็น JSON null: ขึ้นแจ้งเตือนทั่วไป (ไม่โยน TypeError ตอนอ่านชื่อเรื่อง)', sw.shown.length === 5 && sw.shown[4].title === 'DJ LAB SIAM', String(sw.shown.length));
  await push(sw, dataOf(['ไม่ใช่', 'อ็อบเจกต์']));
  await push(sw, dataOf(42));
  await push(sw, dataOf({ title: { x: 1 }, body: 123, tag: [], url: {} }));
  ok('payload เป็นอาร์เรย์/ตัวเลข/ชนิดผิด: ขึ้นแจ้งเตือนทั่วไปทุกครั้ง', sw.shown.length === 8 && sw.shown.slice(5).every(n => n.title === 'DJ LAB SIAM' && typeof n.options.body === 'string' && n.options.body.length > 0), JSON.stringify(sw.shown.slice(5)));
}
{
  const sw = load({ failShowFirstOnly: true });
  await push(sw, dataOf({ title: 'มีตัวเลือกที่เบราว์เซอร์ไม่รับ', body: 'x', tag: 't' }));
  ok('showNotification ปฏิเสธตัวเลือก: ขึ้นป้ายเปล่า "DJ LAB SIAM" แทน (ห้ามไม่ขึ้นเลย)', sw.shown.length === 1 && sw.shown[0].title === 'DJ LAB SIAM', JSON.stringify(sw.shown));
}
console.log('=== ลิงก์ที่ยอมให้เปิด ===');
{
  const sw = load();
  const cases = [
    ['เต็ม desk.html#tasks (origin เดียวกัน)', BASE + 'desk.html#tasks', BASE + 'desk.html#tasks'],
    ['เฉพาะ #tasks', '#tasks', BASE + 'desk.html#tasks'],
    ['สัมพัทธ์ ./desk.html#booking', './desk.html#booking', BASE + 'desk.html#booking'],
    ['ไม่ส่งมา', undefined, BASE + 'desk.html#tasks'],
    ['คนละ origin', 'https://evil.example/djlab-booking-app/desk.html#tasks', BASE + 'desk.html#tasks'],
    ['desk.html ไม่มี hash → เติม #tasks', BASE + 'desk.html', BASE + 'desk.html#tasks'],
    ['ข้อความว่าง', '', BASE + 'desk.html#tasks'],
    ['พาธอื่นใน origin เดียวกัน', BASE + 'stock.html', BASE + 'desk.html#tasks'],
    ['javascript:', 'javascript:alert(1)', BASE + 'desk.html#tasks'],
    ['data:', 'data:text/html,<script>alert(1)</script>', BASE + 'desk.html#tasks'],
    ['พาธใกล้เคียง desk.html.evil', BASE + 'desk.html.evil', BASE + 'desk.html#tasks'],
    ['ไม่ใช่ข้อความ', { a: 1 }, BASE + 'desk.html#tasks'],
  ];
  for (const [name, input, expected] of cases) {
    await push(sw, dataOf({ title: 't', body: 'b', url: input }));
    const got = sw.shown[sw.shown.length - 1].options.data.url;
    ok(`url ${name}`, got === expected, got);
  }
}
console.log('=== กดแจ้งเตือน ===');
{
  const sw = load({ windows: [BASE + 'stock.html', BASE + 'desk.html#home'] });
  const closed = await click(sw, { url: BASE + 'desk.html#tasks' });
  ok('กดแล้วป้ายถูกปิด', closed);
  ok('มีหน้า desk เปิดอยู่: โฟกัสหน้านั้น (ไม่เปิดหน้าต่างใหม่ ไม่โหลดซ้ำ)', sw.focused.length === 1 && sw.focused[0] === BASE + 'desk.html#home' && sw.opened.length === 0, JSON.stringify({ f: sw.focused, o: sw.opened }));
  ok('บอกหน้า desk ให้ไปหมวด #tasks (postMessage)', sw.posted.length === 1 && sw.posted[0].url === BASE + 'desk.html#home' && sw.posted[0].m.type === 'djlab-notification-click' && sw.posted[0].m.hash === '#tasks', JSON.stringify(sw.posted));
}
{
  const sw = load({ windows: [BASE + 'stock.html', 'https://other.example/desk.html'] });
  await click(sw, { url: BASE + 'desk.html#tasks' });
  ok('ไม่มีหน้า desk (มีแต่ stock.html / desk.html ของ origin อื่น): เปิดหน้าต่างใหม่ที่ desk.html#tasks', sw.opened.length === 1 && sw.opened[0] === BASE + 'desk.html#tasks' && sw.focused.length === 0 && sw.posted.length === 0, JSON.stringify({ o: sw.opened, f: sw.focused }));
}
{
  const sw = load();
  await click(sw, undefined);
  await click(sw, { url: 'javascript:alert(1)' });
  ok('ป้ายไม่มีข้อมูล / ลิงก์ไม่ปลอดภัย: เปิด desk.html#tasks เสมอ', sw.opened.length === 2 && sw.opened.every(u => u === BASE + 'desk.html#tasks'), JSON.stringify(sw.opened));
}
{
  const sw = load({ windows: [BASE + 'desk.html'], openFails: true });
  let threw = null;
  try { await click(sw, { url: BASE + 'desk.html#booking' }); } catch (e) { threw = e; }
  ok('หน้า desk เปิดอยู่ + ลิงก์ #booking: ส่ง hash นั้นไป', sw.posted.length === 1 && sw.posted[0].m.hash === '#booking');
  const sw2 = load({ openFails: true });
  try { await click(sw2, {}); } catch (e) { threw = e; }
  ok('เปิดหน้าต่างไม่ได้ (iOS จำกัด): ไม่โยน error ออกมา', !threw, String(threw));
}
{
  const sw = load({ windows: [BASE + 'desk.html#home'], matchFails: true });
  let threw = null;
  try { await click(sw, { url: BASE + 'desk.html#tasks' }); } catch (e) { threw = e; }
  ok('หาหน้าที่เปิดอยู่ไม่ได้ (matchAll ล้ม): ไม่โยน error · เปิดหน้าต่างใหม่แทน (ผู้ใช้กดแล้วต้องมีอะไรเกิดขึ้น)', !threw && sw.opened.length === 1 && sw.opened[0] === BASE + 'desk.html#tasks', String(threw));
  const swF = load({ windows: [BASE + 'desk.html#home'], focusFails: true });
  let threwF = null;
  try { await click(swF, { url: BASE + 'desk.html#tasks' }); } catch (e) { threwF = e; }
  ok('โฟกัสหน้าไม่ได้ (บางแพลตฟอร์มห้าม): ไม่โยน error · ยังบอกหน้านั้นให้ไปหมวด #tasks', !threwF && swF.posted.length === 1 && swF.posted[0].m.hash === '#tasks' && swF.opened.length === 0, String(threwF));
  const swP = load({ windows: [BASE + 'desk.html#home'], postFails: true });
  let threwP = null;
  try { await click(swP, { url: BASE + 'desk.html#tasks' }); } catch (e) { threwP = e; }
  ok('หน้านั้นเพิ่งปิดตอนส่งข้อความ (postMessage โยน error): ไม่โยน error ออกมา', !threwP && swP.focused.length === 1, String(threwP));
  const sw2 = load({ windows: [BASE + 'desk.html#home'] });
  sw2.listeners.notificationclick({ notification: { close() {}, data: { url: BASE + 'desk.html#tasks' } }, waitUntil: p => { sw2._w = p; } });
  await sw2._w;
  ok('หน้า desk ที่เปิดค้างไว้ก่อน service worker ยึด (uncontrolled): ยังพบและโฟกัสได้ (ไม่เปิดซ้ำ)', sw2.focused.length === 1 && sw2.opened.length === 0);
}
{
  const sw = load({ windows: [BASE + 'desk.html'], matchFails: true });
  let w = null, threw = null;
  try { sw.listeners.pushsubscriptionchange({ waitUntil: p => { w = p; } }); await w; } catch (e) { threw = e; }
  ok('subscription เปลี่ยนแต่หาหน้าที่เปิดอยู่ไม่ได้: ไม่โยน error', !threw && sw.posted.length === 0, String(threw));
}
console.log('=== subscription เปลี่ยน · วงจรชีวิต · ไม่แคช ===');
{
  const sw = load({ windows: [BASE + 'desk.html', BASE + 'stock.html'] });
  let waited = null;
  sw.listeners.pushsubscriptionchange({ waitUntil: p => { waited = p; } });
  await waited;
  ok('เบราว์เซอร์หมุน subscription: บอกทุกหน้าที่เปิดอยู่ให้สมัครใหม่ (SW ไม่มี session เข้าฐานเอง)', sw.posted.length === 2 && sw.posted.every(p => p.m.type === 'djlab-push-resubscribe'), JSON.stringify(sw.posted));
  let w2 = null;
  sw.listeners.install({}); sw.listeners.activate({ waitUntil: p => { w2 = p; } }); await w2;
  ok('install เข้ายึดทันที (skipWaiting) · activate ยึดหน้าที่เปิดอยู่ (clients.claim)', sw.state().skipped && sw.state().claimed);
  ok('ไม่มี fetch handler (ไม่แคชอะไร ไม่ผูกกับเลข CACHE_NAME ของ sw.js)', !('fetch' in sw.listeners) && !/\bcaches\b|\bfetch\s*\(/.test(src.replace(/\/\/.*$/gm, '')));
  ok('ฟังเฉพาะ 5 เหตุการณ์: install · activate · push · notificationclick · pushsubscriptionchange', Object.keys(sw.listeners).sort().join() === 'activate,install,notificationclick,push,pushsubscriptionchange', Object.keys(sw.listeners).join());
}

console.log(`=== สรุป: ${pass} PASS / ${fail} FAIL ===`);
process.exit(fail ? 1 : 0);
