/**
 * ฐานข้อมูลปลอมของ Ops Board (ops_tasks / ops_board_meta) — ใช้ร่วมกันหลายชุดเทสต์ (วางต่อท้าย MOCK ของ desk-home3)
 *
 * จำลองพฤติกรรมจริงของ PostgREST + RLS ที่หน้าเว็บต้องรับมือ:
 *   · เฉพาะ owner เห็น/เขียนได้ (ops_can_access) — คนอื่น select ได้ 0 แถว · insert ถูกปฏิเสธ · update/delete "สำเร็จ" แต่ไม่โดนแถวไหน (ไม่มี error!)
 *   · ไม่ขอแถวกลับ (.select()) = ไม่ได้แถวกลับ · .single() ที่ไม่ได้ 1 แถว = error PGRST116
 *   · ทริกเกอร์ ops_tasks_touch: done_at ตาม status · updated_at ตอนแก้ · insert เติม created_by = ผู้เรียก
 * + ops_task_ai (คำตอบช่วยคิด — เบราว์เซอร์อ่านได้อย่างเดียว เขียน = ถูกปฏิเสธ) และ FN.ai จำลอง Edge Function ai: OPS.aiMode = ok|not_configured|quota|fail|warn · OPS.aiGate = Promise ที่ค้างคำตอบไว้ · OPS.aiCalls = เนื้อที่ส่งไป
 * + ops_task_orders (คำสั่งถึง Claude · 034): จำลองสิทธิ์ระดับคอลัมน์ (สร้างได้แค่ task_id/instruction/ai_answer_id · แก้ได้แค่ status → cancelled ตอน queued/picked · ลบไม่ได้)
 *   + unique "คำสั่งค้างทีละหนึ่งต่องาน" · OPS.agent(id, status, result, pickedBy) = ฝั่ง Claude เดินสถานะตามทริกเกอร์ · OPS.noOrders = ยังไม่ได้รัน 034 · OPS.fail.orders_select|orders_insert|orders_update
 * ตัวควบคุมจากเทสต์: window.OPS.fail = { select|insert|update|delete: 'ข้อความ error' } · OPS.missing = true (ยังไม่ได้รัน 033) · OPS.denyDelete
 * งานตัวอย่างวันที่อิงวันนี้ตามเวลากรุงเทพ — ตัวเลขสรุป: ด่วนค้าง 2 · จับตาค้าง 2 · เลยกำหนด/ใกล้ครบ 2 · เสร็จใน 7 วัน 1
 */
