// Dreamcore: real soft clouds, generated once and drifting behind the page, some with eyes that follow you. A rainbow road winds down between the sections
// with a sheep on it. The page remembers your visits, and any star you leave in the sky is still there when you come back.
(() => {
  const root = document.documentElement;
  const $ = (q, el = document) => el.querySelector(q);
  const $$ = (q, el = document) => [...el.querySelectorAll(q)];
  const calm = () => root.dataset.calm === '1';
  const page = $('.page');
  const hero = $('.hero');
  const reduceData = innerWidth < 720;

  // ---- Title letters float one at a time ----
  const title = $('.hero-title');
  const titleText = title.textContent.trim();
  title.setAttribute('aria-label', titleText);
  title.innerHTML = [...titleText].map((c, i) => `<span aria-hidden="true" style="--i:${i}">${c}</span>`).join('');

  // ---- The rainbow and the floor ----
  const rainbow = document.createElement('div');
  rainbow.className = 'dc-rainbow';
  rainbow.setAttribute('aria-hidden', 'true');
  rainbow.innerHTML = '<i></i>';
  const floor = () => {
    const f = document.createElement('div');
    f.className = 'dc-floor';
    f.setAttribute('aria-hidden', 'true');
    f.innerHTML = '<i></i>';
    return f;
  };
  hero.prepend(floor());
  hero.prepend(rainbow);
  $('.sec-related')?.prepend(floor());

  // ---- Sky ----
  const hash = (x, y, s) => {
    let h = (Math.imul(x, 374761393) + Math.imul(y, 668265263) + Math.imul(s, 1442968193)) | 0;
    h = Math.imul(h ^ (h >>> 13), 1274126177);
    return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
  };
  const vnoise = (x, y, s) => {
    const xi = Math.floor(x);
    const yi = Math.floor(y);
    const fx = x - xi;
    const fy = y - yi;
    const u = fx * fx * (3 - 2 * fx);
    const v = fy * fy * (3 - 2 * fy);
    const a = hash(xi, yi, s);
    const b = hash(xi + 1, yi, s);
    const c = hash(xi, yi + 1, s);
    const d = hash(xi + 1, yi + 1, s);
    return a + (b - a) * u + (c - a + (a - b + d - c) * u) * v;
  };
  const fbm = (x, y, s) => {
    let a = .5;
    let f = 1;
    let t = 0;
    for (let i = 0; i < 5; i++) {
      t += a * vnoise(x * f, y * f, s + i);
      f *= 2.03;
      a *= .5;
    }
    return t;
  };
  const smooth = (a, b, x) => {
    const t = Math.min(1, Math.max(0, (x - a) / (b - a)));
    return t * t * (3 - 2 * t);
  };
  // A small cumulus: billowy on top, flat underneath, pale lavender in the shade. Scaled up on screen, which is what makes it soft.
  const makeCloud = (seed) => {
    const W = reduceData ? 200 : 280;
    const H = reduceData ? 108 : 150;
    const c = document.createElement('canvas');
    c.width = W;
    c.height = H;
    const g = c.getContext('2d');
    const im = g.createImageData(W, H);
    for (let y = 0; y < H; y++) {
      for (let x = 0; x < W; x++) {
        const nx = x / W;
        const ny = y / H;
        const dx = (nx - .5) / .47;
        const dy = ny < .68 ? (ny - .68) / .62 : (ny - .68) / .22;
        const e = 1 - dx * dx - dy * dy;
        if (e < -.75) continue; // too far out for the noise to reach
        const n = fbm(nx * 6.2 + seed * 3.1, ny * 3.6 + seed * 1.7, seed);
        const d = e + (n - .5) * 1.5;
        const a = smooth(.02, .2, d);
        if (a <= 0) continue;
        const l = smooth(-.02, .62, d * .55 + (.66 - ny) * .95 + (n - .5) * .4);
        const o = (y * W + x) * 4;
        im.data[o] = 172 + 83 * l;
        im.data[o + 1] = 196 + 59 * l;
        im.data[o + 2] = 238 + 17 * l;
        im.data[o + 3] = a * 255;
      }
    }
    g.putImageData(im, 0, 0);
    return c.toDataURL('image/png');
  };

  const sky = document.createElement('div');
  sky.className = 'dc-sky';
  sky.setAttribute('aria-hidden', 'true');
  document.body.prepend(sky);

  let eyeN = 0;
  const makeEye = (bl, bd) => {
    const id = `dc-eye-${eyeN++}`;
    const almond = 'M3 30Q50-9 97 30 50 66 3 30Z';
    return `<svg class="dc-eye" viewBox="0 0 100 60" style="--bl:${bl}s;--bd:${bd}s"><defs><clipPath id="${id}"><path d="${almond}"/></clipPath></defs>
      <g clip-path="url(#${id})"><rect width="100" height="60" fill="#fdfdfb"/><g class="dc-look"><circle cx="50" cy="28" r="21" fill="#5fa8e8"/><circle cx="50" cy="28" r="21" fill="none" stroke="#264e9c" stroke-width="3"/><circle cx="50" cy="28" r="10" fill="#10183f"/><circle cx="44" cy="21" r="4.4" fill="#fff"/></g>
      <path class="dc-lid" d="M0 0H100V60H0Z" fill="#eef3ff"/></g>
      <path d="${almond}" fill="none" stroke="#3d4a86" stroke-width="2.4" stroke-opacity=".75"/>
      <path d="M15 17L9 7M31 8L27-3M50 4V-8M69 8L73-3M85 17L91 7" stroke="#3d4a86" stroke-width="2.4" stroke-linecap="round" stroke-opacity=".75"/></svg>`;
  };

  // x and y place a cloud in the sky (0 to 1), w is its width in screen widths, d how fast it moves when you scroll.
  const SKY = [
    { x: .02, y: .06, w: .2, d: .1, s: 1 },
    { x: .36, y: .03, w: .17, d: .08, s: 2 },
    { x: .74, y: .22, w: .26, d: .14, s: 3 },
    { x: .27, y: .41, w: .3, d: .22, s: 4, eye: true, bl: 9, bd: 0 },
    { x: .56, y: .5, w: .2, d: .12, s: 5 },
    { x: .88, y: .62, w: .4, d: .3, s: 6 },
    { x: .05, y: .72, w: .24, d: .16, s: 3, eye: true, bl: 13, bd: -4 },
    { x: .44, y: .86, w: .42, d: .34, s: 1 },
    { x: .72, y: .92, w: .18, d: .1, s: 4, eye: true, bl: 11, bd: -7 },
    { x: .28, y: .14, w: .14, d: .06, s: 5 },
    { x: .62, y: .3, w: .12, d: .05, s: 2 },
    { x: .9, y: .08, w: .16, d: .09, s: 6 },
  ].slice(0, reduceData ? 7 : 12);

  let clouds = [];
  // One shape at a time, so that making them never holds up the page.
  const buildSky = (s = 1) => {
    const url = makeCloud(s * 17 + 3);
    for (const d of SKY) {
      if (d.s !== s) continue;
      const el = document.createElement('div');
      el.className = 'dc-cloud';
      el.style.backgroundImage = `url(${url})`;
      if (d.eye) el.innerHTML = makeEye(d.bl, d.bd);
      sky.append(el);
      clouds.push({ ...d, el, look: el.querySelector('.dc-look'), eyeBox: el.querySelector('.dc-eye'), px: 0, py: 0, cw: 0, ch: 0 });
    }
    sizeClouds();
    placeClouds(0);
    aimEyes();
    if (s < 6) setTimeout(() => buildSky(s + 1), 20);
  };
  const sizeClouds = () => {
    const unit = Math.max(innerWidth, 620);
    for (const c of clouds) {
      c.cw = unit * c.w * (reduceData ? 1.5 : 1);
      c.ch = c.cw * .54;
      c.el.style.width = `${c.cw}px`;
      c.el.style.height = `${c.ch}px`;
    }
  };
  const mod = (a, b) => ((a % b) + b) % b;
  let vw = innerWidth;
  let vh = innerHeight;
  const placeClouds = (t) => {
    const sy = calm() ? 0 : scrollY;
    for (const c of clouds) {
      const W = vw + c.cw * 1.4;
      const H = vh + c.ch * 1.4;
      c.px = mod(c.x * W + t * .0016 * (1 + c.d * 4), W) - c.cw * .7;
      c.py = mod(c.y * H - sy * c.d, H) - c.ch * .7;
      c.el.style.transform = `translate3d(${c.px.toFixed(1)}px, ${c.py.toFixed(1)}px, 0)`;
    }
  };

  // ---- Eyes follow the pointer. On a phone, they watch where you are going. ----
  let pointerX = null;
  let pointerY = null;
  let scrollDir = 0;
  const aimEyes = () => {
    for (const c of clouds) {
      if (!c.look) continue;
      const ex = c.px + c.cw / 2;
      const ey = c.py + c.ch * .52;
      const tx = pointerX ?? vw / 2;
      const ty = pointerY ?? vh / 2 + scrollDir * vh;
      const dx = tx - ex;
      const dy = ty - ey;
      const len = Math.hypot(dx, dy) || 1;
      const reach = Math.min(1, len / 240);
      c.look.setAttribute('transform', `translate(${((dx / len) * 17 * reach).toFixed(1)} ${((dy / len) * 7 * reach).toFixed(1)})`);
    }
  };
  addEventListener('pointermove', (e) => {
    if (e.pointerType !== 'mouse') return;
    pointerX = e.clientX;
    pointerY = e.clientY;
    if (!calm()) aimEyes();
    wake();
  }, { passive: true });

  // If you stay very still, they all fall asleep. It takes them a moment to notice you are back.
  let sleepT;
  let hasSlept = false;
  const wake = () => {
    if (sky.classList.contains('is-asleep')) {
      sky.classList.remove('is-asleep');
      if (!hasSlept) { hasSlept = true; whisper("oh. you're still here."); }
    }
    clearTimeout(sleepT);
    sleepT = setTimeout(() => { if (!calm() && !document.hidden) sky.classList.add('is-asleep'); }, 45000);
  };

  // ---- The road ----
  const NS = 'http://www.w3.org/2000/svg';
  const road = document.createElementNS(NS, 'svg');
  road.setAttribute('class', 'dc-road');
  road.setAttribute('aria-hidden', 'true');
  const BANDS = ['#ff8fa3', '#ffc48a', '#fff09a', '#a8eeb0', '#9fd8ff', '#c9b6ff'];
  const paths = BANDS.map((col, i) => {
    const p = document.createElementNS(NS, 'path');
    p.setAttribute('stroke', col);
    p.setAttribute('data-i', String(i));
    road.append(p);
    return p;
  });
  page.prepend(road);
  const stars = document.createElement('div');
  stars.className = 'dc-stars';
  stars.setAttribute('aria-hidden', 'true');
  page.prepend(stars);

  const sheep = document.createElement('div');
  sheep.className = 'dc-sheep';
  sheep.setAttribute('aria-hidden', 'true');
  sheep.innerHTML = `<svg viewBox="0 0 90 66"><ellipse cx="44" cy="62" rx="26" ry="3.4" fill="#1c2566" opacity=".18"/>
    <path d="M26 46v14M36 47v15M54 47v15M64 46v14" stroke="#23295e" stroke-width="4.5" stroke-linecap="round"/>
    <g fill="#fff" stroke="#c7d3f6" stroke-width="1.6"><circle cx="24" cy="30" r="13"/><circle cx="37" cy="21" r="14"/><circle cx="53" cy="22" r="14"/><circle cx="65" cy="32" r="12"/><circle cx="52" cy="38" r="13"/><circle cx="34" cy="39" r="13"/></g>
    <g fill="#fff"><circle cx="44" cy="30" r="17"/></g>
    <ellipse cx="74" cy="26" rx="11.5" ry="13.5" fill="#23295e"/><path d="M63 20l-8-3M84 21l6-3" stroke="#23295e" stroke-width="5" stroke-linecap="round"/>
    <circle cx="70" cy="24" r="3.2" fill="#fff"/><circle cx="79" cy="24" r="3.2" fill="#fff"/><circle cx="70.6" cy="24.6" r="1.5" fill="#23295e"/><circle cx="79.6" cy="24.6" r="1.5" fill="#23295e"/>
    <circle cx="66" cy="13" r="5" fill="#fff" stroke="#c7d3f6" stroke-width="1.2"/><circle cx="74" cy="11" r="5.4" fill="#fff" stroke="#c7d3f6" stroke-width="1.2"/></svg>`;
  page.prepend(sheep);

  // Notes in the empty sky beside the text
  const NOTES = { feel: 'it has been this afternoon for a long time.', how: 'the floor was warm.', palette: 'somebody is calling you for dinner.' };
  for (const [id, text] of Object.entries(NOTES)) {
    const s = document.getElementById(id);
    if (!s) continue;
    const p = document.createElement('p');
    p.className = 'dc-note';
    p.textContent = text;
    p.setAttribute('aria-hidden', 'true');
    p.style[id === 'how' ? 'right' : 'left'] = 'calc(100% + 26px)';
    s.append(p);
  }

  let table = [];
  let roadLen = 0;
  const buildRoad = () => {
    const pr = page.getBoundingClientRect();
    const pw = pr.width;
    const ph = pr.height;
    road.setAttribute('width', String(pw));
    road.setAttribute('height', String(ph));
    road.setAttribute('viewBox', `0 0 ${pw} ${ph}`);
    const wide = pw > 800;
    const pts = [];
    const horizon = hero.getBoundingClientRect();
    // It starts at the far foot of the rainbow, on the floor.
    pts.push([pw * (wide ? .86 : .78), horizon.bottom - pr.top - (wide ? 70 : 34)]);
    $$('.sec').forEach((s, i) => {
      const r = s.getBoundingClientRect();
      const left = r.left - pr.left;
      const right = pw - (r.right - pr.left);
      const top = r.top - pr.top;
      const h = r.height;
      let x;
      if (Math.max(left, right) > 200) x = right > left ? pw - right * .36 : left * .36;
      else x = pw * (i % 2 ? .72 : .28);
      const wob = wide ? 34 : 0;
      pts.push([x + wob, top + h * .15], [x - wob, top + h * .5], [x + wob * .6, top + h * .86]);
    });
    const foot = $('.foot').getBoundingClientRect();
    pts.push([pw / 2, foot.top - pr.top + foot.height * .5]);
    let d = `M${pts[0][0].toFixed(1)} ${pts[0][1].toFixed(1)}`;
    for (let i = 1; i < pts.length; i++) {
      const [ax, ay] = pts[i - 1];
      const [bx, by] = pts[i];
      const m = (by - ay) * .5;
      d += `C${ax.toFixed(1)} ${(ay + m).toFixed(1)} ${bx.toFixed(1)} ${(by - m).toFixed(1)} ${bx.toFixed(1)} ${by.toFixed(1)}`;
    }
    const base = wide ? 48 : 30;
    paths.forEach((p, i) => {
      p.setAttribute('d', d);
      p.style.strokeWidth = `${base * (1 - i / BANDS.length)}px`;
    });
    // Look-up table, so the sheep doesn't measure the path while you scroll. The curves are sampled here rather than
    // with getPointAtLength, which walks the whole path on every call and took most of a second on a slow phone.
    const line = [pts[0]];
    for (let i = 1; i < pts.length; i++) {
      const [ax, ay] = pts[i - 1];
      const [bx, by] = pts[i];
      const m = (by - ay) * .5;
      const c1 = [ax, ay + m];
      const c2 = [bx, by - m];
      for (let k = 1; k <= 24; k++) {
        const u = k / 24;
        const v = 1 - u;
        const w0 = v * v * v; const w1 = 3 * v * v * u; const w2 = 3 * v * u * u; const w3 = u * u * u;
        line.push([w0 * ax + w1 * c1[0] + w2 * c2[0] + w3 * bx, w0 * ay + w1 * c1[1] + w2 * c2[1] + w3 * by]);
      }
    }
    const at = [0];
    for (let i = 1; i < line.length; i++) at.push(at[i - 1] + Math.hypot(line[i][0] - line[i - 1][0], line[i][1] - line[i - 1][1]));
    roadLen = at[at.length - 1];
    const steps = 360;
    table = [];
    let j = 1;
    for (let i = 0; i <= steps; i++) {
      const s = (roadLen * i) / steps;
      while (j < at.length - 1 && at[j] < s) j++;
      const f = at[j] > at[j - 1] ? (s - at[j - 1]) / (at[j] - at[j - 1]) : 0;
      table.push([line[j - 1][0] + (line[j][0] - line[j - 1][0]) * f, line[j - 1][1] + (line[j][1] - line[j - 1][1]) * f]);
    }
    pageTop = pr.top + scrollY;
    placeSheep();
    placeStars();
  };

  let pageTop = 0;
  let sheepFlip = 1;
  const counter = $('.dc-count-n');
  const countEl = $('.dc-count');
  let lastCount = -1;
  let saidEnough = false;
  const placeSheep = () => {
    if (!table.length) return;
    const target = scrollY - pageTop + vh * .56;
    let lo = 0;
    let hi = table.length - 1;
    while (lo < hi) {
      const m = (lo + hi) >> 1;
      if (table[m][1] < target) lo = m + 1;
      else hi = m;
    }
    const b = table[Math.max(1, lo)];
    const a = table[Math.max(0, lo - 1)];
    const t = Math.min(1, Math.max(0, b[1] === a[1] ? 0 : (target - a[1]) / (b[1] - a[1])));
    const x = a[0] + (b[0] - a[0]) * t;
    const y = a[1] + (b[1] - a[1]) * t;
    if (Math.abs(b[0] - a[0]) > 2) sheepFlip = b[0] < a[0] ? -1 : 1;
    const hop = Math.abs(Math.sin(target / 34)) * 7;
    sheep.style.transform = `translate3d(${x.toFixed(1)}px, ${(y - hop).toFixed(1)}px, 0) scaleX(${sheepFlip})`;
    const n = Math.max(0, Math.floor(scrollY / 650));
    if (n !== lastCount) {
      lastCount = n;
      if (counter) {
        counter.textContent = String(n);
        countEl.classList.toggle('on', n > 0);
      }
    }
    if (!saidEnough && scrollY + vh > root.scrollHeight - 260) {
      saidEnough = true;
      whisper(`${Math.floor((root.scrollHeight - vh) / 650)} sheep. that's enough sheep.`);
    }
  };

  // ---- Memory: this page keeps track of you, in your own browser ----
  const KEY = 'eas-dreamcore';
  const load = () => {
    try { return { last: 0, stars: [], ...JSON.parse(localStorage.getItem(KEY) || '{}') }; } catch { return { last: 0, stars: [] }; }
  };
  const save = (m) => { try { localStorage.setItem(KEY, JSON.stringify(m)); } catch { /* private window: the dream doesn't keep */ } };
  const mem = load();
  if (!Array.isArray(mem.stars)) mem.stars = [];
  const now = Date.now();
  const days = mem.last ? Math.floor((now - mem.last) / 86400000) : -1;
  const hours = mem.last ? (now - mem.last) / 3600000 : -1;
  const when = () => {
    if (!mem.last) return 'have you been here before?';
    if (hours < 1) return 'you were just here.';
    if (days < 1) return 'you were here earlier today.';
    if (days === 1) return 'you were here yesterday. we kept your room the same.';
    return `you were here ${days} days ago. we kept your room the same.`;
  };
  const starsLine = () => {
    const n = mem.stars.length;
    if (!n) return '';
    return n === 1 ? ' your star is still here.' : ` your ${n} stars are still here.`;
  };
  const memory = document.createElement('p');
  memory.className = 'dc-memory';
  const paintMemory = () => {
    memory.innerHTML = `<span>${when()}${starsLine()}</span><span class="dc-hint">${matchMedia('(hover: hover)').matches ? 'click' : 'tap'} the sky to leave a star. it will stay.</span>`;
  };
  paintMemory();
  $('.hero-tagline').after(memory);
  mem.last = now;
  save(mem);

  const placeStars = () => {
    stars.textContent = '';
    const h = page.getBoundingClientRect().height;
    for (const s of mem.stars) {
      const i = document.createElement('i');
      i.className = 'dc-left';
      i.style.left = `${(s.x * 100).toFixed(2)}%`;
      i.style.top = `${Math.round(s.y * h)}px`;
      stars.append(i);
    }
  };
  document.addEventListener('click', (e) => {
    const t = e.target;
    // Open sky only: text, pictures and controls behave as usual.
    if (!(t === document.body || t === document.documentElement || t === page || t === hero || t.matches('main, .sec, .hero-text, .hero-kicker, .hero-tagline, .dc-memory, .dc-memory span'))) return;
    if (t.closest('.feel-body, .sec-palette, .foot, dialog, .player')) return;
    if (String(getSelection?.() || '').length) return;
    const r = page.getBoundingClientRect();
    if (e.clientX < r.left || e.clientX > r.right) return;
    const star = { x: (e.clientX - r.left) / r.width, y: (e.clientY - r.top) / r.height };
    mem.stars.push(star);
    if (mem.stars.length > 40) mem.stars.shift();
    save(mem);
    placeStars();
    stars.lastChild?.classList.add('is-new');
    paintMemory();
    whisper(mem.stars.length === 1 ? 'you left a star. it will stay.' : `that makes ${mem.stars.length}. they will stay.`);
  });

  // A small voice at the bottom of the screen
  const voice = document.createElement('div');
  voice.className = 'dc-whisper';
  voice.setAttribute('role', 'status');
  document.body.append(voice);
  let voiceT;
  function whisper(text) {
    voice.textContent = text;
    voice.classList.add('on');
    clearTimeout(voiceT);
    voiceT = setTimeout(() => voice.classList.remove('on'), 3000);
  }

  // ---- A soft trail of stars behind the mouse ----
  const trail = $('.dc-trail');
  if (trail && matchMedia('(pointer: fine)').matches) {
    const g = trail.getContext('2d');
    const dpr = Math.min(2, devicePixelRatio || 1);
    const fitTrail = () => {
      trail.width = vw * dpr;
      trail.height = vh * dpr;
    };
    fitTrail();
    addEventListener('resize', () => setTimeout(fitTrail, 200));
    const COLS = ['#fff7c2', '#ffffff', '#ffd2e6', '#cfeaff', '#e4d9ff'];
    const parts = [];
    let running = false;
    let lx = -99;
    let ly = -99;
    const drawStar = (x, y, r, rot) => {
      g.save();
      g.translate(x, y);
      g.rotate(rot);
      g.beginPath();
      for (let i = 0; i < 8; i++) {
        const R = i % 2 ? r * .34 : r;
        const a = (i * Math.PI) / 4;
        g.lineTo(Math.cos(a) * R, Math.sin(a) * R);
      }
      g.closePath();
      g.fill();
      g.restore();
    };
    let lastT = 0;
    const tick = (t) => {
      const dt = Math.min(50, t - lastT);
      lastT = t;
      g.setTransform(dpr, 0, 0, dpr, 0, 0);
      g.clearRect(0, 0, vw, vh);
      for (let i = parts.length - 1; i >= 0; i--) {
        const p = parts[i];
        p.life -= dt;
        if (p.life <= 0) { parts.splice(i, 1); continue; }
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        p.vy += .00004 * dt;
        const k = p.life / p.max;
        g.globalAlpha = Math.min(1, k * 1.4) * .95;
        g.fillStyle = p.c;
        g.shadowColor = p.c;
        g.shadowBlur = 8;
        drawStar(p.x, p.y, p.r * (.55 + k * .45), p.rot + (1 - k) * 1.2);
      }
      if (parts.length) requestAnimationFrame(tick);
      else { running = false; g.clearRect(0, 0, vw, vh); }
    };
    addEventListener('pointermove', (e) => {
      if (e.pointerType !== 'mouse' || calm()) return;
      if (Math.hypot(e.clientX - lx, e.clientY - ly) < 26) return;
      lx = e.clientX;
      ly = e.clientY;
      parts.push({ x: lx + (Math.random() - .5) * 8, y: ly + (Math.random() - .5) * 8, vx: (Math.random() - .5) * .018, vy: .012 + Math.random() * .02, r: 4 + Math.random() * 5, rot: Math.random() * 3, c: COLS[(Math.random() * COLS.length) | 0], life: 900, max: 900 });
      if (parts.length > 60) parts.shift();
      if (!running) {
        running = true;
        lastT = performance.now();
        requestAnimationFrame(tick);
      }
    }, { passive: true });
  }

  // ---- Clock ----
  let t0 = performance.now();
  let lastFrame = 0;
  const timeOffset = 0;
  const frame = (ts) => {
    requestAnimationFrame(frame);
    if (document.hidden || calm() || !clouds.length) return;
    if (ts - lastFrame < 33) return;
    lastFrame = ts;
    placeClouds(ts - t0 + timeOffset);
    aimEyes();
  };

  // ---- Keeping things in step with the page ----
  let lastY = scrollY;
  let dirT;
  let ticking = false;
  addEventListener('scroll', () => {
    if (!ticking) {
      ticking = true;
      requestAnimationFrame(() => {
        ticking = false;
        const dy = scrollY - lastY;
        lastY = scrollY;
        if (dy) {
          scrollDir = Math.sign(dy);
          clearTimeout(dirT);
          dirT = setTimeout(() => { scrollDir = 0; }, 900);
        }
        if (!calm()) placeSheep();
        wake();
      });
    }
  }, { passive: true });

  let rT;
  const onResize = () => {
    clearTimeout(rT);
    rT = setTimeout(() => {
      vw = innerWidth;
      vh = innerHeight;
      sizeClouds();
      placeClouds(performance.now() - t0 + timeOffset);
      buildRoad();
    }, 160);
  };
  addEventListener('resize', onResize);
  if ('ResizeObserver' in window) new ResizeObserver(onResize).observe(page);
  addEventListener('load', onResize);
  document.fonts?.ready.then(onResize);
  addEventListener('eas:calm', () => { placeClouds(0); aimEyes(); placeSheep(); });

  buildRoad();
  wake();
  // Clouds take a moment to make, so they arrive just after the page does.
  setTimeout(() => {
    buildSky();
    requestAnimationFrame(frame);
  }, 30);
})();
