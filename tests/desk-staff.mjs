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
    if (body.action === 'status') return { unseen: 3 };
    if (body.action === 'list') return { page: 1, page_size: 25, total: 2, unseen: 3, messages: [
      { uid: 902, seen: false, date: TODAY + 'T09:15:00+07:00', from: { name: 'Pioneer DJ Thailand', address: 'dealer@example.com' }, subject: 'ใบเสนอราคา CDJ-3000X' },
      { uid: 901, seen: true, date: '2026-09-29T16:40:00+07:00', from: { name: '', address: 'customer@example.com' }, subject: 'สอบถามคอร์สเรียน' },
    ] };
    if (body.action === 'get') return { message: {
      uid: body.uid, seen: true, date: TODAY + 'T09:15:00+07:00', subject: 'ใบเสนอราคา CDJ-3000X',
      from: { name: 'Pioneer DJ Thailand', address: 'dealer@example.com' }, to: [{ address: 'djlabsiam@gmail.com' }], cc: [], reply_to: [],
      message_id: '<abc@example.com>', references: '', text: 'สวัสดีครับ แนบใบเสนอราคา',
      html: '<p><b>สวัสดีครับ</b> แนบใบเสนอราคา</p><script>parent.PWNED = "script";<\\/script>' +
            '<img src="does-not-exist.png" onerror="parent.PWNED = \\'onerror\\'">',
      attachments: [{ filename: 'quote.pdf', mime_type: 'application/pdf', size: 1234 }], truncated: false,
    } };
    return { ok: true };
  },
  gcal: body => ({ events: [
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
  ok('เตือนเฉพาะข้อความที่ "ฉัน" ยังไม่ได้อ่าน: 2 ข้อความ', boxText.indexOf('ยังไม่ได้อ่าน 2 ข้อความ') !== -1, boxText);
  ok('รายการเตือนมีข้อความถึงทุกคน (m1) และข้อความถึงฉัน (m5)',
    boxText.indexOf('ของเข้าพรุ่งนี้ช่วงบ่าย') !== -1 && boxText.indexOf('ถึงคุณโดยตรง') !== -1, boxText);
  ok('ไม่เตือนข้อความที่ฉันเขียนเอง', boxText.indexOf('ข้อความที่ฉันเขียนเอง') === -1);
  ok('ไม่เตือนข้อความส่วนตัวที่ถึงคนอื่น', boxText.indexOf('ข้อความส่วนตัวถึงกะเย็น') === -1);
  ok('ไม่เตือนข้อความที่อ่านไปแล้ว', boxText.indexOf('อ่านไปแล้ว') === -1);
  const badge = document.getElementById('navBadge-board');
  ok('เมนูกระดานข้อความมีตัวเลข 2', !!badge && !badge.hidden && badge.textContent === '2', badge && badge.textContent);

  const clockTile = document.getElementById('tileClock');
  ok('ไทล์ตอกบัตรเข้างานกดไม่ได้', clockTile.disabled);
  ok('ไทล์ตอกบัตรบอก "เร็ว ๆ นี้ · รอปรึกษา"', clockTile.textContent.indexOf('เร็ว ๆ นี้ · รอปรึกษา') !== -1, clockTile.textContent);
  clockTile.click();
  ok('กดไทล์ตอกบัตรแล้วไม่มีอะไรเกิดขึ้น', current === 'home' && writes().length === 0);
  ok('ไม่มีหมวดตอกบัตรในเมนู', !/ตอกบัตร/.test(txt('navList')));

  ok('ไทล์กล่องจดหมายแสดงจำนวนที่ยังไม่ได้เปิด (3)', txt('tileMail').indexOf('3') !== -1, txt('tileMail'));
  ok('เมนูกล่องจดหมายมีตัวเลข 3', txt('navBadge-mail') === '3');
  ok('ไทล์ปฏิทินแสดงกิจกรรมวันนี้ทั้งของร้านและ Google',
    txt('tileCal').indexOf('คลาส Scratch 1-on-1') !== -1 && txt('tileCal').indexOf('ประชุมกับตัวแทน Pioneer') !== -1, txt('tileCal'));
  ok('ไทล์ปฏิทินนับการจองห้องวันนี้', txt('tileCal').indexOf('จองห้องซ้อมวันนี้ 1 รายการ') !== -1, txt('tileCal'));

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
  document.getElementById('layerRooms').click();
  ok('เปิดชั้นการจองห้องแล้วเห็นการจอง', chip('room').some(b => b.textContent.indexOf('ลูกค้าซ้อมบ่าย') !== -1));
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

  CALLS.length = 0;
  replyMail();
  ok('ตอบกลับเติมผู้รับและ Re: ให้', document.getElementById('mcTo').value === 'dealer@example.com' &&
    document.getElementById('mcSubject').value === 'Re: ใบเสนอราคา CDJ-3000X');
  document.getElementById('mcBody').value = 'ขอบคุณครับ' + document.getElementById('mcBody').value;
  await sendMail();
  const snd = fns('mail', 'send')[0];
  ok('ส่งผ่านฟังก์ชัน mail พร้อม In-Reply-To ของฉบับเดิม', !!snd && snd.body.to === 'dealer@example.com' && snd.body.in_reply_to === '<abc@example.com>',
    JSON.stringify(snd && snd.body));

  // ยังไม่ได้ตั้งค่า (ไม่มี secret หรือยังไม่ได้ติดตั้งฟังก์ชัน)
  window.FN.mail = () => ({ error: { code: 'not_configured', message: 'ยังไม่ได้ตั้งค่ากล่องจดหมายร้าน' } });
  await loadMailList();
  ok('ฟังก์ชันตอบ not_configured → ขึ้นหน้าบอกวิธีตั้งค่า', vis('mailSetup') && !vis('mailMain') &&
    txt('mailSetup').indexOf('ยังไม่ได้เชื่อมกล่องจดหมาย') !== -1 && txt('mailSetup').indexOf('GMAIL_APP_PASSWORD') !== -1, txt('mailSetup'));
  ok('หน้าแรกบอกว่ายังไม่ได้เชื่อม', txt('tileMail').indexOf('ยังไม่ได้เชื่อม') !== -1, txt('tileMail'));
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
  await saveGcalSettings();
  const up = CALLS.find(c => c.op === 'update' && c.table === 'staff_settings');
  ok('บันทึกที่อยู่ลงแถวตั้งค่าแถวเดียว (id = true)', !!up && up.payload.gcal_ics_url.indexOf('https://calendar.google.com/calendar/ical/') === 0 &&
    up.where && up.where[0][0] === 'id' && up.where[0][1] === true, JSON.stringify(up && { p: up.payload, w: up.where }));`);

process.exit(res.ok && onMail.ok && ownerCal.ok ? 0 : 1);
}
