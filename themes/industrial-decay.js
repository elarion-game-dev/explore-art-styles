// Industrial Decay: a torch that follows the pointer (and keyboard focus) through a dark plant, a light switch to turn the
// lights on, pipes that leak over the rooms, and a few tags left by earlier visitors.
(() => {
  const root = document.documentElement;
  const calm = () => root.dataset.calm === '1';
  const $ = (q) => document.querySelector(q);
  const $$ = (q) => [...document.querySelectorAll(q)];
  const store = {
    get: (k) => { try { return localStorage.getItem(k); } catch { return null; } },
    set: (k, v) => { try { localStorage.setItem(k, v); } catch { /* private window */ } },
  };

  // ---- The dark and the torch. Only for a fine pointer that can hover; phones and calm mode keep the lights on. ----
  const canTorch = matchMedia('(hover: hover) and (pointer: fine) and (min-width: 701px)');
  const dark = document.createElement('div');
  dark.className = 'id-dark fx';
  dark.setAttribute('aria-hidden', 'true');
  document.body.append(dark);

  const sw = document.createElement('button');
  sw.type = 'button';
  sw.className = 'id-switch';
  sw.innerHTML = '<i aria-hidden="true"></i><span>Lights</span>';
  sw.title = 'Switch the lights on to read without the torch';
  document.body.append(sw);
  const setLights = (on) => {
    if (on) root.dataset.lights = 'on'; else delete root.dataset.lights;
    sw.setAttribute('aria-pressed', String(on));
    sw.querySelector('span').textContent = on ? 'Lights on' : 'Lights off';
  };
  setLights(store.get('eas-id-lights') === 'on');
  sw.addEventListener('click', () => {
    const on = root.dataset.lights !== 'on';
    setLights(on);
    store.set('eas-id-lights', on ? 'on' : 'off');
  });

  // The beam lags a little behind the hand, like a real torch.
  let tx = innerWidth / 2;
  let ty = innerHeight * 0.42;
  let x = tx;
  let y = ty;
  let raf = 0;
  const radius = () => Math.max(220, Math.min(340, innerWidth * 0.2));
  const draw = () => {
    raf = 0;
    x += (tx - x) * 0.22;
    y += (ty - y) * 0.22;
    dark.style.setProperty('--mx', `${x.toFixed(1)}px`);
    dark.style.setProperty('--my', `${y.toFixed(1)}px`);
    if (Math.abs(tx - x) > 0.5 || Math.abs(ty - y) > 0.5) raf = requestAnimationFrame(draw);
  };
  const aim = (nx, ny, snap) => {
    tx = nx;
    ty = ny;
    if (snap || calm()) { x = tx; y = ty; }
    if (!raf) raf = requestAnimationFrame(draw);
  };
  dark.style.setProperty('--r', `${radius()}px`);
  addEventListener('resize', () => dark.style.setProperty('--r', `${radius()}px`));
  addEventListener('pointermove', (e) => { if (e.pointerType === 'mouse' || e.pointerType === 'pen') aim(e.clientX, e.clientY); }, { passive: true });
  // Keyboard users: the torch jumps to whatever has focus.
  document.addEventListener('focusin', (e) => {
    const r = e.target.getBoundingClientRect();
    if (r.width || r.height) aim(r.left + Math.min(r.width, 300) / 2, r.top + Math.min(r.height, 200) / 2, true);
  });
  // Leaving the window: the beam rests on the middle of the screen.
  document.addEventListener('pointerleave', () => aim(innerWidth / 2, innerHeight * 0.42));
  draw();
  // Daylight at the entrance: the dark deepens as you go down past the cover.
  const depth = () => {
    const hero = $('.hero');
    const h = hero ? hero.offsetHeight : innerHeight;
    const p = Math.min(1, Math.max(0, scrollY / Math.max(1, h - innerHeight * 0.3)));
    dark.style.setProperty('--depth', (0.42 + 0.58 * p).toFixed(3));
  };
  addEventListener('scroll', depth, { passive: true });
  depth();
  const syncTorch = () => { dark.hidden = !canTorch.matches; sw.hidden = !canTorch.matches; };
  canTorch.addEventListener?.('change', syncTorch);
  syncTorch();

  // ---- A pipe across the top of each room, with a slow leak ----
  $$('.sec').forEach((sec, i) => {
    const pipe = document.createElement('div');
    pipe.className = 'id-pipe';
    pipe.setAttribute('aria-hidden', 'true');
    sec.prepend(pipe);
    const drips = i % 2 ? [0.22, 0.71] : [0.43];
    drips.forEach((at, k) => {
      const d = document.createElement('i');
      d.className = 'id-drip fx';
      d.setAttribute('aria-hidden', 'true');
      d.style.left = `${at * 100}%`;
      d.style.top = '48px';
      d.style.setProperty('--t', `${2.2 + ((i + k) % 3) * 0.7}s`);
      d.style.setProperty('--d', `${(i * 0.9 + k * 1.3) % 3}s`);
      d.style.setProperty('--fall', `${180 + ((i * 37) % 120)}px`);
      sec.append(d);
    });
  });

  // ---- Tags left by earlier visitors ----
  const tag = (where, text, css) => {
    const el = $(where);
    if (!el) return;
    const t = document.createElement('span');
    t.className = 'id-tag';
    t.setAttribute('aria-hidden', 'true');
    t.textContent = text;
    Object.assign(t.style, css);
    el.append(t);
  };
  tag('#palette', 'K.R. 09', { right: '40px', bottom: '16px' });
  tag('#refs', 'was here', { right: '60px', top: '74px', transform: 'rotate(4deg)' });
})();
