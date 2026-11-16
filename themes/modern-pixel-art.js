// Modern Pixel Art: a pixel artist's working file at modern scale.
// The hero holds a working canvas: a sprite in a ruined room at 240 x 135, lit pixel by pixel through normal maps by a light
// that follows the pointer, a magenta crystal and the sky in the window, with hard shadows, a rim light, fog, bloom and
// particles. Each is a layer in the Layers panel beside it that can be hidden to show what it adds, and the timeline below
// plays the sprite's twelve frames. The rest of the page: the contents become a Layers panel that marks the section you are
// in, each palette colour grows a hue-shifted ramp, the how-to steps become frames on a timeline, and glowing motes drift
// behind the page.
(() => {
  const root = document.documentElement;
  const isCalm = () => root.dataset.calm === '1';
  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => [...el.querySelectorAll(s)];
  const hex = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16) / 255);
  const hash = (x, y) => {
    let h = (Math.imul(x | 0, 374761393) + Math.imul(y | 0, 668265263)) | 0;
    h = Math.imul(h ^ (h >>> 13), 1274126177);
    return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
  };
  const el = (tag, cls, html) => { const e = document.createElement(tag); if (cls) e.className = cls; if (html != null) e.innerHTML = html; return e; };

  /* ------------------------------------------------------------------ the scene */
  const W = 240; const H = 135; const N = W * H; const FLOOR = 116;
  const SW = 38; const SH = 46; const SX = 84; const SY = FLOOR - SH;
  const FRAMES = 12;

  const bgAlb = new Float32Array(N * 3); const bgNrm = new Float32Array(N * 3); const bgEmi = new Float32Array(N * 3);
  const bgSolid = new Uint8Array(N); const bgUnlit = new Uint8Array(N);
  const setPx = (i, a, n, e) => {
    const j = i * 3;
    bgAlb[j] = a[0]; bgAlb[j + 1] = a[1]; bgAlb[j + 2] = a[2];
    let nx = n[0]; let ny = n[1]; let nz = n[2];
    const l = Math.hypot(nx, ny, nz) || 1; nx /= l; ny /= l; nz /= l;
    bgNrm[j] = nx; bgNrm[j + 1] = ny; bgNrm[j + 2] = nz;
    if (e) { bgEmi[j] = e[0]; bgEmi[j + 1] = e[1]; bgEmi[j + 2] = e[2]; } else { bgEmi[j] = bgEmi[j + 1] = bgEmi[j + 2] = 0; }
  };
  const shade = (c, k) => [c[0] * k, c[1] * k, c[2] * k];
  const mix = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
  const BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5];

  const WX = 128; const WR = 26; const WTOP = 46; const WBOT = 86;
  const inWindow = (x, y, grow = 0) => {
    const cx = x + 0.5 - WX;
    if (y >= WTOP && y < WBOT + grow) return Math.abs(cx) <= WR + grow;
    return y < WTOP && Math.hypot(cx, y + 0.5 - WTOP) <= WR + grow;
  };
  const PILLARS = [37, 213];
  const CRYSTAL = { x: 181, top: 78, mid: 86, bot: 100 };

  function buildBackground() {
    const brickA = hex('#2b2763'); const brickB = hex('#1f3d5c'); const brickC = hex('#3b2766'); const mortar = hex('#110d27');
    const sky = ['#2e2266', '#47297a', '#6b3a8c', '#ac5bb7', '#f445a1', '#ff817b', '#ffb36b', '#ffff73'].map(hex);
    const far = hex('#5a3483'); const near = hex('#2a1648'); const nearRim = hex('#c2307f');
    const stone = hex('#4d4378'); const frameStone = hex('#463c78'); const moss = hex('#1f7a6e'); const mossHi = hex('#3fb39a');
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
      const i = y * W + x;
      bgSolid[i] = 0; bgUnlit[i] = 0;
      if (y >= FLOOR) {
        // Floor: a mossy top that faces up, then stone blocks facing the camera
        bgSolid[i] = 1;
        if (y < FLOOR + 2) { setPx(i, hash(x, 7) < 0.5 ? moss : mix(moss, mossHi, 0.45), [0, -0.9, 0.45]); continue; }
        if (y === FLOOR + 2) { setPx(i, hex('#160f36'), [0, 0.3, 1]); continue; }
        const row = ((y - FLOOR - 3) / 8) | 0; const yy = (y - FLOOR - 3) % 8; const xo = (row & 1) * 8;
        const xx = (x + xo) % 16; const col = ((x + xo) / 16) | 0;
        if (yy === 7 || xx === 15) { setPx(i, hex('#0d0920'), [0, 0, 1]); continue; }
        const b = shade(hex('#2a2154'), 0.85 + hash(col, row + 40) * 0.3 + (hash(x, y) - 0.5) * 0.08);
        setPx(i, b, [xx === 0 ? -0.6 : xx === 14 ? 0.6 : 0, yy === 0 ? -0.6 : yy === 6 ? 0.6 : 0, 1]);
        continue;
      }
      // Window: the dusk sky seen through an arch, unlit, banded and dithered
      if (inWindow(x, y)) {
        bgUnlit[i] = 1;
        const t = Math.max(0, Math.min(0.999, (y - (WTOP - WR)) / (WBOT - (WTOP - WR))));
        const f = t * (sky.length - 1); const k = f | 0; const fr = f - k;
        let c = (fr * 16 > BAYER[(y & 3) * 4 + (x & 3)] + 0.5) ? sky[Math.min(k + 1, sky.length - 1)] : sky[k];
        const mx = x + 0.5 - 140; const my = y + 0.5 - 36;
        const md = Math.hypot(mx, my);
        if (md < 6.2) c = (Math.hypot(mx + 2, my - 1) < 1.3 || Math.hypot(mx - 2.2, my + 2) < 1) ? hex('#d8cfa0') : hex('#feffc5');
        else if (md < 7.6 && hash(x, y) < 0.6) c = mix(c, hex('#feffc5'), 0.35);
        if (y < 56 && md > 8 && hash(x * 7, y * 3) > 0.985) c = hex('#feffc5');
        const hFar = 13 + 4 * Math.sin(x * 0.13 + 1) + 2 * Math.sin(x * 0.41);
        const hNear = 7 + 3 * Math.sin(x * 0.27 + 2) + 2 * Math.sin(x * 0.61) + ((x % 19) < 3 ? 6 : 0) + ((x % 31) < 2 ? 9 : 0);
        if (y >= WBOT - hNear) c = (y < WBOT - hNear + 1) ? nearRim : near;
        else if (y >= WBOT - hFar) c = far;
        setPx(i, c, [0, 0, 1], c);
        continue;
      }
      // Window frame and sill: stone whose bevel faces the opening
      if (inWindow(x, y, 3) || (y >= WBOT && y < WBOT + 3 && Math.abs(x + 0.5 - WX) <= WR + 6)) {
        const sill = y >= WBOT;
        let nx; let ny;
        if (sill) { nx = 0; ny = y === WBOT ? -0.85 : 0.4; } else if (y < WTOP) { nx = -(x + 0.5 - WX) / WR * 0.7; ny = -(y + 0.5 - WTOP) / WR * 0.7; } else { nx = -Math.sign(x + 0.5 - WX) * 0.7; ny = 0; }
        setPx(i, shade(frameStone, 0.9 + hash(x, y) * 0.2), [nx + (hash(x * 5, y) - 0.5) * 0.2, ny, 0.8]);
        continue;
      }
      // Pillars, solid, with fluting
      let done = false;
      for (const pc of PILLARS) {
        const half = (y < 7 || y >= 104) ? 10 : 8;
        if (x >= pc - half && x < pc + half) {
          bgSolid[i] = 1;
          const u = (x + 0.5 - pc) / half;
          let nx = u * 0.85; let ny = 0; let c = shade(stone, 0.88 + hash(x, y * 2) * 0.16);
          if (y < 7 || y >= 104) {
            if (y === 0 || y === 104) ny = -0.7; else if (y === 6 || y === FLOOR - 1) ny = 0.6;
            if (y === 104 && hash(x, 3) < 0.6) c = moss;
          } else if (((x - pc + 16) & 3) === 0) { c = shade(c, 0.72); nx -= 0.35; }
          setPx(i, c, [nx, ny, Math.sqrt(Math.max(0.08, 1 - nx * nx))]);
          done = true;
        }
      }
      if (done) continue;
      // Pedestal under the crystal, solid
      if (y >= CRYSTAL.bot && x >= CRYSTAL.x - 8 && x <= CRYSTAL.x + 8) {
        bgSolid[i] = 1;
        const lx = x - (CRYSTAL.x - 8); const ly = y - CRYSTAL.bot;
        setPx(i, shade(frameStone, 0.85 + hash(x, y) * 0.2), [lx === 0 ? -0.6 : lx === 16 ? 0.6 : 0, ly === 0 ? -0.8 : 0, 0.8]);
        continue;
      }
      // The crystal: emissive, faceted
      const cdx = x + 0.5 - (CRYSTAL.x + 0.5);
      const chalf = y < CRYSTAL.mid ? (y - CRYSTAL.top) * 0.75 : (CRYSTAL.bot - y) * 0.42;
      if (y >= CRYSTAL.top && y < CRYSTAL.bot && Math.abs(cdx) <= chalf) {
        bgUnlit[i] = 1;
        const c = hex(cdx < -1.2 ? (y < CRYSTAL.mid ? '#ffc2df' : '#ff8fc4') : cdx < 1.2 ? '#f445a1' : '#a3226b');
        setPx(i, c, [0, 0, 1], shade(c, 1.35));
        continue;
      }
      // The back wall: bricks with bevelled edges and grain in the normal map
      const row = (y / 7) | 0; const yy = y % 7; const xo = (row & 1) * 7;
      const col = ((x + xo) / 14) | 0; const xx = (x + xo) % 14;
      const ao = 0.72 + 0.28 * (y / FLOOR);
      if (yy === 6 || xx === 13) { setPx(i, shade(mortar, ao), [0, 0, 1]); continue; }
      const r = hash(col, row);
      let c = r < 0.45 ? brickA : r < 0.8 ? brickB : brickC;
      c = shade(c, ao * (0.88 + hash(col + 9, row) * 0.24 + (hash(x, y) - 0.5) * 0.08));
      setPx(i, c, [(xx === 0 ? -0.6 : xx === 12 ? 0.6 : 0) + (hash(x * 3, y) - 0.5) * 0.3, (yy === 0 ? -0.6 : yy === 5 ? 0.6 : 0) + (hash(x, y * 3) - 0.5) * 0.3, 1]);
    }
    // Vines hanging from the top, and grass along the floor (neither blocks light)
    const vine = hex('#1c5a50'); const leaf = hex('#2f8f6f');
    for (const [vx, len] of [[64, 34], [92, 16], [160, 40], [171, 22], [228, 18]]) {
      for (let y = 0; y < len; y++) {
        const x = vx + Math.round(Math.sin(y * 0.35 + vx) * 1.2);
        if (bgUnlit[y * W + x] || bgSolid[y * W + x]) continue;
        setPx(y * W + x, vine, [0, 0, 1]);
        if (y % 5 === 2) { const lx = x + (y % 10 === 2 ? 1 : -1); if (!bgSolid[y * W + lx]) setPx(y * W + lx, leaf, [y % 10 === 2 ? 0.5 : -0.5, -0.3, 0.8]); }
      }
    }
    for (let x = 0; x < W; x++) {
      if (hash(x, 1) > 0.32) continue;
      const h = 1 + ((hash(x, 2) * 3) | 0);
      for (let k = 1; k <= h; k++) { const i = (FLOOR - k) * W + x; if (!bgSolid[i] && !bgUnlit[i]) setPx(i, k === h ? mossHi : moss, [0, -0.5, 0.8]); }
    }
  }

  /* The sprite: a hooded wanderer with a scarf and a staff, built from shapes with an analytic normal for every pixel. */
  const frames = [];
  function buildSprite(f) {
    const n = SW * SH;
    const alb = new Float32Array(n * 3); const nrm = new Float32Array(n * 3); const emi = new Float32Array(n * 3); const a = new Uint8Array(n);
    const ph = (f / FRAMES) * Math.PI * 2;
    const bob = Math.round((1 - Math.cos(ph)) / 2);
    const cx = 21; const sway = Math.sin(ph) * 1.2;
    const put = (x, y, c, nx, ny, nz, e) => {
      x = Math.round(x); y = Math.round(y);
      if (x < 0 || y < 0 || x >= SW || y >= SH) return;
      const i = y * SW + x; const j = i * 3; const l = Math.hypot(nx, ny, nz) || 1;
      a[i] = 1; alb[j] = c[0]; alb[j + 1] = c[1]; alb[j + 2] = c[2];
      nrm[j] = nx / l; nrm[j + 1] = ny / l; nrm[j + 2] = nz / l;
      emi[j] = e ? e[0] : 0; emi[j + 1] = e ? e[1] : 0; emi[j + 2] = e ? e[2] : 0;
    };
    const teal = hex('#1d6f78'); const tealHi = hex('#2f9a9a'); const tealLo = hex('#11414f');
    const mag = hex('#e0388f'); const magHi = hex('#ff7ab8'); const magLo = hex('#9c1f63');
    const leg = hex('#2a1f55'); const boot = hex('#171030'); const wood = hex('#6b4630'); const woodHi = hex('#9a6a42');
    // Staff, behind the sleeve
    const stx = cx + 9;
    for (let y = 6; y < SH; y++) for (let x = stx; x < stx + 2; x++) put(x, y, x === stx ? woodHi : wood, x === stx ? -0.6 : 0.6, 0, 0.8);
    const gem = hex('#6ff7e8');
    for (let y = 1; y < 6; y++) for (let x = stx - 1; x < stx + 3; x++) {
      const dx = x + 0.5 - (stx + 1); const dy = y + 0.5 - 3.5;
      if (Math.abs(dx) / 2 + Math.abs(dy) / 2.6 <= 1) put(x, y, gem, dx, dy, 1, shade(gem, 1.15));
    }
    // Legs and boots
    for (let y = 38; y < SH; y++) for (const lx of [cx - 4, cx + 1]) for (let x = lx; x < lx + 3; x++) {
      const u = (x - lx - 1) / 1.5;
      put(x, y, y >= 42 ? (x === lx ? mix(boot, leg, 0.6) : boot) : leg, u * 0.8, y === 42 ? -0.5 : 0, 0.7);
    }
    // Scarf tail, flowing back
    for (let s = 0; s < 17; s++) {
      const x = cx - 6 - s;
      const y = 16 + bob + s * 0.32 + Math.sin(s * 0.55 - ph * 2) * Math.min(1, s / 5) * 2.2;
      const th = s > 9 ? 2 : 3;
      for (let k = 0; k < th; k++) {
        const v = (k - (th - 1) / 2) / ((th - 1) / 2 || 1);
        put(x, y + k - 1, k === 0 ? magHi : k === th - 1 ? magLo : mag, 0, v * 0.75, 0.75);
      }
    }
    // Cloak: a cone that sways at the hem, with folds in the normal map
    for (let y = 15 + bob; y < 40; y++) {
      const t = (y - 15) / 24; const half = 5.5 + (y - 15) * 0.28; const c = cx + sway * t;
      for (let x = Math.floor(c - half); x <= Math.ceil(c + half); x++) {
        const u = (x + 0.5 - c) / half;
        if (Math.abs(u) > 1) continue;
        const hem = 39 + Math.round(Math.sin(x * 0.7 + ph * 2) * 0.8);
        if (y > hem) continue;
        const fold = 0.32 * Math.sin(u * Math.PI * 2.5 + 0.6);
        const col = u > 0.62 ? tealLo : (u < -0.7 ? tealHi : teal);
        put(x, y, Math.abs(fold) > 0.29 ? shade(col, 0.86) : col, u * 0.8 + fold, -0.25 + t * 0.3, 0.75);
      }
    }
    // Sleeve and glove on the staff
    for (let y = 21; y < 28; y++) for (let x = cx + 4; x < cx + 11; x++) {
      const dx = (x + 0.5 - (cx + 7.5)) / 3.2; const dy = (y + 0.5 - (24 + bob)) / 2.6;
      if (dx * dx + dy * dy > 1) continue;
      put(x, y, dx > 0.55 ? hex('#211a3d') : teal, dx, dy, Math.sqrt(Math.max(0.05, 1 - dx * dx - dy * dy)));
    }
    // Scarf round the neck
    for (let y = 15 + bob; y < 18 + bob; y++) for (let x = cx - 7; x <= cx + 6; x++) {
      const u = (x + 0.5 - cx) / 7;
      put(x, y, y === 15 + bob ? magHi : y === 17 + bob ? magLo : mag, u * 0.8, (y - 16 - bob) * 0.5, 0.7);
    }
    // Hood: a sphere with a tip that trails back
    const hx = cx; const hy = 9 + bob; const hr = 6.6;
    for (let s = 0; s < 6; s++) {
      const tx = hx - 4 - s * 0.9; const ty = hy - 4 - s * 0.55; const tr = 2.4 - s * 0.32;
      for (let y = Math.floor(ty - tr); y <= Math.ceil(ty + tr); y++) for (let x = Math.floor(tx - tr); x <= Math.ceil(tx + tr); x++) {
        const dx = (x + 0.5 - tx) / tr; const dy = (y + 0.5 - ty) / tr;
        if (dx * dx + dy * dy <= 1) put(x, y, teal, dx * 0.7 - 0.3, dy * 0.7 - 0.3, 0.7);
      }
    }
    for (let y = Math.floor(hy - hr); y <= Math.ceil(hy + hr); y++) for (let x = Math.floor(hx - hr); x <= Math.ceil(hx + hr); x++) {
      const dx = (x + 0.5 - hx) / hr; const dy = (y + 0.5 - hy) / hr; const q = dx * dx + dy * dy;
      if (q > 1) continue;
      put(x, y, dx > 0.55 && dy > -0.2 ? tealLo : (dx < -0.5 && dy < -0.2 ? tealHi : teal), dx, dy, Math.sqrt(1 - q));
    }
    // Face in the hood's shadow, with two eyes that glow (closed on one frame)
    const fx = hx + 3; const fy = hy + 1.5;
    for (let y = Math.floor(fy - 4); y <= Math.ceil(fy + 4); y++) for (let x = Math.floor(fx - 4); x <= Math.ceil(fx + 4); x++) {
      const dx = (x + 0.5 - fx) / 3.4; const dy = (y + 0.5 - fy) / 3.6;
      if (dx * dx + dy * dy > 1) continue;
      put(x, y, hex('#0b0818'), -dx * 0.5, -dy * 0.5, 0.8);
    }
    if (f !== 9) {
      const eye = hex('#fff6a0');
      put(fx - 1, fy - 0.5, eye, 0, 0, 1, shade(eye, 1.25));
      put(fx + 1.4, fy - 0.5, eye, 0, 0, 1, shade(eye, 1.25));
    }
    // Selective outline: edge pixels take a dark version of their own colour. Their outward direction feeds the rim light.
    const rim = [];
    const ink = hex('#0a0717');
    const edge = new Uint8Array(n);
    for (let y = 0; y < SH; y++) for (let x = 0; x < SW; x++) {
      const i = y * SW + x; if (!a[i]) continue;
      let ox = 0; let oy = 0; let open = false;
      for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
        if (!dx && !dy) continue;
        const X = x + dx; const Y = y + dy;
        if (X < 0 || Y < 0 || X >= SW || Y >= SH || !a[Y * SW + X]) { ox += dx; oy += dy; if (!dx || !dy) open = true; }
      }
      if (!open) continue;
      edge[i] = 1;
      const l = Math.hypot(ox, oy) || 1;
      rim.push(i, ox / l, oy / l);
    }
    for (let i = 0; i < n; i++) if (edge[i] && !emi[i * 3]) { const j = i * 3; for (let k = 0; k < 3; k++) alb[j + k] = alb[j + k] * 0.42 + ink[k] * 0.58; }
    return { alb, nrm, emi, a, rim: Float32Array.from(rim) };
  }

  /* ------------------------------------------------------------------ the editor */
  const LAYERS = [
    ['particles', 'Particles', 'Add', 'Motes rise from the crystal and the floor. Each is a pixel or two that the bloom turns into a glow.'],
    ['fog', 'Fog', 'Normal 55%', 'A band of fog over the floor. It takes the colour of the lights near it.'],
    ['bloom', 'Bloom', 'Screen', 'The brightest pixels spread a soft glow over their neighbours, off the pixel grid.'],
    ['rim', 'Rim light', 'Add', 'Lights the edge of the sprite in the colour of each light on the side that faces it.'],
    ['normals', 'Normal map', 'RGB', 'Every pixel stores the way it faces, so light shapes bricks, cloth and hood. Hide it and light only fades with distance.'],
    ['lights', 'Lights', 'Multiply', 'A warm light follows your pointer, the crystal glows magenta and the window adds sky. Solid shapes cast hard shadows.'],
    ['sprite', 'Sprite', 'Normal', 'A 38 by 46 pixel wanderer with twelve frames of idle animation.'],
    ['background', 'Background', 'Normal', 'The ruined room and its window. Hide it to see the sprite alone.'],
  ];

  function editor() {
    const hero = $('.hero'); const gallery = $('.hero-gallery');
    if (!hero || !gallery || !window.ImageData) return;
    const box = el('section', 'mpa-editor');
    box.setAttribute('aria-label', 'Lighting demo: a pixel sprite lit by a light that follows your pointer');
    box.innerHTML = `
      <div class="mpa-tabbar" aria-hidden="true"><span class="mpa-tab">wanderer_dusk.png</span><span class="mpa-dim">240 × 135 px</span><span class="mpa-zoom">100%</span></div>
      <div class="mpa-work">
        <div class="mpa-stage">
          <div class="mpa-canvas" tabindex="0" role="img" aria-label="A hooded wanderer with a staff in a ruined room at dusk. Move the pointer over the picture, tap or drag on it, or use the arrow keys, to move the light.">
            <canvas class="mpa-px" width="${W}" height="${H}"></canvas>
            <canvas class="mpa-glow" width="${W / 2}" height="${Math.ceil(H / 2)}" aria-hidden="true"></canvas>
            <div class="mpa-rulers" aria-hidden="true"><div class="mpa-ruler-x"><i class="mpa-mark"></i></div><div class="mpa-ruler-y"><i class="mpa-mark"></i></div></div>
          </div>
          <p class="mpa-hint" aria-hidden="true"><span class="mpa-hint-mouse">Move the pointer over the canvas to move the light.</span><span class="mpa-hint-touch">Tap the canvas or drag sideways on it to move the light.</span> Hide a layer to see what it adds.</p>
        </div>
        <div class="mpa-layers">
          <div class="mpa-panel-head" aria-hidden="true"><span>Layers</span><span class="mpa-count">${LAYERS.length}</span></div>
          <ul>${LAYERS.map(([k, name, blend, desc]) => `<li><button type="button" class="mpa-layer" data-layer="${k}" aria-pressed="true"><span class="mpa-eye" aria-hidden="true"></span><span class="mpa-thumb mpa-thumb-${k}" aria-hidden="true"></span><span class="mpa-lname">${name}</span><span class="mpa-blend" aria-hidden="true">${blend}</span><span class="mpa-ldesc">${desc}</span></button></li>`).join('')}</ul>
          <p class="mpa-info" aria-hidden="true"><b class="mpa-info-name"></b> <span class="mpa-info-text"></span></p>
        </div>
      </div>
      <div class="mpa-timeline">
        <button type="button" class="mpa-play" aria-pressed="true"><span class="mpa-play-i" aria-hidden="true"></span><span class="mpa-play-t">Pause</span></button>
        <ol class="mpa-frames" aria-label="Animation frames">${Array.from({ length: FRAMES }, (_, i) => `<li><button type="button" data-frame="${i}" aria-label="Frame ${i + 1}"><canvas width="${SW}" height="${SH}"></canvas><span>${i + 1}</span></button></li>`).join('')}</ol>
        <p class="mpa-status" aria-hidden="true"><span class="mpa-pos">x 150 y 60</span><span class="mpa-fno">frame 1/12</span><span>10 fps</span></p>
      </div>`;
    gallery.before(box);

    buildBackground();
    for (let f = 0; f < FRAMES; f++) frames.push(buildSprite(f));

    const cv = $('.mpa-px', box); const ctx = cv.getContext('2d');
    const gv = $('.mpa-glow', box); const gctx = gv.getContext('2d');
    const wrap = $('.mpa-canvas', box); const stage = $('.mpa-stage', box);
    const img = ctx.createImageData(W, H); const px = img.data;
    const GW = W / 2; const GH = Math.ceil(H / 2);
    const gimg = gctx.createImageData(GW, GH); const gpx = gimg.data;
    const markX = $('.mpa-ruler-x .mpa-mark', box); const markY = $('.mpa-ruler-y .mpa-mark', box);
    const posOut = $('.mpa-pos', box); const fnoOut = $('.mpa-fno', box);

    // Working buffers
    const alb = new Float32Array(N * 3); const nrm = new Float32Array(N * 3); const emi = new Float32Array(N * 3);
    const solid = new Uint8Array(N); const unlit = new Uint8Array(N);
    const hdr = new Float32Array(N * 3); const lit = new Float32Array(N * 3);
    const checkAlb = new Float32Array(N * 3); const flatN = new Float32Array(N * 3);
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
      const i = (y * W + x) * 3; const v = ((x >> 3) + (y >> 3)) & 1 ? 0.34 : 0.25;
      checkAlb[i] = v; checkAlb[i + 1] = v; checkAlb[i + 2] = v + 0.04; flatN[i + 2] = 1;
    }
    const glowA = new Float32Array(GW * GH * 3); const glowB = new Float32Array(GW * GH * 3);
    // Fog: a tileable band of soft noise
    const FOG0 = 90; const FOGH = 40; const fogN = new Float32Array(256 * FOGH);
    for (let y = 0; y < FOGH; y++) for (let x = 0; x < 256; x++) {
      const t = (x / 256) * Math.PI * 2;
      const v = 0.5 + 0.22 * Math.sin(t * 3 + y * 0.21) + 0.16 * Math.sin(t * 7 - y * 0.33 + 1.3) + 0.12 * Math.sin(t * 13 + y * 0.5);
      const prof = Math.exp(-((((y + FOG0) - 113) / 9) ** 2));
      fogN[y * 256 + x] = Math.max(0, Math.min(1, v)) * prof;
    }
    // Shadow maps: for each of 512 directions, how far the light reaches before something solid
    const ANG = 512; const COS = new Float32Array(ANG); const SIN = new Float32Array(ANG);
    for (let k = 0; k < ANG; k++) { COS[k] = Math.cos((k / ANG) * Math.PI * 2); SIN[k] = Math.sin((k / ANG) * Math.PI * 2); }
    const smCursor = new Float32Array(ANG); const smCrystal = new Float32Array(ANG);
    // Direction from a light to any pixel, by their whole-pixel offset, worked out once so the lighting loop needs no atan2.
    // Shadows are cast from the centre of the pixel the light is in: the light is snapped to the art's grid.
    const AW = 2 * W + 1; const angT = new Uint16Array(AW * (2 * H + 1));
    for (let oy = -H; oy <= H; oy++) for (let ox = -W; ox <= W; ox++) {
      let k = Math.round((Math.atan2(oy, ox) / (Math.PI * 2)) * ANG); if (k < 0) k += ANG; if (k >= ANG) k -= ANG;
      angT[(oy + H) * AW + ox + W] = k;
    }
    const AMB = [0.26, 0.22, 0.42];
    const BANDS = 6;
    const lights = {
      cursor: { x: 150, y: 60, z: 22, r: 124, c: [1.0, 0.86, 0.62], k: 2.5, sm: smCursor },
      crystal: { x: CRYSTAL.x + 0.5, y: 88, z: 12, r: 84, c: [0.96, 0.3, 0.66], k: 1.8, sm: smCrystal },
      sky: { x: WX, y: 74, z: 30, r: 92, c: [1.0, 0.55, 0.5], k: 0.7, sm: null },
    };
    const state = Object.fromEntries(LAYERS.map(([k]) => [k, true]));
    let frame = 0; let playing = true; let spriteClock = 0; let clock = 0;
    const target = { x: 150, y: 60 }; let pointerAt = -1e9; let dragging = false;

    // Particles
    const motes = Array.from({ length: 42 }, (_, i) => spawn({}, i, true));
    function spawn(m, i, initial) {
      const fromCrystal = i % 3 !== 0;
      m.x = fromCrystal ? CRYSTAL.x - 10 + Math.random() * 20 : 8 + Math.random() * (W - 16);
      m.y = fromCrystal ? 78 + Math.random() * 26 : FLOOR - 2 - Math.random() * 8;
      m.vy = -(3 + Math.random() * 7); m.seed = Math.random() * 10;
      m.life = 3 + Math.random() * 5; m.age = initial ? Math.random() * m.life : 0;
      m.c = fromCrystal ? (Math.random() < 0.7 ? [1.0, 0.36, 0.72] : [1.0, 0.75, 0.9]) : (Math.random() < 0.5 ? [1.0, 1.0, 0.55] : [0.5, 1.0, 0.92]);
      m.big = Math.random() < 0.18;
      if (initial) { m.y += m.vy * m.age; m.x += Math.sin(m.seed) * 2; }
      return m;
    }

    function shadowMap(L, out) {
      const sx = L.px + 0.5; const sy = L.py + 0.5; const R = L.r;
      for (let k = 0; k < ANG; k++) {
        const dx = COS[k]; const dy = SIN[k];
        let left = false; let hit = R;
        for (let t = 0.5; t < R; t += 1) {
          const x = Math.floor(sx + dx * t); const y = Math.floor(sy + dy * t);
          if (x < 0 || y < 0 || x >= W || y >= H) break;
          if (!solid[y * W + x]) left = true; else if (left) { hit = t; break; }
        }
        out[k] = hit;
      }
    }

    function compose() {
      if (state.background) { alb.set(bgAlb); nrm.set(bgNrm); emi.set(bgEmi); solid.set(bgSolid); unlit.set(bgUnlit); } else { alb.set(checkAlb); nrm.set(flatN); emi.fill(0); solid.fill(0); unlit.fill(1); }
      if (!state.sprite) return;
      const F = frames[frame];
      for (let y = 0; y < SH; y++) for (let x = 0; x < SW; x++) {
        const s = y * SW + x; if (!F.a[s]) continue;
        const i = (SY + y) * W + SX + x; const j = i * 3; const q = s * 3;
        alb[j] = F.alb[q]; alb[j + 1] = F.alb[q + 1]; alb[j + 2] = F.alb[q + 2];
        nrm[j] = F.nrm[q]; nrm[j + 1] = F.nrm[q + 1]; nrm[j + 2] = F.nrm[q + 2];
        emi[j] = F.emi[q]; emi[j + 1] = F.emi[q + 1]; emi[j + 2] = F.emi[q + 2];
        solid[i] = 1; unlit[i] = 0;
      }
    }

    // x and y are whole pixels; d is the distance from the light
    const inShadow = (L, x, y, d, isSolid) => {
      if (!L.sm) return false;
      return d > L.sm[angT[(y - L.py + H) * AW + x - L.px + W]] + (isSolid ? 2.5 : 0.9);
    };
    // A shadow map is cast again only when its light moves to another pixel or the solid shapes change
    const smKey = { cursor: '', crystal: '' };
    const cast = (name, L, out) => {
      L.px = Math.floor(L.x); L.py = Math.floor(L.y);
      const key = `${L.px},${L.py},${frame},${state.background},${state.sprite}`;
      if (smKey[name] !== key) { smKey[name] = key; shadowMap(L, out); }
    };

    function draw() {
      const t0 = performance.now();
      compose();
      const active = [];
      if (state.lights) {
        const fl = isCalm() ? 1 : 0.92 + 0.05 * Math.sin(clock * 5.3) + 0.03 * Math.sin(clock * 13.1);
        lights.crystal.k = 1.8 * fl;
        active.push(lights.cursor, lights.crystal, lights.sky);
        cast('cursor', lights.cursor, smCursor); cast('crystal', lights.crystal, smCrystal);
      }
      const nmap = state.normals;
      for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
        const i = y * W + x; const j = i * 3;
        if (unlit[i]) {
          // An unlit pixel shows its glow if it has one, else its flat colour.
          const src = emi[j] || emi[j + 1] || emi[j + 2] ? emi : alb;
          hdr[j] = src[j]; hdr[j + 1] = src[j + 1]; hdr[j + 2] = src[j + 2];
          lit[j] = AMB[0]; lit[j + 1] = AMB[1]; lit[j + 2] = AMB[2];
          continue;
        }
        let r = AMB[0]; let g = AMB[1]; let b = AMB[2];
        const nx = nrm[j]; const ny = nrm[j + 1]; const nz = nrm[j + 2];
        const cx = x + 0.5; const cy = y + 0.5;
        for (let l = 0; l < active.length; l++) {
          const L = active[l];
          const dx = L.x - cx; const dy = L.y - cy; const d2 = dx * dx + dy * dy;
          if (d2 >= L.r * L.r) continue;
          const d = Math.sqrt(d2);
          let att = 1 - d / L.r; att *= att;
          // Shadows fall on the wall behind things. Solid shapes face the camera, so their own front is never in their shadow.
          if (!solid[i] && inShadow(L, x, y, d, 0)) att *= 0.1;
          const inv = 1 / Math.sqrt(d2 + L.z * L.z);
          const nd = nmap ? (nx * dx + ny * dy + nz * L.z) * inv : L.z * inv;
          if (nd <= 0) continue;
          const v = Math.round(att * nd * L.k * BANDS) / BANDS;
          r += L.c[0] * v; g += L.c[1] * v; b += L.c[2] * v;
        }
        lit[j] = r; lit[j + 1] = g; lit[j + 2] = b;
        hdr[j] = alb[j] * r + emi[j]; hdr[j + 1] = alb[j + 1] * g + emi[j + 1]; hdr[j + 2] = alb[j + 2] * b + emi[j + 2];
      }
      // Rim light on the sprite's edge, in each light's colour, on the side that faces it
      if (state.rim && state.sprite && state.lights) {
        const rim = frames[frame].rim;
        for (let q = 0; q < rim.length; q += 3) {
          const s = rim[q]; const x = SX + (s % SW); const y = SY + ((s / SW) | 0); const i = y * W + x; const j = i * 3;
          const cx = x + 0.5; const cy = y + 0.5;
          for (const L of [lights.cursor, lights.crystal]) {
            const dx = L.x - cx; const dy = L.y - cy; const d = Math.hypot(dx, dy) || 1; const R = L.r * 1.25;
            if (d >= R) continue;
            const dot = (rim[q + 1] * dx + rim[q + 2] * dy) / d;
            if (dot < 0.3) continue;
            if (inShadow(L, x, y, d, 1)) continue;
            const v = ((dot - 0.3) / 0.7) * (1 - d / R) * 2.1;
            hdr[j] += L.c[0] * v; hdr[j + 1] += L.c[1] * v; hdr[j + 2] += L.c[2] * v;
          }
        }
      }
      // Fog over the floor, tinted by the light that reaches it
      if (state.fog) {
        const off = Math.floor(clock * 4) & 255;
        for (let y = FOG0; y < Math.min(H, FOG0 + FOGH); y++) for (let x = 0; x < W; x++) {
          const f = fogN[(y - FOG0) * 256 + ((x + off) & 255)] * 0.55;
          if (f < 0.02) continue;
          const j = (y * W + x) * 3;
          hdr[j] += (0.16 + 0.34 * lit[j] - hdr[j]) * f;
          hdr[j + 1] += (0.3 + 0.36 * lit[j + 1] - hdr[j + 1]) * f;
          hdr[j + 2] += (0.42 + 0.4 * lit[j + 2] - hdr[j + 2]) * f;
        }
      }
      // Particles: additive pixels with a faint cross
      if (state.particles) {
        for (const m of motes) {
          const x = Math.round(m.x); const y = Math.round(m.y);
          if (x < 1 || y < 1 || x >= W - 1 || y >= H - 1) continue;
          const a = Math.sin(Math.PI * Math.min(1, m.age / m.life)) * 1.5;
          const j = (y * W + x) * 3;
          for (let k = 0; k < 3; k++) hdr[j + k] += m.c[k] * a;
          if (m.big) for (const o of [1, -1, W, -W]) { const q = j + o * 3; for (let k = 0; k < 3; k++) hdr[q + k] += m.c[k] * a * 0.45; }
        }
      }
      // The light itself: a small warm wisp
      if (state.lights) {
        const x = Math.round(lights.cursor.x - 0.5); const y = Math.round(lights.cursor.y - 0.5);
        const add = (xx, yy, v) => { if (xx < 0 || yy < 0 || xx >= W || yy >= H) return; const j = (yy * W + xx) * 3; hdr[j] += 1.1 * v; hdr[j + 1] += 0.98 * v; hdr[j + 2] += 0.75 * v; };
        add(x, y, 2.2); add(x + 1, y, 0.9); add(x - 1, y, 0.9); add(x, y + 1, 0.9); add(x, y - 1, 0.9);
      }
      for (let i = 0, j = 0, k = 0; i < N; i++, j += 3, k += 4) {
        px[k] = hdr[j] * 255; px[k + 1] = hdr[j + 1] * 255; px[k + 2] = hdr[j + 2] * 255; px[k + 3] = 255;
      }
      ctx.putImageData(img, 0, 0);
      if (state.bloom) bloom();
      cost(performance.now() - t0);
    }

    // Bloom: keep what is brighter than white, halve it, blur it and lay it over the canvas in screen mode
    function bloom() {
      for (let y = 0; y < GH; y++) for (let x = 0; x < GW; x++) {
        let r = 0; let g = 0; let b = 0;
        for (let dy = 0; dy < 2; dy++) for (let dx = 0; dx < 2; dx++) {
          const X = x * 2 + dx; const Y = Math.min(H - 1, y * 2 + dy); const j = (Y * W + X) * 3;
          const m = Math.max(hdr[j], hdr[j + 1], hdr[j + 2]);
          if (m < 0.86) continue;
          const k = (m - 0.7) / m;
          r += hdr[j] * k; g += hdr[j + 1] * k; b += hdr[j + 2] * k;
        }
        const q = (y * GW + x) * 3; glowA[q] = r / 4; glowA[q + 1] = g / 4; glowA[q + 2] = b / 4;
      }
      const blur = (src, dst, horiz, R) => {
        const len = horiz ? GW : GH; const lines = horiz ? GH : GW; const norm = 1 / (2 * R + 1);
        for (let l = 0; l < lines; l++) {
          let r = 0; let g = 0; let b = 0;
          const at = (p) => (horiz ? (l * GW + Math.min(len - 1, Math.max(0, p))) : (Math.min(len - 1, Math.max(0, p)) * GW + l)) * 3;
          for (let p = -R; p <= R; p++) { const q = at(p); r += src[q]; g += src[q + 1]; b += src[q + 2]; }
          for (let p = 0; p < len; p++) {
            const q = at(p); dst[q] = r * norm; dst[q + 1] = g * norm; dst[q + 2] = b * norm;
            const a = at(p + R + 1); const s = at(p - R); r += src[a] - src[s]; g += src[a + 1] - src[s + 1]; b += src[a + 2] - src[s + 2];
          }
        }
      };
      blur(glowA, glowB, true, 3); blur(glowB, glowA, false, 3); blur(glowA, glowB, true, 2); blur(glowB, glowA, false, 2);
      for (let i = 0, q = 0, k = 0; i < GW * GH; i++, q += 3, k += 4) {
        gpx[k] = glowA[q] * 420; gpx[k + 1] = glowA[q + 1] * 420; gpx[k + 2] = glowA[q + 2] * 420; gpx[k + 3] = 255;
      }
      gctx.putImageData(gimg, 0, 0);
    }

    // Cost guard: if a frame takes long, draw fewer of them
    let avg = 4; let interval = 1 / 30;
    function cost(ms) {
      avg = avg * 0.9 + ms * 0.1;
      interval = avg > 22 ? 1 / 10 : avg > 12 ? 1 / 15 : avg > 7 ? 1 / 20 : 1 / 30;
    }

    // Frame strip: each frame drawn once, at one pixel per pixel
    $$('.mpa-frames canvas', box).forEach((c, f) => {
      const g = c.getContext('2d'); const id = g.createImageData(SW, SH); const F = frames[f];
      for (let i = 0; i < SW * SH; i++) {
        if (!F.a[i]) continue;
        const e = F.emi[i * 3] > 0;
        for (let k = 0; k < 3; k++) id.data[i * 4 + k] = Math.min(255, (e ? F.emi[i * 3 + k] : F.alb[i * 3 + k] * 1.25) * 255);
        id.data[i * 4 + 3] = 255;
      }
      g.putImageData(id, 0, 0);
    });
    const frameBtns = $$('.mpa-frames button', box);
    const thumbSprite = $('.mpa-thumb-sprite', box); const thumbBg = $('.mpa-thumb-background', box);
    if (thumbSprite) { const c = el('canvas'); c.width = SW; c.height = SH; c.getContext('2d').drawImage(frameBtns[0].querySelector('canvas'), 0, 0); thumbSprite.append(c); }
    if (thumbBg) {
      const c = el('canvas'); c.width = 48; c.height = 27; const g = c.getContext('2d'); const id = g.createImageData(48, 27);
      for (let y = 0; y < 27; y++) for (let x = 0; x < 48; x++) {
        const j = ((Math.min(H - 1, y * 5 + 2)) * W + x * 5 + 2) * 3; const k = (y * 48 + x) * 4;
        const lum = bgUnlit[j / 3] ? 1 : 2.1;
        for (let q = 0; q < 3; q++) id.data[k + q] = Math.min(255, bgAlb[j + q] * lum * 255);
        id.data[k + 3] = 255;
      }
      g.putImageData(id, 0, 0); thumbBg.append(c);
    }
    let shownFrame = -1;
    const showFrame = () => {
      if (frame === shownFrame) return;
      frameBtns.forEach((b, i) => b.setAttribute('aria-current', String(i === frame)));
      fnoOut.textContent = `frame ${frame + 1}/${FRAMES}`;
      shownFrame = frame;
    };
    showFrame();

    // Integer scaling: the canvas grows in whole device pixels per art pixel, so every pixel stays square and even.
    // Measured on resize only, never while drawing. On wide screens the Layers panel sits beside the canvas, but only
    // where the canvas gets at least 3 CSS pixels per art pixel there; anywhere narrower the panel goes under the canvas
    // (.mpa-stack), so a small canvas never leaves an empty patch beside the tall panel. Side by side, the canvas and
    // its hint fit the panel's height (the stage centres them); stacked, the canvas takes at most about 60% of the
    // window's height, so the timeline stays near the first screen.
    const LAYERS_W = 340; // the Layers column beside the canvas: keep in step with .mpa-work in the CSS
    const wide = window.matchMedia('(min-width: 1100px)');
    const hint = $('.mpa-hint', box); const panelParts = ['.mpa-panel-head', '.mpa-layers ul', '.mpa-info'].map((q) => $(q, box));
    let u = 3;
    const fit = () => {
      const dpr = window.devicePixelRatio || 1;
      const cs = getComputedStyle(stage);
      const padX = parseFloat(cs.paddingLeft) + parseFloat(cs.paddingRight);
      const inner = box.clientWidth;
      const sSide = Math.floor(((inner - LAYERS_W - padX) * dpr) / W);
      const side = wide.matches && sSide / dpr >= 2.99;
      box.classList.toggle('mpa-stack', !side);
      let s;
      if (side) {
        const chrome = parseFloat(cs.paddingTop) + parseFloat(cs.paddingBottom) + hint.offsetHeight + parseFloat(getComputedStyle(hint).marginTop);
        const panel = panelParts.reduce((sum, p) => sum + (p ? p.offsetHeight : 0), 0);
        s = Math.max(1, Math.min(sSide, Math.floor(((panel - chrome) * dpr) / H)));
      } else {
        const byH = Math.floor((Math.max(320, innerHeight) * 0.6 * dpr) / H);
        s = Math.max(1, Math.min(Math.floor(((inner - padX) * dpr) / W), Math.max(2, byH)));
      }
      u = s / dpr;
      wrap.style.width = `${W * u}px`; wrap.style.height = `${H * u}px`;
      stage.style.setProperty('--u', `${u}px`);
      const zoom = $('.mpa-zoom', box); if (zoom) zoom.textContent = `${Math.round(s * 100)}%`;
      placeMarks();
    };
    // Refit when the editor's width, the window's height, the zoom or the fonts change. fit() changes the editor's
    // height, so it runs in the next frame and only when one of those inputs moved, never inside the observer itself.
    let fitKey = '';
    const refit = (force) => {
      const key = `${box.clientWidth} ${innerHeight} ${window.devicePixelRatio}`;
      if (key === fitKey && force !== true) return;
      fitKey = key; fit();
    };
    if (window.ResizeObserver) new ResizeObserver(() => requestAnimationFrame(refit)).observe(box);
    addEventListener('resize', refit);
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => refit(true));
    refit();
    function placeMarks() {
      markX.style.transform = `translateX(${lights.cursor.x * u}px)`;
      markY.style.transform = `translateY(${lights.cursor.y * u}px)`;
      posOut.textContent = `x ${Math.floor(lights.cursor.x)} y ${Math.floor(lights.cursor.y)}`;
    }

    // Pointer, touch and keys move the light
    const clampTarget = () => { target.x = Math.max(2, Math.min(W - 2, target.x)); target.y = Math.max(3, Math.min(FLOOR - 4, target.y)); };
    const fromEvent = (e) => {
      const r = wrap.getBoundingClientRect();
      target.x = ((e.clientX - r.left) / r.width) * W; target.y = ((e.clientY - r.top) / r.height) * H;
      clampTarget(); pointerAt = performance.now();
      if (isCalm() || !running) { lights.cursor.x = target.x; lights.cursor.y = target.y; request(); }
    };
    stage.addEventListener('pointermove', (e) => { if (e.pointerType !== 'touch' || dragging) fromEvent(e); });
    wrap.addEventListener('pointerdown', (e) => { dragging = true; try { wrap.setPointerCapture(e.pointerId); } catch { /* not capturable */ } fromEvent(e); });
    const stop = () => { dragging = false; };
    wrap.addEventListener('pointerup', stop); wrap.addEventListener('pointercancel', stop);
    wrap.addEventListener('keydown', (e) => {
      const step = e.shiftKey ? 16 : 6;
      const k = { ArrowLeft: [-step, 0], ArrowRight: [step, 0], ArrowUp: [0, -step], ArrowDown: [0, step] }[e.key];
      if (!k) return;
      // The page moves to the next style on the arrow keys; on the canvas they move the light instead.
      e.preventDefault(); e.stopPropagation();
      target.x = lights.cursor.x + k[0]; target.y = lights.cursor.y + k[1]; clampTarget();
      pointerAt = performance.now() + 4000;
      lights.cursor.x = target.x; lights.cursor.y = target.y; request();
    });

    // Layers. The info box under the list says what the layer last pointed at, focused or toggled does.
    const infoName = $('.mpa-info-name', box); const infoText = $('.mpa-info-text', box);
    const info = (b) => {
      const L = LAYERS.find(([k]) => k === b.dataset.layer);
      infoName.textContent = `${L[1]}${state[L[0]] ? '' : ' (hidden)'}.`; infoText.textContent = L[3];
      $$('.mpa-layer', box).forEach((x) => x.classList.toggle('is-picked', x === b));
    };
    $$('.mpa-layer', box).forEach((b) => {
      b.addEventListener('click', () => {
        const k = b.dataset.layer; state[k] = !state[k];
        b.setAttribute('aria-pressed', String(state[k]));
        box.classList.toggle(`no-${k}`, !state[k]);
        if (k === 'bloom' && !state.bloom) gctx.clearRect(0, 0, GW, GH);
        info(b);
        request();
      });
      b.addEventListener('pointerenter', () => info(b));
      b.addEventListener('focus', () => info(b));
    });
    info($('.mpa-layer[data-layer="lights"]', box));
    // Timeline
    const playBtn = $('.mpa-play', box);
    const setPlaying = (p) => { playing = p; playBtn.setAttribute('aria-pressed', String(p)); $('.mpa-play-t', playBtn).textContent = p ? 'Pause' : 'Play'; kick(); };
    playBtn.addEventListener('click', () => setPlaying(!playing));
    frameBtns.forEach((b, i) => b.addEventListener('click', () => { frame = i; spriteClock = i / 10; showFrame(); setPlaying(false); request(); }));

    // The loop: runs only while the editor is on screen, the tab is visible and effects are on
    let running = false; let raf = 0; let last = 0; let acc = 0; let visible = false; let pending = 0;
    const want = () => visible && !document.hidden && !isCalm();
    function tick(now) {
      if (!running) return;
      raf = requestAnimationFrame(tick);
      const dt = Math.min(0.1, (now - last) / 1000); last = now; acc += dt;
      if (acc < interval) return;
      step(acc); acc = 0;
      draw(); placeMarks(); showFrame();
    }
    function step(dt) {
      clock += dt;
      if (playing) { spriteClock += dt; frame = Math.floor(spriteClock * 10) % FRAMES; }
      const idle = performance.now() - pointerAt > 2600;
      if (idle) { target.x = 132 + 78 * Math.sin(clock * 0.31); target.y = 58 + 26 * Math.sin(clock * 0.53 + 1.1); }
      const e = 1 - Math.exp(-dt * (idle ? 2 : 12));
      lights.cursor.x += (target.x - lights.cursor.x) * e; lights.cursor.y += (target.y - lights.cursor.y) * e;
      for (let i = 0; i < motes.length; i++) {
        const m = motes[i]; m.age += dt;
        if (m.age >= m.life) { spawn(m, i, false); continue; }
        m.y += m.vy * dt; m.x += Math.sin(m.age * 1.6 + m.seed) * 5 * dt;
      }
    }
    function kick() {
      if (want() && !running) { running = true; last = performance.now(); acc = interval; raf = requestAnimationFrame(tick); }
      else if (!want() && running) { running = false; cancelAnimationFrame(raf); }
      playBtn.hidden = isCalm();
      if (!running) request();
    }
    function request() {
      if (pending || running) return;
      pending = requestAnimationFrame(() => { pending = 0; draw(); placeMarks(); showFrame(); });
    }
    if (window.IntersectionObserver) new IntersectionObserver((es) => { visible = es[es.length - 1].isIntersecting; kick(); }, { rootMargin: '60px' }).observe(box);
    else { visible = true; }
    document.addEventListener('visibilitychange', kick);
    addEventListener('eas:calm', kick);
    // First picture straight away, the light resting by the window
    lights.cursor.x = target.x; lights.cursor.y = target.y;
    draw(); placeMarks();
    kick();
  }

  /* ------------------------------------------------------------------ contents as a Layers panel */
  function layersToc() {
    const toc = $('.toc'); if (!toc) return;
    const links = $$('a', toc);
    const byId = new Map(links.map((a) => [a.getAttribute('href').slice(1), a]));
    const secs = [...byId.keys()].map((id) => document.getElementById(id)).filter(Boolean);
    if (!window.IntersectionObserver) return;
    const seen = new Map();
    const io = new IntersectionObserver((entries) => {
      for (const e of entries) seen.set(e.target.id, e.isIntersecting);
      const cur = secs.find((s) => seen.get(s.id));
      links.forEach((a) => { const on = cur && a === byId.get(cur.id); a.classList.toggle('is-active', !!on); if (on) a.setAttribute('aria-current', 'location'); else a.removeAttribute('aria-current'); });
      $$('.sec').forEach((s) => s.classList.toggle('is-current', !!cur && s === cur));
    }, { rootMargin: '-40% 0px -55% 0px' });
    secs.forEach((s) => io.observe(s));
  }

  /* ------------------------------------------------------------------ hue-shifted ramps under each swatch */
  function ramps() {
    const toHsl = ([r, g, b]) => {
      const mx = Math.max(r, g, b); const mn = Math.min(r, g, b); const l = (mx + mn) / 2; const d = mx - mn;
      let h = 0; let s = 0;
      if (d) {
        s = d / (1 - Math.abs(2 * l - 1));
        h = mx === r ? ((g - b) / d) % 6 : mx === g ? (b - r) / d + 2 : (r - g) / d + 4;
        h *= 60; if (h < 0) h += 360;
      }
      return [h, s, l];
    };
    // Move a hue toward a target by at most `step` degrees
    const toward = (h, t, step) => { let d = ((t - h + 540) % 360) - 180; d = Math.max(-step, Math.min(step, d)); return (h + d + 360) % 360; };
    $$('.swatch').forEach((sw) => {
      const c = (sw.getAttribute('style') || '').match(/#[0-9a-f]{6}/i); const btn = $('button', sw);
      if (!c || !btn) return;
      const [h, s, l] = toHsl(hex(c[0]));
      const cells = [];
      for (let k = -4; k <= 4; k++) {
        let hh = h; let ll = l; let ss = s;
        for (let n = 0; n < Math.abs(k); n++) {
          hh = toward(hh, k < 0 ? 245 : 58, 20);
          ll = k < 0 ? ll * 0.78 : ll + (1 - ll) * 0.24;
          ss = k < 0 ? Math.min(1, ss * 1.04 + 0.02) : ss * 0.93;
        }
        cells.push(k === 0 ? c[0] : `hsl(${hh.toFixed(0)} ${(ss * 100).toFixed(0)}% ${(Math.max(0.03, Math.min(0.97, ll)) * 100).toFixed(0)}%)`);
      }
      const ramp = el('span', 'mpa-ramp', cells.map((x, i) => `<i${i === 4 ? ' class="is-base"' : ''} style="background:${x}"></i>`).join(''));
      ramp.setAttribute('aria-hidden', 'true');
      $('.chip', btn)?.after(ramp);
    });
  }

  /* ------------------------------------------------------------------ the how-to steps as frames on a timeline */
  function stepFrames() {
    const steps = $$('.step'); if (!steps.length || !window.IntersectionObserver) return;
    const io = new IntersectionObserver((entries) => {
      for (const e of entries) e.target.classList.toggle('is-current', e.isIntersecting);
    }, { rootMargin: '-35% 0px -50% 0px' });
    steps.forEach((s) => io.observe(s));
  }

  /* ------------------------------------------------------------------ motes and a dusk behind the page */
  function backdrop() {
    const c = el('canvas', 'mpa-sky fx'); c.setAttribute('aria-hidden', 'true');
    document.body.prepend(c);
    const g = c.getContext('2d');
    const S = 4; let w = 0; let h = 0; let sky = null;
    const motes = [];
    const cols = ['#f445a1', '#ffff73', '#3fd0c9', '#feffc5', '#ff817b'];
    const resize = () => {
      w = Math.ceil(innerWidth / S); h = Math.ceil(innerHeight / S);
      c.width = w; c.height = h;
      // The still part: banded dusk at the foot of the screen with a ruined skyline, drawn once per size
      sky = document.createElement('canvas'); sky.width = w; sky.height = h; const s = sky.getContext('2d');
      const bands = ['#0e0a24', '#130e30', '#1a1340', '#241a52', '#2e2266', '#47297a', '#6b3a8c', '#8a3f8f'];
      const top = Math.floor(h * 0.55);
      s.fillStyle = bands[0]; s.fillRect(0, 0, w, h);
      const bh = Math.max(2, Math.floor((h - top) / bands.length));
      for (let b = 1; b < bands.length; b++) {
        const y = top + b * bh;
        s.fillStyle = bands[b]; s.fillRect(0, y, w, h - y);
        s.fillStyle = bands[b]; for (let x = (b & 1) * 2; x < w; x += 4) s.fillRect(x, y - 1, 1, 1);
      }
      s.fillStyle = '#1a0f33';
      for (let x = 0; x < w; x++) {
        const hh = 6 + 3 * Math.sin(x * 0.09) + 2 * Math.sin(x * 0.23 + 1) + ((x % 23) < 3 ? 5 : 0) + ((x % 41) < 2 ? 8 : 0);
        s.fillRect(x, h - Math.round(hh), 1, Math.round(hh));
      }
      s.fillStyle = '#c2307f';
      for (let x = 0; x < w; x++) {
        const hh = 6 + 3 * Math.sin(x * 0.09) + 2 * Math.sin(x * 0.23 + 1) + ((x % 23) < 3 ? 5 : 0) + ((x % 41) < 2 ? 8 : 0);
        if (hash(x, 5) < 0.55) s.fillRect(x, h - Math.round(hh), 1, 1);
      }
      for (let k = 0; k < (w * h) / 900; k++) { s.fillStyle = hash(k, 3) < 0.7 ? '#4a3d8f' : '#feffc5'; s.fillRect(Math.floor(hash(k, 1) * w), Math.floor(hash(k, 2) * top), 1, 1); }
      while (motes.length < Math.min(40, Math.round((w * h) / 2600))) motes.push({ x: Math.random() * w, y: Math.random() * h, v: 1 + Math.random() * 2.5, s: Math.random() * 10, c: cols[motes.length % cols.length], a: 0.5 + Math.random() * 0.5 });
      paint(0);
    };
    let t = 0;
    const paint = (dt) => {
      t += dt;
      g.drawImage(sky, 0, 0);
      for (const m of motes) {
        m.y -= m.v * dt; m.x += Math.sin(t * 0.7 + m.s) * 1.5 * dt;
        if (m.y < -2) { m.y = h + 2; m.x = Math.random() * w; }
        const tw = 0.6 + 0.4 * Math.sin(t * 2 + m.s * 3);
        g.globalAlpha = m.a * tw * 0.35; g.fillStyle = m.c;
        g.fillRect(Math.round(m.x) - 1, Math.round(m.y), 3, 1); g.fillRect(Math.round(m.x), Math.round(m.y) - 1, 1, 3);
        g.globalAlpha = m.a * tw; g.fillRect(Math.round(m.x), Math.round(m.y), 1, 1);
      }
      g.globalAlpha = 1;
    };
    let raf = 0; let last = 0; let acc = 0;
    const loop = (now) => {
      raf = requestAnimationFrame(loop);
      const dt = Math.min(0.1, (now - last) / 1000); last = now; acc += dt;
      if (acc < 1 / 15) return; // motes drift slowly, so 15 drawings a second are enough
      const t0 = performance.now(); paint(acc); acc = 0;
      if (performance.now() - t0 > 8) motes.length = Math.max(8, motes.length >> 1);
    };
    const kick = () => {
      cancelAnimationFrame(raf); raf = 0;
      if (!isCalm() && !document.hidden) { last = performance.now(); raf = requestAnimationFrame(loop); }
    };
    let rt;
    addEventListener('resize', () => { clearTimeout(rt); rt = setTimeout(resize, 150); });
    document.addEventListener('visibilitychange', kick);
    addEventListener('eas:calm', kick);
    resize(); kick();
  }

  // Pixel references stay crisp only where they land on a whole number of device pixels per art pixel (1x, 2x, 3x).
  // At any other scale nearest-neighbour makes some pixels wider than others, the fractional scaling the page warns
  // against, so those pictures are smoothed instead (.mpa-soft). The lightbox still shows every one at its own size.
  // All sizes are read first, then the classes written, once per resize.
  function pixelScale() {
    const imgs = $$('.shot.is-pixel img');
    if (!imgs.length) return;
    const run = () => {
      const dpr = window.devicePixelRatio || 1;
      const ks = imgs.map((i) => (i.getBoundingClientRect().width * dpr) / (Number(i.getAttribute('width')) || i.naturalWidth || 1));
      imgs.forEach((i, n) => { const k = ks[n]; i.classList.toggle('mpa-soft', !(k > 0.995 && Math.abs(k - Math.round(k)) < 0.003)); });
    };
    run();
    // The classes change no sizes, so watching the galleries cannot loop
    let t; const later = () => { clearTimeout(t); t = setTimeout(run, 150); };
    if (window.ResizeObserver) { const ro = new ResizeObserver(later); $$('.hero-gallery, .ref-gallery').forEach((g) => ro.observe(g)); }
    addEventListener('resize', later);
  }

  layersToc();
  ramps();
  stepFrames();
  editor();
  pixelScale();
  // The backdrop is not needed for the first paint
  (window.requestIdleCallback || ((f) => setTimeout(f, 200)))(backdrop);
})();
