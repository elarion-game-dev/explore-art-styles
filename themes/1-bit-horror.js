// 1-bit Horror: a working MacPaint session on a haunted desktop.
// - Tools and MacPaint's own 38 fill patterns. Painted strokes invert what is under them.
// - The desktop is a live Bayer-dithered spiral that starts as plain 50% grey and grows as you scroll.
// - Images that aren't natively 1-bit at their display size go through Atkinson's dither until hovered.
(() => {
  const root = document.documentElement;
  const $ = (q, el = document) => el.querySelector(q);
  const $$ = (q, el = document) => [...el.querySelectorAll(q)];
  const isCalm = () => root.dataset.calm === '1';

  // The patterns as they appear in MacPaint's palette: 8 bytes each, one bit per pixel.
  const PATTERNS = ['ffffffffffffffff', 'ffddff77ffddff77', '77dd77dd77dd77dd', '55aa55aa55aa55aa', 'ff55ff55ff55ff55', 'aaaaaaaaaaaaaaaa', '77eeddbb77eeddbb', '8888888888888888', '8db130031bd8c00c', '0480100220010840', '88ff888888ff8888', '08ff808080ff0808', '0080000000000000', '0080402000020408', '0182443944820101', '71f87422478f1722', '0455a04040550a04', '0220508888888805', 'b0bf00bfbfb0b0b0', '0000000000000000', '0080000800800008', '0088002200880022', '2288228822882288', '00aa00aa00aa00aa', '00ff00ff00ff00ff', '8811224488112244', '00ff000000ff0000', '8001020408102040', '00aa008000880080', '80ff808080808080', '04081c22c1800102', '00881422418800aa', '0040a00000040a00', '01038448300c0201', 'e38080413e080814', '08102054aaff0204', 'f877898f8f7798f8', '080008142a552a14'];
  const rowsOf = (hex) => Array.from({ length: 8 }, (_, i) => parseInt(hex.slice(i * 2, i * 2 + 2), 16));

  const svgUrl = (w, h, parts) => `url("data:image/svg+xml,${encodeURIComponent(`<svg xmlns='http://www.w3.org/2000/svg' width='${w}' height='${h}' shape-rendering='crispEdges'>${parts}</svg>`)}")`;
  const tileUrl = (hex, s = 2) => {
    let d = '';
    rowsOf(hex).forEach((byte, y) => { for (let x = 0; x < 8; x++) if (byte & (128 >> x)) d += `M${x * s} ${y * s}h${s}v${s}h-${s}z`; });
    return svgUrl(8 * s, 8 * s, `<path d='${d}'/>`);
  };
  // Turns rows of '#' (ink) and 'o' (paper) into SVG paths.
  const bitmapPaths = (rows, s) => {
    let ink = '';
    let paper = '';
    rows.forEach((row, y) => {
      [...row].forEach((c, x) => {
        const r = `M${x * s} ${y * s}h${s}v${s}h-${s}z`;
        if (c === '#') ink += r;
        if (c === 'o') paper += r;
      });
    });
    return { ink, paper, w: rows[0].length * s, h: rows.length * s };
  };
  const cursorUrl = (rows, s = 2) => {
    const b = bitmapPaths(rows, s);
    return svgUrl(b.w, b.h, `<path fill='#fff' d='${b.paper}'/><path fill='#000' d='${b.ink}'/>`);
  };
  const iconSvg = (rows, s = 2) => {
    const b = bitmapPaths(rows, s);
    return `<svg width="${b.w}" height="${b.h}" viewBox="0 0 ${b.w} ${b.h}" shape-rendering="crispEdges" aria-hidden="true"><path fill="currentColor" d="${b.ink}"/></svg>`;
  };

  const ARROW = ['#..........', '##.........', '#o#........', '#oo#.......', '#ooo#......', '#oooo#.....', '#ooooo#....', '#oooooo#...', '#ooooooo#..', '#oooooooo#.', '#ooooo#####', '#oo#oo#....', '#o#.#oo#...', '##..#oo#...', '#....#oo#..', '.....###...'];
  const HAND = ['.....##.........', '....#oo#........', '....#oo#........', '....#oo#........', '....#oo###......', '....#oo#oo###...', '....#oo#oo#oo##.', '.##.#oo#oo#oo#o#', '#oo##oooooooo#o#', '#ooo#oooooooooo#', '.#oo#oooooooooo#', '..#oooooooooooo#', '..#ooooooooooo#.', '...#oooooooooo#.', '....#ooooooooo#.', '....#oooooooo#..', '.....#ooooooo#..', '.....#########..'];
  root.style.setProperty('--arrow', `${cursorUrl(ARROW)} 0 0, auto`);
  root.style.setProperty('--hand', `${cursorUrl(HAND)} 12 0, pointer`);

  const ICONS = {
    hand: ['.....##.......', '....#..#......', '....#..#......', '....#..###....', '....#..#..##..', '.##.#..#..#.#.', '#..##.....#.#.', '#...#........#', '.#...........#', '..#..........#', '..#.........#.', '...#........#.', '....#.......#.', '....#########.'],
    pencil: ['..........##..', '.........#..#.', '........#.#..#', '.......#.#.#.#', '......#.#.#.#.', '.....#.#.#.#..', '....#.#.#.#...', '...#.#.#.#....', '..#.#.#.#.....', '..##.#.#......', '.#..#.#.......', '.#...#........', '#..##.........', '###...........'],
    brush: ['..........###.', '.........#..#.', '........#..#..', '.......#..#...', '......#..#....', '.....#..#.....', '....####......', '...#..#.......', '..#...#.......', '.#...#........', '.#..#.........', '#.##..........', '####..........', '..............'],
    spray: ['....##..#.#.#.', '...####...#...', '...#..#.#.#.#.', '..######..#...', '..#....#..#.#.', '..#....#......', '..#.##.#......', '..#.##.#......', '..#....#......', '..#....#......', '..#....#......', '..#....#......', '..#....#......', '..######......'],
    spiral: ['...######.....', '..#......##...', '.#..####...#..', '#..#....#...#.', '#.#..##..#..#.', '#.#.#..#.#..#.', '#.#.#.##.#..#.', '#.#.#....#..#.', '#.#..####..#..', '#..#......#...', '.#..######....', '..##..........', '....#####.....', '..............'],
    eraser: ['..............', '......#######.', '.....#.....##.', '....#.....#.#.', '...#.....#..#.', '..#.....#...#.', '.#######....#.', '.#.....#...#..', '.#.....#..#...', '.#.....#.#....', '.#.....##.....', '.#######......', '..............', '..............'],
  };
  const BOMB = ['..........#.....', '........#...#...', '.......#.#......', '......##........', '....######......', '...########.....', '..##########....', '..##.#######....', '..#.########....', '..#.########....', '..##########....', '..##########....', '...########.....', '....######......', '................', '................'];

  // ---------------------------------------------------------------- the paint palette
  const TOOLS = [
    ['hand', 'Hand: just read the page'],
    ['pencil', 'Pencil'],
    ['brush', 'Brush, using the current pattern'],
    ['spray', 'Spray can'],
    ['spiral', 'Spiral: press and drag outward'],
    ['eraser', 'Eraser: double-click to wipe the page'],
  ];
  const pal = document.createElement('aside');
  pal.className = 'bh-palette';
  pal.setAttribute('aria-label', 'Paint on this page');
  pal.innerHTML = `<div class="bh-bar">Tools</div><div class="bh-tools">${TOOLS.map(([id, label]) => `<button class="bh-tool" type="button" data-tool="${id}" title="${label}" aria-label="${label}" aria-pressed="${id === 'hand'}">${iconSvg(ICONS[id])}</button>`).join('')}</div><div class="bh-pats">${PATTERNS.map((p, i) => `<button class="bh-pat" type="button" data-pat="${i}" title="Pattern ${i + 1} of 38" aria-label="Fill pattern ${i + 1}" aria-pressed="false" style="background-image:${tileUrl(p, 1).replaceAll('"', '&quot;')}"></button>`).join('')}</div>`;
  document.body.append(pal);
  const palToggle = document.createElement('button');
  palToggle.className = 'bh-pal-toggle';
  palToggle.type = 'button';
  palToggle.textContent = 'Paint';
  palToggle.setAttribute('aria-expanded', 'false');
  document.body.append(palToggle);
  palToggle.addEventListener('click', () => {
    const open = pal.classList.toggle('is-open');
    palToggle.setAttribute('aria-expanded', String(open));
    palToggle.textContent = open ? 'Close' : 'Paint';
  });

  // Before anyone picks a pattern, the title is a dithered ramp from solid ink at the top to paper-thin at the base.
  const rampUrl = () => {
    const c = document.createElement('canvas');
    c.width = 8;
    c.height = 96;
    const x = c.getContext('2d');
    const B = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5];
    x.fillStyle = '#000';
    for (let row = 0; row < 96; row++) {
      for (let col = 0; col < 8; col++) {
        const dark = 1.3 - (row - 10) / 70 * 1.15;
        if (dark > (B[(row & 3) * 4 + (col & 3)] + .5) / 16) x.fillRect(col, row, 1, 1);
      }
    }
    return `url("${c.toDataURL()}")`;
  };
  let patIndex = 2;
  const setPattern = (i) => {
    patIndex = i;
    root.style.setProperty('--pat', tileUrl(PATTERNS[i]));
    root.style.setProperty('--title-fill', 'var(--pat)');
    $$('.bh-pat', pal).forEach((b, n) => b.setAttribute('aria-pressed', String(n === i)));
    brushPattern = null;
  };
  $$('.bh-pat', pal).forEach((b) => b.addEventListener('click', () => setPattern(Number(b.dataset.pat))));

  // ---------------------------------------------------------------- the paint layer
  // Canvas tiles appear only where someone has painted, so a long page costs nothing until then.
  const layer = document.createElement('div');
  layer.className = 'bh-paint';
  document.body.append(layer);
  const TILE = 1024;
  const tiles = new Map();
  // The layer has no height until a paint tool is picked, so it can never stretch the page.
  const sizeLayer = () => {
    layer.style.height = '0';
    layer.style.height = `${root.scrollHeight}px`;
  };
  const tileAt = (index) => {
    if (!tiles.has(index)) {
      const c = document.createElement('canvas');
      c.width = layer.clientWidth;
      c.height = TILE;
      c.style.top = `${index * TILE}px`;
      layer.append(c);
      tiles.set(index, c.getContext('2d'));
    }
    return tiles.get(index);
  };
  let brushPattern = null;
  const getBrushPattern = () => {
    if (brushPattern) return brushPattern;
    const c = document.createElement('canvas');
    c.width = 16;
    c.height = 16;
    const x = c.getContext('2d');
    x.fillStyle = '#fff';
    rowsOf(PATTERNS[patIndex]).forEach((byte, row) => { for (let col = 0; col < 8; col++) if (byte & (128 >> col)) x.fillRect(col * 2, row * 2, 2, 2); });
    brushPattern = x.createPattern(c, 'repeat');
    return brushPattern;
  };
  // Draws axis-aligned spans, split across canvas tiles, so strokes stay hard-edged 1-bit.
  const span = (x, y, w, h, style) => {
    x = Math.round(x);
    y = Math.round(y);
    const first = Math.floor(y / TILE);
    const last = Math.floor((y + h - 1) / TILE);
    for (let i = first; i <= last; i++) {
      const ctx = tileAt(i);
      if (style === 'clear') ctx.clearRect(x, y - i * TILE, w, h);
      else { ctx.fillStyle = style; ctx.fillRect(x, y - i * TILE, w, h); }
    }
  };
  const disc = (cx, cy, r, style) => {
    for (let dy = -r; dy < r; dy += 2) {
      const half = Math.floor(Math.sqrt(r * r - dy * dy) / 2) * 2;
      span(cx - half, cy + dy, half * 2, 2, style);
    }
  };
  const walk = (x0, y0, x1, y1, step, fn) => {
    const d = Math.hypot(x1 - x0, y1 - y0);
    const n = Math.max(1, Math.ceil(d / step));
    for (let i = 0; i <= n; i++) fn(x0 + (x1 - x0) * i / n, y0 + (y1 - y0) * i / n);
  };
  const clearPaint = () => { tiles.forEach((ctx) => ctx.canvas.remove()); tiles.clear(); };

  let tool = 'hand';
  const CURSORS = { pencil: 'crosshair', brush: 'crosshair', spray: 'crosshair', spiral: 'crosshair', eraser: 'cell' };
  const setTool = (id) => {
    tool = id;
    document.body.classList.toggle('bh-painting', id !== 'hand');
    if (id !== 'hand') { root.style.setProperty('--tool-cursor', CURSORS[id]); sizeLayer(); } else if (!tiles.size) layer.style.height = '0';
    $$('.bh-tool', pal).forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.tool === id)));
  };
  $$('.bh-tool', pal).forEach((b) => {
    b.addEventListener('click', () => setTool(b.dataset.tool));
    if (b.dataset.tool === 'eraser') b.addEventListener('dblclick', clearPaint);
  });
  addEventListener('keydown', (e) => { if (e.key === 'Escape') { setTool('hand'); closeAlert(); } });

  let stroke = null;
  const pagePoint = (e) => { const r = layer.getBoundingClientRect(); return [e.clientX - r.left, e.clientY - r.top]; };
  const plot = (x0, y0, x1, y1) => {
    if (tool === 'pencil') walk(x0, y0, x1, y1, 2, (x, y) => span(x - 1, y - 1, 2, 2, '#fff'));
    if (tool === 'brush') walk(x0, y0, x1, y1, 5, (x, y) => disc(x, y, 14, getBrushPattern()));
    if (tool === 'eraser') walk(x0, y0, x1, y1, 8, (x, y) => span(x - 16, y - 16, 32, 32, 'clear'));
    if (tool === 'spray') {
      for (let i = 0; i < 40; i++) {
        const a = Math.random() * Math.PI * 2;
        const r = Math.sqrt(Math.random()) * 34;
        span(x1 + Math.cos(a) * r, y1 + Math.sin(a) * r, 2, 2, '#fff');
      }
    }
  };
  // The spiral tool winds outward from where you pressed, as far as you have dragged.
  const windSpiral = (s, x, y) => {
    const dist = Math.hypot(x - s.cx, y - s.cy);
    const target = dist / 3.4;
    for (let th = s.th; th < target; th += 0.05) {
      const r = th * 3.4;
      span(s.cx + Math.cos(th + s.turn) * r - 2, s.cy + Math.sin(th + s.turn) * r - 2, 4, 4, '#fff');
    }
    s.th = Math.max(s.th, target);
  };
  layer.addEventListener('pointerdown', (e) => {
    if (tool === 'hand') return;
    e.preventDefault();
    layer.setPointerCapture(e.pointerId);
    const [x, y] = pagePoint(e);
    stroke = { x, y, cx: x, cy: y, th: 0, turn: Math.random() * 6.28 };
    if (tool !== 'spiral') plot(x, y, x, y);
  });
  layer.addEventListener('pointermove', (e) => {
    if (!stroke) return;
    const [x, y] = pagePoint(e);
    if (tool === 'spiral') windSpiral(stroke, x, y);
    else plot(stroke.x, stroke.y, x, y);
    stroke.x = x;
    stroke.y = y;
  });
  const endStroke = () => { stroke = null; };
  layer.addEventListener('pointerup', endStroke);
  layer.addEventListener('pointercancel', endStroke);

  // ---------------------------------------------------------------- close boxes that won't close
  const NOTES = [
    'Sorry, a system error occurred. ID = 02',
    'This window can’t be closed while it is looking at you.',
    'Please insert the disk: Uninvited',
    'The Scrapbook is full. Something else is using it.',
  ];
  const alertBox = document.createElement('div');
  alertBox.className = 'bh-alert';
  alertBox.setAttribute('role', 'alertdialog');
  alertBox.setAttribute('aria-label', 'System alert');
  alertBox.hidden = true;
  alertBox.innerHTML = `<div>${iconSvg(BOMB, 4)}</div><p></p><div class="bh-alert-btns"><button class="btn" type="button" data-a="restart">Restart</button><button class="btn" type="button" data-a="resume" style="border-width:4px">Resume</button></div>`;
  document.body.append(alertBox);
  let note = 0;
  function closeAlert() { alertBox.hidden = true; }
  const openAlert = () => {
    $('p', alertBox).textContent = NOTES[note++ % NOTES.length];
    alertBox.hidden = false;
    $('[data-a=resume]', alertBox).focus({ preventScroll: true });
  };
  alertBox.addEventListener('click', (e) => {
    const a = e.target.dataset.a;
    if (a) closeAlert();
    if (a === 'restart') { clearPaint(); scrollTo({ top: 0, behavior: isCalm() ? 'auto' : 'smooth' }); }
  });
  for (const win of [$('.hero-text'), ...$$('.sec')]) {
    const b = document.createElement('button');
    b.className = 'bh-close';
    b.type = 'button';
    b.setAttribute('aria-label', 'Close box');
    b.addEventListener('click', openAlert);
    win.append(b);
  }

  // ---------------------------------------------------------------- ink under the title bars
  const dripPath = () => {
    let seed = 1984;
    const rand = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };
    let d = 'M0 0h480v4H0z';
    let x = 0;
    while (x < 480) {
      const w = Math.min(480 - x, 2 + 2 * Math.floor(rand() * 5));
      const v = rand();
      const h = 4 + (v > .78 ? 26 + (v - .78) * 320 : v * v * 18);
      d += `M${x} 4h${w}v${Math.round(h / 2) * 2}h-${w}z`;
      x += w + (rand() > .55 ? 2 * Math.floor(rand() * 7) : 0);
    }
    return svgUrl(480, 100, `<path d='${d}'/>`);
  };
  root.style.setProperty('--drip', dripPath());
  for (const sec of $$('.sec-how, .sec-palette, .sec-vibe, .sec-refs')) {
    const ink = document.createElement('div');
    ink.className = 'bh-ink';
    sec.append(ink);
  }

  // ---------------------------------------------------------------- the scroll thumbs and page progress
  let progress = 0;
  const secs = $$('.sec');
  const onScroll = () => {
    const max = Math.max(1, root.scrollHeight - innerHeight);
    progress = Math.min(1, scrollY / max);
    for (const s of secs) {
      const r = s.getBoundingClientRect();
      if (r.bottom < 0 || r.top > innerHeight) continue;
      const t = Math.min(1, Math.max(0, -r.top / Math.max(1, r.height - innerHeight * .4)));
      s.style.setProperty('--t', t.toFixed(3));
    }
    wake();
  };
  addEventListener('scroll', onScroll, { passive: true });

  // ---------------------------------------------------------------- the spiral desktop
  // Each pixel is a value around 0.5 pushed through a 4 x 4 Bayer matrix. At exactly 0.5 the matrix gives
  // the Mac's plain checker grey, so the spiral grows out of the ordinary desktop as the amplitude rises.
  const BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5].map((v) => (v + .5) / 16);
  const SIN = new Float32Array(1024);
  for (let i = 0; i < 1024; i++) SIN[i] = Math.sin(i / 1024 * Math.PI * 2);
  const cv = document.createElement('canvas');
  cv.className = 'bh-spiral fx';
  cv.setAttribute('aria-hidden', 'true');
  document.body.prepend(cv);
  const sctx = cv.getContext('2d');
  const SCALE = 2;
  let W = 0;
  let H = 0;
  let phase;
  let radius;
  let image;
  let maxR = 1;
  const sizeSpiral = () => {
    W = Math.ceil(innerWidth / SCALE);
    H = Math.ceil(innerHeight / SCALE);
    cv.width = W;
    cv.height = H;
    image = sctx.createImageData(W, H);
    phase = new Float32Array(W * H);
    radius = new Float32Array(W * H);
    const cx = W * .5;
    const cy = H * .46;
    maxR = Math.hypot(Math.max(cx, W - cx), Math.max(cy, H - cy));
    const TIGHT = 7.5;
    for (let y = 0, i = 0; y < H; y++) {
      for (let x = 0; x < W; x++, i++) {
        const dx = x - cx;
        const dy = y - cy;
        const r = Math.hypot(dx, dy);
        radius[i] = r;
        phase[i] = (Math.atan2(dy, dx) + Math.log(r + 3) * TIGHT) / (Math.PI * 2);
      }
    }
  };
  let spin = 0;
  let creep = 0;
  const paintSpiral = () => {
    const p = Math.min(1, progress + creep);
    const amp = Math.min(1, p * 1.5) ** 1.3;
    const reach = (.16 + p * 1.3) * maxR;
    const fade = .32 * maxR;
    const out = new Uint32Array(image.data.buffer);
    for (let y = 0, i = 0; y < H; y++) {
      const by = (y & 3) << 2;
      for (let x = 0; x < W; x++, i++) {
        const e = Math.min(1, Math.max(0, (reach - radius[i]) / fade));
        const s = SIN[(((phase[i] + spin) * 1024) | 0) & 1023];
        const v = .5 + s * amp * e * .95;
        out[i] = v > BAYER[by | (x & 3)] ? 0xffffffff : 0xff000000;
      }
    }
    sctx.putImageData(image, 0, 0);
  };
  let lastFrame = 0;
  let raf = 0;
  const frame = (now) => {
    raf = 0;
    if (isCalm() || document.hidden) return;
    if (now - lastFrame >= 120) {
      const dt = lastFrame ? Math.min(.3, (now - lastFrame) / 1000) : .12;
      lastFrame = now;
      // Left alone, it creeps in anyway, and it turns only once there is something to turn.
      creep = Math.min(.24, creep + dt * .004);
      spin -= dt * (.06 + progress * .16);
      paintSpiral();
    }
    wake();
  };
  function wake() { if (!raf && !isCalm() && !document.hidden) raf = requestAnimationFrame(frame); }
  addEventListener('eas:calm', () => { if (isCalm()) { cancelAnimationFrame(raf); raf = 0; } else wake(); });
  document.addEventListener('visibilitychange', wake);

  // ---------------------------------------------------------------- 1-bit images
  // A pixel-art image shown at exactly its own size is already 1-bit and stays untouched.
  // Everything else is dithered at display size with Atkinson's algorithm, the one from the Mac.
  const canReadPixels = location.protocol !== 'file:';
  if (!canReadPixels) {
    // Browsers won't let a script read images from file:// pages, so an ordered dither filter stands in.
    const bayer = Array.from({ length: 16 }, (_, i) => BAYER[i]);
    const c = document.createElement('canvas');
    c.width = 4;
    c.height = 4;
    const x = c.getContext('2d');
    const id = x.createImageData(4, 4);
    bayer.forEach((v, i) => { const g = Math.round(v * 255); id.data.set([g, g, g, 255], i * 4); });
    x.putImageData(id, 0, 0);
    const holder = document.createElement('div');
    holder.setAttribute('aria-hidden', 'true');
    holder.style.cssText = 'position:absolute;width:0;height:0;overflow:hidden';
    holder.innerHTML = `<svg width="0" height="0"><filter id="bh-bit" x="0" y="0" width="100%" height="100%" color-interpolation-filters="sRGB"><feColorMatrix in="SourceGraphic" type="saturate" values="0" result="g"/><feImage href="${c.toDataURL()}" x="0" y="0" width="4" height="4" result="tile0"/><feTile in="tile0" result="tile"/><feComposite in="g" in2="tile" operator="arithmetic" k1="0" k2="1" k3="1" k4="-.5"/><feComponentTransfer><feFuncR type="discrete" tableValues="0 1"/><feFuncG type="discrete" tableValues="0 1"/><feFuncB type="discrete" tableValues="0 1"/></feComponentTransfer></filter></svg>`;
    document.body.append(holder);
    root.classList.add('bh-svgbit');
  }

  const atkinson = (ctx, w, h, boost) => {
    const img = ctx.getImageData(0, 0, w, h);
    const d = img.data;
    const lum = new Float32Array(w * h + 2 * w + 2);
    for (let i = 0; i < w * h; i++) {
      const v = (.299 * d[i * 4] + .587 * d[i * 4 + 1] + .114 * d[i * 4 + 2]) / 255;
      lum[i] = Math.min(1, Math.max(0, (v - .5) * boost + .5));
    }
    for (let y = 0, i = 0; y < h; y++) {
      for (let x = 0; x < w; x++, i++) {
        const old = lum[i];
        const on = old > .5;
        const c = on ? 255 : 0;
        d[i * 4] = c;
        d[i * 4 + 1] = c;
        d[i * 4 + 2] = c;
        d[i * 4 + 3] = 255;
        const err = (old - (on ? 1 : 0)) / 8;
        if (x + 1 < w) lum[i + 1] += err;
        if (x + 2 < w) lum[i + 2] += err;
        if (x > 0) lum[i + w - 1] += err;
        lum[i + w] += err;
        if (x + 1 < w) lum[i + w + 1] += err;
        lum[i + 2 * w] += err;
      }
    }
    ctx.putImageData(img, 0, 0);
  };
  const ditherOne = (img) => {
    const shown = img.getBoundingClientRect();
    const w = Math.round(shown.width);
    const h = Math.round(shown.height);
    if (!w || !h || !img.naturalWidth) return;
    const native = img.closest('.is-pixel') && Math.abs(w - img.naturalWidth) < 1 && Math.abs(h - img.naturalHeight) < 1;
    const host = img.parentElement;
    let bit = $(':scope > .bh-bit', host);
    if (native) { bit?.remove(); return; }
    if (!bit) {
      bit = document.createElement('canvas');
      bit.className = 'bh-bit';
      bit.setAttribute('aria-hidden', 'true');
      host.append(bit);
    }
    bit.width = w;
    bit.height = h;
    bit.style.width = `${w}px`;
    bit.style.height = `${h}px`;
    const ctx = bit.getContext('2d', { willReadFrequently: true });
    // Same crop as object-fit: cover.
    const scale = Math.max(w / img.naturalWidth, h / img.naturalHeight);
    const sw = w / scale;
    const sh = h / scale;
    ctx.drawImage(img, (img.naturalWidth - sw) / 2, (img.naturalHeight - sh) / 2, sw, sh, 0, 0, w, h);
    try {
      atkinson(ctx, w, h, img.closest('.is-pixel') ? 1.6 : 1.25);
    } catch { bit.remove(); }
  };
  if (canReadPixels) {
    const pending = new Set();
    const whenReady = (img) => {
      if (img.complete && img.naturalWidth) ditherOne(img);
      else img.addEventListener('load', () => ditherOne(img), { once: true });
    };
    const io = new IntersectionObserver((entries) => {
      for (const e of entries) {
        if (!e.isIntersecting) continue;
        io.unobserve(e.target);
        pending.add(e.target);
        whenReady(e.target);
      }
    }, { rootMargin: '400px' });
    const targets = $$('.hero-gallery img, .ref-gallery img, .related img');
    targets.forEach((t) => io.observe(t));
    let resizeTimer;
    addEventListener('resize', () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(() => {
        pending.forEach(whenReady);
        sizeSpiral();
        wake();
      }, 180);
    });
  } else {
    addEventListener('resize', () => { sizeSpiral(); wake(); });
  }

  // ---------------------------------------------------------------- start
  setPattern(patIndex);
  root.style.setProperty('--title-fill', `${rampUrl()} 0 40% / 16px 192px`);
  sizeSpiral();
  onScroll();
  if (!isCalm()) { paintSpiral(); wake(); }
})();
