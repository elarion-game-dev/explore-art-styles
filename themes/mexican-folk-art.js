// Mexican Folk Art / Día de Muertos: the moving and hand-placed parts of the street and the ofrenda.
// - A string of papel picado across the top of every wall (.hero, each .sec, .foot). The string is tied at posts and sags
//   between them; each flag hangs from it at the cord's slope, cut from one of five masks (themes/mexican-folk-art.css,
//   --pp1 to --pp5), and throws a coloured shadow that leans away from the middle of the street, as under one lamp.
//   Flags sway on their own while their wall is on screen, and flutter when the pointer brushes them or a fast scroll
//   blows past.
// - An arch of cempasúchil and cresta de gallo over the title, as on an ofrenda.
// - Two candles at the ends of the altar's upper tier and a path of marigold petals in front of it.
// Sizes are measured once by ResizeObserver and the pieces are built from those numbers; nothing reads layout or style
// while it moves things. Each wall's string is built when the wall comes near the screen or in an idle moment, never all
// at once. In calm mode, or with reduced motion, nothing sways or flutters.
(() => {
  const root = document.documentElement;
  const page = document.querySelector('.page');
  if (!page) return;
  const isCalm = () => root.dataset.calm === '1';
  const NS = 'http://www.w3.org/2000/svg';
  const n1 = (v) => Math.round(v * 10) / 10;

  // ---- colours of tissue paper, chosen per wall so every flag stands out from the paint behind it ----
  const P = {
    pink: '#e8078d', rosa: '#ff8cc6', mari: '#f59a1b', yellow: '#ffd23f', lime: '#9ccf2b', turq: '#14b4c9',
    lilac: '#c9a2f2', red: '#f2283c', violet: '#7a35d6', bone: '#fff4d6', blue: '#2f56e0', green: '#2f9e44',
  };
  const DARK = [P.pink, P.mari, P.lime, P.turq, P.yellow, P.lilac, P.red];
  const SETS = {
    hero: [P.pink, P.mari, P.lime, P.turq, P.yellow, P.lilac, P.red, P.rosa],
    'sec-core': [P.mari, P.yellow, P.lime, P.turq, P.bone, P.lilac],
    'sec-related': [P.yellow, P.turq, P.mari, P.bone, P.lime, P.lilac],
    'sec-how': [P.pink, P.yellow, P.mari, P.rosa, P.lime, P.red, P.bone],
    'sec-vibe': [P.pink, P.mari, P.yellow, P.lime, P.turq, P.rosa],
    'sec-palette': [P.pink, P.mari, P.turq, P.violet, P.lime, P.red, P.blue],
    'sec-sources': [P.turq, P.pink, P.mari, P.green, P.violet, P.red],
  };
  const setFor = (host) => {
    if (host.classList.contains('hero')) return SETS.hero;
    for (const c of host.classList) if (SETS[c]) return SETS[c];
    return DARK;
  };

  // ---- papel picado ----
  const strings = []; // { host, el, flags: [], width, band, live }
  const hosts = [...document.querySelectorAll('.hero, .sec, .foot')];

  // Sizes follow the band each wall leaves at its top (--pp-band in the CSS).
  function geometry(width, band, hero) {
    const small = width < 720;
    const top = small ? 5 : 7;
    const sag = hero ? (small ? 16 : 30) : (small ? 14 : 22);
    const fw = Math.max(44, Math.floor((band - top - sag - (small ? 6 : 10)) / 1.18));
    const gap = Math.round(fw * 0.15);
    const swags = Math.max(1, Math.round(width / (sag * 26)));
    return { top, sag, fw, gap, swags, span: width / swags };
  }

  function buildString(s) {
    const { host, width, band } = s;
    const g = geometry(width, band, host.classList.contains('hero'));
    const colours = setFor(host);
    const offset = hosts.indexOf(host); // each wall starts the motifs and colours at a different place
    // The cord: one parabola per swag, tied at a post at each end.
    let d = '';
    const knots = [];
    for (let j = 0; j < g.swags; j++) {
      const x0 = j * g.span;
      const x1 = x0 + g.span;
      d += `M${n1(x0)} ${g.top}Q${n1((x0 + x1) / 2)} ${g.top + 2 * g.sag} ${n1(x1)} ${g.top}`;
      if (j) knots.push(x0);
    }
    const cordY = (x) => {
      const j = Math.min(g.swags - 1, Math.floor(x / g.span));
      const t = (x - j * g.span) / g.span;
      return { y: g.top + 4 * g.sag * t * (1 - t), slope: (4 * g.sag * (1 - 2 * t)) / g.span };
    };
    const svg = `<svg class="pp-cord" width="${n1(width)}" height="${band}" viewBox="0 0 ${n1(width)} ${band}" focusable="false"><path d="${d}"/>${knots.map((x) => `<circle cx="${n1(x)}" cy="${g.top}" r="3.2" fill="#f4e6c8"/>`).join('')}</svg>`;
    // The flags: as many as fit in each swag, centred in it.
    const per = Math.max(1, Math.floor((g.span - g.gap * 2) / (g.fw + g.gap)));
    const used = per * g.fw + (per - 1) * g.gap;
    let html = svg;
    let k = 0;
    for (let j = 0; j < g.swags; j++) {
      const start = j * g.span + (g.span - used) / 2;
      for (let i = 0; i < per; i++, k++) {
        const x = start + i * (g.fw + g.gap);
        const c = cordY(x + g.fw / 2);
        const lean = (x + g.fw / 2) / width - 0.5; // -0.5 at the left edge, 0.5 at the right
        const r = (Math.atan(c.slope) * 180) / Math.PI;
        const seed = Math.sin((k + 1) * 12.9898 + offset * 78.233) * 43758.5453;
        const rnd = seed - Math.floor(seed);
        html += `<span class="pp-flag" style="left:${n1(x)}px;--pp-w:${g.fw}px;--y:${n1(c.y - g.fw * 0.035)}px;--r:${n1(r)}deg;`
          + `--c:${colours[(k + offset) % colours.length]};--m:var(--pp${((k + offset * 2) % 5) + 1});`
          + `--pp-sx:${n1(2 + lean * 18)}px;--d:${n1(4.2 + rnd * 2.6)}s;--dl:${n1(-rnd * 6)}s;--a:${n1(1.3 + rnd * 1.4)}deg"><i><b></b></i></span>`;
      }
    }
    s.el.innerHTML = html;
    s.flags = [...s.el.querySelectorAll('.pp-flag')];
  }

  function makeString(host) {
    const el = document.createElement('div');
    el.className = 'pp-string';
    el.setAttribute('aria-hidden', 'true');
    host.prepend(el);
    const s = { host, el, flags: [], width: 0, builtW: 0, band: 0, live: false, near: false };
    strings.push(s);
    return s;
  }

  // ---- wind ----
  function gust(f, deg, delay) {
    if (f.classList.contains('gust')) return;
    f.style.setProperty('--gs', `${n1(deg)}deg`);
    f.style.setProperty('--gd', `${n1(delay)}s`);
    f.classList.add('gust');
  }
  document.addEventListener('animationend', (e) => {
    if (e.animationName === 'mexican-folk-art-gust') e.target.closest('.pp-flag')?.classList.remove('gust');
  });
  // The pointer brushing a flag sets it and its neighbours fluttering, the far ones a little later and less.
  document.addEventListener('pointerover', (e) => {
    if (isCalm() || e.pointerType === 'touch') return;
    const f = e.target.closest?.('.pp-flag');
    if (!f) return;
    const s = strings.find((x) => x.el === f.parentNode);
    if (!s) return;
    const i = s.flags.indexOf(f);
    const dir = e.movementX < 0 ? -1 : 1;
    [0, 1, -1, 2, -2].forEach((o) => {
      const g = s.flags[i + o];
      if (g) gust(g, dir * (14 - Math.abs(o) * 4), Math.abs(o) * 0.09);
    });
  });
  // A fast scroll sends a gust along every string on screen, from the side the street is moving to.
  // scrollY is first read inside the scroll handler: reading it while the script loads would force a layout.
  let lastY = null;
  let lastT = 0;
  let lastGust = 0;
  let ticking = false;
  addEventListener('scroll', () => {
    if (ticking || isCalm()) return;
    ticking = true;
    requestAnimationFrame(() => {
      ticking = false;
      const now = performance.now();
      const y = scrollY;
      const v = lastY === null ? 0 : (y - lastY) / Math.max(16, now - lastT);
      lastY = y;
      lastT = now;
      if (Math.abs(v) < 1.6 || now - lastGust < 1500) return;
      lastGust = now;
      const dir = v > 0 ? 1 : -1;
      const deg = Math.min(13, 5 + Math.abs(v) * 2.5);
      strings.forEach((s) => {
        if (!s.live) return;
        const last = s.flags.length - 1;
        s.flags.forEach((f, i) => gust(f, dir * deg, (dir > 0 ? i : last - i) * 0.05));
      });
    });
  }, { passive: true });

  // Only the strings on screen sway.
  const setLive = (s, on) => { s.live = on; s.el.classList.toggle('pp-live', on && !isCalm()); };
  const io = 'IntersectionObserver' in window ? new IntersectionObserver((entries) => {
    entries.forEach((e) => { const s = strings.find((x) => x.host === e.target); if (s) setLive(s, e.isIntersecting); });
  }, { rootMargin: '80px 0px' }) : null;

  // The band each wall leaves for its string, as set in the CSS (--pp-band): read from the same media query instead of
  // from computed style, so building one string never forces a style recalculation before the next.
  const smallMq = matchMedia('(max-width: 720px)');
  const bandFor = (host) => (host.classList.contains('hero') ? (smallMq.matches ? 108 : 170) : (smallMq.matches ? 96 : 128));
  // A string is built once its wall comes near the screen (or in an idle moment after load), and rebuilt on resize
  // only if it was built already. That keeps the work in small pieces instead of one long task for every wall.
  const refresh = (s) => {
    if (!s.near || !s.width) return;
    const band = bandFor(s.host);
    if (Math.abs(s.width - s.builtW) < 1 && band === s.band) return;
    s.builtW = s.width;
    s.band = band;
    buildString(s);
  };
  const ro = new ResizeObserver((entries) => {
    entries.forEach((e) => {
      const s = strings.find((x) => x.host === e.target);
      if (!s) return;
      s.width = e.borderBoxSize?.[0]?.inlineSize ?? e.target.clientWidth;
      refresh(s);
    });
  });
  const nearIo = 'IntersectionObserver' in window ? new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      if (!e.isIntersecting) return;
      const s = strings.find((x) => x.host === e.target);
      nearIo.unobserve(e.target);
      if (!s || s.near) return;
      s.near = true;
      refresh(s);
    });
  }, { rootMargin: '600px 0px' }) : null;
  const idle = window.requestIdleCallback ? (f) => requestIdleCallback(f, { timeout: 2000 }) : (f) => setTimeout(f, 80);
  // The walls far down the page are strung one per idle moment, so they are ready before anyone scrolls there.
  const fillRest = () => {
    const s = strings.find((x) => !x.near);
    if (!s) return;
    s.near = true;
    nearIo?.unobserve(s.host);
    refresh(s);
    idle(fillRest);
  };
  const watch = (host, now) => {
    const s = makeString(host);
    if (now || !nearIo) s.near = true;
    ro.observe(host);
    io?.observe(host);
    if (!s.near) nearIo.observe(host);
  };
  smallMq.addEventListener?.('change', () => strings.forEach(refresh));

  // ---- the arch of flowers over the title ----
  const INK = '#2b1238';
  const ruffle = (r, bumps, fill, depth = 0.14, w = 1.4) => {
    let d = '';
    for (let i = 0; i < bumps; i++) {
      const a = (i / bumps) * Math.PI * 2;
      const ah = ((i + 0.5) / bumps) * Math.PI * 2;
      const a2 = ((i + 1) / bumps) * Math.PI * 2;
      if (!i) d += `M${n1(r * (1 - depth) * Math.cos(a))} ${n1(r * (1 - depth) * Math.sin(a))}`;
      d += `Q${n1(r * (1 + depth) * Math.cos(ah))} ${n1(r * (1 + depth) * Math.sin(ah))} ${n1(r * (1 - depth) * Math.cos(a2))} ${n1(r * (1 - depth) * Math.sin(a2))}`;
    }
    return `<path d="${d}Z" fill="${fill}" stroke="${INK}" stroke-width="${w}" stroke-linejoin="round"/>`;
  };
  // Cresta de gallo (cockscomb): a fan that widens from a narrow stalk to a ruffled, folded crest.
  const crest = (() => {
    const B = 8;
    const at = (i, lift = 0) => [-13 + (26 * i) / B, -3 - 8 * Math.sin((Math.PI * i) / B) - lift];
    let top = '';
    for (let i = 0; i < B; i++) {
      const [x1, y1] = at(i + 1);
      const [cx, cy] = at(i + 0.5, 3.4);
      top += `Q${n1(cx)} ${n1(cy)} ${n1(x1)} ${n1(y1)}`;
    }
    // Folds inside the crest follow its top edge, lower down and narrower.
    const edgeY = (x) => -3 - 8 * Math.sin((Math.PI * (x + 13)) / 26);
    const fold = (dy, k) => {
      const step = (20 * k) / 6;
      let d = `M${n1(-10 * k)} ${n1(edgeY(-10 * k) + dy)}`;
      for (let i = 1; i <= 6; i++) {
        const x = -10 * k + step * i;
        d += `Q${n1(x - step / 2)} ${n1(edgeY(x - step / 2) + dy - 2.6)} ${n1(x)} ${n1(edgeY(x) + dy)}`;
      }
      return d;
    };
    return `<path d="M-3 12C-8 8-13 3-13-3${top}C13 3 8 8 3 12Z" fill="#c4087a" stroke="${INK}" stroke-width="1.4" stroke-linejoin="round"/>`
      + `<path d="${fold(4.5, 0.8)}${fold(9, 0.55)}" fill="none" stroke="#7a0848" stroke-width="1.3" stroke-linecap="round"/>`
      + `<path d="M-1 12V16M1 12V16" stroke="#2f7d32" stroke-width="1.6"/>`;
  })();
  const DEFS = `<defs>
    <g id="mfa-mg">${ruffle(13, 16, '#d9661a')}${ruffle(10, 14, '#f59a1b')}${ruffle(7, 12, '#f9b233', 0.15, 1.2)}${ruffle(4, 9, '#ffd23f', 0.16, 1)}</g>
    <g id="mfa-cc">${crest}</g>
    <g id="mfa-lf"><path d="M0 0C6-5 16-5 22 0 16 5 6 5 0 0Z" fill="#2f9e44" stroke="${INK}" stroke-width="1.2"/><path d="M2 0H18" stroke="#1d6b2d" stroke-width="1"/></g>
  </defs>`;
  function buildArch(el, W, H) {
    const small = W < 560;
    const r = small ? 8.5 : 13;
    const m = small ? 4 + r : 10 + r;
    const top = r + 2;
    const rx = W / 2 - m;
    const ry = small ? Math.min(H * 0.3, 44) : Math.min(H * 0.42, 130);
    const yS = top + ry; // where the sides meet the curve
    const bottom = H - r * 0.6;
    // Walk the outline (up the left post, over the top, down the right post) and set a flower every `step` pixels.
    const pts = [];
    const add = (x, y, a) => pts.push([x, y, a]);
    const step = r * 1.72;
    const side = Math.max(0, bottom - yS);
    const N = 160;
    let len = 0;
    let prev = [m, yS];
    const arc = [[m, yS, 0]];
    for (let i = 1; i <= N; i++) {
      const t = Math.PI - (i / N) * Math.PI;
      const p = [W / 2 + rx * Math.cos(t), yS - ry * Math.sin(t)];
      len += Math.hypot(p[0] - prev[0], p[1] - prev[1]);
      arc.push([p[0], p[1], len]);
      prev = p;
    }
    const total = side * 2 + len;
    const count = Math.max(6, Math.round(total / step));
    for (let i = 0; i <= count; i++) {
      const at = (i / count) * total;
      if (at <= side) add(m, bottom - at, -90);
      else if (at >= side + len) add(W - m, yS + (at - side - len), 90);
      else {
        const want = at - side;
        let j = 1;
        while (j < arc.length - 1 && arc[j][2] < want) j++;
        const [x0, y0, l0] = arc[j - 1];
        const [x1, y1, l1] = arc[j];
        const t = (want - l0) / Math.max(0.001, l1 - l0);
        add(x0 + (x1 - x0) * t, y0 + (y1 - y0) * t, (Math.atan2(y1 - y0, x1 - x0) * 180) / Math.PI);
      }
    }
    // Leaves point outwards at either side of the arch's normal (angle a - 90); a crest of cresta de gallo points straight out.
    const k = r / 13;
    let leaves = '';
    let flowers = '';
    pts.forEach(([x, y, a], i) => {
      const jit = 1 + (((i * 37) % 11) - 5) / 50;
      leaves += `<use href="#mfa-lf" transform="translate(${n1(x)} ${n1(y)}) rotate(${n1(a - 140 + (i % 2) * 100)}) scale(${n1(k * 1.05)})"/>`;
      flowers += `<use href="#mfa-${i % 3 === 1 ? 'cc' : 'mg'}" transform="translate(${n1(x)} ${n1(y)}) rotate(${n1(i % 3 === 1 ? a : i * 23)}) scale(${n1(k * jit * 100) / 100})"/>`;
    });
    el.setAttribute('viewBox', `0 0 ${n1(W)} ${n1(H)}`);
    el.setAttribute('width', n1(W));
    el.setAttribute('height', n1(H));
    el.innerHTML = `${DEFS}<path d="M${n1(m)} ${n1(bottom)}V${n1(yS)}A${n1(rx)} ${n1(ry)} 0 0 1 ${n1(W - m)} ${n1(yS)}V${n1(bottom)}" fill="none" stroke="#2f7d32" stroke-width="${small ? 3 : 4}"/>${leaves}${flowers}`;
  }
  const heroText = document.querySelector('.hero-text');
  if (heroText) {
    const arch = document.createElementNS(NS, 'svg');
    arch.setAttribute('class', 'mfa-arch');
    arch.setAttribute('aria-hidden', 'true');
    arch.setAttribute('focusable', 'false');
    heroText.prepend(arch);
    let size = [0, 0];
    new ResizeObserver(([e]) => {
      const b = e.borderBoxSize?.[0];
      const W = b ? b.inlineSize : heroText.clientWidth;
      const H = b ? b.blockSize : heroText.clientHeight;
      if (Math.abs(W - size[0]) < 2 && Math.abs(H - size[1]) < 2) return;
      size = [W, H];
      buildArch(arch, W, H);
    }).observe(heroText);
  }

  // ---- the altar: candles at the ends of the upper tier, petals in front ----
  const altar = document.querySelector('.hero-gallery');
  if (altar) {
    const bit = (cls, tag = 'span') => { const e = document.createElement(tag); e.className = cls; e.setAttribute('aria-hidden', 'true'); return e; };
    altar.append(bit('mfa-candle c-l'), bit('mfa-candle c-r'), bit('mfa-petals', 'div'));
  }

  // The cover's string first; the walls below once the first screen has painted, each when it comes near.
  const hero = hosts.find((h) => h.classList.contains('hero'));
  if (hero) watch(hero, true);
  requestAnimationFrame(() => setTimeout(() => {
    hosts.forEach((h) => { if (h !== hero) watch(h); });
    idle(fillRest);
  }, 0));

  addEventListener('eas:calm', () => {
    strings.forEach((s) => {
      s.el.classList.toggle('pp-live', s.live && !isCalm());
      if (isCalm()) s.flags.forEach((f) => f.classList.remove('gust'));
    });
  });
})();
