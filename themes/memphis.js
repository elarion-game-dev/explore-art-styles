// Memphis: block letters, a bookcase for contents, shapes that tumble as you scroll and can be thrown around, and a machine that shakes out new laminates.
(() => {
  const root = document.documentElement;
  const isCalm = () => root.dataset.calm === '1';
  const $ = (q, el = document) => el.querySelector(q);
  const $$ = (q, el = document) => [...el.querySelectorAll(q)];
  const make = (tag, cls, html) => { const n = document.createElement(tag); if (cls) n.className = cls; if (html !== undefined) n.innerHTML = html; return n; };
  const rnd = (a, b) => a + Math.random() * (b - a);
  const pick = (a) => a[Math.floor(Math.random() * a.length)];
  const COLORS = ['#ff3f1a', '#ffd21f', '#0b5fd0', '#fc9dad', '#3cd986', '#cda1ec', '#19b5b0', '#fef98e'];

  // Title: each letter gets its own block.
  const h1 = $('.hero-title');
  const word = h1.textContent;
  h1.setAttribute('aria-label', word);
  h1.innerHTML = [...word.toUpperCase()].map((c, i) => `<span class="mem-l" style="--i:${i}" aria-hidden="true">${c}</span>`).join('');

  // Contents move into the hero, where they become a bookcase.
  const hero = $('.hero');
  hero.append($('.toc'));

  // ---- the shapes ---------------------------------------------------------------------------------
  const K = '#111';
  const ln = (d) => `<path d="${d}" fill="none" stroke="${K}" stroke-width="19" stroke-linecap="butt" stroke-linejoin="miter"/><path class="l" d="${d}" fill="none" stroke-width="11" stroke-linecap="butt" stroke-linejoin="miter"/>`;
  const stripes = () => {
    let s = `<rect x="6" y="20" width="88" height="60" fill="#fff" stroke="${K}" stroke-width="4"/>`;
    for (let x = 6; x < 90; x += 16) s += `<rect x="${x}" y="20" width="8" height="60" fill="${K}"/>`;
    return s;
  };
  const dots = () => {
    let s = `<rect class="c" x="8" y="8" width="84" height="84" stroke="${K}" stroke-width="4"/>`;
    for (let y = 20; y < 90; y += 15) for (let x = 20; x < 90; x += 15) s += `<circle cx="${x}" cy="${y}" r="3.200" fill="${K}"/>`;
    return s;
  };
  const SHAPES = {
    circle: `<circle class="c" cx="50" cy="50" r="46" stroke="${K}" stroke-width="4"/>`,
    half: `<path class="c" d="M4 66a46 46 0 0 1 92 0z" stroke="${K}" stroke-width="4"/>`,
    tri: `<path class="c" d="M50 8 96 90H4z" stroke="${K}" stroke-width="4" stroke-linejoin="miter"/>`,
    square: `<rect class="c" x="9" y="9" width="82" height="82" stroke="${K}" stroke-width="4"/>`,
    arch: `<path class="c" d="M10 96V50a40 40 0 0 1 80 0v46H66V50a16 16 0 0 0-32 0v46z" stroke="${K}" stroke-width="4"/>`,
    plus: `<path class="c" d="M35 5h30v30h30v30H65v30H35V65H5V35h30z" stroke="${K}" stroke-width="4"/>`,
    zig: ln('M2 66 21 34 40 66 59 34 78 66 97 34'),
    squig: ln('M4 58C14 22 28 22 36 50S54 82 64 50 84 22 96 44'),
    ring: `<circle cx="50" cy="50" r="35" fill="none" stroke="${K}" stroke-width="24"/><circle class="l" cx="50" cy="50" r="35" fill="none" stroke-width="16"/>`,
    stripes: stripes(),
    dots: dots(),
    column: `<path class="c" d="M28 18V88a22 8 0 0 0 44 0V18z" stroke="${K}" stroke-width="4"/><ellipse cx="50" cy="18" rx="22" ry="8" fill="#fff" stroke="${K}" stroke-width="4"/>`,
  };
  const KINDS = Object.keys(SHAPES);

  const layer = make('div', 'mem-shapes');
  layer.setAttribute('aria-hidden', 'true');
  document.body.prepend(layer);
  const shapes = [];
  const narrow = () => innerWidth < 860;

  function addShape(i) {
    const kind = KINDS[i % KINDS.length];
    const el = make('div', 'mem-shape', `<span class="mem-spin"><svg viewBox="0 0 100 100">${SHAPES[kind]}</svg></span>`);
    el.style.setProperty('--c', COLORS[(i * 3) % COLORS.length]);
    layer.append(el);
    const s = { el, spinEl: el.firstChild, i, x: 0, y: 0, vx: 0, vy: 0, base: Math.round(rnd(-3, 3)) * 15, spin: 0, k: pick([-1, 1]) * rnd(0.09, 0.26), par: rnd(-0.08, 0.12), moved: false, size: 100, r1: rnd(0, 1), r2: rnd(0, 1), r3: rnd(0.2, 0.8) };
    shapes.push(s);
    return s;
  }

  // Shapes are placed along the sides of each panel, so most of each one peeks out into the margins and the gaps.
  function placeAll() {
    layer.style.height = '0';
    const docH = root.scrollHeight;
    layer.style.height = `${docH}px`;
    const vw = root.clientWidth;
    const anchors = [hero, ...$$('.sec'), $('.foot')];
    const small = narrow();
    const inner = $('.sec').getBoundingClientRect();
    const gutter = Math.max(0, inner.left);
    let n = 0;
    anchors.forEach((a) => {
      const r = a.getBoundingClientRect();
      const top = r.top + scrollY;
      const count = Math.max(2, Math.round(r.height / (small ? 720 : 340)));
      for (let c = 0; c < count; c += 1) {
        const s = shapes[n] || addShape(n);
        n += 1;
        s.el.style.display = '';
        if (s.moved) continue;
        const left = c % 2 === 0;
        const size = small ? 56 + s.r1 * 28 : 92 + s.r1 * (gutter > 150 ? 84 : 44);
        const reach = small ? size * 0.36 : Math.max(gutter - 20, size * 0.5);
        const bump = s.r2 * Math.max(0, reach - size);
        s.size = size;
        s.x = left ? bump - (small ? size * 0.64 : 0) : vw - size - bump + (small ? size * 0.64 : 0);
        s.y = top + (r.height * (c + s.r3)) / count;
        s.el.style.setProperty('--s', `${size.toFixed(0)}px`);
      }
    });
    for (let i = n; i < shapes.length; i += 1) if (!shapes[i].moved) shapes[i].el.style.display = 'none';
    paintAll();
  }

  function paint(s) {
    const mid = scrollY + innerHeight / 2;
    const offs = s.moved || isCalm() ? 0 : (mid - s.y) * s.par;
    s.el.style.transform = `translate3d(${s.x.toFixed(1)}px, ${(s.y + offs).toFixed(1)}px, 0)`;
    const free = s.flying || s.held;
    const tumble = s.moved || isCalm() ? 0 : scrollY * s.k;
    const raw = s.base + tumble + s.spin;
    const shown = free ? raw : Math.round(raw / 15) * 15;
    s.spinEl.style.transform = `rotate(${shown.toFixed(1)}deg)`;
  }
  function paintAll() { shapes.forEach(paint); }
  let queued = false;
  addEventListener('scroll', () => {
    if (queued) return;
    queued = true;
    requestAnimationFrame(() => {
      queued = false;
      const top = scrollY - 500;
      const bot = scrollY + innerHeight + 500;
      for (const s of shapes) if (s.y > top && s.y < bot) paint(s);
    });
  }, { passive: true });

  // Carrying and throwing. A short press without a drag repaints the shape instead.
  let flying = 0;
  function flyLoop() {
    let alive = 0;
    const docH = layer.offsetHeight;
    const vw = layer.offsetWidth;
    for (const s of shapes) {
      if (!s.flying) continue;
      s.x += s.vx;
      s.y += s.vy;
      s.spin += s.vx * 0.55;
      s.vx *= 0.955;
      s.vy *= 0.955;
      if (s.x < -s.size * 0.4) { s.x = -s.size * 0.4; s.vx = Math.abs(s.vx) * 0.7; }
      if (s.x > vw - s.size * 0.6) { s.x = vw - s.size * 0.6; s.vx = -Math.abs(s.vx) * 0.7; }
      if (s.y < 60) { s.y = 60; s.vy = Math.abs(s.vy) * 0.7; }
      if (s.y > docH - s.size) { s.y = docH - s.size; s.vy = -Math.abs(s.vy) * 0.7; }
      if (Math.hypot(s.vx, s.vy) < 0.25) {
        s.flying = false;
        s.el.classList.remove('is-flying');
      } else alive += 1;
      paint(s);
    }
    flying = alive ? requestAnimationFrame(flyLoop) : 0;
  }

  layer.addEventListener('pointerdown', (e) => {
    const shape = e.target.closest && e.target.closest('.mem-shape');
    if (!shape || e.button > 0) return;
    const s = shapes.find((x) => x.el === shape);
    if (!s) return;
    e.preventDefault();
    const rect = shape.getBoundingClientRect();
    const docY = rect.top + scrollY;
    if (!s.moved) {
      // Freeze the scroll tumble at whatever it shows now, so that it doesn't jump in the hand.
      s.base = s.base + (isCalm() ? 0 : scrollY * s.k);
      s.y = docY;
      s.moved = true;
    }
    s.held = true;
    s.flying = false;
    s.vx = 0;
    s.vy = 0;
    shape.classList.add('is-held');
    shape.classList.remove('is-flying');
    layer.classList.add('is-lifted');
    shape.setPointerCapture(e.pointerId);
    const ox = e.clientX - s.x;
    const oy = e.clientY + scrollY - s.y;
    const sx = e.clientX;
    const sy = e.clientY;
    let travel = 0;
    let lx = e.clientX;
    let ly = e.clientY;
    let lt = performance.now();
    const onMove = (ev) => {
      const now = performance.now();
      const dt = Math.max(8, now - lt);
      s.vx = 0.7 * s.vx + 0.3 * ((ev.clientX - lx) / dt) * 16;
      s.vy = 0.7 * s.vy + 0.3 * ((ev.clientY - ly) / dt) * 16;
      lx = ev.clientX; ly = ev.clientY; lt = now;
      travel = Math.max(travel, Math.hypot(ev.clientX - sx, ev.clientY - sy));
      s.x = ev.clientX - ox;
      s.y = ev.clientY + scrollY - oy;
      s.spin += (ev.movementX || 0) * 0.18;
      paint(s);
    };
    const onEnd = () => {
      shape.removeEventListener('pointermove', onMove);
      shape.removeEventListener('pointerup', onEnd);
      shape.removeEventListener('pointercancel', onEnd);
      shape.classList.remove('is-held');
      layer.classList.remove('is-lifted');
      s.held = false;
      if (travel < 5) {
        const cur = shape.style.getPropertyValue('--c');
        shape.style.setProperty('--c', COLORS[(COLORS.indexOf(cur) + 1) % COLORS.length]);
        s.spin += 45;
      } else if (!isCalm() && performance.now() - lt < 80) {
        s.flying = true;
        shape.classList.add('is-flying');
        if (!flying) flying = requestAnimationFrame(flyLoop);
      }
      paint(s);
    };
    shape.addEventListener('pointermove', onMove);
    shape.addEventListener('pointerup', onEnd);
    shape.addEventListener('pointercancel', onEnd);
  });

  // ---- the laminate machine ------------------------------------------------------------------------
  const pal = JSON.parse($('#palette-data').textContent).colors.map((c) => c.hex);
  const T = 240;
  const INK = '#111111';
  const f = (v) => v.toFixed(1);
  const lum = (h) => { const [r, g, b] = [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16)); return 0.299 * r + 0.587 * g + 0.114 * b; };
  // Each motif is drawn at its own place and again across any edge it crosses, so that the tile repeats without a seam.
  const wrap = (x, y, r, fn) => {
    let out = '';
    for (const ox of [0, -T, T]) {
      for (const oy of [0, -T, T]) {
        if (x + ox + r < 0 || x + ox - r > T || y + oy + r < 0 || y + oy - r > T) continue;
        out += fn(x + ox, y + oy);
      }
    }
    return out;
  };
  const MOTIFS = {
    worms(a, b) {
      let s = '';
      for (let i = 0; i < 46; i += 1) {
        let x = rnd(0, T); let y = rnd(0, T); let h = rnd(0, 6.28);
        let d = `M0 0`;
        let px = 0; let py = 0;
        const n = 3 + Math.floor(rnd(0, 4));
        for (let k = 0; k < n; k += 1) {
          h += rnd(-1, 1);
          const qx = px + Math.cos(h) * 8; const qy = py + Math.sin(h) * 8;
          d += `Q${f(px + Math.cos(h - .6) * 7)} ${f(py + Math.sin(h - .6) * 7)} ${f(qx)} ${f(qy)}`;
          px = qx; py = qy;
        }
        const c = i % 7 === 0 ? b : a;
        s += wrap(x, y, 40, (ax, ay) => `<path transform="translate(${f(ax)} ${f(ay)})" d="${d}" fill="none" stroke="${c}" stroke-width="5" stroke-linecap="round"/>`);
      }
      return s;
    },
    confetti(a, b, c) {
      let s = '';
      for (let i = 0; i < 34; i += 1) {
        const x = rnd(0, T); const y = rnd(0, T); const r = rnd(7, 16); const ang = rnd(0, 360);
        const col = pick([a, b, c, INK]);
        const kind = Math.floor(rnd(0, 4));
        s += wrap(x, y, r * 1.5, (ax, ay) => {
          const t = `transform="translate(${f(ax)} ${f(ay)}) rotate(${f(ang)})"`;
          if (kind === 0) return `<circle ${t} r="${f(r * .7)}" fill="${col}"/>`;
          if (kind === 1) return `<rect ${t} x="${f(-r)}" y="${f(-r * .3)}" width="${f(r * 2)}" height="${f(r * .6)}" fill="${col}"/>`;
          if (kind === 2) return `<path ${t} d="M0 ${f(-r)}L${f(r)} ${f(r * .8)}H${f(-r)}Z" fill="${col}"/>`;
          return `<path ${t} d="M${f(-r)} ${f(r * .3)}L${f(-r * .3)} ${f(-r * .3)}L${f(r * .3)} ${f(r * .3)}L${f(r)} ${f(-r * .3)}" fill="none" stroke="${col}" stroke-width="4"/>`;
        });
      }
      return s;
    },
    terrazzo(a, b, c) {
      let s = '';
      for (let i = 0; i < 42; i += 1) {
        const x = rnd(0, T); const y = rnd(0, T); const r = rnd(5, 18); const col = pick([a, b, c, INK, '#ffffff']);
        const pts = Array.from({ length: 5 }, (_, n) => [Math.cos(n * 1.257 + rnd(-.3, .3)) * r * rnd(.6, 1), Math.sin(n * 1.257 + rnd(-.3, .3)) * r * rnd(.6, 1)]);
        s += wrap(x, y, r * 1.1, (ax, ay) => `<path d="M${pts.map(([px, py]) => `${f(ax + px)} ${f(ay + py)}`).join('L')}Z" fill="${col}"/>`);
      }
      return s;
    },
    gabon(a, b, c) {
      // Blocky bands with a white edge, in the spirit of the dense fabrics.
      let s = '';
      const cell = 60;
      for (let y = 0; y < T; y += cell) {
        for (let x = 0; x < T; x += cell) {
          const col = pick([a, b, c, INK]);
          const ang = pick([0, 30, 60, 90, 120, 150]);
          s += `<path transform="translate(${x + 30} ${y + 30}) rotate(${ang})" d="M-34 -9 -10 -9 -2 -20 8 -9 34 -9 34 9 10 9 2 20 -8 9 -34 9Z" fill="${col}" stroke="#fff" stroke-width="3"/>`;
        }
      }
      return s;
    },
    stripes(a, b) {
      let s = '';
      const w = pick([10, 15, 20, 24]);
      const n = Math.round(T / (2 * w));
      const step = T / n;
      for (let i = 0; i < n; i += 1) s += `<rect x="${f(i * step)}" width="${f(step / 2)}" height="${T}" fill="${INK}"/>`;
      for (let i = 0; i < 9; i += 1) {
        const x = rnd(0, T); const y = rnd(0, T); const r = rnd(10, 22); const col = pick([a, b]);
        s += wrap(x, y, r, (ax, ay) => `<circle cx="${f(ax)}" cy="${f(ay)}" r="${f(r)}" fill="${col}" stroke="${INK}" stroke-width="3"/>`);
      }
      return s;
    },
  };
  const MOTIF_NAMES = Object.keys(MOTIFS);
  const WORDS = ['Tuesday', 'Cha Cha', 'Hotel Lobby', 'Rude Uncle', 'Good Taste', 'Sunday Lunch', 'Lido', 'Big Mistake', 'Espresso', 'Gym Floor', 'The Neighbours', 'Milan, Again'];
  const swatches = $('.swatches');
  const machine = make('div', 'mem-machine', `<div class="mem-window" role="img" aria-label="A generated repeating pattern"></div>
    <div class="mem-controls">
      <h3>The laminate machine</h3>
      <p>Shake it for a new seamless tile, made from the colours above. The file is a plain 240 px SVG, ready for a texture or a background.</p>
      <p class="mem-name" aria-live="polite"></p>
      <div class="mem-btns"><button type="button" class="btn mem-btn-go" data-m="shake">Shake it</button><button type="button" class="btn" data-m="wall">Wallpaper this page</button><button type="button" class="btn" data-m="save">Download .svg</button></div>
    </div>`);
  $('.palette-note').after(machine);
  const win = $('.mem-window', machine);
  const nameEl = $('.mem-name', machine);
  let svgNow = '';
  let wallOn = false;
  function shake() {
    const motif = pick(MOTIF_NAMES);
    const mix = [...pal].sort(() => Math.random() - 0.5);
    const lightFirst = motif === 'worms' || motif === 'stripes' ? mix.sort((a, b) => lum(b) - lum(a)) : mix;
    const bg = motif === 'stripes' ? '#ffffff' : lightFirst[0];
    const ink = motif === 'worms' ? INK : lightFirst[1];
    const body = MOTIFS[motif](ink, motif === 'worms' ? mix[mix.length - 1] : lightFirst[2], lightFirst[3]);
    svgNow = `<svg xmlns="http://www.w3.org/2000/svg" width="${T}" height="${T}" viewBox="0 0 ${T} ${T}"><rect width="${T}" height="${T}" fill="${bg}"/>${body}</svg>`;
    const url = `url("data:image/svg+xml,${encodeURIComponent(svgNow)}")`;
    win.style.backgroundImage = url;
    win.style.backgroundSize = `${T}px`;
    nameEl.textContent = `No. ${Math.floor(rnd(100, 999))}: ${pick(WORDS)}`;
    if (wallOn) setWall(url);
    win.classList.remove('is-shaking');
    void win.offsetWidth;
    win.classList.add('is-shaking');
  }
  function setWall(url) {
    if (url) {
      root.style.setProperty('--wall', url);
      root.style.setProperty('--wall-size', `${T}px`);
    } else {
      root.style.removeProperty('--wall');
      root.style.removeProperty('--wall-size');
    }
  }
  machine.addEventListener('click', (e) => {
    const m = e.target.dataset.m;
    if (!m) return;
    if (m === 'shake') shake();
    if (m === 'wall') {
      wallOn = !wallOn;
      setWall(wallOn ? win.style.backgroundImage : null);
      e.target.textContent = wallOn ? 'Back to Bacterio' : 'Wallpaper this page';
    }
    if (m === 'save') {
      const a = document.createElement('a');
      a.href = URL.createObjectURL(new Blob([svgNow], { type: 'image/svg+xml' }));
      a.download = `memphis-laminate-${nameEl.textContent.replace(/\D+/g, '').slice(0, 3)}.svg`;
      a.click();
      setTimeout(() => URL.revokeObjectURL(a.href), 2000);
    }
  });
  shake();

  // Set the shapes out once the layout has settled, and again when it changes.
  placeAll();
  addEventListener('load', placeAll);
  let resizeT;
  let lastW = innerWidth;
  addEventListener('resize', () => {
    // A phone's address bar changes the height as you scroll. That is not worth moving anything for.
    if (innerWidth === lastW) return;
    lastW = innerWidth;
    clearTimeout(resizeT);
    resizeT = setTimeout(placeAll, 150);
  });
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(placeAll);
  addEventListener('eas:calm', paintAll);
})();
