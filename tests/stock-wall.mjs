/**
 * เทสต์ผนังสต็อกใน desk.html (หมวดสินค้า · Brand Wings — 1 ต.ค. 69)
 *   รัน: node tests/stock-wall.mjs
 *
 * วิธีเดียวกับชุดอื่น: ไฟล์จริงทุกบรรทัด สลับเฉพาะแท็ก Supabase เป็นตัวปลอมที่จดทุกการเขียน
 * (insert / update / delete / upsert / upload / remove) ไว้ใน CALLS
 *
 * สิ่งที่ห้ามพลาดและชุดนี้พิสูจน์:
 *   - รับเข้า: ลง product_units ก่อน stock_movements เสมอ · ซีเรียลซ้ำไม่มีอะไรลงเลย
 *   - นับ: ลงเฉพาะรุ่นที่ไม่ตรง เป็นรายการ "ปรับยอด" · ไม่มี update/delete ของ stock_movements
 *   - รูปสินค้า: ขึ้นถัง product-images แล้วค่อยชี้ image_path · พนักงานไม่เห็นและทำไม่ได้
 *   - บล็อกเครื่องยิงบาร์โค้ดในสามไฟล์ยังเหมือนกันทุกตัวอักษร (กฎข้อ 10)
 */

import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { runPage, HARNESS } from './lib/page-test.mjs';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');

// ── 0. บล็อกเครื่องยิงบาร์โค้ด stock / sales / desk ต้องเหมือนกัน (ตรวจที่ node ไม่ต้องเปิดเบราว์เซอร์) ──
// ส่วนที่ต้องเหมือน: ค่าคงที่ · wedgeChar · wedgeSnap · wedgeRestore · ตัวฟัง keydown
// (wedgeRoute / onWedgeScan / openScanPanel ต่างกันตามหน้าที่ของแต่ละหน้าโดยตั้งใจ)
let nodePass = 0, nodeFail = 0;
function nodeOk(name, cond, extra) {
  if (cond) { nodePass++; console.log('  [PASS] ' + name); }
  else { nodeFail++; console.log('  [FAIL] ' + name + (extra ? ' — ' + extra : '')); }
}
function wedgeParts(file) {
  const src = readFileSync(join(root, file), 'utf8').replace(/\r\n/g, '\n');
  const a = src.indexOf('const WEDGE_ENABLED');
  const b = src.indexOf('\n}\n', src.indexOf('function wedgeRestore(')) + 3;
  const c = src.indexOf("document.addEventListener('keydown', e => {\n  if (!WEDGE_ENABLED) return;");
  const d = src.indexOf('}, true);', c) + 9;
  if (a < 0 || b < 3 || c < 0 || d < 9) return null;
  // เทียบเฉพาะโค้ด — comment ของ sales.html เขียนสั้นกว่าอีกสองไฟล์มาแต่แรก (ความหมายเดียวกัน)
  return (src.slice(a, b) + '\n' + src.slice(c, d)).split('\n')
    .map(l => l.replace(/\s*\/\/.*$/, '').trim()).filter(Boolean).join('\n');
}
console.log('  === บล็อกเครื่องยิงบาร์โค้ด (กฎข้อ 10) ===');
const W = ['stock.html', 'sales.html', 'desk.html'].map(f => ({ f, t: wedgeParts(f) }));
nodeOk('หาบล็อกเครื่องยิงเจอครบทั้งสามไฟล์', W.every(x => x.t), W.filter(x => !x.t).map(x => x.f).join());
nodeOk('stock.html กับ desk.html โค้ดเหมือนกันทุกตัวอักษร', W[0].t && W[0].t === W[2].t);
nodeOk('sales.html กับ desk.html โค้ดเหมือนกันทุกตัวอักษร', W[1].t && W[1].t === W[2].t);
// ลายเส้นแทนรูป (SIL) ต้องเป็นชุดเดียวกันทั้งคอมและมือถือ — ของชิ้นเดียวกันไม่ควรหน้าตาต่างกันตามจอ
const silOf = f => (readFileSync(join(root, f), 'utf8').replace(/\r\n/g, '\n').match(/const SIL = \{[\s\S]*?\n\};/) || [''])[0];
nodeOk('ลายเส้นแทนรูป (SIL) ของ desk.html กับ stock.html เหมือนกันทุกตัวอักษร', silOf('desk.html') && silOf('desk.html') === silOf('stock.html'));