export const OPS_MOCK = `<script>
const OPS = { fail: {}, missing: false, noOrders: false, denyDelete: false, seq: 0, aiMode: 'ok', aiGate: null, aiCalls: [], aiSeq: 0, ordSeq: 0, ordGate: null };
(function () {
  const day = n => { const d = new Date(TODAY + 'T12:00:00'); d.setDate(d.getDate() + n); return d.toLocaleDateString('en-CA'); };
  const ago = n => new Date(Date.now() - n * 86400000).toISOString();
  const mk = (id, title, severity, status, area, due, extra) => Object.assign({ id, title, detail: '', action: '', severity, status, area, due,
    owner: 'เจ้าของร้าน', source: '', created_by: null, created_at: ago(30 - OPS.seq++), updated_at: ago(1), done_at: status === 'done' ? ago(1) : null }, extra || {});
  OPS.tasks = [
    mk('t1', 'ตอบอีเมลมหาจักรเรื่องรายงานแอด', 'red', 'todo', 'email', day(-3), { detail: 'ค้างมาตั้งแต่ต้นเดือน', action: 'ส่งรายงาน ก.ย. ให้ครบ', source: 'Gmail' }),
    mk('t2', 'ต่อ Serato ให้ห้องซ้อม', 'red', 'doing', 'ads', day(2), { owner: 'ทีมร้าน' }),
    mk('t3', 'เช็กรีวิวใหม่บน Google Maps', 'amber', 'todo', 'shop', day(10)),
    mk('t4', 'รอยืนยันบัญชีโฆษณา', 'amber', 'waiting', 'maps', null, { owner: 'Claude' }),
    mk('t5', 'จัดระเบียบไดรฟ์งานคอนเทนต์', 'green', 'todo', 'system', null, { detail: 'ชื่อโฟลเดอร์ยาวมากๆ เพื่อดูว่าตัดบรรทัดแล้วอ่านได้ไหมบนจอเล็ก ' + 'ข้อความยาว '.repeat(12) }),
    mk('t6', 'งานที่เสร็จเมื่อวาน', 'amber', 'done', 'ads', day(-2)),
    mk('t7', 'งานที่เสร็จนานแล้ว', 'red', 'done', 'shop', null, { done_at: ago(20) }),
    mk('t8', '<img src=x onerror="window.__xss=1">ทดสอบสคริปต์ในชื่อ', 'green', 'todo', 'content', null, { detail: '<b>ตัวหนา</b>' }),
  ];
  OPS.meta = { last_scan: null, next_scan: '2026-10-12T10:00:00+07:00',
    sources: [{ name: 'Gmail', status: 'ok', note: 'เชื่อมแล้ว' }, { name: 'Google Business Profile', status: 'partial', note: 'หน้า Maps สาธารณะ' }, { name: 'TikTok', status: 'none', note: '' }],
    reports: [{ date: '2026-10-02', name: 'รายงานตั้งต้น', file: 'sample-report-20261002.html' }] };
  OPS.aiRows = [   // ของเก่าของ t1 (เรียงใหม่สุดอยู่บนต้องมาจากฝั่งหน้าเว็บ ไม่ใช่ลำดับในอาร์เรย์นี้)
    { id: 'ai-old1', task_id: 't1', kind: 'draft', output: 'หัวเรื่อง: รายงานแอด ก.ย.\\nเรียนคุณมหาจักร\\n<b>ฉบับเก่า</b>', created_at: ago(2) },
    { id: 'ai-old2', task_id: 't1', kind: 'steps', output: '1. เปิดรายงาน\\n2. ส่งให้ครบ', created_at: ago(1) },
  ];
  // คำสั่งถึง Claude (ops_task_orders · 034) — t2: Claude รับแล้ว · t3: ทำแล้ว (ผลยาวหลายบรรทัด) · t4: ทำไม่สำเร็จ · t1/t5/t8: ยังไม่เคยสั่ง
  const ord = (task, status, extra) => Object.assign({ id: 'o' + (++OPS.ordSeq), task_id: task, instruction: '', ai_answer_id: null, status, result: null, picked_by: null,
    created_by: 'u1', created_at: ago(1), picked_at: null, finished_at: null }, extra || {});
  OPS.orders = [
    ord('t2', 'picked', { instruction: 'หาราคา Serato DJ Pro รุ่นล่าสุดจากเว็บทางการ แล้วสรุปเทียบกับที่ร้านใช้อยู่ ' + 'รายละเอียดที่ต้องดู '.repeat(6), picked_by: 'session-พนักงาน-1', picked_at: ago(0.5) }),
    ord('t3', 'done', { instruction: 'ไล่รีวิวใหม่ 7 วันล่าสุดแล้วสรุปเรื่องที่ต้องตอบ', picked_by: 'session-พนักงาน-1', picked_at: ago(2), finished_at: ago(1.5),
      result: 'พบรีวิวใหม่ 5 รายการ\\n1. ถามเรื่องราคาคอร์ส\\n2. ถามเวลาเปิด\\n3. ชมทีมงาน\\n4. ถามเรื่องการผ่อน\\n5. ร้องเรียนการส่งซ่อมช้า\\nร่างคำตอบอยู่ในไฟล์สรุป รอเจ้าของยืนยันก่อนตอบจริง ' + 'ข้อความต่อท้ายยาว '.repeat(10) }),
    ord('t4', 'failed', { instruction: 'ตามเรื่องบัญชีโฆษณากับ Meta', picked_by: 'session-พนักงาน-1', picked_at: ago(3), finished_at: ago(2.5), result: 'ปฏิเสธ: ต้องเข้าบัญชีโฆษณา ซึ่งเป็นงานที่ออกนอกร้าน ต้องให้เจ้าของยืนยันในแชทก่อน' }),
  ];
  FAKE.admins.push({ id: 'u4', full_name: 'Nui', role: 'admin', is_active: true });

  // จำลองฝั่ง Claude (ops_agent_write) เดินสถานะคำสั่งตามทริกเกอร์: queued→picked|failed · picked→done|failed — ไม่ตามกติกา = ข้าม (คืน false)
  OPS.agent = (id, status, result, pickedBy) => {
    const o = OPS.orders.find(x => x.id === id);
    if (!o || !((o.status === 'queued' && ['picked', 'failed'].includes(status)) || (o.status === 'picked' && ['done', 'failed'].includes(status)))) return false;
    if (status === 'picked') { o.picked_by = pickedBy || null; o.picked_at = new Date().toISOString(); } else o.finished_at = new Date().toISOString();
    o.status = status; if (result) o.result = result;
    return true;
  };

  const clone = o => JSON.parse(JSON.stringify(o));
  const nowIso = () => new Date().toISOString();
  const touch = r => { r.done_at = r.status === 'done' ? (r.done_at || nowIso()) : null; return r; };

  function builder(client, table) {
    const st = { op: 'select', filters: [], ins: [], payload: null, ret: false, single: false, maybe: false, order: null, limit: null };
    const me = () => FAKE.admins.find(a => client.session && a.id === client.session.user.id);
    const owner = () => !!me() && me().role === 'owner';
    const rows = () => table === 'ops_tasks' ? OPS.tasks : table === 'ops_task_ai' ? OPS.aiRows : table === 'ops_task_orders' ? OPS.orders : [OPS.meta];
    const match = r => st.filters.every(([c, v]) => r[c] === v) && st.ins.every(([c, vs]) => vs.includes(r[c]));
    const run = async () => {
      CALLS.push({ op: st.op, table, payload: st.payload, filters: st.filters.slice(), ins: st.ins.slice(), who: me() && me().id });
      if (table === 'ops_task_ai' && st.op !== 'select') return { data: null, error: { message: 'permission denied for table ops_task_ai' } };   // REVOKE ... FROM authenticated
      if (table === 'ops_task_orders' && OPS.ordGate) await OPS.ordGate;   // ค้างคำขอไว้ (เทสต์ปิดหน้าต่าง/ออกจากระบบกลางทาง)
      if (table === 'ops_task_orders' && OPS.noOrders) return { data: null, error: { message: 'relation "public.ops_task_orders" does not exist' } };   // ยังไม่ได้รัน 034
      const failMsg = table === 'ops_task_ai' ? OPS.fail.aiHistory : table === 'ops_task_orders' ? OPS.fail['orders_' + st.op] : OPS.fail[st.op];   // ตารางคำตอบ/คำสั่งมีตัวล้มของตัวเอง ไม่ปนกับของงาน
      if (failMsg) return { data: null, error: { message: failMsg } };
      if (OPS.missing) return { data: null, error: { message: 'relation "public.' + table + '" does not exist' } };
      let data = [];
      if (table === 'ops_task_orders' && st.op !== 'select') {   // จำลองสิทธิ์ระดับคอลัมน์ + RLS + ทริกเกอร์ + unique ของ 034
        if (st.op === 'delete') return { data: null, error: { message: 'permission denied for table ops_task_orders' } };
        const cols = Object.keys(st.payload || {});
        if (st.op === 'insert') {
          if (cols.some(c => !['task_id', 'instruction', 'ai_answer_id'].includes(c))) return { data: null, error: { message: 'permission denied for table ops_task_orders' } };
          if (!owner()) return { data: null, error: { message: 'new row violates row-level security policy for table "ops_task_orders"' } };
          if (OPS.orders.some(o => o.task_id === st.payload.task_id && ['queued', 'picked'].includes(o.status))) return { data: null, error: { message: 'duplicate key value violates unique constraint "uq_ops_orders_open_per_task"' } };
          const r = { id: 'o' + (++OPS.ordSeq), task_id: st.payload.task_id, instruction: st.payload.instruction, ai_answer_id: st.payload.ai_answer_id || null, status: 'queued', result: null,
            picked_by: null, created_by: me().id, created_at: nowIso(), picked_at: null, finished_at: null };
          OPS.orders.push(r); data = [clone(r)];
        } else {
          if (cols.some(c => c !== 'status')) return { data: null, error: { message: 'permission denied for table ops_task_orders' } };
          if (st.payload.status !== 'cancelled') return { data: null, error: { message: 'new row violates row-level security policy for table "ops_task_orders"' } };
          const hit = owner() ? OPS.orders.filter(r => match(r) && ['queued', 'picked'].includes(r.status)) : [];
          hit.forEach(r => { r.status = 'cancelled'; r.finished_at = nowIso(); });
          data = hit.map(clone);
        }
        if (!st.ret) return { data: null, error: null };
        if (st.single) return data.length === 1 ? { data: data[0], error: null } : { data: null, error: { code: 'PGRST116', message: 'JSON object requested, multiple (or no) rows returned' } };
        return { data, error: null };
      }
      if (st.op === 'select') {
        data = owner() ? rows().filter(match).map(clone) : [];
        if (st.order) data.sort((a, b) => String(a[st.order.c]).localeCompare(String(b[st.order.c])) * (st.order.asc ? 1 : -1));
        if (st.limit != null) data = data.slice(0, st.limit);
      }
      else if (st.op === 'insert') {
        if (!owner()) return { data: null, error: { message: 'new row violates row-level security policy for table "' + table + '"' } };
        const r = touch(Object.assign({ created_by: me().id, created_at: nowIso(), updated_at: nowIso(), done_at: null }, clone(st.payload)));
        OPS.tasks.push(r); data = [clone(r)];
      } else if (st.op === 'update') {
        const hit = owner() ? rows().filter(match) : [];
        hit.forEach(r => { Object.assign(r, clone(st.payload)); r.updated_at = nowIso(); touch(r); });
        data = hit.map(clone);
      } else if (st.op === 'delete') {
        const hit = owner() && !OPS.denyDelete ? rows().filter(match) : [];
        OPS.tasks = OPS.tasks.filter(r => !hit.includes(r)); data = hit.map(r => ({ id: r.id }));
      }
      if (st.op !== 'select' && !st.ret) return { data: null, error: null };
      if (st.single) return data.length === 1 ? { data: data[0], error: null } : { data: null, error: { code: 'PGRST116', message: 'JSON object requested, multiple (or no) rows returned' } };
      if (st.maybe) return { data: data[0] || null, error: null };
      return { data, error: null };
    };
    const q = {
      select() { st.ret = true; return q; }, order(c, o) { st.order = { c, asc: !(o && o.ascending === false) }; return q; }, limit(n) { st.limit = n; return q; }, eq(c, v) { st.filters.push([c, v]); return q; }, in(c, vs) { st.ins.push([c, vs]); return q; },
      insert(p) { st.op = 'insert'; st.payload = p; return q; }, update(p) { st.op = 'update'; st.payload = p; return q; }, delete() { st.op = 'delete'; return q; },
      single() { st.single = true; return run(); }, maybeSingle() { st.maybe = true; return run(); },
      then(res, rej) { return run().then(res, rej); },
    };
    return q;
  }

  window.FN.ai = async body => {     // จำลองตรรกะของ Edge Function ai (ตัวจริงมีเทสต์แยกใน Stock App/scripts/test-ai-function.mjs)
    OPS.aiCalls.push(body);
    if (OPS.aiGate) await OPS.aiGate;
    if (OPS.aiMode === 'not_configured') return { error: { code: 'not_configured', message: 'ยังไม่ได้ตั้งค่าตัวช่วยคิด' } };
    if (OPS.aiMode === 'quota') return { error: { code: 'quota', message: 'วันนี้ใช้ปุ่มช่วยคิดครบ 20 ครั้งแล้ว ลองใหม่พรุ่งนี้', limit: 20, used: 20 } };
    if (OPS.aiMode === 'fail') return { error: { code: 'ai_busy', message: 'Claude ไม่ว่างชั่วคราว ลองอีกครั้งในอีกสักครู่' } };
    const t = OPS.tasks.find(x => x.id === body.task_id);
    if (!t) return { error: { code: 'not_found', message: 'ไม่พบงานนี้ (อาจถูกลบไปแล้ว)' } };
    if (t.area === 'system') return { error: { code: 'not_allowed_area', message: 'งานหมวดระบบ/บอทไม่ส่งให้ตัวช่วยคิด' } };
    const row = { id: 'ai-' + (++OPS.aiSeq), task_id: t.id, kind: body.kind, created_at: new Date().toISOString(),
      output: (body.kind === 'draft' ? 'หัวเรื่อง: ตัวอย่างร่าง\\nเรียนผู้เกี่ยวข้อง' : '1. ขั้นแรก\\n2. ขั้นสอง') + '\\n<img src=x onerror="window.__xss=2"> ' + t.title };
    if (OPS.aiMode !== 'warn') OPS.aiRows.push(row);   // warn = ฟังก์ชันได้คำตอบแต่บันทึกลงฐานข้อมูลไม่ได้
    return { answer: row, saved: OPS.aiMode !== 'warn', usage: { used: OPS.aiRows.length, limit: 20 },
      ...(OPS.aiMode === 'warn' ? { warning: 'แสดงคำตอบได้ แต่บันทึกลงฐานข้อมูลไม่สำเร็จ (500) — คัดลอกเก็บไว้ก่อน' } : {}) };
  };

  const create = window.supabase.createClient;
  window.supabase.createClient = (u, k, o) => {
    const c = create(u, k, o), from = c.from;
    c.from = t => (t === 'ops_tasks' || t === 'ops_board_meta' || t === 'ops_task_ai' || t === 'ops_task_orders') ? builder(c, t) : from(t);
    return c;
  };
})();
</script>`;
