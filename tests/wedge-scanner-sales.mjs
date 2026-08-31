/**
 * เทสต์ตัวรับเครื่องยิงบาร์โค้ดในหน้า sales.html
 *   รัน: node tests/wedge-scanner-sales.mjs
 */

import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { runPage, HARNESS } from './lib/page-test.mjs';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');

const MOCK = `<script>
const FAKE = {
  admins: [{ id: 'u1', full_name: 'เจ้าของร้าน', role: 'owner', is_active: true }],
  products: [
    { id: 'p1', sku: 'PIO-DDJ-FLX4', name: 'DDJ-FLX4', brand: 'Pioneer DJ',
      barcode_ean13: '619659216054', sell_price: 12900, is_active: true },
    { id: 'p2', sku: 'NEO-RCA', name: 'สาย RCA', brand: 'NEO by OYAIDE',
      barcode_ean13: null, sell_price: 590, is_active: true },
  ],
  product_units: [
    { id: 'u-ok',   product_id: 'p1', serial_no: 'CHMP123354NN', barcode_code: 'CHMP123354NN', status: 'in_stock' },
    { id: 'u-sold', product_id: 'p1', serial_no: 'CHMP999999NN', barcode_code: 'CHMP999999NN', status: 'sold' },
  ],
  product_stock_levels: [{ product_id: 'p1', current_qty: 5 }],
  customers: [], sales: [], sale_items: [], members: [],
};
function builder(table) {
  const q = {
    _rows: (FAKE[table] || []).slice(),
    select() { return q; },
    eq(col, val) { q._rows = q._rows.filter(r => r[col] === val); return q; },
    or() { return q; }, ilike() { return q; }, order() { return q; },
    gte() { return q; }, lte() { return q; }, gt() { return q; }, lt() { return q; },
    not() { return q; }, is() { return q; }, in() { return q; },
    limit() { return q; }, range() { return q; },
    async maybeSingle() { return { data: q._rows[0] || null, error: null }; },
    async single() { return { data: q._rows[0] || null, error: null }; },
    then(res, rej) { return Promise.resolve({ data: q._rows, error: null, count: q._rows.length }).then(res, rej); },
    insert() { return q; }, update() { return q; }, upsert() { return q; }, delete() { return q; },
  };
  return q;
}
window.supabase = {
  createClient: () => ({
    from: builder,
    rpc: async () => ({ data: null, error: null }),
    channel: () => ({ on() { return this; }, subscribe() { return this; } }),
    auth: {
      async getSession() { return { data: { session: { user: { id: 'u1' } } } }; },
      onAuthStateChange() {},
      async signInWithPassword() { return { data: {}, error: null }; },
      async signOut() { return { error: null }; },
    },
  }),
};
</script>`;

