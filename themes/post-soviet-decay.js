// Post-Soviet Decay: rooftop letters for the title, a house number plate, paint that peels when touched,
// a radio dial that follows the music, and a household dosimeter that keeps ticking in the corner.
(() => {
  const root = document.documentElement;
  const calm = () => root.dataset.calm === '1';
  const $ = (q) => document.querySelector(q);
  const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

  // ---- Rooftop sign: one metal letter per character, a few of them rusted or knocked loose ----
  const title = $('.hero-title');
  if (title) {
    const text = title.textContent.trim();
    title.setAttribute('aria-label', text);
    const odd = { 7: 'is-tilt', 10: 'is-rust', 14: 'is-rust', 16: 'is-sag' };
    title.innerHTML = [...text].map((ch, i) => (ch === ' '
      ? '<span class="ps-gap" aria-hidden="true"></span>'
      : `<span class="ps-l ${odd[i] || ''}" aria-hidden="true">${esc(ch)}</span>`)).join('');
  }

  // ---- House number plate on the corner of the block ----
  const heroText = $('.hero-text');
  if (heroText) {
    const plate = document.createElement('div');
    plate.className = 'ps-plate';
    plate.setAttribute('aria-hidden', 'true');
    plate.innerHTML = 'ул. Строителей<b>25</b>';
    heroText.append(plate);
  }

  // ---- Peeling paint: hover on desktop, tap on touch screens ----
  const core = $('.core-list');
  if (core) {
    const hint = document.createElement('p');
    hint.className = 'ps-hint';
    hint.setAttribute('aria-hidden', 'true');
    hint.textContent = matchMedia('(hover: hover)').matches ? 'Run a finger over the paint...' : 'Tap the paint to scrape it.';
    core.before(hint);
    core.addEventListener('click', (e) => {
      const item = e.target.closest('.core-item');
      if (item && !matchMedia('(hover: hover)').matches) item.classList.toggle('is-peeled');
    });
  }

  // ---- Radio dial: the needle moves to the station you pick ----
  const tracks = $('.tracks');
  if (tracks) {
    const items = [...tracks.querySelectorAll('.track')];
    tracks.addEventListener('click', (e) => {
      const t = e.target.closest('.track');
      if (!t) return;
      const i = items.indexOf(t);
      tracks.style.setProperty('--needle', `${12 + (76 * i) / Math.max(1, items.length - 1)}%`);
    });
  }

  // ---- Dosimeter ----
  const dose = document.createElement('div');
  dose.className = 'ps-dose';
  dose.setAttribute('aria-hidden', 'true');
  dose.innerHTML = '<span class="ps-dose-name">Dosimeter</span><span class="ps-dose-lcd"><span class="ps-v">0.14</span><small>μSv/h</small></span><span class="ps-dose-led"></span><span class="ps-dose-bars"><i></i><i></i><i></i><i></i><i></i></span>';
  document.body.append(dose);
  const lcd = dose.querySelector('.ps-v');
  const led = dose.querySelector('.ps-dose-led');
  const bars = [...dose.querySelectorAll('.ps-dose-bars i')];

  let hot = 0; // extra dose while the pointer is over a picture of the Zone
  document.addEventListener('pointerover', (e) => { if (e.target.closest('.shot-link, .loop')) hot = 1; });
  document.addEventListener('pointerout', (e) => { if (e.target.closest('.shot-link, .loop')) hot = 0; });

  const level = () => {
    const max = Math.max(1, document.documentElement.scrollHeight - innerHeight);
    const p = Math.min(1, Math.max(0, scrollY / max));
    return 0.12 + 0.55 * p * p + hot * (1.6 + Math.random() * 0.8);
  };
  const show = (v) => {
    lcd.textContent = v.toFixed(2);
    const n = Math.min(5, Math.ceil(Math.log2(1 + v * 8)));
    bars.forEach((b, i) => b.classList.toggle('on', i < n));
  };

  let tickTimer;
  let readTimer;
  const tick = () => {
    const v = level();
    led.classList.add('on');
    setTimeout(() => led.classList.remove('on'), 55);
    // Clicks arrive at random, faster as the dose rises. Capped at 8 a second.
    const rate = Math.min(8, 0.7 + v * 3.2);
    tickTimer = setTimeout(tick, (-Math.log(1 - Math.random()) / rate) * 1000 + 40);
  };
  const read = () => {
    show(level() * (0.9 + Math.random() * 0.2));
    readTimer = setTimeout(read, 700);
  };
  const start = () => {
    clearTimeout(tickTimer);
    clearTimeout(readTimer);
    led.classList.remove('on');
    if (calm()) { show(0.14); return; }
    tick();
    read();
  };
  addEventListener('eas:calm', start);
  start();
})();
