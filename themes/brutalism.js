// Brutalism: monoliths stand in the haze behind the page at three depths and slide past at different speeds as you scroll.
// The sun crosses the sky over the length of the page: every slab's hard shadow and every monolith's lit face swing from left to right.
(() => {
  const root = document.documentElement;
  const calm = () => root.dataset.calm === '1';

  // ---- The field of monoliths ----
  // x and w in vw, h in vh, y0 = starting offset in viewport heights, f = parallax speed (bigger is nearer).
  const MONOLITHS = [
    { d: 'far', x: 4, w: 13, h: 230, y0: -0.4, f: 0.1 },
    { d: 'far', x: 27, w: 19, h: 180, y0: 0.55, f: 0.1, wide: true },
    { d: 'far', x: 62, w: 11, h: 260, y0: -0.2, f: 0.1 },
    { d: 'far', x: 79, w: 16, h: 170, y0: 1.15, f: 0.1, wide: true },
    { d: 'mid', x: -2, w: 7.5, h: 210, y0: 0.35, f: 0.28 },
    { d: 'mid', x: 90.5, w: 8, h: 240, y0: -0.3, f: 0.28 },
    { d: 'mid', x: 48, w: 6, h: 150, y0: 1.6, f: 0.28, wide: true },
    { d: 'near', x: -3.5, w: 5, h: 260, y0: 1.4, f: 0.62, slit: '38%' },
    { d: 'near', x: 96.5, w: 6, h: 230, y0: 0.2, f: 0.62, slit: '30%' },
  ];
  const field = document.createElement('div');
  field.className = 'br-field';
  field.setAttribute('aria-hidden', 'true');
  const els = MONOLITHS.map((m) => {
    const el = document.createElement('div');
    el.className = 'br-mono';
    el.dataset.d = m.d;
    el.style.setProperty('--x', `${m.x}vw`);
    el.style.setProperty('--w', m.d === 'near' ? `max(${m.w}vw, 46px)` : `${m.w}vw`);
    el.style.setProperty('--h', `${m.h}vh`);
    if (m.slit) {
      const s = document.createElement('i');
      s.className = 'br-slit';
      s.style.setProperty('--sl', m.slit);
      el.append(s);
    }
    if (m.wide) el.classList.add('br-wide');
    field.append(el);
    return el;
  });
  const haze = document.createElement('div');
  haze.className = 'br-haze';
  field.append(haze);
  document.body.prepend(field);

  // On phones the middle of the screen belongs to the text, so only the edges and the far layer stay.
  const narrow = () => innerWidth < 700;

  // ---- A person for scale, standing on the directory board ----
  const toc = document.querySelector('.toc');
  if (toc) {
    toc.style.position = 'relative';
    const fig = document.createElement('div');
    fig.className = 'br-scale';
    fig.setAttribute('aria-hidden', 'true');
    fig.innerHTML = '<svg viewBox="0 0 12 34" width="12" height="34"><circle cx="6" cy="3.4" r="2.9"/><path d="M3 7.5h6l1.4 11.5H8.6L8 33H6.4l-.4-12.5L5.6 33H4l-.6-14H1.6z"/></svg><span class="br-bar"></span><span class="br-m">1.8 m</span>';
    toc.prepend(fig);
  }

  // ---- Sun and parallax ----
  let ticking = false;
  const place = () => {
    ticking = false;
    const max = Math.max(1, document.documentElement.scrollHeight - innerHeight);
    const still = calm();
    const p = still ? 0.3 : Math.min(1, Math.max(0, scrollY / max));
    const sx = 26 - 52 * p;
    const sy = 15 + 11 * Math.sin(Math.PI * p);
    root.style.setProperty('--sx', sx.toFixed(1));
    root.style.setProperty('--sy', sy.toFixed(1));
    root.style.setProperty('--p', p.toFixed(3));
    const vh = innerHeight;
    const s = still ? 0 : scrollY;
    const small = narrow();
    MONOLITHS.forEach((m, i) => {
      const el = els[i];
      const hide = small && (m.d === 'mid' ? m.x > 5 && m.x < 90 : m.wide);
      el.style.display = hide ? 'none' : '';
      if (hide) return;
      const h = (m.h / 100) * vh;
      const cycle = vh + h + vh * 0.6;
      let y = (m.y0 * vh - s * m.f) % cycle;
      if (y < 0) y += cycle;
      el.style.transform = `translate3d(0, ${(y - h).toFixed(1)}px, 0)`;
    });
  };
  const ask = () => {
    if (!ticking) {
      ticking = true;
      requestAnimationFrame(place);
    }
  };
  addEventListener('scroll', () => { if (!calm()) ask(); }, { passive: true });
  addEventListener('resize', ask);
  addEventListener('eas:calm', ask);
  addEventListener('load', ask);
  place();
})();
