---
name: DJ LAB SIAM Console
description: The shop's own back-office, a square-cornered light console for counter work and phone walk-arounds.
colors:
  red: "#CC001A"
  red-hover: "#A80016"
  red-soft: "#FBE9EC"
  red-rule: "#F0B8C1"
  red-ink: "#8A0012"
  black: "#0F0F0F"
  black-hover: "#2A2A2A"
  bg: "#F5F4F0"
  surface: "#FFFFFF"
  surface2: "#FAF9F6"
  sel: "#F0EEE7"
  line: "#E3E1DA"
  line-strong: "#CFCCC3"
  text: "#0F0F0F"
  text2: "#5B5953"
  text3: "#6E6B64"
  ash: "#807D75"
  head: "#E3DFD5"
  on-black-muted: "#9A978F"
  on-black-soft: "#CFCCC3"
  on-black-line: "#3A3A38"
  nav-hover: "#1C1C1C"
  nav-active: "#1F1F1F"
  open-dot: "#3DDC84"
  red-divider: "#F3CDD4"
  ok: "#1F6B3A"
  ok-soft: "#E8F2EB"
  ok-rule: "#BFD9C7"
  warn: "#8A5A00"
  warn-soft: "#FBF1DC"
  warn-rule: "#E8D1A0"
  cal-class: "#0B8043"
  cal-event: "#F4511E"
  cal-staff: "#3F51B5"
  cal-other: "#616161"
  cal-bookings: "#8E24AA"
  cal-google-default: "#039BE5"
  launcher-receive: "#00897B"
  launcher-register: "#7986CB"
  launcher-payqr: "#33B679"
  launcher-discord: "#455A64"
  launcher-board: "#F6BF26"
  launcher-mail-label: "#5C6BC0"
  launcher-starred: "#F9A825"
  launcher-spotify: "#1DB954"
typography:
  display:
    fontFamily: "Prompt, Noto Sans Thai, sans-serif"
    fontSize: "136px"
    fontWeight: 600
    lineHeight: 0.9
    letterSpacing: "-0.02em"
    fontFeature: "tnum"
  numeral-hero:
    fontFamily: "Prompt, Noto Sans Thai, sans-serif"
    fontSize: "80px"
    fontWeight: 700
    lineHeight: 0.82
    letterSpacing: "-0.02em"
    fontFeature: "tnum"
  numeral-wall:
    fontFamily: "Prompt, Noto Sans Thai, sans-serif"
    fontSize: "34px"
    fontWeight: 700
    lineHeight: 1
    fontFeature: "tnum"
  headline:
    fontFamily: "Prompt, Noto Sans Thai, sans-serif"
    fontSize: "24px"
    fontWeight: 600
    lineHeight: 1.25
  title:
    fontFamily: "Prompt, Noto Sans Thai, sans-serif"
    fontSize: "19px"
    fontWeight: 700
    lineHeight: 1.3
  title-sm:
    fontFamily: "Prompt, Noto Sans Thai, sans-serif"
    fontSize: "16px"
    fontWeight: 600
    lineHeight: 1.3
  body:
    fontFamily: "Noto Sans Thai, Segoe UI, sans-serif"
    fontSize: "15px"
    fontWeight: 400
    lineHeight: 1.5
  label:
    fontFamily: "Noto Sans Thai, Segoe UI, sans-serif"
    fontSize: "14px"
    fontWeight: 600
    lineHeight: 1.5
rounded:
  none: "0px"
  launcher: "20px"
  launcher-sm: "13px"
  launcher-badge: "14px"
spacing:
  xs: "4px"
  sm: "8px"
  md: "12px"
  lg: "16px"
  xl: "20px"
  workspace-y: "24px"
  workspace-x: "28px"