const MOCK = `<script>
const CALLS = [];
const FAKE = {
  admins: [
    { id: 'u1', full_name: 'เจ้าของร้าน', role: 'owner', is_active: true },
    { id: 'u2', full_name: 'พนักงานหน้าร้าน', role: 'staff', is_active: true },
  ],
  // หมวดปนกันแบบข้อมูลจริง: อังกฤษ (ที่รู้จัก) · ไทย · ตัวพิมพ์ใหญ่ · หมวดที่ไม่รู้จัก · ไม่ระบุ
  products: [
    { id: 'p1', sku: 'PIO-DDJ-FLX4', name: 'DDJ-FLX4', brand: 'Pioneer DJ', category: 'controller',
      barcode_ean13: '619659216054', sell_price: 12900, reorder_point: 1, is_active: true, image_path: null },
    { id: 'p2', sku: 'NEO-USB-B1', name: 'NEO USB Class B 1.0m', brand: 'NEO by OYAIDE', category: 'cable',
      barcode_ean13: '4944711000011', sell_price: 2490, reorder_point: 5, is_active: true, image_path: null },
    { id: 'p3', sku: 'APT-OMNIS-DUO', name: 'OMNIS-DUO', brand: 'AlphaTheta', category: 'คอนโทรลเลอร์',
      barcode_ean13: null, sell_price: 45900, reorder_point: 1, is_active: false, image_path: null },
    { id: 'p4', sku: 'APT-DJM-V5', name: 'DJM-V5', brand: 'AlphaTheta', category: 'mixer',
      barcode_ean13: '4573201241234', sell_price: 89900, reorder_point: 1, is_active: true, image_path: 'p4/old.webp' },
    { id: 'p5', sku: 'APT-CDJ-3000X', name: 'CDJ-3000X', brand: 'AlphaTheta', category: 'player',
      barcode_ean13: null, sell_price: 109000, reorder_point: 1, is_active: true, image_path: null },
    { id: 'p6', sku: 'PIO-PLX-1000', name: 'PLX-1000', brand: 'Pioneer DJ', category: 'Turntable',
      barcode_ean13: null, sell_price: 27900, reorder_point: 1, is_active: true, image_path: null },
    { id: 'p7', sku: 'OTH-BAG', name: 'กระเป๋าหูฟัง', brand: 'Other', category: 'dj-bag',
      barcode_ean13: null, sell_price: 500, reorder_point: 0, is_active: true, image_path: null },
    { id: 'p8', sku: 'OTH-HP25', name: 'HP25', brand: 'Other', category: null,
      barcode_ean13: null, sell_price: 6500, reorder_point: 1, is_active: true, image_path: null },
    { id: 'p9', sku: 'PIO-DJM-S11', name: 'DJM-S11', brand: 'Pioneer DJ', category: 'mixer',
      barcode_ean13: null, sell_price: 85900, reorder_point: 1, is_active: true, image_path: null },
  ],
  product_stock_levels: [
    { product_id: 'p1', current_qty: 5 }, { product_id: 'p2', current_qty: 2 }, { product_id: 'p4', current_qty: 0 },
    { product_id: 'p5', current_qty: 4 }, { product_id: 'p6', current_qty: 3 }, { product_id: 'p7', current_qty: 1 },
    { product_id: 'p8', current_qty: 6 }, { product_id: 'p9', current_qty: 1 },
  ],
  product_units: [
    { id: 'u-a', product_id: 'p1', serial_no: 'CHMP123354NN', barcode_code: 'CHMP123354NN', status: 'in_stock', received_at: '2026-09-01T10:00:00Z' },
    { id: 'u-b', product_id: 'p1', serial_no: 'CHMP555555NN', barcode_code: 'CHMP555555NN', status: 'in_stock', received_at: '2026-09-02T10:00:00Z' },
    { id: 'u-c', product_id: 'p1', serial_no: 'CHMP999999NN', barcode_code: 'CHMP999999NN', status: 'sold', received_at: '2026-08-01T10:00:00Z' },
    { id: 'u-d', product_id: 'p9', serial_no: 'S11SER001', barcode_code: 'S11SER001', status: 'in_stock', received_at: '2026-09-03T10:00:00Z' },
  ],
  stock_movements: [
    { id: 'm1', product_id: 'p1', type: 'in', qty: 5, reason: 'รับของ', created_at: '2026-09-01T10:00:00Z',
      admin_id: 'u1', ref_sale_id: null, products: { name: 'DDJ-FLX4', sku: 'PIO-DDJ-FLX4' }, admins: { full_name: 'เจ้าของร้าน' } },
  ],
  customers: [], sales: [], sale_items: [],
};
// ซีเรียลที่ "อีกเครื่องเพิ่งลงไปก่อนเรากดยืนยัน" — ตรวจตอนยิงผ่าน แต่ฐานข้อมูลปฏิเสธตอน insert
const RACE = ['DUPSER01'];
function builder(table) {
  const q = {
    _rows: (FAKE[table] || []).slice(), _err: null,
    select() { return q; },
    eq(col, val) { q._rows = q._rows.filter(r => r[col] === val); return q; },
    in(col, vals) { q._rows = q._rows.filter(r => vals.includes(r[col])); CALLS.push({ op: 'in', table, col, vals }); return q; },
    is() { return q; }, neq() { return q; }, not() { return q; }, or() { return q; }, ilike() { return q; },
    order() { return q; }, gte() { return q; }, lte() { return q; }, lt() { return q; }, gt() { return q; },
    limit() { return q; }, range() { return q; }, contains() { return q; },
    async maybeSingle() { return { data: q._rows[0] || null, error: null }; },
    async single() { return { data: q._rows[0] || null, error: null }; },
    then(res, rej) { return Promise.resolve(q._err ? { data: null, error: q._err } : { data: q._rows, error: null }).then(res, rej); },
    insert(payload) {
      CALLS.push({ op: 'insert', table, payload });
      const rows = Array.isArray(payload) ? payload : [payload];
      if (table === 'product_units' && rows.some(r => RACE.includes(r.serial_no))) {
        rows.filter(r => RACE.includes(r.serial_no)).forEach(r =>
          FAKE.product_units.push({ id: 'race', product_id: 'p6', serial_no: r.serial_no, barcode_code: r.serial_no, status: 'in_stock', received_at: '2026-10-01T01:00:00Z' }));
        q._err = { code: '23505', message: 'duplicate key value violates unique constraint "product_units_serial_no_key"' };
      }
      return q;
    },
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
    rpc: async (fn, args) => { CALLS.push({ op: 'rpc', fn, args }); return { data: null, error: null }; },
    channel: () => ({ on() { return this; }, subscribe() { return this; } }),
    storage: { from: bucket => ({
      async upload(path, blob, opts) { CALLS.push({ op: 'upload', bucket, path, blob, opts }); return { data: { path }, error: null }; },
      async remove(paths) { CALLS.push({ op: 'remove', bucket, paths }); return { data: [], error: null }; },
      getPublicUrl(path) { return { data: { publicUrl: 'https://img.test/' + bucket + '/' + path } }; },
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
const sleep = ms => new Promise(r => setTimeout(r, ms));
function key(code, k, mods) {
  clock += 5000;
  const ev = new KeyboardEvent('keydown', Object.assign({ code, key: k, bubbles: true, cancelable: true }, mods || {}));
  (document.activeElement || document).dispatchEvent(ev);
  return ev;
}
const $ = id => document.getElementById(id);
const txt = id => $(id).textContent;
const rows = () => [...document.querySelectorAll('#wall .w-row')];
const wingTitles = () => [...document.querySelectorAll('#wall .wing-h h2')].map(h => h.textContent);
const chips = () => [...document.querySelectorAll('#wallChips .fchip[data-v]')].map(b => b.textContent);
const R = el => el.getBoundingClientRect();
// ชิปที่มองเห็นต้องอยู่บรรทัดเดียวและอยู่ในกรอบครบ — ไม่มีตัวไหนถูกตัดกลางตัวเลข
function chipsClipped() {
  const box = $('wallChips'), br = R(box);
  const vis = [...box.querySelectorAll('.fchip')].filter(b => !b.hidden);
  const top = vis.length ? R(vis[0]).top : 0;
  return vis.filter(b => R(b).right > br.right + 0.5 || (!wall.chipsOpen && Math.abs(R(b).top - top) > 1)).map(b => b.textContent);
}
// ทุกปีกต้องเห็นเต็มใบหรือไม่เห็นเลย — ขอบผนังไม่ตัดกลางปีก
function wingsCut() {
  const wr = R($('wall'));
  return [...document.querySelectorAll('#wall .wing')].filter(w => {
    const r = R(w);
    const inside = r.left >= wr.left - 1 && r.right <= wr.right + 1;
    const outside = r.right <= wr.left + 1 || r.left >= wr.right - 1;
    return !inside && !outside;
  }).map(w => w.dataset.key + ' ' + Math.round(R(w).left) + '-' + Math.round(R(w).right) + ' / ' + Math.round(wr.left) + '-' + Math.round(wr.right));
}
const serialSeq = s => s.split('').map(ch => /[0-9]/.test(ch) ? ['Digit' + ch, 0] : ['Key' + ch, 1]);
const writes = () => CALLS.filter(c => ['insert', 'update', 'delete', 'upsert'].includes(c.op));
const fatal = () => ($('fatalError') ? $('fatalError').textContent : '');
function clearFatal() { const f = $('fatalError'); if (f) f.remove(); }
async function login(email) {
  $('loginEmail').value = email;
  $('loginPassword').value = 'x';
  await doLogin();
  await sleep(400);
}

async function runTests() {
  L('=== ผนังสต็อก desk.html ===');
  try { localStorage.clear(); } catch (e) {}
  await login('owner@djlabsiam.com');
  key('Digit1', '1', { altKey: true });
  await sleep(50);
  ok('Alt+1 เปิดผนังสต็อก', current === 'products' && !$('sec-products').hidden && location.hash === '#stock', current + ' ' + location.hash);

  // ── 1. ปีกแบรนด์ + หมวดจากข้อมูลจริง ─────────────────────────────────
  ok('เริ่มที่จัดตามแบรนด์ 4 ปีกตามลำดับที่เคาะ (แบรนด์อื่น = Other)',
    wingTitles().join('|') === 'AlphaTheta|Pioneer DJ|NEO by OYAIDE|แบรนด์อื่น', wingTitles().join('|'));
  const alphaShelves = [...document.querySelectorAll('.wing[data-key="b:AlphaTheta"] .shelf-h span:first-child')].map(s => s.textContent);
  ok('ในปีกแบรนด์มีชั้นย่อยตามหมวด เรียงแบบชั้นวาง (เครื่องเล่น → มิกเซอร์ → คอนโทรลเลอร์)',
    alphaShelves.join('|') === 'เครื่องเล่น|มิกเซอร์|คอนโทรลเลอร์', alphaShelves.join('|'));
  const c = chips().join('|');
  ok('ชิปหมวดมาจากข้อมูล: ค่าที่รู้จักแปลไทย', /มิกเซอร์2/.test(c) && /สาย1/.test(c) && /เทิร์นเทเบิล1/.test(c), c);
  ok('หมวดภาษาไทยกับอังกฤษที่หมายถึงเดียวกันรวมเป็นชิปเดียว (controller + คอนโทรลเลอร์)', /คอนโทรลเลอร์2/.test(c) && c.split('คอนโทรลเลอร์').length === 2, c);
  ok('หมวดที่ไม่รู้จักแสดงตามที่พิมพ์ไว้ · ไม่ระบุหมวดมีชิปของมัน', /dj-bag1/.test(c) && /ไม่ระบุหมวด1/.test(c), c);
  ok('ชิปแรก "ทุกหมวด" นับทุกรุ่น', chips()[0] === 'ทุกหมวด9', chips()[0]);
  ok('หน้าจอทดสอบกว้างแบบเคาน์เตอร์ (1440px)', window.innerWidth >= 1400, window.innerWidth);

  // ── 1b. แถวชิปไม่ตัดกลางตัวเลข (ล้น = พับเป็น "+n หมวด") ────────────────
  $('wallChips').style.maxWidth = '420px';     // บีบให้ล้นแน่ ๆ แบบตอนเปิดแผงขวา
  layoutChips();
  const more = () => document.querySelector('#wallChips .fchip-more');
  const hiddenN = () => [...document.querySelectorAll('#wallChips .fchip[data-v]')].filter(b => b.hidden).length;
  ok('ชิปที่ล้นถูกพับเป็นปุ่ม "+n หมวด" ตัวเลขตรงกับที่ซ่อน', !!more() && !more().hidden && hiddenN() > 0 && more().textContent === '+' + hiddenN() + ' หมวด',
    more() && more().textContent + ' / ' + hiddenN());
  ok('ชิปที่เห็นทุกตัวอยู่บรรทัดเดียว เต็มตัว', !chipsClipped().length, chipsClipped().join(' | '));
  wall.filter = 'ไม่ระบุหมวด';                  // ชิปตัวท้ายสุด — ปกติจะถูกพับ
  renderProducts();
  const pressed = document.querySelector('#wallChips .fchip[aria-pressed="true"]');
  ok('ชิปที่เลือกอยู่ไม่ถูกพับ แม้อยู่ท้ายแถว', !!pressed && !pressed.hidden && pressed.dataset.v === 'ไม่ระบุหมวด' && !chipsClipped().length);
  wall.filter = ''; renderProducts();
  more().click();
  ok('กด "+n" กางชิปครบทุกตัว (หลายบรรทัด) ปุ่มเปลี่ยนเป็น "ย่อ"', hiddenN() === 0 && more().textContent === 'ย่อ' && !chipsClipped().length);
  more().click();
  $('wallChips').style.maxWidth = '';
  layoutChips();

  // ── 1c. ลายเส้นแทนรูป · พื้นรูปขาวเดียวกัน ─────────────────────────────
  const sil = id => $('wr-' + id).querySelector('.ph svg.sil');
  // เทียบหลังให้เบราว์เซอร์แปลงเป็นรูปแบบเดียวกัน (<rect/> → <rect></rect>)
  const svgNorm = h => { const t = document.createElementNS('http://www.w3.org/2000/svg', 'svg'); t.innerHTML = h; return t.innerHTML; };
  ok('รุ่นที่ไม่มีรูปได้ลายเส้นตามหมวด (turntable ที่พิมพ์ตัวใหญ่ · controller)', !!sil('p6') && sil('p6').innerHTML === svgNorm(SIL.turntable) &&
    sil('p1').innerHTML === svgNorm(SIL.controller));
  ok('หมวดภาษาไทยก็ได้ลายเส้นของหมวดนั้น (คอนโทรลเลอร์)', sil('p3').innerHTML === svgNorm(SIL.controller));
  ok('หมวดที่ไม่รู้จัก/ไม่ระบุ ใช้ลายกล่อง', sil('p7').innerHTML === svgNorm(SIL.box) && sil('p8').innerHTML === svgNorm(SIL.box));
  ok('ลายเส้นครบ 9 หมวด + กล่อง ใช้เส้นชุดเดียวกัน', Object.keys(SIL).length === 10 && Object.keys(CAT_TH).every(k => SIL[k]) &&
    getComputedStyle(sil('p6')).strokeWidth === getComputedStyle(sil('p8')).strokeWidth);
  const tiles = ['p1', 'p4', 'p7'].map(id => getComputedStyle($('wr-' + id).querySelector('.ph')));
  ok('รูปจริงและลายเส้นอยู่บนกระเบื้องขาวระยะในเท่ากัน', tiles.every(t => t.backgroundColor === 'rgb(255, 255, 255)' && t.paddingTop === tiles[0].paddingTop),
    tiles.map(t => t.backgroundColor + ' ' + t.paddingTop).join(' | '));

  // ── 2. สถานะมีคำกำกับ ไม่ใช่สีอย่างเดียว ─────────────────────────────
  const r2 = $('wr-p2'), r4 = $('wr-p4'), r3 = $('wr-p3');
  ok('ใกล้หมด: ขอบแดง + คำว่า "ใกล้หมด"', r2.classList.contains('low') && r2.querySelector('.w-tag.low').textContent === 'ใกล้หมด');
  ok('หมด: ขอบดำ + คำว่า "หมด"', r4.classList.contains('out') && r4.querySelector('.w-tag.out').textContent === 'หมด');
  ok('ปิดใช้งาน: มีคำกำกับ ไม่นับเป็นใกล้หมด/หมด', r3.classList.contains('off') && r3.textContent.indexOf('ปิดใช้งาน') !== -1);
  ok('ตัวเลขใหญ่คือยอดคงเหลือจริง', $('wr-p1').querySelector('.w-qty').textContent === '5');
  ok('ปุ่มใกล้หมด/หมดบอกจำนวน (ใกล้หมด 2 · หมด 1)', txt('nLow') === '2' && txt('nOut') === '1', txt('nLow') + ' / ' + txt('nOut'));

  // ── 3. ตัวกรอง ────────────────────────────────────────────────────────
  toggleWallFlag('low');
  ok('กดใกล้หมด เหลือเฉพาะรุ่นใกล้หมด', rows().map(r => r.id).sort().join() === 'wr-p2,wr-p9', rows().map(r => r.id).join());
  toggleWallFlag('out');
  ok('กดหมดเพิ่ม = ใกล้หมดหรือหมด', rows().length === 3, rows().length);
  ok('ปุ่มที่กดอยู่เป็น aria-pressed', $('flagLow').getAttribute('aria-pressed') === 'true');
  toggleWallFlag('low'); toggleWallFlag('out');
  [...document.querySelectorAll('#wallChips .fchip')].find(b => b.dataset.v === 'มิกเซอร์').click();
  ok('ชิปหมวด "มิกเซอร์" กรองทุกปีกเหลือแต่มิกเซอร์', rows().map(r => r.id).sort().join() === 'wr-p4,wr-p9', rows().map(r => r.id).join());
  ok('ปีกที่ถูกกรองหมดยังอยู่ที่เดิม บอกว่าไม่มีรุ่นที่ตรง', wingTitles().length === 4 && txt('wall').indexOf('ไม่มีรุ่นที่ตรงกับตัวกรอง') !== -1);
  document.querySelector('#wallChips .fchip').click();
  $('productSearch').value = 'djm';
  renderProducts();
  ok('พิมพ์ในช่องยิง = ค้นหาชื่อรุ่น', rows().map(r => r.id).sort().join() === 'wr-p4,wr-p9', rows().map(r => r.id).join());
  $('productSearch').value = '';
  renderProducts();

  // ── 4. สลับจัดตามหมวด (G) + จำแยกรายคน ─────────────────────────────
  $('wall').focus();
  key('KeyG', 'เ');                            // แป้นไทย: ปุ่ม G ให้ "เ" — อ่านจาก code
  key('Digit1', 'ๅ');                          // ปุ่มถัดไปมาติด ๆ = ตัวแรกของซีเรียลที่ยิง ไม่ใช่คนกด G
  await sleep(120);
  ok('G ที่ตามด้วยปุ่มอื่นทันที (ตัวแรกของการยิง) ไม่สลับการจัด', wall.group === 'brand', wall.group);
  key('KeyG', 'เ');
  await sleep(120);
  ok('กด G สลับเป็นจัดตามหมวด', wall.group === 'category' && $('wall').classList.contains('by-cat'), wall.group);
  ok('ปีกหมวดมาจากข้อมูล เรียงแบบชั้นวาง หมวดไม่รู้จักต่อท้าย',
    wingTitles().join('|') === 'เครื่องเล่น|มิกเซอร์|คอนโทรลเลอร์|เทิร์นเทเบิล|สาย|dj-bag|ไม่ระบุหมวด', wingTitles().join('|'));
  ok('จัดตามหมวดแล้วชิปเปลี่ยนเป็นแบรนด์', chips().join('|') === 'ทุกแบรนด์9|AlphaTheta3|Pioneer DJ3|NEO by OYAIDE1|แบรนด์อื่น2', chips().join('|'));
  [...document.querySelectorAll('#wallChips .fchip')].find(b => b.dataset.v === 'Pioneer DJ').click();
  ok('ชิปแบรนด์กรองปีกหมวด', rows().map(r => r.id).sort().join() === 'wr-p1,wr-p6,wr-p9', rows().map(r => r.id).join());
  ok('ปีกหมวด: แบรนด์หนึ่งบรรทัด ราคาอีกบรรทัด (ไม่ห้อย "·")', $('wr-p1').querySelector('.w-brand').textContent === 'Pioneer DJ' &&
    $('wr-p1').querySelector('.w-meta').textContent.indexOf('Pioneer') === -1 && !$('wr-p1').querySelector('.w-brand').textContent.trim().endsWith('·'));
  document.querySelector('#wallChips .fchip').click();
  $('wall').scrollLeft = 0;
  await sleep(50);
  ok('ปีกหมวดล้นจอ: ทุกปีกเห็นเต็มใบหรือไม่เห็นเลย', $('wall').classList.contains('snaps') && !wingsCut().length, wingsCut().join(' | '));
  ok('มีปุ่มเลื่อนไปปีกถัดไปให้เห็น (ยังไม่มีปุ่มย้อน)', !$('wallNext').hidden && $('wallPrev').hidden);
  $('wallNext').click();
  await sleep(700);
  ok('กดปุ่มเลื่อน = ไปหนึ่งปีก และยังไม่ตัดกลางปีก', $('wall').scrollLeft > 100 && !wingsCut().length && !$('wallPrev').hidden, $('wall').scrollLeft + ' ' + wingsCut().join(' | '));
  $('wall').scrollLeft = 0;
  ok('ปุ่มจัดตามหมวดอยู่ในสถานะกด', document.querySelector('#groupSwitch [data-group="category"]').getAttribute('aria-pressed') === 'true');
  let saved = null; try { saved = localStorage.getItem('djlab.stockGroup.v1:u1'); } catch (e) {}
  ok('จำการจัดไว้ของคนนี้ (u1)', saved === 'category', saved);
  setWallGroup('brand');
  ok('สลับกลับจัดตามแบรนด์ ล้างชิปแบรนด์ทิ้ง', wall.group === 'brand' && wall.filter === '' && rows().length === 9);
  setWallGroup('category');

  // ── 5. คีย์บอร์ดบนผนัง ─────────────────────────────────────────────────
  setWallGroup('brand');
  $('wall').focus();
  wallSelect('p9');
  key('ArrowDown', 'ArrowDown');
  ok('↓ เลื่อนลงในปีกเดียวกัน (ข้ามชั้นย่อยได้)', wall.sel === 'p1', wall.sel);
  key('ArrowUp', 'ArrowUp');
  key('ArrowLeft', 'ArrowLeft');
  ok('← ไปปีกซ้ายที่ระดับสายตาเดียวกัน', wall.sel === 'p5', wall.sel);
  key('ArrowRight', 'ArrowRight'); key('ArrowRight', 'ArrowRight');
  ok('→ สองครั้งข้ามไปปีก NEO', wall.sel === 'p2', wall.sel);
  ok('แถวที่เลือกมีกรอบ + aria-selected', $('wr-p2').classList.contains('sel') && $('wr-p2').getAttribute('aria-selected') === 'true' &&
    $('wall').getAttribute('aria-activedescendant') === 'wr-p2');
  key('Enter', 'Enter');
  await sleep(120);
  ok('Enter เปิดลิ้นชักของรุ่นที่เลือก', !$('detail').hidden && txt('detailTitle') === 'NEO USB Class B 1.0m' && $('detail').classList.contains('stock-drawer'));
  key('Escape', 'Escape');
  ok('Esc ปิดลิ้นชัก', $('detail').hidden);

  // ── 6. ลิ้นชัก: รูปใหญ่ · ยอดเทียบจุดสั่งซื้อ · ซีเรียลตามสถานะ · ความเคลื่อนไหว · ปุ่ม ──
  await openProduct('p1');
  const body = () => txt('detailBody');
  ok('ลิ้นชักมียอดคงเหลือตัวใหญ่เทียบจุดสั่งซื้อซ้ำ', document.querySelector('#detailBody .dr-num').textContent === '5' && /จุดสั่งซื้อซ้ำ ≤ 1/.test(body()));
  const groups = [...document.querySelectorAll('#detailBody .sn-group h4')].map(h => h.textContent);
  ok('ซีเรียลแยกกลุ่มตามสถานะ (อยู่ในสต็อก 2 · ขายแล้ว 1)', groups.join('|') === '2อยู่ในสต็อก|1ขายแล้ว', groups.join('|'));
  ok('มีความเคลื่อนไหวล่าสุด', /รับของ/.test(body()));
  ok('ปุ่มครบ: รับเข้า · ตัดออก · ปรับยอด · นับ', [...document.querySelectorAll('.dr-act button')].map(b => b.textContent).join('|') === 'รับเข้า|ตัดออก|ปรับยอด|นับ');
  ok('เจ้าของร้านเห็นปุ่มเพิ่มรูปในลิ้นชัก (รุ่นที่ยังไม่มีรูป)', /เพิ่มรูป/.test(body()) && /แก้ไขข้อมูลสินค้า/.test(body()));
  await openProduct('p4');
  ok('ราคาในลิ้นชักรูปแบบเดียวกับผนัง (฿89,900 ไม่มี .00 บาท)', body().includes('฿89,900') && !body().includes('.00 บาท'));
  ok('ไม่มีแถบเทียบยอดที่ไม่มีป้าย (อ่านเป็นเส้นคู่)', !document.querySelector('#detailBody .dr-meter'));
  await sleep(120);
  ok('แผงขวาเปิด: ปีกแบรนด์ยังเต็มใบ ไม่ตัดกลางปีก', !wingsCut().length, wingsCut().join(' | '));
  ok('แผงขวาเปิด: ชิปไม่ถูกตัดกลางตัวเลข', !chipsClipped().length, chipsClipped().join(' | '));
  ok('จัดชิป/ปีกใหม่ตอนแผงเปิด ไม่มีแถบ error (ResizeObserver loop)', !fatal(), fatal());
  ok('รุ่นที่มีรูป: ลิ้นชักโชว์รูปจากถัง product-images + ปุ่มเปลี่ยน/เอาออก',
    document.querySelector('#detailBody .dr-photo img').src.indexOf('product-images/p4/old.webp') !== -1 && /เปลี่ยนรูป/.test(body()) && /เอารูปออก/.test(body()));
  ok('บนผนัง รุ่นที่มีรูปโชว์รูป รุ่นที่ไม่มีโชว์ช่องเพิ่มรูป (เจ้าของร้าน)',
    !!$('wr-p4').querySelector('.ph img') && !!$('wr-p1').querySelector('.ph-add'));

  // ตัดออกในลิ้นชัก — แถวเดียวใน stock_movements
  await openProduct('p1');
  drawerMoveForm('p1', 'out');
  $('drQty').value = '1'; $('drReason').value = 'ของเสีย';
  CALLS.length = 0;
  await drawerMoveSubmit('p1', 'out');
  const mo = CALLS.find(c => c.op === 'insert' && c.table === 'stock_movements');
  ok('ตัดออกในลิ้นชัก = insert stock_movements แถวเดียว ประเภท out', !!mo && mo.payload.type === 'out' && mo.payload.qty === 1 && mo.payload.admin_id === 'u1', JSON.stringify(mo && mo.payload));
  ok('ไม่มี update/delete ของ stock_movements', !CALLS.some(c => (c.op === 'update' || c.op === 'delete') && c.table === 'stock_movements'));
  closeDetail();

  // ── 7. ยิงในโหมดหา: กระโดดไปรุ่นนั้น (บาร์โค้ดรุ่น และซีเรียล) ───────────
  [...document.querySelectorAll('#wallChips .fchip')].find(b => b.dataset.v === 'สาย').click();
  ok('ก่อนยิง: กรองหมวดสายอยู่ DDJ-FLX4 มองไม่เห็น', !$('wr-p1'));
  ok('โหมดหา → เครื่องยิงไปทาง search', wedgeRoute() === 'search', wedgeRoute());
  burst(digits('619659216054'));
  await sleep(200);
  ok('ยิงบาร์โค้ดรุ่น: ตัวกรองหลีกทาง กระโดดไปรุ่นนั้น', wall.filter === '' && wall.sel === 'p1' && !!$('wr-p1'), wall.filter + ' / ' + wall.sel);
  ok('แถวถูกไฮไลต์ (hit) และลิ้นชักเปิด', $('wr-p1').classList.contains('hit') && !$('detail').hidden && txt('detailTitle') === 'DDJ-FLX4');
  closeDetail();
  wallSelect('p5');
  burstMixed(serialSeq('CHMP555555NN'));
  await sleep(250);
  const hit = document.querySelector('#detailBody .sn.hit');
  ok('ยิงซีเรียล: กระโดดไปรุ่นของเครื่องนั้น', wall.sel === 'p1' && txt('detailTitle') === 'DDJ-FLX4', wall.sel);
  ok('ยิงซีเรียล: เครื่องนั้นถูกไฮไลต์ในลิ้นชัก', !!hit && hit.textContent === 'CHMP555555NN', hit && hit.textContent);
  closeDetail();
  burst(digits('111122223333'));
  await sleep(200);
  ok('รหัสที่ไม่รู้จัก ยังถามว่าเป็นบาร์โค้ดรุ่นหรือซีเรียล', $('codeDialog').open && /บาร์โค้ดของรุ่นสินค้า/.test(txt('codeBody')) && /ซีเรียลของเครื่อง/.test(txt('codeBody')));
  $('codeDialog').close();

  // ── 8. รับเข้า: ถาดการ์ดทีละเครื่อง ────────────────────────────────────
  setWallMode('receive');
  ok('โหมดรับเข้า: ถาดขึ้นด้านล่าง · เครื่องยิงไปทาง receive', !$('tray').hidden && wedgeRoute() === 'receive');
  burst(digits('619659216054'));
  await sleep(100);
  ok('ยิงบาร์โค้ดรุ่น = เริ่มรับเข้ารุ่นนั้น', rcv.target === 'p1' && /กำลังรับเข้ารุ่นนี้/.test(txt('trayBody')));
  burstMixed(serialSeq('NEWSER0001'));
  await sleep(150);
  rcvAddSerial('p1', 'DDJGRV6510283NN');
  const snEl = [...document.querySelectorAll('#trayBody .t-card .sn-t')].find(e => e.textContent === 'DDJGRV6510283NN');
  ok('ซีเรียลยาวอยู่บรรทัดเดียว ไม่ถูกตัดกลาง (การ์ดกว้างตามซีเรียล) ตัวหนังสือ ≥ 14px', !!snEl && getComputedStyle(snEl).whiteSpace === 'nowrap' &&
    snEl.scrollWidth <= snEl.clientWidth + 1 && R(snEl).height < parseFloat(getComputedStyle(snEl).lineHeight) * 2 && parseFloat(getComputedStyle(snEl).fontSize) >= 14,
    snEl && (snEl.scrollWidth + '/' + snEl.clientWidth + ' h' + R(snEl).height));
  rcvUndo('p1', rcvGroup('p1').serials.indexOf('DDJGRV6510283NN'));
  ok('ยิงซีเรียลใหม่ = การ์ดพร้อมรูปและซีเรียล', document.querySelectorAll('#trayBody .t-card .sn-t')[0].textContent === 'NEWSER0001' &&
    !!document.querySelector('#trayBody .t-card .ph'), txt('trayBody'));
  ok('รุ่นที่มีซีเรียล จำนวน = จำนวนซีเรียล (บาร์โค้ดรุ่นที่ยิงก่อนไม่นับซ้ำ)', rcvTotal() === 1, rcvTotal());
  burstMixed(serialSeq('NEWSER0001'));
  await sleep(150);
  ok('ยิงซีเรียลเดิมซ้ำในรอบนี้ ถูกปฏิเสธพร้อมข้อความ', rcvTotal() === 1 && /ยิงซ้ำ/.test(txt('trayNote')), txt('trayNote'));
  burstMixed(serialSeq('CHMP123354NN'));
  await sleep(150);
  ok('ซีเรียลที่มีในระบบแล้ว ถูกปฏิเสธพร้อมบอกรุ่นและสถานะ', rcvTotal() === 1 && /มีในระบบแล้ว/.test(txt('trayNote')) && /DDJ-FLX4/.test(txt('trayNote')), txt('trayNote'));
  burstMixed(serialSeq('NEWSER0002'));
  await sleep(150);
  ok('ยิงเครื่องที่สอง รวม 2', rcvTotal() === 2);
  rcvUndo('p1', 1);
  ok('กด ✕ ที่การ์ด = เอาเครื่องนั้นออก (undo)', rcvTotal() === 1 && rcvGroup('p1').serials.join() === 'NEWSER0001');
  burst(digits('4944711000011')); await sleep(80);
  burst(digits('4944711000011')); await sleep(80);
  ok('ของไม่มีซีเรียล: ยิงบาร์โค้ดรุ่นซ้ำ = นับเพิ่ม', rcvGroup('p2').loose === 2, rcvGroup('p2').loose);
  rcvLoose('p2', -1);
  ok('กด − ลดจำนวนของไม่มีซีเรียล', rcvGroup('p2').loose === 1);
  ok('ยอดรวมทั้งรอบ + ปุ่มยืนยันบอกจำนวน', rcvTotal() === 2 && txt('rcvConfirmBtn') === 'ยืนยันรับเข้าทั้งรอบ (2)', txt('rcvConfirmBtn'));
  ok('ปุ่มโหมดรับเข้าบอกจำนวนที่ค้าง', /2/.test(document.querySelector('.modes [data-mode="receive"]').textContent));
  CALLS.length = 0;
  await rcvConfirm();
  const iu = CALLS.findIndex(c => c.op === 'insert' && c.table === 'product_units');
  const im = CALLS.findIndex(c => c.op === 'insert' && c.table === 'stock_movements');
  ok('ยืนยัน: ลง product_units ก่อน stock_movements', iu !== -1 && im !== -1 && iu < im, JSON.stringify(CALLS.map(c => c.op + ':' + c.table)));
  const units = iu !== -1 ? CALLS[iu].payload : [];
  ok('ซีเรียลลงพร้อม barcode_code = serial_no (สแกนแล้วหาเจอ)', units.length === 1 && units[0].serial_no === 'NEWSER0001' && units[0].barcode_code === 'NEWSER0001' && units[0].product_id === 'p1');
  const mv = im !== -1 ? CALLS[im].payload : [];
  ok('ลงยอดรายรุ่น: รุ่นซีเรียล = จำนวนเครื่อง · สาย = จำนวนที่ยิง', mv.length === 2 &&
    mv.find(x => x.product_id === 'p1').qty === 1 && mv.find(x => x.product_id === 'p2').qty === 1 && mv.every(x => x.type === 'in' && x.admin_id === 'u1'), JSON.stringify(mv));
  ok('ไม่มี update/delete ใด ๆ ตอนรับเข้า', !CALLS.some(c => c.op === 'update' || c.op === 'delete'));
  ok('ยืนยันแล้วถาดว่าง', rcvTotal() === 0 && !rcv.groups.length);

  // ซีเรียลที่อีกเครื่องลงไปก่อน (ผ่านตอนยิง ถูกปฏิเสธตอนบันทึก) → ไม่มีอะไรลงเลยทั้งรอบ
  rcvSetTarget('p6');
  burstMixed(serialSeq('OKSER0009')); await sleep(120);
  burstMixed(serialSeq('DUPSER01')); await sleep(120);
  CALLS.length = 0; clearFatal();
  await rcvConfirm();
  ok('ซีเรียลซ้ำตอนบันทึก: ไม่ลงยอดเลย', !CALLS.some(c => c.op === 'insert' && c.table === 'stock_movements'), JSON.stringify(CALLS.map(c => c.op + ':' + c.table)));
  ok('ซีเรียลซ้ำตอนบันทึก: บอกชัดว่าตัวไหน และยังไม่ได้บันทึกอะไร', /DUPSER01/.test(fatal()) && /ยังไม่ได้บันทึกอะไรเลย/.test(fatal()), fatal());
  ok('การ์ดที่ซ้ำถูกมาร์ก ของที่เหลือยังอยู่ในถาด', !!document.querySelector('#trayBody .t-card.dup') && rcvTotal() === 2);
  resetRcv(); clearFatal(); renderTrayBody();

  // ซีเรียลใหม่ตอนยังไม่ได้เลือกรุ่น → ถามก่อน ไม่เดา
  burstMixed(serialSeq('ORPHAN01'));
  await sleep(150);
  ok('ยิงซีเรียลใหม่โดยยังไม่เลือกรุ่น = ถามว่าเป็นอะไร ให้เลือกรุ่น', $('codeDialog').open && !!$('serialModelSel'));
  $('serialModelSel').value = 'p6';
  rcvSerialFor();
  ok('เลือกรุ่นแล้วเข้าถาดเป็นซีเรียลของรุ่นนั้น', !$('codeDialog').open && rcvGroup('p6') && rcvGroup('p6').serials[0] === 'ORPHAN01');
  resetRcv(); renderTrayBody();

  // ── 9. นับสต็อก ───────────────────────────────────────────────────────
  setWallMode('count');
  countSetScope('b:Pioneer DJ');
  CALLS.length = 0;
  await countStart();
  ok('เริ่มนับทั้งปีก Pioneer DJ (เฉพาะรุ่นที่ใช้งาน)', cnt.started && cnt.ids.slice().sort().join() === 'p1,p6,p9', cnt.ids.join());
  ok('โหลดซีเรียลที่ควรอยู่บนชั้นของขอบเขตนี้', CALLS.some(c => c.op === 'in' && c.table === 'product_units') && cnt.units.p1.length === 2);
  ok('รุ่นนอกขอบเขตถูกหรี่บนผนัง', $('wr-p2').classList.contains('dim') && !$('wr-p1').classList.contains('dim'));
  ok('โหมดนับ → เครื่องยิงไปทาง count', wedgeRoute() === 'count');
  burstMixed(serialSeq('CHMP123354NN')); await sleep(150);
  ok('ยิงซีเรียล = นับเพิ่ม 1', cnt.counted.p1 === 1);
  burstMixed(serialSeq('CHMP123354NN')); await sleep(150);
  ok('ยิงซีเรียลเดิมซ้ำ ไม่นับซ้ำ', cnt.counted.p1 === 1 && /ยิงซ้ำ/.test(txt('trayNote')));
  burst(digits('619659216054')); await sleep(150);
  ok('ยิงบาร์โค้ดรุ่น = นับเพิ่ม 1', cnt.counted.p1 === 2);
  countAdj('p6', 1); countAdj('p6', 1); countAdj('p6', 1); countAdj('p6', 1); countAdj('p6', -1);
  ok('กด + − นับเองได้', cnt.counted.p6 === 3);
  burst(digits('4944711000011')); await sleep(150);
  ok('ยิงของนอกขอบเขต ไม่นับ และบอกเหตุผล', !cnt.counted.p2 && /ไม่อยู่ในขอบเขต/.test(txt('trayNote')), txt('trayNote'));
  const line = id => document.querySelector('#trayBody .c-line[data-id="' + id + '"]');
  ok('แสดงในระบบ vs นับได้ vs ผลต่าง (DDJ-FLX4 ขาด 3)', line('p1').querySelector('.c-exp').textContent === '5' &&
    line('p1').querySelector('.c-step b').textContent === '2' && line('p1').querySelector('.c-var').textContent === 'ขาด 3');
  ok('นับตรง = "ตรง"', line('p6').querySelector('.c-var').textContent === 'ตรง');
  ok('รุ่นที่ยังไม่ได้นับ บอกว่ายืนยันแล้วจะเป็น 0', /ยังไม่ได้นับ/.test(line('p9').querySelector('.c-var').textContent));
  ok('รุ่นมีซีเรียล: บอกเครื่องที่ยังไม่ได้ยิง', /CHMP555555NN/.test(line('p1').textContent) && !/CHMP123354NN/.test(line('p1').querySelector('.c-miss').textContent) &&
    /S11SER001/.test(line('p9').textContent), line('p1').textContent);
  ok('เครื่องที่ขายแล้วไม่ถูกนับว่าขาด', !/CHMP999999NN/.test(line('p1').textContent));
  CALLS.length = 0;
  countConfirm();
  ok('บรรทัดสรุปบอกรุ่นที่ยังไม่นับ และจำนวนที่จะถูกตั้งเป็น 0', /ยังไม่นับ 1/.test(txt('traySum')) && /จะถูกตั้งเป็น 0: 1/.test(txt('traySum')) &&
    !!document.querySelector('#traySum .zero-warn'), txt('traySum'));
  ok('ปุ่มยืนยันแยก "ปรับตามที่นับ" ออกจาก "ตั้งเป็น 0"', txt('cntConfirmBtn') === 'ยืนยันผลนับ — ปรับตามที่นับ 1 · ตั้งเป็น 0 อีก 1', txt('cntConfirmBtn'));
  ok('แถวที่ยังไม่นับบอกว่าจะถูกตั้งเป็น 0 เท่าไหร่', line('p9').querySelector('.c-var').textContent.includes('จะตั้งเป็น 0 (-1)'), line('p9').querySelector('.c-var').textContent);
  ok('ยืนยันผลนับ ต้องผ่านหน้าต่างยืนยันก่อน แยกสองกองชัดเจน', $('confirmDialog').open && txt('confirmBody').includes('ปรับตามที่นับได้ (1)') &&
    txt('confirmBody').includes('ตั้งเป็น 0 เพราะยังไม่ได้นับ (1)') && /รวม 2/.test(txt('confirmOkBtn')) && !writes().length, txt('confirmOkBtn'));
  await runConfirm();
  const adj = CALLS.filter(c => c.op === 'insert' && c.table === 'stock_movements');
  const rowsAdj = adj.length ? adj[0].payload : [];
  ok('ลงเฉพาะรุ่นที่ไม่ตรง (2 รุ่น ไม่มี PLX-1000 ที่นับตรง)', adj.length === 1 && rowsAdj.length === 2 && !rowsAdj.some(x => x.product_id === 'p6'), JSON.stringify(rowsAdj));
  ok('เป็นรายการปรับยอด ค่าตามผลต่าง (−3 · −1)', rowsAdj.every(x => x.type === 'adjustment' && x.admin_id === 'u1') &&
    rowsAdj.find(x => x.product_id === 'p1').qty === -3 && rowsAdj.find(x => x.product_id === 'p9').qty === -1);
  ok('เหตุผล "นับสต็อก <วันที่>"', rowsAdj.every(x => /^นับสต็อก \\d{1,2} \\S+ 25\\d\\d$/.test(x.reason)), rowsAdj[0] && rowsAdj[0].reason);
  ok('นับสต็อกไม่มี update/delete ใด ๆ (เพิ่มได้อย่างเดียว)', !CALLS.some(c => c.op === 'update' || c.op === 'delete' || c.op === 'upsert'));
  ok('ยืนยันแล้วจบรอบนับ', !cnt.started && !$('confirmDialog').open);

  // เลือกรุ่นเองบนผนัง
  countSetScope('pick');
  wallClick('p5'); wallClick('p8');
  ok('ขอบเขต "เลือกรุ่นเอง": คลิกรุ่นบนผนังเพื่อเลือก', cnt.picks.join() === 'p5,p8' && $('wr-p5').classList.contains('picked') && /เลือกนับ/.test($('wr-p5').textContent));
  wallClick('p8');
  ok('คลิกซ้ำเพื่อเอาออก', cnt.picks.join() === 'p5');
  setWallMode('find');
  ok('กลับโหมดหา ถาดหายไป', $('tray').hidden);

  // ── 10. รูปสินค้า ─────────────────────────────────────────────────────
  const cv = document.createElement('canvas'); cv.width = 1600; cv.height = 900;
  const g2 = cv.getContext('2d'); g2.fillStyle = '#222'; g2.fillRect(200, 200, 1200, 500);
  const png = await new Promise(r => cv.toBlob(r, 'image/png'));
  CALLS.length = 0;
  const done = await uploadPhoto('p1', new File([png], 'ddj.png', { type: 'image/png' }));
  const up = CALLS.find(c => c.op === 'upload');
  const upd = CALLS.find(c => c.op === 'update' && c.table === 'products');
  ok('อัปโหลดขึ้นถัง product-images ใต้โฟลเดอร์ของรุ่น', done && !!up && up.bucket === 'product-images' && /^p1\\/[0-9a-f-]{36}\\.(webp|jpg)$/.test(up.path), up && (up.bucket + ' ' + up.path));
  ok('ชี้ image_path ไปไฟล์ที่เพิ่งอัปโหลด (หลังอัปโหลดสำเร็จ)', !!upd && upd.payload.image_path === up.path && CALLS.indexOf(up) < CALLS.indexOf(upd));
  const bmp = up ? await createImageBitmap(up.blob) : null;
  ok('ย่อก่อนส่ง: ด้านยาว 800px เป็น WebP/JPEG', !!bmp && Math.max(bmp.width, bmp.height) === 800 && /image\\/(webp|jpeg)/.test(up.blob.type), bmp && (bmp.width + 'x' + bmp.height + ' ' + up.blob.type));
  ok('บนผนังโชว์รูปใหม่ทันที', ($('wr-p1').querySelector('.ph img') || {}).src === 'https://img.test/product-images/' + up.path);
  CALLS.length = 0;
  await uploadPhoto('p4', new File([png], 'v5.png', { type: 'image/png' }));
  const rm = CALLS.find(c => c.op === 'remove');
  ok('เปลี่ยนรูป: ไฟล์เก่าถูกลบหลังชี้รูปใหม่แล้ว', !!rm && rm.paths[0] === 'p4/old.webp' &&
    CALLS.findIndex(c => c.op === 'update') < CALLS.indexOf(rm));
  CALLS.length = 0;
  removePhoto('p4');
  await runConfirm();
  ok('เอารูปออก: image_path = null แล้วลบไฟล์', CALLS.some(c => c.op === 'update' && c.table === 'products' && c.payload.image_path === null) &&
    CALLS.some(c => c.op === 'remove'));

  // ── 11. พนักงาน: ไม่เห็นและทำเรื่องรูปไม่ได้ · การจัดของตัวเอง ──────────
  setWallGroup('category');                    // เจ้าของร้านเลือกจัดตามหมวดไว้ก่อนออก
  await doLogout();
  await sleep(200);
  await login('staff@djlabsiam.com');
  key('Digit1', '1', { altKey: true });
  await sleep(50);
  ok('พนักงานเข้าผนังได้ เริ่มที่จัดตามแบรนด์ (ของตัวเอง ไม่ใช่ของเจ้าของร้าน)', current === 'products' && wall.group === 'brand', wall.group);
  ok('พนักงานไม่เห็นช่องเพิ่มรูปบนผนัง (เห็นแค่ลายเส้น)', !document.querySelector('#wall .ph-add') && !!document.querySelector('#wr-p5 .ph > svg.sil'));
  await openProduct('p5');
  ok('พนักงานไม่เห็นปุ่มเพิ่ม/เปลี่ยน/เอารูปออกในลิ้นชัก', !/เพิ่มรูป|เปลี่ยนรูป|เอารูปออก/.test(txt('detailBody')));
  CALLS.length = 0;
  const r = await uploadPhoto('p5', new File([png], 'x.png', { type: 'image/png' }));
  pickPhoto('p5');
  ok('พนักงานเรียกอัปโหลดตรง ๆ ก็ไม่ผ่าน ไม่มีอะไรขึ้นถัง', r === false && !CALLS.some(c => c.op === 'upload' || c.op === 'update'), JSON.stringify(CALLS.map(c => c.op)));
  ok('พนักงานไม่เห็นปุ่มสินค้าใหม่', $('addProductBtn').hidden);
  await doLogout();
  await sleep(200);
  await login('owner@djlabsiam.com');
  ok('เจ้าของร้านกลับมา ได้การจัดที่จำไว้ (จัดตามหมวด)', wall.group === 'category', wall.group);

  L('=== สรุป: ' + pass + ' PASS / ' + fail + ' FAIL ===');
  L(fail ? 'RESULT:FAIL' : 'RESULT:PASS');
}
</script>`;

const res = runPage({ root, file: 'desk.html', mock: MOCK, tests: TESTS, flags: ['--window-size=1440,900', '--force-prefers-reduced-motion'] });
console.log(`  === บล็อกเครื่องยิง: ${nodePass} PASS / ${nodeFail} FAIL ===`);
process.exit(res.ok && !nodeFail ? 0 : 1);
