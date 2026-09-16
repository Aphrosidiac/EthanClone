/** Chapter rail for the long gallery/story pages: the side rail of chapter links, the phone "chip"
 *  with a progress bar, and the bottom sheet the chip opens. Scroll-to uses Lenis when handed one. */
import type Lenis from 'lenis';
import { easeInOutCubic, glideDuration } from './glide';

export function wireChapterRail(getLenis?: () => Lenis | null | undefined) {
  const rail = document.querySelector<HTMLElement>('[data-chap-rail]');
  if (!rail) return;
  const links = [...rail.querySelectorAll<HTMLAnchorElement>('.chap')];
  const targets = links.map((a) => document.querySelector<HTMLElement>(a.getAttribute('href')!));
  if (!targets.length || targets.some((t) => !t)) return;
  const sections = targets as HTMLElement[];
  const names = links.map((a) => (a.querySelector('.chap-name')?.textContent || a.textContent || '').replace(/ /g, ' ').trim());
  const smoothTo = (el: HTMLElement | null) => {
    const lenis = getLenis && getLenis();
    if (!el || !lenis) return false;
    const dist = Math.abs(el.getBoundingClientRect().top - 80);
    lenis.scrollTo(el, { duration: glideDuration(dist), offset: -80, easing: easeInOutCubic });
    return true;
  };
  const chip = document.createElement('button');
  chip.className = 'chap-chip';
  chip.type = 'button';
  chip.setAttribute('aria-haspopup', 'dialog');
  chip.setAttribute('aria-label', 'Chapters');
  chip.innerHTML = '<span class="chap-chip-name"></span><svg class="chap-chip-ico" width="11" height="11" viewBox="0 0 12 12" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M2.5 7.5 6 4l3.5 3.5"/></svg><span class="chap-chip-bar"></span>';
  const chipName = chip.querySelector<HTMLElement>('.chap-chip-name')!;
  const scrim = document.createElement('div');
  scrim.className = 'chap-scrim';
  const sheet = document.createElement('div');
  sheet.className = 'chap-sheet';
  sheet.setAttribute('role', 'dialog');
  sheet.setAttribute('aria-modal', 'true');
  sheet.setAttribute('aria-label', 'Chapters');
  sheet.setAttribute('data-lenis-prevent', '');
  sheet.hidden = true;
  scrim.hidden = true;
  sheet.innerHTML = '<span class="chap-sheet-grip" aria-hidden="true"></span><div class="chap-sheet-head"><span class="lab chap-sheet-kicker">Chapters</span><button type="button" class="lab chap-sheet-close" aria-label="Close chapters">Close</button></div><div class="chap-sheet-list"></div>';
  const list = sheet.querySelector<HTMLElement>('.chap-sheet-list')!;
  const sheetRows = names.map((name, i) => {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'chap-srow';
    b.innerHTML = `<span class="lab chap-snum">${String(i + 1).padStart(2, '0')}</span><span class="chap-sname">${name}</span>`;
    b.addEventListener('click', () => { closeSheet(); if (!smoothTo(sections[i])) location.hash = links[i].getAttribute('href')!; });
    list.appendChild(b);
    return b;
  });
  document.body.append(chip, scrim, sheet);

  let current = 0;
  const top = (el: HTMLElement) => el.getBoundingClientRect().top + window.scrollY;
  const progress = () => {
    const el = sections[current];
    if (!el) return;
    const a = top(el);
    const next = sections[current + 1];
    const b = next ? top(next) : document.documentElement.scrollHeight;
    const probe = window.scrollY + window.innerHeight * 0.4;
    const p = Math.max(0, Math.min(1, (probe - a) / Math.max(1, b - a)));
    chip.style.setProperty('--chap-progress', p.toFixed(3));
  };
  const setCurrent = (i: number) => {
    if (i < 0) return;
    current = i;
    links.forEach((a, k) => a.classList.toggle('is-active', k === i));
    sheetRows.forEach((b, k) => b.classList.toggle('is-active', k === i));
    chipName.textContent = names[i];
    progress();
  };
  const io = new IntersectionObserver((entries) => {
    entries.forEach((en) => { if (en.isIntersecting) setCurrent(sections.indexOf(en.target as HTMLElement)); });
  }, { rootMargin: '-38% 0px -57% 0px', threshold: 0 });
  sections.forEach((s) => io.observe(s));
  setCurrent(0);
  let ticking = false;
  addEventListener('scroll', () => { if (!ticking) { ticking = true; requestAnimationFrame(() => { ticking = false; progress(); }); } }, { passive: true });

  // The rail shows once the opening section has scrolled away and hides again over the closing rows.
  const opener = document.querySelector<HTMLElement>('main > section');
  const closeRow = document.querySelector<HTMLElement>('.close-row');
  const closer = closeRow ? closeRow.closest<HTMLElement>('section') : null;
  let pastOpener = false, atCloser = false;
  const apply = () => {
    const on = pastOpener && !atCloser;
    rail.classList.toggle('is-on', on);
    chip.classList.toggle('is-on', on);
    if (!on) closeSheet();
  };
  const io2 = new IntersectionObserver((entries) => {
    entries.forEach((en) => {
      if (en.target === opener) pastOpener = !en.isIntersecting;
      else if (en.target === closer) atCloser = en.isIntersecting;
    });
    apply();
  }, { threshold: 0 });
  opener && io2.observe(opener);
  closer && io2.observe(closer);
  if (!opener) { pastOpener = true; apply(); }

  let open = false;
  const openSheet = () => {
    if (open) return;
    open = true;
    scrim.hidden = false;
    sheet.hidden = false;
    requestAnimationFrame(() => { scrim.classList.add('is-open'); sheet.classList.add('is-open'); });
    document.documentElement.style.overflow = 'hidden';
    const lenis = getLenis && getLenis();
    lenis && lenis.stop();
    chip.setAttribute('aria-expanded', 'true');
    sheet.querySelector<HTMLElement>('.chap-sheet-close')!.focus({ preventScroll: true });
  };
  function closeSheet() {
    if (!open) return;
    open = false;
    scrim.classList.remove('is-open');
    sheet.classList.remove('is-open');
    document.documentElement.style.overflow = '';
    const lenis = getLenis && getLenis();
    lenis && lenis.start();
    chip.setAttribute('aria-expanded', 'false');
    setTimeout(() => { if (!open) { scrim.hidden = true; sheet.hidden = true; } }, 520);
    chip.focus({ preventScroll: true });
  }
  chip.addEventListener('click', () => (open ? closeSheet() : openSheet()));
  scrim.addEventListener('click', closeSheet);
  sheet.querySelector('.chap-sheet-close')!.addEventListener('click', closeSheet);
  addEventListener('keydown', (e) => { if (e.key === 'Escape' && open) closeSheet(); });
  addEventListener('ew:menu', (e: Event) => { const d = (e as CustomEvent).detail; if (d && d.open) closeSheet(); });
  links.forEach((a) => {
    a.addEventListener('click', (e) => {
      const el = document.querySelector<HTMLElement>(a.getAttribute('href')!);
      if (smoothTo(el)) e.preventDefault();
    });
  });
}
