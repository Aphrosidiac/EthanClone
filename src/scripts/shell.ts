/**
 * Site shell — runs on every page.
 *
 * Ported behaviour-for-behaviour from the reference's Base.astro module: arrival loader,
 * fonts-settled reveal gate, fade-out on internal navigation, scroll-direction nav hide,
 * luminance-sampled nav theme, image fade-in, the (dormant) custom cursor, the lightbox,
 * the full-screen menu overlay with its row-to-grid Flip choreography, the Inquire CTA ink
 * splash, wordmark alignment for the story sub-lists, and the analytics shim.
 */
import { gsap } from 'gsap';
import { Flip } from 'gsap/Flip';

gsap.registerPlugin(Flip);

const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
const coarse = matchMedia('(pointer: coarse)').matches;

/* ---------------------------------------------------------------- navigation fade */
function wireLeaveFade() {
  document.addEventListener(
    'click',
    (e) => {
      const t = e.target as HTMLElement;
      const a = t.closest && (t.closest('a[href]') as HTMLAnchorElement | null);
      if (!a || e.metaKey || e.ctrlKey || e.shiftKey || a.target === '_blank' || a.hasAttribute('data-cta-ink')) return;
      const href = a.getAttribute('href');
      if (!href || !href.startsWith('/') || href.startsWith('//')) return;
      if (new URL(href, location.origin).pathname === location.pathname) {
        e.preventDefault();
        return;
      }
      e.preventDefault();
      document.body.classList.add('is-leaving');
      setTimeout(() => { window.location.href = href; }, 300);
    },
    true,
  );
  addEventListener('pageshow', (e) => {
    if (e.persisted) {
      document.body.classList.remove('is-leaving');
      document.body.classList.add('is-ready');
    }
  });
}

/* ---------------------------------------------------------------- arrival gate */
function wireReadyGate() {
  const ready = () => document.body.classList.add('is-ready');
  if (!document.documentElement.classList.contains('js')) { ready(); return; }
  Promise.race([
    document.fonts ? document.fonts.ready : Promise.resolve(),
    new Promise((r) => setTimeout(r, 700)),
  ]).then(ready);
}

const leaveTo = (href: string) => {
  document.body.classList.add('is-leaving');
  setTimeout(() => { window.location.href = href; }, 300);
};

/* ---------------------------------------------------------------- arrival loader (once per session) */
function wireLoader() {
  if (!document.documentElement.classList.contains('js') || reduced || sessionStorage.getItem('ew:intro')) return;
  sessionStorage.setItem('ew:intro', '1');
  const veil = document.createElement('div');
  veil.setAttribute('data-ew-loader', '');
  veil.style.cssText =
    'position:fixed;inset:0;z-index:9999;background:#0e0e0e;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:18px;opacity:1;transition:opacity 0.6s ease;';
  const pct = document.createElement('span');
  pct.style.cssText =
    "font-family:'Hanken Grotesk','Hanken Grotesk Variable',sans-serif;font-weight:600;letter-spacing:0.22em;text-transform:uppercase;font-size:11px;color:#f4efe4;font-variant-numeric:tabular-nums;";
  pct.textContent = '0%';
  const track = document.createElement('div');
  track.style.cssText = 'width:min(200px,44vw);height:1px;background:rgba(244,239,228,0.14);overflow:hidden;';
  const bar = document.createElement('div');
  bar.style.cssText = 'height:100%;width:0;background:#f4efe4;';
  track.appendChild(bar);
  veil.appendChild(pct);
  veil.appendChild(track);
  document.body.appendChild(veil);

  const DUR = 1700;
  const ease = (t: number) => 1 - Math.pow(1 - t, 3);
  let start: number | null = null;
  const tick = (now: number) => {
    if (start === null) start = now;
    const t = Math.min(1, (now - start) / DUR);
    const v = ease(t);
    pct.textContent = Math.round(v * 100) + '%';
    bar.style.width = (v * 100).toFixed(2) + '%';
    if (t < 1) requestAnimationFrame(tick);
    else
      setTimeout(() => {
        veil.style.opacity = '0';
        setTimeout(() => {
          veil.remove();
          dispatchEvent(new CustomEvent('ew:loader-done'));
        }, 600);
      }, 240);
  };
  requestAnimationFrame(tick);
}

/* ---------------------------------------------------------------- nav hide on scroll-down */
function wireNavHide() {
  const navs = document.querySelectorAll<HTMLElement>('[data-nav]');
  if (!navs.length) return;
  const HIDE_AFTER = 14, TOP_ZONE = 120;
  let lastY = window.scrollY, hidden = false, acc = 0, ticking = false;
  const setHidden = (v: boolean) => {
    if (v === hidden) return;
    hidden = v;
    navs.forEach((n) => n.classList.toggle('nav-hide', v));
  };
  const update = () => {
    ticking = false;
    const y = window.scrollY, dy = y - lastY;
    lastY = y;
    if (!dy) return;
    if (y <= TOP_ZONE) { acc = 0; setHidden(false); return; }
    if (dy > 0 !== acc > 0) acc = 0;
    acc += dy;
    if (acc > HIDE_AFTER) setHidden(true);
    else if (acc < -8) setHidden(false);
  };
  addEventListener('scroll', () => { if (!ticking) { ticking = true; requestAnimationFrame(update); } }, { passive: true });
}

