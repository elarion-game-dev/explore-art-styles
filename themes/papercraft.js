// Papercraft: the moving parts of the pop-up book.
// Every piece that stands up is hinged at its foot (or, for things hung on string, at the top). A piece lies flat until
// its section scrolls into view, then swings up on a CSS 3D hinge (rotateX), each a beat after the one before.
// The cover scene rises by itself as the page opens (a CSS animation), and its pull-tab folds it flat and stands it up again.
// In calm mode, or with reduced motion, every piece simply stands, and nothing sways.
(() => {
  const root = document.documentElement;
  const $ = (q, el = document) => el.querySelector(q);
  const $$ = (q, el = document) => [...el.querySelectorAll(q)];
  const isCalm = () => root.dataset.calm === '1';
  const page = $('.page');
  if (!page) return;
  root.classList.add('pc-js');

  // ---- shared SVG: the paper lift shadow, the sticker cut round the title, and felt for felt pieces ----
  const FELT = '../media/papercraft/tex-felt.webp';
  const holder = document.createElement('div');
  holder.setAttribute('aria-hidden', 'true');
  holder.style.cssText = 'position:absolute;width:0;height:0;overflow:hidden';
  const sticker = (id, r, blur, dy) => `<filter id="${id}" x="-8%" y="-25%" width="116%" height="160%" color-interpolation-filters="sRGB">
      <feMorphology in="SourceAlpha" operator="dilate" radius="${r}" result="fat"/>
      <feFlood flood-color="#fffdf6"/><feComposite in2="fat" operator="in" result="white"/>
      <feGaussianBlur in="fat" stdDeviation="${blur}" result="soft"/><feOffset in="soft" dx="${dy / 2}" dy="${dy}" result="off"/>
      <feFlood flood-color="#3a1606" flood-opacity=".42"/><feComposite in2="off" operator="in" result="shadow"/>
      <feMerge><feMergeNode in="shadow"/><feMergeNode in="white"/><feMergeNode in="SourceGraphic"/></feMerge>
    </filter>`;
  holder.innerHTML = `<svg width="0" height="0">
    <filter id="pc-lift" x="-12%" y="-12%" width="130%" height="135%" color-interpolation-filters="sRGB"><feDropShadow dx="1" dy="2.4" stdDeviation="1.7" flood-color="#2a0c04" flood-opacity=".38"/></filter>
    ${sticker('pc-sticker', 7, 3.5, 6)}
    ${sticker('pc-sticker-s', 4, 2.2, 4)}
    <pattern id="pc-felt" patternUnits="userSpaceOnUse" width="256" height="256"><image href="${FELT}" width="256" height="256"/></pattern>
    <pattern id="pc-dots" patternUnits="userSpaceOnUse" width="26" height="26"><circle cx="6" cy="6" r="3.2" fill="#fff" fill-opacity=".28"/><circle cx="19" cy="19" r="3.2" fill="#fff" fill-opacity=".28"/></pattern>
  </svg>`;
  document.body.append(holder);

  // ---- colours of the card, felt and cardboard ----
  const C = {
    red: '#c4321c', redD: '#93220f', redL: '#e8573a', orange: '#f29a1a', orangeD: '#cf7808', yellow: '#f7c63e', yellowD: '#dda31d', yellowL: '#fcdc72',
    green: '#6cc93c', greenD: '#3f9a27', greenL: '#93dd60', blue: '#2fc4f0', blueD: '#1590c0', blueL: '#8fe0f8', pink: '#f9a9c4', pinkD: '#de7a9e',
    plum: '#6b1a5e', plumD: '#480c3f', lilac: '#c9a7dd', lilacD: '#9a78bb', kraft: '#cc9b5f', kraftD: '#a5733a', kraftL: '#deb47e',
    cream: '#fffaf0', creamD: '#e7d8bf', string: '#6d4b2c', marker: '#43270f',
  };
  const svg = (vb, body, extra = '') => `<svg viewBox="${vb}" focusable="false" aria-hidden="true"${extra}>${body}</svg>`;
  const lift = (body) => `<g filter="url(#pc-lift)">${body}</g>`;
  const felt = (d) => `<path d="${d}" fill="url(#pc-felt)" opacity=".9"/>`;
  // A folded piece: the whole shape in its shaded colour, then the lit half on top, split down the crease.
  const fold = (whole, lit, dark, light) => lift(`<path d="${whole}" fill="${dark}"/><path d="${lit}" fill="${light}"/>`);

  const PROPS = {
    tree: () => svg('0 0 80 150', `<rect x="35" y="112" width="10" height="38" rx="2" fill="${C.kraftD}"/>
      ${fold('M40 44 76 126H4Z', 'M40 44V126H4Z', C.greenD, C.green)}
      ${fold('M40 6 68 84H12Z', 'M40 6V84H12Z', '#55b232', C.greenL)}`),
    house: () => svg('0 0 130 132', `<rect x="86" y="16" width="16" height="44" fill="${C.kraftD}"/>
      ${lift(`<rect x="18" y="56" width="94" height="76" fill="${C.yellow}"/>`)}
      <rect x="18" y="62" width="94" height="7" fill="${C.yellowD}" opacity=".7"/>
      ${fold('M5 67 65 12 125 67Z', 'M5 67 65 12V67Z', C.redD, C.red)}
      <path d="M53 132V102a12 12 0 0 1 24 0V132Z" fill="${C.plum}"/><circle cx="71" cy="116" r="2.4" fill="${C.yellow}"/>
      <rect x="27" y="80" width="18" height="18" fill="${C.blueL}"/><path d="M36 80v18M27 89h18" stroke="${C.cream}" stroke-width="2.6"/>
      <rect x="85" y="80" width="18" height="18" fill="${C.blueL}"/><path d="M94 80v18M85 89h18" stroke="${C.cream}" stroke-width="2.6"/>`),
    bush: () => svg('0 0 96 54', lift(`<path d="M2 54C2 32 18 24 30 30 34 12 58 10 64 26 76 18 94 28 94 54Z" fill="${C.greenD}"/>
      <path d="M16 54C16 40 25 36 33 40 37 28 55 26 59 38 69 34 80 40 80 54Z" fill="${C.green}"/>`)),
    cloud: () => svg('0 0 150 112', `<path d="M75 0V40" stroke="${C.string}" stroke-width="1.6"/>
      <path d="M27 104C8 104 6 80 24 76 20 54 46 44 58 58 64 36 98 34 104 58 118 46 142 58 134 80 150 86 144 106 126 104Z" fill="${C.kraftD}" transform="translate(3 4)"/>
      ${lift(`<path d="M27 104C8 104 6 80 24 76 20 54 46 44 58 58 64 36 98 34 104 58 118 46 142 58 134 80 150 86 144 106 126 104Z" fill="${C.cream}"/>`)}
      <circle cx="75" cy="43" r="2.6" fill="${C.string}"/>`),
    sun: () => {
      let rays = '';
      for (let i = 0; i < 12; i++) {
        const a = (i * Math.PI) / 6;
        const p = (r, d) => `${(75 + r * Math.cos(a + d)).toFixed(1)} ${(102 + r * Math.sin(a + d)).toFixed(1)}`;
        rays += `<path d="M${p(66, 0)}L${p(34, 0.2)}L${p(34, -0.2)}Z" fill="${i % 2 ? C.yellow : C.orange}"/>`;
      }
      return svg('0 0 150 170', `<path d="M75 0V44" stroke="${C.string}" stroke-width="1.6"/>${lift(rays)}
        ${lift(`<circle cx="75" cy="102" r="40" fill="${C.orange}"/>`)}<circle cx="75" cy="102" r="40" fill="url(#pc-felt)" opacity=".9"/>
        <circle cx="75" cy="102" r="32" fill="none" stroke="#fff1c4" stroke-width="2.6" stroke-dasharray="6 5" stroke-linecap="round"/>
        <circle cx="75" cy="47" r="2.6" fill="${C.string}"/>`);
    },
    mountains: () => svg('0 0 210 124', `${fold('M105 6 170 124H40Z', 'M105 6V124H40Z', C.lilacD, C.lilac)}
      <path d="M105 6 120 33 112 29 105 38 98 29 90 33Z" fill="${C.cream}"/>
      ${fold('M48 44 92 124H4Z', 'M48 44V124H4Z', C.blueD, C.blueL)}
      ${fold('M160 52 204 124H116Z', 'M160 52V124H116Z', C.pinkD, C.pink)}`),
    // An origami crane in plain paper, in profile: far wing, tail, neck and head, body, near wing, each face split along its crease.
    crane: () => svg('0 0 170 120', `${lift('<path d="M86 70 124 6 112 74Z" fill="#cdbb98"/><path d="M86 70 124 6 101 72Z" fill="#e2d4ba"/>')}
      ${lift('<path d="M104 78 158 22 163 27 118 84Z" fill="#c9b690"/><path d="M104 78 158 22 112 82Z" fill="#efe5d1"/>')}
      ${lift('<path d="M66 80 14 26 22 22 78 76Z" fill="#c9b690"/><path d="M66 80 14 26 74 78Z" fill="#efe5d1"/><path d="M14 26 0 44 23 31Z" fill="#bba680"/>')}
      ${lift('<path d="M50 84 86 66 122 84 86 100Z" fill="#d3c2a2"/><path d="M50 84 86 66 122 84Z" fill="#fffaf0"/>')}
      ${lift('<path d="M68 78 94 2 108 76Z" fill="#ece0c8"/><path d="M68 78 94 2 92 78Z" fill="#fffdf7"/>')}`),
    pencil: () => svg('0 0 40 160', lift(`<path d="M20 4 28 30H12Z" fill="#ecc896"/><path d="M20 4 23.2 14.5H16.8Z" fill="#3b3431"/>
      <rect x="12" y="30" width="16" height="96" fill="${C.yellow}"/><rect x="12" y="30" width="5" height="96" fill="${C.yellowL}"/><rect x="23" y="30" width="5" height="96" fill="${C.yellowD}"/>
      <rect x="11" y="126" width="18" height="13" fill="#cbc6bd"/><path d="M11 130.5h18M11 134.5h18" stroke="#99938a" stroke-width="1.3"/>
      <path d="M12 139h16v13a4 4 0 0 1-4 4h-8a4 4 0 0 1-4-4Z" fill="${C.pink}"/>`)),
    rainbow: () => {
      const bands = [C.red, C.orange, C.yellow, C.green, C.blue];
      const arcs = bands.map((c, i) => { const r = 101 - i * 15; return `<path d="M${115 - r} 128A${r} ${r} 0 0 1 ${115 + r} 128" stroke="${c}"/>`; }).join('');
      const puff = (x, flip) => lift(`<path transform="translate(${x} 0)${flip ? ' scale(-1 1)' : ''}" d="M-34 128C-36 112-24 104-14 110-10 96 10 96 14 110 22 104 34 112 32 128Z" fill="${C.cream}"/>`);
      return svg('0 0 230 130', `<g fill="none" stroke-width="15.5" filter="url(#pc-lift)">${arcs}</g>${puff(22, false)}${puff(208, true)}`);
    },
    notes: () => svg('0 0 160 152', `<path d="M42 152 58 143 40 134 58 125 40 116 58 107 44 99" stroke="${C.kraft}" stroke-width="7" fill="none" stroke-linejoin="round"/>
      <path d="M112 152 128 144 110 136 128 128 110 120 126 113" stroke="${C.kraftL}" stroke-width="7" fill="none" stroke-linejoin="round"/>
      ${lift(`<ellipse cx="44" cy="86" rx="17" ry="12.5" transform="rotate(-22 44 86)" fill="${C.plum}"/><rect x="55" y="20" width="6.5" height="66" fill="${C.plum}"/>
      <path d="M61.5 20C77 26 86 39 79 56 77 45 70 38 61.5 36Z" fill="${C.plum}"/>`)}
      ${lift(`<ellipse cx="106" cy="104" rx="14" ry="10.5" transform="rotate(-22 106 104)" fill="${C.red}"/><ellipse cx="140" cy="96" rx="14" ry="10.5" transform="rotate(-22 140 96)" fill="${C.red}"/>
      <rect x="115" y="50" width="5.5" height="54" fill="${C.red}"/><rect x="149" y="42" width="5.5" height="54" fill="${C.red}"/><path d="M115 50 154.5 42V52L115 60Z" fill="${C.red}"/>`)}`),
    castle: () => svg('0 0 160 150', `${lift(`<path d="M8 150V30H18V20H28V30H36V20H46V150Z" fill="#c78f55"/><path d="M114 150V30H124V20H134V30H142V20H152V150Z" fill="#c78f55"/>`)}
      ${lift(`<path d="M40 150V58H50V48H62V58H74V48H86V58H98V48H110V58H120V150Z" fill="${C.kraftL}"/>`)}
      <g stroke="${C.marker}" stroke-width="2" fill="none" stroke-linecap="round">
        <path d="M68 150V122Q80 104 92 122V150"/><path d="M27 52v14M133 52v14M24 92v12M136 92v12"/>
        <path d="M46 76h16M54 76v10M76 70h18M96 84h14M48 98h14M84 94v8M58 112h12M100 108h12M14 120h16M120 132h16M118 72h14"/>
      </g>
      <path d="M133 20V1" stroke="${C.marker}" stroke-width="2"/><path d="M134 2 154 8 134 14Z" fill="${C.red}"/>`),
    books: () => svg('0 0 150 98', `${lift(`<rect x="6" y="68" width="138" height="28" rx="3" fill="${C.blue}"/><rect x="120" y="72" width="20" height="20" fill="${C.cream}"/><path d="M122 77h16M122 82h16M122 87h16" stroke="${C.creamD}" stroke-width="1.4"/>`)}
      ${lift(`<rect x="16" y="42" width="120" height="27" rx="3" fill="${C.red}"/><rect x="20" y="46" width="18" height="19" fill="${C.cream}"/><path d="M22 51h14M22 56h14M22 61h14" stroke="${C.creamD}" stroke-width="1.4"/>`)}
      ${lift(`<rect x="26" y="16" width="98" height="27" rx="3" fill="${C.green}"/><rect x="102" y="20" width="18" height="19" fill="${C.cream}"/><path d="M104 25h14M104 30h14M104 35h14" stroke="${C.creamD}" stroke-width="1.4"/>`)}`),
    plane: () => svg('0 0 180 104', `<path d="M2 100C40 98 52 74 74 72" stroke="${C.cream}" stroke-width="2.4" stroke-dasharray="6 7" stroke-linecap="round" fill="none" opacity=".85"/>
      ${lift(`<path d="M176 24 50 6 98 46Z" fill="${C.cream}"/><path d="M176 24 98 46 76 74Z" fill="#d6c6ab"/><path d="M176 24 98 46 62 52Z" fill="#efe3cd"/>`)}`),
    flowers: () => {
      const flower = (x, y, c, cd) => {
        let petals = '';
        for (let i = 0; i < 6; i++) { const a = (i * Math.PI) / 3; petals += `<circle cx="${(x + 13 * Math.cos(a)).toFixed(1)}" cy="${(y + 13 * Math.sin(a)).toFixed(1)}" r="10" fill="${i % 2 ? c : cd}"/>`; }
        return lift(petals) + `<circle cx="${x}" cy="${y}" r="9" fill="${C.yellow}"/><circle cx="${x}" cy="${y}" r="5.5" fill="none" stroke="${C.orangeD}" stroke-width="1.6" stroke-dasharray="2.6 2.2"/>`;
      };
      return svg('0 0 110 132', `<path d="M32 132C32 104 26 84 32 56M76 132C76 112 80 96 76 70" stroke="${C.greenD}" stroke-width="5" fill="none" stroke-linecap="round"/>
        ${lift(`<path d="M32 108C18 104 12 92 14 84 26 86 32 96 32 108Z" fill="${C.green}"/><path d="M76 116C90 110 96 100 94 92 82 94 76 104 76 116Z" fill="${C.green}"/>`)}
        ${flower(32, 46, C.pink, C.pinkD)}${flower(76, 62, C.orange, C.orangeD)}`);
    },
  };

  // ---- the work table beside the book (only drawn on wide screens, by the stylesheet) ----
  const ball = () => {
    let strands = '';
    [[-32, 0], [28, 1], [78, 0], [-70, 1]].forEach(([a, dark]) => {
      for (let k = 0; k < 6; k++) strands += `<ellipse cx="70" cy="70" rx="${60 - k * 9}" ry="${24 + k * 5}" transform="rotate(${a + k * 4} 70 70)" stroke="${dark ? '#9c2412' : '#f07a5c'}" stroke-width="2.4" opacity=".75"/>`;
    });
    return svg('0 0 170 170', `<path d="M104 120C128 146 156 132 166 166" stroke="${C.red}" stroke-width="4" fill="none" stroke-linecap="round"/>
      <clipPath id="pc-ball"><circle cx="70" cy="70" r="62"/></clipPath>
      ${lift(`<circle cx="70" cy="70" r="62" fill="${C.red}"/>`)}<g clip-path="url(#pc-ball)" fill="none">${strands}</g>
      <circle cx="70" cy="70" r="62" fill="none" stroke="#7d1a0c" stroke-width="2" opacity=".5"/>`);
  };
  const DESK = {
    yarn: ball,
    scissors: () => svg('0 0 180 110', lift(`<path d="M84 58 172 20 176 26 92 62Z" fill="#c9ccd1"/><path d="M86 59 172 21 173 23Z" fill="#f2f3f5"/>
      <path d="M84 50 172 88 176 82 92 46Z" fill="#b8bcc2"/>
      <ellipse cx="40" cy="30" rx="27" ry="18" transform="rotate(-24 40 30)" fill="none" stroke="#f0832a" stroke-width="11"/>
      <ellipse cx="40" cy="80" rx="27" ry="18" transform="rotate(24 40 80)" fill="none" stroke="#e06f1a" stroke-width="11"/>
      <path d="M62 40 88 54M62 70 88 56" stroke="#f0832a" stroke-width="11" stroke-linecap="round"/>
      <circle cx="86" cy="55" r="5.5" fill="#8a8f97"/><circle cx="86" cy="55" r="2" fill="#5d6168"/>`)),
    tape: () => svg('0 0 160 140', `${lift(`<path d="M112 84 156 100 151 106 156 113 150 119 154 126 108 106Z" fill="rgb(238 223 183 / .92)"/>`)}
      ${lift(`<circle cx="64" cy="64" r="58" fill="#e4cf98"/>`)}
      <circle cx="64" cy="64" r="51" fill="none" stroke="#cbb27a" stroke-width="1.5" opacity=".7"/><circle cx="64" cy="64" r="44" fill="none" stroke="#cbb27a" stroke-width="1.5" opacity=".6"/>
      <circle cx="64" cy="64" r="34" fill="#f4ead4"/><circle cx="64" cy="64" r="28" fill="${C.kraft}"/>
      <circle cx="64" cy="64" r="28" fill="none" stroke="#7a5124" stroke-width="2" opacity=".45"/>`),
    pencil: PROPS.pencil,
  };
  const desk = document.createElement('div');
  desk.className = 'pc-desk';
  desk.setAttribute('aria-hidden', 'true');
  desk.innerHTML = Object.entries(DESK).map(([k, art]) => `<div class="pc-tool pc-tool-${k}">${art()}</div>`).join('');
  document.body.append(desk);

  // ---- the title: every letter cut from its own card ----
  const h1 = $('.hero-title');
  const LETTERS = [C.red, C.orange, C.green, C.blue, C.plum, C.pinkD, C.yellowD, C.blueD, C.redL, C.greenD];
  if (h1) {
    const text = h1.textContent.trim();
    h1.setAttribute('aria-label', text);
    const word = document.createElement('span');
    word.className = 'pc-word';
    word.setAttribute('aria-hidden', 'true');
    [...text].forEach((ch, i) => {
      const s = document.createElement('span');
      s.className = ch === ' ' ? 'pc-gap' : 'pc-ch pc-hinge';
      s.textContent = ch;
      s.style.setProperty('--d', String(30 + i * 26));
      s.style.setProperty('--c', LETTERS[i % LETTERS.length]);
      s.style.setProperty('--r', `${[-4, 3, -2, 4, -3, 2, -4, 3, -1, 4][i % 10]}deg`);
      word.append(s);
    });
    h1.textContent = '';
    h1.append(word);
  }

  // ---- the cover: a pop-up scene behind the title ----
  const heroText = $('.hero-text');
  const hills = (w, h, d, fill, extra = '') => svg(`0 0 ${w} ${h}`, `${lift(`<path d="${d}" fill="${fill}"/>`)}${extra}`, ' preserveAspectRatio="xMidYMax slice"');
  const pinked = (w, y, tooth) => { let d = `M0 ${y + tooth}`; for (let x = 0; x < w; x += tooth * 2) d += `L${x + tooth} ${y}L${x + tooth * 2} ${y + tooth}`; return `${d}V200H0Z`; };
  const midTop = 'C150 22 300 30 420 70S700 42 840 50 1080 108 1200 68';
  const scene = [
    ['hang pc-s-cloud1', 'cloud', 1],
    ['hang pc-s-sun', 'sun', 2],
    ['hang pc-s-cloud2', 'cloud', 3],
    ['hinge pc-back', hills(1200, 260, 'M0 260V120C90 60 190 50 290 96S480 150 560 96 760 20 880 70 1100 120 1200 80V260Z', C.pink,
      `<path d="M0 260V170C120 120 260 130 360 160S600 200 720 150 980 110 1200 150V260Z" fill="${C.lilac}" filter="url(#pc-lift)"/>`), 0],
    ['hinge pc-s-tree1', 'tree', 4],
    ['hinge pc-s-bush', 'bush', 6],
    ['hinge pc-s-house', 'house', 5],
    ['hinge pc-mid', hills(1200, 180, `M0 180V80${midTop}V180Z`, C.green,
      `<path d="M0 180V80${midTop}V180Z" fill="url(#pc-dots)"/><path d="M0 180V80${midTop}V180Z" fill="url(#pc-felt)" opacity=".75"/>
       <path d="M0 89${midTop.replace(/(\d+) (\d+)/g, (m, x, y) => `${x} ${Number(y) + 9}`)}" fill="none" stroke="${C.yellow}" stroke-width="3.2" stroke-dasharray="11 7" stroke-linecap="round"/>`), 3],
    ['hinge pc-s-tree2', 'tree', 7],
    ['hinge pc-s-flowers', 'flowers', 8],
    ['hinge pc-front', hills(1200, 200, pinked(1200, 132, 9), C.greenD), 6],
  ];
  let sceneEl = null;
  if (heroText) {
    sceneEl = document.createElement('div');
    sceneEl.className = 'pc-scene';
    sceneEl.setAttribute('aria-hidden', 'true');
    sceneEl.innerHTML = scene.map(([cls, art, d]) => {
      const [kind, ...rest] = cls.split(' ');
      return `<div class="pc-layer pc-${kind} ${rest.join(' ')}" style="--d:${d * 45}">${PROPS[art] ? PROPS[art]() : art}</div>`;
    }).join('');
    heroText.prepend(sceneEl);

    // The pull-tab: fold the cover flat, or stand it up again.
    const pull = document.createElement('button');
    pull.type = 'button';
    pull.className = 'pc-pull';
    pull.setAttribute('aria-pressed', 'false');
    pull.innerHTML = '<span class="pc-pull-label">Fold it flat</span>';
    pull.title = 'Fold the pop-up flat, or stand it up again';
    heroText.append(pull);
    pull.addEventListener('click', () => {
      const flat = !heroText.classList.contains('pc-flat');
      heroText.classList.toggle('pc-flat', flat);
      pull.setAttribute('aria-pressed', String(flat));
      $('.pc-pull-label', pull).textContent = flat ? 'Pop it up' : 'Fold it flat';
    });
  }

  // ---- each section: a cut-card sign on a hinge, with props standing beside it ----
  const STAGES = {
    feel: [['bush', 'pc-a'], ['house', 'pc-b'], ['tree', 'pc-c']],
    core: [['mountains', 'pc-a']],
    how: [['crane', 'pc-a'], ['pencil', 'pc-b']],
    palette: [['rainbow', 'pc-a']],
    vibe: [['notes', 'pc-a']],
    refs: [['castle', 'pc-a'], ['flowers', 'pc-b']],
    sources: [['books', 'pc-a']],
    related: [['plane', 'pc-a']],
  };
  const secs = $$('.page .sec');
  secs.forEach((sec) => {
    const set = STAGES[sec.id] || [];
    if (set.length) {
      const props = document.createElement('div');
      props.className = 'pc-props';
      props.setAttribute('aria-hidden', 'true');
      props.innerHTML = set.map(([art, pos], i) => `<div class="pc-prop pc-hinge pc-${art} ${pos}" style="--d:${180 + i * 120}">${PROPS[art]()}</div>`).join('');
      sec.prepend(props);
    }
    const t = $('.sec-title', sec);
    if (t) t.classList.add('pc-hinge');
  });

  // Felt swatches get a thread that shows up on them: plum on light felt, cream on dark.
  const lin = (v) => { const c = v / 255; return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4; };
  $$('.swatch').forEach((sw) => {
    const m = /^#?([0-9a-f]{6})$/i.exec(sw.style.getPropertyValue('--c').trim());
    if (!m) return;
    const n = parseInt(m[1], 16);
    const L = 0.2126 * lin(n >> 16) + 0.7152 * lin((n >> 8) & 255) + 0.0722 * lin(n & 255);
    sw.classList.add(L > 0.3 ? 'pc-light' : 'pc-dark');
  });

  // Pieces inside a section that pop up one by one: core cards, felt swatches, the cardboard screens and related cards.
  const GROUPS = ['.core-list > .core-item', '.swatches > .swatch', '.loops > .loop', '.related > .related-item'];
  const items = [];
  GROUPS.forEach((sel) => $$(sel).forEach((el, i) => { el.classList.add('pc-card'); el.style.setProperty('--d', String(80 + (i % 4) * 90)); items.push(el); }));

  // ---- popping up ----
  // A section is never transformed, so an IntersectionObserver can watch it. A folded card is: its box is only a sliver
  // at its foot, and an observer would see it late. So cards are measured by where they sit in the layout (offsetTop
  // ignores transforms), and each stands once its real top passes the same line the sections use, 88% down the view.
  let pending = items.slice();
  let ticking = false;
  const docTop = (el) => { let y = 0; for (let n = el; n; n = n.offsetParent) y += n.offsetTop; return y; };
  const stopWatching = () => { removeEventListener('scroll', onMove); removeEventListener('resize', onMove); removeEventListener('load', onMove); };
  const check = () => {
    ticking = false;
    const line = scrollY + innerHeight * 0.88;
    pending = pending.filter((el) => {
      if (docTop(el) > line) return true;
      el.classList.add('pc-up');
      return false;
    });
    if (!pending.length) stopWatching();
  };
  function onMove() { if (!ticking) { ticking = true; requestAnimationFrame(check); } }
  const standAll = () => {
    secs.forEach((s) => s.classList.add('pc-up'));
    items.forEach((el) => el.classList.add('pc-up'));
    pending = [];
    stopWatching();
  };
  if (isCalm() || !('IntersectionObserver' in window)) {
    standAll();
  } else {
    const io = new IntersectionObserver((entries) => {
      for (const e of entries) {
        if (!e.isIntersecting) continue;
        e.target.classList.add('pc-up');
        io.unobserve(e.target);
      }
    }, { rootMargin: '0px 0px -12% 0px' });
    secs.forEach((s) => io.observe(s));
    addEventListener('scroll', onMove, { passive: true });
    addEventListener('resize', onMove);
    addEventListener('load', onMove);
    onMove();
  }

  addEventListener('eas:calm', () => {
    if (!isCalm()) return;
    standAll();
    if (heroText?.classList.contains('pc-flat')) $('.pc-pull', heroText)?.click();
  });
  addEventListener('beforeprint', standAll);
})();
