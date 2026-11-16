// Weirdcore: WordArt titles, captions that quietly rearrange themselves, cut-out eyes, and a real JPEG ruin machine.
// Every save counts as a generation, and the page's own backdrops get worse as the number climbs. Close it without saving to get them back.
(() => {
  const root = document.documentElement;
  const isCalm = () => root.dataset.calm === '1';
  const WC_SEED = 'data:image/jpeg;base64,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';
  const $ = (q, el = document) => el.querySelector(q);
  const $$ = (q, el = document) => [...el.querySelectorAll(q)];
  const make = (tag, cls, html) => { const e = document.createElement(tag); if (cls) e.className = cls; if (html != null) e.innerHTML = html; return e; };
  const SVGNS = 'http://www.w3.org/2000/svg';
  const svg = (tag, attrs = {}) => { const e = document.createElementNS(SVGNS, tag); for (const k in attrs) e.setAttribute(k, attrs[k]); return e; };

  // ---- Generations ----
  const KEY = 'eas-wc-gen';
  const readGen = () => { try { return Number(localStorage.getItem(KEY)) || 0; } catch { return 0; } };
  const writeGen = (n) => { try { localStorage.setItem(KEY, String(n)); } catch { /* private window: it forgets */ } };
  let gen = readGen() + 1;
  const here = $('.atlas-here');
  const hereBase = here ? here.textContent.trim() : '';
  function paintGen() {
    writeGen(gen);
    root.dataset.rot = gen < 4 ? '1' : gen < 10 ? '2' : '3';
    $$('[data-wc-gen]').forEach((e) => { e.textContent = gen; });
    const name = `weirdcore${' (copy)'.repeat(Math.min(gen - 1, 5))}.jpg`;
    if (here) here.textContent = `${hereBase}  ·  ${name}`;
    const q = $('.wc-close-q');
    if (q) q.textContent = `Do you want to save the changes you made to ${name}?`;
  }
  paintGen();

  const toastEl = $('[data-toast]');
  let toastT;
  const toast = (msg) => { toastEl.textContent = msg; toastEl.classList.add('on'); clearTimeout(toastT); toastT = setTimeout(() => toastEl.classList.remove('on'), 2400); };

  // ---- WordArt ----
  // Each shape says where the middle of the word sits and how tall it is at a point along it, in cap heights.
  const SHAPES = {
    arch: (u) => ({ mid: .62 * (2 * u - 1) ** 2, half: .5 }),
    arch2: (u) => ({ mid: -.62 * (2 * u - 1) ** 2, half: .5 }),
    wave: (u) => ({ mid: .3 * Math.sin(u * Math.PI * 2), half: .5 }),
    inflate: (u) => ({ mid: 0, half: .36 + .36 * Math.sin(Math.PI * u) }),
    deflate: (u) => ({ mid: 0, half: .74 - .36 * Math.sin(Math.PI * u) }),
    slant: (u) => ({ mid: .55 - 1.1 * u, half: .5 }),
    fade: (u) => ({ mid: 0, half: .78 - .46 * u }),
    chevron: (u) => ({ mid: .62 * Math.abs(2 * u - 1), half: .5 }),
  };
  const v = (...stops) => ({ dir: 'v', stops });
  const FILLS = {
    rainbow: { dir: 'h', hue: true },
    gold: v('#fff8b0', '#f0bd18', '#7c4a00', '#ffe46a'),
    chrome: v('#ffffff', '#9fb2c6', '#1c2430', '#e8f2ff'),
    ocean: v('#c8ffff', '#16b8e8', '#0a2aa8', '#1fd0e8'),
    fire: v('#fff27a', '#ff9d0a', '#d80f00', '#6c0000'),
    pink: v('#ffd6f4', '#ff3cb4', '#6a10a8', '#ff8ae0'),
    lime: v('#f6ffb0', '#6df018', '#006b1c', '#b6ff40'),
  };
  const ORDER = ['arch', 'wave', 'inflate', 'slant', 'deflate', 'chevron', 'fade', 'arch2'];
  const FILLORDER = ['rainbow', 'gold', 'ocean', 'chrome', 'pink', 'fire', 'lime'];
  const hsl = (u) => `hsl(${Math.round(355 - u * 310)} 100% ${u > .45 && u < .75 ? 46 : 52}%)`;
  let waId = 0;
  const meas = document.createElement('canvas').getContext('2d');
  const FONT = '400 100px Anton, Impact, sans-serif';

  function wordArt(text, shapeName, fillName, ex = 8) {
    meas.font = FONT;
    const shape = SHAPES[shapeName];
    const fill = FILLS[fillName];
    const capH = meas.measureText('H').actualBoundingBoxAscent || 86;
    const track = 3;
    const adv = [...text].map((c) => meas.measureText(c).width + (c === ' ' ? 8 : track));
    const W = adv.reduce((a, b) => a + b, 0);
    const id = `wa${++waId}`;
    const root2 = svg('svg', { class: 'wa', 'aria-hidden': 'true' });
    const defs = svg('defs');
    const shapeG = svg('g', { id: `${id}-s` });
    const face = svg('g', { stroke: '#000', 'stroke-width': 2.6, 'stroke-linejoin': 'round', 'paint-order': 'stroke' });
    let x = 0;
    [...text].forEach((c, i) => {
      const w = adv[i];
      const u0 = x / W;
      const u1 = (x + w) / W;
      const a = shape(u0);
      const b = shape(u1);
      const m = shape((u0 + u1) / 2);
      if (c !== ' ') {
        const skew = (b.mid - a.mid) * capH / w;
        const tf = `matrix(1 ${skew.toFixed(4)} 0 ${(2 * m.half).toFixed(4)} ${x.toFixed(2)} ${((a.mid + m.half) * capH).toFixed(2)})`;
        const base = { transform: tf, 'font-size': 100, 'font-family': 'Anton, Impact, sans-serif' };
        const t1 = svg('text', base);
        t1.textContent = c;
        shapeG.append(t1);
        const g = svg('linearGradient', { id: `${id}-g${i}`, x1: 0, y1: 0, x2: fill.dir === 'h' ? 1 : 0, y2: fill.dir === 'h' ? 0 : 1 });
        const stops = fill.hue ? [hsl(u0), hsl(u1)] : fill.stops;
        stops.forEach((col, k) => g.append(svg('stop', { offset: k / (stops.length - 1), 'stop-color': col })));
        defs.append(g);
        const t2 = svg('text', { ...base, fill: `url(#${id}-g${i})` });
        t2.textContent = c;
        face.append(t2);
      }
      x += w;
    });
    defs.append(shapeG);
    root2.append(defs);
    const side = svg('g', { fill: '#000' });
    for (let k = ex; k > 0; k--) side.append(svg('use', { href: `#${id}-s`, x: k * 1.1, y: k * .9, fill: k > ex * .6 ? '#000' : '#101010' }));
    root2.append(side, face);
    // Scan the envelope to frame the word.
    let top = 0;
    let bot = 0;
    for (let s = 0; s <= 40; s++) {
      const e = shape(s / 40);
      top = Math.min(top, (e.mid - e.half) * capH);
      bot = Math.max(bot, (e.mid + e.half) * capH);
    }
    const pad = 6;
    const y0 = top - pad;
    const h = bot - top + pad * 2 + ex * .9 + 16;
    root2.setAttribute('viewBox', `${-pad} ${y0.toFixed(1)} ${(W + pad * 2 + ex * 1.1).toFixed(1)} ${h.toFixed(1)}`);
    return root2;
  }

  function installWordArt(h, shape, fill, ex, n) {
    const text = h.textContent.trim();
    h.setAttribute('aria-label', text);
    h.textContent = '';
    h.append(make('span', 'wa-text', text));
    const box = make('span', 'wa-box');
    box.setAttribute('aria-hidden', 'true');
    box.style.setProperty('--n', n || Math.max(text.length, 7));
    const put = () => {
      box.textContent = '';
      box.append(wordArt(text, ORDER[shape], FILLORDER[fill], ex));
      // Office selection handles, plus the yellow diamond that bends the word.
      for (const [l, t] of [[0, 0], [50, 0], [100, 0], [0, 50], [100, 50], [0, 100], [50, 100], [100, 100]]) {
        const i = make('i', 'wa-h');
        i.style.left = `${l}%`;
        i.style.top = `${t}%`;
        box.append(i);
      }
      const tip = make('i', 'wa-h is-tip');
      tip.style.left = '22%';
      tip.style.top = '100%';
      box.append(tip);
    };
    put();
    h.append(box);
    box.addEventListener('click', () => {
      shape = (shape + 1) % ORDER.length;
      fill = (fill + 1) % FILLORDER.length;
      put();
    });
  }

  const startWordArt = () => {
    installWordArt($('.hero-title'), 0, 0, 13, 15);
    const list = [['#feel', 3, 3], ['#core', 2, 1], ['#how', 1, 2], ['#palette', 6, 0], ['#vibe', 4, 4], ['#refs', 7, 5], ['#related', 5, 6]];
    for (const [sel, s, f] of list) {
      const h = $(`${sel} .sec-title`);
      if (h) installWordArt(h, s, f, 7);
    }
  };

  // ---- Captions that rearrange ----
  // Every variant uses the same words, so nothing is added or lost. They only change places.
  const SAYS = {
    '#feel': ['you are not supposed to read this', 'are you not supposed to read this', 'you are supposed to not read this', 'not you are supposed to read this'],
    '#core': ['there are six things here count them', 'there are six here things count them', 'count them there are six things here', 'here there are six things count them'],
    '#how': ['do it like this and nobody will check', 'nobody will check and do it like this', 'do it and nobody will check like this'],
    '#palette': ['these colours were already here', 'these were colours already here', 'were these colours already here', 'these colours already were here'],
    '#vibe': ['turn it down they can hear you', 'they can hear you turn it down', 'you can hear they turn it down'],
    '#refs': ['other people have seen this too', 'have other people seen this too', 'other people have this seen too', 'this too other people have seen'],
    '#related': ['you can leave this way', 'can you leave this way', 'this way you can leave', 'you can this way leave'],
  };
  // The tagline drifts too, using its own words: each variant swaps one pair of them.
  const tagVariants = (text) => {
    const w = text.trim().split(/\s+/);
    const swap = ([i, j]) => { const v = [...w]; [v[i], v[j]] = [v[j], v[i]]; return v.join(' '); };
    return [w.join(' '), ...[[4, 5], [1, 2], [8, 9], [0, 3]].filter(([, j]) => j < w.length).map(swap)];
  };

  function drifter(el, variants) {
    const parse = (s) => s.split(' ');
    const words = parse(variants[0]);
    el.textContent = '';
    const spans = words.map((w) => make('span', '', w));
    spans.forEach((s) => el.append(s, ' '));
    let now = 0;
    function step() {
      now = (now + 1 + Math.floor(Math.random() * (variants.length - 1))) % variants.length;
      const target = parse(variants[now]);
      const free = [...spans];
      const order = target.map((w) => free.splice(free.findIndex((s) => s.textContent === w), 1)[0]);
      const first = new Map(spans.map((s) => [s, s.getBoundingClientRect()]));
      el.textContent = '';
      order.forEach((s) => el.append(s, ' '));
      order.forEach((s) => {
        const a = first.get(s);
        const b = s.getBoundingClientRect();
        const dx = a.left - b.left;
        const dy = a.top - b.top;
        if (dx || dy) s.animate([{ transform: `translate(${dx}px,${dy}px)` }, { transform: 'none' }], { duration: 1800, easing: 'ease-in-out' });
      });
    }
    return step;
  }

  const steppers = [];
  const visible = new WeakSet();
  const watch = new IntersectionObserver((es) => { for (const e of es) { if (e.isIntersecting) visible.add(e.target); else visible.delete(e.target); } }, { threshold: .2 });
  const tagline = $('.hero-tagline');
  steppers.push([tagline, drifter(tagline, tagVariants(tagline.textContent))]);
  watch.observe(tagline);
  for (const sel in SAYS) {
    const sec = $(sel);
    const h = sec && $('.sec-title', sec);
    if (!h) continue;
    const p = make('p', 'wc-say');
    p.setAttribute('aria-hidden', 'true');
    h.after(p);
    steppers.push([p, drifter(p, SAYS[sel])]);
    watch.observe(p);
  }

  // The contents list trades places too, but never under your hand.
  const toc = $('.toc ul');
  let tocHeld = false;
  $('.toc').addEventListener('pointerenter', () => { tocHeld = true; });
  $('.toc').addEventListener('pointerleave', () => { tocHeld = false; });
  $('.toc').addEventListener('focusin', () => { tocHeld = true; });
  $('.toc').addEventListener('focusout', () => { tocHeld = false; });
  function shuffleToc() {
    const items = [...toc.children];
    const i = Math.floor(Math.random() * items.length);
    let j = Math.floor(Math.random() * (items.length - 1));
    if (j >= i) j += 1;
    const first = new Map(items.map((s) => [s, s.getBoundingClientRect()]));
    toc.insertBefore(items[i], j + 1 < items.length ? items[j + 1] : null);
    for (const s of items) {
      const a = first.get(s);
      const b = s.getBoundingClientRect();
      if (a.left !== b.left || a.top !== b.top) s.animate([{ transform: `translate(${a.left - b.left}px,${a.top - b.top}px)` }, { transform: 'none' }], { duration: 1600, easing: 'ease-in-out' });
    }
  }
  watch.observe($('.toc'));

  let turn = 0;
  setInterval(() => {
    if (isCalm() || document.hidden) return;
    const live = steppers.filter(([e]) => visible.has(e));
    if (live.length) live[turn++ % live.length][1]();
    if (visible.has($('.toc')) && !tocHeld && turn % 2 === 0) shuffleToc();
  }, 5200);

  // ---- Things marked up in Paint, on the hero pictures ----
  const mark = (shot, inner, label, style) => {
    const link = $(`${shot} .shot-link`);
    if (!link) return;
    const m = make('span', 'wc-mark', `<svg viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">${inner}</svg>`);
    m.setAttribute('aria-hidden', 'true');
    if (label) {
      const s = make('span', '', label);
      s.style.cssText = style;
      m.append(s);
    }
    link.append(m);
  };
  mark('.shot-1', '<path d="M86 22 C83 30 79 38 73.5 47"/><path d="M71 39 L73 48 L79 43"/>', 'this is you', 'right:5%;top:12%');
  mark('.shot-3', '<ellipse cx="66" cy="42" rx="5.2" ry="15" transform="rotate(4 66 42)"/>', 'he is listening', 'left:58%;top:16%');
  mark('.shot-4', '', "don't look at its neck", 'left:6%;bottom:9%');

  // ---- Eyes ----
  const eyes = [];
  const eye = (parent, css, w) => {
    const p = typeof parent === 'string' ? $(parent) : parent;
    if (!p) return;
    const e = make('i', 'wc-eye');
    e.setAttribute('aria-hidden', 'true');
    e.style.cssText = css;
    e.style.setProperty('--w', `${w}px`);
    p.append(e);
    eyes.push(e);
  };
  eye('.hero-text', 'right:2%;bottom:-6px;rotate:-7deg', 138);
  eye('.feel-body', 'right:-46px;top:-30px;rotate:9deg', 118);
  eye('.origins', 'left:-60px;bottom:-22px;rotate:-12deg', 96);
  eye('.core-item:nth-child(5)', 'right:-22px;bottom:-34px;rotate:5deg', 104);
  eye('.specs', 'right:-14px;top:-30px;rotate:-6deg', 84);
  eye('.tracks', 'right:-30px;top:-36px;rotate:10deg', 112);
  let lastMove = 0;
  addEventListener('pointermove', (ev) => {
    const t = performance.now();
    if (t - lastMove < 120 || isCalm()) return;
    lastMove = t;
    for (const e of eyes) {
      const r = e.getBoundingClientRect();
      if (r.bottom < 0 || r.top > innerHeight) continue;
      const dx = ev.clientX - (r.left + r.width / 2);
      e.dataset.f = dx < -90 ? '0' : dx > 90 ? '2' : '1';
    }
  }, { passive: true });

  // ---- The ruin machine ----
  const maker = make('div', 'wc-maker', `
    <div><canvas width="480" height="300" aria-label="An image being repeatedly saved as a JPEG"></canvas>
      <div class="wc-read" aria-live="polite"></div></div>
    <div>
      <h3>Try it. Ruin something.</h3>
      <p>This is your browser's real JPEG encoder. Every press throws more of the picture away, and shifts it by a pixel so the damage keeps building. Bring your own picture, add a caption, then keep what is left.</p>
      <div class="wc-row"><label for="wc-q">Quality</label><input id="wc-q" type="range" min="1" max="40" value="10"><output for="wc-q">10</output></div>
      <div class="wc-row"><input id="wc-text" type="text" maxlength="42" placeholder="are you lost?" aria-label="Caption"><button class="btn" type="button" data-a="cap">Add caption</button></div>
      <div class="wc-row">
        <button class="btn" type="button" data-a="one">Save again</button>
        <button class="btn" type="button" data-a="ten">Save 10 times</button>
        <button class="btn" type="button" data-a="reset">Start over</button>
      </div>
      <div class="wc-row">
        <label class="btn wc-file">Use your own picture<input type="file" accept="image/*" aria-label="Use your own picture"></label>
        <a class="btn" data-a="keep" download="weirdcore.jpg" href="#">Keep this one</a>
      </div>
      <p>Careful. These saves count, and the backgrounds on this page get worse with them.</p>
    </div>`);
  $('.how-side').after(maker);
  const cv = $('canvas', maker);
  const ctx = cv.getContext('2d');
  const qEl = $('#wc-q', maker);
  const readout = $('.wc-read', maker);
  const keep = $('[data-a=keep]', maker);
  let source = null;
  let saves = 0;
  let lastKB = 0;
  let busy = false;

  const paintRead = () => { readout.textContent = saves ? `saved ${saves} time${saves === 1 ? '' : 's'} at quality ${qEl.value}: ${lastKB} KB` : 'the original. Press save.'; };
  const loadImg = (src) => new Promise((ok, no) => { const i = new Image(); i.onload = () => ok(i); i.onerror = no; i.src = src; });
  function drawCover(img) {
    const s = Math.max(cv.width / img.naturalWidth, cv.height / img.naturalHeight);
    const w = img.naturalWidth * s;
    const h = img.naturalHeight * s;
    ctx.drawImage(img, (cv.width - w) / 2, (cv.height - h) / 2, w, h);
  }
  async function start(src) {
    source = await loadImg(src);
    saves = 0;
    lastKB = 0;
    drawCover(source);
    keep.href = cv.toDataURL('image/jpeg', .9);
    paintRead();
  }
  async function saveOnce() {
    const url = cv.toDataURL('image/jpeg', Number(qEl.value) / 100);
    lastKB = (url.length * .75 / 1024).toFixed(1);
    const img = await loadImg(url);
    const dx = Math.floor(Math.random() * 3) - 1;
    const dy = Math.floor(Math.random() * 3) - 1;
    ctx.drawImage(img, 0, 0);
    if ('filter' in ctx) ctx.filter = 'saturate(1.05)';
    ctx.drawImage(img, dx, dy);
    if ('filter' in ctx) ctx.filter = 'none';
    keep.href = url;
    saves += 1;
    gen += 1;
    paintGen();
    paintRead();
  }
  async function run(n) {
    if (busy) return;
    busy = true;
    for (let i = 0; i < n; i++) await saveOnce();
    busy = false;
  }
  maker.addEventListener('click', (e) => {
    const a = e.target.closest('[data-a]')?.dataset.a;
    if (a === 'one') run(1);
    if (a === 'ten') run(10);
    if (a === 'reset' && source) { saves = 0; lastKB = 0; drawCover(source); paintRead(); }
    if (a === 'cap') {
      const t = $('#wc-text', maker);
      const text = (t.value || t.placeholder).trim();
      ctx.font = '700 22px Arial, Arimo, Helvetica, sans-serif';
      ctx.fillStyle = '#ff0000';
      const w = ctx.measureText(text).width;
      const x = 12 + Math.random() * Math.max(0, cv.width - w - 24);
      const y = 40 + Math.random() * (cv.height - 70);
      ctx.fillText(text, x, y);
    }
  });
  qEl.addEventListener('input', () => { $('output', maker).textContent = qEl.value; });
  $('input[type=file]', maker).addEventListener('change', (e) => {
    const f = e.target.files[0];
    if (f) start(URL.createObjectURL(f)).catch(() => toast('That one would not open.'));
  });
  start(WC_SEED);

  // ---- Closing dialog ----
  const foot = $('.foot');
  const box = make('div', 'wc-close', '<b>weirdcore</b><p class="wc-close-q"></p><div><button class="btn" type="button" data-c="save">Save</button><button class="btn" type="button" data-c="revert">Don\'t Save</button><button class="btn" type="button" data-c="cancel">Cancel</button></div>');
  foot.prepend(box);
  box.addEventListener('click', (e) => {
    const c = e.target.dataset.c;
    if (c === 'save') { gen += 1; paintGen(); toast('Saved. It is worse now.'); }
    if (c === 'revert') { gen = 1; paintGen(); toast('Reverted. This is what it looked like to begin with.'); }
    if (c === 'cancel') { scrollTo({ top: 0, behavior: isCalm() ? 'auto' : 'smooth' }); }
  });
  paintGen();

  // WordArt needs the real font's measurements.
  const go = () => startWordArt();
  if (document.fonts?.load) document.fonts.load('400 100px Anton').then(go, go);
  else go();
})();
