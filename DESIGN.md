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
    backgroundColor: "{colors.black}"
    textColor: "{colors.surface}"
    rounded: "{rounded.none}"
    width: "52px"
    height: "52px"
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

Two devices share one world. `desk.html` is a keyboard-first counter console (≥1280px, USB scanner, hash-routed sections in one file); `stock.html` and the other phone pages are portrait, one-hand, camera-scan pages capped at 480px. They use the same tokens, the same two typefaces, and the same square geometry. Only the touch-target sizes change.

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
- **Signal Red** (`red`): the brand red, used only where attention must land first: the active nav edge, unread-message box and count badges, today/now markers on the calendar and timeline, the low-stock edge, tag and flag on the stock wall, the accent button and the login box top rule. (Toasts and alerts no longer carry a coloured side stripe; alerts use a 1px frame in their own tint.) Hover deepens to `red-hover`. `red-soft` is its tinted alert/badge ground, `red-rule` its soft border, and `red-ink` is the deep red used for text on `red-soft` (8.6:1).

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
- **On-black tones** (`on-black-muted`, `on-black-soft`): group titles, shortcuts and secondary text on the black sidebar, deck and phone header.

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
- **Launcher tiles:** per-item colours come from the launcher catalogue (ขายหน้าร้าน uses Signal Red; the rest reuse calendar and Google hues: สินค้ารับเข้า teal `launcher-receive`, สร้างลิงก์สมัครสมาชิก lavender `launcher-register`, QR รับเงิน sage `launcher-payqr`).
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
- **Headline** (Prompt 600, 24–26px): stat values, the POS net total and the deck greeting.
- **Title** (Prompt 600–700, 18–20px): the topbar page title (20px), wing headers (19px), dialog/drawer heads (18px) and the word "Console" beside the sidebar logo (19px).
- **Title Small** (Prompt 600, 15–17px): card and panel heads, model names on the wall (16px), segment and tab labels.
- **Body** (Noto Sans Thai 400, 15px, 1.5): all reading text and table cells. Phone inputs use 16px so iOS does not zoom.
- **Label** (Noto Sans Thai 500–700, 14px): field labels, meta lines, chips, tags, badges and hints. 14px is the floor.

### Named Rules
**The 14px Floor Rule.** No UI text is ever smaller than 14px, including `code`, `kbd`, badges and chart ticks. It is an owner rule enforced by tests.

**The Prompt Counts Rule.** Every number a person compares or counts (stock, totals, clock, badges) is set in Prompt with tabular figures.

## Layout

- **Desk console:** a fixed 248px black sidebar (official DJ LAB SIAM logo, 122×40 at 1×/2×, with "Console" in Prompt beside it) and a flexible main column (`min-width: 1200px`, full viewport height). The main column is a white topbar with a 2px black bottom rule (page title, global search up to 560px, user) over a scrolling workspace padded 24px × 28px (96px at the bottom, so the last rows clear the calculator button). An optional 420–440px white detail drawer docks on the right; when it opens, secondary columns hide and two-column splits stack instead of squeezing.
- **Home:** a black full-bleed deck (three columns: name and clock-in · big clock · shop state), a white "me" strip, then a 7:5 grid of panels.
- **Stock wall (desk):** the workspace stops scrolling. A full-width 54px scan field with the หา · รับเข้า · นับ segment sits on top, then a chip row (group switch, filter chips with counts, and the ใกล้หมด n · หมด n flags on the right), then the wall. Wings are ≥262px columns (the "other brands" wing is narrower). Each wing scrolls on its own; when the wings don't fit, they get equal integer widths and snap one wing at a time, with black step buttons at the edges. In receive/count mode a bottom tray (clamp 250–330px) docks below and the wall shrinks to make room rather than being covered.
- **Phone pages:** body capped at 480px, a sticky 56px black header, a fixed 62px black bottom nav, and 16px page padding. The phone stock wall fills the viewport between header and nav, with a scan bar, swipeable wing tabs, and a two-column card grid per wing. The receive/count tray docks above the nav.
- **Spacing rhythm:** 4 / 8 / 12 / 16 / 20px, with 10px and 14px used inside dense rows. Rows are separated by hairlines, not gaps.
- **Targets:** at least 40px on desk (32px for small buttons) and at least 44px on phone (48px for primary buttons).
- **Reserved corner (desk):** the bottom-right corner holds the 52px calculator button (20px from both edges) and, when open, its 320px panel above it. The floating video player never overlaps either: its default spot is above the button, and dragging or resizing pushes it up or left of the corner by the smallest move.

## Elevation & Depth

Mostly flat and ruled: depth comes from white surfaces on paper, hairline borders, and heavy black rules. There is one soft ambient shadow for resting containers and a few stronger shadows for things that genuinely float. The black inset left edge (3–4px) is a structural marker, not a shadow.

