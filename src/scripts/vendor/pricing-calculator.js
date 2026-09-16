/**
 * Pricing calculator — the instant-estimate engine of the pricing page.
 *
 * This is the reference's compiled calculator module, prettified and kept whole rather than
 * rewritten: ~2,600 lines of pricing rules, date/travel/weather lookups and the sheet UI whose
 * behaviour has to match to the dollar. Only the private places endpoint was removed (it now
 * falls back to open-meteo geocoding). Public services used at runtime: geocoding-api /
 * api / archive-api.open-meteo.com and valhalla1.openstreetmap.de (routing).
 */
const Ao =
    "Studio portraits require a 2-hour minimum to cover setup and teardown.",
  yn = "Add 2+ hours of studio coverage to see your quote.";
const Dt = "Past 24 hours I quote by hand. Tell me about it in your inquiry.",
  vn =
    "Studio sessions are priced to 8 hours. Ask about a longer day in your inquiry.",
  En = "Weddings are booked from 3 hours.",
  wn = "That date has already passed.",
  Do = new Set([yn, vn, Dt, En, wn]),
  Co = { 0: 0, 5: 150, 10: 250, 20: 400 },
  sn = 1.06,
  tt = { lat: 38.8894, lon: -76.9441 },
  rn = 0.77,
  It = 20,
  Mo = {
    "01-01": {
      multiplier: 2,
      message: "High demand date: New Year’s Day rates apply.",
    },
    "02-14": {
      multiplier: 2,
      message: "High demand date: Valentine’s Day rates apply.",
    },
    "07-03": {
      multiplier: 1.5,
      message: "High demand date: Independence Day weekend rates may apply.",
    },
    "07-04": {
      multiplier: 2,
      message: "High demand date: Independence Day rates apply.",
    },
    "12-24": {
      multiplier: 2,
      message: "High demand date: Holiday season rates apply.",
    },
    "12-25": {
      multiplier: 2,
      message: "High demand date: Holiday season rates apply.",
    },
    "12-31": {
      multiplier: 2,
      message: "High demand date: New Year’s Eve rates apply.",
    },
  },
  xo = { small: 0.85, medium: 0.9, large: 1, xlarge: 1.15 },
  bn = [5, 6, 7, 8, 9, 10],
  In = 1.15,
  ko = [8, 9, 10],
  $o = 1.18,
  _o = { 0: 1.15, 1: 1, 2: 1.01, 3: 1.01, 4: 1.02, 5: 1.1, 6: 1.2 },
  Tn = { 0: 1, 1: 1, 2: 1.01, 3: 1.01, 4: 1.02, 5: 1, 6: 1 },
  Bo = [5, 6, 0],
  ie = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  });
function Te(n) {
  const [o, d, A] = n.split("-").map(Number);
  return new Date(o, d - 1, A);
}
function se() {
  const n = new Date();
  return (
    n.setMinutes(n.getMinutes() - n.getTimezoneOffset()),
    n.toISOString().split("T")[0]
  );
}
function Ro(n) {
  return (n % 4 === 0 && n % 100 !== 0) || n % 400 === 0;
}
function Oo(n, o) {
  return o === 2
    ? Ro(n)
      ? 29
      : 28
    : [31, 0, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31][o - 1] || 30;
}
function Sn(n) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(n)) return n;
  let [o, d, A] = n.split("-").map(Number);
  if (d < 1 || d > 12) return n;
  const b = Oo(o, d);
  (A > b && (A = b), A < 1 && (A = 1));
  const L = String(d).padStart(2, "0"),
    h = String(A).padStart(2, "0");
  return `${o}-${L}-${h}`;
}
function G(n) {
  return /^\d{4}-\d{2}-\d{2}$/.test(n || "");
}
function nt(n) {
  if (!n) return "";
  const o = n.value || "";
  if (!G(o)) return o;
  const d = Sn(o);
  return (d !== o && (n.value = d), n.value);
}
function Tt(n, o, d, A) {
  if (A === -1) {
    const h = new Date(n, o + 1, 0);
    return (h.setDate(h.getDate() - ((h.getDay() - d + 7) % 7)), h);
  }
  const b = new Date(n, o, 1),
    L = (d - b.getDay() + 7) % 7;
  return (b.setDate(1 + L + (A - 1) * 7), b);
}
function Po(n) {
  const o = n % 19,
    d = Math.floor(n / 100),
    A = n % 100,
    b = Math.floor(d / 4),
    L = d % 4,
    h = Math.floor((d + 8) / 25),
    B = Math.floor((d - h + 1) / 3),
    D = (19 * o + d - b - B + 15) % 30,
    M = Math.floor(A / 4),
    K = A % 4,
    U = (32 + 2 * L + 2 * M - D - K) % 7,
    H = Math.floor((o + 11 * D + 22 * U) / 451),
    k = Math.floor((D + U - 7 * H + 114) / 31),
    $ = ((D + U - 7 * H + 114) % 31) + 1;
  return new Date(n, k - 1, $);
}
function Nn(n) {
  return `${String(n.getMonth() + 1).padStart(2, "0")}-${String(n.getDate()).padStart(2, "0")}`;
}
function Ct(n, o) {
  const d = new Date(n);
  return (d.setDate(d.getDate() + o), d);
}
const St = {};
function Fo(n) {
  if (St[n]) return St[n];
  const o = {};
  function d(b, L) {
    o[Nn(b)] = L;
  }
  function A(b, L, h, B) {
    for (let D = -2; D <= h; D++) d(Ct(b, D), B);
  }
  return (
    d(Po(n), {
      multiplier: 2,
      message: "High demand date: Easter rates apply.",
    }),
    d(Tt(n, 4, 1, -1), {
      multiplier: 2,
      message: "High demand date: Memorial Day rates apply.",
    }),
    d(Tt(n, 8, 1, 1), {
      multiplier: 2,
      message: "High demand date: Labor Day rates apply.",
    }),
    A(Tt(n, 10, 4, 4), 2, 2, {
      multiplier: 2,
      message: "High demand date: Thanksgiving season rates apply.",
    }),
    (St[n] = o),
    o
  );
}
function rt(n) {
  if (!(n instanceof Date) || Number.isNaN(n.getTime())) return null;
  const o = Nn(n);
  return Mo[o] || Fo(n.getFullYear())[o] || null;
}
function ln(n) {
  return n.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}
function Uo(n) {
  return `<span class="tooltip-title">How many hours do I need?</span>${un[n] || un.default}`;
}
function Ho(n) {
  return 1750 + 95 * n + 24 * n * n + 1e3 / n;
}
function Wo(n) {
  return Ho(n) + 70 * n;
}
function Ln(n) {
  return (n <= 1 ? 577 : (577 + (n - 1) * 300) * 0.9) + 35 * n;
}
function qo(n) {
  return An(n);
}
function Yo(n) {
  return (n <= 1 ? 577 : 577 + (n - 1) * 300) + 35 * n;
}
function Vo(n) {
  return (n <= 1 ? 577 : 577 + (n - 1) * 300) * 0.9 + 35 * n;
}
function zo(n) {
  return (n <= 1 ? 677 : 677 + (n - 1) * 350) + 35 * n;
}
function An(n) {
  return (n <= 1 ? 497 : 497 + (n - 1) * 275) + 35 * n;
}
const Nt = {
  1: 782,
  2: 1467,
  3: 2152,
  4: 2837,
  5: 3442,
  6: 4007,
  7: 4542,
  8: 5077,
};
function jo(n) {
  if (!Number.isFinite(n)) return null;
  const o = Math.min(Math.max(n, 1), 8),
    d = Math.round(o * 2) / 2;
  if (Number.isInteger(d)) return Nt[d] || null;
  const A = Math.floor(d),
    b = Math.ceil(d),
    L = Nt[A],
    h = Nt[b];
  return typeof L != "number" || typeof h != "number" ? null : (L + h) / 2;
}
const Go = 150,
  Xo = 150,
  ot = "Washington, DC",
  cn = { lat: 38.9072, lon: -77.0369 },
  at = "United States",
  Ko = "Search a city (e.g. Arlington, VA)",
  Jo = "Search a city",
  Qo = "(max-width: 540px)",
  dn = {
    "united states": "U.S.",
    "united states of america": "U.S.",
    "united kingdom": "U.K.",
    canada: "CA",
    australia: "AU",
    "new zealand": "NZ",
  },
  Zo = {
    0: "Clear sky",
    1: "Mainly clear",
    2: "Partly cloudy",
    3: "Overcast",
    45: "Fog",
    48: "Freezing fog",
    51: "Light drizzle",
    53: "Moderate drizzle",
    55: "Dense drizzle",
    56: "Light freezing drizzle",
    57: "Dense freezing drizzle",
    61: "Slight rain",
    63: "Moderate rain",
    65: "Heavy rain",
    66: "Light freezing rain",
    67: "Heavy freezing rain",
    71: "Slight snowfall",
    73: "Moderate snowfall",
    75: "Heavy snowfall",
    77: "Snow grains",
    80: "Rain showers",
    81: "Moderate rain showers",
    82: "Violent rain showers",
    85: "Snow showers",
    86: "Heavy snow showers",
    95: "Thunderstorm",
    96: "Thunderstorm with slight hail",
    99: "Thunderstorm with heavy hail",
  },
  ea = {
    alabama: "AL",
    alaska: "AK",
    arizona: "AZ",
    arkansas: "AR",
    california: "CA",
    colorado: "CO",
    connecticut: "CT",
    delaware: "DE",
    florida: "FL",
    georgia: "GA",
    hawaii: "HI",
    idaho: "ID",
    illinois: "IL",
    indiana: "IN",
    iowa: "IA",
    kansas: "KS",
    kentucky: "KY",
    louisiana: "LA",
    maine: "ME",
    maryland: "MD",
    massachusetts: "MA",
    michigan: "MI",
    minnesota: "MN",
    mississippi: "MS",
    missouri: "MO",
    montana: "MT",
    nebraska: "NE",
    nevada: "NV",
    "new hampshire": "NH",
    "new jersey": "NJ",
    "new mexico": "NM",
    "new york": "NY",
    "north carolina": "NC",
    "north dakota": "ND",
    ohio: "OH",
    oklahoma: "OK",
    oregon: "OR",
    pennsylvania: "PA",
    "rhode island": "RI",
    "south carolina": "SC",
    "south dakota": "SD",
    tennessee: "TN",
    texas: "TX",
    utah: "UT",
    vermont: "VT",
    virginia: "VA",
    washington: "WA",
    "west virginia": "WV",
    wisconsin: "WI",
    wyoming: "WY",
    "district of columbia": "DC",
  },
  ta = new Set([
    "us",
    "usa",
    "u.s.",
    "u.s.a.",
    "united states",
    "united states of america",
    "america",
  ]);
