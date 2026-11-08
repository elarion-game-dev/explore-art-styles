// Backrooms: a small raycaster draws a procedural, endless Level 0 behind the page, and scrolling walks you through it.
// As you read further down, you go down through the levels and the light changes. Lights flicker softly. The hum is real, if you turn it on.
(() => {
  const root = document.documentElement;
  const $ = (q, el = document) => el.querySelector(q);
  const $$ = (q, el = document) => [...el.querySelectorAll(q)];
  const calm = () => root.dataset.calm === '1';

  // ---- The world ----
  const hash2 = (a, b) => {
    let h = (Math.imul(a, 374761393) + Math.imul(b, 668265263)) | 0;
    h = Math.imul(h ^ (h >>> 13), 1274126177);
    return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
  };
  // Rooms 6 cells wide. A pillar at each corner, a wall on most edges, and always a doorway in the middle of an edge,
  // so walking from the centre of one room to the centre of the next never hits anything.
  const R = 6;
  const WALL = .66;
  const solidCell = (x, y) => {
    const mx = x % R;
    const my = y % R;
    if (mx === 0 && my === 0) return true;
    if (mx === 0) return my !== 3 && hash2(((x / R) | 0) * 2 + 1, (y / R) | 0) < WALL;
    if (my === 0) return mx !== 3 && hash2((x / R) | 0, ((y / R) | 0) * 2 + 7) < WALL;
    return false;
  };

  // The path through the rooms is decided by the same hash, so the building is the same every visit.
  const nodes = [];
  {
    let kx = 300;
    let ky = 300;
    let d = 0;
    const dx = [1, 0, -1, 0];
    const dy = [0, 1, 0, -1];
    for (let i = 0; i < 900; i++) {
      nodes.push([kx * R + 3.5, ky * R + 3.5]);
      const r = hash2(i, 77);
      if (r < .26) d = (d + 3) % 4;
      else if (r < .52) d = (d + 1) % 4;
      kx += dx[d];
      ky += dy[d];
    }
  }
  const P = (s) => {
    const q = Math.max(0, s) / R;
    const i = Math.min(nodes.length - 2, q | 0);
    const t = q - i;
    const a = nodes[i];
    const b = nodes[i + 1];
    return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];
  };
  // Averaging two points on the path rounds off the corners, and gives the heading for free.
  const cam = (s) => {
    const D = 2;
    const a = P(s - D);
    const b = P(s + D);
    return [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2, Math.atan2(b[1] - a[1], b[0] - a[0])];
  };

  // Start at a spot with a long view, so the first impression is distance.
  const look = (x0, y0, a) => {
    const rx = Math.cos(a);
    const ry = Math.sin(a);
    for (let d = .3; d < 40; d += .25) if (solidCell((x0 + rx * d) | 0, (y0 + ry * d) | 0)) return d;
    return 40;
  };
  let START = 16;
  {
    let best = -1;
    for (let o = 12; o < 90; o += 1.5) {
      const c = cam(o);
      let sum = 0;
      for (let k = -4; k <= 4; k++) sum += Math.min(26, look(c[0], c[1], c[2] + k * .1));
      if (sum > best) { best = sum; START = o; }
    }
  }

  // ---- Textures ----
  const TS = 128;
  const wallTex = new Float32Array(TS * TS);
  const carpetTex = new Float32Array(TS * TS);
  for (let v = 0; v < TS; v++) {
    for (let u = 0; u < TS; u++) {
      // Vertical bands of chevrons, pale and close in tone, then a little noise
      const c = u % 32;
      const fold = Math.abs(c - 16);
      const ch = (v + fold * 1.1) % 28;
      let w = .94;
      if (fold < 11 && ch < 4) w -= .1;
      if (c < 2) w -= .09;
      w += (hash2(u, v) - .5) * .05;
      wallTex[v * TS + u] = w;
      carpetTex[v * TS + u] = .86 + (hash2(u * 7 + 3, v * 5 + 1) - .5) * .2;
    }
  }
  // Light falls off from a panel every 3 cells. This tile covers one period.
  const LS = 48;
  const lightTile = new Float32Array(LS * LS);
  for (let j = 0; j < LS; j++) {
    for (let i = 0; i < LS; i++) {
      const a = (i / LS - .5) * 3;
      const b = (j / LS - .5) * 3;
      lightTile[j * LS + i] = .56 + .5 * Math.exp(-(a * a + b * b) / 1.5);
    }
  }
  // A few panels are dead, and some are dim.
  const panelState = new Float32Array(64 * 64);
  for (let i = 0; i < 64 * 64; i++) {
    const r = hash2(i, 5);
    panelState[i] = r < .07 ? 0 : r < .16 ? .55 : 1;
  }
  const stain = new Float32Array(64 * 64);
  for (let i = 0; i < 64 * 64; i++) stain[i] = hash2(i, 9) * hash2(i, 13);

  // Each level of the page has its own colours: wall, floor, ceiling, fog, and how bright the panels are.
  const LEVELS = [
    { wall: [216, 197, 110], floor: [132, 108, 50], ceil: [190, 170, 104], fog: [126, 108, 46], lamp: 1 },
    { wall: [196, 178, 86], floor: [112, 92, 40], ceil: [164, 146, 80], fog: [98, 84, 34], lamp: .9 },
    { wall: [170, 158, 80], floor: [86, 76, 38], ceil: [132, 122, 66], fog: [62, 56, 26], lamp: .75 },
    { wall: [126, 126, 110], floor: [70, 70, 62], ceil: [96, 96, 84], fog: [30, 32, 28], lamp: .6 },
    { wall: [124, 80, 48], floor: [60, 42, 30], ceil: [86, 60, 40], fog: [22, 15, 10], lamp: .55 },
    { wall: [146, 32, 26], floor: [52, 14, 14], ceil: [92, 18, 16], fog: [24, 4, 4], lamp: .55 },
    { wall: [38, 42, 36], floor: [16, 18, 16], ceil: [26, 28, 26], fog: [4, 5, 4], lamp: .4 },
  ];
  const mix = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
  const levelAt = (lv) => {
    const i = Math.max(0, Math.min(LEVELS.length - 2, Math.floor(lv)));
    const t = Math.max(0, Math.min(1, lv - i));
    const a = LEVELS[i];
    const b = LEVELS[i + 1];
    return { wall: mix(a.wall, b.wall, t), floor: mix(a.floor, b.floor, t), ceil: mix(a.ceil, b.ceil, t), fog: mix(a.fog, b.fog, t), lamp: a.lamp + (b.lamp - a.lamp) * t };
  };

  // ---- The renderer ----
  const cv = document.createElement('canvas');
  cv.className = 'br-view';
  cv.setAttribute('aria-hidden', 'true');
  document.body.prepend(cv);
  const ctx = cv.getContext('2d', { alpha: false });
  let W = 320;
  let H = 200;
  let img = null;
  let buf = null;
  let zbuf = null;
  const fit = () => {
    const wide = innerWidth >= 900;
    W = wide ? 340 : 190;
    H = Math.max(120, Math.min(480, Math.round(W * innerHeight / Math.max(1, innerWidth))));
    cv.width = W;
    cv.height = H;
    img = ctx.createImageData(W, H);
    buf = new Uint32Array(img.data.buffer);
    zbuf = new Float32Array(W);
  };
  fit();

  const FOG = 15;
  let sway = 0;
  const render = (s, lv) => {
    const c = cam(s + START);
    const px = c[0];
    const py = c[1];
    const a = c[2] + Math.sin(s * .42) * .018 + sway;
    const dirX = Math.cos(a);
    const dirY = Math.sin(a);
    // Keep the field of view about the same on tall screens, by widening the plane with the aspect ratio.
    const planeLen = Math.max(.66, .66 * (W / H) / 1.6);
    const planeX = -dirY * planeLen;
    const planeY = dirX * planeLen;
    const pal = levelAt(lv);
    const scale = H * .92;
    const bob = Math.sin(s * 3.1) * H * .006;
    const horizon = H / 2 + bob;
    const [wr, wg, wb] = pal.wall;
    const [fr, fg, fb] = pal.floor;
    const [cr, cg, cb] = pal.ceil;
    const [gr, gg, gb] = pal.fog;
    const lamp = pal.lamp;

    // Floor and ceiling, one row at a time
    for (let y = 0; y < H; y++) {
      const isFloor = y >= horizon;
      const p = Math.max(.6, Math.abs(y + .5 - horizon));
      const rowDist = (.5 * scale) / p;
      let fx = px + rowDist * (dirX - planeX);
      let fy = py + rowDist * (dirY - planeY);
      const stepX = (rowDist * 2 * planeX) / W;
      const stepY = (rowDist * 2 * planeY) / W;
      const fog = Math.min(1, (rowDist / FOG) ** 1.3);
      const near = 1 - fog;
      let o = y * W;
      for (let x = 0; x < W; x++) {
        const lx = fx / 3;
        const ly = fy / 3;
        const li = lx | 0;
        const lj = ly | 0;
        const lightKey = (li & 63) + (lj & 63) * 64;
        const on = panelState[lightKey];
        let l = lightTile[(((ly - lj) * LS) | 0) * LS + (((lx - li) * LS) | 0)];
        l = .5 + (l - .5) * on;
        let r;
        let g;
        let b;
        if (isFloor) {
          // Carpet pile fades out with distance, or it shimmers as you walk. Damp patches stay.
          const pile = 1 + (carpetTex[((fy * 26) & 127) * TS + ((fx * 26) & 127)] - 1) * near;
          const k = l * (pile - stain[((fx * .6) & 63) + ((fy * .6) & 63) * 64] * .3) * lamp;
          r = fr * k;
          g = fg * k;
          b = fb * k;
        } else {
          // Tile lines, with a recessed light panel in the middle of every third cell
          const ux = lx - li;
          const uy = ly - lj;
          const dx = Math.abs(ux - .5);
          const dy = Math.abs(uy - .5);
          if (dx < .22 && dy < .11 && on > 0) {
            const e = (130 + on * 125) * (.4 + lamp * .6);
            r = e;
            g = e * .99;
            b = e * .84;
          } else {
            const gx = (fx * 2) % 1;
            const gy = (fy * 2) % 1;
            const line = gx < .035 || gy < .035 ? 1 - .15 * near : 1;
            const k = l * line * lamp;
            r = cr * k;
            g = cg * k;
            b = cb * k;
          }
        }
        r += (gr - r) * fog;
        g += (gg - g) * fog;
        b += (gb - b) * fog;
        buf[o++] = 0xff000000 | (b << 16) | (g << 8) | r;
        fx += stepX;
        fy += stepY;
      }
    }

    // Walls, one column at a time
    for (let x = 0; x < W; x++) {
      const camX = (2 * x) / W - 1;
      const rx = dirX + planeX * camX;
      const ry = dirY + planeY * camX;
      let mx = px | 0;
      let my = py | 0;
      const ddx = Math.abs(1 / rx);
      const ddy = Math.abs(1 / ry);
      const sx = rx < 0 ? -1 : 1;
      const sy = ry < 0 ? -1 : 1;
      let sdx = (rx < 0 ? px - mx : mx + 1 - px) * ddx;
      let sdy = (ry < 0 ? py - my : my + 1 - py) * ddy;
      let side = 0;
      let hit = false;
      let guard = 0;
      while (guard++ < 44) {
        if (sdx < sdy) { sdx += ddx; mx += sx; side = 0; } else { sdy += ddy; my += sy; side = 1; }
        if (solidCell(mx, my)) { hit = true; break; }
      }
      const dist = hit ? Math.max(.08, side === 0 ? sdx - ddx : sdy - ddy) : 1e3;
      zbuf[x] = dist;
      if (!hit) continue;
      const lineH = scale / dist;
      const top = horizon - lineH / 2;
      const y0 = Math.max(0, Math.ceil(top));
      const y1 = Math.min(H, Math.ceil(top + lineH));
      const wallPos = side === 0 ? py + dist * ry : px + dist * rx;
      const wf = wallPos - Math.floor(wallPos);
      const texX = ((wf * 2 * TS) | 0) & (TS - 1);
      const hx = side === 0 ? mx + (sx < 0 ? 1 : 0) : wallPos;
      const hy = side === 0 ? wallPos : my + (sy < 0 ? 1 : 0);
      const lx = hx / 3;
      const ly = hy / 3;
      const li = lx | 0;
      const lj = ly | 0;
      const on = panelState[(li & 63) + (lj & 63) * 64];
      let l = lightTile[(((ly - lj) * LS) | 0) * LS + (((lx - li) * LS) | 0)];
      l = (.5 + (l - .5) * on) * (side === 1 ? .84 : 1) * lamp;
      const fog = Math.min(1, (dist / FOG) ** 1.3);
      const wallNear = Math.max(0, 1 - dist / 7);
      const damp = stain[(((hx * 1.3) | 0) & 63) + (((hy * 1.3) | 0) & 63) * 64];
      for (let y = y0; y < y1; y++) {
        const v = (y - top) / lineH; // 0 at the ceiling, 1 at the floor
        const t = .94 + (wallTex[((v * 2 * TS) & (TS - 1)) * TS + texX] - .94) * wallNear;
        // The top catches the ceiling light, and damp creeps up from the floor.
        let k = l * t * (1.08 - v * .22);
        if (v > .72) k *= 1 - (v - .72) * damp * 1.5;
        if (v > .955) k *= .62; // skirting
        let r = wr * k;
        let g = wg * k;
        let b = wb * k;
        r += (gr - r) * fog;
        g += (gg - g) * fog;
        b += (gb - b) * fog;
        buf[y * W + x] = 0xff000000 | (b << 16) | (g << 8) | r;
      }
    }

    // Sometimes somebody is standing a long way off. They are gone by the time you get there.
    const q = (s + START) / R;
    const base = q | 0;
    for (let k = 2; k <= 4; k++) {
      const i = base + k;
      if (i >= nodes.length || hash2(i, 41) > .3) continue;
      const nx = nodes[i][0] + (hash2(i, 43) - .5) * 2.4;
      const ny = nodes[i][1] + (hash2(i, 47) - .5) * 2.4;
      const ex = nx - px;
      const ey = ny - py;
      const invDet = 1 / (planeX * dirY - dirX * planeY);
      const tx = invDet * (dirY * ex - dirX * ey);
      const ty = invDet * (-planeY * ex + planeX * ey);
      if (ty < 6.5 || ty > 26) continue;
      const fade = Math.min(1, (ty - 6.5) / 2);
      const sx = ((W / 2) * (1 + tx / ty)) | 0;
      const sh = (scale / ty) * 1.02;
      const sw = sh * .3;
      const yb = horizon + (scale / ty) * .5;
      for (let col = Math.max(0, (sx - sw / 2) | 0); col < Math.min(W, sx + sw / 2); col++) {
        if (zbuf[col] < ty) continue;
        const u = (col - sx) / sw + .5;
        const head = Math.abs(u - .5) < .18;
        const armL = Math.abs(u - .12) < .05;
        const armR = Math.abs(u - .88) < .05;
        const legL = Math.abs(u - .4) < .07;
        const legR = Math.abs(u - .6) < .07;
        const body = Math.abs(u - .5) < .15;
        for (let y = Math.max(0, (yb - sh) | 0); y < Math.min(H, yb); y++) {
          const v = (y - (yb - sh)) / sh;
          const on = (v < .12 && head) || (v >= .12 && v < .5 && body) || (v >= .14 && v < .62 && (armL || armR)) || (v >= .5 && (legL || legR));
          if (!on) continue;
          const o = y * W + col;
          const d = buf[o];
          const al = fade * .86;
          const r = (d & 255) * (1 - al) + 10 * al;
          const g = ((d >> 8) & 255) * (1 - al) + 8 * al;
          const b = ((d >> 16) & 255) * (1 - al) + 4 * al;
          buf[o] = 0xff000000 | (b << 16) | (g << 8) | r;
        }
      }
    }
    ctx.putImageData(img, 0, 0);
  };

  // ---- Levels: which part of the page you are on decides how deep you are ----
  const sections = $$('.sec');
  let tops = [];
  const measure = () => { tops = sections.map((s) => s.getBoundingClientRect().top + scrollY); };
  const depth = () => {
    const y = scrollY + innerHeight * .5;
    if (!tops.length || y < tops[0]) return 0;
    for (let i = tops.length - 1; i >= 0; i--) {
      if (y >= tops[i]) {
        const next = i + 1 < tops.length ? tops[i + 1] : root.scrollHeight;
        return i + Math.pow(Math.min(1, (y - tops[i]) / Math.max(1, next - tops[i])), 3);
      }
    }
    return 0;
  };
  const PX_PER_UNIT = 74;

  let dirty = true;
  let lastScrollY = -1;
  let lastDraw = 0;
  let idleT = 0;
  const frame = (ts) => {
    requestAnimationFrame(frame);
    if (document.hidden) return;
    const moved = scrollY !== lastScrollY;
    if (calm()) {
      // In calm mode the view holds still, and only cuts to a new place when you stop scrolling.
      if (moved) {
        lastScrollY = scrollY;
        clearTimeout(idleT);
        idleT = setTimeout(() => { sway = 0; render(scrollY / PX_PER_UNIT, depth()); }, 180);
      }
      if (dirty) { dirty = false; sway = 0; render(scrollY / PX_PER_UNIT, depth()); }
      return;
    }
    const nearTop = scrollY < innerHeight * 1.2;
    const due = moved ? ts - lastDraw > 30 : nearTop && ts - lastDraw > 90;
    if (due || dirty) {
      dirty = false;
      lastDraw = ts;
      lastScrollY = scrollY;
      // A slow, breathing sway when standing still near the top
      sway = Math.sin(ts * .00023) * .03 + Math.sin(ts * .00061) * .012;
      render(scrollY / PX_PER_UNIT, depth());
    }
  };

  // ---- The light ----
  // Soft dips only, and never more than two a second. Fast scrolling makes it worse, and so does standing still for too long.
  let lastFlick = 0;
  const flick = (depthOf = .78, ms = 110) => {
    const now = performance.now();
    if (calm() || now - lastFlick < 500) return;
    lastFlick = now;
    cv.style.setProperty('--dim', depthOf.toFixed(2));
    setTimeout(() => cv.style.setProperty('--dim', '1'), ms);
  };
  const idleFlicker = () => {
    if (!document.hidden) flick(.8 + Math.random() * .1, 90 + Math.random() * 70);
    setTimeout(idleFlicker, 3200 + Math.random() * 6000);
  };
  setTimeout(idleFlicker, 2600);
  let lastY = scrollY;
  let lastYT = performance.now();

  // ---- Wiki machinery ----
  const toc = $('.toc');
  const tocLinks = $$('.toc a');
  tocLinks.forEach((a, i) => { a.dataset.level = String(i); });

  // Infobox under the first image
  const infobox = document.createElement('dl');
  infobox.className = 'br-stats';
  infobox.innerHTML = `<div><dt>Location</dt><dd>Level 0</dd></div><div><dt>Survival difficulty</dt><dd><b class="br-chip c0">Class 1</b></dd></div><div><dt>Environment</dt><dd>Damp, humming, stable</dd></div><div><dt>Entity count</dt><dd class="br-count">None reported</dd></div>`;
  $('.shot-1').append(infobox);

  // Sidebar tools
  const tools = document.createElement('div');
  tools.className = 'br-tools';
  tools.innerHTML = '<button type="button" class="br-tool br-hum" aria-pressed="false">Hum: off</button><button type="button" class="br-tool br-noclip">Noclip</button><p class="br-where" aria-live="off"></p>';
  toc.append(tools);
  const where = $('.br-where');

  const NOCLIP_LINES = [
    'You fell through the floor.',
    'The wall was not there.',
    'That was not the way you came.',
    'Nobody saw you go.',
  ];
  let noclipN = 0;
  let holdWhere = 0;
  $('.br-noclip').addEventListener('click', () => {
    measure();
    const now = sections.findIndex((s, i) => scrollY + innerHeight * .5 < (tops[i + 1] ?? Infinity));
    let pick = Math.floor(Math.random() * sections.length);
    if (pick === now) pick = (pick + 1 + Math.floor(Math.random() * (sections.length - 1))) % sections.length;
    window.scrollTo({ top: tops[pick] - 60, behavior: 'auto' });
    where.textContent = NOCLIP_LINES[noclipN++ % NOCLIP_LINES.length];
    holdWhere = performance.now() + 3500;
    flick(.55, 220);
  });

  // Rooms walked, and the entity count, which is not to be relied on
  const count = $('.br-count');
  let reportT;
  const paintSide = () => {
    const rooms = Math.floor(scrollY / PX_PER_UNIT / R);
    if (scrollY > 40 && performance.now() > holdWhere) where.textContent = `Rooms walked: ${rooms}`;
    const y = scrollY + innerHeight * .4;
    let idx = -1;
    for (let i = 0; i < tops.length; i++) if (tops[i] <= y) idx = i;
    for (const a of tocLinks) a.classList.toggle('is-here', Number(a.dataset.level) === idx);
  };
  const report = () => {
    if (!calm() && !document.hidden) {
      count.textContent = '1';
      clearTimeout(reportT);
      reportT = setTimeout(() => { count.textContent = 'None reported'; }, 1800);
    }
    setTimeout(report, 26000 + Math.random() * 42000);
  };
  setTimeout(report, 20000);

  // ---- The hum ----
  // Real mains hum, made here in the browser: 60 Hz and its harmonics, with a second 60.3 Hz tone beating against it.
  let audio = null;
  const startHum = () => {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    const ac = new AC();
    const master = ac.createGain();
    master.gain.value = 0;
    const lp = ac.createBiquadFilter();
    lp.type = 'lowpass';
    lp.frequency.value = 900;
    lp.connect(master);
    master.connect(ac.destination);
    const parts = [[60, .34], [60.3, .22], [120, .3], [180, .2], [240, .12], [360, .06], [480, .03]];
    const oscs = parts.map(([f, g]) => {
      const o = ac.createOscillator();
      o.type = f > 200 ? 'sawtooth' : 'sine';
      o.frequency.value = f;
      const gn = ac.createGain();
      gn.gain.value = g;
      o.connect(gn);
      gn.connect(lp);
      o.start();
      return o;
    });
    master.gain.linearRampToValueAtTime(.09, ac.currentTime + 1.2);
    return { ac, master, oscs };
  };
  const humBtn = $('.br-hum');
  const stopHum = () => {
    if (!audio) return;
    const a = audio;
    audio = null;
    a.master.gain.linearRampToValueAtTime(0, a.ac.currentTime + .25);
    setTimeout(() => a.ac.close(), 320);
    humBtn.textContent = 'Hum: off';
    humBtn.setAttribute('aria-pressed', 'false');
  };
  humBtn.addEventListener('click', () => {
    if (audio) { stopHum(); return; }
    audio = startHum();
    if (audio) {
      humBtn.textContent = 'Hum: on';
      humBtn.setAttribute('aria-pressed', 'true');
    }
  });
  addEventListener('eas:calm', (e) => { dirty = true; if (e.detail.calm) { cv.style.setProperty('--dim', '1'); stopHum(); } });

  // ---- Scroll ----
  let ticking = false;
  const onScroll = () => {
    ticking = false;
    paintSide();
    const now = performance.now();
    const v = Math.abs(scrollY - lastY) / Math.max(1, now - lastYT);
    lastY = scrollY;
    lastYT = now;
    if (v > 2.2) flick(.72, 80);
    if (audio) {
      const max = Math.max(1, root.scrollHeight - innerHeight);
      audio.master.gain.setTargetAtTime(.07 + (scrollY / max) * .1, audio.ac.currentTime, .4);
    }
  };
  addEventListener('scroll', () => {
    if (!ticking) { ticking = true; requestAnimationFrame(onScroll); }
  }, { passive: true });

  measure();
  addEventListener('load', () => { measure(); dirty = true; });
  let rT;
  addEventListener('resize', () => {
    clearTimeout(rT);
    rT = setTimeout(() => { fit(); measure(); dirty = true; }, 140);
  });
  paintSide();
  render(scrollY / PX_PER_UNIT, depth());
  requestAnimationFrame(frame);
})();
