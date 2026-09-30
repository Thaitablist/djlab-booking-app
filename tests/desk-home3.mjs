/**
 * เทสต์หน้าแรกรอบ 3 ของ desk.html — สลับบัญชีด้วย PIN · พนักงานขายร่วม · ยอดขายของฉัน ·
 * ไอคอนลัดที่แต่ละคนเลือกเอง · แอปบนหน้าแรก + เครื่องเล่นที่ติดจอข้ามหมวด
 *   รัน: node tests/desk-home3.mjs
 *
 * ตัวปลอมของ Supabase ชุดนี้มี "เซิร์ฟเวอร์" กลาง (SERVER) ที่หลาย client ใช้ร่วมกัน:
 * refresh token ใช้ได้ครั้งเดียวแล้วหมุน (เหมือน Supabase จริง) · PIN ผิด 5 ครั้งล็อก (เหมือน 027)
 * ตรรกะจริงของ PIN อยู่ในฐานข้อมูล — ทดสอบกับ Postgres จริงแยกไว้แล้ว ตัวนี้ทดสอบฝั่งหน้าเว็บ
 * เปิด Chrome แบบตัดเน็ต (host-resolver) — iframe ของ YouTube ไม่ได้โหลดของจริง
 */

import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { runPage, HARNESS } from './lib/page-test.mjs';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');

