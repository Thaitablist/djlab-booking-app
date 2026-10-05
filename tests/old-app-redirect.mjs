/**
 * เทสต์การเลิกใช้แอปจองห้องเดิม (DJ_LAB_SIAM_BookingApp.html) — รัน: node tests/old-app-redirect.mjs
 *
 * 5 ต.ค. 69: เจ้าของสั่งเลิกใช้ · ไฟล์เหลือเป็น "หน้าพาไป" desk.html#booking (ห้ามลบ — บุ๊กมาร์ก/ไอคอนที่ติดตั้ง/ลิงก์เก่าต้องไม่ 404)
 * ไม่ต้องใช้เบราว์เซอร์: หน้าพาไปรันในตัวแทน location/document (vm) · sw.js รันในตัวแทน self/caches/fetch (ออฟไลน์)
 * ดูแผน: DJ LAB SIAM Systems/console-workspace/PLAN-retire-booking-app.md
 */
import { readFileSync, existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import vm from 'node:vm';

const root = process.env.REDIRECT_ROOT || join(dirname(fileURLToPath(import.meta.url)), '..');
const read = f => readFileSync(join(root, f), 'utf8');
let pass = 0, fail = 0;
const ok = (name, cond, extra) => { if (cond) { pass++; console.log('  [PASS] ' + name); } else { fail++; console.log('  [FAIL] ' + name + (extra ? ' — ' + extra : '')); } };

const OLD = 'DJ_LAB_SIAM_BookingApp.html';

// ── 1. หน้าพาไป ──
console.log('=== หน้าพาไป ' + OLD + ' ===');
ok('ไฟล์ยังอยู่ (ห้ามลบ — ไม่งั้นบุ๊กมาร์ก/ไอคอนที่ติดตั้ง 404)', existsSync(join(root, OLD)));
const page = read(OLD);
ok('เป็นหน้าเล็ก ไม่มีโค้ดแอปเดิมเหลือ (ไม่มี Supabase/ตารางจอง/จับเวลา)', page.length < 6000 && !/supabase|createClient|room_bookings|djlab_timer/i.test(page), String(page.length));
ok('คง <link rel="manifest"> + apple-touch-icon + ชื่อแอป "DJ LAB จอง" (ตัวตนแอปที่ติดตั้งไว้ไม่เปลี่ยน)',
  /<link rel="manifest" href="manifest\.json">/.test(page) && /<link rel="apple-touch-icon" href="icon-192\.png">/.test(page) && /apple-mobile-web-app-title" content="DJ LAB จอง"/.test(page) && /application-name" content="DJ LAB จอง"/.test(page));
ok('ไม่ลงทะเบียน service worker ใหม่ (เครื่องที่เคยลงทะเบียนยังอยู่ · เครื่องใหม่ไม่ต้อง)', !/serviceWorker/.test(page));
ok('มีทางพาไปเมื่อ JavaScript ปิด (noscript + meta refresh → desk.html#booking)', /<noscript><meta http-equiv="refresh" content="0; url=desk\.html#booking"><\/noscript>/.test(page));
ok('มีลิงก์ให้กดเองไป desk.html#booking', /<a id="go" href="desk\.html#booking">/.test(page));
const sizes = [...page.matchAll(/font-size:\s*(\d+(?:\.\d+)?)px/g)].map(m => +m[1]);
ok('ตัวหนังสือไม่เล็กกว่า 14px (กฎข้อ 6)', sizes.every(s => s >= 14) && /font:\s*18px/.test(page), sizes.join());
const script = (page.match(/<script>([\s\S]*?)<\/script>/) || [])[1];
ok('มีสคริปต์พาไปหนึ่งตัว', !!script);
const run = hash => {
  const go = { href: '' }, loc = { hash, url: null, replace(u) { this.url = u; } };
  vm.runInNewContext(script, { location: loc, document: { getElementById: id => (id === 'go' ? go : null) } });
  return { url: loc.url, href: go.href };
};
for (const [hash, to] of [['', 'booking'], ['#booking', 'booking'], ['#timer', 'booking'], ['#calendar', 'home'], ['#home', 'home'], ['#stock', 'home'], ['#xyz', 'home'], ['#admin', 'home']]) {
  const r = run(hash);
  ok(`เปิดด้วย "${hash}" → desk.html#${to}${hash === '#calendar' ? ' (ไม่ส่ง #calendar ต่อ: ใน desk คือปฏิทิน Google ของทีม ไม่ใช่ปฏิทินจอง)' : ''}`, r.url === 'desk.html#' + to && r.href === r.url, JSON.stringify(r));
}
const desk = read('desk.html');
ok('ปลายทาง #booking และ #home มีอยู่จริงในคอนโซล (SECTIONS)', /\{ id: 'booking',\s+hash: 'booking'/.test(desk) && /\{ id: 'home',\s+hash: 'home'/.test(desk));
ok('ปลายทางไม่ใช่ตัวหน้าพาไปเอง (ไม่วน)', !/BookingApp/.test(script) && run('').url.startsWith('desk.html'));
ok('desk.html ไม่ลิงก์ไปไฟล์เดิม (มีแต่คอมเมนต์ที่มาของโค้ด)', (desk.match(/DJ_LAB_SIAM_BookingApp\.html/g) || []).length === 1 && /\/\/ จองห้องซ้อม — ตรรกะเดียวกับ DJ_LAB_SIAM_BookingApp\.html/.test(desk));

// ── 2. ทางเข้า index.html ──
console.log('=== index.html (ทางเข้ารากรีโป · ปุ่ม LINE rich menu แอดมิน "คิวห้องซ้อม" ชี้ที่นี่) ===');
const index = read('index.html');
ok('index.html พาไป desk.html#booking', /<meta http-equiv="refresh" content="0; url=desk\.html#booking">/.test(index));
ok('index.html ไม่ผ่านหน้าเก่า (ไม่เพิ่มขั้นพาไปอีกชั้น)', !index.includes(OLD));

// ── 3. manifest.json ──
console.log('=== manifest.json (ไม่แตะ start_url ตามแผน — ตัวตนแอปที่ติดตั้งไว้) ===');
const manifest = JSON.parse(read('manifest.json'));
ok('start_url ยังชี้ไฟล์เดิม (= หน้าพาไป) หรือมี "id" คงตัวตนแอปไว้ — แก้ start_url โดยไม่มี id = แอปที่ติดตั้งอาจกลายเป็นแอปใหม่',
  manifest.start_url === './' + OLD || !!manifest.id, manifest.start_url + ' / id=' + manifest.id);
ok('scope ครอบ desk.html (หน้าพาไปเปิดต่อในหน้าต่างแอปเดิม)', manifest.scope === './' && !manifest.start_url.slice(2).includes('/'));
for (const s of manifest.shortcuts || []) {
  const [file, frag] = s.url.replace('./', '').split('#');
  ok(`shortcut "${s.name}" (${s.url}): ไฟล์มีอยู่ · hash #${frag} หน้าพาไปรู้จักและลงคอนโซล`, existsSync(join(root, file)) && run('#' + frag).url.startsWith('desk.html#'), JSON.stringify(run('#' + frag)));
}

// ── 4. sw.js ──
console.log('=== sw.js ===');
const swSrc = read('sw.js');
const BASE = 'https://x.github.io/djlab-booking-app/';
function loadSw(fetchImpl) {
  const listeners = {}, store = new Map();
  let opened = null;
  const norm = r => new URL(typeof r === 'string' ? r : r.url, BASE).href;
  const caches = {
    open: async () => ({ add: async () => {}, put: async (req, res) => { store.set(norm(req), res); } }),
    match: async r => { const v = store.get(norm(r)); return v ? v.clone() : v; }, keys: async () => [], delete: async () => true,   // Cache จริงคืนสำเนาให้อ่านซ้ำได้
  };
  const sandbox = {
    self: { addEventListener: (t, f) => { listeners[t] = f; }, location: { origin: new URL(BASE).origin }, registration: { showNotification() {} }, skipWaiting() {}, clients: { claim() {} } },
    caches, fetch: fetchImpl || (async () => { throw new TypeError('offline'); }), Response, URL, Promise, console,
    clients: { openWindow: u => { opened = u; return Promise.resolve(); } },
  };
  vm.createContext(sandbox);
  vm.runInContext(swSrc, sandbox);
  return { listeners, store, norm, cacheName: vm.runInContext('CACHE_NAME', sandbox), assets: vm.runInContext('ASSETS', sandbox), opened: () => opened };
}
async function navigate(sw, url) {
  let p = null;
  sw.listeners.fetch({ request: { method: 'GET', url: new URL(url, BASE).href, mode: 'navigate', destination: 'document' }, respondWith: x => { p = x; } });
  return p;
}
const bodyOf = async r => (r ? r.text() : '');
{
  const sw = loadSw();
  ok('CACHE_NAME ขึ้นเลขแล้ว (≥ v6 — เครื่องที่เคยโหลดแอปเดิมทิ้งแคชเก่า)', +(/-v(\d+)$/.exec(sw.cacheName) || [])[1] >= 6, sw.cacheName);
  ok('precache ยังมีหน้าพาไป + book.html + manifest.json + ไอคอน', ['./' + OLD, './book.html', './manifest.json', './icon-192.png', './icon-512.png'].every(a => sw.assets.includes(a)), sw.assets.join());
  ok('ชื่อไฟล์เดิมโผล่ในโค้ด sw.js (ไม่นับคอมเมนต์) ที่เดียว = precache — ตัวสำรองออฟไลน์/แจ้งเตือนไม่ชี้หน้าพาไป (ไม่งั้นวน)', (swSrc.replace(/\/\/.*$/gm, '').match(/DJ_LAB_SIAM_BookingApp/g) || []).length === 1);

  const off1 = await navigate(sw, 'desk.html');
  const t1 = await bodyOf(off1);
  ok('ออฟไลน์ + desk.html ไม่มีในแคช: ตอบหน้าแจ้ง "ไม่มีอินเทอร์เน็ต" (503) ไม่ใช่หน้าพาไป — ไม่วนซ้ำ', off1 && off1.status === 503 && t1.includes('ไม่มีอินเทอร์เน็ต') && !t1.includes('location.replace'), off1 && String(off1.status));
  const off2 = await navigate(sw, OLD);
  const t2 = await bodyOf(off2);
  ok('ออฟไลน์ + ไม่มีอะไรในแคชเลย เปิดไฟล์เดิม: ตอบหน้าแจ้ง ไม่ใช่ลูปพาไป', off2 && off2.status === 503 && t2.includes('ไม่มีอินเทอร์เน็ต'));
  sw.store.set(sw.norm('desk.html'), new Response('DESK-FROM-CACHE'));
  ok('ออฟไลน์ + desk.html อยู่ในแคช (เคยเปิดแล้ว): ได้คอนโซลจากแคช', (await bodyOf(await navigate(sw, 'desk.html'))) === 'DESK-FROM-CACHE');
  ok('ออฟไลน์ + เปิดไฟล์เดิมที่ไม่มีในแคช แต่ desk อยู่ในแคช: ได้คอนโซล (ไม่ใช่หน้าพาไป)', (await bodyOf(await navigate(sw, OLD))) === 'DESK-FROM-CACHE');
  sw.store.set(sw.norm(OLD), new Response('REDIRECT-PAGE-FROM-CACHE'));
  ok('ออฟไลน์ + หน้าพาไปอยู่ในแคช (precache): ได้หน้าพาไป แล้วไปต่อที่ desk จากแคช', (await bodyOf(await navigate(sw, OLD))) === 'REDIRECT-PAGE-FROM-CACHE');
  ok('ออฟไลน์ + หน้าอื่นที่ไม่มีในแคช (book.html): ได้คอนโซลจากแคช (พฤติกรรมสำรองเดิม: หน้าเริ่มต้นของพนักงาน)', (await bodyOf(await navigate(sw, 'book.html'))) === 'DESK-FROM-CACHE');
}
{
  const sw = loadSw(async () => new Response('ONLINE-PAGE', { status: 200 }));
  ok('ออนไลน์: HTML ใช้ของใหม่จากเครือข่ายเสมอ (network-first) ไม่ใช่ของค้างในแคช', (await bodyOf(await navigate(sw, OLD))) === 'ONLINE-PAGE');
  await new Promise(r => setTimeout(r, 20));
  ok('...และเก็บสำเนาไว้ใช้ตอนออฟไลน์', sw.store.has(sw.norm(OLD)));
}
{
  const sw = loadSw();
  let closed = false, waited = null;
  sw.listeners.notificationclick({ notification: { close() { closed = true; } }, waitUntil: p => { waited = p; } });
  await waited;
  ok('กดแจ้งเตือนของ sw.js เปิดคอนโซลหมวดจองห้อง (ไม่ผ่านหน้าพาไป)', closed && sw.opened() === './desk.html#booking', String(sw.opened()));
}

// ── 5. เมนู "เลือกหน้า" ในหน้าเบา 6 หน้า ──
console.log('=== เมนูเลือกหน้า (stock · sales · customers · daily · admin-data · activity) ===');
for (const f of ['stock', 'sales', 'customers', 'daily', 'admin-data', 'activity']) {
  const src = read(f + '.html');
  ok(`${f}.html: "จองห้องซ้อม" ชี้ desk.html#booking · ไม่เหลือลิงก์ไปหน้าเก่า · ตัวเปลี่ยนหน้าใช้ค่าในเมนูตรง ๆ`,
    src.includes('<option value="desk.html#booking">จองห้องซ้อม</option>') && !src.includes(OLD) && /location\.href = e\.target\.value/.test(src));
  ok(`${f}.html ยังอยู่ครบ (ผู้ใช้ไม่ใช้แล้วแต่ห้ามลบ)`, existsSync(join(root, f + '.html')));
}

console.log(`=== สรุป: ${pass} PASS / ${fail} FAIL ===`);
process.exit(fail ? 1 : 0);
