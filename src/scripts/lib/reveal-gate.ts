/** Adds a class to <html> once the arrival loader has left (or immediately under reduced motion),
 *  which the page CSS uses to start its entrance. */
export function revealAfterLoader(cls: string) {
  const root = document.documentElement;
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) { root.classList.add(cls); return; }
  let done = false;
  const go = () => { if (!done) { done = true; root.classList.add(cls); } };
  addEventListener('ew:loader-done', go, { once: true });
  let n = 0;
  const poll = () => {
    if (done || document.querySelector('[data-ew-loader]')) return;
    if (n++ > 8) { go(); return; }
    requestAnimationFrame(poll);
  };
  poll();
}
