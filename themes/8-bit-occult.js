// 8-bit Occult Horror: name-entry sigils, mirrored playfield walls, a typed tagline, letters that rot for a moment, and Haunted House's eyes.
(() => {
  const root = document.documentElement;
  const calm = () => root.dataset.calm === '1';
  const $ = (q, el = document) => el.querySelector(q);
  const $$ = (q, el = document) => [...el.querySelectorAll(q)];
  const RED = '#ff0300';
  root.classList.add('oc-on');

  // ---------- pixel drawing helpers ----------
  function line(x0, y0, x1, y1, out) {
    const dx = Math.abs(x1 - x0), sx = x0 < x1 ? 1 : -1, dy = -Math.abs(y1 - y0), sy = y0 < y1 ? 1 : -1;
    let err = dx + dy;
    for (;;) {
      out.push([x0, y0]);
      if (x0 === x1 && y0 === y1) break;
      const e2 = 2 * err;
      if (e2 >= dy) { err += dy; x0 += sx; }
      if (e2 <= dx) { err += dx; y0 += sy; }
    }
  }
  function circle(cx, cy, r, out) {
    // midpoint circle, points sorted by angle so it draws as one stroke
    const pts = [];
    let x = r, y = 0, d = 1 - r;
    while (x >= y) {
      for (const [a, b] of [[x, y], [y, x], [-y, x], [-x, y], [-x, -y], [-y, -x], [y, -x], [x, -y]]) pts.push([cx + a, cy + b]);
      y++;
      if (d < 0) d += 2 * y + 1; else { x--; d += 2 * (y - x) + 1; }
    }
    pts.sort((p, q) => Math.atan2(p[1] - cy, p[0] - cx) - Math.atan2(q[1] - cy, q[0] - cx));
    out.push(...pts);
  }

  // A name sigil: letters sit on a 6 x 5 grid (A to Z), the line visits them in order, a circle marks the start and a bar the end.
  const COLS = 6, ROWS = 5;
  const clean = (s) => s.toUpperCase().replace(/[^A-Z]/g, '').replace(/(.)\1+/g, '$1');
  function sigilPath(name, w, h) {
    const letters = clean(name);
    const cw = w / COLS, ch = h / ROWS;
    const at = (c) => { const i = c.charCodeAt(0) - 65; return [Math.round((i % COLS + 0.5) * cw), Math.round((Math.floor(i / COLS) + 0.5) * ch)]; };
    const pts = [...letters].map(at);
    const out = [];
    if (!pts.length) return { out, letters };
    const r = Math.max(2, Math.round(Math.min(cw, ch) * 0.22));
    circle(pts[0][0], pts[0][1], r, out);
    for (let i = 1; i < pts.length; i++) line(pts[i - 1][0], pts[i - 1][1], pts[i][0], pts[i][1], out);
    // the closing bar is perpendicular to the last stroke
    const [ex, ey] = pts[pts.length - 1];
    const [px, py] = pts.length > 1 ? pts[pts.length - 2] : [ex - 1, ey];
    let nx = -(ey - py), ny = ex - px;
    const len = Math.hypot(nx, ny) || 1;
    const b = Math.max(3, Math.round(Math.min(cw, ch) * 0.34));
    nx = Math.round((nx / len) * b); ny = Math.round((ny / len) * b);
    line(ex - nx, ey - ny, ex + nx, ey + ny, out);
    return { out, letters };
  }
  function drawSigil(canvas, name, { speed = 0, colour = RED, onStep } = {}) {
    const ctx = canvas.getContext('2d');
    const { out, letters } = sigilPath(name, canvas.width, canvas.height);
    cancelAnimationFrame(canvas._raf);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = colour;
    if (!speed || calm()) {
      for (const [x, y] of out) ctx.fillRect(x, y, 1, 1);
      onStep?.(letters.length);
      return;
    }
    let i = 0;
    const tick = () => {
      const end = Math.min(out.length, i + speed);
      for (; i < end; i++) ctx.fillRect(out[i][0], out[i][1], 1, 1);
      onStep?.(letters.length);
      if (i < out.length) canvas._raf = requestAnimationFrame(tick);
    };
    tick();
  }

  // ---------- the name-entry grid in the hero ----------
  const hero = $('.hero');
  const panel = document.createElement('section');
  panel.className = 'oc-sigil';
  panel.setAttribute('aria-label', 'Sigil maker');
  const keys = [...'ABCDEFGHIJKLMNOPQRSTUVWXYZ'];
  panel.innerHTML = `
    <p class="oc-sg-head">Enter a name <b>&#10013;</b></p>
    <div class="oc-sg-grid" aria-hidden="true">
      ${keys.map((k) => `<button type="button" tabindex="-1" data-k="${k}">${k}</button>`).join('')}
      <button type="button" tabindex="-1" class="oc-k" data-k="del">DEL</button>
      <button type="button" tabindex="-1" class="oc-k" data-k="clr">CLR</button>
      <button type="button" tabindex="-1" class="oc-k" data-k="end">END</button>
      <span></span>
      <canvas class="oc-sg-canvas"></canvas>
    </div>
    <div class="oc-sg-name"><label for="oc-name">Name</label><input id="oc-name" type="text" maxlength="12" value="OCCULT" autocomplete="off" spellcheck="false"></div>
    <p class="oc-sg-note">Each letter is a cell. The line visits them in order, from the circle to the bar. Repeated letters are dropped.</p>`;
  hero.append(panel);
  const grid = $('.oc-sg-grid', panel);
  const cv = $('canvas', panel);
  const input = $('input', panel);
  const cells = new Map($$('[data-k]', grid).map((b) => [b.dataset.k, b]));
  // The canvas covers only the 26 letter cells (the first five rows), at one sigil pixel per 4 screen pixels.
  function sizeCanvas() {
    const first = cells.get('A').getBoundingClientRect();
    const last = cells.get('Z').getBoundingClientRect();
    const g = grid.getBoundingClientRect();
    const w = g.width, h = last.bottom - first.top;
    cv.style.width = `${w}px`;
    cv.style.height = `${h}px`;
    cv.width = Math.max(24, Math.round(w / 4));
    cv.height = Math.max(20, Math.round(h / 4));
  }
  function paintCells(letters) {
    for (const [k, b] of cells) b.classList.toggle('on', k.length === 1 && letters.includes(k));
  }
  function redraw(speed) {
    sizeCanvas();
    const name = input.value;
    drawSigil(cv, name, { speed, onStep: () => paintCells(clean(name)) });
  }
  input.addEventListener('input', () => {
    const v = input.value.toUpperCase().replace(/[^A-Z ]/g, '');
    if (v !== input.value) input.value = v;
    redraw(6);
  });
  grid.addEventListener('click', (e) => {
    const b = e.target.closest('[data-k]');
    if (!b) return;
    const k = b.dataset.k;
    if (k === 'del') input.value = input.value.slice(0, -1);
    else if (k === 'clr') input.value = '';
    else if (k === 'end') { redraw(1); return; }
    else if (input.value.length < 12) input.value += k;
    redraw(6);
  });

  // ---------- small sigils for the core elements ----------
  const minis = [];
  for (const item of $$('.core-item')) {
    const c = document.createElement('canvas');
    c.className = 'oc-mini';
    c.width = 26; c.height = 26;
    c.setAttribute('aria-hidden', 'true');
    item.append(c);
    minis.push([c, $('h3', item).textContent]);
  }
  const drawMinis = (speed) => minis.forEach(([c, t]) => drawSigil(c, t, { speed, colour: '#9d97ff' }));

  // ---------- the tagline types itself ----------
  const tag = $('.hero-tagline');
  const full = tag.textContent;
  tag.innerHTML = '<span class="oc-vh" style="position:absolute;width:1px;height:1px;overflow:hidden;clip-path:inset(50%)"></span><span class="oc-typed" aria-hidden="true"></span><span class="oc-caret" aria-hidden="true"></span><span class="oc-rest" aria-hidden="true"></span>';
  $('.oc-vh', tag).textContent = full;
  const typed = $('.oc-typed', tag), rest = $('.oc-rest', tag);
  let typeTimer;
  function type(n = 0) {
    clearTimeout(typeTimer);
    if (calm()) n = full.length;
    typed.textContent = full.slice(0, n);
    rest.textContent = full.slice(n);
    if (n < full.length) typeTimer = setTimeout(() => type(n + 1), full[n] === ' ' ? 30 : 34 + Math.random() * 40);
  }

  // ---------- mirrored playfield walls, coloured room by room ----------
  const BH = 16;
  const walls = ['l', 'r'].map((s) => { const d = document.createElement('div'); d.className = `oc-wall oc-wall-${s}`; d.setAttribute('aria-hidden', 'true'); document.body.prepend(d); return d; });
  let wallW = 0;
  function rnd(seed) { let s = seed; return () => ((s = (s * 1103515245 + 12345) >>> 0) / 4294967296); }
  function pattern(cols, bw) {
    const rows = 160;
    const r = rnd(1982);
    const g = Array.from({ length: rows }, () => new Array(cols).fill(0));
    let y = 0;
    while (y < rows) {
      const base = r() < 0.75 ? 1 : 2;
      const span = 2 + Math.floor(r() * 4);
      for (let i = 0; i < span && y + i < rows; i++) for (let c = 0; c < base; c++) g[y + i][c] = 1;
      y += span;
      if (y >= rows) break;
      const kind = r();
      if (kind < 0.5) { // an arm reaching in
        const depth = 2 + Math.floor(r() * (cols - 2));
        const hgt = 1 + Math.floor(r() * 2);
        for (let i = 0; i < hgt && y + i < rows; i++) for (let c = 0; c < depth; c++) g[y + i][c] = 1;
        y += hgt;
      } else if (kind < 0.86) { // a doorway: the outer wall opens
        y += 2;
      } else { // a cross-shaped island, like Haunted House's rooms
        const cx = 2 + Math.floor(r() * Math.max(1, cols - 4));
        for (let i = 0; i < 5 && y + i < rows; i++) { g[y + i][cx] = 1; if (cx + 1 < cols) g[y + i][cx + 1] = 1; }
        if (y + 2 < rows) for (let c = Math.max(1, cx - 1); c < Math.min(cols, cx + 3); c++) g[y + 2][c] = 1;
        for (let i = 0; i < 5 && y + i < rows; i++) g[y + i][0] = 1;
        y += 5;
      }
    }
    const c = document.createElement('canvas');
    c.width = cols * bw; c.height = rows * BH;
    const x = c.getContext('2d');
    x.fillStyle = '#000';
    g.forEach((row, yy) => row.forEach((v, xx) => { if (v) x.fillRect(xx * bw, yy * BH, bw, BH); }));
    return c.toDataURL();
  }
  const roomColour = { feel: '#ff0300', core: '#2e24ad', how: '#229000', palette: '#f6bd39', vibe: '#49058e', refs: '#941c00', related: '#8a8a8a' };
  function layoutWalls() {
    const page = $('.page').getBoundingClientRect();
    const space = Math.floor(page.left) + 8;
    const cols = Math.min(10, Math.floor(space / 16));
    if (cols < 3) { walls.forEach((w) => { w.style.display = 'none'; }); wallW = 0; return; }
    const bw = 16;
    wallW = cols * bw;
    const url = `url(${pattern(cols, bw)})`;
    walls.forEach((w) => { w.style.height = '0'; }); // so scrollHeight measures the page, not the walls
    const H = document.documentElement.scrollHeight;
    // colour bands, snapped to whole block rows so no block is split between two rooms
    const snap = (v) => Math.round(v / BH) * BH;
    const stops = [];
    let prev = 0, col = '#ff0300';
    for (const sec of $$('.sec')) {
      const top = snap(sec.getBoundingClientRect().top + scrollY);
      stops.push(`${col} ${prev}px ${top}px`);
      col = roomColour[sec.id] || '#ff0300';
      prev = top;
    }
    const foot = $('.foot');
    const ft = snap(foot.getBoundingClientRect().top + scrollY);
    stops.push(`${col} ${prev}px ${ft}px`, `#ff0300 ${ft}px ${H}px`);
    for (const w of walls) {
      w.style.display = '';
      w.style.width = `${wallW}px`;
      w.style.height = `${H}px`;
      w.style.background = `linear-gradient(${stops.join(',')})`;
      w.style.webkitMaskImage = url; w.style.maskImage = url;
      w.style.webkitMaskSize = `${wallW}px auto`; w.style.maskSize = `${wallW}px auto`;
    }
  }

  // ---------- Haunted House's eyes wander down the left wall ----------
  const decor = $('.decor');
  const eyes = document.createElement('div');
  eyes.className = 'oc-eyes';
  if (decor) decor.append(eyes);
  function placeEyes() {
    if (!wallW) { eyes.style.display = 'none'; return; }
    eyes.style.display = '';
    const max = document.documentElement.scrollHeight - innerHeight;
    const p = max > 0 ? scrollY / max : 0;
    const top = 70 + p * (innerHeight - 120);
    eyes.style.transform = `translate(${Math.round(wallW / 2 - 11)}px, ${Math.round(top / 4) * 4}px)`;
  }
  let blinkTimer;
  function blink() {
    clearTimeout(blinkTimer);
    if (calm()) return;
    blinkTimer = setTimeout(() => { eyes.classList.add('shut'); setTimeout(() => { eyes.classList.remove('shut'); blink(); }, 160); }, 2500 + Math.random() * 4000);
  }

  // ---------- letters rot for a moment and come back ----------
  const GLYPHS = '#%&?$@§¥ØÞ¿';
  const rotTargets = $$('.sec-title, .core-item h3, .hero-sub');
  rotTargets.forEach((el) => { el.dataset.ocText = el.textContent; });
  let rotTimer;
  function rot() {
    clearTimeout(rotTimer);
    if (calm()) return;
    rotTimer = setTimeout(() => {
      const vis = rotTargets.filter((el) => { const r = el.getBoundingClientRect(); return r.bottom > 0 && r.top < innerHeight; });
      const el = vis[Math.floor(Math.random() * vis.length)];
      if (el && el.firstChild?.nodeType === 3) {
        const t = el.dataset.ocText;
        const idx = [...t].map((ch, i) => (/[A-Za-z]/.test(ch) ? i : -1)).filter((i) => i >= 0);
        const i = idx[Math.floor(Math.random() * idx.length)];
        if (!el.hasAttribute('aria-label')) el.setAttribute('aria-label', t);
        el.firstChild.nodeValue = t.slice(0, i) + GLYPHS[Math.floor(Math.random() * GLYPHS.length)] + t.slice(i + 1);
        setTimeout(() => { el.firstChild.nodeValue = t; }, 380 + Math.random() * 400);
      }
      rot();
    }, 2200 + Math.random() * 2600);
  }

  // ---------- start ----------
  let started = false;
  function start() {
    if (started) return;
    started = true;
    redraw(calm() ? 0 : 2);
    drawMinis(calm() ? 0 : 1);
    layoutWalls();
    placeEyes();
    blink();
    rot();
  }
  addEventListener('scroll', placeEyes, { passive: true });
  let rz;
  addEventListener('resize', () => { clearTimeout(rz); rz = setTimeout(() => { redraw(0); layoutWalls(); placeEyes(); }, 150); });
  if ('ResizeObserver' in window) {
    let ro;
    new ResizeObserver(() => { clearTimeout(ro); ro = setTimeout(() => { layoutWalls(); placeEyes(); }, 200); }).observe($('.page'));
  }
  addEventListener('eas:calm', () => {
    if (calm()) { type(full.length); rotTargets.forEach((el) => { if (el.firstChild?.nodeType === 3) el.firstChild.nodeValue = el.dataset.ocText; }); }
    redraw(0); drawMinis(0); blink(); rot();
  });
  type(0);
  (document.fonts?.ready || Promise.resolve()).then(start);
  setTimeout(start, 900);
  addEventListener('load', () => { layoutWalls(); placeEyes(); });
})();
