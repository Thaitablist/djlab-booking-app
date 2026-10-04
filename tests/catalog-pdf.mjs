/**
 * เทสต์ "ลากไฟล์ PDF ใส่ตอนกรอกโปร" ของหมวด ราคา / โปรโมชัน (desk.html · migration 036 + Edge Function promo-read)
 *   รัน: node tests/catalog-pdf.mjs
 *   ถ่ายภาพ: CATALOG_PDF_SHOTS=<โฟลเดอร์> node tests/catalog-pdf.mjs
 *
 * เจ้าของร้านสั่ง 4 ต.ค. 69: "ลากไฟล์ PDF ใส่ได้" ตอบว่า "ทั้งสองอย่าง" = (1) ให้ Claude อ่านแล้วกรอกฟอร์มให้ (ร่าง — ไม่บันทึกอัตโนมัติ) (2) เก็บต้นฉบับแนบกับโปร
 * ฐานข้อมูลปลอม: tests/lib/catalog-mock.mjs (Storage ถัง promo-docs · ฟังก์ชัน promo-read · สิทธิ์ · ขนาด · ลิงก์อายุสั้น) · ฝั่งฟังก์ชันจริงทดสอบแยกที่ Stock App/scripts/test-promo-read-function.mjs
 *
 * 1. กล่องลากไฟล์: ตรวจชนิด/ขนาด/หัวไฟล์ · วางตรงไหนของหน้าต่างก็ได้ · ลากลงแท็บโปรตรง ๆ · เลือกไฟล์ด้วยปุ่ม · หลายไฟล์
 * 2. อ่านแล้วกรอกให้: ค้างรอ · กรอกช่อง · ดีลร่างติ๊กได้เฉพาะที่ไม่มีปัญหา · ยังไม่บันทึกอะไร · ผลที่มาช้าถูกทิ้ง · error ทุกแบบ
 * 3. บันทึก: อัปโหลด → แนบ → ดีลที่ติ๊ก · ล้มกลางทางไม่ทิ้งไฟล์กำพร้า · ยังไม่รัน 036 · เปิดดูต้นฉบับด้วยลิงก์อายุสั้น
 * 4. แก้โปรที่มีไฟล์: เปลี่ยน/เอาออก · staff เห็นชื่อไฟล์แต่เปิดไม่ได้ · ไม่มีอะไรหลุดข้ามบัญชี
 */

import { dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { mkdirSync } from 'node:fs';
import { HARNESS } from './lib/page-test.mjs';
import { runCdpPage } from './lib/cdp-page.mjs';
import { CAT_MOCK } from './lib/catalog-mock.mjs';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const { MOCK: MOCK3 } = await import(pathToFileURL(join(root, 'tests/desk-home3.mjs')).href);
const SHOTS = process.env.CATALOG_PDF_SHOTS || null;
const pageRoot = process.env.CATALOG_PDF_ROOT || root;   // ทดสอบหน้าฉบับอื่น (mutation) ได้
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
const txt = el => (el ? el.textContent.replace(/\\s+/g, ' ').trim() : '');
const writes = table => CALLS.filter(c => c.table === table && ['insert', 'update', 'delete'].includes(c.op));
const uploads = () => CALLS.filter(c => c.op === 'storage.upload');
const removes = () => CALLS.filter(c => c.op === 'storage.remove');
const fatal = () => (document.getElementById('fatalError') || {}).textContent || '';
const clearFatal = () => { const f = document.getElementById('fatalError'); if (f) f.remove(); };
const promoCard = id => document.querySelector('#promoList .promo[data-id="' + id + '"]');
const fresh = async () => { CAT.reset(); catReset(); CALLS.length = 0; clearFatal(); await loadProducts(); await loadCatalog(); renderAll(); };
const dlgErr = id => { const e = $(id); return e && !e.hidden ? e.textContent : ''; };
const status = () => ($('pfReadStatus').hidden ? '' : $('pfReadStatus').textContent);
const PATH_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}[.]pdf$/;
const pdfBytes = extra => new TextEncoder().encode('%PDF-1.4\\n' + (extra || 'memo ทดสอบ') + '\\n%%EOF');
const mkFile = (name, bytes, type) => new File([bytes], name, { type: type === undefined ? 'application/pdf' : type });
const goodPdf = name => mkFile(name || 'memo ผู้นำเข้า ต.ค. 2569.pdf', pdfBytes());
const dt = files => { const d = new DataTransfer(); files.forEach(f => d.items.add(f)); return d; };
const fire = (el, type, files) => { const ev = new DragEvent(type, { dataTransfer: dt(files || []), bubbles: true, cancelable: true }); el.dispatchEvent(ev); return ev; };
const showTab = async t => { document.querySelector('#catTabs button[data-tab="' + t + '"]').click(); await sleep(100); };
const openAdd = async () => { $('promoAdd').click(); await sleep(150); };
const openFresh = async () => { await fresh(); showSection('catalog'); await sleep(250); await showTab('promos'); await openAdd(); };
const setVal = (id, v) => { $(id).value = v; $(id).dispatchEvent(new Event('input', { bubbles: true })); $(id).dispatchEvent(new Event('change', { bubbles: true })); };
const submit = async () => { $('promoForm').requestSubmit(); await sleep(450); };
const draftBoxes = () => [...document.querySelectorAll('#pfDraft input[data-i]')];
const pdfCalls = () => CAT.pdf.calls;

