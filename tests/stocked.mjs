/**
 * เทสต์ products.stocked (035) ในหน้าเว็บ — รุ่นที่เป็นแค่รายการราคาของบอท (stocked = false) ไม่ขึ้นผนังสต็อก
 *   รัน: node tests/stocked.mjs
 *
 * กติกา: stocked = false และไม่มียอดค้าง → ซ่อนจากผนัง · รายการหมด/ใกล้หมด · ตัวนับ · ปีกหมวด · ขอบเขตนับสต็อก · ตัวเลือกเคลื่อนไหว/ผูกบาร์โค้ด
 *        มียอดค้าง (บวกหรือลบ) = ยังเห็นเสมอ · ไม่มีคอลัมน์ (undefined — หน้าขึ้นก่อนรัน 035) = แสดงตามเดิม · หน้าขายยังค้นเจอ/ขายได้
 * ส่วนที่ 1: desk.html (ตัวรัน CDP เดียวกับ desk-ops) · ส่วนที่ 2: stock.html หน้ามือถือ (รวมช่อง "ร้านสต็อกรุ่นนี้" ในฟอร์มสินค้า)
 */
import { dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { HARNESS, runPage } from './lib/page-test.mjs';
import { runCdpPage } from './lib/cdp-page.mjs';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const pageRoot = process.env.STOCKED_ROOT || root;          // ทดสอบหน้าฉบับอื่น (mutation)
const { MOCK: MOCK3 } = await import(pathToFileURL(join(root, 'tests/desk-home3.mjs')).href);

// รุ่นตัวอย่าง: s1 ขึ้นผนัง (ยอด 0 = หมด) · s2 รายการราคา (ซ่อน) · s3 รายการราคาแต่มียอด 3 (เห็น) · s4 ไม่มีคอลัมน์ stocked (เห็น) ·
// s5 เลิกขายและไม่ได้สต็อก (ซ่อน) · s6 รายการราคาที่เป็นรุ่นเดียวในแบรนด์ Other / หมวด turntable (ปีก/หมวดนั้นต้องไม่โผล่) · s7 รายการราคาแต่ยอดติดลบ −1 (ขายเกินสต็อก ต้องเห็น)
const PRODUCTS = `[
  { id: 's1', sku: 'T-SHELF', name: 'ขึ้นผนัง ยอด 0', brand: 'Pioneer DJ', category: 'controller', barcode_ean13: null, cost_price: 0, sell_price: 1000, reorder_point: 0, is_active: true, stocked: true },
  { id: 's2', sku: 'T-PRICE', name: 'รายการราคา ไม่สต็อก', brand: 'Pioneer DJ', category: 'controller', barcode_ean13: null, cost_price: 0, sell_price: 2000, reorder_point: 0, is_active: true, stocked: false },
  { id: 's3', sku: 'T-PRICE-QTY', name: 'รายการราคา แต่มียอด', brand: 'Pioneer DJ', category: 'controller', barcode_ean13: null, cost_price: 0, sell_price: 3000, reorder_point: 0, is_active: true, stocked: false },
  { id: 's4', sku: 'T-LEGACY', name: 'ไม่มีคอลัมน์ stocked', brand: 'Pioneer DJ', category: 'controller', barcode_ean13: null, cost_price: 0, sell_price: 4000, reorder_point: 0, is_active: true },
  { id: 's5', sku: 'T-OLD', name: 'เลิกขาย ไม่สต็อก', brand: 'AlphaTheta', category: 'mixer', barcode_ean13: null, cost_price: 0, sell_price: 0, reorder_point: 0, is_active: false, stocked: false },
  { id: 's6', sku: 'T-ONLYCAT', name: 'รายการราคาเดียวของแบรนด์/หมวด', brand: 'Other', category: 'turntable', barcode_ean13: null, cost_price: 0, sell_price: 5000, reorder_point: 0, is_active: true, stocked: false },
  { id: 's7', sku: 'T-NEG', name: 'รายการราคา ยอดติดลบ', brand: 'Pioneer DJ', category: 'controller', barcode_ean13: null, cost_price: 0, sell_price: 6000, reorder_point: 0, is_active: true, stocked: false },
]`;
const LEVELS = `[{ product_id: 's3', current_qty: 3 }, { product_id: 's7', current_qty: -1 }]`;

// ── 1. desk.html ─────────────────────────────────────────────────────────
const DESK_EXTRA = `<script>FAKE.products.push(...${PRODUCTS}); FAKE.product_stock_levels.push(...${LEVELS});</script>`;
const DESK = `<script>
window.addEventListener('load', () => setTimeout(runTests, 300));
${HARNESS}
const sleep = ms => new Promise(r => setTimeout(r, ms));
const $ = id => document.getElementById(id);
async function runTests() {
  L('=== products.stocked ใน desk.html ===');
  $('loginEmail').value = 'tibass@x'; $('loginPassword').value = 'x'; await doLogin(); await sleep(500);
  showSection('products'); await sleep(400);
  const ids = () => wall.wings.flatMap(w => w.items.map(p => p.id)).sort();
  const has = (...x) => x.every(i => ids().includes(i)), none = (...x) => x.every(i => !ids().includes(i));

  // หน่วย: onShelf
  ok('onShelf: stocked=false ยอด 0 → ไม่ขึ้น · มียอด/ติดลบ → ขึ้น · true/ไม่มีคอลัมน์ → ขึ้น',
    onShelf({ stocked: false, current_qty: 0 }) === false && onShelf({ stocked: false, current_qty: 2 }) === true && onShelf({ stocked: false, current_qty: -1 }) === true &&
    onShelf({ stocked: true, current_qty: 0 }) === true && onShelf({ current_qty: 0 }) === true && onShelf({ stocked: false }) === (qtyOf(undefined) !== 0));

  ok('ผนัง (จัดตามแบรนด์): ขึ้น s1 s3 s4 s7 · ไม่ขึ้น s2 s5 s6', has('s1', 's3', 's4', 's7') && none('s2', 's5', 's6'), ids().join(','));
  ok('รุ่นเดิม (p1) ยังอยู่บนผนัง', has('p1'));
  ok('ตัวนับ "หมด" นับเฉพาะที่ขึ้นผนัง (s1 ยอด 0 · s4 ยอด 0 · s7 ยอด −1 = 3 · ไม่นับ s2 s5 s6)', $('nOut').textContent === '3', $('nOut').textContent);
  wall.out = true; renderProducts();
  ok('กรอง "หมด": เห็น s1 s4 s7 เท่านั้น (s7 ติดลบ = ขายเกินสต็อก ต้องไม่หาย) — รายการราคาที่ไม่สต็อกและยอด 0 ไม่มาปน', ids().join(',') === 's1,s4,s7', ids().join(','));
  wall.out = false; renderProducts();
  setWallGroup('category'); await sleep(100);
  ok('จัดตามหมวด: ไม่มีปีกของหมวดที่มีแต่รายการราคา (turntable) · ยังมีปีกหมวด controller', !wall.wings.some(w => w.title === catLabel('turntable')) && wall.wings.some(w => w.title === catLabel('controller')), wall.wings.map(w => w.title).join('|'));
  ok('จัดตามหมวด: ผนังไม่มี s2 s5 s6', none('s2', 's5', 's6') && has('s3', 's7'));
  setWallGroup('brand'); await sleep(100);
  ok('ค้นหาชื่อรุ่น "รายการราคา ไม่สต็อก" บนผนัง: ไม่เจอ (ซ่อนจริง) ไม่ใช่แค่เรียงท้าย', (() => { $('productSearch') && ($('productSearch').value = 'รายการราคา ไม่สต็อก'); renderProducts(); const r = none('s2'); $('productSearch') && ($('productSearch').value = ''); renderProducts(); return r; })());

  // ขอบเขตนับสต็อก
  const sc = k => scopeIds(k).slice().sort().join(',');
  ok('ขอบเขตนับ ปีก Pioneer DJ: มี s1 s3 s4 s7 · ไม่มี s2 (ไม่สต็อก ยอด 0)', ['s1', 's3', 's4', 's7'].every(i => scopeIds('b:Pioneer DJ').includes(i)) && !scopeIds('b:Pioneer DJ').includes('s2'), sc('b:Pioneer DJ'));
  ok('ขอบเขตนับ ปีก AlphaTheta: ไม่มี s5 (เลิกขายและไม่สต็อก)', !scopeIds('b:AlphaTheta').includes('s5'));
  const opts = countScopeOptions();
  ok('ตัวเลือกขอบเขตนับ: ไม่มีปีก Other (มีแต่รายการราคา) · ไม่มีหมวด turntable', !opts.includes('b:Other') && !opts.includes('c:' + catLabel('turntable')), opts.slice(0, 200));
  // ตัวเลือกเคลื่อนไหวสต็อก / ผูกบาร์โค้ด
  renderMovementProductOptions();
  const mv = [...$('movProduct').options].map(o => o.value);
  ok('ตัวเลือกรับเข้า/ปรับยอด: ไม่มี s2 s5 s6 · มี s1 s3 s4 s7', ['s2', 's5', 's6'].every(i => !mv.includes(i)) && ['s1', 's3', 's4', 's7'].every(i => mv.includes(i)), mv.join(','));
  // หน้าขาย: ยังค้นเจอ/ขายได้
  ok('หน้าขาย: ค้นรุ่นรายการราคา (s2) เจอ — ยังขายได้ ไม่ถูกซ่อน', posMatches('รายการราคา ไม่สต็อก').some(p => p.id === 's2'));
  // ยอดค้างกลับมา → ขึ้นผนังทันที
  stockLevelMap['s2'] = 4; renderProducts();
  ok('รุ่นรายการราคาที่เพิ่งมียอด (รับของเข้า) → ขึ้นผนังทันที', has('s2'));
  stockLevelMap['s2'] = 0; renderProducts();
  ok('ยอดกลับเป็น 0 → ซ่อนอีกครั้ง', none('s2'));
  // ยิงรหัสที่ไม่รู้จักตอนรับเข้า: ตัวเลือกผูกบาร์โค้ด / เลือกรุ่นของซีเรียล
  const optIds = id => [...($(id) ? $(id).options : [])].map(o => o.value).filter(Boolean).sort().join(',');
  askCodeKind('9999999999990', true);
  ok('ผูกบาร์โค้ด (ยิงรหัสไม่รู้จัก): เห็น s1 s3 s4 s7 · ไม่เห็น s2 s5 s6', ['s1', 's3', 's4', 's7'].every(i => optIds('linkProductSel').split(',').includes(i)) && ['s2', 's5', 's6'].every(i => !optIds('linkProductSel').split(',').includes(i)), optIds('linkProductSel'));
  ok('ซีเรียล (เลือกรุ่นของเครื่อง): เห็น s1 s3 s4 s7 · ไม่เห็น s2 s5 s6', ['s1', 's3', 's4', 's7'].every(i => optIds('serialModelSel').split(',').includes(i)) && ['s2', 's5', 's6'].every(i => !optIds('serialModelSel').split(',').includes(i)), optIds('serialModelSel'));
  $('codeDialog').close();
  L('=== สรุป: ' + pass + ' PASS / ' + fail + ' FAIL ===');
  L(fail ? 'RESULT:FAIL' : 'RESULT:PASS');
}
</script>`;
const net = '--host-resolver-rules=MAP * ~NOTFOUND';
const dr = await runCdpPage({ root: pageRoot, file: 'desk.html', mock: MOCK3 + DESK_EXTRA, tests: DESK, width: 1440, height: 900, coarse: false, flags: [net] });

// ── 2. stock.html (มือถือ) ───────────────────────────────────────────────
const stockMock = `<script>
const CALLS = [];
const FAKE = {
  admins: [{ id: 'u1', full_name: 'เจ้าของร้าน', role: 'owner', is_active: true }],
  products: [
    { id: 'p1', sku: 'PIO-DDJ-FLX4', name: 'DDJ-FLX4', brand: 'Pioneer DJ', category: 'controller', barcode_ean13: '619659216054', cost_price: 0, sell_price: 12900, reorder_point: 1, is_active: true, image_path: null },
    ...${PRODUCTS}.map(p => Object.assign({ image_path: null }, p)),
  ],
  product_stock_levels: [{ product_id: 'p1', current_qty: 5 }, ...${LEVELS}],
  product_units: [], stock_movements: [],
};
function builder(table) {
  const q = {
    _rows: (FAKE[table] || []).slice(),
    select() { return q; }, eq(c, v) { q._rows = q._rows.filter(r => r[c] === v); return q; }, in(c, vs) { q._rows = q._rows.filter(r => vs.includes(r[c])); return q; },
    order() { return q; }, limit() { return q; },
    async maybeSingle() { return { data: q._rows[0] || null, error: null }; }, async single() { return { data: q._rows[0] || null, error: null }; },
    then(res, rej) { return Promise.resolve({ data: q._rows, error: null }).then(res, rej); },
    insert(payload) { CALLS.push({ op: 'insert', table, payload }); return q; }, update(payload) { CALLS.push({ op: 'update', table, payload }); return q; },
    upsert(payload) { CALLS.push({ op: 'upsert', table, payload }); return q; }, delete() { CALLS.push({ op: 'delete', table }); return q; },
  };
  return q;
}
window.supabase = { createClient: () => ({ from: builder, channel: () => ({ on() { return this; }, subscribe() { return this; } }),
  storage: { from: () => ({ async upload() { return { data: {}, error: null }; }, async remove() { return { data: [], error: null }; }, getPublicUrl(p) { return { data: { publicUrl: 'https://img.test/' + p } }; } }) },
  auth: { async getSession() { return { data: { session: { user: { id: 'u1' } } } }; }, onAuthStateChange() {}, async signInWithPassword() { return { data: {}, error: null }; }, async signOut() { return { error: null }; } } }) };
</script>`;
const STOCK = `<script>
window.addEventListener('load', () => setTimeout(runTests, 400));
${HARNESS}
const sleep = ms => new Promise(r => setTimeout(r, ms));
const $ = id => document.getElementById(id);
async function runTests() {
  L('=== products.stocked ใน stock.html ===');
  try { localStorage.clear(); } catch (e) {}
  showPage('Products'); await sleep(100);
  const ids = () => wall.wings.flatMap(w => w.items.map(p => p.id)).sort();
  const has = (...x) => x.every(i => ids().includes(i)), none = (...x) => x.every(i => !ids().includes(i));
  ok('ผนัง: ขึ้น s1 s3 s4 s7 · ไม่ขึ้น s2 s5 s6 · รุ่นเดิม p1 ยังอยู่', has('s1', 's3', 's4', 's7', 'p1') && none('s2', 's5', 's6'), ids().join(','));
  ok('ตัวนับ "หมด" = 3 (s1, s4, s7)', $('nOut').textContent === '3', $('nOut').textContent);
  wall.out = true; renderProducts();
  ok('กรอง "หมด": s1 s4 s7 เท่านั้น', ids().join(',') === 's1,s4,s7', ids().join(','));
  wall.out = false; renderProducts();
  setWallGroup('category'); await sleep(100);
  ok('จัดตามหมวด: ไม่มีปีกหมวด turntable (มีแต่รายการราคา) · ไม่มี s2 s5 s6', !wall.wings.some(w => w.title === catLabel('turntable')) && none('s2', 's5', 's6'), wall.wings.map(w => w.title).join('|'));
  setWallGroup('brand'); await sleep(100);
  // แดชบอร์ดเดิม (ใกล้หมด)
  renderDashboard();
  ok('แดชบอร์ด: จำนวนสินค้านับเฉพาะที่ขึ้นผนัง (p1 s1 s3 s4 s7 = 5)', $('statTotalProducts').textContent === '5', $('statTotalProducts').textContent);
  ok('แดชบอร์ด: รายการใกล้หมดไม่มีรายการราคา (s2 s5 s6)', !/รายการราคา ไม่สต็อก|เลิกขาย ไม่สต็อก|รายการราคาเดียว/.test($('lowStockList').textContent));
  const mv = (renderMovementProductOptions(), [...$('movProduct').options].map(o => o.value));
  ok('ตัวเลือกเคลื่อนไหวสต็อก: ไม่มี s2 s5 s6', ['s2', 's5', 's6'].every(i => !mv.includes(i)) && ['s1', 's3', 's4', 's7'].every(i => mv.includes(i)), mv.join(','));
  stockLevelMap['s2'] = 4; renderProducts();
  ok('มียอดเข้ามา → ขึ้นผนังทันที', has('s2'));
  stockLevelMap['s2'] = 0; renderProducts();

  // ขอบเขตนับสต็อก (หน้ามือถือ)
  ok('ขอบเขตนับ ปีก Pioneer DJ: มี s1 s3 s4 s7 · ไม่มี s2 (ไม่สต็อก ยอด 0)', ['s1', 's3', 's4', 's7'].every(i => scopeIds('b:Pioneer DJ').includes(i)) && !scopeIds('b:Pioneer DJ').includes('s2'), scopeIds('b:Pioneer DJ').join(','));
  ok('ขอบเขตนับ ปีก AlphaTheta: ไม่มี s5 (เลิกขายและไม่สต็อก)', !scopeIds('b:AlphaTheta').includes('s5'));
  const tray = countTrayHtml();
  ok('ตัวเลือกขอบเขตนับ: ไม่มีปีก Other (มีแต่รายการราคา) · ไม่มีหมวด turntable · ยังมีปีก Pioneer DJ กับหมวด controller',
    !tray.includes('value="b:Other"') && !tray.includes('value="c:' + catLabel('turntable') + '"') && tray.includes('value="b:Pioneer DJ"') && tray.includes('value="c:' + catLabel('controller') + '"'));

  // ฟอร์มสินค้า: ช่อง "ร้านสต็อกรุ่นนี้"
  CALLS.length = 0;
  openProductModal('s2');
  ok('แก้รุ่นที่มีคอลัมน์ stocked: ช่อง "ร้านสต็อกรุ่นนี้" โผล่ · ค่า = ไม่ติ๊ก (false)', !$('pfStockedRow').hidden && $('pfStocked').checked === false);
  $('pfStocked').checked = true; await saveProduct(); await sleep(100);
  const u1 = CALLS.find(c => c.op === 'update' && c.table === 'products');
  ok('บันทึก: ส่ง stocked = true ไปด้วย', !!u1 && u1.payload.stocked === true && u1.payload.is_active === true, JSON.stringify(u1 && u1.payload));
  openProductModal(null);
  ok('เพิ่มสินค้าใหม่ทันทีหลังเปิดแก้รุ่นที่มีช่อง: ช่องต้องซ่อน (ค่าเริ่มต้นของฐานข้อมูล stocked = true) — ไม่ค้างจากรุ่นก่อนหน้า', $('pfStockedRow').hidden === true);
  CALLS.length = 0;
  openProductModal('s4');
  ok('แก้รุ่นที่ยังไม่มีคอลัมน์ (หน้าขึ้นก่อนรัน 035): ช่องซ่อน', $('pfStockedRow').hidden === true);
  await saveProduct(); await sleep(100);
  const u2 = CALLS.find(c => c.op === 'update' && c.table === 'products');
  ok('บันทึกรุ่นที่ไม่มีคอลัมน์: ไม่ส่งคีย์ stocked (ไม่ทำให้ฐานข้อมูลที่ยังไม่รัน 035 ฟ้อง column ไม่มี)', !!u2 && !('stocked' in u2.payload), JSON.stringify(u2 && u2.payload));
  // ยิงรหัสที่ไม่รู้จัก (หน้ารับเข้า และหน้าสแกนทั่วไป): ตัวเลือกผูกบาร์โค้ด / เลือกรุ่นของซีเรียล
  const optIds = id => [...($(id) ? $(id).options : [])].map(o => o.value).filter(Boolean).sort();
  const okOpts = (label, id) => ok(label, ['s1', 's3', 's4', 's7'].every(i => optIds(id).includes(i)) && ['s2', 's5', 's6'].every(i => !optIds(id).includes(i)), optIds(id).join(','));
  askReceiveCode('9999999999990');
  okOpts('รับเข้า · ผูกบาร์โค้ด: เห็น s1 s3 s4 s7 · ไม่เห็น s2 s5 s6', 'linkProductSel');
  okOpts('รับเข้า · ซีเรียล: เห็น s1 s3 s4 s7 · ไม่เห็น s2 s5 s6', 'serialModelSel');
  $('scanError').innerHTML = '';
  try { await onScanned('9999999999991', true); } catch (e) { L('onScanned ล้ม: ' + e.message); }
  okOpts('สแกนทั่วไป · ผูกบาร์โค้ด: เห็น s1 s3 s4 s7 · ไม่เห็น s2 s5 s6', 'linkProductSel');
  L('=== สรุป: ' + pass + ' PASS / ' + fail + ' FAIL ===');
  L(fail ? 'RESULT:FAIL' : 'RESULT:PASS');
}
</script>`;
const sr = runPage({ root: pageRoot, file: 'stock.html', mock: stockMock, tests: STOCK, flags: ['--window-size=390,844'] });

console.log('\n=== stocked: ' + (dr.ok && sr.ok ? 'ผ่าน' : 'ไม่ผ่านหรือไม่ได้รันจนจบ') + ' ===');
process.exit(dr.ok && sr.ok ? 0 : 1);
