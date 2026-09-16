/** Commercial: the gallery behaviour plus click-to-lightbox on the .com-item tiles (collapsed "more" tiles are skipped until revealed). */
import './gallery';
const tiles = () => Array.from(document.querySelectorAll<HTMLImageElement>('.com-item img[data-full]'));
function visible(img: HTMLImageElement) {
  const rest = img.closest('.com-rest');
  if (!rest) return true;
  const parent = rest.parentElement;
  const more = parent && parent.querySelector<HTMLInputElement>('.com-more-in');
  return !!(more && more.checked);
}
function wire() {
  for (const img of tiles()) {
    const item = img.closest<HTMLElement>('.com-item');
    if (!item) continue;
    item.addEventListener('click', () => {
      if (!window.EWLightbox) return;
      const list = tiles().filter(visible);
      const i = list.indexOf(img);
      if (i < 0) return;
      window.EWLightbox.open(list.map((o) => o.dataset.full!), i, list.map((o) => o.alt || ''));
    });
    item.tabIndex = 0;
    item.setAttribute('role', 'button');
    item.setAttribute('aria-label', `Open ${img.alt || 'this photograph'} full screen`);
    item.addEventListener('keydown', (e) => {
      if (e.key !== 'Enter' && e.key !== ' ' && e.key !== 'Spacebar') return;
      e.preventDefault();
      item.click();
    });
  }
}
document.readyState === 'loading' ? document.addEventListener('DOMContentLoaded', wire, { once: true }) : wire();

