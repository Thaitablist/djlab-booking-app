/**
 * เทสต์ผนังสต็อกบนมือถือ (stock.html) — จอ 390×844 แนวตั้ง
 *   รัน: node tests/stock-phone.mjs
 *
 * วิธีเดียวกับชุดอื่น: ไฟล์จริงทุกบรรทัด สลับเฉพาะแท็ก Supabase เป็นตัวปลอม
 * เปิด Chrome ด้วยหน้าต่างขนาดมือถือจริง เพื่อวัดเป้ากด (≥ 44px) กับการ์ดสองคอลัมน์จากเลย์เอาต์จริง
 * ความสามารถเดิมของหน้า (กล้อง · ยิงซีเรียลรายเครื่อง · เคลื่อนไหว · ประวัติ · ฟอร์มสินค้า) อยู่ใน wedge-scanner.mjs
 */

import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { runPage, HARNESS } from './lib/page-test.mjs';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');

const mock = user => `<script>
const CALLS = [];
const FAKE = {
  admins: [
    { id: 'u1', full_name: 'เจ้าของร้าน', role: 'owner', is_active: true },
    { id: 'u2', full_name: 'พนักงานหน้าร้าน', role: 'staff', is_active: true },
  ],
  products: [
    { id: 'p1', sku: 'PIO-DDJ-FLX4', name: 'DDJ-FLX4', brand: 'Pioneer DJ', category: 'controller',
      barcode_ean13: '619659216054', cost_price: 0, sell_price: 12900, reorder_point: 1, is_active: true, image_path: null },
    { id: 'p2', sku: 'NEO-USB-B1', name: 'NEO USB Class B 1.0m', brand: 'NEO by OYAIDE', category: 'cable',
      barcode_ean13: '4944711000011', cost_price: 0, sell_price: 2490, reorder_point: 5, is_active: true, image_path: null },
    { id: 'p4', sku: 'APT-DJM-V5', name: 'DJM-V5', brand: 'AlphaTheta', category: 'mixer',
      barcode_ean13: null, cost_price: 0, sell_price: 89900, reorder_point: 1, is_active: true, image_path: 'p4/old.webp' },
    { id: 'p11', sku: 'APT-DJM-S5', name: 'DJM-S5', brand: 'AlphaTheta', category: 'mixer',
      barcode_ean13: null, cost_price: 0, sell_price: 35900, reorder_point: 1, is_active: true, image_path: null },
    { id: 'p5', sku: 'APT-CDJ-3000X', name: 'CDJ-3000X', brand: 'AlphaTheta', category: 'player',
      barcode_ean13: null, cost_price: 0, sell_price: 109000, reorder_point: 1, is_active: true, image_path: null },
    { id: 'p10', sku: 'APT-XDJ-AZ', name: 'XDJ-AZ', brand: 'AlphaTheta', category: 'all-in-one',
      barcode_ean13: null, cost_price: 0, sell_price: 139000, reorder_point: 1, is_active: true, image_path: null },
    { id: 'p6', sku: 'PIO-PLX-1000', name: 'PLX-1000', brand: 'Pioneer DJ', category: 'turntable',
      barcode_ean13: null, cost_price: 0, sell_price: 27900, reorder_point: 1, is_active: true, image_path: null },
    { id: 'p7', sku: 'OTH-BAG', name: 'กระเป๋าหูฟัง', brand: 'Other', category: 'dj-bag',
      barcode_ean13: null, cost_price: 0, sell_price: 500, reorder_point: 0, is_active: true, image_path: null },
    { id: 'p12', sku: 'PIO-DJM-S11', name: 'DJM-S11', brand: 'Pioneer DJ', category: 'mixer',
      barcode_ean13: null, cost_price: 0, sell_price: 85900, reorder_point: 1, is_active: true, image_path: null },
  ],
  product_stock_levels: [
    { product_id: 'p12', current_qty: 1 },
    { product_id: 'p1', current_qty: 5 }, { product_id: 'p2', current_qty: 2 }, { product_id: 'p4', current_qty: 0 },
    { product_id: 'p5', current_qty: 4 }, { product_id: 'p11', current_qty: 3 }, { product_id: 'p10', current_qty: 2 }, { product_id: 'p6', current_qty: 3 }, { product_id: 'p7', current_qty: 1 },
  ],
  product_units: [
    { id: 'u-a', product_id: 'p1', serial_no: 'CHMP123354NN', barcode_code: 'CHMP123354NN', status: 'in_stock', received_at: '2026-09-01T10:00:00Z' },
    { id: 'u-b', product_id: 'p1', serial_no: 'CHMP555555NN', barcode_code: 'CHMP555555NN', status: 'in_stock', received_at: '2026-09-02T10:00:00Z' },
    { id: 'u-c', product_id: 'p1', serial_no: 'CHMP999999NN', barcode_code: 'CHMP999999NN', status: 'sold', received_at: '2026-08-01T10:00:00Z' },
  ],
  stock_movements: [
    { id: 'm1', product_id: 'p1', type: 'in', qty: 5, reason: 'รับของ', created_at: '2026-09-01T10:00:00Z', admin_id: 'u1',
      products: { name: 'DDJ-FLX4', sku: 'PIO-DDJ-FLX4' }, admins: { full_name: 'เจ้าของร้าน' } },
  ],
};
function builder(table) {
  const q = {
    _rows: (FAKE[table] || []).slice(),
    select() { return q; },
    eq(col, val) { q._rows = q._rows.filter(r => r[col] === val); return q; },
    in(col, vals) { q._rows = q._rows.filter(r => vals.includes(r[col])); return q; },
    order() { return q; }, limit() { return q; },
    async maybeSingle() { return { data: q._rows[0] || null, error: null }; },
    async single() { return { data: q._rows[0] || null, error: null }; },
    then(res, rej) { return Promise.resolve({ data: q._rows, error: null }).then(res, rej); },
    insert(payload) { CALLS.push({ op: 'insert', table, payload }); return q; },
    update(payload) { CALLS.push({ op: 'update', table, payload }); return q; },
    upsert(payload) { CALLS.push({ op: 'upsert', table, payload }); return q; },
    delete() { CALLS.push({ op: 'delete', table }); return q; },
  };
  return q;
}
window.supabase = {
  createClient: () => ({
    from: builder,
    channel: () => ({ on() { return this; }, subscribe() { return this; } }),
    storage: { from: bucket => ({
      async upload(path, blob) { CALLS.push({ op: 'upload', bucket, path, blob }); return { data: { path }, error: null }; },
      async remove(paths) { CALLS.push({ op: 'remove', bucket, paths }); return { data: [], error: null }; },
      getPublicUrl(path) { return { data: { publicUrl: 'https://img.test/' + bucket + '/' + path } }; },
    }) },
    auth: {
      async getSession() { return { data: { session: { user: { id: '${user}' } } } }; },
      onAuthStateChange() {},
      async signInWithPassword() { return { data: {}, error: null }; },
      async signOut() { return { error: null }; },
    },
  }),
};
</script>`;

