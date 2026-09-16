/**
 * Gallery pages (weddings, engagements, commercial): Lenis smooth scroll, the hero entrance
 * (fade+scale, cascading title, rising lines), scroll-scrubbed parallax and drift, the review
 * rotator, the hover-reveal images on index-style rows, scroll-down cues, the "block-main"
 * pinned grid choreography, the close-row cascade and the chapter rail.
 * Ported from the reference engagements module (shared by weddings and commercial).
 */
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Lenis from 'lenis';
import { wireCloseCascade } from '../lib/close-cascade';
import { wireChapterRail } from '../lib/chap-rail';
import { glideToTop, easeInOutCubic, glideDuration } from '../lib/glide';

gsap.registerPlugin(ScrollTrigger);
ScrollTrigger.config({ ignoreMobileResize: true });
const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
const coarse = matchMedia('(pointer: coarse)').matches;

let lenis: Lenis | null = null;
if (!reduced) {
  lenis = new Lenis({ lerp: 0.08, wheelMultiplier: 1.4 });
  lenis.on('scroll', ScrollTrigger.update);
  gsap.ticker.add((t) => lenis!.raf(t * 1000));
  gsap.ticker.lagSmoothing(0);
}
addEventListener('ew:menu', (e: Event) => {
  const d = (e as CustomEvent).detail;
  if (lenis) d.open ? lenis.stop() : lenis.start();
});

/* ---------------------------------------------------------------- reviews rotator */
function wireReviews() {
  const src = document.querySelector<HTMLElement>('[data-rev-src]');
  const stage = document.querySelector<HTMLElement>('[data-rev-stage]');
  if (!src || !stage) return;
  const reviews = [...src.children].map((li) => {
    const p = li.querySelector<HTMLElement>('p');
    const lab = li.querySelector<HTMLElement>('.lab');
    return p ? { text: p.innerText.trim(), name: lab ? lab.innerText.trim() : '' } : null;
  }).filter(Boolean) as { text: string; name: string }[];
  if (!reviews.length) return;
  const ORDER = ['Eunjee', 'Geraldine', 'Daniel', 'Christine', 'Lastlook', 'Houston', 'Jane', 'Eli', 'Emma', 'Morgan', 'Maya', 'Ryan'];
  const rank = (r: { name: string }) => { const i = ORDER.findIndex((n) => r.name.indexOf(n) === 0); return i < 0 ? 99 : i; };
  reviews.sort((a, b) => rank(a) - rank(b));
  const quote = stage.querySelector<HTMLElement>('[data-rev-quote]')!;
  const text = stage.querySelector<HTMLElement>('[data-rev-text]')!;
  const name = stage.querySelector<HTMLElement>('[data-rev-name]')!;
  const count = stage.querySelector<HTMLElement>('[data-rev-count]')!;
  const bar = stage.querySelector<HTMLElement>('[data-rev-bar]');
  // Reserve the height of the tallest quote so the block does not jump between reviews.
  const reserve = () => {
    const probe = text.cloneNode(false) as HTMLElement;
    probe.style.position = 'absolute';
    probe.style.visibility = 'hidden';
    probe.style.height = 'auto';
    probe.style.width = text.getBoundingClientRect().width + 'px';
    stage.appendChild(probe);
    let max = 0;
    reviews.forEach((r) => { probe.textContent = '"' + r.text + '"'; max = Math.max(max, probe.offsetHeight); });
    probe.remove();
    const nameH = name.offsetHeight + parseFloat(getComputedStyle(name).marginTop || '0');
    quote.style.minHeight = Math.ceil(max + nameH) + 'px';
  };
  reserve();
  let rt: ReturnType<typeof setTimeout>;
  addEventListener('resize', () => { clearTimeout(rt); rt = setTimeout(reserve, 200); });
  document.fonts && document.fonts.ready && document.fonts.ready.then(reserve);
  let i = 0, busy = false, timer: ReturnType<typeof setInterval> | null = null;
  const set = (n: number) => {
    i = (n + reviews.length) % reviews.length;
    text.textContent = '"' + reviews[i].text + '"';
    name.textContent = reviews[i].name;
    count.textContent = String(i + 1).padStart(2, '0') + ' / ' + String(reviews.length).padStart(2, '0');
  };
  const restartBar = () => {
    if (!bar) return;
    bar.style.transition = 'none';
    bar.style.transform = 'scaleX(0)';
    void bar.offsetWidth;
    bar.style.transition = 'transform 8s linear';
    bar.style.transform = 'scaleX(1)';
  };
  const arm = () => { if (timer) clearInterval(timer); timer = setInterval(() => go(i + 1), 8000); restartBar(); };
  const go = (n: number) => {
    if (busy) return;
    busy = true;
    arm();
    gsap.to(quote, { opacity: 0, y: -14, duration: 0.28, ease: 'power2.in', onComplete: () => {
      set(n);
      gsap.fromTo(quote, { opacity: 0, y: 16 }, { opacity: 1, y: 0, duration: 0.5, ease: 'power2.out', onComplete: () => (busy = false) });
    } });
  };
  set(0);
  const io = new IntersectionObserver((entries) => { if (entries.some((en) => en.isIntersecting)) { arm(); io.disconnect(); } }, { threshold: 0.45 });
  io.observe(stage);
  stage.addEventListener('click', (e) => { (e.target as HTMLElement).closest('[data-rev-prev]') ? go(i - 1) : go(i + 1); });
}

