/**
 * เทสต์หน้าแรกพนักงานของ desk.html — หน้าแรก · กระดานข้อความ · กล่องจดหมายร้าน · ปฏิทิน
 *   รัน: node tests/desk-staff.mjs
 *
 * วิธีเดียวกับชุดอื่น: ไฟล์จริงทุกบรรทัด สลับเฉพาะแท็ก Supabase เป็นตัวปลอม
 * Edge Function (`mail` / `gcal`) ก็ปลอมที่ db.functions.invoke — เทสต์เปลี่ยนคำตอบได้ผ่าน window.FN
 * ตัวฟังก์ชันจริงมีเทสต์ของมันเองในรีโป schema (npm run test:functions)
 */

import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { runPage, HARNESS } from './lib/page-test.mjs';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');

export const MOCK = `<script>
const CALLS = [];
const TODAY = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Bangkok' });
const FAKE = {
  admins: [
    { id: 'u1', full_name: 'เจ้าของร้าน', role: 'owner', is_active: true },
    { id: 'u2', full_name: 'พนักงานหน้าร้าน', role: 'staff', is_active: true },
    { id: 'u3', full_name: 'พนักงานกะเย็น', role: 'staff', is_active: true },
    { id: 'u4', full_name: 'อดีตพนักงาน', role: 'staff', is_active: false },
  ],
  products: [], product_stock_levels: [], product_units: [], stock_movements: [], sales: [], sale_items: [],
  customers: [], members: [], loyalty_points_ledger: [],
  booking_settings: [{ id: true, price_per_hour: 800, points_per_hour: 1, free_hour_threshold: 10, free_hours_reward: 1, room_name: 'DJ LAB SIAM' }],
  room_bookings: [
    { id: 'rb1', customer_name: 'ลูกค้าซ้อมบ่าย', contact: '0812345678', date: TODAY, start_time: '13:00:00', hours: 2,
      room: 'Controller Setup', cost: 1600, status: 'upcoming', confirmed: true, source: 'staff' },
  ],
  // u2 = พนักงานที่ล็อกอิน · ที่ต้องเตือน u2 คือ m1 (ถึงทุกคน) กับ m5 (ถึง u2 ตรง ๆ) เท่านั้น
  board_messages: [
    { id: 'm1', author_id: 'u1', refers_to: TODAY, title: 'ของเข้าพรุ่งนี้ช่วงบ่าย', body: 'CDJ-3000X 4 เครื่อง\\nช่วยเคลียร์ชั้นวาง', pinned: false,
      target_admin_id: null, created_at: '2026-09-30T02:00:00Z', updated_at: '2026-09-30T02:00:00Z' },
    { id: 'm2', author_id: 'u2', refers_to: TODAY, title: 'ข้อความที่ฉันเขียนเอง', body: '', pinned: false,
      target_admin_id: null, created_at: '2026-09-30T03:00:00Z', updated_at: '2026-09-30T03:00:00Z' },
    { id: 'm3', author_id: 'u1', refers_to: TODAY, title: 'ข้อความส่วนตัวถึงกะเย็น', body: '', pinned: false,
      target_admin_id: 'u3', created_at: '2026-09-30T04:00:00Z', updated_at: '2026-09-30T04:00:00Z' },
    { id: 'm4', author_id: 'u3', refers_to: '2026-09-29', title: 'อ่านไปแล้ว', body: '', pinned: false,
      target_admin_id: null, created_at: '2026-09-29T04:00:00Z', updated_at: '2026-09-29T04:00:00Z' },
    { id: 'm5', author_id: 'u1', refers_to: TODAY, title: 'ถึงคุณโดยตรง', body: 'เช็กสต็อกสายก่อนปิดร้าน', pinned: true,
      target_admin_id: 'u2', created_at: '2026-09-30T05:00:00Z', updated_at: '2026-09-30T05:00:00Z' },
  ],
  board_reads: [
    { message_id: 'm4', admin_id: 'u2', read_at: '2026-09-29T05:00:00Z' },
    { message_id: 'm1', admin_id: 'u3', read_at: '2026-09-30T02:30:00Z' },
  ],
  calendar_events: [
    { id: 'e1', title: 'คลาส Scratch 1-on-1', event_date: TODAY, all_day: false, start_time: '14:00:00', end_time: '15:00:00',
      category: 'class', note: 'ห้อง 2', created_by: 'u1', created_at: '2026-09-30T01:00:00Z', updated_at: '2026-09-30T01:00:00Z' },
  ],
  staff_settings: [{ id: true, gcal_ics_url: null }],
};

// คำตอบของ Edge Function — เทสต์สลับได้ระหว่างรัน
window.FN = {
  mail: body => {
    // จำนวนต่อแท็บ: ป้าย "Mahajak Cop" ยังไม่มีใน Gmail (null)
    const counts = { inbox: { total: 40, unseen: 3 }, 'ส่งซ่อม': { total: 4, unseen: 1 }, BOYZ: { total: 2, unseen: 0 },
                     starred: { total: 5, unseen: 0 }, 'Mahajak Cop': null };
    if (body.action === 'status') return { unseen: 3, counts };
    if (body.action === 'list' && body.box === 'Mahajak Cop') return { error: { code: 'no_label', message: 'ยังไม่มีป้ายนี้ใน Gmail' }, counts, unseen: 3, box: body.box };
    if (body.action === 'list' && body.box === 'ส่งซ่อม') return { page: 1, page_size: 25, total: 1, unseen: 3, counts, box: body.box, messages: [
      { uid: 55, seen: false, starred: false, date: TODAY + 'T11:00:00+07:00', from: { name: 'ลูกค้าส่งซ่อม', address: 'fix@example.com' }, subject: 'ส่ง DJM-S11 ซ่อม' },
    ] };
    if (body.action === 'list') return { page: 1, page_size: 25, total: 2, unseen: 3, counts, box: body.box, messages: [
      { uid: 902, seen: false, date: TODAY + 'T09:15:00+07:00', from: { name: 'Pioneer DJ Thailand', address: 'dealer@example.com' }, subject: 'ใบเสนอราคา CDJ-3000X' },
      { uid: 901, seen: true, date: '2026-09-29T16:40:00+07:00', from: { name: '', address: 'customer@example.com' }, subject: 'สอบถามคอร์สเรียน' },
    ] };
    if (body.action === 'get') return { message: {
      uid: body.uid, box: body.box, seen: true, starred: false, date: TODAY + 'T09:15:00+07:00', subject: 'ใบเสนอราคา CDJ-3000X',
      labels: [{ name: 'ส่งซ่อม', exists: true, on: false }, { name: 'BOYZ', exists: true, on: true }, { name: 'Mahajak Cop', exists: false, on: false }],
      from: { name: 'Pioneer DJ Thailand', address: 'dealer@example.com' }, to: [{ address: 'djlabsiam@gmail.com' }], cc: [], reply_to: [],
      message_id: '<abc@example.com>', references: '', text: 'สวัสดีครับ แนบใบเสนอราคา',
      html: '<p><b>สวัสดีครับ</b> แนบใบเสนอราคา</p><script>parent.PWNED = "script";<\\/script>' +
            '<img src="does-not-exist.png" onerror="parent.PWNED = \\'onerror\\'">',
      attachments: [{ filename: 'quote.pdf', mime_type: 'application/pdf', size: 1234 }], truncated: false,
    } };
    return { ok: true };
  },
  // สีชั้น Google = "กล้วย" (สีอ่อน) — ตั้งใจให้ตัวอักษรขาวอ่านไม่ออก เพื่อพิสูจน์ว่าหน้าเว็บเลือกตัวอักษรดำให้เอง
  gcal: body => ({ color: '#F6BF26', events: [
    { uid: 'g1', title: 'ประชุมกับตัวแทน Pioneer', location: 'ร้าน', description: '', all_day: false,
      start: TODAY + 'T10:00', end: TODAY + 'T11:00' },
  ] }),
};

function builder(table) {
  const q = {
    _rows: (FAKE[table] || []).slice(),
    select() { return q; },
    eq(col, val) { q._rows = q._rows.filter(r => r[col] === val); const l = CALLS[CALLS.length - 1]; if (l && l.q === q) (l.where = l.where || []).push([col, val]); return q; },
    in(col, vals) { q._rows = q._rows.filter(r => vals.includes(r[col])); return q; },
    gte() { return q; }, lte() { return q; }, lt() { return q; }, order() { return q; }, limit() { return q; },
    is() { return q; }, or() { return q; }, ilike() { return q; }, range() { return q; }, contains() { return q; },
    async maybeSingle() { return { data: q._rows[0] || null, error: null }; },
    async single() { return { data: q._rows[0] || null, error: null }; },
    then(res, rej) { return Promise.resolve({ data: q._rows, error: null, count: q._rows.length }).then(res, rej); },
    insert(payload) { CALLS.push({ op: 'insert', table, payload, q }); q._rows = [Object.assign({ id: 'new-' + CALLS.length }, payload)]; return q; },
    update(payload) { CALLS.push({ op: 'update', table, payload, q }); return q; },
    upsert(payload) { CALLS.push({ op: 'upsert', table, payload, q }); return q; },
    delete() { CALLS.push({ op: 'delete', table, q }); return q; },
  };
  return q;
}
let SESSION = null, authCb = null;
window.supabase = {
  createClient: () => ({
    from: builder,
    rpc: async (fn, args) => { CALLS.push({ op: 'rpc', fn, args }); return { data: null, error: null }; },
    functions: {
      async invoke(name, opts) {
        CALLS.push({ op: 'fn', name, body: opts.body });
        return { data: window.FN[name](opts.body), error: null };
      },
    },
    channel: () => ({ on() { return this; }, subscribe() { return this; } }),
    storage: { from: () => ({ async upload() { return { error: null }; }, async remove() { return { error: null }; },
      async createSignedUrl() { return { data: { signedUrl: 'data:,' }, error: null }; } }) },
    auth: {
      async getSession() { return { data: { session: SESSION } }; },
      onAuthStateChange(cb) { authCb = cb; },
      async signInWithPassword({ email }) {
        SESSION = { user: { id: email.startsWith('owner') ? 'u1' : 'u2' } };
        setTimeout(() => authCb && authCb('SIGNED_IN', SESSION));
        return { data: {}, error: null };
      },
      async signOut() { SESSION = null; setTimeout(() => authCb && authCb('SIGNED_OUT', null)); return { error: null }; },
    },
  }),
};
</script>`;

