/**
 * About: Lenis, hero entrance (kicker → word → photo → signature → preface), scrubbed parallax
 * on the hero word and photo, per-block reveals (index, title, body, photo) with a scrubbed
 * drift, the travel-row lightboxes and the "peek at the early stuff" accordion.
 * Two GSAP matchMedia contexts: desktop/fine pointer vs. narrow/coarse (word-by-word body reveal).
 */
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Lenis from 'lenis';
import { wireCloseCascade } from '../lib/close-cascade';

gsap.registerPlugin(ScrollTrigger);
let lenis: Lenis | null = null;
if (!matchMedia('(prefers-reduced-motion: reduce)').matches) {
  lenis = new Lenis({ lerp: 0.09, wheelMultiplier: 0.85 });
  lenis.on('scroll', ScrollTrigger.update);
  gsap.ticker.add((t) => lenis!.raf(t * 1000));
}
addEventListener('ew:menu', (e: Event) => {
  const d = (e as CustomEvent).detail;
  if (lenis) d.open ? lenis.stop() : lenis.start();
});
wireCloseCascade();

const DESKTOP = '(min-width: 861px) and (pointer: fine) and (prefers-reduced-motion: no-preference)';
const NARROW = '((max-width: 860px) or (pointer: coarse)) and (prefers-reduced-motion: no-preference)';

