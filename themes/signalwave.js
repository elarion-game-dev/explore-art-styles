// Signalwave: a teletext service. Adds the header row with a live clock, double-height titles, mosaic graphics drawn in
// 2 x 3 blocks, Fastext keys and three-digit page entry. While a page is being found, the header rolls through page
// numbers like a real decoder. Calm mode jumps straight to the page and stops the flashing.
(() => {
  const root = document.documentElement;
  const isCalm = () => root.dataset.calm === '1';
  const T = { k: '#000000', r: '#ff0000', g: '#00ff00', y: '#ffff00', b: '#0000ff', m: '#ff00ff', c: '#00ffff', w: '#ffffff' };

  // 1. Double-height rows: each word stretched to two rows, as teletext does.
  for (const el of document.querySelectorAll('.hero-title, .sec-title')) {
    const words = el.textContent.trim().split(/\s+/);
    el.setAttribute('aria-label', el.textContent.trim());
    el.textContent = '';
    words.forEach((w, i) => {
      const s = document.createElement('span');
      s.className = 'dh';
      s.setAttribute('aria-hidden', 'true');
      s.textContent = w;
      el.append(s);
      if (i < words.length - 1) el.append(' ');
    });
    el.classList.add('sw-dh');
  }

  // 2. Mosaic graphics. Draw on a tiny canvas at block resolution, then paint each 2 x 3 cell as separated blocks.
  function mosaic(drawFn, cols, rows, scale, colourOf) {
    const bw = cols * 2, bh = rows * 3;
    const src = document.createElement('canvas');
    src.width = bw; src.height = bh;
    const sx = src.getContext('2d');
    drawFn(sx, bw, bh);
    const data = sx.getImageData(0, 0, bw, bh).data;
    const out = document.createElement('canvas');
    const cw = 2 * scale, ch = 3 * scale;
    out.width = cols * cw; out.height = rows * ch;
    const o = out.getContext('2d');
    const gap = Math.max(1, Math.round(scale / 5));
    for (let y = 0; y < bh; y++) {
      for (let x = 0; x < bw; x++) {
        const i = (y * bw + x) * 4;
        if (data[i + 3] < 128) continue;
        o.fillStyle = colourOf ? colourOf(data[i], data[i + 1], data[i + 2], x, y) : `rgb(${data[i]},${data[i + 1]},${data[i + 2]})`;
        o.fillRect(x * scale, y * scale, scale - gap, scale - gap);
      }
    }
    return out;
  }
  // Snap a colour to the nearest of the eight teletext colours.
  const snap = (r, g, b) => `rgb(${r > 127 ? 255 : 0},${g > 127 ? 255 : 0},${b > 127 ? 255 : 0})`;

  // The hero art: a transmitter mast sending out rings. Two frames, so the rings can flash like teletext.
  function mast(ringsOn) {
    return (x, w, h) => {
      x.lineWidth = 1.6;
      x.strokeStyle = T.w;
      const cx = w / 2, top = 22, base = h - 1;
      x.beginPath(); x.moveTo(cx, top); x.lineTo(cx - 8, base); x.moveTo(cx, top); x.lineTo(cx + 8, base); x.stroke();
      x.lineWidth = 1.2;
      for (let yy = top + 6, k = 0; yy < base - 2; yy += 6, k++) {
        const half = 8 * (yy - top) / (base - top);
        x.beginPath(); x.moveTo(cx - half, yy); x.lineTo(cx + half, yy + 6 > base ? base : yy + 6); x.stroke();
      }
      x.fillStyle = T.r; x.fillRect(cx - 1.5, top - 4, 3, 4);
      x.lineWidth = 1.6;
      const rings = [[T.y, 7], [T.c, 12], [T.m, 17]];
      rings.forEach(([col, r], i) => {
        if (!ringsOn && i === 1) return;
        x.strokeStyle = col;
        x.beginPath(); x.arc(cx, top - 2, r, Math.PI * 1.02, Math.PI * 1.38); x.stroke();
        x.beginPath(); x.arc(cx, top - 2, r, Math.PI * 1.62, Math.PI * 1.98); x.stroke();
      });
      x.fillStyle = T.g; x.fillRect(0, base, w, 1);
    };
  }
  const heroText = document.querySelector('.hero-text');
  if (heroText) {
    const frameA = mosaic(mast(true), 18, 20, 6, snap);
    const frameB = mosaic(mast(false), 18, 20, 6, snap);
    const art = document.createElement('canvas');
    art.className = 'sw-art';
    art.setAttribute('aria-hidden', 'true');
    art.width = frameA.width; art.height = frameA.height;
    const actx = art.getContext('2d');
    actx.drawImage(frameA, 0, 0);
    heroText.append(art);
    // The middle ring flashes about once a second, the teletext flash attribute. Calm mode keeps it lit.
    let on = true;
    setInterval(() => {
      const next = isCalm() ? true : !on;
      if (next === on) return;
      on = next;
      actx.clearRect(0, 0, art.width, art.height);
      actx.drawImage(on ? frameA : frameB, 0, 0);
    }, 1000);
  }

  // Strips of mosaic between pages: a stepped skyline in the page's band colour, different for every section.
  const bandOf = { 'sec-feel': T.b, 'sec-core': T.c, 'sec-how': T.m, 'sec-palette': T.y, 'sec-vibe': T.r, 'sec-refs': T.g, 'sec-related': T.w };
  let seed = 7;
  const rnd = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };
  for (const sec of document.querySelectorAll('.sec')) {
    const key = Object.keys(bandOf).find((k) => sec.classList.contains(k));
    const col = bandOf[key] || T.b;
    const cols = 40, rows = 2;
    const heights = [];
    let h = 2 + Math.floor(rnd() * 3);
    for (let i = 0; i < cols * 2; i++) {
      if (rnd() < 0.28) h = Math.max(1, Math.min(6, h + (rnd() < 0.5 ? -1 : 1)));
      heights.push(h);
    }
    const strip = mosaic((x, w, hh) => {
      x.fillStyle = col;
      heights.forEach((v, i) => x.fillRect(i, hh - v, 1, v));
    }, cols, rows, 6);
    strip.className = 'sw-strip';
    strip.setAttribute('aria-hidden', 'true');
    sec.prepend(strip);
  }

  // 3. Pages. Sections are x00 pages, core items 301 up and how-to steps 401 up.
  const pages = new Map();
  const secPages = [['.hero', 100], ['#feel', 200], ['#core', 300], ['#how', 400], ['#palette', 500], ['#vibe', 600], ['#refs', 700], ['#related', 800]];
  for (const [q, n] of secPages) { const el = document.querySelector(q); if (el) pages.set(n, el); }
  document.querySelectorAll('.core-item').forEach((el, i) => pages.set(301 + i, el));
  document.querySelectorAll('.step').forEach((el, i) => pages.set(401 + i, el));
  const findPage = (n) => pages.get(n) || pages.get(Math.floor(n / 100) * 100) || null;

  // 4. The header row.
  const head = document.createElement('div');
  head.className = 'sw-head';
  head.innerHTML = '<div class="sw-head-row"><span class="sw-page">P100</span><span class="sw-service">SIGNALTEXT</span><span class="sw-num">100</span><span class="sw-msg" aria-live="polite"></span><span class="sw-date"></span><span class="sw-time"></span></div>';
  document.querySelector('.atlas').after(head);
  const hPage = head.querySelector('.sw-page');
  const hNum = head.querySelector('.sw-num');
  const hDate = head.querySelector('.sw-date');
  const hTime = head.querySelector('.sw-time');
  const hMsg = head.querySelector('.sw-msg');
  const pad = (n) => String(n).padStart(2, '0');
  function tick() {
    const d = new Date();
    hDate.textContent = d.toLocaleDateString('en-GB', { weekday: 'short', day: '2-digit', month: 'short' }).replace(/,/g, '');
    hTime.textContent = isCalm() ? `${pad(d.getHours())}:${pad(d.getMinutes())}` : `${pad(d.getHours())}:${pad(d.getMinutes())}/${pad(d.getSeconds())}`;
  }
  tick();
  setInterval(tick, 1000);

  // Which page is on screen.
  let searching = false;
  const here = () => {
    const line = innerHeight * 0.3;
    let n = 100;
    for (const [q, num] of secPages) {
      const el = document.querySelector(q);
      if (el && el.getBoundingClientRect().top <= line) n = num;
    }
    return n;
  };
  function showHere() {
    if (searching) return;
    const n = here();
    hPage.textContent = `P${n}`;
    hNum.textContent = String(n);
  }
  let ticking = false;
  addEventListener('scroll', () => {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(() => { ticking = false; showHere(); });
  }, { passive: true });
  showHere();

  // 5. Going to a page: roll the counter, then jump.
  let rollTimer = null, msgTimer = null;
  function message(text) {
    hMsg.textContent = text;
    clearTimeout(msgTimer);
    msgTimer = setTimeout(() => { hMsg.textContent = ''; }, 2200);
  }
  function arrive(n, el) {
    searching = false;
    hPage.classList.remove('is-search');
    const top = el.getBoundingClientRect().top + scrollY - (parseFloat(getComputedStyle(root).scrollPaddingTop) || 100);
    scrollTo({ top, behavior: 'instant' });
    if (!el.hasAttribute('tabindex')) el.setAttribute('tabindex', '-1');
    el.focus({ preventScroll: true });
    hPage.textContent = `P${n}`;
    hNum.textContent = String(n);
  }
  function goTo(n) {
    const el = findPage(n);
    if (!el) { message(`P${n} NOT IN SERVICE`); return; }
    clearInterval(rollTimer);
    if (isCalm()) { arrive(n, el); return; }
    searching = true;
    hPage.textContent = `P${n}`;
    hPage.classList.add('is-search');
    let cur = here();
    const steps = 18;
    let k = 0;
    rollTimer = setInterval(() => {
      k++;
      cur = k >= steps ? n : (cur + 1 + Math.floor(Math.random() * 7)) % 900 + (cur > 890 ? 100 : 0);
      if (cur < 100) cur += 100;
      hNum.textContent = String(k >= steps ? n : cur);
      if (k >= steps) { clearInterval(rollTimer); arrive(n, el); }
    }, 40);
  }

  // 6. Fastext keys and the page box.
  const fast = document.createElement('nav');
  fast.className = 'sw-fast';
  fast.setAttribute('aria-label', 'Fastext');
  fast.innerHTML = `<div class="sw-fast-row">
    <a href="#feel" data-p="100">Index</a><a href="#how" data-p="400">How to</a><a href="#palette" data-p="500">Palette</a><a href="#refs" data-p="700">Refs</a>
    <form class="sw-entry" action="#"><label><span>Page</span> <input type="text" inputmode="numeric" pattern="[1-8][0-9][0-9]" maxlength="3" placeholder="100" aria-label="Go to page number, 100 to 800"></label><button type="submit">Go</button></form>
  </div>`;
  document.body.append(fast);
  for (const a of fast.querySelectorAll('a[data-p]')) {
    a.addEventListener('click', (e) => { e.preventDefault(); goTo(Number(a.dataset.p)); });
  }
  const input = fast.querySelector('input');
  fast.querySelector('form').addEventListener('submit', (e) => {
    e.preventDefault();
    const n = Number(input.value);
    if (n >= 100 && n <= 899) goTo(n); else message('PAGES 100 TO 800');
    input.value = '';
  });
  for (const a of document.querySelectorAll('.toc a')) {
    a.addEventListener('click', (e) => {
      const n = [...pages.entries()].find(([, el]) => `#${el.id}` === a.hash);
      if (!n) return;
      e.preventDefault();
      goTo(n[0]);
    });
  }

  // Typing three digits anywhere goes to that page, as on a remote control.
  let typed = '';
  let typedTimer = null;
  addEventListener('keydown', (e) => {
    if (e.ctrlKey || e.metaKey || e.altKey) return;
    if (/input|textarea|select/i.test(e.target.tagName) || e.target.isContentEditable) return;
    if (document.querySelector('dialog[open]')) return;
    if (!/^[0-9]$/.test(e.key)) return;
    if (!typed && (e.key === '0' || e.key === '9')) return;
    typed += e.key;
    clearTimeout(typedTimer);
    hPage.textContent = `P${typed.padEnd(3, '-')}`;
    if (typed.length === 3) { const n = Number(typed); typed = ''; goTo(n); }
    else typedTimer = setTimeout(() => { typed = ''; showHere(); }, 2500);
  });

  addEventListener('eas:calm', () => { tick(); if (isCalm() && searching) { clearInterval(rollTimer); searching = false; hPage.classList.remove('is-search'); showHere(); } });
})();
