/**
 * เทสต์หมวดระยะที่ 2 ของ desk.html — จองห้อง · ลูกค้า · สรุปรายวัน · บันทึกการใช้งาน · จัดการข้อมูล
 *   รัน: node tests/desk-modules.mjs
 *
 * วิธีเดียวกับชุดอื่น: ไฟล์จริงทุกบรรทัด สลับเฉพาะแท็ก Supabase เป็นตัวปลอมที่จด
 * rpc / insert / update / delete / contains ทุกครั้งไว้ใน CALLS
 *
 * การยืนยันการจองต้อง "เขียนเหมือนหน้าจองเดิม" เพราะ trigger ในฐานข้อมูลส่ง LINE หาลูกค้า
 * จากการเขียนนั้น — ชุดนี้เทียบคอลัมน์ที่ desk.html เขียนกับค่าคงที่ OLD_CONFIRM_KEYS (ตรึงจากหน้าจองเดิมก่อนเลิกใช้)
 */

import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { runPage, HARNESS } from './lib/page-test.mjs';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');

// คอลัมน์ที่การยืนยันการจองต้องเขียน (เรียงตามตัวอักษร) — เดิมอ่านจาก confirmBooking ของหน้าจองเดิม (DJ_LAB_SIAM_BookingApp.html)
// เลิกใช้หน้านั้นแล้ว (5 ต.ค. 69 · ไฟล์เหลือเป็นหน้าพาไป) จึงตรึงเป็นค่าคงที่ — ที่มาจริงคือ trigger trg_notify_booking_confirmed
// (stock-app 004: ยิง LINE หาลูกค้าเมื่อ confirmed เปลี่ยน false → true) · confirmed_by/confirmed_at คือร่องรอยว่าใครยืนยันเมื่อไหร่
// ⚠️ ถ้าเปลี่ยนคอลัมน์ที่เขียนตอนยืนยัน ต้องแก้ทั้ง desk.html และค่าคงที่นี้ และตรวจ trigger ในฐานข้อมูลด้วย
const OLD_CONFIRM_KEYS = ['confirmed', 'confirmed_at', 'confirmed_by'];

