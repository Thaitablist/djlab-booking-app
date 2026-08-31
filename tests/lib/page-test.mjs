/**
 * ตัวรันเทสต์หน้าเว็บด้วย Chrome headless จริง
 *
 * วิธีตามกฎข้อ 2 ใน CLAUDE.md: ก๊อปไฟล์จริงมาแล้วสลับเฉพาะแท็ก <script src>
 * ของ Supabase เป็นตัวปลอม ไฟล์ที่ถูกทดสอบจึงเป็นของจริงทุกบรรทัด
 *
 * ตรรกะเครื่องยิงบาร์โค้ดผูกกับ event ของเบราว์เซอร์ (event.code, ลำดับ capture,
 * defaultPrevented) จำลองด้วย node ล้วนไม่ได้ จึงต้องเปิดเบราว์เซอร์จริง
 */

import { readFileSync, writeFileSync, mkdtempSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const SUPABASE_TAG = '<script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>';
const ZXING_TAG = '<script src="https://cdn.jsdelivr.net/npm/@zxing/library@0.21.3/umd/index.min.js"></script>';

export function runPage({ root, file, mock, tests }) {
  const html = readFileSync(join(root, file), 'utf8');

  // ถ้าแท็กในไฟล์จริงเปลี่ยนไป การสลับจะไม่เกิด แล้วเทสต์จะยิงเน็ตจริงโดยไม่มี
  // ใครรู้ — ต้องดังตรงนี้ก่อน
  if (!html.includes(SUPABASE_TAG)) {
    console.error(file + ': หาแท็ก Supabase ไม่เจอ — เทสต์นี้จะไม่ได้ทดสอบอะไรเลย');
    return { ran: false, ok: false, lines: [] };
  }

  const patched = html
    .replace(SUPABASE_TAG, mock)
    .replace(ZXING_TAG, '')
    .replace('</body>', tests + '\n</body>');

  const dir = mkdtempSync(join(tmpdir(), 'djlab-page-'));
  const target = join(dir, file.replace('.html', '.under-test.html'));
  writeFileSync(target, patched);

  const r = spawnSync(CHROME, [
    '--headless', '--disable-gpu', '--no-sandbox',
    '--enable-logging=stderr', '--v=1',
    '--virtual-time-budget=15000',
    '--dump-dom', 'file://' + target,
  ], { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 });

  const stderr = r.stderr || '';
  const lines = stderr.split('\n').filter(l => l.includes('[WEDGE]'));
  for (const l of lines) {
    const m = l.match(/\[WEDGE\] (.*?)"?,\s*source:/) || l.match(/\[WEDGE\] (.*)$/);
    console.log('  ' + (m ? m[1].replace(/"$/, '') : l));
  }

  const errors = stderr.split('\n').filter(l => /Uncaught|SyntaxError/.test(l));
  if (errors.length) {
    console.log('\n  มี error ในหน้าเว็บ:');
    errors.slice(0, 5).forEach(l => console.log('    ' + l));
  }

  const ran = lines.some(l => l.includes('RESULT:'));
  const ok = lines.some(l => l.includes('RESULT:PASS')) && !errors.length;
  if (!ran) console.log('  เทสต์ไม่ได้รันจนจบ — น่าจะพังตั้งแต่โหลดหน้า');
  return { ran, ok, lines };
}

/** โครงร่วมของสคริปต์เทสต์ที่ฝังลงหน้าเว็บ — ตัวช่วยพื้นฐานที่ทุกหน้าต้องใช้ */
export const HARNESS = `
let pass = 0, fail = 0;
const L = m => console.log('[WEDGE] ' + m);
function ok(name, cond, extra) {
  if (cond) { pass++; L('[PASS] ' + name); }
  else { fail++; L('[FAIL] ' + name + (extra ? ' — ' + extra : '')); }
}

// นาฬิกาปลอม คุมช่องไฟระหว่างปุ่มได้แม่น ๆ
let clock = 100000;
performance.now = () => clock;

// แป้นภาษาไทย: ปุ่มเดียวกันให้ตัวอักษรคนละตัว ตารางนี้ปลอมให้เหมือนของจริง
const THAI = { Digit1:'ๅ', Digit2:'/', Digit3:'-', Digit4:'ภ', Digit5:'ถ', Digit6:'ุ',
               Digit7:'ึ', Digit8:'ค', Digit9:'ต', Digit0:'จ' };
function thaiKeyFor(code) { return THAI[code] || 'ก'; }

function press(code, opts) {
  opts = opts || {};
  const target = opts.target || document;
  const ev = new KeyboardEvent('keydown', {
    code,
    key: opts.key !== undefined ? opts.key : thaiKeyFor(code),
    shiftKey: !!opts.shiftKey,
    bubbles: true, cancelable: true,
  });
  target.dispatchEvent(ev);
  return ev;
}

// ยิงหนึ่งชุด: ตัวอักษรห่างกัน gap ms ปิดท้ายด้วย Enter
function burst(codes, opts) {
  opts = opts || {};
  const gap = opts.gap === undefined ? 6 : opts.gap;
  clock += 5000;                       // เว้นให้ห่างจากชุดก่อนหน้า
  codes.forEach((c, i) => {
    if (i) clock += gap;
    press(c, { target: opts.target });
  });
  clock += gap;
  return press('Enter', { target: opts.target, key: 'Enter' });
}

// ยิงชุดที่มีตัวอักษร: [[code, ใช้ Shift ไหม], ...] เครื่องยิงกด Shift คั่นจริง
function burstMixed(seq, opts) {
  opts = opts || {};
  clock += 5000;
  seq.forEach(([code, sh], i) => {
    if (i) clock += 6;
    if (sh) { press('ShiftLeft', { key: 'Shift', target: opts.target }); clock += 2; }
    press(code, { shiftKey: !!sh, key: sh ? 'ก' : thaiKeyFor(code), target: opts.target });
  });
  clock += 6;
  return press('Enter', { key: 'Enter', target: opts.target });
}

const digits = s => s.split('').map(d => 'Digit' + d);

function spy() {
  const calls = [];
  const original = window.onScanned;
  window.onScanned = async (code, viaGun) => { calls.push({ code, viaGun }); };
  return { calls, restore: () => { window.onScanned = original; } };
}
`;
