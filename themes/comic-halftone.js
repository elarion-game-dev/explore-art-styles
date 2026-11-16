// Comic Book / Halftone Pop: the page is a printed comic book, and the press that printed it sits under the splash page.
// The press screens a picture into four plates of round dots (cyan, magenta, yellow and black, each at its own angle)
// and prints them over each other on newsprint. Its dot size and register settings belong to the whole page:
// CSS reads --dot and --slip for every tint and colour plate, and every canvas on the page reprints.
(() => {
  const root = document.documentElement;
  const $ = (q, el = document) => el.querySelector(q);
  const $$ = (q, el = document) => [...el.querySelectorAll(q)];
  const isCalm = () => root.dataset.calm === '1';
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
  const store = {
    get(k) { try { return localStorage.getItem(k); } catch { return null; } },
    set(k, v) { try { localStorage.setItem(k, v); } catch { /* private window */ } },
  };
  const page = $('.page');
  if (!page) return;

  // ---- press settings, shared by the CSS and every canvas ----
  const KEY = 'eas-ch-press';
  const SOURCES = ['xiii', 'whaam', 'test'];
  const saved = (() => { try { return JSON.parse(store.get(KEY) || '{}') || {}; } catch { return {}; } })();
  const press = {
    dot: clamp(Math.round(Number(saved.dot)) || (innerWidth < 600 ? 5 : 7), 4, 18),
    slip: false,
    src: SOURCES.includes(saved.src) ? saved.src : 'xiii',
    plates: { c: true, m: true, y: true, k: true },
  };
  const slipPx = () => (press.slip ? 6 : 1.5);
  const applyVars = () => {
    root.style.setProperty('--dot', `${press.dot}px`);
    root.style.setProperty('--slip', `${slipPx()}px`);
    root.dataset.slip = press.slip ? 'out' : 'in';
  };
  // Dot size and picture are remembered. The register lever is not, so a return visit starts with the plates lined up.
  const save = () => store.set(KEY, JSON.stringify({ dot: press.dot, src: press.src }));
  applyVars();

  // ---- the halftone screen ----
  // Process inks as they multiply on newsprint. Each plate has its own screen angle and its own way of slipping.
  const INK = { c: '#2aa8e0', m: '#e8338e', y: '#ffe11c', k: '#1d1a19' };
  const ANGLE = { c: 15, m: 75, y: 0, k: 45 };
  const SHIFT = { c: [-1.1, 0.7], m: [1, -0.8], y: [0.6, 1.1], k: [0, 0] };
  const PLATES = ['y', 'm', 'c', 'k'];
  const NAMES = { c: 'Cyan', m: 'Magenta', y: 'Yellow', k: 'Black' };

  // Radius, in cells, of a round dot that covers a given share of its cell. Past 78% the dots merge, and at 100% the plate is solid.
  const RADIUS = (() => {
    const cover = (r) => (r <= 0.5 ? Math.PI * r * r : Math.PI * r * r - 4 * (r * r * Math.acos(0.5 / r) - 0.5 * Math.sqrt(r * r - 0.25)));
    const t = new Float32Array(257);
    for (let i = 0; i <= 256; i++) {
      const v = i / 256;
      let lo = 0;
      let hi = Math.SQRT1_2;
      for (let n = 0; n < 22; n++) { const mid = (lo + hi) / 2; if (cover(mid) < v) lo = mid; else hi = mid; }
      t[i] = hi * (i > 250 ? 1.03 : 1);
    }
    return t;
  })();

  // One colour to C, M, Y and K, all 0 to 1. Black is a skeleton that only takes over in the darks, so colour keeps the
  // mid-tones. In light colours some of the grey that all three inks share is taken out, so a pale sky prints in its two
  // main inks like a flat comic tint instead of a speckle of all three. Deep colours keep theirs.
  function toCmyk(r, g, b) {
    const v = Math.max(r, g, b);
    const k = Math.max(0, (1 - v - 0.4) / 0.6);
    const den = 1 - k || 1;
    let c = clamp((1 - r - k) / den, 0, 1);
    let m = clamp((1 - g - k) / den, 0, 1);
    let y = clamp((1 - b - k) / den, 0, 1);
    const grey = Math.min(c, m, y) * clamp((v - 0.6) / 0.3, 0, 1) * 0.6;
    c -= grey;
    m -= grey;
    y -= grey;
    return [c, m, y, k];
  }

  // Separates a picture on a grid a little finer than the dots, so each dot carries the average tone under it.
  function separate(src, W, H, cell) {
    const gw = Math.max(2, Math.ceil((W / cell) * 1.5));
    const gh = Math.max(2, Math.ceil((H / cell) * 1.5));
    const cv = document.createElement('canvas');
    cv.width = gw;
    cv.height = gh;
    const g = cv.getContext('2d', { willReadFrequently: true });
    g.imageSmoothingEnabled = true;
    g.imageSmoothingQuality = 'high';
    g.fillStyle = '#fff';
    g.fillRect(0, 0, gw, gh);
    const sw = src.naturalWidth || src.width;
    const sh = src.naturalHeight || src.height;
    const s = Math.max(gw / sw, gh / sh);
    g.drawImage(src, (gw - sw * s) / 2, (gh - sh * s) / 2, sw * s, sh * s);
    const d = g.getImageData(0, 0, gw, gh).data;
    const out = new Float32Array(gw * gh * 4);
    for (let i = 0; i < gw * gh; i++) out.set(toCmyk(d[i * 4] / 255, d[i * 4 + 1] / 255, d[i * 4 + 2] / 255), i * 4);
    return { gw, gh, out, sx: gw / W, sy: gh / H };
  }
  const sample = (sep, x, y, ch) => {
    const fx = clamp(x * sep.sx - 0.5, 0, sep.gw - 1.001);
    const fy = clamp(y * sep.sy - 0.5, 0, sep.gh - 1.001);
    const x0 = fx | 0;
    const y0 = fy | 0;
    const tx = fx - x0;
    const ty = fy - y0;
    const o = sep.out;
    const i = (y0 * sep.gw + x0) * 4 + ch;
    const j = i + sep.gw * 4;
    const a = o[i] + (o[i + 4] - o[i]) * tx;
    const b = o[j] + (o[j + 4] - o[j]) * tx;
    return a + (b - a) * ty;
  };

  // Comics print their line art solid on the black plate and screen only the colour. This finds the inked lines
  // (pixels close to black) at full resolution, as a black layer with soft edges.
  function lineArt(src, W, H, dpr) {
    const cw = Math.round(W * dpr);
    const chh = Math.round(H * dpr);
    const c = document.createElement('canvas');
    c.width = cw;
    c.height = chh;
    const g = c.getContext('2d', { willReadFrequently: true });
    g.imageSmoothingEnabled = true;
    g.imageSmoothingQuality = 'high';
    const sw = src.naturalWidth || src.width;
    const sh = src.naturalHeight || src.height;
    const s = Math.max(cw / sw, chh / sh);
    g.drawImage(src, (cw - sw * s) / 2, (chh - sh * s) / 2, sw * s, sh * s);
    const id = g.getImageData(0, 0, cw, chh);
    const d = id.data;
    for (let i = 0; i < d.length; i += 4) {
      const v = Math.max(d[i], d[i + 1], d[i + 2]);
      d[i + 3] = clamp((64 - v) / 26, 0, 1) * 255;
      d[i] = 29;
      d[i + 1] = 26;
      d[i + 2] = 25;
    }
    g.putImageData(id, 0, 0);
    return c;
  }

  // A ready-made line plate (black lines on white) scaled to the proof like the picture, so white leaves the dots alone.
  function fitPlate(img, W, H, dpr) {
    const c = document.createElement('canvas');
    c.width = Math.round(W * dpr);
    c.height = Math.round(H * dpr);
    const g = c.getContext('2d');
    g.imageSmoothingEnabled = true;
    g.imageSmoothingQuality = 'high';
    const s = Math.max(c.width / img.naturalWidth, c.height / img.naturalHeight);
    g.fillStyle = '#fff';
    g.fillRect(0, 0, c.width, c.height);
    g.drawImage(img, (c.width - img.naturalWidth * s) / 2, (c.height - img.naturalHeight * s) / 2, img.naturalWidth * s, img.naturalHeight * s);
    return c;
  }

  // Prints the separated picture: paper first, then one plate of dots at a time, multiplied like ink over ink.
  function print(ctx, W, H, sep, cell, opt = {}) {
    const plates = opt.plates || { c: true, m: true, y: true, k: true };
    const slip = opt.slip ?? slipPx();
    ctx.save();
    ctx.globalCompositeOperation = 'source-over';
    ctx.fillStyle = opt.paper || '#f8f1de';
    ctx.fillRect(0, 0, W, H);
    ctx.globalCompositeOperation = 'multiply';
    for (const p of PLATES) {
      if (!plates[p]) continue;
      const a = (ANGLE[p] * Math.PI) / 180;
      const ca = Math.cos(a);
      const sa = Math.sin(a);
      const dx = SHIFT[p][0] * slip;
      const dy = SHIFT[p][1] * slip;
      const ch = 'cmyk'.indexOf(p);
      const us = [];
      const vs = [];
      for (const [x, y] of [[0, 0], [W, 0], [0, H], [W, H]]) { us.push((x * ca + y * sa) / cell); vs.push((-x * sa + y * ca) / cell); }
      const u0 = Math.floor(Math.min(...us)) - 1;
      const u1 = Math.ceil(Math.max(...us)) + 1;
      const v0 = Math.floor(Math.min(...vs)) - 1;
      const v1 = Math.ceil(Math.max(...vs)) + 1;
      ctx.beginPath();
      for (let v = v0; v <= v1; v++) {
        for (let u = u0; u <= u1; u++) {
          const x = (u * ca - v * sa) * cell;
          const y = (u * sa + v * ca) * cell;
          if (x < -cell || y < -cell || x > W + cell || y > H + cell) continue;
          const t = sample(sep, x, y, ch);
          if (t < 0.08) continue;
          const r = RADIUS[Math.round(t * 256)] * cell;
          ctx.moveTo(x + dx + r, y + dy);
          ctx.arc(x + dx, y + dy, r, 0, Math.PI * 2);
        }
      }
      ctx.fillStyle = INK[p];
      ctx.fill();
    }
    // The key plate's line art goes down last and solid. It never slips: the colour plates are registered to it.
    if (opt.line && plates.k) ctx.drawImage(opt.line, 0, 0, W, H);
    ctx.restore();
  }

  // Everything printed on the page registers here, so a change on the press reprints all of it.
  const printed = [];
  function printable(canvas, opts) {
    const item = { canvas, ...opts };
    printed.push(item);
    // The observer also fires once at the start, once the canvas has its laid-out size.
    if ('ResizeObserver' in window) new ResizeObserver(() => draw(item)).observe(canvas);
    else draw(item);
    return item;
  }
  function draw(item) {
    const { canvas } = item;
    const box = canvas.getBoundingClientRect();
    const W = Math.round(box.width);
    const H = Math.round(box.height);
    if (!W || !H) return;
    const src = item.source();
    if (!src) return;
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    if (canvas.width !== Math.round(W * dpr) || canvas.height !== Math.round(H * dpr)) {
      canvas.width = Math.round(W * dpr);
      canvas.height = Math.round(H * dpr);
    }
    const ctx = canvas.getContext('2d');
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const cell = (item.scale || 1) * press.dot;
    let sep;
    let line = null;
    try {
      sep = separate(src, W, H, cell);
      // A picture's line plate is either drawn from the original at full size, or found in the picture itself ('auto').
      const plate = item.line ? item.line() : null;
      if (plate) {
        const key = plate === 'auto' ? src : plate;
        const c = item.lineCache;
        if (!c || c.key !== key || c.W !== W || c.H !== H || c.dpr !== dpr) item.lineCache = { key, W, H, dpr, canvas: plate === 'auto' ? lineArt(src, W, H, dpr) : fitPlate(plate, W, H, dpr) };
        line = item.lineCache.canvas;
      }
    } catch { return; }
    print(ctx, W, H, sep, cell, { plates: item.plates ? press.plates : null, paper: item.paper, line });
    if (item.after) item.after(ctx, W, H);
  }
  // Reprints wait for the next frame, and requests in the same frame add up, so a full reprint is never lost.
  let queued = 0;
  let pending = null;
  const reprint = (only) => {
    if (!only) pending = 'all';
    else if (pending !== 'all') { pending = pending || new Set(); only.forEach((it) => { if (it) pending.add(it); }); }
    if (queued) return;
    queued = requestAnimationFrame(() => {
      const todo = pending;
      pending = null;
      queued = 0;
      printed.forEach((it) => { if (todo === 'all' || todo.has(it)) draw(it); });
    });
  };

  // ---- original art for the press ----
  // Small copies of two of the main images, carried in this file so the press can read their pixels on any page, even one
  // opened from disk. XIII and Whaam! also bring a line plate made from the full-size image.
  const pictures = {};
  const loadPicture = (key, data) => {
    const img = new Image();
    img.decoding = 'async';
    img.src = data;
    pictures[key] = img;
    // Only the proof uses these, and only the picture on the press needs a reprint when it arrives.
    img.addEventListener('load', () => { if (key.split('-')[0] === press.src) reprint([proofItem]); }, { once: true });
  };
  // A procedural test sheet: a lit ball under a sky, then a ramp from paper to solid in each ink.
  const sheet = (() => {
    const c = document.createElement('canvas');
    c.width = 360;
    c.height = 240;
    const g = c.getContext('2d');
    const sky = g.createLinearGradient(0, 0, 0, 172);
    sky.addColorStop(0, '#34b3ea');
    sky.addColorStop(1, '#ffffff');
    g.fillStyle = sky;
    g.fillRect(0, 0, 360, 172);
    const sun = g.createRadialGradient(286, 52, 4, 286, 52, 70);
    sun.addColorStop(0, 'rgb(255 236 80)');
    sun.addColorStop(1, 'rgb(255 236 80 / 0)');
    g.fillStyle = sun;
    g.fillRect(180, 0, 180, 140);
    const ball = g.createRadialGradient(100, 62, 6, 124, 92, 66);
    ball.addColorStop(0, '#fff3e6');
    ball.addColorStop(0.35, '#f04634');
    ball.addColorStop(0.8, '#8c1018');
    ball.addColorStop(1, '#1c0507');
    g.fillStyle = ball;
    g.beginPath();
    g.arc(124, 92, 64, 0, Math.PI * 2);
    g.fill();
    const ramps = [[0, 255, 255], [255, 0, 255], [255, 255, 0], [0, 0, 0]];
    ramps.forEach((rgb, i) => {
      const lg = g.createLinearGradient(0, 0, 360, 0);
      lg.addColorStop(0, '#fff');
      lg.addColorStop(1, `rgb(${rgb.join(' ')})`);
      g.fillStyle = lg;
      g.fillRect(0, 172 + i * 17, 360, 17);
    });
    return c;
  })();
  const ART = {
    xiii: { name: 'XIII', alt: 'the XIII key art' },
    whaam: { name: 'Whaam!', alt: 'the middle of Roy Lichtenstein’s Whaam!' },
    test: { name: 'Test sheet', alt: 'a test sheet of a lit ball and four ink ramps' },
  };
  const ready = (img) => (img && img.complete && img.naturalWidth ? img : null);
  const pictureFor = (key) => (key === 'test' ? sheet : ready(pictures[key]));
  const lineFor = (key) => (key === 'test' ? 'auto' : ready(pictures[`${key}-line`]));

  // ---- the splash page: its sky is printed by the press, with speed lines ruled over it ----
  const heroText = $('.hero-text');
  const title = $('.hero-title');
  if (title) title.dataset.text = title.textContent.trim();
  let skyItem = null;
  if (heroText) {
    const sky = document.createElement('canvas');
    sky.className = 'ch-splash';
    sky.setAttribute('aria-hidden', 'true');
    heroText.prepend(sky);
    const art = document.createElement('canvas');
    art.width = 240;
    art.height = 100;
    const g = art.getContext('2d');
    const glow = g.createRadialGradient(70, 56, 4, 92, 50, 190);
    glow.addColorStop(0, '#ffffff');
    glow.addColorStop(0.3, '#eef8fd');
    glow.addColorStop(0.7, '#8bd0f2');
    glow.addColorStop(1, '#2f9fdc');
    g.fillStyle = glow;
    g.fillRect(0, 0, 240, 100);
    const warm = g.createRadialGradient(240, 100, 2, 240, 100, 90);
    warm.addColorStop(0, 'rgb(240 70 140 / .55)');
    warm.addColorStop(1, 'rgb(240 70 140 / 0)');
    g.fillStyle = warm;
    g.fillRect(0, 0, 240, 100);
    skyItem = printable(sky, {
      source: () => art,
      paper: '#fbf6e6',
      after(ctx, W, H) {
        // Speed lines: thin black wedges ruled from the title outward, only near the panel's edges.
        const cx = W * 0.3;
        const cy = H * 0.52;
        const R = Math.hypot(W, H);
        ctx.save();
        ctx.fillStyle = '#1d1a19';
        let seed = 7;
        const rnd = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };
        for (let i = 0; i < 120; i++) {
          const a = (i / 120) * Math.PI * 2 + rnd() * 0.02;
          const w = 0.002 + rnd() * 0.006;
          const r0 = R * (0.42 + rnd() * 0.18);
          ctx.beginPath();
          ctx.moveTo(cx + Math.cos(a) * r0, cy + Math.sin(a) * r0);
          ctx.lineTo(cx + Math.cos(a - w) * R, cy + Math.sin(a - w) * R);
          ctx.lineTo(cx + Math.cos(a + w) * R, cy + Math.sin(a + w) * R);
          ctx.closePath();
          ctx.fill();
        }
        ctx.restore();
      },
    });
  }

  // ---- panels sized by their pictures, so a tier of panels shares one height and nothing is cropped ----
  for (const fig of $$('.hero-gallery .shot, .ref-gallery .shot')) {
    const img = $('img', fig);
    const w = Number(img?.getAttribute('width'));
    const h = Number(img?.getAttribute('height'));
    if (w && h) fig.style.setProperty('--ar', (w / h).toFixed(4));
  }
  $$('.hero-gallery .shot').forEach((fig, i) => fig.style.setProperty('--n', `"${i + 1}"`));

  // ---- THE PRESS ----
  const pressEl = document.createElement('section');
  pressEl.className = 'ch-press';
  pressEl.setAttribute('aria-labelledby', 'ch-press-title');
  const plateBoxes = ['c', 'm', 'y', 'k'].map((p) => `<label class="ch-plate ch-plate-${p}"><input type="checkbox" value="${p}" checked><span class="ch-plate-chip" aria-hidden="true"></span><span>${NAMES[p]} <small>${ANGLE[p]}°</small></span></label>`).join('');
  // A registration target is printed by every plate, so when the plates slip it splits into colours.
  const target = (where) => `<svg class="ch-target ch-target-${where}" viewBox="-15 -15 30 30" aria-hidden="true">${['y', 'm', 'c', 'k'].map((p) => `<g class="ch-t-${p}" stroke="${INK[p]}"><circle r="7.5" fill="none" stroke-width="1.6"/><path d="M-14 0H14M0-14V14" stroke-width="1.2"/></g>`).join('')}</svg>`;
  const srcButtons = SOURCES.map((k) => `<label class="ch-src ch-src-${k}"><input type="radio" name="ch-src" value="${k}"${k === press.src ? ' checked' : ''}><span class="ch-src-thumb" aria-hidden="true"></span><span class="ch-src-name">${ART[k].name}</span></label>`).join('');
  pressEl.innerHTML = `
    <div class="ch-press-head">
      <h2 class="ch-press-title" id="ch-press-title">The halftone press</h2>
      <p class="ch-press-note">This press prints the page's own dots: the sky on the splash page, every tint and the palette patches. Pick a picture, set the dot size and switch plates off to see the separations. The register lever reaches the whole page.</p>
    </div>
    <div class="ch-press-body">
      <div class="ch-sheet">
        <div class="ch-trim">
          ${target('t')}${target('l')}${target('r')}
          <div class="ch-proof">
            <canvas class="ch-proof-canvas" role="img"></canvas>
            <canvas class="ch-loupe" aria-hidden="true" width="180" height="180"></canvas>
          </div>
        </div>
        <div class="ch-bar" aria-hidden="true"><i class="ch-bar-c"></i><i class="ch-bar-m"></i><i class="ch-bar-y"></i><i class="ch-bar-k"></i><i class="ch-bar-r"></i><i class="ch-bar-g"></i><i class="ch-bar-b"></i><i class="ch-bar-t1"></i><i class="ch-bar-t2"></i><i class="ch-bar-t3"></i></div>
        <p class="ch-slug" aria-hidden="true"></p>
      </div>
      <div class="ch-desk">
        <fieldset class="ch-field ch-srcs"><legend>Original art</legend><div class="ch-src-row">${srcButtons}</div></fieldset>
        <div class="ch-field ch-dotsize">
          <label for="ch-dot">Dot size <output id="ch-dot-out" for="ch-dot">${press.dot} px</output></label>
          <input id="ch-dot" type="range" min="4" max="18" step="1" value="${press.dot}">
          <div class="ch-scale" aria-hidden="true"><span>fine</span><span>pop art</span></div>
        </div>
        <fieldset class="ch-field ch-plates"><legend>Plates</legend><div class="ch-plate-row">${plateBoxes}</div></fieldset>
        <button class="ch-lever" type="button" aria-pressed="${press.slip}"><span class="ch-lever-knob" aria-hidden="true"></span><span class="ch-lever-text">Knock the plates out of register</span></button>
      </div>
    </div>`;
  const toc = $('.toc');
  (toc || $('.hero')).after(pressEl);

  const proof = $('.ch-proof-canvas', pressEl);
  const slug = $('.ch-slug', pressEl);
  const describe = () => {
    const on = ['c', 'm', 'y', 'k'].filter((p) => press.plates[p]);
    const names = on.map((p) => NAMES[p].toLowerCase());
    proof.setAttribute('aria-label', `${ART[press.src].alt[0].toUpperCase()}${ART[press.src].alt.slice(1)}, printed in ${names.length ? names.join(', ') : 'no'} ink, with dots ${press.dot} pixels apart${press.slip ? ' and the plates out of register' : ''}.`);
    slug.textContent = `Proof: ${ART[press.src].name} · dots ${press.dot} px apart · ${on.length ? on.map((p) => `${p.toUpperCase()} ${ANGLE[p]}°`).join('  ') : 'no plates'} · ${press.slip ? 'out of register' : 'in register'}`;
  };
  // On first sight the proof prints one plate at a time: yellow, magenta, cyan, then black.
  let pulling = 0;
  const proofItem = printable(proof, {
    source: () => pictureFor(press.src),
    plates: true,
    line: () => lineFor(press.src),
    paper: '#f6eed8',
  });
  describe();
  const pullProof = () => {
    if (isCalm()) return;
    clearTimeout(pulling);
    const keep = { ...press.plates };
    const seq = PLATES.filter((p) => keep[p]);
    let n = 0;
    const step = () => {
      PLATES.forEach((p) => { press.plates[p] = keep[p] && seq.indexOf(p) < n; });
      draw(proofItem);
      n += 1;
      if (n <= seq.length && !isCalm()) pulling = setTimeout(step, 360);
      else { Object.assign(press.plates, keep); draw(proofItem); }
    };
    step();
  };
  if ('IntersectionObserver' in window && !isCalm()) {
    const io = new IntersectionObserver((entries) => {
      if (!entries.some((e) => e.isIntersecting)) return;
      io.disconnect();
      if (pictureFor(press.src)) pullProof();
      else pictures[press.src]?.addEventListener('load', pullProof, { once: true });
    }, { threshold: 0.45 });
    io.observe(proof);
  }
  addEventListener('eas:calm', () => {
    if (!isCalm()) return;
    clearTimeout(pulling);
    PLATES.forEach((p) => { press.plates[p] = $(`.ch-plate input[value="${p}"]`, pressEl).checked; });
    draw(proofItem);
  });

  // Controls
  const dotIn = $('#ch-dot', pressEl);
  const dotOut = $('#ch-dot-out', pressEl);
  dotIn.addEventListener('input', () => {
    press.dot = Number(dotIn.value);
    dotOut.textContent = `${press.dot} px`;
    applyVars();
    describe();
    // While the slider moves only the proof and the splash reprint; the rest follows when it is let go.
    reprint([proofItem, skyItem]);
  });
  dotIn.addEventListener('change', () => { save(); reprint(); });
  $$('.ch-plate input', pressEl).forEach((box) => box.addEventListener('change', () => {
    clearTimeout(pulling);
    PLATES.forEach((p) => { press.plates[p] = $(`.ch-plate input[value="${p}"]`, pressEl).checked; });
    describe();
    draw(proofItem);
  }));
  $$('.ch-src input', pressEl).forEach((r) => r.addEventListener('change', () => {
    if (!r.checked) return;
    press.src = r.value;
    save();
    describe();
    draw(proofItem);
  }));
  const lever = $('.ch-lever', pressEl);
  lever.addEventListener('click', () => {
    press.slip = !press.slip;
    lever.setAttribute('aria-pressed', String(press.slip));
    applyVars();
    save();
    describe();
    reprint();
  });

  // A printer's loupe: hover the proof to see the dots three times larger.
  const loupe = $('.ch-loupe', pressEl);
  const ldpr = Math.min(2, window.devicePixelRatio || 1);
  loupe.width = 180 * ldpr;
  loupe.height = 180 * ldpr;
  const lg = loupe.getContext('2d');
  const proofBox = $('.ch-proof', pressEl);
  const moveLoupe = (e) => {
    const box = proof.getBoundingClientRect();
    const x = e.clientX - box.left;
    const y = e.clientY - box.top;
    if (x < 0 || y < 0 || x > box.width || y > box.height) { proofBox.classList.remove('is-looking'); return; }
    proofBox.classList.add('is-looking');
    const k = proof.width / box.width;
    const span = 60;
    lg.imageSmoothingEnabled = false;
    lg.fillStyle = '#f6eed8';
    lg.fillRect(0, 0, loupe.width, loupe.height);
    lg.drawImage(proof, (x - span / 2) * k, (y - span / 2) * k, span * k, span * k, 0, 0, loupe.width, loupe.height);
    loupe.style.transform = `translate(${x - 90}px, ${y - 90}px)`;
  };
  proof.addEventListener('pointermove', (e) => { if (e.pointerType === 'mouse') moveLoupe(e); });
  proof.addEventListener('pointerleave', () => proofBox.classList.remove('is-looking'));

  // Source thumbnails show the original art, so the proof can be compared with it.
  const thumbFor = (k) => $(`.ch-src-${k} .ch-src-thumb`, pressEl);
  thumbFor('test').append(sheet.cloneNode(true));
  $('canvas', thumbFor('test')).getContext('2d').drawImage(sheet, 0, 0);

  // ---- core elements: each panel gets a small drawing of the idea ----
  const svg = (w, h, body) => `<svg viewBox="0 0 ${w} ${h}" preserveAspectRatio="xMidYMid meet" aria-hidden="true">${body}</svg>`;
  // Energy crackling out of a white-hot core: chains of black dots that bend away and shrink, with smaller dots thrown off.
  const kirby = () => {
    let seed = 11;
    const rnd = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };
    let dots = '';
    const dot = (x, y, r) => { dots += `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${r.toFixed(1)}"/>`; };
    const arms = 9;
    for (let n = 0; n < arms; n++) {
      let a = (n / arms) * Math.PI * 2 + rnd() * 0.5;
      const bend = (rnd() - 0.5) * 0.1;
      for (let j = 0; j < 8; j++) {
        a += bend;
        const d = 16 + j * 10 + rnd() * 4;
        const r = Math.max(1.4, 8.5 - j * 0.95 + (rnd() - 0.5) * 2.2);
        const x = 150 + Math.cos(a) * d * 1.6;
        const y = 70 + Math.sin(a) * d * 0.78;
        dot(x, y, r);
        if (rnd() < 0.55) dot(x + (rnd() - 0.5) * r * 3, y + (rnd() - 0.5) * r * 3, r * (0.25 + rnd() * 0.3));
      }
    }
    return dots;
  };
  const DEMOS = [
    [/light|energy|kirby/i, () => `<div class="ch-demo ch-demo-energy">${svg(300, 140, `<g class="ch-kirby">${kirby()}</g>`)}</div>`],
    [/regist|plate/i, () => `<div class="ch-demo ch-demo-slip" tabindex="0" role="img" aria-label="POW printed in magenta and yellow plates that have slipped. Hover or tap to pull them into register.">${svg(300, 140, `<g font-family="Luckiest Guy, Impact, sans-serif" font-size="96" text-anchor="middle"><text class="ch-pl ch-pl-y" x="150" y="108" fill="#ffe11c">POW</text><text class="ch-pl ch-pl-m" x="150" y="108" fill="#e8338e">POW</text><text x="150" y="108" fill="none" stroke="#1d1a19" stroke-width="4" stroke-linejoin="round">POW</text></g>`)}</div>`],
    [/dot|hatch|gradient|tone/i, () => '<div class="ch-demo ch-demo-dots"><canvas aria-hidden="true"></canvas></div>'],
    [/line|ink/i, () => `<div class="ch-demo ch-demo-line">${svg(300, 140, '<path class="ch-bolt-fill" d="M168 8 96 78h44l-30 56 92-80h-46l40-46z" fill="#ffd91f"/><path d="M168 8 96 78h44l-30 56 92-80h-46l40-46z" fill="none" stroke="#1d1a19" stroke-width="9" stroke-linejoin="round"/><path d="M60 40h26M50 62h30M58 104h32M214 30h30M222 92h26M206 116h34" stroke="#1d1a19" stroke-width="3" stroke-linecap="round"/>')}</div>`],
    [/sound|sfx|letter|noise|read/i, () => '<div class="ch-demo ch-demo-sfx"><span class="ch-sfx-word" aria-hidden="true">KRAKOOM</span></div>'],
    [/panel|balloon|caption/i, () => `<div class="ch-demo ch-demo-panels">${svg(300, 140, '<g fill="#fdf8ea" stroke="#1d1a19" stroke-width="4"><rect x="12" y="10" width="86" height="120"/><rect x="108" y="10" width="180" height="56"/><rect x="108" y="74" width="84" height="56"/><rect x="202" y="74" width="86" height="56"/></g><rect x="12" y="10" width="54" height="20" fill="#ffe98c" stroke="#1d1a19" stroke-width="3"/><ellipse cx="200" cy="34" rx="56" ry="17" fill="#fff" stroke="#1d1a19" stroke-width="3"/><path d="M178 48 170 64 190 50" fill="#fff" stroke="#1d1a19" stroke-width="3" stroke-linejoin="round"/><path d="M182 47h12" stroke="#fff" stroke-width="4"/><g fill="#1d1a19"><rect x="170" y="29" width="22" height="4"/><rect x="198" y="29" width="34" height="4"/><rect x="176" y="37" width="44" height="4"/></g><circle cx="56" cy="84" r="18" fill="#e8338e" stroke="#1d1a19" stroke-width="3"/><path d="M30 130c4-24 12-28 26-28s22 4 26 28" fill="#2aa8e0" stroke="#1d1a19" stroke-width="3"/>')}</div>`],
  ];
  const used = new Set();
  for (const item of $$('.core-item')) {
    const t = $('h3', item)?.textContent || '';
    const pick = DEMOS.findIndex(([re], i) => !used.has(i) && re.test(t));
    if (pick < 0) continue;
    used.add(pick);
    item.insertAdjacentHTML('afterbegin', DEMOS[pick][1]());
    item.classList.add('has-demo');
  }
  const dotsDemo = $('.ch-demo-dots canvas');
  if (dotsDemo) {
    // A ball shaded by dots alone, with its core shadow hatched in lines that run from thin to thick.
    const art = document.createElement('canvas');
    art.width = 300;
    art.height = 140;
    const g = art.getContext('2d');
    g.fillStyle = '#fff';
    g.fillRect(0, 0, 300, 140);
    const ball = g.createRadialGradient(130, 50, 4, 150, 72, 62);
    ball.addColorStop(0, '#ffffff');
    ball.addColorStop(0.45, '#f6a3c4');
    ball.addColorStop(1, '#d81b70');
    g.fillStyle = ball;
    g.beginPath();
    g.arc(150, 72, 58, 0, Math.PI * 2);
    g.fill();
    printable(dotsDemo, {
      source: () => art,
      paper: '#fdf8ea',
      scale: 0.8,
      after(ctx, W, H) {
        const s = Math.min(W / 300, H / 140);
        const ox = (W - 300 * s) / 2;
        const oy = (H - 140 * s) / 2;
        ctx.save();
        ctx.translate(ox, oy);
        ctx.scale(s, s);
        ctx.beginPath();
        ctx.arc(150, 72, 58, 0, Math.PI * 2);
        ctx.clip();
        ctx.strokeStyle = '#1d1a19';
        ctx.lineCap = 'round';
        // Diagonal hatching across the side turned from the light (x + y > 238), from hairlines at the terminator to heavy at the rim.
        for (let c = 238; c <= 310; c += 6) {
          ctx.lineWidth = 0.5 + ((c - 238) / 72) * 3.4;
          ctx.beginPath();
          ctx.moveTo(c - 140, 140);
          ctx.lineTo(c, 0);
          ctx.stroke();
        }
        ctx.restore();
        ctx.save();
        ctx.translate(ox, oy);
        ctx.scale(s, s);
        ctx.lineWidth = 4;
        ctx.strokeStyle = '#1d1a19';
        ctx.beginPath();
        ctx.arc(150, 72, 58, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();
      },
    });
  }

  // ---- mood words become sound effects; two of them do what they say ----
  for (const li of $$('.mood-words li')) {
    const w = li.textContent;
    if (/regist/i.test(w)) li.classList.add('ch-sfx-slip');
    if (/dot/i.test(w)) li.classList.add('ch-sfx-dots');
  }

  // ---- palette: each colour as the press would separate it, with a printed patch under the flat ink ----
  for (const sw of $$('.swatch')) {
    const hex = $('button', sw)?.dataset.copy;
    if (!/^#[0-9a-f]{6}$/i.test(hex || '')) continue;
    // The numbers are what the press prints, so a tint too small to hold reads 0.
    const pct = (v) => (v < 0.08 ? 0 : Math.round(v * 100));
    const [c, m, y, k] = toCmyk(...[1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255)).map(pct);
    const sep = { c, m, y, k };
    const chip = $('.chip', sw);
    const cv = document.createElement('canvas');
    cv.className = 'ch-chip-print';
    cv.setAttribute('aria-hidden', 'true');
    chip.append(cv);
    const flat = document.createElement('canvas');
    flat.width = 8;
    flat.height = 8;
    const fg = flat.getContext('2d');
    fg.fillStyle = hex;
    fg.fillRect(0, 0, 8, 8);
    printable(cv, { source: () => flat, paper: '#fdf8ea', scale: 0.9 });
    $('button', sw).insertAdjacentHTML('beforeend', `<span class="ch-cmyk"><span class="ch-vh">This page's press separates it as </span><i>C${sep.c}</i><i>M${sep.m}</i><i>Y${sep.y}</i><i>K${sep.k}</i></span>`);
  }
  // The split is this press's own simple separation, so say so: it is not a print value from a colour profile.
  const swatchList = $('.swatches');
  if (swatchList && $('.ch-cmyk', swatchList)) {
    swatchList.insertAdjacentHTML('afterend', '<p class="ch-cmyk-note">C, M, Y and K under each colour: how this page’s press splits it into dots for the printed patch. It is a simple separation for the screen, not print values from a colour profile.</p>');
  }

  // ---- pictures for the press, last so the page itself never waits on them ----
  const data = artData();
  for (const k of ['xiii-line', 'whaam-line']) loadPicture(k, data[k]);
  for (const k of ['xiii', 'whaam']) {
    loadPicture(k, data[k]);
    const im = document.createElement('img');
    im.alt = '';
    im.src = data[k];
    thumbFor(k).append(im);
  }

  // Small copies (330 x 220 WebP) of the XIII key art and the middle of Whaam! from the main images, cropped to the
  // proof's shape, and 1-bit line plates (660 x 440 PNG) traced from the full-size images.
  function artData() {
    return {
      xiii: 'data:image/webp;base64,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',
      whaam: 'data:image/webp;base64,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',
      'xiii-line': 'data:image/png;base64,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',
      'whaam-line': 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAApQAAAG4AQAAAADTMkpBAAAsDklEQVR42u19f3Ak2V3f572eVc/65J32cbZlkHf6zJE6E9vRBUPW1LLdhyl8laSKqwpVcQjmBLjAcRXFOjhwZ/a2n26vuK2Kk1WoVAUSx5INf7hS+eMCpMoX7k69twsrYrBkAsSAD7V2FyRjYvWsZNQj9bxP/nive3pmekbSJqnKH/Qfd1pp5jvvfX//HuBvnv/vn4A1T/bU6O9W+NdLecSA5BbzQ1KTS8UfdXSFXGKPJFNZ+0FTy6O/C3F6HgoA0ASy4T9PA6H9UZ70XuaNvcbw7xf7P9bDFOoY0HX156jyD5lMOM24p3xPH0XaB2L7c+P/DqXz6inG4NOfCMFDlgKiiiwoQFl0yPs5VQzZHPpVVjnIGJjpse7bv3DWwZF3Hw+m+rAP5vZ9w7RgfCAZfSvvm+cBQGFvGFc37/ucYpgsxdO4Cmg1GWZ8rI8ooWBAcuTJ7w0AiTcoLvQqBBwDc/EIPdIcukizihg5nrqTKN/nYb0NAK/6FfzWw9STZFOxz64d4cwW/7o3GebeUSpu3bKBB6YAMB1W6FQPM52g63roa3sE7FPu5mSYyxN0sowHRWcPIGaU+YwJMBfGwStZfbnKk5p9LhsHk1NjYGYA9pQu1Fpmmb4HYVg0Gw9TNyfQaBvCnMnrv1nPHSlHuTdJySd9+e1VJL/Pf7X2KJvEnnE4aAOTGaQPPAfkYWFJa8+ZTlIhy8hLYZKGpWQ+oKZqYW5O4HiGfc3csHAScfdIuv/2RA3S94fSRoUf0snnvDpRZ/r2TKqEEw9erg4mJ5G9B2TQFfEchSLrTPBYsjeGfCXLViqNgdfKv8shBwMA9CRv6QBZo9DMiWfe8967TaABxAYLdXfPJ2gQsQevVOnN2CAzr4p7XAuzeyzfgSWSiGZFLa3Xwhxv91JgG3nf/7JnC2Ovb1L2INUJnaV1oGkEp3yn1otHnukuJopmE8gohARWLDFf8P2CvsCZWpjN41hNnAY8ZXDaCCue+AO1MOMjYoQEcMm/LuHkTnTk3b3Jfogc1JDK8olfutiyFmXjniYEAK+gohgy7LnxwO/LVyyeTxUSaiVPjb07J4mmBBgPIe5m34VW4En9usRCag54oH3VmKpxNDoqiFsu9FGjRjXqsA6mPrZvnyIHwqrDFgL5/xmNwkKh5H1TmtfSXRzt1HuF+5CByOKhP8sjg6AJAe46GgA6g4oyq4MpjxMcVlRYP9wKm0AqIdOTINCr44vGwGlkWneoY4TffuGhJwBWKZSqKkpZ7xAeGdAIUXJQx6ly3+rd++WlTWAbCBEDamWAodVqep95hh0a3dSEdkJzNVWi/MR31xVuUvCHYyn6iye8e1wYEK8SgQywgQ6Q3L9sJvbAeiRckyfP0EyMIXNVq5fSoxMNqvCLlPHp+9cXOeITn/OgoJMHQCfDGieD8k4G069IWYwMAsgPRrhGnjRflda8RvcRc09AyZPmLcro37eBVGOQF1L48n5YKC+UjRwhaeM2T8hLJYurPvKaA7hMgPDE5/xSH36KxnDKRgG67pzhkXBl8ZoUyLxBC9bI62ikjlTHmU3eoBmPkrR7v/mlulSVldT0/nLUjQKiN+AFGhTchgxPdncW/2WF9/P+O5u4WXNOHnHI2LKkMj87YeWdHvAtV098d636/OkNi7EyaYz70snNQsYV8PWKDCgAXnjCuw+yYoxQjXhCrZP73jkAJLr/8WLQ28gAyOw+3U8x5MA31ASHK5/ISAdISlfRB0aR15EmcjxRaj40h8zrUd/1JKQezXNNevYqWlsVHlsff73Qrcjm7vUHT1RCkFWRL3RonLczQLoGvvhXwdf/awPV6Gcsa5asfiiAZtUXCkWCPciGAiAaVMA/6DaBQ3W80lEGhCPpx/gAAKRcxqaw2HbuNXDmqHunKC2joDLQV+N+qjWB7G4KH0WsPHUonp6sPNf7rh8rlEmq2Gn4cSjfXt5X8Dh+Q0WHwkMy59AqUZ1OY/1hmZ8XveT4srlcOaAalcAGAEjt6OMruopgpxVV0hh0YWTrPsJBNaIYwr4uWYZsquMDlBW6lGyOZaRIgQ3RsL+VjRgnu3sGrdI+o/qlP3AJQAKGJ9afCh6w8GhFPRdH11cKdSRlchKQukLwvN4CKEiR4qRPL0qrCSNVXj0VHjQg8fSJwI0k4JROjGAdAB5iCKCB8ycAKUTJQD3h5APClRqezacgcfb4IJ0/+V5AhAcAEOzng0dvQFimlzgJ03/bywCue8NBfdOwfd6EwgEgcRKmBwCX61V7UHrFzYponITpzfMuC6MrGqXDXTVY8r6zQQkO4+G0hEnLyaJed+LHQyNIYeP46ZJhm4CEyO4PZlz/76SIQ+/vydAokvQAfGRWXCVOxPQ1mdekIqINhXVAosr0h0LOnTAroDy/r61Vcc4+03emwC95x9b4JgccG/LQwvVNgrRAaM9zyPnOsZsQ4oEQWUHChEsSfaa/6eTAUuIdVzv7ADQShRhTRrM+XtxdlpY/B4CzneNqZ1Ut3gmjpglAKghLuefb5o+Jf0w/2RiiKC60fqHdGzFw0SBowerG2e1jnVOyLsOplekLMoJ0u/C+nGeOzU3bQykWkxuRacH0yxeLv1wMcSy3VlW5oKL0G8oyfXl14MzxtIp2qlFMOmMI7SCVmWX6g77jKT5+DIjpUJTSLKU0kect029XhPJHjhUf9gbyBAnQxB4OAMhPW626HA/Ed8cQdjlg4b2q0iN1m9ROpZUub/PIZ4O75Bq7JBkw5wb5hZ2f5D4JCQUBQE9Xbe72sXV9cVgVA0iaSAEj9xeBvQEpf/k4d28Mu+Sen6AJQmIdOAekAwL5bhyX8lkhRbGhUwINiT1gdpBEQPNorqd4dNgmxX6hk3sKergj5JGjHcjvHSwFEgA2PKybWs8iWugNWPmFu0c7kGQymu2JAcCTwD00VV4le0fhmMoe1x9aNybjVQDwFHxkvgSoGvG2N1gSPqaB3nx/9l8kCAgBYMZmBiWAZZlU9XAvnFjjrD6nc6y8XJF7v1Sld0Uah0PJi+N55B8v05ASwPMAQyRhA0AP6mMVpb16VFdU5eOnikgms4dRhcoPv9MZdHyO60PJUhmvGw9Po4jE12cHi8qOdr/nmB7TYCHL5PNkjCFh7wGXgPljEb4xzCA9YAFyDkCv2a0mtR0F3I2Pk2JPy+zx1UrSWJ4BgEfgAYjxIoAM0+P7bMd2FHgAzQdIgApA4xJIunRIJghI3mgdoZM1aXTyIXOSS6T+uZi7pJNKNQ8gd5SP3j9hD0BibnlUeCdiazAMneaL7AAB6Rsbev4uep+6jBCITeXhSE/30ZGelf9QJMa2CACtFcVdPYM2CZckN+8cdfdDkivc5S5z+xuc5ha1m6LLGIDDtLWVAy5TtJRLbnaOMnKvRmQwCPMZ7jB3UzkVzgHo4czedg58hR5O80+AlnvU3R/zwbAqwzpSxspLtXjGZNqefTKDePM94GvqW9QxKrzTT4xND/qPCAVgHRfRBBpPAp+EjI8R3TV+EVBoVusoB1gHPMgnHsA8gD2cuQtIJwbOQSSYkkcK508oXUAblDH5FhHPmJbDZ00MhU8BHylKg5OeGV+Y/hMxVHeTzymTcgwx76FJAF88pi2a+iBF/5M1EAMK8CH9J7VQABLM2rzM14CHUHr5E5TnKQcLywByXARy5NhDiAyQH3zEiOc2rgBebhpHLuBUfLT1cELquKZeIE+dhpoxrngMPzONqI3jWc5FiOGeFiCEdN4fYwoAlZpDmJoWMwIqO1J/8pHih/lKcxAg/cU5M9KwjGmoxOiYuCb1PupCid8ZsiHbWiEF5OojntFU23D6OTOFZProu7/fB/AluQ1lGdVwlXzwAWDZIjQ0F5wDYhl+/zFsx+cA+HyH9gAgS+xx5NQC8MEpQ7O5UB2je6USYf0nAO1ujtx8ZOFlBRtkjwpAwLwFAM4az7X1xu+OzMuMqNDoixHJQ/Z2SYdpO3HIhKlcfAiUmAewDmcfAPSMlYcjw1j/24zxyK2Bt63f8h2nIULMGHfmv1neeDxFOqxEalznHzz9g4X9ZLWP9Y1XgEW4Ri7niuA2HJ2YqaHR6St/ONJLs4llueAbQgNUmO7zmy/iI8/p+N8VAikOdH+MgO9UcvkJ0PAPlgtN3Dtm2w2eaF3t5ynTNAeAL8/JjzwEEQPTAFJct5n3FLYZ8Qj+fNNz324FPi9cErEQy482gBBwAOwhngcAfvmzaqTAXHf3bXf5a8pEX/2WmcuQD6iyHtYzGkqKJ9XxOg4fxOq3LgNIDdU7q5aXnGWctgIJZWjIDzkKJRMUz/wozFPqQfzqaMVN+uumjDwNYBkOABx+/HBShavK9KfCd8NDU2IbSFwLWH7EM+h3zIfFAKbW5fpon0idXH2fWNRhSbyZpk1YfbRIqsbAnrnwYagB5NmR58Tb8I43PgkkULEH+Jb75b9UMOp6DtBAE2hofMvy5A5YoCNCAI7/wPd92EcmoACENtKQvxLjtLLpWyqYUqATH9GuSs+EPJ9znjyths2X3I6tfncAxBAKSAzuJvUDvhYlB0CGv4sPO8C67UAq8p+fKHtIY2C9lmVqnki1V8Leaf9UeFqFaAwKmXxKiSdLwma2KhAe0VKcx8C5ddm4LRadJeAsLlfZQs4swyrBGeAAmD7OQNMeAHdPXNkJH8FNwHQLxGXsObWNN1v/B6YZ1rPSO6Ge+CIAvIIfaq2exjePOj3iEz03LAcXbf1v6Yh8/DsA4Fz4VrzkhFIhwJcHuSIJigxVArTJOAAQcOewN5ykqli3dgqh23mQBls59WXGrYCKvEJeZyoxs/4RAEBXLAKpkaTwCKdObHpgI5XJ9PqDELKaEvEBiam9j9qIcRHIkDZDQB2RCOuA5IV74qJz79RzVoiqEbh45Y0A0FM20TpFwM8x8aReBGBlxXsvVhYe1teFmjMYV2VOJ7DIBADucBYicfTaYT4Wn6kdzBWbTNu73GSUnYmItjY+A8i8RZIKaDSBgPxdOPOOXtsdSyPtFrDnmDs5bzDKzgBo5Q6ZMpWAs1eWQIAEeAiNdcBrcBwv3S604JmvKKfnlEZlb6+fAn/Wmt/mIZACM2iGvQk+WDcoyf/5GHFYxF7zr3gAmqbf5mJolVAeYw9owFM1VrI8Z6tPvnclmFt/0Poi/2aun3dj3jIkmhUpBElEKc5s7A/RqJh5ziqT03mLuatdzfwM0MngkHmQShiEJgDAaRDAgmpif3xMGBf5DyqZwXlGKOO1sBgulkYbIAYwi+eAEPgxIMkndeUDfEYBwhM5MK8G2vTE9josv5l0RaTQJneZZGJlfxx/RiQZt0hucoHMWi/0qKeANIdD0sa/0+uWb+J5bAOnsfz8BL3kA8D5PQAt9RQwlQ1aGR8gSZoSdYZ2BofUl3FZrOz36mnELZIkSObtNCKVu1s9ZzGr/sqlMrGlAfHvcX3UVyy56002eQw46XQMzGPPaN0SqW2STD0AIkOLQETGCG4EO2Nls02SiUvyBltk5lwjp4BUF+dcBYDptJ8AjAF/slb6UgvATBfAWXwcmOq9OMQZbypsuzn6vEk/IJ6QTW/dFiFchEBLfQgQN2LbVljANMYoNjTKMIMMmDYZt/FA9WuASoBm7Pn9Qm6hL6UZ0Z0r4ocpU+j/+uTsr9jwMb8NNJLpyrDSz3rFrPoj1lkqyoEEhNpzJvs2Z+9i9gCQ286zBknnAezZ8RGJB5RFaBMmbgyBsGY8Z8CTEK/AYQiR4+J1VTFxmbVHPvpVX2AO6yNud02McM5HvA5cRkstiLCoIs7kVtdtkWQGtFM4ZA6XzDBFHo6Ro8J+5IJUEQmAfA14upVywcrRg9axKRL2B0ADU4gnBl3iE3Ai4SEGNODDB+AtILBMORWWGxk0IBQVnBpfe4hhn1J4Gh21Dgimd4u2ar/Iz1+1oUpqY5ZlQIkRXhry9mZMamYPAFo9ZV/gFcLzXuMphoXLmALzk+NNBTRWIRJjG68iXvYA+M/37ZGOSGowgSCp4ZDp2+nsj/fBNkg6ZGZ0kGpn7j3g/IV9ZoHVdcIrEGoaTzUwrSf5imrGGJyGmcCJbrt5NZiTAPBhAJgviBBTQU5waQ/gNzJgzoejTOvKfvhKE5BhkR0jaRLCeSsxWj9Fm/wOYmvM3XPu6EMyd62TRdJJPgGcvbTDPGJu5iIdH4WLA6CJbeDfcjhGiPupv2lxHXAObEVcKLzywVfLyfHc6vktkoztOY261vjpcXK0kXMjIuOAtlmU6fQMMNvdYR4xhbxrAnEAc36xkKR3RILWUTPzwLnrysgNGmf294DUiEk6Zw1nRDKH/UeCYJ85WuPO2eUGt0iqU4XbGsQARHeNecQ4tYtj1kirDEimaNXArPif0Y4+pFE3honcFDMQnQ3mEW+k0kTa76hSYRp7zUklORFOi9cAOOjaULjbxFbfFkvz1jfaZIWy9V4gR28sz885eIcC8AJWLZ9/v0Bsx81umnqxFaUz/a0x4WjPaEUvNUQ8EwII8wNrdb4kMVdqMmkTMh+ubqCZN8H52LrpafhNzwytKkcBIt57HtPwYxv6njXOQ24IHlkiCWYYIlJVh0T73Ce5ybTNDEAKl7x1Z4U6YiuVIu6hEKWZkkhUjUl103nT7tbCdAo3jvBJAPB/1WJd+ucMpm4aAwLrlixO0iJonsKfA2gqZw8IVCYLjAvQg8SUQd5bqgiNsSfUBGfkQRG/LQYaJmZB4zMGkQqY14CEMA3Vp8JKrmsOPXVxQnLgFLyGB8jY1la3VQ4kIYDt3IcMMccQgJg3RqaoWy6emdDNJ+JHnUcrk5z5PACoEDi/CkjgDNYBdBMAU+tlyqGjJhFpbkq81h+Bz3seAO8qgLeHIRCRyiH1W0mSVyyzmOKZGMNLK9zV0Z+RXDEtL2lyziH/rBWRKZhKBVzsAadMxP6hfhIxx1giPYo3CP9tqrRBYqahgZgAph1rN9GOh4K0dHTZ1UY1Ma+jne4GuULdIrmbnxXkyhmjEm2MsLliT+Cul9upxuX9AIiLwm+c8mB7dQDZea7wLeeLc6I8QoHQoie1Xja73OrxN8mAbJHcZevGIc+ftXeUAPRUX+l8qKrZxKVxpbj4IakeBK3yMjMJYTV6zEVccuJMWM2gfs+4fr1zDvxvVwiNC6Tx8k2NA12kgUlmblpyjbbKyHhLSTTOt4mCLa6kJF8gmTNxu/ri2ws+bJOpoxENIdR8ZhrUwOyR+9xa6+qdKxamZtbKdPY9lhRy28ja8hBCjTr5ZJ10yhTN8M2POuJmWBoGNzWFAgA9Tx4Aqcbc9jBC5wHAqXUYWwqx84tO+PffXWQ040oxI58HAiaCGsMITQEgWqjF5y4182hNZxF5zdarsmfT95k3FrZYlLFg0bA3DQBxUEv3B0KROv6j4mYRrZgekO8teekeEgJzJeY+pFCGoPBrJV78GlrqCYl3JNa4hpWBIAFpFcWZsuY5s1xtta9Xy2d80XzolHpT2i8FNF6r7gtaBhREVFx+artPpOQtYyT+j/GzjggbT9sEt2n7yfowt2MAuLjej3z6c+liTNLSXZSfCT193ta3litXcq0nH5XNhRB/xwpPDqB9eKVWjsgs6i7t5z/OOySpA7L36/H+iJ5UpB2laZeqqXV4fQxMvkC3px265gPI7gs1MNOAVh1aDRcDrW46DqYOuowWDMyEZPeFcBBmm2TuZkbqY1H+rdXLojEweYfRxib3SfI6yd4ttTUCk8oqkkKmMsDt9ds2h2Hmbe50eKjbRu/01tRORSfb52JboSpTUwDE+B0GzmfSaUD++XZRNX18SCuQZF4otqxVKEJX84Vx56R28g677U1jP3pfvL4zcPfWQBRQ5IsTuJrXx8Jkxu9gxixim2Rv4/G1AZiuxbp9FgqEOjpKxsNkdIN3mAdcIplviDWS3BncLfnmQnafKj0cMVKOHUgh+pjt+/vPeTVzkVPFCiULRygA0xMqP094BkIKAO2h1u/cwrCqpYATArGc0FT9kHXSHmtYr65ml0LYDQcWTs5pqEltho7ttfB7PiDC2PZfSFUpP83ZPWzFnNM0YMa0xrmhnzN5hLPYBsJGuY3r4sAOz55fHX1yJvgNA3NsJkQskl/yzOBdDJnOlR5Ogrk6wmuT+yr3Gb0KaLOu0i/nNS3DfcWy6q2i8sWN0n0c4E8FBEZvdnOSTJlrdyWPyICpLM8EAI5CNxzaQdKoMR9dBbxmFl9tvbm/RSGPLS+5FQTG82Z/lj/odow8q6a8+w0FLN+DqZwY74EhUll1XLk8AwT+4JxtDTMxbJHozP8+AGWztPkpmEEvDO591XCBYHOoqftSTTYoBYjP/EOALSsfogcIw5VyqLwaQ2XNvlVXPnBhtDeiBQCM02r1e49IgVyV+y5Usa7QB9yX3r5YbYxojzCTb1AcVIu1sll2tAzgc9n84/zd+eoAszesRbpuXUtC7iEBMmBZVucPlfnR6cdFH62rb2/PjKYfVAYoF+ig2CMhbSebGvKPml9QQGNYMy0ndRPj20AcIhmi0cHooLnjj46z916oW6fW8DQ8IC4LVAa5Wc1Go/nRPUd7M6Ndz/eADFDAc8gH9l3U9bg3R7XdYlVYU7tjFKnnD+p5Q4ZY1m8LulBzdZq0fjHR9H1oxqAPNpBV911QjVlQ0B74191zALoSm0LCaIeeEE3gUYEL0P3dFJ6RTF3fGTHYKPJwDOCqIDMKIV42tPeQpLkG8tAMvcSlZDKsTdUMTGN2z5iJBatpY8NF8/BmQiiVPYHrNgnsW3WxPqFKWqi5iwAW2fOrnTiuAtaRAx0PQGO1Kpn36jtiKoTufSADEECsVrKDBBB3ZLeB28BzPy271fweazuyq1r55jn7+geHTLI/l0ngJuibdpCqAvcn7qP4xvvjKqCBpITay3F1WYeQuDepJ9Xc+umC2b46faliugZGUCIfAFvI75YxFyZNbVlFIZ6dCdRojtUUzB5X2BbaDzNbIBMVvRzWLKotfnelumhBFbPQlv+WG8jyCxDNo3qwewPT82oILa+H5ecSKo2RKXXP1rXlEZ2krFuFERbrdM1vlcAiOjnu1uyzGsTuufVJSxLPZX066hA+Piuwao84vq99Kq9+0PDeiMZBde0tw3vPA9dG91kNKWDx7ADzq8HcemU0Ukj1FzmbByxQ2RzfOjkfVgX+yUGDKapc8hqe03OpPju4T0Ccq6mXDBitdw7vTUoKIuUCe0R4Nw/tyz1LXHeUBRrbVSXirg7SPSzn2WSuhFxQ6F7qF4UzALImj+gcVHxx4DuFEKLZ56+sfLfAa/gsVn+/a8/lA78LAJgdYoEMWBlgLicF0PWLPdx+Xvwng2qgAe9m2r9rWO6nGs4cLw8MurRIU3bNVX+nK1LgoNEUAH+pGAQOC0nRo2I0vY1KsGbgPquA7eeqso7GKXgAP+3fhWfXk+jCvI2YOHmAkTHxp5eB9gZg5hdAKiz+HhQU9mIsQJ4vdqrr+rZHsVIjXdsAznqlhMk5c5dc/0+8tJBKo1vXabEzao7mwpEeVfEyALNlJQYSiJdxdboJhHIGuACJpyFKCcpqNMr0+iie3w0APww0kAAQWhOr8KFFgvfHkHCVBFXRie6PqHlnb/T0TVWUxQzn8gAecjxsUC/rduUNPq/U5ahhpS4DQ6LZbOXsFbO5xu0qTERaN6YzF464USIptiMd4ADA1LT4FBqqMidYNhHXd2A3V0c57CNmDqTQjCKdXUcYu2FlS/Wy5aNkZDVjVurlgee8VbWKoWtS+R/xpLLvl4APG8sv1o/Oi2dHHYD3FNrKjXEO4HM3HwX8xiIArEsAXq9woONa72HeHzEuLgBcBMK8GF1c1sVIpfG9c4PScUtka9yyhjK4n9MGfQLrEIuyAdhYxi9C1ptqyBy9hlQX/pA/sjA+MwIvBHIVP+mrDLcBHEACXkmaXn03nTNa9xGJmbqbKmTeD4FpkQJYhQQQhhi75j1hve27aLX7dRjOn1kGYiyg2JnDses0LW18GQ9L7XstGcqYZD3HVXQVDgCQaWbL8gCcwYScyxt5l7yjg+F8XYfkbvmqlCme5vt4gzR7JJrbfX9whGlu5vU9+W5fyfdmbB7OAeKescVHT4PV1OYa/Ua1m/MAo1AASvt75mDGfOg6L6sJ9TEc8e0D/ECG01o9+Rgk2i2bFRz/ZTIEmln9Im1ROnziqvWLKOKkc8xltBQQozMOT5dhwrliA0ToGZVR7uVgJxkVQ49eJ6tf1vZD5U+zgEQT0Hjsg6tAVM0Fna1TSrr0IIco2RrwfzPgHtTcfAOOgixdzudEzXCUPnt71LCs22+tkKWKaaAB5Gg9fxuz1T2QjZpRXd/u8Rnkz3cCgLNayuyyucpXASfFfNOT5RVW4Q6bjhz5526mlsP6d3evAsBL5a/MTgZ8FsCCeJaVnEBSW3Kec9Wo6fiYAuAXq8P3MuCNAj2Fjnj6ua1uKku75g0nFACEWfyvf8zesYLqqUUAsx2b0DGedORPYxHd6f/8NdUYwFfSHnI/91s9fP4HRhj+SwCc+HETfK4+3WkBIeZ6V9h5z8Otf46ydT4qulkqffKkdq/M8RqH9JItgsYkmbWZuGQKJgHT6cvPpHJgI7RTY92dcFQvid8wv/IArM4j6TY6P0D8Sgx84+ef6POSqB07gL548LFlb0SO3ucDgNcJgVgB6Hkh+EkA+PqKQlEXd2vGpzdJ0tlcaeuRb/G6YatWQYqIMSBMVS7FGTFXpqnqpmNuA8D0ZlzTEvidyrzxumdYfgr4qgKAN7hKohoj4R+9SQjxhrmKOaKnR3ThtwNuc9AizuzhL4CFTyL7iSfRsg0RUVmKLGtUtgdggYGOBm9+zXZ9KPNiFQvucolpxBhbwJZNPJHm2z4MbwXFW0k6egRmZhsKYgPzWhJwlwFf4E4q7njyDYZNXOB6HJD/sQG0qV6rqOSawVj3NvBTyvbyZvBEjJQhP399ZhrJMjLboMsEUVqSHw+UzeKa5pxVnl/RbdI19V+45CZ5RzPTcDPBOdkwRJvv+NHH3lr0W0B/oxLRj373xgXxh8BXTd9tEQBp7Gg0V4k55BFJJTTaeZtkQZ+kZUokJJlH+RA+ucMXqF3avQHcJG/0eC1DW+HsumGHn331trtxJemIZlFKbHcm7sH1ln/OF3+sbHP0ojnuixkTYCuBIakGi2GcQn+0WZwuG9YtJDMm1C410L6jWx3y1m4ebZEK3zRn2fa1NrC5FPeK6Bw4M3kEyX2t3RQvKQRMGvcggXi6p7LNMMRuaPCZC67kkelqKZ6YWelv9WqUQTuLclcH5BZ5SF7hHWq4CaatLb57oRM6Sgzsl5kLxcRdsK9/QDovVTXFXRwg97Bvd8U/rL0UCwQo4WbFtqhsatKCf+dX3+y/7j3WX1q1em4buqwfdc520+1uBAgZFRwK8Rv3yqizFursv7vu/FpFpb+IZbAJHSMLSMUdHZA5BvYudbbKIZHd2u0UuXbzgAxIrrQdHWkAlyDmJFbRfQHebozeKSYQouiwxwOPAj3x2PjBDOcvXwptBERCK13s7+tcYRKQ17a4ULQGFw1SZizJ4Rr3x+zRUAgM774662RMjX+fYHeTDplfDkgmcIxGKedNlAZ4bQCmEal32wp9YMYBghmnywRAG06M/TRrWY2YFbrYnvQadYs3smiJWyMn/CN7/8h0AkSZs8sYQHvaWZTAR1IAO3tAs5WiI5oAaXnuYA7vmYoVPrc8jMt3Gjv/ZeB1Uc22pYtIwMyxzQyJIFXLtnMEJFWrQ+ZcCvIojX6gFqEZGSOgjnKxrwHAzZGCmWvbBRExLtnEIXntzi2SjIMuiYdrYaamUUSTYsso6FykEo3c5N5vt9TmCtBrAoDzegjgzavGAfk6sPinG2rMtmfnIjSgdF4GFrR9cBrM29QFI2mXvGY7Rq5tkPnlJ6eeGuNV3GJGXt/8PAA4uZOCmR1ravEG837jYkJeM+Ng3ApIBiuxOxZmh0w250qYRZCpmAfVBWl525pi8oAkVzYOayT0Rh9mPAcAbu/Ki5KMe6bK9lvx7RzYFEII4cP58GDdJfQbp0fxebPQMrFn2U8+7UvgAnzg5jn8SO8pYNOH0wQ2m/ipkd3aTrg4Jpt/u0+/3H41jEsKZrxDpphlcNUD0MqDtZGrdofbeFqm+f5KxOwJc/fDLJUk9QG6Z/AFnge9Z24/fv1PXwTQ+dYnOmLYKZ3KugORmVmeEQNIGmWpQUkAIgq3L+KHdxPcdiN5a2sRrWsKt7+7RQJdoSpfs9p0f7zqVObGtYWCL/3CzMRmoqO1QM1r1M6Wam0lAOCq4b70UhyTe30xisxozKmAOpkDgPZ+6pmZEdkidcSknbTX0Lhw9plOgnEwq09s2uT1dEBamFv3rKpUbfKQdL7oBOpCdBkQ3Y6qdO6O25cE22U5G5DJDAAEO39dTF+0STJzkwjn6cP9BaDz20NDXW8l2et/TP74F55axOxURDKfjUizYDFa27Iwc4ck41vTmaPh7u/vtD8N+dhiNNqb/WfR9QpqT1n4Z0mmswDAjS1lP1hFpHbTQHRjd3c3gbu05I35zuA6srVJ3nsXAHBpJ7YwkxaZtuILbtbaMga+Nfszi61jwswDkgfvASC4spYU/XkOuXC7JXavbHTjVhA8003w2C9Vl/yufdyklSKXQxGYY0ZjuhcAOAxKmBqRdpPAyYKttL20tHQ+7+4q28mYtgmIW0ftcOz9YwCujpaK75cR8fK9ZtJ7z+/g9Deph3/0R282XPWBt5ks6eJmCMhzAF4XszVpnVPGyeAf2DRWeU7fid2WyFtrcXAXIr2zUMZJY3m/aGW0nYL6b8dAO2cQSyGEEEImvfe/NKfgvemp+a808umZn1jbOP8zpv7F2pbFJM/9QUfyL31gtlfpsGLcSi54m7fiKEEURZd393de/flfHiNJAbskt2wPYrFJ7GwK/IuOjpJGv/75F//943/rL8/O/WgUJojuTej/2zQjfJ7tbHrA/vqnrgKfkLpyTo32gnbT4ItT0Vps9ku6L81FJIc9sCKUKAKHIpT4rZfh/OlWxkSi+2xCIYQEAp2nePB9/ptCsbu18l0vJRvJMgD15aFv5LaxtwyrA9yA+FY0/um2gFecc5+ZOzuTXbumuIULz/b2NzzAUS6ptwLuWnnvVNBn2j6L0cIeeeen47O/t9Rlioriihby9u12kARBoK3DeMX4g1vcoUPqVo5vWqt01FqY5vKdX8+6vxnsMi1zyIdUwULWSqM1Ga3Rt721MZlGa2zx0/klVzvxlQHVEQzgM/sK9z/MO5Vz7jNtzTx2Jw6Sdns/Ef2tCTfYyVr6nGCK4ajTHaTVT7Y/9ce8ZWDum0BA44Kbta7F0a0uKsP9LnORiCtjTUdpoPX7kp//Dr5g+lRTu7pXiUsN7wc/EL9rv2ybl1l3BvLC2bO13ZVzAylY8T+WHpiFndzbITWXyLQ1l11Lg7Ws4jYtqCBLoiPsUTEeobyAMHffIHt5QGa45NxJgt3qtETiBmfc8XYzKGfsSSYZTMbJTBP0NkleV5GTXVnKnYGQO56gNJMWyTVqss19ZnBiwElBzYjsLpHKSVsib21l1Wgun2g/Gi7JJWpyhXeYFyu4mYM93ot4GS2Npy+1utcH3uZMAKnokBpBHjHgN0hV7CHvEQLfULx3KRVq6vk/cAYXmF0enxfYpPnrOsAQp4CocOkdksEaM2EcpywZtMBjic6sTf0YmbfcLMrJ/xWU4b8mV7jWNhyRO0qLoWhl7I7iF8g0I8k7WdRl9+4SafZSSg3EeNh+n6Tz7Ke+e6ixZHpcs/udrEhAe8ABps68CMSngHaCDjWZFhM8Sds4H7tHEikPyCzKSbKbRnfIbYcas0CU4hazNpzcLXwHI+q/XSVu7XOtCIzIbspbZAzmbgYwRZv7e32cpSZhp4PgCCLtmqNmJNlLeI2MESRBCsEUdr62XMXTMqHp2qCDNbpmzgRH5pwJ29xJAMEOHKYw+YxSgKdtz3MfoXmduN+iWWPdIclsUwfcTQGHd+IWU5SZKZMNCGDmSirZNFF/c24Wxim7nke9LANavJEETGFpUMTtTALzymBI8w4ODRRvuUOS2Zdy9vQloGV2FCCZEX1VkbWYucYDWhux56Oh+6FpDM9IdrkE/CSFnaZNXK4lEbV9uzB5z/3JRLKu17XCucl4JxZbFqbNxOioa18XBx0OlD50rU421rLdh5nDvaFLmDnOX0D7jsVA5r7Qx9k4Itko22RyO4m5/61f1ihg2smgyJgCbUODjUlEstAMz9xR1tFLh2Am54oEWBxUVrlUVyMNJRh04eckwTUekrzzV0MwyXWYhEfaGoqrsxr70WZ/HiCJzP872eVhmOW1RF/8xhEpNabRTNhct55TZ/cCosFZoX53kTIL7zA0NVZ5lgCE6C3jHlD2kLrT/T0SI4doDSE0rmckbpJokWsWr7k+i6D+7sUIWnc8ke6QXKF2mcEhN+xL9bNrCOrvXjQUnio9+uZQVpXnAYQd2cRq9CrgFzXq1+Kxd7ehd3/TwTCRuiR3mDmka1INVrcFf0+NO2fx7RBPjCPSHwFYx9QsuufKry4BgOTl8eckOGjo4jFa5LqNie05lzbj9rhzmrFznB7oMxv9prV/JvTggu30ryac09qL4BiemDaZ4zxi6tzKk/YYXipV0doQd/WfSgGkRTJl7FLhVnaxNR5mMuQ5LIzUpAZgdjQEAWd/Esys1Vdlkz0xtkhu5sAlQPBcayyN4O4BdvONrWtN/M4+iSh5uZ3abUnjWpNfVwDEk2M8seGuktdn1Qzmz/DwN8bTvTBsW/VE0sN3j82Ecsx/7Y7Hp3XnuvWe2OEwzBtXSIdMo6mJMONoQC8PEGllNEA04e6Fn5kI01x+qc5d1iN0t3jS7UNnPN0Bd3tAjVSJVP+l3jOAwF+riS3pLwGVqQPnWF9ucHEnnAjzfDigly+P3y5a6Sf5up4I01kdMHSBOsY5s8eWJ/Bn4b30VdW4l1U9tFv6YTKtx/cvfPM9fe8ygODzRZp7943DzVd546/e8giTHH/z/L99/je7iBokJBTtIwAAAABJRU5ErkJggg==',
    };
  }
})();
