// Biomechanical: builds a spine and ribcage behind the page. Scrolling sends a wave down the column and the
// faster you scroll, the harder it whips. When idle the ribs breathe. In calm mode the skeleton is still.
(() => {
  const root = document.documentElement;
  const page = document.querySelector('.page');
  const head = document.querySelector('.hero-text');
  const foot = document.querySelector('.foot');
  if (!page || !head || !foot) return;

  const sk = document.createElement('div');
  sk.className = 'bm-skeleton';
  sk.setAttribute('aria-hidden', 'true');
  document.body.prepend(sk);

  // Sizes of the source textures
  const VERT = { w: 460, h: 220 };
  const RIB = { w: 1100, h: 460 };
  const TAIL = 16;
  let bones = [];
  let builtFor = '';

  const docTop = (el) => el.getBoundingClientRect().top + scrollY;

  function build() {
    const vw = root.clientWidth;
    const small = vw < 720;
    const start = Math.round(docTop(head) + head.offsetHeight + (small ? 8 : 20));
    const end = Math.round(docTop(foot) - 6);
    const key = `${vw}|${start}|${end}`;
    if (key === builtFor) return;
    builtFor = key;

    sk.querySelectorAll('.bm-v, .bm-r').forEach((n) => n.remove());
    bones = [];
    const k = small ? 0.4 : Math.min(0.66, Math.max(0.46, vw / 2300));
    const step = Math.round(VERT.h * k * 0.5);
    const count = Math.max(4, Math.floor((end - start) / step));
    const ribW = Math.max(vw * 0.74, small ? 320 : 700);
    const ribK = ribW / RIB.w;
    const frag = document.createDocumentFragment();

    const addRib = (y, i, side, scale) => {
      const el = document.createElement('i');
      el.className = 'bm-r';
      const w = ribW * scale;
      const h = RIB.h * ribK * scale;
      el.style.cssText = `top:${y}px;width:${w}px;height:${h}px`;
      frag.append(el);
      bones.push({ el, y, i, h, kind: 'r', side });
    };

    for (let i = 0; i < count; i += 1) {
      const y = start + i * step;
      const left = count - i;
      if (i % 2 === 0 && left > TAIL * 0.55) {
        // Ribs get shorter near the tail, like a real cage.
        const scale = left < TAIL * 2.2 ? Math.max(0.42, left / (TAIL * 2.2)) : 1;
        const ry = y + step * 0.2;
        addRib(ry, i, 1, scale);
        addRib(ry, i, -1, scale);
      }
    }
    // The crown: two ribs flipped upward, so the top of the spine opens around the title like a pair of horns.
    if (!small) {
      const cw = Math.max(vw * 0.62, 640);
      const ch = RIB.h * (cw / RIB.w);
      const cy = start - ch * 0.13;
      for (const side of [1, -1]) {
        const el = document.createElement('i');
        el.className = 'bm-r bm-crown';
        el.style.cssText = `top:${cy}px;width:${cw}px;height:${ch}px`;
        el.style.transform = side < 0 ? 'scale(-1,-1)' : 'scale(1,-1)';
        frag.append(el);
      }
    }
    // Upper vertebrae lie over the ones below, so they go in last.
    for (let i = count - 1; i >= 0; i -= 1) {
      const y = start + i * step;
      const left = count - i;
      const t = left < TAIL ? 0.34 + 0.66 * (left / TAIL) : 1;
      const w = VERT.w * k * t;
      const h = VERT.h * k * t;
      const el = document.createElement('i');
      el.className = 'bm-v';
      el.style.cssText = `top:${y}px;width:${w}px;height:${h}px;margin-left:${-w / 2}px`;
      frag.append(el);
      bones.push({ el, y, i, h, kind: 'v' });
    }
    sk.append(frag);
    amp = small ? 7 : 15;
    baseAmp = amp;
    pose(0, 0, true);
  }

  let amp = 15;
  let baseAmp = 15;
  let lastY = scrollY;
  let vel = 0;
  let raf = 0;
  const calm = () => root.dataset.calm === '1';

  // Wave along the column. Phase moves with scroll, so scrolling visibly travels down the spine.
  function pose(sy, t, all) {
    const top = scrollY - 500;
    const bottom = scrollY + innerHeight + 500;
    const a = amp;
    for (const b of bones) {
      const near = b.y + b.h > top && b.y < bottom;
      if (near !== b.live) {
        b.live = near;
        b.el.classList.toggle('bm-live', near);
      }
      if (!near && !all) continue;
      const ph = b.i * 0.15 - sy * 0.0052;
      const dx = Math.sin(ph) * a;
      const slope = Math.cos(ph) * a * 0.15;
      if (b.kind === 'v') {
        b.el.style.transform = `translate3d(${dx.toFixed(2)}px,0,0) rotate(${(slope * 0.42).toFixed(2)}deg)`;
      } else {
        const breathe = Math.sin(t * 0.85 + b.i * 0.13) * 1.1;
        const flap = Math.cos(ph + 0.9) * (a / baseAmp) * 1.6 * b.side;
        const ang = breathe + flap;
        const flip = b.side < 0 ? 'scale(-1,1) ' : '';
        b.el.style.transform = `translate3d(${dx.toFixed(2)}px,0,0) ${flip}rotate(${ang.toFixed(2)}deg)`;
      }
    }
  }

  function frame(ms) {
    raf = requestAnimationFrame(frame);
    const y = scrollY;
    const d = Math.abs(y - lastY);
    lastY = y;
    vel += (d - vel) * 0.14;
    amp += (baseAmp + Math.min(baseAmp * 2.6, vel * 0.9) - amp) * 0.12;
    pose(y, ms / 1000);
  }
  function start() { if (!raf && !calm()) raf = requestAnimationFrame(frame); }
  function stop() { cancelAnimationFrame(raf); raf = 0; }
  function settle() { stop(); amp = baseAmp; pose(0, 0, true); }

  build();
  // Lay the skeleton out again whenever the page changes height or width.
  let wait;
  const again = () => { clearTimeout(wait); wait = setTimeout(() => { build(); if (calm()) settle(); }, 180); };
  addEventListener('resize', again);
  addEventListener('load', again);
  if ('ResizeObserver' in window) new ResizeObserver(again).observe(page);
  if (document.fonts?.ready) document.fonts.ready.then(again);

  addEventListener('eas:calm', (e) => { if (e.detail?.calm) settle(); else start(); });
  document.addEventListener('visibilitychange', () => { if (document.hidden) stop(); else start(); });
  if (calm()) settle(); else start();
})();
