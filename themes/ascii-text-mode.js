// ASCII / Text Mode: the title in block letters, and a small roguelike in the hero.
// The map is text: one character per cell, drawn in the sixteen text-mode colours. The @ moves with the arrow keys,
// WASD, hjkl or a tap. Field of view is symmetric shadowcasting (Albert Ford's method, ported): what the @ sees now is lit,
// the bright half of each colour near it; what it has seen is remembered in dark grey; the rest is unknown.
// Six glyphs stand for the six sections. Stepping onto one jumps to its section. Nothing moves unless the player moves,
// and in calm mode a walk to a tapped cell happens in one step.
(() => {
  const root = document.documentElement;
  const $ = (q, el = document) => el.querySelector(q);
  const $$ = (q, el = document) => [...el.querySelectorAll(q)];
  const isCalm = () => root.dataset.calm === '1';
  const hero = $('.hero');
  if (!hero) return;
  root.classList.add('atm-js');

  // ---- the title, in block letters ----
  const LOGO = {
    ASCII: [
      ' █████╗ ███████╗ ██████╗██╗██╗',
      '██╔══██╗██╔════╝██╔════╝██║██║',
      '███████║███████╗██║     ██║██║',
      '██╔══██║╚════██║██║     ██║██║',
      '██║  ██║███████║╚██████╗██║██║',
      '╚═╝  ╚═╝╚══════╝ ╚═════╝╚═╝╚═╝',
    ],
  };
  const h1 = $('.hero-title', hero);
  const art = h1 && LOGO[h1.textContent.trim()];
  if (art) {
    const said = document.createElement('span');
    said.className = 'atm-vh';
    said.textContent = h1.textContent.trim();
    const logo = document.createElement('span');
    logo.className = 'atm-logo';
    logo.setAttribute('aria-hidden', 'true');
    // Solid blocks in the bright colour, the box-line shadow in the dark one.
    logo.innerHTML = art.map((row) => row.replace(/[^█ ]+/g, (m) => `<i>${m}</i>`)).join('\n');
    h1.textContent = '';
    h1.append(said, logo);
    h1.classList.add('has-logo');
  }

  // ---- the map ----
  const MAP = [
    '╔══════════════╗     ╔═══════════╗      ╔═══════════════╗',
    '║"""........"""║     ║...........║      ║.======..======║',
    '║"↑.↑...?."..↑"\'#####\'.█.......█.║      ║........+......║',
    '║."↑....."....↑║     ║.....*.....\'######\'...............║',
    '║..""......↑.""║  ###\'.█.......█.║      ║.====......====║',
    '╚══════\'════\'══╝  #  ╚═════\'═════╝      ╚════════\'══════╝',
    '       #    #######        #                     #       ',
    '       #                  ▓.▓▓▓▓▓▓▓▓▓            #       ',
    ' ╔═════\'═════════╗     ▓▓▓▓.....▓▓...▓▓    ╔═════\'══════╗',
    ' ║...............║   ▓▓▓......~~~.....▓▓   ║."".........║',
    ' ║...{...........║  ▓▓.....~~~~~~~~.(..▓   ║............║',
    ' ║...............\'##......~~~~~~~~~~.....##\'............║',
    ' ║...........^...║  ▓▓.....~~~~~~~.....▓   ║..........>.║',
    ' ║..............!║   ▓▓▓▓.........▓▓▓▓▓▓   ║""..........║',
    ' ╚═══════════════╝      ▓▓▓▓▓▓▓▓▓▓▓        ╚════════════╝',
  ].map((r) => [...r]);
  const H = MAP.length;
  const W = MAP[0].length;
  const START = [9, 11];

  // What each character is: its colour (one of the eight dark text colours; the lit side uses the bright one),
  // whether you can walk on it, whether light passes, and what the look command calls it.
  const T = {
    '.': [7, 1, 1, 'the floor'], '#': [7, 1, 1, 'a corridor'], "'": [6, 1, 1, 'an open door'], '"': [2, 1, 1, 'grass'],
    '↑': [2, 0, 0, 'a tree'], '~': [1, 0, 1, 'dark water'], '{': [3, 0, 1, 'a fountain'], '=': [6, 0, 0, 'a bookshelf'],
    '█': [7, 0, 0, 'a stone pillar'], '▓': [6, 0, 0, 'rough rock'], '^': [5, 1, 1, 'a trap. It has been disarmed'], ' ': [0, 0, 0, 'solid rock'],
  };
  const WALL = [7, 0, 0, 'a wall'];
  const tile = (x, y) => T[MAP[y][x]] || WALL;
  const walkable = (x, y) => x >= 0 && y >= 0 && x < W && y < H && tile(x, y)[1] === 1;
  const clear = (x, y) => x >= 0 && y >= 0 && x < W && y < H && tile(x, y)[2] === 1;
  // Water in two blues, so the lake has a surface
  const waterTone = (x, y) => ((x * 7 + y * 3) % 5 < 2 ? 3 : 1);

  // The six glyphs, in the order of the contents list
  const ITEMS = {
    '?': { id: 'feel', c: 11, what: 'a scroll', act: 'You read the scroll.' },
    '*': { id: 'core', c: 14, what: 'a yellow gem', act: 'You hold the gem up to the light.' },
    '+': { id: 'how', c: 10, what: 'a spellbook', act: 'You open the spellbook.' },
    '!': { id: 'palette', c: 13, what: 'a magenta potion', act: 'You drink the potion. Colours swim.' },
    '(': { id: 'vibe', c: 9, what: 'a wooden flute', act: 'You play the flute.' },
    '>': { id: 'refs', c: 12, what: 'a staircase down', act: 'You go down the stairs.' },
  };
  const itemAt = {};
  MAP.forEach((row, y) => row.forEach((ch, x) => {
    if (ITEMS[ch]) { itemAt[`${x},${y}`] = ch; ITEMS[ch].x = x; ITEMS[ch].y = y; MAP[y][x] = '.'; }
  }));
  const label = (id) => ($(`.toc a[href="#${id}"]`)?.textContent || id).trim();

  // Creatures are letters. The rat and the bat wander a step when you do; the dragon sleeps.
  const MONSTERS = [
    { ch: 'r', c: 6, x: 10, y: 13, name: 'the rat', bump: 'The rat squeaks and holds its ground.', moves: true },
    { ch: 'B', c: 3, x: 28, y: 13, name: 'the bat', bump: 'The bat flutters out of reach.', moves: true },
    { ch: 'D', c: 12, x: 52, y: 11, name: 'the red dragon', bump: 'The red dragon is asleep. You step back quietly.', moves: false },
  ];
  const monsterAt = (x, y) => MONSTERS.find((m) => m.x === x && m.y === y);

  // ---- field of view: symmetric shadowcasting ----
  const RADIUS = 12; // in columns; rows count double, because a text cell is about twice as tall as it is wide
  const NEAR = 5;
  const dist = (x0, y0, x1, y1) => Math.hypot(x1 - x0, (y1 - y0) * 2);
  function fov(ox, oy, mark) {
    mark(ox, oy);
    const quads = [(r, c) => [ox + c, oy - r], (r, c) => [ox + r, oy + c], (r, c) => [ox + c, oy + r], (r, c) => [ox - r, oy + c]];
    for (const tf of quads) {
      const opaque = (r, c) => { const [x, y] = tf(r, c); return !clear(x, y); };
      const scan = (depth, start, end) => {
        if (depth > RADIUS) return;
        let prevWall = null;
        const lo = Math.floor(depth * start + 0.5);
        const hi = Math.ceil(depth * end - 0.5);
        for (let col = lo; col <= hi; col++) {
          const wall = opaque(depth, col);
          if (wall || (col >= depth * start && col <= depth * end)) {
            const [x, y] = tf(depth, col);
            if (x >= 0 && y >= 0 && x < W && y < H && dist(ox, oy, x, y) <= RADIUS) mark(x, y);
          }
          if (prevWall === true && !wall) start = (2 * col - 1) / (2 * depth);
          if (prevWall === false && wall) scan(depth + 1, start, (2 * col - 1) / (2 * depth));
          prevWall = wall;
        }
        if (prevWall === false) scan(depth + 1, start, end);
      };
      scan(1, -1, 1);
    }
  }

  // ---- state ----
  const me = { x: START[0], y: START[1] };
  const seen = new Uint8Array(W * H);
  const lit = new Uint8Array(W * H);
  let torch = true;
  let turn = 0;
  let onItem = null;
  let hiItem = null;
  // Most of the level is already explored and remembered, so the map opens with something to go on. The cave is not.
  for (const [x, y] of [[7, 7], [7, 5], [6, 3], [12, 2], [18, 5], [26, 2], [30, 4], [36, 3], [44, 3], [52, 2], [49, 6], [48, 10], [52, 12]]) fov(x, y, (a, b) => { seen[b * W + a] = 1; });

  // ---- the window ----
  const game = document.createElement('section');
  game.className = 'atm-game';
  game.setAttribute('aria-label', 'Playable map');
  game.innerHTML = `
    <p class="atm-msg" aria-live="polite"></p>
    <div class="atm-view" tabindex="0" role="group" aria-label="Map. Arrow keys, WASD or hjkl move the @. Six glyphs mark the six sections: walk onto one to open it." aria-describedby="atm-help">
      <pre class="atm-map" aria-hidden="true"></pre>
    </div>
    <div class="atm-side"></div>
    <div class="atm-status">
      <span class="atm-stats" aria-hidden="true"></span>
      <button class="atm-torch" type="button" aria-pressed="true">Field of view: on</button>
      <span class="atm-pad" role="group" aria-label="Move the @">
        <button type="button" data-d="-1,0" aria-label="West">&lt;</button><button type="button" data-d="0,-1" aria-label="North">^</button><button type="button" data-d="0,1" aria-label="South">v</button><button type="button" data-d="1,0" aria-label="East">&gt;</button>
      </span>
      <span class="atm-help" id="atm-help">Move: arrow keys, WASD, hjkl or tap. Step onto a glyph to open its section.</span>
    </div>`;
  // The game goes between the two rows of hero images, so the first two images share the first screen with the title
  const gallery = $('.hero-gallery', hero);
  const third = gallery && $('.shot-3', gallery);
  if (third) gallery.insertBefore(game, third);
  else hero.insertBefore(game, gallery);
  const msgEl = $('.atm-msg', game);
  const view = $('.atm-view', game);
  const pre = $('.atm-map', game);
  const stats = $('.atm-stats', game);
  const torchBtn = $('.atm-torch', game);
  // The contents list becomes the map's key
  const toc = $('.toc');
  if (toc) $('.atm-side', game).append(toc);

  let html = '';
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) html += '<b> </b>';
    if (y < H - 1) html += '\n';
  }
  pre.innerHTML = html;
  const cells = $$('b', pre);
  const shown = new Array(W * H).fill('');
  const total = MAP.flat().filter((c) => c !== ' ').length;

  const BRIGHT = [8, 9, 10, 11, 12, 13, 14, 15, 7, 9, 10, 11, 12, 13, 14, 15];
  function draw() {
    lit.fill(0);
    if (torch) fov(me.x, me.y, (x, y) => { lit[y * W + x] = 1; seen[y * W + x] = 1; });
    let known = 0;
    for (let y = 0; y < H; y++) {
      for (let x = 0; x < W; x++) {
        const i = y * W + x;
        const ch = MAP[y][x];
        const t = tile(x, y);
        const visible = !torch || lit[i];
        let glyph = ch;
        let cls;
        if (ch === ' ') cls = 'u';
        else if (visible) {
          const base = ch === '~' ? waterTone(x, y) : t[0];
          cls = 'k' + (torch && dist(me.x, me.y, x, y) <= NEAR ? BRIGHT[base] : base);
        } else cls = seen[i] ? 'k8' : 'u';
        if (ch !== ' ' && (seen[i] || !torch)) known++;
        const it = itemAt[`${x},${y}`];
        if (it) { glyph = it; cls = 'k' + ITEMS[it].c + (hiItem === it ? ' hi' : ''); }
        const m = monsterAt(x, y);
        if (m && visible) { glyph = m.ch; cls = 'k' + m.c; }
        if (x === me.x && y === me.y) { glyph = '@'; cls = 'k15 me'; }
        const key = glyph + cls;
        if (shown[i] !== key) {
          shown[i] = key;
          const el = cells[i];
          if (el.textContent !== glyph) el.textContent = glyph;
          el.className = cls;
        }
      }
    }
    stats.textContent = `Dlvl:1  T:${turn}  Seen:${Math.round((known / total) * 100)}%`;
    camera();
  }

  // On a narrow screen the map is wider than the window, so the view follows the @.
  let cols = W;
  function camera() {
    if (cols >= W) { pre.style.transform = ''; return; }
    const cx = Math.max(0, Math.min(W - cols, me.x - Math.floor(cols / 2)));
    pre.style.transform = `translateX(${-cx}ch)`;
  }
  const measure = () => {
    const cell = pre.offsetWidth / W;
    cols = cell ? Math.max(10, Math.floor(view.clientWidth / cell)) : W;
    camera();
  };
  if ('ResizeObserver' in window) new ResizeObserver(measure).observe(view);
  document.fonts?.ready.then(measure);

  let msgTimer;
  const say = (text) => { msgEl.textContent = text; };

  function look(x, y) {
    const m = monsterAt(x, y);
    if (m && (lit[y * W + x] || !torch)) return `You see ${m.name.replace('the ', 'a ')}.`;
    const it = itemAt[`${x},${y}`];
    if (it) return `You see ${ITEMS[it].what}: ${label(ITEMS[it].id)}.`;
    return '';
  }

  function wander() {
    for (const m of MONSTERS) {
      if (!m.moves || Math.random() < 0.45) continue;
      const opts = [[1, 0], [-1, 0], [0, 1], [0, -1]].map(([dx, dy]) => [m.x + dx, m.y + dy])
        .filter(([x, y]) => walkable(x, y) && !monsterAt(x, y) && !(x === me.x && y === me.y) && !itemAt[`${x},${y}`]);
      if (opts.length) [m.x, m.y] = opts[Math.floor(Math.random() * opts.length)];
    }
  }

  // After a jump, focus is on a section title, where left or right would reach page.js and load another style.
  // Arrow keys still held down from the walk are kept from the page until let go, so they don't scroll the jump away.
  // Left and right pressed just after the jump are kept from it too, and quick taps keep that guard up until the
  // player pauses. Up and down pressed afresh scroll the page as usual.
  const held = new Set();
  let guardUntil = 0;
  addEventListener('keydown', (e) => {
    if (!e.key.startsWith('Arrow') || view.contains(e.target)) return;
    const sideways = e.key === 'ArrowLeft' || e.key === 'ArrowRight';
    const now = performance.now();
    if (held.has(e.key) || (sideways && now < guardUntil)) {
      e.stopPropagation();
      e.preventDefault();
      if (sideways) guardUntil = Math.max(guardUntil, now + 400);
    }
  }, true);
  addEventListener('keyup', (e) => { held.delete(e.key); }, true);
  addEventListener('blur', () => held.clear());

  function enter(ch) {
    const it = ITEMS[ch];
    const sec = document.getElementById(it.id);
    say(`${it.act} ${label(it.id)}.`);
    if (!sec) return;
    clearTimeout(msgTimer);
    msgTimer = setTimeout(() => {
      guardUntil = performance.now() + 700;
      sec.scrollIntoView({ behavior: isCalm() ? 'auto' : 'smooth', block: 'start' });
      const h = $('.sec-title', sec);
      if (h) { h.tabIndex = -1; h.focus({ preventScroll: true }); }
    }, isCalm() ? 0 : 380);
  }

  // One step. Returns false when the way is blocked.
  function step(dx, dy, quiet) {
    const nx = me.x + dx, ny = me.y + dy;
    const m = monsterAt(nx, ny);
    if (m) { say(m.bump); return false; }
    if (!walkable(nx, ny)) {
      if (!quiet) {
        const ch = nx >= 0 && ny >= 0 && nx < W && ny < H ? MAP[ny][nx] : ' ';
        say(ch === '~' ? 'The water is too deep to wade.' : `There is ${tile(nx, ny)[3]} in the way.`);
      }
      return false;
    }
    me.x = nx; me.y = ny; turn++;
    wander();
    const here = itemAt[`${nx},${ny}`];
    if (here && here !== onItem) { onItem = here; draw(); enter(here); return 'item'; }
    if (!here) onItem = null;
    if (MAP[ny][nx] === '^' && !quiet) say('There is a trap here. It has been disarmed.');
    else if (!quiet) {
      // Mention anything interesting next to the @
      let note = '';
      for (let j = -1; j <= 1 && !note; j++) for (let i = -1; i <= 1 && !note; i++) if (i || j) note = look(nx + i, ny + j);
      say(note);
    }
    draw();
    return true;
  }

  // ---- travel to a tapped cell: the shortest walk, one step at a time ----
  let walking = 0;
  function path(tx, ty) {
    const prev = new Int32Array(W * H).fill(-1);
    const start = me.y * W + me.x;
    const goal = ty * W + tx;
    prev[start] = start;
    const q = [start];
    for (let h = 0; h < q.length; h++) {
      const i = q[h];
      if (i === goal) break;
      const x = i % W, y = (i - x) / W;
      for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [1, -1], [-1, 1], [-1, -1]]) {
        const nx = x + dx, ny = y + dy, n = ny * W + nx;
        if (walkable(nx, ny) && prev[n] < 0 && n !== goal && (monsterAt(nx, ny) || itemAt[`${nx},${ny}`])) continue;
        if (walkable(nx, ny) && prev[n] < 0) { prev[n] = i; q.push(n); }
      }
    }
    if (prev[goal] < 0) return null;
    const out = [];
    for (let i = goal; i !== start; i = prev[i]) out.unshift([i % W, (i - (i % W)) / W]);
    return out;
  }
  function travel(tx, ty) {
    const id = ++walking;
    let route = path(tx, ty);
    if (!route) { say(walkable(tx, ty) ? 'You cannot find a way there.' : (look(tx, ty) || `That is ${tile(tx, ty)[3]}.`)); return; }
    let detours = 4;
    const next = () => {
      if (id !== walking || !route.length) return;
      const [x, y] = route[0];
      // A creature has wandered into the way: look for a way round it.
      if (monsterAt(x, y) && route.length > 1 && detours-- > 0) route = path(tx, ty) || route;
      const [sx, sy] = route.shift();
      const r = step(sx - me.x, sy - me.y, route.length > 0);
      if (r === true && route.length) {
        if (isCalm()) next(); else setTimeout(next, 45);
      }
    };
    next();
  }

  // ---- input ----
  const KEYS = {
    ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, -1], ArrowDown: [0, 1],
    a: [-1, 0], d: [1, 0], w: [0, -1], s: [0, 1], h: [-1, 0], l: [1, 0], k: [0, -1], j: [0, 1],
    y: [-1, -1], u: [1, -1], b: [-1, 1], n: [1, 1],
    4: [-1, 0], 6: [1, 0], 8: [0, -1], 2: [0, 1], 7: [-1, -1], 9: [1, -1], 1: [-1, 1], 3: [1, 1],
  };
  view.addEventListener('keydown', (e) => {
    if (e.altKey || e.ctrlKey || e.metaKey) return;
    const d = KEYS[e.key.length === 1 ? e.key.toLowerCase() : e.key];
    if (!d) return;
    // Arrow keys on the map move the @, not the page to the next style (page.js listens on window)
    e.preventDefault();
    e.stopPropagation();
    if (e.key.startsWith('Arrow')) held.add(e.key);
    walking++;
    step(d[0], d[1]);
  });
  view.addEventListener('focus', () => { if (!turn) say('You are the @. Walk onto a glyph to open its section.'); });
  pre.addEventListener('click', (e) => {
    const r = pre.getBoundingClientRect();
    const x = Math.floor(((e.clientX - r.left) / r.width) * W);
    const y = Math.floor(((e.clientY - r.top) / r.height) * H);
    if (x < 0 || y < 0 || x >= W || y >= H) return;
    view.focus({ preventScroll: true });
    if (x === me.x && y === me.y) { say('That is you.'); return; }
    travel(x, y);
  });
  $$('.atm-pad button', game).forEach((b) => b.addEventListener('click', () => {
    const [dx, dy] = b.dataset.d.split(',').map(Number);
    walking++;
    step(dx, dy);
  }));
  torchBtn.addEventListener('click', () => {
    torch = !torch;
    torchBtn.setAttribute('aria-pressed', String(torch));
    torchBtn.textContent = `Field of view: ${torch ? 'on' : 'off'}`;
    say(torch ? 'You see only what the @ can see, and remember the rest in grey.' : 'The whole level is lit. Everything is in plain sight.');
    draw();
  });

  // Pointing at an entry in the key marks its glyph on the map.
  if (toc) {
    for (const a of $$('a', toc)) {
      const ch = Object.keys(ITEMS).find((k) => `#${ITEMS[k].id}` === a.getAttribute('href'));
      if (!ch) continue;
      const on = () => { hiItem = ch; draw(); };
      const off = () => { if (hiItem === ch) { hiItem = null; draw(); } };
      a.addEventListener('mouseenter', on);
      a.addEventListener('focus', on);
      a.addEventListener('mouseleave', off);
      a.addEventListener('blur', off);
    }
  }

  addEventListener('eas:calm', () => { walking++; });

  // Text-mode screenshots shown smaller than their own pixels (counting the screen's pixel ratio) are marked soft,
  // so they are averaged down rather than losing whole rows and columns of each character.
  if ('ResizeObserver' in window) {
    const fit = (img, w, h) => {
      if (!img.naturalWidth || !w) return;
      const s = Math.min(1, w / img.naturalWidth, h / img.naturalHeight) * (window.devicePixelRatio || 1);
      img.classList.toggle('atm-soft', s < 0.999);
    };
    const ro = new ResizeObserver((entries) => {
      for (const en of entries) fit(en.target, en.contentRect.width, en.contentRect.height);
    });
    for (const img of $$('.is-pixel .shot-link img')) {
      ro.observe(img);
      // the size is known before the image is; check again once it has loaded
      if (!img.complete) img.addEventListener('load', () => { ro.unobserve(img); ro.observe(img); }, { once: true });
    }
  }

  say('Welcome to the text-mode page. Six glyphs mark six sections.');
  draw();
})();