const MOCK = `<script>
const CALLS = [];
const TODAY = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Bangkok' });
const FAKE = {
  admins: [
    { id: 'u1', full_name: 'เจ้าของร้าน', role: 'owner', is_active: true },
    { id: 'u2', full_name: 'พนักงานหน้าร้าน', role: 'staff', is_active: true },
  ],
  products: [
    { id: 'p1', sku: 'PIO-DDJ-FLX4', name: 'DDJ-FLX4', brand: 'Pioneer DJ', category: 'คอนโทรลเลอร์',
      barcode_ean13: '619659216054', sell_price: 12900, reorder_point: 1, is_active: true },
  ],
  product_stock_levels: [{ product_id: 'p1', current_qty: 5 }],
  product_units: [], stock_movements: [], sales: [], sale_items: [],
  room_bookings: [
    { id: 'b1', customer_name: 'ลูกค้า LINE', contact: '0812345678', date: TODAY, start_time: '13:00:00', hours: 2,
      room: 'Standard (CDJ3000x + DJM-A9/V10/V5/S11/S7)', cost: 1600, status: 'upcoming', confirmed: false,
      source: 'online_line', line_user_id: 'U123', customer_id: null },
    { id: 'b2', customer_name: 'ลูกค้าเว็บ', contact: '0899999999', date: TODAY, start_time: '16:00:00', hours: 1,
      room: 'Controller Setup', cost: 800, status: 'upcoming', confirmed: false,
      source: 'online_web', line_user_id: null, customer_id: null },
    { id: 'b3', customer_name: 'ลูกค้าประจำ', contact: '0812345678', date: '2026-09-01', start_time: '12:00:00', hours: 3,
      room: 'Turntable Setup (PLX-CRSS12 + DJM-S11/S7/S5/A9)', cost: 2400, status: 'done', confirmed: true,
      source: 'staff', line_user_id: null, customer_id: null },
  ],
  booking_settings: [{ id: true, price_per_hour: 800, points_per_hour: 1, free_hour_threshold: 10, free_hours_reward: 1, room_name: 'DJ LAB SIAM' }],
  customers: [
    { id: 'c1', full_name: 'ลูกค้าประจำ', phone: '812345678', line_id: null, email: null, note: null, tags: ['ลูกค้าประจำ'],
      created_at: '2026-09-01T10:00:00Z', created_by: 'u1', admins: { full_name: 'เจ้าของร้าน' } },
  ],
  members: [],
  loyalty_points_ledger: [],
  v_daily_income: [
    { occurred_at: TODAY + 'T03:00:00Z', source: 'ขายสินค้า', detail: 'S-0001', amount: 590, payment_method: 'เงินสด', kind: 'sale', ref_id: 's1' },
    { occurred_at: TODAY + 'T06:00:00Z', source: 'ค่าเช่าห้องซ้อม', detail: 'ลูกค้าประจำ', amount: 1600, payment_method: null, kind: 'booking', ref_id: 'b9' },
    { occurred_at: TODAY + 'T07:00:00Z', source: 'สมัครเรียน', detail: 'คอร์สไทย', amount: 500, payment_method: 'โอน', kind: 'manual', ref_id: 'i1' },
  ],
  expenses: [{ id: 'e1', spent_on: TODAY, seq: 1, description: 'ค่าน้ำแข็ง', amount: 200, receipt_path: null }],
  income_entries: [],
  activity_log: [
    { id: 'a1', action: 'UPDATE', table_name: 'products', record_id: 'p1', created_at: '2026-09-29T10:00:00Z', admin_id: 'u1',
      old_data: { name: 'DDJ-FLX4', sell_price: 12500 }, new_data: { name: 'DDJ-FLX4', sell_price: 12900 }, admins: { full_name: 'เจ้าของร้าน' } },
    { id: 'a2', action: 'DELETE', table_name: 'customers', record_id: 'c9', created_at: '2026-09-28T10:00:00Z', admin_id: null,
      old_data: { full_name: 'ลูกค้าเก่า' }, new_data: null, admins: null },
  ],
};
const COLS = {
  products: [['id','uuid',false,true],['sku','text',false,false],['name','text',false,false],['brand','text',false,false],
             ['sell_price','numeric',false,true],['is_active','boolean',false,true],['created_at','timestamp with time zone',false,true]],
  sales: [['id','uuid',false,true],['sale_no','text',false,false],['total','numeric',false,true],['status','USER-DEFINED',false,true],
          ['created_at','timestamp with time zone',false,true]],
};
FAKE.sales.push({ id: 's1', sale_no: 'S-0001', total: 590, status: 'completed', created_at: '2026-09-20T10:00:00Z', customer_id: 'c9' });
function builder(table) {
  const q = {
    _rows: (FAKE[table] || []).slice(), _head: false,
    select(c, o) { if (o && o.head) q._head = true; return q; },
    eq(col, val) { q._rows = q._rows.filter(r => r[col] === val); return q; },
    is(col, val) { q._rows = q._rows.filter(r => r[col] === val); return q; },
    contains(col, val) { CALLS.push({ op: 'contains', table, col, val }); return q; },
    order() { return q; }, gte() { return q; }, lt() { return q; }, lte() { return q; }, limit() { return q; },
    range() { return q; }, or() { return q; }, ilike() { return q; }, in() { return q; },
    async maybeSingle() { return { data: q._rows[0] || null, error: null }; },
    async single() { return { data: q._rows[0] || null, error: null }; },
    then(res, rej) { return Promise.resolve({ data: q._head ? null : q._rows, error: null, count: q._rows.length }).then(res, rej); },
    insert(payload) { CALLS.push({ op: 'insert', table, payload }); q._rows = [Object.assign({ id: 'new-' + CALLS.length }, payload)]; return q; },
    // RLS_BLOCK = ตารางที่ฐานข้อมูลปฏิเสธ "เงียบ ๆ": ไม่มี error แต่ไม่แก้/ไม่ลบอะไร (ขอแถวกลับมาได้ 0 แถว) — จำลองสิทธิ์ที่หายไปกลางทาง
    update(payload) { CALLS.push({ op: 'update', table, payload, q }); if (window.RLS_BLOCK && window.RLS_BLOCK.has(table)) q._rows = []; return q; },
    upsert(payload) { CALLS.push({ op: 'upsert', table, payload }); return q; },
    delete() { CALLS.push({ op: 'delete', table }); if (window.RLS_BLOCK && window.RLS_BLOCK.has(table)) q._rows = []; return q; },
  };
  const eq0 = q.eq;
  q.eq = (col, val) => { const last = CALLS[CALLS.length - 1]; if (last && last.q === q) last.where = { col, val }; return eq0(col, val); };
  return q;
}
let SESSION = null, authCb = null;
window.supabase = {
  createClient: () => ({
    from: builder,
    rpc: async (fn, args) => {
      CALLS.push({ op: 'rpc', fn, args });
      if (fn === 'admin_table_columns') {
        return { data: (COLS[args.p_table] || []).map(c => ({ column_name: c[0], data_type: c[1], is_nullable: c[2], has_default: c[3] })), error: null };
      }
      return { data: null, error: null };
    },
    channel: () => ({ on() { return this; }, subscribe() { return this; } }),
    storage: { from: () => ({
      async upload() { CALLS.push({ op: 'upload' }); return { error: null }; },
      async remove() { return { error: null }; },
      async createSignedUrl() { return { data: { signedUrl: 'data:,' }, error: null }; },
    }) },
    auth: {
      async getSession() { return { data: { session: SESSION } }; },
      async getUser() { return { data: { user: SESSION && SESSION.user } }; },
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
const OLD_CONFIRM_KEYS = ${JSON.stringify(OLD_CONFIRM_KEYS)};
const sleep = ms => new Promise(r => setTimeout(r, ms));
function key(code, k, mods) {
  clock += 5000;
  const ev = new KeyboardEvent('keydown', Object.assign({ code, key: k, bubbles: true, cancelable: true }, mods || {}));
  (document.activeElement || document).dispatchEvent(ev);
  return ev;
}
const txt = id => document.getElementById(id).textContent;
const writes = () => CALLS.filter(c => c.op === 'insert' || c.op === 'update' || c.op === 'delete' || c.op === 'upsert');
async function login(email) {
  document.getElementById('loginEmail').value = email;
  document.getElementById('loginPassword').value = 'x';
  await doLogin();
  await sleep(400);
}

async function runTests() {
  L('=== คอนโซลร้าน desk.html · หมวดระยะที่ 2 ===');
  await login('owner@djlabsiam.com');
  ok('ล็อกอินเจ้าของร้านแล้วเข้าได้', document.getElementById('loginOverlay').style.display === 'none');
  ok('ไม่มีป้าย "เร็ว ๆ นี้" เหลือในเมนู', txt('navList').indexOf('เร็ว ๆ นี้') === -1);

  // ── 1. จองห้องซ้อม ────────────────────────────────────────────────────
  key('Digit6', '6', { altKey: true });
  ok('Alt+6 ไปหมวดจองห้องซ้อม', current === 'booking' && !document.getElementById('sec-booking').hidden, current);
  ok('ไทม์ไลน์วันนี้แสดงการจองของวันนี้ 2 รายการ', document.querySelectorAll('#bkTimeline .tl-block').length === 2,
    document.querySelectorAll('#bkTimeline .tl-block').length);
  ok('ตารางการจองแสดงครบ 3 รายการ', document.querySelectorAll('#bookingRows tr[data-i]').length === 3);
  ok('นับรอยืนยันได้ 2', txt('bkStatPending') === '2', txt('bkStatPending'));

  openBooking('b1');
  ok('การจองผ่าน LINE ขึ้นแถบเขียว "ส่งข้อความทาง LINE อัตโนมัติ"',
    txt('detailBody').indexOf('ส่งข้อความแจ้งลูกค้าทาง LINE อัตโนมัติ') !== -1);
  openBooking('b2');
  ok('การจองที่ไม่มี LINE userId ขึ้นแถบเหลือง "ไม่มีช่องทาง LINE"',
    txt('detailBody').indexOf('ไม่มีช่องทาง LINE') !== -1);
  openBooking('b1');
  CALLS.length = 0;
  document.getElementById('bkConfirmBtn').click();
  await sleep(200);
  const up = CALLS.find(c => c.op === 'update' && c.table === 'room_bookings');
  ok('ยืนยันการจองเขียน room_bookings.update ตรงแถว', !!up && up.where && up.where.col === 'id' && up.where.val === 'b1',
    JSON.stringify(up && { payload: up.payload, where: up.where }));
  ok('คอลัมน์ที่เขียนตอนยืนยัน = หน้าจองเดิมเป๊ะ (' + OLD_CONFIRM_KEYS.join(', ') + ')',
    !!up && JSON.stringify(Object.keys(up.payload).sort()) === JSON.stringify(OLD_CONFIRM_KEYS), up && Object.keys(up.payload).join(','));
  ok('ค่า confirmed = true และ confirmed_by = ผู้ที่ล็อกอิน', !!up && up.payload.confirmed === true && up.payload.confirmed_by === 'u1');
  ok('ไม่มีการเขียนอย่างอื่นพ่วงไปกับการยืนยัน', writes().length === 1, JSON.stringify(writes().map(c => c.table + ':' + c.op)));

  CALLS.length = 0;
  openBookingForm();
  document.getElementById('bookName').value = 'ลูกค้าหน้าร้าน';
  document.getElementById('bookContact').value = '0811111111';
  document.getElementById('bookHours').value = '3';
  await submitBooking();
  const ins = CALLS.find(c => c.op === 'insert' && c.table === 'room_bookings');
  ok('จองใหม่จากคอนโซลเป็นแบบเดียวกับหน้าเดิม (staff, ยืนยันแล้ว, ราคาตามตั้งค่า)',
    !!ins && ins.payload.source === 'staff' && ins.payload.confirmed === true && ins.payload.cost === 2400 &&
    ins.payload.status === 'upcoming' && ins.payload.created_by === 'u1', JSON.stringify(ins && ins.payload));

  document.getElementById('tw-bookings').focus();
  const before = bkDate;
  key('ArrowRight', 'ArrowRight');
  ok('→ เลื่อนไทม์ไลน์ไปวันถัดไป', bkDate !== before && bkDate > before, before + ' → ' + bkDate);
  key('ArrowLeft', 'ArrowLeft');

  // ก้อนสั้นบนไทม์ไลน์ต้องยังอ่านได้: ข้อความเต็มใน title และบรรทัดแรกคือเวลา
  const blk = [...document.querySelectorAll('#bkTimeline .tl-block')].find(b => (b.title || '').indexOf('ลูกค้า LINE') !== -1);
  ok('ก้อนการจองมี title ครบทั้งชื่อและช่วงเวลา', !!blk && blk.title.indexOf('13:00–15:00') !== -1 && blk.title.indexOf('รอยืนยัน') !== -1,
    blk && blk.title);
  ok('บรรทัดแรกของก้อนคือเวลาเริ่ม (อย่างน้อยต้องเห็นเวลา)', !!blk && blk.querySelector('.tl-time').textContent.indexOf('13:00') === 0);
  ok('ข้อความในก้อนตัดท้ายด้วย … ไม่ตัดกลางตัวอักษร', !!blk &&
    [...blk.children].every(sp => getComputedStyle(sp).textOverflow === 'ellipsis' && getComputedStyle(sp).whiteSpace === 'nowrap'));

  // ── ย้อนกลับระหว่างหมวด ────────────────────────────────────────────────
  showSection('products');
  showSection('booking');
  ok('เปลี่ยนหมวดแล้ว URL เป็น #booking', location.hash === '#booking', location.hash);
  ok('มีหมวดก่อนหน้า ปุ่มย้อนกลับกดได้', !document.getElementById('backBtn').disabled);
  document.getElementById('backBtn').click();
  await sleep(150);
  ok('ปุ่ม ← ย้อนกลับ พากลับไปหมวดก่อนหน้า', current === 'products' && location.hash === '#stock', current + ' ' + location.hash);
  key('ArrowRight', 'ArrowRight', { altKey: true });
  await sleep(150);
  ok('Alt+→ ไปข้างหน้ากลับมาหมวดจองห้อง', current === 'booking', current);
  document.getElementById('tw-bookings').focus();
  const dayBefore = bkDate;
  const altLeft = key('ArrowLeft', 'ArrowLeft', { altKey: true });
  await sleep(150);
  ok('Alt+← ในหมวดจองห้องพากลับหมวดก่อนหน้า', current === 'products', current);
  ok('Alt+← ไม่ไปเลื่อนวันที่ของไทม์ไลน์', bkDate === dayBefore, dayBefore + ' → ' + bkDate);
  ok('Alt+← ถูกกันไม่ให้เบราว์เซอร์ย้อนซ้ำอีกรอบ', altLeft.defaultPrevented);
  showSection('booking');

  // ── 2. ลูกค้า ──────────────────────────────────────────────────────────
  ok('เบอร์ 9 หลักขึ้นต้น 8 เติม 0 กลับ', normalizeThaiPhone('812345678') === '0812345678', normalizeThaiPhone('812345678'));
  ok('เบอร์ 9 หลักขึ้นต้น 6 เติม 0 กลับ', normalizeThaiPhone('612345678') === '0612345678');
  ok('เบอร์ 9 หลักขึ้นต้น 9 เติม 0 กลับ', normalizeThaiPhone('912345678') === '0912345678');
  ok('+66 แปลงเป็น 0', normalizeThaiPhone('+66 81 234 5678') === '0812345678', normalizeThaiPhone('+66 81 234 5678'));
  ok('เบอร์บ้าน 9 หลัก (ขึ้นต้น 0) ไม่ถูกแตะ', normalizeThaiPhone('021234567') === '021234567');

  showSection('customers');
  ok('ตารางลูกค้าแสดงจากฐานข้อมูล', document.querySelectorAll('#customerRows tr[data-i]').length === 1);
  CALLS.length = 0;
  await openCustomer('c1');
  const look = CALLS.find(c => c.op === 'contains' && c.table === 'members');
  ok('เช็คสมาชิกด้วยเบอร์ที่เติม 0 แล้ว', !!look && look.val[0] === '0812345678', JSON.stringify(look));
  ok('รายละเอียดลูกค้าแสดงชั่วโมงสะสมจากการจองที่เบอร์ตรงกัน', txt('detailBody').indexOf('3 ชม.') !== -1);
  ok('เจ้าของร้านเห็นปุ่มลบลูกค้า', /ลบลูกค้า/.test(txt('detailBody')));
  ok('ทะเบียนสมาชิกไม่มีปุ่มแก้ไข (อ่านอย่างเดียว)',
    ![...document.querySelectorAll('#sec-customers .card button')].some(b => /แก้ไข|บันทึก/.test(b.textContent)));

  CALLS.length = 0;
  showSection('pos');
  openCustomerForm(null, true);
  document.getElementById('cfName').value = 'ลูกค้าใหม่หน้าเคาน์เตอร์';
  document.getElementById('cfPhone').value = '0822222222';
  await saveCustomer();
  await sleep(100);
  const ci = CALLS.find(c => c.op === 'insert' && c.table === 'customers');
  ok('เพิ่มลูกค้าใหม่จากหน้าขาย บันทึกพร้อม created_by', !!ci && ci.payload.created_by === 'u1' && ci.payload.full_name === 'ลูกค้าใหม่หน้าเคาน์เตอร์');
  ok('ลูกค้าที่เพิ่งเพิ่มถูกเลือกในบิลทันที', !!selectedCustomer && selectedCustomer.full_name === 'ลูกค้าใหม่หน้าเคาน์เตอร์');

  // ── 3. สรุปรายวัน ─────────────────────────────────────────────────────
  showSection('daily');
  await sleep(200);
  ok('รายรับรวมจาก v_daily_income = 2,690.00', txt('sumIncome') === formatMoney(2690), txt('sumIncome'));
  ok('รายจ่ายรวม = 200.00', txt('sumExpense') === formatMoney(200), txt('sumExpense'));
  ok('คงเหลือสุทธิ = 2,490.00', txt('sumNet') === formatMoney(2490), txt('sumNet'));
  ok('แยกตามวิธีชำระ: ไม่ระบุ 1,600 (ค่าห้อง)', txt('paymentBreakdown').indexOf('ไม่ระบุ' + formatMoney(1600)) !== -1, txt('paymentBreakdown'));
  const incomeBtns = [...document.querySelectorAll('#incomeTableBody button')].map(b => b.textContent);
  ok('แก้/ลบได้เฉพาะรายรับที่กรอกมือ (1 แถว)', incomeBtns.length === 2, incomeBtns.join('|'));

  // ── 4. บันทึกการใช้งาน ────────────────────────────────────────────────
  key('Digit9', '9', { altKey: true });
  await sleep(200);
  ok('เจ้าของร้านเปิดบันทึกการใช้งานได้ (Alt+9)', current === 'activity', current);
  ok('แสดงบันทึก 2 รายการ', document.querySelectorAll('#activityRows tr[data-i]').length === 2);
  CALLS.length = 0;
  document.getElementById('tw-activity').focus();
  key('ArrowDown', 'ArrowDown'); key('Enter', 'Enter');
  ok('เปิดรายละเอียดแสดงค่าเดิม → ค่าใหม่', txt('detailBody').indexOf('12,500.00 บาท') !== -1 && txt('detailBody').indexOf('12,900.00 บาท') !== -1,
    txt('detailBody'));
  const actBtns = [...document.querySelectorAll('#sec-activity button, #detailBody button')].map(b => b.textContent)
    .filter(t => /แก้|ลบ|บันทึก|เพิ่ม(?!อีก)/.test(t));
  ok('หมวดบันทึกการใช้งานไม่มีปุ่มแก้/ลบ/บันทึก/เพิ่ม', actBtns.length === 0, actBtns.join('|'));
  ok('ไม่มีการเขียนฐานข้อมูลระหว่างดูบันทึก', writes().length === 0);

  // ── 5. จัดการข้อมูล ───────────────────────────────────────────────────
  key('Digit0', '0', { altKey: true });
  await sleep(200);
  ok('Alt+0 ไปหมวดจัดการข้อมูล', current === 'admin', current);
  await adSelectTable('sales');
  ok('ตารางอ่านอย่างเดียวไม่มีปุ่มเพิ่มแถว', document.getElementById('adAddBtn').hidden);
  adOpenRow(adRows[0]);
  ok('ตารางอ่านอย่างเดียวไม่มีปุ่มบันทึกในแผง', !document.getElementById('adSaveBtn'));
  ok('ตารางอ่านอย่างเดียวไม่มีช่องกรอก', !document.querySelector('#adFields [data-col]'));
  CALLS.length = 0;
  await adSaveRow();
  ok('สั่งบันทึกตารางอ่านอย่างเดียวตรง ๆ ก็ถูกปฏิเสธ ไม่มีการเขียน', writes().length === 0, JSON.stringify(writes().map(c => c.table)));
  ok('บอกเหตุผลว่าดูได้อย่างเดียว', txt('toast').indexOf('ดูได้อย่างเดียว') !== -1, txt('toast'));

  await adSelectTable('products');
  adOpenRow(adRows[0]);
  document.getElementById('fld_name').value = 'DDJ-FLX4 (ใหม่)';
  CALLS.length = 0;
  await adSaveRow();
  const pu = CALLS.find(c => c.op === 'update' && c.table === 'products');
  ok('ตารางสินค้าแก้ได้ ส่ง update ไปที่ products', !!pu && pu.payload.name === 'DDJ-FLX4 (ใหม่)', JSON.stringify(pu && pu.payload));

  // ── RLS ปฏิเสธเงียบ ๆ: ฐานข้อมูลไม่ฟ้อง error แต่ไม่แก้/ไม่ลบอะไร (0 แถว) — ห้ามขึ้นสำเร็จหลอก (กฎข้อ 8) ──
  window.RLS_BLOCK = new Set(['products']);
  document.getElementById('toast').textContent = '';
  const fe0 = document.getElementById('fatalError'); if (fe0) fe0.remove();
  adOpenRow(adRows[0]);
  document.getElementById('fld_name').value = 'ชื่อที่ฐานข้อมูลจะไม่รับ';
  await adSaveRow();
  const fe1 = document.getElementById('fatalError');
  ok('บันทึกแล้วฐานข้อมูลแก้ 0 แถว (RLS ปฏิเสธเงียบ ๆ): ขึ้นแถบแดงบอกว่าไม่ได้บันทึก', !!fe1 && /ไม่ได้แก้แถวนี้/.test(fe1.textContent), fe1 && fe1.textContent);
  ok('...ไม่ขึ้น "บันทึกเรียบร้อย" และแผงยังเปิดอยู่ให้แก้ต่อ', txt('toast').indexOf('บันทึกเรียบร้อย') === -1 && !!document.getElementById('adSaveBtn'), txt('toast'));
  if (fe1) fe1.remove();
  await adSelectTable('products');
  adOpenRow(adRows[0]);
  adDeleteRow();
  await runConfirm();
  const fe2 = document.getElementById('fatalError');
  ok('ลบแล้วฐานข้อมูลลบ 0 แถว: ขึ้นแถบแดงบอกว่าไม่ได้ลบ · ไม่ขึ้น "ลบแถวเรียบร้อย"', !!fe2 && /ไม่ได้ลบแถวนี้/.test(fe2.textContent) && txt('toast').indexOf('ลบแถวเรียบร้อย') === -1, fe2 && fe2.textContent);
  if (fe2) fe2.remove();
  closeConfirm();
  window.RLS_BLOCK = null;
  adOpenRow(adRows[0]);
  adDeleteRow();
  await runConfirm();
  ok('ลบปกติ (ฐานข้อมูลลบ 1 แถว): ขึ้น "ลบแถวเรียบร้อย" · ไม่มีแถบแดง', txt('toast').indexOf('ลบแถวเรียบร้อย') !== -1 && !document.getElementById('fatalError'), txt('toast'));

  showSection('products');
  openProduct('p1');
  await sleep(100);
  ok('เจ้าของร้านเห็นปุ่มแก้ไขข้อมูลสินค้าในแผงสินค้า', /แก้ไขข้อมูลสินค้า/.test(txt('detailBody')));
  ok('เจ้าของร้านเห็นปุ่มเพิ่มสินค้าใหม่', !document.getElementById('addProductBtn').hidden);

  // ── 6. พนักงาน ────────────────────────────────────────────────────────
  await doLogout();
  await sleep(200);
  await login('staff@djlabsiam.com');
  ok('พนักงานล็อกอินได้', document.getElementById('loginOverlay').style.display === 'none');
  ok('พนักงานไม่เห็นเมนูบันทึกการใช้งาน', !document.querySelector('.nav-item[data-s="activity"]'));
  showSection('products');
  key('Digit9', '9', { altKey: true });
  ok('พนักงานกด Alt+9 แล้วไม่เข้าหมวดบันทึกการใช้งาน', current !== 'activity' && document.getElementById('sec-activity').hidden, current);
  ok('บอกเหตุผลว่าเฉพาะเจ้าของร้าน/ผู้ดูแล', txt('toast').indexOf('เฉพาะเจ้าของร้าน') !== -1, txt('toast'));
  ok('พนักงานไม่เห็นเมนูจัดการข้อมูล', !document.querySelector('.nav-item[data-s="admin"]'));
  document.getElementById('toast').textContent = '';
  key('Digit0', '0', { altKey: true });
  ok('พนักงานกด Alt+0 แล้วไม่เข้าหมวดจัดการข้อมูล และมีข้อความบอก',
    current !== 'admin' && document.getElementById('sec-admin').hidden && txt('toast').indexOf('เฉพาะเจ้าของร้าน') !== -1, current + ' / ' + txt('toast'));
  location.hash = '#admin';
  await sleep(200);
  ok('พนักงานพิมพ์ #admin เองก็ถูกส่งกลับหมวดเริ่มต้น (หน้าแรก)', current === 'home' && location.hash === '#home' &&
    document.getElementById('sec-admin').hidden, current + ' ' + location.hash);
  location.hash = '#activity';
  await sleep(200);
  ok('พนักงานพิมพ์ #activity เองก็ถูกส่งกลับหมวดเริ่มต้น (หน้าแรก)', current === 'home' && document.getElementById('sec-activity').hidden, current);
  openProduct('p1');
  await sleep(100);
  ok('พนักงานไม่เห็นปุ่มแก้ไขข้อมูลสินค้า', !/แก้ไขข้อมูลสินค้า/.test(txt('detailBody')));
  ok('พนักงานไม่เห็นปุ่มเพิ่มสินค้าใหม่', document.getElementById('addProductBtn').hidden);
  showSection('customers');
  await openCustomer('c1');
  ok('พนักงานไม่เห็นปุ่มลบลูกค้า', !/ลบลูกค้า/.test(txt('detailBody')));

  L('=== สรุป: ' + pass + ' PASS / ' + fail + ' FAIL ===');
  L(fail ? 'RESULT:FAIL' : 'RESULT:PASS');
}
</script>`;