async function runTests() {
  L('=== ลากไฟล์ PDF ใส่โปร ===');
  await login('tibass');

  // ── 1. กล่องลากไฟล์ ───────────────────────────────────────────────────
  await openFresh();
  ok('หน้าต่างเพิ่มโปรมีกล่องลากไฟล์ (เป็นปุ่ม กดเลือกไฟล์ได้ด้วยคีย์บอร์ด) พร้อมคำอธิบาย: 6 MB · เก็บแนบ · ส่งให้ Claude อ่าน',
    $('promoDlg').open && vis($('pfDrop')) && $('pfDrop').tagName === 'BUTTON' && /6 MB/.test($('pfDrop').textContent) && /ส่งไปให้ Claude อ่าน/.test($('pfDrop').textContent) && /ลากไฟล์ PDF/.test($('pfDropText').textContent));
  ok('ก่อนเลือกไฟล์: ไม่มีชิปไฟล์ · ไม่มีปุ่มอ่าน · ไม่มีรายการดีลร่าง · ไม่มีข้อความสถานะ', $('pfPdfChip').hidden && $('pfRead').hidden && $('pfDraft').hidden && $('pfReadStatus').hidden);
  ok('ช่องเลือกไฟล์รับเฉพาะ PDF', $('pfFile').accept.indexOf('application/pdf') >= 0 && $('pfFile').hidden);

  const evOver = fire($('pfName'), 'dragover', [goodPdf()]);
  ok('ลากไฟล์ผ่านเหนือหน้าต่าง (ตรงไหนก็ได้): กรอบกล่องเปลี่ยนเป็นโหมดวาง และเบราว์เซอร์ไม่เปิดไฟล์ทับหน้าแอป (preventDefault)', $('pfDrop').classList.contains('over') && evOver.defaultPrevented);
  fire($('promoDlg'), 'dragleave', []);
  ok('ลากออกจากหน้าต่าง: กรอบกลับเป็นปกติ', !$('pfDrop').classList.contains('over'));
  const textDrag = new DragEvent('dragover', { dataTransfer: (() => { const d = new DataTransfer(); d.setData('text/plain', 'x'); return d; })(), bubbles: true, cancelable: true });
  $('pfName').dispatchEvent(textDrag);
  ok('ลากข้อความธรรมดา (ไม่ใช่ไฟล์): ไม่แตะ ไม่กั้นพฤติกรรมเดิมของเบราว์เซอร์', !textDrag.defaultPrevented && !$('pfDrop').classList.contains('over'));

  // ปฏิเสธไฟล์ที่ไม่ใช่ PDF
  fire($('promoDlg'), 'drop', [mkFile('รายการ.txt', new TextEncoder().encode('hello'), 'text/plain')]); await sleep(120);
  ok('วางไฟล์ .txt: ไม่รับ · แจ้งว่าไม่ใช่ PDF · ไม่มีชิปไฟล์', /ไม่ใช่ PDF/.test(status()) && vis($('pfReadStatus')) && $('pfPdfChip').hidden && $('pfReadStatus').classList.contains('alert-red'));
  fire($('promoDlg'), 'drop', [mkFile('ปลอม.pdf', new TextEncoder().encode('MZ-not-a-pdf'), 'application/pdf')]); await sleep(120);
  ok('ชื่อ .pdf แต่เนื้อไฟล์ไม่ใช่ PDF จริง: ไม่รับ (ตรวจหัวไฟล์ %PDF-)', /ไม่ใช่ PDF จริง/.test(status()) && $('pfPdfChip').hidden);
  fire($('promoDlg'), 'drop', [mkFile('ว่าง.pdf', new Uint8Array(0))]); await sleep(120);
  ok('ไฟล์ว่าง 0 ไบต์: ไม่รับ', /ว่างเปล่า/.test(status()) && $('pfPdfChip').hidden);
  fire($('promoDlg'), 'drop', [mkFile('ใหญ่.pdf', new Uint8Array(6 * 1024 * 1024 + 1))]); await sleep(120);
  ok('ไฟล์ใหญ่เกิน 6 MB: ไม่รับ · บอกขนาดจริงและให้ลดขนาด', /ใหญ่เกิน 6 MB/.test(status()) && /6\\.0 MB/.test(status()) && $('pfPdfChip').hidden, status());
  ok('ไม่มีอะไรถูกส่ง/เขียนจากการวางไฟล์ที่ถูกปฏิเสธ', !uploads().length && !pdfCalls().length && !writes('promotions').length);
  fire($('promoDlg'), 'drop', [mkFile('ตัวหนา.PDF', pdfBytes(), '')]); await sleep(120);
  ok('นามสกุลตัวพิมพ์ใหญ่ .PDF ชนิดไฟล์ว่าง (เบราว์เซอร์บางตัวไม่บอก) แต่หัวไฟล์เป็น PDF: รับ', !$('pfPdfChip').hidden && txt($('pfPdfName')) === 'ตัวหนา.PDF', status());
  $('pfPdfRemove').click(); await sleep(80);
  ok('กด "เอาออก": ชิปหาย · ปุ่มอ่านหาย', $('pfPdfChip').hidden && $('pfRead').hidden);

  // รับไฟล์ปกติ — วางตรงตัวหน้าต่าง (ไม่ใช่ตรงกล่อง)
  const evDrop = fire($('pfName'), 'drop', [goodPdf()]); await sleep(150);
  ok('วางไฟล์ PDF ตรงช่องชื่อโปร (ไม่ใช่ที่กล่อง): รับ · ไม่เปิดไฟล์ทับหน้า · กรอบกลับปกติ', evDrop.defaultPrevented && !$('pfPdfChip').hidden && !$('pfDrop').classList.contains('over'));
  ok('ชิปไฟล์: ชื่อ · ขนาด · บอกว่าจะแนบตอนกดบันทึก · มีปุ่ม "อ่านแล้วกรอกให้" และ "เอาออก" · ไม่มีปุ่มเปิดดู (ยังไม่เคยแนบ)', txt($('pfPdfName')) === 'memo ผู้นำเข้า ต.ค. 2569.pdf' && /KB · จะแนบกับโปรนี้ตอนกดบันทึก/.test($('pfPdfSize').textContent) && vis($('pfRead')) && vis($('pfPdfRemove')) && $('pfPdfView').hidden);
  ok('ข้อความกล่องเปลี่ยนเป็นชวนเปลี่ยนไฟล์', /เปลี่ยน/.test($('pfDropText').textContent));
  ok('รับไฟล์แล้วยังไม่ส่งอะไรออกไป (ต้องกด "อ่านแล้วกรอกให้" เอง) และยังไม่อัปโหลด', !pdfCalls().length && !uploads().length);
  await shot('catalog-pdf-dropped');

  fire($('promoDlg'), 'drop', [mkFile('ข้อความ.txt', new TextEncoder().encode('x'), 'text/plain'), goodPdf('แรก.pdf'), goodPdf('สอง.pdf')]); await sleep(150);
  ok('วางหลายไฟล์ (txt + PDF สองไฟล์): ใช้ PDF ไฟล์แรก · บอกให้รู้ว่าใส่ได้ทีละไฟล์', txt($('pfPdfName')) === 'แรก.pdf' && /ใช้ไฟล์แรก: แรก.pdf/.test(status()) && $('pfReadStatus').classList.contains('alert-warn'), status());
  let clicked = 0; const origClick = $('pfFile').click; $('pfFile').click = () => { clicked++; };
  $('pfDrop').click();
  ok('กดที่กล่อง: เปิดตัวเลือกไฟล์ของเครื่อง', clicked === 1);
  $('pfFile').click = origClick;
  $('pfFile').files = dt([goodPdf('จากปุ่ม.pdf')]).files; $('pfFile').dispatchEvent(new Event('change', { bubbles: true })); await sleep(150);
  ok('เลือกไฟล์ด้วยตัวเลือกของเครื่อง: รับเหมือนลากวาง · ล้างช่องเลือกไฟล์ (เลือกไฟล์เดิมซ้ำได้)', txt($('pfPdfName')) === 'จากปุ่ม.pdf' && $('pfFile').value === '');
  const xssName = '<img src=x onerror="window.__xss=7">.pdf';
  fire($('promoDlg'), 'drop', [goodPdf(xssName)]); await sleep(150);
  ok('ชื่อไฟล์มีแท็ก HTML แสดงเป็นตัวอักษร ไม่ใช่แท็ก (XSS)', txt($('pfPdfName')) === xssName && !$('pfPdfChip').querySelector('img') && !window.__xss);

  // ── 2. อ่านแล้วกรอกให้ ─────────────────────────────────────────────────
  fire($('promoDlg'), 'drop', [goodPdf('memo ผู้นำเข้า ต.ค. 2569.pdf')]); await sleep(150);
  let rel = null; CAT.pdf.gate = new Promise(r => { rel = r; });
  CALLS.length = 0;
  $('pfRead').click(); await sleep(200);
  ok('กดอ่านแล้วกรอกให้: บอกว่ากำลังส่งให้ Claude อ่าน (ใช้เวลา) · ปุ่มกล่อง/อ่าน/เอาออกถูกปิดกันกดซ้ำ', /กำลังส่งให้ Claude อ่าน/.test(status()) && $('pfRead').disabled && $('pfDrop').disabled && $('pfPdfRemove').disabled);
  ok('ส่งไปที่ฟังก์ชัน promo-read ด้วย base64 ของไฟล์ (หัวไฟล์ %PDF-) และชื่อไฟล์ — ไม่ส่งอย่างอื่น', pdfCalls().length === 1 && pdfCalls()[0].head.startsWith('%PDF-') && pdfCalls()[0].file_name === 'memo ผู้นำเข้า ต.ค. 2569.pdf' && CALLS.filter(c => c.op === 'fn').length === 1 && Object.keys(CALLS.find(c => c.op === 'fn').body).sort().join() === 'file_name,pdf_base64', JSON.stringify(pdfCalls()));
  await submit();
  ok('กดบันทึกระหว่างที่ยังอ่านอยู่: ไม่บันทึก · บอกให้รอ · ไม่อัปโหลดไฟล์', /รอให้เสร็จก่อนบันทึก/.test(dlgErr('pfErr')) && !writes('promotions').length && !uploads().length);
  fire($('promoDlg'), 'drop', [goodPdf('แทรก.pdf')]); await sleep(100);
  ok('วางไฟล์ใหม่ระหว่างอ่าน: ไม่รับ (ไฟล์เดิมยังอยู่)', txt($('pfPdfName')) === 'memo ผู้นำเข้า ต.ค. 2569.pdf');
  CAT.pdf.gate = null; rel(); await sleep(350);
  ok('อ่านเสร็จ: ปุ่มกลับมาใช้ได้ · ข้อความบอกว่าเป็น "ร่าง ยังไม่ได้บันทึกอะไร" ให้ตรวจกับต้นฉบับ · บอกจำนวนครั้งที่ใช้วันนี้', !$('pfRead').disabled && !$('pfDrop').disabled && /นี่คือร่าง ยังไม่ได้บันทึกอะไร/.test(status()) && /1\\/10 ครั้ง/.test(status()) && $('pfReadStatus').classList.contains('alert-warn'), status());
  ok('ฟอร์มถูกกรอกจากเอกสาร: ชื่อโปร · รหัสที่เสนอ · วันเริ่ม/สิ้นสุด · เงื่อนไข (บรรทัดละข้อ) · ที่มา + ชื่อไฟล์', $('pfName').value === 'โปรจากเอกสาร' && $('pfCode').value === 'doc-promo-2026-10' && $('pfStart').value === TODAY && $('pfEnd').value > TODAY &&
    $('pfConds').value === 'เงื่อนไขจากเอกสาร ข้อ 1\\nเงื่อนไขจากเอกสาร ข้อ 2' && $('pfSource').value === 'memo ผู้นำเข้า ฉบับ 1 ต.ค. · จากไฟล์ PDF: memo ผู้นำเข้า ต.ค. 2569.pdf', $('pfSource').value);
  ok('ยังไม่ได้บันทึกอะไร: ไม่มีการเขียนโปร/ดีล ไม่มีการอัปโหลด (ร่างเท่านั้น)', !writes('promotions').length && !writes('promotion_deals').length && !uploads().length);
  ok('รายการดีลร่าง 6 รายการ + คำเตือนจากเอกสาร 2 ข้อ', vis($('pfDraft')) && draftBoxes().length === 6 && /เอกสารไม่ระบุสีของ HDJ-CUE1/.test($('pfDraft').textContent) && /ราคาชุดที่ 5/.test($('pfDraft').textContent));
  ok('ดีลที่ไม่มีปัญหาถูกติ๊กให้ (3 ดีล: ลด % · เซ็ต · ของแถม) — ที่มีปัญหาไม่ถูกติ๊กและติ๊กไม่ได้ (disabled)', draftBoxes().map(b => (b.checked ? 1 : 0) + (b.disabled ? 'd' : '')).join() === '1,1,1,0d,0d,0d', draftBoxes().map(b => (b.checked ? 1 : 0) + (b.disabled ? 'd' : '')).join());
  const dd = i => txt(draftBoxes()[i].closest('.draft-deal'));
  ok('ดีลลด %: ชื่อรุ่น · ลด 12.5% → ราคาโปรคำนวณด้วยสูตรเดียวกับบอท ฿95,375 · ข้อความอ้างอิงจากเอกสาร', /CDJ-3000X — ลด 12\\.5% → ฿95,375/.test(dd(0)) && /ในเอกสาร: CDJ-3000X ลด 12\\.5%/.test(dd(0)), dd(0));
  ok('ดีลเซ็ต: DDJ-FLX2 + HDJ-CUE1 ราคาเซ็ต ฿8,500 (ปกติรวม ฿10,480) · ชื่อเซ็ต', /DDJ-FLX2 \\+ HDJ-CUE1 — ราคาเซ็ต ฿8,500 \\(ปกติรวม ฿10,480\\) · ชุด FLX2 \\+ CUE1/.test(dd(1)), dd(1));
  ok('ดีลของแถม: ชื่อของแถมที่มีแท็ก HTML แสดงเป็นตัวอักษร (XSS) · มูลค่า ฿350', /DM-40D — ราคาปกติ \\+ แถม สายแจ็ค <b>x<\\/b> \\(มูลค่า ฿350\\)/.test(dd(2)) && !draftBoxes()[2].closest('.draft-deal').querySelector('b'), dd(2));
  ok('ดีลที่ไม่พบรุ่น: รุ่นที่ไม่พบขีดฆ่า · บอกปัญหา "ไม่พบรุ่นในรายการสินค้า"', /ไม่พบรุ่นในรายการสินค้า: XDJ-ZZ/.test(dd(3)) && !!draftBoxes()[3].closest('.draft-deal').querySelector('s'));
  ok('ดีลเซ็ตที่ราคาไม่ต่ำกว่าปกติรวม: หน้าตรวจเองเหมือนที่ฐานข้อมูลจะปฏิเสธ — บอกตัวเลขทั้งสอง', /ราคาเซ็ต \\(฿99,999\\) ต้องต่ำกว่าราคาปกติรวม \\(฿19,490\\)/.test(dd(4)), dd(4));
  ok('ดีลของรุ่นเลิกขาย (CDJ-3000): บอกว่าเข้าโปรไม่ได้', /มีรุ่นเลิกขาย — เข้าโปรไม่ได้/.test(dd(5)));
  draftBoxes()[1].click(); await sleep(60);
  ok('เอาติ๊กดีลที่สองออกได้ (เก็บสถานะที่เลือกไว้)', cat.pdf.deals[1].on === false && draftBoxes()[1].checked === false);
  draftBoxes()[1].click(); await sleep(60);
  await shot('catalog-pdf-draft');

  // เปลี่ยนไฟล์ = ล้างร่างเก่า แต่คงช่องที่กรอกแล้ว
  fire($('promoDlg'), 'drop', [goodPdf('ฉบับแก้.pdf')]); await sleep(150);
  ok('เลือกไฟล์ใหม่หลังอ่าน: รายการดีลร่างของไฟล์เก่าหาย (ไม่ปนกับไฟล์ใหม่) · ช่องที่กรอกแล้วคงอยู่', $('pfDraft').hidden && cat.pdf.deals === null && $('pfName').value === 'โปรจากเอกสาร');

  // error ทุกแบบ — ไฟล์ยังอยู่ แนบเก็บได้ กรอกมือได้
  for (const [mode, re, label] of [['quota', /ครบ 10 ครั้งแล้ว/, 'ครบโควตา'], ['not_configured', /ยังไม่ได้ติดตั้งหรือตั้งค่าตัวอ่าน PDF/, 'ยังไม่ตั้งค่า'], ['busy', /Claude ไม่ว่างชั่วคราว/, 'Claude ไม่ว่าง'], ['forbidden', /เฉพาะเจ้าของร้านหรือผู้ดูแล/, 'ไม่มีสิทธิ์']]) {
    CAT.pdf.mode = mode; $('pfRead').click(); await sleep(300);
    ok(label + ': แจ้งสีแดงตามจริง · ไม่กรอกอะไรทับ · ไฟล์ยังอยู่ · ปุ่มอ่านกลับมากดใหม่ได้ · ไม่มีดีลร่าง', re.test(status()) && $('pfReadStatus').classList.contains('alert-red') && !$('pfPdfChip').hidden && !$('pfRead').disabled && $('pfDraft').hidden && $('pfName').value === 'โปรจากเอกสาร', status());
  }
  CAT.pdf.mode = 'ok';

  // ผลที่มาช้าถูกทิ้ง: ปิดหน้าต่างระหว่างอ่าน
  rel = null; CAT.pdf.gate = new Promise(r => { rel = r; });
  setVal('pfName', 'พิมพ์ไว้เอง'); setVal('pfConds', 'ข้อเดิม');
  $('pfRead').click(); await sleep(150);
  $('promoDlg').close(); await sleep(100);
  CAT.pdf.gate = null; rel(); await sleep(350);
  ok('ปิดหน้าต่างระหว่างอ่านแล้วผลมาทีหลัง: ถูกทิ้ง — ไม่มีร่างในหน่วยความจำ · ไม่มีไฟล์ค้าง · ไม่เขียนทับช่องที่ผู้ใช้พิมพ์ไว้', cat.pdf.draft === null && cat.pdf.deals === null && cat.pdf.file === null && !$('promoDlg').open && $('pfName').value === 'พิมพ์ไว้เอง' && $('pfConds').value === 'ข้อเดิม', $('pfName').value + ' | ' + $('pfConds').value);
  await openAdd();
  ok('เปิดหน้าต่างเพิ่มโปรใหม่หลังจากนั้น: ว่างเปล่า (ไม่มีชื่อไฟล์/ร่าง/ข้อความสถานะของรอบก่อน)', $('pfPdfChip').hidden && $('pfDraft').hidden && $('pfReadStatus').hidden && $('pfName').value === '' && $('pfConds').value === '' && $('pfSource').value === '');

  // ── 3. บันทึก ────────────────────────────────────────────────────────
  await openFresh();
  fire($('promoDlg'), 'drop', [goodPdf('memo ผู้นำเข้า ต.ค. 2569.pdf')]); await sleep(150);
  $('pfRead').click(); await sleep(350);
  draftBoxes()[2].click(); await sleep(50);                      // เอาของแถมออก — บันทึกแค่ 2 ดีล
  CALLS.length = 0;
  await submit();
  ok('บันทึก: อัปโหลดไฟล์ก่อน ไปถังที่ถูกต้อง ด้วยชื่อ <uuid>.pdf · ชนิด application/pdf · ไม่ทับไฟล์เดิม (upsert=false) · ขนาดตรงไฟล์', uploads().length === 1 && uploads()[0].bucket === 'promo-docs' && PATH_RE.test(uploads()[0].path) && uploads()[0].type === 'application/pdf' && uploads()[0].upsert === false && uploads()[0].size === goodPdf().size, JSON.stringify(uploads()));
  const upPath = uploads()[0] && uploads()[0].path;
  const pIns = writes('promotions').filter(c => c.op === 'insert')[0];
  ok('บันทึกโปร: แนบพาธ+ชื่อไฟล์ตัวเดิม (ไม่ใช้ชื่อไฟล์เป็นพาธ — กัน ../ และชื่อซ้ำ) · ที่มาเป็นข้อความที่ผู้ใช้เห็นในฟอร์ม', !!pIns && pIns.payload.source_file_path === upPath && pIns.payload.source_file_name === 'memo ผู้นำเข้า ต.ค. 2569.pdf' && pIns.payload.name === 'โปรจากเอกสาร' && pIns.payload.code === 'doc-promo-2026-10' && /จากไฟล์ PDF/.test(pIns.payload.source_note), JSON.stringify(pIns && pIns.payload));
  const dIns = writes('promotion_deals').filter(c => c.op === 'insert');
  ok('เพิ่มเฉพาะดีลที่ติ๊ก (2 ดีล: ลด % + เซ็ต — ไม่มีของแถมที่เอาติ๊กออก/ดีลที่มีปัญหา) ตามลำดับ sort_order 1,2 · ผูกกับโปรที่เพิ่งสร้าง', dIns.length === 2 && dIns.map(c => c.payload.kind).join() === 'percent,set_price' && dIns.map(c => c.payload.sort_order).join() === '1,2' && dIns.every(c => /^pr-new/.test(c.payload.promotion_id)), JSON.stringify(dIns.map(c => c.payload)));
  ok('payload ของดีล: ลด % ส่ง percent 12.5 ช่องอื่น null · เซ็ตส่งราคา 8500 + ชื่อเซ็ต + product_ids ตามลำดับ', JSON.stringify(dIns[0].payload.product_ids) === '["a1"]' && dIns[0].payload.percent === 12.5 && dIns[0].payload.set_price === null && dIns[1].payload.set_price === 8500 && dIns[1].payload.label === 'ชุด FLX2 + CUE1' && JSON.stringify(dIns[1].payload.product_ids) === '["a3","a4"]');
  ok('ผลสุดท้าย: หน้าต่างปิด · ไฟล์อยู่ในถัง · แจ้ง "แนบ PDF ต้นฉบับแล้ว · ดีลจาก PDF เข้า 2 จาก 2" · ย้อนกลับไม่ได้ (เพิ่ม)', !$('promoDlg').open && CAT.files.has(upPath) && $('catUndoText').textContent === 'เพิ่มโปร โปรจากเอกสาร แล้ว · แนบ PDF ต้นฉบับแล้ว · ดีลจาก PDF เข้า 2 จาก 2' && $('catUndoBtn').hidden, $('catUndoText').textContent);
  const newId = CAT.promos[CAT.promos.length - 1].id;
  ok('การ์ดโปรใหม่: มีบรรทัด "📎 เอกสารต้นฉบับ: ชื่อไฟล์" + ปุ่มเปิดดู · ดีลสองรายการขึ้นพร้อมราคาโปร', /📎 เอกสารต้นฉบับ: memo ผู้นำเข้า ต.ค. 2569.pdf/.test(txt(promoCard(newId))) && !!promoCard(newId).querySelector('button[data-act="pfile"]') && /฿95,375/.test(txt(promoCard(newId))) && /฿8,500/.test(txt(promoCard(newId))));
  await shot('catalog-pdf-saved');

  // เปิดดูต้นฉบับ
  const realOpen = window.open; const fakeWin = { closed: false, opener: 'x', location: { href: '' }, close() { this.closed = true; } };
  window.open = () => fakeWin; CALLS.length = 0;
  promoCard(newId).querySelector('button[data-act="pfile"]').click(); await sleep(250);
  ok('กดเปิดดู: เปิดแท็บเปล่าในจังหวะที่กด แล้วขอลิงก์อายุสั้น 120 วินาทีจากถังส่วนตัว · พาแท็บไปที่ลิงก์ · ตัดการเชื่อมกับหน้าแอป (opener)', CALLS.filter(c => c.op === 'storage.sign').length === 1 && CALLS.find(c => c.op === 'storage.sign').path === upPath && CALLS.find(c => c.op === 'storage.sign').secs === 120 &&
    fakeWin.location.href.indexOf('https://signed.test/promo-docs/' + upPath) === 0 && fakeWin.opener === null && !fakeWin.closed, fakeWin.location.href);
  window.open = () => null; promoCard(newId).querySelector('button[data-act="pfile"]').click(); await sleep(250);
  ok('เบราว์เซอร์บล็อกหน้าต่างใหม่: แจ้งให้อนุญาตป๊อปอัป (ไม่เงียบ)', /บล็อกหน้าต่างใหม่/.test($('toast').textContent), $('toast').textContent);
  CAT.signFail = true; fakeWin.closed = false; fakeWin.location.href = ''; window.open = () => fakeWin;
  promoCard(newId).querySelector('button[data-act="pfile"]').click(); await sleep(250);
  ok('ขอลิงก์ไม่สำเร็จ (ไฟล์หาย): ปิดแท็บเปล่าที่เปิดไว้ · แจ้งบนจอตามจริง ไม่ปล่อยแท็บว่างค้าง', fakeWin.closed === true && /เปิดเอกสารต้นฉบับไม่สำเร็จ/.test(fatal()) && fakeWin.location.href === '', fatal());
  clearFatal(); CAT.signFail = false; window.open = realOpen;

  // ── ล้มกลางทาง ───────────────────────────────────────────────────────
  const prepared = async () => { await openFresh(); fire($('promoDlg'), 'drop', [goodPdf('ล้ม.pdf')]); await sleep(150); setVal('pfName', 'โปรทดสอบล้ม'); setVal('pfCode', 'fail-test'); CALLS.length = 0; };
  await prepared(); CAT.storeFail = 'boom storage'; await submit();
  ok('อัปโหลดไฟล์ไม่สำเร็จ: แจ้งในหน้าต่าง · ไม่บันทึกโปรเลย · หน้าต่างยังเปิด (ข้อมูลที่กรอกไม่หาย) · ปุ่มบันทึกกดซ้ำได้', /อัปโหลดไฟล์ไม่สำเร็จ: boom storage/.test(dlgErr('pfErr')) && !writes('promotions').length && $('promoDlg').open && !$('pfSave').disabled && $('pfName').value === 'โปรทดสอบล้ม');
  CAT.storeFail = null; CAT.noBucket = true; await submit();
  ok('ยังไม่รัน 036 (ไม่มีถัง): บอกชัดว่าต้องรัน migration 036 · บอกทางออก (เอาไฟล์ออกแล้วบันทึกได้)', /ต้อง|ยังไม่ได้รัน migration 036/.test(dlgErr('pfErr')) && /ไม่มีถังเก็บไฟล์ promo-docs/.test(dlgErr('pfErr')) && !writes('promotions').length, dlgErr('pfErr'));
  CAT.noBucket = false;
  CAT.noFileCols = true; CALLS.length = 0; await submit();
  ok('ถังมีแต่ตารางยังไม่มีช่องแนบไฟล์ (รัน 036 ไม่ครบ): ข้อความภาษาไทยบอก 036 · ไฟล์ที่เพิ่งอัปถูกลบทิ้งทันที (ไม่ทิ้งไฟล์กำพร้า)', /ยังไม่ได้รัน migration 036 \\(ไม่มีช่องแนบไฟล์/.test(dlgErr('pfErr')) && uploads().length === 1 && removes().length === 1 && removes()[0].paths[0] === uploads()[0].path && CAT.files.size === 0, dlgErr('pfErr'));
  CAT.noFileCols = false; CALLS.length = 0;
  CAT.fail.insert = 'duplicate boom'; CAT.fail.table = 'promotions'; await submit();
  ok('บันทึกโปรล้มหลังอัปโหลดแล้ว: ลบไฟล์ที่เพิ่งอัปออกจากถัง · แจ้ง error ในหน้าต่าง · หน้าต่างยังเปิด', uploads().length === 1 && removes().length === 1 && CAT.files.size === 0 && /duplicate boom/.test(dlgErr('pfErr')) && $('promoDlg').open, dlgErr('pfErr'));
  CAT.fail = {};
  setVal('pfCode', 'starter-pack'); CALLS.length = 0; await submit();
  ok('รหัสโปรซ้ำ (ฐานข้อมูลปฏิเสธหลังอัปโหลด): ลบไฟล์กำพร้า · ข้อความไทย', /รหัสโปรนี้มีอยู่แล้ว/.test(dlgErr('pfErr')) && uploads().length === 1 && CAT.files.size === 0 && removes().length === 1);
  $('promoDlg').close();
  await prepared(); CAT.denyWrite = true; await submit();               // fresh() รีเซ็ต denyWrite จึงต้องตั้งหลัง prepared
  ok('RLS ปฏิเสธตอนเพิ่มโปร (insert มี error ภาษาอังกฤษจากฐานข้อมูล): แปลเป็นไทยในหน้าต่าง · ไฟล์ที่เพิ่งอัปถูกลบทิ้ง · ไม่ขึ้นว่าสำเร็จ', /ไม่มีสิทธิ์ทำรายการนี้/.test(dlgErr('pfErr')) && !/row-level/.test(dlgErr('pfErr')) && uploads().length === 1 && removes().length === 1 && !/แนบ PDF/.test($('catUndoText').textContent) && $('promoDlg').open && CAT.files.size === 0, dlgErr('pfErr'));
  CAT.denyWrite = false; $('promoDlg').close();

  // ดีลบางรายการเข้าไม่ได้ — โปรยังบันทึก ดีลอื่นยังเข้า และบอกครบ
  await openFresh(); fire($('promoDlg'), 'drop', [goodPdf('บางดีล.pdf')]); await sleep(150); $('pfRead').click(); await sleep(350);
  FAKE.products.find(p => p.id === 'a5').is_active = false;      // DM-40D เลิกขายในฐานข้อมูลหลังอ่านเสร็จ (หน้ายังไม่รู้) → ตัวกันของฐานข้อมูลปฏิเสธดีลของแถม
  ok('(ตั้งต้น) ติ๊กดีลของแถมของ DM-40D ไว้ (หน้ายังเห็นว่าขายอยู่)', draftBoxes()[2].checked && !draftBoxes()[2].disabled);
  CALLS.length = 0; await submit();
  ok('ดีลหนึ่งถูกฐานข้อมูลปฏิเสธ: โปรบันทึกแล้ว · ดีลอื่นเข้า (2 จาก 3) · ข้อความสีแดงบอกว่าดีลไหนเข้าไม่ได้เพราะอะไร (ข้อความไทยจากตัวกัน) · ไม่ขึ้นว่าสำเร็จทั้งหมด',
    !$('promoDlg').open && writes('promotion_deals').filter(c => c.op === 'insert').length === 3 && CAT.deals.filter(d => /^d-new/.test(d.id)).length === 2 && /ดีลจาก PDF เข้า 2 จาก 3 \\(เข้าไม่ได้ 1/.test($('catUndoText').textContent) &&
    /DM-40D \\(ราคาปกติ \\+ ของแถม\\): รุ่นที่เลิกขาย \\(ติ๊กออก\\) เข้าโปรไม่ได้: DM-40D/.test(fatal()), fatal() + ' | ' + $('catUndoText').textContent);
  clearFatal();

  // ── 4. แก้โปรที่มีไฟล์แนบ ─────────────────────────────────────────────
  await fresh(); showSection('catalog'); await sleep(250); await showTab('promos');
  const OLD = '11111111-2222-4333-8444-555555555555.pdf';
  CAT.promos.find(p => p.id === 'pr1').source_file_path = OLD; CAT.promos.find(p => p.id === 'pr1').source_file_name = 'memo เดิม.pdf';
  CAT.files.set(OLD, { size: 99, type: 'application/pdf' });
  await loadCatalog();
  ok('โปรที่มีไฟล์แนบ: การ์ดแสดงชื่อไฟล์ + ปุ่มเปิดดู (เจ้าของ)', /📎 เอกสารต้นฉบับ: memo เดิม.pdf/.test(txt(promoCard('pr1'))) && !!promoCard('pr1').querySelector('button[data-act="pfile"]'));
  promoCard('pr1').querySelector('button[data-act="pedit"]').click(); await sleep(150);
  ok('แก้โปร: ชิปแสดงไฟล์ที่แนบไว้ (ไม่ใช่ไฟล์ใหม่) · ไม่มีปุ่ม "อ่านแล้วกรอกให้" (ใช้กับโปรใหม่เท่านั้น — ไม่ทับโปรที่กรอกไว้แล้ว) · มีปุ่มเปิดดู · ปุ่มเอาออกบอกว่า "เอาไฟล์ที่แนบไว้ออก"',
    !$('pfPdfChip').hidden && txt($('pfPdfName')) === 'memo เดิม.pdf' && /แนบไว้กับโปรนี้แล้ว/.test($('pfPdfSize').textContent) && $('pfRead').hidden && !$('pfPdfView').hidden && $('pfPdfRemove').textContent === 'เอาไฟล์ที่แนบไว้ออก');
  setVal('pfName', 'ลด 10% มหาจักร (แก้)'); CALLS.length = 0; await submit();
  const u0 = writes('promotions').filter(c => c.op === 'update')[0];
  ok('แก้ชื่ออย่างเดียว ไม่แตะไฟล์: payload ไม่มี source_file_* · ไม่อัปโหลด · ไม่ลบไฟล์', !!u0 && !('source_file_path' in u0.payload) && !('source_file_name' in u0.payload) && !uploads().length && !removes().length && CAT.files.has(OLD));
  promoCard('pr1').querySelector('button[data-act="pedit"]').click(); await sleep(150);
  fire($('promoDlg'), 'drop', [goodPdf('ฉบับใหม่.pdf')]); await sleep(150);
  ok('ลากไฟล์ใหม่ลงโปรที่มีไฟล์เดิม: ชิปเปลี่ยนเป็นไฟล์ใหม่ · ยังไม่มีปุ่มอ่าน (โหมดแก้)', txt($('pfPdfName')) === 'ฉบับใหม่.pdf' && $('pfRead').hidden && $('pfPdfView').hidden);
  CALLS.length = 0; await submit();
  const u1 = writes('promotions').filter(c => c.op === 'update')[0], newPath = uploads()[0] && uploads()[0].path;
  ok('บันทึก: อัปโหลดไฟล์ใหม่ · update พาธ+ชื่อใหม่ · ลบไฟล์เก่าออกจากถัง (ไม่ทิ้งของเก่า) · แจ้ง "แนบ PDF ใหม่"', uploads().length === 1 && !!u1 && u1.payload.source_file_path === newPath && u1.payload.source_file_name === 'ฉบับใหม่.pdf' && removes().length === 1 && removes()[0].paths[0] === OLD && !CAT.files.has(OLD) && CAT.files.has(newPath) && /แนบ PDF ใหม่/.test($('catUndoText').textContent), $('catUndoText').textContent);
  ok('ย้อนกลับของการแก้โปรยังเป็นการแก้ (ไฟล์ในถังไม่ย้อนด้วยปุ่มนี้ — ตรงกับที่ 036 ไม่แตะ undo_activity)', !$('catUndoBtn').hidden);
  promoCard('pr1').querySelector('button[data-act="pedit"]').click(); await sleep(150);
  $('pfPdfRemove').click(); await sleep(80);
  ok('กด "เอาไฟล์ที่แนบไว้ออก": ชิปหาย · กล่องกลับเป็นข้อความตั้งต้น', $('pfPdfChip').hidden && /ลากไฟล์ PDF ของโปร/.test($('pfDropText').textContent));
  CALLS.length = 0; await submit();
  const u2 = writes('promotions').filter(c => c.op === 'update')[0];
  ok('บันทึก: ตั้ง source_file_path/name เป็น null ทั้งคู่ · ลบไฟล์ในถัง · ไม่อัปโหลด · แจ้ง "เอาไฟล์แนบออก" · การ์ดไม่มีบรรทัดเอกสารต้นฉบับแล้ว', !!u2 && u2.payload.source_file_path === null && u2.payload.source_file_name === null && removes().length === 1 && removes()[0].paths[0] === newPath && !uploads().length && /เอาไฟล์แนบออก/.test($('catUndoText').textContent) && !/เอกสารต้นฉบับ/.test(txt(promoCard('pr1'))));
  promoCard('pr1').querySelector('button[data-act="pedit"]').click(); await sleep(150);
  ok('เปิดแก้โปรที่ไม่มีไฟล์แล้ว: ไม่มีชิปค้างจากรอบก่อน', $('pfPdfChip').hidden && $('pfDraft').hidden);
  $('promoDlg').close();

  // ── ลากลงแท็บโปรโดยตรง ───────────────────────────────────────────────
  await fresh(); showSection('catalog'); await sleep(250); await showTab('promos');
  const evPane = fire($('catPanePromos'), 'dragover', [goodPdf()]);
  ok('ลากไฟล์เหนือแท็บโปรโมชัน (หน้าต่างยังไม่เปิด): ยอมให้วาง (preventDefault) ไม่ให้เบราว์เซอร์เปิดไฟล์ทับหน้า', evPane.defaultPrevented);
  const evPaneDrop = fire($('catPanePromos'), 'drop', [goodPdf('ลากตรง.pdf')]); await sleep(250);
  ok('วางลงแท็บโปรโมชันตรง ๆ: เปิดหน้าต่างเพิ่มโปรให้พร้อมไฟล์ที่วาง (ไม่ต้องกดเพิ่มโปรก่อน)', evPaneDrop.defaultPrevented && $('promoDlg').open && !cat.promoId && txt($('pfPdfName')) === 'ลากตรง.pdf' && vis($('pfRead')));
  $('promoDlg').close();
  const evPaneText = new DragEvent('dragover', { dataTransfer: (() => { const d = new DataTransfer(); d.setData('text/plain', 'x'); return d; })(), bubbles: true, cancelable: true });
  $('catPanePromos').dispatchEvent(evPaneText);
  ok('ลากข้อความ (ไม่ใช่ไฟล์) เหนือแท็บ: ไม่ยุ่ง', !evPaneText.defaultPrevented);

  // ── สไตล์ ────────────────────────────────────────────────────────────
  await openFresh(); fire($('promoDlg'), 'drop', [goodPdf('สไตล์.pdf')]); await sleep(150); $('pfRead').click(); await sleep(350);
  const els = [...document.querySelectorAll('#pfPdfBox *, #pfDraft *')].filter(e => vis(e) && e.children.length === 0 && e.textContent.trim());
  ok('ตัวหนังสือในส่วน PDF ทุกจุด ≥ 14px', els.every(e => parseFloat(getComputedStyle(e).fontSize) >= 13.95), els.filter(e => parseFloat(getComputedStyle(e).fontSize) < 13.95).slice(0, 3).map(e => e.className + ':' + getComputedStyle(e).fontSize).join(' | '));
  ok('ทุกมุมเป็นเหลี่ยม (กล่องลากไฟล์ · ชิปไฟล์ · การ์ดดีลร่าง)', [...document.querySelectorAll('#pfDrop, #pfPdfChip, .draft-deal, #pfReadStatus')].every(e => getComputedStyle(e).borderRadius === '0px'));
  ok('เป้ากดในส่วน PDF ≥ 44×44 บนจอสัมผัส: กล่องลากไฟล์ · ช่องติ๊กดีล (ทั้งป้าย)', $('pfDrop').getBoundingClientRect().height >= 44 && draftBoxes().every(b => b.closest('label').getBoundingClientRect().height >= 43.5));
  ok('ขอบกล่องลากไฟล์เป็นเส้นประ (บอกว่าวางได้) ไม่ใช้สีอย่างเดียว · มีคำอธิบายเป็นข้อความ', getComputedStyle($('pfDrop')).borderStyle === 'dashed' && /ลากไฟล์ PDF/.test($('pfDrop').textContent));
  $('promoDlg').close();

  // ── staff ────────────────────────────────────────────────────────────
  doLogout(); await sleep(400);
  ok('ออกจากระบบ: ชิปไฟล์ · ร่างดีล · ข้อความสถานะ หายจากหน้า (DOM ถูกล้าง ไม่ใช่แค่ซ่อน)', $('pfPdfChip').hidden && $('pfDraft').innerHTML === '' && $('pfReadStatus').hidden && cat.pdf.file === null && cat.pdf.deals === null && !/สไตล์.pdf|CDJ-3000X/.test($('pfPdfBox').textContent + $('pfDraft').textContent));
  await login('zen'); CALLS.length = 0; CAT.pdf.calls.length = 0;
  CAT.promos.find(p => p.id === 'pr2').source_file_path = '22222222-3333-4444-8555-666666666666.pdf'; CAT.promos.find(p => p.id === 'pr2').source_file_name = 'memo ลับ.pdf';
  showSection('catalog'); await sleep(350); await showTab('promos');
  ok('staff: เห็นชื่อไฟล์แนบของโปร (อ่านแถวโปรได้เหมือนช่องอื่น) แต่ไม่มีปุ่มเปิดดู · มีข้อความบอกว่าเปิดได้เฉพาะเจ้าของร้าน/ผู้ดูแล', /📎 เอกสารต้นฉบับ: memo ลับ.pdf \\(เปิดดูได้เฉพาะเจ้าของร้านหรือผู้ดูแล\\)/.test(txt(promoCard('pr2'))) && !promoCard('pr2').querySelector('button[data-act="pfile"]'));
  const fk = fire($('catPanePromos'), 'drop', [goodPdf('staff.pdf')]); await sleep(200);
  promoOpen(null); promoOpenFile('pr2'); await pdfPick([goodPdf('staff2.pdf')]); await pdfRead(); await sleep(200);
  cat.pdf.file = goodPdf('ฝังตรงๆ.pdf'); await pdfRead(); await sleep(200); cat.pdf.file = null;      // ฝังไฟล์เข้าสถานะเอง (ข้ามด่านรับไฟล์) แล้วเรียกอ่านตรง ๆ — ด่านสิทธิ์ของตัวอ่านเองต้องกันไว้อีกชั้น
  ok('staff ลากไฟล์/เรียกฟังก์ชันตรง ๆ: ไม่มีหน้าต่างเปิด · ไม่รับไฟล์ · ไม่ส่งอะไรให้ Claude · ไม่ขอลิงก์ · ไม่อัปโหลด · ไม่เขียนฐานข้อมูล · ไม่มีข้อความ error แดง', !fk.defaultPrevented && !$('promoDlg').open && cat.pdf.file === null && !pdfCalls().length && !CALLS.some(c => c.op === 'storage.sign' || c.op === 'storage.upload') && !writes('promotions').length && !fatal(),
    JSON.stringify({ prevented: fk.defaultPrevented, open: $('promoDlg').open, file: !!cat.pdf.file, reads: pdfCalls().length, io: CALLS.filter(c => c.op === 'storage.sign' || c.op === 'storage.upload').length, writes: writes('promotions').length, fatal: fatal().slice(0, 120) }));

  L('=== สรุป: ' + pass + ' PASS / ' + fail + ' FAIL ===');
  L(fail ? 'RESULT:FAIL' : 'RESULT:PASS');
}
</script>`;

const net = '--host-resolver-rules=MAP * ~NOTFOUND';
const res = await runCdpPage({ root: pageRoot, file: 'desk.html', mock: MOCK3 + CAT_MOCK, tests: TESTS, width: 1440, height: 900, coarse: true, shotDir: SHOTS, flags: [net] });
console.log('\n=== catalog-pdf: ' + (res.ok ? 'ผ่าน' : 'ไม่ผ่านหรือไม่ได้รันจนจบ') + ' ===');
process.exit(res.ok ? 0 : 1);
