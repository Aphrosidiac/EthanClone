/**
 * Index: the four gallery rows over a cross-fading backdrop.
 *  - each row label is split into a white character layer and a red one that rolls in on hover
 *  - the rows and their numbers stagger in after the arrival loader
 *  - the backdrop cycles through the active row's image pool every 6s (a "dwell" bar under the
 *    active label shows the countdown), hover pins a row, leaving resumes the cycle
 * Ported from the reference index module.
 */
import { gsap } from 'gsap';

type PoolItem = { s: string; ss?: string };
type Pool = { list: PoolItem[]; at: number; ready: Set<number>; seen: Set<number>; bad: Set<number> };
type Row = HTMLElement & { _charTl?: gsap.core.Timeline; _intro?: gsap.core.Tween; _num?: gsap.core.Tween };

const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
const rows = [...document.querySelectorAll<Row>('[data-idx-item]')];
const frames = [...document.querySelectorAll<HTMLImageElement>('.idx-bd-frame')];
const nav = document.querySelector<HTMLElement>('[data-idx]');
const INTRO_DUR = 1.35, INTRO_STAGGER = 0.055;

if (!reduced)
  rows.forEach((row, i) => {
    const inner = row.querySelector<HTMLElement>('.idx-textinner');
    if (!inner || inner.dataset.split) return;
    inner.dataset.split = '1';
    const text = inner.textContent || '';
    inner.textContent = '';
    const wrap = document.createElement('span');
    wrap.style.display = 'block';
    wrap.style.overflow = 'hidden';
    const base = document.createElement('span');
    base.style.display = 'inline-block';
    base.style.position = 'relative';
    const fill = (parent: HTMLElement, bucket: HTMLElement[]) => {
      for (const ch of text) {
        const s = document.createElement('span');
        s.style.display = 'inline-block';
        s.style.willChange = 'transform';
        s.style.pointerEvents = 'none';
        s.textContent = ch === ' ' ? ' ' : ch;
        bucket.push(s);
        parent.appendChild(s);
      }
    };
    const white: HTMLElement[] = [];
    fill(base, white);
    const red: HTMLElement[] = [];
    const over = document.createElement('span');
    over.style.position = 'absolute';
    over.style.left = '0';
    over.style.top = '0';
    over.style.whiteSpace = 'nowrap';
    over.style.color = 'var(--red-hover)';
    over.setAttribute('aria-hidden', 'true');
    fill(over, red);
    base.appendChild(over);
    wrap.appendChild(base);
    inner.appendChild(wrap);
    gsap.set(red, { yPercent: 115 });
    row._charTl = gsap.timeline({ paused: true })
      .to(white, { duration: 0.45, ease: 'power2.in', yPercent: -115, stagger: 0.016 }, 0)
      .to(red, { duration: 0.85, ease: 'expo.out', yPercent: 0, stagger: 0.02 }, 0.12);
    const delay = 0.15 + i * 0.14;
    gsap.set(white, { yPercent: 112 });
    row._intro = gsap.to(white, { yPercent: 0, duration: INTRO_DUR, ease: 'expo.out', stagger: INTRO_STAGGER, delay, paused: true });
    const num = row.querySelector<HTMLElement>('.idx-num');
    if (num) {
      gsap.set(num, { opacity: 0, y: 14 });
      row._num = gsap.to(num, { opacity: 1, y: 0, duration: 0.8, ease: 'power2.out', delay: delay + INTRO_STAGGER * (white.length - 1) + 0.5, paused: true });
    }
  });

const CYCLE_MS = 6000;
let active = -1;
let cycleTimer: ReturnType<typeof setInterval> | null = null;
let hovering = false;
let leaveTimer: ReturnType<typeof setTimeout> | null = null;
let cyclingClass = false;
const SWAP_AFTER = 1150;
let canSwap = false;
const swapTimers: ReturnType<typeof setTimeout>[] = new Array(rows.length).fill(0);
let resizeTimer: ReturnType<typeof setTimeout> = 0 as unknown as ReturnType<typeof setTimeout>;

