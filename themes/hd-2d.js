// HD-2D: a pixel diorama under glass. The hero is a live HD-2D scene made of CSS 3D transforms: pixel textures on a tilted tile
// plane and a modelled house, billboard sprites that keep facing the camera, a lantern that follows the pointer, lights the
// sprites and throws their shadows, depth of field on the near and far rows, bloom on every light, and snow.
// The How section builds the same scene again, one step at a time, beside the steps it illustrates.
(() => {
  const root = document.documentElement;
  const $ = (q, el = document) => el.querySelector(q);
  const $$ = (q, el = document) => [...el.querySelectorAll(q)];
  const isCalm = () => root.dataset.calm === '1';
  const clamp = (x, a, b) => Math.min(b, Math.max(a, x));
  const lerp = (a, b, t) => a + (b - a) * t;
  const smooth = (a, b, x) => { const t = clamp((x - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };
  const RAD = Math.PI / 180;
  const make = (tag, cls, parent) => { const e = document.createElement(tag); if (cls) e.className = cls; if (parent) parent.append(e); return e; };
  const canvas = (w, h) => { const c = document.createElement('canvas'); c.width = Math.max(1, Math.round(w)); c.height = Math.max(1, Math.round(h)); return c; };
  const hex = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
  const hash = (x, y, s = 0) => {
    let h = Math.imul(x | 0, 374761393) ^ Math.imul(y | 0, 668265263) ^ Math.imul(s | 0, 1274126177);
    h = Math.imul(h ^ (h >>> 13), 1103515245);
    return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
  };
  const noise = (x, y, s = 0) => {
    const xi = Math.floor(x); const yi = Math.floor(y);
    const u = (x - xi) * (x - xi) * (3 - 2 * (x - xi)); const v = (y - yi) * (y - yi) * (3 - 2 * (y - yi));
    return lerp(lerp(hash(xi, yi, s), hash(xi + 1, yi, s), u), lerp(hash(xi, yi + 1, s), hash(xi + 1, yi + 1, s), u), v);
  };

  // ---------------------------------------------------------------- pixel art
  // Sprites are rows of palette letters. paint() adds the dark outline round each silhouette, as 16-bit sprites have.
  const OUTLINE = [26, 21, 37];
  function paint(rows, pal, opt = {}) {
    const p = opt.outline === false ? 0 : 1;
    const w = rows[0].length + 2 * p; const h = rows.length + 2 * p;
    const c = canvas(w, h); const g = c.getContext('2d'); const img = g.createImageData(w, h); const d = img.data;
    const cols = Object.fromEntries(Object.entries(pal).map(([k, v]) => [k, hex(v)]));
    const on = new Uint8Array(w * h);
    const glow = opt.emit ? canvas(w, h) : null; const gimg = glow ? glow.getContext('2d').createImageData(w, h) : null;
    rows.forEach((row, y) => {
      for (let x = 0; x < row.length; x++) {
        const col = cols[row[x]];
        if (!col) continue;
        const i = (y + p) * w + x + p;
        on[i] = 1;
        d.set(col, i * 4); d[i * 4 + 3] = 255;
        if (glow && opt.emit.includes(row[x])) { gimg.data.set(col, i * 4); gimg.data[i * 4 + 3] = 255; }
      }
    });
    if (p) {
      for (let i = 0; i < w * h; i++) {
        if (on[i]) continue;
        const x = i % w;
        if ((x > 0 && on[i - 1]) || (x < w - 1 && on[i + 1]) || on[i - w] || on[i + w]) { d.set(OUTLINE, i * 4); d[i * 4 + 3] = 255; }
      }
    }
    g.putImageData(img, 0, 0);
    if (glow) glow.getContext('2d').putImageData(gimg, 0, 0);
    return { base: c, emit: glow, w, h };
  }
  // Paints a canvas pixel by pixel from fn(x, y) -> [r, g, b] or null.
  function pixels(w, h, fn) {
    const c = canvas(w, h); const g = c.getContext('2d'); const img = g.createImageData(w, h);
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        const col = fn(x, y);
        if (!col) continue;
        const i = (y * w + x) * 4;
        img.data[i] = col[0]; img.data[i + 1] = col[1]; img.data[i + 2] = col[2]; img.data[i + 3] = 255;
      }
    }
    g.putImageData(img, 0, 0);
    return c;
  }

  const SKIN = { s: '#f1c39b', S: '#c98a69', e: '#2b1d2d' };
  const ART = {
    traveller: paint([
      '....cccccc....',
      'W..llcccccC...',
      'w.llcccccccC..',
      'wlcchhhhhhccC.',
      'wlchhhhhhhhcC.',
      'wlchsssssshcC.',
      'wlchsesseshcC.',
      'wlcsssssssscC.',
      'wlcSssssssScC.',
      'wlccSssssSccC.',
      'w.crrrrrrrRc..',
      'wlccrRttttccC.',
      'wscrRttttTccC.',
      'wlcRttttttTcC.',
      'wlcggggggggcC.',
      'wlcttttttttcC.',
      'wlcCttttttTCC.',
      'wlccctttttccC.',
      'wlcccttttcccC.',
      'wlcccttttcccC.',
      'w..bbB..bbB...',
      'w..bbB..bbB...',
    ], { ...SKIN, c: '#6f5d41', C: '#4a3c2a', l: '#98825a', h: '#4a2f22', r: '#b8402f', R: '#7c2a21', t: '#3d5a6c', T: '#28404f', g: '#a2793a', b: '#4b3427', B: '#2b1e16', w: '#8b6741', W: '#e0b860' }),
    cleric: paint([
      '....yyyyyy....',
      '...yyyyyyyy...',
      '..yyyyyyyyyY..',
      '.yyyyyyyyyyyY.',
      '.yysssssssyyY.',
      '.yysesssesyyY.',
      '.yysssssssyyY.',
      '.yySsssssSyyY.',
      '.yyyySSSSyyyY.',
      '.yyy.oooo.yyY.',
      '.yyooogooooyY.',
      '.yoooogoooooY.',
      '.soooogoooooOs',
      '..ooooggooooO.',
      '..oooogooooOO.',
      '..oooogooooOO.',
      '.ooooogooooOO.',
      '.ooooogoooOOO.',
      '.oooooggooOOO.',
      'oooooogoooOOOO',
      '.gggggggggggg.',
      '....bb..bb....',
    ], { ...SKIN, y: '#e9c463', Y: '#b38a3c', o: '#ece7dd', O: '#a9a6bb', g: '#d4a548', b: '#6a5a4a' }),
    merchant: paint([
      '....mmmmmm....',
      '...mmmmmmmM...',
      '...mMMMMMMM...',
      '.mmmmmmmmmmmM.',
      '..hhsssssshh..',
      '..hsessseshh..',
      '..hssssssssh..',
      '..hsSwwwwSsh..',
      '...SssssssS...',
      '...aaaaaaaa...',
      '.naaaaaaaaaAn.',
      'nnaaaaaaaaaAnn',
      'nsaaaaaaaaaAsn',
      'nnaaaaaaaaaAnn',
      'nnbbbbbbbbbbnn',
      'nnaaaaaaaaaAnn',
      '.naaaaaaaaaAn.',
      '..ppppppppPP..',
      '..pppp..ppPP..',
      '..pppp..pppP..',
      '..BBBB..BBBB..',
      '..BBBB..BBBB..',
    ], { ...SKIN, m: '#7b3a2c', M: '#4f2219', h: '#5a3a2a', w: '#5a3a2a', a: '#d9832b', A: '#9b561c', n: '#a88a5a', b: '#3a2a20', p: '#4b5a3b', P: '#323d27', B: '#2b1e16' }),
    knight: paint([
      '....hhhhhh....',
      '...hhhhhhhh...',
      '..hhhhhhhhhh..',
      '..hhhhhhhhhh..',
      '..hhsssssshh..',
      '..hsesssesSh..',
      '..hssssssssh..',
      '...sSssssSs...',
      '....SSSSSS....',
      '..rmmMMMMmmr..',
      '.rmmmmmmmmmMr.',
      'rmMmmmmmmmMMMr',
      'rsMmmmmmmmmMsr',
      'rrMmmmmmmmmMrr',
      'rrNNNNNNNNNNrr',
      'rrmmmmmmmmmMrr',
      'rrmMmmmmmmMMrr',
      '..rmmm..mmMr..',
      '..rMmm..mmMr..',
      '...Mmm..mmM...',
      '...NNN..NNN...',
      '...NNN..NNN...',
    ], { ...SKIN, h: '#2b2433', r: '#9b2b2b', m: '#bcc7d3', M: '#7b879a', N: '#454e62' }),
    brazier: paint([
      'jjjjjjjjjjjj',
      'iiiiiiiiiiii',
      '.iIIIIIIIIi.',
      '..iIIIIIIi..',
      '...iiIIii...',
      '....iIIi....',
      '....qqqQ....',
      '....qqQQ....',
      '....qqQQ....',
      '....qqQQ....',
      '...qqqqQQ...',
      '..qqqqqqQQ..',
      '.qqqqqqqqQQ.',
      'qqqqqqqqqQQQ',
    ], { j: '#9a8f9e', i: '#5b5363', I: '#3b3443', q: '#8d8b98', Q: '#5c5a69' }),
    lamp: paint([
      '...ii...', '..iiii..', '.iiiiii.', '.i1221i.', '.i2112i.', '.i2112i.', '.i1221i.', '.iiiiii.', '..iiii..',
      ...Array(21).fill('...iI...'),
      '..iiII..', '.iiiIII.', '.iiiIII.', 'iiiiIIII',
    ], { i: '#4b4655', I: '#2e2a37', 1: '#fff3c4', 2: '#ffc35a' }, { emit: '12' }),
  };
  const FLAME_PAL = { 1: '#fffbe0', 2: '#ffd46a', 3: '#ff9b2e', 4: '#d9541b' };
  const FLAMES = [
    ['....3.....', '...33.....', '...333.3..', '..33233.3.', '..32223...', '.3322233..', '.3221223..', '.3211123..', '332111233.', '.3221223..', '..32223...', '...4444...'],
    ['......3...', '.....33...', '..3..333..', '.3..33233.', '...32223..', '..3322233.', '.33221223.', '.32111123.', '.32111123.', '.33211233.', '..322223..', '...4444...'],
    ['.....3....', '....33....', '....333...', '...33233..', '.3.32223..', '..3322233.', '.3322123..', '.3211123..', '.32111123.', '.33211233.', '..322223..', '...4444...'],
  ].map((rows) => paint(rows, FLAME_PAL, { outline: false }).base);

  // Pines: tiers of needles, each with snow on its upper surface and a shadow under the tier above.
  function pine(w, h, s) {
    const R = Array.from({ length: h }, () => Array(w).fill('.'));
    const own = Array.from({ length: h }, () => Array(w).fill(-1));
    const cx = (w - 1) / 2; const trunk = 4; const tiers = 4; const span = h - trunk - 1;
    for (let t = tiers - 1; t >= 0; t--) {
      const y0 = 1 + Math.round(t * span * 0.2); const y1 = Math.min(h - trunk, y0 + Math.round(span * (0.32 + 0.06 * t)));
      const half = (w / 2 - 0.5) * (0.4 + (0.6 * (t + 1)) / tiers);
      for (let y = y0; y <= y1; y++) {
        const k = (y - y0 + 1) / (y1 - y0 + 1);
        const hw = half * k + (y === y1 ? (hash(t, y, s) - 0.5) * 2 : 0);
        for (let x = 0; x < w; x++) {
          const dx = x - cx;
          if (Math.abs(dx) > hw + 0.25) continue;
          const sh = dx / Math.max(1, hw);
          let ch = sh < -0.3 ? 'l' : sh > 0.35 ? 'd' : 'm';
          if (hash(x, y, s + 7) > 0.84) ch = ch === 'l' ? 'm' : 'd';
          if (y === y1 && hash(x, y, s + 9) > 0.55) continue;
          R[y][x] = ch; own[y][x] = t;
        }
      }
    }
    for (let y = 0; y < h - trunk; y++) {
      for (let x = 0; x < w; x++) {
        const t = own[y][x];
        if (t < 0) continue;
        const up = y > 0 ? own[y - 1][x] : -1;
        if (up !== t && (up < 0 || up < t)) {
          if (up >= 0 && up < t) { R[y][x] = 'D'; continue; }
          R[y][x] = x <= cx + 1.5 ? 'w' : 'W';
          if (y + 1 < h && own[y + 1][x] === t && hash(x, y, s + 3) > 0.45) R[y + 1][x] = x <= cx ? 'W' : R[y + 1][x];
        }
      }
    }
    for (let y = h - trunk; y < h; y++) for (let x = Math.floor(cx) - 1; x <= Math.ceil(cx) + 1; x++) R[y][x] = x <= cx ? 't' : 'T';
    return R.map((r) => r.join(''));
  }
  const PINE_PAL = { l: '#4a8059', m: '#2f5e42', d: '#1f4231', D: '#132a20', w: '#f0f5fb', W: '#b8c8de', t: '#5d4030', T: '#3b291d' };
  ART.pine = paint(pine(24, 42, 3), PINE_PAL);
  ART.pineS = paint(pine(16, 28, 8), PINE_PAL);
  ART.fence = paint([
    '.kwwk....kwwk...',
    'kwwwwk..kwwwwk..',
    '.kffk....kffk...',
    'kkkkkkkkkkkkkkkk',
    'wwwwwwwwwwwwwwww',
    'rrrrrrrrrrrrrrrr',
    'kkkkkkkkkkkkkkkk',
    '.kffk....kffk...',
    '.kfFk....kfFk...',
    'kkkkkkkkkkkkkkkk',
    'RRRRRRRRRRRRRRRR',
    'kkkkkkkkkkkkkkkk',
  ], { k: '#21182a', w: '#e9f0f8', f: '#7a573a', F: '#553b27', r: '#7f5b3c', R: '#5a3e29' }, { outline: false });
  ART.mound = paint(Array.from({ length: 6 }, (_, y) => Array.from({ length: 20 }, (_, x) => {
    const dx = (x - 9.5) / 10; const dy = (y - 5.6) / 5.6;
    if (dx * dx + dy * dy > 1) return '.';
    return dx + dy < -0.85 ? 'w' : dx > 0.45 || y > 4 ? 'V' : 'v';
  }).join('')), { w: '#f4f8fd', v: '#d7e2f0', V: '#a9bad2' }, { outline: false });

  // Ground: a 16 x 10 tile map, 16 px a tile. S snow, c cobbles, C cobbles with drifts, p trodden snow, g snow with frozen grass.
  const COLS = 16; const ROWS = 10;
  const MAP = [
    'SSSSSSSSSSgSSgSS',
    'SSSSSSSSSSSSSSgS',
    'SSSSSSSSSgSSSSSS',
    'SggSSSCCCCSSSSSg',
    'SSCCccccccccCCSS',
    'SCccccccccccccCS',
    'gCccccccccccccCS',
    'SSCcccccccccccSS',
    'SgSCCccppccCCSgS',
    'SSSSSSppppSSSSSS',
  ];
  const cobble = (x, y) => {
    const row = y >> 3; const off = (row & 1) * 4; const sx = (x + off) & 7; const sy = y & 7; const id = (x + off) >> 3;
    if (sx === 7 || sy === 7 || ((sx === 0 || sx === 6) && (sy === 0 || sy === 6))) return [52, 48, 64];
    const v = (hash(id, row, 5) - 0.5) * 28;
    const k = sx === 0 || sy === 0 ? 22 : sx === 6 || sy === 6 ? -26 : 0;
    const sp = hash(x, y, 11) > 0.92 ? -14 : 0;
    return [138 + v + k + sp, 133 + v + k + sp, 150 + v + k + sp];
  };
  const snow = (x, y, dim = 0) => {
    const n = noise(x / 5, y / 5, 21);
    const c = n < 0.34 ? [194, 208, 229] : n > 0.7 ? [239, 245, 252] : [222, 231, 243];
    if (hash(x, y, 13) > 0.986) return [255, 255, 255];
    return c.map((v) => v - dim);
  };
  const GROUND = pixels(COLS * 16, ROWS * 16, (x, y) => {
    const t = MAP[y >> 4][x >> 4];
    if (t === 'c') return cobble(x, y);
    if (t === 'C') { const n = noise(x / 6, y / 6, 4) * 0.7 + noise(x / 2.5, y / 2.5, 6) * 0.3; return n > 0.55 ? snow(x, y) : n > 0.52 ? [178, 192, 216] : cobble(x, y); }
    if (t === 'p') { const n = noise(x / 3, y / 2, 17); return n > 0.62 ? [150, 160, 186] : snow(x, y, 26); }
    if (t === 'g' && hash(x, y, 19) > 0.78 && noise(x / 4, y / 4, 23) > 0.45) return hash(x, y, 29) > 0.5 ? [58, 92, 64] : [40, 66, 48];
    return snow(x, y);
  });
  // The cut edge of the slab: a lip of snow, then soil and stones.
  const strata = (along, depth, s) => {
    if (depth < 2) return depth === 0 ? [238, 244, 251] : [196, 210, 230];
    if (depth === 2) return [58, 44, 46];
    const stone = noise(along / 3.2, depth / 2.2, s) > 0.6;
    let c = stone ? [106, 100, 114] : [80, 61, 54];
    if (stone && noise(along / 3.2, (depth - 1) / 2.2, s) <= 0.6) c = [136, 130, 144];
    if (hash(along, depth, s + 1) > 0.9) c = c.map((v) => v - 16);
    return c.map((v) => v * (1 - (depth / 11) * 0.4));
  };
  const SLAB_D = 11;
  const SLAB = {
    front: pixels(COLS * 16, SLAB_D, (x, y) => strata(x, y, 40)),
    left: pixels(SLAB_D, ROWS * 16, (x, y) => strata(y, SLAB_D - 1 - x, 50)),
    right: pixels(SLAB_D, ROWS * 16, (x, y) => strata(y, x, 60)),
  };

  // The house: a real box with pixel textures, as HD-2D builds its towns.
  const HOUSE = { u0: 1.1, v0: 0.45, w: 5, d: 2.5, h: 2, roof: 1.125 };
  const brick = (a, b, s) => {
    const row = Math.floor(b / 4); const off = (row & 1) * 4; const bx = (a + off) % 8; const by = b % 4;
    if (by === 3 || bx === 7) return [58, 54, 72];
    const v = (hash(Math.floor((a + off) / 8), row, s) - 0.5) * 22;
    return [124 + v + (by === 0 ? 14 : 0), 120 + v + (by === 0 ? 14 : 0), 138 + v + (by === 0 ? 14 : 0)];
  };
  const WIN = [[10, 20], [60, 70]];
  const glass = (x, y) => {
    for (const [a, b] of WIN) {
      if (x < a || x >= b || y < 9 || y >= 20) continue;
      if (x === a || x === b - 1 || y === 9 || y === 19) return [46, 34, 40];
      if (x === (a + b) / 2 || y === 14) return [78, 56, 44];
      return y < 14 ? [255, 228, 158] : [255, 200, 104];
    }
    return null;
  };
  const wallPx = (x, y) => {
    const g = glass(x, y);
    if (g) return g;
    if (x >= 34 && x < 46 && y >= 12) {
      const r = Math.hypot(x - 39.5, y - 17.5);
      if (y >= 17 || r <= 6) {
        if (x === 34 || x === 45 || (y < 17 && r > 5)) return [40, 30, 42];
        if (x === 43 && y === 24) return [222, 182, 92];
        return (x - 35) % 3 === 2 ? [74, 49, 32] : [110, 74, 46];
      }
    }
    if (y >= 29 && noise(x / 4, y, 71) > 0.42) return snow(x, y);
    return brick(x, y, 31);
  };
  const HW = HOUSE.w * 16; const HH = HOUSE.h * 16; const HR = Math.round(HOUSE.roof * 16); const HD = HOUSE.d * 16;
  const gable = (height, along) => height <= HH || height <= HH + HR * (1 - Math.abs((2 * along) / HD - 1));
  const sidePx = (height, along) => (gable(height, along) ? (height < 3 && noise(along / 4, height, 73) > 0.4 ? snow(along, height) : brick(along, HH + HR - height, 37)) : null);
  const LS = Math.round(Math.hypot(HD / 2, HR)); const OV = 3;
  const roofPx = (x, y, front) => {
    const eave = front ? LS - 1 - y : y;
    if (eave < 3 && (x + (eave & 1) * 2) % 5 !== 0) return eave === 0 ? [54, 58, 86] : [70, 76, 108];
    if (eave === 3) return [178, 192, 218];
    const n = noise(x / 6, y / 3, front ? 81 : 82);
    return n > 0.72 ? [244, 248, 253] : n < 0.3 ? [200, 213, 232] : [226, 234, 245];
  };
  const HOUSE_TEX = {
    front: pixels(HW, HH, wallPx),
    frontEmit: pixels(HW, HH, glass),
    left: pixels(HH + HR, HD, (x, y) => sidePx(HH + HR - 1 - x, y)),
    right: pixels(HH + HR, HD, (x, y) => sidePx(x, y)),
    roofF: pixels(HW + 2 * OV, LS, (x, y) => roofPx(x, y, true)),
    roofB: pixels(HW + 2 * OV, LS, (x, y) => roofPx(x, y, false)),
  };

  // A soft disc, for snowflakes near and far
  const FLAKE = canvas(32, 32);
  { const g = FLAKE.getContext('2d'); const gr = g.createRadialGradient(16, 16, 0, 16, 16, 16); gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(0.45, 'rgba(240,246,255,.75)'); gr.addColorStop(1, 'rgba(230,240,255,0)'); g.fillStyle = gr; g.fillRect(0, 0, 32, 32); }

  // ---------------------------------------------------------------- the scene
  // Everything standing on the plane: [art, u, v, options]. u runs across and v from the back row forward, in tiles.
  const PLACE = [
    ['pine', 12.5, 2.4, { cast: 1 }], ['pineS', 15.05, 1.35, {}], ['pine', 14.7, 3.7, { cast: 1 }], ['pineS', 0.6, 4.9, { cast: 1 }],
    ['brazier', 4.7, 4.5, { flame: 1, cast: 1 }], ['brazier', 11.3, 4.5, { flame: 1, cast: 1 }],
    ['lamp', 1.75, 7.4, { cast: 1 }],
    ['cleric', 8.8, 5.75, { cast: 1, char: 1 }], ['traveller', 7.05, 6.55, { cast: 1, char: 1 }], ['merchant', 5.35, 7.35, { cast: 1, char: 1 }], ['knight', 10.75, 7.05, { cast: 1, char: 1 }],
    ['mound', 2.8, 9.0, {}], ['mound', 13.3, 8.85, {}], ['mound', 15.0, 6.35, {}],
  ];
  for (let u = 0.5; u < COLS; u += 1) if (u < 6 || u > 10) PLACE.push(['fence', u, 9.78, { fence: 1 }]);
  const makeLights = () => [
    { u: 8, v: 6.2, h: 2.0, power: 1.3, range: 3.9, glow: 1.35, wisp: 1, f: 1 },
    { u: 4.7, v: 4.5, h: 1.2, power: 1.15, range: 3.7, glow: 1.15, f: 1 },
    { u: 11.3, v: 4.5, h: 1.2, power: 1.15, range: 3.7, glow: 1.15, f: 1 },
    { u: 1.75, v: 7.4, h: 1.9, power: 0.8, range: 2.6, glow: 0.85, f: 1 },
    { u: HOUSE.u0 + 15 / 16, v: HOUSE.v0 + HOUSE.d + 0.04, h: 1.1, power: 0.45, range: 1.8, glow: 0.6, pool: 0.55, f: 1 },
    { u: HOUSE.u0 + 65 / 16, v: HOUSE.v0 + HOUSE.d + 0.04, h: 1.1, power: 0.45, range: 1.8, glow: 0.6, pool: 0.55, f: 1 },
  ];
  const AMBIENT = [72, 86, 150]; const SPRITE_AMB = [96, 108, 170]; const WARM = [255, 212, 150];
  const KEYS = ['tilt', 'orbit', 'focus', 'aperture', 'bill', 'night', 'bloom', 'snow'];

  const tinted = (src, rgb) => {
    const c = canvas(src.width, src.height); const g = c.getContext('2d');
    g.drawImage(src, 0, 0); g.globalCompositeOperation = 'multiply'; g.fillStyle = `rgb(${rgb})`; g.fillRect(0, 0, c.width, c.height);
    g.globalCompositeOperation = 'destination-in'; g.drawImage(src, 0, 0);
    return c;
  };

  class Diorama {
    constructor(host, o) {
      this.host = host; this.o = o;
      this.s = { ...o.start }; this.goal = { ...o.start };
      this.res = Math.min(devicePixelRatio || 1, 1.5);
      this.lights = makeLights(); this.wisp = this.lights[0];
      this.aim = { u: this.wisp.u, v: this.wisp.v }; this.pointerAt = -1e9;
      this.t = 0; this.raf = 0; this.visible = false; this.camDirty = true; this.zoom = 1; this.dy = 0;
      const st = this.stage = make('div', 'hd-stage');
      st.setAttribute('aria-hidden', 'true');
      host.prepend(st);
      // Back layer: the ground, the cut sides of the slab and every shadow, all lying on the plane.
      this.back = make('div', 'hd-layer', st); this.bw = make('div', 'hd-world', this.back);
      this.ground = make('canvas', 'hd-ground', this.bw); this.gctx = this.ground.getContext('2d');
      this.slab = {};
      for (const k of ['front', 'left', 'right']) { const c = make('canvas', 'hd-face', this.bw); c.width = SLAB[k].width; c.height = SLAB[k].height; this.slab[k] = c; }
      // Two screen-space blurs, masked to the rows of ground that lie off the focal distance. The ground is flat,
      // so a screen gradient matches its depth exactly; everything standing up is blurred one by one instead.
      this.dofA = make('div', 'hd-dof', st); this.dofB = make('div', 'hd-dof', st);
      // Front layer: the house and the sprites, in the same camera.
      this.front = make('div', 'hd-layer hd-front', st); this.fw = make('div', 'hd-world', this.front);
      this.glow = make('canvas', 'hd-glow', st); this.glx = this.glow.getContext('2d');
      this.buildThings(); this.buildHouse();
      this.flakes = Array.from({ length: o.flakes || 90 }, (_, i) => ({ u: hash(i, 1, 51) * (COLS + 6) - 3, v: hash(i, 2, 51) * (ROWS + 5) - 3, h: hash(i, 3, 51) * 7.2, sp: 0.45 + hash(i, 4, 51) * 0.5, ph: hash(i, 5, 51) * 6.3, sz: 0.6 + hash(i, 6, 51) * 0.8 }));
      this.layout();
      new ResizeObserver(() => { this.layout(); this.kick(true); }).observe(host);
      new IntersectionObserver(([e]) => { this.visible = e.isIntersecting; this.kick(); }, { rootMargin: '80px' }).observe(st);
      document.addEventListener('visibilitychange', () => this.kick());
      addEventListener('eas:calm', () => this.kick(true));
      if (document.fonts) document.fonts.ready.then(() => { this.layout(); this.kick(true); });
      this.bindPointer();
    }

    buildThings() {
      this.things = PLACE.map(([name, u, v, opt]) => {
        const a = ART[name];
        const el = make('div', 'hd-obj');
        const cv = canvas(a.w, a.h); el.append(cv);
        const t = { name, u, v, a, opt, el, cv, g: cv.getContext('2d'), tint: '' };
        t.box = { w: a.w, h: a.h + (opt.flame ? 10 : 0) };
        if (opt.flame) {
          t.fl = canvas(10, 12); el.append(t.fl);
          Object.assign(cv.style, { top: `${(10 / t.box.h) * 100}%`, height: `${(a.h / t.box.h) * 100}%` });
          Object.assign(t.fl.style, { left: `${(2 / a.w) * 100}%`, width: `${(10 / a.w) * 100}%`, height: `${(12 / t.box.h) * 100}%` });
          t.fl.getContext('2d').drawImage(FLAMES[0], 0, 0);
        }
        if (opt.cast) {
          t.sil = canvas(a.w, a.h);
          const g = t.sil.getContext('2d'); g.drawImage(a.base, 0, 0); g.globalCompositeOperation = 'source-in'; g.fillStyle = '#04030c'; g.fillRect(0, 0, a.w, a.h);
        }
        return t;
      }).sort((p, q) => p.v - q.v);
      for (const t of this.things) this.fw.append(t.el);
    }

    buildHouse() {
      this.house = ['front', 'left', 'right', 'roofF', 'roofB'].map((k) => {
        const el = make('canvas', 'hd-face', this.fw); el.width = HOUSE_TEX[k].width; el.height = HOUSE_TEX[k].height;
        return { k, el, g: el.getContext('2d'), base: HOUSE_TEX[k], emit: k === 'front' ? HOUSE_TEX.frontEmit : null, tint: '' };
      });
    }

    layout() {
      const r = this.stage.getBoundingClientRect();
      if (!r.width || !r.height) return;
      this.Ws = r.width; this.Hs = r.height;
      const f = this.o.fit(this);
      const T = this.T = f.T; const S = T / 16;
      this.P = f.P; this.ox = f.ox; this.oy = f.oy;
      const W = this.W = COLS * T; const D = this.D = ROWS * T;
      this.ax = f.cx - this.ox; this.ay = f.cy - this.oy;
      // Optional bounds for the scene on the stage (the hero keeps it under its subtitle); see fitView.
      this.cxs = f.cx; this.cys = f.cy; this.lo = f.lo; this.hi = f.hi;
      for (const L of [this.back, this.front]) { L.style.perspective = `${this.P}px`; L.style.perspectiveOrigin = `${this.ox}px ${this.oy}px`; L.style.transformOrigin = `${f.cx}px ${f.cy}px`; }
      for (const w of [this.bw, this.fw]) Object.assign(w.style, { left: `${f.cx - W / 2}px`, top: `${f.cy - D / 2}px`, width: `${W}px`, height: `${D}px` });
      this.ground.width = Math.round(W * this.res); this.ground.height = Math.round(D * this.res);
      this.buildGround();
      const th = (SLAB_D / 16) * T;
      Object.assign(this.slab.front.style, { left: '0px', top: `${D}px`, width: `${W}px`, height: `${th}px`, transformOrigin: '50% 0', transform: 'rotateX(-90deg)' });
      Object.assign(this.slab.left.style, { left: `${-th}px`, top: '0px', width: `${th}px`, height: `${D}px`, transformOrigin: '100% 50%', transform: 'rotateY(-90deg)' });
      Object.assign(this.slab.right.style, { left: `${W}px`, top: '0px', width: `${th}px`, height: `${D}px`, transformOrigin: '0 50%', transform: 'rotateY(90deg)' });
      this.slabN = -1;
      for (const t of this.things) {
        const w = t.box.w * S; const h = t.box.h * S;
        Object.assign(t.el.style, { left: `${t.u * T - w / 2}px`, top: `${t.v * T - h}px`, width: `${w}px`, height: `${h}px` });
      }
      this.layoutHouse();
      this.glow.width = Math.round(this.Ws * this.res); this.glow.height = Math.round(this.Hs * this.res);
      for (const t of this.things) t.tint = '';
      for (const f2 of this.house) f2.tint = '';
      // How low the resting view reaches: a steep camera may tuck the front edge that far behind the message window.
      this.hiRest = this.lo === undefined ? 0 : Math.max(this.hi, this.reach(this.o.start).bot);
      this.applyCamera(); this.camDirty = false;
    }

    // Where the scene reaches on the stage for a camera, before any fitting: its highest point (the far edge,
    // the house ridge or the tallest sprite) and its lowest (the cut face of the slab).
    reach(cam) {
      const ct = Math.cos(cam.tilt * RAD); const st = Math.sin(cam.tilt * RAD); const cf = Math.cos(cam.orbit * RAD); const sf = Math.sin(cam.orbit * RAD);
      const T = this.T; const P = this.P; let top = Infinity; let bot = -Infinity;
      const at = (u, v, h, up = 0) => {
        const x = u * T - this.W / 2; const y = v * T - this.D / 2; const z = h * T;
        const y1 = x * sf + y * cf; const k = P / (P - (y1 * st + z * ct));
        const sy = this.oy + (this.ay + y1 * ct - z * st) * k - up * T * k;
        top = Math.min(top, sy); bot = Math.max(bot, sy);
      };
      const th = SLAB_D / 16; const H = HOUSE;
      for (const [u, v] of [[0, 0], [COLS, 0], [0, ROWS], [COLS, ROWS]]) { at(u, v, 0); at(u, v, -th); }
      for (const u of [H.u0, H.u0 + H.w]) { at(u, H.v0 + H.d / 2, H.h + H.roof); at(u, H.v0 + H.d, H.h); }
      // A billboard stands up the screen by as much of its height as the tilt it undoes leaves facing the lens
      const lean = Math.cos(cam.tilt * RAD * (1 - cam.bill));
      for (const t of this.things) at(t.u, t.v, 0, (t.box.h / 16) * lean);
      return { top, bot };
    }

    // Keeps the scene inside its bounds whatever the camera does. A flatter camera stretches the slab up the screen,
    // so the whole view shrinks about the slab's centre and moves down until nothing rises behind the subtitle.
    // It is a 2D zoom of the finished picture, applied to both layers, and project/unproject account for it.
    fitView(s) {
      let m = 1; let dy = 0;
      if (this.lo !== undefined) {
        const { top, bot } = this.reach(s);
        const hi = lerp(this.hi, this.hiRest, smooth(10, 40, s.tilt));
        const c = this.cys;
        if (bot - top > hi - this.lo) m = Math.max(0.2, (hi - this.lo) / (bot - top));
        const t1 = c + (top - c) * m; const b1 = c + (bot - c) * m;
        if (t1 < this.lo) dy = this.lo - t1;
        else if (b1 > hi) dy = Math.max(this.lo - t1, hi - b1);
      }
      this.zoom = m; this.dy = dy;
      const view = m === 1 && Math.abs(dy) < 0.01 ? 'none' : `translate(0px, ${dy.toFixed(2)}px) scale(${m.toFixed(4)})`;
      this.back.style.transform = view; this.front.style.transform = view;
    }
    view(x, y) { return [this.cxs + (x - this.cxs) * this.zoom, this.cys + (y - this.cys) * this.zoom + this.dy]; }
    unview(x, y) { return [this.cxs + (x - this.cxs) / this.zoom, this.cys + (y - this.dy - this.cys) / this.zoom]; }

    layoutHouse() {
      const H = HOUSE; const T = this.T; const set = (f, o) => Object.assign(f.el.style, o);
      const [front, left, right, rf, rb] = this.house;
      const Hp = (H.h + H.roof) * T; const Ls = (LS / 16) * T; const ov = (OV / 16) * T;
      const g = Math.atan2(H.roof, H.d / 2) / RAD;
      set(front, { left: `${H.u0 * T}px`, top: `${(H.v0 + H.d - H.h) * T}px`, width: `${H.w * T}px`, height: `${H.h * T}px`, transformOrigin: '50% 100%', transform: 'rotateX(-90deg)' });
      set(left, { left: `${H.u0 * T - Hp}px`, top: `${H.v0 * T}px`, width: `${Hp}px`, height: `${H.d * T}px`, transformOrigin: '100% 50%', transform: 'rotateY(90deg)' });
      set(right, { left: `${(H.u0 + H.w) * T}px`, top: `${H.v0 * T}px`, width: `${Hp}px`, height: `${H.d * T}px`, transformOrigin: '0 50%', transform: 'rotateY(-90deg)' });
      set(rf, { left: `${H.u0 * T - ov}px`, top: `${(H.v0 + H.d) * T - Ls}px`, width: `${H.w * T + 2 * ov}px`, height: `${Ls}px`, transformOrigin: '50% 100%', transform: `translateZ(${H.h * T}px) rotateX(${-g}deg)` });
      set(rb, { left: `${H.u0 * T - ov}px`, top: `${H.v0 * T}px`, width: `${H.w * T + 2 * ov}px`, height: `${Ls}px`, transformOrigin: '50% 0', transform: `translateZ(${H.h * T}px) rotateX(${g}deg)` });
      // Where each face sits, for its blur and its light: [u, v, height] and how strongly it faces the lights in front.
      front.at = [H.u0 + H.w / 2, H.v0 + H.d, H.h / 2]; front.span = [H.u0, H.u0 + H.w, H.v0 + H.d]; front.face = 1;
      left.at = [H.u0, H.v0 + H.d / 2, H.h / 2]; left.face = 0.45;
      right.at = [H.u0 + H.w, H.v0 + H.d / 2, H.h / 2]; right.face = 0.6;
      rf.at = [H.u0 + H.w / 2, H.v0 + H.d * 0.75, H.h + H.roof / 2]; rf.face = 0.75;
      rb.at = [H.u0 + H.w / 2, H.v0 + H.d * 0.25, H.h + H.roof / 2]; rb.face = 0.4;
    }

    buildGround() {
      const W = this.ground.width; const H = this.ground.height; const sm = this.s.smooth > 0.5;
      const up = (src) => { const k = canvas(W, H); const g = k.getContext('2d'); g.imageSmoothingEnabled = sm; g.drawImage(src, 0, 0, W, H); return k; };
      this.gDay = up(GROUND);
      this.gNight = tinted(this.gDay, AMBIENT);
      this.gWarm = tinted(this.gDay, WARM);
      this.gMask = canvas(W, H); this.gLit = canvas(W, H);
      this.groundSmooth = sm;
    }

    // From the plane (tiles, height in tiles) to the stage, through the same transforms the browser applies.
    // k is the on-screen size of one unit there, including the view's zoom; Z is the depth before it.
    project(u, v, h) {
      const T = this.T; const x = u * T - this.W / 2; const y = v * T - this.D / 2; const z = h * T;
      const x1 = x * this.cf - y * this.sf; const y1 = x * this.sf + y * this.cf;
      const Y = this.ay + y1 * this.ct - z * this.st; const Z = y1 * this.st + z * this.ct;
      const k = this.P / (this.P - Z);
      const [px, py] = this.view(this.ox + (this.ax + x1) * k, this.oy + Y * k);
      return { x: px, y: py, k: k * this.zoom, Z };
    }
    // From a point on the stage back to the plane, at a given height above it: where the lantern should float.
    unproject(sx0, sy0, h) {
      const [sx, sy] = this.unview(sx0, sy0);
      const T = this.T; const P = this.P; const z = h * T; const X0 = sx - this.ox; const Y0 = sy - this.oy;
      const den = P * this.ct + Y0 * this.st;
      if (den <= 1e-3) return null;
      const y1 = (Y0 * (P - z * this.ct) - P * (this.ay - z * this.st)) / den;
      const Z = y1 * this.st + z * this.ct;
      const x1 = (X0 * (P - Z)) / P - this.ax;
      return { u: (x1 * this.cf + y1 * this.sf + this.W / 2) / T, v: (-x1 * this.sf + y1 * this.cf + this.D / 2) / T };
    }
    groundZ(sy0) {
      const sy = this.unview(0, sy0)[1];
      const Y0 = sy - this.oy; const P = this.P; const den = P * this.ct + Y0 * this.st; const lim = Math.hypot(this.W, this.D) * 0.6;
      const y1 = den > 1e-3 ? clamp((Y0 * P - P * this.ay) / den, -lim, lim) : -lim;
      return y1 * this.st;
    }
    blurMix(Z) { const dz = Math.abs(Z - this.zf) / this.T; return [smooth(0.75, 2.1, dz), smooth(1.7, 4.0, dz)]; }
    blur(Z) { const [a, b] = this.blurMix(Z); return this.maxBlur * Math.hypot(0.42 * a, 0.9 * b); }

    applyCamera() {
      const s = this.s; const T = this.T;
      this.ct = Math.cos(s.tilt * RAD); this.st = Math.sin(s.tilt * RAD); this.cf = Math.cos(s.orbit * RAD); this.sf = Math.sin(s.orbit * RAD);
      this.fitView(s);
      const tf = `rotateX(${s.tilt.toFixed(2)}deg) rotateZ(${s.orbit.toFixed(2)}deg)`;
      this.bw.style.transform = tf; this.fw.style.transform = tf;
      // Billboards: undo the camera's turn and tilt, so each sprite faces the lens squarely, standing on its own feet.
      const bb = `rotateZ(${(-s.orbit).toFixed(2)}deg) rotateX(${(-s.tilt * s.bill).toFixed(2)}deg)`;
      this.zf = this.project(COLS / 2, s.focus, 0).Z;
      this.maxBlur = 7.5 * s.aperture * (T / 44);
      const fil = (b) => (b > 0.12 ? `blur(${b.toFixed(2)}px)` : 'none');
      for (const t of this.things) { t.el.style.transform = bb; t.el.style.filter = fil(this.blur(this.project(t.u, t.v, 0).Z)); }
      for (const f of this.house) f.el.style.filter = fil(this.blur(this.project(...f.at).Z));
      const N = 18; const A = []; const B = [];
      for (let i = 0; i <= N; i++) {
        const y = (i / N) * this.Hs; const [a, b] = this.blurMix(this.groundZ(y));
        A.push(`rgba(0,0,0,${a.toFixed(3)}) ${y.toFixed(1)}px`); B.push(`rgba(0,0,0,${b.toFixed(3)}) ${y.toFixed(1)}px`);
      }
      const mask = (el, stops, px) => {
        el.hidden = px < 0.12;
        if (el.hidden) return;
        el.style.backdropFilter = el.style.webkitBackdropFilter = `blur(${px.toFixed(2)}px)`;
        el.style.maskImage = el.style.webkitMaskImage = `linear-gradient(${stops.join(',')})`;
      };
      // These two blur the finished picture, so they shrink with the view's zoom (the sprites' own blur is inside it).
      mask(this.dofA, A, this.maxBlur * 0.42 * this.zoom); mask(this.dofB, B, this.maxBlur * 0.9 * this.zoom);
      this.stage.classList.toggle('is-smooth', s.smooth > 0.5);
      if ((s.smooth > 0.5) !== this.groundSmooth) this.buildGround();
    }

    lightAt(u, v) {
      let I = 0; let side = 0;
      for (const L of this.lights) {
        const du = L.u - u; const dv = L.v + (L.pool || 0) * 0.5 - v;
        const f = clamp(1 - Math.hypot(du, dv) / L.range, 0, 1); const i = L.power * L.f * f * f;
        if (i <= 0) continue;
        I += i; side += i * clamp((du * this.cf - dv * this.sf) / 1.2, -1, 1);
      }
      return [Math.min(I, 1.25), I > 0 ? side / I : 0];
    }
    // Night light on a sprite: its own colours where the light reaches it, dark blue where it does not,
    // brighter on the side that faces the light.
    shade(g, base, emit, w, h, I, side, holder, scale = 1) {
      const n = this.s.night;
      const col = (k) => { const ii = clamp(I * scale * (1 + 0.5 * side * k), 0, 1.25); return SPRITE_AMB.map((a, j) => Math.round(lerp(255, Math.min(255, a + WARM[j] * ii), n))); };
      const l = col(-1); const r = col(1); const key = `${l}|${r}`;
      if (key === holder.tint) return;
      holder.tint = key;
      g.globalCompositeOperation = 'source-over'; g.clearRect(0, 0, w, h); g.drawImage(base, 0, 0);
      g.globalCompositeOperation = 'multiply';
      const gr = g.createLinearGradient(0, 0, w, 0); gr.addColorStop(0, `rgb(${l})`); gr.addColorStop(1, `rgb(${r})`);
      g.fillStyle = gr; g.fillRect(0, 0, w, h);
      g.globalCompositeOperation = 'destination-in'; g.drawImage(base, 0, 0);
      g.globalCompositeOperation = 'source-over';
      if (emit) g.drawImage(emit, 0, 0);
    }

    renderGround() {
      const g = this.gctx; const n = this.s.night; const W = this.ground.width; const H = this.ground.height; const k = W / COLS;
      g.setTransform(1, 0, 0, 1, 0, 0); g.globalCompositeOperation = 'source-over'; g.globalAlpha = 1;
      if (n < 0.999) g.drawImage(this.gDay, 0, 0);
      if (n > 0.001) this.lightGround(g, n, W, H, k);
      this.shadows(g, n, k);
    }

    // Shadows are painted into the ground itself, so they lie exactly on it.
    shadows(g, n, k) {
      const tau = Math.PI * 2;
      g.save();
      if (n < 0.999) {
        // The 16-bit way: a uniform black circle parked under each character
        g.fillStyle = '#06040c'; g.globalAlpha = 1 - n;
        for (const t of this.things) if (t.opt.char) { g.beginPath(); g.ellipse(t.u * k, (t.v + 0.04) * k, 0.34 * k, 0.15 * k, 0, 0, tau); g.fill(); }
      }
      if (n > 0.001) {
        // Soft contact shadows where everything meets the ground
        for (const t of this.things) {
          if (t.opt.fence) continue;
          g.setTransform(Math.max(0.3, (t.a.w / 16) * 0.44) * k, 0, 0, 0.17 * k, t.u * k, t.v * k);
          const gr = g.createRadialGradient(0, 0, 0, 0, 0, 1);
          gr.addColorStop(0, 'rgba(2,3,14,.62)'); gr.addColorStop(0.55, 'rgba(2,3,14,.3)'); gr.addColorStop(1, 'rgba(2,3,14,0)');
          g.globalAlpha = 0.95 * n; g.fillStyle = gr; g.beginPath(); g.arc(0, 0, 1, 0, tau); g.fill();
        }
        // The lantern's shadows: each silhouette is laid on the ground at the sprite's feet and sheared away from
        // the light, longer as the light moves away and softer for being stretched.
        const L = this.wisp; g.imageSmoothingEnabled = true;
        for (const t of this.things) {
          if (!t.sil) continue;
          const du = t.u - L.u; const dv = t.v - L.v; const d = Math.hypot(du, dv);
          const op = 0.82 * n * clamp(1 - d / (L.range * 1.35), 0, 1);
          if (op < 0.01) continue;
          const len = clamp(d / Math.max(0.4, L.h - (t.a.h / 16) * 0.72), 0.16, 2.6);
          const cx = d > 1e-3 ? du / d : 0; const cy = d > 1e-3 ? dv / d : 1;
          g.setTransform(1, 0, -len * cx, -len * cy, t.u * k, t.v * k);
          const w = (t.a.w / 16) * k; const h = (t.a.h / 16) * k;
          g.globalAlpha = op; g.drawImage(t.sil, -w / 2, -h, w, h);
        }
      }
      g.restore();
    }

    lightGround(g, n, W, H, k) {
      const m = this.gMask.getContext('2d');
      m.globalCompositeOperation = 'source-over'; m.clearRect(0, 0, W, H); m.globalCompositeOperation = 'lighter';
      for (const L of this.lights) {
        const I = Math.min(1, L.power * L.f);
        if (I <= 0.01) continue;
        const x = L.u * k; const y = (L.v + (L.pool || 0)) * k; const R = L.range * k;
        const gr = m.createRadialGradient(x, y, 0, x, y, R);
        gr.addColorStop(0, `rgba(255,255,255,${I.toFixed(3)})`); gr.addColorStop(0.35, `rgba(255,255,255,${(I * 0.55).toFixed(3)})`); gr.addColorStop(1, 'rgba(255,255,255,0)');
        m.fillStyle = gr; m.fillRect(x - R, y - R, 2 * R, 2 * R);
      }
      const l = this.gLit.getContext('2d');
      l.globalCompositeOperation = 'source-over'; l.drawImage(this.gWarm, 0, 0);
      l.globalCompositeOperation = 'destination-in'; l.drawImage(this.gMask, 0, 0);
      g.globalAlpha = n; g.drawImage(this.gNight, 0, 0); g.drawImage(this.gLit, 0, 0); g.globalAlpha = 1;
    }

    lightScene() {
      const n = this.s.night;
      for (const t of this.things) { const [I, side] = this.lightAt(t.u, t.v); this.shade(t.g, t.a.base, t.a.emit, t.a.w, t.a.h, I, side, t); }
      for (const f of this.house) {
        let I; let side;
        if (f.span) {
          const [a] = this.lightAt(f.span[0] + 0.5, f.span[2] + 0.5); const [b] = this.lightAt(f.span[1] - 0.5, f.span[2] + 0.5);
          I = (a + b) / 2; side = I > 0 ? clamp((b - a) / (a + b), -1, 1) : 0;
        } else [I, side] = this.lightAt(f.at[0], f.at[1]);
        this.shade(f.g, f.base, f.emit, f.base.width, f.base.height, I, side * 0.5, f, f.face);
      }
      if (Math.abs(this.slabN - n) > 0.01) {
        this.slabN = n;
        const amb = [52, 62, 112].map((a) => Math.round(lerp(236, a, n)));
        for (const k of ['front', 'left', 'right']) { const c = this.slab[k]; const g = c.getContext('2d'); g.globalCompositeOperation = 'source-over'; g.drawImage(SLAB[k], 0, 0); g.globalCompositeOperation = 'multiply'; g.fillStyle = `rgb(${amb})`; g.fillRect(0, 0, c.width, c.height); }
      }
    }

    drawGlow() {
      const g = this.glx; const r = this.res; const n = this.s.night; const bl = this.s.bloom;
      g.setTransform(1, 0, 0, 1, 0, 0); g.clearRect(0, 0, this.glow.width, this.glow.height);
      if (n < 0.01) return;
      g.setTransform(r, 0, 0, r, 0, 0);
      g.globalCompositeOperation = 'lighter';
      for (const L of this.lights) {
        const p = this.project(L.u, L.v, L.h);
        const a = n * L.f * Math.min(1, L.power);
        if (bl > 0.01) {
          // Bloom: the brightest pixels spill light into their neighbours
          const R = L.glow * this.T * p.k * (L.wisp ? 1.1 : 1); const ab = a * bl;
          const gr = g.createRadialGradient(p.x, p.y, 0, p.x, p.y, R);
          gr.addColorStop(0, `rgba(255,240,205,${(0.85 * ab).toFixed(3)})`); gr.addColorStop(0.16, `rgba(255,198,112,${(0.45 * ab).toFixed(3)})`);
          gr.addColorStop(0.5, `rgba(255,150,60,${(0.12 * ab).toFixed(3)})`); gr.addColorStop(1, 'rgba(255,130,40,0)');
          g.fillStyle = gr; g.fillRect(p.x - R, p.y - R, 2 * R, 2 * R);
        }
        if (L.wisp) {
          // The lantern's flame, a small hot core
          const c = 0.1 * this.T * p.k;
          const gr = g.createRadialGradient(p.x, p.y, 0, p.x, p.y, c * 2.4);
          gr.addColorStop(0, `rgba(255,255,240,${a.toFixed(3)})`); gr.addColorStop(0.4, `rgba(255,226,150,${(0.85 * a).toFixed(3)})`); gr.addColorStop(1, 'rgba(255,190,90,0)');
          g.fillStyle = gr; g.fillRect(p.x - c * 2.4, p.y - c * 2.4, c * 4.8, c * 4.8);
        }
      }
      const a0 = this.s.snow * n;
      if (a0 > 0.01) {
        g.globalCompositeOperation = 'source-over';
        for (const f of this.flakes) {
          const p = this.project(f.u, f.v, f.h);
          const rr = Math.max(0.7, f.sz * 0.05 * this.T * p.k); const b = this.blur(p.Z) * this.zoom; const R = rr + b * 1.15;
          if (p.x < -R || p.y < -R || p.x > this.Ws + R || p.y > this.Hs + R) continue;
          g.globalAlpha = a0 * Math.min(0.9, (rr * rr) / (R * R) * 1.5 + 0.16);
          g.drawImage(FLAKE, p.x - R, p.y - R, 2 * R, 2 * R);
        }
        g.globalAlpha = 1;
      }
    }

    render() {
      if (this.camDirty) { this.applyCamera(); this.camDirty = false; }
      this.renderGround(); this.lightScene(); this.drawGlow();
    }

    step(dt) {
      const calm = isCalm();
      if (this.o.sweep && !calm) this.goal.orbit = -8 + 24 * Math.sin(this.t * 0.55);
      const e = calm ? 1 : 1 - Math.exp(-dt * 3.4);
      for (const k of KEYS) {
        const d = this.goal[k] - this.s[k];
        if (Math.abs(d) < 0.002) { if (d) { this.s[k] = this.goal[k]; this.camDirty = true; } continue; }
        this.s[k] += d * e; this.camDirty = true;
      }
      if (this.s.smooth !== this.goal.smooth) { this.s.smooth = this.goal.smooth; this.camDirty = true; }
      this.lights.forEach((L, i) => { if (!L.wisp) L.f = calm ? 1 : 0.9 + 0.06 * Math.sin(this.t * 6.1 + i * 1.7) + 0.04 * Math.sin(this.t * 11.3 + i * 4.1); });
      const W = this.wisp; const idle = performance.now() - this.pointerAt > 2600;
      if (idle && !calm) { this.aim.u = 8.1 + 4.2 * Math.sin(this.t * 0.21); this.aim.v = 6.1 + 1.7 * Math.sin(this.t * 0.34 + 1.2); }
      const ew = calm ? 1 : 1 - Math.exp(-dt * (idle ? 2.2 : 7));
      W.u += (this.aim.u - W.u) * ew; W.v += (this.aim.v - W.v) * ew;
      W.h = 2.0 + (calm ? 0 : 0.1 * Math.sin(this.t * 2.2));
      W.f = 1;
      const fk = calm ? 0 : Math.floor(this.t * 9) % 3;
      if (fk !== this.fk) {
        this.fk = fk;
        let i = 0;
        for (const t of this.things) if (t.fl) { const g = t.fl.getContext('2d'); g.clearRect(0, 0, 10, 12); g.drawImage(FLAMES[(fk + i++) % 3], 0, 0); }
      }
      if (this.s.snow > 0.01 && !calm) {
        for (const f of this.flakes) {
          f.h -= f.sp * dt; f.u += Math.sin(this.t * 0.7 + f.ph) * 0.2 * dt;
          if (f.h < 0) { f.h += 7.2; f.u = Math.random() * (COLS + 6) - 3; f.v = Math.random() * (ROWS + 5) - 3; }
        }
      }
    }

    frame(now) {
      this.raf = 0;
      const dt = this.last ? Math.min(0.05, (now - this.last) / 1000) : 1 / 60;
      this.last = now; this.t += dt;
      this.step(dt); this.render();
      if (this.live()) this.raf = requestAnimationFrame((t) => this.frame(t));
    }
    live() { return this.visible && !document.hidden && !isCalm(); }
    // Runs the scene while it is on screen with effects on; otherwise draws one still frame when something changes.
    kick(force) {
      if (this.raf) return;
      if (this.live()) { this.last = 0; this.raf = requestAnimationFrame((t) => this.frame(t)); return; }
      if (this.visible || force || !this.drawn) { this.step(0); this.render(); this.drawn = true; }
    }

    bindPointer() {
      const move = (e) => {
        if (this.ct === undefined) return;
        const r = this.stage.getBoundingClientRect();
        const p = this.unproject(e.clientX - r.left, e.clientY - r.top, 0);
        if (!p) return;
        this.aim.u = clamp(p.u, 0.3, COLS - 0.3); this.aim.v = clamp(p.v, 0.3, ROWS - 0.3);
        this.pointerAt = performance.now();
        this.kick(true);
      };
      this.host.addEventListener('pointermove', (e) => { if (e.pointerType === 'mouse' || e.buttons) move(e); });
      this.host.addEventListener('pointerdown', move);
    }

    keys(el) {
      el.addEventListener('keydown', (e) => {
        const step = { ArrowLeft: [-0.5, 0], ArrowRight: [0.5, 0], ArrowUp: [0, -0.5], ArrowDown: [0, 0.5] }[e.key];
        if (!step) return;
        e.preventDefault(); e.stopPropagation();
        this.aim.u = clamp(this.aim.u + step[0], 0.3, COLS - 0.3); this.aim.v = clamp(this.aim.v + step[1], 0.3, ROWS - 0.3);
        this.pointerAt = performance.now() + 4000;
        this.kick(true);
      });
    }
  }

  // ---------------------------------------------------------------- hero: the scene and its camera rig
  const HD2D = { tilt: 54, orbit: -9, focus: 6.2, aperture: 0.85, bill: 1, smooth: 0, night: 1, bloom: 1, snow: 1 };
  // The 16-bit map: no light, blur or glow, and a camera tipped just far enough to show the house front under its
  // roof, as a 16-bit town map draws buildings. Straight down, the walls would be edge-on and only the roof would show.
  const FLAT = { tilt: 22, orbit: 0, focus: 6.2, aperture: 0, bill: 1, smooth: 0, night: 0, bloom: 0, snow: 0 };
  const heroText = $('.hero-text');
  let hero = null;
  if (heroText && window.ResizeObserver) {
    const sub = $('.hero-sub', heroText) || $('.hero-title', heroText);
    const tag = $('.hero-tagline', heroText);
    hero = new Diorama(heroText, {
      start: { ...HD2D }, flakes: 110,
      fit: (d) => {
        const box = heroText.getBoundingClientRect();
        const top = sub.getBoundingClientRect().bottom - box.top + 6;
        const bot = (tag ? tag.getBoundingClientRect().top : box.bottom) - box.top - 2;
        const band = Math.max(150, bot - top);
        // On a phone the slab may run off both sides, so the sprites stay big enough to read.
        const T = clamp(Math.min(d.Ws / (d.Ws < 600 ? 13 : 16.5), band / 6.9), 17, 54);
        // lo and hi bound the scene: never behind the subtitle, and down to the message window (see fitView)
        return { T, cx: d.Ws / 2, cy: top + Math.min(band * 0.6, band / 2 + 0.6 * T), ox: d.Ws / 2, oy: top - band * 0.1, P: Math.max(1300, d.Ws * 2.2), lo: top, hi: bot };
      },
    });
    const st = hero.stage;
    st.removeAttribute('aria-hidden');
    st.tabIndex = 0;
    st.setAttribute('role', 'group');
    st.setAttribute('aria-label', 'A pixel-art town square at night, built live as an HD-2D scene. Arrow keys move the lantern.');
    hero.keys(st);

    const rig = make('div', 'hd-rig');
    rig.setAttribute('role', 'group');
    rig.setAttribute('aria-label', 'Camera for the scene above');
    const touch = matchMedia('(hover: none)').matches;
    rig.innerHTML = `<div class="hd-modes" role="group" aria-label="Look"><button type="button" data-mode="flat" aria-pressed="false">16-bit map</button><button type="button" data-mode="hd" aria-pressed="true">HD-2D</button></div>
      <div class="hd-sliders">
        <label class="hd-slider"><span>Tilt</span><input type="range" min="0" max="70" step="1" data-k="tilt"><output></output></label>
        <label class="hd-slider"><span>Turn</span><input type="range" min="-35" max="35" step="1" data-k="orbit"><output></output></label>
        <label class="hd-slider"><span>Focus</span><input type="range" min="0" max="10" step="0.1" data-k="focus"><output></output></label>
        <label class="hd-slider"><span>Blur</span><input type="range" min="0" max="1" step="0.01" data-k="aperture"><output></output></label>
      </div>
      <p class="hd-hint">${touch ? 'Tap the scene to move the lantern.' : 'Move the pointer over the scene: the lantern follows, lights the sprites and throws their shadows.'} Drag Turn and the sprites keep facing you.</p>`;
    heroText.after(rig);
    const fmt = { tilt: (v) => `${Math.round(v)}°`, orbit: (v) => `${Math.round(v)}°`, focus: (v) => `row ${Math.round(v)}`, aperture: (v) => `${Math.round(v * 100)}%` };
    const sliders = $$('input', rig);
    const paintSliders = () => sliders.forEach((i) => { i.value = hero.goal[i.dataset.k]; i.nextElementSibling.textContent = fmt[i.dataset.k](hero.goal[i.dataset.k]); });
    paintSliders();
    sliders.forEach((i) => i.addEventListener('input', () => { hero.goal[i.dataset.k] = Number(i.value); i.nextElementSibling.textContent = fmt[i.dataset.k](Number(i.value)); hero.kick(true); }));
    $$('[data-mode]', rig).forEach((b) => b.addEventListener('click', () => {
      const flat = b.dataset.mode === 'flat';
      Object.assign(hero.goal, flat ? FLAT : HD2D);
      $$('[data-mode]', rig).forEach((x) => x.setAttribute('aria-pressed', String(x === b)));
      paintSliders(); hero.kick(true);
    }));
  }

  // ---------------------------------------------------------------- How: the same scene, built up step by step
  const STEPS = [
    { tilt: 60, orbit: -10, focus: 6.2, aperture: 0, bill: 0, smooth: 1, night: 0, bloom: 0, snow: 0, cap: 'Sprites and a modelled world. The sprites still lie flat on the ground, like stickers.' },
    { tilt: 54, orbit: -10, focus: 6.2, aperture: 0, bill: 1, smooth: 1, night: 0, bloom: 0, snow: 0, sweep: 1, cap: 'Billboards. Each sprite stands up and turns to the camera, even as the view swings round.' },
    { tilt: 54, orbit: -9, focus: 6.2, aperture: 0, bill: 1, smooth: 0, night: 0, bloom: 0, snow: 0, cap: 'Nearest filtering. Every texel is a hard square again instead of a smear.' },
    { tilt: 54, orbit: -9, focus: 6.2, aperture: 0, bill: 1, smooth: 0, night: 1, bloom: 0, snow: 0, cap: 'Light. Night falls, the braziers, windows and lantern light the sprites, and each sprite throws its own shadow.' },
    { tilt: 54, orbit: -9, focus: 6.2, aperture: 0.85, bill: 1, smooth: 0, night: 1, bloom: 0, snow: 0, cap: 'Depth of field. The near and far rows go soft and the square starts to read as a model.' },
    { tilt: 54, orbit: -9, focus: 6.2, aperture: 0.85, bill: 1, smooth: 0, night: 1, bloom: 1, snow: 1, cap: 'Glow. Bright lights spill into the air around them, and snow drifts through the light.' },
  ];
  const how = $('#how');
  const stepEls = how ? $$('.step', how) : [];
  if (how && stepEls.length && window.ResizeObserver) {
    const wrap = make('div', 'hd-bench');
    wrap.innerHTML = `<div class="hd-bench-view"></div><div class="hd-bench-bar"><div class="hd-bench-nav"><div class="hd-steps" role="group" aria-label="Show the scene after each step">${STEPS.map((_, i) => `<button type="button" aria-pressed="false" aria-label="Show step ${i + 1}">${i + 1}</button>`).join('')}</div><span class="hd-bench-label">One scene, step by step</span></div><p class="hd-bench-cap"></p></div>`;
    // The steps and the scene share a row, so the scene stays beside the steps and stops when they end.
    const list = $('.steps', how);
    const pair = make('div', 'hd-how');
    list.before(pair);
    pair.append(list, wrap);
    const view = $('.hd-bench-view', wrap);
    const bench = new Diorama(view, {
      start: { ...STEPS[0] }, flakes: 70,
      fit: (d) => { const T = clamp(Math.min(d.Ws / 14, d.Hs / 7.4), 15, 46); return { T, cx: d.Ws * 0.52, cy: d.Hs * 0.6, ox: d.Ws / 2, oy: d.Hs * 0.08, P: Math.max(1100, d.Ws * 2.3) }; },
    });
    const btns = $$('.hd-steps button', wrap);
    const cap = $('.hd-bench-cap', wrap);
    let cur = -1;
    const show = (i) => {
      i = clamp(i, 0, STEPS.length - 1);
      if (i === cur) return;
      cur = i;
      const { cap: text, sweep, ...st } = STEPS[i];
      Object.assign(bench.goal, st);
      bench.o.sweep = Boolean(sweep);
      btns.forEach((b, j) => b.setAttribute('aria-pressed', String(j === i)));
      stepEls.forEach((s, j) => s.classList.toggle('is-on', j === Math.min(i, stepEls.length - 1)));
      cap.innerHTML = `<b>Step ${i + 1}</b>${text}`;
      bench.kick(true);
    };
    btns.forEach((b, i) => b.addEventListener('click', () => show(i)));
    show(0);
    const io = new IntersectionObserver((entries) => {
      for (const e of entries) if (e.isIntersecting) show(stepEls.indexOf(e.target));
    }, { rootMargin: '-46% 0px -46% 0px' });
    stepEls.forEach((s) => io.observe(s));
  }

  // ---------------------------------------------------------------- every section opens on a small floating diorama
  // A 4 x 3 tile piece of the same map with its cut sides, one light and one traveller as billboards, built once in CSS 3D.
  const ISLETS = { feel: ['traveller', 'lamp', 6, 5, -14], core: ['cleric', 'brazier', 3, 4, 12], how: ['merchant', 'pineS', 10, 3, -10], palette: ['knight', 'brazier', 6, 6, 14], vibe: ['traveller', 'pineS', 11, 6, -12], refs: ['cleric', 'lamp', 1, 4, 10] };
  const IC = 4; const IR = 3; const IT = 34; const ITILT = 56;
  const litSprite = (name, side) => {
    const a = ART[name]; const fire = name === 'brazier'; const off = fire ? 10 : 0;
    const c = canvas(a.w, a.h + off); const g = c.getContext('2d');
    g.drawImage(a.base, 0, off);
    g.globalCompositeOperation = 'multiply';
    const gr = g.createLinearGradient(0, 0, a.w, 0); const warm = 'rgb(255,222,178)'; const cool = 'rgb(110,122,186)'; const moon = 'rgb(150,164,214)';
    // side: -1 lit from the left, 1 from the right, 0 the light itself, 2 moonlight only
    const [l, r] = side === 2 ? [moon, cool] : side < 0 ? [warm, cool] : side > 0 ? [cool, warm] : [warm, 'rgb(236,206,170)'];
    gr.addColorStop(0, l); gr.addColorStop(1, r);
    g.fillStyle = gr; g.fillRect(0, off, a.w, a.h);
    g.globalCompositeOperation = 'destination-in'; g.drawImage(a.base, 0, off);
    g.globalCompositeOperation = 'source-over';
    if (a.emit) g.drawImage(a.emit, 0, off);
    if (fire) g.drawImage(FLAMES[0], 2, 0);
    return c;
  };
  for (const [id, [who, prop, gx, gy, turn]] of Object.entries(ISLETS)) {
    const sec = document.getElementById(id);
    const title = sec && $('.sec-title', sec);
    if (!title) continue;
    const el = make('div', 'hd-islet'); el.setAttribute('aria-hidden', 'true');
    el.style.animationDelay = `${(-hash(gx, gy, 3) * 7).toFixed(2)}s`;
    const w = make('div', 'hd-islet-world', el);
    w.style.transform = `rotateX(${ITILT}deg) rotateZ(${turn}deg)`;
    // Ground: night over the tiles, warm where a lamp or brazier's light falls (moonlit where there is only a pine),
    // and a soft shadow under each figure
    const K = 4; const top = canvas(IC * 16 * K, IR * 16 * K); const g = top.getContext('2d');
    const crop = (rgb) => { const c = canvas(top.width, top.height); const x = c.getContext('2d'); x.imageSmoothingEnabled = false; x.drawImage(GROUND, gx * 16, gy * 16, IC * 16, IR * 16, 0, 0, c.width, c.height); return rgb ? tinted(c, rgb) : c; };
    const pu = 1.05; const pv = 1.5; const cu = 2.75; const cv = 2.1; const k = 16 * K;
    g.drawImage(crop(AMBIENT), 0, 0);
    const lamp = prop !== 'pineS'; const a0 = lamp ? 1 : 0.5;
    el.classList.toggle('is-moon', !lamp);
    const warmTiles = crop(lamp ? WARM : [150, 168, 222]); const m = warmTiles.getContext('2d');
    const pool = m.createRadialGradient(pu * k, (pv + 0.25) * k, 0, pu * k, (pv + 0.25) * k, 2.6 * k);
    pool.addColorStop(0, `rgba(0,0,0,${a0})`); pool.addColorStop(0.4, `rgba(0,0,0,${0.55 * a0})`); pool.addColorStop(1, 'rgba(0,0,0,0)');
    m.globalCompositeOperation = 'destination-in'; m.fillStyle = pool; m.fillRect(0, 0, top.width, top.height);
    g.drawImage(warmTiles, 0, 0);
    for (const [u, v, rx] of [[pu, pv, 0.36], [cu, cv, 0.34]]) {
      g.setTransform(rx * k, 0, 0, 0.15 * k, u * k, v * k);
      const sg = g.createRadialGradient(0, 0, 0, 0, 0, 1); sg.addColorStop(0, 'rgba(2,3,14,.6)'); sg.addColorStop(1, 'rgba(2,3,14,0)');
      g.fillStyle = sg; g.beginPath(); g.arc(0, 0, 1, 0, Math.PI * 2); g.fill();
    }
    g.setTransform(1, 0, 0, 1, 0, 0);
    const W = IC * IT; const D = IR * IT; const th = (SLAB_D / 16) * IT;
    top.className = 'hd-islet-top'; Object.assign(top.style, { width: `${W}px`, height: `${D}px` }); w.append(top);
    const sides = {
      front: [pixels(IC * 16, SLAB_D, (x, y) => strata(x + gx * 16, y, 40)), { left: '0px', top: `${D}px`, width: `${W}px`, height: `${th}px`, transformOrigin: '50% 0', transform: 'rotateX(-90deg)' }],
      left: [pixels(SLAB_D, IR * 16, (x, y) => strata(y + gy * 16, SLAB_D - 1 - x, 50)), { left: `${-th}px`, top: '0px', width: `${th}px`, height: `${D}px`, transformOrigin: '100% 50%', transform: 'rotateY(-90deg)' }],
      right: [pixels(SLAB_D, IR * 16, (x, y) => strata(y + gy * 16, x, 60)), { left: `${W}px`, top: '0px', width: `${th}px`, height: `${D}px`, transformOrigin: '0 50%', transform: 'rotateY(90deg)' }],
    };
    for (const [src, css] of Object.values(sides)) { const c = tinted(src, [58, 66, 118]); Object.assign(c.style, css); w.append(c); }
    // Billboards: each figure turns back to face the camera
    for (const [name, u, v, side] of [[prop, pu, pv, lamp ? 0 : 2], [who, cu, cv, lamp ? -1 : 2]].sort((p, q) => p[2] - q[2])) {
      const c = litSprite(name, side);
      const wp = c.width * (IT / 16); const hp = c.height * (IT / 16);
      Object.assign(c.style, { left: `${u * IT - wp / 2}px`, top: `${v * IT - hp}px`, width: `${wp}px`, height: `${hp}px`, transformOrigin: '50% 100%', transform: `rotateZ(${-turn}deg) rotateX(${-ITILT}deg)` });
      w.append(c);
    }
    title.before(el);
  }

  // ---------------------------------------------------------------- the strata strip under every picture
  {
    const strip = pixels(32, 5, (x, y) => (y === 0 ? [238, 244, 251] : y === 1 ? [190, 205, 228] : strata(x, y + 1, 90)));
    root.style.setProperty('--hd-strata', `url("${strip.toDataURL()}")`);
  }

  // ---------------------------------------------------------------- snow over the whole page, in the effects layer
  const sky = $('.decor .hd-flakes');
  if (sky) {
    const g = sky.getContext('2d');
    let W = 0; let H = 0; let raf = 0; let last = 0;
    const flakes = Array.from({ length: 44 }, (_, i) => ({ x: hash(i, 1, 7), y: hash(i, 2, 7), z: hash(i, 3, 7), ph: hash(i, 4, 7) * 6.3 }));
    const size = () => { const r = Math.min(devicePixelRatio || 1, 1.5); W = innerWidth; H = innerHeight; sky.width = Math.round(W * r); sky.height = Math.round(H * r); g.setTransform(r, 0, 0, r, 0, 0); };
    const frame = (now) => {
      raf = 0;
      const dt = last ? Math.min(0.05, (now - last) / 1000) : 1 / 60; last = now;
      g.clearRect(0, 0, W, H);
      for (const f of flakes) {
        // z runs from far flakes (small, sharp) to near ones (large and out of focus)
        f.y += dt * (0.016 + f.z * 0.045); f.x += Math.sin(now / 2100 + f.ph) * dt * 0.005;
        if (f.y > 1.04) { f.y = -0.04; f.x = Math.random(); }
        const r = 1 + f.z * f.z * 10;
        g.globalAlpha = 0.55 - f.z * 0.4;
        g.drawImage(FLAKE, f.x * W - r, f.y * H - r, 2 * r, 2 * r);
      }
      g.globalAlpha = 1;
      if (!isCalm() && !document.hidden) raf = requestAnimationFrame(frame);
    };
    const start = () => { if (!raf && !isCalm() && !document.hidden) { last = 0; raf = requestAnimationFrame(frame); } };
    size();
    addEventListener('resize', size);
    addEventListener('eas:calm', start);
    document.addEventListener('visibilitychange', start);
    start();
  }
})();
