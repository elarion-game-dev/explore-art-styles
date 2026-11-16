// 16-bit / SNES: a JRPG menu. A real Mode 7 plane (per-scanline affine, palette cycling, fog by colour math), a hand cursor that goes where you go,
// windows you can recolour in 5-bit RGB, type-on dialogue and a hardware-style mosaic when pictures arrive.
(() => {
  const root = document.documentElement;
  const isCalm = () => root.dataset.calm === '1';
  const $ = (q, el = document) => el.querySelector(q);
  const $$ = (q, el = document) => [...el.querySelectorAll(q)];
  const read = (k) => { try { return localStorage.getItem(k); } catch { return null; } };
  const write = (k, v) => { try { localStorage.setItem(k, v); } catch { /* private window */ } };
  const make = (tag, cls, html) => { const e = document.createElement(tag); if (cls) e.className = cls; if (html !== undefined) e.innerHTML = html; return e; };

  // ---- Window colour: three 5-bit values, stepped like an HDMA gradient, as in Final Fantasy VI's Config screen ----
  const DEF = [1, 2, 15]; const MAXV = [13, 13, 16];
  let rgb = null;
  try { rgb = JSON.parse(read('eas-snes-window')); } catch { /* use default */ }
  if (!Array.isArray(rgb) || rgb.length !== 3) rgb = [...DEF];
  function paintWindows() {
    const N = 14; const stops = [];
    for (let i = 0; i < N; i++) {
      const k = 1 - (i / (N - 1)) * 0.72;
      stops.push(`rgb(${rgb.map((v) => Math.round(v * k) * 8).join(',')}) ${((i / N) * 100).toFixed(1)}% ${(((i + 1) / N) * 100).toFixed(1)}%`);
    }
    root.style.setProperty('--win-bg', `linear-gradient(${stops.join(',')})`);
  }
  paintWindows();

  // ---- The command window ------------------------------------------------------------------------------------
  const toc = $('.toc');
  const list = $('ul', toc);
  const links = $$('a', toc);
  links.forEach((a) => { a.textContent = a.textContent.split(':')[0]; });
  const saveBtn = $('.atlas [data-save]');
  const liCfg = make('li', 'menu-sep', '<button type="button" class="menu-b" data-cfg aria-expanded="false">Config</button>');
  const liSave = make('li', '', '<button type="button" class="menu-b" data-sv>Save</button>');
  list.append(liCfg, liSave);
  const stats = make('div', 'stats', '<p><span>Time</span><b data-time>00:00</b></p><p><span>Steps</span><b data-steps>0</b></p><p><span>Style</span><b>' + ($('.atlas-here')?.textContent.trim().replace(/\s+/g, ' ') || '') + '</b></p>');
  toc.append(stats);
  const cfg = make('div', 'cfg', `<p class="cfg-h">Window colour</p>${['R', 'G', 'B'].map((n, i) => `<label><span>${n}</span><input type="range" min="0" max="${MAXV[i]}" step="1" data-c="${i}" aria-label="${['Red', 'Green', 'Blue'][i]}"><output></output></label>`).join('')}<button type="button" class="btn" data-reset>Default</button>`);
  cfg.hidden = true;
  toc.append(cfg);
  const paintCfg = () => $$('input', cfg).forEach((inp) => { const i = Number(inp.dataset.c); inp.value = rgb[i]; inp.nextElementSibling.textContent = String(rgb[i]).padStart(2, '0'); });
  paintCfg();
  $$('input', cfg).forEach((inp) => inp.addEventListener('input', () => { rgb[Number(inp.dataset.c)] = Number(inp.value); paintCfg(); paintWindows(); write('eas-snes-window', JSON.stringify(rgb)); }));
  $('[data-reset]', cfg).addEventListener('click', () => { rgb = [...DEF]; paintCfg(); paintWindows(); write('eas-snes-window', JSON.stringify(rgb)); });
  $('[data-cfg]', toc).addEventListener('click', (e) => { cfg.hidden = !cfg.hidden; e.currentTarget.setAttribute('aria-expanded', String(!cfg.hidden)); place(); });
  const svB = $('[data-sv]', toc);
  const paintSave = () => { svB.textContent = saveBtn?.getAttribute('aria-pressed') === 'true' ? 'Saved' : 'Save'; };
  paintSave();
  svB.addEventListener('click', () => { saveBtn?.click(); paintSave(); });
  saveBtn?.addEventListener('click', () => setTimeout(paintSave, 0));
  // Jumps are instant, like choosing a menu entry
  links.forEach((a) => a.addEventListener('click', (e) => {
    const t = $(a.getAttribute('href'));
    if (!t) return;
    e.preventDefault();
    t.scrollIntoView({ behavior: 'instant', block: 'start' });
    history.replaceState(null, '', a.getAttribute('href'));
    spy();
  }));

  // ---- The hand ------------------------------------------------------------------------------------------------
  const hand = make('div', 'hand');
  hand.setAttribute('aria-hidden', 'true');
  document.body.append(hand);
  let current = links[0]; let hover = null; let leaving;
  const secs = links.map((a) => $(a.getAttribute('href')));
  function place() {
    const el = hover || current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const seen = r.bottom > 40 && r.top < innerHeight;
    hand.classList.toggle('off', !seen);
    if (!seen) return;
    const y = r.top + Math.min(r.height, 30) / 2 - 10;
    hand.style.transform = `translate(${Math.max(1, Math.round(r.left - 30))}px, ${Math.round(y)}px)`;
  }
  function spy() {
    let i = -1;
    secs.forEach((s, n) => { if (s && s.getBoundingClientRect().top < innerHeight * 0.4) i = n; });
    current = links[Math.max(0, i)];
    links.forEach((a) => { if (a === current) a.setAttribute('aria-current', 'true'); else a.removeAttribute('aria-current'); });
    place();
  }
  document.addEventListener('pointerover', (e) => {
    if (e.pointerType !== 'mouse') return;
    const t = e.target.closest('a, button, input, .core-item, .step, .swatch');
    if (!t) return;
    clearTimeout(leaving); hover = t; place();
  });
  document.addEventListener('pointerout', (e) => {
    if (e.pointerType !== 'mouse') return;
    clearTimeout(leaving); leaving = setTimeout(() => { hover = null; place(); }, 260);
  });
  document.addEventListener('focusin', (e) => { if (e.target.matches('a, button, input')) { hover = e.target; place(); } });
  document.addEventListener('focusout', () => { hover = null; place(); });

  // ---- Time and steps. One step is one 16 pixel tile of scrolling. ------------------------------------------------
  const t0 = Date.now(); let steps = 0; let lastY = scrollY;
  const timeEl = $('[data-time]', stats); const stepEl = $('[data-steps]', stats);
  setInterval(() => {
    const s = Math.floor((Date.now() - t0) / 1000);
    timeEl.textContent = `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;
  }, 1000);

  // ---- Background layers scroll sideways at their own speeds as you read down -----------------------------------------
  const far = $('.decor .bg-far'); const near = $('.decor .bg-near');
  let queued = false;
  function onScroll() {
    steps += Math.abs(scrollY - lastY) / 16; lastY = scrollY;
    stepEl.textContent = String(Math.floor(steps));
    if (queued) return;
    queued = true;
    requestAnimationFrame(() => {
      queued = false;
      if (far) far.style.transform = `translate3d(${-(scrollY * 0.09) % 640}px,0,0)`;
      if (near) near.style.transform = `translate3d(${-(scrollY * 0.24) % 960}px,0,0)`;
      spy();
    });
  }
  addEventListener('scroll', onScroll, { passive: true });
  addEventListener('resize', spy);
  spy();

  // ---- Party: the hero images, each with a level and a charging time gauge --------------------------------------------
  $$('.hero-gallery .shot').forEach((s, i) => {
    const y = ($('.shot-meta', s)?.textContent.match(/\d{4}/) || [''])[0];
    $('figcaption', s)?.append(make('span', 'party', `<b>LV ${y}</b><i class="atb" style="--t:${5 + ((i * 7) % 5)}s"><u></u></i>`));
  });

  // ---- Status window header ----------------------------------------------------------------------------------------
  const specs = $('.specs');
  if (specs) $('h3', specs)?.after(make('div', 'st-head', '<span class="st-spr" aria-hidden="true"></span><div class="st-txt"><p><b>SNES</b> <span>LV 16</span></p><p><span class="k">HP</span> 32768/32768 <small>colours</small></p><p><span class="k">MP</span> 128/128 <small>sprites</small></p></div>'));

  // ---- Mosaic: the pictures arrive through the console's own transition ---------------------------------------------------
  function mosaic(link) {
    const img = $('img', link);
    if (!img || isCalm()) return;
    const go = () => {
      const w = link.clientWidth; const h = link.clientHeight;
      if (!w || !h) return;
      const c = make('canvas', 'mosaic'); c.width = w; c.height = h; link.append(c);
      const g = c.getContext('2d'); g.imageSmoothingEnabled = false;
      // Same framing as the picture underneath, cover or contain
      const iw = img.naturalWidth; const ih = img.naturalHeight;
      const fitK = getComputedStyle(img).objectFit === 'contain' ? Math.max(iw / w, ih / h) : Math.min(iw / w, ih / h);
      const sw = w * fitK; const sh = h * fitK; const sx = (iw - sw) / 2; const sy = (ih - sh) / 2;
      const off = document.createElement('canvas'); const og = off.getContext('2d');
      const sizes = [32, 24, 16, 12, 8, 6, 4, 2]; let i = 0;
      const tick = () => {
        if (i >= sizes.length) { c.remove(); return; }
        const s = sizes[i++];
        off.width = Math.ceil(w / s); off.height = Math.ceil(h / s);
        og.fillStyle = '#000'; og.fillRect(0, 0, off.width, off.height);
        og.drawImage(img, sx, sy, sw, sh, 0, 0, off.width, off.height);
        g.drawImage(off, 0, 0, off.width, off.height, 0, 0, off.width * s, off.height * s);
        setTimeout(tick, 60);
      };
      tick();
    };
    if (img.complete && img.naturalWidth) go(); else img.addEventListener('load', go, { once: true });
  }
  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver((es) => es.forEach((e) => { if (e.isIntersecting) { io.unobserve(e.target); mosaic(e.target); } }), { threshold: 0.3 });
    $$('.hero-gallery .shot-link, .ref-gallery .shot-link').forEach((a) => io.observe(a));
  }

  // ---- Type-on dialogue ----------------------------------------------------------------------------------------------
  function typeOn(box, ps, cps) {
    if (isCalm()) return;
    const parts = ps.map((p) => {
      const text = p.textContent;
      p.textContent = '';
      const on = make('span'); const off = make('span', 'ty-off');
      off.textContent = text;
      p.append(on, off);
      return { on, off, text, n: 0 };
    });
    box.classList.add('typing');
    let raf; let last = performance.now(); let carry = 0; let idx = 0;
    const finish = () => {
      cancelAnimationFrame(raf);
      parts.forEach((q) => { q.on.textContent = q.text; q.off.textContent = ''; });
      box.classList.remove('typing'); box.classList.add('typed');
      box.removeEventListener('click', finish);
    };
    box.addEventListener('click', finish);
    addEventListener('eas:calm', finish, { once: true });
    const step = (t) => {
      carry += ((t - last) / 1000) * cps; last = t;
      let n = Math.floor(carry); carry -= n;
      while (n > 0 && idx < parts.length) {
        const q = parts[idx]; const take = Math.min(n, q.text.length - q.n);
        q.n += take; n -= take;
        q.on.textContent = q.text.slice(0, q.n); q.off.textContent = q.text.slice(q.n);
        if (q.n >= q.text.length) idx++;
      }
      if (idx >= parts.length) { finish(); return; }
      raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
  }
  const tagline = $('.hero-tagline');
  if (tagline) { const p = make('span'); p.textContent = tagline.textContent; tagline.textContent = ''; tagline.append(p); typeOn(tagline, [p], 42); }
  const feel = $('.feel-body');
  if (feel && 'IntersectionObserver' in window && !isCalm()) {
    const paras = $$('p', feel);
    paras.forEach((p) => p.classList.add('ty-wait'));
    const io = new IntersectionObserver((es) => { if (es[0].isIntersecting) { io.disconnect(); paras.forEach((p) => p.classList.remove('ty-wait')); typeOn(feel, paras, 150); } }, { threshold: 0.2 });
    io.observe(feel);
    addEventListener('eas:calm', () => { paras.forEach((p) => p.classList.remove('ty-wait')); io.disconnect(); });
  }

  // ---- The title: 16-bit logo with a gradient per scanline, and a sheen that sweeps through it ----------------------------
  const title = $('.hero-title');
  const titleText = title.textContent.trim();
  title.setAttribute('aria-label', titleText);
  const RAMP = [[255, 255, 255], [240, 244, 255], [208, 224, 255], [168, 196, 255], [120, 160, 248], [80, 120, 232], [56, 88, 208], [248, 248, 200], [248, 216, 120], [240, 168, 72], [216, 112, 48], [176, 72, 40]];
  function drawLogo() {
    const g0 = document.createElement('canvas').getContext('2d');
    g0.font = '32px "DotGothic16"';
    const tw = Math.ceil(g0.measureText(titleText).width);
    const W = tw + 8; const H = 42;
    const m = document.createElement('canvas'); m.width = W; m.height = H;
    const mg = m.getContext('2d', { willReadFrequently: true });
    mg.font = '32px "DotGothic16"'; mg.fillStyle = '#000'; mg.textBaseline = 'top';
    mg.fillText(titleText, 4, 4);
    const a = mg.getImageData(0, 0, W, H).data;
    const raw = (x, y) => x >= 0 && y >= 0 && x < W && y < H && a[(y * W + x) * 4 + 3] > 100;
    const on = (x, y) => raw(x, y) || raw(x - 1, y) || raw(x, y - 1) || raw(x - 1, y - 1);
    let top = H; let bot = 0;
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) if (on(x, y)) { top = Math.min(top, y); bot = Math.max(bot, y); }
    const c = make('canvas', 'logo'); c.width = W; c.height = H;
    const g = c.getContext('2d'); const img = g.createImageData(W, H);
    const paint = (sweep) => {
      for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
        const i = (y * W + x) * 4; let col = null;
        if (on(x, y)) {
          const v = (y - top) / Math.max(1, bot - top);
          col = RAMP[Math.min(RAMP.length - 1, Math.floor(v * RAMP.length))];
          if (Math.abs(x + y - sweep) < 3) col = [255, 255, 255];
        } else if (on(x - 1, y) || on(x + 1, y) || on(x, y - 1) || on(x, y + 1) || on(x - 1, y - 1) || on(x + 1, y + 1) || on(x - 1, y + 1) || on(x + 1, y - 1)) col = [16, 16, 72];
        else if (on(x - 2, y - 2) || on(x - 1, y - 2) || on(x - 2, y - 1)) col = [8, 8, 40];
        if (col) { img.data[i] = col[0]; img.data[i + 1] = col[1]; img.data[i + 2] = col[2]; img.data[i + 3] = 255; } else img.data[i + 3] = 0;
      }
      g.putImageData(img, 0, 0);
    };
    paint(-99);
    title.textContent = '';
    title.append(c);
    let start = performance.now();
    const shine = (t) => {
      requestAnimationFrame(shine);
      if (isCalm() || document.hidden) return;
      const u = (t - start) / 1000;
      if (u > 7) start = t;
      if (u < 1.2) paint(Math.round((u / 1.2) * (W + H)));
      else if (u < 1.3) paint(-99);
    };
    requestAnimationFrame(shine);
  }
  if (document.fonts?.load) document.fonts.load('32px "DotGothic16"', titleText).then(drawLogo).catch(() => {});

  // ---- Mode 7 ---------------------------------------------------------------------------------------------------------
  const hero = $('.hero');
  const m7 = make('div', 'm7', '<canvas aria-label="An airship flying over a rotating 16-bit world map. Move the pointer to steer." role="img"></canvas>');
  hero.prepend(m7);
  const cv = $('canvas', m7); const ctx = cv.getContext('2d', { alpha: false });

  // World: a 512 x 512 plane built from 8 x 8 tiles on a 64 x 64 map, stored as palette indexes
  const TW = 512; const tex = new Uint8Array(TW * TW);
  const BASE = [[32, 80, 176], [40, 92, 192], [64, 116, 208], [64, 152, 208], [240, 224, 160], [216, 192, 128], [80, 176, 64], [112, 200, 88], [56, 144, 48], [24, 88, 48], [40, 120, 64], [72, 160, 80], [88, 72, 48], [128, 104, 72], [168, 144, 112], [232, 232, 240], [224, 192, 112], [200, 160, 80], [200, 48, 48], [240, 232, 208], [160, 144, 128], [184, 144, 96]];
  let seed = 1990;
  const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  const LAT = 16; const lat = Array.from({ length: LAT * LAT }, rnd); const lat2 = Array.from({ length: LAT * LAT }, rnd);
  const noise = (tab, x, y) => {
    const fx = x - Math.floor(x); const fy = y - Math.floor(y);
    const i = ((Math.floor(x) % LAT) + LAT) % LAT; const j = ((Math.floor(y) % LAT) + LAT) % LAT;
    const s = (t) => t * t * (3 - 2 * t);
    const a = tab[j * LAT + i]; const b = tab[j * LAT + ((i + 1) % LAT)]; const c = tab[((j + 1) % LAT) * LAT + i]; const d = tab[((j + 1) % LAT) * LAT + ((i + 1) % LAT)];
    return (a + (b - a) * s(fx)) * (1 - s(fy)) + (c + (d - c) * s(fx)) * s(fy);
  };
  const elev = (tx, ty) => noise(lat, tx / 8, ty / 8) * 0.68 + noise(lat, tx / 4 + 3, ty / 4 + 7) * 0.32;
  const moist = (tx, ty) => noise(lat2, tx / 8, ty / 8) * 0.7 + noise(lat2, tx / 4 + 5, ty / 4 + 1) * 0.3;
  const px = (x, y, c) => { tex[((y & 511) * TW) + (x & 511)] = c; };
  const TILE = {
    sea(x0, y0, tx, ty) { for (let y = 0; y < 8; y++) for (let x = 0; x < 8; x++) px(x0 + x, y0 + y, (y === (tx + ty) % 8 && x < 3 ? 2 : (y + (tx % 3)) % 4 < 2 ? 1 : 0)); },
    shallow(x0, y0) { for (let y = 0; y < 8; y++) for (let x = 0; x < 8; x++) px(x0 + x, y0 + y, (x + y * 3) % 11 === 0 ? 2 : 3); },
    sand(x0, y0) { for (let y = 0; y < 8; y++) for (let x = 0; x < 8; x++) px(x0 + x, y0 + y, (x * 3 + y * 5) % 7 === 0 ? 5 : 4); },
    grass(x0, y0, tx, ty) { for (let y = 0; y < 8; y++) for (let x = 0; x < 8; x++) px(x0 + x, y0 + y, ((x * 5 + y * 3 + tx * 7 + ty) % 11 === 0 ? 7 : (x * 3 + y * 7 + ty) % 13 === 0 ? 8 : 6)); },
    forest(x0, y0) { for (let y = 0; y < 8; y++) for (let x = 0; x < 8; x++) { const d = Math.abs(x - 3.5); px(x0 + x, y0 + y, y > 6 ? 9 : d < (y + 1) / 2 ? (x < 3 ? 11 : 10) : 9); } },
    rock(x0, y0, tx, ty) { const snow = elev(tx, ty) > 0.71; for (let y = 0; y < 8; y++) for (let x = 0; x < 8; x++) { const d = Math.abs(x - 3.5); const inPeak = d < (y + 1) * 0.6; px(x0 + x, y0 + y, !inPeak ? 13 : (snow && y < 3) ? 15 : x < 3.5 ? 14 : 12); } },
    desert(x0, y0) { for (let y = 0; y < 8; y++) for (let x = 0; x < 8; x++) px(x0 + x, y0 + y, (x + y * 2) % 9 === 0 ? 17 : 16); },
  };
  for (let ty = 0; ty < 64; ty++) for (let tx = 0; tx < 64; tx++) {
    const e = elev(tx, ty); const m = moist(tx, ty); const x0 = tx * 8; const y0 = ty * 8;
    if (e < 0.44) TILE.sea(x0, y0, tx, ty);
    else if (e < 0.47) TILE.shallow(x0, y0);
    else if (e < 0.5) TILE.sand(x0, y0);
    else if (e > 0.64) TILE.rock(x0, y0, tx, ty);
    else if (m > 0.54) TILE.forest(x0, y0);
    else if (m < 0.36) TILE.desert(x0, y0);
    else TILE.grass(x0, y0, tx, ty);
  }
  // A few castles on open ground
  let placed = 0;
  for (let n = 0; n < 900 && placed < 6; n++) {
    const tx = Math.floor(rnd() * 62); const ty = Math.floor(rnd() * 62);
    if (elev(tx, ty) < 0.52 || elev(tx, ty) > 0.62) continue;
    const x0 = tx * 8; const y0 = ty * 8; placed++;
    for (let y = 0; y < 16; y++) for (let x = 0; x < 16; x++) {
      const wall = x > 1 && x < 14 && y > 5 && y < 15;
      const roof = y <= 5 + 0 && Math.abs(x - 7.5) < 1 + y * 1.1;
      if (wall) px(x0 + x, y0 + y, (x % 4 === 2 && y > 8 && y < 13) ? 12 : y > 12 ? 20 : 19);
      else if (roof) px(x0 + x, y0 + y, 18);
    }
  }

  // Fog: eight copies of the palette blended towards the horizon, as colour math would
  const HAZE = [244, 208, 196]; const FOG = 8;
  const pals = Array.from({ length: FOG }, () => new Uint32Array(BASE.length));
  const seaRot = [0, 1, 2]; let seaPhase = 0;
  const writePal = () => {
    for (let f = 0; f < FOG; f++) {
      const k = (f / (FOG - 1)) ** 1.5 * 0.86;
      BASE.forEach((c, i) => {
        const src = i < 3 ? BASE[seaRot[(i + seaPhase) % 3]] : c;
        const r = (src[0] + (HAZE[0] - src[0]) * k) & 248; const g = (src[1] + (HAZE[1] - src[1]) * k) & 248; const b = (src[2] + (HAZE[2] - src[2]) * k) & 248;
        pals[f][i] = (255 << 24) | (b << 16) | (g << 8) | r;
      });
    }
  };
  writePal();

  // Airship, built on a small canvas
  const ship = document.createElement('canvas'); ship.width = 52; ship.height = 40;
  const sg = ship.getContext('2d');
  const R = (x, y, w, h, c) => { sg.fillStyle = c; sg.fillRect(x, y, w, h); };
  for (let y = 0; y < 19; y++) {
    const hw = Math.round(24 * Math.sqrt(Math.max(0, 1 - ((y - 9) / 9.6) ** 2)));
    R(26 - hw - 1, y, hw * 2 + 2, 1, '#301018');
    const base = y < 4 ? '#f07050' : y > 13 ? '#902028' : '#d03830';
    R(26 - hw, y, hw * 2, 1, base);
    for (const sx of [-16, -6, 4, 14]) R(26 + sx + Math.round((y - 9) * sx * 0.012), y, 2, 1, y < 4 ? '#f8d890' : y > 13 ? '#a06820' : '#e8b048');
    R(26 - hw, y, Math.min(3, hw), 1, y > 13 ? '#701828' : '#a82830');
  }
  R(10, 18, 2, 7, '#201830'); R(40, 18, 2, 7, '#201830'); R(25, 18, 2, 7, '#201830');
  R(7, 24, 38, 1, '#201018'); R(6, 25, 40, 2, '#d09858'); R(7, 27, 38, 3, '#a06830'); R(9, 30, 34, 2, '#704018'); R(13, 32, 26, 1, '#402010');
  for (let x = 11; x < 42; x += 6) R(x, 27, 2, 2, '#f8e8a0');
  R(1, 26, 5, 1, '#c8d0e0'); R(46, 26, 5, 1, '#c8d0e0');
  const m7s = { a: 0.7, cx: 180, cy: 300, steer: 0, want: 0, t: 0, visible: true, last: 0, drag: null };
  let W = 320; let H = 150; let img = ctx.createImageData(W, H); let buf = new Uint32Array(img.data.buffer);
  let hz = 44; const SKY = [[16, 32, 120], [24, 48, 144], [40, 64, 168], [64, 88, 184], [96, 104, 192], [136, 120, 192], [176, 136, 192], [216, 152, 184], [240, 176, 176], [248, 200, 176], [248, 216, 184]];
  let skyRows = []; let hillStrip = [];
  const CLOUD = new Uint8Array(512 * 64);
  (() => { for (let y = 0; y < 64; y++) for (let x = 0; x < 512; x++) { const n = noise(lat2, x / 40, y / 12) * 0.7 + noise(lat, x / 14, y / 6) * 0.3; CLOUD[y * 512 + x] = (y < 44 && n > 0.6) ? (n > 0.65 ? 2 : 1) : 0; } })();
  function resize() {
    // Keep every plane pixel on a whole-number scale, as a real output would be.
    const cw = m7.clientWidth; const ch = m7.clientHeight;
    const k = Math.max(cw < 520 ? 2 : 1, Math.round(cw / 320));
    W = Math.ceil(cw / k); H = Math.ceil(ch / k);
    cv.width = W; cv.height = H;
    cv.style.width = `${W * k}px`; cv.style.height = `${H * k}px`;
    img = ctx.createImageData(W, H); buf = new Uint32Array(img.data.buffer);
    hz = Math.round(H * 0.36);
    skyRows = [];
    for (let y = 0; y < hz; y++) {
      const c = SKY[Math.min(SKY.length - 1, Math.floor((y / hz) * SKY.length))];
      skyRows[y] = (255 << 24) | (c[2] << 16) | (c[1] << 8) | c[0];
    }
    hillStrip = [];
    for (let x = 0; x < 1024; x++) {
      const u = x / 1024 * 6.2832;
      hillStrip[x] = 6 + Math.sin(u * 3) * 3 + Math.sin(u * 7 + 1) * 2 + Math.abs(Math.sin(u * 13)) * 3;
    }
    draw();
  }
  const HILL = (255 << 24) | (152 << 16) | (112 << 8) | 136;
  const HILL2 = (255 << 24) | (120 << 16) | (88 << 8) | 104;
  function draw() {
    const { a } = m7s; const sin = Math.sin(a); const cos = Math.cos(a);
    const camH = 62; const focal = W * 0.56;
    const off = Math.round((a / 6.2832) * 1024);
    // Sky, clouds and the far hills: all shifted by heading, as a second layer would be
    for (let y = 0; y < hz; y++) {
      const row = skyRows[y]; const o = y * W;
      const cy = Math.floor((y / hz) * 63);
      for (let x = 0; x < W; x++) {
        let c = row;
        const cl = CLOUD[cy * 512 + (((x + Math.round(off * 0.5 + m7s.t * 3)) & 511))];
        if (cl) c = cl === 2 ? 0xfff8f0f8 : 0xffe0c8e8;
        const h = hillStrip[(x + off) & 1023];
        if (y >= hz - h) c = y >= hz - h * 0.5 ? HILL2 : HILL;
        buf[o + x] = c;
      }
    }
    // Floor: one affine transform per scanline, which is exactly what Mode 7 plus HDMA does
    for (let y = hz; y < H; y++) {
      const p = y - hz + 1;
      const dist = (camH * focal) / p;
      const span = dist / focal;
      const fogI = Math.min(FOG - 1, Math.floor(((H - hz - p) / (H - hz)) ** 3 * FOG));
      const pal = pals[fogI];
      let u = m7s.cx + cos * dist + sin * (W / 2) * span;
      let v = m7s.cy + sin * dist - cos * (W / 2) * span;
      const du = -sin * span; const dv = cos * span;
      const o = y * W;
      for (let x = 0; x < W; x++) {
        buf[o + x] = pal[tex[((v & 511) * TW) + (u & 511)]];
        u += du; v += dv;
      }
    }
    ctx.putImageData(img, 0, 0);
    // Ship and its shadow
    const sx = Math.round(W * 0.68 + m7s.steer * 14 - 26); const sy = Math.round(hz + (H - hz) * 0.16);
    ctx.fillStyle = 'rgba(8,16,48,.42)';
    const shy = sy + 58;
    for (let i = 0; i < 6; i++) { const w = [14, 20, 24, 24, 20, 14][i]; ctx.fillRect(sx + 26 - w + Math.round(m7s.steer * 6), shy + i, w * 2, 1); }
    ctx.drawImage(ship, sx, sy + Math.round(Math.sin(m7s.t * 1.7) * 1.4));
    const blink = Math.floor(m7s.t * 16) % 2;
    ctx.fillStyle = blink ? '#ffffff' : '#7888a8';
    ctx.fillRect(sx - 1, sy + 22 + Math.round(Math.sin(m7s.t * 1.7) * 1.4), 1, blink ? 9 : 5);
    ctx.fillRect(sx + 52, sy + 22 + Math.round(Math.sin(m7s.t * 1.7) * 1.4), 1, blink ? 5 : 9);
  }
  function loop(t) {
    requestAnimationFrame(loop);
    if (!m7s.visible || isCalm() || document.hidden) { m7s.last = t; return; }
    const dt = Math.min(0.05, (t - m7s.last) / 1000 || 0); m7s.last = t;
    m7s.t += dt;
    m7s.steer += (m7s.want - m7s.steer) * Math.min(1, dt * 3.5);
    m7s.a += (0.09 + m7s.steer * 0.9) * dt;
    m7s.cx += Math.cos(m7s.a) * 34 * dt; m7s.cy += Math.sin(m7s.a) * 34 * dt;
    const phase = Math.floor(t / 240) % 3;
    if (phase !== seaPhase) { seaPhase = phase; writePal(); }
    draw();
  }
  m7.addEventListener('pointermove', (e) => {
    if (e.pointerType === 'mouse') { const r = m7.getBoundingClientRect(); m7s.want = ((e.clientX - r.left) / r.width - 0.5) * 2; return; }
    if (m7s.drag !== null) { const r = m7.getBoundingClientRect(); m7s.want = Math.max(-1, Math.min(1, ((e.clientX - m7s.drag) / r.width) * 3)); }
  });
  m7.addEventListener('pointerleave', () => { m7s.want = 0; m7s.drag = null; });
  m7.addEventListener('pointerdown', (e) => { m7s.drag = e.clientX; });
  m7.addEventListener('pointerup', () => { m7s.want = 0; m7s.drag = null; });
  m7.addEventListener('pointercancel', () => { m7s.want = 0; m7s.drag = null; });
  if ('IntersectionObserver' in window) new IntersectionObserver((es) => { m7s.visible = es[0].isIntersecting; }).observe(m7);
  if ('ResizeObserver' in window) new ResizeObserver(resize).observe(m7);
  resize();
  requestAnimationFrame(loop);
  addEventListener('eas:calm', () => draw());
})();
