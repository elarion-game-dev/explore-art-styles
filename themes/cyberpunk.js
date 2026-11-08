// Cyberpunk: a city painted once, neon signs that slide past as you scroll, rain that splashes on the page,
// a scanner that locks onto whatever you point at, and a gig tracker with live distances.
(() => {
  const root = document.documentElement;
  const isCalm = () => root.dataset.calm === '1';
  const make = (tag, cls, html) => { const e = document.createElement(tag); if (cls) e.className = cls; if (html) e.innerHTML = html; return e; };
  const seeded = (s) => () => { s = (s * 16807) % 2147483647; return s / 2147483647; };

  // The city: three layers of towers, drawn once and kept in calm mode because it does not move.
  const city = make('canvas', 'cp-city');
  city.setAttribute('aria-hidden', 'true');
  document.body.prepend(city);
  let cityW = 0;
  let cityH = 0;
  function drawCity() {
    const vw = innerWidth;
    const vh = innerHeight;
    if (vw === cityW && Math.abs(vh - cityH) < 120) return; // phone toolbars change the height while scrolling
    cityW = vw;
    cityH = vh;
    const dpr = Math.min(devicePixelRatio || 1, 1.5);
    city.width = Math.round(vw * dpr);
    city.height = Math.round(vh * dpr);
    const g = city.getContext('2d');
    g.setTransform(dpr, 0, 0, dpr, 0, 0);
    const r = seeded(2077);
    const sky = g.createLinearGradient(0, 0, 0, vh);
    sky.addColorStop(0, '#04050a');
    sky.addColorStop(0.5, '#0a1a1f');
    sky.addColorStop(0.78, '#142d31');
    sky.addColorStop(1, '#0a1a1f');
    g.fillStyle = sky;
    g.fillRect(0, 0, vw, vh);
    for (const [x, y, c, s] of [[0.1, 0.7, '255,1,106', 0.42], [0.88, 0.62, '0,201,255', 0.42], [0.5, 0.82, '245,125,12', 0.5]]) {
      const glow = g.createRadialGradient(vw * x, vh * y, 0, vw * x, vh * y, vw * s);
      glow.addColorStop(0, `rgba(${c},.26)`);
      glow.addColorStop(1, `rgba(${c},0)`);
      g.fillStyle = glow;
      g.fillRect(0, 0, vw, vh);
    }
    const ground = vh * 0.88;
    const warm = ['#f8cc2d', '#eea05c', '#b8bfa6', '#b8bfa6', '#3fdbea'];
    const neon = ['#ff016a', '#00c9ff', '#f57d0c', '#c5fe5c', '#fcee0a'];
    const layers = [
      { col: '#112428', lo: 0.45, hi: 0.86, wMin: 46, wMax: 110, win: 0.14, a: 0.38, w: 2, gap: 8 },
      { col: '#0a171b', lo: 0.3, hi: 0.68, wMin: 64, wMax: 150, win: 0.2, a: 0.62, w: 3, gap: 22 },
      { col: '#05090c', lo: 0.14, hi: 0.42, wMin: 80, wMax: 210, win: 0.24, a: 0.9, w: 4, gap: 54 },
    ];
    layers.forEach((L, depth) => {
      let x = -r() * 70;
      while (x < vw) {
        const w = L.wMin + r() * (L.wMax - L.wMin);
        const top = ground - (L.lo + r() * (L.hi - L.lo)) * vh;
        g.fillStyle = L.col;
        g.fillRect(x, top, w, ground - top);
        const sx = L.w * 3;
        const sy = L.w * 2.6;
        for (let yy = top + 8; yy < ground - 5; yy += sy) {
          for (let xx = x + 5; xx < x + w - 5; xx += sx) {
            if (r() < L.win) {
              g.globalAlpha = L.a * (0.35 + r() * 0.65);
              g.fillStyle = warm[Math.floor(r() * warm.length)];
              g.fillRect(xx, yy, L.w, L.w * 1.4);
            }
          }
        }
        g.globalAlpha = 1;
        if (r() < 0.45) {
          g.fillStyle = L.col;
          g.fillRect(x + w * (0.25 + r() * 0.5), top - 30, 2, 30);
          g.fillStyle = '#ff3b2f';
          g.beginPath();
          g.arc(x + w * 0.5, top - 30, 1.6, 0, 7);
          g.fill();
        }
        if (depth > 0 && r() < 0.42) {
          const c = neon[Math.floor(r() * neon.length)];
          const bw = Math.min(w * 0.46, 54);
          const bh = bw * (1.3 + r() * 1.5);
          const bx = x + r() * (w - bw);
          const by = top + 14 + r() * Math.max(10, (ground - top) * 0.4);
          g.save();
          g.shadowColor = c;
          g.shadowBlur = 28;
          g.fillStyle = c;
          g.globalAlpha = 0.86;
          g.fillRect(bx, by, bw, bh);
          g.restore();
          g.fillStyle = 'rgba(0,0,0,.55)';
          for (let k = by + 6; k < by + bh - 5; k += 9) g.fillRect(bx + 5, k, bw - 10 - r() * bw * 0.3, 4);
        }
        x += w + r() * L.gap;
      }
    });
    // The wet street mirrors the bottom of the skyline.
    const h = vh - ground;
    g.save();
    g.globalAlpha = 0.45;
    g.translate(0, ground * 2);
    g.scale(1, -1);
    g.drawImage(city, 0, (ground - h) * dpr, vw * dpr, h * dpr, 0, ground - h, vw, h);
    g.restore();
    const wet = g.createLinearGradient(0, ground, 0, vh);
    wet.addColorStop(0, 'rgba(5,9,12,.3)');
    wet.addColorStop(1, 'rgba(4,5,10,.9)');
    g.fillStyle = wet;
    g.fillRect(0, ground, vw, h);
  }
  drawCity();

  // Neon signs on both sides of the page. They scroll at their own speed, so the page feels like walking down a street.
  const SIGNS = [
    ['電脳街', 'var(--pink)', 'flick'],
    ['質屋', 'var(--orange)', ''],
    ['ラーメン', 'var(--cyan)', ''],
    ['義体修理', 'var(--green)', 'small flick b'],
    ['酒', 'var(--pink)', ''],
    ['営業中', 'var(--cyan)', 'small'],
    ['二十四時間', 'var(--orange)', 'small flick'],
    ['薬', 'var(--green)', ''],
    ['カプセルホテル', 'var(--pink)', 'small'],
    ['地下', 'var(--y)', 'flick b'],
    ['無料', 'var(--cyan)', ''],
    ['雨夜', 'var(--orange)', ''],
  ];
  const street = make('div', 'cp-street');
  street.setAttribute('aria-hidden', 'true');
  const rails = [['l', 0, 0.42], ['r', 6, 0.3]].map(([side, offset, speed]) => {
    const rail = make('div', `cp-rail ${side}`);
    const list = [...SIGNS.slice(offset), ...SIGNS.slice(0, offset)];
    for (const [text, c, cls] of [...list, ...list]) {
      const s = make('div', `cp-sign ${cls}`);
      s.textContent = text;
      s.style.setProperty('--c', c);
      rail.append(s);
    }
    street.append(rail);
    return { rail, speed };
  });
  document.body.prepend(street);

  // Ripple for the title's reflection in the street.
  const defs = make('div', '');
  defs.innerHTML = '<svg width="0" height="0" style="position:absolute" aria-hidden="true"><filter id="cp-ripple" x="-5%" y="-5%" width="110%" height="110%"><feTurbulence type="fractalNoise" baseFrequency=".006 .07" numOctaves="2" seed="3"/><feDisplacementMap in="SourceGraphic" scale="16" xChannelSelector="R" yChannelSelector="G"/></filter></svg>';
  document.body.append(defs);
  const turb = defs.querySelector('feTurbulence');
  let seed = 3;
  let lastRipple = 0;

  // Rain. Near drops stop at the top edge of whatever plate is under them and splash there.
  const rain = make('canvas', 'cp-rain fx');
  rain.setAttribute('aria-hidden', 'true');
  document.body.prepend(rain);
  const ctx = rain.getContext('2d');
  let W = 0;
  let H = 0;
  let tint;
  let drops = [];
  let splashes = [];
  let surfaces = [];
  const LEAN = -0.17; // about 10 degrees off vertical
  const spawn = (d, anywhere) => {
    d.x = Math.random() * (W + 160) - 20;
    d.y = anywhere ? Math.random() * H : -Math.random() * 120 - 30;
    d.len = d.near ? 18 + Math.random() * 20 : 9 + Math.random() * 10;
    d.v = d.near ? 1.05 + Math.random() * 0.35 : 0.62 + Math.random() * 0.22;
    return d;
  };
  function sizeRain() {
    W = innerWidth;
    H = innerHeight;
    rain.width = W;
    rain.height = H;
    tint = ctx.createLinearGradient(0, 0, W, 0);
    tint.addColorStop(0, 'rgb(255,120,170)');
    tint.addColorStop(0.28, 'rgb(190,214,232)');
    tint.addColorStop(0.72, 'rgb(190,224,240)');
    tint.addColorStop(1, 'rgb(110,226,255)');
    const n = Math.min(320, Math.round((W * H) / 5000));
    drops = Array.from({ length: n }, (_, i) => spawn({ near: i % 3 === 0 }, true));
  }
  function readSurfaces() {
    surfaces = [...document.querySelectorAll('.sec, .toc, .foot, .hero-gallery .shot-link')].map((el) => {
      const b = el.getBoundingClientRect();
      return { top: b.top + scrollY, left: b.left, right: b.right };
    });
  }
  let rafId = 0;
  let last = 0;
  function frame(t) {
    rafId = requestAnimationFrame(frame);
    const dt = Math.min(40, t - last || 16);
    last = t;
    ctx.clearRect(0, 0, W, H);
    ctx.strokeStyle = tint;
    const sy = scrollY;
    const near = [];
    ctx.lineWidth = 1;
    ctx.globalAlpha = 0.3;
    ctx.beginPath();
    for (const d of drops) {
      const prev = d.y;
      const move = d.v * dt;
      d.y += move;
      d.x += LEAN * move;
      if (d.near) {
        let hit = false;
        for (const s of surfaces) {
          const top = s.top - sy;
          if (prev < top && d.y >= top && d.x >= s.left && d.x <= s.right) {
            splashes.push({ x: d.x, y: top, life: 1 });
            hit = true;
            break;
          }
        }
        if (hit) { spawn(d, false); continue; }
        near.push(d);
      } else {
        ctx.moveTo(d.x, d.y);
        ctx.lineTo(d.x - LEAN * d.len, d.y - d.len);
      }
      if (d.y - d.len > H) spawn(d, false);
    }
    ctx.stroke();
    ctx.lineWidth = 1.4;
    ctx.globalAlpha = 0.55;
    ctx.beginPath();
    for (const d of near) {
      ctx.moveTo(d.x, d.y);
      ctx.lineTo(d.x - LEAN * d.len, d.y - d.len);
    }
    ctx.stroke();
    ctx.lineWidth = 1;
    ctx.beginPath();
    splashes = splashes.filter((s) => {
      s.life -= dt / 230;
      if (s.life <= 0) return false;
      const k = 1 - s.life;
      const spread = 3 + k * 11;
      const lift = Math.sin(k * Math.PI) * 6;
      ctx.moveTo(s.x - spread * 0.5, s.y - lift * 0.3);
      ctx.lineTo(s.x - spread, s.y - lift);
      ctx.moveTo(s.x + spread * 0.5, s.y - lift * 0.3);
      ctx.lineTo(s.x + spread, s.y - lift);
      return true;
    });
    ctx.globalAlpha = 0.8;
    ctx.stroke();
    ctx.globalAlpha = 1;
    if (t - lastRipple > 110 && scrollY < innerHeight) {
      lastRipple = t;
      seed = (seed % 40) + 1;
      turb.setAttribute('seed', seed);
    }
  }
  const runRain = () => {
    cancelAnimationFrame(rafId);
    rafId = 0;
    if (isCalm() || document.hidden) {
      ctx.clearRect(0, 0, W, H);
      return;
    }
    last = 0;
    rafId = requestAnimationFrame(frame);
  };
  sizeRain();
  readSurfaces();
  runRain();
  addEventListener('eas:calm', runRain);
  document.addEventListener('visibilitychange', runRain);
  addEventListener('load', readSurfaces);
  setInterval(readSurfaces, 2500);

  // The contents list docks to the side as a gig tracker once the hero has gone by.
  const links = [...document.querySelectorAll('.toc a')];
  const tracker = make('nav', 'cp-tracker', '<p>Gig tracker</p>');
  tracker.setAttribute('aria-label', 'Sections, with distance');
  const rows = links.map((a) => {
    const row = make('a');
    row.href = a.getAttribute('href');
    row.innerHTML = `<span></span><small></small>`;
    row.firstChild.textContent = a.textContent;
    tracker.append(row);
    return row;
  });
  document.body.append(tracker);
  const targets = links.map((a) => document.querySelector(a.getAttribute('href')));
  const hero = document.querySelector('.hero');
  let tick = false;
  function onScroll() {
    tick = false;
    const y = scrollY;
    for (const { rail, speed } of rails) {
      const loop = rail.scrollHeight / 2 || 1;
      rail.style.transform = `translate3d(0,${-((y * speed) % loop)}px,0)`;
    }
    tracker.classList.toggle('on', y > hero.offsetTop + hero.offsetHeight - 200);
    let here = -1;
    targets.forEach((el, i) => {
      if (!el) return;
      const top = el.getBoundingClientRect().top;
      if (top < innerHeight * 0.4) here = i;
      rows[i].querySelector('small').textContent = `${Math.round(Math.abs(top) / 12)} m`;
    });
    links.forEach((a, i) => { a.classList.toggle('is-here', i === here); rows[i].classList.toggle('is-here', i === here); });
  }
  const queue = () => { if (!tick) { tick = true; requestAnimationFrame(onScroll); } };
  addEventListener('scroll', queue, { passive: true });
  addEventListener('resize', () => { drawCity(); sizeRain(); readSurfaces(); queue(); });
  if (document.fonts?.ready) document.fonts.ready.then(queue);
  onScroll();

  // Scanner: brackets fly to whatever you point at and read it out.
  if (!matchMedia('(hover: hover) and (pointer: fine)').matches) return;
  const lock = make('div', 'cp-lock fx', `<i class="tl"></i><i class="tr"></i><i class="bl"></i><i class="br"></i>
    <div class="cp-card"><b></b><span class="cp-meta"></span><span class="cp-bar"></span><span class="cp-status"></span><span class="cp-id"></span></div>`);
  lock.setAttribute('aria-hidden', 'true');
  document.body.append(lock);
  const $name = lock.querySelector('b');
  const $meta = lock.querySelector('.cp-meta');
  const $bar = lock.querySelector('.cp-bar');
  const $status = lock.querySelector('.cp-status');
  const $id = lock.querySelector('.cp-id');
  let target = null;
  let scanTimer = 0;
  let hideTimer = 0;
  const hash = (s) => { let h = 7; for (const c of s) h = (h * 31 + c.codePointAt(0)) >>> 0; return h; };
  const read = (el) => {
    if (el.matches('.shot-link')) return [el.dataset.title, el.dataset.meta];
    if (el.matches('video')) return [el.getAttribute('aria-label'), 'Braindance clip'];
    if (el.matches('.track-btn')) return [el.dataset.track, el.dataset.artist];
    if (el.matches('.related a')) return [el.textContent.trim(), 'Fast travel'];
    if (el.matches('.core-item')) return [el.querySelector('h3').textContent, 'Core implant'];
    if (el.matches('.swatch button')) return [el.querySelector('.swatch-name').textContent, el.dataset.copy];
    return [el.textContent.trim(), ''];
  };
  function place() {
    if (!target) return;
    const b = target.getBoundingClientRect();
    lock.style.left = `${b.left}px`;
    lock.style.top = `${b.top}px`;
    lock.style.width = `${b.width}px`;
    lock.style.height = `${b.height}px`;
    const fitsRight = b.right + 240 < innerWidth;
    const fitsLeft = b.left > 240;
    lock.classList.toggle('flip', !fitsRight && fitsLeft);
    lock.classList.toggle('inside', !fitsRight && !fitsLeft);
  }
  function acquire(el) {
    clearTimeout(hideTimer);
    if (el === target) return;
    target = el;
    const [name, meta] = read(el);
    const h = hash(name || '');
    $name.textContent = name || '';
    $meta.textContent = meta || '';
    $id.textContent = `ID ${(h & 0xffff).toString(16).toUpperCase().padStart(4, '0')} // ${(((h >>> 8) % 400) / 10 + 2).toFixed(1)} m`;
    $status.textContent = 'Scanning';
    $bar.style.setProperty('--p', 0);
    lock.classList.remove('locked');
    place();
    lock.classList.add('on');
    clearInterval(scanTimer);
    let p = 0;
    scanTimer = setInterval(() => {
      p = Math.min(1, p + 0.12);
      $bar.style.setProperty('--p', p);
      if (p === 1) {
        clearInterval(scanTimer);
        $status.textContent = 'Target locked';
        lock.classList.add('locked');
      }
    }, 34);
  }
  function release() {
    hideTimer = setTimeout(() => {
      target = null;
      clearInterval(scanTimer);
      lock.classList.remove('on');
    }, 90);
  }
  const SEL = '.shot-link, video[data-loop], .track-btn, .related a, .core-item, .swatch button';
  document.addEventListener('mouseover', (e) => { const el = e.target.closest(SEL); if (el) acquire(el); });
  document.addEventListener('mouseout', (e) => { const el = e.target.closest(SEL); if (el && !(e.relatedTarget && el.contains(e.relatedTarget))) release(); });
  document.addEventListener('focusin', (e) => { const el = e.target.closest(SEL); if (el) acquire(el); });
  document.addEventListener('focusout', release);
  addEventListener('scroll', () => { if (target) requestAnimationFrame(place); }, { passive: true });
})();
