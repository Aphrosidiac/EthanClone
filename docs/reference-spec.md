# Reference spec — ethanwong.photography → FF Frames

Provenance markers: `[measured]` extracted from the page/bundle · `[observed]` seen in the browser ·
`[inferred]` reasoned from the public surface.

## 1. Snapshot

- URL https://ethanwong.photography/, crawled 2026-09-16 (sitemap `lastmod` 2026-09-15). Desktop
  1440×900 and phone 390×844 (touch/mobile UA), plus 768 and 1920 for layout checks. No A/B variant seen;
  the HTML is fully static (Astro build, Vercel, `/_astro/*` hashed bundles). `[measured]`
- Everything on disk under `docs/reference/2026-09-16/`: `raw/` (24 pages + the portal embed), `astro/` +
  `pretty/` (CSS/JS bundles, prettified), `fonts/`, `images-manifest.tsv` (3,648 renditions ≤2560w
  mirrored to `public/img`), `shots/` + `states/` (screenshots), `tokens/` (extractor JSON).

## 2. Sitemap `[measured]`

| Route | Template | Notes |
|---|---|---|
| `/` | index | four gallery rows over a cycling backdrop |
| `/about` | about | hero, 8 story blocks, travel rows, "early stuff" peek |
| `/weddings` `/engagements` `/commercial` | gallery | shared script; commercial adds a click-to-lightbox tile grid |
| `/editorials` | editorials | 3D carousels + preview grids |
| `/editorials/exchange` | exchange | three-column wall, counter column scrolls against |
| `/stories` | stories | story index with plates |
| `/weddings/{shawni-ben,abigail-mate,reanna-hawkeye}` | story | chapters, pinned grid, full-gallery sheet |
| `/pricing` | pricing | instant-estimate calculator |
| `/contact` | contact | framed inquiry form + client marquee |
| `/privacy` `/terms` | legal | no menu overlay, `data-cursor="none"` |
| 8 × `/…-photographer-…` | svc | SEO landing pages, one template |
| `/404` | notfound | noindex |

## 3. Shell anatomy `[measured]`

- `header.site` fixed, 74px, 3-column grid (1fr auto 1fr), `nav-on-dark|light` chosen at build time per page
  and then re-sampled at runtime by luminance of what sits under the bar (three points at y=37, thresholds
  <118 dark / >150 light). Scroll-down hides it after 14px of accumulated travel below y=120, 8px up shows it.
- Menu overlay (`.mo`, z 100) inside `.page-shell`; rows split into per-character white/red layers; each live
  row carries five thumbnails that Flip into the full grid (`.mprev`) behind a cream cover that grows from
  the row. Present on every page except legal/404.
- Phone dock (`.dock`, ≤640px or coarse+short) with a sliding lens and a galleries sheet; rises after the
  loader (`dock-in`).
- Arrival loader once per session (`sessionStorage ew:intro`): 0→100% over 1700ms cubic-out, 240ms hold,
  600ms fade, then `ew:loader-done`. Body hidden (`html.js body:not(.is-ready)`) until fonts settle or 700ms.
- Internal links fade the shell 300ms (`is-leaving`) before a hard navigation. No client router.

## 4. Component inventory `[measured]`

Nav CTA pill (magnetic ×0.34/×0.42, radial fill from the cursor, rolled label, full-screen ink on click
that navigates after 600ms); menu row (hover cascade, thumbnails, "+" accordion on narrow); dock tab/lens;
lightbox (`window.EWLightbox`, keyboard + swipe, 22px slide); close-rows (character cascade); chapter rail +
chip + sheet; review rotator (8s bar); scroll-down cues; story full-gallery sheet; editorials preview grid;
pricing calculator (vendored); inquiry cards (portal markup). States covered in `docs/qa/states`.

## 5. Design tokens `[measured]` — identical on ours (token diff clean on 4 pages)

```css
:root{--red:#9b1120;--red-hover:#b3162a;--red-lift:#ab182c;--red-lift-hover:#c01f34;--red-deep:#8a0f1e;
 --lab-nav:13px;--lab:12px;--lab-sm:11px;--lab-dock:9.5px;--lab-quiet:10px;--lab-w:400;--lab-w-nav:300;
 --lab-w-dock:500;--head-band:74px;--foot-band:58px}
/* surfaces */ page #efede7 · dark #0e0e0e / #1c1813 · cream text #f4efe4 · ink #1c1813 · muted #9a8f7c, #8a8174, #6a6154
/* type */ display: goldenbook 300 uppercase (Italiana, Cormorant fallbacks) · labels: Hanken Grotesk 300/400, 0.12–0.22em tracking, 10–13px
          · prose: Cormorant 300 italic · wordmark: Pinyon Script 29px + red dot (max(3px,.115em))
/* motion */ 0.6s ease image reveal · 0.3s ease shell fade · 0.62s cubic-bezier(.16,1,.3,1) nav slide · 0.35s pill
/* shape */ pill CTA, 2px login underline, 10px thumbnails, 13px dock thumbs, 30px sheet
/* breakpoints */ 300 340 420 480 520 560 600 640/641 680 699/700 720 760 820 860/861 880 1024
```

