/**
 * Editorial Exchange: hero entrance, scroll-scrubbed hero parallax (only when the browser lacks
 * CSS scroll-driven animations), the three-column wall whose middle "counter" column travels
 * against the scroll, phone-width column rebalancing, frame lightboxes and scroll cues.
 */
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Lenis from 'lenis';
import { wireCloseCascade } from '../lib/close-cascade';
import { glideToTop, easeInOutCubic, glideDuration } from '../lib/glide';

gsap.registerPlugin(ScrollTrigger);
const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
const nativeTimeline = typeof CSS !== 'undefined' && CSS.supports && CSS.supports('animation-timeline: view()');
let lenis: Lenis | null = null;
if (!reduced) {
  lenis = new Lenis({ lerp: 0.08, wheelMultiplier: 1.4 });
  lenis.on('scroll', ScrollTrigger.update);
  gsap.ticker.add((t) => lenis!.raf(t * 1000));
  gsap.ticker.lagSmoothing(0);
  addEventListener('ew:menu', (e: Event) => { (e as CustomEvent).detail.open ? lenis!.stop() : lenis!.start(); });
}
function splitWords(el: HTMLElement) {
  const text = (el.textContent || '').trim();
  el.textContent = '';
  const chars: HTMLElement[] = [];
  for (const part of text.split(/( +)/)) {
    if (!part) continue;
    if (!part.trim()) { el.appendChild(document.createTextNode(' ')); continue; }
    const w = document.createElement('span');
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
const hero = document.querySelector<HTMLElement>('[data-hero]');
const copy = document.querySelector<HTMLElement>('[data-ex-copy]');
const wall = document.querySelector<HTMLElement>('[data-ex-wall]');
(() => {
  if (!hero) return;
  if (reduced) { gsap.set(hero, { opacity: 1 }); return; }
  const rises = gsap.utils.toArray<HTMLElement>('[data-hero-rise]');
  const cascade = document.querySelector<HTMLElement>('[data-hero-cascade]');
  const chars = cascade ? splitWords(cascade) : null;
  chars && gsap.set(chars, { yPercent: 112 });
  rises.length && gsap.set(rises, { y: 42, opacity: 0 });
  let played = false;
  const play = () => {
    if (played) return;
    played = true;
    gsap.fromTo(hero, { opacity: 0, scale: 1.06 }, { opacity: 1, scale: 1, duration: 1.6, ease: 'power2.out' });
    chars && gsap.to(chars, { yPercent: 0, duration: 1.3, ease: 'expo.out', stagger: 0.05, delay: 0.3 });
    rises.length && gsap.to(rises, { y: 0, opacity: 1, duration: 1.1, ease: 'power2.out', stagger: 0.14, delay: chars ? 0.75 : 0.3 });
  };
  const img = hero.querySelector('img');
  if (img && img.complete && img.naturalWidth) play();
  else if (img) { img.addEventListener('load', play, { once: true }); img.addEventListener('error', play, { once: true }); }
  else play();
  setTimeout(play, 5000);
})();
if (!reduced && hero && !nativeTimeline) {
  const section = hero.closest('section') || hero.parentElement;
  const media = hero.querySelector('picture') || hero;
  gsap.to(media, { yPercent: 12, ease: 'none', scrollTrigger: { trigger: section, start: 'top top', end: 'bottom top', scrub: true, invalidateOnRefresh: true } });
  copy && gsap.to(copy, { y: -60, opacity: 0, ease: 'none', scrollTrigger: { trigger: section, start: 'top top', end: '70% top', scrub: true, invalidateOnRefresh: true } });
}
const counter = document.querySelector<HTMLElement>('[data-ex-counter]');
const colA = document.querySelector<HTMLElement>('.ex-col--a');
const colC = document.querySelector<HTMLElement>('.ex-col--c');
const phone = matchMedia('(max-width: 640px)');
const moved: HTMLElement[] = [];
// On phones the side columns stack; move frames from the last column into the counter column
// until the two sides are as even as they can be.
function rebalance() {
  if (!counter || !colA || !colC) return;
  if (!phone.matches) { while (moved.length) colC.appendChild(moved.pop()!); return; }
  let diff = colA.offsetHeight + colC.offsetHeight - counter.offsetHeight;
  while (colC.lastElementChild) {
    const el = colC.lastElementChild as HTMLElement;
    const h2 = 2 * el.getBoundingClientRect().height;
    if (Math.abs(diff - h2) >= Math.abs(diff)) break;
    moved.push(el);
    counter.appendChild(el);
    diff -= h2;
  }
}
rebalance();
phone.addEventListener && phone.addEventListener('change', () => { rebalance(); ScrollTrigger.refresh(); });
if (wall && counter && !reduced && nativeTimeline) {
  const setH = () => wall.style.setProperty('--ex-wall-h', `${wall.offsetHeight}px`);
  setH();
  addEventListener('load', setH);
  let rt: ReturnType<typeof setTimeout>;
  addEventListener('resize', () => { clearTimeout(rt); rt = setTimeout(() => { rebalance(); setH(); }, 200); });
}
if (wall && counter && !reduced && !nativeTimeline) {
  gsap.fromTo(counter, { y: () => -Math.max(0, counter.offsetHeight - window.innerHeight) }, { y: () => Math.max(0, wall.offsetHeight - window.innerHeight), ease: 'none', scrollTrigger: { trigger: wall, start: 'top top', end: 'bottom bottom', scrub: true, invalidateOnRefresh: true } });
  addEventListener('load', () => ScrollTrigger.refresh());
  let rt: ReturnType<typeof setTimeout>;
  addEventListener('resize', () => { clearTimeout(rt); rt = setTimeout(() => { rebalance(); ScrollTrigger.refresh(); }, 200); });
}
if (!reduced) gsap.utils.toArray<HTMLElement>('[data-rise]').forEach((el) => {
  gsap.from(el, { y: 40, opacity: 0, duration: 1, ease: 'power2.out', scrollTrigger: { trigger: el, start: 'top 92%', once: true } });
});
const exHero = document.querySelector<HTMLElement>('[data-ex-hero]');
if (exHero && wall) exHero.addEventListener('click', (e) => {
  const t = e.target as HTMLElement;
  if (t.closest && t.closest('a, button')) return;
  const top = wall.getBoundingClientRect().top + window.scrollY;
  if (reduced || !lenis) { window.scrollTo({ top, behavior: reduced ? 'auto' : 'smooth' }); return; }
  lenis.scrollTo(top, { duration: glideDuration(Math.abs(wall.getBoundingClientRect().top)), easing: easeInOutCubic });
});
const frames = [...document.querySelectorAll<HTMLElement>('.ex-frame[data-full]')];
if (frames.length) {
  const open = (f: HTMLElement) => {
    window.EWLightbox && window.EWLightbox.open(frames.map((o) => o.dataset.full!), frames.indexOf(f), frames.map((o) => o.querySelector('img')?.alt || ''));
  };
  frames.forEach((f) => {
    f.addEventListener('click', () => open(f));
    f.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); open(f); } });
  });
}
wireCloseCascade();
document.querySelectorAll<HTMLElement>('[data-scrolldown]').forEach((btn) => {
  btn.addEventListener('click', () => {
    const sel = btn.getAttribute('data-scrolldown')!;
    if (sel === 'body') { glideToTop(lenis); return; }
    const target = document.querySelector<HTMLElement>(sel);
    if (!target) return;
    const y = target.getBoundingClientRect().top + window.scrollY - 80;
    lenis ? lenis.scrollTo(y) : window.scrollTo({ top: y, behavior: reduced ? 'auto' : 'smooth' });
  });
});
