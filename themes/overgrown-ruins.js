// Overgrown Ruins: ivy that grows down the wall as you read, routed around the slabs so it never covers text.
// Paths are generated for the real layout, grown with stroke-dash, and leaves open when the tip passes them.
// More vines join at each stage of succession. Calm mode shows the fully grown wall, still.
(() => {
  const root = document.documentElement;
  const NS = 'http://www.w3.org/2000/svg';
  const calm = () => root.dataset.calm === '1';
  const STAGES = { feel: 'Stage 1: lichen', core: 'Stage 2: moss', how: 'Stage 3: grass', palette: 'Stage 4: vines', vibe: 'Stage 5: saplings', refs: 'Stage 6: canopy', related: 'Stage 7: forest' };

  // Name each slab's stage, and wrap videos so they sit inside a broken wall opening.
  for (const [id, text] of Object.entries(STAGES)) {
    const sec = document.getElementById(id);
    if (!sec) continue;
    const tag = document.createElement('span');
    tag.className = 'og-stage';
    tag.textContent = text;
    sec.querySelector('.sec-title')?.before(tag);
  }
  const grassOn = document.getElementById('how');
  if (grassOn) {
    const g = document.createElement('i');
    g.className = 'og-grass';
    g.setAttribute('aria-hidden', 'true');
    grassOn.append(g);
  }
  const rebar = (id, css, flip) => {
    const sec = document.getElementById(id);
    if (!sec) return;
    const r = document.createElement('i');
    r.className = 'og-rebar';
    r.setAttribute('aria-hidden', 'true');
    r.style.cssText = css + (flip ? ';transform:scaleX(-1)' : '');
    sec.append(r);
  };
  rebar('core', 'right:-92px;top:-22px');
  rebar('how', 'left:-90px;top:-8px', true);
  rebar('vibe', 'right:-96px;top:-18px');
  for (const v of document.querySelectorAll('.loop video')) {
    const h = document.createElement('div');
    h.className = 'og-hole';
    v.before(h);
    h.append(v);
  }

  // Leaf shapes. Origin is where the leaf stalk meets the stem; the tip points up.
  const defs = document.createElementNS(NS, 'svg');
  defs.setAttribute('width', '0');
  defs.setAttribute('height', '0');
  defs.style.position = 'absolute';
  defs.innerHTML = `<defs>
    <g id="og-ivy" transform="translate(0 -6)">
      <path d="M0 6V0" stroke="#4a3f29" stroke-width="1.2" fill="none"/>
      <path d="M0 0C-3-2-9-2-12-6-9-7-8-9-9-12-6-11-4-13-4-16-2-17-1-21 0-24 1-21 2-17 4-16 4-13 6-11 9-12 8-9 9-7 12-6 9-2 3-2 0 0Z" fill="currentColor"/>
      <path d="M0 0V-24C1-21 2-17 4-16 4-13 6-11 9-12 8-9 9-7 12-6 9-2 3-2 0 0Z" fill="#000" opacity=".16"/>
      <path d="M0 0V-19M0-3-8-7M0-3 8-7M0-9-4-13M0-9 4-13" stroke="#fffde0" stroke-width=".55" opacity=".36" fill="none"/>
    </g>
    <g id="og-oval" transform="translate(0 -5)">
      <path d="M0 5V0" stroke="#4a3f29" stroke-width="1" fill="none"/>
      <path d="M0 0C-8-4-9-13 0-23 9-13 8-4 0 0Z" fill="currentColor"/>
      <path d="M0 0V-23C9-13 8-4 0 0Z" fill="#000" opacity=".15"/>
      <path d="M0 0V-19M0-6-4-10M0-6 4-10M0-12-3-15M0-12 3-15" stroke="#fffde0" stroke-width=".5" opacity=".36" fill="none"/>
    </g></defs>`;
  document.body.append(defs);

  const layer = document.createElement('div');
  layer.className = 'og-vines';
  layer.setAttribute('aria-hidden', 'true');
  document.body.append(layer);

  const COLORS = ['#2f4120', '#3b5125', '#4b632b', '#5f7733', '#7f9142', '#a0a950'];
  let vines = [];
  let maxFront = 0;
  let builtKey = '';

  const seeded = (s) => () => { s = (s * 1664525 + 1013904223) % 4294967296; return s / 4294967296; };
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));

  // Smooth a list of points with Catmull-Rom, sampled about every 10 px.
  function spline(pts) {
    const out = [];
    const P = [pts[0], ...pts, pts[pts.length - 1]];
    for (let i = 0; i < P.length - 3; i += 1) {
      const [p0, p1, p2, p3] = [P[i], P[i + 1], P[i + 2], P[i + 3]];
      const d = Math.hypot(p2[0] - p1[0], p2[1] - p1[1]);
      const n = Math.max(1, Math.round(d / 10));
      for (let k = 0; k < n; k += 1) {
        const t = k / n;
        const t2 = t * t;
        const t3 = t2 * t;
        out.push([
          0.5 * (2 * p1[0] + (p2[0] - p0[0]) * t + (2 * p0[0] - 5 * p1[0] + 4 * p2[0] - p3[0]) * t2 + (3 * p1[0] - p0[0] - 3 * p2[0] + p3[0]) * t3),
          0.5 * (2 * p1[1] + (p2[1] - p0[1]) * t + (2 * p0[1] - 5 * p1[1] + 4 * p2[1] - p3[1]) * t2 + (3 * p1[1] - p0[1] - 3 * p2[1] + p3[1]) * t3),
        ]);
      }
    }
    out.push(pts[pts.length - 1]);
    return out;
  }

  // The vine layer's width, measured once per build: reading it after every chunk was appended forced a fresh layout
  // of the whole page each time, which cost seconds on a slow phone.
  let layerW = 0;

  // One vine: split into chunks of about 900 px, so only the part still growing is repainted.
  function makeVine(pts, opt) {
    const line = spline(pts);
    const Ls = [0];
    for (let i = 1; i < line.length; i += 1) Ls[i] = Ls[i - 1] + Math.hypot(line[i][0] - line[i - 1][0], line[i][1] - line[i - 1][1]);
    const total = Ls[Ls.length - 1];
    const v = { line, Ls, total, chunks: [], leaves: [], li: 0, current: 0, target: 0, p: 0, up: opt.up, trigger: opt.trigger };
    const CH = 90;
    const rnd = opt.rnd;
    for (let i = 0; i < line.length - 1; i += CH) {
      const end = Math.min(line.length - 1, i + CH);
      const seg = line.slice(i, end + 1);
      const ys = seg.map((q) => q[1]);
      const y0 = Math.min(...ys) - 60;
      const y1 = Math.max(...ys) + 60;
      const svg = document.createElementNS(NS, 'svg');
      svg.setAttribute('width', layerW);
      svg.setAttribute('height', y1 - y0);
      svg.setAttribute('viewBox', `0 ${y0} ${layerW} ${y1 - y0}`);
      svg.style.top = `${y0}px`;
      const d = `M${seg.map((q) => `${q[0].toFixed(1)} ${q[1].toFixed(1)}`).join('L')}`;
      const w = opt.width * (1 - 0.55 * (i / line.length));
      const stem = document.createElementNS(NS, 'path');
      stem.setAttribute('d', d);
      stem.setAttribute('class', 'og-stem');
      stem.setAttribute('stroke-width', w.toFixed(2));
      const stem2 = document.createElementNS(NS, 'path');
      stem2.setAttribute('d', d);
      stem2.setAttribute('class', 'og-stem2');
      stem2.setAttribute('stroke-width', (w * 0.34).toFixed(2));
      svg.append(stem, stem2);
      layer.append(svg);
      const len = Ls[end] - Ls[i];
      v.chunks.push({ s: Ls[i], len, stem, stem2, drawn: -1, svg });
      // Leaves along this chunk. Dangling, on alternating sides, thicker where the opt says so.
      let dist = rnd() * opt.gap;
      for (let k = i; k < end; k += 1) {
        dist -= Ls[k + 1] - Ls[k];
        if (dist > 0) continue;
        dist = opt.gap * (0.6 + rnd() * 0.8);
        const side = rnd() < 0.5 ? -1 : 1;
        const base = opt.up ? Math.atan2(line[k + 1][0] - line[k][0], line[k][1] - line[k + 1][1]) * 57.3 : 180;
        const a = base + side * (18 + rnd() * 62);
        const s = opt.leaf * (0.62 + rnd() * 0.72);
        const col = COLORS[Math.floor(rnd() * rnd() * 0.75 * COLORS.length + (opt.sun ? rnd() * 2 : 0))] || COLORS[2];
        const g = document.createElementNS(NS, 'g');
        g.setAttribute('transform', `translate(${line[k][0].toFixed(1)} ${line[k][1].toFixed(1)}) rotate(${a.toFixed(0)}) scale(${s.toFixed(2)})`);
        const u = document.createElementNS(NS, 'use');
        u.setAttribute('href', opt.shape || '#og-ivy');
        u.setAttribute('class', 'og-lf');
        u.setAttribute('color', col);
        g.append(u);
        svg.append(g);
        v.leaves.push({ l: Ls[k], el: u });
      }
    }
    return v;
  }

  function build() {
    const vw = root.clientWidth;
    const pageEl = document.querySelector('.page');
    const height = Math.ceil(pageEl.getBoundingClientRect().bottom + scrollY);
    const key = `${vw}|${Math.round(height / 40)}`;
    if (key === builtKey) return;
    builtKey = key;
    layer.textContent = '';
    layer.style.height = `${height}px`;
    layerW = layer.offsetWidth;
    vines = [];

    const small = vw < 720;
    const docRect = (el) => { const r = el.getBoundingClientRect(); return { top: r.top + scrollY, bottom: r.bottom + scrollY, left: r.left, right: r.right }; };
    const atlasH = document.querySelector('.atlas')?.offsetHeight || 48;
    const titleBox = docRect(document.querySelector('.hero-title'));
    const textTop = docRect(document.querySelector('.hero-kicker')).top;
    const heroGal = docRect(document.querySelector('.hero-gallery'));
    const bands = [{ top: atlasH, bottom: heroGal.bottom + 40, left: heroGal.left, right: heroGal.right, id: 'hero' }];
    const toc = docRect(document.querySelector('.toc'));
    bands[0].bottom = toc.bottom;
    for (const s of document.querySelectorAll('main .sec')) bands.push({ ...docRect(s), id: s.id });
    const foot = docRect(document.querySelector('.foot'));

    const rnd = seeded(1836);
    const rangeFor = (side, B) => {
      const edge = small ? 7 : 10;
      if (side < 0) {
        const hi = small ? 8 : Math.max(B.left + edge, 8);
        return [small ? 2 : Math.max(4, hi - 170), hi];
      }
      const lo = small ? vw - 8 : Math.min(B.right - edge, vw - 8);
      return [lo, small ? vw - 2 : Math.min(vw - 4, lo + 170)];
    };
    const pick = (side, B) => { const [a, b] = rangeFor(side, B); return a + rnd() * (b - a); };

    const route = (side, from, y0, crossP) => {
      const pts = [];
      let s = side;
      let x = pick(s, bands[from]);
      let y = y0;
      pts.push([x, y]);
      for (let b = from; b < bands.length; b += 1) {
        const B = bands[b];
        while (y < B.bottom - 24) {
          y = Math.min(B.bottom, y + 54 + rnd() * 74);
          const [lo, hi] = rangeFor(s, B);
          x = clamp(x + (rnd() - 0.5) * (small ? 16 : 74), lo, hi);
          pts.push([x, y]);
        }
        const next = bands[b + 1];
        const gapBot = next ? next.top : foot.top + 50;
        const gapH = gapBot - B.bottom;
        y = B.bottom + gapH * (0.34 + rnd() * 0.3);
        if (next && rnd() < crossP && gapH > 56) {
          const t = -s;
          const [lo, hi] = rangeFor(t, next);
          const tx = lo + rnd() * (hi - lo);
          const steps = Math.max(2, Math.round(Math.abs(tx - x) / 150));
          const sag = gapH * 0.2 * (0.4 + rnd() * 0.7);
          for (let i = 1; i <= steps; i += 1) {
            const u = i / steps;
            pts.push([x + (tx - x) * u, y + Math.sin(u * Math.PI) * sag + (rnd() - 0.5) * 7]);
          }
          x = tx;
          s = t;
        } else pts.push([x + (rnd() - 0.5) * 12, y]);
        if (!next) { pts.push([x, gapBot]); break; }
      }
      return pts;
    };

    const leaf = small ? 0.64 : 1.08;
    const add = (pts, o) => vines.push(makeVine(pts, { rnd, width: small ? 2.6 : 4, gap: small ? 38 : 26, leaf, ...o }));

    // Long vines from the top of the wall. More join at every stage below.
    add(route(-1, 0, atlasH + 2, 0.34), { sun: true, width: small ? 3 : 5 });
    add(route(1, 0, atlasH + 2, 0.34), { sun: true, width: small ? 3 : 5 });
    if (!small) add(route(1, 0, atlasH + 2, 0.5), { sun: true });
    const joins = { feel: 0, core: small ? 0 : 1, how: 1, palette: small ? 1 : 2, vibe: small ? 1 : 2, refs: small ? 1 : 3, related: small ? 1 : 3 };
    bands.forEach((B, i) => {
      for (let k = 0; k < (joins[B.id] || 0); k += 1) add(route(k % 2 ? 1 : -1, i, B.top - 30, 0.5), { width: small ? 2 : 3.2, gap: small ? 30 : 22, leaf: leaf * 0.94 });
    });

    // The curtain: short strands hanging from the top edge of the wall. They frame the title without covering it.
    const strands = small ? 7 : 15;
    for (let i = 0; i < strands; i += 1) {
      const x = (i + 0.5 + (rnd() - 0.5) * 0.7) * (vw / strands);
      const clear = textTop - atlasH - 6;
      const outside = x < titleBox.left - 8 || x > titleBox.right + 8;
      const long = outside ? clear + 150 + rnd() * (small ? 90 : 240) : clear * (0.4 + rnd() * 0.6);
      const pts = [[x, atlasH - 4]];
      let y = atlasH;
      let px = x;
      while (y < atlasH + long) {
        y = Math.min(atlasH + long, y + 26 + rnd() * 30);
        px += (rnd() - 0.5) * 16;
        pts.push([px, y]);
      }
      add(pts, { width: small ? 1.8 : 2.6, gap: 15, leaf: leaf * 0.86, sun: true });
    }

    // The canopy: at the last two stages a vine is slung across the gap, and strands hang from it over the slab's top edge.
    for (const id of ['refs', 'related']) {
      const B = bands.find((q) => q.id === id);
      if (!B) continue;
      const prev = bands[bands.indexOf(B) - 1];
      const y = B.top - (B.top - prev.bottom) * 0.5;
      const sling = [];
      const n = Math.max(4, Math.round(vw / 170));
      for (let i = 0; i <= n; i += 1) sling.push([(i / n) * vw, y + Math.sin((i / n) * Math.PI) * 26 + (rnd() - 0.5) * 12]);
      add(sling, { width: small ? 2.2 : 3, gap: small ? 26 : 18, leaf: leaf * 0.9, trigger: B.top - innerHeight * 0.4 });
      const strands2 = small ? 5 : 12;
      for (let i = 0; i < strands2; i += 1) {
        const px0 = ((i + 0.5 + (rnd() - 0.5) * 0.6) / strands2) * vw;
        const py0 = y + Math.sin((px0 / vw) * Math.PI) * 26;
        const long = B.top - py0 + (small ? 34 : 42) * rnd();
        const pts = [[px0, py0]];
        for (let k = 1; k <= 3; k += 1) pts.push([px0 + (rnd() - 0.5) * 12, py0 + (long * k) / 3]);
        add(pts, { width: small ? 1.6 : 2.2, gap: 14, leaf: leaf * 0.84, trigger: B.top - innerHeight * 0.2 });
      }
    }

    // Saplings: stage 5 sprouts from the top of its slab, in the gap above it.
    const vibe = bands.find((B) => B.id === 'vibe');
    if (vibe) {
      const prev = bands[bands.indexOf(vibe) - 1];
      const room = vibe.top - prev.bottom;
      for (const f of (small ? [0.16, 0.8] : [0.12, 0.3, 0.7, 0.86])) {
        const x = vibe.left + (vibe.right - vibe.left) * f;
        const tall = room * (0.56 + rnd() * 0.34);
        const pts = [[x, vibe.top + 6]];
        const n = 5;
        for (let i = 1; i <= n; i += 1) pts.push([x + (rnd() - 0.5) * 30 * (i / n), vibe.top + 6 - tall * (i / n)]);
        add(pts, { up: true, trigger: vibe.top, shape: '#og-oval', width: small ? 2.6 : 3.6, gap: 13, leaf: leaf * 0.86, sun: true });
      }
    }

    // After a rebuild, keep what has already grown.
    for (const v of vines) { advance(v, true); paint(v, true); }
  }

  // Where the vine should have reached for the current growth front.
  function advance(v, instant) {
    if (v.trigger !== undefined) v.target = maxFront > v.trigger ? v.total : 0;
    else {
      while (v.p < v.line.length - 1 && v.line[v.p + 1][1] <= maxFront) v.p += 1;
      v.target = v.p >= v.line.length - 1 ? v.total : v.Ls[v.p];
    }
    if (instant) v.current = v.target;
  }

  function paint(v) {
    for (const c of v.chunks) {
      const d = clamp(v.current - c.s, 0, c.len);
      if (Math.abs(d - c.drawn) < 0.3) continue;
      c.drawn = d;
      const dash = `${d.toFixed(1)} 99999`;
      c.stem.setAttribute('stroke-dasharray', dash);
      c.stem2.setAttribute('stroke-dasharray', dash);
      c.svg.style.visibility = d > 0 ? '' : 'hidden';
    }
    while (v.li < v.leaves.length && v.leaves[v.li].l <= v.current) {
      v.leaves[v.li].el.classList.add('on');
      v.li += 1;
    }
  }

  let raf = 0;
  function frame() {
    raf = 0;
    let busy = false;
    for (const v of vines) {
      advance(v);
      if (v.current < v.target - 0.5) {
        v.current = Math.min(v.target, v.current + Math.max(1.4, (v.target - v.current) * 0.05));
        paint(v);
        busy = true;
      }
    }
    if (busy) schedule();
  }
  function schedule() { if (!raf) raf = requestAnimationFrame(frame); }

  const updateFront = () => {
    maxFront = Math.max(maxFront, scrollY + innerHeight * 0.92);
    schedule();
  };
  const growAll = () => {
    maxFront = Infinity;
    for (const v of vines) { advance(v, true); paint(v); }
  };

  // The vines are built after the first paint, so the page shows before their thousands of shapes are laid out.
  requestAnimationFrame(() => setTimeout(() => {
    build();
    if (calm()) growAll(); else updateFront();
  }, 0));
  addEventListener('scroll', () => { if (!calm()) updateFront(); }, { passive: true });

  let wait;
  const again = () => {
    clearTimeout(wait);
    wait = setTimeout(() => {
      build();
      if (calm()) growAll(); else updateFront();
    }, 200);
  };
  addEventListener('resize', again);
  addEventListener('load', again);
  if (document.fonts?.ready) document.fonts.ready.then(again);
  addEventListener('eas:calm', (e) => { if (e.detail?.calm) growAll(); else updateFront(); });
})();
