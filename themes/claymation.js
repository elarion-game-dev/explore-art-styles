// Claymation: the boil, stepped poses, thumb presses, and a small clay figure hanging from the site bar.
// Nothing here tweens. The headings' noise seed changes on ones, twos or threes, chosen by the visitor.
(() => {
  const root = document.documentElement;
  const $ = (q, el = document) => el.querySelector(q);
  const $$ = (q, el = document) => [...el.querySelectorAll(q)];
  const isCalm = () => root.dataset.calm === '1';
  const store = {
    get(k) { try { return localStorage.getItem(k); } catch { return null; } },
    set(k, v) { try { localStorage.setItem(k, v); } catch { /* private window */ } },
  };

  // ---- the filters ----
  // Each one displaces the letter shapes with noise, then lights the blurred shape as if it were a height map.
  const clayFilter = (id, o) => `<filter id="${id}" x="-6%" y="-18%" width="112%" height="136%" color-interpolation-filters="sRGB">
    <feTurbulence class="cl-seed" type="fractalNoise" baseFrequency="${o.wobble}" numOctaves="3" seed="4" result="n"/>
    <feDisplacementMap in="SourceGraphic" in2="n" scale="${o.disp}" xChannelSelector="R" yChannelSelector="G" result="d"/>
    <feGaussianBlur in="d" stdDeviation="${o.blur}" result="b"/>
    <feTurbulence class="cl-seed" type="fractalNoise" baseFrequency="${o.grain}" numOctaves="3" seed="9" result="fine"/>
    <feComposite in="b" in2="fine" operator="arithmetic" k1="0" k2="1" k3=".22" k4="0" result="h"/>
    <feDiffuseLighting in="h" surfaceScale="${o.scale}" diffuseConstant="1.06" lighting-color="#fff" result="df"><feDistantLight azimuth="235" elevation="58"/></feDiffuseLighting>
    <feSpecularLighting in="h" surfaceScale="${o.scale}" specularConstant=".55" specularExponent="22" lighting-color="#fff" result="sp"><feDistantLight azimuth="235" elevation="50"/></feSpecularLighting>
    <feComposite in="df" in2="d" operator="arithmetic" k1="1" k2="0" k3="0" k4="0" result="lit"/>
    <feComposite in="sp" in2="d" operator="in" result="sp2"/>
    <feComposite in="lit" in2="sp2" operator="arithmetic" k1="0" k2="1" k3="1" k4="0" result="o"/>
    <feComposite in="o" in2="d" operator="in"/>
  </filter>`;
  const holder = document.createElement('div');
  holder.setAttribute('aria-hidden', 'true');
  holder.style.cssText = 'position:absolute;width:0;height:0;overflow:hidden';
  holder.innerHTML = `<svg width="0" height="0">
    <filter id="cl-edge" x="-3%" y="-3%" width="106%" height="106%"><feTurbulence type="fractalNoise" baseFrequency=".011" numOctaves="2" seed="8" result="n"/><feDisplacementMap in="SourceGraphic" in2="n" scale="15" xChannelSelector="R" yChannelSelector="G"/></filter>
    ${clayFilter('cl-boil-l', { wobble: 0.024, disp: 9, blur: 4.2, grain: 0.07, scale: 6.5 })}
    ${clayFilter('cl-boil-s', { wobble: 0.05, disp: 3.6, blur: 1.5, grain: 0.15, scale: 2.8 })}
    ${clayFilter('cl-lump', { wobble: 0.06, disp: 2.4, blur: 1.6, grain: 0.2, scale: 2.8 })}
  </svg>`;
  document.body.append(holder);
  const seedsOf = (id) => $$(`#${id} .cl-seed`, holder);
  const big = seedsOf('cl-boil-l');
  const small = seedsOf('cl-boil-s');
  const guySeeds = seedsOf('cl-lump');

  // ---- the title in rolled letters ----
  const COLOURS = ['#f0693a', '#f3bb40', '#8fc94a', '#f4839f', '#6ea6f0', '#f7ecc9', '#b488e0', '#5cc8b5'];
  const h1 = $('.hero-title');
  if (h1) {
    const text = h1.textContent;
    h1.setAttribute('aria-label', text);
    const word = document.createElement('span');
    word.className = 'cl-word';
    word.setAttribute('aria-hidden', 'true');
    [...text].forEach((ch, i) => {
      const s = document.createElement('span');
      s.textContent = ch;
      s.style.color = COLOURS[i % COLOURS.length];
      word.append(s);
    });
    h1.textContent = '';
    h1.append(word);
  }
  // Section titles get one colour each from the theme's --t.
  $$('.sec-title').forEach((h) => {
    const w = document.createElement('span');
    w.className = 'cl-word';
    w.textContent = h.textContent;
    h.textContent = '';
    h.append(w);
  });

  // ---- which filters are on screen ----
  let heroVisible = true;
  let titlesVisible = 0;
  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver((entries) => {
      for (const e of entries) {
        if (e.target === h1) heroVisible = e.isIntersecting;
        else titlesVisible += e.isIntersecting ? 1 : (e.target.dataset.seen ? -1 : 0);
        if (e.isIntersecting) e.target.dataset.seen = '1';
      }
    });
    if (h1) io.observe(h1);
    $$('.sec-title').forEach((t) => io.observe(t));
  }

  // ---- the exposure counter and the choice of ones, twos or threes ----
  const panel = document.createElement('div');
  panel.className = 'cl-rate fx';
  panel.setAttribute('role', 'group');
  panel.setAttribute('aria-label', 'Boil speed: how many film frames each pose is held for');
  panel.innerHTML = '<span class="cl-count" aria-hidden="true">0000</span><span class="cl-rate-label">Shoot on</span><button type="button" data-rate="1" aria-label="On ones: 24 poses a second">1s</button><button type="button" data-rate="2" aria-label="On twos: 12 poses a second">2s</button><button type="button" data-rate="3" aria-label="On threes: 8 poses a second">3s</button>';
  document.body.append(panel);
  const count = $('.cl-count', panel);
  const saved = Number(store.get('eas-clay-rate'));
  let rate = [1, 2, 3].includes(saved) ? saved : 2;
  const paintRate = () => $$('[data-rate]', panel).forEach((b) => b.setAttribute('aria-pressed', String(Number(b.dataset.rate) === rate)));
  paintRate();
  panel.addEventListener('click', (e) => {
    const n = Number(e.target.dataset?.rate);
    if (!n) return;
    rate = n;
    store.set('eas-clay-rate', String(n));
    paintRate();
  });

  // ---- the boil ----
  // A small set of seeds keeps it feeling like a handful of poses, the way real clay comes back to nearly the same shape.
  let exposure = 0;
  let pose = 0;
  let last = 0;
  let raf = 0;
  const reseed = (list, n) => list.forEach((f, i) => f.setAttribute('seed', String(3 + ((n + i * 3) % 9) * 7)));
  const tick = (now) => {
    raf = requestAnimationFrame(tick);
    if (document.hidden) return;
    const every = (1000 / 24) * rate;
    if (now - last < every) return;
    last = now - ((now - last) % every);
    exposure += rate;
    pose += 1 + Math.floor(Math.random() * 3);
    if (heroVisible) reseed(big, pose);
    if (titlesVisible > 0 || (heroVisible && innerWidth <= 720)) reseed(small, pose + 2);
    if (guy && exposure % 6 < rate) reseed(guySeeds, pose);
    count.textContent = String(exposure % 10000).padStart(4, '0');
  };
  const startBoil = () => { if (!raf && !isCalm()) raf = requestAnimationFrame(tick); };
  const stopBoil = () => { cancelAnimationFrame(raf); raf = 0; };

  // ---- thumb presses ----
  const PRESSABLE = '.core-item, .do, .avoid, .origins, .ref-list, .hero-text, .sec-feel, .sec-vibe, .sec-related, .track';
  const prints = [];
  document.addEventListener('pointerdown', (e) => {
    if (e.button !== 0 || e.target.closest('a, button, video, input, .shot-link, .cl-rate, .atlas, .player, dialog, .related')) return;
    const host = e.target.closest(PRESSABLE);
    if (!host) return;
    const r = host.getBoundingClientRect();
    const p = document.createElement('i');
    p.className = 'cl-print';
    p.setAttribute('aria-hidden', 'true');
    // Tilted hosts can only be approximated here, which suits a thumb.
    p.style.left = `${e.clientX - r.left}px`;
    p.style.top = `${e.clientY - r.top}px`;
    p.style.rotate = `${Math.round((Math.random() - .5) * 70)}deg`;
    host.append(p);
    prints.push(p);
    if (prints.length > 30) prints.shift().remove();
    if (!isCalm()) {
      host.classList.remove('cl-squash');
      void host.offsetWidth;
      host.classList.add('cl-squash');
    }
  });
  document.addEventListener('animationend', (e) => {
    if (e.animationName === 'cl-squash') e.target.classList.remove('cl-squash');
    if (e.animationName === 'cl-arrive') e.target.classList.remove('cl-arrive');
  });

  // ---- slabs that arrive in steps ----
  if ('IntersectionObserver' in window && !isCalm()) {
    const arrive = new IntersectionObserver((entries) => {
      for (const e of entries) {
        if (!e.isIntersecting) continue;
        arrive.unobserve(e.target);
        if (!isCalm()) e.target.classList.add('cl-arrive');
      }
    }, { rootMargin: '0px 0px -6% 0px' });
    $$('.core-item, .ref-gallery .shot, .loop, .ref-list').forEach((el) => arrive.observe(el));
  }

  // ---- the figure ----
  // Four hand-over-hand poses, which advance with the scroll position: scrolling is the animating.
  const SHOULDER_L = [38, 44];
  const SHOULDER_R = [58, 44];
  const POSES = [
    { l: [24, 3, 22, 26], r: [66, 3, 74, 26], tilt: 3, legs: [[36, 106], [62, 110]] },
    { l: [40, 3, 30, 24], r: [66, 22, 76, 34], tilt: 0, legs: [[40, 110], [60, 106]] },
    { l: [30, 3, 22, 26], r: [72, 3, 74, 26], tilt: -3, legs: [[34, 110], [58, 106]] },
    { l: [30, 22, 20, 34], r: [56, 3, 66, 24], tilt: 0, legs: [[38, 106], [56, 110]] },
  ];
  const limb = (x1, y1, cx, cy, x2, y2) => `<path d="M${x1} ${y1}Q${cx} ${cy} ${x2} ${y2}" fill="none" stroke="#f3cf83" stroke-width="8.5" stroke-linecap="round" filter="url(#cl-lump)"/>`;
  const poseSvg = (p, i) => `<g class="cl-pose" data-i="${i}" ${i ? 'style="display:none"' : ''}>
    ${limb(SHOULDER_L[0], SHOULDER_L[1], p.l[2], p.l[3], p.l[0], p.l[1])}
    ${limb(SHOULDER_R[0], SHOULDER_R[1], p.r[2], p.r[3], p.r[0], p.r[1])}
    <circle cx="${p.l[0]}" cy="${p.l[1]}" r="7" fill="#f3cf83" filter="url(#cl-lump)"/>
    <circle cx="${p.r[0]}" cy="${p.r[1]}" r="7" fill="#f3cf83" filter="url(#cl-lump)"/>
    <g transform="rotate(${p.tilt} 48 40)">
      ${limb(38, 88, 36, 98, p.legs[0][0], p.legs[0][1])}
      ${limb(58, 88, 60, 98, p.legs[1][0], p.legs[1][1])}
      <path d="M48 28C34 28 28 44 26 62C24 82 36 92 48 92C60 92 72 82 70 62C68 44 62 28 48 28Z" fill="#ec6535" filter="url(#cl-lump)"/>
      <ellipse cx="39" cy="50" rx="8" ry="9" fill="#fff8e8"/><ellipse cx="57" cy="50" rx="8" ry="9" fill="#fff8e8"/>
      <circle cx="41.5" cy="52" r="3.6" fill="#1c0d05"/><circle cx="59.5" cy="52" r="3.6" fill="#1c0d05"/>
      <path d="M40 69Q49 77 58 68" fill="none" stroke="#5c1c08" stroke-width="3.4" stroke-linecap="round"/>
    </g>
  </g>`;
  let guy = null;
  const decor = $('.decor');
  if (decor) {
    const ns = document.createElement('div');
    ns.innerHTML = `<svg class="cl-guy" viewBox="0 0 96 120" aria-hidden="true">${POSES.map(poseSvg).join('')}</svg>`;
    guy = ns.firstElementChild;
    decor.append(guy);
  }
  const STEP = 44; // pixels of scroll for each pose
  let facing = 1;
  let lastY = scrollY;
  let shown = 0;
  const placeGuy = () => {
    if (!guy || isCalm()) return;
    const y = scrollY;
    if (y > lastY + 1) facing = 1; else if (y < lastY - 1) facing = -1;
    lastY = y;
    const max = Math.max(1, root.scrollHeight - innerHeight);
    const w = guy.getBoundingClientRect().width || 72;
    const room = innerWidth - w - 24;
    const x = 12 + Math.round((Math.min(1, y / max) * room) / 8) * 8;
    guy.style.transform = `translateX(${x}px) scaleX(${facing})`;
    const next = ((Math.floor(y / STEP) % 4) + 4) % 4;
    if (next !== shown) {
      guy.children[shown].style.display = 'none';
      guy.children[next].style.display = '';
      shown = next;
    }
  };
  let scrollQueued = false;
  addEventListener('scroll', () => {
    if (scrollQueued) return;
    scrollQueued = true;
    requestAnimationFrame(() => { scrollQueued = false; placeGuy(); });
  }, { passive: true });
  addEventListener('resize', placeGuy);
  placeGuy();

  addEventListener('eas:calm', () => { if (isCalm()) stopBoil(); else { startBoil(); placeGuy(); } });
  startBoil();
})();