components:
  panel-head:
    backgroundColor: "{colors.head}"
    textColor: "{colors.text}"
    typography: "{typography.title-sm}"
    rounded: "{rounded.none}"
    padding: "14px 18px"
  topbar:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.text}"
    rounded: "{rounded.none}"
    padding: "14px 28px"
  calc-button:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.black}"
    rounded: "{rounded.none}"
    width: "44px"
    height: "44px"
  calc-key:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.text}"
    rounded: "{rounded.none}"
    height: "48px"
  calc-key-equals:
    backgroundColor: "{colors.black}"
    textColor: "{colors.surface}"
    rounded: "{rounded.none}"
    height: "48px"
  pay-stage:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.text}"
    rounded: "{rounded.none}"
    padding: "16px"
  button:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.black}"
    rounded: "{rounded.none}"
    padding: "8px 18px"
    height: "40px"
  button-hover:
    backgroundColor: "{colors.sel}"
  button-primary:
    backgroundColor: "{colors.black}"
    textColor: "{colors.surface}"
    rounded: "{rounded.none}"
    padding: "8px 18px"
    height: "40px"
  button-primary-hover:
    backgroundColor: "{colors.black-hover}"
  button-accent:
    backgroundColor: "{colors.red}"
    textColor: "{colors.surface}"
    rounded: "{rounded.none}"
    padding: "8px 18px"
    height: "40px"
  button-accent-hover:
    backgroundColor: "{colors.red-hover}"
  button-danger:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.red}"
    rounded: "{rounded.none}"
    padding: "8px 18px"
  button-phone:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.black}"
    typography: "{typography.title-sm}"
    rounded: "{rounded.none}"
    padding: "10px 16px"
    height: "48px"
  input:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.text}"
    typography: "{typography.body}"
    rounded: "{rounded.none}"
    padding: "8px 12px"
    height: "40px"
  scan-field:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.text}"
    rounded: "{rounded.none}"
    padding: "0 14px 0 16px"
    height: "54px"
  filter-chip:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.text}"
    typography: "{typography.label}"
    rounded: "{rounded.none}"
    padding: "5px 11px"
  filter-chip-on:
    backgroundColor: "{colors.black}"
    textColor: "{colors.surface}"
  flag-low-on:
    backgroundColor: "{colors.red}"
    textColor: "{colors.surface}"
    rounded: "{rounded.none}"
    padding: "5px 12px"
  flag-out-on:
    backgroundColor: "{colors.black}"
    textColor: "{colors.surface}"
    rounded: "{rounded.none}"
    padding: "5px 12px"
  wall-row:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.text}"
    rounded: "{rounded.none}"
    padding: "8px 14px"
  wall-row-selected:
    backgroundColor: "{colors.sel}"
  photo-tile:
    backgroundColor: "{colors.surface}"
    rounded: "{rounded.none}"
    padding: "4px"
    width: "76px"
    height: "57px"
  tag-low:
    backgroundColor: "{colors.red}"
    textColor: "{colors.surface}"
    typography: "{typography.label}"
    rounded: "{rounded.none}"
    padding: "0 7px"
  tag-out:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.black}"
    typography: "{typography.label}"
    rounded: "{rounded.none}"
    padding: "0 7px"
  serial-chip:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.text}"
    typography: "{typography.label}"
    rounded: "{rounded.none}"
    padding: "3px 8px"
  launcher-tile:
    rounded: "{rounded.launcher}"
    width: "84px"
    height: "84px"
  status-pill-ok:
    backgroundColor: "{colors.ok-soft}"
    textColor: "{colors.ok}"
    typography: "{typography.label}"
    rounded: "{rounded.none}"
    padding: "2px 8px"
  status-pill-warn:
    backgroundColor: "{colors.warn-soft}"
    textColor: "{colors.warn}"
    typography: "{typography.label}"
    rounded: "{rounded.none}"
    padding: "2px 8px"
---

# Design System: DJ LAB SIAM Console

## Overview

**Creative North Star: "The Shop's Own Counter"**

This is the working surface of a DJ equipment shop, not a showroom for it. Everything sits on a warm paper ground (`bg`) under near-black type, in square boxes with hairline rules, the way a counter ledger or a gear rack sits: plain, dense, and fast to scan. Black does the structural work: the sidebar, the phone header and bottom nav, the selected state of every control, and the heavy rules that head a group. Panel and table headers sit on a darker paper (`head`) over a 2px black rule, so the head of every working area reads before its rows. The brand red appears only where something must be seen first.

Two devices share one world. `desk.html` is a keyboard-first counter console (≥1280px, USB scanner, hash-routed sections in one file) that also runs on an iPad in both orientations (finger first, the iPad camera or a Bluetooth scanner, a keyboard sometimes attached) and, since 2 Oct 2026, on an iPhone (one hand, both orientations); `stock.html` and the other phone pages are portrait, one-hand, camera-scan pages capped at 480px. They use the same tokens, the same two typefaces, and the same square geometry. Only the touch-target sizes and the iPad breakpoints change.

The stock wall (desk `#stock` plus the stock.html product page) is the system's signature expression: every model is a photo tile plus one big Prompt numeral, shelved in wings under a 3px black rule, and status is always a red or black inset edge **plus** a word.

**Key Characteristics:**
- Light, warm-paper ground; white working surfaces; near-black structure.
- Square corners everywhere, with one owner-approved exception (app-icon launcher tiles).
- Prompt for headings and numerals; Noto Sans Thai for reading text. Nothing under 14px.
- Red is reserved for "see this first", never decoration and never a category colour.
- Status is never colour alone: every state carries a word, a pattern or an edge.
- Selected = black fill, white text, on every control family.

## Colors

A near-monochrome warm-neutral console with one brand red, plus a separate, data-driven calendar palette that lives only inside calendar chips and launcher tiles.

### Primary
- **Signal Red** (`red`): the brand red, used only where attention must land first: the active nav edge, unread-message box and count badges (rows inside the unread box are divided by `red-divider`), today/now markers on the calendar and timeline, the low-stock edge, tag and flag on the stock wall, the accent button and the login box top rule. (Toasts and alerts no longer carry a coloured side stripe; alerts use a 1px frame in their own tint.) Hover deepens to `red-hover`. `red-soft` is its tinted alert/badge ground, `red-rule` its soft border, and `red-ink` is the deep red used for text on `red-soft` (8.6:1).