const COMMON = `
${HARNESS}
const sleep = ms => new Promise(r => setTimeout(r, ms));
const $ = id => document.getElementById(id);
const txt = id => $(id).textContent;
const R = el => el.getBoundingClientRect();
const serialSeq = s => s.split('').map(ch => /[0-9]/.test(ch) ? ['Digit' + ch, 0] : ['Key' + ch, 1]);
const tabs = () => [...document.querySelectorAll('#wallTabs .pw-tab')];
// เป้ากดที่เล็กกว่า 44px (ปุ่มที่มองเห็นเท่านั้น)
function small(sel) {
  return [...document.querySelectorAll(sel)].filter(el => {
    const r = R(el);
    return r.width > 0 && r.height > 0 && (r.height < 44 || r.width < 44);
  }).map(el => (el.id || el.className || el.tagName) + ' ' + Math.round(R(el).width) + 'x' + Math.round(R(el).height));
}
`;

const OWNER = `<script>
window.addEventListener('load', () => setTimeout(runTests, 400));
${COMMON}
async function runTests() {
  L('=== ผนังสต็อกมือถือ stock.html (เจ้าของร้าน) ===');
  try { localStorage.clear(); } catch (e) {}
  showPage('Products');
  await sleep(50);
  // Chrome headless เปิดหน้าต่างแคบกว่า 500px ไม่ได้ — หน้านี้ล็อกความกว้างที่ 480px อยู่แล้ว เลย์เอาต์จึงเป็นแบบมือถือ
  // (ภาพหน้าจอ 390×844 ถ่ายผ่าน DevTools Protocol แยกต่างหาก)
  ok('เลย์เอาต์แบบมือถือ (กว้างไม่เกิน 480px)', R(document.body).width <= 480, R(document.body).width);
  ok('หน้าสินค้าเป็นผนังเต็มจอ แถบยิงอยู่บน', document.body.classList.contains('on-wall') && R(document.querySelector('.pw-bar')).top >= 50);

  // ── 1. แท็บปีก ─────────────────────────────────────────────────────────
  ok('ปีกแบรนด์เป็นแท็บ 4 แท็บตามลำดับที่เคาะ', tabs().map(t => t.firstChild.textContent).join('|') === 'AlphaTheta|Pioneer DJ|NEO by OYAIDE|แบรนด์อื่น',
    tabs().map(t => t.textContent).join('|'));
  const panels = $('wallPanels');
  const ps = [...panels.querySelectorAll('.pw-panel')];
  ok('แต่ละปีกเป็นแผงกว้างเต็มจอ ปัดซ้ายขวาได้ (scroll-snap)', ps.length === 4 && ps.every(p => Math.abs(R(p).width - panels.clientWidth) < 1) &&
    getComputedStyle(panels).scrollSnapType.indexOf('x') !== -1, ps.map(p => R(p).width).join());
  panels.scrollLeft = panels.clientWidth * 2;
  panels.dispatchEvent(new Event('scroll'));
  ok('ปัดไปแผงที่ 3 แล้วแท็บ NEO ถูกเลือกตาม', wall.tab === 2 && tabs()[2].getAttribute('aria-selected') === 'true', wall.tab);
  wallGoTab(1, true);
  ok('แตะแท็บ Pioneer DJ = เลื่อนไปแผงนั้น', Math.abs(panels.scrollLeft - panels.clientWidth) < 2 && tabs()[1].getAttribute('aria-selected') === 'true', panels.scrollLeft);
  wallGoTab(0, true);

  // ── 2. การ์ดรูป 2 คอลัมน์ + ตัวเลขใหญ่ + สถานะเป็นคำ ─────────────────────
  const grid = [...ps[0].querySelectorAll('.pw-grid')].find(g => g.children.length >= 2);
  const cards = grid ? [...grid.children] : [];
  ok('การ์ดเรียง 2 คอลัมน์', cards.length >= 2 && Math.abs(R(cards[0]).top - R(cards[1]).top) < 1 && R(cards[1]).left > R(cards[0]).right - 1,
    cards.slice(0, 2).map(c => Math.round(R(c).left) + ',' + Math.round(R(c).top)).join(' '));
  ok('การ์ดมีรูป/ช่องรูป ชื่อ ราคา และตัวเลขคงเหลือตัวใหญ่', !!$('pc-p5').querySelector('.pc-ph') && $('pc-p5').querySelector('.pc-qty').textContent === '4' &&
    parseFloat(getComputedStyle($('pc-p5').querySelector('.pc-qty')).fontSize) >= 30);
  ok('หมด = คำว่า "หมด" บนการ์ด ไม่ใช่สีอย่างเดียว', $('pc-p4').classList.contains('out') && $('pc-p4').querySelector('.tag.out').textContent === 'หมด');
  wallGoTab(2, true);
  ok('ใกล้หมด = คำว่า "ใกล้หมด"', $('pc-p2').querySelector('.tag.low').textContent === 'ใกล้หมด');
  wallGoTab(0, true);
  const svgNorm = h => { const t = document.createElementNS('http://www.w3.org/2000/svg', 'svg'); t.innerHTML = h; return t.innerHTML; };
  ok('การ์ดที่ไม่มีรูปได้ลายเส้นตามหมวด (player) ไม่ใช่กล่องเทาซ้ำ ๆ', !!$('pc-p5').querySelector('.pc-ph svg.sil') &&
    $('pc-p5').querySelector('.pc-ph svg.sil').innerHTML === svgNorm(SIL.player));
  wallGoTab(3, true);
  ok('หมวดที่ไม่รู้จักได้ลายกล่อง', $('pc-p7').querySelector('svg.sil').innerHTML === svgNorm(SIL.box));
  wallGoTab(0, true);
  ok('รูปจริงและลายเส้นอยู่บนกระเบื้องขาวระยะในเท่ากัน', ['pc-p4', 'pc-p5'].map(id => getComputedStyle($(id).querySelector('.pc-ph')))
    .every((t, i, a) => t.backgroundColor === 'rgb(255, 255, 255)' && t.paddingTop === a[0].paddingTop));

  // ── 3. เป้ากด ≥ 44px ───────────────────────────────────────────────────
  const tooSmall = small('.pw-bar button, .pw-bar label, .pw-tab, .pc, .nav-btn');
  ok('ทุกปุ่มบนแถบยิง แท็บ การ์ด และแถบล่าง ≥ 44px', !tooSmall.length, tooSmall.join(' | '));
  const fonts = [...document.querySelectorAll('#pageProducts *')].filter(el => el.children.length === 0 && el.textContent.trim())
    .map(el => parseFloat(getComputedStyle(el).fontSize)).filter(f => f < 14);
  ok('ตัวหนังสือในผนังไม่เล็กกว่า 14px (กฎข้อ 6)', !fonts.length, fonts.join());

  // ── 4. จัดตามหมวด + จำแยกรายคน ─────────────────────────────────────────
  setWallGroup('category');
  ok('สลับเป็นจัดตามหมวด: แท็บ = หมวดจากข้อมูล (ที่ไม่รู้จักแสดงตามที่พิมพ์)',
    tabs().map(t => t.firstChild.textContent).join('|') === 'เครื่องเล่น|ออลอินวัน|มิกเซอร์|คอนโทรลเลอร์|เทิร์นเทเบิล|สาย|dj-bag', tabs().map(t => t.firstChild.textContent).join('|'));
  let saved = null; try { saved = localStorage.getItem('djlab.stockGroup.v1:u1'); } catch (e) {}
  ok('จำการจัดไว้ของคนนี้ (คีย์เดียวกับ desk.html)', saved === 'category', saved);
  setWallGroup('brand');

  // ── 5. แตะการ์ด = ลิ้นชักล่าง ───────────────────────────────────────────
  await openSheet('p1');
  const sheet = $('sheetBody');
  document.getAnimations().forEach(a => a.finish());       // รอแอนิเมชันเลื่อนขึ้นจบก่อนวัด
  ok('ลิ้นชักล่างเปิด ชิดขอบล่างของจอ', $('productSheet').classList.contains('open') && Math.abs(R(sheet).bottom - window.innerHeight) < 2, Math.round(R(sheet).bottom) + ' vs ' + window.innerHeight);
  ok('ลิ้นชักมียอดตัวใหญ่ · ซีเรียลแยกตามสถานะ · ความเคลื่อนไหว', sheet.querySelector('.sh-num').textContent === '5' &&
    [...sheet.querySelectorAll('.sn-group h4')].map(h => h.textContent).join('|') === '2อยู่ในสต็อก|1ขายแล้ว' && /รับของ/.test(sheet.textContent));
  ok('ปุ่มในลิ้นชัก: รับเข้า · ตัดออก · ปรับยอด · นับ', [...sheet.querySelectorAll('.sh-act button')].map(b => b.textContent).join('|') === 'รับเข้า|ตัดออก|ปรับยอด|นับ');
  ok('เจ้าของร้าน: ปุ่มเพิ่มรูป + แก้ไขข้อมูลสินค้า', /เพิ่มรูป/.test(sheet.textContent) && /แก้ไขข้อมูลสินค้า/.test(sheet.textContent));
  const shName = sheet.querySelector('.sh-name'), shMeta = sheet.querySelector('.sh-meta');
  ok('ชื่อรุ่นมาก่อน บรรทัดแบรนด์·หมวด·SKU อยู่ใต้ชื่อ (เหมือนแผงบนคอม)', !!shName && !!shMeta && R(shMeta).top > R(shName).bottom - 1 &&
    shName.compareDocumentPosition(shMeta) === Node.DOCUMENT_POSITION_FOLLOWING);
  const rps = [...sheet.querySelectorAll('.sh-side .rp')].map(e => e.textContent);
  ok('ราคามีบรรทัดของตัวเอง ไม่ต่อท้ายจุดสั่งซื้อซ้ำ', rps.length === 2 && rps[0] === 'จุดสั่งซื้อซ้ำ ≤ 1' && rps[1].indexOf('฿12,900') !== -1, rps.join(' | '));
  const tooSmallSheet = small('#sheetBody button');
  ok('ปุ่มทุกปุ่มในลิ้นชัก ≥ 44px', !tooSmallSheet.length, tooSmallSheet.join(' | '));
  closeSheet();

  // ── 6. ยิงในโหมดหา → ไปแท็บของรุ่นนั้น + เปิดลิ้นชัก ─────────────────────
  wallGoTab(3, true);
  burst(digits('619659216054'));
  await sleep(250);
  ok('ยิงบาร์โค้ดรุ่น: ไปแท็บ Pioneer DJ ไฮไลต์การ์ด เปิดลิ้นชัก', wall.tab === 1 && $('pc-p1').classList.contains('hit') &&
    $('productSheet').classList.contains('open') && txt('sheetTitle') === 'DDJ-FLX4', wall.tab);
  closeSheet();
  burstMixed(serialSeq('CHMP555555NN'));
  await sleep(250);
  const hit = document.querySelector('#sheetBody .sn.hit');
  ok('ยิงซีเรียล: ลิ้นชักของรุ่นนั้น ไฮไลต์เครื่องที่ยิง', !!hit && hit.textContent === 'CHMP555555NN');
  closeSheet();

  // ── 7. รับเข้า: ถาดเป็นลิ้นชักล่าง ────────────────────────────────────
  setWallMode('receive');
  ok('โหมดรับเข้า: ถาดขึ้นเหนือแถบเมนู · เครื่องยิงไปทาง receive', !$('tray').hidden && wedgeRoute() === 'receive' &&
    Math.abs(R($('tray')).bottom - (window.innerHeight - 62)) < 2, Math.round(R($('tray')).bottom));
  burst(digits('619659216054')); await sleep(100);
  burstMixed(serialSeq('NEWSER0001')); await sleep(150);
  burstMixed(serialSeq('CHMP123354NN')); await sleep(150);
  ok('ซีเรียลที่มีในระบบแล้วถูกปฏิเสธพร้อมข้อความ', rcvTotal() === 1 && /มีในระบบแล้ว/.test(txt('tray')), txt('tray'));
  ok('หัวถาดบอกยอดรวม + ปุ่มยืนยัน', /รับเข้า 1 ชิ้น/.test(txt('tray')) && txt('rcvConfirmBtn') === 'ยืนยัน (1)');
  if (!trayOpen) toggleTray();
  ok('กางถาด: เห็นซีเรียลทีละแถว พร้อมปุ่มเอาออก', /NEWSER0001/.test(txt('tray')) && !!document.querySelector('#tray .tg-sn .iconbtn'));
  rcvAddSerial('p1', 'DDJGRV6510283NN');
  const snEl = [...document.querySelectorAll('#tray .tg-sn > span:first-child')].find(e => e.textContent === 'DDJGRV6510283NN');
  ok('ซีเรียลยาวอยู่บรรทัดเดียว ≥ 14px ไม่ถูกตัดกลาง', !!snEl && getComputedStyle(snEl).whiteSpace === 'nowrap' &&
    R(snEl).height < parseFloat(getComputedStyle(snEl).fontSize) * 2 && parseFloat(getComputedStyle(snEl).fontSize) >= 14 &&
    R(snEl).right <= R($('tray')).right, snEl && (Math.round(R(snEl).width) + 'x' + Math.round(R(snEl).height)));
  rcvUndo('p1', rcvGroup('p1').serials.indexOf('DDJGRV6510283NN'));
  const tooSmallTray = small('#tray button');
  ok('ปุ่มในถาดทุกปุ่ม ≥ 44px', !tooSmallTray.length, tooSmallTray.join(' | '));
  CALLS.length = 0;
  await rcvConfirm();
  const iu = CALLS.findIndex(c => c.op === 'insert' && c.table === 'product_units');
  const im = CALLS.findIndex(c => c.op === 'insert' && c.table === 'stock_movements');
  ok('ยืนยัน: product_units ก่อน stock_movements', iu !== -1 && im !== -1 && iu < im, JSON.stringify(CALLS.map(c => c.op + ':' + c.table)));
  ok('ลงยอดรับเข้าเท่าจำนวนซีเรียล', im !== -1 && CALLS[im].payload.length === 1 && CALLS[im].payload[0].qty === 1 && CALLS[im].payload[0].type === 'in');

  // ── 8. นับ ─────────────────────────────────────────────────────────────
  setWallMode('count');
  countSetScope('b:Pioneer DJ');
  await countStart();
  burstMixed(serialSeq('CHMP123354NN')); await sleep(150);
  countAdj('p6', 1); countAdj('p6', 1); countAdj('p6', 1);
  if (!trayOpen) toggleTray();
  ok('ถาดนับบอกเครื่องที่ยังไม่ได้ยิง', /CHMP555555NN/.test(document.querySelector('#tray .cl[data-id="p1"]').textContent));
  ok('หัวถาดนับบอกรุ่นที่ยังไม่นับ และที่จะถูกตั้งเป็น 0', txt('cntSummary').includes('ยังไม่นับ 1') && txt('cntSummary').includes('จะถูกตั้งเป็น 0: 1') &&
    !!document.querySelector('#cntSummary .zero-warn'), txt('cntSummary'));
  ok('ปุ่มยืนยันแยก "ตามนับ" ออกจาก "เป็น 0"', txt('cntConfirmBtn') === 'ยืนยันตามนับ 1 · เป็น 0 อีก 1', txt('cntConfirmBtn'));
  ok('แถวที่ยังไม่นับบอกว่าจะเป็น 0 เท่าไหร่', document.querySelector('#tray .cl[data-id="p12"] .cl-var.zero').textContent.includes('จะเป็น 0 (-1)'));
  countConfirm();
  ok('ยืนยันแบบสองขั้น: เห็นสองกองแยกกันก่อน ยังไม่เขียนอะไร', cnt.confirming && txt('tray').includes('ปรับตามที่นับได้ (1)') &&
    txt('tray').includes('ตั้งเป็น 0 เพราะยังไม่ได้นับ (1)') && txt('cntCommitBtn') === 'ลงปรับยอด 1 + ตั้งเป็น 0 อีก 1 (รวม 2)', txt('cntCommitBtn'));
  CALLS.length = 0;
  await countCommit();
  const adj = CALLS.filter(c => c.op === 'insert');
  const rowsAdj = adj.length ? adj[0].payload : [];
  ok('ลงเฉพาะรุ่นที่ไม่ตรง เป็นปรับยอด (DDJ-FLX4 5 → 1 = −4 · DJM-S11 ยังไม่นับ 1 → 0 = −1 · PLX-1000 ตรงไม่ลง)',
    adj.length === 1 && adj[0].table === 'stock_movements' && rowsAdj.length === 2 && rowsAdj.every(x => x.type === 'adjustment') &&
    rowsAdj.find(x => x.product_id === 'p1').qty === -4 && rowsAdj.find(x => x.product_id === 'p12').qty === -1 && !rowsAdj.some(x => x.product_id === 'p6'),
    JSON.stringify(rowsAdj));
  ok('ไม่มี update/delete ใด ๆ', !CALLS.some(c => c.op === 'update' || c.op === 'delete'));
  setWallMode('find');
  ok('กลับโหมดหา ถาดหายไป', $('tray').hidden);

  // ── 9. รูปสินค้า ────────────────────────────────────────────────────────
  const cv = document.createElement('canvas'); cv.width = 1200; cv.height = 900;
  cv.getContext('2d').fillRect(100, 100, 800, 600);
  const png = await new Promise(r => cv.toBlob(r, 'image/png'));
  CALLS.length = 0;
  const done = await uploadPhoto('p5', new File([png], 'cdj.png', { type: 'image/png' }));
  const up = CALLS.find(c => c.op === 'upload'), upd = CALLS.find(c => c.op === 'update');
  ok('อัปโหลดขึ้นถัง product-images แล้วชี้ image_path', done && up && up.bucket === 'product-images' && upd && upd.payload.image_path === up.path &&
    CALLS.indexOf(up) < CALLS.indexOf(upd), JSON.stringify(CALLS.map(c => c.op)));
  showPage('Movement');
  ok('ออกจากหน้าสินค้าแล้วผนังไม่ครองจอ', !document.body.classList.contains('on-wall'));

  L('=== สรุป: ' + pass + ' PASS / ' + fail + ' FAIL ===');
  L(fail ? 'RESULT:FAIL' : 'RESULT:PASS');
}
</script>`;

