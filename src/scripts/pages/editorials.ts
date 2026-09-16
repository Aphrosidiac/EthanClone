/**
 * Editorials: 3D card carousels per scene that rotate with scroll, character-staggered scene
 * copy, and the "preview" transition — the carousel folds away and a full grid flies in with
 * per-item 3D entrances; Escape / Close ✕ (the header back link is repurposed) reverses it.
 * Ported from the reference editorials module.
 */
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Lenis from 'lenis';
import { glideToTop, easeInOutCubic, glideDuration } from '../lib/glide';

gsap.registerPlugin(ScrollTrigger);
type Carousel = HTMLElement & { _scale?: number; _timeline?: gsap.core.Timeline };

if (matchMedia('(prefers-reduced-motion: reduce)').matches) document.documentElement.classList.add('reduced-motion');
else init();

function init() {
  const lenis = new Lenis({ lerp: 0.08, wheelMultiplier: 1.4 });
  lenis.on('scroll', ScrollTrigger.update);
  gsap.ticker.add((t) => lenis.raf(t * 1000));
  gsap.ticker.lagSmoothing(0);
  const sceneWrapper = document.querySelector<HTMLElement>('[data-scene-wrapper]');
  let busy = false;
  let openPreview: HTMLElement | null = null;
  let menuOpen = false;
  const backLink = document.querySelector<HTMLAnchorElement>('header.site .h-left a.h-link');
  const setBack = (previewing: boolean) => {
    if (!backLink) return;
    backLink.textContent = previewing ? 'Close ✕' : '← Home';
    backLink.setAttribute('href', previewing ? '#' : '/');
  };
  backLink?.addEventListener('click', (e) => { if (openPreview && !busy) { e.preventDefault(); closePreview(openPreview); } });
  addEventListener('ew:menu', (e: Event) => {
    menuOpen = (e as CustomEvent).detail.open;
    if (menuOpen) lenis.stop(); else if (!openPreview && !busy) lenis.start();
  });

  const charsOf = new Map<Element, HTMLElement[]>();
  const splitChars = (el: HTMLElement) => {
    const text = el.textContent || '';
    el.textContent = '';
    const chars = [...text].map((ch) => {
      const s = document.createElement('span');
      s.className = 'char';
      s.textContent = ch === ' ' ? ' ' : ch;
      el.appendChild(s);
      return s;
    });
    charsOf.set(el, chars);
    return chars;
  };
  document.querySelectorAll<HTMLElement>('.scene__text, .preview__text').forEach(splitChars);
  const charFade = (chars: HTMLElement[], dir: 'in' | 'out' = 'in', extra: gsap.TweenVars = {}) => {
    gsap.fromTo(chars, { autoAlpha: dir === 'in' ? 0 : 1 }, { autoAlpha: dir === 'in' ? 1 : 0, duration: 0.02, ease: 'none', stagger: { each: 0.04, from: dir === 'in' ? 'start' : 'end' }, ...extra });
  };
  // Lay the cells of a carousel around a ring whose radius scales with the card width.
  const layoutCarousel = (scene: HTMLElement) => {
    const carousel = scene.querySelector<Carousel>('.carousel')!;
    const cells = carousel.querySelectorAll<HTMLElement>('.carousel__cell');
    const scale = (cells[0].offsetWidth || 350) / 350;
    const radius = (parseFloat(scene.dataset.radius || '') || 500) * scale;
    const step = 360 / cells.length;
    cells.forEach((cell, i) => { cell.style.transform = `rotateY(${i * step}deg) translateZ(${radius}px)`; });
    carousel._scale = scale;
    gsap.set(carousel, { z: -550 * scale });
  };
  const wireScene = (scene: HTMLElement) => {
    const carousel = scene.querySelector<Carousel>('.carousel')!;
    const cards = scene.querySelectorAll<HTMLElement>('.card');
    const title = scene.querySelector<HTMLElement>('.scene__title');
    const chars = charsOf.get(scene.querySelector('.scene__text')!) || [];
    const kicker = scene.querySelector<HTMLElement>('.scene__kicker');
    carousel._timeline = gsap.timeline({ defaults: { ease: 'sine.inOut' }, scrollTrigger: { trigger: scene, start: 'top bottom', end: 'bottom top', scrub: true } });
    carousel._timeline
      .fromTo(carousel, { rotationY: 0 }, { rotationY: -180 }, 0)
      .fromTo(carousel, { rotationZ: 3, rotationX: 3 }, { rotationZ: -3, rotationX: -3 }, 0)
      .fromTo(cards, { filter: 'brightness(250%)' }, { filter: 'brightness(80%)', ease: 'power3' }, 0)
      .fromTo(cards, { rotationZ: 10 }, { rotationZ: -10, ease: 'none' }, 0);
    gsap.fromTo(title, { y: '7vh' }, { y: '-7vh', ease: 'none', scrollTrigger: { trigger: scene, start: 'top bottom', end: 'bottom top', scrub: true } });
    chars.length && charFade(chars, 'in', { scrollTrigger: { trigger: scene, start: 'top center', toggleActions: 'play none none reverse' } });
    kicker && gsap.fromTo(kicker, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.6, scrollTrigger: { trigger: scene, start: 'top center', toggleActions: 'play none none reverse' } });
  };
  const scenes = [...document.querySelectorAll<HTMLElement>('.scene')];
  scenes.forEach((s) => { layoutCarousel(s); wireScene(s); });

  // While a preview is open the page must not scroll under it.
  const keyBlock = (e: KeyboardEvent) => {
    if (!['ArrowUp', 'ArrowDown', 'PageUp', 'PageDown', 'Home', 'End', ' '].includes(e.key)) return;
    const t = e.target instanceof Element ? e.target : null;
    if (t && (t.closest('.preview') || t.closest('#menu-overlay'))) return;
    e.preventDefault();
  };
  const lockKeys = () => addEventListener('keydown', keyBlock, false);
  const unlockKeys = () => removeEventListener('keydown', keyBlock, false);
  const ringAt = (t: number) => ({ rotationY: gsap.utils.interpolate(0, -180, t), rotationX: gsap.utils.interpolate(3, -3, t), rotationZ: gsap.utils.interpolate(3, -3, t) });

  // Grid items fly in from / out to a point behind the viewport centre, ordered by distance from it.
  const flyGrid = ({ items, direction, onComplete }: { items: NodeListOf<HTMLElement> | HTMLElement[]; direction: 'in' | 'out'; onComplete?: () => void }) => {
    if (direction === 'in') gsap.set(items, { clearProps: 'all' });
    const cx = innerWidth / 2, cy = innerHeight / 2;
    const info = [...items].map((el) => {
      const r = el.getBoundingClientRect();
      const dx = cx - (r.left + r.width / 2), dy = cy - (r.top + r.height / 2);
      return { el, dx, dy, dist: Math.hypot(dx, dy), isLeft: r.left + r.width / 2 < cx };
    });
    const maxDist = Math.max(...info.map((i) => i.dist));
    const spread = 0.025 * (info.length - 1);
    let last: { delay: number; el?: HTMLElement } = { delay: -1 };
    info.forEach(({ el, dx, dy, dist, isLeft }) => {
      const norm = maxDist ? dist / maxDist : 0;
      const delay = (direction === 'in' ? 1 - norm : norm) * spread;
      const rotY = isLeft ? 100 : -100;
      if (direction === 'in') {
        gsap.fromTo(el, { transformOrigin: `50% 50% ${dx > 0 ? -dx * 0.8 : dx * 0.8}px`, autoAlpha: 0, y: dy * 0.5, scale: 0.5, rotationY: rotY }, { y: 0, scale: 1, rotationY: 0, autoAlpha: 1, duration: 0.4, ease: 'sine', delay: delay + 0.1 });
        gsap.fromTo(el, { z: -3500 }, { z: 0, duration: 0.3, ease: 'expo', delay });
      } else {
        if (delay > last.delay) last = { delay, el };
        gsap.to(el, { startAt: { transformOrigin: `50% 50% ${dx > 0 ? -dx * 0.8 : dx * 0.8}px` }, y: dy * 0.4, rotationY: rotY, scale: 0.4, autoAlpha: 0, duration: 0.4, ease: 'sine.in', delay });
        gsap.to(el, { z: -3500, duration: 0.4, ease: 'expo.in', delay: delay + 0.9 });
      }
    });
    if (direction === 'out') gsap.delayedCall(Math.max(0, last.delay) + 0.9 + 0.4 + 0.05, () => onComplete && onComplete());
  };
  const previewText = (preview: HTMLElement, dir: 'in' | 'out') => {
    preview.querySelectorAll<HTMLElement>('.preview__text').forEach((el) => {
      const chars = charsOf.get(el) || [];
      chars.length && charFade(chars, dir);
    });
  };
  const openScene = (titleEl: HTMLElement) => {
    if (busy || openPreview) return;
    busy = true;
    const scene = titleEl.closest<HTMLElement>('.scene')!;
    const carousel = scene.querySelector<Carousel>('.carousel')!;
    const cards = scene.querySelectorAll<HTMLElement>('.card');
    const chars = charsOf.get(scene.querySelector('.scene__text')!) || [];
    const kicker = scene.querySelector<HTMLElement>('.scene__kicker');
    const preview = document.querySelector<HTMLElement>(titleEl.querySelector('a')!.getAttribute('href')!)!;
    const scale = carousel._scale || 1;
    openPreview = preview;
    setBack(true);
    document.body.classList.add('ed-preview-open');
    const centreY = scene.getBoundingClientRect().top + window.scrollY - innerHeight / 2 + scene.offsetHeight / 2;
    ScrollTrigger.getAll().forEach((st) => st.disable(false));
    lockKeys();
    lenis.scrollTo(centreY, { duration: 1.4, force: true, lock: true, onComplete: () => lenis.stop() });
    gsap.timeline({
      defaults: { duration: 1.5, ease: 'power2.inOut' },
      onComplete: () => { busy = false; ScrollTrigger.getAll().forEach((st) => st.enable(false, false)); carousel._timeline!.scrollTrigger!.scroll(centreY); },
    })
      .to(chars, { autoAlpha: 0, duration: 0.02, ease: 'none', stagger: { each: 0.04, from: 'end' } }, 0)
      .to(kicker, { autoAlpha: 0, duration: 0.3 }, 0)
      .to(carousel, { rotationX: 90, rotationY: -360, z: -2000 * scale }, 0)
      .to(carousel, { duration: 2.5, ease: 'power3.inOut', z: 1500, rotationZ: 270, onComplete: () => gsap.set(sceneWrapper, { autoAlpha: 0 }) }, 0.7)
      .to(cards, { rotationZ: 0 }, 0)
      .add(() => {
        lenis.stop();
        preview.scrollTop = 0;
        document.querySelector('[data-nav]')?.classList.remove('nav-hide');
        gsap.set(preview, { pointerEvents: 'auto', autoAlpha: 1 });
        flyGrid({ items: preview.querySelectorAll<HTMLElement>('.grid__item'), direction: 'in' });
        previewText(preview, 'in');
        preview.focus({ preventScroll: true });
      }, '<+=1.9');
  };
  const closePreview = (preview: HTMLElement) => {
    if (busy || !preview) return;
    busy = true;
    const link = document.querySelector<HTMLElement>(`.scene__title a[href="#${preview.id}"]`)!;
    const scene = link.closest<HTMLElement>('.scene')!;
    const carousel = scene.querySelector<Carousel>('.carousel')!;
    const cards = scene.querySelectorAll<HTMLElement>('.card');
    const chars = charsOf.get(scene.querySelector('.scene__text')!) || [];
    const kicker = scene.querySelector<HTMLElement>('.scene__kicker');
    const scale = carousel._scale || 1;
    previewText(preview, 'out');
    flyGrid({ items: preview.querySelectorAll<HTMLElement>('.grid__item'), direction: 'out', onComplete: () => gsap.set(preview, { pointerEvents: 'none', autoAlpha: 0 }) });
    gsap.set(sceneWrapper, { autoAlpha: 1 });
    const { rotationX, rotationY, rotationZ } = ringAt(0.5);
    gsap.timeline({
      delay: 0.7,
      defaults: { duration: 1.3, ease: 'expo' },
      onComplete: () => {
        openPreview = null;
        busy = false;
        setBack(false);
        document.body.classList.remove('ed-preview-open');
        unlockKeys();
        if (!menuOpen) lenis.start();
        link.focus({ preventScroll: true });
      },
    })
      .fromTo(chars, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.02, ease: 'none', stagger: { each: 0.04, from: 'start' } })
      .to(kicker, { autoAlpha: 1, duration: 0.4 }, 0.3)
      .fromTo(carousel, { z: -550 * scale, rotationX, rotationY: -720, rotationZ, yPercent: 300 }, { rotationY, yPercent: 0 }, 0)
      .fromTo(cards, { autoAlpha: 0 }, { autoAlpha: 1 }, 0.3);
  };
  scenes.forEach((scene) => {
    scene.addEventListener('click', (e) => {
      if (busy || openPreview) return;
      e.preventDefault();
      const href = scene.dataset.href;
      if (href) {
        const t = e.target as HTMLElement;
        if (t.closest && t.closest('a[href]')) return;
        document.body.classList.add('is-leaving');
        setTimeout(() => { window.location.href = href; }, 300);
        return;
      }
      openScene(scene.querySelector<HTMLElement>('.scene__title')!);
    });
  });
  const hero = document.querySelector<HTMLElement>('.ed-hero');
  if (hero && scenes[0]) {
    hero.style.cursor = 'pointer';
    hero.addEventListener('click', () => { if (!busy && !openPreview) lenis.scrollTo(scenes[0], { duration: 1.4 }); });
  }
  document.querySelectorAll<HTMLElement>('[data-preview-close]').forEach((el) => el.addEventListener('click', (e) => { e.preventDefault(); if (openPreview && !busy) closePreview(openPreview); }));
  const lightboxOpen = () => document.querySelector<HTMLElement>('[data-ew-lightbox]')?.style.opacity?.startsWith('1');
  document.querySelectorAll<HTMLElement>('.preview .grid__item').forEach((item) => {
    const open = () => {
      const all = [...item.closest('.grid')!.querySelectorAll<HTMLElement>('.grid__item')];
      const srcs = all.map((i) => i.dataset.full).filter(Boolean) as string[];
      window.EWLightbox && srcs.length && window.EWLightbox.open(srcs, all.indexOf(item));
    };
    item.addEventListener('click', open);
    item.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); open(); } });
  });
  addEventListener('keydown', (e) => { if (e.key === 'Escape' && !menuOpen && !lightboxOpen() && openPreview && !busy) closePreview(openPreview); });
  gsap.from('[data-hero-rise]', { y: 42, opacity: 0, duration: 1.1, ease: 'power2.out', stagger: 0.14, delay: 0.25 });
  gsap.utils.toArray<HTMLElement>('[data-rise]').forEach((el) => {
    const section = el.closest('section');
    const cta = section && section.querySelector('.ed-cta');
    gsap.from(el, { y: cta ? 34 : 48, opacity: 0, duration: 1, ease: 'power2.out', scrollTrigger: { trigger: el, start: cta ? 'top bottom' : 'top 90%', toggleActions: cta ? 'play none none none' : 'play none none reverse' } });
  });
  const hint = () => {
    const v = window.scrollY < 40 ? '1' : '0';
    document.querySelectorAll<HTMLElement>('[data-scrollhint], [data-cornerstrip]').forEach((el) => { el.style.opacity = v; });
  };
  addEventListener('scroll', hint, { passive: true });
  setTimeout(hint, 100);
  document.querySelectorAll<HTMLElement>('[data-scrolldown]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const sel = btn.getAttribute('data-scrolldown')!;
      const target = document.querySelector<HTMLElement>(sel);
      if (!target) return;
      if (sel === 'body') { glideToTop(lenis); return; }
      const dist = Math.abs(target.getBoundingClientRect().top - 80);
      lenis.scrollTo(target, { duration: glideDuration(dist), offset: -80, easing: easeInOutCubic });
    });
  });
  let rt: ReturnType<typeof setTimeout>;
  addEventListener('resize', () => {
    clearTimeout(rt);
    rt = setTimeout(() => {
      scenes.forEach(layoutCarousel);
      ScrollTrigger.refresh();
      if (openPreview) {
        const link = document.querySelector<HTMLElement>(`.scene__title a[href="#${openPreview.id}"]`);
        const scene = link && link.closest<HTMLElement>('.scene');
        if (scene) {
          const top = scene.getBoundingClientRect().top + window.scrollY;
          window.scrollTo(0, top - innerHeight / 2 + scene.offsetHeight / 2);
        }
      }
    }, 150);
  });
}
