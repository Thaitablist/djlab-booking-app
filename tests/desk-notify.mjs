/**
 * เทสต์ปุ่ม/แผง "🔔 แจ้งเตือน" ของหน้า "งานของฉัน" (Web Push บนเครื่องนี้) — รัน: node tests/desk-notify.mjs
 *
 * ไฟล์จริงทุกบรรทัด สลับเฉพาะแท็ก Supabase เป็นตัวปลอม · ที่นี่เพิ่มตัวแทน Notification / PushManager / serviceWorker
 * (จดว่าถูกขอสิทธิ์/ลงทะเบียน/สมัคร/ถอดกี่ครั้ง ด้วยอะไร) และ rpc ปลอมที่ตอบ/ล้มตามที่สั่งได้
 * กติกาที่ต้องไม่หลุด: ผูกเครื่องกับ "คนที่ล็อกอินอยู่" เท่านั้น (ออกจากระบบ/สลับบัญชี = ถอดเครื่อง — คอมหน้าร้านใช้ร่วมกัน) ·
 *   ฐานบันทึกไม่ผ่าน = ถอยกลับ ไม่ทิ้งเครื่องกำพร้า · ทุกสถานะบอกเป็นคำ · คำเตือนแดงตัวหนา · ข้อความจากข้อมูลแสดงเป็นข้อความเสมอ
 */
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { runPage, HARNESS } from './lib/page-test.mjs';

const root = process.env.NOTIFY_ROOT || join(dirname(fileURLToPath(import.meta.url)), '..');

const MOCK = `<script>
const CALLS = [];
let SEQ = 0;
const RPC = {};                                   // ผลของ rpc ที่สั่งเองได้: RPC.ชื่อ = { data, error } หรือฟังก์ชัน
const FAKE = {
  admins: [{ id: 'u1', full_name: 'เจ้าของร้าน', role: 'owner', is_active: true }, { id: 'u2', full_name: 'พนักงาน', role: 'staff', is_active: true }],
};
function builder(table) {
  const q = {
    _rows: (FAKE[table] || []).slice(), _head: false,
    select(c, o) { if (o && o.head) q._head = true; return q; },
    eq(col, val) { q._rows = q._rows.filter(r => r[col] === val); return q; },
    is() { return q; }, contains() { return q; }, order() { return q; }, gte() { return q; }, lt() { return q; }, lte() { return q; },
    limit() { return q; }, range() { return q; }, or() { return q; }, ilike() { return q; }, in() { return q; },
    async maybeSingle() { return { data: q._rows[0] || null, error: null }; },
    async single() { return { data: q._rows[0] || null, error: null }; },
    then(res, rej) { return Promise.resolve({ data: q._head ? null : q._rows, error: null, count: q._rows.length }).then(res, rej); },
    insert() { return q; }, update() { return q; }, upsert() { return q; }, delete() { return q; },
  };
  return q;
}
let SESSION = null, authCb = null;
window.supabase = {
  createClient: () => ({
    from: builder,
    rpc: async (fn, args) => {
      CALLS.push({ op: 'rpc', fn, args, n: ++SEQ });
      const r = RPC[fn];
      if (r !== undefined) return typeof r === 'function' ? r(args) : r;
      return { data: fn === 'push_my_devices' ? [] : null, error: null };
    },
    channel: () => ({ on() { return this; }, subscribe() { return this; } }),
    storage: { from: () => ({ async upload() { return { error: null }; }, async remove() { return { error: null }; }, async createSignedUrl() { return { data: { signedUrl: 'data:,' }, error: null }; } }) },
    auth: {
      async getSession() { return { data: { session: SESSION } }; },
      async getUser() { return { data: { user: SESSION && SESSION.user } }; },
      onAuthStateChange(cb) { authCb = cb; },
      async signInWithPassword({ email }) { SESSION = { user: { id: email.startsWith('owner') ? 'u1' : 'u2' } }; setTimeout(() => authCb && authCb('SIGNED_IN', SESSION)); return { data: {}, error: null }; },
      async signOut() { CALLS.push({ op: 'signOut', n: ++SEQ }); SESSION = null; setTimeout(() => authCb && authCb('SIGNED_OUT', null)); return { error: null }; },
      async refreshSession() { return { data: { session: { access_token: 'at', refresh_token: 'rt2', user: { id: 'u2' } } }, error: null }; },
      async setSession() { CALLS.push({ op: 'setSession', n: ++SEQ }); return { error: null }; },
    },
  }),
};
</script>`;

