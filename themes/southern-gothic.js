// Southern Gothic: the sky behind the page goes from dusk to night as you scroll, three layers of flat roadside
// silhouettes slide past the bottom of the window like the view from a passenger seat (porch lights and the gas
// station sign come on as it gets dark), a route shield heads the page, and a car radio dial tunes to each track.
(() => {
  const root = document.documentElement;
  const calm = () => root.dataset.calm === '1';
  const $ = (q, el = document) => el.querySelector(q);
  const $$ = (q, el = document) => [...el.querySelectorAll(q)];

  // A repeatable random series, so the roadside is the same on every visit
  let seed = 1930;
  const rnd = () => { seed = (seed * 9301 + 49297) % 233280; return seed / 233280; };
  const f = (n) => n.toFixed(1);
  const TAU = Math.PI * 2;

  // ---------- Route shield and kicker ----------
  const kicker = $('.hero-kicker');
  if (kicker) {
    const text = kicker.textContent;
    const id = document.body.dataset.id || '60';
    kicker.innerHTML = `<svg class="sg-shield" viewBox="0 0 60 64" aria-hidden="true"><path d="M6 3h48c1 4 3 7 6 8-1 6-2 12-1 18 1 14-9 26-29 33C10 55 0 43 1 29c1-6 0-12-1-18 3-1 5-4 6-8z" fill="#f4f4ee" stroke="#111" stroke-width="2.6"/><path d="M10 7h40c1 3 2 5 4 6-1 5-1 10 0 16 1 11-7 21-24 28C13 50 5 40 6 29c1-6 1-11 0-16 2-1 3-3 4-6z" fill="none" stroke="#111" stroke-width="1"/><text x="30" y="43" text-anchor="middle" font-family="Overpass, Arial, sans-serif" font-weight="800" font-size="27" fill="#111">${id}</text></svg><span></span>`;
    $('span', kicker).textContent = text;
  }

  // ---------- Sky ----------
  const sky = document.createElement('div');
  sky.className = 'sg-sky';
  sky.setAttribute('aria-hidden', 'true');
  sky.innerHTML = '<div class="sg-stars"></div><div class="sg-moon"></div>';
  document.body.prepend(sky);

  // ---------- Roadside ----------
  const W = 1800;
  const H = 260;
  const ground = (x, base, a, b) => base + a * Math.sin((TAU * 3 * x) / W) + b * Math.sin((TAU * 7 * x) / W + 1);
  const circ = (cx, cy, r) => `M${f(cx - r)} ${f(cy)}a${f(r)} ${f(r)} 0 1 0 ${f(2 * r)} 0a${f(r)} ${f(r)} 0 1 0 ${f(-2 * r)} 0z`;

  const farTile = () => {
    let d = `M0 ${H}`;
    for (let x = 0; x <= W; x += 20) d += `L${x} ${f(ground(x, 176, 12, 6))}`;
    d += `L${W} ${H}Z`;
    for (let x = 90; x < W - 120; x += 70 + rnd() * 120) {
      const base = ground(x, 176, 12, 6);
      const spread = 80 + rnd() * 90;
      const lumps = 5 + Math.floor(rnd() * 4);
      const trunk = 22 + rnd() * 10;
      d += `M${f(x - 5)} ${f(base)}l2-${f(trunk)}h6l2 ${f(trunk)}zM${f(x - 2)} ${f(base - trunk + 4)}l-${f(spread * 0.3)}-12 2-3 ${f(spread * 0.3)} 10zM${f(x + 2)} ${f(base - trunk + 6)}l${f(spread * 0.32)}-10-2-3-${f(spread * 0.32)} 8z`;
      for (let i = 0; i < lumps; i += 1) {
        const u = i / (lumps - 1);
        const cx = x - spread / 2 + spread * u + (rnd() - 0.5) * 12;
        const cy = base - trunk - 8 - Math.sin(u * Math.PI) * 12 - rnd() * 6;
        const rx = 16 + rnd() * 14;
        const ry = rx * (0.45 + rnd() * 0.15);
        d += `M${f(cx - rx)} ${f(cy)}a${f(rx)} ${f(ry)} 0 1 0 ${f(2 * rx)} 0a${f(rx)} ${f(ry)} 0 1 0 ${f(-2 * rx)} 0z`;
        for (let k = 0; k < 4; k += 1) {
          const mx = cx + (rnd() - 0.5) * rx * 1.6;
          d += `M${f(mx)} ${f(cy + ry * 0.6)}l1.6 0 ${f(rnd() * 2 - 1)} ${f(10 + rnd() * 22)}h-1.4z`;
        }
      }
    }
    return `<path d="${d}" fill="currentColor"/>`;
  };

  const midTile = () => {
    const g = (x) => ground(x, 214, 5, 3);
    let d = `M0 ${H}`;
    for (let x = 0; x <= W; x += 30) d += `L${x} ${f(g(x))}`;
    d += `L${W} ${H}Z`;
    let lights = '';
    let glow = '';
    // cypress stands
    for (let x = 60; x < W - 60; x += 46 + rnd() * 160) {
      if ((x > 300 && x < 520) || (x > 840 && x < 1000) || (x > 1240 && x < 1400) || (x > 1520 && x < 1720)) continue;
      const b = g(x);
      const h = 70 + rnd() * 70;
      d += `M${f(x - 12)} ${f(b)}Q${f(x - 4)} ${f(b - 10)} ${f(x - 2.5)} ${f(b - h * 0.4)}L${f(x - 1.5)} ${f(b - h)}h3L${f(x + 2.5)} ${f(b - h * 0.4)}Q${f(x + 4)} ${f(b - 10)} ${f(x + 12)} ${f(b)}z`;
      const tiers = 3 + Math.floor(rnd() * 2);
      for (let i = 0; i < tiers; i += 1) {
        const cy = b - h + i * 13 + rnd() * 4;
        const cx = x + (rnd() - 0.5) * 16;
        const rx = 18 + rnd() * 12 - i * 2;
        d += `M${f(cx - rx)} ${f(cy)}q${f(rx * 0.3)} ${f(-9 - rnd() * 4)} ${f(rx)} ${f(-6)}q${f(rx * 0.7)} ${f(1)} ${f(rx)} ${f(6)}q${f(-rx * 0.5)} ${f(5)} ${f(-rx)} ${f(3)}q${f(-rx * 0.5)} ${f(1)} ${f(-rx)} ${f(-3)}z`;
        for (let k = 0; k < 3; k += 1) d += `M${f(cx + (rnd() - 0.5) * rx * 1.5)} ${f(cy + 2)}h1.6l${f(rnd() * 2 - 1)} ${f(8 + rnd() * 16)}h-1.4z`;
      }
      if (rnd() < 0.6) d += `M${f(x + 16)} ${f(b)}l3-9h3l2 9zM${f(x - 22)} ${f(b)}l2-6h2l2 6z`;
    }
    // a farmhouse on a rise, with a porch
    { const x = 340; const b = g(x);
      d += `M${x} ${f(b)}v-54h130v54zM${x - 8} ${f(b - 54)}l73-36 73 36zM${x + 96} ${f(b - 80)}v-22h12v28zM${x - 26} ${f(b - 26)}h26v-4h-30zM${x - 24} ${f(b)}v-26h3v26zM${x - 8} ${f(b)}v-26h3v26z`;
      lights += `<rect x="${x + 18}" y="${f(b - 40)}" width="14" height="18"/><rect x="${x + 88}" y="${f(b - 40)}" width="14" height="18"/><rect x="${x - 22}" y="${f(b - 30)}" width="6" height="4"/>`;
      glow += `<circle cx="${x - 19}" cy="${f(b - 26)}" r="18"/>`; }
    // a white-frame church with a steeple
    { const x = 880; const b = g(x);
      d += `M${x} ${f(b)}v-48h80v48zM${x - 6} ${f(b - 48)}l46-28 46 28zM${x + 30} ${f(b - 64)}v-30h20v30zM${x + 30} ${f(b - 94)}l10-26 10 26zM${x + 39} ${f(b - 120)}v-12h2v12zM${x + 35} ${f(b - 128)}h10v2h-10z`;
      lights += `<path d="M${x + 14} ${f(b - 34)}h10v20h-10zM${x + 56} ${f(b - 34)}h10v20h-10z"/>`; }
    // a water tower on legs
    { const x = 1300; const b = g(x);
      d += `M${x - 30} ${f(b - 96)}h60v30h-60zM${x - 34} ${f(b - 96)}l34-16 34 16zM${x - 26} ${f(b)}l6-66h4l-6 66zM${x + 26} ${f(b)}l-6-66h-4l6 66zM${x - 4} ${f(b)}v-66h4v66zM${x - 22} ${f(b - 40)}h44v3h-44z`; }
    // a gas station canopy and its sign
    { const x = 1560; const b = g(x);
      d += `M${x} ${f(b - 44)}h120v-8h-120zM${x + 12} ${f(b)}v-44h5v44zM${x + 103} ${f(b)}v-44h5v44zM${x + 40} ${f(b)}v-18h12v18zM${x + 70} ${f(b)}v-18h12v18zM${x + 150} ${f(b)}v-90h5v90zM${x + 132} ${f(b - 118)}h42v30h-42z`;
      lights += `<rect x="${x + 4}" y="${f(b - 44)}" width="112" height="3"/><rect x="${x + 135}" y="${f(b - 115)}" width="36" height="24"/>`;
      glow += `<ellipse cx="${x + 60}" cy="${f(b - 30)}" rx="70" ry="22"/><circle cx="${x + 153}" cy="${f(b - 103)}" r="30"/>`;
      lights += `<text x="${x + 153}" y="${f(b - 97)}" text-anchor="middle" font-family="Overpass, Arial, sans-serif" font-weight="800" font-size="14" fill="#2a1408">EAT</text>`; }
    return `<path d="${d}" fill="currentColor"/><g class="sg-glow">${glow}</g><g class="sg-lights">${lights}</g>`;
  };

  const nearTile = () => {
    const base = 244;
    let d = `M0 ${H}V${base}`;
    for (let x = 0; x <= W; x += 12) {
      const h = 4 + rnd() * 14;
      d += `L${x + 3} ${f(base - h)}L${x + 6} ${base}`;
    }
    d += `L${W} ${base}V${H}Z`;
    let wires = '';
    const poles = [150, 600, 1050, 1500];
    const pole = (x) => `M${x - 3} ${base}V30h6V${base}zM${x - 32} 44h64v5h-64zM${x - 24} 64h48v4h-48zM${x - 30} 38h3v6h-3zM${x + 27} 38h3v6h-3zM${x - 21} 58h3v6h-3zM${x + 18} 58h3v6h-3z`;
    poles.forEach((x) => { d += pole(x); });
    const span = (x1, x2) => {
      let w = '';
      for (const [dx, y] of [[-28, 40], [28, 40], [-19, 60], [19, 60]]) w += `M${x1 + dx} ${y}Q${(x1 + x2) / 2 + dx} ${y + 34} ${x2 + dx} ${y}`;
      return w;
    };
    for (let i = 0; i < poles.length; i += 1) wires += span(poles[i], i + 1 < poles.length ? poles[i + 1] : poles[0] + W);
    wires += span(poles[poles.length - 1] - W, poles[0]);
    // fence posts and a mailbox
    for (let x = 30; x < W; x += 64) if (!poles.some((p) => Math.abs(p - x) < 30)) d += `M${x} ${base}v-22h4v22z`;
    d += `M820 ${base}v-34h4v34zM810 ${base - 44}h26v12h-26z`;
    return `<path d="${d}" fill="currentColor"/><path class="sg-wire" d="${wires}"/>`;
  };

  const road = document.createElement('div');
  road.className = 'sg-road';
  road.setAttribute('aria-hidden', 'true');
  const layerDefs = [['far', farTile(), 0.035, 1.6], ['mid', midTile(), 0.11, 5], ['near', nearTile(), 0.42, 22]];
  road.innerHTML = layerDefs.map(([name]) => `<div class="sg-layer sg-${name}"><svg preserveAspectRatio="xMinYMax meet"></svg></div>`).join('');
  for (let i = 0; i < 9; i += 1) {
    const fly = document.createElement('i');
    fly.className = 'sg-fly fx';
    fly.style.left = `${8 + rnd() * 84}%`;
    fly.style.bottom = `${10 + rnd() * 50}%`;
    fly.style.animationDelay = `${(rnd() * 6).toFixed(2)}s`;
    fly.style.animationDuration = `${(5 + rnd() * 4).toFixed(2)}s`;
    road.append(fly);
  }
  document.body.prepend(road);
  const layers = $$('.sg-layer', road).map((el, i) => ({ el, svg: $('svg', el), tile: layerDefs[i][1], speed: layerDefs[i][2], drift: layerDefs[i][3], tileW: 0, n: 0 }));
  // A layer slides by up to one tile, so it needs enough tiles to cover the window plus one.
  const sizeLayers = () => {
    layers.forEach((l) => {
      const h = l.el.getBoundingClientRect().height;
      l.tileW = (W * h) / H;
      if (!l.tileW) return;
      const n = Math.max(3, Math.ceil(innerWidth / l.tileW) + 1);
      if (n !== l.n) {
        l.n = n;
        l.svg.setAttribute('viewBox', `0 0 ${W * n} ${H}`);
        l.svg.innerHTML = Array.from({ length: n }, (_, k) => `<g transform="translate(${k * W} 0)">${l.tile}</g>`).join('');
      }
      l.svg.style.width = `${l.tileW * n}px`;
    });
  };

  // ---------- Colour over the drive ----------
  const keys = [
    { sky: ['#2f3360', '#6c5a86', '#c47f7c', '#e8a36a', '#f2c27c'], far: '#6b5878', mid: '#2e2540', near: '#0d0b14' },
    { sky: ['#1c2148', '#3b3a6a', '#6d5378', '#b36f6a', '#d99062'], far: '#3e3657', mid: '#1d1830', near: '#0a0911' },
    { sky: ['#05070f', '#0b1024', '#141a36', '#2a2142', '#3d2a40'], far: '#1b1b31', mid: '#0e0d1c', near: '#06050b' },
  ];
  const hex = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
  const mix = (a, b, t) => { const A = hex(a); const B = hex(b); return `rgb(${A.map((v, i) => Math.round(v + (B[i] - v) * t)).join(' ')})`; };
  const smooth = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
  const paint = (t) => {
    const seg = t < 0.5 ? 0 : 1;
    const k = t < 0.5 ? t / 0.5 : (t - 0.5) / 0.5;
    const A = keys[seg];
    const B = keys[seg + 1];
    A.sky.forEach((c, i) => root.style.setProperty(`--sky-${i}`, mix(c, B.sky[i], k)));
    ['far', 'mid', 'near'].forEach((n) => root.style.setProperty(`--${n}`, mix(A[n], B[n], k)));
    root.style.setProperty('--lit', smooth(0.22, 0.55, t).toFixed(3));
    root.style.setProperty('--stars', smooth(0.45, 0.85, t).toFixed(3));
    root.style.setProperty('--moonrise', smooth(0.3, 1, t).toFixed(3));
  };
  const progress = () => {
    const max = document.documentElement.scrollHeight - innerHeight;
    return max > 0 ? Math.min(1, Math.max(0, scrollY / max)) : 0;
  };

  // ---------- Motion: scroll parallax plus a slow drive ----------
  let driven = 0;
  let last = performance.now();
  let raf = 0;
  let painted = -1;
  const frame = (now) => {
    raf = 0;
    const dt = Math.min(100, now - last) / 1000;
    last = now;
    if (!calm()) driven += dt;
    const t = progress();
    if (t !== painted) { painted = t; paint(t); }
    layers.forEach((l) => {
      if (!l.tileW) return;
      const off = calm() ? 0 : (scrollY * l.speed + driven * l.drift) % l.tileW;
      l.el.style.transform = `translate3d(${(-off).toFixed(1)}px, 0, 0)`;
    });
    if (!calm() && !document.hidden) raf = requestAnimationFrame(frame);
  };
  const kick = () => { if (!raf) { last = performance.now(); raf = requestAnimationFrame(frame); } };
  addEventListener('scroll', kick, { passive: true });
  addEventListener('resize', () => { sizeLayers(); kick(); });
  document.addEventListener('visibilitychange', kick);
  addEventListener('eas:calm', kick);
  sizeLayers();
  painted = progress();
  paint(painted);
  kick();

  // ---------- The car radio ----------
  const tracks = $('.tracks');
  if (tracks) {
    const lo = 530;
    const hi = 1700;
    const pos = (fq) => ((fq - lo) / (hi - lo)) * 100;
    let scale = '';
    for (let fq = 550; fq <= 1650; fq += 50) scale += `<i class="${fq % 100 ? 'minor' : ''}" style="left:${pos(fq).toFixed(2)}%"></i>`;
    [55, 60, 70, 80, 100, 120, 140, 160].forEach((n, i) => { scale += `<span class="${i % 2 || i === 0 ? 'hide-sm' : ''}" style="left:${pos(n * 10).toFixed(2)}%">${n}</span>`; });
    const radio = document.createElement('div');
    radio.className = 'sg-radio';
    radio.setAttribute('aria-hidden', 'true');
    radio.innerHTML = `<div class="sg-radio-scale">${scale}<b class="sg-needle"></b><em class="sg-radio-band">AM · KC</em></div>`;
    tracks.before(radio);
    const needle = $('.sg-needle', radio);
    const items = $$('.track', tracks);
    const freqs = items.map((_, i) => Math.round((620 + (i * 900) / Math.max(1, items.length - 1)) / 10) * 10);
    items.forEach((li, i) => {
      const tag = document.createElement('span');
      tag.className = 'sg-freq';
      tag.textContent = `${freqs[i]} AM`;
      const title = $('.track-title', li);
      if (title) title.prepend(tag);
      const tune = () => { needle.style.left = `${pos(freqs[i]).toFixed(2)}%`; };
      li.addEventListener('pointerenter', tune);
      li.addEventListener('focusin', tune);
    });
    const home = () => {
      const playing = items.findIndex((li) => li.classList.contains('is-playing'));
      needle.style.left = `${pos(freqs[Math.max(0, playing)]).toFixed(2)}%`;
    };
    tracks.addEventListener('pointerleave', home);
    tracks.addEventListener('click', () => setTimeout(home, 50));
    home();
  }
})();
