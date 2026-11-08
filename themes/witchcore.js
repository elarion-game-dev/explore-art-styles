// Witchcore: a herbarium and a tarot deck by moonlight.
// The hero moon shows tonight's real phase, the page itself waxes from new moon to full and back as you read,
// and the core elements are tarot cards dealt face down that turn over as they come into view.
(() => {
  const root = document.documentElement;
  const calm = () => root.dataset.calm === '1';
  const SYNODIC = 29.530588853;
  // A known new moon, 6 January 2000 18:14 UTC. Mean lunations from there are good to about a day.
  const REF = Date.UTC(2000, 0, 6, 18, 14);
  const phaseAt = (t) => { const p = ((t - REF) / 86400000 / SYNODIC) % 1; return p < 0 ? p + 1 : p; };
  const NAMES = [
    [0.0339, 'New moon'], [0.2161, 'Waxing crescent'], [0.2839, 'First quarter'], [0.4661, 'Waxing gibbous'],
    [0.5339, 'Full moon'], [0.7161, 'Waning gibbous'], [0.7839, 'Last quarter'], [0.9661, 'Waning crescent'], [1.01, 'New moon'],
  ];
  const nameOf = (p) => NAMES.find(([lim]) => p < lim)[1];

  // The lit part of a moon of radius r centred on 0,0, for phase p (0 new, 0.5 full).
  const litPath = (p, r) => {
    const k = Math.cos(2 * Math.PI * p);
    const rx = Math.abs(k) * r;
    const waxing = p < 0.5;
    const outer = waxing ? 1 : 0;
    const inner = waxing ? (k > 0 ? 0 : 1) : (k > 0 ? 1 : 0);
    return `M0 ${-r}A${r} ${r} 0 0 ${outer} 0 ${r}A${rx.toFixed(2)} ${r} 0 0 ${inner} 0 ${-r}Z`;
  };
  let uid = 0;
  const moonSVG = (p, size, cls, detail) => {
    const r = 50;
    const id = `wc-m${uid++}`;
    const craters = detail ? `<g clip-path="url(#${id})" fill="#000" fill-opacity=".09"><circle cx="-18" cy="-14" r="11"/><circle cx="14" cy="-24" r="6"/><circle cx="20" cy="10" r="13"/><circle cx="-8" cy="22" r="7"/><circle cx="-30" cy="12" r="5"/><circle cx="32" cy="-6" r="4"/></g>` : '';
    return `<svg class="${cls}" viewBox="-60 -60 120 120" width="${size}" height="${size}" aria-hidden="true" focusable="false">
      <defs><clipPath id="${id}"><path d="${litPath(p, r)}"/></clipPath><radialGradient id="${id}g" cx=".38" cy=".35" r=".75"><stop offset="0" stop-color="#fbf5dc"/><stop offset=".7" stop-color="#e9dca8"/><stop offset="1" stop-color="#c9b97e"/></radialGradient></defs>
      <circle r="${r}" class="wc-moon-dark"/>
      <path d="${litPath(p, r)}" fill="url(#${id}g)"/>${craters}
      <circle r="${r}" fill="none" class="wc-moon-rim"/>
    </svg>`;
  };

  const now = Date.now();
  const p = phaseAt(now);
  const lit = Math.round(((1 - Math.cos(2 * Math.PI * p)) / 2) * 100);
  // Days to the next time the phase reaches target; anything within half a day either side counts as tonight.
  const daysTo = (target) => { let d = (((target - p) % 1 + 1) % 1) * SYNODIC; if (d > SYNODIC - 0.5) d -= SYNODIC; return Math.max(0, Math.round(d)); };
  const toFull = daysTo(0.5);
  const toNew = daysTo(1);
  const plural = (n, w) => `${n} ${w}${n === 1 ? '' : 's'}`;
  root.style.setProperty('--moon-lit', (lit / 100).toFixed(2));

  // Hero: tonight's moon above the title, and an almanac line under the tagline.
  const heroText = document.querySelector('.hero-text');
  const big = document.createElement('div');
  big.className = 'wc-bigmoon';
  big.innerHTML = moonSVG(p, 220, 'wc-moon wc-moon-big', true);
  heroText.prepend(big);
  const alm = document.createElement('div');
  alm.className = 'wc-almanac';
  const eight = Array.from({ length: 8 }, (_, i) => i / 8);
  const nearest = Math.round(p * 8) % 8;
  alm.innerHTML = `<p class="wc-alm-head">The moon tonight</p>
    <p class="wc-alm-name">${nameOf(p)}</p>
    <p class="wc-alm-data">${lit}% lit · ${toFull === 0 ? 'full tonight' : `full in ${plural(toFull, 'day')}`} · ${toNew === 0 ? 'new tonight' : `new in ${plural(toNew, 'day')}`}</p>
    <ol class="wc-alm-row" aria-hidden="true">${eight.map((q, i) => `<li${i === nearest ? ' class="is-now"' : ''}>${moonSVG(q, 26, 'wc-moon')}</li>`).join('')}</ol>`;
  heroText.querySelector('.hero-tagline').after(alm);

  // The page waxes and wanes: each section and its contents link carry a phase.
  const SEC = { feel: 0.07, core: 0.18, how: 0.3, palette: 0.42, vibe: 0.5, refs: 0.63, related: 0.8 };
  for (const [id, q] of Object.entries(SEC)) {
    const t = document.querySelector(`#${id} .sec-title`);
    if (t) t.insertAdjacentHTML('afterbegin', moonSVG(q, 34, 'wc-moon wc-sec-moon'));
    const a = document.querySelector(`.toc a[href="#${id}"]`);
    if (a) a.insertAdjacentHTML('afterbegin', moonSVG(q, 30, 'wc-moon wc-toc-moon'));
  }

  // The feel section is a herbarium sheet: a pressed nightshade sprig, taped down.
  const feel = document.getElementById('feel');
  if (feel) {
    const sheet = document.createElement('figure');
    sheet.className = 'wc-specimen';
    sheet.setAttribute('aria-hidden', 'true');
    const leaf = (x, y, a, s) => `<path transform="translate(${x} ${y}) rotate(${a}) scale(${s})" d="M0 0C10-14 34-18 52-6 34 6 12 8 0 0Z" fill="#5f7a2a" stroke="#2c3a14" stroke-width="1.2"/><path transform="translate(${x} ${y}) rotate(${a}) scale(${s})" d="M0 0C16-4 32-6 50-6" fill="none" stroke="#2c3a14" stroke-width=".8" opacity=".7"/>`;
    const bell = (x, y, a) => `<g transform="translate(${x} ${y}) rotate(${a})"><path d="M0 0v8" stroke="#3b4a1c" stroke-width="1.4"/><path d="M-7 8c0 12 2 18 7 20 5-2 7-8 7-20z" fill="#7a3f55" stroke="#3a1e28" stroke-width="1.2"/><path d="M-7 27l3-3 4 4 4-4 3 3" fill="none" stroke="#3a1e28" stroke-width="1"/></g>`;
    const berry = (x, y) => `<g transform="translate(${x} ${y})"><path d="M0-12v6M-6-8l6 2 6-2" stroke="#3b4a1c" stroke-width="1.4" fill="none"/><circle r="8" fill="#1a1416" stroke="#000" stroke-width="1"/><circle cx="-3" cy="-3" r="2.2" fill="#fff" fill-opacity=".55"/></g>`;
    sheet.innerHTML = `<svg viewBox="0 0 200 330">
      <path d="M100 322C98 270 104 220 98 160S92 70 104 20" fill="none" stroke="#3b4a1c" stroke-width="3"/>
      <path d="M100 250c-20-20-36-30-52-34M99 190c22-14 40-30 48-48M99 120c-18-12-30-28-34-46M102 70c14-6 26-16 30-30" fill="none" stroke="#3b4a1c" stroke-width="2"/>
      ${leaf(100, 250, 200, 1.2)}${leaf(99, 190, -20, 1.1)}${leaf(98, 150, 160, 1)}${leaf(99, 120, 210, .9)}${leaf(102, 96, -35, .85)}${leaf(102, 70, -50, .7)}${leaf(100, 300, 170, 1.1)}${leaf(100, 285, 10, .9)}
      ${bell(48, 216, 20)}${bell(147, 142, -24)}${bell(66, 74, 14)}${berry(130, 40)}${berry(36, 190)}
      <path d="M86 322c-4 4-12 6-18 4M104 322c6 4 12 8 20 6M96 324c-2 4-2 8 0 10" fill="none" stroke="#6b5a3a" stroke-width="1.4"/>
    </svg><span class="wc-tape wc-tape-1"></span><span class="wc-tape wc-tape-2"></span><span class="wc-tape wc-tape-3"></span>
    <figcaption><i>Atropa belladonna</i> L.<br>deadly nightshade</figcaption>`;
    feel.querySelector('.origins')?.before(sheet);
    const lab = feel.querySelector('.origins h3');
    if (lab) lab.insertAdjacentHTML('beforebegin', '<p class="wc-label-head" aria-hidden="true"><span>Herbarium</span><span>No. 62</span></p>');
  }

  // Tarot: each core element becomes a card with a numeral, an emblem and a patterned back.
  const EMBLEMS = [
    '<path d="M50 92V20M50 76c-14-2-24-10-28-22 14 0 24 8 28 22zM50 76c14-2 24-10 28-22-14 0-24 8-28 22zM50 56c-12-2-20-10-22-20 12 0 20 8 22 20zM50 56c12-2 20-10 22-20-12 0-20 8-22 20zM50 36c-8-2-12-8-12-16 8 2 12 8 12 16zM50 36c8-2 12-8 12-16-8 2-12 8-12 16z"/>',
    '<path d="M60 18a32 32 0 1 0 0 64 26 26 0 1 1 0-64z"/><path d="M78 26l2 6 6 2-6 2-2 6-2-6-6-2 6-2zM84 58l1.5 4 4 1.5-4 1.5-1.5 4-1.5-4-4-1.5 4-1.5z"/>',
    '<path d="M38 90h24M42 90V46h16v44M42 52c4 3 8 3 10 0M50 40c-7-6-6-14 0-22 6 8 7 16 0 22zM50 34c-2-2-2-5 0-8 2 3 2 6 0 8z"/><path d="M58 60c3 2 3 6 0 9"/>',
    '<circle cx="50" cy="52" r="34"/><path d="M50 12l7 26 23-14-14 23 26 7-26 7 14 23-23-14-7 26-7-26-23 14 14-23-26-7 26-7-14-23 23 14z"/><circle cx="50" cy="52" r="6"/>',
    '<path d="M24 56h52c0 18-12 30-26 30S24 74 24 56zM20 56h60M40 86l-4 8h28l-4-8M58 50l20-34M74 22l8-6"/><path d="M34 64c4 8 10 12 16 12"/>',
    '<path d="M22 54c0-20 12-34 28-34s28 14 28 34z"/><path d="M42 54v30c0 4 4 6 8 6s8-2 8-6V54M36 36a4 4 0 1 0 0.1 0M58 32a5 5 0 1 0 0.1 0M66 46a3 3 0 1 0 0.1 0M46 44a3 3 0 1 0 0.1 0"/>',
  ];
  const BACK = `<svg viewBox="0 0 100 140" aria-hidden="true">
    <circle cx="50" cy="70" r="30" fill="#0b1512" stroke="#c9a54e" stroke-width="1"/>
    <circle cx="50" cy="70" r="24" fill="none" stroke="#c9a54e" stroke-width=".5" stroke-dasharray="1.5 2.5"/>
    <path d="M58 55a16 16 0 1 0 0 30 13 13 0 1 1 0-30z" fill="#e7cf86"/>
    <path d="M50 12l2 6 6 2-6 2-2 6-2-6-6-2 6-2zM50 112l2 6 6 2-6 2-2 6-2-6-6-2 6-2z" fill="#e7cf86"/>
  </svg>`;
  const ROMAN = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X'];
  const list = document.querySelector('.core-list');
  const items = list ? [...list.children] : [];
  items.forEach((li, i) => {
    const card = document.createElement('div');
    card.className = 'wc-card';
    const face = document.createElement('div');
    face.className = 'wc-face';
    face.innerHTML = `<span class="wc-num" aria-hidden="true">${ROMAN[i] || i + 1}</span><svg class="wc-emblem" viewBox="0 0 100 100" aria-hidden="true">${EMBLEMS[i % EMBLEMS.length]}</svg>`;
    face.append(...li.childNodes);
    const back = document.createElement('div');
    back.className = 'wc-back';
    back.setAttribute('aria-hidden', 'true');
    back.innerHTML = BACK;
    card.append(face, back);
    li.append(card);
    li.style.setProperty('--i', i);
  });

  const timers = [];
  const deal = () => {
    timers.splice(0).forEach(clearTimeout);
    items.forEach((li, i) => timers.push(setTimeout(() => li.classList.remove('wc-down'), calm() ? 0 : 260 + i * 220)));
  };
  if (list && !calm()) {
    items.forEach((li) => li.classList.add('wc-down'));
    if ('IntersectionObserver' in window) {
      const io = new IntersectionObserver((es) => { if (es.some((e) => e.isIntersecting)) { io.disconnect(); deal(); } }, { threshold: 0.12 });
      io.observe(list);
    } else deal();
  }
  window.addEventListener('eas:calm', () => { if (calm()) { timers.splice(0).forEach(clearTimeout); items.forEach((li) => li.classList.remove('wc-down')); } });

  // Shuffle the deck and deal again.
  if (list) {
    const bar = document.createElement('div');
    bar.className = 'wc-deck-bar';
    bar.innerHTML = '<button type="button" class="btn wc-shuffle">Shuffle and deal again</button><span class="brief-note">Six cards, one for each core element</span>';
    list.before(bar);
    bar.querySelector('button').addEventListener('click', () => {
      if (calm()) {
        const order = items.slice().sort(() => Math.random() - 0.5);
        order.forEach((li) => list.append(li));
        return;
      }
      items.forEach((li) => li.classList.add('wc-down'));
      timers.push(setTimeout(() => {
        const order = items.slice().sort(() => Math.random() - 0.5);
        order.forEach((li) => list.append(li));
        order.forEach((li, i) => timers.push(setTimeout(() => li.classList.remove('wc-down'), 300 + i * 220)));
      }, 900));
    });
  }

  // Specimen numbers on the reference sheets.
  document.querySelectorAll('.ref-gallery .shot').forEach((f, i) => f.style.setProperty('--n', `"${String(i + 1).padStart(2, '0')}"`));
})();
