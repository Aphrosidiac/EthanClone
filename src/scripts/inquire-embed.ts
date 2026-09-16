/**
 * Inquiry form behaviour for /inquire/embed (framed by /contact).
 *
 * The reference frames this form from its client portal; ours reproduces the visible flow on
 * our origin: cards open one at a time, "On to …" advances and marks the previous card done,
 * the shoot tiles are a radio group, the intro-call calendar offers time slots for a picked
 * day, and Send renders the thank-you card. The frame reports its height to the parent and
 * announces the send the same way the portal does (`ew-inquire-height` / `ew-inquire-sent`).
 * Nothing leaves the browser.
 */
const form = document.querySelector<HTMLFormElement>('.inq-form');
const main = document.querySelector<HTMLElement>('.inq-main');
const ORDER = ['you', 'shoot', 'when', 'where', 'call', 'note'];
const card = (key: string) => document.querySelector<HTMLElement>(`.inq-card[data-card="${key}"]`);
const body = (key: string) => card(key)?.querySelector<HTMLElement>('.inq-card-body') || null;

/* ---------------------------------------------------------------- height reporting */
const parentOrigin = location.origin;
let lastH = 0;
const report = () => {
  const h = Math.ceil(document.body.getBoundingClientRect().height + 4);
  if (h === lastH) return;
  lastH = h;
  if (window.parent !== window) window.parent.postMessage({ type: 'ew-inquire-height', height: h }, parentOrigin);
};
addEventListener('load', report);
// The parent's listener is a bundled module and can miss our first post; it pings when ready.
addEventListener('message', (e) => { if (e.origin === parentOrigin && e.data && e.data.type === 'ew-inquire-ping') { lastH = 0; report(); } });
addEventListener('resize', report);
document.fonts && document.fonts.ready && document.fonts.ready.then(report);
new ResizeObserver(report).observe(document.body);
setTimeout(report, 50);

/* ---------------------------------------------------------------- card state */
function setState(key: string, state: 'open' | 'todo' | 'done' | 'strip' | 'rest', mark?: 'open' | 'todo' | 'done' | 'part' | 'none') {
  const c = card(key);
  if (!c) return;
  c.dataset.state = state;
  c.dataset.mark = mark || (state === 'open' ? 'open' : state === 'done' ? 'done' : 'todo');
  const head = c.querySelector<HTMLElement>('.inq-card-head');
  const b = body(key);
  const open = state === 'open' || state === 'strip';
  head && head.setAttribute('aria-expanded', open ? 'true' : 'false');
  if (b) { if (open) b.removeAttribute('inert'); else b.setAttribute('inert', ''); }
}
function validate(key: string): boolean {
  const c = card(key);
  if (!c) return true;
  let ok = true;
  c.querySelectorAll<HTMLInputElement | HTMLTextAreaElement>('input, textarea').forEach((el) => {
    const label = el.id && c.querySelector(`label[for="${el.id}"]`);
    const required = !!(label && label.querySelector('.inq-req'));
    if (!required) return;
    let valid = el.value.trim().length > 0;
    if (valid && el.type === 'email') valid = /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(el.value);
    el.setAttribute('aria-invalid', valid ? 'false' : 'true');
    if (!valid && ok) { ok = false; el.focus({ preventScroll: true }); }
  });
  if (key === 'shoot') {
    const chosen = c.querySelector('.tile[aria-checked="true"]');
    if (!chosen) { ok = false; c.querySelector<HTMLElement>('.tile')?.focus({ preventScroll: true }); }
  }
  return ok;
}
function openCard(key: string) {
  ORDER.forEach((k) => {
    if (k === key) return;
    const c = card(k);
    if (!c) return;
    if (c.dataset.state === 'open') setState(k, validate(k) ? 'done' : 'todo');
  });
  setState(key, 'open');
  const c = card(key);
  c && c.scrollIntoView({ block: 'start', behavior: 'smooth' });
  setTimeout(report, 400);
}
function advance(from: string) {
  if (!validate(from)) { report(); return; }
  setState(from, 'done');
  const next = ORDER[ORDER.indexOf(from) + 1];
  if (next) openCard(next);
}
ORDER.forEach((k) => {
  const c = card(k);
  if (!c) return;
  c.querySelector('.inq-card-head')?.addEventListener('click', () => { if (c.dataset.state !== 'open') openCard(k); });
  c.querySelector('.inq-card-foot .btn:not([type="submit"])')?.addEventListener('click', () => advance(k));
});
// "Anyone else" is a strip: always visible, its footer hidden by CSS; its head does nothing.

/* ---------------------------------------------------------------- consent note */
document.querySelector<HTMLElement>('[aria-controls="inq-consent-sub"]')?.addEventListener('click', (e) => {
  const btn = e.currentTarget as HTMLElement;
  const sub = document.getElementById('inq-consent-sub');
  if (!sub) return;
  const open = btn.getAttribute('aria-expanded') === 'true';
  btn.setAttribute('aria-expanded', open ? 'false' : 'true');
  sub.hidden = open;
  report();
});