function Lt(n) {
  return n ? ta.has(n.trim().toLowerCase()) : !1;
}
const na = (n) => (n * 9) / 5 + 32,
  oa = (n) => ((n - 32) * 5) / 9;
function it(n, o) {
  return typeof n != "number" ? n : o ? na(n) : n;
}
function st(n) {
  return n == null ? "" : Zo[n] || "";
}
function aa({
  tmax: n,
  tmin: o,
  conditionText: d,
  weatherCode: A,
  pop: b,
  unitLabel: L,
}) {
  const h = (d || st(A) || "").toLowerCase(),
    B =
      typeof n == "number" && typeof o == "number"
        ? (n + o) / 2
        : typeof n == "number"
          ? n
          : typeof o == "number"
            ? o
            : null,
    D = B == null ? null : L === "°F" ? oa(B) : B;
  if (h.includes("thunder")) return "⛈️";
  if (h.includes("snow") || h.includes("sleet") || h.includes("ice"))
    return "❄️";
  if (h.includes("hail") || h.includes("storm") || h.includes("heavy rain"))
    return "⛈️";
  if (h.includes("rain") || h.includes("shower") || h.includes("drizzle"))
    return b != null && b < 50 ? "🌦️" : "🌧️";
  if (h.includes("fog") || h.includes("mist") || h.includes("haze"))
    return "🌫️";
  if (h.includes("cloud") || h.includes("overcast")) return "☁️";
  if (b != null) {
    if (b >= 70) return "🌧️";
    if (b >= 40) return "🌦️";
  }
  if (D != null) {
    if (D <= 0) return "❄️";
    if (D <= 10) return "🌥️";
    if (D <= 20) return "🌤️";
    if (D >= 30) return "🔥";
    if (D >= 26) return "☀️";
  }
  return "☀️";
}
const ge = new Set(["foodbrand", "other"]),
  At = {
    wedding: "3–4 weeks, depending on the season",
    elopement: "~3 weeks, depending on the season",
    engagement: "~3 weeks, depending on the season",
    family: "~3 weeks, depending on the season",
    maternity: "~3 weeks, depending on the season",
    headshot: "3–4 weeks, depending on the season",
    proposal: "~3 weeks, depending on the season",
    events: "~3 weeks, depending on the season",
    foodbrand: "3–5 weeks, depending on the scope",
  },
  un = {
    wedding: `
      <p>Wedding coverage starts at 3 hours and often runs 6–8 hours when you factor in getting ready, the ceremony, portraits, and reception highlights.</p>
      <p>More hours mean more breathing room, less rushing between moments and more of the day captured naturally.</p>
    `,
    engagement: `
      <p>Most engagement sessions run 1–2 hours, covering one or two locations with a mix of candid and posed shots.</p>
      <p>If you’re including an outfit change or a more adventurous location, consider adding an extra half-hour for breathing room.</p>
    `,
    elopement: `
      <p>Elopement coverage typically starts at 1–2 hours and expands naturally with a first look, vow reading, or portraits before and after the ceremony.</p>
      <p>More time means a more relaxed pace, no rushing between moments.</p>
    `,
    headshot: `
      <p>For studio portraits, headshots, or branding imagery, plan for roughly 30 minutes before and after the session for setup and teardown.</p>
      <p>Everything feels unrushed and dialed-in from the moment we start.</p>
    `,
    events: `
      <p>Events can be as short as 2–3 hours for intimate dinners or as long as 4–8+ hours for conferences and galas.</p>
      <p>Choose coverage that matches your program’s key moments so nothing important is missed.</p>
    `,
    family: `
      <p>Family and maternity sessions typically run 1–2 hours; studio setups or outfit changes need extra room, so plan for 2 hours or more.</p>
      <p>Extra time keeps the pace relaxed, for little ones and every look.</p>
    `,
    maternity: `
      <p>If your maternity shoot includes a studio setup or outfit changes, plan for at least 2 hours or more.</p>
      <p>It keeps the pace relaxed so we can capture every look without rushing.</p>
    `,
    foodbrand: `
      <p>These sessions vary widely depending on complexity, from simple tabletop shots to multi-set brand/editorial productions.</p>
      <p>We’ll outline the ideal duration after you inquire so it matches your creative brief.</p>
    `,
    other: `
      <p>These sessions vary widely depending on complexity, from simple tabletop shots to full editorial or experiential projects.</p>
      <p>Once you inquire, we’ll discuss your vision and build a custom timeline and estimate.</p>
    `,
    default: `
      <p>Select your shoot type to see recommended duration guidance.</p>
    `,
  },
  ia = new Set([
    "wedding",
    "engagement",
    "elopement",
    "family",
    "maternity",
    "headshot",
  ]),
  sa = { private: 1, conference: 1.15, corporate: 1.3, gala: 1.5 },
  mn = 0.2,
  fn = 0.25,
  pn = 450,
  hn = 0.15;
