// Hand-Painted 3D: the texture study.
// A stone block is painted up layer by layer, in the order the how-to describes: blockout, flat colour, ambient occlusion,
// light map, top-down gradient, edge highlights, cracks, then moss. Each layer is revealed by a brush that travels along
// what it paints. On screens wide and tall enough to hold it, the study sticks beside the steps and follows the one you
// are reading; elsewhere it sits above them and paints itself once. It also has its own layer panel and buttons.
// Calm mode shows each change at once, without the brush.
(() => {
  const root = document.documentElement;
  const $ = (q, el = document) => el.querySelector(q);
  const $$ = (q, el = document) => [...el.querySelectorAll(q)];
  const isCalm = () => root.dataset.calm === '1';

  // The title breaks only between words, never after the hyphen in "Hand-Painted".
  const h1 = $('.hero-title');
  if (h1 && !h1.querySelector('.hp-word')) {
    const words = h1.textContent.trim().split(/\s+/);
    h1.textContent = '';
    words.forEach((w, i) => {
      const s = document.createElement('span');
      s.className = 'hp-word';
      s.textContent = w;
      h1.append(s);
      if (i < words.length - 1) h1.append(' ');
    });
  }

  const steps = $('.sec-how .steps');
  if (!steps) return;

  // ---------- the block ----------
  // Front face A B C D, pushed back by OFF for the top and right faces. Every edge bows a little: no straight lines.
  const A = [72, 150], B = [268, 160], C = [260, 316], D = [80, 308];
  const B2 = [346, 98], C2 = [338, 254], A2 = [150, 88];
  const cAB = [170, 149], cBC = [268, 238], cCD = [170, 316], cDA = [72, 229];
  const cBB2 = [309, 125], cB2A2 = [248, 89], cA2A = [108, 116], cB2C2 = [346, 176], cC2C = [301, 289];
  const P = (p) => p.join(' ');
  const FRONT = `M${P(A)}Q${P(cAB)} ${P(B)}Q${P(cBC)} ${P(C)}Q${P(cCD)} ${P(D)}Q${P(cDA)} ${P(A)}Z`;
  const TOP = `M${P(A)}Q${P(cAB)} ${P(B)}Q${P(cBB2)} ${P(B2)}Q${P(cB2A2)} ${P(A2)}Q${P(cA2A)} ${P(A)}Z`;
  const RIGHT = `M${P(B)}Q${P(cBB2)} ${P(B2)}Q${P(cB2C2)} ${P(C2)}Q${P(cC2C)} ${P(C)}Q${P(cBC)} ${P(B)}Z`;
  const quad = (p0, c, p1, t) => [0, 1].map((i) => (1 - t) * (1 - t) * p0[i] + 2 * (1 - t) * t * c[i] + t * t * p1[i]);
  const f1 = (n) => Math.round(n * 10) / 10;
  const poly = (pts) => `M${pts.map((p) => `${f1(p[0])} ${f1(p[1])}`).join('L')}Z`;
  const line = (pts) => `M${pts.map((p) => `${f1(p[0])} ${f1(p[1])}`).join('L')}`;

  // A painted band along an edge: one side follows the edge, the other wanders, so the highlight never runs dead straight.
  function band(p0, c, p1, dir, w0, w1, seed) {
    const n = 26;
    const out = [];
    const back = [];
    for (let i = 0; i <= n; i += 1) {
      const t = i / n;
      const p = quad(p0, c, p1, t);
      const w = (w0 + (w1 - w0) * t) * (1 + 0.28 * Math.sin(t * 11 + seed) + 0.14 * Math.sin(t * 29 + seed * 2)) * Math.min(1, t * 9, (1 - t) * 9);
      out.push([p[0] - dir[0] * 0.8, p[1] - dir[1] * 0.8]);
      back.unshift([p[0] + dir[0] * w, p[1] + dir[1] * w]);
    }
    return poly(out.concat(back));
  }

  // The carved swirl on the front face
  const swirl = (() => {
    const pts = [];
    const turns = 1.55;
    for (let i = 0; i <= 70; i += 1) {
      const t = i / 70;
      const a = -Math.PI / 2 + t * turns * Math.PI * 2;
      const r = 7 + 37 * t;
      pts.push([168 + r * Math.cos(a), 232 + r * Math.sin(a) * 0.9]);
    }
    return pts;
  })();
  const SWIRL = line(swirl);

  // Seeded random numbers, so the moss grows the same way every time
  let seed = 17;
  const rnd = () => { seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646; };

  // Moss grows in clumps of small dabs: denser and taller in the middle, with a broken edge.
  // Each dab is painted dark, then mid, then lit on top, the same top light as everything else.
  const dabs = [];
  const edgeY = (x) => quad(A, cAB, B, (x - A[0]) / (B[0] - A[0]))[1];
  const clump = (cx, cy, w, h, n) => {
    for (let i = 0; i < n; i += 1) {
      const u = (rnd() + rnd() + rnd()) / 3 - 0.5;
      const v = (rnd() + rnd()) / 2 - 0.5;
      const mid = 1 - Math.min(1, Math.abs(u) * 2);
      dabs.push([cx + u * w, cy + v * h - mid * h * 0.35, 1.3 + rnd() * 1.8 + mid * 2.3, v]);
    }
  };
  clump(124, edgeY(124) - 1, 92, 12, 78);
  clump(200, edgeY(200) - 1, 28, 8, 18);
  clump(244, 107, 36, 9, 24);
  clump(118, 308, 54, 10, 36);
  clump(230, 313, 36, 9, 24);
  dabs.sort((a, b) => a[1] - b[1]);
  const dabSvg = (dy, k, fill, keep = () => true) => dabs.filter(keep).map(([x, y, r]) => `<circle cx="${f1(x)}" cy="${f1(y + dy)}" r="${f1(r * k)}" fill="${fill}"/>`).join('');
  // a few thin strands hang over the front edge
  const strands = [104, 119, 131].map((x) => {
    const y = edgeY(x) + 3;
    const h = 6 + rnd() * 9;
    return `<path d="M${f1(x)} ${f1(y)}q${f1(1.5 - rnd() * 3)} ${f1(h / 2)} ${f1(rnd() * 2 - 1)} ${f1(h)}" stroke="#2c4c14" stroke-width="2.4" fill="none" stroke-linecap="round"/><circle cx="${f1(x)}" cy="${f1(y + h)}" r="1.7" fill="#4a7424"/>`;
  }).join('');
  // Grass in tufts at the foot of the block: blades fan out, dark at the root and lit at the tip.
  const grass = (() => {
    let s = '';
    for (const [cx, n, hmax] of [[84, 7, 26], [150, 4, 16], [206, 5, 20], [262, 7, 28], [300, 4, 18]]) {
      const base = cx < 262 ? quad(D, cCD, C, Math.max(0, Math.min(1, (cx - D[0]) / (C[0] - D[0]))))[1] + 7 : 318 - (cx - 262) * 0.25;
      for (let i = 0; i < n; i += 1) {
        const t = n > 1 ? i / (n - 1) : 0.5;
        const x = cx + (t - 0.5) * n * 3.2;
        const h = hmax * (0.55 + 0.45 * Math.sin(Math.PI * t)) * (0.8 + rnd() * 0.3);
        const lean = (t - 0.5) * 22 + (rnd() - 0.5) * 6;
        const col = ['#355c18', '#4f7d26', '#6e9e34'][i % 3];
        s += `<path d="M${f1(x - 3)} ${f1(base)}Q${f1(x + lean * 0.35)} ${f1(base - h * 0.6)} ${f1(x + lean)} ${f1(base - h)}Q${f1(x + lean * 0.25 + 1.6)} ${f1(base - h * 0.5)} ${f1(x + 3)} ${f1(base)}Z" fill="${col}"/>`;
        s += `<path d="M${f1(x + lean * 0.62)} ${f1(base - h * 0.72)}Q${f1(x + lean * 0.85)} ${f1(base - h * 0.9)} ${f1(x + lean)} ${f1(base - h)}" stroke="#c9e47e" stroke-width="1.4" fill="none" stroke-linecap="round"/>`;
      }
    }
    return s;
  })();

  const CRACKS = [
    [[214, 157], [219, 172], [212, 186], [221, 203], [217, 221]],
    [[302, 136], [307, 152], [301, 168], [310, 187], [306, 200]],
    [[101, 304], [107, 289], [101, 275], [109, 262]],
  ];
  const crackSvg = CRACKS.map((c) => `<path d="${line(c.map(([x, y]) => [x, y + 2.6]))}" stroke="#f8dfa6" stroke-width="1.9" fill="none" stroke-linecap="round" stroke-linejoin="round"/><path d="${line(c)}" stroke="#3f2a18" stroke-width="3" fill="none" stroke-linecap="round" stroke-linejoin="round"/>`).join('');

  // ---------- the layers ----------
  const LAYERS = [
    { name: 'Blockout', cap: 'Blockout: big, simple forms, lit by the engine. No paint yet.' },
    { name: 'Flat colour', tint: '#c9a66c', thumb: '#c9a66c', cap: 'Flat colour: one base colour on the unwrapped block, and no light at all.' },
    { name: 'Ambient occlusion', mode: 'Multiply 80%', tint: '#7a6856', thumb: 'linear-gradient(#f4ece0, #8a7866)', cap: 'Ambient occlusion, multiplied over the base colour at 80%.' },
    { name: 'Light map', mode: 'Soft Light 100%', tint: '#f4f4f4', thumb: 'radial-gradient(circle at 34% 28%, #fff, #9a9a9a 70%, #555)', cap: 'A light map from white point lights, in Soft Light. With the occlusion it makes the underpainting.' },
    { name: 'Top-down gradient', tint: '#ffe2a2', thumb: 'linear-gradient(#ffe6aa, #c9a66c 50%, #3a3c74)', cap: 'Each face lit from the top: lighter above, darker below, warm light and cool shadow.' },
    { name: 'Edge highlights', tint: '#fff2c8', thumb: 'linear-gradient(170deg, #c9a66c 38%, #fff2c8 40% 50%, #b08d58 52%)', cap: 'Highlights pick out the bevels, following the light, never in completely straight lines.' },
    { name: 'Cracks', tint: '#3f2a18', thumb: 'linear-gradient(115deg, #c9a66c 44%, #3f2a18 45% 50%, #f8dfa6 51% 55%, #c9a66c 56%)', cap: 'Cracks and chips: their values change with the light too.' },
    { name: 'Moss and dirt', tint: '#7fae3e', thumb: 'radial-gradient(circle at 40% 36%, #b8d870 0 18%, #5e8c2c 40%, #3f6a1e 62%, #c9a66c 64%)', cap: 'Moss and dirt add colour and tell the block\'s story.' },
  ];
  const TOPN = LAYERS.length - 1;

  // The brush paths: wide strokes that sweep each layer in, or follow the edges and cracks they paint.
  const rows = (ys, x0 = 36, x1 = 384) => ys.map((y, i) => (i % 2 ? `M${x1} ${y}H${x0}` : `M${x0} ${y}H${x1}`)).join('');
  const BRUSH = [
    null,
    { d: rows([92, 146, 200, 254, 300]), w: 64, dur: 1150 },
    { d: rows([110, 170, 230, 290, 334]), w: 70, dur: 1000 },
    { d: rows([96, 150, 204, 258, 312]), w: 66, dur: 950 },
    { d: rows([96, 150, 204, 258, 312]), w: 66, dur: 1050 },
    { d: `M${P(A)}Q${P(cAB)} ${P(B)}Q${P(cBB2)} ${P(B2)}Q${P(cB2A2)} ${P(A2)}Q${P(cA2A)} ${P(A)}M${P(B)}Q${P(cBC)} ${P(C)}M${P(D)}Q${P(cDA)} ${P(A)}${line(swirl.map(([x, y]) => [x, y + 3]))}`, w: 30, dur: 1700 },
    { d: CRACKS.map((c) => line(c)).join('') + 'M70 152L94 160', w: 22, dur: 1000 },
    { d: 'M76 142H204M190 168H86M206 104H270M120 244Q168 270 214 236M66 312Q170 328 314 312M310 294Q170 302 66 290', w: 44, dur: 1500 },
  ];

  const svg = `<svg class="hp-study-svg" viewBox="0 0 420 392" role="img" aria-labelledby="hp-cap">
  <defs>
    <linearGradient id="hp-tt" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#a86a34"/><stop offset="1" stop-color="#7a4620"/></linearGradient>
    <linearGradient id="hp-tts" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#5a3216"/><stop offset="1" stop-color="#2e1608"/></linearGradient>
    <linearGradient id="hp-ao-f" x1="0" y1="0" x2="0" y2="1"><stop offset=".5" stop-color="#fff"/><stop offset="1" stop-color="#806c58"/></linearGradient>
    <linearGradient id="hp-ao-r" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#e9e1d6"/><stop offset="1" stop-color="#5e4e44"/></linearGradient>
    <linearGradient id="hp-lm-f" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#bcbcbc"/><stop offset="1" stop-color="#4a4a4a"/></linearGradient>
    <linearGradient id="hp-lm-r" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#6a6a6a"/><stop offset="1" stop-color="#383838"/></linearGradient>
    <radialGradient id="hp-lm-p" cx=".3" cy=".22" r=".6"><stop offset="0" stop-color="#fff" stop-opacity=".35"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></radialGradient>
    <linearGradient id="hp-tg-f" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffe2a2" stop-opacity=".2"/><stop offset=".34" stop-color="#ffe2a2" stop-opacity="0"/><stop offset=".5" stop-color="#2c2e66" stop-opacity="0"/><stop offset="1" stop-color="#2c2e66" stop-opacity=".48"/></linearGradient>
    <linearGradient id="hp-tg-r" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#3a3f78" stop-opacity=".3"/><stop offset="1" stop-color="#20235a" stop-opacity=".62"/></linearGradient>
    <linearGradient id="hp-hl-v" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffe6ae" stop-opacity=".85"/><stop offset="1" stop-color="#ffe6ae" stop-opacity="0"/></linearGradient>
    <linearGradient id="hp-dirt" x1="0" y1="0" x2="0" y2="1"><stop offset=".68" stop-color="#4e3f22" stop-opacity="0"/><stop offset="1" stop-color="#4e3f22" stop-opacity=".55"/></linearGradient>
    <filter id="hp-soft" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="2.2"/></filter>
    <filter id="hp-soft2" x="-20%" y="-60%" width="140%" height="220%"><feGaussianBlur stdDeviation="7"/></filter>
    <filter id="hp-bristle" x="-10%" y="-20%" width="120%" height="140%"><feTurbulence type="fractalNoise" baseFrequency=".02 .42" numOctaves="2" seed="5"/><feDisplacementMap in="SourceGraphic" scale="15" xChannelSelector="R" yChannelSelector="G"/></filter>
    <clipPath id="hp-clip-f"><path d="${FRONT}"/></clipPath>
    <clipPath id="hp-clip-r"><path d="${RIGHT}"/></clipPath>
    <clipPath id="hp-clip-t"><path d="${TOP}"/></clipPath>
    <clipPath id="hp-clip-all"><path d="${FRONT}"/><path d="${RIGHT}"/><path d="${TOP}"/></clipPath>
    ${BRUSH.map((b, n) => (b ? `<mask id="hp-m${n}" class="hp-mask" maskUnits="userSpaceOnUse" x="0" y="0" width="420" height="392"><path class="hp-brush" d="${b.d}" stroke-width="${b.w}" filter="url(#hp-bristle)"/></mask>` : '')).join('')}
  </defs>

  <!-- the turntable it stands on -->
  <path d="M14 322A196 42 0 0 0 406 322V342A196 42 0 0 1 14 342Z" fill="url(#hp-tts)" stroke="#1d0d04" stroke-width="2.5"/>
  <ellipse cx="210" cy="322" rx="196" ry="42" fill="url(#hp-tt)" stroke="#1d0d04" stroke-width="2.5"/>
  <ellipse cx="210" cy="322" rx="150" ry="30" fill="none" stroke="#6a3c18" stroke-width="2" opacity=".55"/>
  <ellipse cx="210" cy="322" rx="104" ry="20" fill="none" stroke="#6a3c18" stroke-width="2" opacity=".45"/>
  <path d="M22 332A196 42 0 0 0 398 332" fill="none" stroke="#f0b878" stroke-width="2.4" opacity=".75"/>

  <!-- 0: the bare model, lit by the engine -->
  <g class="hp-model">
    <ellipse cx="200" cy="320" rx="150" ry="18" fill="#000" opacity=".28" filter="url(#hp-soft2)"/>
    <path d="${TOP}" fill="#d6d6d6"/><path d="${FRONT}" fill="#a8a8a8"/><path d="${RIGHT}" fill="#7d7d7d"/>
    <path d="${TOP}" fill="none" stroke="#5e5e5e" stroke-width="1.5"/><path d="${FRONT}" fill="none" stroke="#5e5e5e" stroke-width="1.5"/><path d="${RIGHT}" fill="none" stroke="#5e5e5e" stroke-width="1.5"/>
  </g>

  <!-- 1: flat colour -->
  <g class="hp-paint" data-l="1" mask="url(#hp-m1)">
    <path d="${TOP}" fill="#c9a66c"/><path d="${FRONT}" fill="#c9a66c"/><path d="${RIGHT}" fill="#c9a66c"/>
  </g>
  <!-- 2: ambient occlusion, multiplied at 80% -->
  <g class="hp-paint" data-l="2" mask="url(#hp-m2)" style="mix-blend-mode:multiply"><g opacity=".8">
    <path d="${FRONT}" fill="url(#hp-ao-f)"/><path d="${RIGHT}" fill="url(#hp-ao-r)"/>
    <g clip-path="url(#hp-clip-f)"><path d="${SWIRL}" stroke="#6b5644" stroke-width="12" fill="none" stroke-linecap="round" filter="url(#hp-soft)"/></g>
    <ellipse cx="196" cy="320" rx="152" ry="19" fill="#4a3424" filter="url(#hp-soft2)"/>
  </g></g>
  <!-- 3: light map, soft light -->
  <g class="hp-paint" data-l="3" mask="url(#hp-m3)" style="mix-blend-mode:soft-light">
    <path d="${TOP}" fill="#fff"/><path d="${FRONT}" fill="url(#hp-lm-f)"/><path d="${FRONT}" fill="url(#hp-lm-p)"/><path d="${RIGHT}" fill="url(#hp-lm-r)"/>
  </g>
  <!-- 4: top-down gradient, warm light and cool shadow, plus a few strokes -->
  <g class="hp-paint" data-l="4" mask="url(#hp-m4)">
    <path d="${TOP}" fill="#ffe8b0" opacity=".42"/><path d="${FRONT}" fill="url(#hp-tg-f)"/><path d="${RIGHT}" fill="url(#hp-tg-r)"/>
    <g clip-path="url(#hp-clip-t)"><ellipse cx="150" cy="122" rx="74" ry="20" fill="#fff3cc" opacity=".35" filter="url(#hp-soft)"/></g>
    <g clip-path="url(#hp-clip-f)" filter="url(#hp-soft)">
      <ellipse cx="128" cy="178" rx="46" ry="5" fill="#ecd29a" opacity=".5" transform="rotate(-3 128 178)"/>
      <ellipse cx="214" cy="196" rx="38" ry="4" fill="#f0d8a4" opacity=".4" transform="rotate(2 214 196)"/>
      <ellipse cx="120" cy="262" rx="40" ry="5" fill="#8e6c46" opacity=".35"/>
      <ellipse cx="226" cy="284" rx="34" ry="4" fill="#7e5e3e" opacity=".35" transform="rotate(-2 226 284)"/>
    </g>
    <g clip-path="url(#hp-clip-r)" filter="url(#hp-soft)"><ellipse cx="300" cy="200" rx="9" ry="44" fill="#3a3e74" opacity=".25" transform="rotate(8 300 200)"/></g>
  </g>
  <!-- 5: edge highlights -->
  <g class="hp-paint" data-l="5" mask="url(#hp-m5)">
    <path d="${band(A, cAB, B, [0, 1], 7, 8, 1)}" fill="#fff1c8" opacity=".95"/>
    <path d="${band(A, cAB, B, [0, -1], 3, 3, 4)}" fill="#fff4d2" opacity=".8"/>
    <path d="${band(B, cBB2, B2, [0, 1], 5, 3, 2)}" fill="#ffe7b4" opacity=".8"/>
    <path d="${band(B, cBC, C, [1, 0], 6, 0, 3)}" fill="url(#hp-hl-v)"/>
    <path d="${band(B2, cB2A2, A2, [0, 1], 2.5, 2.5, 5)}" fill="#fff2c6" opacity=".6"/>
    <path d="${band(A2, cA2A, A, [0.7, 0.7], 2.5, 3, 6)}" fill="#fff2c6" opacity=".6"/>
    <path d="${band(D, cDA, A, [1, 0], 0, 3, 7)}" fill="#fbe3ae" opacity=".5"/>
    <g clip-path="url(#hp-clip-f)"><path d="${line(swirl.map(([x, y]) => [x, y + 4.8]))}" stroke="#fff0c4" stroke-width="3" fill="none" stroke-linecap="round" opacity=".9"/><path d="${SWIRL}" stroke="#5e4834" stroke-width="2.4" fill="none" stroke-linecap="round" opacity=".7"/></g>
    <path d="M128 147L136 160L141 148Z" fill="#6a5238"/><path d="M130 161L137 163L141 151" stroke="#fff2c8" stroke-width="2" fill="none" stroke-linecap="round"/>
    <path d="M233 153L238 164L245 154Z" fill="#6a5238"/><path d="M236 166L242 165L245 156" stroke="#fff2c8" stroke-width="2" fill="none" stroke-linecap="round"/>
  </g>
  <!-- 6: cracks and a broken corner -->
  <g class="hp-paint" data-l="6" mask="url(#hp-m6)">
    <path d="M72 150L93 148L86 161L75 167Z" fill="#94734a"/><path d="M75 168L86 162L93 149" stroke="#3f2a18" stroke-width="2.2" fill="none" stroke-linejoin="round"/><path d="M77 172L88 166" stroke="#fbe3ae" stroke-width="2" stroke-linecap="round"/>
    ${crackSvg}
  </g>
  <!-- 7: moss and dirt -->
  <g class="hp-paint" data-l="7" mask="url(#hp-m7)">
    <g clip-path="url(#hp-clip-f)"><path d="${FRONT}" fill="url(#hp-dirt)"/></g>
    <g clip-path="url(#hp-clip-r)"><path d="${RIGHT}" fill="url(#hp-dirt)"/></g>
    ${strands}
    ${dabSvg(1.6, 1.12, '#28430f')}${dabSvg(0, 1, '#466d20')}${dabSvg(-1.1, 0.72, '#6f9a32', (d) => d[3] < 0.15)}${dabSvg(-1.8, 0.42, '#a3c457', (d) => d[3] < -0.05)}
    ${dabs.filter((_, i) => i % 7 === 3).map(([x, y, r]) => `<circle cx="${f1(x - r * 0.3)}" cy="${f1(y - r * 0.55)}" r="1.1" fill="#d6ea92"/>`).join('')}
    ${grass}
  </g>

  <!-- the brush that does the painting -->
  <g class="hp-tip" opacity="0">
    <g transform="rotate(-38)">
      <path d="M-6 -24Q-7 -8 0 4Q7 -8 6 -24Z" style="fill:var(--tip, #c9a66c)" stroke="#2a1407" stroke-width="1.6" stroke-linejoin="round"/>
      <path d="M-2.5 -20Q-3 -10 0 -2" stroke="#fff" stroke-width="1.2" fill="none" opacity=".45" stroke-linecap="round"/>
      <rect x="-5.5" y="-38" width="11" height="16" rx="2" fill="#e0b24a" stroke="#2a1407" stroke-width="1.6"/>
      <path d="M-2.5 -36V-25" stroke="#fff3c4" stroke-width="1.4" stroke-linecap="round"/>
      <path d="M-4 -38L-3 -92Q0 -96 3 -92L4 -38Z" fill="#8a4a1e" stroke="#2a1407" stroke-width="1.6" stroke-linejoin="round"/>
      <path d="M-1.4 -44V-88" stroke="#c98a4e" stroke-width="1.3" stroke-linecap="round"/>
    </g>
  </g>
</svg>`;

  const bench = document.createElement('div');
  bench.className = 'hp-bench';
  bench.innerHTML = `
    <figure class="hp-view">
      <span class="hp-tag" aria-hidden="true">Lit by the engine</span>
      ${svg}
      <figcaption class="hp-cap" id="hp-cap"></figcaption>
    </figure>
    <div class="hp-panel" role="group" aria-label="Texture layers of the stone block">
      <div class="hp-panel-head"><span>Layers</span><span class="hp-count"></span></div>
      <ol class="hp-layers">${LAYERS.slice(1).map((l, i) => i + 1).reverse().map((n) => `<li><label class="hp-layer"><input type="checkbox" data-l="${n}"><span class="hp-eye" aria-hidden="true"></span><span class="hp-thumb" style="--t:${LAYERS[n].thumb}" aria-hidden="true"></span><span class="hp-name"><span class="hp-n">${n}</span> ${LAYERS[n].name}${LAYERS[n].mode ? `<span class="hp-mode">${LAYERS[n].mode}</span>` : ''}</span></label></li>`).join('')}</ol>
      <div class="hp-controls">
        <button type="button" class="btn" data-go="-1">Back</button>
        <button type="button" class="btn" data-go="1">Next layer</button>
        <button type="button" class="btn" data-go="all">Repaint all</button>
      </div>
    </div>`;
  // The study and the steps share a wrapper, so the study sticks beside the steps and stops where they end.
  const work = document.createElement('div');
  work.className = 'hp-work';
  steps.before(work);
  work.append(bench, steps);

  const view = $('.hp-view svg', bench);
  const tip = $('.hp-tip', view);
  const tag = $('.hp-tag', bench);
  const cap = $('.hp-cap', bench);
  const count = $('.hp-count', bench);
  const model = $('.hp-model', view);
  const layer = [null];
  const mask = [null];
  const brush = [null];
  const len = [0];
  for (let n = 1; n <= TOPN; n += 1) {
    layer[n] = $(`.hp-paint[data-l="${n}"]`, view);
    mask[n] = $(`#hp-m${n}`, view);
    brush[n] = $('.hp-brush', mask[n]);
    len[n] = brush[n].getTotalLength() || 1000;
    brush[n].style.strokeDasharray = `${len[n]} ${len[n] + 10}`;
    brush[n].style.strokeDashoffset = `${len[n]}`;
  }
  const boxes = $$('input[data-l]', bench);
  const box = (n) => boxes.find((b) => Number(b.dataset.l) === n);

  // ---------- painting ----------
  let stage = 0;
  let queue = [];
  let raf = 0;
  let painting = 0;
  let speed = 1;
  const visible = new Set();

  function sync() {
    for (let n = 1; n <= TOPN; n += 1) box(n).checked = visible.has(n);
    const bare = !visible.has(1);
    model.style.opacity = bare ? '1' : '0';
    tag.textContent = bare ? 'Lit by the engine' : 'Unshaded: the light is in the paint';
    count.textContent = `${visible.size} of ${TOPN} on`;
    $('[data-go="-1"]', bench).disabled = stage <= 0;
    $('[data-go="1"]', bench).disabled = stage >= TOPN;
  }
  function caption(n) {
    cap.innerHTML = `<b>${n ? `Layer ${n}` : 'Model'}</b>${LAYERS[n].cap}`;
  }
  function show(n) {
    visible.add(n);
    layer[n].classList.add('on');
    brush[n].style.strokeDashoffset = '0';
  }
  function hide(n) {
    visible.delete(n);
    layer[n].classList.remove('on');
    brush[n].style.strokeDashoffset = `${len[n]}`;
  }
  function stop() {
    cancelAnimationFrame(raf);
    raf = 0;
    if (painting) show(painting);
    painting = 0;
    queue = [];
    tip.setAttribute('opacity', '0');
  }
  const ease = (k) => (k < 0.5 ? 2 * k * k : 1 - ((-2 * k + 2) ** 2) / 2);
  function next() {
    const n = queue.shift();
    if (!n) { painting = 0; tip.setAttribute('opacity', '0'); return; }
    painting = n;
    visible.add(n);
    layer[n].classList.add('on');
    sync();
    caption(n);
    tip.style.setProperty('--tip', LAYERS[n].tint);
    tip.setAttribute('opacity', '1');
    const t0 = performance.now();
    const dur = BRUSH[n].dur * speed;
    const frame = (now) => {
      const k = Math.min(1, (now - t0) / dur);
      const e = ease(k);
      brush[n].style.strokeDashoffset = `${len[n] * (1 - e)}`;
      const p = brush[n].getPointAtLength(len[n] * e);
      tip.setAttribute('transform', `translate(${f1(p.x)} ${f1(p.y)})`);
      if (k < 1) raf = requestAnimationFrame(frame);
      else { painting = 0; raf = requestAnimationFrame(() => next()); }
    };
    raf = requestAnimationFrame(frame);
  }
  // Shows layers 1..target. New layers are painted in one after another, unless calm mode is on.
  function goTo(target, animate = true) {
    stop();
    stage = Math.max(0, Math.min(TOPN, target));
    for (let n = TOPN; n > stage; n -= 1) hide(n);
    const todo = [];
    for (let n = 1; n <= stage; n += 1) if (!visible.has(n)) todo.push(n);
    if (!animate || isCalm() || !todo.length) {
      todo.forEach(show);
      caption(stage);
      sync();
      return;
    }
    // A long run of layers goes quicker, so a jump to the end doesn't keep the reader waiting.
    speed = todo.length >= 3 ? 0.6 : 1;
    queue = todo;
    sync();
    next();
  }

  // ---------- controls ----------
  bench.addEventListener('click', (e) => {
    const go = e.target.closest('[data-go]')?.dataset.go;
    if (!go) return;
    if (go === 'all') { stop(); for (let n = 1; n <= TOPN; n += 1) hide(n); goTo(TOPN); } else goTo(stage + Number(go));
  });
  bench.addEventListener('change', (e) => {
    const n = Number(e.target.dataset?.l);
    if (!n) return;
    stop();
    if (e.target.checked) {
      if (isCalm()) show(n); else { speed = 1; queue = [n]; next(); }
    } else hide(n);
    caption(n);
    sync();
  });

  // ---------- follow the steps ----------
  // Steps 1 to 7 map to these stages: the blockout, flat colour, the underpainting, the light, then edges, cracks and moss.
  const MAP = [0, 1, 3, 4, 7, 7, 7];
  // The study follows the steps only while it sticks beside them. This is the query the theme CSS uses to stack it above
  // the steps instead (narrow or short windows), so the script and the layout always agree.
  const stacked = matchMedia('(max-width: 1099px), (max-height: 750px)');
  const items = $$('.step', steps);
  let current = -1;
  // Crossing between the two layouts forgets the step being read, so the next one re-syncs the study.
  stacked.addEventListener?.('change', () => { current = -1; items.forEach((s) => s.classList.remove('hp-now')); });
  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver((entries) => {
      if (stacked.matches) return;
      for (const en of entries) {
        if (!en.isIntersecting) continue;
        const i = items.indexOf(en.target);
        if (i === current) continue;
        current = i;
        items.forEach((s, j) => s.classList.toggle('hp-now', j === i));
        goTo(MAP[i] ?? TOPN);
      }
    }, { rootMargin: '-42% 0px -52% 0px' });
    items.forEach((s) => io.observe(s));
    // In the stacked layout the study sits above the steps: paint it once when it comes into view.
    let shown = false;
    const first = new IntersectionObserver((entries) => {
      if (shown || !stacked.matches || !entries.some((en) => en.isIntersecting)) return;
      shown = true;
      first.disconnect();
      if (isCalm()) goTo(TOPN, false);
      else { goTo(0, false); setTimeout(() => goTo(TOPN), 350); }
    }, { threshold: 0.45 });
    first.observe(view);
  } else goTo(TOPN, false);

  addEventListener('eas:calm', () => { if (isCalm() && (painting || queue.length)) { const target = stage; stop(); goTo(target, false); } });

  caption(0);
  sync();
})();
