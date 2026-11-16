// Folk Horror: an open field notebook. Everything drawn in pencil here is real SVG strokes, generated once and drawn in as you scroll.
// A pencil follows the big sketches while they appear. The margin notes tell the story of the visit, and the last line is in someone else's hand.
(() => {
  const root = document.documentElement;
  const isCalm = () => root.dataset.calm === '1';
  const $ = (q, el = document) => el.querySelector(q);
  const $$ = (q, el = document) => [...el.querySelectorAll(q)];
  const make = (tag, cls, html) => { const e = document.createElement(tag); if (cls) e.className = cls; if (html != null) e.innerHTML = html; return e; };
  const NS = 'http://www.w3.org/2000/svg';
  const sv = (tag, attrs = {}) => { const e = document.createElementNS(NS, tag); for (const k in attrs) e.setAttribute(k, attrs[k]); return e; };
  const rng = (a) => () => { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
  const GRAPHITE = '#2b2622';
  const RUST = '#7c3417';

  // ---- Filters: graphite grain, inked type, pigment bleeding into paper ----
  document.body.prepend(make('div', '', `<svg width="0" height="0" style="position:absolute" aria-hidden="true" focusable="false"><defs>
    <filter id="fh-pencil" x="-3%" y="-3%" width="106%" height="106%">
      <feTurbulence type="fractalNoise" baseFrequency=".035" numOctaves="2" seed="4" result="w"/>
      <feDisplacementMap in="SourceGraphic" in2="w" scale="2.4" result="d"/>
      <feTurbulence type="fractalNoise" baseFrequency=".85" numOctaves="2" seed="9" result="g"/>
      <feColorMatrix in="g" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 3 -.6" result="grain"/>
      <feComposite in="d" in2="grain" operator="in"/>
    </filter>
    <filter id="fh-ink" x="-2%" y="-6%" width="104%" height="112%">
      <feTurbulence type="fractalNoise" baseFrequency=".05" numOctaves="3" seed="2" result="w"/>
      <feDisplacementMap in="SourceGraphic" in2="w" scale="2.6" result="d"/>
      <feTurbulence type="fractalNoise" baseFrequency=".6" numOctaves="2" seed="5" result="g"/>
      <feColorMatrix in="g" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 5 -1.15" result="spk"/>
      <feComposite in="d" in2="spk" operator="in"/>
    </filter>
    <filter id="fh-bleed" x="-10%" y="-10%" width="120%" height="120%">
      <feTurbulence type="fractalNoise" baseFrequency=".03" numOctaves="3" seed="8" result="w"/>
      <feDisplacementMap in="SourceGraphic" in2="w" scale="20" result="d"/>
      <feTurbulence type="fractalNoise" baseFrequency=".7" numOctaves="2" seed="3" result="g"/>
      <feColorMatrix in="g" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 3 -.25" result="grain"/>
      <feComposite in="d" in2="grain" operator="in"/>
    </filter>
  </defs></svg>`).firstElementChild);

  // ---- A pencil: wobbly strokes, drawn in order ----
  const sketches = [];
  class Sk {
    constructor(w, h, seed, opts = {}) {
      this.w = w; this.h = h; this.R = rng(seed); this.paths = []; this.p = 0; this.opts = opts;
      this.svg = sv('svg', { class: opts.cls || 'fh-sk', viewBox: `0 0 ${w} ${h}`, 'aria-hidden': 'true' });
      this.g = sv('g', { filter: opts.nofilter ? '' : 'url(#fh-pencil)' });
      if (opts.nofilter) this.g.removeAttribute('filter');
      this.svg.append(this.g);
    }
    j(a) { return (this.R() - .5) * 2 * a; }
    stroke(d, w = 1.3, op = .88, col = GRAPHITE) {
      const p = sv('path', { d, stroke: col, 'stroke-width': (w * 1.22).toFixed(2), 'stroke-opacity': op });
      this.g.append(p);
      this.paths.push(p);
      return p;
    }
    // A smooth wobbling line through points.
    curve(pts, w, op, col, amp = 1.1) {
      const P = pts.map(([x, y]) => [x + this.j(amp), y + this.j(amp)]);
      let d = `M${P[0][0].toFixed(1)} ${P[0][1].toFixed(1)}`;
      for (let i = 1; i < P.length - 1; i++) {
        const mx = (P[i][0] + P[i + 1][0]) / 2;
        const my = (P[i][1] + P[i + 1][1]) / 2;
        d += ` Q${P[i][0].toFixed(1)} ${P[i][1].toFixed(1)} ${mx.toFixed(1)} ${my.toFixed(1)}`;
      }
      const L = P[P.length - 1];
      d += ` L${L[0].toFixed(1)} ${L[1].toFixed(1)}`;
      return this.stroke(d, w, op, col);
    }
    // A hand-ruled straight line: bowed, with an overshoot.
    line(x1, y1, x2, y2, w, op, col, amp = 1.4) {
      const len = Math.hypot(x2 - x1, y2 - y1) || 1;
      const over = Math.min(7, len * .04);
      const ux = (x2 - x1) / len;
      const uy = (y2 - y1) / len;
      const n = Math.max(2, Math.min(9, Math.round(len / 70)));
      const pts = [];
      for (let i = 0; i <= n; i++) {
        const t = i / n;
        const b = Math.sin(t * Math.PI) * amp * .9;
        pts.push([x1 - ux * over + (x2 - x1 + ux * 2 * over) * t - uy * b, y1 - uy * over + (y2 - y1 + uy * 2 * over) * t + ux * b]);
      }
      return this.curve(pts, w, op, col, amp * .5);
    }
    ring(cx, cy, rx, ry, w, op, col, turns = 1.08, amp = 1.5) {
      const start = this.R() * 6.28;
      const n = Math.max(8, Math.round((rx + ry) / 3.2));
      const pts = [];
      for (let i = 0; i <= n * turns; i++) {
        const a = start + (i / n) * 6.283;
        const k = 1 + this.j(.03);
        pts.push([cx + Math.cos(a) * rx * k, cy + Math.sin(a) * ry * k]);
      }
      return this.curve(pts, w, op, col, amp);
    }
    // Parallel strokes, used for shading.
    hatch(x, y, w, h, n, slant = 8, width = .9, op = .62, col = GRAPHITE) {
      for (let i = 0; i < n; i++) {
        const t = (i + this.R() * .6) / n;
        const xx = x + w * t;
        const yy = y + this.j(h * .08);
        const l = h * (.75 + this.R() * .3);
        this.line(xx, yy, xx - slant, yy + l, width, op, col, .5);
      }
    }
    finish() {
      this.len = this.paths.map((p) => p.getTotalLength());
      this.total = this.len.reduce((a, b) => a + b, 0) || 1;
      this.paths.forEach((p, i) => { p.setAttribute('stroke-dasharray', `${this.len[i] + 1} ${this.len[i] + 2}`); p.setAttribute('stroke-dashoffset', this.len[i] + 1); });
      this.i = 0;
      this.cum = 0;
      sketches.push(this);
      if (this.opts.tip) this.addTip();
      return this;
    }
    addTip() {
      const t = sv('g', { class: 'fh-tip' });
      t.innerHTML = '<g transform="rotate(38)"><path d="M0 0 L-4 -13 L4 -13 Z" fill="#d9c7a0" stroke="#2b2622" stroke-width=".9"/><path d="M0 0 L-1.3 -4 L1.3 -4 Z" fill="#2b2622"/><rect x="-4" y="-68" width="8" height="55" fill="#a8842f" stroke="#2b2622" stroke-width=".9"/><rect x="-4" y="-74" width="8" height="6" fill="#9b9385" stroke="#2b2622" stroke-width=".9"/><rect x="-4" y="-82" width="8" height="8" rx="2" fill="#a0604a" stroke="#2b2622" stroke-width=".9"/></g>';
      this.svg.append(t);
      this.tip = t;
    }
    // Draw up to fraction p. It never undraws: a notebook doesn't.
    set(p) {
      if (p <= this.p) return;
      this.p = Math.min(1, p);
      const goal = this.p * this.total;
      let last = null;
      while (this.i < this.paths.length) {
        const l = this.len[this.i];
        const done = this.p >= 1 ? Infinity : goal - this.cum;
        const path = this.paths[this.i];
        if (done >= l) {
          path.setAttribute('stroke-dashoffset', 0);
          this.cum += l;
          this.i += 1;
          continue;
        }
        if (done > 0) {
          path.setAttribute('stroke-dashoffset', (l + 1 - done).toFixed(1));
          last = [path, done];
        }
        break;
      }
      if (this.tip) {
        if (this.p >= 1 || !last) this.tip.classList.remove('on');
        else {
          const pt = last[0].getPointAtLength(last[1]);
          this.tip.setAttribute('transform', `translate(${pt.x.toFixed(1)} ${pt.y.toFixed(1)})`);
          this.tip.classList.add('on');
        }
      }
    }
  }

  // ---- Things in the notebook ----
  const hagstone = () => {
    const s = new Sk(150, 190, 31);
    s.curve([[70, 4], [66, 26], [74, 44]], 1.1);
    s.curve([[78, 2], [74, 26], [68, 46]], 1);
    s.ring(74, 112, 58, 62, 1.7);
    s.ring(76, 110, 55, 60, 1, .55);
    s.ring(70, 96, 16, 19, 1.5);
    s.ring(70, 96, 14, 17, 1, .7);
    s.curve([[66, 80], [76, 62], [74, 50]], 1.2);
    s.hatch(28, 124, 76, 34, 15, 9, .9, .55);
    s.hatch(92, 82, 30, 48, 9, 6, .9, .45);
    for (let i = 0; i < 16; i++) { const x = 30 + s.R() * 86; const y = 66 + s.R() * 86; s.ring(x, y, 1 + s.R() * 1.4, 1 + s.R() * 1.2, .8, .55, GRAPHITE, 1); }
    return s.finish();
  };
  const stones = () => {
    const s = new Sk(620, 300, 7, { tip: true });
    s.curve([[0, 188], [120, 150], [240, 176], [360, 138], [500, 168], [620, 132]], 1.6);
    s.curve([[0, 214], [150, 198], [320, 214], [470, 196], [620, 214]], 1.1, .6);
    const stone = (x, b, w, h, lean) => {
      s.curve([[x, b], [x + lean * .4 - 3, b - h * .55], [x + lean + 2, b - h], [x + lean + w * .55, b - h - 7], [x + w + lean * .4, b - h * .55], [x + w + 3, b]], 1.8);
      s.curve([[x - 5, b + 1], [x + w * .5, b + 5], [x + w + 8, b]], 1.1, .7);
      s.hatch(x + w * .42, b - h * .86, w * .55, h * .78, Math.round(w / 4), 4, 1, .62);
    };
    stone(150, 248, 44, 130, 6);
    stone(246, 232, 36, 104, -4);
    stone(340, 256, 58, 166, 8);
    stone(452, 236, 34, 92, 5);
    for (let i = 0; i < 44; i++) { const x = 12 + s.R() * 596; const y = 244 + s.R() * 46; s.line(x, y, x + s.j(4), y - 8 - s.R() * 12, .9, .6, GRAPHITE, .5); }
    for (const [x, y, k] of [[96, 64, 1], [130, 44, .8], [506, 54, .9], [536, 76, .7], [470, 34, .6]]) s.curve([[x - 15 * k, y - 4 * k], [x - 7 * k, y - 9 * k], [x, y], [x + 8 * k, y - 10 * k], [x + 17 * k, y - 3 * k]], 1.4);
    return s.finish();
  };
  const dolly = () => {
    const s = new Sk(180, 330, 17, { tip: true });
    s.curve([[90, 6], [86, 40], [94, 74]], 1.2);
    s.curve([[98, 6], [94, 40], [88, 74]], 1);
    for (let i = 0; i < 13; i++) {
      const t = i / 12;
      const y = 74 + i * 15;
      const w = 18 + Math.sin(t * Math.PI) ** .7 * 46;
      s.curve([[90 - w, y + 6], [90 - w * .4, y - 7], [90 + w * .5, y + 8], [90 + w, y - 1]], 1.3);
      s.curve([[90 - w, y + 6], [90 - w * .2, y + 13], [90 + w, y - 1]], .9, .62);
    }
    s.curve([[64, 256], [90, 266], [116, 256]], 1.8);
    s.curve([[66, 262], [90, 272], [114, 262]], 1.1, .7);
    for (let i = 0; i < 11; i++) {
      const x = 60 + i * 6;
      const sw = (x - 90) * .5;
      s.curve([[x, 266], [x + sw * .5, 292], [x + sw, 318]], 1);
      for (let k = 0; k < 4; k++) {
        const y = 294 + k * 8;
        const xx = x + sw * ((y - 266) / 52);
        s.line(xx, y, xx - 4, y - 6, .8, .7, GRAPHITE, .3);
        s.line(xx, y, xx + 4, y - 6, .8, .7, GRAPHITE, .3);
      }
    }
    s.curve([[108, 262], [132, 276], [126, 306]], 1.5, .9, RUST);
    s.curve([[74, 262], [50, 278], [58, 304]], 1.5, .9, RUST);
    return s.finish();
  };
  const barn = () => {
    const s = new Sk(620, 280, 23, { tip: true });
    s.ring(480, 56, 30, 30, 1.3);
    s.ring(480, 56, 28, 28, .8, .5);
    s.curve([[0, 226], [140, 200], [290, 218], [420, 196], [620, 224]], 1.5);
    s.line(170, 216, 170, 116, 1.7);
    s.line(170, 116, 250, 70, 1.8);
    s.line(250, 70, 332, 116, 1.8);
    s.line(332, 116, 332, 218, 1.7);
    s.line(170, 116, 332, 116, 1.1, .7);
    s.line(216, 216, 216, 150, 1.5);
    s.line(216, 150, 288, 150, 1.5);
    s.line(288, 150, 288, 216, 1.5);
    s.hatch(172, 74, 160, 40, 26, 10, .9, .44);
    for (let i = 0; i < 4; i++) { const x = 226 + i * 15; for (let k = 0; k < 2; k++) s.line(x, 158 + k * 2, x + (k ? 2 : -2), 212, .9, .78, RUST, .4); }
    s.hatch(174, 124, 40, 90, 8, 3, .9, .5);
    s.hatch(292, 124, 38, 90, 8, 3, .9, .5);
    for (let i = 0; i < 28; i++) { const x = 8 + s.R() * 604; const y = 230 + s.R() * 44; s.line(x, y, x + s.j(4), y - 6 - s.R() * 10, .9, .55, GRAPHITE, .5); }
    return s.finish();
  };
  const mask = () => {
    const s = new Sk(400, 270, 37, { tip: true });
    const cx = 200;
    s.curve([[cx - 62, 112], [cx - 66, 164], [cx - 40, 228], [cx, 262], [cx + 40, 228], [cx + 66, 164], [cx + 62, 112], [cx, 86], [cx - 62, 112]], 2);
    s.curve([[cx - 58, 116], [cx - 60, 164], [cx - 36, 222], [cx, 254]], 1, .55);
    s.ring(cx - 28, 152, 17, 12, 1.7);
    s.ring(cx + 28, 152, 17, 12, 1.7);
    s.hatch(cx - 42, 144, 28, 18, 13, 2, 1.2, .92);
    s.hatch(cx + 14, 144, 28, 18, 13, 2, 1.2, .92);
    s.curve([[cx, 158], [cx - 7, 200], [cx + 7, 202], [cx, 158]], 1.3);
    for (let i = -3; i <= 3; i++) s.line(cx + i * 6.5, 230 - Math.abs(i) * 2, cx + i * 6, 244 - Math.abs(i) * 3, 1.1, .85);
    s.hatch(cx + 26, 174, 32, 46, 9, 7, .9, .62);
    s.hatch(cx - 18, 96, 40, 28, 9, 4, .8, .42);
    for (let i = 0; i < 7; i++) s.curve([[cx - 50 + i * 15, 104 + (i % 2) * 8], [cx - 44 + i * 15, 118], [cx - 50 + i * 15, 130]], .8, .4);
    const antler = (x, y, ang, len, depth, sign) => {
      const x2 = x + Math.cos(ang) * len;
      const y2 = y + Math.sin(ang) * len;
      s.curve([[x, y], [(x + x2) / 2 + sign * 3, (y + y2) / 2 + 2], [x2, y2]], Math.max(.9, depth * .8));
      if (depth > 0) {
        antler(x2, y2, ang + sign * .3 + s.j(.1), len * .78, depth - 1, sign);
        antler(x2, y2, ang - sign * .85 + s.j(.1), len * .5, depth - 1, sign);
      }
    };
    antler(cx - 44, 98, -2.6, 58, 3, -1);
    antler(cx + 44, 98, -.54, 58, 3, 1);
    return s.finish();
  };
  const wicker = () => {
    const s = new Sk(620, 760, 41, { tip: true });
    s.ring(508, 120, 34, 34, 1.3, .75);
    s.ring(508, 120, 31, 31, .9, .4);
    s.curve([[0, 642], [90, 628], [170, 636], [300, 626], [470, 634], [620, 622]], 1.1, .55);
    s.curve([[0, 690], [130, 664], [300, 672], [460, 660], [620, 684]], 1.7);
    s.curve([[0, 716], [170, 700], [360, 708], [620, 704]], 1, .55);
    const limb = (x1, y1, w1, x2, y2, w2, step = 13) => {
      const a = Math.atan2(y2 - y1, x2 - x1) + Math.PI / 2;
      const c = Math.cos(a);
      const n = Math.sin(a);
      const P = (t, u) => { const w = w1 + (w2 - w1) * t; return [x1 + (x2 - x1) * t + c * u * w, y1 + (y2 - y1) * t + n * u * w]; };
      s.line(...P(0, -1), ...P(1, -1), 2.2, 1);
      s.line(...P(0, 1), ...P(1, 1), 2.2, 1);
      const len = Math.hypot(x2 - x1, y2 - y1);
      const m = Math.max(2, Math.round(len / step));
      for (let i = 0; i <= m; i++) { const t = i / m; s.line(...P(t, -1), ...P(t, 1), 1.2, .9, GRAPHITE, 1); }
      for (let i = 0; i < m; i++) {
        const t0 = i / m;
        const t1 = (i + 1) / m;
        if (i % 2) s.line(...P(t0, -1), ...P(t1, 1), 1, .78, GRAPHITE, .6);
        else s.line(...P(t0, 1), ...P(t1, -1), 1, .78, GRAPHITE, .6);
      }
      // The side away from the sun, gone over again.
      const k = Math.round(len / 6);
      for (let i = 0; i < k; i++) { const t = (i + s.R()) / k; s.line(...P(t, -1), ...P(Math.min(1, t + .03), -.3 - s.R() * .35), 1, .68, GRAPHITE, .4); }
    };
    limb(270, 668, 27, 276, 450, 29);
    limb(350, 668, 27, 344, 450, 29);
    limb(310, 462, 58, 310, 226, 78, 15);
    limb(232, 238, 22, 150, 412, 15);
    limb(388, 238, 22, 470, 412, 15);
    // Hands, just bundles of twigs
    for (let i = 0; i < 6; i++) { s.curve([[140 + i * 4, 416], [134 + i * 5, 436], [128 + i * 8, 452 + (i % 2) * 6]], 1.3, .95); s.curve([[458 + i * 4, 416], [460 + i * 4, 436], [452 + i * 7, 452 + ((i + 1) % 2) * 6]], 1.3, .95); }
    // Head and collar
    s.ring(310, 150, 52, 62, 2.3);
    s.ring(310, 150, 49, 59, 1.1, .7);
    for (let i = 0; i < 10; i++) { const y = 96 + i * 12; const w = Math.sqrt(Math.max(0, 1 - ((y - 150) / 62) ** 2)) * 50; s.curve([[310 - w, y], [310, y + 5], [310 + w, y]], 1.1, .8); }
    for (let i = -3; i <= 3; i++) s.line(310 + i * 13, 92 + Math.abs(i) * 3, 310 + i * 13, 208 - Math.abs(i) * 3, 1.1, .8);
    s.hatch(262, 100, 36, 92, 10, 3, .9, .56);
    s.curve([[256, 214], [284, 226], [336, 226], [364, 214]], 2);
    // The door in the chest, standing open
    s.line(278, 296, 342, 296, 2);
    s.line(342, 296, 342, 384, 2);
    s.line(342, 384, 278, 384, 2);
    s.line(278, 384, 278, 296, 2);
    s.hatch(282, 300, 56, 80, 22, 3, 1.3, .95);
    s.line(342, 296, 372, 306, 1.6);
    s.line(372, 306, 372, 392, 1.6);
    s.line(372, 392, 342, 384, 1.6);
    // A ladder, left against the leg
    s.line(206, 690, 268, 396, 1.8);
    s.line(232, 696, 292, 400, 1.8);
    for (let i = 1; i < 13; i++) { const t = i / 13; s.line(206 + 62 * t, 690 - 294 * t, 232 + 60 * t, 696 - 296 * t, 1.4); }
    // People, small and patient, in a line
    const person = (x, y, k) => {
      s.ring(x, y - 25 * k, 4 * k, 5 * k, 1.2, .95, GRAPHITE, 1.1, .3);
      s.curve([[x - 5 * k, y], [x - 5 * k, y - 15 * k], [x, y - 20 * k], [x + 5 * k, y - 15 * k], [x + 6 * k, y]], 1.3);
      s.hatch(x - 4 * k, y - 16 * k, 8 * k, 15 * k, 5, 1, 1, .8);
    };
    for (const [x, y, k] of [[42, 696, 1.05], [84, 690, 1.1], [120, 698, 1.2], [160, 702, 1.3], [422, 706, 1.25], [462, 700, 1.2], [500, 694, 1.15], [540, 688, 1.05], [582, 692, 1], [392, 720, 1.35]]) person(x, y, k);
    // A flame, small for now, at the foot
    s.curve([[296, 680], [288, 656], [302, 638], [300, 618], [316, 640], [326, 660], [320, 680]], 2, 1, RUST);
    s.curve([[304, 680], [300, 662], [310, 648], [316, 664], [314, 680]], 1.4, .95, RUST);
    return s.finish();
  };

  const MINI = [
    (s) => { s.curve([[2, 64], [30, 40], [56, 54], [82, 30], [118, 50]], 1.5); s.curve([[50, 74], [58, 62], [52, 56]], 1.1); s.curve([[66, 74], [64, 62], [56, 56]], 1.1); s.ring(92, 16, 7, 7, 1); s.hatch(70, 36, 30, 16, 7, 4, .8, .5); },
    (s) => { s.ring(60, 14, 8, 10, 1.4); s.line(60, 24, 60, 62, 1.8); s.line(34, 34, 86, 34, 1.8); s.line(60, 62, 46, 84, 1.5); s.line(60, 62, 74, 84, 1.5); for (let i = 0; i < 8; i++) { s.line(36 + i * 7, 28, 34 + i * 7, 40, .8, .7); s.line(56 + (i % 2) * 8, 26 + i * 4.6, 64 - (i % 2) * 8, 28 + i * 4.6, .8, .7); } },
    (s) => { [[20, 62], [42, 66], [64, 62], [86, 66], [106, 62]].forEach(([x, y]) => { s.ring(x, y - 32, 6, 7, 1.2, .95, GRAPHITE, 1.1, .4); s.curve([[x - 8, y + 14], [x - 7, y - 12], [x, y - 22], [x + 7, y - 12], [x + 8, y + 14]], 1.3); s.curve([[x - 3, y - 33], [x, y - 29], [x + 3, y - 33]], .8, .8, GRAPHITE, .2); }); },
    (s) => { s.line(12, 70, 78, 12, 1.8); s.line(20, 78, 86, 20, 1.8); s.line(12, 70, 20, 78, 1.3); s.line(78, 12, 90, 8, 1.3); s.line(86, 20, 90, 8, 1.3); s.hatch(50, 42, 56, 40, 14, 12, .9, .62); },
    (s) => { s.curve([[30, 22], [28, 72], [42, 80], [78, 80], [92, 72], [90, 22]], 1.5); s.ring(60, 22, 30, 8, 1.3); s.curve([[34, 44], [60, 54], [86, 44]], 1.1, .9, RUST); s.hatch(38, 50, 44, 26, 11, 2, .9, .55, RUST); },
    (s) => { for (let i = 0; i < 16; i++) { const x = 6 + i * 7; s.curve([[x, 84], [x + 7, 62 + (i % 3) * 3], [x + 19, 50 + (i % 4) * 3]], 1, .76); } for (let i = 0; i < 6; i++) s.curve([[6, 8 + i * 6], [46, 4 + i * 6], [84, 8 + i * 6], [112, 4 + i * 6]], .8, .4 + (i % 2) * .16); },
  ];

  // ---- Assemble the book ----
  const note = (html, cls = '') => { const n = make('p', `fh-note ${cls}`, html); return n; };
  const right = (...kids) => { const d = make('div', 'fh-right'); d.append(...kids); return d; };
  const under = (seed) => {
    const s = new Sk(560, 16, seed, { cls: 'fh-under' });
    s.line(2, 7, 548, 8, 1.7, .9);
    s.line(60, 11, 556, 11, 1.1, .6);
    s.finish();
    return s.svg;
  };
  for (const [i, sec] of $$('.sec').entries()) $('.sec-title', sec)?.after(under(100 + i * 7));

  // First spread: the pond ring, the stone, and the first note
  const end = make('div', 'fh-end');
  end.append(hagstone().svg, note("<b>Tues.</b> The bus only comes as far as the crossroads now. Walked the last four miles with the case. Somebody had left a lamp on for me. I don't think I told anyone I was coming."));
  $('.hero').append(end);
  const ring1 = make('i', 'fh-ring');
  ring1.style.cssText = 'left:4%;top:1180px;rotate:40deg;opacity:.8';
  $('.page').append(ring1);
  const ring2 = make('i', 'fh-ring');
  ring2.style.cssText = 'right:6%;top:40%;width:260px;height:260px;rotate:200deg;opacity:.7';
  $('.page').append(ring2);

  const stack = (sec, lKids, rKids) => {
    const l = make('div', 'fh-lp');
    const r = make('div', 'fh-rp');
    l.append(...lKids);
    r.append(...rKids);
    sec.prepend(l, r);
  };
  const pair = (cls, art, ...kids) => { const d = make('div', `fh-pair ${cls}`); d.append(art, ...kids); return d; };

  // Feel
  const feel = $('#feel');
  stack(feel, [$('.sec-title', feel), $('.fh-under', feel), $('.feel-body', feel), $('.mood-words', feel)],
    [right(stones().svg, note("<b>Thurs.</b> They are very kind here. Everyone knows my name. I don't remember giving it.")), $('.origins', feel)]);
  // Core
  $('#core').append(right(note("<b>Sat.</b> Asked about the straw figures over the doors. \"For the harvest,\" said the landlady. It is April.")));
  $$('.core-item').forEach((it, i) => {
    const s = new Sk(120, 90, 200 + i * 3, { cls: 'fh-mini' });
    MINI[i % MINI.length](s);
    s.finish();
    it.prepend(s.svg);
  });
  // How
  const how = $('#how');
  stack(how, [$('.sec-title', how), $('.fh-under', how), $('.steps', how)],
    [right(pair('', dolly().svg, note("<b>Mon.</b> Copied this out of the ledger in the vestry. The handwriting changes every forty years or so. The instructions don't."))), $('.how-side', how)]);
  // Palette
  $('#palette').append(right(note("<b>Tues.</b> Ochre from the pit behind the church. Nobody would walk up there with me, but they were glad of what I brought back.")));
  // Vibe
  const barnBox = make('div', 'fh-barn');
  barnBox.append(note('<b>Wed.</b> Singing from the barn again. It is the same verse every night. I have started to know the words.'), barn().svg, note('<i>The corn is high, the corn is low,<br>ask the stranger, will he go.</i>', 'fh-verse'));
  $('#vibe').append(barnBox);
  // References
  $('#refs').append(right(pair('fh-pair-wide', mask().svg, note('<b>Fri.</b> Posted my notes to the university. Found the envelope on my pillow this morning, with a sprig of rowan in it.'))));
  // The last spread
  const fin = make('div', 'fh-final');
  fin.append(wicker().svg);
  $('#related').append(fin);
  const last = make('div', 'fh-last');
  last.append(note('<b>Sun.</b> The timetable in the post office is from 1971. They have asked me to stay on for the harvest. I am to be the guest of honour. I said yes. It would be rude not to.'));
  last.append(make('span', 'fh-other', 'He is very happy here. Do come.'));
  $('#related').append(last);

  // Pencil frames around everything tipped in
  const frames = [];
  const FRAMED = '.hero-gallery .shot-link, .origins, .specs, .do, .avoid, .loop video';
  function frameAll() {
    for (const f of frames) { f.svg.remove(); const i = sketches.indexOf(f); if (i > -1) sketches.splice(i, 1); }
    frames.length = 0;
    $$(FRAMED).forEach((el, i) => {
      const host = el.closest('.shot, .loop') || el;
      const w = el.offsetWidth + 14;
      const h = el.offsetHeight + 14;
      if (!w || !h) return;
      const s = new Sk(w, h, 300 + i, { cls: 'fh-frame', nofilter: innerWidth < 760 });
      s.svg.setAttribute('width', w);
      s.svg.setAttribute('height', h);
      // Twice round, like someone checking the corners
      for (let k = 0; k < 2; k++) {
        const o = 4 + k * 2.5;
        const a = k ? .62 : .88;
        s.line(o, o, w - o, o + s.j(1.5), 1.3, a);
        s.line(w - o, o, w - o - s.j(1.5), h - o, 1.3, a);
        s.line(w - o, h - o, o, h - o + s.j(1.5), 1.3, a);
        s.line(o, h - o, o + s.j(1.5), o, 1.3, a);
      }
      s.finish();
      s.svg.style.left = host === el ? '-7px' : `${el.offsetLeft - 7}px`;
      s.svg.style.top = host === el ? '-7px' : `${el.offsetTop - 7}px`;
      if (getComputedStyle(host).position === 'static') host.style.position = 'relative';
      host.append(s.svg);
      frames.push(s);
      if (isCalm()) s.set(1);
    });
  }

  // ---- Drawing in on scroll ----
  let queued = false;
  function update() {
    queued = false;
    const vh = innerHeight;
    for (const s of sketches) {
      if (s.p >= 1) continue;
      const r = s.svg.getBoundingClientRect();
      if (r.top > vh) continue;
      s.set((vh * .96 - r.top) / (r.height + vh * .28));
    }
  }
  const queue = () => { if (!queued) { queued = true; requestAnimationFrame(update); } };
  addEventListener('scroll', queue, { passive: true });
  function allDrawn() { for (const s of sketches) s.set(1); }

  // What is on screen at the start draws itself, unhurried, once the fonts are in.
  function intro() {
    if (isCalm()) { allDrawn(); return; }
    const vh = innerHeight;
    const list = sketches.filter((s) => s.svg.getBoundingClientRect().top < vh);
    const t0 = performance.now();
    const tick = (t) => {
      const u = Math.min(1, (t - t0) / 1500);
      const e = u * u * (3 - 2 * u);
      for (const s of list) s.set(e);
      if (u < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }
  addEventListener('eas:calm', (e) => { if (e.detail?.calm) allDrawn(); });

  let resizeT;
  let lastW = innerWidth;
  addEventListener('resize', () => {
    if (innerWidth === lastW) return;
    lastW = innerWidth;
    clearTimeout(resizeT);
    resizeT = setTimeout(() => { frameAll(); for (const f of frames) f.set(1); queue(); }, 200);
  });
  const go = () => { frameAll(); intro(); queue(); };
  if (document.readyState === 'complete') go(); else addEventListener('load', go);
})();
