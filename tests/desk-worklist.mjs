/**
 * เทสต์หมวด "งานของฉัน" ของ desk.html (#tasks · Alt+T · Work Checklist · migration 037 + 038)
 *   รัน: node tests/desk-worklist.mjs
 *   ถ่ายภาพ: WORK_SHOTS=<โฟลเดอร์> node tests/desk-worklist.mjs
 *
 * ตัวรัน CDP เดียวกับ desk-ops · ฐานข้อมูลปลอมอยู่ที่ tests/lib/worklist-mock.mjs (จำลอง RLS + ฟังก์ชัน work_* ตามตารางสิทธิ์ของ 038 ·
 * ชุดตรวจของ SQL ตัวจริงอยู่ที่ Console/sql-tests/test038.mjs) — ที่นี่ตรวจฝั่งหน้าจอ: ใครเห็นอะไร · ปุ่มไหนโผล่ · ฟอร์มขั้น 1 ไม่มีช่องลิงก์โซเชียล ·
 * ขั้น 2 ต้องลิงก์ครบ+โดเมนตรง · ส่งอะไรไปที่ฟังก์ชัน · ล้างหน้าตอนสลับบัญชี · Realtime · ยังไม่ได้รัน migration
 *
 *  1. พนักงาน (Zen): เมนู/ป้ายชื่อ/ตัวเลขแดง · แท็บที่เห็น · รายการงานของฉัน (กลุ่ม · ป้ายขั้น · รอลงโซเชียล · ความเห็นผู้ตรวจ) · ไม่เห็นใบคนอื่น
 *  2. ส่งงาน: ขั้น 1 (ไฟล์ · ไม่มีช่องโซเชียล) · ขั้น 2 (ลิงก์ครบ+โดเมน) · ขั้นเดียว · รูป (ย่อ+อัป+เก็บกวาดเมื่อล้ม) · ปุ่มยื่นคำขอ
 *  3. พนักงานสั่ง/แก้งาน (ใบที่ตัวเองสั่ง) · เลือกผู้รับได้เฉพาะพนักงาน · ไม่มีแท็บตรวจงาน
 *  4. คำขอ (ผู้ยื่น): ที่ฉันยื่น · แนบใบงาน · ยื่น/ถอน · ถูกปฏิเสธเห็นเหตุผล
 *  5. ผู้ดูแล (Nui): คิวตรวจเฉพาะงานของพนักงาน · ผ่านขั้นไฟล์/ปิดงาน/ส่งกลับ · กล่องคำขอ ตัดสิน (ปฏิเสธต้องมีเหตุผล · ใครตัดสินก่อน)
 *  6. เจ้าของ (TiBass): ตรวจได้ทุกใบ · เห็นคำขอทุกใบ แต่เลขแดงนับเฉพาะที่ถึงเจ้าของ · ปิดงาน (work_close)
 *  7. Realtime · ยังไม่ได้รัน 037/038 · โหลดล้ม · XSS · กันกดซ้ำ · ล้างหน้าตอนออกจากระบบ/สลับบัญชี
 */

import { dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { mkdirSync } from 'node:fs';
import { HARNESS } from './lib/page-test.mjs';
import { runCdpPage } from './lib/cdp-page.mjs';
import { WORK_MOCK } from './lib/worklist-mock.mjs';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const { MOCK: MOCK3 } = await import(pathToFileURL(join(root, 'tests/desk-home3.mjs')).href);
const SHOTS = process.env.WORK_SHOTS || null;
const pageRoot = process.env.WORK_ROOT || root;   // ทดสอบหน้าฉบับอื่น (mutation) ได้
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
const rpcs = fn => CALLS.filter(c => c.op === 'rpc' && c.fn === fn);
const lastRpc = fn => rpcs(fn)[rpcs(fn).length - 1];
const workCalls = () => CALLS.filter(c => /^work_/.test(c.table || '') || (c.op === 'rpc' && /^work_/.test(c.fn || '')));
const tab = n => document.querySelector('#workTabs .mail-tab[data-tab="' + n + '"]').click();
const tabsShown = () => [...document.querySelectorAll('#workTabs .mail-tab')].filter(b => !b.hidden).map(b => b.dataset.tab).join(',');
const mineIds = () => [...document.querySelectorAll('#workMineList .wk-task')].map(e => e.dataset.id);
const mineGroups = () => [...document.querySelectorAll('#workMineList .wk-group')].map(g => g.querySelector('h3 > span').firstChild.textContent.trim());
const groupIds = title => { const g = [...document.querySelectorAll('#workMineList .wk-group')].find(x => x.querySelector('h3 > span').firstChild.textContent.trim() === title); return g ? [...g.querySelectorAll('.wk-task')].map(e => e.dataset.id) : null; };
const cardOf = (root, id) => document.querySelector(root + ' .wk-task[data-id="' + id + '"]');
const txt = id => $(id).textContent;
const toast = () => $('toast').textContent;
const badge = () => { const b = $('navBadge-tasks'); return b && !b.hidden ? b.textContent : ''; };
const fatalText = () => (document.getElementById('fatalError') || {}).textContent || '';
const openMine = id => { cardOf('#workMineList', id).click(); };
const taskOnServer = id => WORK.tasks.find(t => t.id === id);
const reqOnServer = id => WORK.reqs.find(r => r.id === id);
const lastEv = (id, kind) => WORK.events.filter(e => e.task_id === id && (!kind || e.kind === kind)).pop();
const dlgOpen = id => $(id).open;
const pngFile = (w, h) => new Promise(res => { const c = document.createElement('canvas'); c.width = w; c.height = h; const g = c.getContext('2d'); g.fillStyle = '#3366cc'; g.fillRect(0, 0, w, h); c.toBlob(b => res(new File([b], 'p.png', { type: 'image/png' })), 'image/png'); });
const setVal = (id, v) => { const e = $(id); e.value = v; e.dispatchEvent(new Event('input', { bubbles: true })); e.dispatchEvent(new Event('change', { bubbles: true })); };
const closeAll = () => document.querySelectorAll('dialog[open]').forEach(d => d.close());
const isRed = el => !!el && getComputedStyle(el).color === 'rgb(204, 0, 26)' && Number(getComputedStyle(el).fontWeight) >= 600;      // --red #CC001A ตัวหนา (เจ้าของสั่ง: คำเตือน/ข้อความสำคัญเป็นสีแดง)
const redTexts = root => [...root.querySelectorAll('.wk-red')].filter(isRed).map(e => e.textContent);

async function runTests() {
  L('=== งานของฉัน (#tasks) ===');
  WORK.seed();
  // ── 1. พนักงาน (Zen) ───────────────────────────────────────────────────
  await login('zen');
  const nav = document.querySelector('#navList .nav-item[data-s="tasks"]');
  ok('พนักงานเห็นเมนู "งานของฉัน" ในกลุ่ม "พนักงาน" (ป้ายเมนู = ชื่อหน้า)', !!nav && nav.querySelector('.lbl').textContent === 'งานของฉัน' && nav.closest('.nav-group').querySelector('.nav-group-title').textContent === 'พนักงาน' && /Alt\\+T/.test(nav.title));
  ok('ตัวเลขแดงข้างเมนูขึ้นตั้งแต่ล็อกอิน (ไม่ต้องเปิดหมวด): ต้องทำ 4 (เกินกำหนด + ส่งกลับแก้ + รอลงโซเชียล + ขั้นเดียว)', badge() === '4', badge());
  ok('ล็อกอินแล้วโหลดงาน (ตาราง work_*) แต่ยังไม่เขียนอะไรเลย', workCalls().some(c => c.op === 'select' && c.table === 'work_tasks') && !workCalls().some(c => ['insert', 'update', 'delete'].includes(c.op)) && rpcs('work_create').length === 0);
  ok('showSection("tasks") สำเร็จ · hash = #tasks · หัวหน้า = งานของฉัน', showSection('tasks') === true && location.hash === '#tasks' && $('pageTitle').textContent === 'งานของฉัน' && !$('sec-tasks').hidden);
  await sleep(300); await frames();
  ok('พนักงานเห็นแท็บ งานของฉัน · สั่งงาน · คำขอ — ไม่เห็น "ตรวจงาน"', tabsShown() === 'mine,assign,req', tabsShown());
  ok('สรุป: ต้องทำ 4 · เกินกำหนด 1 · รอตรวจ 1', txt('workStatTodo') === '4' && txt('workStatLate') === '1' && txt('workStatWait') === '1', [txt('workStatTodo'), txt('workStatLate'), txt('workStatWait')].join('/'));
  ok('เห็นเฉพาะใบของตัวเอง: ไม่มีใบของ Nutty / Nui / Pran ในรายการ · ใบที่ Zen สั่งให้คนอื่น (d1) ไม่อยู่ในแท็บนี้', ['b1', 'b2', 'b3', 'c1', 'e1', 'd1'].every(id => !mineIds().includes(id)) && mineIds().length === 5, mineIds().join(','));
  ok('กลุ่มเรียง: ต้องทำก่อน → กำลังจะถึง → ส่งแล้ว รอตรวจ → เสร็จแล้ว 30 วัน', mineGroups().join('|') === 'ต้องทำก่อน|กำลังจะถึง|ส่งแล้ว รอตรวจ|เสร็จแล้ว 30 วันล่าสุด', mineGroups().join('|'));
  ok('ต้องทำก่อน = เกินกำหนด (a1) + ส่งกลับแก้ (a2) · กำลังจะถึง เรียงตามกำหนด: a4 (26 ชม.) ก่อน a3 (30 ชม.)', groupIds('ต้องทำก่อน').join() === 'a1,a2' && groupIds('กำลังจะถึง').join() === 'a4,a3', groupIds('ต้องทำก่อน').join() + ' / ' + groupIds('กำลังจะถึง').join());
  const a1 = cardOf('#workMineList', 'a1'), a2 = cardOf('#workMineList', 'a2'), a3 = cardOf('#workMineList', 'a3'), a4 = cardOf('#workMineList', 'a4');
  ok('a1: ป้าย "เกินกำหนด 2 ชม." + ขอบแดง · ป้ายขั้น "ขั้น 1 จาก 2 · ส่งไฟล์ให้ตรวจก่อน" · ช่อง Instagram = "ลงหลังไฟล์ผ่าน" (ยังไม่ถามลิงก์โซเชียล)', /เกินกำหนด 2 ชม/.test(a1.textContent) && a1.classList.contains('edge-red') && /ขั้น 1 จาก 2 · ส่งไฟล์ให้ตรวจก่อน/.test(a1.textContent) && /Instagram · ลงหลังไฟล์ผ่าน/.test(a1.textContent) && !/ยังไม่แนบลิงก์/.test(a1.textContent));
  ok('a2: "ส่งกลับแก้" + ขอบเหลือง + ความเห็นผู้ตรวจ + ชื่อผู้ตรวจ', /ส่งกลับแก้/.test(a2.textContent) && a2.classList.contains('edge-warn') && /เสียงเบาไป/.test(a2.textContent) && /Nui/.test(a2.querySelector('.wk-quote').textContent));
  ok('a3 (ผ่านขั้นไฟล์แล้ว): ป้าย "รอลงโซเชียล" (ไม่ใช่ "ยังไม่ส่ง") · "ขั้น 2 จาก 2" · ช่อง "ยังไม่แนบลิงก์โพสต์" ทั้ง 2 ช่อง · ข้อความตอนผ่าน "ไฟล์ผ่านแล้ว ลงโซเชียลได้เลย" + ชื่อผู้ตรวจ',
    !!a3.querySelector('.wk-soc') && /รอลงโซเชียล/.test(a3.textContent) && !/ยังไม่ส่ง/.test(a3.textContent) && /ขั้น 2 จาก 2/.test(a3.textContent) && (a3.textContent.match(/ยังไม่แนบลิงก์โพสต์/g) || []).length === 2 && /ไฟล์ผ่านแล้ว ลงโซเชียลได้เลย/.test(a3.querySelector('.wk-quote').textContent) && /Fah/.test(a3.querySelector('.wk-quote').textContent));
  ok('a4 (โพสต์โซเชียล ขั้นเดียว): "ขั้นเดียว · แนบลิงก์โพสต์ตอนส่ง" + "Facebook · ยังไม่แนบลิงก์"', /ขั้นเดียว · แนบลิงก์โพสต์ตอนส่ง/.test(a4.textContent) && /Facebook · ยังไม่แนบลิงก์/.test(a4.textContent));
  ok('สถานะเป็นคำเสมอ (ไม่ใช้สีอย่างเดียว): ทุกการ์ดมีป้ายข้อความ .st', [a1, a2, a3, a4].every(c => !!c.querySelector('.st') && c.querySelector('.st').textContent.trim().length > 1));
  if (${JSON.stringify(!!SHOTS)}) await shot('work-staff-mine.png');
  const doneBtn = document.querySelector('#workMineList [data-act="toggle-done"]');
  ok('"เสร็จแล้ว 30 วันล่าสุด" พับไว้ก่อน · กดแสดงแล้วเห็น a6 ขีดฆ่า', !!doneBtn && !mineIds().includes('a6'));
  doneBtn.click(); await frames();
  ok('กดแสดง: เห็น a6 (ผ่านแล้ว) — ขอบเขียว/ขีดฆ่า', mineIds().includes('a6') && cardOf('#workMineList', 'a6').classList.contains('done') && /ผ่านแล้ว/.test(cardOf('#workMineList', 'a6').textContent));
  tab('review'); await frames();
  ok('พนักงานเรียกแท็บ "ตรวจงาน" ตรง ๆ ไม่ได้: กลับมาที่งานของฉัน', $('workPaneMine').hidden === false && $('workPaneReview').hidden === true);

  // ── 2. ส่งงาน ─────────────────────────────────────────────────────────
  // ขั้น 1 (a1): ลิงก์ไฟล์/รูปเท่านั้น ไม่มีช่องลิงก์โซเชียล
  openMine('a1'); await sleep(150);
  ok('กดการ์ดงานของตัวเอง (ยังไม่ส่ง) → หน้าต่างส่งไฟล์ "ขั้น 1 จาก 2"', dlgOpen('workSubDialog') && txt('workSubTitle') === 'ส่งไฟล์ · ขั้น 1 จาก 2' && txt('workSubGo') === 'ส่งไฟล์ให้ตรวจ');
  ok('ขั้น 1: ไม่มีช่องลิงก์โซเชียลเลย (ตรงกับกฎ "ตรวจก่อนค่อยลง") · มีคำอธิบาย 2 รอบ · มีช่องลิงก์ไฟล์ + รูป', document.querySelectorAll('#workSubChans input').length === 0 && /ตรวจ 2 รอบ/.test(txt('workSubChans')) && /Instagram/.test(txt('workSubChans')) && vis($('workSubLink')) && !$('workSubFileField').hidden && !$('workSubImgField').hidden);
  ok('ขั้น 1: ส่งไม่ได้จนกว่าจะมีลิงก์ไฟล์หรือรูป — ปุ่มปิด + บอกว่าขาดอะไร', $('workSubGo').disabled && /ลิงก์ไฟล์หรือรูป/.test(txt('workSubNeed')) && /อย่างน้อย 1 อย่าง/.test(txt('workSubLinkHint')));
  ok('คำเตือนในหน้าต่างส่งงานเป็นสีแดงตัวหนา: "ส่งแล้วแก้เองไม่ได้" · "ส่งช้า" · "ยังไม่ต้องลง Instagram" · "แนบลิงก์หรือรูปอย่างน้อย 1 อย่าง" · "ยังส่งไม่ได้ — ขาด…"', redTexts($('workSubDialog')).some(t => t === 'ส่งแล้วแก้เองไม่ได้') && redTexts($('workSubDialog')).some(t => t === '"ส่งช้า"') && redTexts($('workSubChans')).some(t => /ยังไม่ต้องลง Instagram/.test(t)) && isRed($('workSubLinkHint')) && isRed($('workSubNeed')) && /ยังส่งไม่ได้/.test(txt('workSubNeed')), JSON.stringify(redTexts($('workSubDialog'))));
  setVal('workSubLink', 'http://drive.google.com/x');
  ok('ลิงก์ไม่ใช่ https ถูกปฏิเสธ: ปุ่มยังปิด · บอกให้แก้ลิงก์ไฟล์', $('workSubGo').disabled && /แก้ลิงก์ไฟล์/.test(txt('workSubNeed')));
  setVal('workSubLink', 'https://drive.google.com/file/d/1FLX4/view'); setVal('workSubNote', 'ไฟล์ตัดเสร็จแล้ว');
  ok('ลิงก์ Drive ถูกต้อง: ปุ่มเปิด · ไม่มีข้อความขาดอะไร', !$('workSubGo').disabled && txt('workSubNeed') === '');
  $('workSubGo').click(); await sleep(400);
  const s1 = lastRpc('work_submit');
  ok('ส่งไฟล์ขั้น 1: work_submit ได้ลิงก์ Drive ไม่มี channel · ไม่มีรูป · มีข้อความ', !!s1 && s1.args.p_task === 'a1' && s1.args.p_links.length === 1 && s1.args.p_links[0].url.indexOf('https://drive.google.com') === 0 && !('channel' in s1.args.p_links[0]) && s1.args.p_image_paths.length === 0 && s1.args.p_note === 'ไฟล์ตัดเสร็จแล้ว', JSON.stringify(s1 && s1.args));
  ok('ส่งสำเร็จ: หน้าต่างปิด · ข้อความ "ส่งไฟล์แล้ว" · ใบเป็น "รอตรวจ" ที่ฐาน (phase ยัง content) · ตัวเลขแดงเหลือ 3', !dlgOpen('workSubDialog') && /ส่งไฟล์แล้ว/.test(toast()) && taskOnServer('a1').status === 'submitted' && taskOnServer('a1').phase === 'content' && lastEv('a1', 'submitted').phase === 'content' && badge() === '3', badge());
  ok('a1 ย้ายไปกลุ่ม "ส่งแล้ว รอตรวจ" และสรุปรอตรวจ = 2', groupIds('ส่งแล้ว รอตรวจ').includes('a1') && txt('workStatWait') === '2' && txt('workStatTodo') === '3');
  // ขั้น 1 + ส่งกลับแก้ (a2): ความเห็นผู้ตรวจในหน้าต่าง · แนบรูป · อัป · ล้มแล้วเก็บกวาด
  openMine('a2'); await sleep(150);
  ok('a2 (ส่งกลับแก้ ขั้น 1): หน้าต่างแสดงความเห็นผู้ตรวจ · ยังไม่มีช่องลิงก์โซเชียล', dlgOpen('workSubDialog') && /เสียงเบาไป/.test(txt('workSubTask')) && document.querySelectorAll('#workSubChans input').length === 0);
  ok('ความเห็นผู้ตรวจที่ "ส่งกลับแก้" หัวข้อเป็นสีแดงตัวหนา (ต้องรีบแก้) · ข้อความ "ไฟล์ผ่านแล้ว" ไม่แดง', isRed(document.querySelector('#workSubTask .wk-quote.warn strong')) && !isRed(cardOf('#workMineList', 'a3') && cardOf('#workMineList', 'a3').querySelector('.wk-quote strong')));
  const f1 = await pngFile(1600, 900);
  await workSubPickFiles([f1]); await sleep(300);
  ok('เลือกรูป: ย่อรูปก่อน (webp/jpeg) · ขึ้นภาพตัวอย่าง 1 รูป · ปุ่มส่งเปิด (รูปเป็นหลักฐานขั้น 1)', workSub.imgs.length === 1 && /image\\/(webp|jpeg)/.test(workSub.imgs[0].blob.type) && document.querySelectorAll('#workSubImgs img').length === 1 && !$('workSubGo').disabled);
  WORK.fail.rpc_work_submit = 'ฐานข้อมูลล่ม';
  $('workSubGo').click(); await sleep(500);
  const up1 = WORK.uploads.filter(u => u.path);
  ok('ส่งไม่สำเร็จ: อัปรูปไปแล้ว 1 ไฟล์ (ชื่อ a2/<uuid> · upsert:false) แต่ฟังก์ชันล้ม → ลบรูปที่อัปทิ้ง ไม่ทิ้งรูปกำพร้า', up1.length === 1 && up1[0].path.indexOf('a2/') === 0 && up1[0].upsert === false && WORK.files.size === 0 && WORK.uploads.some(u => u.removed && u.removed[0] === up1[0].path));
  ok('ส่งไม่สำเร็จ: หน้าต่างยังเปิด + ข้อความผิดพลาดบอกตามจริง · ใบยัง "ส่งกลับแก้" ที่ฐาน', dlgOpen('workSubDialog') && /ส่งงานไม่สำเร็จ: ฐานข้อมูลล่ม/.test(txt('workSubErr')) && !$('workSubErr').hidden && taskOnServer('a2').status === 'changes');
  delete WORK.fail.rpc_work_submit;
  $('workSubGo').click(); await sleep(500);
  const s2 = lastRpc('work_submit');
  ok('กดส่งใหม่: อัปรูปใหม่ (ชื่อใหม่ ไม่ชนของเดิม) แล้วส่ง · p_image_paths ตรงกับไฟล์ที่อัป · ฐานเห็นไฟล์ 1', !!s2 && s2.args.p_task === 'a2' && s2.args.p_image_paths.length === 1 && s2.args.p_image_paths[0] === WORK.uploads.filter(u => u.path).pop().path && WORK.files.size === 1 && taskOnServer('a2').status === 'submitted');
  // ขั้น 2 (a3): ลิงก์ครบทุกช่อง + โดเมน
  openMine('a3'); await sleep(150);
  ok('a3 (รอลงโซเชียล): หน้าต่าง "ส่งลิงก์โพสต์ · ขั้น 2 จาก 2" · ปุ่ม "ส่งลิงก์ให้ตรวจ" · ช่องลิงก์ Facebook + Instagram · ซ่อนลิงก์ไฟล์/รูป (ขั้นนี้ส่งแค่ลิงก์โพสต์)',
    dlgOpen('workSubDialog') && txt('workSubTitle') === 'ส่งลิงก์โพสต์ · ขั้น 2 จาก 2' && txt('workSubGo') === 'ส่งลิงก์ให้ตรวจ' && !!$('workSubC-facebook') && !!$('workSubC-instagram') && $('workSubFileField').hidden && $('workSubImgField').hidden);
  ok('ขั้น 2: ส่งไม่ได้ — บอกว่าขาดลิงก์ทั้ง 2 ช่อง', $('workSubGo').disabled && /ลิงก์ Facebook/.test(txt('workSubNeed')) && /ลิงก์ Instagram/.test(txt('workSubNeed')));
  setVal('workSubC-facebook', 'https://www.facebook.com/PioneerDjLabSiam/posts/123'); setVal('workSubC-instagram', 'https://www.tiktok.com/@djlabsiam4/video/9');
  ok('ลิงก์ผิดโดเมน (ช่อง Instagram ใส่ tiktok.com): ✓ ที่ Facebook · ✕ ที่ Instagram บอกเหตุผล · ปุ่มยังปิด', /✓ ลิงก์ตรงกับ Facebook/.test(document.querySelector('[data-msg="facebook"]').textContent) && /✕ ลิงก์นี้ไม่ใช่ของ Instagram/.test(document.querySelector('[data-msg="instagram"]').textContent) && $('workSubGo').disabled && /แก้ลิงก์ Instagram/.test(txt('workSubNeed')));
  setVal('workSubC-instagram', 'https://user@www.instagram.com/reel/AbC/');
  ok('ลิงก์ที่มี @ ในโฮสต์ถูกปฏิเสธ (หลอกโดเมน)', $('workSubGo').disabled && /แก้ลิงก์ Instagram/.test(txt('workSubNeed')));
  setVal('workSubC-instagram', 'https://www.instagram.com/reel/AbC/');
  ok('ลิงก์ถูกทั้ง 2 ช่อง: ปุ่มเปิด', !$('workSubGo').disabled && txt('workSubNeed') === '');
  $('workSubGo').click(); await sleep(400);
  const s3 = lastRpc('work_submit');
  ok('ส่งลิงก์โพสต์: work_submit ได้ลิงก์พร้อม channel ครบ 2 ช่อง · ฐานเก็บเป็นรอตรวจ phase final', !!s3 && s3.args.p_task === 'a3' && s3.args.p_links.length === 2 && s3.args.p_links.some(l => l.channel === 'facebook') && s3.args.p_links.some(l => l.channel === 'instagram') && taskOnServer('a3').status === 'submitted' && lastEv('a3', 'submitted').phase === 'final' && /ส่งงานแล้ว/.test(toast()));
  // ขั้นเดียว (a4)
  openMine('a4'); await sleep(150);
  ok('a4 (โพสต์โซเชียล ขั้นเดียว): หน้าต่าง "ส่งงาน" · ต้องมีช่องลิงก์ Facebook · มีลิงก์ไฟล์+รูป (ไม่บังคับ) · ไม่มีกล่องอธิบาย 2 รอบ', dlgOpen('workSubDialog') && txt('workSubTitle') === 'ส่งงาน' && txt('workSubGo') === 'ส่งงานให้ตรวจ' && !!$('workSubC-facebook') && !$('workSubFileField').hidden && !/ตรวจ 2 รอบ/.test(txt('workSubChans')));
  ok('a4: ไม่แนบลิงก์ Facebook = ส่งไม่ได้ ถึงจะมีลิงก์ไฟล์', (setVal('workSubLink', 'https://drive.google.com/x'), $('workSubGo').disabled) && /ลิงก์ Facebook/.test(txt('workSubNeed')));
  ok('a4: ปุ่ม "ยื่นคำขอเกี่ยวกับงานนี้" อยู่ในหน้าต่างส่งงาน (พนักงานไม่ใช่เจ้าของ)', !$('workSubReq').hidden);
  $('workSubReq').click(); await sleep(150);
  ok('กดปุ่มยื่นคำขอจากหน้าต่างส่งงาน: เปิดหน้าต่างยื่นคำขอ แนบใบ a4 ให้แล้ว (หน้าต่างส่งงานไม่หาย)', dlgOpen('workReqDialog') && $('workrTask').value === 'a4' && dlgOpen('workSubDialog'));
  closeAll(); await sleep(100);
  ok('ปิดหน้าต่างแล้ว ฟอร์มส่งงานถูกล้าง (รูป/สถานะ)', workSub === null && workReq === null);
  // ใบที่ส่งแล้ว: อ่านอย่างเดียว
  document.querySelector('[data-act="open"][data-id="a5"]').click(); await sleep(150);
  ok('การ์ดที่ส่งแล้ว (a5): เปิดหน้าต่างรายละเอียดอ่านอย่างเดียว — ไม่มีปุ่มแก้/ยกเลิก/ปิดงาน/ตรวจ แต่มีปุ่ม "ยื่นคำขอเกี่ยวกับงานนี้"', dlgOpen('workDlg') && !dlgOpen('workSubDialog') && !$('workDlgBody').querySelector('[data-act="edit"],[data-act="cancel"],[data-act="close-task"],[data-act^="rv-"]') && !!$('workDlgBody').querySelector('[data-act="req-new"]'));
  closeAll();
  // งานที่ผ่านแล้วส่งซ้ำไม่ได้ (สถานะเปลี่ยนจากเครื่องอื่นหลังโหลด)
  WORK.tasks.find(t => t.id === 'a4').status = 'cancelled'; WORK.tasks.find(t => t.id === 'a4').closed_at = new Date().toISOString();
  await loadWork();
  workSubOpen('a4'); await sleep(100);
  ok('เปิดส่งงานของใบที่ถูกยกเลิกไปแล้ว (โหลดใหม่แล้วเห็นสถานะจริง): ไม่เปิดหน้าต่าง · บอกให้ทราบ', !dlgOpen('workSubDialog') && /ส่งงานนี้ไม่ได้แล้ว/.test(toast()));
  WORK.seed(); await loadWork();

  workFormOpen('a5'); await sleep(100);
  ok('พนักงานเรียกฟอร์มแก้ของใบที่คนอื่นสั่ง (a5) ตรง ๆ: ไม่เปิดฟอร์ม · บอกว่าแก้ไม่ได้', !dlgOpen('workFormDialog') && workForm === null && /แก้ใบงานนี้ไม่ได้/.test(toast()));
  // ── 3. พนักงานสั่ง/แก้งาน (ใบที่ตัวเองสั่ง) ─────────────────────────────────
  tab('assign'); await frames();
  ok('แท็บ "สั่งงาน" ของพนักงาน: หัว "งานที่ฉันสั่ง" · ไม่มีตารางภาพรวมทีม · มีคำอธิบายว่าสั่งได้เฉพาะพนักงานและให้ยื่นคำขอ', txt('workAssignHead') === 'งานที่ฉันสั่ง' && !$('workTeam').querySelector('table') && /พนักงานสั่งงานให้พนักงานด้วยกัน/.test(txt('workTeam')) && /คำขอ/.test(txt('workTeam')));
  const asgIds = () => [...document.querySelectorAll('#workAll tr.wk-row')].map(r => r.dataset.id);
  ok('เห็นเฉพาะใบที่ตัวเองสั่ง: d1 (สั่ง Nutty) ใบเดียว — ไม่เห็นใบอื่นของทีม', asgIds().join() === 'd1', asgIds().join());
  ok('ผู้สั่ง (พนักงาน) มีปุ่ม "แก้ไข" ที่ใบที่ตัวเองสั่ง', !!document.querySelector('#workAll tr[data-id="d1"] [data-act="edit"]'));
  $('workNew').click(); await sleep(150);
  const ppl = () => [...document.querySelectorAll('#workfPeople label')];
  const pplOn = () => ppl().filter(l => !l.classList.contains('off')).map(l => l.querySelector('span:nth-child(3)').textContent.replace(' · ตัวเอง', '')).join();
  const pplOff = () => ppl().filter(l => l.classList.contains('off')).map(l => l.querySelector('span:nth-child(3)').textContent).join();
  ok('พนักงานสั่งงาน: เลือกได้เฉพาะพนักงาน (Zen ตัวเอง · Nutty · Pran) — เจ้าของ/ผู้ดูแลเลือกไม่ได้ ขึ้น "สั่งไม่ได้" (ไม่แสดงคนที่ถูกปิดบัญชี)', dlgOpen('workFormDialog') && pplOn().split(',').sort().join() === 'Nutty,Pran,Zen' && pplOff().split(',').sort().join() === 'Fah,Nui,TiBass' && ppl().filter(l => l.classList.contains('off')).every(l => l.querySelector('input').disabled && /สั่งไม่ได้/.test(l.textContent)), pplOn() + ' / ' + pplOff());
  ok('ชื่อที่ "สั่งไม่ได้" ในรายชื่อผู้รับเป็นสีแดงตัวหนา · ข้อความ "ตรวจงานไม่ได้" ในกติกาเป็นสีแดงตัวหนา · "ยังไม่ได้เลือกผู้รับงาน" เป็นสีแดง', ppl().filter(l => l.classList.contains('off')).every(l => isRed(l.querySelector('.sub'))) && redTexts($('workfRule')).some(t => t === 'ตรวจงานไม่ได้') && isRed($('workfSum')));
  ok('มีข้อความกติกาของตำแหน่งพนักงาน (สั่งได้เฉพาะพนักงาน · ตรวจไม่ได้ · ให้ยื่นคำขอ)', /พนักงานสั่งงานให้พนักงานด้วยกันได้/.test(txt('workfRule')) && /ยื่น "คำขอ"/.test(txt('workfRule')));
  ok('ฟอร์มสั่งงาน: ยังไม่เลือกผู้รับ — บอกในกล่องสรุป', /ยังไม่ได้เลือกผู้รับงาน/.test(txt('workfSum')));
  document.querySelector('#workfKind button[data-kind="photo"]').click();
  document.querySelector('#workfChans button[data-ch="facebook"]').click();
  ok('รูป + ช่อง Facebook: บอกว่าตรวจ 2 รอบ (ส่งไฟล์ → รอลงโซเชียล → ลิงก์โพสต์)', /ตรวจ 2 รอบ/.test(txt('workfStage')) && /รอลงโซเชียล/.test(txt('workfStage')));
  document.querySelector('#workfKind button[data-kind="social_post"]').click();
  ok('โพสต์โซเชียล + ช่อง Facebook: บอกว่าขั้นเดียว (แนบลิงก์ตอนส่ง)', /ขั้นเดียว/.test(txt('workfStage')) && !/2 รอบ/.test(txt('workfStage')));
  document.querySelector('#workfKind button[data-kind="photo"]').click();
  $('workfSave').click(); await sleep(100);
  ok('ไม่ใส่หัวข้อ: ไม่ส่ง บอกให้ใส่', /ใส่หัวข้องาน/.test(txt('workfErr')) && !$('workfErr').hidden && rpcs('work_create').length === 0);
  setVal('workfTitle', 'ถ่ายรูปสินค้าใหม่ลงเพจ');
  $('workfSave').click(); await sleep(100);
  ok('ไม่เลือกผู้รับ: ไม่ส่ง บอกให้เลือก', /เลือกผู้รับงานอย่างน้อย 1 คน/.test(txt('workfErr')) && rpcs('work_create').length === 0);
  const pick = name => { const l = ppl().find(x => x.textContent.indexOf(name) >= 0); l.querySelector('input').click(); };
  pick('Nui');
  ok('คลิกชื่อที่ "สั่งไม่ได้" (Nui) ไม่ติ๊ก — ยังไม่มีผู้รับ', document.querySelectorAll('#workfPeople input:checked').length === 0);
  pick('Nutty'); pick('Pran');
  ok('เลือก 2 คน: กล่องสรุป "ระบบจะสร้างใบงาน 2 ใบ" · ปุ่ม "สั่งงาน 2 ใบ"', /ระบบจะสร้างใบงาน 2 ใบ/.test(txt('workfSum')) && txt('workfSave') === 'สั่งงาน 2 ใบ');
  setVal('workfDate', '2030-01-15'); setVal('workfTime', '09:30'); setVal('workfDetail', 'ถ่ายหน้ากล่อง 4 มุม');
  $('workfSave').click(); await sleep(450);
  const c1 = lastRpc('work_create');
  ok('สั่งงาน: work_create ส่งผู้รับ 2 คน · ประเภทรูป · ช่อง facebook · กำหนดเวลาไทย (+07:00)', !!c1 && c1.args.p_assignees.join() === 'u3,u6' && c1.args.p_kind === 'photo' && c1.args.p_channels.join() === 'facebook' && c1.args.p_due_at === '2030-01-15T09:30:00+07:00' && c1.args.p_title === 'ถ่ายรูปสินค้าใหม่ลงเพจ', JSON.stringify(c1 && c1.args));
  ok('สั่งสำเร็จ: ฟอร์มปิด · ข้อความ "สั่งงานแล้ว 2 ใบ" · ฐานสร้าง 2 ใบ phase content (รูป+ช่องทาง) โดยผู้สั่ง = Zen', !dlgOpen('workFormDialog') && /สั่งงานแล้ว 2 ใบ/.test(toast()) && WORK.tasks.filter(t => t.title === 'ถ่ายรูปสินค้าใหม่ลงเพจ').length === 2 && WORK.tasks.filter(t => t.title === 'ถ่ายรูปสินค้าใหม่ลงเพจ').every(t => t.phase === 'content' && t.created_by === 'u2'));
  ok('ผู้สั่งเห็นใบที่ตัวเองเพิ่งสั่ง (ผู้รับเป็น Nutty/Pran) ในแท็บสั่งงาน → ตอนนี้ 3 ใบ', asgIds().length === 3 && asgIds().includes('d1'), asgIds().join());
  // แก้/ย้ายใบที่ตัวเองสั่ง
  document.querySelector('#workAll tr[data-id="d1"] [data-act="edit"]').click(); await sleep(150);
  const sel = () => $('workfAssignee');
  ok('แก้ใบ d1: ฟอร์ม "แก้ใบงาน" · ช่องเหตุผลโผล่ · ผู้รับให้เลือกได้เฉพาะ Nutty (ปัจจุบัน) · Pran · Zen — ไม่มีผู้ดูแล/เจ้าของ', dlgOpen('workFormDialog') && txt('workfHead') === 'แก้ใบงาน' && !$('workfReasonField').hidden && !!sel() && [...sel().options].map(o => o.textContent.split(' · ')[0]).sort().join() === 'Nutty,Pran,Zen' && sel().value === 'u3');
  setVal('workfTitle', 'ช่วยเก็บกล่องที่หลังร้าน (แก้ชื่อ)'); sel().value = 'u6'; setVal('workfReason', 'Nutty ติดงานอื่น');
  $('workfSave').click(); await sleep(450);
  const e1 = lastRpc('work_edit'), r1 = lastRpc('work_reassign');
  ok('แก้ชื่อ + ย้ายผู้รับ: เรียก work_edit (ชื่อใหม่ + เหตุผล) แล้ว work_reassign (ไป Pran + เหตุผล) ตามลำดับ', !!e1 && e1.args.p_title.indexOf('แก้ชื่อ') > 0 && e1.args.p_note === 'Nutty ติดงานอื่น' && !!r1 && r1.args.p_assignee === 'u6' && r1.args.p_note === 'Nutty ติดงานอื่น' && CALLS.indexOf(e1) < CALLS.indexOf(r1));
  ok('ฐานเก็บการแก้/ย้ายแล้ว · ฟอร์มปิด · ข้อความ "บันทึกการแก้ไขแล้ว"', taskOnServer('d1').assignee_id === 'u6' && /แก้ชื่อ/.test(taskOnServer('d1').title) && !dlgOpen('workFormDialog') && /บันทึกการแก้ไขแล้ว/.test(toast()) && lastEv('d1', 'reassigned') && lastEv('d1', 'edited'));
  document.querySelector('#workAll tr[data-id="d1"]').click(); await sleep(150);
  ok('กดแถวใบที่ตัวเองสั่ง: หน้าต่างรายละเอียดมีปุ่ม แก้ไข/ย้ายผู้รับ + ยกเลิกงาน + ยื่นคำขอ (ผู้สั่งจัดการใบตัวเองได้) แต่ไม่มีปุ่มปิดงาน/ตรวจ', dlgOpen('workDlg') && !!$('workDlgBody').querySelector('[data-act="edit"]') && !!$('workDlgBody').querySelector('[data-act="cancel"]') && !!$('workDlgBody').querySelector('[data-act="req-new"]') && !$('workDlgBody').querySelector('[data-act="close-task"],[data-act^="rv-"]'));
  $('workDlgBody').querySelector('[data-act="cancel"]').click(); await sleep(150);
  ok('ยกเลิกงาน: ถามยืนยันก่อน (บอกชื่องาน + ผู้รับ)', dlgOpen('confirmDialog') && /ยกเลิกงานนี้/.test(txt('confirmTitle')) && /Pran/.test(txt('confirmBody')));
  $('confirmOkBtn').click(); await sleep(400);
  ok('ยืนยัน: work_cancel · ฐานเป็น cancelled · ข้อความ "ยกเลิกงานแล้ว"', !!lastRpc('work_cancel') && lastRpc('work_cancel').args.p_task === 'd1' && taskOnServer('d1').status === 'cancelled' && /ยกเลิกงานแล้ว/.test(toast()) && !dlgOpen('confirmDialog'));
  tab('assign'); await frames();
  const filterChipTxt = f => document.querySelector('#workFilter [data-f="' + f + '"]').textContent;
  ok('ใบที่ยกเลิกแล้ว (d1): หายจากรายการ "ทั้งหมด" (เจ้าของสั่ง 5 ต.ค. 69 "ลบออกจากลิส") · ชิป "ทั้งหมด" ไม่นับใบที่ยกเลิก · ชิป "ยกเลิก" นับ 1', !document.querySelector('#workAll tr[data-id="d1"]') && filterChipTxt('all') === 'ทั้งหมด ' + asgIds().length && filterChipTxt('cancelled') === 'ยกเลิก 1', filterChipTxt('all') + ' | ' + filterChipTxt('cancelled'));
  document.querySelector('#workFilter [data-f="cancelled"]').click(); await frames();
  ok('กดชิป "ยกเลิก": ยังเห็นใบที่ยกเลิก (d1) — ข้อมูลไม่ได้ถูกลบ · แถวขึ้น "ยกเลิกแล้ว" และไม่มีปุ่ม "แก้ไข" (ผู้สั่งก็แก้ใบที่ปิดแล้วไม่ได้)', !!document.querySelector('#workAll tr[data-id="d1"]') && /ยกเลิกแล้ว/.test(document.querySelector('#workAll tr[data-id="d1"]').textContent) && !document.querySelector('#workAll tr[data-id="d1"] [data-act="edit"]'));
  document.querySelector('#workFilter [data-f="all"]').click(); await frames();
  // ใบของคนอื่น: ไม่มีปุ่มจัดการ
  tab('mine'); await frames(); document.querySelector('[data-act="open"][data-id="a5"]').click(); await sleep(150);
  ok('ใบที่คนอื่นสั่ง (a5 สั่งโดย Nui): พนักงานผู้รับแก้/ยกเลิกไม่ได้ — ไม่มีปุ่มจัดการ', !$('workDlgBody').querySelector('[data-act="edit"],[data-act="cancel"]'));
  closeAll();
  WORK.seed(); await loadWork();

  // ── 4. คำขอ (ผู้ยื่น = พนักงาน Zen) ────────────────────────────────────────
  tab('req'); await frames();
  const reqRows = () => [...document.querySelectorAll('#workReqList .wk-task')].map(e => e.dataset.id);
  const reqRow = id => cardOf('#workReqList', id);
  ok('แท็บคำขอของพนักงาน: ไม่มีตัวสลับกล่อง (ยื่นได้อย่างเดียว) · ปุ่ม "ยื่นคำขอใหม่" มี · เลขที่แท็บว่าง (ไม่มีคำขอถึงพนักงาน)', $('workReqBoxes').innerHTML === '' && !$('workReqNew').hidden && txt('workReqN') === '');
  ok('เห็นเฉพาะคำขอของตัวเอง: q1 (รอตอบ) · q3 (ปฏิเสธ) · q6 (อนุมัติ) — ไม่เห็น q2 ของ Nutty / q4 ของ Nui / q5 ของ Pran', reqRows().sort().join() === 'q1,q3,q6', reqRows().join());
  ok('รอตอบขึ้นก่อน · เลือกใบแรกให้อัตโนมัติ (q1) · ป้ายสถานะเป็นคำ: รอตอบ / ปฏิเสธ / อนุมัติแล้ว', reqRows()[0] === 'q1' && /รอตอบ/.test(reqRow('q1').textContent) && /ปฏิเสธ/.test(reqRow('q3').textContent) && /อนุมัติแล้ว/.test(reqRow('q6').textContent) && reqRow('q1').classList.contains('sel'));
  ok('รายละเอียด q1: ข้อความ · ใบงานที่แนบ (a1) + ปุ่มเปิดใบงาน · ส่งถึง "ผู้ดูแลทุกคน" บอกว่าใครตอบก่อนเป็นคนตัดสิน · ปุ่มถอนคำขอ · ไม่มีปุ่มอนุมัติ/ปฏิเสธ', /ช่วยย้ายงานถ่ายรูป DDJ-FLX4/.test(txt('workReqDetail')) && /ถ่ายรูปสินค้า DDJ-FLX4 ลง Instagram/.test(txt('workReqDetail')) && !!$('workReqDetail').querySelector('[data-act="open-task"]') && /ผู้ดูแลทุกคน · ใครในกลุ่มตอบก่อนเป็นคนตัดสิน/.test(txt('workReqDetail')) && !!$('workReqDetail').querySelector('[data-act="req-withdraw"]') && !$('workReqDetail').querySelector('[data-act="req-approve"],[data-act="req-reject"]'));
  reqRow('q3').click(); await frames();
  ok('คำขอที่ถูกปฏิเสธ (q3): ผู้ยื่นเห็นเหตุผล + ชื่อผู้ตอบ · ไม่มีปุ่มถอน', /เหตุผลที่ปฏิเสธ/.test(txt('workReqDetail')) && /ศุกร์มีคอร์สสองคลาส/.test(txt('workReqDetail')) && /Nui/.test($('workReqDetail').querySelector('.wk-ans').textContent) && !!$('workReqDetail').querySelector('.wk-ans.bad') && !$('workReqDetail').querySelector('[data-act="req-withdraw"]'));
  ok('กล่อง "เหตุผลที่ปฏิเสธ" ตัวหนังสือเป็นสีแดง (ผู้ยื่นต้องเห็นชัด)', getComputedStyle($('workReqDetail').querySelector('.wk-ans.bad')).color === 'rgb(204, 0, 26)' && isRed($('workReqDetail').querySelector('.wk-ans.bad strong')));
  reqRow('q6').click(); await frames();
  ok('คำขอที่อนุมัติ (q6): "อนุมัติแล้ว — รับเรื่อง" + ความเห็น + ชื่อผู้ตอบ (Fah — คนในกลุ่มที่ตอบก่อน)', /อนุมัติแล้ว — รับเรื่อง/.test(txt('workReqDetail')) && /เดี๋ยวเข้าไปดูให้ที่ใบงาน/.test(txt('workReqDetail')) && /Fah/.test($('workReqDetail').querySelector('.wk-ans').textContent) && !!$('workReqDetail').querySelector('.wk-ans.ok'));
  if (${JSON.stringify(!!SHOTS)}) await shot('work-staff-requests.png');
  // ยื่นคำขอใหม่
  $('workReqNew').click(); await sleep(150);
  const grpChips = () => [...document.querySelectorAll('#workrGroups button')].map(b => b.dataset.label || b.textContent).join();
  ok('ยื่นคำขอ (พนักงาน): โหมด "ทั้งกลุ่ม" ก่อน · ตัวเลือกกลุ่ม = ผู้ดูแลทุกคน + เจ้าของ · ช่องเลือกใบงานมีใบของตัวเอง + "ไม่แนบใบงาน" · ปุ่มส่งยังปิด (ไม่มีข้อความ)', dlgOpen('workReqDialog') && grpChips() === 'ผู้ดูแลทุกคน,เจ้าของ' && $('workrGroupField').hidden === false && $('workrUserField').hidden === true && $('workrGo').disabled && $('workrTask').options[0].textContent === 'ไม่แนบใบงาน' && [...$('workrTask').options].some(o => o.value === 'a1') && ![...$('workrTask').options].some(o => ['b1', 'c1', 'e1'].includes(o.value)));
  ok('โหมด "เลือกเป็นคน": รายชื่อ = ผู้ดูแลและเจ้าของที่ใช้งานอยู่ (Nui · Fah · TiBass) — ไม่มีพนักงาน/ตัวเอง/คนที่ถูกปิด', (document.querySelector('#workrMode button[data-mode="user"]').click(), [...$('workrUser').options].map(o => o.textContent.split(' · ')[0]).sort().join() === 'Fah,Nui,TiBass' && $('workrUserField').hidden === false && $('workrGroupField').hidden === true));
  document.querySelector('#workrMode button[data-mode="group"]').click();
  document.querySelector('#workrGroups button[data-group="admin"]').click();
  ok('ปุ่มกลุ่มผู้รับ: เลือกแล้วมี ✓ นำหน้า (ผู้ดูแลทุกคน) · ปุ่มที่ไม่เลือกไม่มี', document.querySelector('#workrGroups button[data-group="admin"]').textContent === '✓ ผู้ดูแลทุกคน' && document.querySelector('#workrGroups button[data-group="owner"]').textContent === 'เจ้าของ');
  setVal('workrBody', '   ');
  ok('ข้อความเป็นช่องว่าง: ปุ่มส่งยังปิด', $('workrGo').disabled);
  setVal('workrBody', '   ช่วยเลื่อนกำหนดงานคลิปรีวิวไปพรุ่งนี้ได้มั้ยครับ   '); setVal('workrTask', 'a2');
  ok('มีข้อความ: ปุ่มเปิด · ข้อความปุ่ม "ส่งคำขอถึง ผู้ดูแลทุกคน" · ตัวนับ', !$('workrGo').disabled && txt('workrGo') === 'ส่งคำขอถึง ผู้ดูแลทุกคน' && /\\d+ \\/ 1000/.test(txt('workrCount')));
  $('workrGo').click(); await sleep(450);
  const rc1 = lastRpc('work_request_create');
  ok('ส่งคำขอ: work_request_create ส่ง ถึงกลุ่ม admin (ไม่ส่ง p_to_user) · แนบใบ a2 · ข้อความตัดช่องว่างหัวท้าย', !!rc1 && rc1.args.p_to_group === 'admin' && rc1.args.p_to_user === null && rc1.args.p_task === 'a2' && rc1.args.p_body === 'ช่วยเลื่อนกำหนดงานคลิปรีวิวไปพรุ่งนี้ได้มั้ยครับ', JSON.stringify(rc1 && rc1.args));
  ok('สำเร็จ: หน้าต่างปิด · ข้อความ "ส่งคำขอแล้ว" · คำขอใหม่อยู่ในรายการ "รอตอบ" · ฐานเก็บ requester = Zen', !dlgOpen('workReqDialog') && /ส่งคำขอแล้ว/.test(toast()) && reqRows().length === 4 && WORK.reqs.filter(r => r.requester_id === 'u2' && r.to_group === 'admin' && r.task_id === 'a2').length === 1);
  // ยื่นเป็นรายคน
  $('workReqNew').click(); await sleep(100);
  document.querySelector('#workrMode button[data-mode="user"]').click(); setVal('workrUser', 'u1'); setVal('workrBody', 'ขออนุมัติซื้อกล่องใส่หูฟังเพิ่ม');
  ok('เลือกเป็นคน (TiBass): ข้อความปุ่ม "ส่งคำขอถึง TiBass"', txt('workrGo') === 'ส่งคำขอถึง TiBass' && !$('workrGo').disabled);
  $('workrGo').click(); await sleep(400);
  const rc2 = lastRpc('work_request_create');
  ok('ยื่นเป็นรายคน: p_to_user = เจ้าของ · p_to_group ว่าง · ไม่แนบใบงาน (p_task = null)', rc2.args.p_to_user === 'u1' && rc2.args.p_to_group === null && rc2.args.p_task === null);
  // ล้มที่ฐาน
  $('workReqNew').click(); await sleep(100);
  setVal('workrBody', 'ทดสอบข้อความล้ม'); WORK.fail.rpc_work_request_create = 'ฐานข้อมูลล่ม';
  $('workrGo').click(); await sleep(350);
  ok('ส่งคำขอไม่สำเร็จ: หน้าต่างยังเปิด · ข้อความที่พิมพ์ไม่หาย · บอกผิดพลาดตามจริง · ปุ่มกลับมากดได้', dlgOpen('workReqDialog') && $('workrBody').value === 'ทดสอบข้อความล้ม' && /ส่งคำขอไม่สำเร็จ: ฐานข้อมูลล่ม/.test(txt('workrErr')) && !$('workrErr').hidden && !$('workrGo').disabled);
  delete WORK.fail.rpc_work_request_create; closeAll(); await sleep(100);
  ok('ปิดหน้าต่างคำขอ: สถานะฟอร์มถูกล้าง', workReq === null);
  // ถอนคำขอ
  reqRow('q1').click(); await frames();
  $('workReqDetail').querySelector('[data-act="req-withdraw"]').click(); await sleep(150);
  ok('ถอนคำขอ: ถามยืนยันก่อน (บอกผู้รับ + ข้อความคำขอ)', dlgOpen('confirmDialog') && /ถอนคำขอนี้/.test(txt('confirmTitle')) && /ผู้ดูแลทุกคน/.test(txt('confirmBody')) && /ช่วยย้ายงานถ่ายรูป/.test(txt('confirmBody')));
  $('confirmOkBtn').click(); await sleep(400);
  ok('ยืนยัน: work_request_withdraw · ฐาน = withdrawn · ในรายการขึ้น "ถอนแล้ว" · ไม่มีปุ่มถอนอีก', lastRpc('work_request_withdraw').args.p_request === 'q1' && reqOnServer('q1').status === 'withdrawn' && /ถอนแล้ว/.test(reqRow('q1').textContent) && /ถอนคำขอแล้ว/.test(toast()));
  // ปุ่มจากใบงาน
  tab('mine'); await frames(); document.querySelector('[data-act="open"][data-id="a5"]').click(); await sleep(120);
  $('workDlgBody').querySelector('[data-act="req-new"]').click(); await sleep(150);
  ok('ปุ่ม "ยื่นคำขอเกี่ยวกับงานนี้" บนใบงาน: เปิดหน้าต่างคำขอ แนบใบนั้นให้ (a5)', dlgOpen('workReqDialog') && $('workrTask').value === 'a5');
  closeAll(); await sleep(100);
  // สิทธิ์ฝั่งหน้าจอ: ใบที่ Zen ไม่ใช่ผู้รับ/ผู้สั่ง ไม่อยู่ในตัวเลือกแนบ — และเรียกฟังก์ชันตรงด้วยใบนั้นก็ถูกฐานปฏิเสธ
  const bad = await db.rpc('work_request_create', { p_to_user: null, p_to_group: 'admin', p_task: 'e1', p_body: 'ลองแนบใบของ Pran' });
  ok('ฐานปฏิเสธการแนบใบที่ไม่ใช่ของตัวเอง (กันคนข้ามหน้าจอ)', !!bad.error && /แนบใบงานนี้ไม่ได้/.test(bad.error.message));
  const bad2 = await db.rpc('work_request_decide', { p_request: 'q2', p_verdict: 'approve', p_note: null });
  ok('พนักงานตัดสินคำขอไม่ได้ (ฐานปฏิเสธ แม้หน้าจอไม่มีปุ่ม)', !!bad2.error && /ตัดสินคำขอได้เฉพาะ/.test(bad2.error.message));
  WORK.seed(); await loadWork();

  // ── 5. พนักงานคนอื่น: เห็นเฉพาะที่เกี่ยวกับตัวเอง ───────────────────────────
  doLogout(); await sleep(400);
  await login('pran'); showSection('tasks'); await sleep(300);
  ok('Pran (พนักงาน): เห็นเฉพาะใบของตัวเอง (e1) · ชื่องานของคนอื่นไม่โผล่ที่ไหนในหน้า', mineIds().join() === 'e1' && !/DDJ-FLX4|HDJ-CUE1|Starter Pack|หลังร้าน|สายแจ็ค/.test($('sec-tasks').textContent));
  tab('req'); await frames();
  ok('Pran เห็นเฉพาะคำขอของตัวเอง (q5) — ไม่เห็นคำขอที่ถึงผู้ดูแลหรือของคนอื่น', reqRows().join() === 'q5', reqRows().join());
  doLogout(); await sleep(400);
  await login('nutty'); showSection('tasks'); await sleep(300);
  ok('Nutty (พนักงาน): เห็นใบที่ Zen สั่ง (d1) ในงานของฉัน พร้อมชื่อผู้สั่ง · เห็น b1 b2 b3 ของตัวเอง', mineIds().includes('d1') && /สั่งโดย Zen/.test(cardOf('#workMineList', 'd1').textContent) && ['b1', 'b2', 'b3'].every(id => mineIds().includes(id)) && !mineIds().includes('a1'));
  doLogout(); await sleep(400);

  // ── 6. ผู้ดูแล (Nui) ─────────────────────────────────────────────────────
  WORK.seed();
  await login('nui');
  ok('ผู้ดูแล: ตัวเลขแดง = งานที่ตรวจได้ 3 (a5 b1 b2 — ไม่นับ c1 ที่เป็นงานของผู้ดูแล) + คำขอ pending ที่ถึงตัวเอง 2 (q1 กลุ่มผู้ดูแล · q2 ถึงเฉพาะตัวเอง) = 5', badge() === '5', badge());
  showSection('tasks'); await sleep(300); await frames();
  ok('ผู้ดูแลเห็นแท็บ งานของฉัน · ตรวจงาน · สั่งงาน · คำขอ ครบ · เลขที่แท็บตรวจงาน 3 · เลขที่แท็บคำขอ 2', tabsShown() === 'mine,review,assign,req' && txt('workReviewN') === '3' && txt('workReqN') === '2', tabsShown() + ' ' + txt('workReviewN') + ' ' + txt('workReqN'));
  tab('review'); await frames();
  const queue = () => [...document.querySelectorAll('#workQueue .wk-task')].map(e => e.dataset.id);
  ok('คิวรอตรวจของผู้ดูแล: เฉพาะงานของพนักงาน เรียงเก่าสุดก่อน (a5 → b1 → b2) — ไม่มี c1 (งานของผู้ดูแล เจ้าของตรวจ)', queue().join() === 'a5,b1,b2', queue().join());
  ok('สรุปรอตรวจ = 3 · เลือกใบแรกให้อัตโนมัติ (a5) · รายละเอียดมีปุ่มส่งกลับแก้ + "ผ่าน · ปิดงาน" (งานขั้นเดียว)', txt('workRvWait') === '3' && cardOf('#workQueue', 'a5').classList.contains('sel') && !!$('workDetail').querySelector('[data-act="rv-changes"]') && $('workDetail').querySelector('[data-act="rv-approve"]').textContent === 'ผ่าน · ปิดงาน');
  ok('ช่องความเห็นของผู้ตรวจ: คำว่า "บังคับ" (เมื่อกดส่งกลับแก้) เป็นสีแดงตัวหนา', redTexts($('workDetail')).some(t => t === 'บังคับ'));
  cardOf('#workQueue', 'b2').click(); await frames();
  ok('เลือก b2 (รูป + Facebook ขั้น 1): ป้าย "ขั้น 1 จาก 2" · ปุ่มผ่านเขียนว่า "ผ่านขั้นไฟล์ · ให้ลงโซเชียล" (ไม่ใช่ปิดงาน) · เห็นลิงก์ Drive ที่แนบ + ปุ่มเปิดในแท็บใหม่ (target=_blank rel=noopener)', /ขั้น 1 จาก 2/.test($('workDetail').textContent) && $('workDetail').querySelector('[data-act="rv-approve"]').textContent === 'ผ่านขั้นไฟล์ · ให้ลงโซเชียล' && /drive.google.com\\/file\\/d\\/1HDJX7/.test(txt('workDetail')) && $('workDetail').querySelector('a[target="_blank"]').rel === 'noopener noreferrer');
  if (${JSON.stringify(!!SHOTS)}) await shot('work-admin-review.png');
  // ส่งกลับแก้ต้องมีความเห็น
  $('workDetail').querySelector('[data-act="rv-changes"]').click(); await sleep(100);
  ok('ส่งกลับแก้โดยไม่มีความเห็น: ไม่ส่งไปฐาน · บอกให้ใส่ความเห็น', rpcs('work_review').length === 0 && /ต้องใส่ความเห็น/.test(txt('workRvErr')) && !$('workRvErr').hidden);
  $('workRvNote').value = 'ภาพมืดไป ถ่ายใหม่ตอนแสงเยอะ'; $('workDetail').querySelector('[data-act="rv-changes"]').click(); await sleep(400);
  const rv1 = lastRpc('work_review');
  ok('ส่งกลับแก้พร้อมความเห็น: work_review changes + ความเห็น · ฐาน = changes · เหตุการณ์เก็บขั้น content · ข้อความ "ส่งกลับแก้แล้ว" · ออกจากคิว', !!rv1 && rv1.args.p_task === 'b2' && rv1.args.p_verdict === 'changes' && rv1.args.p_note === 'ภาพมืดไป ถ่ายใหม่ตอนแสงเยอะ' && taskOnServer('b2').status === 'changes' && lastEv('b2', 'changes_requested').phase === 'content' && /ส่งกลับแก้แล้ว/.test(toast()) && queue().join() === 'a5,b1');
  // ผ่านขั้นไฟล์ — b1 เป็นขั้นเดียว ผ่าน = ปิดงาน · จำลอง b2 กลับมาส่งใหม่แล้วผ่านขั้นไฟล์
  WORK.rpc.work_submit('u3', { p_task: 'b2', p_note: 'แก้แล้ว', p_links: [{ url: 'https://drive.google.com/file/d/2' }], p_image_paths: [] });
  await loadWork(); cardOf('#workQueue', 'b2').click(); await frames();
  ok('b2 ส่งใหม่เข้าคิวอีกครั้ง (ครั้งที่ 2) — ประวัติเห็นการส่งกลับแก้ก่อนหน้า', queue().includes('b2') && /ครั้งที่ 2/.test(cardOf('#workQueue', 'b2').textContent) && /ส่งกลับแก้ · ขั้นไฟล์/.test(txt('workDetail')));
  $('workRvNote').value = 'ไฟล์ผ่านแล้ว ลงเพจได้เลย'; $('workDetail').querySelector('[data-act="rv-approve"]').click(); await sleep(400);
  const rv2 = lastRpc('work_review');
  ok('ผ่านขั้นไฟล์: ฐาน = รอลงโซเชียล (open + phase final + เหตุการณ์ content_approved) ไม่ใช่ปิดงาน · ข้อความ "ไฟล์ผ่านแล้ว — รอพนักงานลงโซเชียล" · ออกจากคิว', rv2.args.p_verdict === 'approve' && taskOnServer('b2').status === 'open' && taskOnServer('b2').phase === 'final' && !!lastEv('b2', 'content_approved') && !lastEv('b2', 'approved') && /ไฟล์ผ่านแล้ว — รอพนักงานลงโซเชียล/.test(toast()) && !queue().includes('b2'));
  cardOf('#workQueue', 'a5').click(); await frames();
  $('workDetail').querySelector('[data-act="rv-approve"]').click(); await sleep(400);
  ok('ผ่านงานขั้นเดียว (a5): ฐาน = ผ่านแล้ว ปิดงาน มี closed_at · ข้อความ "ตรวจผ่านแล้ว — ปิดงาน"', taskOnServer('a5').status === 'approved' && !!taskOnServer('a5').closed_at && /ตรวจผ่านแล้ว — ปิดงาน/.test(toast()) && queue().join() === 'b1');
  // ฐานล้ม / มีคนตรวจก่อน
  WORK.tasks.find(t => t.id === 'b1').status = 'approved';       // อีกเครื่องตรวจไปแล้ว (หน้านี้ยังเห็นเป็นรอตรวจ)
  $('workDetail').querySelector('[data-act="rv-approve"]').click(); await sleep(450);
  ok('มีคนตรวจก่อน (สถานะเปลี่ยน): ฐานปฏิเสธ → หน้าโหลดใหม่ ใบออกจากคิว · บอกข้อผิดพลาดตามจริงที่ข้อความเด้ง (ช่องในแผงหายไปพร้อมใบ)', /ตรวจงานไม่สำเร็จ: ตรวจได้เฉพาะงานที่ส่งแล้ว/.test(toast()) && queue().length === 0, toast() + ' / ' + queue().join());
  WORK.seed(); await loadWork();
  // c1 (งานของผู้ดูแล) ผู้ดูแลตรวจไม่ได้: เปิดจากแท็บสั่งงานแล้วไม่มีปุ่มตรวจ/ปิดงาน
  tab('assign'); await frames();
  const team = () => [...document.querySelectorAll('#workTeam tbody tr td:first-child')].map(e => e.textContent).sort().join();
  ok('แท็บสั่งงานของผู้ดูแล: หัว "ภาพรวมทีม" · ตารางทีม = ผู้ใช้งานอยู่ 6 คน (ไม่มี Ghost ที่ถูกปิด) · เห็นใบทั้งทีม', txt('workAssignHead') === 'ภาพรวมทีม' && team() === 'Fah,Nui,Nutty,Pran,TiBass,Zen' && [...document.querySelectorAll('#workAll tr.wk-row')].length >= 12, team());
  document.querySelector('#workAll tr[data-id="c1"]').click(); await sleep(150);
  ok('c1 (ผู้รับเป็นผู้ดูแล เจ้าของสั่ง): ผู้ดูแลเห็นรายละเอียดได้ แต่ไม่มีปุ่มแก้/ยกเลิก/ปิดงาน/ตรวจ — มีแต่ยื่นคำขอ', dlgOpen('workDlg') && !$('workDlgBody').querySelector('[data-act="edit"],[data-act="cancel"],[data-act="close-task"],[data-act^="rv-"]') && !!$('workDlgBody').querySelector('[data-act="req-new"]') && !document.querySelector('#workAll tr[data-id="c1"] [data-act="edit"]'));
  closeAll();
  ok('ผู้ดูแลมีปุ่ม "แก้ไข" ที่ใบของพนักงาน (a1 สั่งโดย Nui · b3 สั่งโดยพนักงานเอง) แต่ไม่มีที่ c1 (ผู้รับเป็นผู้ดูแล)', !!document.querySelector('#workAll tr[data-id="b3"] [data-act="edit"]') && !!document.querySelector('#workAll tr[data-id="a1"] [data-act="edit"]') && !document.querySelector('#workAll tr[data-id="c1"] [data-act="edit"]'));
  $('workNew').click(); await sleep(150);
  ok('ผู้ดูแลสั่งงาน: เลือกได้ผู้ดูแล + พนักงาน (รวมตัวเอง) — เจ้าของ "สั่งไม่ได้"', pplOn().split(',').sort().join() === 'Fah,Nui,Nutty,Pran,Zen' && pplOff() === 'TiBass' && /ผู้ดูแลสั่งงานให้ผู้ดูแลและพนักงานได้/.test(txt('workfRule')), pplOn() + ' / ' + pplOff());
  closeAll();
  // กล่องคำขอ
  tab('req'); await frames();
  const boxBtns = () => [...document.querySelectorAll('#workReqBoxes button')].map(b => b.textContent.replace(/\\s+/g, ' ').trim()).join('|');
  ok('กล่องคำขอของผู้ดูแล: สลับได้ "ส่งถึงฉัน 2" / "ที่ฉันยื่น" · เริ่มที่ส่งถึงฉัน · ปุ่มยื่นคำขอใหม่มี', /ส่งถึงฉัน 2\\|ที่ฉันยื่น/.test(boxBtns()) && work.reqBox === 'in' && !$('workReqNew').hidden, boxBtns());
  ok('ส่งถึงฉัน = q1 q2 (รอตอบ เก่าสุดก่อน) + q3 q6 (ตอบแล้ว) — ไม่มี q4 (ของตัวเอง) · ไม่เห็น q5 (ถึงเจ้าของ) เพราะฐานไม่ให้เห็น', reqRows().join() === 'q1,q2,q3,q6' && !WORK.reqs.some(r => r.id === 'q5' && false) && work.reqs.every(r => r.id !== 'q5'), reqRows().join());
  ok('q1 (ถึงกลุ่มผู้ดูแล) เลือกอัตโนมัติ: เห็นผู้ยื่น Zen + ใบงานที่แนบ + ปุ่ม อนุมัติ · รับเรื่อง / ปฏิเสธ + คำอธิบาย "อนุมัติ = รับเรื่อง ระบบไม่ย้ายงานให้"', /จาก Zen/.test(txt('workReqDetail')) && !!$('workReqDetail').querySelector('[data-act="req-approve"]') && !!$('workReqDetail').querySelector('[data-act="req-reject"]') && /ระบบไม่ย้ายงานหรือเลื่อนกำหนดให้/.test(txt('workReqDetail')) && !$('workReqDetail').querySelector('[data-act="req-withdraw"]'));
  if (${JSON.stringify(!!SHOTS)}) await shot('work-admin-requests.png');
  $('workReqDetail').querySelector('[data-act="open-task"]').click(); await sleep(150);
  ok('คำขอ: "ระบบไม่ย้ายงานหรือเลื่อนกำหนดให้" และ "บังคับเมื่อปฏิเสธ" เป็นสีแดงตัวหนา', redTexts($('workReqDetail')).some(t => t === 'ระบบไม่ย้ายงานหรือเลื่อนกำหนดให้') && redTexts($('workReqDetail')).some(t => t === 'บังคับเมื่อปฏิเสธ'), JSON.stringify(redTexts($('workReqDetail'))));
  ok('"เปิดใบงาน" จากคำขอ: เปิดหน้าต่างรายละเอียดของใบ a1', dlgOpen('workDlg') && workDlgId === 'a1');
  closeAll();
  const decN = rpcs('work_request_decide').length;
  $('workReqDetail').querySelector('[data-act="req-reject"]').click(); await sleep(100);
  ok('ปฏิเสธโดยไม่ใส่เหตุผล: ไม่ส่งไปฐาน · บอกว่าผู้ยื่นจะเห็นเหตุผลนี้', rpcs('work_request_decide').length === decN && /ปฏิเสธต้องใส่เหตุผล/.test(txt('workReqErr')) && !$('workReqErr').hidden && reqOnServer('q1').status === 'pending');
  $('workReqNote').value = 'ช่วงนี้ Nutty ก็ติดงานคอร์ส ให้ลองจัดลำดับเองก่อน'; $('workReqDetail').querySelector('[data-act="req-reject"]').click(); await sleep(400);
  const d1 = lastRpc('work_request_decide');
  ok('ปฏิเสธพร้อมเหตุผล: work_request_decide reject + เหตุผล · ฐาน = rejected · ผู้ตัดสิน = Nui · ข้อความ "ปฏิเสธคำขอแล้ว"', d1.args.p_request === 'q1' && d1.args.p_verdict === 'reject' && /จัดลำดับเอง/.test(d1.args.p_note) && reqOnServer('q1').status === 'rejected' && reqOnServer('q1').decided_by === 'u4' && /ปฏิเสธคำขอแล้ว/.test(toast()));
  ok('หลังตอบ: เลขที่แท็บเหลือ 1 · q1 ย้ายไปส่วน "ตอบแล้ว" · แผงยังโชว์ q1 พร้อมเหตุผลที่ปฏิเสธ (ผู้ตอบเห็นผลของตัวเอง) · ไม่มีปุ่มตอบซ้ำ', txt('workReqN') === '1' && /ปฏิเสธ/.test(reqRow('q1').textContent) && work.reqSel === 'q1' && !!$('workReqDetail').querySelector('.wk-ans.bad') && /จัดลำดับเอง/.test(txt('workReqDetail')) && !$('workReqDetail').querySelector('[data-act="req-approve"],[data-act="req-reject"]'));
  reqRow('q2').click(); await frames();
  ok('เลือก q2 (ถึง Nui โดยเฉพาะ): มีปุ่มตอบ · ป้าย "ถึง Nui"', !!$('workReqDetail').querySelector('[data-act="req-approve"]') && /ถึง Nui/.test(txt('workReqDetail')));
  $('workReqDetail').querySelector('[data-act="req-approve"]').click(); await sleep(400);
  const d2 = lastRpc('work_request_decide');
  ok('อนุมัติโดยไม่ใส่ความเห็น (q2 ถึง Nui โดยเฉพาะ): p_note = null · ฐาน = approved · เลขที่แท็บว่าง · ตัวเลขแดงเหลือ 3 (งานรอตรวจเท่านั้น)', d2.args.p_request === 'q2' && d2.args.p_verdict === 'approve' && d2.args.p_note === null && reqOnServer('q2').status === 'approved' && txt('workReqN') === '' && badge() === '3', badge());
  // ที่ฉันยื่น
  document.querySelector('#workReqBoxes button[data-box="out"]').click(); await frames();
  ok('"ที่ฉันยื่น": q4 (ถึงเจ้าของ) รอตอบ + ปุ่มถอน · ผู้ดูแลไม่มีปุ่มตอบคำขอของตัวเอง', reqRows().join() === 'q4' && !!$('workReqDetail').querySelector('[data-act="req-withdraw"]') && !$('workReqDetail').querySelector('[data-act="req-approve"],[data-act="req-reject"]'));
  $('workReqNew').click(); await sleep(120);
  ok('ผู้ดูแลยื่นคำขอ: ตัวเลือกกลุ่มมีเฉพาะ "เจ้าของ" · เลือกเป็นคนได้เฉพาะ TiBass (ยื่นถึงผู้ดูแลด้วยกันไม่ได้)', grpChips() === 'เจ้าของ' && (document.querySelector('#workrMode button[data-mode="user"]').click(), [...$('workrUser').options].map(o => o.textContent.split(' · ')[0]).join() === 'TiBass') && [...$('workrTask').options].some(o => o.value === 'e1'), grpChips());
  closeAll(); await sleep(100);
  // ใครตัดสินก่อนเป็นผู้ตัดสิน (แย่งกันตอบในกลุ่ม)
  WORK.seed(); await loadWork(); document.querySelector('#workReqBoxes button[data-box="in"]').click(); await frames();
  WORK.rpc.work_request_decide('u5', { p_request: 'q1', p_verdict: 'approve', p_note: 'Fah รับเอง' });    // Fah ตอบไปก่อน ขณะที่หน้านี้ยังเห็น q1 เป็นรอตอบ
  ok('(ตั้งต้น) หน้าของ Nui ยังเห็น q1 รอตอบ ทั้งที่ Fah ตอบไปแล้ว', work.reqs.find(r => r.id === 'q1').status === 'pending' && !!$('workReqDetail').querySelector('[data-act="req-approve"]'));
  $('workReqDetail').querySelector('[data-act="req-approve"]').click(); await sleep(500);
  ok('ตอบทับคนที่ตอบไปก่อน: ฐานปฏิเสธ บอกว่า Fah อนุมัติไปแล้ว · หน้าโหลดใหม่ให้เห็นผลจริง ไม่มีปุ่มตอบอีก · ข้อความถูกแสดงให้เห็น', /ตอบคำขอไม่สำเร็จ: คำขอนี้ปิดไปแล้ว \\(อนุมัติแล้วโดย Fah\\)/.test(toast()) && work.reqs.find(r => r.id === 'q1').status === 'approved' && reqOnServer('q1').decided_by === 'u5' && !$('workReqDetail').querySelector('[data-act="req-approve"]'));
  doLogout(); await sleep(400);

  // ── 7. เจ้าของ (TiBass) ───────────────────────────────────────────────────
  WORK.seed();
  await login('tibass');
  ok('เจ้าของ: ตัวเลขแดง = งานรอตรวจ 4 (a5 b1 b2 + c1 ของผู้ดูแล) + คำขอที่ถึงเจ้าของ 2 (q4 q5) = 6 — ไม่นับคำขอที่ส่งถึงผู้ดูแล (q1 q2) แม้เห็นอยู่', badge() === '6', badge());
  showSection('tasks'); await sleep(300); tab('review'); await frames();
  ok('เจ้าของตรวจได้ทุกใบ รวมงานของผู้ดูแล (c1): คิว a5 b1 b2 c1 ตามเวลาส่ง', queue().join() === 'a5,b1,b2,c1' || queue().join() === 'a5,b1,b2,c1', queue().join());
  cardOf('#workQueue', 'c1').click(); await frames();
  ok('c1 (งานของผู้ดูแล): เจ้าของมีปุ่ม ผ่าน · ปิดงาน / ส่งกลับแก้ ได้', !!$('workDetail').querySelector('[data-act="rv-approve"]') && !!$('workDetail').querySelector('[data-act="rv-changes"]'));
  $('workDetail').querySelector('[data-act="rv-approve"]').click(); await sleep(400);
  ok('เจ้าของผ่านงานของผู้ดูแล: ฐาน = ผ่านแล้ว ปิดงาน', taskOnServer('c1').status === 'approved' && lastRpc('work_review').args.p_task === 'c1');
  tab('req'); await frames();
  ok('เจ้าของไม่มีตัวสลับกล่อง (ตอบอย่างเดียว) · ไม่มีปุ่มยื่นคำขอ (สั่งงาน/ย้ายงานเอง) · เลขที่แท็บ 2 (เฉพาะที่ถึงเจ้าของ)', $('workReqBoxes').innerHTML === '' && $('workReqNew').hidden && txt('workReqN') === '2', txt('workReqN'));
  ok('เจ้าของเห็นคำขอทุกใบ (q1–q6 ยกเว้นที่ยื่นเอง = ไม่มี) รวมที่ถึงผู้ดูแลโดยเฉพาะ (q2) · รอตอบ 4 ก่อน ตอบแล้ว 2', reqRows().sort().join() === 'q1,q2,q3,q4,q5,q6' && reqRows().slice(0, 4).sort().join() === 'q1,q2,q4,q5', reqRows().join());
  reqRow('q2').click(); await frames();
  ok('เจ้าของตัดสินแทนได้แม้ส่งถึงผู้ดูแลโดยเฉพาะ (q2 ถึง Nui): มีปุ่มตอบ · ป้าย "ถึง Nui"', !!$('workReqDetail').querySelector('[data-act="req-approve"]') && /ถึง Nui/.test(txt('workReqDetail')));
  $('workReqNote').value = 'ตกลง ให้ Nui ดูแลต่อ'; $('workReqDetail').querySelector('[data-act="req-approve"]').click(); await sleep(400);
  ok('เจ้าของอนุมัติ q2: ฐาน = approved · ผู้ตัดสิน = TiBass · เก็บความเห็น', reqOnServer('q2').status === 'approved' && reqOnServer('q2').decided_by === 'u1' && reqOnServer('q2').decision_note === 'ตกลง ให้ Nui ดูแลต่อ');
  tab('assign'); await frames(); $('workNew').click(); await sleep(150);
  ok('เจ้าของสั่งงาน: เลือกได้ทุกคนที่ใช้งานอยู่ (6 คน รวมตัวเอง) — ไม่มี "สั่งไม่ได้"', pplOn().split(',').length === 6 && pplOff() === '' && /เจ้าของสั่งงานให้ทุกคนได้/.test(txt('workfRule')), pplOn());
  closeAll();
  // ปิดงานขั้น 2 เมื่อช่องโซเชียลถูกแก้ออกหมด (work_close)
  document.querySelector('#workAll tr[data-id="a3"]').click(); await sleep(150);
  ok('a3 (รอลงโซเชียล · ยังมีช่อง): ยังไม่มีปุ่ม "ปิดงาน" (ต้องรอลิงก์โพสต์)', !$('workDlgBody').querySelector('[data-act="close-task"]') && !!$('workDlgBody').querySelector('[data-act="edit"]'));
  ok('เจ้าของไม่มีปุ่ม "ยื่นคำขอเกี่ยวกับงานนี้" บนใบงาน (เจ้าของยื่นคำขอไม่ได้)', !$('workDlgBody').querySelector('[data-act="req-new"]'));
  $('workDlgBody').querySelector('[data-act="edit"]').click(); await sleep(150);
  ok('แก้ใบที่ผ่านขั้นไฟล์แล้ว: บอกว่าอยู่ขั้นลิงก์โพสต์เสมอ · เพิ่มช่อง = ต้องแนบเพิ่ม · เอาช่องออกหมด = ปิดงานได้', /อยู่ขั้นลิงก์โพสต์เสมอ/.test(txt('workfStage')) && /ปิดงาน/.test(txt('workfStage')));
  document.querySelector('#workfChans button[data-ch="facebook"]').click(); document.querySelector('#workfChans button[data-ch="instagram"]').click();
  $('workfSave').click(); await sleep(450);
  const ed = lastRpc('work_edit');
  ok('เอาช่องออกหมด: work_edit ส่งช่องว่าง · ฐาน = ยังรอลงโซเชียล (phase final · open · ไม่ย้อนกลับขั้น 1)', ed.args.p_channels.length === 0 && taskOnServer('a3').phase === 'final' && taskOnServer('a3').status === 'open');
  document.querySelector('#workAll tr[data-id="a3"]').click(); await sleep(150);
  ok('ตอนนี้ a3 ไม่มีช่องให้ลงแล้ว: เจ้าของเห็นปุ่ม "ปิดงาน (ไม่ต้องลงโซเชียลแล้ว)"', !!$('workDlgBody').querySelector('[data-act="close-task"]'));
  $('workDlgBody').querySelector('[data-act="close-task"]').click(); await sleep(150);
  ok('กดปิดงาน: ถามยืนยันก่อน', dlgOpen('confirmDialog') && /ปิดงานนี้เลย/.test(txt('confirmTitle')));
  $('confirmOkBtn').click(); await sleep(400);
  ok('ยืนยัน: work_close · ฐาน = ผ่านแล้ว · ข้อความ "ปิดงานแล้ว"', lastRpc('work_close').args.p_task === 'a3' && taskOnServer('a3').status === 'approved' && /ปิดงานแล้ว/.test(toast()));
  closeAll();
  doLogout(); await sleep(400);

  // ── 8. ผู้ดูแลทำ work_close ได้กับงานของพนักงาน · ปุ่มไม่โผล่เมื่อไม่มีสิทธิ์ตรวจ ──────────────
  WORK.seed();
  WORK.tasks.find(t => t.id === 'a3').channels = [];             // a3: ผ่านขั้นไฟล์แล้ว + ไม่มีช่องเหลือ (ผู้รับเป็นพนักงาน Zen)
  WORK.tasks.push(Object.assign({}, WORK.tasks.find(t => t.id === 'a3'), { id: 'x3', assignee_id: 'u5', title: 'งานของผู้ดูแล Fah ที่ผ่านขั้นไฟล์แล้ว' }));
  WORK.events.push(Object.assign({}, WORK.events.find(e => e.task_id === 'a3' && e.kind === 'content_approved'), { id: 'ex3', task_id: 'x3' }));
  await login('nui'); showSection('tasks'); await sleep(300); tab('assign'); await frames();
  document.querySelector('#workAll tr[data-id="a3"]').click(); await sleep(150);
  ok('ผู้ดูแลเห็นปุ่ม "ปิดงาน" ที่ใบของพนักงานที่ผ่านขั้นไฟล์แล้วและไม่มีช่องเหลือ', !!$('workDlgBody').querySelector('[data-act="close-task"]'));
  closeAll();
  document.querySelector('#workAll tr[data-id="x3"]').click(); await sleep(150);
  ok('ใบเดียวกันแต่ผู้รับเป็นผู้ดูแล (Fah): ผู้ดูแลไม่มีปุ่มปิดงาน (ตรวจไม่ได้ = ปิดไม่ได้)', !$('workDlgBody').querySelector('[data-act="close-task"]'));
  closeAll();
  doLogout(); await sleep(400);

  // ── 9. Realtime · ยังไม่ได้รัน migration · โหลดล้ม ───────────────────────────
  WORK.seed();
  await login('zen'); showSection('tasks'); await sleep(300);
  const subs = WORK.subs.filter(s => s.name === 'desk-work');
  ok('ฟัง Realtime ของ work_tasks · work_task_events · work_requests ในช่องเดียว (desk-work)', ['work_tasks', 'work_task_events', 'work_requests'].every(t => subs.some(s => s.table === t)), JSON.stringify(subs.map(s => s.table)));
  const selN = () => CALLS.filter(c => c.op === 'select' && c.table === 'work_tasks').length;
  let n0 = selN();
  WORK.fireRt('work_tasks'); WORK.fireRt('work_task_events'); WORK.fireRt('work_requests'); await sleep(900);
  ok('Realtime ยิงรัว 3 ครั้งติดกัน = โหลดใหม่ครั้งเดียว (รวบ)', selN() - n0 === 1, String(selN() - n0));
  const before = badge();
  WORK.tasks.push(Object.assign({}, WORK.tasks.find(t => t.id === 'a4'), { id: 'n1', title: 'งานใหม่ที่เพิ่งถูกสั่ง', created_at: new Date().toISOString() }));
  WORK.fireRt('work_tasks'); await sleep(900);
  ok('มีใบใหม่ถึงฉัน: ข้อความเด้ง "มีงานใหม่" · ตัวเลขแดงเพิ่ม 1 · การ์ดโผล่เอง ไม่ต้องรีเฟรช', /มีงานใหม่/.test(toast()) && /งานใหม่ที่เพิ่งถูกสั่ง/.test(toast()) && Number(badge()) === Number(before) + 1 && mineIds().includes('n1'), toast() + ' ' + before + '→' + badge());
  WORK.rpc.work_review('u4', { p_task: 'a5', p_verdict: 'changes', p_note: 'นับใหม่อีกรอบ' });
  WORK.fireRt('work_tasks'); await sleep(900);
  ok('ใบของฉันถูกส่งกลับแก้จากอีกเครื่อง: ข้อความเด้ง "ถูกส่งกลับแก้" · การ์ดย้ายไปกลุ่มต้องทำก่อน พร้อมความเห็น', /ถูกส่งกลับแก้/.test(toast()) && groupIds('ต้องทำก่อน').includes('a5') && /นับใหม่อีกรอบ/.test(cardOf('#workMineList', 'a5').textContent));
  WORK.rpc.work_request_decide('u4', { p_request: 'q3', p_verdict: 'approve', p_note: null });   // (q3 ปิดไปแล้ว — ต้องล้ม ไม่ทำให้อะไรเปลี่ยน)
  WORK.reqs.push({ id: 'q8', requester_id: 'u2', to_user_id: 'u4', to_group: null, task_id: null, body: 'ขอเปลี่ยนวันหยุด', status: 'pending', decided_by: null, decision_note: '', closed_at: null, created_at: new Date().toISOString(), updated_at: new Date().toISOString() });
  await loadWork();
  WORK.rpc.work_request_decide('u4', { p_request: 'q8', p_verdict: 'reject', p_note: 'วันนั้นมีคอร์ส' });
  WORK.fireRt('work_requests'); await sleep(900);
  ok('คำขอของฉันถูกตอบจากอีกเครื่อง: ข้อความเด้ง "คำขอของคุณถูกปฏิเสธ"', /คำขอของคุณถูกปฏิเสธ/.test(toast()), toast());
  doLogout(); await sleep(400);
  // ยังไม่ได้รัน 037 / 038
  WORK.seed(); WORK.missing = true;
  await login('zen'); showSection('tasks'); await sleep(400);
  ok('ยังไม่ได้รัน migration: ขึ้นแถบเหลืองบอกให้รัน 037 และ 038 · ไม่มีแถบแดงฟ้อง (ตาราง/คอลัมน์ยังไม่มี = รอได้) · ตัวเลขแดงไม่ขึ้น · รายการงานว่าง', /ต้องรัน migration 037 และ 038/.test(txt('workAlert')) && !!$('workAlert').querySelector('.alert-warn') && !fatalText() && badge() === '' && mineIds().length === 0);
  doLogout(); await sleep(400);
  WORK.seed(); WORK.noReq = true;
  await login('zen'); showSection('tasks'); await sleep(400);
  ok('รัน 037 แล้วแต่ยังไม่รัน 038 (ตารางคำขอไม่มี): บอกให้รัน 037 และ 038 เช่นกัน — ไม่แสดงงานครึ่ง ๆ กลาง ๆ', /ต้องรัน migration 037 และ 038/.test(txt('workAlert')) && mineIds().length === 0);
  doLogout(); await sleep(400);
  WORK.seed(); WORK.fail.select = 'เครือข่ายขาด';
  await login('zen'); showSection('tasks'); await sleep(400);
  ok('โหลดล้มด้วยเหตุอื่น: แถบแดง "โหลดงานไม่สำเร็จ" + แถบข้อผิดพลาดบนจอ (ไม่เงียบ) · ไม่โชว์ว่าไม่มีงาน', /โหลดงานไม่สำเร็จ: เครือข่ายขาด/.test(txt('workAlert')) && !!$('workAlert').querySelector('.alert-red') && /โหลดงานของฉันไม่สำเร็จ: เครือข่ายขาด/.test(fatalText()));
  document.getElementById('fatalError') && document.getElementById('fatalError').remove();
  delete WORK.fail.select; $('workReload').click(); await sleep(500);
  ok('กด ↻ รีเฟรช หลังเครือข่ายกลับมา: โหลดได้ แถบแดงหาย', mineIds().length === 5 && txt('workAlert') === '');
  doLogout(); await sleep(400);

  // ── 10. XSS · ลิงก์อันตราย ────────────────────────────────────────────
  WORK.seed();
  const xt = WORK.tasks.find(t => t.id === 'b1'); xt.title = '<img src=x onerror="window.__xss=1">ชื่อทดสอบ'; xt.detail = '<b>ตัวหนา</b><scr' + 'ipt>window.__xss=2</scr' + 'ipt>'; xt.assignee_id = 'u2';
  WORK.events.filter(e => e.task_id === 'b1' && e.kind === 'submitted').forEach(e => { e.note = '<img src=x onerror="window.__xss=3">'; e.links = [{ url: 'javascript:window.__xss=4' }, { url: 'http://insecure.example.com/x' }, { url: 'https://drive.google.com/ok' }]; });
  WORK.reqs.find(r => r.id === 'q1').body = '<img src=x onerror="window.__xss=5">คำขอ';
  await login('zen'); showSection('tasks'); await sleep(300);
  document.querySelector('[data-act="open"][data-id="b1"]').click(); await sleep(150);
  const dlg = $('workDlgBody');
  ok('ข้อความที่มีแท็ก HTML (ชื่อ/รายละเอียด/ข้อความตอนส่ง) แสดงเป็นข้อความ ไม่ถูกรัน · ไม่มี <img>/<script> โผล่', !window.__xss && !document.querySelector('#sec-tasks img[src="x"], #workDlg img[src="x"]') && !dlg.querySelector('script') && /<img src=x/.test(dlg.textContent));
  ok('ลิงก์หลักฐาน: javascript: และ http:// ไม่เป็นลิงก์ที่กดได้ (แสดงเป็นข้อความเฉย ๆ) · https ปกติเปิดแท็บใหม่ได้ (noopener noreferrer)', dlg.querySelectorAll('a[href]').length === 1 && dlg.querySelector('a[href]').href === 'https://drive.google.com/ok' && dlg.querySelector('a[href]').target === '_blank' && dlg.querySelector('a[href]').rel === 'noopener noreferrer' && /javascript:window/.test(dlg.textContent));
  closeAll(); tab('req'); await frames();
  ok('คำขอที่มีแท็ก HTML: แสดงเป็นข้อความเช่นกัน', !window.__xss && /<img src=x/.test(txt('workReqDetail')) && !document.querySelector('#workReqDetail img'));

  // ── 11. กันกดซ้ำ ──────────────────────────────────────────────────────
  doLogout(); await sleep(400); WORK.seed();
  await login('nui'); showSection('tasks'); await sleep(300); tab('review'); await frames();
  let rel = null; WORK.gate = new Promise(r => { rel = r; });
  const rvN = rpcs('work_review').length;
  $('workDetail').querySelector('[data-act="rv-approve"]').click(); await sleep(50);
  const btnA = $('workDetail').querySelector('[data-act="rv-approve"]');
  ok('กดผ่านแล้วค้างรอฐานข้อมูล: ปุ่มตรวจถูกปิดทันที · กดซ้ำไม่ได้', !btnA || btnA.disabled);
  workReview('a5', 'approve'); await sleep(50);
  WORK.gate = null; rel(); await sleep(500);
  ok('กดผ่านซ้ำระหว่างรอ: ฟังก์ชัน work_review ถูกเรียกครั้งเดียว', rpcs('work_review').length - rvN === 1, String(rpcs('work_review').length - rvN));
  tab('req'); await frames();
  let rel2 = null; WORK.gate = new Promise(r => { rel2 = r; });
  const dcN = rpcs('work_request_decide').length;
  $('workReqDetail').querySelector('[data-act="req-approve"]').click(); await sleep(50);
  ok('ตอบคำขอแล้วค้างรอฐานข้อมูล: ปุ่มตอบถูกปิดทันที', [...document.querySelectorAll('#workReqDetail [data-act="req-approve"],#workReqDetail [data-act="req-reject"]')].every(b => b.disabled));
  workReqDecide(work.reqSel, 'approve'); await sleep(50);
  WORK.gate = null; rel2(); await sleep(500);
  ok('ตอบซ้ำระหว่างรอ: work_request_decide ถูกเรียกครั้งเดียว', rpcs('work_request_decide').length - dcN === 1, String(rpcs('work_request_decide').length - dcN));
  doLogout(); await sleep(400);

  // ── 12. ออกจากระบบ/สลับบัญชี: ล้างทุกอย่างออกจากหน้า ──────────────────────────
  WORK.seed();
  await login('nui'); showSection('tasks'); await sleep(300);
  tab('req'); await frames(); $('workReqNew').click(); await sleep(120);
  setVal('workrBody', 'ข้อความคำขอที่พิมพ์ค้างไว้ก่อนออกจากระบบ');
  const leakRe = /ถ่ายรูปสินค้า DDJ-FLX4 ลง|ตัดคลิปรีวิว|โพสต์โปร Starter Pack|ข้อความคำขอที่พิมพ์ค้างไว้|ขออนุมัติซื้อไมค์|ขอหยุดวันจันทร์|ตรวจนับสาย XLR|จัดชั้นวางหูฟัง|อัปเดตรายการราคาหูฟัง/;
  ok('(ตั้งต้น) ผู้ดูแลเห็นงานและคำขอจริง + หน้าต่างคำขอเปิดพร้อมข้อความที่พิมพ์ค้าง', dlgOpen('workReqDialog') && work.tasks.length > 5 && work.reqs.length > 3 && leakRe.test(document.body.innerText + $('workrBody').value));
  let relOut = null; WORK.gate = new Promise(r => { relOut = r; });
  $('workReload').click(); await sleep(60);                                     // โหลดค้างอยู่ แล้วออกจากระบบ
  doLogout(); await sleep(400);
  WORK.gate = null; relOut(); await sleep(500);                                 // ผลโหลดของคนเดิมมาถึงหลังออกจากระบบ — ต้องไม่ถูกวาดลงหน้า
  const leakAt = [...document.querySelectorAll('body *')].filter(e => !/^(SCRIPT|STYLE)$/.test(e.tagName) && e.children.length === 0 && leakRe.test(e.textContent + (e.value || ''))).map(e => (e.id ? '#' + e.id : e.tagName.toLowerCase() + '.' + e.className)).slice(0, 5);
  ok('ออกจากระบบ: เนื้อหางาน/คำขอถูกล้างออกจากหน้า (DOM + หน่วยความจำ) แม้ผลโหลดมาถึงทีหลัง · ไม่มีข้อความค้างในฟอร์ม', !leakAt.length && work.tasks.length === 0 && work.reqs.length === 0 && work.events.length === 0 && work.people.length === 0 && !work.loaded, leakAt.join(' | '));
  ok('ออกจากระบบ: หน้าต่างคำขอปิด · ช่องที่พิมพ์ค้างว่าง · ตัวเลขแดงหาย · เปิดแท็บกลับที่งานของฉัน', !dlgOpen('workReqDialog') && $('workrBody').value === '' && workReq === null && badge() === '' && $('workPaneMine').hidden === false && txt('workReqN') === '' && txt('workReviewN') === '');
  await login('zen');
  ok('ล็อกอินเป็นพนักงานต่อ: งานของ Nui/คำขอของผู้ดูแลไม่ค้างในหน้า · เห็นแต่ของ Zen', !/ขออนุมัติซื้อไมค์|ขอหยุดวันจันทร์|จัดชั้นวางหูฟัง|อัปเดตรายการราคาหูฟัง|ข้อความคำขอที่พิมพ์ค้างไว้/.test(document.body.innerText + $('workrBody').value) && work.reqs.every(r => r.requester_id === 'u2') && work.tasks.every(t => t.assignee_id === 'u2' || t.created_by === 'u2'), String(work.tasks.length));
  // สลับบัญชีกลางหน้าต่างที่เปิดค้าง
  showSection('tasks'); await sleep(300);
  openMine('a1'); await sleep(120); setVal('workSubLink', 'https://drive.google.com/ค้างไว้');
  ok('(ตั้งต้น) Zen เปิดหน้าต่างส่งงานค้างไว้', dlgOpen('workSubDialog'));
  onAccountSwitched(); await sleep(120);
  ok('สลับบัญชี (onAccountSwitched): หน้าต่างส่งงานปิด · สถานะส่งงานล้าง · ลิงก์ที่พิมพ์ค้างหาย', !dlgOpen('workSubDialog') && workSub === null && $('workSubLink').value === '' && work.tasks.length === 0 && !work.loaded);
  doLogout(); await sleep(400);
  // ── 12b. ฟังก์ชันสิทธิ์ฝั่งหน้าจอ ตรวจตรง ๆ (หน้าจอบางกรณีเข้าไม่ถึง: ตำแหน่งเปลี่ยนระหว่างทาง · ใบที่ไม่เคยผ่านขั้นไฟล์) ──
  WORK.seed();
  await login('tibass'); showSection('tasks'); await sleep(300);
  const asRole = (role, fn) => { const keep = currentAdmin; currentAdmin = Object.assign({}, keep, { role }); try { return fn(); } finally { currentAdmin = keep; } };
  const mkT = (id, o) => Object.assign({ id, status: 'open', phase: 'final', channels: [], assignee_id: 'u3', created_by: 'u1' }, o);
  work.events.push({ id: 'wb-e1', task_id: 'wb-ok', kind: 'content_approved', actor_id: 'u1', note: '', links: [], image_paths: [], phase: 'content', created_at: new Date().toISOString() });
  ok('ปุ่มปิดงาน (workCanClose): ผ่านขั้นไฟล์แล้ว + ไม่มีช่องเหลือ + รอลงโซเชียล = ปิดได้ (open · changes)', workCanClose(mkT('wb-ok')) && workCanClose(mkT('wb-ok', { status: 'changes' })));
  ok('ปิดงานไม่ได้: ใบที่ไม่เคยผ่านขั้นไฟล์ (ไม่มีเหตุการณ์ content_approved) · ยังมีช่องโซเชียล · ยังอยู่ขั้น 1', !workCanClose(mkT('wb-none')) && !workCanClose(mkT('wb-ok', { channels: ['facebook'] })) && !workCanClose(mkT('wb-ok', { phase: 'content' })));
  ok('ปิดงานไม่ได้: สถานะ รอตรวจ / ผ่านแล้ว / ยกเลิก (ต้องใช้ปุ่มตรวจ ไม่ใช่ปุ่มปิดงานข้ามการตรวจ)', ['submitted', 'approved', 'cancelled'].every(st => !workCanClose(mkT('wb-ok', { status: st }))));
  ok('ปิดงานไม่ได้: ผู้ดูแลกับใบที่ผู้รับเป็นผู้ดูแล (ตรวจไม่ได้ = ปิดไม่ได้) · พนักงานปิดไม่ได้เลย', asRole('admin', () => !workCanClose(mkT('wb-ok', { assignee_id: 'u5' })) && workCanClose(mkT('wb-ok', { assignee_id: 'u2' }))) && asRole('staff', () => !workCanClose(mkT('wb-ok'))));
  ok('ปุ่มแก้ (workCanEdit): ใบ open / changes / submitted แก้ได้ · ผ่านแล้ว / ยกเลิก แก้ไม่ได้ แม้เป็นเจ้าของ', ['open', 'changes', 'submitted'].every(st => workCanEdit(mkT('wb1', { status: st }))) && ['approved', 'cancelled'].every(st => !workCanEdit(mkT('wb1', { status: st }))));
  const mkR = o => Object.assign({ id: 'wr', requester_id: 'u9', to_user_id: null, to_group: null, status: 'pending' }, o);
  ok('ตัดสินคำขอ (workReqCanDecide): เจ้าของตัดสินได้ทุกใบที่ไม่ใช่ของตัวเอง · ใบของตัวเองตัดสินไม่ได้แม้เป็นเจ้าของ (ถูกเลื่อนตำแหน่งทีหลัง)', workReqCanDecide(mkR({ to_group: 'admin' })) && !workReqCanDecide(mkR({ requester_id: currentUserId, to_group: 'owner' })));
  ok('ตัดสินคำขอ: ผู้ดูแลตัดสินได้เฉพาะที่ถึงตัวเอง/กลุ่มผู้ดูแล · ถึงเจ้าของตัดสินไม่ได้', asRole('admin', () => workReqCanDecide(mkR({ to_group: 'admin' })) && workReqCanDecide(mkR({ to_user_id: currentUserId })) && !workReqCanDecide(mkR({ to_group: 'owner' })) && !workReqCanDecide(mkR({ requester_id: currentUserId, to_group: 'admin' }))));
  ok('ตัดสินคำขอ: พนักงานตัดสินไม่ได้เลย แม้คำขอระบุชื่อเขาโดยตรง (ถูกลดตำแหน่งทีหลัง) · คำขอที่ปิดแล้วตัดสินไม่ได้', asRole('staff', () => !workReqCanDecide(mkR({ to_user_id: currentUserId })) && !workReqCanDecide(mkR({ to_group: 'staff' }))) && ['approved', 'rejected', 'withdrawn'].every(st => !workReqCanDecide(mkR({ to_group: 'admin', status: st }))));
  ok('คำขอที่ "ส่งถึงฉัน" (workReqForMe): ของตัวเองไม่นับ แม้ตำแหน่งตัวเองตรงกลุ่มผู้รับ (ผู้ยื่นถูกเลื่อนตำแหน่งทีหลัง) · ถึงชื่อตัวเอง/กลุ่มของตัวเองนับ', asRole('admin', () => !workReqForMe(mkR({ requester_id: currentUserId, to_group: 'admin' })) && workReqForMe(mkR({ to_group: 'admin' })) && workReqForMe(mkR({ to_user_id: currentUserId })) && !workReqForMe(mkR({ to_group: 'owner' }))));
  doLogout(); await sleep(400);

  // ผู้ยื่นที่ถูกเลื่อนเป็นผู้ดูแลทีหลัง: คำขอค้างของตัวเอง (ถึงกลุ่มผู้ดูแล) ต้องไม่ขึ้นปุ่มตอบ/ไม่นับเป็นเลขแดง — ตรวจผ่านหน้าจอจริง
  WORK.seed(); FAKE.admins.find(a => a.id === 'u2').role = 'admin';
  await login('zen'); showSection('tasks'); await sleep(300); tab('req'); await frames();
  ok('Zen ถูกเลื่อนเป็นผู้ดูแล: ตัวเลขแดง = งานของตัวเอง 4 + งานพนักงานรอตรวจ 2 (b1 b2) + คำขอที่ถึงตัวเอง 0 (q1 ของตัวเองไม่นับ) = 6', badge() === '6', badge());
  document.querySelector('#workReqBoxes button[data-box="out"]').click(); await frames();
  ok('คำขอค้างของตัวเอง (q1 ถึงกลุ่มผู้ดูแล ซึ่งตอนนี้ตัวเองอยู่ในกลุ่ม): ไม่มีปุ่ม อนุมัติ/ปฏิเสธ — มีแต่ปุ่มถอนคำขอ', work.reqSel === 'q1' && !$('workReqDetail').querySelector('[data-act="req-approve"],[data-act="req-reject"]') && !!$('workReqDetail').querySelector('[data-act="req-withdraw"]'));
  doLogout(); await sleep(400);
  FAKE.admins.find(a => a.id === 'u2').role = 'staff';

  // ── 12c. ผู้ตรวจดูใบที่อยู่ขั้นลิงก์โพสต์ (ป้ายขั้นในหลักฐาน/ประวัติ · ไฟล์ที่ผ่านขั้น 1) + ปุ่มปิดงานไม่โผล่ผิดสถานะ ──
  WORK.seed();
  const stg2 = WORK.tasks.find(t => t.id === 'a3');
  stg2.channels = []; stg2.status = 'submitted'; stg2.submitted_at = new Date().toISOString();            // ผ่านขั้นไฟล์แล้ว ไม่มีช่องเหลือ แล้วส่งขั้น 2 เข้ามา (รอตรวจ)
  WORK.events.push({ id: 'x-e1', task_id: 'a3', kind: 'submitted', actor_id: 'u2', note: 'ลงเพจแล้วครับ', links: [{ url: 'https://drive.google.com/file/d/LINKFINAL/view' }], image_paths: [], phase: 'final', created_at: new Date().toISOString() });
  await login('nui'); showSection('tasks'); await sleep(300); tab('review'); await frames();
  cardOf('#workQueue', 'a3').click(); await frames();
  const rvTxt = txt('workDetail');
  ok('ผู้ตรวจดูใบขั้นลิงก์โพสต์: หัวข้อหลักฐานบอก "ขั้นลิงก์โพสต์ · ส่งครั้งที่ 2" · ประวัติบอก "ส่งงาน · ขั้นลิงก์โพสต์" และ "ส่งงาน · ขั้นไฟล์" · มีส่วน "ไฟล์ที่ผ่านขั้น 1 แล้ว" · ปุ่มผ่านเป็น "ผ่าน · ปิดงาน"', /หลักฐานที่แนบ \\(ขั้นลิงก์โพสต์ · ส่งครั้งที่ 2\\)/.test(rvTxt) && /ส่งงาน · ขั้นลิงก์โพสต์/.test(rvTxt) && /ส่งงาน · ขั้นไฟล์/.test(rvTxt) && /ไฟล์ที่ผ่านขั้น 1 แล้ว/.test(rvTxt) && /LINKFINAL/.test(rvTxt) && $('workDetail').querySelector('[data-act="rv-approve"]').textContent === 'ผ่าน · ปิดงาน', rvTxt.slice(0, 200));
  tab('assign'); await frames();
  document.querySelector('#workAll tr[data-id="a3"]').click(); await sleep(150);
  ok('ใบที่รอตรวจอยู่ (ส่งขั้น 2 แล้ว ไม่มีช่องเหลือ): ไม่มีปุ่ม "ปิดงาน" (ต้องกด ตรวจ → ผ่าน ไม่ใช่ปิดงานข้ามการตรวจ)', !$('workDlgBody').querySelector('[data-act="close-task"]'));
  closeAll();
  doLogout(); await sleep(400);
  WORK.seed();
  await login('tibass'); showSection('tasks'); await sleep(300); tab('assign'); await frames();
  document.querySelector('#workAll tr[data-id="b3"]').click(); await sleep(150);
  ok('ใบขั้นเดียวที่ไม่มีช่องทาง (b3 รอทำ · ไม่เคยผ่านขั้นไฟล์): เจ้าของไม่เห็นปุ่ม "ปิดงาน" แต่มีปุ่มแก้ไข', !$('workDlgBody').querySelector('[data-act="close-task"]') && !!$('workDlgBody').querySelector('[data-act="edit"]'));
  closeAll();
  doLogout(); await sleep(400);

  // ── 12d. ช่องว่างของเทสต์ที่ mutation รอบเต็มเจอ (5 ต.ค. · 10 จุด) ──
  const nowIso = () => new Date().toISOString(), hAgo = h => new Date(Date.now() - h * 3600000).toISOString();
  const mkTask = (id, o) => Object.assign({ id, title: id, detail: '', kind: 'other', channels: [], ref_links: [], assignee_id: 'u2', created_by: 'u4', due_at: null, status: 'open', phase: 'final', batch_id: null, submitted_at: null, closed_at: null, created_at: hAgo(30), updated_at: hAgo(2) }, o);
  // (q15) ตัวเลือกใบงานที่แนบกับคำขอ: เฉพาะใบที่ฉันเป็นผู้รับ/ผู้สั่ง และไม่ใช่ใบที่ยกเลิก — ใบของคนอื่นที่หลุดเข้ามาในหน่วยความจำก็ต้องไม่โผล่
  WORK.seed();
  await login('zen'); showSection('tasks'); await sleep(300);
  work.tasks.push(mkTask('zz1', { title: 'ใบของคนอื่นที่หลุดเข้ามา', assignee_id: 'u3', created_by: 'u4' }), mkTask('zz2', { title: 'ใบที่ยกเลิกแล้ว', status: 'cancelled', closed_at: nowIso() }));
  workReqOpen(null); await sleep(120);
  const optIds = [...$('workrTask').options].map(o => o.value);
  ok('ตัวเลือกใบงานของคำขอ (พนักงาน): มีใบของตัวเอง (a1) · ไม่มีใบของคนอื่น (zz1) · ไม่มีใบที่ยกเลิก (zz2)', optIds.includes('a1') && !optIds.includes('zz1') && !optIds.includes('zz2'), optIds.join());
  closeAll(); await sleep(100);
  // (f12 · f13) เรียงกลุ่ม "ต้องทำก่อน" ตามกำหนด · ใบที่ส่งแล้วไม่ขึ้น "เกินกำหนด"
  WORK.tasks.push(mkTask('z1', { title: 'เกินกำหนดนานสุด (สร้างก่อน)', due_at: hAgo(5), created_at: hAgo(40) }), mkTask('z2', { title: 'เกินกำหนดล่าสุด (สร้างหลัง)', due_at: hAgo(1), created_at: hAgo(10) }),
    mkTask('z3', { title: 'ส่งแล้วแต่เลยกำหนด', due_at: hAgo(3), status: 'submitted', submitted_at: hAgo(1) }));
  WORK.events.push({ id: 'z3-e', task_id: 'z3', kind: 'submitted', actor_id: 'u2', note: 'ส่งช้า', links: [], image_paths: [], phase: 'final', created_at: hAgo(1) });
  await loadWork(); await frames();
  ok('"ต้องทำก่อน" เรียงตามกำหนดส่งเก่าสุดก่อน (z1 -5ชม. → a1 -2.3ชม. → z2 -1ชม. → a2 ส่งกลับแก้ +20ชม.) แม้ลำดับสร้างจากฐานสวนกัน', groupIds('ต้องทำก่อน').join() === 'z1,a1,z2,a2', groupIds('ต้องทำก่อน').join());
  ok('ใบที่ส่งแล้วแต่เลยกำหนด (z3): ไม่ขึ้นป้าย "เกินกำหนด" (ไม่ใช่งานค้าง) มีแต่ "ส่งช้า" · สรุป "เกินกำหนด" นับเฉพาะใบที่ยังไม่ส่ง = 3 (z1 a1 z2)', !/เกินกำหนด/.test(cardOf('#workMineList', 'z3').textContent) && /ส่งช้า/.test(cardOf('#workMineList', 'z3').textContent) && txt('workStatLate') === '3', txt('workStatLate'));
  doLogout(); await sleep(400);

  // (s08) เจ้าของเป็นผู้รับงานเอง: หน้าต่างส่งงานไม่มีปุ่ม "ยื่นคำขอเกี่ยวกับงานนี้" (เจ้าของยื่นคำขอไม่ได้)
  WORK.seed();
  WORK.tasks.push(mkTask('own1', { title: 'งานของเจ้าของเอง', assignee_id: 'u1', created_by: 'u1' }));
  await login('tibass'); showSection('tasks'); await sleep(300);
  openMine('own1'); await sleep(150);
  ok('เจ้าของเปิดส่งงานของตัวเอง: ไม่มีปุ่ม "ยื่นคำขอเกี่ยวกับงานนี้"', dlgOpen('workSubDialog') && $('workSubReq').hidden === true && !vis($('workSubReq')));
  closeAll(); await sleep(100);
  doLogout(); await sleep(400);

  // (g01) ตาราง "สั่งงาน": เฉพาะงานที่ผ่านแล้วเป็นเขียวทั้งแถว (เจ้าของ 5 ต.ค. 69 "ตาลาย แยกงานที่เสร็จให้ชัด") — ยกเลิก/รอตรวจ/ส่งกลับแก้/ยังไม่ส่ง ไม่เขียว
  WORK.seed();
  WORK.tasks.push(mkTask('zd2', { title: 'ผ่านแล้วอีกใบ', status: 'approved', closed_at: hAgo(1) }), mkTask('zc1', { title: 'ใบที่ยกเลิกแล้ว', status: 'cancelled', closed_at: hAgo(1) }));
  await login('nui'); showSection('tasks'); await sleep(300); tab('assign'); await frames();
  const rowEl = id => document.querySelector('#workAll tr[data-id="' + id + '"]');
  const GREEN = 'rgb(232, 242, 235)', GREEN_BAR = 'rgb(31, 107, 58)';
  const doneIds = [...document.querySelectorAll('#workAll tr.wk-row')].filter(r => r.classList.contains('wk-done')).map(r => r.dataset.id).sort().join();
  ok('ตารางสั่งงาน: แถวที่ติดป้ายเขียวมีเฉพาะงานที่ผ่านแล้ว (a6 · zd2) — ไม่รวมยกเลิก/รอตรวจ/ส่งกลับแก้/ยังไม่ส่ง', doneIds === 'a6,zd2', doneIds);
  ok('แถวผ่านแล้ว (a6 · zd2): พื้นแถวเขียวอ่อนทั้งแถว', ['a6', 'zd2'].every(id => getComputedStyle(rowEl(id)).backgroundColor === GREEN), getComputedStyle(rowEl('a6')).backgroundColor);
  ok('แถวผ่านแล้ว: มีแถบเขียวเข้มชิดซ้าย', ['a6', 'zd2'].every(id => getComputedStyle(rowEl(id).cells[0]).boxShadow.indexOf(GREEN_BAR) >= 0), getComputedStyle(rowEl('a6').cells[0]).boxShadow);
  ok('แถวที่ไม่ใช่ผ่านแล้ว (รอตรวจ a5 · ส่งกลับแก้ a2 · ยังไม่ส่ง a1): พื้นไม่เขียว ไม่มีแถบ',
    ['a5', 'a2', 'a1'].every(id => getComputedStyle(rowEl(id)).backgroundColor !== GREEN && getComputedStyle(rowEl(id).cells[0]).boxShadow === 'none'), ['a5', 'a2', 'a1'].map(id => getComputedStyle(rowEl(id)).backgroundColor).join('|'));
  ok('ใบที่ยกเลิก (zc1) ไม่อยู่ในรายการ "ทั้งหมด" · ผ่านแล้ว/รอตรวจ/ส่งกลับแก้/ยังไม่ส่ง ยังอยู่ครบ (a6 · zd2 · a5 · a2 · a1)', !rowEl('zc1') && ['a6', 'zd2', 'a5', 'a2', 'a1'].every(id => !!rowEl(id)));
  ok('แถวผ่านแล้วยังบอกเป็นคำ "ผ่านแล้ว" ในป้าย (ไม่พึ่งสีอย่างเดียว) · ป้ายพื้นขาวอ่านชัดบนพื้นเขียว', /ผ่านแล้ว/.test(rowEl('a6').querySelector('.wk-pills').textContent) && getComputedStyle(rowEl('a6').querySelector('.st-ok')).backgroundColor === 'rgb(255, 255, 255)');
  document.querySelector('#workFilter [data-f="cancelled"]').click(); await frames();
  ok('ชิป "ยกเลิก": ใบที่ยกเลิก (zc1) พื้นไม่เขียว ไม่มีแถบ · ยังเป็นป้ายเทา "ยกเลิกแล้ว" (ไม่ปะปนกับงานที่ผ่านแล้ว)', getComputedStyle(rowEl('zc1')).backgroundColor !== GREEN && getComputedStyle(rowEl('zc1').cells[0]).boxShadow === 'none' && !!rowEl('zc1').querySelector('.st-off') && /ยกเลิกแล้ว/.test(rowEl('zc1').querySelector('.wk-pills').textContent) && !rowEl('a6'));
  document.querySelector('#workFilter [data-f="all"]').click(); await frames();
  if (${JSON.stringify(!!SHOTS)}) { rowEl('a6').scrollIntoView({ block: 'center' }); await shot('work-assign-done-green.png'); }
  document.querySelector('#workFilter [data-f="approved"]').click(); await frames();
  ok('กรอง "ผ่านแล้ว": ทุกแถวที่เหลือเขียว (a6 · zd2)', [...document.querySelectorAll('#workAll tr.wk-row')].length === 2 && [...document.querySelectorAll('#workAll tr.wk-row')].every(r => getComputedStyle(r).backgroundColor === GREEN));
  doLogout(); await sleep(400);

  // (h01) ทางลัดหน้าแรก "งานของฉัน" (เจ้าของสั่ง 5 ต.ค. 69 "เพิ่มทางลัดของเมนูใหม่") — ไอคอนลัด 2×2 ที่แต่ละคนเลือกเอง
  WORK.seed();
  await login('zen'); await sleep(300);
  const tkItem = LAUNCH_ITEMS.find(x => x.key === 'tasks');
  ok('มีรายการ "งานของฉัน" ในไอคอนลัดสำเร็จรูป: ชื่อ · ไอคอนเส้นที่วาดจริง · สี · ตัวเลขมุม', !!tkItem && tkItem.t === 'งานของฉัน' && tkItem.icon === 'tasks' && typeof ICON_PATHS.tasks === 'string' && ICON_PATHS.tasks.length > 40 && /^#[0-9A-F]{6}$/.test(tkItem.color) && typeof tkItem.badge === 'function');
  ok('สีของ "งานของฉัน" ไม่ชนไอคอนลัดตัวอื่น', !!tkItem && LAUNCH_ITEMS.filter(x => x.key !== 'tasks' && x.color.toUpperCase() === tkItem.color.toUpperCase()).length === 0, tkItem && tkItem.color);
  ok('ค่าตั้งต้นของไอคอนลัดไม่เปลี่ยน (ยังเป็น 4 ตัวเดิม — ไม่บังคับเพิ่มให้ทุกคน)', LAUNCH_DEFAULT.join() === 'pos,mail,booking,calendar', LAUNCH_DEFAULT.join());
  showSection('home'); await sleep(100);
  homePrefs.launcher = ['tasks', 'pos', 'mail', 'calendar']; renderLauncher(); await frames();
  const lTile = () => document.querySelector('#launcher .lt[data-key="tasks"]');
  const navN = () => { const b = $('navBadge-tasks'); return b.hidden ? 0 : Number(b.textContent); };
  const tileN = () => { const b = lTile().querySelector('.badge'); return b ? Number(b.textContent) : 0; };
  ok('หน้าแรกแสดงไอคอน "งานของฉัน" เป็นปุ่มจริง · ชื่อใต้ไอคอน · มีเส้นไอคอนวาดอยู่ · ป้ายอ่านออกเสียงบอกจำนวนที่รออยู่', !!lTile() && lTile().tagName === 'BUTTON' && lTile().querySelector('.lt-label').textContent === 'งานของฉัน' && lTile().querySelectorAll('svg > *').length >= 2 && /รออยู่/.test(lTile().getAttribute('aria-label')), lTile() && lTile().getAttribute('aria-label'));
  ok('ตัวเลขบนไอคอน = ตัวเลขแดงข้างเมนู "งานของฉัน" และไม่ใช่ 0 (Zen มีงานค้าง)', navN() > 0 && tileN() === navN(), tileN() + '/' + navN());
  ok('เส้นไอคอนขาว/ดำอ่านชัดบนพื้นสี (≥ 3:1) แบบเดียวกับไอคอนลัดอื่น', contrastRatio(tkItem.color, launchInk(tkItem.color)) >= 3);
  const navBefore = navN();
  WORK.tasks.push(mkTask('zl1', { title: 'ใบใหม่ของ Zen', assignee_id: 'u2', created_by: 'u4' }));
  await loadWork(); await frames();
  ok('งานใหม่เข้ามาตอนอยู่หน้าแรก: ตัวเลขบนไอคอนเพิ่มตามเลขข้างเมนู โดยไม่ต้องรีเฟรชหน้า', navN() === navBefore + 1 && tileN() === navN(), navBefore + ' → ' + navN() + '/' + tileN());
  toggleLaunchEdit(); await frames();
  const optT = [...$('ltSel0').options].find(o => o.value === 'tasks');
  ok('โหมดแก้ไขไอคอน: เลือก "งานของฉัน" ได้จากรายการ', !!optT && optT.textContent === 'งานของฉัน');
  const selBefore = $('ltSel2'); selBefore.focus();
  await loadWork(); await frames();
  ok('งานโหลดใหม่ระหว่างที่กำลังแก้ไอคอน: ไม่วาดช่องเลือกใหม่ — ช่องที่กำลังโฟกัสยังเป็นตัวเดิมและยังโฟกัสอยู่ (ไม่ล้างกลางทางที่ผู้ใช้เลือกอยู่)', $('ltSel2') === selBefore && document.activeElement === selBefore && document.querySelectorAll('#launcher select').length === 4);
  { const s = $('ltSel1'); s.value = 'tasks'; s.dispatchEvent(new Event('change')); }
  CALLS.length = 0;
  await saveLauncher(); await sleep(100);
  { const up = CALLS.find(c => c.op === 'upsert' && c.table === 'staff_home');
    ok('บันทึกเลือก "งานของฉัน" ลง staff_home ได้ (ฐานไม่ตรวจชื่อรหัส — migration 028)', !!up && up.payload.launcher.includes('tasks') && up.payload.launcher.length <= 4, JSON.stringify(up && up.payload)); }
  homePrefs.launcher = ['tasks', 'pos', 'mail', 'calendar']; showSection('home'); renderLauncher(); await frames();
  lTile().click(); await sleep(200);
  ok('กดไอคอน → ไปหมวด "งานของฉัน" (ไม่ใช่หมวดอื่น)', current === 'tasks', current);
  showSection('home'); await sleep(100);
  WORK.tasks.forEach(t => { if (t.assignee_id === 'u2') { t.status = 'approved'; t.closed_at = new Date().toISOString(); } });
  await loadWork(); await frames();
  ok('ไม่มีงานค้าง: ไอคอนไม่มีป้ายตัวเลข · ป้ายอ่านออกเสียงไม่บอกจำนวน', navN() === 0 && !lTile().querySelector('.badge') && !/รออยู่/.test(lTile().getAttribute('aria-label')), lTile().getAttribute('aria-label'));
  doLogout(); await sleep(400);

  // (s09 · s19) ขั้นลิงก์โพสต์: ช่องลิงก์ไฟล์ที่ซ่อนอยู่ไม่ถูกส่ง · ลิงก์ที่ใส่ไว้ล่วงหน้าเฉพาะจากการส่งขั้นลิงก์โพสต์ครั้งก่อน (ไม่ใช่ขั้นไฟล์)
  WORK.seed();
  WORK.events.push({ id: 'pre1', task_id: 'a3', kind: 'submitted', actor_id: 'u2', note: '', links: [{ url: 'https://www.facebook.com/old-stage1-link', channel: 'facebook' }], image_paths: [], phase: 'content', created_at: nowIso() });
  await login('zen'); showSection('tasks'); await sleep(300);
  openMine('a3'); await sleep(150);
  ok('ขั้นลิงก์โพสต์ (ครั้งแรก): ช่องลิงก์โซเชียลว่าง — ไม่หยิบลิงก์ที่แนบมาตอนขั้นไฟล์ไปใส่ให้', $('workSubC-facebook').value === '' && $('workSubC-instagram').value === '');
  setVal('workSubC-facebook', 'https://www.facebook.com/PioneerDjLabSiam/posts/777'); setVal('workSubC-instagram', 'https://www.instagram.com/reel/XyZ/');
  $('workSubLink').value = 'https://drive.google.com/file/d/HIDDEN-VALUE/view'; workSubRender();
  $('workSubGo').click(); await sleep(450);
  const hid = lastRpc('work_submit');
  ok('ช่องลิงก์ไฟล์ที่ซ่อนอยู่ (ขั้นลิงก์โพสต์) มีค่าค้าง: ไม่ถูกส่งไปกับการส่งงาน — ส่งแค่ลิงก์โพสต์ 2 ช่อง', !!hid && hid.args.p_task === 'a3' && hid.args.p_links.length === 2 && hid.args.p_links.every(l => !!l.channel), JSON.stringify(hid && hid.args.p_links));
  WORK.rpc.work_review('u4', { p_task: 'a3', p_verdict: 'changes', p_note: 'แก้ลิงก์ IG' });
  await loadWork(); await frames();
  openMine('a3'); await sleep(150);
  ok('ถูกส่งกลับแก้ในขั้นลิงก์โพสต์: เปิดส่งใหม่ ช่องลิงก์ใส่ค่ารอบก่อนให้ (แก้เฉพาะที่ผิด)', $('workSubC-facebook').value === 'https://www.facebook.com/PioneerDjLabSiam/posts/777' && $('workSubC-instagram').value === 'https://www.instagram.com/reel/XyZ/');
  closeAll(); await sleep(100);
  doLogout(); await sleep(400);

  // (f13) ผู้ดูแล: สรุป "เกินกำหนด (ยังไม่ส่ง)" ในแท็บตรวจงานนับเฉพาะใบที่ยังไม่ส่ง (b1 ส่งแล้วแต่เลยกำหนด ไม่นับ) · (v05 · v06) ความเห็นที่พิมพ์ค้างไม่หายตอน Realtime วาดใหม่ · (x08) ลิงก์รูปที่มาถึงหลังออกจากระบบไม่ถูกเก็บเข้าแคช
  WORK.seed();
  WORK.files.set('a5/00000000-0000-4000-8000-000000000001.webp', { size: 10, type: 'image/webp' });
  WORK.events.filter(e => e.task_id === 'a5' && e.kind === 'submitted').forEach(e => { e.image_paths = ['a5/00000000-0000-4000-8000-000000000001.webp']; });
  await login('nui'); showSection('tasks'); await sleep(300); tab('review'); await frames();
  ok('แท็บตรวจงานของผู้ดูแล: "เกินกำหนด (ยังไม่ส่ง)" = 1 (a1) — ไม่นับ b1 ที่ส่งแล้วแต่เลยกำหนด', txt('workRvLate') === '1', txt('workRvLate'));
  cardOf('#workQueue', 'a5').click(); await frames(); await sleep(200);
  $('workRvNote').value = 'ความเห็นที่พิมพ์ค้างไว้ยังไม่ได้กดส่ง';
  WORK.fireRt('work_tasks'); await sleep(900);
  ok('ผู้ตรวจพิมพ์ความเห็นค้างไว้ แล้ว Realtime วาดแผงใหม่: ข้อความไม่หาย · ยังเป็นใบเดิม', !!$('workRvNote') && $('workRvNote').value === 'ความเห็นที่พิมพ์ค้างไว้ยังไม่ได้กดส่ง' && $('workRvNote').dataset.for === 'a5');
  tab('req'); await frames();
  reqRow('q1').click(); await frames();
  $('workReqNote').value = 'ความเห็นต่อคำขอที่พิมพ์ค้างไว้';
  WORK.fireRt('work_requests'); await sleep(900);
  ok('ผู้ตอบพิมพ์ความเห็นต่อคำขอค้างไว้ แล้ว Realtime วาดใหม่: ข้อความไม่หาย · ยังเป็นคำขอเดิม', !!$('workReqNote') && $('workReqNote').value === 'ความเห็นต่อคำขอที่พิมพ์ค้างไว้' && $('workReqNote').dataset.for === 'q1');
  tab('review'); await frames();
  ok('(ตั้งต้น) ลิงก์รูปที่ขอไปแล้วถูกเก็บแคชในหน้า (รอบก่อนหน้า) — เปิดซ้ำไม่ต้องขอใหม่', Object.keys(work.signed).length === 1);
  work.signed = {};                                   // ล้างแคช ให้เปิดรอบถัดไปต้องขอลิงก์ใหม่จริง (ไม่งั้นตัวหน่วงไม่ถูกใช้)
  const signN0 = WORK.signed.length;
  let relSign = null; WORK.signGate = new Promise(r => { relSign = r; });
  cardOf('#workQueue', 'b1').click(); await frames(); cardOf('#workQueue', 'a5').click(); await frames(); await sleep(150);
  ok('(ตั้งต้น) เปิดหลักฐานที่มีรูป: ขอลิงก์รูปใหม่แล้วค้างรอคำตอบ · ยังไม่มีรูปแสดง · แคชยังว่าง', WORK.signed.length > signN0 && !!document.querySelector('#workDetail .wk-tile[data-path]') && !document.querySelector('#workDetail img') && Object.keys(work.signed).length === 0);
  doLogout(); await sleep(400);
  WORK.signGate = null; relSign(); await sleep(400);
  ok('ลิงก์รูปมาถึงหลังออกจากระบบ: ไม่ถูกเก็บเข้าแคชของหน้า (ของคนเดิมไม่ปนเข้าหน่วยความจำใหม่) · ไม่มีรูปค้างในหน้า', Object.keys(work.signed).length === 0 && !document.querySelector('#workDetail img'), JSON.stringify(Object.keys(work.signed)));

  // ── 13b. ปุ่มช่องทาง: เลือกแล้ว ✓ นำหน้า · บรรทัดสรุป/คำเตือนแดง · ปุ่มตั้งวันด่วนหน้าตาต่างจากชิป (เจ้าของอนุมัติ 5 ต.ค.) ──
  WORK.seed();
  await login('tibass'); showSection('tasks'); await sleep(300); tab('assign'); await frames();
  $('workNew').click(); await sleep(150);
  const chipTxt = ch => document.querySelector('#workfChans button[data-ch="' + ch + '"]').textContent;
  const chanSumEl = () => $('workfChanSum');
  ok('ฟอร์มใหม่ (ประเภทรูป ยังไม่เลือกช่องทาง): ไม่มีปุ่มไหนมี ✓ · มีคำเตือนแดง "ยังไม่ได้เลือกช่องทาง" (ตัวหนา) + บอกผลว่าไม่ต้องแนบลิงก์/ตรวจรอบเดียว', ['facebook', 'instagram', 'tiktok', 'youtube'].every(c => chipTxt(c).indexOf('✓') < 0) && /ยังไม่ได้เลือกช่องทาง/.test(txt('workfChanSum')) && /ตรวจรอบเดียว/.test(txt('workfChanSum')) && redTexts(chanSumEl()).some(t => t === 'ยังไม่ได้เลือกช่องทาง'));
  document.querySelector('#workfChans button[data-ch="youtube"]').click();
  ok('เลือก YouTube: ปุ่มเป็น "✓ YouTube" พื้นดำ · ปุ่มอื่นไม่มี ✓ · บรรทัดสรุป "เลือกแล้ว: YouTube" · คำเตือนแดงหาย', chipTxt('youtube') === '✓ YouTube' && chipTxt('facebook') === 'Facebook' && txt('workfChanSum') === 'เลือกแล้ว: YouTube' && !chanSumEl().querySelector('.wk-red') && getComputedStyle(document.querySelector('#workfChans button[data-ch="youtube"]')).backgroundColor === 'rgb(15, 15, 15)');
  document.querySelector('#workfChans button[data-ch="facebook"]').click();
  ok('เลือกสองช่อง: สรุปเรียงตามปุ่ม "เลือกแล้ว: Facebook, YouTube" · ทั้งสองปุ่มมี ✓', txt('workfChanSum') === 'เลือกแล้ว: Facebook, YouTube' && chipTxt('facebook') === '✓ Facebook' && chipTxt('youtube') === '✓ YouTube');
  document.querySelector('#workfChans button[data-ch="youtube"]').click();
  ok('กดซ้ำเพื่อยกเลิก YouTube: ✓ หาย · พื้นไม่ดำ · สรุปเหลือ Facebook (ตรงกับสถานะ ไม่ใช่แค่โฟกัส)', chipTxt('youtube') === 'YouTube' && getComputedStyle(document.querySelector('#workfChans button[data-ch="youtube"]')).backgroundColor !== 'rgb(15, 15, 15)' && txt('workfChanSum') === 'เลือกแล้ว: Facebook');
  document.querySelector('#workfChans button[data-ch="facebook"]').click();
  document.querySelector('#workfKind button[data-kind="video"]').click();
  ok('วิดีโอ/โพสต์โซเชียลที่ยังไม่เลือกช่องทาง: ขึ้นคำเตือนแดงเหมือนกัน', /ยังไม่ได้เลือกช่องทาง/.test(txt('workfChanSum')) && (document.querySelector('#workfKind button[data-kind="social_post"]').click(), /ยังไม่ได้เลือกช่องทาง/.test(txt('workfChanSum'))));
  document.querySelector('#workfKind button[data-kind="other"]').click();
  ok('งานประเภท "อื่น ๆ" ที่ไม่เลือกช่องทาง: ไม่ขึ้นคำเตือน (งานนี้ไม่มีโซเชียลเป็นปกติ)', txt('workfChanSum') === '');
  document.querySelector('#workfKind button[data-kind="video"]').click();
  ok('คำเตือนเป็นแค่ข้อความบนหน้าจอ ไม่บล็อกการสั่งงาน: ไม่เลือกช่องทางก็ยังกดสั่งได้ (ฐานยอมให้เป็นงานขั้นเดียว)', !$('workfSave').disabled);
  // ปุ่มตั้งวันด่วน: คนละแบบกับชิปที่เลือกได้
  const qb = [...document.querySelectorAll('#workFormDialog [data-quick]')];
  ok('ปุ่มตั้งวันด่วน (3 ปุ่ม): ไม่ใช่ชิปเลือกได้ (ไม่มี aria-pressed · ไม่ใช่ .wk-chipbtn) · กรอบประ · มีป้าย "ตั้งเร็ว:" · สูง ≥ 44px', qb.length === 3 && qb.every(b => !b.hasAttribute('aria-pressed') && !b.classList.contains('wk-chipbtn') && getComputedStyle(b).borderTopStyle === 'dashed' && b.getBoundingClientRect().height >= 43.5) && /ตั้งเร็ว:/.test(document.querySelector('#workFormDialog .wk-quick').textContent));
  document.querySelector('#workFormDialog [data-quick="tomorrow"]').click();
  ok('กด "พรุ่งนี้ 12:00": ใส่วันที่พรุ่งนี้ + เวลา 12:00 · ปุ่มไม่ติดสถานะเลือก (ไม่ดำ ไม่มี ✓)', /^\\d{4}-\\d{2}-\\d{2}$/.test($('workfDate').value) && $('workfTime').value === '12:00' && getComputedStyle(document.querySelector('#workFormDialog [data-quick="tomorrow"]')).backgroundColor !== 'rgb(15, 15, 15)' && document.querySelector('#workFormDialog [data-quick="tomorrow"]').textContent === 'พรุ่งนี้ 12:00');
  document.querySelector('#workFormDialog [data-quick="none"]').click();
  ok('กด "ไม่มีกำหนด": ล้างวันที่และเวลา', $('workfDate').value === '' && $('workfTime').value === '');
  // ภาพตัวอย่างฟอร์ม (ถ่ายเมื่อสั่ง WORK_SHOTS)
  setVal('workfTitle', 'ตัด Short จาก Podcast EP2'); setVal('workfDetail', 'ตัด Short EP2 อย่างน้อย 3 VDO');
  document.querySelector('#workfChans button[data-ch="youtube"]').click(); document.querySelector('#workfChans button[data-ch="tiktok"]').click();
  document.querySelector('#workFormDialog [data-quick="today"]').click();
  [...document.querySelectorAll('#workfPeople label')].find(x => x.textContent.indexOf('Nutty') >= 0).querySelector('input').click();
  if (${JSON.stringify(!!SHOTS)}) await shot('work-form-chips.png');
  // แก้ใบ: ปุ่มช่องทางของใบเดิมมี ✓ ตรงกับช่องที่เลือกไว้
  closeAll(); await sleep(100);
  workFormOpen('a3'); await sleep(150);
  ok('เปิดแก้ใบที่ระบุช่อง Facebook + Instagram: ปุ่มทั้งสองมี ✓ · สรุป "เลือกแล้ว: Facebook, Instagram"', chipTxt('facebook') === '✓ Facebook' && chipTxt('instagram') === '✓ Instagram' && chipTxt('tiktok') === 'TikTok' && txt('workfChanSum') === 'เลือกแล้ว: Facebook, Instagram');
  closeAll(); await sleep(100);
  doLogout(); await sleep(400);

  // ── 13. ใช้ฟอร์มซ้ำหลายรอบในหน้าเดียว (บั๊กจากการใช้งานจริง 5 ต.ค.: สั่งงานใบแรกได้ ใบถัดไปปุ่ม "สั่งงาน" เป็นสีเทากดไม่ได้ จนกว่าจะรีโหลดหน้า) ──
  // เทสต์เดิมใช้ form.requestSubmit() ซึ่งข้ามปุ่มที่ถูกปิด — ชุดนี้กดปุ่มจริงทุกครั้ง และไม่รีโหลดหน้าระหว่างรอบ
  WORK.seed();
  await login('tibass'); showSection('tasks'); await sleep(300); tab('assign'); await frames();
  const saveBtn = () => $('workfSave');
  const createBase = rpcs('work_create').length;                 // เทียบจำนวนครั้งเรียกแบบสัมพัทธ์ (CALLS สะสมมาจากหัวข้อก่อนหน้า)
  const pickPerson = name => { const l = [...document.querySelectorAll('#workfPeople label')].find(x => x.textContent.indexOf(name) >= 0); l.querySelector('input').click(); };
  const createRound = async (title, who, kind, chan, between) => {
    const n0 = rpcs('work_create').length;
    $('workNew').click(); await sleep(120);
    const fresh = { open: dlgOpen('workFormDialog'), btnOn: !saveBtn().disabled, titleEmpty: $('workfTitle').value === '', noneChecked: document.querySelectorAll('#workfPeople input:checked').length === 0, headNew: txt('workfHead') === 'สั่งงานใหม่' };
    setVal('workfTitle', title);
    document.querySelector('#workfKind button[data-kind="' + kind + '"]').click();
    document.querySelector('#workfChans button[data-ch="' + chan + '"]').click();
    pickPerson(who);
    if (between) between();
    const chip = document.querySelector('#workfChans button[data-ch="' + chan + '"]');
    const chipOn = chip.getAttribute('aria-pressed') === 'true' && getComputedStyle(chip).backgroundColor === 'rgb(15, 15, 15)' && getComputedStyle(chip).color === 'rgb(255, 255, 255)';   // เลือกแล้ว = พื้นดำตัวขาว (ไม่ใช่แค่กรอบโฟกัส)
    const othersOff = [...document.querySelectorAll('#workfChans button')].filter(x => x !== chip).every(x => x.getAttribute('aria-pressed') === 'false' && getComputedStyle(x).backgroundColor !== 'rgb(15, 15, 15)');
    const readyBtn = !saveBtn().disabled;
    saveBtn().click(); await sleep(450);
    const sent = lastRpc('work_create');
    return { fresh, readyBtn, chipOn, othersOff, sentChan: sent ? sent.args.p_channels.join() : '', calls: rpcs('work_create').length - n0, closed: !dlgOpen('workFormDialog'), toast: toast() };
  };
  const cr1 = await createRound('ตัด Short จาก Podcast EP2', 'Nui', 'video', 'youtube');
  ok('สั่งงานใบที่ 1: ฟอร์มใหม่ (ปุ่มกดได้ · ไม่มีค่าค้าง) → กดปุ่ม "สั่งงาน" จริง → work_create 1 ครั้ง · ฟอร์มปิด · ข้อความ "สั่งงานแล้ว 1 ใบ"', cr1.fresh.open && cr1.fresh.btnOn && cr1.fresh.titleEmpty && cr1.fresh.noneChecked && cr1.fresh.headNew && cr1.readyBtn && cr1.calls === 1 && cr1.closed && /สั่งงานแล้ว 1 ใบ/.test(cr1.toast), JSON.stringify(cr1));
  ok('หลังสั่งสำเร็จ: ปุ่ม "สั่งงาน" ไม่ถูกปิดค้าง (บั๊กเดิม: disabled ค้างจนรีโหลดหน้า)', !saveBtn().disabled && workForm === null, 'disabled=' + saveBtn().disabled);
  const cr2 = await createRound('ถ่ายรูปหน้าร้านลงเพจ', 'Pran', 'photo', 'facebook');
  ok('สั่งงานใบที่ 2 ติดกัน (ไม่รีโหลดหน้า): ฟอร์มใหม่ ปุ่มกดได้ → ส่งได้ · work_create ถูกเรียก 1 ครั้ง · ฟอร์มปิด', cr2.fresh.open && cr2.fresh.btnOn && cr2.fresh.titleEmpty && cr2.fresh.noneChecked && cr2.readyBtn && cr2.calls === 1 && cr2.closed, JSON.stringify(cr2));
  // Realtime รีโหลดคั่นระหว่างรอบ (หน้าถูกวาดใหม่ แต่ฟอร์มและปุ่มต้องไม่เพี้ยน)
  WORK.fireRt('work_tasks'); WORK.fireRt('work_task_events'); await sleep(900);
  const cr3 = await createRound('จัดโต๊ะห้องซ้อมใหม่', 'Nutty', 'other', 'tiktok');
  ok('สั่งงานใบที่ 3 หลัง Realtime รีโหลดคั่น: ปุ่มกดได้ → ส่งได้ · ฟอร์มปิด', cr3.fresh.btnOn && cr3.fresh.titleEmpty && cr3.readyBtn && cr3.calls === 1 && cr3.closed, JSON.stringify(cr3));
  ok('ปุ่มช่องทางที่เลือก (ทั้ง 3 รอบ ในหน้าเดียวไม่รีโหลด): ขึ้นพื้นดำตัวขาว + aria-pressed=true · ปุ่มอื่นไม่ดำ · ช่องที่ส่งไปฟังก์ชันตรงกับที่เลือก (youtube / facebook / tiktok)', [cr1, cr2, cr3].every(x => x.chipOn && x.othersOff) && cr1.sentChan === 'youtube' && cr2.sentChan === 'facebook' && cr3.sentChan === 'tiktok', JSON.stringify([cr1, cr2, cr3]));
  const created = WORK.tasks.filter(t => ['ตัด Short จาก Podcast EP2', 'ถ่ายรูปหน้าร้านลงเพจ', 'จัดโต๊ะห้องซ้อมใหม่'].includes(t.title));
  ok('ฐานเก็บครบ 3 ใบ (ผู้รับ Nui · Pran · Nutty ตามที่เลือก) · ผู้สั่ง = เจ้าของ · ใบวิดีโอ/รูปที่มีช่องทาง = ขั้น 1', created.length === 3 && created.find(t => t.title.indexOf('Short') >= 0).assignee_id === 'u4' && created.find(t => t.title.indexOf('หน้าร้าน') >= 0).assignee_id === 'u6' && created.find(t => t.title.indexOf('โต๊ะ') >= 0).assignee_id === 'u3' && created.every(t => t.created_by === 'u1') && created.filter(t => t.phase === 'content').length === 2);
  // Realtime เข้ามาตอนฟอร์มเปิดค้างอยู่: ที่กรอก/ติ๊กไว้ต้องไม่หาย และกดส่งได้
  $('workNew').click(); await sleep(120);
  setVal('workfTitle', 'งานที่กรอกค้างตอน Realtime เข้า'); pickPerson('Zen');
  WORK.fireRt('work_tasks'); await sleep(900);
  ok('Realtime รีโหลดตอนฟอร์มเปิดอยู่: หัวข้อ/ผู้รับที่ติ๊กไว้ไม่หาย · ปุ่มยังกดได้', dlgOpen('workFormDialog') && $('workfTitle').value === 'งานที่กรอกค้างตอน Realtime เข้า' && document.querySelectorAll('#workfPeople input:checked').length === 1 && !saveBtn().disabled);
  saveBtn().click(); await sleep(450);
  ok('กดส่งหลัง Realtime คั่น: สร้างสำเร็จ (ใบที่ 4)', !dlgOpen('workFormDialog') && WORK.tasks.some(t => t.title === 'งานที่กรอกค้างตอน Realtime เข้า' && t.assignee_id === 'u2') && !saveBtn().disabled);
  // ปิดด้วยปุ่ม "ปิด" / Esc แล้วเปิดใหม่: ล้างค่า · ปุ่มกดได้
  $('workNew').click(); await sleep(100); setVal('workfTitle', 'พิมพ์ค้างแล้วปิด'); pickPerson('Fah');
  $('workfCancel').click(); await sleep(100);
  $('workNew').click(); await sleep(100);
  ok('ปิดฟอร์มกลางคัน (ปุ่ม "ปิด") แล้วเปิดใหม่: ค่าที่พิมพ์ไว้ถูกล้าง ไม่มีผู้รับค้างติ๊ก · ปุ่มกดได้', $('workfTitle').value === '' && document.querySelectorAll('#workfPeople input:checked').length === 0 && !saveBtn().disabled && workForm && workForm.busy === false);
  $('workfSave').click(); await sleep(100);
  ok('กดส่งทั้งที่ยังไม่กรอก: ขึ้นคำเตือน ไม่เรียกฟังก์ชัน · ปุ่มยังกดได้ (ไม่ค้างเป็นสีเทา)', /ใส่หัวข้องาน/.test(txt('workfErr')) && !saveBtn().disabled && rpcs('work_create').length - createBase === 4);
  setVal('workfTitle', 'ลืมเลือกผู้รับ'); saveBtn().click(); await sleep(100);
  ok('ลืมเลือกผู้รับ: ขึ้นคำเตือน · ปุ่มยังกดได้', /เลือกผู้รับงานอย่างน้อย 1 คน/.test(txt('workfErr')) && !saveBtn().disabled);
  // ฐานข้อมูลล้ม แล้วกดซ้ำได้
  pickPerson('Fah'); WORK.fail.rpc_work_create = 'ฐานข้อมูลล่ม';
  saveBtn().click(); await sleep(350);
  ok('ฐานข้อมูลล้ม: บอกข้อผิดพลาดตามจริง · ฟอร์มยังเปิด · ปุ่มกลับมากดได้', dlgOpen('workFormDialog') && /สั่งงานไม่สำเร็จ: ฐานข้อมูลล่ม/.test(txt('workfErr')) && !saveBtn().disabled);
  delete WORK.fail.rpc_work_create;
  saveBtn().click(); await sleep(450);
  ok('ฐานกลับมา กดซ้ำ: สร้างสำเร็จ · ฟอร์มปิด · ปุ่มไม่ค้าง', !dlgOpen('workFormDialog') && WORK.tasks.some(t => t.title === 'ลืมเลือกผู้รับ' && t.assignee_id === 'u5') && !saveBtn().disabled);
  // กันกดซ้ำยังต้องทำงาน (กดสองทีติดกันระหว่างรอฐานข้อมูล = สร้างครั้งเดียว)
  $('workNew').click(); await sleep(100); setVal('workfTitle', 'กดสองทีติดกัน'); pickPerson('Pran');
  let relDbl = null; WORK.gate = new Promise(r => { relDbl = r; });
  const dN = rpcs('work_create').length;
  saveBtn().click(); await sleep(50);
  ok('กดส่งแล้วค้างรอฐานข้อมูล: ปุ่มถูกปิดทันที (กันกดซ้ำ)', saveBtn().disabled);
  saveBtn().click(); workFormSave(); await sleep(50);
  WORK.gate = null; relDbl(); await sleep(500);
  ok('กดซ้ำระหว่างรอ: work_create ถูกเรียกครั้งเดียว · หลังเสร็จปุ่มกลับมากดได้ (ไม่ค้าง) · สร้างใบเดียว', rpcs('work_create').length - dN === 1 && WORK.tasks.filter(t => t.title === 'กดสองทีติดกัน').length === 1 && !saveBtn().disabled && !dlgOpen('workFormDialog'));
  // แก้ใบซ้ำหลายรอบ (ปุ่มเดียวกัน)
  const mineNow = WORK.tasks.filter(t => t.created_by === 'u1' && t.status === 'open').slice(0, 2);
  const editOnce = async (id, title) => {
    const n0 = rpcs('work_edit').length;
    workFormOpen(id); await sleep(120);
    const before = !saveBtn().disabled;
    setVal('workfTitle', title); saveBtn().click(); await sleep(450);
    return { before, calls: rpcs('work_edit').length - n0, closed: !dlgOpen('workFormDialog') };
  };
  const ed1 = await editOnce(mineNow[0].id, 'แก้ชื่อรอบที่ 1'), ed2 = await editOnce(mineNow[1].id, 'แก้ชื่อรอบที่ 2'), ed3 = await editOnce(mineNow[0].id, 'แก้ชื่อรอบที่ 3');
  ok('แก้ใบติดกัน 3 รอบ (ใบเดิมซ้ำด้วย): ทุกรอบปุ่มกดได้ → work_edit ถูกเรียก · ฟอร์มปิด', [ed1, ed2, ed3].every(e => e.before && e.calls === 1 && e.closed), JSON.stringify([ed1, ed2, ed3]));
  doLogout(); await sleep(400);

  // ส่งงาน/ยื่นคำขอ ซ้ำหลายรอบด้วยปุ่มจริง
  WORK.seed();
  await login('zen'); showSection('tasks'); await sleep(300);
  openMine('a4'); await sleep(120); setVal('workSubC-facebook', 'https://www.facebook.com/PioneerDjLabSiam/posts/1'); $('workSubGo').click(); await sleep(450);
  ok('ส่งงานใบที่ 1 ด้วยปุ่มจริง: สำเร็จ', taskOnServer('a4').status === 'submitted' && !dlgOpen('workSubDialog'));
  openMine('a1'); await sleep(120); setVal('workSubLink', 'https://drive.google.com/file/d/1/view');
  ok('เปิดส่งงานใบที่ 2 ต่อทันที: ปุ่ม "ส่งไฟล์ให้ตรวจ" กดได้ (ไม่ค้างจากใบแรก)', !$('workSubGo').disabled);
  $('workSubGo').click(); await sleep(450);
  ok('ส่งงานใบที่ 2 ติดกัน: สำเร็จ', taskOnServer('a1').status === 'submitted' && !dlgOpen('workSubDialog'));
  tab('req'); await frames();
  const reqOnce = async body => { const n0 = rpcs('work_request_create').length; $('workReqNew').click(); await sleep(120); const on = !$('workrGo').disabled === false; setVal('workrBody', body); const ready = !$('workrGo').disabled; $('workrGo').click(); await sleep(450); return { ready, calls: rpcs('work_request_create').length - n0, closed: !dlgOpen('workReqDialog') }; };
  const rq1 = await reqOnce('ขอลาครึ่งวันพรุ่งนี้'), rq2 = await reqOnce('ขอสลับเวรกับ Nutty'), rq3 = await reqOnce('ขอเบิกอุปกรณ์ทำความสะอาด');
  ok('ยื่นคำขอติดกัน 3 ใบด้วยปุ่มจริง: ทุกรอบปุ่มกดได้ → ส่งได้ · หน้าต่างปิด · ฐานมี 3 คำขอใหม่', [rq1, rq2, rq3].every(q => q.ready && q.calls === 1 && q.closed) && WORK.reqs.filter(r => r.requester_id === 'u2' && ['ขอลาครึ่งวันพรุ่งนี้', 'ขอสลับเวรกับ Nutty', 'ขอเบิกอุปกรณ์ทำความสะอาด'].includes(r.body)).length === 3, JSON.stringify([rq1, rq2, rq3]));
  doLogout(); await sleep(400);
  // บัญชีที่ถูกปิด
  await login('ghost');
  ok('บัญชีที่ถูกปิด (Ghost): เข้าระบบไม่ได้ · ไม่ดึงงานเลย', !!document.getElementById('loginError').textContent && rpcs('work_create').length < 99 && work.tasks.length === 0 && badge() === '');

  done();
}
function done() {
  L('=== สรุป: ' + pass + ' PASS / ' + fail + ' FAIL ===');
  L(fail ? 'RESULT:FAIL' : 'RESULT:PASS');
}
</script>`;

const net = '--host-resolver-rules=MAP * ~NOTFOUND';
const res = await runCdpPage({ root: pageRoot, file: 'desk.html', mock: MOCK3 + WORK_MOCK, tests: TESTS, width: 1440, height: 900, coarse: false, shotDir: SHOTS, flags: [net] });
console.log('\n=== desk-worklist: ' + (res.ok ? 'ผ่าน' : 'ไม่ผ่านหรือไม่ได้รันจนจบ') + ' ===');
process.exit(res.ok ? 0 : 1);
