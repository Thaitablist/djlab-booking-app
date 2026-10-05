/**
 * เทสต์ตัวจับเวลาห้องซ้อมใน desk.html (หมวดจองห้อง · การ์ดจับเวลา) — รัน: node tests/desk-timer.mjs
 *
 * เพิ่มตอนเลิกใช้แอปจองห้องเดิม (5 ต.ค. 69): ตัวจับเวลาเป็นของที่แอปเดิมมีและ desk ยกมา แต่ยังไม่มีเทสต์ครอบเลย
 * วิธีเดียวกับชุดอื่น: ไฟล์จริงทุกบรรทัด สลับเฉพาะแท็ก Supabase เป็นตัวปลอม · ที่นี่เพิ่มตัวแทน Notification / AudioContext / Date.now
 * (เลื่อนนาฬิกาไปข้างหน้าได้ — ตัวจับเวลาคำนวณจากนาฬิกาจริงไม่ใช่ตัวนับถอยหลัง)
 *   TIMER_ROOT=<โฟลเดอร์ที่มี desk.html อีกฉบับ> node tests/desk-timer.mjs   ใช้พิสูจน์ว่าเทสต์ "ตกจริง" กับฉบับก่อนแก้
 */
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { runPage, HARNESS } from './lib/page-test.mjs';

const root = process.env.TIMER_ROOT || join(dirname(fileURLToPath(import.meta.url)), '..');

const MOCK = `<script>
const CALLS = [];
const TODAY = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Bangkok' });
const FAKE = {
  admins: [{ id: 'u1', full_name: 'เจ้าของร้าน', role: 'owner', is_active: true }],
  room_bookings: [
    { id: 'b1', customer_name: 'ลูกค้า LINE', contact: '0812345678', date: TODAY, start_time: '13:00:00', hours: 2,
      room: 'Standard (CDJ3000x + DJM-A9/V10/V5/S11/S7)', cost: 1600, status: 'upcoming', confirmed: true,
      source: 'staff', line_user_id: null, customer_id: null },
  ],
  booking_settings: [{ id: true, price_per_hour: 800, points_per_hour: 1, free_hour_threshold: 10, free_hours_reward: 1, room_name: 'DJ LAB SIAM' }],
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
    insert(payload) { CALLS.push({ op: 'insert', table, payload }); return q; },
    update(payload) { CALLS.push({ op: 'update', table, payload }); return q; },
    upsert(payload) { CALLS.push({ op: 'upsert', table, payload }); return q; },
    delete() { CALLS.push({ op: 'delete', table }); return q; },
  };
  return q;
}
let SESSION = null, authCb = null;
window.supabase = {
  createClient: () => ({
    from: builder,
    rpc: async () => ({ data: null, error: null }),
    channel: () => ({ on() { return this; }, subscribe() { return this; } }),
    storage: { from: () => ({ async upload() { return { error: null }; }, async remove() { return { error: null }; }, async createSignedUrl() { return { data: { signedUrl: 'data:,' }, error: null }; } }) },
    auth: {
      async getSession() { return { data: { session: SESSION } }; },
      async getUser() { return { data: { user: SESSION && SESSION.user } }; },
      onAuthStateChange(cb) { authCb = cb; },
      async signInWithPassword() { SESSION = { user: { id: 'u1' } }; setTimeout(() => authCb && authCb('SIGNED_IN', SESSION)); return { data: {}, error: null }; },
      async signOut() { SESSION = null; setTimeout(() => authCb && authCb('SIGNED_OUT', null)); return { error: null }; },
    },
  }),
};
</script>`;