function Dn(n) {
  n.getFullYear();
  const o = n.getMonth() + 1,
    d = n.getDate(),
    A = n.getDay();
  if ((`${String(o).padStart(2, "0")}${String(d).padStart(2, "0")}`, rt(n)))
    return 1;
  const b = (K, U, H) =>
      o !== K || A !== U ? !1 : Math.floor((d - 1) / 7) + 1 === H,
    L = o === 5 && A === 1 && d >= 25;
  if (o === 11 && A === 4 && Math.ceil(d / 7) === 4) return 2;
  const D = L,
    M = o === 9 && b(9, 1, 1);
  return D || M ? 1.2 : 1;
}
function gn(n, o) {
  const d = parseFloat(n);
  if (
    Number.isNaN(d) ||
    d <= 0 ||
    !(o instanceof Date) ||
    Number.isNaN(o.getTime())
  )
    return null;
  const A = o.getMonth() + 1,
    b = o.getDay();
  let h = d <= 1 ? (Bo.includes(b) ? 602 : 512) : Ln(d);
  (bn.includes(A) && (h *= In), (h *= Tn[b]), (h *= Dn(o)));
  const B = rt(o)?.multiplier || 1;
  return ((h *= B), { total: h, duration: d });
}
document.addEventListener("DOMContentLoaded", () => {
  const n = document.getElementById("shootType"),
    o = document.getElementById("shootDate"),
    d = document.getElementById("duration"),
    A = document.getElementById("durationStepper"),
    b = document.getElementById("durationMinus"),
    L = document.getElementById("durationPlus"),
    h = document.getElementById("price-display"),
    B = document.getElementById("priceNote"),
    D = document.getElementById("price-bar"),
    M = document.getElementById("estimateIndicator"),
    K = document.getElementById("estimateIndicatorAmount"),
    U = document.getElementById("studioNote"),
    H = document.getElementById("microWeddingNote");
  document.getElementById("detailsStack");
  const k = document.getElementById("copyrightYear"),
    $ = document.getElementById("bundleEngagementFields"),
    x = document.getElementById("bundleEngagementDate"),
    re = document.getElementById("bundleEngagementDuration"),
    We = document.getElementById("bundleEngagementPrice");
  let J = null,
    Se = null,
    $e = !1;
  const Q = document.getElementById("studioSelect"),
    X = document.querySelector(".price-card"),
    Mt = document.getElementById("guestBlock"),
    lt = document.getElementById("eventTypeRow"),
    ct = document.getElementById("weddingAddons"),
    xt = document.getElementById("weddingAddonsRow");
  document.getElementById("generalAddons");
  const dt = document.getElementById("generalAddonsRow"),
    qe = document.getElementById("portraitExtraImages"),
    R = document.getElementById("checkWeatherBtn"),
    C = document.getElementById("weatherLocation"),
    W = document.getElementById("weatherResult"),
    j = document.getElementById("locSuggestions"),
    kt = document.getElementById("estimateExplainer"),
    Ne = document.getElementById("estimateExplainToggle"),
    Le = document.getElementById("estimateExplainPanel"),
    _e = document.getElementById("guestCount"),
    $t = document.getElementById("inquiryMessage"),
    ut = document.getElementById("eventDurationRow"),
    _t = document.getElementById("eventAddonsSection"),
    le = document.getElementById("eventDurationInput"),
    ye = document.getElementById("eventTypeSelect"),
    ve = document.getElementById("highDemandNote"),
    Cn = document.getElementById("eventAddons"),
    Mn = document.getElementById("eventNonProfitWrap"),
    Bt = document.getElementById("nonProfitNote"),
    Rt = document.getElementById("durationRow"),
    Ye = document.getElementById("proposalNote"),
    Ae = document.getElementById("mileageResult");
  let De = null,
    Be = null,
    Ve = null,
    Z = 0,
    mt = !1;
  const Re = new Set(),
    ze = () =>
      o
        ? o.dataset.typing === "true"
          ? !0
          : document.activeElement === o
        : !1;
  function ft() {
    if (!ve || !o) return;
    const t = o.disabled ? "" : o.value;
    if (!t || !G(t)) {
      ((ve.style.display = "none"), (ve.textContent = ""));
      return;
    }
    o.dataset.typing || nt(o);
    const s = Te(o.value),
      i = rt(s);
    i
      ? ((ve.textContent = i.message), (ve.style.display = "block"))
      : ((ve.style.display = "none"), (ve.textContent = ""));
  }
  const ce = 12;
  function xn() {
    const e = X?.getBoundingClientRect(),
      t = window.innerWidth || document.documentElement.clientWidth || 0,
      s = window.innerHeight || document.documentElement.clientHeight || 0;
    return e
      ? {
          left: Math.max(e.left + 6, ce),
          right: Math.min(e.right - 6, t - ce),
          top: Math.max(e.top + 6, ce),
          bottom: Math.min(e.bottom - 6, s - ce),
        }
      : { left: ce, right: t - ce, top: ce, bottom: s - ce };
  }
  function Ot(e, t) {
    if (!e || !t) return;
    const s = xn(),
      i = e.getBoundingClientRect(),
      c = Math.max(s.right - s.left, 200),
      r = Math.min(360, Math.max(220, c - 12));
    t.style.maxWidth = `${r}px`;
    const w = t.getBoundingClientRect(),
      E = w.width || t.offsetWidth || 0,
      f = w.height || t.offsetHeight || 0;
    let l = i.left + i.width / 2 - E / 2;
    (l < s.left && (l = s.left),
      l + E > s.right && (l = Math.max(s.left, s.right - E)));
    const g = 10;
    let y = i.bottom + g,
      I = "bottom";
    (y + f > s.bottom && i.top - g - f > s.top
      ? ((y = i.top - g - f), (I = "top"))
      : y + f > s.bottom && (y = s.bottom - f),
      y < s.top && (y = s.top),
      (t.dataset.placement = I),
      (t.style.left = `${l}px`),
      (t.style.top = `${y}px`));
  }
  function de(e, t) {
    if (!e || !t) return;
    const s = "ontouchstart" in window || navigator.maxTouchPoints > 0;
    let i = !1,
      c = null;
    const r = () => {
        !t ||
          t.parentElement === document.body ||
          ((c = { parent: t.parentElement, nextSibling: t.nextSibling }),
          document.body.appendChild(t));
      },
      w = () => {
        if (!t || !c || !c.parent || t.parentElement === c.parent) return;
        const { parent: y, nextSibling: I } = c;
        I && I.parentNode === y ? y.insertBefore(t, I) : y.appendChild(t);
      },
      E = () => {
        i && Ot(e, t);
      };
    window.addEventListener("resize", E);
    const f = () => {
        (r(),
          Ot(e, t),
          t.classList.add("show"),
          t.setAttribute("aria-hidden", "false"),
          (i = !0),
          requestAnimationFrame(E),
          Re.add(l));
      },
      l = () => {
        (t.classList.remove("show"),
          t.setAttribute("aria-hidden", "true"),
          (t.style.left = ""),
          (t.style.top = ""),
          (t.dataset.placement = ""),
          (i = !1),
          Re.delete(l),
          w());
      },
      g = (y) => {
        if (y.key === "Enter" || y.key === " ") {
          (y.preventDefault(), (i ? l : f)());
          return;
        }
        y.key === "Escape" &&
          i &&
          (y.preventDefault(), y.stopPropagation(), l());
      };
    (e.addEventListener("blur", () => {
      i && !t.matches(":hover") && l();
    }),
      s
        ? (e.addEventListener("click", (y) => {
            (y.stopPropagation(), (i ? l : f)());
          }),
          document.addEventListener("click", (y) => {
            i && !t.contains(y.target) && y.target !== e && l();
          }),
          e.setAttribute("role", "button"),
          e.setAttribute("tabindex", "0"),
          e.addEventListener("keydown", g))
        : (e.addEventListener("mouseenter", f),
          e.addEventListener("mouseleave", l),
          t.addEventListener("mouseenter", f),
          t.addEventListener("mouseleave", l),
          e.setAttribute("tabindex", "0"),
          e.addEventListener("keydown", g)));
  }
  window.addEventListener(
    "scroll",
    () => {
      Re.size && (Re.forEach((e) => e()), Re.clear());
    },
    { passive: !0 },
  );
  const kn = document.getElementById("rateInfoIcon"),
    $n = document.getElementById("rateInfo");
  de(kn, $n);
  const _n = document.getElementById("bundleRateInfoIcon"),
    pt = document.getElementById("bundleRateInfo");
  de(_n, pt);
  const Bn = document.getElementById("durationInfoIcon"),
    Ce = document.getElementById("durationInfo");
  de(Bn, Ce);
  const Rn = document.getElementById("weatherInfoIcon"),
    On = document.getElementById("weatherInfo");
  de(Rn, On);
  const Pn = document.getElementById("eventDurationInfoIcon"),
    Fn = document.getElementById("eventDurationInfo");
  de(Pn, Fn);
  const Un = document.getElementById("studioRateInfoIcon"),
    Hn = document.getElementById("studioRateInfo");
  de(Un, Hn);
  const Wn = document.getElementById("mileageInfoIcon"),
    qn = document.getElementById("mileageInfo");
  de(Wn, qn);
  const Me = document.getElementById("durationBlock");
  function Yn(e) {
    Ce && (Ce.innerHTML = Uo(e));
  }
  function Vn() {
    if (!Ce || !Me) return;
    const e = Me.querySelector(".tooltip-anchor");
    e && Ce.parentElement !== e && e.appendChild(Ce);
  }
  Vn();
  function Pt() {
    if (!d) return !1;
    const e = parseFloat(d.value),
      t =
        !!n.value &&
        !ge.has(n.value) &&
        n.value !== "events" &&
        (d.value === "" || Number.isNaN(e));
    $e =
      n.value === "headshot" && Q?.value === "yes" && !Number.isNaN(e) && e < 2;
    const s = n.value === "wedding" && !Number.isNaN(e) && e > 0 && e < 3,
      i =
        !!n.value &&
        !ge.has(n.value) &&
        n.value !== "events" &&
        !Number.isNaN(e) &&
        e > yt();
    return (Me && Me.classList.toggle("is-invalid", t || $e || s || i), $e);
  }
  const zn =
    "Set a date and duration to see the original engagement rate before the 30% bundle savings.";
  function Ft(e) {
    pt &&
      (pt.innerHTML = `<span class="tooltip-title">How is the bundle priced?</span>${e || zn}`);
  }
  function Ut(e) {
    const t = document.getElementById("bundleEngagementHint");
    t && ((t.textContent = e || ""), t.classList.toggle("show", !!e));
  }
  function je(e) {
    (We && (We.textContent = "$–"),
      Ft(e),
      Ut(J?.classList.contains("show") ? e : ""));
  }
  function jn() {
    if (
      $ &&
      (re && !re.value && (re.value = "1"),
      x && (!x.value || x.dataset.autoset === "true"))
    ) {
      const e = o?.value || se();
      e && ((x.value = e), (x.dataset.autoset = "true"));
    }
  }
  function Ht() {
    if (!$) return;
    const e = ue?.checked && ["wedding", "elopement"].includes(n.value);
    (J
      ? (J.classList.toggle("show", e),
        $.setAttribute("aria-hidden", e ? "false" : "true"),
        Se && Se.classList.toggle("details-open", e))
      : ($.style.display = e ? "flex" : "none"),
      e ? jn() : je());
  }
  function Gn() {
    if (
      !(
        !x ||
        !$ ||
        (J ? !J.classList.contains("show") : $.style.display === "none")
      ) &&
      x.dataset.autoset === "true"
    ) {
      const t = (o && G(o.value) ? o.value : null) || se();
      t && (x.value = t);
    }
  }
  function Xn(e) {
    if (!e) return;
    e.setAttribute("inputmode", "decimal");
    const t = () => {
      let s = e.value;
      if (!s) return;
      let i = s.replace(/[^0-9.]/g, "");
      const c = i.split(".");
      if (
        (c.length > 2 && (i = c.shift() + "." + c.join("")),
        i.startsWith(".") && (i = `0${i}`),
        e.value !== i && (e.value = i),
        !i)
      )
        return;
      const r = parseFloat(i);
      (Number.isNaN(r) || r < 0) && (e.value = "");
    };
    (e.addEventListener("input", t, { capture: !0 }),
      e.addEventListener("blur", t));
  }
  function Kn() {
    if (!h) return "";
    const e = (h.textContent || "").trim();
    if (!e) return "";
    const t = e.split(":");
    return t.length > 1 ? t.slice(1).join(":").trim() : e;
  }
  function Jn(e) {
    return gt.test(e || "");
  }
  function Qn() {
    h &&
      (h.classList.remove("price-pulse"),
      h.offsetWidth,
      h.classList.add("price-pulse"),
      Ve && clearTimeout(Ve),
      (Ve = window.setTimeout(() => {
        (h.classList.remove("price-pulse"), (Ve = null));
      }, 600)));
  }
  function Wt() {
    if (!D) return !0;
    const e = D.getBoundingClientRect(),
      t =
        window.innerHeight ||
        document.documentElement.clientHeight ||
        window.screen.height ||
        0,
      s = 24;
    return e.bottom > s && e.top < t - s;
  }
  function Oe(e = {}) {
    const { immediate: t = !1 } = e;
    if (M) {
      if (
        (De && (clearTimeout(De), (De = null)),
        Be && (clearTimeout(Be), (Be = null)),
        !M.classList.contains("show"))
      ) {
        t && M.setAttribute("hidden", "");
        return;
      }
      if (t) {
        (M.classList.remove("show"), M.setAttribute("hidden", ""));
        return;
      }
      (M.classList.remove("show"),
        (Be = window.setTimeout(() => {
          (M.classList.contains("show") || M.setAttribute("hidden", ""),
            (Be = null));
        }, 220)));
    }
  }
  function Zn(e) {
    !M ||
      !K ||
      ((K.textContent = e),
      M.removeAttribute("hidden"),
      M.classList.add("show"),
      De && clearTimeout(De),
      (De = window.setTimeout(() => {
        Oe();
      }, 2e3)));
  }
  function qt() {
    !M || !M.classList.contains("show") || (Wt() && Oe());
  }
  let ht = "";
  function eo() {
    if (!h) return;
    const e = (h.textContent || "").trim();
    if (e === ht) return;
    ht = e;
    const t = Kn();
    if (!Jn(t)) {
      Oe({ immediate: !0 });
      return;
    }
    if ((Qn(), Wt())) {
      Oe();
      return;
    }
    Zn(t);
  }
  const Yt = [
      "January",
      "February",
      "March",
      "April",
      "May",
      "June",
      "July",
      "August",
      "September",
      "October",
      "November",
      "December",
    ],
    xe = (e) => !!e && e.offsetParent !== null,
    to = (e) => {
      const t = /^(\d{4})-(\d{2})-(\d{2})$/.exec(e || "");
      if (!t) return "";
      const s = new Date(+t[1], +t[2] - 1, +t[3]);
      return `${["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"][s.getDay()]}, ${+t[3]} ${Yt[+t[2] - 1]} ${t[1]}`;
    },
    no = (e) => {
      const t = parseFloat(e);
      return isNaN(t) || t <= 0
        ? ""
        : `${t % 1 === 0 ? t : t.toFixed(1)} ${t === 1 ? "hour" : "hours"}`;
    },
    gt = /(\$[\d,]+)\s*$/;
  function oo(e) {
    const t = document.getElementById("estimateSummary"),
      s = document.getElementById("estimateSummaryList"),
      i = document.getElementById("estimateSummaryTotal"),
      c = document.getElementById("estimateCtaRow");
    if ((c && (c.hidden = !1), !t || !s || !i)) return;
    const r = gt.exec(e || "");
    if (!r) {
      t.hidden = !0;
      return;
    }
    const w = [],
      E = (l, g) => {
        g && w.push([l, g]);
      };
    if ((E("Shoot", n?.selectedOptions?.[0]?.text?.trim()), xe(lt))) {
      const l = ye?.selectedOptions?.[0]?.text || "";
      E("Event", l.split(":")[0].trim());
    }
    if (
      (E("Date", to(o?.value)),
      E("Coverage", no(xe(ut) ? le?.value : d?.value)),
      xe(Mt) &&
        E(
          "Guests",
          _e?.selectedOptions?.[0]?.text
            ?.replace(/\s*(Base|[+\-\u2013\u2212]\s*\d+%)\s*$/i, "")
            .trim(),
        ),
      xe(document.getElementById("studioBlock")) &&
        Q?.value === "yes" &&
        E("Location", "In studio"),
      xe(document.getElementById("portraitDeliverables")))
    ) {
      const l = parseInt(qe?.value || "0", 10);
      l > 0 && E("Extra images", String(l));
    }
    const f = [
      ...document.querySelectorAll('.addon-item input[type="checkbox"]'),
    ]
      .filter((l) => {
        if (!l.checked || !xe(l.closest(".addon-item"))) return !1;
        if (l.id === "bundleCb") {
          const g = document.getElementById("bundleEngagementNow");
          return /\$[\d,]+/.test(g?.textContent || "");
        }
        return !0;
      })
      .map((l) => {
        const g = l.closest(".addon-item")?.querySelector(".addon-title");
        if (!g) return "";
        const y = g.cloneNode(!0);
        return (
          y
            .querySelectorAll(".badge, .tooltip-anchor, .addon-price")
            .forEach((I) => I.remove()),
          y.textContent.trim()
        );
      })
      .filter(Boolean);
    (f.length && E(f.length > 1 ? "Add-ons" : "Add-on", f.join(", ")),
      Z > 0 &&
        E(
          "Travel",
          ie.format(Math.round(Z)) + (mt ? " (tolls not included)" : ""),
        ),
      (s.innerHTML = ""));
    for (const [l, g] of w) {
      const y = document.createElement("div");
      y.className = "est-row";
      const I = document.createElement("dt");
      I.textContent = l;
      const S = document.createElement("dd");
      ((S.textContent = g), y.append(I, S), s.appendChild(y));
    }
    ((i.textContent = r[1]), (t.hidden = !1), c && (c.hidden = !1));
  }
  const ao = /(~)?\s*(\d+)(?:\s*[\u2013\u2014-]\s*(\d+))?\s*weeks/i;
  function Vt(e) {
    const t = ao.exec(e || "");
    if (!t) return null;
    const s = parseInt(t[2], 10),
      i = t[3] ? parseInt(t[3], 10) : s;
    return !Number.isFinite(s) || !Number.isFinite(i) || i < s
      ? null
      : { lo: s, hi: i };
  }
  function io(e) {
    const t = (e || "").indexOf(",");
    return t === -1 ? "" : e.slice(t + 1).trim();
  }
  const zt = (e) => (e ? e.charAt(0).toUpperCase() + e.slice(1) : ""),
    jt = (e) =>
      e
        ? e.lo === e.hi
          ? `About ${e.lo} weeks`
          : `${e.lo} to ${e.hi} weeks`
        : "",
    so = (() => {
      let e = 1 / 0,
        t = 0;
      for (const s of Object.keys(At)) {
        if (ge.has(s)) continue;
        const i = Vt(At[s]);
        i && ((e = Math.min(e, i.lo)), (t = Math.max(t, i.hi)));
      }
      return e === 1 / 0 ? null : { lo: e, hi: t };
    })();
  function ro(e, t) {
    if (!G(e || "") || !t) return "";
    const s = Te(e),
      i = Ct(s, t.lo * 7),
      c = Ct(s, t.hi * 7),
      r = (E) => E.getDate(),
      w = (E) => Yt[E.getMonth()];
    return t.lo === t.hi
      ? `Around ${r(c)} ${w(c)} ${c.getFullYear()}`
      : i.getFullYear() !== c.getFullYear()
        ? `${r(i)} ${w(i)} ${i.getFullYear()} to ${r(c)} ${w(c)} ${c.getFullYear()}`
        : i.getMonth() !== c.getMonth()
          ? `${r(i)} ${w(i)} to ${r(c)} ${w(c)} ${c.getFullYear()}`
          : `${r(i)} to ${r(c)} ${w(c)} ${c.getFullYear()}`;
  }
  function lo(e) {
    const t = document.getElementById("payRetainer"),
      s = document.getElementById("payBalance"),
      i = document.getElementById("delWindow"),
      c = document.getElementById("deliveryTimeline"),
      r = (q, ee) => {
        q && q.textContent !== ee && (q.textContent = ee);
      },
      w = gt.exec(e || ""),
      E = w ? Number(w[1].replace(/[$,]/g, "")) : NaN;
    if (Number.isFinite(E) && E > 0) {
      const q = Math.ceil(E / 2);
      (r(t, ie.format(q)), r(s, ie.format(E - q)));
    } else (r(t, "Half"), r(s, "Half"));
    if (!i || !c) return;
    const f = n ? n.value : "",
      l = At[f] || "",
      g = Vt(l);
    if (!f || !g || ge.has(f)) {
      (r(i, jt(so)),
        r(
          c,
          "It depends on the shoot. Choose one above and this gets specific.",
        ));
      return;
    }
    const y = io(l),
      I = !!(X && X.classList.contains("micro-wedding-active")),
      S = G((o && o.value) || ""),
      Y = S && o.value < se();
    if (I || Y || !S) {
      (r(i, jt(g)),
        S
          ? r(c, y ? `${zt(y)}.` : l)
          : r(
              c,
              y
                ? `${zt(y)}. Choose your date above and this gets specific.`
                : "Choose your date above and this gets specific.",
            ));
      return;
    }
    r(i, ro(o.value, g));
    let V = l.endsWith(".") ? l : `${l}.`;
    (f === "events" &&
      ye &&
      ye.value === "conference" &&
      (V += " Measured from your first day."),
      r(c, V));
  }
  function co() {
    if (B) {
      if (!(Z > 0)) {
        ((B.textContent = ""), (B.hidden = !0));
        return;
      }
      ((B.textContent = mt
        ? "Includes a mileage fee. Tolls are not included and are billed at cost."
        : "Includes a mileage fee."),
        (B.hidden = !1));
    }
  }
  function P(e) {
    h &&
      ((h.textContent = e),
      D && D.classList.toggle("is-sentence", Do.has(e)),
      co(),
      oo(e),
      lo(e),
      eo());
  }
  (M &&
    M.addEventListener("click", () => {
      (Oe({ immediate: !0 }),
        D && D.scrollIntoView({ behavior: "smooth", block: "start" }));
    }),
    document.addEventListener("scroll", qt, { passive: !0 }),
    window.addEventListener("resize", qt));
  function Pe() {
    if (!C || !R) return;
    const e = !!n.value && G(o.value) && !o.disabled && !ge.has(n.value);
    ((C.disabled = !e),
      (R.disabled = !e),
      !e &&
        j &&
        (j.setAttribute("hidden", ""),
        (j.innerHTML = ""),
        C.setAttribute("aria-expanded", "false"),
        C.setAttribute("aria-activedescendant", "")));
  }
  function Gt(e) {
    !Le ||
      !Ne ||
      ((Le.hidden = !1),
      e
        ? (Le.classList.add("show"), Ne.setAttribute("aria-expanded", "true"))
        : (Le.classList.remove("show"),
          Ne.setAttribute("aria-expanded", "false")));
  }
  Ne &&
    Le &&
    (Ne.setAttribute("aria-expanded", "false"),
    Ne.addEventListener("click", () => {
      const e = !Le.classList.contains("show");
      Gt(e);
    }));
  function Ge(e, t) {
    return `${t ? `<div class="weather-note">${t}</div>` : ""}${e}`;
  }
  function uo(e, t) {
    if (!e || !t || !t.id) return null;
    const s = document.getElementById(t.id);
    if (s) return s;
    const i = document.createElement("div");
    i.className = "addon-item";
    const c = document.createElement("input");
    ((c.type = "checkbox"), (c.id = t.id));
    const r = document.createElement("label");
    ((r.className = "addon-label"), r.setAttribute("for", t.id));
    const w = document.createElement("span");
    ((w.className = "switch"), w.setAttribute("aria-hidden", "true"));
    const E = document.createElement("span");
    E.className = "addon-text";
    const f = document.createElement("span");
    if (
      ((f.className = "addon-title"),
      (f.textContent = t.title || ""),
      t.id === "bundleCb")
    ) {
      const l = document.createElement("span");
      ((l.className = "badge badge-popular"),
        (l.textContent = "Popular"),
        f.appendChild(l));
    }
    if ((E.appendChild(f), t.sub)) {
      const l = document.createElement("span");
      ((l.className = "addon-sub"), (l.textContent = t.sub), E.appendChild(l));
    }
    if ((r.appendChild(w), r.appendChild(E), t.tooltip)) {
      const l = document.createElement("span");
      l.className = "tooltip-anchor addon-tooltip";
      const g = document.createElement("button");
      ((g.type = "button"), (g.className = "info-icon"));
      const y = `${t.id}-tooltip`;
      (g.setAttribute("aria-describedby", y),
        (g.title = "More info"),
        (g.textContent = "ⓘ"));
      const I = document.createElement("div");
      ((I.className = "tooltip"),
        (I.id = y),
        I.setAttribute("role", "tooltip"),
        I.setAttribute("aria-hidden", "true"),
        (I.innerHTML = `<span class="tooltip-title">${t.title}</span>${t.tooltip}`),
        l.appendChild(g),
        l.appendChild(I),
        f.appendChild(l),
        de(g, I));
    }
    if (t.price) {
      const l = document.createElement("span");
      ((l.className = "addon-price"),
        (l.textContent = t.price),
        r.appendChild(l));
    }
    return (
      i.appendChild(c),
      i.appendChild(r),
      e.appendChild(i),
      i.addEventListener("click", (l) => {
        if (l.target.closest("input,label,button,a")) return;
        const g = i.querySelector(".addon-detail.show");
        (g && g.contains(l.target)) ||
          (l.preventDefault(),
          (c.checked = !c.checked),
          c.dispatchEvent(new Event("change", { bubbles: !0 })));
      }),
      i.setAttribute("tabindex", "0"),
      i.addEventListener("keydown", (l) => {
        (l.key === " " || l.key === "Enter") &&
          (l.preventDefault(),
          (c.checked = !c.checked),
          c.dispatchEvent(new Event("change", { bubbles: !0 })));
      }),
      c.addEventListener("change", (l) => {
        (typeof t.onToggle == "function" && t.onToggle(l.target.checked),
          Xe(l));
      }),
      c
    );
  }
  const mo = [
      {
        container: ct,
        items: [
          {
            id: "bundleCb",
            title: "Bundle engagement portraits",
            price: `${Math.round(0.3 * 100)}% off`,
          },
        ],
      },
      {
        container: Cn,
        items: [
          {
            id: "eventSameDay",
            title: "Same-day edits or previews",
            price: `+${Math.round(mn * 100)}%`,
          },
          {
            id: "eventSecondShooter",
            title: "Second photographer",
            price: `+${Math.round(fn * 100)}%`,
          },
          {
            id: "eventPhotobooth",
            title: "Photobooth / lighting setup",
            price: `+${ie.format(pn)}`,
          },
        ],
      },
      {
        container: Mn,
        items: [
          {
            id: "eventNonProfit",
            title: "This is a verified non-profit event.",
            price: `${Math.round(hn * 100)}% off`,
            tooltip:
              "Approved non-profit events receive a 15% discount. Official documentation (e.g., 501(c)(3)) is required before the discount is applied.",
          },
        ],
      },
    ],
    ke = {};
  mo.forEach(({ container: e, items: t }) => {
    !e ||
      !t ||
      t.forEach((s) => {
        const i = uo(e, s);
        i && ((i.checked = !1), (ke[s.id] = i));
      });
  });
  const ue = ke.bundleCb || null,
    fo = ke.eventSameDay || null,
    po = ke.eventSecondShooter || null,
    ho = ke.eventPhotobooth || null,
    Fe = ke.eventNonProfit || null;
  if (Fe && Bt) {
    const e = () => {
      Bt.style.display = Fe.checked ? "block" : "none";
    };
    (e(), Fe.addEventListener("change", e));
  }
  (ue && (Se = ue.closest(".addon-item")),
    Se &&
      $ &&
      ((J = document.createElement("div")),
      (J.className = "addon-detail bundle-detail"),
      $.style.removeProperty("display"),
      $.setAttribute("aria-hidden", "true"),
      J.appendChild($),
      Se.appendChild(J),
      Se.classList.add("has-details")),
    Xn(re));
  function yt() {
    return n?.value === "headshot" && Q?.value === "yes" ? 8 : 24;
  }
  function go() {
    A && A.classList.toggle("disabled", !!d.disabled);
    const e = (parseFloat(d.value) || 0) >= yt();
    (b && (b.disabled = !!d.disabled), L && (L.disabled = !!d.disabled || e));
  }
  (b &&
    b.addEventListener("click", () => {
      if (d.disabled) return;
      const e = parseFloat(d.value) || 0,
        t = Math.max(0.5, e - 1);
      ((d.value = t), d.dispatchEvent(new Event("input", { bubbles: !0 })));
    }),
    L &&
      L.addEventListener("click", () => {
        if (d.disabled) return;
        const e = parseFloat(d.value) || 0,
          t = Math.min(yt(), e + 1);
        t !== e &&
          ((d.value = t), d.dispatchEvent(new Event("input", { bubbles: !0 })));
      }));
  function Xt() {
    if (
      !ue ||
      !ue.checked ||
      !["wedding", "elopement"].includes(n.value) ||
      !x ||
      !re
    )
      return 0;
    const e = parseFloat(re.value),
      t = x.value;
    if (Number.isNaN(e) || e <= 0)
      return (je("Add a positive duration to see the bundle quote."), 0);
    if (!t)
      return (
        je("Choose a date to calculate the discounted engagement rate."),
        0
      );
    const s = Sn(t);
    s !== t && (x.value = s);
    const i = Te(s),
      c = gn(e, i);
    if (!c)
      return (
        je("Unable to calculate bundle. Please double-check the inputs."),
        0
      );
    const r = c.total * (1 - 0.3);
    if (We) {
      const w = document.createElement("span");
      ((w.className = "pw-sr"), (w.textContent = "Was "));
      const E = document.createElement("s");
      ((E.className = "bundle-was"),
        (E.textContent = ie.format(Math.round(c.total))));
      const f = document.createElement("span");
      ((f.className = "pw-sr"), (f.textContent = ", now "));
      const l = document.createElement("span");
      ((l.id = "bundleEngagementNow"),
        (l.className = "bundle-now"),
        (l.textContent = ie.format(Math.round(r))),
        We.replaceChildren(w, E, f, l));
    }
    return (
      Ut(""),
      Ft(
        `<p>The engagement rate for that date and duration, less ${Math.round(0.3 * 100)}% for booking it with the wedding.</p>`,
      ),
      r
    );
  }
  function Kt() {
    const e = n.value,
      t = !!e,
      s = e === "wedding",
      i = e === "elopement",
      c = e === "events",
      r = ge.has(e);
    Yn(e);
    const w = n.closest(".field-row");
    (w && w.classList.toggle("is-invalid", !t),
      X &&
        (X.classList.toggle("no-shoot-type", !t),
        X.classList.toggle("has-shoot-type", t),
        X.classList.toggle("inquiry-mode", r),
        X.classList.toggle("quiet-addons", ia.has(e))),
      kt && ((kt.style.display = r ? "none" : "flex"), r && Gt(!1)),
      $t && ($t.style.display = r ? "block" : "none"),
      Rt && (Rt.style.display = r || c ? "none" : "flex"),
      Me && (Me.style.display = r || c ? "none" : "flex"),
      ut && (ut.style.display = c ? "flex" : "none"),
      _t && (_t.style.display = c ? "flex" : "none"));
    const E = document.getElementById("bundleBlock");
    (E && (E.style.display = "none"),
      document
        .querySelectorAll(".weddingsExtra")
        .forEach((_) => (_.style.display = "none")));
    const f = !r && !c && s;
    Mt.style.display = f ? "flex" : "none";
    const l = s || i;
    (xt && (xt.style.display = l ? "flex" : "none"),
      ct && (ct.style.display = l ? "flex" : "none"),
      Ht());
    const g = !r && e === "headshot",
      y = Q?.value === "yes";
    document.getElementById("studioBlock").style.display = g ? "flex" : "none";
    const I = document.getElementById("portraitDeliverables");
    (I && (I.style.display = g && y ? "flex" : "none"),
      (document.getElementById("elopementNote").style.display = i
        ? "block"
        : "none"),
      e === "wedding"
        ? (d.value = 3)
        : e === "proposal"
          ? (d.value = 1.5)
          : ["elopement", "engagement", "family", "maternity"].includes(e)
            ? (d.value = 1)
            : e === "headshot"
              ? (d.value = Q.value === "yes" ? 2 : 1)
              : e || (d.value = ""));
    const S = !t || r;
    ((o.disabled = S), (d.disabled = S || c));
    const Y = se();
    ((o.min = Y),
      x && (x.min = Y),
      (d.min = "0.5"),
      (d.max = String(g && y ? 8 : 24)),
      le && (le.max = String(24)),
      lt &&
        ((lt.style.display = c ? "flex" : "none"),
        ye && (ye.disabled = !c || S)));
    const V = document.getElementById("proposalToggleRow");
    if (V) {
      V.style.display = e === "engagement" ? "flex" : "none";
      const _ = document.getElementById("proposalToggle");
      e !== "engagement" && _ && (_.value = "no");
      const te = document.getElementById("proposalRateNote");
      te &&
        (te.style.display =
          e === "engagement" && _?.value === "yes" ? "block" : "none");
    }
    (!S && !o.value && !ze() && (o.value = se()),
      P(r ? "Inquire Now" : "Your quote: $–"));
    const q = (_, te, Ee, Ue) => {
      (document.getElementById(te)?.classList.toggle("show", !!Ee),
        _ &&
          (Ue
            ? _.setAttribute("aria-required", "true")
            : _.removeAttribute("aria-required"),
          Ue && Ee
            ? _.setAttribute("aria-invalid", "true")
            : _.removeAttribute("aria-invalid")));
    };
    if (
      (n &&
        (n.setAttribute("aria-required", "true"),
        t
          ? n.removeAttribute("aria-invalid")
          : n.setAttribute("aria-invalid", "true")),
      q(o, "hint-date", !o.value || o.disabled, !S),
      q(d, "hint-duration", !d.value || d.disabled, !S && !c),
      q(le, "hint-event-duration", c && !le?.value, c),
      dt)
    ) {
      const _ = dt.querySelector(".addon-item") !== null;
      dt.style.display = _ && t && !r ? "flex" : "none";
    }
    const ee = document.getElementById("addonsCard");
    if (ee) {
      const _ = Array.from(ee.querySelectorAll(".field-row")).some(
        (te) => te.style.display !== "none",
      );
      ee.style.display = !t || r || !_ ? "none" : "";
    }
    (q(_e, "hint-guest", f && !_e.value, f),
      Pe(),
      Ye &&
        (e === "proposal" ||
        (e === "engagement" &&
          document.getElementById("proposalToggle")?.value === "yes")
          ? ((Ye.textContent =
              "Includes pre-proposal consultation. Mileage applies outside 20-mi radius."),
            (Ye.style.display = ""))
          : (Ye.style.display = "none")));
  }
  function vt() {
    const e = n.value,
      t = parseFloat(d.value);
    if (
      ((U.style.display = "none"),
      H && (H.style.display = "none"),
      e === "events")
    )
      return;
    const s = e === "wedding" && !Number.isNaN(t) && t > 0 && t < 3;
    (H && (H.style.display = s ? "block" : "none"),
      X && X.classList.toggle("micro-wedding-active", s),
      e === "headshot" &&
        Q.value === "yes" &&
        ($e
          ? (U.textContent = Ao)
          : (U.textContent = "Studio cost booked separately via Peerspace."),
        (U.style.display = "block")));
    const i = document.getElementById("elopementWeekendWarning");
    if (i) {
      const r = o.value ? Te(o.value) : null,
        w = r && [0, 6].includes(r.getDay());
      i.style.display = e === "elopement" && w ? "block" : "none";
    }
    const c = document.getElementById("pastDateNote");
    if (c) {
      const r = !o.disabled && G(o.value) && o.value < se() && !ze();
      c.style.display = r ? "block" : "none";
    }
  }
  function me() {
    go();
    const e = n.value,
      t = parseFloat(d.value),
      s = o.value,
      i = !isNaN(t) && t > 0,
      c = e === "headshot" && Q?.value === "yes";
    if (c && $e) {
      P(yn);
      return;
    }
    if (!e || !s) {
      P("Your quote: $–");
      return;
    }
    if (!G(s)) {
      P("Your quote: $–");
      return;
    }
    if (ge.has(e)) {
      P("Inquire Now");
      return;
    }
    if (s < se()) {
      P(ze() ? "Your quote: $–" : wn);
      return;
    }
    if (e !== "events" && !i) {
      P("Your quote: $–");
      return;
    }
    if (e === "wedding" && t < 3) {
      P(En);
      return;
    }
    if (e === "proposal" && t < 1) {
      P("Your quote: $–");
      return;
    }
    if (e !== "events" && i) {
      if (c && t > 8) {
        P(vn);
        return;
      }
      if (t > 24) {
        P(Dt);
        return;
      }
    }
    o.dataset.typing || nt(o);
    const r = Te(o.value),
      E = rt(r)?.multiplier || 1;
    if (e === "engagement") {
      const S = gn(t, r);
      if (!S) P("Your quote: $–");
      else {
        const Y =
          document.getElementById("proposalToggle")?.value === "yes" ? Xo : 0;
        P(`Your quote: ${ie.format(Math.round((S.total + Y + Z) * sn))}`);
      }
      return;
    }
    let f,
      l = 1,
      g = 0,
      y = !1,
      I = 0;
    switch (e) {
      case "wedding":
        f = Wo(t);
        break;
      case "elopement":
        f = Ln(t) + Go;
        break;
      case "family":
        f = qo(t);
        break;
      case "maternity":
        f = An(t);
        break;
      case "headshot":
        if (((f = Yo(t)), qe)) {
          const S = parseInt(qe.value || "0", 10);
          I = Co[S] ?? 0;
        }
        break;
      case "proposal":
        f = Vo(t);
        break;
      case "events": {
        const S = parseFloat(le?.value);
        if (isNaN(S) || S <= 0) {
          P("Your quote: $–");
          return;
        }
        if (S > 24) {
          P(Dt);
          return;
        }
        f = zo(S);
        const Y = sa[ye?.value] || 1;
        ((f *= Y),
          fo?.checked && (l *= 1 + mn),
          po?.checked && (l *= 1 + fn),
          ho?.checked && (g += pn),
          (y = !!(Fe && Fe.checked)));
        break;
      }
      default:
        return;
    }
    if (c) {
      const S = jo(t);
      S && (f = S);
    }
    if (
      (bn.includes(r.getMonth() + 1) && (f *= In),
      (f *=
        e === "engagement" || e === "elopement"
          ? Tn[r.getDay()]
          : _o[r.getDay()]),
      (f *= Dn(r)),
      e === "wedding" && ko.includes(r.getMonth() + 1) && (f *= $o),
      e === "wedding" || e === "elopement")
    ) {
      if ((ue && ue.checked && (f += Xt()), e === "wedding")) {
        const S = xo[_e.value] || 1;
        f += f * (S - 1);
      }
    } else e === "events" && ((f *= l), (f += g), y && (f *= 1 - hn));
    ((f *= E),
      e === "headshot" && (f += I),
      P(`Your quote: ${ie.format(Math.round((f + Z) * sn))}`));
  }
  function Xe(e) {
    (e && (e.target === n || e.target === Q) && Kt(),
      e && e.target === ue && Ht(),
      e && e.target === o && Gn(),
      Pt(),
      vt(),
      me(),
      Pe(),
      ft());
  }
  if (
    ([
      "highDemandNote",
      "elopementWeekendWarning",
      "studioNote",
      "microWeddingNote",
      "pastDateNote",
    ].forEach((e) => {
      document.getElementById(e)?.setAttribute("role", "status");
    }),
    k && (k.textContent = String(new Date().getFullYear())),
    Kt(),
    Pt(),
    vt(),
    me(),
    (ht = (h?.textContent || "").trim()),
    Pe(),
    ft(),
    [n, Q, _e, d, o, qe].filter(Boolean).forEach((e) => {
      const t = e === d || e === o ? "input" : "change";
      e.addEventListener(t, Xe);
    }),
    [x, re].forEach((e) => {
      if (!e) return;
      const t = e === re ? "input" : "change";
      (e.addEventListener(t, Xe), e.addEventListener(t, () => Xt()));
    }),
    x &&
      x.addEventListener("input", () => {
        x.removeAttribute("data-autoset");
      }),
    o)
  ) {
    let e = null;
    const t = 1500,
      s = () => {
        (e && (clearTimeout(e), (e = null)),
          o.dataset.typing && delete o.dataset.typing,
          nt(o),
          ft(),
          vt(),
          me());
      },
      i = () => {
        ((o.dataset.typing = "true"),
          e && clearTimeout(e),
          (e = window.setTimeout(() => {
            s();
          }, t)));
      };
    (o.addEventListener("keydown", i),
      o.addEventListener("input", i),
      o.addEventListener("blur", s));
  }
  ([le, ye].filter(Boolean).forEach((e) => {
    const t = e === le ? "input" : "change";
    e.addEventListener(t, Xe);
  }),
    document
      .getElementById("proposalToggle")
      ?.addEventListener("change", () => {
        const e = document.getElementById("proposalToggle").value === "yes",
          t = document.getElementById("proposalRateNote");
        t && (t.style.display = e ? "block" : "none");
        const s = document.getElementById("proposalNote");
        (s &&
          (e
            ? ((s.textContent =
                "Includes pre-proposal consultation. Mileage applies outside 20-mi radius."),
              (s.style.display = ""))
            : (s.style.display = "none")),
          me());
      }),
    n.addEventListener("change", () => {
      (!o.value && !ze() && (o.value = se()), Pe());
    }));
  function Ke(e) {
    const t = e.unitLabel || "°F",
      s = aa({
        tmax: e.tmax,
        tmin: e.tmin,
        conditionText: e.conditionText,
        weatherCode: e.weathercode,
        pop: e.pop,
        unitLabel: t,
      }),
      i = e.conditionText || st(e.weathercode) || "";
    if (e.type === "forecast") {
      const c = e.pop != null ? `${Math.round(e.pop)}%` : null;
      let r = i
        ? `Expect ${i.toLowerCase()} conditions`
        : "Conditions available";
      return (
        (r += c ? ` with a ${c} chance of precipitation.` : "."),
        (r += " Based on live forecast data."),
        `<div class="weather-card"><div class="icon">${s}</div><div class="meta"><div class="temps">${Math.round(e.tmax)}${t} / ${Math.round(e.tmin)}${t}</div><div class="place">${e.place}</div><div class="date">${e.dateLabel || ""}</div><div class="extra">Precip chance ${c || "–"}</div><div class="weather-summary">${r}</div></div></div>`
      );
    } else if (e.type === "historical") {
      let c = i
        ? `Typically ${i.toLowerCase()} conditions around this date`
        : "Historical averages for this date";
      return (
        (c += ". Based on the past 5 years of weather data."),
        `<div class="weather-card"><div class="icon">${s}</div><div class="meta"><div class="temps">~${Math.round(e.tmax)}${t} / ~${Math.round(e.tmin)}${t}</div><div class="place">${e.place}</div><div class="date">${e.dateLabel || ""}</div><div class="extra">Avg precip ~${e.precipSum} mm (5yr avg)</div><div class="weather-summary">${c}</div></div></div>`
      );
    } else
      return `<div class="weather-card"><div class="icon">${s}</div><div class="meta"><div class="temps">Seasonal overview</div><div class="place">${e.place || ""}</div><div class="date">${e.dateLabel || ""}</div><div class="extra">${e.seasonal}</div><div class="weather-summary">General seasonal estimate. Plan for variable conditions.</div></div></div>`;
  }
  async function yo(e, t) {
    const s = `https://geocoding-api.open-meteo.com/v1/reverse?latitude=${e}&longitude=${t}&count=1&language=en&format=json`;
    try {
      const i = await fetch(s);
      if (!i.ok) return null;
      const c = await i.json();
      if (!c.results || !c.results.length) return null;
      const r = c.results[0];
      return {
        name: `${r.name}${r.admin1 ? `, ${r.admin1}` : ""}${r.country ? `, ${r.country}` : ""}`,
        lat: r.latitude,
        lon: r.longitude,
        country: r.country || "",
        region: r.admin1 || "",
      };
    } catch {
      return null;
    }
  }
  function vo() {
    return new Promise((e, t) => {
      if (!navigator.geolocation) {
        t(new Error("Geolocation unavailable"));
        return;
      }
      navigator.geolocation.getCurrentPosition(
        (s) => e(s.coords),
        (s) => t(s),
        { enableHighAccuracy: !1, timeout: 1e4, maximumAge: 300 * 1e3 },
      );
    });
  }
  async function Eo() {
    try {
      const e = await vo(),
        t = await yo(e.latitude, e.longitude),
        s = {
          name: t?.name || "Current Location",
          lat: e.latitude,
          lon: e.longitude,
          country: t?.country || at || "",
          region: t?.region || "",
        },
        i = t?.name
          ? `Using your current location: ${t.name}`
          : "Using your current location";
      return { place: s, note: i };
    } catch {
      return null;
    }
  }
  if (R && C && W && j) {
    let c = function () {
        ((i = !0),
          R.classList.add("is-loading"),
          (R.disabled = !0),
          (C.disabled = !0));
        const a = `
        <div class="weather-loading">
          <span>Checking</span>
          <span class="dot"></span>
          <span class="dot"></span>
          <span class="dot"></span>
        </div>`;
        W.innerHTML = a;
      },
      r = function () {
        ((i = !1),
          R.classList.remove("is-loading"),
          (C.disabled = !1),
          ne(),
          Pe());
      },
      g = function () {
        if (
          (W.querySelectorAll(".weather-stale-chip").forEach((u) => u.remove()),
          E &&
            W.textContent.trim() &&
            !W.querySelector(".weather-loading") &&
            G(o.value) &&
            o.value !== E)
        ) {
          const u = W.querySelector(".temps");
          if (u) {
            const p = document.createElement("div");
            ((p.className = "weather-stale-chip"),
              (p.textContent = "Tap to re-check weather for this date"),
              p.addEventListener("click", () => et()),
              u.insertAdjacentElement("afterend", p));
          }
        }
      },
      V = function (a) {
        return (a || "").trim().toLowerCase();
      },
      q = function (a) {
        const m = V(a);
        return dn[m] || a;
      },
      ee = function (a) {
        const m = V(a);
        return !m || (/^[A-Za-z]{1,3}$/.test(a) && a === a.toUpperCase())
          ? a
          : ea[m] || a;
      },
      _ = function (a) {
        if (!a) return "";
        const m = a
          .split(",")
          .map((p) => p.trim())
          .filter(Boolean);
        if (!m.length) return a.trim();
        if (m.length >= 2) {
          const p = m.length - 2;
          m[p] = ee(m[p]);
        }
        const u = m.length - 1;
        return ((m[u] = q(m[u])), m.join(", "));
      },
      te = function (a, m) {
        if (!a) return "";
        const u = a
            .split(",")
            .map((v) => v.trim())
            .filter(Boolean),
          p = V(m);
        return u.some((v) => V(v) === p || !!dn[V(v)]) ? a : `${a}, ${m}`;
      },
      Ee = function (a) {
        if (!a) return !0;
        const m = a.country || "";
        if (m && Lt(m)) return !0;
        const u = a.name || "";
        return Lt(u);
      },
      Ue = function () {
        const a = C.value.trim(),
          m = !!a;
        let u;
        a ? (u = a) : t?.name ? (u = t.name) : (u = Y);
        let p = u;
        t?.country
          ? p.toLowerCase().includes(t.country.toLowerCase()) ||
            (p = `${p}, ${t.country}`)
          : !m && at && (p = te(p, at));
        const v = _(p);
        return { display: S, full: v ? `Check Location: ${v}` : S };
      },
      Et = function (a) {
        !R ||
          !a ||
          ((R.textContent = a.display),
          R.setAttribute("aria-label", a.full),
          R.setAttribute("title", a.full));
      },
      Je = function () {
        if (!C) return;
        const a = y.matches ? Jo : Ko;
        C.placeholder !== a && (C.placeholder = a);
      },
      ne = function (a = {}) {
        if (!R) return;
        const { animate: m = !0 } = a,
          u = Ue();
        if (R.textContent.trim() === u.display) {
          (R.setAttribute("aria-label", u.full),
            R.setAttribute("title", u.full));
          return;
        }
        if (!m) {
          (I && (clearTimeout(I), (I = null)),
            R.classList.remove("is-swapping"),
            Et(u));
          return;
        }
        (R.classList.add("is-swapping"),
          I && clearTimeout(I),
          (I = window.setTimeout(() => {
            (Et(u), R.classList.remove("is-swapping"), (I = null));
          }, 140)));
      },
      Jt = function () {
        return (
          !!o.value &&
          G(o.value) &&
          !!C.value.trim() &&
          !o.disabled &&
          !C.disabled &&
          !ge.has(n.value)
        );
      },
      Qt = function () {
        const a = (t?.name || C.value.trim()).toLowerCase(),
          m = o.value;
        return a !== w || m !== E;
      },
      we = function (a = !1) {
        if (!Jt()) {
          s && (clearTimeout(s), (s = null));
          return;
        }
        Qt() &&
          (s && clearTimeout(s),
          (s = setTimeout(
            () => {
              ((s = null), i || et());
            },
            a ? 0 : 250,
          )));
      },
      wt = function (a, m, u = !0) {
        const p = a.getMonth(),
          v = e[p],
          N = u ? v.hi : Math.round(((v.hi - 32) * 5) / 9),
          T = u ? v.lo : Math.round(((v.lo - 32) * 5) / 9),
          F = u ? "°F" : "°C";
        return `No forecast or archive reaches this date. A typical ${a.toLocaleString("en-US", { month: "long" })} around Washington DC: high ~${N}${F}, low ~${T}${F}, about ${v.rain} days in 30 with rain.`;
      },
      Zt = function (a) {
        const m = Te(se()).getTime(),
          u = a.getTime();
        return Math.round((u - m) / (1e3 * 60 * 60 * 24));
      },
      tn = function (a, m) {
        let u = 0;
        const p = m.toLowerCase();
        return (
          Lt(a.country) && (u += 4),
          a.region && a.region.toLowerCase().includes(p) && (u += 2),
          a.name.toLowerCase() === p
            ? (u += 3)
            : a.name.toLowerCase().startsWith(p)
              ? (u += 2)
              : a.name.toLowerCase().includes(p) && (u += 1),
          a.isCapital && (u += 1),
          u
        );
      },
      nn = function (a) {
        (j.querySelectorAll("li").forEach((m) => {
          const u = m === a;
          (m.classList.toggle("active", u),
            m.setAttribute("aria-selected", u ? "true" : "false"));
        }),
          C.setAttribute("aria-activedescendant", a ? a.id : ""));
      },
      oe = function (a, m = "") {
        if (
          ((j.textContent = ""),
          C.setAttribute("aria-activedescendant", ""),
          !a.length)
        ) {
          ((l = []),
            j.setAttribute("hidden", ""),
            C.setAttribute("aria-expanded", "false"));
          return;
        }
        const u = a
          .map((p, v) => ({ item: p, idx: v, score: tn(p, m) }))
          .sort((p, v) => v.score - p.score || p.idx - v.idx)
          .map(({ item: p }, v) => ({ item: p, i: v }));
        for (const { item: p, i: v } of u) {
          const N = document.createElement("li");
          ((N.id = `loc-suggestion-${v}`),
            N.setAttribute("role", "option"),
            N.setAttribute("aria-selected", "false"),
            (N.dataset.i = String(v)),
            (N.textContent = p.name),
            j.appendChild(N));
        }
        (j.removeAttribute("hidden"),
          C.setAttribute("aria-expanded", "true"),
          (l = u.map(({ item: p }) => p)));
      },
      on = function (a, m, u) {
        if (!m || m.hasAttribute("hidden")) return !1;
        const p = m.querySelectorAll("li");
        if (!p.length) return !1;
        const v = m.querySelector("li.active");
        let N = v ? Array.from(p).indexOf(v) : -1;
        const T = (F) => {
          (m === j
            ? nn(F)
            : (v && v.classList.remove("active"), F.classList.add("active")),
            F.scrollIntoView({ block: "nearest" }));
        };
        return a.key === "ArrowDown"
          ? (a.preventDefault(), (N = (N + 1) % p.length), T(p[N]), !0)
          : a.key === "ArrowUp"
            ? (a.preventDefault(),
              (N = N <= 0 ? p.length - 1 : N - 1),
              T(p[N]),
              !0)
            : a.key === "Enter" && v
              ? (a.preventDefault(), u(v), !0)
              : a.key === "Escape"
                ? (a.preventDefault(), oe([]), !0)
                : !1;
      };
    var ra = c,
      la = r,
      ca = g,
      da = V,
      ua = q,
      ma = ee,
      fa = _,
      pa = te,
      ha = Ee,
      ga = Ue,
      ya = Et,
      va = Je,
      Ea = ne,
      wa = Jt,
      ba = Qt,
      Ia = we,
      Ta = wt,
      Sa = Zt,
      Na = tn,
      La = nn,
      Aa = oe,
      Da = on;
    const e = [
      { hi: 44, lo: 29, rain: 8 },
      { hi: 48, lo: 31, rain: 7 },
      { hi: 56, lo: 38, rain: 9 },
      { hi: 67, lo: 47, rain: 9 },
      { hi: 76, lo: 57, rain: 10 },
      { hi: 85, lo: 66, rain: 9 },
      { hi: 89, lo: 71, rain: 9 },
      { hi: 87, lo: 69, rain: 8 },
      { hi: 80, lo: 62, rain: 7 },
      { hi: 69, lo: 50, rain: 7 },
      { hi: 58, lo: 42, rain: 7 },
      { hi: 48, lo: 33, rain: 8 },
    ];
    let t = null,
      s = null,
      i = !1,
      w = null,
      E = null,
      f = null,
      l = [];
    const y = window.matchMedia(Qo);
    let I = null;
    const S = "Check Location",
      Y = ot,
      wo = /^(localhost|127\.0\.0\.1)$/.test(location.hostname)
        ? `${new URLSearchParams(location.search).get("portal") || "http://localhost:4400"}/api/places`
        : "/api/places" /* no portal here: 404s straight to the open-meteo fallback */,
      bo = 3;
    async function Io(a) {
      const m = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(a)}&count=10&language=en&format=json`,
        u = await fetch(m);
      if (!u.ok) throw new Error("Geocoding failed");
      return ((await u.json()).results || [])
        .filter((v) => v.country_code === "US")
        .slice(0, 6)
        .map((v) => ({
          name: `${v.name}${v.admin1 ? `, ${v.admin1}` : ""}`,
          lat: v.latitude,
          lon: v.longitude,
          country: v.country || "",
          region: v.admin1 || "",
          isCapital: v.feature_code && v.feature_code.includes("PPLC"),
        }));
    }
    async function bt(a) {
      const m = String(a || "").trim();
      if (m.length >= bo)
        try {
          const u = await fetch(`${wo}?q=${encodeURIComponent(m)}`, {
            headers: { accept: "application/json" },
          });
          if (u.ok) {
            const p = await u.json(),
              v = (p && p.ok && Array.isArray(p.results) ? p.results : [])
                .filter(
                  (N) => Number.isFinite(N?.lat) && Number.isFinite(N?.lng),
                )
                .map((N) => ({
                  name: N.label,
                  lat: N.lat,
                  lon: N.lng,
                  country: N.country || "",
                  region: N.region || "",
                  isCapital: !1,
                }));
            if (v.length) return v;
          }
        } catch {}
      return Io(m);
    }
    async function en(a) {
      try {
        const m = await bt(a);
        if (m && m.length) return m[0];
      } catch {}
      if (typeof a == "string" && a.includes(",")) {
        const m = a.split(",")[0].trim();
        if (m && m !== a)
          try {
            const u = await bt(m);
            if (u && u.length) return u[0];
          } catch {}
      }
      return null;
    }
    async function To() {
      const a = await en(ot);
      return (
        a || { name: ot, lat: cn.lat, lon: cn.lon, country: at, region: "" }
      );
    }
    (Je(),
      typeof y.addEventListener == "function"
        ? y.addEventListener("change", Je)
        : typeof y.addListener == "function" && y.addListener(Je),
      ne({ animate: !1 }),
      j.addEventListener("click", (a) => {
        const m = a.target.closest("li");
        if (!m) return;
        const u = Number(m.getAttribute("data-i")),
          p = l[u];
        ((t = p || null), (C.value = p ? p.name : ""), ne(), oe([]), we(!0));
      }));
    const So = 260;
    let Qe = null,
      Ze = 0;
    (C.addEventListener("input", () => {
      const a = C.value.trim();
      if (
        ((t = null),
        (w = null),
        (f = null),
        ne({ animate: !1 }),
        a || ((Z = 0), Ae && (Ae.innerHTML = ""), me()),
        Qe && clearTimeout(Qe),
        a.length < 2)
      ) {
        (Ze++, oe([]));
        return;
      }
      Qe = window.setTimeout(async () => {
        Qe = null;
        const m = ++Ze;
        try {
          const u = await bt(a);
          m === Ze && oe(u, a);
        } catch {
          m === Ze && oe([]);
        }
      }, So);
    }),
      C.addEventListener("keydown", (a) => {
        !on(a, j, (u) => {
          const p = Number(u.getAttribute("data-i")),
            v = l[p];
          ((t = v || null), (C.value = v ? v.name : ""), ne(), oe([]), we(!0));
        }) &&
          a.key === "Enter" &&
          (a.preventDefault(), oe([]), (t = null), ne(), we(!0));
      }),
      C.addEventListener("change", () => {
        (ne(), we(!0));
      }),
      C.addEventListener("blur", () => we()));
    async function No(a, m, u) {
      const p = `${u.getFullYear()}-${String(u.getMonth() + 1).padStart(2, "0")}-${String(u.getDate()).padStart(2, "0")}`,
        v = `https://api.open-meteo.com/v1/forecast?latitude=${a}&longitude=${m}&start_date=${p}&end_date=${p}&daily=weathercode,temperature_2m_max,temperature_2m_min,precipitation_probability_mean&timezone=auto`,
        N = await fetch(v);
      if (!N.ok) throw new Error("Forecast failed");
      const T = await N.json();
      return !T.daily || !T.daily.time || !T.daily.time.length
        ? null
        : {
            tmax: T.daily.temperature_2m_max[0],
            tmin: T.daily.temperature_2m_min[0],
            pop: T.daily.precipitation_probability_mean
              ? T.daily.precipitation_probability_mean[0]
              : null,
            weathercode: T.daily.weathercode ? T.daily.weathercode[0] : null,
            conditionText: T.daily.weathercode
              ? st(T.daily.weathercode[0])
              : "",
          };
    }
    async function Lo(a, m, u) {
      const p = u.getFullYear(),
        v = String(u.getMonth() + 1).padStart(2, "0"),
        N = String(u.getDate()).padStart(2, "0"),
        T = [p - 1, p - 2, p - 3, p - 4, p - 5];
      let F = 0,
        be = 0,
        z = 0,
        ae = 0,
        Ie = null;
      for (const fe of T) {
        const O = `${fe}-${v}-${N}`,
          pe = `https://archive-api.open-meteo.com/v1/archive?latitude=${a}&longitude=${m}&start_date=${O}&end_date=${O}&daily=weathercode,temperature_2m_max,temperature_2m_min,precipitation_sum&timezone=auto`;
        try {
          const He = await fetch(pe);
          if (!He.ok) continue;
          const he = await He.json();
          if (!he.daily || !he.daily.time || !he.daily.time.length) continue;
          ((F += he.daily.temperature_2m_max[0]),
            (be += he.daily.temperature_2m_min[0]),
            (ae += he.daily.precipitation_sum[0]),
            z++,
            he.daily.weathercode && (Ie = he.daily.weathercode[0]));
        } catch {}
      }
      return z
        ? {
            tmax: +(F / z).toFixed(1),
            tmin: +(be / z).toFixed(1),
            precip_sum: +(ae / z).toFixed(2),
            weathercode: Ie,
            conditionText: st(Ie),
          }
        : null;
    }
    async function et(a) {
      const m = !!(a && a.deviceLocation);
      if (i) return;
      if (!G(o.value)) {
        W.textContent = "Pick a date first.";
        return;
      }
      (c(), o.dataset.typing || nt(o));
      const u = Te(o.value),
        p = `Forecast for ${ln(u)}`,
        v = `Conditions around ${ln(u)}`,
        N = C.value.trim();
      let T = t,
        F = "";
      try {
        if (!T)
          if (N) {
            const O = await en(N);
            if (!O) {
              W.innerHTML =
                '<div class="weather-note error">Unable to find that location. Please enter a city or try a different search.</div>';
              return;
            }
            ((T = O), (t = T));
          } else {
            const O = await Eo();
            if (O?.place) ((T = O.place), (F = O.note || ""), (t = T));
            else if (m) {
              W.innerHTML =
                '<div class="weather-note error">Could not get your location. Your browser may have blocked it. Type a city or address instead.</div>';
              return;
            } else {
              const pe = await To();
              ((T = pe), (F = `Using default location: ${pe.name}`), (t = T));
            }
          }
        if (!T) {
          W.innerHTML =
            '<div class="weather-note error">Unable to detect location. Please enter a city to check the weather.</div>';
          return;
        }
        ((w = (T.name || "").toLowerCase()), (E = o.value));
        const be = (T.name || "").toLowerCase();
        window._doCalculateMileage &&
          be !== f &&
          ((f = be), window._doCalculateMileage(T));
        const z = Zt(u),
          ae = Ee(T),
          Ie = ae ? "°F" : "°C";
        if (z <= 16 && z >= -2) {
          const O = await No(T.lat, T.lon, u);
          if (O) {
            const pe = it(O.tmax, ae),
              He = it(O.tmin, ae);
            W.innerHTML = Ge(
              Ke({
                type: "forecast",
                place: T.name,
                tmax: pe,
                tmin: He,
                pop: O.pop,
                dateLabel: p,
                conditionText: O.conditionText,
                weathercode: O.weathercode,
                unitLabel: Ie,
              }),
              F,
            );
            return;
          }
        }
        const fe = await Lo(T.lat, T.lon, u);
        if (fe) {
          const O = it(fe.tmax, ae),
            pe = it(fe.tmin, ae);
          W.innerHTML = Ge(
            Ke({
              type: "historical",
              place: T.name,
              tmax: O,
              tmin: pe,
              precipSum: fe.precip_sum,
              dateLabel: v,
              conditionText: fe.conditionText,
              weathercode: fe.weathercode,
              unitLabel: Ie,
            }),
            F,
          );
        } else
          W.innerHTML = Ge(
            Ke({
              type: "seasonal",
              place: T.name,
              seasonal: wt(u, T.name, ae),
              dateLabel: v,
              unitLabel: Ie,
            }),
            F,
          );
      } catch {
        const z = T || { name: ot };
        W.innerHTML = Ge(
          Ke({
            type: "seasonal",
            place: z.name,
            seasonal: wt(u, z.name, Ee(z)),
            dateLabel: v,
            unitLabel: Ee(z) ? "°F" : "°C",
          }),
          F,
        );
      } finally {
        r();
      }
    }
    R.addEventListener("click", () => et());
    const an = document.getElementById("useCurrentLoc");
    (an &&
      an.addEventListener("click", () => {
        ((C.value = ""),
          (t = null),
          (w = null),
          (f = null),
          oe([]),
          ne({ animate: !1 }),
          et({ deviceLocation: !0 }));
      }),
      o &&
        (o.addEventListener("change", () => {
          (g(), we());
        }),
        o.addEventListener("input", g)));
  } else
    console.warn(
      "[Pricing Widget] Weather UI not found; skipping weather wiring.",
    );
  {
    let e = function (r, w, E, f) {
        const g = (Y) => (Y * Math.PI) / 180,
          y = g(E - r),
          I = g(f - w),
          S =
            Math.sin(y / 2) ** 2 +
            Math.cos(g(r)) * Math.cos(g(E)) * Math.sin(I / 2) ** 2;
        return 2 * 3958.8 * Math.asin(Math.sqrt(S));
      },
      i = function (r, w, E, f) {
        const l = w <= 0,
          g = l ? "✅" : "🚗",
          y = l
            ? "No mileage fee"
            : `+${ie.format(Math.round(w))} mileage fee, added to your quote`,
          I = Math.max(0, r - It),
          S = l
            ? `${r.toFixed(1)} mi, within ${It}-mile range`
            : `${r.toFixed(1)} mi → ${I.toFixed(1)} mi over × 2 × $${rn}/mi`;
        return `<div class="mileage-result-card">
          <div class="mileage-icon">${g}</div>
          <div class="mileage-meta">
            <div class="mileage-main">${y}</div>
            <div class="mileage-detail">${S}</div>
            ${f ? '<div class="mileage-detail">This route uses a toll road. Tolls are not included and are billed at cost.</div>' : ""}
            ${E ? '<div class="mileage-detail mileage-fallback">⚠ Straight-line estimate (routing API unavailable)</div>' : ""}
            <div class="mileage-detail mileage-ballpark">Ballpark estimate, exact mileage confirmed at booking</div>
          </div>
        </div>`;
      };
    var Ca = e,
      Ma = i;
    const t = 6e3;
    async function s(r, w) {
      const E = {
          locations: [
            { lon: tt.lon, lat: tt.lat, type: "break" },
            { lon: w, lat: r, type: "break" },
          ],
          costing: "auto",
          costing_options: { auto: { use_tolls: 1 } },
          units: "miles",
        },
        f = new AbortController(),
        l = setTimeout(() => f.abort(), t);
      let g;
      try {
        g = await fetch("https://valhalla1.openstreetmap.de/route", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(E),
          signal: f.signal,
        });
      } finally {
        clearTimeout(l);
      }
      if (!g.ok) throw new Error("Routing failed");
      const y = await g.json(),
        I = y.trip?.summary?.length ?? null;
      if (!I) throw new Error("No route returned");
      const S = !!y.trip?.summary?.has_toll;
      return { miles: I, hasToll: S };
    }
    async function c(r) {
      if (!(!r || !Ae)) {
        ((Ae.innerHTML = ""), (Z = 0), me());
        try {
          let w = null,
            E = !1,
            f = !1;
          try {
            const g = await s(r.lat, r.lon);
            ((w = g.miles), (f = g.hasToll));
          } catch {
            ((E = !0), (w = e(tt.lat, tt.lon, r.lat, r.lon) * 1.3));
          }
          const l = Math.max(0, w - It) * 2 * rn;
          ((Z = l), (mt = f), (Ae.innerHTML = i(w, l, E, f)), me());
        } catch {
          ((Ae.innerHTML =
            '<div class="weather-note error">Could not calculate mileage. Please try again.</div>'),
            (Z = 0),
            me());
        } finally {
        }
      }
    }
    window._doCalculateMileage = c;
  }
});
(() => {
  const n = "ew:quote-handoff",
    d = () => {
      const b = document.getElementById("estimateSummary");
      if (!b || b.hidden) return null;
      const L =
          document.getElementById("estimateSummaryTotal")?.textContent || "",
        h = Number(L.replace(/[^0-9.]/g, ""));
      if (!Number.isFinite(h) || h <= 0) return null;
      const B = document.getElementById("estimateSummaryList"),
        D = [],
        M = [...(B?.children || [])],
        K = M.filter((k) => k.querySelector("dt") && k.querySelector("dd"));
      if (K.length)
        for (const k of K) {
          const $ = k.querySelector("dt")?.textContent?.trim(),
            x = k.querySelector("dd")?.textContent?.trim();
          $ && x && D.push(`${$}: ${x}`);
        }
      else
        for (let k = 0; k < M.length - 1; k += 2) {
          if (M[k].tagName !== "DT" || M[k + 1].tagName !== "DD") continue;
          const $ = M[k].textContent?.trim(),
            x = M[k + 1].textContent?.trim();
          $ && x && D.push(`${$}: ${x}`);
        }
      const U = (k) => document.getElementById(k),
        H = (k) => {
          const $ = U(k);
          return ($ && $.offsetParent !== null && $.value) || "";
        };
      return {
        at: Date.now(),
        quoteCents: Math.round(h * 100),
        quoteNote: D.join(" · "),
        shootType: U("shootType")?.value || "",
        date: U("shootDate")?.value || "",
        duration: H("duration") || H("eventDurationInput"),
        guestCount: H("guestCount"),
        city: H("weatherLocation"),
      };
    },
    A = () => {
      try {
        const b = d();
        if (!b) {
          sessionStorage.removeItem(n);
          return;
        }
        sessionStorage.setItem(n, JSON.stringify(b));
      } catch {}
    };
  (document.addEventListener(
    "click",
    (b) => {
      const L =
        b.target instanceof Element ? b.target.closest("a[href]") : null;
      if (!L) return;
      let h;
      try {
        h = new URL(L.getAttribute("href"), window.location.href);
      } catch {
        return;
      }
      h.origin === window.location.origin &&
        /^\/contact\/?$/.test(h.pathname) &&
        A();
    },
    !0,
  ),
    (window.EWQuoteHandoff = {
      KEY: n,
      TTL_MS: 12e5,
      read() {
        try {
          const b = sessionStorage.getItem(n);
          if (!b) return null;
          const L = JSON.parse(b);
          return !L || typeof L != "object"
            ? null
            : !Number.isFinite(L.at) || Date.now() - L.at > 12e5
              ? (sessionStorage.removeItem(n), null)
              : L;
        } catch {
          return null;
        }
      },
    }));
})();
