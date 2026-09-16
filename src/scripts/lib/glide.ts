/** Shared scroll easing + "back to top" glide, used by the gallery pages and the chapter rail. */
import type Lenis from 'lenis';

export const easeInOutCubic = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
/** Duration for a scroll of `distance` px: 1.15s plus 0.16s per viewport, capped at 2.8s. */
export const glideDuration = (distance: number) => Math.min(2.8, 1.15 + (Math.abs(distance) / window.innerHeight) * 0.16);

export function glideToTop(lenis?: Lenis | null) {
  const y = window.scrollY || window.pageYOffset || 0;
  if (y < 2) return;
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) {
    lenis && lenis.scrollTo ? lenis.scrollTo(0, { immediate: true }) : window.scrollTo(0, 0);
    return;
  }
  const dur = Math.min(3.6, 1.35 + (y / window.innerHeight) * 0.34);
  if (lenis && typeof lenis.scrollTo == 'function') {
    lenis.scrollTo(0, { duration: dur, easing: easeInOutCubic });
    return;
  }
  const ms = dur * 1000;
  let start: number | null = null;
  const step = (now: number) => {
    if (start == null) start = now;
    const t = Math.min(1, (now - start) / ms);
    window.scrollTo(0, y * (1 - easeInOutCubic(t)));
    if (t < 1) requestAnimationFrame(step);
  };
  requestAnimationFrame(step);
}
