/** Contact: closing-row cascade, the entrance gate, and the framed inquiry form. */
import { wireCloseCascade } from '../lib/close-cascade';
import { revealAfterLoader } from '../lib/reveal-gate';
wireCloseCascade();
revealAfterLoader('revealed');

/* ---------------------------------------------------------------- the framed inquiry form
 * The form is framed from /inquire/embed on this origin. Its height arrives by postMessage
 * (origin-checked, shape-checked), the pricing calculator's estimate is handed across on the
 * first height message, and the frame's "sent" announcement scrolls the thank-you into view. */
(function () {
  const frame = document.getElementById('inquireFrame') as HTMLIFrameElement | null;
  if (!frame) return;
  const ALLOWED = location.origin;
  let quoteSent = false;
  function sendQuote() {
    if (quoteSent) return;
    const KEY = 'ew:quote-handoff';
    const TTL_MS = 20 * 60 * 1000;
    let data: Record<string, unknown> | null = null;
    try {
      const raw = sessionStorage.getItem(KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed && typeof parsed === 'object' && isFinite(parsed.at) && Date.now() - parsed.at <= TTL_MS) data = parsed;
        else sessionStorage.removeItem(KEY);
      }
    } catch { /* private mode, quota, bad JSON: the form works empty */ }
    if (!data || !data.quoteCents) return;
    quoteSent = true;
    frame.contentWindow?.postMessage({ type: 'ew-inquire-quote', quoteCents: data.quoteCents, quoteNote: data.quoteNote, shootType: data.shootType, date: data.date, duration: data.duration, guestCount: data.guestCount, city: data.city }, ALLOWED);
  }
  // Ask the frame for its height now and again once it (re)loads, in case it posted before this ran.
  const ping = () => frame.contentWindow?.postMessage({ type: 'ew-inquire-ping' }, ALLOWED);
  ping();
  frame.addEventListener('load', ping);
  let sentTracked = false;
  window.addEventListener('message', (e) => {
    if (e.origin !== ALLOWED) return;
    const d = e.data;
    if (d && d.type === 'ew-inquire-sent') {
      const target = document.getElementById('inquire') || frame;
      try {
        target.scrollIntoView({ block: 'start', behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth' });
      } catch { target.scrollIntoView(true); }
      if (sentTracked) return;
      sentTracked = true;
      if (typeof window.ewTrack === 'function') window.ewTrack('inquiry_sent', { to: quoteSent ? 'with-estimate' : 'no-estimate' });
      return;
    }
    if (!d || d.type !== 'ew-inquire-height') return;
    const h = Number(d.height);
    if (!isFinite(h) || h < 200 || h > 40000) return;
    frame.style.height = Math.ceil(h) + 'px';
    sendQuote();
  });
})();