// Each row carries a JSON pool of backdrop candidates; shuffle once per visit.
const pools: (Pool | null)[] = rows.map((row) => {
  try {
    const list = JSON.parse(row.dataset.pool || 'null') as PoolItem[];
    if (!Array.isArray(list) || !list.length) return null;
    for (let i = list.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [list[i], list[j]] = [list[j], list[i]];
    }
    return { list, at: -1, ready: new Set(), seen: new Set(), bad: new Set() };
  } catch {
    return null;
  }
});
const warm = (pool: Pool, i: number) => {
  if (pool.seen.has(i)) return;
  pool.seen.add(i);
  const img = new Image();
  if (pool.list[i].ss) { img.sizes = '100vw'; img.srcset = pool.list[i].ss!; }
  const ok = () => pool.ready.add(i);
  img.onerror = () => pool.bad.add(i);
  img.src = pool.list[i].s;
  img.decode ? img.decode().then(ok, () => (img.complete ? ok() : (img.onload = ok))) : (img.onload = ok);
};
const warmAll = () => {
  let t = 0;
  pools.forEach((pool) => {
    pool && pool.list.forEach((_, i) => { setTimeout(() => warm(pool, i), t); t += 120; });
  });
};
// Swap the (now hidden) frame of a row to its next ready image.
const advance = (n: number) => {
  const pool = pools[n];
  if (!pool || !canSwap || n === active) return;
  let next = (pool.at + 1) % pool.list.length;
  for (let guard = pool.list.length; pool.bad.has(next) && guard > 0; guard--) next = (next + 1) % pool.list.length;
  if (pool.bad.has(next) || next === pool.at) return;
  warm(pool, next);
  if (!pool.ready.has(next)) return;
  const frame = frames[n];
  if (pool.list[next].ss) frame.srcset = pool.list[next].ss!;
  frame.src = pool.list[next].s;
  const source = frame.parentElement?.tagName === 'PICTURE' ? frame.parentElement.querySelector('source') : null;
  if (source) source.srcset = pool.list[next].ss || pool.list[next].s;
  pool.at = next;
  frame.decode && frame.decode().catch(() => {});
  warm(pool, (next + 1) % pool.list.length);
};
addEventListener('resize', () => {
  clearTimeout(resizeTimer);
  resizeTimer = setTimeout(() => {
    pools.forEach((p) => { if (p) { p.ready.clear(); p.seen = new Set(p.bad); } });
    if (canSwap) warmAll();
  }, 250);
});

const show = (n: number) => {
  const i = ((n % rows.length) + rows.length) % rows.length;
  if (active !== -1 && active !== i) {
    const prev = active;
    clearTimeout(swapTimers[prev]);
    swapTimers[prev] = setTimeout(() => advance(prev), SWAP_AFTER + 60);
  }
  clearTimeout(swapTimers[i]);
  active = i;
  frames.forEach((f, k) => (f.style.opacity = k === active ? '1' : '0'));
  rows.forEach((r, k) => r.classList.toggle('is-active', k === active));
};
const markCycling = () => {
  if (cyclingClass || !nav) return;
  cyclingClass = true;
  nav.classList.add('idx-cycling');
};
const dwells = rows.map((row) => {
  if (reduced) return null;
  const text = row.querySelector<HTMLElement>('.idx-text');
  if (!text) return null;
  const d = document.createElement('span');
  d.className = 'idx-dwell';
  text.appendChild(d);
  return d;
});
const allDwells = dwells.filter(Boolean) as HTMLElement[];
const runDwell = () => {
  const d = dwells[active];
  if (!d) return;
  gsap.killTweensOf(allDwells);
  dwells.forEach((o) => o && o !== d && gsap.set(o, { opacity: 0 }));
  gsap.set(d, { opacity: 0, scaleX: 0 });
  gsap.to(d, { opacity: 1, duration: 0.5, ease: 'power1.out' });
  gsap.to(d, { scaleX: 1, duration: CYCLE_MS / 1000, ease: 'sine.inOut' });
};
const hideDwell = () => {
  if (!allDwells.length) return;
  gsap.killTweensOf(allDwells);
  gsap.to(allDwells, { opacity: 0, duration: 0.3, ease: 'power1.out' });
};
const startCycle = () => {
  if (reduced) return;
  if (cycleTimer) clearInterval(cycleTimer);
  cycleTimer = setInterval(() => { show(active + 1); runDwell(); }, CYCLE_MS);
  runDwell();
};
const stopCycle = () => {
  if (cycleTimer) clearInterval(cycleTimer);
  cycleTimer = null;
  hideDwell();
};

