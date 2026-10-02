/**
 * เทสต์หมวด Ops Board ของ desk.html (#ops · เฉพาะเจ้าของร้าน · 033)
 *   รัน: node tests/desk-ops.mjs
 *   ถ่ายภาพ: OPS_SHOTS=<โฟลเดอร์> node tests/desk-ops.mjs
 *
 * ตัวรัน CDP เดียวกับ desk-ipad/desk-iphone · ฐานข้อมูลปลอมอยู่ที่ tests/lib/ops-mock.mjs (จำลอง RLS: เฉพาะ owner เห็น/เขียนได้ ·
 * delete ที่ถูกปฏิเสธ "สำเร็จแต่ไม่ลบอะไร" ไม่มี error · ทริกเกอร์ done_at)
 *
 * 1. เจ้าของร้าน: เมนู · สรุปตัวเลข · กลุ่มตามความเร่งด่วน · เรียงลำดับ · กรอง/ค้นหา · เปลี่ยนสถานะ · เพิ่ม/แก้/ลบ · ข้อความแสดงตามจริงเมื่อฐานข้อมูลล้ม
 * 2. admin / staff: ไม่เห็นเมนู · เปิดไม่ได้ · ไม่มีคำขอไปถึงตาราง
 * 1b. ช่วยคิด (ปุ่ม "ช่วยคิด" → Edge Function ai): ปุ่มเฉพาะงานที่ไม่ใช่หมวดระบบ · หน้าต่าง · คำตอบเก่า · ส่งแค่ {task_id, kind} · กดซ้ำ ·
 *     XSS · คัดลอก · quota / ยังไม่ตั้งค่า / ล้ม · ปิดหน้าต่างกลางคำขอ · โหลดประวัติไม่ได้ (ฟังก์ชันตัวจริงมีเทสต์แยกที่ Stock App/scripts/test-ai-function.mjs)
 * 3. สลับบัญชีจากเจ้าของเป็นพนักงาน: เนื้อหา Ops Board (รวมคำตอบช่วยคิดและคำขอที่ค้างอยู่) ต้องไม่ค้างอยู่ในหน้า
 */

import { dirname, join, } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { mkdirSync } from 'node:fs';
import { HARNESS } from './lib/page-test.mjs';
import { runCdpPage } from './lib/cdp-page.mjs';
import { OPS_MOCK } from './lib/ops-mock.mjs';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const { MOCK: MOCK3 } = await import(pathToFileURL(join(root, 'tests/desk-home3.mjs')).href);
const SHOTS = process.env.OPS_SHOTS || null;
const pageRoot = process.env.OPS_ROOT || root;   // ทดสอบหน้าฉบับอื่น (mutation) ได้
if (SHOTS) mkdirSync(SHOTS, { recursive: true });

