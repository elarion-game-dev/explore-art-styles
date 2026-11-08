// Synthwave: builds the fixed night-drive scene, turns the site bar into an OutRun HUD tied to how fast you scroll,
// and adds a working tape deck for the music.
(() => {
  const root = document.documentElement;
  const $ = (q, el = document) => el.querySelector(q);
  const $$ = (q, el = document) => [...el.querySelectorAll(q)];
  const calm = () => root.dataset.calm === '1';
  const el = (tag, cls, html) => { const e = document.createElement(tag); if (cls) e.className = cls; if (html != null) e.innerHTML = html; return e; };
  const store = { get(k) { try { return localStorage.getItem(k); } catch { return null; } }, set(k, v) { try { localStorage.setItem(k, v); } catch { /* private window */ } } };

  // Scene: seeded so the ridge line is the same every visit
  let seed = 86;
  const rnd = () => { seed = (seed * 9301 + 49297) % 233280; return seed / 233280; };
  const ridge = (from, to, y, h) => {
    let d = `M${from} 100`;
    const lines = [];
    let px = from;
    let py = 100;
    for (let x = from; x <= to; x += 2.2 + rnd() * 3) {
      const edge = Math.min((x - from) / 8, (to - x) / 8, 1);
      const ty = y + (100 - y) * (1 - edge) - (rnd() * h * edge);
      d += `L${x.toFixed(1)} ${ty.toFixed(1)}`;
      lines.push(`M${x.toFixed(1)} ${ty.toFixed(1)}L${((x + px) / 2 + (rnd() - .5) * 2).toFixed(1)} 100`);
      px = x; py = ty;
    }
    d += `L${to} 100Z`;
    return `<path d="${d}" fill="#150a33"/><path d="${d}" fill="none" stroke="#fa2d99" stroke-width=".35"/><path d="${lines.join('')}" fill="none" stroke="#fa2d99" stroke-width=".12" opacity=".7"/>`;
  };
  const palm = (cls) => {
    const fronds = [];
    const n = 10;
    for (let i = 0; i < n; i++) {
      const a = -172 + (i * 164) / (n - 1);
      const len = 130 + (i % 3) * 18;
      const up = [];
      const down = [];
      const seg = 14;
      for (let k = 0; k <= seg; k++) {
        const t = k / seg;
        const dir = (a + (a < -90 ? -1 : 1) * 62 * t * t) * Math.PI / 180;
        const x = Math.cos(dir) * len * t;
        const y = Math.sin(dir) * len * t + 34 * t * t;
        const w = Math.sin(Math.PI * Math.min(1, t * 1.02)) * 15;
        const notch = k % 2 ? 1 : .55;
        up.push(`${(x - Math.sin(dir) * w * notch).toFixed(1)} ${(y + Math.cos(dir) * w * notch).toFixed(1)}`);
        down.unshift(`${(x + Math.sin(dir) * w * .22).toFixed(1)} ${(y - Math.cos(dir) * w * .22).toFixed(1)}`);
      }
      fronds.push(`<path d="M${up.join('L')}L${down.join('L')}Z"/>`);
    }
    return `<svg class="sw-palm ${cls}" viewBox="-170 -110 340 400" fill="#08031a" aria-hidden="true"><path d="M-5 0C4 90 34 200 18 290L52 290C62 190 26 80 7 0Z"/>${fronds.join('')}</svg>`;
  };
  const scene = el('div', 'sw-scene', `
    <div class="sw-sky"><div class="sw-stars"></div><div class="sw-sunbox"><div class="sw-sun"></div></div>
      <svg class="sw-peaks" viewBox="0 0 200 100" preserveAspectRatio="none" aria-hidden="true">${ridge(-4, 66, 52, 42)}${ridge(134, 204, 52, 44)}</svg></div>
    <div class="sw-ground"></div>
    ${palm('sw-palm-a')}${palm('sw-palm-b')}${palm('sw-palm-c')}${palm('sw-palm-d')}<canvas class="sw-floor"></canvas>`);
  scene.setAttribute('aria-hidden', 'true');
  document.body.prepend(scene);

  // The ground is drawn by hand with a simple perspective divide, the same trick OutRun used for its road.
  const floor = $('.sw-floor', scene);
  const g = floor.getContext('2d');
  const sky = $('.sw-sky', scene);
  let W = 0;
  let H = 0;
  let HZ = 0;
  let phase = 0;
  let palmPath = null;
  const buildPalm = () => {
    const p = new Path2D('M-5 0C4 90 34 200 18 290L52 290C62 190 26 80 7 0Z');
    const n = 10;
    for (let i = 0; i < n; i++) {
      const a = -172 + (i * 164) / (n - 1);
      const len = 130 + (i % 3) * 18;
      const up = [];
      const down = [];
      for (let k = 0; k <= 12; k++) {
        const t = k / 12;
        const dir = (a + (a < -90 ? -1 : 1) * 62 * t * t) * Math.PI / 180;
        const x = Math.cos(dir) * len * t;
        const y = Math.sin(dir) * len * t + 34 * t * t;
        const w = Math.sin(Math.PI * Math.min(1, t * 1.02)) * 17;
        up.push([x - Math.sin(dir) * w * (k % 2 ? 1 : .6), y + Math.cos(dir) * w * (k % 2 ? 1 : .6)]);
        down.unshift([x + Math.sin(dir) * w * .25, y - Math.cos(dir) * w * .25]);
      }
      p.addPath(new Path2D(`M${[...up, ...down].map((q) => `${q[0].toFixed(1)} ${q[1].toFixed(1)}`).join('L')}Z`));
    }
    return p;
  };
  const drawFloor = () => {
    const G = H - HZ;
    g.clearRect(0, 0, W, H);
    g.save();
    g.translate(0, HZ);
    const cx = W / 2;
    const unit = Math.max(W, 700) * .17;
    const fade = g.createLinearGradient(0, 0, 0, G);
    fade.addColorStop(0, 'rgba(250,45,153,.1)');
    fade.addColorStop(.3, 'rgba(250,45,153,.55)');
    fade.addColorStop(1, 'rgba(250,45,153,.95)');
    g.lineCap = 'butt';
    // Lines running toward the horizon
    g.strokeStyle = fade;
    g.lineWidth = 1.4;
    g.beginPath();
    for (let k = -26; k <= 26; k++) { g.moveTo(cx, 0); g.lineTo(cx + k * unit, G); }
    g.stroke();
    // Lines across, each one a perspective divide
    const dz = .34;
    for (let i = 0; i < 90; i++) {
      const z = 1 + (i - phase) * dz;
      const y = G / z;
      if (y < 3) break;
      if (y > G + 4) continue;
      const a = Math.min(1, (y / G) * 3.2);
      g.strokeStyle = `rgba(250,45,153,${(a * .22).toFixed(3)})`;
      g.lineWidth = 2 + 7 * (y / G);
      g.beginPath(); g.moveTo(0, y); g.lineTo(W, y); g.stroke();
      g.strokeStyle = `rgba(255,120,190,${(a * .95).toFixed(3)})`;
      g.lineWidth = .8 + 1.6 * (y / G);
      g.beginPath(); g.moveTo(0, y); g.lineTo(W, y); g.stroke();
    }
    // Horizon haze
    const haze = g.createLinearGradient(0, 0, 0, G * .2);
    haze.addColorStop(0, 'rgba(255,90,170,.75)');
    haze.addColorStop(1, 'rgba(255,90,170,0)');
    g.fillStyle = haze;
    g.fillRect(0, 0, W, G * .2);
    // Road
    const R = unit * .92;
    g.fillStyle = '#0a0618';
    g.beginPath(); g.moveTo(cx, 0); g.lineTo(cx + R, G); g.lineTo(cx - R, G); g.closePath(); g.fill();
    g.strokeStyle = '#61cee3';
    g.lineWidth = 2.4;
    g.beginPath(); g.moveTo(cx, 0); g.lineTo(cx + R, G); g.moveTo(cx, 0); g.lineTo(cx - R, G); g.stroke();
    g.fillStyle = '#ffee4b';
    for (let i = 0; i < 40; i += 2) {
      const z1 = Math.max(.82, 1 + (i - phase) * dz);
      const z2 = Math.max(.82, 1 + (i + 1 - phase) * dz);
      const y1 = G / z1;
      const y2 = G / z2;
      if (y1 < 2) break;
      const w1 = R * .035 * (y1 / G);
      const w2 = R * .035 * (y2 / G);
      g.beginPath(); g.moveTo(cx - w1, y1); g.lineTo(cx + w1, y1); g.lineTo(cx + w2, y2); g.lineTo(cx - w2, y2); g.closePath(); g.fill();
    }
    // Roadside palms pass the way OutRun's sprites do: same drawing, scaled by distance
    if (W > 1000) {
      if (!palmPath) palmPath = buildPalm();
      const span = 5;
      const list = [];
      for (let i = 0; i < 6; i++) {
        const z = 1.02 + (((i * span) / 6 - (phase + 2 * Math.floor(travel)) * dz) % span + span) % span;
        if (z < 3.1) list.push([z, i % 2 ? 1 : -1]);
      }
      list.sort((a, b) => b[0] - a[0]);
      g.fillStyle = '#06021a';
      for (const [z, side] of list) {
        const s = 1 / z;
        const y = G * s;
        const x = cx + side * unit * 5.2 * s;
        const k = s * G * .0035;
        g.save();
        g.translate(x, y);
        g.scale(side * k, k);
        g.translate(-35, -290);
        g.fill(palmPath);
        g.restore();
      }
    }
    g.restore();
  };
  let travel = 0;
  const sizeFloor = () => {
    const dpr = Math.min(devicePixelRatio || 1, 1.5);
    W = innerWidth;
    H = innerHeight;
    HZ = sky.getBoundingClientRect().height;
    floor.width = W * dpr;
    floor.height = H * dpr;
    g.setTransform(dpr, 0, 0, dpr, 0, 0);
    drawFloor();
  };
  sizeFloor();
  addEventListener('resize', sizeFloor);

  // Title glint
  const title = $('.hero-title');
  const glint = el('span', 'sw-glint');
  glint.innerHTML = '<svg viewBox="-20 -20 40 40" width="40" height="40" aria-hidden="true"><path d="M0 -20C1 -4 4 -1 20 0C4 1 1 4 0 20C-1 4 -4 1 -20 0C-4 -1 -1 -4 0 -20Z" fill="#fff"/></svg>';

  // Section titles get a chrome span, and the contents move into the picture grid
  for (const h of $$('.sec-title')) {
    const s = el('span');
    s.textContent = h.textContent;
    h.textContent = '';
    h.append(s);
  }
  const gallery = $('.hero-gallery');
  gallery.append($('.toc'));

  // How to: the road between the signs, with a car that holds still while the road moves
  const steps = $('.steps');
  const bed = el('li', 'sw-roadbed');
  bed.setAttribute('aria-hidden', 'true');
  bed.innerHTML = '<svg class="sw-car" viewBox="0 0 58 110" aria-hidden="true"><rect x="4" y="16" width="8" height="20" rx="2" fill="#050308"/><rect x="46" y="16" width="8" height="20" rx="2" fill="#050308"/><rect x="2" y="76" width="9" height="22" rx="2" fill="#050308"/><rect x="47" y="76" width="9" height="22" rx="2" fill="#050308"/><path d="M14 4C22 0 36 0 44 4C50 10 52 22 52 40L54 86C54 98 50 104 44 106H14C8 104 4 98 4 86L6 40C6 22 8 10 14 4Z" fill="#e0102e"/><path d="M15 30C22 26 36 26 43 30L46 44H12Z" fill="#160c2a"/><path d="M13 48H45L44 66H14Z" fill="#a50a22"/><path d="M14 68H44L46 80H12Z" fill="#160c2a"/><path d="M6 56l6 2v18l-6-2zM52 56l-6 2v18l6-2z" fill="#7c0619"/><path d="M8 100H22V104H8zM36 100H50V104H36z" fill="#ff3350"/><path d="M12 6H20V10H12zM38 6H46V10H38z" fill="#fff7c2"/></svg>';
  steps.append(bed);

  // HUD
  const hud = el('div', 'sw-hud', `
    <span class="sw-time"><i>TIME</i><b>075</b></span>
    <span class="sw-score"><i>SCORE</i><b>0000000</b></span>
    <span class="sw-stage"><i>STAGE</i><b>0</b></span>
    <span class="sw-speed"><b>000</b><i>km/h</i><em class="sw-tach"></em></span>`);
  $('.atlas-here').after(hud);
  const hudTime = $('.sw-time b', hud);
  const hudScore = $('.sw-score b', hud);
  const hudStage = $('.sw-stage b', hud);
  const hudSpeed = $('.sw-speed b', hud);
  const tach = $('.sw-tach', hud);
  const check = el('div', 'sw-check');
  check.setAttribute('aria-hidden', 'true');
  document.body.append(check);

  const best = () => Number(store.get('eas-sw-hi') || 0);
  let timeLeft = 75;
  let score = 0;
  let stageIdx = 0;
  let farthest = 0;
  const sections = $$('main > .sec');
  const showCheck = (top, bottom) => {
    check.innerHTML = `${top}<small>${bottom}</small>`;
    check.classList.remove('on');
    void check.offsetWidth;
    check.classList.add('on');
  };
  check.addEventListener('animationend', () => check.classList.remove('on'));

  // The drive: scroll speed sets road speed, scroll position sets how far the sun has gone down
  let lastY = scrollY;
  let lastT = performance.now();
  let v = 0;
  let raf = 0;
  const ticker = () => {
    const y = scrollY;
    const delta = Math.abs(y - lastY);
    lastY = y;
    v += (Math.min(delta, 90) / 90 - v) * .09;
    const kmh = Math.round(v * 293);
    hudSpeed.textContent = String(kmh).padStart(3, '0');
    tach.style.setProperty('--v', v.toFixed(3));
    tach.classList.toggle('hot', v > .72);
    const now = performance.now();
    const dt = Math.min(.05, (now - lastT) / 1000);
    lastT = now;
    phase += dt * (.5 + v * 11);
    if (phase >= 2) { phase -= 2; travel += 1; }
    drawFloor();
    const max = Math.max(1, document.documentElement.scrollHeight - innerHeight);
    const f = Math.min(1, y / max);
    scene.style.setProperty('--set', Math.min(1, f * 1.25).toFixed(3));
    scene.style.setProperty('--n', Math.min(1, f * 1.15).toFixed(3));
    steps.style.setProperty('--dash', `${(y * .9).toFixed(0)}px`);
    if (y > farthest) {
      score += Math.round((y - farthest) * 3);
      farthest = y;
      hudScore.textContent = String(score).padStart(7, '0');
    }
    // A stage counts once its title reaches the middle of the screen
    let s = 0;
    sections.forEach((sec, i) => { if (sec.getBoundingClientRect().top < innerHeight * .55) s = i + 1; });
    if (s > stageIdx) {
      stageIdx = s;
      hudStage.textContent = String(s);
      timeLeft = Math.min(99, timeLeft + 25);
      hudTime.textContent = String(timeLeft).padStart(3, '0');
      showCheck('CHECK POINT!', `STAGE ${s} · EXTENDED PLAY`);
      if (score > best()) store.set('eas-sw-hi', String(score));
    }
    raf = requestAnimationFrame(ticker);
  };
  let clock = 0;
  const startDrive = () => {
    if (raf) return;
    lastT = performance.now();
    raf = requestAnimationFrame(ticker);
    clock = setInterval(() => {
      if (document.hidden) return;
      if (timeLeft > 0) timeLeft -= 1;
      hudTime.textContent = timeLeft > 0 ? String(timeLeft).padStart(3, '0') : 'OVER';
    }, 1000);
  };
  const stopDrive = () => {
    cancelAnimationFrame(raf);
    v = 0;
    raf = 0;
    clearInterval(clock);
    hudSpeed.textContent = '000';
    tach.style.setProperty('--v', 0);
    scene.style.setProperty('--set', 0);
    scene.style.setProperty('--n', 0);
    drawFloor();
  };
  addEventListener('eas:calm', () => (calm() ? stopDrive() : startDrive()));
  if (!calm()) startDrive();

  // Palette: stripes of a sun, with text that stays readable on each colour
  for (const s of $$('.swatch')) {
    const hex = $('button', s).dataset.copy;
    const [r, g, b] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255).map((c) => (c <= .03928 ? c / 12.92 : ((c + .055) / 1.055) ** 2.4));
    s.style.setProperty('--tc', .2126 * r + .7152 * g + .0722 * b > .22 ? '#14062a' : '#ffffff');
  }

  // Tape deck
  const wrap = $('.music-wrap');
  const tracks = $$('.track', wrap);
  const deck = el('div', 'sw-deck', `
    <div class="sw-lcd"><span class="sw-lcd-title"><b>INSERT TAPE</b></span><small class="sw-count">000</small><small>STEREO</small></div>
    <div class="sw-well">
      <div class="sw-tape" aria-hidden="true">
        <span class="sw-tape-label">Night Drive Mix</span><span class="sw-tape-side">SIDE A · C-60</span>
        <div class="sw-window"><i class="sw-reel sw-reel-a"></i><i class="sw-reel sw-reel-b"></i></div>
      </div>
      <div class="sw-keys" role="group" aria-label="Tape controls">
        <button type="button" data-k="prev" aria-label="Previous track">◀◀</button>
        <button type="button" data-k="play" aria-label="Play or pause">▶</button>
        <button type="button" data-k="stop" aria-label="Stop">■</button>
        <button type="button" data-k="next" aria-label="Next track">▶▶</button>
        <button type="button" data-k="yt" aria-label="Open this track on YouTube">⏏</button>
      </div>
    </div>`);
  $('h3', wrap).after(deck);
  const lcd = $('.sw-lcd-title b', deck);
  const counter = $('.sw-count', deck);
  let current = -1;
  let count = 0;
  let countTimer = 0;
  const setWind = () => {
    const f = current < 0 ? 0 : (current + .3) / tracks.length;
    deck.style.setProperty('--winda', (1 - f * .8).toFixed(2));
    deck.style.setProperty('--windb', (.18 + f * .8).toFixed(2));
  };
  setWind();
  const paint = (playing) => {
    deck.classList.toggle('is-on', playing);
    clearInterval(countTimer);
    if (playing) {
      countTimer = setInterval(() => { count = (count + 1) % 1000; counter.textContent = String(count).padStart(3, '0'); }, 1000);
    }
  };
  const label = (i) => {
    const t = tracks[i];
    lcd.textContent = `${String(i + 1).padStart(2, '0')}  ${$('.track-title', t).textContent.toUpperCase()}  ·  ${$('.track-artist', t).textContent.toUpperCase()}`;
  };
  const playIndex = (i) => {
    current = (i + tracks.length) % tracks.length;
    label(current);
    setWind();
    $('.track-btn', tracks[current]).click();
  };
  // Clicking a row on the J-card loads that track into the deck too.
  tracks.forEach((t, i) => $('.track-btn', t).addEventListener('click', () => {
    if (location.protocol === 'file:') return;
    current = i;
    count = 0;
    counter.textContent = '000';
    label(i);
    setWind();
    paint(true);
  }));
  const stop = () => { $('[data-player-close]').click(); paint(false); lcd.textContent = current >= 0 ? `STOP  ${lcd.textContent.replace(/^STOP\s+/, '')}` : 'INSERT TAPE'; };
  $('[data-player-close]').addEventListener('click', () => paint(false));
  for (const b of $$('.sw-keys button', deck)) {
    b.addEventListener('click', () => {
      const k = b.dataset.k;
      if (k === 'play') { if (deck.classList.contains('is-on')) stop(); else playIndex(current < 0 ? 0 : current); }
      if (k === 'stop') stop();
      if (k === 'next') playIndex(current + 1);
      if (k === 'prev') playIndex(current < 1 ? 0 : current - 1);
      if (k === 'yt') open($('.track-yt', tracks[current < 0 ? 0 : current]).href, '_blank', 'noopener');
    });
  }

  // Footer: the goal, with the car driving off
  const goal = el('div');
  goal.innerHTML = `<svg class="sw-goal" viewBox="0 0 400 176" aria-hidden="true">
    <ellipse cx="200" cy="164" rx="186" ry="12" fill="#000" opacity=".55"/>
    <rect x="46" y="124" width="60" height="42" rx="6" fill="#05030a"/><rect x="294" y="124" width="60" height="42" rx="6" fill="#05030a"/>
    <path d="M108 54L128 22H272L292 54Z" fill="#150c2c" stroke="#fa2d99" stroke-width="1.5"/><path d="M118 52L134 28H266L282 52Z" fill="#2b1a5c"/><path d="M134 28H176L150 52H118Z" fill="#61cee3" opacity=".35"/>
    <path d="M60 92L104 54H296L340 92Z" fill="#a00a22"/>
    <path d="M92 66H308M84 73H316M76 80H324M68 87H332" stroke="#3e0310" stroke-width="3"/>
    <path d="M24 122L38 92H362L376 122V146C376 151 372 154 366 154H34C28 154 24 151 24 146Z" fill="#c80f2c"/>
    <rect x="40" y="96" width="320" height="28" fill="#1a0408"/>
    <g fill="#ff2a48" style="filter:drop-shadow(0 0 7px #ff2a48)"><rect x="44" y="99" width="78" height="4"/><rect x="44" y="106" width="78" height="4"/><rect x="44" y="113" width="78" height="4"/><rect x="278" y="99" width="78" height="4"/><rect x="278" y="106" width="78" height="4"/><rect x="278" y="113" width="78" height="4"/></g>
    <path d="M128 100H272M128 107H272M128 114H272" stroke="#4a0a14" stroke-width="3"/>
    <rect x="166" y="128" width="68" height="18" fill="#efe7d6"/><text x="200" y="142" text-anchor="middle" font-family="Doto, monospace" font-weight="900" font-size="14" fill="#14062a">OUTRUN</text>
    <circle cx="70" cy="142" r="7" fill="#0b0408" stroke="#777"/><circle cx="330" cy="142" r="7" fill="#0b0408" stroke="#777"/>
  </svg>`;
  $('.foot').prepend(goal.firstElementChild);
  const footText = $('.foot p');
  const banner = el('div', 'sec-title');
  banner.setAttribute('aria-hidden', 'true');
  banner.innerHTML = '<span>Goal</span>';
  banner.style.counterIncrement = 'none';
  $('.foot').prepend(banner);
  footText.before($('.sw-goal'));
})();
