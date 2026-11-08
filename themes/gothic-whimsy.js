// Gothic Whimsy: a crooked pop-up storybook at night.
// Builds the hero diorama (Spiral Hill, a bent house and curling trees that sway), sets every title in crooked,
// rocking letters, hangs a striped rail above each section, and keeps a crow that hops from rail to rail as you read.
// Calm mode and reduced motion stop the swaying, the rocking and the hops; the crow then simply sits where you are.
(() => {
  const root = document.documentElement;
  const $ = (q, el = document) => el.querySelector(q);
  const $$ = (q, el = document) => [...el.querySelectorAll(q)];
  const calm = () => root.dataset.calm === '1';
  const page = $('.page');
  const hero = $('.hero');
  if (!page || !hero) return;
  const MEDIA = '../media/gothic-whimsy/';

  // A fixed seed, so the same letters lean the same way on every visit.
  let seed = 1937;
  const rnd = () => ((seed = (seed * 16807) % 2147483647) - 1) / 2147483646;
  const sway = (amp) => (rnd() * 2 - 1) * amp;

  // ---- an ink filter that makes ruled lines wobble like a dip pen ----
  const holder = document.createElement('div');
  holder.setAttribute('aria-hidden', 'true');
  holder.style.cssText = 'position:absolute;width:0;height:0;overflow:hidden';
  holder.innerHTML = '<svg width="0" height="0"><filter id="gw-rough" x="-3%" y="-3%" width="106%" height="106%"><feTurbulence type="fractalNoise" baseFrequency=".04" numOctaves="2" seed="5" result="n"/><feDisplacementMap in="SourceGraphic" in2="n" scale="4" xChannelSelector="R" yChannelSelector="G"/></filter></svg>';
  document.body.append(holder);
  root.classList.add('gw-ready');

  // ---- crooked, hand-lettered titles ----
  // Screen readers get the words from a visually hidden copy (.gw-sr), which works in headings and in the
  // subtitle paragraph alike (ARIA ignores aria-label on a <p>). The crooked letters themselves are decoration.
  function crook(el, amp) {
    const text = el.textContent.trim();
    if (!text) return;
    const sr = document.createElement('span');
    sr.className = 'gw-sr';
    sr.textContent = text;
    const wrap = document.createElement('span');
    wrap.setAttribute('aria-hidden', 'true');
    for (const part of text.split(/(\s+)/)) {
      if (!part) continue;
      if (/^\s+$/.test(part)) { wrap.append(' '); continue; }
      const word = document.createElement('span');
      word.className = 'gw-w';
      for (const ch of part) {
        const l = document.createElement('span');
        l.className = 'gw-l';
        l.textContent = ch;
        l.style.cssText = `--r:${sway(amp).toFixed(1)}deg;--y:${sway(amp * 0.7).toFixed(1)}px;--t:${(2.6 + rnd() * 2.2).toFixed(2)}s;--d:${(-rnd() * 5).toFixed(2)}s`;
        word.append(l);
      }
      wrap.append(word);
    }
    el.textContent = '';
    el.append(sr, wrap);
  }
  crook($('.hero-title'), 7);
  crook($('.hero-sub'), 4);
  $$('.sec-title').forEach((h) => crook(h, 5));

  // ---- the diorama: six cut-paper layers stacked in one frame ----
  const stage = document.createElement('div');
  stage.className = 'gw-stage';
  stage.setAttribute('aria-hidden', 'true');
  stage.innerHTML = ['sky', 'hill', 'curl', 'house', 'trees', 'front']
    .map((n) => `<img class="gw-layer gw-${n}" src="${MEDIA}scene-${n}.svg" alt="" width="600" height="500" draggable="false" decoding="async">`).join('');
  hero.insertBefore(stage, $('.hero-gallery'));

  // The pointer shifts the far layers more than the near ones, like tilting a pop-up book.
  let raf = 0;
  let mx = 0;
  let my = 0;
  const paint = () => { raf = 0; stage.style.setProperty('--mx', mx.toFixed(3)); stage.style.setProperty('--my', my.toFixed(3)); };
  hero.addEventListener('pointermove', (e) => {
    if (calm() || e.pointerType === 'touch') return;
    const r = stage.getBoundingClientRect();
    mx = Math.max(-1, Math.min(1, ((e.clientX - r.left) / r.width - 0.5) * 2));
    my = Math.max(-1, Math.min(1, ((e.clientY - r.top) / r.height - 0.5) * 2));
    if (!raf) raf = requestAnimationFrame(paint);
  });
  const settle = () => { mx = 0; my = 0; if (!raf) raf = requestAnimationFrame(paint); };
  hero.addEventListener('pointerleave', settle);

  // ---- a striped rail above every section ----
  const SPOTS = [0.8, 0.22, 0.7, 0.3, 0.78, 0.2, 0.64, 0.38];
  const perches = $$('main > .sec').map((sec, i) => {
    const p = document.createElement('div');
    p.className = 'gw-perch';
    p.setAttribute('aria-hidden', 'true');
    const a = (i % 2 ? 1 : -1) * (0.5 + rnd() * 0.9);
    p.dataset.a = a.toFixed(2);
    p.dataset.x = SPOTS[i % SPOTS.length];
    p.innerHTML = `<i class="gw-rail" style="--a:${a.toFixed(2)}deg"></i>`;
    sec.before(p);
    return p;
  });

  // ---- the crow ----
  const crow = document.createElement('div');
  crow.className = 'gw-crow';
  crow.setAttribute('aria-hidden', 'true');
  crow.innerHTML = `<svg viewBox="-4 -10 72 64">
    <g class="gw-c-up"><path d="M33 20C29 9 20 1 6-5L12 3.5L3 1.5L10.5 9L1.5 9.5L13 16L5 18L24 22Z" fill="#0d0a10"/></g>
    <path d="M3 35L17 28C22 23 29 18 37 16C39 10 45 6.5 50.5 7.5C54 8.5 56 11 57 13L64 15.6L56.6 17.4C54.5 19.5 52.5 22 51.5 25C50 31 46 35.5 40 38C33 40.5 26 40.5 19.5 38.5L2 40.5Z" fill="#0d0a10" stroke="#ece6d6" stroke-opacity=".28" stroke-width=".8"/>
    <g class="gw-c-fold"><path d="M18 30.5C25 26 33 23.5 43 25.5C38 29 30 33 21 34Z" fill="#2c2433"/><path d="M22 33L30 29M26 34L35 29.5M31 34L39 30M8 37L17 34.5" stroke="#ece6d6" stroke-opacity=".38" stroke-width=".9" fill="none"/></g>
    <g class="gw-c-legs"><path d="M36 38.5L34.5 49M41 37.5L41.5 49M30.5 49.5L38 49.5M38.5 49.5L45.5 49.5" stroke="#0d0a10" stroke-width="1.9" stroke-linecap="round" fill="none"/></g>
    <g class="gw-c-down"><path d="M27 24C33 25 38 27 40 30C38 37 33 44 26 51L26.5 44L21 49.5L22.5 42L16 46L19.5 38.5L13 41L19 31Z" fill="#0d0a10"/></g>
    <circle cx="50.6" cy="11.6" r="1.7" fill="#d9dc6c"/>
  </svg>`;
  // The crow flies inside a layer the size of the page, so a hop can never widen the page.
  const sky = document.createElement('div');
  sky.className = 'gw-flight';
  sky.setAttribute('aria-hidden', 'true');
  sky.append(crow);
  page.append(sky);

  // Where things sit, in the page's own coordinates (offsets ignore the gentle rotations).
  const offsetIn = (el) => {
    let x = 0;
    let y = 0;
    for (let n = el; n && n !== page; n = n.offsetParent) { x += n.offsetLeft; y += n.offsetTop; }
    return { x, y };
  };
  const FOOT = { x: 42 / 72, y: 59.5 / 64 }; // where the feet touch, as a share of the crow's box
  let home = null;
  let spots = [];
  function measure() {
    const s = offsetIn(stage);
    // The crow starts on a fence post at the foot of the diorama.
    home = { x: s.x + stage.offsetWidth * (418 / 600), y: s.y + stage.offsetHeight * (441 / 500) };
    spots = perches.map((p) => {
      const rail = p.firstElementChild;
      const o = offsetIn(rail);
      const w = rail.offsetWidth;
      const h = rail.offsetHeight;
      const tilt = (Number(p.dataset.a) * Math.PI) / 180;
      const x = o.x + w * Number(p.dataset.x);
      return { x, y: o.y + h / 2 + Math.tan(tilt) * (x - (o.x + w / 2)) - h / 2 - 2.5 };
    });
  }

  let at = null;
  let current = -2;
  let flight = null;
  const box = () => ({ w: crow.offsetWidth, h: crow.offsetHeight });
  const moveTo = (p) => {
    const { w, h } = box();
    return `translate(${(p.x - w * FOOT.x).toFixed(1)}px, ${(p.y - h * FOOT.y).toFixed(1)}px)`;
  };
  function stop() {
    if (flight) { flight.cancel(); flight = null; }
    crow.classList.remove('is-flying', 'is-landing');
  }
  function sit(p) {
    stop();
    at = p;
    crow.style.transform = moveTo(p);
  }
  function hop(to) {
    if (!at || calm() || document.hidden) { sit(to); return; }
    const { w, h } = box();
    let from = at;
    if (flight) {
      // Mid-air: take off again from wherever it is now.
      const m = new DOMMatrix(getComputedStyle(crow).transform);
      from = { x: m.m41 + w * FOOT.x, y: m.m42 + h * FOOT.y };
      flight.cancel();
      flight = null;
    }
    // A long way off: start just out of sight, so the visitor sees a hop rather than a streak.
    const reach = innerHeight * 0.75;
    if (Math.abs(to.y - from.y) > reach) {
      const dir = Math.sign(to.y - from.y);
      from = { x: to.x + Math.sign(from.x - to.x || 1) * Math.min(Math.abs(from.x - to.x), 220), y: to.y - dir * reach };
    }
    const dist = Math.hypot(to.x - from.x, to.y - from.y);
    if (dist < 2) { sit(to); return; }
    const lift = Math.min(150, 46 + dist * 0.22);
    const frames = [];
    for (let i = 0; i <= 14; i++) {
      const t = i / 14;
      frames.push({ transform: moveTo({ x: from.x + (to.x - from.x) * t, y: from.y + (to.y - from.y) * t - lift * 4 * t * (1 - t) }) });
    }
    crow.classList.toggle('is-left', to.x < from.x);
    crow.classList.remove('is-landing');
    crow.classList.add('is-flying');
    at = to;
    crow.style.transform = moveTo(to);
    const f = crow.animate(frames, { duration: Math.min(1250, 480 + dist * 0.6), easing: 'cubic-bezier(.35, .1, .45, 1)' });
    flight = f;
    f.onfinish = () => {
      if (flight !== f) return;
      flight = null;
      crow.classList.remove('is-flying');
      if (!calm()) {
        crow.classList.add('is-landing');
        setTimeout(() => crow.classList.remove('is-landing'), 420);
      }
    };
  }

  // The rail whose top has passed a little below the middle of the screen is where the crow belongs.
  function pick() {
    const top = page.getBoundingClientRect().top;
    const line = innerHeight * 0.6;
    let idx = -1;
    spots.forEach((s, i) => { if (top + s.y < line) idx = i; });
    return idx;
  }
  const target = (i) => (i < 0 ? home : spots[i]);
  function update(force) {
    const i = pick();
    if (i === current && !force) return;
    const first = current === -2;
    current = i;
    if (first || force) sit(target(i)); else hop(target(i));
  }
  let ticking = false;
  addEventListener('scroll', () => {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(() => { ticking = false; update(false); });
  }, { passive: true });

  // Re-measure whenever the layout shifts (fonts, images, a resized window), and put the crow back on its rail.
  let pending = 0;
  const remeasure = () => {
    cancelAnimationFrame(pending);
    pending = requestAnimationFrame(() => { measure(); update(true); });
  };
  measure();
  update(true);
  if ('ResizeObserver' in window) new ResizeObserver(remeasure).observe(page);
  else addEventListener('resize', remeasure);
  if (document.fonts?.ready) document.fonts.ready.then(remeasure);

  addEventListener('eas:calm', () => {
    if (calm()) { settle(); paint(); sit(target(current)); }
  });
})();
