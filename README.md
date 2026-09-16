# FF Frames

A 1:1 recreation of ethanwong.photography under the FF / FF Dev Studio mark, published as a **demo recreation** (every page carries the disclaimer: Ethan Wong Photography's work, assets not ours, not affiliated, not a live site). Live at https://ff-frames.pages.dev.
The photography, the stylesheets and the copy (names swapped) are the reference's; the wordmark, icons,
OG image and the behaviour code are ours. Nothing here is a live studio site and it must not be presented as one.

```bash
npm install
npm run dev      # http://localhost:3160
npm run build    # static site in dist/
npm run deploy   # direct upload to Cloudflare Pages (ff-frames); pushing to GitHub deploys nothing
```

## Layout

- `src/layouts/Base.astro` — head, header, menu overlay, dock, shell script. Brand lives in `src/lib/site.ts`.
- `src/fragments/*.html` — page bodies generated from the captured reference pages by
  `tools/convert_pages.py` (image URLs → `/img/…`, identity swap). Regenerate, don't hand-edit twice.
- `src/styles/` — the reference stylesheets verbatim (`base.css` global, `pages/*.css` per template,
  `embed.css` for the framed inquiry form). Keep them verbatim: they are the measurement baseline.
- `src/scripts/` — behaviour ported from the reference's compiled modules: `shell.ts`, `dock.ts`,
  `lib/` (glide, close-cascade, chap-rail, reveal-gate), `pages/*`, `inquire-embed.ts`, and the
  vendored `vendor/pricing-calculator.js`.
- `public/img` — 3,648 mirrored renditions (≤2560w, ~950 MB, git-ignored). Re-fetch with
  `python3 tools/fetch_images.py docs/reference/2026-09-16/img-urls.txt 2560`.

## Verifying against the reference

```bash
node tools/capture.mjs https://ethanwong.photography docs/reference/2026-09-16/shots 1440x900
node tools/capture.mjs http://localhost:3160 docs/qa/shots 1440x900
python3 tools/diff.py docs/reference/2026-09-16/shots docs/qa/shots 1440
node tools/states.mjs http://localhost:3160 docs/qa/states      # interaction states
node tools/calc.mjs http://localhost:3160 docs/qa/states/pricing-filled.png
```

Results and the parity ledger: `docs/qa-log.md`, `docs/parity.md`.