const STAFF = `<script>
window.addEventListener('load', () => setTimeout(runTests, 400));
${COMMON}
async function runTests() {
  L('=== ผนังสต็อกมือถือ stock.html (พนักงาน) ===');
  showPage('Products');
  await sleep(50);
  ok('พนักงาน: การ์ดไม่มีรูปบอกแค่ "ไม่มีรูป"', /ไม่มีรูป/.test($('pc-p5').textContent) && !/แตะเพื่อเพิ่มรูป/.test(txt('wallPanels')));
  await openSheet('p4');
  ok('พนักงาน: ลิ้นชักไม่มีปุ่มเพิ่ม/เปลี่ยน/เอารูปออก และแก้ไขข้อมูลสินค้า', !/เพิ่มรูป|เปลี่ยนรูป|เอารูปออก|แก้ไขข้อมูลสินค้า/.test(txt('sheetBody')));
  CALLS.length = 0;
  const cv = document.createElement('canvas'); cv.width = 10; cv.height = 10;
  const png = await new Promise(r => cv.toBlob(r, 'image/png'));
  const r = await uploadPhoto('p4', new File([png], 'x.png', { type: 'image/png' }));
  ok('พนักงาน: เรียกอัปโหลดตรง ๆ ไม่ผ่าน ไม่มีอะไรขึ้นถัง', r === false && !CALLS.length, JSON.stringify(CALLS.map(c => c.op)));
  ok('พนักงาน: ไม่เห็นปุ่มเพิ่มสินค้าใหม่', $('addProductBtn').style.display === 'none');
  L('=== สรุป: ' + pass + ' PASS / ' + fail + ' FAIL ===');
  L(fail ? 'RESULT:FAIL' : 'RESULT:PASS');
}
</script>`;

const flags = ['--window-size=390,844'];
const a = runPage({ root, file: 'stock.html', mock: mock('u1'), tests: OWNER, flags });
const b = runPage({ root, file: 'stock.html', mock: mock('u2'), tests: STAFF, flags });
process.exit(a.ok && b.ok ? 0 : 1);
