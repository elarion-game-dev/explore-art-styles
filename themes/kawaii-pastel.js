// Kawaii / Cute Pastel: a sheet of twelve character stickers beside the header card. Every sticker peels off: drag it
// anywhere on the page and it stays there (this browser remembers where), while the sheet keeps a glossy hole in its
// shape. Drop one back on the sheet to put it away. Press a sticker and it squishes. Four start out already stuck round
// the page. The script also cuts the title into letter stickers and scatters a few sparkles round it.
(() => {
  const root = document.documentElement;
  const $ = (q, el = document) => el.querySelector(q);
  const $$ = (q, el = document) => [...el.querySelectorAll(q)];
  const calm = () => Boolean(root.dataset.calm);
  const hero = $('.hero');
  const card = $('.hero-text');
  if (!hero || !card) return;
  const esc = (s) => s.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

  // ---------- drawing ----------
  // Each part is drawn twice: first filled and stroked in its line colour, then filled on top, so overlapping shapes
  // share one outline 3.5 units wide. The white die-cut border is the same shapes, stroked wider, underneath everything.
  const INK = '#4a3628';
  const LINE = 7;
  const CUT = 12;
  const n = (v) => +v.toFixed(2);
  const C = (x, y, r) => `<circle cx="${x}" cy="${y}" r="${r}"/>`;
  const E = (x, y, rx, ry, a = 0) => `<ellipse cx="${x}" cy="${y}" rx="${rx}" ry="${ry}"${a ? ` transform="rotate(${a} ${x} ${y})"` : ''}/>`;
  const R = (x, y, w, h, r) => `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${r}"/>`;
  const P = (d) => `<path d="${d}"/>`;
  const gloss = (x, y, rx = 6, ry = 3.4, a = -32) => `<ellipse cx="${x}" cy="${y}" rx="${rx}" ry="${ry}" fill="#fff" opacity=".8" transform="rotate(${a} ${x} ${y})"/>`;
  const eye = (x, y, s) => `<ellipse cx="${n(x)}" cy="${n(y)}" rx="${n(2.7 * s)}" ry="${n(3.3 * s)}" fill="${INK}"/><circle cx="${n(x + 0.9 * s)}" cy="${n(y - 1.3 * s)}" r="${n(s)}" fill="#fff"/>`;
  function face(x, y, s = 1, mouth = 'smile', gap = 10) {
    const g = gap * s;
    const m = {
      smile: `M${n(x - 2.6 * s)} ${n(y + 2.4 * s)}q${n(2.6 * s)} ${n(2.8 * s)} ${n(5.2 * s)} 0`,
      open: `M${n(x - 2.6 * s)} ${n(y + 2 * s)}q${n(2.6 * s)} ${n(4.6 * s)} ${n(5.2 * s)} 0z`,
      cat: `M${n(x - 4 * s)} ${n(y + 2 * s)}q${n(2 * s)} ${n(2.8 * s)} ${n(4 * s)} 0q${n(2 * s)} ${n(2.8 * s)} ${n(4 * s)} 0`,
    }[mouth];
    const blush = (bx) => `<ellipse cx="${n(bx)}" cy="${n(y + 5.6 * s)}" rx="${n(4.4 * s)}" ry="${n(2.6 * s)}" fill="#f58fab" opacity=".62"/>`;
    return blush(x - g - 3 * s) + blush(x + g + 3 * s) + eye(x - g, y, s) + eye(x + g, y, s)
      + `<path d="${m}" fill="${mouth === 'open' ? '#e2687f' : 'none'}" stroke="${INK}" stroke-width="${n(1.7 * s)}" stroke-linecap="round" stroke-linejoin="round"/>`;
  }

  const arc = (r) => `M${n(50 - r)} 70A${r} ${r} 0 0 1 ${n(50 + r)} 70`;
  const cloudL = C(17, 77, 8) + C(26, 71, 9.5) + C(33, 79, 7) + C(39, 77, 6.5) + R(12, 74, 30, 12, 6);
  const cloudR = C(83, 77, 8) + C(74, 71, 9.5) + C(67, 79, 7) + C(61, 77, 6.5) + R(58, 74, 30, 12, 6);
  const petals = [0, 72, 144, 216, 288].map((a) => {
    const t = ((a - 90) * Math.PI) / 180;
    return E(n(50 + 21 * Math.cos(t)), n(52 + 21 * Math.sin(t)), 14, 17, a);
  }).join('');
  const seeds = [[30, 47], [70, 47], [23, 61], [77, 61], [33, 77], [67, 77], [50, 85]].map(([x, y]) => E(x, y, 1.6, 2.4)).join('');

  // [fill, line, shapes, extra rounding] or a raw string drawn in between
  const S = [
    { id: 'strawberry', r: -8, parts: [
      ['#ffa6ba', '#dc6d8f', P('M50 91C32 89 15 71 15 51 15 36 28 29 50 31 72 29 85 36 85 51 85 71 68 89 50 91Z')],
      `<g fill="#fff3c4">${seeds}</g>`,
      ['#a9e4b1', '#5aa874', P('M50 35 35 33 39 26 29 20 42 20 50 12 58 20 71 20 61 26 65 33Z'), 3],
    ], top: '<path d="M50 13V6" stroke="#5aa874" stroke-width="4.5" stroke-linecap="round"/>' + face(50, 60) + gloss(28, 44) },
    { id: 'cloud', r: 6, parts: [
      ['#f6fcff', '#7dbbdb', C(31, 60, 16) + C(50, 46, 22) + C(70, 53, 17) + C(80, 66, 10) + C(20, 68, 10) + R(17, 58, 66, 22, 11)],
    ], top: face(50, 64) + gloss(39, 33, 6, 3.2, -24) },
    { id: 'star', r: 10, parts: [
      ['#ffe796', '#d9a63a', P('M50 14 61.2 36.6 86.1 40.3 68.1 57.9 72.3 82.7 50 71 27.7 82.7 31.9 57.9 13.9 40.3 38.8 36.6Z'), 6],
    ], top: face(50, 54, 0.92) + gloss(39, 41, 4.5, 2.6) },
    { id: 'onigiri', r: -4, parts: [
      ['#fffdf6', '#ab9a86', P('M50 13C61 13 89 61 89 74 89 86 79 90 50 90 21 90 11 86 11 74 11 61 39 13 50 13Z')],
    ], top: '<path d="M36 70h28v20.2H36z" fill="#46564f"/><path d="M39 74.5h22" stroke="#61746a" stroke-width="1.6"/>' + face(50, 53, 0.95) + gloss(40, 29, 5, 2.8, -55) },
    { id: 'dango', r: 14, parts: [
      ['#efcf9f', '#b88c5a', R(47.5, 9, 5, 83, 2.5)],
      ['#cdeec6', '#6eb37b', C(50, 77, 14.5)],
      ['#fffaf1', '#c3ab90', C(50, 52, 14.5)],
      ['#ffc9d7', '#de7f9b', C(50, 27, 14.5)],
    ], top: face(50, 28, 0.62, 'smile', 9) + face(50, 53, 0.62, 'open', 9) + face(50, 78, 0.62, 'smile', 9) + gloss(42, 19, 3.4, 2) + gloss(42, 44, 3.4, 2) + gloss(42, 69, 3.4, 2) },
    { id: 'pudding', r: -6, parts: [
      ['#fffefc', '#b9a7d8', E(50, 83, 40, 8.5)],
      ['#ffe49c', '#d59d3e', P('M31 37h38c4 0 6 2 6.4 6L79 74c.5 5.6-3 8.5-8.6 8.5H29.6C24 82.5 20.5 79.6 21 74L24.6 43c.4-4 2.4-6 6.4-6Z')],
      ['#ff93ae', '#d65c80', C(50, 29, 7.5)],
    ], top: '<path d="M31 37h38c4 0 6 2 6.4 6l.6 5.4c-2.2 3-5 3-6.6.2-1.8 3.6-5.4 3.8-7.4.4-2 3.4-5.8 3.4-7.6 0-2 3.4-5.6 3.4-7.6 0-2 3.8-5.6 3.6-7.4-.2-1.6 2.8-4.4 2.6-6.6-.4l.6-5.4c.4-4 2.4-6 6.4-6Z" fill="#c98953"/><path d="M50 22c.6-4.6 3-7.4 6.6-8.8" fill="none" stroke="#5aa874" stroke-width="2.6" stroke-linecap="round"/>' + face(50, 64) + gloss(30, 58, 2.6, 6, 8) + gloss(46.5, 26, 2.4, 1.5) },
    { id: 'milk', r: 8, parts: [
      ['#ffd5e0', '#d77d98', R(34, 10, 32, 9, 2)],
      ['#fff8fb', '#d77d98', P('M26 41 34 19h32l8 22Z'), 2],
      ['#ffd5e0', '#d77d98', R(26, 41, 48, 50, 5)],
    ], top: '<path d="M50 27.5c-2.4-3.2-7-1.8-6.4 1.6.6 2.8 6.4 5.6 6.4 5.6s5.8-2.8 6.4-5.6c.6-3.4-4-4.8-6.4-1.6Z" fill="#ff9fb8"/>' + face(50, 63) + gloss(32, 52, 2.6, 6, 0) },
    { id: 'cat', r: -10, parts: [
      ['#fff4e4', '#c79b74', P('M21 50 25 21 45 37Z') + P('M79 50 75 21 55 37Z') + E(50, 62, 36, 26), 4],
    ], top: '<path d="M27.5 40 29.5 29.5 37.5 36Z" fill="#ffc6d3"/><path d="M72.5 40 70.5 29.5 62.5 36Z" fill="#ffc6d3"/><path d="M60 38.5c8.4-1.2 17.4 3.6 21 13.2-6.6 2.4-14.6.2-18.8-5.4-2-2.8-2.6-5.4-2.2-7.8Z" fill="#ffd3a6"/>' + face(50, 62, 1, 'cat', 12) + gloss(25, 57, 3.2, 6, 20) },
    { id: 'peach', r: 5, parts: [
      ['#ffcdbd', '#e08b78', P('M50 31C42 18 16 21 15 49 14 75 32 90 50 90 68 90 86 75 85 49 84 21 58 18 50 31Z')],
      '<ellipse cx="63" cy="62" rx="19" ry="21" fill="#ffaab9" opacity=".45"/><path d="M50 32c-5 8-6.4 16-4.6 24" fill="none" stroke="#e08b78" stroke-width="2.4" stroke-linecap="round" opacity=".75"/>',
      ['#ade0b0', '#5fa673', P('M50 31C44 21 33 16 24 19 27 30 39 35 50 31Z') + P('M50 31C55 19 65 13 76 14 74 26 62 33 50 31Z')],
    ], top: face(53, 66) + gloss(27, 49, 4, 7, 22) },
    { id: 'rainbow', r: -6,
      back: `<path d="${arc(22.25)}" fill="none" stroke="#a98ad4" stroke-width="33"/>` + [[32, '#ffb3c6'], [25.5, '#ffe896'], [19, '#b8efc6'], [12.5, '#b5def2']].map(([r, c]) => `<path d="${arc(r)}" fill="none" stroke="${c}" stroke-width="6.6"/>`).join(''),
      cut: (c, w) => `<path d="${arc(22.25)}" fill="none" stroke="${c}" stroke-width="${33 + w}"/><g fill="${c}" stroke="${c}" stroke-width="${LINE + w}" stroke-linejoin="round">${cloudL + cloudR}</g>`,
      parts: [['#fffefc', '#8fc6e0', cloudL + cloudR]],
      top: face(26, 78, 0.62, 'smile', 8) + gloss(23, 67.5, 3, 1.8) + gloss(73, 67.5, 3, 1.8) },
    { id: 'sakura', r: 12, parts: [
      ['#ffd7e3', '#e38ca9', petals],
      ['#fff0a8', '#e1b347', C(50, 52, 13)],
    ], top: face(50, 53, 0.62, 'smile', 8) + gloss(40, 22, 3.6, 2.2, -10) },
    { id: 'icecream', r: -12, parts: [
      ['#f7d293', '#c99446', P('M32 54h36L52.6 91.5c-1 2.4-4.2 2.4-5.2 0Z'), 3],
      '<clipPath id="kp-cone"><path d="M32 54h36L52.6 91.5c-1 2.4-4.2 2.4-5.2 0Z"/></clipPath><g clip-path="url(#kp-cone)" stroke="#d29c50" stroke-width="1.8" opacity=".75"><path d="M28 62l34 34M28 74l26 26M38 54l34 34M50 54l24 24M72 62 38 96M72 74 46 100M62 54 28 88M50 54 26 78"/></g>',
      ['#ffc4d5', '#de7f9c', C(50, 37, 22) + E(50, 53, 25, 8)],
    ], top: '<g stroke-width="2.8" stroke-linecap="round"><path d="M33 33l3-3" stroke="#ffe896"/><path d="M61 23l3.6 1.2" stroke="#9fe0b3"/><path d="M44 20l3.4-1.6" stroke="#9fd2ec"/><path d="M68 35l1.4 3.4" stroke="#c7aee8"/><path d="M57 18.5l2.6 2" stroke="#ffe896"/></g>' + face(50, 40, 0.95) + gloss(37, 27, 4.5, 2.6) },
  ];

  const parts = (d) => d.parts.map((p) => (typeof p === 'string' ? p
    : `<g fill="${p[1]}" stroke="${p[1]}" stroke-width="${LINE + (p[3] || 0)}" stroke-linejoin="round" stroke-linecap="round">${p[2]}</g>`
      + `<g fill="${p[0]}"${p[3] ? ` stroke="${p[0]}" stroke-width="${p[3]}" stroke-linejoin="round"` : ''}>${p[2]}</g>`)).join('');
  const silhouette = (d, c, w) => (d.cut ? d.cut(c, w) : d.parts.filter((p) => typeof p !== 'string')
    .map((p) => `<g fill="${c}" stroke="${c}" stroke-width="${LINE + (p[3] || 0) + w}" stroke-linejoin="round" stroke-linecap="round">${p[2]}</g>`).join(''));
  const stickerSVG = (d) => `<svg viewBox="0 0 100 100" aria-hidden="true" focusable="false">${silhouette(d, '#fffefc', CUT)}${d.back || ''}${parts(d)}${d.top || ''}</svg>`;
  // The hole a sticker leaves: the kiss-cut line, then the glossy backing with a streak of light across it
  const holeSVG = (d) => `<svg class="kp-hole" viewBox="0 0 100 100" aria-hidden="true" focusable="false">${silhouette(d, '#c3aab4', CUT + 2.4)}${silhouette(d, 'url(#kp-liner)', CUT)}${silhouette(d, 'url(#kp-sheen)', CUT - 4)}</svg>`;

  document.body.insertAdjacentHTML('beforeend', '<svg width="0" height="0" style="position:absolute" aria-hidden="true" focusable="false"><defs>'
    + '<linearGradient id="kp-liner" gradientUnits="userSpaceOnUse" x1="0" y1="0" x2="100" y2="100"><stop offset="0" stop-color="#fdfdff"/><stop offset="1" stop-color="#e3e8f0"/></linearGradient>'
    + '<linearGradient id="kp-sheen" gradientUnits="userSpaceOnUse" x1="10" y1="0" x2="90" y2="100"><stop offset=".3" stop-color="#fff" stop-opacity="0"/><stop offset=".4" stop-color="#fff" stop-opacity=".95"/><stop offset=".47" stop-color="#fff" stop-opacity="0"/><stop offset=".55" stop-color="#fff" stop-opacity=".55"/><stop offset=".6" stop-color="#fff" stop-opacity="0"/></linearGradient>'
    + '</defs></svg>');

  // ---------- the title, cut into letter stickers, with sparkles round it ----------
  const h1 = $('.hero-title');
  if (h1 && !h1.children.length) {
    const t = h1.textContent.trim();
    h1.classList.add('kp-split');
    h1.innerHTML = [...t].map((ch, i) => (ch === ' ' ? ' ' : `<span class="kp-ch" aria-hidden="true" data-ch="${esc(ch)}" style="--i:${i}">${esc(ch)}</span>`)).join('') + `<span class="kp-sr">${esc(t)}</span>`;
  }
  const spark = (line) => `<svg viewBox="0 0 30 30" aria-hidden="true" focusable="false"><path d="M15 2C16 10 20 14 28 15 20 16 16 20 15 28 14 20 10 16 2 15 10 14 14 10 15 2Z" fill="#fffefc" stroke="${line}" stroke-width="2.2" stroke-linejoin="round"/></svg>`;
  [['6%', '33%', 30, '#d8b04a', 0], ['89%', '29%', 24, '#e48aa5', -1.1], ['11%', '63%', 20, '#6fb3d6', -2.3], ['84%', '66%', 28, '#a98ad4', -0.6]].forEach(([l, t, z, c, d]) => {
    const s = document.createElement('span');
    s.className = 'kp-tw';
    s.setAttribute('aria-hidden', 'true');
    s.style.cssText = `left:${l};top:${t};--z:${z}px;--d:${d}s`;
    s.innerHTML = spark(c);
    card.append(s);
  });

  // ---------- the sheet ----------
  const sheet = document.createElement('div');
  sheet.className = 'kp-sheet';
  sheet.setAttribute('role', 'group');
  sheet.setAttribute('aria-label', 'Sticker sheet');
  sheet.innerHTML = `<p class="kp-sheet-head">Sticker sheet <span class="kp-count">${S.length} stickers</span><button class="kp-reset" type="button" hidden>Put them all back</button></p><div class="kp-slots"></div>`
    + '<p class="kp-sheet-note">Peel a sticker off and stick it anywhere on the page (on a touch screen, hold it for a moment first). Press one and it squishes. Drop it back on the sheet to put it away.</p>';
  sheet.tabIndex = -1; // takes the focus when "Put them all back" hides itself
  card.after(sheet);
  const slots = $('.kp-slots', sheet);
  const resetBtn = $('.kp-reset', sheet);

  const items = new Map();
  for (const d of S) {
    const slot = document.createElement('div');
    slot.className = 'kp-slot';
    slot.style.setProperty('--r', `${d.r}deg`); // the hole is cut at the same angle the sticker sits
    slot.innerHTML = holeSVG(d);
    const pos = document.createElement('div');
    pos.className = 'kp-pos';
    pos.dataset.id = d.id;
    pos.innerHTML = `<div class="kp-stk" aria-hidden="true">${stickerSVG(d)}</div>`;
    slot.append(pos);
    slots.append(slot);
    items.set(d.id, { d, slot, pos, stk: pos.firstElementChild });
  }

  // Where things can be stuck: the cover, the contents, every sheet and the footer
  const anchors = { hero, toc: $('.toc') };
  for (const s of $$('.sec[id]')) anchors[s.id] = s;
  anchors.foot = $('.foot');
  // Four start out already stuck round the page, so the sheet shows their holes
  const DEFAULTS = {
    star: { sel: '.hero-gallery .shot-1', left: '6px', top: '6px', r: -14 },
    cloud: { sel: '.hero-text', left: 'calc(100% - 54px)', top: '48px', r: 8 },
    dango: { sel: '#core', left: 'calc(100% - 50px)', top: '12px', r: 18 },
    milk: { sel: '#palette', left: 'calc(100% - 54px)', top: '14px', r: -10 },
  };

  const KEY = 'eas-kawaii-stickers';
  const valid = (v) => v === 'home' || (v && typeof v === 'object' && anchors[v.a] && Number.isFinite(v.x) && Number.isFinite(v.y));
  let state = {};
  try {
    const v = JSON.parse(localStorage.getItem(KEY) || '{}');
    if (v && typeof v === 'object') for (const [k, s] of Object.entries(v)) if (items.has(k) && valid(s)) state[k] = s;
  } catch { /* private window or bad data */ }
  const save = () => { try { localStorage.setItem(KEY, JSON.stringify(state)); } catch { /* private window */ } };
  const spotOf = (id) => (id in state ? state[id] : DEFAULTS[id] || 'home');

  const clamp01 = (v) => Math.min(Math.max(v, 0), 1);
  function put(id, spot) {
    const { d, slot, pos, stk } = items.get(id);
    pos.classList.remove('kp-drag', 'kp-default');
    pos.style.cssText = '';
    let host = null;
    let r = d.r;
    if (spot && spot !== 'home') {
      if (spot.sel) {
        host = $(spot.sel);
        pos.classList.add('kp-default'); // the four starting spots, which narrow screens nudge (see the CSS)
        pos.style.left = spot.left;
        pos.style.top = spot.top;
      } else {
        host = anchors[spot.a];
        // Kept inside its section at any width, so a spot saved on a wide screen can't hang off a phone's edge
        pos.style.left = `clamp(calc(var(--kp-s) / 2), ${n(clamp01(spot.x) * 100)}%, calc(100% - var(--kp-s) / 2))`;
        pos.style.top = `${n(clamp01(spot.y) * 100)}%`;
      }
      if (typeof spot.r === 'number') r = spot.r;
    }
    if (host) { host.append(pos); slot.classList.add('is-out'); } else { pos.style.cssText = ''; slot.append(pos); slot.classList.remove('is-out'); r = d.r; }
    stk.style.setProperty('--r', `${r}deg`);
  }
  // "Put them all back" shows while any sticker is off the sheet; the count shows in its place once all twelve are home
  const count = $('.kp-count', sheet);
  const paintReset = () => { resetBtn.hidden = !slots.querySelector('.kp-slot.is-out'); count.hidden = !resetBtn.hidden; };
  for (const id of items.keys()) put(id, spotOf(id));
  paintReset();

  function bounce(el, cls) {
    el.classList.remove('kp-land', 'kp-boing');
    if (calm()) return;
    void el.offsetWidth; // restart the animation if it is already running
    el.classList.add(cls);
  }
  document.addEventListener('animationend', (e) => {
    if (e.target.classList?.contains('kp-stk') && /kp-(land|boing)/.test(e.animationName)) e.target.classList.remove('kp-land', 'kp-boing');
  });
  addEventListener('eas:calm', () => { if (calm()) for (const { stk } of items.values()) stk.classList.remove('kp-land', 'kp-boing'); });

  // Every sticker goes home, the four starters included. Write every change first, then one reflow restarts all the squashes.
  resetBtn.addEventListener('click', () => {
    state = Object.fromEntries([...items.keys()].map((id) => [id, 'home']));
    save();
    for (const [id, it] of items) { it.stk.classList.remove('kp-land', 'kp-boing'); put(id, 'home'); }
    paintReset();
    sheet.focus({ preventScroll: true });
    if (calm()) return;
    void sheet.offsetWidth;
    for (const it of items.values()) it.stk.classList.add('kp-land');
  });

  // ---------- peel, carry, stick ----------
  let drag = null;
  let raf = 0;
  const sizeOf = () => parseFloat(getComputedStyle(root).getPropertyValue('--kp-s')) || 88;

  // A mouse or pen peels a sticker at once. A finger has to rest on it for a moment first (the sticker squashes to show
  // it is held), so a swipe that starts on the sheet still scrolls the page: the CSS lets the browser pan vertically, and
  // only a held sticker stops the page moving.
  const HOLD = 280;
  document.addEventListener('pointerdown', (e) => {
    if (drag || (e.pointerType === 'mouse' && e.button !== 0)) return;
    const pos = e.target.closest?.('.kp-pos');
    if (!pos || !items.has(pos.dataset.id)) return;
    const touch = e.pointerType === 'touch';
    if (!touch) e.preventDefault();
    const it = items.get(pos.dataset.id);
    it.stk.classList.remove('kp-land', 'kp-boing');
    drag = { it, id: pos.dataset.id, pid: e.pointerId, x0: e.clientX, y0: e.clientY, x: e.clientX, y: e.clientY, vx: 0, moved: false, held: !touch, timer: 0 };
    if (!touch) it.stk.classList.add('kp-press');
    else drag.timer = setTimeout(() => { if (drag?.it === it) { drag.held = true; it.stk.classList.add('kp-press'); } }, HOLD);
  });
  for (const { pos } of items.values()) pos.addEventListener('touchmove', (e) => { if (drag?.held && drag.it.pos === pos) e.preventDefault(); }, { passive: false });
  addEventListener('contextmenu', (e) => { if (drag?.held) e.preventDefault(); });

  function lift() {
    const { it } = drag;
    drag.moved = true;
    drag.w = sizeOf();
    drag.from = it.pos.parentElement === it.slot ? 'home' : spotOf(drag.id);
    try { document.body.setPointerCapture(drag.pid); } catch { /* pointer already gone */ }
    it.slot.classList.add('is-out');
    it.stk.classList.remove('kp-press');
    it.pos.style.cssText = `--w:${drag.w}px`;
    it.pos.classList.add('kp-drag');
    document.body.append(it.pos);
    root.classList.add('kp-dragging');
    follow();
  }
  function follow() {
    raf = 0;
    if (!drag?.moved) return;
    const tilt = Math.max(-14, Math.min(14, drag.vx * 0.8));
    drag.it.pos.style.transform = `translate3d(${n(drag.x - drag.w / 2)}px, ${n(drag.y - drag.w / 2)}px, 0)`;
    drag.it.stk.style.setProperty('--tilt', `${n(tilt)}deg`);
  }
  addEventListener('pointermove', (e) => {
    if (!drag || e.pointerId !== drag.pid) return;
    drag.vx = e.clientX - drag.x;
    drag.x = e.clientX;
    drag.y = e.clientY;
    if (!drag.moved) {
      if (Math.hypot(drag.x - drag.x0, drag.y - drag.y0) < 6) return;
      if (!drag.held) { clearTimeout(drag.timer); drag = null; return; } // a finger swiping past: leave it to the page
      lift();
    }
    if (!raf) raf = requestAnimationFrame(follow);
  }, { passive: true });

  function drop(d, x, y) {
    const sr = sheet.getBoundingClientRect();
    if (x >= sr.left && x <= sr.right && y >= sr.top && y <= sr.bottom) {
      state[d.id] = 'home';
    } else {
      // Measure every anchor once, then pick the one under the drop (or the nearest above or below it)
      let best = null;
      for (const [k, el] of Object.entries(anchors)) {
        if (!el) continue;
        const r = el.getBoundingClientRect();
        const dist = y < r.top ? r.top - y : y > r.bottom ? y - r.bottom : 0;
        if (!best || dist < best.dist) best = { k, r, dist };
      }
      // Keep the whole sticker inside the section it is stored against (and on screen), so it stays there at any width
      const half = d.w / 2;
      const lo = Math.max(best.r.left + half, half + 6);
      const hi = Math.min(best.r.right - half, root.clientWidth - half - 6);
      const cx = hi > lo ? Math.min(Math.max(x, lo), hi) : (best.r.left + best.r.right) / 2;
      const cy = Math.min(Math.max(y, best.r.top), best.r.bottom);
      state[d.id] = { a: best.k, x: +((cx - best.r.left) / best.r.width).toFixed(4), y: +((cy - best.r.top) / best.r.height).toFixed(4), r: Math.round(Math.random() * 30 - 15) };
    }
    save();
    put(d.id, state[d.id]);
    paintReset();
  }
  function end(e, cancelled) {
    if (!drag || e.pointerId !== drag.pid) return;
    const d = drag;
    drag = null;
    clearTimeout(d.timer);
    if (raf) { cancelAnimationFrame(raf); raf = 0; }
    root.classList.remove('kp-dragging');
    d.it.stk.classList.remove('kp-press');
    d.it.stk.style.removeProperty('--tilt');
    if (!d.moved) { if (!cancelled) bounce(d.it.stk, 'kp-boing'); return; }
    if (cancelled) put(d.id, d.from); else drop(d, e.clientX, e.clientY);
    bounce(d.it.stk, 'kp-land');
  }
  addEventListener('pointerup', (e) => end(e, false));
  addEventListener('pointercancel', (e) => end(e, true));
  addEventListener('keydown', (e) => { if (e.key === 'Escape' && drag?.moved) end({ pointerId: drag.pid }, true); });
})();
