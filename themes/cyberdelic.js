// Cyberdelic: a live Mandelbrot set behind the page, palette-cycled like Fractint on a VGA card.
// Scrolling zooms it towards Seahorse Valley. P changes the palette, C stops the cycling. Calm mode freezes it.
(() => {
  const root = document.documentElement;
  const isCalm = () => root.dataset.calm === '1';
  const store = {
    get(k) { try { return localStorage.getItem(k); } catch { return null; } },
    set(k, v) { try { localStorage.setItem(k, v); } catch { /* private window */ } },
  };

  // 1. The arched flyer wordmark: each letter on its own, bent along an arch.
  const h1 = document.querySelector('.hero-title');
  if (h1) {
    const text = h1.textContent.trim();
    const chars = [...text];
    const mid = (chars.length - 1) / 2;
    h1.setAttribute('aria-label', text);
    h1.textContent = '';
    chars.forEach((ch, i) => {
      const s = document.createElement('span');
      s.className = 'cy-l';
      s.setAttribute('aria-hidden', 'true');
      s.textContent = ch;
      const k = i - mid;
      s.style.setProperty('--k', k.toFixed(2));
      s.style.setProperty('--k2', (k * k).toFixed(2));
      h1.append(s);
    });
    h1.classList.add('cy-split');
  }

  // 2. Palettes, sampled from the references. Each one loops back to its start.
  const PALETTES = {
    ACID: ['#13008f', '#0568cb', '#16b3cb', '#2bd96a', '#ffe23a', '#ff7a1a', '#c21d27', '#ff3cbc', '#9000a8'],
    FANTAZIA: ['#0568cb', '#5aa8ff', '#fff1a8', '#ffc21a', '#ff6a1a', '#c21d27', '#5c0a2e', '#13008f'],
    'BOSS DRUM': ['#0c442a', '#2bd96a', '#d8f5e2', '#3b6fe0', '#2a1f9a', '#d8261d', '#ffcf3a', '#0c442a'],
  };
  const NAMES = Object.keys(PALETTES);
  const LUT_N = 512;
  const INSIDE = 0xff1a0207; // ABGR for #07021a
  let palName = NAMES.includes(store.get('eas-cy-pal')) ? store.get('eas-cy-pal') : 'ACID';
  let lut = new Uint32Array(LUT_N);
  const hex = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
  function buildLut() {
    const stops = PALETTES[palName].map(hex);
    const n = stops.length;
    for (let i = 0; i < LUT_N; i++) {
      const t = (i / LUT_N) * n;
      const a = stops[Math.floor(t) % n];
      const b = stops[(Math.floor(t) + 1) % n];
      const f = t - Math.floor(t);
      const s = f * f * (3 - 2 * f);
      const r = Math.round(a[0] + (b[0] - a[0]) * s);
      const g = Math.round(a[1] + (b[1] - a[1]) * s);
      const bl = Math.round(a[2] + (b[2] - a[2]) * s);
      lut[i] = (255 << 24) | (bl << 16) | (g << 8) | r;
    }
  }
  buildLut();

  // 3. The canvas and its buffers.
  const canvas = document.createElement('canvas');
  canvas.className = 'cy-fractal';
  canvas.setAttribute('aria-hidden', 'true');
  document.body.prepend(canvas);
  const ctx = canvas.getContext('2d', { alpha: false });
  let W = 0, H = 0, mu = null, img = null, px = null;

  const TARGET = [-0.743643887037151, 0.13182590420533];
  const START = [-0.62, 0.05];
  const Z0 = 1.5, ZMAX = 24000;
  let zoom = Z0, cx = START[0], cy = START[1];
  let wantZoom = Z0;

  function resize() {
    const scale = Math.max(2, Math.round(Math.sqrt((innerWidth * innerHeight) / 90000)));
    W = Math.ceil(innerWidth / scale);
    H = Math.ceil(innerHeight / scale);
    canvas.width = W;
    canvas.height = H;
    mu = new Float32Array(W * H).fill(-1);
    img = ctx.createImageData(W, H);
    px = new Uint32Array(img.data.buffer);
    restart();
  }

  // Progressive render: a coarse 4 x 4 pass first, then every pixel, a few milliseconds per frame.
  let pass = 0, row = 0, maxIter = 150, unit = 0, done = false;
  function restart() {
    maxIter = Math.min(700, Math.round(140 + 70 * Math.log10(zoom)));
    cx = TARGET[0] + (START[0] - TARGET[0]) / zoom;
    cy = TARGET[1] + (START[1] - TARGET[1]) / zoom;
    unit = 3.1 / zoom / Math.min(W, H);
    pass = 0; row = 0; done = false;
  }
  function point(x, y) {
    const cr = cx + (x - W / 2) * unit;
    const ci = cy + (y - H / 2) * unit;
    const q = (cr - 0.25) * (cr - 0.25) + ci * ci;
    if (q * (q + (cr - 0.25)) <= 0.25 * ci * ci || (cr + 1) * (cr + 1) + ci * ci <= 0.0625) return -1;
    let zr = 0, zi = 0, r2 = 0, i2 = 0, n = 0;
    while (r2 + i2 <= 256 && n < maxIter) {
      zi = 2 * zr * zi + ci;
      zr = r2 - i2 + cr;
      r2 = zr * zr;
      i2 = zi * zi;
      n++;
    }
    if (n >= maxIter) return -1;
    return n + 1 - Math.log2(0.5 * Math.log(r2 + i2));
  }
  function work(budget) {
    const end = performance.now() + budget;
    while (!done && performance.now() < end) {
      if (pass === 0) {
        for (let x = 0; x < W; x += 4) {
          const v = point(x + 2, row + 2);
          for (let yy = row; yy < Math.min(H, row + 4); yy++) for (let xx = x; xx < Math.min(W, x + 4); xx++) mu[yy * W + xx] = v;
        }
        row += 4;
        if (row >= H) { pass = 1; row = 0; }
      } else {
        for (let x = 0; x < W; x++) mu[row * W + x] = point(x, row);
        row++;
        if (row >= H) done = true;
      }
    }
  }

  let offset = 0;
  let cycling = store.get('eas-cy-cycle') !== '0';
  function paint() {
    const off = offset | 0;
    for (let i = 0, n = W * H; i < n; i++) {
      const m = mu[i];
      px[i] = m < 0 ? INSIDE : lut[((Math.log2(1 + m) * 150) | 0) + off & (LUT_N - 1)];
    }
    ctx.putImageData(img, 0, 0);
  }

  function zoomFromScroll() {
    const max = Math.max(1, document.documentElement.scrollHeight - innerHeight);
    const f = Math.min(1, Math.max(0, scrollY / max));
    return Z0 * Math.pow(ZMAX / Z0, f);
  }

  // 4. Status line, in the spirit of Fractint's.
  const bar = document.createElement('div');
  bar.className = 'cy-status';
  bar.setAttribute('role', 'group');
  bar.setAttribute('aria-label', 'Fractal background controls');
  bar.innerHTML = '<span class="cy-coords" aria-hidden="true"></span><button type="button" data-cy-pal title="Change the fractal palette (P)"><kbd>P</kbd> Palette <b></b></button><button type="button" data-cy-cycle title="Start or stop colour cycling (C)"><kbd>C</kbd> Cycle <b></b></button>';
  (document.querySelector('.hero-tagline') || document.querySelector('.hero-text') || document.body).after(bar);
  const coords = bar.querySelector('.cy-coords');
  const palBtn = bar.querySelector('[data-cy-pal]');
  const cycBtn = bar.querySelector('[data-cy-cycle]');
  function paintBar() {
    palBtn.querySelector('b').textContent = palName;
    cycBtn.querySelector('b').textContent = isCalm() ? 'off' : (cycling ? 'on' : 'off');
    cycBtn.setAttribute('aria-pressed', String(cycling && !isCalm()));
    const z = zoom < 1000 ? zoom.toFixed(1) : zoom.toExponential(1);
    coords.innerHTML = `<span>x <b>${cx.toFixed(5)}</b></span><span>y <b>${cy.toFixed(5)}</b></span><span>zoom <b>${z}</b></span>`;
  }
  function nextPalette() {
    palName = NAMES[(NAMES.indexOf(palName) + 1) % NAMES.length];
    store.set('eas-cy-pal', palName);
    buildLut();
    dirty = true;
    paintBar();
  }
  function toggleCycle() {
    cycling = !cycling;
    store.set('eas-cy-cycle', cycling ? '1' : '0');
    paintBar();
  }
  palBtn.addEventListener('click', nextPalette);
  cycBtn.addEventListener('click', toggleCycle);
  addEventListener('keydown', (e) => {
    if (e.ctrlKey || e.metaKey || e.altKey || /input|textarea|select/i.test(e.target.tagName)) return;
    if (document.querySelector('dialog[open]')) return;
    if (e.key === 'p' || e.key === 'P') nextPalette();
    if (e.key === 'c' || e.key === 'C') toggleCycle();
  });

  // 5. The loop. Calm mode: one still frame at a fixed depth, no cycling and no scroll zoom.
  let dirty = true, last = performance.now(), shown = false, lastBar = 0;
  function frame(now) {
    const dt = Math.min(100, now - last);
    last = now;
    const calm = isCalm();
    wantZoom = calm ? 40 : zoomFromScroll();
    if (Math.abs(wantZoom / zoom - 1) > 0.004) {
      zoom = calm ? wantZoom : zoom + (wantZoom - zoom) * 0.35;
      restart();
    }
    if (!done) { work(7); dirty = true; }
    if (!calm && cycling) { offset = (offset + dt * 0.017) % LUT_N; dirty = true; }
    if (dirty) {
      paint();
      dirty = false;
      if (!shown) { shown = true; canvas.classList.add('on'); }
    }
    if (now - lastBar > 250) { paintBar(); lastBar = now; }
    requestAnimationFrame(frame);
  }
  addEventListener('resize', () => { clearTimeout(resize.t); resize.t = setTimeout(resize, 150); });
  addEventListener('eas:calm', () => { dirty = true; paintBar(); });
  resize();
  paintBar();
  requestAnimationFrame(frame);
})();
