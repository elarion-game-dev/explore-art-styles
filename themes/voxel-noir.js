// Voxel Noir: a real isometric city of CSS 3D cuboids, a title made of real cubes, pixel rain,
// and one red string that runs through the page from pin to pin. The core notes can be dragged and the string follows.
(() => {
  const root = document.documentElement;
  const isCalm = () => root.dataset.calm === '1';
  const make = (tag, cls) => { const e = document.createElement(tag); if (cls) e.className = cls; return e; };
  const seeded = (s) => () => { s = (s * 16807) % 2147483647; return s / 2147483647; };
  const hero = document.querySelector('.hero');
  const heroText = document.querySelector('.hero-text');
  const phone = () => innerWidth <= 760;

  // ------- textures: one colour per cube, drawn once on a tiny canvas and scaled up without smoothing
  function wallTexture(wall, rnd, lit) {
    const n = 32;
    const c = make('canvas');
    c.width = n;
    c.height = n;
    const g = c.getContext('2d');
    const warm = ['#ffc25a', '#f49f16', '#ffd98f', '#ffb648', '#f7e6b0', '#7fe3ee'];
    for (let y = 0; y < n; y += 1) {
      for (let x = 0; x < n; x += 1) {
        const k = 0.9 + rnd() * 0.2;
        g.fillStyle = `rgb(${wall[0] * k | 0},${wall[1] * k | 0},${wall[2] * k | 0})`;
        g.fillRect(x, y, 1, 1);
      }
    }
    for (let y = 1; y < n; y += 4) {
      for (let x = 1; x < n; x += 3) {
        const on = rnd() < lit;
        g.fillStyle = on ? warm[Math.floor(rnd() * warm.length)] : `rgb(${wall[0] * 0.45 | 0},${wall[1] * 0.45 | 0},${wall[2] * 0.55 | 0})`;
        g.fillRect(x, y, 2, 2);
      }
    }
    return c.toDataURL();
  }
  function roofTexture(base, rnd) {
    const n = 16;
    const c = make('canvas');
    c.width = n;
    c.height = n;
    const g = c.getContext('2d');
    for (let y = 0; y < n; y += 1) {
      for (let x = 0; x < n; x += 1) {
        const k = 0.88 + rnd() * 0.24;
        g.fillStyle = `rgb(${base[0] * k | 0},${base[1] * k | 0},${base[2] * k | 0})`;
        g.fillRect(x, y, 1, 1);
      }
    }
    return c.toDataURL();
  }

  // ------- the city
  const scene = make('div', 'vx-scene');
  scene.setAttribute('aria-hidden', 'true');
  const world = make('div', 'vx-world');
  scene.append(world);
  hero.prepend(scene);

  function buildCity() {
    world.textContent = '';
    const small = phone();
    const V = small ? 9 : 12;
    const W = innerWidth;
    const H = hero.querySelector('.hero-text').offsetHeight + 90;
    scene.style.setProperty('--scene-h', `${H}px`);
    const rnd = seeded(1979);
    const texSize = 32 * V;
    const walls = [[44, 44, 86], [60, 38, 70], [30, 54, 70], [52, 40, 62]];
    const texS = walls.map((w) => wallTexture(w, rnd, 0.3));
    const texE = walls.map((w) => wallTexture(w.map((v) => v * 0.62), rnd, 0.26));
    const roofs = [[62, 58, 104], [74, 54, 88], [46, 72, 90]].map((b) => roofTexture(b, rnd));

    const span = small ? 1400 : 3400;
    const ground = make('div', 'vx-ground');
    ground.style.cssText = `left:${-span / 2}px;top:${-span / 2}px;width:${span}px;height:${span}px;background-image:repeating-linear-gradient(0deg,rgb(120 160 220 / .05) 0 1px,transparent 1px ${V}px),repeating-linear-gradient(90deg,rgb(120 160 220 / .05) 0 1px,transparent 1px ${V}px)`;
    world.append(ground);

    const CELL = 15 * V;
    const reach = Math.ceil((Math.max(W, H * 2) * 1.2) / CELL);
    const faces = [];
    const face = (parent, w, h, tf, bg, size, ox = 0, oy = 0) => {
      const f = make('div', 'vx-f');
      f.style.cssText = `width:${w}px;height:${h}px;transform:${tf};background-image:${bg};background-size:${size}px;background-position:${ox}px ${oy}px`;
      parent.append(f);
      faces.push(f);
      return f;
    };
    const SIGNS = ['#ff4f9a', '#37d5e8', '#ff8f2e', '#e3202a', '#c5fe5c', '#ff4f9a'];
    const cuboid = (parent, x, y, z, w, d, h, tex, fog) => {
      const b = make('div', 'vx-b');
      b.style.transform = `translate3d(${x}px,${y}px,${z}px)`;
      const haze = `linear-gradient(rgb(58 46 104 / ${fog}),rgb(58 46 104 / ${fog}))`;
      const ox = -V * Math.floor(rnd() * 32);
      const oy = -V * Math.floor(rnd() * 32);
      face(b, w, d, `translateZ(${h}px)`, `${haze},url(${roofs[tex % roofs.length]})`, V * 16);
      const south = face(b, w, h, `translateY(${d}px) rotateX(90deg)`, `${haze},url(${texS[tex]})`, texSize, ox, oy);
      const east = face(b, d, h, `translateX(${w}px) rotateZ(90deg) rotateX(90deg)`, `${haze},url(${texE[tex]})`, texSize, oy, ox);
      parent.append(b);
      return { b, south, east };
    };

    let count = 0;
    const cos = 0.707;
    const tilt = 0.53;
    const limit = small ? 56 : 150;
    const cells = [];
    for (let gx = -reach; gx <= reach; gx += 1) {
      for (let gy = -reach; gy <= reach; gy += 1) cells.push([gx, gy]);
    }
    // Build front to back, nearest the middle of the screen first, so the budget goes on what is seen.
    cells.sort((a, b) => (Math.abs(a[0] - a[1]) + Math.abs(a[0] + a[1])) - (Math.abs(b[0] - b[1]) + Math.abs(b[0] + b[1])));
    for (const [gx, gy] of cells) {
      if (count >= limit) break;
      const x = gx * CELL;
      const y = gy * CELL;
      const sx = (x - y) * cos;
      const sy = (x + y) * cos * tilt;
      if (Math.abs(sx) > W * 0.62 + CELL) continue;
      if (sy < -H * 0.62 - CELL * 0.4 || sy > H * 1.0 + CELL) continue;
      const w = (6 + Math.floor(rnd() * 5)) * V;
      const d = (6 + Math.floor(rnd() * 5)) * V;
      const depth = (sy + H * 0.5) / (H * 1.2); // 0 at the back, 1 at the front
      let storeys = 8 + Math.floor(rnd() * 16) + (rnd() < 0.18 ? 16 : 0);
      if (small) storeys = Math.round(storeys * 0.8);
      const h = storeys * V;
      const fog = Math.max(0, Math.min(0.62, 0.62 - depth * 0.8)).toFixed(2);
      const tex = Math.floor(rnd() * walls.length);
      const px = x + Math.floor(rnd() * 2) * V;
      const py = y + Math.floor(rnd() * 2) * V;
      const { south, east } = cuboid(world, px, py, 0, w, d, h, tex, fog);
      // Setback: a smaller block on top of about one in three.
      if (rnd() < 0.36) {
        const sw = w - 2 * V;
        const sd = d - 2 * V;
        cuboid(world, px + V, py + V, h, sw, sd, (3 + Math.floor(rnd() * 7)) * V, tex, fog);
      }
      if (rnd() < 0.5 && depth > 0.15) {
        const target = rnd() < 0.5 ? south : east;
        const fw = rnd() < 0.5;
        const c = SIGNS[Math.floor(rnd() * SIGNS.length)];
        const sign = make('i', `vx-sign${rnd() < 0.5 ? ' st' : ''}${rnd() < 0.3 ? ' fl' : ''}`);
        const sw = (fw ? 4 : 1 + Math.floor(rnd() * 2)) * V;
        const sh = (fw ? 2 : 5 + Math.floor(rnd() * 4)) * V;
        const max = parseFloat(target.style.height);
        sign.style.cssText = `--c:${c};left:${V}px;top:${Math.min(max - sh - V, (3 + Math.floor(rnd() * 8)) * V)}px;width:${sw}px;height:${sh}px`;
        target.append(sign);
      }
      count += 1;
    }

    // Flying cars on the air lanes above the streets.
    const lanes = small ? 3 : 7;
    for (let i = 0; i < lanes; i += 1) {
      const horizontal = i % 2 === 0;
      const lane = (Math.floor(rnd() * 8) - 4) * CELL - 2 * V;
      const z = (10 + Math.floor(rnd() * 22)) * V;
      const car = make('div', `vx-car ${horizontal ? 'x' : 'y'}`);
      const a = -Math.max(W, 900);
      const b = Math.max(W, 900);
      const start = a + rnd() * (b - a);
      const L = 3 * V;
      const S = V;
      car.style.cssText = `--a:${a}px;--b:${b}px;--p:${lane}px;--z:${z}px;--t:${14 + rnd() * 18}s;--d:${-rnd() * 20}s;transform:translate3d(${horizontal ? `${start}px,${lane}px` : `${lane}px,${start}px`},${z}px)`;
      const w = horizontal ? L : S;
      const d = horizontal ? S : L;
      const part = (pw, ph, tf, col, glow) => {
        const f = make('i');
        f.style.cssText = `width:${pw}px;height:${ph}px;transform:${tf};background:${col};${glow ? `box-shadow:0 0 12px 2px ${col}` : ''}`;
        car.append(f);
      };
      part(w, d, `translateZ(${V}px)`, '#20254a');
      part(w, V, `translateY(${d}px) rotateX(90deg)`, horizontal ? '#141832' : '#ff3b3b', !horizontal);
      part(d, V, `translateX(${w}px) rotateZ(90deg) rotateX(90deg)`, horizontal ? '#ff3b3b' : '#141832', horizontal);
      world.append(car);
    }
  }

  // ------- title: real cubes. The heading stays in the page for screen readers and search.
  const FONT = {
    V: ['1...1', '1...1', '1...1', '1...1', '1...1', '.1.1.', '..1..'],
    O: ['.111.', '1...1', '1...1', '1...1', '1...1', '1...1', '.111.'],
    X: ['1...1', '1...1', '.1.1.', '..1..', '.1.1.', '1...1', '1...1'],
    E: ['11111', '1....', '1....', '1111.', '1....', '1....', '11111'],
    L: ['1....', '1....', '1....', '1....', '1....', '1....', '11111'],
    N: ['1...1', '11..1', '11..1', '1.1.1', '1..11', '1..11', '1...1'],
    I: ['111', '.1.', '.1.', '.1.', '.1.', '.1.', '111'],
    R: ['1111.', '1...1', '1...1', '1111.', '1.1..', '1..1.', '1...1'],
    ' ': ['...', '...', '...', '...', '...', '...', '...'],
  };
  const title3d = make('div', 'vx-title');
  title3d.setAttribute('aria-hidden', 'true');
  const titleBack = make('div', 'vx-title-back');
  titleBack.setAttribute('aria-hidden', 'true');
  heroText.prepend(titleBack);
  heroText.append(title3d);
  root.classList.add('vx-has3d');

  function grid(lines) {
    const rows = [];
    lines.forEach((line, li) => {
      const row = Array.from({ length: 7 }, () => []);
      [...line].forEach((ch, i) => {
        const g = FONT[ch];
        g.forEach((r, y) => {
          if (i) row[y].push(0);
          row[y].push(...[...r].map((c) => (c === '1' ? 1 : 0)));
        });
      });
      if (li) rows.push(new Array(row[0].length).fill(0), new Array(row[0].length).fill(0));
      rows.push(...row);
    });
    const cols = Math.max(...rows.map((r) => r.length));
    rows.forEach((r) => { while (r.length < cols) r.push(0); });
    return rows;
  }
  function buildTitle() {
    title3d.textContent = '';
    const small = phone();
    const rows = grid(small ? ['VOXEL', 'NOIR'] : ['VOXEL NOIR']);
    const cols = rows[0].length;
    const T = Math.floor(Math.min((innerWidth * (small ? 0.84 : 0.72)) / cols, small ? 14 : 27));
    const D = Math.round(T * 2.6);
    const x0 = -(cols * T) / 2;
    const y0 = -(rows.length * T) / 2;
    const add = (w, h, tf, bg) => {
      const f = make('i');
      f.style.cssText = `width:${w}px;height:${h}px;transform:${tf};background:${bg}`;
      title3d.append(f);
    };
    const line = (a) => `linear-gradient(90deg,rgb(0 0 0 / ${a}) 1px,transparent 1px) 0 0/${T}px ${T}px,linear-gradient(rgb(0 0 0 / ${a}) 1px,transparent 1px) 0 0/${T}px ${T}px`;
    const at = (r, c) => (rows[r] && rows[r][c]) || 0;
    // Front faces, one run at a time.
    rows.forEach((row, r) => {
      let c = 0;
      while (c < cols) {
        if (!row[c]) { c += 1; continue; }
        let e = c;
        while (e + 1 < cols && row[e + 1]) e += 1;
        add((e - c + 1) * T, T, `translate3d(${x0 + c * T}px,${y0 + r * T}px,${D}px)`, `${line(0.16)},#f6f0e2`);
        c = e + 1;
      }
    });
    // Top faces, wherever nothing sits above.
    rows.forEach((row, r) => {
      let c = 0;
      while (c < cols) {
        if (!row[c] || at(r - 1, c)) { c += 1; continue; }
        let e = c;
        while (e + 1 < cols && row[e + 1] && !at(r - 1, e + 1)) e += 1;
        add((e - c + 1) * T, D, `translate3d(${x0 + c * T}px,${y0 + r * T}px,0) rotateX(90deg)`, `${line(0.14)},#e8555b`);
        c = e + 1;
      }
    });
    // Left faces, wherever nothing sits to the left.
    for (let c = 0; c < cols; c += 1) {
      let r = 0;
      while (r < rows.length) {
        if (!at(r, c) || at(r, c - 1)) { r += 1; continue; }
        let e = r;
        while (e + 1 < rows.length && at(e + 1, c) && !at(e + 1, c - 1)) e += 1;
        add(D, (e - r + 1) * T, `translate3d(${x0 + c * T}px,${y0 + r * T}px,0) rotateY(-90deg)`, `${line(0.18)},#8d0b13`);
        r = e + 1;
      }
    }
  }

  // Camera: the city turns a little as you scroll, and everything leans toward the pointer.
  let az = 45;
  let azT = 45;
  let tx = 0;
  let ty = 0;
  let txT = 0;
  let tyT = 0;
  let camRaf = 0;
  const applyCam = () => {
    world.style.setProperty('--az', `${az.toFixed(2)}deg`);
    title3d.style.transform = `rotateX(${(-20 + ty).toFixed(2)}deg) rotateY(${(18 + tx).toFixed(2)}deg)`;
  };
  function camStep() {
    camRaf = 0;
    az += (azT - az) * 0.12;
    tx += (txT - tx) * 0.12;
    ty += (tyT - ty) * 0.12;
    applyCam();
    if (Math.abs(azT - az) > 0.02 || Math.abs(txT - tx) > 0.02 || Math.abs(tyT - ty) > 0.02) camRaf = requestAnimationFrame(camStep);
  }
  const camQueue = () => { if (!camRaf) camRaf = requestAnimationFrame(camStep); };
  const camTarget = () => {
    if (isCalm()) { azT = 45; txT = 0; tyT = 0; } else {
      azT = 45 - Math.min(1, scrollY / Math.max(1, hero.offsetHeight)) * 14;
    }
    camQueue();
  };
  addEventListener('pointermove', (e) => {
    if (isCalm() || e.pointerType === 'touch' || scrollY > hero.offsetHeight) return;
    txT = (e.clientX / innerWidth - 0.5) * 10;
    tyT = (0.5 - e.clientY / innerHeight) * 7;
    camQueue();
  }, { passive: true });

  // ------- rain, in fat pixels. Only runs while the city is on screen.
  const rain = make('canvas', 'vx-rain fx');
  scene.append(rain);
  const rctx = rain.getContext('2d');
  const SCALE = 3;
  let RW = 0;
  let RH = 0;
  let drops = [];
  function sizeRain() {
    RW = Math.ceil(scene.offsetWidth / SCALE);
    RH = Math.ceil(scene.offsetHeight / SCALE);
    rain.width = RW;
    rain.height = RH;
    const n = Math.min(240, Math.round((RW * RH) / 340));
    drops = Array.from({ length: n }, () => ({ x: Math.random() * RW, y: Math.random() * RH, l: 2 + Math.floor(Math.random() * 4), v: 2 + Math.random() * 2, c: Math.random() < 0.07 ? '#ff7ab5' : '#a8c8ee' }));
  }
  let rainRaf = 0;
  let inView = true;
  let lastRain = 0;
  function rainFrame(t) {
    rainRaf = requestAnimationFrame(rainFrame);
    if (t - lastRain < 33) return; // 30 fps suits the pixel look
    lastRain = t;
    rctx.clearRect(0, 0, RW, RH);
    for (const d of drops) {
      d.y += d.v;
      if (d.y > RH) {
        d.y = -d.l;
        d.x = Math.random() * RW;
      }
      rctx.globalAlpha = d.v > 3 ? 0.55 : 0.32;
      rctx.fillStyle = d.c;
      rctx.fillRect(Math.floor(d.x), Math.floor(d.y), 1, d.l);
    }
    rctx.globalAlpha = 0.7;
    rctx.fillStyle = '#c8dcff';
    for (let i = 0; i < 12; i += 1) rctx.fillRect(Math.floor(Math.random() * RW), Math.floor(RH * 0.35 + Math.random() * RH * 0.5), 1, 1);
    rctx.globalAlpha = 1;
  }
  const syncRain = () => {
    cancelAnimationFrame(rainRaf);
    rainRaf = 0;
    if (isCalm() || !inView || document.hidden) return;
    rainRaf = requestAnimationFrame(rainFrame);
  };
  new IntersectionObserver((es) => { inView = es[0].isIntersecting; syncRain(); }).observe(scene);
  document.addEventListener('visibilitychange', syncRain);

  // ------- the string
  const NS = 'http://www.w3.org/2000/svg';
  const page = document.querySelector('.page');
  const svg = document.createElementNS(NS, 'svg');
  svg.setAttribute('class', 'vx-string');
  svg.setAttribute('aria-hidden', 'true');
  svg.innerHTML = '<defs><g id="vx-pin"><polygon points="-9,-5 0,-10 9,-5 0,0" fill="#ff5a5f"/><polygon points="-9,-5 0,0 0,10 -9,5" fill="#e3202a"/><polygon points="9,-5 0,0 0,10 9,5" fill="#8d0b13"/></g></defs><g class="vx-lines"></g><g class="vx-pins"></g>';
  page.prepend(svg);
  const gLines = svg.querySelector('.vx-lines');
  const gPins = svg.querySelector('.vx-pins');
  let segs = [];
  let pins = [];
  const tags = [];

  const $ = (q) => document.querySelector(q);
  const notes = [...document.querySelectorAll('.core-item')];

  // [element, x, y] says where on an element a pin sits, as fractions of its box. tag is the note written on that stretch of string.
  function route() {
    const P = (q, x, y) => [typeof q === 'string' ? $(q) : q, x, y];
    const small = phone();
    const list = [];
    const link = (a, b, tag) => list.push({ a, b, tag });
    link(P('.hero-tagline', small ? 0.5 : 0.08, 1), P('.shot-1', small ? 0.5 : 0.3, 0));
    if (small) {
      link(P('.shot-1', 0.2, 1), P('.shot-2', 0.75, 0));
      link(P('.shot-2', 0.75, 1), P('.shot-3', 0.2, 0));
      link(P('.shot-3', 0.2, 1), P('.shot-4', 0.75, 0));
      link(P('.shot-4', 0.75, 1), P('.toc', 0.9, 0));
      link(P('.toc', 0.1, 1), P('.feel-body', 0.5, 0));
      link(P('.feel-body', 0.8, 1), P('.origins', 0.2, 0));
      link(P('.origins', 0.2, 1), P(notes[0], 0.8, 0));
      for (let i = 0; i < notes.length - 1; i += 1) link(P(notes[i], i % 2 ? 0.8 : 0.2, 1), P(notes[i + 1], i % 2 ? 0.2 : 0.8, 0));
      link(P(notes[notes.length - 1], 0.2, 1), P('.steps', 0.8, 0));
      link(P('.steps', 0.2, 1), P('.specs', 0.8, 0));
      link(P('.specs', 0.2, 1), P('.do', 0.8, 0));
      link(P('.do', 0.2, 1), P('.avoid', 0.8, 0));
      link(P('.avoid', 0.2, 1), P('.learn', 0.8, 0));
      link(P('.learn', 0.92, 1), P('.swatches', 0.92, 0));
      link(P('.palette-actions', 0.92, 1), P('.loops', 0.92, 0));
      link(P('.tracks', 0.92, 1), P('.ref-gallery', 0.92, 0));
      link(P('.ref-lists', 0.92, 1), P('#sources .sec-title', 0.92, 0));
    } else {
      link(P('.shot-1', 0.92, 0), P('.shot-2', 0.5, 0));
      link(P('.shot-2', 0.5, 1), P('.shot-4', 0.72, 0));
      link(P('.shot-4', 0.12, 0), P('.shot-3', 0.5, 0));
      link(P('.shot-3', 0.5, 1), P('.toc', 0.04, 0.5));
      link(P('.toc', 0.96, 1), P('.origins', 0.85, 0), 'so where did it start?');
      link(P('.origins', 0.1, 0), P('.feel-body', 0.88, 0));
      link(P('.origins', 0.8, 1), P(notes[2], 0.5, 0), 'so what is it made of?');
      link(P(notes[2], 0.5, 0), P(notes[1], 0.5, 0));
      link(P(notes[1], 0.5, 0), P(notes[0], 0.5, 0));
      const threeUp = innerWidth > 1100;
      if (threeUp) {
        link(P(notes[0], 0.15, 1), P(notes[3], 0.15, 0));
        link(P(notes[3], 0.5, 0), P(notes[4], 0.5, 0));
        link(P(notes[4], 0.5, 0), P(notes[5], 0.5, 0));
        link(P(notes[5], 0.7, 1), P('.specs', 0.8, 0), 'who could build one?');
      } else {
        link(P(notes[0], 0.15, 1), P(notes[2], 0.15, 0));
        link(P(notes[3], 0.15, 1), P(notes[5], 0.85, 0));
        link(P(notes[5], 0.7, 1), P('.specs', 0.8, 0), 'who could build one?');
      }
      link(P('.specs', 0.2, 1), P('.do', 0.5, 0));
      link(P('.do', 0.5, 1), P('.avoid', 0.5, 0));
      link(P('.steps', 0.12, 1), P('.learn', 0.3, 0));
      link(P('.learn', 0.5, 1), P('.swatches', 0.06, 0), 'what colour was the getaway car?');
      link(P('.palette-actions', 0.94, 1), P('.loops', 0.86, 0), 'did the neighbours hear anything?');
      link(P('.tracks', 0.1, 1), P('.ref-gallery', 0.08, 0), 'who else was seen there?');
      // The string stops at the sources: a straight line on to Related styles would cut through the list.
      link(P('.ref-lists', 0.9, 1), P('#sources .sec-title', 0.86, 0), 'any other leads?');
    }
    return list.filter((s) => s.a[0] && s.b[0]);
  }

  function clearString() {
    gLines.textContent = '';
    gPins.textContent = '';
    tags.splice(0).forEach((t) => t.remove());
    segs = [];
    pins = [];
  }
  const ids = new WeakMap();
  let nextId = 0;
  function pinKey(p) {
    if (!ids.has(p[0])) { nextId += 1; ids.set(p[0], nextId); }
    return `${ids.get(p[0])}|${p[1]}|${p[2]}`;
  }
  function buildString() {
    clearString();
    const seen = new Map();
    const usePin = (p) => {
      const k = pinKey(p);
      if (seen.has(k)) return seen.get(k);
      const node = document.createElementNS(NS, 'use');
      node.setAttribute('href', '#vx-pin');
      gPins.append(node);
      const pin = { el: p[0], fx: p[1], fy: p[2], node, x: 0, y: 0 };
      seen.set(k, pin);
      pins.push(pin);
      return pin;
    };
    for (const r of route()) {
      const a = usePin(r.a);
      const b = usePin(r.b);
      const sd = document.createElementNS(NS, 'path');
      sd.setAttribute('class', 'sd');
      sd.setAttribute('pathLength', '1');
      const st = document.createElementNS(NS, 'path');
      st.setAttribute('class', 'st');
      st.setAttribute('pathLength', '1');
      sd.style.strokeDasharray = '1';
      st.style.strokeDasharray = '1';
      gLines.append(sd, st);
      const seg = { a, b, sd, st, s: 0, v: 0, target: 0, p: isCalm() ? 1 : 0, shown: -1, d: '' };
      if (r.tag) {
        const t = make('div', 'vx-tag');
        t.textContent = r.tag;
        t.setAttribute('aria-hidden', 'true');
        page.append(t);
        tags.push(t);
        seg.tag = t;
      }
      segs.push(seg);
    }
    measure();
  }
  function measure() {
    const o = svg.getBoundingClientRect();
    for (const p of pins) {
      const b = p.el.getBoundingClientRect();
      p.x = Math.round(b.left - o.left + b.width * p.fx);
      p.y = Math.round(b.top - o.top + b.height * p.fy);
      p.node.setAttribute('transform', `translate(${p.x} ${p.y})`);
    }
    for (const s of segs) {
      const dist = Math.hypot(s.b.x - s.a.x, s.b.y - s.a.y);
      s.target = Math.min(dist * 0.07, 22);
      if (!s.s) s.s = s.target;
      draw(s);
    }
    setProgress();
  }
  function draw(s) {
    const mx = (s.a.x + s.b.x) / 2;
    const my = (s.a.y + s.b.y) / 2 + s.s * 2;
    const d = `M${s.a.x} ${s.a.y}Q${mx.toFixed(1)} ${my.toFixed(1)} ${s.b.x} ${s.b.y}`;
    s.st.setAttribute('d', d);
    s.sd.setAttribute('d', d);
    if (s.tag) {
      s.tag.style.left = `${mx}px`;
      s.tag.style.top = `${(s.a.y + s.b.y) / 2 + s.s}px`;
    }
  }
  function paintProgress(s) {
    if (Math.abs(s.p - s.shown) < 0.002) return;
    s.shown = s.p;
    const off = (1 - s.p).toFixed(3);
    s.st.style.strokeDashoffset = off;
    s.sd.style.strokeDashoffset = off;
    if (s.tag) s.tag.style.opacity = s.p > 0.5 ? 1 : 0;
  }
  let reach = 0;
  function setProgress() {
    const o = svg.getBoundingClientRect();
    reach = innerHeight * 0.86 - o.top;
    let moving = false;
    for (const s of segs) {
      const top = Math.min(s.a.y, s.b.y);
      const bot = Math.max(s.a.y, s.b.y);
      const target = isCalm() ? 1 : Math.max(0, Math.min(1, (reach - top) / Math.max(40, bot - top)));
      if (isCalm()) {
        s.p = 1;
      } else if (Math.abs(target - s.p) > 0.002) {
        s.p += (target - s.p) * 0.2;
        if (Math.abs(target - s.p) > 0.002) moving = true;
        else s.p = target;
      }
      paintProgress(s);
    }
    return moving;
  }
  function stepPhysics() {
    let moving = false;
    if (isCalm()) return false;
    for (const s of segs) {
      const a = (s.target - s.s) * 0.07;
      s.v = (s.v + a) * 0.87;
      if (Math.abs(s.v) > 0.02 || Math.abs(s.target - s.s) > 0.05) {
        s.s += s.v;
        draw(s);
        moving = true;
      }
    }
    return moving;
  }
  let raf = 0;
  function tick() {
    raf = 0;
    const a = setProgress();
    const b = stepPhysics();
    if (a || b) raf = requestAnimationFrame(tick);
  }
  const wake = () => { if (!raf) raf = requestAnimationFrame(tick); };
  let lastY = scrollY;
  addEventListener('scroll', () => {
    const dv = scrollY - lastY;
    lastY = scrollY;
    if (!isCalm()) {
      const push = Math.max(-1.6, Math.min(1.6, dv * 0.03));
      for (const s of segs) s.v += push;
    }
    wake();
    camTarget();
  }, { passive: true });

  // ------- drag the notes. Headings are the handles, so the text can still be selected and copied.
  let hint = null;
  function setupDrag() {
    const fine = matchMedia('(hover: hover) and (pointer: fine)').matches;
    const can = fine && !phone();
    root.classList.toggle('vx-drag', can);
    if (hint) { hint.remove(); hint = null; }
    if (!can) {
      notes.forEach((n) => { n.style.transform = ''; delete n.dataset.dx; delete n.dataset.dy; });
      return;
    }
    hint = make('p', 'vx-hint');
    hint.innerHTML = 'Drag a note by its heading. The string comes with it.<button type="button">Put them back</button>';
    hint.querySelector('button').addEventListener('click', () => {
      notes.forEach((n) => { n.style.transform = ''; n.dataset.dx = 0; n.dataset.dy = 0; });
      measure();
      kick(notes);
    });
    $('.core-list').after(hint);
  }
  function kick(list) {
    if (isCalm()) return;
    for (const s of segs) if (list.includes(s.a.el) || list.includes(s.b.el)) s.v += 2.5;
    wake();
  }
  let drag = null;
  document.addEventListener('pointerdown', (e) => {
    if (!root.classList.contains('vx-drag') || e.button !== 0) return;
    const h = e.target.closest('.core-item h3');
    if (!h) return;
    const note = h.closest('.core-item');
    e.preventDefault();
    const box = $('.core-list').getBoundingClientRect();
    const b = note.getBoundingClientRect();
    drag = { note, x: e.clientX, y: e.clientY, dx: +note.dataset.dx || 0, dy: +note.dataset.dy || 0, box, b };
    note.classList.add('is-dragging');
    note.setPointerCapture?.(e.pointerId);
  });
  document.addEventListener('pointermove', (e) => {
    if (!drag) return;
    const { note, x, y, dx, dy, box, b } = drag;
    const minX = box.left - (b.left - dx) - 24;
    const maxX = box.right - (b.right - dx) + 24;
    const minY = box.top - (b.top - dy) - 24;
    const maxY = box.bottom - (b.bottom - dy) + 40;
    const nx = Math.max(minX, Math.min(maxX, Math.round((dx + e.clientX - x) / 8) * 8));
    const ny = Math.max(minY, Math.min(maxY, Math.round((dy + e.clientY - y) / 8) * 8));
    if (nx === +note.dataset.dx && ny === +note.dataset.dy) return;
    note.dataset.dx = nx;
    note.dataset.dy = ny;
    note.style.transform = nx || ny ? `translate(${nx}px,${ny}px)` : '';
    measure();
    kick([note]);
  });
  const endDrag = () => {
    if (!drag) return;
    drag.note.classList.remove('is-dragging');
    drag = null;
  };
  document.addEventListener('pointerup', endDrag);
  document.addEventListener('pointercancel', endDrag);

  // ------- layout changes
  function buildAll() {
    buildCity();
    buildTitle();
    sizeRain();
    applyCam();
    setupDrag();
    buildString();
    syncRain();
    wake();
  }
  let wasPhone = phone();
  let lastW = innerWidth;
  let t = 0;
  addEventListener('resize', () => {
    clearTimeout(t);
    t = setTimeout(() => {
      if (innerWidth !== lastW || phone() !== wasPhone) {
        lastW = innerWidth;
        wasPhone = phone();
        buildAll();
      } else {
        measure();
      }
    }, 160);
  });
  addEventListener('load', () => { measure(); wake(); });
  if (document.fonts?.ready) document.fonts.ready.then(() => { measure(); wake(); });
  if ('ResizeObserver' in window) new ResizeObserver(() => { measure(); wake(); }).observe(page);
  addEventListener('eas:calm', () => {
    syncRain();
    camTarget();
    for (const s of segs) s.s = s.target;
    measure();
    wake();
  });

  buildAll();
  camTarget();
})();
