/**
 * Wedding story pages: hero entrance, the full-gallery sheet, chapter rail, and — once the
 * block-main grid images are in — Lenis, scroll cues, the pinned grid choreography, rises,
 * parallax, the three-column "trio" scrub and drift groups.
 * Ported from the reference abigail-mate module (shared by all three stories).
 */
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Lenis from 'lenis';
import { wireCloseCascade } from '../lib/close-cascade';
import { wireChapterRail } from '../lib/chap-rail';
import { glideToTop, easeInOutCubic, glideDuration } from '../lib/glide';

gsap.registerPlugin(ScrollTrigger);
wireCloseCascade();
(() => {
  const update = () => {
    const atTop = window.scrollY < 40;
    const hint = document.querySelector<HTMLElement>('[data-scrollhint]');
    if (hint) hint.style.opacity = atTop ? '1' : '0';
    const strip = document.querySelector<HTMLElement>('[data-cornerstrip]');
    if (strip) { strip.style.opacity = atTop ? '1' : '0'; strip.style.pointerEvents = atTop ? '' : 'none'; }
  };
  addEventListener('scroll', update, { passive: true });
  setTimeout(update, 100);
})();
const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
let lenis: Lenis | null = null;
let galleryOpen = false;

function splitWords(el: HTMLElement) {
  const text = (el.textContent || '').trim();
  el.textContent = '';
  const chars: HTMLElement[] = [];
  for (const part of text.split(/(\s+)/)) {
    if (!part) continue;
    if (!part.trim()) { el.appendChild(document.createTextNode(' ')); continue; }
    const w = document.createElement('span');
    w.className = 'hero-word';
    w.style.display = 'inline-block';
    w.style.overflow = 'hidden';
    w.style.verticalAlign = 'top';
    for (const ch of part) {
      const s = document.createElement('span');
      s.style.display = 'inline-block';
      s.style.willChange = 'transform';
      s.textContent = ch;
      chars.push(s);
      w.appendChild(s);
    }
    el.appendChild(w);
  }
  return chars;
}
(() => {
  const hero = document.querySelector<HTMLElement>('[data-hero]');
  if (!hero) return;
  if (reduced) { gsap.set(hero, { opacity: 1 }); return; }
  const rises = gsap.utils.toArray<HTMLElement>('[data-hero-rise]');
  const cascade = document.querySelector<HTMLElement>('[data-hero-cascade]');
  const chars = cascade ? splitWords(cascade) : null;
  chars && gsap.set(chars, { yPercent: 112 });
  rises.length && gsap.set(rises, { y: 26, opacity: 0 });
  let played = false;
  const play = () => {
    if (played) return;
    played = true;
    gsap.fromTo(hero, { opacity: 0, scale: 1.04 }, { opacity: 1, scale: 1, duration: 1.4, ease: 'power2.out' });
    chars && gsap.to(chars, { yPercent: 0, duration: 1.3, ease: 'expo.out', stagger: 0.05, delay: 0.25 });
    rises.length && gsap.to(rises, { y: 0, opacity: 1, duration: 1, ease: 'power2.out', stagger: 0.12, delay: chars ? 0.65 : 0.45 });
  };
  let src = /url\(["']?([^"')]+)/.exec(hero.style.backgroundImage || '')?.[1];
  if (!src) {
    const v = (name: string) => /url\(["']?([^"')]+)/.exec(hero.style.getPropertyValue(name) || '')?.[1];
    src = ((window.devicePixelRatio || 1) > 1 && v('--bg2')) || v('--bg1') || v('--bg2');
  }
  if (!src) { play(); return; }
  const pre = new Image();
  pre.onload = play;
  pre.onerror = play;
  pre.src = src;
  if (pre.complete) play();
  setTimeout(play, 5000);
})();
// Full gallery sheet: every frame, opened from the "see every frame" button.
(() => {
  const openBtn = document.querySelector<HTMLElement>('[data-fullgallery]');
  const sheet = document.querySelector<HTMLElement>('[data-fg]');
  if (!openBtn || !sheet) return;
  const cells = [...sheet.querySelectorAll<HTMLElement>('.fg-cell')];
  const srcs = cells.map((c) => c.dataset.full!);
  const closeBtn = sheet.querySelector<HTMLElement>('[data-fg-close]');
  const set = (open: boolean) => {
    if (galleryOpen === open) return;
    galleryOpen = open;
    sheet.hidden = !open;
    document.documentElement.style.overflow = open ? 'hidden' : '';
    if (lenis) open ? lenis.stop() : lenis.start();
    if (open) {
      sheet.scrollTop = 0;
      if (!reduced) {
        gsap.fromTo(sheet, { opacity: 0 }, { opacity: 1, duration: 0.4, ease: 'power1.out' });
        gsap.fromTo(cells.slice(0, 24), { opacity: 0, y: 26 }, { opacity: 1, y: 0, duration: 0.7, ease: 'power2.out', stagger: 0.022, clearProps: 'opacity,transform' });
      }
      closeBtn && closeBtn.focus();
    } else openBtn.focus();
  };
  openBtn.addEventListener('click', () => set(true));
  closeBtn && closeBtn.addEventListener('click', () => set(false));
  document.addEventListener('keydown', (e) => {
    if (e.key !== 'Escape' || !galleryOpen || document.querySelector<HTMLElement>('[data-ew-lightbox]')?.style.opacity?.startsWith('1')) return;
    const menu = document.getElementById('menu-overlay');
    if (menu && !menu.hidden) return;
    set(false);
  });
  addEventListener('ew:menu', (e: Event) => {
    const d = (e as CustomEvent).detail;
    if (d && !d.open && galleryOpen) document.documentElement.style.overflow = 'hidden';
  });
  cells.forEach((c, i) => c.addEventListener('click', () => window.EWLightbox && window.EWLightbox.open(srcs, i)));
  // Warm the first two dozen frames once the gallery's section is near.
  const section = openBtn.closest('section') || openBtn;
  const io = new IntersectionObserver((entries) => {
    if (!entries.some((en) => en.isIntersecting)) return;
    io.disconnect();
    cells.slice(0, 24).forEach((c) => {
      const img = c.querySelector('img');
      if (!img) return;
      const pre = new Image();
      const ss = img.getAttribute('srcset');
      if (ss) { pre.sizes = img.sizes; pre.srcset = ss; }
      pre.src = img.getAttribute('src')!;
    });
  }, { rootMargin: '160% 0px' });
  io.observe(section);
})();
wireChapterRail(() => lenis);

function whenGridImagesReady(cb: () => void) {
  const srcs = [...document.querySelectorAll<HTMLElement>('.gg-col-item [style*="background-image"]')]
    .map((el) => /url\(["']?([^"')]+)/.exec(el.style.backgroundImage || '')?.[1]).filter(Boolean) as string[];
  let pending = srcs.length;
  if (!pending) { cb(); return; }
  const one = () => { if (--pending <= 0) cb(); };
  srcs.forEach((s) => { const img = new Image(); img.onload = one; img.onerror = one; img.src = s; });
  setTimeout(() => { if (pending > 0) { pending = 0; cb(); } }, 6000);
}
let started = false;
function start() {
  if (started) return;
  started = true;
  if (!reduced) {
    lenis = new Lenis({ lerp: 0.08, wheelMultiplier: 1.4 });
    lenis.on('scroll', ScrollTrigger.update);
    gsap.ticker.add((t) => lenis!.raf(t * 1000));
    gsap.ticker.lagSmoothing(0);
    addEventListener('ew:menu', (e: Event) => ((e as CustomEvent).detail.open ? lenis!.stop() : galleryOpen || lenis!.start()));
  }
  document.querySelectorAll<HTMLElement>('[data-scrolldown]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const sel = btn.getAttribute('data-scrolldown')!;
      const target = document.querySelector<HTMLElement>(sel);
      if (!target) return;
      const through = btn.hasAttribute('data-scrolldown-through');
      if (!lenis) {
        sel === 'body' ? window.scrollTo({ top: 0, behavior: 'smooth' }) : target.scrollIntoView({ behavior: 'smooth', block: through ? 'end' : 'start' });
        return;
      }
      if (through) {
        const y = target.getBoundingClientRect().bottom + window.scrollY - window.innerHeight;
        lenis.scrollTo(y, { duration: 3.5, easing: (t) => 1 - Math.pow(1 - Math.pow(t, 1.6), 4) });
      } else if (sel === 'body') glideToTop(lenis);
      else {
        const dist = Math.abs(target.getBoundingClientRect().top - 80);
        lenis.scrollTo(target, { duration: glideDuration(dist), offset: -80, easing: easeInOutCubic });
      }
    });
  });
  const block = document.querySelector<HTMLElement>('.block-main');
  const wrapper = block && block.querySelector<HTMLElement>('.block-wrapper');
  const content = block && block.querySelector<HTMLElement>('.content');
  const title = block && block.querySelector<HTMLElement>('.content__title');
  const desc = block && block.querySelector<HTMLElement>('.content__description');
  const button = block && block.querySelector<HTMLElement>('.content__button');
  const grid = block && block.querySelector<HTMLElement>('.gallery-grid');
  const items = block ? [...block.querySelectorAll<HTMLElement>('.gg-col-item')] : [];
  if (!block || !wrapper || !grid || !items.length || reduced) return;
  const more = block.querySelector<HTMLElement>('.content__more');
  const copy = [desc, button, more].filter(Boolean) as HTMLElement[];
  gsap.set(copy, { opacity: 0, pointerEvents: 'none' });
  const centreShift = ((content!.offsetHeight - title!.offsetHeight) / 2 / content!.offsetHeight) * 100;
  gsap.set(title, { yPercent: centreShift });
  const COLS = 3;
  const cols: HTMLElement[][] = Array.from({ length: COLS }, () => []);
  items.forEach((el, i) => cols[i % COLS].push(el));
  gsap.from(wrapper, { yPercent: -100, ease: 'none', scrollTrigger: { trigger: block, start: 'top bottom', end: 'top top', scrub: true } });
  gsap.from(title, { opacity: 0, duration: 0.7, ease: 'power1.out', scrollTrigger: { trigger: block, start: 'top 57%', toggleActions: 'play none none reset' } });
  const gridReveal = () => {
    const tl = gsap.timeline();
    const vh = window.innerHeight;
    const travel = vh - (vh - grid.offsetHeight) / 2;
    cols.forEach((col, c) => {
      const even = c % 2 === 0;
      tl.from(col, { y: travel * (even ? -1 : 1), stagger: { each: 0.06, from: even ? 'end' : 'start' }, ease: 'power1.inOut' }, 'grid-reveal');
    });
    return tl;
  };
  const gridSpread = () => {
    const narrow = matchMedia('(max-width: 860px)').matches;
    const scale = narrow ? 3 : 2.05;
    const shove = narrow ? 90 : 40;
    const tl = gsap.timeline({ defaults: { duration: 1, ease: 'power3.inOut' } });
    tl.to(grid, { scale });
    tl.to(cols[0], { xPercent: -40 }, '<');
    tl.to(cols[2], { xPercent: 40 }, '<');
    tl.to(cols[1], { yPercent: (i: number) => (i < Math.floor(cols[1].length / 2) ? -1 : 1) * shove, duration: 0.5, ease: 'power1.inOut' }, '-=0.5');
    return tl;
  };
  const showCopy = (on: boolean) => {
    gsap.timeline({ defaults: { overwrite: true } })
      .to(title, { yPercent: on ? 0 : centreShift, duration: 0.7, ease: 'power2.inOut' })
      .to(copy, { opacity: on ? 1 : 0, duration: 0.4, ease: 'power1.' + (on ? 'inOut' : 'out'), pointerEvents: on ? 'all' : 'none' }, on ? '-=90%' : '<');
  };
  const master = gsap.timeline({ scrollTrigger: { trigger: block, start: 'top 25%', end: 'bottom bottom', scrub: true } });
  master.add(gridReveal()).add(gridSpread(), '-=0.6').add(() => showCopy(master.scrollTrigger!.direction === 1), '-=0.32');
  gsap.utils.toArray<HTMLElement>('[data-rise]').forEach((el) => {
    const section = el.closest('section');
    const closing = section && section.querySelector('.close-row');
    gsap.from(el, { y: closing ? 34 : 56, opacity: 0, duration: 1, ease: 'power2.out', scrollTrigger: { trigger: el, start: closing ? 'top bottom' : 'top 88%', toggleActions: closing ? 'play none none none' : 'play none none reverse' } });
  });
  gsap.utils.toArray<HTMLElement>('[data-para]').forEach((el) => {
    const inner = el.firstElementChild;
    inner && gsap.fromTo(inner, { yPercent: -6 }, { yPercent: 6, ease: 'none', scrollTrigger: { trigger: el, start: 'top bottom', end: 'bottom top', scrub: true } });
  });
  document.querySelectorAll<HTMLElement>('[data-trio]').forEach((trio) => {
    const colsT = [...trio.querySelectorAll<HTMLElement>('[data-trio-col]')];
    if (!colsT.length) return;
    const vh = window.innerHeight;
    const tl = gsap.timeline({ scrollTrigger: { trigger: trio, start: 'top top', end: 'bottom bottom', scrub: true } });
    colsT.forEach((col, i) => { tl.from(col, { y: (i % 2 === 0 ? -1.15 : 1.15) * vh, ease: 'power1.inOut', duration: 1 }, i * 0.14); });
  });
  document.querySelectorAll<HTMLElement>('[data-drift]').forEach((group) => {
    [...group.children].forEach((child, i) => {
      gsap.fromTo(child, { y: (i % 2 === 0 ? 1 : -1) * 44 }, { y: (i % 2 === 0 ? -1 : 1) * 44, ease: 'none', scrollTrigger: { trigger: group, start: 'top bottom', end: 'bottom top', scrub: true } });
    });
  });
}
whenGridImagesReady(start);
