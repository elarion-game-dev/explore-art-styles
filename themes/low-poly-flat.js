// Low-Poly / Flat Minimal: a trail down a faceted mountain.
// The hero is a real height field in 3D, seen through a fixed orthographic camera. Every triangle is flat-shaded from its own
// normal by one sun, and the colours are designed for dawn, day, dusk and night rather than simulated. The sun follows the
// pointer (or a tap, or the time-of-day buttons). When it moves, the faces re-shade one by one, nearest the sun first.
// Below, every section is a stop on a trail that turns only at 45 degrees. Each stop is a small solid lit by the same sun,
// which also shades the two side faces of every block on the page (through --lp-kr and --lp-kb).
// Calm mode: the sun moves only on a tap or a button, every face re-shades at once, and the stops stay still.
(() => {
  const root = document.documentElement;
  const $ = (q, el = document) => el.querySelector(q);
  const $$ = (q, el = document) => [...el.querySelectorAll(q)];
  const isCalm = () => root.dataset.calm === '1';
  const NS = 'http://www.w3.org/2000/svg';
  const svg = (tag, attrs = {}, parent = null) => {
    const el = document.createElementNS(NS, tag);
    for (const [k, v] of Object.entries(attrs)) el.setAttribute(k, v);
    if (parent) parent.append(el);
    return el;
  };

  // ---- Maths and colour ----
  const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
  const lerp = (a, b, t) => a + (b - a) * t;
  const smooth = (a, b, x) => { const t = clamp((x - a) / (b - a)); return t * t * (3 - 2 * t); };
  const sub = (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
  const cross = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
  const dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
  const unit = (a) => { const l = Math.hypot(a[0], a[1], a[2]) || 1; return [a[0] / l, a[1] / l, a[2] / l]; };
  const seeded = (seed) => () => {
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  const rgb = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
  const mix = (a, b, t) => [lerp(a[0], b[0], t), lerp(a[1], b[1], t), lerp(a[2], b[2], t)];
  const hex = (c) => `#${c.map((x) => Math.round(clamp(x, 0, 255)).toString(16).padStart(2, '0')).join('')}`;
  const lum = (c) => c.reduce((s, x, i) => { const v = x / 255; return s + [0.2126, 0.7152, 0.0722][i] * (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4); }, 0);
  // A ramp runs shade, mid, lit. Lambert (0 to 1) picks a point on it, so every face gets one flat colour.
  const ramp = (r, t) => (t < 0.5 ? mix(r[0], r[1], t * 2) : mix(r[1], r[2], t * 2 - 1));

  // ---- The one sun. Everything below the hero reads it. ----
  const sun = { L: unit([0.35, 0.85, -0.62]), listeners: [] };
  let shared = 0;
  function share(L, force) {
    const now = performance.now();
    if (!force && now - shared < 90) return;
    shared = now;
    sun.L = L;
    // Light from the right brightens the right faces of the blocks; a high sun darkens the faces underneath.
    root.style.setProperty('--lp-kr', `${Math.round(lerp(14, 60, clamp(0.5 - L[0] * 0.62)))}%`);
    root.style.setProperty('--lp-kb', `${Math.round(lerp(44, 64, clamp(L[1])))}%`);
    for (const fn of sun.listeners) fn();
  }

  // ======== 1. The summit ========
  function summit() {
    const sky = $('.hero-text');
    if (!sky) return;
    const PITCH = 0.38; // the fixed camera looks about 22 degrees down at the range
    const CP = Math.cos(PITCH);
    const SP = Math.sin(PITCH);

    // Times of day. The sky has three colours: the top, the colour at the foot of the text and the horizon. A time with no
    // colour of its own at the foot of the text grades straight from top to horizon. Dawn keeps its pink below the text.
    // Ramps for three materials: low ground, rock, snow. Fog takes the sky's horizon colour.
    const time = (top, foot, low, glow, ...ramps) => ({ top: rgb(top), foot: foot && rgb(foot), mid: null, low: rgb(low), glow: rgb(glow), ramps: ramps.map((r) => r.map(rgb)) });
    const DAWN = time('#47459a', '#785ca6', '#f79ac6', '#ffe6d6', ['#2c2a66', '#5552a8', '#a39be0'], ['#3f2f70', '#b0607e', '#f6a08c'], ['#6c64b4', '#c9a8d6', '#ffe1e4']);
    const DAY = time('#8fd3e8', null, '#eaf6f0', '#fffbe8', ['#11656d', '#1fa89d', '#5fdcc8'], ['#83485a', '#d9785e', '#f9b48e'], ['#93b0cb', '#dce8ee', '#ffffff']);
    const DUSK = time('#e9773f', null, '#fbd06e', '#f9f98c', ['#48210c', '#8c431f', '#dc853c'], ['#5a2410', '#b5502a', '#f59a5c'], ['#8c4a3c', '#e39b72', '#ffe4ad']);
    const NIGHT = time('#12122e', null, '#34336e', '#dce4ff', ['#0c1630', '#173a5a', '#2c6b84'], ['#15153a', '#2e2d66', '#5e5da6'], ['#2a2c5e', '#6c72b0', '#b8c2ee']);
    const TIMES = [DAWN, DAY, DUSK, NIGHT];
    const blend = (a, b, t) => ({ top: mix(a.top, b.top, t), mid: mix(a.mid, b.mid, t), low: mix(a.low, b.low, t), glow: mix(a.glow, b.glow, t), ramps: a.ramps.map((r, i) => r.map((c, j) => mix(c, b.ramps[i][j], t))) });
    // u runs across the sky from east (dawn) to west (dusk). v runs down from the top of the sky, past the horizon at 0.72, into night.
    const HORIZON = 0.72;
    const PRESET = { dawn: [0.03, 0.6], day: [0.24, 0.14], dusk: [0.97, 0.6], night: [0.5, 1] };
    const elevationOf = (v) => (HORIZON - v) / HORIZON;
    const nightOf = (e) => smooth(0.1, -0.42, e); // a long dusk: night comes on over a wide band, so no small move flips it
    const paletteAt = (u, v) => {
      const e = elevationOf(v);
      const p = blend(DAY, blend(DAWN, DUSK, smooth(0.3, 0.7, u)), 1 - smooth(0.2, 0.78, e));
      const n = nightOf(e);
      return n > 0 ? blend(p, NIGHT, n) : p;
    };
    const MOON = unit([-0.55, 0.75, -0.62]);

    // The height field: a jittered grid, two triangles per cell, mountains on the right, low hills under the text.
    const rand = seeded(71);
    const X0 = -7.2; const X1 = 6.4; const Z0 = -0.7; const Z1 = 2.7; const DX = 0.33; const DZ = 0.35;
    const PEAKS = [ // x, z, height, radius
      [0, 1.25, 1.72, 1.1], [-0.95, 1.55, 0.85, 0.9], [1.15, 1.0, 0.8, 0.85], [2.2, 2.0, 1.15, 1.15], [3.4, 1.4, 0.85, 1.0],
      [4.5, 2.2, 1.0, 1.1], [5.6, 1.2, 0.7, 1.0], [0.85, 2.45, 0.75, 0.9], [-2.0, 0.6, 0.3, 0.9], [-3.3, 1.1, 0.24, 1.0],
      [-4.6, 0.7, 0.3, 1.0], [-6.0, 1.3, 0.26, 1.1], [-0.3, 0.15, 0.22, 0.7], [1.9, 0.2, 0.28, 0.8],
    ];
    const cols = Math.round((X1 - X0) / DX);
    const rows = Math.round((Z1 - Z0) / DZ);
    const verts = [];
    for (let j = 0; j <= rows; j++) {
      for (let i = 0; i <= cols; i++) {
        const x = X0 + i * DX + (i % cols ? (rand() - 0.5) * DX * 0.62 : 0);
        const z = Z0 + j * DZ + (j % rows ? (rand() - 0.5) * DZ * 0.62 : 0);
        let y = 0.04 + rand() * 0.08;
        for (const [px, pz, ph, pr] of PEAKS) {
          const d = Math.hypot(x - px, (z - pz) * 1.2) / pr;
          if (d < 1) y += ph * (1 - d) ** 1.2;
        }
        y *= 1 + (rand() - 0.5) * 0.24; // uneven facets
        verts.push([x, y * (0.2 + 0.8 * smooth(Z0, 0.6, z)), z]);
      }
    }
    const faces = [];
    const at = (i, j) => j * (cols + 1) + i;
    for (let j = 0; j < rows; j++) {
      for (let i = 0; i < cols; i++) {
        const q = [at(i, j), at(i + 1, j), at(i + 1, j + 1), at(i, j + 1)];
        const tris = rand() < 0.5 ? [[q[0], q[1], q[2]], [q[0], q[2], q[3]]] : [[q[0], q[1], q[3]], [q[1], q[2], q[3]]];
        for (const idx of tris) {
          const [a, b, c] = idx.map((k) => verts[k]);
          let n = unit(cross(sub(b, a), sub(c, a)));
          if (n[1] < 0) n = [-n[0], -n[1], -n[2]];
          const cy = (a[1] + b[1] + c[1]) / 3;
          const cz = (a[2] + b[2] + c[2]) / 3;
          const jit = rand();
          const mat = cy > 1.02 + jit * 0.2 && n[1] > 0.45 ? 2 : cy < 0.26 + jit * 0.12 ? 0 : 1;
          faces.push({ idx, n, mat, jit, fog: smooth(0.95, Z1, cz) * 0.7, depth: cz * CP - cy * SP, last: -1, on: false, sx: 0, sy: 0 });
        }
      }
    }
    faces.sort((a, b) => b.depth - a.depth); // painter's order: far faces first

    // The scene: sky (a CSS gradient on .hero-text), sun, then the faces.
    const scene = document.createElement('div');
    scene.className = 'lp-scene';
    scene.setAttribute('aria-hidden', 'true');
    const view = svg('svg', { class: 'lp-mesh', preserveAspectRatio: 'none', focusable: 'false' });
    const sunG = svg('g', { class: 'lp-sun' }, view);
    const halo2 = svg('circle', { opacity: '0.14' }, sunG);
    const halo1 = svg('circle', { opacity: '0.24' }, sunG);
    const disc = svg('circle', {}, sunG);
    const moon = svg('circle', { class: 'lp-moon', fill: '#e8edff' }, view);
    const land = svg('g', { class: 'lp-land' }, view);
    for (const f of faces) f.el = svg('polygon', {}, land);
    scene.append(view);
    sky.prepend(scene);

    const panel = document.createElement('div');
    panel.className = 'lp-panel';
    panel.setAttribute('role', 'group');
    panel.setAttribute('aria-label', 'Light the mountain');
    panel.innerHTML = `<span class="lp-panel-label">Time of day</span><span class="lp-times">${Object.keys(PRESET).map((k) => `<button type="button" class="lp-time" data-time="${k}" aria-pressed="false">${k[0].toUpperCase()}${k.slice(1)}</button>`).join('')}</span><button type="button" class="lp-wire" aria-pressed="false">Wireframe</button><p class="lp-readout"><span class="lp-hint"></span> <span class="lp-stats"></span></p>`;
    sky.append(panel);
    const hintEl = $('.lp-hint', panel);
    const statsEl = $('.lp-stats', panel);
    const touch = matchMedia('(hover: none)');
    const say = () => {
      hintEl.textContent = isCalm() ? 'Effects are off: tap the sky or pick a time of day.' : touch.matches ? 'Tap the sky or drag sideways to move the sun.' : 'Move the pointer over the sky to move the sun.';
    };

    // ---- Projection ----
    let W = 1; let H = 1; let ppu = 1; let camX = 0; let horizonY = 1; let peakX = 0; let shown = 0;
    let box = { x0: 0, x1: 1, y0: 0, y1: 1 };
    let stopsAt = [0, 60, 120, 180, 240, 360]; // where the sky's stops sit, in px from the top of the hero
    const textEls = ['.hero-kicker', '.hero-title', '.hero-sub', '.hero-tagline'].map((q) => $(q, sky)).filter(Boolean);
    function layout() {
      const b = sky.getBoundingClientRect();
      W = Math.max(1, b.width);
      H = Math.max(1, b.height);
      // Measure the glyphs, not the boxes: the text blocks span the whole width.
      let right = 0;
      let bottom = 0;
      const range = document.createRange();
      for (const el of textEls) {
        range.selectNodeContents(el);
        const t = range.getBoundingClientRect();
        right = Math.max(right, t.right - b.left);
        bottom = Math.max(bottom, t.bottom - b.top);
      }
      // Wide: mountains rise on the right beside the text, and whatever is drawn under the text stays below it.
      const wide = W >= 820 && right < W * 0.62;
      // The plaque stands on the foothills when there is room; on a phone it sits under the scene so the mountain stays whole.
      if (wide && panel.parentElement !== sky) sky.append(panel);
      if (!wide && panel.previousElementSibling !== sky) sky.after(panel);
      peakX = W * (wide ? 0.7 : 0.6);
      const tallestLeft = (p) => {
        const cx = -(peakX - W / 2) / p;
        let s = 0.5;
        for (const q of verts) if ((q[0] - cx) * p + W / 2 < right + 40) s = Math.max(s, q[1] * CP + q[2] * SP);
        return s;
      };
      if (wide) {
        ppu = (H * 0.9) / 2.3;
        for (let k = 0; k < 3; k++) ppu = Math.max(60, Math.min((H * 0.9) / 2.3, (H - bottom - 36) / tallestLeft(ppu)));
      } else ppu = Math.max(70, (H - bottom - 30) / 2.3);
      camX = -(peakX - W / 2) / ppu;
      horizonY = H - 1.14 * ppu;
      // The sun and its outer halo never pass behind the text.
      const R = clamp(W * 0.024, 16, 34);
      const y0 = wide ? 40 : bottom + R * 3.2;
      box = { x0: wide ? Math.max(right + R * 3.3, W * 0.44) : 30, x1: W - 40, y0, y1: y0 + Math.max(60, horizonY - y0) / HORIZON };
      // The sky's stops, in px from the top: four down to just below the foot of the text, then the horizon. Pixels, not
      // percentages, so that while a resize waits for this layout the stops stay where the text is.
      const foot = Math.max(bottom + 16, 8);
      stopsAt = [0, foot / 4, foot / 2, (foot * 3) / 4, foot, Math.max(horizonY, foot + 4)];
      const textFrac = clamp(bottom / Math.max(horizonY, 1), 0.05, 0.98);
      for (const T of TIMES) T.mid = T.foot || mix(T.top, T.low, textFrac);
      view.setAttribute('viewBox', `0 0 ${W.toFixed(1)} ${H.toFixed(1)}`);
      const pts = verts.map((p) => [(p[0] - camX) * ppu + W / 2, H - (p[1] * CP + p[2] * SP) * ppu]);
      shown = 0;
      for (const f of faces) {
        const q = f.idx.map((k) => pts[k]);
        f.on = !(q.every((p) => p[0] < -1) || q.every((p) => p[0] > W + 1) || q.every((p) => p[1] > H + 1));
        f.el.style.display = f.on ? '' : 'none';
        f.last = -1;
        if (!f.on) continue;
        shown++;
        f.el.setAttribute('points', q.map((p) => `${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(' '));
        f.sx = (q[0][0] + q[1][0] + q[2][0]) / 3;
        f.sy = (q[0][1] + q[1][1] + q[2][1]) / 3;
      }
      disc.setAttribute('r', R.toFixed(1));
      halo1.setAttribute('r', (R * 1.9).toFixed(1));
      halo2.setAttribute('r', (R * 3.1).toFixed(1));
      moon.setAttribute('r', (R * 0.62).toFixed(1));
      moon.setAttribute('cx', lerp(box.x0, box.x1, 0.12).toFixed(1));
      moon.setAttribute('cy', (box.y0 + R * 1.6).toFixed(1));
      skyKey = '';
      // The first layout paints everything at once. Later ones (a window resized, a phone's address bar, fonts arriving)
      // redraw the sky at its new stops and the sun in its new place in this same frame, with no time step so the colours and
      // the ink stay within their limits, and let the animation carry the light on from there.
      if (sk) { paintSky(stateNow(), performance.now(), 0, isCalm()); kick(); } else paintAll();
    }

    // ---- Light ----
    let u = PRESET.day[0];
    let v = PRESET.day[1];
    let tu = u;
    let tv = v;
    // The sun glides after the pointer on a critically damped spring of 0.7 Hz (half way in about 0.4 s), which passes slow
    // moves and smooths fast ones away. The hard limits on flashing are the luminance rates in paintFace and paintSky.
    let du = 0;
    let dv = 0;
    const OMEGA = 2 * Math.PI * 0.7;
    const spring = (x, vel, target, t) => { // exact step over t seconds
      const y = x - target;
      const e = Math.exp(-OMEGA * t);
      const c = vel + OMEGA * y;
      return [target + (y + c * t) * e, (vel - OMEGA * c * t) * e];
    };
    const stateNow = () => {
      const sx = lerp(box.x0, box.x1, u);
      const sy = lerp(box.y0, box.y1, v);
      const e = elevationOf(v);
      const sunL = unit([clamp((sx - peakX) / (W * 0.2), -2, 2), 0.12 + Math.max(e, 0) * 0.8, -0.5]);
      const n = nightOf(e);
      return { L: unit(mix(sunL, MOON, n)), pal: paletteAt(u, v), sx, sy, e, n };
    };

    // No flashing, whatever the pointer does. A WCAG flash is a pair of opposite changes in relative luminance of 0.1 or
    // more, and the limit is three flashes (six changes) in any second. Between two such changes the luminance has to travel
    // at least 0.1, so anything whose luminance moves slower than 0.6 a second cannot exceed it. Every face and every part of
    // the sky here moves slower than that.
    const FACE_RATE = 0.45; // per second: at most five opposite changes in any second
    const lumStep = (from, to, fromL, rate) => { // the furthest step from `from` towards `to` that changes luminance by at most `rate`
      if (Math.abs(lum(to) - fromL) <= rate) return to;
      let a = 0;
      let b = 1;
      for (let i = 0; i < 8; i++) { const m = (a + b) / 2; if (Math.abs(lum(mix(from, to, m)) - fromL) <= rate) a = m; else b = m; }
      return mix(from, to, a);
    };
    // Returns true while the face is still catching up with its light.
    function paintFace(f, s, rate) {
      const lam = clamp((dot(f.n, s.L) - 0.12) / 0.8);
      const want = mix(ramp(s.pal.ramps[f.mat], lam), s.pal.low, f.fog);
      const c = rate > 0 && f.cur ? lumStep(f.cur, want, f.curL, rate) : want;
      f.cur = c;
      f.curL = lum(c);
      const key = (Math.round(c[0]) << 16) | (Math.round(c[1]) << 8) | Math.round(c[2]);
      if (key !== f.last) {
        f.last = key;
        const h = `#${key.toString(16).padStart(6, '0')}`;
        f.el.setAttribute('fill', h);
        f.el.setAttribute('stroke', h);
      }
      return c !== want;
    }

    // The hero text sits on the sky and has two inks. Each ink has its own version of the sky: every stop from the top down
    // to the foot of the text is held on that ink's side of 5:1 (for the dark ink a stop that is too dark is lifted towards
    // white just enough, for the light ink one that is too light is lowered towards deep indigo), and the gradient between
    // the stops stays above 4.8:1. The ink and its sky are always drawn together, so no frame shows the text without it.
    // The ink belongs to a band: it changes only when the other ink's sky would be clearly closer to the design, and never
    // within LOCK of the last change. Where the two skies meet (a luminance of about 0.15 to 0.24 behind the text) a change of
    // ink moves the sky by less than 0.1, which is not even half a flash.
    // No part of the sky (its stops, the gradient between them, the sun's glow) changes luminance faster than SKY_RATE a
    // second. Between two opposite changes of 0.1 the sky has to move 0.1 or change ink, and in any second it can move 0.38
    // and change ink once, so no second holds more than five such changes: two and a half flashes at most.
    const INK_DARK = rgb('#14122b');
    const INK_LIGHT = rgb('#fffaf2');
    const L_DARK = 5 * (lum(INK_DARK) + 0.05) - 0.05; // the least luminance behind dark text
    const L_LIGHT = (lum(INK_LIGHT) + 0.05) / 5 - 0.05; // the most behind light text
    const WHITE = [255, 255, 255];
    const DEEP = [12, 10, 30];
    const TEXT_STOPS = 5; // the stops from the top down to the foot of the text
    const HYST = 0.02;
    const LOCK = 1050; // ms: at most one change of ink in any second
    const SKY_RATE = 0.38; // per second
    const holdFor = (c, dark) => {
      const L = lum(c);
      if (dark ? L >= L_DARK : L <= L_LIGHT) return c;
      const to = dark ? WHITE : DEEP; // luminance only rises towards white and only falls towards deep indigo
      let a = 0;
      let b = 1;
      for (let i = 0; i < 14; i++) { const m = (a + b) / 2; const x = lum(mix(c, to, m)); if (dark ? x >= L_DARK : x <= L_LIGHT) b = m; else a = m; }
      return mix(c, to, b);
    };
    const skyOf = (pal) => ({ c: [0, 0.25, 0.5, 0.75].map((t) => mix(pal.top, pal.mid, t)).concat([pal.mid, pal.low]), glow: pal.glow });
    const held = (k, dark) => ({ c: k.c.map((c, i) => (i < TEXT_STOPS ? holdFor(c, dark) : c)), glow: k.glow });
    const toward = (a, b, t) => ({ c: a.c.map((c, i) => mix(c, b.c[i], t)), glow: mix(a.glow, b.glow, t) });
    const probes = (k) => { // luminance of the glow, every stop, and two points between each pair of stops
      const out = [lum(k.glow)];
      k.c.forEach((c, i) => {
        out.push(lum(c));
        if (i) out.push(lum(mix(k.c[i - 1], c, 1 / 3)), lum(mix(k.c[i - 1], c, 2 / 3)));
      });
      return out;
    };
    // How far the stops behind the text are from suiting each ink, in luminance.
    const costOf = (k, dark) => Math.max(0, ...k.c.slice(0, TEXT_STOPS).map((c) => (dark ? L_DARK - lum(c) : lum(c) - L_LIGHT)));
    let inkDark = true;
    let switchedAt = -1e9;
    let sk = null; // the designed sky, as far as it has caught up with the sun
    let skyKey = '';
    // Returns true while the sky is still catching up or waiting to change ink, so the animation keeps running.
    function paintSky(s, now = 0, dt = 0, instant = true) {
      const want = skyOf(s.pal);
      let waiting = false;
      let moving = false;
      const better = () => (inkDark ? costOf(sk, true) > costOf(sk, false) + HYST : costOf(sk, false) > costOf(sk, true) + HYST);
      if (instant || !sk) {
        sk = want;
        if (better()) inkDark = !inkDark;
      } else {
        if (better()) {
          if (now - switchedAt >= LOCK) { inkDark = !inkDark; switchedAt = now; } else waiting = true;
        }
        const from = probes(held(sk, inkDark));
        const step = (SKY_RATE * dt) / 1000;
        const ok = (t) => probes(held(toward(sk, want, t), inkDark)).every((x, i) => Math.abs(x - from[i]) <= step);
        let t = 1;
        if (!ok(1)) {
          let a = 0;
          let b = 1;
          for (let i = 0; i < 10; i++) { const m = (a + b) / 2; if (ok(m)) a = m; else b = m; }
          t = a;
          moving = true;
        }
        sk = t === 1 ? want : toward(sk, want, t);
      }
      const k = held(sk, inkDark);
      const grad = `linear-gradient(180deg, ${k.c.map((c, i) => `${hex(c)} ${stopsAt[i].toFixed(1)}px`).join(', ')})`;
      const ink = hex(inkDark ? INK_DARK : INK_LIGHT);
      if (grad + ink !== skyKey) {
        skyKey = grad + ink;
        sky.style.setProperty('--sky-grad', grad);
        sky.style.setProperty('--sky-ink', ink);
        sky.classList.toggle('lp-dark-sky', !inkDark);
      }
      sunG.setAttribute('transform', `translate(${s.sx.toFixed(1)} ${s.sy.toFixed(1)})`);
      sunG.setAttribute('fill', hex(k.glow));
      moon.setAttribute('opacity', s.n.toFixed(2));
      return moving || waiting;
    }

    const readout = (s) => {
      const deg = Math.round((Math.asin(clamp(s.L[1], -1, 1)) * 180) / Math.PI);
      statsEl.textContent = `${s.e < 0 ? 'Moon' : 'Sun'} ${deg}° · ${shown} faces · 1 light · 0 textures`;
    };

    // Faces far from the sun read older light from this history, so a change spreads outwards face by face.
    const N = 26;
    const hist = new Array(N);
    let head = 0;
    let still = 0;
    let raf = 0;
    let lastKey = '';
    let lastNow = 0;
    function paintAll() {
      const s = stateNow();
      hist.fill(s);
      paintSky(s);
      for (const f of faces) if (f.on) paintFace(f, s, 0);
      readout(s);
      share(s.L, true);
    }
    function frame(now) {
      raf = 0;
      const calm = isCalm();
      const dt = lastNow ? clamp(now - lastNow, 0, 50) : 1000 / 60; // the first frame of a run gets a nominal step
      lastNow = now;
      if (calm) { u = tu; v = tv; du = 0; dv = 0; } else {
        [u, du] = spring(u, du, tu, dt / 1000);
        [v, dv] = spring(v, dv, tv, dt / 1000);
        if (Math.abs(tu - u) + Math.abs(tv - v) < 3e-4 && Math.abs(du) + Math.abs(dv) < 3e-3) { u = tu; v = tv; du = 0; dv = 0; }
      }
      const s = stateNow();
      const key = `${u.toFixed(4)} ${v.toFixed(4)}`;
      still = key === lastKey ? still + 1 : 0;
      lastKey = key;
      head = (head + 1) % N;
      hist[head] = s;
      let busy = paintSky(s, now, dt, calm);
      const far = Math.hypot(W, H);
      const rate = calm ? 0 : (FACE_RATE * dt) / 1000;
      for (const f of faces) {
        if (!f.on) continue;
        const lag = calm ? 0 : Math.min(N - 1, Math.round((Math.hypot(f.sx - s.sx, f.sy - s.sy) / far) * (N - 8) + f.jit * 7));
        if (paintFace(f, hist[(head - lag + N) % N] || s, rate)) busy = true;
      }
      readout(s);
      if (!calm && (still < N || busy)) {
        share(s.L, false);
        raf = requestAnimationFrame(frame);
      } else {
        hist.fill(s);
        share(s.L, true);
      }
    }
    const kick = () => {
      still = 0;
      if (raf) return;
      lastNow = 0;
      raf = requestAnimationFrame(frame);
    };

    // ---- Input ----
    const press = (name) => { for (const b of $$('.lp-time', panel)) b.setAttribute('aria-pressed', String(b.dataset.time === name)); };
    const aim = (e) => {
      const b = sky.getBoundingClientRect();
      tu = clamp((e.clientX - b.left) / b.width);
      tv = clamp((e.clientY - b.top) / b.height);
      press(null);
      kick();
    };
    // Mouse and pen aim on hover and on a click. A finger aims on a tap, or once a drag is clearly sideways, so a scroll
    // that starts on the sky leaves the light alone (the sky only lets the browser pan vertically).
    let touchAt = null;
    const ignore = (e) => !e.isPrimary || e.target.closest('.lp-panel, a, button');
    sky.addEventListener('pointerdown', (e) => {
      if (ignore(e)) return;
      if (e.pointerType === 'touch') touchAt = { x: e.clientX, y: e.clientY, drag: false };
      else aim(e);
    });
    sky.addEventListener('pointermove', (e) => {
      if (ignore(e) || isCalm()) return;
      if (e.pointerType !== 'touch') { aim(e); return; }
      if (!touchAt) return;
      const dx = Math.abs(e.clientX - touchAt.x);
      if (!touchAt.drag && dx > 10 && dx > Math.abs(e.clientY - touchAt.y) * 1.5) touchAt.drag = true;
      if (touchAt.drag) aim(e);
    });
    sky.addEventListener('pointerup', (e) => {
      const t = touchAt;
      touchAt = null;
      if (!t || ignore(e) || t.drag) return;
      if (Math.hypot(e.clientX - t.x, e.clientY - t.y) < 10) aim(e);
    });
    sky.addEventListener('pointercancel', () => { touchAt = null; });
    for (const b of $$('.lp-time', panel)) {
      b.addEventListener('click', () => {
        [tu, tv] = PRESET[b.dataset.time];
        press(b.dataset.time);
        kick();
      });
    }
    const wire = $('.lp-wire', panel);
    wire.addEventListener('click', () => {
      const on = !view.classList.contains('is-wire');
      view.classList.toggle('is-wire', on);
      wire.setAttribute('aria-pressed', String(on));
    });
    addEventListener('eas:calm', () => {
      if (isCalm()) { u = tu; v = tv; du = 0; dv = 0; }
      paintAll();
      say();
    });
    touch.addEventListener?.('change', say);

    say();
    press('day');
    layout();
    // Lay out inside the observer, which runs after the browser's layout and before it paints, so the sky's stops never lag
    // the reflowed text. Nothing layout() changes can resize the sky: the plaque is absolutely placed while it is inside.
    new ResizeObserver(() => layout()).observe(sky);
    document.fonts?.ready.then(layout);
  }

  // ======== 2. The stops: small solids lit by the same sun ========
  const MATS = {
    coral: ['#7d3c48', '#dc7a5c', '#fbb894'], lagoon: ['#0e5f66', '#1faea3', '#7debdb'], sand: ['#7e5e44', '#d2ad80', '#fbe9c9'],
    pink: ['#76345f', '#e07ab3', '#ffc9e4'], indigo: ['#23215a', '#5a57ae', '#aeabf2'], sun: ['#7c6c1c', '#ddcb4c', '#fdfbb4'],
    red: ['#5a0c0c', '#d8231c', '#ff8a66'], green: ['#174d36', '#3a9460', '#a6e3a6'],
  };
  function solidOf(kind) {
    const ring = (n, y, r, a0 = 0) => Array.from({ length: n }, (_, i) => [Math.cos(a0 + (i / n) * Math.PI * 2) * r, y, Math.sin(a0 + (i / n) * Math.PI * 2) * r]);
    const range = (a, b) => Array.from({ length: b - a }, (_, i) => a + i);
    let v = [];
    let f = [];
    const byEdge = (len) => { // every triangle whose three sides have this length
      const out = [];
      const edge = (a, b) => Math.abs(Math.hypot(...sub(v[a], v[b])) - len) < 1e-3;
      for (let a = 0; a < v.length; a++) for (let b = a + 1; b < v.length; b++) if (edge(a, b)) for (let c = b + 1; c < v.length; c++) if (edge(a, c) && edge(b, c)) out.push([a, b, c]);
      return out;
    };
    const prism = (n, h, r, a0) => { v = [...ring(n, -h, r, a0), ...ring(n, h, r, a0)]; f = [range(0, n), range(n, 2 * n), ...range(0, n).map((i) => [i, (i + 1) % n, n + ((i + 1) % n), n + i])]; };
    const pyramid = (n, h, r, apex) => { v = [...ring(n, -h, r), apex]; f = [range(0, n), ...range(0, n).map((i) => [i, (i + 1) % n, n])]; };
    if (kind === 'cube') {
      for (const x of [-1, 1]) for (const y of [-1, 1]) for (const z of [-1, 1]) v.push([x * 0.64, y * 0.64, z * 0.64]);
      f = [[0, 1, 3, 2], [4, 5, 7, 6], [0, 1, 5, 4], [2, 3, 7, 6], [0, 2, 6, 4], [1, 3, 7, 5]];
    } else if (kind === 'octa') {
      v = [[1, 0, 0], [-1, 0, 0], [0, 1, 0], [0, -1, 0], [0, 0, 1], [0, 0, -1]];
      f = byEdge(Math.SQRT2);
      v = v.map((p) => [p[0] * 0.86, p[1] * 1.08, p[2] * 0.86]);
    } else if (kind === 'tetra') {
      v = [[1, 1, 1], [1, -1, -1], [-1, 1, -1], [-1, -1, 1]].map((p) => p.map((x) => x * 0.64));
      f = [[0, 1, 2], [0, 1, 3], [0, 2, 3], [1, 2, 3]];
    } else if (kind === 'ico') {
      const g = (1 + Math.sqrt(5)) / 2;
      v = [[0, 1, g], [0, 1, -g], [0, -1, g], [0, -1, -g], [1, g, 0], [1, -g, 0], [-1, g, 0], [-1, -g, 0], [g, 0, 1], [g, 0, -1], [-g, 0, 1], [-g, 0, -1]];
      f = byEdge(2);
      v = v.map((p) => p.map((x) => x / 1.86));
    } else if (kind === 'hex') prism(6, 0.4, 0.92, 0);
    else if (kind === 'prism') prism(3, 0.55, 0.95, Math.PI / 2);
    else if (kind === 'cone') pyramid(7, 0.72, 0.66, [0, 0.98, 0]);
    else pyramid(5, 0.55, 0.98, [0.16, 0.85, -0.1]); // a peak
    const centre = v.reduce((s, p) => [s[0] + p[0] / v.length, s[1] + p[1] / v.length, s[2] + p[2] / v.length], [0, 0, 0]);
    const n = f.map((face, i) => {
      let m = unit(cross(sub(v[face[1]], v[face[0]]), sub(v[face[2]], v[face[0]])));
      const c = face.reduce((s, k) => [s[0] + v[k][0] / face.length, s[1] + v[k][1] / face.length, s[2] + v[k][2] / face.length], [0, 0, 0]);
      if (dot(m, sub(c, centre)) < 0) { m = [-m[0], -m[1], -m[2]]; f[i] = [...face].reverse(); }
      return m;
    });
    return { v, f, n };
  }
  const IP = 0.5; // the stops are seen from a little higher than the mountain
  const ICP = Math.cos(IP);
  const ISP = Math.sin(IP);
  function makeIcon(kind, mat, yaw, className) {
    const S = solidOf(kind);
    const box = document.createElement('span');
    box.className = className;
    box.setAttribute('aria-hidden', 'true');
    const el = svg('svg', { viewBox: '-1.25 -1.25 2.5 2.5', focusable: 'false' });
    const polys = S.f.map(() => svg('polygon', { 'stroke-width': '0.025', 'stroke-linejoin': 'round' }, el));
    box.append(el);
    const icon = { S, polys, box, yaw, mat: MATS[mat].map(rgb), turning: false };
    drawIcon(icon);
    return icon;
  }
  function drawIcon(ic) {
    const c = Math.cos(ic.yaw);
    const s = Math.sin(ic.yaw);
    const turn = (p) => [p[0] * c - p[2] * s, p[1], p[0] * s + p[2] * c];
    const pts = ic.S.v.map((p) => { const q = turn(p); return [q[0], -(q[1] * ICP + q[2] * ISP)]; });
    const L = unit([sun.L[0], Math.max(0.5, sun.L[1]), sun.L[2]]);
    ic.S.f.forEach((face, i) => {
      const n = turn(ic.S.n[i]);
      const poly = ic.polys[i];
      const show = n[1] * ISP - n[2] * ICP > 1e-3; // back faces are culled
      poly.style.display = show ? '' : 'none';
      if (!show) return;
      poly.setAttribute('points', face.map((k) => `${pts[k][0].toFixed(3)},${pts[k][1].toFixed(3)}`).join(' '));
      const col = hex(ramp(ic.mat, clamp((dot(n, L) + 0.22) / 1.12)));
      poly.setAttribute('fill', col);
      poly.setAttribute('stroke', col);
    });
  }

  // ======== 3. The trail ========
  function trail() {
    const main = $('main');
    if (!main) return;
    const secs = $$(':scope > .sec', main);
    if (!secs.length) return;
    const KIND = { feel: ['peak', 'coral'], core: ['octa', 'lagoon'], how: ['cube', 'sand'], palette: ['hex', 'pink'], vibe: ['ico', 'indigo'], refs: ['tetra', 'sun'], sources: ['prism', 'red'], related: ['cone', 'green'] };
    const icons = [];
    const stops = secs.map((sec, i) => {
      const [kind, mat] = KIND[sec.id] || ['octa', 'lagoon'];
      const st = makeIcon(kind, mat, 0.45 + i * 0.37, 'lp-stop');
      st.sec = sec;
      sec.classList.toggle('lp-r', i % 2 === 1);
      sec.prepend(st.box);
      icons.push(st);
      return st;
    });
    // The contents is the trail map: each entry carries the same solid as its stop.
    for (const a of $$('.toc a')) {
      const [kind, mat] = KIND[(a.getAttribute('href') || '').slice(1)] || [];
      if (!kind) continue;
      const ic = makeIcon(kind, mat, 0.6, 'lp-tstop');
      a.before(ic.box); // beside the link, not inside it, so the link's text box is only its words
      icons.push(ic);
    }
    sun.listeners.push(() => { for (const ic of icons) drawIcon(ic); });

    const line = svg('svg', { class: 'lp-trail', 'aria-hidden': 'true', focusable: 'false' });
    const path = svg('path', { class: 'lp-trail-line' }, line);
    const ends = svg('path', { class: 'lp-trail-end' }, line);
    main.prepend(line);
    const f1 = (x) => x.toFixed(1);
    function draw() {
      const m = main.getBoundingClientRect();
      line.setAttribute('width', f1(m.width));
      line.setAttribute('height', f1(m.height));
      line.setAttribute('viewBox', `0 0 ${f1(m.width)} ${f1(m.height)}`);
      const pts = stops.map((st) => {
        const r = st.box.getBoundingClientRect();
        const s = st.sec.getBoundingClientRect();
        return { x: r.left + r.width / 2 - m.left, y: r.top + r.height / 2 - m.top, w: r.width, stopTop: r.top - m.top, top: s.top - m.top, bottom: s.bottom - m.top };
      });
      // The caps stay inside the gutter: narrower than the stop, so they never reach the text beside it.
      const cap = Math.max(6, Math.min(18, pts[0].w / 2 - 8));
      // The trail starts with a cap just above the first stop, not on top of it.
      const startY = pts[0].stopTop - 18;
      // Down the gutter beside each section, then across the gap between sections with two 45 degree bends.
      let d = `M${f1(pts[0].x)} ${f1(startY)}`;
      pts.forEach((p, i) => {
        d += ` L${f1(p.x)} ${f1(p.y)}`;
        const q = pts[i + 1];
        if (!q || Math.abs(q.x - p.x) < 2) return;
        const gap = Math.max(20, q.top - p.bottom);
        const h = clamp(gap * 0.3, 10, 44);
        const yc = p.bottom + gap / 2;
        const dir = Math.sign(q.x - p.x);
        d += ` L${f1(p.x)} ${f1(yc - h)} L${f1(p.x + dir * h)} ${f1(yc)} L${f1(q.x - dir * h)} ${f1(yc)} L${f1(q.x)} ${f1(yc + h)}`;
      });
      // The trail ends with a cap below the last section, in the space before the footer, clear of its last row of labels.
      const last = pts[pts.length - 1];
      const endY = Math.max(last.y + 40, last.bottom + 34);
      d += ` L${f1(last.x)} ${f1(endY)}`;
      path.setAttribute('d', d);
      ends.setAttribute('d', `M${f1(pts[0].x - cap)} ${f1(startY)} H${f1(pts[0].x + cap)} M${f1(last.x - cap)} ${f1(endY)} H${f1(last.x + cap)}`);
    }
    let pending = 0;
    const redraw = () => { cancelAnimationFrame(pending); pending = requestAnimationFrame(draw); };
    new ResizeObserver(redraw).observe(main);
    document.fonts?.ready.then(redraw);
    draw();

    // A stop turns a quarter, the way a rotating platform does, when you reach it or point at it.
    const turn = (st) => {
      if (isCalm() || st.turning) return;
      st.turning = true;
      const from = st.yaw;
      const t0 = performance.now();
      const step = (now) => {
        const t = clamp((now - t0) / 1200);
        st.yaw = from + (Math.PI / 2) * (t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2);
        drawIcon(st);
        if (t < 1 && !isCalm()) requestAnimationFrame(step);
        else st.turning = false;
      };
      requestAnimationFrame(step);
    };
    if ('IntersectionObserver' in window) {
      const io = new IntersectionObserver((entries) => {
        for (const e of entries) if (e.isIntersecting) turn(stops.find((st) => st.box === e.target));
      }, { rootMargin: '0px 0px -20% 0px', threshold: 1 });
      for (const st of stops) io.observe(st.box);
    }
    for (const st of stops) st.box.addEventListener('pointerenter', () => turn(st));
  }

  trail();
  summit();
})();