export const MOCK = `<script>
const CALLS = [];
let CHANNELS = 0;
const TODAY = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Bangkok' });
const MONTH1 = TODAY.slice(0, 8) + '01';
const LASTMONTH = (() => { const d = new Date(TODAY + 'T12:00:00'); d.setDate(0); return d.toLocaleDateString('en-CA'); })();
const FAKE = {
  admins: [
    { id: 'u1', full_name: 'TiBass', role: 'owner', is_active: true },
    { id: 'u2', full_name: 'Zen', role: 'staff', is_active: true },
    { id: 'u3', full_name: 'Nutty', role: 'staff', is_active: true },
  ],
  products: [{ id: 'p1', sku: 'PIO-DDJ-FLX4', name: 'DDJ-FLX4', brand: 'Pioneer DJ', category: 'คอนโทรลเลอร์', barcode_ean13: '619659216054',
               sell_price: 12900, reorder_point: 1, is_active: true }],
  product_stock_levels: [{ product_id: 'p1', current_qty: 5 }],
  product_units: [], stock_movements: [], sale_items: [], customers: [], members: [], loyalty_points_ledger: [],
  booking_settings: [{ id: true, price_per_hour: 800, points_per_hour: 1, free_hour_threshold: 10, free_hours_reward: 1, room_name: 'DJ LAB SIAM' }],
  room_bookings: [
    { id: 'rb1', customer_name: 'ลูกค้ารอยืนยัน', contact: '0812345678', date: TODAY, start_time: '17:00:00', hours: 1,
      room: 'Controller Setup', cost: 800, status: 'upcoming', confirmed: false, source: 'online_line' },
  ],
  sales: [
    { id: 's9', sale_no: 'S-0009', total: 3500, subtotal: 3500, discount: 0, status: 'completed', payment_method: 'โอน', created_at: TODAY + 'T05:00:00Z',
      admin_id: 'u1', customers: null, admins: { full_name: 'TiBass' },
      sale_sellers: [{ admin_id: 'u2', role: 'addon' }, { admin_id: 'u1', role: 'primary' }] },
  ],
  // ยอดของฉัน (u1): วันนี้ 1,000 + เดือนนี้อีก 2,000 · บิลยกเลิกและบิลเดือนก่อนต้องไม่ถูกนับ
  sale_sellers: [
    { admin_id: 'u1', role: 'primary', sale_id: 'a', sales: { total: 1000, status: 'completed', created_at: TODAY + 'T06:00:00Z' } },
    { admin_id: 'u1', role: 'addon',   sale_id: 'b', sales: { total: 500,  status: 'void',      created_at: TODAY + 'T07:00:00Z' } },
    { admin_id: 'u1', role: 'addon',   sale_id: 'c', sales: { total: 2000, status: 'completed', created_at: MONTH1 + 'T06:00:00Z' } },
    { admin_id: 'u1', role: 'primary', sale_id: 'd', sales: { total: 9999, status: 'completed', created_at: LASTMONTH + 'T06:00:00Z' } },
    { admin_id: 'u2', role: 'primary', sale_id: 'e', sales: { total: 700,  status: 'completed', created_at: TODAY + 'T06:00:00Z' } },
  ],
  board_messages: [
    { id: 'm1', author_id: 'u3', refers_to: TODAY, title: 'ฝากเช็กของเข้า', body: '', pinned: false, target_admin_id: null,
      created_at: TODAY + 'T02:00:00Z', updated_at: TODAY + 'T02:00:00Z' },
  ],
  board_reads: [], calendar_events: [], staff_settings: [{ id: true, gcal_ics_url: null }],
  staff_home: [],
};

// เซิร์ฟเวอร์ปลอม: refresh token ใช้ได้ครั้งเดียว · PIN ตามกติกาของ 027
const SERVER = { seq: 0, rts: {}, pins: {}, revoked: [] };
function issue(uid) { const rt = 'rt-' + uid + '-' + (++SERVER.seq); SERVER.rts[rt] = uid; return { user: { id: uid }, access_token: 'at-' + uid + '-' + SERVER.seq, refresh_token: rt }; }
function verifyPin(uid, pin) {
  const r = SERVER.pins[uid];
  if (!r) return { ok: false, reason: 'no_pin' };
  if (r.lockedUntil && r.lockedUntil > Date.now()) return { ok: false, reason: 'locked', locked_until: new Date(r.lockedUntil).toISOString() };
  if (pin === r.pin) { r.fails = 0; r.lockedUntil = null; return { ok: true }; }
  r.fails++;
  if (r.fails >= 5) { r.fails = 0; r.lockedUntil = Date.now() + 5 * 60000; return { ok: false, reason: 'locked', locked_until: new Date(r.lockedUntil).toISOString() }; }
  return { ok: false, reason: 'wrong', attempts_left: 5 - r.fails };
}

window.FN = {
  mail: b => b.action === 'status' ? { unseen: 3, counts: { inbox: { total: 9, unseen: 3 }, 'ส่งซ่อม': { total: 2, unseen: 2 }, BOYZ: { total: 0, unseen: 0 },
    starred: { total: 1, unseen: 0 }, 'Mahajak Cop': null } } : { messages: [], total: 0, unseen: 3, counts: {} },
  gcal: () => ({ events: [] }),
};

function makeClient(opts) {
  const client = { session: null, cbs: [], isMain: !(opts && opts.auth && opts.auth.persistSession === false) };
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
      then(res, rej) { return Promise.resolve({ data: q._rows, error: null }).then(res, rej); },
      insert(payload) { CALLS.push({ op: 'insert', table, payload, q }); q._rows = [Object.assign({ id: 'new-' + CALLS.length }, payload)]; return q; },
      update(payload) { CALLS.push({ op: 'update', table, payload, q }); return q; },
      upsert(payload, o) {
        CALLS.push({ op: 'upsert', table, payload, opts: o, q });
        if (table === 'staff_home') { FAKE.staff_home = FAKE.staff_home.filter(r => r.admin_id !== payload.admin_id).concat([JSON.parse(JSON.stringify(payload))]); }
        q._rows = [payload];
        return q;
      },
      delete() { CALLS.push({ op: 'delete', table, q }); return q; },
    };
    return q;
  }
  const uid = () => client.session && client.session.user.id;
  const fire = (ev) => client.cbs.forEach(cb => setTimeout(() => cb(ev, client.session)));
  Object.assign(client, {
    from: builder,
    async rpc(fn, args) {
      CALLS.push({ op: 'rpc', fn, args, who: uid(), main: client.isMain });
      if (fn === 'verify_my_pin') return { data: verifyPin(uid(), args.p_pin), error: null };
      if (fn === 'my_pin_status') return { data: !!SERVER.pins[uid()], error: null };
      if (fn === 'set_my_pin') { SERVER.pins[uid()] = { pin: args.p_pin, fails: 0, lockedUntil: null }; return { data: null, error: null }; }
      if (fn === 'create_sale') {
        FAKE.sales.unshift({ id: 's-new', sale_no: 'S-0010', total: 12900, status: 'completed', created_at: new Date().toISOString(),
          customers: null, admins: { full_name: 'TiBass' }, sale_sellers: [] });
        return { data: 's-new', error: null };
      }
      return { data: null, error: null };
    },
    functions: { async invoke(name, o) { CALLS.push({ op: 'fn', name, body: o.body }); return { data: window.FN[name](o.body), error: null }; } },
    channel() { CHANNELS++; return { on() { return this; }, subscribe() { return this; } }; },
    removeChannel() { CHANNELS--; },
    auth: {
      async getSession() { return { data: { session: client.session } }; },
      onAuthStateChange(cb) { client.cbs.push(cb); },
      async signInWithPassword({ email }) {
        const u = FAKE.admins.find(a => email.toLowerCase().startsWith(a.full_name.toLowerCase()));
        if (!u) return { data: {}, error: { message: 'Invalid login credentials', code: 'invalid_credentials' } };
        client.session = issue(u.id);
        fire('SIGNED_IN');
        return { data: { session: client.session }, error: null };
      },
      async refreshSession({ refresh_token }) {
        CALLS.push({ op: 'refresh', rt: refresh_token, main: client.isMain });
        const u = SERVER.rts[refresh_token];
        if (!u) return { data: { session: null }, error: { message: 'Invalid Refresh Token: Already Used' } };
        delete SERVER.rts[refresh_token];                        // ใช้แล้วใช้ซ้ำไม่ได้
        client.session = issue(u);
        return { data: { session: client.session }, error: null };
      },
      async setSession({ access_token, refresh_token }) {
        CALLS.push({ op: 'setSession', rt: refresh_token, main: client.isMain });
        if (!SERVER.rts[refresh_token]) return { data: {}, error: { message: 'invalid session' } };
        client.session = { user: { id: SERVER.rts[refresh_token] }, access_token, refresh_token };
        fire('SIGNED_IN');
        return { data: { session: client.session }, error: null };
      },
      async signOut(o) {
        CALLS.push({ op: 'signOut', scope: o && o.scope, who: uid(), main: client.isMain });
        if (client.session) { SERVER.revoked.push(uid()); delete SERVER.rts[client.session.refresh_token]; }
        client.session = null;
        fire('SIGNED_OUT');
        return { error: null };
      },
    },
  });
  return client;
}
window.supabase = { createClient: (u, k, o) => makeClient(o) };
</script>`;