const TESTS = `<script>
window.addEventListener('load', () => setTimeout(runTests, 300));
${HARNESS}
const sleep = ms => new Promise(r => setTimeout(r, ms));
function key(code, k, mods) {
  clock += 5000;
  const ev = new KeyboardEvent('keydown', Object.assign({ code, key: k, bubbles: true, cancelable: true }, mods || {}));
  (document.activeElement || document).dispatchEvent(ev);
  return ev;
}
const txt = id => document.getElementById(id).textContent;
const vis = id => !document.getElementById(id).hidden;
const writes = () => CALLS.filter(c => ['insert', 'update', 'delete', 'upsert'].includes(c.op));
const fns = (name, action) => CALLS.filter(c => c.op === 'fn' && c.name === name && (!action || c.body.action === action));
// คอนทราสต์ของตัวอักษรกับพื้นจริงที่เบราว์เซอร์วาด (คำนวณเองตาม WCAG ไม่ใช้ฟังก์ชันของหน้าเว็บ)
function rgbOf(c) { const m = c.match(/[0-9]+(?:[.][0-9]+)?/g).map(Number); return m.slice(0, 3); }
function lumOf(rgb) { const v = rgb.map(x => x / 255).map(x => x <= 0.03928 ? x / 12.92 : Math.pow((x + 0.055) / 1.055, 2.4)); return 0.2126 * v[0] + 0.7152 * v[1] + 0.0722 * v[2]; }
function contrastOf(el) {
  const cs = getComputedStyle(el), a = lumOf(rgbOf(cs.color)), b = lumOf(rgbOf(cs.backgroundColor));
  return (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
}
const worstContrast = els => els.reduce((m, el) => Math.min(m, contrastOf(el)), 99);

async function runTests() {
  L('=== หน้าแรกพนักงาน desk.html ===');
  document.getElementById('loginEmail').value = 'staff@djlabsiam.com';
  document.getElementById('loginPassword').value = 'x';
  await doLogin();
  await sleep(500);

  // ── 1. หน้าแรก ────────────────────────────────────────────────────────
  ok('ล็อกอินแล้วเปิดหน้าแรกเป็นหมวดเริ่มต้น', current === 'home' && vis('sec-home') && location.hash === '#home', current + ' ' + location.hash);
  ok('ทักทายด้วยชื่อผู้ใช้', txt('homeHello').indexOf('พนักงานหน้าร้าน') !== -1, txt('homeHello'));
  ok('บอกวันที่เป็นภาษาไทย (พ.ศ.)', /^วัน.+ที่ \\d+ .+ 25\\d\\d$/.test(txt('homeDate')), txt('homeDate'));

  const box = document.querySelector('#homeUnread .unread-box');
  const boxText = box ? box.textContent : '';
  ok('มีกล่องเตือนข้อความที่ยังไม่ได้อ่านบนหน้าแรก', !!box);
  ok('เตือนเฉพาะข้อความที่ "ฉัน" ยังไม่ได้อ่าน: 2 ข้อความ', box.querySelector('.count').textContent === '2' && box.querySelectorAll('.list-row').length === 2, boxText);
  ok('รายการเตือนมีอักษรย่อของคนเขียน', box.querySelectorAll('.ava').length === 2 && box.querySelector('.ava').textContent === 'จ', box.innerHTML.slice(0, 200));
  ok('รายการเตือนมีข้อความถึงทุกคน (m1) และข้อความถึงฉัน (m5)',
    boxText.indexOf('ของเข้าพรุ่งนี้ช่วงบ่าย') !== -1 && boxText.indexOf('ถึงคุณโดยตรง') !== -1, boxText);
  ok('ไม่เตือนข้อความที่ฉันเขียนเอง', boxText.indexOf('ข้อความที่ฉันเขียนเอง') === -1);
  ok('ไม่เตือนข้อความส่วนตัวที่ถึงคนอื่น', boxText.indexOf('ข้อความส่วนตัวถึงกะเย็น') === -1);
  ok('ไม่เตือนข้อความที่อ่านไปแล้ว', boxText.indexOf('อ่านไปแล้ว') === -1);
  const badge = document.getElementById('navBadge-board');
  ok('เมนูกระดานข้อความมีตัวเลข 2', !!badge && !badge.hidden && badge.textContent === '2', badge && badge.textContent);

  ok('ไม่มีปุ่ม "เข้าสู่คอนโซลร้าน"', !document.getElementById('homeConsoleBtn') && txt('sec-home').indexOf('เข้าสู่คอนโซลร้าน') === -1);
  ok('ตอกบัตร: ช่องสถานะบอก "รอปรึกษา" (ยังไม่มีระบบ)', txt('clockPill').indexOf('ตอกบัตร') !== -1 && txt('clockPill').indexOf('รอปรึกษา') !== -1, txt('clockPill'));
  ok('วันลา: ช่องสถานะบอก "รอปรึกษา" (ยังไม่มีระบบ)', txt('leavePill').indexOf('วันลา') !== -1 && txt('leavePill').indexOf('รอปรึกษา') !== -1, txt('leavePill'));
  ok('ตอกบัตร/วันลาไม่มีปุ่มกด ไม่มีการเขียนอะไร', !document.querySelector('#clockPill button, #leavePill button') && writes().length === 0);
  ok('ไม่มีหมวดตอกบัตรในเมนู', !/ตอกบัตร/.test(txt('navList')));
  const lt = k => document.querySelector('#launcher .lt[data-key="' + k + '"]');
  ok('ไอคอนอีเมลมีตัวเลขอีเมลที่ยังไม่ได้เปิด (3) ที่มุม', !!lt('mail') && lt('mail').querySelector('.badge').textContent === '3', lt('mail') && lt('mail').outerHTML.slice(0, 200));
  ok('เมนูกล่องจดหมายมีตัวเลข 3', txt('navBadge-mail') === '3');
  ok('ไทล์ปฏิทินแสดงกิจกรรมวันนี้ทั้งของร้านและ Google',
    txt('tileCal').indexOf('คลาส Scratch 1-on-1') !== -1 && txt('tileCal').indexOf('ประชุมกับตัวแทน Pioneer') !== -1, txt('tileCal'));
  ok('วันนี้บนหน้าแรกรวมการจองห้องด้วย', txt('tileCal').indexOf('ลูกค้าซ้อมบ่าย') !== -1, txt('tileCal'));
  const homeChips = [...document.querySelectorAll('#tileCal .chip')];
  ok('ป้ายสีบนหน้าแรกมีชื่อแหล่งกำกับ (คลาสเรียน · Google · ห้องซ้อม)', ['คลาสเรียน', 'Google', 'ห้องซ้อม'].every(t => homeChips.some(c => c.textContent === t)),
    homeChips.map(c => c.textContent));
  ok('ป้ายสีบนหน้าแรก ตัวอักษรคอนทราสต์ ≥ 4.5:1 ทุกอัน', homeChips.length === 3 && worstContrast(homeChips) >= 4.5, worstContrast(homeChips).toFixed(2));

  // นาฬิกาและสถานะร้าน — ใช้เวลาที่กำหนดเอง ไม่ขึ้นกับเวลาที่รันเทสต์
  bkkNow = () => ({ h: 14, m: 30, s: 5 });
  renderHome();
  ok('นาฬิกาแสดงเวลาไทย 14:30', txt('homeClock').indexOf('14:30') === 0, txt('homeClock'));
  ok('14:30 = ร้านเปิดอยู่ · ปิด 20:00 อีก 5 ชม. 30 นาที', document.getElementById('shopState').classList.contains('open') &&
    txt('shopStateText') === 'ร้านเปิดอยู่' && txt('shopStateSub') === 'ปิด 20:00 · อีก 5 ชม. 30 นาที', txt('shopStateSub'));

  ok('การจองที่กำลังใช้ห้องขึ้น "กำลังใช้ห้อง"', !!document.querySelector('#tileCal .agenda-row.now') &&
    document.querySelector('#tileCal .agenda-row.now').textContent.indexOf('กำลังใช้ห้อง') !== -1);

  bkkNow = () => ({ h: 21, m: 5, s: 0 });
  renderHome();
  ok('21:05 = ปิดร้านแล้ว', txt('shopStateText') === 'ปิดร้านแล้ว' && !document.getElementById('shopState').classList.contains('open'), txt('shopStateText'));
  bkkNow = () => ({ h: 10, m: 15, s: 0 });
  renderHome();
  ok('10:15 = ยังไม่เปิด · อีก 1 ชม. 45 นาที', txt('shopStateSub') === 'เปิด 12:00 · อีก 1 ชม. 45 นาที', txt('shopStateSub'));
  ok('ไม่มีแผ่นเสียงหมุนและแถบเวลา 12:00–20:00 แล้ว (เจ้าของสั่งเอาออก)', !document.querySelector('.platter, #homeWave, #waveBars, #wavePlayhead'));
  bkkNow = () => ({ h: 14, m: 30, s: 5 });
  renderHome();

  // ── 2. กระดานข้อความ ──────────────────────────────────────────────────
  key('KeyB', 'b', { altKey: true });
  ok('Alt+B ไปกระดานข้อความ', current === 'board' && vis('sec-board') && location.hash === '#board', current);
  const rows = () => [...document.querySelectorAll('#boardRows tr[data-i]')];
  ok('แสดงข้อความ 5 รายการ', rows().length === 5, rows().length);
  ok('ข้อความปักหมุดอยู่บนสุด', rows()[0].textContent.indexOf('ถึงคุณโดยตรง') !== -1, rows()[0].textContent);
  const r1 = rows().find(tr => tr.textContent.indexOf('ของเข้าพรุ่งนี้') !== -1);
  ok('นับคนอ่าน m1 = 1/2 (ผู้รับคือทุกคนที่ยังทำงาน ยกเว้นคนเขียน)', !!r1 && r1.textContent.indexOf('อ่านแล้ว 1/2') !== -1, r1 && r1.textContent);
  ok('ข้อความส่วนตัวถึง 1 คน นับ 0/1', rows().some(tr => tr.textContent.indexOf('ข้อความส่วนตัวถึงกะเย็น') !== -1 && tr.textContent.indexOf('0/1') !== -1));
  ok('สถานะของฉันบอกด้วยข้อความ (ยังไม่ได้อ่าน/อ่านแล้ว/ฉันเขียน)',
    r1.textContent.indexOf('ยังไม่ได้อ่าน') !== -1 && document.getElementById('boardRows').textContent.indexOf('ฉันเขียน') !== -1);

  CALLS.length = 0;
  await openBoardMsg('m1');
  await sleep(50);
  const rd = CALLS.find(c => c.op === 'insert' && c.table === 'board_reads');
  ok('เปิดอ่านแล้วบันทึกว่าอ่านแล้วของฉัน (board_reads)', !!rd && rd.payload.message_id === 'm1' && rd.payload.admin_id === 'u2',
    JSON.stringify(rd && rd.payload));
  ok('ไม่มีการเขียนอย่างอื่นพ่วง', writes().length === 1, JSON.stringify(writes().map(c => c.table + ':' + c.op)));
  ok('แผงรายละเอียดแสดง อ่านแล้ว 2/2 พร้อมชื่อ', txt('detailBody').indexOf('อ่านแล้ว 2/2 คน') !== -1 &&
    txt('detailBody').indexOf('พนักงานกะเย็น') !== -1, txt('detailBody'));
  ok('ตัวเลขบนเมนูลดเหลือ 1', txt('navBadge-board') === '1', txt('navBadge-board'));
  ok('ข้อความส่วนตัวถึงคนอื่นไม่ถูกนับเป็นคนที่ยังไม่อ่านของ m1', txt('detailBody').indexOf('อดีตพนักงาน') === -1);

  ok('พนักงานไม่เห็นปุ่มแก้/ลบข้อความของคนอื่น', !document.getElementById('bdEditBtn') && !document.getElementById('bdDeleteBtn'));
  ok('บอกเหตุผลว่าแก้ได้เฉพาะคนเขียน', txt('detailBody').indexOf('เฉพาะคนเขียน') !== -1);
  CALLS.length = 0;
  openBoardForm('m1');
  ok('เรียกฟอร์มแก้ข้อความคนอื่นตรง ๆ ก็ไม่เปิด', !document.getElementById('boardDialog').open);
  ok('บอกเหตุผลเมื่อถูกปฏิเสธ', txt('toast').indexOf('แก้ไขได้เฉพาะคนเขียน') !== -1, txt('toast'));
  editingBoardId = 'm1';
  await saveBoard();
  ok('สั่งบันทึกทับข้อความคนอื่นตรง ๆ ก็ไม่มีการเขียน', writes().length === 0, JSON.stringify(writes().map(c => c.table)));

  CALLS.length = 0;
  await openBoardMsg('m4');
  ok('เปิดข้อความที่อ่านแล้วไม่บันทึกซ้ำ', writes().length === 0);
  await openBoardMsg('m2');
  ok('ข้อความของตัวเองมีปุ่มแก้และลบ', !!document.getElementById('bdEditBtn') && !!document.getElementById('bdDeleteBtn'));

  CALLS.length = 0;
  openBoardForm(null);
  ok('ฟอร์มเขียนข้อความตั้งวันที่เป็นวันนี้', document.getElementById('bfDate').value === TODAY);
  ok('เลือกผู้รับได้: ทุกคน + ทีมงานที่ยังทำงาน (ไม่รวมตัวเองและคนที่เลิกใช้งาน)',
    [...document.getElementById('bfTarget').options].map(o => o.textContent).sort().join('|') === ['ทุกคน', 'พนักงานกะเย็น', 'เจ้าของร้าน'].sort().join('|'),
    [...document.getElementById('bfTarget').options].map(o => o.textContent).join('|'));
  document.getElementById('bfTitle').value = 'ฝากปิดแอร์ห้องซ้อม';
  document.getElementById('bfDate').value = '2026-10-02';
  await saveBoard();
  const ins = CALLS.find(c => c.op === 'insert' && c.table === 'board_messages');
  ok('เขียนข้อความใหม่ในนามตัวเอง พร้อมวันที่ที่เลือก', !!ins && ins.payload.author_id === 'u2' && ins.payload.refers_to === '2026-10-02' &&
    ins.payload.title === 'ฝากปิดแอร์ห้องซ้อม' && ins.payload.target_admin_id === null, JSON.stringify(ins && ins.payload));
  ok('ปิดฟอร์มหลังบันทึก', !document.getElementById('boardDialog').open);

  // ── 3. ปฏิทิน ─────────────────────────────────────────────────────────
  CALLS.length = 0;
  key('KeyC', 'c', { altKey: true });
  await sleep(200);
  ok('Alt+C ไปปฏิทิน', current === 'calendar' && location.hash === '#calendar', current);
  const g = fns('gcal')[0];
  ok('ขอปฏิทิน Google ผ่านฟังก์ชัน gcal พร้อมช่วงวันที่ของเดือน', !!g && /^\\d{4}-\\d{2}-\\d{2}$/.test(g.body.from) && g.body.from <= TODAY && g.body.to >= TODAY,
    JSON.stringify(g && g.body));
  const chip = kind => [...document.querySelectorAll('#calGrid .ev[data-kind="' + kind + '"]')];
  ok('ชั้น Google แสดงจากคำตอบของฟังก์ชัน', chip('google').some(b => b.textContent.indexOf('ประชุมกับตัวแทน Pioneer') !== -1));
  ok('ป้าย Google มีข้อความกำกับ ไม่ใช่สีอย่างเดียว', chip('google')[0].textContent.indexOf('Google') === 0, chip('google')[0].textContent);
  ok('กิจกรรมร้านมีชื่อหมวดในป้าย', chip('shop').some(b => b.textContent.indexOf('คลาสเรียน') === 0 && b.textContent.indexOf('14:00') !== -1));
  ok('ชั้นการจองห้องปิดอยู่ตอนเริ่ม', chip('room').length === 0);
  const g0 = chip('google')[0];
  ok('ป้ายเป็นสีทึบ ไม่ใช่เส้นขอบซ้าย', getComputedStyle(g0).borderLeftWidth === '0px' && getComputedStyle(g0).backgroundColor === 'rgb(246, 191, 38)',
    getComputedStyle(g0).backgroundColor + ' / ' + getComputedStyle(g0).borderLeftWidth);
  ok('สีชั้น Google มาจากที่เจ้าของร้านเลือก (ฟังก์ชันส่ง color มา)', calState.gcolor === '#F6BF26');
  ok('พื้นสีอ่อน (กล้วย) ได้ตัวอักษรดำ ไม่ใช่ขาว', getComputedStyle(g0).color === 'rgb(15, 15, 15)', getComputedStyle(g0).color);
  ok('คลาสเรียนสีเขียวทึบ ตัวอักษรขาว', chip('shop').some(b => getComputedStyle(b).backgroundColor === 'rgb(11, 128, 67)' && getComputedStyle(b).color === 'rgb(255, 255, 255)'));
  document.getElementById('layerRooms').click();
  ok('เปิดชั้นการจองห้องแล้วเห็นการจอง', chip('room').some(b => b.textContent.indexOf('ลูกค้าซ้อมบ่าย') !== -1));
  ok('ครบสามชั้น: ร้าน · Google · ห้องซ้อม คนละสี', new Set(['shop', 'google', 'room'].map(k => getComputedStyle(chip(k)[0]).backgroundColor)).size === 3);
  const allChips = [...document.querySelectorAll('#calGrid .ev')];
  ok('รายเดือน: ตัวอักษรในป้ายทุกอันคอนทราสต์ ≥ 4.5:1', worstContrast(allChips) >= 4.5, worstContrast(allChips).toFixed(2));
  const legend = [...document.querySelectorAll('#calLegend .chip')];
  ok('คำอธิบายสีมีครบทุกแหล่งพร้อมชื่อ (5 หมวด + Google + ห้องซ้อม)', legend.length === 7 && legend.some(c => c.textContent.indexOf('Google') === 0) &&
    worstContrast(legend) >= 4.5, legend.map(c => c.textContent));
  setCalView('week');
  await sleep(150);
  const weekChips = [...document.querySelectorAll('#calGrid.cal-week .ev, .cal-week .ev')];
  ok('รายสัปดาห์: สีเดียวกัน ตัวอักษรคอนทราสต์ ≥ 4.5:1', weekChips.length >= 3 && worstContrast(weekChips) >= 4.5 &&
    weekChips.some(b => b.dataset.kind === 'google' && getComputedStyle(b).backgroundColor === 'rgb(246, 191, 38)'), weekChips.length);
  setCalView('month');
  await sleep(150);
  document.getElementById('layerGoogle').click();
  ok('ปิดชั้น Google แล้วกิจกรรม Google หายไป', chip('google').length === 0);
  document.getElementById('layerGoogle').click();
  await sleep(100);
  chip('google')[0].click();
  ok('เปิดกิจกรรม Google บอกว่าแก้ไม่ได้ (อ่านอย่างเดียว)', txt('detailBody').indexOf('ดูได้อย่างเดียว') !== -1 && !/แก้ไขกิจกรรม|ลบกิจกรรม/.test(txt('detailBody')));
  ok('พนักงานไม่เห็นปุ่มตั้งค่า Google Calendar', !vis('gcalSetupBtn'));

  CALLS.length = 0;
  openEventForm(null, TODAY);
  document.getElementById('ceTitle').value = 'ถ่ายคอนเทนต์ DDJ-FLX10';
  document.getElementById('ceAllDay').checked = false;
  syncEventTimes();
  document.getElementById('ceStart').value = '16:00';
  document.getElementById('ceEnd').value = '15:00';
  await saveEvent();
  ok('เวลาจบก่อนเวลาเริ่ม ถูกปฏิเสธ ไม่มีการเขียน', writes().length === 0 && txt('toast').indexOf('เวลาจบ') !== -1, txt('toast'));
  document.getElementById('ceEnd').value = '17:30';
  document.getElementById('ceCategory').value = 'event';
  await saveEvent();
  const ce = CALLS.find(c => c.op === 'insert' && c.table === 'calendar_events');
  ok('เพิ่มกิจกรรมเขียนลง calendar_events ครบทุกช่อง', !!ce && ce.payload.title === 'ถ่ายคอนเทนต์ DDJ-FLX10' && ce.payload.event_date === TODAY &&
    ce.payload.all_day === false && ce.payload.start_time === '16:00' && ce.payload.end_time === '17:30' &&
    ce.payload.category === 'event' && ce.payload.created_by === 'u2', JSON.stringify(ce && ce.payload));
  ok('ไม่มีการเขียนตารางอื่นพ่วง', writes().every(c => c.table === 'calendar_events'), JSON.stringify(writes().map(c => c.table)));

  // ── 4. กล่องจดหมาย ────────────────────────────────────────────────────
  CALLS.length = 0;
  key('KeyM', 'm', { altKey: true });
  await sleep(200);
  ok('Alt+M ไปกล่องจดหมาย', current === 'mail' && location.hash === '#mail', current);
  ok('โหลดรายการผ่านฟังก์ชัน mail (list)', fns('mail', 'list').length === 1, JSON.stringify(fns('mail').map(c => c.body)));
  const mrows = [...document.querySelectorAll('#mailRows tr[data-i]')];
  ok('แสดงอีเมล 2 ฉบับ', mrows.length === 2, mrows.length);
  ok('ฉบับที่ยังไม่อ่านมีป้าย "ใหม่"', mrows[0].textContent.indexOf('ใหม่') !== -1 && mrows[1].textContent.indexOf('ใหม่') === -1);
  ok('ตัวแบ่งหน้าบอก 1–2 จาก 2 ฉบับ', txt('mailPager') === '1–2 จาก 2 ฉบับ', txt('mailPager'));
  const tabs = () => [...document.querySelectorAll('#mailTabs .mail-tab')];
  ok('แท็บครบ 5: กล่องจดหมาย · ส่งซ่อม · BOYZ · ติดดาว · Mahajak Cop',
    tabs().map(t => t.dataset.box).join('|') === 'inbox|ส่งซ่อม|BOYZ|ติดดาว|Mahajak Cop'.replace('ติดดาว', 'starred'), tabs().map(t => t.textContent).join('|'));
  ok('แท็บกล่องจดหมายถูกเลือกอยู่', tabs()[0].getAttribute('aria-selected') === 'true');
  ok('แท็บบอกจำนวน (กล่องจดหมาย 3 · ส่งซ่อม 1 · ติดดาว 5)', tabs()[0].textContent.indexOf('3') !== -1 && tabs()[1].textContent.indexOf('1') !== -1 &&
    tabs()[3].textContent.indexOf('5') !== -1, tabs().map(t => t.textContent).join('|'));
  ok('ป้ายที่ยังไม่มีใน Gmail แท็บจางลงพร้อมคำอธิบาย', tabs()[4].classList.contains('missing') && tabs()[4].title === 'ยังไม่มีป้ายนี้ใน Gmail');
  window.PWNED = undefined;
  document.getElementById('tw-mail').focus();
  key('ArrowDown', 'ArrowDown'); key('Enter', 'Enter');
  await sleep(600);
  const get = fns('mail', 'get')[0];
  ok('↓ Enter เปิดอ่านอีเมล (get uid 902)', !!get && get.body.uid === 902, JSON.stringify(get && get.body));
  const frame = document.getElementById('mailBody');
  ok('เนื้ออีเมลอยู่ใน iframe ที่ sandbox ไม่ให้รันสคริปต์', !!frame && frame.hasAttribute('sandbox') &&
    !/allow-scripts|allow-same-origin/.test(frame.getAttribute('sandbox')), frame && frame.getAttribute('sandbox'));
  ok('สคริปต์และ onerror ในอีเมลไม่ทำงาน', window.PWNED === undefined, String(window.PWNED));
  ok('เนื้อหาอีเมลยังแสดง', !!frame && frame.srcdoc.indexOf('สวัสดีครับ') !== -1);
  ok('หัวอีเมลแสดงผู้ส่งและไฟล์แนบ', txt('mailReader').indexOf('Pioneer DJ Thailand') !== -1 && txt('mailReader').indexOf('quote.pdf') !== -1);
  ok('เปิดแล้วนับว่าอ่านแล้ว ตัวเลขบนเมนูลดเหลือ 2', txt('navBadge-mail') === '2', txt('navBadge-mail'));

  ok('ปุ่มป้าย: BOYZ ติดอยู่ · ส่งซ่อมยังไม่ติด · Mahajak Cop กดไม่ได้เพราะยังไม่มีใน Gmail',
    document.querySelector('.lbl-toggle[data-label="BOYZ"]').getAttribute('aria-pressed') === 'true' &&
    document.querySelector('.lbl-toggle[data-label="ส่งซ่อม"]').getAttribute('aria-pressed') === 'false' &&
    document.querySelector('.lbl-toggle[data-label="Mahajak Cop"]').disabled);
  CALLS.length = 0;
  document.getElementById('mrStarBtn').click();
  await sleep(100);
  const st = fns('mail', 'star')[0];
  ok('ติดดาว: เรียกฟังก์ชัน star พร้อมกล่องที่เปิดอยู่', !!st && st.body.on === true && st.body.uid === 902 && st.body.box === 'inbox', JSON.stringify(st && st.body));
  ok('ติดดาวแล้วปุ่มเปลี่ยนเป็น "เอาดาวออก"', document.getElementById('mrStarBtn').getAttribute('aria-pressed') === 'true' &&
    txt('mrStarBtn').indexOf('เอาดาวออก') !== -1 && mailState.counts.starred.total === 6, txt('mrStarBtn'));
  CALLS.length = 0;
  document.querySelector('.lbl-toggle[data-label="ส่งซ่อม"]').click();
  await sleep(100);
  const lb = fns('mail', 'label')[0];
  ok('ติดป้าย ส่งซ่อม: เรียกฟังก์ชัน label on=true', !!lb && lb.body.label === 'ส่งซ่อม' && lb.body.on === true && lb.body.uid === 902, JSON.stringify(lb && lb.body));
  ok('ปุ่มป้ายส่งซ่อมเปลี่ยนเป็นติดอยู่', document.querySelector('.lbl-toggle[data-label="ส่งซ่อม"]').getAttribute('aria-pressed') === 'true');
  CALLS.length = 0;
  document.querySelector('.lbl-toggle[data-label="BOYZ"]').click();
  await sleep(100);
  ok('เอาป้าย BOYZ ออก: on=false', (fns('mail', 'label')[0] || { body: {} }).body.on === false);
  CALLS.length = 0;
  replyMail();
  ok('ตอบกลับเติมผู้รับและ Re: ให้', document.getElementById('mcTo').value === 'dealer@example.com' &&
    document.getElementById('mcSubject').value === 'Re: ใบเสนอราคา CDJ-3000X');
  document.getElementById('mcBody').value = 'ขอบคุณครับ' + document.getElementById('mcBody').value;
  await sendMail();
  const snd = fns('mail', 'send')[0];
  ok('ส่งผ่านฟังก์ชัน mail พร้อม In-Reply-To ของฉบับเดิม', !!snd && snd.body.to === 'dealer@example.com' && snd.body.in_reply_to === '<abc@example.com>',
    JSON.stringify(snd && snd.body));

  // แท็บป้าย
  CALLS.length = 0;
  tabs()[1].click();
  await sleep(200);
  const lsend = fns('mail', 'list')[0];
  ok('กดแท็บ "ส่งซ่อม" → โหลดรายการของป้ายนั้น', !!lsend && lsend.body.box === 'ส่งซ่อม' && lsend.body.page === 1, JSON.stringify(lsend && lsend.body));
  ok('แท็บ "ส่งซ่อม" ถูกเลือก และแสดงอีเมลในป้าย', tabs()[1].getAttribute('aria-selected') === 'true' &&
    document.querySelectorAll('#mailRows tr[data-i]').length === 1 && txt('mailRows').indexOf('DJM-S11') !== -1, txt('mailRows'));
  CALLS.length = 0;
  document.getElementById('tw-mail').focus();
  key('ArrowDown', 'ArrowDown'); key('Enter', 'Enter');
  await sleep(300);
  ok('เปิดอีเมลในป้าย ส่ง box ของป้ายไปด้วย (UID ของแต่ละโฟลเดอร์ไม่เหมือนกัน)', (fns('mail', 'get')[0] || { body: {} }).body.box === 'ส่งซ่อม');
  ok('ในแท็บป้ายไม่มีปุ่มเก็บเข้าคลัง (ใน Gmail นั่นคือเอาป้ายออก)', txt('mailReader').indexOf('เก็บเข้าคลัง') === -1);
  tabs()[4].click();
  await sleep(200);
  ok('ป้ายที่ยังไม่มี: ขึ้น "ยังไม่มีป้ายนี้ใน Gmail" พร้อมวิธีสร้าง', vis('mailNoLabel') && txt('mailNoLabel').indexOf('ยังไม่มีป้ายนี้ใน Gmail') !== -1 &&
    txt('mailNoLabel').indexOf('Mahajak Cop') !== -1, txt('mailNoLabel'));
  ok('ป้ายที่ยังไม่มี: ไม่ใช่แถบ error สีแดง และไม่ล้มทั้งหน้า', !document.querySelector('#mailNote .alert-red') && !document.getElementById('fatalError') &&
    !vis('tw-mail') && vis('mailTabs'));
  tabs()[0].click();
  await sleep(200);
  ok('กลับแท็บกล่องจดหมายได้ตามปกติ', vis('tw-mail') && !vis('mailNoLabel') && document.querySelectorAll('#mailRows tr[data-i]').length === 2);

  // ยังไม่ได้ตั้งค่า (ไม่มี secret หรือยังไม่ได้ติดตั้งฟังก์ชัน)
  window.FN.mail = () => ({ error: { code: 'not_configured', message: 'ยังไม่ได้ตั้งค่ากล่องจดหมายร้าน' } });
  await loadMailList();
  ok('ฟังก์ชันตอบ not_configured → ขึ้นหน้าบอกวิธีตั้งค่า', vis('mailSetup') && !vis('mailMain') &&
    txt('mailSetup').indexOf('ยังไม่ได้เชื่อมกล่องจดหมาย') !== -1 && txt('mailSetup').indexOf('GMAIL_APP_PASSWORD') !== -1, txt('mailSetup'));
  ok('ยังไม่ได้เชื่อม: ไอคอนอีเมลบนหน้าแรกไม่มีตัวเลขค้าง', !document.querySelector('#launcher .lt[data-key="mail"] .badge'));
  ok('ไม่มีตัวเลขค้างบนเมนูกล่องจดหมาย', document.getElementById('navBadge-mail').hidden);
  window.FN.mail = () => ({ error: { code: 'auth_failed', message: 'Gmail ไม่รับรหัสผ่านสำหรับแอป' } });
  await loadMailList();
  ok('ข้อผิดพลาดอื่นแสดงเป็นแถบแดงพร้อมเหตุผล', vis('mailMain') && txt('mailNote').indexOf('Gmail ไม่รับรหัสผ่านสำหรับแอป') !== -1, txt('mailNote'));

  // ── 5. ย้อนกลับระหว่างหมวดใหม่ ──────────────────────────────────────────
  showSection('board');
  showSection('calendar');
  document.getElementById('backBtn').click();
  await sleep(150);
  ok('ปุ่มย้อนกลับจาก #calendar กลับไป #board', current === 'board' && location.hash === '#board', current + ' ' + location.hash);
  key('ArrowLeft', 'ArrowLeft', { altKey: true });
  await sleep(150);
  ok('Alt+← ย้อนต่ออีกหนึ่งหมวด (#mail)', current === 'mail' && location.hash === '#mail', current + ' ' + location.hash);
  key('KeyH', 'h', { altKey: true });
  ok('Alt+H กลับหน้าแรก', current === 'home' && location.hash === '#home', current);
  key('Digit1', '1', { altKey: true });
  ok('Alt+1 ยังเป็นหมวดสินค้าเหมือนเดิม', current === 'products', current);
  ok('หน้าคีย์ลัด (?) บอกคีย์ของหมวดใหม่', txt('helpDialog').indexOf('หน้าแรก') !== -1 && txt('helpDialog').indexOf('ปฏิทิน') !== -1);

  L('=== สรุป: ' + pass + ' PASS / ' + fail + ' FAIL ===');
  L(fail ? 'RESULT:FAIL' : 'RESULT:PASS');
}
</script>`;