const res = runPage({ root, file: 'desk.html', mock: MOCK, tests: TESTS });

// ── เปิดหน้าใหม่พร้อม hash: ต้องเข้าหมวดนั้นตรง ๆ (รีโหลด / บุ๊กมาร์ก / หน้าต่างแอป) ────────
function loadWith(hash, userId, body) {
  const mock = MOCK.replace('let SESSION = null', "let SESSION = { user: { id: '" + userId + "' } }");
  const tests = `<script>
window.addEventListener('load', () => setTimeout(runTests, 600));
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

const onBooking = loadWith('#booking', 'u1', `
  ok('เปิดหน้าด้วย #booking แล้วเข้าหมวดจองห้องซ้อมทันที', current === 'booking' && !document.getElementById('sec-booking').hidden, current);
  ok('หัวหน้าแสดงชื่อหมวดถูก', document.getElementById('pageTitle').textContent === 'จองห้องซ้อม');
  ok('เพิ่งเปิดหน้า ยังไม่มีอะไรให้ย้อน ปุ่มย้อนกลับกดไม่ได้', document.getElementById('backBtn').disabled);
  ok('URL ยังเป็น #booking', location.hash === '#booking', location.hash);`);

const staffAdmin = loadWith('#admin', 'u2', `
  ok('พนักงานเปิดหน้าด้วย #admin ถูกส่งไปหมวดเริ่มต้น (หน้าแรก)', current === 'home' && document.getElementById('sec-admin').hidden, current);
  ok('URL ถูกแก้เป็น #home ไม่ค้าง #admin', location.hash === '#home', location.hash);
  ok('บอกเหตุผลว่าเฉพาะเจ้าของร้าน/ผู้ดูแล', document.getElementById('toast').textContent.indexOf('เฉพาะเจ้าของร้าน') !== -1,
    document.getElementById('toast').textContent);`);

process.exit(res.ok && onBooking.ok && staffAdmin.ok ? 0 : 1);
