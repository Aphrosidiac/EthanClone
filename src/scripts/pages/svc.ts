/** SEO service pages: rise-in on scroll, image fade, and the "see the work" smooth jump. */
const io = new IntersectionObserver((entries) => entries.forEach((en) => {
  if (en.isIntersecting) { en.target.classList.add('is-in'); io.unobserve(en.target); }
}), { rootMargin: '0px 0px -12% 0px' });
document.querySelectorAll('.svc [data-rise]').forEach((el) => io.observe(el));
const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
if (!reduced)
  document.querySelectorAll<HTMLElement>('.svc [data-img]').forEach((el) => {
    const img = el.tagName === 'IMG' ? (el as HTMLImageElement) : el.querySelector('img');
    el.style.opacity = '0';
    el.style.transition = 'opacity 0.8s ease';
    const show = () => { el.style.opacity = '1'; };
    if (img && !(img.complete && img.naturalWidth > 0)) {
      img.addEventListener('load', show, { once: true });
      img.addEventListener('error', show, { once: true });
      setTimeout(show, 2600);
    } else show();
  });
document.querySelectorAll<HTMLElement>('.svc-see, .svc-scroll').forEach((el) => {
  el.addEventListener('click', (e) => {
    const body = document.getElementById('svc-body');
    if (body) { e.preventDefault(); body.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth', block: 'start' }); }
  });
});
