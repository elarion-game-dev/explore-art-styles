// Liminal Spaces: the hall and its water. Real caustics are computed on a small canvas behind the page, and the water level rises with your scroll
// until the whole page is under it. Doors open as you reach each room. A pool ring floats on the surface. The occupancy sign is usually right.
(() => {
  const root = document.documentElement;
  const $ = (q) => document.querySelector(q);
  const $$ = (q) => [...document.querySelectorAll(q)];
  const calm = () => root.dataset.calm === '1';

  // ---- The hall behind the title ----
  const NS = 'http://www.w3.org/2000/svg';
  const defs = document.createElementNS(NS, 'svg');
  defs.setAttribute('width', '0');
  defs.setAttribute('height', '0');
  defs.setAttribute('aria-hidden', 'true');
  defs.style.position = 'absolute';
  defs.innerHTML = '<filter id="lm-ripple" x="-10%" y="-10%" width="120%" height="120%"><feTurbulence type="fractalNoise" baseFrequency=".012 .11" numOctaves="2" seed="7"/><feDisplacementMap in="SourceGraphic" scale="14" yChannelSelector="G"/></filter>';
  document.body.append(defs);

  const heroText = $('.hero-text');
  const hall = document.createElement('div');
  hall.className = 'lm-hall';
  hall.setAttribute('aria-hidden', 'true');
  // Two pairs of tall windows either side of the opening, spaced on the tile grid.
  const windows = [
    { x: -3, w: 76, h: 300 }, { x: -5, w: 76, h: 300 }, { x: 3, w: 76, h: 300 }, { x: 5, w: 76, h: 300 },
  ];
  const t = () => parseFloat(getComputedStyle(root).getPropertyValue('--t')) || 56;
  hall.innerHTML = `<div class="lm-hall-light"></div>${windows.map((a) => `<div class="lm-arch" data-x="${a.x}" style="--w:${a.w}px;--h:${a.h}px"></div><div class="lm-arch-r" data-x="${a.x}" style="--w:${a.w}px"></div>`).join('')}<svg class="lm-ladder" data-x="-2.2" style="--w:62px" viewBox="0 0 62 116"><defs><linearGradient id="lm-chrome" x1="0" x2="1"><stop offset="0" stop-color="#7f8880"/><stop offset=".5" stop-color="#f1f3ee"/><stop offset="1" stop-color="#6d756e"/></linearGradient></defs><g fill="none" stroke="#8b938b" stroke-width="4.4" stroke-linecap="round"><path d="M12 116V26C12 10 22 6 32 11"/><path d="M50 116V26C50 10 60 6 62 8"/><path d="M12 72H50M12 96H50"/></g><g fill="none" stroke="#f4f6f1" stroke-width="1.5" stroke-linecap="round"><path d="M11 116V26C11 12 21 7 31 12"/><path d="M49 116V26C49 12 57 8 61 9"/></g></svg>`;
  heroText.prepend(hall);
  const placeHall = () => {
    const span = Math.max(t() * 2, Math.min(innerWidth / 15, 112));
    for (const el of hall.querySelectorAll('[data-x]')) {
      const offset = Number(el.dataset.x) * span + (Number(el.dataset.x) < 0 ? -60 : 60);
      el.style.left = `calc(50% + ${offset}px - ${parseFloat(el.style.getPropertyValue('--w')) / 2}px)`;
      el.style.display = Math.abs(offset) + 60 > innerWidth / 2 ? 'none' : '';
    }
  };
  placeHall();

  // The opening's reflection in the water
  const shot1 = $('.shot-1');
  const firstImg = shot1?.querySelector('img');
  if (firstImg) {
    const link = shot1.querySelector('.shot-link');
    const mirror = document.createElement('div');
    mirror.className = 'lm-mirror';
    mirror.setAttribute('aria-hidden', 'true');
    const clone = firstImg.cloneNode();
    clone.alt = '';
    clone.removeAttribute('style');
    clone.removeAttribute('fetchpriority');
    mirror.append(clone);
    link.style.overflow = 'visible';
    const inner = document.createElement('span');
    inner.style.cssText = 'display:block;width:100%;height:100%;overflow:hidden;border-radius:inherit';
    firstImg.before(inner);
    inner.append(firstImg);
    link.append(mirror);
  }

  // ---- Doors ----
  const sections = $$('.sec');
  const tocLinks = $$('.toc a');
  if ('IntersectionObserver' in window) {
    const doors = new IntersectionObserver((entries) => {
      for (const e of entries) {
        // Once a door has been opened it stays open.
        if (e.isIntersecting) e.target.closest('.sec').classList.add('is-open');
      }
    }, { rootMargin: '0px 0px -30% 0px', threshold: .35 });
    for (const s of sections) doors.observe(s.querySelector('.sec-title'));
  } else {
    sections.forEach((s) => s.classList.add('is-open'));
  }

  // ---- The water ----
  const cv = document.createElement('canvas');
  cv.className = 'lm-water';
  cv.setAttribute('aria-hidden', 'true');
  document.body.prepend(cv);
  const ctx = cv.getContext('2d');
  let W = 0;
  let H = 0;
  let img = null;
  const fit = () => {
    const aspect = innerHeight / Math.max(1, innerWidth);
    const budget = innerWidth > 1000 ? 30000 : 15000; // pixels. Scaled up smoothly, which softens the caustic lines nicely.
    W = Math.max(60, Math.round(Math.sqrt(budget / aspect)));
    H = Math.max(40, Math.round(W * aspect));
    cv.width = W;
    cv.height = H;
    img = ctx.createImageData(W, H);
  };
  fit();

  // Level: a thin band at the bottom of the first screen, and over the top of the viewport by the end of the page.
  const levelY = () => {
    const max = Math.max(1, root.scrollHeight - innerHeight);
    const p = Math.min(1, Math.max(0, scrollY / max));
    const eased = p * p * (3 - 2 * p);
    const band = parseFloat(getComputedStyle(root).getPropertyValue('--water-h')) || 104;
    return (1 - eased) * (innerHeight - band) + eased * (-0.06 * innerHeight);
  };

  const TAU = Math.PI * 2;
  let tNow = 40;
  let lastLevel = -1;
  const draw = () => {
    const level = (levelY() / innerHeight) * H;
    const d = img.data;
    const scale = (innerWidth > 1000 ? 6 : 3.4) / W; // caustic cells per pixel
    const pageShift = (scrollY / innerHeight) * H * .9; // caustics scroll with the wall a little
    for (let x = 0; x < W; x++) {
      const edge = level + Math.sin(x * .09 + tNow * .55) * .55 + Math.sin(x * .031 - tNow * .32) * .9;
      for (let y = 0; y < H; y++) {
        const i = (y * W + x) * 4;
        const under = y - edge;
        if (under < -1) { d[i + 3] = 0; continue; }
        // Tileable water caustic, after a well known shader by joltz0r and Dave Hoskins
        const px = ((x * scale * TAU) % TAU) - 250;
        const py = (((y + pageShift) * scale * TAU) % TAU) - 250;
        let ix = px;
        let iy = py;
        let c = 1;
        const inten = .005;
        for (let n = 0; n < 3; n++) {
          const t2 = tNow * (1 - 3.5 / (n + 1));
          const nx = px + Math.cos(t2 - ix) + Math.sin(t2 + iy);
          const ny = py + Math.sin(t2 - iy) + Math.cos(t2 + ix);
          ix = nx;
          iy = ny;
          const a = px / (Math.sin(ix + t2) / inten);
          const b = py / (Math.cos(iy + t2) / inten);
          c += 1 / Math.sqrt(a * a + b * b);
        }
        c /= 3;
        c = 1.17 - Math.pow(c, 1.4);
        let light = Math.pow(Math.abs(c), 8);
        if (light > 1) light = 1;
        // Colour: pale aqua, more saturated with depth, caustic lines lifted towards the wall colour
        const depth = Math.min(1, Math.max(0, under / (H * .55)));
        const alpha = (.36 + depth * .16) * (1 - light * .7);
        d[i] = 78 + light * 150 - depth * 8;
        d[i + 1] = 190 + light * 52;
        d[i + 2] = 168 + light * 62 - depth * 6;
        let a255 = alpha * 255;
        if (under < 0) a255 *= under + 1;       // soft edge
        // A bright line where the water meets the wall, shaded smoothly so that it doesn't stair-step
        const m = Math.max(0, 1 - Math.abs(under - .7) / 1.5);
        if (m > 0) {
          d[i] += (236 - d[i]) * m;
          d[i + 1] += (250 - d[i + 1]) * m;
          d[i + 2] += (240 - d[i + 2]) * m;
          a255 += (Math.min(1, under + 1) * 225 - a255) * m;
        }
        d[i + 3] = a255;
      }
    }
    ctx.putImageData(img, 0, 0);
    lastLevel = level;
  };

  // A pool ring, left in the water by someone
  const ring = document.createElement('div');
  ring.className = 'lm-ring';
  ring.setAttribute('aria-hidden', 'true');
  ring.innerHTML = `<svg viewBox="0 0 124 62"><ellipse cx="62" cy="48" rx="50" ry="10" fill="#0f5c56" opacity=".16"/>
    <ellipse cx="62" cy="30" rx="58" ry="23" fill="#e9c94a"/><ellipse cx="62" cy="33" rx="58" ry="23" fill="none" stroke="#b08f1f" stroke-width="1.6" opacity=".5"/>
    <ellipse cx="62" cy="27" rx="27" ry="9.5" fill="#6cc3ad"/><path d="M36 27c3-6 14-9.5 26-9.5s22 3 26 8" fill="none" stroke="#a78a22" stroke-width="2.4"/>
    <path d="M14 22c6-7 18-12 30-13" fill="none" stroke="#fff8d8" stroke-width="3.4" stroke-linecap="round"/><path d="M92 40c6-1 11-4 14-7" fill="none" stroke="#fff3b8" stroke-width="2.4" stroke-linecap="round" opacity=".8"/></svg>`;
  document.body.prepend(ring);
  const placeRing = () => {
    const y = levelY();
    // Between the two right-hand windows on wide screens, or half out of frame on a phone
    const span = Math.max(t() * 2, Math.min(innerWidth / 15, 112));
    const home = innerWidth > 720 ? Math.min(innerWidth / 2 + 4 * span, innerWidth - 136) : innerWidth - 80;
    const x = home - Math.sin(scrollY / 900) * (innerWidth > 720 ? 24 : 8);
    ring.style.transform = `translate(${x.toFixed(1)}px, ${(y - 36).toFixed(1)}px)`;
  };

  // Everything runs at about 12 frames a second. Water does not need more, and it keeps phones cool.
  let lastDraw = 0;
  let raf = 0;
  const loop = (ts) => {
    raf = requestAnimationFrame(loop);
    if (ts - lastDraw < 83 || document.hidden) return;
    tNow += (ts - lastDraw) * .00016;
    lastDraw = ts;
    draw();
  };
  const onCalm = () => {
    cancelAnimationFrame(raf);
    raf = 0;
    if (calm()) draw();
    else raf = requestAnimationFrame(loop);
    placeRing();
  };
  onCalm();
  addEventListener('eas:calm', onCalm);

  let ticking = false;
  const onScroll = () => {
    ticking = false;
    placeRing();
    if (calm()) draw();
    const mark = scrollY + innerHeight * .5;
    let id = null;
    for (const s of sections) if (s.getBoundingClientRect().top + scrollY <= mark) id = s.id;
    for (const a of tocLinks) a.classList.toggle('is-here', a.getAttribute('href') === `#${id}`);
  };
  addEventListener('scroll', () => {
    if (!ticking) { ticking = true; requestAnimationFrame(onScroll); }
  }, { passive: true });
  onScroll();
  let rT;
  addEventListener('resize', () => {
    clearTimeout(rT);
    rT = setTimeout(() => { fit(); placeHall(); placeRing(); draw(); }, 120);
  });
  draw();

  // ---- Quiet things ----
  const pageTitle = document.title;
  document.addEventListener('visibilitychange', () => {
    document.title = document.hidden ? 'The lights are still on' : pageTitle;
  });
  // If you stand still for long enough, the sign counts someone else. It soon corrects itself.
  const occ = $('.lm-occ-n');
  if (occ) {
    let idle;
    const wake = () => {
      occ.textContent = '1';
      clearTimeout(idle);
      idle = setTimeout(() => {
        if (calm() || document.hidden) return;
        occ.textContent = '2';
        setTimeout(() => { occ.textContent = '1'; }, 2400);
      }, 45000);
    };
    for (const ev of ['scroll', 'pointermove', 'keydown', 'touchstart']) addEventListener(ev, wake, { passive: true });
    wake();
  }
})();
