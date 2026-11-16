// Y2K: liquid chrome title, iMac case colours, a disc player, and a clock that reaches midnight at the bottom of the page.
(() => {
  const root = document.documentElement;
  const $ = (q, el = document) => el.querySelector(q);
  const $$ = (q, el = document) => [...el.querySelectorAll(q)];
  const calm = () => root.dataset.calm === '1';
  const el = (tag, cls, html) => { const e = document.createElement(tag); if (cls) e.className = cls; if (html != null) e.innerHTML = html; return e; };
  const store = { get(k) { try { return localStorage.getItem(k); } catch { return null; } }, set(k, v) { try { localStorage.setItem(k, v); } catch { /* private window */ } } };

  // ---- Case colours ----
  const FLAVOURS = [
    { id: 'bondi', name: 'Bondi', c: '#0095b6', sky: [0, 95, 140] },
    { id: 'tangerine', name: 'Tangerine', c: '#f06e14', sky: [190, 70, 10] },
    { id: 'grape', name: 'Grape', c: '#7846c8', sky: [80, 40, 160] },
    { id: 'lime', name: 'Lime', c: '#6eb91e', sky: [50, 120, 20] },
    { id: 'strawberry', name: 'Strawberry', c: '#e63278', sky: [180, 25, 90] },
  ];
  let flavour = FLAVOURS.find((f) => f.id === store.get('eas-y2k-case')) || FLAVOURS[0];
  const paintCase = () => {
    if (flavour.id === 'bondi') delete root.dataset.flavour; else root.dataset.flavour = flavour.id;
    for (const b of $$('.y2-candy button')) b.setAttribute('aria-pressed', String(b.dataset.case === flavour.id));
  };

  // ---- Liquid chrome ----
  const heroText = $('.hero-text');
  const title = $('.hero-title');
  const stage = el('div', 'y2-stage');
  const cv = el('canvas');
  cv.setAttribute('aria-hidden', 'true');
  stage.append(cv);
  title.after(stage);
  const ctx = cv.getContext('2d');
  const LUT = new Uint8ClampedArray(256 * 3);
  const mix = (a, b, t) => a.map((v, i) => v + (b[i] - v) * t);
  const buildLut = () => {
    const stops = [ // from straight down to straight up, with the horizon at .5
      [0, [250, 253, 255]], [.2, [196, 212, 224]], [.36, [70, 96, 122]], [.482, [8, 22, 38]],
      [.508, [255, 255, 255]], [.6, [214, 240, 252]], [.8, flavour.sky.map((v) => v + (225 - v) * .42)], [1, flavour.sky],
    ];
    for (let i = 0; i < 256; i++) {
      const t = i / 255;
      let k = 0;
      while (k < stops.length - 2 && t > stops[k + 1][0]) k++;
      const [t0, c0] = stops[k];
      const [t1, c1] = stops[k + 1];
      const c = mix(c0, c1, Math.min(1, Math.max(0, (t - t0) / (t1 - t0))));
      LUT[i * 3] = c[0]; LUT[i * 3 + 1] = c[1]; LUT[i * 3 + 2] = c[2];
    }
  };

  let BW = 0;
  let BH = 0;
  let field;
  let height;
  let textField;
  let img;
  let drops = [];
  const pointer = { x: 0, y: 0, tx: 0, ty: 0, r: 0, tr: 0 };
  let seed = 2000;
  const rnd = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };

  const boxBlur = (src, W, H, r) => {
    // Three passes of a box blur stand in for a gaussian.
    const out = new Float32Array(src);
    const tmp = new Float32Array(src.length);
    for (let pass = 0; pass < 3; pass++) {
      for (let y = 0; y < H; y++) {
        let sum = 0;
        const row = y * W;
        for (let x = -r; x <= r; x++) sum += out[row + Math.min(W - 1, Math.max(0, x))];
        for (let x = 0; x < W; x++) {
          tmp[row + x] = sum / (2 * r + 1);
          sum += out[row + Math.min(W - 1, x + r + 1)] - out[row + Math.max(0, x - r)];
        }
      }
      for (let x = 0; x < W; x++) {
        let sum = 0;
        for (let y = -r; y <= r; y++) sum += tmp[Math.min(H - 1, Math.max(0, y)) * W + x];
        for (let y = 0; y < H; y++) {
          out[y * W + x] = sum / (2 * r + 1);
          sum += tmp[Math.min(H - 1, y + r + 1) * W + x] - tmp[Math.max(0, y - r) * W + x];
        }
      }
    }
    return out;
  };

  const buildField = () => {
    const box = stage.getBoundingClientRect();
    if (!box.width) return;
    BW = Math.min(860, Math.max(340, Math.round(box.width * .7)));
    BH = Math.max(90, Math.round(BW * box.height / box.width));
    cv.width = BW;
    cv.height = BH;
    field = new Float32Array(BW * BH);
    height = new Float32Array(BW * BH);
    img = ctx.createImageData(BW, BH);
    // The word itself, inflated, then blurred into a height field
    const off = document.createElement('canvas');
    off.width = BW;
    off.height = BH;
    const o = off.getContext('2d', { willReadFrequently: true });
    const text = title.textContent.trim();
    // Letters are placed one at a time with a little air, so the three shapes stay readable when they melt
    let fs = BH * .92;
    const setFont = () => { o.font = `700 ${fs}px Syncopate, Michroma, sans-serif`; };
    const chars = [...text];
    const gapRatio = .07;
    const measure = () => chars.reduce((sum, c) => sum + o.measureText(c).width, 0) + (chars.length - 1) * fs * gapRatio;
    setFont();
    fs *= Math.min((BW * .8) / measure(), 1.02);
    setFont();
    o.textAlign = 'left';
    o.textBaseline = 'middle';
    o.fillStyle = o.strokeStyle = '#fff';
    o.lineJoin = 'round';
    o.lineWidth = fs * .022;
    let penX = (BW - measure()) / 2;
    for (const c of chars) {
      o.fillText(c, penX, BH * .54);
      o.strokeText(c, penX, BH * .54);
      penX += o.measureText(c).width + fs * gapRatio;
    }
    const a = o.getImageData(0, 0, BW, BH).data;
    const mask = new Float32Array(BW * BH);
    for (let i = 0; i < mask.length; i++) mask[i] = a[i * 4 + 3] / 255;
    const r = Math.max(2, Math.round(fs * .021));
    textField = boxBlur(mask, BW, BH, r);
    for (let i = 0; i < textField.length; i++) textField[i] *= 2.1;
    // Drops drift around and through the letters
    seed = 2000;
    drops = [];
    const n = BW < 420 ? 7 : 10;
    for (let i = 0; i < n; i++) {
      // Kept far enough from the edges that a drop is never sliced by the end of the canvas
      const r = .014 + rnd() * rnd() * .042;
      const ax = .02 + rnd() * .07;
      const ay = .04 + rnd() * .2;
      const mx = ax + r * 2.1;
      const my = ay + (r * 2.1 * BW) / BH;
      drops.push({
        x: mx + rnd() * Math.max(0, 1 - 2 * mx), y: my < .5 ? my + rnd() * (1 - 2 * my) : .5, ax, ay: my < .5 ? ay : Math.max(0, .5 - (r * 2.1 * BW) / BH),
        w1: .17 + rnd() * .22, w2: .13 + rnd() * .2, p1: rnd() * 6.28, p2: rnd() * 6.28, r,
      });
    }
  };

  const drawChrome = (t) => {
    if (!field) return;
    const W = BW;
    const H = BH;
    field.set(textField);
    const put = (cx, cy, r) => {
      if (r < .6) return;
      const R2 = r * r;
      const reach = r * 5;
      const x0 = Math.max(1, Math.floor(cx - reach));
      const x1 = Math.min(W - 2, Math.ceil(cx + reach));
      const y0 = Math.max(1, Math.floor(cy - reach));
      const y1 = Math.min(H - 2, Math.ceil(cy + reach));
      for (let y = y0; y <= y1; y++) {
        const dy = y - cy;
        let i = y * W + x0;
        for (let x = x0; x <= x1; x++, i++) {
          const dx = x - cx;
          const v = R2 / (dx * dx + dy * dy + .25) - .04;
          if (v > 0) field[i] += v;
        }
      }
    };
    for (const d of drops) put((d.x + Math.sin(t * d.w1 + d.p1) * d.ax) * W, (d.y + Math.cos(t * d.w2 + d.p2) * d.ay) * H, d.r * W);
    put(pointer.x * W, pointer.y * H, pointer.r * W);

    // Height: 1 - 1/F is a true hemisphere for a single drop
    const n = W * H;
    for (let i = 0; i < n; i++) {
      const f = field[i];
      height[i] = f > 1 ? Math.sqrt(1 - 1 / f) : 0;
    }
    const data = img.data;
    const S = W * .017;
    const ph = t * .55;
    const sx = 24 / W;
    for (let y = 1; y < H - 1; y++) {
      let i = y * W + 1;
      let p = i * 4;
      for (let x = 1; x < W - 1; x++, i++, p += 4) {
        const f = field[i];
        if (f <= .94) { data[p + 3] = 0; continue; }
        // Normal from the height field, then the reflection of the viewer
        let nx = (height[i - 1] - height[i + 1]) * S;
        let ny = (height[i - W] - height[i + W]) * S;
        const l = 1 / Math.sqrt(nx * nx + ny * ny + 1);
        nx *= l; ny *= l;
        const nz = l;
        const rx = 2 * nz * nx;
        let v = -2 * nz * ny; // up is positive
        v += (.5 - y / H) * .95 + .13 * Math.sin(rx * 3.4 + ph + y * .012) + .05 * Math.sin(x * sx - ph);
        let idx = ((v * .5 + .5) * 255) | 0;
        if (idx < 0) idx = 0; else if (idx > 255) idx = 255;
        let r = LUT[idx * 3];
        let g = LUT[idx * 3 + 1];
        let b = LUT[idx * 3 + 2];
        // A hot highlight from the upper left, and a dark rim so it holds up on the pale page
        let spec = nx * -.46 + ny * -.68 + nz * .57;
        if (spec > .9) {
          spec = (spec - .9) * 10;
          spec = spec * spec * 255;
          r += spec; g += spec; b += spec;
        }
        const rim = f < 1.2 ? .34 + .66 * Math.max(0, (f - 1) / .2) : 1;
        data[p] = r * rim;
        data[p + 1] = g * rim;
        data[p + 2] = b * rim;
        const a = (f - .97) * 16;
        data[p + 3] = a >= 1 ? 255 : (a * 255);
      }
    }
    ctx.putImageData(img, 0, 0);
  };

  // Pointer: one more drop that follows the hand
  stage.addEventListener('pointermove', (e) => {
    const r = stage.getBoundingClientRect();
    pointer.tx = (e.clientX - r.left) / r.width;
    pointer.ty = (e.clientY - r.top) / r.height;
    if (pointer.tr === 0) { pointer.x = pointer.tx; pointer.y = pointer.ty; }
    pointer.tr = .05;
  }, { passive: true });
  stage.addEventListener('pointerleave', () => { pointer.tr = 0; });

  let raf = 0;
  let running = false;
  let inView = true;
  let last = 0;
  let T = 11;
  const frame = (now) => {
    raf = 0;
    if (!running) return;
    raf = requestAnimationFrame(frame);
    if (now - last < 30) return; // about 30 fps is plenty
    const dt = Math.min(.08, (now - last) / 1000);
    last = now;
    T += dt;
    pointer.x += (pointer.tx - pointer.x) * .16;
    pointer.y += (pointer.ty - pointer.y) * .16;
    pointer.r += (pointer.tr - pointer.r) * .1;
    drawChrome(T);
  };
  const sync = () => {
    const should = inView && !document.hidden && !calm();
    if (should && !running) { running = true; last = performance.now(); raf = requestAnimationFrame(frame); }
    if (!should && running) { running = false; cancelAnimationFrame(raf); raf = 0; }
  };
  new IntersectionObserver((es) => { inView = es[0].isIntersecting; sync(); }).observe(stage);
  document.addEventListener('visibilitychange', sync);
  addEventListener('eas:calm', () => { sync(); if (calm()) drawChrome(T); });
  let resizeTimer;
  new ResizeObserver(() => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => { buildField(); drawChrome(T); }, 120);
  }).observe(stage);
  const startChrome = () => {
    title.classList.add('is-liquid');
    buildLut();
    buildField();
    drawChrome(T);
    sync();
  };
  const fontLoad = document.fonts?.load ? document.fonts.load("700 80px Syncopate") : Promise.resolve();
  Promise.race([fontLoad, new Promise((r) => setTimeout(r, 1500))]).then(startChrome, startChrome);

  // ---- Docking bay: case colours and contents ----
  const bay = el('section', 'y2-bay', `<h2>Case colour</h2><div class="y2-candy" role="group" aria-label="Case colour"></div>
    <p>The first iMac came in Bondi Blue in 1998, and the fruit colours followed in 1999. Pick a case: the plastic on this page and the sky in the chrome both change.</p>`);
  const candy = $('.y2-candy', bay);
  for (const f of FLAVOURS) {
    const b = el('button', '', `<i style="--c:${f.c}"></i>${f.name}`);
    b.type = 'button';
    b.dataset.case = f.id;
    b.addEventListener('click', () => {
      flavour = f;
      store.set('eas-y2k-case', f.id);
      paintCase();
      buildLut();
      drawChrome(T);
    });
    candy.append(b);
  }
  bay.append($('.toc'));
  $('.hero-gallery').append(bay);
  paintCase();

  // ---- A clock that reaches midnight at the foot of the page ----
  const clock = el('span', 'y2-clock', '<small></small><b></b>');
  clock.setAttribute('aria-hidden', 'true');
  $('.atlas-home').after(clock);
  const clockDate = $('small', clock);
  const clockTime = $('b', clock);
  clockTime.style.fontWeight = 400;
  const foot = $('.foot');
  const midnight = el('div', 'y2-midnight', '<b></b><span></span>');
  foot.prepend(midnight);
  const midB = $('b', midnight);
  const midS = $('span', midnight);
  let lastSec = -2;
  const tick = () => {
    const max = Math.max(1, document.documentElement.scrollHeight - innerHeight);
    const p = Math.min(1, scrollY / max);
    const sec = p >= .995 ? 60 : Math.floor(p * 60);
    if (sec === lastSec) return;
    lastSec = sec;
    const done = sec === 60;
    clock.classList.toggle('done', done);
    clockDate.textContent = done ? '01.01.2000 ' : '31.12.1999 ';
    clockTime.textContent = done ? '00:00:00' : `23:59:${String(sec).padStart(2, '0')}`;
    midB.textContent = done ? '01.01.2000 00:00:00' : `31.12.1999 23:59:${String(sec).padStart(2, '0')}`;
    midS.textContent = done ? 'All systems normal. The future may begin.' : 'Rollover test in progress. Keep scrolling.';
  };
  let queued = false;
  addEventListener('scroll', () => { if (queued) return; queued = true; requestAnimationFrame(() => { queued = false; tick(); }); }, { passive: true });
  addEventListener('resize', tick);
  tick();

  // ---- Disc player ----
  const wrap = $('.music-wrap');
  const list = $('.tracks', wrap);
  const tracks = $$('.track', list);
  const player = el('div', 'y2-player', `<button class="y2-cd" type="button" aria-label="Play or stop the disc"><span class="y2-face"></span><span class="y2-glyph">▶</span></button>
    <div class="y2-lcd" aria-live="off"><b>NO DISC PLAYING</b><span>TRK -- / ${String(tracks.length).padStart(2, '0')}</span></div>`);
  list.before(player);
  const glyph = $('.y2-glyph', player);
  const lcdA = $('.y2-lcd b', player);
  const lcdB = $('.y2-lcd span', player);
  const paintDisc = () => {
    const i = tracks.findIndex((t) => t.classList.contains('is-playing'));
    const on = i > -1;
    player.classList.toggle('is-on', on);
    glyph.textContent = on ? '■' : '▶';
    lcdA.textContent = on ? $('.track-title', tracks[i]).textContent : 'NO DISC PLAYING';
    lcdB.textContent = `TRK ${on ? String(i + 1).padStart(2, '0') : '--'} / ${String(tracks.length).padStart(2, '0')}`;
  };
  new MutationObserver(paintDisc).observe(list, { subtree: true, attributes: true, attributeFilter: ['class'] });
  $('.y2-cd', player).addEventListener('click', () => {
    if (player.classList.contains('is-on')) $('[data-player-close]').click();
    else $('.track-btn', tracks[0]).click();
  });
})();