/* ---------------------------------------------------------------- scroll hint + corner strip fade */
function wireScrollHint() {
  const update = () => {
    const atTop = window.scrollY < 40;
    const hint = document.querySelector<HTMLElement>('[data-scrollhint]');
    if (hint) hint.style.opacity = atTop ? '1' : '0';
    const strip = document.querySelector<HTMLElement>('[data-cornerstrip]');
    if (strip) { strip.style.opacity = atTop ? '1' : '0'; strip.style.pointerEvents = atTop ? '' : 'none'; }
  };
  addEventListener('scroll', update, { passive: true });
  setTimeout(update, 100);
}

/* ---------------------------------------------------------------- hero entrance */
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
  rises.length && gsap.set(rises, { y: 42, opacity: 0 });
  let played = false;
  const play = () => {
    if (played) return;
    played = true;
    gsap.fromTo(hero, { opacity: 0, scale: 1.04 }, { opacity: 1, scale: 1, duration: 1.4, ease: 'power2.out' });
    chars && gsap.to(chars, { yPercent: 0, duration: 1.3, ease: 'expo.out', stagger: 0.05, delay: 0.25 });
    rises.length && gsap.to(rises, { y: 0, opacity: 1, duration: 1.1, ease: 'power2.out', stagger: 0.14, delay: chars ? 0.65 : 0.25 });
  };
  const img = hero.querySelector('img');
  if (img) {
    if (img.complete && img.naturalWidth) play();
    else { img.addEventListener('load', play, { once: true }); img.addEventListener('error', play, { once: true }); }
    setTimeout(play, 5000);
    return;
  }
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

/* ---------------------------------------------------------------- scroll-driven motion */
if (!reduced) {
  gsap.utils.toArray<HTMLElement>('[data-rise]').forEach((el) => {
    const section = el.closest('section');
    const closing = section && section.querySelector('.close-row');
    gsap.from(el, {
      y: closing ? 34 : 48, opacity: 0, duration: 1, ease: 'power2.out',
      scrollTrigger: { trigger: el, start: closing ? 'top bottom' : 'top 90%', toggleActions: closing ? 'play none none none' : 'play none none reverse' },
    });
  });
  gsap.utils.toArray<HTMLElement>('[data-para]').forEach((el) => {
    const inner = el.firstElementChild;
    inner && gsap.fromTo(inner, { yPercent: -6 }, { yPercent: 6, ease: 'none', scrollTrigger: { trigger: el, start: 'top bottom', end: 'bottom top', scrub: true, invalidateOnRefresh: true } });
  });
  const hero = document.querySelector<HTMLElement>('[data-hero]');
  hero && gsap.to(hero, { yPercent: 10, ease: 'none', scrollTrigger: { trigger: hero.parentElement, start: 'top top', end: 'bottom top', scrub: true, invalidateOnRefresh: true } });
  document.querySelectorAll<HTMLElement>('[data-drift]').forEach((group) => {
    [...group.children].forEach((child, i) => {
      gsap.fromTo(child, { y: (i % 2 === 0 ? 1 : -1) * 44 }, { y: (i % 2 === 0 ? -1 : 1) * 44, ease: 'none', scrollTrigger: { trigger: group, start: 'top bottom', end: 'bottom top', scrub: true, invalidateOnRefresh: true } });
    });
  });
}

