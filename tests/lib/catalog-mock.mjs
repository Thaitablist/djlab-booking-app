/**
 * ฐานข้อมูลปลอมของหมวด "ราคาและโปรโมชัน" (products · promotions · promotion_deals · activity_log · rpc undo_activity / export_promotions_json)
 * วางต่อท้าย MOCK ของ desk-home3 — ใช้ร่วมกันหลายชุดเทสต์
 *
 * จำลองพฤติกรรมจริงของ migration 035 + RLS ที่หน้าเว็บต้องรับมือ:
 *   · อ่านได้ทุกคนที่เป็นทีมงาน · เขียนได้เฉพาะ owner/admin — staff: insert ถูกปฏิเสธ · update/delete "สำเร็จ" แต่ไม่โดนแถวไหน (ไม่มี error!)
 *   · products: รหัสรุ่นไม่ซ้ำแบบไม่สนตัวพิมพ์ (23505) · bot_category ต้องอยู่ใน 9 ค่า (23514) · ทริกเกอร์ log_activity บันทึกการแก้
 *   · promotions: รหัสไม่ซ้ำ (23505) · รูปแบบรหัส · ends_on >= starts_on (23514)
 *   · promotion_deals: CHECK ตามชนิดดีล + ตัวกัน (รุ่นซ้ำ · รุ่นเลิกขาย · ราคาเซ็ตไม่ต่ำกว่าราคาปกติรวม — ข้อความภาษาไทยเหมือน 035)
 *   · activity_log: อ่านได้เฉพาะ owner/admin · rpc undo_activity พอร์ตกติกาจาก 035 (ย้อนเฉพาะ UPDATE · ช่องที่อนุญาต · ถูกแก้ต่อแล้ว = ปฏิเสธ)
 *   · rpc export_promotions_json: เฉพาะ owner/admin · คืนรูป promotions.json (ใช้ dealCalc ของหน้าเอง — ตรรกะราคาจริงทดสอบแยกใน sql-tests)
 * ตัวควบคุมจากเทสต์: window.CAT.fail = { update|insert|delete|select|export|undo: 'ข้อความ error' } · CAT.noTables · CAT.denyWrite (RLS ปฏิเสธเงียบ ๆ แม้เป็น owner)
 *   CAT.noModelCol (ยังไม่รัน 035 — products ไม่มีคอลัมน์ใหม่) · CAT.reset() คืนข้อมูลตั้งต้น
 * + PDF ของโปร (036): FN['promo-read'] ปลอม (CAT.pdf.mode/gate/calls/draft) · Storage ปลอมถัง promo-docs (ส่วนตัว · เฉพาะ owner/admin · ≤ 6 MB · PDF เท่านั้น · ลิงก์อายุสั้น) · CAT.noFileCols (ยังไม่รัน 036)
 */
