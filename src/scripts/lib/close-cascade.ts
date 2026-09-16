/** The closing "next gallery" rows: on hover the display text cascades out in white and back in
 *  red, character by character. Pointer position is tracked by hand so a row lit while scrolling
 *  under a still pointer can be un-lit. */
import { gsap } from 'gsap';

type CloseRow = HTMLElement & { _tl?: gsap.core.Timeline; _hot?: boolean; _cascadeIn?: () => void; _cascadeOut?: (fast?: boolean) => void };

export function wireCloseCascade() {
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const rows: CloseRow[] = [];
  let lastMove = -1e9, px = -1, py = -1;
  const track = (e: PointerEvent) => { px = e.clientX; py = e.clientY; lastMove = performance.now(); };
  addEventListener('pointermove', track, { passive: true });
  addEventListener('pointerdown', track, { passive: true });
  const under = (el: HTMLElement) => {
    if (px < 0) return false;
    const r = el.getBoundingClientRect();
    const slack = Math.max(16, innerWidth * 0.014);
    return px >= r.left - slack && px <= r.right + slack && py >= r.top && py <= r.bottom;
  };
  document.querySelectorAll<CloseRow>('.close-row').forEach((row) => {
    const disp = row.querySelector<HTMLElement>('.disp');
    if (!disp || disp.dataset.split) return;
    disp.dataset.split = '1';
    const text = disp.textContent!.trim();
    disp.textContent = '';
    const wrap = document.createElement('span');
    wrap.style.display = 'block';
    wrap.style.overflow = 'hidden';
    const base = document.createElement('span');
    base.style.display = 'inline-block';
    base.style.position = 'relative';
    const over = document.createElement('span');
    over.style.position = 'absolute';
    over.style.left = '0';
    over.style.top = '0';
    over.style.whiteSpace = 'pre';
    over.style.color = 'var(--red)';
    over.setAttribute('aria-hidden', 'true');
    const white: HTMLElement[] = [], red: HTMLElement[] = [];
    const fill = (parent: HTMLElement, bucket: HTMLElement[]) => {
      for (const ch of text) {
        const s = document.createElement('span');
        s.style.display = 'inline-block';
        s.style.willChange = 'transform';
        s.textContent = ch === ' ' ? ' ' : ch;
        bucket.push(s);
        parent.appendChild(s);
      }
    };
    fill(base, white);
    fill(over, red);
    base.appendChild(over);
    wrap.appendChild(base);
    disp.appendChild(wrap);
    gsap.set(red, { yPercent: 115 });
    const tl = gsap.timeline({ paused: true })
      .to(white, { duration: 0.45, ease: 'power2.in', yPercent: -115, stagger: 0.016 }, 0)
      .to(red, { duration: 0.85, ease: 'expo.out', yPercent: 0, stagger: 0.02 }, 0.12);
    row._tl = tl;
    row._cascadeIn = () => { row._hot = true; tl.timeScale(1).play(); };
    row._cascadeOut = (fast?: boolean) => { row._hot = false; tl.timeScale(fast ? 2.4 : 1.35).reverse(); };
    row.addEventListener('mouseenter', () => {
      // A mouseenter with no recent pointer movement is the page scrolling under a still cursor.
      if (performance.now() - lastMove > 160) return;
      settle(row);
      row._cascadeIn!();
    });
    row.addEventListener('mouseleave', () => row._cascadeOut!());
    rows.push(row);
  });
  if (!rows.length) return;
  function settle(except?: CloseRow) {
    rows.forEach((r) => {
      if (r === except || !r._hot) return;
      if (except) r._cascadeOut!(true);
      else if (!under(r)) r._cascadeOut!();
    });
  }
  let raf: number | null = null;
  const schedule = () => { if (!raf) raf = requestAnimationFrame(() => { raf = null; settle(); }); };
  addEventListener('scroll', schedule, { passive: true });
  addEventListener('pointermove', schedule, { passive: true });
}