const TESTS = `<script>
window.addEventListener('load', () => setTimeout(runTests, 300));
${HARNESS}
const sleep = ms => new Promise(r => setTimeout(r, ms));
const txt = id => document.getElementById(id).textContent;
const stored = () => { try { return JSON.parse(localStorage.getItem('djlab_timer')); } catch (e) { return null; } };

// ตัวแทน Notification: จดว่าถูกขอสิทธิ์กี่ครั้ง / สร้างป้ายอะไร · สั่งให้ constructor ล้มได้ (มือถือบางรุ่นห้ามสร้างตรง ๆ)
const NOTE = { permission: 'default', asked: 0, made: [], throwOnCreate: false };
window.Notification = function (title, opts) { if (NOTE.throwOnCreate) throw new TypeError('Illegal constructor'); NOTE.made.push({ title, opts }); };
Object.defineProperty(window.Notification, 'permission', { get: () => NOTE.permission });
window.Notification.requestPermission = () => { NOTE.asked++; return Promise.resolve(NOTE.permission); };
let sounds = 0;
window.AudioContext = function () {
  sounds++;
  return { createOscillator: () => ({ connect() {}, frequency: {}, start() {}, stop() {} }),
           createGain: () => ({ connect() {}, gain: { setValueAtTime() {}, exponentialRampToValueAtTime() {} } }), destination: {}, currentTime: 0 };
};
// นาฬิกา: เลื่อนไปข้างหน้าได้ (skew วินาที)
const realNow = Date.now.bind(Date); let skew = 0; Date.now = () => realNow() + skew * 1000;
const near = (a, b, tol) => Math.abs(a - b) <= (tol === undefined ? 2 : tol);
const hardReset = () => { timerReset(); NOTE.made.length = 0; NOTE.throwOnCreate = false; };
async function login() {
  document.getElementById('loginEmail').value = 'owner@djlabsiam.com';
  document.getElementById('loginPassword').value = 'x';
  await doLogin();
  await sleep(400);
}

async function runTests() {
  L('=== ตัวจับเวลาห้องซ้อมใน desk.html ===');
  await login();
  showSection('booking');
  await sleep(100);

  // ── 1. เริ่มจากการ์ดจับเวลา: ขอสิทธิ์แจ้งเตือนตอนกดเริ่ม ──
  setTimer(0, 30);
  document.getElementById('timerStartBtn').click();
  ok('กดเริ่มจากการ์ดจับเวลา (ยังไม่เคยตอบ): ขอสิทธิ์แจ้งเตือน 1 ครั้ง', NOTE.asked === 1, String(NOTE.asked));
  ok('เริ่มนับถอยหลัง: ปุ่มเป็น "หยุดชั่วคราว" · ป้ายบอกกำลังนับ', timerRunning && txt('timerStartBtn').indexOf('หยุดชั่วคราว') !== -1 && txt('timerLabel').indexOf('กำลังนับ') !== -1, txt('timerStartBtn') + ' | ' + txt('timerLabel'));
  ok('แสดง 30:00', txt('timerDisplay') === '30:00', txt('timerDisplay'));
  const st1 = stored();
  ok('บันทึกลงเครื่อง (คีย์ djlab_timer — คีย์เดียวกับแอปเดิม): กำลังเดิน · ครบ 30 นาที · เวลาสิ้นสุดอยู่ในอนาคต', !!st1 && st1.running === true && st1.total === 1800 && near(st1.endsAt, Date.now() + 1800000, 3000), JSON.stringify(st1));

  // ── 2. หยุด/ต่อ: ถามสิทธิ์เฉพาะที่ยังไม่เคยตอบ ──
  document.getElementById('timerStartBtn').click();
  ok('กดหยุดชั่วคราว: ปุ่มเป็น "ต่อ" · ไม่ขอสิทธิ์เพิ่ม', !timerRunning && txt('timerStartBtn').indexOf('ต่อ') !== -1 && NOTE.asked === 1, txt('timerStartBtn') + ' asked=' + NOTE.asked);
  ok('หยุดแล้วเก็บเวลาที่เหลือ ไม่ใช่เวลาสิ้นสุด', !!stored() && stored().running === false && near(stored().remaining, 1800, 3), JSON.stringify(stored()));
  NOTE.permission = 'granted';
  document.getElementById('timerStartBtn').click();
  ok('กดต่อหลังอนุญาตแล้ว: ไม่ถามซ้ำ', timerRunning && NOTE.asked === 1, String(NOTE.asked));
  hardReset();
  NOTE.permission = 'denied';
  setTimer(1, 0);
  document.getElementById('timerStartBtn').click();
  ok('ผู้ใช้เคยปฏิเสธไว้: ไม่ถามอีก แต่ตัวจับเวลายังเดิน (มีเสียง + ข้อความบนจอ)', timerRunning && NOTE.asked === 1, String(NOTE.asked));
  hardReset();
  NOTE.permission = 'default';
  document.getElementById('timerHours').value = '0'; document.getElementById('timerMins').value = '0';
  const before = NOTE.asked;
  document.getElementById('timerStartBtn').click();
  ok('ตั้งเวลา 0: เตือนให้ตั้งเวลา ไม่เริ่ม ไม่ขอสิทธิ์', !timerRunning && txt('toast').indexOf('ตั้งเวลา') !== -1 && NOTE.asked === before, txt('toast') + ' asked=' + NOTE.asked);

  // ── 3. เวลาที่เหลือคิดจากนาฬิกาจริง ──
  hardReset(); NOTE.permission = 'granted';
  setTimer(0, 30);
  document.getElementById('timerStartBtn').click();
  skew += 600;
  syncTimer();
  ok('ผ่านไป 10 นาที (นาฬิกาจริง): เหลือ 20:00 แม้ตัวนับไม่ได้ทำงานครบรอบ', txt('timerDisplay') === '20:00' || txt('timerDisplay') === '19:59', txt('timerDisplay'));

  // ── 4. หมดเวลา: แจ้งเตือน 1 ครั้ง + เสียง + ข้อความ ──
  const made0 = NOTE.made.length, sounds0 = sounds;
  skew += 1500;
  syncTimer();
  ok('หมดเวลา: ป้ายบอก "หมดเวลาแล้ว" · ปุ่มกลับเป็น "เริ่ม" · ตัวนับหยุด', !timerRunning && timerFinished && txt('timerLabel').indexOf('หมดเวลา') !== -1 && txt('timerStartBtn').indexOf('เริ่ม') !== -1 && timerInterval === null, txt('timerLabel'));
  ok('หมดเวลา: เด้งแจ้งเตือนของระบบ 1 ป้าย (อนุญาตแล้ว)', NOTE.made.length === made0 + 1 && NOTE.made[NOTE.made.length - 1].title === 'DJ LAB SIAM — หมดเวลาซ้อม', JSON.stringify(NOTE.made));
  ok('หมดเวลา: มีเสียง + ข้อความบนจอ', sounds === sounds0 + 1 && txt('toast').indexOf('หมดเวลาซ้อมแล้ว') !== -1, 'sounds=' + sounds + ' | ' + txt('toast'));
  ok('บันทึกสถานะ: จบแล้ว ไม่เดิน', !!stored() && stored().finished === true && stored().running === false, JSON.stringify(stored()));
  syncTimer(); finishTimer();
  ok('หมดเวลาแล้ว เรียกซ้ำ: ไม่เด้งเตือน/เสียงซ้ำ', NOTE.made.length === made0 + 1 && sounds === sounds0 + 1, 'made=' + NOTE.made.length + ' sounds=' + sounds);

  // ── 5. มือถือที่ห้ามสร้าง Notification ตรง ๆ: ต้องไม่ขวางเสียงกับข้อความ ──
  hardReset();
  setTimer(0, 30);
  document.getElementById('timerStartBtn').click();
  NOTE.throwOnCreate = true;
  const sounds1 = sounds;
  skew += 1801;
  let threw = null;
  try { syncTimer(); } catch (e) { threw = e; }
  ok('Notification สร้างไม่ได้ (constructor โยน error): ไม่พังกลางทาง', !threw, String(threw));
  ok('...และยังมีเสียง + ข้อความ "หมดเวลา" บนจอ + สถานะจบ', sounds === sounds1 + 1 && txt('toast').indexOf('หมดเวลาซ้อมแล้ว') !== -1 && timerFinished, 'sounds=' + sounds + ' | ' + txt('toast'));

  // ── 6. เริ่มจากรายการจอง: ขอสิทธิ์ 1 ครั้ง (ไม่ซ้ำ) · ตั้งเวลาตามชั่วโมงที่จอง ──
  hardReset(); NOTE.permission = 'default';
  const askedBefore = NOTE.asked;
  await startTimerFromBooking('b1');
  ok('เริ่มจับเวลาจากรายการจอง: ขอสิทธิ์แจ้งเตือน 1 ครั้งพอดี', NOTE.asked === askedBefore + 1, String(NOTE.asked - askedBefore));
  ok('ตั้งเวลาตามชั่วโมงที่จอง (2 ชม.) และเริ่มเดิน', timerRunning && timerTotal === 7200 && txt('timerDisplay') === '2:00:00', txt('timerDisplay'));
  ok('บันทึกสถานะการจองเป็น active (update ตาราง room_bookings)', CALLS.some(c => c.op === 'update' && c.table === 'room_bookings' && c.payload && c.payload.status === 'active'), JSON.stringify(CALLS.filter(c => c.op === 'update')));

  // ── 7. กู้คืนหลังเปิดหน้าใหม่ (คีย์ localStorage) ──
  const stopMem = () => { clearInterval(timerInterval); timerInterval = null; timerRunning = false; timerFinished = false; timerRemaining = 0; timerTotal = 0; timerEndsAt = 0; };
  stopMem(); NOTE.made.length = 0; NOTE.permission = 'granted';
  localStorage.setItem('djlab_timer', JSON.stringify({ total: 3600, remaining: 3600, endsAt: Date.now() + 600000, running: true, finished: false }));
  restoreTimer();
  ok('เปิดหน้าใหม่ระหว่างที่จับเวลาเดินอยู่: เดินต่อ เหลือ 10:00', timerRunning && (txt('timerDisplay') === '10:00' || txt('timerDisplay') === '09:59') && txt('timerStartBtn').indexOf('หยุดชั่วคราว') !== -1, txt('timerDisplay'));
  stopMem();
  localStorage.setItem('djlab_timer', JSON.stringify({ total: 3600, remaining: 900, endsAt: 0, running: false, finished: false }));
  restoreTimer();
  ok('กู้คืนที่หยุดค้างไว้: ขึ้น 15:00 ปุ่ม "ต่อ" ยังไม่เดิน', !timerRunning && txt('timerDisplay') === '15:00' && txt('timerStartBtn').indexOf('ต่อ') !== -1, txt('timerDisplay') + ' ' + txt('timerStartBtn'));
  stopMem();
  localStorage.setItem('djlab_timer', JSON.stringify({ total: 3600, remaining: 0, endsAt: Date.now() - 60000, running: true, finished: false }));
  restoreTimer();
  ok('เปิดหน้าใหม่หลังหมดเวลามา 1 นาที: ขึ้น "หมดเวลาแล้ว" และเด้งเตือน 1 ครั้ง', timerFinished && !timerRunning && NOTE.made.length === 1, 'made=' + NOTE.made.length + ' ' + txt('timerLabel'));
  stopMem(); NOTE.made.length = 0;
  localStorage.setItem('djlab_timer', JSON.stringify({ total: 3600, remaining: 0, endsAt: Date.now() - 7 * 3600000, running: true, finished: false }));
  restoreTimer();
  ok('หมดเวลามานานเกิน 6 ชม.: ทิ้งเงียบ ๆ ไม่เด้งเตือนย้อนหลัง · ล้างที่เก็บ', !timerFinished && timerTotal === 0 && NOTE.made.length === 0 && localStorage.getItem('djlab_timer') === null, 'made=' + NOTE.made.length);
  stopMem();
  localStorage.setItem('djlab_timer', '{ไม่ใช่ json');
  let threwRestore = null; try { restoreTimer(); } catch (e) { threwRestore = e; }
  ok('ข้อมูลในเครื่องพัง (JSON เสีย): ไม่ล้ม', !threwRestore && !timerRunning, String(threwRestore));
  localStorage.removeItem('djlab_timer');

  // ── 8. กลับมาที่หน้านี้: จอต้องตรงนาฬิกาจริงทันที ──
  hardReset(); NOTE.permission = 'granted';
  setTimer(0, 30);
  document.getElementById('timerStartBtn').click();
  clearInterval(timerInterval); timerInterval = null;          // จำลองแท็บถูกพักจนตัวนับหยุด
  skew += 300;
  window.dispatchEvent(new Event('pageshow'));
  ok('pageshow (กลับจากแคชย้อนกลับ/สลับแอป): ตัวนับกลับมาเดิน · จอขึ้น 25:00 ทันที', timerInterval !== null && (txt('timerDisplay') === '25:00' || txt('timerDisplay') === '24:59'), txt('timerDisplay') + ' interval=' + timerInterval);
  clearInterval(timerInterval); timerInterval = null;
  skew += 300;
  Object.defineProperty(document, 'visibilityState', { value: 'visible', configurable: true });
  document.dispatchEvent(new Event('visibilitychange'));
  ok('visibilitychange (แท็บกลับมามองเห็น): จอขึ้น 20:00 ทันที', timerInterval !== null && (txt('timerDisplay') === '20:00' || txt('timerDisplay') === '19:59'), txt('timerDisplay'));
  hardReset();
  window.dispatchEvent(new Event('pageshow'));
  ok('pageshow ตอนไม่ได้จับเวลา: ไม่ทำอะไร (ไม่สร้างตัวนับค้าง)', timerInterval === null && !timerRunning);
  skew = 0;

  L('=== สรุป: ' + pass + ' PASS / ' + fail + ' FAIL ===');
  L(fail ? 'RESULT:FAIL' : 'RESULT:PASS');
}
</script>`;

const res = runPage({ root, file: 'desk.html', mock: MOCK, tests: TESTS });
process.exit(res.ok ? 0 : 1);
