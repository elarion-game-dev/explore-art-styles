// DOS / EGA Adventure: a small AGI-style engine. A room draws itself from line and fill commands on double-wide pixels, with a real priority screen
// so the hero walks behind things. A working text parser drives the whole page, and a score counts up as you explore.
(() => {
  const root = document.documentElement;
  const isCalm = () => root.dataset.calm === '1';
  const $ = (q, el = document) => el.querySelector(q);
  const $$ = (q, el = document) => [...el.querySelectorAll(q)];
  const read = (k) => { try { return localStorage.getItem(k); } catch { return null; } };
  const write = (k, v) => { try { localStorage.setItem(k, v); } catch { /* private window */ } };
  const make = (tag, cls, html) => { const e = document.createElement(tag); if (cls) e.className = cls; if (html !== undefined) e.innerHTML = html; return e; };

  const EGA = ['#000000', '#0000AA', '#00AA00', '#00AAAA', '#AA0000', '#AA00AA', '#AA5500', '#AAAAAA', '#555555', '#5555FF', '#55FF55', '#55FFFF', '#FF5555', '#FF55FF', '#FFFF55', '#FFFFFF'];
  const NAMES = ['Black', 'Blue', 'Green', 'Cyan', 'Red', 'Magenta', 'Brown', 'Light grey', 'Dark grey', 'Light blue', 'Light green', 'Light cyan', 'Light red', 'Light magenta', 'Yellow', 'White'];
  const RGB = EGA.map((h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16)));
  const chk = (a, b) => (x, y) => ((x + y) & 1 ? a : b);
  let seed = 84;
  const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;

  // ---- Score ------------------------------------------------------------------------------------------------
  const POINTS = { feel: 10, core: 10, how: 10, palette: 10, vibe: 10, refs: 10, look: 2, help: 1, inv: 3, priority: 10, control: 5, save: 10, door: 10, sign: 5, moat: 5, mix: 10, music: 5, getpal: 5, brief: 5 };
  const MAX = Object.values(POINTS).reduce((a, b) => a + b, 0);
  let got;
  try { got = new Set(JSON.parse(read('eas-ega-score') || '[]')); } catch { got = new Set(); }
  const scoreNow = () => [...got].reduce((a, k) => a + (POINTS[k] || 0), 0);
  const atlas = $('.atlas');
  const status = make('span', 'ega-status', `<b class="ega-score"></b><span class="ega-sound">Sound:off</span>`);
  $('.atlas-here', atlas)?.after(status);
  const scoreEl = $('.ega-score', status);
  const thanks = make('p', 'ega-thanks');
  $('.foot')?.prepend(thanks);
  function paintScore() {
    scoreEl.innerHTML = `<span class="ega-w">Score:</span>${scoreNow()}<span class="ega-w"> of </span><span class="ega-sl">/</span>${MAX}`;
    thanks.textContent = `Score:${scoreNow()} of ${MAX}. Thanks for playing.`;
  }
  function award(key) {
    if (got.has(key)) return;
    got.add(key);
    write('eas-ega-score', JSON.stringify([...got]));
    paintScore();
    scoreEl.classList.remove('up'); void scoreEl.offsetWidth; scoreEl.classList.add('up');
  }
  paintScore();

  // ---- Message box ---------------------------------------------------------------------------------------------
  const box = make('div', 'ega-box', '<p class="ega-box-t"></p><p class="ega-box-c">Press ENTER to continue</p>');
  box.hidden = true;
  box.setAttribute('role', 'status');
  document.body.append(box);
  const say = (text) => { $('.ega-box-t', box).textContent = text; box.hidden = false; };
  const hush = () => { box.hidden = true; };
  box.addEventListener('click', hush);

  // ---- The room ----------------------------------------------------------------------------------------------
  const W = 160; const H = 168;
  const vis = new Uint8Array(W * H).fill(15); const pri = new Uint8Array(W * H).fill(4); const ctl = new Uint8Array(W * H).fill(255); const inked = new Uint8Array(W * H);
  const BLOCK = 0; const SIGNAL = 2; const WATER = 3; const FREE = 255;
  const bandOf = (y) => (y < 48 ? 4 : 5 + Math.floor((y - 48) / 12));
  const P = [];
  const C = (c, p = null, k = null) => P.push(['C', c, p, k]);
  const L = (...pts) => P.push(['L', pts, false]);
  const D = (...pts) => P.push(['L', pts, true]); // detail: draws over what is already there
  const F = (x, y, fill) => P.push(['F', x, y, fill]);
  const S = (x, y, r, n, cols) => P.push(['S', x, y, r, n, cols]);
  const B = (x0, y0, x1, y1, k) => P.push(['B', x0, y0, x1, y1, k]);
  const T = (x0, y0, x1, y1, n, c) => P.push(['T', x0, y0, x1, y1, n, c]);
  const CASTLE = bandOf(86); const TREE = bandOf(152); const SIGN = bandOf(134);

  // Foreground first, so the big fills arrive last and stop at what is already drawn, as they did in AGI.
  // Door and castle
  C(0, CASTLE); L(58, 86, 58, 74, 60, 71, 63, 69, 67, 69, 70, 71, 72, 74, 72, 86, 58, 86); F(65, 80, 0);
  const stone = (edge) => (x, y) => { if (x >= edge) return chk(7, 8)(x, y); return 7; };
  C(8, CASTLE); L(34, 36, 46, 36, 46, 86, 34, 86, 34, 36); F(40, 60, stone(42));
  L(84, 36, 96, 36, 96, 86, 84, 86, 84, 36); F(90, 60, stone(92));
  L(46, 52, 49, 52, 49, 48, 53, 48, 53, 52, 57, 52, 57, 48, 61, 48, 61, 52, 65, 52, 65, 48, 69, 48, 69, 52, 73, 52, 73, 48, 77, 48, 77, 52, 81, 52, 81, 48, 84, 48);
  L(46, 86, 46, 52); L(84, 86, 84, 48); L(58, 86, 46, 86); L(72, 86, 84, 86);
  L(56, 48, 56, 28, 60, 28, 60, 25, 64, 25, 64, 28, 67, 28, 67, 25, 71, 25, 71, 28, 74, 28, 74, 48);
  L(53, 48, 56, 48); L(74, 48, 77, 48);
  F(65, 40, stone(70)); F(50, 62, stone(80));
  T(35, 37, 45, 85, 26, 8); T(85, 37, 95, 85, 26, 8); T(47, 53, 83, 85, 54, 8); T(57, 29, 73, 47, 16, 8);
  C(4, CASTLE); L(32, 36, 40, 14, 48, 36, 32, 36); F(40, 30, (x) => (x < 39 ? 12 : 4));
  L(82, 36, 90, 14, 98, 36, 82, 36); F(90, 30, (x) => (x < 89 ? 12 : 4));
  C(0, CASTLE); D(40, 14, 40, 6); D(90, 14, 90, 6); D(65, 25, 65, 12);
  C(14, CASTLE); L(41, 6, 47, 8, 41, 10, 41, 6); F(43, 8, 14); L(91, 6, 97, 8, 91, 10, 91, 6); F(93, 8, 14);
  C(12, CASTLE); L(66, 12, 73, 15, 66, 18, 66, 12); F(68, 15, 12);
  C(0, CASTLE); D(40, 46, 40, 54); D(41, 46, 41, 54); D(90, 46, 90, 54); D(89, 46, 89, 54); D(53, 60, 53, 66); D(77, 60, 77, 66);
  C(11, CASTLE); D(64, 34, 64, 41); D(65, 34, 65, 41); D(66, 34, 66, 41);
  C(8, CASTLE); D(60, 74, 60, 85); D(63, 70, 63, 85); D(67, 70, 67, 85); D(70, 74, 70, 85); D(58, 78, 72, 78); D(58, 82, 72, 82);
  // The tree
  C(0, TREE); L(118, 152, 122, 134, 122, 112, 130, 112, 130, 134, 136, 152, 118, 152); F(126, 140, (x, y) => (x > 127 ? chk(6, 0)(x, y) : 6));
  C(0, TREE); D(125, 118, 125, 150); D(122, 138, 124, 148);
  C(2, TREE); L(104, 100, 100, 88, 106, 76, 116, 70, 128, 64, 142, 68, 152, 78, 156, 92, 150, 106, 138, 114, 126, 116, 112, 112, 104, 100);
  F(128, 90, (x, y) => (x + (y * 2) < 240 ? chk(2, 10)(x, y) : y > 100 ? chk(2, 0)(x, y) : 2));
  S(118, 82, 12, 60, [10]); S(136, 76, 10, 40, [10]); S(146, 98, 9, 40, [0]); S(122, 106, 10, 40, [0]);
  // Signpost
  C(6, SIGN); L(44, 118, 44, 134); L(45, 118, 45, 134);
  C(0, SIGN); L(34, 108, 56, 108, 56, 118, 34, 118, 34, 108); F(45, 113, 14); C(0, SIGN); D(37, 111, 53, 111); D(37, 114, 50, 114);
  // Drawbridge
  C(0); L(57, 91, 73, 91, 75, 111, 55, 111, 57, 91); F(65, 100, 6); C(0); for (let y = 94; y < 111; y += 3) D(57, y, 73, y);
  // Moat
  C(1, null, WATER); L(0, 92, 28, 91, 57, 91); L(73, 91, 103, 90, 159, 89); L(0, 110, 30, 112, 55, 111); L(75, 111, 110, 112, 159, 108);
  const water = (x, y) => (y % 5 === 0 && ((x >> 2) + y) % 3 === 0 ? 9 : 1);
  F(20, 100, water); F(90, 100, water); F(157, 100, water);
  // The road, east and west
  C(6); L(55, 112, 60, 128, 72, 146, 90, 160, 120, 167); L(75, 112, 88, 124, 104, 140, 122, 155, 159, 158);
  const road = (x, y) => ((x * 3 + y * 5) % 11 === 0 ? 14 : 6);
  F(84, 140, road);
  L(60, 128, 40, 136, 0, 146); L(72, 146, 44, 150, 0, 156); F(30, 147, road);
  // Ground
  C(2); L(0, 68, 12, 64, 24, 66, 34, 70); L(96, 68, 104, 64, 116, 62, 159, 58);
  F(10, 80, chk(2, 2)); F(150, 66, chk(2, 2));
  const grass = (x, y) => { const h = (x * 7 + y * 13) % 17; if (y < 120) return h === 0 ? 10 : chk(2, 10)(x, y) === 10 && y > 114 ? 10 : 2; if (y < 136) return chk(2, 10)(x, y); return h === 0 ? 2 : 10; };
  F(20, 120, grass); F(92, 114, grass); F(20, 165, grass); F(50, 128, grass); F(150, 130, grass);
  S(16, 128, 8, 14, [12, 14, 13]); S(100, 130, 7, 10, [14, 15]); S(30, 160, 8, 14, [13, 14]); S(146, 148, 8, 12, [12, 15]);
  // Mountains, clouds, sky
  C(15); L(104, 40, 108, 34, 113, 41, 110, 39, 107, 42, 104, 40); F(108, 38, 15);
  C(8); L(0, 54, 10, 44, 20, 52, 34, 42); L(96, 42, 104, 40); L(113, 41, 122, 50, 134, 42, 148, 54, 159, 46);
  F(8, 58, chk(7, 8)); F(100, 54, chk(7, 8));
  const cloud = (x, y, w) => { C(15); L(x, y, x + 3, y - 3, x + 7, y - 4, x + w * 0.5, y - 6, x + w - 6, y - 3, x + w, y, x + w - 3, y + 2, x + 3, y + 2, x, y); F(x + w * 0.5 | 0, y - 1, 15); };
  cloud(6, 24, 22); cloud(112, 26, 18); cloud(100, 12, 14);
  C(14); L(142, 8, 147, 10, 149, 15, 147, 20, 142, 22, 137, 20, 135, 15, 137, 10, 142, 8); F(142, 15, 14);
  C(9); F(4, 4, (x, y) => (y < 24 ? 9 : y < 32 ? chk(9, 11)(x, y) : y < 42 ? 11 : chk(11, 15)(x, y)));
  // Invisible control lines, as AGI kept in the priority picture
  B(0, 86, 159, 86, BLOCK); B(118, 152, 136, 152, BLOCK); B(38, 134, 50, 134, BLOCK); B(59, 88, 71, 88, SIGNAL);

  const plot = (x, y, col, force, ink) => {
    if (x < 0 || y < 0 || x >= W || y >= H) return;
    const i = y * W + x;
    if (inked[i] && !force) return;
    vis[i] = typeof col === 'function' ? col(x, y) : col;
    inked[i] = 1;
    pri[i] = ink.p ?? bandOf(y);
    if (ink.k !== null) ctl[i] = ink.k;
  };
  const line = (x0, y0, x1, y1, f) => {
    x0 |= 0; y0 |= 0; x1 |= 0; y1 |= 0;
    const dx = Math.abs(x1 - x0); const dy = -Math.abs(y1 - y0); const sx = x0 < x1 ? 1 : -1; const sy = y0 < y1 ? 1 : -1;
    let e = dx + dy;
    for (;;) {
      f(x0, y0);
      if (x0 === x1 && y0 === y1) break;
      const e2 = 2 * e;
      if (e2 >= dy) { e += dy; x0 += sx; }
      if (e2 <= dx) { e += dx; y0 += sy; }
    }
  };
  function* painter() {
    const ink = { c: 0, p: null, k: null };
    for (const o of P) {
      if (o[0] === 'C') { [, ink.c, ink.p, ink.k] = o; continue; }
      if (o[0] === 'L') {
        const pts = o[1];
        for (let i = 0; i + 3 < pts.length; i += 2) line(pts[i], pts[i + 1], pts[i + 2], pts[i + 3], (x, y) => plot(x, y, ink.c, o[2], ink));
        yield 1;
        continue;
      }
      if (o[0] === 'B') { line(o[1], o[2], o[3], o[4], (x, y) => { ctl[y * W + x] = o[5]; }); continue; }
      if (o[0] === 'T') { // brick dashes on stone only
        for (let n = 0; n < o[5]; n++) {
          const x = o[1] + Math.floor(rnd() * (o[3] - o[1])); const y = o[2] + Math.floor(rnd() * (o[4] - o[2]));
          for (let k = 0; k < 3; k++) { const i = y * W + x + k; if (x + k < o[3] && (vis[i] === 7)) vis[i] = o[6]; }
        }
        yield 1;
        continue;
      }
      if (o[0] === 'S') { // AGI's splatter brush
        for (let n = 0; n < o[4]; n++) {
          const a = rnd() * 6.283; const r = Math.sqrt(rnd()) * o[3];
          const x = Math.round(o[1] + Math.cos(a) * r); const y = Math.round(o[2] + Math.sin(a) * r * 0.9);
          if (x >= 0 && y >= 0 && x < W && y < H) vis[y * W + x] = o[5][Math.floor(rnd() * o[5].length)];
        }
        yield 1;
        continue;
      }
      if (o[0] === 'F') { // flood fill, 4-connected, only over paper nobody has drawn on
        const stack = [[o[1], o[2]]]; let count = 0;
        while (stack.length) {
          const [x, y] = stack.shift();
          if (x < 0 || y < 0 || x >= W || y >= H || inked[y * W + x]) continue;
          plot(x, y, o[3], false, ink);
          stack.push([x + 1, y], [x - 1, y], [x, y + 1], [x, y - 1]);
          if (++count % 170 === 0) yield 1;
          if (stack.length > 4000) stack.splice(0, 2000);
        }
        yield 1;
      }
    }
  }

  // The hero: rows are doubled so he reads as chunky blocks on double-wide pixels.
  const SPR = { y: 14, r: 4, R: 12, s: 12, b: 1, B: 9, w: 6, l: 8, k: 0 };
  const SHEET = {
    down: ['..yrr..', '.rrrrr.', '..sss..', '..sss..', '.bbbbb.', 'bbbbbbb', 's.bBb.s', '..www..', '..bbb..'],
    up: ['..rry..', '.rrrrr.', '.rrrrr.', '..rrr..', '.bbbbb.', 'bbbbbbb', 's.bbb.s', '..www..', '..bbb..'],
    side: ['..rrry.', '.rrrr..', '..ssss.', '..sss..', '..bbb..', '.bbbb..', '.bbsb..', '..ww...', '..bbb..'],
  };
  const LEGS = {
    still: ['..l.l..', '..l.l..', '..k.k..'],
    a: ['..l.l..', '.l..l..', '.k..k..'],
    b: ['..l.l..', '..l..l.', '..k..k.'],
    sa: ['.l...l.', '.l...l.', 'k....k.'],
    sb: ['...l...', '...l...', '...kk..'],
  };
  const ego = { x: 72, y: 138, face: 'down', flip: false, step: 0, vx: 0, vy: 0, route: [], arrive: null, on: false };
  function egoRows() {
    const side = ego.face === 'left' || ego.face === 'right';
    const top = SHEET[side ? 'side' : ego.face];
    const moving = ego.vx || ego.vy || ego.route.length;
    const leg = !moving ? LEGS.still : side ? (ego.step % 2 ? LEGS.sa : LEGS.sb) : (ego.step % 2 ? LEGS.a : LEGS.b);
    return [...top, ...leg];
  }

  // Canvas: every AGI pixel is two canvas pixels wide
  const hero = $('.hero');
  const room = make('figure', 'ega-room', `<div class="ega-screen"><canvas width="${W * 2}" height="${H}" role="img" aria-label="A hand-drawn castle with a moat, a tree, a signpost and a small walking hero, drawn in 16 colours"></canvas></div>
    <figcaption class="ega-cap"><span class="ega-modes" role="group" aria-label="Which screen to show"><button type="button" data-mode="visual">Visual</button><button type="button" data-mode="priority">Priority</button><button type="button" data-mode="control">Control</button><button type="button" data-redraw>Redraw</button></span><span class="ega-cap-t">Drawn live from line and fill commands. Click the picture to walk.</span></figcaption>`);
  hero.prepend(room);
  const cv = $('canvas', room); const gx = cv.getContext('2d'); const img = gx.createImageData(W * 2, H);
  let mode = 'visual'; let picture = null; let dirty = true;
  const px = (x, y, c) => { const i = (y * W * 2 + x * 2) * 4; const [r, g, b] = RGB[c]; img.data[i] = r; img.data[i + 1] = g; img.data[i + 2] = b; img.data[i + 3] = 255; img.data[i + 4] = r; img.data[i + 5] = g; img.data[i + 6] = b; img.data[i + 7] = 255; };
  function blit() {
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
      const i = y * W + x;
      let c = vis[i];
      if (mode === 'priority') c = !inked[i] ? 15 : pri[i];
      if (mode === 'control') c = ctl[i] === BLOCK ? 0 : ctl[i] === SIGNAL ? 2 : ctl[i] === WATER ? 3 : 15;
      px(x, y, c);
    }
    if (ego.on) {
      const rows = egoRows(); const egoPri = bandOf(ego.y); const flip = ego.face === 'left';
      const yTop = ego.y - rows.length * 2 + 1;
      rows.forEach((row, ry) => {
        for (let rx = 0; rx < 7; rx++) {
          const ch = row[flip ? 6 - rx : rx];
          if (ch === '.') continue;
          for (let d = 0; d < 2; d++) {
            const x = ego.x + rx; const y = yTop + ry * 2 + d;
            if (x < 0 || y < 0 || x >= W || y >= H) continue;
            if (mode === 'control') continue;
            if (pri[y * W + x] > egoPri) continue; // behind the priority picture
            px(x, y, SPR[ch]);
          }
        }
      });
    }
    gx.putImageData(img, 0, 0);
  }
  function restartPicture() {
    vis.fill(15); pri.fill(4); ctl.fill(FREE); inked.fill(0); seed = 84; ego.on = false; ego.route = []; ego.vx = ego.vy = 0;
    picture = painter(); dirty = true;
    if (isCalm()) finishPicture();
  }
  function finishPicture() {
    if (picture) { let r; do { r = picture.next(); } while (!r.done); }
    picture = null; ego.on = true; dirty = true;
  }

  const go = (id) => {
    hush();
    if (id === 'top') { scrollTo({ top: 0, behavior: 'instant' }); return; }
    document.getElementById(id)?.scrollIntoView({ behavior: 'instant', block: 'start' });
    history.replaceState(null, '', `#${id}`);
  };
  const nameOf = (rel) => ($(`.atlas a[rel=${rel}]`)?.title || '').split(': ').slice(1).join(': ');

  function moveEgo() {
    if (!ego.on) return;
    let dx = ego.vx; let dy = ego.vy;
    if (ego.route.length) {
      const [tx, ty] = ego.route[0];
      if (ego.x === tx && Math.abs(ego.y - ty) < 2) {
        ego.route.shift();
        if (!ego.route.length) { const fn = ego.arrive; ego.arrive = null; dirty = true; fn?.(); }
        return;
      }
      dx = Math.sign(tx - ego.x); dy = Math.abs(ty - ego.y) < 2 ? 0 : Math.sign(ty - ego.y);
    }
    if (!dx && !dy) return;
    const free = (nx, ny) => {
      for (let i = 0; i < 7; i++) if (ctl[ny * W + nx + i] === BLOCK || ctl[(ny - 1) * W + nx + i] === BLOCK) return false;
      return true;
    };
    let nx = ego.x + dx; let ny = ego.y + dy * 2;
    if (nx < 0 || nx > W - 7) {
      const west = nx < 0; ego.vx = ego.vy = 0; ego.route = [];
      say(`The road carries on ${west ? 'west' : 'east'}, towards ${nameOf(west ? 'prev' : 'next')}. Type GO ${west ? 'WEST' : 'EAST'} to follow it.`);
      return;
    }
    if (ny > H - 1) ny = H - 1;
    if (!free(nx, ny)) {
      if (dx && free(nx, ego.y)) ny = ego.y;
      else if (dy && free(ego.x, ny)) nx = ego.x;
      else { ego.vx = ego.vy = 0; ego.route = []; dirty = true; return; }
    }
    ego.face = Math.abs(dx) >= Math.abs(dy) && dx ? (dx < 0 ? 'left' : 'right') : (dy < 0 ? 'up' : 'down');
    ego.x = nx; ego.y = ny; ego.step++; dirty = true;
    const k = ctl[ny * W + nx + 3];
    if (k === WATER) {
      ego.vx = ego.vy = 0; ego.route = [];
      award('moat');
      say('You wade into the moat. It was not, as you had hoped, a decorative moat. Thanks for playing. Press ENTER and try again.');
      ego.x = 72; ego.y = 138; ego.face = 'down';
    } else if (k === SIGNAL) {
      ego.vx = ego.vy = 0; ego.route = [];
      award('door'); say('The door creaks open. Inside, somebody has left a list of core elements.');
      setTimeout(() => { go('core'); ego.x = 62; ego.y = 94; ego.face = 'down'; dirty = true; }, isCalm() ? 0 : 700);
    }
  }
  const readSign = () => {
    award('sign');
    say(`The sign reads: EAST to ${nameOf('next')}. WEST to ${nameOf('prev')}. CASTLE: core elements. Beware of moat.`);
  };
  function walk(tx, ty, then) {
    tx = Math.max(0, Math.min(W - 7, tx)); ty = Math.max(88, Math.min(H - 1, ty));
    const across = ego.y > 111 && ty < 92; const back = ego.y < 92 && ty > 111;
    ego.vx = ego.vy = 0;
    ego.route = across || back ? [[62, across ? 114 : 89], [62, across ? 89 : 114], [tx, ty]] : [[tx, ty]];
    ego.arrive = then || null;
    if (isCalm()) { ego.x = tx; ego.y = ty; ego.route = []; ego.arrive = null; dirty = true; then?.(); }
  }
  cv.addEventListener('click', (e) => {
    if (picture) { finishPicture(); return; }
    const r = cv.getBoundingClientRect();
    const x = Math.floor(((e.clientX - r.left) / r.width) * W); const y = Math.floor(((e.clientY - r.top) / r.height) * H);
    if (x >= 34 && x <= 56 && y >= 106 && y <= 134) { walk(46, 139, readSign); return; }
    if (x >= 56 && x <= 74 && y >= 66 && y <= 88) { walk(62, 89); return; }
    if (y >= 90 && y <= 112 && (x < 54 || x > 76)) { // straight into the water, as requested
      if (isCalm()) { ego.x = x; ego.y = 98; ego.route = []; ego.vx = 0; ego.vy = 1; moveEgo(); ego.vy = 0; return; }
      ego.vx = 0; ego.route = [[x, y]]; ego.arrive = null; return;
    }
    walk(x - 3, y);
  });
  function setMode(m) {
    mode = m; dirty = true;
    $$('[data-mode]', room).forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.mode === m)));
    if (m === 'priority') award('priority');
    if (m === 'control') award('control');
  }
  $$('[data-mode]', room).forEach((b) => b.addEventListener('click', () => setMode(b.dataset.mode)));
  $('[data-redraw]', room).addEventListener('click', restartPicture);
  setMode('visual');

  let lastMove = 0;
  function frame(now) {
    requestAnimationFrame(frame);
    if (picture) {
      const t0 = performance.now();
      let r;
      do { r = picture.next(); } while (!r.done && performance.now() - t0 < 5);
      if (r.done) finishPicture();
      dirty = true;
    }
    if (now - lastMove > 80) { lastMove = now; if (!isCalm() || ego.vx || ego.vy) moveEgo(); }
    if (dirty) { dirty = false; blit(); }
  }
  restartPicture();
  requestAnimationFrame(frame);
  addEventListener('eas:calm', () => { if (isCalm() && picture) finishPicture(); dirty = true; });

  // ---- Room bands: every section is a place, painted once onto a seamless strip ------------------------------------
  function bandURL(paint) {
    const BW = 160; const BH = 80; const g = new Uint8Array(BW * BH);
    const put = (x, y, c) => { if (y >= 0 && y < BH) g[y * BW + (((Math.round(x) % BW) + BW) % BW)] = c; };
    paint(put, BW, BH);
    const c = document.createElement('canvas'); c.width = BW; c.height = BH;
    const q = c.getContext('2d'); const d = q.createImageData(BW, BH);
    g.forEach((v, i) => { d.data[i * 4] = RGB[v][0]; d.data[i * 4 + 1] = RGB[v][1]; d.data[i * 4 + 2] = RGB[v][2]; d.data[i * 4 + 3] = 255; });
    q.putImageData(d, 0, 0);
    return c.toDataURL();
  }
  const fillAll = (put, fn) => { for (let y = 0; y < 80; y++) for (let x = 0; x < 160; x++) put(x, y, fn(x, y)); };
  const hills = (put, base, waves, fn) => {
    for (let x = 0; x < 160; x++) {
      let top = base;
      for (const [k, a, ph] of waves) top += Math.sin((x / 160) * 6.2832 * k + ph) * a;
      for (let y = Math.round(top); y < 80; y++) put(x, y, fn(x, y));
    }
  };
  const blob = (put, cx, cy, rx, ry, fn) => { for (let y = -ry; y <= ry; y++) for (let x = -rx; x <= rx; x++) if ((x * x) / (rx * rx) + (y * y) / (ry * ry) <= 1) put(cx + x, cy + y, fn(cx + x, cy + y)); };
  const tree = (put, x, y, a = 2, b = 10) => { for (let i = 0; i < 9; i++) { put(x, y - i, 6); put(x + 1, y - i, 6); } blob(put, x, y - 14, 6, 8, (u, v) => (v < y - 15 ? chk(a, b)(u, v) : a)); };
  const pine = (put, x, y, h, a, b) => { for (let i = 0; i < h; i++) { const w = Math.round((i % 6 + i * 0.28) * 0.9); for (let d = -w; d <= w; d++) put(x + d, y - h + i, d < 0 && b !== undefined ? chk(a, b)(x + d, y - h + i) : a); } for (let i = 0; i < 4; i++) put(x, y + i - 1, 6); };
  const ROOMS = {
    feel(put) {
      fillAll(put, (x, y) => (y < 22 ? 9 : y < 30 ? chk(9, 11)(x, y) : 11));
      blob(put, 30, 12, 13, 4, () => 15); blob(put, 42, 15, 9, 3, () => 15); blob(put, 112, 20, 14, 4, () => 15);
      hills(put, 44, [[1, 4, 0], [3, 2, 1]], (x, y) => chk(3, 2)(x, y));
      hills(put, 58, [[2, 4, 2], [5, 1, 0]], (x, y) => (y < 66 ? chk(2, 10)(x, y) : y < 74 ? 10 : 2));
      [20, 74, 128].forEach((x, i) => tree(put, x, 62 + i));
    },
    core(put) {
      fillAll(put, (x, y) => (y < 20 ? 1 : y < 36 ? chk(1, 3)(x, y) : y < 46 ? 3 : chk(3, 10)(x, y)));
      for (let x = 4; x < 160; x += 15) pine(put, x, 64, 30 + ((x * 7) % 16), 2, 0);
      hills(put, 62, [[2, 2, 1]], (x, y) => (y < 70 ? chk(2, 0)(x, y) : 0));
      for (let x = 10; x < 160; x += 27) pine(put, x, 76, 46 + ((x * 3) % 18), 0);
    },
    how(put) {
      fillAll(put, (x, y) => (y < 30 ? 11 : chk(11, 15)(x, y)));
      blob(put, 46, 10, 11, 3, () => 15); blob(put, 132, 16, 9, 3, () => 15);
      const ridge = (x) => { const a = Math.abs(((x * 3) % 160) - 80) / 80; const b = Math.abs(((x * 5 + 30) % 160) - 80) / 80; return 18 + a * 24 + b * 14; };
      for (let x = 0; x < 160; x++) { const t = Math.round(ridge(x)); for (let y = t; y < 80; y++) put(x, y, y < t + 5 ? 15 : (x + t) % 40 < 18 ? chk(7, 8)(x, y) : 7); }
      hills(put, 58, [[3, 3, 0], [7, 1, 1]], (x, y) => (y < 68 ? chk(6, 0)(x, y) : 6));
    },
    palette(put) {
      fillAll(put, () => 0);
      for (let i = 0; i < 70; i++) put(rnd() * 160, rnd() * 50, rnd() > 0.5 ? 15 : 7);
      blob(put, 122, 22, 6, 12, (x, y) => (x * 2 + y > 266 ? 14 : 15));
      hills(put, 46, [[2, 5, 0], [5, 2, 2]], (x, y) => chk(1, 0)(x, y));
      hills(put, 62, [[3, 3, 1]], (x, y) => (y < 70 ? chk(1, 9)(x, y) && 1 : 1));
    },
    vibe(put) {
      fillAll(put, (x, y) => (y < 12 ? 5 : y < 22 ? chk(5, 13)(x, y) : y < 30 ? 13 : y < 38 ? chk(13, 12)(x, y) : y < 44 ? 12 : y < 50 ? chk(12, 14)(x, y) : 14));
      blob(put, 80, 50, 10, 20, (x, y) => (y < 44 ? 14 : 15));
      hills(put, 60, [[2, 1, 0]], (x, y) => (y < 67 ? 0 : y < 73 ? chk(0, 5)(x, y) : 5));
      [[26, 62], [124, 64], [144, 62]].forEach(([x, y]) => { for (let i = 0; i < 34; i++) { put(x + Math.sin(i * 0.08) * 3, y - i, 0); put(x + 1 + Math.sin(i * 0.08) * 3, y - i, 0); } for (const s of [-1, 1]) for (let i = 0; i < 12; i++) { const top = y - 36 + (i * i) / 5; for (let d = 0; d < 3; d++) put(x + 3 + s * i, top + d, 0); } });
    },
    refs(put) {
      fillAll(put, (x, y) => (y < 24 ? 9 : y < 34 ? chk(9, 11)(x, y) : 11));
      blob(put, 40, 14, 12, 3, () => 15); blob(put, 128, 10, 15, 4, () => 15);
      hills(put, 40, [[8, 1, 0]], (x, y) => (y < 48 ? chk(9, 1)(x, y) : y < 60 ? chk(3, 1)(x, y) : (x + y * 3) % 23 === 0 ? 11 : 3));
      const x0 = 96; for (let i = 0; i < 26; i++) { put(x0 + i, 42, 6); put(x0 + 1 + i, 43, 6); put(x0 + 3 + i * 0.85, 44, 0); }
      for (let i = 0; i < 20; i++) { put(x0 + 12, 42 - i, 0); for (let d = 1; d < 9 - i * 0.3; d++) put(x0 + 12 + d, 40 - i, 15); }
    },
    related(put) {
      fillAll(put, (x, y) => { const row = Math.floor(y / 8); const col = Math.floor((x + (row % 2) * 8) / 16); if (y % 8 === 0 || (x + (row % 2) * 8) % 16 === 0) return 0; return (row * 3 + col * 5) % 7 === 0 ? 7 : 8; });
      [36, 116].forEach((x) => { for (let i = 0; i < 12; i++) { put(x, 30 + i, 6); put(x + 1, 30 + i, 6); } blob(put, x, 26, 3, 6, (u, v) => (v > 27 ? 14 : 12)); });
      hills(put, 64, [[1, 0, 0]], (x, y) => (y < 68 ? chk(8, 0)(x, y) : 8));
    },
  };
  Object.entries(ROOMS).forEach(([id, paint]) => { const s = document.getElementById(id); if (s) s.style.setProperty('--band', `url(${bandURL(paint)})`); });

  // ---- Dither mixer: all 16 colours and all 120 mixes ----------------------------------------------------------------
  const swatches = $('.swatches');
  const mix = make('div', 'ega-mix', `<h3>All 16, and every checkerboard</h3>
    <div class="ega-mix-in"><div class="ega-grid" role="group" aria-label="All EGA colour mixes. Click to copy."></div>
    <div class="ega-read"><div class="ega-big"><span></span><span></span></div><p class="ega-read-t" aria-live="polite">Point at a square. The diagonal holds the 16 solids.</p><button class="btn" type="button" data-dl16>Download all 16 (.gpl)</button></div></div>`);
  swatches.after(mix);
  const gridEl = $('.ega-grid', mix); const readEl = $('.ega-read-t', mix);
  const bigEls = $$('.ega-big span', mix);
  const toast = (m) => { const t = $('[data-toast]'); t.textContent = m; t.classList.add('on'); setTimeout(() => t.classList.remove('on'), 1700); };
  const paintMix = (a, b) => {
    bigEls.forEach((s) => { s.style.setProperty('--a', EGA[a]); s.style.setProperty('--b', EGA[b]); });
    readEl.textContent = a === b ? `${NAMES[a]}, ${EGA[a]}` : `${NAMES[a]} + ${NAMES[b]}: ${EGA[a]} ${EGA[b]}`;
  };
  for (let a = 0; a < 16; a++) for (let b = a; b < 16; b++) {
    const c = make('button', 'ega-cell');
    c.type = 'button';
    c.style.cssText = `--a:${EGA[a]};--b:${EGA[b]};grid-row:${a + 1};grid-column:${b + 1}`;
    c.setAttribute('aria-label', a === b ? NAMES[a] : `${NAMES[a]} and ${NAMES[b]}`);
    c.addEventListener('pointerenter', () => paintMix(a, b));
    c.addEventListener('focus', () => paintMix(a, b));
    c.addEventListener('click', () => {
      paintMix(a, b);
      const text = a === b ? EGA[a] : `${EGA[a]} ${EGA[b]}`;
      navigator.clipboard?.writeText(text).catch(() => {});
      toast(`Copied ${text}`);
      award('mix');
    });
    gridEl.append(c);
  }
  paintMix(9, 15);
  $('[data-dl16]', mix).addEventListener('click', () => {
    const rows = RGB.map((v, i) => `${v.map((n) => String(n).padStart(3)).join(' ')}\t${NAMES[i]}`).join('\n');
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([`GIMP Palette\nName: EGA 16\nColumns: 8\n#\n${rows}\n`], { type: 'text/plain' }));
    a.download = 'ega-16.gpl'; a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 2000);
    award('getpal');
  });

  // ---- Points for finding things the ordinary way --------------------------------------------------------------------
  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver((es) => es.forEach((e) => { if (e.isIntersecting) award(e.target.id); }), { rootMargin: '-40% 0px -40% 0px' });
    ['feel', 'core', 'how', 'palette', 'vibe', 'refs'].forEach((id) => { const s = document.getElementById(id); if (s) io.observe(s); });
  }
  const saveBtn = $('.atlas [data-save]');
  saveBtn?.addEventListener('click', () => { if (saveBtn.getAttribute('aria-pressed') === 'true') award('save'); });
  $$('[data-palette-dl]').forEach((b) => b.addEventListener('click', () => award('getpal')));
  $('[data-copy-brief]')?.addEventListener('click', () => award('brief'));
  const playerEl = $('[data-player]');
  new MutationObserver(() => {
    $('.ega-sound', status).textContent = playerEl.hidden ? 'Sound:off' : 'Sound:on';
    if (!playerEl.hidden) award('music');
  }).observe(playerEl, { attributes: true, attributeFilter: ['hidden'] });
  $$('.toc a').forEach((a) => a.addEventListener('click', (e) => { e.preventDefault(); go(a.getAttribute('href').slice(1)); }));

  // ---- The parser ----------------------------------------------------------------------------------------------------
  const form = make('form', 'ega-parser', '<label for="ega-in">&gt;</label><input id="ega-in" type="text" autocomplete="off" autocapitalize="off" spellcheck="false" enterkeyhint="go" placeholder="Type LOOK, HELP or GO PALETTE"><button type="button" data-v="look">Look</button><button type="button" data-v="help">Help</button>');
  document.body.append(form);
  const input = $('input', form);

  const WHERE = { feel: 'feel', look: 'feel', mood: 'feel', core: 'core', elements: 'core', how: 'how', walkthrough: 'how', steps: 'how', cheat: 'how', sheet: 'how', specs: 'how', palette: 'palette', colours: 'palette', colors: 'palette', colour: 'palette', color: 'palette', dither: 'palette', chart: 'palette', vibe: 'vibe', music: 'vibe', sound: 'vibe', motion: 'vibe', loops: 'vibe', refs: 'refs', references: 'refs', gallery: 'refs', games: 'refs', disks: 'refs', related: 'related', exits: 'related', top: 'top', start: 'top', meadow: 'top', room: 'top', castle: 'castle', door: 'castle' };
  const ORDER = ['top', 'feel', 'core', 'how', 'palette', 'vibe', 'refs', 'related'];
  const here = () => { let cur = 'top'; for (const id of ORDER.slice(1)) { const s = document.getElementById(id); if (s && s.getBoundingClientRect().top < innerHeight * 0.45) cur = id; } return cur; };
  const LOOK = {
    top: 'You stand in a meadow before a castle. There is a moat, a large tree and a signpost. The grass is exactly one colour, and then exactly another.',
    feel: 'A paragraph about felt tips. Beyond it you can see where this all came from.',
    core: 'Six white boxes in the darkening forest. Each one lists something that makes this style what it is.',
    how: 'A rocky pass and a seven-step walkthrough. Someone has left a cheat sheet on the ground. Nobody here will judge you.',
    palette: 'Night falls in exactly 16 colours. Below the swatches, a chart holds every mix. You could TAKE PALETTE.',
    vibe: 'The sun sets in bands of magenta. Small films play, and a speaker on the wall waits for you to PLAY MUSIC.',
    refs: 'You reach the sea. A gallery of old screens washes up, and a list of disks floats beside it.',
    related: 'A cold stone room. There are exits to other styles.',
  };
  const THINGS = {
    castle: 'Grey stone and red roofs, drawn with about forty commands. The door looks unlocked. Most doors do, until they aren\'t.',
    door: 'A heavy portcullis, currently up. Type GO CASTLE, or walk to it. It leads to the core elements.',
    tree: 'A fine old tree on a very high priority. Walk up the screen past it and you will go behind it.',
    moat: 'Blue, with lines of lighter blue. Something ripples in a way that water does not usually ripple. Do not type SWIM.',
    water: 'Blue, with lines of lighter blue. Something ripples in a way that water does not usually ripple. Do not type SWIM.',
    sign: 'A wooden sign. You would have to walk over and READ SIGN.',
    sky: 'Flat blue at the top, then a checkerboard, then flat cyan. Dither is doing all of the work up there.',
    grass: 'Green and light green, in a pattern. It does not move. Nothing here moves unless it has to.',
    hero: 'Seven pixels wide and doing his best.',
    me: 'Seven pixels wide and doing his best.',
    screen: 'An EGA monitor. It hums.',
    dither: 'Two colours in a checkerboard pretending to be a third. Type GO PALETTE to try them all.',
  };
  const shortlisted = () => saveBtn?.getAttribute('aria-pressed') === 'true';
  const clickFirst = (q) => { const el = $(q); if (el) el.click(); return Boolean(el); };

  function run(line) {
    const words = line.toLowerCase().replace(/[^a-z0-9 ]/g, ' ').split(/\s+/).filter((w) => w && !['the', 'a', 'an', 'at', 'to', 'on', 'in', 'into', 'with', 'my', 'this', 'that', 'please', 'of', 'up', 'around', 'for', 'some'].includes(w));
    const verb = words[0] || ''; const noun = words.slice(1).join(' ');
    const jump = (w) => {
      const id = WHERE[w];
      if (!id) return false;
      if (id === 'castle') { if (here() !== 'top') go('top'); walk(62, 89); ego.arrive = null; return true; }
      go(id);
      return true;
    };
    const dir = (w) => {
      if (['north', 'n', 'south', 's'].includes(w)) { const i = ORDER.indexOf(here()); go(ORDER[Math.max(0, Math.min(ORDER.length - 1, i + (w[0] === 'n' ? -1 : 1)))]); return true; }
      if (['east', 'e'].includes(w)) { clickFirst('.atlas a[rel=next]'); return true; }
      if (['west', 'w'].includes(w)) { clickFirst('.atlas a[rel=prev]'); return true; }
      return false;
    };
    switch (verb) {
      case 'help': case 'h': case 'commands':
        award('help');
        say('LOOK, LOOK AT (thing), READ SIGN\nGO (feel, core, how, palette, vibe, refs, related, top)\nGO NORTH or SOUTH: sections. GO EAST or WEST: other styles.\nTAKE STYLE, DROP STYLE, INVENTORY, TAKE PALETTE, TAKE BRIEF\nPLAY MUSIC, SHOW PRIORITY, SHOW CONTROL, SHOW VISUAL\nSCORE, RESTART, QUIT');
        return;
      case 'look': case 'l': case 'examine': case 'x':
        if (!noun) { award('look'); say(LOOK[here()]); return; }
        say(THINGS[noun] || `You look at the ${noun}. It looks back, in 16 colours. Nothing further happens.`);
        return;
      case 'read':
        if (noun === 'sign') { if (ego.y > 120 && Math.abs(ego.x - 44) < 34) readSign(); else say('You are too far away to read it. Walk closer.'); return; }
        if (jump(noun)) return;
        say('There is nothing like that to read here.');
        return;
      case 'go': case 'walk': case 'run': case 'enter': case 'open': case 'visit': case 'climb':
        if (!noun) { say('Where to? Try GO PALETTE, or GO NORTH.'); return; }
        if (dir(noun) || jump(noun)) return;
        say(`You can't go to the ${noun}. Type HELP for places.`);
        return;
      case 'north': case 'south': case 'east': case 'west': case 'n': case 's': case 'e': case 'w':
        dir(verb); return;
      case 'take': case 'get': case 'grab': case 'pick': case 'buy': case 'steal': case 'download':
        if (['palette', 'colours', 'colors', 'gpl'].includes(noun)) { clickFirst('[data-dl16]'); say('You take the palette. All 16 colours fit in one pocket.'); return; }
        if (['brief', 'art brief', 'notes'].includes(noun)) { clickFirst('[data-copy-brief]'); say('You copy the art brief. It is on your clipboard.'); return; }
        if (['style', 'page', 'game', 'this', ''].includes(noun)) { if (!shortlisted()) saveBtn?.click(); say('You put this style on your shortlist.'); return; }
        if (noun === 'tree' || noun === 'castle' || noun === 'moat') { say(`The ${noun} is not going to fit in your pack.`); return; }
        say(`You can't take the ${noun}.`);
        return;
      case 'save':
        if (!shortlisted()) saveBtn?.click();
        say('Game saved. This style is on your shortlist.');
        return;
      case 'drop':
        if (shortlisted()) { saveBtn?.click(); say('You drop this style from your shortlist. It lands without a sound.'); } else say('You are not carrying it.');
        return;
      case 'inventory': case 'inv': case 'i':
        award('inv');
        say(`You are carrying:\n  a 5.25 inch floppy disk\n  16 colours\n  a strong sense of regret${shortlisted() ? '\n  this style, on your shortlist' : ''}`);
        return;
      case 'show': case 'view':
        if (['priority', 'visual', 'control'].includes(noun)) { if (here() !== 'top') go('top'); setMode(noun); return; }
        say('SHOW PRIORITY, SHOW CONTROL or SHOW VISUAL.');
        return;
      case 'priority': case 'visual': case 'control':
        if (here() !== 'top') go('top');
        setMode(verb);
        return;
      case 'play': case 'listen': case 'music':
        go('vibe'); clickFirst('.track-btn');
        return;
      case 'stop': case 'quiet': case 'silence':
        clickFirst('[data-player-close]');
        return;
      case 'score':
        say(`Your score is ${scoreNow()} of ${MAX}. Rank: ${scoreNow() < 40 ? 'Peasant' : scoreNow() < 100 ? 'Knight' : 'King'}.`);
        return;
      case 'restart':
        got.clear(); write('eas-ega-score', '[]'); paintScore(); setMode('visual'); go('top'); restartPicture();
        return;
      case 'redraw':
        if (here() !== 'top') go('top');
        restartPicture();
        return;
      case 'restore': case 'load':
        say('Nothing to restore. You have been careful, or you have been lucky.');
        return;
      case 'quit': case 'exit': case 'q':
        location.href = '../index.html';
        return;
      case 'swim': case 'jump': case 'dive': case 'die':
        if (verb === 'die') { say('You have died. Thanks for playing. Press ENTER, as you always do.'); return; }
        if (here() !== 'top') go('top');
        ego.x = 62; ego.y = 88; ego.face = 'down'; ego.route = [[20, 100]]; ego.arrive = null; if (isCalm()) { ego.route = []; ego.x = 20; ego.y = 100; ego.vy = 1; moveEgo(); ego.vy = 0; }
        return;
      case 'sing': case 'dance':
        say(`You ${verb}. Three pixels move. Nobody claps.`);
        return;
      case 'xyzzy': case 'plugh':
        say('A hollow voice says "Wrong game."');
        return;
      case 'hello': case 'hi':
        say('Nobody answers. It is 1987 and they are all at work.');
        return;
      default:
        if (dir(verb) || jump(verb)) return;
        say(`I don't understand "${line}".`);
    }
  }
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const v = input.value.trim();
    const open = !box.hidden;
    hush();
    input.value = '';
    if (v) run(v);
    else if (!open) say(LOOK[here()]);
  });
  $$('[data-v]', form).forEach((b) => b.addEventListener('click', () => run(b.dataset.v)));

  // As in the games: letters go to the parser wherever you are, arrow keys walk the hero, ENTER clears a box.
  const dlg = $('[data-lightbox-dialog]');
  addEventListener('keydown', (e) => {
    if (e.metaKey || e.ctrlKey || e.altKey || dlg?.open) return;
    const t = e.target;
    const inOther = /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName) && t !== input;
    if (inOther) return;
    if (!box.hidden && (e.key === 'Enter' || e.key === 'Escape') && !input.value) { e.preventDefault(); hush(); return; }
    if (t === input && !input.value && e.key.startsWith('Arrow') && cv.getBoundingClientRect().bottom > 60) {
      e.preventDefault();
      const d = { ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, -1], ArrowDown: [0, 1] }[e.key];
      ego.route = [];
      if (ego.vx === d[0] && ego.vy === d[1]) { ego.vx = 0; ego.vy = 0; } else { [ego.vx, ego.vy] = d; }
      dirty = true;
      return;
    }
    if (t !== input && e.key.length === 1 && /[a-z0-9]/i.test(e.key) && !(t.tagName === 'BUTTON' && e.key === ' ')) input.focus();
  });
})();
