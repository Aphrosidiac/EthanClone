// states.mjs — screenshot interaction states (menu, hovers, grids, previews, dock sheet, nav hide…)
//   node tools/states.mjs <baseUrl> <outDir> [scenario,scenario]
import { chromium } from 'playwright';
import fs from 'node:fs';
const [,, base = 'https://ethanwong.photography', out = 'docs/reference/2026-09-16/states', only] = process.argv;
fs.mkdirSync(out, { recursive: true });
const browser = await chromium.launch({ executablePath: '/Users/fakhrul/Library/Caches/ms-playwright/chromium_headless_shell-1243/chrome-headless-shell-mac-arm64/chrome-headless-shell' });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const seed = () => { let s = 1234567; Math.random = () => { s = (s * 16807) % 2147483647; return (s - 1) / 2147483646; }; try { sessionStorage.setItem('ew:intro', '1'); } catch {} };
const settle = (page) => page.waitForFunction(() => document.body.classList.contains('is-ready') && !document.querySelector('[data-ew-loader]'), null, { timeout: 15000 }).catch(() => {});
const scenarios = {
  async 'index-hover'(page) { await page.goto(base + '/'); await settle(page); await sleep(3000); await page.mouse.move(700, 470); await sleep(1400); await page.screenshot({ path: `${out}/index-hover-row3.png` }); },
  async 'menu'(page) {
    await page.goto(base + '/about'); await settle(page); await sleep(2500);
    await page.click('#menuOpen'); await sleep(1600); await page.screenshot({ path: `${out}/menu-open.png` });
    const row = await page.$('[data-mrow][data-key="engagements"]'); const bb = await row.boundingBox();
    await page.mouse.move(bb.x + 200, bb.y + bb.height / 2); await sleep(1300); await page.screenshot({ path: `${out}/menu-hover-engagements.png` });
    await page.mouse.move(bb.x + bb.width - 120, bb.y + bb.height / 2); await sleep(600); await page.screenshot({ path: `${out}/menu-hover-imgs.png` });
    await page.mouse.click(bb.x + bb.width - 120, bb.y + bb.height / 2); await sleep(2200); await page.screenshot({ path: `${out}/menu-grid-open.png` });
    await page.click('[data-mclose]'); await sleep(2000); await page.screenshot({ path: `${out}/menu-grid-closed.png` });
    await page.click('#menuClose'); await sleep(900); await page.screenshot({ path: `${out}/menu-closed.png` });
  },
  async 'navhide'(page) { await page.goto(base + '/about'); await settle(page); await sleep(2000); await page.mouse.move(700, 500); await page.mouse.wheel(0, 900); await sleep(1500); await page.screenshot({ path: `${out}/about-navhide.png` }); await page.mouse.wheel(0, -300); await sleep(1500); await page.screenshot({ path: `${out}/about-navback.png` }); },
  async 'cta'(page) { await page.goto(base + '/about'); await settle(page); await sleep(2000); const b = await (await page.$('header .nav-cta')).boundingBox(); await page.mouse.move(b.x + 10, b.y + 10); await sleep(700); await page.screenshot({ path: `${out}/cta-hover.png`, clip: { x: b.x - 60, y: 0, width: 220, height: 80 } }); await page.mouse.click(b.x + b.width / 2, b.y + b.height / 2); await sleep(450); await page.screenshot({ path: `${out}/cta-ink.png` }); },
  async 'editorials'(page) { await page.goto(base + '/editorials'); await settle(page); await sleep(2500); await page.mouse.move(700, 500); await page.mouse.wheel(0, 1400); await sleep(2500); await page.screenshot({ path: `${out}/editorials-scene.png` }); const t = await page.$('.scene:not([data-href]) .scene__title'); await t.scrollIntoViewIfNeeded(); await sleep(1500); await t.click(); await sleep(2000); await page.screenshot({ path: `${out}/editorials-opening.png` }); await sleep(4000); await page.screenshot({ path: `${out}/editorials-preview.png` }); },
  async 'story-gallery'(page) { await page.goto(base + '/weddings/shawni-ben'); await settle(page); await sleep(2500); await page.evaluate(() => document.querySelector('[data-fullgallery]').scrollIntoView()); await sleep(1200); await page.click('[data-fullgallery]'); await sleep(2000); await page.screenshot({ path: `${out}/story-fullgallery.png` }); await page.click('.fg-cell'); await sleep(900); await page.screenshot({ path: `${out}/story-lightbox.png` }); },
  async 'gallery-scroll'(page) { await page.goto(base + '/weddings'); await settle(page); await sleep(2500); await page.mouse.move(700, 500); for (let i = 0; i < 6; i++) { await page.mouse.wheel(0, 700); await sleep(500); } await sleep(1500); await page.screenshot({ path: `${out}/weddings-mid.png` }); },
  async 'pricing'(page) { await page.goto(base + '/pricing'); await settle(page); await sleep(2500); await page.screenshot({ path: `${out}/pricing-top.png` }); await page.mouse.move(700, 500); await page.mouse.wheel(0, 900); await sleep(1500); await page.screenshot({ path: `${out}/pricing-calc.png` }); },
  async 'dock'(page) { await page.goto(base + '/about'); await settle(page); await sleep(2500); await page.tap('[data-dock-galleries]'); await sleep(1200); await page.screenshot({ path: `${out}/m-dock-sheet.png` }); },
  async 'm-menu'(page) { await page.goto(base + '/about'); await settle(page); await sleep(2500); await page.tap('#menuOpen'); await sleep(1600); await page.screenshot({ path: `${out}/m-menu-open.png` }); await page.tap('[data-mplus]'); await sleep(900); await page.screenshot({ path: `${out}/m-menu-acc.png` }); },
  async 'about-peek'(page) { await page.goto(base + '/about'); await settle(page); await sleep(2000); await page.evaluate(() => document.querySelector('[data-peek]').scrollIntoView({ block: 'center' })); await sleep(1500); await page.click('[data-peek]'); await sleep(1200); await page.screenshot({ path: `${out}/about-peek-open.png` }); await page.click('.ab-early-cell'); await sleep(1500); await page.screenshot({ path: `${out}/about-peek-lightbox.png` }); },
  async 'stories-hover'(page) { await page.goto(base + '/stories'); await settle(page); await sleep(2500); const el = await page.$('[data-cascade]'); const b = await el.boundingBox(); await page.mouse.move(b.x + b.width / 2, b.y + b.height / 2); await sleep(1300); await page.screenshot({ path: `${out}/stories-hover.png` }); },
  async 'editorials-close'(page) { await page.goto(base + '/editorials'); await settle(page); await sleep(2500); await page.mouse.move(700, 500); await page.mouse.wheel(0, 1400); await sleep(2500); const t = await page.$('.scene:not([data-href]) .scene__title'); await t.scrollIntoViewIfNeeded(); await sleep(1500); await t.click(); await sleep(6500); await page.keyboard.press('Escape'); await sleep(1200); await page.screenshot({ path: `${out}/editorials-closing.png` }); await sleep(2500); await page.screenshot({ path: `${out}/editorials-closed.png` }); },
  async 'menu-lightbox'(page) { await page.goto(base + '/about'); await settle(page); await sleep(2500); await page.click('#menuOpen'); await sleep(1600); const row = await page.$('[data-mrow][data-key="weddings"]'); const bb = await row.boundingBox(); await page.mouse.move(bb.x + 200, bb.y + bb.height / 2); await sleep(900); await page.mouse.click(bb.x + bb.width - 120, bb.y + bb.height / 2); await sleep(2500); await page.click('[data-mgrid="weddings"] .mcell'); await sleep(2500); await page.screenshot({ path: `${out}/menu-lightbox.png` }); await page.keyboard.press('ArrowRight'); await sleep(1500); await page.screenshot({ path: `${out}/menu-lightbox-next.png` }); },
  async 'pricing-tip'(page) { await page.goto(base + '/pricing'); await settle(page); await sleep(2500); await page.evaluate(() => document.querySelector('#price-widget-container').scrollIntoView()); await sleep(800); await page.hover('#rateInfoIcon'); await sleep(600); await page.screenshot({ path: `${out}/pricing-tooltip.png` }); await page.selectOption('#shootType', 'wedding'); await sleep(800); await page.screenshot({ path: `${out}/pricing-wedding-fields.png` }); },
  async 't-menu'(page) { await page.goto(base + '/about'); await settle(page); await sleep(2500); await page.click('#menuOpen'); await sleep(1600); await page.screenshot({ path: `${out}/t-menu-open.png` }); await page.click('[data-mrow][data-key="engagements"] [data-mplus]'); await sleep(1000); await page.screenshot({ path: `${out}/t-menu-acc.png` }); await page.click('[data-mrow][data-key="engagements"] [data-macc-view]'); await sleep(2500); await page.screenshot({ path: `${out}/t-menu-grid.png` }); },
  async 'm-story'(page) { await page.goto(base + '/weddings/shawni-ben'); await settle(page); await sleep(2500); await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight * 0.4)); await sleep(2000); await page.screenshot({ path: `${out}/m-story-chip.png` }); await page.tap('.chap-chip'); await sleep(1200); await page.screenshot({ path: `${out}/m-story-sheet.png` }); },
  async 'm-index'(page) { await page.goto(base + '/'); await settle(page); await sleep(3500); await page.screenshot({ path: `${out}/m-index.png` }); await page.tap('[data-tab="pricing"]'); await sleep(200); await page.screenshot({ path: `${out}/m-dock-lens.png` }); },
};
const mobileSet = new Set(['dock', 'm-menu', 'm-story', 'm-index']);
const tabletSet = new Set(['t-menu']);
const list = only ? only.split(',') : Object.keys(scenarios);
for (const name of list) {
  const mobile = mobileSet.has(name);
  const tablet = tabletSet.has(name);
  const ctx = await browser.newContext({ viewport: mobile ? { width: 390, height: 844 } : tablet ? { width: 1024, height: 768 } : { width: 1440, height: 900 }, deviceScaleFactor: 1, isMobile: mobile, hasTouch: mobile, reducedMotion: 'no-preference' });
  await ctx.addInitScript(seed);
  const page = await ctx.newPage();
  try { await scenarios[name](page); console.log('ok', name); } catch (e) { console.log('FAIL', name, e.message.split('\n')[0]); }
  await ctx.close();
}
await browser.close();
