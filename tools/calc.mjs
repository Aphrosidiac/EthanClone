// calc.mjs — drive the pricing calculator with fixed inputs on a site and print the quotes.
//   node tools/calc.mjs <baseUrl> <screenshotPath>
import { chromium } from 'playwright';
const [,, base, out] = process.argv;
const browser = await chromium.launch({ executablePath: '/Users/fakhrul/Library/Caches/ms-playwright/chromium_headless_shell-1243/chrome-headless-shell-mac-arm64/chrome-headless-shell' });
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 });
await ctx.addInitScript(() => { try { sessionStorage.setItem('ew:intro', '1'); } catch {} });
const page = await ctx.newPage();
page.setDefaultTimeout(8000);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
await page.goto(base + '/pricing', { waitUntil: 'domcontentloaded', timeout: 60000 });
await sleep(3000);
const set = (sel, v) => page.evaluate(([s, val]) => { const el = document.querySelector(s); if (!el) return 'missing'; el.value = val; el.dispatchEvent(new Event('input', { bubbles: true })); el.dispatchEvent(new Event('change', { bubbles: true })); return 'ok'; }, [sel, v]);
const read = () => page.evaluate(() => ({ price: document.querySelector('#price-display')?.textContent.trim(), note: document.querySelector('#priceNote')?.textContent.trim().slice(0, 80), starts: document.querySelector('#price-starts')?.textContent.trim().slice(0, 60) }));
const results = [];
for (const [type, extra] of [['wedding', { '#guestCount': 'medium', '#duration': '8' }], ['elopement', { '#duration': '3' }], ['engagement', { '#duration': '2' }], ['family', { '#duration': '1.5' }], ['headshot', { '#duration': '2' }], ['events', { '#eventTypeSelect': 'corporate', '#eventDurationInput': '4' }]]) {
  await set('#shootType', type); await sleep(300);
  await set('#shootDate', '2027-05-15'); await sleep(300);
  for (const [s, v] of Object.entries(extra)) { await set(s, v); await sleep(200); }
  await sleep(1200);
  results.push({ type, ...(await read()) });
}
console.log(JSON.stringify(results, null, 1));
await set('#shootType', 'wedding'); await set('#shootDate', '2027-05-15'); await set('#guestCount', 'medium'); await set('#duration', '8'); await sleep(1500);
await page.evaluate(() => document.querySelector('#price-widget-container').scrollIntoView());
await sleep(800);
await page.screenshot({ path: out });
await browser.close();
