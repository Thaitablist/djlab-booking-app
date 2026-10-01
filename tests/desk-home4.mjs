/**
 * เทสต์รอบ 4 ของ desk.html — แผง YouTube (ค้นหา · คิว · เล่นต่อเอง · จอด/ลอย · ลากย้าย) ·
 * สีอาจารย์บนปฏิทินหลัก · ไอคอนลัดแบบ A
 *   รัน: node tests/desk-home4.mjs
 *
 * ใช้ตัวปลอม Supabase ชุดเดียวกับ desk-home3 แล้วเติม: ฟังก์ชัน `yt` ปลอม · YouTube IFrame API ปลอม
 * (window.YT — หน้าเว็บไม่โหลดสคริปต์จริงถ้ามี YT อยู่แล้ว) · กิจกรรม Google ที่ลงชื่ออาจารย์
 * ตัดเน็ตทั้งหมด (host-resolver) ไม่มีอะไรไปโหลดของจริง
 */

import { dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { runPage, HARNESS } from './lib/page-test.mjs';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const { MOCK: MOCK3 } = await import(pathToFileURL(join(root, 'tests/desk-home3.mjs')).href);

const EXTRA = `<script>
// ── YouTube IFrame API ปลอม: แทน div ด้วย iframe (เหมือนของจริง) · จดทุกคำสั่ง · นับครั้งที่ iframe โหลด
window.YT_CALLS = [];
window.YT_PLAYERS = [];
window.YT = {
  PlayerState: { ENDED: 0, PLAYING: 1, PAUSED: 2 },
  Player: function (id, opts) {
    const el = document.getElementById(id);
    const f = document.createElement('iframe');
    f.id = id;
    f.dataset.loads = '0';
    f.addEventListener('load', () => { f.dataset.loads = String(Number(f.dataset.loads) + 1); });
    f.src = 'about:blank';
    el.replaceWith(f);
    this.opts = opts;
    this.video = opts.videoId;
    this.loadVideoById = v => { this.video = v; YT_CALLS.push(['load', v]); };
    this.loadPlaylist = o => YT_CALLS.push(['playlist', o.list]);
    this.destroy = () => { f.remove(); YT_CALLS.push(['destroy']); };
    this.getIframe = () => f;
    YT_PLAYERS.push(this);
    YT_CALLS.push(['create', opts.videoId]);
    setTimeout(() => opts.events.onReady && opts.events.onReady({ target: this }));
  },
};
const VIDS = ['AAAAAAAAAA1', 'AAAAAAAAAA2', 'AAAAAAAAAA3', 'AAAAAAAAAA4', 'AAAAAAAAAA5', 'AAAAAAAAAA6'];
window.YT_MODE = 'ok';
window.FN.yt = b => {
  if (window.YT_MODE === 'setup') return { error: { code: 'not_configured', message: 'ยังไม่ได้ตั้งค่าคีย์ YouTube' } };
  if (b.action === 'video') return { items: [{ id: b.id, title: 'ชื่อจริงจากลิงก์', channel: 'ช่องจริง', thumb: '', duration: '3:00' }] };
  return { items: VIDS.map((v, i) => ({ id: v, title: 'คลิปที่ ' + (i + 1) + ' ' + b.q, channel: 'ช่อง ' + (i + 1),
    thumb: 'https://i.ytimg.com/vi/' + v + '/mqdefault.jpg', duration: (i + 2) + ':00' })) };
};
// ── ปฏิทินหลักที่ลงชื่ออาจารย์ท้ายชื่อกิจกรรม (รูปแบบเดียวกับของจริง)
window.FN.gcal = () => ({ color: '#039BE5', teacher_colors: { Nutty: '#6A1B9A' }, events: [
  { uid: 'g1', title: '[ห้องใหญ่] BASIC SCRATCH/Kanid — Nutty', all_day: false, start: TODAY + 'T13:00', end: TODAY + 'T14:00', location: '', description: '' },
  { uid: 'g2', title: '[ห้องเล็ก1] Basic/ Win/ ห้องเล็ก - maniac', all_day: false, start: TODAY + 'T15:00', end: TODAY + 'T16:00', location: '', description: '' },
  { uid: 'g4', title: '[ห้องใหญ่] Advance Scratch Routine Workshop for Battle Prep/Kong — Alldayz', all_day: false, start: TODAY + 'T19:00', end: TODAY + 'T20:00', location: '', description: '' },
  { uid: 'g3', title: 'ประชุมตัวแทน', all_day: false, start: TODAY + 'T17:00', end: TODAY + 'T18:00', location: '', description: '' },
] });
FAKE.staff_home.push({ admin_id: 'u1', launcher: ['pos', 'mail', 'board', 'calendar'], apps: [], yt_state: {} });
FAKE.staff_settings[0].teacher_colors = { Nutty: '#6A1B9A' };   // ที่เจ้าของเคยบันทึกไว้ (029)
</script>`;

const TESTS = `<script>
window.addEventListener('load', () => setTimeout(runTests, 300));
${HARNESS}
const sleep = ms => new Promise(r => setTimeout(r, ms));
const txt = id => document.getElementById(id).textContent;
const vis = id => !document.getElementById(id).hidden;
const cs = el => getComputedStyle(el);
function rgb(hex) { return 'rgb(' + [1, 3, 5].map(i => parseInt(hex.slice(i, i + 2), 16)).join(', ') + ')'; }
function lumOf(c) { const v = c.match(/[0-9.]+/g).slice(0, 3).map(x => +x / 255).map(x => x <= 0.03928 ? x / 12.92 : Math.pow((x + 0.055) / 1.055, 2.4)); return 0.2126 * v[0] + 0.7152 * v[1] + 0.0722 * v[2]; }
function ratio(a, b) { const x = lumOf(a), y = lumOf(b); return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05); }
function key(el, k, mods) {
  clock += 5000;
  const ev = new KeyboardEvent('keydown', Object.assign({ key: k, code: k, bubbles: true, cancelable: true }, mods || {}));
  el.dispatchEvent(ev);
  return ev;
}
function ptr(el, type, x, y) { el.dispatchEvent(new PointerEvent(type, { pointerId: 7, button: 0, buttons: type === 'pointerup' ? 0 : 1, clientX: x, clientY: y, bubbles: true, cancelable: true, isPrimary: true })); }
const P = () => document.getElementById('player');
const pos = () => ({ x: parseInt(P().style.left, 10), y: parseInt(P().style.top, 10) });

async function runTests() {
  L('=== รอบ 4: YouTube · สีอาจารย์ · ไอคอนแบบ A ===');
  localStorage.removeItem('djlab.desk.accounts.v1');
  localStorage.removeItem('djlab.desk.miniPos.v1');
  document.getElementById('loginEmail').value = 'tibass@x';
  document.getElementById('loginPassword').value = 'x';
  await doLogin();
  await sleep(500);

  // ── 1. แยกชื่ออาจารย์ ────────────────────────────────────────────────
  const pt = parseGcalTitle('[ห้องใหญ่] BASIC SCRATCH/Kanid — Nutty');
  ok('แยก [ห้อง] ชื่อคลาส — อาจารย์ (ขีดยาว)', pt.room === 'ห้องใหญ่' && pt.title === 'BASIC SCRATCH/Kanid' && pt.teacher === 'Nutty', JSON.stringify(pt));
  const p2 = parseGcalTitle('[ห้องเล็ก1] Basic/ Win/ ห้องเล็ก - tibass');
  ok('ขีดสั้น + ตัวพิมพ์เล็ก → TiBass', p2.teacher === 'TiBass' && p2.title === 'Basic/ Win/ ห้องเล็ก' && p2.room === 'ห้องเล็ก1', JSON.stringify(p2));
  ok('ขีดกลาง (–) + ตัวพิมพ์ใหญ่ → Alldayz', parseGcalTitle('Open Format – ALLDAYZ').teacher === 'Alldayz');
  const p3 = parseGcalTitle('A — B — Leonie');
  ok('มีขีดหลายตัว ใช้ตัวสุดท้าย', p3.teacher === 'Leonie' && p3.title === 'A — B', JSON.stringify(p3));
  ok('ขีดในคำ (DJM-S11) ไม่นับเป็นตัวคั่น', parseGcalTitle('DJM-S11 demo').teacher === null && parseGcalTitle('DJM-S11 demo').title === 'DJM-S11 demo');
  const p4 = parseGcalTitle('Workshop — Guest');
  ok('ชื่อท้ายที่ไม่ใช่ครูในทีม = ไม่แยก ชื่อเดิมครบ', p4.teacher === null && p4.title === 'Workshop — Guest', JSON.stringify(p4));
  ok('ไม่มีอาจารย์ = null', parseGcalTitle('ประชุมตัวแทน').teacher === null);

  // ── 2. ปฏิทิน: ป้ายขึ้นต้นด้วยเวลา · สีตามอาจารย์ ──────────────────────────
  showSection('calendar');
  await sleep(300);
  const g = [...document.querySelectorAll('#calGrid .ev[data-kind="google"]')];
  const byT = t => g.find(b => b.textContent.indexOf(t) !== -1);
  ok('ป้ายปฏิทินหลักขึ้นต้นด้วยเวลา ไม่มีคำว่า Google', g.length === 4 && g.every(b => /^\\d\\d:\\d\\d/.test(b.textContent) && b.textContent.indexOf('Google') === -1),
    g.map(b => b.textContent).join(' | '));
  ok('ป้ายมีชื่อคลาสและชื่ออาจารย์เป็นตัวหนังสือ: "13:00 BASIC SCRATCH/Kanid · Nutty"', !!byT('Nutty') && byT('Nutty').textContent === '13:00BASIC SCRATCH/Kanid · Nutty',
    byT('Nutty') && byT('Nutty').textContent);
  const lw = byT('Alldayz'), who = lw && lw.querySelector('.ev-who'), tt = lw && lw.querySelector('.ev-t');
  ok('ชื่อคลาสยาวจนถูกตัด: ชื่ออาจารย์ยังเห็นครบเป็นตัวหนังสือ (ตัดเฉพาะชื่อคลาส)', !!who && who.textContent === ' · Alldayz' &&
    tt.scrollWidth > tt.clientWidth && who.getBoundingClientRect().right <= lw.getBoundingClientRect().right + 0.5 && who.scrollWidth <= who.clientWidth + 1,
    lw && JSON.stringify([tt.scrollWidth, tt.clientWidth, who.getBoundingClientRect().right, lw.getBoundingClientRect().right]));
  ok('ห้องอยู่ในคำอธิบายเมื่อเอาเมาส์ชี้ (รายเดือน)', byT('Nutty').title.indexOf('[ห้องใหญ่]') !== -1, byT('Nutty').title);
  ok('สีของ Nutty มาจากที่เจ้าของตั้ง (gcal ส่ง teacher_colors)', cs(byT('Nutty')).backgroundColor === rgb('#6A1B9A'), cs(byT('Nutty')).backgroundColor);
  ok('Maniac ใช้สีตั้งต้นของตัวเอง (#C0CA33) ตัวอักษรดำ', cs(byT('Maniac')).backgroundColor === rgb('#C0CA33') && cs(byT('Maniac')).color === 'rgb(15, 15, 15)');
  ok('ไม่มีอาจารย์ = สีของชั้นปฏิทินหลัก', cs(byT('ประชุมตัวแทน')).backgroundColor === rgb('#039BE5'));
  ok('ตัวอักษรในป้ายทุกอันคอนทราสต์ ≥ 4.5:1', g.every(b => ratio(cs(b).color, cs(b).backgroundColor) >= 4.5));
  const legend = [...document.querySelectorAll('#calLegend .chip')].map(c => c.textContent);
  ok('คำอธิบายสีมีอาจารย์ครบ 6 คน', ['Zlex', 'Leonie', 'Nutty', 'TiBass', 'Maniac', 'Alldayz'].every(t => legend.includes(t)) && !legend.some(t => /Google/.test(t)), legend.join(','));
  setCalView('week');
  await sleep(200);
  const wk = [...document.querySelectorAll('#calGrid .ev[data-kind="google"]')].find(b => b.textContent.indexOf('Nutty') !== -1);
  ok('รายสัปดาห์: ขึ้นต้นด้วยเวลา มีห้องในป้าย สีเดียวกัน', !!wk && wk.textContent.indexOf('13:00') === 0 && wk.textContent.indexOf('[ห้องใหญ่]') !== -1 &&
    cs(wk).backgroundColor === rgb('#6A1B9A'), wk && wk.textContent);
  setCalView('month');

  // ── 3. หน้าแรก "วันนี้" ────────────────────────────────────────────────
  showSection('home');
  await sleep(200);
  const hc = [...document.querySelectorAll('#tileCal .chip')];
  ok('วันนี้บนหน้าแรก: ป้ายเป็นชื่ออาจารย์ในสีของอาจารย์ ไม่มี "Google"', hc.some(c => c.textContent === 'Nutty' && cs(c).backgroundColor === rgb('#6A1B9A')) &&
    txt('tileCal').indexOf('Google') === -1 && txt('tileCal').indexOf('BASIC SCRATCH/Kanid · ห้องใหญ่') !== -1, txt('tileCal'));

  // ── 4. เจ้าของตั้งสีอาจารย์ ────────────────────────────────────────────
  await openGcalSettings();
  const tIn = [...document.querySelectorAll('#gsTeachers input[type=color]')];
  ok('หน้าตั้งค่ามีช่องสีของอาจารย์ 6 คน (ค่าปัจจุบันของ Nutty = ที่ตั้งไว้)', tIn.length === 6 &&
    tIn.find(i => i.dataset.t === 'Nutty').value === '#6a1b9a');
  const nut = tIn.find(i => i.dataset.t === 'Nutty');
  nut.value = '#2e7d32'; nut.dispatchEvent(new Event('input'));
  CALLS.length = 0;
  await saveGcalSettings();
  const up = CALLS.find(c => c.op === 'update' && c.table === 'staff_settings');
  ok('บันทึกสีอาจารย์ลง teacher_colors (029)', !!up && up.payload.teacher_colors.Nutty === '#2E7D32' && up.payload.teacher_colors.Zlex === '#C2185B',
    JSON.stringify(up && up.payload.teacher_colors));

  // ── 5. ไอคอนลัดแบบ A ──────────────────────────────────────────────────
  await loadHomePrefs();
  const icon = k => document.querySelector('#launcher .lt[data-key="' + k + '"] .lt-icon');
  const pi = icon('pos');
  ok('ไอคอนแบบแอป: 84×84 มุมโค้ง 20px สีของขายหน้าร้าน #CC001A', !!pi && pi.getBoundingClientRect().width === 84 && pi.getBoundingClientRect().height === 84 &&
    cs(pi).borderTopLeftRadius === '20px' && cs(pi).backgroundColor === rgb('#CC001A'), pi && cs(pi).borderTopLeftRadius);
  ok('เส้นไอคอนหนา 2.4 ปลายมน', cs(pi.querySelector('svg')).strokeWidth === '2.4px' && cs(pi.querySelector('svg')).strokeLinecap === 'round');
  ok('ชื่อใต้ไอคอน', document.querySelector('#launcher .lt[data-key="pos"] .lt-label').textContent === 'ขายหน้าร้าน');
  ok('กระดาน (เหลือง) ได้เส้นไอคอนสีดำ · ที่อื่นขาว', cs(icon('board')).color === 'rgb(15, 15, 15)' && cs(icon('mail')).color === 'rgb(255, 255, 255)');
  ok('เส้นไอคอนกับพื้นคอนทราสต์ ≥ 3:1 ทุกอัน', ['pos', 'mail', 'board', 'calendar'].every(k => ratio(cs(icon(k)).color, cs(icon(k)).backgroundColor) >= 3));
  const bd = icon('mail').querySelector('.badge');
  ok('ป้ายตัวเลขกลมแดง ขอบขาว 2px ที่มุมขวาบนของไอคอน', !!bd && bd.textContent === '3' && parseFloat(cs(bd).borderTopLeftRadius) >= 14 &&
    cs(bd).borderTopWidth === '2px' && cs(bd).borderTopColor === 'rgb(255, 255, 255)' &&
    bd.getBoundingClientRect().right > icon('mail').getBoundingClientRect().right, bd && cs(bd).borderTopLeftRadius);
  toggleLaunchEdit();
  ok('โหมดแก้ไข: ตัวอย่างเป็นไอคอนแบบเดียวกัน', document.querySelectorAll('#launcher .lt-edit .lt-icon.sm').length === 4);
  toggleLaunchEdit();

  // ── 6. YouTube: ยังไม่ตั้งค่า → วางลิงก์ยังเล่นได้ ─────────────────────────
  ok('หน้าแรกมีแผง YouTube ใต้กล่องวันนี้ (คอลัมน์ซ้าย)', document.getElementById('tileCal').closest('.home-grid > div').contains(document.getElementById('ytPanel')));
  ok('แผง YouTube มีคำแนะนำเรื่อง YouTube Premium', txt('ytPanel').indexOf('ถ้ามี YouTube Premium') !== -1);
  YT_MODE = 'setup';
  document.getElementById('ytQuery').value = 'scratch';
  await ytSubmit();
  ok('ยังไม่มีคีย์ → ขึ้นวิธีตั้งค่า (ไม่ใช่แถบแดง)', txt('ytNote').indexOf('ยังไม่ได้ตั้งค่าการค้นหา YouTube') !== -1 && !document.querySelector('#ytNote .alert-red'), txt('ytNote'));
  document.getElementById('ytQuery').value = 'https://youtu.be/jNQXAC9IVRw';
  await ytSubmit();
  await sleep(200);
  ok('วางลิงก์: สร้างตัวเล่นด้วยวิดีโอนั้น จาก youtube.com (ไม่ใช่ nocookie — ร้านใช้ Premium)', YT_PLAYERS.length === 1 && YT_PLAYERS[0].opts.videoId === 'jNQXAC9IVRw' &&
    YT_PLAYERS[0].opts.host === 'https://www.youtube.com', JSON.stringify(YT_PLAYERS[0] && YT_PLAYERS[0].opts.host));
  ok('ขอชื่อจริงของวิดีโอจากลิงก์ไม่ได้ (ยังไม่ตั้งค่า) ก็ยังเล่น', txt('ytNowTitle').indexOf('วิดีโอจากลิงก์') !== -1, txt('ytNowTitle'));

  // ── 7. ค้นหา · กดเล่น · ถัดไป · เล่นต่อเอง ──────────────────────────────
  YT_MODE = 'ok';
  document.getElementById('ytQuery').value = 'turntablism';
  CALLS.length = 0;
  await ytSubmit();
  const ytCall = CALLS.find(c => c.op === 'fn' && c.name === 'yt');
  ok('ค้นหาผ่านฟังก์ชัน yt (ไม่มีคีย์ API ในหน้าเว็บ)', !!ytCall && ytCall.body.action === 'search' && ytCall.body.q === 'turntablism');
  ok('ผลค้นหาเป็นภาพย่อ 6 อัน พร้อมความยาว', document.querySelectorAll('#ytResults .yt-card').length === 6 &&
    document.querySelector('#ytResults .yt-card .dur').textContent === '2:00');
  document.querySelectorAll('#ytResults .yt-card .pick')[1].click();
  await sleep(100);
  ok('กดผลที่ 2 → เล่นคลิปนั้นในตัวเล่นเดิม (ไม่สร้างใหม่)', YT_PLAYERS.length === 1 && YT_CALLS.slice(-1)[0].join() === 'load,AAAAAAAAAA2', YT_CALLS.slice(-1)[0]);
  const nextIds = () => [...document.querySelectorAll('#ytNext .yt-card .t')].map(t => t.textContent.slice(0, 9));
  ok('แถว "ถัดไป" = ผลค้นหาที่เหลือ 4 อัน (3–6)', nextIds().join('|') === 'คลิปที่ 3|คลิปที่ 4|คลิปที่ 5|คลิปที่ 6', nextIds().join('|'));
  ok('บอกชัดว่า "ถัดไป" มาจากไหน (ไม่มีวิดีโอที่เกี่ยวข้อง)', txt('ytPanel').indexOf('ผลค้นหาที่เหลือ') !== -1 && txt('ytPanel').indexOf('ไม่มี “วิดีโอที่เกี่ยวข้อง”') !== -1);
  YT_PLAYERS[0].opts.events.onStateChange({ data: YT.PlayerState.ENDED });
  await sleep(100);
  ok('วิดีโอจบ → เล่นอันถัดไปเอง (คลิปที่ 3)', YT_CALLS.slice(-1)[0].join() === 'load,AAAAAAAAAA3' && nextIds()[0] === 'คลิปที่ 4', YT_CALLS.slice(-1)[0]);
  document.querySelectorAll('#ytResults .yt-card .q')[0].click();
  await sleep(50);
  ok('+ คิว ต่อท้ายคิว ไม่ตัดวิดีโอที่เล่นอยู่', ytState.queue[ytState.queue.length - 1].id === 'AAAAAAAAAA1' && YT_CALLS.slice(-1)[0].join() === 'load,AAAAAAAAAA3');
  document.querySelectorAll('#ytNext .yt-card .pick')[1].click();
  await sleep(50);
  ok('กดในแถวถัดไป = ข้ามไปเล่นอันนั้น', YT_CALLS.slice(-1)[0].join() === 'load,AAAAAAAAAA5', YT_CALLS.slice(-1)[0]);
  await sleep(1700);
  const ys = CALLS.filter(c => c.op === 'upsert' && c.table === 'staff_home').pop();
  ok('คำค้นและคิวเก็บลง staff_home.yt_state (เฉพาะคอลัมน์นี้)', !!ys && ys.payload.yt_state.q === 'turntablism' && ys.payload.yt_state.queue[0].id === 'AAAAAAAAAA5' &&
    !('launcher' in ys.payload) && !('apps' in ys.payload), JSON.stringify(ys && ys.payload.yt_state).slice(0, 120));

  // ── 8. ตัวเล่นเดียว: จอดบนหน้าแรก · ลอยในหมวดอื่น · ไม่ย้าย ไม่โหลดใหม่ ─────────
  const frame = document.getElementById('ytTarget');
  const loads0 = frame.dataset.loads;
  const near = (a, b) => Math.abs(a - b) <= 1;
  let dr = document.getElementById('ytDock').getBoundingClientRect(), pr = P().getBoundingClientRect();
  ok('บนหน้าแรก: ตัวเล่นจอดทับช่องในแผงพอดี', P().classList.contains('docked') && near(dr.left, pr.left) && near(dr.top, pr.top) && near(dr.width, pr.width) && near(dr.height, pr.height),
    JSON.stringify([dr.left, dr.top, dr.width, pr.left, pr.top, pr.width]));
  showSection('products');
  ok('ไปหมวดสินค้า: ย่อเป็นหน้าต่างลอย ยังเห็นอยู่', vis('player') && !P().classList.contains('docked') && P().getBoundingClientRect().width === 400);
  ok('iframe ตัวเดิม อยู่ที่เดิมใน DOM ไม่โหลดใหม่', document.getElementById('ytTarget') === frame && frame.parentElement.id === 'playerBody' &&
    P().parentElement === document.body && frame.dataset.loads === loads0, frame.dataset.loads + ' vs ' + loads0);
  showSection('home');
  await sleep(50);
  dr = document.getElementById('ytDock').getBoundingClientRect(); pr = P().getBoundingClientRect();
  ok('กลับหน้าแรก: จอดกลับที่เดิม iframe ตัวเดิม ไม่โหลดใหม่', P().classList.contains('docked') && near(dr.top, pr.top) &&
    document.getElementById('ytTarget') === frame && frame.dataset.loads === loads0);

  // ── 9. ลากย้ายหน้าต่างลอย ──────────────────────────────────────────────
  showSection('pos');
  const scan = document.getElementById('posSearch');
  scan.focus();
  const bar = document.getElementById('playerBar');
  let r0 = P().getBoundingClientRect();
  ptr(bar, 'pointerdown', r0.left + 30, r0.top + 10);
  ok('ระหว่างลาก: มีแผ่นใสทับ iframe', vis('playerShield'));
  ptr(bar, 'pointermove', 200, 150);
  ptr(bar, 'pointerup', 200, 150);
  ok('ลากแล้วหน้าต่างย้ายตามเมาส์', pos().x === 170 && pos().y === 140, JSON.stringify(pos()));
  ok('ปล่อยแล้วแผ่นใสหาย · โฟกัสยังอยู่ที่ช่องยิงบาร์โค้ด', !vis('playerShield') && document.activeElement === scan, document.activeElement.id);
  ok('ลากแล้ว iframe ตัวเดิม ไม่โหลดใหม่', document.getElementById('ytTarget') === frame && frame.dataset.loads === loads0);
  r0 = P().getBoundingClientRect();
  ptr(bar, 'pointerdown', r0.left + 10, r0.top + 10);
  ptr(bar, 'pointermove', -900, -900);
  ptr(bar, 'pointerup', -900, -900);
  ok('ลากเลยขอบซ้ายบน → ติดขอบจอพอดี', pos().x === 0 && pos().y === 0, JSON.stringify(pos()));
  r0 = P().getBoundingClientRect();
  ptr(bar, 'pointerdown', r0.left + 10, r0.top + 10);
  ptr(bar, 'pointermove', 99999, 99999);
  ptr(bar, 'pointerup', 99999, 99999);
  // มุมขวาล่างจองไว้ให้ปุ่มเครื่องคิดเลข (รอบ 5) — ลากชนมุมนั้นแล้วหน้าต่างหยุดเหนือปุ่ม ไม่ใช่ติดขอบจอล่าง
  const cb = document.getElementById('calcBtn').getBoundingClientRect();
  ok('ลากเลยขอบขวาล่าง → ทั้งหน้าต่างยังอยู่ในจอ และหยุดเหนือปุ่มเครื่องคิดเลข (ไม่ทับ)', pos().x === innerWidth - P().offsetWidth &&
    pos().y === Math.round(cb.top - 12 - P().offsetHeight) && P().getBoundingClientRect().bottom <= cb.top,
    JSON.stringify([pos(), innerWidth, innerHeight, cb.top]));
  r0 = P().getBoundingClientRect();
  ptr(bar, 'pointerdown', r0.left + 10, r0.top + 10);
  ptr(bar, 'pointermove', 50, 100);
  ptr(bar, 'pointerup', 50, 100);
  const saved = JSON.parse(localStorage.getItem('djlab.desk.miniPos.v1'));
  ok('ตำแหน่งจำไว้ในเครื่อง', saved.x === pos().x && saved.y === pos().y, JSON.stringify(saved));
  showSection('bills');
  ok('เปลี่ยนหมวดแล้วยังอยู่ตำแหน่งเดิม', pos().x === saved.x && pos().y === saved.y);

  // ── 10. คีย์บอร์ด ─────────────────────────────────────────────────────
  showSection('booking');
  bar.focus();
  const before = pos(), day = bkDate;
  key(bar, 'ArrowRight');
  ok('→ ที่แถบหน้าต่าง = ย้ายขวา 20px', pos().x === before.x + 20 && pos().y === before.y, JSON.stringify(pos()));
  key(bar, 'ArrowDown');
  ok('↓ = ย้ายลง 20px', pos().y === before.y + 20);
  key(bar, 'ArrowLeft');
  ok('← ที่แถบหน้าต่างไม่ไปเลื่อนวันของหมวดจองห้อง', bkDate === day && pos().x === before.x, bkDate + ' ' + day);
  const altEv = key(bar, 'ArrowLeft', { altKey: true });
  await sleep(150);
  ok('Alt+← ยังเป็นย้อนกลับหมวดตามเดิม (ไม่ถูกแถบหน้าต่างกิน)', current === 'bills' && pos().x === before.x, current);
  key(bar, 'Home');
  const cb2 = document.getElementById('calcBtn').getBoundingClientRect();
  ok('Home = กลับมุมขวาล่าง (เหนือปุ่มเครื่องคิดเลข)', pos().x === innerWidth - P().offsetWidth - 20 && pos().y === Math.round(cb2.top - 12 - P().offsetHeight), JSON.stringify(pos()));
  ok('หน้าคีย์ลัด (?) บอกวิธีย้ายหน้าต่างวิดีโอ', txt('helpDialog').indexOf('ย้ายหน้าต่างวิดีโอ') !== -1);

  // ── 11. โฟกัสในกรอบวิดีโอ → เตือนเรื่องเครื่องยิง ─────────────────────────
  frame.focus();
  checkFrameFocus();
  ok('โฟกัสอยู่ในกรอบ YouTube → ขึ้นแถบเตือนเครื่องยิงบาร์โค้ด', vis('frameHint'));
  showSection('home');
  document.querySelector('#launcher .lt[data-key="pos"]').click();
  ok('กดไอคอนขายหน้าร้าน → โฟกัสกลับช่องยิง แถบเตือนหาย', document.activeElement.id === 'posSearch' && !vis('frameHint'));

  // ── 12. ของเล็ก ───────────────────────────────────────────────────────
  ok('ส่วน "สำหรับพิมพ์" ถูกซ่อนบนจอ (เคยโผล่เพราะวงเล็บเกินใน CSS)', cs(document.querySelector('.print-only')).display === 'none');
  closePlayer();
  ok('ปิดวิดีโอแล้วตัวเล่นหาย', !vis('player') && !document.getElementById('ytTarget') && YT_CALLS.slice(-1)[0][0] === 'destroy');

  L('=== สรุป: ' + pass + ' PASS / ' + fail + ' FAIL ===');
  L(fail ? 'RESULT:FAIL' : 'RESULT:PASS');
}
</script>`;

// เปิดหน้าใหม่ที่มีตำแหน่งหน้าต่างลอยจำไว้แล้ว (เหมือนรีโหลด) — ต้องขึ้นที่เดิม
const RELOAD = `<script>
window.addEventListener('load', () => setTimeout(runTests, 300));
${HARNESS}
const sleep = ms => new Promise(r => setTimeout(r, ms));
async function runTests() {
  L('=== เปิดหน้าใหม่: ตำแหน่งหน้าต่างลอยที่จำไว้ ===');
  document.getElementById('loginEmail').value = 'tibass@x';
  document.getElementById('loginPassword').value = 'x';
  await doLogin();
  await sleep(400);
  showSection('products');
  await ytPlayUrl('https://youtu.be/jNQXAC9IVRw', 'ทดสอบ');
  await sleep(100);
  const p = document.getElementById('player');
  ok('หน้าต่างลอยขึ้นที่ตำแหน่งที่จำไว้ก่อนรีโหลด (60, 110)', p.style.left === '60px' && p.style.top === '110px', p.style.left + ',' + p.style.top);
  L('=== สรุป: ' + pass + ' PASS / ' + fail + ' FAIL ===');
  L(fail ? 'RESULT:FAIL' : 'RESULT:PASS');
}
</script>`;

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const flags = ['--host-resolver-rules=MAP * ~NOTFOUND', '--window-size=1440,900'];
  const res = runPage({ root, file: 'desk.html', mock: MOCK3 + EXTRA, tests: TESTS, flags });
  const re = runPage({ root, file: 'desk.html', flags, tests: RELOAD,
    mock: MOCK3 + EXTRA + `<script>localStorage.setItem('djlab.desk.miniPos.v1', JSON.stringify({ x: 60, y: 110 }));</script>` });
  process.exit(res.ok && re.ok ? 0 : 1);
}