### Shadow Vocabulary
- **Resting card** (`box-shadow: 0 1px 2px rgba(15,15,15,.05), 0 4px 16px rgba(15,15,15,.05)`): desk cards, tables, the mail reader, search results and the login box.
- **Drawer edge** (`box-shadow: -8px 0 24px rgba(15,15,15,.04)`): the right detail drawer.
- **Dialog** (`box-shadow: 0 12px 48px rgba(15,15,15,.25)`, backdrop `rgba(15,15,15,.45)`): modal dialogs.
- **Floating player** (`box-shadow: 0 12px 40px rgba(15,15,15,.35)`): the draggable mini-player.
- **Calculator** (button `0 6px 18px rgba(15,15,15,.28)`, panel `0 12px 40px rgba(15,15,15,.3)`): the floating calculator.
- **Docked tray** (`box-shadow: 0 -4px 18px rgba(15,15,15,.08)` desk, `0 -8px 24px rgba(15,15,15,.14)` phone): receive/count trays.
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
- **Desk sidebar:** black, top-left official logo plus "Console", 15px items with drawn 1.75-stroke icons, grouped under 14px muted titles. Hover `#1C1C1C`; active is a slightly lifted black with a 3px red left edge and 600 weight. Shortcut hints sit at the right of each item.
- **Phone:** the black header carries the official logo (73×24) and a module select. The black bottom nav has icon plus label, and the active item gets a 3px red top edge.
- **Tabs:** a 3px black underline marks the selected tab (mail tabs on desk, wing tabs on phone). Red stays reserved for the active nav item.

### Stock Wall (signature)
- **Wing:** white column, 1px hairline border, header in Prompt 19px/700 with a count at the right, sitting on a 3px black rule. Sticky `surface2` shelf sub-headers group by category or brand.
- **Row (desk) / Card (phone):** photo tile · model name (Prompt 16px, two lines max) · price and status tag · a big Prompt count at the right (bottom-right on phone cards). Hover is `surface2`; selected is Selection Linen with a 2px black frame; a scan hit flashes black and fades.
- **Photo tile:** always a white tile with equal inner padding and a hairline border (`object-fit: contain`), so dark product shots read as framed pictures rather than holes in the wall. Inactive products desaturate.
- **Detail drawer:** a 250px white photo stage, the meta line, an 80px count over a 3px black rule, a four-way black-framed action bar, then serial chips grouped by status.
- **Tray:** docks at the bottom in receive/count mode. Units collect as photo cards with the serial on one line; duplicates get a red frame and the word "ซ้ำ".

### Calculator (desk, every section)
A square black 52px button at the bottom-right (Alt+K) opens a non-modal 320px panel above it: a `head` title bar, a right-aligned screen (expression in `text2`, result in Prompt 34px tabular, live "= preview"), a 4-column square keypad with 1px gaps (operators on `surface2`, `=` black full-width), copy-result, and the last five results. Keyboard works while it has focus (digits by `event.code`, so the Thai layout types numbers; Enter is =, Esc closes and returns focus). A barcode burst that lands in it is undone and routed to the current section, like any scan. Open/closed is remembered per machine.

### QR รับเงิน (payment QR)
A dialog with two modes in a segmented control: **พร้อมเพย์ — ใส่ยอด** (amount field + a 340px black-on-white QR inside a 2px black frame, the amount in Prompt 34px, the display name, and the PromptPay ID masked to its last four digits) and **QR บัญชีของร้าน** (pick a labelled account, show its uploaded image). Unconfigured modes show a dashed setup panel, never an error. The POS payment card has a full-width "QR พร้อมเพย์ — ยอดบิลนี้" button.

### Launcher (home)
2 × 2 app-icon tiles: coloured 84px rounded tiles (the One Curve exception), 2.4-stroke glyphs with ink chosen at ≥3:1, a Prompt 16px label, and a round red count badge with a 2px white ring. With reduced motion there is no lift.

## Do's and Don'ts

### Do:
- **Do** keep every corner square (0px). The only curve is the home launcher tile (20px) and its badge.
- **Do** mark low stock with a 4px red inset left edge **plus** the word "ใกล้หมด", and out of stock with a 4px black inset left edge **plus** the word "หมด"; the count turns red when low.
- **Do** show a category line silhouette (text3 stroke, square caps) for any model with no photo, and use the same drawing on desk and phone.
- **Do** put every product photo on a white tile with equal padding and `object-fit: contain`.
- **Do** show prices on the stock wall and in its drawer as `฿` with no decimals (for example ฿12,900). Bills, POS and daily accounts keep two decimals.
- **Do** keep serial numbers on one line (`white-space: nowrap`, tabular figures, +0.02em tracking), because staff compare them character by character against the box sticker.
- **Do** keep all text at 14px or larger, and chip text at 4.5:1 or better via measured white/black ink.
- **Do** use black fill with white text for every selected or pressed state (chips, segments, flags, drawer actions).
- **Do** head groups with a 3px black rule.
- **Do** honour `prefers-reduced-motion`: no lifts, flashes or slides; state still reads through words and colour.
- **Do** use one ease for movement, `cubic-bezier(0.16, 1, 0.3, 1)`, at 150–450ms.
- **Do** head every panel and table with `head` paper and a 2px black rule.
- **Do** keep the bottom-right corner clear for the calculator; floating windows move around it.

### Don't:
- **Don't** round anything outside the launcher tiles.
- **Don't** use red as a calendar category or a decorative accent.
- **Don't** signal any state by colour alone.
- **Don't** hard-code ink colours on coloured chips; they are computed from contrast.
- **Don't** use `ash` for text; it is 4.1:1 on white. Don't put `text3` or red text on `head`.
- **Don't** add a coloured side stripe to alerts or toasts.
- **Don't** write "Google" on teacher or Google calendar chips; they start with the time, and the teacher's name must always be visible as text.
- **Don't** wrap or truncate a serial number.
