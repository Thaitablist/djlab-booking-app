---
version: 1
slug: "desk-html"
primary_target: "desk.html"
related_targets: ["stock.html"]
---

# Surface brief: stock (desk.html `#stock` family + stock.html)

Mode: Operate. Counter PC (desk.html, ≥1280px, wedge scanner, keyboard-first) and phone walk-around (stock.html, portrait, camera scan).
Jobs, in owner priority: find a model / check what's left (incl. serials) · receive a delivery by scanning serials · count stock and adjust.
Owner's complaints: "only text tables", "phone page hard to use". Real product photos exist in workspace Assets (AlphaTheta, NEO); Pioneer DJ has none yet, so upload per model is part of the job.
Constraints: DJ LAB SIAM world unchanged (tokens, Prompt + Noto Sans Thai, square corners, light). Every CLAUDE.md rule stands. The data is 117 models across 9 categories and 4 brands, and it will grow.

## Direction contract

THESIS: Stock reads like the shop's own display wall: every model is a photo plus one big number, shelved in wings. The same wall regroups on one switch between brand wings (AlphaTheta · Pioneer DJ · NEO by OYAIDE · แบรนด์อื่น, with category sub-shelves) and category wings (one per category, scrolling sideways, with brand as a filter). It refuses the text table with a side panel.

OWN-WORLD: The DJ LAB console system. Wing headers sit on a 3px black rule. Rows carry a 60–96px product photo, the model in Prompt, and the price. The count is a large Prompt numeral on the right. Low stock gets a red inset left edge plus the word "ใกล้หมด"; out of stock gets a black edge plus "หมด". Category and brand chips are square, and black when on. Nothing is rounded.

STORY: Staff scan or type and the wall jumps to that model. They see how many are in the shop and which serials, then receive or count in place without leaving the wall.

FIRST VIEWPORT: The full-width scan field with a หา · รับเข้า · นับ segmented control at the right. Below it, a chip row: group switch (แบรนด์ / หมวด), filter chips with counts, and ใกล้หมด n · หมด n toggles on the right. The wall fills the rest; each wing scrolls on its own. A selected model opens a right detail drawer with a large photo, the count, serial chips by status, and actions. In รับเข้า or นับ mode a tray docks at the bottom, collecting scanned units as photo cards until the confirm button.

FORM: Brand Wings (owner-locked after two re-rolls and a rendered 6-way comparison, plus a brand/category toggle the owner asked for); position 6 on the first ranked list; seed key ed87196c.

FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance
