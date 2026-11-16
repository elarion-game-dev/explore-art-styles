// Art Nouveau: a whiplash vine grows round each poster panel as it comes into view, and the palette ends with
// Gismonda split into its five colour stones, printed again one stone at a time.
// Calm mode and reduced motion: the vines are simply there, fully grown, and the stones go on without moving.
(() => {
  const root = document.documentElement;
  const isCalm = () => root.dataset.calm === '1';
  const NS = 'http://www.w3.org/2000/svg';
  const MEDIA = '../media/art-nouveau/';
  const f = (n) => Math.round(n * 10) / 10;

  // ---------- the vine ----------
  // One half of the frame, as a path you can walk by distance: from the top centre, left along the top, round the
  // corner, down the side and along the bottom to the bottom centre. side = -1 walks left, +1 walks right.
  function halfFrame(w, h, m, r, side) {
    const cx = w / 2;
    const segs = [];
    const x0 = side < 0 ? m : w - m;
    segs.push({ len: cx - m - r, at: (s) => [cx + side * s, m, side, 0] });
    const arc = (cxr, cyr, a0, a1) => {
      const len = Math.abs(a1 - a0) * r;
      return { len, at: (s) => { const a = a0 + (a1 - a0) * (s / len); return [cxr + r * Math.cos(a), cyr + r * Math.sin(a), -Math.sin(a) * Math.sign(a1 - a0), Math.cos(a) * Math.sign(a1 - a0)]; } };
    };
    if (side < 0) {
      segs.push(arc(m + r, m + r, -Math.PI / 2, -Math.PI));
      segs.push({ len: h - 2 * m - 2 * r, at: (s) => [x0, m + r + s, 0, 1] });
      segs.push(arc(m + r, h - m - r, Math.PI, Math.PI / 2));
    } else {
      segs.push(arc(w - m - r, m + r, -Math.PI / 2, 0));
      segs.push({ len: h - 2 * m - 2 * r, at: (s) => [x0, m + r + s, 0, 1] });
      segs.push(arc(w - m - r, h - m - r, 0, Math.PI / 2));
    }
    segs.push({ len: cx - m - r, at: (s) => [side < 0 ? m + r + s : w - m - r - s, h - m, -side, 0] });
    const total = segs.reduce((a, g) => a + g.len, 0);
    const point = (s) => {
      let rest = Math.max(0, Math.min(total - 0.001, s));
      for (const g of segs) { if (rest <= g.len) return g.at(rest); rest -= g.len; }
      return segs[segs.length - 1].at(segs[segs.length - 1].len);
    };
    // corners: distance along the path where each arc starts
    const corners = [segs[0].len, segs[0].len + segs[1].len + segs[2].len];
    return { total, point, corners, straight: [[0, segs[0].len], [segs[0].len + segs[1].len, segs[0].len + segs[1].len + segs[2].len], [total - segs[4].len, total]] };
  }

  // A smooth path through points (Catmull-Rom turned into cubic Béziers).
  function smooth(pts) {
    let d = `M${f(pts[0][0])} ${f(pts[0][1])}`;
    for (let i = 0; i < pts.length - 1; i++) {
      const p0 = pts[Math.max(0, i - 1)], p1 = pts[i], p2 = pts[i + 1], p3 = pts[Math.min(pts.length - 1, i + 2)];
      d += `C${f(p1[0] + (p2[0] - p0[0]) / 6)} ${f(p1[1] + (p2[1] - p0[1]) / 6)} ${f(p2[0] - (p3[0] - p1[0]) / 6)} ${f(p2[1] - (p3[1] - p1[1]) / 6)} ${f(p2[0])} ${f(p2[1])}`;
    }
    return d;
  }

  // A tendril: leaves the stem inwards in an S, then winds into a spiral.
  function tendril(x, y, nx, ny, tx, ty, reach, turn) {
    const pts = [];
    const steps = 22;
    // S-curve out of the stem
    for (let i = 0; i <= 6; i++) {
      const t = i / 6;
      const out = reach * 0.55 * t;
      const along = reach * 0.5 * Math.sin(t * Math.PI) * turn * 0.6 + reach * 0.35 * t * turn;
      pts.push([x + nx * out + tx * along, y + ny * out + ty * along]);
    }
    // the curl
    const [sx, sy] = pts[pts.length - 1];
    const R = reach * 0.3;
    const a0 = Math.atan2(ny, nx) + (turn > 0 ? -Math.PI / 2 : Math.PI / 2);
    const ccx = sx - Math.cos(a0) * R, ccy = sy - Math.sin(a0) * R;
    for (let i = 1; i <= steps; i++) {
      const t = i / steps;
      const a = a0 + turn * t * Math.PI * 2.2;
      const rr = R * (1 - 0.78 * t);
      pts.push([ccx + Math.cos(a) * rr, ccy + Math.sin(a) * rr]);
    }
    return { d: smooth(pts), tip: pts[pts.length - 1], mid: pts[6] };
  }

  const deg = (x, y) => Math.atan2(y, x) * 180 / Math.PI;
  const LEAF = 'M0 0C3-4.6 9.5-5.8 15-1.6 10 1.6 4.4 3.4 0 0Z';
  function el(tag, attrs) { const n = document.createElementNS(NS, tag); for (const k in attrs) n.setAttribute(k, attrs[k]); return n; }

  function buildVine(svg, w, h) {
    // Sizes follow the panel's side padding, so tendrils never reach the text: 24px on phones, 44px and up above.
    const small = w < 600, mid = !small && w < 1000;
    const m = small ? 9 : mid ? 14 : 17, r = small ? 14 : mid ? 24 : 30, amp = small ? 1.8 : 3, lambda = small ? 110 : 170;
    const reach = small ? 11 : mid ? 22 : 30, every = small ? 150 : mid ? 200 : 230, leafS = small ? 0.62 : mid ? 0.85 : 1;
    const T = Math.min(4.2, Math.max(1.8, (w + h) / 900));
    svg.style.setProperty('--t', `${T}s`);
    svg.setAttribute('viewBox', `0 0 ${f(w)} ${f(h)}`);
    const frag = document.createDocumentFragment();
    const leaves = [];
    for (const side of [-1, 1]) {
      const hf = halfFrame(w, h, m, r, side);
      const wave = (s) => amp * Math.sin((s / lambda) * Math.PI * 2) * Math.min(1, s / 60, (hf.total - s) / 60);
      const line = (inset) => {
        const pts = [];
        for (let s = 0; s <= hf.total; s += 12) {
          const [x, y, tx, ty] = hf.point(s);
          const nx = -side * ty, ny = side * tx; // normal pointing into the panel
          const o = wave(s) + inset;
          pts.push([x + nx * o, y + ny * o]);
        }
        const [x, y] = hf.point(hf.total);
        pts.push([x, y]);
        return smooth(pts);
      };
      frag.append(el('path', { class: 'an-stem an-gilt', d: line(small ? -3 : -4.5), pathLength: 1 }));
      frag.append(el('path', { class: 'an-stem', d: line(0), pathLength: 1 }));
      // whiplash flourishes out of the two corners
      hf.corners.forEach((c, i) => {
        const s = c + (Math.PI / 4) * r;
        const [x, y, tx, ty] = hf.point(s);
        const nx = -side * ty, ny = side * tx;
        const turn = i ? side : -side;
        const t = tendril(x, y, nx, ny, tx, ty, reach * 1.45, turn);
        const d = (s / hf.total) * T;
        frag.append(el('path', { class: 'an-tendril', d: t.d, pathLength: 1, style: `--d:${f(d)}s` }));
        leaves.push({ x: t.mid[0], y: t.mid[1], a: deg(nx - tx * turn * 0.8, ny - ty * turn * 0.8), d: d + 0.3, s: leafS * 1.1 });
        frag.append(el('circle', { class: 'an-bud', cx: f(t.tip[0]), cy: f(t.tip[1]), r: small ? 2.6 : 4, style: `--d:${f(d + 0.7)}s` }));
      });
      // tendrils and leaves along the straight runs
      let k = side < 0 ? 0 : 1;
      for (const [a, b] of hf.straight) {
        for (let s = a + every * 0.45; s < b - every * 0.3; s += every) {
          const [x, y, tx, ty] = hf.point(s);
          const nx = -side * ty, ny = side * tx;
          const o = wave(s);
          const px = x + nx * o, py = y + ny * o;
          const d = (s / hf.total) * T;
          const turn = k++ % 2 ? 1 : -1;
          const t = tendril(px, py, nx, ny, tx, ty, reach * (0.7 + 0.3 * ((k * 7) % 3) / 2), turn);
          frag.append(el('path', { class: 'an-tendril', d: t.d, pathLength: 1, style: `--d:${f(d)}s` }));
          leaves.push({ x: px, y: py, a: deg(nx * 0.75 - tx * turn * 0.65, ny * 0.75 - ty * turn * 0.65), d: d + 0.15, s: leafS });
          leaves.push({ x: px - tx * every * 0.2, y: py - ty * every * 0.2, a: deg(-nx * 0.55 + tx * turn * 0.85, -ny * 0.55 + ty * turn * 0.85), d: d - 0.1, s: leafS * 0.8 });
          if (k % 3 === 0) frag.append(el('circle', { class: 'an-bud', cx: f(t.tip[0]), cy: f(t.tip[1]), r: small ? 2.2 : 3.4, style: `--d:${f(d + 0.6)}s` }));
        }
      }
    }
    for (const L of leaves) {
      const g = el('g', { transform: `translate(${f(L.x)} ${f(L.y)}) rotate(${f(L.a)}) scale(${L.s})` });
      g.append(el('path', { class: 'an-leaf', d: LEAF, style: `--d:${f(Math.max(0, L.d))}s` }));
      frag.append(g);
    }
    // the seed at the top centre and a rose at the bottom centre, where the two vines meet
    const seedR = small ? 4 : 6;
    frag.append(el('circle', { class: 'an-bud an-bud-c', cx: f(w / 2), cy: f(m), r: seedR, style: '--d:0s' }));
    const rose = el('g', { transform: `translate(${f(w / 2)} ${f(h - m)}) scale(${small ? 0.62 : 1})` });
    for (let i = 0; i < 5; i++) {
      const a = (i / 5) * Math.PI * 2 - Math.PI / 2;
      rose.append(el('circle', { class: 'an-bud', cx: f(Math.cos(a) * 6.5), cy: f(Math.sin(a) * 6.5), r: 5.2, style: `--d:${f(T + 0.05 * i)}s` }));
    }
    rose.append(el('circle', { class: 'an-bud an-bud-c', cx: 0, cy: 0, r: 4, style: `--d:${f(T + 0.3)}s` }));
    frag.append(rose);
    svg.replaceChildren(frag);
  }

  const panels = [...document.querySelectorAll('.sec')];
  const sizes = new WeakMap();
  const svgs = new Map();
  for (const p of panels) {
    const svg = el('svg', { class: 'an-vine', 'aria-hidden': 'true', focusable: 'false' });
    p.prepend(svg);
    svgs.set(p, svg);
  }
  // Panel sizes come from the observer, so building a vine never reads layout.
  const ro = new ResizeObserver((entries) => {
    for (const e of entries) {
      const box = e.borderBoxSize?.[0];
      const w = box ? box.inlineSize : e.contentRect.width;
      const h = box ? box.blockSize : e.contentRect.height;
      const old = sizes.get(e.target);
      if (old && Math.abs(old[0] - w) < 1 && Math.abs(old[1] - h) < 1) continue;
      sizes.set(e.target, [w, h]);
      buildVine(svgs.get(e.target), w, h);
    }
  });
  // Each vine is built only when its panel comes near the screen, sized from the observer entry (no layout read),
  // and is then kept in step with the panel's size.
  const build = (p, w, h) => { sizes.set(p, [w, h]); buildVine(svgs.get(p), w, h); ro.observe(p); };
  if ('IntersectionObserver' in window) {
    const near = new IntersectionObserver((entries) => {
      for (const e of entries) {
        if (!e.isIntersecting) continue;
        near.unobserve(e.target);
        build(e.target, e.boundingClientRect.width, e.boundingClientRect.height);
      }
    }, { rootMargin: '60% 0px 60% 0px' });
    panels.forEach((p) => near.observe(p));
  } else panels.forEach((p) => ro.observe(p));

  const growAll = () => panels.forEach((p) => p.classList.add('an-grown'));
  let io = null;
  if (isCalm() || !('IntersectionObserver' in window)) growAll();
  else {
    io = new IntersectionObserver((entries) => {
      for (const e of entries) if (e.isIntersecting) { e.target.classList.add('an-grown'); io.unobserve(e.target); }
    }, { rootMargin: '0px 0px -18% 0px' });
    panels.forEach((p) => io.observe(p));
  }
  addEventListener('beforeprint', growAll);

  // ---------- Gismonda in five stones ----------
  const INKS = [
    ['olive', 'Olive', '#d9cf7a'],
    ['salmon', 'Salmon', '#e6b09a'],
    ['lavender', 'Lavender', '#c2b4c6'],
    ['lightblue', 'Light blue', '#a9bcb0'],
    ['cobalt', 'Cobalt blue', '#23487c'],
  ];
  const palette = document.querySelector('.sec-palette');
  let press = null;
  if (palette) {
    // Cite the page's own sources for the five inks and for one stone per colour.
    const num = (re) => { const a = [...document.querySelectorAll('.source a')].find((x) => re.test(x.href)); return a ? a.closest('.source').id.replace('src-', '') : null; };
    const cites = [num(/artic\.edu/), num(/posterhouse\.org\/poster\/libraire-ed-sagot/)].filter(Boolean);
    const sup = cites.length ? `<sup class="cite">${cites.map((n) => `<a href="#src-${n}">${n}</a>`).join(',')}</sup>` : '';
    const img = (k, extra = '') => `<img src="${MEDIA}stone-${k}.webp" alt="" width="566" height="1600" loading="lazy" decoding="async"${extra}>`;
    press = document.createElement('div');
    press.className = 'an-press';
    press.innerHTML = `<h3 class="an-press-title">Gismonda in five stones</h3>
      <p class="an-press-note">Mucha's Gismonda is printed in lavender, salmon, cobalt blue, light blue and olive, each colour from its own stone.${sup} Below, the print is split by colour into five layers, a rough model of those stones. Press a stone to lift it off the print.</p>
      <div class="an-press-row">
        ${INKS.map(([k, name, c], i) => `<button type="button" class="an-stone" aria-pressed="true" data-i="${i}" title="Lift the ${name.toLowerCase()} stone off the print"><span class="an-sheet">${img(k)}</span><span class="an-name"><i style="--c:${c}"></i>${name}</span></button>`).join('')}
        <figure class="an-print"><span class="an-sheet">${INKS.map(([k]) => img(k, ` data-ink="${k}"`)).join('')}</span><figcaption class="an-name">Gismonda, 1894</figcaption></figure>
      </div>
      <div class="an-press-actions"><button type="button" class="btn an-run">Print it stone by stone</button></div>`;
    const actions = palette.querySelector('.palette-actions');
    (actions || palette.lastElementChild).after(press);

    const stones = [...press.querySelectorAll('.an-stone')];
    const layers = [...press.querySelectorAll('.an-print img')];
    const runBtn = press.querySelector('.an-run');
    // One place for a stone's state: pressed, its title and its layer on the print.
    const setStone = (i, on) => {
      const b = stones[i], name = INKS[i][1].toLowerCase();
      b.setAttribute('aria-pressed', String(on));
      b.title = on ? `Lift the ${name} stone off the print` : `Put back the ${name} stone on the print`;
      layers[i].classList.toggle('an-off', !on);
    };
    stones.forEach((b, i) => b.addEventListener('click', () => {
      if (!running) setStone(i, b.getAttribute('aria-pressed') !== 'true');
    }));

    let running = false;
    const wait = (ms) => new Promise((res) => setTimeout(res, ms));
    const setBusy = (busy) => { running = busy; runBtn.disabled = busy; stones.forEach((b) => { b.disabled = busy; }); };
    async function printRun() {
      if (running) return;
      setBusy(true);
      stones.forEach((b, i) => setStone(i, true));
      layers.forEach((l) => l.classList.add('an-off'));
      await wait(isCalm() ? 200 : 450);
      // Measure once, before anything moves: the press, the five stone sheets and the print, relative to the press.
      let rects = null;
      if (!isCalm() && press.isConnected) {
        const box = press.getBoundingClientRect();
        const rel = (r) => ({ left: r.left - box.left, top: r.top - box.top, width: r.width, height: r.height });
        rects = {
          from: stones.map((b) => rel(b.querySelector('.an-sheet').getBoundingClientRect())),
          to: rel(press.querySelector('.an-print .an-sheet').getBoundingClientRect()),
        };
      }
      for (let i = 0; i < INKS.length; i++) {
        if (rects && !isCalm() && press.isConnected) {
          // fly a copy of the stone onto the print
          const from = rects.from[i], to = rects.to;
          const fly = stones[i].querySelector('img').cloneNode();
          fly.className = 'an-fly';
          fly.removeAttribute('loading');
          Object.assign(fly.style, { left: `${from.left}px`, top: `${from.top}px`, width: `${from.width}px`, height: `${from.height}px` });
          press.append(fly);
          const dx = to.left - from.left, dy = to.top - from.top, sx = to.width / from.width, sy = to.height / from.height;
          const anim = fly.animate([
            { transform: 'translate(0, 0) scale(1)', opacity: 1 },
            { transform: `translate(${dx * 0.5}px, ${dy * 0.5 - 40}px) scale(${(1 + sx) / 2}, ${(1 + sy) / 2})`, opacity: 1, offset: 0.55 },
            { transform: `translate(${dx}px, ${dy}px) scale(${sx}, ${sy})`, opacity: 1 },
          ], { duration: 900, easing: 'cubic-bezier(.45, 0, .3, 1)' });
          await anim.finished.catch(() => {});
          layers[i].classList.remove('an-off');
          fly.remove();
          await wait(220);
        } else {
          layers[i].classList.remove('an-off');
          await wait(isCalm() ? 450 : 0);
        }
      }
      setBusy(false);
    }
    runBtn.addEventListener('click', printRun);

    // Print it once by itself, the first time it comes into view.
    if (!isCalm() && 'IntersectionObserver' in window) {
      const pio = new IntersectionObserver((entries) => {
        if (!entries.some((e) => e.isIntersecting)) return;
        pio.disconnect();
        const imgs = [...press.querySelectorAll('.an-print img')];
        Promise.all(imgs.map((im) => (im.complete ? Promise.resolve() : new Promise((res) => { im.addEventListener('load', res, { once: true }); im.addEventListener('error', res, { once: true }); })))).then(() => { if (!isCalm()) printRun(); });
      }, { threshold: 0.45 });
      pio.observe(press.querySelector('.an-press-row'));
    }
  }

  addEventListener('eas:calm', () => {
    if (!isCalm()) return;
    growAll();
    io?.disconnect();
    press?.querySelectorAll('.an-fly').forEach((n) => { n.getAnimations().forEach((a) => a.finish()); });
  });
})();
