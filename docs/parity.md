# Parity ledger

**21/26 complete** — 20 done, 2 partial, 1 deferred, 2 omitted, 1 improved

## a11y

| ID | Feature | Status | Evidence | Notes |
| --- | --- | --- | --- | --- |
| A11Y-01 | Reduced-motion paths, dialog semantics, inert cards, keyboard lightbox | done | Ported from the reference; reduced-motion branches present in every module | Not audited with a screen reader |

## about

| ID | Feature | Status | Evidence | Notes |
| --- | --- | --- | --- | --- |
| ABT-01 | Hero entrance, scrubbed parallax, block reveals, travel rows, peek accordion, lightboxes | done | about-top 0.69 / full 0.45 (1440); 390 1.13/1.66; tokens identical |  |

## contact

| ID | Feature | Status | Evidence | Notes |
| --- | --- | --- | --- | --- |
| CON-01 | Page: reveal gate, framed form, client marquees, close rows | done | contact-top 0.25 (1440) / 0.43 (390) after fixes |  |
| CON-02 | Inquiry form: cards, marks, tiles, people/places, dates, estimate lane, call calendar, lead select, thank-you, height + sent messages | partial | Markup + CSS are the portal embed's (first card diff 0.25); flow exercised in headless; nothing is sent | Address autocomplete, real call slots, server validation and delivery are portal features — stand-ins here |

## editorials

| ID | Feature | Status | Evidence | Notes |
| --- | --- | --- | --- | --- |
| ED-01 | 3D carousels, scene copy cascades, preview open/close, grid lightbox | done | editorials-scene 0.16, editorials-preview 1.17; top 0.27 |  |

## exchange

| ID | Feature | Status | Evidence | Notes |
| --- | --- | --- | --- | --- |
| EX-01 | Hero, counter column scroll, phone rebalancing, frame lightboxes | done | exchange top 1.17 / full 1.00 (1440); 390 0.75/0.50 |  |

## galleries

| ID | Feature | Status | Evidence | Notes |
| --- | --- | --- | --- | --- |
| GAL-01 | Weddings/Engagements/Commercial: Lenis, hero, rises, parallax, drift, reviews rotator, hover reveal, pinned grid, close cascade, chapter rail | done | top diffs 0.07–0.09, full ≤0.7; weddings-mid 1.44 | Commercial adds the tile lightbox (commercial.ts) |

## index

| ID | Feature | Status | Evidence | Notes |
| --- | --- | --- | --- | --- |
| IDX-01 | Row entrance cascade, hover cascade, backdrop cycle with dwell bar, pool warming, story fit | done | index-top 0.65 (1440), 0.94 (390), 0.75 (1920); index-hover-row3 0.09 | Math.random seeded in the harness so pools match |

## legal

| ID | Feature | Status | Evidence | Notes |
| --- | --- | --- | --- | --- |
| LEG-01 | Privacy, Terms, 404 | done | tops 0.08–1.3; residue is reflowed brand copy |  |

## pricing

| ID | Feature | Status | Evidence | Notes |
| --- | --- | --- | --- | --- |
| PRC-01 | Instant-estimate calculator (rates, date rules, guests, studio, bundle, travel, weather) | done | Six shoot types quoted identically on both sites ($6,228 … $3,550); filled-state diff 0.00 | Vendored prettified module; places lookup falls back to open-meteo (portal endpoint removed) |
| PRC-02 | Estimate handoff to the inquiry form (sessionStorage → postMessage) | partial | Parent side ported and posts on first height message; the local form does not consume the quote | The consuming side lived in the portal |

## seo

| ID | Feature | Status | Evidence | Notes |
| --- | --- | --- | --- | --- |
| SEO-01 | Per-page meta, OG/Twitter, JSON-LD, favicons, touch icon, OG image | improved | Base.astro emits per-page canonical/OG; FF icons + OG generated | Reference's The Knot/Facebook sameAs dropped; sitemap.xml/robots/llms.txt not generated yet |
| SEO-02 | sitemap.xml, robots.txt, llms.txt | deferred |  | Live at ff-frames.pages.dev without them; add if the demo needs indexing |

## service pages

| ID | Feature | Status | Evidence | Notes |
| --- | --- | --- | --- | --- |
| SVC-01 | 8 SEO landing pages: rise-in, image fade, see-the-work jump | done | tops 0.09–1.6 at 1440, ≤1.6 at 390/768/1920 (copy reflow only) |  |

## shell

| ID | Feature | Status | Evidence | Notes |
| --- | --- | --- | --- | --- |
| SHELL-01 | Arrival loader (once per session) + fonts-settled reveal gate | done | Headless capture sequence 2026-09-16; loader frames observed in Chrome (0%→100%); is-ready gate confirmed via DOM |  |
| SHELL-02 | Fixed header, per-page theme + runtime luminance sampling, scroll-hide | done | about-navhide 0.22 / navback 0.66 state diffs; nav-on-dark→light flips observed on /about scroll |  |
| SHELL-03 | Inquire CTA: magnetic pill, radial fill, rolled label, ink splash navigation | done | cta-hover 0.00, cta-ink 0.07 state diffs |  |
| SHELL-04 | Menu overlay: clip-path open/close, row cascades, thumbnails, row→grid Flip, grid lightbox, accordion on narrow | done | menu-open 0.09, hover 0.15, grid-open 0.71, grid-closed 0.09, menu-closed 0.67 | accordion path exists (641–1024px / coarse) but was not screenshotted |
| SHELL-05 | Phone dock with lens + galleries sheet | done | 390 captures all pages ≤1.7; m-dock-sheet 0.55 |  |
| SHELL-06 | Lightbox (keyboard, swipe, counter, preload) | done | story-lightbox opened on both (reference image not loaded at 900ms — instrument) |  |
| SHELL-07 | Page-leave fade + bfcache restore | done | Ported 1:1; leave fade observed in state captures between navigations |  |
| SHELL-08 | Image fade-in on load | done | 0.6s ease transitions counted by the token extractor (102 on /about) on both |  |
| SHELL-09 | Analytics (Vercel Insights, Clarity) | omitted |  | Replaced by a local event queue (window.__ewEvents); nothing leaves the browser |
| SHELL-10 | Client portal 'Sign in' | omitted |  | Link kept, points to app.ffdev.studio placeholder; the portal is a separate system |

## stories

| ID | Feature | Status | Evidence | Notes |
| --- | --- | --- | --- | --- |
| ST-01 | Word cascades, plate reveal + parallax, entrance gate | done | stories top 0.25 / full 0.60 |  |

## story pages

| ID | Feature | Status | Evidence | Notes |
| --- | --- | --- | --- | --- |
| STY-01 | Three wedding stories: hero, chapters, pinned grid, trio, full-gallery sheet, lightbox | done | tops 0.64–1.00 at 1440; story-fullgallery 1.30; full-page deltas explained by reference lazy images |  |

