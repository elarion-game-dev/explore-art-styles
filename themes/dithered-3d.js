// Dithered 3D: a small software renderer that draws a lit 3D scene and dithers it live.
// Pattern, colour count, pixel size and palette are set from the panel under the viewport,
// and the palette also recolours the whole page. The object changes with the section you are reading.
(() => {
  const root = document.documentElement;
  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => [...el.querySelectorAll(s)];
  const calm = () => root.dataset.calm === '1';
  const store = {
    get: (k) => { try { return localStorage.getItem(k); } catch { return null; } },
    set: (k, v) => { try { localStorage.setItem(k, v); } catch { /* private window */ } },
  };

  // ---- Palettes, sampled from the four main images ----
  const PAL = {
    obra: { name: 'Obra Dinn', ramp: ['#333319', '#e5fffb'] },
    buckshot: { name: 'Buckshot', ramp: ['#1a0e0c', '#694d47', '#6e6850', '#c8a37c'] },
    mouth: { name: 'Mouthwashing', ramp: ['#2a0302', '#8c1211', '#fbd73b'] },
    spectrum: { name: 'ZX Spectrum', ramp: ['#000000', '#c8c800'] },
  };
  const KEYS = Object.keys(PAL);
  const hex = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
  const sampleRamp = (ramp, t) => {
    const c = ramp.map(hex);
    const x = Math.min(0.9999, Math.max(0, t)) * (c.length - 1);
    const i = Math.floor(x);
    const f = x - i;
    const a = c[i];
    const b = c[Math.min(c.length - 1, i + 1)];
    return a.map((v, k) => Math.round(v + (b[k] - v) * f));
  };

  // ---- Threshold maps ----
  const bayer = (x, y, n) => {
    let v = 0;
    const xc = x ^ y;
    for (let bit = 0; bit < n; bit++) v |= (((y >> bit) & 1) << (2 * (n - 1 - bit))) | (((xc >> bit) & 1) << (2 * (n - 1 - bit) + 1));
    return v;
  };
  const PATTERNS = {
    off: { name: 'No dither', size: 1, t: () => 0.5 },
    b2: { name: 'Bayer 2x2', size: 2 },
    b4: { name: 'Bayer 4x4', size: 4 },
    b8: { name: 'Bayer 8x8', size: 8 },
    noise: { name: 'Noise', size: 64 },
  };
  for (const [k, p] of Object.entries(PATTERNS)) {
    const m = p.size;
    p.map = new Float32Array(m * m);
    for (let y = 0; y < m; y++) {
      for (let x = 0; x < m; x++) {
        let t = 0.5;
        if (k[0] === 'b') t = (bayer(x, y, Math.log2(m)) + 0.5) / (m * m);
        if (k === 'noise') { const s = Math.sin(x * 12.9898 + y * 78.233) * 43758.5453; t = s - Math.floor(s); }
        p.map[y * m + x] = t;
      }
    }
  }

  // ---- Meshes ----
  const mesh = (v, f) => ({ v: new Float32Array(v), f: new Uint16Array(f) });
  function torusKnot(p, q, seg, sides, r, s) {
    const C = (t) => { const k = 2 + Math.cos(q * t); return [k * Math.cos(p * t) * s, Math.sin(q * t) * s, k * Math.sin(p * t) * s]; };
    const v = [];
    const f = [];
    const norm = (a) => { const l = Math.hypot(...a) || 1; return a.map((x) => x / l); };
    const cross = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
    for (let i = 0; i < seg; i++) {
      const t = (i / seg) * Math.PI * 2;
      const P1 = C(t);
      const P2 = C(t + 0.01);
      const T = P2.map((x, k) => x - P1[k]);
      const Nn = P2.map((x, k) => x + P1[k]);
      const B = norm(cross(T, Nn));
      const N = norm(cross(B, T));
      for (let j = 0; j < sides; j++) {
        const a = (j / sides) * Math.PI * 2;
        const cx = -r * Math.cos(a);
        const cy = r * Math.sin(a);
        v.push(P1[0] + cx * N[0] + cy * B[0], P1[1] + cx * N[1] + cy * B[1], P1[2] + cx * N[2] + cy * B[2]);
      }
    }
    for (let i = 0; i < seg; i++) {
      for (let j = 0; j < sides; j++) {
        const a = i * sides + j;
        const b = ((i + 1) % seg) * sides + j;
        const c = ((i + 1) % seg) * sides + ((j + 1) % sides);
        const d = i * sides + ((j + 1) % sides);
        f.push(a, b, d, b, c, d);
      }
    }
    return mesh(v, f);
  }
  function torus(R, r, seg, sides) {
    const v = [];
    const f = [];
    for (let i = 0; i < seg; i++) {
      const u = (i / seg) * Math.PI * 2;
      for (let j = 0; j < sides; j++) {
        const w = (j / sides) * Math.PI * 2;
        v.push((R + r * Math.cos(w)) * Math.cos(u), r * Math.sin(w), (R + r * Math.cos(w)) * Math.sin(u));
      }
    }
    for (let i = 0; i < seg; i++) {
      for (let j = 0; j < sides; j++) {
        const a = i * sides + j;
        const b = ((i + 1) % seg) * sides + j;
        const c = ((i + 1) % seg) * sides + ((j + 1) % sides);
        const d = i * sides + ((j + 1) % sides);
        f.push(a, b, d, b, c, d);
      }
    }
    return mesh(v, f);
  }
  function sphere(r, seg, rings) {
    const v = [];
    const f = [];
    for (let i = 0; i <= rings; i++) {
      const th = (i / rings) * Math.PI;
      for (let j = 0; j < seg; j++) {
        const ph = (j / seg) * Math.PI * 2;
        v.push(r * Math.sin(th) * Math.cos(ph), r * Math.cos(th), r * Math.sin(th) * Math.sin(ph));
      }
    }
    for (let i = 0; i < rings; i++) {
      for (let j = 0; j < seg; j++) {
        const a = i * seg + j;
        const b = (i + 1) * seg + j;
        const c = (i + 1) * seg + ((j + 1) % seg);
        const d = i * seg + ((j + 1) % seg);
        if (i > 0) f.push(a, b, d);
        if (i < rings - 1) f.push(b, c, d);
      }
    }
    return mesh(v, f);
  }
  function icosahedron(r) {
    const t = (1 + Math.sqrt(5)) / 2;
    const raw = [[-1, t, 0], [1, t, 0], [-1, -t, 0], [1, -t, 0], [0, -1, t], [0, 1, t], [0, -1, -t], [0, 1, -t], [t, 0, -1], [t, 0, 1], [-t, 0, -1], [-t, 0, 1]];
    const k = r / Math.hypot(1, t);
    const f = [0, 11, 5, 0, 5, 1, 0, 1, 7, 0, 7, 10, 0, 10, 11, 1, 5, 9, 5, 11, 4, 11, 10, 2, 10, 7, 6, 7, 1, 8, 3, 9, 4, 3, 4, 2, 3, 2, 6, 3, 6, 8, 3, 8, 9, 4, 9, 5, 2, 4, 11, 6, 2, 10, 8, 6, 7, 9, 8, 1];
    return mesh(raw.flat().map((x) => x * k), f);
  }
  // A stack of square frustums: a plinth, a shaft and a pointed cap
  function obelisk() {
    const v = [];
    const f = [];
    const layers = [[-1.25, 0.62], [-1.0, 0.62], [-1.0, 0.36], [0.85, 0.24], [1.3, 0.0]];
    for (const [y, h] of layers) v.push(-h, y, -h, h, y, -h, h, y, h, -h, y, h);
    for (let l = 0; l < layers.length - 1; l++) {
      for (let s = 0; s < 4; s++) {
        const a = l * 4 + s;
        const b = l * 4 + ((s + 1) % 4);
        f.push(a, b, b + 4, a, b + 4, a + 4);
      }
    }
    f.push(0, 2, 1, 0, 3, 2);
    return mesh(v, f);
  }
  function cube(s) {
    const v = [-s, -s, -s, s, -s, -s, s, s, -s, -s, s, -s, -s, -s, s, s, -s, s, s, s, s, -s, s, s];
    const f = [0, 1, 2, 0, 2, 3, 4, 6, 5, 4, 7, 6, 0, 4, 5, 0, 5, 1, 3, 2, 6, 3, 6, 7, 0, 3, 7, 0, 7, 4, 1, 5, 6, 1, 6, 2];
    return mesh(v, f);
  }
  const MESHES = {
    knot: { name: 'Torus knot', m: torusKnot(2, 3, 84, 7, 0.36, 0.44) },
    ico: { name: 'Icosahedron', m: icosahedron(1.35) },
    obelisk: { name: 'Obelisk', m: obelisk() },
    torus: { name: 'Torus', m: torus(0.95, 0.42, 26, 10) },
    sphere: { name: 'Sphere', m: sphere(1.15, 16, 10) },
    cube: { name: 'Cube', m: cube(0.85) },
  };
  const SECTION_MESH = { top: 'knot', feel: 'knot', core: 'ico', how: 'obelisk', palette: 'torus', vibe: 'sphere', refs: 'cube', related: 'knot' };

  // ---- State ----
  const state = {
    pal: KEYS.includes(store.get('eas-d3-pal')) ? store.get('eas-d3-pal') : 'obra',
    pat: 'b4',
    levels: 2,
    px: 3,
    lines: true,
    spin: true,
    mesh: 'knot',
  };

  // ---- Build the viewport panel ----
  const view = document.createElement('aside');
  view.className = 'd3-view';
  view.setAttribute('aria-label', 'Live dither viewport');
  view.innerHTML = `<div class="d3-screen"><canvas aria-label="A 3D object rendered and dithered live"></canvas>
      <span class="d3-corner d3-c1"></span><span class="d3-corner d3-c2"></span><span class="d3-corner d3-c3"></span><span class="d3-corner d3-c4"></span>
      <span class="d3-hud d3-tl" aria-hidden="true"></span><span class="d3-hud d3-tr" aria-hidden="true"></span><span class="d3-hud d3-bl" aria-live="polite"></span></div>
    <div class="d3-ctrl">
      <span id="d3-l-pat">Pattern</span><div class="d3-seg" role="group" aria-labelledby="d3-l-pat">${Object.entries(PATTERNS).map(([k, p]) => `<button type="button" data-pat="${k}">${k === 'off' ? 'Off' : p.name.replace('Bayer ', '')}</button>`).join('')}</div>
      <label for="d3-lv">Colours</label><div class="d3-range"><input id="d3-lv" type="range" min="2" max="8" step="1"><output for="d3-lv"></output></div>
      <label for="d3-px">Pixel</label><div class="d3-range"><input id="d3-px" type="range" min="2" max="6" step="1"><output for="d3-px"></output></div>
      <span id="d3-l-pal">Palette</span><div class="d3-seg" role="group" aria-labelledby="d3-l-pal">${KEYS.map((k) => `<button type="button" data-pal="${k}">${PAL[k].name}</button>`).join('')}</div>
      <div class="d3-toggles"><button type="button" data-tg="lines">Line pass</button><button type="button" data-tg="spin">Rotate</button></div>
    </div>`;
  $('.hero').after(view);
  const canvas = $('canvas', view);
  const ctx = canvas.getContext('2d');
  const hud = { tl: $('.d3-tl', view), tr: $('.d3-tr', view), bl: $('.d3-bl', view) };

  // ---- The page follows the palette ----
  const applyPal = (k) => {
    state.pal = k;
    if (k === 'obra') delete root.dataset.pal; else root.dataset.pal = k;
    store.set('eas-d3-pal', k);
    paintTitle();
    syncUi();
    request();
  };

  // ---- Hero: each main image can load its game's palette ----
  $$('.hero-gallery .shot').forEach((fig, i) => {
    const k = KEYS[i];
    if (!k) return;
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'd3-use';
    b.dataset.usePal = k;
    const r = PAL[k].ramp;
    b.innerHTML = `<i style="--a:${r[0]};--b:${r[r.length - 1]}"></i>Use palette`;
    b.title = `Recolour the page and viewport with the ${PAL[k].name} palette`;
    b.addEventListener('click', () => applyPal(k));
    $('figcaption', fig).append(b);
  });

  // ---- Title filled with a dithered gradient in the current paper colour ----
  const title = $('.hero-title');
  function paintTitle() {
    const w = Math.max(1, Math.round(title.offsetWidth / 3));
    const h = Math.max(1, Math.round(title.offsetHeight / 3));
    const c = document.createElement('canvas');
    c.width = w;
    c.height = h;
    const g = c.getContext('2d');
    const img = g.createImageData(w, h);
    const [r, gg, b] = hex(PAL[state.pal].ramp[PAL[state.pal].ramp.length - 1]);
    for (let y = 0; y < h; y++) {
      const level = 1 - Math.max(0, (y / h - 0.42) / 0.58) * 0.55;
      for (let x = 0; x < w; x++) {
        if ((bayer(x & 3, y & 3, 2) + 0.5) / 16 < level) {
          const o = (y * w + x) * 4;
          img.data[o] = r; img.data[o + 1] = gg; img.data[o + 2] = b; img.data[o + 3] = 255;
        }
      }
    }
    g.putImageData(img, 0, 0);
    try {
      title.style.backgroundImage = `url(${c.toDataURL()})`;
      title.classList.add('d3-filled');
    } catch { title.classList.remove('d3-filled'); }
  }

  // ---- Controls ----
  const lv = $('#d3-lv', view);
  const px = $('#d3-px', view);
  function syncUi() {
    $$('[data-pat]', view).forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.pat === state.pat)));
    $$('[data-pal]', view).forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.pal === state.pal)));
    $$('[data-use-pal]').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.usePal === state.pal)));
    $$('[data-tg]', view).forEach((b) => b.setAttribute('aria-pressed', String(state[b.dataset.tg])));
    lv.value = state.levels;
    px.value = state.px;
    lv.nextElementSibling.textContent = state.levels;
    px.nextElementSibling.textContent = `${state.px}x`;
  }
  $$('[data-pat]', view).forEach((b) => b.addEventListener('click', () => { state.pat = b.dataset.pat; syncUi(); request(); }));
  $$('[data-pal]', view).forEach((b) => b.addEventListener('click', () => applyPal(b.dataset.pal)));
  $$('[data-tg]', view).forEach((b) => b.addEventListener('click', () => { state[b.dataset.tg] = !state[b.dataset.tg]; syncUi(); request(); }));
  lv.addEventListener('input', () => { state.levels = +lv.value; syncUi(); request(); });
  px.addEventListener('input', () => { state.px = +px.value; syncUi(); resize(); request(); });

  // ---- Renderer ----
  let W = 0;
  let H = 0;
  let lum;
  let depth;
  let ids;
  let img;
  let buf32;
  let fn = new Float32Array(0);
  function resize() {
    const r = $('.d3-screen', view).getBoundingClientRect();
    const w = Math.max(48, Math.round(r.width / state.px));
    const h = Math.max(36, Math.round(r.height / state.px));
    if (w === W && h === H) return;
    W = w;
    H = h;
    canvas.width = W;
    canvas.height = H;
    lum = new Float32Array(W * H);
    depth = new Float32Array(W * H);
    ids = new Int32Array(W * H);
    img = ctx.createImageData(W, H);
    buf32 = new Uint32Array(img.data.buffer);
  }

  const cam = { pos: [0, 0.75, 4.6], target: [0, -0.15, 0] };
  const sub = (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
  const dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
  const nrm = (a) => { const l = Math.hypot(a[0], a[1], a[2]) || 1; return [a[0] / l, a[1] / l, a[2] / l]; };
  const crs = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
  const F = nrm(sub(cam.target, cam.pos));
  const R = nrm(crs(F, [0, 1, 0]));
  const U = crs(R, F);
  const LIGHT = nrm([0.55, 0.8, 0.5]);
  const BACK = nrm([-0.7, -0.1, -0.6]);
  const MOON = nrm([-0.34, 0.14, -1]);
  const FLOOR = -1.5;

  let angle = 0.6;
  function render(time) {
    resize();
    const m = MESHES[state.mesh].m;
    const nv = m.v.length / 3;
    const nf = m.f.length / 3;
    const focal = (Math.min(W, H) / 2) / Math.tan((25 * Math.PI) / 180);
    const cx = W / 2;
    const cy = H / 2;
    const bob = Math.sin(time / 900) * 0.07;
    const ya = angle;
    const xa = 0.35 + Math.sin(angle * 0.7) * 0.25;
    const cyA = Math.cos(ya);
    const syA = Math.sin(ya);
    const cxA = Math.cos(xa);
    const sxA = Math.sin(xa);

    // Floor, sky and the moon, one ray per pixel
    for (let y = 0; y < H; y++) {
      const sy = (cy - y - 0.5) / focal;
      for (let x = 0; x < W; x++) {
        const sx = (x + 0.5 - cx) / focal;
        const dx = F[0] + R[0] * sx + U[0] * sy;
        const dy = F[1] + R[1] * sx + U[1] * sy;
        const dz = F[2] + R[2] * sx + U[2] * sy;
        const i = y * W + x;
        ids[i] = -1;
        if (dy < -0.004) {
          const t = (FLOOR - cam.pos[1]) / dy;
          const wx = cam.pos[0] + dx * t;
          const wz = cam.pos[2] + dz * t;
          const gx = wx * 1.25 - Math.floor(wx * 1.25);
          const gz = wz * 1.25 - Math.floor(wz * 1.25);
          let l = gx < 0.05 || gz < 0.05 ? 0.6 : 0.2;
          const d = Math.hypot(wx, wz);
          l *= 0.3 + 0.7 * Math.min(1, Math.max(0, (d - 0.5) / 1.4));
          const fog = 1 - Math.exp(-t * 0.09);
          lum[i] = l * (1 - fog) + 0.05 * fog;
          depth[i] = t;
          ids[i] = -2;
        } else {
          const dl = Math.hypot(dx, dy, dz);
          const md = (dx * MOON[0] + dy * MOON[1] + dz * MOON[2]) / dl;
          let l = 0.015 + 0.1 * Math.max(0, 1 - (dy / dl) * 4);
          if (md > 0.9985) l = 1;
          else if (md > 0.993) l = Math.max(l, (md - 0.993) / 0.0055 * 0.5);
          lum[i] = l;
          depth[i] = 1e9;
        }
      }
    }

    // Transform vertices: rotate, lift, then into camera space and onto the screen
    const sxv = new Float32Array(nv);
    const syv = new Float32Array(nv);
    const izv = new Float32Array(nv);
    const wv = new Float32Array(nv * 3);
    for (let k = 0; k < nv; k++) {
      let x = m.v[k * 3];
      let y = m.v[k * 3 + 1];
      let z = m.v[k * 3 + 2];
      const y1 = y * cxA - z * sxA;
      const z1 = y * sxA + z * cxA;
      y = y1; z = z1;
      const x2 = x * cyA + z * syA;
      const z2 = -x * syA + z * cyA;
      x = x2; z = z2;
      y += bob;
      wv[k * 3] = x; wv[k * 3 + 1] = y; wv[k * 3 + 2] = z;
      const px0 = x - cam.pos[0];
      const py0 = y - cam.pos[1];
      const pz0 = z - cam.pos[2];
      const xc = px0 * R[0] + py0 * R[1] + pz0 * R[2];
      const yc = px0 * U[0] + py0 * U[1] + pz0 * U[2];
      const zc = px0 * F[0] + py0 * F[1] + pz0 * F[2];
      izv[k] = 1 / zc;
      sxv[k] = cx + (xc / zc) * focal;
      syv[k] = cy - (yc / zc) * focal;
    }
    if (fn.length < nf * 3) fn = new Float32Array(nf * 3);

    // Rasterise every face with a depth test, flat shaded
    for (let t = 0; t < nf; t++) {
      const a = m.f[t * 3];
      const b = m.f[t * 3 + 1];
      const c = m.f[t * 3 + 2];
      const e1 = [wv[b * 3] - wv[a * 3], wv[b * 3 + 1] - wv[a * 3 + 1], wv[b * 3 + 2] - wv[a * 3 + 2]];
      const e2 = [wv[c * 3] - wv[a * 3], wv[c * 3 + 1] - wv[a * 3 + 1], wv[c * 3 + 2] - wv[a * 3 + 2]];
      let n = nrm(crs(e1, e2));
      const toCam = [wv[a * 3] - cam.pos[0], wv[a * 3 + 1] - cam.pos[1], wv[a * 3 + 2] - cam.pos[2]];
      if (dot(n, toCam) > 0) n = [-n[0], -n[1], -n[2]];
      fn[t * 3] = n[0]; fn[t * 3 + 1] = n[1]; fn[t * 3 + 2] = n[2];
      const shade = Math.min(1, 0.06 + 0.92 * Math.max(0, dot(n, LIGHT)) + 0.2 * Math.max(0, dot(n, BACK)));
      const ax = sxv[a]; const ay = syv[a]; const az = izv[a];
      const bx = sxv[b]; const by = syv[b]; const bz = izv[b];
      const qx = sxv[c]; const qy = syv[c]; const qz = izv[c];
      const area = (bx - ax) * (qy - ay) - (by - ay) * (qx - ax);
      if (Math.abs(area) < 1e-6) continue;
      const minX = Math.max(0, Math.floor(Math.min(ax, bx, qx)));
      const maxX = Math.min(W - 1, Math.ceil(Math.max(ax, bx, qx)));
      const minY = Math.max(0, Math.floor(Math.min(ay, by, qy)));
      const maxY = Math.min(H - 1, Math.ceil(Math.max(ay, by, qy)));
      const inv = 1 / area;
      for (let y = minY; y <= maxY; y++) {
        const py = y + 0.5;
        for (let x = minX; x <= maxX; x++) {
          const pxx = x + 0.5;
          const w0 = ((bx - pxx) * (qy - py) - (by - py) * (qx - pxx)) * inv;
          const w1 = ((qx - pxx) * (ay - py) - (qy - py) * (ax - pxx)) * inv;
          const w2 = 1 - w0 - w1;
          if (w0 < 0 || w1 < 0 || w2 < 0) continue;
          const iz = w0 * az + w1 * bz + w2 * qz;
          const z = 1 / iz;
          const i = y * W + x;
          if (z < depth[i]) {
            depth[i] = z;
            lum[i] = shade;
            ids[i] = t;
          }
        }
      }
    }

    // Quantise through the threshold map, map onto the palette, and draw lines
    const n = state.levels;
    const ramp = PAL[state.pal].ramp;
    const cols = new Uint32Array(n);
    for (let k = 0; k < n; k++) {
      const [r, g, b] = sampleRamp(ramp, n === 1 ? 0 : k / (n - 1));
      cols[k] = (255 << 24) | (b << 16) | (g << 8) | r;
    }
    const pat = PATTERNS[state.pat];
    const ms = pat.size;
    const map = pat.map;
    const lineCol = cols[n - 1];
    for (let y = 0; y < H; y++) {
      for (let x = 0; x < W; x++) {
        const i = y * W + x;
        const id = ids[i];
        if (state.lines && id >= 0) {
          const right = x + 1 < W ? ids[i + 1] : id;
          const down = y + 1 < H ? ids[i + W] : id;
          let edge = false;
          for (const o of [right, down]) {
            if (o === id) continue;
            if (o < 0) { edge = true; break; }
            const d = fn[id * 3] * fn[o * 3] + fn[id * 3 + 1] * fn[o * 3 + 1] + fn[id * 3 + 2] * fn[o * 3 + 2];
            if (d < 0.82) { edge = true; break; }
          }
          if (edge) { buf32[i] = lineCol; continue; }
        }
        const th = map[(y % ms) * ms + (x % ms)];
        let q = Math.floor(lum[i] * (n - 1) + th);
        if (q < 0) q = 0; else if (q > n - 1) q = n - 1;
        buf32[i] = cols[q];
      }
    }
    ctx.putImageData(img, 0, 0);
  }

  // ---- HUD ----
  let fps = 0;
  // Written only when the text changes: the bottom-left line is a live region, and this runs every frame.
  const put = (el, text) => { if (el.textContent !== text) el.textContent = text; };
  function paintHud() {
    const mm = MESHES[state.mesh];
    put(hud.tl, `persp · ${mm.name} · ${mm.m.f.length / 3} tris`);
    put(hud.tr, calm() || !state.spin ? 'still' : `${fps} fps`);
    put(hud.bl, `${PATTERNS[state.pat].name} · ${state.levels} colours · ${W}×${H} · ${PAL[state.pal].name}`);
  }

  // ---- Loop ----
  let raf = 0;
  let last = 0;
  let frames = 0;
  let fpsT = 0;
  let onScreen = true;
  const running = () => state.spin && !calm() && onScreen && !document.hidden;
  function frame(now) {
    raf = 0;
    if (now - last >= 32) {
      angle += Math.min(100, now - last) * 0.00045;
      last = now;
      render(now);
      frames++;
      if (now - fpsT > 1000) { fps = frames; frames = 0; fpsT = now; }
      paintHud();
    }
    if (running()) raf = requestAnimationFrame(frame);
  }
  function request() {
    if (running()) { if (!raf) { last = performance.now() - 40; raf = requestAnimationFrame(frame); } return; }
    render(performance.now());
    paintHud();
  }
  if ('IntersectionObserver' in window) {
    new IntersectionObserver((es) => { onScreen = es[0].isIntersecting; request(); }).observe(canvas);
  }
  document.addEventListener('visibilitychange', request);
  addEventListener('eas:calm', request);
  if ('ResizeObserver' in window) new ResizeObserver(() => { resize(); paintTitle(); request(); }).observe($('.d3-screen', view));

  // ---- The object follows the section you are reading ----
  const secs = [$('.hero'), ...$$('main .sec')];
  const tocLinks = $$('.toc a');
  const onScroll = () => {
    const y = innerHeight * 0.35;
    let cur = 'top';
    for (const s of secs) if (s.getBoundingClientRect().top < y) cur = s.id || 'top';
    const want = SECTION_MESH[cur] || 'knot';
    tocLinks.forEach((a) => a.classList.toggle('is-here', a.getAttribute('href') === `#${cur}`));
    if (want !== state.mesh) { state.mesh = want; request(); }
  };
  addEventListener('scroll', onScroll, { passive: true });

  applyPal(state.pal);
  onScroll();
  request();
})();
