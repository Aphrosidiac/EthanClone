/** Stories index: word-cascade hover on [data-cascade] titles, entrance gate, plate reveal + parallax. */
import { gsap } from 'gsap';
import { wireCloseCascade } from '../lib/close-cascade';
import { revealAfterLoader } from '../lib/reveal-gate';

const FINE = '(hover: hover) and (pointer: fine)';
const chars = (word: string, cls: string, bucket: HTMLElement[]) => {
  const w = document.createElement('span');
  w.className = cls;
  for (const ch of word) {
    const s = document.createElement('span');
    s.className = 'ct-ch';
    s.textContent = ch;
    w.appendChild(s);
    bucket.push(s);
  }
  return w;
};
type Cascaded = HTMLElement & { _cascaded?: boolean; _charTl?: gsap.core.Timeline };
function wireCascades(root: ParentNode = document) {
  if (!matchMedia(FINE).matches || matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  for (const el of root.querySelectorAll<Cascaded>('[data-cascade]')) {
    if (el._cascaded) continue;
    el._cascaded = true;
    const text = (el.textContent || '').trim();
    if (!text) continue;
    el.textContent = '';
    const white: HTMLElement[] = [], red: HTMLElement[] = [];
    for (const part of text.split(/(\s+)/)) {
      if (!part) continue;
      if (!part.trim()) { el.appendChild(document.createTextNode(' ')); continue; }
      const w = document.createElement('span');
      w.className = 'ct-w';
      const base = chars(part, 'ct-w-base', white);
      const over = chars(part, 'ct-w-red', red);
      over.setAttribute('aria-hidden', 'true');
      w.append(base, over);
      el.appendChild(w);
    }
    if (!white.length) continue;
    gsap.set(red, { yPercent: 115 });
    const tl = gsap.timeline({ paused: true })
      .to(white, { duration: 0.45, ease: 'power2.in', yPercent: -115, stagger: 0.016 }, 0)
      .to(red, { duration: 0.85, ease: 'expo.out', yPercent: 0, stagger: 0.02 }, 0.12);
    const host = (el.closest<Cascaded>('.ct-host') || el) as Cascaded;
    host._charTl = tl;
    host.addEventListener('mouseenter', () => tl.timeScale(1).play());
    host.addEventListener('mouseleave', () => tl.timeScale(1.3).reverse());
    host.addEventListener('focus', () => tl.timeScale(1).play());
    host.addEventListener('blur', () => tl.timeScale(1.3).reverse());
  }
}
wireCloseCascade();
wireCascades();
revealAfterLoader('revealed');
(function plates() {
  const plates = [...document.querySelectorAll<HTMLElement>('.st-plate')];
  if (!plates.length) return;
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  if (!reduced.matches && 'IntersectionObserver' in window) {
    const io = new IntersectionObserver((entries) => {
      for (const en of entries) if (en.isIntersecting) { en.target.classList.add('in'); io.unobserve(en.target); }
    }, { rootMargin: '0px 0px -12% 0px' });
    plates.forEach((p) => io.observe(p));
  } else plates.forEach((p) => p.classList.add('in'));
  const media = plates.map((p) => p.querySelector<HTMLElement>('.st-plate-media')).filter(Boolean) as HTMLElement[];
  if (reduced.matches || !media.length) return;
  let ticking = false;
  const update = () => {
    ticking = false;
    const vh = innerHeight;
    for (const m of media) {
      const r = m.getBoundingClientRect();
      if (r.bottom < -200 || r.top > vh + 200) continue;
      const t = Math.min(1, Math.max(0, (vh - r.top) / (vh + r.height)));
      m.style.setProperty('--para', `${(-18 * t).toFixed(2)}%`);
    }
  };
  const schedule = () => { if (!ticking) { ticking = true; requestAnimationFrame(update); } };
  addEventListener('scroll', schedule, { passive: true });
  addEventListener('resize', schedule);
  update();
})();