// ตัวถ่ายภาพหน้าจอ import MOCK ไปใช้ได้โดยไม่รันเทสต์ทั้งชุด
if (process.argv[1] === fileURLToPath(import.meta.url)) {
const res = runPage({ root, file: 'desk.html', mock: MOCK, tests: TESTS });

// ── เปิดหน้าใหม่พร้อม hash ────────────────────────────────────────────────
function loadWith(hash, userId, body) {
  const mock = MOCK.replace('let SESSION = null', "let SESSION = { user: { id: '" + userId + "' } }");
  const tests = `<script>
window.addEventListener('load', () => setTimeout(runTests, 700));
${HARNESS}
async function runTests() {
  L('=== เปิดหน้าด้วย ${hash} (${userId === 'u1' ? 'เจ้าของร้าน' : 'พนักงาน'}) ===');
  ${body}
  L('=== สรุป: ' + pass + ' PASS / ' + fail + ' FAIL ===');
  L(fail ? 'RESULT:FAIL' : 'RESULT:PASS');
}
</script>`;
  return runPage({ root, file: 'desk.html', mock, tests, hash });
}

const onMail = loadWith('#mail', 'u2', `
  ok('เปิดหน้าด้วย #mail แล้วเข้ากล่องจดหมายทันที', current === 'mail' && !document.getElementById('sec-mail').hidden, current);
  ok('โหลดรายการอีเมลเอง', document.querySelectorAll('#mailRows tr[data-i]').length === 2);
  ok('เปิดหมวดอื่นตรงจาก URL ก็ยังได้แจ้งว่ามีข้อความค้าง', document.getElementById('toast').textContent.indexOf('ยังไม่ได้อ่าน 2 ข้อความ') !== -1,
    document.getElementById('toast').textContent);`);

const ownerCal = loadWith('#calendar', 'u1', `
  ok('เจ้าของร้านเปิด #calendar ได้ตรง', current === 'calendar', current);
  ok('เจ้าของร้านเห็นปุ่มตั้งค่า Google Calendar', !document.getElementById('gcalSetupBtn').hidden);
  ok('เจ้าของร้านเห็นปุ่มแก้/ลบข้อความของคนอื่น', (openBoardMsg('m4'), !!document.getElementById('bdEditBtn')));
  CALLS.length = 0;
  await openGcalSettings();
  document.getElementById('gsUrl').value = 'https://example.com/evil.ics';
  await saveGcalSettings();
  ok('ที่อยู่ที่ไม่ใช่ของ Google ถูกปฏิเสธตั้งแต่หน้าเว็บ', !CALLS.some(c => c.op === 'update'), document.getElementById('toast').textContent);
  document.getElementById('gsUrl').value = 'https://calendar.google.com/calendar/ical/shop%40gmail.com/private-abc/basic.ics';
  ok('หน้าตั้งค่ามีสีชุดของ Google ให้เลือก 11 สี พร้อมชื่อ', document.querySelectorAll('#gsSwatches .swatch').length === 11 &&
    document.getElementById('gsSwatches').textContent.indexOf('Peacock') !== -1);
  document.querySelector('#gsSwatches .swatch[data-hex="#8E24AA"]').click();
  ok('เลือกสีแล้วปุ่มนั้นถูกกดค้าง', document.querySelector('#gsSwatches .swatch[data-hex="#8E24AA"]').getAttribute('aria-pressed') === 'true');
  await saveGcalSettings();
  const up = CALLS.find(c => c.op === 'update' && c.table === 'staff_settings');
  ok('บันทึกที่อยู่ลงแถวตั้งค่าแถวเดียว (id = true)', !!up && up.payload.gcal_ics_url.indexOf('https://calendar.google.com/calendar/ical/') === 0 &&
    up.where && up.where[0][0] === 'id' && up.where[0][1] === true, JSON.stringify(up && { p: up.payload, w: up.where }));
  ok('บันทึกสีที่เลือกลง gcal_color (025)', !!up && up.payload.gcal_color === '#8E24AA', up && up.payload.gcal_color);`);

const reduced = runPage({ root, file: 'desk.html', flags: ['--force-prefers-reduced-motion'],
  mock: MOCK.replace('let SESSION = null', "let SESSION = { user: { id: 'u2' } }"),
  tests: `<script>
window.addEventListener('load', () => setTimeout(runTests, 700));
${HARNESS}
async function runTests() {
  L('=== ผู้ใช้ตั้ง "ลดการเคลื่อนไหว" (prefers-reduced-motion) ===');
  ok('เบราว์เซอร์รายงานว่าลดการเคลื่อนไหวจริง', matchMedia('(prefers-reduced-motion: reduce)').matches);
  bkkNow = () => ({ h: 14, m: 30, s: 5 });
  renderHome();
  const lts = [...document.querySelectorAll('#launcher .lt')];
  ok('ไอคอนลัดไม่มีแอนิเมชันเลื่อน/เด้ง', lts.length === 4 && lts.every(el => getComputedStyle(el).transitionDuration === '0s' &&
    getComputedStyle(el.querySelector('svg')).transitionDuration === '0s'));
  ok('สถานะร้านยังบอกด้วยข้อความครบ', document.getElementById('shopStateText').textContent === 'ร้านเปิดอยู่');
  ok('หน้าแรกไม่มีแอนิเมชันค้างอยู่เลย', document.getAnimations().length === 0, document.getAnimations().length);
  L('=== สรุป: ' + pass + ' PASS / ' + fail + ' FAIL ===');
  L(fail ? 'RESULT:FAIL' : 'RESULT:PASS');
}
</script>`, hash: '#home' });

process.exit(res.ok && onMail.ok && ownerCal.ok && reduced.ok ? 0 : 1);
}
