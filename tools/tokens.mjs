// tokens.mjs — run the reference-clone token extractor on a set of pages and save the JSON.
//   node tools/tokens.mjs <baseUrl> <outDir> [WxH]
import { chromium } from 'playwright';
import fs from 'node:fs';
const [,, base, out, size = '1440x900'] = process.argv;
const [w, h] = size.split('x').map(Number);
fs.mkdirSync(out, { recursive: true });
const script = fs.readFileSync('/Users/fakhrul/.claude/skills/reference-clone/scripts/extract_tokens.js', 'utf8');
const browser = await chromium.launch({ executablePath: '/Users/fakhrul/Library/Caches/ms-playwright/chromium_headless_shell-1243/chrome-headless-shell-mac-arm64/chrome-headless-shell' });
const ctx = await browser.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: 1, isMobile: w < 700, hasTouch: w < 700 });
await ctx.addInitScript(() => { try { sessionStorage.setItem('ew:intro', '1'); } catch {} });
const page = await ctx.newPage();
for (const p of ['/', '/about', '/weddings', '/pricing']) {
  await page.goto(base + p, { waitUntil: 'load', timeout: 60000 });
  await new Promise((r) => setTimeout(r, 3000));
  const res = await page.evaluate(script);
  const slug = p === '/' ? 'index' : p.slice(1);
  fs.writeFileSync(`${out}/${slug}-${w}.json`, JSON.stringify(res, null, 1));
  console.log(slug, w, 'type scale', res.typeScale?.length, 'colors', res.colors?.length, 'suspect', res.meta?.viewportSuspect);
}
await browser.close();