const TESTS = `<script>
window.addEventListener('load', () => setTimeout(runTests, 400));
${HARNESS}

function cartQty(productId) {
  const line = cart.find(c => c.product_id === productId);
  return line ? line.qty : 0;
}

async function runTests() {
  L('=== เครื่องยิงบาร์โค้ดในหน้าขายสินค้า ===');

  // ── 1. ยิงบาร์โค้ดของรุ่น เข้าตะกร้าเลย ────────────────────────────────
  {
    cart.length = 0; renderCart();
    showPage('Sales');
    const enter = burst(digits('619659216054'));
    await new Promise(r => setTimeout(r, 150));
    ok('ยิงบาร์โค้ดของรุ่นแล้วเข้าตะกร้า', cartQty('p1') === 1, JSON.stringify(cart));
    ok('Enter ถูกกันไม่ให้ไปสั่งงานอื่นต่อ', enter.defaultPrevented);
  }

  // ── 2. ยิงของรุ่นเดียวกันสองชิ้นติด ๆ กัน ต้องนับ 2 ────────────────────
  {
    burst(digits('619659216054'));
    await new Promise(r => setTimeout(r, 150));
    ok('ยิงของเหมือนกันสองชิ้นติดกันนับได้ 2 (ไม่โดนกันว่าเป็นการอ่านซ้ำ)',
      cartQty('p1') === 2, 'ได้ ' + cartQty('p1'));
  }

  // ── 3. ยิงซีเรียล ผูกเครื่องนั้นกับบิล ─────────────────────────────────
  {
    cart.length = 0; renderCart();
    const seq = [['KeyC',1],['KeyH',1],['KeyM',1],['KeyP',1],['Digit1',0],['Digit2',0],
                 ['Digit3',0],['Digit3',0],['Digit5',0],['Digit4',0],['KeyN',1],['KeyN',1]];
    burstMixed(seq);
    await new Promise(r => setTimeout(r, 200));
    const line = cart.find(c => c.product_id === 'p1');
    ok('ยิงซีเรียลแล้วเข้าตะกร้าพร้อมผูกเครื่อง',
      !!line && line.unit_ids.length === 1 && line.serials[0] === 'CHMP123354NN',
      JSON.stringify(cart));
    ok('จำนวนถูกล็อกเท่าจำนวนซีเรียลที่ยิง', !!line && line.qty === 1, line && line.qty);
  }

  // ── 4. ยิงซีเรียลเดิมซ้ำ ต้องไม่เพิ่มซ้ำ ───────────────────────────────
  {
    const seq = [['KeyC',1],['KeyH',1],['KeyM',1],['KeyP',1],['Digit1',0],['Digit2',0],
                 ['Digit3',0],['Digit3',0],['Digit5',0],['Digit4',0],['KeyN',1],['KeyN',1]];
    burstMixed(seq);
    await new Promise(r => setTimeout(r, 200));
    const line = cart.find(c => c.product_id === 'p1');
    ok('ยิงซีเรียลเดิมซ้ำไม่ถูกนับเพิ่ม', !!line && line.unit_ids.length === 1,
      JSON.stringify(line && line.serials));
  }

  // ── 5. ซีเรียลของเครื่องที่ขายไปแล้ว ต้องไม่เข้าตะกร้า ─────────────────
  {
    cart.length = 0; renderCart();
    const seq = [['KeyC',1],['KeyH',1],['KeyM',1],['KeyP',1],['Digit9',0],['Digit9',0],
                 ['Digit9',0],['Digit9',0],['Digit9',0],['Digit9',0],['KeyN',1],['KeyN',1]];
    burstMixed(seq);
    await new Promise(r => setTimeout(r, 200));
    ok('เครื่องที่ขายไปแล้วไม่ถูกใส่ตะกร้า', cart.length === 0, JSON.stringify(cart));
    ok('มีข้อความบอกเหตุผล ไม่เงียบ',
      document.getElementById('toast').textContent.indexOf('ขายออกไปแล้ว') !== -1,
      document.getElementById('toast').textContent);
  }

  // ── 6. รหัสที่ไม่มีในระบบ ──────────────────────────────────────────────
  {
    cart.length = 0; renderCart();
    document.getElementById('toast').textContent = '';
    burst(digits('111122223333'));
    await new Promise(r => setTimeout(r, 200));
    ok('รหัสที่ไม่รู้จักไม่เข้าตะกร้า', cart.length === 0);
    ok('รหัสที่ไม่รู้จักมีข้อความบอก ไม่เงียบ',
      document.getElementById('toast').textContent.indexOf('ไม่พบรหัส') !== -1,
      document.getElementById('toast').textContent);
  }

  // ── 7. อยู่แท็บประวัติ ห้ามหยิบของใส่ตะกร้าลับหลัง ────────────────────
  {
    cart.length = 0; renderCart();
    showPage('History');
    document.getElementById('toast').textContent = '';
    burst(digits('619659216054'));
    await new Promise(r => setTimeout(r, 150));
    ok('อยู่แท็บประวัติแล้วยิง ไม่เข้าตะกร้า', cart.length === 0, JSON.stringify(cart));
    ok('บอกให้ไปแท็บขายสินค้าก่อน',
      document.getElementById('toast').textContent.indexOf('ขายสินค้า') !== -1,
      document.getElementById('toast').textContent);
    showPage('Sales');
  }

  // ── 8. มีกล่องอื่นเปิดค้างอยู่ ────────────────────────────────────────
  {
    cart.length = 0; renderCart();
    document.getElementById('customerModal').classList.add('open');
    document.getElementById('toast').textContent = '';
    burst(digits('619659216054'));
    await new Promise(r => setTimeout(r, 150));
    ok('กล่องเพิ่มลูกค้าเปิดอยู่ ไม่หยิบของใส่ตะกร้าลับหลัง', cart.length === 0, JSON.stringify(cart));
    ok('บอกให้ปิดกล่องก่อน',
      document.getElementById('toast').textContent.indexOf('ปิดหน้าต่าง') !== -1,
      document.getElementById('toast').textContent);
    document.getElementById('customerModal').classList.remove('open');
  }

  // ── 9. คนพิมพ์ปกติต้องไม่โดนจับเป็นการยิง ─────────────────────────────
  {
    cart.length = 0; renderCart();
    const enter = burst(digits('12345678'), { gap: 120 });
    await new Promise(r => setTimeout(r, 150));
    ok('คนพิมพ์ช้า ๆ แล้วกด Enter ไม่ถือเป็นการยิง', cart.length === 0);
    ok('Enter ของคนยังทำงานตามปกติ', !enter.defaultPrevented);
  }

  // ── 10. ค่าที่หลุดลงช่องค้นหาต้องถูกคืน ───────────────────────────────
  {
    cart.length = 0; renderCart();
    const box = document.getElementById('productSearch');
    box.value = 'DDJ';
    box.focus();
    ok('ทดสอบได้จริง: โฟกัสอยู่ในช่องค้นหา', document.activeElement === box,
      document.activeElement && document.activeElement.id);
    clock += 5000;
    digits('619659216054').forEach((c, i) => {
      if (i) clock += 6;
      press(c, { target: box });
      box.value += thaiKeyFor(c);
    });
    clock += 6;
    press('Enter', { target: box, key: 'Enter' });
    await new Promise(r => setTimeout(r, 150));
    ok('ค่าที่หลุดเข้าช่องค้นหาไม่ค้างอยู่', box.value !== 'DDJุๅตุถต/ๅุจถภ', box.value);
    ok('ยังเข้าตะกร้าได้ตามปกติ', cartQty('p1') === 1, JSON.stringify(cart));
    box.blur();
  }

  // ── 11. กล้องต้องไม่ถูกกระทบ ──────────────────────────────────────────
  {
    ok('ปุ่มเปิดกล้องยังอยู่',
      document.querySelectorAll('[onclick^="openScanner("]').length === 1,
      document.querySelectorAll('[onclick^="openScanner("]').length + ' ปุ่ม');
    const saved = scanStream;
    scanStream = { getTracks: () => [] };
    document.getElementById('scanHint').textContent = '';
    rearmScanner('ยิงชิ้นถัดไปได้เลย');
    ok('กล้องเปิดอยู่ ข้อความยังขึ้นบนกรอบกล้องเหมือนเดิม',
      document.getElementById('scanHint').textContent === 'ยิงชิ้นถัดไปได้เลย',
      document.getElementById('scanHint').textContent);
    scanStream = saved;
  }

  L('=== สรุป: ' + pass + ' PASS / ' + fail + ' FAIL ===');
  L(fail ? 'RESULT:FAIL' : 'RESULT:PASS');
}
</script>`;

const res = runPage({ root, file: 'sales.html', mock: MOCK, tests: TESTS });
process.exit(res.ok ? 0 : 1);
