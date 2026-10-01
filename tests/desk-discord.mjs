/**
 * เทสต์หมวด Discord ของ desk.html (#discord · ห้อง staff-only ผ่าน Edge Function `discord`)
 *   รัน: node tests/desk-discord.mjs
 *
 * ใช้ตัวปลอม Supabase ชุดเดียวกับ desk-home3 แล้วเติมฟังก์ชัน `discord` ปลอม (window.FN.discord)
 * คนในห้องเป็นชื่อสมมติทั้งหมด (Pim · Korn · Mook) · "TiBass" คือบัญชีทดสอบที่ล็อกอิน (ตัวอย่างชื่อหน้าข้อความจากคอนโซล)
 * ตัดเน็ตทั้งหมด (host-resolver) ไม่มีอะไรไปโหลดของจริง
 */

import { dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { runPage, HARNESS } from './lib/page-test.mjs';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const { MOCK: MOCK3 } = await import(pathToFileURL(join(root, 'tests/desk-home3.mjs')).href);

// ห้องปลอม — ใช้ทั้งในเทสต์และภาพหน้าจอ (ชื่อคนสมมติ)
export const DISCORD_MOCK = `<script>
const DC_CH = '1515751634087706724', DC_BOT = '700000000000000007';
const dcAt = (hhmm, day) => new Date((day || TODAY) + 'T' + hhmm + ':00+07:00').toISOString();
const dcU = {
  pim:  { id: '100000000000000001', name: 'Pim', avatar: '', bot: false },
  korn: { id: '100000000000000002', name: 'Korn', avatar: '', bot: false },
  mook: { id: '100000000000000003', name: 'Mook', avatar: '', bot: false },
  bot:  { id: DC_BOT, name: 'DJ LAB Bot', avatar: '', bot: true },
};
let dcSeq = 0;
const dcId = () => '13000000000000' + String(100 + (++dcSeq)).padStart(4, '0');
function dcMsg(author, hhmm, content, extra, day) {
  return Object.assign({ id: dcId(), type: 0, system: false, author, content, timestamp: dcAt(hhmm, day), edited: false,
    attachments: [], embeds: [], stickers: [], reference: null }, extra || {});
}
window.DC = { mode: 'ok', calls: [], hold: null, sendError: null, msgs: [] };
DC.conversation = function () {
  const y = (() => { const d = new Date(TODAY + 'T12:00:00'); d.setDate(d.getDate() - 1); return d.toLocaleDateString('en-CA'); })();
  const a = dcMsg(dcU.mook, '19:40', 'ปิดร้านเรียบร้อย นับเงินในลิ้นชักตรงยอดแล้วนะ', null, y);
  const b = dcMsg(dcU.pim, '10:02', 'อรุณสวัสดิ์ค่ะทุกคน วันนี้ของล็อตใหม่เข้าบ่ายสองนะคะ');
  const c = dcMsg(dcU.pim, '10:03', 'ฝากเช็กชั้นวาง DJM-S11 ด้วยค่ะ เหลือเครื่องโชว์เครื่องเดียว');
  const d = dcMsg(dcU.korn, '10:15', 'ชั้นวางตอนนี้ครับ ช่องขวาว่างแล้ว', { attachments: [{ url: 'https://cdn.discordapp.com/attachments/1/2/shelf.jpg?ex=1', filename: 'shelf.jpg',
    content_type: 'image/jpeg', width: 1200, height: 800, size: 245000 }] });
  const e = dcMsg(dcU.korn, '10:16', 'ลูกค้าโทรถามคอร์ส **Turntablism** ว่ารอบถัดไปเริ่มวันไหน');
  const f = dcMsg(dcU.bot, '10:20', '**[TiBass]** เดี๋ยวผมโทรกลับเองครับ ฝากเบอร์ไว้ที่กระดานข้อความด้วย',
    { type: 19, reference: { id: e.id, author: 'Korn', snippet: 'ลูกค้าโทรถามคอร์ส **Turntablism** ว่ารอบถัดไปเริ่มวันไหน' } });
  const g = dcMsg(dcU.mook, '10:31', 'ใบเสนอราคา \\\`QT-0412\\\` ส่งให้ลูกค้าแล้วนะ ไฟล์อยู่นี่', { attachments: [{ url: 'https://cdn.discordapp.com/attachments/1/3/QT-0412.pdf',
    filename: 'QT-0412.pdf', content_type: 'application/pdf', width: null, height: null, size: 182000 }] });
  const h = dcMsg(dcU.pim, '10:34', 'รับทราบค่ะ ขอบคุณมากค่ะ 🙏 ดูตารางคอร์สได้ที่ https://djlabsiam.com', { reference: { id: g.id, author: 'Mook', snippet: 'ใบเสนอราคา QT-0412 ส่งให้ลูกค้าแล้วนะ ไฟล์อยู่นี่' } });
  return [a, b, c, d, e, f, g, h];
};
DC.msgs = DC.conversation();
const dcCmp = (a, b) => a.length - b.length || (a < b ? -1 : a > b ? 1 : 0);
window.FN.discord = b => {
  DC.calls.push(JSON.parse(JSON.stringify(b)));
  if (DC.mode === 'setup') return { error: { code: 'not_configured', message: 'ยังไม่ได้ตั้งค่าโทเคนบอท Discord' } };
  if (DC.mode === 'down') return { error: { code: 'discord_error', message: 'ติดต่อ Discord ไม่ได้ — ลองใหม่อีกครั้ง' } };
  const channel = { id: DC_CH, name: '🪴｜staff-only' };
  if (b.action === 'status') return { configured: true, channel, bot_id: DC_BOT, prefix: '**[TiBass]** ', max_len: 2000 };
  if (b.action === 'list') {
    let all = DC.msgs.slice().sort((x, y) => dcCmp(x.id, y.id)), list;
    if (b.after) list = all.filter(m => dcCmp(m.id, b.after) > 0).slice(0, 50);
    else if (b.before) list = all.filter(m => dcCmp(m.id, b.before) < 0).slice(-50);
    else list = all.slice(-50);
    const more = b.after ? false : b.before ? all.filter(m => dcCmp(m.id, b.before) < 0).length > 50 : all.length > 50;
    return { channel, bot_id: DC_BOT, messages: JSON.parse(JSON.stringify(list)), has_more: more };
  }
  if (b.action === 'send') {
    if (DC.sendError) return { error: DC.sendError };
    const m = dcMsg(dcU.bot, new Date().toLocaleTimeString('en-GB', { timeZone: 'Asia/Bangkok', hour: '2-digit', minute: '2-digit' }),
      '**[TiBass]** ' + b.content, b.reply_to ? { type: 19, reference: { id: b.reply_to, author: 'x', snippet: 'x' } } : null);
    m.timestamp = new Date().toISOString();
    DC.msgs.push(m);
    const out = { message: JSON.parse(JSON.stringify(m)) };
    if (DC.hold) return new Promise(r => { DC.release = () => r(out); });
    return out;
  }
  return { error: { code: 'bad_request', message: 'x' } };
};
</script>`;

const TESTS = `<script>
window.addEventListener('load', () => setTimeout(runTests, 300));
${HARNESS}
const sleep = ms => new Promise(r => setTimeout(r, ms));
const Q = s => document.querySelector(s);
const QA = s => [...document.querySelectorAll(s)];
const cs = el => getComputedStyle(el);
const vis = el => !!el && !el.closest('[hidden]') && el.getClientRects().length > 0;
const dcFn = () => CALLS.filter(c => c.op === 'fn' && c.name === 'discord').map(c => c.body);
const lastDc = a => DC.calls.filter(c => c.action === a).pop();
function key(el, k, mods) {
  clock += 5000;
  const ev = new KeyboardEvent('keydown', Object.assign({ key: k, code: k.length === 1 ? 'Key' + k.toUpperCase() : k, bubbles: true, cancelable: true }, mods || {}));
  el.dispatchEvent(ev);
  return ev;
}
function typeIn(el, text) { el.focus(); el.value = text; el.dispatchEvent(new Event('input', { bubbles: true })); }
const XSS = '<script>window.PWNED=1<\\/script><img src=x onerror="window.PWNED=2"><svg onload="window.PWNED=3">';

async function runTests() {
  L('=== หมวด Discord (ห้อง staff-only) ===');
  localStorage.removeItem('djlab.desk.accounts.v1');
  // ข้อความที่มี XSS ทุกช่องที่มาจาก Discord: เนื้อความ · ชื่อคน · ไฟล์ · embed · ข้อความที่ถูกตอบ (เก่าสุดในห้อง · เมื่อวาน)
  const yday = (() => { const d = new Date(TODAY + 'T12:00:00'); d.setDate(d.getDate() - 1); return d.toLocaleDateString('en-CA'); })();
  DC.msgs.unshift(dcMsg({ id: '100000000000000009', name: XSS, avatar: 'javascript:alert(1)', bot: false }, '09:00',
    XSS + ' **<b>หนา</b>** [กดเลย](javascript:window.PWNED=4) [ดี](https://example.com/ok) https://example.com/a?b=1.',
    { attachments: [{ url: 'javascript:window.PWNED=5', filename: XSS, content_type: 'image/png', width: 10, height: 10 },
                    { url: 'https://cdn.discordapp.com/x/' + encodeURIComponent('"><img src=x onerror=window.PWNED=6>'), filename: '<img src=x onerror=window.PWNED=7>.zip', content_type: 'application/zip', size: 3000 }],
      embeds: [{ title: XSS, description: XSS, url: 'javascript:window.PWNED=8' }],
      reference: { id: '1', author: XSS, snippet: XSS } }, yday));
  DC.msgs[0].id = '13000000000000' + '0050';    // รหัสยาวเท่ากัน ค่าน้อยกว่า = เก่ากว่าทุกข้อความ
  // [0] XSS · [1] Mook เมื่อวาน · [2] Pim 10:02 · [3] Pim 10:03 · [4] Korn รูป · [5] Korn · [6] TiBass ผ่านคอนโซล ตอบ [5] · [7] Mook PDF · [8] Pim ตอบ [7]
  localStorage.setItem('djlab.discord.seen.v1:u1', DC.msgs[3].id);       // เคยอ่านถึงข้อความของ Pim 10:03
  document.getElementById('loginEmail').value = 'tibass@x';
  document.getElementById('loginPassword').value = 'x';
  await doLogin();
  await sleep(500);

  // ── 1. เมนู · คีย์ลัด · ย้อนกลับ ─────────────────────────────────────────
  const nav = Q('.nav-item[data-s="discord"]');
  ok('มีเมนู Discord ในกลุ่มพนักงาน (ต่อจากปฏิทิน)', !!nav && nav.closest('.nav-group').querySelector('.nav-group-title').textContent === 'พนักงาน' &&
    nav.previousElementSibling && nav.previousElementSibling.dataset.s === 'calendar');
  ok('ไอคอนเมนูเป็น SVG เส้น 1.75 วาดเอง (ไม่ใช่โลโก้ ไม่ใช่อักขระ)', !!nav.querySelector('.ico svg.ico-svg') && nav.querySelector('.ico').textContent.trim() === '' &&
    cs(nav.querySelector('.ico svg')).strokeWidth === '1.75px');
  ok('คีย์ลัด Alt+S ว่างอยู่จริง ไม่ชนหมวดอื่น/เครื่องคิดเลข', SECTIONS.filter(s => s.key === 'S').length === 1 && nav.querySelector('.kbd').textContent === 'Alt+S');
  ok('หน้าคีย์ลัด (?) มี Alt+S และวิธีใช้ห้อง', /Alt\\s*\\+\\s*S/.test(Q('#helpDialog').textContent) && Q('#helpDialog').textContent.indexOf('ห้อง staff-only') !== -1 &&
    Q('#helpDialog').textContent.indexOf('Shift') !== -1);
  ok('ยังไม่ได้เปิดห้อง: นับยังไม่ได้อ่าน 4 (ใหม่กว่าที่เคยอ่าน ไม่นับของที่ส่งจากคอนโซลในชื่อฉัน)', dc.unread === 4, dc.unread);
  const nb = Q('#navBadge-discord');
  ok('ตัวเลขแดงข้างเมนู = 4', !!nb && !nb.hidden && nb.textContent === '4' && nb.getAttribute('aria-label') === 'ยังไม่ได้อ่าน 4');

  // ── 2. ไอคอนลัดบนหน้าแรก ─────────────────────────────────────────────
  const li = LAUNCH_ITEMS.find(x => x.key === 'discord');
  ok('ไอคอนลัด Discord: ชื่อ · ไอคอนแชตวาดเอง · สีกลาง ๆ ไม่ใช่สีของ Discord (#5865F2)', !!li && li.t === 'Discord' && li.icon === 'chat' && !!ICON_PATHS.chat &&
    /^#[0-9A-F]{6}$/.test(li.color) && li.color.toUpperCase() !== '#5865F2' && typeof li.badge === 'function');
  homePrefs.launcher = ['discord', 'pos', 'mail', 'calendar'];
  showSection('home');
  await sleep(100);
  const tile = Q('#launcher .lt[data-key="discord"]');
  ok('ไอคอนลัดมีตัวเลขยังไม่ได้อ่าน 4 · บอกในชื่อปุ่ม', !!tile && tile.querySelector('.badge').textContent === '4' && tile.getAttribute('aria-label') === 'Discord — รออยู่ 4');
  ok('เส้นไอคอนบนพื้นสีคอนทราสต์ ≥ 3:1 (launchInk)', contrastRatio(li.color, launchInk(li.color)) >= 3);

  // ── 3. เปิดห้อง: ลำดับ · กลุ่ม · ผ่านคอนโซล · รูป · ไฟล์ · ตอบกลับ ─────────────
  key(document.body, 'KeyS', { altKey: true, code: 'KeyS', key: 'ß' });
  await sleep(300);
  ok('Alt+S เปิดหมวด · URL เป็น #discord · ชื่อหน้า', current === 'discord' && location.hash === '#discord' && Q('#pageTitle').textContent === 'Discord');
  ok('หัวแผงแบบ B (พื้น #E3DFD5 + เส้นดำ 2px) มีชื่อห้องจาก Discord', cs(Q('#sec-discord .panel-head')).backgroundColor === 'rgb(227, 223, 213)' &&
    cs(Q('#sec-discord .panel-head')).borderBottomWidth === '2px' && Q('#dcTitle').textContent === '🪴｜staff-only');
  ok('เปิดห้องแล้ว = อ่านแล้ว: ตัวเลขหาย · จำรหัสข้อความล่าสุดแยกตามคน', dc.unread === 0 && nb.hidden &&
    localStorage.getItem('djlab.discord.seen.v1:u1') === DC.msgs[DC.msgs.length - 1].id);
  ok('มีเส้นแดง "ข้อความใหม่" เหนือข้อความแรกที่ยังไม่ได้อ่าน', !!Q('.dc-new') && Q('.dc-new').nextElementSibling.dataset.id === DC.msgs[4].id);
  const rows = QA('#dcList .dc-msg');
  ok('เรียงเก่าบน ใหม่ล่าง', rows.length === 9 && rows[rows.length - 1].dataset.id === DC.msgs[DC.msgs.length - 1].id && rows[0].dataset.id === DC.msgs[0].id);
  const log = Q('#dcLog');
  ok('เปิดมาเลื่อนอยู่ล่างสุด (ข้อความใหม่สุดอยู่ในจอ)', log.scrollHeight - log.scrollTop - log.clientHeight < 2, log.scrollHeight + ' ' + log.scrollTop + ' ' + log.clientHeight);
  ok('มีเส้นแบ่งวัน: เมื่อวาน · วันนี้', QA('.dc-day').map(d => d.textContent).join('|') === 'เมื่อวาน|วันนี้', QA('.dc-day').map(d => d.textContent).join('|'));
  const row = id => Q('#dcList .dc-msg[data-id="' + id + '"]');
  const pimB = row(DC.msgs[2].id), pimC = row(DC.msgs[3].id);
  ok('ข้อความติดกันของคนเดียวกัน = กลุ่มเดียว (ข้อความที่สองไม่มีชื่อ/รูปซ้ำ แต่มีเวลาเมื่อชี้)', !!pimB && !pimB.classList.contains('cont') &&
    pimB.querySelector('.dc-name').textContent === 'Pim' && pimC.classList.contains('cont') && !pimC.querySelector('.dc-name') && pimC.querySelector('.dc-stamp').textContent === '10:03');
  ok('เวลาเป็นเวลาไทย 24 ชม.', pimB.querySelector('.dc-time').textContent === '10:02', pimB.querySelector('.dc-time').textContent);
  const via = row(DC.msgs[6].id);
  ok('ข้อความจากคอนโซล: ชื่อคนส่งแทนชื่อบอท + "· ผ่านคอนโซล" · หัว **[TiBass]** ไม่โผล่ในเนื้อความ', via.querySelector('.dc-name').textContent === 'TiBass' &&
    via.querySelector('.dc-via').textContent === '· ผ่านคอนโซล' && via.querySelector('.dc-text').textContent === 'เดี๋ยวผมโทรกลับเองครับ ฝากเบอร์ไว้ที่กระดานข้อความด้วย' &&
    !via.querySelector('.dc-tag'), via.textContent);
  ok('ข้อความตอบกลับโชว์ข้อความต้นทางย่อ (ชื่อ + ข้อความบรรทัดเดียว)', via.querySelector('.dc-quote strong').textContent === 'Korn' &&
    via.querySelector('.dc-quote span').textContent.indexOf('ลูกค้าโทรถามคอร์ส') === 0);
  const pimReply = row(DC.msgs[8].id);
  ok('ข้อความตอบกลับไม่ถูกรวมกลุ่ม (มีชื่อเสมอ)', !pimReply.classList.contains('cont') && pimReply.querySelector('.dc-name').textContent === 'Pim');
  const shot = row(DC.msgs[4].id).querySelector('a.dc-img');
  ok('รูปแนบ = ภาพย่อในหน้า กดแล้วเปิดรูปเต็มแท็บใหม่ (noopener)', !!shot && shot.href.indexOf('https://cdn.discordapp.com/attachments/1/2/shelf.jpg') === 0 &&
    shot.target === '_blank' && /noopener/.test(shot.rel) && shot.querySelector('img').getAttribute('src') === shot.getAttribute('href') &&
    shot.querySelector('img').width <= 320 && shot.querySelector('img').height <= 220);
  const chip = row(DC.msgs[7].id).querySelector('a.dc-file');
  ok('ไฟล์อื่น = ป้ายไฟล์ (ชื่อ + ขนาด) เปิดแท็บใหม่', !!chip && chip.textContent.indexOf('QT-0412.pdf') !== -1 && chip.textContent.indexOf('178 KB') !== -1 && chip.target === '_blank');
  ok('markdown: **หนา** → <strong> · \`โค้ด\` → <code> · ลิงก์ → <a> แท็บใหม่', row(DC.msgs[5].id).querySelector('.dc-text strong').textContent === 'Turntablism' &&
    row(DC.msgs[7].id).querySelector('.dc-text code').textContent === 'QT-0412' &&
    pimReply.querySelector('.dc-text a').href === 'https://djlabsiam.com/' && pimReply.querySelector('.dc-text a').target === '_blank');

  // ── 4. XSS ─────────────────────────────────────────────────────────────
  const x = row(DC.msgs[0].id);
  ok('XSS: ไม่มีอะไรรัน (window.PWNED ว่าง)', window.PWNED === undefined, window.PWNED);
  ok('XSS: <script> / <img onerror> / <svg onload> ในเนื้อความเป็นตัวหนังสือ ไม่ใช่ element', !!x && !x.querySelector('script, svg[onload], img[onerror], [onerror], [onload]') &&
    x.querySelector('.dc-text').textContent.indexOf('<script>window.PWNED=1') === 0);
  ok('XSS: ชื่อคนที่เป็น HTML แสดงเป็นตัวหนังสือ', x.querySelector('.dc-name').textContent === XSS && !x.querySelector('.dc-name *'));
  ok('XSS: HTML ในตัวหนาเป็นตัวหนังสือ', x.querySelector('.dc-text strong').textContent === '<b>หนา</b>' && !x.querySelector('.dc-text strong b'));
  const links = [...x.querySelectorAll('a')];
  ok('XSS: ลิงก์ javascript: ไม่กลายเป็นลิงก์ (ทั้งในเนื้อความ ไฟล์แนบ และ embed)', links.every(a => /^https:/.test(a.href)), links.map(a => a.href).join(' '));
  ok('ลิงก์ที่มีชื่อ [ดี](https://…) = ลิงก์ · ชี้แล้วเห็นที่อยู่จริง', links.some(a => a.textContent === 'ดี' && a.href === 'https://example.com/ok' && a.title === 'https://example.com/ok'));
  ok('ลิงก์เปล่าไม่กินจุดท้ายประโยค', links.some(a => a.textContent === 'https://example.com/a?b=1'));
  ok('ทุกลิงก์เปิดแท็บใหม่ rel=noopener', links.length >= 3 && links.every(a => a.target === '_blank' && /noopener/.test(a.rel)));
  ok('XSS: รูปโปรไฟล์ javascript: ไม่ถูกใช้ (ได้ตัวอักษรแทน)', !x.querySelector('img.dc-ava') && !!x.querySelector('span.dc-ava'));
  ok('XSS: ไฟล์แนบ url javascript: ไม่ถูกแสดง · ชื่อไฟล์ที่เป็น HTML เป็นตัวหนังสือ', x.querySelectorAll('.dc-atts > *').length === 1 &&
    x.querySelector('.dc-file span').textContent === '<img src=x onerror=window.PWNED=7>.zip');
  ok('XSS: embed (หัว/คำอธิบาย) และข้อความที่ถูกตอบ เป็นตัวหนังสือ', x.querySelector('.dc-embed strong').textContent === XSS && !x.querySelector('.dc-embed a') &&
    x.querySelector('.dc-quote strong').textContent === XSS);
  const fr = dcMd('<img src=x onerror=alert(1)><script>alert(2)<\\/script>');
  ok('dcMd: HTML ล้วน = Text node ล้วน ไม่มี element', [...fr.childNodes].every(n => n.nodeType === 3), [...fr.childNodes].map(n => n.nodeName).join());
  ok('dcMd: \`\`\`บล็อก\`\`\` → <pre> · _เอียง_ → <em> · ขีดในคำ (a_b_c) ไม่เอียง', (() => { const d = document.createElement('div');
    d.append(dcMd('\`\`\`\\nline1\\nline2\`\`\` _ช้า ๆ_ snake_case_name')); return d.querySelector('pre').textContent === 'line1\\nline2' &&
    d.querySelectorAll('em').length === 1 && d.querySelector('em').textContent === 'ช้า ๆ'; })());
  ok('ไม่มี innerHTML ในโค้ดวาดข้อความ (dcMsgNode · dcMd · dcPut · dcAppend)', ['dcMsgNode', 'dcMd', 'dcPut', 'dcAppend', 'dcRenderReplying', 'dcRenderNote'].every(f => window[f].toString().indexOf('innerHTML') === -1));

  // ── 5. ตัวหนังสือ ≥ 14px ──────────────────────────────────────────────
  const small = QA('#sec-discord *').filter(el => el.childNodes.length && [...el.childNodes].some(n => n.nodeType === 3 && n.textContent.trim()) && parseFloat(cs(el).fontSize) < 14);
  ok('ตัวหนังสือในห้องไม่เล็กกว่า 14px (กฎข้อ 6)', !small.length, small.map(e => e.className + ':' + cs(e).fontSize).join());

  // ── 6. ส่ง · Enter / Shift+Enter · ตอบกลับ · ระหว่างส่ง ─────────────────────
  const inp = Q('#dcInput'), btn = Q('#dcSendBtn');
  ok('ช่องพิมพ์ได้โฟกัสเมื่อเปิดห้อง · บอกชื่อที่จะขึ้นหน้าข้อความ', document.activeElement === inp && Q('#dcPrefix').textContent === '[TiBass]');
  ok('ช่องว่าง = ปุ่มส่งกดไม่ได้', btn.disabled);
  typeIn(inp, 'บรรทัดแรก');
  const sh = key(inp, 'Enter', { shiftKey: true, code: 'Enter' });
  ok('Shift+Enter = ขึ้นบรรทัดใหม่ ไม่ส่ง', !sh.defaultPrevented && !lastDc('send'));
  typeIn(inp, 'บรรทัดแรก\\nบรรทัดสอง');
  DC.hold = true;
  const ev = key(inp, 'Enter', { code: 'Enter' });
  await sleep(20);
  ok('Enter = ส่ง (ข้อความครบทั้งสองบรรทัด ไม่ส่งชื่อหน้าข้อความไปเอง)', ev.defaultPrevented && lastDc('send') && lastDc('send').content === 'บรรทัดแรก\\nบรรทัดสอง' && !('reply_to' in lastDc('send')));
  ok('ระหว่างส่ง: ปุ่มกดไม่ได้ · ช่องพิมพ์อ่านอย่างเดียว · Enter ซ้ำไม่ส่งซ้ำ', btn.disabled && inp.readOnly && (key(inp, 'Enter', { code: 'Enter' }), DC.calls.filter(c => c.action === 'send').length === 1));
  DC.release();
  DC.hold = false;
  await sleep(50);
  const mine = QA('#dcList .dc-msg').pop();
  ok('ส่งแล้ว: ช่องว่าง · ข้อความขึ้นท้ายห้องทันทีในชื่อ TiBass · ผ่านคอนโซล', inp.value === '' && !inp.readOnly && mine.querySelector('.dc-name') &&
    mine.querySelector('.dc-name').textContent === 'TiBass' && mine.querySelector('.dc-text').textContent === 'บรรทัดแรก\\nบรรทัดสอง', mine.textContent);
  ok('ข้อความของฉันเองไม่ถูกนับเป็นยังไม่ได้อ่าน', dc.unread === 0);
  // ตอบกลับด้วยเมาส์ (ปุ่มโผล่เมื่อชี้)
  const korn = row(DC.msgs[5].id);
  const rb = korn.querySelector('button[data-reply]');
  ok('ทุกข้อความมีปุ่มตอบกลับ (ซ่อนจนชี้/โฟกัส)', !!rb && cs(korn.querySelector('.dc-acts')).display === 'none' && rb.getAttribute('aria-label') === 'ตอบกลับ Korn');
  rb.click();
  await sleep(20);
  ok('กดตอบกลับ: แถบ "กำลังตอบกลับ Korn" + โฟกัสช่องพิมพ์', !Q('#dcReplying').hidden && Q('#dcReplying strong').textContent === 'Korn' && document.activeElement === inp);
  key(inp, 'Escape', { code: 'Escape' });
  ok('Esc ในช่องพิมพ์ = ยกเลิกการตอบกลับ (ช่องยังโฟกัสอยู่)', Q('#dcReplying').hidden && dc.replyTo === null && document.activeElement === inp);
  // ตอบกลับด้วยคีย์บอร์ด: ↑ เลือกข้อความ · R
  log.focus();
  key(log, 'ArrowUp', { code: 'ArrowUp' });
  key(document.activeElement, 'ArrowUp', { code: 'ArrowUp' });
  const picked = document.activeElement;
  ok('คีย์บอร์ด: ↑ เลือกข้อความทีละอัน (เส้นดำซ้าย)', picked.classList.contains('dc-msg') && picked.dataset.id === DC.msgs[DC.msgs.length - 2].id, picked.dataset && picked.dataset.id);
  key(picked, 'r', { code: 'KeyR', key: 'พ' });
  ok('R (แป้นไทยก็ได้) = ตอบกลับข้อความที่เลือก', dc.replyTo && dc.replyTo.id === picked.dataset.id && document.activeElement === inp);
  typeIn(inp, 'ได้ครับ');
  key(inp, 'Enter', { code: 'Enter' });
  await sleep(50);
  ok('ส่งตอบกลับ = reply_to เป็นรหัสข้อความนั้น · ส่งแล้วแถบตอบกลับหาย', lastDc('send').reply_to === picked.dataset.id && Q('#dcReplying').hidden);

  // ── 7. ตัวนับใกล้เพดาน 2000 ───────────────────────────────────────────
  typeIn(inp, 'ก'.repeat(100));
  ok('ข้อความสั้น = ไม่โชว์ตัวนับ', Q('#dcCount').hidden);
  const room = 2000 - '**[TiBass]** '.length;
  typeIn(inp, 'ก'.repeat(room - 150));
  ok('ใกล้เพดาน = "เหลือ 150 ตัวอักษร" (นับชื่อหน้าข้อความด้วย)', !Q('#dcCount').hidden && Q('#dcCount').textContent === 'เหลือ 150 ตัวอักษร' && !btn.disabled, Q('#dcCount').textContent);
  typeIn(inp, 'ก'.repeat(room) + '@here');
  ok('เกิน = "เกิน n ตัวอักษร" สีเข้ม · ปุ่มส่งกดไม่ได้ (นับอักขระกัน @here ด้วย)', Q('#dcCount').textContent === 'เกิน 6 ตัวอักษร' && Q('#dcCount').classList.contains('over') && btn.disabled,
    Q('#dcCount').textContent);
  const n0 = DC.calls.filter(c => c.action === 'send').length;
  key(inp, 'Enter', { code: 'Enter' });
  await sleep(20);
  ok('เกินแล้วกด Enter = ไม่ส่ง ข้อความยังอยู่', DC.calls.filter(c => c.action === 'send').length === n0 && inp.value.length === room + 5);
  typeIn(inp, 'ก'.repeat(room));
  ok('พอดีเพดาน = ส่งได้', !btn.disabled && Q('#dcCount').textContent === 'เหลือ 0 ตัวอักษร');

  // ── 8. ส่งไม่สำเร็จ = เห็นชัด ข้อความไม่หาย ─────────────────────────────
  DC.sendError = { code: 'rate_limited', message: 'Discord ขอให้รอ 30 วินาทีก่อนลองใหม่ (ส่ง/อ่านถี่เกินไป)', retry_after: 30 };
  typeIn(inp, 'ส่งไม่ผ่าน');
  key(inp, 'Enter', { code: 'Enter' });
  await sleep(50);
  const al = Q('#dcNote .alert');
  ok('ส่งไม่ได้ (429): แถบแดง role=alert บอกเหตุผล + toast · ข้อความยังอยู่ในช่อง', !!al && al.getAttribute('role') === 'alert' && al.textContent.indexOf('30 วินาที') !== -1 &&
    inp.value === 'ส่งไม่ผ่าน' && !inp.readOnly && Q('#toast').textContent.indexOf('ไม่สำเร็จ') !== -1);
  DC.sendError = null;
  key(inp, 'Enter', { code: 'Enter' });
  await sleep(50);
  ok('ส่งใหม่ผ่าน = แถบแดงหาย', !Q('#dcNote .alert') && inp.value === '');

  // ── 9. เครื่องยิงบาร์โค้ดตอนช่องพิมพ์โฟกัส ───────────────────────────────
  // พิมพ์ค้างไว้เกือบเต็มเพดาน (เหลือ 5) — ตัวอักษรของการยิง 12 ตัวจะดันเกินชั่วคราว
  const draft = 'กำลังพิมพ์' + 'ก'.repeat(room - 5 - 'กำลังพิมพ์'.length);
  typeIn(inp, draft);
  const sendsBefore = DC.calls.filter(c => c.action === 'send').length;
  const sp = spy();
  // ตัวอักษรของการยิงหล่นลงช่องจริง ๆ (เหมือนเบราว์เซอร์ทำเองเมื่อไม่มีใครกันปุ่ม) — ภาษาไทยเพราะแป้นเป็นไทย
  clock += 5000;
  digits('619659216054').forEach((c, i) => {
    if (i) clock += 6;
    const e = press(c, { target: inp });
    if (!e.defaultPrevented) { inp.value += thaiKeyFor(c); inp.dispatchEvent(new Event('input', { bubbles: true })); }
  });
  ok('ระหว่างยิง ตัวอักษรหล่นลงช่องพิมพ์จริง (เทสต์นี้ทดสอบของจริง)', inp.value.length > draft.length && Q('#dcCount').classList.contains('over') && btn.disabled, inp.value.length);
  clock += 6;
  const enterEv = press('Enter', { target: inp, key: 'Enter' });
  ok('Enter ของการยิงถูกหยุดก่อนถึงตัวส่ง', enterEv.defaultPrevented);
  await sleep(50);
  sp.restore();
  ok('ยิงบาร์โค้ดใส่ช่องพิมพ์: ไม่ถูกส่งเข้าห้อง', DC.calls.filter(c => c.action === 'send').length === sendsBefore);
  ok('ยิงบาร์โค้ดใส่ช่องพิมพ์: ข้อความที่พิมพ์ค้างไว้กลับมาครบ (ไม่มีตัวอักษรของการยิงค้าง)', inp.value === draft, inp.value.length);
  ok('ยิงบาร์โค้ดในห้อง Discord = ไปหาสินค้า (เหมือนหน้าแรก)', sp.calls.length === 1 && sp.calls[0].code === '619659216054' && scanPurpose === 'search',
    JSON.stringify(sp.calls) + ' ' + scanPurpose);
  ok('หลังยิง ตัวนับ/ปุ่มส่งกลับมาตรงกับข้อความในช่อง (เหลือ 5 · ส่งได้)', !btn.disabled && Q('#dcCount').textContent === 'เหลือ 5 ตัวอักษร' &&
    !Q('#dcCount').classList.contains('over'), Q('#dcCount').textContent + ' ' + btn.disabled);
  // คนพิมพ์เอง (ช้ากว่า 50ms) แล้วกด Enter = ส่งตามปกติ
  typeIn(inp, '');
  clock += 5000;
  for (const c of digits('12345678')) { clock += 120; press(c, { target: inp }); }
  typeIn(inp, '12345678');
  clock += 120;
  press('Enter', { target: inp, key: 'Enter' });
  await sleep(50);
  ok('คนพิมพ์ตัวเลขเองแล้วกด Enter = ส่งตามปกติ (ไม่ถูกมองเป็นการยิง)', lastDc('send').content === '12345678');

  // ── 10. ดึงข้อความใหม่ทุก 10 วินาที · ช้าลงเมื่อแท็บถูกซ่อน · นับยังไม่ได้อ่าน ────────
  const lastId = dc.msgs[dc.msgs.length - 1].id;
  DC.msgs.push(dcMsg(dcU.korn, '10:50', 'มีลูกค้ารอที่หน้าร้านครับ'));
  showSection('home');
  while (dc.busy) await sleep(10);
  await dcPoll();
  ok('ดึงต่อด้วย after = รหัสข้อความล่าสุด', lastDc('list').after === lastId, JSON.stringify(lastDc('list')));
  ok('อยู่หมวดอื่น: ข้อความใหม่นับเป็นยังไม่ได้อ่าน 1 (เมนู + ไอคอนลัด)', dc.unread === 1 && Q('#navBadge-discord').textContent === '1' &&
    Q('#launcher .lt[data-key="discord"] .badge').textContent === '1');
  const delays = [];
  const realST = window.setTimeout;
  window.setTimeout = (f, ms) => { delays.push(ms); return realST(() => {}, 0); };
  dcSchedule();
  Object.defineProperty(document, 'hidden', { configurable: true, get: () => true });
  dcSchedule();
  delete document.hidden;
  dcSchedule(true);
  window.setTimeout = realST;
  ok('ตั้งเวลา: เปิดอยู่ 10 วิ · แท็บถูกซ่อน 60 วิ · ผิดพลาด 60 วิ', delays.join() === '10000,60000,60000', delays.join());
  dcSchedule();
  showSection('discord');
  await sleep(100);
  ok('กลับเข้าห้อง = อ่านแล้ว ข้อความใหม่ขึ้นท้ายห้อง', dc.unread === 0 && QA('#dcList .dc-msg').pop().textContent.indexOf('มีลูกค้ารอที่หน้าร้านครับ') !== -1);

  // ── 11. โหลดข้อความเก่าเมื่อเลื่อนขึ้น ──────────────────────────────────
  ok('ห้องสั้น (ไม่ถึง 50) = บอกว่าถึงต้นห้องแล้ว', Q('#dcOlder').textContent.indexOf('ต้นห้อง') !== -1, Q('#dcOlder').textContent);
  for (let i = 0; i < 55; i++) DC.msgs.push(dcMsg(i % 2 ? dcU.pim : dcU.mook, '11:' + String(i).padStart(2, '0'), 'ข้อความทดสอบ ' + i));
  dcStop();
  await dcStart();
  showSection('discord');
  await sleep(200);
  ok('ห้องยาว: เปิดมาได้ 50 ล่าสุด · มีปุ่ม/ทางโหลดข้อความเก่ากว่า', dc.msgs.length === 50 && dc.hasOlder && !!Q('#dcOlder button'), dc.msgs.length);
  const oldestBefore = dc.msgs[0].id;
  log.scrollTop = 0;
  log.dispatchEvent(new Event('scroll'));
  await sleep(150);
  ok('เลื่อนขึ้นบนสุด = โหลดข้อความเก่ากว่า (before = ข้อความเก่าสุดที่มี)', lastDc('list').before === oldestBefore && dc.msgs.length > 50 && dc.msgs[0].id === DC.msgs[0].id,
    JSON.stringify(lastDc('list')) + ' ' + dc.msgs.length);
  ok('โหลดแล้วข้อความที่อ่านอยู่ไม่กระโดด (ยังไม่อยู่บนสุด)', log.scrollTop > 0, log.scrollTop);

  // ── 12. ออกจากระบบ = หยุดดึง ─────────────────────────────────────────
  showSection('home');
  doLogout();
  await sleep(200);
  ok('ออกจากระบบ: หยุดตั้งเวลา · ล้างข้อความในหน่วยความจำ · ตัวเลขหาย', dc.timer === null && dc.state === 'idle' && dc.msgs.length === 0 && dc.unread === 0 &&
    !Q('#dcList .dc-msg'));
  const pollsAfter = DC.calls.length;
  await sleep(400);
  ok('หลังออกจากระบบไม่มีการเรียก discord อีก', DC.calls.length === pollsAfter);

  L('=== สรุป: ' + pass + ' PASS / ' + fail + ' FAIL ===');
  L(fail ? 'RESULT:FAIL' : 'RESULT:PASS');
}
</script>`;

// ยังไม่ได้ตั้งค่า (ไม่มีโทเคน) — หน้าวิธีตั้งค่า ไม่ใช่แถบแดง · ไม่ดึงซ้ำทุก 10 วินาที · เปิดคอนโซลครั้งแรก = ไม่ขึ้นยังไม่ได้อ่าน
const SETUP = `<script>
window.addEventListener('load', () => setTimeout(runTests, 300));
${HARNESS}
const sleep = ms => new Promise(r => setTimeout(r, ms));
const Q = s => document.querySelector(s);
async function runTests() {
  L('=== Discord: ยังไม่ได้ตั้งค่า / เปิดครั้งแรก ===');
  DC.mode = 'setup';
  document.getElementById('loginEmail').value = 'tibass@x';
  document.getElementById('loginPassword').value = 'x';
  await doLogin();
  await sleep(300);
  showSection('discord');
  await sleep(200);
  const box = Q('#dcSetup');
  ok('ยังไม่ได้ตั้งค่า = หน้าวิธีตั้งค่าภาษาไทย ชี้ไปคู่มือ STAFF-HOME.md ขั้นที่ 8', !box.hidden && Q('#dcMain').hidden && box.textContent.indexOf('docs/STAFF-HOME.md') !== -1 &&
    box.textContent.indexOf('ขั้นที่ 8') !== -1 && box.textContent.indexOf('DISCORD_BOT_TOKEN') !== -1 && box.textContent.indexOf('discord-index.ts') !== -1, box.textContent);
  ok('ไม่ใช่แถบแดง error', !document.getElementById('fatalError'));
  ok('ยังไม่ได้ตั้งค่า = ไม่ตั้งเวลาดึงซ้ำ', dc.timer === null && dc.state === 'setup');
  ok('ไม่มีตัวเลขยังไม่ได้อ่าน', Q('#navBadge-discord').hidden);
  DC.mode = 'ok';
  [...box.querySelectorAll('button')].find(b => b.textContent === 'ตรวจสอบอีกครั้ง').click();
  await sleep(200);
  ok('ตั้งค่าเสร็จแล้วกด "ตรวจสอบอีกครั้ง" = เข้าห้องได้เลย', box.hidden && !Q('#dcMain').hidden && document.querySelectorAll('#dcList .dc-msg').length === DC.msgs.length);
  ok('เปิดครั้งแรกบนเครื่องนี้ = ถือว่าอ่านถึงล่าสุดแล้ว (ไม่ขึ้น 8 ข้อความค้าง)', dc.unread === 0 &&
    localStorage.getItem('djlab.discord.seen.v1:u1') === DC.msgs[DC.msgs.length - 1].id);
  ok('ไม่มีเส้น "ข้อความใหม่" ตอนเปิดครั้งแรก', !document.querySelector('.dc-new'));
  ok('ตั้งค่าแล้ว = เริ่มตั้งเวลาดึงทุก 10 วินาที', dc.timer !== null && dc.state === 'live');
  // ติดต่อไม่ได้ชั่วคราว = แถบแดงในห้อง (ข้อความเดิมยังอยู่) ลองใหม่ช้าลง
  DC.mode = 'down';
  await dcPoll();
  ok('ติดต่อ Discord ไม่ได้ = แถบแดงในห้อง ข้อความเดิมยังอยู่ · บอกว่าลองใหม่ทุก 1 นาที', !!document.querySelector('#dcNote .alert[role=alert]') &&
    document.querySelectorAll('#dcList .dc-msg').length === DC.msgs.length && document.getElementById('dcState').textContent.indexOf('1 นาที') !== -1);
  DC.mode = 'ok';
  L('=== สรุป: ' + pass + ' PASS / ' + fail + ' FAIL ===');
  L(fail ? 'RESULT:FAIL' : 'RESULT:PASS');
}
</script>`;

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const flags = ['--host-resolver-rules=MAP * ~NOTFOUND', '--window-size=1440,900'];
  const a = runPage({ root, file: 'desk.html', mock: MOCK3 + DISCORD_MOCK, tests: TESTS, flags });
  const b = runPage({ root, file: 'desk.html', mock: MOCK3 + DISCORD_MOCK, tests: SETUP, flags });
  process.exit(a.ok && b.ok ? 0 : 1);
}