const TESTS = `<script>
window.addEventListener('load', () => setTimeout(runTests, 300));
${HARNESS}
const sleep = ms => new Promise(r => setTimeout(r, ms));
const txt = id => document.getElementById(id).textContent;
const vis = id => !document.getElementById(id).hidden;
const rpcs = fn => CALLS.filter(c => c.op === 'rpc' && c.fn === fn);
const accounts = () => JSON.parse(localStorage.getItem('djlab.desk.accounts.v1') || '[]');
async function passwordLogin(name) {
  document.getElementById('loginEmail').value = name.toLowerCase() + '@djlabsiam.com';
  document.getElementById('loginPassword').value = 'x';
  await doLogin();
  await sleep(400);
}
async function enterPin(pin) {
  document.getElementById('pinInput').value = pin;
  await submitPin();
  await sleep(300);
}

async function runTests() {
  L('=== หน้าแรกรอบ 3: สลับบัญชี · พนักงานขาย · ไอคอน · แอป ===');
  localStorage.removeItem('djlab.desk.accounts.v1');

  // ── 1. เข้าด้วยรหัสผ่าน + ตั้ง PIN ────────────────────────────────────────
  ok('หน้าเข้าสู่ระบบมีตัวเลือก "จำบัญชีนี้" ติ๊กไว้แล้ว', document.getElementById('loginRemember').checked);
  await passwordLogin('TiBass');
  ok('เข้าแล้วอยู่หน้าแรก ชื่อ TiBass บนแถบของฉัน', current === 'home' && txt('homeHello') === 'TiBass' && txt('meRole') === 'เจ้าของร้าน', txt('homeHello'));
  // แถบดำสามช่องตามที่เจ้าของเคาะ 1 ต.ค. 69: ชื่อ+ตอกบัตรซ้าย · นาฬิกากลาง · สถานะร้านขวา
  const deckKids = [...document.querySelector('#sec-home .deck').children];
  ok('แถบดำ: ช่องซ้ายทักชื่อ TiBass และมีตอกบัตรวันนี้อยู่ใต้ชื่อ', txt('homeGreet') === 'TiBass'
    && deckKids[0].contains(document.getElementById('homeGreet')) && deckKids[0].contains(document.getElementById('clockPill')), txt('homeGreet'));
  ok('แถบดำ: นาฬิกาอยู่ช่องกลาง สถานะร้านอยู่ช่องขวา', deckKids.length === 3 && deckKids[1].id === 'homeClock'
    && deckKids[2].contains(document.getElementById('shopState')), deckKids.map(e => e.id || e.className).join(','));
  ok('เครื่องจำบัญชี TiBass ไว้ (มี refresh token)', accounts().length === 1 && accounts()[0].id === 'u1' && /^rt-u1-/.test(accounts()[0].rt), JSON.stringify(accounts()));
  ok('ยังไม่มี PIN → มีปุ่ม "ตั้ง PIN"', txt('pinNudge').indexOf('ตั้ง PIN') !== -1, txt('pinNudge'));
  openPinSet();
  document.getElementById('pinNew').value = '1357';
  document.getElementById('pinNew2').value = '1358';
  await savePin();
  ok('PIN สองช่องไม่ตรง ไม่ถูกบันทึก', rpcs('set_my_pin').length === 0 && txt('pinSetMsg').indexOf('ไม่ตรงกัน') !== -1);
  document.getElementById('pinNew2').value = '1357';
  await savePin();
  ok('ตั้ง PIN ผ่าน set_my_pin (ตรวจที่ฐานข้อมูล ไม่เก็บในเครื่อง)', rpcs('set_my_pin').length === 1 && rpcs('set_my_pin')[0].args.p_pin === '1357' &&
    JSON.stringify(accounts()).indexOf('1357') === -1);

  const CH = CHANNELS;

  // ── 2. เพิ่มบัญชีที่สอง (รหัสผ่าน) โดยไม่ออกจากคนเดิม ─────────────────────
  await startAddAccount();
  ok('เพิ่มบัญชี: หน้าเข้าสู่ระบบขึ้นพร้อมปุ่มยกเลิก', document.getElementById('loginOverlay').style.display === 'flex' && vis('loginCancelBtn'));
  await passwordLogin('Zen');
  ok('Zen เข้าแล้ว · เครื่องจำไว้ 2 บัญชี', currentUserId === 'u2' && accounts().length === 2, JSON.stringify(accounts().map(a => a.id)));
  ok('ไม่ได้ออกจากระบบของ TiBass (session เดิมไม่ถูกเพิกถอน)', !SERVER.revoked.includes('u1') && !!SERVER.rts[accounts().find(a => a.id === 'u1').rt]);
  openPinSet();
  document.getElementById('pinNew').value = '2468';
  document.getElementById('pinNew2').value = '2468';
  await savePin();
  addToCart('p1');
  ok('Zen ใส่ของในตะกร้า 1 ชิ้น', cart.length === 1);

  // ── 3. สลับด้วย PIN: ผิด → ไม่สลับ · ถูก → สลับ ตะกร้ายังอยู่ ───────────────
  openSwitchDialog();
  ok('หน้าต่างสลับบัญชีแสดงบัญชีที่จำไว้ (Zen = ใช้งานอยู่ กดไม่ได้)', document.querySelectorAll('#switchList .acct').length === 2 &&
    document.querySelector('#switchList .acct.current .pick').disabled);
  pickAccount('u1');
  ok('เลือก TiBass แล้วขึ้นช่องใส่ PIN', vis('pinStep') && txt('pinName') === 'TiBass' && document.activeElement.id === 'pinInput');
  const rtBefore = accounts().find(a => a.id === 'u1').rt;
  CALLS.length = 0;
  await enterPin('0000');
  ok('PIN ผิด → ยังเป็น Zen อยู่', currentUserId === 'u2' && !CALLS.some(c => c.op === 'setSession' && c.main), currentUserId);
  ok('PIN ผิด → บอกจำนวนครั้งที่เหลือ', txt('pinMsg').indexOf('ลองได้อีก 4 ครั้ง') !== -1, txt('pinMsg'));
  ok('ตรวจ PIN ด้วย session ของ TiBass ใน client แยก (ไม่ใช่ของ Zen)', rpcs('verify_my_pin').length === 1 && rpcs('verify_my_pin')[0].who === 'u1' &&
    rpcs('verify_my_pin')[0].main === false);
  const rtAfter = accounts().find(a => a.id === 'u1').rt;
  ok('token ของ TiBass ที่ใช้ต่ออายุไปแล้วถูกแทนด้วยตัวใหม่ทันที (ไม่ค้างตัวที่ใช้แล้ว)', rtAfter !== rtBefore && !!SERVER.rts[rtAfter], rtBefore + ' → ' + rtAfter);
  await enterPin('1357');
  ok('PIN ถูก → เป็น TiBass แล้ว', currentUserId === 'u1' && txt('homeHello') === 'TiBass', currentUserId);
  ok('หน้าต่างสลับปิดเอง', !document.getElementById('switchDialog').open);
  ok('ตะกร้าเดิมยังอยู่ และบอกว่าบิลจะเป็นชื่อคนใหม่', cart.length === 1 && txt('toast').indexOf('ตะกร้าเดิมยังอยู่') !== -1 && txt('toast').indexOf('TiBass') !== -1, txt('toast'));
  ok('สลับแล้วช่อง realtime ไม่ถูกสร้างใหม่หรือหายไป', CHANNELS === CH, CH + ' → ' + CHANNELS);
  ok('token ล่าสุดของ Zen ถูกเก็บไว้ ใช้สลับกลับได้', !!SERVER.rts[accounts().find(a => a.id === 'u2').rt]);
  ok('คนที่สลับเข้ามาด้วย PIN เปลี่ยน PIN ไม่ได้ (ต้องเข้าด้วยรหัสผ่าน)', (openPinSet(), !document.getElementById('pinSetDialog').open &&
    document.getElementById('confirmDialog').open));
  closeConfirm();

  // ── 4. ล็อกหลังผิด 5 ครั้ง ────────────────────────────────────────────
  openSwitchDialog('u2');
  for (let i = 0; i < 4; i++) await enterPin('1111');
  ok('ผิดครั้งที่ 4 เหลือ 1 ครั้ง', txt('pinMsg').indexOf('ลองได้อีก 1 ครั้ง') !== -1, txt('pinMsg'));
  await enterPin('1111');
  ok('ผิดครั้งที่ 5 → ล็อก บอกเวลาที่ปลด', txt('pinMsg').indexOf('ล็อกไว้ถึง') !== -1, txt('pinMsg'));
  await enterPin('2468');
  ok('ระหว่างล็อก PIN ถูกก็เข้าไม่ได้ · ยังเป็น TiBass', currentUserId === 'u1' && txt('pinMsg').indexOf('ล็อก') !== -1, txt('pinMsg'));
  document.getElementById('switchDialog').close();

  // ── 5. บัญชีหมดอายุ + ลบบัญชีออกจากเครื่อง ─────────────────────────────────
  const list = accounts();
  list.push({ id: 'u3', name: 'Nutty', role: 'staff', rt: 'rt-u3-expired', at: 1 });
  localStorage.setItem('djlab.desk.accounts.v1', JSON.stringify(list));
  openSwitchDialog('u3');
  await enterPin('9999');
  ok('token หมดอายุ → บอกให้เข้าด้วยรหัสผ่าน ไม่สลับ', currentUserId === 'u1' && txt('pinMsg').indexOf('หมดอายุ') !== -1, txt('pinMsg'));
  document.getElementById('switchDialog').close();
  CALLS.length = 0;
  await removeRemembered('u2');
  ok('ลบ Zen ออกจากเครื่องนี้: ไม่อยู่ในรายการแล้ว', !accounts().some(a => a.id === 'u2'));
  ok('ลบแล้วเพิกถอน session ที่เครื่องนี้ถือไว้ (เฉพาะเครื่องนี้)', CALLS.some(c => c.op === 'signOut' && c.scope === 'local' && c.who === 'u2' && !c.main));
  ok('ลบแล้วคนที่ใช้งานอยู่ไม่ถูกแตะ', currentUserId === 'u1');

  // ── 6. ยอดขายของฉัน ─────────────────────────────────────────────────
  await loadMySales();
  // วันที่ 1 ของเดือน บิล "ต้นเดือน" ก็คือวันนี้ด้วย
  const firstDay = TODAY === MONTH1;
  ok('ยอดของฉันวันนี้ถูก — ไม่นับบิลยกเลิก', txt('mySalesToday') === (firstDay ? '฿3,0002 บิล' : '฿1,0001 บิล'), txt('mySalesToday'));
  ok('ยอดของฉันเดือนนี้ = ฿3,000 (2 บิล) — ไม่นับเดือนก่อน/ของคนอื่น', txt('mySalesMonth') === '฿3,0002 บิล', txt('mySalesMonth'));
  ok('ข้อความค้างอ่านของฉัน = 1', txt('myUnread') === '1', txt('myUnread'));

  // ── 7. พนักงานขาย ───────────────────────────────────────────────────
  showSection('pos');
  ok('หน้าขายมีช่อง "พนักงานขาย"', txt('sellersLbl') === 'พนักงานขาย' && document.getElementById('sellersBox').getAttribute('role') === 'group');
  ok('คนที่ล็อกอิน (TiBass) เป็นพนักงานขายหลัก', document.querySelector('#sellersBox .seller.primary').textContent.indexOf('TiBass') !== -1);
  ok('ตัวเลือกเพิ่มมีทีมงานคนอื่น ไม่มีตัวเอง', [...document.getElementById('addSellerSel').options].map(o => o.textContent).join('|') === '+ เพิ่มพนักงานขาย…|Zen|Nutty',
    [...document.getElementById('addSellerSel').options].map(o => o.textContent).join('|'));
  const sel = document.getElementById('addSellerSel');
  sel.value = 'u2'; sel.dispatchEvent(new Event('change'));
  ok('เพิ่ม Zen เป็นพนักงานขายร่วม', coSellers.join() === 'u2' && document.querySelectorAll('#sellersBox .seller').length === 2);
  CALLS.length = 0;
  await submitSale();
  await sleep(200);
  const cs = rpcs('create_sale');
  ok('บิล + พนักงานขายร่วม ไปในคำสั่งเดียว (create_sale ครั้งเดียว)', cs.length === 1 && JSON.stringify(cs[0].args.p_sellers) === '["u2"]' &&
    cs[0].args.p_items.length === 1, JSON.stringify(cs.map(c => c.args)));
  ok('ไม่มีการเขียนตาราง sale_sellers แยกจากหน้าเว็บ', !CALLS.some(c => ['insert', 'update', 'upsert'].includes(c.op) && c.table === 'sale_sellers'));
  ok('ขายเสร็จล้างพนักงานขายร่วม กลับเหลือคนหลักคนเดียว', coSellers.length === 0 && document.querySelectorAll('#sellersBox .seller').length === 1);
  document.getElementById('successDialog').close();
  addToCart('p1');
  CALLS.length = 0;
  await submitSale();
  await sleep(200);
  ok('ไม่มีคนขายร่วม → ไม่ส่ง p_sellers (คำขอหน้าตาเหมือนเดิม)', rpcs('create_sale').length === 1 && !('p_sellers' in rpcs('create_sale')[0].args),
    JSON.stringify(rpcs('create_sale')[0] && rpcs('create_sale')[0].args));
  document.getElementById('successDialog').close();

  // ── 8. ประวัติบิลแสดงพนักงานขายทุกคน ────────────────────────────────────
  showSection('bills');
  const billRow = [...document.querySelectorAll('#billRows tr[data-i]')].find(tr => tr.textContent.indexOf('S-0009') !== -1);
  ok('ประวัติบิล: คอลัมน์พนักงานขายแสดง หลัก + ร่วม', !!billRow && billRow.textContent.indexOf('TiBass + Zen') !== -1, billRow && billRow.textContent);
  await openBill('s9');
  await sleep(100);
  ok('รายละเอียดบิล: พนักงานขาย TiBass (หลัก) + Zen (ร่วม)', txt('billSellers') === 'TiBass (หลัก) + Zen (ร่วม)', txt('billSellers'));

  // ── 9. ไอคอนลัด ─────────────────────────────────────────────────────
  showSection('home');
  const keys = () => [...document.querySelectorAll('#launcher .lt[data-key]')].map(b => b.dataset.key).join(',');
  ok('ค่าเริ่มต้น 4 ไอคอน: ขายหน้าร้าน · อีเมล · ห้องซ้อม · ปฏิทิน', keys() === 'pos,mail,booking,calendar', keys());
  ok('ไอคอนเป็นปุ่มจริง (กดด้วยคีย์บอร์ดได้) มีชื่ออ่านออกเสียง', [...document.querySelectorAll('#launcher .lt')].every(b => b.tagName === 'BUTTON' && b.getAttribute('aria-label')));
  const badgeOf = k => { const b = document.querySelector('#launcher .lt[data-key="' + k + '"] .badge'); return b ? b.textContent : ''; };
  ok('ป้ายมุมไอคอน: อีเมลใหม่ 3 · ห้องซ้อมรอยืนยัน 1 · ปฏิทินไม่มี', badgeOf('mail') === '3' && badgeOf('booking') === '1' && badgeOf('calendar') === '',
    [badgeOf('mail'), badgeOf('booking'), badgeOf('calendar')].join('/'));
  document.querySelector('#launcher .lt[data-key="pos"]').click();
  ok('ไอคอนขายหน้าร้าน: เปิดหน้าขายพร้อมโฟกัสที่ช่องยิงบาร์โค้ด', current === 'pos' && document.activeElement.id === 'posSearch', current + ' ' + document.activeElement.id);
  showSection('home');
  toggleLaunchEdit();
  ok('โหมดแก้ไข: 4 ช่องเลือกได้จากรายการสำเร็จรูป', document.querySelectorAll('#launcher select').length === 4 &&
    document.getElementById('ltSel0').options.length === 1 + LAUNCH_ITEMS.length);
  ok('รายการสำเร็จรูปมีครบ (ขาย · อีเมล · ห้องซ้อม · ปฏิทิน · สต็อก · กระดาน · ลูกค้า · สรุปรายวัน · ป้ายอีเมล)',
    ['pos', 'mail', 'booking', 'calendar', 'stock', 'board', 'customers', 'daily', 'mail:ส่งซ่อม', 'mail:BOYZ', 'mail:starred', 'mail:Mahajak Cop']
      .every(k => [...document.getElementById('ltSel0').options].some(o => o.value === k)));
  let s1 = document.getElementById('ltSel1'); s1.value = 'mail:ส่งซ่อม'; s1.dispatchEvent(new Event('change'));
  let s3 = document.getElementById('ltSel3'); s3.value = 'board'; s3.dispatchEvent(new Event('change'));
  CALLS.length = 0;
  await saveLauncher();
  const up = CALLS.find(c => c.op === 'upsert' && c.table === 'staff_home');
  ok('บันทึกไอคอนของตัวเองลง staff_home (upsert แถวของฉัน)', !!up && up.payload.admin_id === 'u1' && up.payload.launcher.join() === 'pos,mail:ส่งซ่อม,booking,board' &&
    up.opts && up.opts.onConflict === 'admin_id', JSON.stringify(up && up.payload));
  homePrefs = { launcher: [], apps: [], loaded: false, error: '' };
  await loadHomePrefs();
  ok('โหลดใหม่แล้วไอคอนที่เลือกยังอยู่', keys() === 'pos,mail:ส่งซ่อม,booking,board', keys());
  ok('ไอคอนป้าย "ส่งซ่อม" มีตัวเลขอีเมลใหม่ในป้าย (2) · กระดานมีข้อความค้าง (1)', badgeOf('mail:ส่งซ่อม') === '2' && badgeOf('board') === '1',
    badgeOf('mail:ส่งซ่อม') + '/' + badgeOf('board'));

  // ── 10. แอปบนหน้าแรก + เครื่องเล่น ────────────────────────────────────────
  openAppDialog();
  ok('หน้าต่างเพิ่มแอปไม่มีชนิด YouTube แล้ว (ย้ายไปแผง YouTube)', ![...document.getElementById('apKind').options].some(o => o.value === 'youtube'));
  document.getElementById('apUrl').value = 'https://example.com/not-spotify';
  CALLS.length = 0;
  await saveApp();
  ok('ลิงก์ที่ไม่ใช่ Spotify ถูกปฏิเสธ ไม่มีการบันทึก', txt('apMsg').indexOf('ไม่ใช่ลิงก์') !== -1 && !CALLS.some(c => c.op === 'upsert'));
  document.getElementById('apUrl').value = 'https://www.youtube.com/watch?v=jNQXAC9IVRw';
  await saveApp();
  ok('วางลิงก์ YouTube ในหน้าต่างเพิ่มแอป → บอกให้ใช้แผง YouTube', txt('apMsg').indexOf('แผง YouTube') !== -1 && !CALLS.some(c => c.op === 'upsert'));
  document.getElementById('apUrl').value = 'https://open.spotify.com/playlist/37i9dQZF1DX0XUsuxWHRQd';
  document.getElementById('apTitle').value = 'เพลงเปิดร้าน';
  await saveApp();
  ok('เพิ่มแอป Spotify: บันทึกลง staff_home.apps เฉพาะคอลัมน์ apps', homePrefs.apps.length === 1 && FAKE.staff_home[0].apps[0].kind === 'spotify' &&
    !('launcher' in CALLS.filter(c => c.op === 'upsert').pop().payload));
  openAppDialog();
  document.getElementById('apKind').value = 'link';
  document.getElementById('apUrl').value = 'javascript:alert(1)';
  await saveApp();
  ok('ลิงก์ javascript: ถูกปฏิเสธ', homePrefs.apps.length === 1 && txt('apMsg').indexOf('https://') !== -1);
  document.getElementById('apUrl').value = 'https://www.netflix.com/browse';
  document.getElementById('apTitle').value = '';
  await saveApp();
  ok('Netflix = เปิดหน้าต่างใหม่ บอกชัดว่าฝังไม่ได้', homePrefs.apps.length === 2 && txt('appList').indexOf('netflix.com') !== -1 &&
    txt('appList').indexOf('เปิดเป็นหน้าต่างใหม่') !== -1);
  document.getElementById('apKind').value = 'link';
  renderAppKindHint();
  ok('คำอธิบายชนิด "เว็บอื่น" บอกว่าฝังในหน้าคอนโซลไม่ได้', txt('apKindHint').indexOf('ฝังในหน้าคอนโซลไม่ได้') !== -1);
  document.getElementById('apKind').value = 'spotify';
  renderAppKindHint();
  ok('คำอธิบาย Spotify บอกเรื่องต้องล็อกอินถึงฟังเต็มเพลง', txt('apKindHint').indexOf('ล็อกอิน Spotify') !== -1);

  playApp(homePrefs.apps[0].id);
  const frame = document.getElementById('playerFrame');
  ok('กดเล่น Spotify: เครื่องเล่นขึ้น ใช้ที่อยู่ embed ที่ประกอบเอง พร้อม autoplay', vis('player') && !!frame &&
    frame.src === 'https://open.spotify.com/embed/playlist/37i9dQZF1DX0XUsuxWHRQd' && /autoplay/.test(frame.allow), frame && frame.src);
  showSection('products');
  ok('เปลี่ยนไปหมวดสินค้า: เครื่องเล่นยังอยู่ เป็นกรอบเดิม (เสียงไม่สะดุด)', vis('player') && document.getElementById('playerFrame') === frame && frame.isConnected);
  showSection('bills');
  showSection('booking');
  ok('เปลี่ยนหมวดอีกหลายครั้งก็ยังเป็นกรอบเดิม', document.getElementById('playerFrame') === frame);
  togglePlayerMin();
  ok('ย่อ: ซ่อนภาพแต่กรอบยังอยู่ (ไม่หยุดเล่น)', document.getElementById('player').classList.contains('min') && frame.isConnected);
  frame.focus();
  checkFrameFocus();
  ok('โฟกัสหลุดเข้าไปในกรอบวิดีโอ → ขึ้นแถบเตือนเรื่องเครื่องยิงบาร์โค้ด', vis('frameHint') && txt('frameHint').indexOf('ยิงบาร์โค้ด') !== -1);
  showSection('home');
  document.querySelector('#launcher .lt[data-key="pos"]').click();
  ok('กดไอคอนขายหน้าร้าน: โฟกัสกลับมาที่ช่องยิง แถบเตือนหาย', document.activeElement.id === 'posSearch' && !vis('frameHint'));
  closePlayer();
  ok('ปิดเครื่องเล่นแล้วกรอบหาย', !vis('player') && !document.getElementById('playerFrame'));

  L('=== สรุป: ' + pass + ' PASS / ' + fail + ' FAIL ===');
  L(fail ? 'RESULT:FAIL' : 'RESULT:PASS');
}
</script>`;

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  // ตัดเน็ตทั้งหมด — iframe ของ YouTube/ฟอนต์ไม่ไปโหลดของจริง
  const res = runPage({ root, file: 'desk.html', mock: MOCK, tests: TESTS, flags: ['--host-resolver-rules=MAP * ~NOTFOUND'] });
  process.exit(res.ok ? 0 : 1);
}
