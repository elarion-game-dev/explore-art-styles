// Solarpunk: a leaded-glass window in the hero shows the sky at the visitor's own time of day,
// and the same light falls across the page. The sundial lets you move through Mucha's four times of day.
(() => {
  const root = document.documentElement;
  const NS = 'http://www.w3.org/2000/svg';
  const calm = () => root.dataset.calm === '1';

  // Colour keys through a day. Values in between are blended.
  const NIGHT = { top: '#0b1533', mid: '#1a2850', bot: '#2c3a62', wall: '#1e2c35', beam: '#9fb8ff', sun: '#eef2ff', stars: 1, lamps: 1, dusk: 0.55, str: 0.32 };
  const KEYS = [
    [0, NIGHT],
    [4.5, NIGHT],
    [5.4, { top: '#28356e', mid: '#6a5f93', bot: '#d9928a', wall: '#8c8aa8', beam: '#ffc0a8', sun: '#ffb47a', stars: 0.5, lamps: 0.9, dusk: 0.38, str: 0.5 }],
    [6.4, { top: '#4a63a0', mid: '#d29aa6', bot: '#ffcb9a', wall: '#e9cdb8', beam: '#ffcfa6', sun: '#ffc985', stars: 0.05, lamps: 0.3, dusk: 0.14, str: 0.75 }],
    [8.2, { top: '#78c2ee', mid: '#bfe3f2', bot: '#ffe6b8', wall: '#eadcb9', beam: '#ffeab2', sun: '#fff0b8', stars: 0, lamps: 0, dusk: 0, str: 0.85 }],
    [12.5, { top: '#4fb1ec', mid: '#9fd8f5', bot: '#e6f6fb', wall: '#e7dab4', beam: '#fff6cc', sun: '#fffbe8', stars: 0, lamps: 0, dusk: 0, str: 0.95 }],
    [16.4, { top: '#64b5e6', mid: '#b4dcee', bot: '#ffdfa4', wall: '#ebd7ae', beam: '#ffe09c', sun: '#ffe79c', stars: 0, lamps: 0, dusk: 0, str: 0.9 }],
    [18.2, { top: '#5a64a8', mid: '#e3958a', bot: '#ffb562', wall: '#ecc39a', beam: '#ffbb76', sun: '#ff9550', stars: 0.05, lamps: 0.5, dusk: 0.12, str: 0.85 }],
    [19.4, { top: '#2a2f66', mid: '#7d5a8a', bot: '#e08a6a', wall: '#a99bb5', beam: '#ffc6a0', sun: '#eef2ff', stars: 0.45, lamps: 0.9, dusk: 0.3, str: 0.55 }],
    [20.6, { top: '#16204a', mid: '#2f3366', bot: '#5a4a72', wall: '#36394f', beam: '#c4b4ff', sun: '#eef2ff', stars: 0.85, lamps: 1, dusk: 0.48, str: 0.4 }],
    [24, NIGHT],
  ];
  const TIMES = [
    { from: 5, to: 10, fr: 'Éveil du matin', en: 'Morning awakening', tod: 'dawn' },
    { from: 10, to: 16, fr: 'Éclat du jour', en: 'Brightness of day', tod: 'day' },
    { from: 16, to: 21, fr: 'Rêverie du soir', en: 'Evening reverie', tod: 'dusk' },
    { from: 21, to: 29, fr: 'Repos de la nuit', en: "Night's rest", tod: 'night' },
  ];

  const hex = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
  const toHex = (c) => '#' + c.map((v) => Math.round(v).toString(16).padStart(2, '0')).join('');
  const mix = (a, b, t) => (typeof a === 'number' ? a + (b - a) * t : toHex(hex(a).map((v, i) => v + (hex(b)[i] - v) * t)));
  const sample = (h) => {
    let i = KEYS.findIndex(([k]) => k > h);
    if (i < 1) i = 1;
    const [h0, a] = KEYS[i - 1];
    const [h1, b] = KEYS[i];
    const t = Math.min(1, Math.max(0, (h - h0) / (h1 - h0)));
    const out = {};
    for (const k of Object.keys(a)) out[k] = mix(a[k], b[k], t);
    return out;
  };
  const timeOf = (h) => TIMES.find((x) => (h >= x.from && h < x.to) || (h + 24 >= x.from && h + 24 < x.to)) || TIMES[1];
  const clock = (h) => `${String(Math.floor(h) % 24).padStart(2, '0')}:${String(Math.round((h % 1) * 60) % 60).padStart(2, '0')}`;

  // The great window. Glass first, then the lead on top, like the real thing.
  const hero = document.querySelector('.hero');
  const win = document.createElement('div');
  win.className = 'sp-window';
  win.setAttribute('aria-hidden', 'true');
  const turbine = (x, y, h, r, d) => `<g class="spw-turbine">
      <path d="M${x} ${y}L${x} ${y - h}" stroke="#1c2b22" stroke-width="5.5" stroke-linecap="round"/>
      <path d="M${x} ${y}L${x} ${y - h}" stroke="#f3eedf" stroke-width="2.6" stroke-linecap="round"/>
      <g transform="translate(${x} ${y - h})"><g class="spw-rotor" style="animation-duration:${d}s">
        <circle r="${r}" fill="none"/>
        ${[0, 120, 240].map((a) => `<path transform="rotate(${a})" d="M0 0L-2.6 ${-r * 0.25}L0 ${-r}L2.4 ${-r * 0.22}Z" fill="#f3eedf" stroke="#1c2b22" stroke-width="1.3" stroke-linejoin="round"/>`).join('')}
        <circle r="2.6" fill="#f3eedf" stroke="#1c2b22" stroke-width="1.3"/>
      </g></g></g>`;
  const petals = (cx, cy, r, n, len) => Array.from({ length: n }, (_, i) => `<ellipse cx="${cx}" cy="${cy - r - len / 2}" rx="${len * 0.32}" ry="${len / 2}" transform="rotate(${(360 / n) * i} ${cx} ${cy})"/>`).join('');
  const stars = [[60, 120], [96, 74], [140, 150], [182, 52], [226, 98], [262, 40], [300, 130], [338, 84], [118, 214], [352, 196], [74, 250], [208, 182], [290, 228], [160, 96]];
  win.innerHTML = `<svg viewBox="0 -6 400 546" xmlns="${NS}" role="presentation" preserveAspectRatio="xMidYMid meet">
  <defs>
    <clipPath id="spw-clip"><path d="M20 540V190A180 180 0 0 1 380 190V540Z"/></clipPath>
    <linearGradient id="spw-sky" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" style="stop-color:var(--sky-top)"/><stop offset=".55" style="stop-color:var(--sky-mid)"/><stop offset=".72" style="stop-color:var(--sky-bot)"/>
    </linearGradient>
    <radialGradient id="spw-glow"><stop offset="0" style="stop-color:var(--sun-col);stop-opacity:.9"/><stop offset=".45" style="stop-color:var(--sun-col);stop-opacity:.35"/><stop offset="1" style="stop-color:var(--sun-col);stop-opacity:0"/></radialGradient>
    <filter id="spw-tex" x="0" y="0" width="100%" height="100%"><feTurbulence type="fractalNoise" baseFrequency=".035 .06" numOctaves="3" seed="7"/><feColorMatrix values="0 0 0 0 1  0 0 0 0 1  0 0 0 0 .92  0 0 0 -1.1 .9"/></filter>
  </defs>
  <g clip-path="url(#spw-clip)">
    <rect width="400" height="540" fill="url(#spw-sky)"/>
    <g class="spw-stars" fill="#fffbe8">${stars.map(([x, y], i) => `<circle cx="${x}" cy="${y}" r="${i % 3 ? 1.3 : 2}"/>`).join('')}</g>
    <g class="spw-sun"><circle r="70" fill="url(#spw-glow)"/><g class="spw-rays">${Array.from({ length: 12 }, (_, i) => `<path transform="rotate(${i * 30})" d="M-4 -30L0 -44L4 -30Z" style="fill:var(--sun-col)" stroke="#1c2b22" stroke-width="1.4" stroke-linejoin="round"/>`).join('')}</g><circle r="24" style="fill:var(--sun-col)" stroke="#1c2b22" stroke-width="3"/></g>
    <g class="spw-moon"><circle r="46" fill="url(#spw-glow)"/><circle r="17" fill="#eef1fb" stroke="#1c2b22" stroke-width="2.6"/><circle cx="8" cy="-5" r="14" style="fill:var(--sky-top)"/></g>
    <g fill="#fff" fill-opacity=".62" stroke="#1c2b22" stroke-width="3" stroke-linejoin="round">
      <path transform="translate(70 -2)" d="M44 236c4-14 22-18 32-8 6-12 28-12 32 4 12-2 20 8 16 16H44c-8 0-6-10 0-12z"/>
      <path transform="translate(-40 52)" d="M262 160c4-12 20-16 30-6 8-12 30-8 30 8 12 0 16 12 8 16h-72c-8-2-6-14 4-18z"/>
    </g>
    <path d="M20 372C70 340 120 330 170 342s90-22 140-24c30-1 52 8 70 16V540H20Z" fill="#9cc56b" stroke="#1c2b22" stroke-width="3.5"/>
    <g fill="#d8f1fb" fill-opacity=".85" stroke="#1c2b22" stroke-width="2.4"><path d="M64 344a31 31 0 0 1 62 0z"/><path d="M76 344q3-22 19-31M114 344q-3-22-19-31M95 344v-31M68 332h54" fill="none"/></g>
    ${turbine(222, 330, 62, 24, 7)}${turbine(266, 322, 52, 20, 5.6)}${turbine(312, 318, 42, 16, 6.4)}
    <path d="M20 432c60-30 120-34 180-16 50 14 100-12 180-16V540H20Z" fill="#6c9c2f" stroke="#1c2b22" stroke-width="3.5"/>
    <g stroke="#1c2b22" stroke-width="2.4" stroke-linejoin="round">
      <path d="M136 412v-22h34v22z" fill="#c4783a"/><path d="M131 392q22-24 44 0z" fill="#4f8a22"/>
      <path d="M160 381l12 5-3 7-12-5z" fill="#3c5a9a"/><path d="M164.5 383l-3 7M155 386l12 5" stroke-width="1" fill="none"/>
      <path d="M148 412v-9a5 5 0 0 1 10 0v9z" fill="#22303a"/><path class="spw-lamp" d="M148 412v-9a5 5 0 0 1 10 0v9z"/>
      <path d="M284 404v-26h44v26z" fill="#d9a35c"/><path d="M278 380q28-28 56 0z" fill="#5c9a2a"/>
      <circle cx="306" cy="391" r="6.5" fill="#22303a"/><circle class="spw-lamp" cx="306" cy="391" r="6.5"/>
      <path d="M290 368l14-8 4 6-14 8zM310 360l14 6-3 6-14-6z" fill="#3c5a9a"/>
    </g>
    <path d="M20 470c100-15 200 0 360-18v24c-130 16-240 4-360 18z" style="fill:var(--sky-mid)" stroke="#1c2b22" stroke-width="3"/>
    <path d="M20 500c100-12 240 0 360-14V540H20Z" fill="#4c7a22" stroke="#1c2b22" stroke-width="3.5"/>
    <path class="spw-dusk" d="M0 372C70 340 120 330 170 342s90-22 140-24c30-1 52 8 90 16V540H0Z" fill="#081232"/>
    <g class="spw-lamps"><circle cx="153" cy="406" r="12"/><circle cx="306" cy="391" r="14"/></g>
    <g stroke="#1c2b22" stroke-width="3" stroke-linejoin="round">
      <path d="M36 540c4-62 14-104 36-150-8 48-14 96-14 150z" fill="#3f7a3a"/>
      <path d="M62 540c6-44 22-80 48-104-14 34-24 68-26 104z" fill="#5c9a40"/>
      <path d="M86 540c2-30 4-50 14-74 0 26-2 46 0 74z" fill="#2f6a34"/>
      <g fill="#7189d8"><path d="M72 392c-10-10-12-26-2-34 4 12 8 20 2 34z"/><path d="M72 392c10-12 24-16 30-6-10 4-18 8-30 6z" fill="#4b73a7"/><path d="M72 392c-12-6-26-4-30 6 10 2 20 0 30-6z" fill="#4b73a7"/></g>
      <path d="M338 540c-2-40 0-70 6-100" fill="none" stroke-width="8"/><path d="M338 540c-2-40 0-70 6-100" fill="none" stroke="#3f7a3a" stroke-width="4"/>
      <path d="M340 492c-22-6-34 2-40 14 18 4 30-2 40-14zM342 470c20-10 34-4 40 6-16 6-30 4-40-6z" fill="#5c9a40"/>
      <g fill="#f2b632" stroke-width="1.4">${petals(344, 428, 12, 14, 18)}</g>
      <circle cx="344" cy="428" r="13" fill="#6b3d14"/>
      <path d="M296 540c0-24 2-40 6-56" fill="none" stroke-width="7"/><path d="M296 540c0-24 2-40 6-56" fill="none" stroke="#3f7a3a" stroke-width="3.4"/>
      <g fill="#e9a52a" stroke-width="1.2">${petals(302, 480, 7, 12, 11)}</g>
      <circle cx="302" cy="480" r="7.5" fill="#6b3d14"/>
    </g>
    <rect width="400" height="540" filter="url(#spw-tex)" opacity=".35" style="mix-blend-mode:overlay"/>
    <g fill="none" stroke="#1c2b22" stroke-linecap="round" stroke-linejoin="round">
      <path d="M60 190A140 140 0 0 1 340 190" stroke-width="4"/>
      <path d="M20 300c50-10 76-50 72-90-4-40-38-50-42-20-3 22 24 30 34 10" stroke-width="5"/>
      <path d="M380 300c-50-10-76-50-72-90 4-40 38-50 42-20 3 22-24 30-34 10" stroke-width="5"/>
      <path d="M20 300h22M358 300h22M200 50v-40" stroke-width="4"/>
    </g>
  </g>
  <path d="M20 540V190A180 180 0 0 1 380 190V540" fill="none" stroke="#1c2b22" stroke-width="12"/>
  <path d="M27 540V190A173 173 0 0 1 373 190V540" fill="none" stroke="#c9a24e" stroke-width="2.4"/>
  <path d="M8 540V190A192 192 0 0 1 392 190V540" fill="none" stroke="#c9a24e" stroke-width="2"/>
</svg>`;
  hero.prepend(win);
  const sunG = win.querySelector('.spw-sun');
  const moonG = win.querySelector('.spw-moon');

  // The sundial: read-out, a slider across the day and Mucha's four times as buttons.
  const dial = document.createElement('div');
  dial.className = 'sp-dial';
  dial.setAttribute('role', 'group');
  dial.setAttribute('aria-label', 'Light on this page');
  dial.innerHTML = `<p class="sp-dial-read"><span class="sp-dial-fr"></span><span class="sp-dial-en"></span></p><p class="sp-sr" aria-live="polite"></p>
  <input class="sp-dial-range" type="range" min="0" max="23.75" step="0.25" aria-label="Time of day for the light on this page">
  <div class="sp-dial-btns">
    <button type="button" data-h="7">Morning</button><button type="button" data-h="13">Day</button><button type="button" data-h="18.2">Evening</button><button type="button" data-h="23">Night</button><button type="button" data-h="now">Your clock</button>
  </div>`;
  document.querySelector('.hero-tagline').after(dial);
  const range = dial.querySelector('.sp-dial-range');
  const fr = dial.querySelector('.sp-dial-fr');
  const en = dial.querySelector('.sp-dial-en');
  // Announced only when the visitor changes the light, not when the clock moves on each minute.
  const said = dial.querySelector('.sp-sr');
  const announce = () => { said.textContent = `${fr.textContent}. ${en.textContent}`; };

  // Light falling across the page, behind the panels.
  const light = document.createElement('div');
  light.className = 'sp-light';
  light.setAttribute('aria-hidden', 'true');
  light.innerHTML = '<i class="sp-shaft"></i><i class="sp-shaft"></i><i class="sp-shaft"></i><i class="sp-shaft"></i><i class="sp-shaft"></i><b class="sp-pool"></b><b class="sp-pool"></b><b class="sp-pool"></b><b class="sp-pool"></b><b class="sp-pool"></b><b class="sp-pool"></b>';
  document.body.prepend(light);

  let mode = 'now';
  const nowHour = () => { const d = new Date(); return d.getHours() + d.getMinutes() / 60; };

  function apply(h) {
    const c = sample(h);
    const s = root.style;
    s.setProperty('--sky-top', c.top);
    s.setProperty('--sky-mid', c.mid);
    s.setProperty('--sky-bot', c.bot);
    s.setProperty('--wall', c.wall);
    s.setProperty('--beam', c.beam);
    s.setProperty('--sun-col', c.sun);
    s.setProperty('--stars', c.stars.toFixed(2));
    s.setProperty('--lamps', c.lamps.toFixed(2));
    s.setProperty('--dusk', c.dusk.toFixed(2));
    s.setProperty('--str', c.str.toFixed(2));
    // Sun from 6 to 18 along the arch, moon through the night.
    const day = (h - 6) / 12;
    const up = day > -0.04 && day < 1.04;
    const p = up ? day : ((h + 24 - 18) % 24) / 12;
    const x = 52 + p * 296;
    const y = 330 - Math.sin(Math.PI * Math.min(1, Math.max(0, p))) * 236;
    (up ? sunG : moonG).setAttribute('transform', `translate(${x.toFixed(1)} ${y.toFixed(1)})`);
    sunG.style.display = up ? '' : 'none';
    moonG.style.display = up ? 'none' : '';
    s.setProperty('--src', p.toFixed(3));
    s.setProperty('--ang', `${((p - 0.5) * 64).toFixed(1)}deg`);
    const t = timeOf(h);
    root.dataset.tod = t.tod;
    fr.textContent = t.fr;
    en.textContent = mode === 'now' ? `${t.en}, ${clock(h)} on your clock` : `${t.en}, set to ${clock(h)}`;
    range.value = String(Math.round(h * 4) / 4 % 24);
    for (const b of dial.querySelectorAll('button')) b.setAttribute('aria-pressed', String(b.dataset.h === 'now' ? mode === 'now' : mode === b.dataset.h));
  }

  range.addEventListener('input', () => { mode = 'range'; apply(Number(range.value)); });
  range.addEventListener('change', announce);
  dial.addEventListener('click', (e) => {
    const b = e.target.closest('button[data-h]');
    if (!b) return;
    mode = b.dataset.h;
    apply(mode === 'now' ? nowHour() : Number(mode));
    announce();
  });
  apply(nowHour());
  setInterval(() => { if (mode === 'now') apply(nowHour()); }, 60000);

  // Calm mode keeps the light but stops the turbines and the drifting dust (CSS does both).
  const syncCalm = () => root.classList.toggle('sp-still', calm());
  syncCalm();
  window.addEventListener('eas:calm', syncCalm);
})();