/* ---------------------------------------------------------------- nav theme: sample what sits under the header */
function wireNavTheme() {
  const header = document.querySelector<HTMLElement>('header.site');
  if (!header) return;
  const scrims = [...document.querySelectorAll<HTMLElement>('.nav-scrim')];
  const targets = [header, ...scrims];
  const lumaCache = new Map<string, number | null | 'pending'>();

  const rgbLuma = (s: string | null) => {
    const m = s && s.match(/rgba?\(([^)]+)\)/);
    if (!m) return null;
    const c = m[1].split(',').map((v) => parseFloat(v));
    return c.length >= 4 && c[3] === 0 ? null : 0.299 * c[0] + 0.587 * c[1] + 0.114 * c[2];
  };

  // Average luminance of the top 74px band of an image as it is laid out (object-fit cover).
  const imageLuma = (src: string, el: HTMLElement | null) => {
    if (lumaCache.has(src)) return lumaCache.get(src)!;
    lumaCache.set(src, 'pending');
    const rect = el && el.getBoundingClientRect ? el.getBoundingClientRect() : null;
    const posY = (() => {
      if (!el) return 0;
      const parts = getComputedStyle(el).backgroundPosition.split(',')[0].trim().split(/\s+/);
      const y = parts.length > 1 ? parts[1] : parts[0];
      if (!y || y.includes('px')) return el.tagName === 'IMG' ? 0.5 : 0;
      const n = parseFloat(y);
      return isNaN(n) ? 0 : Math.max(0, Math.min(1, n / 100));
    })();
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      try {
        const w = img.naturalWidth || 48, h = img.naturalHeight || 48;
        let y0 = 0, y1 = Math.max(1, Math.round(h * 0.28));
        if (rect && rect.width && rect.height) {
          const scale = Math.max(rect.width / w, rect.height / h);
          const off = (rect.height - h * scale) * posY;
          const band = Math.min(74, rect.height);
          let a = (0 - off) / scale, b = (band - off) / scale;
          a = Math.max(0, Math.min(h, a));
          b = Math.max(0, Math.min(h, b));
          if (b - a >= 1) { y0 = a; y1 = b; }
        }
        const cw = Math.min(64, w);
        const ch = Math.max(1, Math.round((cw * (y1 - y0)) / w));
        const cv = document.createElement('canvas');
        cv.width = cw; cv.height = ch;
        const ctx = cv.getContext('2d')!;
        ctx.drawImage(img, 0, y0, w, y1 - y0, 0, 0, cw, ch);
        const d = ctx.getImageData(0, 0, cw, ch).data;
        let sum = 0, n = 0;
        for (let i = 0; i < d.length; i += 4) { sum += 0.299 * d[i] + 0.587 * d[i + 1] + 0.114 * d[i + 2]; n++; }
        lumaCache.set(src, sum / n);
      } catch {
        lumaCache.set(src, null);
      }
      sample();
    };
    img.onerror = () => { lumaCache.set(src, null); };
    img.src = src;
    return 'pending' as const;
  };

  const bgUrl = (el: Element) => {
    const bg = getComputedStyle(el).backgroundImage;
    const m = bg && bg !== 'none' && bg.match(/url\((['"]?)(.*?)\1\)/);
    return m ? m[2] : null;
  };
  const lumaAt = (x: number, y: number): number | null => {
    const stack = document.elementsFromPoint(x, y) as HTMLElement[];
    for (const el of stack) if (el.dataset && el.dataset.navTheme) return el.dataset.navTheme === 'dark' ? 0 : 255;
    let fallback: number | null = null;
    for (const el of stack) {
      const src = el.tagName === 'IMG' && (el as HTMLImageElement).currentSrc ? (el as HTMLImageElement).currentSrc : bgUrl(el);
      if (src) {
        const l = imageLuma(src, el);
        if (typeof l === 'number') return l;
        if (l === 'pending') return null;
      }
      if (fallback == null) {
        const l = rgbLuma(getComputedStyle(el).backgroundColor);
        if (l != null) fallback = l;
      }
    }
    return fallback ?? rgbLuma(getComputedStyle(document.body).backgroundColor);
  };

  const overlay = document.getElementById('menu-overlay');
  let theme = header.classList.contains('nav-on-dark') ? 'dark' : 'light';
  let lastY = -1;
  function sample() {
    if ((overlay && !overlay.hidden) || document.querySelector('[data-ew-loader]')) return;
    lastY = window.scrollY;
    const y = 37, w = window.innerWidth;
    header.style.pointerEvents = 'none';
    const vals = [w * 0.14, w * 0.5, w * 0.86].map((x) => lumaAt(x, y)).filter((v): v is number => v != null);
    header.style.pointerEvents = '';
    if (!vals.length) return;
    const avg = vals.reduce((a, b) => a + b, 0) / vals.length;
    const next = avg < 118 ? 'dark' : avg > 150 ? 'light' : theme;
    if (next !== theme) {
      theme = next;
      targets.forEach((el) => {
        el.classList.toggle('nav-on-dark', next === 'dark');
        el.classList.toggle('nav-on-light', next === 'light');
      });
    }
  }
  let raf: number | null = null;
  const run = () => { raf = null; sample(); };
  const schedule = () => { if (!raf) raf = requestAnimationFrame(run); };
  addEventListener('scroll', () => { if (Math.abs(window.scrollY - lastY) >= 12) schedule(); }, { passive: true });
  addEventListener('resize', schedule);
  addEventListener('load', schedule);
  addEventListener('ew:menu', (e: Event) => { const d = (e as CustomEvent).detail; if (d && d.open === false) schedule(); });
  addEventListener('ew:loader-done', schedule);
  sample();
  setTimeout(sample, 250);
  setTimeout(sample, 1200);
}

/* ---------------------------------------------------------------- image fade-in */
const REVEAL_SKIP = '.idx-bd-frame, [data-hero], .ab-hero-photo, [data-ew-lightbox]';
type Revealable = HTMLElement & { _imgRevealed?: boolean };
export function revealImages(root: ParentNode = document, insideMenu = false) {
  const skip = (el: Revealable) => (!insideMenu && el.closest('#menu-overlay')) || el.closest(REVEAL_SKIP) || el._imgRevealed;
  const wire = (el: Revealable, isDone: () => boolean, onDone: (cb: () => void) => void, lazy = false) => {
    if (skip(el)) return;
    el._imgRevealed = true;
    if (isDone()) return;
    el.style.opacity = '0';
    el.style.transition = 'opacity 0.6s ease';
    let shown = false;
    const show = () => {
      if (shown) return;
      shown = true;
      el.style.opacity = '1';
      setTimeout(() => { el.style.removeProperty('opacity'); el.style.removeProperty('transition'); }, 700);
    };
    onDone(show);
    if (!lazy || !('IntersectionObserver' in window)) { setTimeout(show, 12000); return; }
    const io = new IntersectionObserver((entries) => {
      if (entries.some((en) => en.isIntersecting)) { io.disconnect(); setTimeout(show, 12000); }
    }, { rootMargin: '600px' });
    io.observe(el);
  };
  [...root.querySelectorAll<HTMLElement>('[style]')].forEach((el) => {
    const m = /url\(["']?([^"')]+)/.exec(el.style.backgroundImage || '');
    if (!m) return;
    const img = new Image();
    img.src = m[1];
    wire(el, () => img.complete, (cb) => { img.onload = cb; img.onerror = cb; });
  });
  [...root.querySelectorAll<HTMLImageElement>('img')].forEach((img) => {
    wire(img, () => img.complete && img.naturalWidth > 0, (cb) => {
      img.addEventListener('load', cb, { once: true });
      img.addEventListener('error', cb, { once: true });
    }, img.loading === 'lazy');
  });
}

/* ---------------------------------------------------------------- custom cursor (needs a .cursor element; the reference ships none) */
const mouse = { x: -200, y: -200 };
addEventListener('mousemove', (e) => { mouse.x = e.clientX; mouse.y = e.clientY; });
function wireCursor() {
  const cur = document.querySelector<HTMLElement>('.cursor');
  if (!cur || reduced || coarse) return;
  const pos = { x: -100, y: -100 };
  let scale = 1, target = 1;
  document.addEventListener('mouseover', (e) => {
    const t = e.target as HTMLElement;
    target = t.closest && t.closest('a, button') ? 1.8 : 1;
  });
  const loop = () => {
    if (!document.body.classList.contains('ghost-touring')) {
      pos.x += (mouse.x - 40 - pos.x) * 0.18;
      pos.y += (mouse.y - 40 - pos.y) * 0.18;
      scale += (target - scale) * 0.18;
      cur.style.transform = `translate3d(${pos.x.toFixed(1)}px,${pos.y.toFixed(1)}px,0) scale(${scale.toFixed(3)})`;
    }
    requestAnimationFrame(loop);
  };
  requestAnimationFrame(loop);
}

/* ---------------------------------------------------------------- lightbox */
declare global {
  interface Window {
    EWLightbox?: { open: (srcs: string[], index?: number, alts?: string[]) => void; close: () => void };
    ewTrack?: (name: string, data?: Record<string, unknown>) => void;
    ewq?: unknown[];
  }
}
function wireLightbox() {
  let box: HTMLElement | null = null, img: HTMLImageElement, counter: HTMLElement;
  let srcs: string[] = [], alts: string[] = [], index = 0, busy = false, prevOverflow = '';
  function build() {
    if (box) return;
    box = document.createElement('div');
    box.setAttribute('data-ew-lightbox', '');
    box.style.cssText = 'position:fixed;inset:0;z-index:120;background:rgba(12,11,9,0.97);display:flex;align-items:center;justify-content:center;opacity:0;transition:opacity .3s ease;';
    const lab = "font-family:'Hanken Grotesk','Hanken Grotesk Variable',sans-serif;text-transform:uppercase;letter-spacing:0.16em;font-size:10px;color:#f4efe4;";
    img = document.createElement('img');
    img.alt = '';
    img.style.cssText = 'max-width:88vw;max-height:82vh;object-fit:contain;display:block;transition:opacity .28s ease, transform .28s ease;';
    box.appendChild(img);
    counter = document.createElement('div');
    counter.style.cssText = 'position:absolute;top:26px;left:28px;' + lab;
    box.appendChild(counter);
    const closeBtn = document.createElement('button');
    closeBtn.innerHTML = '&#10005;';
    closeBtn.setAttribute('aria-label', 'Close');
    closeBtn.style.cssText = 'position:absolute;top:18px;right:20px;z-index:3;padding:12px 16px;background:none;border:none;cursor:pointer;color:#f4efe4;font-size:16px;line-height:1;';
    closeBtn.addEventListener('click', close);
    box.appendChild(closeBtn);
    const arrow = (label: string, glyph: string, side: string, dir: number) => {
      const b = document.createElement('button');
      b.innerHTML = glyph;
      b.setAttribute('aria-label', label);
      b.style.cssText = 'position:absolute;top:0;bottom:0;' + side + ':0;width:clamp(64px,12vw,160px);background:none;border:none;cursor:pointer;color:#f4efe4;font-size:30px;font-weight:300;opacity:0.75;transition:opacity .25s ease;';
      b.addEventListener('mouseenter', () => (b.style.opacity = '1'));
      b.addEventListener('mouseleave', () => (b.style.opacity = '0.75'));
      b.addEventListener('click', (e) => { e.stopPropagation(); step(dir); });
      box!.appendChild(b);
      return b;
    };
    arrow('Previous', '&#8249;', 'left', -1);
    arrow('Next', '&#8250;', 'right', 1);
    box.addEventListener('click', (e) => { if (e.target === box) close(); });
    let touchX: number | null = null;
    box.addEventListener('touchstart', (e) => (touchX = e.touches[0].clientX), { passive: true });
    box.addEventListener('touchend', (e) => {
      if (touchX === null) return;
      const dx = e.changedTouches[0].clientX - touchX;
      touchX = null;
      if (Math.abs(dx) > 44) step(dx < 0 ? 1 : -1);
    }, { passive: true });
    document.addEventListener('keydown', onKey);
    document.body.appendChild(box);
  }
  function onKey(e: KeyboardEvent) {
    if (!box || box.style.opacity === '0') return;
    if (e.key === 'Escape') close();
    else if (e.key === 'ArrowRight') step(1);
    else if (e.key === 'ArrowLeft') step(-1);
  }
  function preload(i: number) {
    const s = srcs[(i + srcs.length) % srcs.length];
    if (s) { const p = new Image(); p.src = s; }
  }
  function show(i: number) {
    index = (i + srcs.length) % srcs.length;
    img.src = srcs[index];
    img.alt = alts[index] || '';
    counter.textContent = String(index + 1).padStart(2, '0') + ' / ' + String(srcs.length).padStart(2, '0');
    preload(index + 1);
    preload(index - 1);
  }
  function step(dir: number) {
    if (busy || srcs.length < 2) return;
    busy = true;
    img.style.opacity = '0';
    img.style.transform = 'translateX(' + dir * -22 + 'px)';
    setTimeout(() => {
      const arrive = () => {
        img.removeEventListener('load', arrive);
        img.style.transition = 'none';
        img.style.transform = 'translateX(' + dir * 22 + 'px)';
        void img.offsetWidth;
        img.style.transition = 'opacity .3s ease, transform .3s ease';
        img.style.opacity = '1';
        img.style.transform = 'translateX(0)';
        busy = false;
      };
      img.addEventListener('load', arrive);
      show(index + dir);
      if (img.complete) arrive();
    }, 240);
  }
  function open(list: string[], start?: number, altList?: string[]) {
    build();
    srcs = list.slice();
    alts = Array.isArray(altList) ? altList.slice() : [];
    prevOverflow = document.documentElement.style.overflow;
    document.documentElement.style.overflow = 'hidden';
    img.style.opacity = '1';
    img.style.transform = 'none';
    show(start || 0);
    box!.style.display = 'flex';
    requestAnimationFrame(() => (box!.style.opacity = '1'));
  }
  function close() {
    if (!box) return;
    box.style.opacity = '0';
    document.documentElement.style.overflow = prevOverflow;
    setTimeout(() => (box!.style.display = 'none'), 320);
  }
  window.EWLightbox = { open, close };
}

/* ---------------------------------------------------------------- menu overlay */
type Row = HTMLElement & {
  _white?: HTMLElement[]; _red?: HTMLElement[]; _lit?: boolean; _charTl?: gsap.core.Timeline;
  _menuIn?: () => void; _menuOut?: (fast?: boolean) => void; _accCollapse?: (instant?: boolean) => void;
};
type Overlay = HTMLElement & { _settleRows?: () => void };
type Preview = HTMLElement & { _lbWired?: boolean };
type Grid = HTMLElement & { _imgsLoaded?: boolean };
interface MenuState {
  open: boolean; animating: boolean; opened: boolean;
  gridEl?: Grid; row?: Row; imgs?: HTMLElement[]; homeWrap?: HTMLElement | null; closeTl?: gsap.core.Timeline;
}
function wireMenu() {
  const overlay = document.getElementById('menu-overlay') as Overlay | null;
  const openBtn = document.getElementById('menuOpen');
  if (!overlay || !openBtn) return;
  const closeBtn = overlay.querySelector<HTMLElement>('#menuClose');
  const cursor = document.querySelector<HTMLElement>('.cursor[data-mode="menu"]');
  let closing = false;
  let st: MenuState | null = null;

  const setOpen = (v: boolean) => {
    document.documentElement.style.overflow = v ? 'hidden' : '';
    document.documentElement.classList.toggle('menu-open', v);
    openBtn.setAttribute('aria-expanded', v ? 'true' : 'false');
    cursor && cursor.classList.toggle('on', v);
    dispatchEvent(new CustomEvent('ew:menu', { detail: { open: v } }));
  };
  let bgLoaded = false;
  const open = () => {
    if (!overlay.hidden) return;
    overlay.classList.remove('mo-out');
    overlay.hidden = false;
    if (!bgLoaded) {
      bgLoaded = true;
      overlay.querySelectorAll<HTMLElement>('[data-bg]').forEach((el) => { el.style.backgroundImage = `url(${el.dataset.bg})`; });
      revealImages(overlay.querySelector('[data-mrows]') || overlay, true);
    }
    setOpen(true);
    wireRows();
  };
  const resetPreview = () => {
    if (!st || !st.opened) return;
    const prev = overlay.querySelector<HTMLElement>('[data-mprev]')!;
    const cover = overlay.querySelector<HTMLElement>('[data-mcover]')!;
    const closeX = overlay.querySelector<HTMLElement>('[data-mclose]')!;
    prev.classList.remove('on');
    prev.style.overflow = '';
    prev.style.pointerEvents = '';
    overlay.querySelector('[data-mrows]')?.classList.remove('mrows-front');
    overlay.querySelectorAll<HTMLElement>('[data-mgrid]').forEach((g) => (g.hidden = true));
    gsap.set(cover, { height: 0, opacity: 0, top: 0 });
    gsap.set(closeX, { opacity: 0, pointerEvents: 'none' });
    overlay.querySelectorAll('[data-mrow] .oh__inner').forEach((el) => gsap.set(el, { yPercent: 0 }));
    if (st.imgs && st.homeWrap) {
      st.homeWrap.prepend(...st.imgs);
      gsap.set(st.imgs, { scale: 0.8, opacity: 0, xPercent: 0, x: 0, y: 0, yPercent: 0 });
    }
    st.opened = false;
  };
  const close = () => {
    if (closing || overlay.hidden) return;
    overlay._settleRows && overlay._settleRows();
    if (reduced) { overlay.hidden = true; resetPreview(); setOpen(false); return; }
    closing = true;
    overlay.classList.add('mo-out');
    setTimeout(() => { closing = false; overlay.hidden = true; resetPreview(); setOpen(false); }, 620);
  };
  openBtn.addEventListener('click', open);
  closeBtn && closeBtn.addEventListener('click', close);
  overlay.querySelectorAll('#menuLogo, #menuHome').forEach((el) =>
    el.addEventListener('click', (e) => { if (location.pathname === '/') { e.preventDefault(); close(); } }),
  );
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && !overlay.hidden && !document.querySelector<HTMLElement>('[data-ew-lightbox]')?.style.opacity?.startsWith('1')) close();
  });

  let rowsWired = false;
  function wireRows() {
    st = { open: false, animating: false, opened: false };
    if (rowsWired) return;
    rowsWired = true;
    const rows = [...overlay!.querySelectorAll<Row>('[data-mrow]')];
    const cover = overlay!.querySelector<HTMLElement>('[data-mcover]');
    const prev = overlay!.querySelector<Preview>('[data-mprev]');
    const closeX = overlay!.querySelector<HTMLElement>('[data-mclose]');
    const grids: Record<string, Grid> = {};
    overlay!.querySelectorAll<Grid>('[data-mgrid]').forEach((g) => (grids[g.getAttribute('data-mgrid')!] = g));
    const prevTitle = prev && prev.querySelector<HTMLElement>('.mprev-title');
    const prevLink = prev && prev.querySelector<HTMLAnchorElement>('[data-mprev-link]');
    if (!rows.length || !cover || !prev || !Object.keys(grids).length) return;

    // Any frame in the opened grid opens the lightbox on the full-size set.
    if (!prev._lbWired) {
      prev._lbWired = true;
      prev.addEventListener('click', (e) => {
        const cell = (e.target as HTMLElement).closest<HTMLElement>('.mcell');
        if (!cell || !st || !st.opened || !st.gridEl || !cell.dataset.full || !window.EWLightbox) return;
        const cells = [...st.gridEl.querySelectorAll<HTMLElement>('.mcell')].filter((c) => c.dataset.full);
        window.EWLightbox.open(cells.map((c) => c.dataset.full!), cells.indexOf(cell));
      });
    }

    let litRow: Row | null = null;
    overlay!._settleRows = () => {
      litRow = null;
      rows.forEach((row) => {
        const white = row._white || [], red = row._red || [];
        const cells = [...row.querySelectorAll<HTMLElement>('.mrow-imgs .mcell')];
        gsap.killTweensOf(cells);
        row._lit = false;
        gsap.set(white, { yPercent: 0 });
        gsap.set(red, { yPercent: 115 });
        gsap.set(cells, { opacity: 0, scale: 0.8 });
        row._charTl && row._charTl.pause(0);
        row._accCollapse && row._accCollapse(true);
      });
    };

    rows.forEach((row) => {
      const cells = [...row.querySelectorAll<HTMLElement>('.mrow-imgs .mcell')];
      const inner = row.querySelector<HTMLElement>('.oh__inner');
      let white: HTMLElement[] = [], red: HTMLElement[] = [];
      // Split the row label into per-character spans: a white layer that leaves upward and a red
      // layer that rolls in beneath it. "Something & Other" breaks into two lines at the ampersand.
      if (inner && !inner.dataset.split) {
        inner.dataset.split = '1';
        const nodes = [...inner.childNodes];
        const labs = nodes.filter((n) => n.nodeType === 1 && (n as HTMLElement).className && String((n as HTMLElement).className).includes('lab'));
        const textNodes = nodes.filter((n) => !labs.includes(n));
        const text = textNodes.map((n) => n.textContent).join('').trim();
        textNodes.forEach((n) => n.remove());
        const num = (labs[0] as HTMLElement) || null;
        num && num.remove();
        let lines = [text];
        const amp = text.indexOf(' & ');
        if (amp > 0) lines = [text.slice(0, amp), '& ' + text.slice(amp + 3)];
        const fill = (parent: HTMLElement, bucket: HTMLElement[]) => (chars: string) => {
          for (const ch of chars) {
            const s = document.createElement('span');
            s.style.display = 'inline-block';
            s.style.willChange = 'transform';
            s.style.pointerEvents = 'none';
            s.textContent = ch === ' ' ? ' ' : ch;
            bucket.push(s);
            parent.appendChild(s);
          }
        };
        lines.forEach((line, i) => {
          const wrap = document.createElement('span');
          wrap.style.display = 'block';
          wrap.style.overflow = 'hidden';
          if (num && i === lines.length - 1 && i > 0) wrap.appendChild(num);
          if (num && lines.length === 1 && i === 0) wrap.appendChild(num);
          const base = document.createElement('span');
          base.style.display = 'inline-block';
          base.style.position = 'relative';
          fill(base, white)(line);
          const over = document.createElement('span');
          over.style.position = 'absolute';
          over.style.left = '0';
          over.style.top = '0';
          over.style.whiteSpace = 'nowrap';
          over.style.color = 'var(--red-hover)';
          over.setAttribute('aria-hidden', 'true');
          fill(over, red)(line);
          base.appendChild(over);
          wrap.appendChild(base);
          inner.appendChild(wrap);
        });
        gsap.set(red, { yPercent: 115 });
        row._white = white;
        row._red = red;
      } else if (inner) {
        white = row._white || [];
        red = row._red || [];
      }
      const charTl = gsap.timeline({ paused: true })
        .to(white, { duration: 0.45, ease: 'power2.in', yPercent: -115, stagger: 0.016 }, 0)
        .to(red, { duration: 0.85, ease: 'expo.out', yPercent: 0, stagger: 0.02 }, 0.12);
      row._charTl = charTl;
      row._menuOut = (fast?: boolean) => {
        if (litRow === row) litRow = null;
        row._lit = false;
        charTl.timeScale(fast ? 2.2 : 1.3).reverse();
        gsap.killTweensOf(cells);
        gsap.to(cells, { duration: fast ? 0.3 : 0.4, ease: 'power4', opacity: 0, scale: 0.8 });
      };
      row._menuIn = () => {
        if (st && st.open) return;
        if (st && st.closeTl && st.closeTl.isActive() && st.row === row) st.closeTl.progress(1);
        if (litRow && litRow !== row) litRow._menuOut!(true);
        litRow = row;
        row._lit = true;
        charTl.timeScale(1).play();
        gsap.killTweensOf(cells);
        gsap.to(cells, { duration: 0.55, ease: 'power3', startAt: { scale: 0.8, xPercent: 20 }, scale: 1, xPercent: 0, opacity: 1, stagger: -0.035 });
      };
      row.addEventListener('mouseenter', () => row._menuIn!());
      row.addEventListener('mouseleave', () => {
        if (st && st.open) return;
        if (st && st.closeTl && st.closeTl.isActive() && st.row === row) st.closeTl.progress(1);
        row._menuOut!();
      });
      if (row.getAttribute('data-live') === '1') {
        row.style.cursor = 'pointer';
        row.addEventListener('click', (e) => {
          const t = e.target as HTMLElement;
          if (t.closest && t.closest('.mrow-imgs') && grids[row.getAttribute('data-key')!]) { openGrid(row, true); return; }
          if (!st || st.open || st.animating) return;
          const href = row.getAttribute('data-href');
          if (href) {
            typeof window.ewTrack == 'function' && window.ewTrack('gallery_open', { to: href, from: location.pathname });
            leaveTo(href);
          }
        });
      }
    });

    // Pointer tracking is done by hand so the lit row follows the pointer even while GSAP is
    // mid-tween and mouseenter would have been swallowed.
    let px = -1, py = -1;
    const under = (row: Row) => {
      if (px < 0) return false;
      const r = row.getBoundingClientRect();
      const slack = Math.max(16, innerWidth * 0.014);
      return px >= r.left - slack && px <= r.right + slack && py >= r.top && py <= r.bottom;
    };
    const settle = () => {
      if (overlay!.hidden || overlay!.classList.contains('mo-out') || (st && (st.open || st.opened))) return;
      const hit = rows.find(under) || null;
      for (const row of rows) {
        if (row === hit) continue;
        if (row._lit) { row._menuOut!(true); continue; }
        const cell = row.querySelector<HTMLElement>('.mrow-imgs .mcell');
        if (cell && parseFloat(getComputedStyle(cell).opacity) > 0.05 && !gsap.isTweening(cell)) row._menuOut!(true);
      }
      if (hit && !hit._lit) hit._menuIn!();
    };
    addEventListener('pointerdown', (e) => { px = e.clientX; py = e.clientY; settle(); }, { passive: true });
    addEventListener('pointermove', (e) => { px = e.clientX; py = e.clientY; settle(); }, { passive: true });
    document.documentElement.addEventListener('mouseleave', () => { px = -1; py = -1; settle(); });
    addEventListener('blur', () => { px = -1; py = -1; settle(); });
    setInterval(settle, 200);

    // Row → full grid: the cream cover grows from the row to fill the overlay, the row's five
    // thumbnails Flip into the grid, the rest of the grid scales in.
    const openGrid = (row: Row, flipFromRow: boolean) => {
      if (!st || st.open || st.animating) return;
      const grid = grids[row.getAttribute('data-key')!];
      if (!grid) return;
      const rowCells = [...row.querySelectorAll<HTMLElement>('.mrow-imgs .mcell')];
      if (st.closeTl && st.closeTl.isActive()) st.closeTl.progress(1);
      gsap.killTweensOf(cover);
      st.open = true; st.animating = true; st.opened = true; st.gridEl = grid;
      prev.style.overflow = '';
      prev.style.pointerEvents = '';
      const mrows = overlay!.querySelector<HTMLElement>('[data-mrows]');
      mrows && mrows.classList.remove('mrows-front');
      prev.scrollTop = 0;
      st.row = row; st.imgs = rowCells; st.homeWrap = row.querySelector<HTMLElement>('.mrow-imgs');
      Object.values(grids).forEach((g) => (g.hidden = g !== grid));
      prevTitle && (prevTitle.textContent = row.getAttribute('data-label') || '');
      if (prevLink) {
        prevLink.setAttribute('href', row.getAttribute('data-href') || '#');
        prevLink.textContent = grid.getAttribute('data-line') || 'Open the gallery →';
      }
      if (!grid._imgsLoaded) { grid._imgsLoaded = true; revealImages(grid, true); }
      const gridCells = [...grid.querySelectorAll<HTMLElement>('.mcell')];
      const inners = rows.map((r) => r.querySelector<HTMLElement>('.oh__inner')!);
      const ob = overlay!.getBoundingClientRect(), rb = row.getBoundingClientRect();
      gsap.timeline({ onComplete: () => (st!.animating = false) })
        .addLabel('start', 0)
        .set(cover, { top: rb.top - ob.top, height: row.offsetHeight - 1, opacity: 0 })
        .set(gridCells, { opacity: 0 })
        .to(cover, { duration: 0.45, ease: 'power1.out', opacity: 1 }, 'start')
        .to(cover, { duration: 0.9, ease: 'power4.inOut', top: 0, height: ob.height }, 'start')
        .to(inners, { duration: 0.5, ease: 'power4.inOut', yPercent: (_i: number, el: Element) => (el.getBoundingClientRect().top > rb.top ? 100 : -100) }, 'start')
        .add(() => {
          prev.classList.add('on');
          if (flipFromRow) {
            const state = Flip.getState(rowCells, { simple: true });
            grid.prepend(...rowCells);
            gsap.set(rowCells, { opacity: 1, scale: 1, xPercent: 0 });
            Flip.from(state, { duration: 0.9, ease: 'power4.inOut', stagger: 0.04 });
            gsap.to(gridCells, { duration: 0.9, ease: 'power4.inOut', startAt: { scale: 0, yPercent: () => gsap.utils.random(0, 200) }, scale: 1, opacity: 1, yPercent: 0, stagger: 0.04 });
          } else {
            grid.prepend(...rowCells);
            gsap.set(rowCells, { xPercent: 0 });
            gsap.to([...rowCells, ...gridCells], { duration: 0.9, ease: 'power4.inOut', startAt: { scale: 0, yPercent: () => gsap.utils.random(0, 200) }, scale: 1, opacity: 1, yPercent: 0, stagger: 0.04 });
          }
        }, 'start+=0.15')
        .add(() => overlay!._settleRows!(), 'start+=0.55')
        .fromTo(prev.querySelector('.mprev-title'), { yPercent: 110 }, { duration: 1, ease: 'power4.inOut', yPercent: 0 }, 'start')
        .to(closeX, { duration: 1, ease: 'power4.inOut', opacity: 1, pointerEvents: 'auto' }, 'start');
    };

    // Narrow layouts: a "+" accordion under each row instead of the hover thumbnails.
    rows.forEach((row) => {
      const plus = row.querySelector<HTMLElement>('[data-mplus]');
      const acc = row.querySelector<HTMLElement>('[data-macc]');
      if (!plus || !acc) return;
      const collapse = (instant?: boolean) => {
        plus.classList.remove('open');
        plus.setAttribute('aria-expanded', 'false');
        gsap.killTweensOf(acc);
        instant ? gsap.set(acc, { height: 0, opacity: 0 }) : gsap.to(acc, { height: 0, opacity: 0, duration: 0.4, ease: 'power2.inOut' });
      };
      const expand = () => {
        rows.forEach((r) => r !== row && r._accCollapse && r._accCollapse());
        acc.querySelectorAll<HTMLElement>('.macc-cell').forEach((c) => {
          if (c.dataset.src) { c.style.backgroundImage = `url(${c.dataset.src})`; delete c.dataset.src; }
        });
        plus.classList.add('open');
        plus.setAttribute('aria-expanded', 'true');
        gsap.killTweensOf(acc);
        gsap.fromTo(acc, { height: 0, opacity: 0 }, { height: 'auto', opacity: 1, duration: 0.45, ease: 'power2.inOut' });
      };
      row._accCollapse = collapse;
      plus.addEventListener('click', (e) => { e.stopPropagation(); plus.classList.contains('open') ? collapse() : expand(); });
      acc.addEventListener('click', (e) => {
        const t = e.target as HTMLElement;
        if (!t.closest('[data-macc-view]') && !t.closest('.macc-cell')) return;
        e.stopPropagation();
        collapse(true);
        openGrid(row, false);
      });
    });

    const closeGrid = () => {
      if (!st || !st.open || st.animating) return;
      prev.style.overflow = 'hidden';
      prev.style.pointerEvents = 'none';
      st.open = false; st.animating = false;
      const mrows = overlay!.querySelector<HTMLElement>('[data-mrows]');
      mrows && mrows.classList.add('mrows-front');
      const grid = st.gridEl!, row = st.row!, rowCells = st.imgs!;
      const others = [...grid.querySelectorAll<HTMLElement>('.mcell')].filter((c) => !rowCells.includes(c));
      const inners = rows.map((r) => r.querySelector<HTMLElement>('.oh__inner')!);
      const ob = overlay!.getBoundingClientRect(), rb = row.getBoundingClientRect();
      st.closeTl = gsap.timeline({
        defaults: { duration: 0.5, ease: 'power4.inOut' },
        onComplete: () => { st!.opened = false; prev.classList.remove('on'); gsap.set(prev, { clearProps: 'opacity' }); grid.hidden = true; },
      })
        .addLabel('start', 0)
        .to([...rowCells, ...others], {
          scale: 0, opacity: 0, stagger: { amount: 0.35 },
          onComplete: () => { st!.homeWrap!.prepend(...rowCells); gsap.set(rowCells, { scale: 0.8, opacity: 0, xPercent: 0, x: 0, y: 0, yPercent: 0 }); },
        }, 0)
        .to(prev, { opacity: 0, duration: 0.65, ease: 'power2.out' }, 'start+=0.2')
        .to(prev.querySelector('.mprev-title'), { duration: 0.6, yPercent: 110 }, 'start')
        .to(closeX, { opacity: 0, pointerEvents: 'none' }, 'start')
        .to(cover, { ease: 'power4', height: 0, top: rb.top - ob.top + row.offsetHeight / 2 }, 'start+=0.4')
        .to(cover, { duration: 0.3, opacity: 0 }, 'start+=0.9')
        .to(inners, { yPercent: 0, stagger: 0.03 }, 'start+=0.4');
    };
    closeX && closeX.addEventListener('click', closeGrid);
  }
}

/* ---------------------------------------------------------------- Inquire CTA: magnetic pill + ink splash */
type Inker = HTMLAnchorElement & { _inking?: boolean };
function wireCtaInk() {
  const cta = document.querySelector<Inker>('header.site a.nav-cta[href="/contact"]');
  if (!cta || reduced) return;
  cta.setAttribute('data-cta-ink', '');
  const label = cta.textContent!.trim();
  cta.textContent = '';
  const fill = document.createElement('span');
  fill.className = 'cta-fill';
  const roll = document.createElement('span');
  roll.className = 'cta-roll';
  const a = document.createElement('span');
  a.className = 'cta-roll-a';
  a.textContent = label;
  const b = document.createElement('span');
  b.className = 'cta-roll-b';
  b.textContent = label;
  b.setAttribute('aria-hidden', 'true');
  roll.append(a, b);
  cta.append(fill, roll);
  if (!coarse) {
    cta.classList.add('cta-wired');
    const place = (e: MouseEvent) => {
      const r = cta.getBoundingClientRect();
      const x = e.clientX - r.left, y = e.clientY - r.top;
      const rad = Math.hypot(Math.max(x, r.width - x), Math.max(y, r.height - y));
      gsap.set(fill, { left: x, top: y, width: rad * 2, height: rad * 2, xPercent: -50, yPercent: -50 });
    };
    cta.addEventListener('mouseenter', (e) => {
      if ((gsap.getProperty(fill, 'scale') as number) < 0.05) place(e);
      cta.classList.add('cta-on');
      gsap.to(fill, { scale: 1, duration: 0.55, ease: 'power3.out', overwrite: 'auto' });
    });
    cta.addEventListener('mouseleave', () => {
      cta.classList.remove('cta-on');
      gsap.to(fill, { scale: 0, duration: 0.4, ease: 'power2.in', overwrite: 'auto' });
      gsap.to(cta, { x: 0, y: 0, duration: 0.85, ease: 'elastic.out(1.05, 0.4)', overwrite: 'auto' });
    });
    cta.addEventListener('mousemove', (e) => {
      const r = cta.getBoundingClientRect();
      gsap.to(cta, { x: (e.clientX - (r.left + r.width / 2)) * 0.34, y: (e.clientY - (r.top + r.height / 2)) * 0.42, duration: 0.45, ease: 'power3.out', overwrite: 'auto' });
    });
  }
  cta.addEventListener('click', (e) => {
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return;
    e.preventDefault();
    if (location.pathname === '/contact' || cta._inking) return;
    cta._inking = true;
    gsap.to(cta, { scale: 0.92, duration: 0.11, ease: 'power2.in', yoyo: true, repeat: 1 });
    const r = cta.getBoundingClientRect();
    const cx = r.left + r.width / 2, cy = r.top + r.height / 2;
    const rad = Math.hypot(Math.max(cx, innerWidth - cx), Math.max(cy, innerHeight - cy));
    const ink = document.createElement('div');
    ink.className = 'cta-ink';
    const dot = document.createElement('span');
    dot.style.left = cx + 'px';
    dot.style.top = cy + 'px';
    dot.style.width = dot.style.height = rad * 2 + 'px';
    dot.style.background = getComputedStyle(cta).getPropertyValue('--red').trim() || '#9b1120';
    ink.appendChild(dot);
    document.body.appendChild(ink);
    let gone = false;
    const go = () => {
      if (gone) return;
      gone = true;
      location.href = '/contact';
      setTimeout(() => {
        gsap.to(dot, { opacity: 0, duration: 0.5, ease: 'power1.out', onComplete: () => ink.remove() });
        cta._inking = false;
      }, 2600);
    };
    gsap.timeline({ onComplete: go })
      .fromTo(dot, { xPercent: -50, yPercent: -50, scale: 0 }, { scale: 1, duration: 0.6, ease: 'expo.inOut' }, 0.1)
      .to(dot, { backgroundColor: '#efede7', duration: 0.28, ease: 'power1.inOut' }, '+=0.05');
    setTimeout(go, 1600);
  });
  addEventListener('pageshow', (e) => {
    if (!e.persisted) return;
    cta._inking = false;
    document.querySelectorAll('.cta-ink').forEach((el) => el.remove());
    cta.classList.remove('cta-on');
    gsap.set(fill, { scale: 0 });
    gsap.set(cta, { x: 0, y: 0, scale: 1 });
  });
}

/* ---------------------------------------------------------------- story sub-lists align under the wordmark */
function alignWordmarks() {
  const setX = (el: HTMLElement, x: number) => { if (x > 1) el.style.setProperty('--wordmark-x', Math.round(x) + 'px'); };
  document.querySelectorAll<HTMLElement>('.idx-stories').forEach((list) => {
    const row = list.closest<HTMLElement>('.idx-row');
    const text = row && row.querySelector<HTMLElement>('.idx-text');
    if (text && row) setX(list, text.getBoundingClientRect().left - row.getBoundingClientRect().left);
  });
  const mstories = document.querySelector<HTMLElement>('.mstories');
  if (mstories) {
    const prevRow = mstories.previousElementSibling as HTMLElement | null;
    const item = prevRow && prevRow.querySelector<HTMLElement>('.m-item');
    if (item && prevRow) {
      const node = document.createTreeWalker(item, NodeFilter.SHOW_TEXT, {
        acceptNode: (n) => (n.textContent!.trim() && !(n.parentElement && n.parentElement.closest('.lab')) ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT),
      }).nextNode();
      if (node) {
        const range = document.createRange();
        range.selectNodeContents(node);
        setX(mstories, range.getBoundingClientRect().left - prevRow.getBoundingClientRect().left);
      }
    }
  }
}

/* ---------------------------------------------------------------- boot */
wireLoader();
wireReadyGate();
wireLeaveFade();
wireNavHide();
wireNavTheme();
wireLightbox();
wireMenu();
wireCursor();
wireCtaInk();
setTimeout(() => revealImages(), 30);
alignWordmarks();
addEventListener('resize', alignWordmarks);
addEventListener('ew:menu', (e: Event) => {
  const d = (e as CustomEvent).detail;
  if (d && d.open) { setTimeout(alignWordmarks, 80); setTimeout(alignWordmarks, 900); }
});
document.fonts && document.fonts.ready && document.fonts.ready.then(alignWordmarks);

/* ---------------------------------------------------------------- analytics shim (local: queue only) */
const track = (name: string, data?: Record<string, unknown>) => {
  try {
    (window as unknown as { __ewEvents?: unknown[] }).__ewEvents ??= [];
    (window as unknown as { __ewEvents: unknown[] }).__ewEvents.push([name, data]);
  } catch { /* noop */ }
};
const queued = Array.isArray(window.ewq) ? window.ewq.slice() : [];
window.ewTrack = track;
window.ewq = [];
for (const args of queued) { try { (track as Function).apply(null, args as unknown[]); } catch { /* noop */ } }

const clean = (p: string) => (p || '').replace(/\/$/, '') || '/';
const GALLERIES = new Set(['/weddings', '/engagements', '/commercial', '/editorials', '/stories']);
document.addEventListener('click', (e) => {
  const t = e.target as HTMLElement;
  const el = t.closest && (t.closest('a[href], button') as HTMLElement | null);
  if (!el) return;
  if (el.id === 'menuOpen' || (el.hasAttribute && el.hasAttribute('data-dock-galleries'))) {
    track('menu_open', { to: el.id === 'menuOpen' ? 'overlay' : 'dock', from: clean(location.pathname) });
    return;
  }
  const href = el.getAttribute && el.getAttribute('href');
  if (!href) return;
  const path = clean(href.split('#')[0].split('?')[0]);
  if (path === '/contact') { track('inquire_click', { from: clean(location.pathname) }); return; }
  if (path === '/pricing') { track('pricing_open', { from: clean(location.pathname) }); return; }
  if (GALLERIES.has(path)) { track('gallery_open', { to: path, from: clean(location.pathname) }); return; }
  if (path.startsWith('/weddings/')) { track('story_open', { to: path }); return; }
  let u: URL | null = null;
  try { u = new URL(href, location.href); } catch { return; }
  if (/^https?:$/.test(u.protocol) && u.host !== location.host) track('outbound', { to: (u.host + u.pathname).slice(0, 120) });
}, { capture: true, passive: true });
