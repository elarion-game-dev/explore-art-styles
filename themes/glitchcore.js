// Glitchcore: the page is a half-decoded JPEG open in a hex editor. Every texture is real JPEG corruption, and the
// panel in "How to break it" corrupts an actual file byte by byte. Faults move things, they never flash.
(() => {
  const root = document.documentElement;
  const $ = (q, el = document) => el.querySelector(q);
  const $$ = (q, el = document) => [...el.querySelectorAll(q)];
  const isCalm = () => root.dataset.calm === '1';
  const rng = (seed) => () => { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 4294967296; };
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
  const hex = (n, w = 2) => n.toString(16).toUpperCase().padStart(w, '0');

  // Vermeer, Girl with a Pearl Earring, about 1665. Public domain. A baseline JPEG with no restart markers, so one bad byte
  // throws everything after it out of step, exactly as it would in a real file.
  const ORIGINAL = Uint8Array.from(atob('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'), (c) => c.charCodeAt(0));
  const SCAN = (() => {
    for (let i = 2; i < ORIGINAL.length - 3;) {
      if (ORIGINAL[i] !== 0xff) { i++; continue; }
      const len = (ORIGINAL[i + 2] << 8) | ORIGINAL[i + 3];
      if (ORIGINAL[i + 1] === 0xda) return i + 2 + len;
      i += 2 + len;
    }
    return 640;
  })();
  const END = ORIGINAL.length - 2;
  const safe = (b, i) => b[i] !== 0xff && b[i - 1] !== 0xff; // leaves markers and stuffed bytes alone
  const toUrl = (bytes) => URL.createObjectURL(new Blob([bytes], { type: 'image/jpeg' }));
  function bent(seed, count, from) {
    const r = rng(seed);
    const c = ORIGINAL.slice();
    const a = SCAN + Math.floor((END - SCAN) * from);
    for (let k = 0; k < count; k++) {
      const p = a + Math.floor(r() * (END - a));
      if (safe(c, p)) c[p] = Math.floor(r() * 255);
    }
    return c;
  }
  // The page's textures: real corrupted versions of the file above, chosen by seed so the first view is always the same.
  const presets = [bent(7, 60, 0.02), bent(5, 16, 0.1), bent(19, 90, 0.02)];
  const presetUrls = presets.map(toUrl);
  presetUrls.forEach((u, i) => root.style.setProperty(`--bent-${'abc'[i]}`, `url("${u}")`));

  // ---- Title: sliced into uneven strips that sit out of line ----
  const title = $('.hero-title');
  const text = title.textContent.trim();
  title.setAttribute('aria-label', text);
  const word = `<span>${text.slice(0, 6)}</span><span>${text.slice(6)}</span>`;
  const cuts = [0, 13, 22, 36, 44, 58, 64, 79, 88, 100];
  title.innerHTML = `<span class="gl-t" aria-hidden="true"><span class="gl-hold">${word}</span>${cuts.slice(0, -1).map((c, i) => `<span class="gl-s" style="--a:${c}%;--b:${100 - cuts[i + 1]}%">${word}</span>`).join('')}</span>`;
  const slices = $$('.gl-s', title);
  const REST = [0, 0, -0.03, 0, 0, -0.012, 0.06, 0, 0.016];
  const settle = () => slices.forEach((s, i) => s.style.setProperty('--dx', `${REST[i]}em`));
  settle();
  function fitTitle() {
    title.style.fontSize = '';
    const hold = $('.gl-hold', title);
    const base = parseFloat(getComputedStyle(title).fontSize);
    const w = hold.getBoundingClientRect().width;
    if (w) title.style.fontSize = `${Math.min(base * (title.clientWidth / w) * 0.97, 240)}px`;
  }
  fitTitle();
  if (document.fonts?.ready) document.fonts.ready.then(fitTitle);
  // A short fault every few seconds. A few strips move for a few frames, and nothing changes brightness.
  function burst(times = 3) {
    if (isCalm() || document.hidden) return;
    const picks = slices.filter(() => Math.random() < 0.45);
    picks.forEach((s) => s.style.setProperty('--dx', `${((Math.random() - 0.5) * 0.3).toFixed(3)}em`));
    setTimeout(() => (times > 1 ? burst(times - 1) : settle()), 70 + Math.random() * 70);
  }
  (function loop() {
    setTimeout(() => { burst(); loop(); }, 2800 + Math.random() * 4500);
  })();
  title.addEventListener('pointermove', (e) => {
    if (isCalm()) return;
    const b = title.getBoundingClientRect();
    const y = ((e.clientY - b.top) / b.height) * 100;
    const x = ((e.clientX - b.left) / b.width - 0.5) * 0.5;
    slices.forEach((s, i) => {
      const near = clamp(1 - Math.abs((cuts[i] + cuts[i + 1]) / 2 - y) / 26, 0, 1);
      s.style.setProperty('--dx', `${(REST[i] + x * near).toFixed(3)}em`);
    });
  });
  title.addEventListener('pointerleave', settle);

  // ---- Stair-stepped edges, snapped to the 16 px macroblock grid ----
  function stairs(el, seed, chance = 0.26) {
    const r = rng(seed);
    const w = el.offsetWidth;
    const h = el.offsetHeight;
    if (!w || !h) return;
    const pts = [];
    const edge = (len, fn) => {
      for (let x = 0; x < len;) {
        const end = Math.min(len, x + 16 * (2 + Math.floor(r() * 7)));
        const d = x && end < len && r() < chance ? (r() < 0.5 ? 16 : 8) : 0; // corners stay square
        fn(x, d);
        fn(end, d);
        x = end;
      }
    };
    edge(w, (x, d) => pts.push(`${x}px ${d}px`));
    edge(h, (y, d) => pts.push(`${w - d}px ${y}px`));
    edge(w, (x, d) => pts.push(`${w - x}px ${h - d}px`));
    edge(h, (y, d) => pts.push(`${d}px ${h - y}px`));
    el.style.setProperty('--edge', `polygon(${pts.join(',')})`);
  }
  const stepped = ['.feel-body', '.origins', '.do', '.avoid', '.learn', '.music-wrap', '.ref-list', '.steps'];
  const edges = () => stepped.forEach((q, i) => $$(q).forEach((el, j) => stairs(el, 31 + i * 17 + j * 5)));

  // ---- Pixel drips: one row of each image stretched downward. drawImage only, so this works on file:// too. ----
  const ROW = { 'shot-1': 0.74, 'shot-2': 0.56, 'shot-3': 0.97, 'shot-4': 0.72 };
  function paintDrip(fig, grow = 1) {
    const cv = $('.gl-drip', fig);
    const img = $('img', fig);
    const link = $('.shot-link', fig);
    if (!cv || !img.complete || !img.naturalWidth) return;
    const top = link.offsetTop + link.offsetHeight;
    const W = fig.clientWidth;
    const H = Math.max(0, fig.clientHeight - top);
    cv.style.top = `${top}px`;
    cv.style.height = `${H}px`;
    if (cv.width !== W) cv.width = W;
    if (cv.height !== H) cv.height = H;
    if (!W || !H) return;
    const c = cv.getContext('2d');
    c.imageSmoothingEnabled = false;
    c.clearRect(0, 0, W, H);
    const r = rng(fig.dataset.seed * 97 + 13);
    const key = Object.keys(ROW).find((k) => fig.classList.contains(k));
    const row = ROW[key] || 0.98;
    const nw = img.naturalWidth;
    const nh = img.naturalHeight;
    for (let x = 0; x < W;) {
      const bw = [8, 8, 16, 16, 24, 32, 48][Math.floor(r() * 7)];
      const u = r();
      const len = u < 0.2 ? 0 : Math.round(((r() ** 2.2) * H * 0.96 + 8) * grow / 8) * 8;
      const sy = Math.floor(nh * clamp(row - r() * 0.05, 0, 0.999));
      const sw = Math.max(1, Math.round((bw / W) * nw));
      if (len) c.drawImage(img, Math.floor((x / W) * nw), sy, sw, 1, x, 0, bw, len);
      x += bw;
    }
  }
  const figs = $$('.hero-gallery .shot, .ref-gallery .shot');
  figs.forEach((fig, i) => {
    fig.dataset.seed = i + 1;
    const cv = document.createElement('canvas');
    cv.className = 'gl-drip';
    cv.setAttribute('aria-hidden', 'true');
    fig.append(cv);
    const img = $('img', fig);
    const ready = () => {
      if (isCalm() || !fig.closest('.hero-gallery')) { paintDrip(fig); return; }
      let f = 0; // the drip runs down in a few stepped frames on load
      const t = setInterval(() => { f++; paintDrip(fig, f / 8); if (f >= 8) clearInterval(t); }, 70);
    };
    if (img.complete && img.naturalWidth) ready(); else img.addEventListener('load', ready, { once: true });
  });
  if ('ResizeObserver' in window) {
    const ro = new ResizeObserver((list) => list.forEach((e) => paintDrip(e.target)));
    figs.forEach((f) => ro.observe(f));
  }

  // ---- Hover to corrupt: rows slip and channels split around the cursor. The lightbox always shows the original. ----
  function tinted(img, W, H, colour) {
    const o = document.createElement('canvas');
    o.width = W;
    o.height = H;
    const x = o.getContext('2d');
    x.drawImage(img, 0, 0, W, H);
    x.globalCompositeOperation = 'multiply';
    x.fillStyle = colour;
    x.fillRect(0, 0, W, H);
    return o;
  }
  $$('.shot-link').forEach((link) => {
    const img = $('img', link);
    let cv = null;
    let ctx = null;
    let R = null;
    let GB = null;
    let last = 0;
    const prepare = () => {
      const W = img.clientWidth;
      const H = img.clientHeight;
      if (!W || !H || !img.naturalWidth) return false;
      if (!cv) {
        cv = document.createElement('canvas');
        cv.className = 'gl-c';
        cv.setAttribute('aria-hidden', 'true');
        link.append(cv);
        ctx = cv.getContext('2d');
      }
      if (cv.width !== W || cv.height !== H) {
        cv.width = W;
        cv.height = H;
        R = tinted(img, W, H, '#f00');
        GB = tinted(img, W, H, '#0ff');
      }
      return true;
    };
    const paint = (px, py) => {
      const W = cv.width;
      const H = cv.height;
      const r = Math.random;
      ctx.globalCompositeOperation = 'source-over';
      ctx.drawImage(img, 0, 0, W, H);
      for (let y = 0; y < H;) {
        const h = [8, 8, 16, 16, 32, 48][Math.floor(r() * 6)];
        const near = clamp(1 - Math.abs(y + h / 2 - py) / (H * 0.3), 0, 1);
        if (r() < 0.1 + near * 0.8) {
          const dx = Math.round((((r() - 0.5) * 0.08 + (px / W - 0.5) * near * 0.5) * W) / 8) * 8;
          const split = Math.round(2 + near * 12);
          const wrap = (src, x) => {
            ctx.drawImage(src, 0, y, W, h, x, y, W, h);
            ctx.drawImage(src, 0, y, W, h, x > 0 ? x - W : x + W, y, W, h);
          };
          ctx.globalCompositeOperation = 'source-over';
          ctx.fillStyle = '#000';
          ctx.fillRect(0, y, W, h);
          ctx.globalCompositeOperation = 'lighter';
          wrap(GB, dx);
          wrap(R, dx + split);
        }
        y += h;
      }
      ctx.globalCompositeOperation = 'source-over';
      for (let i = 0; i < 16; i++) {
        const s = [16, 16, 32, 48][Math.floor(r() * 4)];
        const bx = Math.round((px + (r() - 0.5) * W * 0.5) / 16) * 16;
        const by = Math.round((py + (r() - 0.5) * H * 0.5) / 16) * 16;
        ctx.drawImage(cv, clamp(bx + (r() - 0.5) * 160, 0, W - s), clamp(by + (r() - 0.5) * 160, 0, H - s), s, s, bx, by, s, s);
      }
    };
    link.addEventListener('pointermove', (e) => {
      if (isCalm() || e.pointerType === 'touch') return;
      const now = performance.now();
      if (now - last < 340) return; // never more than 3 re-rolls a second
      last = now;
      if (!prepare()) return;
      const b = img.getBoundingClientRect();
      paint(e.clientX - b.left, e.clientY - b.top);
      cv.classList.add('on');
    });
    link.addEventListener('pointerleave', () => cv?.classList.remove('on'));
  });

  // ---- Bands of the corrupted file between sections. They change when you break the file in the panel. ----
  const band = (before, cls) => {
    const b = document.createElement('div');
    b.className = `gl-band ${cls}`;
    b.setAttribute('aria-hidden', 'true');
    before.before(b);
  };
  band($('.hero-gallery'), 'gl-b0');
  band($('#core'), 'gl-b1');
  band($('#palette'), 'gl-b2');
  band($('#refs'), 'gl-b3');
  band($('.foot'), 'gl-b4');

  // ---- Headings arrive as garbage and resolve when they come into view ----
  const GLYPHS = '#%&@$!?/<>{}[]=+*0123456789';
  function scramble(el) {
    if (isCalm()) return;
    const real = el.dataset.real;
    let f = 0;
    const total = 11;
    clearInterval(el._t);
    el._t = setInterval(() => {
      f++;
      const solved = Math.floor((real.length * f) / total);
      el.textContent = [...real].map((ch, i) => (i < solved || ch === ' ' ? ch : GLYPHS[Math.floor(Math.random() * GLYPHS.length)])).join('');
      if (f >= total) { clearInterval(el._t); el.textContent = real; }
    }, 60);
  }
  const heads = $$('.sec-title, .core-item h3');
  heads.forEach((h) => {
    h.dataset.real = h.textContent;
    h.setAttribute('aria-label', h.textContent);
    h.addEventListener('pointerenter', () => scramble(h));
  });
  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver((list) => list.forEach((e) => {
      if (!e.isIntersecting) return;
      io.unobserve(e.target);
      scramble(e.target);
    }), { rootMargin: '-8% 0px' });
    heads.forEach((h) => io.observe(h));
  }

  // ---- The databender. A real JPEG: change its bytes and the browser decodes the damage. ----
  const CELLS = 96;
  const COLS = 8;
  let file = ORIGINAL.slice();
  let changed = new Set();
  let view = SCAN + 8 * Math.floor((END - SCAN) * 0.04 / 8);
  let cutAt = -1;
  const bender = document.createElement('aside');
  bender.className = 'gl-bender';
  bender.setAttribute('aria-label', 'Working databender. A real JPEG you can corrupt');
  bender.innerHTML = `
    <div class="gl-b-bar"><b>vermeer.jpg</b><span>${ORIGINAL.length.toLocaleString('en-US')} bytes</span><span class="gl-b-n">0 changed</span></div>
    <div class="gl-b-main">
      <figure class="gl-b-out"><img alt="Girl with a Pearl Earring by Vermeer, decoded live from the bytes in this panel" width="416" height="496"><figcaption>Vermeer, Girl with a Pearl Earring, about 1665. Public domain.</figcaption></figure>
      <div class="gl-b-side">
        <div class="gl-b-grid" aria-hidden="true"></div>
        <label class="gl-b-pos"><span>Where in the file</span><input type="range" min="0" max="${Math.floor((END - SCAN - CELLS) / COLS)}" step="1"></label>
      </div>
    </div>
    <div class="gl-b-tools">
      <button type="button" class="gl-b-one">Change 1 byte</button>
      <button type="button" class="gl-b-eight">Change 8</button>
      <button type="button" class="gl-b-cut">Cut the file here</button>
      <button type="button" class="gl-b-fix">Repair</button>
    </div>
    <p class="gl-b-log" role="status">This is a real JPEG. Click any byte or use the buttons, and your browser decodes the damage. A byte near the start of the file ruins more than one near the end.</p>`;
  $('.steps').after(bender);
  const out = $('.gl-b-out img', bender);
  const grid = $('.gl-b-grid', bender);
  const pos = $('.gl-b-pos input', bender);
  const log = $('.gl-b-log', bender);
  const count = $('.gl-b-n', bender);
  pos.value = String(Math.floor((view - SCAN) / COLS));
  function drawGrid() {
    let html = '';
    for (let row = 0; row < CELLS / COLS; row++) {
      const start = view + row * COLS;
      html += `<div class="gl-b-row"><i>${hex(start, 4)}</i>`;
      for (let i = start; i < start + COLS; i++) {
        const cls = changed.has(i) ? 'ed' : (safe(file, i) ? '' : 'lk');
        html += `<span data-i="${i}" class="${cls}">${hex(file[i])}</span>`;
      }
      html += '</div>';
    }
    grid.innerHTML = html;
  }
  let lastUrl = null;
  function decode() {
    const url = toUrl(file);
    const probe = new Image();
    probe.onload = () => {
      out.src = url;
      if (changed.size || cutAt > -1) root.style.setProperty('--bent-a', `url("${url}")`);
      else root.style.setProperty('--bent-a', `url("${presetUrls[0]}")`);
      const stale = lastUrl;
      lastUrl = url;
      if (stale) setTimeout(() => URL.revokeObjectURL(stale), 4000);
    };
    probe.onerror = () => { log.textContent = 'The decoder refused this version of the file. Press Repair.'; };
    probe.src = url;
    const total = changed.size;
    count.textContent = `${total} changed`;
    const s = $('.gl-st-c');
    if (s) s.textContent = `${total} BYTES CHANGED`;
  }
  function change(i) {
    const was = file[i];
    let now = was;
    while (now === was) now = Math.floor(Math.random() * 255);
    file[i] = now;
    changed.add(i);
    return [was, now];
  }
  grid.addEventListener('click', (e) => {
    const c = e.target.closest('span[data-i]');
    if (!c) return;
    const i = Number(c.dataset.i);
    if (!safe(file, i)) { log.textContent = `0x${hex(i, 4)} is part of a marker. Change it and the file ends early. Try "Cut the file here" for that.`; return; }
    const [was, now] = change(i);
    log.textContent = `0x${hex(i, 4)}: ${hex(was)} became ${hex(now)}. Everything decoded after this byte is now out of step.`;
    drawGrid();
    decode();
  });
  function randomBytes(n) {
    let done = 0;
    let tries = 0;
    let first = END;
    while (done < n && tries++ < 400) {
      const i = SCAN + Math.floor(Math.random() * (END - SCAN));
      if (!safe(file, i)) continue;
      change(i);
      first = Math.min(first, i);
      done++;
    }
    log.textContent = `${n === 1 ? 'One byte' : `${n} bytes`} changed, the earliest at 0x${hex(first, 4)}. The picture stays correct down to about there.`;
    drawGrid();
    decode();
  }
  $('.gl-b-one', bender).addEventListener('click', () => randomBytes(1));
  $('.gl-b-eight', bender).addEventListener('click', () => randomBytes(8));
  $('.gl-b-cut', bender).addEventListener('click', () => {
    const i = view;
    file[i] = 0xff;
    file[i + 1] = 0xd9;
    changed.add(i);
    changed.add(i + 1);
    cutAt = i;
    log.textContent = `End-of-file marker written at 0x${hex(i, 4)}. Below that there is no data, only grey.`;
    drawGrid();
    decode();
  });
  $('.gl-b-fix', bender).addEventListener('click', () => {
    file = ORIGINAL.slice();
    changed = new Set();
    cutAt = -1;
    log.textContent = 'Repaired. Every byte is back where it was.';
    drawGrid();
    decode();
  });
  pos.addEventListener('input', () => { view = SCAN + Number(pos.value) * COLS; drawGrid(); });
  drawGrid();
  out.src = presetUrls[0] ? toUrl(file) : '';

  // ---- Hex gutter and status bar: the editor around the page ----
  const page = $('.page');
  const gutter = document.createElement('pre');
  gutter.className = 'gl-gutter';
  gutter.setAttribute('aria-hidden', 'true');
  page.prepend(gutter);
  function fillGutter() {
    const rows = Math.ceil(page.scrollHeight / 16);
    let s = '';
    for (let i = 0; i < rows; i++) {
      const o = i * 16;
      const a = (o % ORIGINAL.length);
      s += `${hex(o, 6)} ${hex(ORIGINAL[a])}${hex(ORIGINAL[a + 1] ?? 0)}\n`;
    }
    gutter.textContent = s;
  }
  const status = document.createElement('div');
  status.className = 'gl-status';
  status.setAttribute('aria-hidden', 'true');
  status.innerHTML = '<span class="gl-st-o">OFFSET 000000</span><span class="gl-st-s">HEADER</span><span class="gl-st-c">0 BYTES CHANGED</span>';
  document.body.append(status);
  const stO = $('.gl-st-o', status);
  const stS = $('.gl-st-s', status);
  const secs = $$('.sec');
  function readout() {
    stO.textContent = `OFFSET ${hex(Math.round(scrollY) & 0xfffff0, 6)}`;
    const mid = scrollY + innerHeight * 0.4;
    let name = 'HEADER';
    for (const s of secs) if (s.offsetTop + page.offsetTop < mid) name = ($('.sec-title', s).dataset.real || '').toUpperCase();
    if (stS.textContent !== name) stS.textContent = name;
  }

  // ---- Fast scrolling makes the whole page lose its line length for a moment ----
  let lastY = scrollY;
  let speed = 0;
  let raf = 0;
  function skew() {
    const y = scrollY;
    speed = speed * 0.8 + (y - lastY) * 0.2;
    lastY = y;
    const q = Math.round(clamp(speed * 0.03, -2.1, 2.1) / 0.7) * 0.7;
    page.style.transform = q ? `skewX(${q}deg)` : '';
    if (Math.abs(speed) > 0.6) raf = requestAnimationFrame(skew);
    else { raf = 0; page.style.transform = ''; }
  }
  addEventListener('scroll', () => {
    readout();
    if (!raf && !isCalm()) { lastY = scrollY; raf = requestAnimationFrame(skew); }
  }, { passive: true });
  addEventListener('eas:calm', () => { settle(); page.style.transform = ''; });

  const layout = () => { edges(); fillGutter(); readout(); fitTitle(); figs.forEach((f) => paintDrip(f)); };
  edges();
  fillGutter();
  readout();
  addEventListener('load', layout);
  if (document.fonts?.ready) document.fonts.ready.then(() => { edges(); fillGutter(); });
  let rt;
  addEventListener('resize', () => { clearTimeout(rt); rt = setTimeout(layout, 120); });
})();
