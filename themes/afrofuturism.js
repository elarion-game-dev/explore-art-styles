// Afrofuturism: a narrow-strip loom above every section weaves a kente-style strip from the page's own palette as the
// section scrolls into view. The finished cloth winds onto the beam on the left; ahead of it the bare warp runs out to the
// drag stone on the right. Warp-faced stretches (stripes along the strip) alternate with weft-faced blocks (checks, bars,
// stepped diamonds, hourglasses), as in the British Museum's kente cloth that the how-to cites.
// Calm mode and reduced motion show every strip finished. Also adds a key to the patterns in the footer.
(() => {
  const root = document.documentElement;
  const calm = () => Boolean(root.dataset.calm);
  const NS = 'http://www.w3.org/2000/svg';

  let colors = [];
  try { colors = JSON.parse(document.getElementById('palette-data').textContent).colors.map((c) => c.hex); } catch { /* no palette */ }
  if (colors.length < 3) colors = ['#291566', '#6351bc', '#9de3f3', '#ebb818', '#bb305a', '#864715', '#cca57d', '#21170c'];

  const lum = (hex) => {
    const [r, g, b] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255).map((v) => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4));
    return 0.2126 * r + 0.7152 * g + 0.0722 * b;
  };
  const contrast = (a, b) => { const [x, y] = [lum(a), lum(b)].sort((m, n) => n - m); return (x + 0.05) / (y + 0.05); };

  // One strip per section. The ground steps through the palette; the motif colour is the one that stands out most from
  // the ground, and the accent the next.
  function stripColours(i) {
    const order = [3, 4, 1, 5, 0, 7, 2, 6];
    const ground = colors[order[i % order.length] % colors.length];
    const rest = colors.filter((c) => c !== ground).sort((a, b) => contrast(b, ground) - contrast(a, ground));
    return { ground, motif: rest[0], accent: rest[1], third: rest[2] || rest[0] };
  }

  let seed = 1;
  const rnd = () => { seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646; };
  const rect = (x, y, w, h, fill) => `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${fill}"/>`;

  // The strip is 36 units across; one unit is one pixel on screen.
  const H = 36;
  function warpStretch(x, len, c) {
    // stripes along the strip, mirrored about its centre
    const bands = [[0, 3, c.motif], [3, 5, c.ground], [8, 2, c.accent], [10, 3, c.ground], [13, 2, c.motif], [15, 6, c.ground], [21, 2, c.motif], [23, 3, c.ground], [26, 2, c.accent], [28, 5, c.ground], [33, 3, c.motif]];
    return bands.map(([y, h, f]) => rect(x, y, len, h, f)).join('');
  }
  function weftBlock(x, len, c, kind) {
    let s = rect(x, 0, len, H, c.ground);
    if (kind === 0) { // checks
      const cw = 6;
      for (let cx = 0; cx < len; cx += cw) for (let r = 0; r < 6; r++) if ((cx / cw + r) % 2 === 0) s += rect(x + cx, r * 6, Math.min(cw, len - cx), 6, c.motif);
    } else if (kind === 1) { // weft bars across the strip
      for (let bx = 3; bx < len - 2; bx += 8) s += rect(x + bx, 0, 4, H, bx % 16 === 3 ? c.motif : c.accent);
    } else if (kind === 2) { // a stepped diamond
      const cx = x + len / 2;
      for (let r = 0; r < 6; r++) {
        const half = (r < 3 ? r + 1 : 6 - r) * 6;
        s += rect(cx - half, r * 6, half * 2, 6, c.motif);
        if (half > 6) s += rect(cx - half + 6, r * 6 + 2, half * 2 - 12, 2, c.accent);
      }
    } else { // hourglass: two triangles meeting at the centre
      const m = x + len / 2;
      s += `<path d="M${x + 3} 3H${x + len - 3}L${m} 18Z" fill="${c.motif}"/><path d="M${x + 3} 33H${x + len - 3}L${m} 18Z" fill="${c.accent}"/>`;
    }
    // the selvedges: warp threads that run along both edges of the whole strip
    return s + rect(x, 0, len, 2, c.motif) + rect(x, H - 2, len, 2, c.motif);
  }
  function clothSvg(i) {
    seed = 97 + i * 131;
    const c = stripColours(i);
    let x = 0, k = Math.floor(rnd() * 4), out = '';
    while (x < 2600) {
      const wl = 54 + Math.round(rnd() * 5) * 12;
      out += warpStretch(x, wl, c); x += wl;
      const bl = 36 + Math.round(rnd() * 3) * 6;
      out += weftBlock(x, bl, c, k % 4); x += bl;
      k += 1 + Math.floor(rnd() * 2);
    }
    return `<svg xmlns="${NS}" viewBox="0 0 2600 ${H}" width="2600" height="${H}" shape-rendering="crispEdges">${out}</svg>`;
  }
  // Each strip is one element: its cloth is a background image, drawn the first time the loom comes near the window
  // (or at once in calm mode), so the page carries no thousands of SVG nodes and the first paint waits for nothing.
  function weave(l) {
    if (l.built) return;
    l.built = true;
    l.cloth.style.backgroundImage = `url("data:image/svg+xml,${encodeURIComponent(clothSvg(l.i))}")`;
  }
  // the bare warp gathering from the cloth's width to the drag stone
  const fan = (() => {
    let p = '';
    for (let y = 0; y <= H; y += 3) p += `M0 ${y}L40 ${18 + (y - 18) * 0.18}`;
    return `<svg viewBox="0 0 40 ${H}" preserveAspectRatio="none" focusable="false"><path d="${p}" stroke="#ebb818" stroke-opacity=".85" stroke-width="1" fill="none" vector-effect="non-scaling-stroke"/></svg>`;
  })();

  const looms = [];
  document.querySelectorAll('main > .sec').forEach((sec, i) => {
    const el = document.createElement('div');
    el.className = 'af-loom';
    el.setAttribute('aria-hidden', 'true');
    el.innerHTML = `<i class="af-warp"></i><i class="af-fan">${fan}</i><i class="af-stone"></i><i class="af-cloth"></i><i class="af-edge"><i class="af-reed"></i><i class="af-shuttle"></i></i><i class="af-beam"></i>`;
    el.style.setProperty('--p', '0');
    sec.before(el);
    looms.push({ el, cloth: el.querySelector('.af-cloth'), i, p: 0, on: false, built: false });
  });

  // The hero rows: each picture grows by its own width-to-height ratio and keeps its own shape, read from the width and
  // height on its img, so a new picture is never cropped or letterboxed. The CSS holds the same values as a fallback.
  document.querySelectorAll('.hero-gallery .shot').forEach((shot) => {
    const img = shot.querySelector('img');
    const w = Number(img?.getAttribute('width')), h = Number(img?.getAttribute('height'));
    if (!(w > 0 && h > 0)) return;
    shot.style.flexGrow = (w / h).toFixed(4);
    const link = shot.querySelector('.shot-link');
    if (link) link.style.aspectRatio = `${w} / ${h}`;
  });

  // Scroll: a strip starts as it comes up from the bottom of the window and is finished when it reaches the upper third.
  // Cloth stays woven: scrolling back up never unpicks it. Reads all positions first, then writes.
  const PASS = 3; // one weft pass, in pixels
  let width = 0, frame = 0, idle = 0;
  const set = (l, p) => {
    l.p = p;
    l.el.style.setProperty('--p', p.toFixed(4));
    l.el.style.setProperty('--x', `${Math.round(p * width)}px`);
    l.el.classList.toggle('af-done', p >= 1);
  };
  const measure = () => { if (!width) width = looms[0]?.cloth.offsetWidth || 1000; };
  function update() {
    frame = 0;
    if (calm()) return;
    // read everything first
    const vh = innerHeight;
    measure();
    const tops = looms.map((l) => (l.on && l.p < 1 ? l.el.getBoundingClientRect().top : null));
    const left = Math.max(0, document.documentElement.scrollHeight - vh - scrollY); // how far the page can still scroll
    // then write
    let moved = false;
    looms.forEach((l, i) => {
      if (tops[i] === null) return;
      weave(l);
      // A strip is finished when its loom reaches the upper third of the window, or, for a loom near the end of the
      // page that can never scroll that high, where it will stand when the page is scrolled to the bottom.
      const finish = Math.min(vh * 0.9, Math.max(vh * 0.36, tops[i] - left));
      let p = (vh * 0.98 - tops[i]) / (vh * 0.98 - finish);
      if (left <= 2 && tops[i] < vh) p = 1;
      p = Math.min(1, Math.max(0, p));
      p = p >= 1 ? 1 : Math.round((p * width) / PASS) * PASS / width;
      if (p > l.p) { set(l, p); l.el.classList.add('af-weaving'); moved = true; }
    });
    if (moved) {
      clearTimeout(idle);
      idle = setTimeout(() => looms.forEach((l) => l.el.classList.remove('af-weaving')), 260);
    }
  }
  const queue = () => { if (!frame) frame = requestAnimationFrame(update); };

  // Calm mode shows every strip finished; a loom further down still gets its cloth when it comes near, as usual.
  let io = null;
  function finishAll() { looms.forEach((l) => { if (l.on || !io) weave(l); set(l, 1); l.el.classList.remove('af-weaving'); }); }

  if ('IntersectionObserver' in window) {
    io = new IntersectionObserver((entries) => {
      for (const e of entries) {
        const l = looms.find((x) => x.el === e.target);
        if (!l) continue;
        l.on = e.isIntersecting;
        if (l.on) weave(l); // draw the cloth a little before the loom scrolls into view
      }
      queue();
    }, { rootMargin: '0px 0px 600px 0px' });
    looms.forEach((l) => io.observe(l.el));
    addEventListener('scroll', queue, { passive: true });
    addEventListener('resize', () => { width = 0; measure(); looms.forEach((l) => set(l, l.p)); queue(); });
    // nothing is measured before the first paint: the first frame reads the layout, then weaves
    if (calm()) finishAll(); else queue();
  } else {
    finishAll();
  }
  addEventListener('eas:calm', () => { if (calm()) finishAll(); });

  // A key to the patterns, naming where each one comes from
  const foot = document.querySelector('.foot');
  if (foot) {
    const key = document.createElement('ul');
    key.className = 'af-key';
    key.setAttribute('aria-label', 'Patterns on this page');
    key.innerHTML = [
      ['k-kente', 'Kente strips', 'The dividers: narrow strips as woven by Asante and Ewe weavers in Ghana'],
      ['k-bogolan', 'Bògòlanfini', 'The feel: motifs left bare in black clay, a Bamana tradition of Mali'],
      ['k-adinkra', 'Adinkra', 'The how-to: squares ruled in triple lines and stamped, after Asante adinkra cloth from Ghana'],
      ['k-djenne', 'Djenné', 'The city: earth walls, buttresses and toron beams after the old towns of Djenné in Mali'],
    ].map(([cls, name, text]) => `<li class="${cls}"><span><b>${name}</b>${text}</span></li>`).join('');
    foot.prepend(key);
  }
})();
