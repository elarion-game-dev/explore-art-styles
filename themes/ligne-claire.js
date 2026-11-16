// Ligne Claire: the cover is drawn the way the albums were printed, on separate plates: flat colour (with the drawing
// under it in non-repro blue), flat shadows, optional Moebius hatching and the black line on top. The reader can switch
// each plate off, let distant lines fade or not, or pull the plates apart in 3D. The script also gives every panel the
// shape of its picture, so each strip of panels has one height, as on an album page.
(() => {
  const root = document.documentElement;
  const isCalm = () => root.dataset.calm === '1';
  const $ = (q, el = document) => el.querySelector(q);
  const $$ = (q, el = document) => [...el.querySelectorAll(q)];

  // 1. Panels take the proportions of their pictures (see the flex rules in the theme CSS).
  for (const m of $$('.hero-gallery img, .ref-gallery img, .loop video')) {
    const w = Number(m.getAttribute('width'));
    const h = Number(m.getAttribute('height'));
    const box = m.closest('.shot, .loop');
    if (w > 0 && h > 0 && box) box.style.setProperty('--ar', (w / h).toFixed(4));
  }

  const hero = $('.hero');
  const text = $('.hero-text');
  if (!hero || !text) return;

  // 2. The cover picture. Every shape is listed once, back to front, and the plates are made from that list:
  // f is its flat colour, k draws its outline in ink (1 far, 2 middle, 3 near), x are ink-only details,
  // dots are solid ink marks, s are its flat shadows, t is an SVG transform for all of it.
  const circ = (cx, cy, r) => `M${cx - r} ${cy}a${r} ${r} 0 1 0 ${2 * r} 0a${r} ${r} 0 1 0 ${-2 * r} 0z`;
  const ell = (cx, cy, rx, ry) => `M${cx - rx} ${cy}a${rx} ${ry} 0 1 0 ${2 * rx} 0a${rx} ${ry} 0 1 0 ${-2 * rx} 0z`;
  const ringAt = (cx, cy, R, r, a0, a1) => {
    const p = (rad, a) => `${(cx + rad * Math.cos(a * Math.PI / 180)).toFixed(1)} ${(cy + rad * Math.sin(a * Math.PI / 180)).toFixed(1)}`;
    const big = a1 - a0 > 180 ? 1 : 0;
    return `M${p(R, a0)}A${R} ${R} 0 ${big} 1 ${p(R, a1)}L${p(r, a1)}A${r} ${r} 0 ${big} 0 ${p(r, a0)}Z`;
  };
  const spokes = (cx, cy, R, r, from, to, step) => {
    const out = [];
    for (let a = from; a <= to; a += step) {
      const c = Math.cos(a * Math.PI / 180);
      const s = Math.sin(a * Math.PI / 180);
      out.push(`M${(cx + r * c).toFixed(1)} ${(cy + r * s).toFixed(1)}L${(cx + R * c).toFixed(1)} ${(cy + R * s).toFixed(1)}`);
    }
    return out;
  };
  const dashes = (list) => list.map(([x, y, w]) => `M${x} ${y}h${w}`);
  const dots = (list) => list.map(([x, y, r]) => circ(x, y, r));

  // The drawing is 1600 x 700, but the ground and sky run on to either side (x from -1700 to 3300), so a cover wider
  // than the drawing shows more desert instead of cropping the sky.
  const MESAS = [[-50, 452], [36, 452], [44, 440], [118, 440], [126, 448], [188, 448], [194, 456], [262, 456], [270, 444], [292, 438],
    [364, 438], [372, 450], [430, 450], [436, 458], [520, 458], [528, 452], [560, 452], [566, 446], [640, 446], [648, 456], [700, 456],
    [708, 462], [760, 462], [768, 450], [840, 450], [846, 444], [900, 444], [908, 454], [1010, 454], [1016, 448], [1080, 448], [1086, 458],
    [1180, 458], [1188, 442], [1260, 442], [1268, 452], [1340, 452], [1346, 446], [1420, 446], [1428, 456], [1500, 456], [1508, 448],
    [1560, 448], [1566, 456], [1642, 456]];
  const mesaRun = [-1700, 0, 1700].flatMap((dx) => MESAS.map(([x, y]) => [x + dx, y]));
  const farMesas = `M${mesaRun[0][0]} 486${mesaRun.map(([x, y]) => `L${x} ${y}`).join('')}L${mesaRun.at(-1)[0]} 486Z`;
  const farStrata = [-1700, 0, 1700].map((dx) => [[52, 447, 60], [300, 446, 60], [776, 456, 58], [1196, 450, 58]].map(([x, y, w]) => `M${x + dx} ${y}h${w}`).join(''));

  // The traveller is drawn at 730,560 and placed with one transform, so it can be moved and sized as a whole.
  const RIDER = 'translate(-89 -168) scale(1.3)';
  const SCENE = [
    { f: 'sky', d: 'M-1700 -50H3300V750H-1700Z' },
    // A ringed moon low in the sky: back of the ring, the disc, then the front of the ring.
    { t: 'translate(880 296) rotate(-12)', k: 1, d: 'M-112 0A112 19 0 0 1 -46.9 -17.3M46.9 -17.3A112 19 0 0 1 112 0' },
    { t: 'translate(880 296) rotate(-12)', f: 'moon', k: 1, d: circ(0, 0, 50),
      x: [ell(-18, -14, 9, 5), ell(14, 12, 6, 3.5), ell(-6, 24, 4, 2.5)],
      s: ['M17.1 -47A50 50 0 1 1 -47 17.1A64 64 0 0 0 17.1 -47Z'] },
    { t: 'translate(880 296) rotate(-12)', k: 1, d: 'M112 0A112 19 0 0 1 -112 0' },
    // Long clouds with flat bottoms.
    { f: 'cloud', k: 1, d: 'M1060 176C1068 160 1096 156 1112 164C1124 146 1162 140 1182 154C1200 134 1250 132 1270 150C1290 140 1330 142 1342 158C1366 152 1396 156 1410 166C1428 166 1440 170 1442 176Z' },
    { f: 'cloud', k: 1, d: 'M868 362C876 352 898 349 910 355C922 343 950 341 964 350C982 338 1016 340 1028 352C1046 350 1068 354 1076 362Z' },
    // Two more, seen only on very wide covers.
    { t: 'translate(-1420 -160)', f: 'cloud', k: 1, d: 'M868 362C876 352 898 349 910 355C922 343 950 341 964 350C982 338 1016 340 1028 352C1046 350 1068 354 1076 362Z' },
    { t: 'translate(860 70)', f: 'cloud', k: 1, d: 'M1060 176C1068 160 1096 156 1112 164C1124 146 1162 140 1182 154C1200 134 1250 132 1270 150C1290 140 1330 142 1342 158C1366 152 1396 156 1410 166C1428 166 1440 170 1442 176Z' },
    // Far mesas along the horizon.
    { f: 'far', k: 1, d: farMesas, x: farStrata },
    // The plain, whose top edge is the horizon.
    { f: 'plain', k: 1, d: 'M-1700 470H3300V750H-1700Z', dots: dots([[420, 482, 1.6], [470, 486, 1.4], [1210, 484, 1.6], [1260, 480, 1.4], [-620, 484, 1.6], [2080, 482, 1.6]]) },
    // A butte on the left, with strata.
    { f: 'butte', k: 2, d: 'M-248 530L-226 496L-204 470L-184 446L-166 420L-154 392L-140 375L-50 372L40 368L70 362L150 360L210 364L236 372L250 392L262 420L280 446L300 470L322 496L344 530Z',
      x: ['M-156 398C-120 397 -84 399 -50 398C40 402 140 396 244 400', 'M-173 430C-130 429 -90 431 -50 430C60 434 150 428 264 432',
        'M-197 462C-150 461 -100 463 -50 462C60 466 170 460 292 464', 'M-224 494C-170 493 -110 495 -50 494C70 498 190 492 318 496'],
      dots: dots([[60, 414, 1.8], [96, 418, 1.5], [150, 446, 1.8], [186, 448, 1.5], [40, 478, 1.8]]),
      s: ['M236 372L250 392L262 420L280 446L300 470L322 496L344 530H262C252 494 240 452 230 418C226 398 226 384 236 372Z'] },
    // A rock needle with a flat cap, a small dome and a pennant.
    { t: 'translate(-20 0)', f: 'spire', k: 2, d: 'M1052 548C1056 470 1064 400 1066 330C1068 290 1062 250 1070 214H1100C1104 252 1098 300 1102 340C1106 420 1112 480 1118 548Z',
      x: ['M1064 300H1084', 'M1062 380H1080', 'M1060 452H1082', 'M1066 252H1082'],
      s: ['M1084 214H1100C1104 252 1098 300 1102 340C1106 420 1112 480 1118 548H1090C1088 470 1087 400 1088 330C1088 280 1083 250 1084 214Z'] },
    { t: 'translate(-20 0)', f: 'cap', k: 2, d: 'M1030 216L1040 200L1126 198L1138 216Z', s: ['M1096 199L1126 198L1138 216H1104Z'] },
    { t: 'translate(-20 0)', f: 'house', k: 2, d: 'M1066 199A18 18 0 0 1 1102 199Z', x: ['M1080 199V191A4 4 0 0 1 1088 191V199'] },
    { t: 'translate(-20 0)', k: 2, d: 'M1084 181V146' },
    { t: 'translate(-20 0)', f: 'red', k: 2, d: 'M1084 146L1116 154L1084 162Z' },
    { k: 2, d: 'M1150 262q8 -8 16 0q8 -8 16 0M1186 238q6 -6 12 0q6 -6 12 0M1126 226q5 -5 10 0q5 -5 10 0' },
    // A colossal ring, half buried.
    { f: 'ring', k: 2, d: ringAt(1390, 562, 210, 172, 180, 360), x: [...spokes(1390, 562, 210, 172, 195, 345, 15), 'M1199 562A191 191 0 0 1 1581 562'],
      s: [ringAt(1390, 562, 210, 172, 312, 360)] },
    // Middle dunes, yellow sand, with thin lee shadows.
    { f: 'sand', k: 2, d: 'M-1700 528C-1550 514 -1400 508 -1250 518C-1100 528 -950 544 -800 534C-650 524 -450 508 -300 514C-250 516 -150 544 -50 534C120 516 250 508 380 522C500 534 600 546 720 534C840 520 940 506 1080 516C1200 526 1300 540 1440 528C1520 522 1580 518 1650 520C1750 523 1850 536 1980 534C2110 532 2250 512 2400 512C2550 512 2700 534 2850 532C3000 530 3150 518 3300 520V750H-1700Z',
      dots: dots([[300, 560, 1.6], [330, 566, 1.4], [980, 548, 1.6], [1010, 556, 1.4], [1500, 560, 1.6], [-900, 556, 1.6], [-870, 562, 1.4], [2200, 552, 1.6], [2230, 560, 1.4]]),
      s: ['M380 522C500 534 600 546 720 534C640 552 520 556 420 542C404 534 392 527 380 522Z', 'M1080 516C1200 526 1300 540 1440 528C1360 546 1240 548 1140 532C1118 526 1098 520 1080 516Z'] },
    // The near dune, orange, with Sable-style dashes and the glider's shadow.
    { f: 'dune', k: 3, d: 'M-1700 612C-1500 600 -1250 590 -1050 596C-850 602 -700 618 -500 620C-300 622 -200 620 -50 606C160 586 380 572 600 584C820 596 980 626 1180 642C1330 654 1470 648 1650 632C1800 619 1950 612 2150 616C2350 620 2550 640 2750 644C2950 648 3100 636 3300 630V750H-1700Z',
      x: dashes([[110, 650, 14], [250, 676, 12], [400, 636, 16], [520, 690, 12], [880, 668, 14], [1020, 692, 12], [1150, 676, 14], [1430, 684, 12], [1530, 664, 14], [180, 700, 12], [690, 700, 14],
        [-1450, 660, 14], [-1250, 690, 12], [-1000, 640, 16], [-800, 680, 12], [-560, 700, 14], [-350, 660, 12], [-150, 690, 14],
        [1780, 690, 12], [1950, 660, 14], [2150, 700, 12], [2400, 672, 14], [2650, 694, 12], [2900, 680, 14], [3100, 700, 12]]),
      s: [ell(872, 662, 112, 8), 'M1180 642C1330 654 1470 648 1650 632C1500 664 1330 672 1200 652Z'] },
    // Stones on the dune.
    { f: 'stone', k: 3, d: 'M1240 670C1244 652 1262 644 1282 648C1300 652 1310 664 1308 674Z', s: ['M1278 648C1298 652 1310 664 1308 674H1280C1286 664 1284 656 1278 648Z', 'M1308 674L1352 676L1306 680Z'] },
    { f: 'stone', k: 3, d: 'M1324 680C1328 670 1340 666 1352 670C1360 674 1362 680 1360 684Z', s: ['M1348 669C1358 673 1362 680 1360 684H1350C1352 678 1351 673 1348 669Z'] },
    // The traveller: a puff of dust drawn the Moebius way, then scarf, hull, engine, fin, cloak and hood.
    { t: RIDER, f: 'cloud', k: 3, d: 'M572 586C558 586 552 574 562 568C560 556 576 552 584 560C590 550 608 552 610 562C622 562 626 576 616 582C612 590 584 592 572 586Z' },
    { t: RIDER, f: 'red', k: 3, d: 'M738 530C716 520 698 532 674 520C660 513 646 516 632 510C648 526 666 528 688 538C706 544 724 542 742 538Z' },
    { t: RIDER, f: 'metal', k: 3, d: 'M632 574L792 562C806 561 816 564 818 568C816 572 806 575 792 576L640 584C632 584 628 580 632 574Z',
      x: ['M700 572L780 566'], s: ['M640 584L792 576C806 575 816 572 818 568C810 574 796 580 640 588Z'] },
    { t: RIDER, f: 'engine', k: 3, d: circ(662, 568, 17), x: [circ(662, 568, 7), 'M650 556L674 580'], s: ['M674 556A17 17 0 0 1 650 580A20 20 0 0 0 674 556Z'] },
    { t: RIDER, f: 'red', k: 3, d: 'M780 564L788 540L797 541L795 563Z' },
    { t: RIDER, f: 'cloak', k: 3, d: 'M716 568C712 552 718 536 732 530C746 526 758 534 762 550L766 566Z', x: ['M752 542C760 548 768 553 778 557'],
      s: ['M748 529C756 532 760 540 762 550L766 566H752C754 552 753 538 748 529Z'] },
    { t: RIDER, f: 'hood', k: 3, d: 'M727 531C724 517 734 507 747 509C757 511 762 521 757 531C750 536 735 537 727 531Z',
      dots: ['M744 518H756V523H744Z'], s: ['M752 511C759 515 762 523 757 531C754 533 751 534 748 534C752 527 753 518 752 511Z'] },
  ];

  let colour = '';
  let inkMask = '';
  let shadeMask = '';
  for (const it of SCENE) {
    const [a, b] = it.t ? [`<g transform="${it.t}">`, '</g>'] : ['', ''];
    let c = '';
    let m = '';
    let s = '';
    if (it.f) {
      c += `<path class="c-${it.f}" d="${it.d}"/>`;
      m += `<path d="${it.d}" fill="#000"${it.k ? ` class="k${it.k}"` : ''}/>`;
      s += `<path d="${it.d}" fill="#000"/>`;
    } else if (it.k) {
      m += `<path d="${it.d}" fill="none" class="k${it.k}"/>`;
    }
    for (const d of it.x || []) m += `<path d="${d}" fill="none" class="k${it.k || 3}"/>`;
    for (const d of it.dots || []) m += `<path d="${d}" class="q${it.k || 3}"/>`;
    for (const d of it.s || []) s += `<path d="${d}" fill="#fff"/>`;
    colour += a + c + b;
    inkMask += a + m + b;
    shadeMask += a + s + b;
  }

  const VB = 'viewBox="0 0 1600 700" preserveAspectRatio="xMidYMax slice"';
  const R = 'x="-1700" y="-50" width="5000" height="800"';
  const plate = (name, inner, tag) => `<div class="lc-plate lc-p-${name}" data-plate-sheet="${name}"><svg ${VB} aria-hidden="true" focusable="false">${inner}</svg><span class="lc-tag" data-tag="${tag}" aria-hidden="true">${tag}</span></div>`;

  const cover = document.createElement('div');
  cover.className = 'lc-cover';
  cover.setAttribute('role', 'img');
  cover.setAttribute('aria-label', 'Cover picture: a desert under a pale sky with a ringed moon, a rock needle, a half-buried ring and a rider on a glider, in flat colour with one even black line');
  cover.innerHTML = `<svg class="lc-defs" width="0" height="0" aria-hidden="true" focusable="false"><defs>
<mask id="lc-m-ink" maskUnits="userSpaceOnUse" ${R}>${inkMask}</mask>
<mask id="lc-m-shade" maskUnits="userSpaceOnUse" ${R}>${shadeMask}</mask>
<pattern id="lc-hatch" patternUnits="userSpaceOnUse" width="8" height="8" patternTransform="rotate(38)"><rect class="lc-hatch-line" width="2" height="8"/></pattern>
</defs></svg>
<div class="lc-stage"><div class="lc-stack">
${plate('colour', `<g class="lc-fills">${colour}</g><rect class="lc-blue" ${R} mask="url(#lc-m-ink)"/>`, 'Flat colour')}
${plate('shadow', `<rect class="lc-shade" ${R} mask="url(#lc-m-shade)"/>`, 'Flat shadows')}
${plate('hatch', `<rect class="lc-hatch" ${R} fill="url(#lc-hatch)" mask="url(#lc-m-shade)"/>`, 'Hatching')}
${plate('ink', `<rect class="lc-line" ${R} mask="url(#lc-m-ink)"/>`, 'Black line')}
</div></div>`;
  hero.prepend(cover);

  // 3. The plate controls, under the cover.
  const press = document.createElement('div');
  press.className = 'lc-press';
  press.setAttribute('role', 'group');
  press.setAttribute('aria-label', 'Printing plates of the cover picture');
  press.innerHTML = `<div class="lc-press-head"><p class="lc-press-title">The cover, plate by plate</p><p class="lc-press-hint">Turn the printing plates off one by one, or pull them apart, to see how the picture is built.</p></div>
<div class="lc-press-row"><div class="lc-chips">
<button type="button" class="lc-chip" data-plate="colour" aria-pressed="true"><i aria-hidden="true"></i>Flat colour</button>
<button type="button" class="lc-chip" data-plate="shadow" aria-pressed="true"><i aria-hidden="true"></i>Flat shadows</button>
<button type="button" class="lc-chip" data-plate="ink" aria-pressed="true"><i aria-hidden="true"></i>Black line</button>
<button type="button" class="lc-chip" data-plate="hatch" aria-pressed="false"><i aria-hidden="true"></i>Moebius hatching</button>
<button type="button" class="lc-chip" data-plate="depth" aria-pressed="true"><i aria-hidden="true"></i>Lines fade with distance</button>
</div>
<button type="button" class="lc-apart-btn" aria-pressed="false"><span class="lc-apart-off">Pull the plates apart</span><span class="lc-apart-on">Put them back together</span></button></div>`;
  text.after(press);

  // On a tall, narrow cover the picture is framed on the moon, the needle and the rider instead of the middle.
  // On a cover wider than the drawing it is sized to the cover's height and the desert runs on at the sides,
  // so the sky, the moon and the needle are never cut off at the top.
  const svgs = $$('.lc-plate svg', cover);
  const FIT = 0.8;
  let framed = '';
  function frame() {
    const ar = cover.clientWidth / Math.max(1, cover.clientHeight);
    const narrow = ar < 1.2;
    hero.classList.toggle('lc-narrow', narrow);
    // Pulled apart, the sheets are turned by 9 degrees, so a wider pile stands taller: scale it down to stay inside.
    hero.style.setProperty('--lc-fit', Math.min(0.56, FIT / (ar * Math.sin(Math.PI / 20) + Math.cos(Math.PI / 20))).toFixed(3));
    let vb = '0 0 1600 700';
    if (narrow) vb = '80 0 1600 700';
    else if (ar > 1600 / 700) {
      const w = Math.min(4800, Math.round(700 * ar));
      vb = `${800 - w / 2} 0 ${w} 700`;
    }
    if (vb === framed) return;
    framed = vb;
    for (const s of svgs) s.setAttribute('viewBox', vb);
  }
  frame();
  addEventListener('resize', frame);

  const state = { colour: true, shadow: true, ink: true, hatch: false, depth: true, apart: false };
  const order = ['colour', 'shadow', 'hatch', 'ink'];
  function paint() {
    hero.classList.toggle('no-colour', !state.colour);
    hero.classList.toggle('no-shadow', !state.shadow);
    hero.classList.toggle('no-ink', !state.ink);
    hero.classList.toggle('lc-hatching', state.hatch);
    hero.classList.toggle('no-depth', !state.depth);
    hero.classList.toggle('lc-apart', state.apart);
    // Stacked sheets: only the plates in use take a place in the pile, numbered from the bottom up.
    // The colour board stays in the pile even with its colour off, because it still carries the blue drawing.
    let z = 0;
    for (const name of order) {
      const sheet = $(`[data-plate-sheet="${name}"]`, cover);
      const on = name === 'colour' ? true : state[name];
      const tag = $('.lc-tag', sheet);
      if (on) tag.textContent = `${z + 1} · ${tag.dataset.tag}`;
      sheet.style.setProperty('--z', on ? z++ : z);
    }
    // The pile keeps one height however many plates are in it.
    $('.lc-stack', cover).style.setProperty('--steps', Math.max(1, z - 1));
    for (const b of $$('.lc-chip', press)) b.setAttribute('aria-pressed', String(state[b.dataset.plate]));
    $('.lc-apart-btn', press).setAttribute('aria-pressed', String(state.apart));
  }

  // 4. On arrival, the plates print one after another: the drawing in blue, then colour, shadows and the black line.
  let timers = [];
  function settle() {
    timers.forEach(clearTimeout);
    timers = [];
    hero.classList.remove('lc-printing', 'lc-print-0', 'lc-print-1', 'lc-print-2');
    paint();
  }
  function print() {
    if (isCalm()) return settle();
    hero.classList.add('lc-printing', 'lc-print-0');
    timers = [
      setTimeout(() => hero.classList.replace('lc-print-0', 'lc-print-1'), 650),
      setTimeout(() => hero.classList.replace('lc-print-1', 'lc-print-2'), 1150),
      setTimeout(settle, 1650),
    ];
  }

  for (const b of $$('.lc-chip', press)) {
    b.addEventListener('click', () => {
      settle();
      state[b.dataset.plate] = !state[b.dataset.plate];
      paint();
    });
  }
  $('.lc-apart-btn', press).addEventListener('click', () => {
    settle();
    state.apart = !state.apart;
    paint();
  });
  addEventListener('eas:calm', () => { if (isCalm()) settle(); });

  paint();
  print();
})();