export const CAT_MOCK = `<script>
const CAT = { fail: {}, noTables: false, denyWrite: false, noModelCol: false, gate: null, seq: 0, logSeq: 0, log: [], promos: [], deals: [], exportCalls: [], files: new Map(), pdf: { mode: 'ok', calls: [], gate: null, used: 0, draft: null }, noBucket: false, storeFail: null, signFail: false, noFileCols: false };
(function () {
  const day = n => { const d = new Date(TODAY + 'T12:00:00'); d.setDate(d.getDate() + n); return d.toLocaleDateString('en-CA'); };
  const clone = o => JSON.parse(JSON.stringify(o));
  const BOT = ['player', 'all-in-one', 'controller', 'mixer', 'turntable', 'headphones', 'speaker', 'cable', 'accessory'];
  const P = (id, name, brand, shop, sku, price, code, botCat, extra) => Object.assign({ id, sku, name, brand, category: shop, barcode_ean13: null, cost_price: 0, sell_price: price,
    reorder_point: 0, is_active: true, stocked: true, model_code: code, bot_category: botCat, updated_at: '2026-10-01T00:00:00Z' }, extra || {});
  const BASE_PRODUCTS = [
    P('a1', 'CDJ-3000X', 'AlphaTheta', 'CDJ', 'PIO-CDJ3000X', 109000, 'CDJ-3000X', 'player'),
    P('a2', 'XDJ-AZ', 'AlphaTheta', 'All in one', 'PIO-XDJ-AZ', 139000, 'XDJ-AZ', 'all-in-one'),
    P('a3', 'DDJ-FLX2', 'Pioneer DJ', 'เครื่องเล่น', 'PIO-DDJ-FLX2', 7490, 'DDJ-FLX2', 'controller'),
    P('p1', 'DDJ-FLX4', 'Pioneer DJ', 'คอนโทลเลอร์', 'PIO-DDJ-FLX4', 12900, 'DDJ-FLX4', 'controller', { barcode_ean13: '619659216054' }),
    P('a4', 'HDJ-CUE1', 'Pioneer DJ', 'หูฟัง', 'PIO-HDJ-CUE1', 2990, 'HDJ-CUE1', 'headphones'),
    P('a5', 'DM-40D', 'Pioneer DJ', 'ลำโพง', 'PIO-DM40D', 6590, 'DM-40D', 'speaker'),
    P('a6', 'CDJ-3000', 'AlphaTheta', 'CDJ', 'PIO-CDJ-3000', 0, 'CDJ-3000', 'player', { is_active: false, stocked: false }),
    P('a7', 'UDG DECK COVER <b>X</b>', 'Other', 'DECK COVER', 'UDG-DECK-X', 1290, null, null),
    P('a8', 'กระเป๋าหูฟัง (ยังไม่ตั้งราคา)', 'Other', null, 'OTH-HEADPHONE-BAG', 0, 'กระเป๋าหูฟัง', 'accessory', { stocked: false }),
    P('a9', 'NEO RCA Class B 1m', 'NEO by OYAIDE', 'Cable', 'NEO-RCA-CLASSB', 2690, 'NEO RCA Class B 1m', 'cable'),
  ];
  const BASE_PROMOS = () => [
    { id: 'pr1', code: 'mahajak-2026-10', name: 'ลด 10% มหาจักร', starts_on: day(-5), ends_on: day(25), conditions: ['เฉพาะลูกค้ามหาจักร', 'จำกัด 1 เครื่องต่อท่าน'], source_note: 'memo ผู้นำเข้า 1 ต.ค.', is_enabled: true, created_by: 'u1' },
    { id: 'pr2', code: 'starter-pack', name: 'Starter Pack', starts_on: day(-10), ends_on: day(20), conditions: [], source_note: '', is_enabled: true, created_by: 'u1' },
    { id: 'pr3', code: 'old-promo', name: 'โปรเก่าหมดเวลา', starts_on: day(-60), ends_on: day(-30), conditions: [], source_note: '', is_enabled: true, created_by: 'u1' },
    { id: 'pr4', code: 'paused-promo', name: 'โปรที่ปิดไว้', starts_on: day(-5), ends_on: day(25), conditions: [], source_note: '', is_enabled: false, created_by: 'u1' },
    { id: 'pr5', code: 'next-month', name: 'โปรเดือนหน้า <i>ทดสอบ</i>', starts_on: day(10), ends_on: day(40), conditions: [], source_note: '', is_enabled: true, created_by: 'u1' },
  ];
  const D = (id, promo, kind, ids, extra) => Object.assign({ id, promotion_id: promo, kind, product_ids: ids, percent: null, set_price: null, gift_item: null, gift_value: null, label: null, sort_order: ++CAT.seq, created_at: '2026-10-01T00:00:00Z' }, extra || {});
  const BASE_DEALS = () => [
    D('d1', 'pr1', 'percent', ['a1'], { percent: 10 }),
    D('d2', 'pr1', 'gift', ['a2'], { gift_item: 'หูฟัง HDJ-CUE1', gift_value: 2990 }),
    D('d3', 'pr2', 'set_price', ['a3', 'a4'], { set_price: 8990, label: 'Starter Pack' }),
    D('d4', 'pr3', 'percent', ['a5'], { percent: 5 }),
    D('d5', 'pr4', 'percent', ['p1'], { percent: 8 }),
  ];
  CAT.reset = () => {
    CAT.fail = {}; CAT.noTables = false; CAT.denyWrite = false; CAT.noModelCol = false; CAT.gate = null; CAT.seq = 0; CAT.logSeq = 0; CAT.log = []; CAT.exportCalls = [];
    CAT.files = new Map(); CAT.pdf = { mode: 'ok', calls: [], gate: null, used: 0, draft: null }; CAT.noBucket = false; CAT.storeFail = null; CAT.signFail = false; CAT.noFileCols = false;
    FAKE.products = clone(BASE_PRODUCTS);
    CAT.promos = BASE_PROMOS(); CAT.deals = BASE_DEALS();
  };
  CAT.reset();
  FAKE.admins.push({ id: 'u5', full_name: 'Pao', role: 'admin', is_active: true });
  FAKE.product_stock_levels = FAKE.products.map(p => ({ product_id: p.id, current_qty: 3 }));

  const nowIso = () => new Date().toISOString();
  const writer = client => { const a = FAKE.admins.find(x => client.session && x.id === client.session.user.id); return !!a && a.is_active && (a.role === 'owner' || a.role === 'admin'); };
  const member = client => { const a = FAKE.admins.find(x => client.session && x.id === client.session.user.id); return !!a && a.is_active; };
  const pById = id => FAKE.products.find(p => p.id === id);
  const logIt = (table, action, oldRow, newRow, client) => {
    const a = FAKE.admins.find(x => client.session && x.id === client.session.user.id);
    CAT.log.push({ id: 'lg' + (++CAT.logSeq), admin_id: a ? a.id : null, action, table_name: table, record_id: String((newRow || oldRow).id),
      old_data: oldRow ? clone(oldRow) : null, new_data: newRow ? clone(newRow) : null, created_at: new Date(Date.now() + CAT.logSeq).toISOString() });
  };
  const ERR = (code, message) => ({ data: null, error: { code, message } });
  const TABLES = { products: () => FAKE.products, promotions: () => CAT.promos, promotion_deals: () => CAT.deals, activity_log: () => CAT.log };

  // ตัวกัน/ข้อจำกัดของแต่ละตาราง — คืนข้อความ error หรือ null
  function checkProduct(r, all) {
    if (r.model_code != null && (r.model_code !== r.model_code.trim() || r.model_code.length < 1 || r.model_code.length > 80)) return ERR('23514', 'new row for relation "products" violates check constraint "products_model_code_check"');
    if (r.bot_category != null && !BOT.includes(r.bot_category)) return ERR('23514', 'new row for relation "products" violates check constraint "products_bot_category_check"');
    if (r.model_code != null && all.some(o => o.id !== r.id && o.model_code != null && o.model_code.toLowerCase() === r.model_code.toLowerCase())) return ERR('23505', 'duplicate key value violates unique constraint "uq_products_model_code"');
    if (!(Number(r.sell_price) >= 0)) return ERR('23514', 'new row for relation "products" violates check constraint');
    return null;
  }
  function checkPromo(r, all) {
    if (!/^[a-z0-9][a-z0-9-]{1,59}$/.test(r.code)) return ERR('23514', 'new row for relation "promotions" violates check constraint "promotions_code_check"');
    if (!r.name || !r.name.trim() || r.name.length > 200) return ERR('23514', 'new row for relation "promotions" violates check constraint "promotions_name_check"');
    if (r.ends_on < r.starts_on) return ERR('23514', 'new row for relation "promotions" violates check constraint "promotions_check"');
    if ((r.conditions || []).length > 30) return ERR('23514', 'new row for relation "promotions" violates check constraint "promotions_conditions_check"');
    // 036: promotions_source_file_check — พาธต้องเป็น <uuid>.pdf และมีชื่อไฟล์คู่กัน (ไม่มีทั้งคู่ หรือมีทั้งคู่)
    const hasP = r.source_file_path != null, hasN = r.source_file_name != null;
    if (hasP !== hasN || (hasP && (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}[.]pdf$/.test(r.source_file_path) || !String(r.source_file_name).trim() || String(r.source_file_name).length > 200))) return ERR('23514', 'new row for relation "promotions" violates check constraint "promotions_source_file_check"');
    if (all.some(o => o.id !== r.id && o.code === r.code)) return ERR('23505', 'duplicate key value violates unique constraint "promotions_code_key"');
    return null;
  }
  function checkDeal(r, old) {
    const n = (r.product_ids || []).length, nul = (...k) => k.every(x => r[x] == null);
    const okKind = r.kind === 'percent' ? n === 1 && r.percent > 0 && r.percent < 100 && nul('set_price', 'gift_item', 'gift_value') :
      r.kind === 'set_price' ? n >= 2 && r.set_price > 0 && nul('percent', 'gift_item', 'gift_value') :
      r.kind === 'gift' ? n === 1 && r.gift_item && r.gift_item.trim() && r.gift_value > 0 && nul('percent', 'set_price') : false;
    if (!okKind) return ERR('23514', 'new row for relation "promotion_deals" violates check constraint "promotion_deals_check"');
    // ตัวกัน: ตรวจเฉพาะตอนเพิ่ม หรือตอนแก้รุ่น/ชนิด/ราคาเซ็ต (เหมือน promotion_deals_guard)
    if (old && JSON.stringify(old.product_ids) === JSON.stringify(r.product_ids) && old.kind === r.kind && old.set_price === r.set_price) return null;
    if (new Set(r.product_ids).size !== n) return ERR('23514', 'มีรุ่นซ้ำในดีลเดียวกัน');
    const ps = r.product_ids.map(pById);
    if (ps.some(p => !p)) return ERR('23514', 'มีรหัสสินค้าที่ไม่มีอยู่ในตาราง products');
    const bad = ps.filter(p => !p.is_active).map(p => p.model_code || p.name);
    if (bad.length) return ERR('23514', 'รุ่นที่เลิกขาย (ติ๊กออก) เข้าโปรไม่ได้: ' + bad.join(', '));
    const sum = ps.reduce((s, p) => s + Number(p.sell_price), 0);
    if (r.kind === 'set_price' && r.set_price >= sum) return ERR('23514', 'ราคาเซ็ต (' + r.set_price + ') ต้องต่ำกว่าราคาปกติรวม (' + sum + ') — เช็กว่ากรอกตัวเลขถูกหลัก');
    return null;
  }

  function builder(client, table) {
    const st = { op: 'select', filters: [], payload: null, ret: false, order: [], limit: null };
    const run = async () => {
      const w = writer(client), m = member(client);       // ตัวตน ณ ตอนส่งคำขอ
      CALLS.push({ op: st.op, table, payload: clone(st.payload), filters: st.filters.slice(), who: client.session && client.session.user.id });
      if (CAT.gate && table === 'promotions' && st.op === 'select') await CAT.gate;   // ค้างคำขอโหลดโปรไว้ (เทสต์ออกจากระบบกลางทาง) — ตัวตนถูกเลือกไว้แล้วข้างบน
      const failMsg = CAT.fail[st.op] && (CAT.fail.table ? CAT.fail.table === table : true) ? CAT.fail[st.op] : null;
      if (failMsg) return { data: null, error: { message: failMsg } };
      if (CAT.noTables && (table === 'promotions' || table === 'promotion_deals')) return { data: null, error: { message: 'relation "public.' + table + '" does not exist' } };
      if (CAT.noFileCols && table === 'promotions' && st.payload && ('source_file_path' in st.payload || 'source_file_name' in st.payload)) return ERR('PGRST204', "Could not find the 'source_file_path' column of 'promotions' in the schema cache");   // ยังไม่รัน 036
      const rows = TABLES[table]();
      const match = r => st.filters.every(([c, v]) => r[c] === v);
      const strip = r => { const o = clone(r); if (CAT.noModelCol && table === 'products') { delete o.model_code; delete o.bot_category; delete o.stocked; } return o; };
      if (st.op === 'select') {
        let data = (table === 'activity_log' ? w : m) ? rows.filter(match).map(strip) : [];
        st.order.forEach(([c, asc]) => data.sort((a, b) => String(a[c]).localeCompare(String(b[c]), 'th', { numeric: true }) * (asc ? 1 : -1)));
        if (st.limit != null) data = data.slice(0, st.limit);
        return { data, error: null };
      }
      const allowed = w && !CAT.denyWrite;
      if (st.op === 'insert') {
        if (!allowed) return { data: null, error: { message: 'new row violates row-level security policy for table "' + table + '"' } };
        const r = clone(st.payload);
        if (table === 'promotions') { Object.assign(r, { id: 'pr-new' + (++CAT.seq), created_at: nowIso(), updated_at: nowIso(), created_by: client.session.user.id }); r.conditions = r.conditions || []; r.source_note = r.source_note || ''; if (r.is_enabled == null) r.is_enabled = true;
          const e = checkPromo(r, rows); if (e) return e; }
        else if (table === 'promotion_deals') { Object.assign(r, { id: 'd-new' + (++CAT.seq), created_at: nowIso(), updated_at: nowIso() });
          for (const k of ['percent', 'set_price', 'gift_item', 'gift_value', 'label']) if (!(k in r)) r[k] = null;
          const e = checkDeal(r, null); if (e) return e; }
        else return ERR('42501', 'permission denied for table ' + table);
        rows.push(r); logIt(table, 'INSERT', null, r, client);
        return { data: st.ret ? [clone(r)] : null, error: null };
      }
      if (st.op === 'update') {
        const hit = allowed ? rows.filter(match) : [];
        for (const r of hit) {
          const before = clone(r), next = Object.assign(clone(r), clone(st.payload));
          const e = table === 'products' ? checkProduct(next, rows) : table === 'promotions' ? checkPromo(next, rows) : table === 'promotion_deals' ? checkDeal(next, before) : null;
          if (e) return e;
          Object.assign(r, next, { updated_at: nowIso() });
          logIt(table, 'UPDATE', before, r, client);
        }
        return { data: st.ret ? hit.map(clone) : null, error: null };
      }
      if (st.op === 'delete') {
        const hit = allowed ? rows.filter(match) : [];
        hit.forEach(r => { rows.splice(rows.indexOf(r), 1); logIt(table, 'DELETE', r, null, client); });
        return { data: st.ret ? hit.map(r => ({ id: r.id })) : null, error: null };
      }
      return { data: null, error: null };
    };
    const q = {
      select() { st.ret = true; return q; }, eq(c, v) { st.filters.push([c, v]); return q; },
      order(c, o) { st.order.push([c, !(o && o.ascending === false)]); return q; }, limit(n) { st.limit = n; return q; },
      insert(p) { st.op = 'insert'; st.payload = p; return q; }, update(p) { st.op = 'update'; st.payload = p; return q; }, delete() { st.op = 'delete'; return q; },
      then(res, rej) { return run().then(res, rej); },
    };
    return q;
  }

  // ต้องตรงกับ undo_activity ใน 035: ย้อนเฉพาะ UPDATE · เฉพาะช่องที่อนุญาตต่อตาราง · ช่องที่ถูกแก้ต่อหลังรายการนี้แล้ว = ปฏิเสธ
  const UNDO_COLS = { products: ['is_active', 'stocked', 'sell_price', 'model_code', 'bot_category'],
    promotions: ['name', 'starts_on', 'ends_on', 'conditions', 'source_note', 'is_enabled'], promotion_deals: ['label', 'percent', 'set_price', 'gift_item', 'gift_value', 'product_ids', 'sort_order'] };
  function undo(client, args) {
    if (CAT.fail.undo) return { data: null, error: { message: CAT.fail.undo } };
    if (!writer(client)) return { data: null, error: { code: '42501', message: 'เฉพาะเจ้าของร้าน/ผู้ดูแลย้อนการเปลี่ยนได้' } };
    const l = CAT.log.find(x => x.id === args.p_log_id);
    if (!l) return { data: null, error: { message: 'ไม่พบรายการบันทึกนี้' } };
    if (l.action !== 'UPDATE') return { data: null, error: { message: 'ย้อนได้เฉพาะการแก้ (UPDATE) — การเพิ่ม/ลบให้ทำใหม่เอง' } };
    const cols = UNDO_COLS[l.table_name];
    if (!cols) return { data: null, error: { message: 'ตาราง ' + l.table_name + ' ย้อนผ่านฟังก์ชันนี้ไม่ได้' } };
    const row = TABLES[l.table_name]().find(r => String(r.id) === l.record_id);
    if (!row) return { data: null, error: { message: 'แถวนี้ไม่มีอยู่แล้ว' } };
    const pick = {};
    for (const k of cols) if (JSON.stringify(l.old_data[k]) !== JSON.stringify(l.new_data[k])) {
      if (JSON.stringify(row[k]) !== JSON.stringify(l.new_data[k])) return { data: null, error: { message: 'ช่อง ' + k + ' ถูกแก้ต่อหลังรายการนี้แล้ว — ย้อนรายการที่ใหม่กว่าก่อน' } };
      pick[k] = l.old_data[k];
    }
    if (!Object.keys(pick).length) return { data: null, error: { message: 'รายการนี้ไม่ได้เปลี่ยนช่องที่ย้อนได้' } };
    Object.assign(row, clone(pick), { updated_at: nowIso() });
    return { data: { table: l.table_name, record_id: l.record_id, restored: pick }, error: null };
  }
  function exportJson(client, args) {
    CAT.exportCalls.push(args);
    if (CAT.fail.export) return { data: null, error: { message: CAT.fail.export } };
    if (!writer(client)) return { data: null, error: { code: '42501', message: 'เฉพาะเจ้าของร้าน/ผู้ดูแลส่งออกโปรได้' } };
    const t = TODAY, byId = new Map(FAKE.products.map(p => [p.id, p]));
    const out = CAT.promos.filter(p => p.is_enabled && (args.p_scope !== 'current' || (t >= p.starts_on && t <= p.ends_on))).sort((a, b) => a.starts_on.localeCompare(b.starts_on)).map(p => {
      const deals = CAT.deals.filter(d => d.promotion_id === p.id).map(d => ({ d, c: dealCalc(d, byId) })).filter(x => x.c.ok).map(({ d, c }) => d.kind === 'gift' ?
        { model: c.ps[0].model_code, regularPrice: c.reg, gift: { item: d.gift_item, value: Number(d.gift_value) } } :
        d.kind === 'percent' ? { model: c.ps[0].model_code, regularPrice: c.reg, promoPrice: c.promo, discount: c.disc } :
        { model: d.label || c.ps.map(x => x.model_code).join(' + '), components: c.ps.map(x => x.model_code), regularPrice: c.reg, promoPrice: c.promo, discount: c.disc });
      return { id: p.code, name: p.name, startDate: p.starts_on, endDate: p.ends_on, _source: p.source_note || undefined, products: deals, gifts: [], conditions: p.conditions };
    }).filter(p => p.products.length);
    return { data: out, error: null };
  }

  // ── PDF ของโปร (036): ฟังก์ชัน promo-read ปลอม + Storage ปลอม ────────────────────────────────
  //   CAT.pdf.mode = ok | quota | not_configured | busy | forbidden · CAT.pdf.gate = Promise ที่ค้างคำตอบไว้ · CAT.pdf.calls = เนื้อที่ส่งไป · CAT.pdf.draft = ร่างที่จะตอบ (ว่าง = ร่างตั้งต้น)
  //   Storage: ถัง promo-docs ส่วนตัว · อัปโหลด/ลบ/ขอลิงก์ได้เฉพาะ owner/admin · ≤ 6 MB · เฉพาะ application/pdf · CAT.noBucket · CAT.storeFail · CAT.signFail · CAT.files = พาธ → ข้อมูลไฟล์
  const defaultDraft = () => ({
    name: 'โปรจากเอกสาร', code_suggestion: 'doc-promo-2026-10', starts_on: day(0), ends_on: day(30), conditions: ['เงื่อนไขจากเอกสาร ข้อ 1', 'เงื่อนไขจากเอกสาร ข้อ 2'], source_note: 'memo ผู้นำเข้า ฉบับ 1 ต.ค.',
    deals: [
      { kind: 'percent', models: ['CDJ-3000X'], product_ids: ['a1'], unmatched: [], percent: 12.5, set_price: null, gift_item: null, gift_value: null, label: null, evidence: 'CDJ-3000X ลด 12.5%', problems: [] },
      { kind: 'set_price', models: ['DDJ-FLX2', 'HDJ-CUE1'], product_ids: ['a3', 'a4'], unmatched: [], percent: null, set_price: 8500, gift_item: null, gift_value: null, label: 'ชุด FLX2 + CUE1', evidence: 'ชุด FLX2+CUE1 8,500', problems: [] },
      { kind: 'gift', models: ['DM-40D'], product_ids: ['a5'], unmatched: [], percent: null, set_price: null, gift_item: 'สายแจ็ค <b>x</b>', gift_value: 350, label: null, evidence: 'DM-40D แถมสายแจ็ค', problems: [] },
      { kind: 'percent', models: ['XDJ-ZZ'], product_ids: [], unmatched: ['XDJ-ZZ'], percent: 5, set_price: null, gift_item: null, gift_value: null, label: null, evidence: 'XDJ-ZZ ลด 5%', problems: ['ไม่พบรุ่นในรายการสินค้า: XDJ-ZZ', 'โปรลด % ต้องมี 1 รุ่น'] },
      { kind: 'set_price', models: ['DDJ-FLX4', 'DM-40D'], product_ids: ['p1', 'a5'], unmatched: [], percent: null, set_price: 99999, gift_item: null, gift_value: null, label: null, evidence: 'ชุด FLX4+DM-40D 99,999', problems: [] },
      { kind: 'percent', models: ['CDJ-3000'], product_ids: ['a6'], unmatched: [], percent: 5, set_price: null, gift_item: null, gift_value: null, label: null, evidence: 'CDJ-3000 ลด 5%', problems: [] },
    ],
    warnings: ['เอกสารไม่ระบุสีของ HDJ-CUE1', 'ราคาชุดที่ 5 สูงกว่าราคาปกติ'],
  });
  window.FN['promo-read'] = async body => {
    CAT.pdf.calls.push({ b64len: String(body.pdf_base64 || '').length, head: atob(String(body.pdf_base64 || '').slice(0, 8)), file_name: body.file_name });
    if (CAT.pdf.gate) await CAT.pdf.gate;
    const m = CAT.pdf.mode;
    if (m === 'quota') return { error: { code: 'quota', message: 'วันนี้ใช้ปุ่มอ่าน PDF ครบ 10 ครั้งแล้ว ลองใหม่พรุ่งนี้ (กรอกมือได้ตามปกติ)', limit: 10, used: 10 } };
    if (m === 'not_configured') return { error: { code: 'not_configured', message: 'ยังไม่ได้ตั้งค่าตัวอ่าน PDF' } };
    if (m === 'busy') return { error: { code: 'ai_busy', message: 'Claude ไม่ว่างชั่วคราว ลองอีกครั้งในอีกสักครู่' } };
    if (m === 'forbidden') return { error: { code: 'forbidden', message: 'อ่าน PDF ของโปรได้เฉพาะเจ้าของร้านหรือผู้ดูแล' } };
    return { draft: CAT.pdf.draft || defaultDraft(), usage: { used: ++CAT.pdf.used, limit: 10 }, saved: true };
  };

  const create = window.supabase.createClient;
  window.supabase.createClient = (u, k, o) => {
    const c = create(u, k, o), from = c.from, rpc = c.rpc;
    c.from = t => TABLES[t] ? builder(c, t) : from(t);
    c.storage = { from: bucket => ({
      async upload(path, file, opts) {
        CALLS.push({ op: 'storage.upload', bucket, path, size: file.size, type: opts && opts.contentType, upsert: !!(opts && opts.upsert), who: c.session && c.session.user.id });
        if (CAT.storeFail) return { data: null, error: { message: CAT.storeFail } };
        if (bucket !== 'promo-docs' || CAT.noBucket) return { data: null, error: { message: 'Bucket not found' } };
        if (!writer(c)) return { data: null, error: { message: 'new row violates row-level security policy' } };
        if (file.size > 6 * 1024 * 1024) return { data: null, error: { message: 'The object exceeded the maximum allowed size' } };
        if (!opts || opts.contentType !== 'application/pdf') return { data: null, error: { message: 'mime type not supported' } };
        if (CAT.files.has(path) && !opts.upsert) return { data: null, error: { message: 'The resource already exists' } };
        CAT.files.set(path, { size: file.size, type: opts.contentType });
        return { data: { path }, error: null };
      },
      async remove(paths) {
        CALLS.push({ op: 'storage.remove', bucket, paths: paths.slice(), who: c.session && c.session.user.id });
        const gone = writer(c) ? paths.filter(p => CAT.files.delete(p)) : [];   // staff: ไม่โดนไฟล์ไหน (RLS) ไม่มี error
        return { data: gone.map(name => ({ name })), error: null };
      },
      async createSignedUrl(path, secs) {
        CALLS.push({ op: 'storage.sign', bucket, path, secs, who: c.session && c.session.user.id });
        if (!writer(c) || CAT.signFail || !CAT.files.has(path)) return { data: null, error: { message: 'Object not found' } };
        return { data: { signedUrl: 'https://signed.test/promo-docs/' + path + '?token=t&exp=' + secs }, error: null };
      },
    }) };
    c.rpc = async (fn, args) => {
      if (fn === 'undo_activity') { CALLS.push({ op: 'rpc', fn, args, who: c.session && c.session.user.id }); return undo(c, args); }
      if (fn === 'export_promotions_json') { CALLS.push({ op: 'rpc', fn, args, who: c.session && c.session.user.id }); return exportJson(c, args); }
      return rpc(fn, args);
    };
    return c;
  };
})();
</script>`;