function heroPhoto(y: number) {
  const photo = document.querySelector<HTMLImageElement>('.ab-hero-photo');
  if (!photo) return;
  const tween = gsap.from(photo, { y, opacity: 0, scale: 1.04, duration: 1.2, ease: 'power2.out', paused: true });
  let played = false;
  const play = () => { if (!played) { played = true; tween.play(); ScrollTrigger.refresh(); } };
  if (photo.complete && photo.naturalWidth) play();
  else { photo.addEventListener('load', play, { once: true }); photo.addEventListener('error', play, { once: true }); }
  setTimeout(play, 1800);
}
function travelLightboxes() {
  document.querySelectorAll<HTMLElement>('.trav .trav-row').forEach((row) => {
    const frames = [...row.querySelectorAll<HTMLElement>('.trav-frame[data-full]')];
    const srcs = frames.map((f) => f.dataset.full!);
    frames.forEach((f, i) => f.addEventListener('click', () => { window.EWLightbox && window.EWLightbox.open(srcs, i); }));
  });
}
function peek() {
  const btn = document.querySelector<HTMLElement>('[data-peek]');
  const panel = document.querySelector<HTMLElement>('[data-peek-panel]');
  if (!btn || !panel) return;
  const cells = [...panel.querySelectorAll<HTMLElement>('.ab-early-cell[data-full]')];
  const srcs = cells.map((c) => c.dataset.full!);
  let open = false;
  const set = (v: boolean) => {
    open = v;
    btn.setAttribute('aria-expanded', v ? 'true' : 'false');
    btn.classList.toggle('is-open', v);
    panel.classList.toggle('is-open', v);
    panel.style.maxHeight = v ? panel.scrollHeight + 'px' : '0px';
    const label = btn.querySelector<HTMLElement>('.ab-peek-label');
    if (label) label.textContent = v ? 'Hide the early stuff' : 'Peek at the early stuff';
  };
  panel.style.maxHeight = '0px';
  btn.addEventListener('click', () => set(!open));
  cells.forEach((c, i) => c.addEventListener('click', () => { window.EWLightbox && window.EWLightbox.open(srcs, i); }));
  window.addEventListener('resize', () => { if (open) panel.style.maxHeight = panel.scrollHeight + 'px'; });
}
function travelIntros(y: number) {
  document.querySelectorAll<HTMLElement>('.trav').forEach((sec) => {
    const intro = sec.querySelector('.trav-intro');
    intro && gsap.from(intro, { y, opacity: 0, duration: 0.9, ease: 'power2.out', scrollTrigger: { trigger: sec, start: 'top 80%', toggleActions: 'play none none reverse' } });
  });
}
type Worded = HTMLElement & { _words?: Element[] };
function words(el: Worded) {
  if (el._words) return el._words;
  const out: Element[] = [];
  [...el.childNodes].forEach((node) => {
    if (node.nodeType === 3) {
      const frag = document.createDocumentFragment();
      node.textContent!.split(/(\s+)/).forEach((part) => {
        if (!part) return;
        if (/^\s+$/.test(part)) { frag.appendChild(document.createTextNode(part)); return; }
        const s = document.createElement('span');
        s.className = 'ab-word';
        s.textContent = part;
        frag.appendChild(s);
        out.push(s);
      });
      el.replaceChild(frag, node);
    } else if (node.nodeType === 1) out.push(node as Element);
  });
  el._words = out;
  return out;
}
const mm = gsap.matchMedia();
mm.add(DESKTOP, () => {
  gsap.from('.ab-hero-kicker', { opacity: 0, duration: 1, ease: 'power2.out', delay: 0.15 });
  gsap.from('.ab-hero-word', { yPercent: 12, opacity: 0, duration: 1.2, ease: 'power2.out', delay: 0.2 });
  heroPhoto(60);
  gsap.from('.ab-hero-sig', { opacity: 0, duration: 1, ease: 'power2.out', delay: 0.8 });
  gsap.from('.ab-preface', { opacity: 0, duration: 1.1, ease: 'power2.out', delay: 1 });
  gsap.to('.ab-hero-word', { y: -70, ease: 'none', scrollTrigger: { trigger: '.ab-hero', start: 'top top', end: 'bottom top', scrub: true } });
  gsap.to('.ab-hero-photo', { yPercent: 16, ease: 'none', scrollTrigger: { trigger: '.ab-hero', start: 'top top', end: 'bottom top', scrub: true } });
  travelIntros(28);
  document.querySelectorAll<HTMLElement>('.ab-block').forEach((block) => {
    const st = () => ({ trigger: block, start: 'top 86%', toggleActions: 'play none none reverse' });
    const turn = block.dataset.key === 'turn';
    const dx = block.dataset.side === 'right' ? 60 : -60;
    gsap.from(block.querySelector('.ab-index'), { opacity: 0, duration: 0.9, ease: 'power2.out', scrollTrigger: st() });
    gsap.from(block.querySelector('.ab-title'), { x: turn ? 0 : dx, y: 24, opacity: 0, duration: 1.1, ease: 'power2.out', delay: 0.08, scrollTrigger: st() });
    gsap.from(block.querySelector('.ab-body'), { y: 48, opacity: 0, duration: 1, ease: 'power2.out', delay: 0.2, scrollTrigger: st() });
    const fig = block.querySelector('.ab-photo-fig');
    if (fig) {
      gsap.from(fig, { y: 60, opacity: 0, scale: 1.03, duration: 1.2, ease: 'power2.out', delay: 0.15, scrollTrigger: st() });
      gsap.fromTo(fig, { y: 58 }, { y: -58, ease: 'none', scrollTrigger: { trigger: block, start: 'top bottom', end: 'bottom top', scrub: true } });
    }
    if (!turn) gsap.fromTo(block.querySelector('.ab-title'), { xPercent: block.dataset.side === 'right' ? 2.5 : -2.5 }, { xPercent: block.dataset.side === 'right' ? -2.5 : 2.5, ease: 'none', scrollTrigger: { trigger: block, start: 'top bottom', end: 'bottom top', scrub: true } });
  });
  return () => {};
});
mm.add(NARROW, () => {
  travelIntros(20);
  gsap.from('.ab-hero-kicker', { opacity: 0, duration: 1, ease: 'power2.out', delay: 0.15 });
  gsap.from('.ab-hero-word', { yPercent: 12, opacity: 0, duration: 1.2, ease: 'power2.out', delay: 0.2 });
  heroPhoto(46);
  gsap.from('.ab-hero-sig', { opacity: 0, duration: 1, ease: 'power2.out', delay: 0.8 });
  gsap.from('.ab-preface', { opacity: 0, duration: 1.1, ease: 'power2.out', delay: 1 });
  gsap.to('.ab-hero-word', { y: -60, ease: 'none', scrollTrigger: { trigger: '.ab-hero', start: 'top top', end: 'bottom top', scrub: true } });
  gsap.to('.ab-hero-photo', { yPercent: 14, ease: 'none', scrollTrigger: { trigger: '.ab-hero', start: 'top top', end: 'bottom top', scrub: true } });
  document.querySelectorAll<HTMLElement>('.ab-block').forEach((block) => {
    const st = () => ({ trigger: block, start: 'top 86%', toggleActions: 'play none none reverse' });
    const turn = block.dataset.key === 'turn';
    const dx = block.dataset.side === 'right' ? 34 : -34;
    gsap.from(block.querySelector('.ab-index'), { opacity: 0, y: 12, duration: 0.75, ease: 'power2.out', scrollTrigger: st() });
    gsap.from(block.querySelector('.ab-title'), { x: turn ? 0 : dx, y: 16, opacity: 0, duration: 0.95, ease: 'power2.out', delay: 0.05, scrollTrigger: st() });
    const body = block.querySelector<Worded>('.ab-body');
    if (body) gsap.from(words(body), { opacity: 0, y: 14, duration: 0.5, ease: 'power2.out', stagger: 0.018, delay: 0.14, scrollTrigger: st() });
    const fig = block.querySelector('.ab-photo-fig');
    if (fig) {
      gsap.from(fig, { y: 44, opacity: 0, scale: 1.03, duration: 1.1, ease: 'power2.out', delay: 0.1, scrollTrigger: st() });
      gsap.fromTo(fig, { y: 52 }, { y: -52, ease: 'none', scrollTrigger: { trigger: block, start: 'top bottom', end: 'bottom top', scrub: true } });
    }
    if (!turn) gsap.fromTo(block.querySelector('.ab-title'), { xPercent: block.dataset.side === 'right' ? 3.5 : -3.5 }, { xPercent: block.dataset.side === 'right' ? -3.5 : 3.5, ease: 'none', scrollTrigger: { trigger: block, start: 'top bottom', end: 'bottom top', scrub: true } });
  });
  return () => {};
});
travelLightboxes();
peek();
