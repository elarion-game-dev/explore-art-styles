// Toybox Diorama: a small island on a turntable, built in CSS 3D, that you drag to turn.
// Three switches take the toy look apart: bevels, soft contact shadows and saturated glossy plastic.
// The island is stacked flat layers (so its rounded corners and bevel can morph), walls and roofs as 3D planes,
// and round trees and a peg figure as billboards that always face the camera. Light stays fixed to the screen,
// so the script shades each wall and the island's sides from the turn angle, in coarse steps to keep repaints rare.
(() => {
  const root = document.documentElement;
  const $ = (q, el = document) => el.querySelector(q);
  const $$ = (q, el = document) => [...el.querySelectorAll(q)];
  const isCalm = () => root.dataset.calm === '1';
  const store = {
    get(k) { try { return localStorage.getItem(k); } catch { return null; } },
    set(k, v) { try { localStorage.setItem(k, v); } catch { /* private window */ } },
  };

  // ---- the title in moulded plastic letters, one toy colour each ----
  const LETTERS = ['red', 'yel', 'blu', 'grn', 'org', 'pink'];
  const h1 = $('.hero-title');
  if (h1) {
    const text = h1.textContent.trim();
    h1.setAttribute('aria-label', text);
    const wrap = document.createElement('span');
    wrap.className = 'tb-letters';
    wrap.setAttribute('aria-hidden', 'true');
    let n = 0;
    text.split(/\s+/).forEach((word, wi) => {
      if (wi) wrap.append(' ');
      const w = document.createElement('span');
      w.className = 'tb-word';
      for (const ch of word) {
        const s = document.createElement('span');
        s.className = `tb-l tb-${LETTERS[n % LETTERS.length]}`;
        s.dataset.c = ch;
        s.textContent = ch;
        s.style.setProperty('--tip', `${((n * 37) % 7) - 3}deg`);
        n++;
        w.append(s);
      }
      wrap.append(w);
    });
    h1.textContent = '';
    h1.append(wrap);
  }
  // Section titles carry their own text for the glossy highlight drawn over them.
  $$('.sec-title').forEach((h) => { h.dataset.text = h.textContent.trim(); });

  // The mood words are beads on one cord: the bead that ends a row has no cord running off to the right.
  // Read every bead's row first, then mark the ends, and only again when the list changes width.
  const beads = $$('.mood-words li');
  if (beads.length && 'ResizeObserver' in window) {
    let lastW = -1;
    new ResizeObserver(([e]) => {
      const w = Math.round(e.contentRect.width);
      if (w === lastW) return;
      lastW = w;
      const tops = beads.map((b) => b.offsetTop);
      beads.forEach((b, i) => b.classList.toggle('tb-row-end', i < beads.length - 1 && tops[i + 1] !== tops[i]));
    }).observe(beads[0].parentElement);
  }

  // ---- the turntable ----
  const hero = $('.hero');
  const heroText = $('.hero-text');
  if (!hero || !heroText) return;

  const stage = document.createElement('div');
  stage.className = 'tb-stage';
  const saved = (k, d) => (store.get(`eas-toybox-${k}`) === 'off' ? 'off' : d);
  stage.dataset.bevel = saved('bevel', 'on');
  stage.dataset.shadow = saved('shadow', 'on');
  stage.dataset.sat = saved('sat', 'on');
  stage.innerHTML = `
    <div class="tb-view" tabindex="0" role="img" aria-label="A small toy island with two houses, round trees and a pond, on a turntable. Drag it, or use the arrow keys, to turn it.">
      <div class="tb-fit" aria-hidden="true"><div class="tb-cam"><div class="tb-world"></div></div></div>
    </div>
    <div class="tb-panel">
      <div class="tb-turn">
        <button type="button" class="tb-spin" data-spin="-1" aria-label="Turn the island left"><span aria-hidden="true">&#9664;</span></button>
        <span class="tb-hint">Drag to turn</span>
        <button type="button" class="tb-spin" data-spin="1" aria-label="Turn the island right"><span aria-hidden="true">&#9654;</span></button>
      </div>
      <div class="tb-switches" role="group" aria-label="What makes it look like a toy">
        <button type="button" class="tb-switch" data-key="bevel"><span class="tb-track"><span class="tb-knob"></span></span><span class="tb-name">Bevels</span></button>
        <button type="button" class="tb-switch" data-key="shadow"><span class="tb-track"><span class="tb-knob"></span></span><span class="tb-name">Soft shadows</span></button>
        <button type="button" class="tb-switch" data-key="sat"><span class="tb-track"><span class="tb-knob"></span></span><span class="tb-name">Saturated plastic</span></button>
      </div>
    </div>`;
  heroText.after(stage);
  hero.classList.add('has-table');

  const world = $('.tb-world', stage);
  const view = $('.tb-view', stage);
  const px = (v) => `${Math.round(v * 10) / 10}px`;
  const el = (cls, css = {}) => {
    const d = document.createElement('div');
    d.className = cls;
    for (const [k, v] of Object.entries(css)) d.style.setProperty(k, v);
    world.append(d);
    return d;
  };
  // A flat piece lying on the ground at height z, centred on (x, y).
  const flat = (cls, x, y, z, w, h, css = {}) => el(`tb-flat ${cls}`, { '--x': px(x), '--y': px(y), '--z': px(z), '--w': px(w), '--h': px(h), ...css });
  // An upright plane w wide and h tall whose bottom edge is centred on (x, y, z), turned by rz.
  // A plane with rz = 0 faces the camera at turn 0; after turning it faces rz + turn.
  const shaded = [];
  const wall = (cls, x, y, z, w, h, rz, tilt = -90) => {
    const d = el(`tb-up ${cls}`, { '--x': px(x), '--y': px(y), '--z': px(z), '--w': px(w), '--h': px(h), '--rz': `${rz}deg`, '--rx': `${tilt}deg` });
    shaded.push({ d, a: rz, k: tilt === -90 ? 1 : 0.5 });
    return d;
  };
  // A billboard standing at (x, y, z): it turns against the world so it always faces the camera.
  const board = (cls, x, y, z, w, h) => el(`tb-board ${cls}`, { '--x': px(x), '--y': px(y), '--z': px(z), '--w': px(w), '--h': px(h) });

  // The round base, stacked discs. Discs are the same from every side, so the stack reads as a solid cylinder.
  const BASE_R = 168, BASE_H = 16, DISC = 2;
  flat('tb-ao tb-ground', 0, 0, -0.5, BASE_R * 2 + 70, BASE_R * 2 + 70);
  for (let z = 0; z <= BASE_H; z += DISC) {
    const top = z === BASE_H;
    const rim = BASE_H - z; // the top two discs pull in a little to round the rim
    flat(`tb-disc${top ? ' tb-disc-top' : ''}`, 0, 0, z, BASE_R * 2, BASE_R * 2, { '--in-on': px(rim < 4 ? (4 - rim) * 1.2 : 0) });
  }
  const T = BASE_H + 0.5;
  flat('tb-ao tb-ao-island', 0, 0, T, 236, 236);

  // The island: soil layers under a grass lip, a rounded square with a bevel along its top edge.
  const ISL = 214, ISL_H = 42, STEP = 2.5;
  const BEV = 11;
  const zTop = T + ISL_H;
  for (let z = T + 1; z <= zTop + 0.01; z += STEP) {
    const fromTop = zTop - z;
    const lip = fromTop < 8;
    const inset = fromTop < BEV ? BEV - Math.sqrt(Math.max(0, BEV * BEV - (BEV - fromTop) ** 2)) : 0;
    const band = Math.floor((z - T) / 9) % 2;
    flat(`tb-layer ${lip ? 'tb-grass' : `tb-soil tb-soil-${band}`}${fromTop < 0.01 ? ' tb-top' : ''}`, 0, 0, z, ISL, ISL, { '--in-on': px(inset) });
  }
  const G = zTop + 0.6;
  // Things painted on the grass
  flat('tb-path', 34, 52, G, 30, 104, { '--rot': '0deg' });
  flat('tb-pond', -52, 46, G, 78, 62);
  flat('tb-pond-shine', -60, 38, G + 0.3, 40, 12);
  // Soft contact shadows, one under everything that stands on the island
  const shadowAt = (x, y, w, h) => flat('tb-ao tb-contact', x, y, G + 0.2, w, h);

  // Houses: four walls, two roof planes and two gables.
  const house = (x, y, w, d, h, rh, cls, turned) => {
    shadowAt(x, y, (turned ? d : w) + 26, (turned ? w : d) + 26);
    // Work in the house's own axes, then swap them when it is turned 90 degrees.
    const P = (u, v) => (turned ? [x - v, y + u] : [x + u, y + v]);
    const R = (a) => a + (turned ? 90 : 0);
    const add = (u, v, z, ww, hh, rz, tilt, c) => { const [px2, py2] = P(u, v); return wall(`${cls} ${c}`, px2, py2, z, ww, hh, R(rz), tilt); };
    add(0, d / 2, G, w, h, 0, -90, 'tb-wall tb-front');
    add(0, -d / 2, G, w, h, 180, -90, 'tb-wall');
    add(w / 2, 0, G, d, h, -90, -90, 'tb-wall tb-side');
    add(-w / 2, 0, G, d, h, 90, -90, 'tb-wall tb-side');
    add(w / 2, 0, G + h, d, rh, -90, -90, 'tb-gable');
    add(-w / 2, 0, G + h, d, rh, 90, -90, 'tb-gable');
    const half = d / 2 + 6;
    const slope = Math.sqrt(half * half + (rh + 3) * (rh + 3));
    const ang = (Math.atan2(rh + 3, half) * 180) / Math.PI;
    add(0, half, G + h - 3, w + 12, slope, 0, -ang, 'tb-roof');
    add(0, -half, G + h - 3, w + 12, slope, 180, -ang, 'tb-roof');
  };
  house(-44, -46, 64, 48, 40, 28, 'tb-h1', false);
  house(56, -18, 46, 42, 32, 24, 'tb-h2', true);

  // Round trees and a peg figure
  const tree = (x, y, s, cls) => { shadowAt(x, y, s * 0.95, s * 0.95); board(`tb-tree ${cls}`, x, y, G, s, s * 1.32); };
  tree(80, 62, 44, 'tb-t-grn');
  tree(-86, 12, 38, 'tb-t-pink');
  tree(-6, -92, 34, 'tb-t-grn tb-t-small');
  tree(88, -82, 30, 'tb-t-yel');
  shadowAt(4, 36, 26, 26);
  board('tb-peg', 4, 36, G, 22, 44);

  // ---- turning ----
  const SUN = 40; // the light comes from the front left (a plane turned 40 degrees faces it), fixed to the screen
  const savedTurn = parseFloat(store.get('eas-toybox-turn'));
  let turn = Number.isFinite(savedTurn) ? savedTurn : -24; // a saved 0 (straight on) is a real angle
  let tilt = 56;
  let lightStep = null;
  const shade = () => {
    // The sides only change their light in 6-degree steps: the eye can't tell, and the layers repaint far less often.
    const step = Math.round(turn / 6) * 6;
    if (step === lightStep) return;
    lightStep = step;
    world.style.setProperty('--lturn', `${step}deg`);
    for (const f of shaded) {
      const lam = Math.max(0, Math.cos(((f.a + step - SUN) * Math.PI) / 180));
      f.d.style.setProperty('--lit', (0.74 + 0.34 * lam * f.k + (1 - f.k) * 0.2).toFixed(2));
    }
  };
  const apply = () => {
    world.style.setProperty('--turn', `${turn.toFixed(2)}deg`);
    world.style.setProperty('--tilt', `${tilt.toFixed(1)}deg`);
    shade();
  };
  apply();

  // ---- switches ----
  const LABEL = { bevel: 'Bevels', shadow: 'Soft shadows', sat: 'Saturated plastic' };
  $$('.tb-switch', stage).forEach((b) => {
    const key = b.dataset.key;
    const sync = () => { const on = stage.dataset[key] === 'on'; b.setAttribute('aria-pressed', String(on)); b.title = `${LABEL[key]}: ${on ? 'on' : 'off'}`; };
    sync();
    b.addEventListener('click', () => {
      stage.dataset[key] = stage.dataset[key] === 'on' ? 'off' : 'on';
      store.set(`eas-toybox-${key}`, stage.dataset[key]);
      sync();
    });
  });

  // ---- slow spin, drag, keys ----
  // The slow spin is a set of Web Animations (the world one way, each billboard the other way), which the compositor
  // runs without the page's script. The script only reshades the sides four times a second, and it stops the spin
  // altogether on a device that can't keep the frames coming.
  const SPEED = 7; // degrees a second, one turn in about 50 seconds
  const PERIOD = (360 / SPEED) * 1000;
  const boards = $$('.tb-board', world);
  let anims = [], spinFrom = 0, lightTimer = 0, onScreen = true, held = false, idleTimer = 0, tooSlow = false, probed = false, started = false;
  const spinAngle = () => (anims.length ? spinFrom + (((anims[0].currentTime || 0) % PERIOD) / PERIOD) * 360 : turn);
  const stopSpin = () => {
    if (!anims.length) return;
    turn = spinAngle();
    anims.forEach((a) => a.cancel());
    anims = [];
    clearInterval(lightTimer);
    apply();
  };
  // Watch the first 1.2 seconds of spinning once. If fewer than 30 frames arrive, or the median frame runs over 40 ms,
  // leave the island still (it still turns by hand). Deciding on time, not a frame count, keeps a slow device from
  // janking for long before the spin stops. A spin stopped before the verdict (a hand, off screen) is probed again later.
  const PROBE_MS = 1200;
  const probe = () => {
    const gaps = [];
    let prev = 0, first = 0;
    const f = (t) => {
      if (!anims.length) { probed = false; return; }
      if (prev) gaps.push(t - prev); else first = t;
      prev = t;
      if (t - first < PROBE_MS) { requestAnimationFrame(f); return; }
      gaps.sort((a, b) => a - b);
      if (gaps.length < 30 || gaps[gaps.length >> 1] > 40) { tooSlow = true; stopSpin(); }
    };
    requestAnimationFrame(f);
  };
  const startSpin = () => {
    if (anims.length || typeof world.animate !== 'function') return;
    spinFrom = turn;
    const kf = (fn) => [{ transform: fn(spinFrom) }, { transform: fn(spinFrom + 360) }];
    const timing = { duration: PERIOD, iterations: Infinity };
    anims = [world.animate(kf((a) => `rotateX(${tilt}deg) rotateZ(${a}deg)`), timing)];
    for (const b of boards) {
      const z = b.style.getPropertyValue('--z');
      anims.push(b.animate(kf((a) => `translateZ(${z}) rotateZ(${-a}deg) rotateX(${-tilt}deg)`), timing));
    }
    const t0 = document.timeline.currentTime;
    anims.forEach((a) => { a.startTime = t0; });
    lightTimer = setInterval(() => { turn = spinAngle(); shade(); }, 250);
    if (!probed) { probed = true; probe(); }
  };
  // Nothing spins until the delayed first run below; until then the observers only record the state.
  const run = () => {
    if (!started) return;
    if (!tooSlow && !isCalm() && onScreen && !document.hidden && !held && !idleTimer) startSpin();
    else stopSpin();
  };
  if ('IntersectionObserver' in window) {
    new IntersectionObserver((es) => { onScreen = es[es.length - 1].isIntersecting; run(); }).observe(view);
  }
  document.addEventListener('visibilitychange', run);
  addEventListener('eas:calm', run);
  // Start after the first paint, so the page shows before anything moves.
  requestAnimationFrame(() => setTimeout(() => { started = true; run(); }, 400));

  // After a hand turns the island, it waits a moment before spinning on.
  const rest = () => {
    store.set('eas-toybox-turn', String(Math.round(turn % 360)));
    clearTimeout(idleTimer);
    idleTimer = setTimeout(() => { idleTimer = 0; run(); }, 2500);
  };
  let sx = 0, sy = 0, st = 0, stl = 0, pid = null;
  view.addEventListener('pointerdown', (e) => {
    if (e.button !== 0) return;
    held = true;
    stopSpin();
    pid = e.pointerId; sx = e.clientX; sy = e.clientY; st = turn; stl = tilt;
    view.setPointerCapture(pid);
    stage.classList.add('is-held');
  });
  view.addEventListener('pointermove', (e) => {
    if (e.pointerId !== pid) return;
    turn = st + (e.clientX - sx) * 0.55;
    // A mouse can also orbit the camera up and down; on touch, vertical drags scroll the page.
    if (e.pointerType === 'mouse') tilt = Math.min(68, Math.max(40, stl - (e.clientY - sy) * 0.18));
    apply();
  });
  const release = (e) => {
    if (e.pointerId !== pid) return;
    pid = null; held = false; stage.classList.remove('is-held'); rest();
  };
  view.addEventListener('pointerup', release);
  view.addEventListener('pointercancel', release);
  view.addEventListener('keydown', (e) => {
    const k = { ArrowLeft: [-15, 0], ArrowRight: [15, 0], ArrowUp: [0, 4], ArrowDown: [0, -4] }[e.key];
    if (!k) return;
    // The page's own arrow keys move between styles; on the turntable they turn the island instead.
    e.preventDefault();
    e.stopPropagation();
    stopSpin();
    turn += k[0];
    tilt = Math.min(68, Math.max(40, tilt + k[1]));
    apply(); rest();
  });
  $$('.tb-spin', stage).forEach((b) => b.addEventListener('click', () => { stopSpin(); turn += 30 * Number(b.dataset.spin); apply(); rest(); }));
})();