if (reduced) {
  if (frames[0]) frames[0].style.opacity = '1';
} else if (rows.length && frames.length) {
  active = 0;
  (function revealFirst() {
    const f = frames[0];
    if (!f) return;
    const paint = () => requestAnimationFrame(() => { f.style.opacity = '1'; });
    if (f.complete && f.naturalWidth) f.decode ? f.decode().then(paint, paint) : paint();
    else {
      f.addEventListener('load', () => (f.decode ? f.decode().then(paint, paint) : paint()), { once: true });
      f.addEventListener('error', paint, { once: true });
      setTimeout(paint, 2500);
    }
  })();
  const storyLists = document.querySelectorAll<HTMLElement>('.idx-stories');
  if (storyLists.length) gsap.set(storyLists, { opacity: 0, y: 12 });
  // Story names must not run off the right edge: shrink the font until they fit.
  const fitStories = () => {
    document.querySelectorAll<HTMLElement>('.idx-story-name').forEach((el) => {
      el.style.fontSize = '';
      const r = el.getBoundingClientRect();
      const room = window.innerWidth - 16 - r.left;
      if (r.width > room && room > 0) {
        const fs = parseFloat(getComputedStyle(el).fontSize);
        el.style.fontSize = `${Math.max(12, fs * (room / r.width))}px`;
      }
    });
  };
  const fitWhenReady = () => (document.fonts ? document.fonts.ready : Promise.resolve()).then(fitStories);
  fitWhenReady();
  addEventListener('load', fitWhenReady);
  let fitTimer: ReturnType<typeof setTimeout>;
  addEventListener('resize', () => { clearTimeout(fitTimer); fitTimer = setTimeout(fitStories, 120); });

  let live = false;
  const goLive = () => {
    if (live) return;
    live = true;
    markCycling();
    if (!hovering) startCycle();
    canSwap = true;
    requestAnimationFrame(() => {
      frames.forEach((f) => f.decode && f.decode().catch(() => {}));
      warmAll();
    });
  };
  let introDone = false;
  const intro = () => {
    if (introDone) return;
    introDone = true;
    rows.forEach((r) => { r._intro && r._intro.play(); r._num && r._num.play(); });
    if (storyLists.length) gsap.to(storyLists, { opacity: 1, y: 0, duration: 0.9, ease: 'power2.out', delay: 1.9 });
    const first = rows[0] && rows[0]._intro;
    if (!first) { goLive(); return; }
    // Go live once the first row is ~66% through its entrance rather than waiting for the tail.
    const FRAC = 0.6644;
    const dur = first.duration();
    const threshold = dur > 0 ? Math.min(1, (Math.max(0, dur - INTRO_DUR) + FRAC * INTRO_DUR) / dur) : 1;
    first.eventCallback('onUpdate', () => { if (first.progress() >= threshold) goLive(); });
    first.eventCallback('onComplete', goLive);
    if (first.progress() >= threshold) goLive();
    setTimeout(goLive, 6000);
  };
  addEventListener('ew:loader-done', intro, { once: true });
  let polls = 0;
  const poll = () => {
    if (introDone || document.querySelector('[data-ew-loader]')) return;
    if (polls++ > 8) { intro(); return; }
    requestAnimationFrame(poll);
  };
  poll();
  rows.forEach((row, i) => {
    row.addEventListener('mouseenter', () => {
      hovering = true;
      if (leaveTimer) clearTimeout(leaveTimer);
      stopCycle();
      markCycling();
      show(i);
      if (row._charTl) {
        if (row._intro && row._intro.progress() < 1) row._intro.progress(1);
        rows.forEach((o) => o !== row && o._charTl && o._charTl.timeScale(2.2).reverse());
        row._charTl.timeScale(1).play();
      }
    });
    row.addEventListener('mouseleave', () => {
      if (leaveTimer) clearTimeout(leaveTimer);
      row._charTl && row._charTl.timeScale(1.3).reverse();
      leaveTimer = setTimeout(() => { hovering = false; startCycle(); }, 220);
    });
  });
  addEventListener('ew:menu', (e: Event) => {
    const d = (e as CustomEvent).detail;
    if (d && d.open) { stopCycle(); rows.forEach((r) => r._charTl && r._charTl.timeScale(2.2).reverse()); }
    else if (!hovering) startCycle();
  });
  addEventListener('pageshow', (e) => {
    if (!e.persisted) return;
    hovering = false;
    if (leaveTimer) clearTimeout(leaveTimer);
    rows.forEach((r) => { if (r._charTl && r._charTl.totalTime() > 0) r._charTl.pause(0); });
    if (cyclingClass) startCycle();
  });
}