/* ---------------------------------------------------------------- shoot tiles */
const tiles = [...document.querySelectorAll<HTMLElement>('.tiles .tile')];
const kindInput = document.querySelector<HTMLInputElement>('input[name="category"]');
tiles.forEach((t) => {
  t.addEventListener('click', () => {
    tiles.forEach((o) => { o.setAttribute('aria-checked', o === t ? 'true' : 'false'); o.tabIndex = o === t ? 0 : -1; });
    if (kindInput) kindInput.value = t.id.replace('inq-cat-', '');
    updateEstimate();
  });
  t.addEventListener('keydown', (e) => {
    if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft' && e.key !== 'ArrowDown' && e.key !== 'ArrowUp') return;
    e.preventDefault();
    const i = tiles.indexOf(t);
    const n = tiles[(i + (e.key === 'ArrowRight' || e.key === 'ArrowDown' ? 1 : -1) + tiles.length) % tiles.length];
    n.click();
    n.focus();
  });
});

/* ---------------------------------------------------------------- people + places */
const addPerson = document.querySelector<HTMLElement>('[data-card="who"] .inq-add');
let people = 0;
addPerson?.addEventListener('click', () => {
  const n = ++people;
  const group = document.createElement('div');
  group.className = 'inq-group';
  group.innerHTML = `<div class="field"><label class="lab" for="inq-p${n}-name">Their name</label><input id="inq-p${n}-name" type="text" autocomplete="off" name="people[${n}].name" value=""></div><div class="field"><label class="lab" for="inq-p${n}-email">Their email</label><input id="inq-p${n}-email" type="email" inputmode="email" autocomplete="off" name="people[${n}].email" value=""></div>`;
  addPerson.before(group);
  group.querySelector<HTMLInputElement>('input')?.focus({ preventScroll: true });
  report();
});
const addPlace = document.querySelector<HTMLElement>('[data-card="where"] .inq-add');
let places = 0;
addPlace?.addEventListener('click', () => {
  const n = ++places;
  const group = document.createElement('div');
  group.className = 'inq-group';
  group.innerHTML = `<div class="field"><label class="lab" for="inq-addr${n}">Address</label><input id="inq-addr${n}" type="text" autocomplete="off" placeholder="Start typing an address or a place" name="places[${n}].addressLine" value=""></div><div class="field"><label class="lab" for="inq-venue${n}">Location name</label><input id="inq-venue${n}" type="text" autocomplete="off" placeholder="Optional, if the place has a name" name="places[${n}].venue" value=""></div>`;
  addPlace.before(group);
  group.querySelector<HTMLInputElement>('input')?.focus({ preventScroll: true });
  report();
});

/* ---------------------------------------------------------------- dates + estimate */
const moreDays = document.querySelector<HTMLElement>('.inq-field-end .inq-textlink');
moreDays?.addEventListener('click', () => {
  const field = moreDays.closest<HTMLElement>('.field')!;
  field.innerHTML = '<label class="lab" for="inq-end">Last day</label><input id="inq-end" type="date" autocomplete="off" name="endDate" value="">';
  field.querySelector<HTMLInputElement>('input')?.focus({ preventScroll: true });
  report();
});
const est = document.querySelector<HTMLElement>('.inq-est');
const estText = est?.querySelector<HTMLElement>('.inq-est-head');
const RATES: Record<string, number> = { wedding: 650, elopement: 550, engagement: 400, event: 450, commercial: 500, editorial: 500, family: 400, portrait: 400, other: 450 };
const parseTime = (s: string) => {
  const m = /^(\d{1,2})(?::(\d{2}))?\s*(am|pm)?$/i.exec(s.trim());
  if (!m) return null;
  let h = parseInt(m[1], 10);
  const min = m[2] ? parseInt(m[2], 10) : 0;
  const ap = (m[3] || '').toLowerCase();
  if (ap === 'pm' && h < 12) h += 12;
  if (ap === 'am' && h === 12) h = 0;
  return h + min / 60;
};
function updateEstimate() {
  if (!est || !estText) return;
  const kind = kindInput?.value || '';
  const date = (document.getElementById('inq-start') as HTMLInputElement | null)?.value || '';
  const t1 = parseTime((document.getElementById('inq-t1') as HTMLInputElement | null)?.value || '');
  const t2 = parseTime((document.getElementById('inq-t2') as HTMLInputElement | null)?.value || '');
  if (!kind || !date || t1 == null || t2 == null || t2 <= t1) {
    est.dataset.est = 'none';
    estText.innerHTML = '<span class="lab inq-est-lab">Your estimate</span><span class="inq-est-invite">Pick the kind of shoot, the date and the start and end times above. The estimate appears here.</span>';
    return;
  }
  const hours = Math.max(2, Math.round((t2 - t1) * 2) / 2);
  const total = Math.round(RATES[kind] * hours);
  est.dataset.est = 'ready';
  estText.innerHTML = `<span class="lab inq-est-lab">Your estimate</span><span class="inq-est-fig">$${total.toLocaleString('en-US')}<span class="inq-est-sub">${hours} hours of ${kind} coverage. An estimate, not a quote; the note below is where the real number comes from.</span></span>`;
}
['inq-start', 'inq-t1', 'inq-t2'].forEach((id) => document.getElementById(id)?.addEventListener('input', updateEstimate));

