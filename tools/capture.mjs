// capture.mjs — screenshot a site (reference or ours) page by page at a fixed viewport, after the
// arrival loader has left and every scroll-driven reveal has been driven.
//   node tools/capture.mjs <baseUrl> <outDir> [WxH] [path,path,...]
// Math.random is seeded so the index's shuffled backdrop pool matches between runs.
import { chromium } from 'playwright';
import fs from 'node:fs';
const [,, base = 'https://ethanwong.photography', out = 'docs/reference/2026-09-16/shots', size = '1440x900', pathsArg] = process.argv;
const paths = pathsArg ? pathsArg.split(',') : ['/', '/about', '/weddings', '/engagements', '/commercial', '/editorials', '/editorials/exchange', '/stories', '/weddings/shawni-ben', '/weddings/abigail-mate', '/weddings/reanna-hawkeye', '/pricing', '/contact', '/privacy', '/terms', '/404', '/film-wedding-photographer-dc', '/commercial-photographer-dc'];
const [w, h] = size.split('x').map(Number);
fs.mkdirSync(out, { recursive: true });
const browser = await chromium.launch({ executablePath: '/Users/fakhrul/Library/Caches/ms-playwright/chromium_headless_shell-1243/chrome-headless-shell-mac-arm64/chrome-headless-shell' });
const mobile = w < 700;
const ctx = await browser.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: 1, reducedMotion: 'no-preference', isMobile: mobile, hasTouch: mobile, ...(mobile ? { userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1' } : {}) });
await ctx.addInitScript(() => {
  let s = 1234567; Math.random = () => { s = (s * 16807) % 2147483647; return (s - 1) / 2147483646; };
  try { sessionStorage.setItem('ew:intro', '1'); } catch {}
});
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const page = await ctx.newPage();
const slug = (p) => (p === '/' ? 'index' : p.replace(/^\//, '').replace(/\//g, '_'));
for (const p of paths) {
  try {
    await page.goto(base + p, { waitUntil: 'load', timeout: 60000 });
  } catch (e) { console.log('goto failed', p, e.message); continue; }
  try {
  await page.waitForFunction(() => document.body.classList.contains('is-ready') && !document.querySelector('[data-ew-loader]'), null, { timeout: 15000 }).catch(() => {});
  await sleep(3200);
  await page.screenshot({ path: `${out}/${slug(p)}-top-${w}.png` });
  // drive scroll-triggered reveals, then return to the top for the full-page capture
  const total = await page.evaluate(() => document.documentElement.scrollHeight);
  for (let y = 0; y < total; y += Math.round(h * 0.6)) { await page.evaluate((yy) => window.scrollTo(0, yy), y); await sleep(160); }
  await sleep(800);
  await page.evaluate(() => window.scrollTo(0, 0));
  await sleep(900);
  await page.screenshot({ path: `${out}/${slug(p)}-full-${w}.png`, fullPage: true }).catch((e) => console.log('full failed', p, e.message));
  console.log('captured', p, total);
  } catch (e) { console.log('capture failed', p, e.message); }
}
await browser.close();