/* ---------------------------------------------------------------- hover reveal (index-style rows) */
const mouse = { x: 0, y: 0 }, last = { x: 0, y: 0 }, vel = { x: 0, y: 0 };
addEventListener('mousemove', (e) => { mouse.x = e.clientX; mouse.y = e.clientY; });
function wireHoverReveal() {
  if (reduced || coarse) return;
  const map = (v: number, a: number, b: number, c: number, d: number) => ((v - a) * (d - c)) / (b - a) + c;
  const lerp = (a: number, b: number, t: number) => (1 - t) * a + t * b;
  const clamp = (v: number, a: number, b: number) => (v <= a ? a : v >= b ? b : v);
  const AMT = 0.06;
  const st = {
    tx: { previous: 0, current: 0, amt: AMT },
    ty: { previous: 0, current: 0, amt: AMT },
    rotation: { previous: 0, current: 0, amt: AMT },
    brightness: { previous: 1, current: 1, amt: AMT },
  };
  [...document.querySelectorAll<HTMLElement>('[data-idx-item]')].forEach((row, i) => {
    const reveal = row.querySelector<HTMLElement>('.hover-reveal');
    const inner = row.querySelector<HTMLElement>('.hover-reveal__inner');
    const image = row.querySelector<HTMLElement>('.hover-reveal__img');
    if (!reveal) return;
    const ax = i % 2 === 0 ? 0.3 : 0.7;
    let bounds = { el: row.getBoundingClientRect(), reveal: reveal.getBoundingClientRect() };
    let first = false, req: number | undefined;
    const calcBounds = () => { bounds = { el: row.getBoundingClientRect(), reveal: reveal.getBoundingClientRect() }; };
    const showImage = () => {
      gsap.killTweensOf([inner, image]);
      gsap.timeline({ onStart: () => { reveal.style.opacity = '1'; gsap.set(row, { zIndex: 30 }); } })
        .to(inner, { duration: 0.2, ease: 'sine.out', startAt: { x: vel.x < 0 ? '-100%' : '100%' }, x: '0%' })
        .to(image, { duration: 0.2, ease: 'sine.out', startAt: { x: vel.x < 0 ? '100%' : '-100%' }, x: '0%' }, 0);
    };
    const hideImage = () => {
      gsap.killTweensOf([inner, image]);
      gsap.timeline({ onStart: () => gsap.set(row, { zIndex: 1 }), onComplete: () => gsap.set(reveal, { opacity: 0 }) })
        .to(inner, { duration: 0.2, ease: 'sine.out', x: vel.x < 0 ? '100%' : '-100%' })
        .to(image, { duration: 0.2, ease: 'sine.out', x: vel.x < 0 ? '-100%' : '100%' }, 0);
    };
    const render = () => {
      req = undefined;
      if (first) calcBounds();
      const speed = clamp(Math.abs(last.x - mouse.x), 0, 100);
      vel.x = last.x - mouse.x;
      vel.y = last.y - mouse.y;
      last.x = mouse.x;
      last.y = mouse.y;
      st.tx.current = Math.abs(mouse.x - bounds.el.left) - bounds.reveal.width * ax;
      st.ty.current = Math.abs(mouse.y - bounds.el.top) - bounds.reveal.height * 0.32;
      st.rotation.current = first ? 0 : map(speed, 0, 100, 0, vel.x < 0 ? 60 : -60);
      st.brightness.current = first ? 1 : map(speed, 0, 100, 1, 3.2);
      st.tx.previous = first ? st.tx.current : lerp(st.tx.previous, st.tx.current, st.tx.amt);
      st.ty.previous = first ? st.ty.current : lerp(st.ty.previous, st.ty.current, st.ty.amt);
      st.rotation.previous = first ? st.rotation.current : lerp(st.rotation.previous, st.rotation.current, st.rotation.amt);
      st.brightness.previous = first ? st.brightness.current : lerp(st.brightness.previous, st.brightness.current, st.brightness.amt);
      gsap.set(reveal, { x: st.tx.previous, y: st.ty.previous, rotation: st.rotation.previous, filter: 'brightness(' + st.brightness.previous + ')' });
      first = false;
      loop();
    };
    const loop = () => { if (!req) req = requestAnimationFrame(render); };
    const stop = () => { if (req) { cancelAnimationFrame(req); req = undefined; } };
    row.addEventListener('mouseenter', () => { showImage(); first = true; loop(); });
    row.addEventListener('mouseleave', () => { stop(); hideImage(); });
  });
}

/* ---------------------------------------------------------------- scroll cues */
function wireScrollDown() {
  document.querySelectorAll<HTMLElement>('[data-scrolldown]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const target = document.querySelector<HTMLElement>(btn.getAttribute('data-scrolldown')!);
      if (!target) return;
      const through = btn.hasAttribute('data-scrolldown-through');
      if (!lenis) {
        btn.getAttribute('data-scrolldown') === 'body'
          ? window.scrollTo({ top: 0, behavior: 'smooth' })
          : target.scrollIntoView({ behavior: 'smooth', block: through ? 'end' : 'start' });
        return;
      }
      if (through) {
        const y = target.getBoundingClientRect().bottom + window.scrollY - window.innerHeight;
        lenis.scrollTo(y, { duration: 3.5, easing: (t) => 1 - Math.pow(1 - Math.pow(t, 1.6), 4) });
      } else if (btn.getAttribute('data-scrolldown') === 'body') glideToTop(lenis);
      else {
        const dist = Math.abs(target.getBoundingClientRect().top - 80);
        lenis.scrollTo(target, { duration: glideDuration(dist), offset: -80, easing: easeInOutCubic });
      }
    });
  });
}

/* ---------------------------------------------------------------- pinned grid block */
function wireBlockMain() {
  const block = document.querySelector<HTMLElement>('.block-main');
  if (!block || reduced) return;
  const wrapper = block.querySelector<HTMLElement>('.block-wrapper');
  const title = block.querySelector<HTMLElement>('.content__title');
  const desc = block.querySelector<HTMLElement>('.content__description');
  const grid = block.querySelector<HTMLElement>('.gallery-grid');
  const items = [...block.querySelectorAll<HTMLElement>('.gg-col-item')];
  if (!wrapper || !title || !desc || !grid || !items.length) return;
  let built = false;
  const build = () => {
    if (built) return;
    built = true;
    const more = block.querySelector<HTMLElement>('.content__more');
    const copy = more ? [desc, more] : desc;
    gsap.set(copy, { opacity: 0, pointerEvents: 'none' });
    const outer = (el: HTMLElement) => el.offsetHeight + parseFloat(getComputedStyle(el).marginTop || '0');
    const copyH = outer(desc) + (more ? outer(more) : 0);
    gsap.set(title, { y: copyH / 2 });
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
      gsap.timeline({ defaults: { overwrite: 'auto' } })
        .to(title, { y: on ? 0 : copyH / 2, duration: 0.7, ease: 'power2.inOut' })
        .to(copy, { opacity: on ? 1 : 0, duration: 0.4, ease: 'power1.' + (on ? 'inOut' : 'out'), pointerEvents: on ? 'all' : 'none' }, on ? '-=90%' : '<');
    };
    const master = gsap.timeline({ scrollTrigger: { trigger: block, start: 'top 25%', end: 'bottom bottom', scrub: true } });
    master.add(gridReveal()).add(gridSpread(), '-=0.6').add(() => showCopy(master.scrollTrigger!.direction === 1), '-=0.32');
    ScrollTrigger.refresh();
  };
  // Wait for the grid's background images (or 6s) before measuring.
  const srcs = items.map((el) => /url\(["']?([^"')]+)/.exec((el.firstElementChild as HTMLElement | null)?.style.backgroundImage || '')?.[1]).filter(Boolean) as string[];
  let pending = srcs.length;
  if (!pending) { build(); return; }
  const one = () => { if (--pending <= 0) build(); };
  srcs.forEach((s) => { const img = new Image(); img.onload = one; img.onerror = one; img.src = s; });
  setTimeout(() => { if (pending > 0) { pending = 0; build(); } }, 6000);
}

setTimeout(wireReviews, 80);
wireScrollHint();
wireHoverReveal();
wireScrollDown();
wireBlockMain();
wireCloseCascade();
wireChapterRail(() => lenis);
if (!reduced && document.fonts && document.fonts.ready) document.fonts.ready.then(() => ScrollTrigger.refresh());
