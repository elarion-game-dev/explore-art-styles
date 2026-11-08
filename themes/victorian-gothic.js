// Victorian Gothic: the lamplighter's round. A gas lamp hangs at each part of the page and lights as you reach it.
// Click any lamp to turn it down or relight it. Every lamp is on one gas main, so they all sag together now and then.
(() => {
  const root = document.documentElement;
  const isCalm = () => root.dataset.calm === '1';
  const q = (s, el = document) => el.querySelector(s);
  const qq = (s, el = document) => [...el.querySelectorAll(s)];

  // The serial's masthead: the title set on an arch, with a hatched shade behind it.
  const h1 = q('.hero-title');
  const title = h1.textContent;
  h1.setAttribute('aria-label', title);
  const onArch = (cls, extra = '') => `<text class="${cls}"${extra}><textPath href="#vg-arc" startOffset="50%" text-anchor="middle">${title}</textPath></text>`;
  h1.innerHTML = `<svg viewBox="0 0 1000 226" aria-hidden="true"><defs>
      <path id="vg-arc" d="M24 216C210 64 790 64 976 216"/>
      <pattern id="vg-hatch" width="5" height="5" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><rect width="1.7" height="5" fill="#bdbba8"/></pattern>
    </defs>${onArch('vg-shade', ' transform="translate(5 7)"')}${onArch('vg-face')}</svg>`;

  // A gradient shared by every lit pane of glass.
  const defs = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  defs.setAttribute('class', 'vg-defs');
  defs.setAttribute('aria-hidden', 'true');
  defs.innerHTML = `<defs><radialGradient id="vg-glow" cx=".5" cy=".62" r=".62">
      <stop offset="0" stop-color="#fff3c4"/><stop offset=".38" stop-color="#f0cd76" stop-opacity=".9"/><stop offset="1" stop-color="#96a465" stop-opacity=".28"/>
    </radialGradient></defs>`;
  document.body.append(defs);

  // Iron scrollwork: a spiral that leaves (x,y) in direction a, curling one way.
  const n1 = (v) => +v.toFixed(1);
  const scroll = (x, y, a, r0, turns, dir) => {
    const cx = x + r0 * Math.cos(a + dir * Math.PI / 2);
    const cy = y + r0 * Math.sin(a + dir * Math.PI / 2);
    const from = a - dir * Math.PI / 2;
    const steps = Math.ceil(turns * 18);
    let d = '';
    for (let i = 0; i <= steps; i++) {
      const t = (i / steps) * turns * 2 * Math.PI;
      const r = r0 * Math.exp(-0.112 * t);
      d += `${i ? 'L' : 'M'}${n1(cx + r * Math.cos(from + dir * t))} ${n1(cy + r * Math.sin(from + dir * t))}`;
    }
    return d;
  };
  const bracket = `<g class="vg-bracket">
      <path class="vg-solid" d="M-125 -76h5v78h-5z"/><circle class="vg-iron-fine" cx="-122.500" cy="-66" r="1.200"/><circle class="vg-iron-fine" cx="-122.500" cy="-8" r="1.200"/>
      <path class="vg-iron" style="stroke-width:3" d="M-120 -60H16"/><path class="vg-solid" d="M16 -63.500L29 -60L16 -56.500Z"/>
      <path class="vg-iron" d="M-120 -10C-96 -11 -78 -22 -70 -38C-65 -48 -55 -56 -38 -60"/>
      <path class="vg-iron" d="${scroll(-70, -38, 0.9, 13, 1.45, 1)}"/>
      <path class="vg-iron" d="${scroll(-104, -14, 2.9, 11, 1.4, 1)}"/>
      <path class="vg-iron-fine" d="${scroll(-90, -60, -2.6, 8, 1.4, 1)}"/>
      <path class="vg-iron-fine" d="${scroll(-42, -60, -0.7, 7, 1.4, -1)}"/>
    </g>`;
  const lamp = () => `<svg viewBox="-34 -78 68 178" aria-hidden="true">
    <path class="vg-iron vg-chain" stroke-dasharray="2.500 3.500" d="M0 -78V-58"/>
    ${bracket}
    <path class="vg-iron" d="M0 -60V-48"/>
    <circle class="vg-solid" cx="0" cy="-50" r="3.200"/>
    <path class="vg-solid" d="M-23 -20C-21 -32 -9 -43 0 -46C9 -43 21 -32 23 -20Z"/>
    <path class="vg-iron-fine" d="M-17 -23C-15 -31 -7 -38 0 -41M-11 -23C-9 -30 -5 -34 0 -37M17 -23C15 -31 7 -38 0 -41M11 -23C9 -30 5 -34 0 -37M0 -23V-34"/>
    <path class="vg-solid" d="M-25 -20H25V-15H-25Z"/>
    <path class="vg-glass" d="M-22 -15H22L13 40H-13Z"/>
    <g class="vg-flame">
      <path d="M0 27C-6 22-8 14-3 7-2 11-1 12 0 13 1 12 2 11 3 7 8 14 6 22 0 27Z" fill="#ffe9a8"/>
      <path d="M0 27C-2.500 24-3 20-1 16 0 18 1 18 1 16 3 20 2.500 24 0 27Z" fill="#fffbe6"/>
    </g>
    <path class="vg-iron-fine" d="M0 40V28M-8.500 -15L-5 40M8.500 -15L5 40"/>
    <path class="vg-solid" d="M-15 40H15V45H-15Z"/>
    <path class="vg-solid" d="M-3 45H3V58H-3Z"/>
    <circle class="vg-solid" cx="0" cy="62" r="4.500"/>
    <path class="vg-iron-fine" d="M0 67V76"/>
  </svg>`;

  const rnd = (a, b) => (a + Math.random() * (b - a)).toFixed(2);
  const lamps = [];
  function addLamp(parent, cls, haloCls, wallCls, owner) {
    const speed = `--d:${rnd(2.8, 4.9)}s;--o:-${rnd(0, 4)}s`;
    const b = document.createElement('button');
    b.type = 'button';
    b.className = `vg-lamp ${cls}`;
    b.tabIndex = -1;
    b.setAttribute('aria-hidden', 'true');
    b.title = 'Turn this lamp down or up';
    b.style.cssText = speed;
    b.innerHTML = lamp();
    const halo = document.createElement('span');
    halo.className = `vg-halo ${haloCls}`;
    halo.style.cssText = speed;
    // Light can spill past the sheet but never past the window, so it sits in its own clipped layer.
    let lights = parent.querySelector(':scope > .vg-lights');
    if (!lights) {
      lights = document.createElement('span');
      lights.className = 'vg-lights';
      parent.prepend(lights);
    }
    lights.append(halo);
    let wall = null;
    if (wallCls) {
      wall = document.createElement('span');
      wall.className = `vg-wall ${wallCls}`;
      lights.append(wall);
    }
    parent.prepend(b);
    const item = { b, halo, wall, owner, lit: false };
    b.addEventListener('click', () => set(item, !item.lit));
    lamps.push(item);
    return item;
  }

  function set(item, on) {
    item.lit = on;
    for (const el of [item.b, item.halo, item.wall]) if (el) el.classList.toggle('is-lit', on);
    if (item.owner) item.owner.classList.toggle('is-lit', on);
    paintCount();
  }

  // Two lamps in the corners of the masthead, then one lamp per part, on alternating sides of the street.
  const mast = q('.hero-text');
  const a = addLamp(mast, 'vg-lamp-mast vg-lamp-a', 'vg-halo-mast vg-halo-a');
  const b = addLamp(mast, 'vg-lamp-mast vg-lamp-b', 'vg-halo-mast vg-halo-b');
  const secLamps = qq('.sec').map((sec, i) => {
    const side = i % 2 ? 'l' : 'r';
    return addLamp(sec, `vg-lamp-sec vg-lamp-${side}`, `vg-halo-sec vg-halo-${side}`, `vg-wall-${side}`, sec);
  });

  // A tally of the round, in the site bar and at the very end.
  const here = q('.atlas-here');
  const count = document.createElement('span');
  count.className = 'vg-count';
  count.setAttribute('aria-hidden', 'true');
  here.after(count);
  const last = document.createElement('span');
  last.className = 'vg-lastline';
  q('.foot p').append(last);
  function paintCount() {
    const on = lamps.filter((l) => l.lit).length;
    count.textContent = on === lamps.length ? 'All lamps lit' : `${on} of ${lamps.length} lamps lit`;
    last.textContent = on === lamps.length ? 'The lamplighter has finished his round. Good night.' : `${lamps.length - on} of the lamps on this street are still dark.`;
  }

  // The street along the foot of the last page.
  const street = document.createElement('div');
  street.className = 'vg-street';
  street.setAttribute('aria-hidden', 'true');
  q('.page').after(street);

  // Lighting up.
  const lightAll = () => lamps.forEach((l) => { if (!l.lit) set(l, true); });
  if (isCalm()) {
    lightAll();
  } else {
    setTimeout(() => set(a, true), 350);
    setTimeout(() => set(b, true), 800);
  }
  paintCount();
  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver((entries) => {
      for (const e of entries) {
        if (!e.isIntersecting) continue;
        const item = secLamps.find((l) => l.owner === e.target);
        if (item && !item.done) { item.done = true; set(item, true); }
        io.unobserve(e.target);
      }
    }, { rootMargin: '0px 0px -32% 0px' });
    secLamps.forEach((l) => io.observe(l.owner));
  } else {
    lightAll();
  }
  addEventListener('eas:calm', (e) => { if (e.detail?.calm) lightAll(); });

  // A bank of fog behind the sheet. The thin layer in front comes from the theme's decor.
  const backfog = document.createElement('div');
  backfog.className = 'vg-backfog fx';
  backfog.setAttribute('aria-hidden', 'true');
  backfog.innerHTML = '<div class="vg-fog vg-fog-a"></div><div class="vg-fog vg-fog-b"></div>';
  document.body.prepend(backfog);

  // Fog parts around the pointer, as if you carried a lantern through it.
  const bank = q('.vg-fogbank');
  if (bank && matchMedia('(hover: hover)').matches) {
    let px = 0;
    let py = 0;
    let queued = false;
    addEventListener('pointermove', (e) => {
      px = e.clientX;
      py = e.clientY;
      if (queued || isCalm()) return;
      queued = true;
      requestAnimationFrame(() => {
        queued = false;
        const box = bank.getBoundingClientRect();
        bank.style.setProperty('--mx', `${px}px`);
        bank.style.setProperty('--my', `${py - box.top}px`);
      });
    }, { passive: true });
  }

  // Everything on the same gas main: now and then the pressure drops and every flame sags at once.
  function dip() {
    setTimeout(() => {
      if (!isCalm() && !document.hidden) {
        root.dataset.gas = 'dip';
        setTimeout(() => { delete root.dataset.gas; }, 620);
      }
      dip();
    }, 16000 + Math.random() * 26000);
  }
  dip();
})();
