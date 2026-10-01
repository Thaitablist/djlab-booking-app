/**
 * เทสต์รอบ 5 ของ desk.html (+ หัวของ stock.html) — 1 ต.ค. 69
 *   รัน: node tests/desk-batch5.mjs
 *
 * 1. หัวแผงลิ้นชักของปฏิทินเป็นสีของอาจารย์/หมวด/การจองห้อง (ตัวอักษรเลือกจากคอนทราสต์)
 * 2. สีปฏิทินที่เจ้าของแก้ได้ (staff_settings.cal_colors · 031) ผ่าน staff_display_settings()
 * 3. โลโก้ทางการ + "Console" ในเมนูซ้าย · หัวของ stock.html ใช้โลโก้เดียวกัน
 * 4. เครื่องคิดเลขลอย: ตัวคำนวณ (ไม่ใช้ eval) · คีย์บอร์ด · ประวัติ · ไม่ทับหน้าต่างวิดีโอ (1280 / 1440) ·
 *    ยิงบาร์โค้ดตอนเครื่องคิดเลขโฟกัสอยู่ = เข้าหมวดที่เปิดอยู่ ไม่เข้าเครื่องคิดเลข
 * 5. ไอคอนเมนูซ้ายเป็น SVG ไม่มีอักขระ Unicode เหลือ
 * 6. หัวแผง/หัวตารางแบบ B (#E3DFD5 + เส้นดำ 2px) และคอนทราสต์บนพื้นนั้น
 * 7. .chip ไม่ชนกันแล้ว (กล่องลูกค้าในหน้าขาย = .cust-box) · --text3 ≥ 4.5:1
 * 8. ไอคอนลัดใหม่ 3 ตัว · QR พร้อมเพย์ (เวกเตอร์ + CRC + ตัวสร้างอิสระในเทสต์) · รูป QR บัญชี (เฉพาะเจ้าของร้าน/ผู้ดูแล)
 *
 * เวกเตอร์พร้อมเพย์มาจากชุดเทสต์ของ promptpay-qr (github.com/dtinth/promptpay-qr · index.test.js · MIT)
 * ที่ใช้กันทั่วไปในไทย — ตรวจ CRC ของทุกตัวซ้ำด้วยตัวคำนวณแบบตารางที่เขียนแยกในไฟล์นี้แล้ว
 * ตาราง QR ที่เทียบ (QR_SNAP) สร้างจากตัวสร้างในหน้าเว็บ แล้วตรวจกับตัวสร้างของ Kazuhiko Arase (MIT ·
 * ชุดที่มากับ qrcode-terminal) ทุกหน้ากาก 0–7 · เวอร์ชัน 1–10 ตรงกันทุกโมดูล (96 ตาราง) ก่อนเก็บไว้ที่นี่
 */

import { dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { runPage, HARNESS } from './lib/page-test.mjs';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const { MOCK: MOCK3 } = await import(pathToFileURL(join(root, 'tests/desk-home3.mjs')).href);

const QR_SNAP = {
  payload: "00020101021229370016A000000677010111011300660000000005802TH530376454071234.506304723A",
  version: 6, mask: 3,
  rows: [
    "11111110100000001101011111100001001111111",
    "10000010101101100010100101001100101000001",
    "10111010001111101101000100000011001011101",
    "10111010111111010000110000111010101011101",
    "10111010000101000101101001110111101011101",
    "10000010000101010001001001000001101000001",
    "11111110101010101010101010101010101111111",
    "00000000101000101100101100010100100000000",
    "10110111000100101101111010000101101001011",
    "11001000000100101001011110100001010110001",
    "01111111100001110100100100100100000100100",
    "00101101000110011001001001011011011101001",
    "01110111010011011110100011011110010101100",
    "01110101011110110110101110000110000101111",
    "00111111010010100111111101100100001001101",
    "11110100001101101010011100010001110010000",
    "11110110110100000000010011101001000011010",
    "10000100110001111010010101111110010001110",
    "10110111000110001010101000010100110000010",
    "11001101101011000110010100001001110100100",
    "11000011110100101001100011000011101000101",
    "00100101101101100001010110100011001111001",
    "10101111001010101100111101101000001011000",
    "11011101111011011001001111101001001001011",
    "00101110111001010110111001011110110111100",
    "11001000101000111111100000010111111000111",
    "11010110010111011001001001001001010011001",
    "01001001010110111010010010000010011010010",
    "10010011011101000000110111100000011011000",
    "01000101010001100011100001100011001000010",
    "10001110110011110111011000000100110101110",
    "00011000001010001111000100111110110000100",
    "01011111001000100100111010010101111110101",
    "00000000101010010101010111100001100010001",
    "11111110111001001010100111000101101010100",
    "10000010111001000100100110010011100011001",
    "10111010011010111001110000111010111111110",
    "10111010110000001101101000110111100010110",
    "10111010100101001101001000100000010001111",
    "10000010011110101010011100110001110010010",
    "11111110110001011000010111101000100101010",
  ],
};

const EXTRA = `<script>
// ── staff_display_settings (031) + Storage ปลอม ต่อท้าย client ของ desk-home3
window.DISPLAY = { cal_colors: { class: '#1B5E20', rooms: '#AD1457' }, teacher_colors: { Nutty: '#6A1B9A' }, gcal_color: '#039BE5',
  promptpay_id: '0000000000', pay_name: 'ตัวอย่างทดสอบ — ไม่ใช่บัญชีจริง', pay_default_mode: 'promptpay',
  pay_qr_images: [{ id: 'q1', label: 'กสิกร · บัญชีทดสอบ', path: 'q1.webp' }] };
window.DISPLAY_ERR = null;
const _mk = window.supabase.createClient;
window.supabase.createClient = (u, k, o) => {
  const c = _mk(u, k, o), rpc0 = c.rpc;
  c.rpc = async (fn, args) => {
    if (fn === 'staff_display_settings') { CALLS.push({ op: 'rpc', fn }); return window.DISPLAY_ERR ? { data: null, error: window.DISPLAY_ERR } : { data: JSON.parse(JSON.stringify(window.DISPLAY)), error: null }; }
    return rpc0(fn, args);
  };
  c.storage = { from: bucket => ({
    async upload(path, blob) { CALLS.push({ op: 'upload', bucket, path, type: blob.type }); return { data: { path }, error: null }; },
    async remove(paths) { CALLS.push({ op: 'remove', bucket, paths }); return { data: [], error: null }; },
    async createSignedUrl(path, s) { CALLS.push({ op: 'sign', bucket, path, s });
      return { data: { signedUrl: 'data:image/svg+xml,' + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="10" height="10"/>') }, error: null }; },
    getPublicUrl(path) { return { data: { publicUrl: 'https://img.test/' + bucket + '/' + path } }; },
  }) };
  return c;
};
// ── YouTube IFrame API ปลอม (ชุดเดียวกับ desk-home4 แบบย่อ)
window.YT = { PlayerState: { ENDED: 0 }, Player: function (id, opts) {
  const el = document.getElementById(id), f = document.createElement('iframe');
  f.id = id; f.src = 'about:blank'; el.replaceWith(f);
  this.opts = opts; this.loadVideoById = () => {}; this.loadPlaylist = () => {}; this.destroy = () => f.remove(); this.getIframe = () => f;
  setTimeout(() => opts.events.onReady && opts.events.onReady({ target: this }));
} };
window.FN.yt = () => ({ error: { code: 'not_configured', message: 'x' } });
window.FN.gcal = () => ({ color: '#039BE5', teacher_colors: { Nutty: '#6A1B9A' }, events: [
  { uid: 'g1', title: '[ห้องใหญ่] BASIC SCRATCH/Kanid — Nutty', all_day: false, start: TODAY + 'T13:00', end: TODAY + 'T14:00', location: '', description: '' },
  { uid: 'g2', title: 'Basic — Maniac', all_day: false, start: TODAY + 'T15:00', end: TODAY + 'T16:00', location: '', description: '' },
] });
FAKE.calendar_events = [{ id: 'e1', title: 'คลาสเปิดบ้าน', event_date: TODAY, all_day: true, start_time: null, end_time: null, category: 'class', note: null, created_by: 'u1' }];
FAKE.customers = [{ id: 'c1', full_name: 'ลูกค้าทดสอบ', phone: '0800000000', line_id: null, email: null, note: null, tags: [], created_at: TODAY + 'T01:00:00Z', created_by: 'u1', admins: null }];
FAKE.staff_settings[0] = Object.assign(FAKE.staff_settings[0], { gcal_color: '#039BE5', teacher_colors: { Nutty: '#6A1B9A' },
  cal_colors: { class: '#1B5E20', rooms: '#AD1457' }, promptpay_id: '0000000000', pay_name: 'ตัวอย่างทดสอบ — ไม่ใช่บัญชีจริง',
  pay_default_mode: 'promptpay', pay_qr_images: [{ id: 'q1', label: 'กสิกร · บัญชีทดสอบ', path: 'q1.webp' }] });
</script>`;

// ตัวช่วยร่วม + ตัวคำนวณอิสระของเทสต์ (เขียนคนละแบบกับหน้าเว็บโดยตั้งใจ: CRC แบบตาราง · TLV ประกอบจากรายการ)
const COMMON = `
${HARNESS}
const sleep = ms => new Promise(r => setTimeout(r, ms));
const $ = id => document.getElementById(id);
const txt = id => $(id).textContent;
const vis = id => !$(id).hidden;
const cs = el => getComputedStyle(el);
function rgb(hex) { return 'rgb(' + [1, 3, 5].map(i => parseInt(hex.slice(i, i + 2), 16)).join(', ') + ')'; }
function lumOf(c) { const v = c.match(/[0-9.]+/g).slice(0, 3).map(x => +x / 255).map(x => x <= 0.03928 ? x / 12.92 : Math.pow((x + 0.055) / 1.055, 2.4)); return 0.2126 * v[0] + 0.7152 * v[1] + 0.0722 * v[2]; }
function ratio(a, b) { const x = lumOf(a), y = lumOf(b); return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05); }
const HEAD = 'rgb(227, 223, 213)';
async function login(name) {
  document.getElementById('loginEmail').value = name + '@x';
  document.getElementById('loginPassword').value = 'x';
  await doLogin();
  await sleep(500);
}
// พิมพ์ทีละปุ่มแบบคน (ห่างกันเกิน 50ms) ลงที่ที่โฟกัสอยู่
function typeKey(code, o) {
  clock += 200;
  const t = document.activeElement || document;
  const ev = new KeyboardEvent('keydown', Object.assign({ code, key: o && o.key !== undefined ? o.key : thaiKeyFor(code), bubbles: true, cancelable: true }, o || {}));
  t.dispatchEvent(ev);
  return ev;
}
const CRC_T = (() => { const t = []; for (let n = 0; n < 256; n++) { let c = n << 8; for (let k = 0; k < 8; k++) c = c & 0x8000 ? (c << 1) ^ 0x1021 : c << 1; t.push(c & 0xFFFF); } return t; })();
function crcRef(s) { let c = 0xFFFF; for (const ch of s) c = ((c << 8) & 0xFFFF) ^ CRC_T[((c >> 8) ^ ch.charCodeAt(0)) & 0xFF]; return ('000' + c.toString(16).toUpperCase()).slice(-4); }
function tlv(list) { return list.map(([t, v]) => t + (v.length < 10 ? '0' : '') + v.length + v).join(''); }
function payloadRef(digits, amount) {
  const acct = digits.length === 13 ? ['02', digits] : ['01', ('0000000000000' + '66' + digits.replace(/^0/, '')).slice(-13)];
  const f = [['00', '01'], ['01', amount ? '12' : '11'], ['29', tlv([['00', 'A000000677010111'], acct])], ['58', 'TH'], ['53', '764']];
  if (amount) f.push(['54', Number(amount).toFixed(2)]);
  const body = tlv(f) + '6304';
  return body + crcRef(body);
}
`;

const TESTS = `<script>
window.addEventListener('load', () => setTimeout(runTests, 300));
${COMMON}
const QR_SNAP = ${JSON.stringify(QR_SNAP)};
async function runTests() {
  L('=== รอบ 5: สีปฏิทิน · โลโก้ · เครื่องคิดเลข · ไอคอน · หัวแผง B · QR รับเงิน ===');
  localStorage.removeItem('djlab.desk.accounts.v1');
  localStorage.removeItem('djlab.desk.miniPos.v1');
  localStorage.removeItem('djlab.desk.calc.v1');
  await login('tibass');

  // ── 3 · 5. โลโก้ + ไอคอนเมนูซ้าย ───────────────────────────────────────────
  const brand = document.querySelector('.sidebar .brand'), logo = brand.querySelector('img.brand-logo');
  ok('เมนูซ้าย: โลโก้ทางการ (1× + 2×) แทนกล่องแดง DJ LAB', !!logo && logo.getAttribute('src') === 'logo-full-dark.png' &&
    /logo-full-dark@2x\\.png 2x/.test(logo.getAttribute('srcset')) && logo.alt === 'DJ LAB SIAM' && !brand.querySelector('.brand-box'), brand.innerHTML.slice(0, 160));
  ok('ป้ายโลโก้กว้าง 122 × สูง 40 ตามไฟล์ 1×', logo.getAttribute('width') === '122' && logo.getAttribute('height') === '40');
  ok('มีคำว่า Console ตัว Prompt ข้างโลโก้ · ไม่มี "คอนโซลร้าน" ซ้ำ', brand.textContent.trim() === 'Console' && /Prompt/.test(cs(brand.querySelector('.brand-console')).fontFamily));
  ok('ความกว้างเมนูซ้ายยังเป็น 248px', Math.round(document.querySelector('.sidebar').getBoundingClientRect().width) === 248);
  const icos = [...document.querySelectorAll('.nav-item .ico')];
  ok('ไอคอนเมนูซ้ายทุกอันเป็น SVG เส้น 1.75 ไม่มีอักขระ Unicode เหลือ', icos.length >= 14 && icos.every(i => i.querySelector('svg.ico-svg') &&
    i.textContent.trim() === '' && cs(i.querySelector('svg')).strokeWidth === '1.75px'), icos.map(i => i.textContent).join('|'));
  ok('ไอคอนเมนูเป็นของตกแต่ง (aria-hidden) ชื่อหมวดยังเป็นตัวหนังสือ', icos.every(i => i.getAttribute('aria-hidden') === 'true' && i.nextElementSibling.textContent.trim()));
  ok('ไม่มี glyph เดิม (⌂ ✎ ✉ ▤ ▦ ⇅ ☰ ＋ ≡ ◷ ☺ ∑ ⌕ ⚙) ในเมนูซ้าย', !/[⌂✎✉▤▦⇅☰＋≡◷☺∑⌕⚙]/.test(document.querySelector('.sidebar').textContent));

  // ── 6. หัวแผงแบบ B ─────────────────────────────────────────────────────
  showSection('home');
  await sleep(100);
  const ph = document.querySelector('#sec-home .panel-head');
  ok('หัวแผง: พื้น #E3DFD5 + เส้นล่างดำทึบ 2px', cs(ph).backgroundColor === HEAD && cs(ph).borderBottomWidth === '2px' &&
    cs(ph).borderBottomStyle === 'solid' && cs(ph).borderBottomColor === 'rgb(15, 15, 15)', cs(ph).backgroundColor + ' ' + cs(ph).borderBottom);
  const tb = document.querySelector('.topbar');
  ok('แถบบน: ยังขาว + เส้นล่างดำ 2px', cs(tb).backgroundColor === 'rgb(255, 255, 255)' && cs(tb).borderBottomWidth === '2px' && cs(tb).borderBottomColor === 'rgb(15, 15, 15)');
  // ตัวหนังสือทุกตัวบนหัวแผงต้องอ่านได้ ≥ 4.5:1 บนพื้นใหม่
  const onHead = [...document.querySelectorAll('.panel-head')].flatMap(h => [...h.querySelectorAll('*')].filter(el => [...el.childNodes].some(n => n.nodeType === 3 && n.textContent.trim())));
  const weak = onHead.filter(el => { let bg = 'rgba(0, 0, 0, 0)', e = el; while (e && /rgba\\(0, 0, 0, 0\\)|transparent/.test(bg)) { bg = cs(e).backgroundColor; e = e.parentElement; } return ratio(cs(el).color, bg) < 4.5; });
  ok('ตัวหนังสือ/ปุ่มบนหัวแผงทุกจุดคอนทราสต์ ≥ 4.5:1', onHead.length > 5 && !weak.length, weak.map(e => e.textContent.trim().slice(0, 12) + ' ' + cs(e).color).join(' | '));
  showSection('bills');
  const th = document.querySelector('#sec-bills table.data th');
  ok('หัวตาราง: พื้น #E3DFD5 + เส้นดำ 2px · ตัวหนังสือ text2 อ่านได้ ≥ 4.5:1', cs(th).backgroundColor === HEAD && cs(th).borderBottomWidth === '2px' &&
    ratio(cs(th.querySelector('.th')).color, HEAD) >= 4.5, ratio(cs(th.querySelector('.th')).color, HEAD).toFixed(2));
  showSection('products');
  await sleep(100);
  const wh = document.querySelector('.wing-h');
  ok('หัวปีกผนังสต็อก: พื้น #E3DFD5 · เส้นกลุ่ม 3px คงเดิม · ตัวเลขข้างหัวอ่านได้', !!wh && cs(wh).backgroundColor === HEAD && cs(wh).borderBottomWidth === '3px' &&
    ratio(cs(wh.querySelector('span')).color, HEAD) >= 4.5);

  // ── 7. --text3 · .chip ─────────────────────────────────────────────────
  const t3 = cs(document.documentElement).getPropertyValue('--text3').trim();
  ok('--text3 อ่านได้ ≥ 4.5:1 บนขาว และบน surface2', ratio(rgb(t3), 'rgb(255, 255, 255)') >= 4.5 && ratio(rgb(t3), rgb('#FAF9F6')) >= 4.5, t3);
  ok('ลายเส้นแทนรูปยังใช้โทนอ่อนเดิม (--ash #807D75)', cs(document.querySelector('.sil')).stroke === rgb('#807D75'));
  showSection('pos');
  selectedCustomer = customers[0];
  renderSelectedCustomer();
  const cb = document.querySelector('#selectedCustomerBox > div');
  ok('กล่องลูกค้าที่เลือกในหน้าขายมีคลาสของตัวเอง (.cust-box) และได้สไตล์ครบ', cb.className === 'cust-box' && cs(cb).display === 'flex' &&
    cs(cb).borderTopWidth === '1px' && cs(cb).backgroundColor === rgb('#FAF9F6') && cs(cb).paddingLeft === '12px', cb.className + ' ' + cs(cb).display);
  ok('ไม่มี .chip ในกล่องลูกค้าแล้ว (ชื่อเดียวกับป้ายปฏิทิน)', !document.querySelector('#selectedCustomerBox .chip'));
  clearSelectedCustomer();

  // ── 2. สีปฏิทินที่เจ้าของแก้ได้ ─────────────────────────────────────────
  ok('โหลดสีผ่าน staff_display_settings() (ไม่ต้องรอ gcal)', CALLS.some(c => c.op === 'rpc' && c.fn === 'staff_display_settings') && calState.calColors.class === '#1B5E20');
  showSection('calendar');
  await sleep(300);
  const legend = n => [...document.querySelectorAll('#calLegend .chip')].find(c => c.textContent === n);
  ok('คำอธิบายสี: คลาสเรียน = สีที่เจ้าของตั้ง (#1B5E20)', cs(legend('คลาสเรียน')).backgroundColor === rgb('#1B5E20'));
  ok('คำอธิบายสี: ห้องซ้อม = สีที่เจ้าของตั้ง (#AD1457) · หมวดที่ไม่ได้ตั้ง = สีเดิม', cs(legend('ห้องซ้อม')).backgroundColor === rgb('#AD1457') &&
    cs(legend('อีเวนต์')).backgroundColor === rgb('#F4511E'));
  const shopEv = document.querySelector('#calGrid .ev[data-kind="shop"]');
  ok('ป้ายกิจกรรมร้านในปฏิทินใช้สีหมวดที่ตั้ง', !!shopEv && cs(shopEv).backgroundColor === rgb('#1B5E20'));
  ok('ปุ่มชื่อใหม่ "ตั้งค่าสีปฏิทิน"', txt('gcalSetupBtn') === 'ตั้งค่าสีปฏิทิน' && vis('gcalSetupBtn'));
  await openGcalSettings();
  ok('หน้าต่างชื่อ "ตั้งค่าสีปฏิทิน" ยังมีช่องที่อยู่ iCal', txt('gcalTitle') === 'ตั้งค่าสีปฏิทิน' && !!$('gsUrl'));
  const cin = [...document.querySelectorAll('#gsCats input[type=color]')];
  ok('มีช่องสีชั้นการจองห้อง + หมวดร้าน 5 หมวด (ไม่มีสีรายกิจกรรม)', cin.map(i => i.dataset.k).join() === 'rooms,shop,class,event,staff,other', cin.map(i => i.dataset.k).join());
  ok('ค่าเริ่มของช่อง = ที่บันทึกไว้ / สีเดิมของหมวดที่ยังไม่ได้ตั้ง', cin.find(i => i.dataset.k === 'class').value === '#1b5e20' &&
    cin.find(i => i.dataset.k === 'event').value === '#f4511e' && cin.find(i => i.dataset.k === 'rooms').value === '#ad1457');
  const ev = cin.find(i => i.dataset.k === 'event');
  ev.value = '#808080'; ev.dispatchEvent(new Event('input'));
  const prev = [...document.querySelectorAll('#gsCats .chip')];
  ok('ป้ายตัวอย่างในหน้าตั้งค่าคอนทราสต์ ≥ 4.5:1 ทุกอัน (รวมสีเทากลางที่เพิ่งเลือก)', prev.length === 6 && prev.every(c => ratio(cs(c).color, cs(c).backgroundColor) >= 4.5),
    prev.map(c => ratio(cs(c).color, cs(c).backgroundColor).toFixed(2)).join());
  CALLS.length = 0;
  await saveGcalSettings();
  const up = CALLS.find(c => c.op === 'update' && c.table === 'staff_settings');
  ok('บันทึกลง staff_settings.cal_colors (031) พร้อมค่าเดิมของปฏิทิน Google', !!up && up.payload.cal_colors.event === '#808080' && up.payload.cal_colors.class === '#1B5E20' &&
    up.payload.cal_colors.rooms === '#AD1457' && 'gcal_ics_url' in up.payload && up.payload.teacher_colors.Nutty === '#6A1B9A', JSON.stringify(up && up.payload.cal_colors));
  await sleep(200);
  const evChip = [...document.querySelectorAll('#calLegend .chip')].find(c => c.textContent === 'อีเวนต์');
  ok('บันทึกแล้วใช้ทันที · ป้ายสีเทากลางอ่านได้ ≥ 4.5:1', evChip.style.getPropertyValue('--cat') !== '' && ratio(cs(evChip).color, cs(evChip).backgroundColor) >= 4.5);

  // ── 1. หัวแผงลิ้นชักเป็นสีของสิ่งที่เปิด ─────────────────────────────────
  const head = () => document.querySelector('#detail .detail-head');
  const gi = calState.google.findIndex(g => /Nutty/.test(g.title));
  openCalItem('google', String(gi));
  const k1 = chipColors(teacherColor('Nutty'));
  ok('เปิดกิจกรรมของ Nutty → หัวแผงสีของ Nutty ตัวอักษรขาว/ดำจากคอนทราสต์', head().classList.contains('tinted') && cs(head()).backgroundColor === rgb(k1.bg) &&
    cs(head()).color === rgb(k1.ink) && ratio(cs(head()).color, cs(head()).backgroundColor) >= 4.5, cs(head()).backgroundColor);
  ok('ชื่อกิจกรรมและปุ่มปิดบนหัวแผงสีอ่านได้ ≥ 4.5:1', ratio(cs($('detailTitle')).color, cs(head()).backgroundColor) >= 4.5 &&
    ratio(cs(head().querySelector('.btn')).color, cs(head()).backgroundColor) >= 4.5);
  openCalItem('google', String(calState.google.findIndex(g => /Maniac/.test(g.title))));
  ok('Maniac (เขียวอมเหลืองสว่าง) → ตัวอักษรดำ', cs(head()).backgroundColor === rgb('#C0CA33') && cs(head()).color === 'rgb(15, 15, 15)');
  openCalItem('shop', 'e1');
  ok('กิจกรรมร้านหมวดคลาสเรียน → หัวแผงสีของหมวด (ที่เจ้าของตั้ง)', cs(head()).backgroundColor === rgb(chipColors('#1B5E20').bg) && cs(head()).color === 'rgb(255, 255, 255)');
  calState.layers.rooms = true;
  openCalItem('room', 'rb1');
  ok('การจองห้องซ้อม → หัวแผงสีชั้นการจอง', cs(head()).backgroundColor === rgb(chipColors('#AD1457').bg));
  showSection('bills');
  openBill('s9');
  await sleep(100);
  ok('เปิดแผงอื่น (บิล) → หัวแผงกลับเป็นแบบ B ไม่มีสีค้าง', !head().classList.contains('tinted') && cs(head()).backgroundColor === HEAD, cs(head()).backgroundColor);
  closeDetail();

  // ── 8. ไอคอนลัดใหม่ ───────────────────────────────────────────────────
  const li = k => LAUNCH_ITEMS.find(x => x.key === k);
  ok('มีไอคอนลัดใหม่ 3 ตัว พร้อมสี ไอคอน และตัวนับ', ['receive', 'register', 'payqr'].every(k => li(k) && /^#[0-9A-F]{6}$/.test(li(k).color) && ICON_PATHS[li(k).icon]) &&
    li('receive').t === 'สินค้ารับเข้า' && li('register').t === 'สร้างลิงก์สมัครสมาชิก' && li('payqr').t === 'QR รับเงิน' && typeof li('receive').badge === 'function');
  homePrefs.launcher = ['receive', 'register', 'payqr', 'pos'];
  showSection('home');
  rcv.groups = [{ pid: 'p1', serials: ['A1', 'A2'], loose: 0 }];
  renderLauncher();
  const tile = k => document.querySelector('#launcher .lt[data-key="' + k + '"] .lt-icon');
  ok('ไอคอนแบบแอป A: เส้นไอคอนกับพื้น ≥ 3:1 ทั้งสามตัว', ['receive', 'register', 'payqr'].every(k => tile(k) && ratio(cs(tile(k)).color, cs(tile(k)).backgroundColor) >= 3));
  ok('สินค้ารับเข้า: ตัวเลขมุม = เครื่องที่ยิงค้างในถาดรับเข้า', tile('receive').querySelector('.badge') && tile('receive').querySelector('.badge').textContent === '2');
  rcv.groups = [];
  document.querySelector('#launcher .lt[data-key="receive"]').click();
  await sleep(100);
  ok('กด "สินค้ารับเข้า" → ผนังสต็อกโหมดรับเข้า โฟกัสช่องยิง ถาดรับเข้าเปิด', current === 'products' && wall.mode === 'receive' &&
    document.activeElement.id === 'productSearch' && vis('tray'), current + ' ' + wall.mode + ' ' + document.activeElement.id);
  setWallMode('find');
  showSection('home');
  CALLS.length = 0;
  document.querySelector('#launcher .lt[data-key="register"]').click();
  await sleep(150);
  ok('กด "สร้างลิงก์สมัครสมาชิก" → หน้าต่างสร้างลิงก์ตัวเดิมของหมวดลูกค้า (openCodeModal ตัวเดียวกัน)', $('codeLinkDialog').open && !!$('codeInput') && !!$('codeLink') &&
    LAUNCH_ITEMS.find(x => x.key === 'register').go.toString().indexOf('openCodeModal') !== -1);
  $('codeLinkDialog').close();
  document.querySelector('#launcher .lt[data-key="payqr"]').click();
  await sleep(100);
  ok('กด "QR รับเงิน" → หน้า QR ตามโหมดตั้งต้นที่เจ้าของเลือก (พร้อมเพย์)', $('payDialog').open && pay.mode === 'promptpay' && !!document.querySelector('#payStage svg.qr-svg'));
  $('payDialog').close();

  // ── 8a. พร้อมเพย์: เวกเตอร์ · CRC · ตัวประกอบอิสระ ──────────────────────────
  ok('CRC-16/CCITT-FALSE ค่าตรวจมาตรฐาน "123456789" = 29B1', crc16ccitt('123456789') === '29B1' && crcRef('123456789') === '29B1');
  const VEC = [
    ['0801234567', null, '00020101021129370016A000000677010111011300668012345675802TH530376463046197'],
    ['080-123-4567', null, '00020101021129370016A000000677010111011300668012345675802TH530376463046197'],
    ['+66-89-123-4567', null, '00020101021129370016A000000677010111011300668912345675802TH5303764630429C1'],
    ['1111111111111', null, '00020101021129370016A000000677010111021311111111111115802TH530376463047B5A'],
    ['1-1111-11111-11-1', null, '00020101021129370016A000000677010111021311111111111115802TH530376463047B5A'],
    ['0123456789012', null, '00020101021129370016A000000677010111021301234567890125802TH530376463040CBD'],
    ['000-000-0000', 4.22, '00020101021229370016A000000677010111011300660000000005802TH530376454044.226304E469'],
  ];
  VEC.forEach(([id, amt, want]) => {
    const got = promptPayPayload(id, amt);
    ok('เวกเตอร์ promptpay-qr: ' + id + (amt ? ' ยอด ' + amt : ''), got === want, got);
  });
  ok('CRC ของทุกเวกเตอร์ตรงกับตัวคำนวณแบบตารางของเทสต์', VEC.every(([, , w]) => crcRef(w.slice(0, -4)) === w.slice(-4) && crc16ccitt(w.slice(0, -4)) === w.slice(-4)));
  const cases = [['0812345678', '12000'], ['0899999999', '0.5'], ['3100700000005', '1234.5'], ['0000000000', null], ['0612345678', '99999999.99']];
  ok('ตัวประกอบอิสระของเทสต์ได้ payload เดียวกับหน้าเว็บทุกกรณี', cases.every(([d, a]) => promptPayPayload(d, a) === payloadRef(d, a)),
    cases.map(([d, a]) => promptPayPayload(d, a) + ' / ' + payloadRef(d, a)).find((x, i) => promptPayPayload(cases[i][0], cases[i][1]) !== payloadRef(cases[i][0], cases[i][1])));
  ok('ยอดเงินเป็นทศนิยม 2 ตำแหน่งเสมอ', ppAmount(4.2) === '4.20' && ppAmount('1,250') === '1250.00' && ppAmount('12000') === '12000.00' && ppAmount('0.005') === '0.01' && ppAmount('') === '');
  ok('ยอดผิดรูปถูกปฏิเสธ (0 · ติดลบ · ตัวอักษร)', ppAmount(0) === null && ppAmount(-5) === null && ppAmount('abc') === null);
  ok('เบอร์มือถือทุกรูปแบบ → 0066 + 9 หลัก (13 หลัก)', ['081-234-5678', '+66 81 234 5678', '66812345678', '0812345678'].every(x =>
    promptPayPayload(x).indexOf('01130066812345678') !== -1));
  ok('เลข 13 หลักไปช่อง 02 · เลขผิดความยาวถูกปฏิเสธ', promptPayPayload('1-1111-11111-11-1').indexOf('02131111111111111') !== -1 &&
    ppNormalizeId('12345') === null && ppNormalizeId('081234567') === null && (() => { try { promptPayPayload('12345'); return false; } catch (e) { return true; } })());
  ok('มียอด = จุดเริ่ม 12 (dynamic) · ไม่มียอด = 11 (static)', promptPayPayload('0812345678', 10).indexOf('010212') === 6 && promptPayPayload('0812345678').indexOf('010211') === 6);

  // ── 8b. ตัวสร้าง QR ───────────────────────────────────────────────────
  ok('Reed–Solomon ตรงกับตัวอย่างมาตรฐาน (HELLO WORLD 1-M · 10 EC codewords)',
    rsRemainder([32, 91, 11, 120, 209, 114, 220, 77, 67, 64, 236, 17, 236, 17, 236, 17], 10).join() === '196,35,39,119,235,215,231,226,93,23');
  const q = qrEncode(QR_SNAP.payload);
  ok('ตาราง QR ของ payload พร้อมเพย์ตรงกับตารางที่ตรวจกับตัวสร้างอิสระแล้ว ทุกโมดูล', q.version === QR_SNAP.version && q.mask === QR_SNAP.mask &&
    q.modules.map(r => r.map(Number).join('')).join() === QR_SNAP.rows.join(), 'v' + q.version + ' mask ' + q.mask);
  ok('payload ยาวสุดของพร้อมเพย์ยังเป็น QR ได้ · ยาวเกินถูกปฏิเสธพร้อมข้อความ', qrEncode(promptPayPayload('1111111111111', '99999999.99')).version <= 10 &&
    (() => { try { qrEncode('x'.repeat(300)); return false; } catch (e) { return /ยาวเกิน/.test(e.message); } })());

  // ── 8c. หน้า QR รับเงิน + ปุ่มในหน้าขาย ───────────────────────────────────
  showSection('pos');
  cart = [{ product_id: 'p1', name: 'DDJ-FLX4', sku: 'PIO-DDJ-FLX4', qty: 1, unit_price: 12900 }];
  $('discountInput').value = '900';
  renderCart();
  $('posPayQrBtn').click();
  await sleep(100);
  ok('ปุ่ม "QR พร้อมเพย์ — ยอดบิลนี้" ใส่ยอดสุทธิของบิลให้ (12,900 − 900)', $('payDialog').open && pay.mode === 'promptpay' && $('payAmt').value === '12000.00', $('payAmt').value);
  const svg = document.querySelector('#payStage svg.qr-svg');
  const wantD = qrSvg(promptPayPayload('0000000000', '12000.00')).match(/<path d="([^"]+)"/)[1];
  ok('QR ที่โชว์คือ payload ของยอดนั้นพอดี', !!svg && svg.querySelector('path').getAttribute('d') === wantD);
  ok('โชว์ยอดเป็นตัวหนังสือใหญ่ + ชื่อที่ตั้งไว้ + เลขพร้อมเพย์แบบซ่อนบางส่วน', txt('payStage').indexOf('฿12,000.00') !== -1 &&
    txt('payStage').indexOf('ตัวอย่างทดสอบ — ไม่ใช่บัญชีจริง') !== -1 && txt('payStage').indexOf('···0000') !== -1, txt('payStage'));
  ok('QR ใหญ่ (≥ 300px) ขาวดำ', svg.getBoundingClientRect().width >= 300);
  $('payAmt').value = '-3'; payAmountInput('-3');
  ok('พิมพ์ยอดผิด → บอกตรง ๆ ไม่สร้าง QR', !document.querySelector('#payStage svg') && /ยอดเงินไม่ถูกต้อง/.test(txt('payStage')));
  $('payAmt').value = ''; payAmountInput('');
  ok('เว้นยอดว่าง = QR ไม่ระบุยอด (static) บอกให้ลูกค้ากรอกเอง', !!document.querySelector('#payStage svg') && /ไม่ระบุยอด/.test(txt('payStage')));
  setPayMode('image');
  await sleep(100);
  const sign = CALLS.find(c => c.op === 'sign');
  ok('โหมดรูป QR บัญชี: ขอ signed URL จากถังปิด payment-qr แล้วโชว์รูปพร้อมชื่อกำกับ', !!sign && sign.bucket === 'payment-qr' && sign.path === 'q1.webp' &&
    !!document.querySelector('#payStage img.pay-img') && txt('payStage').indexOf('กสิกร · บัญชีทดสอบ') !== -1);
  ok('เจ้าของร้านเห็นปุ่ม "ตั้งค่าการรับเงิน" ในหน้า QR', vis('paySetBtn'));
  $('payDialog').close();
  cart = []; $('discountInput').value = ''; renderCart();

  // ── 8d. ตั้งค่าการรับเงิน (เจ้าของร้าน) ───────────────────────────────────
  await openPaySettings();
  ok('หน้าตั้งค่าการรับเงินอ่านค่าปัจจุบัน', $('paySetDialog').open && $('psId').value === '0000000000' && $('psName').value.indexOf('ตัวอย่างทดสอบ') === 0);
  $('psId').value = '081-23'; renderPayIdHint();
  CALLS.length = 0;
  await savePaySettings();
  ok('เลขพร้อมเพย์ผิดรูปถูกปฏิเสธ ไม่มีอะไรบันทึก', !CALLS.some(c => c.op === 'update'));
  $('psId').value = '081-234-5678';
  pickPayDefault('image');
  await savePaySettings();
  const ps = CALLS.find(c => c.op === 'update' && c.table === 'staff_settings');
  ok('บันทึกเลขแบบตัวเลขล้วน + ชื่อ + โหมดตั้งต้น ลง staff_settings', !!ps && ps.payload.promptpay_id === '0812345678' && ps.payload.pay_default_mode === 'image' &&
    ps.payload.pay_name.indexOf('ตัวอย่างทดสอบ') === 0, JSON.stringify(ps && ps.payload));
  await openPaySettings();
  const cv = document.createElement('canvas'); cv.width = 60; cv.height = 60;
  const g2 = cv.getContext('2d'); g2.fillStyle = '#fff'; g2.fillRect(0, 0, 60, 60); g2.fillStyle = '#000'; g2.fillRect(5, 5, 20, 20);
  const png = await new Promise(r => cv.toBlob(r, 'image/png'));
  const dt = new DataTransfer(); dt.items.add(new File([png], 'qr.png', { type: 'image/png' }));
  $('psImgFile').files = dt.files;
  $('psImgLabel').value = 'ไทยพาณิชย์ · บัญชีทดสอบ';
  CALLS.length = 0;
  const upOk = await uploadPayQr();
  const upI = CALLS.findIndex(c => c.op === 'upload'), stI = CALLS.findIndex(c => c.op === 'update' && c.table === 'staff_settings');
  ok('อัปโหลดรูป QR: ย่อที่เครื่องแล้วขึ้นถัง payment-qr ก่อน แล้วค่อยเพิ่มลงรายการ', upOk && upI !== -1 && stI > upI && CALLS[upI].bucket === 'payment-qr' &&
    /^(image\\/webp|image\\/jpeg)$/.test(CALLS[upI].type) && CALLS[stI].payload.pay_qr_images.length === 2 &&
    CALLS[stI].payload.pay_qr_images[1].label === 'ไทยพาณิชย์ · บัญชีทดสอบ' && CALLS[stI].payload.pay_qr_images[1].path === CALLS[upI].path, JSON.stringify(CALLS.map(c => c.op)));
  CALLS.length = 0;
  removePayQr('q1');
  await runConfirm();
  await sleep(50);
  const rmU = CALLS.findIndex(c => c.op === 'update'), rmR = CALLS.findIndex(c => c.op === 'remove');
  ok('เอารูปออก: ถอดจากรายการก่อน แล้วค่อยลบไฟล์', rmU !== -1 && rmR > rmU && CALLS[rmR].paths[0] === 'q1.webp' && CALLS[rmU].payload.pay_qr_images.every(x => x.id !== 'q1'));
  $('paySetDialog').close();

  // ── 2b. ยังไม่ได้รัน 031 → ใช้สีเดิม ไม่ขึ้นแถบแดง ──────────────────────────
  DISPLAY_ERR = { code: 'PGRST202', message: 'Could not find the function public.staff_display_settings' };
  await loadDisplaySettings();
  ok('ยังไม่ได้รัน 031: ไม่ขึ้นแถบแดง หน้า QR บอกว่าระบบยังไม่พร้อม', !$('fatalError') && payState.missing === true);
  DISPLAY_ERR = null;
  await loadDisplaySettings();

  // ── 4. เครื่องคิดเลข: ตัวคำนวณ ──────────────────────────────────────────
  const E = s => calcEval(s);
  ok('ไม่ใช้ eval / new Function ในหน้าเว็บ', !/\\beval\\s*\\(|new Function\\s*\\(/.test(document.documentElement.innerHTML.replace(/<script>window.addEventListener\\('load'[\\s\\S]*$/, '')));
  ok('× ÷ ก่อน + − : 2+3×4 = 14 · 2×3+4 = 10 · 10−4÷2 = 8', E('2+3×4').value === 14 && E('2×3+4').value === 10 && E('10−4÷2').value === 8);
  ok('ซ้ายไปขวาในลำดับเดียวกัน: 100÷10÷2 = 5 · 10−3−2 = 5', E('100÷10÷2').value === 5 && E('10-3-2').value === 5);
  ok('ทศนิยมลอยถูกปัด: 0.1+0.2 = 0.3 · 1÷3 = 0.3333333333', E('0.1+0.2').value === 0.3 && E('1/3').value === 0.3333333333);
  ok('% หน้าร้าน: 200+10% = 220 · 200−10% = 180 · 200×10% = 20 · 50% = 0.5', E('200+10%').value === 220 && E('200−10%').value === 180 && E('200×10%').value === 20 && E('50%').value === 0.5);
  ok('% ใช้กับผลรวมก่อนหน้า: 100+50+10% = 165', E('100+50+10%').value === 165, E('100+50+10%').value);
  ok('ลบหน้าตัวเลข (±): -5+3 = -2 · 2×-3 = -6 · 5--3 = 8', E('-5+3').value === -2 && E('2*-3').value === -6 && E('5--3').value === 8);
  ok('หารด้วยศูนย์ = ข้อผิดพลาดที่อ่านรู้เรื่อง ไม่ใช่ Infinity', E('5÷0').ok === false && /หารด้วยศูนย์/.test(E('5÷0').error) && E('5÷(0)').ok === false);
  ok('สูตรไม่จบ/ผิดรูปไม่ทำให้พัง', E('5+').ok === false && E('×5').ok === false && E('1..2').ok === false && E('').ok === false);

  // ── 4b. เครื่องคิดเลข: ปุ่ม · คีย์บอร์ด · ประวัติ ──────────────────────────
  showSection('pos');
  const scan = $('posSearch');
  scan.focus();
  const altK = typeKey('KeyK', { altKey: true, key: 'k' });
  ok('Alt+K เปิดเครื่องคิดเลข แผงได้โฟกัส', vis('calcPanel') && $('calcPanel').contains(document.activeElement) && altK.defaultPrevented);
  ok('จำว่าเปิดไว้ในเครื่องนี้ (localStorage)', JSON.parse(localStorage.getItem('djlab.desk.calc.v1')).open === true);
  ['Digit1', 'Digit2', 'NumpadAdd', 'Digit3', 'NumpadMultiply', 'Digit2'].forEach(c => typeKey(c));
  ok('พิมพ์จากแป้น (อ่าน event.code — แป้นไทยก็ได้): 12 + 3 × 2', txt('calcExpr') === '12 + 3 × 2' && txt('calcOut') === '= 18', txt('calcExpr') + ' | ' + txt('calcOut'));
  typeKey('Enter', { key: 'Enter' });
  ok('Enter = ผลลัพธ์ 18 · ลงประวัติ', txt('calcOut') === '18' && calc.history[0].value === 18 && vis('calcHist'));
  const cartBefore = JSON.stringify(cart);
  typeKey('Minus', { key: '-' });
  ok('กด − ในเครื่องคิดเลขไม่ไปลดจำนวนในตะกร้า (คีย์ลัดของหน้าขาย)', JSON.stringify(cart) === cartBefore && calc.expr === '18-');
  typeKey('Digit5'); typeKey('Digit0'); typeKey('Digit5', { shiftKey: true, key: '%' });
  typeKey('NumpadEnter', { key: 'Enter' });
  ok('18 − 50% = 9 (Shift+5 = %)', calc.result === 9, calc.result);
  ['AC', '5', '−', '3', '±', '='].forEach(k => calcInput(k));
  ok('± สลับเครื่องหมายตัวเลขล่าสุด: 5 − (−3) = 8', calc.result === 8 && txt('calcExpr') === '5 − (−3) =', txt('calcExpr'));
  ['AC', '1', '2', '3', '⌫'].forEach(k => calcInput(k));
  ok('⌫ ลบทีละตัว', calc.expr === '12');
  ['+', '4', '5', 'C'].forEach(k => calcInput(k));
  ok('C ล้างเฉพาะตัวเลขที่กำลังพิมพ์', calc.expr === '12+');
  calcInput('AC');
  ok('AC ล้างทั้งหมด', calc.expr === '' && txt('calcOut') === '0');
  ['7', '÷', '0', '='].forEach(k => calcInput(k));
  ok('หารศูนย์จากปุ่ม: ขึ้นข้อความ ไม่มีแถบแดงของระบบ', /หารด้วยศูนย์/.test(txt('calcOut')) && !$('fatalError'));
  calcInput('4');
  ok('กดตัวเลขหลังผิดพลาด = เริ่มใหม่', calc.expr === '4' && !calc.error);
  for (let i = 1; i <= 6; i++) { calcInput('AC'); calcInput(String(i)); calcInput('+'); calcInput('1'); calcInput('='); }
  ok('ประวัติเก็บ 5 รายการล่าสุด ใหม่สุดก่อน', calc.history.length === 5 && calc.history[0].value === 7 && calc.history[4].value === 3,
    calc.history.map(h => h.value).join());
  document.querySelectorAll('#calcHist .calc-h')[2].click();
  ok('กดประวัติ = เอาผลนั้นมาคิดต่อ', calc.expr === '5');
  calc.done = true; calc.result = 1234.5;
  let copied = null;
  Object.defineProperty(navigator, 'clipboard', { configurable: true, value: { writeText: async v => { copied = v; } } });
  await copyCalc();
  ok('คัดลอกผลลัพธ์เป็นตัวเลขล้วน (วางในช่องราคาได้)', copied === '1234.5', copied);
  $('calcPanel').focus();
  typeKey('Escape', { key: 'Escape' });
  ok('Esc ปิด แล้วโฟกัสกลับช่องยิงของหน้าขาย', !vis('calcPanel') && document.activeElement === scan && JSON.parse(localStorage.getItem('djlab.desk.calc.v1')).open === false,
    document.activeElement.id);
  ok('หน้าคีย์ลัด (?) มี Alt+K เครื่องคิดเลข', txt('helpDialog').indexOf('เครื่องคิดเลข') !== -1 && /Alt\\s*\\+\\s*K/.test(txt('helpDialog')));
  const free = SECTIONS.every(s => s.key !== 'K');
  ok('Alt+K ไม่ชนกับคีย์ลัดหมวดไหน', free);

  // ── 4c. ยิงบาร์โค้ดตอนเครื่องคิดเลขโฟกัสอยู่ ───────────────────────────────
  openCalc(true);
  ['AC', '1', '2'].forEach(k => calcInput(k));
  typeKey('Digit3');                      // คนพิมพ์ 3 ช้า ๆ ก่อน
  const histN = calc.history.length;
  cart = []; renderCart();
  const enter = burst(digits('619659216054'), { target: $('calcPanel') });
  await sleep(150);
  ok('ยิงบาร์โค้ดตอนเครื่องคิดเลขโฟกัส: ตัวเลขของการยิงไม่ค้างในเครื่องคิดเลข (กลับเป็น 123)', calc.expr === '123' && txt('calcExpr') === '123', calc.expr);
  ok('Enter ของการยิงไม่กลายเป็น = (ประวัติไม่เพิ่ม)', calc.history.length === histN && enter.defaultPrevented);
  ok('รหัสไปที่ปลายทางของหมวด (ตะกร้าหน้าขาย) เหมือนปกติ', cart.length === 1 && cart[0].product_id === 'p1', JSON.stringify(cart));
  showSection('calendar');
  openCalc(true);
  burst(digits('619659216054'), { target: $('calcPanel') });
  await sleep(100);
  ok('หมวดที่ไม่รับการยิง (ปฏิทิน): บอกตามเดิม · เครื่องคิดเลขไม่ถูกแตะ', calc.expr === '123' && /เครื่องยิงบาร์โค้ดใช้ได้ในหมวด/.test(txt('toast')), txt('toast'));
  closeCalc(false);
  cart = []; renderCart();

  // ── 4d. ไม่ทับหน้าต่างวิดีโอ (1440) ──────────────────────────────────────
  showSection('bills');
  await ytPlayUrl('https://youtu.be/jNQXAC9IVRw', 'ทดสอบ');
  await sleep(150);
  const overlap = (a, b) => a.left < b.right && a.right > b.left && a.top < b.bottom && a.bottom > b.top;
  const P = () => $('player').getBoundingClientRect();
  ok('1440: ตำแหน่งตั้งต้นของหน้าต่างวิดีโอไม่ทับปุ่มเครื่องคิดเลข', vis('player') && !overlap(P(), $('calcBtn').getBoundingClientRect()), JSON.stringify(P()));
  openCalc(false);
  await sleep(50);
  ok('1440: เปิดเครื่องคิดเลขแล้ว หน้าต่างวิดีโอหลบ ไม่ทับทั้งปุ่มและแผง', !overlap(P(), $('calcBtn').getBoundingClientRect()) && !overlap(P(), $('calcPanel').getBoundingClientRect()),
    JSON.stringify([P(), $('calcPanel').getBoundingClientRect()]));
  closeCalc(false);
  closePlayer();

  L('=== สรุป: ' + pass + ' PASS / ' + fail + ' FAIL ===');
  L(fail ? 'RESULT:FAIL' : 'RESULT:PASS');
}
</script>`;

// พนักงาน: แก้สีปฏิทิน/การรับเงินไม่ได้ · อัปโหลดรูป QR ไม่ได้ · แต่เห็น QR ได้
const STAFF = `<script>
window.addEventListener('load', () => setTimeout(runTests, 300));
${COMMON}
async function runTests() {
  L('=== พนักงาน: ดู QR ได้ แก้การตั้งค่าไม่ได้ ===');
  localStorage.removeItem('djlab.desk.accounts.v1');
  await login('zen');
  ok('เข้าในฐานะพนักงาน', currentAdmin.role === 'staff');
  showSection('calendar');
  await sleep(200);
  ok('พนักงานไม่เห็นปุ่ม "ตั้งค่าสีปฏิทิน"', !vis('gcalSetupBtn'));
  ok('พนักงานได้สีที่เจ้าของตั้งผ่านฟังก์ชันอ่าน (อ่านตารางตั้งค่าเองไม่ได้)', calState.calColors.class === '#1B5E20' &&
    cs([...document.querySelectorAll('#calLegend .chip')].find(c => c.textContent === 'คลาสเรียน')).backgroundColor === rgb('#1B5E20'));
  CALLS.length = 0;
  await openGcalSettings();
  ok('พนักงานเรียกหน้าตั้งค่าสีตรง ๆ → ไม่เปิด', !$('gcalDialog').open);
  await saveGcalSettings();
  ok('พนักงานเรียกบันทึกสีตรง ๆ → ไม่มีอะไรถูกเขียน', !CALLS.some(c => c.op === 'update'));
  await openPayQr(null);
  ok('พนักงานเปิดหน้า QR รับเงินได้ (เห็น QR)', $('payDialog').open && !!document.querySelector('#payStage svg.qr-svg'));
  ok('พนักงานไม่เห็นปุ่มตั้งค่าการรับเงิน', !vis('paySetBtn'));
  $('payDialog').close();
  await openPaySettings();
  ok('พนักงานเรียกหน้าตั้งค่าการรับเงินตรง ๆ → ไม่เปิด', !$('paySetDialog').open);
  CALLS.length = 0;
  $('psImgLabel').value = 'แอบใส่';
  const r = await uploadPayQr();
  await savePaySettings();
  removePayQr('q1');
  ok('พนักงานเรียกอัปโหลด/บันทึก/เอารูปออกตรง ๆ → ไม่มีอะไรขึ้นถังหรือถูกเขียน', r === false && !CALLS.some(c => ['upload', 'remove', 'update'].includes(c.op)) && !$('confirmDialog').open);
  payState.promptpayId = ''; payState.images = [];
  await openPayQr('promptpay');
  ok('ยังไม่ได้ตั้งค่า: หน้าบอกให้แจ้งเจ้าของร้าน (ไม่ใช่ error)', /ยังไม่ได้ตั้งค่าพร้อมเพย์/.test(txt('payBody')) && /แจ้งเจ้าของร้าน/.test(txt('payBody')) && !$('fatalError'));
  $('payDialog').close();
  L('=== สรุป: ' + pass + ' PASS / ' + fail + ' FAIL ===');
  L(fail ? 'RESULT:FAIL' : 'RESULT:PASS');
}
</script>`;

// 1280 กว้าง: หน้าต่างวิดีโอกับเครื่องคิดเลข · เปิดหน้าใหม่ที่จำว่าเครื่องคิดเลขเปิดอยู่
const W1280 = `<script>
window.addEventListener('load', () => setTimeout(runTests, 300));
${COMMON}
async function runTests() {
  L('=== 1280: เครื่องคิดเลขเปิดค้างจากครั้งก่อน · ไม่ทับหน้าต่างวิดีโอ ===');
  ok('หน้าจอแคบ (≤ 1280)', innerWidth <= 1280, innerWidth);
  ok('จำไว้ว่าเปิดอยู่ → เปิดหน้าใหม่แล้วแผงเปิดรอ', vis('calcPanel') && $('calcBtn').getAttribute('aria-expanded') === 'true');
  await login('tibass');
  ok('เปิดค้างไว้ไม่แย่งโฟกัส (ช่องของหมวดยังได้โฟกัสตามปกติ)', !$('calcPanel').contains(document.activeElement), document.activeElement.id);
  showSection('pos');
  await ytPlayUrl('https://youtu.be/jNQXAC9IVRw', 'ทดสอบ');
  await sleep(150);
  const overlap = (a, b) => a.left < b.right && a.right > b.left && a.top < b.bottom && a.bottom > b.top;
  const P = () => $('player').getBoundingClientRect();
  ok('1280: หน้าต่างวิดีโอไม่ทับปุ่มและแผงเครื่องคิดเลข', !overlap(P(), $('calcBtn').getBoundingClientRect()) && !overlap(P(), $('calcPanel').getBoundingClientRect()),
    JSON.stringify([P(), $('calcPanel').getBoundingClientRect()]));
  ok('1280: หน้าต่างวิดีโออยู่ในจอทั้งบาน', P().left >= 0 && P().top >= 0 && P().right <= innerWidth && P().bottom <= innerHeight);
  const bar = $('playerBar'), r0 = P();
  const ptr = (type, x, y) => bar.dispatchEvent(new PointerEvent(type, { pointerId: 7, button: 0, buttons: type === 'pointerup' ? 0 : 1, clientX: x, clientY: y, bubbles: true, cancelable: true }));
  ptr('pointerdown', r0.left + 10, r0.top + 10); ptr('pointermove', innerWidth - 5, innerHeight - 5); ptr('pointerup', innerWidth - 5, innerHeight - 5);
  ok('1280: ลากหน้าต่างวิดีโอเข้ามุมเครื่องคิดเลข → หยุดก่อนทับ', !overlap(P(), $('calcBtn').getBoundingClientRect()) && !overlap(P(), $('calcPanel').getBoundingClientRect()),
    JSON.stringify(P()));
  closeCalc(false);
  ok('ปิดแผงแล้ว หน้าต่างวิดีโอก็ยังไม่ทับปุ่ม', !overlap(P(), $('calcBtn').getBoundingClientRect()));
  closePlayer();
  L('=== สรุป: ' + pass + ' PASS / ' + fail + ' FAIL ===');
  L(fail ? 'RESULT:FAIL' : 'RESULT:PASS');
}
</script>`;

// stock.html: โลโก้บนหัวสีดำ · หัวแผงแบบ B · โทเคนชุดเดียวกับ desk
const STOCK_MOCK = `<script>
const CALLS = [];
function builder() { const q = { select() { return q; }, eq() { return q; }, in() { return q; }, order() { return q; }, limit() { return q; },
  async maybeSingle() { return { data: null, error: null }; }, then(res, rej) { return Promise.resolve({ data: [], error: null }).then(res, rej); } }; return q; }
window.supabase = { createClient: () => ({ from: builder, channel: () => ({ on() { return this; }, subscribe() { return this; } }),
  storage: { from: () => ({ getPublicUrl: p => ({ data: { publicUrl: p } }) }) },
  auth: { async getSession() { return { data: { session: null } }; }, onAuthStateChange() {}, async signOut() { return { error: null }; } } }) };
</script>`;
const STOCK = `<script>
window.addEventListener('load', () => setTimeout(runTests, 300));
${COMMON}
async function runTests() {
  L('=== stock.html: โลโก้ · หัวแผงแบบ B ===');
  const hdr = document.querySelector('.header'), img = hdr.querySelector('img.logo-img');
  ok('หัวสีดำใช้โลโก้ทางการชุดเดียวกับคอนโซล ไม่มีกล่องแดง DJ LAB', !!img && img.getAttribute('src') === 'logo-full-dark.png' && /@2x\\.png 2x/.test(img.getAttribute('srcset')) &&
    !hdr.querySelector('.logo-box') && hdr.textContent.indexOf('DJ LAB') === -1);
  const ct = document.querySelector('#pageDashboard .card-title');
  ok('หัวการ์ดแบบ B: พื้น #E3DFD5 + เส้นดำ 2px เต็มความกว้างการ์ด', cs(ct).backgroundColor === HEAD && cs(ct).borderBottomWidth === '2px' &&
    Math.abs(ct.getBoundingClientRect().width - ct.parentElement.getBoundingClientRect().width) <= 2, cs(ct).backgroundColor);
  ok('ตัวหนังสือบนหัวการ์ดอ่านได้ ≥ 4.5:1', ratio(cs(ct).color, HEAD) >= 4.5);
  const t3 = cs(document.documentElement).getPropertyValue('--text3').trim();
  ok('--text3 ชุดเดียวกับ desk (≥ 4.5:1)', t3.toUpperCase() === '#6E6B64' && ratio(rgb(t3), 'rgb(255, 255, 255)') >= 4.5);
  ok('ตัวเลขสถิติน้ำหนัก 600 เท่ากับ desk', cs(document.querySelector('.stat-value')).fontWeight === '600');
  L('=== สรุป: ' + pass + ' PASS / ' + fail + ' FAIL ===');
  L(fail ? 'RESULT:FAIL' : 'RESULT:PASS');
}
</script>`;

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  // ไฟล์โลโก้: หน้าที่ถูกเทสต์ถูกก๊อปไปโฟลเดอร์ชั่วคราว รูปข้าง ๆ จึงตรวจที่นี่แทน (PNG · RGBA · ขนาด 1× / 2×)
  const { readFileSync, existsSync } = await import('node:fs');
  let nP = 0, nF = 0;
  for (const [f, w, h] of [['logo-full-dark.png', 122, 40], ['logo-full-dark@2x.png', 244, 80]]) {
    const p = join(root, f), b = existsSync(p) ? readFileSync(p) : null;
    const good = !!b && b.slice(1, 4).toString() === 'PNG' && b.readUInt32BE(16) === w && b.readUInt32BE(20) === h && b[25] === 6;
    console.log('  [' + (good ? 'PASS' : 'FAIL') + '] ไฟล์โลโก้ ' + f + ' เป็น PNG โปร่งใส ' + w + '×' + h);
    good ? nP++ : nF++;
  }
  const net = '--host-resolver-rules=MAP * ~NOTFOUND';
  const mock = MOCK3 + EXTRA;
  const a = runPage({ root, file: 'desk.html', mock, tests: TESTS, flags: [net, '--window-size=1440,900'] });
  const b = runPage({ root, file: 'desk.html', mock, tests: STAFF, flags: [net, '--window-size=1440,900'] });
  const c = runPage({ root, file: 'desk.html', tests: W1280, flags: [net, '--window-size=1280,800'],
    mock: mock + `<script>localStorage.setItem('djlab.desk.calc.v1', JSON.stringify({ open: true })); localStorage.removeItem('djlab.desk.miniPos.v1');</script>` });
  const d = runPage({ root, file: 'stock.html', mock: STOCK_MOCK, tests: STOCK, flags: [net, '--window-size=1280,800'] });
  process.exit(a.ok && b.ok && c.ok && d.ok && !nF ? 0 : 1);
}
