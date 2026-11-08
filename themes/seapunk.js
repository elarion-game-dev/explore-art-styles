// Seapunk: real water behind the page. Light is refracted through a wave surface into caustics, your pointer stirs that surface,
// and deep down the same ripples light up plankton. Everything else here floats on top of that.
(() => {
  const root = document.documentElement;
  const $ = (q, el = document) => el.querySelector(q);
  const $$ = (q, el = document) => [...el.querySelectorAll(q)];
  const calm = () => root.dataset.calm === '1';
  const el = (tag, cls, html) => { const e = document.createElement(tag); if (cls) e.className = cls; if (html != null) e.innerHTML = html; return e; };

  // ---- Shared SVG parts ----
  const DOLPHIN = 'M196 57C190 52 180 50 172 49C168 38 150 28 128 26C122 26 116 26 110 27C100 22 92 12 84 5C86 14 85 23 82 31C66 36 50 44 34 54C28 58 22 60 16 58C10 52 6 44 2 39C2 50 6 60 14 66C8 72 4 80 3 89C12 82 22 74 30 68C46 69 62 70 82 72C96 74 92 86 86 95C100 91 114 82 124 72C140 71 160 68 172 64C180 63 190 61 196 57Z';
  const defs = el('div');
  defs.innerHTML = `<svg class="sp-defs" aria-hidden="true" focusable="false">
    <defs>
      <filter id="sp-refract" x="-6%" y="-40%" width="112%" height="180%" color-interpolation-filters="sRGB">
        <feTurbulence type="fractalNoise" baseFrequency=".007 .05" numOctaves="2" seed="4" result="n"/>
        <feOffset id="sp-refract-move" in="n" dx="0" dy="0" result="m"/>
        <feDisplacementMap in="SourceGraphic" in2="m" scale="30" xChannelSelector="R" yChannelSelector="G"/>
      </filter>
      <filter id="sp-slick" x="0" y="0" width="100%" height="100%" color-interpolation-filters="sRGB">
        <feTurbulence type="fractalNoise" baseFrequency=".016 .05" numOctaves="3" seed="9" result="n"/>
        <feColorMatrix in="n" type="matrix" values="1 0 0 0 0 1 0 0 0 0 1 0 0 0 0 0 0 0 0 1" result="g"/>
        <feComponentTransfer in="g" result="bands">
          <feFuncR type="table" tableValues=".1 .1 .95 .2 .55 .98 .15 .8 .2 .9"/>
          <feFuncG type="table" tableValues=".8 .9 .25 .95 .2 .7 .95 .2 .8 .4"/>
          <feFuncB type="table" tableValues=".9 .8 .95 .6 .98 .35 .9 .98 .95 .9"/>
        </feComponentTransfer>
        <feComposite in="bands" in2="SourceAlpha" operator="in" result="skin"/>
        <feBlend in="skin" in2="SourceGraphic" mode="overlay"/>
      </filter>
      <linearGradient id="sp-skin" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stop-color="#2d2a9c"/><stop offset=".5" stop-color="#5f6fe0"/><stop offset=".78" stop-color="#b8f0ff"/><stop offset="1" stop-color="#f6ffff"/>
      </linearGradient>
      <linearGradient id="sp-chrome" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stop-color="#eefcff"/><stop offset=".42" stop-color="#7fb4e8"/><stop offset=".5" stop-color="#0a2252"/><stop offset=".62" stop-color="#6d8fc0"/><stop offset="1" stop-color="#f4ffff"/>
      </linearGradient>
      <linearGradient id="sp-bell" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stop-color="#ffb8f4" stop-opacity=".95"/><stop offset=".6" stop-color="#9dbcff" stop-opacity=".7"/><stop offset="1" stop-color="#a0fff0" stop-opacity=".45"/>
      </linearGradient>
      <symbol id="sp-dolphin" viewBox="0 0 200 100" overflow="visible">
        <path d="${DOLPHIN}" fill="url(#sp-skin)" filter="url(#sp-slick)"/>
        <path d="M128 30C112 31 92 35 74 41" fill="none" stroke="#fff" stroke-opacity=".75" stroke-width="2.4" stroke-linecap="round"/>
        <path d="M195 57C186 55 178 56 170 58" fill="none" stroke="#10163f" stroke-width="1.6" stroke-linecap="round"/>
        <circle cx="160" cy="47" r="2.3" fill="#0a0f33"/><circle cx="159.4" cy="46.2" r=".7" fill="#fff"/>
      </symbol>
    </defs></svg>`;
  document.body.prepend(defs.firstElementChild);
  const dolphinSvg = (cls = '') => `<svg class="${cls}" viewBox="0 0 200 100" aria-hidden="true"><use href="#sp-dolphin"/></svg>`;

  // ---- The surface scene ----
  const heroText = $('.hero-text');
  heroText.prepend(el('div', 'sp-horizon'));
  const sun = el('div', 'sp-sun', '<i></i>');
  sun.setAttribute('aria-hidden', 'true');
  heroText.prepend(el('div', 'sp-glitter'));
  heroText.prepend(sun);
  const pyr = el('div', '', `<svg class="sp-pyr" viewBox="0 0 200 180" aria-hidden="true">
      <defs><linearGradient id="sp-pyr-l" x1="0" x2="1"><stop offset="0" stop-color="#3b2bb8"/><stop offset="1" stop-color="#7f90f5"/></linearGradient>
      <linearGradient id="sp-pyr-r" x1="0" x2="1"><stop offset="0" stop-color="#d8ffff"/><stop offset="1" stop-color="#7fe0ee"/></linearGradient>
      <linearGradient id="sp-fade" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stop-color="#fff" stop-opacity=".55"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></linearGradient>
      <mask id="sp-pyr-mask"><rect y="119" width="200" height="61" fill="url(#sp-fade)"/></mask></defs>
      <g filter="url(#sp-slick)"><polygon points="106,2 62,119 2,119" fill="url(#sp-pyr-l)"/><polygon points="106,2 198,119 62,119" fill="url(#sp-pyr-r)"/></g>
      <g mask="url(#sp-pyr-mask)"><g transform="translate(0 238) scale(1 -1)" style="filter:url(#sp-refract)"><polygon points="106,2 62,119 2,119" fill="#3b2bb8"/><polygon points="106,2 198,119 62,119" fill="#a8f0f8"/></g></g>
    </svg>`).firstElementChild;
  heroText.prepend(pyr);
  const leapBox = el('div', 'sp-leapbox', dolphinSvg('sp-leap'));
  leapBox.setAttribute('aria-hidden', 'true');
  heroText.append(leapBox);
  const leap = $('.sp-leap', leapBox);
  const refractMove = $('#sp-refract-move');

  // ---- Creatures ----
  const fauna = el('div', 'sp-fauna', `
    <div class="sp-swim" style="top:18vh;--s:240px;--t:44s;--d:-9s">${dolphinSvg()}</div>
    <div class="sp-swim flip" style="top:58vh;--s:170px;--t:62s;--d:-30s">${dolphinSvg()}</div>
    <div class="sp-swim" style="top:76vh;--s:110px;--t:80s;--d:-56s">${dolphinSvg()}</div>
    ${[[5, 26, 110, 34], [84, 44, 86, 28], [11, 66, 64, 41], [90, 72, 120, 37]].map(([x, y, s, t]) => `<div class="sp-jelly" style="--x:${x}%;--y:${y}%;--s:${s}px;--t:${t}s"><svg viewBox="0 0 100 150" aria-hidden="true"><path d="M8 42C8 16 28 4 50 4s42 12 42 38c-6-5-11 3-18-1-6-4-11 3-18 0-6-3-11 3-18 0-6-3-11 3-18 0-6-4-12 4-18 1z" fill="url(#sp-bell)"/><path d="M22 12C30 7 42 6 50 7" fill="none" stroke="#fff" stroke-opacity=".8" stroke-width="3" stroke-linecap="round"/><path d="M24 46c-6 20 8 34 0 60M38 48c-5 26 8 44 2 82M52 48c6 28-8 46 0 92M66 48c-5 26 8 40 2 74M78 46c5 18-6 30 2 54" fill="none" stroke="#c9f7ff" stroke-opacity=".6" stroke-width="2.2" stroke-linecap="round"/></svg></div>`).join('')}`);
  fauna.setAttribute('aria-hidden', 'true');
  document.body.prepend(fauna);

  // ---- Water ----
  const cv = el('canvas', 'sp-water');
  cv.setAttribute('aria-hidden', 'true');
  document.body.prepend(cv);
  const ctx = cv.getContext('2d');
  let FW = 0; let FH = 0; let PW = 0; let PH = 0; let RW = 0; let RH = 0;
  let F; let rA; let rB; let rdx; let rdy; let img; let spark;
  let waves = [];
  let energy = 0;
  let vw = 0; let vh = 0;
  // How fine the water is drawn. It starts full and steps down if a frame of water takes too long on this device,
  // so a slow laptop or phone keeps a smooth page instead of a fine but stuttering sea.
  const QUALITY = [1, .75, .55, .4];
  let quality = 0;
  let cost = 0;
  let costFrames = 0;

  const setup = () => {
    // The bend in the title scales with its size, so it stays readable on a phone
    const fs = parseFloat(getComputedStyle($('.hero-title')).fontSize) || 200;
    $('#sp-refract feDisplacementMap').setAttribute('scale', Math.max(7, Math.min(30, fs * .12)).toFixed(1));
    vw = innerWidth;
    vh = innerHeight;
    const big = vw >= 900;
    FW = Math.round((big ? 340 : 180) * QUALITY[quality]);
    FH = Math.max(60, Math.min(big ? 230 : 360, Math.round((FW * vh) / vw)));
    PW = FW * 2;
    PH = FH * 2;
    RW = (FW >> 1) + 3;
    RH = (FH >> 1) + 3;
    F = new Float32Array(FW * FH);
    rA = new Float32Array(RW * RH);
    rB = new Float32Array(RW * RH);
    rdx = new Float32Array(RW * RH);
    rdy = new Float32Array(RW * RH);
    img = ctx.createImageData(FW, FH);
    cv.width = FW;
    cv.height = FH;
    let s = 73;
    const rnd = () => { s = (s * 16807) % 2147483647; return s / 2147483647; };
    spark = new Float32Array(FW * FH);
    for (let i = 0; i < spark.length; i++) spark[i] = rnd() < .11 ? .35 + rnd() * .65 : 0;
    // Wavelengths are set in screen pixels, so the pattern is the same size on every display.
    const cssPerPhoton = vw / PW;
    waves = [[150, 19, .5, .36], [106, 77, .44, .48], [76, 138, .4, .62], [54, 201, .32, .8], [38, 292, .22, 1.04]].map(([lambda, deg, focus, speed]) => {
      const k = (Math.PI * 2) / (lambda / cssPerPhoton);
      const ax = Math.cos((deg * Math.PI) / 180);
      const ay = Math.sin((deg * Math.PI) / 180);
      const a = focus / k;
      const cx = new Float32Array(PW);
      const sx = new Float32Array(PW);
      for (let x = 0; x < PW; x++) { cx[x] = Math.cos(k * ax * x); sx[x] = Math.sin(k * ax * x); }
      return { kx: k * ax, ky: k * ay, ax: ax * a, ay: ay * a, w: speed * 1.3, cx, sx, p: lambda };
    });
  };

  const drop = (cssX, cssY, strength) => {
    const gx = Math.round((cssX / vw) * (RW - 3)) + 1;
    const gy = Math.round((cssY / vh) * (RH - 3)) + 1;
    if (gx < 2 || gy < 2 || gx > RW - 3 || gy > RH - 3) return;
    const i = gy * RW + gx;
    rA[i] += strength;
    const side = strength * .55;
    rA[i - 1] += side; rA[i + 1] += side; rA[i - RW] += side; rA[i + RW] += side;
    energy = 1;
  };

  const stepRipples = () => {
    if (energy < .002) return;
    let sum = 0;
    const w = RW;
    for (let y = 1; y < RH - 1; y++) {
      let i = y * w + 1;
      for (let x = 1; x < w - 1; x++, i++) {
        const n = ((rA[i - 1] + rA[i + 1] + rA[i - w] + rA[i + w]) * .5 - rB[i]) * .978;
        rB[i] = n;
        sum += n * n;
      }
    }
    const t = rA; rA = rB; rB = t;
    energy = Math.min(1, Math.sqrt(sum / (w * RH)) * 3);
    for (let y = 1; y < RH - 1; y++) {
      let i = y * w + 1;
      for (let x = 1; x < w - 1; x++, i++) {
        rdx[i] = rA[i + 1] - rA[i - 1];
        rdy[i] = rA[i + w] - rA[i - w];
      }
    }
  };

  let depth = 0;
  const drawWater = (t) => {
    const s = Math.min(1, Math.max(0, 1 - depth / .62));
    const sun2 = s * s * (3 - 2 * s);
    const deep = Math.min(1, Math.max(0, (depth - .34) / .3));
    const data = img.data;
    const rippleOn = energy >= .002;
    if (sun2 > .02) {
      F.fill(0);
      const nw = waves.length;
      const cy = new Float32Array(nw);
      const sy = new Float32Array(nw);
      const RG = 17;
      for (let y = 0; y < PH; y++) {
        for (let j = 0; j < nw; j++) {
          const ph = waves[j].ky * y + waves[j].w * t;
          cy[j] = Math.cos(ph);
          sy[j] = Math.sin(ph);
        }
        const ry = y >> 2;
        const vf = (y & 3) * .25;
        for (let x = 0; x < PW; x++) {
          let dx = 0;
          let dy = 0;
          for (let j = 0; j < nw; j++) {
            const W = waves[j];
            const c = W.cx[x] * cy[j] - W.sx[x] * sy[j];
            dx += W.ax * c;
            dy += W.ay * c;
          }
          if (rippleOn) {
            const rx = x >> 2;
            const uf = (x & 3) * .25;
            const i0 = (ry + 1) * RW + rx + 1;
            const a0 = rdx[i0] + (rdx[i0 + 1] - rdx[i0]) * uf;
            const a1 = rdx[i0 + RW] + (rdx[i0 + RW + 1] - rdx[i0 + RW]) * uf;
            const b0 = rdy[i0] + (rdy[i0 + 1] - rdy[i0]) * uf;
            const b1 = rdy[i0 + RW] + (rdy[i0 + RW + 1] - rdy[i0 + RW]) * uf;
            dx += (a0 + (a1 - a0) * vf) * RG;
            dy += (b0 + (b1 - b0) * vf) * RG;
          }
          const fx = (x + dx) * .5;
          const fy = (y + dy) * .5;
          if (fx < 0 || fy < 0 || fx >= FW - 1 || fy >= FH - 1) continue;
          const ix = fx | 0;
          const iy = fy | 0;
          const u = fx - ix;
          const v = fy - iy;
          const i = iy * FW + ix;
          F[i] += (1 - u) * (1 - v);
          F[i + 1] += u * (1 - v);
          F[i + FW] += (1 - u) * v;
          F[i + FW + 1] += u * v;
        }
      }
    }
    const gain = sun2 * .3;
    for (let y = 0; y < FH; y++) {
      const gy = (y >> 1) + 1;
      let i = y * FW;
      let p = i * 4;
      for (let x = 0; x < FW; x++, i++, p += 4) {
        let a = 0;
        if (sun2 > .02) {
          a = (F[i] * .25 - 1.02) * gain;
          if (a < 0) a = 0; else if (a > .5) a = .5;
        }
        let g = 0;
        if (deep > 0 && rippleOn && spark[i] > 0) {
          const h = rA[gy * RW + (x >> 1) + 1];
          g = Math.abs(h) * spark[i] * deep * .62;
          if (g > 1) g = 1;
        }
        if (g > a) {
          data[p] = 150; data[p + 1] = 255; data[p + 2] = 238; data[p + 3] = g * 255;
        } else {
          data[p] = 226; data[p + 1] = 255; data[p + 2] = 252; data[p + 3] = a * 255;
        }
      }
    }
    ctx.putImageData(img, 0, 0);
  };

  // Pointer and touch stir the water
  let lastPX = -1; let lastPY = -1;
  addEventListener('pointermove', (e) => {
    if (calm() || e.pointerType === 'touch') return;
    const d = Math.hypot(e.clientX - lastPX, e.clientY - lastPY);
    if (d < 8) return;
    lastPX = e.clientX; lastPY = e.clientY;
    drop(e.clientX, e.clientY, Math.min(5, 1.4 + d * .05));
  }, { passive: true });
  addEventListener('pointerdown', (e) => { if (!calm()) drop(e.clientX, e.clientY, 11); }, { passive: true });
  addEventListener('touchmove', (e) => { if (!calm()) { const t = e.touches[0]; drop(t.clientX, t.clientY, 3.5); } }, { passive: true });

  // ---- A dolphin leaps out of the water now and then ----
  const leapState = { t0: 1.4, dur: 2, x0: 0, x1: 0, dir: 1, wet: 0 };
  const planLeap = (now) => {
    const box = leapBox.getBoundingClientRect();
    const dir = Math.random() < .5 ? 1 : -1;
    const w = box.width;
    const start = w * (dir > 0 ? .05 + Math.random() * .42 : .95 - Math.random() * .42);
    leapState.x0 = start;
    leapState.x1 = start + dir * Math.min(w * .38, 460);
    leapState.dir = dir;
    leapState.t0 = now + 2.4 + Math.random() * 5;
    leapState.wet = 0;
  };
  const leapFrame = (now) => {
    const u = (now - leapState.t0) / leapState.dur;
    const box = leapBox.getBoundingClientRect();
    const size = leap.getBoundingClientRect().width || 200;
    if (u < 0 || box.bottom < 60) {
      leap.style.transform = 'translate(-9999px,0)';
      return;
    }
    if (u > 1) { planLeap(now); return; }
    const peak = Math.min(box.height * .52, size * .86);
    const hgt = peak * (4 * u * (1 - u)) * 1.22 - peak * .22;
    const x = leapState.x0 + (leapState.x1 - leapState.x0) * u;
    const rot = (u - .5) * 92;
    leap.style.transform = `translate(${x.toFixed(1)}px, ${(box.height - hgt - size * .25).toFixed(1)}px) scale(${leapState.dir}, 1) rotate(${rot.toFixed(1)}deg)`;
    const wet = hgt > 0 ? 1 : 0;
    if (wet !== leapState.wet) {
      leapState.wet = wet;
      if (u > .02) for (let k = 0; k < 3; k++) drop(box.left + x + size * .3 * k, box.bottom + 4, 13);
    }
  };
  const posedLeap = () => {
    const box = leapBox.getBoundingClientRect();
    const size = leap.getBoundingClientRect().width || 200;
    leap.style.transform = `translate(${(box.width * .14).toFixed(1)}px, ${(box.height - size * .92).toFixed(1)}px) rotate(-16deg)`;
  };

  // ---- The frame loop ----
  let raf = 0;
  let running = false;
  let last = 0;
  let T = 40;
  let idle = 0;
  let lag = 0;
  let lastY = scrollY;
  const page = $('.page');
  const measure = () => {
    const max = Math.max(1, document.documentElement.scrollHeight - innerHeight);
    depth = Math.min(1, scrollY / max);
    const zone = depth < .3 ? 'top' : depth < .68 ? 'mid' : 'deep';
    if (root.dataset.zone !== zone) root.dataset.zone = zone;
  };
  const frame = (now) => {
    raf = 0;
    if (!running) return;
    raf = requestAnimationFrame(frame);
    if (now - last < 32) return;
    const dt = Math.min(.08, (now - last) / 1000);
    last = now;
    T += dt;
    measure();
    idle += dt;
    if (idle > 1.3) { idle = 0; drop(Math.random() * vw, Math.random() * vh, 3 + Math.random() * 3); }
    const t0 = performance.now();
    stepRipples();
    drawWater(T);
    cost = cost * .85 + (performance.now() - t0) * .15;
    if (++costFrames > 20 && cost > 9 && quality < QUALITY.length - 1) {
      quality += 1;
      costFrames = 0;
      cost = 0;
      setup();
    }
    if (scrollY < innerHeight) {
      leapFrame(T);
      refractMove.setAttribute('dx', (Math.sin(T * .9) * 22).toFixed(1));
      refractMove.setAttribute('dy', (Math.sin(T * 1.7) * 14).toFixed(1));
    }
    // Posts lag behind the scroll a little, as anything floating would
    const dy = scrollY - lastY;
    lastY = scrollY;
    lag += (Math.max(-24, Math.min(24, -dy * .24)) - lag) * .1;
    if (Math.abs(lag) > .05) page.style.setProperty('--lag', lag.toFixed(2));
    else if (lag !== 0) { lag = 0; page.style.removeProperty('--lag'); }
  };
  const sync = () => {
    const should = !document.hidden && !calm();
    if (should && !running) { running = true; last = performance.now(); planLeap(T - 4); leapState.t0 = T + .8; raf = requestAnimationFrame(frame); }
    if (!should && running) { running = false; cancelAnimationFrame(raf); raf = 0; }
    if (calm()) {
      page.style.removeProperty('--lag');
      measure();
      energy = 0;
      drawWater(T);
      posedLeap();
    }
  };
  document.addEventListener('visibilitychange', sync);
  addEventListener('eas:calm', sync);
  addEventListener('scroll', () => { if (calm()) { measure(); drawWater(T); } }, { passive: true });
  let resizeTimer;
  addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => { setup(); measure(); drawWater(T); if (calm()) posedLeap(); }, 150);
  });

  // ---- Posts ----
  const ZONES = {
    feel: ['Sunlight zone, 20 m', ['aquatic', 'netart', 'tumblr2011'], 3140],
    core: ['Sunlight zone, 120 m', ['dolphin', 'yinyang', 'oilslick', 'reblog'], 2716],
    how: ['Twilight zone, 400 m', ['caustics', 'blender', 'shaders', 'tutorial'], 2298],
    palette: ['Twilight zone, 900 m', ['seaglass', 'iridescent'], 1875],
    vibe: ['Midnight zone, 2,000 m', ['gifs', 'audiopost', 'ecco'], 1431],
    refs: ['Abyssal zone, 4,500 m', ['archive', 'ecco', 'abzu', 'aquaria'], 988],
    related: ['Hadal zone, 6,500 m', ['reblog'], 402],
  };
  const heart = '<svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true"><path d="M12 21C5 15 2 11.5 2 8a5.2 5.2 0 0 1 10-2 5.2 5.2 0 0 1 10 2c0 3.500-3 7-10 13z"/></svg>';
  const toastEl = $('[data-toast]');
  let toastTimer;
  const toast = (msg) => { toastEl.textContent = msg; toastEl.classList.add('on'); clearTimeout(toastTimer); toastTimer = setTimeout(() => toastEl.classList.remove('on'), 1800); };
  for (const sec of $$('main > .sec')) {
    const z = ZONES[sec.id];
    if (!z) continue;
    const h = $('.sec-title', sec);
    const label = h.textContent;
    h.setAttribute('aria-label', label);
    h.innerHTML = '';
    const b = el('b');
    b.textContent = label;
    const i = el('i');
    i.textContent = z[0];
    h.append(b, i);
    const notes = el('div', 'sp-notes', `<span class="sp-tags">${z[1].map((t) => `#${t}`).join(' ')}</span>
      <button class="sp-like" type="button" aria-pressed="false" aria-label="Like this post">${heart}<span>${z[2].toLocaleString('en-US')}</span> notes</button>
      <button class="sp-reblog" type="button" aria-label="Copy a link to this section">Reblog</button>`);
    sec.append(notes);
    const like = $('.sp-like', notes);
    like.addEventListener('click', () => {
      const on = like.getAttribute('aria-pressed') !== 'true';
      like.setAttribute('aria-pressed', String(on));
      $('span', like).textContent = (z[2] + (on ? 1 : 0)).toLocaleString('en-US');
      if (on && !calm()) {
        const r = like.getBoundingClientRect();
        for (let k = 0; k < 4; k++) drop(r.left + r.width / 2 + (k - 1.5) * 60, r.top + (k % 2) * 40, 16);
      }
    });
    $('.sp-reblog', notes).addEventListener('click', async () => {
      const url = `${location.href.split('#')[0]}#${sec.id}`;
      try { await navigator.clipboard.writeText(url); toast('Link copied. Reblog it anywhere.'); } catch { toast(url); }
    });
  }

  for (const t of $$('.shot-title')) if (t.textContent.startsWith('#')) t.classList.add('no-hash');

  // ---- The sea floor ----
  const column = (x, base, w, h, broken) => `<g transform="translate(${x} ${base})"><path d="M${-w * .7} 0h${w * 1.4}v-9h${-w * 1.4}z" fill="#8f86b8"/><path d="M${-w * .5} -9L${-w * .46} ${-h}${broken ? `l${w * .3} 12l${w * .2} -10l${w * .25} 15l${w * .17} -6` : `h${w * .92}`}L${w * .5} -9z" fill="#b6aed6"/><path d="M${-w * .25} -9V${-h + 8}M0 -9V${-h + (broken ? 18 : 8)}M${w * .25} -9V${-h + (broken ? 18 : 8)}" stroke="#7c72a8" stroke-width="2.6"/>${broken ? '' : `<path d="M${-w * .8} ${-h}h${w * 1.6}v-10h${-w * 1.6}z" fill="#c7c0e2"/><circle cx="${-w * .68}" cy="${-h - 2}" r="7" fill="#c7c0e2"/><circle cx="${w * .68}" cy="${-h - 2}" r="7" fill="#c7c0e2"/>`}</g>`;
  const coral = (x, y, c) => `<g transform="translate(${x} ${y})" fill="none" stroke="${c}" stroke-width="7" stroke-linecap="round"><path d="M0 0V-46M0 -24L-20 -46M0 -30L22 -58M-20 -46V-66M22 -58L14 -78M22 -58L38 -70M0 -46L-6 -70M0 -46L10 -72"/></g>`;
  const floor = el('div', '', `<svg class="sp-floor" viewBox="0 0 1440 300" aria-hidden="true">
      <defs><linearGradient id="sp-sand" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stop-color="#4f4284"/><stop offset="1" stop-color="#2a1f55"/></linearGradient>
      <radialGradient id="sp-pearl" cx=".35" cy=".3" r=".8"><stop offset="0" stop-color="#fff"/><stop offset=".4" stop-color="#a0fff0"/><stop offset=".72" stop-color="#ff9df2"/><stop offset="1" stop-color="#3d2a8c"/></radialGradient></defs>
      ${coral(180, 196, '#ff4d9d')}${coral(226, 210, '#c9ff6b')}${coral(1270, 204, '#ff9df2')}${coral(1218, 190, '#7fe8ff')}
      ${column(420, 214, 54, 150, false)}${column(560, 222, 54, 84, true)}
      <g transform="translate(968 92) rotate(14)"><path d="M0 0h108l16 16v108H0z" fill="#2c2960" stroke="#a9b0ec" stroke-width="3"/><rect x="22" y="0" width="66" height="38" fill="#c9cee6"/><rect x="62" y="6" width="16" height="26" fill="#1d1b3a"/><rect x="16" y="66" width="90" height="58" fill="#eefbff"/><path d="M26 82h70M26 96h70M26 110h44" stroke="#8fa2c8" stroke-width="3"/></g>
      <path d="M0 214C120 176 240 204 360 214s220 20 330 6 210-44 330-30 200 30 420-4V300H0z" fill="url(#sp-sand)"/>
      <path d="M0 250C200 226 340 262 520 256s240-26 420-16 280 24 500-6V300H0z" fill="#3a2e6c"/>
      <g transform="translate(792 192)"><path d="M-62 26C-58 -34 58 -34 62 26z" fill="#7c5aa8" stroke="#2a1f55" stroke-width="3"/><path d="M-44 20L-26 -22M-16 20L-8 -30M16 20L8 -30M44 20L26 -22" stroke="#2a1f55" stroke-width="2.5"/><circle cx="0" cy="24" r="24" fill="url(#sp-pearl)"/><path d="M-66 28C-48 54 48 54 66 28z" fill="#6b4c98" stroke="#2a1f55" stroke-width="3"/></g>
      <g transform="translate(90 214) rotate(-16)"><circle r="34" fill="#f6feff"/><path d="M0 -34a34 34 0 0 1 0 68a17 17 0 0 1 0-34a17 17 0 0 0 0-34z" fill="#07234b"/><circle cy="-17" r="5.500" fill="#07234b"/><circle cy="17" r="5.500" fill="#f6feff"/></g>
    </svg>`).firstElementChild;
  $('.foot').prepend(floor);

  // ---- Start ----
  setup();
  measure();
  drawWater(T);
  posedLeap();
  sync();
})();