Fonts: goldenbook 300/400/600/700 and orpheuspro 400 (Typekit, self-hosted copies in `public/fonts`);
Cormorant, Pinyon Script, Italiana, Hanken Grotesk Variable (the reference's own `/_astro` files, mirrored).

## 6. Motion spec `[measured]` (numbers are the ported ones; see `src/scripts`)

- Index: row labels rise `yPercent 112→0`, 1.35s expo.out, 0.055 char stagger, row delay 0.15+0.14i;
  numbers fade 0.8s after; hover cascade white out 0.45s power2.in / red in 0.85s expo.out; backdrop cycles
  every 6s with a dwell bar, swaps the hidden frame 1150ms after leaving it; pools shuffled per visit.
- Galleries: Lenis lerp 0.08 wheel ×1.4 (about: 0.09/×0.85); hero 1.4s fade+scale from 1.04, cascade 1.3s
  expo.out 0.05 stagger, rises 1.1s stagger 0.14; `[data-rise]` 48px/1s at "top 90%"; `[data-para]` ±6%;
  `[data-drift]` ±44px alternating; hero yPercent 10 scrub; pinned grid: columns fly in ± (vh − (vh − gridH)/2),
  stagger 0.06, then scale 2.05 (3 narrow) with side columns ±40% and the middle column split ±40px (90).
- Editorials: carousel ring radius `data-radius`×(cardW/350), rotationY 0→−180 over the scene, cards
  brightness 250%→80%; preview open: chars out, carousel to rotationX 90 / z −2000·s then z 1500 rotZ 270
  over 2.5s power3.inOut, grid items fly from z −3500 ordered by distance from centre (0.025s steps).
- Story pages: same grid choreography, trio columns ±1.15vh scrub, full gallery fade 0.4s + 24-cell stagger 0.022.
- Menu: moIn 0.75s clip-path inset(49.9% 0) → 0; rows `miUp` 0.9s; grid open cover 0.9s power4.inOut;
  Flip 0.9s stagger 0.04; close 0.5s defaults with cover collapsing to the row's middle.
- Reduced motion honoured everywhere (`prefers-reduced-motion: reduce` skips loader, cascades, Lenis).

## 7. Content model `[measured]`

Galleries are static image sets (`data-pool` JSON on the index, `.mcell[data-full]` in the menu grids,
`.fg-cell` on stories). Stories: title, date, venue, chapters (`[data-chap-rail]` anchors), frames. No CMS,
no pagination. Pricing: rates and rules live in the calculator module (weekend/holiday/peak multipliers,
guest-count tiers, studio and bundle add-ons, travel by routing distance, weather note by date).

## 8. Responsive `[measured]`

≤640px (or coarse+≤520px tall): menu button and CTA hidden, dock shown, foot band 107px; ≤699px hides the
header About/Pricing links; ≤860px hides row thumbnails and the custom cursor; ≤1024px or coarse: "+"
accordion in menu rows; index story names shrink to fit the right edge; about switches to a word-by-word
body reveal on narrow/coarse.

## 9. SEO & social `[measured]`

Per-page title/description/canonical/OG/Twitter, LocalBusiness + WebSite JSON-LD on every page, image
sitemap, robots.txt, `llms.txt`. Ours: same shape from `Base.astro` with FF identity; 404 `noindex`.

## 10. Performance `[measured]`

Static HTML, ~120–270KB per page (the menu grids are inlined). Images from Cloudflare Images with 1280/
1920/2560/3840 srcsets (we mirror ≤2560). Fonts preloaded (`goldenbook.woff`), `font-display: block` on the
display face. LCP = the index backdrop `fetchpriority=high`.

## 11. Accessibility `[observed]`

`.sr` headings on every page, dialog semantics on the menu and sheets, `inert` on collapsed cards,
keyboard lightbox, Escape closes everything in the right order (lightbox > preview > menu). Reduced motion
respected. The custom cursor markup is absent so `data-cursor` is inert (kept for parity).

## 12. Provenance — what ships as theirs (local test build)

| Item | Status |
|---|---|
| Photography (3,648 renditions), portal form markup + CSS | **theirs**, mirrored for the local test; to be replaced before any public deploy |
| Stylesheets | theirs verbatim (class names 1:1) — the measurement baseline |
| Fonts | theirs (Typekit + Google faces), self-hosted |
| Copy | theirs with names swapped (Ethan W → FF Dev, Ethan Wong → FF, domain/email/instagram → ffdev.studio) |
| Wordmark, favicons, touch icon, OG image | **ours** (generated) |
| Behaviour | re-implemented in TS from the compiled modules; the pricing calculator is vendored prettified |
| Analytics, portal endpoints | removed; local event queue; inquiry form runs on our origin and sends nothing |
