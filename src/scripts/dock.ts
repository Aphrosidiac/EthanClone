/** Phone dock: the sliding lens under the active tab and the galleries sheet.
 *  Ported from the reference's inline dock module; contract is the [data-dock*] markup in Dock.astro. */
const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;

function initDock() {
  const dock = document.querySelector<HTMLElement>('[data-dock]');
  if (!dock) return;
  const lens = dock.querySelector<HTMLElement>('[data-dock-lens]')!;
  const tabs = Array.from(dock.querySelectorAll<HTMLElement>('.dock-tab'));
  const sheet = document.querySelector<HTMLElement>('[data-dock-sheet]')!;
  const scrim = document.querySelector<HTMLElement>('[data-dock-scrim]')!;
  const galleriesBtn = dock.querySelector<HTMLElement>('[data-dock-galleries]')!;
  const visible = () => getComputedStyle(dock).display !== 'none';
  const activeTab = tabs.find((t) => t.dataset.tab === dock.dataset.active) || null;
  let sheetOpen = false;
  let hideTimer = 0;

  const moveLens = (to: HTMLElement | null, animate: boolean) => {
    if (!to) { lens.classList.remove('on'); return; }
    if (!animate) lens.style.transition = 'none';
    lens.style.width = to.offsetWidth + 'px';
    lens.style.transform = `translateX(${to.offsetLeft}px)`;
    if (!animate) { void lens.offsetWidth; lens.style.transition = ''; }
    lens.classList.add('on');
  };
  if (visible()) moveLens(activeTab, false);
  addEventListener('resize', () => { if (visible()) moveLens(sheetOpen ? galleriesBtn : activeTab, false); });

  // The dock rises only once the arrival loader has left (or was never there).
  let arrived = false;
  const arrive = () => {
    if (arrived) return;
    arrived = true;
    dock.classList.add('dock-in');
    if (visible()) moveLens(sheetOpen ? galleriesBtn : activeTab, false);
  };
  addEventListener('ew:loader-done', arrive, { once: true });
  let frames = 0;
  const poll = () => {
    if (arrived || document.querySelector('[data-ew-loader]')) return;
    if (++frames < 30) requestAnimationFrame(poll); else arrive();
  };
  requestAnimationFrame(poll);

  let thumbsLoaded = false;
  const loadThumbs = () => {
    if (thumbsLoaded) return;
    thumbsLoaded = true;
    sheet.querySelectorAll<HTMLElement>('[data-dock-thumb]').forEach((el) => {
      const src = el.getAttribute('data-dock-thumb');
      if (!src) return;
      const img = new Image();
      img.onload = () => { el.style.backgroundImage = `url(${src})`; el.classList.add('ld'); };
      img.src = src;
    });
  };
  const open = () => {
    if (sheetOpen) return;
    sheetOpen = true;
    clearTimeout(hideTimer);
    sheet.hidden = false; scrim.hidden = false;
    void sheet.offsetWidth;
    sheet.classList.add('on'); scrim.classList.add('on');
    galleriesBtn.setAttribute('aria-expanded', 'true');
    moveLens(galleriesBtn, !reduced);
    loadThumbs();
    const first = sheet.querySelector<HTMLElement>('a');
    first && first.focus({ preventScroll: true });
  };
  const close = () => {
    if (!sheetOpen) return;
    sheetOpen = false;
    sheet.classList.remove('on'); scrim.classList.remove('on');
    galleriesBtn.setAttribute('aria-expanded', 'false');
    moveLens(activeTab, !reduced);
    if (sheet.contains(document.activeElement)) galleriesBtn.focus({ preventScroll: true });
    clearTimeout(hideTimer);
    hideTimer = window.setTimeout(() => { sheet.hidden = true; scrim.hidden = true; }, reduced ? 0 : 450);
  };
  sheet.querySelectorAll('a').forEach((a) => a.addEventListener('click', close));
  galleriesBtn.addEventListener('click', () => (sheetOpen ? close() : open()));
  scrim.addEventListener('click', close);
  addEventListener('keydown', (e) => { if (e.key === 'Escape' && sheetOpen) { close(); galleriesBtn.focus(); } });
  addEventListener('scroll', () => sheetOpen && close(), { passive: true });
  addEventListener('pageshow', (e) => {
    if (!e.persisted) return;
    if (sheetOpen) {
      sheetOpen = false;
      sheet.classList.remove('on'); scrim.classList.remove('on');
      sheet.hidden = true; scrim.hidden = true;
      galleriesBtn.setAttribute('aria-expanded', 'false');
    }
    if (visible()) moveLens(activeTab, false);
  });
  tabs.forEach((t) => {
    if (t.tagName === 'A') t.addEventListener('click', () => { if (sheetOpen) close(); if (!reduced) moveLens(t, true); });
  });
}
initDock();
