/**
 * เทสต์หมวด "ราคา / โปรโมชัน" ของ desk.html (#catalog · migration 035)
 *   รัน: node tests/catalog.mjs
 *   ถ่ายภาพ: CATALOG_SHOTS=<โฟลเดอร์> node tests/catalog.mjs
 *
 * ตัวรัน CDP เดียวกับ desk-ops · ฐานข้อมูลปลอมอยู่ที่ tests/lib/catalog-mock.mjs (จำลอง RLS: staff เขียน "สำเร็จ" แต่ไม่โดนแถว · ตัวกันดีล · รหัสซ้ำ · log · undo_activity)
 * ราคาโปรที่หน้าคำนวณ (dealCalc) ต้องตรงกับที่ฐานข้อมูลคำนวณจริง — เทียบกับ SQL จริงใน Console/sql-tests/test-catalog-calc.mjs
 *
 * 1. dealCalc: สูตรราคาโปร (ปัดครึ่งขึ้น) · ดีลที่ถูกข้าม "พัก — …"
 * 2. เจ้าของร้าน: เมนู · สรุป · รายการตามประเภท · ตัวกรอง · ติ๊กขายอยู่/เลิกขาย + ข้อความ "ถอดออกจากโปร" · ย้อนกลับ · แก้รุ่น
 * 3. โปรโมชัน: การ์ด · พักดีล · เพิ่ม/แก้/ปิดโปร · เพิ่ม/แก้/ลบดีล (ลด % · เซ็ต · ของแถม) · ข้อความเตือนสี
 * 4. ส่งออก promotions.json · ยังไม่ติดตั้ง 035 · XSS · ขนาดตัวอักษร/มุมเหลี่ยม
 * 5. admin (เขียนได้) · staff (ดูได้อย่างเดียว · ไม่มีคำขอเขียนไปถึงฐานข้อมูล) · ออกจากระบบแล้วไม่มีอะไรค้างหน้า
 */

import { dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { mkdirSync } from 'node:fs';
import { HARNESS } from './lib/page-test.mjs';
import { runCdpPage } from './lib/cdp-page.mjs';
import { CAT_MOCK } from './lib/catalog-mock.mjs';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const { MOCK: MOCK3 } = await import(pathToFileURL(join(root, 'tests/desk-home3.mjs')).href);
const SHOTS = process.env.CATALOG_SHOTS || null;
const pageRoot = process.env.CATALOG_ROOT || root;   // ทดสอบหน้าฉบับอื่น (mutation) ได้
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
const row = id => document.querySelector('#catList tr[data-id="' + id + '"]');
const chk = id => row(id).querySelector('input[data-act="toggle"]');
const promoCard = id => document.querySelector('#promoList .promo[data-id="' + id + '"]');
const dealEl = id => document.querySelector('#promoList .deal[data-deal="' + id + '"]');
const txt = el => (el ? el.textContent.replace(/\\s+/g, ' ').trim() : '');
const noteText = () => $('catUndoText').textContent;
const writes = table => CALLS.filter(c => c.table === table && ['insert', 'update', 'delete'].includes(c.op));
const rpcs = fn => CALLS.filter(c => c.op === 'rpc' && c.fn === fn);
const fatal = () => (document.getElementById('fatalError') || {}).textContent || '';
const clearFatal = () => { const f = document.getElementById('fatalError'); if (f) f.remove(); };
const byIdMap = () => new Map(FAKE.products.map(p => [p.id, p]));
const prod = id => FAKE.products.find(p => p.id === id);
const deal = id => CAT.deals.find(d => d.id === id);
const promo = id => CAT.promos.find(p => p.id === id);
const pp = id => products.find(p => p.id === id);                 // สำเนาที่หน้าถืออยู่ (prod = แถวในฐานข้อมูลปลอม)
const fresh = async () => { CAT.reset(); catReset(); CALLS.length = 0; clearFatal(); await loadProducts(); await loadCatalog(); renderAll(); };
const setVal = (id, v) => { $(id).value = v; $(id).dispatchEvent(new Event('input', { bubbles: true })); $(id).dispatchEvent(new Event('change', { bubbles: true })); };
const showTab = async t => { document.querySelector('#catTabs button[data-tab="' + t + '"]').click(); await sleep(100); };
const pick = id => document.querySelector('#dfPick input[value="' + id + '"]');
async function submit(formId) { $(formId).requestSubmit(); await sleep(300); }
const dlgErr = id => { const e = $(id); return e && !e.hidden ? e.textContent : ''; };

async function runTests() {
  L('=== ราคา / โปรโมชัน (#catalog) ===');
  // ── 1. dealCalc: สูตรเดียวกับ promotions_as_json() ───────────────────────
  const M = new Map([['x1', { id: 'x1', sell_price: 7490, is_active: true, model_code: 'X1' }], ['x2', { id: 'x2', sell_price: 2990, is_active: true, model_code: 'X2' }],
    ['h1', { id: 'h1', sell_price: 1001, is_active: true, model_code: 'H1' }], ['off', { id: 'off', sell_price: 100, is_active: false, model_code: 'OFF' }],
    ['nc', { id: 'nc', sell_price: 100, is_active: true, model_code: null }], ['z', { id: 'z', sell_price: 0, is_active: true, model_code: 'Z' }],
    ['t1', { id: 't1', sell_price: 1000, is_active: true, model_code: 'T1' }], ['t2', { id: 't2', sell_price: 99.5, is_active: true, model_code: 'T2' }]]);
  const pc = (ids, pct) => dealCalc({ kind: 'percent', product_ids: ids, percent: pct }, M);
  ok('ลด 10% จาก 109,000 = 98,100 (ตัวอย่างในบรีฟ)', dealCalc({ kind: 'percent', product_ids: ['a1'], percent: 10 }, byIdMap()).promo === 98100 && dealCalc({ kind: 'percent', product_ids: ['a1'], percent: 10 }, byIdMap()).disc === '10%');
  ok('ลด 12.5% จาก 7,490 = 6,553.75 ปัดครึ่งขึ้นเป็น 6,554 · ป้ายส่วนลดตัดศูนย์ท้าย "12.5%"', pc(['x1'], 12.5).promo === 6554 && pc(['x1'], 12.5).disc === '12.5%', JSON.stringify(pc(['x1'], 12.5)));
  ok('ลด 33% จาก 7,490 = 5,018.3 → 5,018', pc(['x1'], 33).promo === 5018);
  ok('ปัดครึ่งขึ้นตรงขอบ: 1,001 ลด 50% = 500.5 → 501 (ตรงกับ round ของ numeric ใน Postgres ไม่ใช่ปัดเลขคู่)', pc(['h1'], 50).promo === 501);
  ok('ลด 15% จาก 2,990 = 2,541.5 → 2,542', pc(['x2'], 15).promo === 2542);
  const sp = (ids, price) => dealCalc({ kind: 'set_price', product_ids: ids, set_price: price }, M);
  ok('ราคาเซ็ต 8,990 จากรวม 10,480: ลด "ประมาณ 14%" · ราคาปกติรวม 10,480', sp(['x1', 'x2'], 8990).promo === 8990 && sp(['x1', 'x2'], 8990).reg === 10480 && sp(['x1', 'x2'], 8990).disc === 'ประมาณ 14%');
  ok('ส่วนลดของเซ็ตปัดครึ่งขึ้น: รวม 1,099.5 เซ็ต 1,094 = 0.5003% → 1% · รวม 1,000+99.5 เซ็ต 1,094.5 → 0%', sp(['t1', 't2'], 1094).disc === 'ประมาณ 1%' && sp(['t1', 't2'], 1094.5).disc === 'ประมาณ 0%', sp(['t1', 't2'], 1094).disc + ' / ' + sp(['t1', 't2'], 1094.5).disc);
  ok('ราคาเซ็ต ≥ ราคาปกติรวม = พัก (เหมือนที่ฐานข้อมูลข้ามดีลนี้)', !sp(['x1', 'x2'], 10480).ok && /ราคาเซ็ตไม่ต่ำกว่า/.test(sp(['x1', 'x2'], 10480).why) && !sp(['x1', 'x2'], 20000).ok);
  ok('ดีลของแถมไม่มีราคาโปร (ราคาปกติ + ของแถม)', dealCalc({ kind: 'gift', product_ids: ['x1'], gift_item: 'a', gift_value: 1 }, M).ok === true && dealCalc({ kind: 'gift', product_ids: ['x1'], gift_item: 'a', gift_value: 1 }, M).promo === 0);
  ok('รุ่นเลิกขาย → "พัก — รุ่นเลิกขาย"', pc(['off'], 10).why === 'พัก — รุ่นเลิกขาย' && !pc(['off'], 10).ok);
  ok('ไม่มีรหัสบอท → "พัก — ยังไม่มีรหัสบอท" · ราคาปกติ 0 → พัก · ไม่พบรุ่น → พัก', pc(['nc'], 10).why === 'พัก — ยังไม่มีรหัสบอท' && /ราคาปกติเป็น 0/.test(pc(['z'], 10).why) && /ไม่พบรุ่น/.test(pc(['ghost'], 10).why));
  ok('เลิกขายเข้มกว่าไม่มีรหัส: ถ้ามีทั้งสองอย่าง บอกเลิกขาย (ลำดับเหมือน SQL)', dealCalc({ kind: 'set_price', product_ids: ['off', 'nc'], set_price: 50 }, M).why === 'พัก — รุ่นเลิกขาย');
  // สถานะโปรตามวัน — วันสิ้นสุดนับรวมทั้งวัน (เหมือน th_today() between starts_on and ends_on)
  const stp = (s, e, on) => promoStateOf({ is_enabled: on !== false, starts_on: s, ends_on: e }, '2026-10-05');
  ok('สถานะโปรตามวัน: วันสิ้นสุดยังใช้อยู่ · วันก่อนเริ่มยังไม่เริ่ม · วันหลังสิ้นสุดหมดเวลา · วันเริ่มใช้อยู่ · ปิดโปรชนะทุกอย่าง',
    stp('2026-10-01', '2026-10-05') === 'live' && stp('2026-10-06', '2026-10-09') === 'soon' && stp('2026-10-01', '2026-10-04') === 'ended' && stp('2026-10-05', '2026-10-09') === 'live' && stp('2026-10-01', '2026-10-09', false) === 'off');
  // รุ่น → โปรที่เปิดอยู่และยังไม่หมดเวลา (เหมือน view product_promotions: ends_on >= วันนี้) — โปรที่สิ้นสุดวันนี้ยังต้องขึ้นป้าย
  const keepP = [cat.promos, cat.deals];
  cat.promos = [{ id: 'e1', name: 'จบวันนี้', is_enabled: true, starts_on: TODAY, ends_on: TODAY }, { id: 'e2', name: 'จบเมื่อวาน', is_enabled: true, starts_on: TODAY, ends_on: '2000-01-01' }];
  cat.deals = [{ id: 'x1', promotion_id: 'e1', kind: 'percent', product_ids: ['a1'] }, { id: 'x2', promotion_id: 'e2', kind: 'percent', product_ids: ['a2'] }];
  ok('ป้ายโปรบนรุ่น: โปรที่สิ้นสุดวันนี้ยังขึ้น · สิ้นสุดเมื่อวานไม่ขึ้น', catPromoMap().has('a1') && !catPromoMap().has('a2'));
  [cat.promos, cat.deals] = keepP;
  // ค้นหาด้วยรหัสบอท (ใช้รุ่นที่รหัสไม่ตรงชื่อ/sku จึงพิสูจน์ได้ว่าค้นช่องรหัสจริง)
  const keepProducts = products;
  products = [{ id: 'q1', name: 'ชื่อธรรมดา', sku: 'S-1', brand: 'Other', model_code: 'ZZ-CODE-9', bot_category: 'cable', is_active: true, sell_price: 1 }];
  cat.q = 'zz-code-9';
  ok('ค้นหาด้วยรหัสบอทได้ (ไม่สนตัวพิมพ์) แม้ชื่อและ sku ไม่มีคำนั้น', catPool().length === 1);
  cat.q = ''; products = keepProducts;

  // ── 2. เจ้าของร้าน ────────────────────────────────────────────────────
  await login('tibass');
  const preCalls = CALLS.filter(c => /^promotion/.test(c.table || '')).length;   // ก่อนเปิดหมวดและก่อน fresh() ซึ่งโหลดโปรเอง
  await fresh();
  const iBills = SECTIONS.findIndex(s => s.id === 'bills'), iCat = SECTIONS.findIndex(s => s.id === 'catalog');
  const nav = document.querySelector('#navList .nav-item[data-s="catalog"]');
  ok('เมนูซ้ายมี "ราคา / โปรโมชัน" ถัดจากประวัติบิล ในกลุ่มการขาย · ไม่ใช่หมวดจำกัดสิทธิ์', !!nav && /ราคา \\/ โปรโมชัน/.test(nav.textContent) && iCat === iBills + 1 && SECTIONS[iCat].group === 'การขาย' && !SECTIONS[iCat].manager && !SECTIONS[iCat].owner);
  ok('ล็อกอินแล้วแต่ยังไม่เปิดหมวด = ยังไม่มีคำขอไปที่ตารางโปรเลย', preCalls === 0, String(preCalls));
  ok('showSection("catalog") สำเร็จ · hash = #catalog · หัวหน้า = ราคา / โปรโมชัน', showSection('catalog') === true && location.hash === '#catalog' && $('pageTitle').textContent === 'ราคา / โปรโมชัน' && !$('sec-catalog').hidden);
  await sleep(300); await frames();
  ok('เปิดหมวดแล้วโหลด promotions และ promotion_deals', CALLS.some(c => c.table === 'promotions' && c.op === 'select') && CALLS.some(c => c.table === 'promotion_deals' && c.op === 'select'));
  document.dispatchEvent(new KeyboardEvent('keydown', { code: 'KeyP', key: 'p', altKey: true, bubbles: true, cancelable: true }));
  ok('คีย์ลัด Alt+P ใช้ได้ (และไม่ชนหมวดอื่น/เครื่องคิดเลข)', SECTIONS.filter(s => s.key === 'P').length === 1, current);
  showSection('home'); document.dispatchEvent(new KeyboardEvent('keydown', { code: 'KeyP', key: 'p', altKey: true, bubbles: true, cancelable: true })); await sleep(300);
  ok('กด Alt+P จากหน้าอื่น → เข้าหมวดราคา/โปร', current === 'catalog' && !$('sec-catalog').hidden, current);
  ok('สรุป: ขายอยู่ 9 · เลิกขาย 1 · โปรใช้อยู่วันนี้ 2 · ยังไม่มีรหัสบอท 1', [$('catStatOn').textContent, $('catStatOff').textContent, $('catStatPromo').textContent, $('catStatGap').textContent].join('/') === '9/1/2/1',
    [$('catStatOn').textContent, $('catStatOff').textContent, $('catStatPromo').textContent, $('catStatGap').textContent].join('/'));
  const gh = [...document.querySelectorAll('#catList .cat-grp h3')].map(h => h.firstChild.textContent.trim() + '=' + h.querySelector('.n').textContent.trim());
  ok('รายการแยกตามประเภทของบอท เรียงเครื่องใหญ่ก่อน + ท้ายสุดคือยังไม่ระบุ · บอกจำนวนรุ่น',
    gh.join('|') === [CAT_TH.player + '=2 รุ่น', CAT_TH['all-in-one'] + '=1 รุ่น', CAT_TH.controller + '=2 รุ่น', CAT_TH.headphones + '=1 รุ่น', CAT_TH.speaker + '=1 รุ่น', CAT_TH.cable + '=1 รุ่น', CAT_TH.accessory + '=1 รุ่น', 'ยังไม่ระบุประเภทของบอท=1 รุ่น'].join('|'), gh.join('|'));
  ok('แถวสินค้า: ชื่อรุ่น · ยี่ห้อ · sku · รหัสบอท · ราคา', /CDJ-3000X/.test(txt(row('a1'))) && /AlphaTheta · PIO-CDJ3000X · รหัสบอท CDJ-3000X/.test(txt(row('a1'))) && /฿109,000/.test(txt(row('a1'))) && /แบรนด์อื่น/.test(txt(row('a7'))));
  ok('ติ๊กขายอยู่ตรงกับ is_active · รุ่นเลิกขายไม่ติ๊กและมีคำ "เลิกขาย" (ไม่ใช้สีอย่างเดียว)', chk('a1').checked && !chk('a6').checked && /เลิกขาย/.test(txt(row('a6'))) && row('a6').classList.contains('off'));
  ok('รุ่นไม่มีรหัสบอทมีคำเตือน · รุ่นราคา 0 ที่ขายอยู่มีคำเตือนราคา · รายการราคาไม่สต็อกมีป้ายบอก', /ยังไม่มีรหัสบอท/.test(txt(row('a7'))) && /ยังไม่ตั้งราคา/.test(txt(row('a8'))) && /ไม่สต็อก/.test(txt(row('a8'))) && !/ยังไม่มีรหัสบอท/.test(txt(row('a1'))));
  ok('รุ่นที่อยู่ในโปรมีป้ายชื่อโปร (เฉพาะโปรที่เปิดอยู่และยังไม่หมดเวลา): CDJ-3000X ในโปรมหาจักร · DM-40D (โปรหมดเวลา) ไม่มี · DDJ-FLX4 (โปรปิด) ไม่มี',
    /ลด 10% มหาจักร/.test(txt(row('a1'))) && !/โปรเก่าหมดเวลา/.test(txt(row('a5'))) && !/โปรที่ปิดไว้/.test(txt(row('p1'))));
  ok('เจ้าของร้าน: มีปุ่ม "แก้" ทุกแถว · ช่องติ๊กไม่ถูกปิด · มีปุ่มส่งออก/เพิ่มโปร', document.querySelectorAll('#catList button[data-act="edit"]').length === 10 && !chk('a1').disabled && !$('catExport').hidden && !$('promoAdd').hidden);
  await shot('catalog-products');

  // ตัวกรอง
  setVal('catSearch', 'flx'); await sleep(100);
  ok('ค้นหา "flx": เจอ DDJ-FLX2 กับ DDJ-FLX4 เท่านั้น (ไม่สนตัวพิมพ์)', [...document.querySelectorAll('#catList tr[data-id]')].map(r => r.dataset.id).sort().join() === 'a3,p1');
  setVal('catSearch', 'udg-deck'); await sleep(100);
  ok('ค้นหาด้วย sku/รหัสสินค้าได้ · ชื่อมีแท็ก HTML แสดงเป็นตัวอักษร ไม่ใช่แท็ก (XSS)', !!row('a7') && !row('a7').querySelector('b') && /<b>X<\\/b>/.test(row('a7').textContent));
  setVal('catSearch', 'ไม่มีรุ่นนี้แน่นอน'); await sleep(100);
  ok('ค้นไม่เจอ: แจ้งว่าไม่มีรายการที่ตรงกับตัวกรอง', /ไม่มีรายการที่ตรงกับตัวกรอง/.test($('catList').textContent));
  setVal('catSearch', '');
  setVal('catType', 'controller'); await sleep(100);
  ok('กรองประเภท "controller": 2 รุ่น (FLX2 · FLX4)', [...document.querySelectorAll('#catList tr[data-id]')].map(r => r.dataset.id).sort().join() === 'a3,p1' && document.querySelectorAll('#catList .cat-grp').length === 1);
  setVal('catType', '_none'); await sleep(100);
  ok('กรอง "ยังไม่ระบุประเภทของบอท": เหลือรุ่นไม่มีรหัส (a7)', [...document.querySelectorAll('#catList tr[data-id]')].map(r => r.dataset.id).join() === 'a7');
  setVal('catType', '');
  document.querySelector('#catStatus button[data-status="off"]').click(); await sleep(100);
  ok('กรองสถานะ "เลิกขาย": เหลือ CDJ-3000 (a6) · ปุ่มกดอยู่ aria-pressed', [...document.querySelectorAll('#catList tr[data-id]')].map(r => r.dataset.id).join() === 'a6' && document.querySelector('#catStatus button[data-status="off"]').getAttribute('aria-pressed') === 'true');
  document.querySelector('#catStatus button[data-status="on"]').click(); await sleep(100);
  ok('กรองสถานะ "ขายอยู่": 9 รุ่น ไม่มี a6', document.querySelectorAll('#catList tr[data-id]').length === 9 && !row('a6'));
  document.querySelector('#catStatus button[data-status="all"]').click(); await sleep(100);

  // ติ๊กขายอยู่/เลิกขาย
  CALLS.length = 0;
  chk('a1').click(); await sleep(300);
  ok('ติ๊กออก CDJ-3000X: ส่ง update products {is_active:false} ที่ id นั้น แถวเดียว และขอแถวกลับมาตรวจ', writes('products').length === 1 && JSON.stringify(writes('products')[0].payload) === '{"is_active":false}' && writes('products')[0].filters.some(f => f[0] === 'id' && f[1] === 'a1'));
  ok('ข้อความ: ปิดการขายแล้ว + "ถอดออกจากโปร ลด 10% มหาจักร แล้ว" (คำที่ตกลงกับ session บอท)', noteText() === 'ปิดการขาย CDJ-3000X แล้ว · ถอดออกจากโปร ลด 10% มหาจักร แล้ว', noteText());
  ok('แถบแจ้งผลค้างบนจอ (ไม่หายเอง) มีปุ่มย้อนกลับ · ข้อมูลในหน้าอัปเดต: เลิกขาย 2 · ขายอยู่ 8', !$('catUndo').hidden && !$('catUndoBtn').hidden && $('catStatOff').textContent === '2' && $('catStatOn').textContent === '8' && !chk('a1').checked && row('a1').classList.contains('off'));
  ok('ฐานข้อมูลบันทึกการเปลี่ยน (log) เอง — หน้าเว็บไม่เขียน activity_log เอง', CAT.log.length === 1 && CAT.log[0].action === 'UPDATE' && CAT.log[0].table_name === 'products' && !writes('activity_log').length);
  await showTab('promos');
  ok('ดีลของ CDJ-3000X ในโปรมหาจักรกลายเป็น "พัก — รุ่นเลิกขาย" ทันที (ไม่ลบ) · ยังเห็นดีลอยู่', /พัก — รุ่นเลิกขาย/.test(txt(dealEl('d1'))) && !!deal('d1'));
  await showTab('products');
  chk('a1').click(); await sleep(300);
  ok('ติ๊กกลับ: "เปิดการขาย … แล้ว · โปร … ใช้ได้อีกครั้ง" · ดีลกลับมาใช้ได้', noteText() === 'เปิดการขาย CDJ-3000X แล้ว · โปร ลด 10% มหาจักร ใช้ได้อีกครั้ง' && prod('a1').is_active === true, noteText());
  await showTab('promos');
  ok('หลังติ๊กกลับ ดีลแสดงราคาโปร ฿98,100 อีกครั้ง', /฿98,100/.test(txt(dealEl('d1'))) && !/พัก/.test(txt(dealEl('d1'))));
  await showTab('products');
  chk('a3').click(); await sleep(300);
  ok('ติ๊กออกรุ่นในดีลเซ็ต: ข้อความบอกว่าเซ็ตพักทั้งเซ็ต', /ถอดออกจากโปร Starter Pack แล้ว \\(ดีลเซ็ตที่มีรุ่นนี้พักทั้งเซ็ต\\)/.test(noteText()), noteText());
  chk('a5').click(); await sleep(300);
  ok('ติ๊กออกรุ่นที่อยู่แต่โปรหมดเวลา/ไม่มีโปร: ไม่พูดถึงโปร บอกว่าบอทตอบเลิกขาย', noteText() === 'ปิดการขาย DM-40D แล้ว · บอทตอบว่าเลิกขาย', noteText());
  chk('a3').click(); await sleep(250); chk('a5').click(); await sleep(250);

  // ย้อนกลับ
  CALLS.length = 0;
  chk('a2').click(); await sleep(300);
  $('catUndoBtn').click(); await sleep(400);
  ok('ย้อนกลับ: ค้นบันทึก UPDATE ล่าสุดของรุ่นนั้นแล้วเรียก undo_activity ด้วย id ของบันทึก', rpcs('undo_activity').length === 1 && /^lg/.test(rpcs('undo_activity')[0].args.p_log_id) &&
    CALLS.some(c => c.table === 'activity_log' && c.op === 'select' && c.filters.some(f => f[0] === 'table_name' && f[1] === 'products') && c.filters.some(f => f[0] === 'action' && f[1] === 'UPDATE')));
  ok('ย้อนสำเร็จ: ขายอยู่กลับมา · แถบบอก "ย้อนกลับแล้ว" · ปุ่มหาย (ย้อนซ้ำไม่ได้)', prod('a2').is_active === true && chk('a2').checked && /^ย้อนกลับแล้ว: ปิดการขาย XDJ-AZ/.test(noteText()) && $('catUndoBtn').hidden);
  chk('a2').click(); await sleep(300);
  prod('a2').is_active = true;                  // มีคนอื่นติ๊กกลับไปแล้วระหว่างนั้น
  $('catUndoBtn').click(); await sleep(400);
  ok('ย้อนไม่ได้เพราะถูกแก้ต่อแล้ว: ฐานข้อมูลปฏิเสธ → แจ้งข้อความภาษาไทยบนจอ (ไม่ขึ้นว่าสำเร็จ)', /ถูกแก้ต่อหลังรายการนี้แล้ว/.test(fatal()), fatal());
  clearFatal();

  // เขียนไม่ได้ (RLS ปฏิเสธเงียบ ๆ ไม่มี error)
  await fresh(); showSection('catalog'); await sleep(250);
  CAT.denyWrite = true; CALLS.length = 0;
  chk('a1').click(); await sleep(300);
  ok('RLS ไม่โดนแถวไหน (ไม่มี error): ช่องติ๊กกลับเป็นเดิม · แจ้งบนจอตามจริง · ข้อมูลไม่เปลี่ยน · ไม่ขึ้นว่าสำเร็จ', chk('a1').checked && prod('a1').is_active === true && /ไม่มีสิทธิ์แก้ไข/.test(fatal()) && $('catUndo').hidden, fatal());
  clearFatal(); CAT.denyWrite = false;
  CAT.fail.update = 'connection reset'; CALLS.length = 0;
  chk('a1').click(); await sleep(300);
  ok('ฐานข้อมูลตอบ error: แจ้งข้อความ error · ช่องติ๊กกลับเป็นเดิม', chk('a1').checked && /connection reset/.test(fatal()), fatal());
  clearFatal(); CAT.fail = {};

  // แก้รุ่น
  await fresh(); showSection('catalog'); await sleep(250);
  row('a3').querySelector('button[data-act="edit"]').click(); await sleep(150);
  ok('แก้รุ่น: หน้าต่างเปิด · มีชื่อรุ่น · ค่าเดิมครบ (ราคา 7490 · รหัส DDJ-FLX2 · ประเภท controller · สต็อก)', $('catEditDlg').open && /DDJ-FLX2/.test($('catEditName').textContent) && $('cefPrice').value === '7490' && $('cefCode').value === 'DDJ-FLX2' && $('cefCat').value === 'controller' && $('cefStocked').checked);
  setVal('cefPrice', ''); await submit('catEditForm');
  ok('ราคาว่าง: ไม่บันทึก · แจ้งในหน้าต่าง', /ตัวเลขตั้งแต่ 0/.test(dlgErr('cefErr')) && writes('products').length === 0);
  setVal('cefPrice', '7490'); setVal('cefCat', ''); await submit('catEditForm');
  ok('มีรหัสแต่ไม่มีประเภท: ไม่บันทึก · อธิบายว่าบอทจะไม่เห็นรุ่น', /ใส่ให้ครบทั้งรหัสรุ่นและประเภท/.test(dlgErr('cefErr')) && writes('products').length === 0);
  setVal('cefCat', 'controller'); setVal('cefCode', 'ddj-flx4'); await submit('catEditForm');
  ok('รหัสซ้ำกับรุ่นอื่น (ไม่สนตัวพิมพ์): บอกชื่อรุ่นที่ใช้อยู่ · ไม่ส่งคำขอ', /รหัสรุ่น ddj-flx4 มี “DDJ-FLX4” ใช้อยู่แล้ว/.test(dlgErr('cefErr')) && writes('products').length === 0, dlgErr('cefErr'));
  setVal('cefCode', 'DDJ-FLX2'); await submit('catEditForm');
  ok('ไม่ได้เปลี่ยนอะไร: ปิดหน้าต่าง ไม่ส่งคำขอ', !$('catEditDlg').open && writes('products').length === 0);
  row('a3').querySelector('button[data-act="edit"]').click(); await sleep(150);
  setVal('cefPrice', '7990'); await submit('catEditForm');
  ok('เปลี่ยนแต่ราคา: ส่งเฉพาะ sell_price (ไม่ส่งช่องที่ไม่เปลี่ยน) · หน้าต่างปิด · แถวอัปเดต', writes('products').length === 1 && JSON.stringify(writes('products')[0].payload) === '{"sell_price":7990}' && !$('catEditDlg').open && /฿7,990/.test(txt(row('a3'))));
  ok('ข้อความบอกค่าเดิม → ค่าใหม่ · ย้อนกลับได้', /^แก้ DDJ-FLX2: ราคา ฿7,490 → ฿7,990$/.test(noteText()) && !$('catUndoBtn').hidden, noteText());
  $('catUndoBtn').click(); await sleep(400);
  ok('ย้อนการแก้ราคา: กลับเป็น 7,490', prod('a3').sell_price === 7490 && /฿7,490/.test(txt(row('a3'))), String(prod('a3').sell_price));
  row('a7').querySelector('button[data-act="edit"]').click(); await sleep(150);
  setVal('cefCode', 'UDG-DECK-X'); setVal('cefCat', 'accessory'); await submit('catEditForm');
  ok('ตั้งรหัส+ประเภทให้รุ่นที่ยังไม่มี: payload ครบสองช่อง · "ยังไม่มีรหัสบอท" ลดเป็น 0 · ป้ายเตือนหาย · ย้ายเข้ากลุ่มประเภท',
    JSON.stringify(writes('products').slice(-1)[0].payload) === '{"model_code":"UDG-DECK-X","bot_category":"accessory"}' && $('catStatGap').textContent === '0' && !/ยังไม่มีรหัสบอท/.test(txt(row('a7'))) && row('a7').closest('.cat-grp').querySelector('h3').textContent.indexOf(CAT_TH.accessory) === 0);
  row('a8').querySelector('button[data-act="edit"]').click(); await sleep(150);
  $('cefStocked').click(); setVal('cefPrice', '500'); await submit('catEditForm');
  ok('เปลี่ยนสต็อก (stocked) พร้อมราคา: ส่งทั้งสองช่อง', JSON.stringify(writes('products').slice(-1)[0].payload) === '{"sell_price":500,"stocked":true}' && prod('a8').stocked === true, JSON.stringify(writes('products').slice(-1)[0].payload));
  row('a8').querySelector('button[data-act="edit"]').click(); await sleep(150);
  setVal('cefPrice', '600'); CAT.fail.update = 'boom'; await submit('catEditForm');
  ok('ฐานข้อมูลปฏิเสธตอนแก้รุ่น: แจ้งในหน้าต่าง · หน้าต่างยังเปิด · ข้อมูลไม่เปลี่ยน · ปุ่มบันทึกกดซ้ำได้', /boom/.test(dlgErr('cefErr')) && $('catEditDlg').open && prod('a8').sell_price === 500 && !$('cefSave').disabled);
  CAT.fail = {}; $('catEditDlg').close();
  CAT.denyWrite = true; row('a8').querySelector('button[data-act="edit"]').click(); await sleep(150);
  setVal('cefPrice', '700'); await submit('catEditForm');
  ok('RLS ไม่โดนแถวตอนแก้รุ่น: แจ้งในหน้าต่างว่าไม่มีสิทธิ์ · ไม่ขึ้นว่าสำเร็จ · ราคาไม่เปลี่ยน', /ไม่มีสิทธิ์แก้ไข/.test(dlgErr('cefErr')) && $('catEditDlg').open && prod('a8').sell_price === 500);
  CAT.denyWrite = false; $('catEditDlg').close();

  // ── 3. โปรโมชัน ───────────────────────────────────────────────────────
  await fresh(); showSection('catalog'); await sleep(250);
  await showTab('promos');
  ok('แท็บโปรโมชัน: ข้อความเตือนสีติดอยู่ตลอด (คำที่ตกลงกับ session บอท)', $('catColorWarn').textContent === 'โปรนี้ใช้ได้เฉพาะสีที่เลือก — ถ้าใช้ได้ทุกสีให้ใส่ทุกสี' && vis($('catColorWarn')));
  const ids = () => [...document.querySelectorAll('#promoList .promo')].map(p => p.dataset.id).join();
  ok('ค่าเริ่มต้นแสดงเฉพาะโปรที่ใช้อยู่/กำลังจะเริ่ม: มหาจักร · Starter Pack · โปรเดือนหน้า (ใช้อยู่ก่อน · วันเริ่มใหม่กว่าก่อน)', ids() === 'pr1,pr2,pr5', ids());
  document.getElementById('promoShowOld').click(); await sleep(100);
  ok('ติ๊ก "แสดงโปรที่หมดเวลาแล้วและที่ปิดไว้": เพิ่มโปรเก่าและโปรที่ปิด ต่อท้าย', ids() === 'pr1,pr2,pr5,pr3,pr4', ids());
  ok('สถานะโปรเป็นคำ + สัญลักษณ์: ใช้อยู่ · ยังไม่เริ่ม · หมดเวลาแล้ว · ปิดโปร', /✓ ใช้อยู่/.test(txt(promoCard('pr1').querySelector('.promo-title'))) && /◷ ยังไม่เริ่ม/.test(txt(promoCard('pr5'))) && /✕ หมดเวลาแล้ว/.test(txt(promoCard('pr3'))) && /⏸ ปิดโปร/.test(txt(promoCard('pr4'))));
  document.getElementById('promoShowOld').click(); await sleep(100);
  const c1 = txt(promoCard('pr1'));
  ok('การ์ดโปรมหาจักร: ชื่อ · วันที่แบบไทย · รหัส · เงื่อนไข · ที่มาภายใน', /ลด 10% มหาจักร/.test(c1) && /รหัส mahajak-2026-10/.test(c1) && /เฉพาะลูกค้ามหาจักร/.test(c1) && /จำกัด 1 เครื่องต่อท่าน/.test(c1) && /ที่มา \\(ภายใน\\): memo ผู้นำเข้า 1 ต.ค./.test(c1) && c1.indexOf(fmtDate(promo('pr1').starts_on)) >= 0);
  ok('ดีลลด %: ราคาปกติ ฿109,000 → ฿98,100 ลด 10%', /CDJ-3000X/.test(txt(dealEl('d1'))) && /ราคาปกติ ฿109,000/.test(txt(dealEl('d1'))) && /฿98,100 · ลด 10%/.test(txt(dealEl('d1'))), txt(dealEl('d1')));
  ok('ดีลของแถม: ราคาปกติ + ของแถม + มูลค่า', /XDJ-AZ/.test(txt(dealEl('d2'))) && /ราคาปกติ ฿139,000/.test(txt(dealEl('d2'))) && /ของแถม: หูฟัง HDJ-CUE1/.test(txt(dealEl('d2'))) && /มูลค่า ฿2,990/.test(txt(dealEl('d2'))));
  ok('ดีลเซ็ต: ชื่อเซ็ต + รุ่นต่อด้วย + · ราคาเซ็ต ฿8,990 ลดประมาณ 14% · ปกติรวม ฿10,480', /Starter Pack — DDJ-FLX2 \\+ HDJ-CUE1/.test(txt(dealEl('d3'))) && /฿8,990 · ลด ประมาณ 14%/.test(txt(dealEl('d3'))) && /ราคาปกติ ฿10,480/.test(txt(dealEl('d3'))), txt(dealEl('d3')));
  ok('ชื่อโปรมีแท็ก HTML แสดงเป็นตัวอักษร (XSS)', !promoCard('pr5') || !promoCard('pr5').querySelector('i'));
  pp('a3').is_active = false; renderAll();
  ok('รุ่นในเซ็ตเลิกขาย: ดีลเซ็ต "พัก — รุ่นเลิกขาย" · มีป้ายเตือนว่าทุกดีลพักเมื่อไม่เหลือดีลใช้ได้ (โปร Starter Pack มีดีลเดียว)', /พัก — รุ่นเลิกขาย/.test(txt(dealEl('d3'))) && /ทุกดีลในโปรนี้พักอยู่ — บอทจะไม่เห็นโปรนี้/.test(txt(promoCard('pr2'))) && !/ทุกดีลในโปรนี้พักอยู่/.test(txt(promoCard('pr1'))));
  pp('a3').is_active = true; renderAll();
  pp('a1').model_code = null; renderAll();
  ok('ดีลที่รุ่นไม่มีรหัสบอท: "พัก — ยังไม่มีรหัสบอท"', /พัก — ยังไม่มีรหัสบอท/.test(txt(dealEl('d1'))));
  pp('a1').model_code = 'CDJ-3000X'; renderAll();
  await shot('catalog-promos');

  // เพิ่มโปร
  $('promoAdd').click(); await sleep(150);
  ok('เพิ่มโปร: หน้าต่างเปิด · รหัสตั้งต้น promo-วันนี้ · วันเริ่ม = วันนี้ · วันสิ้นสุด = +30 วัน · เปิดโปรติ๊กไว้ · รหัสแก้ได้', $('promoDlg').open && $('pfCode').value === 'promo-' + TODAY && $('pfStart').value === TODAY && $('pfEnd').value > $('pfStart').value && $('pfEnabled').checked && !$('pfCode').readOnly);
  await submit('promoForm');
  ok('ไม่กรอกชื่อ: ไม่ส่งคำขอ · แจ้งในหน้าต่าง', /กรอกชื่อโปร/.test(dlgErr('pfErr')) && writes('promotions').length === 0);
  setVal('pfName', 'โปรทดสอบ'); setVal('pfCode', 'Bad Code!'); await submit('promoForm');
  ok('รหัสโปรผิดรูปแบบ (ตัวพิมพ์ใหญ่/ช่องว่าง/อักขระพิเศษ): ไม่ส่งคำขอ · อธิบายกติกา', /ตัวอักษรอังกฤษพิมพ์เล็ก ตัวเลข และขีดกลาง/.test(dlgErr('pfErr')) && writes('promotions').length === 0);
  setVal('pfCode', 'test-promo'); setVal('pfStart', TODAY); setVal('pfEnd', promo('pr3').ends_on); await submit('promoForm');
  ok('วันสิ้นสุดก่อนวันเริ่ม: ไม่ส่งคำขอ', /วันสิ้นสุดต้องไม่ก่อนวันเริ่ม/.test(dlgErr('pfErr')) && writes('promotions').length === 0);
  setVal('pfEnd', promo('pr1').ends_on); setVal('pfCode', 'starter-pack'); await submit('promoForm');
  ok('รหัสโปรซ้ำกับของเดิม (ฐานข้อมูลปฏิเสธ 23505): ข้อความภาษาไทยในหน้าต่าง · หน้าต่างยังเปิด · ไม่มีโปรเพิ่ม', /รหัสโปรนี้มีอยู่แล้ว/.test(dlgErr('pfErr')) && $('promoDlg').open && CAT.promos.length === 5);
  setVal('pfCode', 'test-promo'); setVal('pfConds', '  ข้อหนึ่ง  \\n\\nข้อสอง\\n'); setVal('pfSource', 'memo ทดสอบ'); await submit('promoForm');
  const ins = writes('promotions').filter(c => c.op === 'insert').slice(-1)[0];
  ok('บันทึกโปรใหม่: payload ถูกต้อง (เงื่อนไขตัดช่องว่างและบรรทัดว่าง · ที่มา · เปิดโปร) หน้าต่างปิด', !!ins && ins.payload.code === 'test-promo' && ins.payload.name === 'โปรทดสอบ' && JSON.stringify(ins.payload.conditions) === '["ข้อหนึ่ง","ข้อสอง"]' && ins.payload.source_note === 'memo ทดสอบ' && ins.payload.is_enabled === true && !$('promoDlg').open, JSON.stringify(ins && ins.payload));
  const newId = CAT.promos[CAT.promos.length - 1].id;
  ok('โปรใหม่ขึ้นในรายการ (ยังไม่มีดีล → บอกให้เพิ่มดีล) · ข้อความบอกว่าบอทยังไม่เห็นโปรที่ไม่มีดีล · ย้อนกลับไม่ได้ (เพิ่ม)', ids().split(',').length === 4 && /ยังไม่มีดีลในโปรนี้/.test(txt(promoCard(newId))) && /บอทยังไม่เห็น/.test(noteText()) && $('catUndoBtn').hidden);

  // แก้ / ปิด / เปิดโปร
  promoCard('pr1').querySelector('button[data-act="pedit"]').click(); await sleep(150);
  ok('แก้โปร: ค่าเดิมครบ · รหัสโปรแก้ไม่ได้ (readonly)', $('pfName').value === 'ลด 10% มหาจักร' && $('pfCode').value === 'mahajak-2026-10' && $('pfCode').readOnly && $('pfConds').value === 'เฉพาะลูกค้ามหาจักร\\nจำกัด 1 เครื่องต่อท่าน' && $('pfSource').value === 'memo ผู้นำเข้า 1 ต.ค.');
  setVal('pfName', 'ลด 12% มหาจักร'); await submit('promoForm');
  const up = writes('promotions').filter(c => c.op === 'update').slice(-1)[0];
  ok('แก้ชื่อโปร: update ไม่มี code (ห้ามแก้) · ที่ id เดียว · ย้อนกลับได้', !!up && !('code' in up.payload) && up.payload.name === 'ลด 12% มหาจักร' && up.filters.some(f => f[0] === 'id' && f[1] === 'pr1') && !$('catUndoBtn').hidden && promo('pr1').name === 'ลด 12% มหาจักร');
  $('catUndoBtn').click(); await sleep(400);
  ok('ย้อนการแก้ชื่อโปร: กลับเป็นชื่อเดิม', promo('pr1').name === 'ลด 10% มหาจักร' && /ลด 10% มหาจักร/.test(txt(promoCard('pr1').querySelector('.promo-title'))));
  promoCard('pr2').querySelector('button[data-act="ptoggle"]').click(); await sleep(350);
  ok('ปิดโปร Starter Pack: is_enabled false · ป้าย "⏸ ปิดโปร" · ข้อความบอกว่าบอทไม่เห็นทันที · ย้อนกลับได้ · โปรหายจากรายการเริ่มต้น', promo('pr2').is_enabled === false && /ปิดโปร Starter Pack แล้ว — บอทไม่เห็นโปรนี้ทันที/.test(noteText()) && !$('catUndoBtn').hidden && !promoCard('pr2'), noteText());
  $('catUndoBtn').click(); await sleep(400);
  ok('ย้อนการปิดโปร: เปิดกลับ · โปรกลับมาอยู่ในรายการ · ป้ายเขียวใช้อยู่', promo('pr2').is_enabled === true && !!promoCard('pr2') && /✓ ใช้อยู่/.test(txt(promoCard('pr2').querySelector('.promo-title'))));

  // เพิ่มดีล
  CALLS.length = 0;
  promoCard('pr1').querySelector('button[data-act="dadd"]').click(); await sleep(200);
  ok('เพิ่มดีล: หน้าต่างเปิด · บอกว่าอยู่ในโปรไหน · เตือนเรื่องสีติดอยู่ · ค่าเริ่มต้น "ลด % ต่อรุ่น" · ซ่อนช่องเซ็ต/ของแถม · เลือกแบบโปรได้ 3 แบบ',
    $('dealDlg').open && /ลด 10% มหาจักร/.test($('dealPromo').textContent) && $('dealWarn').textContent === 'โปรนี้ใช้ได้เฉพาะสีที่เลือก — ถ้าใช้ได้ทุกสีให้ใส่ทุกสี' && $('dfKind').value === 'percent' && $('dfRowPercent').hidden === false && $('dfRowSet').hidden && $('dfRowGift').hidden && $('dfKind').options.length === 3 && !$('dfKind').disabled);
  const pickIds = () => [...document.querySelectorAll('#dfPick input')].map(i => i.value).sort().join();
  ok('รายการรุ่นให้เลือก: เฉพาะที่ขายอยู่ มีรหัสบอท ราคา > 0 (ไม่มี CDJ-3000 เลิกขาย · UDG ไม่มีรหัส · กระเป๋าหูฟังไม่มีราคา)', pickIds() === 'a1,a2,a3,a4,a5,a9,p1', pickIds());
  ok('ลด % เลือกได้ทีละรุ่น (radio)', document.querySelectorAll('#dfPick input[type="radio"]').length === 7 && document.querySelectorAll('#dfPick input[type="checkbox"]').length === 0);
  setVal('dfSearch', 'cue'); await sleep(100);
  ok('ค้นรุ่นในรายการ: เหลือ HDJ-CUE1', pickIds() === 'a4');
  await submit('dealForm');
  ok('ยังไม่เลือกรุ่น: ไม่ส่งคำขอ · แจ้ง', /เลือก 1 รุ่นสำหรับโปรลด %/.test(dlgErr('dfErr')) && writes('promotion_deals').length === 0);
  pick('a4').click(); await sleep(100);
  ok('เลือกรุ่นแล้วตัวอย่างบอกให้กรอกตัวเลขต่อ · ยังไม่เลือกเปอร์เซ็นต์ = ยังไม่คำนวณ', /กรอกตัวเลขให้ครบ/.test($('dfPreview').textContent));
  setVal('dfPercent', '0'); await submit('dealForm');
  ok('ลด 0%: ไม่ส่งคำขอ', /มากกว่า 0 และน้อยกว่า 100/.test(dlgErr('dfErr')) && writes('promotion_deals').length === 0);
  setVal('dfPercent', '100'); await submit('dealForm');
  ok('ลด 100%: ไม่ส่งคำขอ', /มากกว่า 0 และน้อยกว่า 100/.test(dlgErr('dfErr')) && writes('promotion_deals').length === 0);
  setVal('dfPercent', '15');
  ok('ตัวอย่างที่บอทเห็นคำนวณสด: ปกติ ฿2,990 → โปร ฿2,542 (2,541.5 ปัดครึ่งขึ้น) ลด 15%', /ราคาปกติ ฿2,990 → ราคาโปร ฿2,542 \\(ลด 15%\\)/.test($('dfPreview').textContent), $('dfPreview').textContent);
  await submit('dealForm');
  const di = writes('promotion_deals').filter(c => c.op === 'insert').slice(-1)[0];
  ok('บันทึกดีลลด %: ส่ง promotion_id · kind · product_ids · percent และช่องอื่นเป็น null · sort_order ต่อท้าย · หน้าต่างปิด', !!di && di.payload.promotion_id === 'pr1' && di.payload.kind === 'percent' && JSON.stringify(di.payload.product_ids) === '["a4"]' && di.payload.percent === 15 && di.payload.set_price === null && di.payload.gift_item === null && di.payload.gift_value === null && di.payload.sort_order === 3 && !$('dealDlg').open, JSON.stringify(di && di.payload));
  ok('ดีลใหม่ขึ้นในการ์ด ฿2,542 · ข้อความแจ้ง · ย้อนกลับไม่ได้ (เพิ่ม)', /฿2,542 · ลด 15%/.test(txt(promoCard('pr1'))) && noteText() === 'เพิ่มดีลแล้ว' && $('catUndoBtn').hidden);

  // ดีลราคาเซ็ต
  promoCard('pr2').querySelector('button[data-act="dadd"]').click(); await sleep(200);
  setVal('dfKind', 'set_price'); await sleep(100);
  ok('เปลี่ยนเป็นราคาเซ็ต: โชว์ช่องราคาเซ็ต/ชื่อเซ็ต ซ่อนช่อง % · รายการรุ่นเป็น checkbox เลือกหลายรุ่น', $('dfRowSet').hidden === false && $('dfRowPercent').hidden && document.querySelectorAll('#dfPick input[type="checkbox"]').length === 7);
  pick('a5').click(); await sleep(60); pick('p1').click(); await sleep(100);
  ok('เลือกหลายรุ่น: เลขลำดับ #1 #2 ตามลำดับที่เลือก (ลำดับ = ลำดับในชื่อเซ็ต)', pick('a5').closest('label').querySelector('.pk-ord').textContent === '#1' && pick('p1').closest('label').querySelector('.pk-ord').textContent === '#2' && /เลือกแล้ว 2 รุ่น/.test($('dfSelHint').textContent));
  setVal('dfSet', '19490'); await submit('dealForm');
  ok('ราคาเซ็ต ≥ ราคาปกติรวม (6,590 + 12,900 = 19,490): ไม่ส่งคำขอ · บอกตัวเลขทั้งสอง', /ราคาเซ็ต \\(฿19,490\\) ต้องต่ำกว่าราคาปกติรวม \\(฿19,490\\)/.test(dlgErr('dfErr')) && writes('promotion_deals').filter(c => c.op === 'insert').length === 1, dlgErr('dfErr'));
  setVal('dfSet', '17900'); setVal('dfLabel', 'ลำโพง + คอนโทรลเลอร์');
  ok('ตัวอย่างเซ็ต: ปกติ ฿19,490 → ฿17,900 (ลดประมาณ 8%)', /ราคาปกติ ฿19,490 → ราคาโปร ฿17,900 \\(ลด ประมาณ 8%\\)/.test($('dfPreview').textContent), $('dfPreview').textContent);
  pick('p1').click(); await sleep(100); await submit('dealForm');
  ok('เหลือรุ่นเดียวในดีลเซ็ต: ไม่ส่งคำขอ · บอกต้องเลือกตั้งแต่ 2 รุ่น', /ตั้งแต่ 2 รุ่นขึ้นไป/.test(dlgErr('dfErr')) && writes('promotion_deals').filter(c => c.op === 'insert').length === 1);
  pick('p1').click(); await sleep(100); await submit('dealForm');
  const ds = writes('promotion_deals').filter(c => c.op === 'insert').slice(-1)[0];
  ok('บันทึกดีลเซ็ต: product_ids ตามลำดับที่เลือก · set_price · label · percent เป็น null', writes('promotion_deals').filter(c => c.op === 'insert').length === 2 && JSON.stringify(ds.payload.product_ids) === '["a5","p1"]' && ds.payload.set_price === 17900 && ds.payload.label === 'ลำโพง + คอนโทรลเลอร์' && ds.payload.percent === null, JSON.stringify(ds.payload));

  // ดีลของแถม
  promoCard('pr1').querySelector('button[data-act="dadd"]').click(); await sleep(200);
  setVal('dfKind', 'gift'); await sleep(100); pick('a9').click(); await sleep(60);
  ok('แบบของแถม: โชว์ช่องของแถม+มูลค่า · เลือกทีละรุ่น', $('dfRowGift').hidden === false && $('dfRowPercent').hidden && $('dfRowSet').hidden && document.querySelectorAll('#dfPick input[type="radio"]').length === 7);
  setVal('dfGift', 'สายแจ็ค'); await submit('dealForm');
  ok('ของแถมไม่ใส่มูลค่า: ไม่ส่งคำขอ · อธิบายว่าบอทใช้บอกมูลค่า (gift.value จำเป็น)', /มูลค่าของแถม/.test(dlgErr('dfErr')) && writes('promotion_deals').filter(c => c.op === 'insert').length === 2);
  setVal('dfGiftVal', '0'); await submit('dealForm');
  ok('มูลค่าของแถม 0: ไม่ส่งคำขอ', /มากกว่า 0/.test(dlgErr('dfErr')) && writes('promotion_deals').filter(c => c.op === 'insert').length === 2);
  setVal('dfGiftVal', '350'); await submit('dealForm');
  ok('บันทึกดีลของแถม: gift_item · gift_value · percent/set_price เป็น null', JSON.stringify(writes('promotion_deals').filter(c => c.op === 'insert').slice(-1)[0].payload.gift_item) === '"สายแจ็ค"' && writes('promotion_deals').filter(c => c.op === 'insert').slice(-1)[0].payload.gift_value === 350 && /ของแถม: สายแจ็ค/.test(txt(promoCard('pr1'))));

  // แก้ดีลเดิม
  CALLS.length = 0;
  dealEl('d1').querySelector('button[data-act="dedit"]').click(); await sleep(200);
  ok('แก้ดีล: ชื่อหน้าต่าง "แก้ดีล" · แบบโปรเปลี่ยนไม่ได้ (disabled) · เลือกรุ่นเดิมไว้ · เปอร์เซ็นต์เดิม 10', /แก้ดีล/.test($('dealTitle').textContent) && $('dfKind').disabled && $('dfKind').value === 'percent' && pick('a1').checked && $('dfPercent').value === '10');
  setVal('dfPercent', '12.5'); await submit('dealForm');
  const du = writes('promotion_deals').filter(c => c.op === 'update').slice(-1)[0];
  ok('แก้ % ของดีลเดิม: update ที่ id ดีล · ส่ง product_ids + percent และช่องอื่นเป็น null · ไม่ส่ง kind (เปลี่ยนไม่ได้) · ราคาโปรใหม่ ฿95,375', !!du && du.filters.some(f => f[0] === 'id' && f[1] === 'd1') && !('kind' in du.payload) && du.payload.percent === 12.5 && JSON.stringify(du.payload.product_ids) === '["a1"]' && /฿95,375 · ลด 12.5%/.test(txt(dealEl('d1'))), JSON.stringify(du && du.payload));
  ok('แก้ดีลย้อนกลับได้ → กลับเป็น 10%', !$('catUndoBtn').hidden);
  $('catUndoBtn').click(); await sleep(400);
  ok('ย้อนการแก้ดีล: percent กลับเป็น 10 · การ์ดแสดง ฿98,100', deal('d1').percent === 10 && /฿98,100 · ลด 10%/.test(txt(dealEl('d1'))), String(deal('d1').percent));
  prod('a3').is_active = false; pp('a3').is_active = false; renderAll();   // เลิกขายทั้งในฐานข้อมูลปลอมและในหน้า
  dealEl('d3').querySelector('button[data-act="dedit"]').click(); await sleep(200);
  ok('แก้ดีลที่รุ่นเลิกขายแล้ว: รุ่นนั้นยังเห็นในรายการพร้อมป้าย "เลิกขาย" (เพื่อถอดออกได้)', !!pick('a3') && pick('a3').checked && /เลิกขาย/.test(pick('a3').closest('label').textContent));
  setVal('dfSet', '8900'); await submit('dealForm');
  ok('ฐานข้อมูลปฏิเสธ (ตัวกัน: รุ่นเลิกขายเข้าโปรไม่ได้): ข้อความภาษาไทยจากฐานข้อมูลในหน้าต่าง · ไม่เปลี่ยนข้อมูล', /รุ่นที่เลิกขาย \\(ติ๊กออก\\) เข้าโปรไม่ได้: DDJ-FLX2/.test(dlgErr('dfErr')) && $('dealDlg').open && deal('d3').set_price === 8990, dlgErr('dfErr'));
  pick('a3').click(); await sleep(100);
  const left = cat.draft.sel.join();
  await submit('dealForm');
  ok('ถอดรุ่นที่เลิกขายออกจากเซ็ต: รุ่นนั้นหายจากรายการเลือก เหลือรุ่นเดียว → ไม่ส่งคำขอ บอกต้องเลือกตั้งแต่ 2 รุ่น', left === 'a4' && !pick('a3') && /ตั้งแต่ 2 รุ่นขึ้นไป/.test(dlgErr('dfErr')) && deal('d3').set_price === 8990, left + ' / ' + dlgErr('dfErr'));
  $('dealDlg').close(); prod('a3').is_active = true; pp('a3').is_active = true; renderAll();

  // ลบดีล
  CALLS.length = 0;
  dealEl('d2').querySelector('button[data-act="ddel"]').click(); await sleep(200);
  ok('ลบดีล: ถามยืนยันก่อน · บอกชื่อรุ่น · เตือนว่าย้อนกลับด้วยปุ่มไม่ได้ ให้ปิดโปรแทน · ยังไม่ส่งคำขอลบ', $('confirmDialog').open && /XDJ-AZ/.test($('confirmBody').textContent) && /ย้อนกลับด้วยปุ่มไม่ได้/.test($('confirmBody').textContent) && writes('promotion_deals').length === 0);
  $('confirmOkBtn').click(); await sleep(350);
  ok('ยืนยันแล้วลบ: ส่ง delete ที่ id ดีล · ดีลหายจากการ์ด · หน้าต่างยืนยันปิด · แจ้งผล · ไม่มีปุ่มย้อนกลับ', writes('promotion_deals').length === 1 && writes('promotion_deals')[0].op === 'delete' && writes('promotion_deals')[0].filters.some(f => f[0] === 'id' && f[1] === 'd2') && !dealEl('d2') && !$('confirmDialog').open && noteText() === 'ลบดีลแล้ว' && $('catUndoBtn').hidden);
  CAT.denyWrite = true;
  dealEl('d1').querySelector('button[data-act="ddel"]').click(); await sleep(200); $('confirmOkBtn').click(); await sleep(350);
  ok('ลบดีลแต่ RLS ไม่โดนแถว: แจ้งตามจริง · ดีลยังอยู่', /ลบดีลไม่สำเร็จ/.test(fatal()) && !!dealEl('d1') && !!deal('d1'), fatal());
  clearFatal(); CAT.denyWrite = false;

  // ── 4. ส่งออก · ยังไม่ติดตั้ง · สไตล์ ────────────────────────────────────
  await fresh(); showSection('catalog'); await sleep(250);
  CALLS.length = 0;
  $('catExport').click(); await sleep(350);
  ok('ส่งออก: หน้าต่างเปิด · เรียก export_promotions_json ด้วย scope all · ผลเป็น JSON อ่านได้', $('catExportDlg').open && rpcs('export_promotions_json').length === 1 && rpcs('export_promotions_json')[0].args.p_scope === 'all' && Array.isArray(JSON.parse($('exText').value)));
  const jAll = JSON.parse($('exText').value);
  ok('ทุกโปรที่เปิดอยู่ที่มีดีลใช้ได้ (มหาจักร · Starter Pack · เก่า · เดือนหน้าไม่มีดีล) รูปเดียวกับ promotions.json: id · name · startDate · endDate · products · gifts · conditions',
    jAll.map(p => p.id).join() === 'old-promo,starter-pack,mahajak-2026-10' && ['id', 'name', 'startDate', 'endDate', 'products', 'gifts', 'conditions'].every(k => k in jAll[2]), jAll.map(p => p.id).join());
  ok('ข้อมูลในไฟล์: CDJ-3000X ราคาปกติ 109000 โปร 98100 ลด 10% · ของแถมมี item+value', JSON.stringify(jAll[2].products[0]) === '{"model":"CDJ-3000X","regularPrice":109000,"promoPrice":98100,"discount":"10%"}' && jAll[2].products[1].gift.item === 'หูฟัง HDJ-CUE1' && jAll[2].products[1].gift.value === 2990, JSON.stringify(jAll[2].products[0]));
  ok('สรุปจำนวนโปร/ดีลที่ส่งออก · เตือนว่ามี _source ห้ามเผยแพร่', /3 โปร · 4 ดีลที่ใช้ได้/.test($('exInfo').textContent) && /ห้ามเผยแพร่/.test($('catExportDlg').textContent), $('exInfo').textContent);
  $('exScope').value = 'current'; $('exScope').dispatchEvent(new Event('change', { bubbles: true })); await sleep(300);
  const jCur = JSON.parse($('exText').value);
  ok('เปลี่ยนเป็น "เฉพาะที่ใช้ได้วันนี้": เรียกใหม่ด้วย scope current · เหลือมหาจักร+Starter Pack (ไม่มีโปรหมดเวลา/ยังไม่เริ่ม)', rpcs('export_promotions_json').length === 2 && rpcs('export_promotions_json')[1].args.p_scope === 'current' && jCur.map(p => p.id).join() === 'starter-pack,mahajak-2026-10', jCur.map(p => p.id).join());
  window.__dl = null; window.__blob = null;
  URL.createObjectURL = b => { window.__blob = b; return 'blob:test'; };
  HTMLAnchorElement.prototype.click = function () { window.__dl = this.download; };
  $('exDownload').click(); await sleep(200);
  ok('ดาวน์โหลด: ชื่อไฟล์ promotions-วันที่.json · เนื้อไฟล์ = ที่แสดงในช่อง', window.__dl === 'promotions-' + TODAY.replace(/-/g, '') + '.json' && !!window.__blob && (await window.__blob.text()) === $('exText').value, window.__dl);
  window.__clip = null;
  Object.defineProperty(navigator, 'clipboard', { value: { writeText: async t => { window.__clip = t; } }, configurable: true });
  $('exCopy').click(); await sleep(150);
  ok('คัดลอก: ข้อความ JSON ลงคลิปบอร์ด', window.__clip === $('exText').value);
  CAT.fail.export = 'function timeout';
  $('exScope').value = 'all'; $('exScope').dispatchEvent(new Event('change', { bubbles: true })); await sleep(300);
  ok('ส่งออกล้มเหลว: แจ้งในหน้าต่าง · ช่องว่าง · ปุ่มดาวน์โหลดไม่ส่งไฟล์ว่าง', /ส่งออกไม่สำเร็จ: function timeout/.test(dlgErr('exErr')) && $('exText').value === '');
  window.__dl = null; $('exDownload').click(); await sleep(100);
  ok('ปุ่มดาวน์โหลดตอนไม่มีไฟล์: ไม่ทำอะไร', window.__dl === null);
  CAT.fail = {}; $('catExportDlg').close();

  // ยังไม่ติดตั้ง 035
  CAT.noTables = true; await loadCatalog(); await showTab('products');
  ok('ยังไม่รัน 035 (ไม่มีตารางโปร): แจ้งว่าต้องรัน migration 035 · ไม่ขึ้น error แดงบนจอ · ยังเห็นรายการสินค้า', /ต้องรัน migration 035/.test($('catAlert').textContent) && !fatal() && document.querySelectorAll('#catList tr[data-id]').length === 10);
  await showTab('promos');
  ok('แท็บโปรตอนยังไม่ติดตั้ง: ไม่มีการ์ด · ไม่พัง', document.querySelectorAll('#promoList .promo').length === 0);
  CAT.noTables = false; CAT.noModelCol = true; await loadProducts(); await loadCatalog(); await showTab('products');
  ok('products ยังไม่มีคอลัมน์ model_code (ก่อน 035): แจ้งให้รัน 035 · ทุกรุ่นนับเป็น "ยังไม่มีรหัสบอท" ไม่พัง', /ต้องรัน migration 035/.test($('catAlert').textContent) && $('catStatGap').textContent === '10');
  CAT.noModelCol = false; await fresh(); showSection('catalog'); await sleep(250);
  CAT.fail.select = 'permission denied'; CAT.fail.table = 'promotions'; await loadCatalog();
  ok('โหลดโปรไม่สำเร็จ (error อื่น): แจ้งข้อความ error บนจอตามจริง · แท็บสินค้ายังใช้ได้', /โหลดโปรโมชันไม่สำเร็จ: permission denied/.test(fatal()) && /โหลดโปรโมชันไม่สำเร็จ/.test($('catAlert').textContent) && document.querySelectorAll('#catList tr[data-id]').length === 10, fatal());
  clearFatal(); CAT.fail = {}; await fresh(); showSection('catalog'); await sleep(250);

  // สไตล์: ตัวอักษร ≥ 14px · มุมเหลี่ยม
  await showTab('promos');
  const all = [...document.querySelectorAll('#sec-catalog *')].filter(e => vis(e) && e.children.length === 0 && e.textContent.trim());
  ok('ตัวหนังสือทุกส่วนของหมวดนี้ ≥ 14px', all.every(e => parseFloat(getComputedStyle(e).fontSize) >= 13.95), all.filter(e => parseFloat(getComputedStyle(e).fontSize) < 13.95).slice(0, 3).map(e => e.className + ':' + getComputedStyle(e).fontSize).join(' | '));
  ok('ทุกมุมเป็นเหลี่ยม (การ์ดโปร · ป้ายสถานะ · กลุ่มรายการ)', [...document.querySelectorAll('#sec-catalog .promo, #sec-catalog .promo-head, #sec-catalog .st, #sec-catalog .deal-btns button')].every(e => getComputedStyle(e).borderRadius === '0px'));
  await showTab('products');
  ok('ช่องติ๊กอยู่ในป้ายกว้างและสูง ≥ 44 (แตะที่ไหนในป้ายก็ติ๊ก)', [...document.querySelectorAll('#catList .cat-chk')].every(l => l.getBoundingClientRect().width >= 43.5 && l.getBoundingClientRect().height >= 43.5));

  // ── 5. admin / staff ─────────────────────────────────────────────────
  doLogout(); await sleep(400);
  CALLS.length = 0;
  await login('pao');
  ok('admin เห็นเมนู · เข้าหมวดได้ · แก้ได้ (ปุ่มแก้/ส่งออก/เพิ่มโปรเปิด)', !!document.querySelector('#navList .nav-item[data-s="catalog"]') && showSection('catalog') === true && !$('catExport').hidden && !$('promoAdd').hidden);
  await sleep(300);
  CALLS.length = 0; chk('a1').click(); await sleep(300);
  ok('admin ติ๊กเลิกขายได้ (ผ่าน RLS ของ owner/admin)', prod('a1').is_active === false && writes('products').length === 1 && CAT.log.length >= 1);
  chk('a1').click(); await sleep(300);

  // ออกจากระบบกลางคำขอโหลดโปร: ผลที่มาถึงทีหลังต้องถูกทิ้ง ไม่ถูกวาดลงหน้า/ไม่ค้างในหน่วยความจำ (ข้อมูลโปรของคนเดิม)
  await fresh(); showSection('catalog'); await sleep(250);
  let rel = null; CAT.gate = new Promise(r => { rel = r; });
  const pending = loadCatalog();
  doLogout(); await sleep(400);
  CAT.gate = null; rel(); await pending; await sleep(200);
  ok('ออกจากระบบกลางคำขอโหลดโปร: ผลที่มาถึงทีหลังถูกทิ้ง — ไม่มีโปรในหน่วยความจำ · ไม่มีชื่อโปรบนหน้า', cat.promos.length === 0 && cat.deals.length === 0 && !/มหาจักร|Starter Pack/.test($('sec-catalog').textContent), $('sec-catalog').textContent.slice(0, 80));

  await login('pao');
  await fresh(); showSection('catalog'); await sleep(250);
  chk('a1').click(); await sleep(300);
  ok('(ตั้งต้น) admin ติ๊กเลิกขายแล้ว แถบย้อนกลับขึ้นพร้อมข้อความ', !$('catUndo').hidden && /CDJ-3000X/.test(noteText()) && !$('catUndoBtn').hidden);
  chk('a1').click(); await sleep(300);                       // คืนค่า (ส่วน staff ข้างล่างต้องเห็นข้อมูลตั้งต้น) — แถบยังขึ้นอยู่ด้วยข้อความ "เปิดการขาย CDJ-3000X"
  doLogout(); await sleep(400);
  ok('ออกจากระบบ: แถบย้อนกลับหาย · ข้อความที่ค้างหาย · รายการ/โปรถูกล้างจากหน้า (ไม่ใช่แค่ซ่อน)', $('catUndo').hidden && $('catUndoText').textContent === '' && cat.promos.length === 0 && cat.last === null && !/CDJ-3000X|มหาจักร/.test($('sec-catalog').textContent), $('sec-catalog').textContent.slice(0, 100));
  CALLS.length = 0;
  await login('zen');
  ok('staff เห็นเมนูและเข้าหมวดได้ (ดูได้)', !!document.querySelector('#navList .nav-item[data-s="catalog"]') && showSection('catalog') === true);
  await sleep(350);
  ok('staff: โหลดรายการ + โปรได้เหมือนกัน (RLS: staff อ่านได้) · เห็นราคาโปรที่คำนวณแล้ว', document.querySelectorAll('#catList tr[data-id]').length === 10 && cat.promos.length === 5);
  ok('staff: ช่องติ๊กถูกปิด (disabled) · ไม่มีปุ่ม "แก้" · ไม่มีปุ่มส่งออก/เพิ่มโปร · มีข้อความ "ดูได้อย่างเดียว"', [...document.querySelectorAll('#catList input[data-act="toggle"]')].every(i => i.disabled) && !document.querySelector('#catList button[data-act="edit"]') && $('catExport').hidden && $('promoAdd').hidden && /ดูได้อย่างเดียว/.test($('catAlert').textContent));
  await showTab('promos');
  ok('staff: การ์ดโปรเห็นราคาโปรครบ แต่ไม่มีปุ่มเพิ่มดีล/แก้โปร/ปิดโปร/แก้ดีล/ลบดีล', /฿98,100/.test(txt(promoCard('pr1'))) && !document.querySelector('#promoList button[data-act]'));
  CALLS.length = 0;
  catToggle('a1', false, document.createElement('input')); await sleep(200);
  catEditOpen('a1'); promoOpen(null); dealOpen('pr1', null); catExportOpen(); await sleep(200);
  ok('staff เรียกฟังก์ชันตรง ๆ: ไม่มีหน้าต่างเปิดสักบาน · ไม่มีคำขอเขียนไปที่ฐานข้อมูลเลย · ราคา/สถานะไม่เปลี่ยน', !document.querySelector('dialog[open]') && !CALLS.some(c => ['insert', 'update', 'delete'].includes(c.op)) && !rpcs('export_promotions_json').length && prod('a1').is_active === true);
  const fn = document.querySelector('.fatal-error, #fatalError');
  ok('staff: ไม่มีข้อความ error แดงบนจอจากการดูหน้านี้', !fn);
  done();
}
function done() {
  L('=== สรุป: ' + pass + ' PASS / ' + fail + ' FAIL ===');
  L(fail ? 'RESULT:FAIL' : 'RESULT:PASS');
}
</script>`;

const net = '--host-resolver-rules=MAP * ~NOTFOUND';
const res = await runCdpPage({ root: pageRoot, file: 'desk.html', mock: MOCK3 + CAT_MOCK, tests: TESTS, width: 1440, height: 900, coarse: false, shotDir: SHOTS, flags: [net] });
console.log('\n=== catalog: ' + (res.ok ? 'ผ่าน' : 'ไม่ผ่านหรือไม่ได้รันจนจบ') + ' ===');
process.exit(res.ok ? 0 : 1);
