// PS1 Horror: a small software rasteriser that makes the same mistakes the console made.
// No z-buffer (painter's sort), integer vertices, screen-space texture mapping, 15-bit colour with a 4x4 dither, per-vertex fog.
// The hero examines items, the inventory section walks a corridor, and each flaw can be switched off.
(() => {
  const root = document.documentElement;
  const isCalm = () => root.dataset.calm === '1';
  const $ = (q, el = document) => el.querySelector(q);
  const $$ = (q, el = document) => [...el.querySelectorAll(q)];

  // ---- Flags ---------------------------------------------------------------------------------
  const FLAGS = [['snap', 'Snap'], ['warp', 'Warp'], ['dither', 'Dither'], ['fog', 'Fog'], ['low', '240p']];
  const flags = { snap: true, warp: true, dither: true, fog: true, low: true };
  let preset = null;
  const active = () => preset || flags;
  const viewers = [];
  const paintAll = () => viewers.forEach((v) => v.refresh());

  // ---- Textures: painted at load, 32 to 64 px, read back as raw RGBA ---------------------------
  let seed = 11;
  const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  function makeTex(s, paint) {
    const c = document.createElement('canvas');
    c.width = c.height = s;
    const g = c.getContext('2d', { willReadFrequently: true });
    paint(g, s);
    return { s, d: g.getImageData(0, 0, s, s).data };
  }
  const rect = (g, col, x, y, w, h) => { g.fillStyle = col; g.fillRect(x, y, w, h); };
  function grime(g, s, n, cols, a = 0.45, big = 2) {
    for (let i = 0; i < n; i++) {
      g.globalAlpha = rnd() * a;
      const r = 1 + Math.floor(rnd() * big);
      rect(g, cols[Math.floor(rnd() * cols.length)], Math.floor(rnd() * s), Math.floor(rnd() * s), r, r);
    }
    g.globalAlpha = 1;
  }
  const T = {
    enamel: makeTex(64, (g, s) => { rect(g, '#46604f', 0, 0, s, s); grime(g, s, 500, ['#2c3e33', '#5a7563', '#708a74', '#22302a'], 0.5, 3); rect(g, '#7c9682', 0, 0, s, 1); rect(g, '#22302a', 0, s - 2, s, 2); }),
    black: makeTex(32, (g, s) => { rect(g, '#16171a', 0, 0, s, s); grime(g, s, 120, ['#26282c', '#0b0b0d', '#34363a'], 0.5, 2); }),
    keys: makeTex(64, (g, s) => {
      rect(g, '#121310', 0, 0, s, s);
      for (let r = 0; r < 4; r++) for (let c = 0; c < 8; c++) {
        const x = 1 + c * 8 + (r % 2) * 2; const y = 2 + r * 15;
        rect(g, '#55524a', x, y, 7, 11); rect(g, '#c9c3ae', x + 1, y + 1, 5, 8); rect(g, '#6d6a5e', x + 2, y + 3, 3, 3);
      }
    }),
    paper: makeTex(64, (g, s) => {
      rect(g, '#cfc8ad', 0, 0, s, s); grime(g, s, 160, ['#b5ad90', '#9d9578', '#ddd7bf'], 0.4, 3);
      for (let y = 6; y < 58; y += 6) { let x = 5; while (x < 56) { const w = 2 + Math.floor(rnd() * 8); rect(g, '#2a2620', x, y, Math.min(w, 58 - x), 2); x += w + 2; } }
    }),
    rubber: makeTex(32, (g, s) => { rect(g, '#0c0c0e', 0, 0, s, s); for (let x = 0; x < s; x += 4) rect(g, '#222226', x, 0, 1, s); }),
    chrome: makeTex(32, (g, s) => { for (let y = 0; y < s; y++) { const v = 90 + Math.round(70 * Math.sin(y / 4)); rect(g, `rgb(${v},${v + 3},${v + 6})`, 0, y, s, 1); } grime(g, s, 60, ['#222', '#ddd'], 0.3); }),
    ribbon: makeTex(32, (g, s) => { rect(g, '#3a1114', 0, 0, s, s); for (let r = 14; r > 0; r -= 3) { g.fillStyle = r % 2 ? '#1a0a0c' : '#5e1c20'; g.beginPath(); g.arc(16, 16, r, 0, 7); g.fill(); } }),
    brass: makeTex(32, (g, s) => { rect(g, '#9a7a2c', 0, 0, s, s); grime(g, s, 200, ['#c9a84a', '#6b5218', '#4b3a12', '#e3c56a'], 0.55, 2); }),
    pot: makeTex(32, (g, s) => { rect(g, '#7c4023', 0, 0, s, s); rect(g, '#9b5a33', 0, 0, s, 6); rect(g, '#55290f', 0, 6, s, 2); grime(g, s, 90, ['#4b2613', '#a86a44'], 0.5, 2); }),
    soil: makeTex(32, (g, s) => { rect(g, '#1d130c', 0, 0, s, s); grime(g, s, 200, ['#35251a', '#0d0805', '#4d3a2a'], 0.7, 2); }),
    leaf: makeTex(64, (g, s) => {
      g.clearRect(0, 0, s, s);
      const leaf = (x, y, r, col, vein) => {
        g.save(); g.translate(x, y); g.rotate(r);
        g.fillStyle = col; g.beginPath(); g.moveTo(0, 0); g.quadraticCurveTo(15, -9, 28, 0); g.quadraticCurveTo(15, 9, 0, 0); g.fill();
        g.strokeStyle = vein; g.lineWidth = 1; g.beginPath(); g.moveTo(1, 0); g.lineTo(26, 0); g.stroke(); g.restore();
      };
      leaf(32, 62, -1.57, '#2f7a33', '#134a1c'); leaf(30, 50, -2.5, '#3b8f3a', '#17531f'); leaf(34, 50, -0.65, '#2a6f30', '#134a1c');
      leaf(30, 34, -2.2, '#47a544', '#1b5e22'); leaf(34, 34, -0.95, '#3b8f3a', '#17531f');
      const im = g.getImageData(0, 0, s, s);
      for (let i = 3; i < im.data.length; i += 4) im.data[i] = im.data[i] > 110 ? 255 : 0; // one-bit transparency, like the console
      g.putImageData(im, 0, 0);
    }),
    floor: makeTex(64, (g, s) => {
      for (let i = 0; i < 4; i++) { const v = ['#5e3216', '#6e3d1c', '#4e2912', '#633619'][i]; rect(g, v, i * 16, 0, 16, s); rect(g, '#1b0d05', i * 16, 0, 1, s); }
      rect(g, '#1b0d05', 0, 18, 16, 1); rect(g, '#1b0d05', 16, 44, 16, 1); rect(g, '#1b0d05', 32, 8, 16, 1); rect(g, '#1b0d05', 48, 34, 16, 1);
      grime(g, s, 260, ['#2a1508', '#80502a', '#3a1e0c'], 0.4, 2);
    }),
    paperwall: makeTex(64, (g, s) => {
      rect(g, '#5d5226', 0, 0, s, s);
      for (let y = -8; y < s; y += 16) for (let x = (y / 16 & 1) * 8 - 8; x < s; x += 16) {
        g.fillStyle = '#8d7b38'; g.beginPath(); g.moveTo(x + 8, y); g.lineTo(x + 14, y + 8); g.lineTo(x + 8, y + 16); g.lineTo(x + 2, y + 8); g.fill();
        rect(g, '#5d5226', x + 6, y + 6, 4, 4);
      }
      grime(g, s, 220, ['#2e2810', '#3a3214', '#a3924e'], 0.35, 3);
    }),
    panel: makeTex(64, (g, s) => { rect(g, '#2d1610', 0, 0, s, s); rect(g, '#1a0c08', 4, 8, 24, 48); rect(g, '#1a0c08', 36, 8, 24, 48); rect(g, '#3e2017', 7, 11, 18, 42); rect(g, '#3e2017', 39, 11, 18, 42); grime(g, s, 160, ['#120805', '#4d2a1e'], 0.4, 2); }),
    plaster: makeTex(32, (g, s) => { rect(g, '#46423a', 0, 0, s, s); grime(g, s, 140, ['#2a2722', '#5c574d', '#1e1c18'], 0.5, 3); }),
    door: makeTex(64, (g, s) => {
      rect(g, '#3b1f12', 0, 0, s, s); rect(g, '#22110a', 8, 5, 48, 24); rect(g, '#22110a', 8, 34, 48, 26); rect(g, '#4b2a1a', 11, 8, 42, 18); rect(g, '#4b2a1a', 11, 37, 42, 20);
      rect(g, '#d0b050', 52, 30, 4, 4); grime(g, s, 120, ['#1a0d07', '#5e3a26'], 0.35, 2);
    }),
    lamp: makeTex(32, (g, s) => { rect(g, '#efe19a', 0, 0, s, s); rect(g, '#b48f35', 0, 0, s, 3); rect(g, '#b48f35', 0, s - 3, s, 3); }),
    cloth: makeTex(32, (g, s) => { rect(g, '#2a2830', 0, 0, s, s); grime(g, s, 150, ['#17161b', '#3d3a45'], 0.5, 2); }),
    skin: makeTex(32, (g, s) => { rect(g, '#8a7566', 0, 0, s, s); rect(g, '#1a1412', 8, 13, 5, 4); rect(g, '#1a1412', 19, 13, 5, 4); rect(g, '#3a2520', 11, 23, 10, 3); }),
  };

  // ---- Meshes: polygons of [x, y, z, u, v, light], counter-clockwise from outside ----------------
  const poly = (list, tex, pts, two = false) => { list.push({ t: tex, v: pts, two, n: null }); };
  function quad(list, tex, a, b, c, d, uv = [0, 0, 1, 1], two = false, light = 1) {
    const s = tex.s; const [u0, v0, u1, v1] = uv;
    poly(list, tex, [[...a, u0 * s, v1 * s, light], [...b, u1 * s, v1 * s, light], [...c, u1 * s, v0 * s, light], [...d, u0 * s, v0 * s, light]], two);
  }
  function box(list, tex, x0, x1, y0, y1, z0, z1, top = tex, uvr = [0, 0, 1, 1]) {
    quad(list, tex, [x0, y0, z1], [x1, y0, z1], [x1, y1, z1], [x0, y1, z1], uvr);
    quad(list, tex, [x1, y0, z0], [x0, y0, z0], [x0, y1, z0], [x1, y1, z0], uvr);
    quad(list, tex, [x1, y0, z1], [x1, y0, z0], [x1, y1, z0], [x1, y1, z1], uvr);
    quad(list, tex, [x0, y0, z0], [x0, y0, z1], [x0, y1, z1], [x0, y1, z0], uvr);
    quad(list, top, [x0, y1, z1], [x1, y1, z1], [x1, y1, z0], [x0, y1, z0], uvr);
    quad(list, tex, [x0, y0, z0], [x1, y0, z0], [x1, y0, z1], [x0, y0, z1], uvr);
  }
  function cylX(list, tex, x0, x1, r, y, z, n = 6, cap = tex) {
    const p = (i) => { const a = (i / n) * Math.PI * 2; return [y + Math.sin(a) * r, z + Math.cos(a) * r]; };
    for (let i = 0; i < n; i++) {
      const [ya, za] = p(i); const [yb, zb] = p(i + 1);
      quad(list, tex, [x0, ya, za], [x1, ya, za], [x1, yb, zb], [x0, yb, zb], [i / n, 0, (i + 1) / n, 1]);
    }
    const s = cap.s;
    const capUv = (i) => [(Math.cos((i / n) * 6.283) * 0.5 + 0.5) * s, (Math.sin((i / n) * 6.283) * 0.5 + 0.5) * s, 1];
    poly(list, cap, Array.from({ length: n }, (_, i) => { const [yy, zz] = p(n - i); return [x1, yy, zz, ...capUv(i)]; }));
    poly(list, cap, Array.from({ length: n }, (_, i) => { const [yy, zz] = p(i); return [x0, yy, zz, ...capUv(i)]; }));
  }
  function cylY(list, tex, y0, y1, r0, r1, x, z, n = 6, cap = tex) {
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2; const b = ((i + 1) / n) * Math.PI * 2;
      const P = (ang, r, y) => [x + Math.sin(ang) * r, y, z + Math.cos(ang) * r];
      quad(list, tex, P(a, r0, y0), P(b, r0, y0), P(b, r1, y1), P(a, r1, y1), [i / n, 0, (i + 1) / n, 1]);
    }
    const s = cap.s;
    poly(list, cap, Array.from({ length: n }, (_, i) => { const a = (i / n) * 6.283; return [x + Math.sin(a) * r1, y1, z + Math.cos(a) * r1, (Math.sin(a) * 0.5 + 0.5) * s, (Math.cos(a) * 0.5 + 0.5) * s, 1]; }));
  }

  const items = [];
  // Typewriter: the save point
  {
    const m = [];
    // Tapered body
    const q = (a, b, c, d, t = T.enamel, uv) => quad(m, t, a, b, c, d, uv);
    q([-1.25, -.55, 1.05], [1.25, -.55, 1.05], [1.25, -.35, 1.05], [-1.25, -.35, 1.05]);
    q([-1.25, -.35, 1.05], [1.25, -.35, 1.05], [1.05, .22, -.05], [-1.05, .22, -.05], T.keys);
    q([1.25, -.55, -.9], [-1.25, -.55, -.9], [-1.05, .75, -.9], [1.05, .75, -.9]);
    const uvOf = (p) => [p[0], p[1], p[2], (p[2] + 1) * 28, (p[1] + 0.6) * 40, 1];
    poly(m, T.enamel, [[1.25, -.55, 1.05], [1.25, -.55, -.9], [1.05, .75, -.9], [1.05, .22, -.05], [1.25, -.35, 1.05]].map(uvOf));
    poly(m, T.enamel, [[-1.25, -.55, -.9], [-1.25, -.55, 1.05], [-1.25, -.35, 1.05], [-1.05, .22, -.05], [-1.05, .75, -.9]].map(uvOf));
    q([-1.05, .22, -.05], [1.05, .22, -.05], [1.05, .75, -.42], [-1.05, .75, -.42], T.black);
    q([-1.05, .75, -.42], [1.05, .75, -.42], [1.05, .75, -.9], [-1.05, .75, -.9], T.enamel);
    q([-1.25, -.55, -.9], [1.25, -.55, -.9], [1.25, -.55, 1.05], [-1.25, -.55, 1.05], T.black);
    // Platen, knobs, carriage
    cylX(m, T.rubber, -1.15, 1.15, 0.2, 0.98, -0.66, 8, T.black);
    cylX(m, T.chrome, 1.15, 1.42, 0.12, 0.98, -0.66, 6);
    cylX(m, T.chrome, -1.42, -1.15, 0.12, 0.98, -0.66, 6);
    box(m, T.chrome, -1.2, 1.2, 0.78, 0.86, -0.42, -0.34);
    // Sheet of paper, one big warped quad
    quad(m, T.paper, [-0.72, 1.14, -0.72], [0.72, 1.14, -0.72], [0.72, 2.16, -1.0], [-0.72, 2.16, -1.0], [0, 0, 1, 1], true);
    // Ribbon spools
    cylY(m, T.chrome, 0.75, 0.84, 0.26, 0.26, -0.7, -0.62, 8, T.ribbon);
    cylY(m, T.chrome, 0.75, 0.84, 0.26, 0.26, 0.7, -0.62, 8, T.ribbon);
    items.push({ name: 'Typewriter', dist: 5.4, cy: 0.45, polys: m, save: true, text: 'There is a typewriter here, with an ink ribbon in it. Would you like to save?' });
  }
  // Key
  {
    const m = [];
    const ring = (n, r0, r1, w) => {
      for (let i = 0; i < n; i++) {
        const a = (i / n) * 6.283; const b = ((i + 1) / n) * 6.283;
        const P = (ang, r, z) => [Math.cos(ang) * r, 1.0 + Math.sin(ang) * r, z];
        quad(m, T.brass, P(a, r1, w), P(b, r1, w), P(b, r0, w), P(a, r0, w));
        quad(m, T.brass, P(b, r1, -w), P(a, r1, -w), P(a, r0, -w), P(b, r0, -w));
        quad(m, T.brass, P(b, r1, -w), P(b, r1, w), P(a, r1, w), P(a, r1, -w));
        quad(m, T.brass, P(a, r0, -w), P(a, r0, w), P(b, r0, w), P(b, r0, -w));
      }
    };
    ring(8, 0.42, 0.78, 0.09);
    cylY(m, T.brass, -1.6, 0.34, 0.13, 0.13, 0, 0, 5);
    box(m, T.brass, 0.1, 0.62, -1.56, -1.3, -0.06, 0.06);
    box(m, T.brass, 0.1, 0.46, -1.16, -0.94, -0.06, 0.06);
    box(m, T.brass, -0.22, 0.22, 0.16, 0.3, -0.14, 0.14);
    box(m, T.brass, -0.22, 0.22, -0.02, 0.06, -0.14, 0.14);
    items.push({ name: 'Old key', dist: 5.2, cy: -0.2, polys: m, text: "An old key. There's a crest stamped on the bow. It doesn't fit this door." });
  }
  // Herb
  {
    const m = [];
    cylY(m, T.pot, -1.3, -0.5, 0.5, 0.72, 0, 0, 7, T.soil);
    for (const [ax, az] of [[1, 0], [0.5, 0.86], [-0.5, 0.86]]) quad(m, T.leaf, [-ax * 1.15, -0.55, -az * 1.15], [ax * 1.15, -0.55, az * 1.15], [ax * 1.15, 1.75, az * 1.15], [-ax * 1.15, 1.75, -az * 1.15], [0, 0, 1, 1], true);
    items.push({ name: 'Green herb', dist: 5.2, cy: 0.2, polys: m, text: "A green herb. It smells bitter, and it's the only thing in this building still alive." });
  }

  // Corridor, with light baked into the vertices
  const lampZ = [-4, -12, -20];
  const bake = (x, y, z) => {
    let l = 0.13;
    for (const lz of lampZ) { const dz = z - lz; l += 0.95 / (1 + (dz * dz) * 0.16 + (x * x) * 0.12 + (y - 1.9) * (y - 1.9) * 0.28); }
    return Math.min(l, 1.2);
  };
  const corridor = [];
  {
    const add = (tex, a, b, c, d, u0, v0, u1, v1) => {
      const s = tex.s;
      const pts = [[...a, u0 * s, v1 * s], [...b, u1 * s, v1 * s], [...c, u1 * s, v0 * s], [...d, u0 * s, v0 * s]].map((p) => [...p, bake(p[0], p[1], p[2])]);
      poly(corridor, tex, pts, true);
    };
    const W = 1.5; const H = 2.6; const SEG = 4; const N = 7;
    for (let i = 0; i < N; i++) {
      const z0 = -i * SEG; const z1 = z0 - SEG;
      add(T.floor, [-W, 0, z0], [W, 0, z0], [W, 0, z1], [-W, 0, z1], 0, 0, 1.5, 2);
      add(T.plaster, [-W, H, z1], [W, H, z1], [W, H, z0], [-W, H, z0], 0, 0, 2, 3);
      add(T.panel, [-W, 0, z1], [-W, 0, z0], [-W, 0.95, z0], [-W, 0.95, z1], 0, 0, 2, 1);
      add(T.panel, [W, 0, z0], [W, 0, z1], [W, 0.95, z1], [W, 0.95, z0], 0, 0, 2, 1);
      add(T.paperwall, [-W, 0.95, z1], [-W, 0.95, z0], [-W, H, z0], [-W, H, z1], 0, 0, 2.5, 1);
      add(T.paperwall, [W, 0.95, z0], [W, 0.95, z1], [W, H, z1], [W, H, z0], 0, 0, 2.5, 1);
    }
    const end = -N * SEG;
    add(T.paperwall, [-W, 0, end], [W, 0, end], [W, H, end], [-W, H, end], 0, 0, 2, 1.6);
    add(T.door, [-0.62, 0, end + 0.02], [0.62, 0, end + 0.02], [0.62, 2.1, end + 0.02], [-0.62, 2.1, end + 0.02], 0, 0, 1, 1);
    // Side doors and wall lamps
    for (const z of [-7, -15, -23]) add(T.door, [-W + 0.01, 0, z - 0.6], [-W + 0.01, 0, z + 0.6], [-W + 0.01, 2.1, z + 0.6], [-W + 0.01, 2.1, z - 0.6], 0, 0, 1, 1);
    for (const z of [-9, -18]) add(T.door, [W - 0.01, 0, z + 0.6], [W - 0.01, 0, z - 0.6], [W - 0.01, 2.1, z - 0.6], [W - 0.01, 2.1, z + 0.6], 0, 0, 1, 1);
    for (const z of lampZ) {
      for (const sx of [-1, 1]) {
        const x = sx * (W - 0.02);
        const pts = (a, b) => [[x, 1.7, a, 0, 32, 1.6], [x, 1.7, b, 32, 32, 1.6], [x, 2.1, b, 32, 0, 1.6], [x, 2.1, a, 0, 0, 1.6]];
        poly(corridor, T.lamp, pts(z - 0.16, z + 0.16), true);
      }
    }
  }
  // A figure at the end of the hall. Six boxes.
  function figure(z, walk) {
    const m = [];
    const lit = (list) => list.forEach((p) => p.v.forEach((v) => { v[5] = bake(v[0], v[1], v[2]) * 0.95; }));
    box(m, T.cloth, -0.27, 0.27, 0.92, 1.56, z - 0.14, z + 0.14);
    box(m, T.skin, -0.14, 0.14, 1.6, 1.92, z - 0.13, z + 0.13, T.cloth);
    const swing = Math.sin(walk * 7) * 0.22;
    box(m, T.cloth, -0.25, -0.05, 0, 0.92, z - 0.1 + swing, z + 0.1 + swing);
    box(m, T.cloth, 0.05, 0.25, 0, 0.92, z - 0.1 - swing, z + 0.1 - swing);
    box(m, T.cloth, -0.42, -0.28, 0.72, 1.54, z - 0.08 - swing * 0.5, z + 0.08 - swing * 0.5);
    box(m, T.cloth, 0.28, 0.42, 0.72, 1.54, z - 0.08 + swing * 0.5, z + 0.08 + swing * 0.5);
    lit(m);
    return m;
  }

  // ---- Rasteriser --------------------------------------------------------------------------------
  const BAYER = [-4, 0, -3, 1, 2, -2, 3, -1, -3, 1, -4, 0, 3, -1, 2, -2]; // 4x4 ordered dither, the console's own matrix
  const sub = (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
  const dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
  const cross = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
  const norm = (a) => { const l = Math.hypot(a[0], a[1], a[2]) || 1; return [a[0] / l, a[1] / l, a[2] / l]; };
  function lookAt(o, target) {
    const f = norm(sub(target, o));
    const r = norm(cross(f, [0, 1, 0]));
    const u = cross(r, f);
    return { o, f, r, u };
  }
  const NEAR = 0.15;

  class Viewer {
    constructor(canvas, scene, base = [192, 144]) {
      this.canvas = canvas; this.scene = scene; this.base = base; this.ctx = canvas.getContext('2d'); this.dirty = true; this.t = 0; this.visible = false;
      this.sizeFor(active());
    }

    sizeFor(fl) {
      const k = fl.low ? 1 : 3;
      if (this.k === k) return;
      this.k = k; this.W = this.base[0] * k; this.H = this.base[1] * k;
      this.canvas.width = this.W; this.canvas.height = this.H;
      this.img = this.ctx.createImageData(this.W, this.H);
    }

    refresh() { this.dirty = true; }

    tri(a, b, c, tx, fl, fog) {
      const { W, H } = this; const buf = this.img.data; const k = this.k;
      const area = (b.x - a.x) * (c.y - a.y) - (b.y - a.y) * (c.x - a.x);
      if (!area) return;
      const minX = Math.max(0, Math.floor(Math.min(a.x, b.x, c.x))); const maxX = Math.min(W - 1, Math.ceil(Math.max(a.x, b.x, c.x)));
      const minY = Math.max(0, Math.floor(Math.min(a.y, b.y, c.y))); const maxY = Math.min(H - 1, Math.ceil(Math.max(a.y, b.y, c.y)));
      const inv = 1 / area; const d = tx.d; const s = tx.s; const mask = s - 1;
      const [fr, fg, fb] = fog;
      const dx0 = (b.y - c.y) * inv; const dx1 = (c.y - a.y) * inv;
      for (let y = minY; y <= maxY; y++) {
        const py = y + 0.5; const px = minX + 0.5;
        let w0 = ((b.x - px) * (c.y - py) - (b.y - py) * (c.x - px)) * inv;
        let w1 = ((c.x - px) * (a.y - py) - (c.y - py) * (a.x - px)) * inv;
        for (let x = minX; x <= maxX; x++, w0 += dx0, w1 += dx1) {
          const w2 = 1 - w0 - w1;
          if (w0 < 0 || w1 < 0 || w2 < 0) continue;
          let u; let v;
          if (fl.warp) { u = w0 * a.u + w1 * b.u + w2 * c.u; v = w0 * a.v + w1 * b.v + w2 * c.v; } else {
            const iw = w0 * a.iw + w1 * b.iw + w2 * c.iw;
            u = (w0 * a.uw + w1 * b.uw + w2 * c.uw) / iw; v = (w0 * a.vw + w1 * b.vw + w2 * c.vw) / iw;
          }
          const ti = ((Math.floor(v) & mask) * s + (Math.floor(u) & mask)) * 4;
          if (d[ti + 3] < 128) continue;
          const l = w0 * a.l + w1 * b.l + w2 * c.l;
          const ff = w0 * a.f + w1 * b.f + w2 * c.f;
          let r = d[ti] * l; let g = d[ti + 1] * l; let bl = d[ti + 2] * l;
          if (ff > 0) { r += (fr - r) * ff; g += (fg - g) * ff; bl += (fb - bl) * ff; }
          if (fl.dither) {
            const o = BAYER[(Math.floor(y / k) & 3) * 4 + (Math.floor(x / k) & 3)];
            r += o; g += o; bl += o;
            r = r < 0 ? 0 : r > 255 ? 248 : (r >> 3) << 3; g = g < 0 ? 0 : g > 255 ? 248 : (g >> 3) << 3; bl = bl < 0 ? 0 : bl > 255 ? 248 : (bl >> 3) << 3;
          }
          const p = (y * W + x) * 4;
          buf[p] = r; buf[p + 1] = g; buf[p + 2] = bl; buf[p + 3] = 255;
        }
      }
    }

    draw() {
      const fl = active();
      this.sizeFor(fl);
      const { W, H, k } = this;
      const sc = this.scene.state(this.t, this, fl);
      const clear = fl.fog ? sc.fog : sc.bg;
      const buf = this.img.data;
      for (let i = 0; i < buf.length; i += 4) { buf[i] = clear[0]; buf[i + 1] = clear[1]; buf[i + 2] = clear[2]; buf[i + 3] = 255; }
      const cam = sc.cam; const fln = H * sc.lens;
      const out = [];
      const L = [-0.42, 0.72, 0.56];
      for (const P of sc.polys) {
        const a0 = P.v[0];
        const e1 = sub(P.v[1], a0); const e2 = sub(P.v[2], a0);
        const n = norm(cross(e1, e2));
        if (!P.two && dot(n, sub(cam.o, a0)) <= 0) continue;
        let flat = 1;
        if (sc.dyn) {
          const nc = [dot(n, cam.r), dot(n, cam.u), -dot(n, cam.f)];
          flat = 0.42 + 0.95 * Math.abs(Math.max(P.two ? -1 : 0, dot(nc, L)));
        }
        // To camera space
        let pts = P.v.map((p) => {
          const d = sub(p, cam.o);
          return { x: dot(d, cam.r), y: dot(d, cam.u), w: dot(d, cam.f), u: p[3], v: p[4], l: p[5] * flat };
        });
        // Clip against the near plane
        const clipped = [];
        for (let i = 0; i < pts.length; i++) {
          const A = pts[i]; const B = pts[(i + 1) % pts.length];
          if (A.w >= NEAR) clipped.push(A);
          if ((A.w >= NEAR) !== (B.w >= NEAR)) {
            const m = (NEAR - A.w) / (B.w - A.w);
            clipped.push({ x: A.x + (B.x - A.x) * m, y: A.y + (B.y - A.y) * m, w: NEAR, u: A.u + (B.u - A.u) * m, v: A.v + (B.v - A.v) * m, l: A.l + (B.l - A.l) * m });
          }
        }
        if (clipped.length < 3) continue;
        pts = clipped;
        let depth = 0;
        const sn = fl.snap ? k : 0;
        for (const q of pts) {
          depth += q.w;
          let sx = W / 2 + (fln * q.x) / q.w; let sy = H / 2 - (fln * q.y) / q.w;
          if (sn) { sx = Math.round(sx / sn) * sn; sy = Math.round(sy / sn) * sn; }
          q.x = sx; q.y = sy; q.iw = 1 / q.w; q.uw = q.u * q.iw; q.vw = q.v * q.iw;
          q.f = fl.fog ? Math.max(0, Math.min(1, (q.w - sc.near) / (sc.far - sc.near))) : 0;
        }
        out.push({ pts, depth: depth / pts.length, t: P.t });
      }
      // The console had no z-buffer. Everything is painted far to near, and sometimes it gets the order wrong.
      out.sort((m, n) => n.depth - m.depth);
      const fogCol = sc.fog;
      for (const o of out) for (let i = 1; i < o.pts.length - 1; i++) {
        const a = o.pts[0]; const b = o.pts[i]; const c = o.pts[i + 1];
        const ar = (b.x - a.x) * (c.y - a.y) - (b.y - a.y) * (c.x - a.x);
        if (ar === 0) continue;
        if (ar > 0) this.tri(a, c, b, o.t, fl, fogCol); else this.tri(a, b, c, o.t, fl, fogCol);
      }
      this.ctx.putImageData(this.img, 0, 0);
    }
  }

  // ---- Scenes ----------------------------------------------------------------------------------
  const itemScene = {
    index: 0, ry: -0.72, rx: 0.34,
    state(t) {
      const it = items[this.index];
      const c = Math.cos(this.rx);
      const o = [Math.sin(this.ry) * c * it.dist, it.cy + Math.sin(this.rx) * it.dist, Math.cos(this.ry) * c * it.dist];
      return { polys: it.polys, cam: lookAt(o, [0, it.cy, 0]), lens: 1.25, fog: [18, 16, 24], bg: [6, 6, 9], near: it.dist - 0.5, far: it.dist + 3.4, dyn: true };
    },
  };
  const FIXED_CAMS = [
    { o: [1.25, 2.4, -0.3], look: [-0.2, 0.9, -6], until: -8 },
    { o: [-1.25, 2.4, -15.5], look: [0.3, 0.8, -9], until: -15 },
    { o: [1.1, 0.5, -15.5], look: [-0.2, 1.5, -24], until: -99 },
  ];
  const hallScene = {
    fixed: false,
    state(t) {
      if (this.fixed) {
        const fz = -1 - ((t * 1.05) % 23);
        const cam = FIXED_CAMS.find((c) => fz > c.until);
        return { polys: [...corridor, ...figure(fz, t)], cam: lookAt(cam.o, cam.look), lens: 0.86, fog: [79, 73, 87], bg: [5, 5, 7], near: 3, far: 26, dyn: false };
      }
      const z = -1 - ((t * 0.55) % 13);
      const o = [Math.sin(t * 0.33) * 0.22, 1.5 + Math.sin(t * 2.6) * 0.022, z];
      const look = [Math.sin(t * 0.21) * 0.55, 1.34, z - 6];
      return { polys: [...corridor, ...figure(-23, 0)], cam: lookAt(o, look), lens: 0.86, fog: [79, 73, 87], bg: [5, 5, 7], near: 2.2, far: 16, dyn: false };
    },
  };

  // ---- Animation loop: 15 fps, only while visible ----------------------------------------------
  let last = 0;
  function tick(now) {
    requestAnimationFrame(tick);
    const moving = !isCalm();
    const due = moving && now - last > 66;
    if (due) last = now;
    for (const v of viewers) {
      if (!v.visible) continue;
      if (due) { v.t += 0.066; if (v.onStep) v.onStep(); v.dirty = true; }
      if (v.dirty) { v.dirty = false; v.draw(); }
    }
  }

  function observe(v) {
    if ('IntersectionObserver' in window) {
      new IntersectionObserver((es) => { v.visible = es[es.length - 1].isIntersecting; v.dirty = true; }, { rootMargin: '80px' }).observe(v.canvas);
    } else v.visible = true;
  }

  // ---- Flag buttons ----------------------------------------------------------------------------
  const flagButtons = [];
  function flagRow() {
    const row = document.createElement('div');
    row.className = 'exam-flags';
    row.setAttribute('role', 'group');
    row.setAttribute('aria-label', 'Console flaws, on or off');
    for (const [key, label] of FLAGS) {
      const b = document.createElement('button');
      b.type = 'button'; b.className = 'exam-flag'; b.textContent = label; b.dataset.flag = key;
      b.addEventListener('click', () => { preset = null; clearPinned(); flags[key] = !flags[key]; hallScene.fixed = false; syncFlags(); paintAll(); });
      row.append(b); flagButtons.push(b);
    }
    return row;
  }
  function syncFlags() {
    const a = active();
    flagButtons.forEach((b) => b.setAttribute('aria-pressed', String(Boolean(a[b.dataset.flag]))));
  }

  // ---- Hero: item examine -----------------------------------------------------------------------
  const hero = $('.hero');
  const exam = document.createElement('div');
  exam.className = 'exam';
  exam.innerHTML = `
    <div class="exam-screen"><canvas class="exam-canvas" width="192" height="144" aria-label="A low-poly item rotating in a black void. Drag to turn it."></canvas><span class="exam-tag">Examine</span></div>
    <div class="exam-bar"><button type="button" class="exam-nav" data-dir="-1" aria-label="Previous item">&#9664;</button><span class="exam-name" aria-live="polite"></span><button type="button" class="exam-nav" data-dir="1" aria-label="Next item">&#9654;</button></div>
    <div class="exam-text"><p class="exam-line"></p><div class="exam-save" hidden><button type="button" class="exam-yes">Yes</button><button type="button" class="exam-no">No</button></div></div>`;
  hero.append(exam);
  exam.append(flagRow());
  const hint = document.createElement('p');
  hint.className = 'exam-hint';
  hint.textContent = 'Switch the flaws off one at a time. The dread leaves with them.';
  exam.append(hint);

  const itemV = new Viewer($('.exam-canvas', exam), itemScene);
  itemV.onStep = () => { if (!drag) itemScene.ry += 0.022; };
  viewers.push(itemV);
  observe(itemV);

  const nameEl = $('.exam-name', exam); const lineEl = $('.exam-line', exam); const saveEl = $('.exam-save', exam);
  const saveBtn = $('.atlas [data-save]');
  const saved = () => saveBtn && saveBtn.getAttribute('aria-pressed') === 'true';
  function showItem() {
    const it = items[itemScene.index];
    nameEl.textContent = it.name;
    lineEl.textContent = it.text;
    saveEl.hidden = !it.save;
    itemV.refresh();
  }
  $$('.exam-nav', exam).forEach((b) => b.addEventListener('click', () => {
    itemScene.index = (itemScene.index + Number(b.dataset.dir) + items.length) % items.length;
    showItem();
  }));
  $('.exam-yes', exam).addEventListener('click', () => {
    if (!saved()) saveBtn?.click();
    lineEl.textContent = 'Your progress has been saved. This style is on your shortlist.';
  });
  $('.exam-no', exam).addEventListener('click', () => {
    if (saved()) { saveBtn?.click(); lineEl.textContent = 'You pull the page out of the typewriter. This style is off your shortlist.'; } else lineEl.textContent = 'You leave the typewriter alone.';
  });
  showItem();

  // Drag to turn, the way the examine screen lets you. Vertical swipes still scroll on a phone.
  let drag = null;
  const cv = itemV.canvas;
  cv.style.touchAction = 'pan-y';
  cv.addEventListener('pointerdown', (e) => { drag = { x: e.clientX, y: e.clientY }; cv.setPointerCapture(e.pointerId); });
  cv.addEventListener('pointermove', (e) => {
    if (!drag) return;
    itemScene.ry -= (e.clientX - drag.x) * 0.012;
    itemScene.rx = Math.max(-0.9, Math.min(1.2, itemScene.rx + (e.clientY - drag.y) * 0.01));
    drag = { x: e.clientX, y: e.clientY };
    itemV.refresh();
  });
  const endDrag = () => { drag = null; };
  cv.addEventListener('pointerup', endDrag);
  cv.addEventListener('pointercancel', endDrag);

  // ---- Inventory: each core element isolates its flaw in the corridor --------------------------
  const secCore = $('#core');
  const list = $('.core-list', secCore);
  const monitor = document.createElement('div');
  monitor.className = 'exam monitor';
  monitor.innerHTML = `
    <div class="exam-screen"><canvas class="monitor-canvas" width="192" height="144" aria-label="A low-poly corridor rendered with the console's flaws"></canvas><span class="exam-tag monitor-tag" aria-live="polite">All flaws on</span></div>
    <p class="exam-hint">Point at or tap an element to see only that effect in the hallway.</p>`;
  secCore.insertBefore(monitor, list);
  monitor.append(flagRow());
  const hallV = new Viewer($('.monitor-canvas', monitor), hallScene);
  viewers.push(hallV);
  observe(hallV);

  const off = { snap: false, warp: false, dither: false, fog: false, low: false };
  const PRESETS = [
    { ...off, snap: true, label: 'Only vertex snap' },
    { ...off, warp: true, label: 'Only affine warp' },
    { ...off, fog: true, label: 'Only fog' },
    { ...off, dither: true, label: 'Only dither' },
    { ...off, low: true, label: 'Only 240p' },
    { snap: true, warp: true, dither: true, fog: true, low: true, fixed: true, label: 'Fixed cameras' },
  ];
  const tag = $('.monitor-tag', monitor);
  let pinned = null;
  const coreItems = $$('.core-item', list);
  function showPreset(i) {
    if (i === null || i === undefined) { preset = null; hallScene.fixed = false; tag.textContent = 'All flaws as set'; } else {
      preset = PRESETS[i]; hallScene.fixed = Boolean(preset.fixed); tag.textContent = preset.label;
    }
    coreItems.forEach((c, n) => c.classList.toggle('is-shown', n === i));
    syncFlags();
    hallV.t = i === 5 ? 0 : hallV.t;
    paintAll();
  }
  function clearPinned() { pinned = null; coreItems.forEach((c) => { c.setAttribute('aria-pressed', 'false'); c.classList.remove('is-shown'); }); tag.textContent = 'All flaws as set'; }
  coreItems.forEach((c, i) => {
    c.tabIndex = 0;
    c.setAttribute('role', 'button');
    c.setAttribute('aria-pressed', 'false');
    c.addEventListener('mouseenter', () => { if (pinned === null) showPreset(i); });
    c.addEventListener('mouseleave', () => { if (pinned === null) showPreset(null); });
    c.addEventListener('focus', () => { if (pinned === null) showPreset(i); });
    c.addEventListener('blur', () => { if (pinned === null) showPreset(null); });
    const pin = () => {
      const on = pinned !== i;
      coreItems.forEach((x) => x.setAttribute('aria-pressed', 'false'));
      pinned = on ? i : null;
      c.setAttribute('aria-pressed', String(on));
      showPreset(pinned);
    };
    c.addEventListener('click', pin);
    c.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); pin(); } });
  });
  syncFlags();
  requestAnimationFrame(tick);
  addEventListener('eas:calm', paintAll);

  // Fog along the floor of the screen, in front of the page. Inside .fx, so calm mode removes it.
  const floorFog = document.createElement('div');
  floorFog.className = 'psx-floor-fog fx';
  floorFog.setAttribute('aria-hidden', 'true');
  floorFog.innerHTML = '<div class="fog"></div>';
  document.body.append(floorFog);

  // ---- Title: each letter is a loose vertex ------------------------------------------------------
  const title = $('.hero-title');
  if (title) {
    const text = title.textContent;
    title.setAttribute('aria-label', text);
    title.innerHTML = text.split(' ').map((word) => `<span class="w" aria-hidden="true">${[...word].map((ch, i) => `<span class="ch" style="--n:${(i * 7 + word.length * 3) % 5}">${ch}</span>`).join('')}</span>`).join(' ');
  }

  // ---- Vertex jitter is only visible when the camera moves, so the images only shiver while you scroll ----
  let still;
  addEventListener('scroll', () => {
    if (isCalm()) return;
    root.classList.add('psx-moving');
    clearTimeout(still);
    still = setTimeout(() => root.classList.remove('psx-moving'), 180);
  }, { passive: true });

  // ---- Condition monitor in the site bar: it follows how far down the page you are ------------------
  const atlas = $('.atlas');
  const ecg = document.createElement('span');
  ecg.className = 'psx-ecg';
  ecg.title = 'Condition: gets worse the further down you go';
  ecg.setAttribute('aria-hidden', 'true');
  ecg.innerHTML = '<canvas width="96" height="24"></canvas><b>Fine</b>';
  $('.atlas-here', atlas)?.after(ecg);
  const eg = $('canvas', ecg).getContext('2d');
  const ecgLabel = $('b', ecg);
  const COND = [['Fine', '#3ddc6b', 1.1], ['Caution', '#e2b13c', 1.7], ['Danger', '#ef4a33', 2.6]];
  let cond = 0; let phase = 0; let lastE = 0; const trace = new Array(96).fill(12);
  const beat = (p) => { // one heartbeat, p from 0 to 1
    if (p < 0.1) return 12 - Math.sin(p / 0.1 * Math.PI) * 2;
    if (p < 0.16) return 12 + (p - 0.1) / 0.06 * 3;
    if (p < 0.21) return 15 - (p - 0.16) / 0.05 * 13;
    if (p < 0.27) return 2 + (p - 0.21) / 0.06 * 16;
    if (p < 0.31) return 18 - (p - 0.27) / 0.04 * 6;
    if (p < 0.46) return 12 - Math.sin((p - 0.31) / 0.15 * Math.PI) * 3;
    return 12;
  };
  function readCond() {
    const max = document.documentElement.scrollHeight - innerHeight;
    const p = max > 0 ? scrollY / max : 0;
    const c = p < 0.5 ? 0 : p < 0.82 ? 1 : 2;
    if (c !== cond) { cond = c; ecgLabel.textContent = COND[c][0]; ecg.dataset.cond = COND[c][0].toLowerCase(); }
  }
  function paintEcg() {
    const [, col] = COND[cond];
    eg.clearRect(0, 0, 96, 24);
    eg.strokeStyle = 'rgba(70,90,80,.35)'; eg.lineWidth = 1;
    eg.beginPath(); for (let x = 0; x < 96; x += 12) { eg.moveTo(x + 0.5, 0); eg.lineTo(x + 0.5, 24); } eg.moveTo(0, 12.5); eg.lineTo(96, 12.5); eg.stroke();
    for (let i = 1; i < trace.length; i++) {
      eg.strokeStyle = col; eg.globalAlpha = i / trace.length;
      eg.beginPath(); eg.moveTo(i - 1, trace[i - 1]); eg.lineTo(i, trace[i]); eg.stroke();
    }
    eg.globalAlpha = 1;
  }
  function ecgTick(now) {
    requestAnimationFrame(ecgTick);
    if (now - lastE < 50) return;
    lastE = now;
    readCond();
    if (isCalm()) { trace.fill(12); paintEcg(); return; }
    phase = (phase + COND[cond][2] * 0.05) % 1;
    trace.shift(); trace.push(beat(phase));
    paintEcg();
  }
  requestAnimationFrame(ecgTick);

  // ---- The door. Every jump in the memory card goes through one, as Resident Evil's loading screens did ----
  const door = document.createElement('div');
  door.className = 'psx-door';
  door.setAttribute('aria-hidden', 'true');
  door.innerHTML = '<div class="psx-door-way"><div class="psx-door-leaf"></div></div>';
  document.body.append(door);
  let doorTimer;
  $$('.toc a').forEach((a) => a.addEventListener('click', (e) => {
    const target = $(a.getAttribute('href'));
    if (!target || isCalm() || e.metaKey || e.ctrlKey) return;
    e.preventDefault();
    clearTimeout(doorTimer);
    door.classList.remove('on');
    void door.offsetWidth;
    door.classList.add('on');
    setTimeout(() => { target.scrollIntoView({ behavior: 'instant', block: 'start' }); history.replaceState(null, '', a.getAttribute('href')); }, 780);
    doorTimer = setTimeout(() => door.classList.remove('on'), 1050);
  }));
})();
