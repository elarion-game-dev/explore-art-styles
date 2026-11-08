// Painterly 2D: builds the painted vista in the hero and the watercolour filters the sections use.
// The vista is a sky and six gouache planes. The pointer (or a sideways swipe) moves each plane at its own speed, scrolling
// lets the far planes lag behind, and the Air slider sets how much air lies between the planes: veils of haze that
// compress value and colour towards the sky, soften the far edges and catch shafts of light. "Pull the planes apart"
// turns the stage so you can see it is built from flat layers. Calm mode keeps every plane still; the slider still works.
(() => {
  const root = document.documentElement;
  const calm = () => root.dataset.calm === '1';
  const $ = (q, el = document) => el.querySelector(q);
  const $$ = (q, el = document) => [...el.querySelectorAll(q)];
  const store = {
    get(k) { try { return localStorage.getItem(k); } catch { return null; } },
    set(k, v) { try { localStorage.setItem(k, v); } catch { /* private window */ } },
  };

  // ---------- Filters: wet edges that dry darker, used by every section's wash and by the title ----------
  // A wash: noise pushes the rectangle's edge about, then the band just inside the edge is laid again,
  // which is what happens when pigment runs to the rim of a drying wash.
  const wash = (id, seed, freq, scale) => `<filter id="${id}" x="-5%" y="-12%" width="110%" height="124%" color-interpolation-filters="sRGB">
    <feTurbulence type="fractalNoise" baseFrequency="${freq}" numOctaves="4" seed="${seed}" result="n"/>
    <feDisplacementMap in="SourceGraphic" in2="n" scale="${scale}" xChannelSelector="R" yChannelSelector="G" result="d"/>
    <feGaussianBlur in="d" stdDeviation="6" result="b"/>
    <feComposite in="d" in2="b" operator="out" result="rim"/>
    <feMerge><feMergeNode in="d"/><feMergeNode in="rim"/><feMergeNode in="rim"/></feMerge>
  </filter>`;
  const holder = document.createElement('div');
  holder.setAttribute('aria-hidden', 'true');
  holder.style.cssText = 'position:absolute;width:0;height:0;overflow:hidden';
  holder.innerHTML = `<svg width="0" height="0" focusable="false">
    ${wash('p2-wash-a', 3, '.006 .009', 46)}
    ${wash('p2-wash-b', 8, '.008 .006', 40)}
    ${wash('p2-wash-c', 13, '.005 .008', 50)}
    <filter id="p2-ink" x="-4%" y="-12%" width="108%" height="124%" color-interpolation-filters="sRGB">
      <feTurbulence type="fractalNoise" baseFrequency=".05" numOctaves="2" seed="2" result="n"/>
      <feDisplacementMap in="SourceGraphic" in2="n" scale="3.2" xChannelSelector="R" yChannelSelector="G" result="d"/>
      <feGaussianBlur in="d" stdDeviation="1.3" result="b"/>
      <feComposite in="d" in2="b" operator="out" result="rim"/>
      <feMerge><feMergeNode in="d"/><feMergeNode in="rim"/></feMerge>
    </filter>
  </svg>`;
  document.body.append(holder);

  // Pale paint colours are shown on a toned card, like white gouache on tinted paper, or they vanish into the sheet.
  for (const sw of $$('.swatch')) {
    const m = /#([0-9a-f]{6})/i.exec(sw.getAttribute('style') || '');
    if (!m) continue;
    const [r, g, b] = [0, 2, 4].map((i) => parseInt(m[1].slice(i, i + 2), 16) / 255);
    if (0.2126 * r + 0.7152 * g + 0.0722 * b > 0.82) sw.classList.add('is-light');
  }

  // ---------- The vista ----------
  const hero = $('.hero');
  const heroText = $('.hero-text');
  if (!hero || !heroText) return;

  // Planes back to front. d is how far each moves with the pointer (1 = with the camera), the same idea as a
  // parallax layer's scroll scale. zi is its place in the stack when the planes are pulled apart.
  // The veils are the air in front of each far plane.
  const PLANES = [
    { cls: 'p2-v0', d: 0.04, zi: 0, label: 'Sky\n0.04' },
    { cls: 'p2-v1', d: 0.1, zi: 1, label: 'Far peaks\n0.1' },
    { cls: 'p2-veil', d: 0.1, zi: 1.5 },
    { cls: 'p2-v2', d: 0.2, zi: 2, label: 'Mountains\n0.2' },
    { cls: 'p2-veil', d: 0.2, zi: 2.5 },
    { cls: 'p2-v3', d: 0.35, zi: 3, label: 'Hills\n0.35' },
    { cls: 'p2-veil', d: 0.35, zi: 3.5 },
    { cls: 'p2-v4', d: 0.5, zi: 4, label: 'Forest\n0.5' },
    { cls: 'p2-veil', d: 0.5, zi: 4.5 },
    { cls: 'p2-shafts', d: 0.55, zi: 4.6 },
    { cls: 'p2-motes', d: 0.6, zi: 4.7 },
    { cls: 'p2-v5', d: 0.7, zi: 5, label: 'Ledge\n0.7', glow: true },
    { cls: 'p2-v6', d: 1.15, zi: 6, label: 'Foreground\n1.15' },
  ];
  const scene = document.createElement('div');
  scene.className = 'p2-scene';
  scene.setAttribute('aria-hidden', 'true');
  const stage = document.createElement('div');
  stage.className = 'p2-stage';
  const tags = document.createElement('div');
  tags.className = 'p2-tags';
  const marks = [];
  PLANES.forEach((p) => {
    const el = document.createElement('div');
    el.className = `p2-plane ${p.cls}`;
    el.style.setProperty('--d', p.d);
    el.style.setProperty('--zi', p.zi);
    if (p.label) {
      // points at the plane's top and bottom left corners, so its label can follow it when the stage turns
      const mk = document.createElement('i');
      mk.className = 'p2-mark';
      const ft = document.createElement('i');
      ft.className = 'p2-mark is-foot';
      el.append(mk, ft);
      const t = document.createElement('span');
      t.className = 'p2-tag';
      t.textContent = p.label;
      tags.append(t);
      marks.push([mk, ft, t]);
    }
    if (p.glow) {
      const g = document.createElement('span');
      g.className = 'p2-glow';
      el.append(g);
    }
    if (p.cls === 'p2-motes') {
      // pollen and dust caught in the light over the valley
      let seed = 7;
      const rnd = () => { seed = (seed * 9301 + 49297) % 233280; return seed / 233280; };
      for (let k = 0; k < 16; k += 1) {
        const m = document.createElement('i');
        m.style.cssText = `--x:${(46 + rnd() * 34).toFixed(1)}%;--y:${(60 + rnd() * 21).toFixed(1)}%;--t:${(7 + rnd() * 7).toFixed(1)}s;--w:${(-rnd() * 12).toFixed(1)}s`;
        el.append(m);
      }
    }
    stage.append(el);
  });
  scene.append(stage, tags);
  hero.prepend(scene);

  // ---------- Controls ----------
  const savedRaw = store.get('eas-p2-air');
  const saved = Number(savedRaw);
  const startAir = savedRaw !== null && Number.isFinite(saved) ? Math.min(100, Math.max(0, Math.round(saved))) : 60;
  const controls = document.createElement('div');
  controls.className = 'p2-controls';
  controls.innerHTML = `
    <label class="p2-air"><span>Air</span><input type="range" min="0" max="100" step="1" value="${startAir}" aria-describedby="p2-note"><output>${startAir}%</output></label>
    <button class="p2-apart" type="button" aria-pressed="false">Pull the planes apart</button>
    <p class="p2-note" id="p2-note" aria-live="polite"></p>`;
  heroText.after(controls);
  const range = $('input', controls);
  const out = $('output', controls);
  const apartBtn = $('.p2-apart', controls);
  const note = $('.p2-note', controls);
  const setAir = (v) => {
    scene.style.setProperty('--air', (v / 100).toFixed(2));
    out.textContent = `${v}%`;
  };
  setAir(startAir);
  range.addEventListener('input', () => {
    setAir(Number(range.value));
    store.set('eas-p2-air', range.value);
  });
  let apart = false;
  const writeNote = () => {
    if (apart) note.textContent = 'Seven flat painted planes, from the foreground at the front to the sky at the back, each moving at its own speed. The pale sheets between them are the air, which the slider thickens or thins.';
    else if (calm()) note.textContent = 'Effects are off, so the planes hold still. The Air slider still thins or thickens the haze between them.';
    else note.textContent = 'Move the pointer across the painting (or swipe sideways) and each plane moves at its own speed. Slide the air to thin or thicken the haze between them.';
  };
  writeNote();

  // ---------- Motion ----------
  let tx = 0; let ty = 0; let cx = 0; let cy = 0; let sy = 0;
  let turn = 0; let turnTo = 0; let turnFrom = 0; let turnStart = 0;
  let lastMove = -1e9;
  let visible = true;
  let raf = 0;
  const TURN_MS = 1400;
  const ease = (t) => (t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2);
  // How far apart the planes stand, and how small and where the turned stack must be to fit the frame.
  // Perspective makes the near planes larger, so the stack is measured turned, then scaled and centred.
  const pictures = $$('.p2-plane', stage).filter((el) => /p2-v\d/.test(el.className));
  const fit = () => {
    const w = Math.max(1, stage.offsetWidth);
    scene.style.setProperty('--zgap', `${(w * 0.16).toFixed(1)}px`);
    if (!apart) return;
    const keep = scene.style.getPropertyValue('--turn') || '0';
    const set = (k, v) => scene.style.setProperty(k, v);
    let s = 1; let ox = 0; let oy = 0;
    for (let pass = 0; pass < 3; pass += 1) {
      set('--s', String(s)); set('--ox', `${ox}px`); set('--oy', `${oy}px`); set('--turn', '1'); set('--apart', '1');
      const sr = scene.getBoundingClientRect();
      let l = Infinity; let t = Infinity; let r = -Infinity; let b = -Infinity;
      for (const el of pictures) {
        const q = el.getBoundingClientRect();
        l = Math.min(l, q.left); t = Math.min(t, q.top); r = Math.max(r, q.right); b = Math.max(b, q.bottom);
      }
      const k = Math.min((sr.width * 0.9) / (r - l), (sr.height * 0.8) / (b - t));
      s = Math.min(0.9, s * k);
      ox += (sr.left + sr.width / 2 - (l + r) / 2) * k;
      oy += (sr.top + sr.height * 0.52 - (t + b) / 2) * k;
    }
    set('--s', s.toFixed(3)); set('--ox', `${ox.toFixed(1)}px`); set('--oy', `${oy.toFixed(1)}px`);
    set('--turn', keep); set('--apart', keep);
  };
  // Labels sit flat on the page on a short leader to each plane's turned top corner, so they stay readable. When the
  // stack is squeezed (tablets, small laptops) neighbours would run into each other, so every second label hangs
  // under its plane's bottom corner instead; if even that is too tight, each takes the first free place.
  const placeTags = () => {
    const sr = scene.getBoundingClientRect();
    const GAP = 6;
    const LEAD = 8;
    const items = marks.map(([top, foot, t]) => {
      const a = top.getBoundingClientRect();
      const b = foot.getBoundingClientRect();
      return { t, w: t.offsetWidth, h: t.offsetHeight, top: [a.left - sr.left, a.top - sr.top], foot: [b.left - sr.left, b.top - sr.top] };
    });
    if (!items.length || !items[0].w) return; // the labels are hidden on small screens
    const boxFor = (it, below, lift) => {
      const [mx, my] = below ? it.foot : it.top;
      const l = Math.min(Math.max(2, mx - 4), sr.width - it.w - 2);
      const t = below ? my + LEAD : my - LEAD - lift - it.h;
      return { it, below, lift, mx, l, t, r: l + it.w, b: t + it.h };
    };
    const clash = (a, b) => a.l < b.r + GAP && b.l < a.r + GAP && a.t < b.b + GAP && b.t < a.b + GAP;
    const fits = (bx) => bx.t >= 2 && bx.b <= sr.height - 2;
    const clear = (layout) => layout.every(fits) && layout.every((a, i) => layout.slice(i + 1).every((b) => !clash(a, b)));
    let layout = items.map((it) => boxFor(it, false, 0));
    if (!clear(layout)) {
      const zigzag = (odd) => items.map((it, i) => boxFor(it, i % 2 === (odd ? 1 : 0), 0));
      layout = [zigzag(true), zigzag(false)].find(clear);
      if (!layout) {
        layout = [];
        for (const it of items) {
          const tries = [boxFor(it, false, 0), boxFor(it, true, 0), ...[1, 2, 3].map((k) => boxFor(it, false, k * (it.h + GAP)))];
          layout.push(tries.find((bx) => fits(bx) && layout.every((o) => !clash(bx, o))) || tries[0]);
        }
      }
    }
    for (const bx of layout) {
      const { t, w } = bx.it;
      t.style.left = `${bx.l.toFixed(1)}px`;
      t.style.top = `${bx.t.toFixed(1)}px`;
      t.style.setProperty('--lx', `${Math.min(w - 2, Math.max(2, bx.mx - bx.l)).toFixed(1)}px`);
      t.style.setProperty('--lead', `${LEAD + bx.lift}px`);
      t.classList.toggle('is-below', bx.below);
    }
  };
  // Where the vista sits on the page, cached so the scroll lag needs no layout reads while animating
  let sceneTop = 0;
  const measureTop = () => { sceneTop = scene.getBoundingClientRect().top + scrollY; };
  fit();
  measureTop();
  // The vignette that lays the painting into the paper: a rectangle eroded inwards, then pushed about by noise so the
  // painting stops in a ragged wet edge. It is drawn at the scene's own size in CSS pixels, and drawn again when that size
  // changes, so the edge keeps the same scale on every screen. Firefox draws nothing for a filtered SVG mask that is sized
  // only in percentages, so the size has to be written into the SVG.
  let vw = 0; let vh = 0; let vTimer = 0;
  const vignette = () => {
    const w = scene.offsetWidth;
    const h = scene.offsetHeight;
    if (!w || !h || (w === vw && h === vh)) return;
    vw = w; vh = h;
    const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='${w}' height='${h}' viewBox='0 0 ${w} ${h}'>`
      + "<filter id='f' x='0' y='0' width='1' height='1'><feMorphology in='SourceGraphic' operator='erode' radius='26' result='e'/>"
      + "<feTurbulence type='fractalNoise' baseFrequency='.011' numOctaves='4' seed='5' result='n'/>"
      + "<feDisplacementMap in='e' in2='n' scale='58' xChannelSelector='R' yChannelSelector='G' result='d'/>"
      + "<feGaussianBlur in='d' stdDeviation='1.4'/></filter>"
      + `<rect width='${w}' height='${h}' fill='#fff' filter='url(#f)'/></svg>`;
    scene.style.setProperty('--vignette', `url("data:image/svg+xml,${encodeURIComponent(svg)}")`);
  };
  vignette();
  // Fonts arriving and window resizes change the scene's size; until the new edge is drawn the old one stretches to fit.
  if ('ResizeObserver' in window) new ResizeObserver(() => { clearTimeout(vTimer); vTimer = setTimeout(vignette, 100); }).observe(scene);
  else addEventListener('resize', () => { clearTimeout(vTimer); vTimer = setTimeout(vignette, 100); });
  addEventListener('load', measureTop);
  addEventListener('resize', () => { fit(); measureTop(); if (apart && turn === 1) requestAnimationFrame(placeTags); });

  const apply = () => {
    scene.style.setProperty('--px', `${cx.toFixed(2)}px`);
    scene.style.setProperty('--py', `${cy.toFixed(2)}px`);
    scene.style.setProperty('--sy', `${sy.toFixed(1)}px`);
    scene.style.setProperty('--turn', turn.toFixed(4));
    scene.style.setProperty('--apart', turn.toFixed(4));
  };

  const frame = (now) => {
    raf = 0;
    if (!calm() && !apart && turn === 0) {
      // with no pointer for a while, the view drifts slowly on its own
      if (now - lastMove > 2500) {
        tx = Math.sin(now / 5200) * 14;
        ty = Math.sin(now / 7300) * 4;
      }
      sy = Math.max(0, scrollY - sceneTop) * 0.35;
    } else {
      tx = 0; ty = 0; sy = 0;
    }
    cx += (tx - cx) * 0.07;
    cy += (ty - cy) * 0.07;
    if (calm() || Math.abs(cx - tx) + Math.abs(cy - ty) < 0.05) { cx = tx; cy = ty; }
    if (turn !== turnTo) {
      const t = calm() ? 1 : Math.min(1, (now - turnStart) / TURN_MS);
      turn = turnFrom + (turnTo - turnFrom) * ease(t);
      if (t >= 1) {
        turn = turnTo;
        if (turnTo === 0) scene.classList.remove('is-apart');
        else { apply(); placeTags(); scene.classList.add('is-labelled'); }
      }
    }
    apply();
    const busy = turn !== turnTo || (!calm() && !apart && turn === 0) || Math.abs(cx - tx) + Math.abs(cy - ty) > 0.05;
    if (visible && busy) raf = requestAnimationFrame(frame);
  };
  const kick = () => { if (!raf && visible) raf = requestAnimationFrame(frame); };

  hero.addEventListener('pointermove', (e) => {
    if (calm() || apart) return;
    const r = scene.getBoundingClientRect();
    const nx = Math.max(-1, Math.min(1, ((e.clientX - r.left) / r.width) * 2 - 1));
    const ny = Math.max(-1, Math.min(1, ((e.clientY - r.top) / r.height) * 2 - 1));
    tx = -nx * 36;
    ty = -ny * 12;
    lastMove = performance.now();
    kick();
  });

  apartBtn.addEventListener('click', () => {
    apart = !apart;
    apartBtn.setAttribute('aria-pressed', String(apart));
    apartBtn.textContent = apart ? 'Put the planes back' : 'Pull the planes apart';
    writeNote();
    scene.classList.remove('is-labelled');
    if (apart) scene.classList.add('is-apart');
    fit();
    turnFrom = turn;
    turnTo = apart ? 1 : 0;
    turnStart = performance.now();
    kick();
  });

  if ('IntersectionObserver' in window) {
    new IntersectionObserver((entries) => {
      // several queued entries can arrive at once after a quick scroll; the newest one is the current state
      visible = entries[entries.length - 1].isIntersecting;
      kick();
    }).observe(scene);
  }
  addEventListener('scroll', kick, { passive: true });
  addEventListener('eas:calm', () => {
    writeNote();
    kick();
  });
  document.addEventListener('visibilitychange', () => { if (!document.hidden) kick(); });
  kick();
})();
