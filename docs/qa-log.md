# QA log — FF Frames vs ethanwong.photography

Instruments: `tools/capture.mjs` (page-by-page, arrival gate awaited, reveals driven by a step scroll,
`Math.random` seeded so the index backdrop pool matches), `tools/states.mjs` (interaction states),
`tools/calc.mjs` (pricing calculator with fixed inputs), `tools/tokens.mjs` (the skill's extractor),
`tools/diff.py` (numeric screenshot diff: mean abs difference 0–255 and % of pixels >24). Headless
Chromium was the primary instrument because the desktop's display slept mid-session and every Chrome tab
reported `visibilityState: hidden` with a 17× timer clamp — the same trap the skill warns about; the
in-Chrome checks that did run (DOM, console, postMessage) are noted.

## 2026-09-16 — pass 1, all pages, desktop 1440 (`docs/qa/shots` vs `docs/reference/2026-09-16/shots`)

Top-of-page: every route mean ≤1.6 (index 0.65, about 0.69, galleries 0.07–0.09, editorials 0.27,
exchange 1.17, stories 0.25, story pages 0.64–1.00, pricing 0.08, privacy/terms 1.1–1.3, svc 0.09–1.59,
404 0.08). Diff heat images show only the wordmark and reflowed brand copy.
Full-page: same, except story pages (18–24) where the reference's lazy images had not arrived over the
network at capture time (side-by-side crop confirmed: placeholder plates vs loaded photos, same layout).
Contact: 3.59 at first — the `[data-reveal]` copy stayed hidden because the contact script had been given the
commercial page's tile-lightbox module by mistake; the `revealed` gate is the contact page's. Fixed
(`src/scripts/pages/contact.ts` / `commercial.ts`), recaptured: 0.25.

## Phone 390 (touch, mobile UA)

Top-of-page all ≤1.7 except privacy 8.29 / terms 4.31 / film-wedding 7.42 / contact 7.01 — inspected: brand
copy reflow (shorter name → different line breaks) and, on contact, the iframe not growing. The frame was
posting its height before the parent's bundled listener existed (the reference's listener is an inline
script). Added a ping handshake (`ew-inquire-ping`); contact-top now 0.43, full height within 16px.
Dock, dock sheet, lens position and the sheet's thumbnails match (m-dock-sheet 0.55).

## 768 and 1920

All routes ≤2.3 top-of-page; the residue is again reflowed copy on the legal pages.

## Interaction states (`docs/qa/states`)

menu-open 0.09 · menu hover row 0.15 · thumbnails hover 0.15 · grid open (Flip) 0.71 · grid closed 0.09 ·
menu closed 0.67 · index hover row 3 (cascade + backdrop swap) 0.09 · nav hidden after scroll 0.22 / shown
again 0.66 · CTA hover (fill + rolled label) 0.00 · CTA ink splash mid-flight 0.07 · editorials scene 0.16 ·
editorials preview open 1.17 · weddings mid-scroll (pinned grid) 1.44 · story full gallery 1.30 · story
lightbox 71.7 → the reference's lightbox image had not loaded at 900ms; ours had (instrument) · pricing
top/calc 0.08/0.00.
Not reachable in the harness: the menu overlay on phones (the reference hides the menu button ≤640px and
uses the dock; the "+" accordion therefore only exists between 641–1024px or on coarse pointers — verified
in the tablet capture's menu HTML, not screenshotted).

## Interaction states, pass 2

about peek open 0.84 / peek lightbox 0.35 · stories title hover cascade 0.25 · editorials preview on a
real preview scene (the first scene is a link to /editorials/exchange, which the first pass had clicked on
both sites): opening frame 0.10, open 0.67, Escape closing 0.20, closed 0.25 · menu grid lightbox 0.01 and
ArrowRight 0.01 · pricing tooltip 0.00, wedding fields 0.00 · tablet 1024 menu: open 0.15, "+" accordion
0.19, accordion → grid 0.67 · phone story chapter chip 0.64 and chapter sheet 0.36 · phone index 0.94 ·
dock lens after tapping Pricing 10.6 (both mid leave-fade; >24 only 0.01%).

## Mid-scroll viewports (35% and 70% of every page, 1440)

All ≤3.0 (contact/terms residue = copy reflow; index-mid70 4.7 = the 6s backdrop cycle mid-crossfade).
This is the pass that exercises the pinned grids, trio columns, exchange counter column, parallax and
chapter rails in their scrolled states.

## Pricing calculator

Same inputs on both sites (15 May 2027; wedding 8h medium guests, elopement 3h, engagement 2h, family
1.5h, headshot 2h, corporate event 4h): $6,228 / $1,602 / $1,047 / $1,005 / $1,385 / $3,550 on both.
Filled-state screenshot diff 0.00.

## Tokens

Extractor run on `/`, `/about`, `/weddings`, `/pricing` at 1440 (and 390 on the reference). Type scale,
families, weights, colour census, spacing, radii, shadows, transitions and breakpoints identical. Only
difference: the header grid's auto column (the wordmark is 4px narrower) — deliberate.

## Build

`astro build`: 25 pages, clean. Grep of `dist/` for `ethan`, `imagedelivery`, `typekit.net`, `app.ethanwong`,
`clarity`, `_vercel`: 0 hits (four photographs whose file names carried the owner's name were renamed).

## In-browser checks that did run (Chrome MCP, tab hidden so no motion judged)

Routes render; no console errors on `/`, `/contact`; the inquiry frame is same-origin and its height
message is accepted (frame grew to 1409px after the handshake fix).

## Known gaps (see parity ledger)

- Inquiry form: portal-side features (places autocomplete, estimate handoff into the form, real call slots,
  sending) are stand-ins; the visible flow and the thank-you card are reproduced.
- Real-window motion (60fps feel, Lenis wheel feel, trackpad inertia) not judged by eye in this session —
  the display was asleep; headless captures of mid-animation frames matched.
- `/inquire/embed` is reachable directly (noindex); the reference's equivalent lives on its portal.

## 2026-09-16 — live deployment (https://ff-frames.pages.dev)

Pushed to github.com/Aphrosidiac/EthanClone (public; the 1.1 GB of screenshot captures were purged from
history first — regenerable with `tools/capture.mjs`). Deployed by direct upload to CF Pages `ff-frames`
(3,796 files, 229 s). Smoke test: every route class 200/404 as expected, images and fonts served from our
origin, the disclaimer present in the HTML. Live capture vs reference: index 0.73, pricing 0.08, weddings
top 0.19; weddings mid-scroll 10–20 = Lenis/drift tween a few px apart in time over the network (same layout,
same state — checked side by side).