/* ---------------------------------------------------------------- intro call */
const cal = document.querySelector<HTMLElement>('.cp-cal');
const hint = document.querySelector<HTMLElement>('.cp-hint');
const SLOTS = ['10:00 am', '11:30 am', '2:00 pm', '4:30 pm'];
let times: HTMLElement | null = null;
document.querySelectorAll<HTMLButtonElement>('.cp-day').forEach((day) => {
  day.addEventListener('click', () => {
    document.querySelectorAll('.cp-day').forEach((d) => d.setAttribute('aria-pressed', d === day ? 'true' : 'false'));
    if (!times) {
      times = document.createElement('div');
      times.className = 'cp-times';
      cal?.after(times);
    }
    const label = day.getAttribute('aria-label') || day.textContent;
    times.innerHTML = `<p class="cp-times-head" style="padding:14px 16px 6px">${label}</p>` + SLOTS.map((s) => `<button type="button" class="cp-time" data-slot="${label} · ${s}">${s}</button>`).join('');
    times.querySelectorAll<HTMLElement>('.cp-time').forEach((b) => b.addEventListener('click', () => {
      times!.querySelectorAll('.cp-time').forEach((o) => o.setAttribute('aria-pressed', o === b ? 'true' : 'false'));
      if (hint) hint.textContent = `Call booked for ${b.dataset.slot}.`;
      form?.dataset && (form.dataset.call = b.dataset.slot || '');
      report();
    }));
    if (hint) hint.textContent = 'Now pick a time.';
    report();
  });
});

/* ---------------------------------------------------------------- lead source select */
const sel = document.querySelector<HTMLElement>('.sel');
const selBtn = sel?.querySelector<HTMLElement>('.sel-btn');
const selVal = sel?.querySelector<HTMLElement>('.sel-value');
const selInput = sel?.querySelector<HTMLInputElement>('input[name="leadSource"]');
const LEADS: [string, string][] = [['website', 'Found the website'], ['instagram', 'Instagram'], ['referral', 'A friend or a vendor'], ['knot', 'The Knot'], ['google', 'Google'], ['other', 'Somewhere else']];
let selList: HTMLElement | null = null;
selBtn?.addEventListener('click', () => {
  if (selList) { selList.remove(); selList = null; selBtn.setAttribute('aria-expanded', 'false'); report(); return; }
  selList = document.createElement('div');
  selList.setAttribute('role', 'listbox');
  selList.style.cssText = 'margin-top:6px;border:1px solid var(--inq-line-2);border-radius:var(--r);background:var(--paper);overflow:hidden';
  LEADS.forEach(([v, label]) => {
    const o = document.createElement('button');
    o.type = 'button';
    o.className = 'sel-opt';
    o.setAttribute('role', 'option');
    o.style.cssText = 'display:block;width:100%;text-align:left;padding:12px 16px;border:0;background:none;font:inherit;font-size:var(--inq-md);color:var(--inq-ink);cursor:pointer';
    o.innerHTML = `<span class="sel-opt-label">${label}</span>`;
    o.addEventListener('click', () => { if (selVal) selVal.textContent = label; if (selInput) selInput.value = v; selList?.remove(); selList = null; selBtn.setAttribute('aria-expanded', 'false'); report(); });
    o.addEventListener('mouseenter', () => (o.style.background = 'var(--cream)'));
    o.addEventListener('mouseleave', () => (o.style.background = 'none'));
    selList!.appendChild(o);
  });
  sel!.after(selList);
  selBtn.setAttribute('aria-expanded', 'true');
  report();
});

/* ---------------------------------------------------------------- send */
form?.addEventListener('submit', (e) => {
  e.preventDefault();
  if (!validate('note')) { report(); return; }
  const name = (document.getElementById('inq-name') as HTMLInputElement | null)?.value.trim().split(/\s+/)[0] || 'there';
  const thanks = document.createElement('section');
  thanks.className = 'inq-thanks';
  thanks.innerHTML = `<p class="lab inq-thanks-eyebrow">Sent</p><h2 class="inq-thanks-title" tabindex="-1">Thank you, ${name}</h2><p class="inq-thanks-line">Your inquiry is in. I read every one myself and write back within two days, usually sooner.</p><div class="inq-thanks-portal"><p class="inq-thanks-next">This is a local demo of the inquiry flow, so nothing was actually sent. On the live site this card confirms the message reached the studio and points you to your client portal.</p></div>`;
  form.replaceWith(thanks);
  document.querySelector('.inq-season')?.remove();
  thanks.querySelector<HTMLElement>('.inq-thanks-title')?.focus({ preventScroll: true });
  report();
  if (window.parent !== window) window.parent.postMessage({ type: 'ew-inquire-sent' }, parentOrigin);
});
void main;
