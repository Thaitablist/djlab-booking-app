/**
 * เทสต์ตัวรับเครื่องยิงบาร์โค้ดในหน้า stock.html
 *   รัน: node tests/wedge-scanner.mjs
 *
 * ใช้วิธีตามกฎข้อ 2 ใน CLAUDE.md: ก๊อปไฟล์จริงมาแล้วสลับเฉพาะแท็ก <script src>
 * ของ Supabase เป็นตัวปลอม โค้ดของหน้าเว็บไม่ต้องแก้อะไรเลยสักบรรทัด แล้วรัน
 * ด้วย Chrome headless จริง ๆ — เพราะตรรกะนี้อยู่กับ event ของเบราว์เซอร์
 * (event.code, ลำดับ capture, defaultPrevented) ซึ่งจำลองด้วย node ไม่ได้
 */

import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { runPage, HARNESS } from './lib/page-test.mjs';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');

const MOCK = `<script>
// ---- Supabase ตัวปลอม พอให้หน้าเว็บเริ่มทำงานได้โดยไม่ต่อเน็ต ----
const FAKE = {
  admins: [{ id: 'u1', full_name: 'เจ้าของร้าน', role: 'owner', is_active: true }],
  products: [
    { id: 'p1', sku: 'PIO-DDJ-FLX4', name: 'DDJ-FLX4', brand: 'Pioneer DJ',
      barcode_ean13: '619659216054', cost_price: 0, sell_price: 12900, reorder_point: 1, is_active: true },
    { id: 'p2', sku: 'NEO-RCA', name: 'สาย RCA', brand: 'NEO by OYAIDE',
      barcode_ean13: null, cost_price: 0, sell_price: 590, reorder_point: 5, is_active: true },
  ],
  product_stock_levels: [{ product_id: 'p1', current_qty: 3 }],
  stock_movements: [],
  product_units: [],
};
function builder(table) {
  const q = {
    _rows: (FAKE[table] || []).slice(),
    select() { return q; },
    eq(col, val) { q._rows = q._rows.filter(r => r[col] === val); return q; },
    order() { return q; },
    limit() { return q; },
    async maybeSingle() { return { data: q._rows[0] || null, error: null }; },
    async single() { return { data: q._rows[0] || null, error: null }; },
    then(res, rej) { return Promise.resolve({ data: q._rows, error: null }).then(res, rej); },
    insert() { return q; }, update() { return q; }, upsert() { return q; }, delete() { return q; },
  };
  return q;
}
window.supabase = {
  createClient: () => ({
    from: builder,
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
window.addEventListener('load', () => setTimeout(runTests, 300));
${HARNESS}

async function runTests() {
  L('=== เครื่องยิงบาร์โค้ดในหน้าสต็อก ===');

  // ── 1. ยิงบาร์โค้ดตัวเลข ขณะแป้นเป็นภาษาไทย ────────────────────────────
  {
    const s = spy();
    const enter = burst(digits('619659216054'));
    await 0;
    ok('อ่านบาร์โค้ดได้ถูกทั้งที่แป้นเป็นภาษาไทย',
      s.calls.length === 1 && s.calls[0].code === '619659216054',
      JSON.stringify(s.calls));
    ok('บอกว่ามาจากเครื่องยิง', s.calls[0] && s.calls[0].viaGun === true);
    ok('Enter ถูกกันไม่ให้ไปสั่งงานอย่างอื่นต่อ', enter.defaultPrevented);
    s.restore();
  }

  // ── 2. ซีเรียลตัวพิมพ์ใหญ่ — เครื่องยิงกด Shift คั่นทุกตัวอักษร ─────────
  {
    const s = spy();
    clock += 5000;
    // ซีเรียลจริงที่ยิงจากเครื่องของร้าน 31 ส.ค. 69 — CHMP123354NN
    const seq = [['KeyC',1],['KeyH',1],['KeyM',1],['KeyP',1],['Digit1',0],['Digit2',0],
                 ['Digit3',0],['Digit3',0],['Digit5',0],['Digit4',0],['KeyN',1],['KeyN',1]];
    seq.forEach(([code, sh], i) => {
      if (i) clock += 6;
      if (sh) { press('ShiftLeft', { key: 'Shift' }); clock += 2; }
      press(code, { shiftKey: !!sh, key: sh ? 'ก' : thaiKeyFor(code) });
    });
    clock += 6;
    press('Enter', { key: 'Enter' });
    await 0;
    ok('ซีเรียลที่มีตัวพิมพ์ใหญ่ไม่ขาดเป็นท่อน',
      s.calls.length === 1 && s.calls[0].code === 'CHMP123354NN',
      JSON.stringify(s.calls));
    s.restore();
  }

  // ── 3. คนพิมพ์ปกติ ต้องไม่โดนจับเป็นการยิง ─────────────────────────────
  {
    const s = spy();
    const enter = burst(digits('12345678'), { gap: 120 });
    await 0;
    ok('คนพิมพ์ช้า ๆ แล้วกด Enter ไม่ถือเป็นการยิง', s.calls.length === 0, JSON.stringify(s.calls));
    ok('Enter ของคนยังทำงานตามปกติ', !enter.defaultPrevented);
    s.restore();
  }

  // ── 4. ชุดสั้นเกินกว่าจะเป็นบาร์โค้ด ───────────────────────────────────
  {
    const s = spy();
    const enter = burst(digits('1234'));
    await 0;
    ok('ยิงมาสั้นเกิน 6 ตัว ไม่ถือเป็นบาร์โค้ด', s.calls.length === 0);
    ok('Enter ยังส่งต่อให้หน้าเว็บตามปกติ', !enter.defaultPrevented);
    s.restore();
  }

  // ── 5. โฟกัสอยู่ในช่องกรอก ตัวอักษรที่หลุดเข้าไปต้องถูกคืน ─────────────
  {
    const s = spy();
    showPage('Products');                 // ช่องที่ซ่อนอยู่ focus ไม่ได้
    const box = document.getElementById('productSearch');
    box.value = 'DDJ';
    box.focus();
    ok('ทดสอบได้จริง: โฟกัสอยู่ในช่องค้นหา', document.activeElement === box,
      document.activeElement && document.activeElement.id);
    clock += 5000;
    const codes = digits('619659216054');
    codes.forEach((c, i) => {
      if (i) clock += 6;
      press(c, { target: box });
      box.value += thaiKeyFor(c);      // จำลองตัวอักษรไทยที่หล่นลงช่องจริง
    });
    clock += 6;
    press('Enter', { target: box, key: 'Enter' });
    await 0;
    ok('ค่าที่หลุดเข้าช่องกรอกถูกคืนกลับเป็นของเดิม', box.value === 'DDJ', box.value);
    ok('ยังส่งค่าไปให้ระบบตามปกติ', s.calls.length === 1 && s.calls[0].code === '619659216054');
    box.blur();
    s.restore();
  }

  // ── 6. ในช่องเลือกรายการ ต้องกันตัวอักษรไม่ให้ไปเลื่อนรายการ ───────────
  {
    showPage('Movement');
    const sel = document.getElementById('movProduct');
    sel.focus();
    ok('ทดสอบได้จริง: โฟกัสอยู่ในช่องเลือกสินค้า', document.activeElement === sel,
      document.activeElement && document.activeElement.id);
    clock += 5000;
    const ev = press('Digit6', { target: sel });
    ok('ตัวอักษรในช่องเลือกรายการถูกกันตั้งแต่ตัวแรก', ev.defaultPrevented);
    sel.blur();
  }

  // ── 7-9. ยิงแล้วเอาไปทำอะไร ดูจากสิ่งที่อยู่ตรงหน้า ────────────────────
  {
    showPage('Products');
    ok('อยู่หน้าสินค้า → เอาไปค้นหา', wedgeRoute() === 'search', wedgeRoute());

    showPage('Movement');
    document.getElementById('movType').value = 'in';
    document.getElementById('movProduct').value = '';
    ok('หน้าเคลื่อนไหว ยังไม่เลือกสินค้า → เอาไปเลือกสินค้า',
      wedgeRoute() === 'movement', wedgeRoute());

    document.getElementById('movProduct').value = 'p1';
    ok('หน้าเคลื่อนไหว รับเข้า เลือกสินค้าแล้ว → เอาไปเป็นซีเรียล',
      wedgeRoute() === 'serial', wedgeRoute());

    document.getElementById('movType').value = 'out';
    ok('เปลี่ยนเป็นตัดออก → ไม่ใช่ซีเรียลแล้ว', wedgeRoute() === 'movement', wedgeRoute());

    document.getElementById('movType').value = 'in';
    document.getElementById('productModal').classList.add('open');
    ok('ฟอร์มสินค้าเปิดอยู่ → เอาไปกรอกช่องบาร์โค้ด', wedgeRoute() === 'field', wedgeRoute());
    document.getElementById('productModal').classList.remove('open');
  }

  // ── 10. ยิงซีเรียลจริงเข้ารายการรอบันทึก ───────────────────────────────
  {
    showPage('Movement');
    document.getElementById('movType').value = 'in';
    onMovTypeChange();
    document.getElementById('movProduct').value = 'p1';
    onMovProductChange();
    clock += 5000;
    const seq = [['KeyA',1],['KeyB',1],['Digit1',0],['Digit2',0],['Digit3',0],['Digit4',0],
                 ['Digit5',0],['Digit6',0]];
    seq.forEach(([code, sh], i) => {
      if (i) clock += 6;
      if (sh) { press('ShiftLeft', { key: 'Shift' }); clock += 2; }
      press(code, { shiftKey: !!sh, key: 'ก' });
    });
    clock += 6;
    press('Enter', { key: 'Enter' });
    await new Promise(r => setTimeout(r, 150));
    ok('ยิงซีเรียลแล้วเข้ารายการรอบันทึกจริง',
      pendingSerials.length === 1 && pendingSerials[0] === 'AB123456',
      JSON.stringify(pendingSerials));
    ok('ไม่มีการเปิดกล้องหรือเปิดแผงมาขวาง',
      !document.getElementById('scanModal').classList.contains('open'));
  }

  // ── เครื่องปลายทางเปิด Caps Lock ค้างไว้ ต้องยังได้ค่าเดิม ─────────────
  {
    const s2 = spy();
    clock += 5000;
    const seq = [['KeyC',1],['KeyH',1],['KeyM',1],['KeyP',1],['Digit1',0],['Digit2',0],
                 ['Digit3',0],['Digit3',0],['Digit5',0],['Digit4',0],['KeyN',1],['KeyN',1]];
    seq.forEach(([code, sh], i) => {
      if (i) clock += 6;
      // จำลองเครื่องที่เปิด Caps Lock ค้าง: ระบบปฏิบัติการจะให้ตัวพิมพ์เล็กกลับมา
      const ev = new KeyboardEvent('keydown', {
        code, key: sh ? 'c' : thaiKeyFor(code), shiftKey: !!sh,
        modifierCapsLock: true, bubbles: true, cancelable: true,
      });
      Object.defineProperty(ev, 'getModifierState', { value: k => k === 'CapsLock' });
      document.dispatchEvent(ev);
    });
    clock += 6;
    press('Enter', { key: 'Enter' });
    await 0;
    ok('เปิด Caps Lock ค้างไว้ก็ยังได้ซีเรียลตัวเดิม',
      s2.calls.length === 1 && s2.calls[0].code === 'CHMP123354NN',
      JSON.stringify(s2.calls));
    s2.restore();
  }

  // ── 11-13. เส้นทางกล้องต้องไม่ถูกกระทบเลย ─────────────────────────────
  {
    ok('ปุ่มเปิดกล้องยังอยู่ครบทุกจุด',
      document.querySelectorAll('[onclick^="openScanner("]').length === 4,
      document.querySelectorAll('[onclick^="openScanner("]').length + ' ปุ่ม');

    // แผงแบบไม่มีกล้องซ่อนกรอบวิดีโอไว้ ถ้าปิดแล้วไม่คืนค่า กล้องจะเปิดมาไม่มีภาพ
    scanPurpose = 'search';
    openScanPanel('ทดสอบ');
    const hidden = document.getElementById('scanVideoWrap').style.display === 'none';
    closeScanner();
    ok('เปิดแผงแบบไม่มีกล้องแล้วซ่อนกรอบวิดีโอจริง', hidden);
    ok('ปิดแล้วกรอบวิดีโอกลับมาให้กล้องใช้ได้ตามเดิม',
      document.getElementById('scanVideoWrap').style.display === '',
      document.getElementById('scanVideoWrap').style.display);
    ok('ปิดแผงแล้วโมดัลปิดจริง',
      !document.getElementById('scanModal').classList.contains('open'));

    // ตอนกล้องทำงานอยู่ ข้อความต้องขึ้นบนกรอบกล้องเหมือนเดิม ไม่ใช่เด้ง toast
    const savedStream = scanStream;
    scanStream = { getTracks: () => [] };
    document.getElementById('scanHint').textContent = '';
    rearmScanner('ยิงเครื่องถัดไปได้เลย');
    ok('กล้องเปิดอยู่ ข้อความยังขึ้นบนกรอบกล้องเหมือนเดิม',
      document.getElementById('scanHint').textContent === 'ยิงเครื่องถัดไปได้เลย',
      document.getElementById('scanHint').textContent);
    scanStream = savedStream;

    // แป้นพิมพ์บนมือถือส่ง code ว่างมา ต้องไม่ถูกนับเป็นการยิง
    const sp = spy();
    clock += 5000;
    for (let i = 0; i < 8; i++) { press('', { key: 'Unidentified' }); clock += 6; }
    press('Enter', { key: 'Enter' });
    await 0;
    ok('แป้นพิมพ์บนมือถือไม่ถูกนับเป็นเครื่องยิง', sp.calls.length === 0, JSON.stringify(sp.calls));
    sp.restore();
  }

  L('=== สรุป: ' + pass + ' PASS / ' + fail + ' FAIL ===');
  L(fail ? 'RESULT:FAIL' : 'RESULT:PASS');
}
</script>`;

const res = runPage({ root, file: 'stock.html', mock: MOCK, tests: TESTS });
process.exit(res.ok ? 0 : 1);