const TESTS = `<script>
window.addEventListener('load', () => setTimeout(runTests, 300));
${HARNESS}
const sleep = ms => new Promise(r => setTimeout(r, ms));
const txt = id => document.getElementById(id).textContent;
const vis = id => !document.getElementById(id).hidden;
const rpcs = fn => CALLS.filter(c => c.op === 'rpc' && c.fn === fn);
const KEY = 'B' + 'x'.repeat(86);                   // รูปร่างเดียวกับ VAPID public key (87 ตัว base64url = 65 ไบต์)
const OTHER_KEY_BYTES = new Uint8Array(65).fill(7);

// ── ตัวแทนของเบราว์เซอร์ ──
const NT = { perm: 'default', nextPerm: null, asked: 0, regs: 0, regArgs: null, subscribeCalls: 0, subscribeArgs: null, sub: null, n: 0, registered: false, unsubscribed: 0, subscribeFails: false };
window.Notification = function () {};
Object.defineProperty(window.Notification, 'permission', { get: () => NT.perm, configurable: true });
window.Notification.requestPermission = async () => { NT.asked++; if (NT.nextPerm) NT.perm = NT.nextPerm; return NT.perm; };
window.PushManager = function () {};
function makeSub(endpoint, keyBytes) {
  const s = { endpoint, options: { applicationServerKey: keyBytes.buffer.slice(0) },
    toJSON: () => ({ endpoint, keys: { p256dh: 'P'.repeat(87), auth: 'a'.repeat(22) } }),
    unsubscribe: async () => { NT.unsubscribed++; if (NT.sub === s) NT.sub = null; return true; } };
  return s;
}
const REG = { active: { scriptURL: 'https://shop.example/djlab-booking-app/desk-sw.js', state: 'activated' }, installing: null, waiting: null,
  pushManager: {
    getSubscription: async () => NT.sub,
    subscribe: async opts => { NT.subscribeCalls++; NT.subscribeArgs = opts; if (NT.subscribeFails) throw new Error('push service error'); NT.sub = makeSub('https://fcm.googleapis.com/fcm/send/ep' + (++NT.n), opts.applicationServerKey); return NT.sub; },
  } };
const SW_LISTENERS = {};
const SW = { register: async (url, o) => { NT.regs++; NT.regArgs = [url, o]; NT.registered = true; return REG; },
  getRegistration: async () => (NT.registered ? REG : undefined), addEventListener: (t, f) => { const l = (SW_LISTENERS[t] = SW_LISTENERS[t] || []); if (!l.includes(f)) l.push(f); } };   // EventTarget จริงไม่ผูกฟังก์ชันเดิมซ้ำ
const setSw = on => Object.defineProperty(navigator, 'serviceWorker', { value: on ? SW : undefined, configurable: true });
const setUa = ua => Object.defineProperty(navigator, 'userAgent', { get: () => ua, configurable: true });
const CHROME_UA = navigator.userAgent;
function reset() {
  NT.perm = 'default'; NT.nextPerm = null; NT.asked = 0; NT.regs = 0; NT.regArgs = null; NT.subscribeCalls = 0; NT.subscribeArgs = null; NT.sub = null;
  NT.registered = false; NT.unsubscribed = 0; NT.subscribeFails = false; CALLS.length = 0;
  Object.keys(RPC).forEach(k => delete RPC[k]);
  localStorage.clear();
  notif = notifBlank(); notifRender();
}
async function login(email) {
  document.getElementById('loginEmail').value = email;
  document.getElementById('loginPassword').value = 'x';
  await doLogin();
  await sleep(400);
}

async function runTests() {
  L('=== แจ้งเตือนงานบนเครื่องนี้ (Web Push) ===');
  setSw(false);
  await login('owner@djlab.com');
  showSection('tasks');
  await sleep(100);

  // ── 1. ปุ่ม + สถานะ (บอกเป็นคำทุกสถานะ) ──
  ok('มีปุ่ม "🔔 แจ้งเตือน" ในแถบเครื่องมือของหน้า "งานของฉัน" พร้อมสถานะเป็นคำ', !!document.querySelector('#sec-tasks .toolbar #notifBtn') && /แจ้งเตือน/.test(txt('notifBtn')) && txt('notifBtnState').length > 0, txt('notifBtn'));
  ok('เบราว์เซอร์ไม่มี serviceWorker: ปุ่มบอก "ใช้ไม่ได้" · ข้อความ "ไม่รองรับ" (ไม่ใช่ error แดง)', notifState() === 'unsupported' && txt('notifBtnState') === 'ใช้ไม่ได้' && /ไม่รองรับการแจ้งเตือน/.test(txt('notifStatus')) && !document.querySelector('#notifStatus .wk-red'), txt('notifStatus'));
  setSw(true); window.PushManager = window.PushManager;
  setUa('Mozilla/5.0 (iPhone; CPU iPhone OS 16_4 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.4 Mobile/15E148 Safari/604.1');
  Object.defineProperty(navigator, 'standalone', { value: false, configurable: true });
  notifRender();
  ok('iPhone ที่เปิดจากเบราว์เซอร์ (ไม่ใช่แอปที่เพิ่มลงหน้าจอโฮม): คำเตือน "ต้องเพิ่มแอปลงหน้าจอโฮมก่อน" แดงตัวหนา + ขั้นตอน 3 ข้อ + iOS 16.4', notifState() === 'ios-install' && !!document.querySelector('#notifStatus .wk-red') && /เพิ่มแอปลงหน้าจอโฮม/.test(txt('notifStatus')) && document.querySelectorAll('#notifSteps li').length === 3 && /16\\.4/.test(txt('notifStatus')), txt('notifStatus'));
  ok('iOS ยังไม่ติดตั้ง: ไม่มีปุ่มเปิด', !vis('notifEnable') && !vis('notifTest') && !vis('notifDisable'));
  Object.defineProperty(navigator, 'standalone', { value: true, configurable: true });
  notifRender();
  ok('iPhone เปิดจากแอปที่เพิ่มลงโฮมแล้ว: ผ่านด่าน iOS (ไปดูเรื่องคีย์ต่อ)', notifState() === 'no-key');
  Object.defineProperty(navigator, 'standalone', { value: undefined, configurable: true });
  setUa(CHROME_UA);
  notifRender();
  ok('ยังไม่ตั้ง VAPID public key: "ยังไม่พร้อม" (ข้อความธรรมดา ไม่ใช่ error) · ไม่มีปุ่มเปิด', notifState() === 'no-key' && txt('notifBtnState') === 'ยังไม่พร้อม' && /ยังไม่พร้อมใช้งาน/.test(txt('notifStatus')) && !vis('notifEnable'), txt('notifStatus'));
  ok('ค่า public key ว่างในไฟล์จริง (ห้ามมีค่าเดามาก่อนเจ้าของส่ง)', NOTIF_VAPID_PUBLIC_KEY === '');
  NOTIF_VAPID_PUBLIC_KEY = KEY;
  ok('ถอดรหัสคีย์ได้ 65 ไบต์ (รูปแบบ public key ของ P-256)', notifKeyBytes().length === 65);
  notifRender();
  ok('มีคีย์ ยังไม่เคยเปิด: "ปิด" · ข้อความชวนกดเปิด · มีเฉพาะปุ่มเปิด', notifState() === 'off' && txt('notifBtnState') === 'ปิด' && /ยังไม่ได้เปิดแจ้งเตือน/.test(txt('notifStatus')) && vis('notifEnable') && !vis('notifTest') && !vis('notifDisable'));
  NT.perm = 'denied'; notifRender();
  ok('เบราว์เซอร์บล็อกไว้: "ถูกบล็อก" · คำเตือนแดงตัวหนา + วิธีเปิดในการตั้งค่า · ไม่มีปุ่มเปิด', notifState() === 'blocked' && txt('notifBtnState') === 'ถูกบล็อก' && !!document.querySelector('#notifStatus .wk-red') && /การตั้งค่าของเบราว์เซอร์/.test(txt('notifStatus')) && !vis('notifEnable'));

  // ── 2. เปิดแจ้งเตือน ──
  reset(); NOTIF_VAPID_PUBLIC_KEY = KEY;
  RPC.push_my_devices = { data: [{ id: 'd1', label: '<img src=x onerror="window.XSS=1"> Chrome', created_at: '2026-10-05T03:00:00Z', last_ok_at: null }], error: null };
  NT.nextPerm = 'granted';
  document.getElementById('notifBtn').click();
  await sleep(100);
  ok('กดปุ่มแจ้งเตือน: เปิดหน้าต่าง · สถานะ "ปิด"', document.getElementById('notifDialog').open && notifState() === 'off');
  await notifEnable();
  ok('กดเปิด: ขอสิทธิ์ 1 ครั้ง · ลงทะเบียน ./desk-sw.js ด้วย scope ./desk.html', NT.asked === 1 && NT.regArgs && NT.regArgs[0] === './desk-sw.js' && NT.regArgs[1].scope === './desk.html', JSON.stringify(NT.regArgs));
  ok('สมัคร push ด้วย userVisibleOnly + คีย์ 65 ไบต์ตรงกับ public key', NT.subscribeCalls === 1 && NT.subscribeArgs.userVisibleOnly === true && NT.subscribeArgs.applicationServerKey.length === 65 && NT.subscribeArgs.applicationServerKey.every((v, i) => v === notifKeyBytes()[i]));
  const ps = rpcs('push_subscribe')[0];
  ok('บันทึกลงฐานผ่าน push_subscribe: endpoint · p256dh · auth · ป้ายเครื่อง (ไม่ส่ง admin_id — ฐานใช้คนที่ล็อกอิน)', rpcs('push_subscribe').length === 1 && ps.args.p_endpoint === NT.sub.endpoint && ps.args.p_p256dh.length === 87 && ps.args.p_auth.length === 22 && typeof ps.args.p_label === 'string' && ps.args.p_label.length > 0 && ps.args.p_label.length <= 60 && sorted(ps.args) === 'p_auth,p_endpoint,p_label,p_p256dh', JSON.stringify(ps && ps.args));
  function sorted(o) { return Object.keys(o).sort().join(','); }
  ok('จำว่าคนนี้เปิดบนเครื่องนี้ (แยกรายคน)', localStorage.getItem('djlab.notif.optin.v1:u1') === '1' && localStorage.getItem('djlab.notif.optin.v1:u2') === null);
  ok('สถานะ "เปิดอยู่" · มีปุ่มทดสอบ/ปิด · ไม่มีปุ่มเปิด', notifState() === 'on' && txt('notifBtnState') === 'เปิดอยู่' && /เปิดอยู่บนเครื่องนี้/.test(txt('notifStatus')) && vis('notifTest') && vis('notifDisable') && !vis('notifEnable'));
  ok('รายการเครื่องของฉัน: ขึ้นป้ายเครื่อง · "ยังไม่เคยส่งถึง" · ข้อความจากข้อมูลแสดงเป็นข้อความ (ไม่ใส่เป็น HTML)', document.querySelectorAll('#notifDevices li').length === 1 && /ยังไม่เคยส่งถึง/.test(txt('notifDevices')) && !document.querySelector('#notifDevices img') && !window.XSS && /onerror/.test(txt('notifDevices')), txt('notifDevices'));
  ok('มีข้อความบอกกติกา: ไม่ส่งช่วง 21:00–10:00 · คำขอไม่แสดงเนื้อหา', /21:00–10:00/.test(txt('notifDialog')) && /คำขอไม่แสดงเนื้อหา/.test(txt('notifDialog')));
  // กดซ้ำระหว่างทำงาน
  reset(); NOTIF_VAPID_PUBLIC_KEY = KEY; NT.nextPerm = 'granted';
  await Promise.all([notifEnable(), notifEnable()]);
  ok('กดเปิดซ้ำระหว่างที่ยังทำอยู่: สมัครแค่ครั้งเดียว', NT.subscribeCalls === 1 && rpcs('push_subscribe').length === 1, NT.subscribeCalls + '/' + rpcs('push_subscribe').length);

  // ── 3. กรณีไม่สำเร็จ ──
  reset(); NOTIF_VAPID_PUBLIC_KEY = KEY; NT.perm = 'default'; NT.nextPerm = null;           // ผู้ใช้ปิดหน้าต่างขอสิทธิ์โดยไม่เลือก
  await notifEnable();
  ok('ผู้ใช้ไม่เลือกอนุญาต/ปฏิเสธ (ยังเป็น default): ไม่สมัคร ไม่บันทึกฐาน · บอกให้กดอนุญาต', NT.subscribeCalls === 0 && rpcs('push_subscribe').length === 0 && /ยังไม่ได้กดอนุญาต/.test(txt('notifInfo')) && notifState() === 'off', txt('notifInfo'));
  reset(); NOTIF_VAPID_PUBLIC_KEY = KEY; NT.nextPerm = 'denied';
  await notifEnable();
  ok('ผู้ใช้กด "บล็อก": ไม่สมัคร · สถานะเป็น "ถูกบล็อก"', NT.subscribeCalls === 0 && rpcs('push_subscribe').length === 0 && notifState() === 'blocked');
  reset(); NOTIF_VAPID_PUBLIC_KEY = KEY; NT.nextPerm = 'granted';
  RPC.push_subscribe = { data: null, error: { message: 'ที่อยู่แจ้งเตือนของเครื่องนี้ไม่ถูกต้อง หรือไม่ใช่บริการแจ้งเตือนของเบราว์เซอร์ที่รองรับ' } };
  await notifEnable();
  ok('ฐานข้อมูลปฏิเสธ: ขึ้นข้อความแดงพร้อมเหตุผลจากฐาน', vis('notifErr') && /เปิดแจ้งเตือนไม่สำเร็จ.*ไม่ถูกต้อง/.test(txt('notifErr')), txt('notifErr'));
  ok('...ถอยกลับ: ถอด subscription ที่เพิ่งสร้างออก (ไม่ทิ้งเครื่องที่ฐานไม่รู้จัก) · ไม่จำว่าเปิด · สถานะ "ปิด"', NT.unsubscribed === 1 && NT.sub === null && localStorage.getItem('djlab.notif.optin.v1:u1') === null && notifState() === 'off');
  reset(); NOTIF_VAPID_PUBLIC_KEY = KEY; NT.nextPerm = 'granted';
  RPC.push_subscribe = { data: null, error: { message: 'Could not find the function public.push_subscribe(p_auth, p_endpoint) in the schema cache' } };
  await notifEnable();
  ok('ยังไม่ได้รัน 039 (ไม่พบฟังก์ชัน): แถบเหลืองบอกให้รัน migration 039 · ไม่ใช่ error แดง · ถอยกลับ', vis('notifWarn') && /migration 039/.test(txt('notifWarn')) && !vis('notifErr') && NT.unsubscribed === 1 && NT.sub === null, txt('notifWarn'));
  reset(); NOTIF_VAPID_PUBLIC_KEY = KEY; NT.nextPerm = 'granted'; NT.subscribeFails = true;
  await notifEnable();
  ok('เบราว์เซอร์สมัคร push ไม่ได้: ขึ้นข้อความแดง · ไม่บันทึกฐาน', vis('notifErr') && /push service error/.test(txt('notifErr')) && rpcs('push_subscribe').length === 0);
  reset(); NOTIF_VAPID_PUBLIC_KEY = KEY; NT.nextPerm = 'granted'; NT.registered = true; NT.sub = makeSub('https://fcm.googleapis.com/fcm/send/old', OTHER_KEY_BYTES);
  ok('subscription เก่าสมัครด้วยคีย์คนละชุด (หมุนคู่คีย์): สถานะ "ต้องเปิดใหม่" แดงตัวหนา', (await notifRefresh(), notifState() === 'rekey') && txt('notifBtnState') === 'ต้องเปิดใหม่' && !!document.querySelector('#notifStatus .wk-red') && vis('notifEnable'));
  await notifEnable();
  ok('กดเปิดใหม่: ถอดของเก่า สมัครด้วยคีย์ใหม่ บันทึกฐาน → "เปิดอยู่"', NT.unsubscribed === 1 && NT.subscribeCalls === 1 && rpcs('push_subscribe').length === 1 && notifState() === 'on');

  // ── 4. ปิดบนเครื่องนี้ ──
  const ep = NT.sub.endpoint;
  await notifDisable();
  const pu = rpcs('push_unsubscribe');
  ok('กดปิด: ถอดจากฐาน (push_unsubscribe ด้วย endpoint ของเครื่องนี้) แล้วถอดจากเบราว์เซอร์ · ลืมว่าเปิด · สถานะ "ปิด"', pu.length === 1 && pu[0].args.p_endpoint === ep && NT.sub === null && localStorage.getItem('djlab.notif.optin.v1:u1') === null && notifState() === 'off' && pu[0].n < NT.unsubscribed * 1e9);
  reset(); NOTIF_VAPID_PUBLIC_KEY = KEY; NT.nextPerm = 'granted'; await notifEnable();
  const keepEp = NT.sub.endpoint;
  RPC.push_unsubscribe = { data: null, error: { message: 'ต้องเข้าสู่ระบบ' } };
  const unsubBefore = NT.unsubscribed;
  await notifDisable();
  ok('ฐานถอดไม่สำเร็จ: ขึ้นข้อความแดง · ไม่ถอดจากเบราว์เซอร์ · ยังจำว่าเปิด (สองฝั่งไม่เพี้ยนกัน) · ยังเป็น "เปิดอยู่"', vis('notifErr') && /ปิดแจ้งเตือนไม่สำเร็จ/.test(txt('notifErr')) && NT.sub && NT.sub.endpoint === keepEp && NT.unsubscribed === unsubBefore && localStorage.getItem('djlab.notif.optin.v1:u1') === '1' && notifState() === 'on');

  // ── 5. ปุ่มทดสอบ ──
  reset(); NOTIF_VAPID_PUBLIC_KEY = KEY; NT.nextPerm = 'granted'; await notifEnable(); CALLS.length = 0;
  await notifTest();
  ok('กดทดสอบ: เรียก work_notify_test · ขึ้นข้อความ "ภายใน 1 นาที"', rpcs('work_notify_test').length === 1 && vis('notifInfo') && /ภายใน 1 นาที/.test(txt('notifInfo')));
  RPC.work_notify_test = { data: null, error: { message: 'ส่งทดสอบได้นาทีละครั้ง — รอสักครู่' } };
  await notifTest();
  ok('ฐานปฏิเสธ (นาทีละครั้ง): แสดงข้อความไทยจากฐานตามที่ฐานบอก', /นาทีละครั้ง/.test(txt('notifWarn')) && !vis('notifInfo'));
  RPC.work_notify_test = { data: null, error: { message: 'ระบบแจ้งเตือนยังไม่เปิดใช้งาน' } };
  await notifTest();
  ok('สวิตช์ฐานยังปิด: บอก "ระบบแจ้งเตือนยังไม่เปิดใช้งาน"', /ระบบแจ้งเตือนยังไม่เปิดใช้งาน/.test(txt('notifWarn')));
  RPC.work_notify_test = { data: null, error: { message: 'Could not find the function public.work_notify_test in the schema cache' } };
  await notifTest();
  ok('ยังไม่ได้รัน 039: แถบเหลืองบอกให้รัน migration 039', /migration 039/.test(txt('notifWarn')));

  // ── 6. ผูกคืนตอนล็อกอิน (notifSync) ──
  reset(); NOTIF_VAPID_PUBLIC_KEY = KEY; NT.perm = 'granted';
  await notifSync();
  ok('ไม่เคยเปิดไว้: ไม่ทำอะไรเลย (ไม่ลงทะเบียน ไม่ถามสิทธิ์ ไม่เรียกฐาน)', NT.regs === 0 && NT.asked === 0 && rpcs('push_subscribe').length === 0);
  localStorage.setItem('djlab.notif.optin.v1:u1', '1');
  await notifSync();
  ok('เคยเปิดไว้ + เบราว์เซอร์ยังอนุญาต: สมัคร/ผูกคืนให้เอง 1 ครั้ง · ไม่ถามสิทธิ์ซ้ำ', NT.regs === 1 && NT.subscribeCalls === 1 && rpcs('push_subscribe').length === 1 && NT.asked === 0 && notifState() === 'on');
  await notifSync();
  ok('ผูกคืนซ้ำ: ใช้ subscription เดิม (ไม่สมัครใหม่) แค่ยืนยันกับฐาน', NT.subscribeCalls === 1 && rpcs('push_subscribe').length === 2);
  reset(); NOTIF_VAPID_PUBLIC_KEY = KEY; localStorage.setItem('djlab.notif.optin.v1:u2', '1'); NT.perm = 'granted';
  await notifSync();
  ok('คนอื่น (u2) เคยเปิดไว้แต่ตอนนี้ u1 ล็อกอิน: ไม่ผูกให้ u1 (แยกรายคน)', NT.regs === 0 && rpcs('push_subscribe').length === 0);
  reset(); NOTIF_VAPID_PUBLIC_KEY = KEY; localStorage.setItem('djlab.notif.optin.v1:u1', '1'); NT.perm = 'denied';
  await notifSync();
  ok('เคยเปิดไว้แต่เบราว์เซอร์เพิกถอนสิทธิ์แล้ว: เลิกจำ · ไม่เรียกฐาน', localStorage.getItem('djlab.notif.optin.v1:u1') === null && rpcs('push_subscribe').length === 0 && NT.regs === 0);
  reset(); NOTIF_VAPID_PUBLIC_KEY = KEY; localStorage.setItem('djlab.notif.optin.v1:u1', '1'); NT.perm = 'granted'; NT.registered = true; NT.sub = makeSub('https://fcm.googleapis.com/fcm/send/old', OTHER_KEY_BYTES);
  await notifSync();
  ok('คีย์เปลี่ยน + เคยเปิดไว้: ผูกคืนด้วยคีย์ใหม่ให้เองโดยไม่ต้องกดอะไร', NT.unsubscribed === 1 && NT.subscribeCalls === 1 && notifState() === 'on');
  reset(); NOTIF_VAPID_PUBLIC_KEY = KEY; localStorage.setItem('djlab.notif.optin.v1:u1', '1'); NT.perm = 'granted';
  RPC.push_subscribe = { data: null, error: { message: 'network' } };
  let threwSync = null; try { await notifSync(); } catch (e) { threwSync = e; }
  ok('ผูกคืนไม่ได้ (ฐาน/เครือข่ายล้ม): ไม่โยน error · ไม่เด้งแถบแดงรบกวน · ถอยกลับเครื่องที่เพิ่งสร้าง', !threwSync && !vis('notifErr') && !document.getElementById('fatalError') && NT.unsubscribed === 1);

  // ── 7. ข้อความจาก desk-sw.js ──
  reset(); NOTIF_VAPID_PUBLIC_KEY = KEY; NT.nextPerm = 'granted'; await notifEnable();
  showSection('home'); await sleep(50);
  ok('(ตั้งต้น) ผูกฟังข้อความจาก service worker แล้ว', (SW_LISTENERS.message || []).length >= 1);
  const msg = m => (SW_LISTENERS.message || []).forEach(f => f({ data: m }));
  msg({ type: 'djlab-notification-click', hash: '#tasks' }); await sleep(50);
  ok('กดแจ้งเตือนแล้ว desk ที่เปิดอยู่ไปหมวด "งานของฉัน"', current === 'tasks', current);
  showSection('home'); CALLS.length = 0;
  msg({ type: 'djlab-push-resubscribe' }); await sleep(100);
  ok('เบราว์เซอร์หมุน subscription: ผูกใหม่กับฐาน', rpcs('push_subscribe').length === 1);
  showSection('home');
  msg(null); msg('x'); msg({ type: 'อะไรก็ไม่รู้' }); msg({ data: 1 }); await sleep(50);
  ok('ข้อความเพี้ยน/ชนิดไม่รู้จัก: ไม่ทำอะไร (ไม่ย้ายหมวด ไม่โยน error)', current === 'home');

  // ── 8. ออกจากระบบ: ถอดเครื่องออกจากคนที่ออก (คอมหน้าร้านใช้ร่วมกัน) ──
  reset(); NOTIF_VAPID_PUBLIC_KEY = KEY; NT.nextPerm = 'granted'; await notifEnable();
  const myEp = NT.sub.endpoint; CALLS.length = 0;
  doLogout();
  await sleep(300);
  const un = rpcs('push_unsubscribe'), so = CALLS.filter(c => c.op === 'signOut');
  ok('ออกจากระบบ: ถอดเครื่องนี้ออกจากคนเดิมก่อน (push_unsubscribe ด้วย endpoint) แล้วค่อย signOut', un.length === 1 && un[0].args.p_endpoint === myEp && so.length === 1 && un[0].n < so[0].n, JSON.stringify(CALLS.map(c => c.fn || c.op)));
  ok('...แต่ไม่ถอดจากเบราว์เซอร์ และยังจำว่าคนนี้เคยเปิด (กลับมาล็อกอินแล้วผูกคืนเอง)', NT.sub && NT.sub.endpoint === myEp && localStorage.getItem('djlab.notif.optin.v1:u1') === '1');
  ok('หลังออกจากระบบ: หน้าต่างแจ้งเตือนปิด · รายการเครื่อง/ข้อความของคนเดิมถูกล้างจากหน้า', !document.getElementById('notifDialog').open && /ยังไม่ได้โหลด/.test(txt('notifDevices')) && !vis('notifErr') && !vis('notifInfo') && notif.sub === null);
  await login('owner@djlab.com'); showSection('tasks'); await sleep(300);
  ok('กลับมาล็อกอินเป็นคนเดิม: ผูกเครื่องคืนให้เอง (push_subscribe) โดยไม่ถามสิทธิ์ใหม่', rpcs('push_subscribe').length >= 1 && NT.asked === 1 && notifState() === 'on', rpcs('push_subscribe').length + ' asked=' + NT.asked);
  reset(); NOTIF_VAPID_PUBLIC_KEY = KEY; CALLS.length = 0;
  doLogout(); await sleep(300);
  ok('ไม่เคยเปิดแจ้งเตือน: ออกจากระบบทันที ไม่เรียกฐานเรื่องเครื่อง', rpcs('push_unsubscribe').length === 0 && CALLS.filter(c => c.op === 'signOut').length === 1);
  await login('owner@djlab.com'); await sleep(200);
  reset(); NOTIF_VAPID_PUBLIC_KEY = KEY; NT.nextPerm = 'granted'; await notifEnable(); CALLS.length = 0;
  RPC.push_unsubscribe = () => new Promise(() => {});                      // ฐานไม่ตอบเลย
  const t0 = Date.now();
  doLogout();
  await sleep(1900);
  ok('ถอดเครื่องค้าง (ฐานไม่ตอบ): รอไม่เกิน ~1.5 วินาทีแล้วออกจากระบบต่อ — ไม่ขังผู้ใช้', CALLS.filter(c => c.op === 'signOut').length === 1 && Date.now() - t0 < 4000, 'signOut=' + CALLS.filter(c => c.op === 'signOut').length);
  await login('owner@djlab.com'); await sleep(200);
  reset(); NOTIF_VAPID_PUBLIC_KEY = KEY; NT.nextPerm = 'granted'; await notifEnable(); CALLS.length = 0;
  RPC.push_unsubscribe = () => { throw new Error('boom'); };
  doLogout(); await sleep(300);
  ok('ถอดเครื่องโยน error: ยังออกจากระบบได้', CALLS.filter(c => c.op === 'signOut').length === 1);

  // ── 9. สลับบัญชี: ของคนเดิมต้องไม่ค้างในหน้า ──
  await login('owner@djlab.com'); showSection('tasks'); await sleep(200);
  reset(); NOTIF_VAPID_PUBLIC_KEY = KEY; NT.nextPerm = 'granted'; await notifEnable();
  notif.devices = [{ id: 'dx', label: 'เครื่องของเจ้าของ', created_at: '2026-10-05T03:00:00Z', last_ok_at: null }]; notifRender();
  onAccountSwitched();
  ok('สลับเป็นคนอื่น: รายการเครื่อง/ข้อความของคนเดิมถูกล้าง · หน้าต่างปิด', !/เครื่องของเจ้าของ/.test(txt('notifDevices')) && !document.getElementById('notifDialog').open && notif.sub === null);

  // ── 10. ตัวหนังสือ/ปุ่ม ──
  const sizes = [...document.querySelectorAll('#notifDialog, #notifDialog *, #notifBtn')].filter(e => e.children.length === 0 && (e.textContent || '').trim()).map(e => parseFloat(getComputedStyle(e).fontSize));
  ok('ตัวหนังสือของปุ่ม/หน้าต่างแจ้งเตือนไม่เล็กกว่า 14px (กฎข้อ 6)', sizes.length > 5 && sizes.every(s => s >= 14), sizes.join());

  // ── 11. มุมที่เหลือ: ถอดรหัสคีย์ · ตัวรับยังติดตั้งอยู่ · ลงทะเบียนของแอปเดิม · สลับบัญชีกลางทาง · เพิ่มบัญชี/สลับด้วย PIN · ข้อความตอนไม่ได้ล็อกอิน ──
  NOTIF_VAPID_PUBLIC_KEY = 'B-_x' + 'x'.repeat(83);
  const kb = notifKeyBytes();
  ok('ถอดรหัส base64url ที่มี - และ _ ถูก (B-_x = 07 EF F1) · ได้ 65 ไบต์', kb.length === 65 && kb[0] === 0x07 && kb[1] === 0xEF && kb[2] === 0xF1, Array.from(kb.slice(0, 3)).join());
  NOTIF_VAPID_PUBLIC_KEY = KEY;
  const ACTIVE = REG.active;
  const worker = () => ({ state: 'installing', _l: [], addEventListener(t, f) { this._l.push(f); } });
  reset(); NOTIF_VAPID_PUBLIC_KEY = KEY; NT.nextPerm = 'granted';
  REG.active = null; const w1 = worker(); REG.installing = w1;
  const pe1 = notifEnable(); await sleep(50);
  ok('ตัวรับแจ้งเตือนยังติดตั้งอยู่: รอก่อน ยังไม่สมัคร', NT.subscribeCalls === 0);
  w1.state = 'activated'; REG.active = ACTIVE; w1._l.forEach(f => f()); await pe1;
  ok('ตัวรับแจ้งเตือนพร้อม (activated): สมัครต่อจนเสร็จ → "เปิดอยู่"', NT.subscribeCalls === 1 && notifState() === 'on');
  reset(); NOTIF_VAPID_PUBLIC_KEY = KEY; NT.nextPerm = 'granted';
  REG.active = null; const w2 = worker(); REG.installing = w2;
  const pe2 = notifEnable(); await sleep(50);
  w2.state = 'redundant'; w2._l.forEach(f => f()); await pe2;
  ok('ติดตั้งตัวรับแจ้งเตือนไม่สำเร็จ (redundant): ข้อความแดง · ไม่สมัคร ไม่บันทึกฐาน', vis('notifErr') && /ติดตั้งตัวรับแจ้งเตือนไม่สำเร็จ/.test(txt('notifErr')) && NT.subscribeCalls === 0 && rpcs('push_subscribe').length === 0);
  REG.installing = null; REG.active = ACTIVE;
  reset(); NOTIF_VAPID_PUBLIC_KEY = KEY; NT.registered = true; NT.sub = makeSub('https://fcm.googleapis.com/fcm/send/x', notifKeyBytes());
  REG.active = { scriptURL: 'https://shop.example/djlab-booking-app/sw.js' };
  ok('ตัวที่ลงทะเบียนไว้เป็น sw.js ของแอปเดิม (ไม่ใช่ desk-sw.js): ไม่นับเป็นเครื่องที่เปิดแจ้งเตือน', (await notifCurrentSub()) === null);
  REG.active = ACTIVE;
  ok('ตัวที่ลงทะเบียนไว้เป็น desk-sw.js: นับ', (await notifCurrentSub()) === NT.sub);
  reset(); NOTIF_VAPID_PUBLIC_KEY = KEY; NT.nextPerm = 'granted';
  RPC.push_subscribe = () => new Promise(r => setTimeout(() => r({ data: null, error: null }), 200));
  const pe3 = notifEnable(); await sleep(60);
  const keepUid = currentUserId; currentUserId = 'u2';                       // จำลองสลับบัญชีระหว่างที่ฐานกำลังบันทึก
  await pe3; currentUserId = keepUid;
  ok('สลับบัญชีระหว่างที่กำลังเปิด: ไม่จำว่าเปิดให้ใครเลย · ถอย subscription ที่เพิ่งสร้าง (ไม่ผูกให้คนผิด)', localStorage.getItem('djlab.notif.optin.v1:u1') === null && localStorage.getItem('djlab.notif.optin.v1:u2') === null && NT.unsubscribed === 1, String(NT.unsubscribed));
  // เพิ่มบัญชีอีกคน / ยกเลิก
  reset(); NOTIF_VAPID_PUBLIC_KEY = KEY; NT.nextPerm = 'granted'; await notifEnable(); CALLS.length = 0;
  await startAddAccount();
  ok('เพิ่มบัญชีอีกคน (หน้าเข้าสู่ระบบเปิด): ถอดเครื่องนี้ออกจากคนเดิมก่อน', rpcs('push_unsubscribe').length === 1 && loginVisible());
  CALLS.length = 0;
  cancelAddAccount(); await sleep(150);
  ok('กดยกเลิกการเพิ่มบัญชี: คนเดิมยังใช้อยู่ → ผูกเครื่องคืนให้', rpcs('push_subscribe').length === 1 && !loginVisible());
  // สลับด้วย PIN
  RPC.verify_my_pin = { data: { ok: true }, error: null };
  CALLS.length = 0;
  const sw = await pinSwitch({ id: 'u2', name: 'พนักงาน', rt: 'rt1' }, '1234');
  const unPin = rpcs('push_unsubscribe')[0], setS = CALLS.find(c => c.op === 'setSession');
  ok('สลับบัญชีด้วย PIN: ถอดเครื่องนี้ออกจากคนเดิม "ก่อน" เปลี่ยน session (ตอนนั้นยังเรียกฐานในนามคนเดิมได้)', sw.ok === true && !!unPin && !!setS && unPin.n < setS.n, JSON.stringify(CALLS.map(c => c.fn || c.op)));
  RPC.verify_my_pin = { data: { ok: false, reason: 'wrong', attempts_left: 4 }, error: null };
  CALLS.length = 0;
  const sw2 = await pinSwitch({ id: 'u2', name: 'พนักงาน', rt: 'rt1' }, '0000');
  ok('PIN ผิด: ไม่ถอดเครื่อง ไม่เปลี่ยน session (ยังเป็นคนเดิม ยังรับแจ้งเตือนต่อ)', sw2.ok === false && rpcs('push_unsubscribe').length === 0 && !CALLS.find(c => c.op === 'setSession'));
  // ข้อความตอนออกจากระบบแล้ว
  reset(); NOTIF_VAPID_PUBLIC_KEY = KEY; NT.nextPerm = 'granted'; await notifEnable();
  const msgOut = m => (SW_LISTENERS.message || []).forEach(f => f({ data: m }));
  showSection('home'); await sleep(50);                                      // ไม่อยู่หมวดงานของฉัน — ถ้าข้อความกดแจ้งเตือนหลุดเข้ามาจะย้ายหมวดให้เห็นชัด
  doLogout(); await sleep(400); CALLS.length = 0;
  const curBefore = current;
  msgOut({ type: 'djlab-push-resubscribe' }); msgOut({ type: 'djlab-notification-click' }); await sleep(100);
  ok('ข้อความจาก service worker ตอนยังไม่ได้ล็อกอิน: ไม่ผูกเครื่อง ไม่ย้ายหมวด', rpcs('push_subscribe').length === 0 && loginVisible() && current === curBefore, String(rpcs('push_subscribe').length) + ' ' + curBefore + '→' + current);
  await login('owner@djlab.com'); showSection('tasks'); await sleep(200);

  // ── 12. ช่องว่างที่ mutation เจอ ──
  reset(); NOTIF_VAPID_PUBLIC_KEY = KEY; NT.perm = 'granted'; NT.registered = true; NT.sub = makeSub('https://fcm.googleapis.com/fcm/send/z', notifKeyBytes());
  localStorage.setItem('djlab.notif.optin.v1:u1', '1');
  await notifRefresh();
  ok('(ตั้งต้น) มี subscription + อนุญาต + คนนี้เคยเปิด = "เปิดอยู่"', notifState() === 'on');
  NT.sub = null; await notifRefresh();
  ok('subscription หายจากเบราว์เซอร์ (ผู้ใช้ล้างข้อมูลเว็บ): ไม่ใช่ "เปิดอยู่" — บอก "ปิด" ให้กดเปิดใหม่', notifState() === 'off' && vis('notifEnable'));
  NT.sub = makeSub('https://fcm.googleapis.com/fcm/send/z2', notifKeyBytes());
  localStorage.removeItem('djlab.notif.optin.v1:u1'); localStorage.setItem('djlab.notif.optin.v1:u2', '1'); await notifRefresh();
  ok('เบราว์เซอร์มี subscription ของ "คนอื่น" ที่เปิดไว้ในเครื่องเดียวกัน แต่คนนี้ยังไม่เคยเปิด: "ปิด" — ไม่ขึ้น "เปิดอยู่" แทนคนนี้ (คอมหน้าร้านใช้ร่วมกัน)', notifState() === 'off');
  localStorage.setItem('djlab.notif.optin.v1:u1', '1'); NT.perm = 'default'; notifRender();
  ok('เคยเปิดแต่ตอนนี้เบราว์เซอร์กลับเป็น "ยังไม่ได้ถาม" (ผู้ใช้รีเซ็ตสิทธิ์): ไม่ใช่ "เปิดอยู่"', notifState() === 'off');
  reset(); NOTIF_VAPID_PUBLIC_KEY = KEY; NT.perm = 'granted';
  await notifEnable();
  ok('อนุญาตไว้แล้ว (เช่น ปิดแล้วเปิดใหม่): กดเปิดไม่ถามสิทธิ์ซ้ำ', NT.asked === 0 && NT.subscribeCalls === 1 && notifState() === 'on', String(NT.asked));
  reset(); NOTIF_VAPID_PUBLIC_KEY = KEY; setSw(false);
  await notifEnable();
  ok('เครื่องที่ไม่รองรับแต่ถูกสั่งเปิดตรง ๆ: ไม่ทำอะไร ไม่ถามสิทธิ์ ไม่ขึ้น error', NT.asked === 0 && !vis('notifErr') && rpcs('push_subscribe').length === 0);
  setSw(true);
  reset(); NOTIF_VAPID_PUBLIC_KEY = KEY; NT.perm = 'granted'; NT.registered = true; NT.sub = makeSub('https://fcm.googleapis.com/fcm/send/o', notifKeyBytes());
  localStorage.setItem('djlab.notif.optin.v1:u1', '1');
  RPC.push_my_devices = { data: [{ id: 'd9', label: 'Firefox · Windows', created_at: '2026-10-05T03:00:00Z', last_ok_at: '2026-10-05T04:00:00Z' }], error: null };
  document.getElementById('notifBtn').click(); await sleep(150);
  ok('เปิดหน้าต่างตอนเครื่องนี้ผูกอยู่แล้ว: ขึ้น "เปิดอยู่" + โหลดรายการเครื่องให้เลย (ไม่ต้องกดอะไร) · แสดง "ส่งถึงล่าสุด"', notifState() === 'on' && /Firefox · Windows/.test(txt('notifDevices')) && /ส่งถึงล่าสุด/.test(txt('notifDevices')), txt('notifDevices'));
  document.getElementById('notifClose').click();
  ok('กดปุ่ม "ปิด": หน้าต่างปิด', !document.getElementById('notifDialog').open);
  reset(); NOTIF_VAPID_PUBLIC_KEY = KEY; NT.perm = 'granted'; NT.registered = true; NT.sub = makeSub('https://fcm.googleapis.com/fcm/send/o2', notifKeyBytes());
  await notifRefresh(); CALLS.length = 0;
  doLogout(); await sleep(300);
  ok('คนที่ไม่เคยเปิดแจ้งเตือนออกจากระบบ (เบราว์เซอร์มี subscription ของคนอื่น): ไม่เรียกถอดเครื่อง (ไม่ใช่ของเขา) แต่ออกได้ตามปกติ', rpcs('push_unsubscribe').length === 0 && CALLS.filter(c => c.op === 'signOut').length === 1);
  await login('owner@djlab.com'); showSection('tasks'); await sleep(200);

  L('=== สรุป: ' + pass + ' PASS / ' + fail + ' FAIL ===');
  L(fail ? 'RESULT:FAIL' : 'RESULT:PASS');
}
</script>`;

const res = runPage({ root, file: 'desk.html', mock: MOCK, tests: TESTS });
process.exit(res.ok ? 0 : 1);
