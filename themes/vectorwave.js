// Vectorwave: a stroke font drawn by the beam, a live wireframe flight you steer with the mouse, a Tempest tube for the contents, rotating solids, an oscilloscope for the music and Battlezone's radar.
(() => {
  const root = document.documentElement;
  const calm = () => root.dataset.calm === '1';
  const $ = (q, el = document) => el.querySelector(q);
  const $$ = (q, el = document) => [...el.querySelectorAll(q)];
  const coarse = matchMedia('(pointer: coarse)').matches;
  const small = () => innerWidth < 860;

  /* ---- The stroke font: polylines on a 4 by 6 grid, in the manner of the arcade vector fonts ---- */
  const G = {
    A: ['0,6 0,2 2,0 4,2 4,6', '0,4 4,4'], B: ['0,0 0,6 3,6 4,5 4,4 3,3 0,3', '3,3 4,2 4,1 3,0 0,0'], C: ['4,0 0,0 0,6 4,6'], D: ['0,0 0,6 2,6 4,4 4,2 2,0 0,0'],
    E: ['4,0 0,0 0,6 4,6', '0,3 3,3'], F: ['4,0 0,0 0,6', '0,3 3,3'], G: ['4,1 4,0 0,0 0,6 4,6 4,3 2,3'], H: ['0,0 0,6', '4,0 4,6', '0,3 4,3'],
    I: ['0,0 4,0', '2,0 2,6', '0,6 4,6'], J: ['4,0 4,6 1,6 0,4'], K: ['0,0 0,6', '4,0 0,3 4,6'], L: ['0,0 0,6 4,6'],
    M: ['0,6 0,0 2,2 4,0 4,6'], N: ['0,6 0,0 4,6 4,0'], O: ['0,0 4,0 4,6 0,6 0,0'], P: ['0,6 0,0 4,0 4,3 0,3'],
    Q: ['0,0 4,0 4,4 2,6 0,6 0,0', '2,4 4,6'], R: ['0,6 0,0 4,0 4,3 0,3', '1,3 4,6'], S: ['4,0 0,0 0,3 4,3 4,6 0,6'], T: ['0,0 4,0', '2,0 2,6'],
    U: ['0,0 0,6 4,6 4,0'], V: ['0,0 2,6 4,0'], W: ['0,0 0,6 2,4 4,6 4,0'], X: ['0,0 4,6', '4,0 0,6'], Y: ['0,0 2,2 4,0', '2,2 2,6'], Z: ['0,0 4,0 0,6 4,6'],
    0: ['0,0 4,0 4,6 0,6 0,0', '4,0 0,6'], 1: ['1,1 2,0 2,6', '1,6 3,6'], 2: ['0,0 4,0 4,3 0,3 0,6 4,6'], 3: ['0,0 4,0 4,6 0,6', '0,3 4,3'], 4: ['0,0 0,3 4,3', '4,0 4,6'],
    5: ['4,0 0,0 0,3 4,3 4,6 0,6'], 6: ['0,0 0,6 4,6 4,3 0,3'], 7: ['0,0 4,0 4,6'], 8: ['0,0 4,0 4,6 0,6 0,0', '0,3 4,3'], 9: ['4,3 0,3 0,0 4,0 4,6'],
    ':': ['2,1.5 2,2.5', '2,3.5 2,4.5'], '.': ['2,5.4 2,6'], ',': ['2,5 1.5,6.4'], "'": ['2,0 2,1.5'], '-': ['1,3 3,3'], '/': ['0,6 4,0'], '+': ['2,1.5 2,4.5', '0.5,3 3.5,3'],
  };
  const ADV = 5.4;
  let strokeIndex = 0;
  const word = (w) => {
    let lines = '';
    [...w].forEach((ch, n) => {
      (G[ch] || []).forEach((pts) => {
        const shifted = pts.split(' ').map((p) => { const [x, y] = p.split(',').map(Number); return `${(x + n * ADV).toFixed(1)},${y}`; }).join(' ');
        lines += `<polyline points="${shifted}" pathLength="1" style="--i:${strokeIndex}"/>`;
        strokeIndex += 1;
      });
    });
    const width = w.length * ADV - 1.4;
    return `<svg class="vw-word" viewBox="-.4 -.4 ${(width + .8).toFixed(1)} 6.8" aria-hidden="true">${lines}</svg>`;
  };
  const strokeHeading = (el) => {
    const text = el.textContent.trim();
    strokeIndex = 0;
    el.innerHTML = `<span class="vw-sr">${text.replace(/&/g, '&amp;').replace(/</g, '&lt;')}</span>${text.toUpperCase().split(/\s+/).map(word).join('')}`;
  };
  const headings = $$('.hero-title, .sec-title');
  headings.forEach(strokeHeading);
  // Each heading is traced by the beam the first time it scrolls into view.
  if ('IntersectionObserver' in window) {
    const seen = new IntersectionObserver((entries) => {
      entries.forEach((e) => { if (e.isIntersecting) { e.target.classList.add('vw-draw'); seen.unobserve(e.target); } });
    }, { threshold: 0.2 });
    headings.forEach((h) => seen.observe(h));
  }

  /* ---- Hint under the hero text ---- */
  $('.hero-text')?.insertAdjacentHTML('beforeend', `<p class="vw-hint" aria-hidden="true">${coarse ? 'Scroll to fly / Tap to fire' : 'Move the mouse to steer / Click to fire'}</p>`);

  /* ---- The flight ---- */
  const cv = document.createElement('canvas');
  cv.className = 'vw-fly';
  cv.setAttribute('aria-hidden', 'true');
  document.body.prepend(cv);
  const ctx = cv.getContext('2d');
  let W = 0;
  let H = 0;
  let dpr = 1;
  const resize = () => {
    dpr = Math.min(devicePixelRatio || 1, 1.5);
    W = innerWidth;
    H = innerHeight;
    cv.width = Math.round(W * dpr);
    cv.height = Math.round(H * dpr);
    cv.style.width = `${W}px`;
    cv.style.height = `${H}px`;
  };
  resize();

  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
  const pathX = (z) => Math.sin(z * 0.018) * 9;
  const hgt = (x, z) => {
    const base = Math.sin(x * 0.21 + z * 0.09) * 1.3 + Math.sin(x * 0.063 - z * 0.17) * 2.5 + Math.sin((x * 0.5 + z) * 0.041) * 2.1;
    const d = Math.abs(x - pathX(z)) / 10;
    return (base + 1.5) * Math.min(1, d ** 1.5);
  };
  const cam = { x: 0, y: 4, z: 0, yaw: 0, roll: 0 };
  const steer = { x: 0, y: 0 };
  let speed = 7;
  let lastScroll = scrollY;
  let fire = 0;
  const CELL = 2.2;

  const project = (x, y, z, f, cx, cy) => {
    const dx0 = x - cam.x;
    const dz0 = z - cam.z;
    const cos = Math.cos(cam.yaw);
    const sin = Math.sin(cam.yaw);
    const dx = dx0 * cos - dz0 * sin;
    const dz = dx0 * sin + dz0 * cos;
    if (dz < 0.8) return null;
    const dy = y - cam.y;
    const px = (f * dx) / dz;
    const py = -(f * dy) / dz;
    const c = Math.cos(cam.roll);
    const s = Math.sin(cam.roll);
    return [cx + px * c - py * s, cy + px * s + py * c, dz];
  };
  const stroke = (path, colour, alpha, wide = 3) => {
    ctx.strokeStyle = colour;
    ctx.globalAlpha = alpha * 0.2;
    ctx.lineWidth = wide;
    ctx.stroke(path);
    ctx.globalAlpha = alpha;
    ctx.lineWidth = 1;
    ctx.stroke(path);
  };

  // Hash, so objects stay put as the ground repeats
  const hash = (n) => { const v = Math.sin(n * 127.1) * 43758.5453; return v - Math.floor(v); };
  const OBJ_STEP = 26;
  const COLS = ['#66e8ff', '#ffe94a', '#ff7a66', '#ff7ae0'];
  const edgesCube = [[0, 1], [1, 2], [2, 3], [3, 0], [4, 5], [5, 6], [6, 7], [7, 4], [0, 4], [1, 5], [2, 6], [3, 7]];

  const ridge = (p) => Math.abs(((p / 317) % 2 + 2) % 2 - 1) * 46 + Math.abs(((p / 131) % 2 + 2) % 2 - 1) * 26 + Math.abs(((p / 83) % 2 + 2) % 2 - 1) * 10;

  const frame = (dt) => {
    const rows = small() ? 30 : 46;
    const half = small() ? 15 : 24;
    const scale = (W * dpr) / W;
    ctx.setTransform(scale, 0, 0, scale, 0, 0);
    ctx.globalCompositeOperation = 'source-over';
    ctx.globalAlpha = 1;
    ctx.fillStyle = dt ? 'rgba(0,0,0,.62)' : '#000';
    ctx.fillRect(0, 0, W, H);
    ctx.globalCompositeOperation = 'lighter';
    ctx.lineCap = 'round';

    // Camera
    const v = clamp(Math.abs(scrollY - lastScroll) * 2.2, 0, 60);
    lastScroll = scrollY;
    speed += (7 + v - speed) * Math.min(1, dt * 3);
    cam.z += speed * dt;
    const wantX = pathX(cam.z + 10) + steer.x * 8;
    cam.x += (wantX - cam.x) * Math.min(1, dt * 1.6);
    const groundHere = Math.max(hgt(cam.x, cam.z + 3), hgt(cam.x, cam.z + 8));
    const wantY = Math.max(groundHere + 1.6, 3.6 - steer.y * 2.2);
    cam.y += (wantY - cam.y) * Math.min(1, dt * 2.2);
    cam.yaw += ((steer.x * 0.2) - cam.yaw) * Math.min(1, dt * 2);
    cam.roll += ((-steer.x * 0.1) - cam.roll) * Math.min(1, dt * 2);

    const f = H * 1.05;
    const cx = W / 2;
    const cy = H * (small() ? 0.44 : 0.42) - steer.y * 12;
    const horizon = cy + (f * cam.y) / (rows * CELL);

    // Mountains and moon on the horizon, in the same order Battlezone draws them
    const off = cam.yaw * 1500 + cam.z * 0.8;
    const m = new Path2D();
    for (let sx = -40; sx <= W + 40; sx += 12) {
      const y = horizon - ridge(sx + off) * (small() ? 0.7 : 1);
      if (sx === -40) m.moveTo(sx, y); else m.lineTo(sx, y);
    }
    m.moveTo(-40, horizon);
    m.lineTo(W + 40, horizon);
    stroke(m, '#4dff88', 0.8);
    const moonX = ((W * 0.82 + 100 - cam.yaw * 900) % (W + 200) + W + 200) % (W + 200) - 100;
    const moonY = small() ? H * 0.33 : 84;
    const moon = new Path2D();
    moon.arc(moonX, moonY, 22, 0.5, Math.PI * 1.75);
    moon.arc(moonX + 8, moonY - 2, 17, Math.PI * 1.65, 0.65, true);
    moon.closePath();
    stroke(moon, '#4dff88', 0.85);

    // Solids standing on the ground, drawn in with the rows so that hills can hide them
    const iz = Math.floor(cam.z / OBJ_STEP);
    const pending = [];
    for (let n = 4; n >= 1; n -= 1) pending.push(iz + n);
    const drawSolidsBeyond = (limit) => {
      while (pending.length && pending[0] * OBJ_STEP >= limit) drawGroundSolid(pending.shift());
    };
    const drawGroundSolid = (id) => {
      const z = id * OBJ_STEP;
      const side = hash(id) > 0.5 ? 1 : -1;
      const x = pathX(z) + side * (7 + hash(id + 0.5) * 14);
      const y = hgt(x, z);
      const s = 1.5 + hash(id + 0.2) * 1.4;
      const col = COLS[Math.floor(hash(id + 0.7) * COLS.length)];
      const pts = [];
      let edges;
      if (hash(id + 0.3) > 0.5) {
        [[-s, 0, -s], [s, 0, -s], [s, 0, s], [-s, 0, s], [0, s * 2.4, 0]].forEach(([a, b, d]) => pts.push(project(x + a, y + b, z + d, f, cx, cy)));
        edges = [[0, 1], [1, 2], [2, 3], [3, 0], [0, 4], [1, 4], [2, 4], [3, 4]];
      } else {
        [[-s, 0, -s], [s, 0, -s], [s, 0, s], [-s, 0, s], [-s, s * 2, -s], [s, s * 2, -s], [s, s * 2, s], [-s, s * 2, s]].forEach(([a, b, d]) => pts.push(project(x + a, y + b, z + d, f, cx, cy)));
        edges = edgesCube;
      }
      const path = new Path2D();
      edges.forEach(([a, b]) => { if (pts[a] && pts[b]) { path.moveTo(pts[a][0], pts[a][1]); path.lineTo(pts[b][0], pts[b][1]); } });
      // Solids fade out as they get close, so they never loom through the text.
      const near = clamp((z - cam.z - 9) / 16, 0, 1);
      if (near > 0) stroke(path, col, near * clamp(1.3 - (z - cam.z) / (OBJ_STEP * 4), 0.15, 1));
    };

    // Ground, far rows first. Each strip is filled with black before its lines go on, which removes hidden lines.
    const z0 = Math.floor(cam.z / CELL) * CELL;
    const x0 = Math.round(cam.x / CELL) * CELL;
    let prev = null;
    for (let r = rows; r >= 1; r -= 1) {
      const z = z0 + r * CELL;
      drawSolidsBeyond(z);
      const row = [];
      for (let c = -half; c <= half; c += 1) {
        const x = x0 + c * CELL;
        row.push(project(x, hgt(x, z), z, f, cx, cy));
      }
      if (prev) {
        const fill = new Path2D();
        const lines = new Path2D();
        for (let c = 0; c < row.length; c += 1) {
          const p = row[c];
          const next = row[c + 1];
          const q = prev[c];
          const qn = prev[c + 1];
          if (p && next && q && qn) {
            fill.moveTo(p[0], p[1]);
            fill.lineTo(next[0], next[1]);
            fill.lineTo(qn[0], qn[1]);
            fill.lineTo(q[0], q[1]);
            fill.closePath();
          }
          if (p && next) { lines.moveTo(p[0], p[1]); lines.lineTo(next[0], next[1]); }
          if (p && q) { lines.moveTo(p[0], p[1]); lines.lineTo(q[0], q[1]); }
        }
        ctx.globalCompositeOperation = 'source-over';
        ctx.globalAlpha = 1;
        ctx.fillStyle = '#000';
        ctx.fill(fill);
        ctx.globalCompositeOperation = 'lighter';
        const t = r / rows;
        stroke(lines, '#4dff88', (1 - t) ** 1.2 * 0.82 + 0.1);
      }
      prev = row;
    }
    drawSolidsBeyond(-Infinity);

    // Twin shots down to the horizon
    if (fire > 0) {
      fire -= dt;
      const k = 1 - clamp(fire / 0.22, 0, 1);
      const shot = new Path2D();
      [-1, 1].forEach((side) => {
        const sx = cx + side * W * 0.46;
        const sy = H * 0.98;
        const ex = cx + (sx - cx) * (1 - k);
        const ey = cy + (sy - cy) * (1 - k);
        const hx = cx + (sx - cx) * Math.max(0, 1 - k - 0.28);
        const hy = cy + (sy - cy) * Math.max(0, 1 - k - 0.28);
        shot.moveTo(ex, ey);
        shot.lineTo(hx, hy);
      });
      stroke(shot, '#ffe94a', 1, 5);
    }
  };

  let raf = 0;
  let last = 0;
  const loop = (now) => {
    raf = 0;
    if (calm() || document.hidden) return;
    const dt = last ? Math.min(0.05, (now - last) / 1000) : 0.016;
    last = now;
    frame(dt);
    raf = requestAnimationFrame(loop);
  };
  const startFly = () => {
    if (raf) return;
    if (calm()) { last = 0; frame(0); return; }
    last = 0;
    raf = requestAnimationFrame(loop);
  };
  addEventListener('resize', () => { resize(); if (calm()) frame(0); });
  document.addEventListener('visibilitychange', startFly);
  addEventListener('pointermove', (e) => {
    if (e.pointerType === 'touch') return;
    steer.x = clamp((e.clientX / W - 0.5) * 2, -1, 1);
    steer.y = clamp((e.clientY / H - 0.5) * 2, -1, 1);
  }, { passive: true });
  addEventListener('pointerdown', (e) => {
    if (calm() || e.target.closest('a, button, video, dialog, input')) return;
    fire = 0.22;
  });
  frame(0);
  startFly();

  /* ---- Contents as a Tempest tube ---- */
  const toc = $('.toc');
  const tocLinks = toc ? $$('a', toc) : [];
  let setLane = () => {};
  if (toc && tocLinks.length) {
    const n = tocLinks.length;
    const OUT = 46;
    const IN = 7;
    const cxT = 50;
    const cyT = 52;
    const corner = (i, r, dy = 0) => {
      const a = (i / n) * Math.PI * 2 - Math.PI / 2 - Math.PI / n;
      return [cxT + r * Math.cos(a), cyT + dy + r * Math.sin(a)];
    };
    let lanes = '';
    for (let i = 0; i < n; i += 1) {
      const a = corner(i, OUT);
      const b = corner(i + 1, OUT);
      const c = corner(i + 1, IN, -6);
      const d = corner(i, IN, -6);
      const pts = [a, b, c, d].map((p) => p.map((v) => v.toFixed(1)).join(',')).join(' ');
      const lx = (a[0] + b[0]) / 2 * 0.72 + (c[0] + d[0]) / 2 * 0.28;
      const ly = (a[1] + b[1]) / 2 * 0.72 + (c[1] + d[1]) / 2 * 0.28;
      lanes += `<polygon class="lane" data-i="${i}" points="${pts}"/><text x="${lx.toFixed(1)}" y="${ly.toFixed(1)}">${i + 1}</text>`;
    }
    toc.insertAdjacentHTML('afterbegin', `<svg class="vw-tube" viewBox="0 0 100 100" aria-hidden="true">${lanes}<line class="vw-shot" pathLength="1"/><path class="vw-claw"/></svg>`);
    const tube = $('.vw-tube', toc);
    const polys = $$('.lane', tube);
    const claw = $('.vw-claw', tube);
    const shot = $('.vw-shot', tube);
    const mid = (p, q) => [(p[0] + q[0]) / 2, (p[1] + q[1]) / 2];
    setLane = (i) => {
      polys.forEach((p, k) => p.classList.toggle('on', k === i));
      $$('li', toc).forEach((li, k) => li.classList.toggle('on', k === i));
      if (i < 0) { claw.setAttribute('d', ''); return; }
      const a = corner(i, OUT);
      const b = corner(i + 1, OUT);
      const m = mid(a, b);
      const c = [(m[0] * 0.86 + cxT * 0.14), (m[1] * 0.86 + (cyT - 6) * 0.14)];
      const out = [(m[0] - cxT) * 0.1, (m[1] - cyT) * 0.1];
      claw.setAttribute('d', `M${a[0].toFixed(1)} ${a[1].toFixed(1)}L${(m[0] + out[0]).toFixed(1)} ${(m[1] + out[1]).toFixed(1)}L${b[0].toFixed(1)} ${b[1].toFixed(1)}L${c[0].toFixed(1)} ${c[1].toFixed(1)}Z`);
    };
    const shoot = (i) => {
      if (calm()) return;
      const m = mid(corner(i, OUT), corner(i + 1, OUT));
      const e = mid(corner(i, IN, -6), corner(i + 1, IN, -6));
      shot.setAttribute('x1', m[0].toFixed(1));
      shot.setAttribute('y1', m[1].toFixed(1));
      shot.setAttribute('x2', e[0].toFixed(1));
      shot.setAttribute('y2', e[1].toFixed(1));
      shot.classList.remove('go');
      void shot.getBoundingClientRect();
      shot.classList.add('go');
      setTimeout(() => shot.classList.remove('go'), 240);
    };
    polys.forEach((p, i) => {
      p.addEventListener('pointerenter', () => setLane(i));
      p.addEventListener('click', () => { setLane(i); shoot(i); setTimeout(() => tocLinks[i].click(), calm() ? 0 : 200); });
    });
    tocLinks.forEach((a, i) => {
      a.addEventListener('pointerenter', () => setLane(i));
      a.addEventListener('focus', () => setLane(i));
      a.addEventListener('click', () => shoot(i));
    });
    setLane(0);
  }

  /* ---- Rotating solids ---- */
  const mk = {
    tetra: () => ({ v: [[1, 1, 1], [-1, -1, 1], [-1, 1, -1], [1, -1, -1]], e: [[0, 1], [0, 2], [0, 3], [1, 2], [1, 3], [2, 3]] }),
    cube: () => ({ v: [[-1, -1, -1], [1, -1, -1], [1, 1, -1], [-1, 1, -1], [-1, -1, 1], [1, -1, 1], [1, 1, 1], [-1, 1, 1]], e: edgesCube }),
    torus: () => {
      const v = [];
      const e = [];
      const U = 14;
      const V = 6;
      for (let i = 0; i < U; i += 1) for (let j = 0; j < V; j += 1) {
        const a = (i / U) * Math.PI * 2;
        const b = (j / V) * Math.PI * 2;
        const r = 1 + 0.42 * Math.cos(b);
        v.push([r * Math.cos(a), 0.42 * Math.sin(b), r * Math.sin(a)]);
        e.push([i * V + j, ((i + 1) % U) * V + j], [i * V + j, i * V + ((j + 1) % V)]);
      }
      return { v, e };
    },
    tank: () => ({
      v: [[-1.4, -.5, -.8], [1.4, -.5, -.8], [1.1, -.5, .8], [-1.1, -.5, .8], [-1.6, 0, -.95], [1.7, 0, -.95], [1.3, 0, .95], [-1.3, 0, .95],
        [-.7, 0, -.5], [.7, 0, -.5], [.5, 0, .5], [-.5, 0, .5], [-.45, .5, -.35], [.45, .5, -.35], [.3, .5, .35], [-.3, .5, .35], [.4, .28, -.08], [2.1, .28, -.08], [.4, .28, .08], [2.1, .28, .08]],
      e: [[0, 1], [1, 2], [2, 3], [3, 0], [4, 5], [5, 6], [6, 7], [7, 4], [0, 4], [1, 5], [2, 6], [3, 7], [8, 9], [9, 10], [10, 11], [11, 8], [12, 13], [13, 14], [14, 15], [15, 12], [8, 12], [9, 13], [10, 14], [11, 15], [16, 17], [18, 19], [17, 19], [16, 18]],
    }),
    tube: () => {
      const v = [];
      const e = [];
      const N = 10;
      for (let i = 0; i < N; i += 1) {
        const a = (i / N) * Math.PI * 2;
        const w = 1.1 + 0.35 * Math.cos(a * 2);
        v.push([w * Math.cos(a), w * Math.sin(a), -1.2], [0.25 * Math.cos(a), 0.25 * Math.sin(a), 1.2]);
        e.push([i * 2, ((i + 1) % N) * 2], [i * 2 + 1, ((i + 1) % N) * 2 + 1], [i * 2, i * 2 + 1]);
      }
      return { v, e };
    },
    ico: () => {
      const t = 1.618;
      const v = [[-1, t, 0], [1, t, 0], [-1, -t, 0], [1, -t, 0], [0, -1, t], [0, 1, t], [0, -1, -t], [0, 1, -t], [t, 0, -1], [t, 0, 1], [-t, 0, -1], [-t, 0, 1]].map((p) => p.map((c) => c * 0.62));
      const e = [];
      v.forEach((a, i) => v.forEach((b, j) => { if (j > i && Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]) < 1.3) e.push([i, j]); }));
      return { v, e };
    },
  };
  const solids = [];
  const shapes = ['tetra', 'ico', 'torus', 'tank', 'tube', 'cube'];
  const hues = ['#66e8ff', '#ff7ae0', '#ffe94a', '#4dff88', '#8f9bff', '#ff7a66'];
  $$('.core-item').forEach((item, i) => {
    const c = document.createElement('canvas');
    c.className = 'vw-solid';
    c.setAttribute('aria-hidden', 'true');
    item.prepend(c);
    solids.push({ c, g: c.getContext('2d'), shape: mk[shapes[i % shapes.length]](), hue: hues[i % hues.length], a: i * 0.7, on: false });
  });
  const drawSolid = (s) => {
    const w = s.c.clientWidth || 240;
    const h = s.c.clientHeight || 124;
    if (s.c.width !== w) { s.c.width = w; s.c.height = h; }
    const g = s.g;
    g.setTransform(1, 0, 0, 1, 0, 0);
    g.globalCompositeOperation = 'source-over';
    g.globalAlpha = 1;
    g.fillStyle = '#000';
    g.fillRect(0, 0, w, h);
    g.globalCompositeOperation = 'lighter';
    const cy = Math.cos(s.a);
    const sy = Math.sin(s.a);
    const cx = Math.cos(0.45);
    const sx = Math.sin(0.45);
    const pts = s.shape.v.map(([x, y, z]) => {
      const x1 = x * cy - z * sy;
      const z1 = x * sy + z * cy;
      const y1 = y * cx - z1 * sx;
      const z2 = y * sx + z1 * cx;
      const k = (h * 1.1) / (4.4 + z2);
      return [w / 2 + x1 * k, h / 2 - y1 * k];
    });
    const path = new Path2D();
    s.shape.e.forEach(([a, b]) => { path.moveTo(pts[a][0], pts[a][1]); path.lineTo(pts[b][0], pts[b][1]); });
    g.strokeStyle = s.hue;
    g.lineCap = 'round';
    g.globalAlpha = 0.22;
    g.lineWidth = 3.5;
    g.stroke(path);
    g.globalAlpha = 1;
    g.lineWidth = 1;
    g.stroke(path);
  };
  solids.forEach(drawSolid);

  /* ---- The oscilloscope beside the tracks ---- */
  const tracks = $('.tracks');
  let scope = null;
  if (tracks) {
    const c = document.createElement('canvas');
    c.className = 'vw-scope';
    c.setAttribute('aria-hidden', 'true');
    c.width = 300;
    c.height = 300;
    tracks.before(c);
    scope = { c, g: c.getContext('2d'), a: 1, b: 1, ph: 0, live: false, on: false };
    const ratios = [[3, 2], [5, 4], [2, 1], [7, 5], [4, 3], [5, 3]];
    $$('.track-btn', tracks).forEach((btn, i) => btn.addEventListener('click', () => {
      [scope.a, scope.b] = ratios[i % ratios.length];
      scope.live = true;
      if (calm()) drawScope(0);
    }));
    $('[data-player-close]')?.addEventListener('click', () => { scope.live = false; if (calm()) drawScope(0); });
  }
  const drawScope = (dt) => {
    if (!scope) return;
    const { g } = scope;
    const S = 300;
    g.globalCompositeOperation = 'source-over';
    g.globalAlpha = 1;
    g.clearRect(0, 0, S, S);
    g.globalCompositeOperation = 'lighter';
    scope.ph += dt * (scope.live ? 0.9 : 0.25);
    const amp = scope.live ? 128 : 0;
    const path = new Path2D();
    for (let i = 0; i <= 420; i += 1) {
      const t = (i / 420) * Math.PI * 2;
      const x = scope.live ? S / 2 + amp * Math.sin(scope.a * t + scope.ph) : (i / 420) * S;
      const y = scope.live ? S / 2 + amp * Math.sin(scope.b * t) : S / 2 + Math.sin(t * 5 + scope.ph * 4) * 5;
      if (i) path.lineTo(x, y); else path.moveTo(x, y);
    }
    g.strokeStyle = scope.live ? '#ffe94a' : '#4dff88';
    g.globalAlpha = 0.25;
    g.lineWidth = 5;
    g.stroke(path);
    g.globalAlpha = 1;
    g.lineWidth = 1.4;
    g.stroke(path);
  };
  drawScope(0);

  // One loop runs only the small canvases that are on screen, at about 30 frames a second.
  if ('IntersectionObserver' in window) {
    const vis = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        const s = solids.find((x) => x.c === e.target);
        if (s) s.on = e.isIntersecting;
        if (scope && e.target === scope.c) scope.on = e.isIntersecting;
      });
    });
    solids.forEach((s) => vis.observe(s.c));
    if (scope) vis.observe(scope.c);
  }
  let smallLast = 0;
  const smallLoop = (now) => {
    requestAnimationFrame(smallLoop);
    if (calm() || document.hidden || now - smallLast < 32) return;
    const dt = Math.min(0.1, (now - smallLast) / 1000);
    smallLast = now;
    solids.forEach((s) => { if (s.on) { s.a += dt * 0.7; drawSolid(s); } });
    if (scope?.on) drawScope(dt);
  };
  requestAnimationFrame(smallLoop);

  /* ---- Radar, score and what is in range ---- */
  const sections = $$('main .sec');
  const blips = sections.map((_, i) => {
    const a = (i / sections.length) * Math.PI * 2 + 0.6;
    const r = 18 + (i % 3) * 9;
    return `<circle class="blip" cx="${(50 + r * Math.cos(a)).toFixed(1)}" cy="${(50 + r * Math.sin(a)).toFixed(1)}" r="2"/>`;
  }).join('');
  document.body.insertAdjacentHTML('beforeend', `<div class="vw-hud" aria-hidden="true"><svg class="vw-radar" viewBox="0 0 100 100"><circle cx="50" cy="50" r="48"/><path d="M50 2v10M50 88v10M2 50h10M88 50h10"/>${blips}<path class="vw-sweep" d="M50 50V4"/></svg><p>SCORE <span class="vw-score">0000000</span></p><p class="vw-range"></p></div>`);
  const scoreEl = $('.vw-score');
  const rangeEl = $('.vw-range');
  let ticking = false;
  const hud = () => {
    ticking = false;
    scoreEl.textContent = String(Math.round(scrollY * 2.5)).padStart(7, '0');
    let near = -1;
    sections.forEach((s, i) => { if (s.getBoundingClientRect().top < innerHeight * 0.42) near = i; });
    const name = near >= 0 ? $('.vw-sr', sections[near])?.textContent || '' : 'Hero';
    const text = `IN RANGE: ${name.toUpperCase()}`;
    if (rangeEl.textContent !== text) rangeEl.textContent = text;
    setLane(Math.min(near < 0 ? 0 : near, tocLinks.length - 1));
  };
  addEventListener('scroll', () => { if (!ticking) { ticking = true; requestAnimationFrame(hud); } }, { passive: true });
  hud();

  addEventListener('eas:calm', () => {
    if (calm()) { if (raf) { cancelAnimationFrame(raf); raf = 0; } frame(0); solids.forEach(drawSolid); drawScope(0); } else { startFly(); }
  });
})();
