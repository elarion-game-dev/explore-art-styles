// 8-bit / NES Pixel Art: the NES seen through a developer's debugger.
// Labels the nametable view of the hero screens and counts their colours, draws the core elements' icons from 2-bit tile data,
// adds a scanline test for the eight-sprites rule, and builds a tile painter that keeps to the console's background rules:
// colours from the 64-entry master palette, four background palettes of three colours plus a shared backdrop, one palette per 16 by 16 block.
(() => {
  const root = document.documentElement;
  const isCalm = () => root.dataset.calm === '1';
  const $ = (q, el = document) => el.querySelector(q);
  const $$ = (q, el = document) => [...el.querySelectorAll(q)];
  const make = (tag, cls, html) => { const e = document.createElement(tag); if (cls) e.className = cls; if (html !== undefined) e.innerHTML = html; return e; };
  const read = (k) => { try { return localStorage.getItem(k); } catch { return null; } };
  const write = (k, v) => { try { localStorage.setItem(k, v); } catch { /* private window */ } };

  // The master palette, 64 entries, with the hex values the hero screenshots on this page use.
  const NES = ('747474 24188C 0000A8 44009C 8C0074 A80010 A40000 7C0800 402C00 004400 005000 003C14 183C5C 000000 000000 000000 '
    + 'BCBCBC 0070EC 2038EC 8000F0 BC00BC E40058 D82800 C84C0C 887000 009400 00A800 009038 008088 000000 000000 000000 '
    + 'FCFCFC 3CBCFC 5C94FC CC88FC F478FC FC74B4 FC7460 FC9838 F0BC3C 80D010 4CDC48 58F898 00E8D8 787878 000000 000000 '
    + 'FCFCFC A8E4FC C4D4FC D4C8FC FCC4FC FCC4D8 FCBCB0 FCD8A8 FCE4A0 E0FCA0 A8F0BC B0FCCC 9CFCF0 C4C4C4 000000 000000').split(' ').map((h) => `#${h}`);
  const RGB = NES.map((h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16)));
  const hx = (n) => `$${n.toString(16).toUpperCase().padStart(2, '0')}`;
  const indexOf = (hex) => {
    const h = String(hex || '').toUpperCase();
    if (h === '#000000') return 0x0F;
    if (h === '#FCFCFC') return 0x30;
    return NES.indexOf(h);
  };
  const same = (a, b) => NES[a] === NES[b];
  const D = { '.': 0, '#': 1, '+': 2, o: 3 };
  const rows = (list) => list.map((r) => [...r].map((c) => D[c]));

  // ---- Window tags: each section's title bar names the palette its trim is drawn from -------------------------------------------------
  const TAGS = { feel: 'BG0', core: 'BG1', how: 'BG2', palette: 'BG3', vibe: 'SPR0', refs: 'SPR1', sources: 'SPR2', related: 'SPR3' };
  for (const [id, tag] of Object.entries(TAGS)) {
    const t = $(`#${id} > .sec-title`);
    if (!t) continue;
    const s = make('span', 'nes-tag', `${tag}<i></i><i></i><i></i><i></i>`);
    s.setAttribute('aria-hidden', 'true');
    t.append(s);
  }

  // ---- Nametable viewer: an address over each screen, and the colours it really uses ----------------------------------------------------
  const ADDR = ['$2000', '$2400', '$2800', '$2C00'];
  $$('.hero-gallery .shot').forEach((fig, n) => {
    const head = make('div', 'nes-cell-head', `<span class="nes-addr">${ADDR[n] || ''}</span><span class="nes-used"></span>`);
    head.setAttribute('aria-hidden', 'true');
    fig.prepend(head);
    const img = $('img', fig);
    if (!img) return;
    const count = () => {
      try {
        const w = img.naturalWidth; const h = img.naturalHeight;
        if (!w || w > 1024 || h > 1024) return;
        const c = document.createElement('canvas');
        c.width = w; c.height = h;
        const x = c.getContext('2d', { willReadFrequently: true });
        x.drawImage(img, 0, 0);
        const d = x.getImageData(0, 0, w, h).data;
        const seen = new Map();
        for (let i = 0; i < d.length; i += 4) { const k = (d[i] << 16) | (d[i + 1] << 8) | d[i + 2]; seen.set(k, (seen.get(k) || 0) + 1); }
        if (seen.size > 48) return; // smoothed or photographic: not a palette worth listing
        const list = [...seen.entries()].sort((a, b) => b[1] - a[1]).map(([k]) => `#${k.toString(16).toUpperCase().padStart(6, '0')}`);
        $('.nes-used', head).innerHTML = `<b>${list.length} colours</b>${list.map((hex) => { const i = indexOf(hex); return `<i style="--c:${hex}" title="${i >= 0 ? `${hx(i)} ` : ''}${hex}"></i>`; }).join('')}`;
      } catch { /* a page opened from disk cannot read image pixels, so the count is left out */ }
    };
    if (img.complete && img.naturalWidth) count(); else img.addEventListener('load', count, { once: true });
  });

  // ---- The page keeps to the palette it teaches --------------------------------------------------------------------------------------------
  $('.foot')?.prepend(make('p', 'nes-foot-note', 'Every colour in this page’s theme is an entry in the NES master palette.'));

  // ---- Links to the painter ---------------------------------------------------------------------------------------------------------------
  // listed right after Palette, the section the painter sits in, so the contents keep to page order
  const painterItem = make('li', null, '<a href="#nes-painter">Tile painter</a>');
  const paletteItem = $('.toc a[href="#palette"]')?.closest('li');
  if (paletteItem) paletteItem.after(painterItem); else $('.toc ul')?.append(painterItem);
  const jump = make('a', 'nes-jump', 'Try the tile painter');
  jump.href = '#nes-painter';
  $('.hero-tagline')?.after(jump);

  // ---- Palette swatches: their index in the master palette, where they have one ------------------------------------------------------------
  for (const b of $$('.swatch button')) {
    const i = indexOf(b.dataset.copy);
    if (i >= 0) $('.chip', b)?.append(make('span', 'nes-idx', hx(i)));
  }

  // ---- Sprites and icons, drawn from 2-bit pixels ---------------------------------------------------------------------------------------------
  /** Draws parts of 2-bit pixels onto a new canvas. Each part has x, y, a palette of three master palette indices, and rows; 0 is transparent unless the part has a backdrop. */
  function sprite(w, h, parts) {
    const c = document.createElement('canvas');
    c.width = w; c.height = h;
    const x = c.getContext('2d');
    for (const p of parts) {
      p.rows.forEach((row, yy) => row.forEach((v, xx) => {
        const n = v ? p.pal[v - 1] : p.bd;
        if (n === undefined || n === null) return;
        x.fillStyle = NES[n];
        x.fillRect(p.x + xx, p.y + yy, 1, 1);
      }));
    }
    return c;
  }
  const PUFF8 = rows(['..oooo..', '.o####o.', 'o######o', 'o####++o', 'o###+++o', 'o++++++o', '.oooooo.', '........']);
  const CRITTER = rows(['..oooo..', '.o####o.', 'o#o##o#o', 'o######o', 'o+####+o', '.o++++o.', '.oo..oo.', '........']);
  const ICONS = [
    // One fixed palette: a corner of the master palette chart
    () => {
      const c = document.createElement('canvas');
      c.width = 16; c.height = 16;
      const x = c.getContext('2d');
      x.fillStyle = '#000000'; x.fillRect(0, 0, 16, 16);
      [0x02, 0x06, 0x09, 0x0C].forEach((col, j) => [0, 1, 2, 3].forEach((r) => { x.fillStyle = NES[r * 16 + col]; x.fillRect(j * 4, r * 4, 3, 3); }));
      return c;
    },
    // One palette per 16 by 16 block: one block, backdrop plus three
    () => sprite(16, 16, [{ x: 0, y: 0, bd: 0x22, pal: [0x30, 0x1A, 0x0F], rows: rows([
      '................', '...oooo.........', '..o####o........', '.o######oo......', 'o##########o....', 'oooooooooooo....', '................', '................',
      '..........oooo..', '........oo++++oo', '......oo++++++++', '....oo++++++++++', '..oo++++++++++++', '.o++++++++++++++', 'o+++++++++++++++', '++++++++++++++++']) }]),
    // Reused 8 by 8 tiles: one tile in two palettes
    () => sprite(16, 16, [{ x: 0, y: 4, pal: [0x30, 0x21, 0x0F], rows: PUFF8 }, { x: 8, y: 4, pal: [0x2A, 0x1A, 0x0F], rows: PUFF8 }]),
    // Sprites in three colours: three colours plus transparency
    () => sprite(16, 16, [{ x: 0, y: 0, pal: [0x2A, 0x1A, 0x0F], rows: rows([
      '................', '......oooo......', '....oo####oo....', '...o########o...', '..o##########o..', '..o##o####o##o..', '..o##o####o##o..', '.o############o.',
      '.o############o.', '.o+##########+o.', '.o++########++o.', 'o++++++++++++++o', 'o++++++++++++++o', '.oooooooooooooo.', '................', '................']) }]),
    // Eight-sprite scanline limit: the ninth is not drawn
    () => {
      const parts = [];
      const line = [];
      for (let x = 0; x < 48; x++) line.push(x % 2 ? 0 : 1);
      parts.push({ x: 0, y: 8, pal: [0x15], rows: [line] });
      for (let k = 0; k < 9; k++) {
        const hole = k === 8;
        parts.push({ x: 1 + k * 5, y: 5, pal: hole ? [0x00, 0x00, 0x00] : [[0x16, 0x12, 0x1A, 0x17][k % 4], 0x0F, 0x0F],
          rows: hole ? rows(['o.o.', '....', 'o..o', '....', '.o.o', '....']).map((r, y) => r.map((v, x) => ((x + y) % 2 ? 0 : v))) : rows(['.oo.', 'o##o', 'o##o', 'o##o', 'o##o', '.oo.']).map((r) => r.map((v) => (v === 3 ? 2 : v))) });
      }
      return sprite(48, 16, parts);
    },
    // Pixel-first character design: a robot drawn pixel by pixel
    () => sprite(16, 16, [{ x: 0, y: 0, pal: [0x31, 0x11, 0x0F], rows: rows([
      '.......oo.......', '.......oo.......', '......o++o......', '..oooooooooooo..', '..o##########o..', '..o#ooo##ooo#o..', '..o#o+o##o+o#o..', '..o#ooo##ooo#o..',
      '..o##########o..', '..o##oooooo##o..', '..o##########o..', '..o++++++++++o..', '..oooooooooooo..', '....o......o....', '...ooo....ooo...', '................']) }]),
  ];
  $$('#core .core-item').forEach((item, n) => {
    const draw = ICONS[n];
    const h = $('h3', item);
    if (!draw || !h) return;
    const c = draw();
    c.className = 'nes-ico';
    c.setAttribute('aria-hidden', 'true');
    c.style.width = `${c.width * 3}px`;
    h.before(c);
  });

  // ---- Scanline test: eight sprites to a line ---------------------------------------------------------------------------------------------------
  const core = $('#core');
  if (core) {
    const SPR_PALS = [[0x30, 0x21, 0x0F], [0x27, 0x17, 0x0F], [0x2A, 0x1A, 0x0F], [0x25, 0x15, 0x0F]];
    const box = make('div', 'nes-oam');
    box.innerHTML = '<h3 class="nes-sub-h">Scanline test</h3>'
      + '<div class="nes-oam-bar"><button class="btn" type="button" data-d="-1" aria-label="One sprite fewer">&minus;</button><output aria-label="Sprites on this line">10</output>'
      + '<button class="btn" type="button" data-d="1" aria-label="One sprite more">+</button><p>sprites on one line</p><button class="btn" type="button" data-frame>Next frame</button></div>'
      + '<div class="nes-line" aria-hidden="true"></div><p class="nes-oam-note" aria-live="polite"></p>';
    core.append(box);
    let n = 10; let f = 0;
    const lineEl = $('.nes-line', box);
    const out = $('output', box);
    const note = $('.nes-oam-note', box);
    const paint = () => {
      out.textContent = String(n);
      const off = new Set();
      if (n > 8) { const start = (f * (n - 8)) % n; for (let k = 0; k < n - 8; k++) off.add((start + 8 + k) % n); }
      lineEl.textContent = '';
      for (let k = 0; k < n; k++) {
        const s = make('div', `nes-spr${off.has(k) ? ' off' : ''}`);
        s.append(sprite(8, 8, [{ x: 0, y: 0, pal: SPR_PALS[k % 4], rows: CRITTER }]));
        s.append(make('b', null, hx(k).slice(1)));
        lineEl.append(s);
      }
      const gone = [...off].sort((a, b) => a - b).map((k) => `#${hx(k).slice(1)}`);
      note.textContent = n <= 8
        ? `Frame ${f + 1}: all ${n} sprites are drawn. Add more than eight to one line and the rest are not drawn.`
        : `Frame ${f + 1}: ${gone.join(' and ').replace(/ and (?=.* and )/g, ', ')} ${gone.length > 1 ? 'are' : 'is'} not drawn. Press Next frame: games rotate which sprites get drawn each frame, which is where NES flicker comes from.`;
    };
    for (const b of $$('[data-d]', box)) b.addEventListener('click', () => { n = Math.max(1, Math.min(16, n + Number(b.dataset.d))); f = 0; paint(); });
    $('[data-frame]', box).addEventListener('click', () => { f += 1; paint(); });
    paint();
  }

  // ---- The tile painter -----------------------------------------------------------------------------------------------------------------------------
  const palSec = $('#palette');
  if (palSec) buildPainter(palSec);

  function buildPainter(sec) {
    const PW = 128; const PH = 96; const BW = PW / 16; const BH = PH / 16; const TW = PW / 8; const TH = PH / 8;
    const KEY = 'eas-nes-painter';
    // The example scene. The cloud and the bush are the same tiles (L, M, R) in two palettes.
    const TILES = {
      L: rows(['................', '................', '................', '......oooo......', '....oo####oo....', '...o########o...', '..o#########+o..', '..o########++o..',
        '.o########+++#oo', '.o##########+###', 'o###############', 'o###############', 'o###############', 'o+++++++++++++++', 'o+++++++++++++++', '.ooooooooooooooo']),
      M: rows(['................', '.....oooooo.....', '...oo######oo...', '..o##########o..', '..o##########o..', '.o###########+o.', '.o##########++o.', '.o#########+++o.',
        'o#########++++#o', '##########++####', '################', '################', '################', '++++++++++++++++', '++++++++++++++++', 'oooooooooooooooo']),
      R: rows(['................', '................', '................', '................', '.....oooo.......', '...oo####oo.....', '..o########o....', '.o#########+o...',
        'o##########++o..', '###########+++o.', '############++o.', '#############+#o', '###############o', '+++++++++++++++o', '+++++++++++++++o', 'ooooooooooooooo.']),
      G: rows(['###############o', '#++++++++++++++o', '#++++++++++++++o', '#++++++++++++++o', '#++++++++++++++o', '#++++++++++++++o', '#++++++++++++++o', 'oooooooooooooooo',
        '#######o########', '+++++++o#+++++++', '+++++++o#+++++++', '+++++++o#+++++++', '+++++++o#+++++++', '+++++++o#+++++++', '+++++++o#+++++++', 'oooooooooooooooo']),
      B: rows(['oooooooooooooooo', 'o##############o', 'o#+##########+#o', 'o##############o', 'o#############+o', 'o#############+o', 'o#############+o', 'o#############+o',
        'o#############+o', 'o#############+o', 'o#############+o', 'o#############+o', 'o#+##########++o', 'o#++++++++++++#o', 'o++++++++++++++o', 'oooooooooooooooo']),
    };
    const MAP = ['........', '.LMR....', '.....LR.', '.BBB....', '....LMR.', 'GGGGGGGG'];
    const MAP_PAL = ['00000000', '00000000', '00000000', '03330000', '00002220', '11111111'];
    const START_PALS = [[0x30, 0x21, 0x0F], [0x36, 0x17, 0x0F], [0x2A, 0x1A, 0x0F], [0x28, 0x18, 0x0F]];
    const START_BD = 0x22;

    const px = new Uint8Array(PW * PH);
    const attr = new Uint8Array(BW * BH);
    let pals = START_PALS.map((p) => p.slice());
    let backdrop = START_BD;
    let brush = { p: 2, i: 1 };
    let tool = 'pen';
    let show8 = true; let show16 = true;
    const undo = [];
    let flash = [];
    let flashTimer = 0;
    let hiKey = null;
    let cursor = { x: 64, y: 48 };
    let stroke = null;

    function loadExample() {
      px.fill(0);
      for (let by = 0; by < BH; by++) {
        for (let bx = 0; bx < BW; bx++) {
          attr[by * BW + bx] = Number(MAP_PAL[by][bx]);
          const t = TILES[MAP[by][bx]];
          if (!t) continue;
          for (let y = 0; y < 16; y++) for (let x = 0; x < 16; x++) px[(by * 16 + y) * PW + bx * 16 + x] = t[y][x];
        }
      }
      pals = START_PALS.map((p) => p.slice());
      backdrop = START_BD;
    }
    function save() {
      write(KEY, JSON.stringify({ v: 1, px: px.join(''), attr: attr.join(''), pals, backdrop }));
    }
    function restore() {
      try {
        const o = JSON.parse(read(KEY) || 'null');
        if (!o || o.v !== 1 || typeof o.px !== 'string' || o.px.length !== PW * PH || typeof o.attr !== 'string' || o.attr.length !== BW * BH) return false;
        if (!/^[0-3]+$/.test(o.px) || !/^[0-3]+$/.test(o.attr)) return false;
        const okN = (v) => Number.isInteger(v) && v >= 0 && v < 64;
        if (!Array.isArray(o.pals) || o.pals.length !== 4 || !o.pals.every((p) => Array.isArray(p) && p.length === 3 && p.every(okN)) || !okN(o.backdrop)) return false;
        for (let i = 0; i < px.length; i++) px[i] = o.px.charCodeAt(i) - 48;
        for (let i = 0; i < attr.length; i++) attr[i] = o.attr.charCodeAt(i) - 48;
        pals = o.pals.map((p) => p.slice());
        backdrop = o.backdrop;
        return true;
      } catch { return false; }
    }

    const colourOf = (x, y) => { const i = px[y * PW + x]; return i ? pals[attr[(y >> 4) * BW + (x >> 4)]][i - 1] : backdrop; };
    const brushColour = () => (brush.i ? pals[brush.p][brush.i - 1] : backdrop);

    /** Paints the brush colour into one pixel. If the pixel's block has no such colour, the block switches to the brush's palette: an attribute clash.
        `region` marks pixels this same action paints, which are not counted as changed by the clash. */
    function put(x, y, region = null) {
      if (x < 0 || y < 0 || x >= PW || y >= PH) return;
      const b = (y >> 4) * BW + (x >> 4);
      const c = brushColour();
      let idx = 0;
      if (brush.i && !same(c, backdrop)) {
        const q = attr[b];
        const j = pals[q].findIndex((v) => same(v, c));
        if (j >= 0) idx = j + 1;
        else {
          const bx = (b % BW) * 16; const by = Math.floor(b / BW) * 16;
          let changed = 0;
          for (let yy = by; yy < by + 16; yy++) {
            for (let xx = bx; xx < bx + 16; xx++) {
              const k = px[yy * PW + xx];
              if (k && !(xx === x && yy === y) && !(region && region[yy * PW + xx]) && !same(pals[q][k - 1], pals[brush.p][k - 1])) changed++;
            }
          }
          const prev = stroke.switched.get(b);
          stroke.switched.set(b, { from: prev ? prev.from : q, changed: (prev ? prev.changed : 0) + changed });
          attr[b] = brush.p;
          idx = brush.i;
        }
      }
      if (px[y * PW + x] !== idx || stroke.switched.has(b)) stroke.painted += 1;
      px[y * PW + x] = idx;
    }
    function lineTo(a, b) {
      let [x0, y0] = a; const [x1, y1] = b;
      const dx = Math.abs(x1 - x0); const sx = x0 < x1 ? 1 : -1; const dy = -Math.abs(y1 - y0); const sy = y0 < y1 ? 1 : -1;
      let err = dx + dy;
      for (;;) {
        put(x0, y0);
        if (x0 === x1 && y0 === y1) break;
        const e2 = 2 * err;
        if (e2 >= dy) { err += dy; x0 += sx; }
        if (e2 <= dx) { err += dx; y0 += sy; }
      }
    }
    function fillAt(x0, y0) {
      const target = NES[colourOf(x0, y0)];
      if (target === NES[brushColour()]) return 0;
      const seen = new Uint8Array(PW * PH);
      const cells = [];
      const stack = [x0 + y0 * PW];
      while (stack.length) {
        const k = stack.pop();
        if (seen[k]) continue;
        seen[k] = 1;
        const x = k % PW; const y = (k - x) / PW;
        if (NES[colourOf(x, y)] !== target) continue;
        cells.push(k);
        if (x > 0) stack.push(k - 1);
        if (x < PW - 1) stack.push(k + 1);
        if (y > 0) stack.push(k - PW);
        if (y < PH - 1) stack.push(k + PW);
      }
      const region = new Uint8Array(PW * PH);
      for (const k of cells) region[k] = 1;
      for (const k of cells) put(k % PW, Math.floor(k / PW), region);
      return cells.length;
    }
    function snapshot() { return { px: px.slice(), attr: attr.slice(), pals: pals.map((p) => p.slice()), backdrop }; }
    function begin() {
      undo.push(snapshot());
      if (undo.length > 50) undo.shift();
      stroke = { switched: new Map(), painted: 0, quiet: false };
      if (hiKey) { hiKey = null; tip.textContent = ''; }
    }
    function end() {
      if (!stroke) return;
      const s = stroke;
      stroke = null;
      if (s.switched.size) {
        const list = [...s.switched.entries()];
        const changed = list.reduce((a, [, v]) => a + v.changed, 0);
        flash = list.map(([b]) => b);
        clearTimeout(flashTimer);
        if (!isCalm()) flashTimer = setTimeout(() => { flash = []; queue(); }, 1800);
        const c = hx(brushColour());
        const where = list.length === 1 ? `Block ${list[0][0] % BW},${Math.floor(list[0][0] / BW)}` : `${list.length} blocks`;
        if (!changed) {
          // nothing visible happened: the block held only backdrop pixels, or colours both palettes share
          say(`${where} switched to BG${brush.p} to get ${c}. Nothing else changed colour, because ${list.length === 1 ? 'it' : 'they'} held only the backdrop or colours both palettes share.`);
        } else if (list.length === 1) {
          say(`Clash. ${where} had no ${c} in BG${list[0][1].from}, so it switched to BG${brush.p}, and ${changed} of its other pixels changed colour with it. A 16×16 block can use only one palette.`, true);
        } else {
          say(`Clash. ${where} switched to BG${brush.p} to get ${c}, and ${changed} of their other pixels changed colour with them. A 16×16 block can use only one palette.`, true);
        }
      } else if (s.painted) {
        say(brush.i ? `Painted ${hx(brushColour())}. Each block it touched already had that colour in its palette, so nothing else changed.` : 'Painted the backdrop colour, which every palette shares.');
      } else if (!s.quiet) {
        say(`Nothing changed: that pixel already shows ${hx(brushColour())}.`);
      }
      save();
      renderChr();
      queue();
    }
    function undoOnce() {
      const s = undo.pop();
      if (!s) { say('Nothing to undo.'); return; }
      px.set(s.px); attr.set(s.attr); pals = s.pals; backdrop = s.backdrop;
      flash = [];
      save(); renderChr(); paintUi(); queue();
      say('Undone.');
    }

    // ---- markup
    const box = make('div', 'nes-ppu');
    box.id = 'nes-painter';
    box.innerHTML = `
      <div class="nes-ppu-head"><h3>Tile painter</h3><span>${PW} × ${PH} px · ${BW * BH} blocks of 16×16</span></div>
      <p class="nes-help">Pick a colour from one of the four background palettes and paint. Each 16×16 block shows one palette, so a colour that block lacks switches the whole block to the palette you painted from. Click the master palette to change the selected colour. The cloud and the bush are the same tiles in two palettes.</p>
      <div class="nes-ppu-main">
        <div class="nes-left">
          <div class="nes-canvas-wrap"><canvas class="nes-canvas" tabindex="0" aria-label="Painting canvas, ${PW} by ${PH} pixels. Arrow keys move, Space paints, Shift moves eight pixels."></canvas></div>
          <p class="nes-readout" aria-hidden="true"></p>
          <div class="nes-tools" role="toolbar" aria-label="Painter tools">
            <button type="button" data-tool="pen" aria-pressed="true">Pencil</button><button type="button" data-tool="fill" aria-pressed="false">Fill</button>
            <button type="button" data-act="undo">Undo</button><button type="button" data-act="example">Example</button><button type="button" data-act="clear">Clear</button>
            <label><input type="checkbox" data-grid="8" checked>8×8</label><label><input type="checkbox" data-grid="16" checked>16×16</label>
            <button type="button" data-act="png">Save PNG</button>
          </div>
          <p class="nes-status" aria-live="polite"></p>
        </div>
        <div class="nes-right">
          <div><h4 class="nes-h">Background palettes <span>$3F00–$3F0F</span></h4><div class="nes-pals"></div></div>
          <p class="nes-brush"></p>
          <div class="nes-master"><h4>Master palette <span>64 entries</span></h4><div class="nes-chart"></div><p class="nes-pick" aria-live="polite"></p></div>
        </div>
      </div>
      <div class="nes-chr"><h4>Pattern table <span class="nes-chr-count"></span></h4><div class="nes-chr-wrap"><canvas aria-label="The pattern table: the unique 8×8 tiles in the painting, out of 256 places"></canvas></div><p class="nes-chr-note">Every tile the painting uses, stored once. Tiles hold 2-bit pixels, not colours, so they show here in four greys; each block's palette colours them on screen. Point at a tile, or tap it, to see everywhere it is used.</p><p class="nes-chr-tip" aria-live="polite"></p></div>`;
    (sec.querySelector('.palette-actions') || sec.lastElementChild).after(box);

    const view = $('.nes-canvas', box);
    const wrap = $('.nes-canvas-wrap', box);
    const left = $('.nes-left', box);
    const statusEl = $('.nes-status', box);
    const readout = $('.nes-readout', box);
    const brushEl = $('.nes-brush', box);
    const pick = $('.nes-pick', box);
    const chrCanvas = $('.nes-chr canvas', box);
    const chrCount = $('.nes-chr-count', box);
    const tip = $('.nes-chr-tip', box);
    const say = (msg, clash = false) => { statusEl.textContent = msg; statusEl.classList.toggle('is-clash', clash); };

    // palettes
    const palsBox = $('.nes-pals', box);
    for (let p = 0; p < 4; p++) {
      const row = make('div', 'nes-pal');
      row.dataset.p = p;
      row.append(make('span', 'nes-pal-name', `BG${p}`));
      for (let i = 0; i < 4; i++) {
        const b = make('button', `nes-slot${i ? '' : ' is-bd'}`);
        b.type = 'button';
        b.dataset.p = p; b.dataset.i = i;
        b.addEventListener('click', () => { brush = { p, i }; paintUi(); });
        row.append(b);
      }
      palsBox.append(row);
    }
    // master palette chart
    const chart = $('.nes-chart', box);
    const narrow = matchMedia('(max-width: 560px)');
    function buildChart() {
      chart.textContent = '';
      const halves = narrow.matches ? [[0, 8], [8, 16]] : [[0, 16]];
      chart.style.setProperty('--cols', String(halves[0][1] - halves[0][0]));
      for (const [c0, c1] of halves) {
        chart.append(make('span', null, ''));
        for (let c = c0; c < c1; c++) chart.append(make('span', null, c.toString(16).toUpperCase()));
        for (let r = 0; r < 4; r++) {
          chart.append(make('span', null, `${r}x`));
          for (let c = c0; c < c1; c++) {
            const n = r * 16 + c;
            const b = make('button');
            b.type = 'button';
            b.dataset.n = n;
            b.style.setProperty('--c', NES[n]);
            b.title = `${hx(n)} ${NES[n]}`;
            b.setAttribute('aria-label', `Master palette ${hx(n)}, ${NES[n]}`);
            b.addEventListener('mouseenter', () => { pick.textContent = `${hx(n)}  ${NES[n]}`; });
            b.addEventListener('focus', () => { pick.textContent = `${hx(n)}  ${NES[n]}`; });
            b.addEventListener('click', () => setColour(n));
            chart.append(b);
          }
        }
      }
    }
    buildChart();
    narrow.addEventListener('change', () => { buildChart(); paintUi(); });
    chart.addEventListener('mouseleave', () => { pick.textContent = ''; });

    function setColour(n) {
      undo.push(snapshot());
      if (brush.i === 0) {
        backdrop = n;
        say(`The backdrop is now ${hx(n)}. All four palettes share it, so it changed everywhere at once.`);
      } else {
        pals[brush.p][brush.i - 1] = n;
        let blocks = 0;
        for (let b = 0; b < attr.length; b++) {
          if (attr[b] !== brush.p) continue;
          const bx = (b % BW) * 16; const by = Math.floor(b / BW) * 16;
          let uses = false;
          for (let y = by; y < by + 16 && !uses; y++) for (let x = bx; x < bx + 16; x++) if (px[y * PW + x] === brush.i) { uses = true; break; }
          if (uses) blocks += 1;
        }
        say(`BG${brush.p} colour ${brush.i} is now ${hx(n)}. ${blocks ? `${blocks === 1 ? 'The block' : `All ${blocks} blocks`} using it changed together: a palette swap.` : 'No block uses it yet.'}`);
      }
      save(); paintUi(); queue();
    }
    function paintUi() {
      $$('.nes-pal', palsBox).forEach((row) => row.classList.toggle('on', Number(row.dataset.p) === brush.p && brush.i > 0));
      for (const b of $$('.nes-slot', palsBox)) {
        const p = Number(b.dataset.p); const i = Number(b.dataset.i);
        const n = i ? pals[p][i - 1] : backdrop;
        b.style.setProperty('--c', NES[n]);
        b.title = i ? `BG${p} colour ${i}: ${hx(n)} ${NES[n]}` : `Backdrop, shared by every palette: ${hx(n)} ${NES[n]}`;
        b.setAttribute('aria-label', b.title);
        b.setAttribute('aria-pressed', String(p === brush.p && i === brush.i));
      }
      const n = brushColour();
      brushEl.innerHTML = `<i style="--c:${NES[n]}"></i>${brush.i ? `Painting with BG${brush.p} colour ${brush.i}` : 'Painting with the backdrop'}: ${hx(n)} ${NES[n]}`;
      for (const b of $$('button', chart)) b.classList.toggle('on', Number(b.dataset.n) === n);
    }

    // tools
    for (const b of $$('[data-tool]', box)) {
      b.addEventListener('click', () => {
        tool = b.dataset.tool;
        $$('[data-tool]', box).forEach((t) => t.setAttribute('aria-pressed', String(t === b)));
        say(tool === 'fill' ? 'Fill paints every connected pixel of the colour you click, block by block.' : 'Pencil paints one pixel at a time.');
      });
    }
    $('[data-act="undo"]', box).addEventListener('click', undoOnce);
    $('[data-act="example"]', box).addEventListener('click', () => { undo.push(snapshot()); loadExample(); flash = []; save(); renderChr(); paintUi(); queue(); say('The example is back: 18 tiles, and the cloud and the bush share theirs.'); });
    $('[data-act="clear"]', box).addEventListener('click', () => { undo.push(snapshot()); px.fill(0); attr.fill(0); flash = []; save(); renderChr(); queue(); say('Cleared. Every block starts on BG0.'); });
    $('[data-act="png"]', box).addEventListener('click', () => {
      buf.toBlob((blob) => {
        if (!blob) return;
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = 'nes-tiles.png';
        a.click();
        setTimeout(() => URL.revokeObjectURL(a.href), 2000);
      });
    });
    for (const c of $$('[data-grid]', box)) {
      c.addEventListener('change', () => { if (c.dataset.grid === '8') show8 = c.checked; else show16 = c.checked; queue(); });
    }

    // drawing
    const buf = document.createElement('canvas');
    buf.width = PW; buf.height = PH;
    const bctx = buf.getContext('2d');
    const img = bctx.createImageData(PW, PH);
    const vctx = view.getContext('2d');
    let P = 4;
    let raf = 0;
    const queue = () => { if (!raf) raf = requestAnimationFrame(() => { raf = 0; draw(); }); };
    function fit() {
      const r = window.devicePixelRatio || 1;
      const avail = Math.max(128, Math.min(512, left.clientWidth - 8));
      // Ordinary screens get a whole number of pixels per NES pixel. Dense screens fill the space, where a pixel one device pixel wider than the next is invisible.
      const css = r >= 2 ? Math.floor(avail) : PW * Math.max(1, Math.floor(avail / PW));
      const w = Math.round(css * r); const h = Math.round(((css * PH) / PW) * r);
      if (view.width !== w || view.height !== h) { view.width = w; view.height = h; }
      P = w / PW;
      view.style.width = `${w / r}px`;
      view.style.height = `${h / r}px`;
      draw();
      renderChr();
    }
    function draw() {
      const d = img.data;
      for (let y = 0; y < PH; y++) {
        for (let x = 0; x < PW; x++) {
          const c = RGB[colourOf(x, y)]; const o = (y * PW + x) * 4;
          d[o] = c[0]; d[o + 1] = c[1]; d[o + 2] = c[2]; d[o + 3] = 255;
        }
      }
      bctx.putImageData(img, 0, 0);
      vctx.imageSmoothingEnabled = false;
      vctx.drawImage(buf, 0, 0, view.width, view.height);
      const W = view.width; const H = view.height;
      const X = (v) => Math.round(v * P);
      const thin = Math.max(1, Math.round((window.devicePixelRatio || 1)));
      if (show8) {
        // the tile grid, dotted in solid black so it stays light without leaving the palette
        vctx.fillStyle = '#000000';
        const gap = thin * 3;
        for (let x = 8; x < PW; x += 8) if (!(show16 && x % 16 === 0)) for (let y = 0; y < H; y += gap) vctx.fillRect(X(x), y, thin, thin);
        for (let y = 8; y < PH; y += 8) if (!(show16 && y % 16 === 0)) for (let x = 0; x < W; x += gap) vctx.fillRect(x, X(y), thin, thin);
      }
      if (show16) {
        // the attribute grid, dashed black and white so it shows on any colour
        const t = thin * 2; const dash = Math.max(4, Math.round(P * 2));
        for (let x = 16; x < PW; x += 16) for (let y = 0; y < H; y += dash) { vctx.fillStyle = (y / dash) % 2 ? '#FCFCFC' : '#000000'; vctx.fillRect(X(x) - thin, y, t, dash); }
        for (let y = 16; y < PH; y += 16) for (let x = 0; x < W; x += dash) { vctx.fillStyle = (x / dash) % 2 ? '#FCFCFC' : '#000000'; vctx.fillRect(x, X(y) - thin, dash, t); }
      }
      const frame = (x, y, w, h, outer, inner, t) => {
        vctx.fillStyle = outer;
        vctx.fillRect(x, y, w, t); vctx.fillRect(x, y + h - t, w, t); vctx.fillRect(x, y, t, h); vctx.fillRect(x + w - t, y, t, h);
        vctx.fillStyle = inner;
        vctx.fillRect(x + t, y + t, w - 2 * t, t); vctx.fillRect(x + t, y + h - 2 * t, w - 2 * t, t); vctx.fillRect(x + t, y + t, t, h - 2 * t); vctx.fillRect(x + w - 2 * t, y + t, t, h - 2 * t);
      };
      const t3 = Math.max(2, Math.round(P / 2));
      const box16 = (bx, by, n) => [X(bx), X(by), X(bx + n) - X(bx), X(by + n) - X(by)];
      for (const b of flash) frame(...box16((b % BW) * 16, Math.floor(b / BW) * 16, 16), '#E40058', '#FCFCFC', t3);
      const ht = hiKey && chrTiles.find((c) => c.key === hiKey);
      if (ht) for (const [tx, ty] of ht.uses) frame(...box16(tx * 8, ty * 8, 8), '#F0BC3C', '#000000', Math.max(1, Math.round(P / 3)));
      if (document.activeElement === view && view.matches(':focus-visible')) { const [cx, cy, cw, ch] = box16(cursor.x, cursor.y, 1); frame(cx - thin, cy - thin, cw + 2 * thin, ch + 2 * thin, '#FCFCFC', '#000000', thin); }
    }

    // pattern table
    let chrTiles = [];
    let chrS = 3;
    function renderChr() {
      const map = new Map();
      chrTiles = [];
      for (let ty = 0; ty < TH; ty++) {
        for (let tx = 0; tx < TW; tx++) {
          let key = '';
          for (let y = 0; y < 8; y++) for (let x = 0; x < 8; x++) key += px[(ty * 8 + y) * PW + tx * 8 + x];
          let t = map.get(key);
          if (!t) { t = { key, uses: [] }; map.set(key, t); chrTiles.push(t); }
          t.uses.push([tx, ty]);
        }
      }
      chrCount.textContent = `${chrTiles.length} ${chrTiles.length === 1 ? 'tile' : 'tiles'} used, of the 256 a pattern table holds`;
      const r = window.devicePixelRatio || 1;
      const availCss = Math.max(160, ($('.nes-chr', box).clientWidth || 400) - 4);
      chrS = availCss >= 16 * 24 + 17 + 320 ? 3 : availCss >= 16 * 16 + 17 ? 2 : 1;
      // all 256 places of the table, 16 by 16, with whole device pixels per tile pixel so the tiles stay sharp at any zoom
      const g = Math.max(1, Math.floor(r));
      const T = 8 * Math.max(1, Math.floor(chrS * r));
      const cols = 16; const rowsN = 16;
      chrCanvas.width = cols * T + (cols + 1) * g;
      chrCanvas.height = rowsN * T + (rowsN + 1) * g;
      chrCanvas.style.width = `${chrCanvas.width / r}px`;
      const x = chrCanvas.getContext('2d');
      x.fillStyle = '#24188C';
      x.fillRect(0, 0, chrCanvas.width, chrCanvas.height);
      x.fillStyle = '#000000';
      for (let n = chrTiles.length; n < 256; n++) x.fillRect(g + (n % cols) * (T + g), g + Math.floor(n / cols) * (T + g), T, T);
      const grey = ['#000000', '#747474', '#BCBCBC', '#FCFCFC'];
      const s = T / 8;
      chrTiles.forEach((t, n) => {
        const ox = g + (n % cols) * (T + g); const oy = g + Math.floor(n / cols) * (T + g);
        for (let k = 0; k < 64; k++) { x.fillStyle = grey[t.key.charCodeAt(k) - 48]; x.fillRect(ox + (k % 8) * s, oy + Math.floor(k / 8) * s, s, s); }
        if (hiKey === t.key) { x.fillStyle = '#F0BC3C'; x.fillRect(ox - g, oy - g, T + 2 * g, g); x.fillRect(ox - g, oy + T, T + 2 * g, g); x.fillRect(ox - g, oy, g, T); x.fillRect(ox + T, oy, g, T); }
      });
      chrCanvas.dataset.t = T; chrCanvas.dataset.g = g;
    }
    function tileAt(e) {
      const rc = chrCanvas.getBoundingClientRect();
      const sx = chrCanvas.width / rc.width;
      const T = Number(chrCanvas.dataset.t); const g = Number(chrCanvas.dataset.g);
      const x = (e.clientX - rc.left) * sx; const y = (e.clientY - rc.top) * sx;
      const col = Math.floor((x - g) / (T + g)); const row = Math.floor((y - g) / (T + g));
      if (col < 0 || col > 15 || row < 0) return null;
      return chrTiles[row * 16 + col] || null;
    }
    const showTile = (t) => {
      const key = t ? t.key : null;
      if (key === hiKey) return;
      hiKey = key;
      const n = t ? chrTiles.indexOf(t) : -1;
      renderChr(); queue();
      tip.textContent = t ? `Tile ${hx(n)} is used ${t.uses.length} ${t.uses.length === 1 ? 'time' : 'times'} in this painting.` : '';
    };
    chrCanvas.addEventListener('pointermove', (e) => showTile(tileAt(e)));
    chrCanvas.addEventListener('pointerdown', (e) => showTile(tileAt(e)));
    chrCanvas.addEventListener('pointerleave', (e) => { if (e.pointerType === 'mouse') showTile(null); });

    // painting with a pointer
    let down = false;
    let last = null;
    const at = (e) => {
      const rc = view.getBoundingClientRect();
      return [Math.min(PW - 1, Math.max(0, Math.floor(((e.clientX - rc.left) / rc.width) * PW))), Math.min(PH - 1, Math.max(0, Math.floor(((e.clientY - rc.top) / rc.height) * PH)))];
    };
    const tell = (x, y) => {
      const b = (y >> 4) * BW + (x >> 4);
      readout.textContent = `X ${String(x).padStart(3)}  Y ${String(y).padStart(2)}   tile ${x >> 3},${y >> 3}   block ${x >> 4},${y >> 4}: BG${attr[b]}   ${hx(colourOf(x, y))}`;
    };
    view.addEventListener('pointerdown', (e) => {
      if (e.button !== 0) return;
      e.preventDefault();
      if (e.pointerType === 'mouse') view.focus({ preventScroll: true });
      const [x, y] = at(e);
      cursor = { x, y };
      begin();
      if (tool === 'fill') {
        const n = fillAt(x, y);
        if (!n) { say('That area is already this colour.'); stroke.quiet = true; }
        end();
        return;
      }
      down = true;
      last = [x, y];
      try { view.setPointerCapture(e.pointerId); } catch { /* capture is optional */ }
      put(x, y);
      queue();
    });
    view.addEventListener('pointermove', (e) => {
      const [x, y] = at(e);
      tell(x, y);
      if (!down) return;
      lineTo(last, [x, y]);
      last = [x, y];
      queue();
    });
    const stop = () => { if (!down) return; down = false; end(); };
    view.addEventListener('pointerup', stop);
    view.addEventListener('pointercancel', stop);
    view.addEventListener('lostpointercapture', stop);
    view.addEventListener('pointerleave', () => { if (!down) readout.textContent = ''; });

    // painting with the keyboard; arrow keys stay here instead of changing style
    view.addEventListener('keydown', (e) => {
      const k = e.key;
      const step = e.shiftKey ? 8 : 1;
      const moves = { ArrowLeft: [-step, 0], ArrowRight: [step, 0], ArrowUp: [0, -step], ArrowDown: [0, step] };
      if (moves[k]) {
        e.preventDefault(); e.stopPropagation();
        cursor = { x: Math.min(PW - 1, Math.max(0, cursor.x + moves[k][0])), y: Math.min(PH - 1, Math.max(0, cursor.y + moves[k][1])) };
        tell(cursor.x, cursor.y);
        queue();
      } else if (k === ' ' || k === 'Enter') {
        e.preventDefault(); e.stopPropagation();
        begin();
        if (tool === 'fill') fillAt(cursor.x, cursor.y); else put(cursor.x, cursor.y);
        end();
        tell(cursor.x, cursor.y);
      } else if ((e.ctrlKey || e.metaKey) && k.toLowerCase() === 'z') {
        e.preventDefault(); e.stopPropagation();
        undoOnce();
      }
    });
    view.addEventListener('focus', queue);
    view.addEventListener('blur', queue);

    addEventListener('eas:calm', () => { clearTimeout(flashTimer); if (!isCalm() && flash.length) flashTimer = setTimeout(() => { flash = []; queue(); }, 1800); queue(); });

    const back = restore();
    if (!back) loadExample();
    paintUi();
    if ('ResizeObserver' in window) new ResizeObserver(() => fit()).observe(left); else addEventListener('resize', fit);
    fit();
    say(back ? 'Your last painting is back. Example brings back the original scene.' : 'The example uses 18 tiles: the cloud and the bush are the same tiles in two palettes. Paint green into the cloud and watch its whole block change.');
  }
})();
