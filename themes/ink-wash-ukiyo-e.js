// Ink Wash / Ukiyo-e: a sumi brush on the top sheet of the scroll, and the same brush writing the washes and marks below.
// The brush is a bundle of bristles that each carry their own ink. Pressure (a pen's, or slowness with a mouse or finger)
// sets how far the bundle spreads. A bristle that runs low on ink, or moves fast, skips the paper, so long or quick strokes
// break into dry-brush streaks. The water a stroke leaves spreads along the paper's fibres for a few seconds and carries
// ink with it, so the stroke soaks in and feathers. Calm mode lets it soak at once.
(() => {
  const root = document.documentElement;
  const $ = (q, el = document) => el.querySelector(q);
  const $$ = (q, el = document) => [...el.querySelectorAll(q)];
  const isCalm = () => root.dataset.calm === '1';
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
  const smooth = (t) => t * t * (3 - 2 * t);

  // ---- the four main prints keep their own shapes, and each row is justified ----
  for (const img of $$('.hero-gallery .shot-link img')) {
    const w = +img.getAttribute('width');
    const h = +img.getAttribute('height');
    if (w && h) img.closest('.shot').style.setProperty('--r', (w / h).toFixed(3));
  }

  // ---- randomness that repeats ----
  const rng = (a) => () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  const hash = (x, y, s) => {
    let h = Math.imul(x, 374761393) ^ Math.imul(y, 668265263) ^ Math.imul(s, 1442695041);
    h = Math.imul(h ^ (h >>> 13), 1274126177);
    return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
  };
  const noise = (x, y, s) => {
    const ix = Math.floor(x);
    const iy = Math.floor(y);
    const fx = smooth(x - ix);
    const fy = smooth(y - iy);
    const a = hash(ix, iy, s);
    const b = hash(ix + 1, iy, s);
    const c = hash(ix, iy + 1, s);
    const d = hash(ix + 1, iy + 1, s);
    return a + (b - a) * fx + (c - a) * fy + (a - b - c + d) * fx * fy;
  };

  const INK = [27, 25, 22];
  const SHU = [192, 58, 34];
  const GOFUN = [246, 240, 228];
  // How the brush is loaded. tone(r, u): how dark the stroke gets along the track of a bristle at distance r from the
  // middle of the bundle and u across the stroke. About three bristles overlap on any track, so each lays a share of it.
  const LOADS = {
    // The tip dipped in dark ink: the water in the brush thins it, so the belly is lighter than the tip.
    tip: { tone: (r) => 0.97 - 0.42 * r ** 1.6, water: 1, conc: 1, aspect: 1, use: 1 },
    // Light ink and plenty of water.
    pale: { tone: (r) => 0.42 - 0.13 * r, water: 1.5, conc: 0.3, aspect: 1, use: 0.7 },
    // A light wash with both sides dipped in dark ink, the brush laid across the stroke.
    side: { tone: (r, u) => 0.2 + 0.76 * Math.abs(u) ** 2, water: 1.25, conc: 0.5, aspect: 0.3, use: 0.85 },
  };
  const OVERLAP = 3;
  const BRISTLES = 54;
  const USE = 1 / 1050; // ink used per pixel of travel at middling pressure

  // ---- one stroke ----
  // o: { load, size, seed, color, wet(x, y, r, water, pigment), resist(x, y) -> 0..1 }
  function makeStroke(ctx, o) {
    const L = LOADS[o.load] || LOADS.tip;
    const rand = rng(o.seed || 1);
    const seed = (o.seed || 1) * 7 + 3;
    const col = o.color || INK;
    const size = o.size;
    const side = L.aspect < 1;
    const bristles = [];
    for (let i = 0; i < BRISTLES; i++) {
      const r = Math.min(1, Math.sqrt((i + 0.5) / BRISTLES) * (0.94 + 0.12 * rand()));
      const a = i * 2.39996 + rand() * 0.4;
      const u = r * Math.cos(a);
      const tone = L.tone(r, u);
      bristles.push({ u, v: r * Math.sin(a), r, k: 0.7 + 0.6 * rand(), ink: 1, tone, a0: 1 - (1 - tone) ** (1 / OVERLAP), j: rand() * 40, x: 0, y: 0, on: false, path: null });
    }
    let x = 0;
    let y = 0;
    let t = 0;
    let s = 0; // distance travelled
    let p = 0.45; // pressure
    let speed = 0; // px per ms
    let dir = 0;
    let dirSet = false;
    let sideDir = null;
    let turn = 0;
    let pooled = 0;

    const place = (b, cx, cy, R) => {
      const ang = side ? (sideDir ?? dir) : dir;
      const c = Math.cos(ang);
      const sn = Math.sin(ang);
      const across = b.u * R;
      const along = b.v * R * (side ? L.aspect : 0.86);
      return [cx - across * sn + along * c, cy + across * c + along * sn];
    };

    // Moves the brush to (nx, ny) in small steps, laying ink from every bristle that touches.
    function travel(nx, ny, nt, pen) {
      const dx = nx - x;
      const dy = ny - y;
      const d = Math.hypot(dx, dy);
      if (d < 0.05) return;
      const dt = Math.max(1, nt - t);
      const a = Math.atan2(dy, dx);
      if (!dirSet) {
        dir = a;
        dirSet = true;
      } else {
        const da = Math.atan2(Math.sin(a - dir), Math.cos(a - dir));
        const step = da * Math.min(1, d / 10);
        turn = turn * 0.8 + step * 0.2;
        dir += step;
      }
      if (side && sideDir === null && s > 6) sideDir = dir;
      speed += (d / dt - speed) * Math.min(1, d / 30);
      const target = pen ?? clamp(1.1 - speed * 0.62, 0.1, 1);
      p += (target - p) * Math.min(1, d / (pen != null ? 6 : 34));
      const fast = clamp((speed - 0.35) / 1.5, 0, 1);
      const n = Math.ceil(d / 1.6);
      let inkSum = 0;
      let toneSum = 0;
      for (let k = 1; k <= n; k++) {
        const f = k / n;
        const cx = x + dx * f;
        const cy = y + dy * f;
        s += d / n;
        const R = size * (0.16 + 0.84 * p);
        for (const b of bristles) {
          const [bx, by] = place(b, cx, cy, R);
          const dry = 1 - b.ink;
          const nz = 0.8 * noise(b.u * 4.5 + 9, s / 14, seed) + 0.2 * noise(b.j, s / 4.5, seed + 1);
          let thr = 1.3 - 1.6 * dry - fast * (0.55 + 0.9 * dry);
          if (o.resist) thr -= o.resist(bx, by) * 2.5;
          const on = nz < thr;
          if (on) {
            // One continuous line per bristle, picking up where the last flush stopped, so no joint is inked twice.
            if (!b.path) {
              b.path = new Path2D();
              b.path.moveTo(b.on ? b.x : bx, b.on ? b.y : by);
            } else if (!b.on) {
              b.path.moveTo(bx, by);
            }
            b.path.lineTo(bx, by);
            b.ink = Math.max(0, b.ink - (d / n) * USE * L.use * (0.5 + 0.9 * p) * (1 + 0.9 * b.r));
          } else {
            b.ink = Math.max(0, b.ink - (d / n) * USE * 0.08);
          }
          b.on = on;
          b.x = bx;
          b.y = by;
          inkSum += b.ink;
          toneSum += b.tone;
        }
        // The water and ink this step leaves on the paper, for the soak.
        if (o.wet) {
          const water = (d / n) * 0.18 * L.water * (inkSum / BRISTLES) * (1.25 - fast) * (0.35 + 0.65 * p);
          o.wet(cx, cy, R * 0.85, water, water * L.conc * (toneSum / BRISTLES));
        }
        inkSum = 0;
        toneSum = 0;
      }
      x = nx;
      y = ny;
      t = nt;
    }

    // Draws what the bristles laid since the last flush.
    function flush() {
      ctx.lineCap = 'butt';
      ctx.lineJoin = 'round';
      const scale = Math.max(size / 16, 0.62);
      for (const b of bristles) {
        if (!b.path) continue;
        const alpha = b.a0 * (0.3 + 0.7 * smooth(clamp(b.ink * 1.7, 0, 1)));
        ctx.strokeStyle = `rgba(${col[0]},${col[1]},${col[2]},${alpha.toFixed(3)})`;
        ctx.lineWidth = b.k * (0.6 + 1.9 * p) * scale * (side ? 1.8 : 1);
        ctx.stroke(b.path);
        b.path = null;
      }
    }

    return {
      down(nx, ny, nt, pen) {
        x = nx;
        y = ny;
        t = nt;
        p = pen ?? 0.32;
        // The brush touches down: the middle of the bundle leaves a small blot.
        const R = size * (0.16 + 0.84 * p);
        const scale = Math.max(size / 16, 0.62);
        for (const b of bristles) {
          const [bx, by] = place(b, x, y, R);
          b.x = bx;
          b.y = by;
          b.on = b.r < 0.62;
          if (!b.on) continue;
          ctx.fillStyle = `rgba(${col[0]},${col[1]},${col[2]},${b.a0.toFixed(3)})`;
          ctx.beginPath();
          ctx.arc(bx, by, b.k * (0.6 + 1.9 * p) * scale * 0.5, 0, Math.PI * 2);
          ctx.fill();
        }
        if (o.wet) o.wet(x, y, R * 0.8, 0.12 * L.water, 0.12 * L.water * L.conc * 0.8);
      },
      move: travel,
      // Lifting a moving brush flicks a tapering tail. A brush that stopped first ends blunt.
      up() {
        if (speed < 0.45) return;
        const len = clamp(speed * 34, 10, 84);
        const p0 = p;
        const v = Math.max(speed, 0.8) * 1.3;
        for (let d = 3; d <= len; d += 3) {
          dir += turn * 0.6;
          travel(x + Math.cos(dir) * 3, y + Math.sin(dir) * 3, t + 3 / v, p0 * (1 - d / len) ** 1.3);
        }
      },
      // Held still on the paper, the brush keeps letting ink out.
      pool() {
        if (!o.wet || pooled > 45) return;
        pooled += 1;
        let ink = 0;
        for (const b of bristles) {
          ink += b.ink;
          b.ink = Math.max(0, b.ink - 0.0035);
        }
        ink /= BRISTLES;
        o.wet(x, y, size * (0.16 + 0.84 * p) * 0.75, 0.03 * L.water * ink, 0.03 * L.water * ink * L.conc * 0.85);
      },
      flush,
    };
  }

  // Paints a stroke along a list of points [x, y, ms, pressure] in one go.
  function paintPath(ctx, pts, o) {
    const st = makeStroke(ctx, o);
    st.down(pts[0][0], pts[0][1], pts[0][2], pts[0][3]);
    for (const q of pts.slice(1)) st.move(q[0], q[1], q[2], q[3]);
    st.up();
    st.flush();
  }

  // ---- the paper: water and ink spreading through the fibres ----
  const CELL = 2; // CSS pixels per cell
  function makePaper(canvas) {
    const bctx = canvas.getContext('2d');
    let gw = 0;
    let gh = 0;
    let W;
    let P;
    let D;
    let W2;
    let P2;
    let F;
    let R;
    let img;
    let box = null; // cells that are wet, as [x0, y0, x1, y1]
    let drawn = null;

    function fibres() {
      const r = rng(17);
      for (let yy = 0; yy < gh; yy++) {
        for (let xx = 0; xx < gw; xx++) F[yy * gw + xx] = 0.42 + 0.4 * noise(xx / 7, yy / 7, 3) + 0.2 * noise(xx / 2.2, yy / 2.2, 9);
      }
      const count = Math.round((gw * gh) / 45);
      for (let i = 0; i < count; i++) {
        let fx = r() * gw;
        let fy = r() * gh;
        let a = r() * Math.PI * 2;
        const len = 8 + r() * 36;
        const v = 1.7 + r() * 0.9;
        for (let k = 0; k < len; k++) {
          const ix = fx | 0;
          const iy = fy | 0;
          if (ix >= 0 && iy >= 0 && ix < gw && iy < gh) F[iy * gw + ix] = Math.max(F[iy * gw + ix], v);
          a += (r() - 0.5) * 0.35;
          fx += Math.cos(a);
          fy += Math.sin(a);
        }
      }
    }

    function size(w, h) {
      const nw = Math.max(1, Math.ceil(w / CELL));
      const nh = Math.max(1, Math.ceil(h / CELL));
      if (nw === gw && nh === gh) return;
      settle();
      const old = D;
      const ow = gw;
      const oh = gh;
      gw = nw;
      gh = nh;
      const n = gw * gh;
      W = new Float32Array(n);
      P = new Float32Array(n);
      D = new Float32Array(n);
      W2 = new Float32Array(n);
      P2 = new Float32Array(n);
      F = new Float32Array(n);
      R = new Float32Array(n);
      if (old) for (let yy = 0; yy < Math.min(oh, gh); yy++) D.set(old.subarray(yy * ow, yy * ow + Math.min(ow, gw)), yy * gw);
      fibres();
      canvas.width = gw;
      canvas.height = gh;
      canvas.style.width = `${gw * CELL}px`;
      canvas.style.height = `${gh * CELL}px`;
      img = bctx.createImageData(gw, gh);
      for (let i = 0; i < n; i++) {
        img.data[i * 4] = INK[0];
        img.data[i * 4 + 1] = INK[1];
        img.data[i * 4 + 2] = INK[2];
      }
      box = null;
      render([0, 0, gw - 1, gh - 1]);
    }

    function grow(x0, y0, x1, y1) {
      box = box ? [Math.min(box[0], x0), Math.min(box[1], y0), Math.max(box[2], x1), Math.max(box[3], y1)] : [x0, y0, x1, y1];
    }

    // Lays water and ink in a soft round patch.
    function wet(x, y, rad, water, pig) {
      const cx = x / CELL;
      const cy = y / CELL;
      const cr = Math.max(1.2, rad / CELL);
      const x0 = Math.max(1, Math.floor(cx - cr));
      const x1 = Math.min(gw - 2, Math.ceil(cx + cr));
      const y0 = Math.max(1, Math.floor(cy - cr));
      const y1 = Math.min(gh - 2, Math.ceil(cy + cr));
      if (x0 > x1 || y0 > y1) return;
      for (let yy = y0; yy <= y1; yy++) {
        for (let xx = x0; xx <= x1; xx++) {
          const q = ((xx - cx) ** 2 + (yy - cy) ** 2) / (cr * cr);
          if (q >= 1) continue;
          const i = yy * gw + xx;
          const g = (1 - q) * (1 - R[i]);
          W[i] = Math.min(1.6, W[i] + water * g);
          P[i] += pig * g;
        }
      }
      grow(x0, y0, x1, y1);
    }

    // One tick of spreading, drinking and settling. Water flows to all eight neighbours (diagonals a little less, so the
    // fronts stay round), only down a slope steeper than TH, faster along fibres, and carries ink in proportion.
    const K = 0.055;
    const TH = 0.014;
    const MOB = 0.8;
    const NB = [[-1, 0, 1], [1, 0, 1], [0, -1, 1], [0, 1, 1], [-1, -1, 0.7], [1, -1, 0.7], [-1, 1, 0.7], [1, 1, 0.7]];
    function step() {
      if (!box) return false;
      const x0 = Math.max(1, box[0] - 1);
      const y0 = Math.max(1, box[1] - 1);
      const x1 = Math.min(gw - 2, box[2] + 1);
      const y1 = Math.min(gh - 2, box[3] + 1);
      const offs = NB.map(([dx, dy]) => dy * gw + dx);
      let nx0 = gw;
      let ny0 = gh;
      let nx1 = -1;
      let ny1 = -1;
      for (let yy = y0; yy <= y1; yy++) {
        let i = yy * gw + x0;
        for (let xx = x0; xx <= x1; xx++, i++) {
          const w = W[i];
          const f = F[i] * (1 - R[i]);
          const c = w > 1e-5 ? P[i] / w : 0;
          let dw = 0;
          let dp = 0;
          for (let m = 0; m < 8; m++) {
            const j = i + offs[m];
            const wn = W[j];
            const k = K * NB[m][2] * 0.5 * (f + F[j] * (1 - R[j]));
            if (wn > w + TH) {
              const fl = (wn - w - TH) * k;
              dw += fl;
              dp += fl * (P[j] / wn) * MOB;
            } else if (w > wn + TH) {
              const fl = (w - wn - TH) * k;
              dw -= fl;
              dp -= fl * c * MOB;
            }
          }
          let nw = w + dw;
          let np = P[i] + dp;
          // The paper drinks: a share of the water, and thin films outright.
          nw = nw > 0 ? Math.max(0, nw * 0.986 - 0.0019) : 0;
          if (np < 0) np = 0;
          // Ink stays afloat while the paper is wet and settles as it dries.
          const dry = 1 - Math.min(1, nw / 0.2);
          let dep = np * (0.005 + 0.08 * dry * dry);
          if (nw < 0.003) {
            dep = np;
            nw = 0;
          }
          D[i] += dep;
          np -= dep;
          W2[i] = nw;
          P2[i] = np;
          if (nw > 0 || np > 0.0004) {
            if (xx < nx0) nx0 = xx;
            if (xx > nx1) nx1 = xx;
            if (yy < ny0) ny0 = yy;
            if (yy > ny1) ny1 = yy;
          }
        }
      }
      for (let yy = y0; yy <= y1; yy++) {
        const a = yy * gw + x0;
        const b = yy * gw + x1 + 1;
        W.set(W2.subarray(a, b), a);
        P.set(P2.subarray(a, b), a);
      }
      drawn = drawn ? [Math.min(drawn[0], x0), Math.min(drawn[1], y0), Math.max(drawn[2], x1), Math.max(drawn[3], y1)] : [x0, y0, x1, y1];
      box = nx1 >= 0 ? [nx0, ny0, nx1, ny1] : null;
      return Boolean(box);
    }

    function render(area = drawn) {
      if (!area) return;
      const [x0, y0, x1, y1] = area;
      const data = img.data;
      for (let yy = y0; yy <= y1; yy++) {
        let i = yy * gw + x0;
        for (let xx = x0; xx <= x1; xx++, i++) {
          const dens = D[i] + P[i] * 0.8;
          const a = 1 - Math.exp(-2.4 * dens) + Math.min(0.05, W[i] * 0.05);
          data[i * 4 + 3] = a >= 1 ? 255 : (a * 255) | 0;
        }
      }
      bctx.putImageData(img, 0, 0, x0, y0, x1 - x0 + 1, y1 - y0 + 1);
      drawn = null;
    }

    // Runs the soak on at once, for up to max steps, then draws the whole sheet. settle(0) only dries and draws.
    function settle(max = 600) {
      if (!box && !drawn) return;
      for (let k = 0; k < max && step(); k++);
      if (box) {
        // Whatever is left dries where it is.
        for (let i = 0; i < W.length; i++) {
          D[i] += P[i];
          P[i] = 0;
          W[i] = 0;
        }
        box = null;
      }
      render([0, 0, gw - 1, gh - 1]);
    }

    // Lettering on the sheet resists the ink, so strokes fade out around it.
    function resistRects(rects) {
      R.fill(0);
      for (const [rx0, ry0, rx1, ry1] of rects) {
        const soft = 12;
        const x0 = Math.max(0, Math.floor((rx0 - soft) / CELL));
        const x1 = Math.min(gw - 1, Math.ceil((rx1 + soft) / CELL));
        const y0 = Math.max(0, Math.floor((ry0 - soft) / CELL));
        const y1 = Math.min(gh - 1, Math.ceil((ry1 + soft) / CELL));
        for (let yy = y0; yy <= y1; yy++) {
          for (let xx = x0; xx <= x1; xx++) {
            const px = xx * CELL;
            const py = yy * CELL;
            const ox = Math.max(rx0 - px, 0, px - rx1);
            const oy = Math.max(ry0 - py, 0, py - ry1);
            const v = 1 - smooth(clamp(Math.hypot(ox, oy) / soft, 0, 1));
            const i = yy * gw + xx;
            if (v > R[i]) R[i] = v;
          }
        }
      }
    }
    const resistAt = (x, y) => {
      const xx = (x / CELL) | 0;
      const yy = (y / CELL) | 0;
      return xx < 0 || yy < 0 || xx >= gw || yy >= gh ? 0 : R[yy * gw + xx];
    };

    function clear() {
      W.fill(0);
      P.fill(0);
      D.fill(0);
      box = null;
      render([0, 0, gw - 1, gh - 1]);
    }

    return { size, wet, step, render, settle, clear, resistRects, resistAt, busy: () => Boolean(box) };
  }

  // ---- the sheet at the top of the scroll ----
  const sheet = $('.hero-text');
  const canPaint = sheet && !!document.createElement('canvas').getContext && 'PointerEvent' in window;
  if (canPaint) {
    const layer = document.createElement('div');
    layer.className = 'iw-paper';
    layer.setAttribute('aria-hidden', 'true');
    const bleedCanvas = document.createElement('canvas');
    bleedCanvas.className = 'iw-bleed';
    const inkCanvas = document.createElement('canvas');
    inkCanvas.className = 'iw-ink';
    layer.append(bleedCanvas, inkCanvas);
    sheet.prepend(layer);
    const ictx = inkCanvas.getContext('2d');
    const paper = makePaper(bleedCanvas);

    const touchy = matchMedia('(pointer: coarse)').matches || navigator.maxTouchPoints > 0;
    // A touchscreen laptop has a mouse or trackpad too, and those paint without the finger toggle.
    const mouse = matchMedia('(any-pointer: fine)').matches;
    const bar = document.createElement('div');
    bar.className = 'iw-brush';
    bar.setAttribute('role', 'group');
    bar.setAttribute('aria-label', 'Sumi brush');
    bar.innerHTML = `<span class="iw-brush-hint"><b>This sheet takes ink.</b> <span data-hint></span></span>
      <span class="iw-loads" role="group" aria-label="How the brush is loaded">
        <button type="button" data-load="tip" aria-pressed="true" title="The tip dipped in dark ink: the belly of the brush is lighter">Dark tip</button><button type="button" data-load="pale" aria-pressed="false" title="Light ink and plenty of water">Pale wash</button><button type="button" data-load="side" aria-pressed="false" title="A light wash with both sides dipped in dark ink. The brush lies across the stroke.">Side ink</button>
      </span>
      <button type="button" class="iw-paint" aria-pressed="false">Paint with a finger</button>
      <button type="button" class="iw-clear">New sheet</button>`;
    sheet.append(bar);
    const hint = $('[data-hint]', bar);
    let touchOn = false;
    const paintHint = () => {
      const drag = 'Drag across the paper. Slow strokes soak in; fast or long ones break into dry brush.';
      if (!touchy || touchOn) hint.textContent = drag;
      else hint.textContent = mouse ? `${drag} On a touchscreen, turn on painting first.` : 'Turn on painting, then draw with a finger.';
    };
    if (touchy) bar.classList.add('iw-touch');
    if (mouse) sheet.classList.add('iw-can-paint');
    paintHint();

    let load = 'tip';
    let strokes = 0;
    bar.addEventListener('click', (e) => {
      const b = e.target.closest('button');
      if (!b) return;
      if (b.dataset.load) {
        load = b.dataset.load;
        $$('[data-load]', bar).forEach((x) => x.setAttribute('aria-pressed', String(x === b)));
      } else if (b.classList.contains('iw-paint')) {
        touchOn = !touchOn;
        b.setAttribute('aria-pressed', String(touchOn));
        sheet.classList.toggle('iw-touch-on', touchOn);
        paintHint();
        resist(); // the hint changed length, so the bar the ink keeps clear of may have too
      } else if (b.classList.contains('iw-clear')) {
        ictx.clearRect(0, 0, inkCanvas.width, inkCanvas.height);
        paper.clear();
      }
    });

    // Sizes the canvases to the sheet, keeping what is already painted.
    let dpr = 1;
    let cw = 0;
    let ch = 0;
    function fit() {
      const w = sheet.clientWidth;
      const h = sheet.clientHeight;
      const ndpr = Math.min(2, window.devicePixelRatio || 1);
      if (w === cw && h === ch && ndpr === dpr) return;
      let keep = null;
      if (cw && ch) {
        keep = document.createElement('canvas');
        keep.width = inkCanvas.width;
        keep.height = inkCanvas.height;
        keep.getContext('2d').drawImage(inkCanvas, 0, 0);
      }
      const odpr = dpr;
      cw = w;
      ch = h;
      dpr = ndpr;
      inkCanvas.width = Math.round(w * dpr);
      inkCanvas.height = Math.round(h * dpr);
      inkCanvas.style.width = `${w}px`;
      inkCanvas.style.height = `${h}px`;
      ictx.setTransform(1, 0, 0, 1, 0, 0);
      if (keep) ictx.drawImage(keep, 0, 0, keep.width * (dpr / odpr), keep.height * (dpr / odpr));
      ictx.setTransform(dpr, 0, 0, dpr, 0, 0);
      paper.size(w, h);
      resist();
    }
    function resist() {
      const base = sheet.getBoundingClientRect();
      const rects = $$('.hero-kicker, .hero-title, .hero-sub, .hero-tagline, .iw-brush', sheet).map((el) => {
        const r = el.getBoundingClientRect();
        return [r.left - base.left - 4, r.top - base.top - 4, r.right - base.left + 4, r.bottom - base.top + 4];
      });
      const after = getComputedStyle(sheet, '::after');
      if (after.content !== 'none' && after.display !== 'none') {
        const cwid = parseFloat(after.width);
        const chei = parseFloat(after.height);
        const right = parseFloat(after.right);
        const top = parseFloat(after.top);
        if (cwid && chei) rects.push([base.width - right - cwid - 4, top - 4, base.width - right + 4, top + chei + 4]);
      }
      paper.resistRects(rects);
    }
    fit();
    if ('ResizeObserver' in window) new ResizeObserver(() => fit()).observe(sheet);
    else addEventListener('resize', fit);
    document.fonts?.ready.then(() => resist());

    // The soak runs on animation frames while anything on the sheet is wet.
    let raf = 0;
    let active = null;
    const kick = () => {
      if (!raf && !isCalm()) raf = requestAnimationFrame(frame);
    };
    function frame() {
      raf = 0;
      if (active && performance.now() - active.last > 90) active.stroke.pool();
      const wet = paper.step();
      paper.render();
      if (wet || active) kick();
    }
    // In calm mode the ink still soaks in, but nothing is animated: the same steps run in slices of a few milliseconds
    // between other work, so the page never stalls, and the sheet is drawn once, when the ink has settled.
    let quiet = 0;
    let budget = 0;
    function soakQuietly() {
      budget = 600;
      if (!quiet) quiet = setTimeout(soakSlice, 0);
    }
    function soakSlice() {
      quiet = 0;
      if (!isCalm()) {
        kick(); // effects are back on: the frames carry the soak on
        return;
      }
      if (active) return; // still painting: the end of the stroke starts the soak again
      const t0 = performance.now();
      while (budget > 0 && paper.busy() && performance.now() - t0 < 12) {
        paper.step();
        budget -= 1;
      }
      if (budget > 0 && paper.busy()) quiet = setTimeout(soakSlice, 0);
      else paper.settle(0);
    }
    const at = (e) => {
      const r = sheet.getBoundingClientRect();
      return [e.clientX - r.left, e.clientY - r.top];
    };
    const pen = (e) => (e.pointerType === 'pen' && e.pressure > 0 ? e.pressure : null);
    sheet.addEventListener('pointerdown', (e) => {
      if (active || e.button !== 0) return;
      if (e.pointerType === 'touch' && !touchOn) return;
      if (e.target.closest('a, button, .iw-brush, .hero-kicker, .hero-title, .hero-sub, .hero-tagline')) return;
      e.preventDefault();
      fit();
      sheet.setPointerCapture(e.pointerId);
      const [x, y] = at(e);
      strokes += 1;
      const stroke = makeStroke(ictx, {
        load, size: clamp(cw * 0.016, 9, 19), seed: strokes * 31 + 7, color: INK,
        wet: paper.wet, resist: paper.resistAt,
      });
      stroke.down(x, y, e.timeStamp, pen(e));
      stroke.flush();
      active = { id: e.pointerId, stroke, last: performance.now() };
      kick();
    });
    sheet.addEventListener('pointermove', (e) => {
      if (!active || e.pointerId !== active.id) return;
      const list = e.getCoalescedEvents?.() || [];
      for (const c of list.length ? list : [e]) {
        const [x, y] = at(c);
        active.stroke.move(x, y, c.timeStamp, pen(c));
      }
      active.stroke.flush();
      active.last = performance.now();
    });
    const end = (e) => {
      if (!active || e.pointerId !== active.id) return;
      active.stroke.up();
      active.stroke.flush();
      active = null;
      if (isCalm()) soakQuietly();
      else kick();
    };
    sheet.addEventListener('pointerup', end);
    sheet.addEventListener('pointercancel', end);
    sheet.addEventListener('lostpointercapture', end);
    addEventListener('eas:calm', () => {
      if (isCalm()) soakQuietly();
      else kick();
    });

    // The sheet starts with one stroke on it: a low shore under the peaks, as in a haboku landscape. It goes down slowly
    // and leaves quickly, so it ends in dry brush. In calm mode it is simply there.
    function shore() {
      if (strokes || !cw || !ch) return;
      strokes += 1;
      const wide = cw >= 860;
      const x0 = wide ? cw * 0.56 : cw * 0.3;
      const x1 = wide ? cw * 0.85 : cw * 0.9;
      const y0 = wide ? ch * 0.835 : ch - 58;
      const pts = [];
      for (let k = 0; k <= 48; k++) {
        const f = k / 48;
        pts.push([x0 + (x1 - x0) * f, y0 - f * 12 - Math.sin(f * Math.PI) * 5, 760 * f ** 0.7, f < 0.06 ? 0.62 + f * 4 : 0.9 - f * 0.3]);
      }
      const stroke = makeStroke(ictx, { load: 'tip', size: clamp(cw * 0.016, 9, 19) * 0.85, seed: 5, color: INK, wet: paper.wet, resist: paper.resistAt });
      const t0 = performance.now();
      stroke.down(pts[0][0], pts[0][1], t0, pts[0][3]);
      let i = 1;
      const finish = () => {
        stroke.up();
        stroke.flush();
        if (isCalm()) soakQuietly();
        else kick();
      };
      if (isCalm()) {
        for (; i < pts.length; i++) stroke.move(pts[i][0], pts[i][1], t0 + pts[i][2], pts[i][3]);
        finish();
        return;
      }
      const run = (now) => {
        if (isCalm()) {
          for (; i < pts.length; i++) stroke.move(pts[i][0], pts[i][1], t0 + pts[i][2], pts[i][3]);
          finish();
          return;
        }
        for (; i < pts.length && pts[i][2] <= now - t0; i++) stroke.move(pts[i][0], pts[i][1], t0 + pts[i][2], pts[i][3]);
        stroke.flush();
        kick();
        if (i < pts.length) requestAnimationFrame(run);
        else finish();
      };
      requestAnimationFrame(run);
    }
    (document.fonts?.ready || Promise.resolve()).then(() => setTimeout(() => {
      fit();
      resist();
      shore();
    }, 450));
  }

  // ---- the brush elsewhere: a pale wash under each section title, and a teacher's red marks ----
  function canvasIn(el, cls, w, h) {
    const c = document.createElement('canvas');
    c.className = cls;
    c.setAttribute('aria-hidden', 'true');
    const d = Math.min(2, window.devicePixelRatio || 1);
    c.width = Math.round(w * d);
    c.height = Math.round(h * d);
    c.style.width = `${w}px`;
    c.style.height = `${h}px`;
    const ctx = c.getContext('2d');
    ctx.scale(d, d);
    el.prepend(c);
    return [c, ctx];
  }

  function washTitles() {
    $$('.sec-title').forEach((h, i) => {
      h.querySelector('.iw-stroke')?.remove();
      const seal = parseFloat(getComputedStyle(h, '::before').width) || 0;
      const x0 = seal * 0.75;
      const w = h.offsetWidth - x0 + 6;
      const hh = h.offsetHeight;
      if (w < 40 || hh < 20) return;
      const [c, ctx] = canvasIn(h, 'iw-stroke', w + 10, hh + 12);
      c.style.left = `${x0}px`;
      c.style.top = '-6px';
      const night = !!h.closest('.sec-vibe');
      const r = rng(i * 97 + 5);
      const pts = [];
      const n = 26;
      const mid = hh * 0.56 + 6;
      for (let k = 0; k <= n; k++) {
        const f = k / n;
        const px = 6 + f * (w - 6);
        const py = mid + Math.sin(f * 3.1 + r() * 0.4) * 2.2 - f * 2.5;
        const pres = f < 0.08 ? 0.75 + f * 2 : f > 0.8 ? 0.92 - (f - 0.8) * 2.4 : 0.9 + (r() - 0.5) * 0.08;
        pts.push([px, py, f * w / (0.25 + f * 1.6), pres]);
      }
      paintPath(ctx, pts, { load: 'pale', size: hh * 0.4, seed: i + 11, color: night ? GOFUN : INK });
      h.classList.add('iw-stroked');
    });
  }

  function marks() {
    const dd = $('.dodont');
    if (!dd) return;
    const draw = (box, kind, seed) => {
      if (!box) return;
      box.querySelector('.iw-mark')?.remove();
      const [, ctx] = canvasIn(box, 'iw-mark', 62, 62);
      const o = { load: 'tip', size: 7.4, seed, color: SHU };
      if (kind === 'maru') {
        const pts = [];
        for (let k = 0; k <= 34; k++) {
          const f = k / 34;
          const a = -Math.PI * 0.6 - f * Math.PI * 1.88;
          const rr = 22 - f * 1.5;
          pts.push([31 + Math.cos(a) * rr, 32 + Math.sin(a) * rr * 0.96, f * 300 / (0.6 + f), f < 0.1 ? 1 : 0.95 - f * 0.45]);
        }
        paintPath(ctx, pts, o);
      } else {
        const line = (x0, y0, x1, y1, sd) => {
          const pts = [];
          for (let k = 0; k <= 14; k++) {
            const f = k / 14;
            pts.push([x0 + (x1 - x0) * f, y0 + (y1 - y0) * f + Math.sin(f * 3) * 1.2, f * 120, f < 0.15 ? 0.95 : 0.85 - f * 0.4]);
          }
          paintPath(ctx, pts, { ...o, seed: sd });
        };
        line(14, 13, 47, 47, seed);
        line(47, 14, 15, 48, seed + 1);
      }
    };
    draw($('.do', dd), 'maru', 3);
    draw($('.avoid', dd), 'batsu', 5);
    dd.classList.add('iw-marked');
  }

  const brushwork = () => {
    washTitles();
    marks();
  };
  if (document.fonts?.ready) document.fonts.ready.then(brushwork);
  else brushwork();
  let lastW = innerWidth;
  addEventListener('resize', () => {
    if (Math.abs(innerWidth - lastW) < 2) return;
    lastW = innerWidth;
    clearTimeout(brushwork.t);
    brushwork.t = setTimeout(washTitles, 200);
  });
})();
