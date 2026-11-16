// Cottagecore: a kitchen table. The title is cross-stitched in an embroidery hoop, every section title is stitched
// on a band of aida cloth, and a running stitch sews itself around each section as it comes into view.
(() => {
  const root = document.documentElement;
  const calm = () => root.dataset.calm === '1';
  const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

  // A 5 by 7 sampler alphabet, the kind worked on Victorian samplers.
  const G = {
    A: ['.###.', '#...#', '#...#', '#####', '#...#', '#...#', '#...#'],
    B: ['####.', '#...#', '#...#', '####.', '#...#', '#...#', '####.'],
    C: ['.###.', '#...#', '#....', '#....', '#....', '#...#', '.###.'],
    D: ['####.', '#...#', '#...#', '#...#', '#...#', '#...#', '####.'],
    E: ['#####', '#....', '#....', '####.', '#....', '#....', '#####'],
    F: ['#####', '#....', '#....', '####.', '#....', '#....', '#....'],
    G: ['.###.', '#...#', '#....', '#.###', '#...#', '#...#', '.###.'],
    H: ['#...#', '#...#', '#...#', '#####', '#...#', '#...#', '#...#'],
    I: ['.###.', '..#..', '..#..', '..#..', '..#..', '..#..', '.###.'],
    J: ['..###', '...#.', '...#.', '...#.', '...#.', '#..#.', '.##..'],
    K: ['#...#', '#..#.', '#.#..', '##...', '#.#..', '#..#.', '#...#'],
    L: ['#....', '#....', '#....', '#....', '#....', '#....', '#####'],
    M: ['#...#', '##.##', '#.#.#', '#.#.#', '#...#', '#...#', '#...#'],
    N: ['#...#', '#...#', '##..#', '#.#.#', '#..##', '#...#', '#...#'],
    O: ['.###.', '#...#', '#...#', '#...#', '#...#', '#...#', '.###.'],
    P: ['####.', '#...#', '#...#', '####.', '#....', '#....', '#....'],
    Q: ['.###.', '#...#', '#...#', '#...#', '#.#.#', '#..#.', '.##.#'],
    R: ['####.', '#...#', '#...#', '####.', '#.#..', '#..#.', '#...#'],
    S: ['.####', '#....', '#....', '.###.', '....#', '....#', '####.'],
    T: ['#####', '..#..', '..#..', '..#..', '..#..', '..#..', '..#..'],
    U: ['#...#', '#...#', '#...#', '#...#', '#...#', '#...#', '.###.'],
    V: ['#...#', '#...#', '#...#', '#...#', '#...#', '.#.#.', '..#..'],
    W: ['#...#', '#...#', '#...#', '#.#.#', '#.#.#', '#.#.#', '.#.#.'],
    X: ['#...#', '#...#', '.#.#.', '..#..', '.#.#.', '#...#', '#...#'],
    Y: ['#...#', '#...#', '.#.#.', '..#..', '..#..', '..#..', '..#..'],
    Z: ['#####', '....#', '...#.', '..#..', '.#...', '#....', '#####'],
    "'": ['..#..', '..#..', '.#...', '.....', '.....', '.....', '.....'],
    ',': ['.....', '.....', '.....', '.....', '.....', '..#..', '.#...'],
  };
  const DIGITS = {
    0: ['###', '#.#', '#.#', '#.#', '###'], 1: ['.#.', '##.', '.#.', '.#.', '###'], 2: ['###', '..#', '###', '#..', '###'],
    8: ['###', '#.#', '###', '#.#', '###'], 9: ['###', '#.#', '###', '..#', '###'],
  };
  const X = (x, y, c) => `<use href="#cc-x" x="${x}" y="${y}" width="1" height="1"${c ? ` style="color:${c}"` : ''}/>`;
  // Cells for one word, in a 5x7 grid with one empty column between letters.
  const cells = (word) => {
    const out = [];
    [...word].forEach((ch, i) => (G[ch] || []).forEach((row, y) => [...row].forEach((v, x) => { if (v === '#') out.push([i * 6 + x, y]); })));
    return { out, w: word.length * 6 - 1 };
  };

  // One shared stitch, drawn as two crossing threads with a little sheen.
  const defs = document.createElement('div');
  defs.innerHTML = `<svg width="0" height="0" style="position:absolute" aria-hidden="true"><defs>
    <symbol id="cc-x" viewBox="0 0 1 1" overflow="visible">
      <path d="M.14 .14L.86 .86" stroke="currentColor" stroke-width=".3" stroke-linecap="round"/>
      <path d="M.86 .14L.14 .86" stroke="currentColor" stroke-width=".3" stroke-linecap="round"/>
      <path d="M.8 .2L.2 .8" stroke="#fff" stroke-opacity=".28" stroke-width=".08" stroke-linecap="round"/>
    </symbol>
    <pattern id="cc-aida" width="1" height="1" patternUnits="userSpaceOnUse"><rect width="1" height="1" fill="#fbf6e9"/><circle cx="0" cy="0" r=".12" fill="#d9ccb0"/><circle cx="1" cy="0" r=".12" fill="#d9ccb0"/><circle cx="0" cy="1" r=".12" fill="#d9ccb0"/><circle cx="1" cy="1" r=".12" fill="#d9ccb0"/></pattern>
    <radialGradient id="cc-wood" cx=".5" cy=".5" r=".5"><stop offset=".86" stop-color="#b98a55"/><stop offset=".93" stop-color="#d9ad74"/><stop offset="1" stop-color="#9c6d3c"/></radialGradient>
  </defs></svg>`;
  document.body.append(defs.firstChild);

  // Hero: the title worked in an embroidery hoop, with a sampler border and the year the style took off.
  const h1 = document.querySelector('.hero-title');
  const title = h1.textContent.trim();
  const D = 58;
  const cx = D / 2;
  const parts = [];
  const put = (word, y, color) => { const { out, w } = cells(word); const x0 = Math.round(cx - w / 2); parts.push(`<g style="color:${color}">${out.map(([x, yy]) => X(x0 + x, y + yy)).join('')}</g>`); };
  const words = title.toUpperCase().length > 8 ? [title.toUpperCase().slice(0, 7), title.toUpperCase().slice(7)] : [title.toUpperCase()];
  if (words.length === 2) { put(words[0], 18, '#a94344'); put(words[1], 28, '#4f7a46'); } else put(words[0], 22, '#a94344');
  const motif = (rows, x0, y0, colors) => rows.forEach((row, y) => [...row].forEach((v, x) => { if (colors[v]) parts.push(X(x0 + x, y0 + y, colors[v])); }));
  const heart = ['.r.r.', 'rrrrr', 'rrrrr', '.rrr.', '..r..'];
  const berry = ['.g.g.', '..g..', '.rrr.', 'ryrrr', 'rrryr', '.rrr.', '..r..'];
  const flower = ['.p.', 'pyp', '.p.', '.g.', 'gg.'];
  const C = { r: '#b8474a', g: '#5f8a4c', y: '#efc75e', p: '#d98ca0', b: '#5f87ad' };
  motif(heart, cx - 2, 10, C);
  motif(flower, cx - 12, 10, { ...C, p: '#5f87ad' }); motif(flower, cx + 10, 10, { ...C, p: '#5f87ad' });
  
  motif(berry, cx - 18, 37, C); motif(berry, cx + 14, 37, C);
  motif(heart, cx - 11, 39, { ...C, r: '#d98ca0' }); motif(heart, cx + 7, 39, { ...C, r: '#d98ca0' });
  const yr = '2020';
  [...yr].forEach((d, i) => DIGITS[d].forEach((row, y) => [...row].forEach((v, x) => { if (v === '#') parts.push(X(cx - 7 + i * 4 + x, 47 + y, '#8a6a4a')); })));
  // A running stitch round the edge of the cloth.
  const ring = `<circle cx="${cx}" cy="${cx}" r="${cx - 3.2}" fill="none" stroke="#5f8a4c" stroke-width=".32" stroke-dasharray="1.1 .9" stroke-linecap="round"/>`;
  const hoop = document.createElement('div');
  hoop.className = 'cc-hoop';
  hoop.setAttribute('aria-hidden', 'true');
  hoop.innerHTML = `<svg viewBox="-5 -8 ${D + 10} ${D + 13}">
    <circle cx="${cx}" cy="${cx}" r="${cx + 2.6}" fill="url(#cc-wood)"/>
    <circle cx="${cx}" cy="${cx}" r="${cx + 2.6}" fill="none" stroke="#7d5530" stroke-width=".25"/>
    <circle cx="${cx}" cy="${cx}" r="${cx}" fill="url(#cc-aida)"/>
    <circle cx="${cx}" cy="${cx}" r="${cx}" fill="none" stroke="#000" stroke-opacity=".12" stroke-width="1.4"/>
    ${ring}${parts.join('')}
    <circle cx="${cx}" cy="${cx}" r="${cx + .9}" fill="none" stroke="#8a5c31" stroke-width="1.6"/>
    <circle cx="${cx}" cy="${cx}" r="${cx + .9}" fill="none" stroke="#e4bd86" stroke-width=".35" stroke-dasharray="6 3" stroke-opacity=".6"/>
    <rect x="${cx - 3.2}" y="-6.6" width="6.4" height="5" rx="1" fill="#b98a55" stroke="#7d5530" stroke-width=".25"/>
    <rect x="${cx - 1.4}" y="-7.6" width="2.8" height="7" rx=".6" fill="#c9cdd2" stroke="#7b8088" stroke-width=".25"/>
    <path d="M${cx - 1.1} -6.2h2.2M${cx - 1.1} -4.8h2.2M${cx - 1.1} -3.4h2.2" stroke="#7b8088" stroke-width=".25"/>
  </svg>`;
  h1.innerHTML = `<span class="cc-vh">${esc(title)}</span>`;
  h1.append(hoop);
  // The loose thread and needle, parked in the cloth.
  const needle = document.createElement('i');
  needle.className = 'cc-needle';
  needle.setAttribute('aria-hidden', 'true');
  hoop.append(needle);

  // Section titles: stitched on a band of aida, the real words kept for screen readers.
  const THREADS = ['#a94344', '#4f7a46', '#4d7392', '#9a5a2c', '#7a4a6a', '#a94344', '#4f7a46'];
  document.querySelectorAll('.sec-title').forEach((t, i) => {
    const text = t.textContent.trim();
    const band = document.createElement('span');
    band.className = 'cc-band';
    band.setAttribute('aria-hidden', 'true');
    band.style.setProperty('--thread', THREADS[i % THREADS.length]);
    band.innerHTML = text.toUpperCase().split(/\s+/).map((w) => {
      const { out, w: width } = cells(w);
      return `<svg class="cc-word" viewBox="-.5 -.5 ${width + 1} 8" style="--cw:${width + 1}">${out.map(([x, y]) => X(x, y)).join('')}</svg>`;
    }).join('');
    t.innerHTML = `<span class="cc-vh">${esc(text)}</span>`;
    t.append(band);
  });

  // A running stitch sewn round each section when it scrolls into view.
  const SVGNS = 'http://www.w3.org/2000/svg';
  const seams = [];
  document.querySelectorAll('.sec').forEach((sec, i) => {
    const s = document.createElementNS(SVGNS, 'svg');
    s.setAttribute('class', 'cc-seam');
    s.setAttribute('aria-hidden', 'true');
    s.style.setProperty('--thread', THREADS[i % THREADS.length]);
    s.innerHTML = `<defs><mask id="cc-m${i}" maskUnits="userSpaceOnUse"><rect class="cc-rev" pathLength="1" fill="none" stroke="#fff" stroke-width="10"/></mask></defs><rect class="cc-run" fill="none" mask="url(#cc-m${i})"/>`;
    sec.append(s);
    seams.push(s);
  });
  const size = () => {
    for (const s of seams) {
      const r = s.getBoundingClientRect();
      for (const rect of s.querySelectorAll('rect')) {
        rect.setAttribute('x', 2); rect.setAttribute('y', 2);
        rect.setAttribute('width', Math.max(0, r.width - 4)); rect.setAttribute('height', Math.max(0, r.height - 4));
        rect.setAttribute('rx', 8);
      }
    }
  };
  size();
  new ResizeObserver(size).observe(document.querySelector('.page'));
  const sewAll = () => document.querySelectorAll('.sec').forEach((s) => s.classList.add('cc-sewn'));
  if (calm() || !('IntersectionObserver' in window)) sewAll();
  else {
    const io = new IntersectionObserver((es) => es.forEach((e) => { if (e.isIntersecting) { e.target.classList.add('cc-sewn'); io.unobserve(e.target); } }), { threshold: 0.12 });
    document.querySelectorAll('.sec').forEach((s) => io.observe(s));
  }
  window.addEventListener('eas:calm', () => { if (calm()) sewAll(); });

  // The recipe card that heads the how-to.
  const steps = document.querySelector('.steps');
  if (steps) {
    const head = document.createElement('div');
    head.className = 'cc-recipe';
    head.innerHTML = `<p class="cc-recipe-title">Recipe for a cottagecore scene</p><p class="cc-recipe-meta"><span>Serves: one small world</span><span>Cards: ${steps.children.length}</span><span>From the kitchen of: Explore Art Styles</span></p>`;
    steps.before(head);
  }

  // Postmarks on the hero stamps, showing each work's year.
  document.querySelectorAll('.hero-gallery .shot').forEach((f) => {
    const y = (f.querySelector('.shot-meta')?.textContent.match(/\d{4}/) || [])[0];
    if (y) f.dataset.year = y;
  });

  // Pressed flowers tucked under the corners of a few cards.
  const FLOWERS = [
    `<svg viewBox="0 0 120 150"><path d="M60 148C58 110 62 80 58 50" stroke="#7d8f55" stroke-width="2.4" fill="none"/><path d="M59 104c-18-4-28-16-30-28 14 2 26 12 30 28zM60 86c16-6 26-18 26-30-12 4-24 14-26 30z" fill="#93a463" opacity=".85"/>${[0, 72, 144, 216, 288].map((a) => `<ellipse cx="58" cy="30" rx="9" ry="18" transform="rotate(${a} 58 46)" fill="#e9dccb" stroke="#c8b49a" stroke-width=".8"/>`).join('')}<circle cx="58" cy="46" r="8" fill="#e2b13e"/></svg>`,
    `<svg viewBox="0 0 120 150"><path d="M64 150C60 120 52 90 40 60" stroke="#6f8650" stroke-width="2" fill="none"/>${[[40, 56], [52, 44], [30, 44], [46, 30], [62, 58], [28, 64]].map(([x, y]) => `<g transform="translate(${x} ${y})">${[0, 72, 144, 216, 288].map((a) => `<ellipse cx="0" cy="-4" rx="2.6" ry="4" transform="rotate(${a})" fill="#8fb0d6"/>`).join('')}<circle r="1.6" fill="#f1d36a"/></g>`).join('')}<path d="M58 112c14-2 24 4 30 14-14 2-24-4-30-14z" fill="#8aa064" opacity=".8"/></svg>`,
    `<svg viewBox="0 0 120 150"><path d="M60 148V20" stroke="#6b7f45" stroke-width="2" fill="none"/>${Array.from({ length: 9 }, (_, i) => { const y = 30 + i * 12; const l = 34 - i * 2.4; return `<path d="M60 ${y}c-${l * 0.5} -6 -${l} -4 -${l} 2 ${l * 0.5} 4 ${l * 0.8} 2 ${l} -2zM60 ${y}c${l * 0.5} -6 ${l} -4 ${l} 2 -${l * 0.5} 4 -${l * 0.8} 2 -${l} -2z" fill="#8ea468" opacity=".85"/>`; }).join('')}</svg>`,
  ];
  [['#feel', 0, 'tr'], ['#how', 1, 'tl'], ['#palette', 2, 'tr'], ['#refs', 1, 'bl']].forEach(([sel, f, pos]) => {
    const sec = document.querySelector(sel);
    if (!sec) return;
    const el = document.createElement('i');
    el.className = `cc-pressed cc-${pos}`;
    el.setAttribute('aria-hidden', 'true');
    el.innerHTML = FLOWERS[f];
    sec.append(el);
  });
})();
