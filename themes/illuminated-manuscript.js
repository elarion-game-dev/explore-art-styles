// Illuminated Manuscript: the page is one leaf of a Gothic codex.
// - Every heading opens on a burnished gold initial. Burnished leaf is a mirror: it flares where the light catches it
//   and goes dark elsewhere, so the shine follows the pointer (or, with no pointer, a lamp above the reading line).
//   A switch in the hero swaps it for shell gold, which is matt and the same from every angle.
// - The outer margin holds a bar border with ivy sprays, and a creature for each section that peers in from the edge
//   of the leaf as its section arrives, then leans back as you read on.
// In calm mode, or with reduced motion, the creatures simply sit in the margin and the gold keeps one fixed light.
(() => {
  const root = document.documentElement;
  const $ = (q, el = document) => el.querySelector(q);
  const $$ = (q, el = document) => [...el.querySelectorAll(q)];
  const isCalm = () => root.dataset.calm === '1';

  // ---- pigments for the drawings ----
  const K = {
    ink: '#2b1d0e', w: '#f7f0e1', shade: '#dccfb6', blue: '#2a43a8', blueL: '#5a73c9', red: '#c4482a', redD: '#9a2e14', green: '#2f7d4f', greenL: '#5b9e6c',
    pink: '#d58a86', pinkL: '#e9b3aa', gold: '#c9973f', goldL: '#e8c674', brown: '#93633a', brownL: '#c9a27a', tan: '#dcc3a3', steel: '#b4b6b0', steelD: '#8d8f89', face: '#ead0a8',
  };
  const ST = `stroke="${K.ink}" stroke-width="1.5" stroke-linejoin="round" stroke-linecap="round"`;
  const p = (d, fill, extra = '') => `<path d="${d}" fill="${fill}" ${ST} ${extra}/>`;
  const line = (d, w = 1.2, c = K.ink, extra = '') => `<path d="${d}" fill="none" stroke="${c}" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round" ${extra}/>`;
  // A limb is a thick stroke with an ink edge: the ink drawn wider underneath, then the colour.
  const limb = (d, fill, w) => line(d, w + 3) + line(d, w, fill);
  const dot = (x, y, r, fill = K.ink, edge = false) => `<circle cx="${x}" cy="${y}" r="${r}" fill="${fill}"${edge ? ` ${ST}` : ''}/>`;
  const hi = (d) => line(d, 0.85, '#fff', 'opacity=".8"'); // white highlight lines, as painters laid them on blue and red
  const g = (cls, body) => `<g class="${cls}">${body}</g>`;
  const svg = (name, body, vb = '0 0 100 150') => `<svg class="im-beast im-${name}" viewBox="${vb}" focusable="false" aria-hidden="true">${body}</svg>`;
  const spiral = (cx, cy, r0, r1, turns, a0 = 0) => {
    let d = '';
    const n = Math.round(turns * 48);
    for (let i = 0; i <= n; i++) {
      const t = i / n;
      const a = a0 + t * turns * Math.PI * 2;
      const r = r0 + (r1 - r0) * t;
      d += `${i ? 'L' : 'M'}${(cx + r * Math.cos(a)).toFixed(1)} ${(cy + r * Math.sin(a)).toFixed(1)}`;
    }
    return d;
  };

  // ---- the creatures of the margins, all facing the text ----
  const ART = {
    // A rabbit in a blue tunic with a sword and a round shield.
    rabbit: () => svg('rabbit', `
      ${g('im-mv im-sword', `${p('M70 47 L85 8 L89 9.5 L75 49 Z', '#e4e4dc')}${line('M64 44 L80 51', 3.2, K.ink)}${line('M64.5 44.2 L79.5 50.8', 1.6, K.gold)}${limb('M73.5 50 L70.5 57', K.brown, 2.2)}${dot(70, 58.5, 2.4, K.gold, true)}`)}
      ${g('im-mv im-ears', `${p('M52 41 C54 26 60 14 67 9 C68 19 63 32 57 43 Z', K.w)}${p('M43 41 C37 27 36 13 41 4 C47 11 50 27 50 41 Z', K.w)}${p('M43.6 35 C40.8 26 40.4 17 42 10.5 C44.8 17 46.4 26 46.6 35 Z', K.pink, 'stroke="none"')}`)}
      ${p('M46 96 C40 104 40 113 43 118 L29 121 C25 122 25 126 30 126 L50 125.5 C54 124.5 54 118 52 111 Z', K.w)}
      ${p('M58 97 C60 107 60 116 58 120 L51 126 L68 126.5 C70.5 120 69 104 64.5 96 Z', K.w)}
      ${dot(68.5, 93, 5.5, K.w, true)}
      ${p('M45 56 C39 66 38 84 40 100 C48 104 58 104 66 100 C66 84 63 66 56 56 Z', K.blue)}
      ${hi('M52 61 L52.5 98')}${hi('M46 70 C47 80 46 90 44 98')}
      ${line('M40 86 C48 89.5 58 89.5 66 86', 4, K.ink)}${line('M40 86 C48 89.5 58 89.5 66 86', 2.4, K.red)}
      ${limb('M58 62 C64 58 68 53 71 49', K.w, 5.5)}
      ${p('M58 45 C57 38 49 36.5 43 38.5 C37 40.5 32.5 45 33 49 C34 53 39 56 46 56 C53 56 59 52 58 45 Z', K.w)}
      ${dot(41.5, 45, 1.8)}${dot(33.8, 48.6, 1.5, K.pink)}${line('M36 52 C38 53.5 40 53.5 41 52.5', 0.9)}
      ${line('M34 50 L25 48 M34 51 L25 52.5', 0.6)}
      ${p('M27 76 A13 13 0 1 1 53 76 A13 13 0 1 1 27 76 Z', K.red)}
      <circle cx="40" cy="76" r="8.5" fill="none" stroke="${K.goldL}" stroke-width="1.6" stroke-dasharray="1.6 2.4"/>
      ${dot(40, 76, 3.4, K.gold, true)}${hi('M32 69 C34 66.5 37 65.5 40 65.5')}`),

    // A snail with a green shell and its horns up.
    snail: () => svg('snail', `
      ${p('M90 115 C95 116 96 121 91 123 L24 123 C16 123 12 118 14 112 C15 104 17 95 21 89 C24.5 85 31 87 31.5 93 C32 101 34 107 41 110 Z', K.tan)}
      ${hi('M24 118 L84 118')}
      ${g('im-mv im-horns', `${limb('M22 90 C18 82 15 76 12 70', K.tan, 2.6)}${limb('M27 89 C28 81 29 75 30 68', K.tan, 2.6)}${dot(12, 69, 2.6, K.tan, true)}${dot(30, 67, 2.6, K.tan, true)}${dot(11.4, 68.6, 1)}${dot(29.6, 66.6, 1)}`)}
      ${dot(19.5, 96, 1.4)}${line('M15 104 C17 105.5 19 105.5 20.5 104', 0.9)}
      ${p('M36 90 A25 25 0 1 1 86 90 A25 25 0 1 1 36 90 Z', K.green)}
      <path d="${spiral(61, 90, 2, 20.5, 2.3, 1.1)}" fill="none" stroke="${K.greenL}" stroke-width="4.4" opacity=".7"/>
      <path d="${spiral(61, 90, 1, 22.5, 2.6, 0.45)}" fill="none" stroke="${K.ink}" stroke-width="1.4" stroke-linecap="round"/>
      ${hi('M43 72 C48 67 55 65 61 65.5')}${dot(61, 90, 1.6, K.gold)}`),

    // A green dragon with red wings and a knotted tail.
    dragon: () => svg('dragon', `
      ${g('im-mv im-tail', `${limb('M68 104 C90 108 96 130 80 136 C66 140 60 126 70 122 C76 120 80 126 76 130', K.green, 6)}${p('M76 130 L71 138 L80 135 Z', K.red)}`)}
      ${p('M60 64 C66 42 82 28 96 24 C92 33 95 40 90 46 C95 50 92 57 86 59 C88 65 82 69 76 67 Z', K.red)}
      ${line('M61 63 L95 25 M65 64 L89 46 M70 66 L85 58', 0.9)}
      ${limb('M50 106 L45 128', K.green, 5.5)}${limb('M62 106 L66 128', K.green, 5.5)}
      ${line('M45 128 L37 132 M45 128 L40 135 M45 128 L46 135 M66 128 L58 132 M66 128 L62 135 M66 128 L68 135', 1.4)}
      ${p('M38 70 C36 60 46 54 56 58 C70 62 77 80 73 98 C71 108 61 114 51 110 C41 106 36 90 38 70 Z', K.green)}
      ${p('M44 74 C42 86 44 100 52 106 C50 94 50 82 52 72 Z', K.goldL, 'stroke-width="1"')}
      ${line('M44 80 L51 79 M44 86 L51 86 M45 92 L51 93 M47 98 L52 99.5', 0.8)}
      ${limb('M43 66 C35 56 33 47 34 39', K.green, 8)}
      ${p('M37 41 C35 33 27 29 19 31 L8 33.5 C5.5 35 7 38.5 10.5 38.5 L17 38.5 L5 44 C6 47 12 47 20 44 C26 47 33 47 37 41 Z', K.green)}
      ${line('M6 41 L1 42.5 M3.5 41.6 L1.5 39', 1, K.red)}
      ${p('M31 31 L37 21 L36.5 32 Z', K.gold, 'stroke-width="1.1"')}
      ${dot(26, 34.5, 2.1, K.goldL, true)}${dot(25.6, 34.5, 0.9)}
      ${p('M49 68 C46 52 54 39 67 34 C64 44 69 51 65 57 C69 61 66 68 59 70 Z', K.red)}
      ${line('M50 67 L66 35 M54 68 L64 57', 0.9)}${hi('M44 62 C40 55 39 49 40 43')}`),

    // A monkey at work with a quill on a scroll.
    monkey: () => svg('monkey', `
      ${g('im-mv im-tail', limb('M70 117 C88 120 96 104 90 92 C86 86 77 88 80 96', K.brown, 3.4))}
      ${limb('M62 119 C63 128 59 132 52 133', K.brown, 6)}
      ${p('M44 78 C33 89 34 112 46 120 C58 127 73 118 72 102 C72 88 62 76 44 78 Z', K.brown)}
      <ellipse cx="53" cy="103" rx="10" ry="13" fill="${K.brownL}"/>
      ${limb('M49 119 C45 127 40 129 34 127', K.brown, 6)}
      ${p('M8 96 L34 92 L36.5 118 L10.5 122 Z', K.w)}
      ${p('M6.5 94 C6 91 9 90 10 92 L12.5 121 C13 124 9.5 124.5 9 122 Z', K.shade, 'stroke-width="1.1"')}
      ${line('M15 99 L31 96.8 M15.5 104 L31.5 101.8 M16 109 L32 106.8 M16.5 114 L28 112.4', 0.7, K.ink, 'opacity=".55"')}${line('M15 99 L22 98', 0.9, K.red)}
      ${g('im-mv im-quill', `${limb('M46 84 C40 92 32 93 27 90', K.brown, 5)}${dot(26, 90, 3, K.face, true)}${line('M25 92 L12 58', 1)}${p('M12 58 C6.5 65 9.5 76 19.5 82 C17.5 73 15.5 65 12 58 Z', K.w, 'stroke-width="1.1"')}`)}
      ${dot(58.5, 60, 4.6, K.brown, true)}${dot(58.5, 60, 2.2, K.face)}
      ${dot(46, 62, 14, K.brown, true)}
      ${p('M34 58 C34 52 42 50 45.5 54 C49.5 50 56 53.5 54.5 60 C55.5 68 50.5 74 44 74 C37 74 33 68 34 62 Z', K.face, 'stroke-width="1.1"')}
      ${dot(40.5, 61, 1.6)}${dot(48, 61, 1.6)}${dot(43, 66, 0.7)}${dot(45.4, 66, 0.7)}${line('M40 69.5 C43 71.5 46 71 47.5 69', 0.9)}`),

    // A heron on one leg, dipping its beak.
    heron: () => svg('heron', `
      ${line('M58 98 L58 145 M50 146.5 L66 146.5 M58 145 L52 148', 1.6)}${line('M63 98 L72 112 L63 117', 1.6)}
      ${p('M84 87 L99 100 L88 98.5 Z', K.blue)}
      ${p('M34 74 C42 62 70 60 84 72 C92 80 88 92 76 96 C62 100 44 96 34 74 Z', K.pink)}
      ${p('M48 72 C60 64 78 66 90 82 C94 88 92 94 86 94 C76 88 62 84 48 72 Z', K.blue)}
      ${hi('M60 74 C70 76 78 82 84 89')}${hi('M56 70 C66 70 76 74 84 81')}
      ${g('im-mv im-neck', `${limb('M41 75 C31 64 45 52 41 41 C39 35 35 31 31 30', K.pink, 7)}
        <ellipse cx="30" cy="28.5" rx="7.4" ry="5.8" fill="${K.pink}" ${ST}/>
        ${line('M34 24 C40 18 46 18 51 20', 1)}${line('M35 25.5 C41 21.5 46 22 49 23.5', 0.8)}
        ${dot(28, 27.5, 1.4)}${p('M24 26 L2 34 L24 31 Z', K.gold, 'stroke-width="1.1"')}`)}`),

    // A cat playing a fiddle.
    cat: () => svg('cat', `
      ${g('im-mv im-tail', limb('M64 116 C80 118 86 104 82 92 C80 86 85 81 90 83', K.steel, 5))}
      ${limb('M48 112 L45 136', K.steel, 7)}${limb('M60 112 L62 136', K.steel, 7)}
      <ellipse cx="42" cy="139" rx="6" ry="3.2" fill="${K.steel}" ${ST}/><ellipse cx="64" cy="139" rx="6" ry="3.2" fill="${K.steel}" ${ST}/>
      ${p('M42 70 C36 84 38 108 46 116 C54 120 64 118 66 108 C68 92 64 78 56 70 Z', K.steel)}
      ${p('M45 76 C42 88 44 102 50 108 C52 96 52 84 49 74 Z', K.w, 'stroke-width="1"')}
      ${line('M58 84 L62 86 M58 92 L63 93 M59 100 L64 100', 1, K.steelD)}
      ${p('M38 49 L35 33 L47 44 Z', K.steel)}${p('M51 44 L61 33 L60 50 Z', K.steel)}${p('M38.5 46 L37 37 L44 43.5 Z', K.pink, 'stroke="none"')}
      ${dot(48, 57, 13, K.steel, true)}
      <ellipse cx="42.5" cy="55" rx="2.6" ry="2" fill="${K.goldL}" ${ST} stroke-width="0.9"/><ellipse cx="51.5" cy="55" rx="2.6" ry="2" fill="${K.goldL}" ${ST} stroke-width="0.9"/>
      ${line('M42.5 53.4 L42.5 56.6 M51.5 53.4 L51.5 56.6', 1.1)}
      ${p('M45 60 L48.5 60 L46.75 62 Z', K.pink, 'stroke-width=".9"')}${line('M46.75 62 L46.75 63.5 M44 64.5 C45.5 65.5 46.5 65 46.75 63.5 C47 65 48 65.5 49.5 64.5', 0.9)}
      ${line('M43 62 L32 60 M43 63.5 L32 65 M51 62 L60 60.5 M51 63.5 L60 65.5', 0.6)}
      ${line('M24 88 L10 98', 4.4, K.ink)}${line('M24 88 L10 98', 2.4, K.brown)}${p('M5 96 L11 93.5 L13 100 L8 102 Z', K.brown, 'stroke-width="1"')}
      ${p('M22 74 C18 68 24 62 30 66 C34 63 41 66 40 72 C44 78 40 86 34 88 C30 92 22 92 20 86 C17 81 19 77 22 74 Z', K.gold)}
      ${line('M22 87.5 L37 68', 0.6)}${line('M24 88.5 L39 69.5', 0.6)}${dot(26, 75, 1.4)}${dot(33, 81, 1.4)}
      ${limb('M46 76 C38 80 30 82 22 88', K.steel, 4.4)}
      ${g('im-mv im-bow', `${line('M10 70 L54 96', 1.4, K.brown)}${limb('M62 82 C60 90 56 94 50 93', K.steel, 4.4)}`)}`),

    // An owl on an ivy branch.
    owl: () => svg('owl', `
      ${line('M6 122 C30 117 58 125 94 114', 3.6, K.ink)}${line('M6 122 C30 117 58 125 94 114', 1.8, K.brown)}
      ${p('M84 116 C88 108 96 108 98 112 C94 112 90 116 84 116 Z', K.green, 'stroke-width="1"')}${p('M14 121 C10 128 3 128 1 125 C5 124 9 122 14 121 Z', K.gold, 'stroke-width="1"')}
      ${p('M30 70 C26 90 30 112 50 121 C70 112 74 90 70 70 C66 56 34 56 30 70 Z', K.brown)}
      ${p('M38 82 C36 99 42 111 50 115 C58 111 64 99 62 82 C58 76 42 76 38 82 Z', K.face, 'stroke-width="1"')}
      ${line('M43 88 L45 90.5 L47 88 M53 88 L55 90.5 L57 88 M47 96 L49 98.5 L51 96 M43 104 L45 106.5 L47 104 M53 104 L55 106.5 L57 104', 0.9, K.brown)}
      ${p('M30 72 C21 88 23 104 33 114 C31 96 33 82 38 74 Z', '#7b5130')}${p('M70 72 C79 88 77 104 67 114 C69 96 67 82 62 74 Z', '#7b5130')}
      ${line('M42 120 L40 125 M46 121 L46 126 M54 121 L54 126 M58 120 L60 125', 1.4)}
      ${p('M26 50 C26 36 74 36 74 50 C76 64 66 74 50 74 C34 74 24 64 26 50 Z', K.brown)}
      ${p('M30 43 L25 29 L39 38 Z', K.brown)}${p('M70 43 L75 29 L61 38 Z', K.brown)}
      ${dot(40, 54, 9.4, '#f2e6cd', true)}${dot(60, 54, 9.4, '#f2e6cd', true)}
      ${g('im-mv im-eyes', `${dot(40, 54, 5, K.goldL, true)}${dot(60, 54, 5, K.goldL, true)}${dot(40, 54, 2.5)}${dot(60, 54, 2.5)}`)}
      ${p('M47.5 60 L52.5 60 L50 67.5 Z', K.gold, 'stroke-width="1"')}`),

    // A knight in a red surcoat, sword up, behind a blue shield.
    knight: () => svg('knight', `
      ${g('im-mv im-sword', `${p('M72.5 44 L63 6 L66.5 5 L76.5 43 Z', '#e4e4dc')}${line('M67 47 L81 42', 3.2)}${line('M67.4 46.8 L80.6 42.2', 1.6, K.gold)}${limb('M74.5 47 L76 54', K.brown, 2.2)}${dot(76.5, 56, 2.4, K.gold, true)}`)}
      ${limb('M46 104 L42 135', K.steel, 8)}${limb('M58 104 L62 135', K.steel, 8)}
      ${line('M44 112 L48 112 M43.5 120 L47.5 120 M43 128 L47 128 M57 112 L61 112 M58 120 L62 120 M58.5 128 L62.5 128', 0.7, K.steelD)}
      ${p('M43 134 L29 139 C27 141 29 142.5 32 142 L46 141 Z', K.steelD)}${p('M60 134 L57 142 L74 142 C75 139 72 137 66 135 Z', K.steelD)}
      ${p('M40 64 C36 80 34 100 36 112 L68 112 C68 98 66 80 62 64 Z', K.red)}
      ${hi('M52 68 L52 108')}${line('M37 109 L67 109', 0.9, K.goldL)}
      ${limb('M60 68 C67 63 71 57 74 50', K.steel, 6.5)}
      ${p('M40 36 C40 25 63 25 63 36 L63 59 L40 59 Z', K.steel)}
      ${line('M40 45 L56 45', 2.6)}${dot(46, 52, 0.8)}${dot(49, 52, 0.8)}${dot(52, 52, 0.8)}${line('M51.5 28 L51.5 59', 0.8, '#fff', 'opacity=".55"')}
      ${g('im-mv im-crest', p('M52 27 C47 17 56 10 63 15 C58 15 56 19 57 25 Z', K.pink, 'stroke-width="1.1"'))}
      ${p('M21 66 L47 66 L47 84 C47 96 37 104 34 106 C30 104 21 96 21 84 Z', K.blue)}
      ${dot(28, 75, 3.3, K.gold, true)}${dot(40, 75, 3.3, K.gold, true)}${dot(34, 87, 3.3, K.gold, true)}${hi('M24 70 L24 84')}`),
  };
  if (root.hasAttribute('data-im-sheet')) { window.imArt = ART; return; }

  const page = $('.page');
  if (!page) return;
  root.classList.add('im-js');

  // ---- ivy: hairline stems with gold, blue and red leaves, and gold dots with three whiskers ----
  // Drawn once into tiles that the stylesheet repeats down the bar border and across the head and foot margins.
  const leaf = (x, y, a, fill, s = 1) => `<path transform="translate(${x} ${y}) rotate(${a}) scale(${s})" d="M0 0 C1.5 -2.5 4.5 -4.5 6.5 -3 C8 -6 11.5 -5.5 11.5 -2.2 C14.6 -1.6 14.6 1.8 11.5 2.4 C11.5 5.6 8 6 6.5 3.2 C4.5 4.6 1.5 2.6 0 0 Z" fill="${fill}" stroke="${K.ink}" stroke-width=".7" stroke-linejoin="round"/>`;
  const bezant = (x, y, r = 2.1) => `<circle cx="${x}" cy="${y}" r="${r}" fill="${K.gold}" stroke="${K.ink}" stroke-width=".6"/><path d="M${x - r - 0.5} ${y - r - 0.5} l-2.4 -2.4 M${x + r + 0.5} ${y - r - 0.5} l2.4 -2.4 M${x} ${y + r + 0.6} l0 3.2" stroke="${K.ink}" stroke-width=".55" stroke-linecap="round"/>`;
  const curl = (x, y, r, dir = 1) => `<path d="M${x} ${y} c${2 * dir * r} ${-r} ${3 * dir * r} ${r} ${dir * r} ${1.6 * r} c${-dir * r * 0.9} ${0.4 * r} ${-dir * r * 1.2} ${-0.6 * r} ${-dir * r * 0.4} ${-0.9 * r}" fill="none" stroke="${K.ink}" stroke-width=".6" stroke-linecap="round"/>`;
  const stem = (d) => `<path d="${d}" fill="none" stroke="${K.ink}" stroke-width=".9" stroke-linecap="round"/>`;
  const tile = (w, h, body, fit = '') => `url("data:image/svg+xml,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}"${fit}>${body}</svg>`)}")`;
  const LEAVES = [K.gold, K.blue, K.gold, K.red, K.gold, K.green];
  // Down the outer margin: two sprays leave the bar in each 420px tile.
  const sideIvy = tile(110, 420, [
    stem('M0 30 C30 24 50 40 46 62 C43 80 64 92 84 86 C98 82 100 66 90 62'),
    leaf(22, 26, -70, LEAVES[0]), leaf(44, 44, 20, LEAVES[1]), leaf(46, 66, 160, LEAVES[2]), leaf(64, 92, 80, LEAVES[3]), leaf(84, 86, -40, LEAVES[0], 0.9),
    curl(90, 62, 4, -1), bezant(30, 52), bezant(70, 70), bezant(98, 104, 1.8),
    stem('M0 140 C26 150 34 170 24 190 C16 208 30 228 52 226 C72 224 80 206 72 196'),
    leaf(16, 148, 60, LEAVES[4]), leaf(32, 172, -30, LEAVES[5]), leaf(22, 196, 200, LEAVES[0]), leaf(40, 224, 90, LEAVES[1]), leaf(66, 222, -60, LEAVES[2], 0.9),
    curl(72, 196, 4, 1), bezant(48, 196), bezant(14, 230, 1.8),
    stem('M0 270 C40 262 70 280 66 306 C63 326 82 344 100 336'),
    leaf(26, 266, -80, LEAVES[2]), leaf(56, 278, 30, LEAVES[3]), leaf(66, 306, 150, LEAVES[0]), leaf(78, 336, 60, LEAVES[4]), leaf(100, 336, -20, LEAVES[1], 0.85),
    bezant(42, 300), bezant(88, 312, 1.8),
    stem('M0 372 C18 378 22 394 14 406'), leaf(10, 380, 40, LEAVES[0], 0.9), leaf(14, 406, 120, LEAVES[3], 0.9), bezant(34, 392, 1.8),
  ].join(''));
  // Along the head and foot: a running tendril, 300px a tile.
  const runIvy = tile(300, 60, [
    stem('M0 30 C30 10 60 50 90 30 C120 10 150 50 180 30 C210 10 240 50 270 30 C285 20 295 26 300 30'),
    leaf(22, 18, -120, LEAVES[0]), leaf(46, 36, 60, LEAVES[1]), leaf(80, 36, 120, LEAVES[2]), leaf(112, 18, -60, LEAVES[3]),
    leaf(142, 40, 70, LEAVES[0]), leaf(172, 36, 110, LEAVES[5]), leaf(202, 18, -120, LEAVES[2]), leaf(232, 38, 60, LEAVES[1]),
    leaf(262, 36, 120, LEAVES[4]), bezant(64, 14), bezant(126, 46), bezant(196, 46), bezant(250, 12), curl(36, 46, 3, 1), curl(158, 14, 3, -1),
  ].join(''));
  // Pen flourishing in red round the blue drop cap that opens the text: a scalloped frame with curls at the corners.
  const filigree = (() => {
    let d = 'M3 3H77V93H3Z';
    for (let x = 7; x < 72; x += 9) d += `M${x} 3c1.4 3.2 4.6 3.2 6 0M${x} 93c1.4 -3.2 4.6 -3.2 6 0`;
    for (let y = 8; y < 88; y += 9) d += `M3 ${y}c3.2 1.4 3.2 4.6 0 6M77 ${y}c-3.2 1.4 -3.2 4.6 0 6`;
    d += 'M3 3c5 1 7 4 6 8-1 3-4 2-3 0M77 3c-5 1-7 4-6 8 1 3 4 2 3 0M3 93c5-1 7-4 6-8-1-3-4-2-3 0M77 93c-5-1-7-4-6-8 1-3 4-2 3 0';
    return tile(80, 96, `<path d="${d}" fill="none" stroke="#b23a1b" stroke-width=".9" stroke-linecap="round"/><g fill="#b23a1b">${[[12, 14], [68, 14], [12, 82], [68, 82]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="1.2"/>`).join('')}</g>`, ' preserveAspectRatio="none"');
  })();
  root.style.setProperty('--im-filigree', filigree);
  root.style.setProperty('--im-ivy-side', sideIvy);
  root.style.setProperty('--im-ivy-run', runIvy);

  // ---- the frame of the leaf: bar border, ivy, and the sprays in the head and foot margins ----
  const frame = document.createElement('div');
  frame.className = 'im-frame';
  frame.setAttribute('aria-hidden', 'true');
  frame.innerHTML = '<div class="im-bar"></div><div class="im-ivy"></div><div class="im-run im-run-head"></div><div class="im-run im-run-foot"></div>';
  page.prepend(frame);

  // ---- gold initials: the first letter of every heading goes into a gilded square ----
  const capify = (el, cls) => {
    if (!el || el.querySelector('.im-cap')) return null;
    const node = [...el.childNodes].find((n) => n.nodeType === 3 && n.textContent.trim());
    if (!node) return null;
    const text = node.textContent;
    const i = text.search(/\S/);
    el.setAttribute('aria-label', el.textContent.trim());
    const cap = document.createElement('span');
    const ch = text[i];
    cap.className = `im-cap ${cls}${'FPQJY'.includes(ch) ? ' im-cap-d' : ''}${'MW'.includes(ch) ? ' im-cap-w' : ''}`;
    cap.setAttribute('aria-hidden', 'true');
    cap.textContent = text[i];
    const rest = document.createElement('span');
    rest.className = 'im-rest';
    rest.setAttribute('aria-hidden', 'true');
    rest.textContent = text.slice(i + 1);
    node.replaceWith(cap, rest);
    return cap;
  };
  capify($('.hero-title'), 'im-cap-hero');
  $$('.sec-title').forEach((t) => capify(t, 'im-cap-sec'));
  const caps = $$('.im-cap');

  // ---- the gilding switch: burnished leaf or shell gold ----
  const GOLD_KEY = 'eas-im-gold';
  const readGold = () => { try { return localStorage.getItem(GOLD_KEY); } catch { return null; } };
  const writeGold = (v) => { try { localStorage.setItem(GOLD_KEY, v); } catch { /* private window */ } };
  const tagline = $('.hero-tagline');
  if (tagline) {
    const sw = document.createElement('div');
    sw.className = 'im-gilding';
    sw.setAttribute('role', 'group');
    sw.setAttribute('aria-label', 'Gold on the initials');
    sw.innerHTML = '<span class="im-gilding-label">Gilding</span>'
      + '<button type="button" data-gold="leaf" aria-pressed="true" title="Leaf, laid on a raised base and polished: bright where it catches the light, dark where it does not">Burnished leaf</button>'
      + '<button type="button" data-gold="shell" aria-pressed="false" title="Powdered gold in gum, painted on: a matt, even glow from every angle">Shell gold</button>'
      + '<span class="im-gilding-hint"><span class="im-hint-mouse">Move the pointer over the gold initials</span><span class="im-hint-touch">Scroll, and the light moves across the gold</span></span>';
    tagline.after(sw);
    const set = (v) => {
      if (v === 'shell') root.dataset.gold = 'shell'; else delete root.dataset.gold;
      $$('button', sw).forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.gold === (v === 'shell' ? 'shell' : 'leaf'))));
    };
    set(readGold());
    sw.addEventListener('click', (e) => {
      const b = e.target.closest('button[data-gold]');
      if (!b) return;
      set(b.dataset.gold);
      writeGold(b.dataset.gold);
      schedule(); // back on leaf, the light was last worked out before the shell gold went on
    });
  }

  // ---- the light on the gold ----
  // Only initials on screen are lit. Each frame reads their boxes first, then writes their custom properties.
  const visible = new Set();
  let px = 0;
  let py = 0;
  let pointer = false;
  let raf = 0;
  const light = () => {
    raf = 0;
    if (isCalm() || root.dataset.gold === 'shell' || !visible.size) return;
    const list = [...visible];
    const boxes = list.map((c) => c.getBoundingClientRect());
    // With no pointer, a lamp hangs above the reading line, so the gold flares as it scrolls past.
    const lx = pointer ? px : innerWidth * 0.22;
    const ly = pointer ? py : innerHeight * 0.32;
    const reach = pointer ? 460 : innerHeight * 0.42;
    list.forEach((c, i) => {
      const r = boxes[i];
      const fx = Math.max(-0.4, Math.min(1.4, (lx - r.left) / r.width));
      const fy = Math.max(-0.4, Math.min(1.4, (ly - r.top) / r.height));
      const d = Math.hypot(lx - (r.left + r.width / 2), ly - (r.top + r.height / 2));
      const shine = 0.12 + 0.88 * Math.max(0, 1 - d / reach) ** 1.4;
      c.style.setProperty('--lx', `${(fx * 100).toFixed(1)}%`);
      c.style.setProperty('--ly', `${(fy * 100).toFixed(1)}%`);
      c.style.setProperty('--shine', shine.toFixed(3));
    });
  };
  const schedule = () => { if (!raf) raf = requestAnimationFrame(light); };
  const rest = () => caps.forEach((c) => { c.style.removeProperty('--lx'); c.style.removeProperty('--ly'); c.style.removeProperty('--shine'); });

  // ---- creatures in the margin ----
  const BEASTS = [['.hero', 'rabbit'], ['#feel', 'snail'], ['#core', 'dragon'], ['#how', 'monkey'], ['#palette', 'heron'], ['#vibe', 'cat'], ['#refs', 'owl'], ['#related', 'knight']];
  const perches = [];
  BEASTS.forEach(([sel, name]) => {
    const host = $(sel);
    if (!host || !ART[name]) return;
    const perch = document.createElement('div');
    perch.className = `im-perch im-perch-${name}`;
    perch.setAttribute('aria-hidden', 'true');
    perch.innerHTML = `<div class="im-walk">${ART[name]()}</div>`;
    host.append(perch);
    perches.push(perch);
  });

  const showAll = () => perches.forEach((p) => p.classList.add('im-near', 'im-in'));
  let near = null;
  let mid = null;
  const watch = () => {
    if (!('IntersectionObserver' in window)) { showAll(); return; }
    // A creature peeks in when its spot comes up from the bottom of the screen, steps out in the middle band,
    // and leans back once you read past it.
    near = new IntersectionObserver((es) => es.forEach((e) => e.target.classList.toggle('im-near', e.isIntersecting)), { rootMargin: '0px 0px -6% 0px' });
    mid = new IntersectionObserver((es) => es.forEach((e) => e.target.classList.toggle('im-in', e.isIntersecting)), { rootMargin: '-14% 0px -30% 0px' });
    perches.forEach((p) => { near.observe(p); mid.observe(p); });
  };
  const capIO = 'IntersectionObserver' in window ? new IntersectionObserver((es) => {
    es.forEach((e) => (e.isIntersecting ? visible.add(e.target) : visible.delete(e.target)));
    schedule();
  }) : null;

  let listening = false;
  const start = () => {
    root.classList.add('im-live');
    watch();
    caps.forEach((c) => capIO?.observe(c));
    if (listening) return;
    listening = true;
    addEventListener('pointermove', (e) => {
      if (e.pointerType === 'touch') return;
      pointer = true;
      px = e.clientX;
      py = e.clientY;
      schedule();
    }, { passive: true });
    addEventListener('scroll', schedule, { passive: true });
    addEventListener('resize', schedule);
  };
  const stop = () => {
    root.classList.remove('im-live');
    near?.disconnect();
    mid?.disconnect();
    capIO?.disconnect();
    visible.clear();
    showAll();
    rest();
  };

  if (isCalm()) showAll();
  else requestAnimationFrame(() => requestAnimationFrame(start)); // after the first paint
  addEventListener('eas:calm', (e) => {
    if (e.detail?.calm ?? isCalm()) stop();
    else { perches.forEach((p) => p.classList.remove('im-near', 'im-in')); start(); }
  });
  addEventListener('beforeprint', showAll);
})();
