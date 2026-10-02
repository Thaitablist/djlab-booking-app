/**
 * ฐานข้อมูลปลอมของ Ops Board (ops_tasks / ops_board_meta) — ใช้ร่วมกันหลายชุดเทสต์ (วางต่อท้าย MOCK ของ desk-home3)
 *
 * จำลองพฤติกรรมจริงของ PostgREST + RLS ที่หน้าเว็บต้องรับมือ:
 *   · เฉพาะ owner เห็น/เขียนได้ (ops_can_access) — คนอื่น select ได้ 0 แถว · insert ถูกปฏิเสธ · update/delete "สำเร็จ" แต่ไม่โดนแถวไหน (ไม่มี error!)
 *   · ไม่ขอแถวกลับ (.select()) = ไม่ได้แถวกลับ · .single() ที่ไม่ได้ 1 แถว = error PGRST116
 *   · ทริกเกอร์ ops_tasks_touch: done_at ตาม status · updated_at ตอนแก้ · insert เติม created_by = ผู้เรียก
 * + ops_task_ai (คำตอบช่วยคิด — เบราว์เซอร์อ่านได้อย่างเดียว เขียน = ถูกปฏิเสธ) และ FN.ai จำลอง Edge Function ai: OPS.aiMode = ok|not_configured|quota|fail|warn · OPS.aiGate = Promise ที่ค้างคำตอบไว้ · OPS.aiCalls = เนื้อที่ส่งไป
 * ตัวควบคุมจากเทสต์: window.OPS.fail = { select|insert|update|delete: 'ข้อความ error' } · OPS.missing = true (ยังไม่ได้รัน 033) · OPS.denyDelete
 * งานตัวอย่างวันที่อิงวันนี้ตามเวลากรุงเทพ — ตัวเลขสรุป: ด่วนค้าง 2 · จับตาค้าง 2 · เลยกำหนด/ใกล้ครบ 2 · เสร็จใน 7 วัน 1
 */
export const OPS_MOCK = `<script>
const OPS = { fail: {}, missing: false, denyDelete: false, seq: 0, aiMode: 'ok', aiGate: null, aiCalls: [], aiSeq: 0 };
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
  FAKE.admins.push({ id: 'u4', full_name: 'Nui', role: 'admin', is_active: true });

  const clone = o => JSON.parse(JSON.stringify(o));
  const nowIso = () => new Date().toISOString();
  const touch = r => { r.done_at = r.status === 'done' ? (r.done_at || nowIso()) : null; return r; };

  function builder(client, table) {
    const st = { op: 'select', filters: [], payload: null, ret: false, single: false, maybe: false, order: null, limit: null };
    const me = () => FAKE.admins.find(a => client.session && a.id === client.session.user.id);
    const owner = () => !!me() && me().role === 'owner';
    const rows = () => table === 'ops_tasks' ? OPS.tasks : table === 'ops_task_ai' ? OPS.aiRows : [OPS.meta];
    const match = r => st.filters.every(([c, v]) => r[c] === v);
    const run = async () => {
      CALLS.push({ op: st.op, table, payload: st.payload, filters: st.filters.slice(), who: me() && me().id });
      if (table === 'ops_task_ai' && st.op !== 'select') return { data: null, error: { message: 'permission denied for table ops_task_ai' } };   // REVOKE ... FROM authenticated
      const failMsg = table === 'ops_task_ai' ? OPS.fail.aiHistory : OPS.fail[st.op];   // ตารางคำตอบมีตัวล้มของตัวเอง ไม่ปนกับ select ของงาน
      if (failMsg) return { data: null, error: { message: failMsg } };
      if (OPS.missing) return { data: null, error: { message: 'relation "public.' + table + '" does not exist' } };
      let data = [];
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
      select() { st.ret = true; return q; }, order(c, o) { st.order = { c, asc: !(o && o.ascending === false) }; return q; }, limit(n) { st.limit = n; return q; }, eq(c, v) { st.filters.push([c, v]); return q; },
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
    c.from = t => (t === 'ops_tasks' || t === 'ops_board_meta' || t === 'ops_task_ai') ? builder(c, t) : from(t);
    return c;
  };
})();
</script>`;