### Neutral
- **Counter Black** (`black`, also `text`): primary text, sidebar and phone chrome, primary buttons, the selected state of chips, segments and flags, the 3px group rules, the out-of-stock edge and focus outlines. Hover is `black-hover`.
- **Shop Paper** (`bg`): the page ground behind all surfaces.
- **White Surface** (`surface`): cards, panels, wings, drawers, inputs, and every product photo tile.
- **Raised Paper** (`surface2`): read-only fields, shelf sub-headers, kbd keys, calculator operator keys and hover on rows.
- **Header Paper** (`head`, #E3DFD5): the ground of every panel head, table `thead`, stock-wall wing head, tray head, drawer head, calendar weekday row and the calculator head, always over a 2px black bottom rule (wing heads keep their 3px group rule). Text on it is `text` (14.4:1) or `text2` (5.3:1); `text3` and `red` text are not used on it (4.0:1 and 4.4:1).
- **Selection Linen** (`sel`): hover on buttons and selected rows (with a black inset edge or a 2px black frame).
- **Hairline** (`line`) and **Strong Hairline** (`line-strong`): dividers between rows, and borders on inputs, chips and secondary containers.
- **Graphite** (`text2`): secondary text, labels, hints and meta lines (7.0:1 on white).
- **Faint Ink** (`text3`, #6E6B64): the lightest reading text (muted day numbers, missing mail labels, struck-out bookings, row arrows). It measures 5.3:1 on white, 5.1:1 on `surface2`, 4.6:1 on `sel` and 4.8:1 on `bg`. Not used on `head`.
- **Ash** (`ash`, #807D75): product silhouette strokes only. 4.1:1 on white, so never text.
- **On-black tones** (`on-black-muted`, `on-black-soft`): group titles, shortcuts and secondary text on the black sidebar, deck and phone header. `on-black-line` is the hairline on black (player-bar button borders, the sidebar scrollbar thumb). `nav-hover` and `nav-active` are the two lifted blacks of sidebar items (hover, and the selected section or the open calculator).
- **Open dot** (`open-dot`): the small square beside "เปิดร้าน" on the home deck. It only appears with that word.

### Status (semantic, paired with words)
- **Ledger Green** (`ok`, `ok-soft`, `ok-rule`): in stock, receipts and even counts.
- **Amber Ink** (`warn`, `warn-soft`, `warn-rule`): pending bookings, reserved serials and warnings.
- Danger and low stock use the Signal Red family above.

### Calendar and launcher palette (owner-approved, data-driven)
These colours appear only as solid chip grounds on the calendar, the home agenda and the launcher tiles. Every chip still names its source in text.
- **Shop categories:** ร้าน (`black`), คลาสเรียน (`cal-class`), อีเวนต์ (`cal-event`), ทีมงาน (`cal-staff`), อื่น ๆ (`cal-other`). These are the defaults; the owner can change each **category** colour (never a single event's) in ตั้งค่าสีปฏิทิน (`staff_settings.cal_colors`, migration 031).
- **Bookings layer:** practice-room bookings default to the bookings purple (`cal-bookings`) on the calendar and the home page; the owner can change it in the same dialog.
- **Drawer head:** opening a calendar item tints the drawer head with that item's colour (teacher, category or bookings layer) and measured white/black ink. Every other drawer keeps the `head` paper.
- **Google layer:** read-only Google Calendar events use the owner's pick from Google's own 11-colour menu (Tomato #D50000 · Flamingo #E67C73 · Tangerine #F4511E · Banana #F6BF26 · Sage #33B679 · Basil #0B8043 · Peacock #039BE5 · Blueberry #3F51B5 · Lavender #7986CB · Grape #8E24AA · Graphite #616161), defaulting to Peacock (`cal-google-default`).
- **Teacher colours:** Google events whose title ends in " — <teacher>" take that teacher's colour. The owner can change these; the defaults are Zlex #C2185B · Leonie #00897B · Nutty #F6BF26 · TiBass #6D4C41 · Maniac #C0CA33 · Alldayz #00ACC1. The teacher's name is always shown as text too.
- **Launcher tiles:** per-item colours come from the launcher catalogue (ขายหน้าร้าน uses Signal Red; the rest reuse calendar and Google hues: สินค้ารับเข้า teal `launcher-receive`, สร้างลิงก์สมัครสมาชิก lavender `launcher-register`, QR รับเงิน sage `launcher-payqr`, กระดาน banana `launcher-board`, mail-label tiles `launcher-mail-label`, ติดดาว `launcher-starred`). The Spotify app tile uses Spotify green (`launcher-spotify`) because it opens Spotify itself. Discord uses a neutral blue-grey (`launcher-discord`) with a drawn chat glyph; never Discord's own blurple or logo.
- **QR codes:** always pure black modules on pure white with a 4-module quiet zone, whatever the theme. They are data, not decoration.

### Named Rules
**The First-Look Red Rule.** Red marks only what must be seen first: unread, today/now, low stock, the active nav edge and the accent action. It is never a calendar category and never decoration.

**The Colour-Plus-Word Rule.** No state is carried by colour alone. Stock status has an edge and a word, calendar chips carry the source name, cancelled bookings are struck through and hatched, and defective serials are dashed.

**The Measured Ink Rule.** Text on a coloured chip is white or black, chosen by measured contrast, and must reach 4.5:1. If neither ink reaches it, the ground is darkened until white does. Chip ink colours are never hard-coded. Launcher glyph strokes follow the same rule at the 3:1 non-text threshold.

## Typography

**Display Font:** Prompt (with Noto Sans Thai, sans-serif), weights 500/600/700
**Body Font:** Noto Sans Thai (with Segoe UI, sans-serif), weights 400/500/600/700

**Character:** Prompt is geometric and a little mechanical, and it carries every heading and every number that matters. Noto Sans Thai is the calm reading voice for polite Thai UI copy. Numerals are tabular wherever they are compared or counted.

### Hierarchy
- **Display** (Prompt 600, 136px, 0.9, −0.02em, tabular): the home deck's big clock only.
- **Numeral Hero** (Prompt 700, 80px desk drawer / 68px phone sheet, 0.82): the on-hand count of the selected model.
- **Numeral Wall** (Prompt 700, 34px, tabular): the count on each stock-wall row or card.
- **Headline** (Prompt 600, 24px): stat values, the POS net total and the deck greeting.
- **Title** (Prompt 600–700, 19px): the topbar page title, wing headers, dialog/drawer heads and the word "Console" beside the sidebar logo.
- **Title Small** (Prompt 600, 16px): card and panel heads, model names on the wall, segment and tab labels.
- **Off-ramp exceptions (kept on purpose):** the home clock's seconds (46px beside the 136px clock), the booking timer (44px) and the phone stock sheet count (68px). On an iPad in landscape with the sidebar (1100–1279px) the home clock steps down to 112px with 38px seconds, so the shop-state column keeps "อีก n ชม. n นาที" on one line and the clock stays centred. On an iPhone (< 768px) it is `min(22vw, 96px)` with seconds at 0.36em, left-aligned under the greeting. Everything else snaps to the ramp.
- **Body** (Noto Sans Thai 400, 15px, 1.5): all reading text and table cells. Phone inputs, and every desk input on a coarse pointer (iPad), use 16px so iOS does not zoom on focus. User zoom is never blocked.
- **Label** (Noto Sans Thai 500–700, 14px): field labels, meta lines, chips, tags, badges and hints. 14px is the floor.

### Named Rules
**The 14px Floor Rule.** No UI text is ever smaller than 14px, including `code`, `kbd`, badges and chart ticks. It is an owner rule enforced by tests.

**The Prompt Counts Rule.** Every number a person compares or counts (stock, totals, clock, badges) is set in Prompt with tabular figures.

## Layout

- **Desk console:** a fixed 248px black sidebar and a flexible main column (`min-width: 1200px`, full viewport height). The sidebar has three parts: the official DJ LAB SIAM logo (122×40 at 1×/2×, with "Console" in Prompt beside it) fixed at the top, the nav list in the middle, and a foot fixed at the bottom with the shortcut-help link. Only the nav list scrolls, with a thin 8px `on-black-line` scrollbar whose gutter is always reserved (`scrollbar-gutter: stable`) and `overscroll-behavior: contain`, so labels never move or wrap and the page never scrolls with it. Changing section by keyboard scrolls the active item into view. At 248px four labels are too long for their slot next to the shortcut hint and an unread badge, so the nav shows the owner's own short labels, verbatim: ข้อความ (กระดานข้อความ), Mailbox (กล่องจดหมายร้าน), เข้า-ออก/ปรับยอด (รับเข้า / ตัดออก / ปรับยอด) and ประวัติสต๊อก (ประวัติการเคลื่อนไหว, spelled with ไม้ตรี on purpose). The full names stay as page titles and item tooltips. Every label fits on one line with no ellipsis, with 2- and 3-digit badges. The main column is a white topbar with a 2px black bottom rule (page title, global search up to 560px, user) over a scrolling workspace padded 24px × 28px (40px at the bottom). An optional 420–440px white detail drawer docks on the right; when it opens, secondary columns hide and two-column splits stack instead of squeezing.
- **Home:** a black full-bleed deck (three columns: name and clock-in · big clock · shop state), a white "me" strip, then a 7:5 grid of panels.
- **Stock wall (desk):** the workspace stops scrolling. A full-width 54px scan field with the หา · รับเข้า · นับ segment sits on top, then a chip row (group switch, filter chips with counts, and the ใกล้หมด n · หมด n flags on the right), then the wall. Wings are ≥262px columns (the "other brands" wing is narrower). Each wing scrolls on its own; when the wings don't fit, they get equal integer widths and snap one wing at a time, with black step buttons at the edges. In receive/count mode a bottom tray (clamp 250–330px) docks below and the wall shrinks to make room rather than being covered.
- **Phone pages:** body capped at 480px, a sticky 56px black header, a fixed 62px black bottom nav, and 16px page padding. The phone stock wall fills the viewport between header and nav, with a scan bar, swipeable wing tabs, and a two-column card grid per wing. The receive/count tray docks above the nav.
- **Spacing rhythm:** 4 / 8 / 12 / 16 / 20px, with 10px and 14px used inside dense rows. Rows are separated by hairlines, not gaps.
- **Targets:** at least 40px on desk (32px for small buttons) and at least 44px on phone (48px for primary buttons). On any coarse pointer (desk on an iPad) every visible target is at least 44 × 44, small buttons included; a checkbox counts its label as the target.
- **iPad (desk.html, both orientations):** three width bands, chosen where the content breaks rather than by device name.
  - **≥ 1280px:** the desk layout above, unchanged (iPad Pro 12.9 landscape lands here and only gets the touch rules).
  - **1100–1279px (iPad landscape):** the 248px sidebar stays. The POS payment column narrows to 320px so a cart with finger-sized steppers still fits, and the stock-wall bar may wrap the ใกล้หมด/หมด flags to a second line (right-aligned) when the detail drawer is open.
  - **< 1100px (iPad portrait, and iPad 10.2 landscape at 1024):** the sidebar becomes an off-canvas drawer opened by a black 44px "เมนู" button at the left of the topbar, over a `rgba(15,15,15,.45)` scrim; the topbar wraps to two rows (menu · back · title · user, then search full width); the right detail drawer becomes an overlay sheet `min(440px, 100%)` instead of squeezing the workspace. A drawer, not an icon rail: fifteen sections cannot be told apart by icon alone, a rail's labels would only live in hover tooltips (no hover on touch), and the rail would cost 64px of a 712px work area. The drawer keeps the owner's labels and gives the work area the full width. Its open state survives rotation.
  - **≤ 900px (portrait):** POS, the booking/customers/daily splits, the home grid and the mail split stack to one column; the home deck puts the 136px clock on its own row; the stock-wall scan field takes its own row above the mode switch.
  - Heights use `dvh` (Safari's `vh` ignores its toolbar), and bottom-docked things add `env(safe-area-inset-bottom)` (`viewport-fit=cover`).
- **iPhone (desk.html, < 768px, owner request 2 Oct 2026):** a fourth band after the iPad ones; ≥ 768px is unchanged. It is a re-think for one hand, not a scaled-down desk, and it meets the same rules as the iPad (targets ≥ 44, inputs 16px, text ≥ 14px).
  - **Top bar:** one row of menu · back arrow (label hidden) · title, then the search field full width (about 112px instead of 176). The signed-in name and the logout button move to the foot of the nav drawer (the same node, moved by `placeUser()`). The calculator button is fixed at the right of the first row, so nothing dodges it (`--calc-clear: 0`).
  - **Stock wall:** scan field → mode segment plus "+ สินค้าใหม่" → group switch (labels shortened to แบรนด์ / หมวด) with the ใกล้หมด / หมด flags → filter chips as one sideways-scrolling strip (never wrapped, so they are never folded into "+n") → one wing nearly full width with the next wing peeking 28px so the swipe is visible. The wing step buttons are hidden. The receive/count tray is capped at 55dvh.
  - **Tables:** columns marked `col-ph` are dropped on phones only (`col-opt` keeps its desk meaning); dates may wrap; a card that holds a table scrolls sideways inside itself. The POS cart becomes one card per line with labelled fields (จำนวน · ราคาต่อหน่วย · รวม), so a price is never a bare number. The room timeline scrolls sideways with the room names pinned left.
  - **Short screens (height ≤ 500px, any width):** the iPhone landscape case. One top-bar row, one row for scan + modes, one row for group + chips + flags, so the wall keeps room for its rows (at 844×390 it had shrunk to 44px). The floating video hides its picture (audio keeps playing) when the calculator panel leaves it no room.
- **Calculator dock (desk):** a 44px square icon button at the top-right of the workspace, 14px below the topbar's 2px rule and 20px from the right edge (owner, 1 Oct 2026). It sits in the frame around the workspace (`.ws-wrap`), not in the scrolling area, so it stays put while the page scrolls and moves left of the detail drawer when one opens. The first row of every section that has right-aligned controls at that height (board, calendar, stock-wall top row, movement history, daily, admin toolbars and the shop-state block on the home deck) carries `.calc-clear`, a right margin of 48px, so nothing sits under the button at the default scroll. Content that later scrolls under it is covered by the solid button and comes back when scrolled again. Its 320px panel opens straight down from under the button, right-aligned to it, and scrolls inside itself on short screens. The floating video player never overlaps the button or the panel: its default spot is the bottom-right corner (20px from both edges), and dragging or resizing pushes it up or left of the panel by the smallest move.

## Elevation & Depth

Mostly flat and ruled: depth comes from white surfaces on paper, hairline borders, and heavy black rules. There is one soft ambient shadow for resting containers and a few stronger shadows for things that genuinely float. The black inset left edge (3–4px) is a structural marker, not a shadow.

### Shadow Vocabulary
- **Resting card** (`box-shadow: 0 1px 2px rgba(15,15,15,.05), 0 4px 16px rgba(15,15,15,.05)`): desk cards, tables, the mail reader, search results and the login box.
- **Drawer edge** (`box-shadow: -8px 0 24px rgba(15,15,15,.04)`): the right detail drawer.
- **Dialog** (`box-shadow: 0 12px 48px rgba(15,15,15,.25)`, backdrop `rgba(15,15,15,.45)`): modal dialogs.
- **Floating player** (`box-shadow: 0 12px 40px rgba(15,15,15,.35)`): the draggable mini-player.
- **Calculator** (button `0 6px 18px rgba(15,15,15,.18)`, panel `0 12px 40px rgba(15,15,15,.3)`): the floating calculator button and its panel.
- **Docked tray** (`box-shadow: 0 -4px 18px rgba(15,15,15,.08)` desk, `0 -8px 24px rgba(15,15,15,.14)` phone): receive/count trays.
- **iPad nav drawer** (`box-shadow: 8px 0 32px rgba(15,15,15,.3)`) and **overlay detail sheet** (`box-shadow: -12px 0 40px rgba(15,15,15,.22)`): the two things that slide over the workspace below 1100px. The camera panel reuses the calculator panel shadow.
- **Launcher tile** (`box-shadow: 0 2px 6px rgba(15,15,15,.14), 0 8px 18px rgba(15,15,15,.12)`; lifts 3px on hover): app-icon tiles only.

### Named Rules
**The Heavy Rule Rule.** A group's identity is a 3px black bottom rule under its header (wing headers, drawer count, phone card titles, phone sheet and tray top edges), not a shadow or a fill.

## Shapes

Square by default: `border-radius: 0` on every button, input, chip, tag, card, panel, wing, tile, dialog and tray. Borders are 1px hairlines; selected and scan-field edges step up to 2px black; group rules are 3px black. Selection on rows and cards is drawn as a 2px black frame (an `::after` overlay) or a 3–4px black inset left edge, never as a rounded highlight.

**The One Curve Rule.** The only rounded shape in the console is the app-icon launcher tile on the home page (84×84 at 20px radius, 52×52 at 13px in the editor) and its round count badge. This is an owner-approved exception that applies only there; everything else stays square.

Icons are stroked SVG at 1.75 with square caps and mitred joins (18px desk, 20–22px phone), including every sidebar item (one drawn icon per section, `aria-hidden`; no Unicode glyphs stand in for icons in the navigation). Launcher glyphs are the exception: 2.4 stroke with round caps, inside the rounded tile. Product silhouettes (for models with no photo) use `text3` strokes at 1.2–1.5, square caps, and are identical on desk and phone.

## Components

### Buttons
Blunt, bordered and square; they read like labelled keys.
- **Shape:** square (0px), 1px black border, 40px min height on desk and 48px on phone.
- **Default:** white face and black text, hovering to Selection Linen.
- **Primary:** black face and white text, hovering to `black-hover`.
- **Accent:** Signal Red face and white text, reserved for the action that must be seen first.
- **Danger:** white face with a red border and red text, hovering to `red-soft`.
- **Small / Large / Ghost:** 32px / 52px heights; ghost has no border until hover.
- **Focus:** a 2px black outline offset 2px (white on black chrome).

### Segmented controls
A row of square buttons inside one 1px black frame, divided by hairlines. The pressed segment is a black fill with white text. Used for หา · รับเข้า · นับ (with a red count badge) and for the brand/category group switch.

### Chips
- **Filter chip:** white, 1px `line-strong` border, 14px 600 label with a lighter count. Hover turns the border black; pressed is a black fill with white text and a `on-black-soft` count. Chips that overflow one line fold into a dashed "+n" chip and are never cut mid-number.
- **Status flags (ใกล้หมด n · หมด n):** bordered toggles with a 4px swatch bar. The low flag is red-bordered and fills red when on; the out flag fills black when on.
- **Calendar chip:** a solid source-colour ground with measured white or black ink (Measured Ink Rule), always labelled.
- **Status pill:** soft ground, matching rule border and a word (ok / warn / bad / off).

### Cards / Containers
- **Corner Style:** square.
- **Background:** white on paper.
- **Shadow Strategy:** the resting card shadow on desk cards and tables; phone cards are flat.
- **Border:** 1px `line`.
- **Internal Padding:** 20px on desk cards, 16px on phone cards, and 14–18px panel heads.

### Ops Board rows (`#ops`, owner only, 2026-10-02)
- **Group head:** the `head` paper bar with a 2px black bottom rule, the urgency written as a word (ด่วน / จับตา / ติดตาม) plus a count; never colour alone.
- **Task row:** white, square, 1px `line` between rows, a 4px inset edge on the left in `red` / `warn` / `ok` that repeats the group's word. Title 16px head face; detail, next step, tags 14px. Done rows go `surface2` with a struck title. The due state is a status pill with words ("เลยกำหนด 3 วัน", "อีก 2 วัน"). Status is a select, so a row changes state in one gesture. The side column (select + buttons) stacks right on desk and drops under the text below 640px.
- **Order block (สั่ง Claude):** sits inside the row under the next-step strip: a 1px `line-strong` white box, the status as a pill with words (รอ Claude รับ · Claude รับแล้ว กำลังทำ · Claude ทำแล้ว · ทำไม่สำเร็จ · ยกเลิกแล้ว), the owner's instruction in 14px `pre-wrap`, and Claude's written-back result in a `surface2` strip (selectable, capped at 30vh). One block per row — the latest order. The row's button swaps "สั่ง Claude" for "ยกเลิกคำสั่ง" while an order is open.
- **Answer card (ช่วยคิด dialog):** a 1px `line` box with a `surface2` meta strip (kind · time · "ใหม่" on the fresh one, black border) and a copy button; the body is `pre-wrap` 14px so a draft can be selected and pasted whole. Newest answer first.

### Catalog rows (`#catalog` · ราคา / โปรโมชัน, 2026-10-04)
- **Group head:** the same `head` paper bar as Ops (2px black bottom rule), the bot category written as a word with a count; products without a bot category close the list under "ยังไม่ระบุประเภทของบอท".
- **Product row:** a 44×44 checkbox label first (the whole label is the tap target — ticked = on sale), then the name (600) with brand · sku · bot code on one 14px sub line, then the price right-aligned, then a ghost "แก้" button. Tags sit under the sub line as status pills with words (✕ เลิกขาย · ⚠ ยังไม่มีรหัสบอท · % promo name · รายการราคา · ไม่สต็อก); an off-sale row goes `surface2` with `text2` ink — the word carries the state, the tint only helps scanning.
- **Promo card:** white, square, resting shadow; a `head` bar with the promo name, its state pill (✓ ใช้อยู่ · ◷ ยังไม่เริ่ม · ✕ หมดเวลาแล้ว · ⏸ ปิดโปร), the Thai date range and code; deals underneath as rows (who + kind on the left, regular price struck back to `text2` and the promo price in 600 on the right). A parked deal replaces the price with a warn pill that says why ("พัก — รุ่นเลิกขาย"). No left stripe.
- **Colour warning:** one persistent `alert-warn` strip at the top of the promo tab and again in the deal dialog — the sentence is fixed copy agreed with the bot team.
- **Undo bar:** an `alert-plain` strip under the stats that stays until the next change (a toast alone vanishes in 3.5s); it names what changed and carries the "↶ ย้อนกลับ" button only for edits the database can undo.
- **PDF drop zone (promo dialog):** a full-width button with a 2px *dashed* `line-strong` frame, `surface2` ground, 96px tall, centred sentence plus a 14px hint; hover or a file over it turns the ground `sel` and the frame black. After a file is chosen it becomes a bordered chip row (name · size · "อ่านแล้วกรอกให้" · "เอาออก"). Claude's draft deals are listed below the form as bordered rows with a 44px checkbox label each; a deal with a problem is `surface2`, its checkbox disabled, and the reason written next to it (⚠ …) — never colour alone.

### Inputs / Fields
- **Style:** white, 1px `line-strong`, square, 40px (desk) / 46px (phone), 15–16px text.
- **Focus:** the border goes black with a 2px black outline inset by 1px.
- **Read-only / Disabled:** `surface2` ground with `text2` text.
- **Scan field:** 54px (desk) / 50px (phone), 2px black frame, a scan icon, a black mode tag and a faint 3px focus halo. It is the first thing in view on any scan page.

### Headers (owner choice "B", shipped 2026-10-01)
- **Panel head / table head / wing head / tray head / drawer head:** `head` paper (#E3DFD5) with a 2px solid black bottom rule (wing heads keep the 3px Heavy Rule). Buttons on it stay white-faced or ghost; all text on it is ≥ 4.5:1.
- **Topbar:** stays white, with a 2px solid black bottom rule.
- **Phone (stock.html):** card titles become full-bleed `head` bars with the same 2px black rule; the tray head uses the same paper. The black phone header is unchanged.

### Navigation
- **iPad below 1100px:** the same sidebar slides in as a drawer from the black "เมนู" button (three-line glyph plus the word), over a dark scrim. Tapping a section, the scrim or Esc closes it; the work area behind is inert while it is open.
- **iPhone below 768px:** the same drawer. Its foot also holds the signed-in name and the logout button (outlined white on black, 44px), because the top bar has no room for them.
- **Desk sidebar:** black, top-left official logo plus "Console", 15px items with drawn 1.75-stroke icons, grouped under 14px muted titles. Hover `nav-hover`; active is `nav-active` with a 3px red left edge and 600 weight. Shortcut hints sit at the right of each item. Labels are always one line (`nowrap`); a label too long for its slot ends in an ellipsis rather than wrapping, and the full name stays in the tooltip and the page title.
- **Phone:** the black header carries the official logo (73×24) and a module select. The black bottom nav has icon plus label, and the active item gets a 3px red top edge.
- **Tabs:** a 3px black underline marks the selected tab (mail tabs on desk, wing tabs on phone). Red stays reserved for the active nav item.

### Stock Wall (signature)
- **Wing:** white column, 1px hairline border, header in Prompt 19px/700 with a count at the right, sitting on a 3px black rule. Sticky `surface2` shelf sub-headers group by category or brand.
- **Row (desk) / Card (phone):** photo tile · model name (Prompt 16px, two lines max) · price and status tag · a big Prompt count at the right (bottom-right on phone cards). Hover is `surface2`; selected is Selection Linen with a 2px black frame; a scan hit flashes black and fades.
- **Photo tile:** always a white tile with equal inner padding and a hairline border (`object-fit: contain`), so dark product shots read as framed pictures rather than holes in the wall. Inactive products desaturate.
- **Detail drawer:** a 250px white photo stage, the meta line, an 80px count over a 3px black rule, a four-way black-framed action bar, then serial chips grouped by status.
- **Tray:** docks at the bottom in receive/count mode. Units collect as photo cards with the serial on one line; duplicates get a red frame and the word "ซ้ำ".

### Touch (desk on iPad)
- **Pointer, not width, decides touch rules** (`pointer: coarse` for sizes, `hover: none` for reveals), so an iPad with a trackpad behaves like the desk and a narrow desktop window does not grow fat buttons.
- **Nothing hides behind hover.** On `hover: none` the stock wall's "+ เพิ่มรูป" tile shows on every row without a photo (a quiet dashed tile, not a filled button), the floating player shows a drawn six-dot grip, and text that the desk truncates with a tooltip (the tray's last message, the home agenda titles) wraps instead.
- **Keyboard hints hide, shortcuts stay.** Alt+… hints in the sidebar, the `/` key in the scan field, `Esc`/`F9` keys inside buttons and the cart's key hints are hidden on coarse pointers; every shortcut still works when a keyboard is attached, and "? ดูคีย์ลัดทั้งหมด" stays in the sidebar foot.
- **No traps:** inner scrollers (sidebar, wings, wall, detail sheet, dropdown results, calculator, tray, chat log) use `overscroll-behavior: contain`; in-page tables do not (a table taller than the screen would stop the page from scrolling). The page itself never bounces (`overscroll-behavior: none` on html). Buttons use `touch-action: manipulation`, so fast taps never zoom, while pinch-zoom still works.
- **No auto-focus of text fields on touch:** a section change, a mode switch or a launcher tap does not focus a text field (iOS would raise the keyboard over half the screen). The Bluetooth scanner listens at document level, so it does not need a focused field.
- **On-screen keyboard:** toasts lift above it (`--kb`), and the floating video hides its picture while the keyboard is up (audio keeps playing).
- **Wing step buttons** are 44px wide on touch; when they show, the wall insets 16px each side so the buttons sit in the gutter and never cover a stock count.

### Camera scan (desk on iPad)
- **Button:** a 44px bordered square with the drawn camera glyph inside the stock-wall scan field, and a "กล้อง" button beside the POS search. It shows on touch devices or devices that report a camera; the counter PC never sees it.
- **Panel:** not a modal (the Bluetooth scanner must keep working while it is open). It floats top-centre, `min(520px, 100vw − 32px)`, with a `head` title bar, a black mode tag (หา · รับเข้า · นับ · ขาย), the live video with the same red reading frame as stock.html (8% / 32% insets), a one-line status that names what was read and the running count, and ไฟฉาย + a full-width black "เสร็จแล้ว". It leaves the cart and the receive/count tray visible below.

### Calculator (desk, every section)
A 44px square icon button at the top-right of the workspace (Alt+K, tooltip and label "เครื่องคิดเลข (Alt+K)"), white face with a 1px black border like every default button, so it also reads on the black home deck; open = black fill with white icon. It opens a non-modal 320px panel straight down from under it: a `head` title bar, a right-aligned screen (expression in `text2`, result in Prompt 34px tabular, live "= preview"), a 4-column square keypad with 1px gaps (operators on `surface2`, `=` black full-width), copy-result, and the last five results. Keyboard works while it has focus (digits by `event.code`, so the Thai layout types numbers; Enter is =, Esc closes and returns focus). A barcode burst that lands in it is undone and routed to the current section, like any scan. Open/closed is remembered per machine.

### QR รับเงิน (payment QR)
A dialog with two modes in a segmented control: **พร้อมเพย์ — ใส่ยอด** (amount field + a 340px black-on-white QR inside a 2px black frame, the amount in Prompt 34px, the display name, and the PromptPay ID masked to its last four digits) and **QR บัญชีของร้าน** (pick a labelled account, show its uploaded image). Unconfigured modes show a dashed setup panel, never an error. The POS payment card has a full-width "QR พร้อมเพย์ — ยอดบิลนี้" button.

### Discord room (desk `#discord`)
One full-height panel: a header-B head with the channel name, a scrolling message list (oldest at top, newest at bottom, day rules, a red "ข้อความใหม่" rule above the first unread), and a composer docked under a 2px black rule, kept 84px above the bottom so the calculator corner stays clear. Messages are square 36px avatars, Prompt 16px names, Thai 24-hour times in `text2`, and text capped at 75ch. Consecutive messages from one author within 7 minutes group under one name. Console posts read "Name · ผ่านคอนโซล". Image attachments are framed white tiles (max 320×220) and other files are bordered chips. The reply action appears on hover or focus; the selected message gets the 3px black inset edge.

### Launcher (home)
2 × 2 app-icon tiles: coloured 84px rounded tiles (the One Curve exception), 2.4-stroke glyphs with ink chosen at ≥3:1, a Prompt 16px label, and a round red count badge with a 2px white ring. With reduced motion there is no lift.

## Do's and Don'ts

### Do:
- **Do** keep every corner square (0px). The only curve is the home launcher tile (20px) and its badge.
- **Do** mark low stock with a 4px red inset left edge **plus** the word "ใกล้หมด", and out of stock with a 4px black inset left edge **plus** the word "หมด"; the count turns red when low.
- **Do** show a category line silhouette (text3 stroke, square caps) for any model with no photo, and use the same drawing on desk and phone.
- **Do** put every product photo on a white tile with equal padding and `object-fit: contain`.
- **Do** show prices on the stock wall and in its drawer as `฿` with no decimals (for example ฿12,900). Bills, POS and daily accounts keep two decimals.
- **Do** keep model names and SKUs whole in the POS cart: they may wrap only between words, never at a hyphen (DDJ-FLX4, DJM-S11), and the qty/price/total/remove columns take only the width they need so the name column gets the rest.
- **Do** keep serial numbers on one line (`white-space: nowrap`, tabular figures, +0.02em tracking), because staff compare them character by character against the box sticker.
- **Do** keep all text at 14px or larger, and chip text at 4.5:1 or better via measured white/black ink.
- **Do** use black fill with white text for every selected or pressed state (chips, segments, flags, drawer actions).
- **Do** head groups with a 3px black rule.
- **Do** honour `prefers-reduced-motion`: no lifts, flashes or slides; state still reads through words and colour.
- **Do** use one ease for movement, `cubic-bezier(0.16, 1, 0.3, 1)`, at 150–450ms.
- **Do** head every panel and table with `head` paper and a 2px black rule.
- **Do** keep floating windows clear of the calculator panel; they move around it.
- **Do** give every target on a coarse pointer 44 × 44 and every input 16px text.
- **Do** make anything that appears on hover visible on `hover: none`.

### Don't:
- **Don't** round anything outside the launcher tiles.
- **Don't** use red as a calendar category or a decorative accent.
- **Don't** signal any state by colour alone.
- **Don't** hard-code ink colours on coloured chips; they are computed from contrast.
- **Don't** use `ash` for text; it is 4.1:1 on white. Don't put `text3` or red text on `head`.
- **Don't** add a coloured side stripe to alerts or toasts.
- **Don't** write "Google" on teacher or Google calendar chips; they start with the time, and the teacher's name must always be visible as text.
- **Don't** wrap or truncate a serial number.
- **Don't** block user zoom or focus a text field from code on touch.