const TESTS = `<script>
window.addEventListener('load', () => setTimeout(runTests, 300));
${HARNESS}
const sleep = ms => new Promise(r => setTimeout(r, ms));
const $ = id => document.getElementById(id);
const frames = () => new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)));
async function login(name) {
  $('loginEmail').value = name + '@x';
  $('loginPassword').value = 'x';
  await doLogin();
  await sleep(500);
}
async function shot(name) {
  await frames(); await sleep(150);
  await new Promise(r => { window.__shot = r; console.log('[SHOT] ' + name); });
}
const vis = el => !!el && el.getClientRects().length > 0 && getComputedStyle(el).visibility !== 'hidden';
const titles = () => [...document.querySelectorAll('#opsBoard .ops-title')].map(e => e.textContent);
const groups = () => [...document.querySelectorAll('#opsBoard .ops-group h3')].map(h => h.firstChild.textContent.trim());
const card = id => document.querySelector('#opsBoard .ops-task[data-id="' + id + '"]');
const opsCalls = (op) => CALLS.filter(c => /^ops_/.test(c.table || '') && (!op || c.op === op));
const setFilter = f => document.querySelector('#opsFilter button[data-filter="' + f + '"]').click();
const stat = id => $(id).textContent;
const fatalText = () => (document.querySelector('.fatal-error, #fatalError, .fatal') || {}).textContent || document.body.innerText;
function changeStatus(id, v) { const s = card(id).querySelector('select[data-act="status"]'); s.value = v; s.dispatchEvent(new Event('change', { bubbles: true })); }
function fillForm(o) {
  const map = { title: 'opsfTitle', detail: 'opsfDetail', action: 'opsfAction', sev: 'opsfSev', status: 'opsfStatus', area: 'opsfArea', due: 'opsfDue', owner: 'opsfOwner', source: 'opsfSource' };
  for (const [k, v] of Object.entries(o)) $(map[k]).value = v;
}
async function submitForm() { $('opsForm').requestSubmit(); await sleep(200); }

async function runTests() {
  L('=== Ops Board (#ops) ===');
  // ── 1. เจ้าของร้าน ─────────────────────────────────────────────────────
  await login('tibass');
  const nav = document.querySelector('#navList .nav-item[data-s="ops"]');
  ok('เจ้าของร้านเห็นเมนู Ops Board ในกลุ่ม "บัญชีและระบบ"', !!nav && /Ops Board/.test(nav.textContent) && nav.closest('.nav-group').querySelector('.nav-group-title').textContent === 'บัญชีและระบบ');
  ok('ยังไม่เปิดหมวด = ยังไม่มีคำขอไปที่ตาราง ops_*', opsCalls().length === 0, JSON.stringify(opsCalls()));
  ok('showSection("ops") สำเร็จ · hash = #ops · หัวหน้า = Ops Board', showSection('ops') === true && location.hash === '#ops' && $('pageTitle').textContent === 'Ops Board' && !$('sec-ops').hidden);
  await sleep(300); await frames();
  ok('โหลดงานจาก ops_tasks และ ops_board_meta ตอนเปิดหมวด', opsCalls('select').some(c => c.table === 'ops_tasks') && opsCalls('select').some(c => c.table === 'ops_board_meta'));

  ok('สรุป: ด่วนค้าง 2 · จับตาค้าง 2 · เลยกำหนด/ใกล้ครบ 2 · เสร็จใน 7 วัน 1', stat('opsStatRed') === '2' && stat('opsStatAmber') === '2' && stat('opsStatDue') === '2' && stat('opsStatDone') === '1',
    [stat('opsStatRed'), stat('opsStatAmber'), stat('opsStatDue'), stat('opsStatDone')].join('/'));
  ok('ตัวกรองเริ่มต้น "ยังไม่เสร็จ": 6 งาน ไม่มีงานที่เสร็จแล้ว', titles().length === 6 && !titles().some(t => /เสร็จ/.test(t)), titles().join(' | '));
  ok('กลุ่มเรียง ด่วน → จับตา → ติดตาม และบอกเป็นคำ (ไม่ใช้สีอย่างเดียว)', groups().join(',') === 'ด่วน,จับตา,ติดตาม', groups().join(','));
  ok('หัวกลุ่มบอกจำนวนงาน', /2 งาน/.test(document.querySelector('#opsBoard .ops-group h3').textContent));
  const redTitles = [...document.querySelectorAll('#opsBoard .ops-group:first-child .ops-title')].map(e => e.textContent);
  ok('ในกลุ่ม: งานเลยกำหนดขึ้นก่อนงานที่ครบทีหลัง', redTitles[0].includes('มหาจักร') && redTitles[1].includes('Serato'), redTitles.join(' | '));
  ok('งานเลยกำหนด: ป้ายบอก "เลยกำหนด 3 วัน" (st-bad)', /เลยกำหนด 3 วัน/.test(card('t1').textContent) && !!card('t1').querySelector('.st-bad'));
  ok('งานครบใน 2 วัน: ป้าย "อีก 2 วัน" (st-warn)', /อีก 2 วัน/.test(card('t2').textContent) && !!card('t2').querySelector('.st-warn'));
  ok('งานกำหนดไกล: ป้าย "กำหนด …" (st-off)', !!card('t3').querySelector('.st-off') && /กำหนด /.test(card('t3').textContent));
  ok('งานที่มีรายละเอียด/ทำต่อ/ที่มา แสดงครบ', /ค้างมาตั้งแต่ต้นเดือน/.test(card('t1').textContent) && /ทำต่อ:/.test(card('t1').textContent) && /ที่มา: Gmail/.test(card('t1').textContent));
  ok('ชื่อที่มีแท็ก HTML ถูกแสดงเป็นข้อความ ไม่ถูกรัน (กัน XSS)', !window.__xss && !document.querySelector('#opsBoard img') && /<img src=x/.test(card('t8').querySelector('.ops-title').textContent));
  ok('ช่องสถานะของแต่ละงานเป็นค่าจริงของงาน (กำลังทำ/รอคนอื่น)', card('t2').querySelector('select[data-act=status]').value === 'doing' && card('t4').querySelector('select[data-act=status]').value === 'waiting');
  ok('ปุ่ม แก้ไข / ลบ มีทุกงาน', [...document.querySelectorAll('#opsBoard .ops-task')].every(t => t.querySelector('[data-act=edit]') && t.querySelector('[data-act=del]')));
  ok('แผงขวา: รอบถัดไป · แหล่งข้อมูล 3 · รายงาน 1 · "ยังไม่มีรอบที่รันแล้ว"', /รอบถัดไป/.test($('opsRail').textContent) && document.querySelectorAll('#opsRail .ops-src').length === 3 && /sample-report-2026/.test($('opsRail').textContent) && /ยังไม่มีรอบที่รันแล้ว/.test($('opsRail').textContent));
  ok('แหล่งข้อมูล: สถานะบอกเป็นคำ ใช้ได้ / บางส่วน / ยังไม่มี', ['ใช้ได้', 'บางส่วน', 'ยังไม่มี'].every(w => $('opsRail').textContent.includes(w)));
  if (${JSON.stringify(!!SHOTS)}) await shot('ops-owner-1440.png');

  // กรอง
  setFilter('done'); await frames();
  ok('กรอง "เสร็จแล้ว": เห็นเฉพาะ 2 งานที่เสร็จ ขีดฆ่า และอยู่นอกกลุ่ม "ติดตาม"', titles().length === 2 && !!card('t6') && !!card('t7') && card('t6').classList.contains('done'));
  setFilter('all'); await frames();
  ok('กรอง "ทั้งหมด": 8 งาน · งานเสร็จอยู่ท้ายกลุ่มของมัน', titles().length === 8);
  const amber = [...document.querySelectorAll('#opsBoard .ops-group')].find(g => /จับตา/.test(g.querySelector('h3').textContent));
  const amberOrder = [...amber.querySelectorAll('.ops-task')].map(t => t.dataset.id);
  ok('ในกลุ่มจับตา งานที่เสร็จแล้วอยู่ท้ายสุด', amberOrder[amberOrder.length - 1] === 't6', amberOrder.join(','));
  setFilter('open');
  $('opsArea').value = 'ads'; $('opsArea').dispatchEvent(new Event('change', { bubbles: true })); await frames();
  ok('กรองหมวด "แอด" + ยังไม่เสร็จ: เหลืองาน t2 งานเดียว', titles().length === 1 && !!card('t2'), titles().join('|'));
  $('opsArea').value = 'all'; $('opsArea').dispatchEvent(new Event('change', { bubbles: true }));
  $('opsSearch').value = 'serato'; $('opsSearch').dispatchEvent(new Event('input', { bubbles: true })); await frames();
  ok('ค้นหา "serato" (ไม่สนตัวพิมพ์): เจอ t2 งานเดียว', titles().length === 1 && !!card('t2'));
  $('opsSearch').value = 'ไม่มีทางเจอ'; $('opsSearch').dispatchEvent(new Event('input', { bubbles: true })); await frames();
  ok('ค้นหาไม่เจอ: ขึ้นข้อความบอก ไม่ใช่หน้าว่าง', /ไม่มีงานที่ตรงกับตัวกรอง/.test($('opsBoard').textContent));
  $('opsSearch').value = ''; $('opsSearch').dispatchEvent(new Event('input', { bubbles: true })); await frames();

  // เปลี่ยนสถานะ
  const nUp = opsCalls('update').length;
  changeStatus('t1', 'done'); await sleep(200);
  ok('เปลี่ยนสถานะ → ส่ง update เฉพาะ {status} ที่งานนั้น', opsCalls('update').length === nUp + 1 && JSON.stringify(opsCalls('update').pop().payload) === '{"status":"done"}' && opsCalls('update').pop().filters[0].join('=') === 'id=t1');
  ok('งานที่เสร็จหายจาก "ยังไม่เสร็จ" · สรุปเลื่อน: ด่วนค้าง 1 · เลยกำหนด/ใกล้ครบ 1 · เสร็จ 7 วัน 2 (done_at จากฐานข้อมูล)',
    !card('t1') && stat('opsStatRed') === '1' && stat('opsStatDue') === '1' && stat('opsStatDone') === '2', [stat('opsStatRed'), stat('opsStatDue'), stat('opsStatDone')].join('/'));
  setFilter('done'); await frames();
  ok('งานที่เพิ่งปิดไปอยู่ในแท็บ "เสร็จแล้ว" ขีดฆ่า', !!card('t1') && card('t1').classList.contains('done'));
  changeStatus('t1', 'doing'); await sleep(200);
  setFilter('open'); await frames();
  ok('เปิดงานกลับ → กลับมาในรายการค้าง (done_at ถูกล้างโดยฐานข้อมูล)', !!card('t1') && OPS.tasks.find(t => t.id === 't1').done_at === null);

  // เพิ่ม
  const nIns = opsCalls('insert').length;
  $('opsAdd').click(); await sleep(100);
  ok('กด "+ เพิ่มงาน": เปิดหน้าต่างฟอร์ม · ค่าเริ่มต้น จับตา/ยังไม่เริ่ม/งานร้าน/เจ้าของร้าน', $('opsDialog').open && $('opsFormTitle').textContent === 'เพิ่มงานใหม่' && $('opsfSev').value === 'amber' && $('opsfStatus').value === 'todo' && $('opsfArea').value === 'shop' && $('opsfOwner').value === 'เจ้าของร้าน');
  await submitForm();
  ok('ไม่ใส่ชื่องาน: ขึ้นข้อความในหน้าต่าง ไม่ส่งอะไรไปฐานข้อมูล ไม่ปิดหน้าต่าง', $('opsDialog').open && !$('opsFormErr').hidden && /ชื่องาน/.test($('opsFormErr').textContent) && opsCalls('insert').length === nIns);
  fillForm({ title: '  งานใหม่จากคอนโซล  ', detail: 'รายละเอียด', action: 'ทำต่อ', sev: 'red', status: 'doing', area: 'ads', due: '2026-12-31', owner: 'Claude', source: 'ทดสอบ' });
  await submitForm();
  const ins = opsCalls('insert').pop();
  ok('บันทึก: insert ครบทุกฟิลด์ · ตัดช่องว่างหน้าหลัง · due เป็นวันที่ · id ขึ้นต้น m', opsCalls('insert').length === nIns + 1 && ins.payload.title === 'งานใหม่จากคอนโซล' && ins.payload.severity === 'red' && ins.payload.status === 'doing' && ins.payload.area === 'ads' && ins.payload.due === '2026-12-31' && /^m[a-z0-9]+$/.test(ins.payload.id), JSON.stringify(ins.payload));
  ok('หน้าต่างปิด · งานใหม่ขึ้นในกลุ่ม "ด่วน" · ไม่ส่ง created_by/done_at เอง (ฐานข้อมูลเติม)', !$('opsDialog').open && !!document.querySelector('#opsBoard .ops-title') && titles().includes('งานใหม่จากคอนโซล') && !('created_by' in ins.payload) && !('done_at' in ins.payload));
  $('opsAdd').click(); await sleep(50); fillForm({ title: 'ปิดงานแล้วตอนสร้าง', status: 'done' }); await submitForm();
  ok('สร้างงานเป็น "เสร็จแล้ว" ตั้งแต่แรก → ฐานข้อมูลเติม done_at ให้', OPS.tasks.find(t => t.title === 'ปิดงานแล้วตอนสร้าง').done_at !== null);

  // แก้
  const tid = OPS.tasks.find(t => t.title === 'งานใหม่จากคอนโซล').id;
  card(tid).querySelector('[data-act=edit]').click(); await sleep(100);
  ok('แก้ไข: หน้าต่างขึ้นพร้อมค่าเดิมครบ', $('opsFormTitle').textContent === 'แก้ไขงาน' && $('opsfTitle').value === 'งานใหม่จากคอนโซล' && $('opsfSev').value === 'red' && $('opsfDue').value === '2026-12-31' && $('opsfSource').value === 'ทดสอบ');
  const nUpd = opsCalls('update').length;
  fillForm({ title: 'ชื่อที่แก้แล้ว', sev: 'green' }); await submitForm();
  ok('บันทึกการแก้: update ที่งานเดิม (ไม่สร้างใหม่) · ชื่อและกลุ่มเปลี่ยนตาม', opsCalls('update').length === nUpd + 1 && opsCalls('update').pop().filters[0].join('=') === 'id=' + tid && opsCalls('insert').length === nIns + 2 && titles().includes('ชื่อที่แก้แล้ว') && card(tid).closest('.ops-group').querySelector('h3').textContent.includes('ติดตาม'));

  // ลบ
  card('t3').querySelector('[data-act=del]').click(); await sleep(100);
  ok('กดลบ: ขึ้นหน้าต่างยืนยันที่ระบุชื่องาน ยังไม่ลบ', $('confirmDialog').open && /เช็กรีวิวใหม่/.test($('confirmBody').textContent) && !!card('t3') && opsCalls('delete').length === 0);
  $('confirmDialog').close(); await sleep(50);
  ok('ยกเลิกการลบ: งานยังอยู่ ไม่มีคำสั่งลบ', !!card('t3') && opsCalls('delete').length === 0);
  card('t3').querySelector('[data-act=del]').click(); await sleep(100); $('confirmOkBtn').click(); await sleep(250);
  ok('ยืนยันลบ: delete ที่ id นั้น (ขอแถวกลับมานับ) · งานหายจากหน้าและฐานข้อมูล', opsCalls('delete').length === 1 && opsCalls('delete')[0].filters[0].join('=') === 'id=t3' && !card('t3') && !OPS.tasks.some(t => t.id === 't3') && !$('confirmDialog').open);
  OPS.denyDelete = true;
  card('t4').querySelector('[data-act=del]').click(); await sleep(100); $('confirmOkBtn').click(); await sleep(250);
  ok('ฐานข้อมูลไม่ลบให้ (RLS ปฏิเสธเงียบๆ ไม่มี error): หน้าไม่ขึ้นว่าลบแล้ว · งานยังอยู่ · แจ้งความล้มเหลว', !!card('t4') && OPS.tasks.some(t => t.id === 't4') && /ลบงานไม่สำเร็จ/.test(document.body.innerText), document.body.innerText.slice(0, 200));
  OPS.denyDelete = false;

  // ฐานข้อมูลล้ม
  OPS.fail.update = 'พังจำลอง';
  changeStatus('t5', 'doing'); await sleep(250);
  ok('เปลี่ยนสถานะไม่สำเร็จ: แจ้งความล้มเหลว · ช่องเลือกกลับเป็นสถานะจริง (ไม่หลอกว่าสำเร็จ)', /เปลี่ยนสถานะงานไม่สำเร็จ/.test(document.body.innerText) && card('t5').querySelector('select[data-act=status]').value === 'todo');
  OPS.fail.update = null;
  OPS.fail.insert = 'พังจำลอง';
  $('opsAdd').click(); await sleep(50); fillForm({ title: 'งานที่บันทึกไม่ได้' }); await submitForm();
  ok('เพิ่มงานไม่สำเร็จ: แจ้งในหน้าต่าง · หน้าต่างไม่ปิด (ไม่ทำข้อมูลที่พิมพ์ไว้หาย) · ปุ่มบันทึกกดซ้ำได้', $('opsDialog').open && /บันทึกไม่สำเร็จ/.test($('opsFormErr').textContent) && $('opsfSave').disabled === false && $('opsfTitle').value === 'งานที่บันทึกไม่ได้');
  $('opsDialog').close(); OPS.fail.insert = null;
  OPS.fail.select = 'พังจำลอง'; $('opsRefresh').click(); await sleep(300);
  ok('โหลดไม่สำเร็จ: ขึ้นข้อความแดงในหน้าและแถบเตือน', /โหลดงานไม่สำเร็จ/.test($('opsAlert').textContent) && /โหลด Ops Board ไม่สำเร็จ/.test(document.body.innerText));
  OPS.fail.select = null; OPS.missing = true; $('opsRefresh').click(); await sleep(300);
  ok('ยังไม่ได้รัน 033 (ไม่มีตาราง): บอกให้รัน migration ไม่ใช่ error ดิบ', /ต้องรัน migration 033/.test($('opsAlert').textContent));
  OPS.missing = false; $('opsRefresh').click(); await sleep(300);
  ok('รีเฟรชแล้วกลับมาปกติ: ข้อความเตือนหาย งานกลับมา', $('opsAlert').textContent === '' && titles().length > 0);
  ok('ตัวหนังสือทุกส่วนของหมวด ≥ 14px', [...document.querySelectorAll('#sec-ops *')].filter(e => e.children.length === 0 && e.textContent.trim() && vis(e)).every(e => parseFloat(getComputedStyle(e).fontSize) >= 13.95),
    [...new Set([...document.querySelectorAll('#sec-ops *')].filter(e => e.children.length === 0 && e.textContent.trim() && vis(e) && parseFloat(getComputedStyle(e).fontSize) < 13.95).map(e => e.className + ' ' + getComputedStyle(e).fontSize))].join(' | '));
  ok('ทุกมุมเป็นเหลี่ยม (border-radius 0) ในหมวด', [...document.querySelectorAll('#sec-ops .ops-task, #sec-ops .ops-group h3, #sec-ops .btn, #sec-ops .st, #sec-ops select')].every(e => getComputedStyle(e).borderRadius === '0px'));

  // ── 1b. ช่วยคิด (Claude) — ปุ่มบนงาน · หน้าต่าง · คำตอบเก่า · ข้อผิดพลาด · ปิดกลางทาง ──────────────
  const aiBtn = id => card(id).querySelector('[data-act=ai]');
  const aiFn = () => CALLS.filter(c => c.op === 'fn' && c.name === 'ai');
  const aiWrites = () => opsCalls().filter(c => c.table === 'ops_task_ai' && c.op !== 'select');
  const aiAnswers = () => [...document.querySelectorAll('#opsAiList .ops-ai-ans')];
  const askBtns = () => [$('opsAiDraft'), $('opsAiSteps')];
  const aiOut = i => aiAnswers()[i].querySelector('.ops-ai-out').textContent;
  let release;
  ok('ปุ่ม "ช่วยคิด" มีในงานทั่วไป (อีเมล / คอนเทนต์)', !!aiBtn('t1') && !!aiBtn('t8'));
  ok('งานหมวด "ระบบ/บอท": ไม่มีปุ่ม + บอกเหตุผลสั้น ๆ บนการ์ด', !aiBtn('t5') && /ตัวช่วยคิดไม่รับงานหมวดนี้/.test(card('t5').textContent));
  const nBefore = CALLS.length;
  openOpsAi('t5'); await sleep(100);
  ok('เรียก openOpsAi กับงานหมวดระบบตรง ๆ: หน้าต่างไม่เปิด · ไม่มีคำขอไปที่ฟังก์ชัน ai หรือตาราง ops_task_ai', !$('opsAiDialog').open && CALLS.slice(nBefore).filter(c => c.name === 'ai' || c.table === 'ops_task_ai').length === 0);
  ok('ยังไม่กดอะไร = ยังไม่มีคำขอไปที่ฟังก์ชัน ai', aiFn().length === 0);

  aiBtn('t1').click(); await sleep(250);
  ok('กด "ช่วยคิด": เปิดหน้าต่าง · แสดงชื่องาน', $('opsAiDialog').open && $('opsAiTask').textContent === 'ตอบอีเมลมหาจักรเรื่องรายงานแอด');
  ok('บอกก่อนใช้: เนื้องานถูกส่งไป Claude ของ Anthropic · เป็นร่างให้ตรวจเอง · โควตาวันละ 20 ครั้ง', /Anthropic/.test($('opsAiDialog').textContent) && /ร่างให้ตรวจเอง/.test($('opsAiDialog').textContent) && /วันละ 20 ครั้ง/.test($('opsAiDialog').textContent));
  ok('เปิดหน้าต่างแล้วยังไม่ยิง ai เอง · โหลดคำตอบเก่า 2 รายการ จาก ops_task_ai เฉพาะงานนี้', aiFn().length === 0 && aiAnswers().length === 2 &&
    opsCalls('select').some(c => c.table === 'ops_task_ai' && c.filters.some(f => f.join('=') === 'task_id=t1')), aiAnswers().length + ' · ' + JSON.stringify(opsCalls('select').filter(c => c.table === 'ops_task_ai').map(c => c.filters)));
  const metas = () => aiAnswers().map(a => a.querySelector('.ops-ai-meta span').textContent);
  ok('คำตอบเก่าเรียงใหม่สุดก่อน (ขั้นตอน เมื่อวาน → ร่างข้อความ เมื่อ 2 วันก่อน)', /^ขั้นตอน/.test(metas()[0]) && /^ร่างข้อความ/.test(metas()[1]), metas().join(' | '));
  ok('เนื้อคำตอบเก่าแสดงเป็นข้อความ (แท็ก <b> ไม่ถูกตีความ) · คงบรรทัดใหม่ (pre-wrap)', /<b>ฉบับเก่า<\\/b>/.test(aiOut(1)) && !document.querySelector('#opsAiList b') && /\\n/.test(aiOut(1)) &&
    getComputedStyle(aiAnswers()[1].querySelector('.ops-ai-out')).whiteSpace === 'pre-wrap');

  release = null; OPS.aiGate = new Promise(r => { release = r; });
  $('opsAiDraft').click(); await sleep(100);
  ok('กด "ร่างข้อความ": ส่งไป ai ด้วย {task_id, kind} เท่านั้น (ไม่มี prompt ใด ๆ จากหน้าเว็บ)', aiFn().length === 1 && JSON.stringify(aiFn()[0].body) === '{"task_id":"t1","kind":"draft"}', JSON.stringify(aiFn().map(c => c.body)));
  ok('ระหว่างรอ: บอกว่ากำลังคิด · ปุ่มเลือกแบบคำขอกดซ้ำไม่ได้', /กำลังให้ Claude คิด/.test($('opsAiStatus').textContent) && askBtns().every(b => b.disabled));
  $('opsAiSteps').click(); opsAiAsk('steps'); await sleep(100);   // ไม่ await — ถ้าไม่มีตัวกันกดซ้ำ คำขอที่สองจะค้างรอ gate เดียวกัน เทสต์ต้องตกที่ข้อนับ ไม่ใช่ค้างทั้งชุด
  ok('กดซ้ำ / เรียกซ้ำระหว่างรอ: ไม่ยิงฟังก์ชันซ้ำ (ไม่กินโควตาเพิ่ม)', aiFn().length === 1, aiFn().length);
  OPS.aiGate = null; release(); await sleep(250);
  ok('ได้คำตอบ: ขึ้นบนสุด ติดป้าย "ใหม่" · รวม 3 รายการ · ปุ่มกลับมากดได้ · แจ้งโควตา "3 \/ 20"', aiAnswers().length === 3 && aiAnswers()[0].classList.contains('fresh') && /^ร่างข้อความ · .*ใหม่/.test(metas()[0]) &&
    !askBtns().some(b => b.disabled) && /วันนี้ใช้แล้ว 3 \\/ 20 ครั้ง/.test($('opsAiStatus').textContent), metas().join(' | ') + ' · ' + $('opsAiStatus').textContent);
  ok('คำตอบที่มีแท็ก HTML ถูกแสดงเป็นข้อความ ไม่ถูกรัน (กัน XSS)', !window.__xss && !document.querySelector('#opsAiList img') && /<img src=x/.test(aiOut(0)));
  ok('หน้าเว็บไม่เขียน ops_task_ai เอง (ฟังก์ชันฝั่งเซิร์ฟเวอร์เป็นคนบันทึก)', aiWrites().length === 0, JSON.stringify(aiWrites()));
  let copied = null;
  Object.defineProperty(navigator, 'clipboard', { value: { writeText: async t => { copied = t; } }, configurable: true });
  aiAnswers()[0].querySelector('[data-act=copy]').click(); await sleep(100);
  ok('ปุ่ม "คัดลอก": ได้เนื้อคำตอบนั้นทั้งก้อน (ไม่รวมหัวป้าย) · มีข้อความยืนยัน', copied === aiOut(0) && /ตัวอย่างร่าง/.test(copied) && !/ใหม่/.test(copied) && /คัดลอกคำตอบแล้ว/.test($('toast').textContent), copied);
  if (${JSON.stringify(!!SHOTS)}) await shot('ops-ai-dialog-1440.png');
  ok('หน้าต่างช่วยคิด: ตัวหนังสือ ≥ 14px ทุกส่วน', [...document.querySelectorAll('#opsAiDialog *')].filter(e => e.children.length === 0 && e.textContent.trim() && vis(e)).every(e => parseFloat(getComputedStyle(e).fontSize) >= 13.95),
    [...new Set([...document.querySelectorAll('#opsAiDialog *')].filter(e => e.children.length === 0 && e.textContent.trim() && vis(e) && parseFloat(getComputedStyle(e).fontSize) < 13.95).map(e => e.className + ' ' + getComputedStyle(e).fontSize))].join(' | '));
  ok('หน้าต่างช่วยคิด: ทุกมุมเป็นเหลี่ยม · ไม่ล้นจอ', [...document.querySelectorAll('#opsAiDialog .btn, #opsAiDialog .ops-ai-ans, #opsAiDialog .alert')].every(e => getComputedStyle(e).borderRadius === '0px') &&
    $('opsAiDialog').getBoundingClientRect().right <= innerWidth && $('opsAiDialog').getBoundingClientRect().bottom <= innerHeight);

  for (const [mode, re, cls] of [['not_configured', /ANTHROPIC_API_KEY/, 'alert-warn'], ['quota', /พรุ่งนี้/, 'alert-warn'], ['fail', /ไม่ว่างชั่วคราว/, 'alert-red']]) {
    OPS.aiMode = mode;
    const n = aiAnswers().length, nc = aiFn().length;
    $('opsAiSteps').click(); await sleep(200);
    const al = $('opsAiStatus').querySelector('.alert');
    ok('ฟังก์ชันตอบ ' + mode + ': ข้อความภาษาไทยบอกวิธีไปต่อ (' + cls + ') · คำตอบเดิมไม่หาย · ปุ่มกลับมากดได้',
      aiFn().length === nc + 1 && !!al && al.classList.contains(cls) && re.test(al.textContent) && aiAnswers().length === n && !askBtns().some(b => b.disabled), al && al.className + ' | ' + al.textContent);
  }
  OPS.aiMode = 'warn'; $('opsAiSteps').click(); await sleep(200);
  ok('ฟังก์ชันตอบได้แต่บันทึกไม่สำเร็จ: ยังแสดงคำตอบ + เตือนให้คัดลอกเก็บไว้ก่อน', aiAnswers().length === 4 && /คัดลอกเก็บไว้ก่อน/.test($('opsAiStatus').textContent) && !!$('opsAiStatus').querySelector('.alert-warn'));
  OPS.aiMode = 'ok';
  ok('ตลอดชุดนี้ หน้าเว็บไม่เคยเขียน ops_task_ai เอง', aiWrites().length === 0);

  $('opsAiClose').click(); await sleep(50);
  ok('ปุ่ม "ปิด" ปิดหน้าต่าง · ล้างสถานะหน้าต่าง', !$('opsAiDialog').open && opsAi === null);
  OPS.fail.aiHistory = 'พังจำลอง';
  aiBtn('t1').click(); await sleep(250);
  ok('โหลดคำตอบเก่าไม่สำเร็จ: เตือนในหน้าต่าง ไม่ล้มทั้งหน้า · ยังกดถามได้', $('opsAiDialog').open && /โหลดคำตอบเก่าไม่สำเร็จ: พังจำลอง/.test($('opsAiStatus').textContent) && !askBtns().some(b => b.disabled));
  OPS.fail.aiHistory = null; OPS.missing = true; $('opsAiClose').click(); aiBtn('t1').click(); await sleep(250);
  ok('ยังไม่ได้รัน 033 (ไม่มีตาราง ops_task_ai): บอกให้รัน migration ไม่ใช่ error ดิบ', /ต้องรัน migration 033/.test($('opsAiStatus').textContent));
  OPS.missing = false; $('opsAiClose').click(); await sleep(50);

  aiBtn('t1').click(); await sleep(250);
  const nHist = OPS.aiRows.filter(r => r.task_id === 't1').length;
  ok('เปิดใหม่: ประวัติตรงกับฐานข้อมูล (คำตอบที่บันทึกแล้วทุกอัน · ไม่มีป้าย "ใหม่" ค้าง)', aiAnswers().length === nHist && !document.querySelector('#opsAiList .fresh') && $('opsAiStatus').textContent === '', aiAnswers().length + ' vs ' + nHist);
  release = null; OPS.aiGate = new Promise(r => { release = r; });
  $('opsAiDraft').click(); await sleep(100);
  $('opsAiClose').click(); await sleep(50);
  OPS.aiGate = null; release(); await sleep(250);
  ok('ปิดหน้าต่างระหว่างรอคำตอบ: คำตอบที่มาทีหลังไม่ถูกวาดลงหน้า · ไม่มี error', !$('opsAiDialog').open && !document.querySelector('#opsAiList .fresh') && !/วันนี้ใช้แล้ว/.test($('opsAiStatus').textContent));
  aiBtn('t1').click(); await sleep(250);
  ok('เปิดใหม่หลังนั้น: เห็นคำตอบที่ฟังก์ชันบันทึกไว้ในประวัติ (ไม่เสียของ)', aiAnswers().length === nHist + 1 && !document.querySelector('#opsAiList .fresh'), aiAnswers().length + ' vs ' + (nHist + 1));
  $('opsAiClose').click(); await sleep(50);

  // ── 2. admin / staff ─────────────────────────────────────────────────
  for (const [who, label] of [['nui', 'admin (ผู้ดูแลระบบ)'], ['zen', 'staff (พนักงาน)']]) {
    doLogout(); await sleep(400);
    CALLS.length = 0;
    await login(who);
    ok(label + ': ไม่เห็นเมนู Ops Board', !document.querySelector('#navList .nav-item[data-s="ops"]'));
    const r = showSection('ops');
    ok(label + ': showSection("ops") ถูกปฏิเสธ + แจ้งว่าเฉพาะเจ้าของร้าน', r === false && /เฉพาะเจ้าของร้าน/.test($('toast').textContent) && $('sec-ops').hidden);
    await loadOps(); await sleep(150);
    ok(label + ': ไม่มีคำขอไปที่ตาราง ops_* เลย (แม้เรียก loadOps ตรงๆ)', opsCalls().length === 0, JSON.stringify(opsCalls()));
    ok(label + ': ไม่มีเนื้อหางานในหน้า', !/มหาจักร|Serato|เช็กรีวิว/.test(document.body.innerText) && ops.tasks.length === 0);
    const keyCombo = new KeyboardEvent('keydown', { code: 'KeyO', key: 'o', altKey: true, bubbles: true, cancelable: true });
    document.dispatchEvent(keyCombo); await sleep(100);
    ok(label + ': Alt+O ไม่พาเข้า Ops Board', $('sec-ops').hidden && current !== 'ops');
  }

  // ── 3. สลับบัญชีจากเจ้าของเป็นพนักงานบนเครื่องเดิม ──────────────────────
  doLogout(); await sleep(400);
  await login('tibass');
  showSection('ops'); await sleep(300);
  ok('(ตั้งต้น) เจ้าของเปิด Ops Board แล้วเห็นงาน', titles().length > 0 && /มหาจักร|Serato/.test(document.body.innerText));
  aiBtn('t1').click(); await sleep(250);
  release = null; OPS.aiGate = new Promise(r => { release = r; });
  $('opsAiDraft').click(); await sleep(100);
  ok('(ตั้งต้น) หน้าต่างช่วยคิดเปิดอยู่ มีคำตอบเก่า และกำลังรอคำตอบใหม่', $('opsAiDialog').open && aiAnswers().length > 0 && /กำลังให้ Claude คิด/.test($('opsAiStatus').textContent));
  doLogout(); await sleep(400);
  OPS.aiGate = null; release(); await sleep(300);          // คำตอบมาถึงหลังออกจากระบบแล้ว — ต้องไม่ถูกวาดลงหน้า
  ok('ออกจากระบบกลางคำขอช่วยคิด: หน้าต่างปิด · สถานะหน้าต่างว่าง · ไม่มีคำตอบ/ชื่องานค้างในหน้าต่าง แม้คำตอบมาทีหลัง',
    !$('opsAiDialog').open && opsAi === null && $('opsAiList').innerHTML === '' && $('opsAiTask').textContent === '' && $('opsAiStatus').innerHTML === '');
  const leakRe = /ฉบับเก่า|ตัวอย่างร่าง|ขั้นแรก|รายงานแอด ก\.ย\.|ตอบอีเมลมหาจักร|ต่อ Serato|เช็กรีวิวใหม่|ไดรฟ์งานคอนเทนต์|รอยืนยันบัญชีโฆษณา|งานใหม่จากคอนโซล|ชื่อที่แก้แล้ว/;   // ข้อความเฉพาะของงานจริง (รายชื่อผู้รับผิดชอบเป็นค่าคงที่ ไม่นับ)
  const leakAt = [...document.querySelectorAll('body *')].filter(e => !/^(SCRIPT|STYLE)$/.test(e.tagName) && e.children.length === 0 && leakRe.test(e.textContent + (e.value || ''))).map(e => (e.id ? '#' + e.id : e.tagName.toLowerCase() + '.' + e.className));
  ok('ออกจากระบบ: Ops Board ถูกล้างออกจากหน้า (DOM + หน่วยความจำ)', !leakAt.length && ops.tasks.length === 0 && $('opsBoard').innerHTML.indexOf('ops-task') === -1, 'ค้างที่: ' + leakAt.join(', ') + ' · tasks=' + ops.tasks.length);
  await login('zen');
  ok('ล็อกอินเป็นพนักงานต่อ: เปิดหน้าแล้วไม่มีเนื้อหางานของเจ้าของ · ไม่ค้างอยู่หมวด Ops Board', current !== 'ops' && !/มหาจักร|Serato|เช็กรีวิว/.test(document.body.innerText));
  done();
}
function done() {
  L('=== สรุป: ' + pass + ' PASS / ' + fail + ' FAIL ===');
  L(fail ? 'RESULT:FAIL' : 'RESULT:PASS');
}
</script>`;

const net = '--host-resolver-rules=MAP * ~NOTFOUND';
const res = await runCdpPage({ root: pageRoot, file: 'desk.html', mock: MOCK3 + OPS_MOCK, tests: TESTS, width: 1440, height: 900, coarse: false, shotDir: SHOTS, flags: [net] });
console.log('\n=== desk-ops: ' + (res.ok ? 'ผ่าน' : 'ไม่ผ่านหรือไม่ได้รันจนจบ') + ' ===');
process.exit(res.ok ? 0 : 1);
