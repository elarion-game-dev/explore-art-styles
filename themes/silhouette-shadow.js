// Silhouette / Shadow Play: a backlit shadow theatre.
// The page is the screen. A lamp behind it follows the pointer: its light is the bright patch in the fog, and on the cover
// stage it throws the puppets' shadows. Each puppet hangs at some distance from the screen, as a fraction of the way to the
// lamp (d). Its shadow is the puppet projected from the lamp onto the screen: scaled by 1 / (1 - d) about the lamp, and as
// soft as the lamp is wide times d / (1 - d). Pieces pressed to the screen stay small, sharp and still; pieces near the lamp
// grow, blur and swing far when the lamp moves.
// The lamp also has a distance from the screen. Bring it closer (press and hold on the stage, or the slider) and every
// puppet is a larger share of the way to it, so every shadow on the stage swells and softens at once, and the lamp's
// bright patch on the screen tightens.
// Between sections, scenery flats in three greys (far, middle, near) slide at three speeds as the page scrolls: Limbo's
// forest and posts, reeds, and Lotte Reiniger's cut-paper palms and curls.
// Calm mode and reduced motion: the lamp stays put (a click or tap on the stage moves it, the slider sets its distance),
// nothing flies or sways.
(() => {
  const root = document.documentElement;
  const $ = (q, el = document) => el.querySelector(q);
  const $$ = (q, el = document) => [...el.querySelectorAll(q)];
  const isCalm = () => root.dataset.calm === '1';
  const page = $('.page');
  const heroText = $('.hero-text');
  if (!page || !heroText) return;
  root.classList.add('ss-js');

  // ---- small helpers ----
  const rng = (seed) => () => {
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  const f1 = (n) => Math.round(n * 10) / 10;
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
  const svg = (vb, body, par = 'xMidYMax slice', extra = '') => `<svg viewBox="${vb}" preserveAspectRatio="${par}" focusable="false" aria-hidden="true"${extra}>${body}</svg>`;
  const el = (cls, html = '') => { const e = document.createElement('div'); e.className = cls; e.innerHTML = html; return e; };

  // A hill line: three sine waves with random phases, closed down to the bottom of the box.
  function ridge(rand, W, H, base, amp, step = 20) {
    const ph = [rand() * 6.3, rand() * 6.3, rand() * 6.3];
    const fr = [1.2 + rand() * 1.4, 3 + rand() * 2.5, 8 + rand() * 5];
    let d = `M0 ${H}`;
    for (let x = 0; x <= W + step; x += step) {
      const u = (x / W) * Math.PI * 2;
      const y = base - amp * (0.58 * Math.sin(u * fr[0] + ph[0]) + 0.3 * Math.sin(u * fr[1] + ph[1]) + 0.12 * Math.sin(u * fr[2] + ph[2]));
      d += `L${Math.min(x, W)} ${f1(y)}`;
    }
    return `${d}L${W} ${H}Z`;
  }
  // Grass: thin curved blades standing on a base line.
  function grass(rand, x0, x1, base, hmin, hmax, gap) {
    let d = '';
    for (let x = x0; x < x1; x += gap * (0.45 + rand())) {
      const h = hmin + rand() * (hmax - hmin);
      const lean = (rand() - 0.5) * h * 0.9;
      const w = 2 + rand() * 3.5;
      d += `M${f1(x)} ${base + 2}Q${f1(x + lean * 0.25)} ${f1(base - h * 0.55)} ${f1(x + lean + w / 2)} ${f1(base - h)}Q${f1(x + w + lean * 0.3)} ${f1(base - h * 0.5)} ${f1(x + w)} ${base + 2}Z`;
    }
    return d;
  }
  // A bare tree, branch by branch: each limb is a curved stroke, its children thinner and shorter.
  // `droop` pulls the twigs towards hanging straight down (for a branch that hangs into the picture).
  function limbs(rand, x, y, angle, len, width, depth, droop = 0) {
    const out = [];
    const grow = (x, y, a, len, w, depth) => {
      const x2 = x + Math.sin(a) * len;
      const y2 = y - Math.cos(a) * len;
      const bend = (rand() - 0.5) * len * 0.3;
      const cx = (x + x2) / 2 + Math.cos(a) * bend;
      const cy = (y + y2) / 2 + Math.sin(a) * bend;
      out.push({ d: `M${f1(x)} ${f1(y)}Q${f1(cx)} ${f1(cy)} ${f1(x2)} ${f1(y2)}`, w, tip: depth === 0 ? [x2, y2, a] : null });
      if (depth === 0) return;
      const n = rand() < 0.35 ? 3 : 2;
      for (let i = 0; i < n; i++) {
        let na = a + (i - (n - 1) / 2) * (0.45 + rand() * 0.4) + (rand() - 0.5) * 0.35;
        if (droop) na += (Math.PI - na) * droop;
        grow(x2, y2, na, len * (0.6 + rand() * 0.2), Math.max(0.9, w * 0.64), depth - 1);
      }
    };
    grow(x, y, angle, len, width, depth);
    return out;
  }
  const strokes = (segs, fill) => segs.map((s) => `<path d="${s.d}" stroke-width="${f1(s.w)}"/>`).join('').replace(/^/, `<g fill="none" stroke="${fill}" stroke-linecap="round">`) + '</g>';
  // A pine: a jagged cone of drooping tiers on a short trunk.
  function pine(rand, x, y, h, w) {
    const n = 6 + Math.floor(rand() * 4);
    const top = y - h;
    const L = [];
    const R = [];
    for (let i = 1; i <= n; i++) {
      const t = i / n;
      const yy = top + h * 0.86 * t;
      const ww = (w / 2) * (0.12 + 0.88 * t) * (0.8 + rand() * 0.4);
      L.push([x - ww, yy + h * 0.025], [x - ww * 0.3, yy - h * 0.015]);
      R.push([x + ww, yy + h * 0.025], [x + ww * 0.3, yy - h * 0.015]);
    }
    const pts = [[x, top], ...L.slice(0, -1), L[L.length - 1], [x - w * 0.04, y], [x + w * 0.04, y], ...R.slice().reverse()];
    return `M${pts.map(([a, b]) => `${f1(a)} ${f1(b)}`).join('L')}Z`;
  }
  // A palm cut from paper, as in Lotte Reiniger's Prince Achmed: a curved trunk and drooping fronds, each frond a spine
  // with thin leaflets cut along both sides.
  function palm(rand, x, base, h) {
    const lean = (rand() - 0.5) * h * 0.5;
    const tx = x + lean;
    const ty = base - h;
    const mx = x + lean * 0.25;
    let d = `M${f1(x - 3.5)} ${base}Q${f1(mx - 2.5)} ${f1(base - h * 0.5)} ${f1(tx - 1.5)} ${f1(ty)}L${f1(tx + 1.5)} ${f1(ty)}Q${f1(mx + 2.5)} ${f1(base - h * 0.5)} ${f1(x + 3.5)} ${base}Z`;
    const n = 6 + Math.floor(rand() * 3);
    for (let i = 0; i < n; i++) {
      // Fronds fan out to both sides, from level (and drooping) to steep; none stands straight up.
      const u = i / (n - 1);
      const v = u < 0.5 ? u * 2 : (1 - u) * 2;
      const a = (u < 0.5 ? Math.PI * (1 + 0.38 * v) : Math.PI * (2 - 0.38 * v)) + (rand() - 0.5) * 0.12;
      const len = h * (0.38 + rand() * 0.2);
      const c = [tx + Math.cos(a) * len * 0.6, ty + Math.sin(a) * len * 0.6 - len * 0.1];
      const e = [tx + Math.cos(a) * len, ty + Math.sin(a) * len * 0.5 + len * 0.38 * Math.abs(Math.cos(a))];
      const at = (t) => [(1 - t) ** 2 * tx + 2 * (1 - t) * t * c[0] + t * t * e[0], (1 - t) ** 2 * ty + 2 * (1 - t) * t * c[1] + t * t * e[1]];
      for (let t = 0.1; t < 0.96; t += 0.075) {
        const [px, py] = at(t);
        const [qx, qy] = at(t + 0.04);
        const dx = qx - px;
        const dy = qy - py;
        const m = Math.hypot(dx, dy) || 1;
        const leaf = len * 0.24 * (1 - t * 0.6);
        for (const s of [1, -1]) {
          const nx = (-dy / m) * s;
          const ny = (dx / m) * s;
          d += `M${f1(px)} ${f1(py)}L${f1(qx)} ${f1(qy)}L${f1(qx + nx * leaf + (dx / m) * leaf * 0.7)} ${f1(qy + ny * leaf + (dy / m) * leaf * 0.7)}Z`;
        }
      }
      d += `M${f1(tx)} ${f1(ty - 1)}Q${f1(c[0])} ${f1(c[1])} ${f1(e[0])} ${f1(e[1])}L${f1(e[0])} ${f1(e[1] + 1.6)}Q${f1(c[0])} ${f1(c[1] + 2.4)} ${f1(tx)} ${f1(ty + 1.5)}Z`;
    }
    return d;
  }
  // A cut-paper stem that rises and rolls into a spiral, with a few leaves along it.
  function curl(rand, x, base, h) {
    const dir = rand() < 0.5 ? -1 : 1;
    const sx = x + dir * h * 0.12;
    const sy = base - h * 0.62;
    const r0 = h * 0.2;
    const cx = sx + dir * r0;
    const th0 = dir > 0 ? Math.PI : 0;
    let d = `M${f1(x)} ${base}Q${f1(x - dir * h * 0.12)} ${f1(base - h * 0.35)} ${f1(sx)} ${f1(sy)}`;
    for (let k = 1; k <= 28; k++) {
      const t = k / 28;
      const th = th0 + dir * t * Math.PI * 2.1;
      const r = r0 * (1 - 0.78 * t);
      d += `L${f1(cx + r * Math.cos(th))} ${f1(sy + r * Math.sin(th))}`;
    }
    let leaves = '';
    for (let i = 0; i < 3; i++) {
      const ly = base - h * (0.12 + i * 0.16);
      const lx = x - dir * h * 0.05 * (1 - i * 0.3);
      const s = i % 2 ? 1 : -1;
      const len = h * (0.16 - i * 0.025);
      leaves += `M${f1(lx)} ${f1(ly)}C${f1(lx + s * len * 0.4)} ${f1(ly - len * 0.45)} ${f1(lx + s * len * 0.9)} ${f1(ly - len * 0.35)} ${f1(lx + s * len)} ${f1(ly - len * 0.6)}C${f1(lx + s * len * 0.75)} ${f1(ly - len * 0.05)} ${f1(lx + s * len * 0.35)} ${f1(ly + len * 0.05)} ${f1(lx)} ${f1(ly)}Z`;
    }
    return `<path d="${d}" fill="none" stroke="#0a0a0a" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/><path d="${leaves}"/>`;
  }

  // ---- the lamp behind the screen ----
  const lamp = el('ss-lamp');
  page.prepend(lamp);
  let vw = innerWidth;
  let vh = innerHeight;
  const L = { x: vw * 0.66, y: vh * 0.34 };
  const T = { x: L.x, y: L.y };
  let pointerAt = -1e9;
  let placed = false; // a click or tap placed the lamp: stay there for a while
  // The lamp's distance from the screen, as a share of its farthest (1). Held down, it comes in to LD_MIN.
  const LD_MIN = 0.5;
  const D_MAX = 0.48; // no puppet comes nearer the lamp than this, so no shadow grows past about twice its size
  let ld = 1;
  let ldSet = 1; // where the slider puts it
  let held = false;

  // ---- the cover stage ----
  const stage = el('ss-stage');
  heroText.prepend(stage);
  const R = rng(9081);

  // Every grey is black at part strength: the lamp behind shows through it, as through translucent paper. That is the same
  // as multiplying a grey over the screen, but needs no blending when the lamp moves. A mask fades a layer into the mist
  // at its foot, so overlapping shapes in one layer never darken each other.
  const fadeMask = (id, w, h, stops) => `<linearGradient id="${id}-g" gradientUnits="userSpaceOnUse" x1="0" y1="0" x2="0" y2="${h}">${stops.map(([o, a]) => `<stop offset="${o}" stop-color="#fff" stop-opacity="${a}"/>`).join('')}</linearGradient>
    <mask id="${id}" maskUnits="userSpaceOnUse" x="-50" y="-50" width="${w + 100}" height="${h + 100}" style="mask-type:alpha"><rect x="-50" y="-50" width="${w + 100}" height="${h + 100}" fill="url(#${id}-g)"/></mask>`;
  // A blur drawn into the picture itself, so it is worked out once instead of on every frame.
  const soft = (id) => `<filter id="${id}" x="-15%" y="-25%" width="130%" height="150%" color-interpolation-filters="sRGB"><feGaussianBlur stdDeviation="0"/></filter>`;

  // Far hills, painted on the screen itself: they never move, and fog has already softened them.
  const farW = 2000;
  stage.append(el('ss-far', svg(`0 0 ${farW} 360`, `
    <defs>${fadeMask('ss-farm', farW, 360, [[0.3, 1], [1, 0.12]])}
    <filter id="ss-soft3" x="-5%" y="-20%" width="110%" height="140%"><feGaussianBlur stdDeviation="3.5"/></filter>
    <filter id="ss-soft2" x="-5%" y="-20%" width="110%" height="140%"><feGaussianBlur stdDeviation="2"/></filter></defs>
    <g mask="url(#ss-farm)" fill="#0a0a0a"><path d="${ridge(R, farW, 360, 150, 46)}" fill-opacity=".19" filter="url(#ss-soft3)"/>
    <path d="${ridge(R, farW, 360, 222, 34)}" fill-opacity=".14" filter="url(#ss-soft2)"/></g>`)));

  // Puppets, from the screen out towards the lamp. x and y are set by CSS; d0 is the distance from the screen as a share
  // of the way to the lamp at its farthest, and d the share of the way to wherever the lamp is now (d0 / ld).
  // A puppet whose d0 never changes has its blur for the far lamp drawn in (`baked`); when the lamp comes closer, the rest
  // of its blur is added as a CSS filter. The others blur as a CSS filter only.
  const puppets = [];
  const puppet = (cls, html, d0, baked = false) => {
    const e = el(`ss-pp ${cls}`, html);
    stage.append(e);
    const s = e.querySelector('svg');
    const p = { el: e, d0, d: d0, x0: 0, y0: 0, h: 0, cw: 0, ch: 0, foot: null, bx: 0, by: 0, blur: -1, baked: baked ? s.querySelector('feGaussianBlur') : null, svg: s, vb: s.viewBox.baseVal, slice: /slice/.test(s.getAttribute('preserveAspectRatio')) };
    puppets.push(p);
    return p;
  };

  // The middle distance: a tree line in mid grey, a little off the screen.
  {
    const W = 2000;
    let trees = '';
    for (let x = 30; x < W; x += 70 + R() * 150) {
      if (R() < 0.62) trees += `<path d="${pine(R, x, 300, 120 + R() * 150, 46 + R() * 34)}"/>`;
      else trees += strokes(limbs(R, x, 302, (R() - 0.5) * 0.25, 60 + R() * 40, 9 + R() * 5, 5), '#0a0a0a');
    }
    puppet('ss-mid', svg(`0 0 ${W} 300`, `<defs>${fadeMask('ss-midm', W, 300, [[0.2, 1], [0.7, 0.77], [1, 0.26]])}${soft('ss-b-mid')}</defs>
      <g mask="url(#ss-midm)" opacity=".57"><g fill="#0a0a0a" filter="url(#ss-b-mid)"><path d="${ridge(R, W, 300, 268, 14)}"/>${trees}</g></g>`), 0.015, true);
  }

  // The ground the figure stands on. The puppeteer holds its surface line still, as the figure's feet are held on it
  // (below), so the figure never floats above it or sinks into it, wherever the lamp is.
  let ground;
  {
    const W = 2000;
    const R2 = rng(77);
    let stones = '';
    for (let i = 0; i < 9; i++) { const x = R2() * W; const r = 6 + R2() * 12; stones += `<ellipse cx="${f1(x)}" cy="${f1(36 + r * 0.2)}" rx="${f1(r * 1.6)}" ry="${f1(r)}"/>`; }
    ground = puppet('ss-ground', svg(`0 0 ${W} 400`, `<defs>${soft('ss-b-ground')}</defs><g fill="#0a0a0a" filter="url(#ss-b-ground)"><path d="${ridge(R2, W, 400, 40, 7, 25)}"/>${stones}<path d="${grass(R2, 0, W, 38, 8, 34, 9)}"/></g>`, 'xMidYMin slice'), 0.04, true);
  }
  // The surface is 40 units down the drawing's 400 (see .ss-ground in the CSS).
  ground.foot = 40 / 400;

  // The puppet: jointed at shoulder and elbow, a lantern of red gel on a pole, and the rods it is worked with.
  const fig = puppet('ss-fig', svg('0 -60 140 280', `
    <g class="ss-rods" stroke="#111" stroke-width="1.6" stroke-linecap="round"><path d="M86 96L112 700"/></g>
    <g fill="#0a0a0a">
      <path class="ss-arm-back" d="M80 64L90 104" stroke="#0a0a0a" stroke-width="7" stroke-linecap="round"/>
      <path d="M71 138L67 194" stroke="#0a0a0a" stroke-width="7.5" stroke-linecap="round"/>
      <path d="M86 138L90 194" stroke="#0a0a0a" stroke-width="7.5" stroke-linecap="round"/>
      <path d="M69 189L71 201 47 202C49 197 56 194 63 193Z"/>
      <path d="M88 189L94 201 74 202C76 197 82 194 88 193Z"/>
      <path d="M70 56C76 53 85 53 90 57L97 100 106 142C92 147 66 147 52 142L62 100Z"/>
      <path d="M75 46h8v12h-8z"/>
      <g class="ss-head">
        <path fill-rule="evenodd" d="M70 19C80 13 95 17 95 31 95 44 87 50 78 50 74 50 71 49 69 47L67 44 62 43 64 40 60 37 64 35 63 30C63 25 66 21 70 19ZM68.5 31.5C70 30 73 30 74.5 31.8 73 33 70.5 33 68.5 31.5Z"/>
        <path d="M72 21C69 12 78 5 87 8 83 9 81 12 82 15 87 10 95 12 97 20 93 18 89 19 86 22Z"/>
      </g>
      <g class="ss-arm">
        <path d="M74 64L60 92" stroke="#0a0a0a" stroke-width="7" stroke-linecap="round"/>
        <g class="ss-fore">
          <path d="M60 92L44 80" stroke="#0a0a0a" stroke-width="6" stroke-linecap="round"/>
          <circle cx="42" cy="79" r="4.6"/>
          <path d="M43 84L36 92 30 700" fill="none" stroke="#111" stroke-width="1.6" stroke-linecap="round"/>
          <path d="M42 80L14 -14" stroke="#0a0a0a" stroke-width="2.6" stroke-linecap="round"/>
          <g class="ss-lantern">
            <path d="M14 -14V-2" stroke="#0a0a0a" stroke-width="1.4"/>
            <path d="M6 -2h16l-3 5H9z"/>
            <path d="M8 3h12l2 22H6z" fill="#b8281c" fill-opacity=".78"/>
            <path d="M11 3.5l-1.4 21M14 3.5v21M17 3.5l1.4 21" stroke="#0a0a0a" stroke-width="1.3"/>
            <path d="M5 25h18l-3 5H8z"/><circle cx="14" cy="-15" r="2.2" fill="none" stroke="#0a0a0a" stroke-width="1.4"/>
          </g>
        </g>
      </g>
    </g>`, 'xMidYMax meet', ' overflow="visible"'), 0.1);
  // The puppeteer keeps the shadow standing on the ground: as the lamp comes in, the puppet is lowered or raised so the
  // shadow's feet stay on the ground line, and the shadow grows upwards from them. Sideways, the shadow still slides away
  // from the lamp. The feet sit at y = 202 of the drawing's 280-unit height, which starts at -60.
  fig.foot = (202 + 60) / 280;

  // A bird that flies out from the screen towards the lamp and back: watch its shadow grow and blur.
  const bird = puppet('ss-bird', svg('0 0 120 70', `<g fill="#0a0a0a" class="ss-bird-in">
      <path class="ss-wing-far" d="M56 36C60 26 66 18 76 12 80 10 86 9 90 10 84 14 80 18 77 22 82 21 86 21 90 22 83 26 76 30 70 34Z" opacity=".9"/>
      <path d="M4 38L16 35C20 31 28 30 36 32 48 35 60 36 72 36 84 36 94 34 104 31L118 25 113 35 119 43 103 41C92 44 78 46 64 45 50 44 38 43 28 42 22 41 18 40 16 40Z"/>
      <path class="ss-wing" d="M44 37C50 24 60 12 76 4 84 0 92 0 98 2 90 6 84 10 80 14 88 12 94 12 99 14 90 18 82 22 76 26 82 26 88 27 92 29 80 32 66 36 58 40Z"/>
    </g>`, 'xMidYMid meet', ' overflow="visible"'), 0.1);

  // A branch hanging in from the top corner, close to the lamp: big, soft and quick to swing.
  {
    const R3 = rng(4242);
    const segs = limbs(R3, 470, 18, -1.95, 120, 15, 6, 0.16);
    let leaves = '';
    for (const s of segs) {
      if (!s.tip) continue;
      const [x, y] = s.tip;
      for (let i = 0; i < 2; i++) {
        const a = (R3() - 0.5) * 70 + 180 * (i % 2);
        const len = 9 + R3() * 8;
        leaves += `<path transform="translate(${f1(x)} ${f1(y)}) rotate(${f1(a)})" d="M0 0C${f1(len * 0.3)} ${f1(-len * 0.35)} ${f1(len * 0.8)} ${f1(-len * 0.3)} ${f1(len)} 0 ${f1(len * 0.8)} ${f1(len * 0.3)} ${f1(len * 0.3)} ${f1(len * 0.35)} 0 0Z"/>`;
      }
    }
    puppet('ss-branch', svg('0 0 480 360', `<defs>${soft('ss-b-branch')}</defs><g filter="url(#ss-b-branch)">${strokes(segs, '#0a0a0a')}<g fill="#0a0a0a">${leaves}</g></g>`, 'xMaxYMin meet', ' overflow="visible"'), 0.24, true);
  }

  // Reeds in the near corner, out of focus.
  let reeds;
  {
    const R4 = rng(515);
    let blades = '';
    let heads = '';
    for (let i = 0; i < 22; i++) {
      const x = 20 + R4() * 320;
      const h = 150 + R4() * 250;
      const lean = (R4() - 0.4) * 90;
      const w = 3 + R4() * 4;
      blades += `<path d="M${f1(x)} 430Q${f1(x + lean * 0.2)} ${f1(420 - h * 0.6)} ${f1(x + lean)} ${f1(420 - h)}Q${f1(x + lean * 0.3 + w)} ${f1(420 - h * 0.5)} ${f1(x + w)} 430Z"/>`;
      if (i % 5 === 0) {
        const tx = x + lean * 0.86;
        const ty = 420 - h * 0.86;
        heads += `<ellipse cx="${f1(tx)}" cy="${f1(ty)}" rx="4.5" ry="17" transform="rotate(${f1(Math.atan2(lean, h) * 57.3)} ${f1(tx)} ${f1(ty)})"/>`;
      }
    }
    reeds = puppet('ss-reeds', svg('0 0 360 430', `<defs>${soft('ss-b-reeds')}</defs><g fill="#0a0a0a" filter="url(#ss-b-reeds)">${blades}${heads}</g>`, 'xMaxYMax meet', ' overflow="visible"'), 0.22, true);
  }
  stage.append(el('ss-iris'));

  // ---- the stage controls: the lamp's distance behind the screen ----
  const touchy = matchMedia('(hover: none)').matches;
  const ctl = document.createElement('div');
  ctl.className = 'ss-ctl';
  const hintText = () => (touchy ? 'Tap the screen to move the lamp behind it.' : isCalm() ? 'Click the screen to move the lamp behind it.' : 'The lamp behind the screen follows your pointer. Press and hold to bring it closer.');
  ctl.innerHTML = `<p class="ss-hint">${hintText()}</p>
    <label class="ss-range"><span>Lamp's distance behind the screen</span><input type="range" min="${LD_MIN * 100}" max="100" step="1" value="100"></label>
    <output class="ss-read" aria-live="polite"></output>`;
  heroText.append(ctl);
  const range = $('input', ctl);
  const hint = $('.ss-hint', ctl);
  const read = $('output', ctl);
  const LAMP = 14; // how wide the lamp is: the blur in px at d = 0.5 on a 1100px stage
  // What the shadows are now: the puppet's, and the reeds' out near the lamp.
  const readout = () => {
    const lampW = LAMP * (W / 1100);
    const say = (d0, size) => {
      const d = Math.min(D_MAX, d0 / ld);
      const b = (lampW * d) / (1 - d);
      return `${(1 / (1 - d)).toFixed(2)} times ${size}, ${b < 0.5 ? 'sharp' : `blurred by ${Math.round(b)} px`}`;
    };
    // Written only when it says something new: it is a live region, and measure() asks for a fresh one after every resize.
    const text = `Lamp at ${Math.round(ld * 100)}% of its distance. Puppet's shadow ${say(fig.d0, 'its size')}; reeds' shadow ${say(reeds.d0, 'theirs')}.`;
    if (read.textContent !== text) read.textContent = text;
    readAt = ld;
  };
  let readAt = -1;
  let ldRate = 8; // how fast the lamp moves in and out: quickly after the slider, slowly when held or let go
  const setLamp = () => {
    ldSet = range.value / 100;
    ldRate = 8;
    if (isCalm()) ld = ldSet;
    wake();
  };

  // ---- measuring (once per resize, never inside the frame loop) ----
  let W = 1;
  let H = 1;
  let stageTop = 0;
  let stageLeft = 0;
  const measure = () => {
    // First read every box ...
    vw = innerWidth;
    vh = innerHeight;
    const r = stage.getBoundingClientRect();
    W = r.width || 1;
    H = r.height || 1;
    stageTop = r.top + scrollY;
    stageLeft = r.left;
    for (const p of puppets) {
      p.x0 = p.el.offsetLeft;
      p.y0 = p.el.offsetTop;
      p.h = p.el.offsetHeight;
      p.cw = p.el.clientWidth;
      p.ch = p.el.clientHeight;
      p.blur = -1;
    }
    for (const f of flats) { const b = f.el.getBoundingClientRect(); f.top = b.top + scrollY; f.h = b.height; f.w = b.width; }
    // ... then write. The baked blur is for the lamp at its farthest: on screen it is the drawing's blur times its scale
    // (px per unit) times the shadow's scale k.
    const lampW = LAMP * (W / 1100);
    for (const p of puppets) {
      if (!p.baked) continue;
      const w = p.cw / p.vb.width;
      const h = p.ch / p.vb.height;
      const unit = (p.slice ? Math.max(w, h) : Math.min(w, h)) || 1;
      const k = 1 / (1 - p.d0);
      // Set only when it changes: a new value redraws the blurred layer, and the page's size changes often as it loads.
      const sd = f1((lampW * p.d0) / (1 - p.d0) / unit / k);
      if (p.sd !== sd) { p.baked.setAttribute('stdDeviation', sd); p.sd = sd; }
    }
    lastScroll = -1;
    readAt = -1;
  };

  // ---- scenery flats between sections, built once the first screen has painted ----
  const flats = [];
  const MOTIFS = ['pines', 'posts', 'reeds', 'bare', 'cut'];
  function buildFlats() {
    const secs = $$('.sec').filter((s) => !s.matches('.sec-feel, .sec-sources, .sec-related'));
    secs.forEach((sec, i) => {
      const rand = rng(300 + i * 17);
      const motif = MOTIFS[i % MOTIFS.length];
      const W = 2400;
      const H = 150;
      const far = svg(`0 0 ${W} ${H}`, `<defs>${fadeMask(`ss-ff${i}`, W, H, [[0.3, 1], [1, 0.25]])}<filter id="ss-fb${i}" x="-2%" y="-20%" width="104%" height="140%"><feGaussianBlur stdDeviation="1.4"/></filter></defs><g mask="url(#ss-ff${i})"><path fill="#0a0a0a" fill-opacity=".23" filter="url(#ss-fb${i})" d="${ridge(rand, W, H, 92, 30)}"/></g>`, 'xMinYMax slice');
      let mid = '';
      let near = '';
      if (motif === 'pines') {
        for (let x = 10; x < W; x += 30 + rand() * 60) mid += `<path d="${pine(rand, x, 140, 50 + rand() * 60, 22 + rand() * 16)}"/>`;
        for (let x = 80; x < W; x += 300 + rand() * 500) near += strokes(limbs(rand, x, 136, (rand() - 0.5) * 0.3, 34 + rand() * 12, 7, 5), '#0a0a0a');
      } else if (motif === 'posts') {
        // Limbo's posts in fog: rough stakes of uneven height, some leaning, some broken off.
        for (let x = 0; x < W; x += 60 + rand() * 120) mid += strokes(limbs(rand, x, 142, (rand() - 0.5) * 0.3, 22 + rand() * 14, 5, 4), '#0a0a0a');
        for (let x = 30; x < W; x += 70 + rand() * 170) {
          const h = 26 + rand() * 64;
          const w = 3.5 + rand() * 4;
          const lean = (rand() - 0.5) * h * 0.22;
          const tx = x + lean;
          const ty = 140 - h;
          const top = rand() < 0.4 ? `L${f1(tx + w * 0.9)} ${f1(ty + w * 1.6)}L${f1(tx)} ${f1(ty + w * 0.7)}L${f1(tx - w * 0.9)} ${f1(ty)}` : `L${f1(tx + w * 0.9)} ${f1(ty)}L${f1(tx - w * 0.9)} ${f1(ty + 1.5)}`;
          near += `<path d="M${f1(x - w)} 141L${f1(x + w)} 141${top}Z"/>`;
          if (rand() < 0.3) { const x2 = x + w * 3 + rand() * 8; const h2 = h * (0.35 + rand() * 0.3); near += `<path d="M${f1(x2 - w * 0.8)} 141L${f1(x2 + w * 0.8)} 141L${f1(x2 + w * 0.7 + lean * 0.3)} ${f1(140 - h2)}L${f1(x2 - w * 0.7 + lean * 0.3)} ${f1(141 - h2)}Z"/>`; }
        }
      } else if (motif === 'reeds') {
        mid += `<path d="${grass(rand, 0, W, 142, 30, 70, 14)}"/>`;
        near += `<path d="${grass(rand, 0, W, 142, 40, 110, 22)}"/>`;
      } else if (motif === 'bare') {
        for (let x = 20; x < W; x += 90 + rand() * 160) mid += strokes(limbs(rand, x, 142, (rand() - 0.5) * 0.3, 26 + rand() * 18, 6, 5), '#0a0a0a');
        for (let x = 200; x < W; x += 500 + rand() * 500) near += strokes(limbs(rand, x, 138, (rand() - 0.5) * 0.4, 40 + rand() * 10, 9, 6), '#0a0a0a');
      } else {
        // Lotte Reiniger's cut paper: small palms far off, then tall palms and curling stems.
        for (let x = 20; x < W; x += 90 + rand() * 130) mid += `<path d="${palm(rand, x, 142, 34 + rand() * 26)}"/>`;
        for (let x = 60; x < W; x += 180 + rand() * 260) {
          near += rand() < 0.6 ? `<path d="${palm(rand, x, 141, 70 + rand() * 50)}"/>` : curl(rand, x, 141, 46 + rand() * 30);
        }
      }
      const midSvg = svg(`0 0 ${W} ${H}`, `<defs>${fadeMask(`ss-fm${i}`, W, H, [[0.2, 1], [1, 0.4]])}</defs><g mask="url(#ss-fm${i})"><g fill="#0a0a0a"><path d="${ridge(rand, W, H, 136, 8)}"/>${mid}</g></g>`, 'xMinYMax slice');
      const nearSvg = svg(`0 0 ${W} ${H}`, `<g fill="#0a0a0a"><path d="${ridge(rand, W, H, 142, 4)}"/><path d="${grass(rand, 0, W, 141, 4, 16, 10)}"/>${near}</g>`, 'xMinYMax slice');
      const box = el('ss-flats');
      box.setAttribute('aria-hidden', 'true');
      const layers = [['ss-flat ss-f-far', far, 0.12], ['ss-flat ss-f-mid', midSvg, 0.28], ['ss-flat ss-f-near', nearSvg, 0.5]].map(([c, s, sp]) => {
        const l = el(c, s);
        box.append(l);
        return { el: l, sp };
      });
      sec.before(box);
      flats.push({ el: box, layers, top: 0, h: 0, w: 0 });
    });
    measure();
    wake();
  }


  // ---- drawing ----
  let lastScroll = -1;
  let raf = 0;
  let last = performance.now();
  let fresh = true; // the first frame after waking: its gap says nothing about the device
  let gapMin = Infinity; // the shortest gap seen: about one refresh of this display
  let gapN = 0;
  let gapSlow = 0;
  let every = 1; // draw every Nth frame on a slow device
  let lite = false;
  let tick = 0;
  let stageOn = true;
  let birdDir = 1;
  let birdPrevX = 0;

  function drawStage(now) {
    const s = now / 1000;
    const calm = isCalm();
    const sy = stageTop - scrollY;
    const lx = clamp(L.x - stageLeft, -0.15 * W, 1.15 * W);
    const ly = clamp(L.y - sy, -0.2 * H, 1.1 * H);
    // The bird loops slowly and flies out towards the lamp and back every 20 seconds.
    if (!calm) {
      const ph = (s / 20) * Math.PI * 2;
      // (On a slow device the bird keeps one distance, so its blur only changes with the lamp.)
      const bx = W * 0.09 * Math.sin(ph);
      bird.bx = bx;
      bird.by = H * 0.05 * Math.sin(ph * 2);
      bird.d0 = lite ? 0.1 : 0.03 + 0.11 * (1 - Math.cos(ph));
      const dir = bx < birdPrevX ? 1 : -1;
      if (dir !== birdDir) { birdDir = dir; bird.el.classList.toggle('ss-flip', dir < 0); }
      birdPrevX = bx;
    } else { bird.bx = 0; bird.by = 0; bird.d0 = 0.1; }
    const lampW = LAMP * (W / 1100);
    for (const p of puppets) {
      const d = Math.min(D_MAX, p.d0 / ld);
      p.d = d;
      const k = 1 / (1 - d);
      const x = p.x0 + p.bx;
      const y = p.y0 + p.by;
      const tx = p.bx + (lx - x) * (1 - k);
      const ty = p.by + (p.foot === null ? ly - y : p.h * p.foot) * (1 - k);
      p.el.style.transform = `translate3d(${f1(tx)}px,${f1(ty)}px,0) scale(${k.toFixed(4)})`;
      // The blur still to add as a CSS filter. A baked puppet already carries the far lamp's blur, which the scale k
      // has grown with it; Gaussian blurs add in squares, so the rest is the square root of the difference. The tree
      // line and the ground gain under 1.5 px even with the lamp at its nearest: not worth a filter on layers so wide.
      let blur;
      if (!p.baked) blur = (lampW * d) / (1 - d);
      else if (p.d0 < 0.05) blur = 0;
      else blur = (lampW / (1 - d)) * Math.sqrt(Math.max(0, d * d - p.d0 * p.d0));
      blur = Math.round(blur * 2) / 2;
      if (blur !== p.blur) {
        p.blur = blur;
        p.el.style.filter = blur >= 0.5 ? `blur(${blur}px)` : 'none';
      }
      const op = (1 - d * 0.35).toFixed(3);
      if (op !== p.op) { p.op = op; p.el.style.opacity = op; }
    }
  }

  function drawFlats() {
    const y = scrollY;
    if (y === lastScroll) return;
    lastScroll = y;
    for (const f of flats) {
      const top = f.top - y;
      if (top > vh + 40 || top + f.h < -40) continue;
      const p = isCalm() ? 0.5 : clamp((vh - top) / (vh + f.h), 0, 1);
      for (const l of f.layers) l.el.style.transform = `translate3d(${f1(-p * l.sp * f.w)}px,0,0)`;
    }
  }

  function frame(now) {
    raf = 0;
    const gap = now - last;
    const dt = Math.min(0.06, gap / 1000);
    last = now;
    const calm = isCalm();
    const ldT = held && !calm ? LD_MIN : ldSet;
    if (!calm) {
      // With no pointer, the lamp drifts slowly while the stage is in view.
      if (now - pointerAt > 6000 && !placed && stageOn) {
        const s = now / 1000;
        T.x = vw * (0.6 + 0.2 * Math.sin(s * 0.16));
        T.y = vh * (0.34 + 0.13 * Math.sin(s * 0.23 + 1.3));
      }
      const a = 1 - Math.exp(-dt * 5);
      L.x += (T.x - L.x) * a;
      L.y += (T.y - L.y) * a;
      ld += (ldT - ld) * (1 - Math.exp(-dt * ldRate));
      if (Math.abs(ldT - ld) < 0.002) ld = ldT;
    } else { L.x = T.x; L.y = T.y; ld = ldT; }
    // Keep going while the stage is in view (the drift and the bird), or until the lamp has caught up.
    const settled = Math.abs(T.x - L.x) < 0.4 && Math.abs(T.y - L.y) < 0.4 && ld === ldT;
    const more = !calm && !document.hidden && (stageOn || !settled);
    // On a slow device only every Nth frame draws, but the last frame always does, so nothing is left half-way.
    if (++tick % every === 0 || !more) {
      // A lamp close to the screen lights a smaller patch of it.
      lamp.style.transform = `translate3d(${f1(L.x)}px,${f1(L.y)}px,0) scale(${(1 - (0.36 * (1 - ld)) / (1 - LD_MIN)).toFixed(3)})`;
      if (stageOn) drawStage(now);
      drawFlats();
    }
    if (ld === ldT && readAt !== ld) readout();
    // Watch the real time between frames against the shortest gap seen, which is about one refresh of this display,
    // so a screen that runs at 30 frames a second is not taken for a slow one. When most frames in a run of 45 take half
    // as long again (and over 22 ms), stop the small animations and the bird's changing blur, then draw every other
    // frame, then every third. Counting slow frames, not averaging, keeps a few long ones (fonts and flats arriving
    // while the page loads) from passing for a slow device.
    if (fresh) fresh = false;
    else if (gap < 250) {
      if (gap > 4) gapMin = Math.min(gapMin, gap);
      if (gap > Math.max(gapMin * 1.5, 22)) gapSlow++;
      if (++gapN >= 45) {
        const slow = gapSlow > 30;
        gapN = 0;
        gapSlow = 0;
        if (slow && !lite) { lite = true; root.classList.add('ss-lite'); }
        else if (slow && every < 3) every++;
      }
    }
    if (more) raf = requestAnimationFrame(frame);
  }
  const wake = () => { if (!raf) { last = performance.now(); fresh = true; raf = requestAnimationFrame(frame); } };

  // ---- input ----
  addEventListener('pointermove', (e) => {
    if (e.pointerType === 'touch' || isCalm()) return;
    T.x = e.clientX;
    T.y = e.clientY;
    pointerAt = performance.now();
    placed = false;
    wake();
  }, { passive: true });
  // A click or tap on the stage sets the lamp down there (in calm mode and on touch screens). Otherwise, pressing and
  // holding with a mouse or pen brings the lamp in towards the screen until you let go.
  heroText.addEventListener('pointerdown', (e) => {
    if (e.target.closest('.ss-ctl, a, button, input')) return;
    if (e.pointerType === 'touch' || isCalm()) {
      T.x = e.clientX;
      T.y = e.clientY;
      placed = true;
      wake();
      return;
    }
    if (e.button !== 0) return;
    held = true;
    ldRate = 2.2;
    heroText.classList.add('ss-held');
    wake();
  });
  const letGo = () => {
    if (!held) return;
    held = false;
    ldRate = 2.2;
    heroText.classList.remove('ss-held');
    wake();
  };
  addEventListener('pointerup', letGo);
  addEventListener('pointercancel', letGo);
  addEventListener('blur', letGo);
  // Moving while holding shouldn't select the title.
  heroText.addEventListener('selectstart', (e) => { if (held) e.preventDefault(); });
  range.addEventListener('input', setLamp);
  addEventListener('scroll', wake, { passive: true });
  let rt;
  addEventListener('resize', () => { clearTimeout(rt); rt = setTimeout(() => { measure(); wake(); }, 120); });
  document.addEventListener('visibilitychange', () => { if (!document.hidden) wake(); });
  addEventListener('eas:calm', () => { hint.textContent = hintText(); letGo(); ld = ldSet; measure(); wake(); });
  if ('IntersectionObserver' in window) new IntersectionObserver((es) => { stageOn = es[es.length - 1].isIntersecting; wake(); }).observe(stage);
  if ('ResizeObserver' in window) new ResizeObserver(() => { measure(); wake(); }).observe(page);

  measure();
  setLamp();
  wake();
  document.fonts?.ready.then(() => { measure(); wake(); });
  // The flats are below the first screen: build them after the first paint.
  requestAnimationFrame(() => setTimeout(buildFlats, 60));
})();
